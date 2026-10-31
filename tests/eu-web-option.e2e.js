// node tests/eu-web-option.e2e.js: in the iPhone app on an EU App Store account, the website is offered as a second way to buy
// Pro, under Apple's in-app purchase and quieter than it, only to signed-in adults when Apple says the app is eligible; tapping
// it shows Apple's disclosure sheet, sends Apple's reporting tokens to the server, then opens the website in the browser.
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
const b64 = o => Buffer.from(JSON.stringify(o)).toString("base64url");
const MAC_UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15";
(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  const errs = [];
  const run = async ({storefront, birth, eligible}) => {
    const USER = {id: "11111111-2222-3333-4444-555555555555", aud: "authenticated", role: "authenticated", email: "eva@example.com", email_confirmed_at: new Date().toISOString(), app_metadata: {provider: "google"}, user_metadata: birth ? {birth_date: birth} : {}, created_at: new Date().toISOString()};
    const jwt = () => b64({alg: "HS256", typ: "JWT"}) + "." + b64({sub: USER.id, aud: "authenticated", role: "authenticated", email: USER.email, exp: Math.floor(Date.now() / 1000) + 3600}) + ".sig";
    const ctx = await browser.newContext({viewport: {width: 430, height: 900}, userAgent: MAC_UA});
    const posted = [];
    await ctx.route(/supabase\.co/, async r => {
      const u = new URL(r.request().url());
      if (u.pathname === "/auth/v1/authorize") return r.fulfill({status: 302, headers: {location: u.searchParams.get("redirect_to") + "#access_token=" + jwt() + "&refresh_token=rt&expires_in=3600&token_type=bearer"}});
      if (u.pathname === "/auth/v1/user") return r.fulfill({status: 200, contentType: "application/json", body: JSON.stringify(USER)});
      if (u.pathname.startsWith("/functions/v1/apple-external/tokens")) { posted.push(JSON.parse(r.request().postData() || "{}")); return r.fulfill({status: 200, contentType: "application/json", headers: {"access-control-allow-origin": "*"}, body: '{"ok":true}'}); }
      if (u.pathname.startsWith("/rest/") || u.pathname.startsWith("/functions/")) return r.fulfill({status: 200, contentType: "application/json", headers: {"access-control-allow-origin": "*"}, body: "[]"});
      return r.abort();
    });
    await ctx.addInitScript(({storefront, eligible}) => {
      try { localStorage.setItem("studyboard:paywall-test", "1"); } catch (e) {}
      window.__calls = [];
      window.StudyboardNative = {platform: "ios", purchasesAvailable: true, externalPurchase: false, storefront,
        linkOut: {eligible: () => Promise.resolve(eligible), tokens: () => { window.__calls.push("tokens"); return Promise.resolve(["eyJhIjoxfQ_tokenAAAAAAAAAAAAAAAA"]); },
          notice: () => { window.__calls.push("notice"); return Promise.resolve(window.__notice || "continued"); }, open: url => { window.__calls.push("open " + url); return Promise.resolve(true); }}};
    }, {storefront, eligible});
    const page = await ctx.newPage(); page.on("pageerror", e => errs.push(e.message));
    await page.goto(base);
    await page.waitForSelector('dialog[open] .sb-welc [data-sbm="signin"]', {timeout: 15000});
    await page.click('dialog[open] .sb-welc [data-sbm="signin"]');
    await page.waitForSelector("dialog[open] [data-oauth=google]", {timeout: 8000});
    await page.click("dialog[open] [data-oauth=google]");
    await page.waitForFunction(() => { const k = Object.keys(localStorage).find(x => /studioso-auth/.test(x)); return !!k && /access_token/.test(localStorage.getItem(k)); }, null, {timeout: 10000});
    await page.waitForFunction(() => window.__sbPlanObj && window.__sbPlanObj(), null, {timeout: 10000}); await page.waitForTimeout(3200);
    await page.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
    await page.evaluate(() => window.__sbPlanObj().openSheet()); await page.waitForSelector("dialog[open] .plan-sheet", {timeout: 5000}); await page.waitForTimeout(400);
    return {ctx, page, posted};
  };
  try {
    // Pro isn't sold to EU App Store accounts (NO_PRO_IN_EU in 10-plan.js): a note in place of the prices, no website option,
    // and Restore Purchases still there
    let {ctx, page} = await run({storefront: "DEU", birth: "1995-04-02", eligible: true});
    const eu = await page.evaluate(() => ({buy: document.querySelectorAll('dialog[open] [data-act="plan-buy"]').length, web: !!document.querySelector('dialog[open] [data-act="plan-buy-web"]'),
      note: (document.querySelector("dialog[open] .plan-sheet") || {}).textContent || "", restore: !!document.querySelector('dialog[open] [data-act="plan-restore"]')}));
    ok(eu.buy === 0 && !eu.web && /isn't available in your country yet/.test(eu.note) && eu.restore, "an EU App Store account: no prices, a note that Pro isn't available there yet, Restore Purchases kept: " + JSON.stringify({buy: eu.buy, web: eu.web, restore: eu.restore}));
    ok(!/Apple ID account at confirmation/.test(eu.note), "and no subscription terms for something they can't buy");
    await ctx.close();

    ({ctx, page} = await run({storefront: "DEU", birth: "", eligible: true}));
    ok(!(await page.$('dialog[open] [data-act="plan-buy-web"]')), "no known birthday (could be under 18): no website option");
    await ctx.close();
    ({ctx, page} = await run({storefront: "DEU", birth: "2012-06-01", eligible: true}));
    ok(!(await page.$('dialog[open] [data-act="plan-buy-web"]')), "a 14-year-old: no website option");
    await ctx.close();
    ({ctx, page} = await run({storefront: "DEU", birth: "1995-04-02", eligible: false}));
    ok(!(await page.$('dialog[open] [data-act="plan-buy-web"]')), "Apple says not eligible (no entitlement, old iOS, purchases restricted): no website option");
    await ctx.close();
    ({ctx, page} = await run({storefront: "CAN", birth: "1995-04-02", eligible: true}));
    ok(!(await page.$('dialog[open] [data-act="plan-buy-web"]')) && await page.$('dialog[open] [data-act="plan-buy"]'), "outside the EU (Canada): in-app purchase only");
    await ctx.close();

    ok(!errs.length, "no page errors: " + errs.join(" | "));
    console.log(`eu-web-option.e2e: ${n} checks passed`);
  } finally { await browser.close(); server.close(); }
})().catch(e => { console.error(e); process.exit(1); });
