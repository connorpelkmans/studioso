// node tests/grades-sync.e2e.js  Marks and weights coming in from the school site, a syllabus or a paste, and what other features say about them:
// an unchanged Mark box keeps a synced mark, Today's Plan only states real weights, a Brightspace bonus item keeps the real weights,
// Paste Grades types and category rows, synced syllabus weights by name, estimated weights told to the AI, old work Waiting for a Mark
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert"); const {chromium, executablePath} = require("./pw");
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const root = path.join(__dirname, "..");
const MIME = {".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".webp": "image/webp", ".json": "application/json", ".woff2": "font/woff2"};
const srv = http.createServer((q, r) => { let p = decodeURIComponent(new URL(q.url, "http://x").pathname); if (p === "/") p = "/index.html"; const f = path.join(root, p); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); r.end(); return; } r.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(r); });
const DAY = 864e5, iso = k => { const d = new Date(Date.now() + k * DAY); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const T = (id, title, courseId, type, due, o) => Object.assign({id, title, courseId, type, due, start: iso(-5), time: "", priority: "med", status: "todo", notes: "", hours: 2, checklist: [], pct: 0, dependsOn: [], history: [], created: Date.now() - 40 * DAY, order: 10}, o || {});
const done = (got, outOf, ago) => ({status: "done", pct: 100, doneAt: Date.now() - (ago || 3) * DAY, mark: got == null ? undefined : {got, outOf}});
const G = (gid, name, num, den, wden) => ({type: 1, gid, name, num, den, wden});
(async () => {
  await new Promise(r => srv.listen(0, r)); const b = await chromium.launch({executablePath});
  const c = await b.newContext({viewport: {width: 1300, height: 900}});
  const data = {v: 2, courses: [
    {id: "nur", name: "Pharmacology", code: "NURS 2200", color: "#1E9E74"}, {id: "bsc", name: "Nursing Theory", code: "NURS 1100", color: "#3B6FE0"},
    {id: "syc", name: "Biology II", code: "BIOL 1210", color: "#D9661F"}, {id: "his", name: "World History", code: "HIST 1100", color: "#8E44AD"},
    {id: "drp", name: "Statistics", code: "STAT 1500", color: "#2C3E50"}, {id: "phl", name: "Philosophy", code: "PHIL 1000", color: "#7F8C8D"}],
  tasks: [
    T("n1", "Med Calc Test", "nur", "Exam", iso(-5), Object.assign(done(), {weight: 20, mark: {got: 86.56, outOf: 100, src: "bs"}, bs: {key: "5|medcalctest", ou: "5", gid: "g7", last: {title: "Med Calc Test", weight: 20}}})),
    T("n2", "Final Exam", "nur", "Exam", iso(30), {weight: 80}),
    T("i1", "Unit 3 Test", "his", "Exam", iso(3), {hours: 4}), T("i2", "Museum Poster", "his", "Project", iso(6), {hours: 5}),
    T("d1", "Quiz 1", "drp", "Quiz", iso(-20), Object.assign({weight: 10}, done(9, 10))), T("d2", "Final Exam", "drp", "Exam", iso(25), {weight: 50}),
    T("p1", "Paper 1", "phl", "Assignment", iso(-21), Object.assign({weight: 25}, done(null, null, 20))), T("p2", "Paper 2", "phl", "Assignment", iso(-6), Object.assign({weight: 25}, done(null, null, 5))),
    T("p3", "Midterm", "phl", "Exam", iso(-12), Object.assign({weight: 20}, done(74, 100, 10))), T("p4", "Final Exam", "phl", "Exam", iso(30), {weight: 30}),
    T("est1", "Case Study", "phl", "Assignment", iso(-4), Object.assign(done(), {weight: 33.3, mark: {got: 18, outOf: 20, src: "bs"}, bs: {key: "1|x", ou: "1", last: {weight: 33.3, wPts: true}}}))],
  events: [], notes: [], decks: [], files: [], updated: 1,
  settings: {capacity: 18, dailyHours: 4, brightspace: {host: "learn.example.edu", mode: "api", name: "Ana", map: {"5": "nur", "7": "bsc", "8": "syc"}, courses: {"5": {code: "NURS2200", name: "Pharmacology"}, "7": {code: "NURS1100", name: "Nursing Theory"}, "8": {code: "BIOL1210", name: "Biology II"}}}}};
  await c.addInitScript(d => { localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "1"); localStorage.setItem("coursework:v2", d); }, JSON.stringify(data));
  const pg = await c.newPage(); const errs = []; pg.on("pageerror", e => errs.push(e.message)); await pg.goto(`http://localhost:${srv.address().port}/`); await pg.waitForTimeout(1500);
  const st = () => pg.evaluate(() => { const t = JSON.parse(localStorage.getItem("coursework:v2")); return {tasks: Array.isArray(t.tasks) ? t.tasks : Object.values(t.tasks), courses: Array.isArray(t.courses) ? t.courses : Object.values(t.courses)}; });
  const task = async id => (await st()).tasks.find(t => t.id === id);
  const sync = h => pg.evaluate(h => { const L = SBLMS.brightspace, d = L.fromApi(h); L.applyPlan(d, L.plan(d), "api", true); }, h);
  const act = (a, id) => pg.evaluate(([a, id]) => { const x = document.createElement("button"); x.dataset.act = a; if (id) x.dataset.id = id; x.hidden = true; document.body.appendChild(x); x.click(); x.remove(); }, [a, id]);

  // GR1: saving a task with its Mark box untouched keeps the synced mark, so a regrade still arrives
  await pg.evaluate(() => SBASSIST.jump({kind: "task", id: "n1"}, {open: true})); await pg.waitForTimeout(600);
  await pg.evaluate(() => { const b = [...document.querySelectorAll("dialog[open] button")].find(x => x.innerText.trim() === "Edit"); if (b) b.click(); }); await pg.waitForTimeout(500);
  ok(await pg.evaluate(() => document.querySelector("#gMarkIn").value) === "86.6%", "the Mark box shows the rounded mark");
  await pg.evaluate(() => { const x = document.querySelector('dialog textarea[name="notes"]'); x.value = "Bring a calculator"; x.dispatchEvent(new Event("input", {bubbles: true})); });
  await pg.click("dialog [data-submit]"); await pg.waitForTimeout(600);
  const n1 = await task("n1");
  ok(n1.notes === "Bring a calculator" && n1.mark.got === 86.56 && n1.mark.src === "bs", "editing only the notes keeps the exact synced mark: " + JSON.stringify(n1.mark));
  await sync({origin: "https://learn.example.edu", me: {name: "Ana"}, all: [], courses: [{ou: "5", name: "Pharmacology", code: "NURS2200", folders: [], quizzes: [], discussions: [], events: [], grades: [G("g7", "Med Calc Test", 94, 100, 20), G("g8", "Final Exam", null, 100, 80)]}]});
  ok((await task("n1")).mark.got === 94, "and the school site's regrade still comes in");
  await pg.evaluate(() => SBASSIST.jump({kind: "task", id: "n1"}, {open: true})); await pg.waitForTimeout(500);
  await pg.evaluate(() => { const b = [...document.querySelectorAll("dialog[open] button")].find(x => x.innerText.trim() === "Edit"); if (b) b.click(); }); await pg.waitForTimeout(400);
  await pg.fill("#gMarkIn", "47/50"); await pg.click("dialog [data-submit]"); await pg.waitForTimeout(600);
  const n1b = await task("n1"); ok(n1b.mark.got === 47 && n1b.mark.outOf === 50 && !n1b.mark.src, "a mark typed into the box is still saved as yours");

  // GR4: Today's Plan never states a type's default weight as a share of the grade
  const plan = await pg.evaluate(() => window.__sbPlan());
  const rs = plan.ranked.concat(plan.laterRows).filter(x => /Unit 3|Poster/.test(x.title)).map(x => x.title + ": " + x.reasons.join(" / "));
  ok(rs.length >= 2 && rs.every(r => !/% of your grade/.test(r)), "no '% of your grade' for work without a weight: " + rs.join(" || "));
  ok(rs.some(r => /^Unit 3 Test:.*No grade weight yet/.test(r)) && rs.some(r => /^Museum Poster:.*No grade weight yet/.test(r)), "big work with no weight says 'No grade weight yet'");
  ok(rs.some(r => /^Study for Unit 3 Test/.test(r)), "the exam still gets a study entry");

  // GR5: a weighted Brightspace course with a bonus item keeps its real weights, and the bonus counts only as bonus
  await sync({origin: "https://learn.example.edu", me: {name: "Ana"}, all: [], courses: [{ou: "7", name: "Nursing Theory", code: "NURS1100", folders: [], quizzes: [], discussions: [], events: [],
    grades: [G("b1", "Care Plan 1", 8, 10, 30), G("b2", "Midterm Exam", 70, 100, 30), G("b3", "Final Exam", null, 100, 40), G("b4", "Bonus: Participation", 3, 5, 5)]}]});
  let s1 = await st();
  const bt = s1.tasks.filter(t => t.courseId === "bsc"), byT = x => bt.find(t => t.title === x) || {};
  ok(byT("Care Plan 1").weight === 30 && byT("Midterm Exam").weight === 30 && !byT("Care Plan 1").bs.last.wPts, "the school's weights are kept even though they add up past 100%");
  ok(byT("Bonus: Participation").weight == null && byT("Bonus: Participation").bs.bonus === true, "the bonus item has no weight of its own");
  ok(JSON.stringify(s1.courses.find(x => x.id === "bsc").grading.rules.bonus) === JSON.stringify({pts: 5, got: 3, src: "school"}), "and goes into the course's bonus: up to 5%, 3% earned");
  const gB = await pg.evaluate(() => window.__sbGrades.courseGrade("bsc"));
  ok(Math.abs(gB.current - 75) < 0.05 && !gB.pts, "the course grade is the real 75%, not a points split: " + gB.current);

  // GR11: every named line of a synced syllabus's breakdown reaches the task of that name
  const syl = "BIOL 1210 Course Outline\nGrading\nLab Report 15%\nMidterm Exam 35%\nTerm Essay 20%\nFinal Project 30%\n";
  await sync({origin: "https://learn.example.edu", me: {name: "Ana"}, all: [], courses: [{ou: "8", name: "Biology II", code: "BIOL1210", syl: [syl], events: [], quizzes: [], discussions: [],
    folders: [{id: 99, name: "Final Project", due: new Date(Date.now() + 20 * DAY).toISOString(), gid: "h9"}], grades: [G("h1", "Lab Report", 18, 20), G("h2", "Midterm Exam", 60, 100), G("h3", "Term Essay", 40, 50)]}]});
  s1 = await st();
  const sw = x => (s1.tasks.find(t => t.courseId === "syc" && t.title === x) || {}).weight;
  ok(sw("Lab Report") === 15 && sw("Midterm Exam") === 35 && sw("Term Essay") === 20 && sw("Final Project") === 30, "Lab Report, Midterm, Term Essay and Final Project all get the syllabus's weights");
  await sync({origin: "https://learn.example.edu", me: {name: "Ana"}, all: [], courses: [{ou: "8", name: "Biology II", code: "BIOL1210", syl: [syl], events: [], quizzes: [], discussions: [], folders: [{id: 99, name: "Final Project", due: new Date(Date.now() + 20 * DAY).toISOString(), gid: "h9"}], grades: [G("h1", "Lab Report", 18, 20), G("h2", "Midterm Exam", 60, 100), G("h3", "Term Essay", 40, 50)]}]});
  s1 = await st(); ok(sw("Lab Report") === 15 && sw("Term Essay") === 20, "and keep them on the next sync");

  // GR9: Paste Grades types new items by name and leaves a category's total row out
  await act("g-open-course", "drp"); await pg.waitForTimeout(400); await act("g-paste", "drp"); await pg.waitForTimeout(500);
  await pg.fill("#pgIn", ["Grade Item\tPoints\tWeight Achieved\tGrade", "Quizzes\t\t17.5 / 20\t87.5 %", "Quiz 5\t9 / 10\t4.5 / 5\t90 %", "Quiz 6\t8 / 10\t4 / 5\t80 %", "Lab Practical\t40 / 50\t\t80 %"].join("\n")); await pg.waitForTimeout(300);
  ok(await pg.evaluate(() => { const b = document.querySelector('[data-pg-on="0"]'); return !!b && !b.checked && /category total/.test(b.closest("li").innerText); }), "the 'Quizzes' total row is shown unticked as a category total");
  await pg.click("#pgGo"); await pg.waitForTimeout(600);
  s1 = await st(); const pt = s1.tasks.filter(t => t.courseId === "drp").map(t => [t.title, t.type]);
  ok(JSON.stringify(pt.filter(x => /Quiz [56]|Lab Practical|^Quizzes$/.test(x[0])).sort()) === JSON.stringify([["Lab Practical", "Lab"], ["Quiz 5", "Quiz"], ["Quiz 6", "Quiz"]]), "quizzes come in as Quizzes, the lab as a Lab, and no 'Quizzes' item: " + JSON.stringify(pt));

  // GR14: the AI is told which weights are estimates
  const ai = await pg.evaluate(() => ({items: SBGRADES.items().filter(x => x.id === "est1"), lines: SBGRADES.lines().filter(l => /PHIL/.test(l))}));
  ok(ai.items[0] && ai.items[0].weightEst === true && ai.items[0].weight === 33.3, "an estimated weight is flagged for the AI");
  ok(/estimates from points/.test(ai.lines[0] || ""), "and the course line says some weights are estimates: " + ai.lines[0]);

  // GR16: work handed in more than two weeks ago stays in Waiting for a Mark, oldest first, and the counts match
  const w = await pg.evaluate(() => SBGRADES.waiting());
  ok(w.length >= 2 && w[0].title === "Paper 1" && /20 days ago/.test(w[0].ago) && w.some(x => x.title === "Paper 2"), "Paper 1 (20 days ago) is listed first: " + JSON.stringify(w));
  await act("g-grades"); await pg.waitForTimeout(600);
  const page = await pg.evaluate(() => ({rows: [...document.querySelectorAll("ul.gs-wait li")].map(x => x.innerText.replace(/\n/g, " ")), sum: (document.querySelector(".gp-sum") || {}).innerText || ""}));
  ok(/Paper 1.*20 days ago/.test(page.rows[0] || "") && new RegExp(page.rows.length + "\\s+Waiting for a mark").test(page.sum), "the Grades page lists it, and its tile counts the same: " + page.rows.join(" | ") + " / " + page.sum.replace(/\n/g, " "));

  ok(!errs.length, "no page errors: " + errs.join(" | "));
  await b.close(); srv.close(); console.log(`grades-sync.e2e: ${n} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
