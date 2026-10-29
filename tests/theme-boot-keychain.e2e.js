// node tests/theme-boot-keychain.e2e.js: the iPhone and desktop apps keep the sign-in in the keychain, which loads a moment
// after the page starts. A Pro theme (and its companion) from last time must show from the start, not the default theme and
// Mochi for a second. Signed out: the default straight away, remembered so the next start doesn't flash the Pro theme.
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
const UID = "00000000-0000-4000-8000-000000000001";
(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  // keychain: the saved sign-in (or none), handed over after 1.5 s like the native keychain bridge
  const open = async ({session, hintPro, fresh = true, ctx}) => {
    ctx = ctx || await browser.newContext({serviceWorkers: "block"});
    await ctx.route(/supabase\.co/, r => r.abort());
    await ctx.addInitScript(([session, hintPro, uid, fresh]) => {
      try {
        window.__SB_TEST = true;
        const sess = session ? JSON.stringify({access_token: "x.y.z", refresh_token: "r", token_type: "bearer", expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, user: {id: uid, email: "a@b.c", aud: "authenticated", role: "authenticated"}}) : null;
        window.StudyboardAuthStorage = {getItem: k => new Promise(r => setTimeout(() => r(k === "studioso-auth" ? sess : null), 1500)), setItem: () => Promise.resolve(), removeItem: () => Promise.resolve()};
        if (!fresh || localStorage.getItem("__seeded")) return; localStorage.setItem("__seeded", "1");
        localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studyboard:tour", "done");
        localStorage.setItem("coursework:v2", JSON.stringify({v: 2, settings: {capacity: 15, style: {skin: "ocean"}}, updated: 1, courses: [], tasks: []}));
        localStorage.setItem("studyboard:skin", "ocean"); localStorage.setItem("studyboard:skincss", ":root[data-skin=\"ocean\"]{}");
        localStorage.removeItem("studioso-auth");
        localStorage.setItem("studyboard:planHint", JSON.stringify({uid, pro: hintPro}));
      } catch (e) {}
    }, [session, hintPro, UID, fresh]);
    const page = await ctx.newPage(); const errs = []; page.on("pageerror", e => errs.push(e.message));
    // watch the theme on every frame from the first one
    await page.addInitScript(() => { window.__skins = []; const t = () => { const s = document.documentElement.dataset.skin || "classic"; if (window.__skins[window.__skins.length - 1] !== s) window.__skins.push(s); requestAnimationFrame(t); }; requestAnimationFrame(t); });
    await page.goto(base);
    await page.waitForFunction(() => window.__sbCollPreview && window.__sbCollPreview.state && window.__sbCollPreview.state.settings, null, {timeout: 40000});
    return {ctx, page, errs};
  };
  try {
    // 1. Pro last time, signed in (the keychain answers after 1.5 s)
    const a = await open({session: true, hintPro: true});
    await a.page.waitForTimeout(3000);
    const seen = await a.page.evaluate(() => window.__skins);
    ok(JSON.stringify(seen) === JSON.stringify(["ocean"]), "Pro last time: the Pro theme shows from the first frame and never drops to the default while the keychain loads: " + seen.join(" > "));
    const who = await a.page.evaluate(() => window.SBCOMP && SBCOMP.aiName());
    ok(who && who !== "Mochi", "and its companion shows, not Mochi: " + who);
    ok(!a.errs.length, "no page errors " + a.errs.join(" | "));
    await a.ctx.close();

    // 2. Signed out since (no saved sign-in), but last time had Pro: the default straight away, and remembered
    const b = await open({session: false, hintPro: true});
    await b.page.waitForFunction(() => (document.documentElement.dataset.skin || "classic") === "classic", null, {timeout: 6000}).catch(() => {});
    ok((await b.page.evaluate(() => document.documentElement.dataset.skin || "classic")) === "classic", "signed out: the Pro theme goes as soon as the keychain says there's no sign-in");
    const hint = await b.page.evaluate(() => JSON.parse(localStorage.getItem("studyboard:planHint") || "null"));
    ok(hint && hint.pro === false, "and the app remembers there's no Pro: " + JSON.stringify(hint));
    // 3. the next start: the default from the first frame, no Pro theme flashing
    const p2 = await b.ctx.newPage(); await p2.addInitScript(() => { window.__skins = []; const t = () => { const s = document.documentElement.dataset.skin || "classic"; if (window.__skins[window.__skins.length - 1] !== s) window.__skins.push(s); requestAnimationFrame(t); }; requestAnimationFrame(t); });
    await p2.goto(base); await p2.waitForTimeout(3000);
    const seen2 = await p2.evaluate(() => window.__skins);
    ok(JSON.stringify(seen2) === JSON.stringify(["classic"]), "the next start shows the default from the first frame, no Pro theme for a moment: " + seen2.join(" > "));
    ok(!b.errs.length, "no page errors " + b.errs.join(" | "));
    await b.ctx.close();
    console.log("\ntheme-boot-keychain.e2e: " + n + " checks passed");
  } finally { await browser.close(); server.close(); }
})().catch(e => { console.error(e); process.exit(1); });
