// Sign-in token refused by the server. Run: node tests/sync-reauth.e2e.js
// The real sign-in library (vendor/supabase-js) runs in Chromium against a stand-in Supabase (auth + REST) served by request interception.
// The bug: the server refused a saved token this device still thought was good (device clock behind, or the server's signing keys changed).
// The library only renews a token when the device's own clock says it ran out, so every request failed with "JWT expired", reloading reused
// the same token, and sync showed "Connecting…" / "reconnecting" until site data was cleared. Checks:
//   1. a valid saved session connects (control)
//   2. server says the token expired, device clock says it's fine: the session is renewed and sync connects, also after a reload
//   3. server can't verify the token (signing keys changed): same
//   4. the refused token can't be renewed either (signed out elsewhere): signed out cleanly, never stuck on "Connecting…"
//   5. already connected when the server starts refusing the token: catching up renews it and stays connected
//   6. another Studyboard tab has the device's sync database open while this one deletes it (signing out does): the other tab lets go,
//      so after a reload this tab connects (it used to wait on the database forever and stay on "reconnecting" until site data was cleared)
//   7. a tab that never lets go (an older version still open) holds it: sync connects anyway, without the device copy
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
const USER = {id: "11111111-1111-1111-1111-111111111111", aud: "authenticated", role: "authenticated", email: "me@example.com", app_metadata: {provider: "email"}, user_metadata: {}, created_at: "2026-01-01T00:00:00Z"};
const S = {skew: 0, badSig: new Set(), refresh: new Set(), serial: 0, log: []};
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
const reset = () => { S.skew = 0; S.badSig = new Set(); S.log = []; };

(async () => {
  await new Promise(r => web.listen(0, "127.0.0.1", r));
  const browser = await chromium.launch({executablePath});
  try {
    console.log("1. valid saved session");
    { reset(); const {ctx, page, errs} = await open(browser, mint());
      ok(/^Saved$/.test(await until(page, /^Saved$/)), "connects");
      ok(!errs.length, "no page errors: " + errs.join("; "));
      await ctx.close(); }

    console.log("2. server says the saved token expired (device clock two hours behind)");
    { reset(); const s = mint(); S.skew = 2 * 36e5;
      const {ctx, page} = await open(browser, s);
      ok(/^Saved$/.test(await until(page, /^Saved$/)), "renews the session and connects instead of staying on Connecting…");
      ok(S.log.includes("POST /auth/v1/token"), "the session was renewed");
      await page.reload();
      ok(/^Saved$/.test(await until(page, /^Saved$/)), "still connects after a reload");
      await ctx.close(); }

    console.log("3. server can't verify the saved token (signing keys changed)");
    { reset(); const s = mint(); S.badSig.add(S.serial);
      const {ctx, page} = await open(browser, s);
      ok(/^Saved$/.test(await until(page, /^Saved$/)), "renews the session and connects");
      await ctx.close(); }

    console.log("4. refused token whose renewal is refused too (signed out elsewhere)");
    { reset(); const s = mint(); S.badSig.add(S.serial); S.refresh.delete(s.refresh_token);
      const {ctx, page} = await open(browser, s);
      const t = await until(page, /^Not signed in/);
      ok(/^Not signed in/.test(t), "signed out cleanly instead of a sync that never connects: " + t);
      await page.waitForTimeout(1500);
      ok(/^Not signed in/.test(await label(page)), "never shows Saved while signed out");
      ok(await page.evaluate(() => !localStorage.getItem("studioso-auth")), "the dead session is gone from the device");
      await ctx.close(); }

    console.log("5. connected, then the server starts refusing the token");
    { reset(); const {ctx, page} = await open(browser, mint());
      ok(/^Saved$/.test(await until(page, /^Saved$/)), "connects first");
      S.skew = 2 * 36e5; S.log = [];
      await page.evaluate(() => { Object.defineProperty(document, "hidden", {configurable: true, get: () => true}); document.dispatchEvent(new Event("visibilitychange")); });
      await page.evaluate(() => { Object.defineProperty(document, "hidden", {configurable: true, get: () => false}); document.dispatchEvent(new Event("visibilitychange")); });
      await page.waitForTimeout(2500);
      ok(S.log.includes("POST /auth/v1/token"), "catching up renewed the refused token");
      ok(S.log.filter(l => l.startsWith("GET /rest/v1/items")).length >= 2, "and sent the request again");
      ok(/^Saved$/.test(await label(page)), "stays connected");
      await ctx.close(); }

    console.log("6. another Studyboard tab holds the sync database while this one deletes it");
    { reset(); const s = mint();
      const {ctx, page: A} = await open(browser, s);
      ok(/^Saved$/.test(await until(A, /^Saved$/)), "tab A connects");
      const B = await ctx.newPage(); await B.goto("http://127.0.0.1:" + web.address().port + "/__blank");
      const del = await B.evaluate(() => new Promise(ok => { const r = indexedDB.deleteDatabase("studyboard-sync"); r.onsuccess = () => ok("deleted"); setTimeout(() => ok("still waiting"), 3000); }));
      ok(del === "deleted", "the open tab lets go, so the delete finishes: " + del);
      await A.reload();
      ok(/^Saved$/.test(await until(A, /^Saved$/, 15000)), "after a reload the tab connects again");
      await ctx.close(); }

    console.log("7. a tab that never lets go holds the sync database");
    { reset(); const s = mint();
      const ctx = await browser.newContext({serviceWorkers: "block", viewport: {width: 1200, height: 800}});
      const H = await ctx.newPage(); await H.goto("http://127.0.0.1:" + web.address().port + "/__blank");
      await H.evaluate(() => new Promise(ok => { const r = indexedDB.open("studyboard-sync", 1); r.onupgradeneeded = () => r.result.createObjectStore("rows"); r.onsuccess = () => { window.keep = r.result; ok(); }; }));   // no onversionchange: never lets go
      await H.evaluate(() => { indexedDB.deleteDatabase("studyboard-sync"); });   // a sign-out elsewhere: this delete now waits forever
      const {page} = await open(browser, s, ctx);
      ok(/^Saved$/.test(await until(page, /^Saved$/, 20000)), "sync connects anyway, without the device copy");
      await ctx.close(); }

    console.log("sync-reauth e2e ok (" + n + " checks)");
  } finally { await browser.close(); web.close(); }
})().catch(e => { console.error(e); process.exit(1); });
