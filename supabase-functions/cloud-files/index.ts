// Studyboard: cloud-files (Supabase Edge Function)  ·  Google Drive and OneDrive for Studyboard Pro
//
// Deploy with "Verify JWT" turned OFF: Google and Microsoft send the person back here (GET ?code=&state=) without a Supabase sign-in.
// Every POST checks the person's sign-in itself (the same way calendar-sync does). Tables and rules: supabase-cloud.sql.
// Secrets (Edge Functions > Secrets):
//   CLOUD_KEY              32+ random characters (falls back to CALSYNC_KEY). Encrypts the stored sign-ins (AES-GCM) and signs the
//                          connect state (HMAC); the keys are derived from it (HKDF) apart from calendar-sync's. If it changes, people connect again.
//   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET   the same OAuth "Web application" client calendar-sync uses works: turn on the Google Drive API
//                          and add https://<project>.supabase.co/functions/v1/cloud-files as an Authorized redirect URI.
//                          (CLOUD_GOOGLE_CLIENT_ID / CLOUD_GOOGLE_CLIENT_SECRET take precedence when set.)
//   MS_CLIENT_ID, MS_CLIENT_SECRET           the same app registration works: add the redirect URI above (Web) and the delegated permission
//                          Files.ReadWrite. (CLOUD_MS_CLIENT_ID / CLOUD_MS_CLIENT_SECRET take precedence when set.)
//   Either provider can be left out; the app then only offers the other. Optional: CLOUD_REDIRECT (a different redirect address).
//
// What Studyboard may do with the account:
//   Google: drive.file. Only the files and folders Studyboard itself made (a folder called "Studyboard"). It can't see anything else.
//   Microsoft: Files.ReadWrite. It saves into the folder the person picks (a folder called "Studyboard" unless they choose another), and
//   reads the folders they choose to watch. It never deletes anything in OneDrive.
//
// The browser talks to Google Drive and Microsoft Graph itself (big files go straight there, never through this function). This function
// keeps the long-lived sign-in (refresh token) encrypted and hands the signed-in Pro person a short-lived access token (about an hour).
//
// POST {action} with Authorization: Bearer <the person's Supabase access token>:
//   "start"      {provider}        -> {url}: where to send the person to allow access (Pro only once the paywall is on)
//   "status"                       -> {accounts: [{provider, account, status, connected_at}], providers: {google, microsoft}}
//   "token"      {provider}        -> {access, expires_in, account}  (Pro only)
//   "disconnect" {provider}        -> {ok}   (files already in the cloud stay there)
// Errors: 401 sign in · 402 pro_required · 404 not_connected · 409 reauth (allow access again) · 501 not_configured ·
//         502 provider (Google or Microsoft refused or failed) · 400 bad request · 429 too many requests.
// Logs are one line of JSON per request, never tokens, file names or the account address.

type Env = (k: string) => string;
type Deps = { env: Env; fetch: typeof fetch; now: () => number; log: (...a: unknown[]) => void };
export type Provider = "google" | "microsoft";

const PROVIDERS: Provider[] = ["google", "microsoft"];
const FN = "cloud-files";
const enc = new TextEncoder(), dec = new TextDecoder();

/* ================= Secrets: encrypted tokens and signed state ================= */
const b64u = (b: ArrayBuffer | Uint8Array) => btoa(String.fromCharCode(...new Uint8Array(b as ArrayBuffer))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const unb64u = (s: string) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4)), c => c.charCodeAt(0));
let KEYS: { raw: string; aes: CryptoKey; mac: CryptoKey } | null = null;
export async function keys(secret: string) {
  if (KEYS && KEYS.raw === secret) return KEYS;
  const base = await crypto.subtle.importKey("raw", enc.encode(secret), "HKDF", false, ["deriveKey"]);
  const hk = (info: string) => ({ name: "HKDF", hash: "SHA-256", salt: enc.encode("studyboard-cloudfiles-v1"), info: enc.encode(info) });
  const aes = await crypto.subtle.deriveKey(hk("tokens"), base, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
  const mac = await crypto.subtle.deriveKey(hk("state"), base, { name: "HMAC", hash: "SHA-256", length: 256 }, false, ["sign", "verify"]);
  KEYS = { raw: secret, aes, mac };
  return KEYS;
}
// A sealed value is bound to its owner and provider: a row copied to another account can't be opened there
export async function seal(secret: string, text: string, uid: string, provider: string): Promise<string> {
  const k = await keys(secret), iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv, additionalData: enc.encode(uid + "|" + provider) }, k.aes, enc.encode(text));
  return "v1." + b64u(iv) + "." + b64u(ct);
}
export async function unseal(secret: string, box: string, uid: string, provider: string): Promise<string> {
  const [v, iv, ct] = String(box).split("."); if (v !== "v1" || !iv || !ct) throw new Error("bad box");
  const k = await keys(secret);
  return dec.decode(await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64u(iv), additionalData: enc.encode(uid + "|" + provider) }, k.aes, unb64u(ct)));
}
export async function signState(secret: string, o: { u: string; p: string; e: number }): Promise<string> {
  const body = b64u(enc.encode(JSON.stringify({ ...o, n: b64u(crypto.getRandomValues(new Uint8Array(9))) })));
  return body + "." + b64u(await crypto.subtle.sign("HMAC", (await keys(secret)).mac, enc.encode(body)));
}
export async function readState(secret: string, s: string, nowMs: number): Promise<{ u: string; p: Provider; n: string } | null> {
  const [body, sig] = String(s || "").split("."); if (!body || !sig || body.length > 600) return null;
  try {
    if (!(await crypto.subtle.verify("HMAC", (await keys(secret)).mac, unb64u(sig), enc.encode(body)))) return null;
    const o = JSON.parse(dec.decode(unb64u(body)));
    if (!o || typeof o.u !== "string" || !/^[0-9a-f-]{36}$/.test(o.u) || !PROVIDERS.includes(o.p) || !(o.e > nowMs / 1000)) return null;
    if (typeof o.n !== "string" || !/^[A-Za-z0-9_-]{8,20}$/.test(o.n)) return null;
    return { u: o.u, p: o.p, n: o.n };
  } catch (_e) { return null; }
}

/* ================= Google and Microsoft sign-in ================= */
export class ProviderError extends Error { status: number; reauth: boolean; constructor(status: number, reauth = false, msg = "") { super(msg || "provider " + status); this.status = status; this.reauth = reauth; } }
type Adapter = {
  configured(): boolean; authUrl(state: string, redirect: string): string;
  exchange(code: string, redirect: string): Promise<{ refresh: string; access: string; expires: number; account: string }>;
  refresh(rt: string): Promise<{ access: string; expires: number; refresh?: string }>;
  revoke(rt: string): Promise<void>;
};
async function tokenCall(d: Deps, url: string, form: Record<string, string>): Promise<any> {
  const r = await d.fetch(url, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams(form).toString() });
  const j = await r.json().catch(() => ({})) as any;
  if (!r.ok) throw new ProviderError(r.status, j && (j.error === "invalid_grant" || j.error === "interaction_required" || j.error === "consent_required"));
  return j;
}
const jwtEmail = (t: string) => { try { return String(JSON.parse(dec.decode(unb64u(t.split(".")[1]))).email || ""); } catch (_e) { return ""; } };
const secs = (n: unknown) => { const x = Number(n); return isFinite(x) && x > 60 ? Math.min(x, 7200) : 3600; };
const envOr = (d: Deps, a: string, b: string) => d.env(a) || d.env(b);

export const GOOGLE_SCOPE = "openid email https://www.googleapis.com/auth/drive.file";
export const MS_SCOPE = "offline_access openid email User.Read Files.ReadWrite";
export function google(d: Deps): Adapter {
  const id = envOr(d, "CLOUD_GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_ID"), secret = envOr(d, "CLOUD_GOOGLE_CLIENT_SECRET", "GOOGLE_CLIENT_SECRET");
  return {
    configured: () => !!id && !!secret,
    authUrl: (state, redirect) => "https://accounts.google.com/o/oauth2/v2/auth?" + new URLSearchParams({ client_id: id, redirect_uri: redirect, response_type: "code", access_type: "offline", prompt: "consent", state, scope: GOOGLE_SCOPE }).toString(),
    async exchange(code, redirect) {
      const j = await tokenCall(d, "https://oauth2.googleapis.com/token", { code, client_id: id, client_secret: secret, redirect_uri: redirect, grant_type: "authorization_code" });
      if (!j.refresh_token || !j.access_token) throw new ProviderError(400, false, "no refresh token");
      if (typeof j.scope === "string" && !j.scope.includes("drive.file")) throw new ProviderError(403, false, "drive not allowed");   // they unticked Drive
      return { refresh: j.refresh_token, access: j.access_token, expires: secs(j.expires_in), account: jwtEmail(j.id_token || "") };
    },
    async refresh(rt) { const j = await tokenCall(d, "https://oauth2.googleapis.com/token", { refresh_token: rt, client_id: id, client_secret: secret, grant_type: "refresh_token" }); return { access: j.access_token, expires: secs(j.expires_in) }; },
    async revoke(rt) { try { await d.fetch("https://oauth2.googleapis.com/revoke?token=" + encodeURIComponent(rt), { method: "POST" }); } catch (_e) { /* best effort */ } },
  };
}
export function microsoft(d: Deps): Adapter {
  const id = envOr(d, "CLOUD_MS_CLIENT_ID", "MS_CLIENT_ID"), secret = envOr(d, "CLOUD_MS_CLIENT_SECRET", "MS_CLIENT_SECRET"), T = "https://login.microsoftonline.com/common/oauth2/v2.0";
  return {
    configured: () => !!id && !!secret,
    authUrl: (state, redirect) => `${T}/authorize?` + new URLSearchParams({ client_id: id, response_type: "code", redirect_uri: redirect, response_mode: "query", scope: MS_SCOPE, state, prompt: "select_account" }).toString(),
    async exchange(code, redirect) {
      const j = await tokenCall(d, `${T}/token`, { client_id: id, client_secret: secret, code, redirect_uri: redirect, grant_type: "authorization_code", scope: MS_SCOPE });
      if (!j.refresh_token || !j.access_token) throw new ProviderError(400, false, "no refresh token");
      let account = jwtEmail(j.id_token || "");
      if (!account) {
        try { const r = await d.fetch("https://graph.microsoft.com/v1.0/me?$select=mail,userPrincipalName", { headers: { Authorization: `Bearer ${j.access_token}` } }); const me = await r.json() as any; account = String(me.mail || me.userPrincipalName || ""); }
        catch (_e) { /* the address is only for display */ }
      }
      return { refresh: j.refresh_token, access: j.access_token, expires: secs(j.expires_in), account };
    },
    async refresh(rt) { const j = await tokenCall(d, `${T}/token`, { client_id: id, client_secret: secret, refresh_token: rt, grant_type: "refresh_token", scope: MS_SCOPE }); return { access: j.access_token, expires: secs(j.expires_in), refresh: j.refresh_token }; },
    async revoke() { /* Microsoft has no token revocation for this kind of app: deleting the stored sign-in is what disconnects */ },
  };
}
export const adapters = (d: Deps): Record<Provider, Adapter> => ({ google: google(d), microsoft: microsoft(d) });

/* ================= Plumbing ================= */
const CORS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",   // the app runs on many origins; auth is a bearer token, never a cookie
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Max-Age": "600",
};
const reply = (o: unknown, status: number) => new Response(JSON.stringify(o), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...CORS } });
function serviceKey(d: Deps): string {
  let key = d.env("SUPABASE_SERVICE_ROLE_KEY");
  if (!key) { try { const k = JSON.parse(d.env("SUPABASE_SECRET_KEYS") || "{}"); key = String(k.default || Object.values(k)[0] || ""); } catch (_e) { /* newer projects only */ } }
  return key;
}
const base = (d: Deps) => d.env("SUPABASE_URL").replace(/\/+$/, "");
const redirectOf = (d: Deps) => d.env("CLOUD_REDIRECT") || `${base(d)}/functions/v1/${FN}`;
const secretOf = (d: Deps) => d.env("CLOUD_KEY") || d.env("CALSYNC_KEY");
async function rpc(d: Deps, name: string, args: Record<string, unknown>): Promise<any> {
  const k = serviceKey(d);
  const r = await d.fetch(`${base(d)}/rest/v1/rpc/${name}`, { method: "POST", headers: { apikey: k, Authorization: `Bearer ${k}`, "Content-Type": "application/json" }, body: JSON.stringify(args) });
  if (!r.ok) throw new Error(`db ${name} ${r.status}`);
  const t = await r.text(); return t ? JSON.parse(t) : null;
}
async function whoIs(d: Deps, token: string): Promise<string | null> {
  if (!token) return null;
  const r = await d.fetch(`${base(d)}/auth/v1/user`, { headers: { apikey: d.env("SUPABASE_ANON_KEY") || serviceKey(d), Authorization: `Bearer ${token}` } });
  if (!r.ok) return null;
  const u = await r.json().catch(() => null) as { id?: string } | null;
  return u?.id && /^[0-9a-f-]{36}$/i.test(u.id) ? u.id.toLowerCase() : null;
}
async function studyboardEmail(d: Deps, uid: string): Promise<string> {
  try { const k = serviceKey(d); const r = await d.fetch(`${base(d)}/auth/v1/admin/users/${uid}`, { headers: { apikey: k, Authorization: `Bearer ${k}` } }); const u = await r.json() as any; return String(u && u.email || ""); } catch (_e) { return ""; }
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
    if (n > max) { try { await reader.cancel(); } catch (_e) { /* ignore */ } return null; }
    chunks.push(value);
  }
  const all = new Uint8Array(n); let o = 0;
  for (const c of chunks) { all.set(c, o); o += c.byteLength; }
  return dec.decode(all);
}
const NAME: Record<Provider, string> = { google: "Google Drive", microsoft: "OneDrive" };
const HTML_HEAD = (title: string) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0E2A56;font:16px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif;color:#0E2A56}main{background:#fff;border-radius:18px;padding:28px 26px;max-width:440px;margin:16px;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.3)}h1,b.t{display:block;font-size:1.25rem;margin:8px 0}i{display:inline-grid;place-items:center;width:52px;height:52px;border-radius:50%;color:#fff;font-style:normal;font-size:1.6rem}p{margin:6px 0 18px;color:#40506B}button{font:inherit;font-weight:700;border:0;border-radius:12px;padding:12px 22px;background:#2563EB;color:#fff;cursor:pointer}</style></head>`;
const SAFE_HEADERS = (formOk: boolean) => ({ "Content-Type": "text/html; charset=utf-8", "X-Studyboard-Page": "html", "Cache-Control": "no-store", "Content-Security-Policy": `default-src 'none'; style-src 'unsafe-inline'; ${formOk ? "form-action 'self'; " : ""}frame-ancestors 'none'`, "Referrer-Policy": "no-referrer", "X-Frame-Options": "DENY" });
const page = (title: string, text: string, ok: boolean) => new Response(`${HTML_HEAD(title)}<body><main><i style="background:${ok ? "#2E9E6B" : "#C93439"}">${ok ? "✓" : "!"}</i><b class="t">${title}</b><p>${text}</p></main></body></html>`, { status: ok ? 200 : 400, headers: SAFE_HEADERS(false) });
const confirmPage = (title: string, html: string, box: string) => new Response(`${HTML_HEAD(title)}<body><main><h1>${title}</h1><p>${html}</p><form method="post"><input type="hidden" name="confirm" value="${htmlEsc(box)}"><button type="submit">Connect</button></form></main></body></html>`, { status: 200, headers: SAFE_HEADERS(true) });
const htmlEsc = (s: string) => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" } as any)[c]);

/* Connecting is bound to the browser that started it, and confirmed by the person (the same three steps as calendar-sync):
   1. The app opens ?begin=<state>. A short cookie holding the state's nonce is set in this browser, then on to Google or Microsoft.
   2. They send the browser back with ?code&state. Without the matching cookie (a link someone sent you) nothing happens.
   3. A page asks: connect <cloud account> to the Studyboard account <address>? Only that button stores anything. */
const COOKIE = "sbcf";
const cookieOf = (req: Request) => ((req.headers.get("cookie") || "").split(/;\s*/).find(c => c.startsWith(COOKIE + "=")) || "").slice(COOKIE.length + 1);
const setCookie = (v: string, age: number) => `${COOKIE}=${v}; Max-Age=${age}; Path=/functions/v1/${FN}; HttpOnly; Secure; SameSite=Lax`;
type Log = (o: string, x?: Record<string, unknown>) => void;
async function begin(req: Request, url: URL, d: Deps, A: Record<Provider, Adapter>, log: Log): Promise<Response> {
  const secret = secretOf(d), raw = url.searchParams.get("begin") || "";
  const st = secret.length >= 32 ? await readState(secret, raw, d.now()) : null;
  if (!st || !A[st.p].configured()) { log("begin_bad"); return page("That link has expired", "Go back to Studyboard and choose Connect again.", false); }
  // When the return address is on the website (CLOUD_REDIRECT / CALSYNC_REDIRECT), the browser's cookie has to be set there too: a link
  // that reached Supabase directly (one made before the address changed) goes to the website first, which passes it back here.
  if (new URL(redirectOf(d)).host !== new URL(base(d)).host && req.headers.get("x-studyboard-via") !== "site") {
    log("begin_to_site");
    return new Response(null, { status: 302, headers: { Location: `${redirectOf(d)}?begin=${encodeURIComponent(raw)}`, "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" } });
  }
  return new Response(null, { status: 302, headers: { Location: A[st.p].authUrl(raw, redirectOf(d)), "Set-Cookie": setCookie(st.n, 900), "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" } });
}
async function callback(req: Request, url: URL, d: Deps, A: Record<Provider, Adapter>, log: Log): Promise<Response> {
  const secret = secretOf(d);
  const st = secret.length >= 32 ? await readState(secret, url.searchParams.get("state") || "", d.now()) : null;
  if (!st) { log("cb_bad_state"); return page("That link has expired", "Go back to Studyboard and choose Connect again.", false); }
  if (cookieOf(req) !== st.n) { log("cb_other_browser"); return page("Start again in Studyboard", "This connection wasn't started in this browser, so nothing was connected. Choose Connect in your own Studyboard.", false); }
  if (url.searchParams.get("error")) { log("cb_denied"); return page("Not connected", "Access wasn't allowed, so nothing changed. You can try again from Studyboard.", false); }
  const code = url.searchParams.get("code") || ""; if (!code || code.length > 2000) return page("Not connected", "Something was missing. Try again from Studyboard.", false);
  try {
    const t = await A[st.p].exchange(code, redirectOf(d));
    const box = await seal(secret, JSON.stringify({ u: st.u, p: st.p, n: st.n, rt: t.refresh, a: t.account.slice(0, 200), e: Math.floor(d.now() / 1000) + 600 }), "confirm", FN);
    const sb = await studyboardEmail(d, st.u);
    log("cb_confirm", { provider: st.p });
    const what = st.p === "google" ? "Studyboard can only see the files it saves there, in a folder called “Studyboard”." : "Studyboard saves into a folder called “Studyboard” (or one you choose) and reads only the folders you ask it to watch. It never deletes anything.";
    return confirmPage(`Connect ${NAME[st.p]}?`, `Connect <b>${htmlEsc(t.account || NAME[st.p])}</b> to the Studyboard account <b>${htmlEsc(sb || "(no email address)")}</b>? ${what}<br><br><b>Only continue if this is your Studyboard account.</b> If someone sent you this link, close this page.`, box);
  } catch (e) {
    log("cb_error", { provider: st.p, status: e instanceof ProviderError ? e.status : 0 });
    return page("Not connected", e instanceof ProviderError && e.status === 403 ? `Studyboard needs permission to save files in ${NAME[st.p]}. Try again from Studyboard and leave that box ticked.` : `${NAME[st.p]} didn't finish connecting. Try again from Studyboard.`, false);
  }
}
async function confirm(req: Request, d: Deps, A: Record<Provider, Adapter>, log: Log): Promise<Response> {
  const secret = secretOf(d), text = await readLimited(req, 9000);   // unsigned-in POST: read at most 9000 bytes
  if (secret.length < 32 || text === null) return page("Not connected", "Try again from Studyboard.", false);
  let o: any = null;
  try { o = JSON.parse(await unseal(secret, new URLSearchParams(text).get("confirm") || "", "confirm", FN)); } catch (_e) { o = null; }
  if (!o || !PROVIDERS.includes(o.p) || !(o.e > d.now() / 1000) || cookieOf(req) !== o.n) { log("confirm_bad"); return page("That page has expired", "Go back to Studyboard and choose Connect again.", false); }
  const prov: Provider = o.p;
  try {
    const tok = await A[prov].refresh(o.rt);
    await rpc(d, "cloud_connect", { p_uid: o.u, p_provider: prov, p_account: String(o.a || ""), p_refresh_enc: await seal(secret, tok.refresh || o.rt, o.u, prov) });
    log("cb_connected", { provider: prov });
    const r = page(`Connected to ${NAME[prov]}`, `You can close this tab and go back to Studyboard.`, true);
    r.headers.set("Set-Cookie", setCookie("", 0));
    return r;
  } catch (e) {
    log("confirm_error", { provider: prov, status: e instanceof ProviderError ? e.status : 0 });
    return page("Not connected", `${NAME[prov]} didn't finish connecting. Try again from Studyboard.`, false);
  }
}

// A short-lived access token for the browser. The last one is kept (encrypted) and handed out again while it has 5+ minutes left,
// so opening Studyboard on several devices doesn't refresh the sign-in every time.
async function token(uid: string, prov: Provider, d: Deps, A: Record<Provider, Adapter>, log: Log): Promise<Response> {
  const secret = secretOf(d);
  const acct = (await rpc(d, "cloud_account", { p_uid: uid, p_provider: prov }) || [])[0];
  if (!acct) return reply({ error: "not_connected" }, 404);
  if (acct.status === "reauth") return reply({ error: "reauth" }, 409);
  const nowS = Math.floor(d.now() / 1000), exp = acct.access_exp ? Math.floor(Date.parse(acct.access_exp) / 1000) : 0;
  if (acct.access_enc && exp - nowS > 300) {
    try { const access = await unseal(secret, acct.access_enc, uid, prov + ":at"); return reply({ access, expires_in: exp - nowS, account: acct.account || "" }, 200); } catch (_e) { /* refresh below */ }
  }
  let rt: string;
  try { rt = await unseal(secret, acct.refresh_enc, uid, prov); }
  catch (_e) { await rpc(d, "cloud_update", { p_uid: uid, p_provider: prov, p_status: "reauth" }); return reply({ error: "reauth" }, 409); }
  let t: { access: string; expires: number; refresh?: string };
  try { t = await A[prov].refresh(rt); }
  catch (e) { if (e instanceof ProviderError && e.reauth) { await rpc(d, "cloud_update", { p_uid: uid, p_provider: prov, p_status: "reauth" }); log("reauth", { provider: prov }); return reply({ error: "reauth" }, 409); } throw e; }
  await rpc(d, "cloud_update", { p_uid: uid, p_provider: prov, p_refresh_enc: t.refresh && t.refresh !== rt ? await seal(secret, t.refresh, uid, prov) : null,
    p_access_enc: await seal(secret, t.access, uid, prov + ":at"), p_access_exp: new Date((nowS + t.expires) * 1000).toISOString() });
  log("token", { provider: prov });
  return reply({ access: t.access, expires_in: t.expires, account: acct.account || "" }, 200);
}

export async function handle(req: Request, d: Deps): Promise<Response> {
  const t0 = d.now(), url = new URL(req.url);
  const log: Log = (outcome, extra = {}) => d.log(JSON.stringify({ fn: FN, outcome, ms: d.now() - t0, ...extra }));
  const A = adapters(d);
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (req.method === "GET" && url.searchParams.has("begin")) return begin(req, url, d, A, log);
  if (req.method === "GET" && (url.searchParams.has("state") || url.searchParams.has("code") || url.searchParams.has("error"))) return callback(req, url, d, A, log);
  if (req.method !== "POST") return reply({ error: "method not allowed" }, 405);
  if ((req.headers.get("content-type") || "").includes("application/x-www-form-urlencoded") && !req.headers.get("authorization")) return confirm(req, d, A, log);
  const secret = secretOf(d);
  if (secret.length < 32) { log("not_configured"); return reply({ error: "not_configured" }, 501); }
  try {
    const uid = await whoIs(d, (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim());
    if (!uid) return reply({ error: "sign in first" }, 401);
    const text = await readLimited(req, 4000);
    if (text === null) return reply({ error: "bad request" }, 400);
    let b: any; try { b = JSON.parse(text || "{}"); } catch (_e) { b = null; }
    if (!b || typeof b !== "object") return reply({ error: "bad request" }, 400);
    const providers = { google: A.google.configured(), microsoft: A.microsoft.configured() };
    if (b.action === "status") return reply({ accounts: await rpc(d, "cloud_status", { p_uid: uid }) || [], providers }, 200);
    if (!PROVIDERS.includes(b.provider)) return reply({ error: "bad request" }, 400);
    const prov: Provider = b.provider;
    if (b.action === "disconnect") {
      const acct = (await rpc(d, "cloud_account", { p_uid: uid, p_provider: prov }) || [])[0];
      if (acct) { try { await A[prov].revoke(await unseal(secret, acct.refresh_enc, uid, prov)); } catch (_e) { /* disconnecting never fails because the provider did */ } await rpc(d, "cloud_disconnect", { p_uid: uid, p_provider: prov }); }
      log("disconnected", { provider: prov });
      return reply({ ok: true }, 200);
    }
    if (!(await rpc(d, "cloud_allowed", { p_uid: uid }))) return reply({ error: "pro_required" }, 402);
    if (!A[prov].configured()) return reply({ error: "not_configured", provider: prov }, 501);
    if (b.action === "start") {
      const state = await signState(secret, { u: uid, p: prov, e: Math.floor(d.now() / 1000) + 900 });
      log("start", { provider: prov });
      return reply({ url: `${redirectOf(d)}?begin=${encodeURIComponent(state)}` }, 200);
    }
    if (b.action === "token") {
      if (!(await rpc(d, "cloud_touch", { p_uid: uid, p_provider: prov }))) { log("throttled", { provider: prov }); return reply({ error: "too many requests" }, 429); }
      return await token(uid, prov, d, A, log);
    }
    return reply({ error: "bad request" }, 400);
  } catch (e) {
    log("error", { msg: e instanceof Error ? e.message.slice(0, 80) : "error", status: e instanceof ProviderError ? e.status : undefined });
    return reply({ error: e instanceof ProviderError ? "provider" : "server error" }, e instanceof ProviderError ? 502 : 500);
  }
}

const g = globalThis as any;
if (g.Deno?.serve) {
  const env: Env = k => g.Deno.env.get(k) ?? "";
  g.Deno.serve((req: Request) => handle(req, { env, fetch, now: Date.now, log: console.error }));
}
