-- Studyboard Pro: security self-test
-- Run this in Supabase: SQL Editor > New query > paste everything > Run. Run it AFTER supabase-plans.sql.
--
-- It plays an attacker. It creates two throw-away test accounts, then tries the things a cheater would try while signed in
-- as an ordinary account (or with only the public key): give themselves Pro, change a setting, read someone else's plan,
-- run the grant function, edit their usage totals, and so on. Every attempt must FAIL. If one works, the test stops with
--     ERROR: EXPLOIT SUCCEEDED: <what worked>
-- and you should NOT launch until that is fixed. When everything holds you see the notice "ALL n SECURITY CHECKS PASSED"
-- and a table listing every check.
--
-- It changes nothing for real: everything happens inside one transaction that ends with ROLLBACK (the test accounts, the
-- test data and the temporary paywall switch all disappear). It is safe to run on your live project, and safe to run again.
-- If you stop it half way, run: rollback;

begin;

create table public.sbt_log (n serial, name text);
grant all on public.sbt_log to public;
grant usage on sequence public.sbt_log_n_seq to public;

-- Runs one statement as whoever is current. Returns 'ok:<rows changed>' or 'err:<sqlstate>'.
create function public.sbt_try(q text) returns text language plpgsql as $f$
declare n bigint;
begin execute q; get diagnostics n = row_count; return 'ok:' || n; exception when others then return 'err:' || sqlstate; end $f$;
-- Counts the rows a query can see (-1 if it is refused outright).
create function public.sbt_count(q text) returns bigint language plpgsql as $f$
declare n bigint;
begin execute 'select count(*) from (' || q || ') s' into n; return n; exception when others then return -1; end $f$;
-- The attempt must have been refused, or changed nothing.
create function public.sbt_blocked(r text, name text) returns void language plpgsql as $f$
begin
  if r like 'ok:%' and r <> 'ok:0' then raise exception 'EXPLOIT SUCCEEDED: %', name; end if;
  insert into public.sbt_log (name) values (name);
end $f$;
create function public.sbt_ok(cond boolean, name text) returns void language plpgsql as $f$
begin
  if cond is not true then raise exception 'EXPLOIT SUCCEEDED / CHECK FAILED: %', name; end if;
  insert into public.sbt_log (name) values (name);
end $f$;
grant execute on function public.sbt_try(text), public.sbt_count(text), public.sbt_blocked(text, text), public.sbt_ok(boolean, text) to public;

do $test$
declare
  ua uuid := gen_random_uuid();   -- an ordinary free account (the "attacker")
  ub uuid := gen_random_uuid();   -- another account, with a gift from you
  r text; n bigint; f record; t text; msg text;
  tables text[] := array['studyboard_config', 'studyboard_entitlements', 'studyboard_devices', 'studyboard_usage', 'studyboard_billing_customers',
                         'studyboard_billing_events', 'studyboard_pro_grants', 'studyboard_plan_rate', 'studyboard_device_removals'];
  secret_tables text[] := array['studyboard_billing_customers', 'studyboard_billing_events', 'studyboard_pro_grants', 'studyboard_plan_rate', 'studyboard_device_removals'];
  allowed_fn text[] := array['studyboard_paywall', 'studyboard_start_trial'];
  gid uuid := gen_random_uuid();
begin
  -- ===== Set-up (as you, the owner) =====
  insert into auth.users (id, instance_id, aud, role, email, created_at, updated_at)
    values (ua, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'selftest-a-' || ua || '@example.invalid', now(), now()),
           (ub, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'selftest-b-' || ub || '@example.invalid', now(), now());
  insert into public.studyboard_entitlements (user_id) values (ua);
  perform public.studyboard_grant_pro_uid(ub, 365, 'selftest');
  insert into public.studyboard_usage (user_id, data_bytes, file_bytes) values (ub, 111, 222);
  insert into public.studyboard_devices (user_id, device_id, name) values (ub, 'selftest-device-b-1', 'B phone');
  insert into public.studyboard_billing_customers (user_id, stripe_customer_id) values (ub, 'cus_selftest_b');

  -- ===== 1. Signed in as account A: the entitlement row =====
  perform set_config('request.jwt.claims', jsonb_build_object('sub', ua, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  r := public.sbt_try(format('insert into public.studyboard_entitlements (user_id, plan) values (%L, ''pro'')', gen_random_uuid()));
  execute 'reset role'; perform public.sbt_blocked(r, 'a signed-in user inserted an entitlement row'); execute 'set local role authenticated';
  r := public.sbt_try(format('update public.studyboard_entitlements set plan = ''lifetime'' where user_id = %L', ua));
  execute 'reset role'; perform public.sbt_blocked(r, 'a signed-in user upgraded their own plan'); execute 'set local role authenticated';
  r := public.sbt_try(format('update public.studyboard_entitlements set pro_until = now() + interval ''100 years'', trial_until = now() + interval ''100 years'' where user_id = %L', ua));
  execute 'reset role'; perform public.sbt_blocked(r, 'a signed-in user extended their own pro_until / trial_until'); execute 'set local role authenticated';
  r := public.sbt_try(format('update public.studyboard_entitlements set grant_lifetime = true where user_id = %L', ua));
  execute 'reset role'; perform public.sbt_blocked(r, 'a signed-in user set their own grant_lifetime'); execute 'set local role authenticated';
  r := public.sbt_try(format('update public.studyboard_entitlements set plan = ''lifetime'' where user_id = %L', ub));
  execute 'reset role'; perform public.sbt_blocked(r, 'a signed-in user changed another person''s plan'); execute 'set local role authenticated';
  r := public.sbt_try(format('delete from public.studyboard_entitlements where user_id = %L', ub));
  execute 'reset role'; perform public.sbt_blocked(r, 'a signed-in user deleted another person''s entitlement'); execute 'set local role authenticated';
  r := public.sbt_try('delete from public.studyboard_entitlements');
  execute 'reset role'; perform public.sbt_blocked(r, 'a signed-in user deleted entitlement rows'); execute 'set local role authenticated';
  r := public.sbt_try('truncate public.studyboard_entitlements');
  execute 'reset role'; perform public.sbt_blocked(r, 'a signed-in user truncated the entitlements table');
  execute 'set local role authenticated';
  n := public.sbt_count('select 1 from public.studyboard_entitlements where user_id <> ' || quote_literal(ua));
  execute 'reset role'; perform public.sbt_ok(n = 0, 'a signed-in user can read someone else''s plan row (saw ' || n || ')'); execute 'set local role authenticated';
  n := public.sbt_count('select 1 from public.studyboard_entitlements where user_id = ' || quote_literal(ua));
  execute 'reset role'; perform public.sbt_ok(n = 1, 'a signed-in user can read their own plan row');
  perform public.sbt_ok((select plan = 'free' and pro_until is null and trial_until is null and not grant_lifetime and grant_until is null
                           from public.studyboard_entitlements where user_id = ua), 'account A is still free after every attempt');
  perform public.sbt_ok((select grant_until > now() + interval '300 days' from public.studyboard_entitlements where user_id = ub), 'account B''s grant is untouched');

  -- ===== 2. Signed in as account A: functions that must be owner-only =====
  execute 'set local role authenticated';
  r := public.sbt_try('select public.studyboard_grant_pro(''selftest-a-' || ua || '@example.invalid'', 365)');
  execute 'reset role'; perform public.sbt_blocked(r, 'a signed-in user ran studyboard_grant_pro (by email)'); execute 'set local role authenticated';
  r := public.sbt_try(format('select public.studyboard_grant_pro_uid(%L, null)', ua));
  execute 'reset role'; perform public.sbt_blocked(r, 'a signed-in user ran studyboard_grant_pro_uid'); execute 'set local role authenticated';
  r := public.sbt_try(format('select public.studyboard_revoke_pro_uid(%L)', ub));
  execute 'reset role'; perform public.sbt_blocked(r, 'a signed-in user ran studyboard_revoke_pro_uid'); execute 'set local role authenticated';
  r := public.sbt_try('select public.studyboard_revoke_pro(''x@example.com'')');
  execute 'reset role'; perform public.sbt_blocked(r, 'a signed-in user ran studyboard_revoke_pro'); execute 'set local role authenticated';
  r := public.sbt_try(format('select public.studyboard_apply_billing(jsonb_build_object(''event_id'',''evil1'',''family'',''stripe'',''source'',''stripe'',''state'',''active'',''uid_hint'',%L,''trust_hint'',true,''pro_until'',now() + interval ''10 years''))', ua));
  execute 'reset role'; perform public.sbt_blocked(r, 'a signed-in user ran studyboard_apply_billing'); execute 'set local role authenticated';
  r := public.sbt_try('select public.studyboard_plan_rate_hit(''x'', 1, 1)');
  execute 'reset role'; perform public.sbt_blocked(r, 'a signed-in user ran studyboard_plan_rate_hit'); execute 'set local role authenticated';
  r := public.sbt_try(format('select public.studyboard_is_pro(%L)', ub));
  execute 'reset role'; perform public.sbt_blocked(r, 'a signed-in user ran studyboard_is_pro for someone else'); execute 'set local role authenticated';
  r := public.sbt_try(format('select public.studyboard_limit(%L, ''devices'')', ub));
  execute 'reset role'; perform public.sbt_blocked(r, 'a signed-in user ran studyboard_limit for someone else'); execute 'set local role authenticated';
  r := public.sbt_try(format('select public.plans_add_usage(%L, -1000000000, -1000000000, -1000000000)', ua));
  execute 'reset role'; perform public.sbt_blocked(r, 'a signed-in user ran plans_add_usage'); execute 'set local role authenticated';
  r := public.sbt_try('select public.studyboard_prune_group_messages()');
  execute 'reset role'; perform public.sbt_blocked(r, 'a signed-in user ran the group message clean-up'); execute 'set local role authenticated';
  r := public.sbt_try('select public.studyboard_prune_billing()');
  execute 'reset role'; perform public.sbt_blocked(r, 'a signed-in user ran the billing clean-up');
  -- Even a forged "role: service_role" claim does nothing without the real database role.
  perform set_config('request.jwt.claims', jsonb_build_object('sub', ua, 'role', 'service_role')::text, true);
  execute 'set local role authenticated';
  r := public.sbt_try(format('select public.studyboard_grant_pro_uid(%L, null)', ua));
  execute 'reset role'; perform public.sbt_blocked(r, 'a forged service_role claim ran studyboard_grant_pro_uid');
  perform public.sbt_ok((select not grant_lifetime from public.studyboard_entitlements where user_id = ua), 'account A got no grant from any attempt');
  -- The owner checks inside the functions refuse clients even if the EXECUTE privilege were ever restored by mistake.
  perform set_config('request.jwt.claims', jsonb_build_object('sub', ua, 'role', 'authenticated')::text, true);
  r := public.sbt_try('select public.plans_deny_clients()');
  perform public.sbt_ok(r like 'err:%', 'the in-function guard refuses an authenticated sign-in');
  perform set_config('request.jwt.claims', jsonb_build_object('role', 'service_role')::text, true);
  r := public.sbt_try('select public.plans_deny_clients()');
  perform public.sbt_ok(r like 'ok:%', 'the in-function guard lets the service role through');
  perform set_config('request.jwt.claims', '', true);
  r := public.sbt_try('select public.plans_deny_clients()');
  perform public.sbt_ok(r like 'ok:%', 'the in-function guard lets the SQL Editor through');

  -- ===== 3. Settings (studyboard_config) =====
  perform set_config('request.jwt.claims', jsonb_build_object('sub', ua, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  r := public.sbt_try('update public.studyboard_config set value = ''true'' where key = ''paywall''');
  execute 'reset role'; perform public.sbt_blocked(r, 'a signed-in user updated studyboard_config'); execute 'set local role authenticated';
  r := public.sbt_try('insert into public.studyboard_config (key, value) values (''evil'', ''1'')');
  execute 'reset role'; perform public.sbt_blocked(r, 'a signed-in user inserted into studyboard_config'); execute 'set local role authenticated';
  r := public.sbt_try('delete from public.studyboard_config');
  execute 'reset role'; perform public.sbt_blocked(r, 'a signed-in user deleted from studyboard_config'); execute 'set local role anon';
  r := public.sbt_try('update public.studyboard_config set value = ''"https://evil.example"'' where key = ''site_url''');
  execute 'reset role'; perform public.sbt_blocked(r, 'the anon key updated studyboard_config'); execute 'set local role anon';
  r := public.sbt_try('insert into public.studyboard_config (key, value) values (''evil'', ''1'')');
  execute 'reset role'; perform public.sbt_blocked(r, 'the anon key inserted into studyboard_config');
  perform public.sbt_ok(not exists (select 1 from public.studyboard_config where key ~* '(secret|private|password|service_role|signing)'
                                     or value::text ~ '(sk_live|sk_test|rk_live|rk_test|whsec_|PRIVATE KEY|eyJhbGci)'),
                         'studyboard_config holds nothing that looks like a secret');
  r := public.sbt_try('insert into public.studyboard_config (key, value) values (''stripe_secret_key'', ''"x"'')');
  perform public.sbt_ok(r like 'err:%', 'even the owner can''t store a secret-looking key in the public config table');
  r := public.sbt_try('insert into public.studyboard_config (key, value) values (''oops'', ''"sk_live_123"'')');
  perform public.sbt_ok(r like 'err:%', 'even the owner can''t store a secret-looking value in the public config table');
  execute 'set local role anon';
  n := public.sbt_count('select 1 from public.studyboard_config');
  execute 'reset role'; perform public.sbt_ok(n > 0, 'the app can still read the settings (prices and limits)');

  -- ===== 4. Usage, devices and the server-only tables =====
  perform set_config('request.jwt.claims', jsonb_build_object('sub', ua, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  r := public.sbt_try(format('insert into public.studyboard_usage (user_id, data_bytes) values (%L, 0) on conflict (user_id) do update set data_bytes = 0', ua));
  execute 'reset role'; perform public.sbt_blocked(r, 'a signed-in user wrote their own usage row'); execute 'set local role authenticated';
  r := public.sbt_try(format('update public.studyboard_usage set data_bytes = 0, file_bytes = 0, backup_bytes = 0 where user_id = %L', ub));
  execute 'reset role'; perform public.sbt_blocked(r, 'a signed-in user reset another person''s usage'); execute 'set local role authenticated';
  r := public.sbt_try('delete from public.studyboard_usage');
  execute 'reset role'; perform public.sbt_blocked(r, 'a signed-in user deleted usage rows');
  perform public.sbt_ok((select data_bytes = 111 and file_bytes = 222 from public.studyboard_usage where user_id = ub), 'usage totals are unchanged by every attempt');
  execute 'set local role authenticated';
  n := public.sbt_count('select 1 from public.studyboard_usage where user_id <> ' || quote_literal(ua));
  execute 'reset role'; perform public.sbt_ok(n = 0, 'a signed-in user can read another person''s usage');
  execute 'set local role authenticated';
  r := public.sbt_try(format('insert into public.studyboard_devices (user_id, device_id, name) values (%L, ''selftest-evil-device'', ''x'')', ub));
  execute 'reset role'; perform public.sbt_blocked(r, 'a signed-in user added a device to another account'); execute 'set local role authenticated';
  r := public.sbt_try(format('update public.studyboard_devices set name = ''hacked'' where user_id = %L', ub));
  execute 'reset role'; perform public.sbt_blocked(r, 'a signed-in user renamed another account''s device'); execute 'set local role authenticated';
  r := public.sbt_try(format('update public.studyboard_devices set user_id = %L where user_id = %L', ua, ub));
  execute 'reset role'; perform public.sbt_blocked(r, 'a signed-in user took over another account''s device row'); execute 'set local role authenticated';
  r := public.sbt_try(format('delete from public.studyboard_devices where user_id = %L', ub));
  execute 'reset role'; perform public.sbt_blocked(r, 'a signed-in user deleted another account''s device');
  perform public.sbt_ok((select count(*) = 1 from public.studyboard_devices where user_id = ub), 'account B''s device row is intact');
  execute 'set local role authenticated';
  n := public.sbt_count('select 1 from public.studyboard_devices where user_id <> ' || quote_literal(ua));
  execute 'reset role'; perform public.sbt_ok(n = 0, 'a signed-in user can read another account''s devices');
  foreach t in array secret_tables loop
    execute 'set local role authenticated';
    r := public.sbt_try(format('select * from public.%I', t));
    execute 'reset role'; perform public.sbt_ok(r like 'err:%', 'a signed-in user can read ' || t); execute 'set local role authenticated';
    r := public.sbt_try(format('delete from public.%I', t));
    execute 'reset role'; perform public.sbt_blocked(r, 'a signed-in user deleted from ' || t); execute 'set local role anon';
    r := public.sbt_try(format('select * from public.%I', t));
    execute 'reset role'; perform public.sbt_ok(r like 'err:%', 'the anon key can read ' || t);
  end loop;
  execute 'set local role authenticated';
  r := public.sbt_try(format('insert into public.studyboard_pro_grants (user_id, action, forever) values (%L, ''grant'', true)', ua));
  execute 'reset role'; perform public.sbt_blocked(r, 'a signed-in user wrote the grants log');
  execute 'set local role authenticated';
  r := public.sbt_try(format('insert into public.studyboard_billing_customers (user_id, stripe_customer_id) values (%L, ''cus_evil'')', ua));
  execute 'reset role'; perform public.sbt_blocked(r, 'a signed-in user linked a Stripe customer to themselves');

  -- ===== 5. The public key alone (not signed in) =====
  execute 'set local role anon';
  r := public.sbt_try('select * from public.studyboard_entitlements');
  execute 'reset role'; perform public.sbt_ok(r like 'err:%' or r = 'ok:0', 'the anon key can read entitlements'); execute 'set local role anon';
  r := public.sbt_try(format('insert into public.studyboard_entitlements (user_id, plan) values (%L, ''pro'')', ua));
  execute 'reset role'; perform public.sbt_blocked(r, 'the anon key inserted an entitlement'); execute 'set local role anon';
  r := public.sbt_try(format('update public.studyboard_entitlements set plan = ''pro'' where user_id = %L', ua));
  execute 'reset role'; perform public.sbt_blocked(r, 'the anon key updated an entitlement'); execute 'set local role anon';
  r := public.sbt_try('select public.studyboard_start_trial()');
  execute 'reset role'; perform public.sbt_blocked(r, 'the anon key started a trial'); execute 'set local role anon';
  r := public.sbt_try(format('select public.studyboard_grant_pro_uid(%L, null)', ua));
  execute 'reset role'; perform public.sbt_blocked(r, 'the anon key ran studyboard_grant_pro_uid'); execute 'set local role anon';
  r := public.sbt_try('select public.studyboard_paywall()');
  execute 'reset role'; perform public.sbt_ok(r like 'ok:%', 'the app can still ask whether the paywall is on');

  -- ===== 6. Table privileges, function privileges, views, realtime =====
  foreach t in array tables loop
    perform public.sbt_ok(not has_table_privilege('anon', 'public.' || t, 'insert,update,delete,truncate'), 'anon has write privileges on ' || t);
    perform public.sbt_ok(not has_table_privilege('authenticated', 'public.' || t, 'insert,update,delete,truncate'), 'signed-in users have write privileges on ' || t)
      from (select 1) x where t <> 'studyboard_devices';
    perform public.sbt_ok((select relrowsecurity from pg_class where oid = ('public.' || t)::regclass), 'row level security is off on ' || t);
  end loop;
  perform public.sbt_ok(not has_table_privilege('authenticated', 'public.studyboard_devices', 'truncate'), 'signed-in users can truncate studyboard_devices');
  foreach t in array secret_tables loop
    perform public.sbt_ok(not has_table_privilege('authenticated', 'public.' || t, 'select'), 'signed-in users can select ' || t);
    perform public.sbt_ok(not exists (select 1 from pg_policy where polrelid = ('public.' || t)::regclass), t || ' has a policy (it should have none: service only)');
  end loop;
  perform public.sbt_ok(not exists (select 1 from pg_policy where polrelid = 'public.studyboard_entitlements'::regclass and polcmd <> 'r'),
                         'studyboard_entitlements has a policy that allows writes');
  perform public.sbt_ok(not exists (select 1 from pg_policy where polrelid = 'public.studyboard_usage'::regclass and polcmd <> 'r'), 'studyboard_usage has a policy that allows writes');
  perform public.sbt_ok(not exists (select 1 from pg_policy where polrelid = 'public.studyboard_config'::regclass and polcmd <> 'r'), 'studyboard_config has a policy that allows writes');
  -- Every function this setup defines (every overload) is closed to PUBLIC, anon and signed-in people, except the two the app calls.
  for f in
    select p.oid, p.proname, p.oid::regprocedure as sig, p.prosecdef, p.proconfig, p.proacl, p.proowner
    from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
    where ns.nspname = 'public'
      and (p.proname like 'plans\_%' or p.proname in ('studyboard_is_pro', 'studyboard_limit', 'studyboard_prune_group_messages', 'studyboard_prune_billing', 'studyboard_prune_backups',
           'studyboard_apply_billing', 'studyboard_plan_rate_hit', 'studyboard_grant_pro', 'studyboard_grant_pro_uid', 'studyboard_revoke_pro', 'studyboard_revoke_pro_uid',
           'studyboard_paywall', 'studyboard_start_trial'))
  loop
    if not (f.proname = any (allowed_fn)) then
      perform public.sbt_ok(not has_function_privilege('anon', f.oid, 'execute'), 'anon can execute ' || f.sig::text);
      perform public.sbt_ok(not has_function_privilege('authenticated', f.oid, 'execute'), 'signed-in users can execute ' || f.sig::text);
      perform public.sbt_ok(not exists (select 1 from aclexplode(coalesce(f.proacl, acldefault('f', f.proowner))) a where a.grantee = 0 and a.privilege_type = 'EXECUTE'),
                             'PUBLIC can execute ' || f.sig::text);
    end if;
    if f.prosecdef then
      perform public.sbt_ok(exists (select 1 from unnest(coalesce(f.proconfig, '{}')) c where c like 'search_path=%'), f.sig::text || ' is SECURITY DEFINER without a fixed search_path');
    end if;
  end loop;
  perform public.sbt_ok(not has_function_privilege('anon', 'public.studyboard_start_trial()', 'execute'), 'anon can start a trial');
  perform public.sbt_ok(has_function_privilege('authenticated', 'public.studyboard_start_trial()', 'execute'), 'signed-in users can still start a trial (the app needs this)');
  perform public.sbt_ok((select count(*) = 1 from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace where ns.nspname = 'public' and p.proname = 'studyboard_grant_pro'),
                         'studyboard_grant_pro has a leftover older version (overload)');
  perform public.sbt_ok(not exists (select 1 from pg_depend d join pg_rewrite w on w.oid = d.objid join pg_class v on v.oid = w.ev_class
                                    where d.classid = 'pg_rewrite'::regclass and d.refobjid in (select ('public.' || x)::regclass from unnest(tables) x) and v.relkind in ('v', 'm') and v.oid <> d.refobjid),
                         'a view or materialized view exposes one of the plan tables');
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    perform public.sbt_ok(not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = any (tables)),
                           'a plan table is published over Realtime');
  end if;

  -- ===== 7. The limits cannot be walked around (the paywall is switched on for this test only) =====
  update public.studyboard_config set value = 'true' where key = 'paywall';
  update public.studyboard_config set value = '{"free": {"devices": 2, "fileMB": 1, "dataMB": 1, "groupMembers": 3, "groupMsgDays": 60, "cloudBackupDays": 0},
                                                "pro":  {"devices": null, "fileMB": 10, "dataMB": 5, "groupMembers": 100, "groupMsgDays": null, "cloudBackupDays": 30, "backupMB": 3}}'::jsonb where key = 'limits';
  perform set_config('request.jwt.claims', jsonb_build_object('sub', ua, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  r := public.sbt_try(format('insert into public.studyboard_devices (user_id, device_id, name) values (%L, ''selftest-dev-a-1'', ''1'')', ua)); perform public.sbt_ok(r = 'ok:1', 'free device 1 is allowed');
  r := public.sbt_try(format('insert into public.studyboard_devices (user_id, device_id, name) values (%L, ''selftest-dev-a-2'', ''2'')', ua)); perform public.sbt_ok(r = 'ok:1', 'free device 2 is allowed');
  r := public.sbt_try(format('insert into public.studyboard_devices (user_id, device_id, name) values (%L, ''selftest-dev-a-3'', ''3'')', ua));
  perform public.sbt_blocked(r, 'a free account added a 3rd device');
  r := public.sbt_try(format('insert into public.studyboard_devices (user_id, device_id, name) values (%L, ''selftest-dev-a-1'', ''again'') on conflict (user_id, device_id) do update set last_seen = now()', ua));
  perform public.sbt_ok(r = 'ok:1', 'a known device can sign in again');
  -- remove and re-add, over and over: stopped after 4 removals in a week
  for n in 1..4 loop
    r := public.sbt_try(format('delete from public.studyboard_devices where user_id = %L and device_id = ''selftest-dev-a-2''', ua)); perform public.sbt_ok(r = 'ok:1', 'a device can be removed');
    r := public.sbt_try(format('insert into public.studyboard_devices (user_id, device_id, name) values (%L, ''selftest-dev-a-2'', ''2'')', ua));
    if n < 4 then perform public.sbt_ok(r = 'ok:1', 'swapping a device works a few times'); end if;
  end loop;
  perform public.sbt_blocked(r, 'a free account swapped devices without end (churn limit)');
  execute 'reset role';
  perform public.sbt_ok((select count(*) <= 2 from public.studyboard_devices where user_id = ua), 'a free account ended up with more than 2 devices');

  -- synced data and online backups
  execute 'set local role authenticated';
  r := public.sbt_try(format('insert into public.items (user_id, kind, id, data) values (%L, ''task'', ''t1'', jsonb_build_object(''x'', repeat(''a'', 600000)))', ua));
  perform public.sbt_ok(r = 'ok:1', 'a free account can store some data');
  r := public.sbt_try(format('insert into public.items (user_id, kind, id, data) values (%L, ''task'', ''t2'', jsonb_build_object(''x'', repeat(''a'', 600000)))', ua));
  perform public.sbt_blocked(r, 'a free account went over the synced data limit');
  r := public.sbt_try(format('update public.items set data = jsonb_build_object(''x'', repeat(''a'', 1200000)) where user_id = %L and id = ''t1''', ua));
  perform public.sbt_blocked(r, 'a free account grew an item past the synced data limit');
  r := public.sbt_try(format('insert into public.items (user_id, kind, id, data) values (%L, ''backup'', ''b1'', jsonb_build_object(''x'', ''small''))', ua));
  perform public.sbt_blocked(r, 'a free account wrote an online backup');
  r := public.sbt_try(format('update public.items set kind = ''backup'' where user_id = %L and id = ''t1''', ua));
  perform public.sbt_blocked(r, 'a free account turned an item into an online backup');
  execute 'reset role';
  perform public.sbt_ok((select data_bytes = (select coalesce(sum(octet_length(data::text)) filter (where kind <> 'backup'), 0) from public.items where user_id = ua)
                                and backup_bytes = (select coalesce(sum(octet_length(data::text)) filter (where kind = 'backup'), 0) from public.items where user_id = ua)
                         from public.studyboard_usage where user_id = ua), 'the usage totals match the real data after kind changes');
  -- File storage (back to being the owner: the sign-in claims are cleared first)
  perform set_config('request.jwt.claims', '', true);
  insert into storage.objects (bucket_id, name, metadata) values ('studioso-files', ua || '/one.bin', '{"size": 600000}');
  begin
    insert into storage.objects (bucket_id, name, metadata) values ('studioso-files', ua || '/two.bin', '{"size": 600000}');
    raise exception 'EXPLOIT SUCCEEDED: a free account went over the file storage limit' using errcode = 'XX999';
  exception when sqlstate 'P0001' then insert into public.sbt_log (name) values ('a free account went over the file storage limit (refused)');
  end;
  begin
    insert into storage.objects (bucket_id, name, metadata) values ('studioso-files', 'no-owner-folder/x.bin', '{"size": 10}');
    raise exception 'EXPLOIT SUCCEEDED: a file outside any account folder was accepted' using errcode = 'XX999';
  exception when sqlstate 'P0001' then insert into public.sbt_log (name) values ('a file outside any account folder is refused');
  end;
  -- Study groups: 3 members while the owner is free
  insert into public.study_groups (id, owner_id, name) values (gid, ua, 'selftest');
  insert into public.group_members (group_id, user_id) values (gid, ua);
  insert into auth.users (id, instance_id, aud, role, email) select u, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'selftest-m-' || u || '@example.invalid'
    from (select gen_random_uuid() u from generate_series(1, 3)) g;
  r := 'ok';
  for f in select id from auth.users where email like 'selftest-m-%' order by id loop
    begin
      insert into public.group_members (group_id, user_id) values (gid, f.id);
    exception when sqlstate 'P0001' then r := 'blocked';
    end;
  end loop;
  perform public.sbt_ok(r = 'blocked' and (select count(*) = 3 from public.group_members where group_id = gid), 'a free group has more than 3 members');
  -- A grant makes the owner Pro (limits rise), and revoking takes it away again
  perform public.sbt_ok(not public.studyboard_is_pro(ua), 'account A is wrongly Pro');
  perform public.studyboard_grant_pro_uid(ua, 30, 'selftest');
  perform public.sbt_ok(public.studyboard_is_pro(ua) and public.studyboard_limit(ua, 'dataMB') = 5, 'a grant should make the account Pro');
  -- Pro can keep online backups, within their own total, and old ones are cleaned up
  perform set_config('request.jwt.claims', jsonb_build_object('sub', ua, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  r := public.sbt_try(format('insert into public.items (user_id, kind, id, data) values (%L, ''backup'', ''b1'', jsonb_build_object(''x'', repeat(''a'', 2000000)))', ua));
  execute 'reset role'; perform public.sbt_ok(r = 'ok:1', 'a Pro account can keep an online backup (got ' || r || ')'); execute 'set local role authenticated';
  r := public.sbt_try(format('insert into public.items (user_id, kind, id, data) values (%L, ''backup'', ''b2'', jsonb_build_object(''x'', repeat(''a'', 2000000)))', ua));
  execute 'reset role'; perform public.sbt_blocked(r, 'a Pro account used backup rows as unlimited storage');
  perform set_config('request.jwt.claims', '', true);
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'items' and column_name = 'updated_at') then
    update public.items set updated_at = now() - interval '40 days' where user_id = ua and kind = 'backup';
    perform public.sbt_ok(public.studyboard_prune_backups() = 1, 'backups older than 30 days are removed for Pro');
  end if;
  perform public.studyboard_revoke_pro_uid(ua, 'selftest');
  perform public.sbt_ok(not public.studyboard_is_pro(ua), 'revoking a grant should end Pro');
  perform public.sbt_ok((select count(*) >= 3 from public.studyboard_pro_grants where user_id = ua or user_id = ub), 'grants and revokes are written to the log');

  -- ===== 8. Payments: replays, order, mixed sources, grants =====
  perform public.studyboard_grant_pro_uid(ua, null, 'selftest forever');
  r := public.studyboard_apply_billing(jsonb_build_object('event_id', 'e1', 'family', 'stripe', 'source', 'stripe', 'type', 'customer.subscription.updated', 'state', 'active',
          'uid_hint', ua, 'trust_hint', true, 'customer', 'cus_a', 'pro_until', now() + interval '30 days', 'event_at', now()));
  perform public.sbt_ok(r = 'pro', 'a verified purchase turns Pro on (got ' || r || ')');
  r := public.studyboard_apply_billing(jsonb_build_object('event_id', 'e1', 'family', 'stripe', 'source', 'stripe', 'state', 'active', 'uid_hint', ua, 'trust_hint', true, 'customer', 'cus_a', 'pro_until', now() + interval '99 days'));
  perform public.sbt_ok(r = 'duplicate', 'a replayed event is ignored (got ' || r || ')');
  r := public.studyboard_apply_billing(jsonb_build_object('event_id', 'e0', 'family', 'stripe', 'source', 'stripe', 'type', 'customer.subscription.updated', 'state', 'ended',
          'customer', 'cus_a', 'event_at', now() - interval '1 hour'));
  perform public.sbt_ok(r = 'stale', 'an older event can''t undo a newer one (got ' || r || ')');
  perform public.sbt_ok((select plan = 'pro' and pro_until > now() + interval '25 days' from public.studyboard_entitlements where user_id = ua), 'the stale/replayed events changed nothing');
  r := public.studyboard_apply_billing(jsonb_build_object('event_id', 'e2', 'family', 'stripe', 'source', 'stripe', 'type', 'customer.subscription.deleted', 'state', 'ended', 'customer', 'cus_a', 'event_at', now() + interval '1 minute'));
  perform public.sbt_ok(r = 'ended', 'cancel ends the subscription (got ' || r || ')');
  perform public.sbt_ok(public.studyboard_is_pro(ua), 'a Stripe cancel must not wipe a manual grant');
  perform public.studyboard_revoke_pro_uid(ua, 'selftest');
  perform public.sbt_ok(not public.studyboard_is_pro(ua), 'after the grant is revoked and the subscription ended, the account is free');
  r := public.studyboard_apply_billing(jsonb_build_object('event_id', 'e3', 'family', 'stripe', 'source', 'stripe', 'state', 'active', 'uid_hint', ub, 'customer', 'cus_unknown', 'pro_until', now() + interval '30 days'));
  perform public.sbt_ok(r like 'ignored%', 'an id with no trust is not believed (got ' || r || ')');
  r := public.studyboard_apply_billing(jsonb_build_object('event_id', 'e4', 'family', 'stripe', 'source', 'stripe', 'state', 'active', 'uid_hint', gen_random_uuid(), 'trust_hint', true, 'customer', 'cus_ghost', 'pro_until', now() + interval '30 days'));
  perform public.sbt_ok(r like 'ignored%', 'an id that is not a real account gets nothing (got ' || r || ')');
  r := public.studyboard_apply_billing(jsonb_build_object('event_id', 'e5', 'family', 'stripe', 'source', 'stripe', 'state', 'active', 'uid_hint', ua, 'trust_hint', true, 'customer', 'cus_b', 'pro_until', now() + interval '30 days'));
  perform public.sbt_ok(r like 'rejected%', 'a second Stripe customer can''t be attached to an account (got ' || r || ')');
  r := public.studyboard_apply_billing(jsonb_build_object('event_id', 'e5c', 'family', 'stripe', 'source', 'stripe', 'state', 'active', 'uid_hint', ub, 'trust_hint', true, 'customer', 'cus_a', 'pro_until', now() + interval '30 days'));
  perform public.sbt_ok(r like 'rejected%', 'someone else''s customer id can''t be moved to another account (got ' || r || ')');
  -- a store subscription and a Stripe cancel
  r := public.studyboard_apply_billing(jsonb_build_object('event_id', 'r1', 'family', 'revenuecat', 'source', 'apple', 'state', 'active', 'uid_hint', ub, 'pro_until', now() + interval '60 days', 'fresh', true, 'event_at', now() + interval '2 minutes'));
  perform public.sbt_ok(r = 'pro', 'a store purchase turns Pro on (got ' || r || ')');
  r := public.studyboard_apply_billing(jsonb_build_object('event_id', 'e6', 'family', 'stripe', 'source', 'stripe', 'state', 'ended', 'customer', 'cus_selftest_b', 'event_at', now() + interval '3 minutes'));
  perform public.sbt_ok(r = 'kept other source', 'a Stripe cancel must not end an App Store subscription (got ' || r || ')');
  -- refund / dispute: off, and later renewals can't turn it back on until a new purchase
  r := public.studyboard_apply_billing(jsonb_build_object('event_id', 'r2', 'family', 'revenuecat', 'source', 'apple', 'state', 'revoke', 'uid_hint', ub, 'event_at', now() + interval '4 minutes'));
  perform public.sbt_ok(r = 'revoked', 'a refund switches Pro off (got ' || r || ')');
  perform public.sbt_ok((select plan = 'free' from public.studyboard_entitlements where user_id = ub) and public.studyboard_is_pro(ub), 'account B keeps the owner''s grant after a refund of their purchase');
  r := public.studyboard_apply_billing(jsonb_build_object('event_id', 'r3', 'family', 'revenuecat', 'source', 'apple', 'state', 'active', 'uid_hint', ub, 'pro_until', now() + interval '60 days', 'event_at', now() + interval '5 minutes'));
  perform public.sbt_ok(r = 'ignored: revoked', 'a renewal after a refund doesn''t switch Pro back on (got ' || r || ')');
  r := public.studyboard_apply_billing(jsonb_build_object('event_id', 'r4', 'family', 'revenuecat', 'source', 'apple', 'state', 'active', 'uid_hint', ub, 'pro_until', now() + interval '60 days', 'fresh', true, 'event_at', now() + interval '6 minutes'));
  perform public.sbt_ok(r = 'pro', 'a brand new purchase after a refund works (got ' || r || ')');
  -- paid "Pro for good" survives a subscription ending
  r := public.studyboard_apply_billing(jsonb_build_object('event_id', 'r5', 'family', 'revenuecat', 'source', 'apple', 'state', 'lifetime', 'uid_hint', ub, 'fresh', true, 'event_at', now() + interval '7 minutes'));
  r := public.studyboard_apply_billing(jsonb_build_object('event_id', 'r6', 'family', 'revenuecat', 'source', 'apple', 'state', 'ended', 'uid_hint', ub, 'event_at', now() + interval '8 minutes'));
  perform public.sbt_ok(r = 'kept lifetime', 'an ended subscription does not remove paid Pro for good (got ' || r || ')');

  -- ===== Done =====
  select count(*) into n from public.sbt_log;
  raise notice 'ALL % SECURITY CHECKS PASSED. Nothing was changed for real (the test ends with a rollback).', n;
end
$test$;

select n as "#", name as "attack tried or rule checked (every one held)" from public.sbt_log order by n;

rollback;
