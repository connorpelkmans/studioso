-- Remote switches for the apps (read by anyone, changed only from the Supabase dashboard or SQL editor)
create table if not exists public.app_flags (
  key text primary key,
  value jsonb not null default 'true'::jsonb,
  note text,
  updated_at timestamptz not null default now()
);
alter table public.app_flags enable row level security;
drop policy if exists "app flags are public" on public.app_flags;
create policy "app flags are public" on public.app_flags for select to anon, authenticated using (true);
grant select on public.app_flags to anon, authenticated;
insert into public.app_flags (key, value, note) values
  ('bb_internal', 'true', 'Blackboard internal endpoints (/learn/api/v1): fallbacks and rubrics. Set to false to use only the public API.')
on conflict (key) do nothing;
-- Switch off:  update public.app_flags set value = 'false', updated_at = now() where key = 'bb_internal';
