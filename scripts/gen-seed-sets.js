// Studyboard's own sample flashcard sets (seed-sets/*.json) -> supabase-seed-sets.sql
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, ".."), dir = path.join(root, "seed-sets"), LIMIT = 760000;
const COLORS = ["#3B6FE0","#1E9E74","#E0673B","#9A4FD1","#D6386F","#1D9BB8","#C79A12","#5E6B7E","#DC2626","#16A34A","#65A30D","#0D9488","#4F46E5","#C026D3","#EA580C","#92400E","#334155"];
// The app's built-in course icons (cloudflare/site/course-icons.js)
const ICONS = Object.keys(JSON.parse(fs.readFileSync(path.join(root, "cloudflare", "site", "course-icons.js"), "utf8").match(/export const ICONS = (\{.*\});/)[1]));
const clean = s => String(s == null ? "" : s).replace(/[—]/g, " - ").replace(/\s+/g, " ").trim();
const slug = s => clean(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const q = s => "'" + String(s).replace(/'/g, "''") + "'";

function load(){
  const sets = [], seen = new Set();
  for (const f of fs.readdirSync(dir).filter(f => f.endsWith(".json")).sort()) {
    for (const s of JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"))) {
      const cards = (s.cards || []).map(c => ({front: clean(c.front).slice(0, 600), back: clean(c.back).slice(0, 1200)})).filter(c => c.front && c.back);
      const dupe = new Set(); const uniq = cards.filter(c => { const k = c.front.toLowerCase(); if (dupe.has(k)) return false; dupe.add(k); return true; });
      const id = "seed:" + slug(s.school_key) + ":" + slug(s.course_code);
      if (!s.school_key || !s.course_code || !s.name || uniq.length < 10 || seen.has(id)) { console.warn("skipped", f, s.course_code, s.school_key, uniq.length); continue; }
      seen.add(id);
      const look = s.look && COLORS.includes(String(s.look.color).toUpperCase()) && ICONS.includes(s.look.icon) ? {color: s.look.color.toUpperCase(), icon: s.look.icon} : null;
      if (!look) { console.warn("skipped (needs a colour and icon from the app's lists)", f, s.course_code, JSON.stringify(s.look)); continue; }
      sets.push({id, school: s.school_key, code: clean(s.course_code), course: clean(s.course_name), src: s.source_url || "", name: clean(s.name).slice(0, 120), look,
        cards: uniq.map((c, i) => ({id: slug(s.course_code) + "-" + (i + 1), front: c.front, back: c.back}))});
    }
  }
  return sets;
}
function build(){
  const sets = load(), parts = [];
  const head = n => `-- Studyboard: the official sample flashcard sets, part ${n} of PARTS. Published as @studyboard on studyboardapp.com/flashcards and in the
-- Course Library. Made by scripts/gen-seed-sets.js from seed-sets/*.json; don't edit by hand.
-- Before running: sign up in Studyboard with the account that should own them (support@studyboardapp.com below; change it if you use
-- another). Run supabase-schools.sql, supabase-usernames.sql and supabase-sharing.sql first. Then run every part, in order. Safe to run
-- again: it updates the same sets.
-- The cards are original, written for the topics in each course's published outline; no exam questions, slides or course files are copied.
-- To take them all down:  update public.shared_decks set published = false, listed = false where deck_id like 'seed:%';

do $$
declare owner uuid := (select id from auth.users where lower(email) = lower('support@studyboardapp.com'));
begin
  if owner is null then raise exception 'Sign up in Studyboard with support@studyboardapp.com first (or change the address in this file).'; end if;
  -- "studyboard" is a reserved username, so only this account can have it (set here, not through the app)
  insert into public.study_profiles (user_id, display_name, username, username_set_at) values (owner, 'Studyboard', 'studyboard', now())
    on conflict (user_id) do update set username = 'studyboard', display_name = 'Studyboard';
end $$;

-- Each set's text is base64 below: the SQL Editor scans for statements that make tables, and plain card text like "divides the body
-- in two" confused it.
create or replace function pg_temp.sb_seed(p_id text, p_school text, p_b64 text) returns void
language plpgsql as $f$
declare p_data jsonb := convert_from(decode(p_b64, 'base64'), 'UTF8')::jsonb;
  p_code text := p_data -> 'course' ->> 'code'; p_name text := p_data ->> 'name';
  owner uuid := (select id from auth.users where lower(email) = lower('support@studyboardapp.com'));
  sn text := (select name from public.schools where key = p_school);
  c text; n int := jsonb_array_length(p_data -> 'cards');
begin
  if sn is null then raise notice 'No school %, skipped %', p_school, p_id; return; end if;
  loop c := public.sbg_new_code(); exit when not exists (select 1 from public.shared_decks where code = c); end loop;
  insert into public.shared_decks (code, owner_id, deck_id, name, sharer_name, card_count, data, listed, listed_at, course_key, course_label, school_key, school_name, published, published_at)
    values (c, owner, p_id, p_name, 'Studyboard', n, p_data, true, now(), public.sbs_course_key(p_code), p_code, p_school, sn, true, now())
    on conflict (owner_id, deck_id) do update set name = excluded.name, data = excluded.data, card_count = excluded.card_count, sharer_name = 'Studyboard',
      listed = true, course_key = excluded.course_key, course_label = excluded.course_label, school_key = excluded.school_key, school_name = excluded.school_name,
      published = true, published_at = coalesce(public.shared_decks.published_at, now()), updated_at = now();
end $f$;
`;
  let cur = [], size = 0;
  for (const s of sets) {
    const data = {v: 1, app: "studyboard", type: "deck", name: s.name, course: {code: s.code, name: s.course}, cards: s.cards, quizzes: [], seed: 1};
    data.look = s.look;
    const b64 = Buffer.from(JSON.stringify(data), "utf8").toString("base64").replace(/(.{76})/g, "$1\n");
    const st = `-- ${s.name.replace(/\n/g, " ")} (${s.src.replace(/\n/g, " ")})\nselect pg_temp.sb_seed(${q(s.id)}, ${q(s.school)}, '${b64}');\n`;
    if (cur.length && size + st.length > LIMIT - 4000) { parts.push(cur); cur = []; size = 0; }
    cur.push(st); size += Buffer.byteLength(st);
  }
  if (cur.length) parts.push(cur);
  return {sets, files: parts.map((p, i) => [i ? `supabase-seed-sets-${i + 1}.sql` : "supabase-seed-sets.sql", head(i + 1).replace("PARTS", parts.length) + "\n" + p.join("")])};
}
module.exports = {build, load, ICONS, COLORS};
if (require.main === module) {
  const {sets, files} = build();
  for (const f of fs.readdirSync(root).filter(f => /^supabase-seed-sets(-\d+)?\.sql$/.test(f))) fs.unlinkSync(path.join(root, f));
  for (const [f, t] of files) fs.writeFileSync(path.join(root, f), t);
  const by = {}; sets.forEach(s => { by[s.school] = (by[s.school] || 0) + 1; });
  console.log(`${sets.length} sets, ${sets.reduce((a, s) => a + s.cards.length, 0)} cards, ${files.length} file(s)`, by);
}
