// Studyboard: capture-email (Supabase Edge Function)  ·  Email to Studyboard (Pro)
// The email-capture Cloudflare Worker (cloudflare/email-capture) receives mail sent to <key>@<your inbound domain>, reads the MIME and
// posts the subject and text here. This function only checks the Worker's shared secret, finds the address key and hands the email to
// capture_add_email() in supabase-capture.sql, which checks the key, Pro, the limits and the Message-ID, and puts one row in the
// owner's capture inbox. The app reads it and always shows what it found to check first. Nothing else can be done with this function.
//
// Deploy with "Verify JWT" turned OFF (the Worker has no Supabase sign-in). Secrets: EMAIL_CAPTURE_SECRET, a long random string
// (32+ characters) that is ALSO set on the Worker (npx wrangler secret put EMAIL_CAPTURE_SECRET). Supabase adds the URL and service key.
//
// Request:  POST, header X-Studyboard-Email-Secret: <the secret>
//   JSON {"to": "k7m2p9x4qrst@in.example.com", "from": "prof@school.edu", "subject": "...", "text": "...", "id": "<message-id>"}  (64 KB at most)
// Answer:   200 {ok:true, dup}                       the email is in the inbox (or was already)
//           404 {ok:false, error:"unknown"}          no such address (never made, replaced or turned off): the Worker bounces it
//           402 {ok:false, error:"pro_required"}     the owner's Pro ended: the Worker bounces it with that reason
//           429 {ok:false, error:"rate_limited" | "inbox_full"}, Retry-After: the Worker asks the sender's server to try later
//           400 bad request · 401 wrong or missing secret · 500 anything else (the Worker asks to try later)
// Logs are one line of JSON per request, never the address key, the sender, the subject or the text.

type Env = (k: string) => string;
type Deps = { env: Env; fetch: typeof fetch; now: () => number; log: (...a: unknown[]) => void };

export const MAX_BODY = 64 * 1024;
export const KEY_RE = /^[a-hj-km-np-z2-9]{12}$/;
const reply = (o: unknown, status: number, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(o), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...extra } });

function serviceKey(d: Deps): string {
  let key = d.env("SUPABASE_SERVICE_ROLE_KEY");
  if (!key) { try { const k = JSON.parse(d.env("SUPABASE_SECRET_KEYS") || "{}"); key = String(k.default || Object.values(k)[0] || ""); } catch (_e) { /* newer projects only */ } }
  return key;
}
const base = (d: Deps) => d.env("SUPABASE_URL").replace(/\/+$/, "");

// Constant-time comparison of two strings (as UTF-8 bytes); different lengths are simply unequal
export function sameSecret(a: string, b: string): boolean {
  const x = new TextEncoder().encode(a), y = new TextEncoder().encode(b);
  if (x.length !== y.length || !x.length) return false;
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}
// The address key from the recipient: the part before @, lower case, without a +tag ("K7M2P9X4QRST+bio@in.x" -> "k7m2p9x4qrst")
export function keyOf(to: unknown): string | null {
  const m = /^\s*<?([^@\s<>]+)@[^@\s<>]+>?\s*$/.exec(String(to || ""));
  if (!m) return null;
  const k = m[1].toLowerCase().split("+")[0];
  return KEY_RE.test(k) ? k : null;
}
const str = (v: unknown, n: number) => typeof v === "string" ? v.slice(0, n) : "";

async function readLimited(req: Request, max: number): Promise<string | null> {
  const cl = Number(req.headers.get("content-length") || 0);
  if (cl > max) return null;
  if (!req.body) return "";
  const reader = req.body.getReader(); const chunks: Uint8Array[] = []; let n = 0;
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

export async function handle(req: Request, d: Deps): Promise<Response> {
  const t0 = d.now();
  const log = (outcome: string, extra: Record<string, unknown> = {}) => d.log(JSON.stringify({ fn: "capture-email", outcome, ms: d.now() - t0, ...extra }));
  if (req.method !== "POST") return reply({ ok: false, error: "method not allowed" }, 405);
  const secret = d.env("EMAIL_CAPTURE_SECRET");
  if (secret.length < 32) { log("not_configured"); return reply({ ok: false, error: "not configured" }, 500); }
  if (!sameSecret(req.headers.get("x-studyboard-email-secret") || "", secret)) { log("bad_secret"); return reply({ ok: false, error: "unauthorized" }, 401); }
  try {
    const raw = await readLimited(req, MAX_BODY);
    if (raw === null) { log("too_big"); return reply({ ok: false, error: "too large" }, 413); }
    let b: Record<string, unknown>;
    try { b = JSON.parse(raw); } catch (_e) { b = {}; }
    if (!b || typeof b !== "object" || Array.isArray(b)) { log("bad_body"); return reply({ ok: false, error: "bad request" }, 400); }
    const key = keyOf(b.to);
    if (!key) { log("unknown", { why: "address" }); return reply({ ok: false, error: "unknown" }, 404); }
    const k = serviceKey(d);
    const r = await d.fetch(`${base(d)}/rest/v1/rpc/capture_add_email`, {
      method: "POST",
      headers: { apikey: k, Authorization: `Bearer ${k}`, "Content-Type": "application/json" },
      body: JSON.stringify({ p_key: key, p_from: str(b.from, 200), p_subject: str(b.subject, 1000), p_body: str(b.text, 20000), p_msgid: str(b.id, 200) || null }),
    });
    if (!r.ok) throw new Error(`capture_add_email ${r.status}`);
    const out = await r.json() as { ok?: boolean; dup?: boolean; error?: string; retry_after?: number };
    if (out.ok) { log(out.dup ? "duplicate" : "added", { len: str(b.text, 20000).length }); return reply({ ok: true, dup: !!out.dup }, 200); }
    if (out.error === "unknown") { log("unknown"); return reply({ ok: false, error: "unknown" }, 404); }
    if (out.error === "pro_required") { log("pro_required"); return reply({ ok: false, error: "pro_required" }, 402); }
    if (out.error === "rate_limited" || out.error === "inbox_full") { log(out.error); return reply({ ok: false, error: out.error }, 429, { "Retry-After": String(out.retry_after || 3600) }); }
    if (out.error === "bad_input") { log("bad_input"); return reply({ ok: false, error: "bad request" }, 400); }
    throw new Error("unexpected answer");
  } catch (err) {
    log("error", { msg: err instanceof Error ? err.message.slice(0, 80) : "error" });
    return reply({ ok: false, error: "server error" }, 500);
  }
}

const g = globalThis as any;
if (g.Deno?.serve) {
  const env: Env = k => g.Deno.env.get(k) ?? "";
  g.Deno.serve((req: Request) => handle(req, { env, fetch, now: Date.now, log: console.error }));
}
