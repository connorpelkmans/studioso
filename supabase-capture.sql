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
-- Free for everyone (not a Pro feature), except Email to Studyboard (below), which is part of Studyboard Pro.

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
alter table public.capture_inbox add column if not exists body text;        -- Email to Studyboard: the email's text (subject in "text")
alter table public.capture_inbox add column if not exists sender text;      -- Email to Studyboard: who sent it (an address only)
alter table public.capture_inbox drop constraint if exists capture_inbox_limits;
alter table public.capture_inbox add constraint capture_inbox_limits check (
  char_length(text) between 1 and 500
  and (body is null or char_length(body) <= 6000)
  and (sender is null or char_length(sender) <= 120)
  and (course_hint is null or char_length(course_hint) <= 60)
  and (due_text is null or char_length(due_text) <= 60)
  and (idem_key is null or char_length(idem_key) <= 80)
  and char_length(source) between 1 and 24
);
create index if not exists capture_inbox_user_open_idx on public.capture_inbox (user_id, created_at) where processed_at is null;
create index if not exists capture_inbox_token_idx on public.capture_inbox (token_id, created_at desc);
create index if not exists capture_inbox_user_created_idx on public.capture_inbox (user_id, created_at desc);
create index if not exists capture_inbox_idem_idx on public.capture_inbox (user_id, idem_key, created_at desc) where idem_key is not null;

-- Idempotency keys seen in the last 7 days (Siri, Shortcuts and the share sheet may resend the same capture much later, for
-- example after the phone was offline). One row per account and key; capture_purge removes rows older than 7 days.
create table if not exists public.capture_idem (
  user_id    uuid not null references auth.users(id) on delete cascade,
  idem_key   text not null check (char_length(idem_key) between 1 and 80),
  inbox_id   uuid,
  created_at timestamptz not null default now(),
  primary key (user_id, idem_key)
);
create index if not exists capture_idem_created_idx on public.capture_idem (created_at);

-- RLS on, no policies, no grants: the app can only use the functions below.
alter table public.capture_tokens enable row level security;
alter table public.capture_inbox enable row level security;
alter table public.capture_idem enable row level security;
revoke all on public.capture_idem from public, anon, authenticated;
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

-- Waiting captures for the signed-in person (oldest first). body and sender are only filled for Email to Studyboard.
-- (An older version returned fewer columns; a function's columns can't be changed in place, so it is dropped first.)
do $$ begin
  if exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname = 'capture_pull_inbox'
             and not pg_get_function_result(p.oid) like '%sender%') then
    drop function public.capture_pull_inbox(integer);
  end if;
end $$;
create or replace function public.capture_pull_inbox(p_limit integer default 50) returns table (
  id uuid, text text, due_date date, due_time time, due_text text, course_hint text, source text, created_at timestamptz, body text, sender text)
language sql stable security definer set search_path = pg_catalog, public as $$
  select i.id, i.text, i.due_date, i.due_time, i.due_text, i.course_hint, i.source, i.created_at, i.body, i.sender
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

  -- same request sent again within 7 days (Siri retries, a queued share sent again): answer with the first one, add nothing
  if idem is not null then
    select x.inbox_id into dup from public.capture_idem x
      where x.user_id = tk.user_id and x.idem_key = idem and x.created_at > now() - interval '7 days';
    if dup is null then   -- captures stored before capture_idem existed
      select i.id into dup from public.capture_inbox i
        where i.user_id = tk.user_id and i.idem_key = idem and i.created_at > now() - interval '7 days' order by i.created_at desc limit 1;
    end if;
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
  if idem is not null then
    insert into public.capture_idem (user_id, idem_key, inbox_id) values (tk.user_id, idem, new_id)
      on conflict (user_id, idem_key) do update set inbox_id = excluded.inbox_id, created_at = now();
  end if;
  update public.capture_tokens set last_used_at = now(), use_count = use_count + 1 where id = tk.id;
  return jsonb_build_object('ok', true, 'id', new_id, 'dup', false, 'limit_hour', 30, 'remaining_hour', 30 - h - 1);
end $$;

-- ---------- Email to Studyboard (Pro) ----------
-- Each person can have ONE forwarding address, <key>@<your inbound mail domain>. The key is 12 random letters and digits made here (about
-- 59 bits), so the address works like a capture token: whoever knows it can put an email in its owner's inbox, nothing more. Make a new
-- address (the old one stops working at once) or turn it off any time. The domain is set in the app (CAPTURE_EMAIL_DOMAIN in index.html)
-- and in Cloudflare Email Routing (cloudflare/email-capture/README.md).
--   forwarded email -> Cloudflare Email Routing -> the email-capture Worker (reads the MIME, keeps the subject and the text)
--   -> the capture-email Edge Function (a shared secret only the Worker has) -> capture_add_email() (service role) -> capture_inbox.
-- Rows are source 'email' with the subject in text, the text in body (6000 characters at most) and the sender's address. The app reads
-- each one (with the person's AI when it is set up, else with its own date reader) and ALWAYS shows what it found to check first.
-- Limits: 15 emails an hour and 60 a day per address, and the same per-person caps as other captures (300 a day, 200 waiting).
-- The same email delivered twice (same Message-ID) is added once.
create table if not exists public.capture_email (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  addr_key     text not null unique check (addr_key ~ '^[a-hj-km-np-z2-9]{12}$'),
  created_at   timestamptz not null default now(),
  last_used_at timestamptz,
  use_count    integer not null default 0 check (use_count >= 0)
);
alter table public.capture_email enable row level security;
revoke all on public.capture_email from public, anon, authenticated;

-- Pro, or no paywall yet (works whether or not supabase-plans.sql has been run)
create or replace function public.capture_email_allowed(p_uid uuid) returns boolean
language plpgsql stable security definer set search_path = pg_catalog, public as $$
declare pw boolean := false; pro boolean := true;
begin
  if to_regprocedure('public.studyboard_paywall()') is not null then execute 'select public.studyboard_paywall()' into pw; end if;
  if not coalesce(pw, false) then return true; end if;
  if to_regprocedure('public.studyboard_is_pro(uuid)') is not null then execute 'select public.studyboard_is_pro($1)' into pro using p_uid; end if;
  return coalesce(pro, false);
end $$;

-- The signed-in person's address key, or null
create or replace function public.capture_email_get() returns jsonb
language sql stable security definer set search_path = pg_catalog, public as $$
  select jsonb_build_object('key', e.addr_key, 'created_at', e.created_at, 'last_used_at', e.last_used_at, 'use_count', e.use_count)
  from public.capture_email e where e.user_id = auth.uid()
$$;

-- A new address (replacing the old one, which stops working). Pro only once the paywall is on.
create or replace function public.capture_email_new() returns jsonb
language plpgsql volatile security definer set search_path = pg_catalog, public, extensions as $$
declare
  me uuid := auth.uid();
  alpha constant text := 'abcdefghjkmnpqrstuvwxyz23456789';
  b bytea; k text; tries int := 0;
begin
  if me is null then raise exception 'SB_NOT_SIGNED_IN: Sign in first.' using errcode = '28000'; end if;
  if not public.capture_email_allowed(me) then raise exception 'SB_PRO_REQUIRED: Email to Studyboard is part of Studyboard Pro.' using errcode = '42501'; end if;
  loop
    b := extensions.gen_random_bytes(12); k := '';
    for i in 0..11 loop k := k || substr(alpha, (get_byte(b, i) % 31) + 1, 1); end loop;
    exit when not exists (select 1 from public.capture_email where addr_key = k);
    tries := tries + 1; if tries > 5 then raise exception 'SB_TRY_AGAIN' using errcode = '40001'; end if;
  end loop;
  insert into public.capture_email (user_id, addr_key) values (me, k)
    on conflict (user_id) do update set addr_key = excluded.addr_key, created_at = now(), last_used_at = null, use_count = 0;
  return jsonb_build_object('key', k, 'created_at', now(), 'last_used_at', null, 'use_count', 0);
end $$;

create or replace function public.capture_email_off() returns boolean
language plpgsql volatile security definer set search_path = pg_catalog, public as $$
declare n integer;
begin
  if auth.uid() is null then raise exception 'SB_NOT_SIGNED_IN: Sign in first.' using errcode = '28000'; end if;
  delete from public.capture_email where user_id = auth.uid();
  get diagnostics n = row_count;
  return n > 0;
end $$;

-- For the Edge Function only (service role). Returns {ok:true, id, dup} or {ok:false, error:'unknown'|'pro_required'|'rate_limited'|'inbox_full'|'bad_input'}.
-- 'unknown' covers addresses that never existed and ones that were replaced or turned off.
create or replace function public.capture_add_email(p_key text, p_from text, p_subject text, p_body text, p_msgid text default null) returns jsonb
language plpgsql volatile security definer set search_path = pg_catalog, public as $$
declare
  em public.capture_email%rowtype;
  subj text; body text; frm text; idem text; new_id uuid; dup uuid; h int; d int; ud int; open_n int;
  strip constant text := '[[:cntrl:]​-‏‪-‮⁦-⁩﻿]';
  keep_lines constant text := '[\x01-\x08\x0B\x0C\x0E-\x1F\x7F​-‏‪-‮⁦-⁩﻿]';
begin
  if p_key is null or p_key !~ '^[a-hj-km-np-z2-9]{12}$' then return jsonb_build_object('ok', false, 'error', 'unknown'); end if;
  select * into em from public.capture_email where addr_key = p_key for update;
  if not found then return jsonb_build_object('ok', false, 'error', 'unknown'); end if;
  if not public.capture_email_allowed(em.user_id) then return jsonb_build_object('ok', false, 'error', 'pro_required'); end if;

  subj := left(btrim(regexp_replace(regexp_replace(coalesce(p_subject, ''), strip, ' ', 'g'), '\s+', ' ', 'g')), 300);
  body := left(btrim(regexp_replace(regexp_replace(replace(coalesce(p_body, ''), E'\r', ''), keep_lines, ' ', 'g'), E'\n{3,}', E'\n\n', 'g')), 6000);
  frm := nullif(left(lower(btrim(regexp_replace(coalesce(p_from, ''), '[^A-Za-z0-9._%+@-]', '', 'g'))), 120), '');
  if subj = '' then subj := '(no subject)'; end if;
  if body = '' and subj = '(no subject)' then return jsonb_build_object('ok', false, 'error', 'bad_input'); end if;
  idem := nullif('mail:' || left(regexp_replace(coalesce(p_msgid, ''), '[^A-Za-z0-9._@$+=-]', '', 'g'), 70), 'mail:');

  if idem is not null then
    select x.inbox_id into dup from public.capture_idem x where x.user_id = em.user_id and x.idem_key = idem and x.created_at > now() - interval '7 days';
    if dup is not null then return jsonb_build_object('ok', true, 'id', dup, 'dup', true); end if;
  end if;
  select count(*) filter (where created_at > now() - interval '1 hour'), count(*) into h, d
    from public.capture_inbox where user_id = em.user_id and source = 'email' and created_at > now() - interval '1 day';
  select count(*) into ud from public.capture_inbox where user_id = em.user_id and created_at > now() - interval '1 day';
  if h >= 15 or d >= 60 or ud >= 300 then return jsonb_build_object('ok', false, 'error', 'rate_limited', 'retry_after', case when h >= 15 then 900 else 3600 end); end if;
  select count(*) into open_n from public.capture_inbox where user_id = em.user_id and processed_at is null;
  if open_n >= 200 then return jsonb_build_object('ok', false, 'error', 'inbox_full', 'retry_after', 3600); end if;

  insert into public.capture_inbox (user_id, text, body, sender, source, idem_key)
    values (em.user_id, subj, nullif(body, ''), frm, 'email', idem) returning id into new_id;
  if idem is not null then
    insert into public.capture_idem (user_id, idem_key, inbox_id) values (em.user_id, idem, new_id)
      on conflict (user_id, idem_key) do update set inbox_id = excluded.inbox_id, created_at = now();
  end if;
  update public.capture_email set last_used_at = now(), use_count = use_count + 1 where user_id = em.user_id;
  return jsonb_build_object('ok', true, 'id', new_id, 'dup', false);
end $$;

-- ---------- Clean-up ----------
-- Done captures are removed after 7 days, ones the app never picked up after 30 days, idempotency keys after 7 days,
-- old revoked tokens after 90 days.
create or replace function public.capture_purge() returns void
language sql volatile security definer set search_path = pg_catalog, public as $$
  delete from public.capture_inbox where (processed_at is not null and processed_at < now() - interval '7 days') or created_at < now() - interval '30 days';
  delete from public.capture_idem where created_at < now() - interval '7 days';
  delete from public.capture_tokens where revoked_at is not null and revoked_at < now() - interval '90 days';
$$;

-- ---------- Who may call what ----------
revoke all on function public.capture_create_token(text, boolean), public.capture_list_tokens(), public.capture_revoke_token(uuid), public.capture_set_allow_get(uuid, boolean),
  public.capture_pull_inbox(integer), public.capture_ack(uuid[]), public.capture_purge(),
  public.capture_add(text, text, date, time, text, text, text, text, text),
  public.capture_email_allowed(uuid), public.capture_email_get(), public.capture_email_new(), public.capture_email_off(),
  public.capture_add_email(text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.capture_create_token(text, boolean), public.capture_list_tokens(), public.capture_revoke_token(uuid), public.capture_set_allow_get(uuid, boolean),
  public.capture_pull_inbox(integer), public.capture_ack(uuid[]),
  public.capture_email_get(), public.capture_email_new(), public.capture_email_off() to authenticated;
do $$ begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant execute on function public.capture_add(text, text, date, time, text, text, text, text, text) to service_role;
    grant execute on function public.capture_add_email(text, text, text, text, text) to service_role;
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
