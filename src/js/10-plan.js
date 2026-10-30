/* ===== module: 10-plan.js ===== */
/* Studyboard 1.11 */
var PLAN = null;
window.__sbPlanObj = () => PLAN;
(() => {
  const K_ENT = "studyboard:plan", K_TOK = "studyboard:enttok", K_HW = "studyboard:ent:hw", K_CFG = "studyboard:plancfg", K_DEV = "studyboard:deviceId", K_NAG = "studyboard:devnag";
  const MB = 1048576;

  /* ============================== OWNER SETTINGS (replace these before launch) ============================== */

  const ENT_PUBKEY = "oTFcMtlYPbLZ6D2g-dK798oh7NQrw7r1DusqzFmELtw";

  const SITE_URL = "https://studyboardapp.com/website";

  // Buying Pro on the website from inside a store app: only where the store allows it. The iPhone app sets
  // StudyboardNative.externalPurchase for United States App Store accounts (native-bridge.js section 6); everywhere else
  // the app uses in-app purchase.
  const EXTERNAL_PURCHASE_ALLOWED = () => { try { const N = window.StudyboardNative; return !!N && N.externalPurchase === true && !onAndroid(); } catch (e) { return false; } };


  /* Config: one place for limits and prices */
  const PLAN_CONFIG = {
    limits: {
      free: {devices: 2, fileMB: 25, dataMB: 25, groupMembers: 5, groupMsgDays: 60, cloudBackupDays: 0},
      pro: {devices: Infinity, fileMB: 10240, dataMB: 250, groupMembers: 100, groupMsgDays: null, cloudBackupDays: 30}
    },
    prices: {monthly: "$3.99", semester: "$12.99", yearly: "$29.99", trialDays: 7, checkoutTrialDays: 0},
    checkout_url_monthly: "", checkout_url_semester: "", checkout_url_yearly: "", manage_url: "", site_url: "",
    app_trial: false,
    item_purchases: false,
    features: {insights: false, ai_credits: false},
    paywall: false
  };
  const read = k => { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch (e) { return null; } };
  const write = (k, v) => { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  const K_ATTR = "studyboard:upgradeAttr";
  const reasonKey = r => String(r || "").replace(/["\u201c][^"\u201d]*["\u201d]/g, "\u2026").replace(/\d+(?:[.,]\d+)?/g, "#").replace(/\s+/g, " ").trim().slice(0, 120) || "(none)";
  function track(ev, reason){
    try {
      if (!paywall()) return;
      if (Array.isArray(window.__sbTrackSink)) window.__sbTrackSink.push([ev, reasonKey(reason)]);
      if (typeof sb === "undefined" || !sb || !sb.rpc) return;
      const q = sb.rpc("studyboard_upgrade_event", {p_event: ev, p_reason: reasonKey(reason)});
      if (q && q.then) q.then(() => {}, () => {});
    } catch (e) {}
  }
  const numOr = (v, d) => v === null ? null : typeof v === "number" && isFinite(v) ? v : d;
  const PINNED = {free: ["devices", "groupMembers", "groupMsgDays"], pro: ["devices", "groupMembers", "groupMsgDays"]};
  function mergeCfg(rows){
    const c = JSON.parse(JSON.stringify(PLAN_CONFIG, (k, v) => v === Infinity ? "Infinity" : v), (k, v) => v === "Infinity" ? Infinity : v);
    if (!rows || typeof rows !== "object") return c;
    if (rows.limits && typeof rows.limits === "object") ["free", "pro"].forEach(t => {
      const src = rows.limits[t]; if (!src || typeof src !== "object") return;
      Object.keys(c.limits[t]).forEach(k => { if (k in src && !PINNED[t].includes(k)) { const v = numOr(src[k], c.limits[t][k]); c.limits[t][k] = v === null && k !== "groupMsgDays" ? Infinity : v; } });
    });
    if (rows.prices && typeof rows.prices === "object") Object.assign(c.prices, rows.prices);
    ["checkout_url_monthly", "checkout_url_semester", "checkout_url_yearly", "manage_url", "site_url"].forEach(k => { if (typeof rows[k] === "string" && /^https:\/\//.test(rows[k])) c[k] = rows[k]; });
    ["app_trial", "item_purchases", "paywall"].forEach(k => { if (typeof rows[k] === "boolean") c[k] = rows[k]; });
    if (rows.features && typeof rows.features === "object") Object.keys(c.features).forEach(k => { if (typeof rows.features[k] === "boolean") c.features[k] = rows.features[k]; });
    return c;
  }

  /* ---------- State ---------- */
  const P = {
    cfgRows: (read(K_CFG) || {}).rows || null,
    row: read(K_ENT),
    rowLive: false,
    tok: null,
    pend: null,
    mode: "none",
    edBad: false, noFn: false,
    entDone: false,
    uid: null,
    stored: null,
    loading: false, tablesMissing: false, lastLoad: 0, awaiting: 0, wasPro: false,
    devices: null, devErr: "", devBlocked: false,
    lastKey: ""
  };
  let cfg = mergeCfg(P.cfgRows);
  try { const a = JSON.parse(localStorage.getItem("studioso-auth") || "null"); P.stored = a && a.user && typeof a.user.id === "string" ? a.user.id : (a && a.currentSession && a.currentSession.user && a.currentSession.user.id) || null; } catch (e) {}
  // The iPhone and desktop apps keep the sign-in in the keychain, not here, so it isn't readable this early: the account from
  // last time (remembered with the plan hint) stands in until the sign-in loads, so a Pro theme and companion from last time
  // show straight away instead of the default for a moment
  if (!P.stored && !(typeof sbLocalOnly === "function" && sbLocalOnly())) try { const h = JSON.parse(localStorage.getItem("studyboard:planHint") || "null"); if (h && typeof h.uid === "string" && h.uid) P.stored = h.uid; } catch (e) {}

  let hw = Number((() => { try { return localStorage.getItem(K_HW); } catch (e) { return 0; } })()) || 0;
  const base0 = Math.max(Date.now(), hw), perf0 = typeof performance !== "undefined" ? performance.now() : 0;
  const bump = ms => { if (ms > hw) { hw = ms; try { localStorage.setItem(K_HW, String(Math.floor(hw))); } catch (e) {} } };
  const now = () => Math.max(Date.now(), base0 + (typeof performance !== "undefined" ? performance.now() - perf0 : 0));
  const ts = v => { const t = v ? Date.parse(v) : NaN; return isNaN(t) ? 0 : t; };
  const clockBack = () => Date.now() < hw - 5 * 60000;
  setInterval(() => bump(now()), 60000);
  bump(now());

  const curUid = () => sbUser ? sbUser.id : P.stored;
  const ent = () => (P.row && P.row.ent && P.row.uid === curUid()) ? P.row.ent : null;
  function entActive(e){
    if (!e) return false;
    if (e.plan === "lifetime") return true;
    if (e.plan === "pro" && (!e.pro_until || ts(e.pro_until) > now())) return true;
    return ts(e.trial_until) > now();
  }
  const trialing = e => !!e && e.plan !== "lifetime" && !(e.plan === "pro" && (!e.pro_until || ts(e.pro_until) > now())) && ts(e.trial_until) > now();
  const PRO_TIERS = ["pro", "trial", "lifetime"];
  const SKEW_MS = 2 * 60000;
  const tokLive = t => !!t && PRO_TIERS.includes(t.tier) && t.uid === curUid() && now() < t.exp * 1000 + SKEW_MS;
  function paid(){
    const u = curUid(); if (!u) return false;
    if (P.mode === "signed" && tokLive(P.tok)) return true;
    if (P.mode === "unsigned-fallback" && P.rowLive && P.row && P.row.uid === u && entActive(P.row.ent)) return true;
    return !!P.pend && tokLive(P.pend);
  }
  const paywall = () => !!STORE.paywall;
  const settled = () => !paywall() || !curUid() || paid() || !!P.entDone || P.edBad;
  const K_HINT = "studyboard:planHint", boot0 = Date.now();
  let hintW = null;
  const hintPro = () => { try { const h = JSON.parse(localStorage.getItem(K_HINT) || "null"); return !!h && h.uid === curUid() && h.pro === true; } catch (e) { return false; } };
  function isPro(){
    if (!paywall()) return true;
    const p = paid();
    if (settled()) { const u = curUid(); if (u && hintW !== u + p) { hintW = u + p; try { localStorage.setItem(K_HINT, JSON.stringify({uid: u, pro: p})); } catch (e) {} } return p; }
    return p || (Date.now() - boot0 < 10000 && hintPro());
  }
  const freeTrialOnly = () => { const e = ent(); return !!e && e.plan === "free" && trialing(e); };
  const limitsPro = () => paid() && !freeTrialOnly();
  const fileCapMB = () => cfg.limits[limitsPro() ? "pro" : "free"].fileMB;
  const mode = () => !paywall() ? "off" : !paid() ? "free" : P.mode === "signed" ? "signed" : P.mode === "unsigned-fallback" ? "unsigned-fallback" : "signed";

  /* The signed entitlement token Contract with the server */
  const b64u = s => { s = String(s || "").replace(/-/g, "+").replace(/_/g, "/"); while (s.length % 4) s += "="; const bin = atob(s), a = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i); return a; };
  const keyBytes = () => { try { const b = b64u(ENT_PUBKEY); return b.length === 32 ? b : null; } catch (e) { return null; } };
  const hasKey = () => !!keyBytes();
  let keyP = null;
  const cryptoKey = () => keyP || (keyP = crypto.subtle.importKey("raw", keyBytes(), {name: "Ed25519"}, false, ["verify"]));
  async function verifyToken(t, uid){
    if (!t || typeof t !== "object") return "shape";
    const {tier, exp, uid: tu, iat, sig} = t;
    if (typeof tier !== "string" || !/^[a-z]{1,16}$/.test(tier) || typeof tu !== "string" || !tu || tu.includes("|") || typeof sig !== "string" || !Number.isInteger(exp) || !Number.isInteger(iat)) return "shape";
    if (!hasKey()) return "nokey";
    if (!(window.crypto && crypto.subtle)) return "unsupported";
    let key; try { key = await cryptoKey(); } catch (e) { keyP = null; return "unsupported"; }
    let ok = false;
    try { ok = await crypto.subtle.verify("Ed25519", key, b64u(sig), new TextEncoder().encode(`studyboard-ent-v1|${tu}|${tier}|${exp}|${iat}`)); } catch (e) { ok = false; }
    if (!ok) return "forged";
    if (uid && tu !== uid) return "uid";
    if (exp - iat > 8 * 86400) return "toolong";
    bump(iat * 1000);
    if (now() > exp * 1000 + SKEW_MS) return "expired";
    return "ok";
  }
  async function loadCachedToken(){
    const c = read(K_TOK); if (!c || !c.tok) return;
    if (!hasKey() || !(window.crypto && crypto.subtle)) { write(K_TOK, null); return; }
    const uid = curUid();
    if (uid && c.tok.uid === uid && tokLive(c.tok)) P.pend = c.tok;
    const r = await verifyToken(c.tok, null);
    P.pend = null;
    if (r === "unsupported") { P.edBad = true; changed(); return; }
    if (r === "ok") { P.tok = c.tok; P.mode = "signed"; }
    else { P.tok = null; write(K_TOK, null); }
    changed();
  }

  /* Features */
  function can(feature){
    switch (feature) {
      case "insights": return !!cfg.features.insights && isPro();
      case "ai-credits": return !!cfg.features.ai_credits && isPro();
      case "sync-unlimited-devices": case "cloud-backups": case "big-groups": case "full-group-history": case "big-storage": return !paywall() || limitsPro();
      default: return isPro();
    }
  }

  /* Usage (estimated from this device's copy) */
  function usage(){
    let dataB = 0, fileB = 0;
    try { dataB = new Blob([JSON.stringify(toArrays())]).size; } catch (e) {}
    try { const seen = new Set(); Object.values(state.files || {}).forEach(f => (f && f.revs || []).forEach(r => { if (r && r.assetId && !/^local:/.test(r.assetId) && !seen.has(r.assetId)) { seen.add(r.assetId); fileB += Number(r.size) || 0; } })); } catch (e) {}
    return {dataMB: dataB / MB, fileMB: fileB / MB, dataBytes: dataB, fileBytes: fileB};
  }
  const lim = () => cfg.limits[!paywall() || limitsPro() ? "pro" : "free"];
  function styleGrace(){
    if (P.sessionPro !== true || P.graceOff || !paywall()) return false;
    return !isPro();
  }
  function endStyleGrace(){ const was = styleGrace(); P.graceOff = true; return was; }
  const fmtMB = mb => mb === Infinity ? "Unlimited" : mb >= 1024 ? `${+(mb / 1024).toFixed(mb % 1024 ? 1 : 0)} GB` : mb >= 10 || mb === 0 ? `${Math.round(mb)} MB` : `${mb.toFixed(1)} MB`;

  /* Loading from Supabase (tolerates missing tables) */
  const missing = err => { const m = String(err && (err.message || err.code) || ""); return err && (err.code === "42P01" || err.code === "PGRST205" || err.code === "PGRST202" || /does not exist|Could not find the (table|function)|schema cache/i.test(m)); };
  let lastFire = "";
  function changed(){
    const pro = isPro();
    const key = JSON.stringify([paywall(), pro, mode(), ent(), cfg.limits, cfg.prices, P.edBad, settled()]);
    if (pro && !P.wasPro && P.awaiting && paywall()) {
      P.awaiting = 0;
      setTimeout(() => { try { toast("Pro is on. Thank you for supporting Studyboard!"); if (dlg.open && dlg.querySelector(".plan-sheet")) proSheet(P.reason); } catch (e) {} }, 50);
    }
    P.wasPro = pro;
    const at = read(K_ATTR), e0 = ent();
    if (at && paywall() && paid() && at.uid === curUid() && !(e0 && (trialing(e0) || e0.source === "code" || e0.source === "promo"))) {
      write(K_ATTR, null);
      if (Date.now() - (at.t || 0) < 14 * 864e5) track("purchased", at.r);
    }
    if (key === lastFire) return;
    lastFire = key;
    try { applySkin(); } catch (e) {}
    fire("plan-changed", PLAN);
    scheduleRender();
  }
  async function loadConfig(){
    if (!sb) return;
    try {
      const {data, error} = await sb.from("studyboard_config").select("key,value");
      if (error) { if (missing(error)) { P.tablesMissing = true; P.cfgRows = null; cfg = mergeCfg(null); write(K_CFG, null); } return; }
      const rows = {}; (data || []).forEach(r => { rows[r.key] = r.value; });
      P.cfgRows = rows; cfg = mergeCfg(rows); write(K_CFG, {rows, at: Date.now()});
      STORE.serverPaywall(rows.paywall === true);
    } catch (e) { }
  }
  async function loadRow(){
    if (!sb || !sbUser) return null;
    const uid = sbUser.id;
    try {
      let res = await sb.from("studyboard_entitlements").select("plan,pro_until,trial_until,source,will_renew,grant_until,grant_lifetime,promo_until,promo_lifetime").eq("user_id", uid).maybeSingle();
      if (res.error && /promo_|column/i.test(String(res.error.message || ""))) res = await sb.from("studyboard_entitlements").select("plan,pro_until,trial_until,source,will_renew,grant_until,grant_lifetime").eq("user_id", uid).maybeSingle();
      if (res.error && /grant_(until|lifetime)|column/i.test(String(res.error.message || ""))) res = await sb.from("studyboard_entitlements").select("plan,pro_until,trial_until,source,will_renew").eq("user_id", uid).maybeSingle();
      let {data, error} = res;
      if (data) {
        const e = Object.assign({}, data);
        if (e.grant_lifetime) { e.plan = "lifetime"; e.source = "lifetime"; }
        else if (e.grant_until && ts(e.grant_until) > now() && !entActive(e)) { e.plan = "pro"; e.pro_until = e.grant_until; e.source = "promo"; }
        const paidNow = e.plan === "lifetime" || (e.plan === "pro" && (!e.pro_until || ts(e.pro_until) > now()));
        const promoEnd = e.promo_lifetime ? "9999-12-31T00:00:00Z" : e.promo_until && ts(e.promo_until) > now() ? e.promo_until : "";
        if (!paidNow && promoEnd && !(ts(e.trial_until) > ts(promoEnd))) { e.trial_until = promoEnd; e.source = "code"; e.codeForever = !!e.promo_lifetime; }
        data = e;
      }
      if (error) { if (missing(error)) { P.tablesMissing = true; P.row = {uid, ent: null, at: Date.now()}; P.rowLive = true; write(K_ENT, P.row); } return false; }
      P.row = {uid, ent: data || null, at: Date.now()}; P.rowLive = true; write(K_ENT, P.row);
      return true;
    } catch (e) { return false; }
  }
  async function loadToken(){
    if (!sb || !sbUser) return false;
    if (!hasKey() || P.edBad) return false;
    const uid = sbUser.id;
    let res;
    try { res = await sb.functions.invoke("entitlement-token", {body: {}}); }
    catch (e) { return P.mode === "signed"; }
    const {data, error} = res || {};
    if (error) {
      const st = error.context && error.context.status;
      if (st === 404 || /not found|FunctionsFetchError.*404/i.test(String(error.message || ""))) { P.noFn = true; return false; }
      return P.mode === "signed";
    }
    const r = await verifyToken(data, uid);
    if (r === "ok") { P.tok = data; P.mode = "signed"; P.noFn = false; write(K_TOK, {tok: data, at: Date.now()}); return true; }
    if (r === "unsupported") { P.edBad = true; return false; }
    P.tok = null; write(K_TOK, null); P.mode = "signed";
    return true;
  }
  async function loadEntitlement(){
    if (!sb || !sbUser) return;
    const signed = await loadToken();
    await loadRow();
    if (!signed) { P.mode = "unsigned-fallback"; P.tok = null; }
  }
  const K_LIMITS = "studyboard:limitNotes";
  function limitNote(key, msg, opts){
    const o = opts || {};
    if (!paywall() || limitsPro()) return false;
    const uid = curUid() || "guest", seen = read(K_LIMITS) || {}, mine = seen[uid] || {};
    if (mine[key]) return false;
    mine[key] = Date.now(); seen[uid] = mine; write(K_LIMITS, seen);
    track("note", o.reason || msg);
    toast(msg, null, {label: o.label || "See Pro", fn: o.fn || (() => proSheet(o.reason || ""))});
    return true;
  }
  function redeemSheet(){
    if (!sbUser) { toast("Sign in first, then redeem your code."); if (typeof sbAsk === "function") sbAsk(); return; }
    openSheet(`<form class="sheet" id="promoForm">${head("Redeem a Code")}<div class="sheet-body">
      <p style="margin:0">Got a Studyboard code? Type it here and Pro's themes and features turn on for your account.</p>
      <label class="f">Code<input type="text" id="promoCode" maxlength="60" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="SB-XXXX-XXXX-XXXX" required></label>
      <p class="mini" id="promoMsg" aria-live="polite" style="margin:0">Storage, devices and group size stay at the free amounts.</p>
    </div><div class="sheet-foot"><button type="button" class="btn" data-act="close">Cancel</button><span class="spacer"></span><button type="submit" class="btn primary" id="promoGo">Redeem</button></div></form>`);
    const f = $("#promoForm"), inp = $("#promoCode"), msg = $("#promoMsg"), go = $("#promoGo");
    setTimeout(() => inp.focus(), 50);
    f.addEventListener("submit", async e => {
      e.preventDefault();
      const code = inp.value.trim(); if (!code) return;
      go.disabled = true; msg.textContent = "Checking…";
      let r = null;
      try { const {data, error} = await sb.rpc("studyboard_redeem_code", {p_code: code}); r = error ? {error: /could not find|does not exist/i.test(error.message || "") ? "missing" : "network"} : data; } catch (err) { r = {error: "network"}; }
      go.disabled = false;
      const ERR = {invalid: "That code doesn't work. Check it and try again.", expired: "That code has expired.", used_up: "That code has already been used.", already: "You've already used this code.", own_code: "That's one of your own friend codes. Send it to a friend instead!",
        slow_down: "Too many tries. Wait a while, then try again.", sign_in: "Sign in first, then redeem your code.", missing: "Codes aren't set up on this Studyboard server yet.", network: "Couldn't check the code. Check your connection and try again."};
      if (!r || !r.ok) { msg.textContent = ERR[r && r.error] || ERR.invalid; inp.select(); return; }
      dlg.close();
      try { await refreshNow(true); } catch (err) {}
      toast(r.kind === "forever" ? "Pro is on for good. Enjoy!" : `Pro is on until ${dateStr(r.until)}. Enjoy!`);
      setTimeout(() => proSheet(), 400);
    });
  }
  async function refresh(){
    if (P.loading || inPreview()) return;
    P.loading = true;
    try { await loadConfig(); if (paywall() && sbUser) { await loadEntitlement(); P.entDone = true; } } finally { P.loading = false; P.lastLoad = Date.now(); }
    if (P.sessionPro == null && paywall() && sbUser && P.entDone) P.sessionPro = paid();
    changed();
    welcomeNotes();
  }
  const K_WELCOME = "studyboard:welcomeWeek";
  let welcomeRetry = 0;
  function welcomeWeek(){ const e = ent(); return e && e.source === "welcome" && e.trial_until && paywall() && ts(e.trial_until) > now() ? {until: e.trial_until, date: dateStr(e.trial_until)} : null; }
  function welcomeSaid(){ const uid = curUid(); if (!uid) return; const seen = read(K_WELCOME) || {}, mine = seen[uid] || {}; if (!mine.start) { mine.start = Date.now(); seen[uid] = mine; write(K_WELCOME, seen); } }
  function welcomePop(until){
    if (typeof qodPop !== "function") return;
    qodPop(`<div class="qod-eyebrow">A Welcome Gift</div><h2 id="qodT">Welcome to Studyboard!</h2>
      <p class="qod-q" style="font-size:1.05rem">Your first week of Pro is on us.</p>
      <p class="mini">Every Pro theme and feature is yours until ${esc(dateStr(until))}. No card needed, and nothing you make goes away when the week ends.</p>
      <div class="qod-foot"><button type="button" class="btn" data-qod-close data-act="plan-open">See What's Included</button><button type="button" class="btn primary" data-qod-close>Let's Go</button></div>`, "reward");
  }
  function welcomeNotes(){
    const e = ent(), uid = curUid();
    if (!e || !uid || e.source !== "welcome" || !e.trial_until || !paywall()) return;
    const seen = read(K_WELCOME) || {}, mine = seen[uid] || {};
    const save = k => { mine[k] = Date.now(); seen[uid] = mine; write(K_WELCOME, seen); };
    const endAt = ts(e.trial_until);
    if (endAt > now() && endAt - now() <= 864e5 && !mine.lastDay) {
      save("lastDay"); if (!mine.start) save("start");
      setTimeout(() => toast(`Your free week of Pro ends tomorrow. Everything you made stays, and the planner stays free. Pro themes go back to a plain theme.`, null, {label: "See Plans", fn: () => proSheet("Your free week of Pro ends tomorrow. Keep Pro with any plan below, or carry on with Free.")}), 1500);
    } else if (endAt > now() && !mine.start) {
      if (window.SBOB && SBOB.pending()) { clearTimeout(welcomeRetry); welcomeRetry = setTimeout(welcomeNotes, 4000); return; }
      save("start");
      setTimeout(() => { if (window.SBOB && SBOB.pending()) { delete mine.start; seen[uid] = mine; write(K_WELCOME, seen); return; } welcomePop(e.trial_until); }, 1200);
    } else if (endAt <= now() && now() - endAt < 30 * 864e5 && !paid() && !mine.end) {
      save("end");
      setTimeout(() => toast("Your free week of Pro has ended. Everything you made is still here, and the planner stays free.", null, {label: "See Plans", fn: () => proSheet("Your free week of Pro has ended. Keep Pro with any plan below, or carry on with Free.")}), 1200);
    }
  }
  // The sign-in finished loading and nobody is signed in: forget the account from last time, and that it had Pro, at once
  hook("auth-none", () => {
    if (sbUser) return;
    P.stored = null;
    try { localStorage.setItem(K_HINT, JSON.stringify({uid: "", pro: false})); } catch (e) {}
    changed();
  });
  function watchUser(){
    const id = sbUser ? sbUser.id : null;
    if (id === P.uid) return;
    const was = P.uid; P.uid = id;
    if (id) {
      P.stored = id;
      if (P.row && P.row.uid && P.row.uid !== id) { P.row = null; write(K_ENT, null); }
      if (P.tok && P.tok.uid !== id) { P.tok = null; write(K_TOK, null); }
      P.rowLive = false; P.entDone = false; P.devices = null;
      refresh().then(registerDevice);
    } else if (was && sb) { P.row = null; P.tok = null; P.pend = null; P.stored = null; P.rowLive = false; write(K_ENT, null); write(K_TOK, null); P.devices = null; changed(); }
  }

  /* Devices */
  function deviceId(){
    let id = null; try { id = localStorage.getItem(K_DEV); } catch (e) {}
    if (!id) { id = (crypto.randomUUID ? crypto.randomUUID() : uid() + uid()); try { localStorage.setItem(K_DEV, id); } catch (e) {} }
    return id;
  }
  function deviceInfo(){
    const ua = navigator.userAgent || "", mob = /iPhone|iPad|Android|Mobile/i.test(ua);
    const os = /iPhone/.test(ua) ? "iPhone" : /iPad/.test(ua) ? "iPad" : /Android/.test(ua) ? "Android" : /Mac/.test(ua) ? "Mac" : /Windows/.test(ua) ? "Windows" : /CrOS/.test(ua) ? "Chromebook" : /Linux/.test(ua) ? "Linux" : "Device";
    const standalone = !!(window.matchMedia && matchMedia("(display-mode: standalone)").matches) || navigator.standalone === true;
    const platform = DESK ? "desktop" : standalone ? "app" : "web";
    const br = /Edg\//.test(ua) ? "Edge" : /Firefox\//.test(ua) ? "Firefox" : /Chrome\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : "Browser";
    const name = DESK ? `${os} Desktop App` : standalone ? `${os} App` : mob ? `${os} (${br})` : `${os} (${br})`;
    return {name: name.slice(0, 60), platform};
  }
  async function loadDevices(){
    if (!sb || !sbUser) { P.devices = null; return null; }
    const {data, error} = await sb.from("studyboard_devices").select("device_id,name,platform,last_seen").eq("user_id", sbUser.id).order("last_seen", {ascending: false});
    if (error) { if (missing(error)) { P.tablesMissing = true; P.devices = null; return null; } throw error; }
    P.devices = data || []; return P.devices;
  }
  async function registerDevice(){
    if (!sb || !sbUser || inPreview()) return;
    const info = deviceInfo();
    try {
      const {error} = await sb.from("studyboard_devices").upsert({user_id: sbUser.id, device_id: deviceId(), name: info.name, platform: info.platform, last_seen: new Date().toISOString()}, {onConflict: "user_id,device_id"});
      P.devBlocked = !!(error && /SB_DEVICE_LIMIT|device limit/i.test(String(error.message || "")));
      if (error && missing(error)) { P.tablesMissing = true; return; }
      await loadDevices();
    } catch (e) { return; }
    for (let i = 0; i < 40 && !settled(); i++) await new Promise(r => setTimeout(r, 500));
    if (!settled() || !paywall() || isPro()) return;
    const over = (P.devices || []).length > lim().devices;
    if (P.devBlocked || over) {
      setTimeout(() => { if (paywall() && !isPro()) limitNote("devices", `This is one device more than the free plan syncs on (${lim().devices}). Remove one you don't use in Your Devices, or Pro syncs on all of them.`, {label: "Your Devices", fn: () => devicesSheet(true)}); }, 900);
    }
  }
  async function removeDevice(id){
    if (!sb || !sbUser) return;
    const {error} = await sb.from("studyboard_devices").delete().eq("user_id", sbUser.id).eq("device_id", id);
    if (error) { toast("Couldn't remove that device. Check your connection and try again."); return; }
    toast("Device removed");
    if (P.devBlocked) await registerDevice(); else await loadDevices().catch(() => {});
  }

  /* Buying: ONE function, PLAN.buy(period), picks the route by platform web and desktop */
  const nativeStore = () => {
    try {
      const C = window.Capacitor;
      return !!((C && (typeof C.isNativePlatform === "function" ? C.isNativePlatform() : true)) || window.studyboardNative || window.StudyboardNative
        || (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.studyboardStore) || (DESK && (DESK.mas || DESK.store === "mas")));
    } catch (e) { return false; }
  };
  const route = () => nativeStore() && !EXTERNAL_PURCHASE_ALLOWED() ? "store" : "web";
  // in-app purchase can still be restored in the app wherever it's set up (someone who bought through Apple and then moved
  // their Apple account to the United States keeps it)
  const nativeRestore = () => { try { const N = window.StudyboardNative; return nativeStore() && !!N && N.purchasesAvailable === true; } catch (e) { return false; } };
  // the App Store country became known or changed: the Pro sheet shows the right way to buy
  window.addEventListener("studyboard:storefront", () => { try { if (dlg.open && dlg.querySelector(".plan-sheet")) proSheet(P.reason); } catch (e) {} });
  const nativeBuyOff = () => { try { const N = window.StudyboardNative; return route() === "store" && !!N && N.purchasesAvailable === false; } catch (e) { return false; } };
  const onAndroid = () => { try { const N = window.StudyboardNative, C = window.Capacitor; return (N && N.platform === "android") || (C && typeof C.getPlatform === "function" && C.getPlatform() === "android"); } catch (e) { return false; } };
  const siteBase = () => {
    try { const u = new URL(cfg.site_url || SITE_URL); return u.protocol === "https:" ? u.origin + u.pathname.replace(/\/+$/, "") : ""; } catch (e) { return ""; }
  };
  const siteReady = () => { const b = siteBase(); try { return !!b && !/\.example$/.test(new URL(b).hostname); } catch (e) { return false; } };
  const siteUrl = (path, q) => { const u = new URL(siteBase() + path); Object.keys(q || {}).forEach(k => u.searchParams.set(k, q[k])); u.searchParams.set("src", "app"); return u.toString(); };
  const siteLinkOk = () => siteReady() && !DESK && !nativeStore() && !(typeof inPreview === "function" && inPreview());
  const siteLinks = () => document.querySelectorAll("a[data-site-link]").forEach(a => { if (siteLinkOk()) { a.href = siteBase() + "/"; a.setAttribute("aria-label", "Studyboard website"); } else { a.removeAttribute("href"); a.removeAttribute("title"); } });
  document.addEventListener("click", e => { const a = e.target.closest && e.target.closest("a[data-site-link]"); if (!a) return; e.preventDefault(); if (window.matchMedia && matchMedia("(max-width:639px)").matches) return; if (siteLinkOk()) openExternal(siteUrl("/", {})); });
  siteLinks(); window.addEventListener("load", siteLinks); setTimeout(siteLinks, 4000);
  function openExternal(url){
    try { const B = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Browser; if (B && B.open) { B.open({url}); return; } } catch (e) {}
    window.open(url, "_blank", "noopener");
  }
  const WATCH_MS = 2 * 60000, AWAIT_MS = 30 * 60000;
  let pollUntil = 0, pollT = 0;
  function watchPurchase(){
    P.awaiting = Date.now() + AWAIT_MS;
    pollUntil = Date.now() + WATCH_MS;
    clearTimeout(pollT);
    const tick = () => { if (Date.now() > pollUntil || (paid() && paywall())) return; if (sbUser && navigator.onLine !== false) refresh(); pollT = setTimeout(tick, 10000); };
    pollT = setTimeout(tick, 6000);
  }
  /* Native bridge */
  const NATIVE_DETAIL = {"plan-checkout": (period, userId) => ({period, userId}), "plan-restore": userId => ({userId}), "plan-manage": entitlement => ({entitlement})};
  function nativeFire(name, ...a){
    let handled = fire(name, ...a).some(Boolean);
    try {
      const ev = new CustomEvent("studyboard:" + name, {cancelable: true, detail: NATIVE_DETAIL[name] ? NATIVE_DETAIL[name](...a) : {}});
      window.dispatchEvent(ev);
      if (ev.defaultPrevented) handled = true;
    } catch (e) {}
    return handled;
  }
  let waiter = null;
  function waitResult(action, ms){
    return new Promise(res => {
      if (waiter) { clearTimeout(waiter.t); waiter.res({status: "superseded"}); }
      const w = {action, res, t: setTimeout(() => { if (waiter === w) waiter = null; res({status: "timeout"}); }, ms)};
      waiter = w;
    });
  }
  const cleanMsg = m => typeof m === "string" ? m.replace(/[\u0000-\u001f<>]/g, " ").trim().slice(0, 200) : "";
  window.addEventListener("studyboard:purchase-result", e => {
    const d = (e && e.detail) || {}, action = ["checkout", "restore", "manage"].includes(d.action) ? d.action : "";
    const status = ["success", "cancelled", "nothing", "error"].includes(d.status) ? d.status : "error", message = cleanMsg(d.message);
    if (waiter && (!action || action === waiter.action)) { const w = waiter; waiter = null; clearTimeout(w.t); w.res({status, message}); return; }
    if (status === "success" && sbUser) refresh();
  });
  async function refreshUntilPaid(tries){
    for (let i = 0; i < tries; i++) {
      for (let j = 0; j < 20 && P.loading; j++) await new Promise(r => setTimeout(r, 150));
      await refresh();
      if (paid()) return true;
      await new Promise(r => setTimeout(r, 2000));
    }
    return paid();
  }
  async function afterNativeCheckout(){
    const r = await waitResult("checkout", 10 * 60000);
    if (r.status === "success") {
      toast("Thank you! Turning on Pro…");
      const ok = await refreshUntilPaid(5);
      toast(ok ? "Pro is on. Thank you for supporting Studyboard!" : "Your purchase went through. Pro can take a minute to appear: use Restore Purchases if it doesn't.");
      if (ok) P.awaiting = 0;
      if (dlg.open && dlg.querySelector(".plan-sheet")) proSheet(P.reason);
    } else if (r.status === "cancelled") toast("Purchase canceled. You weren't charged.");
    else if (r.status === "error") toast(r.message || "The purchase didn't go through. You weren't charged. Please try again.");
  }
  async function directCheckout(period){
    if (!sb || !sbUser || sbUser.is_anonymous) return null;
    try {
      const {data, error} = await sb.functions.invoke("create-checkout", {body: {plan: period, src: "app"}});
      if (!error && data && typeof data.url === "string" && /^https:\/\/checkout\.stripe\.com\//.test(data.url)) return {url: data.url};
      let body = null; try { body = error && error.context && typeof error.context.json === "function" ? await error.context.json() : null; } catch (e) {}
      const code = body && body.error, m = body && typeof body.message === "string" ? cleanMsg(body.message) : "";
      if (["already_subscribed", "confirm_email", "rate_limited", "plan_unavailable"].includes(code)) return {message: m || "Checkout isn't available right now."};
      return null;
    } catch (e) { return null; }
  }
  function buy(period){
    period = ["monthly", "semester", "yearly"].includes(period) ? period : "monthly";
    if (!paid()) { track("buy", P.reason); write(K_ATTR, {r: P.reason || "", t: Date.now(), uid: curUid()}); }
    if (period === "semester" && route() === "store") period = "monthly";
    const userId = sbUser ? sbUser.id : null;
    if (route() === "store") {
      if (nativeBuyOff()) { toast("Buying Pro in the app isn't available in this build yet."); return false; }
      if (!userId) { toast("Sign in first so Pro is linked to your account."); if (window.SBGUEST) SBGUEST.signUp(); else if (sb && typeof sbSignInSheet === "function") sbSignInSheet(); return false; }
      if (nativeFire("plan-checkout", period, userId)) { watchPurchase(); afterNativeCheckout(); return true; }
      toast("Buying Pro in the app isn't available in this build yet.");
      return false;
    }
    if (sb && sbUser && !sbUser.is_anonymous && !P.buying) {
      P.buying = true; toast("Opening checkout…");
      directCheckout(period).then(r => {
        if (r && r.url) { openExternal(r.url); toast("Finish in the checkout page that just opened. Pro turns on here by itself."); watchPurchase(); return; }
        if (r && r.message) { toast(r.message); return; }
        if (siteReady()) { openExternal(siteUrl("/account", {plan: period})); toast("Finish in the page that just opened, then come back here. Pro turns on by itself."); watchPurchase(); return; }
        toast("Couldn't open checkout. Check your connection and try again.");
      }).finally(() => { P.buying = false; });
      return true;
    }
    if (siteReady()) {
      openExternal(siteUrl("/account", {plan: period}));
      toast("Finish in the page that just opened, then come back here. Pro turns on by itself.");
      watchPurchase();
      return true;
    }
    const url = cfg["checkout_url_" + period];
    if (url) {
      if (!userId) { toast("Sign in first so Pro is linked to your account."); if (sb && typeof sbSignInSheet === "function") sbSignInSheet(); return false; }
      const u = new URL(url);
      u.searchParams.set("client_reference_id", userId);
      if (sbUser.email) u.searchParams.set("prefilled_email", sbUser.email);
      openExternal(u.toString());
      toast("Finish in the page that just opened. Pro turns on here by itself.");
      watchPurchase();
      return true;
    }
    toast("Pro isn't available yet");
    return false;
  }
  async function refreshNow(quiet, restoring){
    if (!sbUser) { if (!quiet) { toast("Sign in to the account you bought Pro with, then try again."); if (sb && typeof sbSignInSheet === "function") sbSignInSheet(); } return false; }
    if (!quiet) toast(restoring ? "Restoring your purchases…" : "Checking your plan…");
    for (let i = 0; i < 20 && P.loading; i++) await new Promise(r => setTimeout(r, 150));
    await refresh();
    const ok = paid();
    if (!quiet) toast(ok ? (restoring ? "Purchases restored. Pro is on." : "Pro is on. Thank you for supporting Studyboard!") : restoring ? "Nothing to restore. We couldn't find a Pro purchase for this account. If you bought Pro with a different Apple ID or Studyboard account, sign in with that one." : "We couldn't find Pro on this account yet. If you just bought it, wait a minute and try again.");
    if (ok) P.awaiting = 0;
    if (dlg.open && dlg.querySelector(".plan-sheet")) proSheet(P.reason);
    return ok;
  }
  const restoreBtns = on => document.querySelectorAll('[data-act="plan-restore"]').forEach(b => {
    b.disabled = on; b.setAttribute("aria-busy", String(on));
    const sub = b.querySelector(".sub"); if (sub && sub.dataset.idle === undefined) sub.dataset.idle = sub.textContent;
    if (sub) sub.textContent = on ? "Restoring…" : sub.dataset.idle;
    else { if (b.dataset.idle === undefined) b.dataset.idle = b.textContent; b.textContent = on ? "Restoring…" : b.dataset.idle; }
  });
  async function restore(){
    if (P.restoring) return false;
    if (!sbUser) { toast("Sign in to the account you bought Pro with, then restore."); if (sb && typeof sbSignInSheet === "function") sbSignInSheet(); return false; }
    P.restoring = true; restoreBtns(true);
    try {
      if (route() === "store" || nativeRestore()) {
        const wait = waitResult("restore", 60000);
        if (!nativeFire("plan-restore", sbUser.id)) { if (waiter) { clearTimeout(waiter.t); waiter = null; } toast("Restoring purchases isn't available in this build yet."); return false; }
        toast("Restoring your purchases…");
        const r = await wait;
        if (r.status === "error" && route() === "store") { toast(r.message || "Couldn't restore purchases. Check your connection and try again."); return false; }
        if (r.status === "cancelled") { toast("Restore canceled."); return false; }
        if (r.status === "success") {
          const ok = await refreshUntilPaid(5);
          toast(ok ? "Purchases restored. Pro is on." : "Your purchase was found, but Pro can take a minute to appear. Try again shortly.");
          if (ok) P.awaiting = 0;
          if (dlg.open && dlg.querySelector(".plan-sheet")) proSheet(P.reason);
          return ok;
        }
      }
      return await refreshNow(false, true);
    } finally { P.restoring = false; restoreBtns(false); }
  }
  function manage(){
    const e = ent() || {};
    if (route() === "store" || e.source === "apple" || e.source === "google") {
      if (nativeFire("plan-manage", ent())) return;
      if (route() === "store" && e.source === "stripe") { toast("This plan was bought on the Studyboard website. Manage it there, where you subscribed."); return; }
      if (e.source === "apple" || (route() === "store" && /iPhone|iPad|Mac/.test(navigator.userAgent || ""))) { openExternal("https://apps.apple.com/account/subscriptions"); return; }
      if (e.source === "google" || route() === "store") { openExternal("https://play.google.com/store/account/subscriptions"); return; }
    }
    if (siteReady()) { openExternal(siteUrl("/account", {})); return; }
    if (cfg.manage_url) { openExternal(cfg.manage_url); return; }
    toast("To change or cancel your plan, use the link in your receipt email.");
  }
  async function startTrial(){
    if (!sbUser) { toast("Sign in first to start your free trial."); return; }
    try {
      const {error} = await sb.rpc("studyboard_start_trial");
      if (error) { toast(String(error.message || "").replace(/^SB_\w+:\s*/, "").slice(0, 140) || "Couldn't start the trial. Try again."); return; }
      await refresh(); toast("Your free week of Pro has started. Enjoy!"); proSheet();
    } catch (e) { toast("Couldn't start the trial. Check your connection and try again."); }
  }

  /* The Studyboard Pro sheet */
  const IC = {
    spark: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l1.9 5.6 5.6 1.9-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.9z" fill="currentColor"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z" fill="currentColor" opacity=".7"/></svg>',
    check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    info: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 11v5.5M12 7.6v.2" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>',
    device: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="14" height="10" rx="1.6" fill="none" stroke="currentColor" stroke-width="2"/><path d="M7 18h6M10 14v4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><rect x="16" y="9" width="5.5" height="11" rx="1.3" fill="var(--surface)" stroke="currentColor" stroke-width="2"/></svg>'
  };
  const dateStr = v => { const t = ts(v); return t ? new Date(t).toLocaleDateString(undefined, {month: "short", day: "numeric", year: "numeric"}) : ""; };
  const price = s => { const n = parseFloat(String(s || "").replace(/[^\d.]/g, "")); return isFinite(n) ? n : null; };
  const lims = t => cfg.limits[t];
  const num = (v, unit) => v === Infinity || v == null ? "Unlimited" : `${v}${unit || ""}`;
  function compareRows(){
    const f = lims("free"), p = lims("pro");
    const freeThemes = SKINS.filter(s => s.tier === "free").length;
    return [
      ["Devices", `${f.devices} Devices`, p.devices === Infinity ? "Unlimited Devices" : `${p.devices} Devices`],
      ["Cloud File Storage", fmtMB(f.fileMB), fmtMB(p.fileMB)],
      ["Synced Data", fmtMB(f.dataMB), fmtMB(p.dataMB)],
      ["Themes", `${freeThemes} Plain Colors`, `All ${SKINS.length} Themes`],
      ["Card Styles, Pins and Stickers", "The Free Set", "Every Style"],
      ["Online Backups", f.cloudBackupDays ? `${f.cloudBackupDays} Days` : "On Your Device", `${p.cloudBackupDays} Days Online`],
      ["Study Group Members", `Up to ${f.groupMembers} Members`, p.groupMembers === Infinity ? "Unlimited Members" : `Up to ${p.groupMembers} Members`],
      ["Group Message History", f.groupMsgDays ? `Kept ${f.groupMsgDays} Days` : "Unlimited History", p.groupMsgDays ? `Kept ${p.groupMsgDays} Days` : "Unlimited History"]
    ].concat(window.SBPRO ? SBPRO.compareRows() : []);
  }
  function meter(label, used, max){
    const pct = max === Infinity || !max ? Math.min(100, used > 0 ? 2 : 0) : Math.min(100, used / max * 100);
    const hot = max !== Infinity && used / max >= 0.9;
    return `<div class="plan-meter${hot ? " hot" : ""}"><div class="pm-top"><span>${esc(label)}</span><span class="mini">${esc(fmtMB(used))} of ${esc(fmtMB(max))}</span></div><div class="pm-bar" role="progressbar" aria-label="${esc(label)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(pct)}"><i style="width:${pct.toFixed(1)}%"></i></div></div>`;
  }
  function statusLine(){
    const e = ent();
    if (!paywall()) return {title: "Everything Is Unlocked Right Now", sub: "Studyboard is in early access, so every theme and feature is yours to use. Pro will add the extras below later."};
    if (!paid()) return {title: "You're on the Free Plan", sub: "The whole planner is free, forever. Pro adds room to grow and every style in the shop."};
    const THANKS = "You're on Pro. Thank you for supporting Studyboard!";
    if (!e) return {title: THANKS, sub: ""};
    if (e.plan === "lifetime") return {title: THANKS, sub: e.source === "lifetime" ? "Pro was granted to your account for good." : "Pro is yours for good."};
    if (trialing(e) && e.source === "welcome") return {title: "Your Free Week of Pro", sub: `Every Pro theme and feature until ${dateStr(e.trial_until)}. Storage, devices and group size stay at the free amounts. No card needed: after that you're on Free unless you choose a plan.`};
    if (trialing(e) && e.source === "code") return {title: "Pro From a Code", sub: e.codeForever ? "Every Pro theme and feature, for good. Storage, devices and group size stay at the free amounts." : `Every Pro theme and feature until ${dateStr(e.trial_until)}. Storage, devices and group size stay at the free amounts. After that you're on Free unless you choose a plan.`};
    if (trialing(e)) return {title: "Your Pro Trial Is On", sub: `Your free trial ends ${dateStr(e.trial_until)}.`};
    if (!e.pro_until) return {title: THANKS, sub: ""};
    if (e.source === "promo") return {title: THANKS, sub: `Pro was granted to your account until ${dateStr(e.pro_until)}.`};
    return {title: THANKS, sub: e.will_renew === false ? `Pro ends ${dateStr(e.pro_until)}. You can turn renewal back on any time.` : `Renews ${dateStr(e.pro_until)}.`};
  }
  const APPLE_RENEW = "Payment will be charged to your Apple ID account at confirmation of purchase. The subscription renews automatically unless it is cancelled at least 24 hours before the end of the current period. Your account will be charged for renewal within 24 hours before the end of the current period. You can manage and cancel your subscriptions in your App Store account settings after purchase. Any unused portion of a free trial period, if offered, is forfeited when you buy a subscription.";
  const GOOGLE_RENEW = "Payment will be charged to your Google Play account at confirmation of purchase. The subscription renews automatically unless it is cancelled before the end of the current period. You can manage and cancel your subscriptions in Google Play, Payments and subscriptions, Subscriptions.";
  const WEB_RENEW_NOTRIAL = "Your card is charged today and again at the start of each period until you cancel. Cancel any time from Manage Plan; you keep Pro until the end of the period you paid for.";
  const WEB_RENEW = "Your card is charged when the free trial ends unless you cancel before then, and again at the start of each period until you cancel. Cancel any time from Manage Plan; you keep Pro until the end of the period you paid for.";
  const semesterOn = () => route() !== "store" && !!cfg.prices.semester;
  const cardTrialOk = () => { const e = ent(); return +cfg.prices.checkoutTrialDays > 0 && !(e && (e.trial_until || e.source === "stripe" || e.external_id)); };
  const trialDaysShown = () => route() === "store" ? +(cfg.prices.storeTrialDays != null ? cfg.prices.storeTrialDays : cfg.prices.trialDays) || 0 : cardTrialOk() ? +cfg.prices.checkoutTrialDays : 0;
  function renewalText(pr, trial){
    const store = route() === "store", t = trialDaysShown();
    const head = `Studyboard Pro is an auto-renewing subscription: ${pr.monthly} per month${semesterOn() ? `, ${pr.semester} every 4 months` : ""} or ${pr.yearly} per year${t ? `, after a ${t}-day free trial` : ""}.`;
    // in the iPhone app for a United States account: the checkout is on the website, said before they tap
    const outside = !store && nativeStore() ? "You'll check out securely on the Studyboard website, and Pro turns on here by itself. " : "";
    return `<p class="plan-fine mini plan-legal" id="planLegal">${esc(outside + head)} ${esc(store ? (onAndroid() ? GOOGLE_RENEW : APPLE_RENEW) : t ? WEB_RENEW : WEB_RENEW_NOTRIAL)} <button type="button" class="link-btn" data-act="legal-terms">Terms of Use</button> · <button type="button" class="link-btn" data-act="legal-privacy">Privacy Policy</button></p>`;
  }
  function priceButtons(){
    if (nativeBuyOff()) return `<p class="plan-fine mini">Buying Pro in the app isn't available in this build yet.</p>`;
    const pr = cfg.prices, m = price(pr.monthly), y = price(pr.yearly), sm = semesterOn() ? price(pr.semester) : null;
    const save = m && y && y < m * 12 ? Math.round((1 - y / (m * 12)) * 100) : 0;
    const per = (amt, months, s) => amt ? `${String(s).replace(/[\d.,]+/, (amt / months).toFixed(2))} a month` : "";
    const trial = trialDaysShown() ? `${trialDaysShown()}-Day Free Trial` : "";
    return `<div class="plan-prices${sm ? " three" : ""}">
        <button type="button" class="plan-price" data-act="plan-buy" data-id="monthly"><span class="pp-name">Monthly</span><span class="pp-amt">${esc(pr.monthly)}<small> / month</small></span>${trial ? `<span class="pp-sub">${esc(trial)}</span>` : ""}</button>
        ${sm ? `<button type="button" class="plan-price" data-act="plan-buy" data-id="semester"><span class="pp-name">Semester</span><span class="pp-amt">${esc(pr.semester)}<small> / 4 months</small></span><span class="pp-sub">${esc([trial, "About " + per(sm, 4, pr.semester)].filter(Boolean).join(" · "))}</span></button>` : ""}
        <button type="button" class="plan-price best" data-act="plan-buy" data-id="yearly">${save ? `<span class="pp-flag">Save ${save}%</span>` : ""}<span class="pp-name">Yearly</span><span class="pp-amt">${esc(pr.yearly)}<small> / year</small></span><span class="pp-sub">${esc([trial, y && "Just " + per(y, 12, pr.yearly)].filter(Boolean).join(" · "))}</span></button>
      </div>
      <p class="plan-fine mini">${trial ? `Try Pro free for ${trialDaysShown()} days. Cancel any time before it ends and you won't be charged.` : "Cancel any time. You keep Pro until the end of the time you paid for."}${cfg.app_trial && sbUser && !(ent() && ent().trial_until) ? ` <button type="button" class="link-btn" data-act="plan-trial">Try It Without a Card</button>` : ""}${sbUser ? ` <button type="button" class="link-btn" data-act="plan-devices">Your Devices</button>` : ""}</p>
      ${renewalText(pr, trial)}`;
  }
  function proSheet(reason){
    if (!(dlg.open && dlg.querySelector(".plan-sheet")) && !paid()) track("shown", reason);
    P.reason = reason || "";
    const st = statusLine(), pro = paywall() && paid(), u = usage(), L = lim();
    const rows = compareRows();
    // Storage is per account, so it only shows once there is one
    const showUsage = !!sbUser && !inPreview();
    const noAcct = paywall() && !pro && !sbUser && !inPreview();
    const usageHtml = showUsage ? `<div class="plan-usage"><h3 class="fsec">Your Storage</h3>${meter("Cloud Files", u.fileMB, fileCapMB())}${meter("Synced Data", u.dataMB, L.dataMB)}</div>` : "";
    openSheet(`<div class="sheet plan-sheet">${head("Studyboard Pro")}
      <div class="sheet-body">
        ${reason ? `<p class="plan-reason" role="status">${IC.info}<span>${esc(reason)}</span></p>` : ""}
        <div class="plan-hero${pro ? " is-pro" : ""}"><span class="plan-orb" aria-hidden="true">${IC.spark}</span><div><b>${esc(st.title)}</b>${st.sub ? `<p class="mini">${esc(st.sub)}</p>` : ""}</div></div>
        ${window.SBEARLY ? SBEARLY.sheetHtml() : ""}
        ${pro ? `<div class="plan-actions"><button type="button" class="btn primary" data-act="plan-manage">Manage Plan</button><button type="button" class="btn" data-act="plan-devices">Your Devices</button></div>${usageHtml}` : ""}
        ${noAcct ? `<div class="plan-gift"><span class="plan-gift-ic" aria-hidden="true">🎁</span><span><b>Create a Free Account to Get a Week of Pro</b><span class="mini">Every Pro theme and feature for 7 days. No card needed, and everything you make stays when the week ends.</span></span><button type="button" class="btn primary" data-act="plan-signup">Create a Free Account</button></div>` : ""}
        ${paywall() ? `<p class="plan-state mini" role="status"><b>Plan:</b> ${esc(planLabel())}</p>` : ""}
        ${paywall() && !pro ? priceButtons() : ""}
        <div class="plan-compare" role="table" aria-label="Free and Pro">
          <div class="pc-row pc-head" role="row"><span role="columnheader"></span><span role="columnheader">Free</span><span role="columnheader" class="pc-pro">${PRO_BADGE}</span></div>
          ${rows.map(([k, f, p]) => `<div class="pc-row" role="row"><span role="rowheader">${esc(k)}</span><span role="cell">${esc(f)}</span><span role="cell" class="pc-pro">${esc(p)}</span></div>`).join("")}
        </div>
        ${(pro || !paywall()) && window.SBPRO ? SBPRO.sheetHtml(pro) : ""}
        <p class="plan-free mini">${IC.check}<span>Always free: Board, Due Dates, Schedule, Focus, notes, flashcards, grades, reminders, Brightspace, Canvas and Blackboard sync, and AI with your own key.</span></p>
        ${pro ? "" : usageHtml}
      </div>
      <div class="sheet-foot">${paywall() && !nativeBuyOff() ? `<button type="button" class="btn" data-act="plan-restore">Restore Purchases</button>` : ""}${paywall() && sbUser && !inPreview() ? `<button type="button" class="btn" data-act="plan-code">Redeem a Code</button>` : ""}${paywall() && !pro && P.awaiting ? `<button type="button" class="btn" data-act="plan-refresh">I've Purchased: Refresh</button>` : ""}${!paywall() && sbUser ? `<button type="button" class="btn" data-act="plan-devices">Your Devices</button>` : ""}<span class="spacer"></span><button type="button" class="btn ${pro || !paywall() ? "primary" : ""}" data-act="close">${pro || !paywall() ? "Done" : "Maybe Later"}</button></div></div>`);
  }
  async function devicesSheet(limitHit){
    const L = lim(), limited = paywall() && !isPro();
    limitHit = !!limitHit && limited;
    const draw = (list, err) => {
      const mine = deviceId();
      const intro = limitHit
        ? `The free plan syncs on up to ${L.devices} devices, and your account is already on ${list ? list.length : L.devices}. Remove one you don't use anymore, or go Pro for unlimited devices.`
        : limited ? `The free plan syncs on up to ${L.devices} devices. Remove old ones you don't use anymore.` : "These are the devices signed in to your account. Remove any you don't use anymore.";
      openSheet(`<div class="sheet plan-sheet">${head(limitHit ? "You're on a Lot of Devices" : "Your Devices")}
        <div class="sheet-body">
          <p style="margin:0">${esc(intro)}</p>
          ${!sbUser ? `<p class="mini" style="margin:0">Sign in to see the devices on your account.</p>`
            : err ? `<p class="mini" style="margin:0">${esc(err)}</p>`
            : !list ? `<p class="mini" style="margin:0">Loading…</p>`
            : `<ul class="plan-devs">${list.map(d => `<li>${IC.device}<span class="pd-name"><b>${esc(d.name || "Device")}</b><span class="mini">${d.device_id === mine ? "This Device" : "Last Used " + esc(dateStr(d.last_seen))}</span></span>${d.device_id === mine ? `<span class="pill">This Device</span>` : `<button type="button" class="btn small" data-act="plan-dev-rm" data-id="${esc(d.device_id)}" data-lim="${limitHit ? 1 : ""}">Remove</button>`}</li>`).join("") || `<li class="mini">No devices yet.</li>`}</ul>`}
        </div>
        <div class="sheet-foot"><button type="button" class="btn" data-act="plan-open">${limitHit ? "About Pro" : "Back"}</button><span class="spacer"></span>${limited ? `<button type="button" class="btn primary" data-act="plan-open" data-id="devices">Go Pro</button>` : `<button type="button" class="btn primary" data-act="close">Done</button>`}</div></div>`);
    };
    draw(P.devices, "");
    if (!sbUser) return;
    try { const l = await loadDevices(); if (dlg.open && dlg.querySelector(".plan-devs,.plan-sheet")) draw(l, l ? "" : srvSetup("Device tracking", "plans.sql")); }
    catch (e) { draw(null, "Couldn't load your devices. Check your connection and try again."); }
  }

  /* Guards */
  const KIND_NAME = {skin: "theme", card: "flashcard style", note: "note shape", pin: "pin", sticker: "sticker pack", comp: "companion", prop: "accessory"};
  const origUnlock = shopUnlock;
  shopUnlock = function (kind, id){
    if (!paywall()) return origUnlock.apply(this, arguments);
    if (cfg.item_purchases && fire("plan-buy-item", kind, id).some(Boolean)) return;
    proSheet(`This ${KIND_NAME[kind] || "item"} is part of Studyboard Pro`);
  };
  const origUpload = sbAssets.upload;
  sbAssets.upload = async function (file, opts){
    if (!limitsPro()) {
      const max = fileCapMB(), used = usage().fileMB, add = ((file && file.size) || 0) / MB;
      if (max != null && used + add > max) {
        if (!DESK && paywall()) setTimeout(() => limitNote("storage", `That's past your ${fmtMB(max)} of ${freeTrialOnly() ? "file storage (the free week keeps the free amount)" : "free file storage"}. Pro has ${fmtMB(lims("pro").fileMB)} of storage.`, {reason: `You've used your ${fmtMB(max)} of free file storage. Pro has ${fmtMB(lims("pro").fileMB)}.`}), 250);
        throw Object.assign(new Error("Over the free storage limit"), {code: "quota_or_state"});
      }
    }
    return origUpload.apply(this, arguments);
  };

  /* Settings row, actions and hooks */
  function planLabel(){
    if (!paywall()) return "Everything is unlocked right now";
    if (!paid()) return "Free";
    const e = ent();
    if (!e) return "Pro";
    if (e.plan === "lifetime" || e.source === "lifetime") return "Pro (granted)";
    if (trialing(e) && e.source === "code") return e.codeForever ? "Pro (code)" : `Pro (code) until ${dateStr(e.trial_until)}`;
    if (trialing(e)) return `Pro trial until ${dateStr(e.trial_until)}`;
    if (e.source === "promo") return e.pro_until ? `Pro (granted) until ${dateStr(e.pro_until)}` : "Pro (granted)";
    return e.pro_until ? `Pro until ${dateStr(e.pro_until)}` : "Pro";
  }
  function rowSub(){
    if (!paywall()) return "Everything is unlocked right now";
    return paid() ? planLabel() : "Free. See what Pro adds.";
  }
  hook("menu", () => inPreview() ? "" : `<button data-act="plan-open" data-group="account" class="plan-row"><span class="plan-row-ic" aria-hidden="true">${IC.spark}</span><span>Studyboard Pro<span class="sub">${esc(rowSub())}</span></span></button>`
    + (paywall() && !nativeBuyOff() ? `<button data-act="plan-restore" data-group="account"><span>Restore Purchases<span class="sub">Get Pro back after reinstalling or on a new device</span></span></button>` : ""));
  hook("act", (act, el, id) => {
    switch (act) {
      case "plan-open": proSheet(id === "devices" ? `The free plan syncs on up to ${lims("free").devices} devices` : el.dataset.reason || ""); return true;
      case "plan-buy": buy(id); return true;
      case "plan-refresh": refreshNow(); return true;
      case "plan-restore": restore(); return true;
      case "plan-code": if (dlg.open) dlg.close(); setTimeout(redeemSheet, 60); return true;
      case "plan-manage": manage(); return true;
      case "plan-trial": startTrial(); return true;
      case "plan-signup": if (dlg.open) dlg.close(); setTimeout(() => { if (window.SBGUEST) SBGUEST.signUp("signup"); else if (typeof sbAsk === "function") sbAsk(); }, 120); return true;
      case "plan-devices": devicesSheet(false); return true;
      case "plan-dev-rm": removeDevice(id).then(() => devicesSheet(!!el.dataset.lim && P.devBlocked)); return true;
    }
    return false;
  });
  hook("render", watchUser);
  hook("boot", () => {
    watchUser();
    changed();
    setInterval(() => { if (sbUser && navigator.onLine !== false) refresh(); }, 6 * 3600000);
    const back = () => { if (document.hidden || !sbUser || !paywall() || navigator.onLine === false) return; if ((P.awaiting && Date.now() < P.awaiting) || Date.now() - P.lastLoad > 15 * 60000) refresh(); };
    document.addEventListener("visibilitychange", back);
    window.addEventListener("focus", back);
    document.addEventListener("visibilitychange", () => { if (document.hidden) bump(now()); });
  });
  loadCachedToken();

  PLAN = {
    tier: () => isPro() ? "pro" : "free",
    isPro, paywall, settled,
    limits: () => Object.assign({}, lim()),
    freeLimits: () => Object.assign({}, lims("free")),
    proLimits: () => Object.assign({}, lims("pro")),
    config: () => JSON.parse(JSON.stringify(cfg, (k, v) => v === Infinity ? null : v)),
    entitlement: () => ent() ? Object.assign({}, ent()) : null,
    can, usage,
    openSheet: proSheet,
    devicesSheet: () => devicesSheet(false),
    limitNote, limitsPro, styleGrace, endStyleGrace, welcomeWeek, welcomeSaid, redeemSheet,
    buy, checkout: buy, restore, refresh, manage, refreshNow, mode,
    label: planLabel, siteUrl: () => siteBase(),
    deviceId,
    fmtMB
  };
  window.StudyboardPlan = {tier: PLAN.tier, isPro, limitsPro, paywall, settled, mode, limits: PLAN.limits, can, usage, openSheet: r => proSheet(r), refresh, entitlement: PLAN.entitlement, label: () => planLabel(), status: () => statusLine(), limitNote};
})();


