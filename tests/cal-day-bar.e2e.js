// node tests/cal-day-bar.e2e.js
// Calendar on a phone: Due Dates is just what's due (no events, no event bars: events are on the Schedule only); the Schedule's
// Month view (Options > Month View) shows each day's events as colour bars inside the cell, and the picked day's events below.
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const root = path.join(__dirname, "..");
const server = http.createServer((req, res) => { let p = decodeURIComponent(new URL(req.url, "http://x").pathname); if (p === "/") p = "/index.html"; const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; } res.writeHead(200, {"content-type": {".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json"}[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res); });
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const SEED = {v: 2, updated: 1, courses: [{id: "c1", name: "Nursing", code: "BSNC", color: "#C0563A"}, {id: "c2", name: "Bio", code: "BIO", color: "#3FA37A"}],
  tasks: [{id: "t1", title: "Reflection", courseId: "c1", type: "Assignment", due: "2026-11-19", status: "todo", created: 1}, {id: "t2", title: "Exam", courseId: "c1", type: "Exam", due: "2026-11-19", status: "todo", created: 1},
    {id: "t3", title: "Late lab", courseId: "c2", type: "Assignment", due: "2026-11-10", status: "todo", created: 1}],
  events: [{id: "e1", title: "Shift", courseId: "c1", date: "2026-11-19", start: "09:00", end: "12:00"}, {id: "e2", title: "Group", courseId: "c2", date: "2026-11-10", start: "09:00", end: "12:00"}], settings: {}};
(async () => {
  await new Promise(r => server.listen(0, r));
  const browser = await chromium.launch({executablePath}), errs = [];
  try {
    for (const w of [375, 402, 430]) {
      const ctx = await browser.newContext({viewport: {width: w, height: 874}, isMobile: true, hasTouch: true});
      await ctx.clock.install({time: new Date(2026, 10, 14, 9)});
      await ctx.addInitScript(seed => { window.__SB_TEST = true; try { if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("coursework:v2", JSON.stringify(seed)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("studyboard:tour", "done"); } } catch (e) {} }, SEED);
      const page = await ctx.newPage(); page.on("pageerror", e => errs.push(e.message));
      await page.goto("http://localhost:" + server.address().port + "/"); await page.waitForTimeout(1200);
      await page.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
      await page.evaluate(() => { const S = window.__sbSync; S.ui.tab = "timeline"; S.ui.tlMode = "calendar"; S.ui.calMonth = "2026-11-01"; S.ui.calDay = "2026-11-20"; S.render(); }); await page.waitForTimeout(500);
      const due = await page.evaluate(() => ({cells: document.querySelectorAll(".cal .day").length, icons: document.querySelectorAll('.day[data-id="2026-11-19"] .dots i.ci').length, ev: document.querySelectorAll("#view .cal-ev, #view .cal-evlist").length}));
      ok(due.cells >= 28 && due.icons === 2 && due.ev === 0, `${w}px: Due Dates shows the day's tasks and no events (${due.ev} event marks)`);
      await page.evaluate(() => { const S = window.__sbSync; S.ui.tab = "schedule"; S.ui.schMode = "week"; S.render(); }); await page.waitForTimeout(300);
      await page.evaluate(() => { document.querySelector(".ph-more").open = true; });
      const menu = await page.evaluate(() => [...document.querySelectorAll(".ph-more .ph-menu > *")].map(b => b.textContent.trim()));
      ok(menu[0] === "This Week" && menu[1] === "Month View", `${w}px: Options has Month View just under This Week (${menu.slice(0, 3).join(", ")})`);
      await page.click('.ph-menu [data-act="sch-mode"]'); await page.waitForTimeout(300);
      const g = await page.evaluate(() => ["2026-11-19", "2026-11-10"].map(k => { const d = document.querySelector(`.sch-month .day[data-id="${k}"]`), bar = d && d.querySelector(".cal-ev");
        if (!bar) return {k, none: true}; const r = d.getBoundingClientRect(), b = bar.getBoundingClientRect(); return {k, top: b.top, end: b.bottom, cellTop: r.top, cell: r.bottom}; }));
      for (const x of g) ok(!x.none && x.end <= x.cell && x.top >= x.cellTop, `${w}px, ${x.k}: Schedule > Month shows the event's bar inside the cell`);
      await page.click('.sch-month .day[data-id="2026-11-19"]'); await page.waitForTimeout(300);
      const list = await page.evaluate(() => [...document.querySelectorAll(".cal-evrow b")].map(b => b.textContent));
      ok(list.join() === "Shift", `${w}px: picking a day lists its events below (${list.join()})`);
      await page.click(".smc-week"); await page.waitForTimeout(300);
      ok(await page.evaluate(() => !!document.querySelector(".sch-grid") && document.querySelector('.sch-pills [aria-pressed="true"]').textContent.includes("19")), `${w}px: See Week opens that week on that day`);
      const tabs = await page.evaluate(() => [...document.querySelectorAll(".pview-tabs [data-act=plan-view]")].map(b => b.dataset.id).join());
      ok(tabs === "schedule,timeline,crunch", "Schedule comes before Due Dates in the tabs: " + tabs);
      await ctx.close();
    }
    ok(!errs.length, "no page errors" + (errs.length ? ": " + errs.join(" | ") : ""));
    console.log("cal-day-bar.e2e: " + n + " checks passed");
  } finally { await browser.close(); server.close(); }
})().catch(e => { console.error(e); process.exit(1); });
