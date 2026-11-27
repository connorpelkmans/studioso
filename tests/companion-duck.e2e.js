// node tests/companion-duck.e2e.js  A toast at the bottom and the companion: it moves only when the toast lands where it's
// standing; then it takes the smallest way out (a short step, or a hop up over the toast), never a long slide across the screen
// and never onto the tab bar or the Add Task button; and when the toast goes it glides back to the same spot.
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
const LONG = "Added Essay Outline, due Fri. Studyboard planned it for tomorrow afternoon";
(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  try {
    // 820 px (a tablet): the companion rests beside the Add Task button, right where a wide toast lands. 402 and 1300: it doesn't.
    for (const [w, h, mob, overlaps] of [[820, 1180, true, true], [402, 874, true, false], [1300, 860, false, false]]) {
      const tag = `${w}px`;
      const ctx = await browser.newContext({serviceWorkers: "block", viewport: {width: w, height: h}, isMobile: mob, hasTouch: mob});
      await ctx.addInitScript(require("./consent-ok")); await ctx.routeWebSocket(/supabase\.co/, ws => ws.close()); await ctx.route(/supabase\.co/, r => r.abort());
      await ctx.addInitScript(() => {
        localStorage.setItem("coursework:v2", JSON.stringify({v: 2, updated: 1, courses: [{id: "c1", name: "Biology", code: "BIOL 1200", color: "#1E9E74"}], tasks: [{id: "t1", title: "Lab report", courseId: "c1", type: "Assignment", due: "2026-12-02", hours: 2, status: "todo", created: 1}], events: [], notes: [], decks: [], files: [], settings: {}}));
        localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("studyboard:tour", "done");
        localStorage.setItem("sb:ess", JSON.stringify({on: false, why: "existing", at: 1, unl: {}, said: {}}));
      });
      const page = await ctx.newPage(); const errs = []; page.on("pageerror", e => errs.push(e.message));
      await page.goto(base); await page.waitForFunction(() => document.querySelector("#compFront .cp, #compLayer .cp"), null, {timeout: 40000}); await page.waitForTimeout(3500);
      const where = () => page.evaluate(() => {
        const c = document.querySelector("#compFront .cp, #compLayer .cp"), t = document.getElementById("toast"), rr = e => { if (!e || !e.getClientRects().length) return null; const q = e.getBoundingClientRect(); return {l: q.left, t: q.top, r: q.right, b: q.bottom}; };
        return {c: rr(c), duck: !!c && c.classList.contains("cp-duck"), toast: t && t.classList.contains("show") ? rr(t) : null, fab: rr(document.getElementById("fab")), bar: rr(document.querySelector("nav.tabs"))};
      });
      // (the toast is shown the way toast() shows it: its text, then the show class; the companion watches it)
      const toast = on => page.evaluate(([on, txt]) => { const t = document.getElementById("toast"), m = document.getElementById("toastMsg"); if (on) { if (m) m.textContent = txt; t.classList.add("show"); } else t.classList.remove("show"); }, [on, LONG]);
      const over = (a, b) => !!a && !!b && a.l < b.r && a.r > b.l && a.t < b.b && a.b > b.t;
      const home = await where();
      ok(!!home.c, `${tag}: the companion is on screen`);
      await toast(true);
      const path1 = []; for (let i = 0; i < 9; i++) { await page.waitForTimeout(80); path1.push((await where()).c); }
      const mid = await where();
      if (!overlaps) {
        ok(!over(mid.toast, home.c), `${tag}: (the toast lands away from where the companion stands)`);
        ok(!mid.duck && Math.abs(mid.c.l - home.c.l) < 1 && Math.abs(mid.c.t - home.c.t) < 1, `${tag}: so the companion stays exactly where it is`);
      } else {
        ok(over(mid.toast, home.c), `${tag}: (the toast lands where the companion stands)`);
        ok(mid.duck && !over(mid.toast, mid.c), `${tag}: the companion steps out of the toast's way`);
        const dx = Math.abs(mid.c.l - home.c.l), dy = Math.abs(mid.c.t - home.c.t), wC = home.c.r - home.c.l;
        ok(dx <= Math.max(120, wC * 1.5) + 1, `${tag}: no long slide sideways (${Math.round(dx)} px)`);
        ok(!over(mid.c, mid.fab) && !over(mid.c, mid.bar) && mid.c.l >= 0 && mid.c.r <= w && mid.c.t >= 0, `${tag}: and never onto the Add Task button, the tab bar or off screen: ` + JSON.stringify(mid.c));
        // smooth: it travels over several frames, a little at a time, rather than jumping
        const steps = path1.map((c, i) => i ? Math.hypot(c.l - path1[i - 1].l, c.t - path1[i - 1].t) : 0).filter(d => d > 0.5);
        ok(steps.length >= 3 && Math.max(...steps) < Math.hypot(dx, dy) * 0.6, `${tag}: it glides there over several frames (${steps.map(Math.round).join(", ")} px per 80 ms)`);
      }
      await toast(false); await page.waitForTimeout(900);
      const end = await where();
      ok(!end.duck && Math.abs(end.c.l - home.c.l) < 1.5 && Math.abs(end.c.t - home.c.t) < 1.5, `${tag}: when the toast goes, it's back in its own spot`);
      ok(!errs.length, `${tag}: no page errors ` + errs.join(" | "));
      await ctx.close();
    }
  } finally { await browser.close(); server.close(); }
  console.log(`\ncompanion-duck.e2e: ${n} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
