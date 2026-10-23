// node tests/focus-island.e2e.js
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
(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  const errs = [];
  const open = async withIsland => {
    const ctx = await browser.newContext({viewport: {width: 390, height: 844}, isMobile: true, hasTouch: true});
    await ctx.addInitScript(withIsland => {
      try { localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "1"); } catch (e) {}
      if (withIsland) { window.__fa = []; window.StudyboardNative = {focusActivity: {show: st => { window.__fa.push(["show", st]); return Promise.resolve(true); }, end: () => { window.__fa.push(["end"]); return Promise.resolve(); }}}; }
    }, withIsland);
    const page = await ctx.newPage(); page.on("pageerror", e => errs.push(e.message));
    await page.goto(base); await page.waitForSelector("#pomoBtn", {state: "attached"}); await page.waitForTimeout(1500);
    await page.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
    return {ctx, page};
  };
  const act = (page, a) => page.evaluate(a => { const b = document.createElement("button"); b.dataset.act = a; b.hidden = true; document.body.appendChild(b); b.click(); b.remove(); }, a);
  const btnW = page => page.evaluate(() => Math.round(document.getElementById("pomoBtn").getBoundingClientRect().width));
  try {
    const {ctx, page} = await open(true);
    const w0 = await btnW(page);
    await act(page, "pomo-start"); await page.waitForTimeout(300);
    let fa = await page.evaluate(() => window.__fa);
    const st = fa.length && fa[fa.length - 1][1];
    ok(fa.length === 1 && fa[0][0] === "show" && st.running === true && st.mode === "focus" && st.label === "Focus" && st.total === 1500 && Math.abs(st.endsAt - Date.now() - 1500000) < 5000, "starting sends one show() with the end time and the session length");
    ok(await page.evaluate(() => document.documentElement.classList.contains("sb-island")) && await page.locator("#pomoBtnTime").isHidden(), "while it's in the island the header doesn't show the time");
    ok(Math.abs(await btnW(page) - w0) <= 2, "the header button stays the round tomato size, so the logo and date don't move: " + w0 + " vs " + await btnW(page));
    await page.waitForTimeout(2200);
    ok((await page.evaluate(() => window.__fa.length)) === 1, "nothing is sent while it just counts down (the system draws the countdown)");
    await act(page, "pomo-pause"); await page.waitForTimeout(300);
    fa = await page.evaluate(() => window.__fa);
    ok(fa.length === 2 && fa[1][1].running === false && fa[1][1].left > 1490 && fa[1][1].left <= 1500, "pausing sends the time left, paused");
    await act(page, "pomo-reset"); await page.waitForTimeout(300);
    fa = await page.evaluate(() => window.__fa);
    ok(fa[fa.length - 1][0] === "end" && !(await page.evaluate(() => document.documentElement.classList.contains("sb-island"))), "resetting ends it and the header is back to normal");
    await ctx.close();

    const w = await open(false);
    await act(w.page, "pomo-start"); await w.page.waitForTimeout(300);
    ok(!(await w.page.evaluate(() => document.documentElement.classList.contains("sb-island"))) && await w.page.locator("#pomoBtnTime").isVisible(), "without the iPhone app's bridge the header shows the running time as before");
    await w.ctx.close();
    ok(!errs.length, "no page errors: " + errs.join(" | "));
    console.log(`focus-island.e2e: ${n} checks passed`);
  } finally { await browser.close(); server.close(); }
})().catch(e => { console.error(e); process.exit(1); });
