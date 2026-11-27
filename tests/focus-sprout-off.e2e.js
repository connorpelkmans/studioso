// node tests/focus-sprout-off.e2e.js  The Focus Sprout is off by default (hidden for now, kept as an option): the Focus timer,
// its Timer Settings, its alarm and Insights show nothing of it, and turning it on (localStorage "studyboard:focusSprout" = "on")
// brings it back.
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const root = path.join(__dirname, "..");
const MIME = {".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".webmanifest": "application/manifest+json", ".png": "image/png", ".css": "text/css", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".webp": "image/webp"};
const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x"); let p = decodeURIComponent(u.pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  res.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const act = (page, a) => page.evaluate(a => { const b = document.createElement("button"); b.dataset.act = a; b.style.display = "none"; document.body.appendChild(b); b.click(); b.remove(); }, a);
(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  try {
    for (const on of [false, true]) for (const [w, h, mob] of [[402, 874, true], [1300, 860, false]]) {
      const tag = `${w}px sprout ${on ? "on" : "off (default)"}`;
      const ctx = await browser.newContext({serviceWorkers: "block", viewport: {width: w, height: h}, isMobile: mob, hasTouch: mob});
      await ctx.addInitScript(require("./consent-ok")); await ctx.routeWebSocket(/supabase\.co/, ws => ws.close()); await ctx.route(/supabase\.co/, r => r.abort());
      await ctx.addInitScript(on => {
        // a garden from an earlier week, as a device that had the sprout on would have
        const d = new Date(), p = x => String(x).padStart(2, "0"), today = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
        localStorage.setItem("coursework:v2", JSON.stringify({v: 2, updated: 1, courses: [{id: "c1", name: "Biology", code: "BIOL 1200", color: "#1E9E74"}], tasks: [], events: [], notes: [], decks: [], files: [], settings: {garden: {[today]: ["5c1", "3c1"]}}}));
        localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("studyboard:tour", "done");
        localStorage.setItem("sb:ess", JSON.stringify({on: false, why: "existing", at: 1, unl: {}, said: {}}));
        if (on) localStorage.setItem("studyboard:focusSprout", "on");
        // a phone app's focusGuard, so the Block Distracting Apps row would show if the sprout module were on
        window.StudyboardNative = {focusGuard: {available: async () => ({dnd: true, apps: false}), pickApps: async () => true, start: async () => true, stop: async () => true}};
      }, on);
      const page = await ctx.newPage(); const errs = []; page.on("pageerror", e => errs.push(e.message));
      await page.goto(base); await page.waitForFunction(() => typeof window.SBESS !== "undefined", null, {timeout: 40000}); await page.waitForTimeout(1200);
      await act(page, "pomo-open"); await page.waitForSelector("dialog[open] .pomo-read"); await page.waitForTimeout(500);
      await page.evaluate(() => { const s = [...document.querySelectorAll("dialog[open] details")].find(d => /Timer Settings/.test(d.textContent)); if (s) s.open = true; }); await page.waitForTimeout(300);
      const f = await page.evaluate(() => { const s = document.querySelector("dialog[open]"); return {dial: !!s.querySelector("#spDial"), garden: !!s.querySelector(".sp-garden"), strict: /Strict Sprout/.test(s.textContent), block: /Block distracting apps/i.test(s.textContent), defined: typeof SBSPROUT !== "undefined"}; });
      if (on) ok(f.dial && f.garden && f.strict && f.block, `${tag}: the Focus timer has the sprout, the garden, Strict Sprout and Block Distracting Apps: ` + JSON.stringify(f));
      else ok(!f.dial && !f.garden && !f.strict && !f.block, `${tag}: the Focus timer is as it was before the sprout (no sprout, garden or their settings): ` + JSON.stringify(f));
      await page.keyboard.press("Escape"); await page.waitForTimeout(300);
      await act(page, "pro-ins-open"); await page.waitForSelector(".pro-ins-body", {timeout: 5000}).catch(() => {}); await page.waitForTimeout(500);
      const g = await page.evaluate(() => !!document.querySelector(".pro-ins-body .sp-garden"));
      ok(on ? g : !g, `${tag}: Insights ${on ? "shows" : "has no"} Focus Garden`);
      ok(!errs.length, `${tag}: no page errors ` + errs.join(" | "));
      await ctx.close();
    }
  } finally { await browser.close(); server.close(); }
  console.log(`\nfocus-sprout-off.e2e: ${n} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
