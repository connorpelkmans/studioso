-- Studyboard: friends (FRIENDS-PLAN.md, step 1)
-- Two people are friends once one asks and the other accepts. You ask by typing someone's exact @username or by opening
-- their friend link. Nobody can search or browse accounts, and the reply to a request never says whether a username exists.
-- Blocking someone (group_blocks, supabase-moderation.sql) ends the friendship and stops any new request between the two.
-- Run it after supabase-groups.sql, supabase-moderation.sql and supabase-usernames.sql. Safe to run again.

do $$
begin
  if to_regclass('public.study_profiles') is null or to_regclass('public.group_blocks') is null
     or not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'study_profiles' and column_name = 'birth_date') then
    raise exception 'Run supabase-groups.sql, supabase-moderation.sql and supabase-usernames.sql first, then run this file again.';
  end if;
end $$;

-- Tables
-- One row per pair (a < b). Pending until the person who didn't ask accepts.
create table if not exists public.friendships (
  a uuid not null references auth.users(id) on delete cascade,
  b uuid not null references auth.users(id) on delete cascade,
  requested_by uuid not null references auth.users(id) on delete cascade,
  via text not null default 'username' check (via in ('username', 'link')),
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  primary key (a, b),
  constraint friendships_order check (a < b),
  constraint friendships_requester check (requested_by = a or requested_by = b)
);
create index if not exists friendships_b_idx on public.friendships (b);

-- Your friend link's code (K7P4-QD9X). Making a new one stops the old link working.
create table if not exists public.friend_codes (
  user_id uuid primary key references auth.users(id) on delete cascade,
  code text not null unique check (code ~ '^[A-Z0-9]{4}-[A-Z0-9]{4}$'),
  made_at timestamptz not null default now()
);

-- Nobody reads or writes these directly; everything goes through the functions below
alter table public.friendships enable row level security;
alter table public.friend_codes enable row level security;
revoke all on public.friendships, public.friend_codes from anon, authenticated;

-- Limits
-- 300 friends, 50 requests waiting on others, 20 requests a day, and a request nobody answers goes away after 30 days.

-- Helpers
create or replace function public.sbf_blocked(x uuid, y uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.group_blocks where (blocker_id = x and blocked_id = y) or (blocker_id = y and blocked_id = x))
$$;
create or replace function public.sbf_suspended(u uuid) returns boolean
language plpgsql stable security definer set search_path = public as $$
begin
  if to_regclass('public.group_suspended') is null then return false; end if;
  return exists (select 1 from public.group_suspended where user_id = u);
end $$;
-- Someone who can have friends: 13 or older (a birthday on file) and not suspended from groups
create or replace function public.sbf_eligible(u uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select u is not null and exists (select 1 from public.study_profiles where user_id = u and birth_date is not null) and not public.sbf_suspended(u)
$$;
create or replace function public.sbf_rate(p_what text, p_max int, p_secs int) returns boolean
language plpgsql volatile security definer set search_path = public as $$
begin
  if to_regprocedure('public.studyboard_rate_hit(text,integer,integer)') is null then return true; end if;
  return public.studyboard_rate_hit('friend-' || p_what || ':' || coalesce(auth.uid()::text, 'anon'), p_max, p_secs);
end $$;
create or replace function public.sbf_count(u uuid) returns int
language sql stable security definer set search_path = public as $$
  select count(*)::int from public.friendships where (a = u or b = u) and status = 'accepted'
$$;
-- Requests nobody answered within 30 days
create or replace function public.sbf_expire() returns void
language sql volatile security definer set search_path = public as $$
  delete from public.friendships where status = 'pending' and created_at < now() - interval '30 days'
$$;
create or replace function public.sbf_me() returns uuid
language plpgsql stable security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  if me is null then raise exception 'Sign in first'; end if;
  if public.sbf_suspended(me) then raise exception 'SB_FRIEND_SUSPENDED: Your account can''t add friends right now.' using errcode = '42501'; end if;
  if not exists (select 1 from public.study_profiles where user_id = me and birth_date is not null) then
    raise exception 'SB_FRIEND_AGE: Add your birthday first (Settings > Account), then try again.' using errcode = 'P0001';
  end if;
  return me;
end $$;

-- Asking: the shared part of both ways in. Returns 'sent', 'accepted' (they had already asked you) or 'already' (friends).
-- A person who can't be asked (blocked, suspended, no birthday yet) gets nothing, and the asker still sees 'sent'.
create or replace function public.sbf_ask(me uuid, them uuid, p_via text) returns text
language plpgsql volatile security definer set search_path = public as $$
declare x uuid := least(me, them); y uuid := greatest(me, them); f public.friendships;
begin
  perform public.sbf_expire();
  perform 1 from public.friendships where a = x and b = y for update;
  select * into f from public.friendships where a = x and b = y;
  if found and f.status = 'accepted' then return 'already'; end if;
  if found and f.requested_by = them then
    -- they asked you first: asking back accepts
    if public.sbf_count(me) >= 300 then raise exception 'SB_FRIEND_FULL: You have 300 friends, the most there can be. Remove someone first.' using errcode = 'P0001'; end if;
    if public.sbf_count(them) >= 300 then raise exception 'SB_FRIEND_FULL: They have the most friends there can be.' using errcode = 'P0001'; end if;
    update public.friendships set status = 'accepted', accepted_at = now() where a = x and b = y;
    return 'accepted';
  end if;
  if found then return 'sent'; end if;   -- you already asked
  if not public.sbf_eligible(them) or public.sbf_blocked(me, them) then return 'sent'; end if;
  if (select count(*) from public.friendships where requested_by = me and status = 'pending') >= 50 then
    raise exception 'SB_FRIEND_WAITING: You have 50 requests waiting for an answer. Cancel some first.' using errcode = 'P0001';
  end if;
  if public.sbf_count(me) >= 300 then raise exception 'SB_FRIEND_FULL: You have 300 friends, the most there can be. Remove someone first.' using errcode = 'P0001'; end if;
  insert into public.friendships (a, b, requested_by, via) values (x, y, me, p_via);
  return 'sent';
end $$;

-- By @username (exact, any case)
create or replace function public.request_friend(p_username text) returns text
language plpgsql volatile security definer set search_path = public as $$
declare me uuid := public.sbf_me(); n text := lower(btrim(regexp_replace(coalesce(p_username, ''), '^@', ''))); them uuid;
begin
  if n !~ '^[a-z][a-z0-9_.]{2,19}$' then raise exception 'SB_FRIEND_NAME: Type their whole username, like @sam.lee.' using errcode = 'P0001'; end if;
  if not public.sbf_rate('ask', 20, 86400) then raise exception 'SB_FRIEND_RATE: That''s a lot of friend requests today. Try again tomorrow.' using errcode = 'P0001'; end if;
  select user_id into them from public.study_profiles where lower(username) = n;
  if them = me then raise exception 'SB_FRIEND_SELF: That''s your own username.' using errcode = 'P0001'; end if;
  if them is null then return 'sent'; end if;   -- the same answer as a real request
  return public.sbf_ask(me, them, 'username');
end $$;

-- By friend link
create or replace function public.request_friend_by_code(p_code text) returns text
language plpgsql volatile security definer set search_path = public as $$
declare me uuid := public.sbf_me(); c text := public.sbg_norm_code(p_code); them uuid;
begin
  if not public.sbg_lookup_ok() then raise exception 'SB_FRIEND_RATE: Too many code lookups. Try again in an hour.' using errcode = 'P0001'; end if;
  select user_id into them from public.friend_codes where code = c;
  if them is null or public.sbf_blocked(me, them) or not public.sbf_eligible(them) then
    raise exception 'SB_FRIEND_LINK: That friend link isn''t working anymore. Ask them to send you a new one.' using errcode = 'P0001';
  end if;
  if them = me then raise exception 'SB_FRIEND_SELF: That''s your own friend link. Send it to a friend.' using errcode = 'P0001'; end if;
  if not public.sbf_rate('ask', 20, 86400) then raise exception 'SB_FRIEND_RATE: That''s a lot of friend requests today. Try again tomorrow.' using errcode = 'P0001'; end if;
  return public.sbf_ask(me, them, 'link');
end $$;

-- Who a friend link belongs to, before you ask (their display name and @username, and where the two of you stand)
-- state: 'self', 'friends', 'asked' (you asked them), 'asked_you' or 'none'. Nothing comes back for a link that doesn't work.
drop function if exists public.friend_link_preview(text);
create or replace function public.friend_link_preview(p_code text)
returns table (display_name text, username text, state text)
language plpgsql volatile security definer set search_path = public as $$
declare me uuid := public.sbf_me(); c text := public.sbg_norm_code(p_code); them uuid; f public.friendships;
begin
  if not public.sbg_lookup_ok() then raise exception 'SB_FRIEND_RATE: Too many code lookups. Try again in an hour.' using errcode = 'P0001'; end if;
  select fc.user_id into them from public.friend_codes fc where fc.code = c;
  if them is null or (them <> me and (public.sbf_blocked(me, them) or not public.sbf_eligible(them))) then return; end if;
  perform public.sbf_expire();
  select * into f from public.friendships where friendships.a = least(me, them) and friendships.b = greatest(me, them);
  return query select p.display_name, p.username,
    case when them = me then 'self' when f.status = 'accepted' then 'friends' when f.requested_by = me then 'asked' when f.requested_by = them then 'asked_you' else 'none' end
  from public.study_profiles p where p.user_id = them;
end $$;

-- Accept or decline a request someone sent you
create or replace function public.answer_friend(p_user uuid, p_accept boolean) returns boolean
language plpgsql volatile security definer set search_path = public as $$
declare me uuid := public.sbf_me(); x uuid := least(me, p_user); y uuid := greatest(me, p_user); f public.friendships;
begin
  perform public.sbf_expire();
  select * into f from public.friendships where a = x and b = y and status = 'pending' and requested_by = p_user for update;
  if not found then return false; end if;
  if not coalesce(p_accept, false) then delete from public.friendships where a = x and b = y; return false; end if;
  if public.sbf_blocked(me, p_user) or not public.sbf_eligible(p_user) then delete from public.friendships where a = x and b = y; return false; end if;
  if public.sbf_count(me) >= 300 then raise exception 'SB_FRIEND_FULL: You have 300 friends, the most there can be. Remove someone first.' using errcode = 'P0001'; end if;
  if public.sbf_count(p_user) >= 300 then raise exception 'SB_FRIEND_FULL: They have the most friends there can be.' using errcode = 'P0001'; end if;
  update public.friendships set status = 'accepted', accepted_at = now() where a = x and b = y;
  return true;
end $$;

-- Remove a friend, or cancel a request you sent
create or replace function public.remove_friend(p_user uuid) returns void
language plpgsql volatile security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  if me is null then raise exception 'Sign in first'; end if;
  delete from public.friendships where a = least(me, p_user) and b = greatest(me, p_user);
end $$;

-- Your friends and requests. mine: you sent the request. Blocked people (either way) and expired requests are left out.
drop function if exists public.my_friends();
create or replace function public.my_friends()
returns table (user_id uuid, display_name text, username text, status text, mine boolean, via text, since timestamptz, face text)
language plpgsql stable security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  if me is null then raise exception 'Sign in first'; end if;
  return query
    select o.id, coalesce(p.display_name, 'Classmate'), p.username, f.status, f.requested_by = me, f.via, coalesce(f.accepted_at, f.created_at),
      (to_jsonb(p) ->> 'face')   -- their companion (supabase-groups.sql keeps it on the profile), shown as their picture
    from public.friendships f
    cross join lateral (select case when f.a = me then f.b else f.a end as id) o
    left join public.study_profiles p on p.user_id = o.id
    where (f.a = me or f.b = me)
      and (f.status = 'accepted' or f.created_at >= now() - interval '30 days')
      and not public.sbf_blocked(me, o.id)
    order by f.status desc, lower(coalesce(p.display_name, '')), o.id
    limit 400;
end $$;

-- Your friend link's code (made the first time you ask), or a new one
create or replace function public.my_friend_code(p_new boolean default false) returns text
language plpgsql volatile security definer set search_path = public as $$
declare me uuid := public.sbf_me(); c text;
begin
  if not coalesce(p_new, false) then
    select code into c from public.friend_codes where user_id = me;
    if c is not null then return c; end if;
  elsif not public.sbf_rate('newlink', 10, 86400) then
    raise exception 'SB_FRIEND_RATE: That''s a lot of new links today. Try again tomorrow.' using errcode = 'P0001';
  end if;
  loop c := public.sbg_new_code(); exit when not exists (select 1 from public.friend_codes where code = c); end loop;
  insert into public.friend_codes (user_id, code, made_at) values (me, c, now())
    on conflict (user_id) do update set code = excluded.code, made_at = excluded.made_at;
  return c;
end $$;

-- Blocking someone ends the friendship (and any request) between the two of you
create or replace function public.sbf_block_unfriend() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  delete from public.friendships where a = least(new.blocker_id, new.blocked_id) and b = greatest(new.blocker_id, new.blocked_id);
  return new;
end $$;
drop trigger if exists sbf_block_unfriend on public.group_blocks;
create trigger sbf_block_unfriend after insert on public.group_blocks for each row execute function public.sbf_block_unfriend();

-- Who can run what
revoke all on function public.sbf_blocked(uuid, uuid), public.sbf_suspended(uuid), public.sbf_eligible(uuid), public.sbf_rate(text, int, int),
  public.sbf_count(uuid), public.sbf_expire(), public.sbf_me(), public.sbf_ask(uuid, uuid, text), public.sbf_block_unfriend() from public, anon, authenticated;
revoke all on function public.request_friend(text), public.request_friend_by_code(text), public.friend_link_preview(text), public.answer_friend(uuid, boolean),
  public.remove_friend(uuid), public.my_friends(), public.my_friend_code(boolean) from public, anon;
grant execute on function public.request_friend(text), public.request_friend_by_code(text), public.friend_link_preview(text), public.answer_friend(uuid, boolean),
  public.remove_friend(uuid), public.my_friends(), public.my_friend_code(boolean) to authenticated;

notify pgrst, 'reload schema';
