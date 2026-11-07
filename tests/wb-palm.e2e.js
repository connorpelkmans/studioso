// node tests/wb-palm.e2e.js (Playwright + Chromium; no network) Whiteboard palm rejection on an iPad with a pencil
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const root = path.join(__dirname, "..");
const MIME = {".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".png": "image/png", ".css": "text/css", ".svg": "image/svg+xml", ".webp": "image/webp", ".woff2": "font/woff2"};
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  res.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const SEED = {v: 2, courses: [], tasks: [], decks: [], files: [], events: [], settings: {}, updated: 1, notes: []};
(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  const errs = [];
  const ctx = await browser.newContext({viewport: {width: 1180, height: 820}, hasTouch: true, isMobile: true});
  await ctx.addInitScript(seed => {
    try { localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "1");
      if (!localStorage.getItem("coursework:v2")) localStorage.setItem("coursework:v2", JSON.stringify(seed)); } catch (e) {}
  }, SEED);
  const page = await ctx.newPage(); page.on("pageerror", e => errs.push(e.message));
  // synthetic pointer events on the board, as an iPad sends them (pen = Apple Pencil, touch = a finger or the palm)
  const P = (type, id, kind, x, y, extra) => page.evaluate(([type, id, kind, x, y, extra]) => {
    const f = document.querySelector(".wb-frame"), r = f.getBoundingClientRect(), el = extra && extra.on ? document.querySelector(extra.on) : f;
    const q = el.getBoundingClientRect(), cx = extra && extra.on ? q.left + q.width / 2 : r.left + x, cy = extra && extra.on ? q.top + q.height / 2 : r.top + y;
    el.dispatchEvent(new PointerEvent(type, {pointerId: id, pointerType: kind, isPrimary: !!(extra && extra.primary), clientX: cx, clientY: cy, button: 0, buttons: type === "pointerup" ? 0 : 1, bubbles: true, cancelable: true}));
  }, [type, id, kind, x, y, extra || null]);
  const strokes = () => page.evaluate(() => SBWB.board().strokes.length);
  const cam = () => page.evaluate(() => { const c = SBWB.cam(); return [Math.round(c.x), Math.round(c.y)]; });
  const line = async (id, x0, y0, during) => { await P("pointerdown", id, "pen", x0, y0); for (let i = 1; i <= 8; i++) { await P("pointermove", id, "pen", x0 + i * 12, y0 + i * 4); if (i === 3 && during) await during(); } await P("pointerup", id, "pen", x0 + 96, y0 + 32); };
  try {
    await page.goto(base); await page.waitForSelector("#view", {state: "attached"}); await page.waitForTimeout(1500);
    await page.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
    await page.evaluate(() => { const b = document.querySelector('nav.tabs [data-tab="notes"]'); b && b.click(); });
    await page.waitForSelector(".nv-tabs"); await page.click('.nv-tabs [data-id="wb"]'); await page.waitForTimeout(400);
    await page.evaluate(() => { const g = document.querySelector(".wb-blank-go"); g && g.click(); }); await page.waitForTimeout(600);
    await page.waitForSelector(".wb-frame");
    await page.evaluate(() => { const b = document.querySelector('.wb-stage [data-wb="tool"][data-id="pen"]'); b && b.click(); });

    const s0 = await strokes();
    await line(1, 100, 100);
    ok(await strokes() === s0 + 1, "the pencil draws a line");

    // a palm already resting on the board when the pencil comes down
    const c0 = await cam();
    await P("pointerdown", 50, "touch", 400, 300, {primary: true}); await P("pointermove", 50, "touch", 403, 302);
    await line(2, 120, 160);
    await P("pointermove", 50, "touch", 440, 330); await P("pointerup", 50, "touch", 440, 330);
    ok(await strokes() === s0 + 2, "with a hand resting on the board first, the pencil still draws");
    ok(JSON.stringify(await cam()) === JSON.stringify(c0), "and the resting hand doesn't move the board: " + JSON.stringify(await cam()));

    // a palm landing (and dragging) while the pencil is writing
    await line(3, 120, 220, async () => { await P("pointerdown", 51, "touch", 420, 320, {primary: true}); await P("pointermove", 51, "touch", 470, 360); await P("pointerdown", 52, "touch", 520, 360); await P("pointermove", 52, "touch", 560, 400); });
    await P("pointerup", 51, "touch", 470, 360); await P("pointerup", 52, "touch", 560, 400);
    ok(await strokes() === s0 + 3, "a hand landing mid-line doesn't cut the line short or start a pinch");
    ok(JSON.stringify(await cam()) === JSON.stringify(c0), "and doesn't move or zoom the board");

    // a palm on the tools while writing doesn't press them
    const tool0 = await page.evaluate(() => SBWB.tool());
    await P("pointerdown", 4, "pen", 140, 280);
    await P("pointerdown", 53, "touch", 0, 0, {primary: true, on: '.wb-stage [data-wb="tool"][data-id="eraser"]'});
    await page.evaluate(() => document.querySelector('.wb-stage [data-wb="tool"][data-id="eraser"]').click());
    await P("pointerup", 53, "touch", 0, 0, {on: '.wb-stage [data-wb="tool"][data-id="eraser"]'});
    await P("pointerup", 4, "pen", 200, 300);
    ok(await page.evaluate(() => SBWB.tool()) === tool0, "a hand resting on the tools while writing doesn't switch tools");

    // later, a finger on its own still moves the board, but only once it really moves
    await page.waitForTimeout(800);
    // zoomed in, so there's room to move
    await page.evaluate(() => { const b = document.querySelector('.wb-zoom [data-wb="zoom-in"]'); for (let i = 0; i < 4; i++) b.click(); }); await page.waitForTimeout(200);
    const cz = await cam();
    await P("pointerdown", 60, "touch", 300, 300, {primary: true}); await P("pointermove", 60, "touch", 305, 304);
    ok(JSON.stringify(await cam()) === JSON.stringify(cz), "a finger settling on the board doesn't nudge it");
    await P("pointermove", 60, "touch", 330, 320); await P("pointermove", 60, "touch", 380, 350); await P("pointerup", 60, "touch", 380, 350);
    const c1 = await cam();
    ok(c1[0] !== cz[0] || c1[1] !== cz[1], "a finger dragged across the board still moves it");
    ok(await strokes() === s0 + 4, "and fingers never draw once a pencil has been used");

    const sel = await page.evaluate(() => [".wb-tray-head", ".wb-tray", "h2", ".wb-head"].map(s => { const e = document.querySelector(s); return e ? getComputedStyle(e).webkitUserSelect || getComputedStyle(e).userSelect : "none"; }));
    ok(sel.every(v => v === "none"), "nothing on the whiteboard page selects as text under a resting hand: " + sel.join(","));
    await page.click(".nv-tabs [data-id=\"board\"]").catch(() => {}); await page.waitForTimeout(300);
    ok(await page.evaluate(() => getComputedStyle(document.body).userSelect) !== "none", "and the rest of the app selects text as before");

    ok(!errs.length, "no page errors: " + errs.join(" | "));
    console.log(`wb-palm.e2e: ${n} checks passed`);
  } catch (e) { console.error(e); process.exitCode = 1; }
  finally { await browser.close(); server.close(); }
})();
