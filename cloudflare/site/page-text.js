// GET /api/page-text?url=<a web page>: the page's readable text, for "Cards From a Link" on the website, where the browser can't
// fetch another site itself. Only the extracted text goes back (src/js/01-page-text.js, the same code the iPhone app runs on pages it
// fetches itself), never the page: so this is no general-purpose proxy.
// Guards: only Studyboard's own pages and apps may call it (Origin), a rate limit per visitor (the PAGE_LIMIT binding, when set up),
// only ordinary public web addresses (checked again at every redirect, at most 5), only HTML or plain text, at most 2 MB read, 10
// seconds, no cookies sent or kept. Answers are cached for an hour. Nothing is logged or stored.
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
  // 401 and 402: a login or paywall. 403 and 429: the site turns automated readers away (Britannica, Investopedia and others do)
  if (res.status === 401 || res.status === 402) { clearTimeout(timer); return out({status: "paywall", http: res.status}, 200, allowed ? origin : ""); }
  if (res.status === 403 || res.status === 429) { clearTimeout(timer); return out({status: "blocked", http: res.status}, 200, allowed ? origin : ""); }
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
  const result = Object.assign({}, r, {url: u.href, cut: r.cut || body.big});
  const resp = out(result, 200, allowed ? origin : "");
  if (cache && result.status === "ok") { const c = new Response(JSON.stringify(result), {headers: {"content-type": "application/json; charset=utf-8", "cache-control": "max-age=3600"}}); try { (ctx && ctx.waitUntil ? ctx.waitUntil.bind(ctx) : p => p)(cache.put(key, c)); } catch (e) {} }
  return resp;
}
