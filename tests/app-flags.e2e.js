// node tests/app-flags.e2e.js  (Playwright + Chromium)
// Remote switches: the app reads app_flags from Studyboard's server, keeps the answer, passes bb_internal to the School Sync
// extension, and treats a switch it can't read as on.
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const root = path.join(__dirname, "..");
const MIME = {".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json"};
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  res.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  try {
    let flags = [{key: "bb_internal", value: false}], asked = 0;
    const plain = await browser.newContext({serviceWorkers: "block"});
    await plain.route(/supabase\.co/, r => { if (/app_flags/.test(r.request().url())) asked++; r.abort(); });
    await plain.addInitScript(() => { localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:tour", "done"); });
    const p0 = await plain.newPage(); await p0.goto(base); await p0.waitForFunction(() => window.SBFLAGS); await p0.waitForTimeout(2500);
    ok(asked === 0, "without school sync the app doesn't ask for the switches");
    ok(await p0.evaluate(() => SBFLAGS.get("bb_internal")), "a switch that hasn't been read yet counts as on");
    await plain.close();
    const ctx = await browser.newContext({serviceWorkers: "block"});
    await ctx.route(/supabase\.co/, r => r.abort());   // (routes added later are matched first)
    await ctx.route(/supabase\.co\/rest\/v1\/app_flags/, r => { asked++; r.fulfill({status: 200, contentType: "application/json", body: JSON.stringify(flags)}); });
    await ctx.addInitScript(() => {
      localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:tour", "done");
      window.__toExt = [];
      window.addEventListener("message", e => { const d = e.data; if (!d) return; if (d.source === "studyboard-app") window.__toExt.push(d);
        if (d.source === "studyboard-app" && d.type === "hello") window.postMessage({source: "studyboard-ext", type: "ready", version: "1.0.4"}, location.origin); });
    });
    const page = await ctx.newPage(); const errs = []; page.on("pageerror", e => errs.push(e.message));
    await page.goto(base); await page.waitForFunction(() => window.SBFLAGS);
    await page.waitForFunction(() => !SBFLAGS.get("bb_internal"));
    ok(asked >= 1, "with the extension, the app reads app_flags from the server");
    ok(await page.evaluate(() => JSON.parse(localStorage.getItem("studyboard:appFlags")).v.bb_internal === false), "the answer is kept");
    ok(await page.evaluate(() => window.__toExt.some(m => m.type === "flags" && m.bbInternal === false)), "and handed to the School Sync extension");
    await page.reload(); await page.waitForFunction(() => window.SBFLAGS);
    ok(await page.evaluate(() => !SBFLAGS.get("bb_internal")), "it's remembered after a reload");
    flags = [{key: "bb_internal", value: true}];
    await page.evaluate(() => SBFLAGS.load()); await page.waitForFunction(() => SBFLAGS.get("bb_internal"));
    ok(true, "switching it back on is picked up");
    ok(!errs.length, "no page errors: " + errs.join("; "));
  } finally { await browser.close(); server.close(); }
  console.log(`app-flags.e2e: ${n} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
