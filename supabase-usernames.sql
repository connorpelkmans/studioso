-- Studyboard: usernames and age
--
-- Age (like Quizlet): every account gives its birthday once (at sign-up, or the first time it publishes). It can't be changed from
-- the app afterwards. Students under 13 keep using Studyboard but can't publish, list decks in the Course Library or make public
-- links (supabase-sharing.sql checks sbu_age_ok). Accounts for students under 13 are made by a parent or guardian with their own
-- email, which they confirm. Only the date is kept, in study_profiles.birth_date, and it is never shown to anyone.
--
-- Every account picks a unique username (shown as @name). It's what published flashcards and quizzes show as their maker
-- (studyboardapp.com/flashcards), so it is checked here, on the server, and the app can't get around it:
--   * 3 to 20 characters: letters, numbers, _ and . ; starts with a letter; no "__", "..", "._" or a "." / "_" at the end
--   * unique, whatever the capitals (Connor and connor are the same)
--   * not a reserved name (studyboard, admin, support, ...) and no foul words: the name is checked with the look-alike letters
--     people use to sneak them in turned back into letters (a55, $h!t), with repeated letters squeezed (fuuuck), as a whole and
--     without its _ and . . Short words that hide inside ordinary ones (ass in "classic", rape in "grape") only count as a whole
--     part of the name, and a short allow list (allow, below) keeps words like "therapist" and "torpedo" usable.
--   * can be changed once every 30 days
-- The app keeps its own copy of the word list (index.html, 96-usernames.js) for instant feedback; tests/usernames.test.js checks
-- that both lists match. Add a word here and there, then run this file again.
--
-- Run this in Supabase (SQL Editor > New query > paste everything > Run) AFTER supabase-groups.sql, and before supabase-sharing.sql
-- (publishing needs a username). It is safe to run again.

alter table public.study_profiles add column if not exists username text;
alter table public.study_profiles add column if not exists username_set_at timestamptz;
alter table public.study_profiles add column if not exists birth_date date;
create unique index if not exists study_profiles_username_key on public.study_profiles (lower(username)) where username is not null;

create table if not exists public.username_words (
  word text primary key,
  whole boolean not null default false   -- true: only when it is a whole part of the name (between _ . or the ends)
);
alter table public.username_words enable row level security;
revoke all on public.username_words from anon, authenticated;

-- (the same list as the app's; keep them in step)
insert into public.username_words (word, whole) values
  ('fuck', false), ('fuk', true), ('fck', true), ('fuq', true), ('shit', false), ('sht', true), ('bitch', false), ('biatch', false), ('bastard', false),
  ('cunt', false), ('twat', false), ('wank', false), ('bollock', false), ('prick', true), ('dick', true), ('dik', true), ('cock', true), ('cok', true),
  ('pussy', false), ('puss', true), ('penis', false), ('vagina', false), ('anal', true), ('anus', true), ('ass', true), ('arse', true), ('asshole', false),
  ('arsehole', false), ('tits', true), ('titty', false), ('titties', false), ('boob', false), ('cum', true), ('cumshot', false), ('jizz', false),
  ('semen', false), ('dildo', false), ('vibrator', false), ('blowjob', false), ('handjob', false), ('rimjob', false), ('porn', false), ('xxx', false),
  ('sex', true), ('sexy', true), ('horny', false), ('nude', true), ('nudes', true), ('naked', false), ('milf', false), ('dilf', false), ('hentai', false),
  ('orgasm', false), ('orgy', false), ('incest', false), ('pedo', false), ('paedo', false), ('pedophile', false), ('molest', false), ('rape', true),
  ('rapist', true), ('raping', false), ('slut', false), ('whore', false), ('hoe', true), ('skank', false), ('thot', true),
  ('nigger', false), ('nigga', false), ('nigg', false), ('negro', false), ('chink', false), ('gook', true), ('spic', true), ('spick', true), ('kike', true),
  ('wetback', false), ('beaner', false), ('coon', true), ('jigaboo', false), ('raghead', false), ('towelhead', false), ('sandnigger', false),
  ('paki', true), ('gypsy', true), ('tranny', false), ('shemale', false), ('faggot', false), ('fagot', false), ('fag', true), ('fags', true), ('dyke', true),
  ('homo', true), ('retard', false), ('retarded', false), ('tard', true), ('spaz', true), ('mong', true),
  ('nazi', false), ('hitler', false), ('heil', true), ('kkk', false), ('isis', true), ('jihad', false), ('terrorist', false), ('killyourself', false),
  ('kys', true), ('suicide', false), ('cocaine', false), ('heroin', true), ('meth', true), ('crackhead', false),
  ('phuck', false), ('phuk', false), ('fvck', false), ('dickhead', false), ('dickface', false), ('dicksuck', false), ('cocksuck', false), ('fatass', false),
  ('dumbass', false), ('jackass', false), ('smartass', false), ('asshat', false), ('asswipe', false), ('assface', false), ('butthole', false),
  ('buttplug', false), ('bukkake', false), ('gangbang', false), ('creampie', false), ('deepthroat', false), ('motherfuck', false), ('fuckface', false),
  ('shithead', false), ('bullshit', false), ('douche', false), ('scumbag', false)
on conflict (word) do update set whole = excluded.whole;

-- The name as letters: look-alikes turned back (0>o 1>i 3>e 4>a 5>s 7>t 8>b 9>g @>a $>s !>i |>l)
create or replace function public.sbu_letters(p text) returns text
language sql immutable set search_path = public as $$
  select translate(lower(coalesce(p, '')), '0134578 9@$!|', 'oieastb gasil')
$$;
-- ...and with every run of the same letter made one (fuuuck > fuck)
create or replace function public.sbu_squeeze(p text) returns text
language sql immutable set search_path = public as $$
  select regexp_replace(p, '(.)\1+', '\1', 'g')
$$;

-- What's wrong with a username, or null when it's fine (and free when p_check_taken)
create or replace function public.sbu_problem(p_name text, p_me uuid, p_check_taken boolean) returns text
language plpgsql stable security definer set search_path = public as $$
declare n text := btrim(coalesce(p_name, '')); l text; joined text; parts text[]; w record; a text;
  -- ordinary words that contain a listed one (taken out before looking for listed words inside the name)
  allow constant text[] := array['scunthorpe', 'shiitake', 'torpedo', 'pedometer', 'montenegro', 'swank', 'therapist', 'cockatoo', 'cocktail', 'peacock', 'hancock', 'hitchcock', 'dickens', 'dickinson', 'analys', 'classic', 'grape', 'drape'];
begin
  if char_length(n) < 3 then return 'Use at least 3 characters.'; end if;
  if char_length(n) > 20 then return 'Use at most 20 characters.'; end if;
  if n !~ '^[A-Za-z][A-Za-z0-9_.]*$' then return 'Start with a letter, and use only letters, numbers, _ and .'; end if;
  if n ~ '[_.]{2}' or n ~ '[_.]$' then return 'Don''t put _ or . next to each other or at the end.'; end if;
  l := lower(n);
  if l ~ '^(studyboard|studioso|admin|administrator|root|support|help|helpdesk|moderator|mod|mods|staff|official|team|system|owner|security|billing|account|accounts|null|undefined|anonymous|anon|deleted|everyone|here|me|you|user|username|test|guest|api|www|mail|email|privacy|terms|flashcards|quizzes|settings|login|signin|signup|register)$'
     or l ~ '^(studyboard|studioso)' or l ~ '(studyboard|studioso)$' then return 'That name is reserved. Pick another.'; end if;
  joined := public.sbu_letters(regexp_replace(l, '[_.]', '', 'g'));
  foreach a in array allow loop joined := replace(joined, a, '_'); end loop;
  parts := string_to_array(public.sbu_letters(regexp_replace(l, '[_.]+', ' ', 'g')), ' ');
  for w in select word, whole from public.username_words loop
    if w.whole then
      -- (squeezing only for words without a double letter of their own: "xxx" squeezed would be any x)
      if w.word = any(parts) or joined = w.word
         or (public.sbu_squeeze(w.word) = w.word and w.word = any(select public.sbu_squeeze(x) from unnest(parts) x)) then
        return 'That name isn''t allowed. Pick another.';
      end if;
    elsif position(w.word in joined) > 0 or (public.sbu_squeeze(w.word) = w.word and char_length(w.word) >= 4 and position(w.word in public.sbu_squeeze(joined)) > 0) then
      return 'That name isn''t allowed. Pick another.';
    end if;
  end loop;
  if p_check_taken and exists (select 1 from public.study_profiles where lower(username) = l and user_id is distinct from p_me) then
    return 'That username is taken.';
  end if;
  return null;
end $$;
revoke all on function public.sbu_problem(text, uuid, boolean), public.sbu_letters(text), public.sbu_squeeze(text) from public, anon, authenticated;

-- Can I have this one? (the sign-up form asks before the account exists, so this is open to anyone, and limited)
create or replace function public.username_check(p_name text) returns table (ok boolean, reason text)
language plpgsql volatile security definer set search_path = public as $$
declare why text;
begin
  if to_regprocedure('public.sbs_lookup_ok()') is not null and not public.sbs_lookup_ok() then return query select false, 'Too many tries. Wait a little and try again.'; return; end if;
  why := public.sbu_problem(p_name, auth.uid(), true);
  return query select why is null, coalesce(why, '');
end $$;

create or replace function public.set_username(p_name text) returns text
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); n text := btrim(coalesce(p_name, '')); why text; cur record; meta jsonb;
begin
  if me is null then raise exception 'Sign in first'; end if;
  why := public.sbu_problem(n, me, true);
  if why is not null then raise exception 'SB_USERNAME: %', why; end if;
  select username, username_set_at into cur from public.study_profiles where user_id = me;
  if cur.username is not null and lower(cur.username) = lower(n) then
    update public.study_profiles set username = n where user_id = me;   -- only the capitals changed
    return n;
  end if;
  if cur.username is not null and cur.username_set_at > now() - interval '30 days' then
    raise exception 'SB_USERNAME: You can change your username once every 30 days (next on %).', to_char(cur.username_set_at + interval '30 days', 'Mon DD');
  end if;
  begin
    if exists (select 1 from public.study_profiles where user_id = me) then
      update public.study_profiles set username = n, username_set_at = now() where user_id = me;
    else
      select raw_user_meta_data into meta from auth.users where id = me;
      insert into public.study_profiles (user_id, display_name, username, username_set_at)
      values (me, left(coalesce(nullif(btrim(meta ->> 'full_name'), ''), nullif(btrim(meta ->> 'first_name'), ''), n), 40), n, now());
    end if;
  exception when unique_violation then raise exception 'SB_USERNAME: That username is taken.';
  end;
  return n;
end $$;

create or replace function public.my_username() returns text
language sql stable security definer set search_path = public as $$
  select username from public.study_profiles where user_id = auth.uid();
$$;

-- Your birthday, once (a second call with a different date is refused; ask support to correct it)
create or replace function public.set_birthdate(p_date date) returns int
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); cur date; meta jsonb;
begin
  if me is null then raise exception 'Sign in first'; end if;
  if p_date is null or p_date > current_date or p_date < date '1900-01-01' then raise exception 'SB_AGE: Enter your real birthday.'; end if;
  select birth_date into cur from public.study_profiles where user_id = me;
  if cur is not null and cur <> p_date then raise exception 'SB_AGE: Your birthday is already saved. To correct it, contact support.'; end if;
  if exists (select 1 from public.study_profiles where user_id = me) then
    update public.study_profiles set birth_date = p_date where user_id = me;
  else
    select raw_user_meta_data into meta from auth.users where id = me;
    insert into public.study_profiles (user_id, display_name, birth_date)
    values (me, left(coalesce(nullif(btrim(meta ->> 'full_name'), ''), nullif(btrim(meta ->> 'first_name'), ''), 'Student'), 40), p_date);
  end if;
  return extract(year from age(current_date, p_date))::int;
end $$;

-- Age in years, or null when no birthday is saved yet
create or replace function public.my_age() returns int
language sql stable security definer set search_path = public as $$
  select extract(year from age(current_date, birth_date))::int from public.study_profiles where user_id = auth.uid() and birth_date is not null;
$$;

-- For the server's own checks: 'ok' (13 or older), 'young' (under 13) or 'unknown' (no birthday yet)
create or replace function public.sbu_age_ok(p_uid uuid) returns text
language sql stable security definer set search_path = public as $$
  select case when b is null then 'unknown' when age(current_date, b) >= interval '13 years' then 'ok' else 'young' end
  from (select (select birth_date from public.study_profiles where user_id = p_uid) as b) x;
$$;
revoke all on function public.sbu_age_ok(uuid) from public, anon, authenticated;

revoke all on function public.username_check(text), public.set_username(text), public.my_username(), public.set_birthdate(date), public.my_age() from public, anon;
grant execute on function public.set_birthdate(date), public.my_age() to authenticated;
grant execute on function public.username_check(text) to anon, authenticated;
grant execute on function public.set_username(text), public.my_username() to authenticated;

notify pgrst, 'reload schema';
