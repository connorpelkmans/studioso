// Studyboard key relay: everything except the Cloudflare wiring (src/index.js), so tests/key-relay.test.js can run it in Node.
//
// One device seals its AI keys with a code (AES-GCM, key and mailbox id both derived from the code with PBKDF2, in index.html: KEYHO) and
// leaves the box here under the id. The other device fetches it once with the same code. The relay never sees the code or a key: only a
// 64-hex id and ciphertext, kept at most 10 minutes and handed out once.
//
//   POST   /v1/h/<id>         {"box": "<base64url>"}   201 stored, 409 id already used, 400/413 bad body
//   GET    /v1/h/<id>         200 {"box"} and the box is gone; 404 when there is none (taken, expired or never made)
//   GET    /v1/h/<id>/status  200 {"state": "waiting" | "taken" | "none"}   (the first device waits for "taken")
//   DELETE /v1/h/<id>         204, the first device closed the window before the code was used
//   GET    /k                 the page a scanned QR code opens (the code is in the #fragment, which browsers never send)

export const TTL_MS = 10 * 60 * 1000;
export const MAX_BOX = 4096;
const ID_RE = /^[0-9a-f]{64}$/;
const BOX_RE = /^[A-Za-z0-9_-]{40,4096}$/;

// One mailbox, kept in the Durable Object's own storage. Durable Objects run one request at a time with storage gates, so "take" can
// never hand the same box out twice.
export class Slot {
  constructor(storage, now = () => Date.now()) { this.s = storage; this.now = now; }
  async state() {
    const st = await this.s.get("state");
    if (st && (await this.s.get("until")) < this.now()) { await this.expire(); return null; }   // in case the alarm runs late
    return st || null;
  }
  async put(box) {
    if (await this.state()) return false;
    const until = this.now() + TTL_MS;
    await this.s.put({ state: "waiting", box, until });
    await this.s.setAlarm(until);
    return true;
  }
  async take() {
    if ((await this.state()) !== "waiting") return null;
    const box = await this.s.get("box");
    await this.s.put("state", "taken");
    await this.s.delete("box");
    return box;
  }
  async status() { return (await this.state()) || "none"; }
  async cancel() { await this.s.deleteAlarm(); await this.s.deleteAll(); }
  async expire() { await this.s.deleteAll(); }
}

const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS", "Access-Control-Allow-Headers": "Content-Type", "Access-Control-Max-Age": "86400" };
const json = (body, status = 200) => new Response(body == null ? null : JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json", "Cache-Control": "no-store" } });

export async function handle(request, env) {
  const url = new URL(request.url), path = url.pathname;
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (path === "/k" && request.method === "GET") return pageResponse(env);
  if (path === "/k.js" && request.method === "GET") return new Response(PAGE_JS, { headers: { "Content-Type": "text/javascript; charset=utf-8", "Cache-Control": "public, max-age=3600", "X-Content-Type-Options": "nosniff" } });
  if (path === "/" && request.method === "GET") return new Response("Studyboard key relay\n", { headers: { "Content-Type": "text/plain; charset=utf-8" } });
  const m = path.match(/^\/v1\/h\/([^/]+)(\/status)?$/);
  if (!m) return json({ error: "not_found" }, 404);
  const id = m[1];
  if (!ID_RE.test(id)) return json({ error: "bad_id" }, 400);
  const slot = env.HANDOFF.getByName(id);
  if (m[2]) return request.method === "GET" ? json({ state: await slot.status() }) : json({ error: "method" }, 405);
  if (request.method === "POST") {
    const len = Number(request.headers.get("Content-Length") || 0);
    if (len > MAX_BOX + 200) return json({ error: "too_large" }, 413);
    const text = await request.text();
    if (text.length > MAX_BOX + 200) return json({ error: "too_large" }, 413);
    let box = null;
    try { box = JSON.parse(text).box; } catch (e) { /* not JSON */ }
    if (typeof box !== "string" || !BOX_RE.test(box)) return json({ error: "bad_box" }, 400);
    return (await slot.put(box)) ? json({ ok: true, ttl: TTL_MS / 1000 }, 201) : json({ error: "exists" }, 409);
  }
  if (request.method === "GET") { const box = await slot.take(); return box ? json({ box }) : json({ error: "none" }, 404); }
  if (request.method === "DELETE") { await slot.cancel(); return json(null, 204); }
  return json({ error: "method" }, 405);
}

const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
function pageResponse(env) {
  const app = /^https:\/\/[^\s"'<>]+$/.test(String(env.APP_URL || "")) ? String(env.APP_URL).replace(/\/+$/, "") : "";
  const html = PAGE_HTML.replace("{{APP}}", esc(app));
  return new Response(html, { headers: {
    "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "Referrer-Policy": "no-referrer", "X-Content-Type-Options": "nosniff",
    "Content-Security-Policy": "default-src 'none'; script-src 'self'; style-src 'unsafe-inline'; img-src 'self' data:; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"
  } });
}

const PAGE_HTML = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex">
<title>Add AI to Studyboard</title>
<style>
:root{color-scheme:light dark;--bg:#f7f5f0;--fg:#1d1b18;--sub:#5d5850;--card:#fff;--line:#dcd6cb;--accent:#1d5fd1;--on:#fff}
@media (prefers-color-scheme:dark){:root{--bg:#171614;--fg:#eeeae2;--sub:#b3ada2;--card:#22201d;--line:#3a3732;--accent:#8fb4ff;--on:#0d1a33}}
body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif}
main{max-width:30rem;margin:0 auto;padding:2rem 1rem}
.card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:1.25rem}
h1{font-size:1.35rem;margin:0 0 .5rem}p{margin:.5rem 0;color:var(--sub)}
.code{font:700 1.9rem/1.2 ui-monospace,Menlo,Consolas,monospace;letter-spacing:.06em;text-align:center;margin:1rem 0;color:var(--fg);word-break:break-all}
.row{display:flex;gap:.5rem;flex-wrap:wrap}
a.btn,button{flex:1 1 12rem;display:inline-block;text-align:center;font:600 1rem system-ui,sans-serif;padding:.8rem 1rem;border-radius:10px;border:1px solid var(--line);background:transparent;color:var(--fg);text-decoration:none;cursor:pointer}
a.btn.primary{background:var(--accent);border-color:var(--accent);color:var(--on)}
[hidden]{display:none!important}
</style></head>
<body><main data-app="{{APP}}"><div class="card">
<h1>Add AI to Studyboard on this device</h1>
<div id="ok" hidden>
<p>Your code (it works once, for 10 minutes):</p>
<div class="code" id="code"></div>
<div class="row"><a class="btn primary" id="open" hidden>Open Studyboard</a><button type="button" id="copy">Copy Code</button></div>
<p id="how">Using the Studyboard app, or Studyboard from your home screen? Copy the code, open Studyboard, go to Settings, AI Features and tap Paste My Key.</p>
<p id="msg" role="status"></p>
</div>
<p id="bad" hidden>This link is missing its code. Scan the code on your other device again.</p>
</div></main><script src="/k.js"></script></body></html>`;

export const PAGE_JS = `(function(){
  var raw = decodeURIComponent((location.hash || "").replace(/^#/, "")).toUpperCase();
  try { history.replaceState(null, "", location.pathname); } catch (e) {}
  var ok = /^[0-9A-Z]{4}-[0-9A-Z]{4}-[0-9A-Z]{4}$/.test(raw);
  document.getElementById(ok ? "ok" : "bad").hidden = false;
  if (!ok) return;
  document.getElementById("code").textContent = raw;
  var app = document.querySelector("main").getAttribute("data-app");
  if (app) { var a = document.getElementById("open"); a.href = app + "#sbkey=" + raw; a.hidden = false; }
  document.getElementById("copy").addEventListener("click", function(){
    var msg = document.getElementById("msg");
    if (!navigator.clipboard) { msg.textContent = "Select the code above and copy it."; return; }
    navigator.clipboard.writeText(raw).then(function(){ msg.textContent = "Copied. Now open Studyboard."; }, function(){ msg.textContent = "Couldn't copy. Select the code above and copy it."; });
  });
})();`;
