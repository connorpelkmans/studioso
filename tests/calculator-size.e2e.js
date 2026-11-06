// Browser test: the calculator's size (corner grip, arrow keys, double-click for normal size, kept on this device)
// Run: node tests/calculator-size.e2e.js
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const root = path.join(__dirname, "..");
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const MIME = {".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".webp": "image/webp", ".json": "application/json", ".woff2": "font/woff2"};
const srv = http.createServer((q, r) => { let p = decodeURIComponent(new URL(q.url, "http://x").pathname); if (p === "/") p = "/index.html"; const f = path.join(root, p); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); r.end(); return; } r.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(r); });
(async () => {
  await new Promise(r => srv.listen(0, r)); const b = await chromium.launch({executablePath});
  const c = await b.newContext({viewport: {width: 1300, height: 900}, colorScheme: "dark", deviceScaleFactor: 1});
  await c.addInitScript(() => { if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("studioso:theme", "dark"); localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "1"); localStorage.setItem("coursework:v2", JSON.stringify({v: 2, courses: [], tasks: [], decks: [], notes: [], files: [], events: [], settings: {}, updated: 1})); } });
  const pg = await c.newPage(); const errs = []; pg.on("pageerror", e => errs.push(e.message));
  const url = `http://localhost:${srv.address().port}/`;
  await pg.goto(url); await pg.waitForTimeout(1200);
  const open = async () => { await pg.click(".nav-tool.calc-btn"); await pg.waitForSelector("#calc:not([hidden])"); await pg.waitForTimeout(300); };
  await open();
  const box = () => pg.evaluate(() => { const r = document.getElementById("calc").getBoundingClientRect(); return {x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height), k: getComputedStyle(document.getElementById("calc")).getPropertyValue("--cx-k")}; });
  const b0 = await box();
  const g = await (await pg.$(".cx-grip")).boundingBox();
  await pg.mouse.move(g.x + g.width / 2, g.y + g.height / 2); await pg.mouse.down();
  await pg.mouse.move(g.x - 80, g.y - 150, {steps: 8}); await pg.mouse.up(); await pg.waitForTimeout(200);
  const b1 = await box();
  ok(b1.w < b0.w * 0.8 && b1.x === b0.x && b1.y === b0.y, "dragging the corner grip makes it smaller, keeping its top-left corner: " + JSON.stringify(b1));
  ok(await pg.evaluate(() => { const g = document.querySelector(".cx-grip").getBoundingClientRect(), e = document.querySelector('#calc [data-cx="eq"]').getBoundingClientRect(); return g.top >= e.bottom - 1; }), "the grip sits below the keys, clear of =");
  await pg.keyboard.type("12+3"); await pg.keyboard.press("Enter"); await pg.waitForTimeout(150);
  ok(await pg.$eval("#calc .cx-res", e => e.textContent) === "15", "the smaller calculator still takes typing");
  // keys inside the smaller calculator are still clickable where they're drawn
  await pg.click('#calc [data-cx="ac"]'); await pg.click('#calc [data-cx="7"]'); await pg.click('#calc [data-cx="mul"]'); await pg.click('#calc [data-cx="6"]'); await pg.click('#calc [data-cx="eq"]'); await pg.waitForTimeout(100);
  ok(await pg.$eval("#calc .cx-res", e => e.textContent) === "42", "and its keys can be clicked where they're drawn");
  await pg.reload(); await pg.waitForTimeout(1200); await open();
  ok((await box()).w === b1.w, "the size is kept after a reload");
  await pg.focus(".cx-grip"); await pg.keyboard.press("ArrowUp"); await pg.keyboard.press("ArrowUp");
  ok((await box()).w > b1.w + 20, "arrow keys on the grip make it bigger");
  await pg.dblclick(".cx-grip"); await pg.waitForTimeout(100);
  ok((await box()).w === b0.w && await pg.evaluate(() => localStorage.getItem("studyboard:calcSize")) === null, "double-click goes back to normal size");
  ok(!errs.length, "no page errors " + errs.join(" | "));
  console.log(`calculator-size.e2e: ${n} checks passed`);
  await b.close(); srv.close();
})().catch(e => { console.error(e); process.exit(1); });
