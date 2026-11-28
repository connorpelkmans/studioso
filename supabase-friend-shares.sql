-- Studyboard: send a deck, quiz or concept map straight to friends (no code needed)
-- The friend sees it the next time they open Studyboard, or at once if they're online, and chooses Add or No Thanks.
-- Only to accepted friends who haven't blocked you (either way), and only while neither of you is suspended from groups.
-- Run it after supabase-friends.sql (and supabase-lean.sql again after, so account deletion clears it). Safe to run again.

do $$
begin
  if to_regclass('public.friendships') is null then raise exception 'Run supabase-friends.sql first, then run this file again.'; end if;
end $$;

create table if not exists public.friend_shares (
  id uuid primary key default gen_random_uuid(),
  from_user uuid not null references auth.users(id) on delete cascade,
  to_user uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('deck', 'quiz', 'map')),
  title text not null check (char_length(btrim(title)) between 1 and 200),
  info text not null default '' check (char_length(info) <= 120),        -- "15 cards", "10 questions", "12 ideas"
  status text not null default 'pending' check (status in ('pending', 'added', 'declined')),
  created_at timestamptz not null default now(),
  answered_at timestamptz,
  constraint friend_shares_not_self check (from_user <> to_user)
);
create index if not exists friend_shares_to_idx on public.friend_shares (to_user, status, created_at desc);
create index if not exists friend_shares_from_idx on public.friend_shares (from_user, created_at desc);
alter table public.friend_shares enable row level security;
revoke all on public.friend_shares from public, anon, authenticated;
-- The receiver may read the small rows sent to them (that's how their app hears at once that one arrived)
grant select on public.friend_shares to authenticated;
drop policy if exists "friend share receiver reads" on public.friend_shares;
create policy "friend share receiver reads" on public.friend_shares for select to authenticated using (to_user = auth.uid() and status = 'pending');
-- The content itself: nobody reads it directly; take_friend_share hands it over once, then it's deleted
create table if not exists public.friend_share_data (
  id uuid primary key references public.friend_shares(id) on delete cascade,
  data jsonb not null check (octet_length(data::text) < 1000000)
);
alter table public.friend_share_data enable row level security;
revoke all on public.friend_share_data from public, anon, authenticated;

-- Friends right now: accepted, not blocked either way, neither suspended
create or replace function public.sbfs_friends(x uuid, y uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select x is not null and y is not null and x <> y
    and exists (select 1 from public.friendships f where f.a = least(x, y) and f.b = greatest(x, y) and f.status = 'accepted')
    and not public.sbf_blocked(x, y) and not public.sbf_suspended(x) and not public.sbf_suspended(y)
$$;

-- Send to up to 20 friends at once. Returns how many it went to. At most 60 sends a day.
create or replace function public.send_to_friends(p_kind text, p_title text, p_info text, p_data jsonb, p_to uuid[]) returns int
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); t uuid; n int := 0; nid uuid;
begin
  if me is null then raise exception 'Sign in first'; end if;
  if not public.sbf_eligible(me) then raise exception 'SB_FRIENDS_OFF: Sharing with friends isn''t available on this account.'; end if;
  if p_kind not in ('deck', 'quiz', 'map') then raise exception 'SB_BAD: Only decks, quizzes and concept maps.'; end if;
  if p_data is null or jsonb_typeof(p_data) <> 'object' then raise exception 'SB_BAD: Nothing to send.'; end if;
  if octet_length(p_data::text) >= 1000000 then raise exception 'SB_BIG: That''s too big to send. Try a smaller one.'; end if;
  if p_to is null or cardinality(p_to) = 0 then raise exception 'SB_BAD: Pick a friend first.'; end if;
  if cardinality(p_to) > 20 then raise exception 'SB_BAD: Up to 20 friends at a time.'; end if;
  if not public.sbf_rate('share', 60, 86400) then raise exception 'SB_SLOW: You''ve sent a lot today. Try again tomorrow.'; end if;
  for t in select distinct x from unnest(p_to) x loop
    if not public.sbfs_friends(me, t) then continue; end if;
    -- a friend with 100 things waiting doesn't get more until they answer some
    if (select count(*) from public.friend_shares where to_user = t and status = 'pending') >= 100 then continue; end if;
    -- the same thing sent again replaces the copy still waiting
    delete from public.friend_shares where from_user = me and to_user = t and status = 'pending' and kind = p_kind and title = left(btrim(p_title), 200);
    insert into public.friend_shares (from_user, to_user, kind, title, info)
      values (me, t, p_kind, left(coalesce(nullif(btrim(p_title), ''), 'Untitled'), 200), left(coalesce(p_info, ''), 120)) returning id into nid;
    insert into public.friend_share_data (id, data) values (nid, p_data);
    n := n + 1;
  end loop;
  return n;
end $$;

-- What's waiting for you (without the content), newest first, with who sent it and their companion
create or replace function public.my_friend_shares()
returns table (id uuid, kind text, title text, info text, created_at timestamptz, from_user uuid, from_name text, from_username text, from_face text)
language plpgsql stable security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  if me is null then raise exception 'Sign in first'; end if;
  return query
    select s.id, s.kind, s.title, s.info, s.created_at, s.from_user, coalesce(p.display_name, 'A friend')::text, p.username::text, (to_jsonb(p) ->> 'face')
    from public.friend_shares s left join public.study_profiles p on p.user_id = s.from_user
    where s.to_user = me and s.status = 'pending' and s.created_at > now() - interval '30 days' and not public.sbf_blocked(me, s.from_user)
    order by s.created_at desc limit 50;
end $$;

-- Add (returns the content, once) or No Thanks (returns null). Either way it leaves your list.
create or replace function public.take_friend_share(p_id uuid, p_add boolean) returns jsonb
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); s record; d jsonb;
begin
  if me is null then raise exception 'Sign in first'; end if;
  select * into s from public.friend_shares where id = p_id and to_user = me for update;
  if s is null or s.status <> 'pending' then raise exception 'SB_GONE: That isn''t waiting any more.'; end if;
  select data into d from public.friend_share_data where id = p_id;
  delete from public.friend_share_data where id = p_id;
  update public.friend_shares set status = case when coalesce(p_add, false) then 'added' else 'declined' end, answered_at = now() where id = p_id;
  if not coalesce(p_add, false) or public.sbf_blocked(me, s.from_user) or d is null then return null; end if;
  return jsonb_build_object('kind', s.kind, 'title', s.title, 'from', (select coalesce(display_name, 'A friend') from public.study_profiles where user_id = s.from_user), 'data', d);
end $$;

-- Tidying up (daily, with pg_cron): unanswered after 30 days, answered rows after 7
create or replace function public.friend_shares_purge() returns void
language sql security definer set search_path = public as $$
  delete from public.friend_shares where (status = 'pending' and created_at < now() - interval '30 days') or (status <> 'pending' and answered_at < now() - interval '7 days');
$$;

revoke all on function public.sbfs_friends(uuid, uuid), public.friend_shares_purge() from public, anon, authenticated;
revoke all on function public.send_to_friends(text, text, text, jsonb, uuid[]), public.my_friend_shares(), public.take_friend_share(uuid, boolean) from public, anon;
grant execute on function public.send_to_friends(text, text, text, jsonb, uuid[]), public.my_friend_shares(), public.take_friend_share(uuid, boolean) to authenticated;

-- Live: the receiver's app hears about a new one at once
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'friend_shares') then
    alter publication supabase_realtime add table public.friend_shares;
  end if;
end $$;

do $$
begin
  begin
    create extension if not exists pg_cron;
  exception when others then
    raise notice 'pg_cron is not available, so old friend shares are not removed on their own. Run select public.friend_shares_purge(); now and then.';
    return;
  end;
  perform cron.unschedule(jobid) from cron.job where jobname = 'studyboard-friend-shares-purge';
  perform cron.schedule('studyboard-friend-shares-purge', '53 4 * * *', 'select public.friend_shares_purge();');
end $$;

notify pgrst, 'reload schema';
