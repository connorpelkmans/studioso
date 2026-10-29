// node tests/sch-menu-layer.e2e.js: on a phone, the Schedule's Options menu is on top of the class events from the moment it opens
// (it used to sit under them while its fade-in ran, the first time it was opened)
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const root = path.join(__dirname, "..");
const server = http.createServer((req, res) => { const u = new URL(req.url, "http://x"); let p = decodeURIComponent(u.pathname); if (p === "/") p = "/index.html"; const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; } const mime = {".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json"}; res.writeHead(200, {"content-type": mime[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res); });
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
(async () => {
  await new Promise(r => server.listen(0, r));
  const b = await chromium.launch({executablePath});
  try {
    for (const W of [402, 360]) {
      const ctx = await b.newContext({viewport: {width: W, height: 874}, isMobile: true, hasTouch: true});
      const seed = {v: 2, updated: 1, settings: {}, courses: [{id: "c1", name: "Biology", code: "BIOS 2100", color: "#3B6FE0", meetings: [0, 1, 2, 3, 4, 5, 6].map(k => ({kind: "Lecture", days: [k], start: "10:00", end: "11:30", where: "Burnham Hall"}))}], tasks: []};
      await ctx.addInitScript(s => { window.__SB_TEST = true; try { if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("coursework:v2", JSON.stringify(s)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("studyboard:tour", "done"); } } catch (e) {} }, seed);
      const page = await ctx.newPage(); const errs = []; page.on("pageerror", e => errs.push(e.message));
      await page.goto("http://localhost:" + server.address().port + "/"); await page.waitForFunction(() => window.__sbSync); await page.waitForTimeout(500);
      await page.evaluate(() => { window.__sbSync.ui.tab = "schedule"; window.__sbSync.render(); }); await page.waitForSelector("details.ph-more > summary");
      await page.waitForTimeout(150);
      await page.click("details.ph-more > summary"); await page.waitForTimeout(40);
      const covered = () => page.evaluate(() => { const m = document.querySelector(".ph-menu"), r = m.getBoundingClientRect(), out = []; for (let y = r.top + 8; y < r.bottom - 4; y += 16) for (const x of [r.left + 12, r.left + r.width / 2, r.right - 12]) { const e = document.elementFromPoint(x, y); if (e && !m.contains(e)) out.push(String(e.className).slice(0, 30)); } return out; });
      const c0 = await covered();
      ok(!c0.length, `${W}px: right as it opens, nothing on the schedule covers the Options menu (${c0.slice(0, 3).join(", ")})`);
      await page.waitForTimeout(900);
      ok(!(await covered()).length, `${W}px: and once it has faded in`);
      ok(!errs.length, `${W}px: no page errors ` + errs.join(" | "));
      await ctx.close();
    }
    console.log("\nsch-menu-layer.e2e: " + n + " checks passed");
  } finally { await b.close(); server.close(); }
})().catch(e => { console.error(e); process.exit(1); });
