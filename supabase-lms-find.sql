-- Studyboard: the school site addresses "Find your school" has found (supabase-functions/lms-find), remembered so each
-- school is looked up once a month. Run once in the Supabase SQL Editor after supabase-schools.sql; safe to run again.
-- Only the service role reaches it (row-level security on, no policies). Fix a wrong one by hand with:
--   update public.school_lms set host = 'learn.example.ca', checked_at = now() + interval '10 years' where school_key = '...' and lms = 'brightspace';
-- A high school's answer is kept for its whole district too, under 'd:' and the district (supabase-lms-districts.sql), e.g.
--   school_key = 'd:us:0616230' or 'd:on:B66052': fix that row to fix every school in the district.
create table if not exists public.school_lms (
  school_key text not null,
  lms text not null,
  host text not null default '',
  checked_at timestamptz not null default now(),
  primary key (school_key, lms)
);
-- (Moodle added later: widen the check on an existing table)
alter table public.school_lms drop constraint if exists school_lms_lms_check;
alter table public.school_lms add constraint school_lms_lms_check check (lms in ('brightspace', 'canvas', 'blackboard', 'moodle'));
alter table public.school_lms enable row level security;
revoke all on public.school_lms from anon, authenticated;
