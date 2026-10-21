// node tests/note-zoom.e2e.js  (Playwright + Chromium; no network)
// The note board zooms: − / + and the 100% button, Ctrl + scroll (and a trackpad pinch, which browsers send the same way), and a two-finger
// pinch on a phone. Zoomed, a dragged note still lands under the pointer, a double-click adds a note where you clicked, and 100% resets.
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
const SEED = {v: 2, courses: [], tasks: [], decks: [], files: [], events: [], settings: {}, updated: 1,
  notes: [note("n1", 40, 40, "First"), note("n2", 420, 60, "Second"), note("n3", 900, 700, "Far away")]};
(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  const errs = [];
  const open = async opts => {
    const ctx = await browser.newContext(opts);
    await ctx.addInitScript(seed => {
      try { localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "1");
        if (!localStorage.getItem("coursework:v2")) localStorage.setItem("coursework:v2", JSON.stringify(seed)); } catch (e) {}
    }, SEED);
    const page = await ctx.newPage(); page.on("pageerror", e => errs.push(e.message));
    await page.goto(base); await page.waitForSelector("#view", {state: "attached"}); await page.waitForTimeout(1500);
    await page.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
    await page.evaluate(() => { const b = document.querySelector('nav.tabs [data-tab="notes"]'); b && b.click(); });
    await page.waitForSelector("#nbBoard .note"); await page.waitForTimeout(400);
    return {ctx, page};
  };
  const zoom = page => page.evaluate(() => { const t = getComputedStyle(document.getElementById("nbBoard")).transform; if (!t || t === "none") return 1; return Number(new DOMMatrix(t).a.toFixed(3)); });
  const noteBox = (page, id) => page.evaluate(id => { const r = document.querySelector(`.note[data-note="${id}"]`).getBoundingClientRect(); return {x: r.left, y: r.top, w: r.width, h: r.height}; }, id);
  const stored = (page, id) => page.evaluate(id => { const s = JSON.parse(localStorage.getItem("coursework:v2")); const n = (s.notes || []).find ? s.notes.find(x => x.id === id) : s.notes[id]; return n && {x: n.x, y: n.y}; }, id);
  try {
    const {ctx, page} = await open({viewport: {width: 1280, height: 900}});
    ok(await page.locator(".nb-zoom").isVisible() && /100%/.test(await page.locator(".nb-zoom .nbz-pct").textContent()), "the board has zoom controls showing 100%");
    const w1 = (await noteBox(page, "n1")).w;
    await page.click('.nb-zoom [data-id="out"]'); await page.waitForTimeout(100);
    await page.click('.nb-zoom [data-id="out"]'); await page.waitForTimeout(100);
    const z1 = await zoom(page);
    ok(z1 < 0.8 && Math.abs((await noteBox(page, "n1")).w - w1 * z1) < 2, "− zooms out and the notes get smaller: " + z1);
    ok(/%/.test(await page.locator(".nb-zoom .nbz-pct").textContent()) && await page.locator(".nb-zoom .nbz-pct.on").count() === 1, "the button shows the zoom and offers going back to 100%");
    const sz = await page.evaluate(() => { const s = document.getElementById("nbScroll"), b = document.getElementById("nbBoard"); return {sw: s.scrollWidth, bw: b.offsetWidth, cw: s.clientWidth}; });
    ok(sz.sw <= Math.max(sz.cw, Math.ceil(sz.bw * z1)) + 2, "zoomed out, the frame only scrolls over the board itself (no empty scroll area)");

    // Ctrl + scroll zooms around the pointer, keeping the note under it in place
    const b2 = await noteBox(page, "n2"), px = b2.x + 20, py = b2.y + 20;
    await page.mouse.move(px, py);
    await page.keyboard.down("Control"); await page.mouse.wheel(0, -200); await page.keyboard.up("Control"); await page.waitForTimeout(150);
    const z2 = await zoom(page), b2b = await noteBox(page, "n2");
    ok(z2 > z1 && Math.abs((b2b.x + 20 * z2 / z1) - px) < 6 && Math.abs((b2b.y + 20 * z2 / z1) - py) < 6, "Ctrl + scroll zooms in around the pointer: " + z1 + " to " + z2);
    const sy0 = await page.evaluate(() => document.getElementById("nbScroll").scrollTop);
    await page.mouse.wheel(0, 200); await page.waitForTimeout(150);
    ok(await zoom(page) === z2 && await page.evaluate(() => document.getElementById("nbScroll").scrollTop) >= sy0, "a plain scroll still moves around the board");

    // zoom to 50% exactly, then drag a note: it lands under the pointer
    await page.evaluate(() => { const r = document.querySelector('.nb-zoom [data-id="reset"]'); r.click(); });
    await page.waitForTimeout(100);
    for (let i = 0; i < 4; i++) { await page.click('.nb-zoom [data-id="out"]'); await page.waitForTimeout(60); }
    const z = await zoom(page);
    ok(Math.abs(z - 0.5) < 0.001, "four steps out from 100% is 50%");
    await page.evaluate(() => { const s = document.getElementById("nbScroll"); s.scrollLeft = 0; s.scrollTop = 0; });
    const a = await noteBox(page, "n1"), gx = a.x + 30, gy = a.y + 30;
    await page.mouse.move(gx, gy); await page.mouse.down(); await page.mouse.move(gx + 30, gy + 20, {steps: 4}); await page.mouse.move(gx + 100, gy + 60, {steps: 6}); await page.waitForTimeout(150); await page.mouse.up(); await page.waitForTimeout(400);
    const after = await stored(page, "n1"), a2 = await noteBox(page, "n1");
    ok(Math.abs(after.x - (40 + 200)) <= 3 && Math.abs(after.y - (40 + 120)) <= 3, "at 50%, moving the pointer 100 by 60 moves the note 200 by 120 board pixels: " + JSON.stringify(after));
    ok(Math.abs(a2.x - (a.x + 100)) < 4 && Math.abs(a2.y - (a.y + 60)) < 4, "and on screen it stays under the pointer");

    // double-click an empty spot: the new note appears where you clicked
    const br = await page.evaluate(() => { const r = document.getElementById("nbBoard").getBoundingClientRect(); return {x: r.left, y: r.top}; });
    const cx = br.x + 300, cy = br.y + 250;
    const before = await page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem("coursework:v2")).notes || {}).length);
    await page.mouse.dblclick(cx, cy); await page.waitForTimeout(500);
    const added = await page.evaluate(() => { const s = JSON.parse(localStorage.getItem("coursework:v2")); const arr = Array.isArray(s.notes) ? s.notes : Object.values(s.notes); return arr.filter(x => !["n1", "n2", "n3"].includes(x.id)).map(x => ({x: x.x, y: x.y})); });
    const nw = await page.evaluate(() => (document.querySelector(".note") || {}).offsetWidth || 0);
    ok(added.length === 1 && Math.abs(added[0].x + nw / 2 - 600) < 30 && Math.abs(added[0].y + 20 - 500) < 30, "a double-click at 50% adds the note at that spot on the board: " + JSON.stringify(added) + " (had " + before + ")");
    await page.keyboard.press("Escape").catch(() => {});

    // 100% puts it back, and the zoom is remembered after a reload
    await page.click('.nb-zoom [data-id="out"]').catch(() => {}); await page.waitForTimeout(100);
    const zr = await zoom(page);
    await page.reload(); await page.waitForTimeout(1500); await page.evaluate(() => { const b = document.querySelector('nav.tabs [data-tab="notes"]'); b && b.click(); }); await page.waitForSelector("#nbBoard .note"); await page.waitForTimeout(300);
    ok(Math.abs(await zoom(page) - zr) < 0.001, "the zoom is kept after a reload");
    await page.click('.nb-zoom [data-id="reset"]'); await page.waitForTimeout(150);
    ok(await zoom(page) === 1 && /100%/.test(await page.locator(".nb-zoom .nbz-pct").textContent()), "the 100% button puts the board back to its usual size");
    await ctx.close();

    // phone: a two-finger pinch zooms
    const ph = await open({viewport: {width: 390, height: 844}, isMobile: true, hasTouch: true});
    const sc = await ph.page.evaluate(() => { const r = document.getElementById("nbScroll").getBoundingClientRect(); return {x: r.left + r.width / 2, y: r.top + 150}; });
    const cdp = await ph.ctx.newCDPSession(ph.page);
    const tp = (d) => [{x: sc.x - d, y: sc.y, id: 1}, {x: sc.x + d, y: sc.y, id: 2}];
    await cdp.send("Input.dispatchTouchEvent", {type: "touchStart", touchPoints: tp(40)});
    for (const d of [55, 70, 90, 110]) { await cdp.send("Input.dispatchTouchEvent", {type: "touchMove", touchPoints: tp(d)}); await ph.page.waitForTimeout(30); }
    await cdp.send("Input.dispatchTouchEvent", {type: "touchEnd", touchPoints: []}); await ph.page.waitForTimeout(200);
    const zp = await zoom(ph.page);
    ok(zp > 2.2 - 0.25 || zp >= 1.9, "on a phone, spreading two fingers zooms in: " + zp);
    await ph.ctx.close();
    ok(!errs.length, "no page errors: " + errs.join(" | "));
    console.log(`note-zoom.e2e: ${n} checks passed`);
  } finally { await browser.close(); server.close(); }
})().catch(e => { console.error(e); process.exit(1); });
