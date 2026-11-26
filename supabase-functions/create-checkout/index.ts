// Studyboard Pro, Studyboard Plus and Studyboard Credits

type Env = (k: string) => string;
type Deps = { env: Env; fetch: typeof fetch; now: () => number; log: (...a: unknown[]) => void };

const RATE_MAX = 10, RATE_WINDOW = 3600;
// "plus" is Studyboard Plus: Pro without Studyboard AI, $2.99 a month (its price id: the STRIPE_PRICE_PLUS secret, or
// studyboard_config.stripe_prices.plus_monthly; shown once studyboard_config.plus_plan is true)
// "quarterly" renews every 3 months (STRIPE_PRICE_QUARTERLY); it replaced the 4-month semester plan, which is no longer sold
const PLANS = ["monthly", "quarterly", "yearly", "plus"] as const;
const PRICE_ENV: Record<string, string> = { monthly: "STRIPE_PRICE_MONTHLY", quarterly: "STRIPE_PRICE_QUARTERLY", yearly: "STRIPE_PRICE_YEARLY", plus: "STRIPE_PRICE_PLUS" };
const PACK_ID = /^[a-z0-9_]{1,40}$/;
const PRICE_ID = /^price_[A-Za-z0-9]+$/;
const APP_ORIGINS = ["app://studioso", "capacitor://localhost", "https://localhost"];
type Plan = typeof PLANS[number];
const PATH_OK = /^\/[A-Za-z0-9_./-]{0,120}$/;

const json = (o: unknown, status: number, cors: Record<string, string>, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(o), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...cors, ...extra } });

function serviceKey(d: Deps): string {
  let key = d.env("SUPABASE_SERVICE_ROLE_KEY");
  if (!key) { try { const k = JSON.parse(d.env("SUPABASE_SECRET_KEYS") || "{}"); key = String(k.default || Object.values(k)[0] || ""); } catch (_e) { } }
  return key;
}
const base = (d: Deps) => d.env("SUPABASE_URL").replace(/\/+$/, "");
const anon = (d: Deps) => d.env("SUPABASE_ANON_KEY") || serviceKey(d);

// Where people may be sent back to
export function originOf(u: string, allowLocalhost: boolean): string | null {
  try {
    const x = new URL(u);
    const https = x.protocol === "https:";
    const local = allowLocalhost && x.protocol === "http:" && (x.hostname === "localhost" || x.hostname === "127.0.0.1");
    if (!https && !local) return null;
    if (x.username || x.password) return null;
    return x.origin;
  } catch (_e) { return null; }
}
export function allowedOrigins(env: Env, siteUrlFromConfig: string): string[] {
  const local = env("ALLOW_LOCALHOST") === "1";
  const list = [...env("SITE_ORIGINS").split(","), siteUrlFromConfig].map(s => s.trim()).filter(Boolean);
  return [...new Set(list.map(s => originOf(s, local)).filter((o): o is string => !!o))];
}
export function safeReturn(candidate: unknown, origins: string[], fallbackPath: string, allowLocalhost: boolean, query = ""): string {
  let origin = origins[0], path = fallbackPath;
  if (typeof candidate === "string" && candidate.length <= 500) {
    const o = originOf(candidate, allowLocalhost);
    if (o && origins.includes(o)) {
      const p = new URL(candidate).pathname;
      if (PATH_OK.test(p) && !p.includes("..")) { origin = o; path = p; }
    }
  }
  return origin + path + query;
}

// Stripe (form-encoded)
function form(o: Record<string, unknown>, prefix = "", out: string[] = []): string {
  for (const [k, v] of Object.entries(o)) {
    if (v === undefined || v === null) continue;
    const key = prefix ? `${prefix}[${k}]` : k;
    if (typeof v === "object") form(v as Record<string, unknown>, key, out);
    else out.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(v))}`);
  }
  return out.join("&");
}
// Managed Payments is a preview
const MANAGED_PAYMENTS_VERSION = "2026-02-25.preview";
async function stripe(d: Deps, path: string, body: Record<string, unknown>, idem?: string, version?: string): Promise<any> {
  const r = await d.fetch(`https://api.stripe.com/v1/${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${d.env("STRIPE_SECRET_KEY")}`, "Content-Type": "application/x-www-form-urlencoded", ...(idem ? { "Idempotency-Key": idem } : {}), ...(version ? { "Stripe-Version": version } : {}) },
    body: form(body),
  });
  if (!r.ok) { const e = await r.json().catch(() => ({})) as { error?: { code?: string; message?: string } }; throw new Error(`stripe ${path} ${r.status} ${e.error?.code || ""} ${String(e.error?.message || "").slice(0, 200)}`.trim()); }
  return await r.json();
}

// Has this email address had a free trial before, on an account that was deleted since
export async function trialUsed(d: Deps, h: Record<string, string>, email: string): Promise<boolean> {
  const r = await d.fetch(`${base(d)}/rest/v1/rpc/studyboard_trial_used`, { method: "POST", headers: h, body: JSON.stringify({ p_email: email }) });
  if (r.status === 404) { d.log("create-checkout: studyboard_trial_used is missing; run supabase-plans.sql again"); return false; }
  if (!r.ok) throw new Error(`db rpc/studyboard_trial_used ${r.status}`);
  return (await r.json()) === true;
}

export async function handle(req: Request, d: Deps): Promise<Response> {
  const local = d.env("ALLOW_LOCALHOST") === "1";
  const appOrigins = [...APP_ORIGINS, ...d.env("APP_ORIGINS").split(",").map(s => s.trim()).filter(Boolean)];
  const envOrigins = allowedOrigins(d.env, "").concat(appOrigins);
  const reqOrigin = req.headers.get("origin") || "";
  const cors: Record<string, string> = {
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Max-Age": "600", Vary: "Origin",
  };
  // Browsers on other sites are not told yes
  if (reqOrigin && envOrigins.includes(reqOrigin)) cors["Access-Control-Allow-Origin"] = reqOrigin;
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405, cors);

  try {
    const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
    if (!token) return json({ error: "sign in first" }, 401, cors);
    const ur = await d.fetch(`${base(d)}/auth/v1/user`, { headers: { apikey: anon(d), Authorization: `Bearer ${token}` } });
    if (!ur.ok) return json({ error: "sign in first" }, 401, cors);
    const user = await ur.json().catch(() => null) as { id?: string; email?: string; email_confirmed_at?: string; confirmed_at?: string } | null;
    if (!user?.id || !/^[0-9a-f-]{36}$/i.test(user.id)) return json({ error: "sign in first" }, 401, cors);
    const uid = user.id.toLowerCase();
    if (!user.email || !(user.email_confirmed_at || user.confirmed_at)) return json({ error: "confirm_email", message: "Confirm your email address first, then try again." }, 403, cors);

    const key = serviceKey(d);
    const h = { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
    const rest = async (path: string, init: RequestInit = {}) => {
      const r = await d.fetch(`${base(d)}/rest/v1/${path}`, { ...init, headers: { ...h, ...(init.headers || {}) } });
      if (!r.ok) throw new Error(`db ${path.split("?")[0]} ${r.status}`);
      return r;
    };

    // A few checkouts an hour per person
    const rl = await (await rest("rpc/studyboard_plan_rate_hit", { method: "POST", body: JSON.stringify({ p_key: `checkout:${uid}`, p_max: RATE_MAX, p_window: RATE_WINDOW }) })).json();
    if (rl !== true) return json({ error: "rate_limited", message: "Too many tries. Please wait a little and try again." }, 429, cors, { "Retry-After": "900" });

    // Only a plan name ("monthly", "quarterly", "yearly" or "plus") or a credit pack id is taken from the browser; prices come from the server
    const text = await req.text();
    if (text.length > 4096) return json({ error: "bad request" }, 400, cors);
    const body = (() => { try { return JSON.parse(text || "{}"); } catch (_e) { return null; } })();
    const packId: string | null = body && typeof body.pack === "string" && PACK_ID.test(body.pack) ? body.pack : null;
    // An app from before the change still asks for "semester": its screen showed the old price, so it isn't charged the new one
    if (!packId && body?.plan === "semester") return json({ error: "plan_unavailable", message: "The semester plan is now a quarterly plan. Update Studyboard to see it, or choose monthly or yearly." }, 400, cors);
    const plan: Plan | null = !packId && body && PLANS.includes(body.plan) ? body.plan : null;
    if (!plan && !packId) return json({ error: "bad request", message: "Choose monthly, quarterly or yearly." }, 400, cors);
    if (!d.env("STRIPE_SECRET_KEY")) throw new Error("checkout is not configured");

    // Allowed return sites, and the switches and price ids kept in the database
    const cfg = await (await rest("studyboard_config?key=in.(site_url,prices,stripe_prices,plus_plan,item_purchases)&select=key,value")).json() as { key: string; value: unknown }[];
    const cfgVal = (k: string) => cfg.find(c => c.key === k)?.value;
    let price = "";
    if (plan) {
      price = d.env(PRICE_ENV[plan]);
      if (plan === "plus") {
        if (!PRICE_ID.test(price)) price = String((cfgVal("stripe_prices") as any)?.plus_monthly || "");
        if (cfgVal("plus_plan") !== true || !PRICE_ID.test(price)) return json({ error: "plan_unavailable", message: "Studyboard Plus isn't available yet. Choose a Pro plan." }, 400, cors);
      }
      if (plan === "quarterly" && !PRICE_ID.test(price)) return json({ error: "plan_unavailable", message: "The quarterly plan isn't available yet. Choose monthly or yearly." }, 400, cors);
      if (!PRICE_ID.test(price)) throw new Error("checkout is not configured");
    }
    const siteUrl = String(cfgVal("site_url") || "");
    const origins = allowedOrigins(d.env, siteUrl);
    if (!origins.length) throw new Error("no allowed site origin is set (SITE_ORIGINS or studyboard_config site_url)");
    if (reqOrigin && (origins.includes(reqOrigin) || appOrigins.includes(reqOrigin))) cors["Access-Control-Allow-Origin"] = reqOrigin;
    const src = body.src === "app" ? "&src=app" : "";
    const managed = d.env("STRIPE_MANAGED_PAYMENTS") === "1";

    // The Stripe customer for this account
    const customerFor = async (): Promise<string> => {
      let customer = ((await (await rest(`studyboard_billing_customers?user_id=eq.${uid}&select=stripe_customer_id`)).json()) as any[])[0]?.stripe_customer_id as string | undefined;
      if (!customer) {
        const created = await stripe(d, "customers", { email: user.email, metadata: { uid } }, `sb-customer-${uid}`);
        customer = String(created.id);
        await rest("studyboard_billing_customers?on_conflict=user_id", { method: "POST", headers: { Prefer: "resolution=ignore-duplicates,return=minimal" }, body: JSON.stringify({ user_id: uid, stripe_customer_id: customer }) });
        customer = ((await (await rest(`studyboard_billing_customers?user_id=eq.${uid}&select=stripe_customer_id`)).json()) as any[])[0]?.stripe_customer_id || customer;
      }
      return customer!;
    };

    // Credits: a one-time payment for a pack. The pack's credits and Stripe price come from studyboard_credit_packs
    if (packId) {
      if (cfgVal("item_purchases") !== true) return json({ error: "plan_unavailable", message: "Credits aren't available yet." }, 400, cors);
      const pack = ((await (await rest(`studyboard_credit_packs?pack_id=eq.${packId}&active=eq.true&select=pack_id,credits,stripe_price_id`)).json()) as any[])[0];
      if (!pack || !PRICE_ID.test(String(pack.stripe_price_id || ""))) return json({ error: "plan_unavailable", message: "That credit pack isn't available. Choose another one." }, 400, cors);
      const meta = { uid, kind: "credits", pack: pack.pack_id };
      const session = await stripe(d, "checkout/sessions", {
        mode: "payment",
        customer: await customerFor(),
        client_reference_id: uid,
        metadata: meta,
        payment_intent_data: { metadata: meta, description: `Studyboard: ${pack.credits} credits` },
        line_items: { 0: { price: pack.stripe_price_id, quantity: 1 } },
        success_url: safeReturn(body.success_url, origins, "/success.html", local, `?session_id={CHECKOUT_SESSION_ID}&kind=credits${src}`),
        cancel_url: safeReturn(body.cancel_url, origins, "/cancel.html", local, src ? "?src=app" : ""),
        ...(managed ? { managed_payments: { enabled: "true" } } : {}),
      }, undefined, managed ? MANAGED_PAYMENTS_VERSION : undefined);
      if (typeof session.url !== "string" || !/^https:\/\/checkout\.stripe\.com\//.test(session.url)) throw new Error("no checkout url");
      return json({ url: session.url }, 200, cors);
    }

    // No card trial at checkout by default
    const trialDays = Math.min(30, Math.max(0, Number((cfgVal("prices") as any)?.checkoutTrialDays ?? 0) || 0));

    const ent = ((await (await rest(`studyboard_entitlements?user_id=eq.${uid}&select=plan,pro_until,trial_until,external_id,source,will_renew`)).json()) as any[])[0] || null;
    const live = ent && ent.plan === "pro" && (ent.pro_until === null || Date.parse(ent.pro_until) > d.now());
    if (live && ent.source === "stripe" && ent.will_renew) return json({ error: "already_subscribed", message: "You already have an active Studyboard Pro subscription. Use Manage billing to change it." }, 409, cors);
    if (ent && ent.plan === "lifetime") return json({ error: "already_subscribed", message: "You already have Studyboard Pro for good." }, 409, cors);

    const customer = await customerFor();

    // A free trial only for accounts that never had one
    let hadTrial = !!(ent && (ent.trial_until || ent.external_id || ent.source === "stripe"));
    if (!hadTrial && trialDays > 0) hadTrial = await trialUsed(d, h, user.email);
    const session = await stripe(d, "checkout/sessions", {
      mode: "subscription",
      customer,
      client_reference_id: uid,
      metadata: { uid, plan },
      line_items: { 0: { price, quantity: 1 } },
      subscription_data: { metadata: { uid, plan }, ...(trialDays > 0 && !hadTrial ? { trial_period_days: trialDays } : {}) },
      allow_promotion_codes: "true",
      success_url: safeReturn(body.success_url, origins, "/success.html", local, `?session_id={CHECKOUT_SESSION_ID}${src}`),
      cancel_url: safeReturn(body.cancel_url, origins, "/cancel.html", local, src ? "?src=app" : ""),
      ...(managed ? { managed_payments: { enabled: "true" } } : {}),
    }, undefined, managed ? MANAGED_PAYMENTS_VERSION : undefined);
    if (typeof session.url !== "string" || !/^https:\/\/checkout\.stripe\.com\//.test(session.url)) throw new Error("no checkout url");
    return json({ url: session.url }, 200, cors);
  } catch (err) {
    d.log("create-checkout failed", err instanceof Error ? err.message : "error");
    return json({ error: "server error", message: "Something went wrong starting checkout. Please try again." }, 500, cors);
  }
}

const g = globalThis as any;
if (g.Deno?.serve) {
  const env: Env = k => g.Deno.env.get(k) ?? "";
  g.Deno.serve((req: Request) => handle(req, { env, fetch, now: Date.now, log: console.error }));
}
