// node tests/add-card-steady.e2e.js: in the iPhone and iPad app (real native bridge, a stand-in keyboard plugin), Add Card opens
// straight into place: no lift for a keyboard iOS won't show for a box the sheet focuses by itself
const assert = require("assert"); let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const http = require("http"), fs = require("fs"), path = require("path");
const {chromium, executablePath} = require("./pw");
const root = path.join(__dirname, "..");
const MIME = {".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".css": "text/css"};
const server = http.createServer((req, res) => { let p = decodeURIComponent(new URL(req.url, "http://x").pathname); if (p === "/") p = "/index.html"; const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; } res.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res); });
const BRIDGE = fs.readFileSync(path.join(root, "ios-wrapper", "native-bridge.js"), "utf8");
const SEED = {v: 2, courses: [], tasks: [], files: [], events: [], settings: {}, updated: 1, notes: [], decks: [{id: "d1", name: "Psych Theories", cards: [{id: "k1", q: "Id", a: "Instincts"}]}]};
(async () => {
  await new Promise(r => server.listen(0, r));
  const b = await chromium.launch({executablePath});
  try {
    for (const [w, h, idiom] of [[402, 874, "phone"], [820, 1180, "pad"]]) {
      const ctx = await b.newContext({viewport: {width: w, height: h}, isMobile: true, hasTouch: true});
      await ctx.addInitScript(([seed, idiom]) => { window.__SB_TEST = true; try { localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "1"); if (!localStorage.getItem("coursework:v2")) localStorage.setItem("coursework:v2", JSON.stringify(seed)); } catch (e) {}
        window.StudyboardDevice = Object.freeze({idiom});
        window.Capacitor = {isNativePlatform: () => true, getPlatform: () => "ios", Plugins: {ScreenOrientation: {lock: () => Promise.resolve(), unlock: () => Promise.resolve()}, Keyboard: {setScroll: () => Promise.resolve(), setAccessoryBarVisible: () => Promise.resolve(), addListener: (ev, fn) => { (window.__kbL = window.__kbL || {})[ev] = fn; return Promise.resolve({remove(){}}); }}}}; }, [SEED, idiom]);
      await ctx.addInitScript(BRIDGE);
      const page = await ctx.newPage(); const errs = []; page.on("pageerror", e => errs.push(e.message));
      await page.goto("http://localhost:" + server.address().port + "/"); await page.waitForTimeout(1200);
      await page.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
      // the keyboard has been up once already, so its height is known
      await page.evaluate(() => { window.__kbL.keyboardWillShow({keyboardHeight: 336}); window.__kbL.keyboardWillHide && window.__kbL.keyboardWillHide(); }); await page.waitForTimeout(300);
      await page.evaluate(() => { const x = document.createElement("button"); x.dataset.act = "fc-add"; x.dataset.id = "d1"; x.hidden = true; document.body.appendChild(x); x.click(); x.remove(); });
      const tops = [];
      for (let i = 0; i < 14; i++) { tops.push(await page.evaluate(() => { const s = document.querySelector("dialog[open] .fc-add"); return s ? Math.round(s.getBoundingClientRect().top) : null; })); await page.waitForTimeout(80); }
      const settled = tops[tops.length - 1], kb = await page.evaluate(() => document.documentElement.classList.contains("kb-open"));
      ok(settled != null && tops.slice(4).every(t => Math.abs(t - settled) <= 2) && !kb, `${idiom}: Add Card opens in place, with no rise for a keyboard that isn't coming: ` + tops.join(","));
      ok(!errs.length, `${idiom}: no page errors: ` + errs.join(" | "));
      await ctx.close();
    }
    console.log(`add-card-steady.e2e: ${n} checks passed`);
  } catch (e) { console.error(e); process.exitCode = 1; }
  finally { await b.close(); server.close(); }
})();
