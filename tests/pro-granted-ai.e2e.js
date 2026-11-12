// node tests/pro-granted-ai.e2e.js: Pro from a grant has every Pro feature but not Studyboard AI, so the Pro sheet still offers
// paid Pro to add it; paying for Pro shows nothing to upgrade
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
(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  const errs = [];
  const run = async row => {
    const USER = {id: "11111111-2222-3333-4444-555555555555", aud: "authenticated", role: "authenticated", email: "eva@example.com", email_confirmed_at: new Date().toISOString(), app_metadata: {provider: "google"}, user_metadata: {}};
    const jwt = () => b64({alg: "HS256", typ: "JWT"}) + "." + b64({sub: USER.id, aud: "authenticated", role: "authenticated", email: USER.email, exp: Math.floor(Date.now() / 1000) + 3600}) + ".sig";
    const ctx = await browser.newContext({viewport: {width: 600, height: 1200}});
    await ctx.routeWebSocket(/supabase\.co/, ws => ws.close());
    await ctx.route(/supabase\.co/, async r => {
      const u = new URL(r.request().url()), H = {"access-control-allow-origin": "*", "access-control-allow-headers": "*"};
      if (u.pathname === "/auth/v1/authorize") return r.fulfill({status: 302, headers: {location: u.searchParams.get("redirect_to") + "#access_token=" + jwt() + "&refresh_token=rt&expires_in=3600&token_type=bearer"}});
      if (u.pathname === "/auth/v1/user") return r.fulfill({status: 200, contentType: "application/json", body: JSON.stringify(USER)});
      if (u.pathname.startsWith("/functions/v1/entitlement-token")) return r.fulfill({status: 404, contentType: "application/json", headers: H, body: '{"error":"not found"}'});
      if (u.pathname.startsWith("/rest/v1/studyboard_entitlements")) return r.fulfill({status: 200, contentType: "application/json", headers: H, body: JSON.stringify(row ? Object.assign({user_id: USER.id}, row) : null)});
      if (u.pathname.startsWith("/rest/") || u.pathname.startsWith("/functions/")) return r.fulfill({status: 200, contentType: "application/json", headers: H, body: "[]"});
      return r.abort();
    });
    await ctx.addInitScript(() => { try { localStorage.setItem("studyboard:paywall-test", "1"); } catch (e) {} });
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
    const r = await page.evaluate(() => ({pro: window.__sbPlanObj().isPro(), up: !!document.querySelector("dialog[open] .plan-upai"), buy: document.querySelectorAll('dialog[open] [data-act="plan-pick"]').length + document.querySelectorAll('dialog[open] [data-act="plan-buy"]').length,
      text: (document.querySelector("dialog[open] .plan-upai") || {}).textContent || ""}));
    await ctx.close(); return r;
  };
  try {
    const later = new Date(Date.now() + 30 * 864e5).toISOString();
    const granted = await run({plan: "free", grant_until: later});
    ok(granted.pro && granted.up && granted.buy >= 2 && /granted/.test(granted.text), "Pro from a grant: every Pro feature, and the Pro sheet offers paid Pro for Studyboard AI: " + JSON.stringify(granted));
    const paying = await run({plan: "pro", pro_until: later, source: "stripe", will_renew: true});
    ok(paying.pro && !paying.up && paying.buy === 0, "paying for Pro: nothing to upgrade: " + JSON.stringify(paying));
    const free = await run(null);
    ok(!free.pro && !free.up && free.buy >= 2, "free plan: the usual prices, no upgrade box: " + JSON.stringify(free));
    ok(!errs.length, "no page errors: " + errs.join(" | "));
    console.log(`pro-granted-ai.e2e: ${n} checks passed`);
  } catch (e) { console.error(e); process.exitCode = 1; }
  finally { await browser.close(); server.close(); }
})();
