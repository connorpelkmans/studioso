// node tests/theme-hold.e2e.js (Playwright + Chromium) On a reload
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const root = path.join(__dirname, "..");
const MIME = {".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".webmanifest": "application/manifest+json", ".png": "image/png", ".css": "text/css", ".svg": "image/svg+xml", ".woff2": "font/woff2"};
const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x"); let p = decodeURIComponent(u.pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  res.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const booted = page => page.waitForFunction(() => window.__sbCollPreview && window.__sbCollPreview.state && window.__sbCollPreview.state.settings, null, {timeout: 40000});
const skinNow = page => page.evaluate(() => document.documentElement.dataset.skin || "classic");

(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  try {
    const open = async signedIn => {
      const ctx = await browser.newContext({serviceWorkers: "block"});
      await ctx.route(/supabase\.co/, r => r.abort());
      await ctx.addInitScript(signedIn => {
        try {
          if (sessionStorage.getItem("seeded")) return; sessionStorage.setItem("seeded", "1");
          localStorage.setItem("sb:onboarded", "1");
          localStorage.setItem("coursework:v2", JSON.stringify({settings: {capacity: 15, style: {skin: "ocean"}}, updated: 1}));
          localStorage.setItem("studyboard:skin", "ocean"); localStorage.setItem("studyboard:skincss", ":root[data-skin=\"ocean\"]{}");
          // a complete saved sign-in (a bare user id is thrown away as broken, which now counts as signed out)
          if (signedIn) localStorage.setItem("studioso-auth", JSON.stringify({access_token: "x.y.z", refresh_token: "r", token_type: "bearer", expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, user: {id: "00000000-0000-4000-8000-000000000001", aud: "authenticated", role: "authenticated"}}));
        } catch (e) {}
      }, signedIn);
      const page = await ctx.newPage(); const errs = []; page.on("pageerror", e => errs.push(e.message));
      await page.goto(base); await booted(page);
      return {ctx, page, errs};
    };

    const a = await open(true);
    ok(await skinNow(a.page) === "ocean", "signed in, plan not confirmed yet: the theme from last time stays on screen");
    await a.page.waitForTimeout(11000);
    ok(await skinNow(a.page) === "classic", "after 10 seconds with no confirmed Pro plan it switches to Classic");
    ok(!a.errs.length, "no page errors (" + a.errs.join("; ") + ")");
    await a.ctx.close();

    const b = await open(false);
    ok(await skinNow(b.page) === "classic", "no account on this device: nothing to wait for, a Pro theme is not shown");
    ok(!b.errs.length, "no page errors (" + b.errs.join("; ") + ")");
    await b.ctx.close();
    console.log(`\n${n} checks passed`);
  } finally { await browser.close(); server.close(); }
})().catch(e => { console.error(e); process.exit(1); });
