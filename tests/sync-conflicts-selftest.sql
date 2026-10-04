-- Self-test for supabase-sync-conflicts.sql. Run it on a scratch database AFTER the setup, lean, plans and sync-conflicts files.
-- It makes two fake users, exercises the compare-and-set functions, and rolls everything back. Any "ASSERT" failure raises an error.
begin;
insert into auth.users (id, email) values ('aaaaaaaa-0000-0000-0000-000000000001', 'sync-a@test'), ('aaaaaaaa-0000-0000-0000-000000000002', 'sync-b@test');
set local role authenticated;
select set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-0000-0000-000000000001', true);
do $$
declare r jsonb; v int;
begin
  r := public.studyboard_item_put('note', 'n1', '{"text":"a"}', 0, 'devA');
  assert (r->>'ok')::bool and (r->>'rev')::int = 1, 'insert starts at rev 1';
  r := public.studyboard_item_put('note', 'n1', '{"text":"a2"}', 1, 'devA');
  assert (r->>'ok')::bool and (r->>'rev')::int = 2, 'compare-and-set at the current rev';
  r := public.studyboard_item_put('note', 'n1', '{"text":"stale"}', 1, 'devB');
  assert not (r->>'ok')::bool and (r->>'conflict')::bool and r->'data'->>'text' = 'a2', 'a stale device is refused and gets the current row';
  assert (select data->>'text' from public.items where id = 'n1') = 'a2', 'a refused write changes nothing';
  r := public.studyboard_item_put('note', 'n1', '{"text":"a2"}', 1, 'devC');
  assert (r->>'ok')::bool and (r->>'same')::bool, 'identical content is not a conflict';
  update public.items set data = '{"text":"legacy"}' where id = 'n1';
  assert (select rev from public.items where id = 'n1') = 3, 'a direct (older app) write still bumps rev';
  r := public.studyboard_item_delete('note', 'n1', 2);
  assert not (r->>'ok')::bool and (select count(*) from public.items where id = 'n1') = 1, 'a stale delete is refused';
  r := public.studyboard_item_delete('note', 'n1', 3);
  assert (r->>'ok')::bool and (select count(*) from public.items where id = 'n1') = 0, 'a current delete works';
  r := public.studyboard_item_put('note', 'n1', '{"text":"edit after delete"}', 3, 'devB');
  assert (r->>'ok')::bool and (r->>'restored')::bool, 'an edit based on a deleted row restores it, never silently dropped';
  r := public.studyboard_item_put('note', 'n2', '{"t":1}', 0, 'devA', now() + interval '3 days');
  assert (select edited_at <= now() from public.items where id = 'n2'), 'edited_at is never in the future';
end $$;
select set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-0000-0000-000000000002', true);
do $$ begin
  assert (select count(*) from public.items) = 0, 'RLS: another account sees nothing';
  perform public.studyboard_item_put('note', 'n1', '{"text":"user two"}', 0, 'devZ');
end $$;
select set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-0000-0000-000000000001', true);
do $$ begin assert (select data->>'text' from public.items where id = 'n1') = 'edit after delete', 'RLS: another account cannot touch my row'; end $$;
reset role; set local role anon;
do $$ begin
  begin perform public.studyboard_item_put('note', 'x', '{}', 0, 'z'); assert false, 'anon must not call it';
  exception when insufficient_privilege then null; end;
end $$;
rollback;
select 'sync-conflicts self-test passed' as result;
