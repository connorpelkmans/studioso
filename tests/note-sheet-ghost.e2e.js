// Browser test (phone): after editing a note and closing it, the first drag doesn't flash the editor back up
// (its slide-down copy plays once, when the editor closes, and never again on a later redraw)
// Run: node tests/note-sheet-ghost.e2e.js
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
(async () => {
  await new Promise(r => server.listen(0, r)); const url = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  try {
    const ctx = await browser.newContext({viewport: {width: 390, height: 844}, isMobile: true, hasTouch: true, deviceScaleFactor: 2});
    await ctx.addInitScript(() => { try { localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "1"); localStorage.setItem("coursework:v2", JSON.stringify({v: 2, courses: [], tasks: [], decks: [], files: [], events: [], settings: {}, updated: 1, notes: [{id: "n1", text: "Hello note", color: "yellow", x: 60, y: 60, z: 1}]})); } catch (e) {} });
    const page = await ctx.newPage(), errs = []; page.on("pageerror", e => errs.push(e.message));
    await page.goto(url); await page.waitForTimeout(1500);
    await page.click('nav.tabs [data-tab="notes"]'); await page.waitForTimeout(800);
    let b = await (await page.$('.note[data-note="n1"]')).boundingBox();
    await page.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2); await page.waitForTimeout(700);
    ok(await page.evaluate(() => !!document.querySelector(".note.editing.n-sheet")), "tapping the note opens it as a sheet");
    // typing starts with a tap in the note's text
    { const tb = await (await page.$(".note.n-sheet .note-text")).boundingBox(); await page.touchscreen.tap(tb.x + tb.width / 2, tb.y + tb.height / 2); await page.waitForTimeout(300); }
    await page.keyboard.type(" and more"); await page.waitForTimeout(200);
    // with the keyboard up, the note's colour carries on down behind it
    { await page.evaluate(() => document.documentElement.style.setProperty("--kb", "300px")); await page.waitForTimeout(100);
      const s = await page.evaluate(() => { const bg = document.querySelector(".n-sheet-bg.on"), a = bg && getComputedStyle(bg, "::after"); return {h: a && a.height, c: a && a.backgroundColor, note: getComputedStyle(document.querySelector(".note.n-sheet")).backgroundColor}; });
      ok(s.h === "300px" && s.c === s.note, "behind the keyboard, the note's own colour fills the screen: " + JSON.stringify(s));
      // typing with the keyboard up: the Done row sits inside the note, never cut off at its bottom edge
      await page.evaluate(() => document.documentElement.classList.add("kb-open")); await page.focus(".note.n-sheet .note-text"); await page.waitForTimeout(300);
      const r = await page.evaluate(() => { const s = document.querySelector(".note.n-sheet"), b = s.querySelector(".note-btns"), d = [...b.querySelectorAll("button")].find(x => /Done/.test(x.textContent)); return {sheet: Math.round(s.getBoundingClientRect().bottom), row: Math.round(b.getBoundingClientRect().bottom), done: Math.round(d.getBoundingClientRect().bottom)}; });
      ok(r.row <= r.sheet + 1 && r.done <= r.sheet, "with the keyboard up, the Done row isn't cut off: " + JSON.stringify(r));
      await page.evaluate(() => { document.documentElement.classList.remove("kb-open"); document.documentElement.style.setProperty("--kb", "0px"); }); }
    // watch for the editor's slide-down copy from here on
    await page.evaluate(() => { window.__g = []; const t0 = performance.now(); new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(a => { if (a.nodeType === 1 && a.classList.contains("n-ghost")) window.__g.push(Math.round(performance.now() - t0)); }))).observe(document.body, {childList: true}); });
    await page.click('.note.editing button:has-text("Done")');
    // the keyboard closing right after (the app is told, and fits the sheet again)
    await page.evaluate(() => dispatchEvent(new Event("sb-kb-cover"))); await page.waitForTimeout(80);
    await page.evaluate(() => dispatchEvent(new Event("sb-kb-cover"))); await page.waitForTimeout(700);
    const atClose = await page.evaluate(() => window.__g.length);
    ok(atClose === 1, "closing the note slides the editor down once (" + atClose + ")");
    ok(await page.evaluate(() => !document.querySelector(".note.n-sheet")), "and the closed note is a plain note on the board again");
    // the first drag after editing
    b = await (await page.$('.note[data-note="n1"]')).boundingBox();
    const sx = b.x + b.width / 2, sy = b.y + 20, cdp = await ctx.newCDPSession(page);
    const tp = (type, x, y) => cdp.send("Input.dispatchTouchEvent", {type, touchPoints: type === "touchEnd" ? [] : [{x, y}]});
    await tp("touchStart", sx, sy); await page.waitForTimeout(350);
    for (let i = 1; i <= 12; i++) { await tp("touchMove", sx + i * 8, sy + i * 6); await page.waitForTimeout(30); }
    await tp("touchEnd"); await page.waitForTimeout(800);
    const moved = await (await page.$('.note[data-note="n1"]')).boundingBox();
    ok(Math.abs(moved.x - b.x) > 40, "the note moves");
    const after = await page.evaluate(() => window.__g.length);
    ok(after === atClose, "the first drag after editing doesn't flash the editor back up (" + (after - atClose) + " extra)");
    ok(await page.evaluate(() => /and more/.test(document.querySelector('.note[data-note="n1"]').textContent)), "what was typed is kept");
    ok(!errs.length, "no page errors " + errs.join(" | "));
    console.log(`note-sheet-ghost.e2e: ${n} checks passed`);
  } finally { await browser.close(); server.close(); }
})().catch(e => { console.error(e); process.exit(1); });
