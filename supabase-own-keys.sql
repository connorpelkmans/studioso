-- Studyboard: which accounts may use their own paid AI key (Claude, ChatGPT)
-- Everyone else uses a free Gemini key or Studyboard AI with Pro. The app reads this when signed in
-- (src/js/01-ai.js, AI_OWNKEYS) and remembers the answer on the device.
--   Allow:  select public.studyboard_grant_own_keys('student@example.com', 'why');
--   Revoke: select public.studyboard_revoke_own_keys('student@example.com');

create table if not exists public.studyboard_own_key_access (
  user_id uuid primary key references auth.users(id) on delete cascade,
  allowed boolean not null default false,
  note text,
  updated_at timestamptz not null default now()
);
alter table public.studyboard_own_key_access enable row level security;
drop policy if exists "own key access own read" on public.studyboard_own_key_access;
create policy "own key access own read" on public.studyboard_own_key_access for select to authenticated using (user_id = (select auth.uid()));
-- Read only, own row only
revoke all on public.studyboard_own_key_access from public, anon, authenticated;
grant select on public.studyboard_own_key_access to authenticated;

create or replace function public.studyboard_grant_own_keys(p_email text, p_note text default null) returns text
language plpgsql volatile security definer set search_path = '' as $$
declare uid uuid; c text := nullif(current_setting('request.jwt.claims', true), '');
begin
  if c is not null and coalesce((c::jsonb) ->> 'role', '') in ('anon', 'authenticated') then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  select u.id into uid from auth.users u where lower(u.email) = lower(trim(p_email));
  if not found then return 'No account has that email'; end if;
  insert into public.studyboard_own_key_access as a (user_id, allowed, note, updated_at)
  values (uid, true, left(p_note, 500), now())
  on conflict (user_id) do update set allowed = true, note = coalesce(excluded.note, a.note), updated_at = now();
  return 'Own paid AI keys are allowed for ' || trim(p_email);
end $$;

create or replace function public.studyboard_revoke_own_keys(p_email text) returns text
language plpgsql volatile security definer set search_path = '' as $$
declare uid uuid; c text := nullif(current_setting('request.jwt.claims', true), '');
begin
  if c is not null and coalesce((c::jsonb) ->> 'role', '') in ('anon', 'authenticated') then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  select u.id into uid from auth.users u where lower(u.email) = lower(trim(p_email));
  if not found then return 'No account has that email'; end if;
  update public.studyboard_own_key_access set allowed = false, updated_at = now() where user_id = uid;
  return 'Own paid AI keys are off again for ' || trim(p_email);
end $$;

-- Only you (SQL Editor) or the service role can run these
revoke all on function public.studyboard_grant_own_keys(text, text) from public, anon, authenticated;
revoke all on function public.studyboard_revoke_own_keys(text) from public, anon, authenticated;
