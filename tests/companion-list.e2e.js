// node tests/companion-list.e2e.js (Playwright + Chromium; see tests/pw.js)
// Long companion lists (Style Shop: every theme's companions; Change Companion: other themes) scroll smoothly:
// still pictures instead of live drawings, made into bitmaps once and kept between visits
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const root = path.join(__dirname, "..");
const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x"); let p = decodeURIComponent(u.pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  const ext = path.extname(f), mime = {".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".css": "text/css", ".webmanifest": "application/manifest+json"};
  res.writeHead(200, {"content-type": mime[ext] || "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const act = (p, a, id) => p.evaluate(([a, i]) => { const b = document.createElement("button"); b.dataset.act = a; if (i) b.dataset.id = i; b.style.display = "none"; document.body.appendChild(b); b.click(); b.remove(); }, [a, id]);
(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  try {
    const ctx = await browser.newContext({viewport: {width: 390, height: 844}, serviceWorkers: "block", deviceScaleFactor: 2});
    await ctx.addInitScript(() => { if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("coursework:v2", JSON.stringify({v: 2, updated: 1, settings: {}, courses: [], tasks: []})); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("studyboard:tour", "done"); } });
    const p = await ctx.newPage(); const errs = []; p.on("pageerror", e => errs.push(e.message));
    await p.goto(base); await p.waitForTimeout(1200);
    const total = await p.evaluate(() => SBCOMP.all().length);

    // Style Shop: every theme's companions
    await act(p, "style-shop"); await p.waitForTimeout(400); await act(p, "shop-tab", "companions"); await p.waitForTimeout(300);
    await p.evaluate(() => document.querySelector('[data-act="comp-more"]').click()); await p.waitForTimeout(200);
    const shop = await p.evaluate(() => ({stills: document.querySelectorAll(".cp-all img.cp-still").length, svgs: document.querySelectorAll(".cp-all svg").length, tiles: document.querySelectorAll(".cp-all .cp-mini").length}));
    ok(shop.tiles > 100 && shop.stills === shop.tiles && shop.svgs === 0, "every theme's companions are still pictures, not live drawings: " + JSON.stringify(shop));
    await p.waitForFunction(() => [...document.querySelectorAll(".cp-all img.cp-still")].every(i => i.src.startsWith("blob:")), null, {timeout: 90000});
    ok(true, "each picture becomes a bitmap in the background");
    const box = await p.evaluate(async () => { const i = document.querySelector(".cp-all img.cp-still"); i.scrollIntoView({block: "center"}); await i.decode().catch(() => {}); const b = i.parentElement.getBoundingClientRect(); return {w: Math.round(b.width), h: Math.round(b.height), nat: i.naturalWidth}; });
    ok(box.w === 64 && box.h === 64 && box.nat >= 83, "pictures keep the 64px tile size with a sharp bitmap: " + JSON.stringify(box));
    await p.waitForTimeout(2200);
    const saved = await p.evaluate(async () => { const v = await SBUI.cacheGet("studyboard:compStills:v2"); return v ? Object.keys(v).length : 0; });
    ok(saved >= total, `bitmaps are saved for next time (${saved} of ${total})`);

    // Change Companion: other themes' companions are still pictures too (no live animation per tile)
    await p.evaluate(() => document.querySelector("dialog").close()); await p.waitForTimeout(300);
    await act(p, "comp-change"); await p.waitForTimeout(400);
    await p.evaluate(() => { const d = document.querySelector(".cp-oth-d"); d.open = true; }); await p.waitForTimeout(400);
    const ch = await p.evaluate(() => ({live: document.querySelectorAll(".cp-oth .cp-prev").length, stills: document.querySelectorAll(".cp-oth img.cp-still").length, mine: document.querySelectorAll(".cp-tiles .cp-prev").length}));
    ok(ch.stills > 100 && ch.live === 0, "other themes' companions are still pictures: " + JSON.stringify(ch));
    ok(ch.mine > 0, "this theme's companions stay live and animated");

    // Next visit: the saved bitmaps are used straight away
    await p.reload(); await p.waitForTimeout(8000);
    await act(p, "style-shop"); await p.waitForTimeout(400); await act(p, "shop-tab", "companions"); await p.waitForTimeout(200);
    await p.evaluate(() => document.querySelector('[data-act="comp-more"]').click()); await p.waitForTimeout(100);
    const again = await p.evaluate(() => { const s = [...document.querySelectorAll(".cp-all img.cp-still")]; return {all: s.length, blob: s.filter(i => i.src.startsWith("blob:")).length}; });
    ok(again.all > 100 && again.blob === again.all, "after a reload every picture is a saved bitmap at once: " + JSON.stringify(again));

    ok(!errs.length, "no page errors" + (errs.length ? ": " + errs.join(" | ") : ""));
    console.log("\ncompanion-list.e2e: " + n + " checks passed");
  } finally { await browser.close(); server.close(); }
})().catch(e => { console.error(e); process.exit(1); });
