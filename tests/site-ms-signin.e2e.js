// Browser test: Sign in with Microsoft on the website's Account page, through Studyboard's own step (ms-signin) once it's
// deployed, and through Supabase's built-in Microsoft sign-in until then
// Run: node tests/site-ms-signin.e2e.js
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const root = path.join(__dirname, "..", "website");
const MIME = {".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".woff2": "font/woff2", ".json": "application/json"};
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname); if (p.endsWith("/")) p += "index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  res.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const b64 = o => Buffer.from(JSON.stringify(o)).toString("base64url");
const USER = {id: "11111111-2222-3333-4444-555555555555", aud: "authenticated", role: "authenticated", email: "sam@school.edu", app_metadata: {provider: "email"}, user_metadata: {full_name: "Sam Lee"}, created_at: new Date().toISOString()};
const jwt = () => b64({alg: "HS256", typ: "JWT"}) + "." + b64({sub: USER.id, aud: "authenticated", role: "authenticated", email: USER.email, exp: Math.floor(Date.now() / 1000) + 3600}) + ".sig";

(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port;
  const browser = await chromium.launch({executablePath});
  const errs = [];
  const open = async o => {
    const ctx = await browser.newContext({viewport: {width: 900, height: 900}}); ctx.o = o; ctx.seen = []; ctx.verified = [];
    await ctx.routeWebSocket(/supabase\.co/, ws => ws.close());
    await ctx.route(/supabase\.co/, async r => {
      const u = new URL(r.request().url()); ctx.seen.push(u.pathname + (u.searchParams.get("provider") ? " " + u.searchParams.get("provider") : ""));
      if (u.pathname === "/functions/v1/ms-signin/ready") return r.fulfill({status: 200, contentType: "application/json", body: JSON.stringify({ok: !!o.bridge})});
      if (u.pathname === "/functions/v1/ms-signin/start") { ctx.start = u; const bind = o.wrongBind ? "another-browsers-bind-123" : u.searchParams.get("bind"); return r.fulfill({status: 302, headers: {location: u.searchParams.get("return") + "#sb_ms=hash-sam&sb_ms_bind=" + bind}}); }
      if (u.pathname === "/auth/v1/authorize") { ctx.authorize = u; return r.fulfill({status: 302, headers: {location: u.searchParams.get("redirect_to") + "#access_token=" + jwt() + "&refresh_token=rt1&expires_in=3600&token_type=bearer"}}); }
      if (u.pathname === "/auth/v1/verify") { ctx.verified.push(r.request().postData()); return r.fulfill({status: 200, contentType: "application/json", body: JSON.stringify({access_token: jwt(), refresh_token: "rt2", expires_in: 3600, token_type: "bearer", user: USER})}); }
      if (u.pathname === "/auth/v1/user") return r.fulfill({status: 200, contentType: "application/json", body: JSON.stringify(USER)});
      if (u.pathname.startsWith("/rest/") || u.pathname.startsWith("/functions/")) return r.fulfill({status: 200, contentType: "application/json", body: "[]"});
      return r.fulfill({status: 404, body: "{}"});
    });
    const page = await ctx.newPage(); page.on("pageerror", e => errs.push(e.message));
    await page.goto(base + "/account/"); await page.waitForSelector("#oa-ms:not([disabled])", {timeout: 10000});
    return {ctx, page};
  };
  const signedIn = page => page.waitForFunction(() => { const k = localStorage.getItem("studyboard-site-auth"); return !!k && /access_token/.test(k); }, null, {timeout: 10000}).then(() => true, () => false);
  try {
    // through Studyboard's own step
    let {ctx, page} = await open({bridge: true});
    await page.click("#oa-ms");
    ok(await signedIn(page), "with ms-signin deployed, Sign in with Microsoft on the website goes through it and comes back signed in");
    const st = ctx.start.searchParams;
    ok(st.get("return") === base + "/account/" && /^[A-Za-z0-9_-]{30,}$/.test(st.get("bind")), "it returns to the Account page, with a random browser check");
    ok(ctx.verified.some(b => /"token_hash":"hash-sam"/.test(b) && /"type":"magiclink"/.test(b)) && !ctx.authorize, "its one-time token becomes the session (Supabase's own Microsoft sign-in isn't used)");
    ok(await page.evaluate(() => !/sb_ms/.test(location.hash)), "and the token is cleared from the address");
    await ctx.close();

    // a sign-in begun in another browser isn't finished here
    ({ctx, page} = await open({bridge: true, wrongBind: true}));
    await page.click("#oa-ms"); await page.waitForTimeout(2000);
    ok(!ctx.verified.length && !(await page.evaluate(() => /access_token/.test(localStorage.getItem("studyboard-site-auth") || ""))), "a sign-in that began in another browser isn't finished");
    ok(/another browser/.test(await page.evaluate(() => (document.getElementById("auth-msg") || {}).textContent || "")), "and it says so");
    await ctx.close();

    // not deployed yet: Supabase's own Microsoft sign-in, with the email scope
    ({ctx, page} = await open({bridge: false}));
    await page.click("#oa-ms");
    ok(await signedIn(page), "until ms-signin is deployed, Supabase's own Microsoft sign-in is used");
    ok(ctx.authorize && ctx.authorize.searchParams.get("provider") === "azure" && /\bemail\b/.test(ctx.authorize.searchParams.get("scopes") || ""), "as the azure provider, with the email scope");
    await ctx.close();

    ok(!errs.length, "no page errors: " + errs.join(" | "));
    console.log(`site-ms-signin.e2e: ${n} checks passed`);
  } finally { await browser.close(); server.close(); }
})().catch(e => { console.error(e); process.exit(1); });
