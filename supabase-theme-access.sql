-- Studyboard: hidden themes (run once in Supabase > SQL Editor > New query; safe to run again).
--
-- Some themes are kept in the app but hidden from everyone: they don't show in the Style Shop, onboarding, Theme
-- Collections or the Companions list, and can't be picked. An account with all_themes = true in this table sees and can
-- pick every theme again (Pro rules still apply). The list of hidden themes is HIDDEN_THEMES in index.html
-- (module 20-scenes-visible.js).
--
-- Give yourself (or anyone) access, in the SQL Editor:
--   select public.studyboard_grant_all_themes('you@example.com', 'owner');
--   select public.studyboard_revoke_all_themes('you@example.com');
-- Or in Table Editor > studyboard_theme_access: insert a row with your user id and all_themes = true.
-- The app checks after sign-in (and when it comes back to the foreground), so reopen it or sign in again to see the change.

create table if not exists public.studyboard_theme_access (
  user_id uuid primary key references auth.users(id) on delete cascade,
  all_themes boolean not null default false,
  note text,
  updated_at timestamptz not null default now()
);
alter table public.studyboard_theme_access enable row level security;
drop policy if exists "theme access own read" on public.studyboard_theme_access;
create policy "theme access own read" on public.studyboard_theme_access for select to authenticated using (user_id = (select auth.uid()));
-- Read only, own row only: nobody can give themselves access from the app. Only you (SQL Editor, Table Editor) or the service role can write.
revoke all on public.studyboard_theme_access from public, anon, authenticated;
grant select on public.studyboard_theme_access to authenticated;

create or replace function public.studyboard_grant_all_themes(p_email text, p_note text default null) returns text
language plpgsql volatile security definer set search_path = '' as $$
declare uid uuid; c text := nullif(current_setting('request.jwt.claims', true), '');
begin
  if c is not null and coalesce((c::jsonb) ->> 'role', '') in ('anon', 'authenticated') then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  select u.id into uid from auth.users u where lower(u.email) = lower(trim(p_email));
  if not found then return 'No account has that email'; end if;
  insert into public.studyboard_theme_access as a (user_id, all_themes, note, updated_at)
  values (uid, true, left(p_note, 500), now())
  on conflict (user_id) do update set all_themes = true, note = coalesce(excluded.note, a.note), updated_at = now();
  return 'All themes are visible for ' || trim(p_email);
end $$;

create or replace function public.studyboard_revoke_all_themes(p_email text) returns text
language plpgsql volatile security definer set search_path = '' as $$
declare uid uuid; c text := nullif(current_setting('request.jwt.claims', true), '');
begin
  if c is not null and coalesce((c::jsonb) ->> 'role', '') in ('anon', 'authenticated') then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  select u.id into uid from auth.users u where lower(u.email) = lower(trim(p_email));
  if not found then return 'No account has that email'; end if;
  update public.studyboard_theme_access set all_themes = false, updated_at = now() where user_id = uid;
  return 'Hidden themes are hidden again for ' || trim(p_email);
end $$;

-- Only you (SQL Editor) or the service role can run these.
revoke all on function public.studyboard_grant_all_themes(text, text) from public, anon, authenticated;
revoke all on function public.studyboard_revoke_all_themes(text) from public, anon, authenticated;
