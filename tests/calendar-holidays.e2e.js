// node tests/calendar-holidays.e2e.js
// The month view names holidays and School Days off beside the day's number (wide screens); phones read them in the day's label
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const root = path.join(__dirname, ".."), SHOTS = process.argv[2] || "";
const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x"); let p = decodeURIComponent(u.pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  const mime = {".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".css": "text/css"};
  res.writeHead(200, {"content-type": mime[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const SEED = {v: 2, updated: 1, courses: [{id: "c1", name: "Nursing", code: "BSNC 1030", color: "#C0563A"}],
  tasks: [{id: "t1", title: "Sim (CH2) Reflection", courseId: "c1", type: "Assignment", due: "2026-11-23", status: "todo", priority: "med", created: 1}],
  settings: {school: {off: [{id: "rw", name: "Reading Week", from: "2026-11-09", to: "2026-11-13"}], ans: {"US:vet": "on"}}}};
(async () => {
  await new Promise(r => server.listen(0, r));
  const browser = await chromium.launch({executablePath});
  try {
    for (const vp of [{w: 1440, h: 900, wide: true}, {w: 390, h: 844, wide: false}]) {
      const ctx = await browser.newContext({viewport: {width: vp.w, height: vp.h}, timezoneId: "America/New_York"});
      await ctx.addInitScript(seed => { window.__SB_TEST = true; try { if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("coursework:v2", JSON.stringify(seed)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("studyboard:tour", "done"); } } catch (e) {} }, SEED);
      const page = await ctx.newPage(); const errs = []; page.on("pageerror", e => errs.push(e.message));
      await page.goto("http://localhost:" + server.address().port + "/"); await page.waitForSelector("#view", {state: "attached"}); await page.waitForTimeout(800);
      await page.waitForFunction(() => window.__sbSync);
      await page.evaluate(() => { const S = window.__sbSync; S.ui.tab = "timeline"; S.ui.tlMode = "calendar"; S.ui.calMonth = "2026-11-01"; S.ui.calDay = "2026-11-26"; S.render(); }); await page.waitForTimeout(400);
      for (let i = 0; i < 12; i++) { const h = await page.textContent(".cal-head h2"); if (/November 2026/.test(h)) break; await page.click('[data-act="cal-next"]'); await page.waitForTimeout(150); }
      ok(/November 2026/.test(await page.textContent(".cal-head h2")), `${vp.w}: on November 2026`);
      const hol = d => page.evaluate(d => { const b = document.querySelector(`.cal .day[data-id="${d}"]`); const h = b && b.querySelector(".day-hol"); return {txt: h ? h.textContent : "", off: !!(h && h.classList.contains("off")), shown: !!(h && getComputedStyle(h).display !== "none"), label: b ? b.getAttribute("aria-label") : ""}; }, d);
      const th = await hol("2026-11-26"), rw = await hol("2026-11-11"), plain = await hol("2026-11-18");
      ok(/Thanksgiving/.test(th.txt) && th.off, `${vp.w}: Thanksgiving is named on the 26th, as a day off`);
      ok(/Reading Week/.test(rw.txt) && /Veterans Day/.test(rw.txt) && rw.off, `${vp.w}: a School Days range (Reading Week) shows on each of its days, with a holiday that day: ` + rw.txt);
      ok(!plain.txt, `${vp.w}: an ordinary day has nothing`);
      ok(/Thanksgiving Day, no classes/.test(th.label), `${vp.w}: the day's label reads it out: ` + th.label);
      ok(th.shown === vp.wide, `${vp.w}: ${vp.wide ? "shown beside the number" : "hidden on a phone (the label carries it)"}`);
      if (vp.wide) {
        const geo = await page.evaluate(() => { const b = document.querySelector('.cal .day[data-id="2026-11-26"]'), n = b.querySelector(".num").getBoundingClientRect(), h = b.querySelector(".day-hol").getBoundingClientRect(), r = b.getBoundingClientRect(); return {right: h.left >= n.right - 1, sameRow: Math.abs((h.top + h.bottom) / 2 - (n.top + n.bottom) / 2) < 6, inside: h.right <= r.right + 1}; });
        ok(geo.right && geo.sameRow && geo.inside, "it sits to the right of the number, on the same line, inside the day: " + JSON.stringify(geo));
        const tg = await page.evaluate(() => { const b = document.querySelector(".cal .day.is-today"); if (!b || !b.querySelector(".day-hol")) return true; return b.querySelector(".day-hol").getBoundingClientRect().left >= b.querySelector(".num").getBoundingClientRect().right - 1; });
        ok(tg, "on today's cell it clears the Today badge");
        if (SHOTS) await page.locator(".cal").screenshot({path: path.join(SHOTS, "cal-holidays.png")});
      }
      const o = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      ok(o <= 0, `${vp.w}: no horizontal scroll`);
      ok(!errs.length, `${vp.w}: no page errors: ` + errs.join(" | "));
      await ctx.close();
    }
    console.log("\ncalendar-holidays.e2e: " + n + " checks passed");
  } finally { await browser.close(); server.close(); }
})().catch(e => { console.error(e); process.exit(1); });
