-- Studyboard: Google Drive and OneDrive

create table if not exists public.cloud_accounts (
  user_id     uuid not null references auth.users(id) on delete cascade,
  provider    text not null check (provider in ('google', 'microsoft')),
  account     text check (account is null or char_length(account) <= 200),   -- the cloud account's email, shown in the app
  refresh_enc text not null check (char_length(refresh_enc) between 20 and 8000),
  access_enc  text check (access_enc is null or char_length(access_enc) <= 12000),   -- the last access token, encrypted, reused while fresh
  access_exp  timestamptz,
  status      text not null default 'ok' check (status in ('ok', 'reauth')),
  hits        integer not null default 0,
  hits_since  timestamptz not null default now(),
  created_at  timestamptz not null default now(),
  primary key (user_id, provider)
);
alter table public.cloud_accounts enable row level security;
revoke all on public.cloud_accounts from public, anon, authenticated;

-- Free on every plan (Google Drive and OneDrive use the person's own storage)
create or replace function public.cloud_allowed(p_uid uuid) returns boolean
language sql stable security definer set search_path = pg_catalog, public as $$
  select exists (select 1 from auth.users u where u.id = p_uid and not coalesce((to_jsonb(u) ->> 'is_anonymous')::boolean, false));
$$;

create or replace function public.cloud_account(p_uid uuid, p_provider text) returns setof public.cloud_accounts
language sql stable security definer set search_path = pg_catalog, public as $$
  select * from public.cloud_accounts where user_id = p_uid and provider = p_provider;
$$;
-- What the app may see
create or replace function public.cloud_status(p_uid uuid) returns jsonb
language sql stable security definer set search_path = pg_catalog, public as $$
  select coalesce(jsonb_agg(jsonb_build_object('provider', a.provider, 'account', a.account, 'status', a.status, 'connected_at', a.created_at) order by a.created_at), '[]'::jsonb)
  from public.cloud_accounts a where a.user_id = p_uid;
$$;
create or replace function public.cloud_connect(p_uid uuid, p_provider text, p_account text, p_refresh_enc text) returns void
language sql volatile security definer set search_path = pg_catalog, public as $$
  insert into public.cloud_accounts (user_id, provider, account, refresh_enc, status)
    values (p_uid, p_provider, left(p_account, 200), p_refresh_enc, 'ok')
  on conflict (user_id, provider) do update set account = excluded.account, refresh_enc = excluded.refresh_enc, status = 'ok', access_enc = null, access_exp = null;
$$;
create or replace function public.cloud_update(p_uid uuid, p_provider text, p_refresh_enc text default null, p_status text default null, p_access_enc text default null, p_access_exp timestamptz default null) returns void
language sql volatile security definer set search_path = pg_catalog, public as $$
  update public.cloud_accounts set refresh_enc = coalesce(p_refresh_enc, refresh_enc), status = coalesce(p_status, status),
    access_enc = case when p_status = 'reauth' then null else coalesce(p_access_enc, access_enc) end,
    access_exp = case when p_status = 'reauth' then null else coalesce(p_access_exp, access_exp) end
  where user_id = p_uid and provider = p_provider;
$$;
-- Counts token requests
create or replace function public.cloud_touch(p_uid uuid, p_provider text) returns boolean
language plpgsql volatile security definer set search_path = pg_catalog, public as $$
declare n integer;
begin
  update public.cloud_accounts set hits = case when hits_since < now() - interval '1 hour' then 1 else hits + 1 end,
    hits_since = case when hits_since < now() - interval '1 hour' then now() else hits_since end
    where user_id = p_uid and provider = p_provider returning hits into n;
  return n is null or n <= 120;   -- not connected: the token step answers not_connected
end $$;
create or replace function public.cloud_disconnect(p_uid uuid, p_provider text) returns void
language sql volatile security definer set search_path = pg_catalog, public as $$
  delete from public.cloud_accounts where user_id = p_uid and provider = p_provider;
$$;

-- Who may call what
revoke all on function public.cloud_allowed(uuid), public.cloud_account(uuid, text), public.cloud_status(uuid), public.cloud_connect(uuid, text, text, text),
  public.cloud_update(uuid, text, text, text, text, timestamptz), public.cloud_touch(uuid, text), public.cloud_disconnect(uuid, text) from public, anon, authenticated;
do $$ begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant execute on function public.cloud_allowed(uuid), public.cloud_account(uuid, text), public.cloud_status(uuid), public.cloud_connect(uuid, text, text, text),
      public.cloud_update(uuid, text, text, text, text, timestamptz), public.cloud_touch(uuid, text), public.cloud_disconnect(uuid, text) to service_role;
  end if;
end $$;
