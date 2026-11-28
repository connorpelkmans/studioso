// node tests/toast-steady.e2e.js
// The small message at the bottom of the screen stays put: a sheet closing doesn't make it vanish (it used to sit in the closed
// sheet until the close event, then pop back up somewhere else)
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const csp = require("../scripts/csp");
const root = path.join(__dirname, "..");
const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x"); let p = decodeURIComponent(u.pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  const mime = {".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".css": "text/css"};
  res.writeHead(200, {"content-type": mime[path.extname(f)] || "application/octet-stream"});
  if (p === "/index.html") { res.end(csp.apply(fs.readFileSync(f, "utf8"))); return; }
  fs.createReadStream(f).pipe(res);
});
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const SEED = {v: 2, updated: 1, tasks: [], files: [], notes: [], settings: {}, courses: [{id: "c1", name: "Biology", code: "BIO101", color: "#3B6FE0"}], decks: []};
(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  try {
    for (const [w, h, mob] of [[402, 874, true], [1300, 820, false]]) {
      const ctx = await browser.newContext({viewport: {width: w, height: h}, isMobile: mob, hasTouch: mob, serviceWorkers: "block"});
      await ctx.addInitScript(seed => {
        window.__SB_TEST = true;
        try { localStorage.setItem("coursework:v2", JSON.stringify(seed)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("studyboard:tour", "done"); } catch (e) {}
      }, SEED);
      const page = await ctx.newPage(); const errs = []; page.on("pageerror", e => errs.push(e.message));
      await page.goto(base); await page.waitForFunction(() => window.__sbSync); await page.waitForTimeout(800);
      // a toast shown in an open sheet (as toast() does), then the sheet closes in the same moment, the way Save does
      const r1 = await page.evaluate(async () => {
        const d = document.getElementById("dlg"), t = document.getElementById("toast");
        d.innerHTML = "<p>Sheet</p>"; d.showModal(); await new Promise(r => setTimeout(r, 600));
        d.appendChild(t); t.classList.add("show"); d.close();
        await new Promise(r => requestAnimationFrame(r));
        const s = [];
        for (let i = 0; i < 6; i++) { const b = t.getBoundingClientRect(); s.push({body: t.parentNode === document.body, vis: b.height > 0, top: Math.round(b.top)}); await new Promise(r => requestAnimationFrame(r)); }
        return s;
      });
      ok(r1.every(x => x.body && x.vis), `${w}px: a sheet closing puts its message straight back on the page, visible every frame: ` + JSON.stringify(r1));
      ok(new Set(r1.map(x => x.top)).size === 1, `${w}px: and it doesn't move once it's there`);
      ok(!errs.length, "no page errors: " + errs.join(" | "));
      await ctx.close();
    }
  } finally { await browser.close(); server.close(); }
  console.log(`\ntoast-steady.e2e: ${n} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
