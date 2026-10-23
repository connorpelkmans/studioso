-- Studyboard: safety tools for Study Groups

-- Reports
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

-- The server decides who the reporter is, refuses self-reports
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
-- No select, update or delete policy on purpose
revoke all on public.group_reports from anon, authenticated;
grant insert on public.group_reports to authenticated;

-- Blocks
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

-- Hide what blocked people post
do $$
begin
  if to_regprocedure('public.sbg_block_policies()') is null then
    raise exception 'Your supabase-groups.sql is older than this file. Run the current supabase-groups.sql, then run this file again.';
  end if;
  perform public.sbg_block_policies();
end $$;

-- Retention: group reports don't stay forever
create or replace function public.group_reports_purge() returns void
language sql security definer set search_path = public as $$
  update public.group_reports set excerpt = null, details = null
    where status in ('actioned', 'dismissed') and created_at < now() - interval '90 days' and (excerpt is not null or details is not null);
  delete from public.group_reports where created_at < now() - interval '365 days';
$$;
revoke all on function public.group_reports_purge() from public, anon, authenticated;

do $$
begin
  begin
    create extension if not exists pg_cron;
  exception when others then
    raise notice 'pg_cron is not available, so old group reports are not removed on their own. Turn it on in Database > Extensions and run this file again, or run: select public.group_reports_purge();';
    return;
  end;
  perform cron.unschedule(jobid) from cron.job where jobname = 'studyboard-group-reports-purge';
  perform cron.schedule('studyboard-group-reports-purge', '41 3 * * *', 'select public.group_reports_purge();');
end $$;
