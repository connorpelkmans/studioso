-- Studyboard: public share links (decks, notes, quizzes) and the Course Library
--
-- Run this in Supabase (SQL Editor > New query > paste everything > Run) AFTER supabase-groups.sql and supabase-moderation.sql.
-- It is safe to run again.
--
-- What it adds:
--  * Public share links. A deck shared with a link (share_deck in supabase-groups.sql) can now be opened by anyone with the link,
--    signed in or not, through get_public_share. Notes and quizzes get links too (shared_items). The link opens the Studyboard website,
--    which shows the deck, note or quiz read-only with a "Study This in Studyboard" button. Only what was shared is sent: the text
--    of the cards, note or quiz and the sharer's display name. Never their account id, email or study progress.
--  * The Course Library: a shared deck can also be listed for its course (course code + school), so classmates who add that course
--    find it. Listing is a separate choice from making a link, and can be undone any time.
--  * Reports: anyone signed in can report a shared deck, note or quiz. Three reports from different people hide it from the library
--    and from its link until you review it.
--
-- Reviewing reports (SQL Editor), newest first:
--   select r.created_at, r.reason, r.details, r.code, r.kind, coalesce(d.name, i.title) as title,
--          coalesce(d.sharer_name, i.sharer_name) as sharer, coalesce(d.owner_id, i.owner_id) as owner_id
--   from public.share_reports r
--   left join public.shared_decks d on d.code = r.code
--   left join public.shared_items i on i.code = r.code
--   where r.status = 'new' order by r.created_at desc;
-- Acting on one:
--   update public.shared_decks set hidden = true where code = '<code>';     -- or shared_items; false brings it back
--   delete from public.shared_decks where code = '<code>';                  -- remove it for good (people who added it keep their copy)
--   select public.studyboard_suspend_from_groups('<their email>', '<why>'); -- also stops them sharing and listing
--   update public.share_reports set status = 'actioned' where code = '<code>';

-- ---------- Library columns on shared decks ----------
alter table public.shared_decks add column if not exists listed boolean not null default false;
alter table public.shared_decks add column if not exists course_key text not null default '';
alter table public.shared_decks add column if not exists course_label text not null default '';
alter table public.shared_decks add column if not exists school_key text not null default '';
alter table public.shared_decks add column if not exists school_name text not null default '';
alter table public.shared_decks add column if not exists listed_at timestamptz;
alter table public.shared_decks add column if not exists saves int not null default 0;
alter table public.shared_decks add column if not exists hidden boolean not null default false;
alter table public.shared_decks drop constraint if exists shared_decks_library_check;
alter table public.shared_decks add constraint shared_decks_library_check check (
  char_length(course_key) <= 24 and char_length(course_label) <= 120 and char_length(school_key) <= 100 and char_length(school_name) <= 120
) not valid;
create index if not exists shared_decks_library_idx on public.shared_decks (course_key, school_key) where listed and not hidden;

-- ---------- Shared notes and quizzes ----------
create table if not exists public.shared_items (
  code text primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('note', 'quiz')),
  ref_id text not null check (char_length(ref_id) between 1 and 120),
  title text not null check (char_length(title) between 1 and 200),
  sharer_name text not null default '',
  data jsonb not null check (octet_length(data::text) < 1000000),
  hidden boolean not null default false,
  saves int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, kind, ref_id)
);
alter table public.shared_items enable row level security;
drop policy if exists "shared item own read" on public.shared_items;
create policy "shared item own read" on public.shared_items for select to authenticated using (owner_id = auth.uid());
revoke all on public.shared_items from anon;
revoke insert, update, delete, truncate, references, trigger on public.shared_items from authenticated;

-- Keep the sharer's name in step with their display name
create or replace function public.sbs_name_sync() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update public.shared_items set sharer_name = new.display_name where owner_id = new.user_id;
  return new;
end $$;
revoke all on function public.sbs_name_sync() from public, anon, authenticated;
drop trigger if exists sbs_name_sync on public.study_profiles;
create trigger sbs_name_sync after update of display_name on public.study_profiles for each row execute function public.sbs_name_sync();

-- ---------- Reports ----------
create table if not exists public.share_reports (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  reporter_id uuid default auth.uid() references auth.users(id) on delete set null,
  code text not null check (char_length(code) <= 20),
  kind text not null check (kind in ('deck', 'note', 'quiz')),
  reason text not null check (reason in ('harassment', 'hate', 'sexual', 'threat', 'spam', 'privacy', 'cheating', 'other')),
  details text check (details is null or char_length(details) <= 500),
  status text not null default 'new' check (status in ('new', 'reviewing', 'actioned', 'dismissed'))
);
create index if not exists share_reports_code_idx on public.share_reports (code);
create index if not exists share_reports_status_idx on public.share_reports (status, created_at desc);
alter table public.share_reports enable row level security;   -- no policies: only you can read them (dashboard / SQL editor)
revoke all on public.share_reports from public, anon, authenticated;

-- Who added which library deck (so a save is counted once per person)
create table if not exists public.share_saves (
  user_id uuid not null references auth.users(id) on delete cascade,
  code text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, code)
);
alter table public.share_saves enable row level security;
revoke all on public.share_saves from public, anon, authenticated;

-- ---------- Helpers ----------
-- Lookups are limited (codes can't be guessed by trying): signed in, per person; signed out, per network address.
create or replace function public.sbs_lookup_ok() returns boolean
language plpgsql volatile security definer set search_path = public as $$
declare ip text;
begin
  if to_regprocedure('public.studyboard_rate_hit(text,integer,integer)') is null then return true; end if;
  if auth.uid() is not null then return public.studyboard_rate_hit('pub:' || auth.uid()::text, 120, 3600); end if;
  begin ip := split_part(coalesce(current_setting('request.headers', true)::json ->> 'x-forwarded-for', ''), ',', 1);
  exception when others then ip := ''; end;
  return public.studyboard_rate_hit('pub:ip:' || coalesce(nullif(btrim(ip), ''), 'unknown'), 120, 3600);
end $$;
revoke all on function public.sbs_lookup_ok() from public, anon, authenticated;

create or replace function public.sbs_may_share() returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  if to_regclass('public.group_suspended') is not null and exists (select 1 from public.group_suspended where user_id = auth.uid()) then
    raise exception 'Your account can''t share publicly after a report was reviewed. The rest of Studyboard works as usual.';
  end if;
end $$;
revoke all on function public.sbs_may_share() from public, anon, authenticated;

-- ---------- Sharing notes and quizzes ----------
create or replace function public.share_item(p_kind text, p_ref text, p_title text, p_data jsonb) returns text
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); c text;
begin
  perform public.sbs_may_share();
  if p_kind not in ('note', 'quiz') then raise exception 'Only notes and quizzes'; end if;
  if p_data is null or octet_length(p_data::text) >= 1000000 then raise exception 'That is too big to share. Try a shorter one.'; end if;
  select code into c from public.shared_items where owner_id = me and kind = p_kind and ref_id = left(p_ref, 120);
  if c is not null then
    update public.shared_items set title = left(coalesce(nullif(btrim(p_title), ''), 'Untitled'), 200), data = p_data, updated_at = now(),
      sharer_name = public.sbg_my_name() where code = c;
    return c;
  end if;
  if (select count(*) from public.shared_items where owner_id = me) >= 300 then raise exception 'You can share up to 300 notes and quizzes. Stop sharing one first.'; end if;
  loop
    c := public.sbg_new_code();
    exit when not exists (select 1 from public.shared_items where code = c) and not exists (select 1 from public.shared_decks where code = c);
  end loop;
  insert into public.shared_items (code, owner_id, kind, ref_id, title, sharer_name, data)
  values (c, me, p_kind, left(p_ref, 120), left(coalesce(nullif(btrim(p_title), ''), 'Untitled'), 200), public.sbg_my_name(), p_data);
  return c;
end $$;

create or replace function public.stop_share_item(p_code text) returns void
language sql security definer set search_path = public as $$
  delete from public.shared_items where code = public.sbg_norm_code(p_code) and owner_id = auth.uid();
$$;

-- Your own shared notes and quizzes (for the Share sheets)
create or replace function public.my_shared_items()
returns table (code text, kind text, ref_id text, title text, updated_at timestamptz, saves int, hidden boolean)
language sql stable security definer set search_path = public as $$
  select i.code, i.kind, i.ref_id, i.title, i.updated_at, i.saves, i.hidden from public.shared_items i where i.owner_id = auth.uid() order by i.updated_at desc;
$$;

-- ---------- Opening a link (anyone, signed in or not) ----------
create or replace function public.get_public_share(p_code text)
returns table (code text, kind text, name text, sharer_name text, card_count int, data jsonb, updated_at timestamptz, is_mine boolean)
language plpgsql volatile security definer set search_path = public as $$
declare k text := public.sbg_norm_code(p_code);
begin
  if k !~ '^[A-Z0-9]{4}-[A-Z0-9]{4}$' then return; end if;
  if not public.sbs_lookup_ok() then raise exception 'Too many links opened. Try again in an hour.'; end if;
  return query select d.code, 'deck'::text, d.name, d.sharer_name, d.card_count, d.data, d.updated_at, coalesce(d.owner_id = auth.uid(), false)
    from public.shared_decks d where d.code = k and not d.hidden;
  if found then return; end if;
  return query select i.code, i.kind, i.title, i.sharer_name, 0, i.data, i.updated_at, coalesce(i.owner_id = auth.uid(), false)
    from public.shared_items i where i.code = k and not i.hidden;
end $$;

-- ---------- The Course Library ----------
-- List (or unlist) one of your shared decks for its course. p_course_key is the course code without spaces or dashes (BIOL1000);
-- p_school_key is the school's web address (uwaterloo.ca) or a short name the person typed.
create or replace function public.library_list(p_code text, p_listed boolean, p_course_key text, p_course_label text, p_school_key text, p_school_name text)
returns void
language plpgsql security definer set search_path = public as $$
declare ck text := upper(regexp_replace(coalesce(p_course_key, ''), '[^A-Za-z0-9]', '', 'g'));
        sk text := lower(btrim(coalesce(p_school_key, '')));
begin
  perform public.sbs_may_share();
  if p_listed and (ck !~ '^[A-Z]{2,8}[0-9]{2,5}[A-Z]{0,3}$' or char_length(ck) > 24) then raise exception 'Add a course code (like BIOL 1000) to the course first.'; end if;
  if p_listed and (sk = '' or char_length(sk) > 100 or sk !~ '^[a-z0-9][a-z0-9 .&''-]*$') then raise exception 'Pick your school first.'; end if;
  update public.shared_decks set listed = coalesce(p_listed, false),
    course_key = case when p_listed then ck else course_key end,
    course_label = case when p_listed then left(coalesce(p_course_label, ''), 120) else course_label end,
    school_key = case when p_listed then sk else school_key end,
    school_name = case when p_listed then left(coalesce(nullif(btrim(p_school_name), ''), sk), 120) else school_name end,
    listed_at = case when p_listed then coalesce(listed_at, now()) else null end
  where code = public.sbg_norm_code(p_code) and owner_id = auth.uid();
  if not found then raise exception 'Share the deck with a link first.'; end if;
end $$;

-- Decks listed for a course. p_school_key empty: every school (each row says which). Hidden decks and people you blocked are left out.
create or replace function public.library_decks(p_course_key text, p_school_key text)
returns table (code text, name text, sharer_name text, card_count int, updated_at timestamptz, saves int, school_name text, school_key text, course_label text, is_mine boolean)
language plpgsql volatile security definer set search_path = public as $$
declare ck text := upper(regexp_replace(coalesce(p_course_key, ''), '[^A-Za-z0-9]', '', 'g'));
        sk text := lower(btrim(coalesce(p_school_key, '')));
begin
  if ck = '' then return; end if;
  if not public.sbs_lookup_ok() then raise exception 'Too many searches. Try again in an hour.'; end if;
  return query select d.code, d.name, d.sharer_name, d.card_count, d.updated_at, d.saves, d.school_name, d.school_key, d.course_label,
      coalesce(d.owner_id = auth.uid(), false)
    from public.shared_decks d
    where d.listed and not d.hidden and d.course_key = ck and (sk = '' or d.school_key = sk) and d.card_count > 0
      and (auth.uid() is null or to_regclass('public.group_blocks') is null
           or not exists (select 1 from public.group_blocks b where b.blocker_id = auth.uid() and b.blocked_id = d.owner_id))
    order by (d.school_key = sk) desc, d.saves desc, d.updated_at desc
    limit 60;
end $$;

-- How many decks each of these courses has in the library (for the "3 decks from classmates" line). Up to 40 courses.
create or replace function public.library_counts(p_course_keys text[], p_school_key text)
returns table (course_key text, n int)
language sql stable security definer set search_path = public as $$
  select d.course_key, count(*)::int from public.shared_decks d
  where d.listed and not d.hidden and d.card_count > 0 and d.course_key = any (p_course_keys[1:40])
    and (coalesce(p_school_key, '') = '' or d.school_key = lower(btrim(p_school_key)))
    and d.owner_id is distinct from auth.uid()
  group by d.course_key;
$$;

-- Someone added a copy: counted once per person, for the library's order.
create or replace function public.share_saved(p_code text) returns void
language plpgsql security definer set search_path = public as $$
declare k text := public.sbg_norm_code(p_code);
begin
  if auth.uid() is null then return; end if;
  insert into public.share_saves (user_id, code) values (auth.uid(), k) on conflict do nothing;
  if found then
    update public.shared_decks set saves = saves + 1 where code = k and owner_id <> auth.uid();
    update public.shared_items set saves = saves + 1 where code = k and owner_id <> auth.uid();
  end if;
end $$;

-- Report a shared deck, note or quiz. Three different people reporting it hides it until you review it.
create or replace function public.report_share(p_code text, p_reason text, p_details text) returns void
language plpgsql security definer set search_path = public as $$
declare k text := public.sbg_norm_code(p_code); kd text;
begin
  if auth.uid() is null then raise exception 'Sign in to report this.'; end if;
  select 'deck' into kd from public.shared_decks where code = k;
  if kd is null then select kind into kd from public.shared_items where code = k; end if;
  if kd is null then raise exception 'That link no longer works.'; end if;
  if exists (select 1 from public.shared_decks where code = k and owner_id = auth.uid()) or exists (select 1 from public.shared_items where code = k and owner_id = auth.uid()) then
    raise exception 'That''s your own.';
  end if;
  if exists (select 1 from public.share_reports where code = k and reporter_id = auth.uid() and created_at > now() - interval '1 day') then return; end if;
  if (select count(*) from public.share_reports where reporter_id = auth.uid() and created_at > now() - interval '1 hour') >= 30 then
    raise exception 'Too many reports. Try again later.';
  end if;
  insert into public.share_reports (code, kind, reason, details) values (k, kd, p_reason, nullif(left(btrim(coalesce(p_details, '')), 500), ''));
  if (select count(distinct reporter_id) from public.share_reports where code = k and status in ('new', 'reviewing')) >= 3 then
    update public.shared_decks set hidden = true where code = k;
    update public.shared_items set hidden = true where code = k;
  end if;
end $$;

-- A person suspended from groups loses their public listings too
do $$ begin
  if to_regclass('public.group_suspended') is not null then
    update public.shared_decks d set listed = false where d.listed and exists (select 1 from public.group_suspended s where s.user_id = d.owner_id);
  end if;
end $$;

revoke all on function public.share_item(text, text, text, jsonb), public.stop_share_item(text), public.get_public_share(text),
  public.library_list(text, boolean, text, text, text, text), public.library_decks(text, text), public.library_counts(text[], text),
  public.share_saved(text), public.report_share(text, text, text), public.my_shared_items() from public, anon;
grant execute on function public.share_item(text, text, text, jsonb), public.stop_share_item(text),
  public.library_list(text, boolean, text, text, text, text), public.share_saved(text), public.report_share(text, text, text), public.my_shared_items() to authenticated;
grant execute on function public.get_public_share(text), public.library_decks(text, text), public.library_counts(text[], text) to anon, authenticated;

-- ===========================================================================================================================
-- Public flashcards and quizzes on the web (studyboardapp.com/flashcards and /quizzes)
-- A shared deck, or a shared quiz, can be PUBLISHED: then it has a page of its own that anyone (and search engines) can read,
-- and it shows up in the public search. The website's worker (cloudflare/site/worker.js) reads it through the public_* functions
-- below with the publishable key. Publishing is separate from making a link and from the Course Library, and can be undone any time.
-- Limits: at least 4 cards (or 3 questions), up to 100 published per account, people suspended from groups can't publish.
-- School: publishing needs a school from the list of real schools (supabase-schools.sql, run it first). The page shows it.
-- Username: publishing needs a username (supabase-usernames.sql, run it first). The page shows the maker as @username.
-- Search: a plain-text copy of the name, course and the first 300 cards (search_text) with a full-text index.
-- ===========================================================================================================================
alter table public.study_profiles add column if not exists username text;   -- (supabase-usernames.sql fills and checks it)
alter table public.shared_decks add column if not exists published boolean not null default false;
alter table public.shared_decks add column if not exists published_at timestamptz;
alter table public.shared_decks add column if not exists search_text text not null default '';
alter table public.shared_items add column if not exists published boolean not null default false;
alter table public.shared_items add column if not exists published_at timestamptz;
alter table public.shared_items add column if not exists search_text text not null default '';
alter table public.shared_items add column if not exists course_key text not null default '';
alter table public.shared_items add column if not exists course_label text not null default '';
alter table public.shared_items add column if not exists item_count int not null default 0;
alter table public.shared_items add column if not exists school_key text not null default '';
alter table public.shared_items add column if not exists school_name text not null default '';

-- The course code as a key: "BIOL 201 - Intro" -> BIOL201 ('' when there's none)
create or replace function public.sbs_course_key(p text) returns text
language sql immutable set search_path = public as $$
  select coalesce(upper((regexp_match(coalesce(p, ''), '([A-Za-z]{2,8})[\s._-]*([0-9]{2,5}[A-Za-z]{0,2})'))[1] || (regexp_match(coalesce(p, ''), '([A-Za-z]{2,8})[\s._-]*([0-9]{2,5}[A-Za-z]{0,2})'))[2]), '')
$$;

-- Keeps search_text (and, for quizzes, the course and question count) in step with the shared copy
create or replace function public.sbs_search_fill() returns trigger
language plpgsql set search_path = public as $$
declare d jsonb := coalesce(new.data, '{}'::jsonb); c jsonb; t text := '';
begin
  if tg_table_name = 'shared_decks' then
    c := d -> 'course';
    select coalesce(string_agg(left(coalesce(x ->> 'front', ''), 300) || ' ' || left(coalesce(x ->> 'back', ''), 300), ' '), '') into t
      from (select x from jsonb_array_elements(case when jsonb_typeof(d -> 'cards') = 'array' then d -> 'cards' else '[]'::jsonb end) x limit 300) q;
    new.search_text := left(coalesce(new.name, '') || ' ' || coalesce(c ->> 'code', '') || ' ' || coalesce(c ->> 'name', '') || ' ' || t, 60000);
    if coalesce(new.course_key, '') = '' then new.course_key := public.sbs_course_key(coalesce(c ->> 'code', '') || ' ' || coalesce(c ->> 'name', '')); end if;
  else
    c := d -> 'course';
    new.course_key := public.sbs_course_key(coalesce(c ->> 'code', '') || ' ' || coalesce(c ->> 'name', ''));
    new.course_label := left(coalesce(nullif(c ->> 'code', ''), c ->> 'name', ''), 120);
    if new.kind = 'quiz' then
      new.item_count := coalesce(jsonb_array_length(case when jsonb_typeof(d -> 'quiz' -> 'questions') = 'array' then d -> 'quiz' -> 'questions' else '[]'::jsonb end), 0);
      select coalesce(string_agg(left(coalesce(x ->> 'stem', ''), 400) || ' ' || coalesce((select string_agg(o, ' ') from jsonb_array_elements_text(case when jsonb_typeof(x -> 'options') = 'array' then x -> 'options' else '[]'::jsonb end) o), ''), ' '), '') into t
        from (select x from jsonb_array_elements(case when jsonb_typeof(d -> 'quiz' -> 'questions') = 'array' then d -> 'quiz' -> 'questions' else '[]'::jsonb end) x limit 200) q;
    else
      new.item_count := 0; t := coalesce(d ->> 'text', '');
    end if;
    new.search_text := left(coalesce(new.title, '') || ' ' || coalesce(c ->> 'code', '') || ' ' || coalesce(c ->> 'name', '') || ' ' || t, 60000);
  end if;
  -- a changed copy that no longer meets the minimum stops being public on its own
  if new.published then
    if tg_table_name = 'shared_decks' then
      if new.card_count < 4 then new.published := false; end if;
    elsif new.kind <> 'quiz' or new.item_count < 3 then new.published := false;
    end if;
  end if;
  return new;
end $$;
revoke all on function public.sbs_search_fill() from public, anon, authenticated;
drop trigger if exists sbs_search_fill on public.shared_decks;
create trigger sbs_search_fill before insert or update of name, data, card_count, published on public.shared_decks for each row execute function public.sbs_search_fill();
drop trigger if exists sbs_search_fill on public.shared_items;
create trigger sbs_search_fill before insert or update of title, data, published on public.shared_items for each row execute function public.sbs_search_fill();
-- fill the search copy for rows shared before this ran
update public.shared_decks set name = name where search_text = '';
update public.shared_items set title = title where search_text = '';

create index if not exists shared_decks_pub_fts on public.shared_decks using gin (to_tsvector('english', search_text)) where published and not hidden;
create index if not exists shared_items_pub_fts on public.shared_items using gin (to_tsvector('english', search_text)) where published and not hidden;
create index if not exists shared_decks_pub_idx on public.shared_decks (published_at desc) where published and not hidden;
create index if not exists shared_items_pub_idx on public.shared_items (published_at desc) where published and not hidden and kind = 'quiz';

-- Publish or unpublish one of your shared decks or quizzes (by its share code)
create or replace function public.share_publish(p_code text, p_on boolean) returns void
language plpgsql security definer set search_path = public as $$
declare k text := public.sbg_norm_code(p_code); me uuid := auth.uid(); n int; sk text := ''; sn text := '';
begin
  perform public.sbs_may_share();
  if p_on then
    if to_regclass('public.user_schools') is null then raise exception 'SB_SETUP: Publishing needs supabase-schools.sql. Run it, then supabase-sharing.sql again.'; end if;
    execute 'select s.key, s.name from public.user_schools u join public.schools s on s.key = u.school_key where u.user_id = $1' into sk, sn using me;
    if sk is null or sk = '' then raise exception 'SB_SCHOOL: Pick your school first.'; end if;
    if not exists (select 1 from public.study_profiles where user_id = me and username is not null) then raise exception 'SB_USERNAME_NEEDED: Pick a username first.'; end if;
    select (select count(*) from public.shared_decks where owner_id = me and published) + (select count(*) from public.shared_items where owner_id = me and published) into n;
    if n >= 100 then raise exception 'You can publish up to 100 decks and quizzes. Unpublish one first.'; end if;
  end if;
  update public.shared_decks set published = coalesce(p_on, false), published_at = case when p_on then coalesce(published_at, now()) else null end,
      school_key = case when p_on then sk else school_key end, school_name = case when p_on then sn else school_name end
    where code = k and owner_id = me;
  if found then
    if p_on and not exists (select 1 from public.shared_decks where code = k and published) then raise exception 'A deck needs at least 4 cards to be published.'; end if;
    return;
  end if;
  update public.shared_items set published = coalesce(p_on, false), published_at = case when p_on then coalesce(published_at, now()) else null end,
      school_key = case when p_on then sk else school_key end, school_name = case when p_on then sn else school_name end
    where code = k and owner_id = me and kind = 'quiz';
  if not found then raise exception 'Share it with a link first.'; end if;
  if p_on and not exists (select 1 from public.shared_items where code = k and published) then raise exception 'A quiz needs at least 3 questions to be published.'; end if;
end $$;

-- Is it published? (for your own Share sheet)
create or replace function public.my_publish_state(p_code text) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select published from public.shared_decks where code = public.sbg_norm_code(p_code) and owner_id = auth.uid()),
                  (select published from public.shared_items where code = public.sbg_norm_code(p_code) and owner_id = auth.uid()), false);
$$;

drop function if exists public.public_search(text, text, text, int, int);
drop function if exists public.public_page(text, text);
-- The public pages. Only published, not hidden items; nothing about the owner except their display name.
-- p_kind: 'deck' or 'quiz'. p_q: words to search (empty: newest). p_course: a course key (BIOL201) or ''. Sorted by match, then saves.
create or replace function public.public_search(p_kind text, p_q text, p_course text, p_limit int, p_offset int)
returns table (code text, name text, sharer_name text, n int, course_key text, course_label text, saves int, updated_at timestamptz, preview text, school_name text)
language plpgsql stable security definer set search_path = public as $$
declare q tsquery; ck text := public.sbs_course_key(coalesce(p_course, '')); lim int := least(greatest(coalesce(p_limit, 30), 1), 60); off int := least(greatest(coalesce(p_offset, 0), 0), 5000);
begin
  if coalesce(btrim(p_q), '') <> '' then q := websearch_to_tsquery('english', left(p_q, 200)); end if;
  if p_kind = 'quiz' then
    return query select i.code, i.title, coalesce('@' || (select pr.username from public.study_profiles pr where pr.user_id = i.owner_id), i.sharer_name), i.item_count, i.course_key, i.course_label, i.saves, i.updated_at,
        left(coalesce(i.data -> 'quiz' -> 'questions' -> 0 ->> 'stem', ''), 200), i.school_name
      from public.shared_items i
      where i.published and not i.hidden and i.kind = 'quiz' and (ck = '' or i.course_key = ck) and (q is null or to_tsvector('english', i.search_text) @@ q)
      order by case when q is null then 0 else ts_rank(to_tsvector('english', i.search_text), q) end desc, i.saves desc, i.published_at desc
      limit lim offset off;
  else
    return query select d.code, d.name, coalesce('@' || (select pr.username from public.study_profiles pr where pr.user_id = d.owner_id), d.sharer_name), d.card_count, d.course_key, coalesce(nullif(d.course_label, ''), d.data -> 'course' ->> 'code', ''), d.saves, d.updated_at,
        left((select string_agg(coalesce(x ->> 'front', ''), ' · ') from (select x from jsonb_array_elements(case when jsonb_typeof(d.data -> 'cards') = 'array' then d.data -> 'cards' else '[]'::jsonb end) x limit 4) z), 200), d.school_name
      from public.shared_decks d
      where d.published and not d.hidden and (ck = '' or d.course_key = ck) and (q is null or to_tsvector('english', d.search_text) @@ q)
      order by case when q is null then 0 else ts_rank(to_tsvector('english', d.search_text), q) end desc, d.saves desc, d.published_at desc
      limit lim offset off;
  end if;
end $$;

-- One published page's content
create or replace function public.public_page(p_kind text, p_code text)
returns table (code text, name text, sharer_name text, n int, course_key text, course_label text, saves int, published_at timestamptz, updated_at timestamptz, data jsonb, school_name text)
language sql stable security definer set search_path = public as $$
  select d.code, d.name, coalesce('@' || (select pr.username from public.study_profiles pr where pr.user_id = d.owner_id), d.sharer_name), d.card_count, d.course_key, coalesce(nullif(d.course_label, ''), d.data -> 'course' ->> 'code', ''), d.saves, d.published_at, d.updated_at,
         jsonb_build_object('course', d.data -> 'course', 'cards', d.data -> 'cards'), d.school_name
    from public.shared_decks d where p_kind = 'deck' and d.code = public.sbg_norm_code(p_code) and d.published and not d.hidden
  union all
  select i.code, i.title, coalesce('@' || (select pr.username from public.study_profiles pr where pr.user_id = i.owner_id), i.sharer_name), i.item_count, i.course_key, i.course_label, i.saves, i.published_at, i.updated_at, i.data, i.school_name
    from public.shared_items i where p_kind = 'quiz' and i.kind = 'quiz' and i.code = public.sbg_norm_code(p_code) and i.published and not i.hidden;
$$;

-- Courses that have published decks or quizzes, most first (the index pages and course pages)
create or replace function public.public_courses(p_kind text, p_limit int)
returns table (course_key text, course_label text, n int)
language sql stable security definer set search_path = public as $$
  select k, max(l), count(*)::int from (
    select d.course_key k, coalesce(nullif(d.course_label, ''), d.data -> 'course' ->> 'code', d.course_key) l from public.shared_decks d where p_kind = 'deck' and d.published and not d.hidden and d.course_key <> ''
    union all
    select i.course_key, coalesce(nullif(i.course_label, ''), i.course_key) from public.shared_items i where p_kind = 'quiz' and i.kind = 'quiz' and i.published and not i.hidden and i.course_key <> ''
  ) x group by k order by count(*) desc, k limit least(greatest(coalesce(p_limit, 100), 1), 2000);
$$;

-- Everything published, for the sitemap (newest changes first)
create or replace function public.public_sitemap(p_kind text, p_limit int, p_offset int)
returns table (code text, name text, updated_at timestamptz)
language sql stable security definer set search_path = public as $$
  select code, name, updated_at from (
    select d.code, d.name, d.updated_at from public.shared_decks d where p_kind = 'deck' and d.published and not d.hidden
    union all
    select i.code, i.title, i.updated_at from public.shared_items i where p_kind = 'quiz' and i.kind = 'quiz' and i.published and not i.hidden
  ) x order by updated_at desc limit least(greatest(coalesce(p_limit, 1000), 1), 50000) offset greatest(coalesce(p_offset, 0), 0);
$$;

-- A person suspended from groups loses their published pages too
do $$ begin
  if to_regclass('public.group_suspended') is not null then
    update public.shared_decks d set published = false where d.published and exists (select 1 from public.group_suspended s where s.user_id = d.owner_id);
    update public.shared_items i set published = false where i.published and exists (select 1 from public.group_suspended s where s.user_id = i.owner_id);
  end if;
end $$;

revoke all on function public.share_publish(text, boolean), public.my_publish_state(text), public.public_search(text, text, text, int, int),
  public.public_page(text, text), public.public_courses(text, int), public.public_sitemap(text, int, int) from public, anon;
grant execute on function public.share_publish(text, boolean), public.my_publish_state(text) to authenticated;
grant execute on function public.public_search(text, text, text, int, int), public.public_page(text, text), public.public_courses(text, int),
  public.public_sitemap(text, int, int) to anon, authenticated;

notify pgrst, 'reload schema';
