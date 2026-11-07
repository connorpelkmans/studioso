// Browser test (phone): turning the phone between upright and sideways doesn't move or resize the notes on the board
// (a phone on its side is wider than 700px; the notes used to lose their phone size and jump each time it turned)
// Run: node tests/notes-rotate.e2e.js
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
const NOTES = [[30, 20, "Fix companion"], [290, 20, "Remove tint"], [700, 20, "Give ability"], [30, 190, "Change crunch"], [420, 450, "Empty A"], [30, 560, "Empty B"]];
(async () => {
  await new Promise(r => server.listen(0, r)); const url = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  try {
    const ctx = await browser.newContext({viewport: {width: 390, height: 844}, isMobile: true, hasTouch: true});
    await ctx.addInitScript(n => { try { localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "1"); localStorage.setItem("studyboard:noteZoom", "0.59");
      localStorage.setItem("coursework:v2", JSON.stringify({v: 2, courses: [], tasks: [], decks: [], files: [], events: [], settings: {}, updated: 1, notes: n.map((x, i) => ({id: "n" + i, text: x[2], color: "yellow", x: x[0], y: x[1], z: i + 1}))})); } catch (e) {} }, NOTES);
    const page = await ctx.newPage(), errs = []; page.on("pageerror", e => errs.push(e.message));
    await page.goto(url); await page.waitForTimeout(1500);
    await page.click('nav.tabs [data-tab="notes"]'); await page.waitForTimeout(800);
    const where = () => page.evaluate(() => { const sc = document.getElementById("nbScroll"), s = sc.getBoundingClientRect(), o = {};
      document.querySelectorAll(".note[data-note]").forEach(n => { const q = n.getBoundingClientRect(); o[n.dataset.note] = [Math.round(q.left - s.left + sc.scrollLeft), Math.round(q.top - s.top + sc.scrollTop), Math.round(q.width)]; }); return o; });
    const saved = () => page.evaluate(() => JSON.stringify(JSON.parse(localStorage.getItem("coursework:v2")).notes.map(n => [n.id, n.x, n.y])));
    const up = await where(), s0 = await saved();
    await page.setViewportSize({width: 844, height: 390}); await page.waitForTimeout(900);
    const side = await where();
    ok(Object.keys(up).every(k => Math.abs(up[k][0] - side[k][0]) <= 1 && Math.abs(up[k][1] - side[k][1]) <= 1 && Math.abs(up[k][2] - side[k][2]) <= 1), "turned sideways, every note stays in the same place at the same size: " + JSON.stringify({up: up.n0, side: side.n0}));
    await page.setViewportSize({width: 390, height: 844}); await page.waitForTimeout(900);
    const back = await where();
    ok(Object.keys(up).every(k => up[k].join() === back[k].join()), "turned back upright, nothing has moved");
    ok(await saved() === s0, "and no note's saved position changed");
    ok(!errs.length, "no page errors " + errs.join(" | "));
    console.log(`notes-rotate.e2e: ${n} checks passed`);
  } finally { await browser.close(); server.close(); }
})().catch(e => { console.error(e); process.exit(1); });
