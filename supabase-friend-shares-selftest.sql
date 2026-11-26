-- Studyboard: sending to friends self-test
-- Run it in the SQL Editor after supabase-friend-shares.sql. It makes test accounts, checks the rules and rolls everything
-- back. Expect "ALL n FRIEND SHARE CHECKS PASSED".

begin;
create table public.sbx_log (n serial, name text);
grant all on public.sbx_log to public;
grant usage on sequence public.sbx_log_n_seq to public;
create function public.sbx_ok(c boolean, name text) returns void language plpgsql as $f$
begin if c is not true then raise exception 'FRIEND SHARE TEST FAILED: %', name; end if; insert into public.sbx_log (name) values (name); end $f$;
create function public.sbx_try(q text) returns text language plpgsql as $f$
declare n bigint; begin execute q; get diagnostics n = row_count; return 'ok:' || n; exception when others then return 'err:' || sqlstate || ':' || sqlerrm; end $f$;
create function public.sbx_val(q text) returns text language plpgsql as $f$
declare v text; begin execute q into v; return v; exception when others then return 'err:' || sqlerrm; end $f$;
create function public.sbx_as(uid text) returns void language plpgsql as $f$
begin perform set_config('request.jwt.claim.sub', uid, true); perform set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true); end $f$;
grant execute on function public.sbx_ok(boolean, text), public.sbx_try(text), public.sbx_val(text), public.sbx_as(text) to public;

-- Ann and Bob are friends; Cat is a stranger; Dan is Ann's friend but blocked her; Eve's request to Ann is still pending
insert into auth.users (id, email) values
  ('a2000000-0000-4000-8000-00000000000a', 'a-fs-test@example.com'), ('b2000000-0000-4000-8000-00000000000b', 'b-fs-test@example.com'),
  ('c2000000-0000-4000-8000-00000000000c', 'c-fs-test@example.com'), ('d2000000-0000-4000-8000-00000000000d', 'd-fs-test@example.com'),
  ('e2000000-0000-4000-8000-00000000000e', 'e-fs-test@example.com');
insert into public.study_profiles (user_id, display_name, birth_date) values
  ('a2000000-0000-4000-8000-00000000000a', 'Ann', '2004-01-01'), ('b2000000-0000-4000-8000-00000000000b', 'Bob', '2004-01-01'),
  ('c2000000-0000-4000-8000-00000000000c', 'Cat', '2004-01-01'), ('d2000000-0000-4000-8000-00000000000d', 'Dan', '2004-01-01'),
  ('e2000000-0000-4000-8000-00000000000e', 'Eve', '2004-01-01')
on conflict (user_id) do update set display_name = excluded.display_name, birth_date = excluded.birth_date;
insert into public.friendships (a, b, requested_by, status, accepted_at) values
  ('a2000000-0000-4000-8000-00000000000a', 'b2000000-0000-4000-8000-00000000000b', 'a2000000-0000-4000-8000-00000000000a', 'accepted', now()),
  ('a2000000-0000-4000-8000-00000000000a', 'd2000000-0000-4000-8000-00000000000d', 'a2000000-0000-4000-8000-00000000000a', 'accepted', now()),
  ('a2000000-0000-4000-8000-00000000000a', 'e2000000-0000-4000-8000-00000000000e', 'e2000000-0000-4000-8000-00000000000e', 'pending', null);
insert into public.group_blocks (blocker_id, blocked_id) values ('d2000000-0000-4000-8000-00000000000d', 'a2000000-0000-4000-8000-00000000000a');

set local role authenticated;

-- Sending
select public.sbx_as('a2000000-0000-4000-8000-00000000000a');
select public.sbx_ok(public.send_to_friends('deck', 'Cells', '2 cards', '{"cards":[{"front":"a","back":"b"}]}',
  array['b2000000-0000-4000-8000-00000000000b', 'c2000000-0000-4000-8000-00000000000c', 'd2000000-0000-4000-8000-00000000000d', 'e2000000-0000-4000-8000-00000000000e']::uuid[]) = 1,
  'Sent only to Bob: not a stranger, not someone who blocked you, not a pending request');
select public.sbx_ok(public.send_to_friends('deck', 'Cells', '3 cards', '{"cards":[]}', array['b2000000-0000-4000-8000-00000000000b']::uuid[]) = 1, 'Sending the same deck again...');
select public.sbx_ok(public.send_to_friends('map', 'Cell map', '4 ideas', '{"rec":{}}', array['b2000000-0000-4000-8000-00000000000b']::uuid[]) = 1, 'A concept map too');
select public.sbx_ok(public.sbx_try($$select public.send_to_friends('note', 'x', '', '{}', array['b2000000-0000-4000-8000-00000000000b']::uuid[])$$) like 'err:%Only decks%', 'Only decks, quizzes and maps');
select public.sbx_ok(public.sbx_try($$select public.send_to_friends('deck', 'x', '', null, array['b2000000-0000-4000-8000-00000000000b']::uuid[])$$) like 'err:%Nothing to send%', 'Something must be sent');
select public.sbx_ok(public.sbx_try($$select public.send_to_friends('deck', 'x', '', '{}', (select array_agg(gen_random_uuid()) from generate_series(1, 21)))$$) like 'err:%20 friends%', 'Up to 20 at a time');

-- Nobody reads anything directly that isn't theirs
select public.sbx_ok(public.sbx_val($$select count(*) from public.friend_shares$$) = '0', 'The sender can''t read what they sent');
select public.sbx_ok(public.sbx_try($$select * from public.friend_share_data$$) like 'err:42501%', 'The content can''t be read directly');
select public.sbx_ok(public.sbx_try($$insert into public.friend_shares (from_user, to_user, kind, title) values ('a2000000-0000-4000-8000-00000000000a', 'c2000000-0000-4000-8000-00000000000c', 'deck', 'x')$$) like 'err:42501%', 'No sending around the function');
select public.sbx_as('c2000000-0000-4000-8000-00000000000c');
select public.sbx_ok(public.sbx_val($$select count(*) from public.my_friend_shares()$$) = '0', 'Cat got nothing');

-- Receiving
select public.sbx_as('b2000000-0000-4000-8000-00000000000b');
select public.sbx_ok(public.sbx_val($$select count(*) from public.my_friend_shares()$$) = '2', 'Bob has 2 waiting (the deck sent twice counts once)');
select public.sbx_ok(public.sbx_val($$select info || '/' || from_name from public.my_friend_shares() where kind = 'deck'$$) = '3 cards/Ann', 'The newer copy replaced the older one, from Ann');
select public.sbx_ok(public.sbx_val($$select count(*) from public.friend_shares$$) = '2', 'Bob can read his own waiting rows (for the live note)');
create temp table ids as select id, kind from public.my_friend_shares();
grant select on ids to authenticated;
select public.sbx_ok(public.take_friend_share((select id from ids where kind = 'deck'), true) -> 'data' = '{"cards":[]}'::jsonb, 'Add returns the content');
select public.sbx_ok(public.sbx_try($$select public.take_friend_share((select id from ids where kind = 'deck'), true)$$) like 'err:%isn''t waiting%', 'Only once');
select public.sbx_ok(public.take_friend_share((select id from ids where kind = 'map'), false) is null, 'No Thanks returns nothing');
select public.sbx_ok(public.sbx_val($$select count(*) from public.my_friend_shares()$$) = '0', 'Both left the list');
select public.sbx_as('c2000000-0000-4000-8000-00000000000c');
select public.sbx_ok(public.sbx_try($$select public.take_friend_share((select id from ids where kind = 'deck'), true)$$) like 'err:%', 'Someone else can''t take it');
reset role;
select public.sbx_ok(not exists (select 1 from public.friend_share_data where id in (select id from ids)), 'The content is deleted once answered');

-- Account deletion clears it
set local role authenticated;
select public.sbx_as('a2000000-0000-4000-8000-00000000000a');
select public.send_to_friends('quiz', 'Quiz', '5 questions', '{"q":1}', array['b2000000-0000-4000-8000-00000000000b']::uuid[]);
reset role;
select public.studyboard_delete_user_data('a2000000-0000-4000-8000-00000000000a');
select public.sbx_ok(not exists (select 1 from public.friend_shares where from_user = 'a2000000-0000-4000-8000-00000000000a' or to_user = 'a2000000-0000-4000-8000-00000000000a'), 'Deleting an account removes what it sent and got');

do $$ begin raise notice 'ALL % FRIEND SHARE CHECKS PASSED', (select count(*) from public.sbx_log); end $$;
select n, name from public.sbx_log order by n;
rollback;
