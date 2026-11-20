-- Studyboard launch tools (run after supabase-setup.sql, supabase-plans.sql, supabase-groups.sql, supabase-sharing.sql
-- and supabase-app-flags.sql; safe to run again). See LAUNCH-STATS.md.
--
--  1. The daily check-in: once a day each copy of the app asks whether its version is still OK (the "please update" switch).
--     The server adds one to a daily total for that kind of device and whether it's signed in. Nothing about the device or
--     the person is kept: no account id, no device id, no IP address. That total is how many devices used Studyboard, with
--     or without an account.
--  2. Launch stats: a nightly job saves the day's counts (sign-ups, accounts active, decks studied, quizzes taken, invites
--     accepted, and how many of each day's new accounts came back). Only the totals are kept. The note that an account was
--     active today is deleted by that same job.
--  3. Invite rewards: 3 friends who join from your link and come back on another day = a month of Pro's features
--     (the "month" promo kind: no Studyboard AI, the free plan's storage), up to 6 months a year.

-- ---------------------------------------------------------------------------------------------------------------------------
-- 1. The daily check-in and the version switch
-- ---------------------------------------------------------------------------------------------------------------------------
create table if not exists public.studyboard_daily_checkins (
  day date not null,
  platform text not null check (platform in ('web', 'app', 'desktop', 'ios', 'android', 'other')),
  account boolean not null,
  n bigint not null default 0,
  primary key (day, platform, account)
);
alter table public.studyboard_daily_checkins enable row level security;
revoke all on public.studyboard_daily_checkins from public, anon, authenticated;

-- An account was active on this day. Deleted by the nightly job once the day is counted (studyboard_stats_snapshot).
create table if not exists public.studyboard_active_days (
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null,
  primary key (user_id, day)
);
alter table public.studyboard_active_days enable row level security;
revoke all on public.studyboard_active_days from public, anon, authenticated;

-- The version rule the app follows, in app_flags (public, changed only from the SQL editor):
--   {"min": "1.15.0"}            versions older than 1.15.0 stop syncing and ask to update (changes stay on the device)
--   {"bad": ["1.15.7"]}          these exact versions stop syncing and ask to update
--   {"nudge": "1.15.8"}          versions older than this see a gentle, dismissible "An update is ready"
--   {"message": "..."}           optional: one sentence shown with the update request (why)
-- Turn it all off: update public.app_flags set value = '{}' where key = 'version_policy';
insert into public.app_flags (key, value, note) values
  ('version_policy', '{}'::jsonb, 'The update switch. {"min": "1.15.0", "bad": ["1.15.7"], "nudge": "1.15.8", "message": "..."}: see supabase-launch.sql.')
on conflict (key) do nothing;

create table if not exists public.studyboard_ref_codes (
  user_id uuid primary key references auth.users(id) on delete cascade,
  code text not null unique check (code ~ '^[A-Z2-9]{8}$'),
  created_at timestamptz not null default now()
);
create table if not exists public.studyboard_referrals (
  referred uuid primary key references auth.users(id) on delete cascade,
  referrer uuid not null references auth.users(id) on delete cascade,
  via text not null default 'link' check (via in ('link', 'group', 'deck', 'map', 'rehearse')),
  first_day date not null default current_date,
  created_at timestamptz not null default now(),
  qualified_at timestamptz,
  rewarded boolean not null default false
);
create index if not exists studyboard_referrals_referrer_idx on public.studyboard_referrals (referrer);
create table if not exists public.studyboard_ref_rewards (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  until timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists studyboard_ref_rewards_user_idx on public.studyboard_ref_rewards (user_id, created_at);
do $$ declare t text; begin
  foreach t in array array['studyboard_ref_codes', 'studyboard_referrals', 'studyboard_ref_rewards'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from public, anon, authenticated', t);
  end loop;
end $$;

-- How many friends make a reward, and the most rewards in any 365 days
create or replace function public.studyboard_ref_rule() returns jsonb language sql immutable set search_path = '' as $$
  select '{"need": 3, "cap": 6}'::jsonb
$$;

-- A friend who joined from your link qualifies when they come back on a later day with a confirmed email.
-- Every 3 qualified friends (not yet rewarded) add a month of promo Pro to the person who invited them.
create or replace function public.studyboard_ref_settle(p_referrer uuid) returns int
language plpgsql volatile security definer set search_path = '' as $$
declare need int := (public.studyboard_ref_rule() ->> 'need')::int; cap int := (public.studyboard_ref_rule() ->> 'cap')::int;
        got int := 0; cur timestamptz; until timestamptz; ids uuid[];
begin
  loop
    if (select count(*) from public.studyboard_ref_rewards r where r.user_id = p_referrer and r.created_at > now() - interval '365 days') >= cap then exit; end if;
    select array_agg(referred) into ids from (select f.referred from public.studyboard_referrals f
      where f.referrer = p_referrer and f.qualified_at is not null and not f.rewarded order by f.qualified_at limit need) x;
    if coalesce(array_length(ids, 1), 0) < need then exit; end if;
    select e.promo_until into cur from public.studyboard_entitlements e where e.user_id = p_referrer;
    until := greatest(coalesce(cur, now()), now()) + interval '1 month';
    insert into public.studyboard_entitlements as e (user_id, plan, will_renew, promo_until, updated_at) values (p_referrer, 'free', false, until, now())
      on conflict (user_id) do update set promo_until = until, updated_at = now();
    update public.studyboard_referrals set rewarded = true where referred = any(ids);
    insert into public.studyboard_ref_rewards (user_id, until) values (p_referrer, until);
    got := got + 1;
  end loop;
  return got;
end $$;
revoke all on function public.studyboard_ref_settle(uuid) from public, anon, authenticated;

create or replace function public.studyboard_checkin(p_version text, p_platform text, p_count boolean default true) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare me uuid := auth.uid(); pf text := lower(coalesce(p_platform, ''));
        pol jsonb; out jsonb; f public.studyboard_referrals;
begin
  if pf not in ('web', 'app', 'desktop', 'ios', 'android') then pf := 'other'; end if;
  if p_count then
    insert into public.studyboard_daily_checkins as c (day, platform, account, n) values (current_date, pf, me is not null, 1)
      on conflict (day, platform, account) do update set n = c.n + 1;
  end if;
  select value into pol from public.app_flags where key = 'version_policy';
  out := jsonb_build_object('policy', coalesce(pol, '{}'::jsonb));
  if me is not null then
    insert into public.studyboard_active_days (user_id, day) values (me, current_date) on conflict do nothing;
    -- a friend who joined from someone's link, back on a later day: they count toward that person's reward
    select * into f from public.studyboard_referrals where referred = me;
    if found and f.qualified_at is null and current_date > f.first_day
       and exists (select 1 from auth.users u where u.id = me and u.email_confirmed_at is not null) then
      update public.studyboard_referrals set qualified_at = now() where referred = me;
      perform public.studyboard_ref_settle(f.referrer);
    end if;
    out := out || jsonb_build_object('rewards', (select count(*) from public.studyboard_ref_rewards r where r.user_id = me));
  end if;
  return out;
end $$;
revoke all on function public.studyboard_checkin(text, text, boolean) from public;
grant execute on function public.studyboard_checkin(text, text, boolean) to anon, authenticated;

-- ---------------------------------------------------------------------------------------------------------------------------
-- 3. Invite rewards: your code and progress, and claiming a friend's link
-- ---------------------------------------------------------------------------------------------------------------------------
create or replace function public.studyboard_my_invites() returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare me uuid := auth.uid(); c text; abc constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; i int;
        rule jsonb := public.studyboard_ref_rule(); pu timestamptz;
begin
  if me is null then raise exception 'sign in first' using errcode = '42501'; end if;
  select code into c from public.studyboard_ref_codes where user_id = me;
  while c is null loop
    c := ''; for i in 1..8 loop c := c || substr(abc, 1 + floor(random() * length(abc))::int, 1); end loop;
    begin insert into public.studyboard_ref_codes (user_id, code) values (me, c);
    exception when unique_violation then c := null; end;
  end loop;
  select e.promo_until into pu from public.studyboard_entitlements e where e.user_id = me;
  return jsonb_build_object('code', c, 'need', rule -> 'need', 'cap', rule -> 'cap',
    'joined', (select count(*) from public.studyboard_referrals f where f.referrer = me),
    'qualified', (select count(*) from public.studyboard_referrals f where f.referrer = me and f.qualified_at is not null),
    'toward', (select count(*) from public.studyboard_referrals f where f.referrer = me and f.qualified_at is not null and not f.rewarded),
    'waiting', (select count(*) from public.studyboard_referrals f where f.referrer = me and f.qualified_at is null),
    'rewards', (select count(*) from public.studyboard_ref_rewards r where r.user_id = me),
    'year', (select count(*) from public.studyboard_ref_rewards r where r.user_id = me and r.created_at > now() - interval '365 days'),
    'promo_until', case when pu > now() then pu end);
end $$;
revoke all on function public.studyboard_my_invites() from public, anon;
grant execute on function public.studyboard_my_invites() to authenticated;

-- A new account (made in the last 14 days) records who invited it. Only once, never yourself, never a throwaway email.
create or replace function public.studyboard_claim_invite(p_code text, p_via text default 'link') returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare me uuid := auth.uid(); who uuid; made timestamptz; em text; via text := lower(coalesce(p_via, 'link'));
begin
  if me is null then return jsonb_build_object('error', 'signin'); end if;
  if via not in ('link', 'group', 'deck', 'map', 'rehearse') then via := 'link'; end if;
  select user_id into who from public.studyboard_ref_codes where code = upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'));
  if who is null then return jsonb_build_object('error', 'invalid'); end if;
  if who = me then return jsonb_build_object('error', 'own'); end if;
  if exists (select 1 from public.studyboard_referrals where referred = me) then return jsonb_build_object('error', 'already'); end if;
  select u.created_at, lower(u.email) into made, em from auth.users u where u.id = me;
  if made < now() - interval '14 days' then return jsonb_build_object('error', 'not_new'); end if;
  if exists (select 1 from public.studyboard_trial_blocked_domains d where d.domain = split_part(em, '@', 2)) then return jsonb_build_object('error', 'blocked'); end if;
  insert into public.studyboard_referrals (referred, referrer, via) values (me, who, via) on conflict do nothing;
  return jsonb_build_object('ok', true);
end $$;
revoke all on function public.studyboard_claim_invite(text, text) from public, anon;
grant execute on function public.studyboard_claim_invite(text, text) to authenticated;

-- ---------------------------------------------------------------------------------------------------------------------------
-- 2. Launch stats (totals only)
-- ---------------------------------------------------------------------------------------------------------------------------
create table if not exists public.studyboard_stats_daily (
  day date primary key,
  signups int not null default 0,
  active_accounts int not null default 0,
  devices_no_account bigint not null default 0,
  devices_account bigint not null default 0,
  people_studied int not null default 0,
  decks_studied int not null default 0,
  quizzes int not null default 0,
  group_joins int not null default 0,
  deck_adds int not null default 0,
  invite_joins int not null default 0,
  computed_at timestamptz not null default now()
);
-- How many of the accounts made on "cohort" were active on "day" (for coming back after 1 day, 7 days, 30 days)
create table if not exists public.studyboard_stats_cohorts (
  day date not null,
  cohort date not null,
  active int not null,
  primary key (day, cohort)
);
do $$ declare t text; begin
  foreach t in array array['studyboard_stats_daily', 'studyboard_stats_cohorts'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from public, anon, authenticated', t);
  end loop;
end $$;

-- The counts for one day (UTC). Active = the app checked in signed in, or the account saved something that day.
create or replace function public.studyboard_stats_for(d date) returns jsonb
language sql stable security definer set search_path = '' as $$
  with lo as (select d::timestamptz t0, (d + 1)::timestamptz t1),
  act as (
    select a.user_id from public.studyboard_active_days a where a.day = d
    union
    select distinct i.user_id from public.items i, lo where i.updated_at >= lo.t0 and i.updated_at < lo.t1
  ),
  decks as (
    select i.user_id, i.id from public.items i, lo
    where i.kind = 'deck' and i.updated_at >= lo.t0
      and exists (select 1 from jsonb_array_elements(case when jsonb_typeof(i.data -> 'cards') = 'array' then i.data -> 'cards' else '[]'::jsonb end) c where c ->> 'last' = d::text)
  ),
  quiz as (
    select count(*) n from public.items i, lo,
      jsonb_array_elements(case when jsonb_typeof(i.data -> 'quizzes') = 'array' then i.data -> 'quizzes' else '[]'::jsonb end) q
    where i.kind = 'deck' and i.updated_at >= lo.t0 and (q ->> 'at') ~ '^\d{10,14}$'
      and (q ->> 'at')::bigint >= extract(epoch from lo.t0) * 1000 and (q ->> 'at')::bigint < extract(epoch from lo.t1) * 1000
  )
  select jsonb_build_object(
    'day', d,
    'signups', (select count(*) from auth.users u, lo where u.created_at >= lo.t0 and u.created_at < lo.t1),
    'active_accounts', (select count(*) from act),
    'devices_no_account', coalesce((select sum(n) from public.studyboard_daily_checkins c where c.day = d and not c.account), 0),
    'devices_account', coalesce((select sum(n) from public.studyboard_daily_checkins c where c.day = d and c.account), 0),
    'people_studied', (select count(distinct user_id) from decks),
    'decks_studied', (select count(*) from decks),
    'quizzes', (select n from quiz),
    'group_joins', (select count(*) from public.group_members m, lo where m.role = 'member' and m.joined_at >= lo.t0 and m.joined_at < lo.t1),
    'deck_adds', (select count(*) from public.share_saves s, lo where s.created_at >= lo.t0 and s.created_at < lo.t1),
    'invite_joins', (select count(*) from public.studyboard_referrals f, lo where f.created_at >= lo.t0 and f.created_at < lo.t1),
    'cohorts', coalesce((select jsonb_object_agg(cohort, n) from (
        select u.created_at::date cohort, count(*) n from act join auth.users u on u.id = act.user_id
        where u.created_at::date between d - 60 and d group by 1) x), '{}'::jsonb)
  )
$$;
revoke all on function public.studyboard_stats_for(date) from public, anon, authenticated;

-- Saves a finished day's totals, then forgets which accounts were active that day
create or replace function public.studyboard_stats_save(p_day date) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare s jsonb;
begin
  if p_day >= current_date then raise exception 'only a finished day can be saved'; end if;
  s := public.studyboard_stats_for(p_day);
  insert into public.studyboard_stats_daily as t (day, signups, active_accounts, devices_no_account, devices_account, people_studied, decks_studied, quizzes, group_joins, deck_adds, invite_joins, computed_at)
  values (p_day, (s->>'signups')::int, (s->>'active_accounts')::int, (s->>'devices_no_account')::bigint, (s->>'devices_account')::bigint,
          (s->>'people_studied')::int, (s->>'decks_studied')::int, (s->>'quizzes')::int, (s->>'group_joins')::int, (s->>'deck_adds')::int, (s->>'invite_joins')::int, now())
  on conflict (day) do update set signups = excluded.signups, active_accounts = greatest(t.active_accounts, excluded.active_accounts),
    devices_no_account = excluded.devices_no_account, devices_account = excluded.devices_account, people_studied = greatest(t.people_studied, excluded.people_studied),
    decks_studied = greatest(t.decks_studied, excluded.decks_studied), quizzes = greatest(t.quizzes, excluded.quizzes), group_joins = excluded.group_joins,
    deck_adds = excluded.deck_adds, invite_joins = excluded.invite_joins, computed_at = now();
  insert into public.studyboard_stats_cohorts as c (day, cohort, active)
    select p_day, k::date, v::int from jsonb_each_text(s -> 'cohorts') e(k, v)
  on conflict (day, cohort) do update set active = greatest(c.active, excluded.active);
  delete from public.studyboard_active_days where day <= p_day;
  delete from public.studyboard_daily_checkins where day < current_date - 400;
  return s - 'cohorts';
end $$;
revoke all on function public.studyboard_stats_save(date) from public, anon, authenticated;
create or replace function public.studyboard_stats_snapshot(p_day date default current_date - 1) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
begin
  perform public.plans_deny_clients();
  return public.studyboard_stats_save(p_day);
end $$;
revoke all on function public.studyboard_stats_snapshot(date) from public, anon, authenticated;

-- Who may open the stats page (website/stats/): the emails in studyboard_config 'stats_viewers'.
--   insert into public.studyboard_config (key, value) values ('stats_viewers', '["you@example.com"]')
--     on conflict (key) do update set value = excluded.value, updated_at = now();
create or replace function public.studyboard_launch_stats(p_days int default 60) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare c text := nullif(current_setting('request.jwt.claims', true), ''); em text; n int := least(greatest(coalesce(p_days, 60), 7), 400);
begin
  if c is not null and coalesce((c::jsonb) ->> 'role', '') in ('anon', 'authenticated') then
    select lower(u.email) into em from auth.users u where u.id = auth.uid() and u.email_confirmed_at is not null;
    if em is null or not exists (select 1 from public.studyboard_config k, jsonb_array_elements_text(case when jsonb_typeof(k.value) = 'array' then k.value else '[]'::jsonb end) v
                                 where k.key = 'stats_viewers' and lower(v) = em) then
      raise exception 'not allowed' using errcode = '42501';
    end if;
  end if;
  -- yesterday's job might not have run yet (or pg_cron is off): save any missing finished days first
  perform public.studyboard_stats_save(g::date) from generate_series(current_date - 3, current_date - 1, interval '1 day') g
    where not exists (select 1 from public.studyboard_stats_daily s where s.day = g::date);
  return jsonb_build_object(
    'today', public.studyboard_stats_for(current_date),
    'days', coalesce((select jsonb_agg(to_jsonb(s) - 'computed_at' order by s.day) from public.studyboard_stats_daily s where s.day >= current_date - n), '[]'::jsonb),
    'cohorts', coalesce((select jsonb_agg(jsonb_build_object('day', x.day, 'cohort', x.cohort, 'active', x.active)) from public.studyboard_stats_cohorts x
                          where x.cohort >= current_date - n and x.day - x.cohort in (1, 7, 30)), '[]'::jsonb),
    'totals', jsonb_build_object('accounts', (select count(*) from auth.users), 'invite_rewards', (select count(*) from public.studyboard_ref_rewards)),
    'versions', (select value from public.app_flags where key = 'version_policy'));
end $$;
revoke all on function public.studyboard_launch_stats(int) from public, anon;
grant execute on function public.studyboard_launch_stats(int) to authenticated;

-- The nightly job (UTC): save yesterday at 00:20
do $$
begin
  begin
    create extension if not exists pg_cron;
  exception when others then
    raise notice 'pg_cron is not available. The stats page still saves missing days when you open it, but turn on pg_cron (Database > Extensions) so the note that an account was active is deleted every night.';
    return;
  end;
  perform cron.unschedule(jobid) from cron.job where jobname = 'studyboard-stats-snapshot';
  perform cron.schedule('studyboard-stats-snapshot', '20 0 * * *', 'select public.studyboard_stats_snapshot();');
end $$;
