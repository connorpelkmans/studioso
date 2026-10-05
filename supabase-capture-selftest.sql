-- Studyboard voice capture: security self-test
-- Run this in Supabase: SQL Editor > New query > paste everything > Run. Run it AFTER supabase-capture.sql.
--
-- It plays an attacker with two throw-away accounts: read someone else's capture tokens or inbox, write into the inbox directly,
-- call the service-only capture_add(), make a 6th token, get a token hash back, use a revoked token, ignore the rate limits.
-- Every attempt must FAIL. If one works the test stops with  ERROR: EXPLOIT SUCCEEDED: <what worked>.
-- When all holds you see "ALL n CAPTURE CHECKS PASSED". Everything runs in one transaction that ends with ROLLBACK
-- (accounts and data disappear), so it is safe on your live project and safe to run again. If you stop it half way, run: rollback;

begin;

create table public.sbc_log (n serial, name text);
grant all on public.sbc_log to public;
grant usage on sequence public.sbc_log_n_seq to public;
create function public.sbc_try(q text) returns text language plpgsql as $f$
declare n bigint;
begin execute q; get diagnostics n = row_count; return 'ok:' || n; exception when others then return 'err:' || sqlstate; end $f$;
create function public.sbc_count(q text) returns bigint language plpgsql as $f$
declare n bigint;
begin execute 'select count(*) from (' || q || ') s' into n; return n; exception when others then return -1; end $f$;
create function public.sbc_blocked(r text, name text) returns void language plpgsql as $f$
begin
  if r like 'ok:%' and r <> 'ok:0' then raise exception 'EXPLOIT SUCCEEDED: %', name; end if;
  insert into public.sbc_log (name) values (name);
end $f$;
create function public.sbc_ok(cond boolean, name text) returns void language plpgsql as $f$
begin
  if cond is not true then raise exception 'EXPLOIT SUCCEEDED / CHECK FAILED: %', name; end if;
  insert into public.sbc_log (name) values (name);
end $f$;
grant execute on function public.sbc_try(text), public.sbc_count(text), public.sbc_blocked(text, text), public.sbc_ok(boolean, text) to public;

do $test$
declare
  ua uuid := gen_random_uuid();   -- the attacker
  ub uuid := gen_random_uuid();   -- the victim
  r text; n bigint; j jsonb; tokA text; tokA2 text; tokB text; idA uuid; idA2 uuid; idB uuid; hA text; hA2 text; hB text; i int; ids uuid[];
  hx text;
begin
  insert into auth.users (id, instance_id, aud, role, email, created_at, updated_at)
    values (ua, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'selftest-a-' || ua || '@example.invalid', now(), now()),
           (ub, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'selftest-b-' || ub || '@example.invalid', now(), now());

  -- ===== 0. Signed out =====
  perform set_config('request.jwt.claims', '', true); perform set_config('request.jwt.claim.sub', '', true);
  execute 'set local role anon';
  r := public.sbc_try('select public.capture_create_token(''x'')');
  execute 'reset role'; perform public.sbc_blocked(r, 'the public (anon) made a capture token');
  execute 'set local role anon';
  r := public.sbc_try('select * from public.capture_pull_inbox(10)');
  execute 'reset role'; perform public.sbc_blocked(r, 'the public (anon) pulled an inbox');
  execute 'set local role anon';
  r := public.sbc_try('select public.capture_add(repeat(''a'',64), ''hi'')');
  execute 'reset role'; perform public.sbc_blocked(r, 'the public (anon) called capture_add');
  execute 'set local role anon';
  n := public.sbc_count('select 1 from public.capture_tokens');
  execute 'reset role'; perform public.sbc_ok(n = -1, 'the public (anon) can read capture_tokens');
  execute 'set local role authenticated';   -- signed in role but no sub claim
  r := public.sbc_try('select public.capture_create_token(''x'')');
  execute 'reset role'; perform public.sbc_blocked(r, 'a token was made without a signed-in user id');

  -- ===== 1. Victim B makes a token and has a waiting capture =====
  perform set_config('request.jwt.claims', jsonb_build_object('sub', ub, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  j := public.capture_create_token('Victim Siri');
  execute 'reset role';
  tokB := j->>'token'; idB := (j->>'id')::uuid; hB := encode(sha256(convert_to(tokB, 'UTF8')), 'hex');
  perform public.sbc_ok(tokB like 'sbc_%' and length(tokB) >= 40, 'a token is long and random-looking');
  perform public.sbc_ok((select token_hash = hB from public.capture_tokens where id = idB), 'only the SHA-256 hash of the token is stored');
  perform public.sbc_ok(not exists (select 1 from public.capture_tokens where token_hash = tokB or token_hash like '%' || substr(tokB, 5, 20) || '%'), 'the plaintext token is not stored anywhere in the table');
  j := public.capture_add(hB, 'VICTIM SECRET TASK', null, null, null, 'siri');
  perform public.sbc_ok((j->>'ok')::boolean, 'a valid token adds to the inbox');

  -- ===== 2. Attacker A =====
  perform set_config('request.jwt.claims', jsonb_build_object('sub', ua, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  n := public.sbc_count('select 1 from public.capture_inbox');
  execute 'reset role'; perform public.sbc_ok(n = -1, 'a signed-in user can read the capture_inbox table directly (saw ' || n || ')'); execute 'set local role authenticated';
  n := public.sbc_count('select 1 from public.capture_tokens');
  execute 'reset role'; perform public.sbc_ok(n = -1, 'a signed-in user can read the capture_tokens table directly (saw ' || n || ')'); execute 'set local role authenticated';
  n := public.sbc_count('select token_hash from public.capture_tokens');
  execute 'reset role'; perform public.sbc_ok(n = -1, 'a signed-in user can read a token hash'); execute 'set local role authenticated';
  r := public.sbc_try(format('insert into public.capture_inbox (user_id, text) values (%L, ''pwned'')', ua));
  execute 'reset role'; perform public.sbc_blocked(r, 'a signed-in user inserted into their own inbox directly'); execute 'set local role authenticated';
  r := public.sbc_try(format('insert into public.capture_inbox (user_id, text) values (%L, ''pwned'')', ub));
  execute 'reset role'; perform public.sbc_blocked(r, 'a signed-in user inserted into someone else''s inbox'); execute 'set local role authenticated';
  r := public.sbc_try(format('insert into public.capture_tokens (user_id, token_hash, label) values (%L, repeat(''a'', 64), ''mine'')', ua));
  execute 'reset role'; perform public.sbc_blocked(r, 'a signed-in user inserted a token row with a hash they chose'); execute 'set local role authenticated';
  r := public.sbc_try('update public.capture_inbox set processed_at = now()');
  execute 'reset role'; perform public.sbc_blocked(r, 'a signed-in user updated inbox rows directly'); execute 'set local role authenticated';
  r := public.sbc_try('delete from public.capture_inbox');
  execute 'reset role'; perform public.sbc_blocked(r, 'a signed-in user deleted inbox rows'); execute 'set local role authenticated';
  r := public.sbc_try('update public.capture_tokens set revoked_at = null, scope = ''admin''');
  execute 'reset role'; perform public.sbc_blocked(r, 'a signed-in user edited token rows'); execute 'set local role authenticated';
  r := public.sbc_try('delete from public.capture_tokens');
  execute 'reset role'; perform public.sbc_blocked(r, 'a signed-in user deleted token rows'); execute 'set local role authenticated';
  r := public.sbc_try('truncate public.capture_inbox');
  execute 'reset role'; perform public.sbc_blocked(r, 'a signed-in user truncated the inbox'); execute 'set local role authenticated';

  r := public.sbc_try(format('select public.capture_add(%L, ''spam'')', hB));
  execute 'reset role'; perform public.sbc_blocked(r, 'a signed-in user called capture_add (service role only)'); execute 'set local role authenticated';
  r := public.sbc_try('select public.capture_purge()');
  execute 'reset role'; perform public.sbc_blocked(r, 'a signed-in user ran capture_purge'); execute 'set local role authenticated';

  -- A can't see B's stuff through the functions
  n := public.sbc_count('select 1 from public.capture_pull_inbox(100)');
  execute 'reset role'; perform public.sbc_ok(n = 0, 'A pulled someone else''s inbox (saw ' || n || ')'); execute 'set local role authenticated';
  n := public.sbc_count('select 1 from public.capture_list_tokens()');
  execute 'reset role'; perform public.sbc_ok(n = 0, 'A lists someone else''s tokens (saw ' || n || ')'); execute 'set local role authenticated';
  r := public.sbc_try(format('select public.capture_revoke_token(%L)', idB));
  execute 'reset role'; perform public.sbc_blocked(case when (select revoked_at is null from public.capture_tokens where id = idB) then 'ok:0' else 'ok:1' end, 'A revoked B''s token');
  execute 'set local role authenticated';
  execute 'reset role'; ids := array(select id from public.capture_inbox where user_id = ub); execute 'set local role authenticated';
  n := public.capture_ack(ids);
  execute 'reset role'; perform public.sbc_ok(n = 0 and (select processed_at is null from public.capture_inbox where user_id = ub limit 1), 'A acknowledged (hid) B''s capture');
  execute 'set local role authenticated';
  r := public.sbc_try(format('select public.capture_set_allow_get(%L, true)', idB));
  execute 'reset role'; perform public.sbc_ok(not (select allow_get from public.capture_tokens where id = idB), 'A turned on GET for B''s token');

  -- label handling and the 5 token cap
  execute 'set local role authenticated';
  r := public.sbc_try('select public.capture_create_token(''   '')');
  execute 'reset role'; perform public.sbc_blocked(r, 'an empty label was accepted'); execute 'set local role authenticated';
  j := public.capture_create_token(repeat('x', 100) || chr(7));
  perform public.sbc_ok(length(j->>'label') = 40, 'labels are cut to 40 characters');
  execute 'reset role'; execute 'set local role authenticated';
  j := public.capture_create_token('Pixel Gemini');
  tokA := j->>'token'; idA := (j->>'id')::uuid;
  for i in 1..3 loop perform public.capture_create_token('t' || i); end loop;
  execute 'reset role'; perform public.sbc_ok((select count(*) from public.capture_tokens where user_id = ua and revoked_at is null) = 5, '5 tokens can be active'); execute 'set local role authenticated';
  r := public.sbc_try('select public.capture_create_token(''sixth'')');
  execute 'reset role'; perform public.sbc_blocked(r, 'a 6th active token was created'); execute 'set local role authenticated';
  perform public.capture_revoke_token((select id from public.capture_list_tokens() where label = 't1'));
  j := public.capture_create_token('after revoke');
  tokA2 := j->>'token'; idA2 := (j->>'id')::uuid;
  perform public.sbc_ok(tokA2 is not null, 'revoking frees a slot');
  -- list shape: never the hash or the token
  perform public.sbc_ok(not exists (select 1 from jsonb_each_text(to_jsonb((select l from public.capture_list_tokens() l limit 1))) e where e.key ilike '%hash%' or e.value like 'sbc_%' or e.value like repeat('a', 20) || '%'), 'the token list never returns the hash or token');
  perform public.sbc_ok(not exists (select 1 from (select to_jsonb(l)::text t from public.capture_list_tokens() l) x where t ~ '[0-9a-f]{64}'), 'no 64-hex value appears in the token list');
  execute 'reset role';
  hA := encode(sha256(convert_to(tokA, 'UTF8')), 'hex'); hA2 := encode(sha256(convert_to(tokA2, 'UTF8')), 'hex');

  -- ===== 3. The service side (as the Edge Function would call it) =====
  j := public.capture_add(repeat('0', 64), 'hello');
  perform public.sbc_ok(j->>'error' = 'invalid_token', 'an unknown token is rejected');
  j := public.capture_add('not-a-hash', 'hello');
  perform public.sbc_ok(j->>'error' = 'invalid_token', 'a malformed hash is rejected');
  j := public.capture_add(null, 'hello');
  perform public.sbc_ok(j->>'error' = 'invalid_token', 'a null hash is rejected');
  j := public.capture_add(tokA, 'hello');
  perform public.sbc_ok(j->>'error' = 'invalid_token', 'sending the plaintext token where a hash goes is rejected');
  j := public.capture_add(upper(hA), 'hello');
  perform public.sbc_ok(j->>'error' = 'invalid_token', 'an upper-case hash is not accepted (exact match only)');
  j := public.capture_add(hA, 'Read chapter 4' || chr(7) || chr(27) || E'\n\t' || chr(8238) || 'evil' || chr(8203) || ' due soon', date '2026-10-09', time '17:00', 'Bio 101', 'Pixel Gemini!!', null, null);
  perform public.sbc_ok((j->>'ok')::boolean, 'a valid token adds');
  perform public.sbc_ok((select text = 'Read chapter 4 evil due soon' and due_date = date '2026-10-09' and due_time = time '17:00' and source = 'pixelgemini' and course_hint = 'Bio 101' and user_id = ua from public.capture_inbox where id = (j->>'id')::uuid),
                        'control and bidi characters are stripped and fields are cleaned (got: ' || (select text from public.capture_inbox where id = (j->>'id')::uuid) || ')');
  perform public.sbc_ok((select use_count = 1 and last_used_at is not null from public.capture_tokens where id = idA), 'use_count and last_used_at update');
  j := public.capture_add(hA, repeat('x', 501));
  perform public.sbc_ok(j->>'error' = 'bad_input', 'text over 500 characters is refused');
  j := public.capture_add(hA, ' ' || chr(7) || ' ');
  perform public.sbc_ok(j->>'error' = 'bad_input', 'empty text is refused');
  j := public.capture_add(hA, 'x', null, null, repeat('c', 61));
  perform public.sbc_ok(j->>'error' = 'bad_input', 'a course hint over 60 characters is refused');
  j := public.capture_add(hA, 'natural due', null, null, null, 'x', null, 'friday 5pm');
  perform public.sbc_ok((j->>'ok')::boolean and (select due_text = 'friday 5pm' and due_date is null from public.capture_inbox where id = (j->>'id')::uuid), 'natural-language due text is stored raw, not parsed');
  -- idempotency
  j := public.capture_add(hA, 'Retry me', null, null, null, 'siri', 'idem-1');
  perform public.sbc_ok((j->>'ok')::boolean and not (j->>'dup')::boolean, 'first call with an idempotency key adds');
  j := public.capture_add(hA, 'Retry me', null, null, null, 'siri', 'idem-1');
  perform public.sbc_ok((j->>'ok')::boolean and (j->>'dup')::boolean and (select count(*) from public.capture_inbox where idem_key = 'idem-1') = 1, 'the same idempotency key does not double-add');
  update public.capture_inbox set created_at = now() - interval '6 days' where idem_key = 'idem-1';
  update public.capture_idem set created_at = now() - interval '6 days' where idem_key = 'idem-1';
  j := public.capture_add(hA, 'Retry me', null, null, null, 'siri', 'idem-1');
  perform public.sbc_ok((j->>'dup')::boolean, 'the same idempotency key 6 days later still does not double-add');
  update public.capture_inbox set idem_key = null where idem_key = 'idem-1';   -- as if the capture itself had been synced and cleaned up
  j := public.capture_add(hA, 'Retry me', null, null, null, 'siri', 'idem-1');
  perform public.sbc_ok((j->>'dup')::boolean, 'the key is remembered on its own (capture_idem), not only through the stored capture');
  update public.capture_idem set created_at = now() - interval '8 days' where idem_key = 'idem-1';
  j := public.capture_add(hA, 'Retry me', null, null, null, 'siri', 'idem-1');
  perform public.sbc_ok(not (j->>'dup')::boolean, 'an idempotency key older than 7 days adds again');
  perform public.sbc_ok(not has_table_privilege('authenticated', 'public.capture_idem', 'select') and not has_table_privilege('anon', 'public.capture_idem', 'select'), 'the app can not read idempotency keys');
  -- GET flag
  j := public.capture_add(hA, 'via url', null, null, null, 'x', null, null, 'get');
  perform public.sbc_ok(j->>'error' = 'get_disabled', 'GET is refused unless the token allows it');
  update public.capture_tokens set allow_get = true where id = idA;
  j := public.capture_add(hA, 'via url', null, null, null, 'x', null, null, 'get');
  perform public.sbc_ok((j->>'ok')::boolean, 'GET works when the owner switched it on');
  update public.capture_tokens set allow_get = false where id = idA;
  -- ===== 4. Pull and acknowledge (as A) =====
  perform set_config('request.jwt.claims', jsonb_build_object('sub', ua, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  n := (select count(*) from public.capture_pull_inbox(100));
  perform public.sbc_ok(n >= 5 and not exists (select 1 from public.capture_pull_inbox(100) where text like 'VICTIM%'), 'the app pulls its own captures and never another person''s');
  ids := array(select id from public.capture_pull_inbox(2));
  perform public.sbc_ok(cardinality(ids) = 2 and (select count(*) from public.capture_pull_inbox(1)) = 1, 'pull honours the limit');
  perform public.sbc_ok(public.capture_ack(ids) = 2, 'ack marks them processed');
  perform public.sbc_ok(public.capture_ack(ids) = 0, 'ack is idempotent');
  perform public.sbc_ok(not exists (select 1 from public.capture_pull_inbox(100) p where p.id = any(ids)), 'processed rows are not pulled again');
  execute 'reset role';

  -- ===== 5. Revoked token =====
  perform set_config('request.jwt.claims', jsonb_build_object('sub', ua, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  perform public.sbc_ok(public.capture_revoke_token(idA2), 'owner can revoke');
  perform public.sbc_ok(not public.capture_revoke_token(idA2), 'revoking twice reports nothing changed');
  execute 'reset role';
  j := public.capture_add(hA2, 'after revoke');
  perform public.sbc_ok(j->>'error' = 'invalid_token' and j->>'error' is not distinct from (public.capture_add(repeat('0', 64), 'x'))->>'error', 'a revoked token is rejected with the same answer as an unknown one');

  -- ===== 6. Rate limits =====
  delete from public.capture_inbox where token_id = idA;
  for i in 1..30 loop j := public.capture_add(hA, 'rate ' || i); perform public.sbc_ok((j->>'ok')::boolean, 'rate fill ' || i); end loop;
  delete from public.sbc_log where name like 'rate fill %';
  j := public.capture_add(hA, 'rate 31');
  perform public.sbc_ok(j->>'error' = 'rate_limited' and (j->>'retry_after')::int > 0, 'the 31st capture in an hour is refused (30 per hour per token)');
  update public.capture_inbox set created_at = now() - interval '2 hours' where token_id = idA;
  j := public.capture_add(hA, 'after the hour');
  perform public.sbc_ok((j->>'ok')::boolean, 'the hourly limit resets');
  -- daily per token: 200 in the last day
  insert into public.capture_inbox (user_id, token_id, text, created_at, processed_at) select ua, idA, 'old ' || g, now() - interval '3 hours', now() from generate_series(1, 200) g;
  j := public.capture_add(hA, 'daily');
  perform public.sbc_ok(j->>'error' = 'rate_limited', '200 per day per token is enforced');
  -- daily per user: 300 across tokens
  delete from public.capture_inbox where user_id = ua;
  insert into public.capture_inbox (user_id, token_id, text, created_at, processed_at) select ua, idA, 'u' || g, now() - interval '3 hours', now() from generate_series(1, 150) g;
  insert into public.capture_inbox (user_id, token_id, text, created_at, processed_at) select ua, (select id from public.capture_tokens where user_id = ua and label = 't2'), 'v' || g, now() - interval '3 hours', now() from generate_series(1, 150) g;
  j := public.capture_add(hA, 'user daily');
  perform public.sbc_ok(j->>'error' = 'rate_limited', '300 per day per person across all tokens is enforced');
  -- inbox cap: 200 waiting, older than a day so the rate limits are not what stops it
  delete from public.capture_inbox where user_id = ua;
  insert into public.capture_inbox (user_id, token_id, text, created_at) select ua, idA, 'w' || g, now() - interval '2 days' from generate_series(1, 200) g;
  j := public.capture_add(hA, 'full');
  perform public.sbc_ok(j->>'error' = 'inbox_full', 'a full inbox (200 waiting) refuses more');
  perform public.sbc_ok((select count(*) from public.capture_inbox where user_id = ub) = 1, 'B''s inbox was never touched by A''s token');

  -- ===== 7. Clean-up and account deletion =====
  update public.capture_inbox set created_at = now() - interval '31 days' where user_id = ua;
  insert into public.capture_inbox (user_id, text, created_at, processed_at) values (ua, 'done long ago', now() - interval '8 days', now() - interval '8 days'), (ua, 'done recently', now(), now() - interval '1 day');
  perform public.capture_purge();
  perform public.sbc_ok((select count(*) from public.capture_inbox where user_id = ua) = 1 and exists (select 1 from public.capture_inbox where text = 'done recently'), 'purge removes processed > 7 days and unprocessed > 30 days only');
  perform set_config('request.jwt.claims', jsonb_build_object('sub', ub, 'role', 'authenticated')::text, true);
  update auth.users set last_sign_in_at = now() where id = ub;   -- the in-app delete needs a sign-in in the last 10 minutes
  perform public.studyboard_delete_my_account();
  perform public.sbc_ok(not exists (select 1 from public.capture_tokens where user_id = ub) and not exists (select 1 from public.capture_inbox where user_id = ub), 'deleting an account removes its capture tokens and inbox');

  select count(*) into n from public.sbc_log;
  raise notice 'ALL % CAPTURE CHECKS PASSED. Nothing was changed for real (the test ends with a rollback).', n;
end
$test$;

select n as "#", name as "attack tried or rule checked (every one held)" from public.sbc_log order by n;

rollback;
