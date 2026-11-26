-- Studyboard: friends self-test. Run it in the SQL Editor after supabase-friends.sql. It changes nothing: it rolls back.
-- Each check that fails stops it with "FRIENDS TEST FAILED: <which one>". At the end it lists every check that passed.

begin;
create table public.sbf_log (n serial, name text);
grant all on public.sbf_log to public;
grant usage on sequence public.sbf_log_n_seq to public;
create function public.sbf_ok(c boolean, name text) returns void language plpgsql as $f$
begin
  if c is not true then raise exception 'FRIENDS TEST FAILED: %', name; end if;
  insert into public.sbf_log (name) values (name);
end $f$;
-- runs a statement; 'ok' or the error's text
create function public.sbf_try(q text) returns text language plpgsql as $f$
begin execute q; return 'ok'; exception when others then return 'err:' || sqlstate || ':' || sqlerrm; end $f$;
create function public.sbf_val(q text) returns text language plpgsql as $f$
declare v text;
begin execute q into v; return v; exception when others then return 'err:' || sqlstate || ':' || sqlerrm; end $f$;
grant execute on function public.sbf_ok(boolean, text), public.sbf_try(text), public.sbf_val(text) to public;

-- Accounts (as the database owner): Ann, Bob, Cat and Eve are 13 or older; Dan has no birthday yet
insert into auth.users (id, email) values
  ('aaaaaaaa-0000-4000-8000-0000000000f1', 'ann-friends-test@example.com'), ('bbbbbbbb-0000-4000-8000-0000000000f2', 'bob-friends-test@example.com'),
  ('cccccccc-0000-4000-8000-0000000000f3', 'cat-friends-test@example.com'), ('dddddddd-0000-4000-8000-0000000000f4', 'dan-friends-test@example.com'),
  ('eeeeeeee-0000-4000-8000-0000000000f5', 'eve-friends-test@example.com');
insert into public.study_profiles (user_id, display_name, username, birth_date) values
  ('aaaaaaaa-0000-4000-8000-0000000000f1', 'Ann', 'ann.test', '2005-01-01'), ('bbbbbbbb-0000-4000-8000-0000000000f2', 'Bob', 'Bob_Test', '2005-01-01'),
  ('cccccccc-0000-4000-8000-0000000000f3', 'Cat', 'cat_test', '2005-01-01'), ('dddddddd-0000-4000-8000-0000000000f4', 'Dan', 'dan_test', null),
  ('eeeeeeee-0000-4000-8000-0000000000f5', 'Eve', 'eve_test', '2005-01-01');

set local role authenticated;

-- Nobody reads the tables directly
select set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-4000-8000-0000000000f1', true);
select public.sbf_ok(public.sbf_try('select * from public.friendships') like 'err:42501%', 'the friendships table can''t be read directly');
select public.sbf_ok(public.sbf_try('select * from public.friend_codes') like 'err:42501%', 'friend codes can''t be read directly');
select public.sbf_ok(public.sbf_try('insert into public.friendships (a, b, requested_by) values (''aaaaaaaa-0000-4000-8000-0000000000f1'', ''bbbbbbbb-0000-4000-8000-0000000000f2'', ''aaaaaaaa-0000-4000-8000-0000000000f1'')') like 'err:42501%', 'friendships can''t be written directly');
select public.sbf_ok(public.sbf_try('select public.sbf_ask(''aaaaaaaa-0000-4000-8000-0000000000f1'', ''bbbbbbbb-0000-4000-8000-0000000000f2'', ''username'')') like 'err:42501%', 'the helpers can''t be run directly');

-- Asking by username: any case, with or without the @
select public.sbf_ok(public.request_friend('@bob_TEST') = 'sent', 'Ann asks Bob by @username');
select public.sbf_ok((select count(*) from public.my_friends() where username = 'Bob_Test' and status = 'pending' and mine) = 1, 'Ann sees her request to Bob');
select public.sbf_ok(public.request_friend('bob_test') = 'sent', 'asking again changes nothing');
-- No way to tell whether a username exists
select public.sbf_ok(public.request_friend('nobody_by_this') = 'sent', 'an unknown username gets the same answer');
select public.sbf_ok(public.request_friend('dan_test') = 'sent', 'someone without a birthday gets the same answer');
select public.sbf_ok((select count(*) from public.my_friends()) = 1, '... and neither made a request');
select public.sbf_ok(public.sbf_try('select public.request_friend(''ann.test'')') like '%SB_FRIEND_SELF%', 'you can''t ask yourself');
select public.sbf_ok(public.sbf_try('select public.request_friend(''x'')') like '%SB_FRIEND_NAME%', 'a name that can''t be a username is refused');

-- Bob accepts
select set_config('request.jwt.claim.sub', 'bbbbbbbb-0000-4000-8000-0000000000f2', true);
select public.sbf_ok((select count(*) from public.my_friends() where display_name = 'Ann' and status = 'pending' and not mine and via = 'username') = 1, 'Bob sees Ann''s request');
select public.sbf_ok(public.answer_friend('aaaaaaaa-0000-4000-8000-0000000000f1', true), 'Bob accepts');
select public.sbf_ok((select count(*) from public.my_friends() where display_name = 'Ann' and status = 'accepted') = 1, 'Bob and Ann are friends (Bob''s side)');
select public.sbf_ok(not public.answer_friend('aaaaaaaa-0000-4000-8000-0000000000f1', true), 'accepting twice does nothing');
select set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-4000-8000-0000000000f1', true);
select public.sbf_ok((select count(*) from public.my_friends() where display_name = 'Bob' and status = 'accepted') = 1, 'Bob and Ann are friends (Ann''s side)');
select public.sbf_ok(public.request_friend('bob_test') = 'already', 'asking a friend says you''re already friends');
-- Only the person who was asked can accept
select public.sbf_ok(public.request_friend('cat_test') = 'sent', 'Ann asks Cat');
select public.sbf_ok(not public.answer_friend('cccccccc-0000-4000-8000-0000000000f3', true), 'Ann can''t accept her own request');

-- Asking someone who already asked you accepts
select set_config('request.jwt.claim.sub', 'cccccccc-0000-4000-8000-0000000000f3', true);
select public.sbf_ok(public.request_friend('ann.test') = 'accepted', 'Cat asks Ann back: friends');

-- Friend links
select set_config('request.jwt.claim.sub', 'bbbbbbbb-0000-4000-8000-0000000000f2', true);
create temp table sbf_code as select public.my_friend_code() as c;
grant select on sbf_code to public;
select public.sbf_ok((select c from sbf_code) ~ '^[A-Z0-9]{4}-[A-Z0-9]{4}$', 'Bob gets a friend link code');
select public.sbf_ok(public.my_friend_code() = (select c from sbf_code), 'the same code until he makes a new one');
select public.sbf_ok((select state from public.friend_link_preview((select c from sbf_code))) = 'self', 'his own link shows as his');
select set_config('request.jwt.claim.sub', 'cccccccc-0000-4000-8000-0000000000f3', true);
select public.sbf_ok((select display_name || '|' || username || '|' || state from public.friend_link_preview(lower(replace((select c from sbf_code), '-', ''))))
  = 'Bob|Bob_Test|none', 'Cat opens Bob''s link (any case, no dash): his name and @username');
select public.sbf_ok(public.request_friend_by_code((select c from sbf_code)) = 'sent', 'Cat asks Bob from his link');
select public.sbf_ok((select state from public.friend_link_preview((select c from sbf_code))) = 'asked', 'the link now shows the request');
select set_config('request.jwt.claim.sub', 'bbbbbbbb-0000-4000-8000-0000000000f2', true);
select public.sbf_ok((select via from public.my_friends() where display_name = 'Cat') = 'link', 'Bob sees it came from his link');
select public.sbf_ok(public.my_friend_code(true) <> (select c from sbf_code), 'Bob makes a new link');
select set_config('request.jwt.claim.sub', 'eeeeeeee-0000-4000-8000-0000000000f5', true);
select public.sbf_ok(public.sbf_try('select public.request_friend_by_code(''' || (select c from sbf_code) || ''')') like '%SB_FRIEND_LINK%', 'the old link stops working');
select public.sbf_ok((select count(*) from public.friend_link_preview((select c from sbf_code))) = 0, 'and shows nothing');

-- Declining and cancelling
select set_config('request.jwt.claim.sub', 'bbbbbbbb-0000-4000-8000-0000000000f2', true);
select public.sbf_ok(not public.answer_friend('cccccccc-0000-4000-8000-0000000000f3', false), 'Bob declines Cat');
select public.sbf_ok((select count(*) from public.my_friends() where display_name = 'Cat') = 0, 'the request is gone');
select public.sbf_ok(public.request_friend('eve_test') = 'sent', 'Bob asks Eve');
select public.remove_friend('eeeeeeee-0000-4000-8000-0000000000f5');
select set_config('request.jwt.claim.sub', 'eeeeeeee-0000-4000-8000-0000000000f5', true);
select public.sbf_ok((select count(*) from public.my_friends()) = 0, 'Bob cancels: Eve no longer sees it');

-- Blocking ends the friendship and stops new requests, both ways
select set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-4000-8000-0000000000f1', true);
insert into public.group_blocks (blocked_id) values ('bbbbbbbb-0000-4000-8000-0000000000f2');
select public.sbf_ok((select count(*) from public.my_friends() where display_name = 'Bob') = 0, 'Ann blocks Bob: no longer friends');
select set_config('request.jwt.claim.sub', 'bbbbbbbb-0000-4000-8000-0000000000f2', true);
select public.sbf_ok(public.request_friend('ann.test') = 'sent', 'Bob asks Ann: the usual answer');
select set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-4000-8000-0000000000f1', true);
select public.sbf_ok((select count(*) from public.my_friends() where display_name = 'Bob') = 0, '... but Ann gets nothing');
select public.sbf_ok(public.request_friend('bob_test') = 'sent' and (select count(*) from public.my_friends() where display_name = 'Bob') = 0, 'Ann can''t ask Bob either while he''s blocked');

-- Requests nobody answers go away after 30 days
reset role;
update public.friendships set created_at = now() - interval '31 days'
  where a = 'aaaaaaaa-0000-4000-8000-0000000000f1' and b = 'eeeeeeee-0000-4000-8000-0000000000f5';
insert into public.friendships (a, b, requested_by, created_at) values
  ('aaaaaaaa-0000-4000-8000-0000000000f1', 'eeeeeeee-0000-4000-8000-0000000000f5', 'eeeeeeee-0000-4000-8000-0000000000f5', now() - interval '31 days');
set local role authenticated;
select public.sbf_ok((select count(*) from public.my_friends() where display_name = 'Eve') = 0, 'a 31-day-old request isn''t shown');
select public.sbf_ok(not public.answer_friend('eeeeeeee-0000-4000-8000-0000000000f5', true), '... and can''t be accepted');

-- No birthday, or suspended: no friends features
select set_config('request.jwt.claim.sub', 'dddddddd-0000-4000-8000-0000000000f4', true);
select public.sbf_ok(public.sbf_try('select public.request_friend(''ann.test'')') like '%SB_FRIEND_AGE%', 'an account without a birthday can''t ask');
select public.sbf_ok(public.sbf_try('select public.my_friend_code()') like '%SB_FRIEND_AGE%', '... or make a friend link');
reset role;
insert into public.group_suspended (user_id) values ('eeeeeeee-0000-4000-8000-0000000000f5');
set local role authenticated;
select set_config('request.jwt.claim.sub', 'eeeeeeee-0000-4000-8000-0000000000f5', true);
select public.sbf_ok(public.sbf_try('select public.request_friend(''ann.test'')') like '%SB_FRIEND_SUSPENDED%', 'a suspended account can''t ask');
select set_config('request.jwt.claim.sub', 'cccccccc-0000-4000-8000-0000000000f3', true);
select public.sbf_ok(public.request_friend('eve_test') = 'sent' and (select count(*) from public.my_friends() where display_name = 'Eve') = 0, 'nobody can ask a suspended account');

-- At most 50 requests waiting on others
reset role;
insert into auth.users (id, email) select ('00000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid, 'many' || i || '-friends-test@example.com' from generate_series(1, 51) i;
insert into public.study_profiles (user_id, display_name, username, birth_date)
  select ('00000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid, 'Many ' || i, 'many_' || i, '2005-01-01' from generate_series(1, 51) i;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'cccccccc-0000-4000-8000-0000000000f3', true);
select public.request_friend('many_' || i) from generate_series(1, 50) i;
select public.sbf_ok(public.sbf_try('select public.request_friend(''many_51'')') like '%SB_FRIEND_WAITING%', 'the 51st waiting request is refused');

-- Signed out: nothing
reset role;
set local role anon;
select public.sbf_ok(public.sbf_try('select * from public.my_friends()') like 'err:42501%', 'signed-out visitors can''t list friends');
select public.sbf_ok(public.sbf_try('select public.request_friend(''ann.test'')') like 'err:42501%', '... or ask');
reset role;

select n, name as passed from public.sbf_log order by n;
rollback;
