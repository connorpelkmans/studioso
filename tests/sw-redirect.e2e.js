// Browser test: with the offline service worker in charge, the app still loads when the website sends /index.html to / with a
// redirect (as studyboardapp.com does). A saved copy marked "redirected" used to make every reload, and the return from
// Sign in with Microsoft, show "This site can't be reached" (ERR_FAILED) first.
// Run: node tests/sw-redirect.e2e.js
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const root = path.join(__dirname, "..");
const MIME = {".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".css": "text/css", ".woff2": "font/woff2", ".png": "image/png", ".svg": "image/svg+xml", ".webp": "image/webp", ".ico": "image/x-icon", ".webmanifest": "application/manifest+json"};
const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x"); let p = decodeURIComponent(u.pathname);
  if (p === "/index.html") { res.writeHead(307, {Location: "/"}); res.end(); return; }   // like the live site
  if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  res.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
// another site that sends the browser back, like Supabase does at the end of Sign in with Microsoft
const away = http.createServer((req, res) => { const to = new URL(req.url, "http://x").searchParams.get("to"); res.writeHead(302, {Location: to}); res.end(); });
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
(async () => {
  await new Promise(r => server.listen(0, r)); await new Promise(r => away.listen(0, r));
  const base = "http://localhost:" + server.address().port + "/", awayBase = "http://127.0.0.1:" + away.address().port + "/";
  const browser = await chromium.launch({executablePath});
  try {
    const ctx = await browser.newContext({viewport: {width: 1200, height: 800}});
    await ctx.addInitScript(() => { try { localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "done"); localStorage.setItem("studioso:welcomed", "1"); } catch (e) {} });
    const page = await ctx.newPage();
    await page.goto(base, {waitUntil: "load"});
    await page.waitForFunction(() => navigator.serviceWorker && navigator.serviceWorker.controller || (navigator.serviceWorker.ready.then(() => 0), false), null, {timeout: 20000}).catch(() => {});
    await page.waitForTimeout(1500);
    // the worker takes over once it's installed (it may need one more load)
    if (!(await page.evaluate(() => !!navigator.serviceWorker.controller))) { await page.reload({waitUntil: "load"}).catch(() => {}); await page.waitForTimeout(1500); }
    ok(await page.evaluate(() => !!navigator.serviceWorker.controller), "the offline service worker is in charge of the page");
    const saved = await page.evaluate(async () => { const keys = await caches.keys(); for (const k of keys) { const r = await (await caches.open(k)).match("./index.html"); if (r) return {redirected: r.redirected, status: r.status}; } return null; });
    ok(saved && saved.status === 200 && !saved.redirected, "its saved copy of the page isn't marked as redirected: " + JSON.stringify(saved));
    let err = null; try { await page.reload({waitUntil: "load", timeout: 20000}); } catch (e) { err = e.message.split("\n")[0]; }
    ok(!err && await page.evaluate(() => !!document.querySelector("#view, nav.tabs")), "a reload loads the app (no \"This site can't be reached\"): " + (err || "ok"));
    err = null;
    try { await page.goto(awayBase + "?to=" + encodeURIComponent(base + "#sb_ms=test-token&sb_ms_bind=nomatch"), {waitUntil: "load", timeout: 20000}); } catch (e) { err = e.message.split("\n")[0]; }
    ok(!err && page.url().startsWith(base) && await page.evaluate(() => !!document.querySelector("#view, nav.tabs")), "coming back from another site with a sign-in token loads the app straight away: " + (err || page.url().slice(0, 60)));
    await ctx.close();
    console.log(`sw-redirect.e2e: ${n} checks passed`);
  } finally { await browser.close(); server.close(); away.close(); }
})().catch(e => { console.error(e); process.exit(1); });
