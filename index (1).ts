// Studyboard 1.11: billing-webhook (Supabase Edge Function)
// Turns payments into Pro. Stripe (the website and desktop app) and RevenueCat (the App Store and Google Play)
// call this function when someone buys, renews, cancels or runs out of Pro. It writes one row per person in
// public.studyboard_entitlements, which the app reads to know who has Pro.
//
// Two addresses (both go to this one function):
//   https://<your-project>.supabase.co/functions/v1/billing-webhook/stripe       paste this in Stripe > Webhooks
//   https://<your-project>.supabase.co/functions/v1/billing-webhook/revenuecat   paste this in RevenueCat > Integrations > Webhooks
//
// Secrets it needs (Supabase > Edge Functions > Secrets):
//   STRIPE_WEBHOOK_SECRET     starts with whsec_ (Stripe shows it after you add the webhook)
//   STRIPE_SECRET_KEY         optional but recommended: a restricted key with "Subscriptions: Read", so the exact renewal date is known right away
//   REVENUECAT_WEBHOOK_AUTH   any long random text; type the same text in RevenueCat's "Authorization header value"
// Supabase adds SUPABASE_URL and the service key by itself.
// Deploy with "Verify JWT" turned OFF: Stripe and RevenueCat don't sign in to Supabase. Each request is checked
// with its own secret instead, and anything that doesn't pass is turned away.

type Env = (k: string) => string;
type Ent = { user_id: string; plan?: string; pro_until?: string | null; trial_until?: string | null; source?: string | null; external_id?: string | null; will_renew?: boolean; updated_at?: string };
type Deps = { env: Env; fetch: typeof fetch; now: () => number; log: (...a: unknown[]) => void };

const GRACE_MS = 3 * 86400_000;   // a few extra days after a renewal date, so a late webhook never switches Pro off by mistake
const TOLERANCE_S = 300;          // Stripe signatures older than 5 minutes are refused (stops replays)
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { "Content-Type": "application/json" } });
const iso = (ms: number | null | undefined) => (ms ? new Date(ms).toISOString() : null);

// ---------- The database (PostgREST with the service key; RLS doesn't apply to it) ----------
function db(d: Deps) {
  const url = d.env("SUPABASE_URL").replace(/\/+$/, "") + "/rest/v1/studyboard_entitlements";
  let key = d.env("SUPABASE_SERVICE_ROLE_KEY");
  if (!key) { try { const k = JSON.parse(d.env("SUPABASE_SECRET_KEYS") || "{}"); key = String(k.default || Object.values(k)[0] || ""); } catch (_e) { /* newer projects only */ } }
  const headers = { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
  return {
    async get(userId: string): Promise<Ent | null> {
      const r = await d.fetch(`${url}?user_id=eq.${encodeURIComponent(userId)}&select=*`, { headers });
      if (!r.ok) throw new Error(`read failed: ${r.status} ${await r.text()}`);
      return ((await r.json()) as Ent[])[0] || null;
    },
    async byExternal(externalId: string): Promise<Ent | null> {
      const r = await d.fetch(`${url}?external_id=eq.${encodeURIComponent(externalId)}&select=*&limit=1`, { headers });
      if (!r.ok) throw new Error(`read failed: ${r.status} ${await r.text()}`);
      return ((await r.json()) as Ent[])[0] || null;
    },
    // Insert, or change only the fields given (merge-duplicates on the user_id primary key).
    async save(row: Ent): Promise<void> {
      const r = await d.fetch(url, { method: "POST", headers: { ...headers, Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify({ ...row, updated_at: new Date(d.now()).toISOString() }) });
      if (!r.ok) throw new Error(`save failed: ${r.status} ${await r.text()}`);
    },
  };
}
type Store = ReturnType<typeof db>;

// Someone with Pro for good keeps it, whatever a subscription does later.
async function saveUnlessLifetime(store: Store, row: Ent) {
  const cur = await store.get(row.user_id);
  if (cur && cur.plan === "lifetime" && row.plan !== "lifetime") return "kept lifetime";
  await store.save(row);
  return "saved";
}

// ---------- Stripe ----------
const hex = (buf: ArrayBuffer) => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let x = 0; for (let i = 0; i < a.length; i++) x |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return x === 0;
}
// Stripe signs "<timestamp>.<raw body>" with HMAC-SHA256 using the webhook secret. The header looks like "t=...,v1=...".
export async function verifyStripe(raw: string, header: string, secret: string, nowS: number): Promise<boolean> {
  if (!header || !secret) return false;
  const parts = header.split(",").map(p => p.trim().split("="));
  const t = parts.find(p => p[0] === "t")?.[1] || "";
  const sigs = parts.filter(p => p[0] === "v1").map(p => p[1]);
  if (!t || !sigs.length || Math.abs(nowS - Number(t)) > TOLERANCE_S) return false;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const want = hex(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${t}.${raw}`)));
  return sigs.some(s => safeEqual(s, want));
}

// Newer Stripe API versions keep the period end on the subscription item instead of the subscription.
const periodEnd = (sub: any): number => Number(sub?.current_period_end || sub?.items?.data?.[0]?.current_period_end || 0);
const LIVE = ["active", "trialing", "past_due"];

function subRow(userId: string, sub: any, d: Deps): Ent {
  const end = periodEnd(sub) * 1000;
  const live = LIVE.includes(sub?.status);
  return {
    user_id: userId, source: "stripe", external_id: String(sub.customer || ""),
    plan: live ? "pro" : "free",
    pro_until: live ? iso(end ? end + GRACE_MS : d.now() + 35 * 86400_000) : iso(d.now()),
    ...(sub?.status === "trialing" && sub?.trial_end ? { trial_until: iso(sub.trial_end * 1000) } : {}),
    will_renew: live && !sub?.cancel_at_period_end && !sub?.cancel_at,
  };
}
async function stripeGet(d: Deps, path: string): Promise<any | null> {
  const key = d.env("STRIPE_SECRET_KEY");
  if (!key) return null;
  const r = await d.fetch(`https://api.stripe.com/v1/${path}`, { headers: { Authorization: `Bearer ${key}` } });
  return r.ok ? await r.json() : null;
}

async function handleStripe(req: Request, d: Deps): Promise<Response> {
  const raw = await req.text();
  const ok = await verifyStripe(raw, req.headers.get("stripe-signature") || "", d.env("STRIPE_WEBHOOK_SECRET"), Math.floor(d.now() / 1000));
  if (!ok) return json({ error: "bad signature" }, 400);
  const ev = JSON.parse(raw);
  const o = ev?.data?.object || {};
  const store = db(d);
  // Who is this? The app adds ?client_reference_id=<user id> to the payment link. After that, the Stripe customer id is remembered.
  const userFor = async (customer: string, hint?: string): Promise<string | null> => {
    if (hint && UUID.test(hint)) return hint;
    if (!customer) return null;
    const hit = await store.byExternal(customer);
    return hit ? hit.user_id : null;
  };

  switch (ev.type) {
    case "checkout.session.completed": {
      const userId = await userFor(String(o.customer || ""), o.client_reference_id || o.metadata?.user_id);
      if (!userId) return json({ ignored: "no user id on this checkout (was client_reference_id added to the link?)" });
      if (o.mode === "payment") {
        // A one-time payment is Pro for good only when the payment link has metadata plan = lifetime.
        if (o.metadata?.plan !== "lifetime") return json({ ignored: "one-time payment without plan=lifetime" });
        await store.save({ user_id: userId, plan: "lifetime", pro_until: null, source: "lifetime", external_id: String(o.customer || "") || null, will_renew: false });
        return json({ ok: "lifetime" });
      }
      const sub = (o.subscription && await stripeGet(d, `subscriptions/${o.subscription}`)) || { status: "active", customer: o.customer };
      return json({ ok: await saveUnlessLifetime(store, subRow(userId, sub, d)) });
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const userId = await userFor(String(o.customer || ""), o.metadata?.user_id);
      if (!userId) return json({ ignored: "unknown customer" });
      const row = ev.type === "customer.subscription.deleted"
        ? { user_id: userId, plan: "free", pro_until: iso(d.now()), will_renew: false, source: "stripe", external_id: String(o.customer || "") }
        : subRow(userId, o, d);
      return json({ ok: await saveUnlessLifetime(store, row) });
    }
    case "invoice.paid": {
      const userId = await userFor(String(o.customer || ""), o.subscription_details?.metadata?.user_id);
      if (!userId) return json({ ignored: "unknown customer" });
      const end = Math.max(0, ...((o.lines?.data || []) as any[]).map(l => Number(l?.period?.end || 0))) * 1000;
      if (!end) return json({ ignored: "no period on invoice" });
      const cur = await store.get(userId);
      const until = Math.max(end + GRACE_MS, cur?.pro_until ? Date.parse(cur.pro_until) : 0);
      return json({ ok: await saveUnlessLifetime(store, { user_id: userId, plan: "pro", pro_until: iso(until), source: "stripe", external_id: String(o.customer || "") }) });
    }
    default:
      return json({ ignored: ev.type });
  }
}

// ---------- RevenueCat (App Store and Google Play) ----------
// The app store wrapper should log in to RevenueCat with the Supabase user id, so app_user_id is that id.
const RC_SOURCE: Record<string, string> = { APP_STORE: "apple", MAC_APP_STORE: "apple", PLAY_STORE: "google", STRIPE: "stripe", PROMOTIONAL: "promo" };
function rcUser(e: any): string | null {
  const ids = [e?.app_user_id, ...(e?.aliases || []), e?.original_app_user_id].filter(Boolean).map(String);
  return ids.find(id => UUID.test(id)) || null;
}

async function handleRevenueCat(req: Request, d: Deps): Promise<Response> {
  const want = d.env("REVENUECAT_WEBHOOK_AUTH");
  const got = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!want || !safeEqual(got, want)) return json({ error: "not allowed" }, 401);
  const body = await req.json().catch(() => null);
  const e = body?.event;
  if (!e?.type) return json({ error: "no event" }, 400);
  if (e.type === "TEST") return json({ ok: "test received" });
  const store = db(d);
  const source = RC_SOURCE[e.store] || "promo";

  if (e.type === "TRANSFER") {
    // Purchases moved to another account: the old account loses Pro. The new one gets it on its next renewal or Restore Purchase.
    for (const id of (e.transferred_from || []).filter((x: string) => UUID.test(x))) await saveUnlessLifetime(store, { user_id: id, plan: "free", pro_until: iso(d.now()), will_renew: false });
    return json({ ok: "transfer" });
  }
  const userId = rcUser(e);
  if (!userId) return json({ ignored: "app_user_id is not a Studyboard user id" });
  const exp = e.expiration_at_ms ? Number(e.expiration_at_ms) : null;

  switch (e.type) {
    case "INITIAL_PURCHASE":
    case "RENEWAL":
    case "UNCANCELLATION":
    case "PRODUCT_CHANGE":
    case "SUBSCRIPTION_EXTENDED":
    case "TEMPORARY_ENTITLEMENT_GRANT":
      return json({ ok: await saveUnlessLifetime(store, { user_id: userId, plan: "pro", pro_until: iso(exp ? exp + GRACE_MS : null), source, external_id: String(e.app_user_id), will_renew: true,
        ...(e.period_type === "TRIAL" && exp ? { trial_until: iso(exp) } : {}) }) });
    case "NON_RENEWING_PURCHASE":
      return json({ ok: await saveUnlessLifetime(store, exp
        ? { user_id: userId, plan: "pro", pro_until: iso(exp), source, external_id: String(e.app_user_id), will_renew: false }
        : { user_id: userId, plan: "lifetime", pro_until: null, source: "lifetime", external_id: String(e.app_user_id), will_renew: false }) });
    case "CANCELLATION":
      // Renewal is off, but Pro stays until the paid time runs out (EXPIRATION comes then).
      return json({ ok: await saveUnlessLifetime(store, { user_id: userId, will_renew: false }) });
    case "EXPIRATION":
      return json({ ok: await saveUnlessLifetime(store, { user_id: userId, plan: "free", pro_until: iso(d.now()), will_renew: false }) });
    default:
      return json({ ignored: e.type });   // BILLING_ISSUE, SUBSCRIPTION_PAUSED and others: nothing changes
  }
}

// ---------- Routing: /stripe, /revenuecat, or guessed from the headers ----------
export async function handle(req: Request, d: Deps): Promise<Response> {
  if (req.method !== "POST") return json({ ok: true, hint: "Send webhooks with POST to /billing-webhook/stripe or /billing-webhook/revenuecat" });
  const path = new URL(req.url).pathname;
  try {
    if (/\/stripe\/?$/.test(path) || (!/\/revenuecat\/?$/.test(path) && req.headers.has("stripe-signature"))) return await handleStripe(req, d);
    if (/\/revenuecat\/?$/.test(path) || req.headers.has("authorization")) return await handleRevenueCat(req, d);
    return json({ error: "unknown sender" }, 400);
  } catch (err) {
    d.log("billing-webhook failed", err);
    return json({ error: "server error, please retry" }, 500);   // Stripe and RevenueCat retry on errors
  }
}

const g = globalThis as any;
if (g.Deno?.serve) {
  const env: Env = k => g.Deno.env.get(k) ?? "";
  g.Deno.serve((req: Request) => handle(req, { env, fetch, now: Date.now, log: console.error }));
}
