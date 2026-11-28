-- Studyboard: Classmates and Course Hubs self-test
-- Run it in the SQL Editor after supabase-classmates.sql (and supabase-lean.sql). It makes test accounts, checks the
-- rules, and rolls everything back. Expect "ALL n CLASSMATES CHECKS PASSED".

begin;
create table public.sbc_log (n serial, name text);
grant all on public.sbc_log to public;
grant usage on sequence public.sbc_log_n_seq to public;
create function public.sbc_ok(c boolean, name text) returns void language plpgsql as $f$
begin
  if c is not true then raise exception 'CLASSMATES TEST FAILED: %', name; end if;
  insert into public.sbc_log (name) values (name);
end $f$;
create function public.sbc_try(q text) returns text language plpgsql as $f$
declare n bigint;
begin execute q; get diagnostics n = row_count; return 'ok:' || n; exception when others then return 'err:' || sqlstate || ':' || sqlerrm; end $f$;
create function public.sbc_val(q text) returns text language plpgsql as $f$
declare v text;
begin execute q into v; return v; exception when others then return 'err:' || sqlerrm; end $f$;
create function public.sbc_as(uid text) returns void language plpgsql as $f$
begin perform set_config('request.jwt.claim.sub', uid, true); perform set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true); end $f$;
grant execute on function public.sbc_ok(boolean, text), public.sbc_try(text), public.sbc_val(text), public.sbc_as(text) to public;
create function public.sbc_courses(n int, base int) returns jsonb language sql as $f$
  select jsonb_agg(jsonb_build_object('ref', 'r' || i, 'platform', 'cv', 'origin', 'https://canvas.limit.test', 'ou', (base + i)::text, 'label', 'C ' || i)) from generate_series(1, n) i
$f$;
grant execute on function public.sbc_courses(int, int) to public;

-- A, B, C, D are adults; T1 and T2 are 15; U has no birthday; E is an adult at another school
insert into auth.users (id, email) values
  ('a0000000-0000-4000-8000-00000000000a', 'a-cm-test@example.com'), ('b0000000-0000-4000-8000-00000000000b', 'b-cm-test@example.com'),
  ('c0000000-0000-4000-8000-00000000000c', 'c-cm-test@example.com'), ('d0000000-0000-4000-8000-00000000000d', 'd-cm-test@example.com'),
  ('e0000000-0000-4000-8000-00000000000e', 'e-cm-test@example.com'), ('f0000000-0000-4000-8000-0000000000f1', 't1-cm-test@example.com'),
  ('f0000000-0000-4000-8000-0000000000f2', 't2-cm-test@example.com'), ('f0000000-0000-4000-8000-0000000000ff', 'u-cm-test@example.com'),
  ('f0000000-0000-4000-8000-0000000000f9', 'l-cm-test@example.com');
insert into public.study_profiles (user_id, display_name, birth_date) values
  ('a0000000-0000-4000-8000-00000000000a', 'Ava', current_date - interval '20 years'), ('b0000000-0000-4000-8000-00000000000b', 'Ben', current_date - interval '19 years'),
  ('c0000000-0000-4000-8000-00000000000c', 'Cal', current_date - interval '22 years'), ('d0000000-0000-4000-8000-00000000000d', 'Dee', current_date - interval '25 years'),
  ('e0000000-0000-4000-8000-00000000000e', 'Eli', current_date - interval '21 years'), ('f0000000-0000-4000-8000-0000000000f1', 'Tia', current_date - interval '15 years'),
  ('f0000000-0000-4000-8000-0000000000f2', 'Teo', current_date - interval '15 years'), ('f0000000-0000-4000-8000-0000000000ff', 'Uma', null),
  ('f0000000-0000-4000-8000-0000000000f9', 'Lu', current_date - interval '30 years');
-- C blocked A
insert into public.group_blocks (blocker_id, blocked_id) values ('c0000000-0000-4000-8000-00000000000c', 'a0000000-0000-4000-8000-00000000000a');

set local role authenticated;

-- 1. Off until turned on
select public.sbc_as('a0000000-0000-4000-8000-00000000000a');
select public.sbc_ok((public.classmates_me() ->> 'visible')::boolean = false, 'Classmates starts off');
select public.sbc_ok(public.classmates_me() ->> 'band' = 'adult', 'A 20-year-old is an adult');
select public.sbc_ok(public.classmates_sync('[{"ref":"a1","platform":"cv","origin":"https://canvas.test.edu","ou":"101","label":"MATH 101"}]') = 0, 'Nothing is kept while off');
select public.sbc_ok(public.sbc_val($$select count(*) from public.classmates_summary()$$) = '0', 'No summary while off');

-- 2. A birthday is needed
select public.sbc_as('f0000000-0000-4000-8000-0000000000ff');
select public.sbc_ok(public.sbc_try($$select public.classmates_set_visible(true)$$) like 'err:%SB_AGE_NEEDED%', 'No birthday: can''t turn it on');

-- 3. Everyone (but D) turns it on and syncs the same course
select public.sbc_as('a0000000-0000-4000-8000-00000000000a'); select public.classmates_set_visible(true);
select public.sbc_ok(public.classmates_sync('[{"ref":"a1","platform":"cv","origin":"https://canvas.test.edu","ou":"101","label":"MATH 101"},{"ref":"a2","platform":"cv","origin":"https://canvas.test.edu","ou":"202","label":"HIST 202"},{"ref":"bad","platform":"zz","origin":"https://x.edu","ou":"1"},{"ref":"bad2","platform":"cv","origin":"http://insecure.edu","ou":"1"}]') = 2, 'Two good courses kept, bad ones skipped');
select public.sbc_as('b0000000-0000-4000-8000-00000000000b'); select public.classmates_set_visible(true);
select public.classmates_sync('[{"ref":"b-math","platform":"cv","origin":"https://CANVAS.test.edu","ou":"101","label":"Calculus I"}]');
select public.sbc_as('c0000000-0000-4000-8000-00000000000c'); select public.classmates_set_visible(true);
select public.classmates_sync('[{"ref":"c1","platform":"cv","origin":"https://canvas.test.edu","ou":"101","label":"MATH 101"}]');
select public.sbc_as('d0000000-0000-4000-8000-00000000000d');
select public.classmates_sync('[{"ref":"d1","platform":"cv","origin":"https://canvas.test.edu","ou":"101","label":"MATH 101"}]');
select public.sbc_as('e0000000-0000-4000-8000-00000000000e'); select public.classmates_set_visible(true);
select public.classmates_sync('[{"ref":"e1","platform":"cv","origin":"https://canvas.other.edu","ou":"101","label":"MATH 101"}]');
select public.sbc_as('f0000000-0000-4000-8000-0000000000f1'); select public.classmates_set_visible(true);
select public.classmates_sync('[{"ref":"t1","platform":"cv","origin":"https://canvas.test.edu","ou":"101","label":"MATH 101"}]');
select public.sbc_as('f0000000-0000-4000-8000-0000000000f2'); select public.classmates_set_visible(true);
select public.classmates_sync('[{"ref":"t2","platform":"cv","origin":"https://canvas.test.edu","ou":"101","label":"MATH 101"}]');

-- 4. Who sees whom
select public.sbc_as('a0000000-0000-4000-8000-00000000000a');
select public.sbc_ok(public.sbc_val($$select classmates from public.classmates_summary() where ref = 'a1'$$) = '1', 'A sees 1 classmate in MATH 101 (B; not blocked C, invisible D, teens, or another school)');
select public.sbc_ok(public.sbc_val($$select classmates from public.classmates_summary() where ref = 'a2'$$) = '0', 'Nobody else in HIST 202');
select public.sbc_ok(public.sbc_val($$select string_agg(name, ',') from public.classmates_list('a1')$$) = 'Ben', 'A''s list is just Ben');
select public.sbc_ok(public.sbc_val($$select count(*) from public.classmates_list('b-math')$$) = '0', 'A can''t list a course by someone else''s ref');
select public.sbc_as('c0000000-0000-4000-8000-00000000000c');
select public.sbc_ok(public.sbc_val($$select string_agg(name, ',') from public.classmates_list('c1')$$) = 'Ben', 'C (who blocked A) doesn''t see A');
select public.sbc_as('f0000000-0000-4000-8000-0000000000f1');
select public.sbc_ok(public.sbc_val($$select string_agg(name, ',') from public.classmates_list('t1')$$) = 'Teo', 'A teen sees only the other teen');
select public.sbc_as('d0000000-0000-4000-8000-00000000000d');
select public.sbc_ok(public.sbc_val($$select count(*) from public.classmates_list('d1')$$) = '0', 'Someone who is off sees nobody');

-- 5. Nothing is readable directly, and the school site's address and course id aren't stored
select public.sbc_ok(public.sbc_try($$select * from public.course_presence$$) like 'err:42501%', 'course_presence can''t be read directly');
select public.sbc_ok(public.sbc_try($$select * from public.classmates_secret$$) like 'err:42501%', 'The secret can''t be read');
select public.sbc_ok(public.sbc_try($$select * from public.classmates_settings$$) like 'err:42501%', 'Settings can''t be read directly');
select public.sbc_ok(public.sbc_try($$select public.sbcm_key('cv', 'https://canvas.test.edu', '101')$$) like 'err:42501%', 'Course keys can''t be made from outside');
select public.sbc_ok(public.sbc_try($$select public.classmates_purge()$$) like 'err:42501%', 'Purge is for the server only');
reset role;
select public.sbc_ok(not exists (select 1 from public.course_presence where course_key !~ '^[0-9a-f]{64}$' or course_key ~ 'canvas'), 'Only a 64-character hash is stored');
select public.sbc_ok((select count(distinct course_key) from public.course_presence where ref in ('a1', 'b-math', 'c1')) = 1, 'Same site (any letter case) and course: same key');
set local role authenticated;

-- 6. Course Hubs: one per course and age group
select public.sbc_as('a0000000-0000-4000-8000-00000000000a');
create temp table hub_ids (who text, id uuid);
grant all on hub_ids to authenticated;
insert into hub_ids select 'a', public.classmates_join_hub('a1');
select public.sbc_as('b0000000-0000-4000-8000-00000000000b');
insert into hub_ids select 'b', public.classmates_join_hub('b-math');
select public.sbc_as('f0000000-0000-4000-8000-0000000000f1');
insert into hub_ids select 't1', public.classmates_join_hub('t1');
select public.sbc_ok((select id from hub_ids where who = 'a') = (select id from hub_ids where who = 'b'), 'A and B share one hub');
select public.sbc_ok((select id from hub_ids where who = 'a') <> (select id from hub_ids where who = 't1'), 'The teen hub is a different group');
select public.sbc_as('d0000000-0000-4000-8000-00000000000d');
select public.sbc_ok(public.sbc_try($$select public.classmates_join_hub('d1')$$) like 'err:%SB_CM_OFF%', 'Someone who is off can''t join');
select public.sbc_as('e0000000-0000-4000-8000-00000000000e');
select public.sbc_ok(public.sbc_try($$select public.classmates_join_hub('a1')$$) like 'err:%SB_CM_COURSE%', 'A hub can''t be joined with a course you don''t have');
select public.sbc_as('b0000000-0000-4000-8000-00000000000b');
select public.sbc_ok(public.sbc_val($$select classmates from public.classmates_summary() where ref = 'b-math'$$) = '2', 'B sees A and C');
select public.sbc_ok(public.sbc_val($$select hub_members from public.classmates_summary() where ref = 'b-math'$$) = '2', 'The summary counts the hub''s members');
select public.sbc_ok(public.sbc_val($$select in_hub from public.classmates_summary() where ref = 'b-math'$$) = 'true', 'B is in the hub');
select public.sbc_ok(public.sbc_val(format($$select kind || '/' || name from public.study_groups where id = %L$$, (select id from hub_ids where who = 'a'))) = 'course/MATH 101', 'The hub is a course group named after the first label');

-- 7. A hub has no owner powers, not even for whoever started it
select public.sbc_as('a0000000-0000-4000-8000-00000000000a');
select public.sbc_ok(public.sbc_try(format($$update public.study_groups set name = 'Mine' where id = %L$$, (select id from hub_ids where who = 'a'))) = 'ok:0', 'The starter can''t rename the hub');
select public.sbc_ok(public.sbc_try(format($$delete from public.study_groups where id = %L$$, (select id from hub_ids where who = 'a'))) = 'ok:0', 'The starter can''t delete the hub');
select public.sbc_ok(public.sbc_try(format($$delete from public.group_members where group_id = %L and user_id = 'b0000000-0000-4000-8000-00000000000b'$$, (select id from hub_ids where who = 'a'))) = 'ok:0', 'The starter can''t remove people');
select public.sbc_ok(public.sbc_try(format($$select public.new_group_code(%L)$$, (select id from hub_ids where who = 'a'))) like 'err:%', 'The starter can''t make a new invite code');
select public.sbc_ok(public.sbc_try(format($$select public.set_group_kind(%L, 'study', null)$$, (select id from hub_ids where who = 'a'))) like 'err:%', 'A hub can''t be turned into a normal group');
select public.sbc_ok(public.sbc_val(format($$select string_agg(distinct role, ',') from public.group_members where group_id = %L$$, (select id from hub_ids where who = 'a'))) = 'member', 'Everyone in a hub is a member');

-- 8. Invite codes don't open hubs
select public.sbc_as('e0000000-0000-4000-8000-00000000000e');
reset role;
create temp table hub_code as select invite_code from public.study_groups where id = (select id from hub_ids where who = 'a');
grant select on hub_code to authenticated;
set local role authenticated;
select public.sbc_ok(public.sbc_val($$select count(*) from public.group_preview((select invite_code from hub_code))$$) = '0', 'A hub''s code shows nothing');
select public.sbc_ok(public.sbc_val($$select public.join_group((select invite_code from hub_code))$$) is null, 'A hub''s code doesn''t join it');

-- 9. Leaving works for everyone, including the starter
select public.sbc_as('a0000000-0000-4000-8000-00000000000a');
select public.sbc_ok(public.sbc_try(format($$delete from public.group_members where group_id = %L and user_id = 'a0000000-0000-4000-8000-00000000000a'$$, (select id from hub_ids where who = 'a'))) = 'ok:1', 'The starter can leave');
select public.sbc_ok(public.classmates_join_hub('a1') = (select id from hub_ids where who = 'a'), 'And join again');

-- 10. Turning it off removes your courses at once
select public.classmates_set_visible(false);
select public.sbc_as('b0000000-0000-4000-8000-00000000000b');
select public.sbc_ok(public.sbc_val($$select classmates from public.classmates_summary() where ref = 'b-math'$$) = '1', 'After A turns it off, B sees only C');
reset role;
select public.sbc_ok(not exists (select 1 from public.course_presence where user_id = 'a0000000-0000-4000-8000-00000000000a'), 'A''s courses are gone');
set local role authenticated;

-- 11. Turning 18 moves you out of the teen hub
reset role;
update public.study_profiles set birth_date = current_date - interval '18 years' where user_id = 'f0000000-0000-4000-8000-0000000000f1';
set local role authenticated;
select public.sbc_as('f0000000-0000-4000-8000-0000000000f1');
select public.classmates_sync('[{"ref":"t1","platform":"cv","origin":"https://canvas.test.edu","ou":"101","label":"MATH 101"}]');
select public.sbc_ok(public.sbc_val(format($$select count(*) from public.group_members where group_id = %L and user_id = 'f0000000-0000-4000-8000-0000000000f1'$$, (select id from hub_ids where who = 't1'))) = '0', 'A new adult leaves the teen hub');
select public.sbc_ok(public.sbc_val($$select hub_id from public.classmates_summary() where ref = 't1'$$) = (select id::text from hub_ids where who = 'a'), 'And now sees the adult hub');

-- 12. Limits: 40 courses a send, 80 different courses in 30 days, 30 sends an hour
select public.sbc_as('f0000000-0000-4000-8000-0000000000f9'); select public.classmates_set_visible(true);
select public.sbc_ok(public.sbc_try($$select public.classmates_sync(public.sbc_courses(41, 0))$$) like 'err:%40 courses%', 'More than 40 courses is refused');
select public.sbc_ok(public.classmates_sync(public.sbc_courses(40, 0)) = 40, '40 new courses');
select public.sbc_ok(public.classmates_sync(public.sbc_courses(40, 1000)) = 40, '40 more new courses');
select public.sbc_ok(public.classmates_sync(public.sbc_courses(40, 2000)) = 0, 'No more new courses after 80 in 30 days');
select public.sbc_ok(public.classmates_sync(public.sbc_courses(40, 1000)) = 40, 'Courses already sent still work');
do $$ begin for i in 1..26 loop perform public.classmates_sync(public.sbc_courses(1, 0)); end loop; end $$;
select public.sbc_ok(public.sbc_try($$select public.classmates_sync(public.sbc_courses(1, 0))$$) like 'err:%SB_SLOW%', 'The 31st send in an hour waits');

-- 13. Deleting an account removes its Classmates rows
reset role;
select public.studyboard_delete_user_data('b0000000-0000-4000-8000-00000000000b');
select public.sbc_ok(not exists (select 1 from public.course_presence where user_id = 'b0000000-0000-4000-8000-00000000000b')
  and not exists (select 1 from public.classmates_settings where user_id = 'b0000000-0000-4000-8000-00000000000b')
  and not exists (select 1 from public.classmates_key_log where user_id = 'b0000000-0000-4000-8000-00000000000b'), 'Account deletion removes Classmates rows');
select public.sbc_ok(exists (select 1 from public.study_groups where id = (select id from hub_ids where who = 'a') and deleted_at is null)
  and not exists (select 1 from public.group_members where group_id = (select id from hub_ids where who = 'a') and role = 'owner'), 'The hub stays, still with no owner');

do $$ begin raise notice 'ALL % CLASSMATES CHECKS PASSED', (select count(*) from public.sbc_log); end $$;
select n, name from public.sbc_log order by n;
rollback;
