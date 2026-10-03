-- Studyboard: core setup (your synced data table and private file storage)
-- Run this FIRST, once, in Supabase: SQL Editor > New query > paste everything > Run.
-- It is safe to run again (it only creates what is missing and refreshes the rules).
--
-- NOTE FOR THE OWNER: the guides refer to this file as supabase-setup.sql, but it was missing from the repository, so
-- this copy was rebuilt from what the app reads and writes (public.items with user_id, kind, id, data, updated_at, and the
-- private studioso-files bucket whose first folder is the user's id). If you still have your original supabase-setup.sql,
-- compare the two and keep the one your live project was created with; both are safe to run on a project that has the original.
--
-- What this sets up:
--  * items: one row per task, course, file record, note, deck, event, settings and backup. Each row belongs to one account.
--  * Row level security: you can only read, add, change or delete your own rows. Nobody can list anyone else's data.
--  * studioso-files: a private storage bucket. Files live under "<your user id>/..." and only you can open them.
--  * Live updates for items, so your devices stay in sync.

create table if not exists public.items (
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind       text not null,
  id         text not null,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, kind, id)
);

alter table public.items enable row level security;

drop policy if exists "items own select" on public.items;
create policy "items own select" on public.items for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists "items own insert" on public.items;
create policy "items own insert" on public.items for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists "items own update" on public.items;
create policy "items own update" on public.items for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists "items own delete" on public.items;
create policy "items own delete" on public.items for delete to authenticated using (user_id = (select auth.uid()));

revoke all on public.items from anon;
grant select, insert, update, delete on public.items to authenticated;

-- ---------- Private file storage ----------
insert into storage.buckets (id, name, public)
values ('studioso-files', 'studioso-files', false)
on conflict (id) do update set public = false;

drop policy if exists "studioso files own select" on storage.objects;
create policy "studioso files own select" on storage.objects for select to authenticated
  using (bucket_id = 'studioso-files' and split_part(name, '/', 1) = (select auth.uid())::text);
drop policy if exists "studioso files own insert" on storage.objects;
create policy "studioso files own insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'studioso-files' and split_part(name, '/', 1) = (select auth.uid())::text);
drop policy if exists "studioso files own update" on storage.objects;
create policy "studioso files own update" on storage.objects for update to authenticated
  using (bucket_id = 'studioso-files' and split_part(name, '/', 1) = (select auth.uid())::text)
  with check (bucket_id = 'studioso-files' and split_part(name, '/', 1) = (select auth.uid())::text);
drop policy if exists "studioso files own delete" on storage.objects;
create policy "studioso files own delete" on storage.objects for delete to authenticated
  using (bucket_id = 'studioso-files' and split_part(name, '/', 1) = (select auth.uid())::text);

-- ---------- Live updates ----------
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'items') then
    alter publication supabase_realtime add table public.items;
  end if;
end $$;
