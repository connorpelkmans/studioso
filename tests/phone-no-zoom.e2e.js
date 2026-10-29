// node tests/phone-no-zoom.e2e.js: on iPhone the app never zooms itself in (iOS zooms when a small text box gets focus and
// leaves the header and tab bar off screen), and on a phone the companion's bubble has no Ask box: tapping the companion
// opens its tab, where you type to it. On a computer the Ask box stays.
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const root = path.join(__dirname, "..");
const server = http.createServer((req, res) => { const u = new URL(req.url, "http://x"); let p = decodeURIComponent(u.pathname); if (p === "/") p = "/index.html"; const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; } const mime = {".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json"}; res.writeHead(200, {"content-type": mime[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res); });
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148";
async function open(b, opts){
  const ctx = await b.newContext(opts);
  const seed = {v: 2, updated: 1, settings: {}, courses: [], tasks: [], notes: []};
  await ctx.addInitScript(s => { window.__SB_TEST = true; try { if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("coursework:v2", JSON.stringify(s)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("studyboard:tour", "done"); localStorage.setItem("studyboard:aiKeys", JSON.stringify({gemini: "AIzaTESTTESTTESTTESTTESTTEST12345"})); localStorage.setItem("studyboard:aiConsent", JSON.stringify({gemini: {v: 1, at: 1}})); } } catch (e) {} }, seed);
  const page = await ctx.newPage(); const errs = []; page.on("pageerror", e => errs.push(e.message));
  await page.goto("http://localhost:" + server.address().port + "/"); await page.waitForFunction(() => window.__sbSync && window.SBCOMP); await page.waitForTimeout(900);
  return {ctx, page, errs};
}
(async () => {
  await new Promise(r => server.listen(0, r));
  const b = await chromium.launch({executablePath});
  try {
    { const {ctx, page, errs} = await open(b, {viewport: {width: 402, height: 874}, isMobile: true, hasTouch: true, userAgent: IPHONE});
      const vp = await page.evaluate(() => document.querySelector('meta[name="viewport"]').content);
      ok(/maximum-scale=1/.test(vp) && /width=device-width/.test(vp) && /viewport-fit=cover/.test(vp), "iPhone: the page can't be zoomed past its normal size: " + vp);
      await page.evaluate(() => { window.__sbSync.ui.tab = "tasks"; window.__sbSync.render(); window.SBCOMP.askOpen(); }); await page.waitForTimeout(400);
      ok(await page.evaluate(() => !document.querySelector(".cp-ask-btn, form.cp-ask")), "phone: the companion's bubble offers no Ask box");
      ok(await page.evaluate(() => window.__sbSync.ui.tab === "companion" && !!document.getElementById("cptIn")), "phone: asking the companion opens its tab, with the chat box there");
      ok(!errs.length, "phone: no page errors " + errs.join(" | "));
      await ctx.close(); }
    { const {ctx, page, errs} = await open(b, {viewport: {width: 402, height: 874}, isMobile: true, hasTouch: true});
      ok(!/maximum-scale/.test(await page.evaluate(() => document.querySelector('meta[name="viewport"]').content)), "Android and other phones keep pinch zoom (no scale limit)");
      await ctx.close(); }
    { const {ctx, page, errs} = await open(b, {viewport: {width: 1280, height: 860}});
      await page.evaluate(() => window.SBCOMP.askOpen()); await page.waitForTimeout(400);
      ok(await page.evaluate(() => !!document.querySelector("form.cp-ask input.cp-ask-in")), "computer: the companion's Ask box still opens in its bubble");
      ok(!errs.length, "computer: no page errors " + errs.join(" | "));
      await ctx.close(); }
    console.log("\nphone-no-zoom.e2e: " + n + " checks passed");
  } finally { await b.close(); server.close(); }
})().catch(e => { console.error(e); process.exit(1); });
