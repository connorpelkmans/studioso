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

create index if not exists calendar_feeds_user_id_idx on public.calendar_feeds (user_id);

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

-- Ask the API to notice the new table right away
notify pgrst, 'reload schema';
