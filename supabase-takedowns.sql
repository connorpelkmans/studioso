-- Studyboard: copyright takedowns (DMCA notices and counter-notices)
-- Ready-made functions you run in the Supabase SQL Editor when a copyright notice or report comes in. Nobody else can run
-- them: the app and signed-in users can't. Step by step, with email wording: COPYRIGHT-TAKEDOWNS.md.
-- Run this after supabase-groups.sql, supabase-moderation.sql, supabase-sharing.sql and supabase-plans.sql. Safe to run again.
--
--   select * from public.studyboard_copyright_reports();                          -- copyright reports waiting for you
--   select public.studyboard_takedown_share('ABCD-1234', 'Notice from X, 2026-11-20');   -- a deck, note, quiz or whiteboard link (and its public page)
--   select public.studyboard_takedown_board('<board id>', 'Notice from X');      -- the pictures on a live group whiteboard
--   select public.studyboard_takedown_board('<board id>', 'Notice from X', '<picture id>');   -- one picture on it
--   select public.studyboard_takedown_group_item('<item id>', 'Notice from X');  -- a deck, quiz, file or link shared in a group
--   select * from public.studyboard_takedowns(null);                             -- every takedown (or pass an email for one person's)
--   select public.studyboard_restore_takedown('<takedown id>', 'Counter-notice, no lawsuit filed');   -- put it back
--
-- Each takedown is a strike against whoever shared it. At 3 strikes that aren't restored, the person can no longer share
-- publicly or use study groups (studyboard_suspend_from_groups), as the Terms say about repeat infringers.

create table if not exists public.copyright_takedowns (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  kind text not null check (kind in ('deck', 'note', 'quiz', 'board_link', 'board', 'group_item', 'group_file')),
  ref text not null check (char_length(ref) between 1 and 400),   -- share code, group board id, group item id, or the file's storage path
  title text not null default '',
  owner_id uuid references auth.users(id) on delete set null,      -- who shared it (the strike is theirs)
  notice text not null default '' check (char_length(notice) <= 1000),   -- your reference: who complained, when, about what
  detail jsonb not null default '{}'::jsonb,                        -- what's needed to put it back
  restored_at timestamptz,
  restore_note text check (restore_note is null or char_length(restore_note) <= 1000)
);
create index if not exists copyright_takedowns_owner on public.copyright_takedowns (owner_id, created_at desc);
create index if not exists copyright_takedowns_ref on public.copyright_takedowns (kind, ref) where restored_at is null;
alter table public.copyright_takedowns enable row level security;   -- no policies: only you (SQL Editor, dashboard)
revoke all on public.copyright_takedowns from public, anon, authenticated;

-- Strikes that still count, and suspension at 3
create or replace function public.sbt_strikes(p_uid uuid) returns int
language sql stable security definer set search_path = public as $$
  select count(*)::int from public.copyright_takedowns where owner_id = p_uid and restored_at is null
$$;
create or replace function public.sbt_after(p_uid uuid) returns text
language plpgsql security definer set search_path = public as $$
declare n int; em text;
begin
  if p_uid is null then return 'No account to give a strike to.'; end if;
  n := public.sbt_strikes(p_uid);
  select email into em from auth.users where id = p_uid;
  if n >= 3 and em is not null and not exists (select 1 from public.group_suspended where user_id = p_uid) then
    perform public.studyboard_suspend_from_groups(em, 'Repeated copyright takedowns');
    return format('Strike %s for %s: that is 3, so they can no longer share publicly or use study groups (undo: select public.studyboard_unsuspend_from_groups(%L);).', n, em, em);
  end if;
  return format('Strike %s of 3 for %s. Email them that it was removed (COPYRIGHT-TAKEDOWNS.md has the wording).', n, coalesce(em, 'a deleted account'));
end $$;
revoke all on function public.sbt_strikes(uuid), public.sbt_after(uuid) from public, anon, authenticated;

-- Copyright reports waiting for review: shared links and pages (share_reports) and study groups (group_reports)
create or replace function public.studyboard_copyright_reports()
returns table (reported_at timestamptz, source text, what text, ref text, title text, details text, report_id uuid)
language sql stable security definer set search_path = public as $$
  select r.created_at, 'link'::text, r.kind, r.code,
         coalesce((select d.name from public.shared_decks d where d.code = r.code), (select i.title from public.shared_items i where i.code = r.code), ''),
         r.details, r.id
    from public.share_reports r
    where r.status in ('new', 'reviewing') and (r.reason = 'copyright' or r.details like '[copyright]%')
  union all
  select r.created_at, 'group'::text, r.target_kind, r.target_id, coalesce(r.excerpt, ''), r.details, r.id
    from public.group_reports r
    where r.status in ('new', 'reviewing') and (r.reason = 'copyright' or r.details like '[copyright]%')
  order by 1
$$;
revoke all on function public.studyboard_copyright_reports() from public, anon, authenticated;

-- A deck, note, quiz or whiteboard shared with a link (and its page in Studyboard Flashcards or Quizzes): the link stops
-- working for everyone but its owner, and the page, search and Course Library listings go
create or replace function public.studyboard_takedown_share(p_code text, p_notice text) returns text
language plpgsql security definer set search_path = public as $$
declare k text := public.sbg_norm_code(p_code); d record; i record; tid uuid; kd text;
begin
  select * into d from public.shared_decks where code = k;
  if found then
    insert into public.copyright_takedowns (kind, ref, title, owner_id, notice, detail)
      values ('deck', k, d.name, d.owner_id, left(coalesce(p_notice, ''), 1000), jsonb_build_object('published', d.published, 'listed', d.listed)) returning id into tid;
    update public.shared_decks set hidden = true, published = false, listed = false where code = k;
    update public.share_reports set status = 'actioned' where code = k and status in ('new', 'reviewing');
    return format('Took down deck %s ("%s"). Takedown id %s. ', k, d.name, tid) || public.sbt_after(d.owner_id);
  end if;
  select * into i from public.shared_items where code = k;
  if not found then raise exception 'No shared deck, note, quiz or whiteboard has the code %', k; end if;
  kd := case i.kind when 'board' then 'board_link' else i.kind end;
  insert into public.copyright_takedowns (kind, ref, title, owner_id, notice, detail)
    values (kd, k, i.title, i.owner_id, left(coalesce(p_notice, ''), 1000), jsonb_build_object('published', i.published)) returning id into tid;
  update public.shared_items set hidden = true, published = false where code = k;
  update public.share_reports set status = 'actioned' where code = k and status in ('new', 'reviewing');
  return format('Took down %s %s ("%s"). Takedown id %s. ', i.kind, k, i.title, tid) || public.sbt_after(i.owner_id);
end $$;

-- Pictures on a live group whiteboard (all of them, or one by its id): they're taken out of the board's history and every
-- member's copy removes them the next time it syncs (at once for anyone with the board open)
create or replace function public.studyboard_takedown_board(p_board uuid, p_notice text, p_picture text default null) returns text
language plpgsql security definer set search_path = public as $$
declare b record; pics text[]; who uuid; tid uuid; msg text := ''; i int; claims text := current_setting('request.jwt.claims', true);
begin
  select * into b from public.group_boards where id = p_board;
  if not found then raise exception 'No group whiteboard has the id %', p_board; end if;
  select array_agg(distinct e ->> 'id') into pics from public.group_board_ops o, jsonb_array_elements(o.ch) e
    where o.board_id = p_board and e ->> 't' = 'i' and e -> 'v' ->> 'k' = 'i' and (p_picture is null or e ->> 'id' = p_picture);
  if coalesce(cardinality(pics), 0) = 0 then raise exception 'That whiteboard has no pictures%', case when p_picture is null then '' else ' with the id ' || p_picture end; end if;
  -- a strike for each member who added one of them
  for who in select distinct o.user_id from public.group_board_ops o, jsonb_array_elements(o.ch) e
      where o.board_id = p_board and e ->> 't' = 'i' and e -> 'v' ->> 'k' = 'i' and e ->> 'id' = any(pics) loop
    insert into public.copyright_takedowns (kind, ref, title, owner_id, notice, detail)
      values ('board', p_board::text, b.name, who, left(coalesce(p_notice, ''), 1000),
        jsonb_build_object('group_id', b.group_id, 'pictures', (select to_jsonb(array_agg(distinct e ->> 'id')) from public.group_board_ops o, jsonb_array_elements(o.ch) e
          where o.board_id = p_board and o.user_id = who and e ->> 't' = 'i' and e -> 'v' ->> 'k' = 'i' and e ->> 'id' = any(pics))))
      returning id into tid;
    msg := msg || format('Takedown id %s. ', tid) || public.sbt_after(who) || ' ';
  end loop;
  -- out of the history: changes that held only those pictures go, the rest keep everything else
  delete from public.group_board_ops o where o.board_id = p_board
    and not exists (select 1 from jsonb_array_elements(o.ch) e where not (e ->> 't' = 'i' and e ->> 'id' = any(pics)));
  update public.group_board_ops o set ch = (select jsonb_agg(e) from jsonb_array_elements(o.ch) e where not (e ->> 't' = 'i' and e ->> 'id' = any(pics)))
    where o.board_id = p_board and exists (select 1 from jsonb_array_elements(o.ch) e where e ->> 't' = 'i' and e ->> 'id' = any(pics));
  -- a removal every member's copy applies, as if the picture had been deleted on the board. It's sent as the board's
  -- maker (the board's triggers stamp the signed-in person on every change, and the SQL Editor has none)
  perform set_config('request.jwt.claims', jsonb_build_object('sub', coalesce(b.created_by, who), 'role', 'authenticated')::text, true);
  for i in 0 .. (cardinality(pics) - 1) / 200 loop
    insert into public.group_board_ops (board_id, group_id, user_id, ch, tag)
      values (p_board, b.group_id, coalesce(b.created_by, who),
        (select jsonb_agg(jsonb_build_object('t', 'i', 'id', x, 'v', null)) from unnest(pics[i * 200 + 1 : i * 200 + 200]) x), 'takedown');
  end loop;
  perform set_config('request.jwt.claims', coalesce(claims, ''), true);
  update public.group_boards set preview = null, preview_dark = null, updated_at = now() where id = p_board;   -- redrawn without them
  update public.group_reports set status = 'actioned' where target_kind = 'board' and target_id = p_board::text and status in ('new', 'reviewing');
  return format('Removed %s picture(s) from the whiteboard "%s". ', cardinality(pics), b.name) || msg
    || 'These can''t be put back by restoring; after a counter-notice, the member can add the picture again.';
end $$;

-- Something shared in a study group: a deck, quiz, file, link or anything else. The item is removed for everyone; a file
-- uploaded to the group (Group Uploads) can no longer be opened by members (its uploader keeps it in their own folder)
create or replace function public.studyboard_takedown_group_item(p_item uuid, p_notice text) returns text
language plpgsql security definer set search_path = public as $$
declare it record; tid uuid; kd text;
begin
  select * into it from public.group_items where id = p_item;
  if not found then raise exception 'No group item has the id %', p_item; end if;
  kd := case when it.kind = 'gfile' then 'group_file' else 'group_item' end;
  insert into public.copyright_takedowns (kind, ref, title, owner_id, notice, detail)
    values (kd, case when kd = 'group_file' then coalesce(nullif(it.data ->> 'path', ''), it.ref_id) else it.id::text end, it.title, it.user_id,
      left(coalesce(p_notice, ''), 1000), jsonb_build_object('item', to_jsonb(it))) returning id into tid;
  delete from public.group_items where id = p_item;
  update public.group_reports set status = 'actioned' where target_kind = 'item' and target_id = p_item::text and status in ('new', 'reviewing');
  return format('Removed "%s" (%s) from its group. Takedown id %s. ', it.title, it.kind, tid) || public.sbt_after(it.user_id);
end $$;

-- Takedowns, newest first: everyone's, or one person's (by email)
create or replace function public.studyboard_takedowns(p_email text default null)
returns table (id uuid, created_at timestamptz, kind text, ref text, title text, shared_by text, notice text, restored_at timestamptz, strikes int)
language sql stable security definer set search_path = public as $$
  select t.id, t.created_at, t.kind, t.ref, t.title, u.email, t.notice, t.restored_at, public.sbt_strikes(t.owner_id)
    from public.copyright_takedowns t left join auth.users u on u.id = t.owner_id
    where p_email is null or lower(u.email) = lower(btrim(p_email))
    order by t.created_at desc
$$;

-- After a counter-notice (10 to 14 business days, and no court case): put it back and take away the strike
create or replace function public.studyboard_restore_takedown(p_id uuid, p_note text) returns text
language plpgsql security definer set search_path = public as $$
declare t record; it jsonb; claims text := current_setting('request.jwt.claims', true);
begin
  select * into t from public.copyright_takedowns where id = p_id;
  if not found then raise exception 'No takedown has the id %', p_id; end if;
  if t.restored_at is not null then return 'Already restored on ' || t.restored_at::date; end if;
  if t.kind = 'deck' then
    update public.shared_decks set hidden = false, published = coalesce((t.detail ->> 'published')::boolean, false), listed = coalesce((t.detail ->> 'listed')::boolean, false) where code = t.ref;
  elsif t.kind in ('note', 'quiz', 'board_link') then
    update public.shared_items set hidden = false, published = coalesce((t.detail ->> 'published')::boolean, false) where code = t.ref;
  elsif t.kind in ('group_item', 'group_file') then
    it := t.detail -> 'item';
    if it is not null and exists (select 1 from public.study_groups where id = (it ->> 'group_id')::uuid) and not exists (select 1 from public.group_items where id = (it ->> 'id')::uuid) then
      -- as the person who shared it (the group's triggers stamp the signed-in person on what's added)
      perform set_config('request.jwt.claims', jsonb_build_object('sub', it ->> 'user_id', 'role', 'authenticated')::text, true);
      insert into public.group_items select * from jsonb_populate_record(null::public.group_items, it);
      perform set_config('request.jwt.claims', coalesce(claims, ''), true);
    end if;
  end if;
  update public.copyright_takedowns set restored_at = now(), restore_note = left(coalesce(p_note, ''), 1000) where id = p_id;
  return case when t.kind = 'board' then 'Strike removed. Pictures taken off a whiteboard can''t be put back: tell the member they can add it again.'
    else format('Put back %s "%s" and removed the strike (%s left). If they were suspended at 3 strikes, undo it with studyboard_unsuspend_from_groups.', t.kind, t.title, public.sbt_strikes(t.owner_id)) end;
end $$;

revoke all on function public.studyboard_takedown_share(text, text), public.studyboard_takedown_board(uuid, text, text), public.studyboard_takedown_group_item(uuid, text),
  public.studyboard_takedowns(text), public.studyboard_restore_takedown(uuid, text) from public, anon, authenticated;

-- Account deletion (supabase-lean.sql) keeps the takedown record without the account (owner_id becomes null)
notify pgrst, 'reload schema';
