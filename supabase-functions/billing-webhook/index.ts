// Studyboard 1.12

type Env = (k: string) => string;
type Deps = { env: Env; fetch: typeof fetch; now: () => number; log: (...a: unknown[]) => void };
type Apply = {
  event_id: string; family: "stripe" | "revenuecat"; source: string; type: string; event_at: string;
  state: "active" | "extend" | "ended" | "renew_off" | "revoke" | "unrevoke" | "lifetime";
  uid_hint?: string; trust_hint?: boolean; customer?: string; pro_until?: string | null; trial_until?: string | null;
  will_renew?: boolean; external_id?: string; fresh?: boolean;
  // A real payment (money taken, not a trial), and how long the plan is: these decide the Founders and Early Supporters
  paid?: boolean; term?: Term;
};
type Term = "monthly" | "semester" | "yearly";

const GRACE_MS = 3 * 86400_000;
const TOLERANCE_S = 300;
const MAX_BODY = 1_000_000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { "Content-Type": "application/json" } });
const iso = (ms: number | null | undefined) => (ms ? new Date(ms).toISOString() : null);

// The database (PostgREST with the service key; RLS doesn't apply to it)
function serviceKey(d: Deps): string {
  let key = d.env("SUPABASE_SERVICE_ROLE_KEY");
  if (!key) { try { const k = JSON.parse(d.env("SUPABASE_SECRET_KEYS") || "{}"); key = String(k.default || Object.values(k)[0] || ""); } catch (_e) { } }
  return key;
}
async function apply(d: Deps, row: Apply): Promise<string> {
  const key = serviceKey(d);
  const r = await d.fetch(d.env("SUPABASE_URL").replace(/\/+$/, "") + "/rest/v1/rpc/studyboard_apply_billing", {
    method: "POST", headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" }, body: JSON.stringify({ p: row }),
  });
  if (!r.ok) throw new Error(`apply failed: ${r.status}`);
  return String(await r.json());
}

// Constant-time comparison
const hex = (buf: ArrayBuffer) => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let x = 0; for (let i = 0; i < a.length; i++) x |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return x === 0;
}
// For secrets of any length
export async function secretEqual(a: string, b: string): Promise<boolean> {
  const h = async (s: string) => hex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)));
  return safeEqual(await h(a), await h(b));
}

// Stripe
export async function verifyStripe(raw: string, header: string, secret: string, nowS: number): Promise<boolean> {
  if (!header || !secret) return false;
  const parts = header.split(",").map(p => { const i = p.indexOf("="); return i < 0 ? [p.trim(), ""] : [p.slice(0, i).trim(), p.slice(i + 1).trim()]; });
  const t = parts.find(p => p[0] === "t")?.[1] || "";
  const sigs = parts.filter(p => p[0] === "v1").map(p => p[1]);
  if (!/^\d{9,12}$/.test(t) || !sigs.length || Math.abs(nowS - Number(t)) > TOLERANCE_S) return false;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const want = hex(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${t}.${raw}`)));
  let ok = false;
  for (const s of sigs) ok = safeEqual(s, want) || ok;
  return ok;
}

const periodEnd = (sub: any): number => Number(sub?.current_period_end || sub?.items?.data?.[0]?.current_period_end || 0);
const idOf = (v: any): string => (typeof v === "string" ? v : String(v?.id || ""));
const validUid = (v: unknown): string | undefined => (typeof v === "string" && UUID.test(v) ? v.toLowerCase() : undefined);

async function stripeGet(d: Deps, path: string): Promise<any | null> {
  const key = d.env("STRIPE_SECRET_KEY");
  if (!key) return null;
  const r = await d.fetch(`https://api.stripe.com/v1/${path}`, { headers: { Authorization: `Bearer ${key}` } });
  return r.ok ? await r.json() : null;
}

// The optional price allowlist (STRIPE_PRICE_IDS)
export function priceAllowed(d: Deps, ids: string[]): boolean {
  const list = d.env("STRIPE_PRICE_IDS");
  if (!list.trim()) return true;
  const allow = new Set([...list.split(","), d.env("STRIPE_PRICE_MONTHLY"), d.env("STRIPE_PRICE_SEMESTER"), d.env("STRIPE_PRICE_YEARLY")].map(s => s.trim()).filter(Boolean));
  return ids.some(id => allow.has(id));
}
// How long a plan is: its price id first (STRIPE_PRICE_*), then the length of the period paid for
export const termFromDays = (days: number): Term | undefined => !(days > 0) ? undefined : days >= 300 ? "yearly" : days >= 90 ? "semester" : "monthly";
export function termOf(d: Deps, priceIds: string[], days: number): Term | undefined {
  const named: [string, Term][] = [["STRIPE_PRICE_YEARLY", "yearly"], ["STRIPE_PRICE_SEMESTER", "semester"], ["STRIPE_PRICE_MONTHLY", "monthly"]];
  for (const [k, t] of named) { const v = d.env(k).trim(); if (v && priceIds.includes(v)) return t; }
  return termFromDays(days);
}
const DAY_S = 86400;
const recurringDays = (r: any): number => {
  const n = Number(r?.interval_count) || 1;
  return ({ year: 365, month: 30, week: 7, day: 1 } as Record<string, number>)[String(r?.interval || "")] * n || 0;
};
function subTerm(d: Deps, sub: any): Term | undefined {
  const item = sub?.items?.data?.[0];
  const start = Number(sub?.current_period_start || item?.current_period_start || 0), end = periodEnd(sub);
  return termOf(d, subPrices(sub), recurringDays(item?.price?.recurring || item?.plan) || (start && end > start ? (end - start) / DAY_S : 0));
}
const subPrices = (sub: any): string[] => ((sub?.items?.data || []) as any[]).map(i => idOf(i?.price || i?.plan));
// Invoice lines name the price as line.price
const linePrices = (inv: any): string[] => ((inv?.lines?.data || []) as any[]).map(l => idOf(l?.pricing?.price_details?.price || l?.price || l?.plan));

// What a subscription object means for Pro
function subscriptionState(sub: any, d: Deps): Pick<Apply, "state" | "pro_until" | "trial_until" | "will_renew"> | null {
  const status = String(sub?.status || "");
  if (status === "trialing" || status === "active" || status === "past_due") {
    if (!priceAllowed(d, subPrices(sub))) return null;
    // past_due keeps Pro until the paid period (plus a few days) runs out
    const end = periodEnd(sub) * 1000;
    return {
      state: "active", pro_until: iso(end ? end + GRACE_MS : d.now() + 35 * 86400_000),
      trial_until: status === "trialing" && sub?.trial_end ? iso(Number(sub.trial_end) * 1000) : null,
      will_renew: !sub?.cancel_at_period_end && !sub?.cancel_at,
    };
  }
  if (status === "canceled" || status === "unpaid" || status === "incomplete_expired" || status === "paused") return { state: "ended" };
  return null;
}

// EU website sales reached from the iPhone app's website option are reported to Apple (supabase-apple-external.sql decides
// whether this invoice is one of them; supabase-functions/apple-external sends the reports). Never stops the payment from counting.
const ZERO_DECIMAL = new Set(["bif", "clp", "djf", "gnf", "jpy", "kmf", "krw", "mga", "pyg", "rwf", "ugx", "vnd", "vuv", "xaf", "xof", "xpf"]);
const EU3: Record<string, string> = { AT: "AUT", BE: "BEL", BG: "BGR", HR: "HRV", CY: "CYP", CZ: "CZE", DK: "DNK", EE: "EST", FI: "FIN", FR: "FRA", DE: "DEU", GR: "GRC", HU: "HUN", IE: "IRL", IT: "ITA", LV: "LVA", LT: "LTU", LU: "LUX", MT: "MLT", NL: "NLD", PL: "POL", PT: "PRT", RO: "ROU", SK: "SVK", SI: "SVN", ES: "ESP", SE: "SWE" };
// Stripe's smallest units to Apple's milli-units
export const milli = (minor: number, currency: string) => Math.round(Number(minor) || 0) * (ZERO_DECIMAL.has(String(currency).toLowerCase()) ? 1000 : 10);
export function appleInvoice(o: any, customer: string, subId: string, startS: number, endMs: number): Record<string, unknown> | null {
  const cur = String(o?.currency || "").toLowerCase();
  if (!/^[a-z]{3}$/.test(cur) || !startS || !endMs) return null;
  const paidAt = Number(o?.status_transitions?.paid_at || o?.created || 0) * 1000;
  const inc = Number(o?.amount_paid) || 0, ex = Number(o?.total_excluding_tax ?? (inc - (Number(o?.tax) || 0)));
  const plan = String(o?.parent?.subscription_details?.metadata?.plan || o?.subscription_details?.metadata?.plan || o?.lines?.data?.[0]?.metadata?.plan || "");
  return {
    customer, subscription: subId, invoice: String(o?.id || ""), reason: String(o?.billing_reason || ""), paid_at: paidAt,
    period_start: startS * 1000, period_end: endMs, currency: cur,
    amount_in: milli(inc, cur), amount_ex: milli(ex, cur), tax: milli(Math.max(0, inc - ex), cur),
    tax_country: EU3[String(o?.customer_address?.country || o?.customer_shipping?.address?.country || "").toUpperCase()] || "",
    plan: ["monthly", "semester", "yearly"].includes(plan) ? plan : "",
  };
}
async function appleQueue(d: Deps, o: any, customer: string, subId: string, startS: number, endMs: number) {
  try {
    const p = appleInvoice(o, customer, subId, startS, endMs);
    if (!p || !p.invoice) return;
    const key = serviceKey(d);
    const r = await d.fetch(d.env("SUPABASE_URL").replace(/\/+$/, "") + "/rest/v1/rpc/studyboard_apple_queue_invoice", {
      method: "POST", headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" }, body: JSON.stringify({ p }),
    });
    // 404: supabase-apple-external.sql isn't installed (the EU website option isn't in use)
    if (!r.ok && r.status !== 404) d.log("billing-webhook: queuing the Apple report failed", r.status);
  } catch (e) { d.log("billing-webhook: queuing the Apple report failed", e instanceof Error ? e.message : "error"); }
}

async function handleStripe(req: Request, d: Deps, raw: string): Promise<Response> {
  const ok = await verifyStripe(raw, req.headers.get("stripe-signature") || "", d.env("STRIPE_WEBHOOK_SECRET"), Math.floor(d.now() / 1000));
  if (!ok) return json({ error: "bad request" }, 400);
  let ev: any;
  try { ev = JSON.parse(raw); } catch (_e) { return json({ error: "bad request" }, 400); }
  const o = ev?.data?.object || {};
  if (typeof ev?.id !== "string" || typeof ev?.type !== "string") return json({ error: "bad request" }, 400);
  // Test (sandbox) events must never change a live project, and live events never a test one
  const sk = d.env("STRIPE_SECRET_KEY"), keyLive = /^[sr]k_live_/.test(sk) ? true : /^[sr]k_test_/.test(sk) ? false : null;
  if (keyLive !== null && typeof ev.livemode === "boolean" && ev.livemode !== keyLive) { d.log("billing-webhook: ignored an event from the other Stripe mode", ev.id, ev.type); return json({ ignored: "other stripe mode" }); }
  const at = iso((Number(ev.created) || Math.floor(d.now() / 1000)) * 1000)!;
  const base = { event_id: ev.id, family: "stripe" as const, source: "stripe", type: ev.type, event_at: at };
  const done = async (row: Apply) => json({ ok: await apply(d, row) });

  switch (ev.type) {
    case "checkout.session.completed": {
      const uid = validUid(o.client_reference_id);
      if (o.mode !== "subscription" || !uid || String(o.metadata?.uid || "").toLowerCase() !== uid) return json({ ignored: "not one of our checkouts" });
      if (o.payment_status !== "paid" && o.payment_status !== "no_payment_required") return json({ ignored: "not paid" });
      const customer = idOf(o.customer);
      if (!customer) return json({ ignored: "no customer" });
      const sub = o.subscription ? await stripeGet(d, `subscriptions/${encodeURIComponent(idOf(o.subscription))}`) : null;
      if (sub && idOf(sub.customer) !== customer) return json({ ignored: "customer mismatch" });
      const st = sub ? subscriptionState(sub, d) : { state: "active" as const, pro_until: iso(d.now() + 35 * 86400_000), trial_until: null, will_renew: true };
      if (!st || st.state !== "active") return json({ ignored: "subscription not active" });
      // Money was taken now (a checkout trial is not a payment)
      const paid = o.payment_status === "paid" && Number(o.amount_total) > 0 && (!sub || sub.status === "active");
      return done({ ...base, ...st, uid_hint: uid, trust_hint: true, customer, external_id: customer, fresh: true, ...(paid ? { paid: true, term: sub ? subTerm(d, sub) : undefined } : {}) });
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
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
      if (!priceAllowed(d, linePrices(o))) return json({ ignored: "price not allowed" });
      const lines = (o.lines?.data || []) as any[];
      const start = Math.min(...lines.map(l => Number(l?.period?.start || 0)).filter(Boolean)) || 0;
      const paid = Number(o.amount_paid) > 0;
      if (paid) await appleQueue(d, o, customer, subId, start, end);
      return done({ ...base, state: "extend", customer, external_id: customer, pro_until: iso(end + GRACE_MS),
        ...(paid ? { paid: true, term: termOf(d, linePrices(o), start && end / 1000 > start ? (end / 1000 - start) / DAY_S : 0) } : {}) });
    }
    case "charge.refunded": {
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

// RevenueCat (App Store and Google Play)
const RC_SOURCE: Record<string, string> = { APP_STORE: "apple", MAC_APP_STORE: "apple", PLAY_STORE: "google" };
function rcUser(e: any): string | undefined {
  const ids = [e?.app_user_id, ...(e?.aliases || []), e?.original_app_user_id].filter(Boolean).map(String);
  return validUid(ids.find(id => UUID.test(id)));
}

// Store products sold as the one-time semester plan: RC_SEMESTER_PRODUCTS (comma separated), else any id containing "semester"
export function isSemesterProduct(d: Deps, id: unknown): boolean {
  const p = String(id || "").trim(); if (!p) return false;
  const list = (d.env("RC_SEMESTER_PRODUCTS") || "").split(",").map(s => s.trim()).filter(Boolean);
  return list.length ? list.includes(p) : /semester/i.test(p);
}
export const plusMonths = (ms: number, n: number): number => { const t = new Date(ms); t.setUTCMonth(t.getUTCMonth() + n); return t.getTime(); };

async function handleRevenueCat(req: Request, d: Deps, raw: string): Promise<Response> {
  const want = d.env("REVENUECAT_WEBHOOK_AUTH");
  const got = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!want || want.length < 16 || !(await secretEqual(got, want))) return json({ error: "not allowed" }, 401);
  let body: any;
  try { body = JSON.parse(raw); } catch (_e) { return json({ error: "bad request" }, 400); }
  const e = body?.event;
  if (!e?.type || typeof e.id !== "string") return json({ error: "bad request" }, 400);
  if (e.type === "TEST") return json({ ok: "test received" });
  // Sandbox purchases are free test purchases
  if (e.environment === "SANDBOX" && d.env("RC_ALLOW_SANDBOX") !== "1") return json({ ignored: "sandbox" });
  if (e.store === "STRIPE") return json({ ignored: "Stripe payments are handled by the Stripe webhook" });
  const source = RC_SOURCE[e.store] || "revenuecat";
  const at = iso(Number(e.event_timestamp_ms) || d.now())!;
  const base = { family: "revenuecat" as const, source, type: String(e.type), event_at: at };
  const done = async (row: Apply) => json({ ok: await apply(d, row) });

  if (e.type === "TRANSFER") {
    // Purchases moved to another account
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
    case "RENEWAL": {
      if (!exp) return json({ ignored: "no expiry on event" });
      // A store trial is not a payment; a price of 0 isn't either
      const paid = e.period_type !== "TRIAL" && !(typeof e.price === "number" && e.price <= 0) && !(typeof e.price_in_purchased_currency === "number" && e.price_in_purchased_currency <= 0);
      const bought = Number(e.purchased_at_ms) || 0;
      return done({ ...base, event_id: e.id, state: "active", uid_hint: uid, pro_until: iso(exp + GRACE_MS), will_renew: true, external_id: ext,
        fresh: e.type === "INITIAL_PURCHASE", ...(e.period_type === "TRIAL" ? { trial_until: iso(exp) } : {}),
        ...(paid ? { paid: true, term: termFromDays(bought && exp > bought ? (exp - bought) / 86400e3 : 0) } : {}) });
    }
    case "UNCANCELLATION":
    case "PRODUCT_CHANGE":
    case "SUBSCRIPTION_EXTENDED":
    case "TEMPORARY_ENTITLEMENT_GRANT":
      if (!exp) return json({ ignored: "no expiry on event" });
      return done({ ...base, event_id: e.id, state: "active", uid_hint: uid, pro_until: iso(exp + GRACE_MS), will_renew: true, external_id: ext,
        fresh: e.type === "INITIAL_PURCHASE", ...(e.period_type === "TRIAL" ? { trial_until: iso(exp) } : {}) });
    case "NON_RENEWING_PURCHASE": {
      // The store semester plan: paid once, Pro for 4 months from the purchase (the event has no expiry for it)
      if (isSemesterProduct(d, e.product_id)) {
        const bought = Number(e.purchased_at_ms) || Number(e.event_timestamp_ms) || d.now();
        const paid = !(typeof e.price === "number" && e.price <= 0) && !(typeof e.price_in_purchased_currency === "number" && e.price_in_purchased_currency <= 0);
        return done({ ...base, event_id: e.id, state: "active", uid_hint: uid, pro_until: iso(plusMonths(bought, 4) + GRACE_MS), will_renew: false,
          external_id: ext, fresh: true, ...(paid ? { paid: true, term: "semester" as const } : {}) });
      }
      return done(exp
        ? { ...base, event_id: e.id, state: "active", uid_hint: uid, pro_until: iso(exp), will_renew: false, external_id: ext, fresh: true }
        : { ...base, event_id: e.id, state: "lifetime", uid_hint: uid, external_id: ext, fresh: true });
    }
    case "CANCELLATION":
      return done({ ...base, event_id: e.id, uid_hint: uid, state: e.cancel_reason === "CUSTOMER_SUPPORT" ? "revoke" : "renew_off" });
    case "EXPIRATION":
      return done({ ...base, event_id: e.id, state: "ended", uid_hint: uid });
    default:
      return json({ ignored: e.type });
  }
}

// Reads the body but stops as soon as it passes max bytes (null = too big)
export async function readLimited(req: Request, max: number): Promise<string | null> {
  const cl = Number(req.headers.get("content-length") || 0);
  if (cl > max) return null;
  if (!req.body) return "";
  const reader = req.body.getReader();
  const chunks: Uint8Array[] = []; let n = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    n += value.byteLength;
    if (n > max) { try { await reader.cancel(); } catch (_e) { } return null; }
    chunks.push(value);
  }
  const all = new Uint8Array(n); let o = 0;
  for (const c of chunks) { all.set(c, o); o += c.byteLength; }
  return new TextDecoder().decode(all);
}

// Routing: /stripe, /revenuecat, or guessed from the headers
export async function handle(req: Request, d: Deps): Promise<Response> {
  if (req.method !== "POST") return json({ ok: true });
  const path = new URL(req.url).pathname;
  try {
    const raw = await readLimited(req, MAX_BODY);
    if (raw === null) return json({ error: "bad request" }, 413);
    if (/\/stripe\/?$/.test(path) || (!/\/revenuecat\/?$/.test(path) && req.headers.has("stripe-signature"))) return await handleStripe(req, d, raw);
    if (/\/revenuecat\/?$/.test(path) || req.headers.has("authorization")) return await handleRevenueCat(req, d, raw);
    return json({ error: "bad request" }, 400);
  } catch (err) {
    d.log("billing-webhook failed", err instanceof Error ? err.message : "error");
    return json({ error: "server error, please retry" }, 500);
  }
}

const g = globalThis as any;
if (g.Deno?.serve) {
  const env: Env = k => g.Deno.env.get(k) ?? "";
  g.Deno.serve((req: Request) => handle(req, { env, fetch, now: Date.now, log: console.error }));
}
