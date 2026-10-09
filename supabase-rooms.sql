-- Studyboard 1.11: Study Together rooms (shared focus sessions inside a study group)
-- Run this once in Supabase: SQL Editor > New query > paste everything > Run.
-- Run groups.sql first. It is safe to run this again (it only adds what is missing and refreshes the rules).
--
-- What it adds:
--  * study_rooms         one row per group for its current (or last) session: who started it, the length, when it ends.
--  * study_room_people   who joined that session, their goal, and whether they're still in the room.
--  * Functions the app calls: room_now, room_limits, start_room, join_room, leave_room, room_ping, end_room.
--  * Rules so only members of a group can see or join its room, and live updates for rooms.
-- Room size and length follow the group owner's plan, but only while the paywall row in studyboard_config is true.
-- While it is false (or plans.sql isn't installed), every room gets the Pro limits: 30 people and 3 hours.

-- ---------- Tables ----------
create table if not exists public.study_rooms (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.study_groups(id) on delete cascade,
  started_by uuid not null references auth.users(id) on delete cascade,
  starter_name text not null default '',
  goal text not null default '' check (char_length(goal) <= 80),
  minutes int not null check (minutes between 5 and 600),
  max_people int not null default 30 check (max_people between 1 and 500),
  started_at timestamptz not null default now(),
  ends_at timestamptz not null,
  status text not null default 'active' check (status in ('active', 'ended'))
);
-- One room per group: starting a new session replaces the finished one.
create unique index if not exists study_rooms_group_idx on public.study_rooms (group_id);
create index if not exists study_rooms_ends_idx on public.study_rooms (ends_at);

create table if not exists public.study_room_people (
  room_id uuid not null references public.study_rooms(id) on delete cascade,
  group_id uuid not null references public.study_groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null default '',
  goal text not null default '' check (char_length(goal) <= 80),
  here boolean not null default true,
  first_joined_at timestamptz not null default now(),
  joined_at timestamptz not null default now(),
  seen_at timestamptz not null default now(),
  primary key (room_id, user_id)
);
create index if not exists study_room_people_group_idx on public.study_room_people (group_id);

-- ---------- Row level security: members of the group only ----------
alter table public.study_rooms enable row level security;
alter table public.study_room_people enable row level security;

drop policy if exists "room member read" on public.study_rooms;
create policy "room member read" on public.study_rooms for select to authenticated using (public.sbg_is_member(group_id));
drop policy if exists "room people member read" on public.study_room_people;
create policy "room people member read" on public.study_room_people for select to authenticated using (public.sbg_is_member(group_id));

-- Nobody writes these tables directly; everything goes through the functions below.
revoke all on public.study_rooms, public.study_room_people from anon, authenticated;
grant select on public.study_rooms, public.study_room_people to authenticated;

-- ---------- Limits (from the group owner's plan) ----------
-- Adds room limits to the plans "limits" row if it's there and doesn't have them yet. Values you changed are kept.
do $$
begin
  if to_regclass('public.studyboard_config') is null then return; end if;
  update public.studyboard_config
     set value = value
       || jsonb_build_object('free', '{"roomPeople": 4, "roomMinutes": 60}'::jsonb || coalesce(value -> 'free', '{}'::jsonb))
       || jsonb_build_object('pro', '{"roomPeople": 30, "roomMinutes": 180}'::jsonb || coalesce(value -> 'pro', '{}'::jsonb))
   where key = 'limits' and jsonb_typeof(value) = 'object'
     and not ((value -> 'free') ? 'roomPeople' and (value -> 'free') ? 'roomMinutes' and (value -> 'pro') ? 'roomPeople' and (value -> 'pro') ? 'roomMinutes');
end $$;

create or replace function public.sbr_limits(gid uuid)
returns table (max_people int, max_minutes int, owner_pro boolean, paywall boolean)
language plpgsql stable security definer set search_path = public as $$
declare
  owner uuid;
  pw boolean := false;
  pro boolean := true;
  lim jsonb;
  tier text;
  defaults constant jsonb := '{"free": {"roomPeople": 4, "roomMinutes": 60}, "pro": {"roomPeople": 30, "roomMinutes": 180}}';
  p jsonb; m jsonb;
begin
  select g.owner_id into owner from public.study_groups g where g.id = gid;
  if to_regprocedure('public.studyboard_paywall()') is not null then
    execute 'select public.studyboard_paywall()' into pw;
  end if;
  if coalesce(pw, false) and to_regprocedure('public.studyboard_is_pro(uuid)') is not null then
    execute 'select public.studyboard_is_pro($1)' into pro using owner;
  end if;
  pro := coalesce(pro, false) or not coalesce(pw, false);
  if to_regclass('public.studyboard_config') is not null then
    execute 'select value from public.studyboard_config where key = ''limits''' into lim;
  end if;
  tier := case when pro then 'pro' else 'free' end;
  p := coalesce(lim -> tier -> 'roomPeople', defaults -> tier -> 'roomPeople');
  m := coalesce(lim -> tier -> 'roomMinutes', defaults -> tier -> 'roomMinutes');
  -- A null limit means "as much as a room allows" (500 people, 10 hours).
  max_people := case when jsonb_typeof(p) = 'number' then least(greatest((p #>> '{}')::numeric::int, 1), 500) else 500 end;
  max_minutes := case when jsonb_typeof(m) = 'number' then least(greatest((m #>> '{}')::numeric::int, 5), 600) else 600 end;
  owner_pro := pro and coalesce(pw, false);
  paywall := coalesce(pw, false);
  return next;
end $$;

-- ---------- Small helpers ----------
create or replace function public.sbr_rate_ok(what text, n int, secs int) returns boolean
language plpgsql volatile security definer set search_path = public as $$
begin
  if to_regprocedure('public.studyboard_rate_hit(text,integer,integer)') is null then return true; end if;
  return public.studyboard_rate_hit(what || ':' || coalesce(auth.uid()::text, 'anon'), n, secs);
end $$;

-- Who is in the room right now. Someone whose app stopped checking in for 5 minutes doesn't hold a seat.
create or replace function public.sbr_here_count(rid uuid, except_user uuid) returns int
language sql stable security definer set search_path = public as $$
  select count(*)::int from public.study_room_people p
  where p.room_id = rid and p.here and p.seen_at > now() - interval '5 minutes' and p.user_id is distinct from except_user
$$;

-- Finished rooms are kept for 12 hours (so everyone sees the shared moment), then removed.
create or replace function public.room_cleanup() returns integer
language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  with gone as (delete from public.study_rooms where ends_at < now() - interval '12 hours' returning 1)
  select count(*) into n from gone;
  return n;
end $$;

-- ---------- Functions the app calls ----------
-- The server's clock, so every device counts down from the same start time.
create or replace function public.room_now() returns timestamptz
language sql volatile set search_path = public as $$ select clock_timestamp() $$;

-- The size and length limits for a group's room (members only).
create or replace function public.room_limits(p_group uuid)
returns table (max_people int, max_minutes int, owner_pro boolean, paywall boolean)
language plpgsql stable security definer set search_path = public as $$
begin
  if auth.uid() is null or not public.sbg_is_member(p_group) then return; end if;
  return query select * from public.sbr_limits(p_group);
end $$;

-- Start a session for the group. You join it right away.
create or replace function public.start_room(p_group uuid, p_minutes int, p_goal text) returns public.study_rooms
language plpgsql volatile security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  l record;
  r public.study_rooms;
  t timestamptz := clock_timestamp();
  g text := left(btrim(coalesce(p_goal, '')), 80);
begin
  if me is null then raise exception 'Sign in first'; end if;
  if not public.sbg_is_member(p_group) then raise exception 'SB_ROOM_MEMBER: Only members of this group can start a session.' using errcode = '42501'; end if;
  select * into l from public.sbr_limits(p_group);
  if p_minutes is null or p_minutes < 5 then raise exception 'SB_ROOM_LENGTH: A session needs to be at least 5 minutes.' using errcode = 'P0001'; end if;
  if p_minutes > l.max_minutes then
    raise exception 'SB_ROOM_LENGTH: Sessions in this group can be up to % minutes.%', l.max_minutes,
      case when l.paywall and not l.owner_pro then ' The group owner can go Pro for longer sessions.' else '' end using errcode = 'P0001';
  end if;
  -- Lock this group's room row (if any) so two people starting at the same moment don't both win.
  perform 1 from public.study_groups where id = p_group for update;
  select * into r from public.study_rooms where group_id = p_group;
  if found and r.status = 'active' and r.ends_at > t then
    raise exception 'SB_ROOM_BUSY: A session is already running in this group. Join it instead.' using errcode = 'P0001';
  end if;
  if not public.sbr_rate_ok('room-start', 12, 3600) then
    raise exception 'SB_ROOM_RATE: That''s a lot of sessions started this hour. Try again a bit later.' using errcode = 'P0001';
  end if;
  delete from public.study_rooms where group_id = p_group;
  perform public.room_cleanup();
  insert into public.study_rooms (group_id, started_by, starter_name, goal, minutes, max_people, started_at, ends_at, status)
    values (p_group, me, public.sbg_my_name(), g, p_minutes, l.max_people, t, t + make_interval(mins => p_minutes), 'active')
    returning * into r;
  insert into public.study_room_people (room_id, group_id, user_id, display_name, goal, here, first_joined_at, joined_at, seen_at)
    values (r.id, p_group, me, public.sbg_my_name(), g, true, t, t, t);
  return r;
end $$;

-- Join (or rejoin) a running session, with your own goal.
create or replace function public.join_room(p_room uuid, p_goal text) returns public.study_rooms
language plpgsql volatile security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  r public.study_rooms;
  l record;
  t timestamptz := clock_timestamp();
  g text := left(btrim(coalesce(p_goal, '')), 80);
begin
  if me is null then raise exception 'Sign in first'; end if;
  select * into r from public.study_rooms where id = p_room;
  if not found or not public.sbg_is_member(r.group_id) then
    raise exception 'SB_ROOM_GONE: That session isn''t running anymore.' using errcode = 'P0001';
  end if;
  if r.status <> 'active' or r.ends_at <= t then
    raise exception 'SB_ROOM_GONE: That session has already finished.' using errcode = 'P0001';
  end if;
  if not public.sbr_rate_ok('room-join', 60, 3600) then
    raise exception 'SB_ROOM_RATE: Too many joins this hour. Try again a bit later.' using errcode = 'P0001';
  end if;
  -- Serialize joins to this room so the size limit holds.
  perform 1 from public.study_rooms where id = p_room for update;
  select * into l from public.sbr_limits(r.group_id);
  -- The owner's plan right now decides (so going Pro mid-session makes room right away).
  if public.sbr_here_count(p_room, me) >= l.max_people then
    raise exception 'SB_ROOM_FULL: This room is full (% people).%', l.max_people,
      case when l.paywall and not l.owner_pro then ' The group owner can go Pro for bigger rooms.' else '' end using errcode = 'P0001';
  end if;
  insert into public.study_room_people as p (room_id, group_id, user_id, display_name, goal, here, first_joined_at, joined_at, seen_at)
    values (p_room, r.group_id, me, public.sbg_my_name(), g, true, t, t, t)
  on conflict (room_id, user_id) do update
    set here = true, joined_at = case when p.here then p.joined_at else t end, seen_at = t,
        goal = case when p_goal is null then p.goal else excluded.goal end, display_name = excluded.display_name;
  return r;
end $$;

-- Leave the room (you can rejoin while it's running).
create or replace function public.leave_room(p_room uuid) returns void
language plpgsql volatile security definer set search_path = public as $$
begin
  update public.study_room_people set here = false, seen_at = clock_timestamp()
  where room_id = p_room and user_id = auth.uid() and here;
end $$;

-- "Still here": the app calls this every couple of minutes while you're in a room.
create or replace function public.room_ping(p_room uuid) returns void
language plpgsql volatile security definer set search_path = public as $$
begin
  update public.study_room_people set seen_at = clock_timestamp()
  where room_id = p_room and user_id = auth.uid() and here and seen_at < clock_timestamp() - interval '30 seconds';
end $$;

-- End the session early for everyone: the person who started it or the group owner.
create or replace function public.end_room(p_room uuid) returns void
language plpgsql volatile security definer set search_path = public as $$
declare r public.study_rooms;
begin
  select * into r from public.study_rooms where id = p_room;
  if not found then return; end if;
  if r.started_by is distinct from auth.uid() and not public.sbg_is_owner(r.group_id) then
    raise exception 'SB_ROOM_OWNER: Only the person who started this session or the group owner can end it.' using errcode = '42501';
  end if;
  update public.study_rooms set status = 'ended', ends_at = least(ends_at, clock_timestamp()) where id = p_room and status = 'active';
end $$;

revoke all on function public.sbr_limits(uuid), public.sbr_rate_ok(text, int, int), public.sbr_here_count(uuid, uuid), public.room_cleanup(),
  public.room_now(), public.room_limits(uuid), public.start_room(uuid, int, text), public.join_room(uuid, text),
  public.leave_room(uuid), public.room_ping(uuid), public.end_room(uuid) from public, anon, authenticated;
grant execute on function public.room_now(), public.room_limits(uuid), public.start_room(uuid, int, text), public.join_room(uuid, text),
  public.leave_room(uuid), public.room_ping(uuid), public.end_room(uuid) to authenticated;

-- ---------- Live updates ----------
do $$
declare t text;
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    raise notice 'No supabase_realtime publication found, so rooms won''t update live. (On Supabase it is always there.)';
    return;
  end if;
  foreach t in array array['study_rooms', 'study_room_people'] loop
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- Who's in the room and the cheers go through private Realtime channels named "sbroom:<group id>".
-- These rules let only members of that group listen or send on it.
create or replace function public.sbr_topic_ok(p_topic text) returns boolean
language plpgsql stable security definer set search_path = public as $$
begin
  if p_topic is null or p_topic !~ '^sbroom:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then return false; end if;
  return public.sbg_is_member(substr(p_topic, 8)::uuid);
end $$;
revoke all on function public.sbr_topic_ok(text) from public, anon;
grant execute on function public.sbr_topic_ok(text) to authenticated;

do $$
begin
  if to_regclass('realtime.messages') is null then
    raise notice 'realtime.messages not found, so the room channel rules were skipped. The app then uses a regular channel for room changes only (no live presence or cheers).';
    return;
  end if;
  begin
    execute 'drop policy if exists "studyboard room listen" on realtime.messages';
    execute 'create policy "studyboard room listen" on realtime.messages for select to authenticated using (realtime.messages.extension in (''broadcast'', ''presence'') and public.sbr_topic_ok((select realtime.topic())))';
    execute 'drop policy if exists "studyboard room send" on realtime.messages';
    execute 'create policy "studyboard room send" on realtime.messages for insert to authenticated with check (realtime.messages.extension in (''broadcast'', ''presence'') and public.sbr_topic_ok((select realtime.topic())))';
  exception when insufficient_privilege then
    raise notice 'Skipped the room channel rules (no permission on realtime.messages). The app then uses a regular channel for room changes only (no live presence or cheers).';
  end;
end $$;

-- Clean up finished rooms every hour, if pg_cron is available. Starting a new session also cleans up.
do $$
begin
  begin
    create extension if not exists pg_cron;
  exception when others then
    raise notice 'pg_cron is not available. Finished rooms are cleaned up whenever someone starts a new session.';
  end;
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule(jobid) from cron.job where jobname = 'studyboard-room-cleanup';
    perform cron.schedule('studyboard-room-cleanup', '23 * * * *', 'select public.room_cleanup()');
  end if;
end $$;

-- Ask the API to notice the new tables right away
notify pgrst, 'reload schema';
