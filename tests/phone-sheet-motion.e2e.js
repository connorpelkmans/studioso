// node tests/phone-sheet-motion.e2e.js: on a phone, sheets slide up from the bottom edge when they open and slide back down
// when they close. Closing is immediate for the app (no open dialog is left behind); a still copy does the sliding and is
// then removed. With reduced motion nothing slides.
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const root = path.join(__dirname, "..");
const server = http.createServer((req, res) => { const u = new URL(req.url, "http://x"); let p = decodeURIComponent(u.pathname); if (p === "/") p = "/index.html"; const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; } const mime = {".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json"}; res.writeHead(200, {"content-type": mime[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res); });
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
async function open(b, reduced){
  const ctx = await b.newContext({viewport: {width: 402, height: 874}, isMobile: true, hasTouch: true, reducedMotion: reduced ? "reduce" : "no-preference"});
  const seed = {v: 2, updated: 1, settings: {}, courses: [], tasks: [], notes: []};
  await ctx.addInitScript(s => { window.__SB_TEST = true; try { if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("coursework:v2", JSON.stringify(s)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("studyboard:tour", "done"); } } catch (e) {} }, seed);
  const page = await ctx.newPage(); const errs = []; page.on("pageerror", e => errs.push(e.message));
  await page.goto("http://localhost:" + server.address().port + "/"); await page.waitForFunction(() => window.__sbSync); await page.waitForTimeout(900);
  return {ctx, page, errs};
}
const watch = page => page.evaluate(() => { window.__f = []; const t0 = performance.now(), look = () => { const d = document.querySelector("dialog#dlg[open]"), g = document.querySelector(".sm-ghost-sheet"); window.__f.push({t: performance.now() - t0, d: d ? Math.round(d.getBoundingClientRect().top) : null, g: g ? Math.round(g.getBoundingClientRect().top) : null}); if (performance.now() - t0 < 700) requestAnimationFrame(look); }; requestAnimationFrame(look); });
(async () => {
  await new Promise(r => server.listen(0, r));
  const b = await chromium.launch({executablePath});
  try {
    { const {ctx, page, errs} = await open(b, false);
      await watch(page); await page.tap('header [data-act="menu"]'); await page.waitForTimeout(800);
      const f = await page.evaluate(() => window.__f.filter(x => x.d != null)), tops = f.map(x => x.d), end = tops[tops.length - 1];
      ok(tops[0] > end + 200 && new Set(tops).size >= 5, "opening: the Settings sheet rises from the bottom edge in steps: " + tops.slice(0, 8).join(" "));
      await watch(page);
      const now = await page.evaluate(() => { document.getElementById("dlg").close(); return {open: document.getElementById("dlg").open, any: document.querySelectorAll("dialog[open]").length}; });
      ok(!now.open && now.any === 0, "closing: the sheet is closed at once for the app (no open dialog left)");
      await page.waitForTimeout(800);
      const g = await page.evaluate(() => window.__f.filter(x => x.g != null).map(x => x.g));
      ok(g.length >= 4 && g[g.length - 1] > g[0] + 150, "and it slides down off the screen: " + g.join(" "));
      ok(await page.evaluate(() => !document.querySelector(".sm-ghost")), "then nothing is left behind");
      ok(!errs.length, "no page errors " + errs.join(" | "));
      await ctx.close(); }
    { const {ctx, page} = await open(b, true);
      await page.tap('header [data-act="menu"]'); await page.waitForTimeout(500);
      const moved = await page.evaluate(() => getComputedStyle(document.getElementById("dlg")).animationName);
      await page.evaluate(() => document.getElementById("dlg").close()); await page.waitForTimeout(50);
      ok(moved !== "sm-sheet-slide" && await page.evaluate(() => !document.querySelector(".sm-ghost")), "reduced motion: no sliding either way (" + moved + ")");
      await ctx.close(); }
    console.log("\nphone-sheet-motion.e2e: " + n + " checks passed");
  } finally { await b.close(); server.close(); }
})().catch(e => { console.error(e); process.exit(1); });
