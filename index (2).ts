// Studyboard 1.11: lms-feed (Supabase Edge Function)
// Browsers aren't allowed to read another site's calendar link directly, so the website and phone app ask this
// function to fetch your Brightspace, Canvas or Blackboard calendar link for them. It only works for you when you're
// signed in to Studyboard (keep "Verify JWT" ON when you deploy), only fetches those platforms' calendar feed links
// (https, with the platform's feed path), and stores nothing.
//
// Call: POST {url, lms, hash?, etag?} with your Studyboard sign-in (lms = "brightspace", "canvas" or "blackboard").
// Returns {ok, ics, hash, etag}, or {ok, unchanged: true} when the calendar is the same as last time (the app sends the
// hash it got last time, so nothing big is sent back), or {error}. GET ?ping=1 checks it's deployed.
// Lean: each account can ask at most 60 times an hour (needs lean.sql; skipped without it).

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};
const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { ...CORS, "Content-Type": "application/json" } });
const MAX = 8_000_000;

const PATHS: Record<string, RegExp> = {
  brightspace: /\/d2l\/le\/calendar\/feed\//i,
  canvas: /^\/feeds\/calendars\/[^/]+\.ics$/i,
  blackboard: /(\/calendarfeed\/|\.ics$)/i,
};

export function feedOk(raw: unknown, lms?: unknown): string | null {
  try {
    const u = new URL(String(raw || "").trim().replace(/^webcals?:\/\//i, "https://"));
    const h = u.hostname.toLowerCase();
    if (u.protocol !== "https:" || !/^[a-z0-9.-]+\.[a-z]{2,}$/.test(h)) return null;
    if (/^(localhost|\d+\.\d+\.\d+\.\d+)$/.test(h) || /(^|\.)(internal|local|localhost)$/.test(h)) return null;
    if (u.port && u.port !== "443") return null;
    const pats = typeof lms === "string" && PATHS[lms] ? [PATHS[lms]] : Object.values(PATHS);
    if (!pats.some(rx => rx.test(u.pathname))) return null;
    return u.href;
  } catch (_e) { return null; }
}

async function sha(text: string): Promise<string> {
  const h = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)));
  return Array.from(h.slice(0, 16), b => b.toString(16).padStart(2, "0")).join("");
}

// Counts this request against the signed-in account's hourly limit. Anything missing (like lean.sql) means "allowed".
export async function rateOk(req: Request, fetcher: typeof fetch = fetch): Promise<boolean> {
  try {
    const env = (globalThis as any).Deno?.env;
    const base = String(env?.get("SUPABASE_URL") || "").replace(/\/+$/, ""), anon = String(env?.get("SUPABASE_ANON_KEY") || "");
    const auth = req.headers.get("Authorization") || "";
    if (!base || !anon || !auth) return true;
    const r = await fetcher(base + "/rest/v1/rpc/studyboard_rate_me", { method: "POST", headers: { apikey: anon, Authorization: auth, "Content-Type": "application/json" }, body: JSON.stringify({ p_what: "lms-feed", p_max: 60, p_window: 3600 }) });
    if (!r.ok) return true;
    return (await r.json()) !== false;
  } catch (_e) { return true; }
}

export async function handle(req: Request, fetcher: typeof fetch = fetch, limiter: (r: Request) => Promise<boolean> = r => rateOk(r)): Promise<Response> {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  const url = new URL(req.url);
  if (req.method === "GET" && url.searchParams.get("ping")) return json({ app: "studyboard-lms-feed", ok: true });
  if (req.method !== "POST") return json({ error: "method" }, 405);
  let body: any = {};
  try { body = await req.json(); } catch (_e) { return json({ error: "bad-request" }, 400); }
  const href = feedOk(body && body.url, body && body.lms);
  if (!href) return json({ error: "bad-url" }, 400);
  if (!(await limiter(req))) return json({ error: "rate-limited" }, 429);
  const lastHash = typeof body.hash === "string" ? body.hash.slice(0, 64) : "";
  const lastTag = typeof body.etag === "string" ? body.etag.slice(0, 200) : "";
  const ctl = new AbortController();
  const tm = setTimeout(() => ctl.abort(), 25_000);
  try {
    const headers: Record<string, string> = { Accept: "text/calendar, */*", "User-Agent": "Studyboard calendar reader" };
    if (lastTag && lastHash) headers["If-None-Match"] = lastTag;
    const r = await fetcher(href, { headers, redirect: "follow", signal: ctl.signal });
    if (r.status === 304 && lastHash) return json({ ok: true, unchanged: true, hash: lastHash, etag: lastTag });
    if (!r.ok) return json({ error: "http", status: r.status }, 200);
    const text = await r.text();
    if (text.length > MAX) return json({ error: "too-large" }, 200);
    if (!/BEGIN:VCALENDAR/i.test(text)) return json({ error: "not-calendar" }, 200);
    const hash = await sha(text), etag = r.headers.get("ETag") || "";
    if (lastHash && hash === lastHash) return json({ ok: true, unchanged: true, hash, etag });
    return json({ ok: true, ics: text, hash, etag });
  } catch (e) {
    return json({ error: (e as Error)?.name === "AbortError" ? "timeout" : "fetch", detail: String((e as Error)?.message || e).slice(0, 200) }, 200);
  } finally { clearTimeout(tm); }
}

// deno-lint-ignore no-explicit-any
const D = (globalThis as any).Deno;
if (D && typeof D.serve === "function") D.serve((req: Request) => handle(req));
