// node tests/us-web-checkout.e2e.js: in the iPhone app, United States App Store accounts buy Pro on the website (Stripe), and
// everyone else with in-app purchase. The bridge (native-bridge.js) reads the App Store country and only then lets payment pages
// open; the Pro sheet (10-plan.js) picks the route from it and changes when it's learned.
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const root = path.join(__dirname, "..");
const MIME = {".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".css": "text/css", ".png": "image/png", ".svg": "image/svg+xml", ".webp": "image/webp", ".woff2": "font/woff2"};
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  res.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  const errs = [];
  try {
    // 1. the bridge: payment pages open only for a United States App Store account
    const bridgeFor = async country => {
      const ctx = await browser.newContext(); const page = await ctx.newPage(); page.on("pageerror", e => errs.push("bridge: " + e.message));
      await ctx.route(base + "bridge-test", r => r.fulfill({status: 200, contentType: "text/html", body: "<!doctype html><title>b</title>"}));
      await page.goto(base + "bridge-test");
      await page.evaluate(country => {
        window.__opened = []; window.__sf = [];
        window.addEventListener("studyboard:storefront", e => window.__sf.push(e.detail));
        window.Capacitor = {isNativePlatform: () => true, getPlatform: () => "ios", isPluginAvailable: () => false,
          Plugins: {Browser: {open: o => { window.__opened.push(o.url); return Promise.resolve(); }}, StudyboardStore: {storefront: () => Promise.resolve(country ? {country} : {})}}};
      }, country);
      await page.addScriptTag({content: fs.readFileSync(path.join(root, "ios-wrapper/native-bridge.js"), "utf8")});
      await page.waitForTimeout(200);
      const out = await page.evaluate(() => { window.open("https://checkout.stripe.com/c/pay/cs_test_1"); window.open("https://example.com/help"); return {opened: window.__opened, ext: window.StudyboardNative.externalPurchase, sf: window.StudyboardNative.storefront, ev: window.__sf, saved: localStorage.getItem("studyboard:storefront")}; });
      await ctx.close(); return out;
    };
    let b = await bridgeFor("USA");
    ok(b.ext === true && b.sf === "USA" && b.saved === "USA" && b.ev.length === 1 && b.ev[0].externalPurchase === true, "bridge: a United States App Store account may buy on the website (and it's remembered): " + JSON.stringify({ext: b.ext, sf: b.sf}));
    ok(b.opened.length === 2 && /stripe\.com/.test(b.opened[0]), "bridge: so the Stripe checkout page opens for them");
    b = await bridgeFor("CAN");
    ok(b.ext === false && b.sf === "CAN" && b.opened.length === 1 && !/stripe/.test(b.opened[0]), "bridge: a Canadian account uses in-app purchase, and payment pages stay closed");
    b = await bridgeFor("");
    ok(b.ext === false && b.opened.length === 1, "bridge: when the App Store can't say, in-app purchase (the safe choice)");

    // 2. the Pro sheet in the app
    const ctx = await browser.newContext({viewport: {width: 430, height: 900}});
    await ctx.route(/supabase\.co/, r => r.abort());
    await ctx.addInitScript(() => {
      try { localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "1"); localStorage.setItem("studyboard:paywall-test", "1"); } catch (e) {}
      window.__opened = []; window.open = u => { window.__opened.push(String(u)); return null; };
      window.StudyboardNative = {platform: "ios", purchasesAvailable: true, externalPurchase: false, storefront: "CAN"};
    });
    const page = await ctx.newPage(); page.on("pageerror", e => errs.push(e.message));
    await page.goto(base); await page.waitForFunction(() => window.StudyboardPlan && window.__sbPlanObj && window.__sbPlanObj(), null, {timeout: 15000}); await page.waitForTimeout(800);
    await page.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
    await page.evaluate(() => window.__sbPlanObj().openSheet()); await page.waitForSelector("dialog[open] .plan-sheet", {timeout: 5000});
    const legal = () => page.evaluate(() => (document.getElementById("planLegal") || {}).textContent || "");
    ok(/Apple ID/.test(await legal()) && !/Studyboard website/.test(await legal()), "outside the US the sheet sells with in-app purchase (Apple's renewal terms)");
    ok(await page.evaluate(() => !document.querySelector('dialog[open] [data-act="plan-buy"][data-id="semester"]')), "and offers only what the App Store sells (no semester plan)");
    // the country is learned: United States
    await page.evaluate(() => { window.StudyboardNative.externalPurchase = true; window.StudyboardNative.storefront = "USA"; window.dispatchEvent(new CustomEvent("studyboard:storefront", {detail: {country: "USA", externalPurchase: true}})); });
    await page.waitForTimeout(300);
    ok(/check out securely on the Studyboard website/.test(await legal()) && !/Apple ID/.test(await legal()), "for a United States account the sheet changes at once: checkout on the website, with the website's terms");
    await page.evaluate(() => window.__sbPlanObj().buy("monthly")); await page.waitForTimeout(300);
    const opened = await page.evaluate(() => window.__opened);
    ok(opened.length === 1 && /^https:\/\/studyboardapp\.com\/website\/account\?plan=monthly&src=app$/.test(opened[0]), "Monthly opens the website's checkout: " + opened.join());
    await ctx.close();

    ok(!errs.length, "no page errors: " + errs.join(" | "));
    console.log(`us-web-checkout.e2e: ${n} checks passed`);
  } finally { await browser.close(); server.close(); }
})().catch(e => { console.error(e); process.exit(1); });
