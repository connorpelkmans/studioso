// Studyboard account page: sign in, sign up, reset password, see your plan, start Pro, manage billing.
// It uses the SAME Supabase accounts as the app. Everything shown comes from the database or the user's own typing and is
// written with textContent only (never innerHTML), so nothing typed or received can run as code.
// The browser never sends a price, an amount or a customer id: only "monthly" or "yearly". The server decides the rest.
(function () {
  "use strict";
  var cfg = window.STUDYBOARD_SITE || {};
  var PLACEHOLDER = /YOUR-/;
  var $ = function (id) { return document.getElementById(id); };
  var views = ["v-loading", "v-config", "v-auth", "v-account"];
  var forms = ["form-signin", "form-signup", "form-reset", "form-code", "form-newpass"];
  var state = { sb: null, session: null, recovering: false, codeMode: null, codeEmail: "", autoTimer: null, busy: false };
  var GRACE_DAYS = 3;   // the stored end of a paid period already includes 3 days of grace

  function show(v) { views.forEach(function (x) { $(x).hidden = x !== v; }); }
  function showForm(f) {
    forms.forEach(function (x) { $(x).hidden = x !== f; });
    var tabs = { "form-signin": "tab-signin", "form-signup": "tab-signup", "form-reset": "tab-reset" };
    ["tab-signin", "tab-signup", "tab-reset"].forEach(function (t) {
      var on = tabs[f] === t; $(t).setAttribute("aria-selected", String(on)); $(t).tabIndex = on ? 0 : -1;
    });
    $("auth-msg").hidden = true;
  }
  function msg(el, text, kind) {
    el.textContent = text || ""; el.hidden = !text;
    el.className = "msg" + (kind ? " " + kind : "");
  }
  function validHttps(u) { try { var x = new URL(u); return x.protocol === "https:" ? x : null; } catch (e) { return null; } }
  function configured() {
    var u = validHttps(cfg.SUPABASE_URL);
    return !!(u && !PLACEHOLDER.test(cfg.SUPABASE_URL) && typeof cfg.SUPABASE_ANON_KEY === "string" && cfg.SUPABASE_ANON_KEY.length > 20 && !PLACEHOLDER.test(cfg.SUPABASE_ANON_KEY) && window.supabase);
  }

  // ----- What the link asked for (checked, never trusted) -----
  var qs = new URLSearchParams(location.search);
  var wantPlan = qs.get("plan") === "monthly" || qs.get("plan") === "yearly" ? qs.get("plan") : null;
  var fromApp = qs.get("src") === "app";
  // "&return=" is honoured only for https addresses whose origin is APP_URL or on RETURN_ALLOWLIST. Anything else is ignored.
  function allowedReturn(candidate) {
    var x = validHttps(candidate); if (!x || x.username || x.password) return null;
    var ok = [];
    var app = validHttps(cfg.APP_URL); if (app && !PLACEHOLDER.test(cfg.APP_URL)) ok.push(app.origin);
    (Array.isArray(cfg.RETURN_ALLOWLIST) ? cfg.RETURN_ALLOWLIST : []).forEach(function (o) { var y = validHttps(o); if (y) ok.push(y.origin); });
    return ok.indexOf(x.origin) >= 0 ? x.href : null;
  }
  var backUrl = allowedReturn(qs.get("return")) || (function () { var a = validHttps(cfg.APP_URL); return a && !PLACEHOLDER.test(cfg.APP_URL) ? a.href : null; })();

  // ----- Friendly words for errors (the app uses the same wording) -----
  function words(error, fallback) {
    var m = String((error && (error.message || error.error_description)) || error || ""), st = Number(error && error.status) || 0;
    if (/email not confirmed/i.test(m)) return "Please confirm your email first. We sent you a code.";
    if (/invalid login credentials/i.test(m)) return "That email and password don't match. Try again, or reset your password.";
    if (/already registered|already exists/i.test(m)) return "There's already an account with that email. Sign in instead.";
    if (/rate limit|too many|security purposes/i.test(m) || st === 429) return "Too many tries just now. Wait a minute or two, then try again.";
    if (/expired|invalid.*(token|otp|code)|token.*(invalid|expired)/i.test(m)) return "That code didn't work or has expired. Check it, or send a new one.";
    if (/password.*(at least|short|weak|characters)|weak password/i.test(m)) return "Choose a stronger password: at least 8 characters, not easy to guess.";
    if (/invalid.*email|email.*invalid|unable to validate email/i.test(m)) return "That email address doesn't look right.";
    if (/signups? not allowed|signup.*disabled/i.test(m)) return "New accounts can't be made right now. Please try again later.";
    if (/fetch|network|timed? ?out|Load failed/i.test(m)) return "Couldn't reach Studyboard. Check your internet connection and try again.";
    return fallback || "Something went wrong. Please try again.";
  }

  // ----- Sign-in rate-limit messaging: after 5 wrong tries in 10 minutes the button rests for a minute -----
  var fails = [], lockUntil = 0, lockTimer = null;
  function noteFail() {
    var now = Date.now(); fails = fails.filter(function (t) { return now - t < 600000; }); fails.push(now);
    if (fails.length >= 5) { lockUntil = now + 60000; fails = []; tickLock(); }
  }
  function tickLock() {
    var btn = $("form-signin").querySelector("button[type=submit]");
    var left = Math.ceil((lockUntil - Date.now()) / 1000);
    if (left > 0) {
      btn.disabled = true; btn.textContent = "Wait " + left + "s";
      msg($("auth-msg"), "Too many wrong tries. For safety, please wait " + left + " seconds, or reset your password.", "error");
      clearTimeout(lockTimer); lockTimer = setTimeout(tickLock, 1000);
    } else { btn.disabled = false; btn.textContent = "Sign in"; msg($("auth-msg"), ""); }
  }

  // ----- Plan display -----
  function fmt(iso) { try { return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }); } catch (e) { return ""; } }
  function describe(e) {
    var now = Date.now(), res = { tag: "Free", pro: false, detail: "You're on the free plan. Pro adds unlimited devices, more storage and every theme.", subscribed: false, manage: false };
    if (!e) return res;
    var until = e.pro_until ? Date.parse(e.pro_until) : null;
    var paid = e.plan === "pro" && (until === null || until > now);
    var trial = e.trial_until && Date.parse(e.trial_until) > now;
    var grant = e.grant_until && Date.parse(e.grant_until) > now;
    res.manage = e.source === "stripe";
    if (e.plan === "lifetime" || e.grant_lifetime) return Object.assign(res, { tag: "Pro for good", pro: true, subscribed: true, detail: "You have Studyboard Pro with no end date." });
    if (paid && trial) return Object.assign(res, { tag: "Pro trial", pro: true, subscribed: true, detail: "Your free trial ends on " + fmt(e.trial_until) + (e.will_renew ? ", then your plan renews." : ". It will not renew.") });
    if (paid) {
      var end = until === null ? null : fmt(new Date(until - GRACE_DAYS * 86400000).toISOString());
      return Object.assign(res, { tag: "Pro", pro: true, subscribed: true, detail: end ? (e.will_renew ? "Your plan renews around " + end + "." : "Your plan ends on " + end + " and will not renew.") : "Your plan is active." });
    }
    if (grant) return Object.assign(res, { tag: "Pro (gift)", pro: true, detail: "Studyboard Pro is on for your account until " + fmt(e.grant_until) + "." });
    if (trial) return Object.assign(res, { tag: "Pro trial", pro: true, detail: "Your free trial ends on " + fmt(e.trial_until) + "." });
    return res;
  }

  // ----- Calling the Edge Functions (the user's own sign-in token; only a plan name goes out) -----
  function fn(name, body) {
    var base = String(cfg.SUPABASE_URL).replace(/\/+$/, "");
    return fetch(base + "/functions/v1/" + encodeURIComponent(name), {
      method: "POST", credentials: "omit", cache: "no-store",
      headers: { "Content-Type": "application/json", apikey: cfg.SUPABASE_ANON_KEY, Authorization: "Bearer " + state.session.access_token },
      body: JSON.stringify(body)
    }).then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { status: r.status, body: j }; }); });
  }
  function stripeUrl(u, host) { var x = validHttps(u); return x && x.hostname === host ? x.href : null; }
  var functions = cfg.FUNCTIONS || {};

  function startCheckout(plan) {
    if (state.busy || !state.session) return;
    state.busy = true; setBuyDisabled(true); msg($("acct-msg"), "Taking you to checkout...", "");
    var body = { plan: plan, success_url: new URL("../success.html", location.href).href, cancel_url: new URL("../cancel.html", location.href).href };
    if (fromApp) body.src = "app";
    fn(functions.checkout || "create-checkout", body).then(function (r) {
      var url = r.status === 200 ? stripeUrl(r.body && r.body.url, "checkout.stripe.com") : null;
      if (url) { location.assign(url); return; }
      var text = r.body && typeof r.body.message === "string" ? r.body.message : r.status === 401 ? "Please sign in again." : "Something went wrong starting checkout. Please try again.";
      msg($("acct-msg"), text, "error");
      state.busy = false; setBuyDisabled(false);
    }).catch(function () { msg($("acct-msg"), "Couldn't reach Studyboard. Check your connection and try again.", "error"); state.busy = false; setBuyDisabled(false); });
  }
  function setBuyDisabled(d) { ["buy-monthly", "buy-yearly", "btn-manage"].forEach(function (id) { $(id).disabled = d; }); }
  function openPortal() {
    if (state.busy) return; state.busy = true; setBuyDisabled(true); msg($("acct-msg"), "Opening billing...", "");
    fn(functions.portal || "create-portal-session", { return_url: location.origin + location.pathname }).then(function (r) {
      var url = r.status === 200 ? stripeUrl(r.body && r.body.url, "billing.stripe.com") : null;
      if (url) { location.assign(url); return; }
      msg($("acct-msg"), r.status === 404 ? "There's no card subscription on this account yet. Choose a plan above." : (r.body && r.body.message) || "Something went wrong opening billing.", "error");
      state.busy = false; setBuyDisabled(false);
    }).catch(function () { msg($("acct-msg"), "Couldn't reach Studyboard. Check your connection and try again.", "error"); state.busy = false; setBuyDisabled(false); });
  }

  // ----- Signed-in view -----
  function renderAccount() {
    show("v-account");
    $("acct-email").textContent = (state.session.user && state.session.user.email) || "";
    msg($("acct-msg"), "");
    $("back-app").hidden = !(fromApp && backUrl);
    if (backUrl) $("back-link").setAttribute("href", backUrl);
    state.sb.from("studyboard_entitlements").select("plan,pro_until,trial_until,source,will_renew,grant_until,grant_lifetime").eq("user_id", state.session.user.id).maybeSingle()
      .then(function (r) {
        var d = describe(r && r.data);
        $("plan-tag").textContent = d.tag; $("plan-tag").className = "tag" + (d.pro ? " pro" : "");
        $("plan-detail").textContent = d.detail;
        $("buy-panel").hidden = d.subscribed;
        $("manage-panel").hidden = !d.manage;
        maybeAutoCheckout(d);
      }, function () { $("plan-detail").textContent = "Couldn't load your plan right now."; maybeAutoCheckout({ subscribed: false }); });
  }
  // A link like ?plan=yearly starts checkout once the person is signed in (unless they already have Pro, or they cancel).
  function maybeAutoCheckout(d) {
    if (!wantPlan || d.subscribed) { wantPlan = null; return; }
    var plan = wantPlan; wantPlan = null;
    try { var last = Number(sessionStorage.getItem("sb-autoco") || 0); if (Date.now() - last < 600000) return; sessionStorage.setItem("sb-autoco", String(Date.now())); } catch (e) { /* no storage: still fine */ }
    var u = new URL(location.href); u.searchParams.delete("plan"); history.replaceState(null, "", u.pathname + u.search);
    var box = $("acct-msg"); box.hidden = false; box.className = "msg";
    box.textContent = "Starting your " + plan + " checkout... ";
    var cancel = document.createElement("button"); cancel.type = "button"; cancel.className = "linklike"; cancel.textContent = "Cancel";
    cancel.addEventListener("click", function () { clearTimeout(state.autoTimer); msg(box, ""); });
    box.appendChild(cancel);
    state.autoTimer = setTimeout(function () { startCheckout(plan); }, 1500);
  }

  // ----- Forms -----
  function emailOk(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) && v.length <= 254; }
  function field(form, name) { return form.elements[name].value; }
  function busy(form, on) { var b = form.querySelector("button[type=submit]"); if (b) b.disabled = on; }
  function redirectBack() {
    var q = new URLSearchParams(); if (qs.get("plan") === "monthly" || qs.get("plan") === "yearly") q.set("plan", qs.get("plan")); if (fromApp) q.set("src", "app");
    return location.origin + location.pathname + (q.toString() ? "?" + q.toString() : "");
  }
  function toCode(mode, email, intro) {
    state.codeMode = mode; state.codeEmail = email; $("code-intro").textContent = intro; showForm("form-code"); $("form-code").elements.code.value = ""; $("form-code").elements.code.focus();
  }

  function wire() {
    $("tab-signin").addEventListener("click", function () { showForm("form-signin"); });
    $("tab-signup").addEventListener("click", function () { showForm("form-signup"); });
    $("tab-reset").addEventListener("click", function () { showForm("form-reset"); });
    $("code-back").addEventListener("click", function () { showForm("form-signin"); });
    $("btn-signout").addEventListener("click", function () { state.sb.auth.signOut().then(function () { state.session = null; show("v-auth"); showForm("form-signin"); }); });
    $("buy-monthly").addEventListener("click", function () { startCheckout("monthly"); });
    $("buy-yearly").addEventListener("click", function () { startCheckout("yearly"); });
    $("btn-manage").addEventListener("click", openPortal);

    $("form-signin").addEventListener("submit", function (ev) {
      ev.preventDefault(); var f = ev.target, email = field(f, "email").trim(), pw = field(f, "password");
      if (Date.now() < lockUntil) return;
      if (!emailOk(email) || !pw) return msg($("auth-msg"), "Enter your email and password.", "error");
      busy(f, true);
      state.sb.auth.signInWithPassword({ email: email, password: pw }).then(function (r) {
        busy(f, false);
        if (r.error) {
          if (/email not confirmed/i.test(r.error.message || "")) {
            state.sb.auth.resend({ type: "signup", email: email });
            return toCode("signup", email, "Please confirm your email first. We sent a 6-digit code to " + email + ".");
          }
          msg($("auth-msg"), words(r.error), "error");
          if (/invalid login/i.test(r.error.message || "")) noteFail();
          return;
        }
        f.reset();
      }, function (e) { busy(f, false); msg($("auth-msg"), words(e), "error"); });
    });

    $("form-signup").addEventListener("submit", function (ev) {
      ev.preventDefault(); var f = ev.target, email = field(f, "email").trim(), pw = field(f, "password");
      if (!emailOk(email)) return msg($("auth-msg"), "That email address doesn't look right.", "error");
      if (pw.length < 8) return msg($("auth-msg"), "Choose a password of at least 8 characters.", "error");
      busy(f, true);
      state.sb.auth.signUp({ email: email, password: pw, options: { emailRedirectTo: redirectBack() } }).then(function (r) {
        busy(f, false);
        if (r.error) return msg($("auth-msg"), words(r.error), "error");
        f.reset();
        if (r.data && r.data.session) return;   // email confirmation is switched off: already signed in
        // The message is the same whether or not the address was already registered (no account guessing).
        toCode("signup", email, "If that address can be used, we sent a 6-digit code to " + email + ". Type it here, or tap the button in the email.");
      }, function (e) { busy(f, false); msg($("auth-msg"), words(e), "error"); });
    });

    $("form-reset").addEventListener("submit", function (ev) {
      ev.preventDefault(); var f = ev.target, email = field(f, "email").trim();
      if (!emailOk(email)) return msg($("auth-msg"), "That email address doesn't look right.", "error");
      busy(f, true);
      state.sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname }).then(function (r) {
        busy(f, false);
        if (r.error && /rate|too many|security/i.test(r.error.message || "")) return msg($("auth-msg"), words(r.error), "error");
        f.reset();
        toCode("recovery", email, "If an account uses " + email + ", we sent a 6-digit code and a link. Type the code here, or tap the link in the email.");
      }, function (e) { busy(f, false); msg($("auth-msg"), words(e), "error"); });
    });

    $("form-code").addEventListener("submit", function (ev) {
      ev.preventDefault(); var f = ev.target, code = field(f, "code").replace(/\s+/g, "");
      if (!/^\d{6,8}$/.test(code)) return msg($("auth-msg"), "Type the 6-digit code from your email.", "error");
      busy(f, true);
      if (state.codeMode === "recovery") state.recovering = true;
      state.sb.auth.verifyOtp({ email: state.codeEmail, token: code, type: state.codeMode === "recovery" ? "recovery" : "signup" }).then(function (r) {
        busy(f, false);
        if (r.error) { state.recovering = false; return msg($("auth-msg"), words(r.error), "error"); }
        if (state.codeMode === "recovery") { showForm("form-newpass"); }
      }, function (e) { busy(f, false); state.recovering = false; msg($("auth-msg"), words(e), "error"); });
    });

    $("form-newpass").addEventListener("submit", function (ev) {
      ev.preventDefault(); var f = ev.target, pw = field(f, "password");
      if (pw.length < 8) return msg($("auth-msg"), "Choose a password of at least 8 characters.", "error");
      busy(f, true);
      state.sb.auth.updateUser({ password: pw }).then(function (r) {
        busy(f, false);
        if (r.error) return msg($("auth-msg"), words(r.error), "error");
        f.reset(); state.recovering = false;
        history.replaceState(null, "", location.pathname + location.search);
        renderAccount(); msg($("acct-msg"), "Your password is changed.", "ok");
      }, function (e) { busy(f, false); msg($("auth-msg"), words(e), "error"); });
    });
  }

  function init() {
    if (!configured()) { show("v-config"); return; }
    // Errors that come back in the link (an expired confirmation link, for example)
    var hashErr = new URLSearchParams(location.hash.replace(/^#/, "")).get("error_description");
    state.sb = window.supabase.createClient(String(cfg.SUPABASE_URL).replace(/\/+$/, ""), cfg.SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: "studyboard-site-auth" }
    });
    wire();
    var isRecoveryLink = /type=recovery/.test(location.hash);
    if (isRecoveryLink) state.recovering = true;
    state.sb.auth.onAuthStateChange(function (event, session) {
      state.session = session;
      if (event === "PASSWORD_RECOVERY") { state.recovering = true; show("v-auth"); showForm("form-newpass"); return; }
      if (event === "SIGNED_OUT") { show("v-auth"); showForm("form-signin"); return; }
      if (session && !state.recovering && (event === "SIGNED_IN" || event === "INITIAL_SESSION" || event === "USER_UPDATED")) {
        if (location.hash) history.replaceState(null, "", location.pathname + location.search);
        // calling the database from inside this callback can stall, so it waits one tick
        setTimeout(renderAccount, 0);
      }
    });
    state.sb.auth.getSession().then(function (r) {
      state.session = r.data && r.data.session;
      if (!state.session && !state.recovering) {
        show("v-auth"); showForm("form-signin");
        if (hashErr) msg($("auth-msg"), "That link didn't work or has expired. Sign in, or ask for a new one.", "error");
        if (wantPlan) { var b = $("plan-intent"); b.hidden = false; b.textContent = "Sign in or create a free account to start your Studyboard Pro " + wantPlan + " plan. Your 7-day free trial starts at checkout."; }
      }
    });
  }
  init();
})();
