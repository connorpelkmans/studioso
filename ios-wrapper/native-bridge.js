/* Studyboard iOS + Android wrappers: the small piece of native glue that goes with the web build inside Capacitor.
   Load it BEFORE the page's own script (README-IOS.md section 2 shows the one line to add to the staged index.html). It does nothing outside
   the Capacitor app (every function checks window.Capacitor first), so it is also safe to leave in other builds.

   What it does, and no more:
   1. window.StudyboardAuthStorage: keeps the Supabase sign-in session in the iOS Keychain / Android Keystore-backed storage instead of localStorage.
      (index.html uses it automatically when it exists: see authStorage() there.)
   2. Links: https and mailto links open in the in-app Safari sheet (Capacitor Browser). Nothing else is ever opened, and payment
      pages are never opened from the store apps (App Store rule 3.1.1, Google Play payments policy: Pro is bought with in-app purchase).
   3. Deep links: universal links and studyboard:// links are passed to the page as ?deck= / ?group= / ?task= on the app's own address.
   4. Push (APNs on iOS, FCM on Android): registers only when the page asks (window.StudyboardNative.enablePush()) and resolves
      {platform, kind, token} for the page to store server-side. StudyboardNative.pushAvailable says whether push is set up in this build.
   5. Quick capture (UNTESTED: written without a device or compiler): window.StudyboardNative.saveCaptureToken(token, supabaseUrl) / clearCaptureToken()
      store the capture token where Siri / App Intents / the share extension / the Android share target can read it (see VOICE-CAPTURE-NATIVE.md), and the
      shared queue (items saved by the share extension or by a Siri fallback) is drained into window.SBCAPTURE.ingest(item) at start and on every resume.
   6. Purchases: Buy / Restore / Manage from the Pro sheet go to Apple In-App Purchase / Google Play Billing through RevenueCat (section 6
      below); StudyboardNative.purchasesAvailable is false when no RevenueCat key is set for the platform (the page should hide Buy then). The page asks with
      cancelable window events (studyboard:plan-checkout, studyboard:plan-restore, studyboard:plan-manage) and this file answers with
      studyboard:purchase-result. The contract is written out in README-IOS.md ("Purchase bridge contract").

   Needs these Capacitor plugins installed (README-IOS.md section 2, README-ANDROID.md section 2): @capacitor/app, @capacitor/browser, @capacitor/push-notifications,
   capacitor-secure-storage-plugin, @revenuecat/purchases-capacitor (section 6), plus the two local plugins in ios-wrapper/native (StudyboardCaptureToken, StudyboardSharedQueue) for section 5. */
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
  /* 1b. window.StudyboardSecrets: device-only secrets (the person's own AI keys) in the same secure storage, same API as the desktop app's
         preload.js `secrets`. index.html uses `DESK.secrets || window.StudyboardSecrets`. Never synced, never logged. */
  var SECRET_NAME = /^[\w.-]{1,64}$/;
  window.StudyboardSecrets = {
    available: function () { return Promise.resolve(!!S); },
    get: function (name) {
      if (!S || typeof name !== "string" || !SECRET_NAME.test(name)) return Promise.resolve(null);
      return Promise.resolve().then(function () { return S.get({ key: "studyboard.secret." + name }); })
        .then(function (r) { return r && typeof r.value === "string" ? r.value : null; }, function () { return null; });
    },
    set: function (name, value) {
      if (!S || typeof name !== "string" || !SECRET_NAME.test(name) || typeof value !== "string" || value.length > 20000) return Promise.resolve(false);
      return Promise.resolve().then(function () { return S.set({ key: "studyboard.secret." + name, value: value }); })
        .then(function () { return true; }, function () { return false; });
    },
    remove: function (name) {
      if (!S || typeof name !== "string" || !SECRET_NAME.test(name)) return Promise.resolve();
      return Promise.resolve().then(function () { return S.remove({ key: "studyboard.secret." + name }); }).then(function () {}, function () {});
    }
  };

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
        // Quick capture links (studyboard://add?... and studyboard://capture?...) go to the capture router in the page (cap-core: SBCAPTURE.handleUrl).
        // The page must NOT register its own appUrlOpen listener for these (window.StudyboardNative.forwardsDeepLinks tells it so).
        if (u.protocol === "studyboard:" && (u.hostname === "add" || u.hostname === "capture")) {
          var tries = 0, raw = String(ev.url);
          (function route() {                                       // on a cold start the page script may not have defined SBCAPTURE yet: wait up to ~10 s
            if (window.SBCAPTURE && typeof window.SBCAPTURE.handleUrl === "function") window.SBCAPTURE.handleUrl(raw);
            else if (++tries < 20) setTimeout(route, 500);
          })();
          return;
        }
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

  /* 4. Push notifications through @capacitor/push-notifications: APNs on iOS, Firebase Cloud Messaging (FCM) on Android. Web Push never works
        inside WKWebView / Android WebView, so in the wrappers the page must use this instead (README-IOS.md / README-ANDROID.md, "Push").
        enablePush({prompt}) -> Promise<{platform: "ios"|"android", kind: "apns"|"fcm", token} | null>
          prompt !== false: asks for permission if needed (call it from a button, so the prompt appears when the person asks for reminders).
          prompt === false: never prompts; resolves null unless permission was already granted. Call it at every app start to refresh the
                            token (it can change) and save it again server-side when it differs.
        disablePush() -> Promise<boolean>: unregisters this device (delete the server row too).
        pushAvailable: false when the plugin is missing or push is not set up for this platform (PUSH_READY below): hide the push switch then.
        The iOS token is the raw APNs device token (hex), NOT an FCM token (unless you add the Firebase iOS SDK), so the server must send it
        through APNs (kind "apns"). A tap on a notification whose data has taskId / rid opens ?sbtask=&sbrid= like the web push click does. */
  var platform = typeof C.getPlatform === "function" && C.getPlatform() === "android" ? "android" : "ios";
  var isAndroid = platform === "android";
  // OWNER: set android to true only after android/app/google-services.json is in place (README-ANDROID.md "Push"): without Firebase,
  // registering fails on Android. iOS needs the Push Notifications capability and the two AppDelegate methods (README-IOS.md "Push").
  var PUSH_READY = { ios: true, android: false };
  var Push = P.PushNotifications;
  var pushOk = !!(Push && PUSH_READY[platform]);
  var pushPending = null;
  function getPushToken(prompt) {
    if (!pushOk) return Promise.resolve(null);
    if (pushPending) return pushPending;
    pushPending = Promise.resolve(Push.checkPermissions()).then(function (st) {
      if (st && st.receive === "granted") return st;
      if (prompt === false || (st && st.receive === "denied")) return null;
      return Push.requestPermissions();
    }).then(function (st) {
      if (!st || st.receive !== "granted") return null;
      return new Promise(function (resolve) {
        var handles = [], done = false, timer = 0;
        function finish(v) {
          if (done) return;
          done = true;
          clearTimeout(timer);
          handles.forEach(function (h) { Promise.resolve(h).then(function (x) { if (x && typeof x.remove === "function") x.remove(); }).catch(function () {}); });
          resolve(v);
        }
        timer = setTimeout(function () { finish(null); }, 20000);   // no answer: capability, AppDelegate methods or Firebase not set up
        handles.push(Push.addListener("registration", function (t) {
          var v = t && typeof t.value === "string" ? t.value.trim() : "";
          finish(v && v.length <= 4096 && /^[\w:.-]+$/.test(v) ? { platform: platform, kind: isAndroid ? "fcm" : "apns", token: v } : null);
        }));
        handles.push(Push.addListener("registrationError", function () { finish(null); }));
        Promise.resolve(Push.register()).catch(function () { finish(null); });
      });
    }).catch(function () { return null; }).then(function (r) { pushPending = null; return r; });
    return pushPending;
  }
  if (pushOk) {
    // Tapping a reminder: send-reminders puts {taskId, rid} in the push data; open it the way the web push click does (?sbtask=&sbrid=).
    Push.addListener("pushNotificationActionPerformed", function (a) {
      try {
        var d = (a && a.notification && a.notification.data) || {}, q = new URLSearchParams();
        if (typeof d.taskId === "string" && /^[\w.:-]{1,200}$/.test(d.taskId)) q.set("sbtask", d.taskId);
        if (typeof d.rid === "string" && /^[\w.:-]{1,200}$/.test(d.rid)) q.set("sbrid", d.rid);
        if (String(q)) window.location.href = window.location.pathname + "?" + q.toString();
      } catch (e) { /* ignore */ }
    });
  }
  window.StudyboardNative = Object.assign(window.StudyboardNative || {}, {
    forwardsDeepLinks: true,
    platform: platform,
    store: isAndroid ? "google-play" : "app-store",
    pushAvailable: pushOk,
    enablePush: function (opts) { return getPushToken(!(opts && opts.prompt === false)); },
    disablePush: function () {
      if (!pushOk) return Promise.resolve(false);
      return Promise.resolve(Push.unregister()).then(function () { return true; }, function () { return false; });
    }
  });

  /* 5. Quick capture: capture token for the native entry points + shared queue. Both are no-ops when the local plugins are not installed. */
  function plugin(name) {
    try { return P[name] || (typeof C.registerPlugin === "function" ? C.registerPlugin(name) : null); } catch (e) { return null; }
  }
  var CAPTURE_TOKEN_RE = /^[A-Za-z0-9._~+\/-]{16,512}$/;          // opaque token: no spaces, no control characters
  function captureEndpoint(supabaseUrl) {
    try {
      var u = new URL(String(supabaseUrl));
      if (u.protocol !== "https:" || u.username || u.password || u.port || !/\.supabase\.co$/i.test(u.hostname)) return null;
      return "https://" + u.hostname.toLowerCase() + "/functions/v1/capture-task";
    } catch (e) { return null; }
  }
  var native = window.StudyboardNative;
  native.saveCaptureToken = function (token, supabaseUrl) {
    var T = plugin("StudyboardCaptureToken");
    var endpoint = captureEndpoint(supabaseUrl);
    if (!T || typeof token !== "string" || !CAPTURE_TOKEN_RE.test(token) || !endpoint) return Promise.resolve(false);
    return T.save({ token: token, endpoint: endpoint }).then(function () { return true; }, function () { return false; });
  };
  native.clearCaptureToken = function () {
    var T = plugin("StudyboardCaptureToken");
    if (!T) return Promise.resolve(false);
    return T.clear().then(function () { return true; }, function () { return false; });
  };

  var draining = false;
  function drainSharedQueue(attempt) {
    var Q = plugin("StudyboardSharedQueue");
    if (!Q || draining) return;
    var cap = window.SBCAPTURE;
    if (!cap || typeof cap.ingest !== "function") {                // the capture module may load after the bridge: retry for ~10 s
      if ((attempt || 0) < 10) setTimeout(function () { drainSharedQueue((attempt || 0) + 1); }, 1000);
      return;
    }
    draining = true;
    Q.drain().then(function (r) {
      var items = r && Array.isArray(r.items) ? r.items.slice(0, 50) : [];
      var done = [];
      return items.reduce(function (chain, item) {
        return chain.then(function () {
          if (!item || typeof item.id !== "string" || !/^[\w-]{1,64}$/.test(item.id)) return null;
          if (item.kind === "route") {                              // e.g. "studyboard://capture?photo=1" saved by OpenCaptureIntent
            var fresh = Date.now() - Number(item.createdAt || 0) < 120000;
            if (fresh && typeof cap.handleUrl === "function" && /^studyboard:\/\//.test(String(item.url))) cap.handleUrl(String(item.url));
            done.push(item.id);
            return null;
          }
          return Promise.resolve(cap.ingest(item)).then(function (ok) { if (ok !== false) done.push(item.id); }, function () {});
        });
      }, Promise.resolve()).then(function () { return done.length ? Q.ack({ ids: done }) : null; });
    }).catch(function () {}).then(function () { draining = false; });
  }
  native.drainSharedQueue = function () { drainSharedQueue(0); };
  drainSharedQueue(0);
  if (P.App) P.App.addListener("appStateChange", function (st) { if (st && st.isActive) drainSharedQueue(0); });

  /* 6. Purchases through RevenueCat: Apple In-App Purchase on iOS, Google Play Billing on Android. OWNER: put your RevenueCat PUBLIC SDK keys
        below ("appl_..." from the App Store app and "goog_..." from the Play Store app of the same RevenueCat project), create an offering
        with a monthly and an annual package, and an entitlement called "pro". The page never trusts this file for Pro: RevenueCat tells our
        server (webhook), and the page re-reads the plan from the server after every result. The app user id is the Supabase user id.
        StudyboardNative.purchasesAvailable is false when the plugin is missing or no real key is set for THIS platform. Then the checkout and
        restore events are NOT claimed (no preventDefault), so the page says buying isn't available in this build; the page should also hide
        the Buy buttons when purchasesAvailable === false (README-IOS.md, "Purchase bridge contract"). */
  var RC_KEYS = { ios: "appl_REPLACE_WITH_REVENUECAT_PUBLIC_KEY", android: "goog_REPLACE_WITH_REVENUECAT_PUBLIC_KEY" };
  var RC_KEY_RE = { ios: /^appl_[A-Za-z0-9]{10,64}$/, android: /^goog_[A-Za-z0-9]{10,64}$/ };   // the placeholders fail this on purpose
  var RC_KEY = RC_KEYS[platform], RC_ENTITLEMENT = "pro";
  var RC = P.Purchases, rcReady = null;
  var purchasesAvailable = !!RC && RC_KEY_RE[platform].test(RC_KEY);
  native.purchasesAvailable = purchasesAvailable;
  var MANAGE_URL = isAndroid ? "https://play.google.com/store/account/subscriptions?package=com.studioso.app" : "https://apps.apple.com/account/subscriptions";
  function result(action, status, message) {
    try { window.dispatchEvent(new CustomEvent("studyboard:purchase-result", { detail: { action: action, status: status, message: message || "" } })); } catch (e) {}
  }
  function rcSetup(userId) {
    if (!purchasesAvailable) return Promise.reject(new Error("Purchases aren't set up in this build yet."));
    if (!rcReady) rcReady = RC.configure({ apiKey: RC_KEY, appUserID: userId || null });
    return Promise.resolve(rcReady).then(function () { return userId ? RC.logIn({ appUserID: userId }) : null; });
  }
  var isCancel = function (e) { return !!(e && (e.userCancelled || /cancel/i.test(String(e.message || "")))); };
  var active = function (info) { return !!(info && info.customerInfo ? info.customerInfo.entitlements.active[RC_ENTITLEMENT] : info && info.entitlements && info.entitlements.active[RC_ENTITLEMENT]); };
  // "claim" = tell the page we are handling it (preventDefault), then answer later with a result.
  if (purchasesAvailable) window.addEventListener("studyboard:plan-checkout", function (ev) {
    ev.preventDefault();
    var d = ev.detail || {};
    rcSetup(d.userId).then(function () { return RC.getOfferings(); }).then(function (o) {
      var cur = o && o.current, pkg = cur && (d.period === "yearly" ? cur.annual : cur.monthly);
      if (!pkg) throw new Error("That plan isn't available right now.");
      return RC.purchasePackage({ aPackage: pkg });
    }).then(function () { result("checkout", "success"); },
      function (e) { isCancel(e) ? result("checkout", "cancelled") : result("checkout", "error", "The purchase didn't go through. You weren't charged."); });
  });
  if (purchasesAvailable) window.addEventListener("studyboard:plan-restore", function (ev) {
    ev.preventDefault();
    var d = ev.detail || {};
    rcSetup(d.userId).then(function () { return RC.restorePurchases(); }).then(function (info) { result("restore", active(info) ? "success" : "nothing"); },
      function () { result("restore", "error", "Couldn't restore purchases. Check your connection and try again."); });
  });
  window.addEventListener("studyboard:plan-manage", function (ev) {
    ev.preventDefault();
    // RevenueCat's managementURL points at the store the subscription was bought in; otherwise this platform's own subscriptions page.
    (purchasesAvailable && rcReady ? Promise.resolve(rcReady).then(function () { return RC.getCustomerInfo(); }) : Promise.reject(new Error("no rc"))).then(function (r) {
      var u = r && r.customerInfo && r.customerInfo.managementURL;
      return typeof u === "string" && /^https:\/\//.test(u) ? u : MANAGE_URL;
    }, function () { return MANAGE_URL; }).then(function (u) {
      if (P.Browser) return P.Browser.open({ url: u }).catch(function () {});
    }).then(function () { result("manage", "success"); });
  });
})();
