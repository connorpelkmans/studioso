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
--  * A schedule that runs every 5 minutes and asks the send-reminders Edge Function to send what's due. It sends a random
--    schedule secret (made here, kept in Vault as studyboard_cron_secret) that the function checks, so nobody else can
--    make it send. Nothing to copy: the function asks the database (studyboard_reminders_cron_ok) whether the secret is right.
-- Only your own account can read your rows. Your devices can be added and removed by you (at most 10 per account, only real
-- push services); your reminder list is changed only through studyboard_reminders_replace. The values are kept in Supabase Vault (encrypted).

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
  -- The schedule secret: made once from secure random bytes (256 bits) and kept on later runs. To change it, delete the
  -- studyboard_cron_secret row in Vault and run this file again.
  if not exists (select 1 from vault.secrets where name = 'studyboard_cron_secret') then
    perform vault.create_secret(encode(uuid_send(gen_random_uuid()) || uuid_send(gen_random_uuid()) || uuid_send(gen_random_uuid()), 'hex'),
      'studyboard_cron_secret', 'Studyboard reminders: secret the 5-minute schedule sends to send-reminders');
  end if;
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
-- kind: 'webpush' (browsers and the Home Screen app), or the phone apps' own push: 'fcm' (Android, Firebase Cloud Messaging) and
-- 'apns' (iPhone and iPad). Native rows store "fcm:<token>" or "apns:<hex device token>" as endpoint and leave p256dh and auth empty.
-- apns_env says which Apple server the token belongs to (sandbox for development builds); empty means "try production, then sandbox".
alter table public.push_subscriptions add column if not exists kind text not null default 'webpush';
alter table public.push_subscriptions add column if not exists apns_env text;
alter table public.push_subscriptions drop constraint if exists push_subscriptions_kind;
alter table public.push_subscriptions add constraint push_subscriptions_kind check (kind in ('webpush', 'fcm', 'apns') and (apns_env is null or apns_env in ('sandbox', 'production')));
-- FCM tokens can be long, so the length limit from the table above (1000) is replaced by a looser one.
alter table public.push_subscriptions drop constraint if exists push_subscriptions_endpoint_check;
alter table public.push_subscriptions drop constraint if exists push_subscriptions_endpoint_len;
alter table public.push_subscriptions add constraint push_subscriptions_endpoint_len check (char_length(endpoint) between 10 and 4200);
alter table public.push_subscriptions drop constraint if exists push_subscriptions_native;
alter table public.push_subscriptions add constraint push_subscriptions_native check (
  kind = 'webpush'
  or (kind = 'fcm' and endpoint ~ '^fcm:[A-Za-z0-9_:.-]+$' and char_length(endpoint) between 24 and 4100)   -- 20 to 4096 token characters (Postgres caps {m,n} at 255)
  or (kind = 'apns' and endpoint ~ '^apns:[0-9a-fA-F]{64,200}$')) not valid;

alter table public.push_subscriptions drop constraint if exists push_subscriptions_https;
alter table public.push_subscriptions add constraint push_subscriptions_https check (kind <> 'webpush' or endpoint ~ '^https://[^/[:space:]]+(/|$)') not valid;

-- Web Push rows: only the real push services' addresses are accepted: Chrome, Edge and Android (fcm.googleapis.com), Firefox (*.push.services.mozilla.com),
-- Windows (*.notify.windows.com) and Safari and iPhone (web.push.apple.com, *.push.apple.com). No other host and no port, so the
-- send-reminders function can't be pointed anywhere else. The function checks the same list again before every send.
create or replace function public.studyboard_push_host_ok(p_endpoint text) returns boolean
language sql immutable set search_path = public as $$
  select coalesce(p_endpoint ~* '^https://(fcm\.googleapis\.com|updates\.push\.services\.mozilla\.com|([a-z0-9-]+\.)+push\.services\.mozilla\.com|([a-z0-9-]+\.)+notify\.windows\.com|web\.push\.apple\.com|([a-z0-9-]+\.)+push\.apple\.com)(/[^[:space:]]*)?$', false)
$$;
alter table public.push_subscriptions drop constraint if exists push_subscriptions_host;
alter table public.push_subscriptions add constraint push_subscriptions_host check (kind <> 'webpush' or public.studyboard_push_host_ok(endpoint)) not valid;

-- At most 10 devices per account (browsers and phone apps together). A new device beyond that replaces the one not refreshed for the longest time.
create or replace function public.studyboard_push_cap() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from public.push_subscriptions where user_id = new.user_id and endpoint = new.endpoint) then return new; end if;   -- an upsert of a known device
  delete from public.push_subscriptions where id in (
    select id from public.push_subscriptions where user_id = new.user_id order by updated_at desc, created_at desc offset 9);
  return new;
end $$;
revoke all on function public.studyboard_push_cap() from public, anon, authenticated;
drop trigger if exists push_subscriptions_cap on public.push_subscriptions;
create trigger push_subscriptions_cap before insert on public.push_subscriptions
  for each row execute function public.studyboard_push_cap();

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
-- The app can read its own reminders and mark them as shown (sent_at) and nothing else. Adding, changing and removing reminders
-- goes through studyboard_reminders_replace below, which only ever writes the caller's own rows with a fresh random tok.
drop policy if exists "Own reminders" on public.reminder_queue;
drop policy if exists "Own reminders read" on public.reminder_queue;
create policy "Own reminders read" on public.reminder_queue for select to authenticated
  using ((select auth.uid()) = user_id);
drop policy if exists "Own reminders mark shown" on public.reminder_queue;
create policy "Own reminders mark shown" on public.reminder_queue for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
revoke all on public.reminder_queue from anon, authenticated;
grant select on public.reminder_queue to authenticated;
grant update (sent_at) on public.reminder_queue to authenticated;

-- From the app, sent_at can only go from empty to now (marking a reminder as already shown), never back (which would send it again).
create or replace function public.studyboard_reminder_sent_guard() returns trigger
language plpgsql set search_path = public as $$
begin
  if current_user in ('anon', 'authenticated') then
    if old.sent_at is not null or new.sent_at is null then new.sent_at := old.sent_at;
    else new.sent_at := least(new.sent_at, now()); end if;
  end if;
  return new;
end $$;
drop trigger if exists reminder_queue_sent_guard on public.reminder_queue;
create trigger reminder_queue_sent_guard before update on public.reminder_queue
  for each row execute function public.studyboard_reminder_sent_guard();

-- Studyboard sends its whole list for the next 14 days. Future reminders it no longer lists are removed,
-- new ones are added and changed ones are updated. Ones already sent, and snoozed ones, are left alone.
-- (security definer because the app has no write access to reminder_queue itself; every row it touches is the caller's own.)
create or replace function public.studyboard_reminders_replace(items jsonb) returns integer
language plpgsql security definer set search_path = public as $$
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

-- Marks the caller's own reminders as shown (the app calls this after showing them itself, so they aren't pushed again).
create or replace function public.studyboard_reminders_mark_sent(ids text[]) returns integer
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); n int;
begin
  if me is null then raise exception 'Sign in first'; end if;
  if ids is null or cardinality(ids) = 0 then return 0; end if;
  if cardinality(ids) > 1000 then raise exception 'Too many reminders at once'; end if;
  update reminder_queue set sent_at = now() where user_id = me and id = any(ids) and sent_at is null;
  get diagnostics n = row_count;
  return n;
end $$;
revoke all on function public.studyboard_reminders_mark_sent(text[]) from public, anon;
grant execute on function public.studyboard_reminders_mark_sent(text[]) to authenticated;

-- send-reminders asks this (with the service role) whether the schedule secret it was sent is the right one.
create or replace function public.studyboard_reminders_cron_ok(p_secret text) returns boolean
language plpgsql stable security definer set search_path = public as $$
declare want text;
begin
  select decrypted_secret into want from vault.decrypted_secrets where name = 'studyboard_cron_secret';
  return want is not null and char_length(want) >= 32 and p_secret is not null and p_secret = want;
end $$;
revoke all on function public.studyboard_reminders_cron_ok(text) from public, anon, authenticated;
do $$ begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant execute on function public.studyboard_reminders_cron_ok(text) to service_role;
  end if;
end $$;

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
        'apikey', (select decrypted_secret from vault.decrypted_secrets where name = 'studyboard_publishable_key'),
        'x-studyboard-cron', (select decrypted_secret from vault.decrypted_secrets where name = 'studyboard_cron_secret'))
      || coalesce((select jsonb_build_object('Authorization', 'Bearer ' || decrypted_secret)
                     from vault.decrypted_secrets where name = 'studyboard_publishable_key' and decrypted_secret like 'eyJ%'), '{}'::jsonb),
    body := jsonb_build_object('action', 'send'),
    timeout_milliseconds := 30000
  ) as request_id;
  $job$
);
