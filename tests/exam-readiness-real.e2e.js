// Exam readiness, checked against patterns found in real students' data (made-up content here), and the reward screen that shows
// how much more ready a study session made you: node tests/exam-readiness-real.e2e.js
//  1. a prep plan made without named topics (its sessions are on the exam itself, "t0") gets a readiness once a session is done
//  2. focus time on a session that isn't ticked done yet counts, up to the session's length
//  3. an exam with no course finds a practice quiz on its topics (from its title and notes) in any course
//  4. a deck linked to a plan topic counts how well its cards are known now (with forgetting), not just their boxes
//  5. the reward screen after studying shows the exam's readiness before and after; nothing shows when it didn't go up
const assert = require("assert"), path = require("path"), http = require("http"), fs = require("fs");
const {chromium, executablePath} = require("./pw");
const root = path.join(__dirname, "..");
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const day = k => { const d = new Date(); d.setDate(d.getDate() + k); return iso(d); };
const card = (id, front, back, o) => Object.assign({id, front, back, box: 0, due: "", seen: 0, right: 0, wrong: 0}, o || {});
const sess = (id, ex, topicId, k, o) => Object.assign({id, title: "Study " + id, type: "Study", courseId: "", start: day(k), due: day(k), hours: 0.5, status: "todo", prepFor: ex, kind: "learn", topicId}, o || {});
const SEED = () => ({v: 2, updated: 1, files: [], notes: [], events: [],
  courses: [{id: "c1", name: "Biology", code: "BIO 110", color: "#3B6FE0"}, {id: "c2", name: "History", code: "HIS 7", color: "#C2412D"}],
  tasks: [
    // 1 and 2: a plan made without named topics, as the planner makes one for an exam with no topics
    {id: "exA", title: "Phylogeny Exam", type: "Exam", courseId: "c1", due: day(8), start: day(8), status: "todo", pct: 0,
      prep: {v: 1, topics: [], intensity: 90, style: [], styleText: "", rest: false, light: true, start: "", ai: false, examDue: day(8), createdAt: 1, updatedAt: 1}, planTopics: []},
    sess("a1", "exA", "t0", -2, {kind: "learn"}), sess("a2", "exA", "t0", -1, {kind: "recall"}), sess("a3", "exA", "t0", 2, {kind: "questions"}), sess("a4", "exA", "", 7, {kind: "light"}),
    // 3: an exam with no course, its topics in its notes; the quiz is in a History course quiz deck
    {id: "exB", title: "Cumulative social studies", type: "Exam", courseId: "", due: day(5), start: day(5), status: "todo", pct: 0, notes: "The Renaissance in Europe\nThe Protestant Reformation"},
    // 4 and 5: a plan whose topic links a Biology deck
    {id: "exC", title: "Cells Midterm", type: "Exam", courseId: "c1", due: day(6), start: day(6), status: "todo", pct: 0,
      prep: {v: 1, topics: [{id: "tc", name: "Cell parts", conf: "ok", weight: null, done: false, edited: true, links: [{k: "deck", id: "dC", title: "Cell parts", deckId: "", cardIds: null, total: 8}]}],
        intensity: 90, style: [], styleText: "", rest: false, light: true, start: "", ai: false, examDue: day(6), createdAt: 1, updatedAt: 1}, planTopics: [{name: "Cell parts", conf: "ok"}]},
    sess("c1s", "exC", "tc", 1, {courseId: "c1", kind: "cards"})],
  decks: [
    {id: "dQ", name: "Social studies review: Renaissance and Reformation", courseId: "c2", created: 1, quizOnly: true, cards: [],
      aiQuizzes: [{id: "q1", title: "Renaissance and Reformation review", created: 1, questions: [{stem: "Who painted the Mona Lisa?"}], results: [{at: Date.now() - 3600e3, score: 8, total: 10}]}], quizzes: []},
    {id: "dC", name: "Cell parts", courseId: "c1", created: 1, cards: Array.from({length: 8}, (_, i) => card("k" + i, "Organelle " + i, "Does job " + i,
      // high boxes, but last reviewed two months ago: known then, mostly forgotten now
      {box: 4, seen: 3, right: 3, last: day(-60), due: day(-46)}))}],
  settings: {capacity: 15, sc: {intro: 1}}});

const MIME = {".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".css": "text/css", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".png": "image/png", ".webp": "image/webp"};
const server = http.createServer((req, res) => { const f = path.join(root, decodeURIComponent(new URL(req.url, "http://x").pathname)); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; } res.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res); });

(async () => {
  await new Promise(r => server.listen(0, "127.0.0.1", r));
  const browser = await chromium.launch({executablePath});
  try {
    const ctx = await browser.newContext({viewport: {width: 1100, height: 820}, serviceWorkers: "block"});
    await ctx.addInitScript(s => { window.__SB_TEST = true; try { localStorage.setItem("studyboard:rewards-test", "1"); localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "done"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studyboard:whatsNew", JSON.stringify({v: "9.9.9"})); if (!localStorage.getItem("coursework:v2")) localStorage.setItem("coursework:v2", JSON.stringify(s)); } catch (e) {} }, SEED());
    const p = await ctx.newPage(), errs = []; p.on("pageerror", e => errs.push(e.message));
    await p.goto(`http://127.0.0.1:${server.address().port}/index.html`);
    await p.waitForFunction(() => window.SBSC && window.__sbSync && window.SBPREP, null, {timeout: 30000}); await p.waitForTimeout(3600);
    await p.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
    const S = (fn, a) => p.evaluate(fn, a);
    const setTask = (id, patch) => S(([id, patch]) => { const X = window.__sbSync, t = Object.assign(X.clone(X.state.tasks[id]), patch); X.applyChanges([{kind: "task", id, after: t}], null); }, [id, patch]);

    // 1. a plan without named topics: nothing done yet, no percentage; two sessions done, a percentage
    const a0 = await S(() => SBSC.prep("exA"));
    await setTask("a1", {status: "done", doneAt: Date.now()}); await setTask("a2", {status: "done", doneAt: Date.now()});
    const a1 = await S(() => SBSC.prep("exA"));
    ok(a0 == null && a1 > 0, "a plan made without named topics gets a readiness once sessions are done: " + a0 + " → " + a1);
    // 2. 25 focused minutes on the third (30-minute) session, not ticked done: it counts, up to the session's length
    await setTask("a3", {status: "doing", focusMin: 25});
    const a2 = await S(() => SBSC.prep("exA"));
    await setTask("a3", {focusMin: 400});
    const a3 = await S(() => SBSC.prep("exA"));
    await setTask("a3", {status: "done", doneAt: Date.now()});
    const a4 = await S(() => SBSC.prep("exA"));
    ok(a2 > a1 && a3 >= a2 && a3 <= a4, "time focused on an unfinished session counts, never more than finishing it: " + [a1, a2, a3, a4].join(" → "));

    // 3. an exam with no course: the Renaissance quiz in the History quizzes counts
    const b = await S(() => SBSC.xr("exB"));
    ok(b && b.measured === 80 && b.parts.quiz === 80 && b.parts.how === "topics", "an exam with no course finds the practice quiz on its topics: " + JSON.stringify(b && {m: b.measured, how: b.parts.how}));

    // 4. the linked deck: boxes say 80%, but those cards were last seen two months ago
    const c = await S(() => { const t = window.__sbSync.state.tasks.exC; return SBPREP.pct(t); });
    const cTopic = await S(() => { const t = window.__sbSync.state.tasks.exC; const f = SBPREP.forecast(t); return f && f.topics[0]; });
    ok(c == null || c < 55, "a linked deck that was mostly forgotten doesn't count as 80% known: readiness " + c + " " + JSON.stringify(cTopic));

    // 5. a study session that raises the Cells Midterm's readiness shows it on the reward screen
    await S(() => SBSC.readySet());
    const before = await S(() => SBSC.readyNow().exC);
    await S(() => { const X = window.__sbSync, d = X.clone(X.state.decks.dC), t = new Date(), td = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
      d.cards.forEach(cd => { cd.box = 5; cd.seen += 1; cd.right += 1; cd.last = td; cd.due = td; cd.rate = "good"; }); X.applyChanges([{kind: "deck", id: "dC", after: d}], null);
      window.__sbFire && [0, 1, 2, 3, 4, 5, 6, 7].forEach(() => window.__sbFire("fc-rated", {rating: "good"})); SBSC.cardsDone(8); });
    await p.waitForSelector(".scr-rw:not(.scr-out) .scr-rd", {timeout: 6000});
    await p.waitForTimeout(2600);
    const rd = await S(() => { const r = document.querySelector(".scr-rw:not(.scr-out) .scr-rd"); return {from: +r.dataset.from, to: +r.dataset.to, shown: r.querySelector("[data-rn]").textContent, title: r.querySelector(".scr-rd-t b").textContent, up: r.querySelector(".scr-rd-up").textContent, on: r.classList.contains("on")}; });
    ok(rd.title === "Cells Midterm" && rd.from === before && rd.to > rd.from && +rd.shown === rd.to && rd.on && rd.up === `+${rd.to - rd.from}% ready`, "the reward screen shows the exam's readiness before and after: " + JSON.stringify(rd));
    await S(() => { const b = document.querySelector(".scr-rw [data-scr=ok]"); if (b) b.click(); }); await p.waitForTimeout(600);
    // studying the same cards again with no change in readiness: no readiness card
    await S(() => { window.__sbFire && window.__sbFire("fc-rated", {rating: "good"}); SBSC.cardsDone(1); });
    await p.waitForTimeout(1500);
    const again = await S(() => { const r = document.querySelector(".scr-rw:not(.scr-out)"); return {screen: !!r, ready: !!(r && r.querySelector(".scr-rd"))}; });
    ok(!again.ready, "no readiness card when readiness didn't go up: " + JSON.stringify(again));
    await S(() => { const b = document.querySelector(".scr-rw [data-scr=ok]"); if (b) b.click(); }); await p.waitForTimeout(400);
    // finishing a prep session: the task card says how much more ready for the exam
    await S(() => SBSC.readySet());
    await setTask("c1s", {status: "done", doneAt: Date.now()});
    await S(() => window.__sbSync.render());
    await p.waitForSelector(".scr-mini .scr-mini-rd", {timeout: 6000}).catch(() => {});
    const mini = await S(() => { const m = document.querySelector(".scr-mini .scr-mini-rd"); return m ? m.innerText.replace(/\s+/g, " ") : ""; });
    ok(/Cells Midterm: \d+% → \d+% ready/.test(mini), "finishing a prep session: the task card shows the exam's readiness before and after: " + mini);
    await p.waitForTimeout(5400);
    // Reward Sounds: on by default, a switch in Settings
    ok(await S(() => SBSC.fxOn()), "Reward Sounds are on unless turned off");
    ok(errs.length === 0, "no page errors: " + errs.join(" | "));
    await ctx.close();
    console.log(`\nexam-readiness-real: all ${n} checks passed`);
  } finally { await browser.close(); server.close(); }
})().catch(e => { console.error(e); process.exit(1); });
