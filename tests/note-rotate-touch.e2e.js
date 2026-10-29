// node tests/note-rotate-touch.e2e.js: on a phone, the rotate handles on notes and stickers stay hidden; grabbing a note's
// top-right corner still rotates it (and shows the handle while rotating), and grabbing the middle still moves it
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const root = path.join(__dirname, "..");
const server = http.createServer((req, res) => { const u = new URL(req.url, "http://x"); let p = decodeURIComponent(u.pathname); if (p === "/") p = "/index.html"; const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; } const mime = {".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json"}; res.writeHead(200, {"content-type": mime[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res); });
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
(async () => {
  await new Promise(r => server.listen(0, r));
  const b = await chromium.launch({executablePath});
  try {
    const ctx = await b.newContext({viewport: {width: 402, height: 874}, isMobile: true, hasTouch: true});
    const seed = {v: 2, updated: 1, settings: {}, courses: [], tasks: [], notes: [{id: "n1", text: "Change crunch to solid colors", x: 40, y: 60, color: "yellow", rot: 0, created: 1}]};
    await ctx.addInitScript(s => { window.__SB_TEST = true; try { if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("coursework:v2", JSON.stringify(s)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("studyboard:tour", "done"); } } catch (e) {} }, seed);
    const page = await ctx.newPage(); const errs = []; page.on("pageerror", e => errs.push(e.message));
    await page.goto("http://localhost:" + server.address().port + "/"); await page.waitForFunction(() => window.__sbSync); await page.waitForTimeout(500);
    await page.evaluate(() => { window.__sbSync.ui.tab = "notes"; window.__sbSync.render(); }); await page.waitForSelector('.note[data-note="n1"] .note-rot', {state: "attached"});
    await page.waitForTimeout(400);
    const op = () => page.evaluate(() => getComputedStyle(document.querySelector('.note[data-note="n1"] .note-rot')).opacity);
    ok(await op() === "0", "on a phone, the note's rotate handle is hidden (" + await op() + ")");
    // a touch drag, as pointer events
    const drag = (x0, y0, x1, y1, mid) => page.evaluate(async ([x0, y0, x1, y1, mid]) => {
      const t = document.elementFromPoint(x0, y0), o = {pointerId: 7, pointerType: "touch", isPrimary: true, bubbles: true, cancelable: true, composed: true};
      t.dispatchEvent(new PointerEvent("pointerdown", Object.assign({clientX: x0, clientY: y0, buttons: 1}, o)));
      let seen = null;
      for (let i = 1; i <= 8; i++) { await new Promise(r => setTimeout(r, 30)); document.dispatchEvent(new PointerEvent("pointermove", Object.assign({clientX: x0 + (x1 - x0) * i / 8, clientY: y0 + (y1 - y0) * i / 8, buttons: 1}, o))); if (i === 6 && mid) seen = getComputedStyle(document.querySelector('.note[data-note="n1"] .note-rot')).opacity; }
      document.dispatchEvent(new PointerEvent("pointerup", Object.assign({clientX: x1, clientY: y1, buttons: 0}, o)));
      await new Promise(r => setTimeout(r, 300));
      return {hit: String(t.className), seen};
    }, [x0, y0, x1, y1, mid]);
    const box = await page.locator('.note[data-note="n1"]').boundingBox();
    const r = await drag(box.x + box.width - 2, box.y + 2, box.x + box.width - 2, box.y + 70, true);
    const rot = await page.evaluate(() => Number(window.__sbSync.state.notes.n1.rot) || 0);
    ok(/note-rot/.test(r.hit), "a touch at the top-right corner lands on the (hidden) rotate handle: " + r.hit);
    ok(Math.abs(rot) > 3, "dragging from there rotates the note (" + rot.toFixed(1) + "°)");
    ok(Number(r.seen) > 0.5, "and the handle shows while rotating (" + r.seen + ")");
    ok(await op() === "0", "then hides again");
    const b2 = await page.locator('.note[data-note="n1"]').boundingBox();
    const before = await page.evaluate(() => ({x: window.__sbSync.state.notes.n1.x, y: window.__sbSync.state.notes.n1.y, rot: window.__sbSync.state.notes.n1.rot}));
    await drag(b2.x + b2.width / 2, b2.y + b2.height / 2, b2.x + b2.width / 2 + 40, b2.y + b2.height / 2 + 60, false);
    const after = await page.evaluate(() => ({x: window.__sbSync.state.notes.n1.x, y: window.__sbSync.state.notes.n1.y, rot: window.__sbSync.state.notes.n1.rot}));
    ok((after.x !== before.x || after.y !== before.y) && after.rot === before.rot, "grabbing the middle moves the note, without rotating it: " + JSON.stringify([before, after]));
    ok(!errs.length, "no page errors " + errs.join(" | "));
    // stickers: the handle is hidden on a phone too
    ok(await page.evaluate(() => { const s = document.createElement("style"); document.head.appendChild(s); const probe = document.createElement("div"); probe.className = "nb-board"; probe.innerHTML = '<div class="note"><span class="stk"><span class="stk-rot"></span></span></div>'; document.body.appendChild(probe); const v = getComputedStyle(probe.querySelector(".stk-rot")).opacity; probe.remove(); return v === "0"; }), "a sticker's rotate handle is hidden on a phone too");
    await ctx.close();
    console.log("\nnote-rotate-touch.e2e: " + n + " checks passed");
  } finally { await b.close(); server.close(); }
})().catch(e => { console.error(e); process.exit(1); });
