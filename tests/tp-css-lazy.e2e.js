// The Theme Collection card styles (bundle/tp.css, about 650 KB) load only when they're needed
"use strict";
const fs = require("fs"), path = require("path"), http = require("http"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const csp = require("../scripts/csp"), AF = require("../scripts/app-files");
const root = path.join(__dirname, "..");
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };

const asked = [];
const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x"); let p = decodeURIComponent(u.pathname); if (p === "/") p = "/index.html";
  asked.push(p);
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  const mime = {".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".css": "text/css", ".png": "image/png", ".woff2": "font/woff2"}[path.extname(f)];
  res.writeHead(200, {"content-type": mime || "application/octet-stream"});
  if (p === "/index.html" || p === "/bundle/app.js") { res.end((p === "/index.html" ? csp.apply : String)(fs.readFileSync(f, "utf8").replace("const PRO_ENFORCED = true;", "const PRO_ENFORCED = false;"))); return; }
  fs.createReadStream(f).pipe(res);
});
const tpAsked = () => asked.filter(p => p === "/bundle/tp.css").length;

(async () => {
  const appCss = fs.readFileSync(path.join(root, "bundle", "app.css"), "utf8"), tpCss = fs.readFileSync(path.join(root, "bundle", "tp.css"), "utf8");
  ok(!/\.cs-tp-[a-z]/.test(appCss) && /\.cs-tp-sakura \.face/.test(tpCss), "the app's style sheet doesn't carry the Theme Collection card styles; bundle/tp.css does");
  ok(AF.refs(fs.readFileSync(path.join(root, "index.html"), "utf8")).includes("tp.css"), "index.html names bundle/tp.css (so the offline cache and the app builds take it too)");
  const one = AF.source();
  ok(/<style data-lazy="tp\.css">[\s\S]*\.cs-tp-sakura/.test(one), "the one-page form carries it inline");

  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  try {
    const ctx = await browser.newContext({viewport: {width: 1280, height: 800}, serviceWorkers: "block"});
    await ctx.addInitScript(() => {
      try { if (!sessionStorage.getItem("seeded")) { localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "done"); localStorage.setItem("studioso:welcomed", "1");
        localStorage.setItem("coursework:v2", JSON.stringify({v: 2, updated: 1, courses: [], tasks: [], settings: {}, decks: [{id: "d1", name: "Cells", courseId: "", created: 1, cards: [{id: "k1", front: "Mitochondria", back: "Powerhouse"}]}]}));
        sessionStorage.setItem("seeded", "1"); } } catch (e) {}
      document.addEventListener("DOMContentLoaded", () => { window.__tpAtStart = !!document.querySelector('link[data-lazy="tp.css"]'); });
    });
    const page = await ctx.newPage();
    const errors = []; page.on("pageerror", e => errors.push(String(e && e.message || e)));
    const act = (a, data) => page.evaluate(([a, data]) => { const b = document.createElement("button"); b.dataset.act = a; Object.assign(b.dataset, data || {}); document.body.appendChild(b); b.click(); b.remove(); }, [a, data]);
    const face = () => page.evaluate(() => { const f = document.querySelector('.cs-demo.cs-tp-sakura .face, .flip.cs-tp-sakura .face, .deck.cs-tp-sakura .face'); return f ? getComputedStyle(f).backgroundImage : ""; });

    await page.goto(base); await page.waitForFunction(() => window.__sbProStudy, null, {timeout: 40000}); await page.waitForTimeout(1500);
    await page.evaluate(() => { const S = window.__sbProStudy; S.ui.tab = "flashcards"; S.render(); });
    await page.waitForTimeout(800);
    ok(tpAsked() === 0, "with the default card style, the Theme Collection card styles aren't fetched");

    await act("shop"); await page.waitForSelector("dialog[open] .sheet.shop");
    await page.evaluate(() => { const b = document.querySelector('dialog[open] [data-act="shop-tab"][data-id="cards"], dialog[open] .us-cat[data-us="cards"], dialog[open] [data-tab="cards"], dialog[open] [data-id="cards"]'); if (b) b.click(); });
    await page.waitForFunction(() => window.SBTPCSS && window.SBTPCSS.loaded() && !document.documentElement.classList.contains("tpcss-loading"), null, {timeout: 15000});
    ok(tpAsked() === 1, "opening the Style Shop loads them once");
    await page.keyboard.press("Escape"); await page.waitForTimeout(200);

    await page.evaluate(() => { const S = window.__sbProStudy, st = S.state(); st.settings = Object.assign({}, st.settings, {style: Object.assign({}, st.settings.style, {card: "tp-sakura", cardAuto: false})}); S.render(); });
    await page.waitForTimeout(300);
    ok(await page.evaluate(() => localStorage.getItem("studyboard:tpcss")) === "1", "using one of them is remembered on this device");
    ok(/url\(/.test(await face()), "a deck in that style is drawn in it");

    asked.length = 0;
    await page.evaluate(() => { const S = window.__sbProStudy; localStorage.setItem("coursework:v2", JSON.stringify(Object.assign({v: 2}, (() => { const st = S.state(); return {updated: Date.now(), courses: [], tasks: [], decks: Object.values(st.decks), settings: st.settings}; })()))); });
    await page.reload(); await page.waitForFunction(() => window.__sbProStudy, null, {timeout: 40000}); await page.waitForTimeout(1500);
    ok(tpAsked() === 1 && await page.evaluate(() => window.__tpAtStart), "the next start loads them with the page (before the app runs), once");
    ok(!errors.length, "no page errors: " + errors.slice(0, 3).join(" | "));
  } finally { await browser.close(); server.close(); }
  console.log(`\ntp-css-lazy: ${n} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
