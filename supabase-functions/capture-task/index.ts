// Studyboard: capture-task (Supabase Edge Function)
// Lets a phone assistant or shortcut ("Hey Siri, Add to Studyboard", a Gemini or Bixby routine, an HTTP shortcut app) drop ONE short
// task text into the person's Studyboard inbox. The app picks it up the next time it opens and turns it into a normal task.
//
// Deploy with "Verify JWT" turned OFF (callers have no Supabase session). The only credential is a CAPTURE TOKEN made in the app
// (Settings > Quick capture > Voice assistants & shortcuts). Secrets: none of your own (Supabase adds SUPABASE_URL and the service key).
// The token can only add inbox items. Only its SHA-256 hash is stored; this function hashes what it receives and the database
// looks the hash up (no string compare in code). Unknown and revoked tokens get the same generic answer.
//
// Request (POST):  Authorization: Bearer sbc_...     (or X-Studyboard-Token: sbc_...)
//   JSON  {"text":"Read chapter 4","due":"friday 5pm" | "2026-10-09" | "2026-10-09T17:00","course":"Bio 101","source":"siri","id":"<idempotency key>"}
//   or application/x-www-form-urlencoded with the same field names.  Max body 4 KB.
//   Natural-language "due" is NOT parsed here: it is stored as text and the app (which knows the time zone and course list) reads it.
//   Idempotency: "Idempotency-Key" header or "id" field; the same key within 10 minutes adds nothing twice (Siri retries).
// GET ?token=...&text=...  only works for tokens the owner switched on "allow GET" (URLs get logged). The query string is never logged here.
// HEAD or GET ?ping=1: health check, no token needed.
// Answer: {ok:true, message:"Added to your Studyboard inbox", speech:"Added to Studyboard: ..."}  (Siri's Speak action can say "speech").

type Env = (k: string) => string;
type Deps = { env: Env; fetch: typeof fetch; now: () => number; log: (...a: unknown[]) => void };

export const MAX_BODY = 4096;
const TOKEN_RE = /^sbc_[A-Za-z0-9_-]{30,80}$/;
const CORS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",   // callers are phones and the website; auth is a bearer token, never a cookie
  "Access-Control-Allow-Headers": "authorization, content-type, x-studyboard-token, idempotency-key, x-client-info, apikey",
  "Access-Control-Allow-Methods": "GET, HEAD, POST, OPTIONS",
  "Access-Control-Expose-Headers": "Retry-After, X-RateLimit-Limit, X-RateLimit-Remaining",
  "Access-Control-Max-Age": "600",
};
const reply = (o: unknown, status: number, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(o), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...CORS, ...extra } });
const fail = (status: number, error: string, extra: Record<string, string> = {}) =>
  reply({ ok: false, error, speech: "Sorry, Studyboard could not add that." }, status, extra);

function serviceKey(d: Deps): string {
  let key = d.env("SUPABASE_SERVICE_ROLE_KEY");
  if (!key) { try { const k = JSON.parse(d.env("SUPABASE_SECRET_KEYS") || "{}"); key = String(k.default || Object.values(k)[0] || ""); } catch (_e) { /* newer projects only */ } }
  return key;
}
const base = (d: Deps) => d.env("SUPABASE_URL").replace(/\/+$/, "");

export async function sha256Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf), b => b.toString(16).padStart(2, "0")).join("");
}

// Reads at most `max` bytes (a chunked upload can't dodge the Content-Length check). Returns null when it is too big.
async function readLimited(req: Request, max: number): Promise<string | null> {
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

const str = (v: unknown): string | undefined => typeof v === "string" ? v : typeof v === "number" && isFinite(v) ? String(v) : undefined;
const pick = (o: Record<string, unknown>, ...keys: string[]): string | undefined => {
  for (const k of keys) { const s = str(o[k]); if (s !== undefined && s.trim() !== "") return s; }
  return undefined;
};

function validDate(y: number, m: number, d: number): boolean {
  const t = new Date(Date.UTC(y, m - 1, d));
  return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d;
}
const validTime = (hh: number, mm: number) => hh >= 0 && hh <= 23 && mm >= 0 && mm <= 59;

// Pure: ISO dates (and ISO date+time) become real fields; anything else stays raw text for the app's own parser. Exported for tests.
export function parseDue(due?: string, dueTime?: string): { date: string | null; time: string | null; text: string | null } {
  let date: string | null = null, time: string | null = null, text: string | null = null;
  const d = (due || "").trim();
  if (d) {
    const m = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?)?$/.exec(d);
    if (m && validDate(+m[1], +m[2], +m[3])) {
      date = `${m[1]}-${m[2]}-${m[3]}`;
      if (m[4] !== undefined && validTime(+m[4], +m[5])) time = `${m[4]}:${m[5]}`;
    } else text = d.slice(0, 60);
  }
  const t = (dueTime || "").trim();
  if (t && date && !time) { const m = /^(\d{1,2}):(\d{2})/.exec(t); if (m && validTime(+m[1], +m[2])) time = `${m[1].padStart(2, "0")}:${m[2]}`; }
  return { date, time, text };
}

function speechFor(text: string): string {
  const t = text.replace(/\s+/g, " ").trim();
  return "Added to Studyboard: " + (t.length > 60 ? t.slice(0, 57).trimEnd() + "..." : t);
}

export async function handle(req: Request, d: Deps): Promise<Response> {
  const t0 = d.now();
  const url = new URL(req.url);
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (req.method === "HEAD" || (req.method === "GET" && url.searchParams.get("ping") === "1")) {
    return req.method === "HEAD" ? new Response(null, { status: 200, headers: { "Cache-Control": "no-store", ...CORS } }) : reply({ ok: true, service: "studyboard-capture", scope: "add_task" }, 200);
  }
  if (req.method !== "POST" && req.method !== "GET") return fail(405, "method not allowed");
  const via = req.method === "GET" ? "get" : "post";
  const log = (outcome: string, extra: Record<string, unknown> = {}) => d.log(JSON.stringify({ fn: "capture-task", method: req.method, outcome, ms: d.now() - t0, ...extra }));
  try {
    // ---- token (header; query only for GET)
    let token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim() || (req.headers.get("x-studyboard-token") || "").trim();
    if (!token && via === "get") token = (url.searchParams.get("token") || "").trim();
    if (!token || !TOKEN_RE.test(token)) { log("no_token"); return fail(401, "unauthorized"); }

    // ---- fields
    let f: Record<string, unknown> = {};
    if (via === "get") {
      for (const [k, v] of url.searchParams) if (k !== "token") f[k] = v;
    } else {
      const raw = await readLimited(req, MAX_BODY);
      if (raw === null) { log("too_big"); return fail(413, "request too large (4 KB max)"); }
      const ct = (req.headers.get("content-type") || "").toLowerCase();
      if (ct.includes("application/x-www-form-urlencoded")) {
        for (const [k, v] of new URLSearchParams(raw)) f[k] = v;
      } else if (raw.trim() !== "") {
        let parsed: unknown;
        try { parsed = JSON.parse(raw); } catch (_e) { parsed = null; }
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) { log("bad_body"); return fail(400, "send JSON like {\"text\":\"Read chapter 4\"}"); }
        f = parsed as Record<string, unknown>;
      }
    }
    const text = pick(f, "text", "task", "title", "input");
    if (!text || !text.replace(/[\s\u0000-\u001f\u007f-\u009f]/g, "")) { log("no_text"); return fail(400, "text is required"); }
    if (text.length > 500) { log("text_long"); return fail(400, "text is too long (500 characters max)"); }
    const course = pick(f, "course", "class", "subject");
    if (course && course.length > 60) { log("course_long"); return fail(400, "course is too long (60 characters max)"); }
    const due = parseDue(pick(f, "due", "due_date", "when"), pick(f, "due_time", "time"));
    const source = (pick(f, "source") || "api").slice(0, 24);
    const idem = (req.headers.get("idempotency-key") || pick(f, "id", "idempotency_key") || "").trim().slice(0, 80) || null;

    // ---- the database does the token check, limits and the insert
    const key = serviceKey(d);
    const r = await d.fetch(`${base(d)}/rest/v1/rpc/capture_add`, {
      method: "POST",
      headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        p_token_hash: await sha256Hex(token), p_text: text, p_due_date: due.date, p_due_time: due.time, p_course_hint: course ?? null,
        p_source: source, p_idem: idem, p_due_text: due.text, p_via: via,
      }),
    });
    if (!r.ok) throw new Error(`capture_add ${r.status}`);
    const out = await r.json() as { ok?: boolean; id?: string; dup?: boolean; error?: string; retry_after?: number; limit_hour?: number; remaining_hour?: number };
    const rl: Record<string, string> = {};
    if (typeof out.limit_hour === "number") rl["X-RateLimit-Limit"] = String(out.limit_hour);
    if (typeof out.remaining_hour === "number") rl["X-RateLimit-Remaining"] = String(Math.max(0, out.remaining_hour));
    if (out.ok) {
      log(out.dup ? "duplicate" : "added", { source, len: text.length });
      return reply({ ok: true, message: "Added to your Studyboard inbox", speech: speechFor(text), duplicate: !!out.dup }, 200, rl);
    }
    // invalid, revoked and "GET not switched on" all look the same: no token oracle
    if (out.error === "invalid_token" || out.error === "get_disabled") { log("unauthorized", { why: out.error }); return fail(401, "unauthorized"); }
    if (out.error === "rate_limited") { log("rate_limited"); return reply({ ok: false, error: "too many captures, try again later", speech: "Studyboard is getting too many requests. Try again later." }, 429, { ...rl, "Retry-After": String(out.retry_after || 600) }); }
    if (out.error === "inbox_full") { log("inbox_full"); return reply({ ok: false, error: "inbox is full, open Studyboard to sync it", speech: "Your Studyboard inbox is full. Open the app to sync it." }, 429, { ...rl, "Retry-After": String(out.retry_after || 3600) }); }
    if (out.error === "bad_input") { log("bad_input"); return fail(400, "text or course is not valid"); }
    throw new Error("unexpected answer");
  } catch (err) {
    log("error", { msg: err instanceof Error ? err.message.slice(0, 80) : "error" });
    return fail(500, "server error, please retry");
  }
}

const g = globalThis as any;
if (g.Deno?.serve) {
  const env: Env = k => g.Deno.env.get(k) ?? "";
  g.Deno.serve((req: Request) => handle(req, { env, fetch, now: Date.now, log: console.error }));
}
