// node tests/lms-sync-pill.e2e.js  Syncing a school site shows "Syncing" with three dots at the bottom of the screen until it's done
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
(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  try {
    for (const [w, h, mob] of [[402, 874, true], [1300, 820, false]]) {
      const ctx = await browser.newContext({serviceWorkers: "block", viewport: {width: w, height: h}, isMobile: mob, hasTouch: mob}); await ctx.addInitScript(require("./consent-ok")); await ctx.routeWebSocket(/supabase\.co/, ws => ws.close()); await ctx.route(/supabase\.co/, r => r.abort());
      await ctx.addInitScript(() => {
        localStorage.setItem("coursework:v2", JSON.stringify({v: 2, updated: 1, courses: [{id: "c1", name: "Biology", code: "BIOL 1200", color: "#1E9E74"}], tasks: [], settings: {}}));
        localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("studyboard:tour", "done");
        const H = {ok: true, origin: "https://learn.example.edu", me: {name: "Anna"}, all: [], errors: [], items: [], completions: [], courses: [{ou: "7", code: "BIOL1200", name: "BIOL 1200 - Biology", folders: [], quizzes: [], grades: [], news: [], events: [], discussions: [], staff: []}]};
        window.__lmsGate = null;
        // the school site answers only when the test says so, so the sync stays running while it looks
        window.studiosoLms = {connect: async () => ({ok: true, origin: "https://learn.example.edu", name: "Anna"}), sync: async () => { await new Promise(r => { window.__lmsGate = r; }); return JSON.parse(JSON.stringify(H)); },
          signOut: async () => true, file: async () => ({error: "x"}), feed: async () => ({error: "x"})};
      });
      const page = await ctx.newPage(); const errs = []; page.on("pageerror", e => errs.push(e.message));
      await page.goto(base); await page.waitForFunction(() => window.SBLMS && SBLMS.brightspace, null, {timeout: 40000});
      await page.evaluate(() => { const L = SBLMS.brightspace; L.save({mode: "api", host: "https://learn.example.edu", map: {"7": "c1"}, last: Date.now() - 864e5}); });
      await page.evaluate(() => { window.__done = false; SBLMS.brightspace.syncNow().then(() => { window.__done = true; }); });
      await page.waitForFunction(() => !!window.__lmsGate, null, {timeout: 8000}); await page.waitForTimeout(400);
      const pill = () => page.evaluate(() => { const e = document.getElementById("syncPill"); if (!e) return null; const r = e.getBoundingClientRect(); return {text: e.textContent.trim(), dots: e.querySelectorAll(".sp-dots i").length, shown: +getComputedStyle(e).opacity > 0.9, top: Math.round(r.top), bottom: Math.round(r.bottom), left: Math.round(r.left), right: Math.round(r.right)}; });
      const p1 = await pill();
      if (process.env.PILL_SHOT) await page.screenshot({path: path.join(process.env.PILL_SHOT, `pill-${w}.png`), clip: {x: Math.max(0, p1.left - 80), y: p1.top - 40, width: Math.min(w, p1.right - p1.left + 160), height: 120}});
      ok(p1 && p1.shown && p1.text === "Syncing" && p1.dots === 3, `${w}px: while the school site syncs, "Syncing" with three dots shows: ` + JSON.stringify(p1));
      ok(p1.bottom <= h && p1.top > h * 0.6 && p1.left >= 0 && p1.right <= w, `${w}px: at the bottom of the screen, fully on it: ` + JSON.stringify(p1));
      await page.waitForTimeout(2500);
      ok((await pill()).shown, `${w}px: it stays up for as long as the sync runs (not just a few seconds)`);
      await page.evaluate(() => window.__lmsGate());
      await page.waitForFunction(() => window.__done, null, {timeout: 10000}); await page.waitForTimeout(500);
      ok(!(await pill()).shown, `${w}px: it goes away when the sync is done`);
      await page.evaluate(() => { SBLMS.brightspace.syncNow({quiet: true}); }); await page.waitForTimeout(400);
      ok(!(await pill()) || !(await pill()).shown, `${w}px: a quiet sync in the background doesn't show it`);
      await page.evaluate(() => window.__lmsGate && window.__lmsGate()); await page.waitForTimeout(300);
      ok(!errs.length, "no page errors: " + errs.join(" | "));
      await ctx.close();
    }
  } finally { await browser.close(); server.close(); }
  console.log(`\nlms-sync-pill.e2e: ${n} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
