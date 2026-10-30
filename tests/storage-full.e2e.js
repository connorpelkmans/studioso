// node tests/storage-full.e2e.js
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const root = path.join(__dirname, "..");
const MIME = {".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".webmanifest": "application/manifest+json", ".png": "image/png", ".css": "text/css", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".webp": "image/webp"};
const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x"); let p = decodeURIComponent(u.pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  res.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  try {
    const ctx = await browser.newContext({serviceWorkers: "block"}); await ctx.route(/supabase\.co/, r => r.abort());
    await ctx.addInitScript(() => {
      localStorage.setItem("coursework:v2", JSON.stringify({v: 2, updated: 1, courses: [], tasks: [], settings: {}}));
      localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("studyboard:tour", "done");
      localStorage.setItem("studyboard:paywall-test", "1");
    });
    const page = await ctx.newPage(); const errs = []; page.on("pageerror", e => errs.push(e.message));
    await page.goto(base); await page.waitForFunction(() => window.SBCLOUD && SBCLOUD.storageFull && window.StudyboardPlan, null, {timeout: 40000}); await page.waitForTimeout(500);
    ok(await page.evaluate(() => StudyboardPlan.paywall() && !StudyboardPlan.isPro() && StudyboardPlan.limits().fileMB === 20), "a free account with a 20 MB file limit");
    await page.evaluate(() => SBCLOUD.storageFull([new File(["x"], "notes.pdf")], {}));
    await page.waitForSelector("dialog[open] .cl-sheet");
    const txt = () => page.textContent("dialog[open]");
    let t = await txt(); ok(/Your Storage Is Full/.test(t) && /20 MB/.test(t) && /notes\.pdf/.test(t), "the popup says the storage is full and names the file");
    ok(await page.$('dialog[open] [data-act="cl-full-pro"]') && await page.$('dialog[open] [data-act="cl-full-save"][data-id="google"]') && await page.$('dialog[open] [data-act="cl-full-save"][data-id="microsoft"]'), "it offers Go Pro, Google Drive and OneDrive");
    ok(/Connect Google Drive/.test(t) && /Connect OneDrive/.test(t), "with nothing connected the cloud buttons say Connect");
    await page.click('dialog[open] [data-act="cl-full-save"][data-id="google"]'); await page.waitForSelector("dialog[open] #clBody");
    ok(/Cloud Storage/.test(await txt()), "Connect opens the Cloud Storage sheet");
    await page.evaluate(() => document.querySelector("dialog[open]").close());
    await page.evaluate(() => SBCLOUD.storageFull([new File(["x"], "a.pdf"), new File(["y"], "b.pdf")], {}));
    await page.waitForSelector("dialog[open] .cl-sheet"); ok(/these 2 files/.test(await txt()), "several files are counted");
    await page.click('dialog[open] [data-act="cl-full-pro"]'); await page.waitForSelector("dialog[open] .plan-sheet");
    ok(/free file storage is full/.test(await page.textContent("dialog[open] .plan-reason")), "Go Pro opens the Pro sheet with the reason");
    ok(!errs.length, "no page errors: " + errs.join(" | "));
  } finally { await browser.close(); server.close(); }
  console.log(`\nstorage-full.e2e: ${n} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
