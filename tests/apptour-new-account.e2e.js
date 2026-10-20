// A brand-new account gets the welcome setup and then the app tour, even on a device that already showed both. Run: node tests/apptour-new-account.e2e.js
// (The tour used to be remembered per device only, so a new account on a browser that had seen it never got it.)
// Uses the real sign-in library against a stand-in Supabase, like sync-reauth.e2e.js.
const fs = require("fs"), path = require("path"), http = require("http"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const ROOT = path.join(__dirname, "..");
const SB = "https://reauth.supabase.test";
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("  ok " + m); };

const web = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]); if (p === "/") p = "/index.html";
  if (p === "/__blank") { res.writeHead(200, {"content-type": "text/html"}); res.end("<!doctype html><title>holder</title>"); return; }
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT)) { res.writeHead(404); res.end(); return; }
  fs.readFile(f, (e, b) => { if (e) { res.writeHead(404); res.end(); return; } res.writeHead(200, {"content-type": /\.html$/.test(p) ? "text/html" : /\.m?js$/.test(p) ? "text/javascript" : /\.css$/.test(p) ? "text/css" : "application/octet-stream"}); res.end(b); });
});

/* ---------- stand-in Supabase ---------- */
const b64 = o => Buffer.from(JSON.stringify(o)).toString("base64url");
const USER = {id: "11111111-1111-1111-1111-111111111111", aud: "authenticated", role: "authenticated", email: "me@example.com", app_metadata: {provider: "email"}, user_metadata: {}, created_at: new Date().toISOString()};
const S = {skew: 0, badSig: new Set(), refresh: new Set(), serial: 0, log: [], hang: false};
const srvNow = () => Date.now() + S.skew;   // the server's clock; the browser keeps the real one
function mint(){
  const iat = Math.floor(srvNow() / 1000), exp = iat + 3600, k = ++S.serial;
  const s = {access_token: b64({alg: "HS256", typ: "JWT"}) + "." + b64({sub: USER.id, exp, iat, role: "authenticated", aud: "authenticated", k}) + ".sig",
    token_type: "bearer", expires_in: 3600, expires_at: exp, refresh_token: "rt" + k, user: USER};
  S.refresh.add(s.refresh_token);
  return s;
}
function tokenState(h){
  const p = String(h || "").replace(/^Bearer /, "").split(".");
  if (p.length !== 3) return "anon";
  try { const c = JSON.parse(Buffer.from(p[1], "base64url").toString()); return S.badSig.has(c.k) ? "bad" : c.exp * 1000 > srvNow() ? "ok" : "expired"; } catch (e) { return "bad"; }
}
async function handle(route){
  const req = route.request(), u = new URL(req.url()), m = req.method();
  const send = (status, body) => route.fulfill({status, contentType: "application/json", headers: {"access-control-allow-origin": "*", "access-control-allow-headers": "*", "access-control-allow-methods": "*", "access-control-expose-headers": "*"}, body: body === undefined ? "" : JSON.stringify(body)});
  if (m === "OPTIONS") return send(200);
  S.log.push(m + " " + u.pathname);
  if (u.pathname === "/auth/v1/token") {
    const body = JSON.parse(req.postData() || "{}");
    if (u.searchParams.get("grant_type") === "refresh_token") {
      if (!S.refresh.has(body.refresh_token)) return send(400, {code: "refresh_token_not_found", error_code: "refresh_token_not_found", msg: "Invalid Refresh Token: Refresh Token Not Found"});
      S.refresh.delete(body.refresh_token);
    }
    return send(200, mint());
  }
  if (u.pathname === "/auth/v1/user") return tokenState(req.headers()["authorization"]) === "ok" ? send(200, USER) : send(403, {code: "bad_jwt", msg: "invalid JWT"});
  if (u.pathname === "/auth/v1/logout") return send(204);
  if (u.pathname.startsWith("/rest/v1/")) {
    if (S.hang && m === "GET") return;   // the server never answers
    const t = tokenState(req.headers()["authorization"]);
    if (t === "expired") return send(401, {code: "PGRST303", details: null, hint: null, message: "JWT expired"});
    if (t === "bad") return send(401, {code: "PGRST301", details: null, hint: null, message: "JWSError JWSInvalidSignature"});
    if (u.pathname.startsWith("/rest/v1/rpc/")) return send(404, {code: "PGRST202", message: "Could not find the function"});
    if (m === "GET") return /vnd\.pgrst\.object/.test(req.headers()["accept"] || "") ? send(406, {code: "PGRST116", message: "0 rows"}) : send(200, []);
    return send(201, m === "POST" ? [{updated_at: new Date().toISOString()}] : []);
  }
  return send(404, {});
}

async function open(browser, session, ctxIn){
  const ctx = ctxIn || await browser.newContext({serviceWorkers: "block", viewport: {width: 1200, height: 800}});
  await ctx.route(SB + "/**", handle);
  await ctx.addInitScript(([sb, sess]) => {
    if (sessionStorage.getItem("seeded")) return; sessionStorage.setItem("seeded", "1");
    localStorage.setItem("studioso:sb", JSON.stringify({url: sb, key: "anon-key"}));
    localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "done"); localStorage.setItem("studioso:welcomed", "1");
    localStorage.setItem("studioso-auth", sess);
  }, [SB, JSON.stringify(session)]);
  const page = await ctx.newPage(), errs = [];
  page.on("pageerror", e => errs.push(e.message));
  await page.goto("http://127.0.0.1:" + web.address().port + "/");
  return {ctx, page, errs};
}
const label = page => page.evaluate(() => (document.querySelector("#sync") || {}).textContent || "");
const until = async (page, re, ms) => { const end = Date.now() + (ms || 10000); let t = ""; while (Date.now() < end) { t = await label(page); if (re.test(t)) return t; await page.waitForTimeout(150); } return t; };
const reset = () => { S.skew = 0; S.badSig = new Set(); S.log = []; S.hang = false; };

(async () => {
  await new Promise(r => web.listen(0, "127.0.0.1", r));
  const browser = await chromium.launch({executablePath});
  try {
    reset(); const {ctx, page, errs} = await open(browser, mint());
    await page.waitForSelector(".sheet.ob", {timeout: 20000});
    ok(true, "a brand-new account gets the welcome setup, on a device that did it before");
    await page.evaluate(() => { const b = [...document.querySelectorAll(".sheet.ob button")].find(x => /Skip Tour/i.test(x.textContent)); b ? b.click() : document.querySelector("dialog[open]").close(); });
    await page.waitForTimeout(500);
    if (await page.$("dialog[open] .sheet.ob")) { await page.evaluate(() => { const b = [...document.querySelectorAll("dialog[open] button")].find(x => /Skip|Close|Done|Add My First/i.test(x.textContent)); if (b) b.click(); }); }
    const got = await page.waitForFunction(() => window.SBTOUR && SBTOUR.active(), null, {timeout: 12000}).then(() => true, () => false);
    ok(got, "then the app tour around the tabs starts");
        ok(!errs.length, "no page errors: " + errs.join("; "));
    await ctx.close();
    console.log("apptour-new-account e2e ok (" + n + " checks)");
  } finally { await browser.close(); web.close(); }
})().catch(e => { console.error(e); process.exit(1); });
