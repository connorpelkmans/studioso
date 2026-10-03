-- Studyboard: account deletion self-test (attacker style)
-- Run in Supabase: SQL Editor > New query > paste everything > Run. Run it AFTER supabase-lean.sql (and the other setup files).
--
-- It creates three throw-away accounts, A (the one who deletes), B (a group-mate) and C (a stranger), gives them data, then
--   * deletes A's account the way the app does and checks A's rows are gone and B's and C's are untouched,
--   * checks the group A owned was handed to B (or removed when nobody else was in it),
--   * checks payment/grant bookkeeping was anonymized (no user id, no email) rather than left linked,
--   * plays an attacker: B tries to delete C, to call the worker function for C, to delete auth.users directly, and an
--     anonymous visitor tries to delete anything. Every attempt must FAIL.
-- Failure shows as   ERROR: DELETE TEST FAILED: <what>   Success shows   ALL n ACCOUNT-DELETION CHECKS PASSED.
-- Everything runs in one transaction that ends in ROLLBACK, so nothing real is touched. If you stop half way, run: rollback;

begin;
create table public.sbd_log (n serial, name text);
grant all on public.sbd_log to public;
grant usage on sequence public.sbd_log_n_seq to public;
create function public.sbd_ok(c boolean, name text) returns void language plpgsql as $f$
begin
  if c is not true then raise exception 'DELETE TEST FAILED: %', name; end if;
  insert into public.sbd_log (name) values (name);
end $f$;
create function public.sbd_try(q text) returns text language plpgsql as $f$
declare n bigint;
begin execute q; get diagnostics n = row_count; return 'ok:' || n; exception when others then return 'err:' || sqlstate; end $f$;
create function public.sbd_n(q text) returns bigint language plpgsql as $f$
declare n bigint;
begin execute 'select count(*) from (' || q || ') s' into n; return n; end $f$;
grant execute on function public.sbd_ok(boolean, text), public.sbd_try(text), public.sbd_n(text) to public;

-- accounts and data (as the database owner)
insert into auth.users (id, email) values
  ('aaaaaaaa-0000-4000-8000-00000000000a', 'a-delete-test@example.com'),
  ('bbbbbbbb-0000-4000-8000-00000000000b', 'b-delete-test@example.com'),
  ('cccccccc-0000-4000-8000-00000000000c', 'c-delete-test@example.com');
insert into public.items (user_id, kind, id, data) values
  ('aaaaaaaa-0000-4000-8000-00000000000a', 'task', 't1', '{"t":"a"}'), ('bbbbbbbb-0000-4000-8000-00000000000b', 'task', 't1', '{"t":"b"}'),
  ('cccccccc-0000-4000-8000-00000000000c', 'task', 't1', '{"t":"c"}');
insert into public.studyboard_entitlements (user_id, plan) values
  ('aaaaaaaa-0000-4000-8000-00000000000a', 'pro'), ('bbbbbbbb-0000-4000-8000-00000000000b', 'pro');
insert into public.studyboard_devices (user_id, device_id) values
  ('aaaaaaaa-0000-4000-8000-00000000000a', 'device-aaaaaaaa'), ('bbbbbbbb-0000-4000-8000-00000000000b', 'device-bbbbbbbb');
insert into public.studyboard_pro_grants (user_id, email, action, reason) values
  ('aaaaaaaa-0000-4000-8000-00000000000a', 'a-delete-test@example.com', 'grant', 'friend of the family'),
  ('bbbbbbbb-0000-4000-8000-00000000000b', 'b-delete-test@example.com', 'grant', 'beta tester');
insert into public.studyboard_billing_events (family, event_id, user_id) values ('stripe', 'evt_a', 'aaaaaaaa-0000-4000-8000-00000000000a'), ('stripe', 'evt_b', 'bbbbbbbb-0000-4000-8000-00000000000b');
select set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-4000-8000-00000000000a', true);
insert into public.bug_reports (message, contact_email) values ('bug from a', 'a-delete-test@example.com');
select set_config('request.jwt.claim.sub', 'bbbbbbbb-0000-4000-8000-00000000000b', true);
insert into public.bug_reports (message) values ('bug from b');
select set_config('request.jwt.claim.sub', '', true);
insert into public.bug_reports (message, contact_email) values ('signed-out bug that left A''s email', 'A-Delete-Test@example.com');
insert into public.calendar_feeds (token, user_id) values ('tok-a-delete-test-0123456789abcdefghijklmnop', 'aaaaaaaa-0000-4000-8000-00000000000a'), ('tok-b-delete-test-0123456789abcdefghijklmnop', 'bbbbbbbb-0000-4000-8000-00000000000b');
insert into public.reminder_queue (user_id, id, fire_at) values
  ('aaaaaaaa-0000-4000-8000-00000000000a', 'r1', now()), ('bbbbbbbb-0000-4000-8000-00000000000b', 'r1', now());
insert into public.push_subscriptions (user_id, endpoint, p256dh, auth) values
  ('aaaaaaaa-0000-4000-8000-00000000000a', 'https://push.example/a', 'k', 'k'), ('bbbbbbbb-0000-4000-8000-00000000000b', 'https://push.example/b', 'k', 'k');
-- group 1: A owns, B and A are members (ownership must go to B). group 2: A owns alone (must be deleted). group 3: C owns, A is a member.
insert into public.study_groups (id, name, owner_id, invite_code) values
  ('11111111-1111-4111-8111-111111111111', 'G1', 'aaaaaaaa-0000-4000-8000-00000000000a', 'DEL-TST1'),
  ('22222222-2222-4222-8222-222222222222', 'G2', 'aaaaaaaa-0000-4000-8000-00000000000a', 'DEL-TST2'),
  ('33333333-3333-4333-8333-333333333333', 'G3', 'cccccccc-0000-4000-8000-00000000000c', 'DEL-TST3');
insert into public.group_members (group_id, user_id, role, display_name, joined_at) values
  ('11111111-1111-4111-8111-111111111111', 'aaaaaaaa-0000-4000-8000-00000000000a', 'owner', 'A', now() - interval '3 days'),
  ('11111111-1111-4111-8111-111111111111', 'bbbbbbbb-0000-4000-8000-00000000000b', 'member', 'B', now() - interval '2 days'),
  ('22222222-2222-4222-8222-222222222222', 'aaaaaaaa-0000-4000-8000-00000000000a', 'owner', 'A', now()),
  ('33333333-3333-4333-8333-333333333333', 'cccccccc-0000-4000-8000-00000000000c', 'owner', 'C', now()),
  ('33333333-3333-4333-8333-333333333333', 'aaaaaaaa-0000-4000-8000-00000000000a', 'member', 'A', now());
-- (a trigger stamps the author from the signed-in id, so set it for each insert)
select set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-4000-8000-00000000000a', true);
insert into public.group_messages (group_id, body) values ('11111111-1111-4111-8111-111111111111', 'hello from A'), ('33333333-3333-4333-8333-333333333333', 'A in C group');
select set_config('request.jwt.claim.sub', 'bbbbbbbb-0000-4000-8000-00000000000b', true);
insert into public.group_messages (group_id, body) values ('11111111-1111-4111-8111-111111111111', 'hello from B');
insert into public.group_reports (group_id, reporter_id, reported_user_id, target_kind, target_id, reason)
  values ('11111111-1111-4111-8111-111111111111', 'bbbbbbbb-0000-4000-8000-00000000000b', 'aaaaaaaa-0000-4000-8000-00000000000a', 'member', 'aaaaaaaa-0000-4000-8000-00000000000a', 'spam');
select set_config('request.jwt.claim.sub', '', true);
insert into storage.objects (bucket_id, name) values ('studioso-files', 'aaaaaaaa-0000-4000-8000-00000000000a/f.pdf'), ('studioso-files', 'bbbbbbbb-0000-4000-8000-00000000000b/f.pdf');
insert into public.studyboard_rate (key, bucket, n) values ('code:aaaaaaaa-0000-4000-8000-00000000000a', now(), 1), ('code:bbbbbbbb-0000-4000-8000-00000000000b', now(), 1);

grant select on all tables in schema public to authenticated;     -- the self-test needs to count rows as a normal account (RLS still decides which)

-- ---------- attacks first: B signed in ----------
set role authenticated;
select set_config('request.jwt.claim.sub', 'bbbbbbbb-0000-4000-8000-00000000000b', true);
select public.sbd_ok(public.sbd_try($$select public.studyboard_delete_user_data('cccccccc-0000-4000-8000-00000000000c')$$) like 'err:%', 'a signed-in person can NOT call the worker function for someone else');
select public.sbd_ok(public.sbd_try($$delete from auth.users where id = 'cccccccc-0000-4000-8000-00000000000c'$$) like 'err:%', 'a signed-in person can NOT delete auth users directly');
select public.sbd_ok(public.sbd_try($$delete from public.items where user_id = 'cccccccc-0000-4000-8000-00000000000c'$$) <> 'ok:1', 'a signed-in person can NOT delete another person''s items');
select public.sbd_ok(public.sbd_try($$select public.studyboard_delete_my_account('cccccccc-0000-4000-8000-00000000000c')$$) like 'err:%', 'the account function takes no user id (cannot be pointed at someone else)');
reset role;
set role anon;
select set_config('request.jwt.claim.sub', '', true);
select public.sbd_ok(public.sbd_try($$select public.studyboard_delete_my_account()$$) like 'err:%', 'an anonymous visitor can NOT delete anything');
select public.sbd_ok(public.sbd_try($$select public.studyboard_delete_user_data('cccccccc-0000-4000-8000-00000000000c')$$) like 'err:%', 'an anonymous visitor can NOT call the worker function');
reset role;
select public.sbd_ok(public.sbd_n($$select 1 from auth.users where id in ('aaaaaaaa-0000-4000-8000-00000000000a','bbbbbbbb-0000-4000-8000-00000000000b','cccccccc-0000-4000-8000-00000000000c')$$) = 3, 'nobody was deleted by the attacks');
select public.sbd_ok(public.sbd_n($$select 1 from public.items where user_id = 'cccccccc-0000-4000-8000-00000000000c'$$) = 1, 'C''s data survived the attacks');

-- ---------- A deletes their own account (twice: it must be safe to repeat) ----------
set role authenticated;
select set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-4000-8000-00000000000a', true);
select public.studyboard_delete_my_account();
reset role;
-- the second call has no account row to delete; it must still not error or touch anyone else
set role authenticated;
select public.sbd_ok(public.sbd_try($$select public.studyboard_delete_my_account()$$) like 'ok:%', 'deleting twice is harmless (idempotent)');
reset role;

select public.sbd_ok(public.sbd_n($$select 1 from auth.users where id = 'aaaaaaaa-0000-4000-8000-00000000000a'$$) = 0, 'A''s login account is gone');
select public.sbd_ok(public.sbd_n($$select 1 from public.items where user_id = 'aaaaaaaa-0000-4000-8000-00000000000a'$$) = 0, 'A''s synced items are gone');
select public.sbd_ok(public.sbd_n($$select 1 from public.studyboard_entitlements where user_id = 'aaaaaaaa-0000-4000-8000-00000000000a'$$) = 0, 'A''s plan row is gone');
select public.sbd_ok(public.sbd_n($$select 1 from public.studyboard_devices where user_id = 'aaaaaaaa-0000-4000-8000-00000000000a'$$) = 0, 'A''s devices are gone');
select public.sbd_ok(public.sbd_n($$select 1 from public.bug_reports where user_id = 'aaaaaaaa-0000-4000-8000-00000000000a' or contact_email = 'a-delete-test@example.com'$$) = 0, 'A''s bug reports (and contact email) are gone');
select public.sbd_ok(public.sbd_n($$select 1 from public.calendar_feeds where token = 'tok-a-delete-test-0123456789abcdefghijklmnop'$$) = 0, 'A''s calendar link token is gone');
select public.sbd_ok(public.sbd_n($$select 1 from public.reminder_queue where user_id = 'aaaaaaaa-0000-4000-8000-00000000000a'$$) = 0, 'A''s reminders are gone');
select public.sbd_ok(public.sbd_n($$select 1 from public.push_subscriptions where user_id = 'aaaaaaaa-0000-4000-8000-00000000000a'$$) = 0, 'A''s push devices are gone');
select public.sbd_ok(public.sbd_n($$select 1 from public.group_messages where user_id = 'aaaaaaaa-0000-4000-8000-00000000000a'$$) = 0, 'A''s group messages are gone (rule: authored group content is deleted)');
select public.sbd_ok(public.sbd_n($$select 1 from public.group_members where user_id = 'aaaaaaaa-0000-4000-8000-00000000000a'$$) = 0, 'A is in no group any more');
select public.sbd_ok(public.sbd_n($$select 1 from storage.objects where name like 'aaaaaaaa-0000-4000-8000-00000000000a/%'$$) = 0, 'A''s file rows are gone (the Edge Function removes the file bytes)');
select public.sbd_ok(public.sbd_n($$select 1 from public.studyboard_rate where key like '%aaaaaaaa-0000-4000-8000-00000000000a'$$) = 0, 'A''s rate counters are gone');
-- groups
select public.sbd_ok((select owner_id from public.study_groups where id = '11111111-1111-4111-8111-111111111111') = 'bbbbbbbb-0000-4000-8000-00000000000b', 'G1 (A owned, B member) now belongs to B');
select public.sbd_ok((select role from public.group_members where group_id = '11111111-1111-4111-8111-111111111111' and user_id = 'bbbbbbbb-0000-4000-8000-00000000000b') = 'owner', 'B is marked owner in G1');
select public.sbd_ok(public.sbd_n($$select 1 from public.study_groups where id = '22222222-2222-4222-8222-222222222222'$$) = 0, 'G2 (A alone) was deleted');
select public.sbd_ok(public.sbd_n($$select 1 from public.study_groups where id = '33333333-3333-4333-8333-333333333333'$$) = 1, 'C''s group G3 survived');
-- anonymized bookkeeping
select public.sbd_ok(public.sbd_n($$select 1 from public.studyboard_pro_grants where email = 'a-delete-test@example.com'$$) = 0, 'no grant record keeps A''s email');
select public.sbd_ok(public.sbd_n($$select 1 from public.studyboard_pro_grants where user_id is null and email is null and reason is null$$) >= 1, 'A''s grant record is kept, anonymized (no user, email or reason)');
select public.sbd_ok(public.sbd_n($$select 1 from public.studyboard_billing_events where event_id = 'evt_a' and user_id is null$$) = 1, 'A''s billing event is kept but no longer linked to A');
select public.sbd_ok(public.sbd_n($$select 1 from public.group_reports where reported_user_id is null and reporter_id = 'bbbbbbbb-0000-4000-8000-00000000000b'$$) = 1, 'the report about A stays (safety) with no link to A');
-- others untouched
select public.sbd_ok(public.sbd_n($$select 1 from public.items where user_id = 'bbbbbbbb-0000-4000-8000-00000000000b'$$) = 1, 'B''s items are untouched');
select public.sbd_ok(public.sbd_n($$select 1 from public.items where user_id = 'cccccccc-0000-4000-8000-00000000000c'$$) = 1, 'C''s items are untouched');
select public.sbd_ok(public.sbd_n($$select 1 from public.studyboard_entitlements where user_id = 'bbbbbbbb-0000-4000-8000-00000000000b'$$) = 1, 'B''s plan is untouched');
select public.sbd_ok(public.sbd_n($$select 1 from public.studyboard_devices where user_id = 'bbbbbbbb-0000-4000-8000-00000000000b'$$) = 1, 'B''s devices are untouched');
select public.sbd_ok(public.sbd_n($$select 1 from public.bug_reports where user_id = 'bbbbbbbb-0000-4000-8000-00000000000b'$$) = 1, 'B''s bug report is untouched');
select public.sbd_ok(public.sbd_n($$select 1 from public.group_messages where user_id = 'bbbbbbbb-0000-4000-8000-00000000000b'$$) = 1, 'B''s group message is untouched');
select public.sbd_ok(public.sbd_n($$select 1 from public.calendar_feeds where token = 'tok-b-delete-test-0123456789abcdefghijklmnop'$$) = 1, 'B''s calendar link is untouched');
select public.sbd_ok(public.sbd_n($$select 1 from storage.objects where name like 'bbbbbbbb-0000-4000-8000-00000000000b/%'$$) = 1, 'B''s files are untouched');
select public.sbd_ok(public.sbd_n($$select 1 from public.studyboard_pro_grants where email = 'b-delete-test@example.com'$$) = 1, 'B''s grant record is untouched');
select public.sbd_ok(public.sbd_n($$select 1 from auth.users where id in ('bbbbbbbb-0000-4000-8000-00000000000b','cccccccc-0000-4000-8000-00000000000c')$$) = 2, 'B and C still have accounts');

do $$ begin raise notice 'ALL % ACCOUNT-DELETION CHECKS PASSED', (select count(*) from public.sbd_log); end $$;
select n, name from public.sbd_log order by n;
rollback;
