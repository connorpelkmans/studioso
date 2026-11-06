// Offline checks for the ms-signin Edge Function (Sign in with Microsoft for school, work and personal accounts)
import assert from "node:assert/strict";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import crypto from "node:crypto";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const F = await import(pathToFileURL(path.resolve(root, "supabase-functions/ms-signin/index.ts")).href);
let passed = 0;
const test = async (name, fn) => { try { await fn(); passed++; console.log("ok   " + name); } catch (e) { console.error("FAIL " + name + "\n" + (e.stack || e)); process.exitCode = 1; } };

const CLIENT = "aaaaaaaa-1111-2222-3333-444444444444", SCHOOL = "bbbbbbbb-1111-2222-3333-444444444444", EVIL = "cccccccc-1111-2222-3333-444444444444";
const FN = "https://x.supabase.co/functions/v1/ms-signin";
const b64u = o => Buffer.from(JSON.stringify(o)).toString("base64url");
const idToken = c => "h." + b64u(c) + ".sig";

function world(opts = {}) {
  let now = Date.parse("2026-11-06T16:00:00Z");
  const env = Object.assign({ SUPABASE_URL: "https://x.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "svc", MS_CLIENT_ID: CLIENT, MS_CLIENT_SECRET: "ms-secret", MS_SIGNIN_KEY: "k".repeat(40) }, opts.env || {});
  const users = new Map(opts.users || []), links = [], logs = [], tokenCalls = [];
  let claims = opts.claims || {};
  const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { "content-type": "application/json" } });
  const fetch = async (url, init = {}) => {
    const u = new URL(String(url));
    if (u.origin === "https://login.microsoftonline.com" && u.pathname.endsWith("/token")) {
      const p = new URLSearchParams(init.body); tokenCalls.push(Object.fromEntries(p));
      if (p.get("code") === "bad") return json({ error: "invalid_grant", error_description: "AADSTS70008: The provided authorization code has expired." }, 400);
      return json({ id_token: idToken(Object.assign({ aud: CLIENT, nonce: world.nonce, exp: Math.floor(now / 1000) + 3600 }, claims)), access_token: "at" });
    }
    if (u.host === "x.supabase.co") {
      assert.equal(init.headers.Authorization, "Bearer svc", "Supabase's admin API is only called with the service key");
      const b = JSON.parse(init.body || "{}");
      if (u.pathname === "/auth/v1/admin/users") {
        if (users.has(b.email)) return json({ msg: "A user with this email address has already been registered" }, 422);
        users.set(b.email, { email: b.email, confirmed: b.email_confirm, meta: b.user_metadata }); return json({ id: "new" });
      }
      if (u.pathname === "/auth/v1/admin/generate_link") { assert.equal(b.type, "magiclink"); links.push(b.email); return json({ id: "u", email: b.email, hashed_token: "hash-" + b.email, verification_type: "magiclink" }); }
    }
    throw new Error("unexpected fetch " + url);
  };
  let n = 0;
  const d = { env: k => env[k] ?? "", fetch, now: () => now, log: (...a) => logs.push(a.join(" ")), random: k => { const b = new Uint8Array(k); b.fill(++n); return b; } };
  const W = { d, users, links, logs, tokenCalls, setClaims: c => { claims = c; }, later: ms => { now += ms; },
    get: p => F.handle(new Request(FN + p), d),
    // start, then come back from Microsoft with the given code; returns where the person ends up
    async signIn(ret = "https://studyboardapp.com/", c, code = "good") {
      if (c) claims = c;
      const s = await W.get(`/start?return=${encodeURIComponent(ret)}&bind=bindbindbindbind1234`);
      assert.equal(s.status, 302, "start goes to Microsoft"); const ms = new URL(s.headers.get("location"));
      world.nonce = ms.searchParams.get("nonce"); W.lastAuth = ms;
      const back = await W.get(`/callback?code=${code}&state=${encodeURIComponent(ms.searchParams.get("state"))}`);
      return { status: back.status, to: back.headers.get("location") || "", body: back.status === 302 ? "" : await back.text() };
    }
  };
  return W;
}
const hashOf = to => new URLSearchParams(to.split("#")[1] || "");

await test("ready says whether it's set up", async () => {
  assert.deepEqual(await (await world().get("/ready")).json(), { ok: true });
  assert.deepEqual(await (await world({ env: { MS_SIGNIN_KEY: "", CLOUD_KEY: "", CALSYNC_KEY: "" } }).get("/ready")).json(), { ok: false }, "no key, not ready");
  assert.deepEqual(await (await world({ env: { MS_CLIENT_ID: "" } }).get("/ready")).json(), { ok: false }, "no client id, not ready");
  assert.deepEqual(await (await world({ env: { MS_SIGNIN_KEY: "", CLOUD_KEY: "c".repeat(40) } }).get("/ready")).json(), { ok: true }, "CLOUD_KEY is used when there's no MS_SIGNIN_KEY");
});

await test("start: Microsoft's sign-in page with PKCE, a nonce, the account picker and the email scope", async () => {
  const W = world(), r = await W.get(`/start?return=${encodeURIComponent("https://studyboardapp.com/")}&bind=bindbindbindbind1234`);
  const u = new URL(r.headers.get("location")), q = u.searchParams;
  assert.equal(u.origin + u.pathname, "https://login.microsoftonline.com/common/oauth2/v2.0/authorize");
  assert.equal(q.get("client_id"), CLIENT); assert.equal(q.get("redirect_uri"), FN + "/callback"); assert.equal(q.get("code_challenge_method"), "S256");
  assert.match(q.get("scope"), /\bopenid\b/); assert.match(q.get("scope"), /\bemail\b/); assert.equal(q.get("prompt"), "select_account");
  assert.ok(q.get("nonce").length >= 20 && q.get("code_challenge").length >= 40);
  assert.ok(!r.headers.get("location").includes("studyboardapp.com") && !q.get("state").includes("bindbind"), "the return address and the check aren't readable in the state (it's encrypted)");
});

await test("start refuses return addresses that aren't Studyboard's", async () => {
  const W = world();
  for (const bad of ["https://evil.example/", "https://studyboardapp.com.evil.example/", "http://studyboardapp.com/", "https://user@studyboardapp.com/", "studyboard://other", "http://127.0.0.1:9999/auth", "http://localhost:43821/auth", "javascript:alert(1)"]) {
    const r = await W.get(`/start?return=${encodeURIComponent(bad)}&bind=bindbindbindbind1234`);
    assert.equal(r.status, 400, bad);
  }
  for (const good of ["https://studyboardapp.com/", "https://www.studyboardapp.com/account/", "studyboard://auth-callback", "http://127.0.0.1:43822/auth"]) assert.equal((await W.get(`/start?return=${encodeURIComponent(good)}&bind=bindbindbindbind1234`)).status, 302, good);
  assert.equal((await W.get(`/start?return=${encodeURIComponent("https://studyboardapp.com/")}`)).status, 400, "the device check is required");
  const W2 = world({ env: { MS_SIGNIN_SITES: "https://staging.studyboardapp.com" } });
  assert.equal((await W2.get(`/start?return=${encodeURIComponent("https://staging.studyboardapp.com/")}&bind=bindbindbindbind1234`)).status, 302, "MS_SIGNIN_SITES adds websites");
});

await test("not set up: straight back with 'not enabled', so the app explains", async () => {
  const W = world({ env: { MS_CLIENT_SECRET: "" } });
  const r = await W.get(`/start?return=${encodeURIComponent("https://studyboardapp.com/")}&bind=bindbindbindbind1234`);
  assert.equal(r.status, 302); assert.match(hashOf(r.headers.get("location")).get("error_description"), /not enabled/);
});

await test("a school account with no email: signed in with its school sign-in name", async () => {
  const W = world(), r = await W.signIn("https://studyboardapp.com/", { tid: SCHOOL, iss: `https://login.microsoftonline.com/${SCHOOL}/v2.0`, preferred_username: "Sam.Lee@School.edu", name: "Sam Lee" });
  const h = hashOf(r.to);
  assert.equal(r.status, 302); assert.ok(r.to.startsWith("https://studyboardapp.com/#"));
  assert.equal(h.get("sb_ms"), "hash-sam.lee@school.edu"); assert.equal(h.get("sb_ms_bind"), "bindbindbindbind1234");
  assert.deepEqual(W.users.get("sam.lee@school.edu"), { email: "sam.lee@school.edu", confirmed: true, meta: { provider_hint: "azure", ms_how: "upn", full_name: "Sam Lee", name: "Sam Lee", first_name: "Sam" } });
  assert.equal(W.tokenCalls[0].code_verifier.length > 40, true, "the PKCE verifier goes with the code");
  assert.equal(W.tokenCalls[0].client_secret, "ms-secret");
});

await test("a school account with a vouched-for email uses the email", async () => {
  let r = await world().signIn(undefined, { tid: SCHOOL, iss: `https://login.microsoftonline.com/${SCHOOL}/v2.0`, preferred_username: "s123@school.onmicrosoft.com", email: "sam@school.edu", xms_edov: true });
  assert.equal(hashOf(r.to).get("sb_ms"), "hash-sam@school.edu", "xms_edov: the organisation owns the email's domain");
  r = await world().signIn(undefined, { tid: SCHOOL, iss: `https://login.microsoftonline.com/${SCHOOL}/v2.0`, preferred_username: "sam.lee@school.edu", email: "sam@school.edu" });
  assert.equal(hashOf(r.to).get("sb_ms"), "hash-sam@school.edu", "the email is on the same domain as the sign-in name");
});

await test("an email Microsoft doesn't vouch for is never trusted (a stranger's organisation can type anyone's address)", async () => {
  // someone makes their own Microsoft organisation and sets a user's mail to the victim's address
  const W = world({ users: [["victim@gmail.com", { email: "victim@gmail.com" }]] });
  const r = await W.signIn(undefined, { tid: EVIL, iss: `https://login.microsoftonline.com/${EVIL}/v2.0`, preferred_username: "me@evilco.onmicrosoft.com", email: "victim@gmail.com", xms_edov: false });
  assert.equal(hashOf(r.to).get("sb_ms"), "hash-me@evilco.onmicrosoft.com", "they get their own sign-in name, not the victim's account");
  assert.ok(!W.links.includes("victim@gmail.com"));
  // and with no sign-in name to fall back on, nothing
  const r2 = await world().signIn(undefined, { tid: EVIL, iss: `https://login.microsoftonline.com/${EVIL}/v2.0`, email: "victim@gmail.com" });
  assert.match(hashOf(r2.to).get("error_description"), /getting user email/);
});

await test("guests and public mail domains aren't used as school sign-in names", async () => {
  let r = await world().signIn(undefined, { tid: SCHOOL, iss: `https://login.microsoftonline.com/${SCHOOL}/v2.0`, preferred_username: "victim@gmail.com", upn: "victim_gmail.com#EXT#@school.onmicrosoft.com" });
  assert.match(hashOf(r.to).get("error_description"), /getting user email/, "a guest");
  r = await world().signIn(undefined, { tid: SCHOOL, iss: `https://login.microsoftonline.com/${SCHOOL}/v2.0`, preferred_username: "someone@outlook.com" });
  assert.match(hashOf(r.to).get("error_description"), /getting user email/, "a public mail domain");
});

await test("school domains that start like a public mail service aren't mistaken for one", async () => {
  for (const name of ["sam@mail.school.edu", "sam@me.company.com", "sam@live.k12.ca.us", "sam@outlook.district.org", "sam@email.school.edu"]) {
    const r = await world().signIn(undefined, { tid: SCHOOL, iss: `https://login.microsoftonline.com/${SCHOOL}/v2.0`, preferred_username: name });
    assert.equal(hashOf(r.to).get("sb_ms"), "hash-" + name, name);
  }
  for (const name of ["sam@gmail.com", "sam@hotmail.co.uk", "sam@yahoo.com.au", "sam@outlook.fr"]) {
    const r = await world().signIn(undefined, { tid: SCHOOL, iss: `https://login.microsoftonline.com/${SCHOOL}/v2.0`, preferred_username: name });
    assert.ok(!hashOf(r.to).get("sb_ms"), name + " is still refused");
  }
});

await test("the log says which rule refused an account, with the domain only", async () => {
  const W = world(); await W.signIn(undefined, { tid: SCHOOL, iss: `https://login.microsoftonline.com/${SCHOOL}/v2.0`, preferred_username: "sam@gmail.com" });
  assert.ok(W.logs.some(l => /public mail domain \(gmail\.com\)/.test(l)) && W.logs.every(l => !/sam@/.test(l)), W.logs.join(" | "));
  const W2 = world(); await W2.signIn(undefined, { tid: SCHOOL, iss: `https://login.microsoftonline.com/${SCHOOL}/v2.0` });
  assert.ok(W2.logs.some(l => /no sign-in name/.test(l)), W2.logs.join(" | "));
});

await test("a personal Microsoft account uses its email; one without an email is told why", async () => {
  let r = await world().signIn(undefined, { tid: F.PERSONAL_TENANT, iss: `https://login.microsoftonline.com/${F.PERSONAL_TENANT}/v2.0`, email: "Sam@Outlook.com", preferred_username: "sam@outlook.com" });
  assert.equal(hashOf(r.to).get("sb_ms"), "hash-sam@outlook.com");
  r = await world().signIn(undefined, { tid: F.PERSONAL_TENANT, iss: `https://login.microsoftonline.com/${F.PERSONAL_TENANT}/v2.0`, preferred_username: "+15551234567" });
  assert.match(hashOf(r.to).get("error_description"), /getting user email/);
});

await test("an existing Studyboard account with that address is signed in, not duplicated", async () => {
  const W = world({ users: [["sam@school.edu", { email: "sam@school.edu", meta: { full_name: "Samantha" } }]] });
  const r = await W.signIn(undefined, { tid: SCHOOL, iss: `https://login.microsoftonline.com/${SCHOOL}/v2.0`, preferred_username: "sam@school.edu", name: "Sam Lee" });
  assert.equal(hashOf(r.to).get("sb_ms"), "hash-sam@school.edu"); assert.deepEqual(W.users.get("sam@school.edu").meta, { full_name: "Samantha" }, "their name isn't changed");
});

await test("every platform's return address gets the result", async () => {
  for (const ret of ["studyboard://auth-callback", "http://127.0.0.1:43821/auth", "https://studyboardapp.com/account/"]) {
    const r = await world().signIn(ret, { tid: SCHOOL, iss: `https://login.microsoftonline.com/${SCHOOL}/v2.0`, preferred_username: "sam@school.edu" });
    assert.ok(r.to.startsWith(ret + "#sb_ms="), ret + " -> " + r.to);
  }
});

await test("tampered, foreign, stale or replayed sign-ins are refused", async () => {
  const W = world(), c = { tid: SCHOOL, iss: `https://login.microsoftonline.com/${SCHOOL}/v2.0`, preferred_username: "sam@school.edu" };
  // a made-up state
  let r = await W.get(`/callback?code=good&state=abc.def`); assert.equal(r.status, 400);
  // a state from another key
  const other = await F.sealState("z".repeat(40), { r: "https://studyboardapp.com/", b: "bindbindbindbind1234", v: "v", n: "n", e: 9e9 }, new Uint8Array(12));
  r = await W.get(`/callback?code=good&state=${encodeURIComponent(other)}`); assert.equal(r.status, 400, "a state made with another key");
  // a state that ran out
  const s = await W.get(`/start?return=${encodeURIComponent("https://studyboardapp.com/")}&bind=bindbindbindbind1234`);
  const st = new URL(s.headers.get("location")).searchParams.get("state"); world.nonce = new URL(s.headers.get("location")).searchParams.get("nonce");
  W.later(16 * 60000); r = await W.get(`/callback?code=good&state=${encodeURIComponent(st)}`); assert.equal(r.status, 400, "after 15 minutes");
  // a flipped byte in the state
  const W2 = world(); const s2 = await W2.get(`/start?return=${encodeURIComponent("https://studyboardapp.com/")}&bind=bindbindbindbind1234`);
  const st2 = new URL(s2.headers.get("location")).searchParams.get("state"), flip = st2.slice(0, -3) + (st2.slice(-3, -2) === "A" ? "B" : "A") + st2.slice(-2);
  assert.equal((await W2.get(`/callback?code=good&state=${encodeURIComponent(flip)}`)).status, 400, "a changed state");
  // ID tokens for another app, another sign-in, from elsewhere, or expired
  for (const [what, extra] of [["another app", { aud: "someone-else" }], ["another sign-in", { nonce: "other" }], ["not from Microsoft", { iss: "https://evil.example/v2.0" }], ["expired", { exp: 1 }]]) {
    const W3 = world(); W3.d.fetch = (orig => async (url, init) => { const res = await orig(url, init); if (!String(url).endsWith("/token")) return res; const j = await res.json(); const p = JSON.parse(Buffer.from(j.id_token.split(".")[1], "base64url")); j.id_token = "h." + b64u(Object.assign(p, extra)) + ".sig"; return new Response(JSON.stringify(j), { status: 200 }); })(W3.d.fetch);
    const rr = await W3.signIn(undefined, c);
    assert.ok(hashOf(rr.to).get("error_description") && !hashOf(rr.to).get("sb_ms"), what);
  }
  // Microsoft refusing the code
  r = await world().signIn(undefined, c, "bad"); assert.match(hashOf(r.to).get("error_description"), /AADSTS70008/);
});

await test("Microsoft's own errors (cancelled, admin approval) come back to the app with their words", async () => {
  const W = world(); const s = await W.get(`/start?return=${encodeURIComponent("studyboard://auth-callback")}&bind=bindbindbindbind1234`);
  const st = new URL(s.headers.get("location")).searchParams.get("state");
  const r = await W.get(`/callback?error=access_denied&error_description=${encodeURIComponent("AADSTS65001: The user or administrator has not consented")}&state=${encodeURIComponent(st)}`);
  const h = hashOf(r.headers.get("location"));
  assert.equal(h.get("error"), "access_denied"); assert.match(h.get("error_description"), /AADSTS65001/); assert.equal(h.get("sb_ms_bind"), "bindbindbindbind1234");
});

await test("nothing a student sent or their address is written to the logs", async () => {
  const W = world(); await W.signIn(undefined, { tid: SCHOOL, iss: `https://login.microsoftonline.com/${SCHOOL}/v2.0`, preferred_username: "sam@school.edu", name: "Sam Lee" });
  assert.ok(W.logs.every(l => !/sam@|Sam Lee|hash-/.test(l)), W.logs.join(" | "));
});

console.log(`ms-signin: ${passed} checks passed`);
