-- Studyboard: voice and shortcut capture ("Hey Siri, add a task to Studyboard", Gemini on Pixel and Galaxy, Bixby, share sheet)
-- Run this once in Supabase: SQL Editor > New query > paste everything > Run. Run it AFTER supabase-setup.sql (and supabase-lean.sql).
-- It is safe to run again (it only creates what is missing and refreshes the functions).
--
-- How it works (full picture in VOICE-CAPTURE.md):
--   phone assistant / Shortcut  --HTTPS + capture token-->  Edge Function "capture-task"  --service role-->  capture_add()
--   capture_add() puts a row in capture_inbox.  The app pulls its own inbox (capture_pull_inbox), turns each row into a
--   normal task on the device (so sync, trash and plan limits all behave as usual) and then acknowledges it (capture_ack).
--   Nothing here ever writes into your "items" table.
--
-- Security model:
--   * A capture token is 32 random bytes made on the server. Only its SHA-256 hash is stored; the token is shown ONCE.
--   * A token can do exactly one thing: drop a short text into ITS OWNER'S inbox (scope "add_task"). It cannot read anything.
--   * Max 5 active tokens per person. Revoke any time. Rate limits: 30 per hour and 200 per day per token, 300 per day per person,
--     200 waiting captures per person.
--   * The two tables have Row Level Security on and NO grants for the app: everything goes through the functions below.
--   * capture_add() can only be called with the service role (the Edge Function). Signed-in users and the public cannot call it.
-- Free for everyone (not a Pro feature).

create extension if not exists pgcrypto with schema extensions;

-- ---------- Tokens ----------
create table if not exists public.capture_tokens (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  token_hash   text not null unique,                       -- hex SHA-256 of the token. The token itself is never stored.
  label        text not null,
  scope        text not null default 'add_task',
  allow_get    boolean not null default false,             -- lets this token be used in a URL (?token=). Off by default: URLs get logged.
  created_at   timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at   timestamptz,
  use_count    integer not null default 0
);
alter table public.capture_tokens add column if not exists allow_get boolean not null default false;
alter table public.capture_tokens drop constraint if exists capture_tokens_limits;
alter table public.capture_tokens add constraint capture_tokens_limits check (
  scope = 'add_task' and char_length(label) between 1 and 40 and token_hash ~ '^[0-9a-f]{64}$' and use_count >= 0
);
create index if not exists capture_tokens_user_idx on public.capture_tokens (user_id, created_at desc);

-- ---------- Inbox ----------
create table if not exists public.capture_inbox (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  token_id     uuid references public.capture_tokens(id) on delete cascade,
  text         text not null,
  due_date     date,                                       -- only when the sender gave an ISO date (2026-10-09)
  due_time     time,                                       -- only with an ISO time (17:00)
  due_text     text,                                       -- anything else the person said ("friday 5pm"); the app's own parser reads it
  course_hint  text,
  source       text not null default 'api',
  idem_key     text,
  created_at   timestamptz not null default now(),
  processed_at timestamptz
);
alter table public.capture_inbox add column if not exists due_text text;
alter table public.capture_inbox add column if not exists idem_key text;
alter table public.capture_inbox add column if not exists token_id uuid references public.capture_tokens(id) on delete cascade;
alter table public.capture_inbox drop constraint if exists capture_inbox_limits;
alter table public.capture_inbox add constraint capture_inbox_limits check (
  char_length(text) between 1 and 500
  and (course_hint is null or char_length(course_hint) <= 60)
  and (due_text is null or char_length(due_text) <= 60)
  and (idem_key is null or char_length(idem_key) <= 80)
  and char_length(source) between 1 and 24
);
create index if not exists capture_inbox_user_open_idx on public.capture_inbox (user_id, created_at) where processed_at is null;
create index if not exists capture_inbox_token_idx on public.capture_inbox (token_id, created_at desc);
create index if not exists capture_inbox_user_created_idx on public.capture_inbox (user_id, created_at desc);
create index if not exists capture_inbox_idem_idx on public.capture_inbox (user_id, idem_key, created_at desc) where idem_key is not null;

-- RLS on, no policies, no grants: the app can only use the functions below.
alter table public.capture_tokens enable row level security;
alter table public.capture_inbox enable row level security;
revoke all on public.capture_tokens, public.capture_inbox from public, anon, authenticated;

-- ---------- For the signed-in app ----------
-- Makes a token and returns it ONCE. Only the hash is kept.
drop function if exists public.capture_create_token(text);
create or replace function public.capture_create_token(p_label text, p_allow_get boolean default false) returns jsonb
language plpgsql volatile security definer set search_path = pg_catalog, public, extensions as $$
declare
  me uuid := auth.uid();
  lab text := left(btrim(regexp_replace(coalesce(p_label, ''), '[[:cntrl:]]', ' ', 'g')), 40);
  tok text;
  tid uuid;
begin
  if me is null then raise exception 'SB_NOT_SIGNED_IN: Sign in first.' using errcode = '28000'; end if;
  if lab = '' then raise exception 'SB_CAPTURE_LABEL: Give the shortcut a name.' using errcode = '22023'; end if;
  perform pg_advisory_xact_lock(hashtextextended('capture_tokens:' || me::text, 0));
  if (select count(*) from public.capture_tokens where user_id = me and revoked_at is null) >= 5 then
    raise exception 'SB_CAPTURE_LIMIT: You already have 5 active capture tokens. Revoke one first.' using errcode = '54000';
  end if;
  tok := 'sbc_' || translate(rtrim(encode(extensions.gen_random_bytes(32), 'base64'), '='), '+/' || chr(10), '-_');
  insert into public.capture_tokens (user_id, token_hash, label, allow_get)
    values (me, encode(sha256(convert_to(tok, 'UTF8')), 'hex'), lab, coalesce(p_allow_get, false))
    returning id into tid;
  return jsonb_build_object('id', tid, 'token', tok, 'label', lab, 'allow_get', coalesce(p_allow_get, false));
end $$;

create or replace function public.capture_list_tokens() returns table (
  id uuid, label text, scope text, allow_get boolean, created_at timestamptz, last_used_at timestamptz, revoked_at timestamptz, use_count integer)
language sql stable security definer set search_path = pg_catalog, public as $$
  select t.id, t.label, t.scope, t.allow_get, t.created_at, t.last_used_at, t.revoked_at, t.use_count
  from public.capture_tokens t
  where t.user_id = auth.uid() and (t.revoked_at is null or t.revoked_at > now() - interval '30 days')
  order by t.created_at desc
$$;

create or replace function public.capture_revoke_token(p_id uuid) returns boolean
language plpgsql volatile security definer set search_path = pg_catalog, public as $$
declare n integer;
begin
  if auth.uid() is null then raise exception 'SB_NOT_SIGNED_IN: Sign in first.' using errcode = '28000'; end if;
  update public.capture_tokens set revoked_at = now() where id = p_id and user_id = auth.uid() and revoked_at is null;
  get diagnostics n = row_count;
  return n > 0;
end $$;

create or replace function public.capture_set_allow_get(p_id uuid, p_allow boolean) returns boolean
language plpgsql volatile security definer set search_path = pg_catalog, public as $$
declare n integer;
begin
  if auth.uid() is null then raise exception 'SB_NOT_SIGNED_IN: Sign in first.' using errcode = '28000'; end if;
  update public.capture_tokens set allow_get = coalesce(p_allow, false) where id = p_id and user_id = auth.uid() and revoked_at is null;
  get diagnostics n = row_count;
  return n > 0;
end $$;

-- Waiting captures for the signed-in person (oldest first).
create or replace function public.capture_pull_inbox(p_limit integer default 50) returns table (
  id uuid, text text, due_date date, due_time time, due_text text, course_hint text, source text, created_at timestamptz)
language sql stable security definer set search_path = pg_catalog, public as $$
  select i.id, i.text, i.due_date, i.due_time, i.due_text, i.course_hint, i.source, i.created_at
  from public.capture_inbox i
  where i.user_id = auth.uid() and i.processed_at is null
  order by i.created_at, i.id
  limit greatest(1, least(coalesce(p_limit, 50), 200))
$$;

-- The app calls this AFTER the tasks are stored and saved on the device.
create or replace function public.capture_ack(p_ids uuid[]) returns integer
language plpgsql volatile security definer set search_path = pg_catalog, public as $$
declare n integer;
begin
  if auth.uid() is null then raise exception 'SB_NOT_SIGNED_IN: Sign in first.' using errcode = '28000'; end if;
  update public.capture_inbox set processed_at = now()
    where user_id = auth.uid() and processed_at is null and id = any (coalesce(p_ids, '{}'::uuid[]));
  get diagnostics n = row_count;
  return n;
end $$;

-- ---------- For the Edge Function only (service role) ----------
-- p_token_hash: hex SHA-256 of the token the caller sent. Returns jsonb:
--   {ok:true, id, dup, limit_hour, remaining_hour}   or   {ok:false, error:'invalid_token'|'rate_limited'|'inbox_full'|'bad_input'|'get_disabled', retry_after}
-- 'invalid_token' covers unknown AND revoked tokens, so callers can't tell which.
create or replace function public.capture_add(
  p_token_hash text, p_text text, p_due_date date default null, p_due_time time default null,
  p_course_hint text default null, p_source text default 'api', p_idem text default null, p_due_text text default null, p_via text default 'post'
) returns jsonb
language plpgsql volatile security definer set search_path = pg_catalog, public as $$
declare
  tk public.capture_tokens%rowtype;
  txt text; hint text; src text; dtx text; idem text; new_id uuid; dup uuid;
  h int; d int; ud int; open_n int;
  strip constant text := '[[:cntrl:]​-‏‪-‮⁦-⁩﻿]';
begin
  if p_token_hash is null or p_token_hash !~ '^[0-9a-f]{64}$' then return jsonb_build_object('ok', false, 'error', 'invalid_token'); end if;
  -- lock the token row so two parallel calls can't both slip under a limit
  select * into tk from public.capture_tokens where token_hash = p_token_hash for update;
  if not found or tk.revoked_at is not null or tk.scope <> 'add_task' then return jsonb_build_object('ok', false, 'error', 'invalid_token'); end if;
  if p_via = 'get' and not tk.allow_get then return jsonb_build_object('ok', false, 'error', 'get_disabled'); end if;

  txt := btrim(regexp_replace(regexp_replace(coalesce(p_text, ''), strip, ' ', 'g'), '\s+', ' ', 'g'));
  hint := nullif(btrim(regexp_replace(regexp_replace(coalesce(p_course_hint, ''), strip, ' ', 'g'), '\s+', ' ', 'g')), '');
  dtx := nullif(btrim(regexp_replace(regexp_replace(coalesce(p_due_text, ''), strip, ' ', 'g'), '\s+', ' ', 'g')), '');
  src := coalesce(nullif(lower(regexp_replace(coalesce(p_source, ''), '[^A-Za-z0-9_.-]', '', 'g')), ''), 'api');
  idem := nullif(left(regexp_replace(coalesce(p_idem, ''), strip, '', 'g'), 80), '');
  if txt = '' or char_length(txt) > 500 or char_length(coalesce(hint, '')) > 60 or char_length(coalesce(dtx, '')) > 60 then
    return jsonb_build_object('ok', false, 'error', 'bad_input');
  end if;
  src := left(src, 24);

  -- same request sent again within 10 minutes (Siri retries): answer with the first one, add nothing
  if idem is not null then
    select i.id into dup from public.capture_inbox i
      where i.user_id = tk.user_id and i.idem_key = idem and i.created_at > now() - interval '10 minutes' order by i.created_at desc limit 1;
    if dup is not null then return jsonb_build_object('ok', true, 'id', dup, 'dup', true, 'limit_hour', 30, 'remaining_hour', 0); end if;
  end if;

  select count(*) filter (where created_at > now() - interval '1 hour'), count(*) filter (where created_at > now() - interval '1 day')
    into h, d from public.capture_inbox where token_id = tk.id and created_at > now() - interval '1 day';
  select count(*) into ud from public.capture_inbox where user_id = tk.user_id and created_at > now() - interval '1 day';
  if h >= 30 then return jsonb_build_object('ok', false, 'error', 'rate_limited', 'retry_after', 600, 'limit_hour', 30, 'remaining_hour', 0); end if;
  if d >= 200 or ud >= 300 then return jsonb_build_object('ok', false, 'error', 'rate_limited', 'retry_after', 3600, 'limit_hour', 30, 'remaining_hour', 30 - h); end if;
  select count(*) into open_n from public.capture_inbox where user_id = tk.user_id and processed_at is null;
  if open_n >= 200 then return jsonb_build_object('ok', false, 'error', 'inbox_full', 'retry_after', 3600, 'limit_hour', 30, 'remaining_hour', 30 - h); end if;

  insert into public.capture_inbox (user_id, token_id, text, due_date, due_time, due_text, course_hint, source, idem_key)
    values (tk.user_id, tk.id, txt, p_due_date, case when p_due_date is null then null else p_due_time end, dtx, hint, src, idem)
    returning id into new_id;
  update public.capture_tokens set last_used_at = now(), use_count = use_count + 1 where id = tk.id;
  return jsonb_build_object('ok', true, 'id', new_id, 'dup', false, 'limit_hour', 30, 'remaining_hour', 30 - h - 1);
end $$;

-- ---------- Clean-up ----------
-- Done captures are removed after 7 days, ones the app never picked up after 30 days, old revoked tokens after 90 days.
create or replace function public.capture_purge() returns void
language sql volatile security definer set search_path = pg_catalog, public as $$
  delete from public.capture_inbox where (processed_at is not null and processed_at < now() - interval '7 days') or created_at < now() - interval '30 days';
  delete from public.capture_tokens where revoked_at is not null and revoked_at < now() - interval '90 days';
$$;

-- ---------- Who may call what ----------
revoke all on function public.capture_create_token(text, boolean), public.capture_list_tokens(), public.capture_revoke_token(uuid), public.capture_set_allow_get(uuid, boolean),
  public.capture_pull_inbox(integer), public.capture_ack(uuid[]), public.capture_purge(),
  public.capture_add(text, text, date, time, text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.capture_create_token(text, boolean), public.capture_list_tokens(), public.capture_revoke_token(uuid), public.capture_set_allow_get(uuid, boolean),
  public.capture_pull_inbox(integer), public.capture_ack(uuid[]) to authenticated;
do $$ begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant execute on function public.capture_add(text, text, date, time, text, text, text, text, text) to service_role;
  end if;
end $$;

-- Nightly clean-up at 4:29 UTC (needs pg_cron: Database > Extensions > pg_cron; without it, run select public.capture_purge(); now and then).
do $$ begin
  begin
    create extension if not exists pg_cron;
  exception when others then
    raise notice 'pg_cron is not available, so old captures are not cleaned up automatically. You can run: select public.capture_purge();';
  end;
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule(jobid) from cron.job where jobname = 'studyboard-capture-purge';
    perform cron.schedule('studyboard-capture-purge', '29 4 * * *', 'select public.capture_purge();');
  end if;
end $$;
