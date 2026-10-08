// node tests/course-title.e2e.js  (Playwright + Chromium)
// The course name on a course's page must stay readable on every theme, light and dark: it sits on its own solid card (opaque, with text/surface colors that contrast well).
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const root = path.join(__dirname, ".."), SHOTS = process.env.SHOTS || path.join(require("os").tmpdir(), "ct-shots");
fs.mkdirSync(SHOTS, {recursive: true});
const MIME = {".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".webmanifest": "application/manifest+json", ".png": "image/png", ".css": "text/css", ".woff2": "font/woff2", ".svg": "image/svg+xml"};
const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x"); let p = decodeURIComponent(u.pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  res.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
const lum = c => { const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; return .2126 * f(c[0]) + .7152 * f(c[1]) + .0722 * f(c[2]); };
const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
const rgba = s => (s.match(/[\d.]+/g) || []).map(Number);
let n = 0; const ok = (c, m) => { n++; assert(c, m); if (!/^theme /.test(m)) console.log("ok -", m); };
(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath}); const bad = [];
  try {
    let themes = null;
    for (const mode of ["light", "dark"]) {
      const open = async (skin, w = 1280) => {
        const ctx = await browser.newContext({viewport: {width: w, height: w < 500 ? 780 : 900}, colorScheme: mode});
        await ctx.addInitScript(([skin, mode]) => { localStorage.setItem("coursework:v2", JSON.stringify({v: 2, courses: [{id: "c1", name: "Marine Biology and Ocean Systems", code: "BIO210", color: "#3B6FE0"}], settings: {style: {skin}}, updated: 1, tasks: []}));
          ["sb:onboarded", "studioso:welcomed"].forEach(k => localStorage.setItem(k, "1")); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("studyboard:tour", "done"); localStorage.setItem("studioso:theme", mode); }, [skin, mode]);
        const page = await ctx.newPage(); page.errs = []; page.on("pageerror", e => page.errs.push(e.message));
        await page.goto(base); await page.waitForFunction(() => window.SBTP);
        if (!themes) themes = await page.evaluate(() => ["classic", ...SBTP.themes()]);
        await page.click('[data-tab="courses"]'); await page.waitForSelector('[data-act="open-course"]'); await page.click('[data-act="open-course"]'); await page.waitForSelector(".detail-head h2");
        return {ctx, page};
      };
      const first = await open("classic"); await first.ctx.close();
      for (const skin of themes) {
        const {ctx, page} = await open(skin);
        const r = await page.$eval(".detail-head", hd => { const h = hd.querySelector("h2"), s = getComputedStyle(hd), t = getComputedStyle(h), c = hd.querySelector(".code"); return {bg: s.backgroundColor, ink: t.color, code: c ? getComputedStyle(c).color : "", shadow: t.textShadow}; });
        const bg = rgba(r.bg), ink = rgba(r.ink), code = rgba(r.code);
        const opaque = bg.length < 4 || bg[3] === 1, cr = ratio(ink.slice(0, 3), bg.slice(0, 3)), cc = code.length ? ratio(code.slice(0, 3), bg.slice(0, 3)) : 21;
        if (!opaque || cr < 7 || cc < 4.5 || page.errs.length) bad.push(`${mode}/${skin}: bg ${r.bg} name ${cr.toFixed(1)}:1 code ${cc.toFixed(1)}:1 ${page.errs.join(";")}`);
        await ctx.close();
      }
      ok(bad.length === 0, `${mode}: the course name has solid, high-contrast backing on all ${themes.length} themes` + (bad.length ? "\n  " + bad.join("\n  ") : ""));
    }
    // a long name wraps instead of running off, at phone width, and the page does not scroll sideways
    { const {ctx, page} = await open2(); await ctx.close(); }
    async function open2() {
      const ctx = await browser.newContext({viewport: {width: 390, height: 780}});
      await ctx.addInitScript(() => { localStorage.setItem("coursework:v2", JSON.stringify({v: 2, courses: [{id: "c1", name: "Introduction to Computational Linguistics and Natural Language Processing Seminar", code: "LING4390XYZ", color: "#3B6FE0"}], settings: {style: {skin: "reading"}}, updated: 1, tasks: []}));
        ["sb:onboarded", "studioso:welcomed"].forEach(k => localStorage.setItem(k, "1")); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("studyboard:tour", "done"); });
      const page = await ctx.newPage(); await page.goto(base); await page.waitForSelector('[data-tab="courses"]'); await page.click('[data-tab="courses"]'); await page.click('[data-act="open-course"]'); await page.waitForSelector(".detail-head h2");
      const w = await page.evaluate(() => ({doc: document.documentElement.scrollWidth - document.documentElement.clientWidth, h2: document.querySelector(".detail-head").getBoundingClientRect().right <= innerWidth}));
      ok(w.doc <= 1 && w.h2, "a long course name stays inside the screen at phone width");
      await page.screenshot({path: path.join(SHOTS, "course-390.png")}); return {ctx, page};
    }
  } finally { await browser.close(); server.close(); }
  console.log(`\n${n} checks passed. Screenshots in ${SHOTS}`);
})().catch(e => { console.error(e); process.exit(1); });
