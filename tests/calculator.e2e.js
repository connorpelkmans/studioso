// Browser test: the calculator (sidebar button, keys, math.js answers, SHIFT, memory, fractions, errors, keyboard)
// Run: node tests/calculator.e2e.js [screenshot folder]
// Served over http (not file://) because math.js is loaded with an integrity check, as on the real site
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const root = path.join(__dirname, ".."), SHOTS = process.argv[2] || "";
const MIME = {".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".css": "text/css", ".woff2": "font/woff2", ".png": "image/png", ".svg": "image/svg+xml", ".webp": "image/webp"};
const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x"); let p = decodeURIComponent(u.pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  res.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
(async () => {
  await new Promise(r => server.listen(0, r)); const FILE = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  const ctx = await browser.newContext({viewport: {width: 1280, height: 860}, deviceScaleFactor: SHOTS ? 2 : 1});
  await ctx.addInitScript(() => { try { if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "1"); localStorage.setItem("coursework:v2", JSON.stringify({v: 2, courses: [], tasks: [], decks: [], notes: [], files: [], events: [], settings: {}, updated: 1})); } } catch (e) {} });
  const page = await ctx.newPage(), errs = [];
  page.on("pageerror", e => errs.push(e.message));
  await page.goto(FILE); await page.waitForTimeout(1200);
  ok(await page.locator('.nav-tool.theme-btn').count() === 0 && await page.locator('.nav-tool.calc-btn:visible').count() === 1, "the sidebar has a Calculator button instead of Light/Dark");
  await page.click(".nav-tool.calc-btn"); await page.waitForSelector("#calc:not([hidden])");
  { const b = await page.locator("#calc").boundingBox(), cx = b.x + b.width / 2, cy = b.y + b.height / 2;
    ok(Math.abs(cx - 640) < 10 && Math.abs(cy - 430) < 12, `it opens in the middle of the screen (${Math.round(cx)}, ${Math.round(cy)})`); }
  await page.waitForFunction(() => !!window.math);
  const keys = async (...ks) => { for (const k of ks) await page.click(`#calc [data-cx="${k}"]`); };
  const res = () => page.$eval("#calc .cx-res", el => el.textContent);
  const expr = () => page.$eval("#calc .cx-expr", el => el.textContent);
  const calc = async (ks, want, m) => { await keys("ac", ...ks, "eq"); await page.waitForTimeout(30); const r = await res(); ok(r === want, `${m || await expr()} = ${want} (got ${r})`); };
  await calc(["1", "2", "add", "7", "mul", "3"], "33", "12 + 7 × 3 follows the order of operations");
  await calc(["0", "dot", "1", "add", "0", "dot", "2"], "0.3", "0.1 + 0.2 shows 0.3");
  await calc(["lp", "2", "add", "3", "rp", "sq"], "25");
  await calc(["sin", "3", "0"], "0.5", "sin 30 in degrees");
  await calc(["cos", "9", "0"], "0", "cos 90 is exactly 0");
  await calc(["tan", "9", "0"], "Math ERROR", "tan 90 is a Math ERROR");
  await calc(["shift", "sin", "0", "dot", "5"], "30", "SHIFT sin is sin⁻¹");
  await calc(["5", "ncr", "2"], "10", "5 nCr 2");
  await calc(["shift", "ncr", "5", "2"].slice(0, 0).concat(["5", "shift", "ncr", "2"]), "20", "5 nPr 2");
  await calc(["3", "shift", "pow", "8"], "2", "3 ʸ√ 8");
  await calc(["5", "shift", "inv"], "120", "5!");
  await calc(["log", "1", "0", "0", "0"], "3");
  await calc(["2", "pow", "1", "0"], "1024");
  await calc(["2", "0", "0", "add", "1", "0", "pct"], "220", "200 + 10% adds ten percent");
  await calc(["1", "div", "0"], "Math ERROR");
  await calc(["2", "mul", "mul", "3"], "Syntax ERROR");
  await calc(["9", "9", "9", "9", "9", "mul", "9", "9", "9", "9", "9", "9"], "9.99989×10¹⁰", "big answers in ×10ⁿ");
  await calc(["1", "dot", "5", "exp", "neg", "3"], "0.0015", "×10ˣ with a negative power");
  await calc(["lp", "2", "add", "3"], "5", "open brackets close themselves at =");
  // carry on from Ans; S⇔D
  await keys("ac", "3", "div", "4", "eq", "mul", "2", "eq");
  ok(await res() === "1.5" && /^Ans×2$/.test(await expr()), "an operator after = carries on from Ans");
  await keys("sd"); ok(await res() === "3⁄2", "S⇔D shows the answer as a fraction");
  await keys("sd"); ok(await res() === "1.5", "and back");
  // memory
  await keys("ac", "5", "mplus", "ac", "2", "mplus", "ac", "mr", "mul", "2", "eq");
  ok(await res() === "14" && await page.$eval('#calc [data-i="m"]', el => el.classList.contains("on")), "M+ adds to memory, MR recalls it");
  await keys("shift", "mr"); ok(!(await page.$eval('#calc [data-i="m"]', el => el.classList.contains("on"))), "SHIFT MR clears memory");
  // radians
  await keys("drg"); ok(await page.$eval('#calc [data-i="ang"]', el => el.textContent) === "RAD", "DRG switches to radians");
  await calc(["sin", "pi"], "0", "sin π in radians is exactly 0");
  await keys("drg", "drg");
  // editing: ◀ DEL inserts in the middle
  await keys("ac", "1", "2", "3", "left", "del", "eq"); ok(await res() === "13", "◀ and DEL edit the middle of the expression");
  // keyboard
  await page.keyboard.press("Escape"); await page.keyboard.type("(4+6)/4"); await page.keyboard.press("Enter");
  ok(await res() === "2.5", "typing on the keyboard works");
  await page.keyboard.press("ArrowUp"); await page.keyboard.press("ArrowUp");
  ok(await res() === "13", "↑ brings back earlier calculations");
  await keys("ac", "7", "mul", "8", "eq");
  if (SHOTS) {
    await page.screenshot({path: path.join(SHOTS, "calc-desktop.png")});
    await keys("ac", "shift", "sin", "0", "dot", "5", "rp", "add", "shift");
    await page.locator("#calc").screenshot({path: path.join(SHOTS, "calc-shift.png")});
    await keys("shift");
  }
  await page.keyboard.press("Escape"); await page.keyboard.press("Escape");
  ok(await page.locator("#calc[hidden]").count() === 1, "Escape clears, then closes");
  ok(!errs.length, "no page errors: " + errs.join(" | "));
  // phone
  await page.setViewportSize({width: 390, height: 844});
  await page.evaluate(() => window.SBCALC.open()); await page.waitForTimeout(300);
  const box = await page.locator("#calc").boundingBox();
  ok(box && box.x >= 0 && box.x + box.width <= 390 && box.y + box.height <= 844, "on a phone it fits on screen");
  await keys("ac", "1", "2", "dot", "5", "mul", "8", "eq");
  if (SHOTS) await page.screenshot({path: path.join(SHOTS, "calc-phone.png")});
  await browser.close(); server.close();
  console.log(`calculator.e2e.js: ${n} checks passed`);
})().catch(e => { console.error(e); server.close(); process.exit(1); });
