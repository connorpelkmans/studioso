// Studyboard 1.11: lms-feed (Supabase Edge Function)
// Browsers aren't allowed to read another site's calendar link directly, so the website and phone app ask this
// function to fetch your Brightspace, Canvas or Blackboard calendar link for them. It only works for you when you're
// signed in to Studyboard (keep "Verify JWT" ON when you deploy; the function also checks your sign-in itself, so it stays
// safe if that switch is ever turned off), only fetches those platforms' calendar feed links (https, with the platform's
// feed path), and stores nothing.
//
// Call: POST {url, lms, hash?, etag?} with your Studyboard sign-in (lms = "brightspace", "canvas" or "blackboard").
// Returns {ok, ics, hash, etag}, or {ok, unchanged: true} when the calendar is the same as last time (the app sends the
// hash it got last time, so nothing big is sent back), or {error}. GET ?ping=1 checks it's deployed.
// Errors are short codes only (bad-url, auth, rate-limited, refused, http, too-large, not-calendar, timeout, fetch): no
// upstream status or error text is passed back. "refused" (the school site said 401, 403, 404 or 410) always carries status 403.
// Lean: each account can ask at most 60 times an hour (needs lean.sql). If the limit can't be checked, the request is refused.
//
// Where it may go: every address (the link and each redirect, at most 3, followed by hand) must be an https host name on
// port 443 whose DNS answers (A and AAAA) are all public. Private, loopback, link-local, CGNAT (100.64/10), multicast,
// documentation, benchmark and reserved IPv4 ranges, and IPv6 loopback, ULA (fc00::/7), link-local, mapped, NAT64, 6to4,
// Teredo and documentation ranges are refused. The body is read with an 8 MB cap while it arrives.

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};
const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { ...CORS, "Content-Type": "application/json" } });
const MAX = 8_000_000;
const MAX_HOPS = 3;

const PATHS: Record<string, RegExp> = {
  brightspace: /\/d2l\/le\/calendar\/feed\//i,
  canvas: /^\/feeds\/calendars\/[^/]+\.ics$/i,
  blackboard: /(\/calendarfeed\/|\.ics$)/i,
};

type Resolver = (host: string, type: "A" | "AAAA") => Promise<string[]>;
type Deps = {
  fetch: typeof fetch;
  resolve: Resolver;
  limiter: (req: Request) => Promise<boolean>;
  user: (req: Request) => Promise<string | null>;
};

// Where a link or a redirect may lead, by its text: a real https host name (never an address, localhost or an internal name) on the normal port.
export function hostOk(raw: unknown): string | null {
  try {
    const u = new URL(String(raw || ""));
    const h = u.hostname.toLowerCase();
    if (u.protocol !== "https:" || !/^[a-z0-9.-]+\.[a-z]{2,}$/.test(h)) return null;
    if (/^(localhost|\d+\.\d+\.\d+\.\d+)$/.test(h) || /(^|\.)(internal|local|localhost|localdomain|home|lan|corp|intranet)$/.test(h)) return null;
    if (u.port && u.port !== "443") return null;
    if (u.username || u.password) return null;
    return u.href;
  } catch (_e) { return null; }
}

export function feedOk(raw: unknown, lms?: unknown): string | null {
  const href = hostOk(String(raw || "").trim().replace(/^webcals?:\/\//i, "https://"));
  if (!href) return null;
  const u = new URL(href);
  const pats = typeof lms === "string" && PATHS[lms] ? [PATHS[lms]] : Object.values(PATHS);
  return pats.some(rx => rx.test(u.pathname)) ? href : null;
}

// ---------- Public addresses only ----------
function v4Public(ip: string): boolean {
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(ip.trim());
  if (!m) return false;
  const [a, b, c] = [+m[1], +m[2], +m[3]];
  if ([a, b, c, +m[4]].some(x => x > 255)) return false;
  if (a === 0 || a === 10 || a === 127 || a >= 224) return false;            // this network, private, loopback, multicast, reserved, broadcast
  if (a === 100 && b >= 64 && b <= 127) return false;                         // CGNAT 100.64/10
  if (a === 169 && b === 254) return false;                                   // link-local (cloud metadata lives here)
  if (a === 172 && b >= 16 && b <= 31) return false;                          // private
  if (a === 192 && b === 168) return false;                                   // private
  if (a === 192 && b === 0 && (c === 0 || c === 2)) return false;             // IETF protocol assignments, TEST-NET-1
  if (a === 192 && b === 88 && c === 99) return false;                        // 6to4 relay
  if (a === 198 && (b === 18 || b === 19)) return false;                      // benchmarking
  if (a === 198 && b === 51 && c === 100) return false;                       // TEST-NET-2
  if (a === 203 && b === 0 && c === 113) return false;                        // TEST-NET-3
  return true;
}
// Expands an IPv6 address to 8 numbers (null when it isn't one). A trailing dotted IPv4 part is allowed.
function v6Parts(ip: string): number[] | null {
  let s = ip.trim().toLowerCase().replace(/^\[|\]$/g, "").replace(/%.*$/, "");
  const tail = /(\d+\.\d+\.\d+\.\d+)$/.exec(s);
  if (tail) {
    const p = tail[1].split(".").map(Number);
    if (p.some(x => x > 255)) return null;
    s = s.slice(0, -tail[1].length) + ((p[0] << 8) | p[1]).toString(16) + ":" + ((p[2] << 8) | p[3]).toString(16);
  }
  if (!/^[0-9a-f:]+$/.test(s) || (s.match(/::/g) || []).length > 1) return null;
  const [l, r] = s.includes("::") ? s.split("::") : [s, null];
  const L = l ? l.split(":") : [], R = r ? r.split(":") : [];
  if (r === null && L.length !== 8) return null;
  const missing = 8 - L.length - R.length;
  if (r !== null && missing < 1) return null;
  const all = [...L, ...(r === null ? [] : Array(missing).fill("0")), ...R];
  if (all.length !== 8 || all.some(x => !/^[0-9a-f]{1,4}$/.test(x))) return null;
  return all.map(x => parseInt(x, 16));
}
function v6Public(ip: string): boolean {
  const p = v6Parts(ip);
  if (!p) return false;
  if ((p[0] & 0xe000) !== 0x2000) return false;                              // only global unicast 2000::/3 (no ::, ::1, mapped, NAT64, fc00::/7, fe80::/10, ff00::/8)
  if (p[0] === 0x2001 && p[1] === 0x0db8) return false;                      // documentation
  if (p[0] === 0x2001 && p[1] < 0x0200) return false;                        // 2001::/23 IETF special purpose (Teredo 2001::/32 included)
  if (p[0] === 0x2002) return false;                                         // 6to4 (can wrap any IPv4)
  if (p[0] === 0x3fff && p[1] < 0x1000) return false;                        // documentation 3fff::/20
  return true;
}
export function ipPublic(ip: string): boolean {
  return ip.includes(":") ? v6Public(ip) : v4Public(ip);
}

// The host name's DNS answers must exist and all be public. Anything that goes wrong means "no".
export async function dnsOk(host: string, resolve: Resolver): Promise<boolean> {
  const got: string[] = [];
  let answered = false;
  for (const t of ["A", "AAAA"] as const) {
    try { const r = await resolve(host, t); answered = true; got.push(...(r || []).map(String)); } catch (_e) { /* no records of this type */ }
  }
  return answered && got.length > 0 && got.every(ipPublic);
}

// Checks the address by text and by DNS. Returns the cleaned address, or null.
async function hopOk(raw: string, d: Deps): Promise<string | null> {
  const href = hostOk(raw);
  if (!href) return null;
  return (await dnsOk(new URL(href).hostname, d.resolve)) ? href : null;
}

// Reads the body but stops as soon as it passes max bytes (null = too big).
export async function readLimited(r: { headers: Headers; body: ReadableStream<Uint8Array> | null }, max: number): Promise<string | null> {
  const cl = Number(r.headers.get("content-length") || 0);
  if (cl > max) { try { await r.body?.cancel(); } catch (_e) { /* ignore */ } return null; }
  if (!r.body) return "";
  const reader = r.body.getReader();
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

async function sha(text: string): Promise<string> {
  const h = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)));
  return Array.from(h.slice(0, 16), b => b.toString(16).padStart(2, "0")).join("");
}

// deno-lint-ignore no-explicit-any
const envGet = (k: string): string => { try { return String((globalThis as any).Deno?.env.get(k) || ""); } catch (_e) { return ""; } };
const anonKey = () => envGet("SUPABASE_ANON_KEY") || envGet("SUPABASE_PUBLISHABLE_KEY");

// Who is asking: the sign-in in the Authorization header, checked with Supabase Auth. null = not signed in.
export async function userFrom(req: Request, fetcher: typeof fetch = fetch): Promise<string | null> {
  try {
    const base = envGet("SUPABASE_URL").replace(/\/+$/, ""), anon = anonKey();
    const auth = req.headers.get("Authorization") || "";
    if (!base || !anon || !/^Bearer\s+eyJ/i.test(auth)) return null;
    const r = await fetcher(base + "/auth/v1/user", { headers: { apikey: anon, Authorization: auth } });
    if (!r.ok) return null;
    const u = await r.json().catch(() => null);
    return u && typeof u.id === "string" && u.id ? u.id : null;
  } catch (_e) { return null; }
}

// Counts this request against the signed-in account's hourly limit. If the limit can't be checked, the answer is "no".
export async function rateOk(req: Request, fetcher: typeof fetch = fetch): Promise<boolean> {
  try {
    const base = envGet("SUPABASE_URL").replace(/\/+$/, ""), anon = anonKey();
    const auth = req.headers.get("Authorization") || "";
    if (!base || !anon || !auth) return false;
    const r = await fetcher(base + "/rest/v1/rpc/studyboard_rate_me", { method: "POST", headers: { apikey: anon, Authorization: auth, "Content-Type": "application/json" }, body: JSON.stringify({ p_what: "lms-feed", p_max: 60, p_window: 3600 }) });
    if (!r.ok) return false;
    return (await r.json()) === true;
  } catch (_e) { return false; }
}

// deno-lint-ignore no-explicit-any
const denoResolve: Resolver = (host, type) => (globalThis as any).Deno.resolveDns(host, type);

export async function handle(req: Request, deps: Partial<Deps> = {}): Promise<Response> {
  const d: Deps = {
    fetch: deps.fetch || fetch,
    resolve: deps.resolve || denoResolve,
    limiter: deps.limiter || (r => rateOk(r)),
    user: deps.user || (r => userFrom(r)),
  };
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  const url = new URL(req.url);
  if (req.method === "GET" && url.searchParams.get("ping")) return json({ app: "studyboard-lms-feed", ok: true });
  if (req.method !== "POST") return json({ error: "method" }, 405);
  if (!(await d.user(req))) return json({ error: "auth" }, 401);
  let body: any = {};
  try { const raw = await readLimited(req, 20_000); if (raw === null) return json({ error: "bad-request" }, 413); body = JSON.parse(raw); }
  catch (_e) { return json({ error: "bad-request" }, 400); }
  const href = feedOk(body && body.url, body && body.lms);
  if (!href) return json({ error: "bad-url" }, 400);
  if (!(await d.limiter(req))) return json({ error: "rate-limited" }, 429);
  const lastHash = typeof body.hash === "string" ? body.hash.slice(0, 64) : "";
  const lastTag = typeof body.etag === "string" ? body.etag.slice(0, 200) : "";
  const ctl = new AbortController();
  const tm = setTimeout(() => ctl.abort(), 25_000);
  try {
    const headers: Record<string, string> = { Accept: "text/calendar, */*", "User-Agent": "Studyboard calendar reader" };
    if (lastTag && lastHash) headers["If-None-Match"] = lastTag;
    // Every hop (the link itself and each redirect) is checked by text and by DNS before it is fetched, and redirects
    // are followed by hand, so neither the link nor a redirect can send this function to an internal address.
    let cur = await hopOk(href, d);
    if (!cur) return json({ error: "bad-url" }, 400);
    let r: Response = await d.fetch(cur, { headers, redirect: "manual", signal: ctl.signal });
    for (let hop = 0; r.status >= 300 && r.status < 400 && r.status !== 304; hop++) {
      const loc = r.headers.get("Location");
      try { await r.body?.cancel(); } catch (_e) { /* ignore */ }
      if (!loc || hop >= MAX_HOPS) return json({ error: "fetch" }, 200);
      let next: string | null = null;
      try { next = await hopOk(new URL(loc, cur).href, d); } catch (_e) { next = null; }
      if (!next) return json({ error: "bad-url" }, 200);
      cur = next;
      r = await d.fetch(cur, { headers, redirect: "manual", signal: ctl.signal });
    }
    if (r.status === 304 && lastHash) return json({ ok: true, unchanged: true, hash: lastHash, etag: lastTag });
    if (!r.ok) {
      try { await r.body?.cancel(); } catch (_e) { /* ignore */ }
      return [401, 403, 404, 410].includes(r.status) ? json({ error: "refused", status: 403 }, 200) : json({ error: "http" }, 200);
    }
    const text = await readLimited(r, MAX);
    if (text === null) return json({ error: "too-large" }, 200);
    if (!/BEGIN:VCALENDAR/i.test(text)) return json({ error: "not-calendar" }, 200);
    const hash = await sha(text), etag = (r.headers.get("ETag") || "").slice(0, 200);
    if (lastHash && hash === lastHash) return json({ ok: true, unchanged: true, hash, etag });
    return json({ ok: true, ics: text, hash, etag });
  } catch (e) {
    return json({ error: (e as Error)?.name === "AbortError" ? "timeout" : "fetch" }, 200);
  } finally { clearTimeout(tm); }
}

// deno-lint-ignore no-explicit-any
const D = (globalThis as any).Deno;
if (D && typeof D.serve === "function") D.serve((req: Request) => handle(req));
