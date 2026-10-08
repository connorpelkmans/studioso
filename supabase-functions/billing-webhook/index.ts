// Studyboard 1.12: billing-webhook (Supabase Edge Function)
// Turns payments into Pro. Stripe (the website and desktop app) and RevenueCat (the App Store and Google Play)
// call this function when someone buys, renews, cancels, is refunded or runs out of Pro. Every verified event is handed to the
// database function studyboard_apply_billing, which (in one transaction) remembers the event id so a replay does nothing,
// ignores events older than the newest one already applied, never lets one payment source cancel another, never touches a
// manual grant, and only ever acts on a real account.
//
// Two addresses (both go to this one function):
//   https://<your-project>.supabase.co/functions/v1/billing-webhook/stripe       paste this in Stripe > Webhooks
//   https://<your-project>.supabase.co/functions/v1/billing-webhook/revenuecat   paste this in RevenueCat > Integrations > Webhooks
//
// Stripe events to send: checkout.session.completed, customer.subscription.created, customer.subscription.updated,
//   customer.subscription.deleted, invoice.paid, charge.refunded, charge.dispute.created, charge.dispute.closed
//
// Secrets it needs (Supabase > Edge Functions > Secrets):
//   STRIPE_WEBHOOK_SECRET     starts with whsec_ (Stripe shows it after you add the webhook)
//   STRIPE_SECRET_KEY         a restricted key with Read on Subscriptions and Charges: the exact renewal date and the owner of a disputed charge are looked up with it
//   REVENUECAT_WEBHOOK_AUTH   any long random text; type the same text in RevenueCat's "Authorization header value"
//   RC_ALLOW_SANDBOX          optional: set to 1 only while testing, so RevenueCat sandbox purchases count (never in production)
// Supabase adds SUPABASE_URL and the service key by itself.
// Deploy with "Verify JWT" turned OFF: Stripe and RevenueCat don't sign in to Supabase. Each request is checked
// with its own secret instead, and anything that doesn't pass is turned away.

type Env = (k: string) => string;
type Deps = { env: Env; fetch: typeof fetch; now: () => number; log: (...a: unknown[]) => void };
type Apply = {
  event_id: string; family: "stripe" | "revenuecat"; source: string; type: string; event_at: string;
  state: "active" | "extend" | "ended" | "renew_off" | "revoke" | "unrevoke" | "lifetime";
  uid_hint?: string; trust_hint?: boolean; customer?: string; pro_until?: string | null; trial_until?: string | null;
  will_renew?: boolean; external_id?: string; fresh?: boolean;
};

const GRACE_MS = 3 * 86400_000;   // a few extra days after a renewal date, so a late webhook never switches Pro off by mistake
const TOLERANCE_S = 300;          // Stripe signatures older than 5 minutes are refused (stops replays)
const MAX_BODY = 1_000_000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { "Content-Type": "application/json" } });
const iso = (ms: number | null | undefined) => (ms ? new Date(ms).toISOString() : null);

// ---------- The database (PostgREST with the service key; RLS doesn't apply to it) ----------
function serviceKey(d: Deps): string {
  let key = d.env("SUPABASE_SERVICE_ROLE_KEY");
  if (!key) { try { const k = JSON.parse(d.env("SUPABASE_SECRET_KEYS") || "{}"); key = String(k.default || Object.values(k)[0] || ""); } catch (_e) { /* newer projects only */ } }
  return key;
}
async function apply(d: Deps, row: Apply): Promise<string> {
  const key = serviceKey(d);
  const r = await d.fetch(d.env("SUPABASE_URL").replace(/\/+$/, "") + "/rest/v1/rpc/studyboard_apply_billing", {
    method: "POST", headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" }, body: JSON.stringify({ p: row }),
  });
  if (!r.ok) throw new Error(`apply failed: ${r.status}`);   // the body is not logged: it could echo what was sent
  return String(await r.json());
}

// ---------- Constant-time comparison ----------
const hex = (buf: ArrayBuffer) => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
function safeEqual(a: string, b: string) {   // for two hex strings (the length of an HMAC is not a secret)
  if (a.length !== b.length) return false;
  let x = 0; for (let i = 0; i < a.length; i++) x |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return x === 0;
}
// For secrets of any length: compare hashes, so neither the length nor the content leaks through timing.
export async function secretEqual(a: string, b: string): Promise<boolean> {
  const h = async (s: string) => hex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)));
  return safeEqual(await h(a), await h(b));
}

// ---------- Stripe ----------
// Stripe signs "<timestamp>.<raw body>" with HMAC-SHA256 using the webhook secret. The header looks like "t=...,v1=...".
export async function verifyStripe(raw: string, header: string, secret: string, nowS: number): Promise<boolean> {
  if (!header || !secret) return false;
  const parts = header.split(",").map(p => { const i = p.indexOf("="); return i < 0 ? [p.trim(), ""] : [p.slice(0, i).trim(), p.slice(i + 1).trim()]; });
  const t = parts.find(p => p[0] === "t")?.[1] || "";
  const sigs = parts.filter(p => p[0] === "v1").map(p => p[1]);
  if (!/^\d{9,12}$/.test(t) || !sigs.length || Math.abs(nowS - Number(t)) > TOLERANCE_S) return false;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const want = hex(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${t}.${raw}`)));
  let ok = false;
  for (const s of sigs) ok = safeEqual(s, want) || ok;   // no early exit
  return ok;
}

// Newer Stripe API versions keep the period end on the subscription item instead of the subscription.
const periodEnd = (sub: any): number => Number(sub?.current_period_end || sub?.items?.data?.[0]?.current_period_end || 0);
const idOf = (v: any): string => (typeof v === "string" ? v : String(v?.id || ""));
const validUid = (v: unknown): string | undefined => (typeof v === "string" && UUID.test(v) ? v.toLowerCase() : undefined);

async function stripeGet(d: Deps, path: string): Promise<any | null> {
  const key = d.env("STRIPE_SECRET_KEY");
  if (!key) return null;
  const r = await d.fetch(`https://api.stripe.com/v1/${path}`, { headers: { Authorization: `Bearer ${key}` } });
  return r.ok ? await r.json() : null;
}

// What a subscription object means for Pro. Returns null when it says nothing (a half-finished sign-up).
function subscriptionState(sub: any, d: Deps): Pick<Apply, "state" | "pro_until" | "trial_until" | "will_renew"> | null {
  const status = String(sub?.status || "");
  if (status === "trialing" || status === "active" || status === "past_due") {
    // past_due keeps Pro until the paid period (plus a few days) runs out, while Stripe retries the card
    const end = periodEnd(sub) * 1000;
    return {
      state: "active", pro_until: iso(end ? end + GRACE_MS : d.now() + 35 * 86400_000),
      trial_until: status === "trialing" && sub?.trial_end ? iso(Number(sub.trial_end) * 1000) : null,
      will_renew: !sub?.cancel_at_period_end && !sub?.cancel_at,
    };
  }
  if (status === "canceled" || status === "unpaid" || status === "incomplete_expired" || status === "paused") return { state: "ended" };
  return null;   // "incomplete": the first payment hasn't gone through, so nothing is granted
}

async function handleStripe(req: Request, d: Deps, raw: string): Promise<Response> {
  const ok = await verifyStripe(raw, req.headers.get("stripe-signature") || "", d.env("STRIPE_WEBHOOK_SECRET"), Math.floor(d.now() / 1000));
  if (!ok) return json({ error: "bad request" }, 400);
  let ev: any;
  try { ev = JSON.parse(raw); } catch (_e) { return json({ error: "bad request" }, 400); }
  const o = ev?.data?.object || {};
  if (typeof ev?.id !== "string" || typeof ev?.type !== "string") return json({ error: "bad request" }, 400);
  // Test (sandbox) events must never change a live project, and live events never a test one: an event whose mode differs from the
  // STRIPE_SECRET_KEY's is acknowledged (so Stripe stops retrying it) and ignored.
  const sk = d.env("STRIPE_SECRET_KEY"), keyLive = /^[sr]k_live_/.test(sk) ? true : /^[sr]k_test_/.test(sk) ? false : null;
  if (keyLive !== null && typeof ev.livemode === "boolean" && ev.livemode !== keyLive) { d.log("billing-webhook: ignored an event from the other Stripe mode", ev.id, ev.type); return json({ ignored: "other stripe mode" }); }
  const at = iso((Number(ev.created) || Math.floor(d.now() / 1000)) * 1000)!;
  const base = { event_id: ev.id, family: "stripe" as const, source: "stripe", type: ev.type, event_at: at };
  const done = async (row: Apply) => json({ ok: await apply(d, row) });

  switch (ev.type) {
    case "checkout.session.completed": {
      // Only our own create-checkout sets client_reference_id and metadata.uid to the same account id. Anything else is ignored.
      const uid = validUid(o.client_reference_id);
      if (o.mode !== "subscription" || !uid || String(o.metadata?.uid || "").toLowerCase() !== uid) return json({ ignored: "not one of our checkouts" });
      if (o.payment_status !== "paid" && o.payment_status !== "no_payment_required") return json({ ignored: "not paid" });
      const customer = idOf(o.customer);
      if (!customer) return json({ ignored: "no customer" });
      const sub = o.subscription ? await stripeGet(d, `subscriptions/${encodeURIComponent(idOf(o.subscription))}`) : null;
      if (sub && idOf(sub.customer) !== customer) return json({ ignored: "customer mismatch" });
      const st = sub ? subscriptionState(sub, d) : { state: "active" as const, pro_until: iso(d.now() + 35 * 86400_000), trial_until: null, will_renew: true };
      if (!st || st.state !== "active") return json({ ignored: "subscription not active" });
      return done({ ...base, ...st, uid_hint: uid, trust_hint: true, customer, external_id: customer, fresh: true });
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      // The customer decides who this is. metadata.uid on the subscription was set by our create-checkout, and is used only to link a new customer.
      const customer = idOf(o.customer);
      if (!customer) return json({ ignored: "no customer" });
      const st = ev.type === "customer.subscription.deleted" ? { state: "ended" as const } : subscriptionState(o, d);
      if (!st) return json({ ignored: "not active yet" });
      const uid = validUid(o.metadata?.uid);
      return done({ ...base, ...st, customer, external_id: customer, ...(uid ? { uid_hint: uid, trust_hint: true } : {}) });
    }
    case "invoice.paid": {
      const customer = idOf(o.customer);
      const subId = idOf(o.subscription || o.parent?.subscription_details?.subscription);
      if (!customer || !subId) return json({ ignored: "not a subscription invoice" });
      const end = Math.max(0, ...((o.lines?.data || []) as any[]).map(l => Number(l?.period?.end || 0))) * 1000;
      if (!end) return json({ ignored: "no period on invoice" });
      return done({ ...base, state: "extend", customer, external_id: customer, pro_until: iso(end + GRACE_MS) });
    }
    case "charge.refunded": {
      // Only a full refund takes Pro away (a small goodwill refund doesn't).
      const customer = idOf(o.customer);
      if (!customer || o.refunded !== true) return json({ ignored: "partial refund or no customer" });
      return done({ ...base, state: "revoke", customer });
    }
    case "charge.dispute.created":
    case "charge.dispute.closed": {
      if (ev.type === "charge.dispute.closed" && o.status !== "won") return json({ ignored: "dispute not won" });
      const charge = o.charge ? await stripeGet(d, `charges/${encodeURIComponent(idOf(o.charge))}`) : null;
      const customer = idOf(charge?.customer);
      if (!customer) { d.log("billing-webhook: dispute without a known customer (is STRIPE_SECRET_KEY set?)", ev.id); return json({ ignored: "customer unknown" }); }
      return done({ ...base, state: ev.type === "charge.dispute.created" ? "revoke" : "unrevoke", customer });
    }
    default:
      return json({ ignored: ev.type });
  }
}

// ---------- RevenueCat (App Store and Google Play) ----------
// The app store wrapper logs in to RevenueCat with the Supabase user id, so app_user_id is that id.
const RC_SOURCE: Record<string, string> = { APP_STORE: "apple", MAC_APP_STORE: "apple", PLAY_STORE: "google" };
function rcUser(e: any): string | undefined {
  const ids = [e?.app_user_id, ...(e?.aliases || []), e?.original_app_user_id].filter(Boolean).map(String);
  return validUid(ids.find(id => UUID.test(id)));
}

async function handleRevenueCat(req: Request, d: Deps, raw: string): Promise<Response> {
  const want = d.env("REVENUECAT_WEBHOOK_AUTH");
  const got = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!want || want.length < 16 || !(await secretEqual(got, want))) return json({ error: "not allowed" }, 401);
  let body: any;
  try { body = JSON.parse(raw); } catch (_e) { return json({ error: "bad request" }, 400); }
  const e = body?.event;
  if (!e?.type || typeof e.id !== "string") return json({ error: "bad request" }, 400);
  if (e.type === "TEST") return json({ ok: "test received" });
  // Sandbox purchases are free test purchases: never Pro, unless the owner opts in while testing.
  if (e.environment === "SANDBOX" && d.env("RC_ALLOW_SANDBOX") !== "1") return json({ ignored: "sandbox" });
  if (e.store === "STRIPE") return json({ ignored: "Stripe payments are handled by the Stripe webhook" });
  const source = RC_SOURCE[e.store] || "revenuecat";
  const at = iso(Number(e.event_timestamp_ms) || d.now())!;
  const base = { family: "revenuecat" as const, source, type: String(e.type), event_at: at };
  const done = async (row: Apply) => json({ ok: await apply(d, row) });

  if (e.type === "TRANSFER") {
    // Purchases moved to another account: the old account loses Pro. The new one gets it on its next renewal or Restore Purchase.
    const out: string[] = [];
    for (const id of ((e.transferred_from || []) as string[]).map(validUid).filter(Boolean) as string[]) {
      out.push(await apply(d, { ...base, event_id: `${e.id}:${id}`, state: "ended", uid_hint: id }));
    }
    return json({ ok: out.join(",") || "nothing to move" });
  }
  const uid = rcUser(e);
  if (!uid) return json({ ignored: "app_user_id is not a Studyboard user id" });
  const exp = e.expiration_at_ms ? Number(e.expiration_at_ms) : null;
  const ext = String(e.app_user_id || "");

  switch (e.type) {
    case "INITIAL_PURCHASE":
    case "RENEWAL":
    case "UNCANCELLATION":
    case "PRODUCT_CHANGE":
    case "SUBSCRIPTION_EXTENDED":
    case "TEMPORARY_ENTITLEMENT_GRANT":
      if (!exp) return json({ ignored: "no expiry on event" });
      return done({ ...base, event_id: e.id, state: "active", uid_hint: uid, pro_until: iso(exp + GRACE_MS), will_renew: true, external_id: ext,
        fresh: e.type === "INITIAL_PURCHASE", ...(e.period_type === "TRIAL" ? { trial_until: iso(exp) } : {}) });
    case "NON_RENEWING_PURCHASE":
      return done(exp
        ? { ...base, event_id: e.id, state: "active", uid_hint: uid, pro_until: iso(exp), will_renew: false, external_id: ext, fresh: true }
        : { ...base, event_id: e.id, state: "lifetime", uid_hint: uid, external_id: ext, fresh: true });
    case "CANCELLATION":
      // Usually: renewal is off, but Pro stays until the paid time runs out (EXPIRATION comes then).
      // A refund by the store's support ends it at once.
      return done({ ...base, event_id: e.id, uid_hint: uid, state: e.cancel_reason === "CUSTOMER_SUPPORT" ? "revoke" : "renew_off" });
    case "EXPIRATION":
      return done({ ...base, event_id: e.id, state: "ended", uid_hint: uid });
    default:
      return json({ ignored: e.type });   // BILLING_ISSUE, SUBSCRIPTION_PAUSED and others: nothing changes (the grace days cover a late card)
  }
}

// ---------- Routing: /stripe, /revenuecat, or guessed from the headers ----------
export async function handle(req: Request, d: Deps): Promise<Response> {
  if (req.method !== "POST") return json({ ok: true });
  const path = new URL(req.url).pathname;
  try {
    if (Number(req.headers.get("content-length") || 0) > MAX_BODY) return json({ error: "bad request" }, 413);
    const raw = await req.text();
    if (raw.length > MAX_BODY) return json({ error: "bad request" }, 413);
    if (/\/stripe\/?$/.test(path) || (!/\/revenuecat\/?$/.test(path) && req.headers.has("stripe-signature"))) return await handleStripe(req, d, raw);
    if (/\/revenuecat\/?$/.test(path) || req.headers.has("authorization")) return await handleRevenueCat(req, d, raw);
    return json({ error: "bad request" }, 400);
  } catch (err) {
    d.log("billing-webhook failed", err instanceof Error ? err.message : "error");   // never the body, headers or keys
    return json({ error: "server error, please retry" }, 500);   // Stripe and RevenueCat retry on errors
  }
}

const g = globalThis as any;
if (g.Deno?.serve) {
  const env: Env = k => g.Deno.env.get(k) ?? "";
  g.Deno.serve((req: Request) => handle(req, { env, fetch, now: Date.now, log: console.error }));
}
