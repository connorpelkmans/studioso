// Studioso offline support: keeps a copy of the app so it opens with no internet.
// Your data is never stored here; it lives in the app itself and in your Supabase account.
const CACHE = "studioso-v1";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icons/icon-192.png", "./icons/icon-512.png", "./icons/maskable-512.png", "./icons/apple-touch-icon.png"];
const LIBS = ["https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.2/dist/umd/supabase.js"];
const LIB_HOSTS = ["cdn.jsdelivr.net", "cdnjs.cloudflare.com", "fonts.googleapis.com", "fonts.gstatic.com"];

self.addEventListener("install", e => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await c.addAll(SHELL);
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
  if (req.method !== "GET") return;
  // The app page: newest version when online, the saved copy when not.
  if (req.mode === "navigate" || (url.origin === location.origin && /\/(index\.html)?$/.test(url.pathname))) {
    e.respondWith((async () => {
      const c = await caches.open(CACHE);
      try {
        const r = await timeout(fetch(req), 5000);
        if (r.ok) c.put("./index.html", r.clone());
        return r;
      } catch (err) { return (await c.match("./index.html")) || (await c.match("./")) || Response.error(); }
    })());
    return;
  }
  // Icons and other files next to the app.
  if (url.origin === location.origin) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => { if (r.ok) caches.open(CACHE).then(c => c.put(req, r.clone())); return r; })));
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
