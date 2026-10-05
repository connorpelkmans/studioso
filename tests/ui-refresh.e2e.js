// UI refresh: timeline icons, Board tabs on desktop, Crunch and Today's Plan decluttering, settings sub-tabs, area of study,
// note boards, Grades tab in Courses, and the Companion tab (chat answered by a stubbed Gemini).  Run: node tests/ui-refresh.e2e.js
const path = require("path"), assert = require("assert");
const {chromium} = require(process.env.PW_MODULE || "/opt/node-tools/node_modules/playwright");
const FILE = "file://" + path.join(__dirname, "..", "index.html");
const exe = require("fs").existsSync("/opt/pw-browsers/chromium") ? "/opt/pw-browsers/chromium" : undefined;
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const NOW = new Date(2026, 9, 4, 10, 0, 0);
const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const plus = k => { const d = new Date(NOW); d.setDate(d.getDate() + k); return iso(d); };
const SEED = {v: 2, courses: [{id: "c1", name: "Biology", code: "BIO 101", color: "#3B6FE0"}, {id: "c2", name: "History", code: "HIS 200", color: "#1E9E74"}],
  tasks: [
    {id: "t1", title: "Midterm", courseId: "c1", type: "Exam", due: plus(9), time: "09:00", weight: 40, status: "todo", start: plus(9)},
    {id: "t2", title: "Lab report", courseId: "c1", type: "Lab", due: plus(3), hours: 3, status: "todo", start: plus(0)},
    {id: "t3", title: "Read ch 4", courseId: "c2", type: "Reading", due: plus(1), status: "todo", start: plus(0)},
    {id: "t4", title: "Essay", courseId: "c2", type: "Assignment", due: plus(6), hours: 5, weight: 30, status: "doing", start: plus(0)},
    {id: "t5", title: "Finished thing", courseId: "c2", type: "Assignment", due: plus(2), weight: 20, mark: {got: 17, outOf: 20}, status: "done", start: plus(0)}],
  decks: [], notes: [], files: [], events: [], settings: {capacity: 15, dailyHours: 3}, updated: 1};
const IGNORE = /S is not defined/;          // an unrelated companion animation error that exists on main
const tab = (p, t) => p.evaluate(t => { const b = document.querySelector(`[data-tab="${t}"]`); if (b) b.click(); }, t).then(() => p.waitForTimeout(400));
const act = (p, a, i) => p.evaluate(([a, i]) => { const b = document.createElement("button"); b.dataset.act = a; if (i) b.dataset.id = i; b.style.display = "none"; document.body.appendChild(b); b.click(); b.remove(); }, [a, i]).then(() => p.waitForTimeout(350));
const stored = p => p.evaluate(() => JSON.parse(localStorage.getItem("coursework:v2")));
(async () => {
  const browser = await chromium.launch({executablePath: exe});
  try {
    for (const W of [1280, 390]) {
      console.log("== " + W);
      const ctx = await browser.newContext({viewport: {width: W, height: 900}});
      await ctx.clock.install({time: NOW});
      await ctx.addInitScript(seed => { try { if (!sessionStorage.getItem("seeded")) { sessionStorage.setItem("seeded", "1"); localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("coursework:v2", JSON.stringify(seed)); } } catch (e) {} }, SEED);
      await ctx.route("**/generativelanguage.googleapis.com/**", r => r.fulfill({status: 200, contentType: "application/json", body: JSON.stringify({candidates: [{content: {parts: [{text: JSON.stringify({answer: "Start with the **lab report**.", sources: ["Task: Lab report"], followUps: ["Plan it"]})}]}, finishReason: "STOP"}]})}));
      const p = await ctx.newPage(), errs = []; p.on("pageerror", e => errs.push(e.message));
      await p.goto(FILE); await p.waitForTimeout(1400);
      const vis = sel => p.evaluate(s => { const e = document.querySelector(s); return !!e && !!(e.offsetWidth || e.offsetHeight); }, sel);

      // Board: Today's Plan and Task Board are tabs on every screen size
      await tab(p, "board");
      ok(await vis(".bview-tabs"), "Board has the Today's Plan / Task Board tabs");
      ok(await vis(".bpane-plan") && !(await vis(".bpane-board")), "one pane at a time: Today's Plan");
      await act(p, "bview", "board");
      ok(await vis(".bpane-board .board") && !(await vis(".bpane-plan")), "Task Board pane shows alone");
      await act(p, "bview", "plan");
      ok(await vis(".next-up"), "Do This Next stays up front");
      ok(await p.evaluate(() => !document.querySelector(".focus.plan > .auto-ins, .focus.plan > .plan-fc, .focus.plan > .plan-heads")), "suggestions, flashcards and heads-ups are grouped under More for Today (open when a question needs an answer)");

      // Timeline: icons on due dates, no bars, no completed tasks, no hours-per-week row
      await tab(p, "plan"); await act(p, "plan-view", "timeline");
      ok((await p.locator(".tl-ic.ms").count()) === 4, "one icon per open task with a due date (the finished task is left out)");
      ok((await p.locator(".tlbar").count()) === 0 && (await p.locator(".tl-work").count()) === 0, "no bars and no Hours per Week row");
      ok(!(await p.evaluate(() => document.querySelector(".tl").textContent.includes("Finished thing"))), "completed tasks are not on the timeline");
      ok(await p.evaluate(() => { const tl = document.querySelector(".tl-scroll"); return tl.scrollWidth > 0 && document.documentElement.scrollWidth <= innerWidth + 1; }), "no horizontal page overflow");

      // Crunch: summary first, legend tucked away
      await act(p, "plan-view", "crunch");
      ok(await vis(".cr-call") && await vis(".cr-help summary") && !(await p.locator(".cr-legend").isVisible()), "Crunch shows the summary and keeps the legend under How to read this");

      // Settings: sub-tabs inside categories, search still finds everything
      await act(p, "menu");
      await p.evaluate(() => document.querySelector('.us-cat[data-us="data"]').click()); await p.waitForTimeout(200);
      const subs = await p.$$eval(".us-pane.on .us-sub-tab", b => b.map(x => x.textContent));
      ok(subs.join() === "Backups,Export,Cleanup", "Data and Backups has sub-tabs: " + subs.join());
      await p.evaluate(() => document.querySelectorAll(".us-pane.on .us-sub-tab")[2].click()); await p.waitForTimeout(150);
      ok(await vis('.us-pane.on [data-act="clear-all"]') && !(await vis('.us-pane.on [data-act="backup-now"]')), "choosing a sub-tab shows only its rows");
      if (W < 720) { await p.click(".us-back"); await p.waitForTimeout(150); }   // phones: a category page has Back to the list, where the search box is
      await p.fill(".us-q", "backup"); await p.waitForTimeout(250);
      ok(await vis('.us-pane [data-act="backup-now"]'), "searching shows matching rows from every sub-tab");
      await p.fill(".us-q", "");

      // Area of study
      await p.evaluate(() => document.querySelector('.us-cat[data-us="study"]').click()); await p.waitForTimeout(200);
      await p.click('[data-act="area-open"]'); await p.waitForTimeout(300);
      await p.click('[data-area="cs"]'); await p.fill("#areaText", "Computer Engineering"); await p.click("[data-area-save]"); await p.waitForTimeout(300);
      const st = await stored(p);
      ok(st.settings.area && st.settings.area.id === "cs" && st.settings.area.text === "Computer Engineering", "the area of study is saved in the settings");
      await tab(p, "board");
      ok((await p.inputValue("#qaIn").then(() => p.getAttribute("#qaIn", "placeholder"))).includes("cs project"), "the quick-add example follows the area");

      // Note boards
      await tab(p, "notes");
      await act(p, "note-new"); await p.fill("#noteText", "Main board note"); await p.click(".tl-controls h2"); await p.waitForTimeout(250);
      await act(p, "nb-new"); await p.fill('input[name=name]', "Biology"); await p.selectOption('select[name=courseId]', "c1"); await p.click("[data-submit]"); await p.waitForTimeout(400);
      ok((await p.locator(".nb-tab[role=tab]").count()) === 3 || (await p.locator(".nb-tab").count()) >= 3, "a new board gets its own tab");
      ok((await p.locator(".note").count()) === 0, "the new board starts empty");
      await act(p, "note-new"); await p.fill("#noteText", "Biology note"); await p.click(".tl-controls h2"); await p.waitForTimeout(250);
      const ns = (await stored(p)).notes;
      ok(ns.length === 2 && ns.some(x => x.text === "Biology note" && x.board && x.courseId === "c1") && ns.some(x => x.text === "Main board note" && !x.board), "notes are kept per board and tagged with the board's class");
      await p.click('.nb-tab[data-id=""]'); await p.waitForTimeout(250);
      ok((await p.locator(".note").count()) === 1, "switching back shows only My Notes");

      // Grades tab in Courses
      await tab(p, "courses");
      await act(p, "course-tab", "grades");
      ok(await vis(".gp-list") && (await p.locator(".gp-course").count()) === 2, "Courses has a Grades tab with one card per course");
      await act(p, "g-open-course", "c2");
      ok(await vis(".gr-card") && /Marked/.test(await p.textContent(".gr-card")), "a course's Grades tab shows the grade card with its marked and unmarked work");
      await act(p, "course-tab", "info");
      ok(await vis(".detail-head") && !(await vis(".gr-card")), "Tasks and Info is the other tab");

      // Companion tab: chat, history, manage
      await p.evaluate(() => { localStorage.setItem("studyboard:aiKeys", JSON.stringify({gemini: "AIzaTESTTESTTESTTESTTESTTEST12345"})); localStorage.setItem("studyboard:aiConsent", JSON.stringify({gemini: {v: 1, at: 1}})); });
      await p.reload(); await p.waitForTimeout(1300);
      await tab(p, "companion");
      ok(await vis(".cpt-head") && (await p.locator(".cpt-chips .chip").count()) >= 2, "the Companion tab shows the companion and starter questions");
      await p.click('[data-act="cpt-ask"]'); await p.waitForTimeout(1500);
      ok(/lab report/i.test(await p.textContent(".cpt-a")), "the companion answers in the chat");
      ok((await p.inputValue("#cptIn")) === "", "the question box is cleared after asking");
      await act(p, "cpt-tab", "history");
      ok((await p.locator(".cpt-h").count()) === 1, "the chat is kept under Chats");
      await act(p, "cpt-tab", "manage");
      ok(await vis(".cpt-manage .cp-tile") && await vis("#cpName"), "Manage has the picker, name and accessories");
      ok(!errs.filter(e => !IGNORE.test(e)).length, "no page errors: " + errs.filter(e => !IGNORE.test(e)).join("; "));
      await ctx.close();
    }
    console.log(`ui-refresh.e2e: ${n} checks passed`);
  } catch (e) { console.error("FAILED:", e.stack || e.message); process.exitCode = 1; }
  await browser.close();
})();
