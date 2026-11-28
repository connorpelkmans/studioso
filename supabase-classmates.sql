-- Studyboard: Classmates and Course Hubs
-- See who else in a course uses Studyboard, and join one shared study group (a Course Hub) for it.
--
-- Run it after supabase-groups.sql, supabase-moderation.sql and supabase-usernames.sql (and after supabase-plans.sql,
-- if you use it). Safe to run again. If you run supabase-groups.sql again later, this keeps working: the hub rules that
-- live in groups.sql are in groups.sql itself.
--
-- How a course is matched: when a student syncs a course from their school site (Canvas, Brightspace, Blackboard,
-- Moodle, Schoology or Google Classroom), the app sends the site's address and the course's own id there. The server
-- turns those into a keyed hash (HMAC with a secret only this database knows) and keeps only the hash, so the school
-- site's address and course ids are never stored, and nobody can guess a course's key from outside.
--
-- Privacy rules, all kept here on the server:
--   * Off until the student turns it on (classmates_set_visible). Turning it off removes every course right away.
--   * You see classmates only while you're visible yourself, and only people who turned it on too.
--   * Ages never mix: people 13 to 17 are matched only with 13 to 17, people 18 and older only with 18 and older,
--     and each age group gets its own Course Hub. A birthday is needed (supabase-usernames.sql asks everyone once).
--   * Blocks (supabase-moderation.sql) hide people both ways.
--   * Only a display name is shown. No email, no school site profile, no other courses.

create extension if not exists pgcrypto with schema extensions;

-- The secret for the course keys (made once, never leaves the database)
create table if not exists public.classmates_secret (
  id int primary key default 1 check (id = 1),
  secret text not null
);
alter table public.classmates_secret enable row level security;
revoke all on public.classmates_secret from public, anon, authenticated;
insert into public.classmates_secret (id, secret) values (1, encode(extensions.gen_random_bytes(32), 'hex')) on conflict (id) do nothing;

-- Each person's choice (and the limit on how often the app may send its course list)
create table if not exists public.classmates_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  visible boolean not null default false,
  updated_at timestamptz not null default now(),
  win_start timestamptz not null default now(),
  win_n int not null default 0
);
alter table public.classmates_settings enable row level security;
revoke all on public.classmates_settings from public, anon, authenticated;

-- Which courses each visible person is in (only while they're visible)
create table if not exists public.course_presence (
  user_id uuid not null references auth.users(id) on delete cascade,
  ref text not null check (char_length(ref) between 1 and 80),        -- the course's id in the person's own app
  course_key text not null,                                          -- HMAC of platform | site | course id
  platform text not null check (platform in ('bs', 'cv', 'bb', 'md', 'sg', 'gc')),
  label text not null default '' check (char_length(label) <= 80),    -- "MATH 101", the name a new hub gets
  band text not null check (band in ('teen', 'adult')),
  last_seen timestamptz not null default now(),
  primary key (user_id, ref)
);
create index if not exists course_presence_key_idx on public.course_presence (course_key, band);
alter table public.course_presence enable row level security;
revoke all on public.course_presence from public, anon, authenticated;

-- Every course key an account sent in the last 30 days, so nobody can try thousands of course ids to see which have people
create table if not exists public.classmates_key_log (
  user_id uuid not null references auth.users(id) on delete cascade,
  course_key text not null,
  seen_at timestamptz not null default now(),
  primary key (user_id, course_key)
);
alter table public.classmates_key_log enable row level security;
revoke all on public.classmates_key_log from public, anon, authenticated;

-- Course Hubs are study groups with kind 'course' (the kind and the hub rules are in supabase-groups.sql)
alter table public.study_groups add column if not exists course_key text;
alter table public.study_groups add column if not exists course_band text;
alter table public.study_groups drop constraint if exists study_groups_kind_check;
alter table public.study_groups add constraint study_groups_kind_check check (kind in ('study', 'project', 'course'));
create unique index if not exists study_groups_one_hub on public.study_groups (course_key, course_band) where kind = 'course' and deleted_at is null;
-- (A hub's members can read its course_key with the rest of the group. It's a keyed hash: it can't be turned back into
-- the course, and no function accepts it, so it's useless to anyone outside the database.)

-- Helpers
create or replace function public.sbcm_band(p_uid uuid) returns text
language sql stable security definer set search_path = public as $$
  select case when b is null then null when age(current_date, b) >= interval '18 years' then 'adult'
              when age(current_date, b) >= interval '13 years' then 'teen' else null end
  from (select (select birth_date from public.study_profiles where user_id = p_uid) as b) x;
$$;

create or replace function public.sbcm_key(p_platform text, p_origin text, p_ou text) returns text
language sql stable security definer set search_path = public as $$
  select encode(extensions.hmac(convert_to(p_platform || '|' || lower(p_origin) || '|' || p_ou, 'UTF8'),
                                convert_to((select secret from public.classmates_secret where id = 1), 'UTF8'), 'sha256'), 'hex');
$$;

-- Blocked either way (false when moderation isn't set up)
create or replace function public.sbcm_blocked(a uuid, b uuid) returns boolean
language plpgsql stable security definer set search_path = public as $$
declare r boolean := false;
begin
  if to_regclass('public.group_blocks') is null then return false; end if;
  execute 'select exists (select 1 from public.group_blocks where (blocker_id = $1 and blocked_id = $2) or (blocker_id = $2 and blocked_id = $1))' into r using a, b;
  return r;
end $$;

create or replace function public.sbcm_suspended(p_uid uuid) returns boolean
language plpgsql stable security definer set search_path = public as $$
declare r boolean := false;
begin
  if to_regclass('public.group_suspended') is null then return false; end if;
  execute 'select exists (select 1 from public.group_suspended where user_id = $1)' into r using p_uid;
  return r;
end $$;

-- Your setting: {visible, band} (band null: no birthday saved yet)
create or replace function public.classmates_me() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  if me is null then raise exception 'Sign in first'; end if;
  return jsonb_build_object('visible', coalesce((select visible from public.classmates_settings where user_id = me), false), 'band', public.sbcm_band(me));
end $$;

-- Turn it on or off. Off removes your courses at once (Course Hubs you joined stay until you leave them).
create or replace function public.classmates_set_visible(p_on boolean) returns boolean
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  if me is null then raise exception 'Sign in first'; end if;
  if coalesce(p_on, false) and public.sbcm_band(me) is null then raise exception 'SB_AGE_NEEDED: Add your birthday first.'; end if;
  insert into public.classmates_settings (user_id, visible, updated_at) values (me, coalesce(p_on, false), now())
    on conflict (user_id) do update set visible = excluded.visible, updated_at = now();
  if not coalesce(p_on, false) then delete from public.course_presence where user_id = me; end if;
  return coalesce(p_on, false);
end $$;

-- The app's list of synced courses: [{ref, platform, origin, ou, label}], at most 40. Replaces the last list.
-- Returns how many were kept. Does nothing (and returns 0) while you're not visible.
create or replace function public.classmates_sync(p_courses jsonb) returns int
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); band text; s record; c jsonb; k text; n int := 0; newkeys int; refs text[] := '{}';
        pf text; org text; ou text; rf text; lb text;
begin
  if me is null then raise exception 'Sign in first'; end if;
  select * into s from public.classmates_settings where user_id = me for update;
  if s is null or not s.visible then delete from public.course_presence where user_id = me; return 0; end if;
  band := public.sbcm_band(me);
  if band is null then raise exception 'SB_AGE_NEEDED: Add your birthday first.'; end if;
  if jsonb_typeof(p_courses) is distinct from 'array' then raise exception 'SB_BAD: A list of courses is needed.'; end if;
  if jsonb_array_length(p_courses) > 40 then raise exception 'SB_BAD: Up to 40 courses.'; end if;
  -- at most 30 sends an hour
  if s.win_start < now() - interval '1 hour' then update public.classmates_settings set win_start = now(), win_n = 1 where user_id = me;
  elsif s.win_n >= 30 then raise exception 'SB_SLOW: Classmates was updated a lot just now. It tries again later.';
  else update public.classmates_settings set win_n = win_n + 1 where user_id = me; end if;
  delete from public.classmates_key_log where user_id = me and seen_at < now() - interval '30 days';
  for c in select * from jsonb_array_elements(p_courses) loop
    pf := c ->> 'platform'; org := btrim(coalesce(c ->> 'origin', '')); ou := btrim(coalesce(c ->> 'ou', ''));
    rf := btrim(coalesce(c ->> 'ref', '')); lb := left(btrim(coalesce(c ->> 'label', '')), 80);
    if pf not in ('bs', 'cv', 'bb', 'md', 'sg', 'gc') or org !~ '^https://[A-Za-z0-9.-]+(:[0-9]+)?$' or char_length(org) > 200
       or char_length(ou) not between 1 and 120 or char_length(rf) not between 1 and 80 or rf = any(refs) then continue; end if;
    k := public.sbcm_key(pf, org, ou);
    if not exists (select 1 from public.classmates_key_log where user_id = me and course_key = k) then
      select count(*) into newkeys from public.classmates_key_log where user_id = me;
      if newkeys >= 80 then continue; end if;   -- 80 different courses in 30 days is far more than anyone takes
      insert into public.classmates_key_log (user_id, course_key) values (me, k);
    else
      update public.classmates_key_log set seen_at = now() where user_id = me and course_key = k;
    end if;
    insert into public.course_presence (user_id, ref, course_key, platform, label, band, last_seen) values (me, rf, k, pf, lb, band, now())
      on conflict (user_id, ref) do update set course_key = excluded.course_key, platform = excluded.platform, label = excluded.label, band = excluded.band, last_seen = now();
    refs := refs || rf; n := n + 1;
  end loop;
  delete from public.course_presence where user_id = me and not (ref = any(refs));
  -- someone who just turned 18 leaves the teen hubs (and the other way round, if a birthday was corrected)
  delete from public.group_members m using public.study_groups g
    where m.group_id = g.id and m.user_id = me and g.kind = 'course' and g.course_band is distinct from band;
  return n;
end $$;

-- Your courses with how many classmates use Studyboard, and the course's hub
create or replace function public.classmates_summary()
returns table (ref text, label text, classmates int, hub_id uuid, in_hub boolean, hub_members int)
language plpgsql stable security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  if me is null then raise exception 'Sign in first'; end if;
  if not coalesce((select visible from public.classmates_settings where user_id = me), false) then return; end if;
  return query
    select p.ref, p.label,
      (select count(distinct o.user_id)::int from public.course_presence o join public.classmates_settings st on st.user_id = o.user_id and st.visible
        where o.course_key = p.course_key and o.band = p.band and o.user_id <> me and not public.sbcm_blocked(me, o.user_id)),
      h.id, (h.id is not null and exists (select 1 from public.group_members m where m.group_id = h.id and m.user_id = me)),
      coalesce((select count(*)::int from public.group_members m where m.group_id = h.id), 0)
    from public.course_presence p
    left join public.study_groups h on h.kind = 'course' and h.course_key = p.course_key and h.course_band = p.band and h.deleted_at is null
    where p.user_id = me
    order by p.label, p.ref;
end $$;

-- Classmates' display names in one of your courses (at most 60)
create or replace function public.classmates_list(p_ref text)
returns table (user_id uuid, name text)
language plpgsql stable security definer set search_path = public as $$
declare me uuid := auth.uid(); p record;
begin
  if me is null then raise exception 'Sign in first'; end if;
  if not coalesce((select st.visible from public.classmates_settings st where st.user_id = me), false) then return; end if;
  select * into p from public.course_presence cp where cp.user_id = me and cp.ref = p_ref;
  if p is null then return; end if;
  return query
    select x.user_id, x.name from (
      select distinct on (o.user_id) o.user_id, coalesce(nullif(btrim(sp.display_name), ''), 'Classmate')::text as name
      from public.course_presence o
      join public.classmates_settings st on st.user_id = o.user_id and st.visible
      left join public.study_profiles sp on sp.user_id = o.user_id
      where o.course_key = p.course_key and o.band = p.band and o.user_id <> me and not public.sbcm_blocked(me, o.user_id)
    ) x order by x.name limit 60;
end $$;

-- Join the Course Hub for one of your courses (it's made the first time someone joins). Returns the group's id.
create or replace function public.classmates_join_hub(p_ref text) returns uuid
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); p record; g uuid; c text; nm text;
begin
  if me is null then raise exception 'Sign in first'; end if;
  if not coalesce((select visible from public.classmates_settings where user_id = me), false) then raise exception 'SB_CM_OFF: Turn on Classmates first.'; end if;
  select * into p from public.course_presence where user_id = me and ref = p_ref;
  if p is null then raise exception 'SB_CM_COURSE: That course isn''t synced from your school site yet. Sync it, then try again.'; end if;
  if p.band is distinct from public.sbcm_band(me) then raise exception 'SB_CM_COURSE: Sync your school site again, then try again.'; end if;
  if public.sbcm_suspended(me) then
    raise exception 'Your account can''t use study groups after a report was reviewed. The rest of Studyboard works as usual.';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('sb-hub:' || p.course_key || ':' || p.band, 0));
  select id into g from public.study_groups where kind = 'course' and course_key = p.course_key and course_band = p.band and deleted_at is null;
  if g is null then
    loop
      c := public.sbg_new_code();
      exit when not exists (select 1 from public.study_groups where invite_code = c);
    end loop;
    nm := coalesce(nullif(p.label, ''), 'Course Hub');
    insert into public.study_groups (name, course, owner_id, invite_code, kind, course_key, course_band)
      values (left(nm, 80), left(coalesce(p.label, ''), 80), me, c, 'course', p.course_key, p.band) returning id into g;
  end if;
  if exists (select 1 from public.group_bans where group_id = g and user_id = me) then
    raise exception 'You were removed from this Course Hub, so you can''t rejoin it.';
  end if;
  if not exists (select 1 from public.group_members where group_id = g and user_id = me) then
    if (select count(*) from public.group_members where group_id = g) >= 300 then raise exception 'This Course Hub is full (300 members).'; end if;
    insert into public.group_members (group_id, user_id, role, display_name) values (g, me, 'member', public.sbg_my_name());
  end if;
  return g;
end $$;

-- Tidying up (daily, with pg_cron): courses not synced in 120 days, old key log rows, and hubs nobody is in
create or replace function public.classmates_purge() returns void
language plpgsql security definer set search_path = public as $$
begin
  delete from public.course_presence where last_seen < now() - interval '120 days';
  delete from public.classmates_key_log where seen_at < now() - interval '30 days';
  update public.study_groups g set deleted_at = now()
    where g.kind = 'course' and g.deleted_at is null and g.created_at < now() - interval '1 day'
      and not exists (select 1 from public.group_members m where m.group_id = g.id);
end $$;

revoke all on function public.sbcm_band(uuid), public.sbcm_key(text, text, text), public.sbcm_blocked(uuid, uuid), public.sbcm_suspended(uuid),
  public.classmates_purge() from public, anon, authenticated;
revoke all on function public.classmates_me(), public.classmates_set_visible(boolean), public.classmates_sync(jsonb), public.classmates_summary(),
  public.classmates_list(text), public.classmates_join_hub(text) from public, anon;
grant execute on function public.classmates_me(), public.classmates_set_visible(boolean), public.classmates_sync(jsonb), public.classmates_summary(),
  public.classmates_list(text), public.classmates_join_hub(text) to authenticated;

do $$
begin
  begin
    create extension if not exists pg_cron;
  exception when others then
    raise notice 'pg_cron is not available, so old Classmates rows are not removed on their own. Turn it on in Database > Extensions and run this file again, or run: select public.classmates_purge();';
    return;
  end;
  perform cron.unschedule(jobid) from cron.job where jobname = 'studyboard-classmates-purge';
  perform cron.schedule('studyboard-classmates-purge', '47 4 * * *', 'select public.classmates_purge();');
end $$;

notify pgrst, 'reload schema';
