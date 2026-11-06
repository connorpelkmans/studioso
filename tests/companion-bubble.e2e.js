// Browser test: the companion's speech bubble shows thinking dots while it works on an answer, and a tap's bubble
// goes away by itself (held while pointed at)
// Run: node tests/companion-bubble.e2e.js
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
const seed = () => { localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "1"); localStorage.setItem("studyboard:aiKeys", JSON.stringify({gemini: "AIzaTESTTESTTESTTESTTESTTEST12345"})); localStorage.setItem("studyboard:aiConsent", JSON.stringify({gemini: {v: 1, at: 1}})); localStorage.setItem("coursework:v2", JSON.stringify({v: 2, courses: [], tasks: [], decks: [{id: "d1", name: "Cell Biology", courseId: "", created: 1, cards: []}], notes: [], files: [], events: [], settings: {}, updated: 1})); };
(async () => {
  await new Promise(r => server.listen(0, r)); const url = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  const page0 = async () => {
    const ctx = await browser.newContext({viewport: {width: 1300, height: 900}});
    await ctx.route(/generativelanguage\.googleapis\.com/, route => setTimeout(() => route.fulfill({status: 200, contentType: "application/json", body: JSON.stringify({candidates: [{content: {parts: [{text: JSON.stringify({answer: "Your most recent deck is Cell Biology.", reply: "Your most recent deck is Cell Biology.", found: true, sources: [], followUps: []})}]}, finishReason: "STOP"}]})}), 3000));
    await ctx.addInitScript(seed);
    const page = await ctx.newPage(); page.errs = []; page.on("pageerror", e => page.errs.push(e.message));
    await page.goto(url); await page.waitForFunction(() => window.SBCOMP); await page.waitForTimeout(2200);
    const bx = await (await page.$("[data-spot]")).boundingBox();
    return {ctx, page, tap: () => page.mouse.click(bx.x + bx.width / 2, bx.y + bx.height / 2)};
  };
  const on = page => page.evaluate(() => document.querySelector(".cp-bubble").classList.contains("on"));
  try {
    // 1. thinking dots while it answers
    { const {ctx, page, tap} = await page0();
      await tap(); await page.waitForSelector('.cp-bubble.on [data-cp="ask"]'); await page.click('.cp-bubble.on [data-cp="ask"]');
      await page.fill(".cp-ask-in", "what is my most recent flashcard set?"); await page.press(".cp-ask-in", "Enter"); await page.waitForTimeout(800);
      const d = await page.evaluate(() => [...document.querySelectorAll(".cp-bubble.on .cp-thinking i")].map(i => { const r = i.getBoundingClientRect(); return r.width * r.height; }));
      ok(d.length === 3 && d.every(a => a >= 25), "while it works on the answer, the bubble shows three thinking dots you can see: " + JSON.stringify(d));
      await page.waitForFunction(() => /Cell Biology/.test(document.querySelector(".cp-bubble").textContent), null, {timeout: 10000});
      ok(true, "then the answer replaces the dots");
      ok(!page.errs.length, "no page errors " + page.errs.join(" | "));
      await ctx.close(); }
    // 2. a tap's bubble goes away by itself
    { const {ctx, page, tap} = await page0();
      await tap(); await page.mouse.move(200, 200); await page.waitForTimeout(500);
      ok(await on(page), "tapping the companion shows a bubble");
      await page.waitForTimeout(7000);
      ok(!(await on(page)), "and it goes away by itself within a few seconds");
      // pointing at it keeps it; it goes a moment after the pointer leaves
      await tap(); await page.waitForTimeout(400);
      const r = await (await page.$(".cp-bubble")).boundingBox(); await page.mouse.move(r.x + r.width / 2, r.y + 12, {steps: 3});
      await page.waitForTimeout(8000);
      ok(await on(page), "pointing at the bubble keeps it up");
      await page.mouse.move(200, 200, {steps: 3}); await page.waitForTimeout(3200);
      ok(!(await on(page)), "and it goes once the pointer leaves");
      await ctx.close(); }
    console.log(`companion-bubble.e2e: ${n} checks passed`);
  } finally { await browser.close(); server.close(); }
})().catch(e => { console.error(e); process.exit(1); });
