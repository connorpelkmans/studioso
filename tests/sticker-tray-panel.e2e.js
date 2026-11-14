// node tests/sticker-tray-panel.e2e.js
// Notes on a phone: opening the Stickers tray leaves the board's shaded panel exactly as it was (it used to grow downward by the
// tray's height, because the room to scroll above the tray was padding inside the panel)
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
const SEED = {v: 2, courses: [], tasks: [], decks: [], files: [], events: [], settings: {}, updated: 1, notes: [note("n1", 40, 80, "First"), note("n2", 220, 90, "Second"), note("n3", 40, 420, "Bottom")]};
const SHOTS = process.env.SHOTS || "";
(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  const errs = [];
  try {
    for (const [label, vp] of [["iPhone", {width: 402, height: 874}], ["small phone", {width: 375, height: 667}]]) {
      const ctx = await browser.newContext({viewport: vp, isMobile: true, hasTouch: true, deviceScaleFactor: SHOTS ? 2 : 1});
      await ctx.addInitScript(seed => {
        try { localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "1"); localStorage.setItem("studioso:tour", "done");
          if (!localStorage.getItem("coursework:v2")) localStorage.setItem("coursework:v2", JSON.stringify(seed)); } catch (e) {}
      }, SEED);
      const page = await ctx.newPage(); page.on("pageerror", e => errs.push(e.message));
      await page.goto(base); await page.waitForSelector("#view", {state: "attached"}); await page.waitForTimeout(1500);
      await page.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
      await page.evaluate(() => { const b = document.querySelector('nav.tabs [data-tab="notes"]'); b && b.click(); });
      await page.waitForSelector("#nbBoard .note"); await page.waitForTimeout(500);
      const panel = () => page.evaluate(() => { const m = document.querySelector(".nb-main").getBoundingClientRect(), s = document.getElementById("nbScroll").getBoundingClientRect();
        return {top: Math.round(m.top + scrollY), h: Math.round(m.height), board: Math.round(s.height), open: !document.querySelector(".nb-wrap > .env").classList.contains("closed")}; });
      const before = await panel();
      ok(!before.open, label + ": the Stickers tray starts closed");
      if (SHOTS) await page.screenshot({path: path.join(SHOTS, label.replace(/ /g, "-") + "-closed.png")});
      await page.evaluate(() => document.querySelector(".nb-wrap > .env .env-head").click());
      await page.waitForTimeout(600);
      const after = await panel();
      ok(after.open, label + ": tapping Stickers opens the tray");
      if (SHOTS) await page.screenshot({path: path.join(SHOTS, label.replace(/ /g, "-") + "-open.png")});
      ok(after.h === before.h && after.top === before.top && after.board === before.board, label + ": the board's panel keeps its size and place with the tray open (" + JSON.stringify(before) + " -> " + JSON.stringify(after) + ")");
      // the bottom of the board can still be scrolled up above the open tray
      const room = await page.evaluate(() => { const m = document.querySelector(".nb-main").getBoundingClientRect(), e = document.querySelector(".nb-wrap > .env").getBoundingClientRect();
        scrollTo(0, document.documentElement.scrollHeight); const m2 = document.querySelector(".nb-main").getBoundingClientRect(); return {reach: Math.round(m2.bottom), trayTop: Math.round(e.top), was: Math.round(m.bottom)}; });
      ok(room.reach <= room.trayTop + 2, label + ": scrolled down, the board's bottom clears the open tray (" + JSON.stringify(room) + ")");
      await page.evaluate(() => scrollTo(0, 0));
      await page.evaluate(() => document.querySelector(".nb-wrap > .env .env-head").click());
      await page.waitForTimeout(600);
      const closed = await panel();
      ok(!closed.open && closed.h === before.h, label + ": closing the tray leaves the panel the same too");
      await ctx.close();
    }
    ok(!errs.length, "no page errors" + (errs.length ? ": " + errs.join(" | ") : ""));
    console.log(n + " passed");
  } finally { await browser.close(); server.close(); }
})().catch(e => { console.error(e); process.exit(1); });
