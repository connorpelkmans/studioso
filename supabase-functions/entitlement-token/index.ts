// Studyboard Pro: entitlement-token (Supabase Edge Function)
// Gives the app a short-lived, SIGNED proof of the person's plan: {tier, exp, uid, iat, sig}.
// The app checks the signature with the public key baked into it (ENT_PUBKEY), so a person can't just edit local storage to get Pro,
// and Pro keeps working offline until "exp". The server decides everything; the app only asks.
//
// Signed text (UTF-8):   studyboard-ent-v1|<uid>|<tier>|<exp>|<iat>        (exp and iat are whole unix seconds)
// sig = Ed25519 signature of that text, base64url without padding.
//
// Deploy with "Verify JWT" turned ON (the person must be signed in). Secrets: ENT_SIGNING_KEY (from tools/gen-ent-key.mjs).
// Supabase adds SUPABASE_URL, SUPABASE_ANON_KEY and the service key by itself.
//
// Tiers:      free | pro | trial (while trialing) | lifetime (Pro for good). The app rejects a token lasting more than 8 days.
// Lifetimes:  paid or granted Pro: up to 7 days, but never past the end of the paid time (the stored end already includes the 3 day grace).
//             trial: up to 2 days (so cancelling or ending a trial is noticed fast).   free: 1 day.
// The response also carries the server's clock in the "X-Server-Time" header (unix seconds) and the standard Date header, so the app
// can notice if the device's clock was set back to stretch a token.

type Env = (k: string) => string;
type Deps = { env: Env; fetch: typeof fetch; now: () => number; log: (...a: unknown[]) => void };
type Row = { plan?: string; pro_until?: string | null; trial_until?: string | null; grant_until?: string | null; grant_lifetime?: boolean };

const DAY = 86400;
const PRO_TTL = 7 * DAY, TRIAL_TTL = 2 * DAY, FREE_TTL = 1 * DAY;
const RATE_MAX = 40, RATE_WINDOW = 3600;   // token requests per person per hour (the app asks at start-up and now and then)

const CORS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",   // the app runs on many origins; auth is a bearer token, never a cookie
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Expose-Headers": "X-Server-Time, Date",
  "Access-Control-Max-Age": "600",
};
const reply = (o: unknown, status: number, nowS: number, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(o), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store", "X-Server-Time": String(nowS), ...CORS, ...extra } });

function serviceKey(d: Deps): string {
  let key = d.env("SUPABASE_SERVICE_ROLE_KEY");
  if (!key) { try { const k = JSON.parse(d.env("SUPABASE_SECRET_KEYS") || "{}"); key = String(k.default || Object.values(k)[0] || ""); } catch (_e) { /* newer projects only */ } }
  return key;
}
const base = (d: Deps) => d.env("SUPABASE_URL").replace(/\/+$/, "");

// Who is calling? Ask Supabase Auth itself (this also notices deleted accounts and revoked sessions).
async function whoIs(d: Deps, token: string): Promise<string | null> {
  const r = await d.fetch(`${base(d)}/auth/v1/user`, { headers: { apikey: d.env("SUPABASE_ANON_KEY") || serviceKey(d), Authorization: `Bearer ${token}` } });
  if (!r.ok) return null;
  const u = await r.json().catch(() => null) as { id?: string } | null;
  return u?.id && /^[0-9a-f-]{36}$/i.test(u.id) ? u.id.toLowerCase() : null;
}

// Pure: what plan, and until when (unix seconds). Exported for tests.
// tier: "lifetime" (Pro for good: a grant with no end, or paid Pro for good), "pro" (paid or granted with an end), "trial" (while trialing), "free".
export type Tier = "free" | "pro" | "trial" | "lifetime";
export function computeTier(row: Row | null, nowS: number): { tier: Tier; exp: number } {
  const ms = (v?: string | null) => (v ? Math.floor(Date.parse(v) / 1000) : NaN);
  if (!row) return { tier: "free", exp: nowS + FREE_TTL };
  const until = ms(row.pro_until), trial = ms(row.trial_until), grant = ms(row.grant_until);
  const lifetime = row.plan === "lifetime" || !!row.grant_lifetime;
  const paid = row.plan === "pro" && (row.pro_until == null || until > nowS);
  const granted = grant > nowS;
  const trialing = trial > nowS;
  const ends: number[] = [];
  if (lifetime) ends.push(nowS + PRO_TTL);
  if (paid) ends.push(Math.min(nowS + PRO_TTL, row.pro_until == null ? Infinity : until));
  if (granted) ends.push(Math.min(nowS + PRO_TTL, grant));
  if (trialing) ends.push(Math.min(nowS + TRIAL_TTL, trial));
  if (!ends.length) return { tier: "free", exp: nowS + FREE_TTL };
  const tier: Tier = lifetime ? "lifetime" : granted || (paid && !trialing) ? "pro" : "trial";
  return { tier, exp: Math.max(...ends) };
}

// The private key is PKCS8 DER written as base64url (standard base64 is accepted too).
const b64 = (s: string) => Uint8Array.from(atob(s.trim().replace(/-/g, "+").replace(/_/g, "/").replace(/\s+/g, "")), c => c.charCodeAt(0));
const b64url = (buf: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
let cached: { raw: string; key: CryptoKey } | null = null;
async function signingKey(raw: string): Promise<CryptoKey> {
  if (cached && cached.raw === raw) return cached.key;
  const key = await crypto.subtle.importKey("pkcs8", b64(raw), { name: "Ed25519" }, false, ["sign"]);
  cached = { raw, key };
  return key;
}
export async function signToken(privateKeyB64: string, uid: string, tier: string, exp: number, iat: number): Promise<string> {
  const key = await signingKey(privateKeyB64);
  return b64url(await crypto.subtle.sign({ name: "Ed25519" }, key, new TextEncoder().encode(`studyboard-ent-v1|${uid}|${tier}|${exp}|${iat}`)));
}

export async function handle(req: Request, d: Deps): Promise<Response> {
  const nowS = Math.floor(d.now() / 1000);
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (req.method !== "GET" && req.method !== "POST") return reply({ error: "method not allowed" }, 405, nowS);
  try {
    const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
    if (!token) return reply({ error: "sign in first" }, 401, nowS);
    const uid = await whoIs(d, token);
    if (!uid) return reply({ error: "sign in first" }, 401, nowS);
    const key = serviceKey(d);
    const h = { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };

    const rl = await d.fetch(`${base(d)}/rest/v1/rpc/studyboard_plan_rate_hit`, { method: "POST", headers: h, body: JSON.stringify({ p_key: `token:${uid}`, p_max: RATE_MAX, p_window: RATE_WINDOW }) });
    if (!rl.ok) throw new Error(`rate check failed ${rl.status}`);
    if ((await rl.json()) !== true) return reply({ error: "too many requests, try again later" }, 429, nowS, { "Retry-After": "600" });

    const r = await d.fetch(`${base(d)}/rest/v1/studyboard_entitlements?user_id=eq.${encodeURIComponent(uid)}&select=plan,pro_until,trial_until,grant_until,grant_lifetime`, { headers: h });
    if (!r.ok) throw new Error(`read failed ${r.status}`);
    const row = ((await r.json()) as Row[])[0] || null;

    const { tier, exp } = computeTier(row, nowS);
    const sig = await signToken(d.env("ENT_SIGNING_KEY"), uid, tier, exp, nowS);
    return reply({ tier, exp, uid, iat: nowS, sig }, 200, nowS);
  } catch (err) {
    d.log("entitlement-token failed", err instanceof Error ? err.message : "error");
    return reply({ error: "server error, please retry" }, 500, nowS);
  }
}

const g = globalThis as any;
if (g.Deno?.serve) {
  const env: Env = k => g.Deno.env.get(k) ?? "";
  g.Deno.serve((req: Request) => handle(req, { env, fetch, now: Date.now, log: console.error }));
}
