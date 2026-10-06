-- Studyboard: bug reports and feedback from the app
-- Run this once in Supabase: SQL Editor > New query > paste everything > Run.
-- It is safe to run again (it only creates what is missing and refreshes the rules).
--
-- What this sets up:
--  * bug_reports: one row per report sent from Settings > Report a Bug or Send Feedback.
--  * Anyone using the app can SEND a report (signed in or not), but nobody can READ, change or delete reports through the app.
--    Only you can read them: in the Supabase dashboard (Table Editor > bug_reports) or with the service role / SQL Editor.
--  * Size limits on every field, and rate limits so the table can't be flooded:
--      signed in:  5 reports an hour and 20 a day per account, screenshots up to about 220 KB, at most 10 screenshots a day;
--      signed out: no screenshot (it is dropped), shorter text, and only 30 signed-out reports an hour for everyone together
--                  (the device id a signed-out app sends is made up by the app, so it can't be the real limit).
--  * Retention: screenshots are removed after 30 days and reports after 180 days (a daily clean-up with pg_cron when it is available).

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
  and (screenshot is null or (char_length(screenshot) <= 300000 and screenshot like 'data:image/%'))
  and pg_column_size(diagnostics) <= 12000
  and status in ('new', 'seen', 'fixed', 'wontfix')
);

create index if not exists bug_reports_created_idx on public.bug_reports (created_at desc);
create index if not exists bug_reports_client_idx  on public.bug_reports (client_id, created_at desc);
create index if not exists bug_reports_user_idx    on public.bug_reports (user_id, created_at desc);

-- Row Level Security: insert only. There is deliberately no select, update or delete policy for anyone using the app.
alter table public.bug_reports enable row level security;
drop policy if exists "anyone can send a report" on public.bug_reports;
create policy "anyone can send a report" on public.bug_reports
  for insert to anon, authenticated
  with check (user_id is null or user_id = auth.uid());

revoke all on public.bug_reports from anon, authenticated;
grant insert (category, message, steps, contact_email, diagnostics, screenshot, client_id, user_id) on public.bug_reports to anon, authenticated;

-- Fills in the trusted fields and stops floods. Limits are keyed on things the app can't change: the signed-in account
-- (auth.uid()) or, for signed-out reports, everyone signed out together. client_id is only an extra, best-effort limit.
create or replace function public.bug_reports_guard() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  n int;
begin
  new.user_id := me;                       -- never trust the value sent by the app
  new.created_at := now();
  new.status := 'new';
  if me is null then
    -- Signed out: no screenshot (dropped, so the report itself still arrives), shorter text, smaller diagnostics.
    new.screenshot := null;
    new.message := left(new.message, 2000);
    new.steps := left(new.steps, 1000);
    if pg_column_size(new.diagnostics) > 4000 then
      new.diagnostics := jsonb_build_object('version', new.diagnostics -> 'version', 'build', new.diagnostics -> 'build', 'tab', new.diagnostics -> 'tab', 'trimmed', true);
    end if;
    select count(*) into n from public.bug_reports where user_id is null and created_at > now() - interval '1 hour';
    if n >= 30 then raise exception 'SB_RATE: too many reports, try again later' using errcode = 'P0001'; end if;
    if new.client_id is not null then
      select count(*) into n from public.bug_reports where user_id is null and client_id = new.client_id and created_at > now() - interval '1 hour';
      if n >= 3 then raise exception 'SB_RATE: too many reports, try again later' using errcode = 'P0001'; end if;
    end if;
  else
    select count(*) into n from public.bug_reports where user_id = me and created_at > now() - interval '1 hour';
    if n >= 5 then raise exception 'SB_RATE: too many reports, try again later' using errcode = 'P0001'; end if;
    select count(*) into n from public.bug_reports where user_id = me and created_at > now() - interval '1 day';
    if n >= 20 then raise exception 'SB_RATE: too many reports, try again later' using errcode = 'P0001'; end if;
    if new.screenshot is not null then
      if char_length(new.screenshot) > 300000 then new.screenshot := null; end if;   -- too big: keep the report, drop the picture
      select count(*) into n from public.bug_reports where user_id = me and screenshot is not null and created_at > now() - interval '1 day';
      if n >= 10 then new.screenshot := null; end if;
    end if;
  end if;
  select count(*) into n from public.bug_reports where created_at > now() - interval '1 hour';
  if n >= 200 then
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

-- ---------- Retention: screenshots go after 30 days, reports after 180 days ----------
create or replace function public.bug_reports_purge() returns void
language sql security definer set search_path = public as $$
  update public.bug_reports set screenshot = null where screenshot is not null and created_at < now() - interval '30 days';
  delete from public.bug_reports where created_at < now() - interval '180 days';
$$;
revoke all on function public.bug_reports_purge() from public, anon, authenticated;

do $$
begin
  begin
    create extension if not exists pg_cron;
  exception when others then
    raise notice 'pg_cron is not available, so old bug reports are not removed on their own. Turn it on in Database > Extensions and run this file again, or run: select public.bug_reports_purge();';
    return;
  end;
  perform cron.unschedule(jobid) from cron.job where jobname = 'studyboard-bug-reports-purge';
  perform cron.schedule('studyboard-bug-reports-purge', '37 3 * * *', 'select public.bug_reports_purge();');
end $$;

-- To read your reports:   select * from public.bug_reports_inbox limit 50;
-- To see one screenshot:  select screenshot from public.bug_reports where id = '...';   (paste the value into a browser address bar)
-- To mark one handled:    update public.bug_reports set status = 'fixed' where id = '...';
