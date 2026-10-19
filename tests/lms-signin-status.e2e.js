// node tests/lms-signin-status.e2e.js  (Playwright + Chromium)
// The school site panel in the apps: after "Sign In to Brightspace" succeeds, the panel at once stops saying "Sign In Again" (and drops the
// old error), says it's syncing, then shows the fresh sync. A sync that was already running when you signed in can't flip it back.
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
    const ctx = await browser.newContext({serviceWorkers: "block"}); await ctx.route(/supabase\.co/, r => r.abort());
    await ctx.addInitScript(() => {
      localStorage.setItem("coursework:v2", JSON.stringify({v: 2, updated: 1, courses: [{id: "c1", name: "Biology", code: "BIOL 1200", color: "#1E9E74"}], tasks: [], settings: {}}));
      localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("studyboard:tour", "done");
      // The app's sign-in bridge: the first read says the sign-in ran out (slowly, so it's still out when you sign in), later reads work
      const H = {ok: true, origin: "https://learn.example.edu", me: {name: "Anna"}, all: [], errors: [], items: [], completions: [], courses: [{ou: "7", code: "BIOL1200", name: "BIOL 1200 - Biology", folders: [], quizzes: [], grades: [], news: [], events: [], discussions: [], staff: []}]};
      let calls = 0;
      window.__lmsGate = null;
      window.studiosoLms = {
        connect: async () => ({ok: true, origin: "https://learn.example.edu", name: "Anna"}),
        sync: async () => { calls++; if (calls === 1) { await new Promise(r => setTimeout(r, 1500)); return {needLogin: true}; } await new Promise(r => { window.__lmsGate = r; }); return JSON.parse(JSON.stringify(H)); },
        signOut: async () => true, file: async () => ({error: "x"}), feed: async () => ({error: "x"})
      };
    });
    const page = await ctx.newPage(); const errs = []; page.on("pageerror", e => errs.push(e.message));
    await page.goto(base); await page.waitForFunction(() => window.SBLMS && SBLMS.brightspace, null, {timeout: 40000});
    await page.evaluate(() => { const L = SBLMS.brightspace; L.save({mode: "api", host: "https://learn.example.edu", map: {"7": "c1"}, last: Date.now() - 12 * 864e5}); });
    await page.evaluate(() => { localStorage.setItem("studyboard:brightspace", JSON.stringify({needLogin: true, err: "Couldn't reach Brightspace. Check your internet connection and try again."})); });
    // the panel as it was: Sign In Again; and a quiet sync that will come back "needs sign-in" after we sign in
    await page.evaluate(() => { const L = SBLMS.brightspace; L.bsSheet(); L.syncNow({quiet: true}); });
    await page.waitForSelector("#dlg .bs-status");
    const head = () => page.evaluate(() => { const s = document.querySelector("#dlg .bs-status"); return s ? s.textContent.replace(/\s+/g, " ").trim() : ""; });
    // sign in
    await page.click('#dlg [data-act="bs-login"]').catch(async () => { await page.evaluate(() => { const b = document.querySelector('#dlg [data-act$="-login"]'); b && b.click(); }); });
    await page.waitForFunction(() => /Syncing now/.test((document.querySelector("#dlg .bs-status") || {}).textContent || ""), null, {timeout: 5000});
    let h = await head();
    ok(/^Connected/.test(h) && !/Sign In Again/.test(h) && !/Couldn't reach/.test(h), "right after signing in: Connected, no old error: " + h);
    ok(/Syncing now/.test(h), "and it says it's syncing");
    await page.waitForTimeout(1800);   // the older read comes back "needs sign-in" meanwhile
    h = await head();
    ok(/^Connected/.test(h), "a read that started before the sign-in can't flip it back to Sign In Again: " + h);
    await page.evaluate(() => window.__lmsGate && window.__lmsGate());
    await page.waitForFunction(() => /Last synced just now/.test((document.querySelector("#dlg .bs-status") || {}).textContent || ""), null, {timeout: 8000});
    ok(/Last synced just now/.test(await head()), "when the read is done the panel shows the fresh sync: " + await head());
    ok(!errs.length, "no page errors: " + errs.join(" | "));
  } finally { await browser.close(); server.close(); }
  console.log(`\nlms-signin-status.e2e: ${n} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
