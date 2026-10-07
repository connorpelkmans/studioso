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
  insert into public.study_groups (id, owner_id, name, invite_code) values (gid, ua, 'selftest', 'TST-' || substr(gid::text, 1, 3));
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
    -- (lean.sql's trigger stamps updated_at with the server clock on every change, so it is paused to age the backup; the rollback undoes this)
    if exists (select 1 from pg_trigger where tgrelid = 'public.items'::regclass and tgname = 'lean_items_touch') then execute 'alter table public.items disable trigger lean_items_touch'; end if;
    update public.items set updated_at = now() - interval '70 days' where user_id = ua and kind = 'backup';
    if exists (select 1 from pg_trigger where tgrelid = 'public.items'::regclass and tgname = 'lean_items_touch') then execute 'alter table public.items enable trigger lean_items_touch'; end if;
    perform public.sbt_ok(public.studyboard_prune_backups() = 1, 'backups past the Pro window (30 days plus 30 days of grace) are removed');
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

  -- ===== 9. Project Tasks (groups.sql 1.13): shared task lists inside a study group =====
  if to_regclass('public.group_tasks') is null then
    raise notice 'Project Tasks tables not found (run supabase-groups.sql, then this test again): section 9 skipped.';
  else
  declare
    uc uuid := gen_random_uuid();   -- not in any group
    ud uuid := gen_random_uuid();   -- an ordinary member
    g1 uuid := gen_random_uuid();   -- group owned by A; members A, B, D
    g2 uuid := gen_random_uuid();   -- another group owned by B (A is not in it)
    l1 uuid; l2 uuid; lcap uuid; lx uuid; t1 uuid; t2 uuid; tx uuid; i int;
    gt_fn text[] := array['create_task_list', 'update_task_list', 'delete_task_list', 'add_group_task', 'update_group_task', 'move_group_task', 'delete_group_task'];
  begin
    perform set_config('request.jwt.claims', '', true);
    insert into auth.users (id, instance_id, aud, role, email, created_at, updated_at)
      values (uc, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'selftest-c-' || uc || '@example.invalid', now(), now()),
             (ud, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'selftest-d-' || ud || '@example.invalid', now(), now());
    insert into public.study_groups (id, owner_id, name, invite_code) values (g1, ua, 'tasks-1', 'TK1-' || substr(g1::text, 1, 3)), (g2, ub, 'tasks-2', 'TK2-' || substr(g2::text, 1, 3));
    insert into public.group_members (group_id, user_id, role) values (g1, ua, 'owner'), (g1, ub, 'member'), (g1, ud, 'member'), (g2, ub, 'owner');

    -- A (owner of g1) makes a list; B makes a task and assigns it to D; B also adds an unassigned one.
    perform set_config('request.jwt.claims', jsonb_build_object('sub', ua, 'role', 'authenticated')::text, true);
    execute 'set local role authenticated';
    select id into l1 from public.create_task_list(g1, 'BIOL 201 Poster', 'BIOL 201');
    execute 'reset role'; perform public.sbt_ok(l1 is not null, 'a member can create a task list');
    perform set_config('request.jwt.claims', jsonb_build_object('sub', ub, 'role', 'authenticated')::text, true);
    execute 'set local role authenticated';
    select id into t1 from public.add_group_task(l1, 'Draft the intro', ud, current_date + 3, 'two paragraphs', 'high');
    select id into t2 from public.add_group_task(l1, 'Find three figures', null, null, '', null);
    select id into l2 from public.create_task_list(g2, 'Other group list', '');
    select id into tx from public.add_group_task(l2, 'Secret task in another group', null, null, '', null);
    execute 'reset role';
    perform public.sbt_ok(t1 is not null and t2 is not null, 'a member can add tasks (with and without an assignee)');
    perform public.sbt_ok((select created_by = ub and updated_by = ub and position = 1 and status = 'todo' from public.group_tasks where id = t1), 'the server stamps who added the task and where it sits');

    -- 9a. Someone who is not in the group (account C) sees and changes nothing
    perform set_config('request.jwt.claims', jsonb_build_object('sub', uc, 'role', 'authenticated')::text, true);
    execute 'set local role authenticated';
    n := public.sbt_count('select 1 from public.group_task_lists where group_id = ' || quote_literal(g1));
    execute 'reset role'; perform public.sbt_ok(n = 0, 'a non-member can read a group''s task lists (saw ' || n || ')'); execute 'set local role authenticated';
    n := public.sbt_count('select 1 from public.group_tasks where group_id = ' || quote_literal(g1));
    execute 'reset role'; perform public.sbt_ok(n = 0, 'a non-member can read a group''s tasks (saw ' || n || ')'); execute 'set local role authenticated';
    r := public.sbt_try(format('select public.create_task_list(%L, %L, %L)', g1, 'x', ''));
    execute 'reset role'; perform public.sbt_blocked(r, 'a non-member created a task list'); execute 'set local role authenticated';
    r := public.sbt_try(format('select public.add_group_task(%L, %L, null, null, %L, null)', l1, 'x', ''));
    execute 'reset role'; perform public.sbt_blocked(r, 'a non-member added a task'); execute 'set local role authenticated';
    r := public.sbt_try(format('select public.update_group_task(%L, %L)', t1, '{"status":"done"}'));
    execute 'reset role'; perform public.sbt_blocked(r, 'a non-member changed a task'); execute 'set local role authenticated';
    r := public.sbt_try(format('select public.move_group_task(%L, 1)', t2));
    execute 'reset role'; perform public.sbt_blocked(r, 'a non-member reordered a task'); execute 'set local role authenticated';
    r := public.sbt_try(format('select public.delete_group_task(%L)', t1));
    execute 'reset role'; perform public.sbt_blocked(r, 'a non-member removed a task'); execute 'set local role authenticated';
    r := public.sbt_try(format('select public.update_task_list(%L, %L)', l1, '{"archived":true}'));
    execute 'reset role'; perform public.sbt_blocked(r, 'a non-member archived a list'); execute 'set local role authenticated';
    r := public.sbt_try(format('select public.delete_task_list(%L)', l1));
    execute 'reset role'; perform public.sbt_blocked(r, 'a non-member deleted a list');
    perform public.sbt_ok((select count(*) = 2 from public.group_tasks where list_id = l1 and not deleted) and exists (select 1 from public.group_task_lists where id = l1),
                           'the list and its tasks are untouched by the outsider');

    -- 9b. A member still has no direct write access to the tables (only the functions)
    perform set_config('request.jwt.claims', jsonb_build_object('sub', ub, 'role', 'authenticated')::text, true);
    execute 'set local role authenticated';
    r := public.sbt_try(format('insert into public.group_tasks (list_id, group_id, title) values (%L, %L, %L)', l1, g1, 'sneaky'));
    execute 'reset role'; perform public.sbt_blocked(r, 'a member inserted a task directly'); execute 'set local role authenticated';
    r := public.sbt_try(format('update public.group_tasks set title = %L, assignee_id = %L where id = %L', 'pwned', ub, t1));
    execute 'reset role'; perform public.sbt_blocked(r, 'a member edited a task directly'); execute 'set local role authenticated';
    r := public.sbt_try(format('update public.group_tasks set deleted = true where id = %L', t1));
    execute 'reset role'; perform public.sbt_blocked(r, 'a member soft-deleted a task directly'); execute 'set local role authenticated';
    r := public.sbt_try(format('delete from public.group_tasks where id = %L', t1));
    execute 'reset role'; perform public.sbt_blocked(r, 'a member deleted a task directly'); execute 'set local role authenticated';
    r := public.sbt_try(format('insert into public.group_task_lists (group_id, title) values (%L, %L)', g1, 'sneaky'));
    execute 'reset role'; perform public.sbt_blocked(r, 'a member inserted a list directly'); execute 'set local role authenticated';
    r := public.sbt_try(format('update public.group_task_lists set title = %L where id = %L', 'pwned', l1));
    execute 'reset role'; perform public.sbt_blocked(r, 'a member renamed a list directly'); execute 'set local role authenticated';
    r := public.sbt_try(format('delete from public.group_task_lists where id = %L', l1));
    execute 'reset role'; perform public.sbt_blocked(r, 'a member deleted a list directly'); execute 'set local role authenticated';
    r := public.sbt_try('truncate public.group_tasks');
    execute 'reset role'; perform public.sbt_blocked(r, 'a member truncated the tasks table'); execute 'set local role anon';
    r := public.sbt_try('select * from public.group_tasks');
    execute 'reset role'; perform public.sbt_ok(r like 'err:%', 'the anon key can read group tasks'); execute 'set local role anon';
    r := public.sbt_try(format('select public.add_group_task(%L, %L, null, null, %L, null)', l1, 'x', ''));
    execute 'reset role'; perform public.sbt_blocked(r, 'the anon key added a group task');
    perform public.sbt_ok((select title = 'Draft the intro' from public.group_tasks where id = t1), 'direct attempts left the task unchanged');

    -- 9c. Assignees must be members, and who may reassign
    execute 'set local role authenticated';
    r := public.sbt_try(format('select public.add_group_task(%L, %L, %L, null, %L, null)', l1, 'for a stranger', uc, ''));
    execute 'reset role'; perform public.sbt_blocked(r, 'a member assigned a new task to a non-member'); execute 'set local role authenticated';
    r := public.sbt_try(format('select public.update_group_task(%L, jsonb_build_object(%L, %L))', t2, 'assignee_id', uc));
    execute 'reset role'; perform public.sbt_blocked(r, 'a member assigned an existing task to a non-member'); execute 'set local role authenticated';
    r := public.sbt_try(format('select public.update_group_task(%L, jsonb_build_object(%L, %L))', t2, 'assignee_id', ub));
    execute 'reset role'; perform public.sbt_ok(r = 'ok:1', 'anyone can claim an unassigned task (got ' || r || ')');
    -- B now holds t2; D (a plain member, not the assignee, not the owner) can't take it
    perform set_config('request.jwt.claims', jsonb_build_object('sub', ud, 'role', 'authenticated')::text, true);
    execute 'set local role authenticated';
    r := public.sbt_try(format('select public.update_group_task(%L, jsonb_build_object(%L, %L))', t2, 'assignee_id', ud));
    execute 'reset role'; perform public.sbt_blocked(r, 'a member took over a task that was assigned to someone else'); execute 'set local role authenticated';
    r := public.sbt_try(format('select public.update_group_task(%L, %L)', t2, '{"assignee_id": null}'));
    execute 'reset role'; perform public.sbt_blocked(r, 'a member unassigned someone else''s task');
    perform public.sbt_ok((select assignee_id = ub from public.group_tasks where id = t2), 'the task is still assigned to B');
    -- any member may edit details and mark it done
    execute 'set local role authenticated';
    r := public.sbt_try(format('select public.update_group_task(%L, %L)', t2, '{"status":"done","notes":"found them"}'));
    execute 'reset role'; perform public.sbt_ok(r = 'ok:1', 'any member can mark a task done (got ' || r || ')');
    perform public.sbt_ok((select status = 'done' and completed_by = ud and completed_at is not null and updated_by = ud from public.group_tasks where id = t2), 'completion is stamped with who and when');
    perform set_config('request.jwt.claims', jsonb_build_object('sub', ua, 'role', 'authenticated')::text, true);
    execute 'set local role authenticated';
    r := public.sbt_try(format('select public.update_group_task(%L, jsonb_build_object(%L, %L, %L, %L))', t2, 'assignee_id', ud, 'status', 'todo'));
    execute 'reset role'; perform public.sbt_ok(r = 'ok:1', 'the group owner can reassign a task (got ' || r || ')');
    perform public.sbt_ok((select assignee_id = ud and completed_at is null and completed_by is null from public.group_tasks where id = t2), 'reopening clears the completion stamp');

    -- 9d. Crafted ids across groups (A is not in g2)
    execute 'set local role authenticated';
    r := public.sbt_try(format('select public.update_group_task(%L, %L)', tx, '{"title":"hijacked"}'));
    execute 'reset role'; perform public.sbt_blocked(r, 'a member edited a task in a group they are not in'); execute 'set local role authenticated';
    r := public.sbt_try(format('select public.delete_group_task(%L)', tx));
    execute 'reset role'; perform public.sbt_blocked(r, 'a member deleted a task in a group they are not in'); execute 'set local role authenticated';
    r := public.sbt_try(format('select public.move_group_task(%L, -1)', tx));
    execute 'reset role'; perform public.sbt_blocked(r, 'a member reordered a task in a group they are not in'); execute 'set local role authenticated';
    r := public.sbt_try(format('select public.add_group_task(%L, %L, null, null, %L, null)', l2, 'x', ''));
    execute 'reset role'; perform public.sbt_blocked(r, 'a member added a task to another group''s list'); execute 'set local role authenticated';
    r := public.sbt_try(format('select public.delete_task_list(%L)', l2));
    execute 'reset role'; perform public.sbt_blocked(r, 'a member deleted another group''s list');
    perform set_config('request.jwt.claims', '', true);
    -- the database itself refuses a task whose group does not match its list, or an assignee who is not a member
    r := public.sbt_try(format('insert into public.group_tasks (list_id, group_id, title) values (%L, %L, %L)', l2, g1, 'mismatch'));
    perform public.sbt_ok(r like 'err:%', 'a task can''t sit in a list of a different group');
    r := public.sbt_try(format('insert into public.group_tasks (list_id, group_id, title, assignee_id) values (%L, %L, %L, %L)', l1, g1, 'stranger', uc));
    perform public.sbt_ok(r like 'err:%', 'the database refuses an assignee who is not a member, even from the SQL Editor');
    perform public.sbt_ok((select title = 'Secret task in another group' and not deleted from public.group_tasks where id = tx), 'the other group''s task is untouched');

    -- 9e. Who can delete, and reordering
    perform set_config('request.jwt.claims', jsonb_build_object('sub', ud, 'role', 'authenticated')::text, true);
    execute 'set local role authenticated';
    r := public.sbt_try(format('select public.delete_group_task(%L)', t1));
    execute 'reset role'; perform public.sbt_blocked(r, 'a member who is not the author or the owner removed a task'); execute 'set local role authenticated';
    r := public.sbt_try(format('select public.delete_task_list(%L)', l1));
    execute 'reset role'; perform public.sbt_blocked(r, 'a member who is not the creator or the owner deleted a list');
    perform set_config('request.jwt.claims', jsonb_build_object('sub', ub, 'role', 'authenticated')::text, true);
    execute 'set local role authenticated';
    perform public.move_group_task(t2, -1);
    execute 'reset role';
    perform public.sbt_ok((select position from public.group_tasks where id = t2) = 1 and (select position from public.group_tasks where id = t1) = 2, 'a member can move a task up');
    execute 'set local role authenticated';
    r := public.sbt_try(format('select public.delete_group_task(%L)', t1));
    execute 'reset role'; perform public.sbt_ok(r = 'ok:1', 'the author can remove their task (got ' || r || ')');
    perform public.sbt_ok((select deleted from public.group_tasks where id = t1), 'removal is a soft delete');

    -- 9f. Caps and text limits
    execute 'set local role authenticated';
    r := public.sbt_try(format('select public.add_group_task(%L, repeat(%L, 201), null, null, %L, null)', l1, 'x', ''));
    execute 'reset role'; perform public.sbt_blocked(r, 'a task title over 200 characters was accepted'); execute 'set local role authenticated';
    r := public.sbt_try(format('select public.add_group_task(%L, %L, null, null, %L, null)', l1, '   ', ''));
    execute 'reset role'; perform public.sbt_blocked(r, 'an empty task title was accepted'); execute 'set local role authenticated';
    r := public.sbt_try(format('select public.create_task_list(%L, repeat(%L, 81), %L)', g1, 'x', ''));
    execute 'reset role'; perform public.sbt_blocked(r, 'a list title over 80 characters was accepted'); execute 'set local role authenticated';
    r := public.sbt_try(format('select public.add_group_task(%L, %L, null, null, %L, %L)', l1, 'odd priority', '', 'bogus'));
    execute 'reset role'; perform public.sbt_blocked(r, 'an unknown priority was accepted');
    execute 'set local role authenticated';
    perform public.add_group_task(l1, 'long notes', null, null, repeat('n', 5000), null);
    execute 'reset role';
    perform public.sbt_ok((select max(char_length(notes)) <= 1000 from public.group_tasks where list_id = l1), 'notes are capped at 1000 characters');
    -- 200 tasks in a list
    perform set_config('request.jwt.claims', '', true);
    insert into public.group_task_lists (group_id, title) values (g1, 'cap list') returning id into lcap;
    insert into public.group_tasks (list_id, group_id, title, position) select lcap, g1, 'bulk ' || x, x from generate_series(1, 200) x;
    perform set_config('request.jwt.claims', jsonb_build_object('sub', ub, 'role', 'authenticated')::text, true);
    execute 'set local role authenticated';
    r := public.sbt_try(format('select public.add_group_task(%L, %L, null, null, %L, null)', lcap, 'one too many', ''));
    execute 'reset role'; perform public.sbt_blocked(r, 'a list took a 201st task');
    perform public.sbt_ok((select count(*) = 200 from public.group_tasks where list_id = lcap), 'a list holds exactly 200 tasks');
    -- 20 active lists (the group has l1 and lcap now)
    perform set_config('request.jwt.claims', '', true);
    insert into public.group_task_lists (group_id, title) select g1, 'filler ' || x from generate_series(1, 18) x;
    perform set_config('request.jwt.claims', jsonb_build_object('sub', ub, 'role', 'authenticated')::text, true);
    execute 'set local role authenticated';
    r := public.sbt_try(format('select public.create_task_list(%L, %L, %L)', g1, '21st', ''));
    execute 'reset role'; perform public.sbt_blocked(r, 'a group got a 21st active task list'); execute 'set local role authenticated';
    r := public.sbt_try(format('select public.update_task_list(%L, %L)', lcap, '{"archived": true}'));
    execute 'reset role'; perform public.sbt_ok(r = 'ok:1', 'a member can archive a list (got ' || r || ')'); execute 'set local role authenticated';
    r := public.sbt_try(format('select public.add_group_task(%L, %L, null, null, %L, null)', lcap, 'into archived', ''));
    execute 'reset role'; perform public.sbt_blocked(r, 'a task was added to an archived list'); execute 'set local role authenticated';
    r := public.sbt_try(format('select public.create_task_list(%L, %L, %L)', g1, 'after archiving', ''));
    execute 'reset role'; perform public.sbt_ok(r = 'ok:1', 'archiving frees a slot for a new list (got ' || r || ')'); execute 'set local role authenticated';
    r := public.sbt_try(format('select public.update_task_list(%L, %L)', lcap, '{"archived": false}'));
    execute 'reset role'; perform public.sbt_blocked(r, 'a restored list pushed the group past 20 active lists');
    -- flooding: no more than 40 new tasks a minute from one account
    perform set_config('request.jwt.claims', '', true);
    insert into public.group_task_lists (group_id, title) values (g2, 'flood list') returning id into lx;
    perform set_config('request.jwt.claims', jsonb_build_object('sub', ub, 'role', 'authenticated')::text, true);
    execute 'set local role authenticated';
    r := 'ok';
    for i in 1..60 loop
      begin
        perform public.add_group_task(lx, 'flood ' || i, null, null, '', null);
      exception when others then r := 'blocked'; exit;
      end;
    end loop;
    execute 'reset role';
    perform public.sbt_ok(r = 'blocked' and (select count(*) < 50 from public.group_tasks where list_id = lx), 'one account added more than 40 tasks in a minute');

    -- 9g. Leaving a group unassigns your tasks; blocked people's tasks are hidden
    perform set_config('request.jwt.claims', '', true);
    perform public.sbt_ok((select assignee_id = ud from public.group_tasks where id = t2), 'D holds a task before leaving');
    delete from public.group_members where group_id = g1 and user_id = ud;
    perform public.sbt_ok((select assignee_id is null from public.group_tasks where id = t2), 'a task becomes unassigned when its assignee leaves the group');
    if to_regclass('public.group_blocks') is not null
       and exists (select 1 from pg_policy where polrelid = 'public.group_tasks'::regclass and polname = 'gtask member read' and pg_get_expr(polqual, polrelid) like '%group_blocks%') then
      insert into public.group_blocks (blocker_id, blocked_id) values (ua, ub);
      perform set_config('request.jwt.claims', jsonb_build_object('sub', ua, 'role', 'authenticated')::text, true);
      execute 'set local role authenticated';
      n := public.sbt_count('select 1 from public.group_tasks where created_by = ' || quote_literal(ub) || ' and group_id = ' || quote_literal(g1));
      execute 'reset role'; perform public.sbt_ok(n = 0, 'tasks added by someone you blocked are hidden (saw ' || n || ')'); execute 'set local role authenticated';
      n := public.sbt_count('select 1 from public.group_tasks where created_by is distinct from ' || quote_literal(ub) || ' and group_id = ' || quote_literal(g1));
      execute 'reset role'; perform public.sbt_ok(n > 0, 'tasks from everyone else are still visible');
      perform set_config('request.jwt.claims', '', true);
      delete from public.group_blocks where blocker_id = ua;
    else
      raise notice 'supabase-moderation.sql (task rules) is not installed: the blocked-people check was skipped.';
    end if;

    -- 9h. Privileges, definer settings and realtime
    perform public.sbt_ok(not has_table_privilege('anon', 'public.group_tasks', 'select,insert,update,delete,truncate')
                          and not has_table_privilege('anon', 'public.group_task_lists', 'select,insert,update,delete,truncate'), 'anon has privileges on the task tables');
    perform public.sbt_ok(not has_table_privilege('authenticated', 'public.group_tasks', 'insert,update,delete,truncate')
                          and not has_table_privilege('authenticated', 'public.group_task_lists', 'insert,update,delete,truncate'), 'signed-in users have write privileges on the task tables');
    perform public.sbt_ok((select relrowsecurity from pg_class where oid = 'public.group_tasks'::regclass) and (select relrowsecurity from pg_class where oid = 'public.group_task_lists'::regclass),
                          'row level security is off on a task table');
    perform public.sbt_ok(not exists (select 1 from pg_policy where polrelid in ('public.group_tasks'::regclass, 'public.group_task_lists'::regclass) and polcmd <> 'r'), 'a task table has a policy that allows writes');
    for f in
      select p.oid, p.oid::regprocedure as sig, p.proname, p.prosecdef, p.proconfig, p.proacl, p.proowner
      from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
      where ns.nspname = 'public' and (p.proname = any (gt_fn) or p.proname in ('sbg_task_stamp', 'sbg_task_member_left'))
    loop
      perform public.sbt_ok(not has_function_privilege('anon', f.oid, 'execute'), 'anon can execute ' || f.sig::text);
      perform public.sbt_ok(not exists (select 1 from aclexplode(coalesce(f.proacl, acldefault('f', f.proowner))) a where a.grantee = 0 and a.privilege_type = 'EXECUTE'), 'PUBLIC can execute ' || f.sig::text);
      perform public.sbt_ok(f.proname = any (gt_fn) or not has_function_privilege('authenticated', f.oid, 'execute'), 'signed-in users can execute the trigger function ' || f.sig::text);
      perform public.sbt_ok(f.proname <> all (gt_fn) or has_function_privilege('authenticated', f.oid, 'execute'), 'signed-in users can''t execute ' || f.sig::text || ' (the app needs it)');
      perform public.sbt_ok(f.prosecdef and exists (select 1 from unnest(coalesce(f.proconfig, '{}')) c where c like 'search_path=%'), f.sig::text || ' is not SECURITY DEFINER with a fixed search_path');
    end loop;
    perform public.sbt_ok((select count(*) = 9 from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace where ns.nspname = 'public' and (p.proname = any (gt_fn) or p.proname in ('sbg_task_stamp', 'sbg_task_member_left'))),
                          'a task function has a leftover older version (overload) or is missing');
    if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
      perform public.sbt_ok((select count(*) = 2 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename in ('group_tasks', 'group_task_lists')),
                            'the task tables are not published over Realtime (members would not see live updates)');
    end if;
  end;
  end if;

  -- ===== 10. A free trial can't be had twice by deleting the account and signing up again with the same email =====
  declare tx uuid := gen_random_uuid(); ty uuid := gen_random_uuid(); em text := 'selftest.trial-' || substr(gen_random_uuid()::text, 1, 8) || '@gmail.com';
  begin
    update public.studyboard_config set value = 'true'::jsonb where key = 'app_trial';
    insert into auth.users (id, instance_id, aud, role, email) values (tx, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', em);
    perform set_config('request.jwt.claims', jsonb_build_object('sub', tx, 'role', 'authenticated')::text, true);
    perform public.studyboard_start_trial();
    perform public.sbt_ok(exists (select 1 from public.studyboard_trial_uses where email_hash = public.plans_email_hash(em)), 'starting a trial is not remembered by email hash');
    perform public.sbt_ok(not exists (select 1 from public.studyboard_trial_uses where email_hash = em or email_hash like '%@%'), 'the trial record holds the email itself');
    -- the account is deleted (the worker when lean.sql is installed), then made again with the same address written differently
    if to_regprocedure('public.studyboard_delete_user_data(uuid)') is not null then perform public.studyboard_delete_user_data(tx); end if;
    delete from public.studyboard_entitlements where user_id = tx;
    delete from auth.users where id = tx;
    insert into auth.users (id, instance_id, aud, role, email) values (ty, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', upper(replace(em, '@', '+again@')));
    perform set_config('request.jwt.claims', jsonb_build_object('sub', ty, 'role', 'authenticated')::text, true);
    r := 'ok';
    begin perform public.studyboard_start_trial(); exception when others then r := sqlerrm; end;
    perform public.sbt_ok(r like 'SB_TRIAL_USED%', 'a second free trial was started by deleting the account and signing up again (got ' || r || ')');
    perform set_config('request.jwt.claims', '', true);
  end;

  -- ===== Done =====
  select count(*) into n from public.sbt_log;
  raise notice 'ALL % SECURITY CHECKS PASSED. Nothing was changed for real (the test ends with a rollback).', n;
end
$test$;

select n as "#", name as "attack tried or rule checked (every one held)" from public.sbt_log order by n;

rollback;
