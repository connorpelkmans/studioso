// Browser test: the calculator in every theme. For each theme it reads the calculator's own colours and checks that every
// label is at least 4.5:1 against its key or the body (also where a label sits on the body's pattern), the close button 3:1.
// Run: node tests/calculator-themes.e2e.js [screenshot folder]   (with a folder: a picture of the calculator in each theme)
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const root = path.join(__dirname, ".."), SHOTS = process.argv[2] || "";
const MIME = {".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".css": "text/css", ".woff2": "font/woff2", ".png": "image/png", ".svg": "image/svg+xml", ".webp": "image/webp"};
const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x"); let p = decodeURIComponent(u.pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  res.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
let n = 0; const ok = (c, m) => { n++; assert(c, m); };
const hex = c => { c = String(c).trim().replace(/^#/, ""); if (c.length === 3) c = c.split("").map(x => x + x).join(""); return /^[0-9a-f]{6}$/i.test(c) ? [0, 2, 4].map(i => parseInt(c.slice(i, i + 2), 16) / 255) : null; };
const lum = c => { const f = v => v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; const [r, g, b] = c.map(f); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const cr = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const blend = (bg, fg, a) => bg.map((v, i) => v + (fg[i] - v) * a);
const PAIRS = [["fnink", ["fn1", "fn2"], "function keys"], ["fnink", ["md1", "md2"], "mode keys"], ["nmink", ["nm1", "nm2"], "number keys"], ["opink", ["op1", "op2"], "operator keys"],
  ["dlink", ["dl1", "dl2"], "DEL and AC"], ["eqink", ["eq1", "eq2"], "="], ["shink", ["sh1", "sh2"], "SHIFT"], ["lcdink", ["lcd1", "lcd2"], "screen"],
  ["alt", ["b1", "b2", "b3"], "second-function labels", true], ["brand", ["b1"], "brand", true], ["brand2", ["b1"], "brand fx", true]];

(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  const ctx = await browser.newContext({viewport: {width: 1280, height: 900}, deviceScaleFactor: SHOTS ? 2 : 1});
  await ctx.addInitScript(() => { try { if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "1"); localStorage.setItem("coursework:v2", JSON.stringify({v: 2, courses: [], tasks: [], decks: [], notes: [], files: [], events: [], settings: {}, updated: 1})); } } catch (e) {} });
  const page = await ctx.newPage(), errs = [];
  page.on("pageerror", e => errs.push(e.message));
  await page.goto(base); await page.waitForTimeout(1200);
  // paid themes stay on (in this test browser the app would otherwise switch a theme it doesn't own back to Classic)
  await page.evaluate(() => { window.__sbPlanObj().isPro = () => true; });
  const ids = await page.evaluate(() => window.SBCALCSKIN.ids());
  ok(ids.length >= 50, `every theme is covered (${ids.length})`);
  await page.evaluate(() => window.SBCALC.open()); await page.waitForTimeout(300);
  const failures = [];
  for (const id of ids) {
    const r = await page.evaluate(id => {
      // choose the theme the way the Style Shop does: the saved setting, then a redraw applies it
      const st = window.__sbProStudy.state(); st.settings = Object.assign({}, st.settings, {style: Object.assign({}, st.settings.style, {skin: id})}); window.__sbProStudy.render();
      const el = document.getElementById("calc"); window.SBCALCSKIN.apply(el); if (document.activeElement) document.activeElement.blur();
      const cs = getComputedStyle(el), v = {};
      ["b1", "b2", "b3", "fn1", "fn2", "fnink", "md1", "md2", "nm1", "nm2", "nmink", "op1", "op2", "opink", "dl1", "dl2", "dlink", "eq1", "eq2", "eqink", "sh1", "sh2", "shink", "lcd1", "lcd2", "lcdink", "alt", "brand", "brand2", "xink"].forEach(k => { v[k] = cs.getPropertyValue("--" + k).trim(); });
      const t = window.SBCALCSKIN.varsFor(id), deco = cs.getPropertyValue("--deco").trim();
      return {v, keys: t && t.keys, tone: (t && t.tone) || "#ffffff", a: t ? window.SBCALCSKIN.strength(t) : 0, skin: el.dataset.cxskin || "", hasPattern: deco !== "none" && deco !== ""};
    }, id);
    ok(id === "classic" ? !r.skin : r.skin === id, `${id}: the calculator takes the theme`);
    for (const [fg, bgs, what, onPattern] of PAIRS) {
      const f = hex(r.v[fg]); if (!f) { failures.push(`${id}: ${what} colour unreadable (${r.v[fg]})`); continue; }
      let w = Math.min(...bgs.map(b => cr(f, hex(r.v[b]))));
      if (onPattern && r.hasPattern) w = Math.min(w, ...bgs.map(b => cr(f, blend(hex(r.v[b]), hex(r.tone), r.a))));
      if (w < 4.5) failures.push(`${id}: ${what} ${w.toFixed(2)}:1`);
    }
    // single keys in their own colour
    for (const [k, [c1, c2, ink]] of Object.entries(r.keys || {})) { const w = Math.min(cr(hex(ink), hex(c1)), cr(hex(ink), hex(c2))); if (w < 4.5) failures.push(`${id}: the ${k} key ${w.toFixed(2)}:1`); }
        const x = hex(r.v.xink); if (x && cr(x, hex(r.v.b1)) < 3) failures.push(`${id}: close button ${cr(x, hex(r.v.b1)).toFixed(2)}:1`);
    await page.waitForTimeout(120);
    ok(await page.evaluate(id => (document.getElementById("calc").dataset.cxskin || "classic") === id, id), `${id}: still on after the app settles`);
    if (SHOTS) { await page.locator("#calc").screenshot({path: path.join(SHOTS, `calc-${id}.png`)}); }
  }
  ok(!failures.length, "every label in every theme is readable:\n  " + failures.join("\n  "));
  console.log(`ok - every label in ${ids.length} themes is at least 4.5:1, also on the patterns`);
  ok(!errs.length, "no page errors: " + errs.join(" | "));
  await browser.close(); server.close();
  console.log(`calculator-themes.e2e.js: ${n} checks passed`);
})().catch(e => { console.error(e.message || e); server.close(); process.exit(1); });
