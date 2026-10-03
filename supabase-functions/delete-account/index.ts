// Studyboard: delete-account (Supabase Edge Function)
// Permanently deletes the signed-in person's account and everything stored for it, on the server (Apple 5.1.1(v), Google Play account deletion).
// Steps, in this order (every step is safe to repeat, so a failed attempt can simply be tried again):
//   1. check who is asking (their own sign-in), that they signed in recently (or re-typed their password) and typed DELETE
//   2. rate limit (5 tries an hour per account)
//   3. cancel their Stripe subscription(s) (stops if Stripe fails, so billing is never left running for a deleted account);
//      Apple / Google subscriptions can only be cancelled by the person in the store, so we require them to acknowledge that
//   4. delete every uploaded file under <uid>/ in the studioso-files bucket (the bytes, not just the database rows)
//   5. studyboard_delete_user_data(uid): the database rows (see supabase-lean.sql for the rules: groups are handed over or deleted, etc.)
//   6. delete the sign-in account itself (this also ends every session on every device)
// Returns {ok: true, deleted: {...checklist...}, retained: [...]}.
//
// Deploy with "Verify JWT" turned ON. Secrets: STRIPE_SECRET_KEY (the one the billing functions use; optional if you never took card payments),
// SITE_ORIGINS (same as create-checkout; must include the web address the app is served from).
// Needs supabase-lean.sql (studyboard_delete_user_data) and supabase-plans.sql (studyboard_plan_rate_hit) to be run first.

type Env = (k: string) => string;
type Deps = { env: Env; fetch: typeof fetch; now: () => number; log: (...a: unknown[]) => void };

const BUCKET = "studioso-files";
const RATE_MAX = 5, RATE_WINDOW = 3600;
const RECENT_SIGNIN_MS = 10 * 60 * 1000;
const MAX_FILES = 20000;

const json = (o: unknown, status: number, cors: Record<string, string>, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(o), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...cors, ...extra } });
function serviceKey(d: Deps): string {
  let key = d.env("SUPABASE_SERVICE_ROLE_KEY");
  if (!key) { try { const k = JSON.parse(d.env("SUPABASE_SECRET_KEYS") || "{}"); key = String(k.default || Object.values(k)[0] || ""); } catch (_e) { /* newer projects only */ } }
  return key;
}
const base = (d: Deps) => d.env("SUPABASE_URL").replace(/\/+$/, "");
function originOf(u: string): string | null {
  try { const x = new URL(u); return x.protocol === "https:" && !x.username && !x.password ? x.origin : null; } catch (_e) { return null; }
}
const NATIVE_ORIGINS = ["capacitor://localhost", "ionic://localhost"];

export async function handle(req: Request, d: Deps): Promise<Response> {
  const allowed = [...new Set([...d.env("SITE_ORIGINS").split(",").map(s => originOf(s.trim())).filter((o): o is string => !!o), ...NATIVE_ORIGINS])];
  const reqOrigin = req.headers.get("origin") || "";
  const cors: Record<string, string> = {
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Max-Age": "600", Vary: "Origin",
  };
  if (reqOrigin && allowed.includes(reqOrigin)) cors["Access-Control-Allow-Origin"] = reqOrigin;
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405, cors);
  try {
    const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
    if (!token) return json({ error: "sign_in_first", message: "Sign in first." }, 401, cors);
    const key = serviceKey(d), anon = d.env("SUPABASE_ANON_KEY") || key;
    const ur = await d.fetch(`${base(d)}/auth/v1/user`, { headers: { apikey: anon, Authorization: `Bearer ${token}` } });
    if (!ur.ok) return json({ error: "sign_in_first", message: "Sign in first." }, 401, cors);
    const user = await ur.json().catch(() => null) as { id?: string; email?: string; last_sign_in_at?: string } | null;
    if (!user?.id || !/^[0-9a-f-]{36}$/i.test(user.id)) return json({ error: "sign_in_first", message: "Sign in first." }, 401, cors);
    const uid = user.id.toLowerCase();

    const text = await req.text();
    const body = (() => { try { return JSON.parse(text.length <= 4096 ? text || "{}" : "{}"); } catch (_e) { return {}; } })() as { confirm?: unknown; password?: unknown; ack_store_subscription?: unknown };
    if (String(body.confirm ?? "").trim().toUpperCase() !== "DELETE") {
      return json({ error: "confirm_required", message: "Type DELETE to confirm." }, 400, cors);
    }

    const h = { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
    const rest = async (path: string, init: RequestInit = {}) => {
      const r = await d.fetch(`${base(d)}/rest/v1/${path}`, { ...init, headers: { ...h, ...(init.headers || {}) } });
      if (!r.ok) throw new Error(`db ${path.split("?")[0]} ${r.status}`);
      return r;
    };

    // Rate limit first, so password guessing through this door is capped too
    const rl = await (await rest("rpc/studyboard_plan_rate_hit", { method: "POST", body: JSON.stringify({ p_key: `delete:${uid}`, p_max: RATE_MAX, p_window: RATE_WINDOW }) })).json();
    if (rl !== true) return json({ error: "rate_limited", message: "Too many tries. Please wait a little and try again." }, 429, cors, { "Retry-After": "900" });

    // Re-authentication: a sign-in in the last 10 minutes (last_sign_in_at; the token's iat is renewed by every refresh, so it proves nothing), or the password right now
    const last = Date.parse(String(user.last_sign_in_at || ""));
    const recent = Number.isFinite(last) && d.now() - last >= -60_000 && d.now() - last <= RECENT_SIGNIN_MS;
    if (!recent) {
      const pw = typeof body.password === "string" ? body.password : "";
      if (!pw || pw.length > 1024 || !user.email) {
        return json({ error: "reauth_required", message: "For your security, enter your password, or sign out and sign in again, then try again." }, 403, cors);
      }
      const pr = await d.fetch(`${base(d)}/auth/v1/token?grant_type=password`, { method: "POST", headers: { apikey: anon, "Content-Type": "application/json" }, body: JSON.stringify({ email: user.email, password: pw }) });
      if (!pr.ok) return json({ error: "wrong_password", message: "That password isn't right." }, 403, cors);
    }

    const done: Record<string, unknown> = {};

    // What plan do they pay for, and where?
    const ent = ((await (await rest(`studyboard_entitlements?user_id=eq.${uid}&select=plan,pro_until,source,external_id,will_renew`)).json()) as any[])[0] || null;
    let customer = ((await (await rest(`studyboard_billing_customers?user_id=eq.${uid}&select=stripe_customer_id`)).json()) as any[])[0]?.stripe_customer_id as string | undefined;
    if (!customer && ent?.source === "stripe" && /^cus_[A-Za-z0-9]+$/.test(String(ent.external_id || ""))) customer = ent.external_id;
    const paidActive = !!ent && ent.plan === "pro" && (!ent.pro_until || Date.parse(ent.pro_until) > d.now());
    const storeSub = !!ent && ["apple", "google", "revenuecat"].includes(String(ent.source)) && paidActive && ent.will_renew !== false;
    if (storeSub && body.ack_store_subscription !== true) {
      return json({
        error: "store_subscription",
        message: "Your Pro plan is billed by the App Store or Google Play. Deleting your account does not cancel it. Cancel it in your store account first (iPhone: Settings > your name > Subscriptions, or https://apps.apple.com/account/subscriptions), then confirm to continue.",
        manage_url: "https://apps.apple.com/account/subscriptions",
      }, 409, cors);
    }

    // 3. Stripe: cancel now. If Stripe fails we stop so billing is never left running for an account that no longer exists.
    if (customer && /^cus_[A-Za-z0-9]+$/.test(customer) && d.env("STRIPE_SECRET_KEY")) {
      const sh = { Authorization: `Bearer ${d.env("STRIPE_SECRET_KEY")}` };
      const lr = await d.fetch(`https://api.stripe.com/v1/subscriptions?customer=${encodeURIComponent(customer)}&status=all&limit=100`, { headers: sh });
      if (!lr.ok) throw new Error(`stripe list ${lr.status}`);
      const subs = ((await lr.json()) as { data?: { id: string; status: string }[] }).data || [];
      let cancelled = 0;
      for (const s of subs) {
        if (!/^sub_[A-Za-z0-9]+$/.test(s.id) || ["canceled", "incomplete_expired"].includes(s.status)) continue;
        const cr = await d.fetch(`https://api.stripe.com/v1/subscriptions/${encodeURIComponent(s.id)}`, { method: "DELETE", headers: sh });
        if (!cr.ok && cr.status !== 404) throw new Error(`stripe cancel ${cr.status}`);
        cancelled++;
      }
      done.stripe_subscriptions_cancelled = cancelled;
    } else if (customer) {
      done.stripe_subscriptions_cancelled = "skipped: STRIPE_SECRET_KEY not set";
    } else done.stripe_subscriptions_cancelled = 0;
    done.store_subscription_notice = storeSub;

    // 4. Files: the bytes in storage, not only the rows
    const sh2 = { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
    const files: string[] = [];
    const walk = async (prefix: string, depth: number): Promise<void> => {
      for (let off = 0; off < MAX_FILES && files.length < MAX_FILES; off += 100) {
        const r = await d.fetch(`${base(d)}/storage/v1/object/list/${BUCKET}`, { method: "POST", headers: sh2, body: JSON.stringify({ prefix, limit: 100, offset: off }) });
        if (!r.ok) throw new Error(`storage list ${r.status}`);
        const rows = await r.json() as { id?: string | null; name: string }[];
        if (!Array.isArray(rows) || !rows.length) break;
        for (const o of rows) {
          if (o.id === null || o.id === undefined) { if (depth < 5) await walk(`${prefix}/${o.name}`, depth + 1); }
          else files.push(`${prefix}/${o.name}`);
        }
        if (rows.length < 100) break;
      }
    };
    await walk(uid, 0);
    for (let i = 0; i < files.length; i += 100) {
      const r = await d.fetch(`${base(d)}/storage/v1/object/${BUCKET}`, { method: "DELETE", headers: sh2, body: JSON.stringify({ prefixes: files.slice(i, i + 100) }) });
      if (!r.ok) throw new Error(`storage remove ${r.status}`);
    }
    done.files_deleted = files.length;

    // 5. Database rows
    const dr = await rest("rpc/studyboard_delete_user_data", { method: "POST", body: JSON.stringify({ p_uid: uid }) });
    done.data = await dr.json().catch(() => ({}));

    // 6. The sign-in account (ends all sessions on all devices)
    const ar = await d.fetch(`${base(d)}/auth/v1/admin/users/${uid}`, { method: "DELETE", headers: h });
    if (!ar.ok && ar.status !== 404) throw new Error(`auth delete ${ar.status}`);
    done.account = true;
    done.sessions_revoked = true;

    return json({
      ok: true, deleted: done,
      retained: [
        "Payment records stay with Stripe, Apple or Google as required by tax and accounting law. We do not receive card numbers.",
        "Backups: encrypted database backups keep a copy for up to 30 days, then it is overwritten. Nothing is restored for a deleted account.",
        "Reports about abuse in study groups stay without any link to your account.",
      ],
    }, 200, cors);
  } catch (err) {
    d.log("delete-account failed", err instanceof Error ? err.message : "error");
    return json({ error: "server_error", message: "Something went wrong deleting the account. Nothing more was changed than what is listed in the app; please try again, and email support if it keeps failing." }, 500, cors);
  }
}
const g = globalThis as any;
if (g.Deno?.serve) {
  const env: Env = k => g.Deno.env.get(k) ?? "";
  g.Deno.serve((req: Request) => handle(req, { env, fetch, now: Date.now, log: console.error }));
}
