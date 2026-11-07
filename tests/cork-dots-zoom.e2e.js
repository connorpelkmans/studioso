// node tests/cork-dots-zoom.e2e.js (Playwright + Chromium; no network) On a phone, the cork dots stay on the same spot of the note board at any zoom
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
// A big board, so the part on screen is far from its top-left corner, where any drift in the dots has added up
const SEED = {v: 2, courses: [], tasks: [], decks: [], files: [], events: [], settings: {}, updated: 1,
  notes: [note("n1", 20, 20, "Top left"), note("n2", 1800, 1800, "Far away")]};
(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  const errs = [];
  try {
    const ctx = await browser.newContext({viewport: {width: 390, height: 844}, deviceScaleFactor: 3, isMobile: true, hasTouch: true});
    await ctx.addInitScript(seed => {
      try { localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "1");
        if (!localStorage.getItem("coursework:v2")) localStorage.setItem("coursework:v2", JSON.stringify(seed)); } catch (e) {}
    }, SEED);
    const page = await ctx.newPage(); page.on("pageerror", e => errs.push(e.message));
    await page.goto(base); await page.waitForSelector("#view", {state: "attached"}); await page.waitForTimeout(1500);
    await page.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
    await page.evaluate(() => { const b = document.querySelector('nav.tabs [data-tab="notes"]') || document.querySelector('[data-tab="notes"]'); b && b.click(); });
    await page.waitForSelector("#nbBoard .note"); await page.waitForTimeout(400);

    const zoom = () => page.evaluate(() => { const t = getComputedStyle(document.getElementById("nbBoard")).transform; return !t || t === "none" ? 1 : new DOMMatrix(t).a; });
    // Pinch-style zoom (Ctrl + wheel goes through the same nbZoomTo), then scroll deep into the board
    const zoomTo = async zt => {
      await page.evaluate(zt => {
        const s = document.getElementById("nbScroll"), cur = () => { const t = getComputedStyle(document.getElementById("nbBoard")).transform; return !t || t === "none" ? 1 : new DOMMatrix(t).a; };
        for (let k = 0; k < 20 && Math.abs(cur() - zt) > 0.004; k++) {
          const r = s.getBoundingClientRect(), d = Math.max(-50, Math.min(50, -Math.log(zt / cur()) / 0.01));
          s.dispatchEvent(new WheelEvent("wheel", {deltaY: d, ctrlKey: true, bubbles: true, cancelable: true, clientX: r.left + 10, clientY: r.top + 10}));
        }
      }, zt);
      const z = await zoom();
      await page.evaluate(z => { const s = document.getElementById("nbScroll"); s.scrollLeft = 1100 * z; s.scrollTop = 1100 * z; }, z);
      await page.waitForTimeout(200);
      return z;
    };
    // The dark dots sit on a 9px board grid, at the middle of each cell. Where the board says a dot is, the screen should be darker
    // than halfway between dots; if the dots slide against the board, the two come out the same.
    const dots = async z => {
      const info = await page.evaluate(() => { const b = document.getElementById("nbBoard").getBoundingClientRect(), sc = document.getElementById("nbScroll"), s = sc.getBoundingClientRect();
        return {bx: b.left, by: b.top, s: {x: s.left + 4, y: s.top + 4, w: sc.clientWidth - 8, h: sc.clientHeight - 8}}; });
      const png = await page.screenshot({clip: {x: info.s.x, y: info.s.y, width: info.s.w, height: info.s.h}});
      return page.evaluate(async ({b64, info, z}) => {
        const img = new Image(); img.src = "data:image/png;base64," + b64; await img.decode();
        const c = document.createElement("canvas"); c.width = img.width; c.height = img.height; const g = c.getContext("2d"); g.drawImage(img, 0, 0);
        const d = g.getImageData(0, 0, c.width, c.height).data, k = img.width / info.s.w;
        const lum = (x, y) => { const X = Math.round((x - info.s.x) * k), Y = Math.round((y - info.s.y) * k); if (X < 0 || Y < 0 || X >= c.width || Y >= c.height) return null;
          const i = (Y * c.width + X) * 4; if (d[i] > 240 && d[i + 1] > 200) return null; return d[i] * .3 + d[i + 1] * .59 + d[i + 2] * .11; };   // skip notes
        let on = 0, off = 0, cnt = 0;
        for (let i = 0; i < 400; i++) for (let j = 0; j < 400; j++) {
          const x = info.bx + (9 * i + 4.5) * z, y = info.by + (9 * j + 4.5) * z, a = lum(x, y), o = lum(x + 4.5 * z, y + 4.5 * z);
          if (a == null || o == null) continue; on += a; off += o; cnt++;
        }
        return {cnt, gap: (off - on) / cnt};
      }, {b64: png.toString("base64"), info, z});
    };

    const d1 = await dots(1);
    ok(d1.cnt > 500 && d1.gap > 15, "at 100% the dark dots sit on the board's 9px grid: " + d1.gap.toFixed(1));
    for (const want of [1.73, 0.61, 1.5, 0.83]) {
      const z = await zoomTo(want), r = await dots(z);
      ok(Math.abs(z - want) < 0.02 && r.cnt > 200 && r.gap > 15, `zoomed to ${Math.round(z * 100)}%, the dots are still on the same spots of the board: ${r.gap.toFixed(1)}`);
    }
    ok(await page.evaluate(() => getComputedStyle(document.getElementById("nbSizer")).backgroundImage === "none" && getComputedStyle(document.getElementById("nbBoard")).backgroundImage !== "none"),
      "zoomed, the dots are drawn on the board itself, not the frame behind it");
    await zoomTo(1);
    ok(await page.evaluate(() => { const b = getComputedStyle(document.getElementById("nbBoard")); return b.backgroundSize === "9px 9px, 13px 13px" && b.backgroundPosition === "0px 0px, 5px 7px"; }),
      "back at 100%, the cork pattern is the usual 9px and 13px dots");
    ok(!errs.length, "no page errors" + (errs.length ? ": " + errs.join("; ") : ""));
    console.log(`\n${n} checks passed`);
  } catch (e) { console.error("FAIL:", e.message); process.exitCode = 1; }
  finally { await browser.close(); server.close(); }
})();
