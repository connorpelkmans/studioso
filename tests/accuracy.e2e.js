// node tests/accuracy.e2e.js  (Playwright + Chromium)
// Planning accuracy: a stopped / skipped focus session logs its elapsed minutes to the task, a task-less session offers "Which task was that for?",
// finishing a task with no tracked time offers "How long did that take?" (sparingly), Log time on the task sheet, the learned-pace sentence and its Settings switch,
// the plan using the ratio, SBTIME, phone width. Screenshots go to $SHOTS.
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const root = path.join(__dirname, ".."), SHOTS = process.env.SHOTS || path.join(require("os").tmpdir(), "acc-shots");
fs.mkdirSync(SHOTS, {recursive: true});
const MIME = {".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".webmanifest": "application/manifest+json", ".png": "image/png", ".css": "text/css", ".svg": "image/svg+xml"};
const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x"); let p = decodeURIComponent(u.pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  res.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const addD = n => { const d = new Date(); d.setDate(d.getDate() + n); return iso(d); };
const DAY = 864e5;
// Six finished labs that each took twice their estimate give a learned ratio for labs; everything else is open
const SEED = () => ({v: 2, courses: [{id: "c1", name: "Chemistry", code: "CHM101", color: "#3B6FE0"}], settings: {capacity: 15, dailyHours: 3}, updated: 1, tasks: [].concat(
  Array.from({length: 6}, (_, i) => ({id: "d" + i, title: "Old lab " + i, courseId: "c1", type: "Lab", due: addD(-5 - i), start: addD(-9 - i), hours: 2, status: "done", doneAt: Date.now() - (3 + i) * DAY, created: Date.now() - 20 * DAY, priority: "med", focusMin: 240, pomos: 8, checklist: [], history: []})),
  [{id: "t1", title: "Problem set 5", courseId: "c1", type: "Assignment", due: addD(3), start: addD(0), hours: 2, status: "todo", priority: "med", created: Date.now() - DAY, history: []},
   {id: "t2", title: "Read chapter 4", courseId: "c1", type: "Reading", due: addD(2), start: addD(0), hours: 1, status: "todo", priority: "med", created: Date.now() - DAY},
   {id: "t3", title: "Flashcards", courseId: "c1", type: "Assignment", due: addD(2), start: addD(0), hours: 1, status: "todo", priority: "med", created: Date.now() - DAY},
   {id: "t4", title: "Lab prep", courseId: "c1", type: "Assignment", due: addD(4), start: addD(0), hours: 1, status: "todo", priority: "med", created: Date.now() - DAY},
   {id: "t5", title: "Lab 7 report", courseId: "c1", type: "Lab", due: addD(6), start: addD(0), hours: 2, status: "todo", priority: "med", created: Date.now() - DAY}])});
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  const mkCtx = async (opts = {}) => {
    const ctx = await browser.newContext({viewport: {width: opts.w || 1280, height: opts.h || 900}});
    await ctx.addInitScript(seed => { try { if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("coursework:v2", JSON.stringify(seed)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("studyboard:tour", "done"); } } catch (e) {} }, SEED());
    return ctx;
  };
  const open = async ctx => { const page = await ctx.newPage(); page.errs = []; page.on("pageerror", e => page.errs.push(e.message)); page.on("console", m => { if (m.type() === "error") page.errs.push(m.text()); }); await page.goto(base); await page.waitForFunction(() => window.__sbAcc && document.querySelector("#view")); await page.waitForTimeout(300); return page; };
  const task = (page, id) => page.evaluate(i => JSON.parse(localStorage.getItem("coursework:v2")).tasks.find(t => t.id === i), id);
  const board = page => page.evaluate(() => { const B = window.__sbBreakdown; B.ui.tab = "board"; B.render(); const b = document.querySelector('[data-act="bview"][data-id="board"]'); if (b) b.click(); });
  const noOverflow = async (page, what) => { const o = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth); ok(o <= 1, "no horizontal scroll " + what); };
  const small = async (page, sel, what) => { const bad = await page.evaluate(s => [...document.querySelectorAll(s)].filter(e => e.offsetParent && (e.getBoundingClientRect().height < 43.5 || e.getBoundingClientRect().width < 43.5)).map(e => e.textContent.trim().slice(0, 20) || e.getAttribute("aria-label")), sel); ok(!bad.length, "touch targets are 44px " + what + (bad.length ? ": " + bad.join(",") : "")); };
  // Put the timer in the middle of a focus session: `done` minutes in, 25 minute session
  const midSession = async (page, taskId, doneMin, running = true) => {
    await page.evaluate(([tid, d, run]) => { const left = (25 - d) * 60000; localStorage.setItem("studioso:pomo", JSON.stringify({mode: "focus", running: run, endAt: run ? Date.now() + left : 0, left: run ? 0 : left, cycle: 0, taskId: tid, day: "", sessions: 0, minutes: 0, preset: 0})); }, [taskId, doneMin, running]);
    await page.reload(); await page.waitForFunction(() => window.__sbAcc && document.querySelector("#view")); await page.waitForTimeout(300);
  };
  const openTimer = async page => { await page.evaluate(() => { document.querySelector("#pomoBtn").click(); }); await page.waitForSelector("#pomoDlg[open]"); };
  try {
    for (const W of process.env.ACC_SKIP_LOOP ? [] : [1280, 390]) {
      console.log("\n=== width", W);
      const ctx = await mkCtx({w: W, h: W === 390 ? 780 : 900}); let page = await open(ctx);

      // ---- the learned ratio feeds the plan
      const info = await page.evaluate(() => { const A = window.__sbAcc; return {lab: A.ratioInfo({type: "Lab", courseId: "c1"}), asg: A.ratioInfo({type: "Assignment", courseId: "c1"}), sbtime: SBTIME.ratioFor({type: "Lab", courseId: "c1"})}; });
      ok(info.lab.r >= 1.6 && info.lab.r <= 2.05 && info.lab.level !== "none", "labs take about twice the estimate: " + JSON.stringify(info.lab));
      ok(info.asg.r > 1 && info.asg.r <= info.lab.r, "other types are pulled toward the global ratio: " + info.asg.r);
      ok(info.sbtime === info.lab.r, "SBTIME.ratioFor matches");
      const plan = await page.evaluate(() => window.__sbPlan().ranked.reduce((o, x) => (o[x.id] = x.R, o), {}));
      ok(plan.t5 > 3.2 && plan.t5 <= 4.1, "a 2h lab counts as about " + plan.t5 + "h of work in the plan");
      const why = await page.evaluate(() => window.__sbPlan().ranked.find(x => x.id === "t5").reasons.join(" | "));
      ok(/usually take about \d\.\dx your estimate on/.test(why), "the plan says why: " + why);
      await board(page);
      await page.evaluate(() => { document.querySelector('[data-act="plan-how"],[aria-controls="plan-how"]'); });
      const how = await page.evaluate(() => (document.querySelector("#plan-how") || {textContent: ""}).textContent);
      ok(/learns your pace/.test(how), "How is this ranked explains it");

      // ---- stopping a focus session early logs the elapsed time to its task
      await midSession(page, "t1", 10);
      await openTimer(page);
      await page.click('#pomoDlg [data-act="pomo-reset"]');
      await page.waitForTimeout(300);
      let t1 = await task(page, "t1");
      ok(t1.focusMin === 10 && t1.history.some(h => h.text === "Focus session: 10m"), "Reset after 10 minutes logs 'Focus session: 10m': " + t1.focusMin + " " + JSON.stringify(t1.history));
      ok(/^Focus session:? (\d+)m/.test(t1.history[t1.history.length - 1].text), "the old history regex still matches");
      ok(await page.evaluate(() => document.querySelector("#toast").classList.contains("show") && /Logged/.test(document.querySelector("#toast").textContent)), "a toast says so (with Undo)");
      await page.evaluate(() => document.querySelector("#pomoDlg").close());
      await page.click("#toastUndo"); await page.waitForTimeout(250);
      t1 = await task(page, "t1"); ok(!(t1.focusMin > 0), "Undo takes it back");
      // under 3 minutes: nothing
      await midSession(page, "t1", 2);
      await openTimer(page); await page.click('#pomoDlg [data-act="pomo-reset"]'); await page.waitForTimeout(250);
      t1 = await task(page, "t1"); ok(!(t1.focusMin > 0), "under 3 minutes is not logged");
      await page.evaluate(() => document.querySelector("#pomoDlg").close());
      // skipping
      await midSession(page, "t1", 20);
      await openTimer(page); await page.click('#pomoDlg [data-act="pomo-skip"]'); await page.waitForTimeout(300);
      t1 = await task(page, "t1");
      ok(t1.focusMin === 20, "Skip logs the 20 minutes done: " + t1.focusMin);
      await page.evaluate(() => document.querySelector("#pomoDlg").close());
      // paused for hours then abandoned
      await page.evaluate(() => { localStorage.setItem("studioso:pomo", JSON.stringify({mode: "focus", running: false, endAt: 0, left: 15 * 60000, pausedAt: Date.now() - 3 * 3600000, cycle: 0, taskId: "t1", day: "", sessions: 0, minutes: 0, preset: 0})); });
      await page.reload(); await page.waitForFunction(() => window.__sbAcc && document.querySelector("#view")); await page.waitForTimeout(400);
      t1 = await task(page, "t1");
      ok(t1.focusMin === 30 && t1.history.filter(h => /^Focus session/.test(h.text)).length === 2, "a session paused for 3 hours is logged when the app is reopened: " + t1.focusMin);

      // ---- no task selected: Which task was that for?
      await midSession(page, "", 12);
      await openTimer(page); await page.click('#pomoDlg [data-act="pomo-reset"]'); await page.waitForTimeout(300);
      await page.evaluate(() => document.querySelector("#pomoDlg").close());
      await page.waitForSelector("#accChip:not([hidden]) .acc-opt");
      ok(/Which task was that for/.test(await page.textContent("#accChip")), "the chip asks which task");
      await noOverflow(page, "with the chip @" + W); await small(page, "#accChip button", "on the chip @" + W);
      await page.screenshot({path: path.join(SHOTS, `which-${W}.png`)});
      ok(await page.evaluate(() => !document.querySelector("dialog[open]")), "it is not a modal");
      await page.click('#accChip [data-act="acc-dismiss"]'); await page.waitForTimeout(150);
      ok(await page.evaluate(() => document.querySelector("#accChip").hidden), "it can be dismissed");
      await midSession(page, "", 12);
      await openTimer(page); await page.click('#pomoDlg [data-act="pomo-reset"]'); await page.waitForTimeout(300); await page.evaluate(() => document.querySelector("#pomoDlg").close());
      await page.waitForSelector("#accChip:not([hidden]) .acc-opt");
      const firstId = await page.getAttribute("#accChip .acc-opt", "data-id");
      const before = await task(page, firstId);
      await page.click("#accChip .acc-opt"); await page.waitForTimeout(300);
      const after = await task(page, firstId);
      ok((after.focusMin || 0) - (before.focusMin || 0) === 12 && after.history.some(h => h.text === "Focus session: 12m"), "tapping a task adds the 12 minutes to it");
      await page.close();
      await ctx.close();
    }
    {
      const ctx = await mkCtx(); let page = await open(ctx);
      await board(page);

      // ---- Log time on the task sheet
      await page.evaluate(() => { document.querySelector('[data-act="edit-task"][data-id="t1"]').click(); });
      await page.waitForSelector("#dlg #accLog");
      await page.click('#dlg [data-act="acc-log"][data-min="30"]'); await page.waitForTimeout(250);
      let t1 = await task(page, "t1");
      ok(t1.focusMin === 30 && t1.history.some(h => h.text === "Logged time: 30m"), "+30m writes 'Logged time: 30m' and focusMin: " + JSON.stringify(t1.history.map(h => h.text)));
      ok(/30m tracked/.test(await page.textContent("#accLog")), "the total updates in place");
      await page.click('#dlg [data-act="acc-log-custom"]'); await page.fill("#accLogIn", "1h 15m"); await page.keyboard.press("Enter"); await page.waitForTimeout(250);
      t1 = await task(page, "t1");
      ok(t1.focusMin === 105 && t1.history.some(h => h.text === "Logged time: 75m"), "a custom 1h 15m logs 75m: " + t1.focusMin);
      ok(await page.evaluate(() => !!document.querySelector("#dlg[open]")), "Enter did not submit and close the task sheet");
      await page.click('#dlg [data-act="acc-log-custom"]'); await page.fill("#accLogIn", "banana"); await page.click('#dlg [data-act="acc-log-add"]');
      t1 = await task(page, "t1"); ok(t1.focusMin === 105, "a bad time logs nothing");
      // the hint under Hours Needed
      await page.evaluate(() => { document.querySelector("#dlg .sheet-head [data-act=close]").click(); });
      await page.evaluate(() => { document.querySelector('[data-act="edit-task"][data-id="t5"]').click(); });
      await page.waitForSelector("#dlg #accHint", {state: "attached"});
      await page.waitForFunction(() => !document.querySelector("#accHint").hidden);
      const hint = await page.textContent("#accHint");
      ok(/usually take about (1\.[6-9]|2\.0)x your estimate on/.test(hint) && /Today's Plan counts this as about 4h/.test(hint), "the hours field says what the plan will use: " + hint);
      await page.evaluate(() => { document.querySelector("#dlg .sheet-head [data-act=close]").click(); });

      // ---- finishing a task with no tracked time: How long did that take?
      const finish = id => page.evaluate(i => { document.querySelector(`#view [data-act="toggle"][data-id="${i}"]`).click(); }, id);
      await board(page); await finish("t2"); await page.waitForSelector("#accChip:not([hidden]) [data-act=acc-feel]");
      ok(/How long did “Read chapter 4” take/.test(await page.textContent("#accChip")) && (await page.$$("#accChip [data-act=acc-feel]")).length === 3, "three quick taps after finishing");
      await small(page, "#accChip button", "on the finish chip");
      await page.screenshot({path: path.join(SHOTS, "took.png")});
      await page.click('#accChip [data-act="acc-feel"][data-v="l"]'); await page.waitForTimeout(250);
      let t2 = await task(page, "t2"); ok(t2.feel === "l" && t2.status === "done", "'Longer' is stored on the task as feel");
      const ratioAfter = await page.evaluate(() => window.__sbAcc.memo().S.filter(s => s.src === "feel").length);
      ok(ratioAfter === 1, "and feeds the ratios as a lighter-weight sample");
      await board(page); await finish("t3"); await page.waitForTimeout(400);
      ok(await page.evaluate(() => document.querySelector("#accChip").hidden), "never asked twice in a row");
      await board(page); await finish("t4"); await page.waitForSelector("#accChip:not([hidden]) [data-act=acc-exact]");
      await page.click('#accChip [data-act="acc-exact"]'); await page.fill("#accExact", "1h 30m"); await page.click('#accChip [data-act="acc-exact-save"]'); await page.waitForTimeout(250);
      const t4 = await task(page, "t4"); ok(t4.actualMin === 90, "an exact time is stored as actualMin: " + t4.actualMin);
      ok(await page.evaluate(() => JSON.parse(localStorage.getItem("studyboard:acc:ask")).streak === 0), "answering clears the back-off");
      // back-off after dismissals
      await page.evaluate(() => { localStorage.setItem("studyboard:acc:ask", JSON.stringify({askedLast: false, streak: 3, skip: 2})); });
      await page.evaluate(() => { window.__asked = []; ["x1", "x2", "x3"].forEach((id, i) => { window.__sbAcc.maybeAskTook({id, title: "Extra " + i, type: "Assignment", hours: 1, status: "done", doneAt: Date.now(), created: Date.now() - 864e5}, 1); window.__asked.push(!document.querySelector("#accChip").hidden); }); });
      ok((await page.evaluate(() => window.__asked.join())) === "false,false,true", "after repeated dismissals it skips two completions before asking again: " + (await page.evaluate(() => window.__asked.join())));
      await page.click('#accChip [data-act="acc-dismiss"]');
      ok(await page.evaluate(() => { const a = JSON.parse(localStorage.getItem("studyboard:acc:ask")); return a.streak === 4 && a.skip === 6; }), "each dismissal backs off further");

      // ---- SBTIME
      const sb = await page.evaluate(() => { const d = new Date(), t = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`, s = SBTIME.minutesByDay(t, t), c = SBTIME.minutesByCourse(t, t), w = [...SBTIME.workedDays(t, t)]; return {s, c, w, t}; });
      ok(sb.s[sb.t] >= 105 && sb.c.c1 >= 105 && sb.w.includes(sb.t), "SBTIME reads Focus session and Logged time lines: " + JSON.stringify(sb));

      // ---- Settings switch
      await page.evaluate(() => { document.querySelector('[data-act="menu"]').click(); });
      await page.waitForSelector('#dlg [data-act="acc-toggle"]', {state: "attached"});
      ok(await page.evaluate(() => { const i = document.querySelector('#dlg [data-act="acc-toggle"]'); return i.checked && !!i.closest(".cap-row"); }), "Learn My Pace is in Settings and on by default");
      await page.evaluate(() => { document.querySelector('#dlg [data-act="acc-toggle"]').click(); });
      await page.waitForTimeout(300);
      const off = await page.evaluate(() => ({r: window.__sbAcc.ratioInfo({type: "Lab", courseId: "c1"}).r, R: window.__sbPlan().ranked.find(x => x.id === "t5").R, cap: window.__sbAcc.capScale(), s: window.__sbAcc.state().settings.accuracy}));
      ok(off.r === 1 && off.R === 2 && off.cap === 1 && off.s.adjust === false, "turned off: estimates are used exactly as typed: " + JSON.stringify(off));
      ok(page.errs.length === 0, "no page errors: " + page.errs.join("; "));
      await page.close(); await ctx.close();
    }
    console.log("\n" + n + " e2e checks passed. Screenshots in " + SHOTS);
  } catch (e) { console.error("E2E FAILED:", e.message); process.exitCode = 1; }
  await browser.close(); server.close();
})();
