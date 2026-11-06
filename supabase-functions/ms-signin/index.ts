// Studyboard: ms-signin, Sign in with Microsoft for every Microsoft account, school and work accounts included
//
// Supabase's own Microsoft (Azure) sign-in only accepts Microsoft's `email` claim, which school and work accounts often
// leave empty (their organisation never filled in the account's "mail" field). This function does the Microsoft side
// itself and then signs the person in to Supabase with a safe address:
//   - Microsoft's `email`, when Microsoft vouches for it: a personal account, or a school or work account whose
//     organisation has proven it owns that email's domain (xms_edov), or whose email is on the same domain as its
//     sign-in name;
//   - otherwise the school or work account's sign-in name (its UPN, like sam@school.edu), which Microsoft only allows on
//     domains the organisation has proven it owns (or its own something.onmicrosoft.com).
// An `email` that isn't vouched for is never used on its own: anyone can make a Microsoft organisation and type someone
// else's address into a user's "mail" field. Sign-in names on public mail domains (gmail.com...) are refused the same way.
//
// GET /ms-signin/ready                       {ok: true} once the secrets are set (the app falls back to Supabase's own
//                                            Microsoft sign-in until then)
// GET /ms-signin/start?return=<addr>&bind=<random>
//                                            off to Microsoft. <addr> must be one of Studyboard's return addresses (the
//                                            same ones as Supabase's Redirect URLs); <bind> is a random value the app keeps,
//                                            handed back at the end so a sign-in can only finish on the device that began it
// GET /ms-signin/callback?code=&state=       Microsoft sends the person here. The code is swapped for Microsoft's ID token
//                                            (straight from Microsoft with the client secret, so it can be trusted), the
//                                            address is chosen as above, the account is made if it's new, and the person is
//                                            sent back to <addr>#sb_ms=<one-time sign-in token>&sb_ms_bind=<bind>, which the
//                                            app swaps for a session (verifyOtp, type magiclink). Errors come back as
//                                            #error=...&error_description=...&sb_ms_bind=<bind>.
//
// Deploy with JWT verification off (browsers arrive here without a sign-in): supabase functions deploy ms-signin --no-verify-jwt
// Secrets: MS_SIGNIN_CLIENT_ID / MS_SIGNIN_CLIENT_SECRET (or the shared MS_CLIENT_ID / MS_CLIENT_SECRET), MS_SIGNIN_KEY (32+
// random characters; CLOUD_KEY or CALSYNC_KEY is used if it's missing). Optional: MS_SIGNIN_REDIRECT (the callback address,
// if not ${SUPABASE_URL}/functions/v1/ms-signin/callback), MS_SIGNIN_SITES (more website origins to return to, comma-separated).
// In Microsoft Entra, the app registration needs the callback address as a Web redirect URI.

type Env = (k: string) => string;
export type Deps = { env: Env; fetch: typeof fetch; now: () => number; log: (...a: unknown[]) => void; random: (n: number) => Uint8Array };

const enc = new TextEncoder(), dec = new TextDecoder();
const T = "https://login.microsoftonline.com/common/oauth2/v2.0";
export const PERSONAL_TENANT = "9188040d-6c67-4c5b-b112-36a304b66dad";
const STATE_SECONDS = 900;
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info", "Access-Control-Allow-Methods": "GET, OPTIONS" };
const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...CORS } });
const text = (s: string, status: number) => new Response(s, { status, headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });
const go = (to: string) => new Response(null, { status: 302, headers: { Location: to, "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" } });

const b64u = (b: Uint8Array) => btoa(String.fromCharCode(...b)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const unb64u = (s: string) => { const b = atob(s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4)); return Uint8Array.from(b, c => c.charCodeAt(0)); };
const envOr = (d: Deps, ...k: string[]) => { for (const x of k) { const v = d.env(x); if (v) return v; } return ""; };

/* ================= Settings ================= */
export function settings(d: Deps) {
  const base = d.env("SUPABASE_URL").replace(/\/+$/, "");
  const key = envOr(d, "MS_SIGNIN_KEY", "CLOUD_KEY", "CALSYNC_KEY");
  return {
    id: envOr(d, "MS_SIGNIN_CLIENT_ID", "MS_CLIENT_ID"), secret: envOr(d, "MS_SIGNIN_CLIENT_SECRET", "MS_CLIENT_SECRET"), key: key.length >= 32 ? key : "",
    base, redirect: d.env("MS_SIGNIN_REDIRECT") || `${base}/functions/v1/ms-signin/callback`, service: serviceKey(d),
    sites: ["https://studyboardapp.com", "https://www.studyboardapp.com"].concat(d.env("MS_SIGNIN_SITES").split(",").map(s => s.trim()).filter(s => /^https:\/\/[a-z0-9.-]+(:\d+)?$/i.test(s)))
  };
}
function serviceKey(d: Deps): string {
  let key = d.env("SUPABASE_SERVICE_ROLE_KEY");
  if (!key) { try { const k = JSON.parse(d.env("SUPABASE_SECRET_KEYS") || "{}"); key = String(k.default || Object.values(k)[0] || ""); } catch (_e) { } }
  return key;
}
const ready = (s: ReturnType<typeof settings>) => !!(s.id && s.secret && s.key && s.base && s.service);

// Where a sign-in may return to: Studyboard's websites (any page), the phone apps, and the desktop app's one-time page
export function returnOk(addr: string, sites: string[]): boolean {
  if (typeof addr !== "string" || addr.length > 2000) return false;
  if (addr === "studyboard://auth-callback") return true;
  if (/^http:\/\/127\.0\.0\.1:4382[1-3]\/auth$/.test(addr)) return true;
  let u: URL; try { u = new URL(addr); } catch (_e) { return false; }
  return u.protocol === "https:" && !u.username && !u.password && sites.includes(u.origin);
}

/* ================= State: encrypted, so the PKCE verifier and nonce stay private ================= */
async function aesKey(secret: string) {
  const base = await crypto.subtle.importKey("raw", enc.encode(secret), "HKDF", false, ["deriveKey"]);
  return crypto.subtle.deriveKey({ name: "HKDF", hash: "SHA-256", salt: enc.encode("studyboard-ms-signin"), info: enc.encode("state") }, base, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
}
export type State = { r: string; b: string; v: string; n: string; e: number };
export async function sealState(secret: string, st: State, iv: Uint8Array): Promise<string> {
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await aesKey(secret), enc.encode(JSON.stringify(st))));
  return b64u(iv) + "." + b64u(ct);
}
export async function openState(secret: string, s: string, nowMs: number): Promise<State | null> {
  try {
    const [iv, ct] = String(s || "").split(".");
    if (!iv || !ct || s.length > 3000) return null;
    const st = JSON.parse(dec.decode(await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64u(iv) }, await aesKey(secret), unb64u(ct)))) as State;
    if (!st || typeof st.r !== "string" || typeof st.v !== "string" || typeof st.n !== "string" || !(st.e * 1000 > nowMs)) return null;
    return st;
  } catch (_e) { return null; }
}

/* ================= Which address to sign in with ================= */
const EMAIL = /^[^\s@<>()"',;:]{1,64}@[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/i;
const PUBLIC_MAIL = /@(gmail|googlemail|outlook|hotmail|live|msn|yahoo|ymail|aol|icloud|me|mac|proton|protonmail|pm|gmx|mail|yandex|zoho|hey|fastmail|tutanota|qq|163|126)\.[a-z.]+$/i;
const domainOf = (e: string) => e.slice(e.lastIndexOf("@") + 1);
export type Claims = Record<string, unknown>;
export function pickEmail(c: Claims): { email: string; how: "email" | "upn" } | null {
  const clean = (v: unknown) => { const s = typeof v === "string" ? v.trim().toLowerCase() : ""; return EMAIL.test(s) ? s : ""; };
  const email = clean(c.email), personal = c.tid === PERSONAL_TENANT;
  // a personal Microsoft account: Microsoft confirmed its email
  if (personal) return email ? { email, how: "email" } : null;
  // school or work: the sign-in name (never a guest's #EXT# name, never one on a public mail domain)
  const upnRaw = typeof c.upn === "string" ? c.upn : "", name = clean(c.preferred_username) || clean(upnRaw);
  const upn = name && !/#ext#/i.test(upnRaw) && !/#ext#/i.test(String(c.preferred_username || "")) && !PUBLIC_MAIL.test(name) ? name : "";
  const edov = c.xms_edov === true || c.xms_edov === 1 || c.xms_edov === "1" || c.xms_edov === "true";
  if (email && (edov || (upn && domainOf(email) === domainOf(upn)))) return { email, how: "email" };
  if (upn) return { email: upn, how: "upn" };
  return null;
}
// Microsoft's ID token, straight from its token endpoint over TLS with the client secret (so its signature needn't be checked
// again, OpenID Connect Core 3.1.3.7): only that it's for this app, from Microsoft, current, and from this sign-in (nonce)
export function readIdToken(tok: string, clientId: string, nonce: string, nowMs: number): Claims | null {
  try {
    const parts = String(tok || "").split("."); if (parts.length !== 3) return null;
    const c = JSON.parse(dec.decode(unb64u(parts[1]))) as Claims;
    const iss = String(c.iss || ""), tid = String(c.tid || "");
    if (c.aud !== clientId || c.nonce !== nonce) return null;
    if (!/^[0-9a-f-]{36}$/i.test(tid) || iss !== `https://login.microsoftonline.com/${tid}/v2.0`) return null;
    if (!(Number(c.exp) * 1000 > nowMs - 300000)) return null;
    return c;
  } catch (_e) { return null; }
}

/* ================= The three steps ================= */
async function start(url: URL, d: Deps, s: ReturnType<typeof settings>): Promise<Response> {
  const back = url.searchParams.get("return") || "", bind = url.searchParams.get("bind") || "";
  if (!returnOk(back, s.sites)) return text("That return address isn't one of Studyboard's.", 400);
  if (!/^[A-Za-z0-9_-]{16,128}$/.test(bind)) return text("Missing sign-in check. Go back to Studyboard and try again.", 400);
  if (!ready(s)) return go(withHash(back, { error: "server_error", error_description: "Unsupported provider: provider is not enabled", sb_ms_bind: bind }));
  const verifier = b64u(d.random(48)), nonce = b64u(d.random(24));
  const challenge = b64u(new Uint8Array(await crypto.subtle.digest("SHA-256", enc.encode(verifier))));
  const state = await sealState(s.key, { r: back, b: bind, v: verifier, n: nonce, e: Math.floor(d.now() / 1000) + STATE_SECONDS }, d.random(12));
  return go(`${T}/authorize?` + new URLSearchParams({
    client_id: s.id, response_type: "code", response_mode: "query", redirect_uri: s.redirect, scope: "openid profile email",
    state, nonce, code_challenge: challenge, code_challenge_method: "S256", prompt: "select_account"
  }).toString());
}
const withHash = (addr: string, p: Record<string, string>) => addr.split("#")[0] + "#" + new URLSearchParams(p).toString();

async function callback(url: URL, d: Deps, s: ReturnType<typeof settings>): Promise<Response> {
  const st = s.key ? await openState(s.key, url.searchParams.get("state") || "", d.now()) : null;
  if (!st || !returnOk(st.r, s.sites)) return text("That sign-in link has expired. Go back to Studyboard and choose Sign in with Microsoft again.", 400);
  const fail = (desc: string, code = "server_error") => go(withHash(st.r, { error: code, error_description: desc.slice(0, 300), sb_ms_bind: st.b }));
  const err = url.searchParams.get("error");
  if (err) return fail(url.searchParams.get("error_description") || err, err === "access_denied" ? "access_denied" : "server_error");
  const code = url.searchParams.get("code") || "";
  if (!code || code.length > 4000) return fail("Microsoft didn't send a sign-in code.");
  // the code, for Microsoft's tokens
  let tok: any = null;
  try {
    const r = await d.fetch(`${T}/token`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ client_id: s.id, client_secret: s.secret, grant_type: "authorization_code", code, redirect_uri: s.redirect, code_verifier: st.v, scope: "openid profile email" }).toString() });
    tok = await r.json().catch(() => null);
    if (!r.ok || !tok) { d.log("ms-signin: token refused", r.status, tok && tok.error, tok && String(tok.error_description || "").slice(0, 160)); return fail((tok && tok.error_description) || "Unable to exchange external code"); }
  } catch (_e) { return fail("Couldn't reach Microsoft. Try again."); }
  const claims = readIdToken(String(tok.id_token || ""), s.id, st.n, d.now());
  if (!claims) { d.log("ms-signin: id token not accepted"); return fail("Microsoft's sign-in couldn't be checked. Try again."); }
  const who = pickEmail(claims);
  if (!who) { d.log("ms-signin: no usable address", claims.tid === PERSONAL_TENANT ? "personal" : "organization"); return fail("Error getting user email from external provider"); }
  // the Supabase account: made if it's new (Microsoft has proven the address), then a one-time sign-in token for it
  const H = { apikey: s.service, Authorization: `Bearer ${s.service}`, "Content-Type": "application/json" };
  const name = typeof claims.name === "string" ? claims.name.replace(/[\u0000-\u001f<>]/g, "").trim().slice(0, 80) : "";
  try {
    const made = await d.fetch(`${s.base}/auth/v1/admin/users`, { method: "POST", headers: H, body: JSON.stringify({ email: who.email, email_confirm: true,
      user_metadata: Object.assign({ provider_hint: "azure", ms_how: who.how }, name ? { full_name: name, name, first_name: name.split(" ")[0] } : {}) }) });
    if (!made.ok && made.status !== 422) { const t = await made.text().catch(() => ""); if (!/already|registered|exists/i.test(t)) { d.log("ms-signin: create user", made.status, t.slice(0, 160)); return fail("Couldn't make your Studyboard account. Try again."); } }
    const link = await d.fetch(`${s.base}/auth/v1/admin/generate_link`, { method: "POST", headers: H, body: JSON.stringify({ type: "magiclink", email: who.email }) });
    const j: any = await link.json().catch(() => null);
    const hash = j && (j.hashed_token || (j.properties && j.properties.hashed_token));
    if (!link.ok || typeof hash !== "string" || !hash) { d.log("ms-signin: generate link", link.status, j && (j.msg || j.error_description || j.error)); return fail("Couldn't finish signing you in. Try again."); }
    d.log("ms-signin: ok", who.how, claims.tid === PERSONAL_TENANT ? "personal" : "organization");
    return go(withHash(st.r, { sb_ms: hash, sb_ms_bind: st.b }));
  } catch (_e) { return fail("Couldn't finish signing you in. Try again."); }
}

export async function handle(req: Request, d: Deps): Promise<Response> {
  const url = new URL(req.url), path = url.pathname.replace(/\/+$/, "");
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (req.method !== "GET") return text("Not allowed.", 405);
  const s = settings(d);
  try {
    if (path.endsWith("/ready")) return json({ ok: ready(s) });
    if (path.endsWith("/start")) return await start(url, d, s);
    if (path.endsWith("/callback") || url.searchParams.has("state")) return await callback(url, d, s);
    return text("Not found.", 404);
  } catch (e) {
    d.log("ms-signin failed", e instanceof Error ? e.message : "error");
    return text("Something went wrong. Go back to Studyboard and try again.", 500);
  }
}

const g = globalThis as any;
if (g.Deno?.serve) {
  const env: Env = k => g.Deno.env.get(k) ?? "";
  g.Deno.serve((req: Request) => handle(req, { env, fetch, now: Date.now, log: console.error, random: n => crypto.getRandomValues(new Uint8Array(n)) }));
}
