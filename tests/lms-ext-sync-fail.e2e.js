// node tests/lms-ext-sync-fail.e2e.js (Playwright + Chromium) On the website with the School Sync extension: a sync started in the app
// shows Syncing until the extension reports back; if it couldn't sync (not signed in, an error, no permission) a message at the
// bottom says so, and Sign In opens the school site
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
    // a stand-in for the School Sync extension: answers "sync" with "syncing", then the outcome given (or nothing at all)
    const run = async outcome => {
      const ctx = await browser.newContext({serviceWorkers: "block"});
      await ctx.routeWebSocket(/supabase\.co/, ws => ws.close());
      await ctx.route(/supabase\.co/, r => r.abort());
      await ctx.addInitScript(() => { try { if (!localStorage.getItem("coursework:v2")) localStorage.setItem("coursework:v2", JSON.stringify({v: 2, updated: 1, courses: [{id: "c1", name: "Biology", code: "BIOL 1200", color: "#1E9E74"}], tasks: [], settings: {}})); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studyboard:tour", "1"); } catch (e) {} });
      await ctx.addInitScript(outcome => {
        let st = {state: "ok", at: Date.now() - 864e5, tried: Date.now() - 864e5, error: ""};
        const send = () => window.postMessage({source: "studyboard-ext", type: "data", version: "1.0.12", schools: [Object.assign({id: "brightspace", origin: "https://learn.example.edu"}, st)], list: []}, location.origin);
        window.__syncAsked = 0;
        window.addEventListener("message", ev => { const d = ev.data; if (!d || d.source !== "studyboard-app") return;
          if (d.type === "hello") window.postMessage({source: "studyboard-ext", type: "ready", version: "1.0.12"}, location.origin);
          if (d.type === "get") send();
          if (d.type === "sync") { window.__syncAsked++; if (!outcome) return; st = Object.assign({}, st, {state: "syncing"}); send();
            setTimeout(() => { const t = Date.now(); st = outcome === "ok" ? {state: "ok", at: t, tried: t, error: ""} : {state: outcome, at: st.at, tried: t, error: outcome === "error" ? "the site didn't answer" : ""}; send(); }, 700); } });
      }, outcome);
      const page = await ctx.newPage(); const errs = []; page.on("pageerror", e => errs.push(e.message));
      await page.goto(base);
      await page.waitForFunction(() => window.SBLMS && SBLMS.brightspace && SBLMS.brightspace.fromApi, null, {timeout: 40000});
      await page.evaluate(() => { const L = SBLMS.brightspace; L.save({map: {"7": "c1"}, mode: "api", host: "https://learn.example.edu", last: Date.now(), lastSrc: "grab"}); });
      await page.waitForTimeout(2500);
      await page.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
      await page.evaluate(() => { window.__opened = []; window.open = (u) => { window.__opened.push(u); return null; }; const b = document.createElement("button"); b.dataset.act = "lms-sync-all"; b.hidden = true; document.body.appendChild(b); b.click(); b.remove(); });
      await page.waitForTimeout(300);
      const during = await page.evaluate(() => { const p = document.getElementById("syncPill"); return !!p && p.classList.contains("show"); });
      await page.waitForTimeout(outcome ? 1500 : 200);
      const r = await page.evaluate(() => { const t = document.getElementById("toast"), x = document.getElementById("toastExtra"), p = document.getElementById("syncPill");
        return {asked: window.__syncAsked, pill: !!p && p.classList.contains("show"), shown: !!t && t.classList.contains("show"), msg: (document.getElementById("toastMsg") || {}).textContent || "", btn: x && !x.hidden ? x.textContent : ""}; });
      if (r.btn === "Sign In") { await page.click("#toastExtra"); r.opened = await page.evaluate(() => window.__opened); }
      await ctx.close(); return Object.assign(r, {during, errs});
    };
    let r = await run("login");
    ok(r.asked === 1 && r.during, "Sync asks the extension and says Syncing while it works: " + JSON.stringify(r));
    ok(!r.pill && r.shown && /^Sign in to learn\.example\.edu to continue syncing Brightspace/.test(r.msg) && r.btn === "Sign In", "the extension isn't signed in: a message at the bottom says so, with Sign In: " + r.msg);
    ok(r.opened && r.opened[0] && r.opened[0].indexOf("https://learn.example.edu") === 0, "Sign In opens the school site the extension found: " + JSON.stringify(r.opened));
    r = await run("error");
    ok(!r.pill && /^Couldn't sync Brightspace: the site didn't answer/.test(r.msg) && r.btn === "Try Again", "another failure says what went wrong, with Try Again: " + r.msg);
    r = await run("permission");
    ok(!r.pill && /needs your OK to read learn\.example\.edu/.test(r.msg), "no permission for the site: says to allow it in the extension: " + r.msg);
    r = await run("ok");
    ok(!r.pill && !/Sign in|Couldn't/.test(r.msg), "a sync that works ends Syncing with no warning: " + JSON.stringify(r));
    ok(!r.errs.length, "no page errors: " + r.errs.join(" | "));
  } finally { await browser.close(); server.close(); }
  console.log(`\nlms-ext-sync-fail.e2e: ${n} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
