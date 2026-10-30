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
      if (withIsland) { window.__fa = []; window.StudyboardNative = {focusActivity: {show: st => { window.__fa.push(["show", st]); return Promise.resolve(true); }, end: () => { window.__fa.push(["end"]); return Promise.resolve(); },
        take: () => { const q = window.__lockQ || []; window.__lockQ = []; return Promise.resolve(q); }, onAction: fn => { window.__lockFire = fn; },
        hasSound: () => Promise.resolve(false), alarm: o => { window.__alarm = o; return Promise.resolve(true); }}}; }
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
    await page.waitForTimeout(800);
    const al = await page.evaluate(() => { const o = window.__alarm; if (!o || !o.wav) return null; const b = atob(o.wav); return {name: o.name, riff: b.slice(0, 4), wave: b.slice(8, 12), bytes: b.length, loud: (() => { let m = 0; for (let i = 44; i < b.length; i += 2) { const v = (b.charCodeAt(i) | (b.charCodeAt(i + 1) << 8)) << 16 >> 16; m = Math.max(m, Math.abs(v)); } return m; })()}; });
    ok(al && al.name === "sb-chime-80.wav" && al.riff === "RIFF" && al.wave === "WAVE" && al.bytes > 100000 && al.bytes < 3000000 && al.loud > 3000, "starting hands iOS the picked alarm sound as a recording to ring at the end: " + JSON.stringify(al));
    ok(await page.evaluate(() => document.documentElement.classList.contains("sb-island")) && await page.locator("#pomoBtnTime").isVisible(), "while it's in the island the header still shows the time (iOS hides the island inside the app)");
    await page.waitForTimeout(2200);
    ok((await page.evaluate(() => window.__fa.length)) === 1, "nothing is sent while it just counts down (the system draws the countdown)");
    await act(page, "pomo-pause"); await page.waitForTimeout(300);
    fa = await page.evaluate(() => window.__fa);
    ok(fa.length === 2 && fa[1][1].running === false && fa[1][1].left > 1490 && fa[1][1].left <= 1500, "pausing sends the time left, paused");
    // Lock Screen buttons: play there 60 s ago, then skip 30 s ago; the app catches up to the moment each was pressed
    const plan = (await page.evaluate(() => window.__fa))[1][1].plan;
    ok(Array.isArray(plan) && plan[0].mode === "short" && plan[0].total === 300 && plan[1].mode === "focus" && plan[1].total === 1500, "the card is told what Skip moves to: " + JSON.stringify(plan && plan.slice(0, 2)));
    await page.evaluate(() => { const now = Date.now(); window.__lockQ = [{a: "play", t: now - 60000}]; window.__lockFire(); });
    await page.waitForTimeout(300);
    let p = await page.evaluate(() => JSON.parse(localStorage.getItem("studioso:pomo")));
    ok(p.running && Math.abs(p.endAt - Date.now() - 1440000) < 15000, "Play on the Lock Screen resumes the app's timer from when it was pressed");
    await page.evaluate(() => { window.__lockQ = [{a: "pause", t: Date.now() - 20000}, {a: "skip", t: Date.now() - 10000}]; document.dispatchEvent(new Event("visibilitychange")); });
    await page.waitForTimeout(300);
    p = await page.evaluate(() => JSON.parse(localStorage.getItem("studioso:pomo")));
    fa = await page.evaluate(() => window.__fa);
    ok(p.running && p.mode === "short" && Math.abs(p.endAt - Date.now() - 290000) < 5000 && fa[fa.length - 1][1].mode === "short", "Pause then Skip there: the app is on a running short break, started when Skip was pressed");
    ok(fa.slice(2).every(x => x[0] === "show"), "catching up never ends the card on the way");
    // the card's exact result is copied, so the app and the card show the same time
    await page.evaluate(() => { window.__lockQ = [{a: "pause", t: Date.now() - 3000, left: 271}]; window.__lockFire(); });
    await page.waitForTimeout(300);
    p = await page.evaluate(() => JSON.parse(localStorage.getItem("studioso:pomo")));
    fa = await page.evaluate(() => window.__fa);
    ok(!p.running && p.left === 271000 && fa[fa.length - 1][1].left === 271, "a Lock Screen pause takes the card's exact time left (271 s), and sends the same back");
    const endMs = Date.now() + 271000 - 1500;
    await page.evaluate(e => { window.__lockQ = [{a: "play", t: Date.now() - 1500, end: e}]; window.__lockFire(); }, endMs);
    await page.waitForTimeout(300);
    p = await page.evaluate(() => JSON.parse(localStorage.getItem("studioso:pomo")));
    fa = await page.evaluate(() => window.__fa);
    ok(p.running && p.endAt === endMs && fa[fa.length - 1][1].endsAt === endMs, "a Lock Screen play takes the card's exact end time");
    await page.evaluate(() => { window.__lockQ = [{a: "reset", t: Date.now() - 5000}]; window.__lockFire(); });
    await page.waitForTimeout(300);
    p = await page.evaluate(() => JSON.parse(localStorage.getItem("studioso:pomo")));
    fa = await page.evaluate(() => window.__fa);
    ok(!p.running && !(p.left > 0) && fa[fa.length - 1][0] === "end", "Reset on the Lock Screen stops the app's timer too");
    await act(page, "pomo-start"); await page.waitForTimeout(300);
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
