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
--  * studyboard_devices       the devices signed in to each account (free plan: up to 2).
--  * studyboard_usage         a small running total of each account's synced data and files, kept up to date by triggers.
--  * Limit checks on your data table, file storage and study groups, and a daily clean-up of old group messages on free groups.
-- All the triggers are named plans_... so they never clash with other setup files.
--
-- Security notes (Studyboard Pro): clients can only READ their own plan rows. Nothing a signed-in person (or the anon key) can
-- send will ever change an entitlement, a grant, usage or a setting. Every write goes through the service role (Edge Functions)
-- or the SQL Editor. Run supabase-plans-selftest.sql after this file to prove it.

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
-- This table is readable by everyone (the app needs the prices), so it must never hold a secret. Refuse keys and values that look like one.
alter table public.studyboard_config drop constraint if exists studyboard_config_no_secrets;
alter table public.studyboard_config add constraint studyboard_config_no_secrets check (
  key !~* '(secret|private|password|service_role|signing)' and value::text !~ '(sk_live|sk_test|rk_live|rk_test|whsec_|BEGIN [A-Z ]*PRIVATE|eyJhbGci)') not valid;

-- Starting values. "on conflict do nothing" keeps anything you changed when you run this file again.
-- A null limit means "no limit".
insert into public.studyboard_config (key, value) values
  ('paywall', 'false'),
  ('prices', '{"monthly": "$2.99", "yearly": "$19.99", "trialDays": 7, "currency": "USD"}'),
  ('limits', '{"free": {"devices": 2, "fileMB": 100, "dataMB": 25, "groupMembers": 3, "groupMsgDays": 60, "cloudBackupDays": 0},
               "pro":  {"devices": null, "fileMB": 10240, "dataMB": 250, "groupMembers": 100, "groupMsgDays": null, "cloudBackupDays": 30}}'),
  ('checkout_url_monthly', '""'),
  ('checkout_url_yearly', '""'),
  ('manage_url', '""'),
  ('site_url', '""'),
  ('app_trial', 'false'),
  ('item_purchases', 'false'),
  ('features', '{"insights": false, "ai_credits": false}')
on conflict (key) do nothing;

-- The free limits were lowered (devices 3 -> 2, group members 30 -> 3, group messages 120 -> 60 days).
-- "on conflict do nothing" above would keep the old row, so move it over only if you never edited those values.
update public.studyboard_config set
  value = jsonb_set(value, '{free}', (value -> 'free') || '{"devices": 2, "groupMembers": 3, "groupMsgDays": 60}'::jsonb), updated_at = now()
where key = 'limits'
  and value -> 'free' @> '{"devices": 3, "groupMembers": 30, "groupMsgDays": 120}'::jsonb;

-- ---------- Who has Pro ----------
create table if not exists public.studyboard_entitlements (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan text not null default 'free' check (plan in ('free', 'pro', 'lifetime')),
  pro_until timestamptz,             -- Pro ends after this (null with plan 'pro' means no end date)
  trial_until timestamptz,           -- a free trial ends after this (set once, so a trial can't be repeated)
  source text,                       -- who owns the PAID part: stripe, apple, google, revenuecat (or promo, lifetime from older versions; grant on a row made by a grant)
  external_id text,                  -- the Stripe customer id, or the RevenueCat app user id
  will_renew boolean not null default true,
  updated_at timestamptz not null default now()
);
alter table public.studyboard_entitlements add column if not exists will_renew boolean not null default true;
-- Manual grants live in their own columns, so a payment event can never wipe a grant and a grant never hides a payment.
alter table public.studyboard_entitlements add column if not exists grant_until timestamptz;
alter table public.studyboard_entitlements add column if not exists grant_lifetime boolean not null default false;
-- Billing bookkeeping (newest payment event applied, and "refunded or disputed: stay off until a new purchase").
alter table public.studyboard_entitlements add column if not exists billing_event_at timestamptz;
alter table public.studyboard_entitlements add column if not exists billing_revoked_at timestamptz;
alter table public.studyboard_entitlements drop constraint if exists studyboard_entitlements_source_check;
alter table public.studyboard_entitlements add constraint studyboard_entitlements_source_check
  check (source is null or source in ('stripe', 'apple', 'google', 'revenuecat', 'promo', 'lifetime', 'grant'));
create index if not exists studyboard_entitlements_external_idx on public.studyboard_entitlements (external_id);
alter table public.studyboard_entitlements enable row level security;
drop policy if exists "entitlement own read" on public.studyboard_entitlements;
create policy "entitlement own read" on public.studyboard_entitlements for select to authenticated using (user_id = (select auth.uid()));
-- Read only, own row only. No insert, update or delete policy exists, and the table privileges are taken away as well (two locks).
revoke all on public.studyboard_entitlements from public, anon, authenticated;
grant select on public.studyboard_entitlements to authenticated;

-- ---------- Helpers ----------
create or replace function public.studyboard_paywall() returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce((select value = 'true'::jsonb from public.studyboard_config where key = 'paywall'), false)
$$;

create or replace function public.studyboard_is_pro(uid uuid) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from public.studyboard_entitlements e
    where e.user_id = uid
      and (e.plan = 'lifetime'
           or (e.plan = 'pro' and (e.pro_until is null or e.pro_until > now()))
           or e.trial_until > now()
           or e.grant_lifetime
           or e.grant_until > now()))
$$;

-- One limit for one account, from the "limits" row. Null means no limit.
create or replace function public.studyboard_limit(uid uuid, name text) returns bigint
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare
  tier text := case when public.studyboard_is_pro(uid) then 'pro' else 'free' end;
  defaults constant jsonb := '{"free": {"devices": 2, "fileMB": 100, "dataMB": 25, "groupMembers": 3, "groupMsgDays": 60, "cloudBackupDays": 0},
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

-- Removed-device log (server only). It lets the limit stop "remove one, add another" from being used to cycle through many devices.
create table if not exists public.studyboard_device_removals (
  user_id uuid not null,
  removed_at timestamptz not null default now()
);
create index if not exists studyboard_device_removals_idx on public.studyboard_device_removals (user_id, removed_at);
alter table public.studyboard_device_removals enable row level security;   -- no policies: service only
revoke all on public.studyboard_device_removals from public, anon, authenticated;

create or replace function public.plans_device_removed() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  insert into public.studyboard_device_removals (user_id) values (old.user_id);
  return null;
end $$;
drop trigger if exists plans_device_removed on public.studyboard_devices;
create trigger plans_device_removed after delete on public.studyboard_devices for each row execute function public.plans_device_removed();

-- A 3rd device on the free plan is turned away (only while the paywall is on). The app shows the devices so you can remove one.
-- Free accounts can also remove only 4 devices in any 7 days, so removing and re-adding can't be used to share one account widely.
create or replace function public.plans_device_limit() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare lim bigint;
begin
  if not public.studyboard_paywall() then return new; end if;
  -- One sign-in at a time per account, so two devices signing in together can't both slip under the limit.
  perform pg_advisory_xact_lock(hashtextextended('sb-device:' || new.user_id::text, 0));
  -- An upsert of a device that's already there is just an update of last_seen.
  if exists (select 1 from public.studyboard_devices where user_id = new.user_id and device_id = new.device_id) then return new; end if;
  lim := public.studyboard_limit(new.user_id, 'devices');
  if lim is not null then
    if (select count(*) from public.studyboard_devices where user_id = new.user_id) >= lim then
      raise exception 'SB_DEVICE_LIMIT: The free plan syncs on up to % devices. Remove one you don''t use anymore, or go Pro for unlimited devices.', lim
        using errcode = 'P0001';
    end if;
    if (select count(*) from public.studyboard_device_removals where user_id = new.user_id and removed_at > now() - interval '7 days') >= 4 then
      raise exception 'SB_DEVICE_CHURN: You''ve swapped devices a lot this week. Try again in a few days, or go Pro for unlimited devices.'
        using errcode = 'P0001';
    end if;
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
  backup_bytes bigint not null default 0,
  updated_at timestamptz not null default now()
);
alter table public.studyboard_usage add column if not exists backup_bytes bigint not null default 0;
alter table public.studyboard_usage enable row level security;
drop policy if exists "usage own read" on public.studyboard_usage;
create policy "usage own read" on public.studyboard_usage for select to authenticated using (user_id = (select auth.uid()));
revoke all on public.studyboard_usage from public, anon, authenticated;
grant select on public.studyboard_usage to authenticated;

-- (The old 3-argument version is replaced by one that also counts online backups.)
drop function if exists public.plans_add_usage(uuid, bigint, bigint);
create or replace function public.plans_add_usage(uid uuid, d_data bigint, d_file bigint, d_backup bigint default 0) returns void
language sql security definer set search_path = public, pg_temp as $$
  insert into public.studyboard_usage as u (user_id, data_bytes, file_bytes, backup_bytes, updated_at)
  values (uid, greatest(d_data, 0), greatest(d_file, 0), greatest(d_backup, 0), now())
  on conflict (user_id) do update
    set data_bytes = greatest(u.data_bytes + d_data, 0), file_bytes = greatest(u.file_bytes + d_file, 0),
        backup_bytes = greatest(u.backup_bytes + d_backup, 0), updated_at = now()
$$;
revoke all on function public.plans_add_usage(uuid, bigint, bigint, bigint) from public, anon, authenticated;

-- ---------- Synced data limit (public.items) ----------
-- Everything is measured as the size of the JSON text, so a tiny compressed size can't hide a big item.
-- Online backups (kind 'backup') are Pro only (refused for Free while the paywall is on), have their own total (4 times the data limit,
-- or the "backupMB" row of limits if you add one) and are cleaned up after "cloudBackupDays" days (30 on Pro) by studyboard_prune_backups. Changing an item's kind is checked too (it can't be used to move data out of the count).
create or replace function public.plans_items_quota() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  lim bigint; blim bigint; used bigint; bused bigint; d_data bigint; d_bk bigint;
  n_data bigint := 0; n_bk bigint := 0; o_data bigint := 0; o_bk bigint := 0; sz bigint;
begin
  if not public.studyboard_paywall() then return new; end if;
  -- Restoring an archived account puts back what the person already had; the limits apply to new writes, not to a restore.
  if current_setting('studyboard.restoring', true) = '1' then return new; end if;
  -- Online backups are a Pro extra: a free account can't write them at all (the "cloudBackupDays" limit is 0 on Free).
  if new.kind = 'backup' and coalesce(public.studyboard_limit(new.user_id, 'cloudBackupDays'), 0) <= 0 then
    raise exception 'SB_BACKUP_PRO: Online backups are a Pro feature. Your backups on this device are not affected.' using errcode = 'P0001';
  end if;
  sz := octet_length(new.data::text);
  if new.kind = 'backup' then n_bk := sz; else n_data := sz; end if;
  if tg_op = 'INSERT' then
    -- An upsert of an item that's already there becomes an update, which is checked on its own.
    if exists (select 1 from public.items where user_id = new.user_id and kind = new.kind and id = new.id) then return new; end if;
  elsif old.user_id = new.user_id then
    sz := octet_length(old.data::text);
    if old.kind = 'backup' then o_bk := sz; else o_data := sz; end if;
  end if;
  d_data := n_data - o_data; d_bk := n_bk - o_bk;   -- shrinking or deleting is always fine
  select coalesce(u.data_bytes, 0), coalesce(u.backup_bytes, 0) into used, bused from (select 1) x left join public.studyboard_usage u on u.user_id = new.user_id;
  if d_data > 0 then
    lim := public.studyboard_limit(new.user_id, 'dataMB');
    if lim is not null and used + d_data > lim * 1048576 then
      raise exception 'SB_DATA_LIMIT: Your synced data is over the % MB storage limit of the free plan. Delete some old items, or go Pro for more room.', lim
        using errcode = 'P0001';
    end if;
  end if;
  if d_bk > 0 then
    blim := coalesce(public.studyboard_limit(new.user_id, 'backupMB'), public.studyboard_limit(new.user_id, 'dataMB') * 4);
    if blim is not null and bused + d_bk > blim * 1048576 then
      raise exception 'SB_DATA_LIMIT: Your online backups are over the % MB limit of the free plan. Go Pro for more room.', blim
        using errcode = 'P0001';
    end if;
  end if;
  return new;
end $$;

create or replace function public.plans_items_usage() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare sz bigint;
begin
  if tg_op = 'DELETE' and not exists (select 1 from auth.users u where u.id = old.user_id) then return null; end if;   -- the account itself is being deleted
  if tg_op in ('UPDATE', 'DELETE') then
    sz := octet_length(old.data::text);
    perform public.plans_add_usage(old.user_id, case when old.kind = 'backup' then 0 else -sz end, 0, case when old.kind = 'backup' then -sz else 0 end);
  end if;
  if tg_op in ('INSERT', 'UPDATE') then
    sz := octet_length(new.data::text);
    perform public.plans_add_usage(new.user_id, case when new.kind = 'backup' then 0 else sz end, 0, case when new.kind = 'backup' then sz else 0 end);
  end if;
  return null;
end $$;

do $$
begin
  if to_regclass('public.items') is null then
    raise notice 'public.items not found: run the main setup SQL first, then run this file again for the data limit.';
    return;
  end if;
  execute 'drop trigger if exists plans_items_quota on public.items';
  execute 'create trigger plans_items_quota before insert or update of data, kind, user_id on public.items for each row execute function public.plans_items_quota()';
  execute 'drop trigger if exists plans_items_usage on public.items';
  execute 'create trigger plans_items_usage after insert or update of data, kind, user_id or delete on public.items for each row execute function public.plans_items_usage()';
  -- Count what is already there (recounted each time this file runs).
  insert into public.studyboard_usage (user_id, data_bytes, backup_bytes, updated_at)
    select i.user_id, coalesce(sum(octet_length(i.data::text)) filter (where i.kind <> 'backup'), 0),
           coalesce(sum(octet_length(i.data::text)) filter (where i.kind = 'backup'), 0), now()
    from public.items i
    where exists (select 1 from auth.users u where u.id = i.user_id) group by i.user_id
  on conflict (user_id) do update set data_bytes = excluded.data_bytes, backup_bytes = excluded.backup_bytes, updated_at = now();
end $$;

-- ---------- File storage limit (the studioso-files bucket) ----------
-- Files are stored under "<your user id>/...", so the first folder says whose file it is.
create or replace function public.plans_object_owner(p_name text) returns uuid
language sql immutable set search_path = public as $$
  select case when split_part(p_name, '/', 1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
              then split_part(p_name, '/', 1)::uuid end
$$;

create or replace function public.plans_storage_quota() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid; lim bigint; used bigint; delta bigint;
begin
  if new.bucket_id <> 'studioso-files' or not public.studyboard_paywall() then return new; end if;
  uid := public.plans_object_owner(new.name);
  -- Files must live under "<user id>/...". A path without one would not be counted for anybody, so it is refused.
  if uid is null then
    raise exception 'SB_STORAGE_PATH: Files are stored in your own folder.' using errcode = 'P0001';
  end if;
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
language plpgsql security definer set search_path = public, pg_temp as $$
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
-- A group's size follows its owner's plan: 3 members on Free, 100 on Pro (join_group in groups.sql also stops at 100).
create or replace function public.plans_group_member_limit() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare owner uuid; lim bigint; pro_lim bigint;
begin
  if not public.studyboard_paywall() then return new; end if;
  perform pg_advisory_xact_lock(hashtextextended('sb-group:' || new.group_id::text, 0));   -- two people joining at once can't both take the last seat
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

-- Deletes messages older than the owner's plan allows (60 days on Free). Does nothing while the paywall is off.
create or replace function public.studyboard_prune_group_messages() returns integer
language plpgsql security definer set search_path = public, pg_temp as $$
declare n integer := 0;
begin
  if not public.studyboard_paywall() or to_regclass('public.group_messages') is null then return 0; end if;
  with gone as (
    delete from public.group_messages m
    using public.study_groups g
    where m.group_id = g.id
      and public.studyboard_limit(g.owner_id, 'groupMsgDays') is not null
      and not coalesce(m.pinned, false)   -- pinned messages stay
      and m.created_at < now() - make_interval(days => public.studyboard_limit(g.owner_id, 'groupMsgDays')::int + 30)   -- plus a grace period
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
    perform cron.unschedule(jobid) from cron.job where jobname = 'studyboard-prune-backups';
    perform cron.schedule('studyboard-prune-backups', '29 4 * * *', 'select public.studyboard_prune_backups()');
    perform cron.unschedule(jobid) from cron.job where jobname = 'studyboard-prune-billing';
    perform cron.schedule('studyboard-prune-billing', '23 4 * * *', 'select public.studyboard_prune_billing()');
  end if;
end $$;

-- ---------- Free trial started in the app (no card), once per account ----------
-- Only works when the "app_trial" row is true. Store trials (Stripe, App Store, Google Play) don't need this.
-- "Once" survives deleting the account and making a new one with the same email: studyboard_trial_uses keeps a SHA-256 of the
-- tidied email address (lower case, "+anything" dropped, dots ignored for Gmail) and nothing else: no account id, no date of birth,
-- not the address itself. studyboard_delete_user_data (supabase-lean.sql) leaves it in place, the way the privacy policy keeps
-- billing bookkeeping. Server only: row level security on, no policies, no grants.
create table if not exists public.studyboard_trial_uses (
  email_hash text primary key check (email_hash ~ '^[0-9a-f]{64}$'),
  used_at timestamptz not null default now()
);
alter table public.studyboard_trial_uses enable row level security;
revoke all on public.studyboard_trial_uses from public, anon, authenticated;

create or replace function public.plans_email_hash(p_email text) returns text
language sql immutable set search_path = '' as $$
  select case when x is null or position('@' in x) = 0 then null else encode(sha256(convert_to(
    case when split_part(x, '@', 2) in ('gmail.com', 'googlemail.com')
         then replace(split_part(split_part(x, '@', 1), '+', 1), '.', '') || '@gmail.com'
         else split_part(split_part(x, '@', 1), '+', 1) || '@' || split_part(x, '@', 2) end, 'UTF8')), 'hex') end
  from (select nullif(lower(btrim(p_email)), '') as x) q
$$;

-- Trials already used (by an app or store trial) count too.
insert into public.studyboard_trial_uses (email_hash)
  select distinct public.plans_email_hash(u.email) from public.studyboard_entitlements e join auth.users u on u.id = e.user_id
  where e.trial_until is not null and public.plans_email_hash(u.email) is not null
on conflict (email_hash) do nothing;

create or replace function public.studyboard_start_trial() returns timestamptz
language plpgsql security definer set search_path = public, pg_temp as $$
declare me uuid := auth.uid(); days int; until timestamptz; eh text;
begin
  if me is null then raise exception 'SB_AUTH: Sign in first, then try again.'; end if;
  if coalesce((select value from public.studyboard_config where key = 'app_trial'), 'false'::jsonb) <> 'true'::jsonb then
    raise exception 'SB_TRIAL_OFF: Free trials aren''t available right now.';
  end if;
  if exists (select 1 from public.studyboard_entitlements where user_id = me and trial_until is not null) then
    raise exception 'SB_TRIAL_USED: You''ve already used your free trial.';
  end if;
  eh := public.plans_email_hash((select u.email from auth.users u where u.id = me));
  if eh is not null and exists (select 1 from public.studyboard_trial_uses where email_hash = eh) then
    raise exception 'SB_TRIAL_USED: You''ve already used your free trial.';
  end if;
  if public.studyboard_is_pro(me) then raise exception 'SB_ALREADY_PRO: You already have Pro.'; end if;
  days := coalesce((select (value ->> 'trialDays')::int from public.studyboard_config where key = 'prices'), 7);
  until := now() + make_interval(days => greatest(days, 1));
  insert into public.studyboard_entitlements as e (user_id, plan, trial_until, source, updated_at)
  values (me, 'free', until, 'promo', now())
  on conflict (user_id) do update set trial_until = until, updated_at = now();
  if eh is not null then insert into public.studyboard_trial_uses (email_hash) values (eh) on conflict (email_hash) do nothing; end if;
  return until;
end $$;
revoke all on function public.studyboard_start_trial() from public, anon;
grant execute on function public.studyboard_start_trial() to authenticated;

-- ---------- Server-only tables for payments, grants and rate limits ----------
-- All have row level security on and NO policies, and no table privileges for the app: only the service role (Edge Functions) and the SQL Editor can touch them.

-- Which Stripe customer belongs to which account (set by the create-checkout function, never by the app).
create table if not exists public.studyboard_billing_customers (
  user_id uuid primary key references auth.users(id) on delete cascade,
  stripe_customer_id text not null unique,
  created_at timestamptz not null default now()
);
-- Payment events already handled, so a repeated or replayed event can't grant (or take away) anything twice.
create table if not exists public.studyboard_billing_events (
  family text not null check (family in ('stripe', 'revenuecat')),
  event_id text not null,
  type text not null default '',
  event_at timestamptz,
  user_id uuid,
  outcome text,
  received_at timestamptz not null default now(),
  primary key (family, event_id)
);
-- Who gave Pro to whom, when, for how long and why (see studyboard_grant_pro below).
create table if not exists public.studyboard_pro_grants (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete set null,
  email text,
  action text not null check (action in ('grant', 'revoke', 'migrate')),
  days int,
  forever boolean not null default false,
  until timestamptz,
  reason text,
  acting_user text not null default session_user,
  created_at timestamptz not null default now()
);
-- Per-account counters for the Edge Functions (checkout, portal, entitlement token).
create table if not exists public.studyboard_plan_rate (
  key text not null,
  bucket timestamptz not null,
  n int not null default 0,
  primary key (key, bucket)
);
do $$
declare t text;
begin
  foreach t in array array['studyboard_billing_customers', 'studyboard_billing_events', 'studyboard_pro_grants', 'studyboard_plan_rate'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from public, anon, authenticated', t);
  end loop;
end $$;

-- Counts one use of "key" in the current window. False once it's over p_max in p_window seconds. Used by the Edge Functions (service role).
create or replace function public.studyboard_plan_rate_hit(p_key text, p_max int, p_window int) returns boolean
language plpgsql volatile security definer set search_path = '' as $$
declare b timestamptz := to_timestamp(floor(extract(epoch from now()) / greatest(p_window, 1)) * greatest(p_window, 1)); c int;
begin
  insert into public.studyboard_plan_rate as r (key, bucket, n) values (left(p_key, 200), b, 1)
    on conflict (key, bucket) do update set n = r.n + 1 returning n into c;
  return c <= p_max;
end $$;

-- Deletes online backups older than the owner's plan keeps them (30 days on Pro; everything on Free). Does nothing while the paywall is off.
create or replace function public.studyboard_prune_backups() returns integer
language plpgsql security definer set search_path = '' as $$
declare n integer := 0;
begin
  if not public.studyboard_paywall() or to_regclass('public.items') is null then return 0; end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'items' and column_name = 'updated_at') then return 0; end if;
  with gone as (
    delete from public.items i
    where i.kind = 'backup'
      and public.studyboard_limit(i.user_id, 'cloudBackupDays') is not null   -- no limit means keep them all
      -- 30 days of grace past the plan's window, so turning plans on or a lapsed plan never wipes a backup the same night
      and i.updated_at < now() - make_interval(days => greatest(public.studyboard_limit(i.user_id, 'cloudBackupDays'), 0)::int + 30)
    returning 1)
  select count(*) into n from gone;
  return n;
end $$;

create or replace function public.studyboard_prune_billing() returns void
language sql security definer set search_path = '' as $$
  delete from public.studyboard_plan_rate where bucket < now() - interval '2 days';
  delete from public.studyboard_billing_events where received_at < now() - interval '120 days';
  delete from public.studyboard_device_removals where removed_at < now() - interval '30 days';
$$;

-- ---------- Payments become Pro here (called only by the billing-webhook function, with the service role) ----------
-- One transaction does everything: remember the event id (a repeat does nothing), check the account is real, ignore
-- events older than the newest one already applied, never let one payment source cancel another, and never touch a manual grant.
-- p is JSON: event_id, family (stripe|revenuecat), source (stripe|apple|google|revenuecat), type, event_at,
--   state (active|extend|ended|renew_off|revoke|unrevoke|lifetime), uid_hint, trust_hint, customer, pro_until, trial_until, will_renew, external_id, fresh.
create or replace function public.studyboard_apply_billing(p jsonb) returns text
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_event text := left(coalesce(p ->> 'event_id', ''), 200);
  v_family text := p ->> 'family';
  v_source text := p ->> 'source';
  v_type text := left(coalesce(p ->> 'type', ''), 100);
  v_state text := p ->> 'state';
  v_at timestamptz := coalesce((p ->> 'event_at')::timestamptz, now());
  v_hint uuid := nullif(p ->> 'uid_hint', '')::uuid;
  v_trust boolean := coalesce((p ->> 'trust_hint')::boolean, false);
  v_fresh boolean := coalesce((p ->> 'fresh')::boolean, false);
  v_customer text := nullif(left(coalesce(p ->> 'customer', ''), 100), '');
  v_ext text := nullif(left(coalesce(p ->> 'external_id', ''), 200), '');
  v_until timestamptz := (p ->> 'pro_until')::timestamptz;
  v_trial timestamptz := (p ->> 'trial_until')::timestamptz;
  v_renew boolean := coalesce((p ->> 'will_renew')::boolean, true);
  v_uid uuid; v_mapped uuid; v_out text := 'ignored'; v_cur_family text; v_cur_live boolean; v_new_until timestamptz;
  r public.studyboard_entitlements;
begin
  if v_event = '' or v_family is null or v_family not in ('stripe', 'revenuecat') or v_source is null
     or v_state is null or v_state not in ('active', 'extend', 'ended', 'renew_off', 'revoke', 'unrevoke', 'lifetime') then
    raise exception 'bad billing event';
  end if;
  insert into public.studyboard_billing_events (family, event_id, type, event_at) values (v_family, v_event, v_type, v_at) on conflict do nothing;
  if not found then return 'duplicate'; end if;

  <<blk>>
  begin
    -- Whose payment is this? A known Stripe customer decides it. The id in the event is only believed (trust_hint) when
    -- it came from something our own server set when it created the checkout, and only for a customer nobody else has.
    if v_family = 'stripe' and v_customer is not null then
      select c.user_id into v_mapped from public.studyboard_billing_customers c where c.stripe_customer_id = v_customer;
      if v_mapped is null then
        select e.user_id into v_mapped from public.studyboard_entitlements e where e.external_id = v_customer and e.source = 'stripe' limit 1;
      end if;
    end if;
    if v_mapped is not null then
      if v_hint is not null and v_hint <> v_mapped then v_out := 'rejected: account mismatch'; exit blk; end if;
      v_uid := v_mapped;
    elsif v_family = 'stripe' then
      if v_hint is not null and v_trust then v_uid := v_hint; end if;
    else
      v_uid := v_hint;
    end if;
    if v_uid is null then v_out := 'ignored: unknown customer'; exit blk; end if;
    if not exists (select 1 from auth.users where id = v_uid) then v_out := 'ignored: no such account'; exit blk; end if;
    if v_family = 'stripe' and v_customer is not null and v_mapped is null then
      if exists (select 1 from public.studyboard_billing_customers where user_id = v_uid and stripe_customer_id <> v_customer) then
        v_out := 'rejected: customer mismatch'; exit blk;
      end if;
      insert into public.studyboard_billing_customers (user_id, stripe_customer_id) values (v_uid, v_customer) on conflict do nothing;
    end if;

    insert into public.studyboard_entitlements (user_id) values (v_uid) on conflict do nothing;
    select * into r from public.studyboard_entitlements where user_id = v_uid for update;

    v_cur_family := case when r.source = 'stripe' then 'stripe' when r.source in ('apple', 'google', 'revenuecat') then 'revenuecat' else null end;
    v_cur_live := r.plan = 'lifetime' or (r.plan = 'pro' and (r.pro_until is null or r.pro_until > now()));

    if v_state = 'unrevoke' then
      update public.studyboard_entitlements set billing_revoked_at = null, updated_at = now() where user_id = v_uid;
      v_out := 'cleared'; exit blk;
    end if;
    -- Pro for good (paid) is never changed by a subscription event; only a refund or dispute can end it.
    if r.plan = 'lifetime' and v_state <> 'revoke' and v_state <> 'lifetime' then v_out := 'kept lifetime'; exit blk; end if;
    -- After a refund or dispute, only a brand new purchase turns Pro back on.
    if r.billing_revoked_at is not null and v_state in ('active', 'extend', 'lifetime') and not (v_fresh and v_at > r.billing_revoked_at) then
      v_out := 'ignored: revoked'; exit blk;
    end if;
    -- One payment source must not cancel or shorten another source's live subscription.
    if v_cur_live and v_cur_family is not null and v_cur_family <> v_family then
      if v_state in ('ended', 'renew_off', 'revoke') then v_out := 'kept other source'; exit blk; end if;
      if v_state in ('active', 'extend') and (r.pro_until is null or v_until is null or v_until <= r.pro_until) then v_out := 'kept other source'; exit blk; end if;
    end if;
    -- Older than the newest event already applied: ignore (a refund or dispute is the exception, it always applies).
    -- (Stripe stamps events to the second: when an "on" event and an "off" event share a second, off wins.)
    if v_state <> 'revoke' and r.billing_event_at is not null and (v_cur_family is null or v_cur_family = v_family)
       and (v_at < r.billing_event_at or (v_at = r.billing_event_at and v_state in ('active', 'extend') and r.plan = 'free' and v_cur_family = v_family)) then
      v_out := 'stale'; exit blk;
    end if;

    if v_state = 'active' then
      if v_until is null then raise exception 'pro_until required'; end if;
      update public.studyboard_entitlements set plan = 'pro', pro_until = v_until, source = v_source, external_id = coalesce(v_ext, external_id),
        will_renew = v_renew, trial_until = coalesce(trial_until, v_trial),
        billing_event_at = greatest(coalesce(billing_event_at, v_at), v_at),
        billing_revoked_at = case when v_fresh then null else billing_revoked_at end, updated_at = now() where user_id = v_uid;
      v_out := 'pro';
    elsif v_state = 'extend' then
      if v_until is null then raise exception 'pro_until required'; end if;
      v_new_until := greatest(coalesce(r.pro_until, '-infinity'::timestamptz), v_until);
      update public.studyboard_entitlements set plan = 'pro', pro_until = v_new_until, source = v_source, external_id = coalesce(v_ext, external_id),
        billing_event_at = greatest(coalesce(billing_event_at, v_at), v_at), updated_at = now() where user_id = v_uid;
      v_out := 'extended';
    elsif v_state = 'lifetime' then
      update public.studyboard_entitlements set plan = 'lifetime', pro_until = null, source = v_source, external_id = coalesce(v_ext, external_id),
        will_renew = false, billing_event_at = greatest(coalesce(billing_event_at, v_at), v_at),
        billing_revoked_at = case when v_fresh then null else billing_revoked_at end, updated_at = now() where user_id = v_uid;
      v_out := 'lifetime';
    elsif v_state = 'ended' then
      update public.studyboard_entitlements set plan = 'free', pro_until = now(), will_renew = false,
        trial_until = case when source = v_source then least(trial_until, now()) else trial_until end,
        source = coalesce(source, v_source), billing_event_at = greatest(coalesce(billing_event_at, v_at), v_at), updated_at = now() where user_id = v_uid;
      v_out := 'ended';
    elsif v_state = 'renew_off' then
      update public.studyboard_entitlements set will_renew = false, billing_event_at = greatest(coalesce(billing_event_at, v_at), v_at), updated_at = now() where user_id = v_uid;
      v_out := 'renewal off';
    else -- revoke: refunded or disputed
      update public.studyboard_entitlements set plan = 'free', pro_until = now(), will_renew = false,
        trial_until = least(trial_until, now()), billing_event_at = greatest(coalesce(billing_event_at, v_at), v_at),
        billing_revoked_at = v_at, updated_at = now() where user_id = v_uid;
      v_out := 'revoked';
    end if;
  end blk;

  update public.studyboard_billing_events set outcome = v_out, user_id = v_uid where family = v_family and event_id = v_event;
  return v_out;
end $$;

-- ---------- For you in the SQL Editor: give someone Pro, or take a gift back ----------
-- Grants are separate from payments: a subscription ending never removes a grant, and a grant never hides or changes a subscription.
-- Nobody but you (SQL Editor) or the service role can run these. They are logged in studyboard_pro_grants.
--   select public.studyboard_grant_pro('friend@example.com', 365, 'tester');            -- a year of Pro (by email)
--   select public.studyboard_grant_pro('you@example.com', null, 'owner');               -- Pro for good
--   select public.studyboard_grant_pro_uid('00000000-0000-0000-0000-000000000000', 30, 'contest winner');   -- by account id
--   select public.studyboard_revoke_pro('friend@example.com', 'ended early');           -- take the grant back
-- Each grant replaces the one before it for that person (the days count from now).
create or replace function public.plans_deny_clients() returns void
language plpgsql stable set search_path = '' as $$
declare c text := nullif(current_setting('request.jwt.claims', true), '');
begin
  -- Belt and braces on top of the removed EXECUTE privilege: refuse anyone whose sign-in says anon or authenticated.
  if c is not null and coalesce((c::jsonb) ->> 'role', '') in ('anon', 'authenticated') then
    raise exception 'not allowed' using errcode = '42501';
  end if;
end $$;

drop function if exists public.studyboard_grant_pro(text, int);
create or replace function public.studyboard_grant_pro_uid(p_uid uuid, p_days int, p_reason text default null) returns text
language plpgsql volatile security definer set search_path = '' as $$
declare em text; until timestamptz;
begin
  perform public.plans_deny_clients();
  if p_days is not null and (p_days < 1 or p_days > 36500) then raise exception 'days must be between 1 and 36500, or null for good'; end if;
  select u.email into em from auth.users u where u.id = p_uid;
  if not found then return 'No account has that id'; end if;
  until := case when p_days is null then null else now() + make_interval(days => p_days) end;
  insert into public.studyboard_entitlements as e (user_id, plan, source, will_renew, grant_until, grant_lifetime, updated_at)
  values (p_uid, 'free', 'grant', false, until, p_days is null, now())
  on conflict (user_id) do update set grant_until = excluded.grant_until, grant_lifetime = excluded.grant_lifetime, updated_at = now();
  insert into public.studyboard_pro_grants (user_id, email, action, days, forever, until, reason)
  values (p_uid, em, 'grant', p_days, p_days is null, until, left(p_reason, 500));
  return 'Pro is on for ' || coalesce(em, p_uid::text) || case when p_days is null then ' for good' else ' until ' || until::text end;
end $$;

create or replace function public.studyboard_grant_pro(p_email text, p_days int, p_reason text default null) returns text
language plpgsql volatile security definer set search_path = '' as $$
declare uid uuid;
begin
  perform public.plans_deny_clients();
  select id into uid from auth.users where lower(email) = lower(btrim(p_email));
  if uid is null then return 'No account uses ' || coalesce(p_email, '(nothing)'); end if;
  return public.studyboard_grant_pro_uid(uid, p_days, p_reason);
end $$;

create or replace function public.studyboard_revoke_pro_uid(p_uid uuid, p_reason text default null) returns text
language plpgsql volatile security definer set search_path = '' as $$
declare em text;
begin
  perform public.plans_deny_clients();
  select u.email into em from auth.users u where u.id = p_uid;
  if not found then return 'No account has that id'; end if;
  update public.studyboard_entitlements set grant_until = null, grant_lifetime = false, updated_at = now() where user_id = p_uid;
  insert into public.studyboard_pro_grants (user_id, email, action, reason) values (p_uid, em, 'revoke', left(p_reason, 500));
  return 'The grant is removed for ' || coalesce(em, p_uid::text) || ' (a paid subscription, if there is one, is not touched)';
end $$;

create or replace function public.studyboard_revoke_pro(p_email text, p_reason text default null) returns text
language plpgsql volatile security definer set search_path = '' as $$
declare uid uuid;
begin
  perform public.plans_deny_clients();
  select id into uid from auth.users where lower(email) = lower(btrim(p_email));
  if uid is null then return 'No account uses ' || coalesce(p_email, '(nothing)'); end if;
  return public.studyboard_revoke_pro_uid(uid, p_reason);
end $$;

-- Older versions of this file gave Pro by writing the plan itself (source promo or lifetime, no payment id). Move those into grants, once.
do $$
begin
  with moved as (
    update public.studyboard_entitlements set
      grant_lifetime = (plan = 'lifetime'), grant_until = case when plan = 'pro' then pro_until end,
      plan = 'free', pro_until = null, source = 'grant', will_renew = false, updated_at = now()
    where external_id is null and ((source = 'lifetime' and plan = 'lifetime') or (source = 'promo' and plan = 'pro' and pro_until is not null))
    returning user_id, grant_lifetime, grant_until)
  insert into public.studyboard_pro_grants (user_id, email, action, forever, until, reason)
    select m.user_id, (select u.email from auth.users u where u.id = m.user_id), 'migrate', m.grant_lifetime, m.grant_until, 'moved from an older grant'
    from moved m;
end $$;

-- ---------- Lock down: who may run what, and what is visible live ----------
-- Every function in this file except the two the app calls is closed to PUBLIC, anon and signed-in people. Doing it by name over
-- pg_proc covers every overload, and brand new functions Supabase gives default privileges to can't slip through.
do $$
declare f record;
begin
  for f in
    select p.oid::regprocedure as sig from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and (p.proname like 'plans\_%' or p.proname in ('studyboard_is_pro', 'studyboard_limit', 'studyboard_prune_group_messages', 'studyboard_prune_billing', 'studyboard_prune_backups',
           'studyboard_apply_billing', 'studyboard_plan_rate_hit', 'studyboard_grant_pro', 'studyboard_grant_pro_uid', 'studyboard_revoke_pro', 'studyboard_revoke_pro_uid'))
  loop
    execute format('revoke all on function %s from public, anon, authenticated', f.sig);
    if exists (select 1 from pg_roles where rolname = 'service_role') then execute format('grant execute on function %s to service_role', f.sig); end if;
  end loop;
end $$;
revoke all on function public.studyboard_paywall() from public;
grant execute on function public.studyboard_paywall() to anon, authenticated;
revoke all on function public.studyboard_start_trial() from public, anon;
grant execute on function public.studyboard_start_trial() to authenticated;

do $$
declare t text;
begin
  -- The service role (Edge Functions) needs table access; it skips row level security by design.
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    foreach t in array array['studyboard_config', 'studyboard_entitlements', 'studyboard_devices', 'studyboard_usage', 'studyboard_billing_customers',
                              'studyboard_billing_events', 'studyboard_pro_grants', 'studyboard_plan_rate', 'studyboard_device_removals', 'studyboard_trial_uses'] loop
      execute format('grant all on public.%I to service_role', t);
    end loop;
  end if;
  -- None of these tables is sent over Realtime (nobody needs to listen to a plan, a grant or a setting).
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime' and not puballtables) then
    foreach t in array array['studyboard_config', 'studyboard_entitlements', 'studyboard_usage', 'studyboard_billing_customers', 'studyboard_billing_events',
                              'studyboard_pro_grants', 'studyboard_plan_rate', 'studyboard_device_removals', 'studyboard_trial_uses'] loop
      if exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
        execute format('alter publication supabase_realtime drop table public.%I', t);
      end if;
    end loop;
  end if;
end $$;

-- Ask the API to notice the new tables right away
notify pgrst, 'reload schema';
