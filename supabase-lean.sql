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
-- It also adds the "Delete My Account" function (studyboard_delete_my_account) that the in-app account deletion calls.
-- That part is required for a public launch. Sync itself works with or without this file (without it, every device
-- downloads everything each time, like before).

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

-- ---------- Delete My Account (Settings > Account and Sync > Delete My Account and Data) ----------
-- Permanently deletes the signed-in person's account and everything stored for it. The rules (also shown in the app, the
-- privacy policy and STORE-READINESS.md):
--   * Their own data is deleted: synced items, deletion log, archive, devices, device-removal log, plan, usage, billing link
--     (the Stripe customer link, not Stripe's own records), reminders, push devices, calendar links, profile, shared decks,
--     bug reports (and the contact email on them), rate counters.
--   * Study groups: if the person owns a group and someone else is a member, ownership moves to the longest-standing other
--     member (the group carries on). If nobody else is in it, the group and its content are deleted.
--   * What the person wrote in groups (messages, items, quiz scores, RSVPs, reactions, check-ins, stats) is deleted with the account.
--   * Reports they made or that were made about them (group_reports) stay for safety but lose the link to the account
--     (reporter_id and reported_user_id become null by the foreign keys).
--   * Payment bookkeeping that must be kept (studyboard_billing_events, studyboard_pro_grants) is anonymized: the user id,
--     email and free-text reason are removed; only event ids, dates and plan facts remain.
--   * Uploaded files in the studioso-files bucket (<uid>/...) must be deleted through the Storage API (Supabase does not
--     allow deleting storage rows from SQL). The delete-account Edge Function does that with the service role; the app falls
--     back to deleting them with the person's own sign-in. The block below only sweeps up what SQL is allowed to.
-- It can only ever act on the caller (auth.uid()), does nothing for anonymous visitors, and is safe to call twice.
-- It does NOT cancel a Pro subscription at Stripe, the App Store or Google Play (the delete-account Edge Function cancels Stripe).

-- The shared worker. Service role only (the Edge Function) and the caller-bound wrapper below. Returns what it removed, by table.
create or replace function public.studyboard_delete_user_data(p_uid uuid) returns jsonb
language plpgsql security definer set search_path = public, auth, storage as $$
declare
  res jsonb := '{}'::jsonb; n bigint; g record; heir uuid; t text[];
  -- table, column: rows deleted outright (explicit so it works even before the auth row goes)
  del text[][] := array[
    ['group_reactions','user_id'], ['group_checkins','user_id'], ['group_stats','user_id'], ['group_rsvps','user_id'],
    ['group_quiz_scores','user_id'], ['group_messages','user_id'], ['group_items','user_id'], ['group_blocks','blocker_id'],
    ['group_blocks','blocked_id'], ['group_members','user_id'], ['shared_decks','owner_id'], ['study_profiles','user_id'],
    ['study_room_people','user_id'], ['study_rooms','started_by'],
    ['reminder_queue','user_id'], ['push_subscriptions','user_id'], ['calendar_feeds','user_id'],
    ['studyboard_deletions','user_id'], ['studyboard_archive','user_id'], ['studyboard_devices','user_id'],
    ['studyboard_device_removals','user_id'], ['studyboard_usage','user_id'], ['studyboard_billing_customers','user_id'],
    ['studyboard_entitlements','user_id'], ['bug_reports','user_id'], ['items','user_id']];
begin
  if p_uid is null then raise exception 'SB_NO_USER' using errcode = '22023'; end if;
  -- Groups they own: hand over to the longest-standing other member, or delete the group when nobody else is in it.
  if to_regclass('public.study_groups') is not null and to_regclass('public.group_members') is not null then
    n := 0;
    for g in select id from public.study_groups where owner_id = p_uid loop
      select m.user_id into heir from public.group_members m where m.group_id = g.id and m.user_id <> p_uid order by m.joined_at, m.user_id limit 1;
      if heir is null then
        delete from public.study_groups where id = g.id;
      else
        update public.study_groups set owner_id = heir where id = g.id;
        update public.group_members set role = 'owner' where group_id = g.id and user_id = heir;
        n := n + 1;
      end if;
    end loop;
    res := res || jsonb_build_object('groups_transferred', n);
  end if;
  foreach t slice 1 in array del loop
    if to_regclass('public.' || t[1]) is not null then
      execute format('delete from public.%I where %I = $1', t[1], t[2]) using p_uid;
      get diagnostics n = row_count;
      res := jsonb_set(res, array[t[1]], to_jsonb(coalesce((res ->> t[1])::bigint, 0) + n));
    end if;
  end loop;
  -- Bug reports sent while signed out that left this account's email as the contact address
  if to_regclass('public.bug_reports') is not null then
    delete from public.bug_reports where contact_email is not null and lower(contact_email) = (select lower(u.email) from auth.users u where u.id = p_uid);
    get diagnostics n = row_count; res := jsonb_set(res, '{bug_reports}', to_jsonb(coalesce((res ->> 'bug_reports')::bigint, 0) + n));
  end if;
  -- Payment and grant bookkeeping we must keep: anonymize it instead of deleting it.
  if to_regclass('public.studyboard_billing_events') is not null then
    update public.studyboard_billing_events set user_id = null where user_id = p_uid;
    get diagnostics n = row_count; res := res || jsonb_build_object('studyboard_billing_events_anonymized', n);
  end if;
  if to_regclass('public.studyboard_pro_grants') is not null then
    update public.studyboard_pro_grants set user_id = null, email = null, reason = null
      where user_id = p_uid or (email is not null and lower(email) = (select lower(u.email) from auth.users u where u.id = p_uid));
    get diagnostics n = row_count; res := res || jsonb_build_object('studyboard_pro_grants_anonymized', n);
  end if;
  -- Reports made by or about them stay (safety) without the link to the account.
  if to_regclass('public.group_reports') is not null then
    update public.group_reports set reporter_id = null where reporter_id = p_uid;
    update public.group_reports set reported_user_id = null where reported_user_id = p_uid;
  end if;
  -- Rate counters whose key contains their id
  foreach t slice 1 in array array[['studyboard_rate','key'], ['studyboard_plan_rate','key']] loop
    if to_regclass('public.' || t[1]) is not null then
      execute format('delete from public.%I where %I like $1', t[1], t[2]) using '%:' || p_uid::text;
    end if;
  end loop;
  begin
    if to_regclass('storage.objects') is not null then
      delete from storage.objects where bucket_id = 'studioso-files' and split_part(name, '/', 1) = p_uid::text;
      get diagnostics n = row_count; res := res || jsonb_build_object('storage_rows', n);
    end if;
  exception when others then
    raise notice 'Uploaded files were not deleted from SQL (%). They are removed through the Storage API instead.', sqlerrm;
  end;
  return res;
end $$;
revoke all on function public.studyboard_delete_user_data(uuid) from public, anon, authenticated;
do $$ begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant execute on function public.studyboard_delete_user_data(uuid) to service_role;
  end if;
end $$;

-- What the app calls (fallback when the delete-account Edge Function is not deployed). Acts on the caller only.
create or replace function public.studyboard_delete_my_account() returns void
language plpgsql security definer set search_path = public, auth, storage as $$
declare me uuid := auth.uid();
begin
  if me is null then
    raise exception 'SB_NOT_SIGNED_IN: Sign in first.' using errcode = '28000';
  end if;
  perform public.studyboard_delete_user_data(me);
  delete from auth.users where id = me;
end $$;
revoke all on function public.studyboard_delete_my_account() from public, anon;
grant execute on function public.studyboard_delete_my_account() to authenticated;
