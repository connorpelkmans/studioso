// Offline checks for the cloud-files Edge Function (Google Drive and OneDrive)
import assert from "node:assert/strict";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const F = await import(pathToFileURL(path.resolve(root, "supabase-functions/cloud-files/index.ts")).href);
let passed = 0;
const test = async (name, fn) => { try { await fn(); passed++; console.log("ok   " + name); } catch (e) { console.error("FAIL " + name + "\n" + (e.stack || e)); process.exitCode = 1; } };
const UID = "11111111-2222-4333-8444-555555555555", SECRET = "c".repeat(48);
const FN_URL = "https://x.supabase.co/functions/v1/cloud-files";

function world(opts = {}) {
  let now = Date.parse("2026-10-20T16:00:00Z");
  const db = { accounts: new Map(), allowed: opts.allowed !== false };
  const g = { refresh: "g-refresh-1", refreshes: 0, revoked: [], badGrant: false, scope: opts.gScope };
  const ms = { refreshes: 0, n: 1 };
  const logs = [];
  const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { "content-type": "application/json" } });
  const key = (u, p) => u + "|" + p;
  const RPC = {
    cloud_allowed: () => db.allowed,
    cloud_account: a => { const x = db.accounts.get(key(a.p_uid, a.p_provider)); return x ? [x] : []; },
    cloud_status: a => [...db.accounts.values()].filter(x => x.user_id === a.p_uid).map(x => ({ provider: x.provider, account: x.account, status: x.status })),
    cloud_connect: a => { db.accounts.set(key(a.p_uid, a.p_provider), { user_id: a.p_uid, provider: a.p_provider, account: a.p_account, refresh_enc: a.p_refresh_enc, status: "ok", access_enc: null, access_exp: null, hits: 0 }); return null; },
    cloud_update: a => { const x = db.accounts.get(key(a.p_uid, a.p_provider)); if (!x) return null; if (a.p_refresh_enc) x.refresh_enc = a.p_refresh_enc; if (a.p_status) x.status = a.p_status;
      if (a.p_status === "reauth") { x.access_enc = null; x.access_exp = null; } else { if (a.p_access_enc) x.access_enc = a.p_access_enc; if (a.p_access_exp) x.access_exp = a.p_access_exp; } return null; },
    cloud_touch: a => { const x = db.accounts.get(key(a.p_uid, a.p_provider)); if (!x) return true; x.hits++; return x.hits <= 120; },
    cloud_disconnect: a => { db.accounts.delete(key(a.p_uid, a.p_provider)); return null; },
  };
  const fetch = async (url, init = {}) => {
    const u = new URL(String(url)), m = (init.method || "GET").toUpperCase();
    if (u.host === "x.supabase.co") {
      if (u.pathname === "/auth/v1/user") return (init.headers.Authorization === "Bearer user-jwt") ? json({ id: UID }) : json({}, 401);
      if (u.pathname === "/auth/v1/admin/users/" + UID) return json({ id: UID, email: "hannah@school.edu" });
      const name = u.pathname.replace("/rest/v1/rpc/", "");
      assert.equal(init.headers.Authorization, "Bearer svc", "the database is only asked with the service key");
      if (!RPC[name]) throw new Error("unknown rpc " + name);
      return json(RPC[name](JSON.parse(init.body)));
    }
    if (u.host === "oauth2.googleapis.com") {
      if (u.pathname === "/revoke") { g.revoked.push(u.searchParams.get("token")); return json({}); }
      const f = new URLSearchParams(init.body);
      assert.equal(f.get("client_secret"), "g-secret");
      if (f.get("grant_type") === "authorization_code") { assert.equal(f.get("redirect_uri"), FN_URL);
        return json({ access_token: "g-access-0", refresh_token: g.refresh, expires_in: 3599, scope: g.scope ?? "openid email https://www.googleapis.com/auth/drive.file", id_token: "h." + Buffer.from(JSON.stringify({ email: "student@gmail.com" })).toString("base64url") + ".s" }); }
      if (f.get("grant_type") === "refresh_token") { if (g.badGrant) return json({ error: "invalid_grant" }, 400); assert.equal(f.get("refresh_token"), g.refresh); g.refreshes++; return json({ access_token: "g-access-" + g.refreshes, expires_in: 3599 }); }
    }
    if (u.host === "login.microsoftonline.com") {
      const f = new URLSearchParams(init.body);
      assert.ok(/Files\.ReadWrite/.test(f.get("scope")) && /offline_access/.test(f.get("scope")));
      if (f.get("grant_type") === "refresh_token") { ms.refreshes++; ms.n++; }
      return json({ access_token: "m-access-" + ms.refreshes, refresh_token: "m-refresh-" + ms.n, expires_in: 3600, id_token: "h." + Buffer.from(JSON.stringify({ email: "student@outlook.com" })).toString("base64url") + ".s" });
    }
    throw new Error("unexpected " + m + " " + url);
  };
  const env = k => ({ SUPABASE_URL: "https://x.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "svc", SUPABASE_ANON_KEY: "anon", CLOUD_KEY: opts.key ?? SECRET, CLOUD_REDIRECT: opts.redirect || "",
    GOOGLE_CLIENT_ID: "g-id", GOOGLE_CLIENT_SECRET: "g-secret", MS_CLIENT_ID: opts.noMs ? "" : "m-id", MS_CLIENT_SECRET: opts.noMs ? "" : "m-secret" }[k] ?? "");
  const deps = { env, fetch, now: () => now, log: (...a) => logs.push(a.join(" ")) };
  const call = async (body, jwt = "user-jwt") => { const r = await F.handle(new Request(FN_URL, { method: "POST", headers: { authorization: "Bearer " + jwt, "content-type": "application/json" }, body: JSON.stringify(body) }), deps); return { status: r.status, body: await r.json() }; };
  const get = async (qs, cookie, via) => { const r = await F.handle(new Request(FN_URL + "?" + qs, { headers: { ...(cookie ? { cookie } : {}), ...(via ? { "x-studyboard-via": "site" } : {}) } }), deps); return { status: r.status, text: await r.text(), csp: r.headers.get("content-security-policy"), location: r.headers.get("location"), cookie: (r.headers.get("set-cookie") || "").split(";")[0] }; };
  const post = async (form, cookie) => { const r = await F.handle(new Request(FN_URL, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded", ...(cookie ? { cookie } : {}) }, body: new URLSearchParams(form).toString() }), deps); return { status: r.status, text: await r.text() }; };
  const connect = async (provider = "google") => {
    const s = await call({ action: "start", provider });
    const b = await get(new URL(s.body.url).search.slice(1));
    const st = new URL(b.location).searchParams.get("state");
    const c = await get(new URLSearchParams({ code: "good-code", state: st }).toString(), b.cookie);
    const box = (/name="confirm" value="([^"]+)"/.exec(c.text) || [])[1];
    const done = box ? await post({ confirm: box.replace(/&amp;/g, "&") }, b.cookie) : c;
    return Object.assign(done, { begin: b, confirmPage: c, state: st, box });
  };
  return { db, g, ms, logs, call, get, post, connect, tick: s => { now += s * 1000; } };
}

await test("not signed in, not Pro, not set up, unknown provider", async () => {
  assert.equal((await world().call({ action: "status" }, "nope")).status, 401);
  assert.equal((await world({ allowed: false }).call({ action: "start", provider: "google" })).status, 402);
  assert.equal((await world({ allowed: false }).call({ action: "token", provider: "google" })).status, 402, "no token without Pro");
  assert.equal((await world({ key: "short" }).call({ action: "status" })).status, 501);
  const w = world({ noMs: true });
  assert.deepEqual((await w.call({ action: "status" })).body.providers, { google: true, microsoft: false });
  assert.equal((await w.call({ action: "start", provider: "microsoft" })).status, 501);
  assert.equal((await w.call({ action: "start", provider: "dropbox" })).status, 400);
});
await test("connecting Google Drive: only drive.file, confirmed by the person, stored encrypted", async () => {
  const w = world();
  const page = await w.connect("google");
  const u = new URL(page.begin.location);
  assert.equal(u.host, "accounts.google.com");
  assert.equal(u.searchParams.get("scope"), "openid email https://www.googleapis.com/auth/drive.file", "only the files Studyboard makes");
  assert.ok(/^sbcf=/.test(page.begin.cookie));
  assert.ok(/Connect <b>student@gmail\.com<\/b> to the Studyboard account <b>hannah@school\.edu<\/b>/.test(page.confirmPage.text));
  assert.ok(/form-action 'self'/.test(page.confirmPage.csp) && !/<script/.test(page.confirmPage.text));
  assert.equal(page.status, 200); assert.ok(/Connected to Google Drive/.test(page.text));
  const a = w.db.accounts.get(UID + "|google");
  assert.ok(a && a.account === "student@gmail.com" && /^v1\./.test(a.refresh_enc) && !a.refresh_enc.includes("g-refresh-1"));
  assert.equal(await F.unseal(SECRET, a.refresh_enc, UID, "google"), "g-refresh-1");
  const st = await w.call({ action: "status" });
  assert.equal(st.body.accounts[0].provider, "google"); assert.ok(!JSON.stringify(st.body).includes("refresh"));
});
await test("Google: unticking the Drive box doesn't connect", async () => {
  const w = world({ gScope: "openid email" });
  const page = await w.connect("google");
  assert.equal(page.status, 400); assert.ok(/leave that box ticked/.test(page.text)); assert.equal(w.db.accounts.size, 0);
});
await test("someone else's link does nothing: no cookie, wrong cookie, forged state", async () => {
  const w = world();
  const s = await w.call({ action: "start", provider: "google" });
  const b = await w.get(new URL(s.body.url).search.slice(1));
  const st = new URL(b.location).searchParams.get("state");
  assert.equal((await w.get(new URLSearchParams({ code: "good-code", state: st }).toString())).status, 400);
  assert.equal((await w.get(new URLSearchParams({ code: "good-code", state: st }).toString(), "sbcf=wrongnonce12")).status, 400);
  assert.equal((await w.get(new URLSearchParams({ code: "good-code", state: st.slice(0, -2) + "xx" }).toString(), b.cookie)).status, 400);
  assert.equal((await w.post({ confirm: "v1.abc.def" }, b.cookie)).status, 400);
  assert.equal(w.db.accounts.size, 0);
});
await test("the access token: handed out, reused while fresh, refreshed when old", async () => {
  const w = world();
  assert.equal((await w.call({ action: "token", provider: "google" })).status, 404, "not connected yet");
  await w.connect("google");
  const before = w.g.refreshes;
  const t1 = await w.call({ action: "token", provider: "google" });
  assert.equal(t1.status, 200); assert.ok(t1.body.access.startsWith("g-access-") && t1.body.expires_in > 3000 && t1.body.account === "student@gmail.com");
  const a = w.db.accounts.get(UID + "|google");
  assert.ok(a.access_enc && !a.access_enc.includes(t1.body.access), "the cached access token is encrypted too");
  const t2 = await w.call({ action: "token", provider: "google" });
  assert.equal(t2.body.access, t1.body.access); assert.equal(w.g.refreshes, before + 1, "a fresh token is reused, not refreshed again");
  w.tick(3400);
  const t3 = await w.call({ action: "token", provider: "google" });
  assert.notEqual(t3.body.access, t1.body.access); assert.equal(w.g.refreshes, before + 2, "an old one is refreshed");
  await assert.rejects(F.unseal(SECRET, a.access_enc, UID, "google"), "the access token can't be opened as the refresh token");
});
await test("OneDrive: Files.ReadWrite, and Microsoft's new refresh token replaces the old one", async () => {
  const w = world();
  const page = await w.connect("microsoft");
  assert.ok(/Files\.ReadWrite/.test(new URL(page.begin.location).searchParams.get("scope")));
  assert.equal(page.status, 200); assert.ok(/Connected to OneDrive/.test(page.text));
  const r1 = await F.unseal(SECRET, w.db.accounts.get(UID + "|microsoft").refresh_enc, UID, "microsoft");
  const t = await w.call({ action: "token", provider: "microsoft" });
  assert.equal(t.status, 200);
  const r2 = await F.unseal(SECRET, w.db.accounts.get(UID + "|microsoft").refresh_enc, UID, "microsoft");
  assert.notEqual(r1, r2, "rotated");
});
await test("revoked access: reauth, and no token until they connect again", async () => {
  const w = world();
  await w.connect("google");
  w.g.badGrant = true;
  const t = await w.call({ action: "token", provider: "google" });
  assert.equal(t.status, 409); assert.equal(t.body.error, "reauth");
  assert.equal(w.db.accounts.get(UID + "|google").status, "reauth");
  assert.equal((await w.call({ action: "status" })).body.accounts[0].status, "reauth");
  assert.equal((await w.call({ action: "token", provider: "google" })).status, 409);
  w.g.badGrant = false;
  await w.connect("google");
  assert.equal((await w.call({ action: "token", provider: "google" })).status, 200, "connecting again fixes it");
});
await test("return address on the website: a direct link goes to the website first; from there it goes on to Google", async () => {
  const w = world({ redirect: "https://studyboardapp.com/functions/v1/cloud-files" });
  const st = await w.call({ action: "start", provider: "google" });
  assert.ok(st.body.url.startsWith("https://studyboardapp.com/functions/v1/cloud-files?begin="), "Connect starts on the website");
  const qs = new URL(st.body.url).search.slice(1);
  const direct = await w.get(qs);
  assert.equal(direct.status, 302); assert.ok(direct.location.startsWith("https://studyboardapp.com/functions/v1/cloud-files?begin="), "reached directly: sent to the website"); assert.equal(direct.cookie, "");
  const via = await w.get(qs, "", true);
  assert.equal(new URL(via.location).host, "accounts.google.com"); assert.ok(/^sbcf=/.test(via.cookie), "through the website: the cookie is set and it's on to Google");
  assert.equal(new URL(via.location).searchParams.get("redirect_uri"), "https://studyboardapp.com/functions/v1/cloud-files", "and Google sends people back to the website");
});
await test("too many token requests are refused", async () => {
  const w = world();
  await w.connect("google");
  w.db.accounts.get(UID + "|google").hits = 120;
  assert.equal((await w.call({ action: "token", provider: "google" })).status, 429);
});
await test("disconnect: revoked at Google, the row is gone", async () => {
  const w = world();
  await w.connect("google");
  const r = await w.call({ action: "disconnect", provider: "google" });
  assert.equal(r.status, 200); assert.deepEqual(w.g.revoked, ["g-refresh-1"]); assert.equal(w.db.accounts.size, 0);
  assert.equal((await w.call({ action: "disconnect", provider: "google" })).status, 200, "twice is fine");
});
await test("logs never carry tokens or addresses", async () => {
  const w = world();
  await w.connect("google"); await w.call({ action: "token", provider: "google" });
  const all = w.logs.join("\n");
  assert.ok(!/g-refresh|g-access|student@|hannah@/.test(all), all);
});
console.log(`\ncloud-files: ${passed} checks passed`);
