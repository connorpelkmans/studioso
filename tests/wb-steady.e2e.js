// node tests/wb-steady.e2e.js: on a phone the whiteboard keeps a steady size. The screen's height twitching (toolbars, the
// keyboard coming and going) doesn't resize the board back and forth, and its drawing surfaces are never rebuilt for a
// smaller size (rebuilding them over and over could run the phone out of memory and make iOS restart the app).
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const root = path.join(__dirname, "..");
const MIME = {".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".css": "text/css", ".png": "image/png", ".svg": "image/svg+xml", ".woff2": "font/woff2"};
const server = http.createServer((req, res) => { let p = decodeURIComponent(new URL(req.url, "http://x").pathname); if (p === "/") p = "/index.html"; const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; } res.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res); });
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const SEED = {v: 2, courses: [], tasks: [], decks: [], files: [], events: [], settings: {}, updated: 1, notes: [{id: "w1", text: "Board", wb: {v: 1, tpl: "cornell", pa: 1.6}, courseId: "", board: "", created: 1, updated: 1}]};
(async () => {
  await new Promise(r => server.listen(0, r));
  const b = await chromium.launch({executablePath});
  try {
    const ctx = await b.newContext({viewport: {width: 402, height: 874}, isMobile: true, hasTouch: true, deviceScaleFactor: 2});
    await ctx.addInitScript(seed => { window.__SB_TEST = true; try { localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "1"); localStorage.setItem("studyboard:notesView", "wb"); localStorage.setItem("studyboard:wbCur", "w1"); if (!localStorage.getItem("coursework:v2")) localStorage.setItem("coursework:v2", JSON.stringify(seed)); } catch (e) {} }, SEED);
    const page = await ctx.newPage(); const errs = []; page.on("pageerror", e => errs.push(e.message));
    await page.goto("http://localhost:" + server.address().port + "/"); await page.waitForSelector("#view", {state: "attached"}); await page.waitForTimeout(1200);
    await page.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
    await page.tap('nav.tabs [data-tab="notes"]'); await page.waitForSelector(".wb-stage .wb-frame"); await page.waitForTimeout(600);
    // count every time a drawing surface is given a new size
    await page.evaluate(() => { window.__alloc = 0; document.querySelectorAll(".wb-cv").forEach(c => { const d = Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype, "width"); Object.defineProperty(c, "width", {configurable: true, get(){ return d.get.call(this); }, set(v){ if (v !== d.get.call(this)) window.__alloc++; d.set.call(this, v); }}); }); });
    const h0 = await page.evaluate(() => Math.round(document.getElementById("wbHost").getBoundingClientRect().height));
    const hs = [];
    for (const hgt of [840, 874, 800, 874, 860, 874, 538, 874]) { await page.evaluate(kb => { document.documentElement.classList.add("kb-native"); document.documentElement.classList.toggle("kb-open", kb); }, hgt === 538); await page.setViewportSize({width: 402, height: hgt}); await page.waitForTimeout(150); hs.push(await page.evaluate(() => Math.round(document.getElementById("wbHost").getBoundingClientRect().height))); }
    ok(hs.every(h => h === h0), "the board's height holds steady while the screen height twitches: " + h0 + " -> " + hs.join(", "));
    ok(await page.evaluate(() => window.__alloc) === 0, "its drawing surfaces were never rebuilt (" + await page.evaluate(() => window.__alloc) + " times)");
    await page.setViewportSize({width: 874, height: 402}); await page.waitForTimeout(400); await page.setViewportSize({width: 402, height: 874}); await page.waitForTimeout(400);
    ok(await page.evaluate(() => { const f = document.querySelector(".wb-frame").getBoundingClientRect(), c = document.querySelector(".wb-cv").getBoundingClientRect(); return c.width >= f.width - 1 && c.height >= f.height - 1; }), "after turning the phone and back, the drawing surface still covers the whole board");
    ok(!errs.length, "no page errors " + errs.join(" | "));
    console.log("\nwb-steady.e2e: " + n + " checks passed");
  } finally { await b.close(); server.close(); }
})().catch(e => { console.error(e); process.exit(1); });
