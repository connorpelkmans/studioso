// node tests/log-time.e2e.js
// Log Time: type in time worked on a task (today or an earlier day), and see it day by day
const path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const FILE = "file://" + path.join(__dirname, "..", "index.html");
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const NOW = new Date("2026-10-27T14:00:00-07:00"), TODAY = "2026-10-27", YEST = "2026-10-26";
const T = (id, title, due, hours, extra) => Object.assign({id, title, courseId: "c1", type: "Assignment", start: "", due, time: "", priority: "med", status: "todo", notes: "", hours, checklist: [], history: [], pct: 0, order: 1, created: 1}, extra || {});

(async () => {
  const browser = await chromium.launch({executablePath});
  try {
    for (const vp of [{width: 1300, height: 900}, {width: 390, height: 844}]) {
      const w = vp.width;
      const ctx = await browser.newContext({viewport: vp, timezoneId: "America/Vancouver"});
      const p = await ctx.newPage(), errs = []; p.on("pageerror", e => errs.push(e.message));
      await p.clock.install({time: NOW});
      await p.addInitScript(tasks => {
        localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("studioso:tour", "done"); localStorage.setItem("sb:onboarded", "1");
        localStorage.setItem("coursework:v2", JSON.stringify({v: 2, courses: [{id: "c1", name: "Nursing", code: "BSNC 1030", color: "#8B5CF6", meetings: [], links: []}], tasks, files: [], notes: [], decks: [], events: [], settings: {dailyHours: 3}, updated: 1}));
      }, [T("sim", "Sim Reflection", "2026-11-02", 3), T("a2", "Assignment 2", "2026-11-03", 2),
          // from before the day-by-day log: two focus sessions in its history
          T("old", "Care Plan", "2026-11-04", 4, {focusMin: 50, history: [{at: new Date("2026-10-20T10:00:00-07:00").getTime(), text: "Focus session: 25m"}, {at: new Date("2026-10-22T10:00:00-07:00").getTime(), text: "Focus session: 25m"}]})]);
      await p.goto(FILE); await p.waitForFunction(() => window.__sbPlan && window.__sbBreakdown, null, {timeout: 40000}); await p.waitForTimeout(600);
      const task = id => p.evaluate(id => { const t = window.__sbBreakdown.state().tasks[id]; return {focusMin: t.focusMin || 0, log: (t.workLog || []).map(e => [e.d, e.m, e.k])}; }, id);
      const openLT = id => p.evaluate(id => { const b = document.createElement("button"); b.dataset.act = "log-time"; b.dataset.id = id; document.body.appendChild(b); b.click(); b.remove(); }, id).then(() => p.waitForTimeout(300));
      const statDay = d => p.evaluate(d => ((window.__sbBreakdown.state().settings || {}).focusDays || {})[d] || 0, d);

      // Do This Next has Log Time
      const btn = p.locator('.next-up [data-act="log-time"]');
      ok(await btn.count() === 1, `${w}: Do This Next has a Log Time button`);
      const hero = await btn.getAttribute("data-id");
      await btn.click(); await p.waitForTimeout(300);
      ok(await p.locator("dialog[open] .lt-sheet").count() === 1, `${w}: it opens Log Time`);
      // A bad time is refused
      await p.fill("#ltMin", "lots"); await p.click("dialog[open] [data-submit]"); await p.waitForTimeout(200);
      ok(await p.locator("dialog[open] .lt-sheet").count() === 1 && /Try a time like/.test(await p.locator("#toast").textContent()), `${w}: a time it can't read is refused`);
      // 45m today, from a quick pick
      await p.click('dialog[open] [data-lt="45"]'); await p.click("dialog[open] [data-submit]"); await p.waitForTimeout(400);
      let t = await task(hero);
      ok(t.focusMin === 45 && JSON.stringify(t.log) === JSON.stringify([[TODAY, 45, "log"]]), `${w}: 45m logged for today: ` + JSON.stringify(t));
      ok(await statDay(TODAY) === 45, `${w}: it counts toward today's study time`);
      const plan = await p.evaluate(() => window.__sbPlan());
      ok(Math.abs(plan.doneToday - 0.75) < 0.01, `${w}: today's plan knows 45m is already done: ` + plan.doneToday);

      // 1h 30m yesterday, typed in
      await openLT(hero);
      await p.fill("#ltMin", "1h 30m"); await p.check('dialog[open] input[name="ltDay"][value="yest"]');
      await p.click("dialog[open] [data-submit]"); await p.waitForTimeout(400);
      // and 20m on an earlier day
      await openLT(hero);
      await p.fill("#ltMin", "20"); await p.check('dialog[open] input[name="ltDay"][value="other"]');
      ok(await p.locator("dialog[open] .lt-date").isVisible(), `${w}: Earlier shows a date to pick`);
      await p.fill("#ltDate", "2026-10-21"); await p.click("dialog[open] [data-submit]"); await p.waitForTimeout(400);
      t = await task(hero);
      ok(t.focusMin === 155 && t.log.some(e => e[0] === YEST && e[1] === 90) && t.log.some(e => e[0] === "2026-10-21" && e[1] === 20), `${w}: earlier days are logged on their own day: ` + JSON.stringify(t));
      ok(await statDay(YEST) === 90 && await statDay(TODAY) === 45, `${w}: yesterday's time goes to yesterday, not today`);

      // The day-by-day record
      await openLT(hero);
      const rows = (await p.locator("dialog[open] .tw-days > li").allInnerTexts()).map(s => s.replace(/\s+/g, " ").trim());
      ok(rows.length === 3 && /^Today 45m/.test(rows[0]) && /^Yesterday 1h 30m/.test(rows[1]) && /Oct 21 20m/.test(rows[2]), `${w}: Log Time lists the time worked, newest day first: ` + JSON.stringify(rows));
      const over = await p.evaluate(() => { const d = document.querySelector("dialog[open]"), b = d.getBoundingClientRect(); return [...d.querySelectorAll(".lt-sheet *")].filter(e => { const r = e.getBoundingClientRect(); return r.width && (r.right > b.right + 1 || r.left < b.left - 1); }).length; });
      ok(!over, `${w}: nothing spills out of the sheet`);
      // Taking back time typed in by mistake
      await p.locator('dialog[open] [data-act="tw-del"]').first().click(); await p.waitForTimeout(300);
      t = await task(hero);
      ok(t.focusMin === 110 && !t.log.some(e => e[0] === TODAY) && await statDay(TODAY) === 0, `${w}: removing today's 45m takes it back everywhere: ` + JSON.stringify(t));
      await p.evaluate(() => { const d = document.querySelector("#dlg"); if (d && d.open) d.close(); });

      // Also Today rows have it too
      const rowBtn = p.locator('.plan-row [data-act="log-time"]');
      ok(await rowBtn.count() >= 1, `${w}: Also Today rows have a Log Time button`);

      // A task from before the day-by-day log keeps its history, and the task editor shows the days
      await p.evaluate(() => { const b = document.createElement("button"); b.dataset.act = "log-time"; b.dataset.id = "old"; document.body.appendChild(b); b.click(); b.remove(); }); await p.waitForTimeout(300);
      const oldRows = (await p.locator("dialog[open] .tw-days > li").allInnerTexts()).map(s => s.replace(/\s+/g, " ").trim());
      ok(oldRows.length === 2 && oldRows.every(r => /25m focus sessions/.test(r)), `${w}: earlier focus sessions show by day: ` + JSON.stringify(oldRows));
      await p.fill("#ltMin", "30m"); await p.click("dialog[open] [data-submit]"); await p.waitForTimeout(400);
      t = await task("old");
      ok(t.focusMin === 80 && t.log.length === 3 && t.log.filter(e => e[2] === "focus").length === 2, `${w}: logging on it keeps the earlier sessions: ` + JSON.stringify(t));
      await p.evaluate(() => { const b = document.createElement("button"); b.dataset.act = "edit-task"; b.dataset.id = "old"; document.body.appendChild(b); b.click(); b.remove(); }); await p.waitForTimeout(400);
      const ed = (await p.locator("dialog[open] .acc-log .tw-days > li").allInnerTexts()).map(s => s.replace(/\s+/g, " ").trim());
      ok(ed.length === 3 && /^Today 30m/.test(ed[0]), `${w}: the task editor shows time worked by day: ` + JSON.stringify(ed));
      ok(!errs.length, `${w}: no page errors: ` + errs.join(" | "));
      if (w === 1300) await p.screenshot({path: process.env.SHOT ? process.env.SHOT + "/lt-editor.png" : "/dev/null"}).catch(() => {});
      await ctx.close();
    }
  } finally { await browser.close(); }
  console.log(`\nlog-time.e2e: ${n} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
