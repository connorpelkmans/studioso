// The public flashcard and quiz pages (cloudflare/site/public-pages.js)
const assert = require("assert"), path = require("path"), fs = require("fs");
let n = 0; const ok = (c, m) => { n++; assert(c, m); };

const DECKS = [
  {code: "ABCD-EFGH", name: "Cell Biology Basics", sharer_name: "Sam", school_name: "University of Waterloo", n: 4, course_key: "BIOL201", course_label: "BIOL 201", saves: 3, updated_at: "2026-10-01T00:00:00Z", published_at: "2026-10-01T00:00:00Z",
    data: {course: {code: "BIOL 201", name: "Biology"}, cards: [{front: "Mitochondria", back: "Makes ATP"}, {front: "Ribosome", back: "Makes protein <b>fast</b>"}, {front: "Nucleus", back: "Holds DNA"}, {front: "Golgi", back: "Packages proteins"}]}},
  {code: "JKLM-NPQR", name: "Cell Organelles II", sharer_name: "Jo", n: 5, course_key: "BIOL201", course_label: "BIOL 201", saves: 0, updated_at: "2026-10-02T00:00:00Z", published_at: "2026-10-02T00:00:00Z",
    data: {cards: [{front: "a", back: "b"}]}}
];
const QUIZZES = [{code: "QQQQ-RRRR", name: "Cell Quiz", sharer_name: "Sam", n: 2, course_key: "BIOL201", course_label: "BIOL 201", saves: 0, updated_at: "2026-10-03T00:00:00Z",
  data: {quiz: {questions: [{type: "single", stem: "Which organelle makes ATP?", options: ["Nucleus", "Mitochondria"], correct: [1], rationale: "Powerhouse."}, {type: "short", stem: "Name the control center", answer: "Nucleus"}]}}}];
const calls = [];
const fakeFetch = async (url, init) => {
  const fn = url.split("/rpc/")[1], a = JSON.parse(init.body);
  calls.push([fn, a, init.headers.apikey]);
  const src = (a.p_kind === "quiz" ? QUIZZES : DECKS);
  let out;
  if (fn === "public_search") out = src.filter(r => (!a.p_course || r.course_key === a.p_course.toUpperCase().replace(/[^A-Z0-9]/g, "")) && (!a.p_q || JSON.stringify(r).toLowerCase().includes(a.p_q.toLowerCase()))).slice(a.p_offset, a.p_offset + a.p_limit).map(r => Object.assign({}, r, {preview: "x"}));
  else if (fn === "public_page") out = src.filter(r => r.code === a.p_code);
  else if (fn === "public_courses") out = [{course_key: "BIOL201", course_label: "BIOL 201", n: src.length}];
  else if (fn === "public_schools") out = [{school_key: "uwaterloo.ca", school_name: "University of Waterloo", n: 1}];
  else if (fn === "public_sitemap") out = src.map(r => ({code: r.code, name: r.name, updated_at: r.updated_at}));
  else return new Response("{}", {status: 404});
  return new Response(JSON.stringify(out), {status: 200, headers: {"content-type": "application/json"}});
};
const env = {SUPABASE_URL: "https://x.supabase.co", SUPABASE_ANON_KEY: "sb_publishable_test", __fetch: fakeFetch, __noCache: true};

(async () => {
  const P = await import(path.join(__dirname, "..", "cloudflare", "site", "public-pages.js"));
  const get = async p => P.handlePublic(new Request("https://studyboardapp.com" + p), env, {waitUntil() {}});
  const html = async p => { const r = await get(p); return {r, t: await r.text()}; };

  ok(P.slugify("Cell Biology: Basics & More!") === "cell-biology-basics-and-more" && P.slugify("Étude") === "etude" && P.slugify("") === "set", "slugs are clean");
  ok(P.itemPath("flashcards", "Cell Biology Basics", "ABCD-EFGH") === "/flashcards/cell-biology-basics-abcdefgh", "item paths end with the code");
  ok(P.courseSlug("BIOL201") === "biol-201" && P.courseKey("biol 201") === "BIOL201", "course slugs and keys");
  ok(P.courseKey("01:119:115 General Biology") === "01119115" && P.courseSlug("01119115") === "01-119-115" && P.courseLabelOf("01119115") === "01:119:115" && P.courseKey("01-119-115") === "01119115", "all-number codes like Rutgers' 01:119:115");
  ok(P.isPublicPath("/flashcards") && P.isPublicPath("/quizzes/x-abcdefgh") && P.isPublicPath("/sitemap-public.xml") && !P.isPublicPath("/flashcardsx") && !P.isPublicPath("/"), "only the public paths");

  let {r, t} = await html("/flashcards/cell-biology-basics-abcdefgh");
  ok(r.status === 200 && /text\/html/.test(r.headers.get("content-type")), "a deck page renders");
  ok(/<h1>Cell Biology Basics<\/h1>/.test(t) && /Mitochondria/.test(t) && /Makes ATP/.test(t) && /Packages proteins/.test(t), "every card is in the page's HTML");
  ok(/Makes protein &lt;b&gt;fast&lt;\/b&gt;/.test(t) && !/<b>fast<\/b>/.test(t), "card text is escaped");
  ok(/<span class="pdh-kick">BIOL 201 · Flashcards<\/span>/.test(t) && /<span>University of Waterloo<\/span>/.test(t) && /<span>by Sam<\/span>/.test(t) && /at University of Waterloo/.test(t.match(/<meta name="description" content="([^"]*)"/)[1]), "the school shows on the page and in its description");
  ok(/<header class="pdh pc\d+">/.test(t) && /class="pdh-ring"[^>]*><svg class="ci-svg"/.test(t) && /<ol class="pub-terms pcards">/.test(t) && /data-pub-study>Study Flashcards</.test(t), "the set page is drawn like the app's deck page: course band, big icon, index cards");
  ok(/<title>Cell Biology Basics \(BIOL 201\) Flashcards \| Studyboard<\/title>/.test(t), "the title names the set, its course and Flashcards");
  ok(/<link rel="canonical" href="https:\/\/studyboardapp.com\/flashcards\/cell-biology-basics-abcdefgh">/.test(t), "it has a canonical link");
  const ld = [...t.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m => JSON.parse(m[1]));
  const quiz = ld.find(x => x["@type"] === "Quiz");
  ok(quiz && quiz.hasPart.length === 4 && quiz.hasPart.every(q => q.eduQuestionType === "Flashcard" && q.acceptedAnswer && q.acceptedAnswer.text), "flashcard structured data (schema.org Quiz with Flashcard questions)");
  ok(quiz.sourceOrganization && quiz.sourceOrganization.name === "University of Waterloo" && quiz.author.affiliation.name === "University of Waterloo", "the school is in the structured data");
  ok(ld.some(x => x["@type"] === "BreadcrumbList" && x.itemListElement.length === 3), "breadcrumb structured data");
  ok(/href="\/\?deck=ABCD-EFGH"/.test(t), "Add to Studyboard opens the deck in the app");
  ok(/More BIOL 201 flashcards/.test(t) && /cell-organelles-ii-jklmnpqr/.test(t), "related sets from the same course are linked");
  ok(/content-security-policy/i.test([...r.headers.keys()].join(" ")) && /script-src 'self'/.test(r.headers.get("content-security-policy")), "a strict content security policy");
  ok(/s-maxage=900/.test(r.headers.get("cache-control")), "cached at the edge for 15 minutes");
  ok(calls.every(c => c[2] === "sb_publishable_test"), "reads with the public key only");

  r = await get("/flashcards/old-name-abcdefgh");
  ok(r.status === 301 && r.headers.get("location") === "https://studyboardapp.com/flashcards/cell-biology-basics-abcdefgh", "an old name redirects to the current address");
  r = await get("/flashcards/abcdefgh");
  ok(r.status === 301, "a bare code redirects too");
  ({r, t} = await html("/flashcards/nothing-zzzzzzzz"));
  ok(r.status === 404 && /noindex/.test(t), "an unknown set is a 404 that isn't indexed");

  ({r, t} = await html("/quizzes/cell-quiz-qqqqrrrr"));
  ok(r.status === 200 && /Which organelle makes ATP\?/.test(t) && /<details><summary>Show answer<\/summary><p class="ans"><b>B\. Mitochondria<\/b>/.test(t) && /Powerhouse/.test(t), "a quiz page shows the questions, answers behind Show answer");
  const qld = [...t.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m => JSON.parse(m[1])).find(x => x["@type"] === "Quiz");
  ok(qld && qld.hasPart[0].eduQuestionType === "Multiple choice" && qld.hasPart[0].acceptedAnswer[0].text === "Mitochondria" && qld.hasPart[0].suggestedAnswer[0].text === "Nucleus" && qld.hasPart[1].eduQuestionType === "Short answer", "practice-question structured data");
  ok(/href="\/\?shared=QQQQ-RRRR"/.test(t), "Take the Quiz opens it in the app");

  ({r, t} = await html("/flashcards"));
  ok(r.status === 200 && /Flashcards made by students/.test(t) && !/Popular courses|pub-popular/.test(t) && !calls.some(c => c[0] === "public_courses") && /cell-biology-basics-abcdefgh/.test(t) && !/noindex/.test(t), "the index lists sets (no Popular courses list), and is indexed");
  ok(/SearchAction/.test(t), "the index has search structured data");
  ok(/<a class="pdeck pc\d+" href="\/flashcards\/cell-biology-basics-abcdefgh">/.test(t) && /<span class="pdeck-kick">BIOL 201<\/span>/.test(t) && /<span class="pdeck-n">4<span class="sr"> terms<\/span><\/span>/.test(t) && /class="pdeck-ic"[^>]*><svg class="ci-svg"/.test(t), "flashcard sets are drawn as decks, like the app: course band, icon and card count");
  ok(P.deckLook({course_label: "BIOL 201", course_key: "BIOL201", name: "x"}).color === P.deckLook({course_label: "BIOL 201", course_key: "BIOL201", name: "y"}).color && P.deckLook({name: "x"}).label === "General", "a course keeps one colour; no course is General");
  ok(!/pdeck/.test((await html("/quizzes")).t), "quizzes keep their list");
  ok(fs.readFileSync(require("../scripts/gen-course-icons.js").file, "utf8") === require("../scripts/gen-course-icons.js").build(), "the course icons match the app (run node scripts/gen-course-icons.js)");
  const css = fs.readFileSync(path.join(__dirname, "..", "website", "assets", "public.css"), "utf8"), {COLORS} = await import(path.join(__dirname, "..", "cloudflare", "site", "course-icons.js"));
  ok(COLORS.every((c, i) => css.includes(`.pc${i}{--c:${c}}`)), "every course colour has its class in public.css");
  ({r, t} = await html("/flashcards?q=mitochondria"));
  ok(/noindex,follow/.test(t) && /Cell Biology Basics/.test(t) && !/Cell Organelles II/.test(t), "search results show matches and aren't indexed");
  ({r, t} = await html("/flashcards?school=uwaterloo.ca&sort=new&min=25"));
  const sc = calls.filter(c => c[0] === "public_search").pop()[1];
  ok(sc.p_school === "uwaterloo.ca" && sc.p_sort === "new" && sc.p_min === 25 && /<option value="uwaterloo.ca" selected>University of Waterloo<\/option>/.test(t) && /<option value="new" selected>Newest/.test(t) && /<option value="25" selected>25\+ cards/.test(t), "school, sort and size filters are sent and stay selected");
  ok(/Flashcards from University of Waterloo/.test(t) && /noindex,follow/.test(t), "a filtered page names the school and isn't indexed");
  ({r, t} = await html("/flashcards?sort=bogus&min=7"));
  ok(calls.filter(c => c[0] === "public_search").pop()[1].p_sort === "" && calls.filter(c => c[0] === "public_search").pop()[1].p_min === 0, "unknown filter values are ignored");
  r = await get("/flashcards?q=BIOL%20201");
  ok(r.status === 302 && /\/flashcards\/course\/biol-201$/.test(r.headers.get("location")), "searching a course code goes to its course page");
  ({r, t} = await html("/flashcards/course/biol-201"));
  ok(r.status === 200 && /<h1>BIOL 201 Flashcards<\/h1>/.test(t) && /BIOL 201 Flashcards and Study Sets/.test(t) && /href="\/quizzes\/course\/biol-201"/.test(t), "a course page, linked to the course's quizzes");
  r = await get("/flashcards/course/biol201");
  ok(r.status === 301, "a course address is normalised");
  ({r} = await html("/flashcards/course/chem-999"));
  ok(r.status === 404, "a course with nothing published is a 404");

  ({r, t} = await html("/sitemap-public.xml"));
  ok(r.status === 200 && /application\/xml/.test(r.headers.get("content-type")) && /<loc>https:\/\/studyboardapp.com\/flashcards\/cell-biology-basics-abcdefgh<\/loc><lastmod>2026-10-01<\/lastmod>/.test(t) && /quizzes\/course\/biol-201/.test(t), "the sitemap lists sets, quizzes and course pages");

  r = await P.handlePublic(new Request("https://studyboardapp.com/flashcards"), Object.assign({}, env, {__fetch: async () => { throw new Error("down"); }}), {});
  ok(r.status === 503 && r.headers.get("retry-after"), "an outage answers 503 with Retry-After (search engines try again later)");
  r = await P.handlePublic(new Request("https://studyboardapp.com/flashcards", {method: "POST"}), env, {});
  ok(r.status === 405, "only GET");
  const rf = []; r = await P.handlePublic(new Request("https://studyboardapp.com/flashcards/refresh", {method: "POST", body: JSON.stringify({kind: "deck", code: "ABCD-EFGH", name: "Cell Biology Basics", course: "BIOL 201"})}), Object.assign({}, env, {__refreshed: rf}), {});
  ok(r.status === 204 && rf.includes("/flashcards/cell-biology-basics-abcdefgh") && rf.includes("/flashcards") && rf.includes("/flashcards/course/biol-201"), "a refresh after publishing drops the cached page, the index and the course page");
  r = await P.handlePublic(new Request("https://studyboardapp.com/flashcards/refresh", {method: "POST", body: "nonsense"}), env, {});
  ok(r.status === 204, "a bad refresh does nothing");
  const oldDb = async (url, init) => { const a = JSON.parse(init.body); if (url.endsWith("/public_search") && "p_school" in a) return new Response('{"code":"PGRST202"}', {status: 404}); return fakeFetch(url, init); };
  r = await P.handlePublic(new Request("https://studyboardapp.com/flashcards"), Object.assign({}, env, {__fetch: oldDb}), {waitUntil() {}});
  ok(r.status === 200 && /Cell Biology Basics/.test(await r.text()), "with the older search function the flashcards page still lists sets");
  console.log(`public-pages.test: ${n} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
