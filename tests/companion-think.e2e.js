// node tests/companion-think.e2e.js
// While the student waits on the AI, the companion shows a bubble with three moving dots; it goes when the answer comes,
// and a quick answer never flashes it.
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const csp = require("../scripts/csp");
const root = path.join(__dirname, "..");
const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x"); let p = decodeURIComponent(u.pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  const mime = {".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".css": "text/css"};
  res.writeHead(200, {"content-type": mime[path.extname(f)] || "application/octet-stream"});
  if (p === "/index.html") { res.end(csp.apply(fs.readFileSync(f, "utf8"))); return; }
  fs.createReadStream(f).pipe(res);
});
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
(async () => {
  await new Promise(r => server.listen(0, r));
  const browser = await chromium.launch({executablePath});
  try {
    for (const motion of ["no-preference", "reduce"]) {
      const ctx = await browser.newContext({viewport: {width: 1280, height: 800}, serviceWorkers: "block", reducedMotion: motion});
      let delay = 7000;
      await ctx.route(/generativelanguage\.googleapis\.com/, async route => { await new Promise(r => setTimeout(r, delay)); try { await route.fulfill({status: 200, contentType: "application/json", body: JSON.stringify({candidates: [{content: {parts: [{text: '{"ok":true}'}]}, finishReason: "STOP"}]})}); } catch (e) {} });
      await ctx.addInitScript(() => {
        window.__SB_TEST = true;
        try { if (!localStorage.getItem("sb:onboarded")) { localStorage.setItem("coursework:v2", JSON.stringify({v: 2, updated: 1, courses: [], tasks: [], settings: {}})); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("studyboard:tour", "done");
          localStorage.setItem("studyboard:aiKeys", JSON.stringify({gemini: "AIzaTESTTESTTESTTESTTESTTEST12345"})); localStorage.setItem("studyboard:aiConsent", JSON.stringify({gemini: {v: 1, at: 1}})); } } catch (e) {}
      });
      const page = await ctx.newPage(); const errs = []; page.on("pageerror", e => errs.push(e.message));
      await page.goto("http://localhost:" + server.address().port + "/"); await page.waitForFunction(() => window.SBCOMP && SBCOMP.open && window.__sbSync);
      await page.evaluate(() => SBCOMP.open()); await page.waitForSelector("dialog[open] .cp-tile");
      await page.click('dialog[open] .cp-tile [data-act="comp-pick"]'); await page.waitForTimeout(400);
      await page.keyboard.press("Escape"); await page.waitForTimeout(800);
      ok(await page.evaluate(() => !!SBCOMP.el()), `${motion}: a companion is on screen`);
      const dots = () => page.evaluate(() => { const b = document.querySelector(".cp-bubble.cp-think.on .cp-dots"); return b ? {n: b.querySelectorAll("i").length, label: b.getAttribute("aria-label"), anim: getComputedStyle(b.querySelector("i")).animationName} : null; });
      const call = page.evaluate(() => window.__sbSync.aiCall({task: "chat", maxTokens: 500, system: "x", parts: [{text: "hi"}], schema: {type: "OBJECT", properties: {ok: {type: "BOOLEAN"}}}}).then(() => true, () => false));
      await page.waitForTimeout(400);
      ok(!(await dots()), `${motion}: no bubble for the first moment (a quick answer won't flash it)`);
      await page.waitForFunction(() => !!document.querySelector(".cp-bubble.cp-think.on .cp-dots"), null, {timeout: 6000}).catch(() => {});
      const d = await dots();
      if (!d) console.log("DEBUG", await page.evaluate(() => { const b = document.querySelector(".cp-bubble"); return {b: b ? b.className + " | " + b.innerHTML.slice(0, 120) : "none", el: !!SBCOMP.el(), hidden: SBCOMP.el() && SBCOMP.el().closest("[hidden]") ? "in hidden" : "", vis: document.visibilityState}; }));
      ok(d && d.n === 3 && / is thinking$/.test(d.label), `${motion}: while it waits (after its "On it!" line), a bubble with three dots: ` + JSON.stringify(d));
      ok(d && d.anim === (motion === "reduce" ? "cpDotFade" : "cpDot"), `${motion}: the dots ${motion === "reduce" ? "fade gently (reduced motion)" : "bounce in turn"}`);
      ok(await call, `${motion}: the answer arrives`);
      await page.waitForTimeout(300);
      ok(!(await dots()), `${motion}: and the bubble goes`);
      delay = 100;
      const quick = page.evaluate(() => window.__sbSync.aiCall({task: "chat", maxTokens: 500, system: "x", parts: [{text: "hi"}], schema: {type: "OBJECT", properties: {ok: {type: "BOOLEAN"}}}}));
      await quick; await page.waitForTimeout(1200);
      ok(!(await dots()), `${motion}: a quick answer never shows it`);
      ok(!errs.length, `${motion}: no page errors: ` + errs.join(" | "));
      await ctx.close();
    }
    console.log("\ncompanion-think.e2e: " + n + " checks passed");
  } finally { await browser.close(); server.close(); }
})().catch(e => { console.error(e); process.exit(1); });
