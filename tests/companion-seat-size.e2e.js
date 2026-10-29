// node tests/companion-seat-size.e2e.js: on a phone the companion sits in its seat in the tab bar at the seat's size, even
// when it's rebuilt (a theme or outfit change) while a sheet is open; it used to come back at its full floating size there.
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const root = path.join(__dirname, "..");
const server = http.createServer((req, res) => { const u = new URL(req.url, "http://x"); let p = decodeURIComponent(u.pathname); if (p === "/") p = "/index.html"; const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; } const mime = {".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json"}; res.writeHead(200, {"content-type": mime[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res); });
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
(async () => {
  await new Promise(r => server.listen(0, r));
  const b = await chromium.launch({executablePath});
  try {
    const ctx = await b.newContext({viewport: {width: 402, height: 874}, isMobile: true, hasTouch: true});
    const seed = {v: 2, updated: 1, settings: {}, courses: [], tasks: [], notes: []};
    await ctx.addInitScript(s => { window.__SB_TEST = true; try { if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("coursework:v2", JSON.stringify(s)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("studyboard:tour", "done"); } } catch (e) {} }, seed);
    const page = await ctx.newPage(); const errs = []; page.on("pageerror", e => errs.push(e.message));
    await page.goto("http://localhost:" + server.address().port + "/"); await page.waitForFunction(() => window.SBCOMP); await page.waitForTimeout(1800);
    const seat = () => page.evaluate(() => { const c = document.querySelector(".cp-front .cp"), s = document.querySelector('nav.tabs .in [data-tab="companion"]'); const r = c.getBoundingClientRect(); return {px: Math.round(r.width), spot: c.dataset.spot, seatW: Math.round(s.getBoundingClientRect().width)}; });
    const a = await seat();
    ok(a.spot === "dock" && a.px <= 56, "the companion sits in its seat at the seat's size: " + JSON.stringify(a));
    await page.tap('header [data-act="menu"]'); await page.waitForTimeout(700);
    await page.evaluate(() => window.SBCOMP.refresh()); await page.waitForTimeout(500);
    const b2 = await seat();
    ok(b2.px <= a.px + 2, "rebuilt while a sheet is open, it stays seat-sized: " + JSON.stringify(b2));
    await page.evaluate(() => document.getElementById("dlg").close()); await page.waitForTimeout(1200);
    const c = await seat();
    ok(c.spot === "dock" && Math.abs(c.px - a.px) <= 2, "and after the sheet closes it's still right: " + JSON.stringify(c));
    ok(!errs.length, "no page errors " + errs.join(" | "));
    console.log("\ncompanion-seat-size.e2e: " + n + " checks passed");
  } finally { await b.close(); server.close(); }
})().catch(e => { console.error(e); process.exit(1); });
