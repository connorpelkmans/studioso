// "Introducing Studyboard AI" popup (99-ai-intro.js): who sees it, when, and that nobody ever sees it twice
const fs = require("fs"), path = require("path"), http = require("http"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const ROOT = path.join(__dirname, "..");
const SB = "https://aiintro.supabase.test";
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
      localStorage.setItem("coursework:v2", JSON.stringify({v: 2, updated: 1, settings: settings || {}, tasks: [], courses: []}));
    }
  }, [SB, JSON.stringify(mint()), settings]);
  await ctx.addInitScript(t => { window.__aiIntroTest = {now: () => t}; }, nowMs);
  const page = await ctx.newPage(), errs = [];
  page.on("pageerror", e => errs.push(e.message));
  await page.goto("http://127.0.0.1:" + web.address().port + "/");
  await page.waitForFunction(() => window.SBAIINTRO, null, {timeout: 15000}).catch(async e => { console.log(errs, await page.evaluate(() => [typeof SBAIINTRO, typeof PLAN, document.title])); throw e; });
  await page.waitForTimeout(7000);
  // (a fake sign-up date later than the real clock makes the app treat the account as brand new, so its welcome dialog may be open)
  await page.evaluate(() => { document.querySelectorAll("dialog[open]").forEach(d => d.close()); window.SBAIINTRO.check(); });
  await page.waitForTimeout(500);
  return {ctx, page, errs};
}
const pop = page => page.evaluate(() => { const e = document.querySelector("#qod.aii"); return e ? e.innerText.replace(/\s+/g, " ") : ""; });

(async () => {
  await new Promise(r => web.listen(0, "127.0.0.1", r));
  const browser = await chromium.launch({executablePath});
  try {
    // pure rule
    // an existing user sees it, with the wording and the small print
    let {ctx, page, errs} = await open(browser, D(1, 1), D(11, 12));
    let t = await pop(page);
    ok(/Introducing Studyboard AI!/.test(t) && /Now included with Studyboard Pro/.test(t), "existing user sees the popup");
    ok(/Compared to free Gemini/.test(t) && /2x faster/.test(t) && /never used to train models/.test(t), "it lists the comparison");
    ok(/Only for users with paid Pro\./.test(t), "small print says it is only for paid Pro");
    ok(!errs.length, "no page errors: " + errs.join("; "));
    await page.evaluate(() => document.querySelector("#qod [data-qod-close]").click());
    await page.waitForTimeout(500);
    await page.evaluate(() => { window.SBAIINTRO.check(); });
    ok(!(await pop(page)), "closed");
    // the same device, opened again and much later: never again
    await page.reload(); await page.waitForFunction(() => window.SBAIINTRO);
    await page.waitForTimeout(7000); await page.evaluate(() => window.SBAIINTRO.check());
    ok(!(await pop(page)), "not shown a second time after a reload");
    ok(await page.evaluate(() => SBAIINTRO.seen()), "marked as seen");
    await ctx.close();

    // seen on another device (only in the account's synced settings): not shown here
    ({ctx, page} = await open(browser, D(1, 1), D(11, 12), {uiSync: {"studyboard:aiIntro": {v: "1", at: 5}}}));
    ok(!(await pop(page)), "seen on another device: not shown");
    await ctx.close();

    // joined 12 Nov: not on day 1, yes after 2 days
    ({ctx, page} = await open(browser, D(11, 12, 8), D(11, 13, 8)));
    ok(!(await pop(page)), "new user: nothing on day 1");
    await ctx.close();
    ({ctx, page} = await open(browser, D(11, 12, 8), D(11, 14, 9)));
    ok(/Introducing Studyboard AI!/.test(await pop(page)), "new user: shown after 2 days");
    await ctx.close();

    // joined after the 2 weeks: never. After the end date: nobody
    ({ctx, page} = await open(browser, D(11, 26), D(12, 20)));
    ok(!(await pop(page)), "joined after the window: never");
    await ctx.close();
    ({ctx, page} = await open(browser, D(1, 1), D(11, 29)));
    ok(!(await pop(page)), "after the end date: nobody");
    await ctx.close();

    // last person in the window still gets theirs
    ({ctx, page} = await open(browser, D(11, 24, 23), D(11, 27, 1)));
    ok(/Introducing Studyboard AI!/.test(await pop(page)), "joined on the last day: shown after 2 days");
    await ctx.close();
    console.log("ai-intro e2e ok (" + n + " checks)");
  } finally { await browser.close(); web.close(); }
})().catch(e => { console.error(e); process.exit(1); });
