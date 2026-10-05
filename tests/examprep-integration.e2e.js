// Integration: Exam Prep Planner + take-home gate (remoteexams) + big assignment breakdown, in one planner.  Run: node tests/examprep-integration.e2e.js [outDir]
// An in-person exam with a prep plan, a take-home quiz, and a big paper with milestones. Checks: Do This Next never shows the in-person exam, prep sessions and milestones
// can be suggested, Crunch counts each piece of work once, the exam edit sheet shows both "Where is this taken?" and the prep block, and Plan My Prep works.
const path = require("path"), fs = require("fs"), assert = require("assert"), os = require("os");
const {chromium, executablePath} = require("./pw");
const FILE = "file://" + path.join(__dirname, "..", "index.html");
const OUT = process.argv[2] || fs.mkdtempSync(path.join(os.tmpdir(), "sbint-"));
fs.mkdirSync(OUT, {recursive: true});
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const NOW = new Date(2026, 9, 4, 10, 0, 0);
const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const plus = k => { const d = new Date(NOW); d.setDate(d.getDate() + k); return iso(d); };
const SEED = {v: 2, courses: [{id: "c1", name: "Biology", code: "BIO 101", color: "#3B6FE0"}, {id: "c2", name: "History", code: "HIS 200", color: "#1E9E74"}],
  tasks: [
    {id: "ex1", title: "Midterm", courseId: "c1", type: "Exam", due: plus(9), time: "09:00", weight: 30, remote: "no", remoteSrc: "user", status: "todo", start: plus(9)},
    {id: "qz1", title: "Take-home quiz", courseId: "c1", type: "Quiz", due: plus(5), remote: "yes", remoteSrc: "user", status: "todo", start: plus(5)},
    {id: "pp", title: "History paper", courseId: "c2", type: "Assignment", due: plus(12), hours: 10, breakdownParent: true, status: "todo", start: plus(0)},
    {id: "m1", title: "History paper: outline", courseId: "c2", type: "Assignment", due: plus(3), hours: 2, breakdownOf: "pp", step: "1/3", bdKind: "outline", bdDue: plus(3), bdHours: 2, status: "todo", start: plus(1)},
    {id: "m2", title: "History paper: draft", courseId: "c2", type: "Assignment", due: plus(8), hours: 5, breakdownOf: "pp", step: "2/3", bdKind: "draft", bdDue: plus(8), bdHours: 5, status: "todo", start: plus(4)},
    {id: "m3", title: "History paper: polish", courseId: "c2", type: "Assignment", due: plus(11), hours: 2, breakdownOf: "pp", step: "3/3", bdKind: "polish", bdDue: plus(11), bdHours: 2, status: "todo", start: plus(9)}],
  decks: [{id: "d1", name: "Cardiac Drugs", courseId: "c1", created: 1, cards: [{id: "k1", front: "Beta blocker", back: "Metoprolol", box: 0, due: "", seen: 0, right: 0, wrong: 0}]}],
  notes: [], files: [], events: [], settings: {capacity: 15, dailyHours: 3}, updated: 1};
const act = (page, a, id) => page.evaluate(([a, i]) => { const b = document.createElement("button"); b.dataset.act = a; if (i) b.dataset.id = i; b.style.display = "none"; document.body.appendChild(b); b.click(); b.remove(); }, [a, id]);
const store = page => page.evaluate(() => JSON.parse(localStorage.getItem("coursework:v2")));
const vis = (page, sel) => page.evaluate(s => { const e = document.querySelector(s); return !!e && !!(e.offsetWidth || e.offsetHeight); }, sel);
(async () => {
  const browser = await chromium.launch({executablePath});
  try {
    for (const [W, H] of [[1280, 800], [390, 844]]) {
      console.log("== " + W);
      const ctx = await browser.newContext({viewport: {width: W, height: H}});
      await ctx.clock.install({time: NOW});
      await ctx.addInitScript(seed => { try { if (!sessionStorage.getItem("seeded")) { sessionStorage.setItem("seeded", "1"); localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "1"); localStorage.setItem("coursework:v2", JSON.stringify(seed)); } } catch (e) {} }, SEED);
      const page = await ctx.newPage(); const errs = []; page.on("pageerror", e => errs.push(e.message));
      await page.goto(FILE); await page.waitForTimeout(1500);
      // Plan My Prep on the in-person exam works (and is offered on the take-home quiz too)
      await act(page, "edit-task", "ex1"); await page.waitForTimeout(400);
      const sheet = await page.evaluate(() => document.querySelector("#dlg").innerText);
      ok(/Where is this taken\?/i.test(sheet) || await vis(page, "input[name=remote]"), "the exam edit sheet has the Where is this taken? control");
      ok(await vis(page, ".pp-form") && /Plan My Prep/.test(await page.evaluate(() => document.querySelector(".pp-form").innerText)), "and the prep block, in the same sheet");
      ok(await page.evaluate(() => document.querySelector("#dlg").scrollWidth <= document.querySelector("#dlg").clientWidth + 1), "no horizontal overflow in the edit sheet");
      await page.screenshot({path: path.join(OUT, `edit-${W}.png`)});
      await page.click(".pp-form [data-act=exam-plan]"); await page.waitForTimeout(500);
      ok(await vis(page, "#ppBody"), "Plan My Prep opens the planner for the in-person exam");
      await page.fill("#ppAdd", "Cardiac drugs\nRenal physiology\nAcid base"); await page.click("[data-pp=add]");
      await page.click("#ppCreate"); await page.waitForTimeout(600);
      let ts = (await store(page)).tasks; const ss = ts.filter(t => t.prepFor === "ex1");
      ok(ss.length >= 6 && ss.every(t => t.type === "Study" && !t.breakdownOf && !t.remote), "prep sessions are Study tasks with no breakdown or take-home fields");
      ok(ts.filter(t => t.breakdownOf === "pp").length === 3 && ts.filter(t => t.breakdownOf === "pp").every(t => !t.prepFor), "milestones stay milestones, never prep sessions");
      // Do This Next
      await page.evaluate(() => { const b = document.querySelector('[data-tab="board"]'); if (b) b.click(); }); await page.waitForTimeout(300);
      await act(page, "bview", "plan"); await page.waitForTimeout(400);
      const next = await page.evaluate(() => (document.querySelector(".next-up .nu-title") || {innerText: ""}).innerText);
      ok(next && !/^Midterm\b/.test(next.trim()), "Do This Next is not the in-person exam: " + next.replace(/\n/g, " "));
      const planTitles = await page.evaluate(() => [...document.querySelectorAll(".next-up .nu-title, .plan-list:not(#plan-more .plan-list) .plan-row .task-title")].filter(e => e.offsetParent && !e.closest("#plan-more")).map(e => e.innerText.replace(/\s+/g, " ").trim()));
      ok(!planTitles.some(t => /^Midterm\b/.test(t)), "the in-person exam is never a suggested row (the take-home quiz may be): " + planTitles.join(" | "));
      ok(planTitles.some(t => /Midterm: /.test(t) || /History paper: /.test(t)), "prep sessions or milestones are suggested");
      ok(await vis(page, ".plan-row .focus-go") || await vis(page, ".next-up .btn.primary"), "suggested sessions can start a focus");
      await act(page, "bview", "board"); await page.waitForTimeout(200);
      // Crunch counts each piece once
      const c = await page.evaluate(() => { const inp = SBCRUNCH.input(); const T = inp.tasks; return {prep: T.filter(t => t.prep).map(t => [t.id, t.rem]), bd: T.filter(t => t.bd).map(t => [t.id, t.rem]), par: T.find(t => t.id === "pp"), ex: T.find(t => t.id === "ex1"), ids: T.map(t => t.id)}; });
      ok(c.ids.length === new Set(c.ids).size, "every task appears once in the Crunch input");
      ok(c.prep.length === ss.length && Math.abs(c.prep.reduce((a, x) => a + x[1], 0) - ss.reduce((a, t) => a + t.hours, 0)) < 0.01, "Crunch counts every prep session's hours once");
      ok(c.bd.length === 3 && Math.abs(c.bd.reduce((a, x) => a + x[1], 0) - 9) < 0.01, "and the milestones' 9h once");
      ok(c.par.rem <= 0.25 && c.ex.rem === 0, "the umbrella paper and the exam don't add their own hours on top");
      const model = await page.evaluate(() => { const m = SBCRUNCH.model(); return m.days.reduce((a, d) => a + d.demand, 0); });
      ok(model > 0 && isFinite(model), "the Crunch model builds with all three: " + model.toFixed(1) + "h");
      ok(errs.length === 0, "no page errors: " + errs.join("; "));
      await ctx.close();
    }
  } finally { await browser.close(); }
  console.log(`examprep-integration.e2e.js: ${n} checks passed. Screenshots in ${OUT}`);
})().catch(e => { console.error(e); process.exit(1); });
