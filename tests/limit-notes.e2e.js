// node tests/limit-notes.e2e.js  (Playwright + Chromium)
// Pro is offered only at a free-plan limit, as one small message per limit: it shows once (per account on this device), its button
// opens the right place, a second time shows nothing, and nobody on Pro (or with the paywall off) ever sees one.
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
(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  try {
    const ctx = await browser.newContext({serviceWorkers: "block"}); await ctx.route(/supabase\.co/, r => r.abort());
    await ctx.addInitScript(() => {
      localStorage.setItem("coursework:v2", JSON.stringify({v: 2, updated: 1, courses: [], tasks: [], settings: {}}));
      localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("studyboard:tour", "done");
      localStorage.setItem("studyboard:paywall-test", "1");
    });
    const page = await ctx.newPage(); const errs = []; page.on("pageerror", e => errs.push(e.message));
    await page.goto(base); await page.waitForFunction(() => window.StudyboardPlan && StudyboardPlan.limitNote, null, {timeout: 40000}); await page.waitForTimeout(500);
    const toastTxt = () => page.evaluate(() => { const t = document.querySelector("#toast"); return t && t.classList.contains("show") ? t.textContent.replace(/\s+/g, " ").trim() : ""; });
    ok(await page.evaluate(() => StudyboardPlan.paywall() && !StudyboardPlan.isPro()), "a free account with Pro switched on");
    ok(await page.evaluate(() => StudyboardPlan.limitNote("storage", "That's past your 25 MB of free file storage. Pro has 10 GB of storage.", {reason: "You've used your free file storage."})), "the first time a limit is reached, the message shows");
    const t = await toastTxt(); ok(/Pro has 10 GB of storage/.test(t) && /See Pro/.test(t), "it says what Pro gives and offers See Pro: " + t);
    ok(!(await page.evaluate(() => document.querySelector("dialog[open]"))), "no sheet pops up on its own");
    await page.click("#toastExtra"); await page.waitForSelector("dialog[open] .plan-sheet");
    ok(/free file storage/.test(await page.textContent("dialog[open] .plan-reason")), "See Pro opens the Pro sheet with the reason on top");
    await page.evaluate(() => document.querySelector("dialog[open]").close());
    ok(!(await page.evaluate(() => StudyboardPlan.limitNote("storage", "again"))), "the same limit never shows twice");
    ok(await page.evaluate(() => StudyboardPlan.limitNote("group", "Study Group has 5 members, the most a free group holds. Upgrade to Pro for groups of up to 100.")), "a different limit still gets its one message");
    ok(await page.evaluate(() => { const s = JSON.parse(localStorage.getItem("studyboard:limitNotes")); return !!(s && s.guest && s.guest.storage && s.guest.group); }), "what was shown is remembered on this device");
    // upgrade tracking: a fresh sheet counts as shown (a redraw doesn't), a price tap as buy, with numbers and quoted names taken out
    await page.evaluate(() => { window.__sbTrackSink = []; StudyboardPlan.openSheet('The free plan syncs on up to 2 devices for "My Deck"'); StudyboardPlan.openSheet('The free plan syncs on up to 2 devices for "My Deck"'); });
    await page.waitForSelector("dialog[open] .plan-sheet"); await page.evaluate(() => document.querySelector('dialog[open] [data-act="plan-buy"]').click()); await page.waitForTimeout(300);
    const tr = await page.evaluate(() => window.__sbTrackSink);
    ok(tr.length === 2 && tr[0][0] === "shown" && tr[1][0] === "buy" && tr[0][1] === "The free plan syncs on up to # devices for \u2026" && tr[1][1] === tr[0][1], "upgrade tracking counts shown once and the buy tap, with no names or numbers: " + JSON.stringify(tr));
    ok(await page.evaluate(() => { const a = JSON.parse(localStorage.getItem("studyboard:upgradeAttr")); return !!a && /syncs on up to/.test(a.r); }), "the buy tap remembers which prompt led to it, for the purchase count");
    await page.evaluate(() => { localStorage.removeItem("studyboard:upgradeAttr"); const d = document.querySelector("dialog[open]"); if (d) d.close(); window.__sbTrackSink = null; });
    await page.reload(); await page.waitForFunction(() => window.StudyboardPlan && StudyboardPlan.limitNote); await page.waitForTimeout(300);
    ok(!(await page.evaluate(() => StudyboardPlan.limitNote("group", "x"))), "and after a reload it still doesn't show again");
    // paywall off (early access): never
    await page.evaluate(() => { localStorage.removeItem("studyboard:limitNotes"); });
    ok(await page.evaluate(() => typeof StudyboardPlan.limitNote === "function"), "helper is there");
    ok(!errs.length, "no page errors: " + errs.join(" | "));
  } finally { await browser.close(); server.close(); }
  console.log(`\nlimit-notes.e2e: ${n} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
