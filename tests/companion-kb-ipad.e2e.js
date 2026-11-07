// node tests/companion-kb-ipad.e2e.js (Playwright + Chromium; no network) iPad app: the companion's Ask box stays above the keyboard
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert"); const {chromium, executablePath} = require("./pw");
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const root = path.join(__dirname, "..");
const MIME = {".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".webp": "image/webp", ".json": "application/json", ".woff2": "font/woff2"};
const srv = http.createServer((q, r) => { let p = decodeURIComponent(new URL(q.url, "http://x").pathname); if (p === "/") p = "/index.html"; const f = path.join(root, p); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); r.end(); return; } r.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(r); });
(async () => {
  await new Promise(r => srv.listen(0, r)); const b = await chromium.launch({executablePath});
  for (const [w, h, KB] of [[1180, 820, 400], [820, 1180, 330]]) {
    const c = await b.newContext({viewport: {width: w, height: h}, isMobile: true, hasTouch: true});
    await c.addInitScript(() => { window.__SB_TEST = true; localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "1"); localStorage.setItem("studyboard:aiKeys", JSON.stringify({gemini: "AIzaTESTTESTTESTTESTTESTTEST12345"})); localStorage.setItem("studyboard:aiConsent", JSON.stringify({gemini: {v: 1, at: 1}}));
      localStorage.setItem("coursework:v2", JSON.stringify({v: 2, courses: [{id: "c1", name: "Chem", code: "C1", color: "#C2603A"}], tasks: [], decks: [], notes: [], files: [], events: [], settings: {}, updated: 1})); });
    const pg = await c.newPage(); const errs = []; pg.on("pageerror", e => errs.push(e.message));
    await pg.goto(`http://localhost:${srv.address().port}/`); await pg.waitForTimeout(2500);
    await pg.evaluate(() => { const S = window.__sbSync; S.ui.tab = "courses"; S.render(); }); await pg.waitForTimeout(800);
    await pg.evaluate(() => SBCOMP.askOpen()); await pg.waitForSelector(".cp-ask-in", {timeout: 8000}); await pg.focus(".cp-ask-in");
    const inBox = () => pg.evaluate(() => { const i = document.querySelector(".cp-ask-in"), r = i && i.getBoundingClientRect(), v = document.querySelector(".cp-rig"), q = v && v.getBoundingClientRect(); if (!i) { const q2 = v && v.getBoundingClientRect(); return {comp: q2 ? [Math.round(q2.top), Math.round(q2.bottom)] : null}; } return i ? {input: [Math.round(r.top), Math.round(r.bottom)], comp: q ? [Math.round(q.top), Math.round(q.bottom)] : null} : "no input"; });
    const a0 = await inBox();
    // the iOS app's keyboard comes up over the page
    await pg.evaluate(kb => { const r = document.documentElement; r.classList.add("kb-native", "kb-open"); window.sbVisibleH = () => innerHeight - kb; dispatchEvent(new Event("sb-kb-cover")); }, KB);
    await pg.waitForTimeout(1200);
    const a = await inBox();
    ok(a.input[1] <= h - KB && a.comp[1] <= h - KB && a.input[0] >= 0, `${w}x${h}: with the keyboard up, the Ask box and the companion sit above it: ` + JSON.stringify(a));
    await pg.evaluate(() => { document.activeElement.blur(); const r = document.documentElement; r.classList.remove("kb-open"); window.sbVisibleH = () => innerHeight; dispatchEvent(new Event("sb-kb-cover")); });
    await pg.waitForTimeout(1500); const d = await inBox();
    ok(Math.abs(d.comp[1] - a0.comp[1]) <= 3, `${w}x${h}: when it closes, the companion goes back down: ` + JSON.stringify(d) + " was " + JSON.stringify(a0));
    ok(!errs.length, "no page errors: " + errs.join(" | "));
    await c.close();
  }
  await b.close(); srv.close(); console.log(`companion-kb-ipad.e2e: ${n} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
