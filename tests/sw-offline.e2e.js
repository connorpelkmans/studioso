// The offline copy of the app
"use strict";
const fs = require("fs"), path = require("path"), os = require("os"), http = require("http"), assert = require("assert");
const {chromium} = require("playwright");
const ROOT = path.join(__dirname, ".."), AF = require("../scripts/app-files");
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "sb-sw-"));
for (const f of ["index.html", "sw.js", "manifest.webmanifest", "icon-192.png", "icon-512.png", "maskable-512.png", "apple-touch-icon.png"]) fs.copyFileSync(path.join(ROOT, f), path.join(tmp, f));
for (const d of ["bundle", "vendor", "locales"]) fs.cpSync(path.join(ROOT, d), path.join(tmp, d), {recursive: true});
const MIME = {".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".webmanifest": "application/manifest+json", ".png": "image/png", ".woff2": "font/woff2", ".mjs": "text/javascript"};
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname); if (p === "/") p = "/index.html";
  const f = path.join(tmp, p); if (!f.startsWith(tmp) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  res.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream", "cache-control": "no-cache"}); fs.createReadStream(f).pipe(res);
});

(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch();
  try {
    const ctx = await browser.newContext({viewport: {width: 1100, height: 800}});
    await ctx.addInitScript(() => { try { localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:tour", "done"); } catch (e) {} });
    const page = await ctx.newPage();
    const errors = []; page.on("pageerror", e => errors.push(String(e && e.message || e)));
    await page.goto(base);
    await page.waitForFunction(() => navigator.serviceWorker && navigator.serviceWorker.controller, null, {timeout: 30000}).catch(() => {});
    await page.reload(); await page.waitForFunction(() => navigator.serviceWorker.controller, null, {timeout: 30000});
    const cached = () => page.evaluate(async () => { const c = await caches.open((await caches.keys()).find(k => /^studyboard-/.test(k))); return (await c.keys()).map(r => new URL(r.url).pathname + new URL(r.url).search); });
    const urls = () => (fs.readFileSync(path.join(tmp, "index.html"), "utf8").match(/bundle\/[^"'?\s]+\?v=[0-9a-f]+/g) || []).map(u => "/" + u);
    const want = urls();
    let have = await cached();
    ok(want.length >= 2 && want.every(u => have.includes(u)), `the first visit saves the page and all ${want.length} of its files (${want.join(", ")})`);

    await ctx.setOffline(true);
    await page.reload(); await page.waitForTimeout(2500);
    ok(await page.locator("nav [data-tab], [data-tab]").count() > 3 && !errors.length, "offline, the app opens from the saved copy: " + errors.slice(0, 2).join(" | "));
    await ctx.setOffline(false);

    const f = "bundle/app.js", urlOf = () => urls().find(u => u.startsWith("/" + f)), oldUrl = urlOf();
    fs.appendFileSync(path.join(tmp, f), "\nwindow.__sbRelease = 2;\n");
    const read = p => fs.readFileSync(path.join(tmp, p), "utf8");
    fs.writeFileSync(path.join(tmp, "index.html"), AF.stamp(fs.readFileSync(path.join(tmp, "index.html"), "utf8"), read));
    const newUrl = urlOf();
    ok(oldUrl !== newUrl, "the changed file gets a new ?v=");
    await page.reload(); await page.waitForTimeout(500);
    ok(await page.evaluate(() => !window.__sbRelease), "the visit right after a release opens the saved copy (no waiting on the network)");
    await page.waitForFunction(async u => { const c = await caches.open((await caches.keys()).find(k => /^studyboard-/.test(k))); return !!(await c.match(u)); }, newUrl.slice(1), {timeout: 20000});
    have = await cached();
    ok(have.includes(newUrl) && have.includes(oldUrl), "the new release's file is saved, and the one before it stays for a page that's still open");
    await ctx.setOffline(true);
    await page.reload(); await page.waitForTimeout(2500);
    ok(await page.evaluate(() => window.__sbRelease === 2) && await page.locator("[data-tab]").count() > 3, "offline, the next open is the new release with its new file");
    await ctx.setOffline(false);
    fs.appendFileSync(path.join(tmp, f), "\nwindow.__sbRelease = 3;\n");
    fs.writeFileSync(path.join(tmp, "index.html"), AF.stamp(fs.readFileSync(path.join(tmp, "index.html"), "utf8"), read));
    const v3 = urlOf();
    await page.reload();
    await page.waitForFunction(async u => { const c = await caches.open((await caches.keys()).find(k => /^studyboard-/.test(k))); return !!(await c.match(u)); }, v3.slice(1), {timeout: 20000});
    await page.waitForTimeout(500);
    have = await cached();
    ok(have.includes(v3) && have.includes(newUrl) && !have.includes(oldUrl), "two releases on, the oldest file is dropped (the current and previous sets stay)");
    ok(have.filter(u => u.startsWith("/" + f)).length === 2, "one copy per release kept, no pile-up");
    ok(!errors.length, "no page errors: " + errors.slice(0, 3).join(" | "));
  } finally { await browser.close(); server.close(); fs.rmSync(tmp, {recursive: true, force: true}); }
  console.log(`\nsw-offline: ${n} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
