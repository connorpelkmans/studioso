// node tests/smart-cards-pro.e2e.js
// Smart Flashcards is Pro only: smart scheduling (FSRS) runs only with Pro. A free account reviews on the Classic steps, and Smart in
// a deck's Scheduling shows a PRO badge and opens the Pro sheet instead of switching
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const root = path.join(__dirname, "..");
const server = http.createServer((req, res) => { const u = new URL(req.url, "http://x"); let p = decodeURIComponent(u.pathname); if (p === "/") p = "/index.html"; const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; } res.writeHead(200, {"content-type": {".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json"}[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res); });
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const SEED = {v: 2, updated: 1, tasks: [], notes: [], files: [], settings: {}, courses: [{id: "c1", name: "Biology", code: "BIO101", color: "#3B6FE0"}],
  decks: [{id: "d1", name: "Cell Biology", courseId: "c1", created: 1, quizzes: [], cards: [{id: "k1", front: "Powerhouse of the cell?", back: "Mitochondria", box: 2, seen: 3, right: 2, due: "2020-01-01"}]}]};
(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  try {
    for (const free of [true, false]) {
      const who = free ? "free" : "Pro";
      const ctx = await browser.newContext({viewport: {width: 1200, height: 900}, serviceWorkers: "block"});
      await ctx.addInitScript(([seed, free]) => {
        window.__SB_TEST = true;
        localStorage.setItem("coursework:v2", JSON.stringify(seed)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("studyboard:tour", "done");
        if (free) localStorage.setItem("studyboard:paywall-test", "1");
      }, [SEED, free]);
      const page = await ctx.newPage(); const errs = []; page.on("pageerror", e => errs.push(e.message));
      await page.goto(base); await page.waitForFunction(() => window.__sbSync && window.SBPRO && SBPRO.cardPreview); await page.waitForTimeout(800);
      // this build enforces Pro, so a local test account is free; for the Pro run, Pro stands in for a real entitlement
      if (!free) await page.evaluate(() => { SBPRO.locked = () => false; SBPRO.isPro = () => true; });
      const prev = await page.evaluate(() => { const d = window.__sbSync.state.decks.d1; return SBPRO.cardPreview(d, d.cards[0], "good"); });
      ok(free ? prev === "" : /^\d{4}-\d{2}-\d{2}$/.test(prev), `${who}: smart scheduling ${free ? "doesn't run (Classic steps)" : "runs"}: ${JSON.stringify(prev)}`);
      await page.evaluate(() => { const b = document.createElement("button"); b.dataset.act = "pro-dk-stats"; b.dataset.id = "d1"; b.hidden = true; document.body.appendChild(b); b.click(); b.remove(); });
      await page.waitForSelector('[data-act="pro-dk-sched"][data-id="smart"]');
      const st = await page.evaluate(() => { const s = document.querySelector('[data-act="pro-dk-sched"][data-id="smart"]'); return {pressed: s.getAttribute("aria-pressed"), badge: !!s.querySelector(".pro-badge")}; });
      ok(free ? st.pressed === "false" && st.badge : st.pressed === "true" && !st.badge, `${who}: Smart is ${free ? "off, with a PRO badge" : "on, with no badge"}: ` + JSON.stringify(st));
      if (free) {
        await page.click('[data-act="pro-dk-sched"][data-id="smart"]'); await page.waitForTimeout(500);
        const after = await page.evaluate(() => ({sched: window.__sbSync.state.decks.d1.sched || "", plan: !!document.querySelector("dialog[open] .plan-sheet"), smartOn: !!document.querySelector('[data-act="pro-dk-sched"][data-id="smart"][aria-pressed="true"]')}));
        ok(after.sched !== "smart" && after.plan && !after.smartOn, "free: tapping Smart opens the Pro sheet and doesn't switch the deck: " + JSON.stringify(after));
      }
      ok(!errs.length, `${who}: no page errors: ` + errs.join(" | "));
      await ctx.close();
    }
  } finally { await browser.close(); server.close(); }
  console.log(`\nsmart-cards-pro.e2e: ${n} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
