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
   5. Purchases: Buy / Restore / Manage from the Pro sheet go to Apple In-App Purchase through RevenueCat (section 5 below). The page asks with
      cancelable window events (studyboard:plan-checkout, studyboard:plan-restore, studyboard:plan-manage) and this file answers with
      studyboard:purchase-result. The contract is written out in README-IOS.md ("Purchase bridge contract").

   Needs these Capacitor plugins installed (README-IOS.md section 2): @capacitor/app, @capacitor/browser, @capacitor/push-notifications,
   capacitor-secure-storage-plugin, @revenuecat/purchases-capacitor. */
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
  /* 5. Purchases (Apple In-App Purchase through RevenueCat). OWNER: put your RevenueCat PUBLIC iOS key below ("appl_..."), create an offering
        with a monthly and an annual package, and an entitlement called "pro". The page never trusts this file for Pro: RevenueCat tells our
        server (webhook), and the page re-reads the plan from the server after every result. The app user id is the Supabase user id. */
  var RC_KEY = "appl_REPLACE_WITH_REVENUECAT_PUBLIC_KEY", RC_ENTITLEMENT = "pro";
  var RC = P.Purchases, rcReady = null;
  function result(action, status, message) {
    try { window.dispatchEvent(new CustomEvent("studyboard:purchase-result", { detail: { action: action, status: status, message: message || "" } })); } catch (e) {}
  }
  function rcSetup(userId) {
    if (!RC || /REPLACE/.test(RC_KEY)) return Promise.reject(new Error("Purchases aren't set up in this build yet."));
    if (!rcReady) rcReady = RC.configure({ apiKey: RC_KEY, appUserID: userId || null });
    return Promise.resolve(rcReady).then(function () { return userId ? RC.logIn({ appUserID: userId }) : null; });
  }
  var isCancel = function (e) { return !!(e && (e.userCancelled || /cancel/i.test(String(e.message || "")))); };
  var active = function (info) { return !!(info && info.customerInfo ? info.customerInfo.entitlements.active[RC_ENTITLEMENT] : info && info.entitlements && info.entitlements.active[RC_ENTITLEMENT]); };
  // "claim" = tell the page we are handling it (preventDefault), then answer later with a result.
  window.addEventListener("studyboard:plan-checkout", function (ev) {
    ev.preventDefault();
    var d = ev.detail || {};
    rcSetup(d.userId).then(function () { return RC.getOfferings(); }).then(function (o) {
      var cur = o && o.current, pkg = cur && (d.period === "yearly" ? cur.annual : cur.monthly);
      if (!pkg) throw new Error("That plan isn't available right now.");
      return RC.purchasePackage({ aPackage: pkg });
    }).then(function () { result("checkout", "success"); },
      function (e) { isCancel(e) ? result("checkout", "cancelled") : result("checkout", "error", "The purchase didn't go through. You weren't charged."); });
  });
  window.addEventListener("studyboard:plan-restore", function (ev) {
    ev.preventDefault();
    var d = ev.detail || {};
    rcSetup(d.userId).then(function () { return RC.restorePurchases(); }).then(function (info) { result("restore", active(info) ? "success" : "nothing"); },
      function () { result("restore", "error", "Couldn't restore purchases. Check your connection and try again."); });
  });
  window.addEventListener("studyboard:plan-manage", function (ev) {
    ev.preventDefault();
    (RC && RC.showManageSubscriptions ? RC.showManageSubscriptions() : Promise.reject()).catch(function () {
      if (P.Browser) P.Browser.open({ url: "https://apps.apple.com/account/subscriptions" }).catch(function () {});
    }).then(function () { result("manage", "success"); });
  });
})();
