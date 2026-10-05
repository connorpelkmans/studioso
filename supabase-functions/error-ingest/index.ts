// Studyboard: error-ingest (Supabase Edge Function), the optional self-hosted path for anonymous crash reports (ERROR-REPORTING.md).
// The page POSTs {v: 1, event: {...}} (the same scrubbed event it would send to Sentry). This function checks it again, strictly, and stores one row
// in client_errors (supabase-error-reports.sql). Nothing in the request is trusted: unknown fields are dropped, text is capped and re-scrubbed.
//
// Deploy with "Verify JWT" turned OFF (the app sends reports signed out too; the public key in the "apikey" header is enough for the gateway).
// Secrets: none to add. Supabase supplies SUPABASE_URL and the service key itself. Optional: ERROR_INGEST_SALT (any random text) to salt the address hash.
//
// Limits: body at most 24 KB (counted while it arrives, so a huge or endless body is cut off early), 30 reports an hour per anonymous id,
// 60 per network address (hashed with a daily salt, never stored raw), 500 an hour overall, and no new rows once the table holds 20000
// (client_errors_allow in supabase-error-reports.sql; the 30-day clean-up makes room again).

type Env = (k: string) => string;
type Deps = { env: Env; fetch: typeof fetch; now: () => number; log: (...a: unknown[]) => void };

const MAX_BODY = 24000;
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "apikey, content-type, authorization, x-client-info", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Max-Age": "600" };
const json = (o: unknown, status: number, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(o), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...CORS, ...extra } });

const KEY_RE = /AIza[\w-]{20,}|sk-[\w-]{16,}|sb_(?:secret|publishable)_[\w-]+|eyJ[\w-]{10,}\.[\w-]{10,}\.[\w-]{5,}|(?:ghp|gho|github_pat|xox[a-z])[_-][\w-]{16,}|(key|token|apikey|authorization|bearer|secret|password)([=:\s]+)[\w.~+\/-]{8,}/gi;
const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.-]+/g;
const URL_RE = /\b(?:https?|app|capacitor|file|blob):\/\/[^\s"'<>)\]]+/gi;
const word = (v: unknown, max: number) => String(v ?? "").replace(/[^\w.-]/g, "").slice(0, max);
const text = (v: unknown, max: number) => String(v ?? "").replace(KEY_RE, "[hidden]").replace(EMAIL_RE, "[email]").replace(URL_RE, "[url]").replace(/[\r\n\t]+/g, " ").slice(0, max);
const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);

export type Row = {
  event_id: string; occurred_at: string | null; level: string; kind: string; type: string; message: string; fingerprint: string;
  release: string; build: string; environment: string; platform: string; pro: boolean; theme: string; sw: string; anon_id: string | null;
  frames: unknown[]; crumbs: unknown[]; tags: Record<string, string>;
};
// The schema check: returns the row to store, or a reason it was refused.
export function validate(body: unknown, now: number): { ok: true; row: Row } | { ok: false; why: string } {
  const b = isObj(body) && isObj(body.event) ? body.event : body;
  if (!isObj(b)) return { ok: false, why: "not an object" };
  if (typeof b.event_id !== "string" || !/^[0-9a-f]{32}$/.test(b.event_id)) return { ok: false, why: "event_id" };
  const exv = isObj(b.exception) && Array.isArray(b.exception.values) ? b.exception.values[0] : null;
  if (!isObj(exv) || typeof exv.type !== "string" || typeof exv.value !== "string") return { ok: false, why: "exception" };
  const fpv = Array.isArray(b.fingerprint) ? b.fingerprint[0] : "";
  if (typeof fpv !== "string" || !/^[0-9a-f]{8}$/.test(fpv)) return { ok: false, why: "fingerprint" };
  const tg = isObj(b.tags) ? b.tags : {};
  const tags: Record<string, string> = {};
  for (const k of Object.keys(tg).slice(0, 12)) tags[word(k, 20)] = word(tg[k], 40);
  const frames = (isObj(exv.stacktrace) && Array.isArray(exv.stacktrace.frames) ? exv.stacktrace.frames : []).slice(-30).filter(isObj).map(f => ({
    function: word(f.function, 80) || "?", filename: String(f.filename ?? "").replace(/[^\w.<>\[\]-]/g, "").slice(0, 40), lineno: Math.max(0, Math.min(10_000_000, Math.trunc(Number(f.lineno)) || 0)), colno: Math.max(0, Math.min(100000, Math.trunc(Number(f.colno)) || 0)),
  }));
  const bc = isObj(b.breadcrumbs) && Array.isArray(b.breadcrumbs.values) ? b.breadcrumbs.values : [];
  const CR: Record<string, RegExp> = { nav: /^[a-z][a-z0-9-]{0,23}$/, act: /^[a-z][a-z0-9-]{0,39}$/, sheet: /^open$/, sync: /^(start|ok|fail|retry)$/, error: /^[A-Za-z][\w$.]{0,40}$/ };
  const crumbs = bc.slice(-20).filter(isObj).filter(c => typeof c.category === "string" && CR[c.category] && typeof c.message === "string" && CR[c.category].test(c.message))
    .map(c => ({ category: c.category, message: c.message, t: Math.trunc(Number(c.timestamp)) || 0 }));
  const ts = Number(b.timestamp) * 1000;
  const user = isObj(b.user) ? b.user : {};
  return { ok: true, row: {
    event_id: b.event_id, occurred_at: ts > 0 && Math.abs(ts - now) < 7 * 864e5 ? new Date(ts).toISOString() : null,
    level: /^(fatal|error|warning|info)$/.test(String(b.level)) ? String(b.level) : "error",
    kind: word(tags.kind || "error", 60) || "error", type: word(exv.type, 60) || "Error", message: text(exv.value, 400), fingerprint: fpv,
    release: word(b.release, 40), build: word(tags.build, 40), environment: word(b.environment, 40) || "production",
    platform: /^(web|pwa|electron|ios-wrapper)$/.test(tags.platform) ? tags.platform : "web", pro: tags.pro === "yes", theme: word(tags.theme, 40), sw: word(tags.sw, 40),
    anon_id: typeof user.id === "string" && /^[0-9a-f]{8,32}$/.test(user.id) ? user.id : null, frames, crumbs, tags,
  } };
}

// Reads the body but stops as soon as it passes max bytes (null = too big). Content-Length alone can't be trusted (or may be missing).
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
  return new TextDecoder().decode(all);
}

async function sha(s: string): Promise<string> {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(d)].map(x => x.toString(16).padStart(2, "0")).join("").slice(0, 32);
}
function serviceKey(d: Deps): string {
  let key = d.env("SUPABASE_SERVICE_ROLE_KEY");
  if (!key) { try { const k = JSON.parse(d.env("SUPABASE_SECRET_KEYS") || "{}"); key = String(k.default || Object.values(k)[0] || ""); } catch (_e) { /* newer projects only */ } }
  return key;
}

export async function handle(req: Request, d: Deps): Promise<Response> {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);
  try {
    const raw = await readLimited(req, MAX_BODY);
    if (raw === null) return json({ error: "too large" }, 413);
    let body: unknown; try { body = JSON.parse(raw); } catch (_e) { return json({ error: "bad json" }, 400); }
    const v = validate(body, d.now());
    if (!v.ok) return json({ error: "invalid", why: v.why }, 400);
    const ip = (req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for") || "").split(",")[0].trim();
    const day = new Date(d.now()).toISOString().slice(0, 10);
    const ipHash = ip ? await sha(`${d.env("ERROR_INGEST_SALT")}|${day}|${ip}`) : null;
    const key = serviceKey(d), base = d.env("SUPABASE_URL").replace(/\/+$/, "");
    const h = { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
    const rl = await d.fetch(`${base}/rest/v1/rpc/client_errors_allow`, { method: "POST", headers: h, body: JSON.stringify({ p_anon: v.row.anon_id, p_ip: ipHash }) });
    if (!rl.ok) throw new Error("rate check " + rl.status);
    if ((await rl.json()) !== true) return json({ error: "rate_limited" }, 429, { "Retry-After": "3600" });
    const ins = await d.fetch(`${base}/rest/v1/client_errors?on_conflict=event_id`, { method: "POST", headers: { ...h, Prefer: "return=minimal,resolution=ignore-duplicates" }, body: JSON.stringify({ ...v.row, ip_hash: ipHash }) });
    if (!ins.ok && ins.status !== 409) throw new Error("insert " + ins.status);
    return json({ ok: true }, 202);
  } catch (err) {
    d.log("error-ingest failed", err instanceof Error ? err.message : "error");
    return json({ error: "server error" }, 500);
  }
}

const g = globalThis as any;
if (g.Deno?.serve) {
  const env: Env = k => g.Deno.env.get(k) ?? "";
  g.Deno.serve((req: Request) => handle(req, { env, fetch, now: Date.now, log: console.error }));
}
