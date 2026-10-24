// node tests/board-max.e2e.js
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const root = path.join(__dirname, "..");
const MIME = {".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".png": "image/png", ".css": "text/css", ".svg": "image/svg+xml", ".webp": "image/webp"};
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  res.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const note = (id, x, y, text) => ({id, text, color: "yellow", x, y, z: 1, rot: 0, courseId: "", board: "", created: 1, stickers: []});
const SEED = {v: 2, courses: [], tasks: [], decks: [], files: [], events: [], settings: {}, updated: 1, notes: [note("n1", 40, 80, "First"), note("n2", 420, 90, "Second")]};
const SHOTS = process.env.SHOTS || "";
(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  const errs = [];
  const covers = page => page.evaluate(sel => { const e = document.querySelector(sel), r = e.getBoundingClientRect();
    const mid = document.elementFromPoint(innerWidth / 2, innerHeight - 4), top = document.elementFromPoint(innerWidth / 2, 4);
    return {full: Math.abs(r.left) < 1 && Math.abs(r.top) < 1 && Math.abs(r.width - innerWidth) < 1 && Math.abs(r.height - innerHeight) < 1, over: e.contains(mid) && e.contains(top), scrollY}; }, ".board-max .nb-wrap, .board-max .wb-host");
  const isMax = page => page.evaluate(() => document.documentElement.classList.contains("board-max"));
  try {
    for (const [label, opts] of [["computer", {viewport: {width: 1280, height: 860}}], ["phone", {viewport: {width: 390, height: 844}, isMobile: true, hasTouch: true, deviceScaleFactor: 2}]]) {
      const ctx = await browser.newContext(opts);
      await ctx.addInitScript(seed => {
        try { localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "1"); localStorage.setItem("studioso:tour", "done");
          if (!localStorage.getItem("coursework:v2")) localStorage.setItem("coursework:v2", JSON.stringify(seed)); } catch (e) {}
      }, SEED);
      const page = await ctx.newPage(); page.on("pageerror", e => errs.push(e.message));
      await page.goto(base); await page.waitForSelector("#view", {state: "attached"}); await page.waitForTimeout(1500);
      await page.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
      await page.evaluate(() => { const b = document.querySelector('nav.tabs [data-tab="notes"]'); b && b.click(); });
      await page.waitForSelector("#nbBoard .note"); await page.waitForTimeout(400);

      const bm = await page.evaluate(() => { const b = document.querySelector(".nb-max").getBoundingClientRect(), s = document.getElementById("nbScroll").getBoundingClientRect(), z = document.querySelector(".nb-zoom").getBoundingClientRect();
        const t = [...document.querySelectorAll(".nb-target")].map(x => x.getBoundingClientRect()), apart = (p, q) => p.right <= q.left || q.right <= p.left || p.bottom <= q.top || q.bottom <= p.top;
        const covers = [...document.querySelectorAll("nav.tabs, .fab")].filter(e => getComputedStyle(e).position === "fixed" && getComputedStyle(e).opacity !== "0").map(e => e.getBoundingClientRect());
        return {right: s.right - b.right < 24 && b.top - s.top < 24, zoomLeft: z.left - s.left < 24 && z.top - s.top < 24,
          top: t.length === 2 && t.every(q => q.top - s.top < 24 && q.right <= b.left && b.left - q.right < 60 && q.width < 50), clear: [b, z].every(p => t.every(q => apart(p, q))) && apart(t[0], t[1])}; });
      ok(await page.locator(".nb-max").isVisible() && bm.right && bm.zoomLeft, `${label}: the note board has its zoom at the top left and the expand button at the top right`);
      ok(bm.top && bm.clear, `${label}: Archive and Trash are round buttons at the top, just left of the expand button`);
      await page.click(".nb-max"); await page.waitForTimeout(300);
      let c = await covers(page);
      ok(await isMax(page) && c.full && c.over, `${label}: it makes the note board fill the whole window, over the header and tabs`);
      ok(await page.evaluate(() => { const s = document.getElementById("nbScroll").getBoundingClientRect(); return s.height > innerHeight * 0.6; }), `${label}: the board itself grows to fill it`);
      ok(await page.getAttribute(".nb-max", "aria-pressed") === "true" && /Exit/.test(await page.getAttribute(".nb-max", "aria-label")), `${label}: the button now offers going back`);
      if (SHOTS) await page.screenshot({path: path.join(SHOTS, `notes-${label}.png`)});
      const before = await page.evaluate(() => { const r = document.querySelector('.note[data-note="n1"]').getBoundingClientRect(); return {x: r.left, y: r.top}; });
      if (label === "computer") {
        await page.mouse.move(before.x + 30, before.y + 30); await page.mouse.down(); await page.mouse.move(before.x + 90, before.y + 80, {steps: 6}); await page.mouse.move(before.x + 130, before.y + 110, {steps: 6}); await page.mouse.up(); await page.waitForTimeout(400);
        const st = await page.evaluate(() => { const s = JSON.parse(localStorage.getItem("coursework:v2")); const l = Array.isArray(s.notes) ? s.notes : Object.values(s.notes); return l.find(x => x.id === "n1"); });
        ok(st.x > 120 && st.y > 140 && await isMax(page), `${label}: notes still drag while it's full screen: ${st.x},${st.y}`);
      }
      await page.click(".nb-max"); await page.waitForTimeout(300);
      ok(!(await isMax(page)) && await page.locator("nav.tabs").isVisible(), `${label}: the button goes back`);
      await page.click(".nb-max"); await page.waitForTimeout(200); await page.keyboard.press("Escape"); await page.waitForTimeout(300);
      ok(!(await isMax(page)), `${label}: Esc goes back`);

      await page.evaluate(() => { const b = document.querySelector('[data-act="nv-view"][data-id="wb"]'); b && b.click(); }); await page.waitForTimeout(400);
      await page.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
      if (!(await page.locator(".wb-frame").count())) { await page.evaluate(() => { const b = document.querySelector('[data-act="wb-quick"][data-id="blank"], [data-act="wb-quick"]'); b && b.click(); }); await page.waitForTimeout(600); }
      await page.waitForSelector(".wb-frame .wb-max");
      const w0 = await page.evaluate(() => document.querySelector(".wb-frame").getBoundingClientRect());
      const wm = await page.evaluate(() => { const b = document.querySelector(".wb-max").getBoundingClientRect(), z = document.querySelector(".wb-zoom").getBoundingClientRect(), f = document.querySelector(".wb-frame").getBoundingClientRect();
        const top = f.right - b.right < 20 && b.top - f.top < 20 && z.top - f.top < 20;
        // phone: one corner pill, expand button at its right end; computer: zoom top left
        return innerWidth < 700 ? top && f.right - z.right < 20 && b.left > z.left && b.right <= z.right + 2 : top && z.left - f.left < 20 && z.right < b.left; });
      ok(await page.locator(".wb-max").isVisible() && wm, `${label}: the whiteboard's zoom and expand button sit at the top corners`);
      await page.click(".wb-max"); await page.waitForTimeout(400);
      c = await covers(page);
      const w1 = await page.evaluate(() => { const f = document.querySelector(".wb-frame").getBoundingClientRect(), cv = document.querySelector(".wb-ink"); return {w: f.width, h: f.height, cw: cv.width, ch: cv.height, dpr: devicePixelRatio}; });
      ok(await isMax(page) && c.full && c.over && w1.h > w0.height + 40, `${label}: it makes the whiteboard fill the whole window: ${Math.round(w0.height)} to ${Math.round(w1.h)} tall`);
      ok(Math.abs(w1.cw - Math.round(w1.w * w1.dpr)) < 3 && Math.abs(w1.ch - Math.round(w1.h * w1.dpr)) < 3, `${label}: the drawing surface is resized to match`);
      ok(await page.getAttribute(".wb-max", "aria-pressed") === "true", `${label}: the whiteboard's button now offers going back`);
      if (SHOTS) await page.screenshot({path: path.join(SHOTS, `wb-${label}.png`)});
      const inkN = () => page.evaluate(() => { const s = JSON.parse(localStorage.getItem("coursework:v2")); const l = Array.isArray(s.notes) ? s.notes : Object.values(s.notes); const b = l.find(x => x.wb); return b ? (b.wbInk || []).length : -1; });
      await page.evaluate(() => { const b = document.querySelector('[data-wb="tool"][data-id="pen"]'); b && b.click(); });
      const f = await page.evaluate(() => { const r = document.querySelector(".wb-frame").getBoundingClientRect(); return {x: r.left, y: r.top, w: r.width, h: r.height}; });
      await page.mouse.move(f.x + f.w * 0.3, f.y + f.h * 0.5); await page.mouse.down(); await page.mouse.move(f.x + f.w * 0.6, f.y + f.h * 0.6, {steps: 10}); await page.mouse.up(); await page.waitForTimeout(200);
      await page.keyboard.press("Escape"); await page.waitForTimeout(400);
      ok(!(await isMax(page)), `${label}: Esc leaves the full screen whiteboard`);
      await page.evaluate(() => { const b = document.querySelector('nav.tabs [data-tab="board"], nav.tabs [data-tab]'); b && b.click(); }); await page.waitForTimeout(400);
      ok(await inkN() >= 1, `${label}: a line drawn while full screen is kept`);
      await page.evaluate(() => { const b = document.querySelector('nav.tabs [data-tab="notes"]'); b && b.click(); }); await page.waitForTimeout(400);
      await page.click(".wb-max"); await page.waitForTimeout(300);
      await page.evaluate(() => { const b = [...document.querySelectorAll("nav.tabs [data-tab]")].find(x => x.dataset.tab !== "notes"); b.click(); }); await page.waitForTimeout(400);
      ok(!(await isMax(page)), `${label}: leaving Notes ends full screen`);
      await ctx.close();
    }
    ok(!errs.length, "no page errors: " + errs.slice(0, 3).join(" | "));
  } finally { await browser.close(); server.close(); }
  console.log(`\nboard-max: ${n} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
