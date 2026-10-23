// node tests/lms-ext-gone.e2e.js (Playwright + Chromium) On the website
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
    const run = async (ext) => {
      const ctx = await browser.newContext({serviceWorkers: "block"});
      await ctx.route(/supabase\.co/, r => r.abort());
      await ctx.addInitScript(() => { try { if (!localStorage.getItem("coursework:v2")) localStorage.setItem("coursework:v2", JSON.stringify({v: 2, updated: 1, courses: [{id: "c1", name: "Biology", code: "BIOL 1200", color: "#1E9E74"}], tasks: [], settings: {}})); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("studyboard:tour", "done"); } catch (e) {} });
      if (ext) await ctx.addInitScript(ids => { window.addEventListener("message", ev => { const d = ev.data; if (!d || d.source !== "studyboard-app") return;
        if (d.type === "hello") window.postMessage({source: "studyboard-ext", type: "ready", version: "1.0.3"}, location.origin);
        if (d.type === "get") window.postMessage({source: "studyboard-ext", type: "data", version: "1.0.3", schools: ids.map(id => ({id, origin: "https://learn.example.edu", state: "ok", at: Date.now()})), list: []}, location.origin); }); }, ext);
      const page = await ctx.newPage(); const errs = []; page.on("pageerror", e => errs.push(e.message));
      await page.goto(base);
      await page.waitForFunction(() => window.SBLMS && SBLMS.brightspace && SBLMS.brightspace.fromApi, null, {timeout: 40000});
      await page.evaluate(() => { const L = SBLMS.brightspace, due = new Date(Date.now() + 3 * 864e5).toISOString();
        const d = L.fromApi({ok: true, origin: "https://learn.example.edu", me: {}, all: [], errors: [], items: [], completions: [], courses: [{ou: "7", code: "BIOL1200", name: "BIOL 1200 - Biology", folders: [{id: "1", name: "Lab Report 1", due, end: null, sub: false, files: []}], quizzes: [], grades: [], news: [], events: [], discussions: [], staff: []}]});
        L.save({map: {"7": "c1"}, mode: "api", host: "https://learn.example.edu"}); L.applyPlan(d, L.plan(d), "grab", true); });
      await page.waitForTimeout(3500);
      const r = await page.evaluate(() => { const L = SBLMS.brightspace; L.bsSheet(); const st = document.querySelector(".bs-status"); return {head: st.querySelector("b").textContent, line: L.statusLine(), short: L.shortStatus(), warn: st.classList.contains("warn"), body: document.querySelector(".bs-acts").textContent}; });
      await ctx.close(); return Object.assign(r, {errs});
    };
    let r = await run(null);
    ok(/^Not Syncing/.test(r.head) && r.warn, "extension removed: the sheet says Not Syncing, not Connected: " + r.head);
    ok(/isn't in this browser anymore/.test(r.line) && r.short === "not syncing", "and says why, in the sheet and in Settings: " + r.line);
    ok(!/Your computer's Studyboard app syncs/.test(r.body), "it no longer claims your computer's app syncs it");
    ok(!r.errs.length, "no page errors: " + r.errs.join(" | "));
    r = await run([]);
    ok(/^Not Syncing/.test(r.head) && /isn't connected to Brightspace anymore/.test(r.line), "extension installed but Brightspace removed from it: Not Syncing: " + r.line);
    ok(/connect Brightspace again/.test(r.body), "and it says to connect it again in the extension");
    r = await run(["brightspace"]);
    ok(/^Connected/.test(r.head) && !r.warn && /Read from Brightspace in this browser/.test(r.line), "extension still connected: Connected: " + r.line);
    ok(!r.errs.length, "no page errors: " + r.errs.join(" | "));
  } finally { await browser.close(); server.close(); }
  console.log(`\nlms-ext-gone.e2e: ${n} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
