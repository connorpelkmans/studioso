-- Studyboard 1.11

-- Settings: prices, limits and switches
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
-- This table is readable by everyone (the app needs the prices)
alter table public.studyboard_config drop constraint if exists studyboard_config_no_secrets;
alter table public.studyboard_config add constraint studyboard_config_no_secrets check (
  key !~* '(secret|private|password|service_role|signing)' and value::text !~ '(sk_live|sk_test|rk_live|rk_test|whsec_|BEGIN [A-Z ]*PRIVATE|eyJhbGci)') not valid;

-- Starting values
insert into public.studyboard_config (key, value) values
  ('paywall', 'false'),
  ('prices', '{"monthly": "$3.99", "yearly": "$29.99", "trialDays": 7, "currency": "USD"}'),
  ('limits', '{"free": {"devices": 2, "fileMB": 25, "dataMB": 25, "groupMembers": 5, "groupMsgDays": 60, "cloudBackupDays": 0},
               "pro":  {"devices": null, "fileMB": 10240, "dataMB": 250, "groupMembers": 100, "groupMsgDays": null, "cloudBackupDays": 30}}'),
  ('checkout_url_monthly', '""'),
  ('checkout_url_yearly', '""'),
  ('manage_url', '""'),
  ('site_url', '""'),
  ('app_trial', 'false'),
  ('item_purchases', 'false'),
  ('features', '{"insights": false, "ai_credits": false}')
on conflict (key) do nothing;
-- Free cloud file storage went from 100 MB to 25 MB
update public.studyboard_config set value = jsonb_set(value, '{free,fileMB}', '25')
  where key = 'limits' and value #> '{free,fileMB}' = '100'::jsonb;

-- The free limits were lowered
update public.studyboard_config set
  value = jsonb_set(value, '{free}', (value -> 'free') || '{"devices": 2, "groupMembers": 3, "groupMsgDays": 60}'::jsonb), updated_at = now()
where key = 'limits'
  and value -> 'free' @> '{"devices": 3, "groupMembers": 30, "groupMsgDays": 120}'::jsonb;

-- Free groups went from 3 members to 5
update public.studyboard_config set value = jsonb_set(value, '{free,groupMembers}', '5'), updated_at = now()
where key = 'limits' and value #> '{free,groupMembers}' = '3'::jsonb;

-- Who has Pro
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
-- Manual grants live in their own columns
alter table public.studyboard_entitlements add column if not exists grant_until timestamptz;
alter table public.studyboard_entitlements add column if not exists grant_lifetime boolean not null default false;
-- Promo codes (see "Promo codes" below) live in their own columns too
alter table public.studyboard_entitlements add column if not exists promo_until timestamptz;
alter table public.studyboard_entitlements add column if not exists promo_lifetime boolean not null default false;
-- Billing bookkeeping
alter table public.studyboard_entitlements add column if not exists billing_event_at timestamptz;
alter table public.studyboard_entitlements add column if not exists billing_revoked_at timestamptz;
alter table public.studyboard_entitlements drop constraint if exists studyboard_entitlements_source_check;
alter table public.studyboard_entitlements add constraint studyboard_entitlements_source_check
  check (source is null or source in ('stripe', 'apple', 'google', 'revenuecat', 'promo', 'lifetime', 'grant', 'welcome'));
create index if not exists studyboard_entitlements_external_idx on public.studyboard_entitlements (external_id);
alter table public.studyboard_entitlements enable row level security;
drop policy if exists "entitlement own read" on public.studyboard_entitlements;
create policy "entitlement own read" on public.studyboard_entitlements for select to authenticated using (user_id = (select auth.uid()));
-- Read only, own row only
revoke all on public.studyboard_entitlements from public, anon, authenticated;
grant select on public.studyboard_entitlements to authenticated;

-- Helpers
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
           or e.grant_until > now()
           or e.promo_lifetime
           or e.promo_until > now()))
$$;

-- One limit for one account, from the "limits" row
create or replace function public.studyboard_limits_pro(uid uuid) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from public.studyboard_entitlements e
    where e.user_id = uid
      and (e.plan = 'lifetime'
           or (e.plan = 'pro' and (e.pro_until is null or e.pro_until > now()))
           or e.grant_lifetime
           or e.grant_until > now()))
$$;
revoke all on function public.studyboard_limits_pro(uuid) from public, anon, authenticated;

create or replace function public.studyboard_limit(uid uuid, name text) returns bigint
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare
  tier text := case when public.studyboard_limits_pro(uid) then 'pro' else 'free' end;
  defaults constant jsonb := '{"free": {"devices": 2, "fileMB": 25, "dataMB": 25, "groupMembers": 5, "groupMsgDays": 60, "cloudBackupDays": 0},
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

-- Devices
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

-- Removed-device log (server only)
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

-- A 3rd device on the free plan is turned away (only while the paywall is on)
create or replace function public.plans_device_limit() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare lim bigint;
begin
  if not public.studyboard_paywall() then return new; end if;
  perform pg_advisory_xact_lock(hashtextextended('sb-device:' || new.user_id::text, 0));
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

-- A device row can't be turned into a different device
create or replace function public.plans_device_keys() returns trigger
language plpgsql set search_path = public, pg_temp as $$
begin
  if new.user_id is distinct from old.user_id or new.device_id is distinct from old.device_id then
    raise exception 'SB_DEVICE_ID: A device can''t be renamed to another device. Remove it and sign in on the new one.' using errcode = 'P0001';
  end if;
  return new;
end $$;
revoke all on function public.plans_device_keys() from public, anon, authenticated;
drop trigger if exists plans_device_keys on public.studyboard_devices;
create trigger plans_device_keys before update on public.studyboard_devices for each row execute function public.plans_device_keys();

-- Usage totals (kept by triggers, so checks never have to add everything up)
create table if not exists public.studyboard_usage (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data_bytes bigint not null default 0,
  file_bytes bigint not null default 0,
  backup_bytes bigint not null default 0,
  updated_at timestamptz not null default now()
);
alter table public.studyboard_usage add column if not exists backup_bytes bigint not null default 0;
alter table public.studyboard_usage add column if not exists item_rows bigint not null default 0;   -- synced items (not backups), for the row cap
alter table public.studyboard_usage enable row level security;
drop policy if exists "usage own read" on public.studyboard_usage;
create policy "usage own read" on public.studyboard_usage for select to authenticated using (user_id = (select auth.uid()));
revoke all on public.studyboard_usage from public, anon, authenticated;
grant select on public.studyboard_usage to authenticated;

drop function if exists public.plans_add_usage(uuid, bigint, bigint);
drop function if exists public.plans_add_usage(uuid, bigint, bigint, bigint);
create or replace function public.plans_add_usage(uid uuid, d_data bigint, d_file bigint, d_backup bigint default 0, d_rows bigint default 0) returns void
language sql security definer set search_path = public, pg_temp as $$
  insert into public.studyboard_usage as u (user_id, data_bytes, file_bytes, backup_bytes, item_rows, updated_at)
  values (uid, greatest(d_data, 0), greatest(d_file, 0), greatest(d_backup, 0), greatest(d_rows, 0), now())
  on conflict (user_id) do update
    set data_bytes = greatest(u.data_bytes + d_data, 0), file_bytes = greatest(u.file_bytes + d_file, 0),
        backup_bytes = greatest(u.backup_bytes + d_backup, 0), item_rows = greatest(u.item_rows + d_rows, 0), updated_at = now()
$$;
revoke all on function public.plans_add_usage(uuid, bigint, bigint, bigint, bigint) from public, anon, authenticated;

-- Synced data limit (public.items)
create or replace function public.plans_item_limits(uid uuid, out data_mb bigint, out backup_mb bigint)
language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  if public.studyboard_paywall() then
    data_mb := public.studyboard_limit(uid, 'dataMB');
    backup_mb := coalesce(public.studyboard_limit(uid, 'backupMB'), data_mb * 4);
  else   -- paywall off: the safety cap, twice the plan's data limit, for synced data and for backups
    data_mb := coalesce(public.studyboard_limit(uid, 'dataMB'), 250) * 2;
    backup_mb := data_mb;
  end if;
end $$;
revoke all on function public.plans_item_limits(uuid) from public, anon, authenticated;

create or replace function public.plans_items_quota() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  lim bigint; blim bigint; used bigint; bused bigint; nrows bigint; d_data bigint; d_bk bigint;
  n_data bigint := 0; n_bk bigint := 0; o_data bigint := 0; o_bk bigint := 0; sz bigint; new_row boolean := false;
  pw boolean := public.studyboard_paywall();
  item_max constant bigint := 10485760;   -- 10 MB per item
  rows_max constant bigint := 50000;      -- synced items per account
begin
  if current_setting('studyboard.restoring', true) = '1' then return new; end if;
  if pw and new.kind = 'backup' and coalesce(public.studyboard_limit(new.user_id, 'cloudBackupDays'), 0) <= 0 then
    raise exception 'SB_BACKUP_PRO: Online backups are a Pro feature. Your backups on this device are not affected.' using errcode = 'P0001';
  end if;
  sz := octet_length(new.data::text);
  if new.kind = 'backup' then n_bk := sz; else n_data := sz; end if;
  if tg_op = 'INSERT' then
    if exists (select 1 from public.items where user_id = new.user_id and kind = new.kind and id = new.id) then return new; end if;
    new_row := new.kind <> 'backup';
  elsif old.user_id = new.user_id then
    sz := octet_length(old.data::text);
    if old.kind = 'backup' then o_bk := sz; else o_data := sz; end if;
    new_row := new.kind <> 'backup' and old.kind = 'backup';
  else
    new_row := new.kind <> 'backup';
  end if;
  d_data := n_data - o_data; d_bk := n_bk - o_bk;   -- shrinking or deleting is always fine
  if n_data > item_max and d_data > 0 then
    raise exception 'SB_DATA_LIMIT: This item is over the 10 MB storage limit for one item. Make it smaller (for example, move pictures into Files).'
      using errcode = 'P0001';
  end if;
  select coalesce(u.data_bytes, 0), coalesce(u.backup_bytes, 0), coalesce(u.item_rows, 0) into used, bused, nrows
    from (select 1) x left join public.studyboard_usage u on u.user_id = new.user_id;
  if new_row and nrows >= rows_max then
    raise exception 'SB_DATA_LIMIT: Your account has reached the storage limit of % synced items. Delete some old items.', rows_max
      using errcode = 'P0001';
  end if;
  select l.data_mb, l.backup_mb into lim, blim from public.plans_item_limits(new.user_id) l;
  if d_data > 0 then
    if lim is not null and used + d_data > lim * 1048576 then
      if pw then
        raise exception 'SB_DATA_LIMIT: Your synced data is over the % MB storage limit of the free plan. Delete some old items, or go Pro for more room.', lim
          using errcode = 'P0001';
      end if;
      raise exception 'SB_DATA_LIMIT: Your synced data is over the % MB storage limit. Delete some old items or export a backup.', lim
        using errcode = 'P0001';
    end if;
  end if;
  if d_bk > 0 then
    if blim is not null and bused + d_bk > blim * 1048576 then
      raise exception 'SB_DATA_LIMIT: Your online backups are over the % MB storage limit. Your backups on this device are not affected.', blim
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
    perform public.plans_add_usage(old.user_id, case when old.kind = 'backup' then 0 else -sz end, 0, case when old.kind = 'backup' then -sz else 0 end,
      case when old.kind = 'backup' then 0 else -1 end);
  end if;
  if tg_op in ('INSERT', 'UPDATE') then
    sz := octet_length(new.data::text);
    perform public.plans_add_usage(new.user_id, case when new.kind = 'backup' then 0 else sz end, 0, case when new.kind = 'backup' then sz else 0 end,
      case when new.kind = 'backup' then 0 else 1 end);
  end if;
  return null;
end $$;

-- The check above runs before each row
create or replace function public.plans_items_quota_stmt() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare g record; lim bigint; blim bigint; u public.studyboard_usage;
begin
  if current_setting('studyboard.restoring', true) = '1' then return null; end if;
  for g in execute
    'select user_id, sum(s * sz) filter (where kind <> ''backup'') d, sum(s * sz) filter (where kind = ''backup'') b,
            sum(s) filter (where kind <> ''backup'') r
     from (select user_id, kind, octet_length(data::text) sz, 1 s from new_rows'
    || case when tg_op = 'UPDATE' then ' union all select user_id, kind, octet_length(data::text), -1 from old_rows' else '' end
    || ') a group by user_id'
  loop
    if coalesce(g.d, 0) <= 0 and coalesce(g.b, 0) <= 0 and coalesce(g.r, 0) <= 0 then continue; end if;   -- nothing grew
    select * into u from public.studyboard_usage where user_id = g.user_id;
    if not found then continue; end if;
    select l.data_mb, l.backup_mb into lim, blim from public.plans_item_limits(g.user_id) l;
    if (coalesce(g.r, 0) > 0 and u.item_rows > 50000)
       or (coalesce(g.d, 0) > 0 and lim is not null and u.data_bytes > lim * 1048576)
       or (coalesce(g.b, 0) > 0 and blim is not null and u.backup_bytes > blim * 1048576) then
      raise exception 'SB_DATA_LIMIT: Your synced data is over the storage limit. Delete some old items or export a backup.' using errcode = 'P0001';
    end if;
  end loop;
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
  execute 'drop trigger if exists plans_items_quota_ins on public.items';
  execute 'create trigger plans_items_quota_ins after insert on public.items referencing new table as new_rows for each statement execute function public.plans_items_quota_stmt()';
  execute 'drop trigger if exists plans_items_quota_upd on public.items';
  execute 'create trigger plans_items_quota_upd after update on public.items referencing old table as old_rows new table as new_rows for each statement execute function public.plans_items_quota_stmt()';
  insert into public.studyboard_usage (user_id, data_bytes, backup_bytes, item_rows, updated_at)
    select i.user_id, coalesce(sum(octet_length(i.data::text)) filter (where i.kind <> 'backup'), 0),
           coalesce(sum(octet_length(i.data::text)) filter (where i.kind = 'backup'), 0), count(*) filter (where i.kind <> 'backup'), now()
    from public.items i
    where exists (select 1 from auth.users u where u.id = i.user_id) group by i.user_id
  on conflict (user_id) do update set data_bytes = excluded.data_bytes, backup_bytes = excluded.backup_bytes, item_rows = excluded.item_rows, updated_at = now();
end $$;

-- File storage limit (the studioso-files bucket)
create or replace function public.plans_object_owner(p_name text) returns uuid
language sql immutable set search_path = public as $$
  select case when split_part(p_name, '/', 1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
              then split_part(p_name, '/', 1)::uuid end
$$;

create or replace function public.plans_storage_quota() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid; lim bigint; used bigint; delta bigint;
begin
  if new.bucket_id <> 'studioso-files' or current_setting('studyboard.restoring', true) = '1' then return new; end if;
  uid := public.plans_object_owner(new.name);
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

-- Some Supabase projects don't let the SQL Editor add triggers to storage tables
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

-- Study groups: size and message history
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
      case when public.studyboard_limits_pro(owner) then '' else ' The group owner can go Pro for up to ' || coalesce(pro_lim::text, 'unlimited') || ' members.' end
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

-- Deletes messages older than the owner's plan allows (60 days on Free)
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
      and to_jsonb(g) ->> 'deleted_at' is null   -- a deleted group waiting out its 30 days comes back as it was
      and not coalesce(m.pinned, false)   -- pinned messages stay
      and m.created_at < now() - make_interval(days => public.studyboard_limit(g.owner_id, 'groupMsgDays')::int + 30)   -- plus a grace period
    returning 1)
  select count(*) into n from gone;
  return n;
end $$;
revoke all on function public.studyboard_prune_group_messages() from public, anon, authenticated;

-- Run the clean-up every night at 4:17 (UTC), if pg_cron is available in your project
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

-- Free trial started in the app (no card), once per account
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

-- The create-checkout function asks this (service role only) before it offers a Stripe trial
create or replace function public.studyboard_trial_used(p_email text) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce((select exists (select 1 from public.studyboard_trial_uses t where t.email_hash = public.plans_email_hash(p_email))), false)
$$;
revoke all on function public.studyboard_trial_used(text) from public, anon, authenticated;
do $$ begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant execute on function public.studyboard_trial_used(text) to service_role;
  end if;
end $$;

-- Trials already used (by an app or store trial) count too
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

-- Server-only tables for payments, grants and rate limits

-- Which Stripe customer belongs to which account
create table if not exists public.studyboard_billing_customers (
  user_id uuid primary key references auth.users(id) on delete cascade,
  stripe_customer_id text not null unique,
  created_at timestamptz not null default now()
);
-- Payment events already handled, so a repeated or replayed event can't grant
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
-- Who gave Pro to whom, when, for how long and why (see studyboard_grant_pro below)
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
-- Per-account counters for the Edge Functions (checkout, portal, entitlement token)
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

-- Counts one use of "key" in the current window
create or replace function public.studyboard_plan_rate_hit(p_key text, p_max int, p_window int) returns boolean
language plpgsql volatile security definer set search_path = '' as $$
declare b timestamptz := to_timestamp(floor(extract(epoch from now()) / greatest(p_window, 1)) * greatest(p_window, 1)); c int;
begin
  insert into public.studyboard_plan_rate as r (key, bucket, n) values (left(p_key, 200), b, 1)
    on conflict (key, bucket) do update set n = r.n + 1 returning n into c;
  return c <= p_max;
end $$;

-- Deletes online backups older than the owner's plan keeps them
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
      and i.updated_at < now() - make_interval(days => greatest(public.studyboard_limit(i.user_id, 'cloudBackupDays'), 0)::int + 30)
      and not exists (select 1 from public.studyboard_entitlements e where e.user_id = i.user_id
        and greatest(e.updated_at, case when e.pro_until <= now() then e.pro_until end, case when e.grant_until <= now() then e.grant_until end,
                     case when e.trial_until <= now() then e.trial_until end) > now() - interval '30 days')
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

-- Payments become Pro here
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
  v_paid boolean := coalesce((p ->> 'paid')::boolean, false);   -- money was taken (not a trial): counts for Founders and Early Supporters
  v_term text := p ->> 'term';
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
    if r.plan = 'lifetime' and v_state <> 'revoke' and v_state <> 'lifetime' then v_out := 'kept lifetime'; exit blk; end if;
    if r.billing_revoked_at is not null and v_state in ('active', 'extend', 'lifetime') and not (v_fresh and v_at > r.billing_revoked_at) then
      v_out := 'ignored: revoked'; exit blk;
    end if;
    if v_cur_live and v_cur_family is not null and v_cur_family <> v_family then
      if v_state in ('ended', 'renew_off', 'revoke') then v_out := 'kept other source'; exit blk; end if;
      if v_state in ('active', 'extend') and (r.pro_until is null or v_until is null or v_until <= r.pro_until) then v_out := 'kept other source'; exit blk; end if;
    end if;
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
  -- Founders and Early Supporters (below). A problem there must never stop a payment from counting
  if v_uid is not null and (v_out = 'revoked' or (v_paid and v_out not like 'ignored%' and v_out not like 'rejected%')) then
    begin
      if v_out = 'revoked' then perform public.plans_early_revoke(v_uid);
      else perform public.plans_early_claim(v_uid, v_term, v_source); end if;
    exception when undefined_function then null;
    when others then raise warning 'studyboard: early supporter step skipped: %', sqlerrm;
    end;
  end if;
  return v_out;
end $$;

-- For you in the SQL Editor
create or replace function public.plans_deny_clients() returns void
language plpgsql stable set search_path = '' as $$
declare c text := nullif(current_setting('request.jwt.claims', true), '');
begin
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

-- Older versions of this file gave Pro by writing the plan itself
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

-- Pro groups (1.16)
create table if not exists public.group_pro (
  group_id uuid primary key references public.study_groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index if not exists group_pro_user_idx on public.group_pro (user_id);
alter table public.group_pro enable row level security;
drop policy if exists "group pro member read" on public.group_pro;
create policy "group pro member read" on public.group_pro for select to authenticated using (public.sbg_is_member(group_id));
revoke all on public.group_pro from anon, authenticated;
grant select on public.group_pro to authenticated;

create or replace function public.plans_group_is_pro(gid uuid) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select not public.studyboard_paywall()
      or exists (select 1 from public.group_pro p join public.group_members m on m.group_id = p.group_id and m.user_id = p.user_id
                 where p.group_id = gid and public.studyboard_limits_pro(p.user_id))
$$;
-- The app asks which of your groups are Pro, and who unlocked them
create or replace function public.group_pro_status(p_groups uuid[]) returns table (group_id uuid, active boolean, by_user uuid, by_owner boolean)
language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  return query
    select g.id, public.plans_group_is_pro(g.id),
           (select p.user_id from public.group_pro p where p.group_id = g.id),
           exists (select 1 from public.group_pro p where p.group_id = g.id and p.user_id = g.owner_id)   -- by_owner: the owner assigned it
    from public.study_groups g
    where g.id = any (coalesce(p_groups, '{}')) and public.sbg_is_member(g.id)
    limit 200;
end $$;
-- Unlock (p_on true) or stop unlocking (false) a group you're in
create or replace function public.group_pro_set(p_group uuid, p_on boolean) returns text
language plpgsql security definer set search_path = public, pg_temp as $$
declare me uuid := auth.uid(); cur uuid;
begin
  if me is null then raise exception 'Sign in first'; end if;
  if not public.sbg_is_member(p_group) then raise exception 'You''re not in that group'; end if;
  perform pg_advisory_xact_lock(hashtextextended('sb-grppro:' || me::text, 0));
  if not coalesce(p_on, false) then
    delete from public.group_pro where group_id = p_group and user_id = me;
    return 'off';
  end if;
  if public.studyboard_paywall() and not public.studyboard_limits_pro(me) then
    if public.studyboard_is_pro(me) then
      raise exception 'SB_PRO_NEEDED: Pro groups come with a Pro plan. The free week doesn''t include them, so your groups don''t change when it ends.' using errcode = 'P0001';
    end if;
    raise exception 'SB_PRO_NEEDED: Making a Pro group is part of Studyboard Pro.' using errcode = 'P0001';
  end if;
  select user_id into cur from public.group_pro where group_id = p_group;
  if cur = me then return 'on'; end if;
  if cur is not null and exists (select 1 from public.group_members m where m.group_id = p_group and m.user_id = cur) and public.studyboard_limits_pro(cur) then
    raise exception 'SB_ALREADY_PRO: Someone else already made this a Pro group.' using errcode = 'P0001';
  end if;
  if (select count(*) from public.group_pro p join public.group_members m on m.group_id = p.group_id and m.user_id = p.user_id where p.user_id = me) >= 5 then
    raise exception 'SB_PRO_GROUPS_FULL: You''ve assigned Pro to 5 groups. Unassign one first.' using errcode = 'P0001';
  end if;
  insert into public.group_pro (group_id, user_id) values (p_group, me)
    on conflict (group_id) do update set user_id = excluded.user_id, created_at = now();
  return 'on';
end $$;
-- Once, when owning a group stopped making it Pro
do $$
begin
  if not exists (select 1 from public.studyboard_config where key = 'group_pro_owner_assigned') then
    insert into public.group_pro (group_id, user_id)
    select x.id, x.owner_id from (
      select g.id, g.owner_id, row_number() over (partition by g.owner_id order by g.created_at, g.id) as k,
             (select count(*) from public.group_pro p where p.user_id = g.owner_id) as had
      from public.study_groups g
      where public.studyboard_is_pro(g.owner_id) and not exists (select 1 from public.group_pro p where p.group_id = g.id)
    ) x where x.k + x.had <= 5
    on conflict (group_id) do nothing;
    insert into public.studyboard_config (key, value) values ('group_pro_owner_assigned', 'true'::jsonb) on conflict (key) do nothing;
  end if;
end $$;
revoke all on function public.plans_group_is_pro(uuid), public.group_pro_status(uuid[]), public.group_pro_set(uuid, boolean) from public, anon, authenticated;
grant execute on function public.group_pro_status(uuid[]), public.group_pro_set(uuid, boolean) to authenticated;

-- Group size and message history follow the group (Pro group or not), not just its owner
create or replace function public.plans_group_member_limit() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare lim bigint; tier text;
begin
  if not public.studyboard_paywall() then return new; end if;
  perform pg_advisory_xact_lock(hashtextextended('sb-group:' || new.group_id::text, 0));   -- two people joining at once can't both take the last seat
  if not exists (select 1 from public.study_groups g where g.id = new.group_id) then return new; end if;
  tier := case when public.plans_group_is_pro(new.group_id) then 'pro' else 'free' end;
  select (coalesce(value, '{}'::jsonb) -> tier ->> 'groupMembers')::bigint into lim from public.studyboard_config where key = 'limits';
  if lim is null then lim := case when tier = 'pro' then 100 else 3 end; end if;
  if (select count(*) from public.group_members where group_id = new.group_id) >= lim then
    raise exception 'This group is full (% members).%', lim,
      case when tier = 'pro' then '' else ' A member with Pro can make it a Pro group for up to 100 members.' end
      using errcode = 'P0001';
  end if;
  return new;
end $$;

create or replace function public.studyboard_prune_group_messages() returns integer
language plpgsql security definer set search_path = public, pg_temp as $$
declare n integer := 0; days int;
begin
  if not public.studyboard_paywall() or to_regclass('public.group_messages') is null then return 0; end if;
  select (value -> 'free' ->> 'groupMsgDays')::int into days from public.studyboard_config where key = 'limits';
  days := coalesce(days, 60);
  with gone as (
    delete from public.group_messages m
    where not public.plans_group_is_pro(m.group_id)
      and not exists (select 1 from public.study_groups g where g.id = m.group_id and to_jsonb(g) ->> 'deleted_at' is not null)   -- a deleted group waiting out its 30 days comes back as it was
      and not coalesce(m.pinned, false)   -- pinned messages stay
      and m.created_at < now() - make_interval(days => days + 30)   -- plus a grace period
    returning 1)
  select count(*) into n from gone;
  return n;
end $$;

-- Supporter badge
do $$
begin
  if to_regclass('public.group_members') is not null then
    execute 'alter table public.group_members add column if not exists badge boolean not null default false';
    execute 'alter table public.group_members add column if not exists badge_kind text';
  end if;
end $$;
create or replace function public.plans_early_kind(p_uid uuid) returns text
language sql stable security definer set search_path = public, pg_temp as $$ select null::text $$;   -- replaced below, once its table exists
-- Its kind: founder, early (an Early Supporter) or pro. Founders and Early Supporters keep theirs after Pro ends
create or replace function public.set_supporter_badge(p_on boolean) returns boolean
language plpgsql security definer set search_path = public, pg_temp as $$
declare me uuid := auth.uid(); v boolean; k text;
begin
  if me is null then raise exception 'Sign in first'; end if;
  k := case when to_regprocedure('public.plans_early_kind(uuid)') is not null then public.plans_early_kind(me) end;
  v := coalesce(p_on, false) and (k is not null or not public.studyboard_paywall() or public.studyboard_is_pro(me));
  k := case when v then coalesce(k, 'pro') end;
  update public.group_members set badge = v, badge_kind = k where user_id = me and (badge is distinct from v or badge_kind is distinct from k);
  return v;
end $$;
-- A badge stays only while its owner has Pro, or is a Founder or Early Supporter (run nightly, below)
create or replace function public.plans_badge_tidy() returns integer
language plpgsql security definer set search_path = public, pg_temp as $$
declare n integer;
begin
  if not public.studyboard_paywall() then return 0; end if;
  update public.group_members set badge = false, badge_kind = null where badge and not public.studyboard_is_pro(user_id) and public.plans_early_kind(user_id) is null;
  get diagnostics n = row_count; return n;
end $$;
revoke all on function public.set_supporter_badge(boolean), public.plans_badge_tidy() from public, anon, authenticated;
grant execute on function public.set_supporter_badge(boolean) to authenticated;
-- The badge column is written only through set_supporter_badge
revoke update (badge) on public.group_members from authenticated;

-- Group uploads
create or replace function public.plans_group_of_object(p_name text) returns uuid
language sql immutable set search_path = public as $$
  select case when split_part(p_name, '/', 2) = 'g' and split_part(p_name, '/', 3) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
              then split_part(p_name, '/', 3)::uuid end
$$;
create or replace function public.sbg_group_file_ok(p_name text) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select public.plans_group_of_object(p_name) is not null and public.sbg_is_member(public.plans_group_of_object(p_name))
$$;
create or replace function public.plans_group_upload() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare gid uuid; used bigint; delta bigint;
begin
  if new.bucket_id <> 'studioso-files' then return new; end if;
  gid := public.plans_group_of_object(new.name);
  if gid is null then return new; end if;
  if public.plans_object_owner(new.name) is distinct from auth.uid() and auth.uid() is not null then
    raise exception 'SB_STORAGE_PATH: Files are stored in your own folder.' using errcode = 'P0001';
  end if;
  if auth.uid() is not null and not public.sbg_is_member(gid) then raise exception 'You''re not in that group' using errcode = 'P0001'; end if;
  if not public.plans_group_is_pro(gid) then
    raise exception 'SB_GROUP_PRO: Uploading files to a group is part of Pro groups.' using errcode = 'P0001';
  end if;
  delta := coalesce((new.metadata ->> 'size')::bigint, 0) - case when tg_op = 'UPDATE' then coalesce((old.metadata ->> 'size')::bigint, 0) else 0 end;
  if delta <= 0 then return new; end if;
  select coalesce(sum((o.metadata ->> 'size')::bigint), 0) into used from storage.objects o
    where o.bucket_id = 'studioso-files' and split_part(o.name, '/', 2) = 'g' and split_part(o.name, '/', 3) = gid::text and o.id is distinct from new.id;
  if used + delta > 2048::bigint * 1048576 then
    raise exception 'SB_GROUP_STORAGE: This group''s uploads are full (2 GB). Remove some files first.' using errcode = 'P0001';
  end if;
  return new;
end $$;
revoke all on function public.plans_group_of_object(text), public.sbg_group_file_ok(text), public.plans_group_upload() from public, anon, authenticated;
do $$
begin
  begin
    execute 'drop trigger if exists plans_group_upload on storage.objects';
    execute 'create trigger plans_group_upload before insert or update on storage.objects for each row execute function public.plans_group_upload()';
    execute 'drop policy if exists "group files member read" on storage.objects';
    execute 'create policy "group files member read" on storage.objects for select to authenticated using (bucket_id = ''studioso-files'' and public.sbg_group_file_ok(name))';
  exception when insufficient_privilege then
    raise notice 'Skipped the group upload rules (no permission on storage.objects). Group uploads stay off; everything else works.';
  end;
end $$;
grant execute on function public.sbg_group_file_ok(text) to authenticated;

do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule(jobid) from cron.job where jobname = 'studyboard-badge-tidy';
    perform cron.schedule('studyboard-badge-tidy', '41 4 * * *', 'select public.plans_badge_tidy()');
  end if;
end $$;

-- Promo codes
create table if not exists public.studyboard_promo_codes (
  id bigint generated always as identity primary key,
  code_hash text not null unique,
  hint text not null default '',
  kind text not null check (kind in ('forever', 'month')),
  max_uses int check (max_uses is null or max_uses > 0),     -- null: no limit
  uses int not null default 0,
  valid_until timestamptz,                                    -- redeemable until (null: no deadline)
  disabled boolean not null default false,
  note text,
  created_at timestamptz not null default now()
);
create table if not exists public.studyboard_promo_redemptions (
  code_id bigint not null references public.studyboard_promo_codes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  redeemed_at timestamptz not null default now(),
  until timestamptz,                                          -- null: for good
  primary key (code_id, user_id)
);
alter table public.studyboard_promo_codes enable row level security;
alter table public.studyboard_promo_redemptions enable row level security;
revoke all on public.studyboard_promo_codes, public.studyboard_promo_redemptions from public, anon, authenticated;

-- One spelling for every code
create or replace function public.plans_promo_norm(p text) returns text
language sql immutable set search_path = '' as $$ select regexp_replace(upper(coalesce(p, '')), '[^A-Z0-9]', '', 'g') $$;
create or replace function public.plans_promo_hash(p text) returns text
language sql immutable set search_path = '' as $$ select encode(sha256(convert_to('studyboard-promo|' || public.plans_promo_norm(p), 'UTF8')), 'hex') $$;

-- Make a code you choose (4 to 40 letters and digits)
create or replace function public.studyboard_make_code(p_code text, p_kind text, p_max_uses int default 1, p_valid_days int default null, p_note text default null) returns text
language plpgsql volatile security definer set search_path = '' as $$
declare n text := public.plans_promo_norm(p_code);
begin
  perform public.plans_deny_clients();
  if p_kind is null or p_kind not in ('forever', 'month') then raise exception 'kind must be forever or month'; end if;
  if char_length(n) < 4 or char_length(n) > 40 then raise exception 'a code needs 4 to 40 letters or digits'; end if;
  if p_valid_days is not null and p_valid_days < 1 then raise exception 'valid days must be at least 1, or null'; end if;
  insert into public.studyboard_promo_codes (code_hash, hint, kind, max_uses, valid_until, note)
  values (public.plans_promo_hash(n), right(n, 4), p_kind, p_max_uses, case when p_valid_days is null then null else now() + make_interval(days => p_valid_days) end, left(p_note, 300));
  return n;
end $$;

-- Make random codes (SB-XXXX-XXXX-XXXX, no look-alike letters)
create or replace function public.studyboard_make_codes(p_kind text, p_count int default 1, p_max_uses int default 1, p_valid_days int default null, p_note text default null)
returns table (code text, kind text, max_uses int, redeemable_until timestamptz)
language plpgsql volatile security definer set search_path = '' as $$
declare a constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; raw bytea; c text; i int; k int;
begin
  perform public.plans_deny_clients();
  if p_count is null or p_count < 1 or p_count > 500 then raise exception 'make 1 to 500 codes at a time'; end if;
  for k in 1 .. p_count loop
    raw := decode(replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''), 'hex');
    c := 'SB';
    for i in 0 .. 11 loop c := c || substr(a, (get_byte(raw, i) % 32) + 1, 1); end loop;
    perform public.studyboard_make_code(c, p_kind, p_max_uses, p_valid_days, p_note);
    code := 'SB-' || substr(c, 3, 4) || '-' || substr(c, 7, 4) || '-' || substr(c, 11, 4);
    kind := p_kind; max_uses := p_max_uses;
    redeemable_until := case when p_valid_days is null then null else now() + make_interval(days => p_valid_days) end;
    return next;
  end loop;
end $$;

create or replace function public.studyboard_list_codes()
returns table (id bigint, hint text, kind text, uses int, max_uses int, redeemable_until timestamptz, disabled boolean, note text, created_at timestamptz)
language plpgsql stable security definer set search_path = '' as $$
begin
  perform public.plans_deny_clients();
  return query select c.id, '…' || c.hint, c.kind, c.uses, c.max_uses, c.valid_until, c.disabled, c.note, c.created_at from public.studyboard_promo_codes c order by c.created_at desc;
end $$;

create or replace function public.studyboard_disable_code(p_code text) returns text
language plpgsql volatile security definer set search_path = '' as $$
begin
  perform public.plans_deny_clients();
  update public.studyboard_promo_codes set disabled = true where code_hash = public.plans_promo_hash(p_code);
  return case when found then 'Disabled. Nobody new can redeem it; people who already did keep what it gave them.' else 'No such code' end;
end $$;

create or replace function public.studyboard_revoke_promo(p_email text) returns text
language plpgsql volatile security definer set search_path = '' as $$
declare uid uuid;
begin
  perform public.plans_deny_clients();
  select id into uid from auth.users where lower(email) = lower(btrim(p_email));
  if uid is null then return 'No account uses ' || coalesce(p_email, '(nothing)'); end if;
  update public.studyboard_entitlements set promo_until = null, promo_lifetime = false, updated_at = now() where user_id = uid;
  return 'Promo Pro is removed for ' || p_email || ' (a paid plan or a grant, if there is one, is not touched)';
end $$;

-- Redeem (the app calls this, signed in)
create or replace function public.studyboard_redeem_code(p_code text) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare me uuid := auth.uid(); c record; until timestamptz; cur timestamptz;
begin
  if me is null then return jsonb_build_object('error', 'sign_in'); end if;
  if not public.studyboard_plan_rate_hit('promo:' || me::text, 10, 3600) then return jsonb_build_object('error', 'slow_down'); end if;
  select * into c from public.studyboard_promo_codes where code_hash = public.plans_promo_hash(p_code) for update;
  if not found or c.disabled then return jsonb_build_object('error', 'invalid'); end if;
  if c.valid_until is not null and c.valid_until < now() then return jsonb_build_object('error', 'expired'); end if;
  if exists (select 1 from public.studyboard_promo_redemptions r where r.code_id = c.id and r.user_id = me) then return jsonb_build_object('error', 'already'); end if;
  if (to_jsonb(c) ->> 'owner_id') = me::text then return jsonb_build_object('error', 'own_code'); end if;   -- a friend code is for a friend
  if c.max_uses is not null and c.uses >= c.max_uses then return jsonb_build_object('error', 'used_up'); end if;
  if c.kind = 'forever' then
    insert into public.studyboard_entitlements as e (user_id, plan, will_renew, promo_lifetime, updated_at) values (me, 'free', false, true, now())
    on conflict (user_id) do update set promo_lifetime = true, updated_at = now();
    until := null;
  else
    select e.promo_until into cur from public.studyboard_entitlements e where e.user_id = me;
    until := greatest(coalesce(cur, now()), now()) + interval '1 month';
    insert into public.studyboard_entitlements as e (user_id, plan, will_renew, promo_until, updated_at) values (me, 'free', false, until, now())
    on conflict (user_id) do update set promo_until = until, updated_at = now();
  end if;
  update public.studyboard_promo_codes set uses = uses + 1 where id = c.id;
  insert into public.studyboard_promo_redemptions (code_id, user_id, until) values (c.id, me, until);
  return jsonb_build_object('ok', true, 'kind', c.kind, 'until', until);
end $$;

-- Founders and Early Supporters (PRO-PLANS-GUIDE.md, "Founders and Early Supporters")
-- Off until you run: select public.studyboard_early_program(true);
-- While on, the first paid Pro sign-ups (not trials, codes or gifts) are numbered:
--   * the first 100 (any plan) are Early Supporters: a badge in groups and one-month Pro codes for friends;
--   * the first 10 on a semester or yearly plan are Founders: a Founder badge, and they suggest up to 3 themes,
--     you build one into Studyboard for every Pro user, and its Founder keeps it even after their Pro ends.
-- A refund or a disputed payment takes the place away and gives it to the next person in line (who paid while the places
-- were full, and still pays). Cancelling without a refund doesn't: the badge and the theme stay.
insert into public.studyboard_config (key, value) values
  ('early_program', '{"on": false, "founders": 10, "supporters": 100, "friendCodes": 3}'::jsonb)
on conflict (key) do nothing;

create table if not exists public.studyboard_early_supporters (
  user_id uuid primary key references auth.users(id) on delete cascade,
  founder boolean not null default false,
  term text check (term is null or term in ('monthly', 'semester', 'yearly')),
  source text,                                    -- stripe, apple, google, revenuecat, or manual (added by you)
  joined_at timestamptz not null default now(),   -- the order people are numbered in
  founder_at timestamptz,
  revoked_at timestamptz,                         -- refunded or removed: the place went to the next in line
  waiting boolean not null default false,         -- paid while every place was taken: next in line, in joined_at order
  long_at timestamptz                             -- first paid for a semester or yearly plan (the line for a Founder place)
);
alter table public.studyboard_early_supporters add column if not exists waiting boolean not null default false;
alter table public.studyboard_early_supporters add column if not exists long_at timestamptz;
create index if not exists studyboard_early_supporters_order_idx on public.studyboard_early_supporters (joined_at, user_id) where revoked_at is null and not waiting;
-- Friend codes (the codes themselves, so their owner can see and share them)
create table if not exists public.studyboard_early_codes (
  code_id bigint primary key references public.studyboard_promo_codes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  code text not null,
  created_at timestamptz not null default now()
);
create index if not exists studyboard_early_codes_user_idx on public.studyboard_early_codes (user_id);
-- A friend code can't be redeemed by the person it was given to
alter table public.studyboard_promo_codes add column if not exists owner_id uuid references auth.users(id) on delete set null;
-- Founder theme suggestions
create table if not exists public.studyboard_founder_themes (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  slot smallint not null check (slot between 1 and 3),
  name text not null check (char_length(name) between 1 and 40),
  description text not null check (char_length(description) between 1 and 500),
  status text not null default 'suggested' check (status in ('suggested', 'picked')),
  theme_id text check (theme_id is null or theme_id ~ '^[a-z0-9-]{2,40}$'),   -- the theme's id in the app, once you build it
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, slot)
);
do $$
declare t text;
begin
  foreach t in array array['studyboard_early_supporters', 'studyboard_early_codes', 'studyboard_founder_themes'] loop
    execute format('alter table public.%I enable row level security', t);   -- no policies: the app reads these through the functions below
    execute format('revoke all on public.%I from public, anon, authenticated', t);
    if exists (select 1 from pg_roles where rolname = 'service_role') then execute format('grant all on public.%I to service_role', t); end if;
  end loop;
end $$;
do $$
begin
  if to_regclass('public.group_members') is not null then
    execute 'alter table public.group_members add column if not exists badge_kind text';
    execute 'alter table public.group_members drop constraint if exists group_members_badge_kind_check';
    execute 'alter table public.group_members add constraint group_members_badge_kind_check check (badge_kind is null or badge_kind in (''pro'', ''early'', ''founder''))';
  end if;
end $$;

create or replace function public.plans_early_cfg() returns jsonb
language sql stable security definer set search_path = public, pg_temp as $$
  select '{"on": false, "founders": 10, "supporters": 100, "friendCodes": 3}'::jsonb || coalesce((select value from public.studyboard_config where key = 'early_program' and jsonb_typeof(value) = 'object'), '{}'::jsonb)
$$;
create or replace function public.plans_early_on() returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce((public.plans_early_cfg() ->> 'on')::boolean, false)
$$;
-- 'founder', 'early' or null
create or replace function public.plans_early_kind(p_uid uuid) returns text
language sql stable security definer set search_path = public, pg_temp as $$
  select case when s.founder then 'founder' else 'early' end from public.studyboard_early_supporters s where s.user_id = p_uid and s.revoked_at is null and not s.waiting
$$;

-- Puts the right badge on someone's group rows (after joining, a refund or a change of plan)
create or replace function public.plans_early_badges(p_uid uuid) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare k text := public.plans_early_kind(p_uid); keep boolean;
begin
  if to_regclass('public.group_members') is null then return; end if;
  keep := k is not null or not public.studyboard_paywall() or public.studyboard_is_pro(p_uid);
  update public.group_members set badge = badge and keep, badge_kind = case when badge and keep then coalesce(k, 'pro') end
    where user_id = p_uid and (badge_kind is distinct from case when badge and keep then coalesce(k, 'pro') end or (badge and not keep));
end $$;

-- Gives someone their friend codes (once per person, ever)
create or replace function public.plans_early_codes(p_uid uuid) returns integer
language plpgsql security definer set search_path = public, pg_temp as $$
declare n int := least(greatest(coalesce((public.plans_early_cfg() ->> 'friendCodes')::int, 3), 0), 10); c record; made int := 0;
begin
  if n = 0 or exists (select 1 from public.studyboard_early_codes where user_id = p_uid) then return 0; end if;
  for c in select * from public.studyboard_make_codes('month', n, 1, 365, 'Friend code from an Early Supporter') loop
    update public.studyboard_promo_codes set owner_id = p_uid where code_hash = public.plans_promo_hash(c.code);
    insert into public.studyboard_early_codes (code_id, user_id, code)
      select p.id, p_uid, c.code from public.studyboard_promo_codes p where p.code_hash = public.plans_promo_hash(c.code);
    made := made + 1;
  end loop;
  return made;
end $$;

-- Still paying for Pro (a gift, code or trial doesn't count): only they move up the line
create or replace function public.plans_early_paying(p_uid uuid) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from public.studyboard_entitlements e where e.user_id = p_uid and e.billing_revoked_at is null
                 and (e.plan = 'lifetime' or (e.plan = 'pro' and (e.pro_until is null or e.pro_until > now()))))
$$;

-- Gives open places to the next in line: a Founder place to the first Early Supporter (or waiting person) on a semester or
-- yearly plan, by when they first paid for one; an Early Supporter place to the first person waiting, by when they paid
create or replace function public.plans_early_fill() returns integer
language plpgsql security definer set search_path = public, pg_temp as $$
declare cfg jsonb := public.plans_early_cfg(); r public.studyboard_early_supporters; moved int := 0;
begin
  perform pg_advisory_xact_lock(hashtextextended('sb-early', 0));
  loop
    exit when (select count(*) from public.studyboard_early_supporters where revoked_at is null and not waiting and founder) >= (cfg ->> 'founders')::int;
    select * into r from public.studyboard_early_supporters s
      where s.revoked_at is null and not s.founder and s.long_at is not null and public.plans_early_paying(s.user_id)
      order by s.long_at, s.joined_at, s.user_id limit 1 for update;
    exit when not found;
    update public.studyboard_early_supporters set founder = true, founder_at = clock_timestamp(), waiting = false where user_id = r.user_id;
    if r.waiting then perform public.plans_early_codes(r.user_id); end if;
    perform public.plans_early_badges(r.user_id);
    moved := moved + 1;
  end loop;
  loop
    exit when (select count(*) from public.studyboard_early_supporters where revoked_at is null and not waiting) >= (cfg ->> 'supporters')::int;
    select * into r from public.studyboard_early_supporters s
      where s.revoked_at is null and s.waiting and public.plans_early_paying(s.user_id)
      order by s.joined_at, s.user_id limit 1 for update;
    exit when not found;
    update public.studyboard_early_supporters set waiting = false where user_id = r.user_id;
    perform public.plans_early_codes(r.user_id);
    perform public.plans_early_badges(r.user_id);
    moved := moved + 1;
  end loop;
  return moved;
end $$;

-- A paid sign-up takes a place if one is left, or joins the line (called by studyboard_apply_billing, or by you with p_force)
create or replace function public.plans_early_claim(p_uid uuid, p_term text, p_source text, p_force boolean default false, p_founder boolean default null) returns text
language plpgsql security definer set search_path = public, pg_temp as $$
declare cfg jsonb := public.plans_early_cfg(); r public.studyboard_early_supporters; nf int; ns int; long boolean; f boolean; t text; was boolean;
begin
  if p_uid is null or not (p_force or coalesce((cfg ->> 'on')::boolean, false)) then return 'off'; end if;
  perform pg_advisory_xact_lock(hashtextextended('sb-early', 0));   -- two payments at once can't both take the last place
  t := case when p_term in ('monthly', 'semester', 'yearly') then p_term end;
  long := t in ('semester', 'yearly');
  select count(*) filter (where founder), count(*) into nf, ns from public.studyboard_early_supporters where revoked_at is null and not waiting;
  select * into r from public.studyboard_early_supporters where user_id = p_uid for update;
  was := found and r.revoked_at is null;
  if was and not r.waiting then
    -- Already in: an Early Supporter who moves to a semester or yearly plan becomes a Founder if a place is left
    if long and r.long_at is null then update public.studyboard_early_supporters set long_at = clock_timestamp() where user_id = p_uid; end if;
    if r.founder or not coalesce(p_founder, long) or (not p_force and nf >= (cfg ->> 'founders')::int) then return 'kept'; end if;
    update public.studyboard_early_supporters set founder = true, founder_at = clock_timestamp(), term = coalesce(t, term) where user_id = p_uid;
    perform public.plans_early_badges(p_uid);
    return 'founder';
  end if;
  f := coalesce(p_founder, long and nf < (cfg ->> 'founders')::int);
  if not p_force and not f and ns >= (cfg ->> 'supporters')::int then
    -- Every place is taken: wait in line (a renewal keeps their spot in it)
    if was then
      update public.studyboard_early_supporters set term = coalesce(t, term), long_at = coalesce(long_at, case when long then clock_timestamp() end) where user_id = p_uid;
    else
      insert into public.studyboard_early_supporters as s (user_id, founder, term, source, joined_at, long_at, revoked_at, waiting)
      values (p_uid, false, t, left(p_source, 20), clock_timestamp(), case when long then clock_timestamp() end, null, true)
      on conflict (user_id) do update set founder = false, term = excluded.term, source = excluded.source, joined_at = excluded.joined_at,
        long_at = excluded.long_at, founder_at = null, revoked_at = null, waiting = true;
    end if;
    return 'waiting';
  end if;
  if was then   -- from the line straight into a place
    update public.studyboard_early_supporters set waiting = false, founder = f, founder_at = case when f then clock_timestamp() end, term = coalesce(t, term),
      long_at = coalesce(long_at, case when long then clock_timestamp() end) where user_id = p_uid;
  else
    insert into public.studyboard_early_supporters as s (user_id, founder, term, source, joined_at, founder_at, long_at, revoked_at, waiting)
    values (p_uid, f, t, left(p_source, 20), clock_timestamp(), case when f then clock_timestamp() end, case when long then clock_timestamp() end, null, false)
    on conflict (user_id) do update set founder = excluded.founder, term = excluded.term, source = excluded.source, joined_at = excluded.joined_at,
      founder_at = excluded.founder_at, long_at = excluded.long_at, revoked_at = null, waiting = false;
  end if;
  perform public.plans_early_codes(p_uid);
  perform public.plans_early_badges(p_uid);
  return case when f then 'founder' else 'supporter' end;
end $$;

-- A refund or a lost dispute takes the place (or the spot in line) away, the friend codes nobody used stop working,
-- and the place goes to the next in line
create or replace function public.plans_early_revoke(p_uid uuid) returns text
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  update public.studyboard_early_supporters set revoked_at = now(), founder = false, waiting = false where user_id = p_uid and revoked_at is null;
  if not found then return 'not in'; end if;
  update public.studyboard_promo_codes p set disabled = true from public.studyboard_early_codes c where c.code_id = p.id and c.user_id = p_uid and p.uses = 0;
  perform public.plans_early_badges(p_uid);
  perform public.plans_early_fill();
  return 'revoked';
end $$;

-- The app: how many places are left (no account needed)
create or replace function public.studyboard_early_status() returns jsonb
language sql stable security definer set search_path = public, pg_temp as $$
  select case when not coalesce((c ->> 'on')::boolean, false) then jsonb_build_object('on', false) else jsonb_build_object('on', true,
    'founders', (c ->> 'founders')::int, 'supporters', (c ->> 'supporters')::int,
    'foundersLeft', greatest((c ->> 'founders')::int - (select count(*) from public.studyboard_early_supporters where revoked_at is null and not waiting and founder), 0),
    'supportersLeft', greatest((c ->> 'supporters')::int - (select count(*) from public.studyboard_early_supporters where revoked_at is null and not waiting), 0)) end
  from (select public.plans_early_cfg() as c) x
$$;

-- The app: your own place, friend codes and theme suggestions
create or replace function public.studyboard_my_early() returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare me uuid := auth.uid(); r public.studyboard_early_supporters; st jsonb := public.studyboard_early_status();
begin
  if me is null then return st || jsonb_build_object('member', false); end if;
  select * into r from public.studyboard_early_supporters where user_id = me and revoked_at is null and not waiting;
  if not found then return st || jsonb_build_object('member', false); end if;
  return st || jsonb_build_object('member', true, 'founder', r.founder, 'term', r.term, 'since', r.joined_at,
    'number', (select count(*) from public.studyboard_early_supporters s where s.revoked_at is null and not s.waiting and (s.joined_at, s.user_id) <= (r.joined_at, r.user_id)),
    'founderNumber', case when r.founder then (select count(*) from public.studyboard_early_supporters s where s.revoked_at is null and not s.waiting and s.founder
                                                  and (s.founder_at, s.user_id) <= (r.founder_at, r.user_id)) end,
    'codes', coalesce((select jsonb_agg(jsonb_build_object('code', c.code, 'used', p.uses >= coalesce(p.max_uses, 1), 'off', p.disabled,
                                                           'until', p.valid_until) order by c.created_at, c.code_id)
                       from public.studyboard_early_codes c join public.studyboard_promo_codes p on p.id = c.code_id where c.user_id = me), '[]'::jsonb),
    'themes', coalesce((select jsonb_agg(jsonb_build_object('slot', t.slot, 'name', t.name, 'description', t.description, 'status', t.status, 'themeId', t.theme_id) order by t.slot)
                        from public.studyboard_founder_themes t where t.user_id = me), '[]'::jsonb),
    'keep', coalesce((select jsonb_agg(t.theme_id) from public.studyboard_founder_themes t where t.user_id = me and t.status = 'picked' and t.theme_id is not null), '[]'::jsonb));
end $$;

-- The app: a Founder saves (or clears, with an empty name) one of their 3 suggestions
create or replace function public.founder_theme_save(p_slot int, p_name text, p_description text) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare me uuid := auth.uid(); n text; d text;
begin
  if me is null then raise exception 'SB_AUTH: Sign in first, then try again.' using errcode = 'P0001'; end if;
  if not public.studyboard_plan_rate_hit('founder-theme:' || me::text, 30, 3600) then raise exception 'SB_SLOW_DOWN: That''s a lot of changes. Try again in a while.' using errcode = 'P0001'; end if;
  if public.plans_early_kind(me) is distinct from 'founder' then raise exception 'SB_NOT_FOUNDER: Theme suggestions are for Studyboard''s Founders.' using errcode = 'P0001'; end if;
  if p_slot is null or p_slot not between 1 and 3 then raise exception 'SB_BAD_SLOT: Pick suggestion 1, 2 or 3.' using errcode = 'P0001'; end if;
  if exists (select 1 from public.studyboard_founder_themes where user_id = me and status = 'picked') then
    raise exception 'SB_FOUNDER_PICKED: One of your themes has already been picked, so your suggestions are final.' using errcode = 'P0001';
  end if;
  n := btrim(regexp_replace(regexp_replace(coalesce(p_name, ''), '[[:cntrl:]]', ' ', 'g'), '\s+', ' ', 'g'));
  d := btrim(regexp_replace(regexp_replace(regexp_replace(coalesce(p_description, ''), E'\r\n?', E'\n', 'g'), E'[\\x01-\\x09\\x0B-\\x1F\\x7F]', ' ', 'g'), E'\n{3,}', E'\n\n', 'g'));
  if n = '' then
    delete from public.studyboard_founder_themes where user_id = me and slot = p_slot;
    return jsonb_build_object('ok', true, 'removed', true);
  end if;
  if char_length(n) > 40 then raise exception 'SB_TOO_LONG: Keep the name to 40 characters.' using errcode = 'P0001'; end if;
  if d = '' then raise exception 'SB_NEED_DESC: Add a short description of the theme.' using errcode = 'P0001'; end if;
  if char_length(d) > 500 then raise exception 'SB_TOO_LONG: Keep the description to 500 characters.' using errcode = 'P0001'; end if;
  insert into public.studyboard_founder_themes as t (user_id, slot, name, description) values (me, p_slot, n, d)
  on conflict (user_id, slot) do update set name = excluded.name, description = excluded.description, updated_at = now();
  return jsonb_build_object('ok', true);
end $$;

-- For you in the SQL Editor
create or replace function public.studyboard_early_program(p_on boolean) returns text
language plpgsql volatile security definer set search_path = '' as $$
begin
  perform public.plans_deny_clients();
  insert into public.studyboard_config (key, value) values ('early_program', jsonb_build_object('on', coalesce(p_on, false)))
  on conflict (key) do update set value = public.plans_early_cfg() || jsonb_build_object('on', coalesce(p_on, false))
    || case when p_on and not (public.plans_early_cfg() ? 'since') then jsonb_build_object('since', now()) else '{}'::jsonb end, updated_at = now();
  return case when p_on then 'Founders and Early Supporters is ON: the next paid sign-ups take the places that are left.' else 'Founders and Early Supporters is OFF: nobody new gets a place. Everyone who has one keeps it.' end;
end $$;

drop function if exists public.studyboard_early_list();
create or replace function public.studyboard_early_list()
returns table (place bigint, email text, founder boolean, founder_place bigint, waiting boolean, term text, source text, joined_at timestamptz, revoked_at timestamptz, codes_used bigint, codes bigint)
language plpgsql stable security definer set search_path = '' as $$
begin
  perform public.plans_deny_clients();
  return query
    select case when s.revoked_at is null and not s.waiting then row_number() over (partition by s.revoked_at is null and not s.waiting order by s.joined_at, s.user_id) end,
           u.email::text, s.founder,
           case when s.founder and s.revoked_at is null and not s.waiting then row_number() over (partition by s.founder and s.revoked_at is null and not s.waiting order by s.founder_at, s.user_id) end,
           s.waiting and s.revoked_at is null, s.term, s.source, s.joined_at, s.revoked_at,
           (select count(*) from public.studyboard_early_codes c join public.studyboard_promo_codes p on p.id = c.code_id where c.user_id = s.user_id and p.uses > 0),
           (select count(*) from public.studyboard_early_codes c where c.user_id = s.user_id)
    from public.studyboard_early_supporters s left join auth.users u on u.id = s.user_id
    order by s.revoked_at is not null, s.waiting, s.joined_at;
end $$;

-- Add someone by hand (for example a payment made before you switched it on); p_founder true makes them a Founder
create or replace function public.studyboard_early_add(p_email text, p_founder boolean default false) returns text
language plpgsql volatile security definer set search_path = '' as $$
declare uid uuid; r text;
begin
  perform public.plans_deny_clients();
  select id into uid from auth.users where lower(email) = lower(btrim(p_email));
  if uid is null then return 'No account uses ' || coalesce(p_email, '(nothing)'); end if;
  r := public.plans_early_claim(uid, null, 'manual', true, coalesce(p_founder, false));
  return case r when 'founder' then p_email || ' is a Founder' when 'supporter' then p_email || ' is an Early Supporter' else p_email || ' already has a place' end;
end $$;

create or replace function public.studyboard_early_remove(p_email text) returns text
language plpgsql volatile security definer set search_path = '' as $$
declare uid uuid;
begin
  perform public.plans_deny_clients();
  select id into uid from auth.users where lower(email) = lower(btrim(p_email));
  if uid is null then return 'No account uses ' || coalesce(p_email, '(nothing)'); end if;
  return case public.plans_early_revoke(uid) when 'revoked' then 'Removed. Their unused friend codes stop working, and their place went to the next in line (if anyone is waiting).' else p_email || ' doesn''t have a place' end;
end $$;

create or replace function public.studyboard_founder_themes()
returns table (id bigint, founder_place bigint, email text, slot smallint, name text, description text, status text, theme_id text, updated_at timestamptz)
language plpgsql stable security definer set search_path = '' as $$
begin
  perform public.plans_deny_clients();
  return query
    select t.id, (select count(*) from public.studyboard_early_supporters s2 where s2.revoked_at is null and not s2.waiting and s2.founder and (s2.founder_at, s2.user_id) <= (s.founder_at, s.user_id)),
           u.email::text, t.slot, t.name, t.description, t.status, t.theme_id, t.updated_at
    from public.studyboard_founder_themes t join public.studyboard_early_supporters s on s.user_id = t.user_id
    left join auth.users u on u.id = t.user_id
    where s.revoked_at is null and not s.waiting and s.founder
    order by s.founder_at, t.slot;
end $$;

-- Pick one suggestion (by its id from studyboard_founder_themes()) and name the theme id you'll give it in the app
create or replace function public.studyboard_founder_theme_pick(p_id bigint, p_theme_id text) returns text
language plpgsql volatile security definer set search_path = '' as $$
declare t public.studyboard_founder_themes;
begin
  perform public.plans_deny_clients();
  if p_theme_id is null or p_theme_id !~ '^[a-z0-9-]{2,40}$' then return 'The theme id needs 2 to 40 lower-case letters, digits or dashes, like founder-ocean-glass'; end if;
  select * into t from public.studyboard_founder_themes where id = p_id;
  if not found then return 'No suggestion has that id'; end if;
  update public.studyboard_founder_themes set status = 'suggested', theme_id = null, updated_at = now() where user_id = t.user_id and id <> p_id and status = 'picked';
  update public.studyboard_founder_themes set status = 'picked', theme_id = p_theme_id, updated_at = now() where id = p_id;
  return 'Picked "' || t.name || '". Add a theme with id: "' || p_theme_id || '", group: "founders" to SKINS in src/js/01-style-shop.js; its Founder keeps it for good.';
end $$;

create or replace function public.studyboard_founder_theme_unpick(p_id bigint) returns text
language plpgsql volatile security definer set search_path = '' as $$
begin
  perform public.plans_deny_clients();
  update public.studyboard_founder_themes set status = 'suggested', theme_id = null, updated_at = now() where id = p_id;
  return case when found then 'Back to a suggestion. Its Founder can edit their suggestions again.' else 'No suggestion has that id' end;
end $$;

revoke all on function public.studyboard_early_status(), public.studyboard_my_early(), public.founder_theme_save(int, text, text) from public, anon, authenticated;
grant execute on function public.studyboard_early_status() to anon, authenticated;
grant execute on function public.studyboard_my_early(), public.founder_theme_save(int, text, text) to authenticated;

-- Lock down: who may run what, and what is visible live
do $$
declare f record;
begin
  for f in
    select p.oid::regprocedure as sig from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and (p.proname like 'plans\_%' or p.proname in ('studyboard_is_pro', 'studyboard_limit', 'studyboard_prune_group_messages', 'studyboard_prune_billing', 'studyboard_prune_backups',
           'studyboard_apply_billing', 'studyboard_plan_rate_hit', 'studyboard_grant_pro', 'studyboard_grant_pro_uid', 'studyboard_revoke_pro', 'studyboard_revoke_pro_uid',
           'studyboard_make_code', 'studyboard_make_codes', 'studyboard_list_codes', 'studyboard_disable_code', 'studyboard_revoke_promo', 'studyboard_redeem_code',
           'studyboard_early_status', 'studyboard_my_early', 'founder_theme_save', 'studyboard_early_program', 'studyboard_early_list', 'studyboard_early_add',
           'studyboard_early_remove', 'studyboard_founder_themes', 'studyboard_founder_theme_pick', 'studyboard_founder_theme_unpick'))
  loop
    execute format('revoke all on function %s from public, anon, authenticated', f.sig);
    if exists (select 1 from pg_roles where rolname = 'service_role') then execute format('grant execute on function %s to service_role', f.sig); end if;
  end loop;
end $$;
revoke all on function public.studyboard_paywall() from public;
grant execute on function public.studyboard_paywall() to anon, authenticated;
grant execute on function public.studyboard_redeem_code(text) to authenticated;   -- the one promo function the app calls (it checks who is asking)
grant execute on function public.studyboard_early_status() to anon, authenticated;   -- places left (counts only)
grant execute on function public.studyboard_my_early(), public.founder_theme_save(int, text, text) to authenticated;   -- each checks who is asking
revoke all on function public.studyboard_start_trial() from public, anon;
grant execute on function public.studyboard_start_trial() to authenticated;

do $$
declare t text;
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    foreach t in array array['studyboard_config', 'studyboard_entitlements', 'studyboard_devices', 'studyboard_usage', 'studyboard_billing_customers',
                              'studyboard_billing_events', 'studyboard_pro_grants', 'studyboard_plan_rate', 'studyboard_device_removals', 'studyboard_trial_uses',
                              'studyboard_early_supporters', 'studyboard_early_codes', 'studyboard_founder_themes'] loop
      execute format('grant all on public.%I to service_role', t);
    end loop;
  end if;
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime' and not puballtables) then
    foreach t in array array['studyboard_config', 'studyboard_entitlements', 'studyboard_usage', 'studyboard_billing_customers', 'studyboard_billing_events',
                              'studyboard_pro_grants', 'studyboard_plan_rate', 'studyboard_device_removals', 'studyboard_trial_uses',
                              'studyboard_early_supporters', 'studyboard_early_codes', 'studyboard_founder_themes'] loop
      if exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
        execute format('alter publication supabase_realtime drop table public.%I', t);
      end if;
    end loop;
  end if;
end $$;

-- A free week of Pro for every new account
insert into public.studyboard_config (key, value) values
  ('welcome_trial', 'true'::jsonb), ('welcome_trial_since', to_jsonb(now())), ('welcome_trial_daily_cap', '1000'::jsonb)
on conflict (key) do nothing;

create table if not exists public.studyboard_trial_blocked_domains (domain text primary key check (domain ~ '^[a-z0-9.-]+\.[a-z]{2,}$'));
alter table public.studyboard_trial_blocked_domains enable row level security;
revoke all on public.studyboard_trial_blocked_domains from public, anon, authenticated;
insert into public.studyboard_trial_blocked_domains (domain) values
  ('mailinator.com'), ('guerrillamail.com'), ('guerrillamail.net'), ('guerrillamail.org'), ('sharklasers.com'), ('grr.la'), ('10minutemail.com'),
  ('10minutemail.net'), ('tempmail.com'), ('temp-mail.org'), ('temp-mail.io'), ('tempmail.dev'), ('tempmailo.com'), ('throwawaymail.com'),
  ('yopmail.com'), ('yopmail.net'), ('getnada.com'), ('nada.email'), ('dispostable.com'), ('maildrop.cc'), ('mailnesia.com'), ('mintemail.com'),
  ('trashmail.com'), ('trashmail.de'), ('fakeinbox.com'), ('emailondeck.com'), ('mohmal.com'), ('mailcatch.com'), ('mytemp.email'),
  ('tempinbox.com'), ('spamgourmet.com'), ('moakt.com'), ('emailfake.com'), ('burnermail.io'), ('mail.tm'), ('inboxkitten.com'),
  ('1secmail.com'), ('1secmail.net'), ('1secmail.org'), ('tmpmail.org'), ('tmpmail.net'), ('dropmail.me'), ('harakirimail.com'),
  ('mailpoof.com'), ('spambox.us'), ('mail7.io'), ('linshiyouxiang.net'), ('emailtemporanea.net'), ('tempr.email'), ('discard.email')
on conflict (domain) do nothing;

create or replace function public.plans_welcome_trial(p_uid uuid) returns timestamptz
language plpgsql security definer set search_path = public, pg_temp as $$
declare u jsonb; em text; eh text; dom text; days int; until timestamptz; since timestamptz; cap int; made timestamptz;
begin
  if coalesce((select value from public.studyboard_config where key = 'welcome_trial'), 'false'::jsonb) <> 'true'::jsonb then return null; end if;
  select to_jsonb(x) into u from auth.users x where x.id = p_uid;
  if u is null then return null; end if;
  em := lower(btrim(u ->> 'email'));
  if em is null or em = '' or position('@' in em) = 0 then return null; end if;
  if nullif(u ->> 'email_confirmed_at', '') is null then return null; end if;
  if coalesce((u ->> 'is_anonymous')::boolean, false) then return null; end if;
  since := coalesce((select (value #>> '{}')::timestamptz from public.studyboard_config where key = 'welcome_trial_since'), now());
  made := (u ->> 'created_at')::timestamptz;
  if made is null or made < since then return null; end if;
  if exists (select 1 from public.studyboard_entitlements e where e.user_id = p_uid
             and (e.trial_until is not null or e.plan <> 'free' or e.external_id is not null or e.grant_until is not null or e.grant_lifetime or e.billing_event_at is not null)) then
    return null;
  end if;
  eh := public.plans_email_hash(em);
  if eh is null or exists (select 1 from public.studyboard_trial_uses where email_hash = eh) then return null; end if;
  dom := split_part(em, '@', 2);
  if exists (select 1 from public.studyboard_trial_blocked_domains b where dom = b.domain or right(dom, length(b.domain) + 1) = '.' || b.domain) then return null; end if;
  cap := coalesce((select (value #>> '{}')::int from public.studyboard_config where key = 'welcome_trial_daily_cap'), 1000);
  if (select count(*) from public.studyboard_trial_uses where used_at > now() - interval '1 day') >= cap then return null; end if;
  days := least(14, greatest(1, coalesce((select (value ->> 'trialDays')::int from public.studyboard_config where key = 'prices'), 7)));
  until := now() + make_interval(days => days);
  insert into public.studyboard_trial_uses (email_hash) values (eh) on conflict (email_hash) do nothing;
  if not found then return null; end if;
  insert into public.studyboard_entitlements as e (user_id, plan, trial_until, source, will_renew, updated_at)
  values (p_uid, 'free', until, 'welcome', false, now())
  on conflict (user_id) do update set trial_until = until, source = coalesce(e.source, 'welcome'), will_renew = false, updated_at = now()
    where e.trial_until is null and e.plan = 'free' and e.external_id is null;
  return until;
end $$;
revoke all on function public.plans_welcome_trial(uuid) from public, anon, authenticated;

-- Fires when an account is made already confirmed
create or replace function public.plans_welcome_trigger() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if new.email_confirmed_at is not null and (tg_op = 'INSERT' or old.email_confirmed_at is null or coalesce(old.email, '') <> coalesce(new.email, '')) then
    begin perform public.plans_welcome_trial(new.id);
    exception when others then null;   -- a problem here must never stop someone signing up
    end;
  end if;
  return new;
end $$;
revoke all on function public.plans_welcome_trigger() from public, anon, authenticated;
drop trigger if exists plans_welcome_trial on auth.users;
create trigger plans_welcome_trial after insert or update of email_confirmed_at, email on auth.users
  for each row execute function public.plans_welcome_trigger();
do $$ begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then grant all on public.studyboard_trial_blocked_domains to service_role; end if;
end $$;

create table if not exists public.studyboard_upgrade_stats (
  day date not null default current_date,
  reason text not null,
  event text not null check (event in ('shown', 'note', 'buy', 'purchased')),
  n integer not null default 0,
  primary key (day, reason, event)
);
alter table public.studyboard_upgrade_stats enable row level security;   -- no policies: closed to the API
revoke all on public.studyboard_upgrade_stats from public, anon, authenticated;

create or replace function public.studyboard_upgrade_event(p_event text, p_reason text) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare r text := left(coalesce(nullif(btrim(regexp_replace(p_reason, '\s+', ' ', 'g')), ''), '(none)'), 120);
begin
  if p_event is null or p_event not in ('shown', 'note', 'buy', 'purchased') then return; end if;
  if not exists (select 1 from public.studyboard_upgrade_stats where day = current_date and reason = r)
     and (select count(distinct reason) from public.studyboard_upgrade_stats where day = current_date) >= 300 then
    r := '(other)';
  end if;
  insert into public.studyboard_upgrade_stats as s (day, reason, event, n) values (current_date, r, p_event, 1)
  on conflict (day, reason, event) do update set n = s.n + 1;
end $$;
revoke all on function public.studyboard_upgrade_event(text, text) from public;
grant execute on function public.studyboard_upgrade_event(text, text) to anon, authenticated;

-- Ask the API to notice the new tables right away
notify pgrst, 'reload schema';
