-- Studyboard 1.11: Share Decks and Study Groups (1.12 adds shared quizzes, study sessions, weekly challenge, check-ins, reactions and pins)
-- Run this once in Supabase: SQL Editor > New query > paste everything > Run.
-- It is safe to run again (it only creates what is missing and refreshes the rules).
--
-- What it keeps safe:
--  * Your own planner data (the "items" table) is never touched or opened up. Only what you choose to
--    share is copied into the tables below.
--  * Group data can only be read by members of that group. Only the owner can rename, remove people or delete it.
--  * Share codes and invite codes are looked up one at a time through the functions at the bottom,
--    so nobody can list every shared deck or group.

-- ---------- Codes like K7P-4QD (no 0/O or 1/I/L, made from secure random bytes) ----------
create or replace function public.sbg_new_code() returns text
language plpgsql volatile set search_path = public as $$
declare
  a constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  b bytea := uuid_send(gen_random_uuid()) || uuid_send(gen_random_uuid());
  s text := '';
  i int;
begin
  for i in 0..5 loop
    s := s || substr(a, 1 + (get_byte(b, i) % length(a)), 1);
    if i = 2 then s := s || '-'; end if;
  end loop;
  return s;
end $$;

create or replace function public.sbg_norm_code(p text) returns text
language sql immutable set search_path = public as $$
  select case when length(x) = 6 then substr(x, 1, 3) || '-' || substr(x, 4, 3) else x end
  from (select upper(regexp_replace(coalesce(p, ''), '[^A-Za-z0-9]', '', 'g')) as x) q
$$;

-- ---------- Tables ----------
create table if not exists public.study_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade default auth.uid(),
  display_name text not null check (char_length(btrim(display_name)) between 1 and 40),
  updated_at timestamptz not null default now()
);

create table if not exists public.shared_decks (
  code text primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  deck_id text not null,
  name text not null check (char_length(name) between 1 and 200),
  sharer_name text not null default '',
  card_count int not null default 0,
  data jsonb not null check (octet_length(data::text) < 3000000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, deck_id)
);

create table if not exists public.study_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 80),
  course text not null default '' check (char_length(course) <= 80),
  owner_id uuid not null references auth.users(id) on delete cascade,
  invite_code text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.group_members (
  group_id uuid not null references public.study_groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  display_name text not null default '',
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);
create index if not exists group_members_user_idx on public.group_members (user_id);

create table if not exists public.group_items (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.study_groups(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  author_name text not null default '',
  kind text not null check (kind in ('deck', 'task')),
  ref_id text not null default '',
  title text not null check (char_length(title) between 1 and 300),
  data jsonb not null default '{}'::jsonb check (octet_length(data::text) < 3000000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists group_items_group_idx on public.group_items (group_id);

create table if not exists public.group_messages (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.study_groups(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  author_name text not null default '',
  body text not null check (char_length(btrim(body)) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index if not exists group_messages_group_idx on public.group_messages (group_id, created_at desc);

-- ---------- Helpers used by the rules (security definer so the rules don't loop) ----------
create or replace function public.sbg_is_member(gid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.group_members m where m.group_id = gid and m.user_id = auth.uid())
$$;
create or replace function public.sbg_is_owner(gid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.study_groups g where g.id = gid and g.owner_id = auth.uid())
$$;
create or replace function public.sbg_my_name() returns text
language sql stable security definer set search_path = public as $$
  select coalesce((select display_name from public.study_profiles where user_id = auth.uid()), 'Classmate')
$$;

-- ---------- Row level security ----------
alter table public.study_profiles enable row level security;
alter table public.shared_decks enable row level security;
alter table public.study_groups enable row level security;
alter table public.group_members enable row level security;
alter table public.group_items enable row level security;
alter table public.group_messages enable row level security;

-- Your profile: only you can read or change it. Groups see your name through group_members.
drop policy if exists "profile own read" on public.study_profiles;
create policy "profile own read" on public.study_profiles for select to authenticated using (user_id = auth.uid());
drop policy if exists "profile own insert" on public.study_profiles;
create policy "profile own insert" on public.study_profiles for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "profile own update" on public.study_profiles;
create policy "profile own update" on public.study_profiles for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Shared decks: you see and stop your own. Others only open one by its code (get_shared_deck).
drop policy if exists "shared deck own read" on public.shared_decks;
create policy "shared deck own read" on public.shared_decks for select to authenticated using (owner_id = auth.uid());
drop policy if exists "shared deck own delete" on public.shared_decks;
create policy "shared deck own delete" on public.shared_decks for delete to authenticated using (owner_id = auth.uid());

-- Groups: members read; the owner renames (name and course only) and deletes. Creating is through create_group.
drop policy if exists "group member read" on public.study_groups;
create policy "group member read" on public.study_groups for select to authenticated using (public.sbg_is_member(id));
drop policy if exists "group owner update" on public.study_groups;
create policy "group owner update" on public.study_groups for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
drop policy if exists "group owner delete" on public.study_groups;
create policy "group owner delete" on public.study_groups for delete to authenticated using (owner_id = auth.uid());
revoke insert, update on public.study_groups from anon, authenticated;
grant select, delete on public.study_groups to authenticated;
grant update (name, course) on public.study_groups to authenticated;

-- Members: members see each other. You can leave; the owner can remove others. Joining is through join_group.
drop policy if exists "member read" on public.group_members;
create policy "member read" on public.group_members for select to authenticated using (public.sbg_is_member(group_id));
drop policy if exists "member leave or removed" on public.group_members;
create policy "member leave or removed" on public.group_members for delete to authenticated
  using ((user_id = auth.uid() and role <> 'owner') or (public.sbg_is_owner(group_id) and user_id <> auth.uid()));
revoke insert, update on public.group_members from anon, authenticated;
grant select, delete on public.group_members to authenticated;

-- Shared decks and deadlines in a group: members read and share; you change your own; the owner can remove any.
drop policy if exists "item member read" on public.group_items;
create policy "item member read" on public.group_items for select to authenticated using (public.sbg_is_member(group_id));
drop policy if exists "item member insert" on public.group_items;
create policy "item member insert" on public.group_items for insert to authenticated with check (user_id = auth.uid() and public.sbg_is_member(group_id));
drop policy if exists "item own update" on public.group_items;
create policy "item own update" on public.group_items for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid() and public.sbg_is_member(group_id));
drop policy if exists "item own or owner delete" on public.group_items;
create policy "item own or owner delete" on public.group_items for delete to authenticated using (user_id = auth.uid() or public.sbg_is_owner(group_id));

-- Message board: members read and post (pinning and reactions go through pin_message and toggle_reaction); you delete your own; the owner can remove any.
drop policy if exists "message member read" on public.group_messages;
create policy "message member read" on public.group_messages for select to authenticated using (public.sbg_is_member(group_id));
drop policy if exists "message member insert" on public.group_messages;
create policy "message member insert" on public.group_messages for insert to authenticated with check (user_id = auth.uid() and public.sbg_is_member(group_id));
drop policy if exists "message own or owner delete" on public.group_messages;
create policy "message own or owner delete" on public.group_messages for delete to authenticated using (user_id = auth.uid() or public.sbg_is_owner(group_id));
revoke update on public.group_messages from anon, authenticated;

revoke all on public.study_profiles, public.shared_decks, public.study_groups, public.group_members, public.group_items, public.group_messages from anon;
revoke truncate, references, trigger on public.study_profiles, public.shared_decks, public.study_groups, public.group_members, public.group_items, public.group_messages from authenticated;

-- ---------- Triggers: names and times are filled in by the database, not the app ----------
create or replace function public.sbg_stamp() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    new.user_id := auth.uid();
    new.author_name := public.sbg_my_name();
    new.created_at := now();
    if tg_table_name = 'group_items' then
      new.updated_at := now();
      -- Stops one account filling a group: at most 500 shared items per person in a group.
      if (select count(*) from public.group_items where group_id = new.group_id and user_id = new.user_id) >= 500 then
        raise exception 'This group already holds 500 of your shared items. Remove some first.';
      end if;
    end if;
    if tg_table_name = 'group_messages' then
      -- Pins only change through pin_message (so the 3-pin limit and the owner/author rule can't be skipped), and posting is limited to 20 a minute.
      new.pinned := false;
      if (select count(*) from public.group_messages where user_id = new.user_id and created_at > now() - interval '1 minute') >= 20 then
        raise exception 'You are posting too fast. Try again in a minute.';
      end if;
    end if;
  else
    new.id := old.id; new.group_id := old.group_id; new.user_id := old.user_id;
    new.author_name := old.author_name; new.created_at := old.created_at;
    if tg_table_name = 'group_items' then new.updated_at := now(); end if;
  end if;
  return new;
end $$;
drop trigger if exists sbg_items_stamp on public.group_items;
create trigger sbg_items_stamp before insert or update on public.group_items for each row execute function public.sbg_stamp();
drop trigger if exists sbg_messages_stamp on public.group_messages;
create trigger sbg_messages_stamp before insert on public.group_messages for each row execute function public.sbg_stamp();

create or replace function public.sbg_profile_sync() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.updated_at := now();
  update public.group_members set display_name = new.display_name where user_id = new.user_id;
  update public.shared_decks set sharer_name = new.display_name where owner_id = new.user_id;
  update public.group_items set author_name = new.display_name where user_id = new.user_id;
  update public.group_messages set author_name = new.display_name where user_id = new.user_id;
  return new;
end $$;
drop trigger if exists sbg_profile_sync on public.study_profiles;
create trigger sbg_profile_sync before insert or update on public.study_profiles for each row execute function public.sbg_profile_sync();

-- ---------- Functions the app calls ----------
-- Share (or update) one of your decks. Returns its code.
create or replace function public.share_deck(p_deck_id text, p_name text, p_data jsonb, p_count int) returns text
language plpgsql security definer set search_path = public as $$
declare c text; me uuid := auth.uid();
begin
  if me is null then raise exception 'Sign in first'; end if;
  select code into c from public.shared_decks where owner_id = me and deck_id = p_deck_id;
  if c is not null then
    update public.shared_decks set name = left(p_name, 200), data = p_data, card_count = greatest(0, p_count),
      sharer_name = public.sbg_my_name(), updated_at = now() where code = c;
    return c;
  end if;
  if (select count(*) from public.shared_decks where owner_id = me) >= 200 then raise exception 'You can share up to 200 decks'; end if;
  loop
    c := public.sbg_new_code();
    exit when not exists (select 1 from public.shared_decks where code = c);
  end loop;
  insert into public.shared_decks (code, owner_id, deck_id, name, sharer_name, card_count, data)
    values (c, me, p_deck_id, left(p_name, 200), public.sbg_my_name(), greatest(0, p_count), p_data);
  return c;
end $$;

-- Open one shared deck by its code.
-- Lean: guessing codes is limited to 30 lookups an hour per account (only once lean.sql is installed).
create or replace function public.sbg_lookup_ok() returns boolean
language plpgsql volatile security definer set search_path = public as $$
begin
  if to_regprocedure('public.studyboard_rate_hit(text,integer,integer)') is null then return true; end if;
  return public.studyboard_rate_hit('code:' || coalesce(auth.uid()::text, 'anon'), 30, 3600);
end $$;

drop function if exists public.get_shared_deck(text);
create or replace function public.get_shared_deck(p_code text)
returns table (code text, name text, sharer_name text, card_count int, data jsonb, updated_at timestamptz, is_mine boolean)
language plpgsql volatile security definer set search_path = public as $$
begin
  if auth.uid() is null then return; end if;
  if not public.sbg_lookup_ok() then raise exception 'Too many code lookups. Try again in an hour.'; end if;
  return query select d.code, d.name, d.sharer_name, d.card_count, d.data, d.updated_at, d.owner_id = auth.uid()
  from public.shared_decks d
  where d.code = public.sbg_norm_code(p_code);
end $$;

-- Make a group; you become its owner.
create or replace function public.create_group(p_name text, p_course text) returns uuid
language plpgsql security definer set search_path = public as $$
declare g uuid; c text; me uuid := auth.uid();
begin
  if me is null then raise exception 'Sign in first'; end if;
  if (select count(*) from public.study_groups where owner_id = me) >= 50 then raise exception 'You can own up to 50 groups'; end if;
  loop
    c := public.sbg_new_code();
    exit when not exists (select 1 from public.study_groups where invite_code = c);
  end loop;
  insert into public.study_groups (name, course, owner_id, invite_code) values (btrim(p_name), btrim(coalesce(p_course, '')), me, c) returning id into g;
  insert into public.group_members (group_id, user_id, role, display_name) values (g, me, 'owner', public.sbg_my_name());
  return g;
end $$;

-- See a group before joining, by its invite code.
drop function if exists public.group_preview(text);
create or replace function public.group_preview(p_code text)
returns table (id uuid, name text, course text, member_count int, owner_name text, is_member boolean)
language plpgsql volatile security definer set search_path = public as $$
begin
  if auth.uid() is null then return; end if;
  if not public.sbg_lookup_ok() then raise exception 'Too many code lookups. Try again in an hour.'; end if;
  return query select g.id, g.name, g.course,
    (select count(*)::int from public.group_members m where m.group_id = g.id),
    coalesce((select m.display_name from public.group_members m where m.group_id = g.id and m.role = 'owner' limit 1), ''),
    exists (select 1 from public.group_members m where m.group_id = g.id and m.user_id = auth.uid())
  from public.study_groups g
  where g.invite_code = public.sbg_norm_code(p_code);
end $$;

-- Join a group by its invite code.
create or replace function public.join_group(p_code text) returns uuid
language plpgsql security definer set search_path = public as $$
declare g uuid; me uuid := auth.uid();
begin
  if me is null then raise exception 'Sign in first'; end if;
  select id into g from public.study_groups where invite_code = public.sbg_norm_code(p_code);
  if g is null then
    -- Returning (not raising) keeps this failed guess counted against the hourly limit.
    perform public.sbg_lookup_ok();
    return null;
  end if;
  if not exists (select 1 from public.group_members where group_id = g and user_id = me) then
    if (select count(*) from public.group_members where group_id = g) >= 100 then raise exception 'This group is full (100 members)'; end if;
    insert into public.group_members (group_id, user_id, role, display_name) values (g, me, 'member', public.sbg_my_name());
  end if;
  return g;
end $$;

-- Owner only: a new invite code (the old link stops working).
create or replace function public.new_group_code(p_group uuid) returns text
language plpgsql security definer set search_path = public as $$
declare c text;
begin
  if not public.sbg_is_owner(p_group) then raise exception 'Only the group owner can do that'; end if;
  loop
    c := public.sbg_new_code();
    exit when not exists (select 1 from public.study_groups where invite_code = c);
  end loop;
  update public.study_groups set invite_code = c where id = p_group;
  return c;
end $$;

revoke all on function public.sbg_new_code(), public.sbg_norm_code(text), public.sbg_lookup_ok(), public.sbg_is_member(uuid), public.sbg_is_owner(uuid), public.sbg_my_name(),
  public.share_deck(text, text, jsonb, int), public.get_shared_deck(text), public.create_group(text, text),
  public.group_preview(text), public.join_group(text), public.new_group_code(uuid) from public, anon;
grant execute on function public.sbg_is_member(uuid), public.sbg_is_owner(uuid), public.sbg_my_name(),
  public.share_deck(text, text, jsonb, int), public.get_shared_deck(text), public.create_group(text, text),
  public.group_preview(text), public.join_group(text), public.new_group_code(uuid) to authenticated;

-- ---------- 1.12: quizzes, study sessions, weekly challenge, check-ins, reactions and pins ----------
-- Quizzes ('quiz') and proposed study sessions ('event') are shared in a group just like decks and deadlines.
alter table public.group_items drop constraint if exists group_items_kind_check;
alter table public.group_items add constraint group_items_kind_check check (kind in ('deck', 'task', 'quiz', 'event'));

-- The owner can set a weekly focus goal (minutes per member). 0 means no goal.
alter table public.study_groups add column if not exists weekly_goal int not null default 0;
alter table public.study_groups drop constraint if exists study_groups_weekly_goal_check;
alter table public.study_groups add constraint study_groups_weekly_goal_check check (weekly_goal between 0 and 10080);
grant update (name, course, weekly_goal) on public.study_groups to authenticated;

-- Pinned messages (changed only through pin_message below).
alter table public.group_messages add column if not exists pinned boolean not null default false;

-- Quiz scores: your best and latest score on each shared quiz. Written only through submit_quiz_score.
create table if not exists public.group_quiz_scores (
  item_id uuid not null references public.group_items(id) on delete cascade,
  group_id uuid not null references public.study_groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  best_correct int not null default 0,
  best_total int not null default 1,
  last_correct int not null default 0,
  last_total int not null default 1,
  attempts int not null default 1,
  updated_at timestamptz not null default now(),
  primary key (item_id, user_id)
);
create index if not exists group_quiz_scores_group_idx on public.group_quiz_scores (group_id);

-- Who can make a proposed study session: yes / maybe / no. Written only through set_rsvp.
create table if not exists public.group_rsvps (
  item_id uuid not null references public.group_items(id) on delete cascade,
  group_id uuid not null references public.study_groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null check (status in ('yes', 'maybe', 'no')),
  updated_at timestamptz not null default now(),
  primary key (item_id, user_id)
);
create index if not exists group_rsvps_group_idx on public.group_rsvps (group_id);

-- Weekly challenge: each member's focus minutes and quizzes taken per week (week = the Monday). Written only through group_report.
create table if not exists public.group_stats (
  group_id uuid not null references public.study_groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  week date not null,
  focus_min int not null default 0 check (focus_min between 0 and 10080),
  quizzes int not null default 0 check (quizzes between 0 and 1000),
  updated_at timestamptz not null default now(),
  primary key (group_id, user_id, week)
);

-- Daily check-ins: "what I'm studying today" and whether it got done. Written only through group_checkin.
create table if not exists public.group_checkins (
  group_id uuid not null references public.study_groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null,
  plan text not null default '' check (char_length(plan) <= 140),
  done boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (group_id, user_id, day)
);

-- Reactions on messages. Written only through toggle_reaction.
create table if not exists public.group_reactions (
  message_id uuid not null references public.group_messages(id) on delete cascade,
  group_id uuid not null references public.study_groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('like', 'love', 'laugh', 'party', 'fire', 'think')),
  created_at timestamptz not null default now(),
  primary key (message_id, user_id, kind)
);
create index if not exists group_reactions_group_idx on public.group_reactions (group_id);

alter table public.group_quiz_scores enable row level security;
alter table public.group_rsvps enable row level security;
alter table public.group_stats enable row level security;
alter table public.group_checkins enable row level security;
alter table public.group_reactions enable row level security;

drop policy if exists "score member read" on public.group_quiz_scores;
create policy "score member read" on public.group_quiz_scores for select to authenticated using (public.sbg_is_member(group_id));
drop policy if exists "rsvp member read" on public.group_rsvps;
create policy "rsvp member read" on public.group_rsvps for select to authenticated using (public.sbg_is_member(group_id));
drop policy if exists "stats member read" on public.group_stats;
create policy "stats member read" on public.group_stats for select to authenticated using (public.sbg_is_member(group_id));
drop policy if exists "checkin member read" on public.group_checkins;
create policy "checkin member read" on public.group_checkins for select to authenticated using (public.sbg_is_member(group_id));
drop policy if exists "reaction member read" on public.group_reactions;
create policy "reaction member read" on public.group_reactions for select to authenticated using (public.sbg_is_member(group_id));

revoke all on public.group_quiz_scores, public.group_rsvps, public.group_stats, public.group_checkins, public.group_reactions from anon, authenticated;
grant select on public.group_quiz_scores, public.group_rsvps, public.group_stats, public.group_checkins, public.group_reactions to authenticated;

-- Record a quiz result. Keeps your best score and your latest one, and counts attempts.
create or replace function public.submit_quiz_score(p_item uuid, p_correct int, p_total int) returns void
language plpgsql security definer set search_path = public as $$
declare gid uuid; me uuid := auth.uid();
begin
  if me is null then raise exception 'Sign in first'; end if;
  select group_id into gid from public.group_items where id = p_item and kind = 'quiz';
  if gid is null or not public.sbg_is_member(gid) then raise exception 'That quiz isn''t in one of your groups'; end if;
  if p_total is null or p_total < 1 or p_total > 500 or p_correct is null or p_correct < 0 or p_correct > p_total then raise exception 'That score isn''t valid'; end if;
  insert into public.group_quiz_scores as s (item_id, group_id, user_id, best_correct, best_total, last_correct, last_total, attempts, updated_at)
    values (p_item, gid, me, p_correct, p_total, p_correct, p_total, 1, now())
  on conflict (item_id, user_id) do update set
    best_correct = case when p_correct * s.best_total > s.best_correct * p_total then p_correct else s.best_correct end,
    best_total = case when p_correct * s.best_total > s.best_correct * p_total then p_total else s.best_total end,
    last_correct = p_correct, last_total = p_total, attempts = s.attempts + 1, updated_at = now();
end $$;

-- Say whether you can make a proposed study session. A null status clears your answer.
create or replace function public.set_rsvp(p_item uuid, p_status text) returns void
language plpgsql security definer set search_path = public as $$
declare gid uuid; me uuid := auth.uid();
begin
  if me is null then raise exception 'Sign in first'; end if;
  select group_id into gid from public.group_items where id = p_item and kind = 'event';
  if gid is null or not public.sbg_is_member(gid) then raise exception 'That session isn''t in one of your groups'; end if;
  if p_status is null then
    delete from public.group_rsvps where item_id = p_item and user_id = me;
  else
    if p_status not in ('yes', 'maybe', 'no') then raise exception 'Pick yes, maybe or no'; end if;
    insert into public.group_rsvps as r (item_id, group_id, user_id, status, updated_at) values (p_item, gid, me, p_status, now())
    on conflict (item_id, user_id) do update set status = p_status, updated_at = now();
  end if;
end $$;

-- Report your totals for a week (the Monday's date). Only the last few weeks are accepted, and totals never go down.
create or replace function public.group_report(p_group uuid, p_week date, p_focus int, p_quizzes int) returns void
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  if me is null then raise exception 'Sign in first'; end if;
  if not public.sbg_is_member(p_group) then raise exception 'You''re not in that group'; end if;
  if p_week is null or p_week < current_date - 21 or p_week > current_date + 1 then return; end if;
  insert into public.group_stats as s (group_id, user_id, week, focus_min, quizzes, updated_at)
    values (p_group, me, p_week, least(greatest(coalesce(p_focus, 0), 0), 10080), least(greatest(coalesce(p_quizzes, 0), 0), 1000), now())
  on conflict (group_id, user_id, week) do update set
    focus_min = greatest(s.focus_min, excluded.focus_min), quizzes = greatest(s.quizzes, excluded.quizzes), updated_at = now();
  delete from public.group_stats where group_id = p_group and user_id = me and week < current_date - 120;
end $$;

-- Your check-in for a day (today, yesterday or tomorrow, to allow for time zones).
create or replace function public.group_checkin(p_group uuid, p_day date, p_plan text, p_done boolean) returns void
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  if me is null then raise exception 'Sign in first'; end if;
  if not public.sbg_is_member(p_group) then raise exception 'You''re not in that group'; end if;
  if p_day is null or p_day < current_date - 1 or p_day > current_date + 1 then raise exception 'That day isn''t valid'; end if;
  insert into public.group_checkins as c (group_id, user_id, day, plan, done, updated_at)
    values (p_group, me, p_day, left(btrim(coalesce(p_plan, '')), 140), coalesce(p_done, false), now())
  on conflict (group_id, user_id, day) do update set plan = left(btrim(coalesce(p_plan, '')), 140), done = coalesce(p_done, false), updated_at = now();
  delete from public.group_checkins where group_id = p_group and user_id = me and day < current_date - 120;
end $$;

-- Add or remove your reaction on a message. Returns true if it's now on.
create or replace function public.toggle_reaction(p_msg uuid, p_kind text) returns boolean
language plpgsql security definer set search_path = public as $$
declare gid uuid; me uuid := auth.uid();
begin
  if me is null then raise exception 'Sign in first'; end if;
  select group_id into gid from public.group_messages where id = p_msg;
  if gid is null or not public.sbg_is_member(gid) then raise exception 'That message isn''t in one of your groups'; end if;
  if p_kind not in ('like', 'love', 'laugh', 'party', 'fire', 'think') then raise exception 'Unknown reaction'; end if;
  if exists (select 1 from public.group_reactions where message_id = p_msg and user_id = me and kind = p_kind) then
    delete from public.group_reactions where message_id = p_msg and user_id = me and kind = p_kind;
    return false;
  end if;
  insert into public.group_reactions (message_id, group_id, user_id, kind) values (p_msg, gid, me, p_kind);
  return true;
end $$;

-- Pin or unpin a message. The group owner or the message's author can do it; a group keeps up to 3 pins.
create or replace function public.pin_message(p_msg uuid, p_pin boolean) returns void
language plpgsql security definer set search_path = public as $$
declare gid uuid; author uuid; me uuid := auth.uid();
begin
  if me is null then raise exception 'Sign in first'; end if;
  select group_id, user_id into gid, author from public.group_messages where id = p_msg;
  if gid is null or not public.sbg_is_member(gid) then raise exception 'That message isn''t in one of your groups'; end if;
  if not (author = me or public.sbg_is_owner(gid)) then raise exception 'Only the group owner or the author can pin this message'; end if;
  if p_pin and (select count(*) from public.group_messages where group_id = gid and pinned and id <> p_msg) >= 3 then
    raise exception 'A group can pin up to 3 messages. Unpin one first.';
  end if;
  update public.group_messages set pinned = coalesce(p_pin, false) where id = p_msg;
end $$;

revoke all on function public.submit_quiz_score(uuid, int, int), public.set_rsvp(uuid, text), public.group_report(uuid, date, int, int),
  public.group_checkin(uuid, date, text, boolean), public.toggle_reaction(uuid, text), public.pin_message(uuid, boolean) from public, anon;
grant execute on function public.submit_quiz_score(uuid, int, int), public.set_rsvp(uuid, text), public.group_report(uuid, date, int, int),
  public.group_checkin(uuid, date, text, boolean), public.toggle_reaction(uuid, text), public.pin_message(uuid, boolean) to authenticated;

-- ---------- Live updates for groups ----------
do $$
declare t text;
begin
  foreach t in array array['study_groups', 'group_members', 'group_items', 'group_messages', 'group_quiz_scores', 'group_rsvps', 'group_stats', 'group_checkins', 'group_reactions'] loop
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
