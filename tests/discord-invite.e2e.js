// "Join the Studyboard Discord" popup (99-discord-invite.js): who sees it, when, and that nobody ever sees it twice
const fs = require("fs"), path = require("path"), http = require("http"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const ROOT = path.join(__dirname, "..");
const SB = "https://discord.supabase.test";
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("  ok " + m); };
const web = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]); if (p === "/") p = "/index.html";
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT)) { res.writeHead(404); res.end(); return; }
  fs.readFile(f, (e, b) => { if (e) { res.writeHead(404); res.end(); return; } res.writeHead(200, {"content-type": /\.html$/.test(p) ? "text/html" : /\.m?js$/.test(p) ? "text/javascript" : /\.css$/.test(p) ? "text/css" : "application/octet-stream"}); res.end(b); });
});
const b64 = o => Buffer.from(JSON.stringify(o)).toString("base64url");
let USER = null;
const mint = () => { const iat = Math.floor(Date.now() / 1000), exp = iat + 3600;
  return {access_token: b64({alg: "HS256", typ: "JWT"}) + "." + b64({sub: USER.id, exp, iat, role: "authenticated", aud: "authenticated"}) + ".sig", token_type: "bearer", expires_in: 3600, expires_at: exp, refresh_token: "rt", user: USER}; };
async function handle(route){
  const req = route.request(), u = new URL(req.url()), m = req.method();
  const send = (status, body) => route.fulfill({status, contentType: "application/json", headers: {"access-control-allow-origin": "*", "access-control-allow-headers": "*", "access-control-allow-methods": "*", "access-control-expose-headers": "*"}, body: body === undefined ? "" : JSON.stringify(body)});
  if (m === "OPTIONS") return send(200);
  if (u.pathname === "/auth/v1/token") return send(200, mint());
  if (u.pathname === "/auth/v1/user") return send(200, USER);
  if (u.pathname.startsWith("/rest/v1/rpc/")) return send(404, {code: "PGRST202", message: "Could not find the function"});
  if (u.pathname === "/rest/v1/studyboard_config") return send(200, [{key: "paywall", value: true}]);
  if (u.pathname.startsWith("/rest/v1/")) {
    if (m === "GET") return /vnd\.pgrst\.object/.test(req.headers()["accept"] || "") ? send(406, {code: "PGRST116", message: "0 rows"}) : send(200, []);
    return send(201, m === "POST" ? [{updated_at: new Date().toISOString()}] : []);
  }
  return send(404, {});
}
const D = (m, d, h = 12) => Date.UTC(2026, m - 1, d, h);
async function open(browser, created, nowMs, settings, ctx0){
  USER = {id: "33333333-3333-3333-3333-333333333333", aud: "authenticated", role: "authenticated", email: "me@example.com", app_metadata: {provider: "email"}, user_metadata: {}, created_at: new Date(created).toISOString()};
  const ctx = ctx0 || await browser.newContext({serviceWorkers: "block", viewport: {width: 390, height: 844}});
  if (!ctx0) await ctx.route(SB + "/**", handle);
  if (!ctx0) await ctx.addInitScript(([sb, sess, settings]) => {
    if (!sessionStorage.getItem("seeded")) {
      sessionStorage.setItem("seeded", "1");
      localStorage.setItem("studioso:sb", JSON.stringify({url: sb, key: "anon-key"}));
      localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "done"); localStorage.setItem("studioso:welcomed", "1");
      localStorage.setItem("studyboard:paywall-test", "1"); localStorage.setItem("sb:onboarded:33333333-3333-3333-3333-333333333333", "1"); localStorage.setItem("studyboard:tour:33333333-3333-3333-3333-333333333333", "done"); localStorage.setItem("studioso-auth", sess);
      localStorage.setItem("studyboard:aiIntro", "1"); localStorage.setItem("coursework:v2", JSON.stringify({v: 2, updated: 1, settings: settings || {}, tasks: [], courses: []}));
    }
  }, [SB, JSON.stringify(mint()), settings]);
  await ctx.addInitScript(t => { window.__discordTest = {now: () => t}; window.__opened = []; window.open = u => { window.__opened.push(String(u)); return null; }; }, nowMs);
  const page = await ctx.newPage(), errs = [];
  page.on("pageerror", e => errs.push(e.message));
  await page.goto("http://127.0.0.1:" + web.address().port + "/");
  await page.waitForFunction(() => window.SBDISCORD, null, {timeout: 15000}).catch(async e => { console.log(errs, await page.evaluate(() => [typeof SBDISCORD, typeof PLAN, document.title])); throw e; });
  await page.waitForTimeout(9000);
  // (a fake sign-up date later than the real clock makes the app treat the account as brand new, so its welcome dialog may be open)
  await page.evaluate(() => { document.querySelectorAll("dialog[open]").forEach(d => d.close()); window.SBDISCORD.check(); });
  await page.waitForTimeout(500);
  return {ctx, page, errs};
}
const pop = page => page.evaluate(() => { const e = document.querySelector("#qod.dci"); return e ? e.innerText.replace(/\s+/g, " ") : ""; });

(async () => {
  await new Promise(r => web.listen(0, "127.0.0.1", r));
  const browser = await chromium.launch({executablePath});
  try {
    // an existing user (account from January) sees it right away, with the wording and the link
    let {ctx, page, errs} = await open(browser, D(1, 1), D(11, 19));
    let t = await pop(page);
    ok(/Join the Studyboard Discord/.test(t) && /Ask questions/.test(t) && /Get support/.test(t) && /Chat with other students/.test(t), "existing user sees the popup");
    ok(!errs.length, "no page errors: " + errs.join("; "));
    await page.evaluate(() => document.querySelector("#qod .dci-join").click());
    await page.waitForTimeout(500);
    const opened = await page.evaluate(() => window.__opened);
    ok(opened.length === 1 && opened[0] === await page.evaluate(() => SBDISCORD.LINK) && /^https:\/\/discord\.(gg|com)\//.test(opened[0]), "Join the Server opens the Discord invite: " + opened.join(", "));
    ok(!(await pop(page)), "and closes the popup");
    await page.evaluate(() => window.SBDISCORD.check()); await page.waitForTimeout(300);
    ok(!(await pop(page)), "not shown again in the same session");
    // the same device, opened again: never again
    await page.reload(); await page.waitForFunction(() => window.SBDISCORD);
    await page.waitForTimeout(9000); await page.evaluate(() => { document.querySelectorAll("dialog[open]").forEach(d => d.close()); window.SBDISCORD.check(); });
    ok(!(await pop(page)), "not shown a second time after a reload");
    ok(await page.evaluate(() => SBDISCORD.seen()), "marked as seen");
    await page.waitForTimeout(2000);
    ok(await page.evaluate(() => { const s = JSON.parse(localStorage.getItem("coursework:v2") || "{}").settings || {}; return !!(s.uiSync && s.uiSync["studyboard:discordInvite"] && s.uiSync["studyboard:discordInvite"].v); }), "the seen flag is in the account's synced settings");
    await ctx.close();

    // Maybe Later also counts as seen
    ({ctx, page} = await open(browser, D(3, 1), D(11, 20)));
    ok(/Join the Studyboard Discord/.test(await pop(page)), "another existing user sees it");
    await page.evaluate(() => document.querySelector("#qod [data-qod-close]").click()); await page.waitForTimeout(500);
    await page.evaluate(() => window.SBDISCORD.check()); await page.waitForTimeout(300);
    ok(!(await pop(page)) && await page.evaluate(() => SBDISCORD.seen()), "Maybe Later: never shown again");
    await ctx.close();

    // seen on another device (only in the account's synced settings): not shown here
    ({ctx, page} = await open(browser, D(1, 1), D(11, 19), {uiSync: {"studyboard:discordInvite": {v: "1", at: 5}}}));
    ok(!(await pop(page)), "seen on another device: not shown");
    await ctx.close();

    // a new user who joined 18 Nov: nothing on day 6, shown after 7 days
    ({ctx, page} = await open(browser, D(11, 18, 8), D(11, 24, 8)));
    ok(!(await pop(page)), "new user: nothing before 7 days");
    await ctx.close();
    ({ctx, page} = await open(browser, D(11, 18, 8), D(11, 25, 9)));
    ok(/Join the Studyboard Discord/.test(await pop(page)), "new user: shown after 7 days");
    await ctx.close();

    // a brand-new install with no account: the welcome setup saves a planner before this first looks, and that must not
    // make it count as an old planner (it used to pop up seconds after the setup). Shown 7 days after the install.
    {
      const c2 = await browser.newContext({serviceWorkers: "block", viewport: {width: 390, height: 844}});
      await c2.addInitScript(() => { window.__discordTest = {now: () => Number(sessionStorage.getItem("dnow")) || Date.now()}; });
      const p2 = await c2.newPage(), e2 = [];
      p2.on("pageerror", e => e2.push(e.message));
      await p2.goto("http://127.0.0.1:" + web.address().port + "/");
      await p2.waitForFunction(() => window.SBDISCORD && window.SBESS);
      // what the welcome setup leaves behind, before the popup's first look
      await p2.evaluate(() => { localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("coursework:v2", JSON.stringify({v: 2, updated: 1, settings: {}, tasks: [], courses: []})); document.querySelectorAll("dialog[open]").forEach(d => d.close()); window.SBDISCORD.check(); });
      await p2.waitForTimeout(400);
      ok(await p2.evaluate(() => SBESS.state().why) === "new" && !(await pop(p2)), "brand-new install: no popup right after the welcome setup");
      ok(await p2.evaluate(() => Number(localStorage.getItem("studyboard:firstRun")) === SBESS.state().at), "its start is the install time, not an old planner's 0");
      await p2.evaluate(() => { sessionStorage.setItem("dnow", String(SBESS.state().at + 8 * 864e5)); document.querySelectorAll("dialog[open]").forEach(d => d.close()); window.SBDISCORD.check(); });
      await p2.waitForTimeout(400);
      ok(/Join the Studyboard Discord/.test(await pop(p2)), "brand-new install: shown once a week has passed");
      ok(!e2.length, "no page errors: " + e2.join("; "));
      await c2.close();
    }

    // the pure rule
    ({ctx, page} = await open(browser, D(1, 1), D(11, 19), {uiSync: {"studyboard:discordInvite": {v: "1", at: 5}}}));
    const r = await page.evaluate(([a, b, c, d]) => [SBDISCORD.due(0, a), SBDISCORD.due(b, c), SBDISCORD.due(b, d), SBDISCORD.due(null, a)], [D(11, 19), D(12, 1), D(12, 7), D(12, 8, 13)]);
    ok(r[0] && !r[1] && r[2] && !r[3], "due(): old planner yes, a new user waits 7 days, unknown start never");
    await ctx.close();
    console.log("discord-invite e2e ok (" + n + " checks)");
  } finally { await browser.close(); web.close(); }
})().catch(e => { console.error(e); process.exit(1); });
