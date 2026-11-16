// node tests/any-color.e2e.js (Playwright + Chromium): picking any course or note color is Pro; the set colors stay free
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const root = path.join(__dirname, "..");
const MIME = {".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".webmanifest": "application/manifest+json", ".png": "image/png", ".css": "text/css", ".svg": "image/svg+xml", ".woff2": "font/woff2"};
const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x"); let p = decodeURIComponent(u.pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  res.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  try {
    const ctx = await browser.newContext({serviceWorkers: "block", viewport: {width: 1200, height: 900}});
    await ctx.addInitScript(() => { window.__SB_TEST = true; try { localStorage.setItem("studyboard:paywall-test", "1"); localStorage.setItem("sb:onboarded", "1"); } catch (e) {} });
    const page = await ctx.newPage(); const errs = []; page.on("pageerror", e => errs.push(e.message));
    await page.goto(base);
    await page.waitForFunction(() => window.__sbAnyColor && window.__sbApp && window.__sbPlanObj && window.__sbPlanObj(), null, {timeout: 40000});
    const setup = () => page.evaluate(() => {
      const A = window.__sbApp, now = Date.now();
      A.state.courses.anyc = {id: "anyc", name: "Biology", code: "BIO 101", color: "#2F6FDB"};
      A.state.notes.anyn = {id: "anyn", text: "Quiz on Friday", color: "yellow", x: 40, y: 40, z: 1, rot: 0, created: now, updated: now};
      A.ui.tab = "notes"; A.render();
    });
    await setup();

    // Free plan: both rainbows wear PRO and open the Pro sheet, not a color picker
    ok(await page.evaluate(() => window.__sbAnyColor.locked()), "with the paywall on, a free account can't pick any color");
    await page.evaluate(() => window.__sbAnyColor.course(window.__sbApp.state.courses.anyc));
    await page.waitForSelector(".cc-custom.locked .pro-badge");
    ok(await page.evaluate(() => document.querySelector("#ccPick").disabled), "the course color picker itself is switched off");
    await page.click(".cc-custom.locked");
    await page.waitForSelector(".plan-sheet", {timeout: 5000});
    ok(/any course color/i.test(await page.textContent(".plan-sheet")), "the course rainbow opens the Pro sheet, saying why");
    await page.evaluate(() => window.__sbApp.dlg.close());
    await page.evaluate(() => window.__sbAnyColor.note("anyn"));
    await page.waitForSelector('.note.editing .nc-any.locked .pro-badge');
    ok(!(await page.$(".note.editing .nc-pick")), "the note rainbow has no color picker on the free plan");
    await page.click(".note.editing .nc-any.locked");
    await page.waitForSelector(".plan-sheet", {timeout: 5000});
    ok(/any note color/i.test(await page.textContent(".plan-sheet")), "the note rainbow opens the Pro sheet, saying why");
    await page.evaluate(() => window.__sbApp.dlg.close());
    await page.click('.note.editing .nc[data-color="pink"]');
    ok(await page.evaluate(() => window.__sbApp.state.notes.anyn.color === "pink"), "the six set note colors stay free");

    // Pro: any note color is saved, and a dark one gets light text
    await page.evaluate(() => { const P = window.__sbPlanObj(); P.isPro = () => true; window.__sbAnyColor.note("anyn"); });
    await page.waitForSelector(".note.editing .nc-pick");
    await page.evaluate(() => { const i = document.querySelector(".note.editing .nc-pick"); i.value = "#1e3a8a"; i.dispatchEvent(new Event("change", {bubbles: true})); });
    await page.waitForFunction(() => window.__sbApp.state.notes.anyn.color === "#1e3a8a", null, {timeout: 5000});
    ok(true, "on Pro, picking a note color saves it");
    const look = await page.evaluate(() => { const el = document.querySelector('.note[data-note="anyn"]'); return {bg: getComputedStyle(el).backgroundColor, dark: el.classList.contains("note-dark")}; });
    ok(look.bg === "rgb(30, 58, 138)" && look.dark, "the note shows the picked color, with light text on a dark color");
    await page.evaluate(() => window.__sbAnyColor.course(window.__sbApp.state.courses.anyc));
    await page.waitForSelector(".cc-custom");
    ok(!(await page.$(".cc-custom.locked")) && !(await page.evaluate(() => document.querySelector("#ccPick").disabled)), "on Pro the course rainbow opens the color picker");

    ok(errs.length === 0, "no page errors" + (errs.length ? ": " + errs[0] : ""));
    console.log("\nany-color: " + n + " checks passed");
  } finally { await browser.close(); server.close(); }
})().catch(e => { console.error(e); process.exit(1); });
