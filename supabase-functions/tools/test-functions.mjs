// Offline checks for the Studyboard Pro Edge Functions (no network, no Supabase). Run from the repo root:
//   node --experimental-strip-types supabase-functions/tools/test-functions.mjs
// (Node 22.6 or newer.) It loads the real function files with fake network calls and checks the rules.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { webcrypto as crypto } from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../..");
const load = (p) => import(pathToFileURL(path.resolve(root, p)).href);
let passed = 0;
const test = async (name, fn) => { try { await fn(); passed++; console.log("ok   " + name); } catch (e) { console.error("FAIL " + name + "\n" + (e.stack || e)); process.exitCode = 1; } };

// ---- keys from the real generator script
const out = execFileSync(process.execPath, [path.join(here, "gen-ent-key.mjs")], { encoding: "utf8" });
const PRIV = out.match(/ENT_SIGNING_KEY=(\S+)/)[1];
const PUB = out.match(/ENT_PUBKEY=(\S+)/)[1];
const b64urlToBytes = (s) => Uint8Array.from(Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64"));

const ent = await load("supabase-functions/entitlement-token/index.ts");
const wh = await load("index (1).ts");
const co = await load("supabase-functions/create-checkout/index.ts");
const pt = await load("supabase-functions/create-portal-session/index.ts");

const UID = "11111111-2222-4333-8444-555555555555";
const OTHER = "99999999-2222-4333-8444-555555555555";
const NOW = 1_800_000_000_000;   // fixed clock (ms)
const S = NOW / 1000;
const log = () => {};

await test("public key is 32 raw bytes, private key imports", async () => {
  assert.equal(b64urlToBytes(PUB).length, 32);
  assert.match(PUB, /^[A-Za-z0-9_-]{43}$/); assert.match(PRIV, /^[A-Za-z0-9_-]+$/);
});

// ---- entitlement-token
function tokenDeps(row, opts = {}) {
  const calls = [];
  const env = (k) => ({ SUPABASE_URL: "https://x.supabase.co", SUPABASE_ANON_KEY: "anon", SUPABASE_SERVICE_ROLE_KEY: "svc", ENT_SIGNING_KEY: PRIV }[k] ?? "");
  const f = async (url, init = {}) => {
    calls.push([String(url), init]);
    if (String(url).endsWith("/auth/v1/user")) return opts.badAuth ? new Response("{}", { status: 401 }) : new Response(JSON.stringify({ id: UID }));
    if (String(url).includes("rpc/studyboard_plan_rate_hit")) return new Response(JSON.stringify(opts.limited ? false : true));
    if (String(url).includes("studyboard_entitlements")) return new Response(JSON.stringify(row ? [row] : []));
    return new Response("{}", { status: 500 });
  };
  return { deps: { env, fetch: f, now: () => NOW, log }, calls };
}
const tokenReq = (auth = "Bearer abc") => new Request("https://x/functions/v1/entitlement-token", { method: "POST", headers: auth ? { authorization: auth } : {} });

async function verify(tok) {
  const pub = await crypto.subtle.importKey("raw", b64urlToBytes(PUB), { name: "Ed25519" }, false, ["verify"]);
  return crypto.subtle.verify({ name: "Ed25519" }, pub, b64urlToBytes(tok.sig), new TextEncoder().encode(`studyboard-ent-v1|${tok.uid}|${tok.tier}|${tok.exp}|${tok.iat}`));
}

await test("token: free user gets a 1-day signed free token that verifies", async () => {
  const { deps } = tokenDeps(null);
  const res = await ent.handle(tokenReq(), deps);
  assert.equal(res.status, 200);
  assert.equal(res.headers.get("x-server-time"), String(S));
  const t = await res.json();
  assert.deepEqual(Object.keys(t).sort(), ["exp", "iat", "sig", "tier", "uid"]);
  assert.equal(t.tier, "free"); assert.equal(t.uid, UID); assert.equal(t.iat, S); assert.equal(t.exp, S + 86400);
  assert.equal(await verify(t), true);
  // tampering breaks it
  assert.equal(await verify({ ...t, tier: "pro" }), false);
  assert.equal(await verify({ ...t, exp: t.exp + 1 }), false);
  assert.equal(await verify({ ...t, uid: OTHER }), false);
});
await test("token: paid pro is capped at 7 days, and by the stored end", async () => {
  let t = await (await ent.handle(tokenReq(), tokenDeps({ plan: "pro", pro_until: new Date(NOW + 30 * 86400e3).toISOString() }).deps)).json();
  assert.equal(t.tier, "pro"); assert.equal(t.exp, S + 7 * 86400); assert.equal(await verify(t), true);
  t = await (await ent.handle(tokenReq(), tokenDeps({ plan: "pro", pro_until: new Date(NOW + 3 * 86400e3).toISOString() }).deps)).json();
  assert.equal(t.exp, S + 3 * 86400);
  t = await (await ent.handle(tokenReq(), tokenDeps({ plan: "pro", pro_until: new Date(NOW - 1000).toISOString() }).deps)).json();
  assert.equal(t.tier, "free");
});
await test("token: trial 2 days, grant, lifetime", async () => {
  let t = await (await ent.handle(tokenReq(), tokenDeps({ plan: "free", trial_until: new Date(NOW + 6 * 86400e3).toISOString() }).deps)).json();
  assert.equal(t.tier, "trial"); assert.equal(t.exp, S + 2 * 86400);
  t = await (await ent.handle(tokenReq(), tokenDeps({ plan: "pro", pro_until: new Date(NOW + 9 * 86400e3).toISOString(), trial_until: new Date(NOW + 6 * 86400e3).toISOString() }).deps)).json();
  assert.equal(t.tier, "trial");
  t = await (await ent.handle(tokenReq(), tokenDeps({ plan: "free", grant_lifetime: true }).deps)).json();
  assert.equal(t.tier, "lifetime"); assert.equal(t.exp, S + 7 * 86400); assert.ok(t.exp - t.iat <= 8 * 86400);
  t = await (await ent.handle(tokenReq(), tokenDeps({ plan: "free", grant_until: new Date(NOW + 86400e3).toISOString() }).deps)).json();
  assert.equal(t.tier, "pro"); assert.equal(t.exp, S + 86400);
  t = await (await ent.handle(tokenReq(), tokenDeps({ plan: "lifetime" }).deps)).json();
  assert.equal(t.tier, "lifetime");
});
await test("token: needs sign-in, honours the rate limit, hides internals on error", async () => {
  assert.equal((await ent.handle(tokenReq(null), tokenDeps(null).deps)).status, 401);
  assert.equal((await ent.handle(tokenReq(), tokenDeps(null, { badAuth: true }).deps)).status, 401);
  assert.equal((await ent.handle(tokenReq(), tokenDeps(null, { limited: true }).deps)).status, 429);
  const { deps } = tokenDeps(null); deps.env = (k) => (k === "ENT_SIGNING_KEY" ? "" : tokenDeps(null).deps.env(k));
  const r = await ent.handle(tokenReq(), deps);
  assert.equal(r.status, 500); assert.deepEqual(await r.json(), { error: "server error, please retry" });
  assert.equal((await ent.handle(new Request("https://x/", { method: "OPTIONS" }), tokenDeps(null).deps)).status, 204);
});

// ---- billing webhook
const WH_SECRET = "whsec_test_secret";
async function sign(body, t = S, secret = WH_SECRET) {
  const k = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = Buffer.from(await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(`${t}.${body}`))).toString("hex");
  return `t=${t},v1=${sig}`;
}
function whDeps(extra = {}) {
  const applied = []; const stripeCalls = [];
  const env = (k) => ({ SUPABASE_URL: "https://x.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "svc", STRIPE_WEBHOOK_SECRET: WH_SECRET, STRIPE_SECRET_KEY: "sk_test_x", REVENUECAT_WEBHOOK_AUTH: "rc-secret-rc-secret-rc", ...extra.env }[k] ?? "");
  const f = async (url, init = {}) => {
    url = String(url);
    if (url.includes("rpc/studyboard_apply_billing")) { applied.push(JSON.parse(init.body).p); return new Response(JSON.stringify("pro")); }
    if (url.startsWith("https://api.stripe.com/")) { stripeCalls.push(url); return new Response(JSON.stringify(extra.stripe?.(url) ?? {})); }
    return new Response("{}", { status: 500 });
  };
  return { deps: { env, fetch: f, now: () => NOW, log }, applied, stripeCalls };
}
const stripeReq = async (ev, opts = {}) => { const body = JSON.stringify(ev); return new Request("https://x/functions/v1/billing-webhook/stripe", { method: "POST", headers: { "stripe-signature": opts.header ?? await sign(body, opts.t) }, body }); };

await test("stripe: bad / missing / old / future / wrong-secret signature is refused and nothing is applied", async () => {
  const ev = { id: "evt_1", type: "customer.subscription.updated", created: S, data: { object: { customer: "cus_1", status: "active", current_period_end: S + 86400 } } };
  for (const opts of [{ header: "" }, { header: "t=1,v1=abc" }, { t: S - 301 }, { t: S + 301 }, { header: await sign(JSON.stringify(ev), S, "whsec_other") }]) {
    const { deps, applied } = whDeps();
    const r = await wh.handle(await stripeReq(ev, opts), deps);
    assert.equal(r.status, 400); assert.equal(applied.length, 0);
  }
  // tampered body with a valid-looking header for another body
  const { deps, applied } = whDeps();
  const good = await sign(JSON.stringify(ev));
  const r = await wh.handle(new Request("https://x/billing-webhook/stripe", { method: "POST", headers: { "stripe-signature": good }, body: JSON.stringify({ ...ev, id: "evt_2" }) }), deps);
  assert.equal(r.status, 400); assert.equal(applied.length, 0);
});
await test("stripe: a verified event inside the 5 minute window is applied", async () => {
  const ev = { id: "evt_ok", type: "customer.subscription.updated", created: S, data: { object: { customer: "cus_1", status: "active", current_period_end: S + 86400, metadata: { uid: UID } } } };
  const { deps, applied } = whDeps();
  const r = await wh.handle(await stripeReq(ev, { t: S - 299 }), deps);
  assert.equal(r.status, 200);
  assert.equal(applied.length, 1);
  assert.equal(applied[0].state, "active"); assert.equal(applied[0].customer, "cus_1"); assert.equal(applied[0].uid_hint, UID); assert.equal(applied[0].trust_hint, true);
  assert.equal(applied[0].pro_until, new Date(NOW + 86400e3 + 3 * 86400e3).toISOString());
  assert.equal(applied[0].event_id, "evt_ok");
});
await test("stripe: checkout.session.completed needs client_reference_id == metadata.uid (our own checkout)", async () => {
  const sub = { status: "trialing", customer: "cus_1", current_period_end: S + 7 * 86400, trial_end: S + 7 * 86400 };
  const mk = (o) => ({ id: "evt_c", type: "checkout.session.completed", created: S, data: { object: { mode: "subscription", payment_status: "no_payment_required", customer: "cus_1", subscription: "sub_1", ...o } } });
  let { deps, applied } = whDeps({ stripe: () => sub });
  await wh.handle(await stripeReq(mk({ client_reference_id: UID, metadata: { uid: UID } })), deps);
  assert.equal(applied.length, 1); assert.equal(applied[0].fresh, true); assert.ok(applied[0].trial_until);
  for (const o of [{ client_reference_id: UID }, { client_reference_id: UID, metadata: { uid: OTHER } }, { client_reference_id: "not-a-uuid", metadata: { uid: "not-a-uuid" } }, { client_reference_id: UID, metadata: { uid: UID }, payment_status: "unpaid" }, { client_reference_id: UID, metadata: { uid: UID }, mode: "payment" }]) {
    ({ deps, applied } = whDeps({ stripe: () => sub }));
    const r = await wh.handle(await stripeReq(mk(o)), deps);
    assert.equal(r.status, 200); assert.equal(applied.length, 0, JSON.stringify(o));
  }
  // customer on the subscription differs from the session's customer
  ({ deps, applied } = whDeps({ stripe: () => ({ ...sub, customer: "cus_other" }) }));
  await wh.handle(await stripeReq(mk({ client_reference_id: UID, metadata: { uid: UID } })), deps);
  assert.equal(applied.length, 0);
});
await test("stripe: status mapping (trialing/active/past_due grace, canceled, unpaid, incomplete)", async () => {
  const run = async (status, extra = {}) => {
    const { deps, applied } = whDeps();
    await wh.handle(await stripeReq({ id: "evt_" + status, type: "customer.subscription.updated", created: S, data: { object: { customer: "cus_1", status, current_period_end: S + 86400, ...extra } } }), deps);
    return applied[0];
  };
  assert.equal((await run("trialing", { trial_end: S + 86400 })).state, "active");
  assert.equal((await run("active")).state, "active");
  assert.equal((await run("active", { cancel_at_period_end: true })).will_renew, false);
  const pd = await run("past_due"); assert.equal(pd.state, "active"); assert.equal(pd.pro_until, new Date(NOW + 4 * 86400e3).toISOString());
  for (const s of ["canceled", "unpaid", "incomplete_expired", "paused"]) assert.equal((await run(s)).state, "ended", s);
  assert.equal(await run("incomplete"), undefined);
});
await test("stripe: invoice.paid extends; refunds and disputes revoke; won dispute clears", async () => {
  let { deps, applied } = whDeps();
  await wh.handle(await stripeReq({ id: "evt_i", type: "invoice.paid", created: S, data: { object: { customer: "cus_1", subscription: "sub_1", lines: { data: [{ period: { end: S + 10 * 86400 } }] } } } }), deps);
  assert.equal(applied[0].state, "extend");
  ({ deps, applied } = whDeps());
  await wh.handle(await stripeReq({ id: "evt_i2", type: "invoice.paid", created: S, data: { object: { customer: "cus_1", lines: { data: [{ period: { end: S + 10 * 86400 } }] } } } }), deps);
  assert.equal(applied.length, 0);
  ({ deps, applied } = whDeps());
  await wh.handle(await stripeReq({ id: "evt_r", type: "charge.refunded", created: S, data: { object: { customer: "cus_1", refunded: true } } }), deps);
  await wh.handle(await stripeReq({ id: "evt_r2", type: "charge.refunded", created: S, data: { object: { customer: "cus_1", refunded: false } } }), deps);
  assert.deepEqual(applied.map(a => a.state), ["revoke"]);
  ({ deps, applied } = whDeps({ stripe: () => ({ customer: "cus_1" }) }));
  await wh.handle(await stripeReq({ id: "evt_d", type: "charge.dispute.created", created: S, data: { object: { charge: "ch_1" } } }), deps);
  await wh.handle(await stripeReq({ id: "evt_d2", type: "charge.dispute.closed", created: S, data: { object: { charge: "ch_1", status: "won" } } }), deps);
  await wh.handle(await stripeReq({ id: "evt_d3", type: "charge.dispute.closed", created: S, data: { object: { charge: "ch_1", status: "lost" } } }), deps);
  assert.deepEqual(applied.map(a => a.state), ["revoke", "unrevoke"]);
});
await test("stripe: errors are generic and keys never reach the log", async () => {
  const logs = [];
  const { deps } = whDeps();
  deps.fetch = async () => new Response("secret body sk_live_abc", { status: 500 });
  deps.log = (...a) => logs.push(a.join(" "));
  const r = await wh.handle(await stripeReq({ id: "evt_e", type: "customer.subscription.updated", created: S, data: { object: { customer: "cus_1", status: "active", current_period_end: S + 1 } } }), deps);
  assert.equal(r.status, 500); assert.deepEqual(await r.json(), { error: "server error, please retry" });
  assert.ok(!logs.join("").includes("sk_live"));
});
const rcReq = (event, auth = "Bearer rc-secret-rc-secret-rc") => new Request("https://x/functions/v1/billing-webhook/revenuecat", { method: "POST", headers: { authorization: auth }, body: JSON.stringify({ event }) });
await test("revenuecat: authorization is checked (constant time), sandbox ignored, events mapped", async () => {
  const ev = { id: "rc1", type: "INITIAL_PURCHASE", app_user_id: UID, store: "APP_STORE", expiration_at_ms: NOW + 86400e3, event_timestamp_ms: NOW, environment: "PRODUCTION", period_type: "TRIAL" };
  for (const auth of ["", "Bearer wrong", "Bearer rc-secret-rc-secret-r", "rc-secret-rc-secret-rcX"]) {
    const { deps, applied } = whDeps();
    assert.equal((await wh.handle(rcReq(ev, auth), deps)).status, 401); assert.equal(applied.length, 0);
  }
  let { deps, applied } = whDeps({ env: { REVENUECAT_WEBHOOK_AUTH: "" } });
  assert.equal((await wh.handle(rcReq(ev, "Bearer "), deps)).status, 401);
  ({ deps, applied } = whDeps());
  await wh.handle(rcReq(ev), deps);
  assert.equal(applied[0].state, "active"); assert.equal(applied[0].source, "apple"); assert.equal(applied[0].fresh, true); assert.ok(applied[0].trial_until);
  ({ deps, applied } = whDeps());
  await wh.handle(rcReq({ ...ev, id: "rc2", environment: "SANDBOX" }), deps);
  assert.equal(applied.length, 0);
  await wh.handle(rcReq({ ...ev, id: "rc3", app_user_id: "$RCAnonymousID:abc", aliases: [] }), deps);
  assert.equal(applied.length, 0);
  await wh.handle(rcReq({ id: "rc4", type: "CANCELLATION", app_user_id: UID, store: "APP_STORE", cancel_reason: "CUSTOMER_SUPPORT", event_timestamp_ms: NOW }), deps);
  await wh.handle(rcReq({ id: "rc5", type: "CANCELLATION", app_user_id: UID, store: "APP_STORE", cancel_reason: "UNSUBSCRIBE", event_timestamp_ms: NOW }), deps);
  await wh.handle(rcReq({ id: "rc6", type: "EXPIRATION", app_user_id: UID, store: "PLAY_STORE", event_timestamp_ms: NOW }), deps);
  assert.deepEqual(applied.map(a => a.state), ["revoke", "renew_off", "ended"]);
});

// ---- create-checkout / create-portal-session
const SITE = "https://studyboard.example";
function coDeps(extra = {}) {
  const stripeBodies = []; const rest = [];
  const env = (k) => ({ SUPABASE_URL: "https://x.supabase.co", SUPABASE_ANON_KEY: "anon", SUPABASE_SERVICE_ROLE_KEY: "svc", STRIPE_SECRET_KEY: "sk_test_x",
    STRIPE_PRICE_MONTHLY: "price_MONTH1", STRIPE_PRICE_YEARLY: "price_YEAR1", SITE_ORIGINS: SITE, ...extra.env }[k] ?? "");
  const f = async (url, init = {}) => {
    url = String(url);
    if (url.endsWith("/auth/v1/user")) return new Response(JSON.stringify({ id: UID, email: "a@b.co", email_confirmed_at: extra.unconfirmed ? null : "2026-01-01" }));
    if (url.includes("rpc/studyboard_plan_rate_hit")) return new Response(JSON.stringify(extra.limited ? false : true));
    if (url.includes("studyboard_config")) return new Response(JSON.stringify([{ key: "site_url", value: extra.siteUrl ?? "" }, { key: "prices", value: { trialDays: 7 } }]));
    if (url.includes("studyboard_entitlements")) return new Response(JSON.stringify(extra.ent ? [extra.ent] : []));
    if (url.includes("studyboard_billing_customers")) { rest.push([init.method || "GET", url]); return new Response(JSON.stringify(init.method === "POST" ? [] : extra.customer ? [{ stripe_customer_id: extra.customer }] : (rest.filter(r => r[0] === "POST").length ? [{ stripe_customer_id: "cus_new" }] : []))); }
    if (url === "https://api.stripe.com/v1/customers") { stripeBodies.push(["customers", init.body]); return new Response(JSON.stringify({ id: "cus_new" })); }
    if (url === "https://api.stripe.com/v1/checkout/sessions") { stripeBodies.push(["session", init.body]); return new Response(JSON.stringify({ url: "https://checkout.stripe.com/c/pay/abc" })); }
    if (url === "https://api.stripe.com/v1/billing_portal/sessions") { stripeBodies.push(["portal", init.body]); return new Response(JSON.stringify({ url: "https://billing.stripe.com/p/session/x" })); }
    return new Response("{}", { status: 500 });
  };
  return { deps: { env, fetch: f, now: () => NOW, log }, stripeBodies, rest };
}
const coReq = (body, headers = {}) => new Request("https://x/functions/v1/create-checkout", { method: "POST", headers: { authorization: "Bearer jwt", origin: SITE, ...headers }, body: JSON.stringify(body) });
const parse = (s) => Object.fromEntries(new URLSearchParams(s));

await test("checkout: monthly creates a customer + a server-priced session with uid, trial and allowlisted urls", async () => {
  const { deps, stripeBodies } = coDeps();
  const r = await co.handle(coReq({ plan: "monthly", price: "price_EVIL", amount: 1, success_url: SITE + "/success.html?x=1", cancel_url: "https://evil.example/cancel.html", client_reference_id: OTHER }), deps);
  assert.equal(r.status, 200);
  assert.deepEqual(await r.json(), { url: "https://checkout.stripe.com/c/pay/abc" });
  assert.equal(r.headers.get("access-control-allow-origin"), SITE);
  const cust = parse(stripeBodies.find(b => b[0] === "customers")[1]);
  assert.equal(cust.email, "a@b.co"); assert.equal(cust["metadata[uid]"], UID);
  const s = parse(stripeBodies.find(b => b[0] === "session")[1]);
  assert.equal(s.mode, "subscription"); assert.equal(s["line_items[0][price]"], "price_MONTH1"); assert.equal(s.customer, "cus_new");
  assert.equal(s.client_reference_id, UID); assert.equal(s["metadata[uid]"], UID); assert.equal(s["subscription_data[metadata][uid]"], UID);
  assert.equal(s["subscription_data[trial_period_days]"], "7");
  assert.equal(s.success_url, SITE + "/success.html?session_id={CHECKOUT_SESSION_ID}");
  assert.equal(s.cancel_url, SITE + "/cancel.html");   // the evil origin was replaced
  assert.ok(!JSON.stringify(s).includes("EVIL") && !JSON.stringify(s).includes(OTHER));
});
await test("checkout: yearly price, no second trial, reuses the stored customer", async () => {
  const { deps, stripeBodies } = coDeps({ customer: "cus_have", ent: { plan: "free", trial_until: "2025-01-01T00:00:00Z", source: "stripe", external_id: "cus_have" } });
  const r = await co.handle(coReq({ plan: "yearly" }), deps);
  assert.equal(r.status, 200);
  assert.ok(!stripeBodies.some(b => b[0] === "customers"));
  const s = parse(stripeBodies.find(b => b[0] === "session")[1]);
  assert.equal(s["line_items[0][price]"], "price_YEAR1"); assert.equal(s.customer, "cus_have"); assert.ok(!("subscription_data[trial_period_days]" in s));
});
await test("checkout: refuses bad plans, no sign-in, unconfirmed email, rate limit, double subscription, other origins' CORS", async () => {
  assert.equal((await co.handle(coReq({ plan: "lifetime" }), coDeps().deps)).status, 400);
  assert.equal((await co.handle(coReq({}), coDeps().deps)).status, 400);
  assert.equal((await co.handle(new Request("https://x/", { method: "POST", body: "{}" }), coDeps().deps)).status, 401);
  assert.equal((await co.handle(coReq({ plan: "monthly" }), coDeps({ unconfirmed: true }).deps)).status, 403);
  assert.equal((await co.handle(coReq({ plan: "monthly" }), coDeps({ limited: true }).deps)).status, 429);
  const sub = { plan: "pro", source: "stripe", will_renew: true, pro_until: new Date(NOW + 86400e3).toISOString() };
  assert.equal((await co.handle(coReq({ plan: "monthly" }), coDeps({ ent: sub }).deps)).status, 409);
  const bad = await co.handle(coReq({ plan: "monthly" }, { origin: "https://evil.example" }), coDeps().deps);
  assert.equal(bad.headers.get("access-control-allow-origin"), null);
  const noCfg = await co.handle(coReq({ plan: "monthly" }), coDeps({ env: { SITE_ORIGINS: "" } }).deps);
  assert.equal(noCfg.status, 500);
});
await test("checkout: safeReturn blocks open redirects", () => {
  const o = [SITE];
  for (const bad of ["https://evil.example/x", "http://studyboard.example/x", "javascript:alert(1)", "https://studyboard.example@evil.example/x", "//evil.example", "https://studyboard.example.evil.example/", "https://user:pw@studyboard.example/x", SITE + "/a b", 5, null, undefined, "x".repeat(600)])
    assert.equal(co.safeReturn(bad, o, "/success.html", false), SITE + "/success.html", String(bad));
  assert.equal(co.safeReturn(SITE + "/account/?evil=1#x", o, "/success.html", false), SITE + "/account/");
  assert.equal(co.safeReturn("http://localhost:8080/account/", [SITE, "http://localhost:8080"], "/success.html", true), "http://localhost:8080/account/");
  assert.equal(co.safeReturn("http://localhost:8080/account/", [SITE, "http://localhost:8080"], "/success.html", false), SITE + "/success.html");
  assert.deepEqual(co.allowedOrigins((k) => ({ SITE_ORIGINS: "http://a.example, https://b.example/path" }[k] ?? ""), "https://c.example"), ["https://b.example", "https://c.example"]);
});
await test("portal: only the caller's own customer; none gives 404", async () => {
  const req = (b = {}) => new Request("https://x/functions/v1/create-portal-session", { method: "POST", headers: { authorization: "Bearer jwt", origin: SITE }, body: JSON.stringify(b) });
  const { deps, stripeBodies } = coDeps({ customer: "cus_mine" });
  const r = await pt.handle(req({ customer: "cus_victim", return_url: "https://evil.example/" }), deps);
  assert.equal(r.status, 200);
  const p = parse(stripeBodies[0][1]);
  assert.equal(p.customer, "cus_mine"); assert.equal(p.return_url, SITE + "/account/");
  assert.equal((await pt.handle(req(), coDeps().deps)).status, 404);
  assert.equal((await pt.handle(new Request("https://x/", { method: "POST", body: "{}" }), coDeps().deps)).status, 401);
});

console.log(`\n${passed} checks passed`);
