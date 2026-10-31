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

   7. Focus timer Live Activity (iPhone, UNTESTED): StudyboardNative.focusActivity.show(state) / end() put the running Focus timer in the Dynamic Island
      and on the Lock Screen through the local plugin StudyboardFocusActivity (ios-wrapper/native/FocusActivity). show() resolves true when it is showing,
      so the page can take the timer out of its own header. Missing on Android and when the plugin isn't in the build.

   Needs these Capacitor plugins installed (README-IOS.md section 2, README-ANDROID.md section 2): @capacitor/app, @capacitor/browser, @capacitor/push-notifications,
   capacitor-secure-storage-plugin, @revenuecat/purchases-capacitor (section 6), @capacitor/screen-orientation (section 8), @capacitor/keyboard (section 9), plus the two local plugins in ios-wrapper/native (StudyboardCaptureToken, StudyboardSharedQueue) for section 5. */
(function () {
  "use strict";
  var C = window.Capacitor;
  if (!C || typeof C.isNativePlatform !== "function" || !C.isNativePlatform()) return;
  var P = C.Plugins || {};

  /* 0. The app never zooms as a whole (iOS would zoom in on a focused text box and stay there); boards zoom inside the page */
  var noZoom = function () { try { var vp = document.querySelector('meta[name="viewport"]'); if (vp) vp.content = "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"; } catch (e) {} };
  noZoom(); document.addEventListener("DOMContentLoaded", noZoom);   // this file loads at the top of <head>, before the tag exists

  /* 1. Keychain-backed storage for the Supabase session */
  var S = P.SecureStoragePlugin;
  if (S) {
    var key = function (k) { return "studyboard." + String(k).replace(/[^\w.-]/g, "_").slice(0, 80); };
    window.StudyboardAuthStorage = {
      getItem: function (k) {
        return S.get({ key: key(k) }).then(function (r) { return r && typeof r.value === "string" ? r.value : null; }, function () {
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

  /* 2. Links */
  // payment pages stay closed in the store apps, except for United States App Store accounts (section 6, extBuy)
  var extBuy = false;
  var BLOCKED = /(^|\.)(stripe\.com|paypal\.com|paypal\.me|paddle\.com|lemonsqueezy\.com|gumroad\.com|ko-fi\.com|buymeacoffee\.com|patreon\.com)$/i;
  function safeLink(raw) {
    try {
      var u = new URL(String(raw), window.location.href);
      if (u.protocol === "mailto:") return u.href;
      if (u.protocol !== "https:" || u.username || u.password || (BLOCKED.test(u.hostname) && !extBuy)) return null;
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
  window.open = function (url) { openExternal(url); return null; };
  document.addEventListener("click", function (e) {
    var a = e.target && e.target.closest ? e.target.closest("a[href]") : null;
    if (!a) return;
    var href = a.getAttribute("href") || "";
    if (/^(#|\/|\.|capacitor:)/.test(href) && a.target !== "_blank") return;
    if (/^(https?:|mailto:)/i.test(href) || a.target === "_blank") { e.preventDefault(); openExternal(a.href); }
  }, true);

  /* 3. Deep links */
  if (P.App) {
    P.App.addListener("appUrlOpen", function (ev) {
      try {
        var u = new URL(ev.url), q = new URLSearchParams();
        // the end of Sign in with Google / Apple in the browser tab (section 11)
        if (u.protocol === "studyboard:" && u.hostname === "auth-callback") { if (authBack) authBack(String(ev.url)); return; }
        if (u.protocol === "studyboard:" && (u.hostname === "add" || u.hostname === "capture")) {
          var tries = 0, raw = String(ev.url);
          (function route() {
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
      } catch (e) { }
    });
    // Android's Back button closes an open sheet, then goes back a page, then to the Board; only from the Board does it leave the app
    P.App.addListener("backButton", function () {
      try { if (window.SBBACK && window.SBBACK.handle()) return; } catch (e) { }
      if (typeof P.App.exitApp === "function") P.App.exitApp();
    });
  }

  /* 4. Push notifications through @capacitor/push-notifications */
  var platform = typeof C.getPlatform === "function" && C.getPlatform() === "android" ? "android" : "ios";
  var isAndroid = platform === "android";
  // iPad or iPhone
  var device = isAndroid ? "android" : (function () {
    try {
      var D = window.StudyboardDevice;
      if (D && (D.idiom === "pad" || D.idiom === "phone")) return D.idiom === "pad" ? "ipad" : "iphone";
      var ua = navigator.userAgent || "";
      return /iPad/.test(ua) || (/Macintosh/.test(ua) && (navigator.maxTouchPoints || 0) > 1) ? "ipad" : "iphone";
    } catch (e) { return "iphone"; }
  })();
  // OWNER: set android to true only after android/app/google-services.json is in place
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
        timer = setTimeout(function () { finish(null); }, 20000);
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
    // Tapping a reminder
    Push.addListener("pushNotificationActionPerformed", function (a) {
      try {
        var d = (a && a.notification && a.notification.data) || {}, q = new URLSearchParams();
        if (typeof d.taskId === "string" && /^[\w.:-]{1,200}$/.test(d.taskId)) q.set("sbtask", d.taskId);
        if (typeof d.rid === "string" && /^[\w.:-]{1,200}$/.test(d.rid)) q.set("sbrid", d.rid);
        if (String(q)) window.location.href = window.location.pathname + "?" + q.toString();
      } catch (e) { }
    });
  }
  window.StudyboardNative = Object.assign(window.StudyboardNative || {}, {
    forwardsDeepLinks: true,
    platform: platform,
    device: device,
    store: isAndroid ? "google-play" : "app-store",
    pushAvailable: pushOk,
    enablePush: function (opts) { return getPushToken(!(opts && opts.prompt === false)); },
    disablePush: function () {
      if (!pushOk) return Promise.resolve(false);
      return Promise.resolve(Push.unregister()).then(function () { return true; }, function () { return false; });
    }
  });

  /* 5. Quick capture */
  function plugin(name) {
    try { return P[name] || (typeof C.registerPlugin === "function" ? C.registerPlugin(name) : null); } catch (e) { return null; }
  }
  var CAPTURE_TOKEN_RE = /^[A-Za-z0-9._~+\/-]{16,512}$/;
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
    if (!cap || typeof cap.ingest !== "function") {
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
          if (item.kind === "route") {
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

  /* 6. Purchases through RevenueCat */
  var RC_KEYS = { ios: "appl_REPLACE_WITH_REVENUECAT_PUBLIC_KEY", android: "goog_REPLACE_WITH_REVENUECAT_PUBLIC_KEY" };
  var RC_KEY_RE = { ios: /^appl_[A-Za-z0-9]{10,64}$/, android: /^goog_[A-Za-z0-9]{10,64}$/ };
  var RC_KEY = RC_KEYS[platform], RC_ENTITLEMENT = "pro";
  var RC = P.Purchases, rcReady = null;
  var purchasesAvailable = !!RC && RC_KEY_RE[platform].test(RC_KEY);
  native.purchasesAvailable = purchasesAvailable;
  // The App Store country of the person's Apple account. United States accounts may be sent to buy Pro on the website
  // (App Store Review Guidelines 3.1.1(a) and 3.1.3, United States storefront), so for them StudyboardNative.externalPurchase
  // is true and the Pro sheet uses the website's checkout; everywhere else it's in-app purchase through RevenueCat. Android
  // always uses Google Play billing. Remembered between launches, so the sheet is right from the start; the page hears
  // "studyboard:storefront" when it changes.
  var SF_KEY = "studyboard:storefront";
  native.storefront = null; native.externalPurchase = false;
  function setStorefront(code) {
    code = /^[A-Z]{3}$/.test(String(code || "")) ? String(code) : "";
    if (!code || code === native.storefront) return;
    native.storefront = code;
    extBuy = !isAndroid && code === "USA";
    native.externalPurchase = extBuy;
    try { localStorage.setItem(SF_KEY, code); } catch (e) {}
    try { window.dispatchEvent(new CustomEvent("studyboard:storefront", { detail: { country: code, externalPurchase: extBuy } })); } catch (e) {}
  }
  if (!isAndroid) {
    try { setStorefront(localStorage.getItem(SF_KEY)); } catch (e) {}
    var SP = P.StudyboardStore;
    try { if (!SP && C.isPluginAvailable && C.isPluginAvailable("StudyboardStore") && C.registerPlugin) SP = C.registerPlugin("StudyboardStore"); } catch (e) {}
    var askStorefront = function () {
      if (!SP || typeof SP.storefront !== "function") return;
      Promise.resolve().then(function () { return SP.storefront(); }).then(function (r) { if (r && r.country) setStorefront(r.country); }, function () {});
    };
    askStorefront();
    if (P.App) P.App.addListener("appStateChange", function (st) { if (st && st.isActive) askStorefront(); });
    // EU: the website as a second way to buy, under Apple's External Purchases or Offers entitlement (10-plan.js decides
    // when to offer it). eligible(): Apple says yes for this device, account and country; tokens(): Apple's reporting tokens;
    // notice(): Apple's disclosure sheet, "continued" / "cancelled" / "unavailable"; open(url): the person's own browser.
    if (SP && typeof SP.linkEligible === "function") {
      native.linkOut = {
        eligible: function () { return Promise.resolve().then(function () { return SP.linkEligible(); }).then(function (r) { return !!(r && r.value); }, function () { return false; }); },
        tokens: function () { return Promise.resolve().then(function () { return SP.linkTokens(); }).then(function (r) { return (r && Array.isArray(r.tokens) ? r.tokens : []).filter(function (t) { return typeof t === "string" && /^[A-Za-z0-9_=-]{20,4000}$/.test(t); }).slice(0, 4); }, function () { return []; }); },
        notice: function () { return Promise.resolve().then(function () { return SP.linkNotice(); }).then(function (r) { return r && /^(continued|cancelled|unavailable)$/.test(r.result) ? r.result : "unavailable"; }, function () { return "unavailable"; }); },
        open: function (url) { if (!/^https:\/\//.test(String(url || ""))) return Promise.resolve(false); return Promise.resolve().then(function () { return SP.openBrowser({ url: String(url) }); }).then(function (r) { return !!(r && r.value); }, function () { return false; }); }
      };
    }
  }
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
  // RevenueCat keeps a one-time semester purchase "active" for good; it gives Pro for 4 months from the purchase
  var SEM_MS = 123 * 86400e3;
  var active = function (info) {
    var ent = info && info.customerInfo ? info.customerInfo.entitlements.active[RC_ENTITLEMENT] : info && info.entitlements && info.entitlements.active[RC_ENTITLEMENT];
    if (ent && !ent.expirationDate && /semester/i.test(String(ent.productIdentifier || ""))) return Date.now() - Date.parse(ent.latestPurchaseDate || 0) < SEM_MS;
    return !!ent;
  };
  // "claim" = tell the page we are handling it (preventDefault)
  if (purchasesAvailable) window.addEventListener("studyboard:plan-checkout", function (ev) {
    ev.preventDefault();
    var d = ev.detail || {};
    rcSetup(d.userId).then(function () { return RC.getOfferings(); }).then(function (o) {
      // semester: a 4-month purchase that doesn't renew, the offering's custom package "semester" (the stores have no
      // 4-month renewing length)
      var cur = o && o.current, pkg = cur && (d.period === "yearly" ? cur.annual : d.period === "semester" ? (cur.availablePackages || []).filter(function (p) { return p && p.identifier === "semester"; })[0] : cur.monthly);
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
    (purchasesAvailable && rcReady ? Promise.resolve(rcReady).then(function () { return RC.getCustomerInfo(); }) : Promise.reject(new Error("no rc"))).then(function (r) {
      var u = r && r.customerInfo && r.customerInfo.managementURL;
      return typeof u === "string" && /^https:\/\//.test(u) ? u : MANAGE_URL;
    }, function () { return MANAGE_URL; }).then(function (u) {
      if (P.Browser) return P.Browser.open({ url: u }).catch(function () {});
    }).then(function () { result("manage", "success"); });
  });

  /* 7. Focus timer in the Dynamic Island (iOS Live Activity) */
  // found by name too, in case it was registered after the plugin list was handed to the page
  var FA = P.StudyboardFocusActivity;
  try { if (!FA && C.isPluginAvailable && C.isPluginAvailable("StudyboardFocusActivity") && C.registerPlugin) FA = C.registerPlugin("StudyboardFocusActivity"); } catch (e) {}
  // Why the island isn't showing, for the Focus sheet: "setup" (the plugin and widget aren't in this build), "off" (Live
  // Activities are turned off for Studyboard in Settings), or "ok"
  if (!(C.getPlatform && C.getPlatform() === "android")) window.StudyboardNative = Object.assign(window.StudyboardNative || {}, {
    islandStatus: function () {
      if (!FA || typeof FA.available !== "function") return Promise.resolve("setup");
      return Promise.resolve().then(function () { return FA.available(); }).then(function (r) { return r && r.value ? "ok" : "off"; }, function () { return "setup"; });
    }
  });
  if (FA && !(C.getPlatform && C.getPlatform() === "android")) {
    var str = function (v, n) { return String(v == null ? "" : v).slice(0, n); };
    window.StudyboardNative = Object.assign(window.StudyboardNative || {}, {
      focusActivity: {
        show: function (st) {
          st = st || {};
          var mode = ["focus", "short", "long"].indexOf(st.mode) >= 0 ? st.mode : "focus";
          return Promise.resolve().then(function () {
            return FA.show({mode: mode, label: str(st.label, 24), task: str(st.task, 80), running: !!st.running,
              endsAt: Number(st.endsAt) || 0, left: Math.round(Number(st.left) || 0), total: Math.round(Number(st.total) || 1500),
              accent: /^#[0-9a-f]{6}$/i.test(String(st.accent || "")) ? st.accent : "",
              plan: (Array.isArray(st.plan) ? st.plan : []).slice(0, 8).map(function (x) { return {mode: ["focus", "short", "long"].indexOf(x && x.mode) >= 0 ? x.mode : "focus", label: str(x && x.label, 24), total: Math.round(Number(x && x.total) || 1500)}; })});
          }).then(function (r) { return !!(r && r.shown); }, function () { return false; });
        },
        end: function () { return Promise.resolve().then(function () { return FA.end(); }).then(function () {}, function () {}); },
        // Pause, Play and Skip pressed on the Lock Screen: [{a: "pause"|"play"|"skip"|"reset", t: ms}], oldest first, each handed over once
        take: function () {
          if (typeof FA.take !== "function") return Promise.resolve([]);
          return Promise.resolve().then(function () { return FA.take(); }).then(function (r) {
            return (r && Array.isArray(r.actions) ? r.actions : []).filter(function (x) { return x && ["pause", "play", "skip", "reset"].indexOf(x.a) >= 0 && Number(x.t) > 0; })
              .map(function (x) { var o = {a: x.a, t: Number(x.t)}; if (Number(x.left) >= 0) o.left = Number(x.left); if (Number(x.end) > 0) o.end = Number(x.end); return o; });
          }, function () { return []; });
        },
        // The session-end alarm iOS rings itself: hasSound(name) says whether that sound file is saved already; alarm({name, wav})
        // saves it (wav: base64) and asks once to ring; resolves whether ringing is allowed
        hasSound: function (name) { if (typeof FA.hasSound !== "function") return Promise.resolve(false); return Promise.resolve().then(function () { return FA.hasSound({name: String(name)}); }).then(function (r) { return !!(r && r.value); }, function () { return false; }); },
        alarm: function (o) { if (typeof FA.alarm !== "function") return Promise.resolve(false); o = o || {}; return Promise.resolve().then(function () { return FA.alarm({name: String(o.name || ""), wav: typeof o.wav === "string" ? o.wav : undefined}); }).then(function (r) { return !!(r && r.allowed); }, function () { return false; }); },
        // fn() runs when one is pressed while the app is open in the background (and the page calls take())
        onAction: function (fn) { try { if (FA.addListener) FA.addListener("action", function () { fn(); }); } catch (e) {} }
      }
    });
  }

  /* 11. Sign in with Apple and Google. StudyboardNative.signIn: apple() is Apple's own sheet on iPhone ({idToken, nonce, name},
         null if cancelled, {error}); open(url) shows a provider's sign-in page in Apple's secure sign-in window (iPhone) or a
         browser tab (Android) and resolves with the studyboard://auth-callback address it returns to, or null.
         Google refuses sign-in inside an app's own web view, so it always goes through one of these. */
  var SI = P.StudyboardSignIn;
  try { if (!SI && C.isPluginAvailable && C.isPluginAvailable("StudyboardSignIn") && C.registerPlugin) SI = C.registerPlugin("StudyboardSignIn"); } catch (e) {}
  var authBack = null;
  var isIOS = !(C.getPlatform && C.getPlatform() === "android");
  window.StudyboardNative = Object.assign(window.StudyboardNative || {}, {
    signIn: {
      redirect: "studyboard://auth-callback",
      apple: isIOS && SI && typeof SI.apple === "function" ? function () {
        return Promise.resolve().then(function () { return SI.apple(); }).then(function (r) {
          if (r && r.error) return {error: String(r.error)};
          return r && r.idToken ? {idToken: String(r.idToken), nonce: String(r.nonce || ""), name: String(r.name || "").slice(0, 80), code: /^[A-Za-z0-9._-]{10,1000}$/.test(String(r.code || "")) ? String(r.code) : ""} : null;
        }, function (e) { return {error: (e && e.message) || "Sign in with Apple isn't available."}; });
      } : null,
      open: function (url) {
        if (!/^https:\/\//.test(String(url || ""))) return Promise.resolve(null);
        if (isIOS && SI && typeof SI.web === "function") {
          return Promise.resolve().then(function () { return SI.web({url: String(url)}); }).then(function (r) { return r && r.url ? String(r.url) : null; }, function () { return null; });
        }
        if (!P.Browser) return Promise.resolve(null);
        return new Promise(function (resolve) {
          var done = false, sub = null;
          var finish = function (v) { if (done) return; done = true; authBack = null; try { if (sub && sub.remove) sub.remove(); } catch (e) {} resolve(v); };
          authBack = function (back) { try { P.Browser.close(); } catch (e) {} finish(back); };
          try { Promise.resolve(P.Browser.addListener("browserFinished", function () { setTimeout(function () { finish(null); }, 1200); })).then(function (h) { sub = h; }); } catch (e) {}
          P.Browser.open({url: String(url)}).catch(function () { finish(null); });
        });
      }
    }
  });

  /* 8. Phones stay upright; only full-screen notes and the whiteboard turn sideways (@capacitor/screen-orientation).
        Locked, the page never needs its "turn your phone upright" screen. iPads turn freely. */
  var SO = P.ScreenOrientation;
  var phoneDevice = function () { var d = window.StudyboardDevice; if (d && d.idiom) return d.idiom === "phone"; return Math.min(screen.width, screen.height) < 600; };
  if (SO && phoneDevice()) {
    var want = "";
    var orient = function () {
      var free = document.documentElement.classList.contains("board-max"), w = free ? "free" : "portrait";
      if (w === want) return;
      want = w;
      Promise.resolve().then(function () { return free ? SO.unlock() : SO.lock({ orientation: "portrait" }); }).catch(function () { want = ""; });
    };
    var watch = function () { orient(); new MutationObserver(orient).observe(document.documentElement, { attributes: true, attributeFilter: ["class"] }); };
    if (document.documentElement) watch(); else document.addEventListener("DOMContentLoaded", watch);
  }

  /* 9. The keyboard (@capacitor/keyboard, "resize": "none" in capacitor.config.json): the app keeps its full size and the
        keyboard slides over it. Shrinking the app instead meant iOS stopped drawing what was behind the keyboard and had to
        redraw the bottom of the screen every time it closed. The page is told the keyboard's height (--kb-h, --vv-h,
        window.sbVisibleH) as it starts to open, so the text box, sheets and chat move above it; the tab bar steps aside;
        and iOS isn't allowed to slide the page up to reveal the text box (the page has already put it in view). */
  var KB = P.Keyboard;
  if (KB) {
    var root = function () { return document.documentElement; };
    var kbMark = function () { var r = root(); if (r) r.classList.add("kb-native"); };
    kbMark(); document.addEventListener("DOMContentLoaded", kbMark);
    try { KB.setAccessoryBarVisible({ isVisible: false }); } catch (e) {}
    // The app hears about the keyboard before its frame has shrunk. Until it has, whatever the keyboard covers is passed on as
    // --kb-h (and the visible height as --vv-h, window.sbVisibleH), so sheets and the chat sit above the keyboard from the
    // first frame instead of slipping behind it for a moment
    var kbH = 0, fullH = 0, isOpen = false, closeT = 0;
    // fullH: the app's full height. Read whenever no keyboard is up (this file runs so early the page can still report 0),
    // and the keyboard can never be taken to cover more than its own height
    var full = function () { if (!isOpen && innerHeight > 0) fullH = Math.max(fullH, innerHeight); return fullH > 0 ? fullH : innerHeight; };
    var cover = function () { return isOpen && kbH ? Math.max(0, Math.min(kbH, Math.round(innerHeight - (full() - kbH)))) : 0; };
    var apply = function () {
      var r = root(); if (!r) return;
      full();
      var c = cover();
      r.style.setProperty("--kb-h", c + "px"); r.style.setProperty("--vv-h", (innerHeight - c) + "px");
      try { window.dispatchEvent(new Event("sb-kb-cover")); } catch (e) {}
    };
    window.sbVisibleH = function () { return innerHeight - cover(); };
    var hideT = 0, backT = 0;
    var kbOn = function (on, h) {
      var r = root(); if (!r) return;
      clearTimeout(hideT);
      if (on) {
        // iOS often reports the keyboard closing and opening again at once (focus moving between boxes, a sheet closing):
        // a close that is followed straight away by an open never touches the page, so the bars don't blink
        full(); isOpen = true; kbH = h || kbH; clearTimeout(closeT); clearTimeout(backT); r.classList.remove("kb-closing", "kb-back"); r.classList.add("kb-open"); apply(); return;
      }
      // iOS also reports the keyboard closing when the app comes back to the front, with no keyboard having been open:
      // that's ignored, so the tab bar is never hidden for it
      if (!isOpen && !r.classList.contains("kb-open")) return;
      // the keyboard slides over the app (resize "none"), so the tab bar never had to move: it's simply there when it closes
      hideT = setTimeout(function () { isOpen = false; r.classList.remove("kb-open"); apply(); }, 60);
    };
    addEventListener("resize", apply); document.addEventListener("DOMContentLoaded", apply); addEventListener("load", apply);
    // coming back to the app: no keyboard is up any more, and the bars are simply there (no waiting, no fade)
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) return;
      var r = root(); if (!r) return;
      clearTimeout(hideT); clearTimeout(closeT); clearTimeout(backT);
      if (!document.activeElement || !/^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName)) { isOpen = false; r.classList.remove("kb-open", "kb-closing", "kb-back"); apply(); }
    });
    var w0 = innerWidth; addEventListener("resize", function () { if (innerWidth !== w0) { w0 = innerWidth; fullH = 0; } });
    apply();
    // iOS scrolls the page to reveal the focused box when the keyboard comes up; the page has already moved it into view, so
    // that scroll is undone (only the one iOS makes as the keyboard arrives, never your own scrolling)
    var keepY = null, keepT = 0, realOpen = false;
    var holdScroll = function () { keepY = window.scrollY; clearTimeout(keepT); keepT = setTimeout(function () { keepY = null; }, 700); };
    addEventListener("scroll", function () { if (keepY !== null && Math.abs(window.scrollY - keepY) > 1) window.scrollTo(0, keepY); }, {passive: true});
    document.addEventListener("focusin", function (e) { var t = e.target; if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) holdScroll(); }, true);
    try {
      // while typing the app itself can't scroll, so iOS has nothing to slide (the boxes have been moved into view already, and
      // lists inside sheets still scroll); it's always switched back on when the keyboard goes or the app comes back
      KB.addListener("keyboardWillShow", function (info) { realOpen = true; clearTimeout(expectT); holdScroll(); kbOn(true, info && info.keyboardHeight); try { KB.setScroll({ isDisabled: true }); } catch (e) {} });
      KB.addListener("keyboardWillHide", function () { realOpen = false; kbOn(false); try { KB.setScroll({ isDisabled: false }); } catch (e) {} });
      document.addEventListener("visibilitychange", function () { if (!document.hidden) try { KB.setScroll({ isDisabled: false }); } catch (e) {} });
      // the lock goes on the moment a text box is tapped, before the keyboard starts to rise (iOS begins its slide as the
      // keyboard appears, which can be before the app hears about it); tapping away with no box focused switches it off
      var isBox = function (t) { return !!t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable) && !/^(checkbox|radio|button|submit|range|color|file)$/i.test(t.type || ""); };
      var unlockT = 0;
      // a box tapped while no keyboard is up: the keyboard is about to come, and its height is known from last time, so the
      // page makes room for it straight away (the editor heads to its final spot in one move); if no keyboard comes (a
      // hardware keyboard), that's undone
      var expectT = 0;
      document.addEventListener("focusin", function (e) {
        if (!isBox(e.target)) return;
        clearTimeout(unlockT); try { KB.setScroll({ isDisabled: true }); } catch (x) {}
        if (!isOpen && kbH > 0) { kbOn(true, kbH); clearTimeout(expectT); expectT = setTimeout(function () { if (!realOpen) kbOn(false); }, 900); }
      }, true);
      document.addEventListener("focusout", function () { clearTimeout(unlockT); unlockT = setTimeout(function () { if (!isBox(document.activeElement) && !isOpen) try { KB.setScroll({ isDisabled: false }); } catch (x) {} }, 120); }, true);
    } catch (e) {}
  }

  /* 10. The app's frame behind the page takes the page's background colour (MainViewController, "sbBg"), so nothing of
         another colour shows while the app resizes around the keyboard */
  (function () {
    var post = window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.sbBg;
    if (!post) return;
    var last = "", t = 0;
    var hex = function (c) { var m = /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/.exec(c || ""); if (!m || (m[4] != null && +m[4] < 0.5)) return ""; return "#" + [m[1], m[2], m[3]].map(function (x) { return ("0" + (+x).toString(16)).slice(-2); }).join(""); };
    var send = function () {
      t = 0;
      var b = document.body, h = document.documentElement; if (!b) return;
      // the colour at the top of the screen: the header bar, else the theme scene's sky, else the page (a scene theme's page
      // colour is a plain light one that the scene covers, which showed as a light blue strip)
      var c = hex(getComputedStyle(b).backgroundColor) || hex(getComputedStyle(h).backgroundColor);
      var art = document.getElementById("sceneArt");
      if (art) { var sky = getComputedStyle(art), g = /rgba?\([^)]*\)/.exec(sky.backgroundImage || ""); c = hex(sky.backgroundColor) || (g ? hex(g[0]) : "") || c; }
      var top = document.querySelector("header.top"); if (top) c = hex(getComputedStyle(top).backgroundColor) || c;
      if (c && c !== last) { last = c; try { post.postMessage(c); } catch (e) {} }
    };
    var soon = function () { if (!t) t = setTimeout(send, 120); };
    var watch = function () { send(); new MutationObserver(soon).observe(document.documentElement, { attributes: true, attributeFilter: ["class", "style", "data-theme", "data-skin"] }); if (document.body) new MutationObserver(soon).observe(document.body, { attributes: true, childList: true }); };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", watch); else watch();
  })();
})();
