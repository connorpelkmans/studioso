-- Studyboard: two-way calendar sync with Google Calendar and Outlook (Studyboard Pro)
-- Run this once in Supabase: SQL Editor > New query > paste everything > Run. Run it after supabase-lean.sql (and supabase-plans.sql if
-- you use plans). It is safe to run again. Then deploy the calendar-sync Edge Function (Verify JWT OFF) and set its secrets; the steps are
-- in SETUP-GUIDE.md, "Two-Way Calendar Sync".
--
-- How it works:
--   The app asks the calendar-sync function to connect. The person allows access at Google or Microsoft, which sends them back to the
--   function; it keeps the account's refresh token ENCRYPTED (AES-GCM, with a key that lives only in the function's secrets, bound to the
--   account and provider) and makes a calendar called "Studyboard" in that account. Studyboard only ever writes to that calendar.
--   When the app syncs, it sends what belongs in the calendar (deadlines, exams, classes, events, study sessions); the function adds,
--   changes and removes events there to match, and tells the app what the person moved or deleted in that calendar, plus (if they want)
--   the busy times from their own calendar so Today's Plan plans around them.
--
-- Security model:
--   * Both tables have Row Level Security on and NO grants: only the Edge Function (service role) can read or write them, through the
--     functions below. The app never sees a token, encrypted or not.
--   * calsync_map holds only ids and when each event was: no titles, no text.
--   * Disconnecting deletes the account row and its map (and the function revokes the token at Google). Deleting the Studyboard account
--     deletes both (studyboard_delete_user_data in supabase-lean.sql).

create table if not exists public.calsync_accounts (
  user_id     uuid not null references auth.users(id) on delete cascade,
  provider    text not null check (provider in ('google', 'microsoft')),
  account     text check (account is null or char_length(account) <= 200),   -- the calendar account's email, shown in the app
  refresh_enc text not null check (char_length(refresh_enc) between 20 and 8000),
  cal_id      text check (cal_id is null or char_length(cal_id) <= 400),     -- the "Studyboard" calendar at the provider
  status      text not null default 'ok' check (status in ('ok', 'reauth')),
  lock_until  timestamptz,
  last_sync   timestamptz,
  created_at  timestamptz not null default now(),
  primary key (user_id, provider)
);
create table if not exists public.calsync_map (
  user_id    uuid not null references auth.users(id) on delete cascade,
  provider   text not null check (provider in ('google', 'microsoft')),
  sb_key     text not null check (char_length(sb_key) between 1 and 200),    -- what it is in Studyboard: t:<task>, m:<course>:<week>, e:<event>:<date>
  ext_id     text not null check (char_length(ext_id) between 1 and 400),    -- the event's id at the provider
  hash       text not null default '' check (char_length(hash) <= 64),      -- what was last written (empty: write it again)
  ext_start  text not null default '' check (char_length(ext_start) <= 40),  -- when it was when last seen: D2026-10-16 or T<ms>
  ext_end    text not null default '' check (char_length(ext_end) <= 40),
  gone       boolean not null default false,                                 -- deleted in the calendar: not sent again
  updated_at timestamptz not null default now(),
  primary key (user_id, provider, sb_key)
);
create index if not exists calsync_map_ext_idx on public.calsync_map (user_id, provider, ext_id);

alter table public.calsync_accounts enable row level security;
alter table public.calsync_map enable row level security;
revoke all on public.calsync_accounts, public.calsync_map from public, anon, authenticated;

-- Pro, or no paywall yet (works whether or not supabase-plans.sql has been run)
create or replace function public.calsync_allowed(p_uid uuid) returns boolean
language plpgsql stable security definer set search_path = pg_catalog, public as $$
declare pw boolean := false; pro boolean := true;
begin
  if to_regprocedure('public.studyboard_paywall()') is not null then execute 'select public.studyboard_paywall()' into pw; end if;
  if not coalesce(pw, false) then return true; end if;
  if to_regprocedure('public.studyboard_is_pro(uuid)') is not null then execute 'select public.studyboard_is_pro($1)' into pro using p_uid; end if;
  return coalesce(pro, false);
end $$;

-- One sync at a time per account and provider (two devices syncing together would both add the same events). A lease of p_secs seconds.
create or replace function public.calsync_lock(p_uid uuid, p_provider text, p_secs int default 120) returns boolean
language plpgsql volatile security definer set search_path = pg_catalog, public as $$
declare n integer;
begin
  update public.calsync_accounts set lock_until = now() + make_interval(secs => greatest(10, least(coalesce(p_secs, 120), 300)))
    where user_id = p_uid and provider = p_provider and (lock_until is null or lock_until < now());
  get diagnostics n = row_count;
  return n > 0;
end $$;
create or replace function public.calsync_unlock(p_uid uuid, p_provider text, p_synced boolean default false) returns void
language sql volatile security definer set search_path = pg_catalog, public as $$
  update public.calsync_accounts set lock_until = null, last_sync = case when p_synced then now() else last_sync end
    where user_id = p_uid and provider = p_provider;
$$;

-- The account (with its encrypted token) for the function
create or replace function public.calsync_account(p_uid uuid, p_provider text) returns setof public.calsync_accounts
language sql stable security definer set search_path = pg_catalog, public as $$
  select * from public.calsync_accounts where user_id = p_uid and provider = p_provider;
$$;
-- What the app may see: no token, no lock
create or replace function public.calsync_status(p_uid uuid) returns jsonb
language sql stable security definer set search_path = pg_catalog, public as $$
  select coalesce(jsonb_agg(jsonb_build_object('provider', a.provider, 'account', a.account, 'status', a.status, 'last_sync', a.last_sync, 'connected_at', a.created_at,
    'sent', (select count(*) from public.calsync_map m where m.user_id = a.user_id and m.provider = a.provider and not m.gone)) order by a.created_at), '[]'::jsonb)
  from public.calsync_accounts a where a.user_id = p_uid;
$$;
-- Connect (or connect again): a new token replaces the old one; the map is kept when it is the same calendar
create or replace function public.calsync_connect(p_uid uuid, p_provider text, p_account text, p_refresh_enc text, p_cal_id text) returns void
language plpgsql volatile security definer set search_path = pg_catalog, public as $$
declare old_cal text;
begin
  select cal_id into old_cal from public.calsync_accounts where user_id = p_uid and provider = p_provider;
  if old_cal is distinct from p_cal_id then delete from public.calsync_map where user_id = p_uid and provider = p_provider; end if;
  insert into public.calsync_accounts (user_id, provider, account, refresh_enc, cal_id, status)
    values (p_uid, p_provider, left(p_account, 200), p_refresh_enc, p_cal_id, 'ok')
  on conflict (user_id, provider) do update set account = excluded.account, refresh_enc = excluded.refresh_enc, status = 'ok', lock_until = null,
    cal_id = excluded.cal_id;
end $$;
create or replace function public.calsync_update(p_uid uuid, p_provider text, p_refresh_enc text default null, p_cal_id text default null, p_status text default null) returns void
language plpgsql volatile security definer set search_path = pg_catalog, public as $$
begin
  update public.calsync_accounts set refresh_enc = coalesce(p_refresh_enc, refresh_enc), status = coalesce(p_status, status),
    cal_id = coalesce(p_cal_id, cal_id) where user_id = p_uid and provider = p_provider;
  if p_cal_id is not null then delete from public.calsync_map where user_id = p_uid and provider = p_provider; end if;   -- a new calendar starts empty
end $$;
create or replace function public.calsync_disconnect(p_uid uuid, p_provider text) returns void
language sql volatile security definer set search_path = pg_catalog, public as $$
  delete from public.calsync_map where user_id = p_uid and provider = p_provider;
  delete from public.calsync_accounts where user_id = p_uid and provider = p_provider;
$$;

-- The map: read it all, then save the changes of one sync in one call. p_rows: [{k, ext_id, hash, ext_start, ext_end, gone}], p_drop: keys.
create or replace function public.calsync_map_get(p_uid uuid, p_provider text) returns table (sb_key text, ext_id text, hash text, ext_start text, ext_end text, gone boolean)
language sql stable security definer set search_path = pg_catalog, public as $$
  select m.sb_key, m.ext_id, m.hash, m.ext_start, m.ext_end, m.gone from public.calsync_map m where m.user_id = p_uid and m.provider = p_provider;
$$;
create or replace function public.calsync_map_save(p_uid uuid, p_provider text, p_rows jsonb, p_drop text[]) returns integer
language plpgsql volatile security definer set search_path = pg_catalog, public as $$
declare n integer := 0;
begin
  if not exists (select 1 from public.calsync_accounts where user_id = p_uid and provider = p_provider) then return 0; end if;
  if (select count(*) from public.calsync_map where user_id = p_uid and provider = p_provider) + jsonb_array_length(coalesce(p_rows, '[]'::jsonb)) > 6000 then
    raise exception 'SB_CALSYNC_FULL' using errcode = '54000';
  end if;
  delete from public.calsync_map where user_id = p_uid and provider = p_provider and sb_key = any (coalesce(p_drop, '{}'::text[]));
  insert into public.calsync_map (user_id, provider, sb_key, ext_id, hash, ext_start, ext_end, gone, updated_at)
    select p_uid, p_provider, r->>'k', r->>'ext_id', coalesce(r->>'hash', ''), coalesce(r->>'ext_start', ''), coalesce(r->>'ext_end', ''), coalesce((r->>'gone')::boolean, false), now()
    from jsonb_array_elements(coalesce(p_rows, '[]'::jsonb)) r
  on conflict (user_id, provider, sb_key) do update set ext_id = excluded.ext_id, hash = excluded.hash, ext_start = excluded.ext_start, ext_end = excluded.ext_end,
    gone = excluded.gone, updated_at = now();
  get diagnostics n = row_count;
  return n;
end $$;

-- ---------- Who may call what: the service role only ----------
revoke all on function public.calsync_allowed(uuid), public.calsync_lock(uuid, text, int), public.calsync_unlock(uuid, text, boolean), public.calsync_account(uuid, text),
  public.calsync_status(uuid), public.calsync_connect(uuid, text, text, text, text), public.calsync_update(uuid, text, text, text, text), public.calsync_disconnect(uuid, text),
  public.calsync_map_get(uuid, text), public.calsync_map_save(uuid, text, jsonb, text[]) from public, anon, authenticated;
do $$ begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant execute on function public.calsync_allowed(uuid), public.calsync_lock(uuid, text, int), public.calsync_unlock(uuid, text, boolean), public.calsync_account(uuid, text),
      public.calsync_status(uuid), public.calsync_connect(uuid, text, text, text, text), public.calsync_update(uuid, text, text, text, text), public.calsync_disconnect(uuid, text),
      public.calsync_map_get(uuid, text), public.calsync_map_save(uuid, text, jsonb, text[]) to service_role;
  end if;
end $$;
