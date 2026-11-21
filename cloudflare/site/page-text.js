// GET /api/page-text?url=<a web page>: the page's readable text, for "Cards From a Link" on the website, where the browser can't
// fetch another site itself. Only the extracted text goes back (src/js/01-page-text.js, the same code the iPhone app runs on pages it
// fetches itself), never the page: so this is no general-purpose proxy.
// Guards: only Studyboard's own pages and apps may call it (Origin), a rate limit per visitor (the PAGE_LIMIT binding, when set up),
// only ordinary public web addresses (checked again at every redirect, at most 5), only HTML or plain text, at most 2 MB read, 10
// seconds, no cookies sent or kept. Answers are cached for an hour. Nothing is logged or stored.
// A site that turns readers away (or a page built in the browser) may be read from the Internet Archive's copy instead, labelled
// with its date: only on a student's request, one page, through the Wayback Machine's lookup, never for a page behind a login or
// paywall, and never a copy marked as paid content. ARCHIVE_OFF = "1" turns this off.
import "../../src/js/01-page-text.js";
const P = globalThis.SBPAGE;
export const PAGE_ORIGINS = ["https://studyboardapp.com", "https://www.studyboardapp.com", "capacitor://localhost", "app://studioso"];
const UA = "Mozilla/5.0 (compatible; StudyboardReader/1.0; +https://studyboardapp.com/website/reader)";
const out = (body, status, origin) => new Response(JSON.stringify(body), {status, headers: {
  "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff",
  ...(origin ? {"access-control-allow-origin": origin, "vary": "Origin"} : {})}});
// Read at most max bytes of a body, then stop
async function readCapped(res, max){
  const reader = res.body && res.body.getReader(); if (!reader) return {text: await res.text(), big: false};
  const chunks = []; let n = 0, big = false;
  for (;;) { const {done, value} = await reader.read(); if (done) break; n += value.length; if (n > max) { big = true; chunks.push(value.slice(0, value.length - (n - max))); try { await reader.cancel(); } catch (e) {} break; } chunks.push(value); }
  const all = new Uint8Array(chunks.reduce((a, c) => a + c.length, 0)); let o = 0; for (const c of chunks) { all.set(c, o); o += c.length; }
  const cs = (/charset=([\w-]+)/i.exec(res.headers.get("content-type") || "") || [])[1] || "utf-8";
  let text; try { text = new TextDecoder(cs, {fatal: false}).decode(all); } catch (e) { text = new TextDecoder().decode(all); }
  return {text, big};
}
const NEVER = "script,style,noscript,template,svg,canvas,iframe,object,embed,select,button,form,nav,footer,aside,header,menu,dialog,figure,link,meta:not([property='og:title'])";
function lean(res){
  if (typeof HTMLRewriter === "undefined") return res;
  try { return new HTMLRewriter().on(NEVER, {element(e){ e.remove(); }}).on("*", {comments(c){ c.remove(); }}).transform(res); } catch (e) { return res; }
}
// The Internet Archive's most recent copy of a page, read the same way (no toolbar: the id_ form is the page as it was captured)
const ARCHIVE_HOSTS = new Set(["web.archive.org", "archive.org"]);
const PAID = /"isAccessibleForFree"\s*:\s*"?false"?|isAccessibleForFree["']?\s+content=["']false|<meta[^>]+(content_tier|article:content_tier)["'][^>]*content=["'](locked|metered|premium)/i;
async function fromArchive(u, fetchFn, signal){
  const look = await fetchFn("https://archive.org/wayback/available?url=" + encodeURIComponent(u.href), {signal, headers: {"user-agent": UA, "accept": "application/json"}});
  if (!look.ok) return null;
  const snap = (((await look.json().catch(() => ({}))) || {}).archived_snapshots || {}).closest;
  if (!snap || !snap.available || !/^\d{14}$/.test(String(snap.timestamp || "")) || String(snap.status || "200") !== "200") return null;
  // a copy older than three years is too likely to be out of date to study from
  const ts = String(snap.timestamp), when = Date.UTC(+ts.slice(0, 4), +ts.slice(4, 6) - 1, +ts.slice(6, 8));
  if (Date.now() - when > 3 * 365 * 864e5) return null;
  let a = new URL(`https://web.archive.org/web/${ts}id_/${u.href}`), res;
  for (let hop = 0; ; hop++) {
    res = await fetchFn(a.href, {redirect: "manual", signal, headers: {"user-agent": UA, "accept": "text/html,application/xhtml+xml"}});
    if (res.status >= 300 && res.status < 400 && res.headers.get("location") && hop < 3) { const n = new URL(res.headers.get("location"), a); if (!ARCHIVE_HOSTS.has(n.hostname)) return null; a = n; continue; }
    break;
  }
  if (!res.ok || !/text\/html|xhtml/i.test(res.headers.get("content-type") || "text/html")) return null;
  // read whole (not pre-stripped): whether it's paid content is in its metadata and structured data, which stripping removes
  const body = await readCapped(res, P.MAX_HTML), raw = body.text;
  if (PAID.test(raw)) return null;
  const r = P.extract(raw, u.href);
  if (r.status !== "ok") return null;
  return Object.assign({}, r, {cut: r.cut || body.big, archived: {date: new Date(when).toISOString().slice(0, 10), url: `https://web.archive.org/web/${ts}/${u.href}`}});
}
export async function handlePageText(request, env, ctx, fetchFn = fetch){
  const origin = request.headers.get("origin") || "", allowed = PAGE_ORIGINS.includes(origin) || (env && env.PAGE_TEXT_DEV_ORIGIN && origin === env.PAGE_TEXT_DEV_ORIGIN);
  if (request.method === "OPTIONS") return new Response(null, {status: allowed ? 204 : 403, headers: allowed ? {"access-control-allow-origin": origin, "access-control-allow-methods": "GET", "access-control-max-age": "86400", "vary": "Origin"} : {}});
  if (request.method !== "GET") return out({status: "bad"}, 405, allowed ? origin : "");
  // same-site requests from the website itself may come without an Origin header; anything else must name an allowed one
  const sameSite = !origin && (request.headers.get("sec-fetch-site") === "same-origin");
  if (!allowed && !sameSite) return out({status: "forbidden"}, 403, "");
  const ip = request.headers.get("cf-connecting-ip") || "";
  if (env && env.PAGE_LIMIT && typeof env.PAGE_LIMIT.limit === "function") { try { const r = await env.PAGE_LIMIT.limit({key: "page:" + ip}); if (!r.success) return out({status: "busy"}, 429, allowed ? origin : ""); } catch (e) {} }
  let u = P.safeUrl(new URL(request.url).searchParams.get("url"));
  if (!u) return out({status: "bad"}, 400, allowed ? origin : "");
  const cache = typeof caches !== "undefined" ? caches.default : null, key = new Request("https://page-text.cache/" + encodeURIComponent(u.href));
  if (cache) { try { const hit = await cache.match(key); if (hit) { const r = new Response(hit.body, hit); if (allowed) { r.headers.set("access-control-allow-origin", origin); r.headers.set("vary", "Origin"); } return r; } } catch (e) {} }
  const ac = new AbortController(), timer = setTimeout(() => ac.abort(), 10000);
  let res;
  try {
    for (let hop = 0; ; hop++) {
      res = await fetchFn(u.href, {redirect: "manual", signal: ac.signal, headers: {"user-agent": UA, "accept": "text/html,application/xhtml+xml,text/plain;q=0.9", "accept-language": "en;q=0.9, *;q=0.5"}});
      if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
        if (hop >= 5) return out({status: "unreachable", why: "redirects"}, 200, allowed ? origin : "");
        const next = P.safeUrl(new URL(res.headers.get("location"), u).href);
        if (!next) return out({status: "unreachable", why: "redirect"}, 200, allowed ? origin : "");
        u = next; continue;
      }
      break;
    }
  } catch (e) { clearTimeout(timer); return out({status: "unreachable", why: ac.signal.aborted ? "timeout" : "fetch"}, 200, allowed ? origin : ""); }
  // 401: a login. 403 and 429: the site turns automated readers away (Britannica does). 402 is meant for paywalls, but some free
  // sites send it to every reader that isn't a browser (Investopedia does): those may use the archive's copy, which is checked for
  // the marks real paywalls carry (Google's isAccessibleForFree: false) and refused if it has them
  if (res.status === 401) { clearTimeout(timer); return out({status: "paywall", http: res.status}, 200, allowed ? origin : ""); }
  const archiveOn = !(env && String(env.ARCHIVE_OFF || "") === "1");
  const tryArchive = async (fallback) => {
    clearTimeout(timer);
    const ac2 = new AbortController(), t2 = setTimeout(() => ac2.abort(), 10000);
    if (archiveOn) { try { const a = await fromArchive(u, fetchFn, ac2.signal).finally(() => clearTimeout(t2)); if (a) { clearTimeout(timer); const resp = out(Object.assign({}, a, {url: u.href}), 200, allowed ? origin : ""); if (cache) { try { const c = new Response(JSON.stringify(Object.assign({}, a, {url: u.href})), {headers: {"content-type": "application/json; charset=utf-8", "cache-control": "max-age=3600"}}); (ctx && ctx.waitUntil ? ctx.waitUntil.bind(ctx) : p => p)(cache.put(key, c)); } catch (e) {} } return resp; } } catch (e) {} }
    clearTimeout(t2); return out(fallback, 200, allowed ? origin : "");
  };
  if (res.status === 403 || res.status === 429) return tryArchive({status: "blocked", http: res.status});
  if (res.status === 402) return tryArchive({status: "paywall", http: 402});
  if (!res.ok) { clearTimeout(timer); return out({status: "unreachable", http: res.status}, 200, allowed ? origin : ""); }
  const type = (res.headers.get("content-type") || "").toLowerCase();
  if (/application\/pdf/.test(type)) { clearTimeout(timer); return out({status: "pdf"}, 200, allowed ? origin : ""); }
  if (type && !/text\/html|application\/xhtml|text\/plain/.test(type)) { clearTimeout(timer); return out({status: "not_page", type: type.split(";")[0]}, 200, allowed ? origin : ""); }
  // On Cloudflare, the parts that are never content (scripts, styles, menus, footers and the like) are dropped by the built-in HTML
  // rewriter as the page streams in, before any JavaScript sees it: the free plan allows only 10 ms of CPU per request, and those
  // parts are most of a modern page's size. The rest is read up to the size cap.
  let body;
  try { body = await readCapped(/text\/html|xhtml/.test(type) ? lean(res) : res, P.MAX_HTML); } catch (e) { clearTimeout(timer); return out({status: "unreachable", why: "read"}, 200, allowed ? origin : ""); }
  clearTimeout(timer);
  const r = /text\/plain/.test(type) ? (t => ({status: P.words(t) >= 40 ? "ok" : "empty", title: "", text: t.slice(0, P.MAX_TEXT), words: P.words(t), cut: t.length > P.MAX_TEXT}))(body.text) : P.extract(body.text, u.href);
  // a bot check or a page built in the browser: the archive's copy, when there's a good one (never for a paywall)
  if (r.status === "blocked" || r.status === "needs_js") return tryArchive({status: r.status, url: u.href});
  const result = Object.assign({}, r, {url: u.href, cut: r.cut || body.big});
  const resp = out(result, 200, allowed ? origin : "");
  if (cache && result.status === "ok") { const c = new Response(JSON.stringify(result), {headers: {"content-type": "application/json; charset=utf-8", "cache-control": "max-age=3600"}}); try { (ctx && ctx.waitUntil ? ctx.waitUntil.bind(ctx) : p => p)(cache.put(key, c)); } catch (e) {} }
  return resp;
}
