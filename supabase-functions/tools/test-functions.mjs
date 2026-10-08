// Offline checks for the Studyboard Edge Functions (Pro, account deletion, calendar-feed, lms-feed, send-reminders; no network, no Supabase). Run from the repo root:
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
const wh = await load("supabase-functions/billing-webhook/index.ts");
const co = await load("supabase-functions/create-checkout/index.ts");
const pt = await load("supabase-functions/create-portal-session/index.ts");
const da = await load("supabase-functions/delete-account/index.ts");
const cf = await load("supabase-functions/calendar-feed/index.ts");
const lf = await load("supabase-functions/lms-feed/index.ts");
const sr = await load("supabase-functions/send-reminders/index.ts");

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
await test("stripe: an event from the other Stripe mode (sandbox event, live key) is acknowledged and ignored", async () => {
  const ev = { id: "evt_sandbox", livemode: false, type: "customer.subscription.updated", created: S, data: { object: { customer: "cus_1", status: "active", current_period_end: S + 86400, metadata: { uid: UID } } } };
  const live = whDeps({ env: { STRIPE_SECRET_KEY: "rk_live_x" } });
  const r = await wh.handle(await stripeReq(ev), live.deps);
  assert.equal(r.status, 200); assert.equal((await r.json()).ignored, "other stripe mode"); assert.equal(live.applied.length, 0);
  const test_ = whDeps({ env: { STRIPE_SECRET_KEY: "sk_test_x" } });
  await wh.handle(await stripeReq(ev), test_.deps); assert.equal(test_.applied.length, 1);
  const liveEv = whDeps({ env: { STRIPE_SECRET_KEY: "rk_live_x" } });
  await wh.handle(await stripeReq({ ...ev, id: "evt_live", livemode: true }), liveEv.deps); assert.equal(liveEv.applied.length, 1);
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
    if (url === "https://api.stripe.com/v1/checkout/sessions") { stripeBodies.push(["session", init.body, init.headers]); return new Response(JSON.stringify({ url: "https://checkout.stripe.com/c/pay/abc" })); }
    if (url === "https://api.stripe.com/v1/billing_portal/sessions") { stripeBodies.push(["portal", init.body]); return new Response(JSON.stringify({ url: "https://billing.stripe.com/p/session/x" })); }
    return new Response("{}", { status: 500 });
  };
  return { deps: { env, fetch: f, now: () => NOW, log }, stripeBodies, rest };
}
const coReq = (body, headers = {}) => new Request("https://x/functions/v1/create-checkout", { method: "POST", headers: { authorization: "Bearer jwt", origin: SITE, ...headers }, body: JSON.stringify(body) });
const parse = (s) => Object.fromEntries(new URLSearchParams(s));

await test("checkout: Managed Payments is off by default and, when switched on, sends the preview version and managed_payments[enabled]", async () => {
  const off = coDeps(); await co.handle(coReq({ plan: "monthly" }), off.deps);
  const a = off.stripeBodies.find(b => b[0] === "session");
  assert.ok(!("managed_payments[enabled]" in parse(a[1]))); assert.ok(!("Stripe-Version" in a[2]));
  const on = coDeps({ env: { STRIPE_MANAGED_PAYMENTS: "1" } }); const r = await co.handle(coReq({ plan: "yearly" }), on.deps);
  assert.equal(r.status, 200);
  const b = on.stripeBodies.find(x => x[0] === "session");
  assert.equal(parse(b[1])["managed_payments[enabled]"], "true"); assert.equal(b[2]["Stripe-Version"], "2026-02-25.preview");
  assert.ok(!("Stripe-Version" in (on.stripeBodies.find(x => x[0] === "customers")[2] || {})));
});

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

// ---- delete-account
function delDeps(o = {}) {
  const calls = [];
  const env = (k) => ({ SUPABASE_URL: "https://x.supabase.co", SUPABASE_ANON_KEY: "anon", SUPABASE_SERVICE_ROLE_KEY: "svc", STRIPE_SECRET_KEY: "sk_test_x", SITE_ORIGINS: SITE, ...(o.env || {}) }[k] ?? "");
  const files = o.files || { [UID]: [{ id: "f1", name: "a.pdf" }, { id: null, name: "sub" }], [UID + "/sub"]: [{ id: "f2", name: "b.png" }] };
  const f = async (url, init = {}) => {
    const u = String(url); calls.push([init.method || "GET", u, init.body ? String(init.body) : ""]);
    if (u.endsWith("/auth/v1/user")) return o.badAuth ? new Response("{}", { status: 401 }) : new Response(JSON.stringify({ id: UID, email: "me@example.com", last_sign_in_at: new Date(o.signedInAgo === undefined ? 60e3 : o.signedInAgo, 0).getTime() === 0 ? undefined : new Date(NOW - (o.signedInAgo ?? 60e3)).toISOString() }));
    if (u.includes("/auth/v1/token?grant_type=password")) return new Response("{}", { status: o.pwOk ? 200 : 400 });
    if (u.includes("rpc/studyboard_plan_rate_hit")) return new Response(JSON.stringify(o.limited ? false : true));
    if (u.includes("studyboard_entitlements")) return new Response(JSON.stringify(o.ent ? [o.ent] : []));
    if (u.includes("studyboard_billing_customers")) return new Response(JSON.stringify(o.customer ? [{ stripe_customer_id: o.customer }] : []));
    if (u.includes("rpc/studyboard_delete_user_data")) return new Response(JSON.stringify({ items: 3 }));
    if (u.startsWith("https://api.stripe.com/v1/subscriptions?")) return o.stripeDown ? new Response("{}", { status: 500 }) : new Response(JSON.stringify({ data: [{ id: "sub_1", status: "active" }, { id: "sub_2", status: "canceled" }] }));
    if (u.startsWith("https://api.stripe.com/v1/subscriptions/")) return new Response("{}");
    if (u.includes("/storage/v1/object/list/")) { const b = JSON.parse(init.body); return new Response(JSON.stringify(b.offset ? [] : (files[b.prefix] || []))); }
    if (u.includes("/storage/v1/object/studioso-files") && init.method === "DELETE") return new Response("[]");
    if (u.includes("/auth/v1/admin/users/")) return new Response("{}", { status: o.alreadyGone ? 404 : 200 });
    return new Response("{}", { status: 500 });
  };
  return { deps: { env, fetch: f, now: () => NOW, log }, calls };
}
const delReq = (b = { confirm: "DELETE" }, auth = "Bearer jwt") => new Request("https://x/functions/v1/delete-account", { method: "POST", headers: { ...(auth ? { authorization: auth } : {}), origin: SITE }, body: JSON.stringify(b) });
await test("delete-account: full run deletes files (recursively), data, Stripe subs and the auth user, in order, for the caller only", async () => {
  const { deps, calls } = delDeps({ customer: "cus_mine", ent: { plan: "pro", source: "stripe", external_id: "cus_mine", pro_until: new Date(NOW + 864e5).toISOString(), will_renew: true } });
  const r = await da.handle(delReq({ confirm: "delete", uid: OTHER }), deps);
  assert.equal(r.status, 200);
  const j = await r.json();
  assert.equal(j.ok, true); assert.equal(j.deleted.files_deleted, 2); assert.equal(j.deleted.stripe_subscriptions_cancelled, 1); assert.equal(j.deleted.account, true); assert.ok(j.retained.length >= 2);
  const urls = calls.map(c => c[0] + " " + c[1]);
  const idx = (re) => urls.findIndex(u => re.test(u));
  assert.ok(idx(/sub_1/) > -1 && !urls.some(u => /sub_2/.test(u)), "cancels the active subscription only");
  assert.ok(idx(/DELETE .*subscriptions\/sub_1/) < idx(/DELETE .*storage\/v1\/object\/studioso-files/), "Stripe before files");
  assert.ok(idx(/DELETE .*storage/) < idx(/delete_user_data/), "files before database rows");
  assert.ok(idx(/delete_user_data/) < idx(/DELETE .*auth\/v1\/admin\/users/), "database rows before the auth user");
  const rm = calls.find(c => c[0] === "DELETE" && c[1].includes("/storage/"));
  assert.deepEqual(JSON.parse(rm[2]).prefixes, [UID + "/a.pdf", UID + "/sub/b.png"]);
  assert.ok(!calls.some(c => c[1].includes(OTHER) || c[2].includes(OTHER)), "a uid in the body is ignored");
  assert.ok(calls.some(c => c[1].endsWith("/auth/v1/admin/users/" + UID)));
});
await test("delete-account: needs sign-in, the typed word, a recent sign-in or the right password", async () => {
  assert.equal((await da.handle(delReq(undefined, ""), delDeps().deps)).status, 401);
  assert.equal((await da.handle(delReq(undefined), delDeps({ badAuth: true }).deps)).status, 401);
  const noWord = delDeps(); assert.equal((await da.handle(delReq({ confirm: "nope" }), noWord.deps)).status, 400);
  assert.ok(!noWord.calls.some(c => c[0] === "DELETE"), "nothing deleted without confirmation");
  const stale = delDeps({ signedInAgo: 3600e3 });
  const r = await da.handle(delReq(), stale.deps); assert.equal(r.status, 403); assert.equal((await r.json()).error, "reauth_required");
  assert.ok(!stale.calls.some(c => c[0] === "DELETE"));
  const bad = delDeps({ signedInAgo: 3600e3, pwOk: false }); assert.equal((await da.handle(delReq({ confirm: "DELETE", password: "x" }), bad.deps)).status, 403);
  assert.ok(!bad.calls.some(c => c[0] === "DELETE"));
  assert.equal((await da.handle(delReq({ confirm: "DELETE", password: "right" }), delDeps({ signedInAgo: 3600e3, pwOk: true }).deps)).status, 200);
});
await test("delete-account: rate limit, Stripe failure stops everything, Apple subscription needs acknowledgement, idempotent", async () => {
  assert.equal((await da.handle(delReq(), delDeps({ limited: true }).deps)).status, 429);
  const sd = delDeps({ customer: "cus_mine", stripeDown: true });
  assert.equal((await da.handle(delReq(), sd.deps)).status, 500);
  assert.ok(!sd.calls.some(c => c[1].includes("delete_user_data") || c[1].includes("/storage/v1/object/studioso") && c[0] === "DELETE" || c[1].includes("admin/users")), "billing failure leaves the account intact");
  const apple = { plan: "pro", source: "revenuecat", will_renew: true, pro_until: new Date(NOW + 864e5).toISOString() };
  const a1 = delDeps({ ent: apple }); const r1 = await da.handle(delReq(), a1.deps);
  assert.equal(r1.status, 409); assert.match((await r1.json()).manage_url, /apps\.apple\.com\/account\/subscriptions/);
  assert.ok(!a1.calls.some(c => c[1].includes("admin/users")));
  assert.equal((await da.handle(delReq({ confirm: "DELETE", ack_store_subscription: true }), delDeps({ ent: apple }).deps)).status, 200);
  assert.equal((await da.handle(delReq(), delDeps({ alreadyGone: true }).deps)).status, 200, "a second run (auth user already gone) still succeeds");
  assert.equal((await da.handle(new Request("https://x/", { method: "GET" }), delDeps().deps)).status, 405);
  const evil = await da.handle(new Request("https://x/", { method: "POST", headers: { authorization: "Bearer j", origin: "https://evil.example" }, body: JSON.stringify({ confirm: "DELETE" }) }), delDeps().deps);
  assert.equal(evil.headers.get("access-control-allow-origin"), null);
});

// ---- calendar-feed (looked up by token hash, ICS values cleaned, generic errors)
const sha256hex = async (t) => Buffer.from(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(t))).toString("hex");
const CAL_TOKEN = "Tok_abcdefghijklmnopqrstuvwxyz0123456789";
function calEnv(o = {}) {
  const calls = [];
  globalThis.Deno = { env: { get: (k) => (o.noEnv ? {} : { SUPABASE_URL: "https://x.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "svc" })[k] } };
  globalThis.fetch = async (url, init = {}) => {
    const u = String(url); calls.push([init.method || "GET", u]);
    if (o.dbDown) return new Response('{"code":"42P01","message":"relation \\"calendar_feeds\\" does not exist"}', { status: 404 });
    if (u.includes("/rest/v1/calendar_feeds?select=")) {
      if (o.noHashCol && u.includes("token_hash=")) return new Response('{"code":"42703","message":"column calendar_feeds.token_hash does not exist"}', { status: 400 });
      const want = "token_hash=eq." + (await sha256hex(CAL_TOKEN));
      const hit = u.includes(want) || (o.noHashCol && u.includes("token=eq." + CAL_TOKEN));
      return new Response(JSON.stringify(hit ? [{ user_id: UID, options: { tz: "UTC", appUrl: "https://app.example/\r\nATTACH:x" }, last_fetched_at: null, cache_key: null, cache_text: null }] : []));
    }
    if (u.includes("rpc/studyboard_rate_hit")) return new Response("true");
    if (u.includes("items?select=updated_at") || u.includes("studyboard_deletions")) return new Response("[]");
    if (u.includes("items?select=kind,id,data")) return new Response(JSON.stringify([
      { kind: "task", id: "t1", data: { id: "t1\r\nATTACH:https://evil.example/x", title: "Essay\r\nBEGIN:VALARM", due: "2030-01-10", time: "09:00", type: "Exam" } },
      { kind: "event", id: "e1", data: { id: "e1\nX-EVIL:1", title: "Lab", date: "2030-01-11", start: "10:00", end: "11:00", repeat: { days: [1], every: "2\r\nRRULE:FREQ=SECONDLY", until: "2030-03-01" }, notes: "line one\r\nline two" } },
    ]));
    if (init.method === "PATCH") return new Response(null, { status: 204 });
    return new Response("{}", { status: 500 });
  };
  return calls;
}
const calReq = (t = CAL_TOKEN) => new Request("https://x/functions/v1/calendar-feed?token=" + encodeURIComponent(t));
const realFetch = globalThis.fetch;

await test("calendar-feed: looks the link up by SHA-256 of the token; the token never goes into a query", async () => {
  const calls = calEnv();
  const res = await cf.handle(calReq());
  assert.equal(res.status, 200);
  const text = await res.text();
  assert.match(text, /BEGIN:VCALENDAR/);
  assert.ok(calls.every(([, u]) => !u.includes(CAL_TOKEN)), "raw token must not appear in any database request");
  assert.ok(calls.some(([m, u]) => m === "PATCH" && u.includes("token_hash=eq.")), "updates also go by hash");
  assert.equal(await cf.tokenHash(CAL_TOKEN), await sha256hex(CAL_TOKEN));
  assert.equal((await cf.handle(calReq("Tok_zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz"))).status, 404);
  assert.equal((await cf.handle(calReq("short"))).status, 404);
  // a project that hasn't run the new SQL yet still works (older lookup by token)
  calEnv({ noHashCol: true });
  assert.equal((await cf.handle(calReq())).status, 200);
});
await test("calendar-feed: CR/LF in stored ids, titles, repeat rules and options can't inject ICS lines", async () => {
  calEnv();
  const text = await (await cf.handle(calReq())).text();
  const lines = text.split("\r\n");
  assert.ok(!lines.some(l => /^(ATTACH|X-EVIL|RRULE:FREQ=SECONDLY)/.test(l)), "no injected property lines");
  assert.equal(lines.filter(l => l === "BEGIN:VALARM").length, lines.filter(l => l === "END:VALARM").length);
  assert.ok(cf.icsSafe(text));
  assert.equal(cf.icsSafe("BEGIN:VCALENDAR\r\nUID:x\r\nnot a property\r\n"), false);
  assert.deepEqual(cf.cleanDeep({ id: "a\r\nB:1", notes: "x\r\ny\u0000", n: [1, "c\nd"] }), { id: "a B:1", notes: "x\ny", n: [1, "c d"] });
});
await test("calendar-feed: errors are generic (no setup details)", async () => {
  calEnv({ dbDown: true });
  let res = await cf.handle(calReq());
  assert.equal(res.status, 503);
  let t = await res.text();
  assert.doesNotMatch(t, /calendar_feeds|table|sql|SUPABASE|secret|missing/i);
  calEnv({ noEnv: true });
  res = await cf.handle(calReq()); t = await res.text();
  assert.equal(res.status, 503); assert.doesNotMatch(t, /SUPABASE|SERVICE_ROLE|secret|missing/i);
  globalThis.fetch = realFetch; delete globalThis.Deno;
});

// ---- lms-feed (sign-in checked, public addresses only on every hop, size cap, generic errors, limiter fails closed)
const FEED = "https://school.example.com/d2l/le/calendar/feed/user/feed.ics?token=abc";
const ICS = "BEGIN:VCALENDAR\r\nEND:VCALENDAR\r\n";
function lmsDeps(o = {}) {
  const fetched = [];
  const dns = Object.assign({ "school.example.com": ["93.184.216.34"], "cdn.example.net": ["2606:2800:220:1::1"] }, o.dns || {});
  return {
    fetched,
    deps: {
      user: async () => (o.noUser ? null : UID),
      limiter: async () => !o.limited,
      resolve: async (host, type) => { const all = dns[host]; if (!all) throw new Error("NXDOMAIN"); const r = all.filter(ip => (type === "AAAA") === ip.includes(":")); if (!r.length) throw new Error("NotFound"); return r; },
      fetch: async (url, init) => { fetched.push([String(url), init && init.redirect]); return o.respond ? o.respond(String(url), fetched.length) : new Response(ICS, { headers: { ETag: '"e1"' } }); },
    },
  };
}
const lmsReq = (body = { url: FEED, lms: "brightspace" }, auth = "Bearer eyJabc") => new Request("https://x/functions/v1/lms-feed", { method: "POST", headers: auth ? { authorization: auth } : {}, body: JSON.stringify(body) });

await test("lms-feed: sign-in is checked inside the function, and the limiter fails closed", async () => {
  let r = await lf.handle(lmsReq(), lmsDeps({ noUser: true }).deps);
  assert.equal(r.status, 401);
  const l = lmsDeps(); r = await lf.handle(lmsReq(), l.deps);
  assert.equal(r.status, 200); assert.equal((await r.json()).ics, ICS);
  assert.equal(l.fetched[0][1], "manual", "redirects are never followed automatically");
  assert.equal((await lf.handle(lmsReq(), lmsDeps({ limited: true }).deps)).status, 429);
  // the real helpers: no env, an error or a non-true answer all mean "no"
  globalThis.Deno = { env: { get: (k) => ({ SUPABASE_URL: "https://x.supabase.co", SUPABASE_ANON_KEY: "anon" })[k] } };
  assert.equal(await lf.rateOk(lmsReq(), async () => { throw new Error("down"); }), false);
  assert.equal(await lf.rateOk(lmsReq(), async () => new Response("null")), false);
  assert.equal(await lf.rateOk(lmsReq(), async () => new Response("{}", { status: 500 })), false);
  assert.equal(await lf.rateOk(lmsReq(), async () => new Response("true")), true);
  const seen = [];
  assert.equal(await lf.userFrom(lmsReq(), async (u, i) => { seen.push([String(u), i.headers.Authorization]); return new Response(JSON.stringify({ id: UID })); }), UID);
  assert.deepEqual(seen[0], ["https://x.supabase.co/auth/v1/user", "Bearer eyJabc"]);
  assert.equal(await lf.userFrom(lmsReq(), async () => new Response("{}", { status: 401 })), null);
  assert.equal(await lf.userFrom(lmsReq(undefined, ""), async () => new Response(JSON.stringify({ id: UID }))), null);
  delete globalThis.Deno;
  assert.equal(await lf.rateOk(lmsReq(), async () => new Response("true")), false, "no env: refused");
});
await test("lms-feed: private, loopback, link-local, CGNAT, ULA and mapped addresses are refused", async () => {
  for (const ip of ["10.1.2.3", "127.0.0.1", "169.254.169.254", "100.64.0.1", "172.16.5.4", "192.168.1.1", "0.0.0.0", "224.0.0.1", "198.18.0.1",
    "::1", "::", "fd00::1", "fe80::1", "::ffff:127.0.0.1", "::ffff:7f00:1", "64:ff9b::a00:1", "2002:a00:1::1", "2001:db8::1", "2001::1", "ff02::1", "not-an-ip"]) {
    assert.equal(lf.ipPublic(ip), false, ip + " must be refused");
  }
  for (const ip of ["93.184.216.34", "8.8.8.8", "2606:2800:220:1::1", "2a00:1450:4001:80b::200e"]) assert.equal(lf.ipPublic(ip), true, ip + " is public");
  for (const ips of [["10.0.0.5"], ["93.184.216.34", "127.0.0.1"], ["fd12::3"]]) {
    const l = lmsDeps({ dns: { "school.example.com": ips } });
    const r = await lf.handle(lmsReq(), l.deps);
    assert.equal((await r.json()).error, "bad-url", ips.join(","));
    assert.equal(l.fetched.length, 0, "nothing is fetched");
  }
  const nx = lmsDeps({ dns: { "school.example.com": undefined } });
  delete nx.deps.resolve; nx.deps.resolve = async () => { throw new Error("NXDOMAIN"); };
  assert.equal((await (await lf.handle(lmsReq(), nx.deps)).json()).error, "bad-url", "no DNS answer: refused");
  assert.equal(lf.feedOk("https://127.0.0.1/d2l/le/calendar/feed/x"), null);
  assert.equal(lf.feedOk("https://user:pw@school.example.com/d2l/le/calendar/feed/x"), null);
  assert.equal(lf.feedOk("https://school.example.com:8443/d2l/le/calendar/feed/x"), null);
});
await test("lms-feed: every redirect is checked again (DNS too), at most 3", async () => {
  const to = (loc) => new Response(null, { status: 302, headers: { Location: loc } });
  let l = lmsDeps({ dns: { "evil.example.com": ["127.0.0.1"] }, respond: (u, n) => n === 1 ? to("https://evil.example.com/x.ics") : new Response(ICS) });
  assert.equal((await (await lf.handle(lmsReq(), l.deps)).json()).error, "bad-url");
  assert.equal(l.fetched.length, 1, "the internal address was never fetched");
  l = lmsDeps({ respond: (u, n) => n === 1 ? to("http://cdn.example.net/x.ics") : new Response(ICS) });
  assert.equal((await (await lf.handle(lmsReq(), l.deps)).json()).error, "bad-url", "no downgrade to http");
  l = lmsDeps({ respond: (u, n) => n === 1 ? to("https://cdn.example.net/x.ics") : new Response(ICS) });
  const ok = await (await lf.handle(lmsReq(), l.deps)).json();
  assert.equal(ok.ok, true); assert.equal(l.fetched[1][0], "https://cdn.example.net/x.ics");
  l = lmsDeps({ respond: () => to("https://cdn.example.net/again.ics") });
  assert.equal((await (await lf.handle(lmsReq(), l.deps)).json()).error, "fetch");
  assert.equal(l.fetched.length, 4, "the link plus 3 redirects, then it stops");
});
await test("lms-feed: the body is capped while it streams, and errors carry no upstream detail", async () => {
  const big = () => new Response(new ReadableStream({ start(c) { for (let i = 0; i < 9; i++) c.enqueue(new Uint8Array(1_000_000)); c.close(); } }));
  assert.equal((await (await lf.handle(lmsReq(), lmsDeps({ respond: big }).deps)).json()).error, "too-large");
  assert.equal((await (await lf.handle(lmsReq(), lmsDeps({ respond: () => new Response("x", { headers: { "content-length": "9000000" } }) }).deps)).json()).error, "too-large");
  const boom = await (await lf.handle(lmsReq(), lmsDeps({ respond: () => { throw new Error("connect ECONNREFUSED 10.9.8.7:443"); } }).deps)).json();
  assert.deepEqual(boom, { error: "fetch" });
  assert.deepEqual(await (await lf.handle(lmsReq(), lmsDeps({ respond: () => new Response("oops", { status: 502 }) }).deps)).json(), { error: "http" });
  assert.deepEqual(await (await lf.handle(lmsReq(), lmsDeps({ respond: () => new Response("no", { status: 401 }) }).deps)).json(), { error: "refused", status: 403 });
  assert.equal((await (await lf.handle(lmsReq(), lmsDeps({ respond: () => new Response("<html>") }).deps)).json()).error, "not-calendar");
});

// ---- send-reminders (schedule secret, push endpoint allowlist)
function remStore(o = {}) {
  const log = { dropped: [], released: [] };
  const rows = [{ user_id: UID, id: "r:1", title: "T", body: "B", url: "", task_id: "t1", tok: "tok1", tries: 0 }];
  const subs = o.subs || [
    { id: "s1", user_id: UID, endpoint: "https://fcm.googleapis.com/fcm/send/abc", p256dh: "k", auth: "a" },
    { id: "s2", user_id: UID, endpoint: "https://169.254.169.254/latest/meta-data", p256dh: "k", auth: "a" },
    { id: "s3", user_id: UID, endpoint: "https://web.push.apple.com/xyz", p256dh: "k", auth: "a" },
  ];
  return {
    log,
    store: {
      claimDue: async () => rows, release: async (r) => log.released.push(r.id), subsFor: async () => subs, dropSub: async (id) => log.dropped.push(id),
      cleanup: async () => {}, byToken: async (id, tok) => (id === "r:1" && tok === "tok1" ? rows[0] : null),
      addSnooze: async () => { log.snoozed = true; }, markDone: async () => true, userFrom: async () => null,
      cronOk: async (s) => s === "c".repeat(64),
    },
  };
}
function fakePush() { const sent = []; return { sent, setVapidDetails() {}, sendNotification: async (sub) => { sent.push(sub.endpoint); return {}; } }; }
const remReq = (body, headers = {}) => new Request("https://x/functions/v1/send-reminders", { method: "POST", headers, body: JSON.stringify(body) });
const remOpts = (o = {}) => ({ now: NOW, api: "https://x.supabase.co/functions/v1/send-reminders", k: "anon", vapidOk: true, ...o });

await test("send-reminders: sending needs the schedule secret", async () => {
  const p = fakePush();
  assert.equal((await sr.handle(remReq({ action: "send" }), remStore().store, p, remOpts())).status, 401);
  assert.equal((await sr.handle(remReq({}), remStore().store, p, remOpts())).status, 401, "the default action is send, and it needs the secret too");
  assert.equal((await sr.handle(remReq({ action: "send" }, { "x-studyboard-cron": "wrong".repeat(10) }), remStore().store, p, remOpts())).status, 401);
  assert.equal((await sr.handle(remReq({ action: "send" }, { "x-studyboard-cron": "c".repeat(64) }), remStore().store, p, remOpts({ cronSecret: "d".repeat(64) }))).status, 401, "the env secret wins when set");
  assert.equal(p.sent.length, 0);
  assert.equal((await sr.handle(remReq({ action: "send" }, { "x-studyboard-cron": "c".repeat(64) }), remStore().store, p, remOpts())).status, 200);
  assert.equal((await sr.handle(remReq({ action: "send" }, { "x-studyboard-cron": "d".repeat(64) }), remStore().store, fakePush(), remOpts({ cronSecret: "d".repeat(64) }))).status, 200);
  assert.equal((await sr.handle(remReq({ action: "nope" }), remStore().store, p, remOpts())).status, 400);
  // Snooze from a notification still works with only the reminder's own code
  const s = remStore();
  assert.equal((await sr.handle(remReq({ action: "snooze", id: "r:1", tok: "tok1" }), s.store, p, remOpts())).status, 200);
  assert.equal(s.log.snoozed, true);
  assert.equal((await sr.handle(remReq({ action: "snooze", id: "r:1", tok: "bad" }), remStore().store, p, remOpts())).status, 404);
  // the real store asks the database (service role) and treats errors as "no"
  const db = (ans) => ({ rpc: async (fn, args) => { db.last = [fn, args]; return ans; } });
  const d1 = db({ data: true, error: null });
  assert.equal(await sr.supabaseStore(d1).cronOk("c".repeat(64)), true);
  assert.equal(await sr.supabaseStore(db({ data: null, error: { message: "x" } })).cronOk("c".repeat(64)), false);
  assert.equal(await sr.supabaseStore(d1).cronOk("short"), false);
});
await test("send-reminders: pushes only go to the real push services", async () => {
  for (const e of ["https://fcm.googleapis.com/fcm/send/x", "https://updates.push.services.mozilla.com/wpush/v2/x", "https://foo.push.services.mozilla.com/x",
    "https://wns2-by3p.notify.windows.com/w/?token=x", "https://web.push.apple.com/abc", "https://api.push.apple.com/3/device/x"]) assert.equal(sr.pushHostOk(e), true, e);
  for (const e of ["http://fcm.googleapis.com/x", "https://fcm.googleapis.com:8443/x", "https://fcm.googleapis.com.evil.com/x", "https://evilfcm.googleapis.com/x",
    "https://169.254.169.254/x", "https://localhost/x", "https://user@fcm.googleapis.com/x", "https://push.apple.com.evil/x", "https://notify.windows.com/x", ""]) assert.equal(sr.pushHostOk(e), false, e);
  const s = remStore(), p = fakePush();
  const out = await (await sr.handle(remReq({ action: "send" }, { "x-studyboard-cron": "c".repeat(64) }), s.store, p, remOpts())).json();
  assert.deepEqual(p.sent.sort(), ["https://fcm.googleapis.com/fcm/send/abc", "https://web.push.apple.com/xyz"]);
  assert.deepEqual(s.log.dropped, ["s2"], "a non-push address is removed, never contacted");
  assert.equal(out.sent, 1);
  // the real store filters too
  const db = { from: () => ({ select: () => ({ in: async () => ({ data: remStore().store && [
    { id: "a", user_id: UID, endpoint: "https://fcm.googleapis.com/fcm/send/1" }, { id: "b", user_id: UID, endpoint: "https://10.0.0.1/x" }], error: null }) }) }) };
  assert.deepEqual((await sr.supabaseStore(db).subsFor([UID])).map(x => x.id), ["a"]);
});

// ---- send-reminders: phone apps (FCM HTTP v1 for Android, APNs for iPhone)
import { generateKeyPairSync, createPublicKey, verify as nodeVerify } from "node:crypto";
const rsa = generateKeyPairSync("rsa", { modulusLength: 2048 });
const ec = generateKeyPairSync("ec", { namedCurve: "P-256" });
const SA = { type: "service_account", project_id: "sb-proj", client_email: "push@sb-proj.iam.gserviceaccount.com", private_key: rsa.privateKey.export({ type: "pkcs8", format: "pem" }) };
const P8 = ec.privateKey.export({ type: "pkcs8", format: "pem" });
const jwtParts = (j) => { const [h, c, sg] = j.split("."); const dec = (x) => JSON.parse(Buffer.from(x, "base64url").toString()); return { h: dec(h), c: dec(c), input: h + "." + c, sig: Buffer.from(sg, "base64url") }; };
const FCM_TOKEN = "fcm:" + "dQw4w9WgXcQ:APA91b" + "x".repeat(140);
const APNS_TOKEN = "apns:" + "ab".repeat(32);
function nativeDeps(o = {}) {
  const calls = [];
  const envs = Object.assign({ FCM_SERVICE_ACCOUNT: JSON.stringify(SA), APNS_KEY_P8: P8, APNS_KEY_ID: "KEY1234567", APNS_TEAM_ID: "TEAM123456" }, o.env || {});
  const f = async (url, init = {}) => {
    const u = String(url); calls.push({ u, init });
    if (u === "https://oauth2.googleapis.com/token") return new Response(JSON.stringify({ access_token: "ya29.tok", expires_in: 3600 }));
    if (u.startsWith("https://fcm.googleapis.com/v1/")) return o.fcm ? o.fcm(init) : new Response(JSON.stringify({ name: "projects/sb-proj/messages/1" }));
    if (u.includes("push.apple.com/3/device/")) return o.apns ? o.apns(u, init) : new Response("", { status: 200 });
    return new Response("{}", { status: 500 });
  };
  return { calls, deps: { env: (k) => envs[k] ?? "", fetch: f, now: () => NOW, log } };
}
const MSG = { title: "Due soon", body: "Essay at 5 pm", rid: "r:1", taskId: "t1", url: "https://app.example/?task=t1", tok: "tok1", api: "https://x.supabase.co/functions/v1/send-reminders", k: "anon" };

await test("send-reminders: FCM mints an OAuth token (RS256 JWT grant), caches it, and sends the v1 message shape", async () => {
  const n = nativeDeps(); const ns = sr.nativeSender(n.deps);
  assert.equal(await ns.fcm({ id: "f1", user_id: UID, endpoint: FCM_TOKEN, p256dh: "", auth: "", kind: "fcm" }, MSG), "ok");
  assert.equal(await ns.fcm({ id: "f1", user_id: UID, endpoint: FCM_TOKEN, p256dh: "", auth: "", kind: "fcm" }, MSG), "ok");
  const mint = n.calls.filter(c => c.u === "https://oauth2.googleapis.com/token");
  assert.equal(mint.length, 1, "the access token is cached");
  const form = new URLSearchParams(mint[0].init.body);
  assert.equal(form.get("grant_type"), "urn:ietf:params:oauth:grant-type:jwt-bearer");
  const j = jwtParts(form.get("assertion"));
  assert.deepEqual(j.h, { alg: "RS256", typ: "JWT" });
  assert.equal(j.c.iss, SA.client_email); assert.equal(j.c.aud, "https://oauth2.googleapis.com/token");
  assert.equal(j.c.scope, "https://www.googleapis.com/auth/firebase.messaging"); assert.equal(j.c.exp - j.c.iat, 3600); assert.equal(j.c.iat, S);
  assert.equal(nodeVerify("RSA-SHA256", Buffer.from(j.input), rsa.publicKey, j.sig), true, "signed with the service account key");
  const send = n.calls.find(c => c.u.startsWith("https://fcm.googleapis.com/"));
  assert.equal(send.u, "https://fcm.googleapis.com/v1/projects/sb-proj/messages:send");
  assert.equal(send.init.headers.Authorization, "Bearer ya29.tok");
  const body = JSON.parse(send.init.body);
  assert.equal(body.message.token, FCM_TOKEN.slice(4));
  assert.deepEqual(body.message.notification, { title: "Due soon", body: "Essay at 5 pm" });
  assert.deepEqual(body.message.data, { taskId: "t1", rid: "r:1", url: MSG.url, tok: "tok1", api: MSG.api, k: "anon" });
  assert.ok(Object.values(body.message.data).every(v => typeof v === "string"), "FCM data values are all strings");
  assert.deepEqual(body.message.android, { priority: "HIGH", ttl: "21600s" });
  // FIREBASE_PROJECT_ID wins over the JSON's project
  const n2 = nativeDeps({ env: { FIREBASE_PROJECT_ID: "other-proj" } });
  await sr.nativeSender(n2.deps).fcm({ id: "f1", user_id: UID, endpoint: FCM_TOKEN, kind: "fcm" }, MSG);
  assert.ok(n2.calls.some(c => c.u === "https://fcm.googleapis.com/v1/projects/other-proj/messages:send"));
});
await test("send-reminders: dead FCM tokens (404 UNREGISTERED, 400 INVALID_ARGUMENT token) are removed; other errors retry", async () => {
  const sub = { id: "f1", user_id: UID, endpoint: FCM_TOKEN, kind: "fcm" };
  const r404 = () => new Response(JSON.stringify({ error: { code: 404, status: "NOT_FOUND", details: [{ errorCode: "UNREGISTERED" }] } }), { status: 404 });
  const r400 = () => new Response(JSON.stringify({ error: { code: 400, status: "INVALID_ARGUMENT", message: "The registration token is not a valid FCM registration token" } }), { status: 400 });
  const r500 = () => new Response("{}", { status: 503 });
  assert.equal(await sr.nativeSender(nativeDeps({ fcm: r404 }).deps).fcm(sub, MSG), "gone");
  assert.equal(await sr.nativeSender(nativeDeps({ fcm: r400 }).deps).fcm(sub, MSG), "gone");
  assert.equal(await sr.nativeSender(nativeDeps({ fcm: r500 }).deps).fcm(sub, MSG), "fail");
  // through sendDue: the dead token's row is dropped
  const st = remStore({ subs: [sub] });
  const out = await sr.sendDue(st.store, fakePush(), NOW, MSG.api, "anon", sr.nativeSender(nativeDeps({ fcm: r404 }).deps));
  assert.deepEqual(st.log.dropped, ["f1"]); assert.equal(out.removed, 1);
});
await test("send-reminders: APNs uses an ES256 JWT (kid, iss, iat; cached), the right headers and body, and drops dead tokens", async () => {
  const n = nativeDeps(); const ns = sr.nativeSender(n.deps);
  const sub = { id: "a1", user_id: UID, endpoint: APNS_TOKEN, p256dh: "", auth: "", kind: "apns", apns_env: null };
  assert.equal(await ns.apns(sub, MSG), "ok");
  assert.equal(await ns.apns(sub, MSG), "ok");
  const c = n.calls.filter(x => x.u.includes("/3/device/"));
  assert.equal(c[0].u, "https://api.push.apple.com/3/device/" + "ab".repeat(32));
  const h = c[0].init.headers;
  assert.equal(h["apns-topic"], "com.studioso.app"); assert.equal(h["apns-push-type"], "alert"); assert.equal(h["apns-priority"], "10");
  assert.equal(h["apns-expiration"], String(S + 6 * 3600));
  const tok = h.authorization.replace(/^bearer /, "");
  assert.equal(c[1].init.headers.authorization, h.authorization, "the provider token is cached");
  const j = jwtParts(tok);
  assert.deepEqual(j.h, { alg: "ES256", kid: "KEY1234567" }); assert.deepEqual(j.c, { iss: "TEAM123456", iat: S });
  assert.equal(j.sig.length, 64, "JOSE r||s signature");
  assert.equal(nodeVerify("SHA256", Buffer.from(j.input), { key: createPublicKey(ec.privateKey), dsaEncoding: "ieee-p1363" }, j.sig), true);
  assert.deepEqual(JSON.parse(c[0].init.body), { aps: { alert: { title: "Due soon", body: "Essay at 5 pm" }, sound: "default" }, taskId: "t1", rid: "r:1", url: MSG.url, tok: "tok1", api: MSG.api, k: "anon" });
  // APNS_TOPIC secret, sandbox rows
  const n2 = nativeDeps({ env: { APNS_TOPIC: "com.example.other" } });
  await sr.nativeSender(n2.deps).apns({ ...sub, apns_env: "sandbox" }, MSG);
  assert.ok(n2.calls[0].u.startsWith("https://api.sandbox.push.apple.com/3/device/")); assert.equal(n2.calls[0].init.headers["apns-topic"], "com.example.other");
  // unknown environment: production first, then sandbox on BadDeviceToken
  const bad = () => new Response(JSON.stringify({ reason: "BadDeviceToken" }), { status: 400 });
  const n3 = nativeDeps({ apns: (u) => u.includes("sandbox") ? new Response("", { status: 200 }) : bad() });
  assert.equal(await sr.nativeSender(n3.deps).apns(sub, MSG), "ok");
  assert.deepEqual(n3.calls.map(x => new URL(x.u).host), ["api.push.apple.com", "api.sandbox.push.apple.com"]);
  assert.equal(await sr.nativeSender(nativeDeps({ apns: bad }).deps).apns(sub, MSG), "gone", "bad on both servers: removed");
  assert.equal(await sr.nativeSender(nativeDeps({ apns: bad }).deps).apns({ ...sub, apns_env: "production" }, MSG), "gone");
  assert.equal(await sr.nativeSender(nativeDeps({ apns: () => new Response(JSON.stringify({ reason: "Unregistered" }), { status: 410 }) }).deps).apns(sub, MSG), "gone");
  assert.equal(await sr.nativeSender(nativeDeps({ apns: () => new Response(JSON.stringify({ reason: "TooManyRequests" }), { status: 429 }) }).deps).apns(sub, MSG), "fail");
});
await test("send-reminders: phone kinds are skipped (rows kept) when their secrets aren't set; bad tokens never sent", async () => {
  const subs = [{ id: "f1", user_id: UID, endpoint: FCM_TOKEN, kind: "fcm" }, { id: "a1", user_id: UID, endpoint: APNS_TOKEN, kind: "apns" },
    { id: "w1", user_id: UID, endpoint: "https://fcm.googleapis.com/fcm/send/abc", p256dh: "k", auth: "a", kind: "webpush" },
    { id: "x1", user_id: UID, endpoint: "fcm:short", kind: "fcm" }, { id: "x2", user_id: UID, endpoint: "https://web.push.apple.com/x", kind: "apns" }];
  const n = nativeDeps({ env: { FCM_SERVICE_ACCOUNT: "", APNS_KEY_P8: "" } }); const ns = sr.nativeSender(n.deps);
  assert.equal(ns.configured(), false);
  assert.equal(await ns.fcm(subs[0], MSG), "skip"); assert.equal(await ns.apns(subs[1], MSG), "skip");
  const st = remStore({ subs }), p = fakePush();
  const out = await sr.sendDue(st.store, p, NOW, MSG.api, "anon", ns);
  assert.equal(n.calls.length, 0, "nothing contacted for unconfigured kinds");
  assert.deepEqual(p.sent, ["https://fcm.googleapis.com/fcm/send/abc"]);
  assert.deepEqual(st.log.dropped.sort(), ["x1", "x2"], "malformed rows are removed; skipped ones stay");
  assert.equal(out.sent, 1);
  for (const [sub, ok] of [[subs[0], true], [subs[1], true], [subs[3], false], [subs[4], false], [{ endpoint: "apns:" + "zz".repeat(32), kind: "apns" }, false]]) assert.equal(sr.subOk(sub), ok, sub.endpoint);
  // no VAPID keys but FCM set up: sending still works for the phone app, browsers are skipped
  const st2 = remStore({ subs: [subs[0], subs[2]] }), p2 = fakePush(), n2 = nativeDeps();
  const r2 = await sr.handle(remReq({ action: "send" }, { "x-studyboard-cron": "c".repeat(64) }), st2.store, p2, remOpts({ vapidOk: false, native: sr.nativeSender(n2.deps) }));
  assert.equal(r2.status, 200); assert.equal(p2.sent.length, 0); assert.ok(n2.calls.some(c => c.u.startsWith("https://fcm.googleapis.com/v1/")));
  assert.equal((await sr.handle(remReq({ action: "send" }, { "x-studyboard-cron": "c".repeat(64) }), st2.store, p2, remOpts({ vapidOk: false, native: ns }))).status, 500, "nothing set up at all: the setup message");
  // the real store reads kind/apns_env, and falls back on a project without those columns
  let asked = [];
  const db = { from: () => ({ select: (cols) => ({ in: async () => { asked.push(cols); return cols.includes("kind") ? { data: null, error: { code: "42703", message: "column push_subscriptions.kind does not exist" } } : { data: [{ id: "w", user_id: UID, endpoint: "https://fcm.googleapis.com/fcm/send/1" }], error: null }; } }) }) };
  assert.deepEqual((await sr.supabaseStore(db).subsFor([UID])).map(x => x.id), ["w"]); assert.equal(asked.length, 2);
});

console.log(`\n${passed} checks passed`);
