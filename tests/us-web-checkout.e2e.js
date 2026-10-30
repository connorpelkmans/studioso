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

    // 3. the store's semester plan (4 months, paid once: the App Store has no 4-month renewing length), once its price is set
    const ctx3 = await browser.newContext({viewport: {width: 430, height: 900}});
    await ctx3.route(/supabase\.co/, r => r.abort());
    await ctx3.addInitScript(() => {
      try { localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "1"); localStorage.setItem("studyboard:paywall-test", "1");
        localStorage.setItem("studyboard:plancfg", JSON.stringify({rows: {prices: {storeSemester: "$12.99"}}, at: Date.now()})); } catch (e) {}
      window.StudyboardNative = {platform: "ios", purchasesAvailable: true, externalPurchase: false, storefront: "CAN"};
    });
    const p3 = await ctx3.newPage(); p3.on("pageerror", e => errs.push(e.message));
    await p3.goto(base); await p3.waitForFunction(() => window.StudyboardPlan && window.__sbPlanObj && window.__sbPlanObj(), null, {timeout: 15000}); await p3.waitForTimeout(800);
    await p3.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
    await p3.evaluate(() => window.__sbPlanObj().openSheet()); await p3.waitForSelector("dialog[open] .plan-sheet", {timeout: 5000});
    const sem = await p3.evaluate(() => { const b = document.querySelector('dialog[open] [data-act="plan-buy"][data-id="semester"]'); return {btn: b ? b.textContent : "", legal: (document.getElementById("planLegal") || {}).textContent || ""}; });
    ok(/\$12\.99\s*\/ 4 months/.test(sem.btn) && /doesn't renew/.test(sem.btn) && !/Free Trial/.test(sem.btn) && /Semester: \$12\.99 for 4 months of Pro, paid once/.test(sem.legal) && !/every 4 months/.test(sem.legal) && /Apple ID/.test(sem.legal), "with storeSemester set, the App Store sheet sells a 4-month semester plan, paid once: " + sem.btn);
    await ctx3.close();

    // 4. the bridge buys the store's 3-month package for the semester plan
    const ctx4 = await browser.newContext(); const p4 = await ctx4.newPage(); p4.on("pageerror", e => errs.push("bridge4: " + e.message));
    await ctx4.route(base + "bridge-test", r => r.fulfill({status: 200, contentType: "text/html", body: "<!doctype html><title>b</title>"}));
    await p4.goto(base + "bridge-test");
    await p4.evaluate(() => {
      window.__bought = [];
      const pk = id => ({identifier: id});
      window.Capacitor = {isNativePlatform: () => true, getPlatform: () => "ios", isPluginAvailable: () => false, Plugins: {
        StudyboardStore: {storefront: () => Promise.resolve({country: "CAN"})},
        Purchases: {configure: () => Promise.resolve(), logIn: () => Promise.resolve(),
          getOfferings: () => Promise.resolve({current: {monthly: pk("$rc_monthly"), annual: pk("$rc_annual"), availablePackages: [pk("$rc_monthly"), pk("semester"), pk("$rc_annual")]}}),
          purchasePackage: o => { window.__bought.push(o.aPackage.identifier); return Promise.resolve({}); }}}};
    });
    await p4.addScriptTag({content: fs.readFileSync(path.join(root, "ios-wrapper/native-bridge.js"), "utf8").replace(/appl_REPLACE_WITH_REVENUECAT_PUBLIC_KEY/, "appl_TESTKEY12345")});
    const bought = await p4.evaluate(async () => {
      for (const period of ["semester", "yearly", "monthly"]) {
        const done = new Promise(r => window.addEventListener("studyboard:purchase-result", r, {once: true}));
        window.dispatchEvent(new CustomEvent("studyboard:plan-checkout", {cancelable: true, detail: {period, userId: "11111111-1111-1111-1111-111111111111"}}));
        await done;
      }
      return window.__bought;
    });
    ok(bought.join() === "semester,$rc_annual,$rc_monthly", "bridge: semester buys the offering's \"semester\" package, yearly the annual one: " + bought.join());
    await ctx4.close();

    ok(!errs.length, "no page errors: " + errs.join(" | "));
    console.log(`us-web-checkout.e2e: ${n} checks passed`);
  } finally { await browser.close(); server.close(); }
})().catch(e => { console.error(e); process.exit(1); });
