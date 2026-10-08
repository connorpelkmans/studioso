// node tests/collection-preview.e2e.js  (Playwright + Chromium)
// Free plan: 3 different Pro collections can be previewed for 5 minutes each; the earlier theme comes back when time is up; then no more previews.
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium} = require("/opt/node-tools/node_modules/playwright");
const root = path.join(__dirname, "..");
const MIME = {".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".webmanifest": "application/manifest+json", ".png": "image/png", ".css": "text/css", ".svg": "image/svg+xml", ".woff2": "font/woff2"};
const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x"); let p = decodeURIComponent(u.pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  res.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch();
  try {
    const ctx = await browser.newContext({serviceWorkers: "block"});
    await ctx.addInitScript(() => { try { localStorage.setItem("studyboard:paywall-test", "1"); localStorage.setItem("sb:onboarded", "1"); } catch (e) {} });
    const page = await ctx.newPage(); const errs = []; page.on("pageerror", e => errs.push(e.message));
    await page.goto(base); await page.waitForFunction(() => window.__sbCollPreview && window.__sbCollPreview.state && window.__sbCollPreview.state.settings, null, {timeout: 40000});
    const r = await page.evaluate(() => ({ok: !!window.__sbCollPreview}));
    ok(r.ok, "the preview hooks are present");
    const ids = await page.evaluate(() => {
      // pick four Pro collection themes through the shop's own list: any Pro skin that the collections module knows
      const T = window.SBTP; return T && T.ordered ? T.ordered().filter(id => { const rec = T.rec(id); return rec; }) : [];
    });
    ok(ids.length >= 5, "Theme Collections are loaded (" + ids.length + ")");
    const res = await page.evaluate(ids => {
      const C = window.__sbCollPreview, out = {};
      const pro = ids.filter(id => !C.owns("skin", id));
      out.proCount = pro.length; if (pro.length < 4) return out;
      out.before = C.shown(); out.canFirst = C.canStart(pro[0]); out.left0 = C.left();
      C.start(pro[0]);
      out.during = C.shown() === pro[0]; out.banner = !!document.getElementById("cpBanner"); out.left1 = C.left();
      out.secondBlockedWhileRunning = !C.canStart(pro[1]);
      const it = C.items(pro[0]); out.ownsPack = it.sticker.length ? C.owns("sticker", it.sticker[0]) : true; out.ownsPin = it.pin.length ? C.owns("pin", it.pin[0]) : true; out.ownsOther = C.owns("skin", pro[1]);
      C.state.settings.collPreview.active.until = Date.now() - 1; C.tick();
      out.afterEnd = C.shown(); out.bannerGone = !document.getElementById("cpBanner"); out.sameAgainBlocked = !C.canStart(pro[0]); out.ownsAfter = C.owns("skin", pro[0]);
      for (const i of [1, 2]) { C.start(pro[i]); out["p" + i] = C.shown() === pro[i]; C.state.settings.collPreview.active.until = Date.now() - 1; C.tick(); }
      out.leftAfter3 = C.left(); out.fourthBlocked = !C.canStart(pro[3]); C.start(pro[3]); out.fourthNotApplied = C.shown() !== pro[3]; out.restored = C.shown(); out.used = C.status().used.length;
      return out;
    }, ids);
    ok(res.proCount >= 4, "there are at least 4 Pro collections to try");
    ok(res.canFirst && res.left0 === 3, "a free account starts with 3 previews");
    ok(res.during && res.banner && res.left1 === 2, "a preview applies the collection and shows the countdown banner");
    ok(res.secondBlockedWhileRunning, "only one preview can run at a time");
    ok(res.ownsPack && res.ownsPin && !res.ownsOther, "during a preview only that collection's own pieces are unlocked");
    ok(res.afterEnd === res.before && res.bannerGone, "when the 5 minutes are up the earlier theme comes back and the banner goes");
    ok(res.sameAgainBlocked && !res.ownsAfter, "the same collection can't be previewed twice and locks again");
    ok(res.p1 && res.p2 && res.leftAfter3 === 0, "three different collections can each be previewed");
    ok(res.fourthBlocked && res.fourthNotApplied && res.restored === res.before && res.used === 3, "after 3 previews no more are possible");
    // a preview left running when the app was closed is undone on the next open
    await page.evaluate(() => { const C = window.__sbCollPreview; C.state.settings.collPreview = {used: [], active: null}; });
    const pro = await page.evaluate(ids => ids.find(id => !window.__sbCollPreview.owns("skin", id)), ids);
    await page.evaluate(id => { const C = window.__sbCollPreview; C.start(id); }, pro);
    await page.evaluate(() => { window.__sbCollPreview.state.settings.collPreview.active.until = Date.now() - 60000; });
    await page.waitForTimeout(1500);
    ok(await page.evaluate(() => window.__sbCollPreview.shown()) !== pro, "an expired preview is ended by the timer");
    ok(errs.length === 0, "no page errors" + (errs.length ? ": " + errs[0] : ""));
    console.log("\ncollection-preview: " + n + " checks passed");
  } finally { await browser.close(); server.close(); }
})().catch(e => { console.error(e); process.exit(1); });
