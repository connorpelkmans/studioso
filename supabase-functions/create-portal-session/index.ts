// Studyboard Pro: create-portal-session (Supabase Edge Function)
// Opens the Stripe customer portal (change card, cancel, invoices) for the person who is signed in, and only for their own customer.
// Returns {url}. The website's "Manage billing" button calls it.
//
// Deploy with "Verify JWT" turned ON. Secrets: STRIPE_SECRET_KEY, SITE_ORIGINS (same as create-checkout).
// Optional: STRIPE_PORTAL_CONFIG (a bpc_... id) to pick a specific portal setup. Set up the portal first in Stripe > Settings > Billing > Customer portal.

type Env = (k: string) => string;
type Deps = { env: Env; fetch: typeof fetch; now: () => number; log: (...a: unknown[]) => void };

const RATE_MAX = 20, RATE_WINDOW = 3600;
const PATH_OK = /^\/[A-Za-z0-9_./-]{0,120}$/;
const PATH_OR_OK = (p: string) => PATH_OK.test(p) && !p.includes("..");

const json = (o: unknown, status: number, cors: Record<string, string>, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(o), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...cors, ...extra } });
function serviceKey(d: Deps): string {
  let key = d.env("SUPABASE_SERVICE_ROLE_KEY");
  if (!key) { try { const k = JSON.parse(d.env("SUPABASE_SECRET_KEYS") || "{}"); key = String(k.default || Object.values(k)[0] || ""); } catch (_e) { /* newer projects only */ } }
  return key;
}
const base = (d: Deps) => d.env("SUPABASE_URL").replace(/\/+$/, "");

function originOf(u: string, allowLocalhost: boolean): string | null {
  try {
    const x = new URL(u);
    const local = allowLocalhost && x.protocol === "http:" && (x.hostname === "localhost" || x.hostname === "127.0.0.1");
    if (x.protocol !== "https:" && !local) return null;
    if (x.username || x.password) return null;
    return x.origin;
  } catch (_e) { return null; }
}
function origins(env: Env, siteUrl: string): string[] {
  const local = env("ALLOW_LOCALHOST") === "1";
  return [...new Set([...env("SITE_ORIGINS").split(","), siteUrl].map(s => s.trim()).filter(Boolean).map(s => originOf(s, local)).filter((o): o is string => !!o))];
}

export async function handle(req: Request, d: Deps): Promise<Response> {
  const local = d.env("ALLOW_LOCALHOST") === "1";
  const envOrigins = origins(d.env, "");
  const reqOrigin = req.headers.get("origin") || "";
  const cors: Record<string, string> = {
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Max-Age": "600", Vary: "Origin",
  };
  if (reqOrigin && envOrigins.includes(reqOrigin)) cors["Access-Control-Allow-Origin"] = reqOrigin;
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405, cors);
  try {
    const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
    if (!token) return json({ error: "sign in first" }, 401, cors);
    const key = serviceKey(d);
    const ur = await d.fetch(`${base(d)}/auth/v1/user`, { headers: { apikey: d.env("SUPABASE_ANON_KEY") || key, Authorization: `Bearer ${token}` } });
    if (!ur.ok) return json({ error: "sign in first" }, 401, cors);
    const user = await ur.json().catch(() => null) as { id?: string } | null;
    if (!user?.id || !/^[0-9a-f-]{36}$/i.test(user.id)) return json({ error: "sign in first" }, 401, cors);
    const uid = user.id.toLowerCase();

    const h = { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
    const rest = async (path: string, init: RequestInit = {}) => {
      const r = await d.fetch(`${base(d)}/rest/v1/${path}`, { ...init, headers: { ...h, ...(init.headers || {}) } });
      if (!r.ok) throw new Error(`db ${path.split("?")[0]} ${r.status}`);
      return r;
    };
    const rl = await (await rest("rpc/studyboard_plan_rate_hit", { method: "POST", body: JSON.stringify({ p_key: `portal:${uid}`, p_max: RATE_MAX, p_window: RATE_WINDOW }) })).json();
    if (rl !== true) return json({ error: "rate_limited", message: "Too many tries. Please wait a little and try again." }, 429, cors, { "Retry-After": "900" });

    const text = await req.text();
    const body = (() => { try { return JSON.parse(text.length <= 4096 ? text || "{}" : "{}"); } catch (_e) { return {}; } })() as { return_url?: unknown };
    const cfg = await (await rest("studyboard_config?key=eq.site_url&select=value")).json() as { value: unknown }[];
    const allowed = origins(d.env, String(cfg[0]?.value || ""));
    if (!allowed.length) throw new Error("no allowed site origin is set");
    if (reqOrigin && allowed.includes(reqOrigin)) cors["Access-Control-Allow-Origin"] = reqOrigin;
    let ret = allowed[0] + "/account/";
    if (typeof body.return_url === "string" && body.return_url.length <= 500) {
      const o = originOf(body.return_url, local);
      const p = o ? new URL(body.return_url).pathname : "";
      if (o && allowed.includes(o) && PATH_OR_OK(p)) ret = o + p;
    }

    // Only this person's own Stripe customer (the one create-checkout made, or the one the older payment link flow recorded)
    let customer = ((await (await rest(`studyboard_billing_customers?user_id=eq.${uid}&select=stripe_customer_id`)).json()) as any[])[0]?.stripe_customer_id as string | undefined;
    if (!customer) {
      const e = ((await (await rest(`studyboard_entitlements?user_id=eq.${uid}&source=eq.stripe&select=external_id`)).json()) as any[])[0];
      if (e?.external_id && /^cus_[A-Za-z0-9]+$/.test(e.external_id)) customer = e.external_id;
    }
    if (!customer) return json({ error: "no_billing", message: "There is no card subscription on this account yet." }, 404, cors);

    const params = new URLSearchParams({ customer, return_url: ret });
    const conf = d.env("STRIPE_PORTAL_CONFIG");
    if (/^bpc_[A-Za-z0-9]+$/.test(conf)) params.set("configuration", conf);
    const r = await d.fetch("https://api.stripe.com/v1/billing_portal/sessions", {
      method: "POST", headers: { Authorization: `Bearer ${d.env("STRIPE_SECRET_KEY")}`, "Content-Type": "application/x-www-form-urlencoded" }, body: params.toString(),
    });
    if (!r.ok) { const e = await r.json().catch(() => ({})) as { error?: { code?: string; message?: string } }; throw new Error(`stripe portal ${r.status} ${e.error?.code || ""} ${String(e.error?.message || "").slice(0, 200)}`.trim()); }   // Stripe's reason goes to the function log only (it never holds a key)
    const s = await r.json() as { url?: string };
    if (typeof s.url !== "string" || !/^https:\/\/billing\.stripe\.com\//.test(s.url)) throw new Error("no portal url");
    return json({ url: s.url }, 200, cors);
  } catch (err) {
    d.log("create-portal-session failed", err instanceof Error ? err.message : "error");
    return json({ error: "server error", message: "Something went wrong opening billing. Please try again." }, 500, cors);
  }
}
const g = globalThis as any;
if (g.Deno?.serve) {
  const env: Env = k => g.Deno.env.get(k) ?? "";
  g.Deno.serve((req: Request) => handle(req, { env, fetch, now: Date.now, log: console.error }));
}
