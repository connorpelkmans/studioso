-- Studyboard: bug reports and feedback from the app
-- Run this once in Supabase: SQL Editor > New query > paste everything > Run.
-- It is safe to run again (it only creates what is missing and refreshes the rules).
--
-- What this sets up:
--  * bug_reports: one row per report sent from Settings > Report a Bug or Send Feedback.
--  * Anyone using the app can SEND a report (signed in or not), but nobody can READ, change or delete reports through the app.
--    Only you can read them: in the Supabase dashboard (Table Editor > bug_reports) or with the service role / SQL Editor.
--  * Size limits on every field, and a rate limit (per person and overall) so the table can't be flooded.

create table if not exists public.bug_reports (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  user_id       uuid,                                  -- who sent it, when signed in (filled in by the server)
  client_id     text,                                  -- random id of the device, used only for the rate limit
  category      text not null default 'bug',
  message       text not null,
  steps         text,
  contact_email text,                                  -- only present when the person ticked "You can email me"
  diagnostics   jsonb not null default '{}'::jsonb,    -- app version, browser, page, plan, recent error messages. No personal content.
  screenshot    text,                                  -- optional JPEG as a data: URL
  status        text not null default 'new'            -- for you: new, seen, fixed, wontfix
);

-- Limits (written so they can be re-run when you change them)
alter table public.bug_reports drop constraint if exists bug_reports_limits;
alter table public.bug_reports add constraint bug_reports_limits check (
  category in ('bug', 'idea', 'confusing', 'other')
  and char_length(message) between 5 and 4000
  and (steps is null or char_length(steps) <= 3000)
  and (contact_email is null or (char_length(contact_email) <= 254 and contact_email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'))
  and (client_id is null or char_length(client_id) <= 80)
  and (screenshot is null or (char_length(screenshot) <= 400000 and screenshot like 'data:image/%'))
  and pg_column_size(diagnostics) <= 12000
  and status in ('new', 'seen', 'fixed', 'wontfix')
);

create index if not exists bug_reports_created_idx on public.bug_reports (created_at desc);
create index if not exists bug_reports_client_idx  on public.bug_reports (client_id, created_at desc);

-- Row Level Security: insert only. There is deliberately no select, update or delete policy for anyone using the app.
alter table public.bug_reports enable row level security;
drop policy if exists "anyone can send a report" on public.bug_reports;
create policy "anyone can send a report" on public.bug_reports
  for insert to anon, authenticated
  with check (user_id is null or user_id = auth.uid());

revoke all on public.bug_reports from anon, authenticated;
grant insert (category, message, steps, contact_email, diagnostics, screenshot, client_id, user_id) on public.bug_reports to anon, authenticated;

-- Fills in the trusted fields and stops floods: 5 reports an hour per device or account, 200 an hour overall.
create or replace function public.bug_reports_guard() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  mine int;
  everyone int;
begin
  new.user_id := me;                       -- never trust the value sent by the app
  new.created_at := now();
  new.status := 'new';
  select count(*) into mine from public.bug_reports
    where created_at > now() - interval '1 hour'
      and ((me is not null and user_id = me) or (new.client_id is not null and client_id = new.client_id));
  if mine >= 5 then
    raise exception 'SB_RATE: too many reports, try again later' using errcode = 'P0001';
  end if;
  select count(*) into everyone from public.bug_reports where created_at > now() - interval '1 hour';
  if everyone >= 200 then
    raise exception 'SB_RATE: too many reports, try again later' using errcode = 'P0001';
  end if;
  return new;
end $$;

drop trigger if exists bug_reports_guard on public.bug_reports;
create trigger bug_reports_guard before insert on public.bug_reports
  for each row execute function public.bug_reports_guard();

-- A tidy view for you in the SQL Editor (screenshot left out so it is quick to scan). Not reachable from the app.
create or replace view public.bug_reports_inbox with (security_invoker = true) as
  select created_at, status, category, message, steps, contact_email,
         diagnostics ->> 'version' as version, diagnostics ->> 'tab' as tab, diagnostics ->> 'plan' as plan,
         diagnostics -> 'errors' as recent_errors, (screenshot is not null) as has_screenshot, id
  from public.bug_reports order by created_at desc;
revoke all on public.bug_reports_inbox from anon, authenticated;

-- To read your reports:   select * from public.bug_reports_inbox limit 50;
-- To see one screenshot:  select screenshot from public.bug_reports where id = '...';   (paste the value into a browser address bar)
-- To mark one handled:    update public.bug_reports set status = 'fixed' where id = '...';
