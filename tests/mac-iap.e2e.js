// node tests/mac-iap.e2e.js: in the Mac App Store build, Studyboard Pro is bought with Apple's in-app purchase (the desktop
// bridge's iap.*), and Apple's receipt is handed to RevenueCat for the signed-in account. Apple and RevenueCat are faked.
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const root = path.join(__dirname, "..");
const MIME = {".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".css": "text/css", ".png": "image/png", ".svg": "image/svg+xml", ".webp": "image/webp", ".woff2": "font/woff2"};
const KEY = "appl_TestKey1234567890";
// the page with the Mac key filled in (as scripts/apple-setup.js --revenuecat does)
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname); if (p === "/") p = "/index.html";
  if (p === "/index.html") { res.writeHead(200, {"content-type": "text/html"}); const src = require("../scripts/app-files").source().replace('const MAC_RC_KEY = "appl_REPLACE_WITH_REVENUECAT_PUBLIC_KEY"', `const MAC_RC_KEY = "${KEY}"`); res.end(require("../scripts/csp").apply(src)); return; }
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  res.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const b64 = o => Buffer.from(JSON.stringify(o)).toString("base64url");
const USER = {id: "11111111-2222-3333-4444-555555555555", aud: "authenticated", role: "authenticated", email: "mac@example.com", email_confirmed_at: new Date().toISOString(), app_metadata: {provider: "google"}, user_metadata: {}, created_at: new Date().toISOString()};
const jwt = () => b64({alg: "HS256", typ: "JWT"}) + "." + b64({sub: USER.id, aud: "authenticated", role: "authenticated", email: USER.email, exp: Math.floor(Date.now() / 1000) + 3600}) + ".sig";
(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  const errs = [];
  const run = async sold => {
    const ctx = await browser.newContext({viewport: {width: 1280, height: 860}, userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36"});
    const rc = [];
    await ctx.route(/supabase\.co/, async r => {
      const u = new URL(r.request().url());
      if (u.pathname === "/auth/v1/user") return r.fulfill({status: 200, contentType: "application/json", body: JSON.stringify(USER)});
      if (u.pathname.startsWith("/rest/") || u.pathname.startsWith("/functions/")) return r.fulfill({status: 200, contentType: "application/json", body: "[]"});
      return r.abort();
    });
    await ctx.route(/api\.revenuecat\.com/, async r => {
      const u = new URL(r.request().url()), h = r.request().headers();
      rc.push({path: u.pathname, auth: h.authorization, platform: h["x-platform"], body: r.request().postData()});
      if (/\/offerings$/.test(u.pathname)) return r.fulfill({status: 200, contentType: "application/json", headers: {"access-control-allow-origin": "*"}, body: JSON.stringify({current_offering_id: "default", offerings: [{identifier: "default", packages: [{identifier: "$rc_monthly", platform_product_identifier: "studyboard_pro_monthly"}, {identifier: "$rc_annual", platform_product_identifier: "studyboard_pro_yearly"}]}]})});
      if (u.pathname === "/v1/receipts") return r.fulfill({status: 200, contentType: "application/json", headers: {"access-control-allow-origin": "*"}, body: JSON.stringify({subscriber: {entitlements: {pro: {expires_date: new Date(Date.now() + 30 * 864e5).toISOString()}}}})});
      return r.fulfill({status: 404, body: "{}"});
    });
    await ctx.addInitScript(([sold, token]) => {
      try { localStorage.setItem("studyboard:paywall-test", "1"); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "1"); } catch (e) {}
      window.__iap = [];
      const real = {version: "1.0", store: "mas", mas: true, platform: "darwin",
        oauthPort: () => Promise.resolve(43821), oauthOpen: () => Promise.resolve("http://127.0.0.1:43821/auth#access_token=" + token + "&refresh_token=rt&expires_in=3600&token_type=bearer"),
        iap: {products: ids => { window.__iap.push(["products", ids]); return Promise.resolve(sold ? ids.map(id => ({id, title: "Pro", price: "$3.99"})) : []); },
          buy: (id, user) => { window.__iap.push(["buy", id, user]); return Promise.resolve({status: "success"}); },
          restore: () => { window.__iap.push(["restore"]); return Promise.resolve(true); },
          receipt: () => Promise.resolve("TUFDUkVDRUlQVA==")}};
      // the data folder isn't part of this test
      real.dataDir = () => Promise.resolve(null);
      window.studiosoDesktop = real;
    }, [sold, jwt()]);
    const page = await ctx.newPage(); page.on("pageerror", e => errs.push(e.message));
    await page.goto(base);
    await page.waitForSelector('dialog[open] .sb-welc [data-sbm="signin"]', {timeout: 15000});
    await page.click('dialog[open] .sb-welc [data-sbm="signin"]');
    await page.waitForSelector("dialog[open] [data-oauth=google]", {timeout: 8000});
    await page.click("dialog[open] [data-oauth=google]");
    await page.waitForFunction(() => { const k = Object.keys(localStorage).find(x => /studioso-auth/.test(x)); return !!k && /access_token/.test(localStorage.getItem(k)); }, null, {timeout: 10000});
    await page.waitForTimeout(1500);
    await page.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
    await page.evaluate(() => window.__sbPlanObj().openSheet()); await page.waitForSelector("dialog[open] .plan-sheet", {timeout: 5000}); await page.waitForTimeout(400);
    return {ctx, page, rc};
  };
  try {
    let {ctx, page, rc} = await run(true);
    ok(await page.evaluate(() => /Apple ID account at confirmation/.test((document.getElementById("planLegal") || {}).textContent || "")), "the Mac App Store build sells Pro with Apple's in-app purchase terms");
    await page.click('dialog[open] [data-act="plan-buy"][data-id="monthly"]'); await page.waitForTimeout(1500);
    const iap = await page.evaluate(() => window.__iap);
    ok(iap.some(x => x[0] === "buy" && x[1] === "studyboard_pro_monthly" && x[2] === "11111111-2222-3333-4444-555555555555"), "Monthly buys RevenueCat's monthly product with Apple, for this account: " + JSON.stringify(iap));
    const rec = rc.find(x => x.path === "/v1/receipts");
    ok(rec && rec.auth === "Bearer " + KEY && rec.platform === "macos" && /"app_user_id":"11111111-2222-3333-4444-555555555555"/.test(rec.body) && /"fetch_token":"TUFDUkVDRUlQVA=="/.test(rec.body), "then Apple's receipt goes to RevenueCat for the account, so its webhook switches Pro on");
    rc.length = 0;
    await page.click('dialog[open] [data-act="plan-restore"]'); await page.waitForTimeout(800);
    ok((await page.evaluate(() => window.__iap)).some(x => x[0] === "restore") && rc.some(x => x.path === "/v1/receipts"), "Restore Purchases asks Apple for earlier purchases and sends the receipt again");
    await ctx.close();

    ({ctx, page, rc} = await run(false));
    await page.click('dialog[open] [data-act="plan-buy"][data-id="monthly"]'); await page.waitForTimeout(1200);
    ok(!(await page.evaluate(() => window.__iap)).some(x => x[0] === "buy"), "where Apple doesn't sell Pro (not available in that country), nothing is bought");
    await ctx.close();

    ok(!errs.length, "no page errors: " + errs.join(" | "));
    console.log(`mac-iap.e2e: ${n} checks passed`);
  } finally { await browser.close(); server.close(); }
})().catch(e => { console.error(e); process.exit(1); });
