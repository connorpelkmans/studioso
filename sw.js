// Studyboard offline support: keeps a copy of the app so it opens with no internet.
// Your data is never stored here; it lives in the app itself and in your Supabase account.
const CACHE = "studyboard-v5";
// CORE must exist for the app to work offline. OPTIONAL files (icons) may be missing, in the icons/ folder layout or the
// flat layout; a missing one never stops the service worker from installing.
const CORE = ["./", "./index.html"];
const OPTIONAL = ["./manifest.webmanifest", "./today.webmanifest", "./icons/icon-192.png", "./icons/icon-512.png", "./icons/maskable-512.png", "./icons/apple-touch-icon.png",
  "./icon-192.png", "./icon-512.png", "./maskable-512.png", "./apple-touch-icon.png",
  "./vendor/supabase-js-2.117.2.umd.js", "./vendor/fonts.css",
  "./vendor/fonts/lexend-latin-400-normal.woff2", "./vendor/fonts/lexend-latin-500-normal.woff2", "./vendor/fonts/lexend-latin-600-normal.woff2",
  "./vendor/fonts/lexend-latin-700-normal.woff2", "./vendor/fonts/lexend-latin-800-normal.woff2",
  "./vendor/fonts/atkinson-hyperlegible-next-latin-400-normal.woff2", "./vendor/fonts/atkinson-hyperlegible-next-latin-500-normal.woff2",
  "./vendor/fonts/atkinson-hyperlegible-next-latin-700-normal.woff2",
  "./vendor/fonts/atkinson-hyperlegible-latin-400-normal.woff2", "./vendor/fonts/atkinson-hyperlegible-latin-700-normal.woff2"];
// PDF.js (same-origin, ES modules) is saved too so a PDF can be imported offline; if it isn't there the fetch handler saves it on first use.
OPTIONAL.push("./vendor/pdfjs/pdf.min.mjs", "./vendor/pdfjs/pdf.worker.min.mjs", "./locales/es.json");
// Same-origin vendored libraries and fonts are precached (OPTIONAL, so a missing one never blocks install). The CDN copy is only the
// fallback the page uses if the vendored file can't load; it is cached opportunistically and never required.
const LIBS = ["https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.2/dist/umd/supabase.js"];
const LIB_HOSTS = ["cdn.jsdelivr.net"];

self.addEventListener("install", e => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await c.addAll(CORE);
    await Promise.all(OPTIONAL.map(u => c.add(u).catch(() => {})));
    await Promise.all(LIBS.map(u => fetch(u, {mode: "cors"}).then(r => r.ok && c.put(u, r)).catch(() => {})));
    await self.skipWaiting();
  })());
});
self.addEventListener("activate", e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});
const timeout = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), ms))]);
self.addEventListener("fetch", e => {
  const req = e.request, url = new URL(req.url);
  // Quick capture: the Web Share Target (manifest share_target) POSTs shared text and photos here. Handled, never cached.
  if (req.method === "POST" && url.origin === location.origin && /\/share-target$/.test(url.pathname)) { e.respondWith(sbcShare(req)); return; }
  if (req.method !== "GET" || !/^https?:$/.test(url.protocol)) return;
  if (req.headers.has("range") || req.headers.has("authorization")) return;   // never cache ranged or authenticated requests
  const isApp = url.origin === location.origin && /\/(index\.html)?$/.test(url.pathname);
  // Other pages next to the app (invite, reset-password...) go straight to the network and never replace the saved app page.
  if (req.mode === "navigate" && url.origin === location.origin && !isApp) return;
  // The app page: newest version when online, the saved copy when not.
  if (isApp || req.mode === "navigate") {
    e.respondWith((async () => {
      const c = await caches.open(CACHE);
      try {
        const r = await timeout(fetch(req), 5000);
        if (r.ok && r.type === "basic" && isApp) c.put("./index.html", r.clone());
        return r;
      } catch (err) { return (await c.match("./index.html")) || (await c.match("./")) || Response.error(); }
    })());
    return;
  }
  // Icons and other files next to the app.
  if (url.origin === location.origin) {
    // Saved copy right away, refreshed in the background so updated files arrive on the next visit.
    e.respondWith((async () => {
      const c = await caches.open(CACHE), hit = await c.match(req);
      const net = fetch(req).then(r => { if (r.ok && r.type === "basic") c.put(req, r.clone()); return r; }).catch(() => null);
      if (hit) { e.waitUntil(net); return hit; }
      return (await net) || Response.error();
    })());
    return;
  }
  // Fonts and libraries: use the saved copy right away and refresh it in the background.
  if (LIB_HOSTS.includes(url.hostname)) {
    e.respondWith((async () => {
      const c = await caches.open(CACHE), hit = await c.match(req);
      const net = fetch(req).then(r => { if (r.ok || r.type === "opaque") c.put(req, r.clone()); return r; }).catch(() => null);
      return hit || (await net) || Response.error();
    })());
  }
  // Everything else (your Supabase account) goes straight to the network.
});

// ---------- Reminders (Studyboard 1.11) ----------
// Shows reminders sent by your Supabase project while Studyboard is closed, and handles taps on them:
// tapping opens Studyboard on that task, Snooze 1 Hour brings it back in an hour, Mark Done completes the task.
// Reminders shown by the open app use the same tag, so one reminder never shows twice on a device.
const SBR_ICON = "./icons/icon-192.png";
function sbrData(d) {
  d = d && typeof d === "object" ? d : {};
  const s = (v, n) => typeof v === "string" ? v.slice(0, n) : "";
  return {sbRem: 1, rid: s(d.rid || d.tag, 200), taskId: s(d.taskId, 200), title: s(d.title, 200) || "Studyboard", body: s(d.body, 1000),
    url: s(d.url, 500), tok: s(d.tok, 100), api: s(d.api, 300), k: s(d.k, 1000)};
}
self.addEventListener("push", e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (err) { d = {title: "Studyboard", body: e.data ? e.data.text() : ""}; }
  const data = sbrData(d);
  const actions = [{action: "snooze", title: "Snooze 1 Hour"}].concat(data.taskId ? [{action: "done", title: "Mark Done"}] : []);
  e.waitUntil(self.registration.showNotification(data.title, {body: data.body, tag: data.rid || undefined, data, icon: SBR_ICON, badge: SBR_ICON, actions, timestamp: Date.now()}));
});
// The browser renewed this device's subscription: subscribe again with the same key. The app saves it next time it opens.
self.addEventListener("pushsubscriptionchange", e => {
  const key = e.oldSubscription && e.oldSubscription.options && e.oldSubscription.options.applicationServerKey;
  if (!key) return;
  e.waitUntil(self.registration.pushManager.subscribe({userVisibleOnly: true, applicationServerKey: key}).catch(() => {}));
});
async function sbrServer(d, action) {
  // Works with Studyboard closed: the reminder's own code lets your Supabase snooze it or complete the task.
  if (!d.api || !d.tok || !/^https:\/\//.test(d.api)) return false;
  const headers = {"Content-Type": "application/json"};
  if (d.k) { headers.apikey = d.k; if (/^eyJ/.test(d.k)) headers.Authorization = "Bearer " + d.k; }
  try {
    const r = await fetch(d.api, {method: "POST", headers, body: JSON.stringify({action, id: d.rid, tok: d.tok, minutes: 60})});
    return r.ok;
  } catch (err) { return false; }
}
self.addEventListener("notificationclick", e => {
  const n = e.notification, d = n.data || {};
  if (!d.sbRem) return;                      // not a Studyboard reminder
  const act = e.action === "snooze" || e.action === "done" ? e.action : "open";
  n.close();
  e.waitUntil((async () => {
    const scope = self.registration.scope;
    const wins = (await self.clients.matchAll({type: "window", includeUncontrolled: true})).filter(c => c.url.startsWith(scope));
    const msg = {type: "sb-reminder", action: act, rid: d.rid, taskId: d.taskId, title: d.title, body: d.body};
    if (act !== "open") {
      if (await sbrServer(d, act)) {
        // A short confirmation that closes itself.
        try {
          await self.registration.showNotification(act === "done" ? "Marked Done" : "Snoozed for 1 Hour", {body: d.title, tag: "sbr-ack", icon: SBR_ICON, silent: true});
          await new Promise(r => setTimeout(r, 4000));
          (await self.registration.getNotifications({tag: "sbr-ack"})).forEach(x => x.close());
        } catch (err) {}
        return;
      }
      if (wins.length) { wins[0].postMessage(msg); return; }
    } else if (wins.length) {
      const w = wins.find(c => c.focused) || wins[0];
      try { await w.focus(); } catch (err) {}
      w.postMessage(msg);
      return;
    }
    const url = new URL(scope);
    if (d.taskId) url.searchParams.set("sbtask", d.taskId);
    if (act !== "open") { url.searchParams.set("sbrem", act); if (d.rid) url.searchParams.set("sbrid", d.rid); }
    await self.clients.openWindow(url.href);
  })());
});

// ---------- Windows 11 Widgets board: the Studyboard Today widget ----------
// Only Microsoft Edge on Windows 11 shows these (for Studyboard installed as an app). Everywhere else self.widgets
// doesn't exist and none of this runs. The Studyboard page sends its latest Today data here whenever it changes;
// it's kept in the offline cache so the widget still shows your day when Studyboard is closed.
const SBW_TAG = "today";
const SBW_CACHE = typeof CACHE === "string" ? CACHE : "studyboard-v1";
const sbwUrl = rel => new URL(rel, self.registration.scope).href;
const SBW_DATA = sbwUrl("widgets/today-data.json"), SBW_TEMPLATE = sbwUrl("widgets/today-template.json");

async function sbwText(url, preferCache){
  const c = await caches.open(SBW_CACHE);
  if (preferCache) { const hit = await c.match(url); if (hit) return hit.text(); }
  try { const r = await fetch(url, {cache: "no-store"}); if (r.ok) { if (!preferCache) c.put(url, r.clone()); return r.text(); } } catch (e) {}
  const hit = await c.match(url);
  return hit ? hit.text() : "{}";
}
// Template from the network when possible (so updates arrive), data from what the page last sent.
async function sbwPayload(def){
  const template = await sbwText((def && def.msAcTemplate) || SBW_TEMPLATE, false);
  const data = await sbwText(SBW_DATA, true);
  return {template, data};
}
async function sbwRender(widget){
  if (!self.widgets || !widget) return;
  await self.widgets.updateByTag(widget.definition.tag, await sbwPayload(widget.definition));
}
async function sbwRenderAll(){
  if (!self.widgets) return;
  const w = await self.widgets.getByTag(SBW_TAG);
  if (w && (!w.instances || w.instances.length)) await sbwRender(w);
}

if (self.widgets) {
  self.addEventListener("widgetinstall", e => e.waitUntil(sbwRender(e.widget)));
  self.addEventListener("widgetresume", e => e.waitUntil(sbwRender(e.widget)));
  self.addEventListener("widgetuninstall", () => {});
  self.addEventListener("activate", e => e.waitUntil(sbwRenderAll().catch(() => {})));
  self.addEventListener("widgetclick", e => {
    const verb = e.action || "open";
    let data = e.data;
    try { if (typeof data === "string") data = JSON.parse(data); } catch (err) { data = null; }
    const id = data && typeof data.id === "string" ? data.id.slice(0, 200) : "";
    e.waitUntil(sbwClick(verb, id));
  });
}
// Buttons on the widget: check off or open a task, open Studyboard, or Quick Add.
// An open Studyboard window does it right away; otherwise Studyboard opens and does it as it starts.
async function sbwClick(verb, id){
  const ok = ["open", "quickadd", "task", "done"].includes(verb) ? verb : "open";
  const wins = await self.clients.matchAll({type: "window", includeUncontrolled: false});
  const app = wins.find(c => !/[?&]widget=today/.test(c.url)) || wins[0];
  if (app && ok !== "open") { app.postMessage({type: "sb-widget-click", verb: ok, id}); if (ok !== "done" && app.focus) try { await app.focus(); } catch (e) {} return; }
  if (app && app.focus) { try { await app.focus(); return; } catch (e) {} }
  const q = ok === "quickadd" ? "?action=quickadd" : ok === "task" && id ? "?task=" + encodeURIComponent(id) : ok === "done" && id ? "?action=done&task=" + encodeURIComponent(id) : "?action=today";
  try { await self.clients.openWindow(sbwUrl("./") + q); } catch (e) {}
}
// Crash reports (ERROR-REPORTING.md): the page asks which worker version it has, and gets told about this worker's own errors. The page scrubs and sends them; the worker never makes a network call for this.
self.addEventListener("message", e => {
  const m = e.data;
  if (m && m.type === "sb-sw-ping" && e.source && typeof e.source.postMessage === "function") { try { e.source.postMessage({type: "sb-sw-info", v: CACHE}); } catch (err) {} }
});
async function sbTell(err) {
  try {
    const cs = await self.clients.matchAll({type: "window"});
    const m = {type: "sb-sw-error", name: String((err && err.name) || "Error").slice(0, 40), msg: String((err && err.message) || err || "").slice(0, 200), stack: String((err && err.stack) || "").slice(0, 2000)};
    if (cs[0]) cs[0].postMessage(m);
  } catch (e) {}
}
self.addEventListener("error", e => { sbTell(e.error || e.message); });
self.addEventListener("unhandledrejection", e => { sbTell(e.reason); });
// The page's latest Today data (see modules/70-widgets.js).
self.addEventListener("message", e => {
  const m = e.data;
  // Only Studyboard's own pages (inside this worker's scope) may feed the widget.
  if (!e.source || typeof e.source.url !== "string" || !e.source.url.startsWith(self.registration.scope)) return;
  if (!m || m.type !== "sb-widget-data" || !m.data || typeof m.data !== "object") return;
  let text; try { text = JSON.stringify(m.data); } catch (err) { return; }
  if (text.length > 100000) return;
  e.waitUntil((async () => {
    const c = await caches.open(SBW_CACHE);
    await c.put(SBW_DATA, new Response(text, {headers: {"Content-Type": "application/json"}}));
    await sbwRenderAll();
  })().catch(() => {}));
});

// ---------- Quick capture: share target (Studyboard 1.12) ----------
// Android, ChromeOS and desktop installs list Studyboard in the system Share menu. The shared text and photos are checked (images only, at most
// 10 files, 15 MB each), kept for a few minutes in a private cache so the page can read them after the redirect, and the page deletes them as it reads.
// Anything not read is swept out after 10 minutes. iPhone Safari web apps don't support share targets (the iOS app has a share extension instead).
const SBC_STAGE = "sb-capture-stage", SBC_FILES = 10, SBC_BYTES = 15 * 1048576, SBC_TTL = 10 * 60 * 1000, SBC_IMG = /^image\/(png|jpe?g|webp|gif|heic|heif|avif|bmp)$/i;
async function sbcSweep(c) {
  const now = Date.now();
  for (const k of await c.keys()) {
    const m = k.url.match(/__share\/([a-z0-9]+)\//);
    if (m && now - parseInt(m[1].slice(0, 8), 36) > SBC_TTL) await c.delete(k);
  }
}
async function sbcShare(req) {
  const base = new URL("./", self.registration.scope).href;
  const go = q => Response.redirect(base + "?share=1" + q, 303);
  try {
    if (!/^multipart\/form-data/i.test(req.headers.get("content-type") || "")) return go("&err=type");
    if (Number(req.headers.get("content-length") || 0) > SBC_FILES * SBC_BYTES + 1048576) return go("&err=big");
    const fd = await req.formData();
    const str = (k, n) => { const v = fd.get(k); return typeof v === "string" ? v.slice(0, n) : ""; };
    const all = fd.getAll("files").filter(f => f && typeof f === "object" && typeof f.size === "number");
    if (all.length > SBC_FILES) return go("&err=many");
    if (all.some(f => f.size > SBC_BYTES)) return go("&err=big");
    const files = all.filter(f => SBC_IMG.test(f.type || ""));
    const id = Date.now().toString(36).padStart(8, "0") + Math.random().toString(36).slice(2, 8);
    const c = await caches.open(SBC_STAGE);
    await sbcSweep(c);
    await c.put(base + "__share/" + id + "/meta", new Response(JSON.stringify({title: str("title", 300), text: str("text", 4000), url: str("url", 500), n: files.length, skipped: all.length - files.length}), {headers: {"content-type": "application/json"}}));
    for (let i = 0; i < files.length; i++) {
      await c.put(base + "__share/" + id + "/f" + i, new Response(files[i], {headers: {"content-type": files[i].type, "x-name": encodeURIComponent(String(files[i].name || "shared").slice(0, 120))}}));
    }
    return go("&sw=" + id);
  } catch (err) { return go("&err=fail"); }
}
