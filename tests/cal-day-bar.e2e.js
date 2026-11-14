// node tests/cal-day-bar.e2e.js
// The calendar's month grid on a phone: a day's events show as one colour bar along the bottom of the cell. It sits below the
// day's task icons with room to spare (and below an overdue task's red ring), never across them.
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
      const g = await page.evaluate(() => ["2026-11-19", "2026-11-10"].map(k => { const d = document.querySelector(`.day[data-id="${k}"]`), ics = [...d.querySelectorAll(".dots i.ci")], bar = d.querySelector(".cal-ev");
        const r = d.getBoundingClientRect(), b = bar.getBoundingClientRect(), late = !!d.querySelector(".ci-row.late");
        return {k, late, icons: Math.max(...ics.map(i => i.getBoundingClientRect().bottom)), bar: b.top, barEnd: b.bottom, cell: r.bottom, n: ics.length}; }));
      for (const x of g) {
        ok(x.n >= 1 && x.barEnd <= x.cell, `${w}px, ${x.k}: the bar is inside the cell`);
        const need = x.late ? 3 : 2;   // an overdue icon wears a 3px ring
        ok(x.bar >= x.icons + need - 0.1, `${w}px, ${x.k}: the bar is below the ${x.late ? "overdue " : ""}task icons (icons end ${x.icons.toFixed(1)}, bar starts ${x.bar.toFixed(1)})`);
      }
      await ctx.close();
    }
    ok(!errs.length, "no page errors" + (errs.length ? ": " + errs.join(" | ") : ""));
    console.log("cal-day-bar.e2e: " + n + " checks passed");
  } finally { await browser.close(); server.close(); }
})().catch(e => { console.error(e); process.exit(1); });
