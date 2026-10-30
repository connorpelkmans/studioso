// Studyboard: Apple's reporting for the EU website-purchase link (External Purchases or Offers, from October 1, 2026)
//
// POST /apple-external/tokens   from the iPhone app, signed in: {tokens: ["<Apple token>", ...], tap: bool, storefront: "DEU"}
//                               Apple's tokens are tied to the account (Apple asks for this at launch and before each purchase)
// POST /apple-external/report   the daily job (header x-report-secret = APPLE_REPORT_SECRET): sends Apple every queued sale
//                               (studyboard_apple_line_items) and reports each expired token that never led to a sale
//
// Secrets: APPLE_IAP_KEY_ID, APPLE_IAP_ISSUER_ID, APPLE_IAP_PRIVATE_KEY (the .p8 In-App Purchase key's text), APPLE_BUNDLE_ID
// (com.studioso.app), APPLE_REPORT_SECRET, and APPLE_REPORT_SANDBOX=1 while testing. supabase-apple-external.sql makes the tables.

type Env = (k: string) => string;
type Deps = { env: Env; fetch: typeof fetch; now: () => number; log: (...a: unknown[]) => void; uuid: () => string };

const json = (o: unknown, status = 200, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(o), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...extra } });
const TYPES = new Set(["ACQUISITION", "SERVICES", "IN_APP", "LINK_OUT"]);
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info", "Access-Control-Allow-Methods": "POST, OPTIONS" };

function serviceKey(d: Deps): string {
  let key = d.env("SUPABASE_SERVICE_ROLE_KEY");
  if (!key) { try { const k = JSON.parse(d.env("SUPABASE_SECRET_KEYS") || "{}"); key = String(k.default || Object.values(k)[0] || ""); } catch (_e) { } }
  return key;
}
const base = (d: Deps) => d.env("SUPABASE_URL").replace(/\/+$/, "");

// Apple's token: Base64URL-encoded JSON {appAppleId, bundleId, tokenCreationDate, tokenExpirationDate?, externalPurchaseId, tokenType?}
export type Decoded = { id: string; type: string; created: number; expires?: number };
export function decodeToken(t: string, bundleId: string): Decoded | null {
  if (typeof t !== "string" || t.length > 4000 || !/^[A-Za-z0-9_=-]+$/.test(t)) return null;
  try {
    const b64 = t.replace(/-/g, "+").replace(/_/g, "/").replace(/=+$/, "");
    const o = JSON.parse(atob(b64 + "===".slice((b64.length + 3) % 4)));
    const id = String(o?.externalPurchaseId || ""), type = String(o?.tokenType || "");
    if (!/^[A-Za-z0-9_.:-]{6,200}$/.test(id) || o?.bundleId !== bundleId || !TYPES.has(type)) return null;
    const created = Number(o.tokenCreationDate), expires = o.tokenExpirationDate == null ? undefined : Number(o.tokenExpirationDate);
    if (!Number.isFinite(created) || created <= 0 || (expires !== undefined && !(expires > created))) return null;
    return { id, type, created, ...(expires !== undefined ? { expires } : {}) };
  } catch (_e) { return null; }
}

// The App Store Server API's sign-in: a JWT signed (ES256) with the In-App Purchase key
const b64url = (b: Uint8Array | string) => btoa(typeof b === "string" ? b : String.fromCharCode(...b)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
export async function appleJwt(d: Deps): Promise<string> {
  const pem = d.env("APPLE_IAP_PRIVATE_KEY").replace(/\\n/g, "\n");
  const der = Uint8Array.from(atob(pem.replace(/-----[^-]+-----/g, "").replace(/\s+/g, "")), c => c.charCodeAt(0));
  const key = await crypto.subtle.importKey("pkcs8", der, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const iat = Math.floor(d.now() / 1000);
  const head = b64url(JSON.stringify({ alg: "ES256", kid: d.env("APPLE_IAP_KEY_ID"), typ: "JWT" }));
  const body = b64url(JSON.stringify({ iss: d.env("APPLE_IAP_ISSUER_ID"), iat, exp: iat + 1200, aud: "appstoreconnect-v1", bid: d.env("APPLE_BUNDLE_ID") }));
  const sig = new Uint8Array(await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, new TextEncoder().encode(`${head}.${body}`)));
  return `${head}.${body}.${b64url(sig)}`;
}
const reportUrl = (d: Deps) => d.env("APPLE_REPORT_SANDBOX") === "1"
  ? "https://api.storekit-sandbox.apple.com/externalPurchase/v1/reports"
  : "https://api.storekit.apple.com/externalPurchase/v1/reports";

async function tokens(req: Request, d: Deps): Promise<Response> {
  const auth = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  if (!auth) return json({ error: "sign in first" }, 401, CORS);
  const anon = d.env("SUPABASE_ANON_KEY") || serviceKey(d);
  const ur = await d.fetch(`${base(d)}/auth/v1/user`, { headers: { apikey: anon, Authorization: `Bearer ${auth}` } });
  const user = ur.ok ? await ur.json().catch(() => null) as { id?: string; is_anonymous?: boolean } | null : null;
  if (!user?.id || !/^[0-9a-f-]{36}$/i.test(user.id) || user.is_anonymous) return json({ error: "sign in first" }, 401, CORS);
  const text = await req.text();
  if (text.length > 20000) return json({ error: "bad request" }, 400, CORS);
  let body: any = null; try { body = JSON.parse(text || "{}"); } catch (_e) { /* */ }
  const list = Array.isArray(body?.tokens) ? body.tokens.slice(0, 4) : [];
  const good = list.map((t: string) => decodeToken(t, d.env("APPLE_BUNDLE_ID"))).filter(Boolean) as Decoded[];
  if (!good.length) return json({ error: "no valid tokens" }, 400, CORS);
  const storefront = typeof body?.storefront === "string" && /^[A-Z]{3}$/.test(body.storefront) ? body.storefront : "";
  const key = serviceKey(d);
  const r = await d.fetch(`${base(d)}/rest/v1/rpc/studyboard_apple_add_tokens`, {
    method: "POST", headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ p_uid: user.id.toLowerCase(), p_tokens: good, p_tap: body?.tap === true, p_storefront: storefront }),
  });
  if (!r.ok) { d.log("apple-external: saving tokens failed", r.status); return json({ error: "server error" }, 500, CORS); }
  return json({ ok: true, saved: good.length }, 200, CORS);
}

// Send one report; true when Apple accepted it, false to try again on the next run (with the same request id)
export async function sendReport(d: Deps, jwt: string, report: Record<string, unknown>): Promise<{ ok: boolean; status: number; error?: string }> {
  const r = await d.fetch(reportUrl(d), { method: "PUT", headers: { Authorization: `Bearer ${jwt}`, "Content-Type": "application/json" }, body: JSON.stringify(report) });
  if (r.ok) return { ok: true, status: r.status };
  const t = await r.text().catch(() => "");
  return { ok: false, status: r.status, error: t.slice(0, 500) };
}

async function report(req: Request, d: Deps): Promise<Response> {
  const want = d.env("APPLE_REPORT_SECRET"), got = req.headers.get("x-report-secret") || "";
  if (!want || got.length !== want.length || got !== want) return json({ error: "forbidden" }, 403);
  if (!d.env("APPLE_IAP_PRIVATE_KEY") || !d.env("APPLE_IAP_KEY_ID") || !d.env("APPLE_IAP_ISSUER_ID") || !d.env("APPLE_BUNDLE_ID")) return json({ error: "apple keys not set" }, 500);
  const key = serviceKey(d), h = { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
  const rest = async (path: string, init: RequestInit = {}) => {
    const r = await d.fetch(`${base(d)}/rest/v1/${path}`, { ...init, headers: { ...h, ...(init.headers || {}) } });
    if (!r.ok) throw new Error(`db ${path.split("?")[0]} ${r.status}`);
    return r;
  };
  const jwt = await appleJwt(d);
  const out = { sales: 0, quiet: 0, duplicate: 0, failed: 0 };

  // 1. Sales: one report per token, holding its unsent line items
  const items = await (await rest("studyboard_apple_line_items?sent_at=is.null&select=line_item_id,external_purchase_id,payload,request_id&order=created_at.asc&limit=200")).json() as any[];
  const byToken = new Map<string, any[]>();
  for (const it of items) byToken.set(it.external_purchase_id, [...(byToken.get(it.external_purchase_id) || []), it]);
  for (const [epid, group] of byToken) {
    const res = await sendReport(d, jwt, { requestIdentifier: group[0].request_id, externalPurchaseId: epid, status: "LINE_ITEM", lineItems: group.map(g => g.payload) });
    const ids = group.map(g => encodeURIComponent(g.line_item_id)).join(",");
    if (res.ok) { await rest(`studyboard_apple_line_items?line_item_id=in.(${ids})`, { method: "PATCH", body: JSON.stringify({ sent_at: new Date(d.now()).toISOString(), last_error: null }) }); out.sales += group.length; }
    else { out.failed++; d.log("apple-external: sale report refused", res.status, res.error); await rest(`studyboard_apple_line_items?line_item_id=in.(${ids})`, { method: "PATCH", body: JSON.stringify({ last_error: `${res.status} ${res.error || ""}`.slice(0, 500) }) }); }
  }

  // 2. Tokens that expired without a sale. A token refreshed for the same period (same type and dates) is a duplicate.
  const nowIso = new Date(d.now()).toISOString(), monthAgo = new Date(d.now() - 30 * 86400_000).toISOString();
  const quiet = await (await rest(`studyboard_apple_tokens?report_status=is.null&or=(expires_at.lt.${nowIso},and(expires_at.is.null,received_at.lt.${monthAgo}))&select=external_purchase_id,user_id,token_type,created_at,expires_at,report_request_id&order=received_at.asc&limit=200`)).json() as any[];
  for (const t of quiet) {
    const twin = !t.user_id ? [] : await (await rest(`studyboard_apple_tokens?user_id=eq.${t.user_id}&token_type=eq.${t.token_type}&created_at=eq.${encodeURIComponent(t.created_at)}&external_purchase_id=neq.${encodeURIComponent(t.external_purchase_id)}&report_status=in.(LINE_ITEM,NO_LINE_ITEM)&select=external_purchase_id&limit=1`)).json() as any[];
    const status = twin.length && (t.token_type === "ACQUISITION" || t.token_type === "SERVICES") ? "DUPLICATE_TOKEN" : "NO_LINE_ITEM";
    const rid = t.report_request_id || d.uuid();
    if (!t.report_request_id) await rest(`studyboard_apple_tokens?external_purchase_id=eq.${encodeURIComponent(t.external_purchase_id)}`, { method: "PATCH", body: JSON.stringify({ report_request_id: rid }) });
    const res = await sendReport(d, jwt, { requestIdentifier: rid, externalPurchaseId: t.external_purchase_id, status });
    if (res.ok) { await rest(`studyboard_apple_tokens?external_purchase_id=eq.${encodeURIComponent(t.external_purchase_id)}`, { method: "PATCH", body: JSON.stringify({ report_status: status, reported_at: nowIso }) }); status === "NO_LINE_ITEM" ? out.quiet++ : out.duplicate++; }
    else { out.failed++; d.log("apple-external: token report refused", res.status, res.error); }
  }
  return json({ ok: true, ...out });
}

export async function handle(req: Request, d: Deps): Promise<Response> {
  const path = new URL(req.url).pathname.replace(/\/+$/, "");
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405, CORS);
  try {
    if (path.endsWith("/tokens")) return await tokens(req, d);
    if (path.endsWith("/report")) return await report(req, d);
    return json({ error: "not found" }, 404, CORS);
  } catch (err) {
    d.log("apple-external failed", err instanceof Error ? err.message : "error");
    return json({ error: "server error" }, 500, CORS);
  }
}

const g = globalThis as any;
if (g.Deno?.serve) {
  const env: Env = k => g.Deno.env.get(k) ?? "";
  g.Deno.serve((req: Request) => handle(req, { env, fetch, now: Date.now, log: console.error, uuid: () => crypto.randomUUID() }));
}
