// Browser test: while the calculator is open, typed keys go to it, not to the page shortcuts (1 to 7 switch pages)
// Run: node tests/calculator-keys.e2e.js
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const root = path.join(__dirname, "..");
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
  const ctx = await browser.newContext({viewport: {width: 1280, height: 860}});
  await ctx.addInitScript(() => { try { if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "1"); localStorage.setItem("coursework:v2", JSON.stringify({v: 2, courses: [], tasks: [], decks: [], notes: [], files: [], events: [], settings: {}, updated: 1})); } } catch (e) {} });
  const page = await ctx.newPage(), errs = [];
  page.on("pageerror", e => errs.push(e.message));
  await page.goto(FILE); await page.waitForTimeout(1200);
  const tab = () => page.evaluate(() => { const b = document.querySelector('nav.tabs .in [data-tab][aria-current="page"], nav.tabs .in [data-tab].on, nav.tabs .in [data-tab][aria-selected="true"]'); return b ? b.dataset.tab : ""; });
  const res = () => page.$eval("#calc .cx-res", el => el.textContent);
  const tab0 = await tab(); ok(!!tab0, "a page is showing (" + tab0 + ")");
  await page.click(".nav-tool.calc-btn"); await page.waitForSelector("#calc:not([hidden])");
  await page.waitForFunction(() => !!window.math);

  // focus somewhere else on the page, then type
  await page.evaluate(() => document.activeElement && document.activeElement.blur && document.activeElement.blur());
  ok(!(await page.evaluate(() => document.getElementById("calc").contains(document.activeElement))), "the focus is outside the calculator");
  await page.keyboard.type("12+3"); await page.keyboard.press("Enter"); await page.waitForTimeout(60);
  ok(await res() === "15", "numbers typed with the focus elsewhere go into the calculator (got " + await res() + ")");
  ok(await tab() === tab0, "and the number keys don't switch pages");

  // clicking the display keeps the keyboard on the calculator
  await page.click("#calc .cx-lcd .cx-expr"); await page.keyboard.press("Escape");
  await page.keyboard.type("2*4"); await page.keyboard.press("Enter"); await page.waitForTimeout(60);
  ok(await res() === "8", "after clicking the display, keys still type (got " + await res() + ")");
  ok(await tab() === tab0, "still on the same page");

  // a text box elsewhere still gets its own typing
  await page.evaluate(() => { const i = document.createElement("input"); i.id = "tmpIn"; i.style.cssText = "position:fixed;left:4px;top:4px;z-index:1"; document.body.appendChild(i); });
  await page.focus("#tmpIn"); await page.keyboard.type("345");
  ok(await page.$eval("#tmpIn", i => i.value) === "345", "typing in a text box still types there");
  ok(await res() === "8", "and leaves the calculator alone");
  await page.evaluate(() => document.getElementById("tmpIn").remove());

  // closed: 1 to 7 switch pages again
  await page.click('#calc [data-cx="close"]'); await page.waitForSelector("#calc", {state: "hidden"});
  await page.evaluate(() => document.activeElement && document.activeElement.blur && document.activeElement.blur());
  await page.keyboard.press("2"); await page.waitForTimeout(200);
  ok(await tab() !== tab0, "with the calculator closed, number keys switch pages again (" + await tab() + ")");

  ok(!errs.length, "no page errors" + (errs.length ? ": " + errs.join("; ") : ""));
  console.log(`\n${n} checks passed`);
  await browser.close(); server.close();
})().catch(async e => { console.error(e); process.exit(1); });
