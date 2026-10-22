-- Studyboard 1.11: Share Decks and Study Groups (1.12 adds shared quizzes, study sessions, weekly challenge, check-ins, reactions and pins; 1.13 adds Project Tasks)
-- Run this once in Supabase: SQL Editor > New query > paste everything > Run.
-- It is safe to run again (it only creates what is missing and refreshes the rules).
--
-- What it keeps safe:
--  * Your own planner data (the "items" table) is never touched or opened up. Only what you choose to
--    share is copied into the tables below.
--  * Group data can only be read by members of that group. Only the owner can rename, remove people or delete it.
--  * Share codes and invite codes are looked up one at a time through the functions at the bottom,
--    so nobody can list every shared deck or group.

-- ---------- Codes like K7P4-QD9X (no 0/O or 1/I/L, made from secure random bytes) ----------
-- 8 characters from 31 letters and digits (about 40 bits); the 30-lookups-an-hour limit per account is what makes guessing one hopeless.
-- Each character comes from one random byte; bytes 248-255 are skipped so every character is equally likely (no modulo bias).
-- Codes made by older versions (6 or 10 characters, like K7P-4QD or K7P4Q-D9XWM) keep working.
create or replace function public.sbg_new_code() returns text
language plpgsql volatile set search_path = public as $$
declare
  a constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  b bytea;
  s text := '';
  i int;
  v int;
begin
  while length(s) < 9 loop
    b := uuid_send(gen_random_uuid()) || uuid_send(gen_random_uuid());
    for i in 0..31 loop
      continue when i in (6, 8, 22, 24);          -- the uuid version and variant bytes are not fully random
      v := get_byte(b, i);
      continue when v >= 248;                     -- 248 = 8 * 31: keep only bytes that divide evenly
      s := s || substr(a, 1 + (v % 31), 1);
      if length(s) = 4 then s := s || '-'; end if;
      exit when length(s) = 9;
    end loop;
  end loop;
  return s;
end $$;

-- Tidies a typed or pasted code: K7P4QD9X, k7p4-qd9x and "K7P4 QD9X" all become K7P4-QD9X; old 6- and 10-character codes keep their own shapes (K7P-4QD, K7P4Q-D9XWM).
create or replace function public.sbg_norm_code(p text) returns text
language sql immutable set search_path = public as $$
  select case length(x) when 8 then substr(x, 1, 4) || '-' || substr(x, 5, 4) else x end   -- codes are 8 characters (K7P4-QD9X), nothing else matches
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
-- Deleting a group only hides it for 30 days (see "Deleted groups" at the end); this is when it was deleted.
alter table public.study_groups add column if not exists deleted_at timestamptz;

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
create index if not exists group_messages_user_idx on public.group_messages (user_id, created_at);   -- the posting limits below

-- ---------- Helpers used by the rules (security definer so the rules don't loop) ----------
-- A deleted group (waiting out its 30 days) has no members and no owner as far as every rule is concerned: hidden, and nothing changes.
create or replace function public.sbg_is_member(gid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.group_members m join public.study_groups g on g.id = m.group_id
                 where m.group_id = gid and m.user_id = auth.uid() and g.deleted_at is null)
$$;
create or replace function public.sbg_is_owner(gid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.study_groups g where g.id = gid and g.owner_id = auth.uid() and g.deleted_at is null)
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
create policy "group owner delete" on public.study_groups for delete to authenticated using (owner_id = auth.uid() and deleted_at is null);
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
      -- And at most 500 a day across all your groups, so one account can't fill the message tables.
      if (select count(*) from public.group_messages where user_id = new.user_id and created_at > now() - interval '1 day') >= 500 then
        raise exception 'You have posted 500 messages today. Try again tomorrow.';
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
  if to_regclass('public.group_suspended') is not null and exists (select 1 from public.group_suspended where user_id = me) then
    raise exception 'Your account can''t use study groups after a report was reviewed. The rest of Studyboard works as usual.';
  end if;
  if (select count(*) from public.study_groups where owner_id = me and deleted_at is null) >= 50 then raise exception 'You can own up to 50 groups'; end if;
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
  where g.invite_code = public.sbg_norm_code(p_code) and g.deleted_at is null;
end $$;

-- ---------- Removed by the owner: can't rejoin with the same invite code ----------
-- When the owner removes someone, a row here stops join_group from letting them straight back in. Leaving on your own records
-- nothing. Server only: no rules and no grants, so nobody can read or change it from the app. A removal stays until the group is
-- deleted (or that person deletes their account); to let someone back in, delete their row here in the SQL Editor.
create table if not exists public.group_bans (
  group_id uuid not null references public.study_groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  banned_at timestamptz not null default now(),
  primary key (group_id, user_id)
);
create index if not exists group_bans_user_idx on public.group_bans (user_id);
alter table public.group_bans enable row level security;   -- no policies: only the functions below touch it
revoke all on public.group_bans from public, anon, authenticated;

create or replace function public.sbg_member_removed() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  -- Only a removal by someone else who is signed in (the owner, through the app). Not leaving on your own, not the server or
  -- SQL Editor (no auth.uid()), and not when the group or the account itself is being deleted (its row is already gone).
  if auth.uid() is not null and auth.uid() <> old.user_id
     and exists (select 1 from public.study_groups g where g.id = old.group_id)
     and exists (select 1 from auth.users u where u.id = old.user_id) then
    insert into public.group_bans (group_id, user_id) values (old.group_id, old.user_id)
      on conflict (group_id, user_id) do update set banned_at = now();
  end if;
  return old;
end $$;
revoke all on function public.sbg_member_removed() from public, anon, authenticated;
drop trigger if exists sbg_member_removed on public.group_members;
create trigger sbg_member_removed after delete on public.group_members for each row execute function public.sbg_member_removed();

-- Join a group by its invite code. Someone the owner removed can't come back in with it.
create or replace function public.join_group(p_code text) returns uuid
language plpgsql security definer set search_path = public as $$
declare g uuid; me uuid := auth.uid();
begin
  if me is null then raise exception 'Sign in first'; end if;
  -- Every call counts against the hourly code limit (shared with group_preview and get_shared_deck), before the code is looked at.
  if not public.sbg_lookup_ok() then raise exception 'Too many code lookups. Try again in an hour.'; end if;
  select id into g from public.study_groups where invite_code = public.sbg_norm_code(p_code) and deleted_at is null;
  -- Returning (not raising) keeps this failed guess counted against the hourly limit.
  if g is null then return null; end if;
  if to_regclass('public.group_suspended') is not null and exists (select 1 from public.group_suspended where user_id = me) then
    raise exception 'Your account can''t use study groups after a report was reviewed. The rest of Studyboard works as usual.';
  end if;
  if exists (select 1 from public.group_bans where group_id = g and user_id = me) then
    raise exception 'The group owner removed you from this group, so you can''t rejoin it.';
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
-- Only used inside the functions above: making codes and counting lookups can't be called directly (a direct call would burn
-- the hourly lookup budget or skip it).
revoke all on function public.sbg_new_code(), public.sbg_lookup_ok() from authenticated;

-- ---------- 1.12: quizzes, study sessions, weekly challenge, check-ins, reactions and pins ----------
-- Quizzes ('quiz') and proposed study sessions ('event') are shared in a group just like decks and deadlines.
alter table public.group_items drop constraint if exists group_items_kind_check;
-- (not valid: when this file runs again, rows of kinds added in later sections are kept; the last section's list is the one checked in full)
alter table public.group_items add constraint group_items_kind_check check (kind in ('deck', 'task', 'quiz', 'event')) not valid;

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

-- Each score is shared with a name ('name') or anonymously ('anon'); keeping it private means not posting it (or removing it).
-- Other members read rows directly only when they carry a name; anonymous ones reach them through group_quiz_board, without who.
alter table public.group_quiz_scores add column if not exists shown text not null default 'name';
alter table public.group_quiz_scores drop constraint if exists group_quiz_scores_shown_check;
alter table public.group_quiz_scores add constraint group_quiz_scores_shown_check check (shown in ('name', 'anon'));
drop policy if exists "score member read" on public.group_quiz_scores;
create policy "score member read" on public.group_quiz_scores for select to authenticated
  using (public.sbg_is_member(group_id) and (shown = 'name' or user_id = auth.uid()));
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
-- p_shown: 'name' or 'anon'; left out, a score already posted keeps its choice (and a first one is shown with your name, as before).
drop function if exists public.submit_quiz_score(uuid, int, int);
create or replace function public.submit_quiz_score(p_item uuid, p_correct int, p_total int, p_shown text default null) returns void
language plpgsql security definer set search_path = public as $$
declare gid uuid; me uuid := auth.uid();
begin
  if me is null then raise exception 'Sign in first'; end if;
  select group_id into gid from public.group_items where id = p_item and kind = 'quiz';
  if gid is null or not public.sbg_is_member(gid) then raise exception 'That quiz isn''t in one of your groups'; end if;
  if p_total is null or p_total < 1 or p_total > 500 or p_correct is null or p_correct < 0 or p_correct > p_total then raise exception 'That score isn''t valid'; end if;
  if p_shown is not null and p_shown not in ('name', 'anon') then raise exception 'Pick name or anonymous'; end if;
  insert into public.group_quiz_scores as s (item_id, group_id, user_id, best_correct, best_total, last_correct, last_total, attempts, updated_at, shown)
    values (p_item, gid, me, p_correct, p_total, p_correct, p_total, 1, now(), coalesce(p_shown, 'name'))
  on conflict (item_id, user_id) do update set
    best_correct = case when p_correct * s.best_total > s.best_correct * p_total then p_correct else s.best_correct end,
    best_total = case when p_correct * s.best_total > s.best_correct * p_total then p_total else s.best_total end,
    last_correct = p_correct, last_total = p_total, attempts = s.attempts + 1, updated_at = now(), shown = coalesce(p_shown, s.shown);
end $$;

-- Change how your score on a shared quiz is shown: 'name', 'anon', or 'none' to remove it from the group altogether.
create or replace function public.set_quiz_score_shown(p_item uuid, p_shown text) returns void
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  if me is null then raise exception 'Sign in first'; end if;
  if p_shown = 'none' then delete from public.group_quiz_scores where item_id = p_item and user_id = me; return; end if;
  if p_shown is null or p_shown not in ('name', 'anon') then raise exception 'Pick name, anonymous or none'; end if;
  update public.group_quiz_scores set shown = p_shown where item_id = p_item and user_id = me;
end $$;

-- Every score in a group, for its members. Anonymous scores come without who took them, how often, or the latest try
-- (yours always comes in full), and they're ordered by score so their order says nothing either.
create or replace function public.group_quiz_board(p_group uuid)
returns table (item_id uuid, user_id uuid, best_correct int, best_total int, last_correct int, last_total int, attempts int, shown text)
language plpgsql stable security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  if me is null then raise exception 'Sign in first'; end if;
  if not public.sbg_is_member(p_group) then raise exception 'That group isn''t one of yours'; end if;
  return query
    select s.item_id,
      case when s.shown = 'name' or s.user_id = me then s.user_id end,
      s.best_correct, s.best_total,
      case when s.shown = 'name' or s.user_id = me then s.last_correct end,
      case when s.shown = 'name' or s.user_id = me then s.last_total end,
      case when s.shown = 'name' or s.user_id = me then s.attempts end,
      s.shown
    from public.group_quiz_scores s where s.group_id = p_group
    order by s.item_id, s.best_correct::numeric / greatest(s.best_total, 1) desc, s.best_total desc;
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

revoke all on function public.submit_quiz_score(uuid, int, int, text), public.set_quiz_score_shown(uuid, text), public.group_quiz_board(uuid), public.set_rsvp(uuid, text), public.group_report(uuid, date, int, int),
  public.group_checkin(uuid, date, text, boolean), public.toggle_reaction(uuid, text), public.pin_message(uuid, boolean) from public, anon;
grant execute on function public.submit_quiz_score(uuid, int, int, text), public.set_quiz_score_shown(uuid, text), public.group_quiz_board(uuid), public.set_rsvp(uuid, text), public.group_report(uuid, date, int, int),
  public.group_checkin(uuid, date, text, boolean), public.toggle_reaction(uuid, text), public.pin_message(uuid, boolean) to authenticated;

-- ---------- 1.13: Project Tasks (shared task lists with assignees and due dates) ----------
-- A group can keep up to 20 active task lists (40 in all, counting archived ones), each holding up to 200 tasks.
-- Everyone in the group can read them. Nobody writes to these tables directly: every change goes through the functions below,
-- which check that you are a member, that an assignee is a current member, and who may do what.
create table if not exists public.group_task_lists (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.study_groups(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 80),
  course_code text not null default '' check (char_length(course_code) <= 40),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  archived boolean not null default false,
  unique (id, group_id)
);
create index if not exists group_task_lists_group_idx on public.group_task_lists (group_id);

create table if not exists public.group_tasks (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null,
  group_id uuid not null references public.study_groups(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 200),
  notes text not null default '' check (char_length(notes) <= 1000),
  status text not null default 'todo' check (status in ('todo', 'doing', 'done')),
  assignee_id uuid references auth.users(id) on delete set null,
  due_at date,
  priority text check (priority is null or priority in ('low', 'med', 'high', 'urgent')),
  position int not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  completed_by uuid references auth.users(id) on delete set null,
  deleted boolean not null default false,
  -- a task can only sit in a list of its own group
  foreign key (list_id, group_id) references public.group_task_lists (id, group_id) on delete cascade
);
create index if not exists group_tasks_list_idx on public.group_tasks (list_id, position);
create index if not exists group_tasks_group_idx on public.group_tasks (group_id);
create index if not exists group_tasks_assignee_idx on public.group_tasks (assignee_id) where assignee_id is not null;

alter table public.group_task_lists enable row level security;
alter table public.group_tasks enable row level security;
drop policy if exists "tasklist member read" on public.group_task_lists;
create policy "tasklist member read" on public.group_task_lists for select to authenticated using (public.sbg_is_member(group_id));
drop policy if exists "gtask member read" on public.group_tasks;
create policy "gtask member read" on public.group_tasks for select to authenticated using (public.sbg_is_member(group_id));
revoke all on public.group_task_lists, public.group_tasks from anon, authenticated;
grant select on public.group_task_lists, public.group_tasks to authenticated;

-- Stamps who and when, keeps the immutable columns put, tracks completion, and enforces the caps (also when something is edited in the SQL Editor).
create or replace function public.sbg_task_stamp() returns trigger
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  if tg_table_name = 'group_task_lists' then
    if tg_op = 'INSERT' then
      new.created_by := me; new.created_at := now();
      perform pg_advisory_xact_lock(hashtextextended('sb-tlist:' || new.group_id::text, 0));
      if (select count(*) from public.group_task_lists where group_id = new.group_id and not archived) >= 20 and not new.archived then
        raise exception 'A group can keep up to 20 task lists. Archive or delete one first.';
      end if;
      if (select count(*) from public.group_task_lists where group_id = new.group_id) >= 40 then
        raise exception 'This group already has 40 task lists (counting archived ones). Delete an old one first.';
      end if;
      if me is not null and (select count(*) from public.group_task_lists where created_by = me and created_at > now() - interval '1 minute') >= 10 then
        raise exception 'You are adding lists too fast. Try again in a minute.';
      end if;
    else
      new.id := old.id; new.group_id := old.group_id; new.created_by := old.created_by; new.created_at := old.created_at;
      if old.archived and not new.archived then
        perform pg_advisory_xact_lock(hashtextextended('sb-tlist:' || new.group_id::text, 0));
        if (select count(*) from public.group_task_lists where group_id = new.group_id and not archived) >= 20 then
          raise exception 'A group can keep up to 20 task lists. Archive or delete one first.';
        end if;
      end if;
    end if;
    return new;
  end if;
  -- group_tasks
  if tg_op = 'INSERT' then
    new.created_by := me; new.created_at := now(); new.updated_by := me; new.updated_at := now(); new.deleted := false;
    perform pg_advisory_xact_lock(hashtextextended('sb-gtask:' || new.list_id::text, 0));
    if (select count(*) from public.group_tasks where list_id = new.list_id and not deleted) >= 200 then
      raise exception 'A task list holds up to 200 tasks. Archive this list or start a new one.';
    end if;
    if me is not null and (select count(*) from public.group_tasks where created_by = me and created_at > now() - interval '1 minute') >= 40 then
      raise exception 'You are adding tasks too fast. Try again in a minute.';
    end if;
    if new.status = 'done' then new.completed_at := now(); new.completed_by := me; else new.completed_at := null; new.completed_by := null; end if;
  else
    new.id := old.id; new.list_id := old.list_id; new.group_id := old.group_id; new.created_by := old.created_by; new.created_at := old.created_at;
    new.updated_by := me; new.updated_at := now();
    if new.status = 'done' and old.status <> 'done' then new.completed_at := now(); new.completed_by := me;
    elsif new.status <> 'done' then new.completed_at := null; new.completed_by := null;
    else new.completed_at := old.completed_at; new.completed_by := old.completed_by; end if;
  end if;
  -- An assignee has to be a current member of the group.
  if new.assignee_id is not null and (tg_op = 'INSERT' or new.assignee_id is distinct from old.assignee_id)
     and not exists (select 1 from public.group_members m where m.group_id = new.group_id and m.user_id = new.assignee_id) then
    raise exception 'You can only assign a task to someone in the group.';
  end if;
  return new;
end $$;
drop trigger if exists sbg_tasklists_stamp on public.group_task_lists;
create trigger sbg_tasklists_stamp before insert or update on public.group_task_lists for each row execute function public.sbg_task_stamp();
drop trigger if exists sbg_tasks_stamp on public.group_tasks;
create trigger sbg_tasks_stamp before insert or update on public.group_tasks for each row execute function public.sbg_task_stamp();

-- When someone leaves (or is removed), their tasks become unassigned.
create or replace function public.sbg_task_member_left() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update public.group_tasks set assignee_id = null where group_id = old.group_id and assignee_id = old.user_id;
  return old;
end $$;
drop trigger if exists sbg_task_member_left on public.group_members;
create trigger sbg_task_member_left after delete on public.group_members for each row execute function public.sbg_task_member_left();

-- Make a task list. Any member can.
create or replace function public.create_task_list(p_group uuid, p_title text, p_course text) returns public.group_task_lists
language plpgsql security definer set search_path = public as $$
declare r public.group_task_lists; me uuid := auth.uid();
begin
  if me is null then raise exception 'Sign in first'; end if;
  if not public.sbg_is_member(p_group) then raise exception 'You''re not in that group'; end if;
  insert into public.group_task_lists (group_id, title, course_code) values (p_group, btrim(coalesce(p_title, '')), left(btrim(coalesce(p_course, '')), 40)) returning * into r;
  return r;
end $$;

-- Rename or archive a list (p_patch keys: title, course_code, archived). Any member can.
create or replace function public.update_task_list(p_list uuid, p_patch jsonb) returns public.group_task_lists
language plpgsql security definer set search_path = public as $$
declare r public.group_task_lists; gid uuid; me uuid := auth.uid();
begin
  if me is null then raise exception 'Sign in first'; end if;
  select group_id into gid from public.group_task_lists where id = p_list;
  if gid is null or not public.sbg_is_member(gid) then raise exception 'That list isn''t in one of your groups'; end if;
  p_patch := coalesce(p_patch, '{}'::jsonb);
  update public.group_task_lists set
    title = case when p_patch ? 'title' then btrim(coalesce(p_patch ->> 'title', '')) else title end,
    course_code = case when p_patch ? 'course_code' then left(btrim(coalesce(p_patch ->> 'course_code', '')), 40) else course_code end,
    archived = case when p_patch ? 'archived' then coalesce((p_patch ->> 'archived')::boolean, false) else archived end
  where id = p_list returning * into r;
  return r;
end $$;

-- Delete a list and everything on it. Only the person who made it, or the group owner.
create or replace function public.delete_task_list(p_list uuid) returns void
language plpgsql security definer set search_path = public as $$
declare gid uuid; maker uuid; me uuid := auth.uid();
begin
  if me is null then raise exception 'Sign in first'; end if;
  select group_id, created_by into gid, maker from public.group_task_lists where id = p_list;
  if gid is null or not public.sbg_is_member(gid) then raise exception 'That list isn''t in one of your groups'; end if;
  if not (maker = me or public.sbg_is_owner(gid)) then raise exception 'Only the group owner or whoever made the list can delete it'; end if;
  delete from public.group_task_lists where id = p_list;
end $$;

-- Add a task to a list. Any member can; the assignee (optional) has to be a member.
create or replace function public.add_group_task(p_list uuid, p_title text, p_assignee uuid, p_due date, p_notes text, p_priority text) returns public.group_tasks
language plpgsql security definer set search_path = public as $$
declare r public.group_tasks; gid uuid; arch boolean; me uuid := auth.uid();
begin
  if me is null then raise exception 'Sign in first'; end if;
  select group_id, archived into gid, arch from public.group_task_lists where id = p_list;
  if gid is null or not public.sbg_is_member(gid) then raise exception 'That list isn''t in one of your groups'; end if;
  if arch then raise exception 'That list is archived. Restore it to add tasks.'; end if;
  insert into public.group_tasks (list_id, group_id, title, notes, assignee_id, due_at, priority, position)
    values (p_list, gid, btrim(coalesce(p_title, '')), left(btrim(coalesce(p_notes, '')), 1000), p_assignee, p_due, nullif(p_priority, ''),
            coalesce((select max(position) from public.group_tasks where list_id = p_list), 0) + 1)
    returning * into r;
  -- Tidy up: tasks deleted more than two weeks ago.
  delete from public.group_tasks where group_id = gid and deleted and updated_at < now() - interval '14 days';
  return r;
end $$;

-- Change a task (p_patch keys: title, notes, status, assignee_id, due_at, priority). Any member can edit and mark done.
-- Changing who a task is assigned to: anyone can assign an unassigned task; once it has an owner, only that person or the group owner can reassign it.
create or replace function public.update_group_task(p_task uuid, p_patch jsonb) returns public.group_tasks
language plpgsql security definer set search_path = public as $$
declare r public.group_tasks; t public.group_tasks; me uuid := auth.uid();
begin
  if me is null then raise exception 'Sign in first'; end if;
  select * into t from public.group_tasks where id = p_task and not deleted;
  if t.id is null or not public.sbg_is_member(t.group_id) then raise exception 'That task isn''t in one of your groups'; end if;
  p_patch := coalesce(p_patch, '{}'::jsonb);
  if p_patch ? 'assignee_id' and (p_patch ->> 'assignee_id') is distinct from t.assignee_id::text then
    if t.assignee_id is not null and not (t.assignee_id = me or public.sbg_is_owner(t.group_id)) then
      raise exception 'Only the person it''s assigned to, or the group owner, can reassign this task';
    end if;
  end if;
  update public.group_tasks set
    title = case when p_patch ? 'title' then btrim(coalesce(p_patch ->> 'title', '')) else title end,
    notes = case when p_patch ? 'notes' then left(btrim(coalesce(p_patch ->> 'notes', '')), 1000) else notes end,
    status = case when p_patch ? 'status' then coalesce(p_patch ->> 'status', status) else status end,
    assignee_id = case when p_patch ? 'assignee_id' then (p_patch ->> 'assignee_id')::uuid else assignee_id end,
    due_at = case when p_patch ? 'due_at' then (p_patch ->> 'due_at')::date else due_at end,
    priority = case when p_patch ? 'priority' then nullif(p_patch ->> 'priority', '') else priority end
  where id = p_task returning * into r;
  return r;
end $$;

-- Move a task up (-1) or down (1) among the tasks of its list that are in the same state (open or done). Any member can.
create or replace function public.move_group_task(p_task uuid, p_dir int) returns void
language plpgsql security definer set search_path = public as $$
declare t public.group_tasks; me uuid := auth.uid(); ids uuid[]; i int; j int;
begin
  if me is null then raise exception 'Sign in first'; end if;
  select * into t from public.group_tasks where id = p_task and not deleted;
  if t.id is null or not public.sbg_is_member(t.group_id) then raise exception 'That task isn''t in one of your groups'; end if;
  perform pg_advisory_xact_lock(hashtextextended('sb-gtask:' || t.list_id::text, 0));
  -- number the whole list 1..n in its current order, then swap this task with its neighbour of the same kind
  update public.group_tasks g set position = x.n from (select id, row_number() over (order by position, created_at, id) as n from public.group_tasks where list_id = t.list_id and not deleted) x
    where g.id = x.id and g.position <> x.n;
  select array_agg(id order by position, id) into ids from public.group_tasks where list_id = t.list_id and not deleted and (status = 'done') = (t.status = 'done');
  i := array_position(ids, p_task); j := i + case when p_dir < 0 then -1 else 1 end;
  if i is null or j < 1 or j > array_length(ids, 1) then return; end if;
  update public.group_tasks g set position = case g.id when p_task then o.position else n.position end
    from (select position from public.group_tasks where id = ids[j]) o, (select position from public.group_tasks where id = p_task) n
    where g.id in (p_task, ids[j]);
end $$;

-- Remove a task (kept out of sight for two weeks, then tidied away). Only whoever added it, or the group owner.
create or replace function public.delete_group_task(p_task uuid) returns void
language plpgsql security definer set search_path = public as $$
declare t public.group_tasks; me uuid := auth.uid();
begin
  if me is null then raise exception 'Sign in first'; end if;
  select * into t from public.group_tasks where id = p_task and not deleted;
  if t.id is null or not public.sbg_is_member(t.group_id) then raise exception 'That task isn''t in one of your groups'; end if;
  if not (t.created_by = me or public.sbg_is_owner(t.group_id)) then raise exception 'Only the group owner or whoever added the task can remove it'; end if;
  update public.group_tasks set deleted = true where id = p_task;
end $$;

revoke all on function public.sbg_task_stamp(), public.sbg_task_member_left(), public.create_task_list(uuid, text, text), public.update_task_list(uuid, jsonb),
  public.delete_task_list(uuid), public.add_group_task(uuid, text, uuid, date, text, text), public.update_group_task(uuid, jsonb),
  public.move_group_task(uuid, int), public.delete_group_task(uuid) from public, anon, authenticated;
grant execute on function public.create_task_list(uuid, text, text), public.update_task_list(uuid, jsonb), public.delete_task_list(uuid),
  public.add_group_task(uuid, text, uuid, date, text, text), public.update_group_task(uuid, jsonb), public.move_group_task(uuid, int),
  public.delete_group_task(uuid) to authenticated;

-- ---------- Live updates for groups ----------
do $$
declare t text;
begin
  foreach t in array array['study_groups', 'group_members', 'group_items', 'group_messages', 'group_quiz_scores', 'group_rsvps', 'group_stats', 'group_checkins', 'group_reactions', 'group_task_lists', 'group_tasks'] loop
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- ---------- 1.14: group projects ----------
-- A group is either a study group (the default) or a group project, which can have a due date. Only the owner changes either.
alter table public.study_groups add column if not exists kind text not null default 'study';
alter table public.study_groups drop constraint if exists study_groups_kind_check;
alter table public.study_groups add constraint study_groups_kind_check check (kind in ('study', 'project'));
alter table public.study_groups add column if not exists project_due date;
grant update (name, course, weekly_goal, project_due) on public.study_groups to authenticated;

create or replace function public.set_group_kind(p_group uuid, p_kind text, p_due date) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.sbg_is_owner(p_group) then raise exception 'Only the owner can do that'; end if;
  if p_kind not in ('study', 'project') then raise exception 'Unknown group type'; end if;
  update public.study_groups set kind = p_kind, project_due = case when p_kind = 'project' then p_due else null end where id = p_group;
end $$;
revoke all on function public.set_group_kind(uuid, text, date) from public, anon;
grant execute on function public.set_group_kind(uuid, text, date) to authenticated;

-- ---------- 1.15: more for study groups and group projects ----------
-- Study groups: a Q&A board (questions and answers), and an anonymous list of the cards and quiz questions in the group's shared decks that members miss most.
-- Group projects: roles (one per member), files and links, meeting notes, and a private contribution check-in.
-- Everything except the check-in is stored as shared items, so the same rules apply: members read and add, you change your own, the owner can remove any.
-- (An earlier draft kept each person's weak cards as a shared item that named them. Those are removed; most-missed cards are now anonymous, see group_misses below.)
delete from public.group_items where kind = 'weak';
drop index if exists public.group_items_one_weak;
alter table public.group_items drop constraint if exists group_items_kind_check;
alter table public.group_items add constraint group_items_kind_check
  check (kind in ('deck', 'task', 'quiz', 'event', 'qa', 'answer', 'link', 'minutes', 'role')) not valid;
-- One role per person in a group (choosing again updates it).
create unique index if not exists group_items_one_role on public.group_items (group_id, user_id) where kind = 'role';

-- Contribution check-in: each member rates the others (1 to 5, with an optional note). You can only ever read what YOU wrote.
-- The group owner reads totals only (how many people rated someone and the average), never who said what or the notes.
create table if not exists public.group_peer_ratings (
  group_id uuid not null references public.study_groups(id) on delete cascade,
  from_user uuid not null references auth.users(id) on delete cascade,
  to_user uuid not null references auth.users(id) on delete cascade,
  score int not null check (score between 1 and 5),
  note text not null default '' check (char_length(note) <= 300),
  updated_at timestamptz not null default now(),
  primary key (group_id, from_user, to_user),
  check (from_user <> to_user)
);
alter table public.group_peer_ratings enable row level security;
drop policy if exists "peer own read" on public.group_peer_ratings;
create policy "peer own read" on public.group_peer_ratings for select to authenticated using (from_user = auth.uid());
revoke all on public.group_peer_ratings from anon, authenticated;
grant select on public.group_peer_ratings to authenticated;

create or replace function public.submit_peer(p_group uuid, p_to uuid, p_score int, p_note text) returns void
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  if me is null then raise exception 'Sign in first'; end if;
  if not public.sbg_is_member(p_group) then raise exception 'You''re not in that group'; end if;
  if not exists (select 1 from public.study_groups where id = p_group and kind = 'project') then raise exception 'Check-ins are for group projects'; end if;
  if p_to = me or not exists (select 1 from public.group_members where group_id = p_group and user_id = p_to) then raise exception 'You can only rate someone else in the group'; end if;
  if p_score is null or p_score < 1 or p_score > 5 then raise exception 'Pick a score from 1 to 5'; end if;
  insert into public.group_peer_ratings as r (group_id, from_user, to_user, score, note, updated_at)
    values (p_group, me, p_to, p_score, left(coalesce(btrim(p_note), ''), 300), now())
  on conflict (group_id, from_user, to_user) do update set score = excluded.score, note = excluded.note, updated_at = now();
end $$;

-- Owner only: for each member, how many people rated them and the average. Nothing that says who rated whom.
create or replace function public.peer_summary(p_group uuid) returns table (to_user uuid, raters int, avg_score numeric)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.sbg_is_owner(p_group) then raise exception 'Only the owner can see the summary'; end if;
  return query select r.to_user, count(*)::int, round(avg(r.score)::numeric, 1)
    from public.group_peer_ratings r where r.group_id = p_group group by r.to_user;
end $$;
revoke all on function public.submit_peer(uuid, uuid, int, text), public.peer_summary(uuid) from public, anon;
grant execute on function public.submit_peer(uuid, uuid, int, text), public.peer_summary(uuid) to authenticated;

-- Most missed (study groups): members who choose to take part send how often they missed each card and quiz question in the group's shared decks and quizzes.
-- Nobody can read these rows, not even other members or the owner: the table has no read rule at all. The only way out is top_misses, which returns totals per card or question
-- (how many members missed it) and nothing that names or identifies anyone. It returns nothing until at least 3 members have taken part, and only lists a card or question that at least 2 members missed.
create table if not exists public.group_misses (
  group_id uuid not null references public.study_groups(id) on delete cascade,
  item_id uuid not null references public.group_items(id) on delete cascade,
  mkey text not null check (char_length(mkey) between 1 and 80),
  user_id uuid not null references auth.users(id) on delete cascade,
  misses int not null check (misses between 0 and 100000),
  tries int not null check (tries between 0 and 100000),
  updated_at timestamptz not null default now(),
  primary key (item_id, mkey, user_id)
);
create index if not exists group_misses_group_idx on public.group_misses (group_id);
alter table public.group_misses enable row level security;
revoke all on public.group_misses from anon, authenticated;

-- Replace your own numbers for a group. p_rows: [{"item": "<shared deck or quiz id>", "k": "c:<card id>" or "q:<question id>", "m": misses, "t": tries}], up to 300.
create or replace function public.report_misses(p_group uuid, p_rows jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  if me is null then raise exception 'Sign in first'; end if;
  if not public.sbg_is_member(p_group) then raise exception 'You''re not in that group'; end if;
  if p_rows is null or jsonb_typeof(p_rows) <> 'array' or jsonb_array_length(p_rows) > 300 then raise exception 'That report isn''t valid'; end if;
  delete from public.group_misses where group_id = p_group and user_id = me;
  insert into public.group_misses (group_id, item_id, mkey, user_id, misses, tries)
    select p_group, i.id, left(r.k, 80), me, least(greatest(r.m, 0), 100000), least(greatest(r.t, r.m, 0), 100000)
    from jsonb_to_recordset(p_rows) as r(item uuid, k text, m int, t int)
    join public.group_items i on i.id = r.item and i.group_id = p_group and i.kind in ('deck', 'quiz')
    where r.k is not null and char_length(r.k) between 1 and 80 and r.t > 0
  on conflict (item_id, mkey, user_id) do update set misses = excluded.misses, tries = excluded.tries, updated_at = now();
end $$;

-- Stop taking part: removes your numbers.
create or replace function public.forget_misses(p_group uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  delete from public.group_misses where group_id = p_group and user_id = auth.uid();
end $$;

create or replace function public.top_misses(p_group uuid, p_limit int default 10) returns table (item_id uuid, mkey text, members_missed int, total_misses int, members_tried int)
language plpgsql stable security definer set search_path = public as $$
begin
  if auth.uid() is null or not public.sbg_is_member(p_group) then raise exception 'You''re not in that group'; end if;
  if (select count(distinct m.user_id) from public.group_misses m where m.group_id = p_group) < 3 then return; end if;
  return query
    select m.item_id, m.mkey, (count(*) filter (where m.misses > 0))::int, coalesce(sum(m.misses), 0)::int, count(*)::int
    from public.group_misses m where m.group_id = p_group
    group by m.item_id, m.mkey
    having count(*) filter (where m.misses > 0) >= 2
    order by 3 desc, 4 desc, 1, 2
    limit least(greatest(coalesce(p_limit, 10), 1), 25);
end $$;
revoke all on function public.report_misses(uuid, jsonb), public.forget_misses(uuid), public.top_misses(uuid, int) from public, anon;
grant execute on function public.report_misses(uuid, jsonb), public.forget_misses(uuid), public.top_misses(uuid, int) to authenticated;

-- ---------- 1.16: Pro groups ----------
-- A group is a Pro group when a member with Pro assigns Pro to it, the owner included (supabase-plans.sql: group_pro_set; 5 per account). The extras below are
-- small: they reuse shared items and task lists, and Studyboard shows them in Pro groups only.
--  * New shared item kinds: 'avail' (Find a Time: one per member, only which half-hours are busy, never what's in their plan),
--    'topics' (an exam's topics split among members), 'topic' (a member marking their topic as shared) and 'gfile' (a file uploaded to the group).
--  * Team deadline: an earlier date the group works toward (study_groups.team_due, set by the owner).
--  * Review before done: a task can wait In Review for its reviewer (group_tasks.reviewer_id); only the reviewer or the owner approves it.
--  * Live quiz: a private Realtime channel per group, "sbquiz:<group id>", that only members can listen or send on.
alter table public.group_items drop constraint if exists group_items_kind_check;
alter table public.group_items add constraint group_items_kind_check
  check (kind in ('deck', 'task', 'quiz', 'event', 'qa', 'answer', 'link', 'minutes', 'role', 'avail', 'topics', 'topic', 'gfile')) not valid;   -- not valid: when this file runs again, 'battle' rows (added below) are kept; the last list is checked in full
create unique index if not exists group_items_one_avail on public.group_items (group_id, user_id) where kind = 'avail';
create unique index if not exists group_items_one_topic on public.group_items (group_id, user_id, ref_id, title) where kind = 'topic';

alter table public.study_groups add column if not exists team_due date;
grant update (name, course, weekly_goal, project_due, team_due) on public.study_groups to authenticated;

alter table public.group_tasks add column if not exists reviewer_id uuid references auth.users(id) on delete set null;
alter table public.group_tasks drop constraint if exists group_tasks_status_check;
alter table public.group_tasks add constraint group_tasks_status_check check (status in ('todo', 'doing', 'review', 'done'));

-- Someone who leaves a group stops being assigned to, or reviewing, its tasks.
create or replace function public.sbg_task_member_left() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update public.group_tasks set assignee_id = null where group_id = old.group_id and assignee_id = old.user_id;
  update public.group_tasks set reviewer_id = null where group_id = old.group_id and reviewer_id = old.user_id;
  return old;
end $$;

-- Change a task (p_patch keys: title, notes, status, assignee_id, due_at, priority, reviewer_id). Any member can edit and mark done.
-- Changing who a task is assigned to: anyone can assign an unassigned task; once it has an owner, only that person or the group owner can reassign it.
-- A task with a reviewer: marking it done (from any state) is for the reviewer or the group owner; anyone else sends it to In Review.
-- Anyone can give a task without a reviewer one; once it has one, only that reviewer or the group owner can change or clear it
-- (so "Review before done" can't be skipped by clearing the reviewer and marking it done in the same change).
create or replace function public.update_group_task(p_task uuid, p_patch jsonb) returns public.group_tasks
language plpgsql security definer set search_path = public as $$
declare r public.group_tasks; t public.group_tasks; me uuid := auth.uid(); st text; rev uuid; gate uuid;
begin
  if me is null then raise exception 'Sign in first'; end if;
  select * into t from public.group_tasks where id = p_task and not deleted;
  if t.id is null or not public.sbg_is_member(t.group_id) then raise exception 'That task isn''t in one of your groups'; end if;
  p_patch := coalesce(p_patch, '{}'::jsonb);
  if p_patch ? 'assignee_id' and (p_patch ->> 'assignee_id') is distinct from t.assignee_id::text then
    if t.assignee_id is not null and not (t.assignee_id = me or public.sbg_is_owner(t.group_id)) then
      raise exception 'Only the person it''s assigned to, or the group owner, can reassign this task';
    end if;
  end if;
  rev := case when p_patch ? 'reviewer_id' then nullif(p_patch ->> 'reviewer_id', '')::uuid else t.reviewer_id end;
  if rev is distinct from t.reviewer_id and t.reviewer_id is not null and not (t.reviewer_id = me or public.sbg_is_owner(t.group_id)) then
    raise exception 'Only the reviewer, or the group owner, can change who reviews this task';
  end if;
  if rev is not null and rev is distinct from t.reviewer_id and not exists (select 1 from public.group_members where group_id = t.group_id and user_id = rev) then
    raise exception 'The reviewer has to be in the group';
  end if;
  st := case when p_patch ? 'status' then coalesce(p_patch ->> 'status', t.status) else t.status end;
  gate := coalesce(t.reviewer_id, rev);   -- the reviewer the task had when this change was asked for decides
  if st = 'done' and t.status <> 'done' and gate is not null and gate <> me and not public.sbg_is_owner(t.group_id) then
    st := 'review';   -- it waits for its reviewer
  end if;
  update public.group_tasks set
    title = case when p_patch ? 'title' then btrim(coalesce(p_patch ->> 'title', '')) else title end,
    notes = case when p_patch ? 'notes' then left(btrim(coalesce(p_patch ->> 'notes', '')), 1000) else notes end,
    status = st,
    assignee_id = case when p_patch ? 'assignee_id' then (p_patch ->> 'assignee_id')::uuid else assignee_id end,
    due_at = case when p_patch ? 'due_at' then (p_patch ->> 'due_at')::date else due_at end,
    priority = case when p_patch ? 'priority' then nullif(p_patch ->> 'priority', '') else priority end,
    reviewer_id = rev
  where id = p_task returning * into r;
  return r;
end $$;
revoke all on function public.update_group_task(uuid, jsonb), public.sbg_task_member_left() from public, anon, authenticated;
grant execute on function public.update_group_task(uuid, jsonb) to authenticated;

-- Live quiz channel rules (the same way as Study Together rooms in rooms.sql)
create or replace function public.sbg_quiz_topic_ok(p_topic text) returns boolean
language plpgsql stable security definer set search_path = public as $$
begin
  if p_topic is null or p_topic !~ '^sbquiz:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then return false; end if;
  return public.sbg_is_member(substr(p_topic, 8)::uuid);
end $$;
revoke all on function public.sbg_quiz_topic_ok(text) from public, anon;
grant execute on function public.sbg_quiz_topic_ok(text) to authenticated;
do $$
begin
  if to_regclass('realtime.messages') is null then
    raise notice 'realtime.messages not found, so the live quiz channel rules were skipped. Live quizzes stay off until they are installed.';
    return;
  end if;
  begin
    execute 'drop policy if exists "studyboard quiz listen" on realtime.messages';
    execute 'create policy "studyboard quiz listen" on realtime.messages for select to authenticated using (realtime.messages.extension in (''broadcast'', ''presence'') and public.sbg_quiz_topic_ok((select realtime.topic())))';
    execute 'drop policy if exists "studyboard quiz send" on realtime.messages';
    execute 'create policy "studyboard quiz send" on realtime.messages for insert to authenticated with check (realtime.messages.extension in (''broadcast'', ''presence'') and public.sbg_quiz_topic_ok((select realtime.topic())))';
  exception when insufficient_privilege then
    raise notice 'Skipped the live quiz channel rules (no permission on realtime.messages). Live quizzes stay off until they are installed.';
  end;
end $$;

-- ---------- Storage caps: shared decks and shared group items ----------
-- Each row was already capped (3 MB of JSON) and counted (200 shared decks, 500 items per person per group), but nothing capped the
-- total, so one account could still fill the database with many groups. Per person: shared decks up to 50 MB in all, and shared group
-- items up to 50 MB in all (across every group). Measured as the space the rows take on disk (pg_column_size, after compression),
-- which is what counts toward the database size and is cheap to add up. Shrinking or deleting always works, whatever the totals.
create index if not exists group_items_user_idx on public.group_items (user_id);
create or replace function public.sbg_size_cap() returns trigger
language plpgsql security definer set search_path = public as $$
declare who uuid; total bigint; cap constant bigint := 52428800;   -- 50 MB
begin
  if tg_op = 'UPDATE' and pg_column_size(new.data) <= pg_column_size(old.data) then return new; end if;
  if tg_table_name = 'shared_decks' then
    who := new.owner_id;
    perform pg_advisory_xact_lock(hashtextextended('sbg-size:d:' || who::text, 0));   -- two shares at once can't both slip under the cap
    select coalesce(sum(pg_column_size(d.data)), 0) into total from public.shared_decks d where d.owner_id = who and d.code is distinct from new.code;
    if total + pg_column_size(new.data) > cap then
      raise exception 'Your shared decks are over the 50 MB storage limit. Stop sharing some decks first.' using errcode = 'P0001';
    end if;
  else
    who := new.user_id;
    perform pg_advisory_xact_lock(hashtextextended('sbg-size:i:' || who::text, 0));
    select coalesce(sum(pg_column_size(i.data)), 0) into total from public.group_items i where i.user_id = who and i.id is distinct from new.id;
    if total + pg_column_size(new.data) > cap then
      raise exception 'Your shared group items are over the 50 MB storage limit. Remove some you shared first.' using errcode = 'P0001';
    end if;
  end if;
  return new;
end $$;
revoke all on function public.sbg_size_cap() from public, anon, authenticated;
-- Named so it runs after sbg_items_stamp (triggers run in name order), which fills in user_id.
drop trigger if exists sbg_size_cap on public.shared_decks;
create trigger sbg_size_cap before insert or update of data on public.shared_decks for each row execute function public.sbg_size_cap();
drop trigger if exists sbg_size_cap on public.group_items;
create trigger sbg_size_cap before insert or update of data, user_id on public.group_items for each row execute function public.sbg_size_cap();

-- ---------- Blocking (supabase-moderation.sql) survives running this file again ----------
-- This file (re)creates the members-only read rules above. Once supabase-moderation.sql has added group_blocks, the same rules must
-- also hide what blocked people post, so they are rebuilt here with that filter (and moderation.sql calls this too). Without
-- group_blocks it does nothing, and the plain members-only rules above stay.
create or replace function public.sbg_block_policies() returns void
language plpgsql set search_path = public as $$
begin
  if to_regclass('public.group_blocks') is null then return; end if;
  execute 'drop policy if exists "message member read" on public.group_messages';
  execute $p$create policy "message member read" on public.group_messages for select to authenticated
    using (public.sbg_is_member(group_id)
           and not exists (select 1 from public.group_blocks b where b.blocker_id = auth.uid() and b.blocked_id = group_messages.user_id))$p$;
  execute 'drop policy if exists "item member read" on public.group_items';
  execute $p$create policy "item member read" on public.group_items for select to authenticated
    using (public.sbg_is_member(group_id)
           and not exists (select 1 from public.group_blocks b where b.blocker_id = auth.uid() and b.blocked_id = group_items.user_id))$p$;
  -- Project Tasks: lists and tasks added by someone you blocked are hidden too (the tasks still on a hidden list go with it in the app).
  if to_regclass('public.group_tasks') is null or to_regclass('public.group_task_lists') is null then return; end if;
  execute 'drop policy if exists "tasklist member read" on public.group_task_lists';
  execute $p$create policy "tasklist member read" on public.group_task_lists for select to authenticated
    using (public.sbg_is_member(group_id)
           and not exists (select 1 from public.group_blocks b where b.blocker_id = auth.uid() and b.blocked_id = group_task_lists.created_by))$p$;
  execute 'drop policy if exists "gtask member read" on public.group_tasks';
  execute $p$create policy "gtask member read" on public.group_tasks for select to authenticated
    using (public.sbg_is_member(group_id)
           and not exists (select 1 from public.group_blocks b where b.blocker_id = auth.uid() and b.blocked_id = group_tasks.created_by))$p$;
end $$;
revoke all on function public.sbg_block_policies() from public, anon, authenticated;
select public.sbg_block_policies();

-- ---------- Deleted groups: 30 days to undo ----------
-- Deleting a group (the app deletes the study_groups row) does not remove anything straight away: the row is kept with deleted_at set,
-- every rule treats the group as gone for everyone (sbg_is_member / sbg_is_owner above, and invite codes stop working), and its owner can
-- restore it with everything in it (members, messages, decks, tasks, quizzes, files) for 30 days. Then the nightly clean-up deletes it
-- for good. It costs only the space of those rows for 30 more days.
-- Real deletes still happen: the clean-up, deleting an account, the SQL Editor (none of them run as a signed-in user), and a group made in
-- the last 10 minutes with nobody else in it (the app removes one that couldn't be set up).
create or replace function public.sbg_soft_delete() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  -- (current_user is this function's owner here; the "role" setting is who is really asking: authenticated for the app)
  if coalesce(current_setting('role', true), 'none') not in ('authenticated', 'anon')
     or coalesce(current_setting('studyboard.group_purge', true), '') = 'on'   -- deleting an account
     or old.deleted_at is not null then return old; end if;
  if old.created_at > now() - interval '10 minutes'
     and not exists (select 1 from public.group_members m where m.group_id = old.id and m.user_id <> old.owner_id) then return old; end if;
  update public.study_groups set deleted_at = now() where id = old.id;
  return null;   -- the row stays
end $$;
revoke all on function public.sbg_soft_delete() from public, anon, authenticated;
drop trigger if exists sbg_soft_delete on public.study_groups;
create trigger sbg_soft_delete before delete on public.study_groups for each row execute function public.sbg_soft_delete();

-- The groups you deleted in the last 30 days (for Restore in the app).
create or replace function public.my_deleted_groups() returns table (id uuid, name text, course text, deleted_at timestamptz, purge_at timestamptz)
language sql stable security definer set search_path = public as $$
  select g.id, g.name, g.course, g.deleted_at, g.deleted_at + interval '30 days'
  from public.study_groups g
  where g.owner_id = auth.uid() and g.deleted_at is not null and g.deleted_at > now() - interval '30 days'
  order by g.deleted_at desc
$$;
-- Brings a deleted group back for everyone, as it was. Only its owner, within the 30 days.
create or replace function public.restore_group(p_group uuid) returns boolean
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  if me is null then raise exception 'Sign in first'; end if;
  if to_regclass('public.group_suspended') is not null and exists (select 1 from public.group_suspended where user_id = me) then
    raise exception 'Your account can''t use study groups after a report was reviewed. The rest of Studyboard works as usual.';
  end if;
  if (select count(*) from public.study_groups where owner_id = me and deleted_at is null) >= 50 then raise exception 'You can own up to 50 groups'; end if;
  update public.study_groups set deleted_at = null
    where id = p_group and owner_id = me and deleted_at is not null and deleted_at > now() - interval '30 days';
  return found;
end $$;
-- Nightly: groups deleted more than 30 days ago go for good (with everything in them).
create or replace function public.sbg_purge_deleted_groups() returns integer
language plpgsql security definer set search_path = public as $$
declare n integer := 0;
begin
  with gone as (delete from public.study_groups where deleted_at is not null and deleted_at < now() - interval '30 days' returning 1)
  select count(*) into n from gone;
  return n;
end $$;
revoke all on function public.my_deleted_groups(), public.restore_group(uuid), public.sbg_purge_deleted_groups() from public, anon, authenticated;
grant execute on function public.my_deleted_groups(), public.restore_group(uuid) to authenticated;

do $$
begin
  begin
    create extension if not exists pg_cron;
  exception when others then
    raise notice 'pg_cron is not available, so deleted groups are not removed after 30 days automatically. You can run: select public.sbg_purge_deleted_groups();';
  end;
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule(jobid) from cron.job where jobname = 'studyboard-purge-deleted-groups';
    perform cron.schedule('studyboard-purge-deleted-groups', '41 4 * * *', 'select public.sbg_purge_deleted_groups()');
  end if;
end $$;

-- ---------- Features the owner turns off ----------
-- The owner can hide parts of a group nobody uses (Edit Group > Features), so members only see what the group wants. It only hides:
-- nothing is deleted, and turning a feature back on shows everything again. Only the owner can change it (the "group owner update" policy).
alter table public.study_groups add column if not exists hidden_features text[] not null default '{}';
alter table public.study_groups drop constraint if exists study_groups_hidden_features_check;
alter table public.study_groups add constraint study_groups_hidden_features_check
  check (cardinality(hidden_features) <= 20 and array_to_string(hidden_features, ',') ~ '^([a-z]{2,16}(,[a-z]{2,16})*)?$');
grant update (hidden_features) on public.study_groups to authenticated;
notify pgrst, 'reload schema';

-- ---------- Quiz Battle is opt-in ----------
-- A member is on a study group's Quiz Battle leaderboard only after they join it: one 'battle' item per member ({on: true}).
-- Leaving deletes it. Shared items follow the usual rules (members read, you change your own, the owner can remove any).
alter table public.group_items drop constraint if exists group_items_kind_check;
alter table public.group_items add constraint group_items_kind_check
  check (kind in ('deck', 'task', 'quiz', 'event', 'qa', 'answer', 'link', 'minutes', 'role', 'avail', 'topics', 'topic', 'gfile', 'battle'));
create unique index if not exists group_items_one_battle on public.group_items (group_id, user_id) where kind = 'battle';
notify pgrst, 'reload schema';

-- ---------- Each member's colour ----------
-- Every member picks a colour when they join (or later, on the Members tab). The group's task board paints each person's tasks in it,
-- so the team can see at a glance who has what. One of the app's palette colours (#RRGGBB) or none (the app then picks one from the id).
-- Written only through set_member_color, and only your own row.
alter table public.group_members add column if not exists color text;
alter table public.group_members drop constraint if exists group_members_color_check;
alter table public.group_members add constraint group_members_color_check check (color is null or color ~ '^#[0-9A-F]{6}$');
revoke update (color) on public.group_members from authenticated;
-- Two colours look the same to people when they are this close (distance in RGB, weighted the way eyes see it, "redmean")
create or replace function public.sbg_color_near(a text, b text) returns boolean
language plpgsql immutable set search_path = public, pg_temp as $$
declare r1 int; g1 int; b1 int; r2 int; g2 int; b2 int; rm float8;
begin
  if a is null or b is null or a !~* '^#[0-9A-F]{6}$' or b !~* '^#[0-9A-F]{6}$' then return false; end if;
  r1 := ('x' || substr(a, 2, 2))::bit(8)::int; g1 := ('x' || substr(a, 4, 2))::bit(8)::int; b1 := ('x' || substr(a, 6, 2))::bit(8)::int;
  r2 := ('x' || substr(b, 2, 2))::bit(8)::int; g2 := ('x' || substr(b, 4, 2))::bit(8)::int; b2 := ('x' || substr(b, 6, 2))::bit(8)::int;
  rm := (r1 + r2) / 2.0;
  return sqrt((2 + rm / 256) * (r1 - r2) ^ 2 + 4 * (g1 - g2) ^ 2 + (2 + (255 - rm) / 256) * (b1 - b2) ^ 2) < 60;
end $$;
create or replace function public.set_member_color(p_group uuid, p_color text) returns text
language plpgsql security definer set search_path = public, pg_temp as $$
declare me uuid := auth.uid(); v text := nullif(upper(coalesce(p_color, '')), ''); pro boolean;
begin
  if me is null then raise exception 'Sign in first'; end if;
  if v is not null and v !~ '^#[0-9A-F]{6}$' then raise exception 'Pick one of the colours'; end if;
  -- The 10 palette colours are for every group; any other colour (the colour picker) is for a Pro group, or a member with Studyboard Pro
  if v is not null and not (v = any (array['#E5484D','#F76B15','#E2A50B','#30A46C','#12A594','#0090FF','#3E63DD','#8E4EC6','#D6409F','#6E5240'])) then
    if to_regproc('public.plans_group_is_pro') is not null then
      execute 'select public.plans_group_is_pro($1)' into pro using p_group;
      if not coalesce(pro, false) and to_regproc('public.studyboard_is_pro') is not null then execute 'select public.studyboard_is_pro($1)' into pro using me; end if;
      if not coalesce(pro, false) then raise exception 'Any colour is part of Studyboard Pro. Pick one of the colours shown.'; end if;
    end if;
  end if;
  -- Taken: the same colour, or one so close nobody could tell them apart
  if v is not null and exists (select 1 from public.group_members where group_id = p_group and user_id <> me and color is not null and public.sbg_color_near(color, v)) then
    raise exception 'Someone in this group already has that colour (or one very close to it). Pick another.';
  end if;
  update public.group_members set color = v where group_id = p_group and user_id = me;
  if not found then raise exception 'You''re not in that group'; end if;
  return v;
end $$;
revoke all on function public.set_member_color(uuid, text) from public, anon;
grant execute on function public.set_member_color(uuid, text) to authenticated;
notify pgrst, 'reload schema';

-- Every member's companion, shown as their picture in the group (instead of initials). Only the companion's id is kept (letters,
-- numbers and dashes), the app draws it. Written only through set_my_face, which sets it on all your groups at once; null clears it.
alter table public.group_members add column if not exists face text;
alter table public.group_members drop constraint if exists group_members_face_check;
alter table public.group_members add constraint group_members_face_check check (face is null or face ~ '^[a-z0-9-]{1,40}$');
revoke update (face) on public.group_members from authenticated;
create or replace function public.set_my_face(p_face text) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare me uuid := auth.uid(); v text := nullif(lower(btrim(coalesce(p_face, ''))), '');
begin
  if me is null then raise exception 'Sign in first'; end if;
  if v is not null and v !~ '^[a-z0-9-]{1,40}$' then raise exception 'That companion isn''t valid'; end if;
  update public.group_members set face = v where user_id = me and face is distinct from v;
end $$;
revoke all on function public.set_my_face(text) from public, anon;
grant execute on function public.set_my_face(text) to authenticated;
notify pgrst, 'reload schema';

-- Codes are 8 characters only (K7P4-QD9X). Groups and shared decks still holding an older 6 or 10 character code get a new 8
-- character one (their old code and links stop working; members already in a group stay in it). Safe to run again: nothing left to change.
do $$
declare r record; c text;
begin
  for r in select id from public.study_groups where invite_code !~ '^[A-Z0-9]{4}-[A-Z0-9]{4}$' loop
    loop c := public.sbg_new_code(); exit when not exists (select 1 from public.study_groups where invite_code = c); end loop;
    update public.study_groups set invite_code = c where id = r.id;
  end loop;
  for r in select code from public.shared_decks where code !~ '^[A-Z0-9]{4}-[A-Z0-9]{4}$' loop
    loop c := public.sbg_new_code(); exit when not exists (select 1 from public.shared_decks where code = c); end loop;
    update public.shared_decks set code = c where code = r.code;
  end loop;
end $$;

-- One colour per person in a group: someone else's colour can't be picked (set_member_color says so, and this index makes sure even
-- when two people pick at once). A colour two members already share stays with whoever joined first.
update public.group_members m set color = null
  where m.color is not null and exists (select 1 from public.group_members o where o.group_id = m.group_id and o.color = m.color and o.user_id <> m.user_id
    and (o.joined_at < m.joined_at or (o.joined_at = m.joined_at and o.user_id < m.user_id)));
create unique index if not exists group_members_one_color on public.group_members (group_id, color) where color is not null;

-- ---------- Removed from study groups (after a report) ----------
-- Acting on a report can take someone out of study groups and group projects altogether: every group they're in, and no joining,
-- making or restoring groups again. The rest of their Studyboard (planner, files, sync, Pro) is untouched. Only you can do this, in
-- the SQL Editor:
--   select public.studyboard_suspend_from_groups('someone@school.edu', 'harassment in a group');
--   select public.studyboard_unsuspend_from_groups('someone@school.edu');      -- let them use groups again
--   select u.email, s.reason, s.created_at from public.group_suspended s join auth.users u on u.id = s.user_id;   -- who is out
-- Groups they own pass to the member who has been in longest (or are deleted, restorable for 30 days, when nobody else is in them).
create table if not exists public.group_suspended (
  user_id uuid primary key references auth.users(id) on delete cascade,
  reason text not null default '' check (char_length(reason) <= 300),
  created_at timestamptz not null default now()
);
alter table public.group_suspended enable row level security;
revoke all on public.group_suspended from public, anon, authenticated;

create or replace function public.studyboard_suspend_from_groups(p_email text, p_reason text default '') returns text
language plpgsql security definer set search_path = public as $$
declare uid uuid; g record; heir uuid; n int := 0;
begin
  select id into uid from auth.users where lower(email) = lower(btrim(p_email));
  if uid is null then raise exception 'No account with that email'; end if;
  insert into public.group_suspended (user_id, reason) values (uid, left(coalesce(p_reason, ''), 300))
    on conflict (user_id) do update set reason = excluded.reason;
  for g in select id from public.study_groups where owner_id = uid and deleted_at is null loop
    heir := null;
    select m.user_id into heir from public.group_members m where m.group_id = g.id and m.user_id <> uid order by m.joined_at, m.user_id limit 1;
    if heir is null then update public.study_groups set deleted_at = now() where id = g.id;
    else
      update public.study_groups set owner_id = heir where id = g.id;
      update public.group_members set role = 'owner' where group_id = g.id and user_id = heir;
    end if;
  end loop;
  delete from public.group_members where user_id = uid;
  get diagnostics n = row_count;
  return 'Removed from ' || n || ' group(s). Their account and the rest of Studyboard are untouched.';
end $$;
create or replace function public.studyboard_unsuspend_from_groups(p_email text) returns text
language plpgsql security definer set search_path = public as $$
declare uid uuid;
begin
  select id into uid from auth.users where lower(email) = lower(btrim(p_email));
  if uid is null then raise exception 'No account with that email'; end if;
  delete from public.group_suspended where user_id = uid;
  return 'They can join and make study groups again (they need a new invite to get back into a group).';
end $$;
revoke all on function public.studyboard_suspend_from_groups(text, text), public.studyboard_unsuspend_from_groups(text) from public, anon, authenticated;

-- ---------- The group's colour ----------
-- The owner picks it (New Group / Edit Group). Each member sees the group in their own course's colour when they have a course with
-- the same code in their planner (that happens in the app, on their device only); everyone else sees this one.
alter table public.study_groups add column if not exists color text;
alter table public.study_groups drop constraint if exists study_groups_color_check;
alter table public.study_groups add constraint study_groups_color_check check (color is null or color ~ '^#[0-9A-F]{6}$');
grant update (color) on public.study_groups to authenticated;

-- ---------- Live whiteboards (Notes > Whiteboard > Share With a Study Group) ----------
-- A group board is a name and a log of changes. Every member keeps their own copy (a note on their own account) and replays the log:
-- each row is a batch of changes [{t: "s" stroke | "i" text or picture, id, v: the new value, or null for removed}]. Rows are only ever
-- added (nobody can edit or delete someone else's drawing on the server); a copy you delete is only yours.
create table if not exists public.group_boards (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.study_groups(id) on delete cascade,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,   -- kept for the group when its maker's account is deleted
  name text not null check (char_length(name) between 1 and 60),
  tpl text not null default 'blank' check (tpl in ('blank', 'grid', 'dots', 'lines', 'cornell', 'concept', 'week', 'kanban', 'venn', 'timeline')),
  deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists group_boards_group_idx on public.group_boards (group_id);
alter table public.group_boards enable row level security;
drop policy if exists "group board read" on public.group_boards;
create policy "group board read" on public.group_boards for select to authenticated using (public.sbg_is_member(group_id));
drop policy if exists "group board add" on public.group_boards;
create policy "group board add" on public.group_boards for insert to authenticated with check (created_by = auth.uid() and public.sbg_is_member(group_id));
-- whoever made it, or the group's owner, can rename it or take it off the group (members keep their copies)
drop policy if exists "group board change" on public.group_boards;
create policy "group board change" on public.group_boards for update to authenticated
  using (public.sbg_is_member(group_id) and (created_by = auth.uid() or public.sbg_is_owner(group_id)))
  with check (public.sbg_is_member(group_id) and (created_by = auth.uid() or public.sbg_is_owner(group_id)));
revoke delete, truncate, references, trigger on public.group_boards from authenticated;
revoke all on public.group_boards from anon;

create table if not exists public.group_board_ops (
  id bigint generated always as identity primary key,
  board_id uuid not null references public.group_boards(id) on delete cascade,
  group_id uuid not null references public.study_groups(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  ch jsonb not null check (jsonb_typeof(ch) = 'array' and jsonb_array_length(ch) between 1 and 200 and octet_length(ch::text) < 600000),
  tag text not null default '' check (char_length(tag) <= 40),   -- the sending device's session, so it can skip its own echoes
  created_at timestamptz not null default now()
);
alter table public.group_board_ops add column if not exists tag text not null default '';
create index if not exists group_board_ops_board_idx on public.group_board_ops (board_id, id);
alter table public.group_board_ops enable row level security;
drop policy if exists "group board ops read" on public.group_board_ops;
create policy "group board ops read" on public.group_board_ops for select to authenticated using (public.sbg_is_member(group_id));
drop policy if exists "group board ops add" on public.group_board_ops;
create policy "group board ops add" on public.group_board_ops for insert to authenticated with check (
  user_id = auth.uid() and public.sbg_is_member(group_id)
  and exists (select 1 from public.group_boards b where b.id = board_id and b.group_id = group_board_ops.group_id and not b.deleted));
revoke update, delete, truncate, references, trigger on public.group_board_ops from authenticated;
revoke all on public.group_board_ops from anon;

-- A group board's preview (a small picture for the group's Whiteboards tab), kept fresh by whoever is drawing on it, and who has it:
-- a member adds a shared board to their own Whiteboards from the group (group_board_people), and takes it off by deleting their copy.
alter table public.group_boards add column if not exists preview text check (preview is null or (char_length(preview) < 200000 and preview like 'data:image/%'));
alter table public.group_boards add column if not exists preview_at timestamptz;
create or replace function public.group_board_preview(p_board uuid, p_preview text) returns void
language plpgsql security definer set search_path = public as $$
declare g uuid;
begin
  select group_id into g from public.group_boards where id = p_board and not deleted;
  if g is null or not public.sbg_is_member(g) then raise exception 'That board isn''t in one of your groups.'; end if;
  if p_preview is null or char_length(p_preview) >= 200000 or p_preview not like 'data:image/%' then raise exception 'That preview can''t be used.'; end if;
  if to_regprocedure('public.studyboard_rate_hit(text,integer,integer)') is not null and not public.studyboard_rate_hit('wbpv:' || auth.uid()::text, 30, 60) then return; end if;
  update public.group_boards set preview = p_preview, preview_at = now() where id = p_board;
end $$;
revoke all on function public.group_board_preview(uuid, text) from public, anon;
grant execute on function public.group_board_preview(uuid, text) to authenticated;

create table if not exists public.group_board_people (
  board_id uuid not null references public.group_boards(id) on delete cascade,
  group_id uuid not null references public.study_groups(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (board_id, user_id)
);
create index if not exists group_board_people_group_idx on public.group_board_people (group_id);
alter table public.group_board_people enable row level security;
drop policy if exists "group board people read" on public.group_board_people;
create policy "group board people read" on public.group_board_people for select to authenticated using (public.sbg_is_member(group_id));
drop policy if exists "group board people add" on public.group_board_people;
create policy "group board people add" on public.group_board_people for insert to authenticated with check (
  user_id = auth.uid() and public.sbg_is_member(group_id)
  and exists (select 1 from public.group_boards b where b.id = board_id and b.group_id = group_board_people.group_id and not b.deleted));
drop policy if exists "group board people leave" on public.group_board_people;
create policy "group board people leave" on public.group_board_people for delete to authenticated using (user_id = auth.uid());
revoke update, truncate, references, trigger on public.group_board_people from authenticated;
revoke all on public.group_board_people from anon;

-- Limits: 40 boards per group, and changes come in batches (a few a second while drawing), so 900 rows a minute per person is plenty
create or replace function public.sbg_board_limits() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_table_name = 'group_boards' then
    if (select count(*) from public.group_boards where group_id = new.group_id and not deleted) >= 40 then raise exception 'A group can have 40 whiteboards. Take one off the group first.'; end if;
  else
    if to_regprocedure('public.studyboard_rate_hit(text,integer,integer)') is not null and not public.studyboard_rate_hit('wbop:' || auth.uid()::text, 900, 60) then
      raise exception 'Drawing too fast for the group board. Wait a moment.';
    end if;
    update public.group_boards set updated_at = now() where id = new.board_id;
  end if;
  return new;
end $$;
revoke all on function public.sbg_board_limits() from public, anon, authenticated;
drop trigger if exists sbg_board_limits on public.group_boards;
create trigger sbg_board_limits before insert on public.group_boards for each row execute function public.sbg_board_limits();
drop trigger if exists sbg_board_op_limits on public.group_board_ops;
create trigger sbg_board_op_limits before insert on public.group_board_ops for each row execute function public.sbg_board_limits();

do $$
declare t text;
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach t in array array['group_boards', 'group_board_ops', 'group_board_people'] loop
      if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
        execute format('alter publication supabase_realtime add table public.%I', t);
      end if;
    end loop;
  end if;
end $$;
notify pgrst, 'reload schema';
