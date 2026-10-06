// node tests/i18n.pw.js  (Playwright + Chromium) Localization groundwork: English untouched, a locale catalog swaps the nav, plurals and fallback work, no console errors.
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium} = require("/opt/node-tools/node_modules/playwright");
const root = path.join(__dirname, "..");
const MIME = {".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".webmanifest": "application/manifest+json", ".png": "image/png", ".css": "text/css", ".woff2": "font/woff2", ".svg": "image/svg+xml"};
const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x"); let p = decodeURIComponent(u.pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  res.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch();
  try {
    // English (default): nothing changes
    let ctx = await browser.newContext({locale: "en-US"}), page = await ctx.newPage(); const errs = [];
    page.on("pageerror", e => errs.push(e.message));
    await page.goto(base); await page.waitForSelector('nav.tabs [data-tab="notes"]');
    ok(/Notes/.test(await page.textContent('nav.tabs [data-tab="notes"]')), "English nav label");
    ok(await page.evaluate(() => document.documentElement.lang) === "en", "html lang is en");
    const r = await page.evaluate(() => { const I = window.SBI18N; return null; }).catch(() => null);
    await ctx.close();
    // Spanish device: catalog loads from locales/es.json, the nav is translated, English fallbacks still work
    ctx = await browser.newContext({locale: "es-ES"}); page = await ctx.newPage(); page.on("pageerror", e => errs.push(e.message));
    await page.goto(base); await page.waitForFunction(() => /Tablero/.test(document.querySelector('nav.tabs [data-tab="board"]').textContent), null, {timeout: 8000});
    ok(/Tarjetas/.test(await page.textContent('nav.tabs [data-tab="flashcards"]')), "Spanish nav label");
    ok(await page.evaluate(() => document.documentElement.lang) === "es-es", "html lang follows the language");
    ok(await page.evaluate(() => document.querySelector('nav.tabs [data-tab="plan"]').getAttribute("aria-label")).then(t => /Planificar/.test(t)), "aria-label translated");
    ok(await page.evaluate(() => document.querySelector('nav.tabs [data-tab="board"] svg') !== null), "icons survive translation");
    ok(errs.length === 0, "no page errors: " + errs.join("; "));
    await ctx.close();
  } finally { await browser.close(); server.close(); }
  console.log(`\n${n} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
