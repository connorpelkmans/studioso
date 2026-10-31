-- Studyboard 1.11

-- Server time on every change
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

-- Deleted items, so other devices hear about deletions
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
  if old.kind <> 'backup' and coalesce(current_setting('studyboard.archiving', true), '') <> 'on'
     and exists (select 1 from auth.users u where u.id = old.user_id) then   -- not while the account itself is being deleted (its row is already gone)
    insert into public.studyboard_deletions (user_id, kind, id) values (old.user_id, old.kind, old.id);
  end if;
  return old;
end $$;
drop trigger if exists lean_items_deleted on public.items;
create trigger lean_items_deleted after delete on public.items
  for each row execute function public.studyboard_log_delete();

-- When something with the same id is added again
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

-- Deletion records older than 45 days are removed
create or replace function public.studyboard_purge_deletions() returns void
language sql security definer set search_path = public as $$
  delete from public.studyboard_deletions where deleted_at < now() - interval '45 days';
$$;

-- Rate limits
create table if not exists public.studyboard_rate (
  key text not null,
  bucket timestamptz not null,
  n int not null default 0,
  primary key (key, bucket)
);
alter table public.studyboard_rate enable row level security;   -- no policies: only the functions below touch it
revoke all on public.studyboard_rate from anon, authenticated;

-- Counts one use of "key" in the current time window
create or replace function public.studyboard_rate_hit(p_key text, p_max int, p_window int) returns boolean
language plpgsql volatile security definer set search_path = public as $$
declare b timestamptz := to_timestamp(floor(extract(epoch from now()) / greatest(p_window, 1)) * greatest(p_window, 1)); c int;
begin
  insert into public.studyboard_rate as r (key, bucket, n) values (left(p_key, 200), b, 1)
    on conflict (key, bucket) do update set n = r.n + 1
    returning n into c;
  return c <= p_max;
end $$;

-- The same, for the signed-in person (used by the lms-feed function with your sign-in)
create or replace function public.studyboard_rate_me(p_what text, p_max int, p_window int) returns boolean
language plpgsql volatile security definer set search_path = public as $$
declare lim int; win int;
begin
  if auth.uid() is null then return false; end if;
  case p_what
    when 'lms-feed' then lim := 60; win := 3600;
    else return false;
  end case;
  return public.studyboard_rate_hit(p_what || ':' || auth.uid()::text, lim, win);
end $$;

revoke all on function public.studyboard_rate_hit(text, int, int) from public, anon, authenticated;
revoke all on function public.studyboard_rate_me(text, int, int) from public, anon;
grant execute on function public.studyboard_rate_me(text, int, int) to authenticated;

create or replace function public.studyboard_purge_rate() returns void
language sql security definer set search_path = public as $$
  delete from public.studyboard_rate where bucket < now() - interval '2 days';
$$;

-- Calendar link cache (used by the calendar-feed function)
do $$
begin
  if to_regclass('public.calendar_feeds') is not null then
    alter table public.calendar_feeds add column if not exists cache_key text;
    alter table public.calendar_feeds add column if not exists cache_text text;
    revoke insert, update on public.calendar_feeds from authenticated;
    revoke insert (cache_key, cache_text), update (cache_key, cache_text) on public.calendar_feeds from authenticated;
    grant insert (token, user_id, options) on public.calendar_feeds to authenticated;
    grant update (options) on public.calendar_feeds to authenticated;
    update public.calendar_feeds set cache_key = null, cache_text = null
      where octet_length(cache_text) > 2000000 or char_length(cache_key) > 64;
    alter table public.calendar_feeds drop constraint if exists calendar_feeds_cache_limits;
    alter table public.calendar_feeds add constraint calendar_feeds_cache_limits
      check (octet_length(cache_text) <= 2000000 and char_length(cache_key) <= 64) not valid;
  end if;
end $$;

-- Packing away accounts nobody has used for 6 months
create table if not exists public.studyboard_archive (
  user_id uuid primary key references auth.users(id) on delete cascade,
  rows int not null,
  items jsonb not null,             -- every row, in one value that Postgres compresses
  archived_at timestamptz not null default now()
);
-- Set when an unpack found items a device had already saved again
alter table public.studyboard_archive add column if not exists kept_at timestamptz;
alter table public.studyboard_archive enable row level security;   -- no policies: only the functions below touch it
revoke all on public.studyboard_archive from anon, authenticated;

-- Packs up to p_limit accounts at a time whose last sign-in
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

-- The app calls this when it starts
create or replace function public.studyboard_restore_archive() returns int
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); a public.studyboard_archive; n int := 0;
begin
  if me is null then return 0; end if;
  select * into a from public.studyboard_archive where user_id = me;
  if not found or a.kept_at is not null then return 0; end if;
  perform set_config('studyboard.restoring', '1', true);   -- this transaction only: the plan limits don't apply to putting your own data back
  insert into public.items (user_id, kind, id, data)
    select me, x.kind, x.id, x.data from jsonb_to_recordset(a.items) as x(kind text, id text, data jsonb, updated_at timestamptz)
    on conflict (user_id, kind, id) do nothing;
  get diagnostics n = row_count;
  update public.studyboard_archive x set kept_at = now(),
    items = coalesce((select jsonb_agg(e) from jsonb_array_elements(a.items) e
                      where exists (select 1 from public.items i where i.user_id = me and i.kind = e ->> 'kind' and i.id = e ->> 'id' and i.data is distinct from e -> 'data')), '[]'::jsonb)
    where x.user_id = me;
  update public.studyboard_archive set rows = jsonb_array_length(items) where user_id = me;
  delete from public.studyboard_archive where user_id = me and jsonb_array_length(items) = 0;
  return n;
end $$;
revoke all on function public.studyboard_archive_inactive(int, int) from public, anon, authenticated;
revoke all on function public.studyboard_restore_archive() from public, anon;
grant execute on function public.studyboard_restore_archive() to authenticated;
revoke all on function public.studyboard_purge_deletions(), public.studyboard_purge_rate() from public, anon, authenticated;

-- Schedules
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

-- Delete My Account (Settings > Account and Sync > Delete My Account and Data)

-- The shared worker
create or replace function public.studyboard_delete_user_data(p_uid uuid) returns jsonb
language plpgsql security definer set search_path = public, auth, storage as $$
declare
  res jsonb := '{}'::jsonb; n bigint; g record; heir uuid; t text[];
  del text[][] := array[
    ['group_reactions','user_id'], ['group_checkins','user_id'], ['group_stats','user_id'], ['group_rsvps','user_id'],
    ['group_quiz_scores','user_id'], ['group_misses','user_id'], ['group_peer_ratings','from_user'], ['group_peer_ratings','to_user'], ['group_messages','user_id'], ['group_items','user_id'], ['group_board_ops','user_id'], ['group_board_people','user_id'], ['group_blocks','blocker_id'],
    ['group_blocks','blocked_id'], ['group_pro','user_id'], ['group_bans','user_id'], ['group_members','user_id'], ['shared_decks','owner_id'], ['shared_items','owner_id'], ['share_saves','user_id'], ['share_terms_agreements','user_id'], ['user_schools','user_id'], ['study_profiles','user_id'],
    ['study_room_people','user_id'], ['study_rooms','started_by'],
    ['capture_idem','user_id'], ['capture_inbox','user_id'], ['capture_tokens','user_id'], ['capture_email','user_id'],
    ['calsync_map','user_id'], ['calsync_accounts','user_id'], ['cloud_accounts','user_id'],
    ['reminder_queue','user_id'], ['push_subscriptions','user_id'], ['calendar_feeds','user_id'],
    ['studyboard_deletions','user_id'], ['studyboard_archive','user_id'], ['studyboard_devices','user_id'],
    ['studyboard_device_removals','user_id'], ['studyboard_usage','user_id'], ['studyboard_billing_customers','user_id'],
    ['group_suspended','user_id'], ['studyboard_founder_themes','user_id'], ['studyboard_early_codes','user_id'], ['studyboard_early_supporters','user_id'],
    ['studyboard_apple_signin','user_id'], ['studyboard_promo_redemptions','user_id'], ['studyboard_entitlements','user_id'], ['studyboard_theme_access','user_id'], ['bug_reports','user_id'], ['items','user_id']];
begin
  if p_uid is null then raise exception 'SB_NO_USER' using errcode = '22023'; end if;
  if to_regclass('public.study_groups') is not null and to_regclass('public.group_members') is not null then
    perform set_config('studyboard.group_purge', 'on', true);
    if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'study_groups' and column_name = 'deleted_at') then
      execute 'delete from public.study_groups where owner_id = $1 and deleted_at is not null' using p_uid;
    end if;
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
  if to_regclass('public.group_boards') is not null then
    update public.group_boards set created_by = null where created_by = p_uid;
  end if;
  if to_regclass('public.studyboard_trial_uses') is not null and to_regclass('public.studyboard_entitlements') is not null
     and to_regprocedure('public.plans_email_hash(text)') is not null then
    insert into public.studyboard_trial_uses (email_hash)
      select public.plans_email_hash(u.email) from auth.users u join public.studyboard_entitlements e on e.user_id = u.id
      where u.id = p_uid and e.trial_until is not null and public.plans_email_hash(u.email) is not null
    on conflict (email_hash) do nothing;
  end if;
  foreach t slice 1 in array del loop
    if to_regclass('public.' || t[1]) is not null then
      execute format('delete from public.%I where %I = $1', t[1], t[2]) using p_uid;
      get diagnostics n = row_count;
      res := jsonb_set(res, array[t[1]], to_jsonb(coalesce((res ->> t[1])::bigint, 0) + n));
    end if;
  end loop;
  -- A Founder or Early Supporter place they held goes to the next in line
  if (res ->> 'studyboard_early_supporters')::bigint > 0 and to_regprocedure('public.plans_early_fill()') is not null then perform public.plans_early_fill(); end if;
  if to_regclass('public.bug_reports') is not null then
    delete from public.bug_reports where contact_email is not null and lower(contact_email) = (select lower(u.email) from auth.users u where u.id = p_uid);
    get diagnostics n = row_count; res := jsonb_set(res, '{bug_reports}', to_jsonb(coalesce((res ->> 'bug_reports')::bigint, 0) + n));
  end if;
  if to_regclass('public.studyboard_billing_events') is not null then
    update public.studyboard_billing_events set user_id = null where user_id = p_uid;
    get diagnostics n = row_count; res := res || jsonb_build_object('studyboard_billing_events_anonymized', n);
  end if;
  -- Apple's EU reporting (supabase-apple-external.sql): the sales and tokens stay, without the account, because Apple must still
  -- receive their reports; the record of their taps goes
  if to_regclass('public.studyboard_apple_tokens') is not null then
    update public.studyboard_apple_tokens set user_id = null where user_id = p_uid;
    update public.studyboard_apple_subscriptions set user_id = null where user_id = p_uid;
    delete from public.studyboard_apple_taps where user_id = p_uid;
    get diagnostics n = row_count; res := res || jsonb_build_object('studyboard_apple_taps', n);
  end if;
  if to_regclass('public.studyboard_pro_grants') is not null then
    update public.studyboard_pro_grants set user_id = null, email = null, reason = null
      where user_id = p_uid or (email is not null and lower(email) = (select lower(u.email) from auth.users u where u.id = p_uid));
    get diagnostics n = row_count; res := res || jsonb_build_object('studyboard_pro_grants_anonymized', n);
  end if;
  if to_regclass('public.group_tasks') is not null then
    update public.group_tasks set assignee_id = case when assignee_id = p_uid then null else assignee_id end,
      created_by = case when created_by = p_uid then null else created_by end,
      updated_by = case when updated_by = p_uid then null else updated_by end,
      completed_by = case when completed_by = p_uid then null else completed_by end
      where p_uid in (assignee_id, created_by, updated_by, completed_by);
    get diagnostics n = row_count; res := res || jsonb_build_object('group_tasks_unlinked', n);
  end if;
  if to_regclass('public.group_task_lists') is not null then
    update public.group_task_lists set created_by = null where created_by = p_uid;
  end if;
  if to_regclass('public.group_reports') is not null then
    update public.group_reports set reporter_id = null where reporter_id = p_uid;
    update public.group_reports set reported_user_id = null where reported_user_id = p_uid;
  end if;
  if to_regclass('public.share_reports') is not null then
    update public.share_reports set reporter_id = null where reporter_id = p_uid;
  end if;
  if to_regclass('public.school_requests') is not null then
    update public.school_requests set user_id = null where user_id = p_uid;
  end if;
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

-- What the app calls (fallback when the delete-account Edge Function is not deployed)
create or replace function public.studyboard_delete_my_account_check() returns text
language plpgsql stable security definer set search_path = public, auth as $$
declare me uuid := auth.uid(); signed_in timestamptz; has_user boolean := false;
begin
  if me is null then return 'SB_NOT_SIGNED_IN'; end if;
  select true, u.last_sign_in_at into has_user, signed_in from auth.users u where u.id = me;
  if not coalesce(has_user, false) then return null; end if;   -- already deleted: calling again is harmless
  if signed_in is null or signed_in < now() - interval '10 minutes' or signed_in > now() + interval '1 minute' then return 'SB_REAUTH'; end if;
  if to_regclass('public.studyboard_entitlements') is not null and exists (
       select 1 from public.studyboard_entitlements e where e.user_id = me and e.source = 'stripe' and e.plan = 'pro'
         and e.will_renew and (e.pro_until is null or e.pro_until > now())) then
    return 'SB_CARD_SUBSCRIPTION';
  end if;
  if to_regclass('public.studyboard_billing_customers') is not null and exists (select 1 from public.studyboard_billing_customers c where c.user_id = me)
     and not exists (select 1 from public.studyboard_entitlements e where e.user_id = me and e.source = 'stripe'
                       and (not e.will_renew or (e.pro_until is not null and e.pro_until <= now()))) then
    return 'SB_CARD_SUBSCRIPTION';
  end if;
  return null;
end $$;
revoke all on function public.studyboard_delete_my_account_check() from public, anon;
grant execute on function public.studyboard_delete_my_account_check() to authenticated;

create or replace function public.studyboard_delete_my_account() returns void
language plpgsql security definer set search_path = public, auth, storage as $$
declare me uuid := auth.uid(); why text;
begin
  if me is null then
    raise exception 'SB_NOT_SIGNED_IN: Sign in first.' using errcode = '28000';
  end if;
  why := public.studyboard_delete_my_account_check();
  if why = 'SB_REAUTH' then
    raise exception 'SB_REAUTH: For your safety, sign in again (or enter your password), then delete your account within 10 minutes.' using errcode = '28000';
  elsif why = 'SB_CARD_SUBSCRIPTION' then
    raise exception 'SB_CARD_SUBSCRIPTION: Cancel your Studyboard Pro card subscription first (Studyboard Pro, Manage Plan), then try again.' using errcode = 'P0001';
  elsif why is not null then
    raise exception '%: Account deletion was refused.', why using errcode = 'P0001';
  end if;
  perform public.studyboard_delete_user_data(me);
  delete from auth.users where id = me;
end $$;
revoke all on function public.studyboard_delete_my_account() from public, anon;
grant execute on function public.studyboard_delete_my_account() to authenticated;
