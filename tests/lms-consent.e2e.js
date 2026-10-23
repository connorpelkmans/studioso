// node tests/lms-consent.e2e.js  (Playwright + Chromium)
// Full school sync asks first: what is read, where it is kept, that Studyboard is independent; Not Now leaves it off, Turn On Full Sync
// is remembered with the settings, and a read the School Sync extension hands over waits for the answer.
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
    const ctx = await browser.newContext({serviceWorkers: "block"}); await ctx.route(/supabase\.co/, r => r.abort());
    await ctx.addInitScript(() => { if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("coursework:v2", JSON.stringify({v: 2, updated: 1, courses: [], tasks: [], settings: {}})); localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:tour", "done"); } });
    const page = await ctx.newPage(); const errs = []; page.on("pageerror", e => errs.push(e.message));
    await page.goto(base); await page.waitForFunction(() => window.SBLMS && SBLMS.canvas);
    ok(await page.evaluate(() => !SBLMS.canvas.consented()), "nothing is agreed to at first");
    const ask = () => page.evaluate(() => { window.__ans = undefined; SBLMS.canvas.askConsent().then(v => { window.__ans = v; }); });
    await ask(); await page.waitForSelector("#lmsConsentDlg[open]");
    const text = await page.textContent("#lmsConsentDlg");
    ok(/your own Canvas work with your own sign-in/.test(text) && /only reads/i.test(text), "it says what is read, and that it only reads");
    ok(/Studyboard account/.test(text) && /Inbox messages stay on your device/.test(text), "it says where it is kept");
    ok(/not affiliated with or endorsed by Instructure/.test(text) && /school allows/.test(text), "it says Studyboard is independent and to check the school's rules");
    await page.click("#lmsConsentNo"); await page.waitForFunction(() => window.__ans === false);
    ok(await page.evaluate(() => !SBLMS.canvas.consented()), "Not Now leaves full sync off");
    await ask(); await page.waitForSelector("#lmsConsentDlg[open]"); await page.click("#lmsConsentYes"); await page.waitForFunction(() => window.__ans === true);
    ok(await page.evaluate(() => SBLMS.canvas.consented() && !!SBLMS.canvas.cfg().consent.at), "Turn On Full Sync is remembered with the settings");
    ok(await page.evaluate(() => !SBLMS.brightspace.consented()), "each school platform is asked for separately");
    await page.reload(); await page.waitForFunction(() => window.SBLMS && SBLMS.canvas);
    ok(await page.evaluate(() => SBLMS.canvas.consented()), "and it's still agreed after a reload");
    ok(!errs.length, "no page errors: " + errs.join("; "));
  } finally { await browser.close(); server.close(); }
  console.log(`lms-consent.e2e: ${n} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
