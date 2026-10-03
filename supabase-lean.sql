-- Studyboard 1.11: Lean Sync (keeps Supabase's free plan going a long way)
-- Run this once in Supabase: SQL Editor > New query > paste everything > Run.
-- It is safe to run again. Run it after your main setup SQL (and after groups.sql and calendar-feed.sql if you use them).
--
-- What it does:
--  * Sync downloads only what changed. The server stamps every change with its own clock, and a short list of
--    deleted items (studyboard_deletions) lets your devices catch up without downloading everything again.
--  * Rate limits (studyboard_rate) so a stuck device or someone guessing invite codes can't run up your usage.
--  * The calendar link for Google or Apple Calendar is rebuilt only when something changed.
--  * Accounts not used for 6 months are packed into one compressed row (studyboard_archive) and unpacked
--    automatically the next time that person opens Studyboard.
--  * Daily clean-ups of old deletion records and rate counters.
-- The app works with or without this file. Without it, every device downloads everything each time, like before.

-- ---------- Server time on every change ----------
alter table public.items add column if not exists updated_at timestamptz not null default now();

create or replace function public.studyboard_touch() returns trigger
language plpgsql set search_path = public as $$
begin
  new.updated_at := now();   -- the server's clock, so a device with the wrong time can't hide a change
  return new;
end $$;
drop trigger if exists lean_items_touch on public.items;
create trigger lean_items_touch before insert or update on public.items
  for each row execute function public.studyboard_touch();

create index if not exists items_user_updated_idx on public.items (user_id, updated_at);

-- ---------- Deleted items, so other devices hear about deletions ----------
create table if not exists public.studyboard_deletions (
  seq bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,
  id text not null,
  deleted_at timestamptz not null default now()
);
create index if not exists studyboard_deletions_user_idx on public.studyboard_deletions (user_id, deleted_at);
create index if not exists studyboard_deletions_item_idx on public.studyboard_deletions (user_id, kind, id);
alter table public.studyboard_deletions enable row level security;
drop policy if exists "deletions own read" on public.studyboard_deletions;
create policy "deletions own read" on public.studyboard_deletions for select to authenticated using (user_id = (select auth.uid()));
revoke all on public.studyboard_deletions from anon, authenticated;
grant select on public.studyboard_deletions to authenticated;

create or replace function public.studyboard_log_delete() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if old.kind <> 'backup' and coalesce(current_setting('studyboard.archiving', true), '') <> 'on' then
    insert into public.studyboard_deletions (user_id, kind, id) values (old.user_id, old.kind, old.id);
  end if;
  return old;
end $$;
drop trigger if exists lean_items_deleted on public.items;
create trigger lean_items_deleted after delete on public.items
  for each row execute function public.studyboard_log_delete();

-- When something with the same id is added again, its old deletion record is no longer needed.
create or replace function public.studyboard_undelete() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' and new.kind <> 'backup' then
    delete from public.studyboard_deletions d where d.user_id = new.user_id and d.kind = new.kind and d.id = new.id;
  end if;
  return new;
end $$;
drop trigger if exists lean_items_undelete on public.items;
create trigger lean_items_undelete after insert on public.items
  for each row execute function public.studyboard_undelete();

-- Deletion records older than 45 days are removed. A device away longer than 30 days downloads everything once.
create or replace function public.studyboard_purge_deletions() returns void
language sql security definer set search_path = public as $$
  delete from public.studyboard_deletions where deleted_at < now() - interval '45 days';
$$;

-- ---------- Rate limits ----------
create table if not exists public.studyboard_rate (
  key text not null,
  bucket timestamptz not null,
  n int not null default 0,
  primary key (key, bucket)
);
alter table public.studyboard_rate enable row level security;   -- no policies: only the functions below touch it
revoke all on public.studyboard_rate from anon, authenticated;

-- Counts one use of "key" in the current time window. Returns false once it's over p_max uses in p_window seconds.
create or replace function public.studyboard_rate_hit(p_key text, p_max int, p_window int) returns boolean
language plpgsql volatile security definer set search_path = public as $$
declare b timestamptz := to_timestamp(floor(extract(epoch from now()) / greatest(p_window, 1)) * greatest(p_window, 1)); c int;
begin
  insert into public.studyboard_rate as r (key, bucket, n) values (left(p_key, 200), b, 1)
    on conflict (key, bucket) do update set n = r.n + 1
    returning n into c;
  return c <= p_max;
end $$;

-- The same, for the signed-in person (used by the lms-feed function with your sign-in).
create or replace function public.studyboard_rate_me(p_what text, p_max int, p_window int) returns boolean
language plpgsql volatile security definer set search_path = public as $$
begin
  if auth.uid() is null then return false; end if;
  return public.studyboard_rate_hit(left(p_what, 40) || ':' || auth.uid()::text, least(p_max, 600), greatest(p_window, 60));
end $$;

revoke all on function public.studyboard_rate_hit(text, int, int) from public, anon, authenticated;
revoke all on function public.studyboard_rate_me(text, int, int) from public, anon;
grant execute on function public.studyboard_rate_me(text, int, int) to authenticated;

create or replace function public.studyboard_purge_rate() returns void
language sql security definer set search_path = public as $$
  delete from public.studyboard_rate where bucket < now() - interval '2 days';
$$;

-- ---------- Calendar link cache (used by the calendar-feed function) ----------
do $$
begin
  if to_regclass('public.calendar_feeds') is not null then
    alter table public.calendar_feeds add column if not exists cache_key text;
    alter table public.calendar_feeds add column if not exists cache_text text;
  end if;
end $$;

-- ---------- Packing away accounts nobody has used for 6 months ----------
create table if not exists public.studyboard_archive (
  user_id uuid primary key references auth.users(id) on delete cascade,
  rows int not null,
  items jsonb not null,             -- every row, in one value that Postgres compresses
  archived_at timestamptz not null default now()
);
alter table public.studyboard_archive enable row level security;   -- no policies: only the functions below touch it
revoke all on public.studyboard_archive from anon, authenticated;

-- Packs up to p_limit accounts at a time whose last sign-in, last session refresh and last change are all older than p_days.
create or replace function public.studyboard_archive_inactive(p_days int default 180, p_limit int default 200) returns int
language plpgsql security definer set search_path = public, auth as $$
declare u uuid; done int := 0; cutoff timestamptz := now() - make_interval(days => greatest(p_days, 90)); has_sessions boolean := to_regclass('auth.sessions') is not null;
begin
  perform set_config('studyboard.archiving', 'on', true);   -- these deletions aren't sent to devices as "deleted"
  for u in
    select a.id from auth.users a
    where coalesce(a.last_sign_in_at, a.created_at) < cutoff
      and not exists (select 1 from public.studyboard_archive x where x.user_id = a.id)
      and exists (select 1 from public.items i where i.user_id = a.id)
      and not exists (select 1 from public.items i where i.user_id = a.id and i.updated_at >= cutoff)
    limit greatest(p_limit, 1)
  loop
    if has_sessions then
      if exists (select 1 from auth.sessions s where s.user_id = u and coalesce(s.refreshed_at::timestamptz, s.updated_at, s.created_at) >= cutoff) then continue; end if;
    end if;
    insert into public.studyboard_archive (user_id, rows, items)
      select u, count(*), jsonb_agg(jsonb_build_object('kind', i.kind, 'id', i.id, 'data', i.data, 'updated_at', i.updated_at))
      from public.items i where i.user_id = u;
    delete from public.items where user_id = u;
    done := done + 1;
  end loop;
  perform set_config('studyboard.archiving', '', true);
  return done;
end $$;

-- The app calls this when it starts. It unpacks your account if it was packed away, and returns how many items came back.
create or replace function public.studyboard_restore_archive() returns int
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); a public.studyboard_archive; n int := 0;
begin
  if me is null then return 0; end if;
  select * into a from public.studyboard_archive where user_id = me;
  if not found then return 0; end if;
  insert into public.items (user_id, kind, id, data)
    select me, x.kind, x.id, x.data from jsonb_to_recordset(a.items) as x(kind text, id text, data jsonb, updated_at timestamptz)
    on conflict (user_id, kind, id) do nothing;
  get diagnostics n = row_count;
  delete from public.studyboard_archive where user_id = me;
  return n;
end $$;
revoke all on function public.studyboard_archive_inactive(int, int) from public, anon, authenticated;
revoke all on function public.studyboard_restore_archive() from public, anon;
grant execute on function public.studyboard_restore_archive() to authenticated;
revoke all on function public.studyboard_purge_deletions(), public.studyboard_purge_rate() from public, anon, authenticated;

-- ---------- Schedules (needs the pg_cron extension: Database > Extensions > pg_cron) ----------
do $$
begin
  begin
    create extension if not exists pg_cron;
  exception when others then
    raise notice 'pg_cron is not available, so the clean-ups will not run on their own. Turn on pg_cron in Database > Extensions and run this file again.';
    return;
  end;
  perform cron.unschedule(jobid) from cron.job where jobname in ('studyboard-lean-daily', 'studyboard-archive-monthly');
  perform cron.schedule('studyboard-lean-daily', '17 4 * * *', 'select public.studyboard_purge_deletions(); select public.studyboard_purge_rate();');
  perform cron.schedule('studyboard-archive-monthly', '43 4 2 * *', 'select public.studyboard_archive_inactive(180, 500);');
end $$;
