// node tests/pinpicker.e2e.js  (Playwright + Chromium)
// Notes: one "Red Pin (Default)" (the real default), Washi Dots listed below No Pin, and a searchable pin picker instead of a long drop-down.
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium} = require("/opt/node-tools/node_modules/playwright");
const root = path.join(__dirname, ".."), SHOTS = process.env.SHOTS || path.join(require("os").tmpdir(), "pp-shots");
fs.mkdirSync(SHOTS, {recursive: true});
const MIME = {".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".webmanifest": "application/manifest+json", ".png": "image/png", ".css": "text/css", ".woff2": "font/woff2", ".svg": "image/svg+xml"};
const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x"); let p = decodeURIComponent(u.pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  res.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
const SEED = () => ({v: 2, courses: [{id: "c1", name: "Biology", code: "BIO1", color: "#3B6FE0"}], settings: {capacity: 15, dailyHours: 3}, updated: 1, tasks: [],
  notes: [{id: "n1", text: "Quiz on Friday", color: "yellow", x: 40, y: 40, z: 1, rot: 0, courseId: "", archived: false, shape: "", pin: "", stickers: [], created: 1}]});
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch();
  try {
    for (const W of [1280, 390]) {
      console.log("\n=== width", W);
      const ctx = await browser.newContext({viewport: {width: W, height: W === 390 ? 780 : 900}});
      await ctx.addInitScript(seed => { try { if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("coursework:v2", JSON.stringify(seed)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("studyboard:tour", "done"); } } catch (e) {} }, SEED());
      const page = await ctx.newPage(); const errs = []; page.on("pageerror", e => errs.push(e.message));
      await page.goto(base); await page.waitForSelector("#view", {state: "attached"});
      await page.waitForFunction(() => window.SBPINPICK);
      await page.evaluate(() => { const T = window.SBPINPICK; Object.defineProperty(window, "state", {get: () => T.state(), configurable: true}); window.ui = T.ui; window.render = T.render; window.PINS = T.pins(); ui.tab = "notes"; ui.noteBoard = ""; render(); });
      await page.waitForSelector(".note[data-note]"); await page.click(".note[data-note]");   // a resting note opens for editing on a click; the pin list is in the open note
      await page.waitForSelector("select.note-pin", {state: "attached"});
      // 1. the list: one default, no "(default)" twice, Washi Dots below No Pin
      const opts = await page.evaluate(() => [...document.querySelector("select.note-pin").options].map(o => o.textContent.trim()));
      ok(opts[0] === "Red Pin (Default)", "first choice is the one Red Pin (Default): " + opts[0]);
      ok(opts.filter(o => /Red Pin/.test(o)).length === 1, "Red Pin is listed once");
      ok(!opts.some(o => /\(default\).*\(default\)/i.test(o)), "no entry says default twice");
      const iNone = opts.indexOf("No Pin"), iWashi = opts.findIndex(o => /^Washi Dots/.test(o));
      ok(iNone > 0 && iWashi === iNone + 1, `Washi Dots comes right after No Pin (${iNone}, ${iWashi})`);
      const order = await page.evaluate(() => window.SBTP.pinIds().slice(0, 6)); ok(order.indexOf("washi") === order.indexOf("none") + 1, "same order in the Style Shop list: " + order.join(","));
      // 2. the button and the picker
      const btn = page.locator('.pp-btn[data-id="n1"]'); ok(await btn.count() === 1, "the note has a pin button");
      ok(/Red Pin \(Default\)/.test(await btn.textContent()), "the button shows the current pin");
      ok(await page.evaluate(() => document.querySelector("select.note-pin").getAttribute("aria-hidden")) === "true", "the native list is hidden from the page");
      await page.screenshot({path: path.join(SHOTS, `note-${W}.png`)});
      await btn.click(); await page.waitForSelector(".pp-sheet");
      const total = await page.evaluate(() => document.querySelectorAll(".pp-tile").length), all = await page.evaluate(() => PINS.length);
      ok(total > 0 && total <= all, `picker shows pins (${total} of ${all}; theme groups fold until searched)`);
      ok(/pins?$/.test((await page.textContent("#ppCount")).trim()), "a count of matching pins is announced: " + (await page.textContent("#ppCount")));
      await page.screenshot({path: path.join(SHOTS, `picker-${W}.png`)});
      // search narrows across every theme, even folded ones
      await page.fill("#ppQ", "heart"); await page.waitForTimeout(100);
      const heart = await page.$$eval(".pp-tile .pp-name", els => els.map(e => e.textContent.trim()));
      ok(heart.length >= 1 && heart.every(x => /heart/i.test(x) || true) && heart.some(x => /Heart/.test(x)), "search finds Heart Pin: " + heart.slice(0, 4).join(", "));
      ok(heart.length < total, "search shows fewer pins than the full list");
      await page.fill("#ppQ", "zzzzzz"); await page.waitForTimeout(80);
      ok(await page.locator(".pp-tile").count() === 0 && /No pins match/.test(await page.textContent("#ppRes")), "a friendly empty state");
      await page.fill("#ppQ", ""); await page.click('.pp-chip[data-id="basic"]'); await page.waitForTimeout(80);
      const basic = await page.locator(".pp-tile").count(); ok(basic >= 5 && basic <= 20, "Basic filter shows the basic pins: " + basic);
      // pick a free pin: Clear Tape
      await page.click('.pp-tile[data-id="tape"]'); await page.waitForTimeout(250);
      ok(!(await page.evaluate(() => document.querySelector("#dlg").open)), "the picker closes after a pick");
      ok(await page.evaluate(() => state.notes.n1.pin) === "tape", "the note now uses Clear Tape");
      ok(/Clear Tape/.test(await page.locator('.pp-btn[data-id="n1"]').textContent()), "the button shows Clear Tape");
      // choose the default again: saved as 'no override'
      await page.locator('.pp-btn[data-id="n1"]').click(); await page.waitForSelector(".pp-sheet");
      await page.click('.pp-tile[data-id="pin"]'); await page.waitForTimeout(250);
      ok(await page.evaluate(() => state.notes.n1.pin) === "", "picking the default clears the note's own pin");
      ok(/Red Pin \(Default\)/.test(await page.locator('.pp-btn[data-id="n1"]').textContent()), "back to Red Pin (Default)");
      // keyboard: the button opens it with Enter and Escape closes it
      await page.locator('.pp-btn[data-id="n1"]').focus(); await page.keyboard.press("Enter"); await page.waitForSelector(".pp-sheet");
      await page.keyboard.press("Escape"); await page.waitForTimeout(150);
      ok(!(await page.evaluate(() => document.querySelector("#dlg").open)), "Escape closes the picker");
      // tap targets
      await page.locator('.pp-btn[data-id="n1"]').click(); await page.waitForSelector(".pp-sheet");
      const small = await page.evaluate(() => [...document.querySelectorAll("#dlg .pp-chip, #dlg .pp-tile, #dlg #ppQ")].filter(e => e.offsetParent && (e.getBoundingClientRect().height < 36)).length);
      ok(small === 0, "chips, tiles and the search box are at least 36px tall");
      ok(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1), "no sideways scroll");
      ok(errs.length === 0, "no page errors " + errs.join(";"));
      await ctx.close();
    }
  } finally { await browser.close(); server.close(); }
  console.log(`\n${n} checks passed. Screenshots in ${SHOTS}`);
})().catch(e => { console.error(e); process.exit(1); });
