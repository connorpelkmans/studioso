// node tests/oauth-signin.e2e.js: Sign in with Apple / Sign in with Google on the sign-in sheet. Supabase is faked here:
// the web goes to the provider and comes back signed in; the app (iPhone/Android) opens the provider outside the app and
// turns what comes back into a session; on iPhone, Apple's own sheet's token is exchanged with Supabase.
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const root = path.join(__dirname, "..");
const MIME = {".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".webmanifest": "application/manifest+json", ".png": "image/png", ".css": "text/css", ".svg": "image/svg+xml", ".webp": "image/webp"};
const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x"); let p = decodeURIComponent(u.pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  res.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const b64 = o => Buffer.from(JSON.stringify(o)).toString("base64url");
const USER = {id: "11111111-2222-3333-4444-555555555555", aud: "authenticated", role: "authenticated", email: "sam@example.com", app_metadata: {provider: "google"}, user_metadata: {}, created_at: new Date().toISOString()};
const jwt = () => b64({alg: "HS256", typ: "JWT"}) + "." + b64({sub: USER.id, aud: "authenticated", role: "authenticated", email: USER.email, exp: Math.floor(Date.now() / 1000) + 3600}) + ".sig";
(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  const errs = [];
  const fakeSupabase = async (ctx, seen) => {
    await ctx.routeWebSocket(/supabase\.co/, ws => ws.close());   // route() does not cover WebSockets: keep the fake token off the real Realtime server
    await ctx.route(/supabase\.co/, async r => {
      const u = new URL(r.request().url());
      seen.push(r.request().method() + " " + u.pathname + (u.searchParams.get("grant_type") ? "?" + u.searchParams.get("grant_type") : "") + (u.searchParams.get("provider") ? " " + u.searchParams.get("provider") : ""));
      if (u.pathname === "/auth/v1/authorize") {   // the provider, approving at once and sending the person back
        const back = u.searchParams.get("redirect_to");
        if (ctx.failWith) return r.fulfill({status: 302, headers: {location: back + "#error=server_error&error_code=unexpected_failure&error_description=" + encodeURIComponent(ctx.failWith).replace(/%20/g, "+")}});
        return r.fulfill({status: 302, headers: {location: back + "#access_token=" + jwt() + "&refresh_token=rt1&expires_in=3600&token_type=bearer"}});
      }
      // Studyboard's own Microsoft step (ms-signin), when a test turns it on: straight back with a one-time token
      if (u.pathname === "/functions/v1/ms-signin/ready") return r.fulfill({status: 200, contentType: "application/json", body: JSON.stringify({ok: !!ctx.msBridge})});
      if (u.pathname === "/functions/v1/ms-signin/start") { ctx.msStarts = (ctx.msStarts || []).concat(u.href); const bind = ctx.msWrongBind ? "someone-elses-bind-123" : u.searchParams.get("bind"); return r.fulfill({status: 302, headers: {location: u.searchParams.get("return") + "#sb_ms=hash-sam&sb_ms_bind=" + bind}}); }
      if (u.pathname === "/auth/v1/verify") { ctx.verified = (ctx.verified || []).concat(r.request().postData()); return r.fulfill({status: 200, contentType: "application/json", body: JSON.stringify({access_token: jwt(), refresh_token: "rt9", expires_in: 3600, token_type: "bearer", user: USER})}); }
      if (u.pathname === "/auth/v1/user") return r.fulfill({status: 200, contentType: "application/json", body: JSON.stringify(USER)});
      if (u.pathname === "/auth/v1/token") return r.fulfill({status: 200, contentType: "application/json", body: JSON.stringify({access_token: jwt(), refresh_token: "rt2", expires_in: 3600, token_type: "bearer", user: USER})});
      if (u.pathname.startsWith("/rest/") || u.pathname.startsWith("/storage/") || u.pathname.startsWith("/functions/")) return r.fulfill({status: 200, contentType: "application/json", body: "[]"});
      return r.abort();
    });
  };
  const MAC_UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15";
  const open = async (init, seen, ua) => {
    const ctx = await browser.newContext({viewport: {width: 430, height: 900}, userAgent: ua || MAC_UA});
    await fakeSupabase(ctx, seen);
    if (init) await ctx.addInitScript(init);
    const page = await ctx.newPage(); page.on("pageerror", e => errs.push(e.message));
    await page.goto(base);
    await page.waitForSelector('dialog[open] .sb-welc [data-sbm="signin"]', {timeout: 15000});
    await page.click('dialog[open] .sb-welc [data-sbm="signin"]');
    await page.waitForSelector("dialog[open] [data-oauth=google]", {timeout: 8000});
    return {ctx, page};
  };
  const signedIn = page => page.waitForFunction(() => { try { const k = Object.keys(localStorage).find(x => /studioso-auth/.test(x)); return !!k && /access_token/.test(localStorage.getItem(k)); } catch (e) { return false; } }, null, {timeout: 10000}).then(() => true, () => false);
  try {
    // the sheet
    let seen = [];
    let {ctx, page} = await open(null, seen);
    const btn = await page.evaluate(() => [...document.querySelectorAll("dialog[open] [data-oauth]")].map(b => { const r = b.getBoundingClientRect(); return {p: b.dataset.oauth, t: b.textContent.trim(), w: Math.round(r.width), h: Math.round(r.height)}; }));
    ok(btn.length === 3 && btn[0].t === "Sign in with Apple" && btn[1].t === "Sign in with Google" && btn[2].t === "Sign in with Microsoft" && btn[2].p === "azure" && btn.every(b => b.w === btn[0].w && b.h === btn[0].h) && btn[0].h >= 44,
      "sign in offers Sign in with Apple, Google and Microsoft, the same size, above the email form: " + JSON.stringify(btn));
    ok(await page.evaluate(() => { const o = document.querySelector("dialog[open] .sb-or"), e = document.querySelector("dialog[open] input[name=email]"); return !!o && !!(o.compareDocumentPosition(e) & Node.DOCUMENT_POSITION_FOLLOWING); }), "then 'or use your email' and the email form");
    await page.click('dialog[open] [data-sbm="signup"]');
    await page.waitForSelector("dialog[open] form.sb-acct[data-mode=signup] [data-oauth=apple]", {timeout: 5000});
    ok(true, "Create Account offers them too");
    // the web: off to Google and back, signed in
    await page.click("dialog[open] [data-oauth=google]");
    ok(await signedIn(page), "web: Sign in with Google goes to Google and comes back signed in");
    ok(seen.some(x => /authorize google/.test(x)) && seen.some(x => /\/auth\/v1\/user/.test(x)), "through Supabase's Google sign-in: " + seen.filter(x => /auth/.test(x)).join(", "));
    await ctx.close();

    // the web: Microsoft (Supabase's "azure"), asking for the email and letting them pick the account
    seen = [];
    ({ctx, page} = await open(null, seen));
    const msUrls = []; page.on("request", r => { if (/\/auth\/v1\/authorize/.test(r.url())) msUrls.push(r.url()); });
    await page.click("dialog[open] [data-oauth=azure]");
    ok(await signedIn(page), "web: Sign in with Microsoft goes to Microsoft and comes back signed in");
    const msq = msUrls[0] ? new URL(msUrls[0]).searchParams : new URLSearchParams();
    ok(msq.get("provider") === "azure" && /\bemail\b/.test(msq.get("scopes") || "") && msq.get("prompt") === "select_account", "through Supabase's Microsoft (azure) sign-in, with the email scope and the account picker: " + (msUrls[0] || "none"));
    await ctx.close();

    // the app: Google opens outside the app and its return address is made into a session
    seen = [];
    ({ctx, page} = await open(() => {
      window.__opened = [];
      window.StudyboardNative = {signIn: {redirect: "studyboard://auth-callback", apple: null, open: url => { window.__opened.push(url); return fetch(url, {redirect: "manual"}).then(() => null).catch(() => null).then(() => "studyboard://auth-callback#access_token=" + window.__jwt + "&refresh_token=rt3&expires_in=3600&token_type=bearer"); }}};
    }, seen));
    await page.evaluate(t => { window.__jwt = t; }, jwt());
    await page.click("dialog[open] [data-oauth=google]");
    ok(await signedIn(page), "app: Sign in with Google opens Google outside the app and signs in with what comes back");
    const opened = await page.evaluate(() => window.__opened);
    ok(opened.length === 1 && /\/auth\/v1\/authorize\?/.test(opened[0]) && /provider=google/.test(opened[0]) && /redirect_to=studyboard%3A%2F%2Fauth-callback/.test(opened[0]) && /prompt=select_account/.test(opened[0]),
      "it opened Supabase's Google page, set to return to studyboard://auth-callback and to let them pick an account");
    ok(await page.evaluate(() => !location.hash && location.href.startsWith("http://localhost")), "and the app itself never left its page");
    await ctx.close();

    // the web: a Microsoft sign-in that comes back with an error says what went wrong (not "that link expired")
    seen = [];
    ({ctx, page} = await open(null, seen));
    ctx.failWith = "Error getting user email from external provider";
    await page.click("dialog[open] [data-oauth=azure]");
    await page.waitForFunction(() => { const d = document.querySelector("dialog[open]"); return d && /Sign-In Didn.t Finish|Link Didn.t Work/.test(d.innerText); }, null, {timeout: 10000}).catch(() => {});
    { const t = await page.evaluate(() => (document.querySelector("dialog[open]") || {}).innerText || "");
      ok(/Sign-In Didn.t Finish/.test(t) && /Microsoft didn.t share your email/.test(t) && !/expired/.test(t), "a failed Microsoft sign-in explains what went wrong, instead of \"That link didn't work\": " + t.replace(/\s+/g, " ").slice(0, 160)); }
    await ctx.close();

    // the app: the same error, coming back through studyboard://auth-callback
    seen = [];
    ({ctx, page} = await open(() => { window.StudyboardNative = {signIn: {redirect: "studyboard://auth-callback", apple: null, open: () => Promise.resolve("studyboard://auth-callback#error=server_error&error_description=Unable+to+exchange+external+code")}}; }, seen));
    await page.click("dialog[open] [data-oauth=azure]"); await page.waitForTimeout(600);
    ok(/Microsoft didn.t accept Studyboard.s sign-in settings/.test(await page.evaluate(() => (document.getElementById("sbMsg") || {}).textContent || "")), "in the app too, in plain words");
    await ctx.close();

    // Studyboard's own Microsoft step (ms-signin), once it's deployed: school and work accounts with no "email" work too
    seen = [];
    ({ctx, page} = await open(null, seen)); ctx.msBridge = true;
    await page.click("dialog[open] [data-oauth=azure]");
    ok(await signedIn(page), "web: with Studyboard's own Microsoft step deployed, Sign in with Microsoft goes through it and comes back signed in");
    { const st = new URL(ctx.msStarts[0]).searchParams;
      ok(st.get("return") === new URL(page.url()).origin + "/" && /^[A-Za-z0-9_-]{30,}$/.test(st.get("bind")), "it starts at ms-signin with this page as the return address and a random device check");
      ok((ctx.verified || []).some(b => /"token_hash":"hash-sam"/.test(b) && /"type":"magiclink"/.test(b)), "and its one-time token is swapped for a session");
      ok(await page.evaluate(() => !/sb_ms/.test(location.hash)), "the token is cleared from the address"); }
    await ctx.close();
    // a sign-in begun somewhere else (another device or someone else's link) isn't finished here
    seen = [];
    ({ctx, page} = await open(null, seen)); ctx.msBridge = true; ctx.msWrongBind = true;
    await page.click("dialog[open] [data-oauth=azure]"); await page.waitForTimeout(2500);
    ok(!(ctx.verified || []).length && await page.evaluate(() => !Object.keys(localStorage).some(k => /studioso-auth/.test(k) && /access_token/.test(localStorage.getItem(k)))), "a sign-in that didn't start on this device isn't finished (no session)");
    await ctx.close();
    // the app (iPhone, Android) and the desktop app through the same step
    seen = [];
    ({ctx, page} = await open(() => {
      window.__opened = [];
      window.StudyboardNative = {signIn: {redirect: "studyboard://auth-callback", apple: null, open: url => { window.__opened.push(url); const b = new URL(url).searchParams.get("bind"); return Promise.resolve("studyboard://auth-callback#sb_ms=hash-sam&sb_ms_bind=" + b); }}};
    }, seen)); ctx.msBridge = true;
    await page.click("dialog[open] [data-oauth=azure]");
    ok(await signedIn(page), "app: through Studyboard's Microsoft step, back via studyboard://auth-callback, signed in");
    ok(await page.evaluate(() => new URL(window.__opened[0]).searchParams.get("return")) === "studyboard://auth-callback" && /\/functions\/v1\/ms-signin\/start\?/.test(await page.evaluate(() => window.__opened[0])), "it opened ms-signin, returning to the app");
    await ctx.close();
    seen = [];
    ({ctx, page} = await open(() => {
      window.__desk = [];
      const real = {platform: "win32", dataDir: () => Promise.resolve(""), oauthPort: () => Promise.resolve(43822), oauthOpen: url => { window.__desk.push(url); return Promise.resolve("http://127.0.0.1:43822/auth#sb_ms=hash-sam&sb_ms_bind=" + new URL(url).searchParams.get("bind")); }};
      window.studiosoDesktop = real;
    }, seen, "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36")); ctx.msBridge = true;
    await page.click("dialog[open] [data-oauth=azure]");
    ok(await signedIn(page), "desktop: through Studyboard's Microsoft step in the computer's browser, signed in");
    ok(await page.evaluate(() => new URL(window.__desk[0]).searchParams.get("return")) === "http://127.0.0.1:43822/auth", "returning to the one-time page on this computer");
    await ctx.close();

    // the app (iPhone, Android): Microsoft the same way, outside the app
    seen = [];
    ({ctx, page} = await open(() => {
      window.__opened = [];
      window.StudyboardNative = {signIn: {redirect: "studyboard://auth-callback", apple: null, open: url => { window.__opened.push(url); return Promise.resolve("studyboard://auth-callback#access_token=" + window.__jwt + "&refresh_token=rt3&expires_in=3600&token_type=bearer"); }}};
    }, seen));
    await page.evaluate(t => { window.__jwt = t; }, jwt());
    await page.click("dialog[open] [data-oauth=azure]");
    ok(await signedIn(page), "app: Sign in with Microsoft opens Microsoft outside the app and signs in with what comes back");
    { const o = await page.evaluate(() => window.__opened); const q = o[0] ? new URL(o[0]).searchParams : new URLSearchParams();
      ok(o.length === 1 && q.get("provider") === "azure" && q.get("redirect_to") === "studyboard://auth-callback" && /\bemail\b/.test(q.get("scopes") || ""), "it opened Supabase's Microsoft page, returning to studyboard://auth-callback, with the email scope"); }
    await ctx.close();

    // the desktop app (Mac, Windows): Microsoft in the computer's browser, back through the one-time page on this computer
    seen = [];
    ({ctx, page} = await open(() => {
      window.__desk = [];
      // the desktop bridge: the two sign-in calls (and where its data folder is)
      const real = {platform: "win32", oauthPort: () => Promise.resolve(43821),
        oauthOpen: url => { window.__desk.push(url); return Promise.resolve("http://127.0.0.1:43821/auth#access_token=" + window.__jwt + "&refresh_token=rt4&expires_in=3600&token_type=bearer"); }};
      real.dataDir = () => Promise.resolve("");
      window.studiosoDesktop = real;
    }, seen, "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36"));
    await page.evaluate(t => { window.__jwt = t; }, jwt());
    ok(await page.evaluate(() => [...document.querySelectorAll("dialog[open] [data-oauth]")].map(b => b.dataset.oauth).join()) === "apple,google,azure", "the Windows app offers Apple, Google and Microsoft");
    await page.click("dialog[open] [data-oauth=azure]");
    ok(await signedIn(page), "desktop: Sign in with Microsoft signs in through the computer's browser");
    { const o = await page.evaluate(() => window.__desk); const q = o[0] ? new URL(o[0]).searchParams : new URLSearchParams();
      ok(o.length === 1 && q.get("provider") === "azure" && q.get("redirect_to") === "http://127.0.0.1:43821/auth", "returning to the one-time page on this computer: " + (o[0] || "none")); }
    await ctx.close();

    // the app, cancelled: nothing happens, no message
    seen = [];
    ({ctx, page} = await open(() => { window.StudyboardNative = {signIn: {redirect: "studyboard://auth-callback", apple: null, open: () => Promise.resolve(null)}}; }, seen));
    await page.click("dialog[open] [data-oauth=google]"); await page.waitForTimeout(500);
    ok(await page.evaluate(() => !!document.querySelector("dialog[open] [data-oauth=google]") && !document.querySelector("dialog[open] [data-oauth=google]").disabled && !(document.getElementById("sbMsg").textContent || "").trim()), "closing Google's page leaves the sheet as it was, quietly");
    await ctx.close();

    // iPhone: Apple's own sheet, its token exchanged with Supabase
    seen = [];
    ({ctx, page} = await open(() => {
      window.StudyboardNative = {signIn: {redirect: "studyboard://auth-callback", open: () => Promise.resolve(null), apple: () => Promise.resolve({idToken: "apple.id.token", nonce: "raw-nonce", name: "Sam Lee", code: "c.native-code-123"})}};
    }, seen));
    const posted = [];
    page.on("request", r => { if (/\/auth\/v1\/token|apple-token/.test(r.url())) posted.push(r.url() + " " + r.postData()); });
    await page.click("dialog[open] [data-oauth=apple]");
    ok(await signedIn(page), "iPhone: Sign in with Apple uses Apple's own sheet and signs in");
    ok(posted.some(p => /"provider":"apple"/.test(p) && /"id_token":"apple.id.token"/.test(p) && /"nonce":"raw-nonce"/.test(p)), "with Apple's token and the unhashed nonce sent to Supabase");
    await page.waitForTimeout(500);
    ok(posted.some(p => /\/functions\/v1\/delete-account\/apple-token/.test(p) && /"code":"c.native-code-123"/.test(p)), "and Apple's one-time code is handed to the server, so deleting the account can revoke Sign in with Apple");
    await ctx.close();

    // not an Apple device: Apple too (an account made with Apple on the iPhone signs in on a Windows computer)
    seen = [];
    ({ctx, page} = await open(null, seen, "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36"));
    ok(await page.evaluate(() => [...document.querySelectorAll("dialog[open] [data-oauth]")].map(b => b.dataset.oauth).join()) === "apple,google,azure", "on Windows (or Android, Linux) Sign in with Apple is offered too, with Google and Microsoft");
    await page.click("dialog[open] [data-oauth=apple]");
    ok(await signedIn(page), "on Windows, Sign in with Apple goes to Apple's web sign-in and comes back signed in");
    ok(seen.some(x => /authorize apple/.test(x)), "through Supabase's Apple sign-in: " + seen.filter(x => /auth/.test(x)).join(", "));
    await ctx.close();
    ok(!errs.length, "no page errors: " + errs.join(" | "));
    console.log(`oauth-signin.e2e: ${n} checks passed`);
  } finally { await browser.close(); server.close(); }
})().catch(e => { console.error(e); process.exit(1); });
