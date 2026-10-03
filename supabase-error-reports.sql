-- Studyboard: anonymous crash and error reports (the optional "self-hosted" path; the main path is Sentry, see ERROR-REPORTING.md)
-- Run this once in Supabase: SQL Editor > New query > paste everything > Run. It is safe to run again.
-- Then deploy the Edge Function in supabase-functions/error-ingest (Verify JWT OFF) and set supabaseFallback: true in the page.
--
-- What this sets up:
--  * client_errors: one row per report. Reports hold no personal content (the app scrubs them before sending and the function checks them again).
--  * Row Level Security is ON and there are NO policies: the app (anon / signed-in users) can neither read nor write this table.
--    Only the error-ingest function (service role) inserts, and only you can read (Table Editor, SQL Editor or the summary view below).
--  * client_errors_allow(): the function's rate limit (per anonymous id, per network address hash, and overall).
--  * 30-day retention: a daily clean-up with pg_cron when it is available (Database > Extensions > pg_cron).

create table if not exists public.client_errors (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  event_id    text not null,
  occurred_at timestamptz,
  level       text not null default 'error',
  kind        text not null,                 -- error, promise, console, sw, flow-sync, flow-ai, flow-render, flow-storage-quota ...
  type        text not null,                 -- the error class, e.g. TypeError
  message     text not null,                 -- scrubbed and capped
  fingerprint text not null,                 -- same bug, same value
  release     text,
  build       text,                          -- app version + content hash: matches the exact shipped index.html
  environment text,
  platform    text,                          -- web, pwa, electron, ios-wrapper
  pro         boolean not null default false,
  theme       text,
  sw          text,
  anon_id     text,                          -- random per install, not the account id
  ip_hash     text,                          -- hash of the network address plus a daily salt, used only for the rate limit
  frames      jsonb not null default '[]'::jsonb,
  crumbs      jsonb not null default '[]'::jsonb,
  tags        jsonb not null default '{}'::jsonb
);

alter table public.client_errors drop constraint if exists client_errors_limits;
alter table public.client_errors add constraint client_errors_limits check (
  char_length(event_id) between 8 and 64 and char_length(kind) <= 60 and char_length(type) <= 60
  and char_length(message) <= 400 and char_length(fingerprint) <= 32
  and (anon_id is null or char_length(anon_id) <= 32) and (ip_hash is null or char_length(ip_hash) <= 64)
  and pg_column_size(frames) <= 8000 and pg_column_size(crumbs) <= 6000 and pg_column_size(tags) <= 2000
);
create unique index if not exists client_errors_event_idx on public.client_errors (event_id);
create index if not exists client_errors_created_idx on public.client_errors (created_at desc);
create index if not exists client_errors_fp_idx on public.client_errors (fingerprint, created_at desc);
create index if not exists client_errors_anon_idx on public.client_errors (anon_id, created_at desc);
create index if not exists client_errors_ip_idx on public.client_errors (ip_hash, created_at desc);

-- RLS on, no policies, no grants: the app cannot touch this table at all. The service role (the Edge Function) bypasses RLS.
alter table public.client_errors enable row level security;
revoke all on public.client_errors from anon, authenticated;

-- Rate limit used by the function: true when there is room for one more report from this id / address, and overall.
create or replace function public.client_errors_allow(p_anon text, p_ip text, p_anon_max int default 30, p_ip_max int default 60, p_all_max int default 2000)
returns boolean language plpgsql security definer set search_path = public as $$
declare a int; i int; t int;
begin
  select count(*) into a from public.client_errors where p_anon is not null and anon_id = p_anon and created_at > now() - interval '1 hour';
  if a >= p_anon_max then return false; end if;
  select count(*) into i from public.client_errors where p_ip is not null and ip_hash = p_ip and created_at > now() - interval '1 hour';
  if i >= p_ip_max then return false; end if;
  select count(*) into t from public.client_errors where created_at > now() - interval '1 hour';
  return t < p_all_max;
end $$;
revoke all on function public.client_errors_allow(text, text, int, int, int) from public, anon, authenticated;
grant execute on function public.client_errors_allow(text, text, int, int, int) to service_role;

-- For you: what is breaking, most frequent first (last 7 days). Not reachable from the app.
create or replace view public.client_errors_summary with (security_invoker = true) as
  select fingerprint, max(type) as type, max(message) as message, max(kind) as kind, count(*) as events, count(distinct anon_id) as installs,
         min(created_at) as first_seen, max(created_at) as last_seen,
         array_agg(distinct release) filter (where release is not null) as releases, array_agg(distinct platform) filter (where platform is not null) as platforms,
         max(build) as latest_build, (array_agg(frames order by created_at desc))[1] as latest_frames
  from public.client_errors where created_at > now() - interval '7 days'
  group by fingerprint order by count(*) desc, max(created_at) desc;
revoke all on public.client_errors_summary from anon, authenticated;

-- 30-day retention.
create or replace function public.client_errors_purge() returns void language sql security definer set search_path = public as $$
  delete from public.client_errors where created_at < now() - interval '30 days';
$$;
revoke all on function public.client_errors_purge() from public, anon, authenticated;
grant execute on function public.client_errors_purge() to service_role;

do $$
begin
  begin
    create extension if not exists pg_cron;
  exception when others then
    raise notice 'pg_cron is not available, so old reports are not removed on their own. Turn it on in Database > Extensions and run this file again, or run: select public.client_errors_purge();';
    return;
  end;
  perform cron.unschedule(jobid) from cron.job where jobname = 'studyboard-client-errors-purge';
  perform cron.schedule('studyboard-client-errors-purge', '23 3 * * *', 'select public.client_errors_purge();');
end $$;

-- To read:  select * from public.client_errors_summary limit 30;      select * from public.client_errors where fingerprint = '...' order by created_at desc limit 20;
-- To stop:  drop table public.client_errors cascade;  (and delete the function, or set supabaseFallback back to false in the page)
