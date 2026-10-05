-- Studyboard: live calendar link (Calendar Sync)
-- Run this once in Supabase > SQL Editor. Running it again is safe.
-- Each row is one private calendar link. Only you can see or change your own links.
-- The calendar-feed Edge Function reads this table with the service role key to find whose calendar a link belongs to.

create table if not exists public.calendar_feeds (
  token text primary key check (char_length(token) between 32 and 128),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  options jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  last_fetched_at timestamptz
);

-- Keep each link's options small, and tokens to plain URL-safe characters (they go in a web address).
alter table public.calendar_feeds drop constraint if exists calendar_feeds_limits;
alter table public.calendar_feeds add constraint calendar_feeds_limits check (token ~ '^[A-Za-z0-9_-]+$' and pg_column_size(options) <= 20000) not valid;

create index if not exists calendar_feeds_user_id_idx on public.calendar_feeds (user_id);

-- ---------- The token's SHA-256 (what the calendar-feed function looks links up by) ----------
-- The function finds a link by token_hash, so the token itself never goes into its database queries or logs. The hash is
-- filled in by the database on every insert or token change (the app keeps sending the token as before), and existing links
-- are filled in below. The token column stays for now because the app reads it back to show you your link.
alter table public.calendar_feeds add column if not exists token_hash text;
create or replace function public.calendar_feeds_hash() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.token is not null then
    new.token_hash := encode(sha256(convert_to(new.token, 'UTF8')), 'hex');
  elsif tg_op = 'UPDATE' then
    new.token_hash := old.token_hash;      -- the hash can't be changed on its own
  end if;
  if new.token_hash is null or new.token_hash !~ '^[0-9a-f]{64}$' then raise exception 'calendar link token missing' using errcode = '23514'; end if;
  return new;
end $$;
drop trigger if exists calendar_feeds_hash on public.calendar_feeds;
create trigger calendar_feeds_hash before insert or update on public.calendar_feeds
  for each row execute function public.calendar_feeds_hash();
update public.calendar_feeds set token_hash = encode(sha256(convert_to(token, 'UTF8')), 'hex')
  where token is not null and token_hash is distinct from encode(sha256(convert_to(token, 'UTF8')), 'hex');
create unique index if not exists calendar_feeds_token_hash_idx on public.calendar_feeds (token_hash);

alter table public.calendar_feeds enable row level security;

drop policy if exists "calendar_feeds_select_own" on public.calendar_feeds;
create policy "calendar_feeds_select_own" on public.calendar_feeds
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "calendar_feeds_insert_own" on public.calendar_feeds;
create policy "calendar_feeds_insert_own" on public.calendar_feeds
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "calendar_feeds_update_own" on public.calendar_feeds;
create policy "calendar_feeds_update_own" on public.calendar_feeds
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "calendar_feeds_delete_own" on public.calendar_feeds;
create policy "calendar_feeds_delete_own" on public.calendar_feeds
  for delete to authenticated using ((select auth.uid()) = user_id);

revoke all on public.calendar_feeds from anon;
grant select, insert, update, delete on public.calendar_feeds to authenticated;

-- LATER (only once your app no longer reads the token back, see SETUP-GUIDE "Calendar Sync"): to keep only the hash, run
--   alter table public.calendar_feeds drop constraint calendar_feeds_pkey, alter column token drop not null;
--   alter table public.calendar_feeds add primary key using index calendar_feeds_token_hash_idx;
--   update public.calendar_feeds set token = null;
-- and from then on the trigger above keeps filling token_hash from the token the app sends, with a second trigger
-- (before insert or update, after calendar_feeds_hash) that sets new.token := null.

-- Ask the API to notice the new table right away
notify pgrst, 'reload schema';
