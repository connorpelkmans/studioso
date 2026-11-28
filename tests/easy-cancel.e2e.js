// node tests/easy-cancel.e2e.js: Cancel Subscription sits next to Manage Plan for a plan that renews, and goes straight to
// Stripe's cancel step (or the App Store / Google Play subscriptions page)
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
  const run = async (row, portal, keep) => {
    const USER = {id: "11111111-2222-3333-4444-555555555555", aud: "authenticated", role: "authenticated", email: "eva@example.com", email_confirmed_at: new Date().toISOString(), app_metadata: {provider: "google"}, user_metadata: {}};
    const jwt = () => b64({alg: "HS256", typ: "JWT"}) + "." + b64({sub: USER.id, aud: "authenticated", role: "authenticated", email: USER.email, exp: Math.floor(Date.now() / 1000) + 3600}) + ".sig";
    const ctx = await browser.newContext({viewport: {width: 600, height: 1200}});
    const calls = [], opened = [];
    await ctx.routeWebSocket(/supabase\.co/, ws => ws.close());
    await ctx.route(/billing\.stripe\.com|apps\.apple\.com|play\.google\.com/, r => { opened.push(r.request().url()); return r.fulfill({status: 200, contentType: "text/html", body: "<title>outside</title>ok"}); });
    await ctx.route(/supabase\.co/, async r => {
      const u = new URL(r.request().url()), H = {"access-control-allow-origin": "*", "access-control-allow-headers": "*"};
      if (r.request().method() === "OPTIONS") return r.fulfill({status: 200, headers: H, body: "ok"});
      if (u.pathname === "/auth/v1/authorize") return r.fulfill({status: 302, headers: {location: u.searchParams.get("redirect_to") + "#access_token=" + jwt() + "&refresh_token=rt&expires_in=3600&token_type=bearer"}});
      if (u.pathname === "/auth/v1/user") return r.fulfill({status: 200, contentType: "application/json", body: JSON.stringify(USER)});
      if (u.pathname.startsWith("/functions/v1/entitlement-token")) return r.fulfill({status: 404, contentType: "application/json", headers: H, body: '{"error":"not found"}'});
      if (u.pathname.startsWith("/functions/v1/create-portal-session")) { calls.push(JSON.parse(r.request().postData() || "{}")); const p = portal || {status: 200, body: {ok: true, canceled: true, ends_at: "2026-12-26T00:00:00Z"}}; return r.fulfill({status: p.status, contentType: "application/json", headers: H, body: JSON.stringify(p.body)}); }
      if (u.pathname.startsWith("/rest/v1/studyboard_entitlements")) return r.fulfill({status: 200, contentType: "application/json", headers: H, body: JSON.stringify(row ? Object.assign({user_id: USER.id}, row) : null)});
      if (u.pathname.startsWith("/rest/") || u.pathname.startsWith("/functions/")) return r.fulfill({status: 200, contentType: "application/json", headers: H, body: "[]"});
      return r.abort();
    });
    await ctx.addInitScript(() => { try { localStorage.setItem("studyboard:paywall-test", "1"); } catch (e) {} });
    ctx.on("page", p => p.on("framenavigated", f => { if (f === p.mainFrame() && /^https:/.test(f.url())) opened.push(f.url()); }));
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
    const has = await page.locator('dialog[open] .plan-actions [data-act="plan-cancel"]').count();
    const next = has ? await page.evaluate(() => { const b = document.querySelector('dialog[open] [data-act="plan-cancel"]'); return b.previousElementSibling && b.previousElementSibling.dataset.act; }) : "";
    let toast = "", confirmText = "", after = -1;
    if (has) {
      if (!portal) await page.screenshot({path: path.join(root, "tests-out", "easy-cancel.png")}).catch(() => {});
      await page.click('dialog[open] [data-act="plan-cancel"]'); await page.waitForTimeout(500);
      if (row.source === "stripe") {
        confirmText = await page.evaluate(() => (document.querySelector("#askDlg[open]") || {}).textContent || "");
        if (!portal && !keep) await page.screenshot({path: path.join(root, "tests-out", "easy-cancel-confirm.png")}).catch(() => {});
        await page.click(keep ? "#askDlg[open] #askNo" : '#askDlg[open] button[type="submit"]'); await page.waitForTimeout(1200);
        after = await page.locator('dialog[open] .plan-actions [data-act="plan-cancel"]').count();
      } else await page.waitForTimeout(1000);
      toast = await page.evaluate(() => (document.querySelector("#toastMsg") || {}).textContent || "");
    }
    await ctx.close(); return {has, next, calls, opened, toast, confirmText, after};
  };
  try {
    fs.mkdirSync(path.join(root, "tests-out"), {recursive: true});
    const later = new Date(Date.now() + 30 * 864e5).toISOString();
    const card = await run({plan: "pro", pro_until: later, source: "stripe", will_renew: true});
    ok(card.has === 1 && card.next === "plan-manage", "a card plan that renews: Cancel Subscription right next to Manage Plan");
    ok(/won't be charged again/.test(card.confirmText) && /aren't refunded/.test(card.confirmText) && /Keep Pro/.test(card.confirmText), "it confirms first, saying it only stops renewal and nothing is refunded: " + card.confirmText);
    ok(card.calls.length === 1 && card.calls[0].flow === "cancel", "then cancels on the server: " + JSON.stringify(card.calls));
    ok(!card.opened.length, "no Stripe page opens");
    ok(/Canceled\. You won't be charged again, and you keep Pro until /.test(card.toast) && card.after === 0, "says Pro stays until the paid-for date, and the button goes: " + card.toast);
    const kept = await run({plan: "pro", pro_until: later, source: "stripe", will_renew: true}, null, true);
    ok(kept.calls.length === 0, "Keep Pro cancels nothing");
    const already = await run({plan: "pro", pro_until: later, source: "stripe", will_renew: true}, {status: 409, body: {error: "already_canceled", message: "Your plan is already canceled. You keep Pro until the end of the time you paid for."}});
    ok(/already canceled/.test(already.toast) && !already.opened.some(u => /stripe/.test(u)), "already canceled on Stripe: says so, opens nothing: " + already.toast);
    const ending = await run({plan: "pro", pro_until: later, source: "stripe", will_renew: false});
    ok(ending.has === 0, "a plan that won't renew has no Cancel button");
    const apple = await run({plan: "pro", pro_until: later, source: "apple", will_renew: true});
    ok(apple.has === 1 && apple.calls.length === 0 && apple.opened.some(u => u.startsWith("https://apps.apple.com/account/subscriptions")), "App Store plan: opens the App Store subscriptions page: " + JSON.stringify(apple.opened));
    const google = await run({plan: "pro", pro_until: later, source: "google", will_renew: true});
    ok(google.opened.some(u => u.startsWith("https://play.google.com/store/account/subscriptions?package=com.studyboardapp.studyboard")), "Google Play plan: opens this app's subscription in Google Play");
    const grant = await run({plan: "free", grant_until: later});
    ok(grant.has === 0, "Pro from a grant: nothing to cancel");
    ok(!errs.length, "no page errors: " + errs.join(" | "));
    console.log(`easy-cancel.e2e: ${n} checks passed`);
  } catch (e) { console.error(e); process.exitCode = 1; }
  finally { await browser.close(); server.close(); }
})();
