// node tests/breakdown.e2e.js  (Playwright + Chromium; the AI network call is stubbed)
// Big assignment breakdown: detail-sheet entry, drop-in text flow, syllabus review checkbox, edit/shift/heavy-day/tight banner, create + one Undo, parent progress,
// complete/delete offers, due-date re-plan offer, LMS-synced parent, offline template fallback, AI path, phone width. Screenshots go to $SHOTS.
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const root = path.join(__dirname, ".."), SHOTS = process.env.SHOTS || path.join(require("os").tmpdir(), "bd-shots");
fs.mkdirSync(SHOTS, {recursive: true});
const MIME = {".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".webmanifest": "application/manifest+json", ".png": "image/png", ".css": "text/css", ".woff2": "font/woff2", ".svg": "image/svg+xml"};
const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x"); let p = decodeURIComponent(u.pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  res.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const addD = n => { const d = new Date(); d.setDate(d.getDate() + n); return iso(d); };
const SEED = () => ({v: 2, courses: [{id: "c1", name: "Marine Biology", code: "BIO210", color: "#3B6FE0"}], settings: {capacity: 15, dailyHours: 3}, updated: 1, tasks: [
  {id: "t1", title: "Research paper on coral reefs", courseId: "c1", type: "Assignment", due: addD(14), start: addD(0), hours: 12, status: "todo", priority: "med", notes: "Write a 6 page paper on coral bleaching. Use 5 scholarly sources and include 4 sections. Submit on the course site.", created: Date.now() - 864e5},
  {id: "t2", title: "Homework 2", courseId: "c1", type: "Assignment", due: addD(3), start: addD(0), hours: 1, status: "todo", priority: "med", created: Date.now() - 864e5},
  {id: "t3", title: "Tight lab report", courseId: "c1", type: "Lab", due: addD(2), start: addD(0), hours: 8, status: "todo", priority: "med", created: Date.now() - 864e5},
  {id: "t4", title: "Midterm", courseId: "c1", type: "Exam", due: addD(9), start: addD(9), status: "todo", priority: "high", created: Date.now() - 864e5},
  {id: "t5", title: "Canvas essay", courseId: "c1", type: "Assignment", due: addD(20), start: addD(0), hours: 6, status: "todo", priority: "med", created: Date.now() - 864e5, cv: {key: "cv|c1|canvas essay", ou: "1", last: {}}}]});
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const AI_STAGES = {kind: "paper", stages: [
  {title: "Pick a coral bleaching question and find sources", steps: ["Narrow to one bleaching question", "Save the scholarly sources"], done: "A source list", weight: 2, kind: "project"},
  {title: "Read the sources and take notes", steps: ["Quote the key findings"], weight: 3, kind: "reading"},
  {title: "Outline the four sections", steps: ["One sentence per section"], weight: 1.5},
  {title: "Write the six page draft", steps: ["Draft the body first"], weight: 4},
  {title: "Revise, cite and submit on the course site", steps: ["Check the citation style"], weight: 1.5}]};
(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  const mkCtx = async (opts = {}) => {
    const ctx = await browser.newContext({viewport: {width: opts.w || 1280, height: opts.h || 900}});
    await ctx.addInitScript(([seed, ai]) => {
      try { if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("coursework:v2", JSON.stringify(seed)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("studyboard:tour", "done");
        if (ai) { localStorage.setItem("studyboard:aiKeys", JSON.stringify({gemini: "AIzaTESTTESTTESTTESTTESTTEST12345"})); localStorage.setItem("studyboard:aiConsent", JSON.stringify({gemini: {v: 1, at: 1}})); } } } catch (e) {}
    }, [opts.seed ? opts.seed(SEED()) : SEED(), opts.ai !== false]);
    await ctx.route(/generativelanguage\.googleapis\.com/, async route => { ctx.aiCalls = (ctx.aiCalls || 0) + 1;
      route.fulfill({status: 200, contentType: "application/json", body: JSON.stringify({candidates: [{content: {parts: [{text: JSON.stringify(ctx.aiReply || {items: []})}]}, finishReason: "STOP"}]})}); });
    return ctx;
  };
  const open = async ctx => { const page = await ctx.newPage(); page.errs = []; page.on("pageerror", e => page.errs.push(e.message)); await page.goto(base); await page.waitForSelector("#view", {state: "attached"}); await page.waitForFunction(() => window.SBBREAK); await page.evaluate(() => { const T = window.__sbBreakdown; Object.defineProperty(window, "state", {get: () => T.state(), configurable: true}); ["ui", "render", "applyChanges", "clone", "importSheet", "lmsOf", "newTask", "allTasks", "remainingOf", "TB"].forEach(k => { window[k] = T[k]; }); }); await page.waitForTimeout(500); return page; };
  const tasks = page => page.evaluate(() => JSON.parse(localStorage.getItem("coursework:v2")).tasks);
  const kidsOf = (ts, id) => ts.filter(t => t.breakdownOf === id);
  const toastOf = page => page.evaluate(() => { const t = document.querySelector("#toast"); return t.classList.contains("show") ? t.textContent : ""; });
  const noOverflow = async (page, what) => { const o = await page.evaluate(() => { const d = document.querySelector("#dlg"); return {page: document.documentElement.scrollWidth - document.documentElement.clientWidth, dlg: d ? d.scrollWidth - d.clientWidth : 0, body: (document.querySelector("#dlg .sheet-body") || {}).scrollWidth - (document.querySelector("#dlg .sheet-body") || {}).clientWidth}; }); ok(o.page <= 0 && o.dlg <= 0 && !(o.body > 0), `no horizontal overflow ${what} (${JSON.stringify(o)})`); };
  const targets = async (page, what) => { const small = await page.evaluate(() => [...document.querySelectorAll("#dlg .bd-sheet button, #dlg .bd-sheet input, #dlg .bd-sheet select, #dlg .bd-sheet summary")].filter(e => e.offsetParent && !e.classList.contains("sr") && e.type !== "checkbox").map(e => { const r = e.getBoundingClientRect(); return {t: (e.getAttribute("aria-label") || e.textContent || e.id).trim().slice(0, 30), h: Math.round(r.height), w: Math.round(r.width)}; }).filter(x => x.h < 40 || x.w < 40)); ok(small.length === 0, `touch targets are 40px or more ${what} ${JSON.stringify(small.slice(0, 4))}`); };
  // The Board shows Today's Plan or the Task Board, one at a time on every screen size: if the task isn't in the current view, switch to the board
  const openTask = async (page, id) => {
    const row = page.locator(`#view [data-act="edit-task"][data-id="${id}"]:visible`);
    if (!(await row.count())) await page.evaluate(() => { const b = document.querySelector('[data-act="bview"][data-id="board"]'); if (b) b.click(); });
    await row.first().click();
  };
  const undo = async page => { await page.click("#toastUndo"); await page.waitForTimeout(200); };
  try {
    for (const W of [1280, 390]) {
      console.log("\n=== width", W);
      const ctx = await mkCtx({w: W, h: W === 390 ? 780 : 900}); let page = await open(ctx);
      await page.evaluate(() => { ui.tab = "courses"; ui.courseId = "c1"; render(); });   // the course page lists tasks as rows
      // ---- row action and detail sheet entry
      ok(await page.locator('.bd-row-btn[data-id="t1"]').count() === 1 && await page.locator('.bd-row-btn[data-id="t2"]').count() === 0 && await page.locator('.bd-row-btn[data-id="t4"]').count() === 0, "row action appears for the big paper only, not homework or the exam");
      await openTask(page, 't1');
      ok(await page.locator('#dlg .bd-panel.offer [data-act="bd-open"]').count() === 1, "task sheet offers Break It Down");
      await page.click('#dlg .bd-panel.offer [data-act="bd-open"]');
      await page.waitForSelector("#dlg .bd-sheet #bdList li");
      await page.waitForTimeout(800);   // the AI wording attempt (stub returns nothing usable) falls back to the template
      let items = await page.$$eval("#bdList li.bd-m", els => els.map(e => ({title: e.querySelector("[data-f=title]").value, due: e.querySelector("[data-f=due]").value, hours: Number(e.querySelector("[data-f=hours]").value)})));
      ok(items.length === 5, "12 hours gives 5 milestones: " + items.map(i => i.title).join(" | "));
      ok(items[items.length - 1].due === addD(13), "last milestone is the day before the due date");
      ok(items.every((i, k) => !k || i.due > items[k - 1].due) && items.every(i => i.due >= addD(0)), "dates ascend and none is in the past");
      ok(items.some(i => /5 sources/.test(i.title)) || items.some(i => /sources/.test(i.title)), "the 5 sources from the assignment text are used");
      ok(await page.locator("#bdStrip .bd-c").count() >= 10, "timeline strip is drawn");
      await noOverflow(page, "in the review sheet @" + W); await targets(page, "in the review sheet @" + W);
      await page.screenshot({path: path.join(SHOTS, `review-${W}.png`)});
      // ---- edit a date; shift the rest
      const first = page.locator('#bdList li.bd-m').first().locator("[data-f=due]");
      const d0 = items[0].due, d1 = addD(Number((new Date(d0 + "T00:00") - new Date(addD(0) + "T00:00")) / 864e5) + 1);
      await first.fill(d1); await first.dispatchEvent("change");
      let items2 = await page.$$eval("#bdList li.bd-m", els => els.map(e => e.querySelector("[data-f=due]").value));
      ok(items2[0] === d1 && items2.slice(1).join() === items.slice(1).map(i => i.due).join(), "changing a date moves only that one by default");
      await page.check("#bdShift");
      const second = page.locator('#bdList li.bd-m').nth(1).locator("[data-f=due]");
      const dd = items2[1], shifted = addD((new Date(dd + "T00:00") - new Date(addD(0) + "T00:00")) / 864e5 + 1);
      await second.fill(shifted); await second.dispatchEvent("change");
      let items3 = await page.$$eval("#bdList li.bd-m", els => els.map(e => e.querySelector("[data-f=due]").value));
      ok(items3[1] === shifted && items3[2] > items2[2] && items3[2] >= shifted, "with Shift the rest on, later milestones move too: " + items2.join() + " -> " + items3.join());
      await page.uncheck("#bdShift");
      // ---- heavy-day warning and move to a lighter day
      await page.evaluate(() => { const S = SBBREAK.state(); const d = S.ms[2].due; S.ctx.load[d] = 1.9; });
      await page.locator('#bdList li.bd-m').nth(2).locator("[data-f=hours]").dispatchEvent("change");
      ok(await page.locator("#bdList .bd-w button[data-a=lighter]").count() >= 1, "heavy day shows a warning with Move to lighter day");
      const before = await page.$eval('#bdList li.bd-m:nth-child(3) [data-f=due]', e => e.value);
      await page.locator('#bdList li.bd-m:nth-child(3) [data-a=lighter]').click().catch(async () => { await page.locator("#bdList [data-a=lighter]").first().click(); });
      const after = await page.$$eval("#bdList li.bd-m [data-f=due]", e => e.map(x => x.value));
      ok(/Moved to/.test(await toastOf(page)) && !(await page.$$eval("#bdList [data-f=due]", e => e.map(x => x.value))).includes("") && before.length === 10, "Move to lighter day moved it: " + await toastOf(page));
      await page.screenshot({path: path.join(SHOTS, `heavy-${W}.png`)});
      // ---- reorder and remove / add
      const t1 = await page.$eval("#bdList li.bd-m:nth-child(2) [data-f=title]", e => e.value), t2 = await page.$eval("#bdList li.bd-m:nth-child(3) [data-f=title]", e => e.value);
      await page.click("#bdList li.bd-m:nth-child(3) [data-a=up]");
      ok(await page.$eval("#bdList li.bd-m:nth-child(2) [data-f=title]", e => e.value) === t2 && await page.$eval("#bdList li.bd-m:nth-child(3) [data-f=title]", e => e.value) === t1, "move up swaps the order");
      await page.click("#bdList li.bd-m:nth-child(5) [data-a=rm]"); await page.click("#bdAdd");
      ok(await page.locator("#bdList li.bd-m").count() === 5 && /Create 5 milestones/.test(await page.textContent("#bdGo")), "remove and add milestone; primary button counts them");
      ok(/add up to/.test(await page.textContent("#bdTotal")), "total hours check shown");
      // ---- create and a single Undo
      const countBefore = (await tasks(page)).length;
      await page.click("#bdGo"); await page.waitForTimeout(300);
      let ts = await tasks(page), kids = kidsOf(ts, "t1"), par = ts.find(t => t.id === "t1");
      ok(kids.length === 5 && par.breakdownParent === true && par.due === addD(14) && kids.every(k => k.step && /^\d\/5$/.test(k.step) && k.courseId === "c1" && k.type !== "Exam" && k.hours > 0), "creates 5 milestone tasks linked to the parent; parent keeps its due date");
      ok(/Created 5 milestones/.test(await toastOf(page)), "toast says what was created");
      await page.screenshot({path: path.join(SHOTS, `created-${W}.png`)});
      await undo(page);
      ts = await tasks(page); ok(ts.length === countBefore && kidsOf(ts, "t1").length === 0 && !ts.find(t => t.id === "t1").breakdownParent, "one Undo reverses everything");
      // redo for the rest of the scenarios (template, no edits)
      await openTask(page, 't1'); await page.click('#dlg [data-act="bd-open"]'); await page.waitForSelector("#bdList li");
      await page.click("#bdGo"); await page.waitForTimeout(300);
      ts = await tasks(page); kids = kidsOf(ts, "t1"); ok(kids.length === 5, "created again");
      // ---- parent progress on the row and in the sheet
      const ids = kids.sort((a, b) => parseInt(a.step) - parseInt(b.step)).map(k => k.id);
      for (const id of ids.slice(0, 2)) await page.evaluate(id => { const t = state.tasks[id]; applyChanges([{kind: "task", id, after: Object.assign(clone(t), {status: "done", doneAt: Date.now()})}], "x"); }, id);
      await page.waitForTimeout(300);
      ok(/2 of 5 milestones done/.test(await page.textContent('[data-act="edit-task"][data-id="t1"]')), "parent row shows '2 of 5 milestones done'");
      ok(await page.locator('.bd-row-btn[data-id="t1"]').count() === 0, "no Break It Down button once it has milestones");
      await openTask(page, 't1');
      ok(/2 of 5 milestones done/.test(await page.textContent("#dlg .bd-panel")) && await page.locator("#dlg .bd-kids li").count() === 5, "detail sheet shows progress and the milestone list");
      await page.screenshot({path: path.join(SHOTS, `parent-${W}.png`)}); await page.keyboard.press("Escape");
      // ---- no double counting in the planner
      const rem = await page.evaluate(([p, k]) => ({parent: remainingOf(state.tasks[p]), kids: k.map(i => remainingOf(state.tasks[i]))}), ["t1", ids.slice(2)]);
      ok(rem.parent === 0.25 && rem.kids.every(h => h > 0), "parent counts 0.25h, milestones carry the work: " + JSON.stringify(rem));
      const crunch = await page.evaluate(() => SBCRUNCH.input().tasks.filter(t => t.id === "t1" || t.bd).map(t => ({id: t.id, bd: t.bd, rem: t.rem})));
      ok(crunch.find(t => t.id === "t1").rem === 0.25 && crunch.filter(t => t.bd).length === 3, "Crunch gets the parent at 0.25h and open milestones flagged");
      // ---- finishing the last milestones offers to complete the parent (never silently)
      for (const id of ids.slice(2)) await page.evaluate(id => { const t = state.tasks[id]; applyChanges([{kind: "task", id, after: Object.assign(clone(t), {status: "done", doneAt: Date.now()})}], "x"); }, id);
      await page.waitForTimeout(1100);
      ok(/All 5 milestones done/.test(await toastOf(page)) && (await tasks(page)).find(t => t.id === "t1").status !== "done", "all milestones done: asks, does not complete silently");
      await page.click("#toastExtra"); await page.waitForTimeout(300);
      ok((await tasks(page)).find(t => t.id === "t1").status === "done", "Mark Complete completes the parent");
      // ---- marking the parent done offers to finish remaining milestones; deleting offers to delete them
      await page.evaluate(id => { const t = state.tasks[id]; applyChanges([{kind: "task", id, after: Object.assign(clone(t), {status: "todo", doneAt: null})}], "x"); }, ids[4]);
      await page.evaluate(id => { const t = state.tasks[id]; applyChanges([{kind: "task", id, after: Object.assign(clone(t), {status: "todo", doneAt: null})}], "x"); }, "t1");
      await page.waitForTimeout(300);
      await page.evaluate(() => { const t = state.tasks.t1; applyChanges([{kind: "task", id: "t1", after: Object.assign(clone(t), {status: "done", doneAt: Date.now()})}], "x"); });
      await page.waitForTimeout(1000);
      ok(/remaining milestone/.test(await toastOf(page)), "completing the parent early offers to mark the remaining milestone done");
      await page.click("#toastExtra"); await page.waitForTimeout(300);
      ok(kidsOf(await tasks(page), "t1").every(k => k.status === "done"), "…and does it on request");
      await page.evaluate(() => { const t = state.tasks.t1; applyChanges([{kind: "task", id: "t1", after: Object.assign(clone(t), {status: "todo", doneAt: null})}], "x"); });
      await openTask(page, 't1'); await page.click('#dlg [data-act="delete-task"]'); await page.waitForSelector("#bdDelAll");
      ok(/5 milestone/.test(await page.textContent("#dlg .sheet-body")), "deleting the parent asks about its milestones");
      await page.screenshot({path: path.join(SHOTS, `delete-${W}.png`)});
      await page.click("#bdDelAll"); await page.waitForTimeout(300);
      ts = await tasks(page); ok(!ts.find(t => t.id === "t1") && kidsOf(ts, "t1").length === 0, "delete all removes the parent and the milestones");
      ok(await page.evaluate(() => Object.values(state.trash || {}).length) >= 6, "they all went to Recently Deleted");
      await undo(page); ts = await tasks(page); ok(!!ts.find(t => t.id === "t1") && kidsOf(ts, "t1").length === 5, "Undo brings back the assignment and all milestones");
      // ---- due date change offers a re-plan, keeping done milestones
      const newDue = addD(25);
      await page.evaluate(ids => { ids.forEach(id => { const t = state.tasks[id]; applyChanges([{kind: "task", id, after: Object.assign(clone(t), {status: "todo", doneAt: null})}], ""); }); }, ids.slice(2));
      await page.waitForTimeout(1500);
      await page.evaluate(d => { const t = state.tasks.t1; applyChanges([{kind: "task", id: "t1", after: Object.assign(clone(t), {due: d})}], "x"); }, newDue);
      await page.waitForTimeout(1200);
      ok(/Re-plan the \d+ open milestone/.test(await toastOf(page)), "changing the due date offers to re-plan: " + await toastOf(page));
      await page.click("#toastExtra"); await page.waitForSelector("#bdList li.bd-m");
      const rp = await page.$$eval("#bdList li.bd-m", els => els.map(e => ({done: e.classList.contains("is-done"), due: (e.querySelector("[data-f=due]") || {}).value})));
      ok(rp.filter(r => r.done).length === 2 && rp.filter(r => !r.done).length === 3, "re-plan lists the 2 done milestones as done and re-plans only the 3 open ones");
      const lastDue = rp.filter(r => r.due).slice(-1)[0].due; ok(lastDue === addD(24), "re-planned last milestone is the day before the new due date: " + lastDue);
      await page.screenshot({path: path.join(SHOTS, `replan-${W}.png`)});
      await page.click("#bdGo"); await page.waitForTimeout(300);
      ts = await tasks(page); ok(ts.find(t => t.id === "t1").bdDue === newDue && kidsOf(ts, "t1").length === 5, "re-plan updates the milestones in place, no duplicates");
      await page.close(); await ctx.close();
    }
    // ---- tight timeline, overdue catch-up (1280)
    {
      const ctx = await mkCtx(); const page = await open(ctx);
      await openTask(page, 't3'); await page.click('#dlg [data-act="bd-open"]'); await page.waitForSelector("#bdList li");
      ok(/Tight/.test(await page.textContent("#bdBanner")) && /only 2 days left/.test(await page.textContent("#bdBanner")), "tight timeline banner: " + (await page.textContent("#bdBanner")).trim().slice(0, 120));
      await page.screenshot({path: path.join(SHOTS, "tight-1280.png")});
      const its = await page.$$eval("#bdList [data-f=due]", e => e.map(x => x.value)); ok(its.every(d => d >= addD(0) && d < addD(2)), "tight plan stays between today and the due date: " + its);
      await page.click("#bdGo"); await page.waitForTimeout(300);
      // overdue milestone: catch-up
      const k = kidsOf(await tasks(page), "t3")[0];
      await page.evaluate(id => { const t = state.tasks[id]; applyChanges([{kind: "task", id, after: Object.assign(clone(t), {due: "2020-01-01", start: "2020-01-01"})}], "x"); }, k.id);
      await openTask(page, 't3');
      ok(/overdue/.test(await page.textContent("#dlg .bd-panel")) && await page.locator('#dlg [data-act="bd-catchup"]').count() >= 1, "an overdue milestone offers a catch-up plan");
      await page.click('#dlg [data-act="bd-catchup"]'); await page.waitForSelector("#bdList li");
      ok(/Catch-up/.test(await page.textContent("#dlg .sheet-head")), "catch-up sheet");
      await page.click("#bdGo"); await page.waitForTimeout(300);
      ok(kidsOf(await tasks(page), "t3").every(x => x.due >= addD(0)), "catch-up moves every unfinished milestone to today or later");
      await page.close(); await ctx.close();
    }
    // ---- drop-in text flow (1280 and phone)
    for (const W of [1280, 390]) {
      const ctx = await mkCtx({w: W, h: 780}); const page = await open(ctx);
      await page.click('[data-act="tab"][data-id="courses"], [data-tab="courses"]').catch(() => {});
      await page.evaluate(() => { ui.tab = "courses"; ui.courseId = "c1"; render(); });
      await page.waitForSelector('[data-act="bd-new-course"]'); await page.click('[data-act="bd-new-course"]');
      await page.waitForSelector("#bdText");
      await page.fill("#bdText", `Case Study Analysis 2\nDue: ${new Date(addD(12) + "T00:00").toLocaleDateString("en-US", {month: "long", day: "numeric"})} at 11:59 PM\nRead the Harvard case and answer the three questions in a 4 page memo.`);
      await page.waitForTimeout(100);
      ok(await page.inputValue("#bdTitle") === "Case Study Analysis 2" && await page.inputValue("#bdDue") === addD(12), "title and due date are read from the pasted text");
      ok(await page.inputValue("#bdCourse") === "c1", "course is the one you were looking at");
      await page.screenshot({path: path.join(SHOTS, `dropin-${W}.png`)});
      await page.click("#bdMake"); await page.waitForSelector("#bdList li");
      ok(await page.locator("#bdList li.bd-m").count() >= 3 && /Case study/.test(await page.textContent("#dlg .bd-ban, #bdPlan") || "Case study") , "plan made from the pasted prompt");
      await noOverflow(page, "in the drop-in plan @" + W);
      await page.screenshot({path: path.join(SHOTS, `dropin-plan-${W}.png`)});
      await page.click("#bdGo"); await page.waitForTimeout(300);
      const ts = await tasks(page), par = ts.find(t => t.title === "Case Study Analysis 2");
      ok(par && par.breakdownParent && par.courseId === "c1" && par.due === addD(12) && par.time === "23:59" && kidsOf(ts, par.id).length >= 3 && /Harvard case/.test(par.notes), "drop-in creates the parent (course, due, time, prompt as notes) and its milestones in one go");
      await undo(page); ok(!(await tasks(page)).find(t => t.title === "Case Study Analysis 2"), "one Undo removes the parent and the milestones");
      await page.close(); await ctx.close();
    }
    // ---- syllabus review checkbox
    {
      const ctx = await mkCtx(); ctx.aiReply = {course: {name: "History 101", code: "HIS101"}, items: [
        {title: "Research Paper", type: "Assignment", due: addD(30), hours: 10, weight: 20, sure: true}, {title: "Homework 1", type: "Assignment", due: addD(5), hours: 1, sure: true}, {title: "Midterm", type: "Exam", due: addD(20), sure: true}]};
      const page = await open(ctx);
      await page.evaluate(() => importSheet(""));
      await page.evaluate(() => { document.querySelector("#impPaste").open = true; }); await page.fill("#impText", "History 101 syllabus. Research Paper due in a month. Homework 1 next week. Midterm exam in three weeks. ".repeat(3));
      await page.click("#impRead"); await page.waitForSelector(".imp-row");
      ok(await page.locator(".imp-bd").count() === 1, "only the paper gets a 'Break down' checkbox (not homework or the exam)");
      await page.screenshot({path: path.join(SHOTS, "syllabus-1280.png")});
      const before = (await tasks(page)).length;
      await page.click("#impAdd"); await page.waitForTimeout(400);
      let ts = await tasks(page); ok(ts.filter(t => t.breakdownOf).length === 0 && ts.length === before + 3 + 0, "nothing is expanded unless ticked (" + (ts.length - before) + " tasks added)");
      await undo(page); await page.evaluate(() => importSheet("")); await page.evaluate(() => { document.querySelector("#impPaste").open = true; }); await page.fill("#impText", "History 101 syllabus. Research Paper due in a month. Homework 1 next week. Midterm exam in three weeks. ".repeat(3));
      await page.click("#impRead"); await page.waitForSelector(".imp-row"); await page.check(".imp-bd input"); await page.click("#impAdd"); await page.waitForTimeout(400);
      ts = await tasks(page); const paper = ts.find(t => t.title === "Research Paper"), ks = kidsOf(ts, paper && paper.id);
      ok(paper && paper.breakdownParent && ks.length >= 4 && ks.every(k => k.due < paper.due) && ctx.aiCalls <= 3, "ticked paper is expanded into milestones using the template (no extra AI call)");
      await page.close(); await ctx.close();
    }
    // ---- AI wording, then fallbacks (invalid AI output, AI off = offline)
    {
      const ctx = await mkCtx(); ctx.aiReply = AI_STAGES; const page = await open(ctx);
      await openTask(page, 't1'); await page.click('#dlg [data-act="bd-open"]'); await page.waitForSelector("#bdList li");
      await page.waitForFunction(() => /Used the AI/.test(document.querySelector("#bdAiMsg").textContent), null, {timeout: 8000});
      const tt = await page.$$eval("#bdList [data-f=title]", e => e.map(x => x.value));
      ok(tt[0] === AI_STAGES.stages[0].title && tt.length === 5, "AI wording is used: " + tt[0]);
      const hrs = await page.$$eval("#bdList [data-f=hours]", e => e.map(x => Number(x.value))), due = await page.$$eval("#bdList [data-f=due]", e => e.map(x => x.value));
      ok(hrs[3] > hrs[2] && due.every(d => d >= addD(0) && d < addD(14)), "AI weights set the hours; dates still come from the scheduler");
      ok(/worded by/.test(await page.textContent("#bdBanner")), "banner says the steps were AI-worded");
      await page.screenshot({path: path.join(SHOTS, "ai-1280.png")});
      ctx.aiReply = {kind: "paper", stages: [{title: "Do the work", weight: 1}, {title: "Stay organized", weight: 1}, {title: "Get started", weight: 1}, {title: "Finish up", weight: 1}]};
      await page.waitForTimeout(6200); await page.click("#bdAi"); await page.waitForFunction(() => /weren't usable|Used/.test(document.querySelector("#bdAiMsg").textContent), null, {timeout: 8000});
      ok(/weren't usable/.test(await page.textContent("#bdAiMsg")), "generic AI output is refused with a friendly note");
      await page.click("#bdTpl"); ok((await page.$$eval("#bdList [data-f=title]", e => e.map(x => x.value)))[0] !== AI_STAGES.stages[0].title, "Use simple template switches back");
      await page.close(); await ctx.close();
      const off = await mkCtx({ai: false}); const p2 = await open(off);
      await openTask(p2, 't1'); await p2.click('#dlg [data-act="bd-open"]'); await p2.waitForSelector("#bdList li");
      ok(await p2.locator("#bdList li.bd-m").count() === 5 && off.aiCalls === undefined && await p2.isDisabled("#bdAi"), "works fully offline with the template (no AI call, AI button disabled)");
      await p2.click("#bdGo"); await p2.waitForTimeout(300); ok(kidsOf(await tasks(p2), "t1").length === 5, "offline plan creates milestones");
      await p2.close(); await off.close();
    }
    // ---- LMS-synced parent: milestones are user-owned and survive a due-date change from the sync
    {
      const ctx = await mkCtx(); const page = await open(ctx);
      await openTask(page, 't5'); await page.click('#dlg [data-act="bd-open"]'); await page.waitForSelector("#bdList li"); await page.click("#bdGo"); await page.waitForTimeout(300);
      const before = kidsOf(await tasks(page), "t5").map(k => k.id).sort();
      ok(before.length >= 3 && kidsOf(await tasks(page), "t5").every(k => !k.cv && !k.bs && !k.bb), "milestones of an LMS-synced parent carry no LMS tag");
      await page.evaluate(d => { const t = state.tasks.t5; applyChanges([{kind: "task", id: "t5", after: Object.assign(clone(t), {due: d})}], ""); }, addD(27));
      await page.waitForTimeout(1200);
      ok(/Re-plan/.test(await toastOf(page)), "an LMS due-date change shows the re-plan offer instead of silently moving things");
      const after = kidsOf(await tasks(page), "t5").map(k => k.id).sort(); ok(after.join() === before.join(), "no milestone was duplicated or deleted by the sync change");
      ok(await page.evaluate(() => { const l = lmsOf(state.tasks.t5); return !!l && allTasks().filter(t => t.breakdownOf === "t5" && lmsOf(t)).length === 0; }), "LMS reconciler only sees the parent");
      await page.close(); await ctx.close();
    }
    // ---- gentle prompt on creating a big task, once
    {
      const ctx = await mkCtx(); const page = await open(ctx);
      await page.evaluate(d => { const t = newTask({title: "Term paper on tides", courseId: "c1", type: "Assignment", due: d, hours: 10}); window.__tid = t.id; applyChanges([{kind: "task", id: t.id, after: t}], "Task added"); }, addD(12));
      await page.waitForTimeout(3800);
      ok(/looks big/.test(await toastOf(page)), "creating a big task with a faraway due date shows the gentle prompt");
      await page.waitForTimeout(9500);
      await page.evaluate(() => { const t = state.tasks[window.__tid]; applyChanges([{kind: "task", id: t.id, after: Object.assign(clone(t), {priority: "high"})}], "x"); });
      await page.waitForTimeout(3800); ok(!/looks big/.test(await toastOf(page)), "it is never shown twice for the same task");
      await page.evaluate(d => { const t = newTask({title: "Quick quiz prep", courseId: "c1", type: "Assignment", due: d, hours: 1}); applyChanges([{kind: "task", id: t.id, after: t}], "Task added"); }, addD(12));
      await page.waitForTimeout(3800); ok(!/looks big/.test(await toastOf(page)), "small tasks are not prompted");
      // suggestions tray item
      const tray = await page.evaluate(() => SBBREAK.trayItem());
      ok(tray && tray.kind === "breakdown" && tray.act === "bd-open" && /Break It Down/.test(tray.btn), "Suggestions tray gets a deterministic 'Break It Down' item: " + (tray && tray.text));
      ok(["t1", "t5"].includes(tray.tid), "tray picks the biggest un-broken-down task (the paper)");
      await page.close(); await ctx.close();
    }
    // ---- integration with the take-home gate: in-person midterm + big paper with milestones, both due next week
    {
      const ctx = await mkCtx({seed: sd => { sd.tasks = sd.tasks.filter(t => ["t1"].includes(t.id)); Object.assign(sd.tasks[0], {due: addD(7)});
        sd.tasks.push({id: "mid", title: "Midterm exam", courseId: "c1", type: "Exam", due: addD(7), start: addD(7), status: "todo", priority: "high", remote: "no", remoteSrc: "user", created: Date.now() - 864e5},
          {id: "qz", title: "Quiz 3", courseId: "c1", type: "Quiz", due: addD(6), start: addD(6), status: "todo", priority: "med", remote: "yes", remoteSrc: "user", created: Date.now() - 864e5}); return sd; }});
      const page = await open(ctx);
      await openTask(page, "t1"); await page.click('#dlg [data-act="bd-open"]'); await page.waitForSelector("#bdList li"); await page.click("#bdGo"); await page.waitForTimeout(400);
      const kids = kidsOf(await tasks(page), "t1"); ok(kids.length >= 3, "paper broken into milestones next to an in-person midterm");
      const pl = await page.evaluate(() => { const p = window.__sbPlan(); return {next: p.next && p.next.id, ranked: p.ranked.map(r => ({id: r.id, R: r.R}))}; });
      ok(pl.next !== "mid" && !pl.ranked.some(r => r.id === "mid" && r.R > 0), "Do This Next never shows the in-person midterm (next: " + pl.next + ")");
      ok(pl.ranked.find(r => r.id === "t1").R === 0.25 && kids.some(k => pl.ranked.find(r => r.id === k.id && r.R > 0)), "the plan counts the milestones, the parent only 0.25h");
      const cr = await page.evaluate(() => SBCRUNCH.input().tasks.map(t => ({id: t.id, rem: t.rem, bd: t.bd})));
      ok(cr.find(t => t.id === "t1").rem === 0.25 && cr.filter(t => t.bd).length === kids.length && cr.some(t => t.id === "mid"), "Crunch counts the milestones, not the parent (the parent paper 0.25h; the in-person midterm still appears for its own lead-up load)");
      ok(await page.evaluate(() => window.__sbRemote.of("qz").can) === true && pl.ranked.find(r => r.id === "qz").R > 0, "a take-home (remote yes) quiz is still eligible and gets study time");
      ok(page.errs.length === 0, "no page errors: " + page.errs.join("; "));
      await page.close(); await ctx.close();
    }
    // ---- export CSV columns
    {
      const ctx = await mkCtx(); const page = await open(ctx);
      await openTask(page, 't1'); await page.click('#dlg [data-act="bd-open"]'); await page.waitForSelector("#bdList li"); await page.click("#bdGo"); await page.waitForTimeout(300);
      const csv = await page.evaluate(() => { const f = TB.toCsvFiles({courses: Object.values(state.courses), tasks: Object.values(state.tasks)}, {tasks: true}); return f["tasks.csv"]; });
      ok(/milestone_of,step/.test(csv.split("\n")[0]) && /Research paper on coral reefs,1\/5|,1\/5\r?\n/.test(csv), "tasks.csv has milestone_of and step columns");
      ok(page.errs.length === 0, "no page errors: " + page.errs.join("; "));
      await page.close(); await ctx.close();
    }
    console.log("\n" + n + " e2e checks passed. Screenshots in " + SHOTS);
  } catch (e) { console.error("E2E FAILED:", e.message); process.exitCode = 1; }
  await browser.close(); server.close();
})();
