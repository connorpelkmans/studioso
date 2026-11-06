// Browser test: on a phone, opening a sheet never focuses a text box by itself (that popped the keyboard up for a moment,
// so the sheet shrank and stretched back down); on a computer the first box still takes focus
// Run: node tests/sheet-no-autofocus.e2e.js
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const root = path.join(__dirname, "..");
const MIME = {".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".webp": "image/webp", ".json": "application/json", ".woff2": "font/woff2"};
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  res.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
(async () => {
  await new Promise(r => server.listen(0, r)); const url = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  try {
    for (const [w, phone] of [[390, true], [1280, false]]) {
      const ctx = await browser.newContext(phone ? {viewport: {width: 390, height: 844}, isMobile: true, hasTouch: true} : {viewport: {width: 1280, height: 860}});
      await ctx.addInitScript(() => { try { localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "1"); localStorage.setItem("coursework:v2", JSON.stringify({v: 2, courses: [], tasks: [], decks: [], notes: [], files: [], events: [], settings: {}, updated: 1})); } catch (e) {} });
      const page = await ctx.newPage(), errs = []; page.on("pageerror", e => errs.push(e.message));
      await page.goto(url); await page.waitForTimeout(1500);
      await page.evaluate(() => { window.__fo = []; document.addEventListener("focusin", e => { if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) window.__fo.push(e.target.name || e.target.id); }, true); });
      // from an add menu (how Add Group and Add Deck open on a phone)
      await page.evaluate(() => { const b = document.createElement("button"); b.dataset.act = "fab-deck"; document.body.appendChild(b); b.click(); b.remove(); }); await page.waitForTimeout(600);
      await page.click('#dlg .fm-list [data-act="fc-new"]'); await page.waitForTimeout(700);
      const fo = await page.evaluate(() => ({seen: window.__fo.slice(), now: document.activeElement && document.activeElement.tagName}));
      if (phone) ok(!fo.seen.length && fo.now !== "INPUT", w + "px: opening New Deck doesn't focus a text box (" + JSON.stringify(fo) + ")");
      else ok(fo.now === "INPUT", w + "px: on a computer the name box still takes focus (" + JSON.stringify(fo) + ")");
      ok(!errs.length, w + "px: no page errors " + errs.join(" | "));
      await ctx.close();
    }
    console.log(`sheet-no-autofocus.e2e: ${n} checks passed`);
  } finally { await browser.close(); server.close(); }
})().catch(e => { console.error(e); process.exit(1); });
