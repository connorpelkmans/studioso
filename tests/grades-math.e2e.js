// node tests/grades-math.e2e.js: the grade math and its screens. Excused and missed work, drop rules in the breakdown, rounding
// next to a letter cutoff, bonus in the current grade, unweighted marks, What If (every item, groups, Solve, pretend marks),
// letter / pass / excused / late-penalty marks, over-100 marks, must-pass parts, category weights, Pass/Fail courses and past courses.
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const root = path.join(__dirname, "..");
const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x"); let p = decodeURIComponent(u.pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  const mime = {".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".css": "text/css"};
  res.writeHead(200, {"content-type": mime[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const pad = x => String(x).padStart(2, "0");
const day = k => { const d = new Date(); d.setDate(d.getDate() + k); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const now = Date.now();
const T = (id, title, c, type, due, o) => Object.assign({id, title, courseId: c, type, start: day(-40), due, time: "", priority: "med", status: "todo", notes: "", hours: 2, checklist: [], pct: 0, dependsOn: [], history: [], created: 1, order: 10}, o || {});
const M = (got, outOf) => ({status: "done", pct: 100, doneAt: now - 3 * 864e5, mark: {got, outOf}});
const C = (id, name, code, o) => Object.assign({id, name, code, color: "#3B6FE0", meetings: [{id: id + "m", kind: "Lecture", days: [2, 4], start: "10:00", end: "11:20"}]}, o || {});
const SEED = {v: 2, updated: 1, settings: {grades: {prompt: false, pass: 60}}, events: [], notes: [], decks: [], files: [],
  courses: [
    C("rnd", "Organic Chemistry", "CHEM 2100"),
    C("drp", "Statistics", "STAT 1500", {grading: {rules: {drops: [{cat: "Quiz", n: 1}]}}}),
    C("exc", "Sociology", "SOCI 1000"),
    C("ovd", "Microeconomics", "ECON 1010"),
    C("fin", "Art History", "ARTH 1200"),
    C("bon", "Physics", "PHYS 1100", {grading: {rules: {bonus: {pts: 5, got: 5}}}}),
    C("hld", "Linguistics", "LING 1000"),
    C("lse", "Chemistry Lab", "CHEM 1051"),
    C("wif", "Calculus II", "MATH 1310"),
    C("nur", "Pharmacology", "NURS 2200", {grading: {rules: {must: [{cat: "Exam", min: 50}]}}}),
    C("cat", "Biology II", "BIOL 1210", {grading: {cats: [{cat: "Quiz", w: 20}, {cat: "Final", w: 40}], sylCats: [{cat: "Quiz", w: 20, by: "eq"}, {cat: "Lab", w: 15, by: "eq"}]}}),
    C("pfc", "Clinical Practice", "NURS 1900", {grading: {pf: true}}),
    C("old", "Ancient Rome", "HIST 2000", {archived: "Summer 2026", archivedAt: 1})],
  tasks: [
    T("r1", "Midterm Exam", "rnd", "Exam", day(-10), Object.assign({weight: 50}, M(44.98, 50))), T("r2", "Final Exam", "rnd", "Exam", day(20), {weight: 50}),
    T("d1", "Quiz 1", "drp", "Quiz", day(-30), Object.assign({weight: 5}, M(10, 10))), T("d2", "Quiz 2", "drp", "Quiz", day(-23), Object.assign({weight: 5}, M(9.5, 10))),
    T("d3", "Quiz 3", "drp", "Quiz", day(-16), Object.assign({weight: 5}, M(9, 10))), T("d4", "Quiz 4", "drp", "Quiz", day(-9), Object.assign({weight: 5}, M(2, 10))),
    T("d5", "Project Report", "drp", "Assignment", day(-12), Object.assign({weight: 20}, M(85, 100))), T("d6", "Midterm", "drp", "Exam", day(-14), Object.assign({weight: 30}, M(88, 100))),
    T("d7", "Final Exam", "drp", "Exam", day(25), {weight: 30}),
    T("e1", "Essay", "exc", "Assignment", day(-20), Object.assign({weight: 30}, M(80, 100))),
    T("e2", "Reflection Journal", "exc", "Assignment", day(-8), {weight: 20, status: "done", pct: 100, doneAt: now - 8 * 864e5, bs: {key: "9|rj", ou: "9", last: {title: "Reflection Journal", weight: 20}, st: {excused: true}}}),
    T("e3", "Final Exam", "exc", "Exam", day(20), {weight: 50}),
    T("o1", "Problem Set 1", "ovd", "Assignment", day(-20), Object.assign({weight: 10}, M(80, 100))), T("o2", "Problem Set 2", "ovd", "Assignment", day(-10), {weight: 30, late: "none"}),
    T("o3", "Final Exam", "ovd", "Exam", day(30), {weight: 60}),
    T("f1", "Essay 1", "fin", "Assignment", day(-30), Object.assign({weight: 40}, M(85, 100))), T("f2", "Essay 2", "fin", "Assignment", day(-16), Object.assign({weight: 60}, M(82, 100))),
    T("f9", "Field Trip Reading", "fin", "Reading", day(-16)),
    T("b1", "Lab Reports", "bon", "Lab", day(-10), Object.assign({weight: 50}, M(80, 100))), T("b2", "Final Exam", "bon", "Exam", day(25), {weight: 50}),
    T("h1", "Midterm", "hld", "Exam", day(-10), Object.assign({weight: 50}, M(86.56, 100))), T("h2", "Final Exam", "hld", "Exam", day(25), {weight: 50}),
    ...[18, 15, 19, 12].map((g, i) => T("l" + i, "Lab " + (i + 1), "lse", "Lab", day(-30 + i * 7), M(g, 20))),
    T("w0", "Midterm", "wif", "Exam", day(-10), Object.assign({weight: 30}, M(72, 100))),
    ...Array.from({length: 10}, (x, i) => T("wq" + i, "Weekly Quiz " + (i + 1), "wif", "Quiz", day(3 + i * 3), {weight: 3})),
    T("wf", "Final Exam", "wif", "Exam", day(40), {weight: 40}),
    T("n1", "Med Calc Test", "nur", "Exam", day(-12), Object.assign({weight: 30}, M(45, 100))), T("n2", "Care Plans", "nur", "Assignment", day(-5), Object.assign({weight: 40}, M(98, 100))),
    T("n3", "Final Exam", "nur", "Exam", day(30), {weight: 30}),
    T("k1", "Quiz 1", "cat", "Quiz", day(-12), M(8, 10)), T("k2", "Quiz 2", "cat", "Quiz", day(-5), {weight: 7}), T("k3", "Final Exam", "cat", "Exam", day(30)), T("k4", "Lab Report", "cat", "Lab", day(-6), Object.assign({weight: 40}, M(30, 40))),
    T("pf1", "Placement Hours", "pfc", "Assignment", day(-6), Object.assign({weight: 100}, M(80, 100))),
    T("x1", "Essay", "old", "Assignment", day(-120), Object.assign({weight: 50, archivedTerm: "Summer 2026"}, M(70, 100))), T("x2", "Exam", "old", "Exam", day(-100), Object.assign({weight: 50, archivedTerm: "Summer 2026"}, M(90, 100)))]};
(async () => {
  await new Promise(r => server.listen(0, r));
  const browser = await chromium.launch({executablePath});
  try {
    const ctx = await browser.newContext({viewport: {width: 1280, height: 1000}});
    await ctx.addInitScript(seed => { window.__SB_TEST = true; try { if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("coursework:v2", JSON.stringify(seed)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("studyboard:tour", "done"); } } catch (e) {} }, SEED);
    const page = await ctx.newPage(); const errs = []; page.on("pageerror", e => errs.push(e.message));
    await page.goto("http://localhost:" + server.address().port + "/"); await page.waitForFunction(() => window.__sbSync && window.SBGRADES && window.__sbGrades);
    const act = (a, id, extra) => page.evaluate(([a, id, extra]) => { const x = document.createElement("button"); x.dataset.act = a; if (id) x.dataset.id = id; Object.assign(x.dataset, extra || {}); x.hidden = true; document.body.appendChild(x); x.click(); x.remove(); }, [a, id, extra]).then(() => page.waitForTimeout(300));
    const card = async id => { await act("g-open-course", id); return page.evaluate(() => (document.querySelector(".gr-card") || {}).innerText || ""); };
    const G = id => page.evaluate(id => { const g = window.__sbGrades.courseGrade(id); return {cur: g.current, min: g.minFinal, max: g.maxFinal, rem: g.remaining, risk: g.risk, done: g.done, fin: g.final, unw: g.unw, D: g.D, missed: g.missed.map(t => t.id), exc: g.exc.map(t => t.id), ts: g.ts.map(t => t.id)}; }, id);
    // clicks go straight to the element: a celebration popup can sit over the page
    const clk = sel => page.evaluate(sel => { const el = document.querySelector(sel); if (!el) throw new Error("no " + sel); el.click(); }, sel).then(() => page.waitForTimeout(150));
    const parse = (s, sc) => page.evaluate(([s, sc]) => window.__sbGrades.parseMark(s, sc), [s, sc]);

    // GR8: 44.98/50 is 89.96%, a B+: the number, letter and mark agree
    let t = await card("rnd");
    ok(/89\.96% B\+/.test(t) && !/\b90% B\+/.test(t) && /44\.98\/50/.test(t), "a grade next to a cutoff keeps its decimals and the mark is shown as typed");
    // GR17: earned bonus is in the current grade
    t = await card("bon");
    ok(/Current Grade\s*85% B/.test(t) && /5% bonus \(80% \+ 5%\)/.test(t), "earned bonus counts in the current grade");
    // GR7: the dropped quiz is out of Where Your Grade Comes From
    t = await card("drp");
    ok(/3 counted \(1 dropped\)/.test(t) && /Quizzes[\s\S]{0,60}95%/.test(t) && !/Your lowest is Quizzes/.test(t), "the breakdown uses the drop rule");
    // GR2: excused work is out of the grade, its weight shared by the rest
    let g = await G("exc");
    ok(g.exc.includes("e2") && !g.ts.includes("e2") && Math.abs(g.D - 80) < 1e-6 && Math.abs(g.rem - 62.5) < 1e-6, "excused work is left out and the course is out of the rest: " + JSON.stringify(g));
    t = await card("exc");
    ok(/Reflection Journal[\s\S]{0,80}Excused/.test(t) && !/WHAT IF\?[\s\S]*Reflection Journal[\s\S]*MARKED/i.test(t), "excused work has an Excused pill and isn't in What If");
    ok(!(await page.evaluate(() => window.SBGRADES.waiting().map(x => x.title))).includes("Reflection Journal"), "excused work isn't waiting for a mark");
    // GR3: work that can't be handed in counts as 0 in what you can still get
    g = await G("ovd");
    ok(g.missed.includes("o2") && Math.abs(g.max - 68) < 1e-6 && g.risk === "risk", "missed work counts as 0: highest 68%, pass mark at risk: " + JSON.stringify(g));
    t = await card("ovd");
    ok(/Missed, counted as 0/.test(t) && /highest you can still get is 68%/i.test(t) && /Possible range 8% to 68%/.test(t), "missed work is said on the card");
    await clk('[data-act="g-handed"][data-id="o2"]'); await page.waitForTimeout(300);
    g = await G("ovd");
    ok(!g.missed.length && Math.abs(g.max - 98) < 1e-6, "I Still Handed It In makes it work waiting for a mark again");
    // GR6: weekly classes still running: not final
    g = await G("fin");
    ok(g.done && !g.fin, "all marked a month before the term ends isn't final");
    await page.evaluate(() => { const s = window.__sbSync.state; s.courses.fin.classDates = {from: "2020-01-01", until: "2020-03-01"}; });
    ok((await G("fin")).fin, "with a Last Class date long past it is final");
    // GR12: marks with no weights make an unweighted average
    t = await card("lse");
    ok(/Unweighted Average\s*80% B-/.test(t) && /of 4 marks/.test(t), "unweighted average of 4 marks");
    ok(/Unweighted average of 4 marks: 80% B-/.test(await page.evaluate(() => window.SBGRADES.now(window.__sbSync.state.courses.lse).line)), "the course card and Grades page say so too");
    // GR15: a needed score is rounded up on the Grades page
    await act("g-grades");
    const row = c => page.evaluate(c => { const r = [...document.querySelectorAll(".gp-course")].find(x => x.textContent.includes(c)); return r ? r.querySelector(".gp-line").textContent : ""; }, c);
    ok(/Needs 79\.5% on the remaining 50% to keep your B/.test(await row("LING 1000")), "Grades page rounds a needed score up: " + await row("LING 1000"));
    // GR24: archived courses are under Past Courses, and can be saved to Past Terms
    ok(await page.evaluate(() => { const d = document.querySelector(".gp-past"); return !!d && /Ancient Rome/.test(d.textContent) && /80%/.test(d.textContent); }), "Past Courses lists the archived course with its final grade");
    await page.evaluate(() => { document.querySelector(".gp-past").open = true; document.querySelector(".gp-past-c details").open = true; });
    await clk('[data-act="gp-past-save"][data-id="old"]'); await page.waitForTimeout(300);
    ok(await page.evaluate(() => (window.__sbSync.state.settings.grades.terms || []).some(t => t.name === "Summer 2026" && t.courses.some(c => c.code === "HIST 2000" && c.pct === 80))), "Save to Past Terms adds it under its term");
    // GR13 / GR23: What If lists the final and the quizzes as one row; Solve works out what the final needs
    t = await card("wif");
    ok(/Final Exam/.test(t.slice(t.indexOf("WHAT IF"))) && /All Remaining Quizzes \(10\)/.test(t), "What If has the final exam and a row for all the quizzes");
    await page.fill('[data-wi="g:Quiz"]', "90"); await page.waitForTimeout(150);
    await clk('[data-act="wi-solve"][data-id="wf"]'); await page.waitForTimeout(300);
    const sv = await page.evaluate(() => document.querySelector(".gr-wi-solve").textContent), fv = await page.evaluate(() => document.querySelector('[data-wi="wf"]').value);
    ok(/With 90% on the remaining quizzes/.test(sv) && /you need [\d.]+% on Final Exam/.test(sv) && Number(fv) > 0, "Solve gives what the final needs: " + sv);
    await page.evaluate(() => { document.querySelector(".gr-wi-marked").open = true; });
    await page.fill('[data-wi="w0"]', "90"); await page.waitForTimeout(150);
    ok(/Pretending one mark you have is different/.test(await page.evaluate(() => document.querySelector(".gr-wi-out").textContent)), "a mark you have can be tried, labelled as pretend");
    // GR20 / GR22: letters, pass/fail, excused, late penalties
    let v = await parse("A-");
    ok(v && v.letter === "A-" && v.got === 91.5, "A- counts at the middle of its range: " + JSON.stringify(v));
    ok((await parse("Pass")).pf === "pass" && (await parse("Fail")).got === 0 && (await parse("EX")).ex && (await parse("0/0")).ex, "pass, fail and excused");
    v = await parse("17/20 - 10% late");
    ok(v && Math.abs(v.got - 15.3) < 1e-6 && v.before === 17 && v.outOf === 20, "a late penalty is taken off the mark: " + JSON.stringify(v));
    ok((await parse("70/50")).got === 70, "70/50 still reads (bonus marks are possible)");
    // GR18: over 100% asks once before saving
    await act("g-mark", "h2");
    await page.fill("#gmIn", "70/50"); await page.waitForTimeout(100);
    ok(/over 100%\. Is this bonus\?/.test(await page.evaluate(() => document.querySelector("#gmOut").textContent)) && !/adds/.test(await page.evaluate(() => document.querySelector("#gmOut").textContent)), "the preview asks about over 100%");
    await clk("dialog [data-submit]"); await page.waitForTimeout(200);
    ok(await page.evaluate(() => !window.__sbSync.state.tasks.h2.mark && document.querySelector("dialog").open), "the first Save asks instead of saving");
    await clk("dialog [data-submit]"); await page.waitForTimeout(300);
    ok(await page.evaluate(() => window.__sbSync.state.tasks.h2.mark && window.__sbSync.state.tasks.h2.mark.got === 70), "the second Save keeps it");
    // excused from the mark sheet
    await act("g-mark", "h2");
    await clk('[data-gm="Excused"]'); await clk("dialog [data-submit]"); await page.waitForTimeout(300);
    g = await G("hld");
    ok(g.exc.includes("h2") && g.done, "Excused in the mark sheet takes the item out of the grade");
    // late penalty field in the mark sheet
    await act("g-mark", "r2");
    await page.fill("#gmIn", "40/50"); await page.evaluate(() => { document.querySelector(".gr-pen").open = true; }); await page.fill("#gmPen", "10%"); await page.waitForTimeout(100);
    await clk("dialog [data-submit]"); await page.waitForTimeout(300);
    ok(await page.evaluate(() => { const m = window.__sbSync.state.tasks.r2.mark; return m && m.got === 36 && m.before === 40; }), "the mark is saved after its late penalty, with the mark before it");
    ok(await page.evaluate(() => window.__sbSync.state.tasks.r2.latePen === 10 && window.SBGRADES.latePenFor("rnd") === 0.1), "the penalty is kept as the task's late penalty, and the course's late-cost guess uses it");
    t = await card("rnd");
    ok(/36\/50 \(40\/50 before late penalty\)/.test(t), "and shown with the mark before the penalty");
    // GR21: overall passing, but the exam average is under the 50% it needs
    g = await G("nur");
    ok(g.cur >= 60 && g.risk === "risk", "a must-pass part puts the course at risk: " + JSON.stringify(g));
    t = await card("nur");
    ok(/Overall you're passing, but your exam average of 45% is under the 50% you need/.test(t), "and says why");
    // GR19: category weights shared by the items in them
    g = await G("cat");
    const share = await page.evaluate(() => { window.__sbGrades.courseGrade("cat"); return window.SBGRADES.math.courseGrade(window.__sbSync.state.courses.cat).ts.map(t => [t.id, t.type]); });
    ok(g.ts.includes("k1") && g.ts.includes("k2") && g.ts.includes("k3") && Math.abs(g.cur - (10 * 80 + 40 * 75) / 50) < 1e-6, "a marked quiz with no weight of its own counts in its category: " + JSON.stringify(g) + JSON.stringify(share));
    t = await card("cat");
    ok(/worth 10%[\s\S]{0,20}\(a share of Quizzes\)/.test(t), "each quiz shows its share of the category");
    await act("g-course-set", "cat");
    ok(await page.evaluate(() => document.querySelectorAll(".gr-cat-row").length === 2 && /Your syllabus gives/.test(document.querySelector(".gr-cats").textContent) === false), "Grade Settings lists the categories");
    await page.evaluate(() => { document.querySelectorAll(".gr-cat-row .gr-drop-del").forEach(b => b.click()); });
    ok(await page.evaluate(() => /Your syllabus gives/.test(document.querySelector(".gr-cats").textContent) || !document.querySelector(".gr-cat-row")), "rows can be removed");
    await clk("#grCatAdd"); await page.fill('.gr-cat-row input[name="kw"]', "25"); await clk("dialog [data-submit]"); await page.waitForTimeout(300);
    ok(await page.evaluate(() => { const c = window.__sbSync.state.courses.cat.grading; return c.cats.length === 1 && c.cats[0].cat === "Quiz" && c.cats[0].w === 25 && c.sylCats.length === 2; }), "saving keeps the categories typed in, and the syllabus's");
    // Pass/Fail course
    ok((await page.evaluate(() => window.SBGRADES.now(window.__sbSync.state.courses.pfc).letter)) === "Pass", "a Pass/Fail course shows Pass, not a letter");
    ok(!errs.length, "no page errors: " + errs.join(" | "));
    console.log("\ngrades-math.e2e: " + n + " checks passed");
  } finally { await browser.close(); server.close(); }
})().catch(e => { console.error(e); process.exit(1); });
