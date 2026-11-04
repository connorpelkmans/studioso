// Studyboard photo relay: photos taken on a phone go to Scan to PDF (or Photo to Note) on a computer
//
// The computer makes a random code and shows it in a QR code (/s#code for Scan to PDF, /s?for=notes#code for Photo to Note, which
// only changes the page's wording). From the code it works out a session id and an
// AES-GCM key (SHA-256 of two labels plus the code). The phone gets the code from the link's #fragment, which
// browsers never send to a server, locks (encrypts) each photo with the key and posts it here. The computer
// collects each photo once, which deletes it. Everything goes when the computer stops, or after 30 minutes.
// The relay only ever sees the session id and locked photos.

export const SCAN_TTL_MS = 30 * 60 * 1000;
export const MAX_PHOTO = 1900000; // a locked photo, in bytes (the phone shrinks photos to fit)
export const MAX_PHOTOS = 60; // per session
const ID_RE = /^[0-9a-f]{64}$/;

// One session, kept in its Durable Object's own storage
export class ScanSession {
  constructor(storage, now = () => Date.now()) { this.s = storage; this.now = now; }
  async meta() {
    const m = await this.s.get("meta");
    if (m && m.until < this.now()) { await this.expire(); return null; }
    return m || null;
  }
  async open() {
    if (await this.meta()) return false;
    const until = this.now() + SCAN_TTL_MS;
    await this.s.put("meta", { until, next: 1, sent: 0 });
    await this.s.setAlarm(until);
    return true;
  }
  // the phone adds a photo: its number, or "none" (no session) or "full"
  async add(bytes) {
    const m = await this.meta(); if (!m) return "none";
    if (m.sent >= MAX_PHOTOS) return "full";
    const k = m.next;
    await this.s.put({ ["p" + k]: bytes, meta: { ...m, next: k + 1, sent: m.sent + 1 } });
    return k;
  }
  // the photos waiting to be collected, by number
  async waiting() {
    const m = await this.meta(); if (!m) return null;
    const all = await this.s.list({ prefix: "p" });
    return [...all.keys()].map(x => Number(x.slice(1))).filter(Number.isFinite).sort((a, b) => a - b);
  }
  // collecting a photo hands it out once
  async take(k) {
    if (!(await this.meta())) return null;
    const b = await this.s.get("p" + k); if (b == null) return null;
    await this.s.delete("p" + k);
    return b;
  }
  async status() { const m = await this.meta(); return m ? { state: "open", sent: m.sent } : { state: "none", sent: 0 }; }
  async cancel() { await this.s.deleteAlarm(); await this.s.deleteAll(); }
  async expire() { await this.s.deleteAll(); }
}

const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS", "Access-Control-Allow-Headers": "Content-Type", "Access-Control-Max-Age": "86400" };
const json = (body, status = 200) => new Response(body == null ? null : JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json", "Cache-Control": "no-store" } });

// Routes under /v1/s/<id>, and the phone's page at /s
export async function handleScan(request, env, path) {
  if (path === "/s" && request.method === "GET") return new Response(SCAN_HTML, { headers: {
    "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "Referrer-Policy": "no-referrer", "X-Content-Type-Options": "nosniff",
    "Content-Security-Policy": "default-src 'none'; script-src 'self'; style-src 'unsafe-inline'; img-src blob: data:; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"
  } });
  if (path === "/s.js" && request.method === "GET") return new Response(SCAN_JS, { headers: { "Content-Type": "text/javascript; charset=utf-8", "Cache-Control": "public, max-age=3600", "X-Content-Type-Options": "nosniff" } });
  const m = path.match(/^\/v1\/s\/([^/]+)(\/status|\/p|\/p\/(\d{1,4}))?$/);
  if (!m) return null;
  const id = m[1], sub = m[2] || "";
  if (!ID_RE.test(id)) return json({ error: "bad_id" }, 400);
  const S = env.SCAN.getByName(id);
  if (!sub) {
    if (request.method === "POST") {
      if (env.POST_LIMIT) {
        const { success } = await env.POST_LIMIT.limit({ key: request.headers.get("CF-Connecting-IP") || "unknown" });
        if (!success) return new Response(JSON.stringify({ error: "rate_limited" }), { status: 429, headers: { ...CORS, "Content-Type": "application/json", "Cache-Control": "no-store", "Retry-After": "60" } });
      }
      return (await S.open()) ? json({ ok: true, ttl: SCAN_TTL_MS / 1000, max: MAX_PHOTOS }, 201) : json({ error: "exists" }, 409);
    }
    if (request.method === "DELETE") { await S.cancel(); return json(null, 204); }
    return json({ error: "method" }, 405);
  }
  if (sub === "/status") return request.method === "GET" ? json(await S.status()) : json({ error: "method" }, 405);
  if (sub === "/p") {
    if (request.method === "GET") { const ks = await S.waiting(); return ks ? json({ ks }) : json({ error: "none" }, 404); }
    if (request.method === "POST") {
      const len = Number(request.headers.get("Content-Length") || 0);
      if (len > MAX_PHOTO) return json({ error: "too_large" }, 413);
      const buf = await request.arrayBuffer();
      if (buf.byteLength > MAX_PHOTO) return json({ error: "too_large" }, 413);
      if (buf.byteLength < 40) return json({ error: "bad_photo" }, 400);
      const k = await S.add(buf);
      return k === "none" ? json({ error: "none" }, 404) : k === "full" ? json({ error: "full" }, 429) : json({ k }, 201);
    }
    return json({ error: "method" }, 405);
  }
  if (request.method !== "GET") return json({ error: "method" }, 405);
  const b = await S.take(Number(m[3]));
  return b == null ? json({ error: "none" }, 404) : new Response(b, { headers: { ...CORS, "Content-Type": "application/octet-stream", "Cache-Control": "no-store" } });
}

const SCAN_HTML = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex">
<title>Scan to Studyboard</title>
<style>
:root{color-scheme:light dark;--bg:#f7f5f0;--fg:#1d1b18;--sub:#5d5850;--card:#fff;--line:#dcd6cb;--accent:#1d5fd1;--on:#fff;--ok:#1a7f45;--bad:#b3261e}
@media (prefers-color-scheme:dark){:root{--bg:#171614;--fg:#eeeae2;--sub:#b3ada2;--card:#22201d;--line:#3a3732;--accent:#8fb4ff;--on:#0d1a33;--ok:#7fd6a0;--bad:#ffb4ab}}
body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif}
main{max-width:30rem;margin:0 auto;padding:1.5rem 1rem 3rem}
.card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:1.25rem}
h1{font-size:1.35rem;margin:0 0 .5rem}p{margin:.5rem 0;color:var(--sub)}
label.btn{display:flex;align-items:center;justify-content:center;gap:.5rem;font:700 1.1rem system-ui,sans-serif;padding:1rem;border-radius:12px;background:var(--accent);color:var(--on);cursor:pointer;margin:1rem 0 .5rem}
label.btn.alt{background:transparent;color:var(--fg);border:1px solid var(--line);font-weight:600;font-size:1rem;padding:.75rem;margin-top:0}
input[type=file]{position:absolute;width:1px;height:1px;opacity:0;pointer-events:none}
ol{list-style:none;padding:0;margin:1rem 0 0;display:grid;grid-template-columns:repeat(3,1fr);gap:.5rem}
li{position:relative;border:1px solid var(--line);border-radius:8px;overflow:hidden;aspect-ratio:3/4;background:var(--bg)}
li img{width:100%;height:100%;object-fit:cover;display:block}
li span{position:absolute;left:0;right:0;bottom:0;font:600 .75rem system-ui,sans-serif;padding:.2rem .35rem;background:rgba(0,0,0,.6);color:#fff}
li.ok span{background:rgba(26,127,69,.85)}li.bad span{background:rgba(179,38,30,.9)}
#msg{font-weight:600;color:var(--fg)}#msg.bad{color:var(--bad)}
[hidden]{display:none!important}
</style></head>
<body><main><div class="card">
<h1 id="h">Scan pages to your computer</h1>
<div id="ok" hidden>
<p id="intro">Take a photo of each page. They go straight to Scan to PDF on your computer, where you can fix the corners and make the PDF.</p>
<label class="btn"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>Take a Photo<input type="file" accept="image/*" capture="environment" id="cam"></label>
<label class="btn alt">Choose Photos<input type="file" accept="image/*" multiple id="pick"></label>
<p id="msg" role="status" aria-live="polite"></p>
<ol id="list"></ol>
<p>Photos are locked (encrypted) on this phone before they're sent, and deleted from the relay as soon as your computer has them.</p>
</div>
<p id="bad" hidden>This link is missing its code. On your computer, click Take Photos again, then scan the new code.</p>
</div></main><script src="/s.js"></script></body></html>`;

export const SCAN_JS = `(function(){
  var code = (location.hash || "").replace(/^#/, ""), notes = /(^|[?&])for=notes(&|$)/.test(location.search || "");
  try { history.replaceState(null, "", location.pathname); } catch (e) {}
  // the words: pages for Scan to PDF, or photos for Photo to Note
  var W = notes ? {one: "Photo", ones: "photos", full: "That's as many photos as one session can take. Make the note on your computer, then start again."}
    : {one: "Page", ones: "pages", full: "That's as many pages as one scan can take. Make the PDF on your computer, then start a new scan."};
  if (notes) {
    document.title = "Photos to Studyboard";
    document.getElementById("h").textContent = "Send photos to your computer";
    document.getElementById("intro").textContent = "Take a photo of the board, a slide or your notes. They go straight to Photo to Note on your computer, where they become typed notes.";
  }
  var good = /^[A-Za-z0-9_-]{22}$/.test(code) && window.crypto && crypto.subtle;
  document.getElementById(good ? "ok" : "bad").hidden = false;
  if (!good) return;
  var enc = new TextEncoder(), msg = document.getElementById("msg"), list = document.getElementById("list"), sent = 0, queue = Promise.resolve(), dead = false;
  function hex(b){ return Array.prototype.map.call(new Uint8Array(b), function(x){ return ("0" + x.toString(16)).slice(-2); }).join(""); }
  function say(t, bad){ msg.textContent = t; msg.className = bad ? "bad" : ""; }
  var ready = Promise.all([crypto.subtle.digest("SHA-256", enc.encode("sb-scan-id:" + code)), crypto.subtle.digest("SHA-256", enc.encode("sb-scan-key:" + code))]).then(function(r){
    return crypto.subtle.importKey("raw", r[1], "AES-GCM", false, ["encrypt"]).then(function(key){ return {id: hex(r[0]), key: key}; });
  });
  ready.then(function(s){ return fetch("/v1/s/" + s.id + "/status").then(function(r){ return r.json(); }).then(function(st){ if (st.state !== "open") gone(); else say("Connected to your computer."); }); }).catch(function(){ say("Couldn't reach the relay. Check your connection.", true); });
  function gone(){ dead = true; say("This code has run out. On your computer, click Take Photos again and scan the new code.", true); }
  // a photo, shrunk to a JPEG that fits (big phone photos are much more than a page needs)
  function shrink(file, side, q){
    return createImageBitmap(file, {imageOrientation: "from-image"}).then(function(bmp){
      var k = Math.min(1, side / Math.max(bmp.width, bmp.height)), cv = document.createElement("canvas");
      cv.width = Math.round(bmp.width * k); cv.height = Math.round(bmp.height * k); cv.getContext("2d").drawImage(bmp, 0, 0, cv.width, cv.height);
      return new Promise(function(res){ cv.toBlob(res, "image/jpeg", q); });
    });
  }
  function fit(file){
    return shrink(file, 2600, 0.85).then(function(b){ return b && b.size < 1800000 ? b : shrink(file, 2000, 0.75); }).then(function(b){ return b && b.size < 1800000 ? b : shrink(file, 1600, 0.65); });
  }
  function one(file){
    var li = document.createElement("li"), url = URL.createObjectURL(file), n = list.children.length + 1;
    li.innerHTML = '<img alt=""><span>' + W.one + ' ' + n + ': sending…</span>'; li.querySelector("img").src = url; list.appendChild(li);
    var lab = li.querySelector("span");
    return ready.then(function(s){
      return fit(file).then(function(jpg){
        if (!jpg) throw new Error("photo");
        return jpg.arrayBuffer().then(function(raw){
          var iv = crypto.getRandomValues(new Uint8Array(12));
          return crypto.subtle.encrypt({name: "AES-GCM", iv: iv}, s.key, raw).then(function(ct){
            var box = new Uint8Array(12 + ct.byteLength); box.set(iv, 0); box.set(new Uint8Array(ct), 12);
            return fetch("/v1/s/" + s.id + "/p", {method: "POST", headers: {"Content-Type": "application/octet-stream"}, body: box});
          });
        });
      });
    }).then(function(r){
      if (r.status === 201) { sent++; li.className = "ok"; lab.textContent = W.one + " " + n + ": sent"; say(sent + " " + (sent === 1 ? W.one.toLowerCase() : W.ones) + " sent to your computer."); return; }
      li.className = "bad"; lab.textContent = W.one + " " + n + ": not sent";
      if (r.status === 404) gone(); else if (r.status === 429) say(W.full, true); else say("Couldn't send that " + W.one.toLowerCase() + ". Try it again.", true);
    }, function(e){ li.className = "bad"; lab.textContent = W.one + " " + n + ": not sent"; say(e && e.message === "photo" ? "That photo couldn't be read. Try another." : "Couldn't send that " + W.one.toLowerCase() + ". Check your connection and try again.", true); });
  }
  function take(ev){
    var fs = Array.prototype.slice.call(ev.target.files || []); ev.target.value = "";
    if (dead) { gone(); return; }
    fs.forEach(function(f){ queue = queue.then(function(){ return one(f); }); });
  }
  document.getElementById("cam").addEventListener("change", take);
  document.getElementById("pick").addEventListener("change", take);
})();`;
