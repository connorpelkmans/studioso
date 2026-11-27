// node tests/ai-16gb-tag.e2e.js  AI Features: "Unavailable on Your Device" on Studyboard AI 16GB only when this device certainly
// can't run it (a phone or tablet, or memory reliably known to be under 16 GB), and never on a computer that could
// (Chrome or Edge before 147 report at most 8 GB, Safari and Firefox report nothing: those get no tag).
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
const SHOT = process.env.AI16_SHOT || "";
const DESK_UA = v => `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${v}.0.0.0 Safari/537.36`;
const SAFARI_UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/19.0 Safari/605.1.15";
const PHONE_UA = "Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36";
// mem: navigator.deviceMemory (null = not reported), chrome: the Chromium version userAgentData reports (0 = none), desk: the desktop app's exact RAM in GB
const CASES = [
  {name: "Chrome 150, 8 GB reported", ua: DESK_UA(150), mem: 8, chrome: 150, tag: true},
  {name: "Chrome 150, 4 GB reported", ua: DESK_UA(150), mem: 4, chrome: 150, tag: true},
  {name: "Chrome 140, 8 GB reported (could be a 16 GB computer)", ua: DESK_UA(140), mem: 8, chrome: 140, tag: false},
  {name: "Chrome 150, 16 GB reported", ua: DESK_UA(150), mem: 16, chrome: 150, tag: false},
  {name: "Chrome 150, 32 GB reported", ua: DESK_UA(150), mem: 32, chrome: 150, tag: false},
  {name: "Safari, memory not reported", ua: SAFARI_UA, mem: null, chrome: 0, tag: false},
  {name: "desktop app, 8 GB of RAM", ua: DESK_UA(150), mem: 8, chrome: 150, desk: 8, tag: true},
  {name: "desktop app, a 16 GB computer (reports 15.8)", ua: DESK_UA(150), mem: 8, chrome: 150, desk: 15.8, tag: false},
  {name: "Android phone", ua: PHONE_UA, mem: 8, chrome: 150, mobile: true, tag: true, phone: true}
];
(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  try {
    for (const c of CASES) {
      const vp = c.phone ? {width: 402, height: 874} : {width: 1300, height: 860};
      const ctx = await browser.newContext({serviceWorkers: "block", viewport: vp, isMobile: !!c.phone, hasTouch: !!c.phone, userAgent: c.ua});
      await ctx.addInitScript(require("./consent-ok")); await ctx.routeWebSocket(/supabase\.co/, ws => ws.close()); await ctx.route(/supabase\.co|googleapis|huggingface|workers\.dev/, r => r.abort());
      await ctx.addInitScript(cs => {
        const def = (o, k, v) => { try { Object.defineProperty(o, k, {get: () => v, configurable: true}); } catch (e) {} };
        if (cs.mem == null) { try { delete Navigator.prototype.deviceMemory; } catch (e) {} def(Navigator.prototype, "deviceMemory", undefined); } else def(Navigator.prototype, "deviceMemory", cs.mem);
        def(Navigator.prototype, "userAgentData", cs.chrome ? {brands: [{brand: "Chromium", version: String(cs.chrome)}, {brand: "Google Chrome", version: String(cs.chrome)}], mobile: !!cs.mobile, platform: cs.mobile ? "Android" : "Windows"} : undefined);
        if (cs.desk) window.studiosoDesktop = Object.assign(window.studiosoDesktop || {}, {aiModel: {info: async () => ({ram: cs.desk * 1073741824, size: 0, have: 0})}});
        localStorage.setItem("coursework:v2", JSON.stringify({v: 2, updated: 1, courses: [], tasks: [], events: [], notes: [], decks: [], files: [], settings: {}}));
        localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("studyboard:tour", "done");
      }, c);
      const page = await ctx.newPage(); const errs = []; page.on("pageerror", e => errs.push(e.message));
      await page.goto(base); await page.waitForFunction(() => typeof window.SBESS !== "undefined", null, {timeout: 40000}); await page.waitForTimeout(2500);
      await page.evaluate(() => { const b = document.createElement("button"); b.dataset.act = "ai-setup"; b.style.display = "none"; document.body.appendChild(b); b.click(); b.remove(); });
      await page.waitForSelector("dialog[open] .ai-tiers", {timeout: 8000}); await page.waitForTimeout(400);
      const r = await page.evaluate(() => {
        const tiers = [...document.querySelectorAll("dialog[open] .ai-tier")], row = tiers.find(t => /16GB/.test(t.querySelector("b").textContent));
        const tag = row && row.querySelector(".ai-tier-na"), others = tiers.filter(t => t !== row).some(t => t.querySelector(".ai-tier-na"));
        if (row) row.open = true;
        const why = row ? [...row.querySelectorAll(".ai-tier-fact")].map(f => f.textContent.replace(/\s+/g, " ").trim()).find(t => /^On This Device/.test(t)) || "" : "";
        const tr = tag && tag.getBoundingClientRect(), rr = row && row.querySelector(".ai-tier-top").getBoundingClientRect();
        return {row: !!row, tag: tag ? tag.textContent.trim() : "", others, why, inRow: !!tag && tr.right <= rr.right + 1 && tr.left >= rr.left - 1, pro: !!document.querySelector("dialog[open] .ai-tier.pro .pro-badge")};
      });
      ok(r.row && r.pro, `${c.name}: the 16GB level and AI Pro's PRO tag are listed`);
      if (c.tag) {
        ok(r.tag === "Unavailable on Your Device" && r.inRow, `${c.name}: tagged "Unavailable on Your Device" next to its name: ` + JSON.stringify(r));
        ok(c.phone ? /not phones/.test(r.why) && /AI Pro works on any device/.test(r.why) && !/8GB/.test(r.why) : /needs 16 GB/.test(r.why) && /8GB AI may run here/.test(r.why), `${c.name}: its details say why, and what works instead: ` + r.why);
      } else ok(!r.tag && !r.why, `${c.name}: no tag (it could run here, or there's no way to be sure): ` + JSON.stringify(r));
      ok(!r.others, `${c.name}: no other level gets the tag`);
      if (SHOT && (c.tag || /16 GB reported/.test(c.name))) { const d = await page.$("dialog[open] .ai-tiers"); await d.screenshot({path: path.join(SHOT, `ai16-${c.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.png`)}); }
      // (the desktop-app cases fake only the AI model's corner of the app's desktop bridge, so other desktop code errors; skip those)
      if (!c.desk) ok(!errs.length, `${c.name}: no page errors ` + errs.join(" | "));
      await ctx.close();
    }
  } finally { await browser.close(); server.close(); }
  console.log(`\nai-16gb-tag.e2e: ${n} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
