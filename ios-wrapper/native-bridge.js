/* Studyboard iOS wrapper: the small piece of native glue that goes with the web build inside Capacitor.
   Load it BEFORE the page's own script (README-IOS.md section 2 shows the one line to add to the staged index.html). It does nothing outside
   the Capacitor app (every function checks window.Capacitor first), so it is also safe to leave in other builds.

   What it does, and no more:
   1. window.StudyboardAuthStorage: keeps the Supabase sign-in session in the iOS Keychain instead of the web view's localStorage.
      (index.html uses it automatically when it exists: see authStorage() there.)
   2. Links: https and mailto links open in the in-app Safari sheet (Capacitor Browser). Nothing else is ever opened, and payment
      pages are never opened from the iOS app (App Store rule 3.1.1: Pro is bought with Apple in-app purchase).
   3. Deep links: universal links and studyboard:// links are passed to the page as ?deck= / ?group= / ?task= on the app's own address.
   4. Push: registers for notifications only after the page asks (window.StudyboardNative.enablePush()), and hands the token to the page.

   Needs these Capacitor plugins installed (README-IOS.md section 2): @capacitor/app, @capacitor/browser, @capacitor/push-notifications,
   capacitor-secure-storage-plugin. */
(function () {
  "use strict";
  var C = window.Capacitor;
  if (!C || typeof C.isNativePlatform !== "function" || !C.isNativePlatform()) return;
  var P = C.Plugins || {};

  /* 1. Keychain-backed storage for the Supabase session. Keys are namespaced, values are the session JSON. */
  var S = P.SecureStoragePlugin;
  if (S) {
    var key = function (k) { return "studyboard." + String(k).replace(/[^\w.-]/g, "_").slice(0, 80); };
    window.StudyboardAuthStorage = {
      getItem: function (k) {
        return S.get({ key: key(k) }).then(function (r) { return r && typeof r.value === "string" ? r.value : null; }, function () {
          // Not in the Keychain yet: move an older copy out of localStorage (once), then forget it.
          try {
            var old = window.localStorage.getItem(k);
            if (old == null) return null;
            return S.set({ key: key(k), value: old }).then(function () { window.localStorage.removeItem(k); return old; }, function () { return old; });
          } catch (e) { return null; }
        });
      },
      setItem: function (k, v) { return S.set({ key: key(k), value: String(v) }).then(function () { try { window.localStorage.removeItem(k); } catch (e) {} }); },
      removeItem: function (k) { try { window.localStorage.removeItem(k); } catch (e) {} return S.remove({ key: key(k) }).catch(function () {}); }
    };
  }

  /* 2. Links. */
  var BLOCKED = /(^|\.)(stripe\.com|paypal\.com|paypal\.me|paddle\.com|lemonsqueezy\.com|gumroad\.com|ko-fi\.com|buymeacoffee\.com|patreon\.com)$/i;
  function safeLink(raw) {
    try {
      var u = new URL(String(raw), window.location.href);
      if (u.protocol === "mailto:") return u.href;
      if (u.protocol !== "https:" || u.username || u.password || BLOCKED.test(u.hostname)) return null;
      return u.href;
    } catch (e) { return null; }
  }
  function openExternal(raw) {
    var href = safeLink(raw);
    if (!href) return false;
    if (/^mailto:/i.test(href)) { window.location.href = href; return true; }
    if (P.Browser) { P.Browser.open({ url: href }).catch(function () {}); return true; }
    return false;
  }
  window.open = function (url) { openExternal(url); return null; };       // the page's window.open calls become the in-app browser
  document.addEventListener("click", function (e) {
    var a = e.target && e.target.closest ? e.target.closest("a[href]") : null;
    if (!a) return;
    var href = a.getAttribute("href") || "";
    if (/^(#|\/|\.|capacitor:)/.test(href) && a.target !== "_blank") return;   // the app's own pages
    if (/^(https?:|mailto:)/i.test(href) || a.target === "_blank") { e.preventDefault(); openExternal(a.href); }
  }, true);

  /* 3. Deep links. Only deck, group and task codes are copied over; everything else in the link is ignored. */
  if (P.App) {
    P.App.addListener("appUrlOpen", function (ev) {
      try {
        var u = new URL(ev.url), q = new URLSearchParams();
        ["deck", "group", "task"].forEach(function (n) {
          var v = u.searchParams.get(n);
          if (v && /^[\w.:-]{1,200}$/.test(v)) q.set(n, v);
        });
        if (u.protocol === "studyboard:" && u.hostname === "action") {
          var a = u.pathname.replace(/^\/+|\/+$/g, "");
          if (["quickadd", "today", "focus", "search", "flashcards", "settings"].indexOf(a) >= 0) q.set("action", a);
        }
        if (String(q)) window.location.href = window.location.pathname + "?" + q.toString();
      } catch (e) { /* ignore anything that isn't a Studyboard link */ }
    });
  }

  /* 4. Push notifications (APNs through Capacitor). The page calls StudyboardNative.enablePush() from a button, so the iOS permission
        prompt appears when the person asks for reminders, not at launch. */
  window.StudyboardNative = Object.assign(window.StudyboardNative || {}, {
    platform: "ios",
    store: "app-store",
    enablePush: function () {
      var N = P.PushNotifications;
      if (!N) return Promise.resolve(null);
      return N.requestPermissions().then(function (r) {
        if (!r || r.receive !== "granted") return null;
        return new Promise(function (resolve) {
          N.addListener("registration", function (t) { resolve(t && t.value ? String(t.value) : null); });
          N.addListener("registrationError", function () { resolve(null); });
          N.register();
        });
      });
    }
  });
})();
