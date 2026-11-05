// Browser test: the calculator's "select an equation on screen" button (99-calc-snip.js) and solving what it brings in
// Run: node tests/calc-snip.e2e.js
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const root = path.join(__dirname, "..");
const MIME = {".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".css": "text/css", ".woff2": "font/woff2", ".png": "image/png", ".svg": "image/svg+xml", ".webp": "image/webp", ".ico": "image/x-icon"};
const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x"); let p = decodeURIComponent(u.pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  res.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
const gem = text => ({status: 200, contentType: "application/json", body: JSON.stringify({candidates: [{content: {parts: [{text}]}, finishReason: "STOP"}]})});
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  const mk = async ai => {
    const ctx = await browser.newContext({viewport: {width: 1280, height: 860}, serviceWorkers: "block"}); ctx.sent = [];
    await ctx.route(/generativelanguage\.googleapis\.com/, route => {
      const body = route.request().postData() || ""; ctx.sent.push(body);
      route.fulfill(gem(/inline_data/.test(body) ? JSON.stringify({found: true, calc: "3(4+1)", angle: "none"}) : /speed of a train/.test(body) ? JSON.stringify({found: true, calc: "60t = 150", angle: "none"}) : JSON.stringify({found: false, calc: "", angle: "none"})));
    });
    await ctx.addInitScript(ai => { try { if (!localStorage.getItem("coursework:v2")) {
      localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "done"); localStorage.setItem("studioso:welcomed", "1");
      localStorage.setItem("coursework:v2", JSON.stringify({v: 2, courses: [], tasks: [], decks: [], notes: [], files: [], events: [], settings: {}, updated: 1}));
      if (ai) { localStorage.setItem("studyboard:aiKeys", JSON.stringify({gemini: "AIzaTESTTESTTESTTESTTESTTEST12345"})); localStorage.setItem("studyboard:aiConsent", JSON.stringify({gemini: {v: 1, at: 1}})); }
    } } catch (e) {} }, ai);
    const page = await ctx.newPage(); page.errs = []; page.ctx = ctx;
    page.on("pageerror", e => page.errs.push(e.message)); page.on("console", m => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) page.errs.push(m.text()); });
    await page.goto(base); await page.waitForFunction(() => window.SBCALC && window.SBCALCSNIP); await page.waitForTimeout(600);
    // a sheet of math to select from, over the app
    await page.evaluate(() => {
      const d = document.createElement("div"); d.id = "mathsheet";
      d.style.cssText = "position:fixed;left:40px;top:120px;width:520px;padding:16px;background:#fff;color:#000;font:20px/1.6 sans-serif;z-index:50";
      d.innerHTML = `<p><span id="q1">x² − 5x + 6 = 0</span></p><p id="q2">Solve for x: 2x + 3 = 11.</p>
        <p id="q3"><span class="mth" data-tex="\\frac{1}{2}+\\sqrt{16}">½+√16</span></p>
        <div id="q4"><div>2x + y = 5</div><div>x − y = 1</div></div>
        <p id="q5">The answer is 12 × (3 + 4) and that's all</p><p id="q7">A speed of a train is 60 km/h; how long to go 150 km?</p>`;
      document.body.appendChild(d);
      const c = document.createElement("canvas"); c.width = 200; c.height = 80; const g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, 200, 80); g.fillStyle = "#000"; g.font = "40px serif"; g.fillText("3(4+1)", 20, 55);
      const im = document.createElement("img"); im.id = "q6"; im.src = c.toDataURL(); im.style.cssText = "position:fixed;left:640px;top:140px;width:200px;height:80px;z-index:50"; document.body.appendChild(im);
    });
    await page.click(".nav-tool.calc-btn"); await page.waitForSelector("#calc:not([hidden])"); await page.waitForFunction(() => !!window.math);
    return page;
  };
  const snip = async (page, sel, frac) => {
    await page.click('#calc [data-cx="snip"]'); await page.waitForSelector(".cxs-veil");
    ok(await page.$eval("#calc", el => getComputedStyle(el).visibility) === "hidden", "the calculator steps aside while you select");
    const b = await page.locator(sel).boundingBox(), w = b.width * (frac || 1);
    await page.mouse.move(b.x - 4, b.y - 3); await page.mouse.down(); await page.mouse.move(b.x + w / 2, b.y + b.height / 2, {steps: 3}); await page.mouse.move(b.x + w + 4, b.y + b.height + 3, {steps: 3}); await page.mouse.up();
    await page.waitForFunction(() => !document.querySelector(".cxs-veil")); await page.waitForTimeout(150);
    await page.waitForFunction(() => document.querySelector("#calc .cx-res").textContent !== "Reading…", null, {timeout: 15000});
  };
  const expr = page => page.$eval("#calc .cx-expr", el => el.textContent);
  const solve = async page => { await page.click('#calc [data-cx="eq"]'); await page.waitForTimeout(400); return page.$eval("#calc .cx-res", el => el.textContent); };

  // Without AI: text and the app's own math are read on the device
  { const page = await mk(false);
    await snip(page, "#q1"); ok(/x²|x\^/.test(await expr(page)) && /=/.test(await expr(page)), `a typed quadratic is brought in: ${await expr(page)}`);
    ok(await solve(page) === "x = 2, 3", "and = solves it: x = 2, 3");
    await snip(page, "#q2"); ok(await solve(page) === "x = 4", `the equation is picked out of a sentence without AI: ${await expr(page)}`);
    await snip(page, "#q3"); ok(await solve(page) === "4.5", `formulas the app drew (KaTeX TeX) come in exactly: ${await expr(page)} = 4.5`); ok(await expr(page) === "(1÷2)+√(16)", "and read cleanly");
    await snip(page, "#q4"); ok(await solve(page) === "x = 2, y = 1", `two equations on two lines are solved together: ${await expr(page)}`);
    await snip(page, "#q5"); ok(await solve(page) === "84", `just the math is taken from a line of text: ${await expr(page)}`);
    // part of a line: only what's inside the box
    await snip(page, "#q1", 0.5); ok(!/=/.test(await expr(page)) && /^x²−5x?$/.test(await expr(page)), `a box over part of a line takes only that part: "${await expr(page)}"`);
    // Esc cancels
    const before = await expr(page);
    await page.click('#calc [data-cx="snip"]'); await page.waitForSelector(".cxs-veil"); await page.keyboard.press("Escape");
    await page.waitForFunction(() => !document.querySelector(".cxs-veil"));
    ok(await page.$eval("#calc", el => getComputedStyle(el).visibility) === "visible" && await expr(page) === before, "Esc cancels and leaves the calculator as it was");
    // a picture without AI: says how to read it
    await snip(page, "#q6");
    ok(await page.locator(".toast", {hasText: "Turn on AI"}).count() > 0, "a picture without AI says to turn on AI");
    ok(page.ctx.sent.length === 0, "nothing was sent anywhere without AI");
    ok(!page.errs.length, "no errors: " + page.errs.join("; "));
    await page.context().close(); }

  // With AI: pictures and word problems
  { const page = await mk(true);
    await snip(page, "#q6");
    ok(page.ctx.sent.some(b => /inline_data/.test(b) && /image\/jpeg/.test(b)), "a picture is sent to the AI as an image");
    ok(await solve(page) === "15", `the AI's reading of the picture is typed in and solved: ${await expr(page)} = 15`);
    await snip(page, "#q7"); ok(await solve(page) === "t = 2.5", `a word problem becomes its equation: ${await expr(page)} → t = 2.5`);
    const sentBefore = page.ctx.sent.length; await snip(page, "#q1");
    ok(page.ctx.sent.length === sentBefore && await solve(page) === "x = 2, 3", "clear math is still read on the device, without asking the AI");
    ok(!page.errs.length, "no errors: " + page.errs.join("; "));
    await page.context().close(); }

  // Solving, straight from text
  { const page = await mk(false);
    const cases = [["x^2 + 1 = 0", "No real solution"], ["sin(x) = 0.5", "x = 30, 150 (0–360°)"], ["integrate(x^2, x, 0, 3)", "9"], ["deriv(x^3, x, 2)", "12"],
      ["sum(n^2, n, 1, 10)", "385"], ["log(8, 2)", "3"], ["y = 2x + 1", "Two unknowns: add an equation"], ["x^2 + y^2 = 25; x - y = 1", "x = −3, y = −4  or  x = 4, y = 3"], ["2 + 2 = 5", "False"]];
    for (const [q, want] of cases) { await page.evaluate(q => SBCALC.put(q), q); const got = await solve(page); ok(got === want || (q.startsWith("x^2 + y") && /x = 4, y = 3/.test(got) && /x = −3, y = −4/.test(got)), `${q} → ${want} (got ${got})`); }
    await page.evaluate(() => SBCALC.put("2x = 1")); await solve(page); await page.click('#calc [data-cx="sd"]'); await page.waitForTimeout(80);
    ok(await page.$eval("#calc .cx-res", el => el.textContent) === "x = 0.5", "S⇔D leaves a solution as it is");
    await page.click('#calc [data-cx="add"]'); await page.click('#calc [data-cx="1"]'); ok(await solve(page) === "1.5", "the answer carries on as Ans (0.5 + 1)");
    ok(!page.errs.length, "no errors: " + page.errs.join("; "));
    await page.context().close(); }

  await browser.close(); server.close();
  console.log(`calc-snip.e2e: ${n} checks passed`);
})().catch(e => { console.error("FAIL:", e && e.stack || e); process.exit(1); });
