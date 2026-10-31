// Studyboard: delete-account

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
  if (!key) { try { const k = JSON.parse(d.env("SUPABASE_SECRET_KEYS") || "{}"); key = String(k.default || Object.values(k)[0] || ""); } catch (_e) { } }
  return key;
}
const base = (d: Deps) => d.env("SUPABASE_URL").replace(/\/+$/, "");
function originOf(u: string): string | null {
  try { const x = new URL(u); return x.protocol === "https:" && !x.username && !x.password ? x.origin : null; } catch (_e) { return null; }
}
// Sign in with Apple: when an account that used it is deleted, Apple requires the app to revoke it
// (https://developer.apple.com/documentation/sign_in_with_apple/revoke_tokens). Apple's refresh token is kept from the
// iPhone app's sign-in (POST /delete-account/apple-token, from Apple's one-time code) and revoked here before anything is
// deleted; the iPhone app can also send a fresh code with the deletion. Secrets: APPLE_TEAM_ID, APPLE_SIGNIN_KEY_ID,
// APPLE_SIGNIN_PRIVATE_KEY (the Sign in with Apple .p8 key's text), APPLE_BUNDLE_ID, and APPLE_SERVICES_ID for web sign-ins.
const b64url = (b: Uint8Array | string) => btoa(typeof b === "string" ? b : String.fromCharCode(...b)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
export async function appleClientSecret(d: Deps, clientId: string): Promise<string> {
  const pem = d.env("APPLE_SIGNIN_PRIVATE_KEY").replace(/\\n/g, "\n");
  const der = Uint8Array.from(atob(pem.replace(/-----[^-]+-----/g, "").replace(/\s+/g, "")), c => c.charCodeAt(0));
  const key = await crypto.subtle.importKey("pkcs8", der, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const iat = Math.floor(d.now() / 1000);
  const head = b64url(JSON.stringify({ alg: "ES256", kid: d.env("APPLE_SIGNIN_KEY_ID") }));
  const body = b64url(JSON.stringify({ iss: d.env("APPLE_TEAM_ID"), iat, exp: iat + 600, aud: "https://appleid.apple.com", sub: clientId }));
  const sig = new Uint8Array(await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, new TextEncoder().encode(`${head}.${body}`)));
  return `${head}.${body}.${b64url(sig)}`;
}
const appleReady = (d: Deps) => !!(d.env("APPLE_SIGNIN_PRIVATE_KEY") && d.env("APPLE_SIGNIN_KEY_ID") && d.env("APPLE_TEAM_ID") && d.env("APPLE_BUNDLE_ID"));
const form = (o: Record<string, string>) => Object.entries(o).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join("&");
// Apple's one-time code (from the iPhone app's sign-in) for a refresh token
export async function appleExchange(d: Deps, code: string, clientId: string): Promise<string | null> {
  const r = await d.fetch("https://appleid.apple.com/auth/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form({ client_id: clientId, client_secret: await appleClientSecret(d, clientId), code, grant_type: "authorization_code" }) });
  if (!r.ok) { d.log("apple token exchange", r.status); return null; }
  const j = await r.json().catch(() => null) as { refresh_token?: string } | null;
  return typeof j?.refresh_token === "string" ? j.refresh_token : null;
}
export async function appleRevoke(d: Deps, token: string, clientId: string): Promise<boolean> {
  const r = await d.fetch("https://appleid.apple.com/auth/revoke", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form({ client_id: clientId, client_secret: await appleClientSecret(d, clientId), token, token_type_hint: "refresh_token" }) });
  if (!r.ok) d.log("apple revoke", r.status);
  return r.ok;
}
const appleCode = (v: unknown) => typeof v === "string" && /^[A-Za-z0-9._-]{10,1000}$/.test(v) ? v : "";

// The app's own origins
const NATIVE_ORIGINS = ["app://studioso", "capacitor://localhost", "ionic://localhost", "https://localhost"];

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
    const body = (() => { try { return JSON.parse(text.length <= 4096 ? text || "{}" : "{}"); } catch (_e) { return {}; } })() as { confirm?: unknown; password?: unknown; ack_store_subscription?: unknown; apple_code?: unknown; code?: unknown };

    // After Sign in with Apple in the iPhone app: keep Apple's refresh token, for revoking it if the account is deleted
    if (new URL(req.url).pathname.replace(/\/+$/, "").endsWith("/apple-token")) {
      const code = appleCode(body.code);
      if (!code) return json({ error: "bad request" }, 400, cors);
      if (!appleReady(d)) return json({ ok: false, skipped: "apple keys not set" }, 200, cors);
      const k2 = serviceKey(d), clientId = d.env("APPLE_BUNDLE_ID");
      const refresh = await appleExchange(d, code, clientId);
      if (!refresh) return json({ ok: false }, 200, cors);
      const sr = await d.fetch(`${base(d)}/rest/v1/studyboard_apple_signin?on_conflict=user_id`, { method: "POST",
        headers: { apikey: k2, Authorization: `Bearer ${k2}`, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify({ user_id: uid, refresh_token: refresh, client_id: clientId, updated_at: new Date(d.now()).toISOString() }) });
      return json({ ok: sr.ok }, 200, cors);
    }
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

    // Re-authentication
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

    // What plan do they pay for, and where
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

    // 3. Stripe: cancel now
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
      const xr = await d.fetch(`https://api.stripe.com/v1/customers/${encodeURIComponent(customer)}`, { method: "DELETE", headers: sh });
      done.stripe_customer_deleted = xr.ok || xr.status === 404;
      if (!done.stripe_customer_deleted) d.log("stripe customer delete", xr.status);
    } else if (customer) {
      done.stripe_subscriptions_cancelled = "skipped: STRIPE_SECRET_KEY not set";
    } else done.stripe_subscriptions_cancelled = 0;
    done.store_subscription_notice = storeSub;

    // 3b. Sign in with Apple, revoked with Apple (a fresh code from the iPhone app, else the token kept at sign-in)
    if (appleReady(d)) {
      let revoked = false;
      const fresh = appleCode(body.apple_code);
      if (fresh) { const t = await appleExchange(d, fresh, d.env("APPLE_BUNDLE_ID")); if (t) revoked = await appleRevoke(d, t, d.env("APPLE_BUNDLE_ID")); }
      const kept = ((await (await rest(`studyboard_apple_signin?user_id=eq.${uid}&select=refresh_token,client_id`)).json()) as any[])[0];
      if (kept?.refresh_token) revoked = (await appleRevoke(d, kept.refresh_token, kept.client_id || d.env("APPLE_BUNDLE_ID"))) || revoked;
      done.apple_signin_revoked = revoked || (fresh || kept ? false : "not used");
    }

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
          if (o.id === null || o.id === undefined) { if (depth < 32) await walk(`${prefix}/${o.name}`, depth + 1); }
          else files.push(`${prefix}/${o.name}`);
        }
        if (rows.length < 100) break;
      }
    };
    // More than MAX_FILES (or folders deeper than the walk)
    let removed = 0;
    for (let round = 0; round < 50; round++) {
      files.length = 0;
      await walk(uid, 0);
      for (let i = 0; i < files.length; i += 100) {
        const r = await d.fetch(`${base(d)}/storage/v1/object/${BUCKET}`, { method: "DELETE", headers: sh2, body: JSON.stringify({ prefixes: files.slice(i, i + 100) }) });
        if (!r.ok) throw new Error(`storage remove ${r.status}`);
      }
      removed += files.length;
      if (files.length < MAX_FILES) break;
    }
    done.files_deleted = removed;

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
