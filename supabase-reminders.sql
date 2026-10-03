-- Studyboard 1.11: Reminders on your phone, even when Studyboard is closed
-- Run this once in Supabase: SQL Editor > New query > paste everything > Run.
-- It is safe to run again (it only creates what is missing and refreshes the rules and the schedule).
--
-- BEFORE YOU RUN IT: paste your two values into the two lines marked PASTE just below.
--   * Project URL:     Project Settings > Data API (or the Connect button), like https://abcdefgh.supabase.co
--   * Publishable key: Project Settings > API Keys, starts with sb_publishable_ (older projects: the anon key)
-- Never paste the secret or service_role key here.
--
-- What this sets up:
--  * push_subscriptions: the phones and browsers you turned notifications on for.
--  * reminder_queue: your reminders for the next 14 days. Studyboard keeps it up to date whenever you use it.
--  * A schedule that runs every 5 minutes and asks the send-reminders Edge Function to send what's due.
-- Only your own account can read or change your rows. The two values are kept in Supabase Vault (encrypted).

do $$
declare
  project_url     text := 'PASTE_YOUR_PROJECT_URL_HERE';        -- <== PASTE your Project URL between the quotes
  publishable_key text := 'PASTE_YOUR_PUBLISHABLE_KEY_HERE';    -- <== PASTE your publishable (or anon) key between the quotes
  sid uuid;
begin
  project_url := regexp_replace(btrim(project_url), '/+$', '');
  publishable_key := btrim(publishable_key);
  if project_url like 'PASTE%' or publishable_key like 'PASTE%' or project_url = '' or publishable_key = '' then
    raise exception 'Paste your Project URL and publishable key into the two lines marked PASTE at the top, then click Run again.';
  end if;
  if project_url !~ '^https://[^/[:space:]]+$' then
    raise exception 'The Project URL should look like https://abcdefgh.supabase.co (no extra path at the end).';
  end if;
  if publishable_key like 'sb_secret_%' then
    raise exception 'That is the secret key. Use the publishable key (sb_publishable_...) instead.';
  end if;
  select id into sid from vault.secrets where name = 'studyboard_project_url';
  if sid is null then perform vault.create_secret(project_url, 'studyboard_project_url', 'Studyboard reminders: project URL');
  else perform vault.update_secret(sid, project_url); end if;
  sid := null;
  select id into sid from vault.secrets where name = 'studyboard_publishable_key';
  if sid is null then perform vault.create_secret(publishable_key, 'studyboard_publishable_key', 'Studyboard reminders: publishable key');
  else perform vault.update_secret(sid, publishable_key); end if;
end $$;

-- ---------- Extensions for the 5-minute schedule ----------
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

-- ---------- Your devices ----------
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  endpoint text not null check (char_length(endpoint) between 10 and 1000),
  p256dh text not null check (char_length(p256dh) <= 200),
  auth text not null check (char_length(auth) <= 100),
  device text not null default '' check (char_length(device) <= 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, endpoint)
);
alter table public.push_subscriptions enable row level security;
drop policy if exists "Own push subscriptions" on public.push_subscriptions;
create policy "Own push subscriptions" on public.push_subscriptions for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Push services always use https. This stops a made-up address (for example one pointing inside a network) from being stored,
-- so the send-reminders function only ever contacts real push services. (NOT VALID: old rows are left alone, new ones are checked.)
alter table public.push_subscriptions drop constraint if exists push_subscriptions_https;
alter table public.push_subscriptions add constraint push_subscriptions_https check (endpoint ~ '^https://[^/[:space:]]+(/|$)') not valid;

-- ---------- Your reminders ----------
-- id: made by Studyboard. "r:..." are worked out from your tasks and settings, "s:..." are snoozed ones.
-- tok: a random code that goes out with each notification, so its Snooze and Mark Done buttons work without signing in.
create table if not exists public.reminder_queue (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id text not null check (char_length(id) between 1 and 200),
  fire_at timestamptz not null,
  title text not null default '' check (char_length(title) <= 200),
  body text not null default '' check (char_length(body) <= 1000),
  url text not null default '' check (char_length(url) <= 500),
  task_id text not null default '' check (char_length(task_id) <= 200),
  tok text not null default gen_random_uuid()::text,
  sent_at timestamptz,
  tries int not null default 0,
  created_at timestamptz not null default now(),
  primary key (user_id, id)
);
create index if not exists reminder_queue_due on public.reminder_queue (fire_at) where sent_at is null;
create index if not exists reminder_queue_tok on public.reminder_queue (tok);
alter table public.reminder_queue enable row level security;
drop policy if exists "Own reminders" on public.reminder_queue;
create policy "Own reminders" on public.reminder_queue for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Studyboard sends its whole list for the next 14 days. Future reminders it no longer lists are removed,
-- new ones are added and changed ones are updated. Ones already sent, and snoozed ones, are left alone.
create or replace function public.studyboard_reminders_replace(items jsonb) returns integer
language plpgsql security invoker set search_path = public as $$
declare
  me uuid := auth.uid();
  n int;
begin
  if me is null then raise exception 'Sign in first'; end if;
  if items is null or jsonb_typeof(items) <> 'array' then raise exception 'items must be a list'; end if;
  if jsonb_array_length(items) > 1000 then raise exception 'Too many reminders at once'; end if;
  delete from reminder_queue q
   where q.user_id = me and q.sent_at is null and q.id like 'r:%' and q.fire_at > now()
     and not exists (select 1 from jsonb_array_elements(items) e where e->>'id' = q.id);
  insert into reminder_queue as q (user_id, id, fire_at, title, body, url, task_id)
  select distinct on (e->>'id') me, e->>'id', (e->>'fire_at')::timestamptz,
         left(coalesce(e->>'title', ''), 200), left(coalesce(e->>'body', ''), 1000),
         left(coalesce(e->>'url', ''), 500), left(coalesce(e->>'task_id', ''), 200)
    from jsonb_array_elements(items) e
   where (e->>'id' like 'r:%' or e->>'id' like 's:%') and char_length(e->>'id') <= 200 and e->>'fire_at' is not null
  on conflict (user_id, id) do update
    set fire_at = excluded.fire_at, title = excluded.title, body = excluded.body, url = excluded.url, task_id = excluded.task_id
    where q.sent_at is null;
  get diagnostics n = row_count;
  return n;
end $$;
revoke all on function public.studyboard_reminders_replace(jsonb) from public, anon;
grant execute on function public.studyboard_reminders_replace(jsonb) to authenticated;

-- ---------- Every 5 minutes: send what's due ----------
select cron.unschedule(jobid) from cron.job where jobname = 'studyboard-send-reminders';
select cron.schedule(
  'studyboard-send-reminders',
  '*/5 * * * *',
  $job$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'studyboard_project_url') || '/functions/v1/send-reminders',
    headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'apikey', (select decrypted_secret from vault.decrypted_secrets where name = 'studyboard_publishable_key'))
      || coalesce((select jsonb_build_object('Authorization', 'Bearer ' || decrypted_secret)
                     from vault.decrypted_secrets where name = 'studyboard_publishable_key' and decrypted_secret like 'eyJ%'), '{}'::jsonb),
    body := jsonb_build_object('action', 'send'),
    timeout_milliseconds := 30000
  ) as request_id;
  $job$
);
