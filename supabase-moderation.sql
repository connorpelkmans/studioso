-- Studyboard: safety tools for Study Groups (reporting and blocking)
-- Apple App Store guideline 1.2 (user-generated content) asks for: a way to report offensive content, a way to block abusive users,
-- and a published way to reach you. This file sets up the first two on the server.
--
-- Run this once in Supabase: SQL Editor > New query > paste everything > Run. Run supabase-groups.sql FIRST (this file builds on it).
-- It is safe to run again (it only creates what is missing and refreshes the rules).
--
-- What this sets up:
--  * group_reports: one row per report sent from a group (a message, a shared item or a member).
--      - Any signed-in MEMBER of the group can INSERT a report. Nobody can read, change or delete reports through the app
--        (not even the person who sent it). You read them in the Supabase dashboard (Table Editor > group_reports) or the SQL Editor.
--      - A copy of the reported text is stored with the report (excerpt), so you can still review it if the message is deleted.
--      - Limits: field sizes, no reporting yourself, the same thing is only recorded once a day per person, and at most 30 reports an hour.
--  * group_blocks: who each person has blocked. Private to the blocker. Messages and shared items from someone you blocked are
--    filtered out by the server (the app also hides them on the screen).
--
-- Reviewing reports (SQL Editor), newest first, with the person's name and group:
--   select r.created_at, r.status, r.reason, r.target_kind, r.excerpt, r.details,
--          g.name as group_name, p.display_name as reported_name, r.reported_user_id
--   from public.group_reports r
--   left join public.study_groups g on g.id = r.group_id
--   left join public.study_profiles p on p.user_id = r.reported_user_id
--   where r.status = 'new' order by r.created_at desc;
-- Acting on one (examples):
--   delete from public.group_messages where id = '<target_id>';                       -- remove a message
--   delete from public.group_items where id = '<target_id>';                          -- remove a shared item
--   delete from public.group_members where user_id = '<reported_user_id>' and group_id = '<group_id>';   -- remove from the group
--   update public.group_reports set status = 'actioned' where id = '<report id>';     -- then mark it done
-- To stop an account altogether: Supabase dashboard > Authentication > Users > the person > Ban user.
-- Apple expects you to act on reports within 24 hours, so check this table daily and say so in your App Review notes.

-- ---------- Reports ----------
create table if not exists public.group_reports (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz not null default now(),
  group_id         uuid references public.study_groups(id) on delete set null,
  reporter_id      uuid default auth.uid() references auth.users(id) on delete set null,   -- filled in by the server
  reported_user_id uuid references auth.users(id) on delete set null,
  target_kind      text not null,
  target_id        text not null,
  reason           text not null,
  details          text,
  excerpt          text,
  status           text not null default 'new'     -- for you: new, reviewing, actioned, dismissed
);

alter table public.group_reports drop constraint if exists group_reports_limits;
alter table public.group_reports add constraint group_reports_limits check (
  target_kind in ('message', 'item', 'member')
  and char_length(target_id) between 1 and 80
  and reason in ('harassment', 'hate', 'sexual', 'threat', 'spam', 'privacy', 'other')
  and (details is null or char_length(details) <= 500)
  and (excerpt is null or char_length(excerpt) <= 500)
  and status in ('new', 'reviewing', 'actioned', 'dismissed')
);
create index if not exists group_reports_status_idx on public.group_reports (status, created_at desc);
create index if not exists group_reports_reporter_idx on public.group_reports (reporter_id, created_at desc);

-- The server decides who the reporter is, refuses self-reports, records the same report only once a day, and limits floods.
create or replace function public.sbg_report_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.reporter_id := auth.uid();
  new.created_at := now();
  new.status := 'new';
  if new.reporter_id is null then raise exception 'Sign in first'; end if;
  if new.reported_user_id is not null and new.reported_user_id = new.reporter_id then raise exception 'You can''t report yourself'; end if;
  if (select count(*) from public.group_reports where reporter_id = new.reporter_id and created_at > now() - interval '1 hour') >= 30 then
    raise exception 'Too many reports. Try again later';
  end if;
  if exists (select 1 from public.group_reports where reporter_id = new.reporter_id and target_kind = new.target_kind and target_id = new.target_id
             and created_at > now() - interval '1 day') then
    return null;   -- already reported today: nothing more to store, and the person sees "sent"
  end if;
  return new;
end $$;
drop trigger if exists sbg_report_guard on public.group_reports;
create trigger sbg_report_guard before insert on public.group_reports for each row execute function public.sbg_report_guard();

alter table public.group_reports enable row level security;
drop policy if exists "report member insert" on public.group_reports;
create policy "report member insert" on public.group_reports for insert to authenticated
  with check (reporter_id = auth.uid() and group_id is not null and public.sbg_is_member(group_id));
-- No select, update or delete policy on purpose: reports can only be read by you, with the service role or in the dashboard.
revoke all on public.group_reports from anon, authenticated;
grant insert on public.group_reports to authenticated;

-- ---------- Blocks ----------
create table if not exists public.group_blocks (
  blocker_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  blocked_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint group_blocks_not_self check (blocker_id <> blocked_id)
);
alter table public.group_blocks enable row level security;
drop policy if exists "block own read" on public.group_blocks;
create policy "block own read" on public.group_blocks for select to authenticated using (blocker_id = auth.uid());
drop policy if exists "block own insert" on public.group_blocks;
create policy "block own insert" on public.group_blocks for insert to authenticated with check (blocker_id = auth.uid());
drop policy if exists "block own delete" on public.group_blocks;
create policy "block own delete" on public.group_blocks for delete to authenticated using (blocker_id = auth.uid());
revoke all on public.group_blocks from anon, authenticated;
grant select, insert, delete on public.group_blocks to authenticated;

-- ---------- Hide what blocked people post ----------
-- Same rules as supabase-groups.sql (members only), plus: not from someone you blocked. This is checked by the database, so it also
-- applies to the live updates, whatever app or script is asking.
drop policy if exists "message member read" on public.group_messages;
create policy "message member read" on public.group_messages for select to authenticated
  using (public.sbg_is_member(group_id)
         and not exists (select 1 from public.group_blocks b where b.blocker_id = auth.uid() and b.blocked_id = group_messages.user_id));
drop policy if exists "item member read" on public.group_items;
create policy "item member read" on public.group_items for select to authenticated
  using (public.sbg_is_member(group_id)
         and not exists (select 1 from public.group_blocks b where b.blocker_id = auth.uid() and b.blocked_id = group_items.user_id));
