-- Studyboard 1.11: Plans (Free and Pro)
-- Run this once in Supabase: SQL Editor > New query > paste everything > Run.
-- It is safe to run again: it only adds what is missing, refreshes the rules, and never changes values you edited.
--
-- Nothing here blocks anyone until you turn the paywall on (the "paywall" row in studyboard_config).
-- While it is false, every check below lets everything through, exactly like before.
--
-- What it adds:
--  * studyboard_config        prices, limits and switches. Everyone can read it; only you (the SQL Editor or the service role) can change it.
--  * studyboard_entitlements  who has Pro and until when. You can read your own row; only the billing-webhook function writes it.
--  * studyboard_devices       the devices signed in to each account (free plan: up to 3).
--  * studyboard_usage         a small running total of each account's synced data and files, kept up to date by triggers.
--  * Limit checks on your data table, file storage and study groups, and a daily clean-up of old group messages on free groups.
-- All the triggers are named plans_... so they never clash with other setup files.

-- ---------- Settings: prices, limits and switches ----------
create table if not exists public.studyboard_config (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.studyboard_config enable row level security;
drop policy if exists "config readable" on public.studyboard_config;
create policy "config readable" on public.studyboard_config for select to anon, authenticated using (true);
revoke all on public.studyboard_config from anon, authenticated;
grant select on public.studyboard_config to anon, authenticated;

-- Starting values. "on conflict do nothing" keeps anything you changed when you run this file again.
-- A null limit means "no limit".
insert into public.studyboard_config (key, value) values
  ('paywall', 'false'),
  ('prices', '{"monthly": "$2.99", "yearly": "$19.99", "trialDays": 7, "currency": "USD"}'),
  ('limits', '{"free": {"devices": 3, "fileMB": 100, "dataMB": 25, "groupMembers": 30, "groupMsgDays": 120, "cloudBackupDays": 0},
               "pro":  {"devices": null, "fileMB": 10240, "dataMB": 250, "groupMembers": 100, "groupMsgDays": null, "cloudBackupDays": 30}}'),
  ('checkout_url_monthly', '""'),
  ('checkout_url_yearly', '""'),
  ('manage_url', '""'),
  ('app_trial', 'false'),
  ('item_purchases', 'false'),
  ('features', '{"insights": false, "ai_credits": false}')
on conflict (key) do nothing;

-- ---------- Who has Pro ----------
create table if not exists public.studyboard_entitlements (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan text not null default 'free' check (plan in ('free', 'pro', 'lifetime')),
  pro_until timestamptz,             -- Pro ends after this (null with plan 'pro' means no end date)
  trial_until timestamptz,           -- a free trial ends after this (set once, so a trial can't be repeated)
  source text check (source in ('stripe', 'apple', 'google', 'promo', 'lifetime')),
  external_id text,                  -- the Stripe customer id, or the RevenueCat app user id
  will_renew boolean not null default true,
  updated_at timestamptz not null default now()
);
alter table public.studyboard_entitlements add column if not exists will_renew boolean not null default true;
create index if not exists studyboard_entitlements_external_idx on public.studyboard_entitlements (external_id);
alter table public.studyboard_entitlements enable row level security;
drop policy if exists "entitlement own read" on public.studyboard_entitlements;
create policy "entitlement own read" on public.studyboard_entitlements for select to authenticated using (user_id = (select auth.uid()));
revoke all on public.studyboard_entitlements from anon, authenticated;
grant select on public.studyboard_entitlements to authenticated;

-- ---------- Helpers ----------
create or replace function public.studyboard_paywall() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select value = 'true'::jsonb from public.studyboard_config where key = 'paywall'), false)
$$;

create or replace function public.studyboard_is_pro(uid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.studyboard_entitlements e
    where e.user_id = uid
      and (e.plan = 'lifetime'
           or (e.plan = 'pro' and (e.pro_until is null or e.pro_until > now()))
           or e.trial_until > now()))
$$;

-- One limit for one account, from the "limits" row. Null means no limit.
create or replace function public.studyboard_limit(uid uuid, name text) returns bigint
language plpgsql stable security definer set search_path = public as $$
declare
  tier text := case when public.studyboard_is_pro(uid) then 'pro' else 'free' end;
  defaults constant jsonb := '{"free": {"devices": 3, "fileMB": 100, "dataMB": 25, "groupMembers": 30, "groupMsgDays": 120, "cloudBackupDays": 0},
                               "pro":  {"devices": null, "fileMB": 10240, "dataMB": 250, "groupMembers": 100, "groupMsgDays": null, "cloudBackupDays": 30}}';
  lim jsonb := coalesce((select value from public.studyboard_config where key = 'limits'), defaults);
  v jsonb;
begin
  v := case when lim -> tier ? name then lim -> tier -> name else defaults -> tier -> name end;
  if v is null or jsonb_typeof(v) <> 'number' then return null; end if;
  return (v #>> '{}')::numeric::bigint;
end $$;

revoke all on function public.studyboard_paywall(), public.studyboard_is_pro(uuid), public.studyboard_limit(uuid, text) from public, anon, authenticated;
grant execute on function public.studyboard_paywall() to anon, authenticated;

-- ---------- Devices ----------
create table if not exists public.studyboard_devices (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  device_id text not null check (char_length(device_id) between 8 and 80),
  name text not null default '' check (char_length(name) <= 80),
  platform text not null default 'web' check (platform in ('web', 'app', 'desktop', 'ios', 'android')),
  last_seen timestamptz not null default now(),
  created_at timestamptz not null default now(),
  primary key (user_id, device_id)
);
alter table public.studyboard_devices enable row level security;
drop policy if exists "device own read" on public.studyboard_devices;
create policy "device own read" on public.studyboard_devices for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists "device own insert" on public.studyboard_devices;
create policy "device own insert" on public.studyboard_devices for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists "device own update" on public.studyboard_devices;
create policy "device own update" on public.studyboard_devices for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists "device own delete" on public.studyboard_devices;
create policy "device own delete" on public.studyboard_devices for delete to authenticated using (user_id = (select auth.uid()));
revoke all on public.studyboard_devices from anon;
revoke truncate, references, trigger on public.studyboard_devices from authenticated;
grant select, insert, update, delete on public.studyboard_devices to authenticated;

-- A 4th device on the free plan is turned away (only while the paywall is on). The app shows the devices so you can remove one.
create or replace function public.plans_device_limit() returns trigger
language plpgsql security definer set search_path = public as $$
declare lim bigint;
begin
  if not public.studyboard_paywall() then return new; end if;
  -- An upsert of a device that's already there is just an update of last_seen.
  if exists (select 1 from public.studyboard_devices where user_id = new.user_id and device_id = new.device_id) then return new; end if;
  lim := public.studyboard_limit(new.user_id, 'devices');
  if lim is not null and (select count(*) from public.studyboard_devices where user_id = new.user_id) >= lim then
    raise exception 'SB_DEVICE_LIMIT: The free plan syncs on up to % devices. Remove one you don''t use anymore, or go Pro for unlimited devices.', lim
      using errcode = 'P0001';
  end if;
  return new;
end $$;
drop trigger if exists plans_device_limit on public.studyboard_devices;
create trigger plans_device_limit before insert on public.studyboard_devices for each row execute function public.plans_device_limit();

-- ---------- Usage totals (kept by triggers, so checks never have to add everything up) ----------
create table if not exists public.studyboard_usage (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data_bytes bigint not null default 0,
  file_bytes bigint not null default 0,
  updated_at timestamptz not null default now()
);
alter table public.studyboard_usage enable row level security;
drop policy if exists "usage own read" on public.studyboard_usage;
create policy "usage own read" on public.studyboard_usage for select to authenticated using (user_id = (select auth.uid()));
revoke all on public.studyboard_usage from anon, authenticated;
grant select on public.studyboard_usage to authenticated;

create or replace function public.plans_add_usage(uid uuid, d_data bigint, d_file bigint) returns void
language sql security definer set search_path = public as $$
  insert into public.studyboard_usage as u (user_id, data_bytes, file_bytes, updated_at)
  values (uid, greatest(d_data, 0), greatest(d_file, 0), now())
  on conflict (user_id) do update
    set data_bytes = greatest(u.data_bytes + d_data, 0), file_bytes = greatest(u.file_bytes + d_file, 0), updated_at = now()
$$;
revoke all on function public.plans_add_usage(uuid, bigint, bigint) from public, anon, authenticated;

-- ---------- Synced data limit (public.items) ----------
-- Backups (kind 'backup') don't count here; they follow the online backup rules instead.
create or replace function public.plans_items_quota() returns trigger
language plpgsql security definer set search_path = public as $$
declare lim bigint; used bigint; delta bigint;
begin
  if new.kind = 'backup' or not public.studyboard_paywall() then return new; end if;
  if tg_op = 'INSERT' then
    -- An upsert of an item that's already there becomes an update, which is checked on its own.
    if exists (select 1 from public.items where user_id = new.user_id and kind = new.kind and id = new.id) then return new; end if;
    delta := pg_column_size(new.data);
  else
    delta := pg_column_size(new.data) - pg_column_size(old.data);
  end if;
  if delta <= 0 then return new; end if;   -- shrinking or deleting is always fine
  lim := public.studyboard_limit(new.user_id, 'dataMB');
  if lim is null then return new; end if;
  used := coalesce((select data_bytes from public.studyboard_usage where user_id = new.user_id), 0);
  if used + delta > lim * 1048576 then
    raise exception 'SB_DATA_LIMIT: Your synced data is over the % MB storage limit of the free plan. Delete some old items, or go Pro for more room.', lim
      using errcode = 'P0001';
  end if;
  return new;
end $$;

create or replace function public.plans_items_usage() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op in ('UPDATE', 'DELETE') and old.kind <> 'backup' then perform public.plans_add_usage(old.user_id, -pg_column_size(old.data), 0); end if;
  if tg_op in ('INSERT', 'UPDATE') and new.kind <> 'backup' then perform public.plans_add_usage(new.user_id, pg_column_size(new.data), 0); end if;
  return null;
end $$;

do $$
begin
  if to_regclass('public.items') is null then
    raise notice 'public.items not found: run the main setup SQL first, then run this file again for the data limit.';
    return;
  end if;
  execute 'drop trigger if exists plans_items_quota on public.items';
  execute 'create trigger plans_items_quota before insert or update of data on public.items for each row execute function public.plans_items_quota()';
  execute 'drop trigger if exists plans_items_usage on public.items';
  execute 'create trigger plans_items_usage after insert or update of data or delete on public.items for each row execute function public.plans_items_usage()';
  -- Count what is already there (recounted each time this file runs).
  insert into public.studyboard_usage (user_id, data_bytes, updated_at)
    select i.user_id, sum(pg_column_size(i.data)), now() from public.items i
    where i.kind <> 'backup' and exists (select 1 from auth.users u where u.id = i.user_id) group by i.user_id
  on conflict (user_id) do update set data_bytes = excluded.data_bytes, updated_at = now();
end $$;

-- ---------- File storage limit (the studioso-files bucket) ----------
-- Files are stored under "<your user id>/...", so the first folder says whose file it is.
create or replace function public.plans_object_owner(p_name text) returns uuid
language sql immutable set search_path = public as $$
  select case when split_part(p_name, '/', 1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
              then split_part(p_name, '/', 1)::uuid end
$$;

create or replace function public.plans_storage_quota() returns trigger
language plpgsql security definer set search_path = public as $$
declare uid uuid; lim bigint; used bigint; delta bigint;
begin
  if new.bucket_id <> 'studioso-files' or not public.studyboard_paywall() then return new; end if;
  uid := public.plans_object_owner(new.name);
  if uid is null then return new; end if;
  delta := coalesce((new.metadata ->> 'size')::bigint, 0) - case when tg_op = 'UPDATE' then coalesce((old.metadata ->> 'size')::bigint, 0) else 0 end;
  if delta <= 0 then return new; end if;
  lim := public.studyboard_limit(uid, 'fileMB');
  if lim is null then return new; end if;
  used := coalesce((select file_bytes from public.studyboard_usage where user_id = uid), 0);
  if used + delta > lim * 1048576 then
    raise exception 'SB_STORAGE_LIMIT: You''ve used your % MB of file storage (storage limit). Delete some files, or go Pro for more room.', lim
      using errcode = 'P0001';
  end if;
  return new;
end $$;

create or replace function public.plans_storage_usage() returns trigger
language plpgsql security definer set search_path = public as $$
declare uid uuid;
begin
  if tg_op in ('UPDATE', 'DELETE') and old.bucket_id = 'studioso-files' then
    uid := public.plans_object_owner(old.name);
    if uid is not null and exists (select 1 from auth.users where id = uid) then perform public.plans_add_usage(uid, 0, -coalesce((old.metadata ->> 'size')::bigint, 0)); end if;
  end if;
  if tg_op in ('INSERT', 'UPDATE') and new.bucket_id = 'studioso-files' then
    uid := public.plans_object_owner(new.name);
    if uid is not null and exists (select 1 from auth.users where id = uid) then perform public.plans_add_usage(uid, 0, coalesce((new.metadata ->> 'size')::bigint, 0)); end if;
  end if;
  return null;
end $$;

-- Some Supabase projects don't let the SQL Editor add triggers to storage tables. If so, this part is skipped
-- with a notice, and the app's own check (before each upload) still keeps free accounts to their storage.
do $$
begin
  if to_regclass('storage.objects') is null then return; end if;
  begin
    execute 'drop trigger if exists plans_storage_quota on storage.objects';
    execute 'create trigger plans_storage_quota before insert or update of metadata on storage.objects for each row execute function public.plans_storage_quota()';
    execute 'drop trigger if exists plans_storage_usage on storage.objects';
    execute 'create trigger plans_storage_usage after insert or update of metadata or delete on storage.objects for each row execute function public.plans_storage_usage()';
  exception when insufficient_privilege then
    raise notice 'Skipped the file storage triggers (no permission on storage.objects). The app still checks storage before uploads.';
  end;
  insert into public.studyboard_usage (user_id, file_bytes, updated_at)
    select public.plans_object_owner(o.name), sum(coalesce((o.metadata ->> 'size')::bigint, 0)), now() from storage.objects o
    where o.bucket_id = 'studioso-files' and exists (select 1 from auth.users u where u.id = public.plans_object_owner(o.name))
    group by 1
  on conflict (user_id) do update set file_bytes = excluded.file_bytes, updated_at = now();
end $$;

-- ---------- Study groups: size and message history ----------
-- A group's size follows its owner's plan: 30 members on Free, 100 on Pro (join_group in groups.sql also stops at 100).
create or replace function public.plans_group_member_limit() returns trigger
language plpgsql security definer set search_path = public as $$
declare owner uuid; lim bigint; pro_lim bigint;
begin
  if not public.studyboard_paywall() then return new; end if;
  select g.owner_id into owner from public.study_groups g where g.id = new.group_id;
  if owner is null then return new; end if;
  lim := public.studyboard_limit(owner, 'groupMembers');
  if lim is not null and (select count(*) from public.group_members where group_id = new.group_id) >= lim then
    select (value -> 'pro' ->> 'groupMembers')::bigint into pro_lim from public.studyboard_config where key = 'limits';
    raise exception 'This group is full (% members).%', lim,
      case when public.studyboard_is_pro(owner) then '' else ' The group owner can go Pro for up to ' || coalesce(pro_lim::text, 'unlimited') || ' members.' end
      using errcode = 'P0001';
  end if;
  return new;
end $$;

do $$
begin
  if to_regclass('public.group_members') is null then
    raise notice 'Study group tables not found: run groups.sql first, then run this file again for the group limits.';
    return;
  end if;
  execute 'drop trigger if exists plans_group_member_limit on public.group_members';
  execute 'create trigger plans_group_member_limit before insert on public.group_members for each row execute function public.plans_group_member_limit()';
end $$;

-- Deletes messages older than the owner's plan allows (120 days on Free). Does nothing while the paywall is off.
create or replace function public.studyboard_prune_group_messages() returns integer
language plpgsql security definer set search_path = public as $$
declare n integer := 0;
begin
  if not public.studyboard_paywall() or to_regclass('public.group_messages') is null then return 0; end if;
  with gone as (
    delete from public.group_messages m
    using public.study_groups g
    where m.group_id = g.id
      and public.studyboard_limit(g.owner_id, 'groupMsgDays') is not null
      and m.created_at < now() - make_interval(days => public.studyboard_limit(g.owner_id, 'groupMsgDays')::int)
    returning 1)
  select count(*) into n from gone;
  return n;
end $$;
revoke all on function public.studyboard_prune_group_messages() from public, anon, authenticated;

-- Run the clean-up every night at 4:17 (UTC), if pg_cron is available in your project.
do $$
begin
  begin
    create extension if not exists pg_cron;
  exception when others then
    raise notice 'pg_cron is not available, so old group messages are not cleaned up automatically. You can run: select public.studyboard_prune_group_messages();';
  end;
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule(jobid) from cron.job where jobname = 'studyboard-prune-group-messages';
    perform cron.schedule('studyboard-prune-group-messages', '17 4 * * *', 'select public.studyboard_prune_group_messages()');
  end if;
end $$;

-- ---------- Free trial started in the app (no card), once per account ----------
-- Only works when the "app_trial" row is true. Store trials (Stripe, App Store, Google Play) don't need this.
create or replace function public.studyboard_start_trial() returns timestamptz
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); days int; until timestamptz;
begin
  if me is null then raise exception 'SB_AUTH: Sign in first, then try again.'; end if;
  if coalesce((select value from public.studyboard_config where key = 'app_trial'), 'false'::jsonb) <> 'true'::jsonb then
    raise exception 'SB_TRIAL_OFF: Free trials aren''t available right now.';
  end if;
  if exists (select 1 from public.studyboard_entitlements where user_id = me and trial_until is not null) then
    raise exception 'SB_TRIAL_USED: You''ve already used your free trial.';
  end if;
  if public.studyboard_is_pro(me) then raise exception 'SB_ALREADY_PRO: You already have Pro.'; end if;
  days := coalesce((select (value ->> 'trialDays')::int from public.studyboard_config where key = 'prices'), 7);
  until := now() + make_interval(days => greatest(days, 1));
  insert into public.studyboard_entitlements as e (user_id, plan, trial_until, source, updated_at)
  values (me, 'free', until, 'promo', now())
  on conflict (user_id) do update set trial_until = until, updated_at = now();
  return until;
end $$;
revoke all on function public.studyboard_start_trial() from public, anon;
grant execute on function public.studyboard_start_trial() to authenticated;

-- ---------- For you in the SQL Editor: give someone Pro by email (a friend, a tester, a promo) ----------
-- select public.studyboard_grant_pro('friend@example.com', 365);   -- a year of Pro
-- select public.studyboard_grant_pro('you@example.com', null);     -- Pro for good
create or replace function public.studyboard_grant_pro(p_email text, p_days int) returns text
language plpgsql security definer set search_path = public as $$
declare uid uuid;
begin
  select id into uid from auth.users where lower(email) = lower(p_email);
  if uid is null then return 'No account uses ' || p_email; end if;
  insert into public.studyboard_entitlements as e (user_id, plan, pro_until, source, will_renew, updated_at)
  values (uid, case when p_days is null then 'lifetime' else 'pro' end, case when p_days is null then null else now() + make_interval(days => p_days) end,
          case when p_days is null then 'lifetime' else 'promo' end, false, now())
  on conflict (user_id) do update set plan = excluded.plan, pro_until = excluded.pro_until, source = excluded.source, will_renew = false, updated_at = now();
  return 'Pro is on for ' || p_email;
end $$;
revoke all on function public.studyboard_grant_pro(text, int) from public, anon, authenticated;

-- Ask the API to notice the new tables right away
notify pgrst, 'reload schema';
