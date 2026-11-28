// Browser test: the companion can be dragged and dropped. It follows the pointer, plops down where it's let go, stays there
// on other pages, and is never carried over the side menu
// Run: node tests/companion-drag.e2e.js
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
const seed = () => { localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "1"); localStorage.setItem("coursework:v2", JSON.stringify({v: 2, courses: [], tasks: [], decks: [], notes: [], files: [], events: [], settings: {}, updated: 1})); };
(async () => {
  await new Promise(r => server.listen(0, r)); const url = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  try {
    const ctx = await browser.newContext({viewport: {width: 1300, height: 900}});
    await ctx.addInitScript(seed);
    const page = await ctx.newPage(); const errs = []; page.on("pageerror", e => errs.push(e.message));
    await page.goto(url); await page.waitForFunction(() => window.SBCOMP); await page.waitForTimeout(2200);
    const hitBox = async () => (await page.$(".cp-front .cp-hit")).boundingBox();
    const boxR = () => page.evaluate(() => SBCOMP.el().getBoundingClientRect().toJSON());
    const drag = async (tx, ty, steps) => {
      const h = await hitBox(), sx = h.x + h.width / 2, sy = h.y + h.height / 2;
      await page.mouse.move(sx, sy); await page.mouse.down();
      await page.mouse.move(sx + 6, sy + 6); await page.mouse.move(tx, ty, {steps: steps || 12}); await page.waitForTimeout(80);
      return {sx, sy};
    };
    // 1. carried: it follows the pointer, lifted
    const r0 = await boxR();
    await drag(700, 300);
    const mid = await page.evaluate(() => ({drag: SBCOMP.el().classList.contains("cp-drag"), grab: document.documentElement.classList.contains("cp-grabbing"), r: SBCOMP.el().getBoundingClientRect().toJSON()}));
    ok(mid.drag && mid.grab, "while carried it is lifted and the cursor is a closed hand");
    ok(Math.abs(mid.r.x + mid.r.width / 2 - 700) < 40 && Math.abs(mid.r.y + mid.r.height / 2 - 300) < 60, `it follows the pointer (from ${Math.round(r0.x)},${Math.round(r0.y)} to ${Math.round(mid.r.x)},${Math.round(mid.r.y)})`);
    // 2. let go: it plops down there and stays
    await page.mouse.up(); await page.waitForTimeout(80);
    ok(await page.evaluate(() => SBCOMP.el().classList.contains("cp-plop") || !!SBCOMP.el().getAnimations().length), "it plops down when let go");
    await page.waitForTimeout(900);
    const dropped = await page.evaluate(() => ({spot: SBCOMP.el().dataset.spot, x: +SBCOMP.el().dataset.x, y: +SBCOMP.el().dataset.y, drag: SBCOMP.el().classList.contains("cp-drag"), bubble: !!document.querySelector(".cp-bubble.on")}));
    ok(dropped.spot === "drop" && !dropped.drag, "it settles in the spot it was dropped: " + JSON.stringify(dropped));
    ok(!dropped.bubble, "a drag isn't a tap: no speech bubble");
    // 3. a new page doesn't send it back
    await page.evaluate(() => { const b = document.querySelector('nav.tabs [data-tab="timeline"]') || document.querySelector('nav.tabs [data-tab="schedule"]'); if (b) b.click(); });
    await page.waitForTimeout(1500);
    const after = await page.evaluate(() => ({spot: SBCOMP.el().dataset.spot, x: +SBCOMP.el().dataset.x, y: +SBCOMP.el().dataset.y}));
    ok(after.spot === "drop" && Math.abs(after.x - dropped.x) < 2 && Math.abs(after.y - dropped.y) < 2, "it stays where it was dropped on another page");
    // 4. never over the side menu
    const nav = await page.evaluate(() => document.querySelector("nav.tabs").getBoundingClientRect().toJSON());
    await drag(Math.max(5, nav.left + 20), 400, 20);
    const art = await page.evaluate(() => SBCOMP.bounds().visual);
    ok(art.left >= nav.right - 10, `carried toward the side menu it stops at its edge (art ${Math.round(art.left)}, menu ends ${Math.round(nav.right)})`);
    await page.mouse.up(); await page.waitForTimeout(900);
    const art2 = await page.evaluate(() => SBCOMP.bounds().visual);
    ok(art2.left >= nav.right - 10, "and it lands beside the menu, not on it");
    // 5. a tap still says hi
    await page.waitForTimeout(400);
    const h = await hitBox(); await page.mouse.click(h.x + h.width / 2, h.y + h.height / 2);
    await page.waitForTimeout(600);
    ok(await page.evaluate(() => !!document.querySelector(".cp-bubble.on")), "a tap (no drag) still says hi");
    ok(!errs.length, "no page errors " + errs.join(" | "));
    await ctx.close();
  } finally { await browser.close(); server.close(); }
  console.log(`\n${n} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
