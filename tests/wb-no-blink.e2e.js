// node tests/wb-no-blink.e2e.js: the whiteboard never fades out and back in while drawing.
// The board saves 900 ms after a stroke; the save redraws the page and puts the board back in. Within 600 ms of a tap
// the app's fade-in plays on newly added things, so starting the next stroke as the board saved made the whole board
// blink out for a moment (seen on the Mac app).
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const root = path.join(__dirname, "..");
const MIME = {".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".png": "image/png", ".css": "text/css", ".svg": "image/svg+xml", ".woff2": "font/woff2"};
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  res.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const SEED = {v: 2, courses: [], tasks: [], decks: [], files: [], events: [], settings: {}, updated: 1,
  notes: [{id: "w1", text: "Board", wb: {v: 1, tpl: "blank", pa: 1.6}, courseId: "", board: "", created: 1, updated: 1}]};
(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  try {
    const ctx = await browser.newContext({viewport: {width: 1280, height: 900}});
    await ctx.addInitScript(seed => {
      window.__SB_TEST = true;
      try { localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "1"); localStorage.setItem("studyboard:notesView", "wb"); localStorage.setItem("studyboard:wbCur", "w1");
        if (!localStorage.getItem("coursework:v2")) localStorage.setItem("coursework:v2", JSON.stringify(seed)); } catch (e) {}
    }, SEED);
    const page = await ctx.newPage(); const errs = []; page.on("pageerror", e => errs.push(e.message));
    await page.goto(base); await page.waitForSelector("#view", {state: "attached"}); await page.waitForTimeout(1200);
    await page.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
    await page.evaluate(() => { const b = document.querySelector('nav.tabs [data-tab="notes"]'); b && b.click(); });
    await page.waitForSelector(".wb-stage .wb-frame"); await page.waitForTimeout(500);
    // watch the board's look on every frame
    await page.evaluate(() => {
      window.__wbLow = 1; window.__wbFade = false;
      const tick = () => { const s = document.querySelector(".wb-stage"); if (s) { const o = Number(getComputedStyle(s).opacity); if (o < window.__wbLow) window.__wbLow = o; if (s.classList.contains("sm-in") || s.getAnimations().some(a => a.animationName === "sm-in")) window.__wbFade = true; } window.__wbRaf = requestAnimationFrame(tick); };
      tick();
    });
    const r = await page.evaluate(() => { const f = document.querySelector(".wb-frame").getBoundingClientRect(); return {x: f.left + f.width / 2, y: f.top + f.height / 2}; });
    const before = await page.evaluate(() => ((window.__sbSync.state.notes.w1 || {}).wbInk || []).length);
    // stroke 1, then the next stroke starts just before the 900 ms save and is still going when it lands
    await page.mouse.move(r.x - 100, r.y); await page.mouse.down(); await page.mouse.move(r.x, r.y + 30, {steps: 6}); await page.mouse.up();
    await page.waitForTimeout(820);
    await page.mouse.move(r.x - 100, r.y + 80); await page.mouse.down(); await page.mouse.move(r.x - 60, r.y + 90, {steps: 3});
    await page.waitForTimeout(400);
    await page.mouse.move(r.x, r.y + 110, {steps: 4}); await page.mouse.up();
    await page.waitForTimeout(1300);
    const after = await page.evaluate(() => ((window.__sbSync.state.notes.w1 || {}).wbInk || []).length);
    ok(after > before, `the strokes were saved meanwhile (${before} -> ${after}), so the page was redrawn while drawing`);
    const low = await page.evaluate(() => window.__wbLow), fade = await page.evaluate(() => window.__wbFade);
    ok(!fade && low > 0.99, `the board never fades in again (lowest opacity ${low.toFixed(2)}, fade ${fade})`);
    ok(!errs.length, "no page errors " + errs.join(" | "));
    console.log("\nwb-no-blink.e2e: " + n + " checks passed");
  } finally { await browser.close(); server.close(); }
})().catch(e => { console.error(e); process.exit(1); });
