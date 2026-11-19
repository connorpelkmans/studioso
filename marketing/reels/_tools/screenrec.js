// Records the real Studyboard app at phone size (1080x1920, 9:16) with the app tour's sample semester, for native
// "screen recording" reels. Usage: node screenrec.js <script.json> <outdir>
//   script.json: {"skin":"classic","scheme":"light","tab":"plan","steps":[{"press":"Crunch"},{"hold":1.0},{"scroll":"#view","to":600,"dur":2.5},{"eval":"..."}]}
// Frames go to <outdir>/f00001.png ...; then ffmpeg -framerate 30 -i f%05d.png.
const http = require("http"), fs = require("fs"), path = require("path");
const root = path.resolve(__dirname, "../../..");
const {chromium, executablePath} = require(path.join(root, "tests/pw"));
const src = fs.readFileSync(path.join(root, "tools/capture-store-screens.js"), "utf8");
const {SEED, NOW} = new Function(src.slice(src.indexOf("const NOW"), src.indexOf("// file name, theme")) + "\nreturn {SEED, NOW};")();
const MIME = {".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".png": "image/png", ".css": "text/css", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".webp": "image/webp", ".jpg": "image/jpeg"};
const server = http.createServer((q, r) => { let p = decodeURIComponent(new URL(q.url, "http://x").pathname); if (p === "/") p = "/index.html"; const f = path.join(root, p);
  if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); r.end(); return; }
  if (p === "/index.html" && /[?&]pro=off\b/.test(q.url)) { r.writeHead(200, {"content-type": "text/html"}); r.end(require(path.join(root, "scripts/csp")).apply(require(path.join(root, "scripts/app-files")).source().replace("const PRO_ENFORCED = true", "const PRO_ENFORCED = false"))); return; }
  r.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(r); });
const spec = JSON.parse(fs.readFileSync(process.argv[2], "utf8")), OUT = process.argv[3];
fs.mkdirSync(OUT, {recursive: true}); fs.readdirSync(OUT).filter(f => /^f\d+\.png$/.test(f)).forEach(f => fs.unlinkSync(path.join(OUT, f)));
const FPS = 30; let n = 0;
const ease = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
(async () => {
  await new Promise(r => server.listen(0, r)); const browser = await chromium.launch({executablePath});
  const ctx = await browser.newContext({viewport: {width: spec.vw || 432, height: spec.vh || 768}, deviceScaleFactor: spec.dsf || 2.5, isMobile: true, hasTouch: true, colorScheme: spec.scheme || "light", serviceWorkers: "block",
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148"});
  await ctx.clock.setFixedTime(NOW);
  const seed = JSON.parse(JSON.stringify(SEED)); seed.settings.style = {skin: spec.skin || "classic"}; seed.settings.owned = ["skin:" + (spec.skin || "classic")];
  await ctx.addInitScript(([seed, scheme]) => { try { if (!localStorage.getItem("coursework:v2")) {
    localStorage.setItem("coursework:v2", JSON.stringify(seed)); localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "1");
    localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:theme", scheme); } } catch (e) {} }, [seed, spec.scheme || "light"]);
  const page = await ctx.newPage();
  await page.goto("http://localhost:" + server.address().port + "/?pro=off"); await page.waitForSelector("#view", {state: "attached"}); await page.waitForTimeout(3000);
  await page.addStyleTag({content: ".toast,#toast{display:none!important}*{scroll-behavior:auto!important}"});
  const dismiss = async () => { for (let i = 0; i < 4; i++) { await page.evaluate(() => {
    [...document.querySelectorAll("button")].filter(b => /^(Not now|No Thanks|Dismiss|Later|Not This Week|Skip|Got It|Maybe Later)$/i.test(b.textContent.trim()) && b.offsetParent).forEach(b => b.click());
    document.querySelectorAll("dialog[open]").forEach(d => d.close()); }); await page.waitForTimeout(200); } };
  await dismiss();
  if (spec.tab) { await page.evaluate(t => { const b = document.querySelector(`nav.tabs [data-tab="${t}"]`); if (b) b.click(); }, spec.tab); await page.waitForTimeout(1200); }
  const shot = async () => { n++; await page.screenshot({path: path.join(OUT, `f${String(n).padStart(5, "0")}.png`)}); };
  const hold = async s => { await shot(); const first = path.join(OUT, `f${String(n).padStart(5, "0")}.png`);
    for (let i = 1; i < Math.round(s * FPS); i++) { n++; fs.copyFileSync(first, path.join(OUT, `f${String(n).padStart(5, "0")}.png`)); } };
  for (const s of spec.steps) {
    if (s.press) { const ok = await page.evaluate(l => { const b = [...document.querySelectorAll("button, [role=tab], a")].find(e => e.offsetParent && e.textContent.trim().replace(/\s*\d+$/, "") === l && !e.closest("nav.tabs")); if (b) b.click(); return !!b; }, s.press);
      if (!ok) console.warn("no button:", s.press); await page.waitForTimeout(900); await dismiss(); }
    if (s.eval) { await page.evaluate(s.eval); await page.waitForTimeout(s.wait != null ? s.wait * 1000 : 900); }
    if (s.css) await page.addStyleTag({content: s.css});
    if (s.hold) await hold(s.hold);
    if (s.scroll) { const from = await page.evaluate(sel => { const e = sel === "window" ? document.scrollingElement : document.querySelector(sel); return e ? e.scrollTop : 0; }, s.scroll);
      const frames = Math.round(s.dur * FPS);
      for (let i = 1; i <= frames; i++) { const y = from + (s.to - from) * ease(i / frames);
        await page.evaluate(([sel, y]) => { const e = sel === "window" ? document.scrollingElement : document.querySelector(sel); if (e) e.scrollTop = y; }, [s.scroll, y]); await shot(); } }
    if (s.snap) await shot();
    // Type into a field one character at a time, a frame or two per character, like a person typing
    if (s.type) { await page.click(s.type); for (const ch of s.text) { await page.keyboard.type(ch); await page.waitForTimeout(30); await shot(); if (s.slow) await shot(); } }
    if (s.key) { await page.keyboard.press(s.key); await page.waitForTimeout(s.wait != null ? s.wait * 1000 : 900); await dismiss(); }
  }
  await browser.close(); server.close(); console.log(`${n} frames (${(n / FPS).toFixed(2)} s) in ${OUT}`);
})().catch(e => { console.error(e); process.exit(1); });
