// Browser test: study streaks are hidden for now (STREAK_HIDDEN in 00-core.js), on computers and phones, even with a streak going
// Run: node tests/streak-hidden.e2e.js
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
const day = off => { const d = new Date(); d.setDate(d.getDate() + off); d.setHours(12, 0, 0, 0); return d; };
const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
(async () => {
  await new Promise(r => server.listen(0, r)); const url = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  // a task finished on each of the last five days, the gentle streak on, and the older streak counter at 5
  const tasks = {}; for (let i = 0; i < 6; i++) { const d = day(-i); tasks["t" + i] = {id: "t" + i, title: "Read chapter " + (i + 1), type: "Reading", due: iso(d), start: iso(d), status: i ? "done" : "todo", doneAt: i ? d.getTime() : 0, created: day(-10).getTime(), priority: "med"}; }
  const seed = {v: 2, updated: 1, courses: [], tasks: Object.values(tasks), decks: [], notes: [], files: [], events: [], settings: {gentle: {on: true, intro: true}, streak: {cur: 5, best: 5, last: iso(day(-1))}}};
  try {
    for (const [name, vp] of [["desktop", {viewport: {width: 1300, height: 900}}], ["phone", {viewport: {width: 390, height: 844}, isMobile: true, hasTouch: true}]]) {
      const ctx = await browser.newContext(vp);
      await ctx.addInitScript(s => { try { localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "1"); localStorage.setItem("coursework:v2", JSON.stringify(s)); } catch (e) {} }, seed);
      const page = await ctx.newPage(), errs = []; page.on("pageerror", e => errs.push(e.message));
      await page.goto(url); await page.waitForFunction(() => window.SBSTREAK); await page.waitForTimeout(1500);
      ok(await page.evaluate(() => !document.querySelector(".fgs-strip, .fgs-intro, .fgs-chip")), `${name}: no streak strip on the Board`);
      ok(await page.evaluate(() => !document.querySelector(".streak-chip")), `${name}: no streak chip by the date`);
      ok(await page.evaluate(() => !window.SBSTREAK.on()), `${name}: the streak reads as off everywhere it's asked`);
      ok(await page.evaluate(() => window.SBSTREAK.studyDays(new Date(Date.now() - 9 * 864e5).toISOString().slice(0, 10)).length >= 4), `${name}: study days are still counted, ready for when streaks come back`);
      // Settings: no Gentle Study Streak entry; Today's Quote without a streak
      await page.evaluate(() => { const b = document.createElement("button"); b.dataset.act = "menu"; b.hidden = true; document.body.appendChild(b); b.click(); }); await page.waitForTimeout(600);
      const menu = await page.evaluate(() => (document.querySelector("dialog[open]") || {}).innerHTML || "");
      ok(!/data-act="fgs-open"/.test(menu) && !/Gentle Study Streak/.test(menu), `${name}: Settings has no Gentle Study Streak entry`);
      ok(!/Quote and Streak/.test(menu) && !/day streak/.test(menu), `${name}: Settings mentions no streak`);
      await page.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close())); await page.waitForTimeout(300);
      await page.evaluate(() => { const b = document.createElement("button"); b.dataset.act = "daily-quote"; b.hidden = true; document.body.appendChild(b); b.click(); }); await page.waitForTimeout(600);
      ok(await page.evaluate(() => !document.querySelector(".qod-streak") && !/day streak/.test(document.body.innerText)), `${name}: today's quote shows no streak`);
      ok(!errs.length, `${name}: no page errors ${errs.join(" | ")}`);
      await ctx.close();
    }
    console.log(`streak-hidden.e2e: ${n} checks passed`);
  } finally { await browser.close(); server.close(); }
})().catch(e => { console.error(e); process.exit(1); });
