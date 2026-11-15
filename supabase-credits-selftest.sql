-- Studyboard Credits self-test. Changes nothing: it always ends with an error so everything is rolled back.
-- Success reads: CREDITS SELF-TEST PASSED (n checks). Anything else, especially EXPLOIT SUCCEEDED, means stop and fix.
do $$
declare
  a uuid := gen_random_uuid(); b uuid := gen_random_uuid();
  r jsonb; t text; n int := 0; bal int; blocked boolean;
  pi text := 'pi_selftest_' || replace(gen_random_uuid()::text, '-', '');
  pr text;
begin
  update public.studyboard_config set value = 'true' where key = 'item_purchases';
  insert into auth.users (id, email, aud, role, instance_id) values
    (a, 'credits-selftest-a-' || a || '@example.invalid', 'authenticated', 'authenticated', '00000000-0000-0000-0000-000000000000'),
    (b, 'credits-selftest-b-' || b || '@example.invalid', 'authenticated', 'authenticated', '00000000-0000-0000-0000-000000000000');
  select stripe_price_id into pr from public.studyboard_credit_packs where pack_id = 'credits_300';

  -- 1. A signed-in person can't add credits, write tables or call the webhook functions
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  foreach t in array array[
    'insert into public.studyboard_credit_balances (user_id, balance) values (''' || a || ''', 99999)',
    'update public.studyboard_credit_balances set balance = 99999',
    'insert into public.studyboard_owned_items (user_id, kind, item_id) values (''' || a || ''', ''skin'', ''japan'')',
    'insert into public.studyboard_credit_ledger (user_id, delta, balance_after, reason, ref) values (''' || a || ''', 5, 5, ''x'', ''x'')',
    'update public.studyboard_credit_packs set credits = 99999',
    'update public.studyboard_credit_item_prices set credits = 1',
    'select public.studyboard_credits_order(''{"session":"cs_x","uid":"' || a || '","pack":"credits_1300","price":"x"}''::jsonb)',
    'select public.credits_move(''' || a || ''', 99999, ''x'', ''x'')',
    'select public.studyboard_grant_credits(''x@example.com'', 500, null)',
    'select public.studyboard_give_item(''x@example.com'', ''skin'', ''japan'')',
    'select public.studyboard_credits_reverse(''pi_x'', ''x'')',
    'select * from public.studyboard_credit_orders'] loop
    blocked := false;
    begin execute t; exception when others then blocked := true; end;
    if not blocked then raise exception 'EXPLOIT SUCCEEDED: % was allowed for a signed-in person', t; end if;
    n := n + 1;
  end loop;

  -- 2. Buying with no credits fails, and so does a made-up kind
  r := public.studyboard_buy_item('skin', 'japan');
  if r ->> 'error' is distinct from 'not_enough' then raise exception 'EXPLOIT SUCCEEDED: bought with no credits: %', r; end if; n := n + 1;
  r := public.studyboard_buy_item('lifetime', 'pro');
  if r ->> 'error' is distinct from 'bad_item' then raise exception 'FAILED: an unknown kind was accepted: %', r; end if; n := n + 1;

  -- 3. The webhook (service role) grants a pack once, even when Stripe sends the event twice
  execute 'reset role';
  perform set_config('request.jwt.claims', json_build_object('role', 'service_role')::text, true);
  t := public.studyboard_credits_order(jsonb_build_object('session', 'cs_selftest_1', 'uid', a, 'pack', 'credits_300', 'price', pr, 'payment_intent', pi, 'amount', 299, 'currency', 'usd'));
  if t <> 'granted' then raise exception 'FAILED: order not granted: %', t; end if; n := n + 1;
  t := public.studyboard_credits_order(jsonb_build_object('session', 'cs_selftest_1', 'uid', a, 'pack', 'credits_300', 'price', pr, 'payment_intent', pi));
  if t <> 'duplicate' then raise exception 'EXPLOIT SUCCEEDED: a repeated event counted twice: %', t; end if; n := n + 1;
  -- a cheap price can't be passed off as a big pack
  t := public.studyboard_credits_order(jsonb_build_object('session', 'cs_selftest_2', 'uid', a, 'pack', 'credits_1300', 'price', pr));
  if t <> 'price mismatch' then raise exception 'EXPLOIT SUCCEEDED: a 300-credit payment gave 1300 credits: %', t; end if; n := n + 1;
  select balance into bal from public.studyboard_credit_balances where user_id = a;
  if bal <> 300 then raise exception 'FAILED: balance should be 300, is %', bal; end if; n := n + 1;

  -- 4. Spending: a collection for 300; the same item twice costs nothing more; someone else's balance is untouched
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  r := public.studyboard_buy_item('skin', 'japan');
  if not coalesce((r ->> 'ok')::boolean, false) or (r ->> 'balance')::int <> 0 then raise exception 'FAILED: buying the collection: %', r; end if; n := n + 1;
  r := public.studyboard_buy_item('skin', 'japan');
  if not coalesce((r ->> 'already')::boolean, false) then raise exception 'FAILED: a second purchase of the same item: %', r; end if; n := n + 1;
  r := public.studyboard_buy_item('pin', 'gold');
  if r ->> 'error' is distinct from 'not_enough' then raise exception 'EXPLOIT SUCCEEDED: spent below zero: %', r; end if; n := n + 1;
  r := public.studyboard_credits_me();
  if (r ->> 'balance')::int <> 0 or jsonb_array_length(r -> 'owned') <> 1 or (r -> 'prices' ->> 'skin')::int <> 300 then raise exception 'FAILED: credits_me: %', r; end if; n := n + 1;
  if (select count(*) from public.studyboard_owned_items) <> 1 then raise exception 'EXPLOIT SUCCEEDED: another account''s items are readable'; end if; n := n + 1;
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  if (select count(*) from public.studyboard_owned_items) <> 0 or (select count(*) from public.studyboard_credit_ledger) <> 0 then raise exception 'EXPLOIT SUCCEEDED: b reads a''s items or ledger'; end if; n := n + 1;
  -- a guest (anonymous) account can't buy
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated', 'is_anonymous', true)::text, true);
  r := public.studyboard_buy_item('pin', 'gold');
  if r ->> 'error' is distinct from 'sign_in' then raise exception 'FAILED: a guest could buy: %', r; end if; n := n + 1;

  -- 5. A refund takes the credits back; spent credits return the newest items; repeating it changes nothing
  execute 'reset role';
  perform set_config('request.jwt.claims', json_build_object('role', 'service_role')::text, true);
  t := public.studyboard_credits_reverse('pi_not_ours', 'evt_x');
  if t <> 'not_credits' then raise exception 'FAILED: an unknown payment was treated as credits: %', t; end if; n := n + 1;
  t := public.studyboard_credits_reverse(pi, 'evt_refund');
  if t not like 'reversed%' then raise exception 'FAILED: refund not applied: %', t; end if; n := n + 1;
  t := public.studyboard_credits_reverse(pi, 'evt_refund_again');
  if t <> 'already reversed' then raise exception 'EXPLOIT SUCCEEDED: refund applied twice: %', t; end if; n := n + 1;
  select balance into bal from public.studyboard_credit_balances where user_id = a;
  if bal <> 0 or exists (select 1 from public.studyboard_owned_items where user_id = a) then raise exception 'EXPLOIT SUCCEEDED: kept the collection after a refund (balance %)', bal; end if; n := n + 1;
  -- a won dispute gives the credits back
  t := public.studyboard_credits_restore(pi, 'evt_won');
  select balance into bal from public.studyboard_credit_balances where user_id = a;
  if t <> 'restored' or bal <> 300 then raise exception 'FAILED: restore: % (balance %)', t, bal; end if; n := n + 1;

  -- 6. Turned off, nobody can spend
  update public.studyboard_config set value = 'false' where key = 'item_purchases';
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  r := public.studyboard_buy_item('pin', 'gold');
  if r ->> 'error' is distinct from 'off' then raise exception 'FAILED: buying works while switched off: %', r; end if; n := n + 1;
  execute 'reset role';

  raise exception 'CREDITS SELF-TEST PASSED (% checks). Nothing was saved.', n;
end $$;
