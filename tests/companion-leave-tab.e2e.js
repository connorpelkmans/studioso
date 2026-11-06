// Browser test: leaving the Companion page, the companion sets off for its spot at once (not half a second later)
// Run: node tests/companion-leave-tab.e2e.js
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const root = path.join(__dirname, "..");
const MIME = {".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".webp": "image/webp", ".json": "application/json", ".woff2": "font/woff2"};
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  res.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
(async () => {
  await new Promise(r => server.listen(0, r));
  const browser = await chromium.launch({executablePath});
  try {
    for (const vp of [{name: "desktop", width: 1300, height: 900}, {name: "phone", width: 390, height: 844, mobile: true}]) {
      const ctx = await browser.newContext({viewport: {width: vp.width, height: vp.height}, isMobile: !!vp.mobile, hasTouch: !!vp.mobile});
      await ctx.addInitScript(() => { try { localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "1"); localStorage.setItem("coursework:v2", JSON.stringify({v: 2, courses: [], tasks: [], decks: [], notes: [], files: [], events: [], settings: {}, updated: 1})); } catch (e) {} });
      const page = await ctx.newPage(), errs = []; page.on("pageerror", e => errs.push(e.message));
      await page.goto("http://localhost:" + server.address().port + "/"); await page.waitForFunction(() => window.SBCOMP); await page.waitForTimeout(1800);
      await page.click('nav.tabs [data-tab="companion"]'); await page.waitForTimeout(2500);
      ok(await page.evaluate(() => (document.querySelector("[data-spot]") || {dataset: {}}).dataset.spot === "slot"), `${vp.name}: on the Companion page it sits in its ring`);
      // watch where it's drawn, frame by frame, from the click away
      await page.evaluate(() => { window.__s = []; const t0 = performance.now(), box = document.querySelector("[data-spot]"); const tick = () => { const r = box.getBoundingClientRect(); window.__s.push([performance.now() - t0, Math.round(r.left), Math.round(r.top), Math.round(r.width)]); if (performance.now() - t0 < 2500) requestAnimationFrame(tick); }; requestAnimationFrame(tick); });
      await page.click('nav.tabs [data-tab="board"]');
      await page.waitForTimeout(2800);
      const s = await page.evaluate(() => window.__s), a = s[0], moved = s.find(x => x[1] !== a[1] || x[2] !== a[2] || x[3] !== a[3]);
      ok(moved && moved[0] < 250, `${vp.name}: it sets off within a moment of clicking away (${moved ? Math.round(moved[0]) : "never"} ms)`);
      ok(await page.evaluate(() => (document.querySelector("[data-spot]") || {dataset: {}}).dataset.spot !== "slot"), `${vp.name}: and ends up in its spot off the Companion page`);
      ok(!errs.length, `${vp.name}: no page errors ${errs.join(" | ")}`);
      await ctx.close();
    }
    console.log(`companion-leave-tab.e2e: ${n} checks passed`);
  } finally { await browser.close(); server.close(); }
})().catch(e => { console.error(e); process.exit(1); });
