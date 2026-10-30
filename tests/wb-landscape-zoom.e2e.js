// node tests/wb-landscape-zoom.e2e.js: a page-template whiteboard (Cornell Notes) on a phone turned sideways still pinches
// to zoom. Sideways the phone is wider than the phone breakpoint, so it used to get the computer's fixed-page view, which
// locks the zoom to the whole page.
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
  notes: [{id: "w1", text: "Lecture 4", wb: {v: 1, tpl: "cornell", pa: 1.6}, courseId: "", board: "", created: 1, updated: 1}]};
async function run(browser, base, opts, side){
  const ctx = await browser.newContext(opts);
  await ctx.addInitScript(seed => {
    window.__SB_TEST = true;
    try { localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "1"); localStorage.setItem("studyboard:notesView", "wb"); localStorage.setItem("studyboard:wbCur", "w1");
      if (!localStorage.getItem("coursework:v2")) localStorage.setItem("coursework:v2", JSON.stringify(seed)); } catch (e) {}
  }, SEED);
  const page = await ctx.newPage(); const errs = []; page.on("pageerror", e => errs.push(e.message));
  await page.goto(base); await page.waitForSelector("#view", {state: "attached"}); await page.waitForTimeout(1200);
  await page.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
  await page.evaluate(() => { const b = document.querySelector('nav.tabs [data-tab="notes"]'); if (b) b.click(); else { window.__sbSync.ui.tab = "notes"; window.__sbSync.render(); } });
  await page.waitForSelector(".wb-stage .wb-frame"); await page.waitForTimeout(500);
  if (side) {   // full screen, then turn the phone sideways
    await page.click(".wb-stage .wb-max"); await page.waitForTimeout(300);
    await page.setViewportSize({width: 874, height: 402}); await page.waitForTimeout(600);
    if (!(await page.evaluate(() => document.documentElement.classList.contains("board-max")))) throw new Error("full screen did not open");
  }
  const zoom = () => page.evaluate(() => (document.querySelector(".wbz-pct") || {}).textContent || "");
  const z0 = await zoom();
  // a two-finger pinch outwards in the middle of the board
  await page.evaluate(async () => {
    const f = document.querySelector(".wb-frame"), r = f.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const ev = (t, id, x, y) => f.dispatchEvent(new PointerEvent(t, {pointerId: id, pointerType: "touch", isPrimary: id === 1, clientX: x, clientY: y, bubbles: true, cancelable: true, buttons: t === "pointerup" ? 0 : 1}));
    ev("pointerdown", 1, cx - 30, cy); ev("pointerdown", 2, cx + 30, cy);
    for (let i = 1; i <= 10; i++) { await new Promise(r => setTimeout(r, 16)); ev("pointermove", 1, cx - 30 - i * 12, cy); ev("pointermove", 2, cx + 30 + i * 12, cy); }
    ev("pointerup", 1, cx - 150, cy); ev("pointerup", 2, cx + 150, cy);
  });
  await page.waitForTimeout(300);
  const z1 = await zoom();
  await ctx.close();
  return {z0: parseInt(z0, 10), z1: parseInt(z1, 10), errs};
}
(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  try {
    const side = await run(browser, base, {viewport: {width: 402, height: 874}, isMobile: true, hasTouch: true}, true);
    ok(side.z1 > side.z0 * 1.5, "phone sideways: pinching out zooms into the Cornell Notes page (" + side.z0 + "% -> " + side.z1 + "%)");
    ok(!side.errs.length, "no page errors " + side.errs.join(" | "));
    const up = await run(browser, base, {viewport: {width: 402, height: 874}, isMobile: true, hasTouch: true});
    ok(up.z1 > up.z0 * 1.5, "phone upright: pinching still zooms (" + up.z0 + "% -> " + up.z1 + "%)");
    // − and + step evenly: 10% at a time below 100%, 25% above
    { const ctx = await browser.newContext({viewport: {width: 1280, height: 860}});
      await ctx.addInitScript(seed => { window.__SB_TEST = true;
        try { localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "1"); localStorage.setItem("studyboard:notesView", "wb"); localStorage.setItem("studyboard:wbCur", "w2");
          if (!localStorage.getItem("coursework:v2")) localStorage.setItem("coursework:v2", JSON.stringify(Object.assign({}, seed, {notes: [{id: "w2", text: "Blank", wb: {v: 1, tpl: "blank", pa: 1.6}, courseId: "", board: "", created: 1, updated: 1}]}))); } catch (e) {} }, SEED);
      const page = await ctx.newPage();
      await page.goto(base); await page.waitForSelector("#view", {state: "attached"}); await page.waitForTimeout(1200);
      await page.evaluate(() => { document.querySelectorAll("dialog[open]").forEach(d => d.close()); window.__sbSync.ui.tab = "notes"; window.__sbSync.render(); });
      await page.waitForSelector(".wb-stage .wb-zoom"); await page.click('.wb-zoom [data-wb="zoom-reset"]'); await page.waitForTimeout(300);
      const seq = [];
      for (const b of ["zoom-in", "zoom-in", "zoom-in", "zoom-out", "zoom-out", "zoom-out", "zoom-out", "zoom-out"]) { await page.click(`.wb-zoom [data-wb="${b}"]`); await page.waitForTimeout(280); seq.push(parseInt(await page.locator(".wbz-pct").textContent(), 10)); }
      ok(JSON.stringify(seq) === JSON.stringify([125, 150, 175, 150, 125, 100, 90, 80]), "zoom buttons step evenly: " + seq.join(", "));
      await ctx.close(); }
    console.log("\nwb-landscape-zoom.e2e: " + n + " checks passed");
  } finally { await browser.close(); server.close(); }
})().catch(e => { console.error(e); process.exit(1); });
