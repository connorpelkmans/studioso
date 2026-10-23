/* ===== module: 01-accounts.js: the app's core, accounts, using the app without one, and lean sync ===== */
const SB_DEFAULT = {"url": "https://pivcmrqcjseycjkbocmc.supabase.co", "key": "sb_publishable_hoKTO5FRblXqHs6MvO686Q_81c5_gvd"};
const SB_HOSTED = !!(SB_DEFAULT.url && SB_DEFAULT.key);
// When a server feature isn't switched on yet
function srvSetup(what, file){ return SB_HOSTED && !sbCustom() ? `${what} isn't available yet. Please check back soon.` : `${what} needs one more setup step on your server: run ${file} from the setup guide, then try again.`; }
// supabase-js 2.117.2 (UMD)
const SBJS_LOCAL = "vendor/supabase-js-2.117.2.umd.js";
const SBJS = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.2/dist/umd/supabase.js";
const SBJS_SRI = "sha384-Rj26LVGvoeRVR6+mwQmFfcR3QOBEwT+ZmuCWpuiqeTzJpCs0ER4ITAWGb4Hiy3Ok";
const SB_BUCKET = "studioso-files";
const SB_CFG = "studioso:sb";
let sb = null, sbUser = null, sbStarting = false, sbNextMode = "";
function sbConfig(){
  try { const c = JSON.parse(localStorage.getItem(SB_CFG) || "null"); if (c && c.url && c.key) return c; } catch(e) {}
  if (sbLocalOnly()) return null;
  return SB_HOSTED ? SB_DEFAULT : null;
}
// Studyboard can be used without an account ("Use Without an Account" when it first opens)
function sbLocalOnly(){ try { return localStorage.getItem(SB_CFG) === "\"local\""; } catch(e) { return false; } }
// A server someone typed in themselves
function sbCustom(){ try { const c = JSON.parse(localStorage.getItem(SB_CFG) || "null"); return !!(c && c.url && c.key && c.url !== SB_DEFAULT.url); } catch(e) { return false; } }
// Friendly words for account errors, so nobody sees raw server messages
function sbWords(error, fallback){
  const m = String((error && (error.message || error.error_description)) || error || ""), st = Number(error && error.status) || 0;
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
/* A link from an email that failed */
const SB_LINK_ERR = (() => {
  try {
    const q = new URLSearchParams(location.hash.replace(/^#/, "") + "&" + location.search.replace(/^\?/, ""));
    const code = q.get("error_code") || (q.get("error") ? "error" : "");
    if (!code && !q.get("error_description")) return null;
    return {code: String(code).slice(0, 40), recovery: /recover|reset/i.test(String(q.get("type") || "")) };
  } catch (e) { return null; }
})();
// Password strength for the new-password forms
function sbStrength(pw){
  pw = String(pw || "");
  let n = 0;
  if (pw.length >= 8) n++;
  if (pw.length >= 12) n++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) n++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw) || (/\d/.test(pw) && /[A-Za-z]/.test(pw) && pw.length >= 10)) n++;
  if (/^(password|12345678|qwertyui|letmein|iloveyou)/i.test(pw) || /^(.)\1+$/.test(pw)) n = 0;
  const label = pw.length < 8 ? "Too short" : n <= 1 ? "Weak" : n === 2 ? "Okay" : n === 3 ? "Good" : "Strong";
  return {label, score: pw.length < 8 ? 0 : n, ok: pw.length >= 8 && n >= 2};
}
const SB_WEAK = "That password is too easy to guess. Add more characters or mix in capitals, numbers or symbols.";
// A new-password box with Show and a strength meter
function sbPwHtml(label, ac, o){
  o = o || {};
  return `<label class="f"><span class="lh">${label}${o.req === false ? "" : " " + REQ}</span><span class="pw-wrap"><input type="password" name="password" required minlength="8" autocomplete="${ac}"${o.autofocus ? " autofocus" : ""}><button type="button" class="pw-eye" aria-pressed="false" aria-label="Show password">Show</button></span></label>
    <div class="pw-meter" data-s="0" aria-hidden="true"><i></i></div><p class="mini pw-note" id="${o.id || "sbStrength"}" style="margin:0" aria-live="polite">At least 8 characters.</p>`;
}
function sbPwWire(root){
  root.querySelectorAll(".pw-eye").forEach(b => b.addEventListener("click", () => {
    const i = b.previousElementSibling, show = i.type === "password";
    i.type = show ? "text" : "password"; b.textContent = show ? "Hide" : "Show";
    b.setAttribute("aria-pressed", String(show)); b.setAttribute("aria-label", show ? "Hide password" : "Show password");
  }));
  root.querySelectorAll(".pw-meter").forEach(m => {
    const inp = m.previousElementSibling && m.previousElementSibling.querySelector("input"), out = m.nextElementSibling; if (!inp || !out) return;
    inp.addEventListener("input", () => {
      const v = inp.value, r = sbStrength(v);
      m.dataset.s = v ? String(Math.max(1, r.score)) : "0";
      out.textContent = !v ? "At least 8 characters." : r.ok ? `Strength: ${r.label}` : `Strength: ${r.label}. ${v.length < 8 ? "Use at least 8 characters." : "Add more characters, or mix in capitals, numbers or symbols."}`;
    });
  });
}
const sbActive = () => !inPreview() && !!sb && !!sbUser;
function sbErr(e){
  const msg = String((e && (e.message || e.error_description || e.error)) || e || "");
  const status = Number(e && (e.status || e.statusCode)) || 0;
  const x = new Error(msg);
  x.code = /fetch|network|timed? ?out|Load failed/i.test(msg) || status === 0 && /fetch/i.test(msg) || status >= 500 ? "unavailable"
    : status === 413 || /too large|exceeded the maximum/i.test(msg) ? "too_large"
    : /quota|storage limit/i.test(msg) ? "quota_or_state"
    : status === 429 ? "rate_limited" : e && e.code === "23514" ? "schema" : (e && e.code) || "error";
  return x;
}
/* Where the sign-in session (the Supabase tokens) is kept */
const deskAuthStorage = DESK && DESK.secrets ? (() => {
  const nm = k => "sb-" + String(k).toLowerCase().replace(/[^a-z0-9:_-]/g, "_").slice(0, 60);
  let ok = null; const avail = async () => ok === null ? (ok = await DESK.secrets.available().catch(() => false)) : ok;
  return {
    async getItem(k){
      if (await avail()) {
        const v = await DESK.secrets.get(nm(k)); if (v != null) return v;
        const old = localStorage.getItem(k);
        if (old != null && await DESK.secrets.set(nm(k), old)) localStorage.removeItem(k);
        return old;
      }
      return localStorage.getItem(k);
    },
    async setItem(k, v){ if (await avail() && await DESK.secrets.set(nm(k), String(v))) { localStorage.removeItem(k); return; } localStorage.setItem(k, String(v)); },
    async removeItem(k){ localStorage.removeItem(k); if (await avail()) await DESK.secrets.remove(nm(k)); }
  };
})() : null;
const authStorage = () => {
  const n = window.StudyboardAuthStorage;
  return n && typeof n.getItem === "function" && typeof n.setItem === "function" && typeof n.removeItem === "function" ? n : deskAuthStorage;
};
/* The server can refuse a sign-in token this device still thinks is good */
let sbRenewP = null, sbRenewAt = 0, sbRenewTok = "";
function sbRenewToken(used){
  if (sbRenewP) return sbRenewP;
  if (Date.now() - sbRenewAt < 15000) return Promise.resolve(sbRenewTok && sbRenewTok !== used ? sbRenewTok : null);
  sbRenewP = (async () => {
    let tok = "", dead = false;
    try {
      const {data, error} = await sb.auth.refreshSession();
      if (!error && data && data.session) tok = data.session.access_token || "";
      else if (error && [400, 401, 403].includes(Number(error.status)) && !/retryable/i.test(error.name || "")) dead = true;
    } catch(e) {}
    sbRenewAt = Date.now(); sbRenewTok = tok; sbRenewP = null;
    if (dead && sbUser) {
      try { await sb.auth.signOut({scope: "local"}); } catch(e) {}
      toast("Your sign-in expired. Sign in again to keep syncing. Your work is saved on this device.");
      setTimeout(() => { if (!sbUser && !dlg.open) sbSignInSheet(); }, 400);
    }
    return tok && tok !== used ? tok : null;
  })();
  return sbRenewP;
}
const SB_TOKEN_REFUSED = /jwt|jws|pgrst30[0-3]|"exp" claim|exp claim|(invalid|expired|bad).{0,12}token|token.{0,12}(invalid|expired)/i;
const sbFetch = key => async (input, init) => {
  try {
    const u = String(typeof Request !== "undefined" && input instanceof Request ? input.url : input || ""), m = String((init && init.method) || "GET").toUpperCase();
    if (typeof AbortSignal !== "undefined" && AbortSignal.timeout && ((/\/rest\/v1\//.test(u) && (m === "GET" || m === "HEAD" || /\/rpc\//.test(u))) || /\/auth\/v1\/token/.test(u))) {
      const t = AbortSignal.timeout(window.__SB_REQ_WAIT || 30000), own = init && init.signal;
      const sig = !own ? t : AbortSignal.any ? AbortSignal.any([own, t]) : null;
      if (sig) init = Object.assign({}, init, {signal: sig});
    }
  } catch(e) {}
  const res = await fetch(input, init);
  if (res.status !== 401 && res.status !== 403 && res.status !== 400) return res;
  try {
    const url = String(typeof input === "string" ? input : (input && input.url) || "");
    if (!sb || !/\/(rest|storage|functions)\/v1\//.test(url) || typeof input !== "string") return res;
    const h = new Headers((init && init.headers) || {});
    const used = (h.get("Authorization") || "").replace(/^Bearer\s+/i, "");
    if (!used || used === key || used.split(".").length !== 3) return res;
    if (!SB_TOKEN_REFUSED.test(await res.clone().text())) return res;
    const tok = await sbRenewToken(used);
    if (!tok) return res;
    h.set("Authorization", "Bearer " + tok);
    return fetch(input, Object.assign({}, init, {headers: h}));
  } catch(e) { return res; }
};
/* SECURITY: an email link signs in by putting the session tokens in the address */
const SB_LINK_ASKED = "studioso:linkAsked";
const sbLinkAsked = () => { try { localStorage.setItem(SB_LINK_ASKED, String(Date.now())); } catch(e) {} };
function sbUrlSessionOk(url, params){
  const p = params || {};
  if (!p.access_token) return !!(p.error || p.error_description || p.error_code);
  let asked = 0, owner = null; try { asked = Number(localStorage.getItem(SB_LINK_ASKED)) || 0; owner = localStorage.getItem("studioso:owner"); } catch(e) {}
  if (asked && Date.now() - asked < 2 * 864e5) { try { localStorage.removeItem(SB_LINK_ASKED); } catch(e) {} return true; }
  const empty = ["courses", "tasks", "files", "notes", "decks", "events"].every(k => !Object.keys((state && state[k]) || {}).length);
  if ((!owner || owner === "none") && empty) return true;
  try { history.replaceState(null, "", location.pathname + location.search); } catch(e) {}
  setTimeout(() => toast("That sign-in link wasn't used, to keep this device's data safe. Sign in with your email and password, or the 6-digit code from the email."), 1500);
  return false;
}
async function initSupabase(ask){
  const cfg = sbConfig() || (ask && SB_HOSTED ? SB_DEFAULT : null);
  if (!cfg) { syncLabel(); if (!sbLocalOnly() || ask) setTimeout(() => { if (!dlg.open || ask) sbSetupSheet(); }, ask ? 0 : 400); return; }
  if (sbLocalOnly() && !ask) { syncLabel(); return; }
  if (!window.supabase) {
    try { await loadSupabaseLib(); }
    catch(e) {
      console.warn("Sign-in library failed to load:", e && e.message); syncLabel();
      if (ask) toast("Can't reach the sign-in service right now. Check your connection and try again.");
      return;
    }
  }
  if (!sb) {
    sb = window.supabase.createClient(cfg.url, cfg.key, {auth: Object.assign({persistSession: true, autoRefreshToken: true, detectSessionInUrl: sbUrlSessionOk, storageKey: "studioso-auth"}, authStorage() ? {storage: authStorage()} : {}), global: {fetch: sbFetch(cfg.key)}});
    sb.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") setTimeout(() => sbNewPasswordSheet(), 300);
      const u = session && session.user;
      if (u && sbLocalOnly()) { try { localStorage.removeItem(SB_CFG); } catch(e) {} }
      if (u && (!sbUser || sbUser.id !== u.id)) { sbUser = u; setTimeout(startSupabaseSync, 0); setTimeout(aiTrialSignedIn, 1500); }
      else if (!u && sbUser && event === "SIGNED_OUT") { SBC.del("rows", sbUser.id); ["brightspace", "canvas", "blackboard"].forEach(k => SBC.del("rows", "feed:" + k)); if (sbBackend.cur) sbBackend.cur(); sbUser = null; cloud.on = false; caps.assets = DESK ? deskAssets : null; syncLabel(); scheduleRender(); setTimeout(() => { if (!sbUser) sbSignInSheet(); }, 200); }
    });
  }
  let session = null;
  try { const r = await sb.auth.getSession(); session = r.data && r.data.session; } catch(e) {}
  if (SB_LINK_ERR && !SB_LINK_ERR.shown) { SB_LINK_ERR.shown = true; try { history.replaceState(null, "", location.pathname); } catch(e) {} setTimeout(sbLinkErrorSheet, 500); }
  if (session) { if (!sbUser) { sbUser = session.user; startSupabaseSync(); setTimeout(aiTrialSignedIn, 1500); } }
  else { syncLabel(); setTimeout(() => { if ((ask || !dlg.open) && !sbUser) sbSignInSheet(sbNextMode || (ask ? undefined : "hello")); sbNextMode = ""; }, ask ? 0 : 400); }
}
// Settings, sharing, reminders and so on call this to let someone sign in or make an account
function sbAsk(){ if (sb) sbSignInSheet(); else if (sbConfig() || SB_HOSTED) { toast("Connecting…"); initSupabase(true); } else sbSetupSheet(); }
const SBGUEST = window.SBGUEST = (() => {
  const K = "studyboard:guest:";
  const get = k => { try { return localStorage.getItem(K + k); } catch(e) { return null; } };
  const set = (k, v) => { try { localStorage.setItem(K + k, String(v)); } catch(e) {} };
  const is = () => SB_HOSTED && sbLocalOnly() && !sbUser && !(typeof inPreview === "function" && inPreview());
  const hasData = () => ["courses", "tasks", "notes", "decks", "files"].some(k => Object.keys((state && state[k]) || {}).length);
  function signUp(mode){
    mode = mode === "signin" ? "signin" : "signup";
    if (sb) { sbSignInSheet(mode); return; }
    sbNextMode = mode; toast("Connecting…"); initSupabase(true);
  }
  function sheet(lead){
    openSheet(`<div class="sheet">${head("Save Your Planner")}<div class="sheet-body">
      <p style="margin:0">${esc(lead || "Your planner is only on this device right now.")} A free Studyboard account keeps it safe online, even if you clear your browser or lose this device, and puts it on your phone and laptop too.</p>
      <p class="mini" style="margin:0">Everything you've made here comes with you into the new account.</p>
    </div><div class="sheet-foot"><button type="button" class="btn" data-guest="later">Not Now</button><span class="spacer"></span><button type="button" class="btn" data-guest="signin">I Have an Account</button><button type="button" class="btn primary" data-guest="signup">Create a Free Account</button></div></div>`);
    dlg.querySelectorAll("[data-guest]").forEach(b => b.addEventListener("click", () => {
      const v = b.dataset.guest; dlg.close(); set("asked", Date.now());
      if (v !== "later") setTimeout(() => signUp(v), 120);
    }));
  }
  function nudge(key, lead){
    if (!is() || !hasData()) return;
    if (key !== "later" && get("did:" + key)) return;
    let tries = 0;
    const go = () => {
      if (!is()) return;
      { const t = document.getElementById("toast"); if (t && t.classList.contains("show") && ++tries < 20) { setTimeout(go, 3000); return; } }
      if (key !== "later") set("did:" + key, 1);
      set("asked", Date.now());
      toast(lead || "Your planner is only on this device.", null, {label: "Save It", fn: () => sheet(lead)});
    };
    if (typeof dlg !== "undefined" && dlg.open) dlg.addEventListener("close", () => setTimeout(go, 500), {once: true}); else go();
  }
  function remind(){
    if (!is()) return;
    const since = Number(get("since")) || 0; if (!since) { set("since", Date.now()); return; }
    const asked = Number(get("asked")) || 0;
    if (Date.now() - since > 3 * 864e5 && Date.now() - asked > 7 * 864e5) nudge("later", "Your planner is still only on this device. Save it to a free account so you can't lose it.");
  }
  return {is, hasData, signUp, sheet, nudge, remind, chose: () => set("since", Date.now())};
})();
document.addEventListener("click", e => { if (e.target.closest && e.target.closest("#guestBadge,#guestBadgeSide")) SBGUEST.sheet(); });
setTimeout(() => { try { SBGUEST.remind(); } catch(e) {} }, 6000);
/* Whose data is on this device */
const OWNER = "studioso:owner";
const AI_KEYS_OWNER = "studyboard:aiKeysOwner";
const NO_OWNER = "none";
// Set when a fresh install starts from the copy in the Studyboard folder (deskBoot)
const FOLDER_FROM = "studyboard:folderFrom";
async function claimDevice(uid){
  let owner = null; try { owner = localStorage.getItem(OWNER); } catch(e) {}
  try {
    const keysOwner = localStorage.getItem(AI_KEYS_OWNER);
    if (keysOwner ? keysOwner !== uid : (owner && owner !== uid)) aiWipeLocal();
    localStorage.setItem(AI_KEYS_OWNER, uid);
  } catch(e) {}
  if (owner === uid) return;
  const kinds = ["courses", "tasks", "files", "notes", "decks", "events"], has = () => kinds.some(k => Object.keys(state[k] || {}).length);
  const KIND_OF = {courses: "course", tasks: "task", files: "file", notes: "note", decks: "deck", events: "event"};
  if (owner && owner !== uid) {
    if (has()) {
      let kept = false;
      try { await saveDeviceBackup(Object.assign(backupSnap(), {note: "Left on this device by another account"}), true); kept = true; } catch(e) { console.warn("set-aside backup", e); }
      if (!kept) { try { saveBlob(`studyboard-other-account-${todayISO()}.json`, JSON.stringify(Object.assign({app: "studyboard"}, exportArrays()), null, 1), "application/json"); setTimeout(() => toast("This device held another account's data. It was saved as a file in your Downloads before your account's data loaded."), 1300); } catch(e) {} }
    }
    const hadData = has();
    state = {courses:{}, tasks:{}, files:{}, notes:{}, decks:{}, events:{}, trash:{}, settings:{capacity:15}, updated:0};
    try { localStorage.removeItem(OUTBOX); localStorage.removeItem(LS_TRASH); outboxOwn.clear(); } catch(e) {}
    saveLocal();
    if (hadData) { try { setTimeout(() => toast("This device still held another account's data. It was set aside in a device backup, and your account's data is loading."), 1200); } catch(e) {} }
  } else if (!owner && has()) {
    let synced = false;
    try { synced = !!(await SBC.get("rows", uid)); } catch(e) {}
    let from = ""; try { from = localStorage.getItem(FOLDER_FROM) || ""; } catch(e) {}
    const restored = !!from, otherAccount = restored && from !== "none" && from !== "?" && from !== uid;
    if (!synced) {
      let gone = null;
      if (!otherAccount) {
        try {
          const all = kinds.flatMap(k => Object.keys(state[k] || {}).map(id => [KIND_OF[k], id]));
          const seen = new Set();
          for (let i = 0; i < all.length; i += 150) {
            const part = all.slice(i, i + 150);
            const {data, error} = await sb.from("studyboard_deletions").select("kind,id").in("id", part.map(x => x[1]));
            if (error) throw error;
            (data || []).forEach(d => seen.add(d.kind + "|" + d.id));
          }
          gone = seen;
        } catch(e) { console.warn("deletion check", e); }
      }
      if (otherAccount || (restored && !gone)) {
        try { await saveDeviceBackup(Object.assign(backupSnap(), {note: otherAccount ? "Restored from the Studyboard folder, written by another account" : "Restored from the Studyboard folder"}), true); } catch(e) { console.warn("set-aside backup", e); }
        state = {courses:{}, tasks:{}, files:{}, notes:{}, decks:{}, events:{}, trash:{}, settings: state.settings || {capacity:15}, updated:0};
        try { localStorage.removeItem(OUTBOX); outboxOwn.clear(); } catch(e) {}
        saveLocal();
        setTimeout(() => { try { toast("An older copy found in your Studyboard folder was kept in a device backup instead of being added to your account. Restore it from Settings if you need it."); } catch(e) {} }, 1500);
      } else {
        const out = gone || new Set();
        const deadCourses = new Set(Object.keys(state.courses || {}).filter(id => out.has("course|" + id)));
        const isGone = (k, o) => out.has(KIND_OF[k] + "|" + o.id) || (k !== "courses" && o.courseId && deadCourses.has(o.courseId));
        const drop = kinds.flatMap(k => Object.values(state[k] || {}).filter(o => o && o.id && isGone(k, o)).map(o => [k, o.id]));
        if (drop.length) {
          try { await saveDeviceBackup(Object.assign(backupSnap(), {note: "Before leaving out what the account had deleted"}), true); } catch(e) { console.warn("set-aside backup", e); }
          drop.forEach(([k, id]) => { delete state[k][id]; });
          saveLocal();
          setTimeout(() => { try { toast(`${plural0(drop.length, "item")} you'd deleted in your account ${drop.length === 1 ? "was" : "were"} left out, so ${drop.length === 1 ? "it stays" : "they stay"} deleted.`); } catch(e) {} }, 1500);
        }
        kinds.forEach(k => Object.values(state[k] || {}).forEach(o => { if (o && o.id) outboxAdd(KIND_OF[k], o.id, o); }));
      }
    }
  }
  try { localStorage.setItem(OWNER, uid); localStorage.removeItem(FOLDER_FROM); } catch(e) {}
}
let sbStartGen = 0, sbStartTries = 0;
/* What connecting is waiting on, shown under "reconnecting…" in Settings */
const SB_DIAG = window.SB_DIAG = {step: "", since: 0, err: "", errAt: 0, tries: 0, startedAt: 0};
const sbStep = step => { if (SB_DIAG.step !== step) { SB_DIAG.step = step; SB_DIAG.since = Date.now(); } };
function sbDiagHtml(){
  if (cloud.on) return "";
  const ago = t => { const s = Math.max(0, Math.round((Date.now() - t) / 1000)); return s < 90 ? s + "s" : Math.round(s / 60) + " min"; };
  const net = typeof navigator !== "undefined" && navigator.onLine === false ? "This device is offline. " : "";
  const step = SB_DIAG.step ? `Waiting on: ${esc(SB_DIAG.step)} (${ago(SB_DIAG.since)})` : "Waiting to start";
  const err = SB_DIAG.err ? `<br>Last problem (${ago(SB_DIAG.errAt)} ago): ${esc(SB_DIAG.err.slice(0, 220))}` : "";
  return `<div class="cap-row sb-diag"><span style="flex:1" class="mini">${net}${step}${SB_DIAG.tries ? ` · attempt ${SB_DIAG.tries}` : ""}${err}</span><button class="btn small" data-act="sb-retry">Try Again</button></div>`;
}
setInterval(() => { try { const d = document.querySelector(".sb-diag"); if (!d) return; const h = sbDiagHtml(); if (!h) d.remove(); else if (d.outerHTML !== h) d.outerHTML = h; } catch(e) {} }, 2000);
function sbRetryNow(){
  SB_DIAG.err = ""; sbStartTries = 0;
  sbStartGen++; sbStarting = false;
  startSupabaseSync();
}
async function startSupabaseSync(){
  if (sbStarting || !sbUser) return;
  sbStarting = true;
  const gen = ++sbStartGen;
  SB_DIAG.tries++; SB_DIAG.startedAt = Date.now(); sbStep("Checking this device");
  const dog = setTimeout(() => { if (gen === sbStartGen && sbStarting) { SB_DIAG.err = `Timed out after 25s at "${SB_DIAG.step}"`; SB_DIAG.errAt = Date.now(); sbStarting = false; if (!cloud.on) setTimeout(startSupabaseSync, 500); } }, 25000);
  try {
    await claimDevice(sbUser.id);
    sbStep("Checking your account");
    const backend = await sbBackend(sb, sbUser.id);
    if (gen !== sbStartGen) return;
    if (backend.alive()) {
      caps.assets = DESK ? deskAssets : sbAssets;
      sbStep("Reading your settings");
      await connectBackend(backend);
      sbStep(""); SB_DIAG.err = ""; SB_DIAG.tries = 0;
      sbStartTries = 0;
      scheduleRender();
      if (DESK) setTimeout(deskPromote, 1500);
    }
  } catch(e) {
    console.warn("Sync failed", e);
    if (gen !== sbStartGen) return;
    SB_DIAG.err = `${SB_DIAG.step || "Connecting"}: ${String((e && (e.message || e.code)) || e || "unknown error")}`; SB_DIAG.errAt = Date.now();
    cloud.on = false; syncLabel();
    const m = String(e && e.message || "");
    if (/relation .*items.* does not exist|Could not find the table/i.test(m)) toast(SB_HOSTED ? "Studyboard's online sync isn't ready yet. Your work is saved on this device." : "Your server isn't set up yet. Run the setup SQL from the guide, then reload.");
    else {
      if (!/fetch|network/i.test(m)) toast("Couldn't load your online data just now. Your work is saved on this device and will sync later.");
      if (sbStartTries < 4) setTimeout(() => { if (!cloud.on) startSupabaseSync(); }, 3000 * Math.pow(2, sbStartTries++));
    }
  } finally {
    clearTimeout(dog);
    if (gen === sbStartGen) sbStarting = false;
  }
}
/* Lean sync Keeps what Supabase sends small, so it stays free for a lot of students */
const SBC = {
  db: null,
  open(){
    if (this.db) return this.db;
    const p = this.db = new Promise((ok, no) => {
      try {
        const r = indexedDB.open("studyboard-sync", 1);
        let late = false; const t = setTimeout(() => { late = true; no(new Error("device copy unavailable")); }, window.__SBC_WAIT || 4000);
        r.onupgradeneeded = () => { const d = r.result; if (!d.objectStoreNames.contains("rows")) d.createObjectStore("rows"); if (!d.objectStoreNames.contains("backups")) d.createObjectStore("backups"); };
        r.onsuccess = () => { clearTimeout(t); const d = r.result; if (late) { try { d.close(); } catch(e) {} return; }
          d.onversionchange = () => { try { d.close(); } catch(e) {} if (this.db === p) this.db = null; }; ok(d); };
        r.onerror = () => { clearTimeout(t); no(r.error); };
      } catch(e) { no(e); }
    }).catch(e => { if (this.db === p) this.db = null; throw e; });
    return this.db;
  },
  async run(store, mode, fn){
    const d = await this.open();
    return new Promise((ok, no) => { const tx = d.transaction(store, mode), st = tx.objectStore(store); const req = fn(st); tx.oncomplete = () => ok(req && "result" in req ? req.result : undefined); tx.onerror = tx.onabort = () => no(tx.error); });
  },
  get(store, key){ return this.run(store, "readonly", s => s.get(key)).catch(() => undefined); },
  put(store, key, val){ return this.run(store, "readwrite", s => s.put(val, key)).catch(e => console.warn("device copy", e)); },
  putStrict(store, key, val){ return this.run(store, "readwrite", s => s.put(val, key)); },
  del(store, key){ return this.run(store, "readwrite", s => s.delete(key)).catch(() => {}); },
  all(store){ return this.run(store, "readonly", s => s.getAll()).catch(() => []); },
  keys(store){ return this.run(store, "readonly", s => s.getAllKeys()).catch(() => []); }
};
// This device's id (shared with the device list in Studyboard Pro)
function sbDevice(){
  let id = ""; try { id = localStorage.getItem("studyboard:deviceId") || ""; if (!id) { id = crypto.randomUUID ? crypto.randomUUID() : uid() + uid(); localStorage.setItem("studyboard:deviceId", id); } } catch(e) {}
  return id.slice(0, 64) || "web";
}
const SB_OVERLAP = 2 * 60000, SB_FULL_EVERY = 7 * 864e5, SB_DELTA_MAX_AGE = 30 * 864e5, SB_REALTIME_IDLE = 60000;
const SB_STATS = {mode: "", full: 0, delta: 0, rows: 0, at: 0};
async function sbBackend(client, userId){
  const T = "items", KINDS = ["task", "course", "file", "note", "deck", "event", "trash", "meta"];
  const blank = () => { const o = {}; KINDS.forEach(k => { o[k] = new Map(); }); return o; };
  let cache = blank();
  const listeners = {task: [], course: [], file: [], note: [], deck: [], event: [], trash: []};
  const snapOf = kind => ({docs: [...cache[kind].entries()].map(([id, d]) => ({id, data: () => d}))});
  const emit = kind => (listeners[kind] || []).forEach(f => { try { f(snapOf(kind)); } catch(e) { console.warn(e); } });
  const saved = {cursor: "", fullAt: 0, at: 0};
  let lean = false;
  try { const {error} = await client.from("studyboard_deletions").select("id").limit(1); lean = !error; } catch(e) {}
  let revCol = false;
  try { const {error} = await client.from(T).select("rev").limit(1); revCol = !error; } catch(e) {}
  const COLS = "kind,id,data,updated_at" + (revCol ? ",rev" : "");
  const revs = new Map();
  let pbase = new Map();
  const foreign = new Set();
  // Bumped each time this device edits an item, so a save that lands after a newer edit leaves that edit's base in place
  const edits = new Map();
  const bkey = (kind, id) => kind === "meta" ? "meta:planner" : kind + ":" + id;
  const skewKey = "studioso:skew";
  let skew = 0; try { skew = Number(localStorage.getItem(skewKey)) || 0; } catch(e) {}
  if (revCol) {
    try { const t0 = Date.now(), {data: now, error} = await client.rpc("studyboard_clock"); if (!error && now) { const k = SyncMerge.skewFrom(now, t0, Date.now()); if (Math.abs(k) < 30 * 864e5) { skew = k; try { localStorage.setItem(skewKey, String(k)); } catch(e) {} } } } catch(e) {}
  }
  const noteForeign = (kind, id, data) => { const k = bkey(kind, id), b = pbase.get(k); if (b && !SyncMerge.eq(b.data, data)) foreign.add(k); };
  let pbT = 0;
  const pbSave = () => { clearTimeout(pbT); pbT = setTimeout(() => SBC.put("rows", "pb:" + userId, {v: 1, items: [...pbase.entries()]}), 150); };
  try {
    const s = await SBC.get("rows", "pb:" + userId), ob = outboxGet();
    if (s && s.v === 1) (s.items || []).forEach(([k, v]) => { if (k in ob || (k === "meta:planner" && "meta:meta" in ob)) pbase.set(k, v); });
  } catch(e) {}
  let persistT = 0;
  const persist = () => { if (!lean) return; clearTimeout(persistT); persistT = setTimeout(() => {
    const rows = {}; KINDS.forEach(k => { rows[k] = [...cache[k].entries()]; });
    SBC.put("rows", userId, {v: 1, cursor: saved.cursor, fullAt: saved.fullAt, at: saved.at, rows, revs: [...revs.entries()]});
  }, 1500); };
  const later = (a, b) => !a ? b || "" : !b ? a : (Date.parse(b) > Date.parse(a) ? b : a);
  const loadAll = async () => {
    const fresh = blank(); let cursor = "", n = 0;
    for (let from = 0; ; from += 1000) {
      const {data, error} = await client.from(T).select(COLS).neq("kind", "backup").order("kind").order("id").range(from, from + 999);
      if (error) throw sbErr(error);
      (data || []).forEach(r => { if (fresh[r.kind]) { fresh[r.kind].set(r.id, r.data); if (r.rev != null) revs.set(bkey(r.kind, r.id), r.rev); } cursor = later(cursor, r.updated_at); n++; });
      if (!data || data.length < 1000) break;
    }
    cache = fresh;
    saved.cursor = cursor || "1970-01-01T00:00:00Z"; saved.fullAt = saved.at = Date.now();
    Object.assign(SB_STATS, {mode: lean ? "lean" : "full", full: SB_STATS.full + 1, rows: n, at: Date.now()});
    persist();
    return n;
  };
  const pullDelta = async () => {
    const since = new Date(Date.parse(saved.cursor) - SB_OVERLAP).toISOString();
    const got = new Map(), changed = new Set(); let cursor = saved.cursor, n = 0;
    for (let from = 0; ; from += 1000) {
      const {data, error} = await client.from(T).select(COLS).neq("kind", "backup").gt("updated_at", since).order("updated_at").range(from, from + 999);
      if (error) throw sbErr(error);
      (data || []).forEach(r => {
        cursor = later(cursor, r.updated_at); n++;
        if (!cache[r.kind]) return;
        got.set(r.kind + "|" + r.id, r.updated_at);
        if (r.rev != null) revs.set(bkey(r.kind, r.id), r.rev);
        if (JSON.stringify(cache[r.kind].get(r.id)) !== JSON.stringify(r.data)) { cache[r.kind].set(r.id, r.data); changed.add(r.kind); noteForeign(r.kind, r.id, r.data); }
      });
      if (!data || data.length < 1000) break;
    }
    const {data: dels, error: de} = await client.from("studyboard_deletions").select("kind,id,deleted_at").gt("deleted_at", since).order("deleted_at").limit(5000);
    if (de) throw sbErr(de);
    (dels || []).forEach(d => {
      cursor = later(cursor, d.deleted_at);
      const back = got.get(d.kind + "|" + d.id);
      if (back && Date.parse(back) >= Date.parse(d.deleted_at)) return;
      if (cache[d.kind] && cache[d.kind].delete(d.id)) changed.add(d.kind);
    });
    saved.cursor = cursor; saved.at = Date.now();
    Object.assign(SB_STATS, {mode: "lean", delta: SB_STATS.delta + 1, rows: n + (dels || []).length, at: Date.now()});
    persist();
    return changed;
  };
  let started = false;
  if (lean) {
    sbStep("Reading the copy on this device");
    const s = await SBC.get("rows", userId);
    if (s && s.v === 1 && s.cursor && Date.now() - (s.fullAt || 0) < SB_FULL_EVERY && Date.now() - (s.at || 0) < SB_DELTA_MAX_AGE) {
      cache = blank(); KINDS.forEach(k => { (s.rows[k] || []).forEach(([id, d]) => cache[k].set(id, d)); });
      (s.revs || []).forEach(([k, v]) => revs.set(k, v));
      try { Object.keys(outboxGet()).forEach(k => { const pk = k === "meta:meta" ? "meta:planner" : k, i = pk.indexOf(":"), kd = pk.slice(0, i); if (!pbase.has(pk) && cache[kd]) pbase.set(pk, {rev: revs.get(pk) || 0, data: cache[kd].get(pk.slice(i + 1)) ?? null, at: null}); }); } catch(e) {}
      saved.cursor = s.cursor; saved.fullAt = s.fullAt; saved.at = s.at || 0;
      sbStep("Fetching recent changes");
      try { await pullDelta(); started = true; } catch(e) { console.warn("Delta sync failed, loading everything", e); }
    }
  }
  if (!started) {
    sbStep("Loading all your data");
    const n = await loadAll();
    if (lean) {
      let packErr = null;
      try { const {data, error} = await client.rpc("studyboard_restore_archive"); if (error) throw error; if (Number(data) > 0) { toast("Welcome back! Your planner has been restored."); await loadAll(); } }
      catch(e) { if (!/does not exist|could not find|schema cache/i.test(String(e && e.message))) packErr = e; }
      if (packErr) throw packErr;
    }
  }
  const baseOf = (kind, id) => pbase.get(bkey(kind, id)) || {rev: revs.get(bkey(kind, id)) || 0, data: cache[kind] && cache[kind].has(id) ? cache[kind].get(id) : null, at: null};
  const mopts = (b, theirsAt) => ({mineAt: b.at, theirsAt, skew, now: Date.now()});
  const learnSkew = (serverNow, t0) => {
    const k = SyncMerge.skewFrom(serverNow, t0, Date.now());
    if (serverNow && Math.abs(k) < 30 * 864e5) { skew = k; try { localStorage.setItem(skewKey, String(k)); } catch(e) {} }
  };
  const settle = (kind, id, d, rev, e0) => {
    const k = bkey(kind, id), p = pbase.get(k);
    if (rev != null) revs.set(k, rev);
    if (cache[kind]) { cache[kind].set(id, d); persist(); }
    // an edit made while this save was on its way is based on what was just saved, not on whatever the server has when it is sent
    if (p && edits.get(k) !== e0) pbase.set(k, {rev: revs.get(k) || 0, data: d == null ? null : JSON.parse(JSON.stringify(d)), at: p.at}); else pbase.delete(k);
    foreign.delete(k); pbSave();
  };
  const plainUpsert = async (kind, id, d) => {
    const {data, error} = await client.from(T).upsert({user_id: userId, kind, id, data: d, updated_at: new Date().toISOString()}, {onConflict: "user_id,kind,id"}).select("updated_at");
    if (error) throw sbErr(error);
    return data && data[0] && data[0].updated_at;
  };
  const mine = () => { if (!sbUser || sbUser.id !== userId) throw sbErr({message: "Signed out of the account this change belongs to", status: 401}); };
  const upsert = async (kind, id, d, o) => {
    mine();
    o = o || {};
    const k = bkey(kind, id), e0 = edits.get(k);
    if (kind === "backup" || kind === "trash") { await plainUpsert(kind, id, d); if (cache[kind]) { cache[kind].set(id, d); persist(); } return; }
    let b = baseOf(kind, id), cur = d, info = null, theirs = null;
    const floor = x => kind === "meta" && x && b.data && b.data.schema > x.schema ? Object.assign({}, x, {schema: b.data.schema}) : x;
    cur = floor(cur);
    if (kind === "meta" && cur && cur.settings && b.data && b.data.settings) {
      const keepKeys = ["noteBoards", "noteBoardsGone", "photoThemes", "photoGone", "style", "comp", "owned"], fix = {};
      keepKeys.forEach(k => { if (cur.settings[k] === undefined && b.data.settings[k] !== undefined) fix[k] = b.data.settings[k]; });
      if (Object.keys(fix).length) cur = Object.assign({}, cur, {settings: Object.assign({}, cur.settings, fix)});
    }
    if (revCol && !upsert.noRpc) {
      for (let tries = 0; tries < 5; tries++) {
        const t0 = Date.now();
        const {data: res, error} = await client.rpc("studyboard_item_put", {p_kind: kind, p_id: id, p_data: cur, p_base_rev: b.rev || 0, p_device: sbDevice(), p_edited_at: b.at ? new Date(b.at + skew).toISOString() : null});
        if (error) {
          if (/PGRST202|42883|could not find the function/i.test((error.code || "") + " " + (error.message || ""))) { upsert.noRpc = true; break; }
          throw sbErr(error);
        }
        learnSkew(res.now, t0);
        if (res.ok) { settle(kind, id, cur, res.rev, e0); return info ? {merged: cur, merge: info} : (res.restored ? {merged: cur, merge: {state: "restored", title: SyncMerge.titleOf(kind, cur)}} : undefined); }
        theirs = res.data;
        const r = SyncMerge.mergeItem(kind, b.data, cur, theirs, mopts(b, res.edited_at || res.updated_at));
        info = info ? Object.assign(r, {conflict: r.conflict || info.conflict}) : r;
        cache[kind] && cache[kind].set(id, theirs);
        b = {rev: res.rev, data: theirs, at: b.at};
        cur = floor(cur);
        if (r.state === "theirs" || r.state === "same") { settle(kind, id, theirs, res.rev, e0); return {merged: theirs, merge: info}; }
        cur = r.merged;
      }
      if (!upsert.noRpc) throw sbErr({message: "Couldn't settle a sync conflict, will retry", status: 503});
    }
    if (o.outbox || foreign.has(k) || kind === "meta") {
      const {data: row, error} = await client.from(T).select("data,updated_at").eq("user_id", userId).eq("kind", kind).eq("id", id).maybeSingle();
      if (error) throw sbErr(error);
      if (row && !SyncMerge.eq(row.data, b.data)) {
        const r = SyncMerge.mergeItem(kind, b.data, cur, row.data, mopts(b, row.updated_at));
        if (r.state === "theirs" || r.state === "same") { settle(kind, id, row.data, null, e0); return {merged: row.data, merge: r}; }
        info = r; cur = r.merged;
      }
    }
    const at = await plainUpsert(kind, id, cur);
    if (at && lean) learnSkew(at, Date.now() - 200);
    settle(kind, id, cur, null, e0);
    return info && !SyncMerge.eq(cur, d) ? {merged: cur, merge: info} : undefined;
  };
  const remove = async (kind, id, o) => {
    mine();
    o = o || {};
    const k = bkey(kind, id);
    let b = baseOf(kind, id), keep = null;
    if (kind === "backup" || kind === "trash") {
      const {error} = await client.from(T).delete().eq("user_id", userId).eq("kind", kind).eq("id", id);
      if (error) throw sbErr(error);
      if (cache[kind]) { cache[kind].delete(id); persist(); }
      return;
    }
    if (revCol && !upsert.noRpc) {
      for (let tries = 0; tries < 3 && !keep; tries++) {
        const {data: res, error} = await client.rpc("studyboard_item_delete", {p_kind: kind, p_id: id, p_base_rev: b.rev || 0});
        if (error) { if (/PGRST202|42883|could not find the function/i.test((error.code || "") + " " + (error.message || ""))) { upsert.noRpc = true; break; } throw sbErr(error); }
        if (res.ok) { if (cache[kind]) { cache[kind].delete(id); persist(); } revs.delete(k); pbase.delete(k); foreign.delete(k); pbSave(); return; }
        if (SyncMerge.eq(res.data, b.data)) { b = {rev: res.rev, data: b.data, at: b.at}; continue; }
        keep = res;
      }
      if (keep) { cache[kind] && cache[kind].set(id, keep.data); revs.set(k, keep.rev); pbase.delete(k); foreign.delete(k); pbSave(); persist(); return {merged: keep.data, merge: {state: "restored", title: SyncMerge.titleOf(kind, keep.data), kept: true}}; }
      if (!upsert.noRpc) throw sbErr({message: "Couldn't settle a sync conflict, will retry", status: 503});
    }
    if (o.outbox || foreign.has(k)) {
      const {data: row, error} = await client.from(T).select("data,updated_at").eq("user_id", userId).eq("kind", kind).eq("id", id).maybeSingle();
      if (error) throw sbErr(error);
      if (row && !SyncMerge.eq(row.data, b.data)) { cache[kind] && cache[kind].set(id, row.data); pbase.delete(k); foreign.delete(k); pbSave(); return {merged: row.data, merge: {state: "restored", title: SyncMerge.titleOf(kind, row.data), kept: true}}; }
    }
    const {error} = await client.from(T).delete().eq("user_id", userId).eq("kind", kind).eq("id", id);
    if (error) throw sbErr(error);
    if (cache[kind]) { cache[kind].delete(id); persist(); }
    revs.delete(k); pbase.delete(k); foreign.delete(k); pbSave();
  };
  let chan = null, idleT = 0;
  const hooks = {};
  const subscribe = () => {
    if (chan) return;
    chan = client.channel("studioso-" + userId).on("postgres_changes", {event: "*", schema: "public", table: T, filter: "user_id=eq." + userId}, p => {
      const row = p.eventType === "DELETE" ? p.old : p.new;
      if (row && row.kind === "meta" && p.eventType !== "DELETE" && (!row.user_id || row.user_id === userId)) {
        cache.meta.set(row.id, row.data); if (row.rev != null) revs.set(bkey("meta", row.id), row.rev); noteForeign("meta", row.id, row.data);
        if (hooks.onMeta) hooks.onMeta(row.data);
        return;
      }
      if (!row || (row.user_id && row.user_id !== userId) || !listeners[row.kind]) return;
      if (p.eventType === "DELETE") cache[row.kind].delete(row.id); else { cache[row.kind].set(row.id, row.data); if (row.rev != null) revs.set(bkey(row.kind, row.id), row.rev); noteForeign(row.kind, row.id, row.data); if (row.updated_at) saved.cursor = later(saved.cursor, row.updated_at); }
      persist();
      emit(row.kind);
    }).subscribe();
  };
  const unsubscribe = () => { if (!chan) return; try { client.removeChannel(chan); } catch(e) {} chan = null; };
  if (sbBackend.cur) sbBackend.cur();
  const me = {dead: false};
  sbBackend.cur = () => { me.dead = true; unsubscribe(); };
  subscribe();
  let refreshing = null;
  const refresh = () => refreshing || (refreshing = (async () => {
    try {
      if (lean && saved.cursor && Date.now() - saved.fullAt < SB_FULL_EVERY && Date.now() - saved.at < SB_DELTA_MAX_AGE) (await pullDelta()).forEach(k => emit(k));
      else { await loadAll(); ["task", "course", "file", "note", "deck", "event", "trash"].forEach(emit); }
      if (hooks.onMeta && cache.meta.get("planner")) hooks.onMeta(cache.meta.get("planner"));
    } catch(e) {}
    refreshing = null;
  })());
  document.addEventListener("visibilitychange", () => {
    clearTimeout(idleT);
    if (document.hidden) idleT = setTimeout(() => { if (document.hidden) unsubscribe(); }, window.__SB_RT_IDLE || SB_REALTIME_IDLE);
    else if (!me.dead && !chan && sbUser && sbUser.id === userId) { subscribe(); refresh(); }
  });
  const doc = (kind, id) => ({id,
    get: async () => {
      const {data, error} = await client.from(T).select("data").eq("user_id", userId).eq("kind", kind).eq("id", id).maybeSingle();
      if (error) throw sbErr(error);
      return {exists: !!data, data: () => data ? data.data : undefined};
    },
    set: (d, o) => upsert(kind, id, d, o),
    delete: o => remove(kind, id, o)});
  const col = kind => ({doc: id => doc(kind, id), onSnapshot: cb => { listeners[kind].push(cb); setTimeout(() => cb(snapOf(kind)), 0); return () => {}; }});
  const backups = {doc: id => doc("backup", id),
    orderBy: () => ({limit: n => ({get: async () => {
      const {data, error} = await client.from(T).select("id,data").eq("user_id", userId).eq("kind", "backup").order("updated_at", {ascending: false}).limit(n);
      if (error) throw sbErr(error);
      return {docs: (data || []).map(r => ({id: r.id, data: () => r.data}))};
    }})})};
  const noteBase = (kind, id) => {
    if (kind === "backup" || kind === "trash") return;
    const k = bkey(kind, id), b = pbase.get(k);
    edits.set(k, (edits.get(k) || 0) + 1);
    if (b) b.at = Date.now(); else pbase.set(k, {rev: revs.get(k) || 0, data: cache[kind] && cache[kind].has(id) ? JSON.parse(JSON.stringify(cache[kind].get(id))) : null, at: Date.now()});
    pbSave();
  };
  const alive = () => !me.dead && !!sbUser && sbUser.id === userId;
  return {noteBase, hooks, alive, revCol: () => revCol, metaBase: () => { const x = pbase.get(bkey("meta", "planner")); return x && x.data ? x.data : null; }, base: doc("meta", "planner"), tasks: col("task"), courses: col("course"), files: col("file"), notes: col("note"), decks: col("deck"), events: col("event"), trash: col("trash"), backups, refresh, lean: () => lean, stop: unsubscribe};
}
const sbAssets = {
  upload: async (file, opts) => {
    const type = (opts && opts.type) || file.type || "application/octet-stream";
    const safe = (file.name || "file").replace(/[^\w.\-]+/g, "_").slice(-80);
    const path = `${sbUser.id}/${uid()}-${safe}`;
    const {error} = await sb.storage.from(SB_BUCKET).upload(path, file, {contentType: type, upsert: false});
    if (error) throw sbErr(error);
    return {id: path, url: "#", sizeBytes: file.size, contentType: type};
  },
  delete: async id => { const {error} = await sb.storage.from(SB_BUCKET).remove([id]); if (error) throw sbErr(error); FCACHE.del(id); return {deleted: true}; }
};
/* Files you open are kept on this device (IndexedDB), so opening one again costs no download */
const FCACHE = {DB: "studyboard-files", MAX: 300 * 1048576, BIG: 60 * 1048576, db: null, hits: 0, misses: 0,
  open(){ if (!this.db) this.db = new Promise((res, rej) => { try { const r = indexedDB.open(this.DB, 1); r.onupgradeneeded = () => r.result.createObjectStore("f"); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); } catch (e) { rej(e); } }); return this.db; },
  ok: path => typeof path === "string" && !!path && !/\/_text\//.test(path) && !/^local:/.test(path),
  async get(path){
    try { const db = await this.open(); const rec = await new Promise(res => { const t = db.transaction("f").objectStore("f").get(path); t.onsuccess = () => res(t.result || null); t.onerror = () => res(null); });
      if (!rec || !rec.blob) return null;
      try { const tx = db.transaction("f", "readwrite"); tx.objectStore("f").put(Object.assign({}, rec, {at: Date.now()}), path); } catch (e) {}
      return rec.blob; } catch (e) { return null; }
  },
  async put(path, blob){
    if (!blob || !blob.size || blob.size > this.BIG) return;
    try { const db = await this.open();
      const all = await new Promise(res => { const out = []; const c = db.transaction("f").objectStore("f").openCursor(); c.onsuccess = () => { const cur = c.result; if (!cur) return res(out); out.push({k: cur.key, size: (cur.value && cur.value.size) || 0, at: (cur.value && cur.value.at) || 0}); cur.continue(); }; c.onerror = () => res(out); });
      let total = all.reduce((n, x) => n + x.size, 0) + blob.size;
      const tx = db.transaction("f", "readwrite"), st = tx.objectStore("f");
      for (const x of all.sort((a, b) => a.at - b.at)) { if (total <= this.MAX) break; if (x.k !== path) { st.delete(x.k); total -= x.size; } }
      st.put({blob, size: blob.size, type: blob.type || "", at: Date.now()}, path);
    } catch (e) {}
  },
  async del(path){ try { const db = await this.open(); db.transaction("f", "readwrite").objectStore("f").delete(path); } catch (e) {} }
};
// Download a stored file, from this device when it has a copy
async function sbDownload(path, client){
  if (FCACHE.ok(path)) { const hit = await FCACHE.get(path); if (hit) { FCACHE.hits++; return hit; } }
  const {data, error} = await (client || sb).storage.from(SB_BUCKET).download(path);
  if (error || !data) throw error || new Error("download failed");
  FCACHE.misses++;
  if (FCACHE.ok(path)) FCACHE.put(path, data);
  return data;
}
async function sbOpenAsset(path){
  const w = window.open("", "_blank");
  try {
    const data = await sbDownload(path);
    const safeBlob = /html|svg|xml|javascript|ecmascript/i.test(data.type || "") || /\.(html?|xhtml|svg|xml|js|mjs)$/i.test(path) ? new Blob([data], {type: "application/octet-stream"}) : data;
    const url = URL.createObjectURL(safeBlob);
    setTimeout(() => URL.revokeObjectURL(url), 120000);
    if (w) w.location.href = url; else window.location.href = url;
  } catch(e) { if (w) w.close(); toast("Couldn't open the file. Check your connection and try again."); }
}
// Stored files are private, so each one is downloaded with your sign-in when you open it
document.addEventListener("click", e => {
  const a = e.target.closest && e.target.closest("a[data-asset]");
  if (!a || inPreview()) return;
  if (DESK) { e.preventDefault(); e.stopPropagation(); deskOpenAsset(a.dataset.asset); return; }
  if (/^local:/.test(a.dataset.asset)) { e.preventDefault(); e.stopPropagation(); toast("This file is still on the computer it was added from. It uploads the next time Studyboard opens there."); return; }
  if (!sb) return;
  e.preventDefault(); e.stopPropagation();
  sbOpenAsset(a.dataset.asset);
}, true);
function assetHref(id){ return inPreview() ? "/_blob/" + id : "#"; }
function assetAttr(id){ return id && !inPreview() ? `data-asset="${esc(id)}"` : ""; }
setInterval(() => {
  if (inPreview()) return;
  if (sbConfig() && !sb && !sbLocalOnly() && navigator.onLine !== false) initSupabase();
  else if (sb && sbUser && !cloud.on) startSupabaseSync();
  else if (cloud.on) { flushOutbox(); if (DESK) deskPromote(); }
}, 45000);
window.addEventListener("online", () => { if (inPreview()) return; if (!sb && sbConfig() && !sbLocalOnly()) initSupabase(); else if (sb && sbUser && !cloud.on) startSupabaseSync(); else flushOutbox(); });
let hiddenAt = 0;
document.addEventListener("visibilitychange", () => {
  if (document.hidden) { hiddenAt = Date.now(); return; }
  if (cloud.on && cloud.refresh && Date.now() - hiddenAt > 30000) cloud.refresh();
});

// Only for copies built without a Studyboard server
function sbSetupSheet(){
  const cur = sbCustom() || !SB_HOSTED ? (sbConfig() || {url: "", key: ""}) : {url: "", key: ""};
  openSheet(`<form class="sheet sb-acct">${head(SB_HOSTED ? "Custom Server" : "Welcome to Studyboard")}
    <div class="sheet-body">
      <p style="margin:0">${SB_HOSTED ? "You're using your own server instead of Studyboard's. Change it here, or switch back to a Studyboard account." : "Save your tasks, notes and files online so they sync across your devices and stay safe if this browser is cleared. Enter your server details from the setup guide, or keep everything on this device."}</p>
      ${REQ_NOTE}<label class="f"><span class="lh">Server Address ${REQ}</span><input type="url" name="url" required value="${esc(cur.url)}" placeholder="https://…" autocomplete="off"></label>
      <label class="f"><span class="lh">Public Key ${REQ} <span class="hint">The publishable key from the setup guide</span></span><input type="text" name="key" required value="${esc(cur.key)}" placeholder="sb_publishable_…" autocomplete="off" spellcheck="false"></label>
      <p class="mini" style="margin:0">Only use the public (publishable) key. Never paste a secret key into an app.</p>
    </div>
    <div class="sheet-foot">${SB_HOSTED ? `<button type="button" class="btn" id="sbBack">Use a Studyboard Account</button>` : `<button type="button" class="btn" id="sbLocal">Use Without an Account</button>`}<span class="spacer"></span><button type="button" class="btn primary" data-submit>Connect</button></div>
  </form>`, fd => {
    let url = String(fd.get("url") || "").trim().replace(/\/+$/, ""), key = String(fd.get("key") || "").trim();
    if (!/^https:\/\/[^\s/]+$/i.test(url)) { toast("Enter the server address, starting with https://"); return false; }
    if (/^sb_secret_/i.test(key)) { toast("That's a secret key. Use the publishable key instead."); return false; }
    if (/^eyJ/.test(key)) { try { const p = JSON.parse(atob(key.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))); if (p.role === "service_role") { toast("That's a secret key. Use the publishable key instead."); return false; } } catch(e) {} }
    try { localStorage.setItem(SB_CFG, JSON.stringify({url, key})); } catch(e) {}
    sb = null; sbUser = null;
    setTimeout(() => initSupabase(true), 50);
  });
  const lo = $("#sbLocal"); if (lo) lo.addEventListener("click", () => { try { localStorage.setItem(SB_CFG, JSON.stringify("local")); } catch(e) {} dlg.close(); toast("Saving on this device only. You can change this in Settings."); syncLabel(); });
  const bk = $("#sbBack"); if (bk) bk.addEventListener("click", async () => {
    try { if (cloud.on) await Promise.race([flushOutbox(), new Promise(r => setTimeout(r, 6000))]); } catch(e) {}
    const n = Object.keys(outboxGet()).length;
    confirmSheet(n ? "Not everything is saved yet" : "Switch to a Studyboard account?", n ? `${n} recent change${n === 1 ? "" : "s"} haven't reached your server yet and will be lost if you switch now. Stay online for a minute and try again, or use Export in Settings first.` : "You'll be signed out of your own server on this device. Your data there isn't touched.", n ? "Switch Anyway" : "Switch", async () => {
    try { if (sb) await sb.auth.signOut(); } catch(e) {}
    try { localStorage.removeItem(SB_CFG); } catch(e) {}
    aiWipeLocal(true);
    await wipeDeviceData();
    location.reload();
  });
  });
}
// Sign in, create an account, confirm your email with a code, and reset a forgotten password
const SB_RESEND = {}, SB_RESEND_MS = 30000;
function sbSignInSheet(mode, email, note){
  if (!sb) { sbAsk(); return; }
  const first = !localStorage.getItem("studioso:welcomed");
  mode = mode === "hello" && !first ? "signin" : mode || "signin"; email = email || (dlg.open && dlg.querySelector(".sb-acct input[name=email]") ? dlg.querySelector(".sb-acct input[name=email]").value.trim() : "");
  const back = location.origin + location.pathname, redirect = DESK || !/^https?:/.test(location.protocol) ? {} : null;
  const T = {hello: "Welcome to Studyboard", signin: first ? "Welcome to Studyboard" : "Sign In to Studyboard", signup: "Create Your Studyboard Account", confirm: "Check Your Email", forgot: "Reset Your Password", reset: "Set a New Password"}[mode];
  const emailIn = (ro) => `<label class="f"><span class="lh">Email ${REQ}</span><input type="email" name="email" required autocomplete="email" value="${esc(email)}" ${ro ? "readonly" : ""} ${email && !ro ? "" : "autofocus"}></label>`;
  const codeIn = `<label class="f"><span class="lh">Code ${REQ} <span class="hint">From the email</span></span><input type="text" name="code" required inputmode="numeric" autocomplete="one-time-code" maxlength="10" placeholder="123456" class="sb-code" autofocus></label>`;
  const pwIn = (lbl, ac) => `<label class="f"><span class="lh">${lbl} ${REQ}</span><input type="password" name="password" required minlength="8" autocomplete="${ac}" ${email && mode !== "reset" ? "autofocus" : ""}></label>`;
  const body = {
    hello: sbWelcomeHtml(),
    signin: `${first ? `<p style="margin:0">Sign in to keep your tasks, notes and files safe online and in sync on all your devices.</p>` : ""}${emailIn()}${pwIn("Password", "current-password")}`,
    signup: `<p style="margin:0">Free, and it keeps your planner in sync on your phone, laptop and the web.</p><label class="f"><span class="lh">Name <span class="hint">Optional. Your study companion uses it to say hi</span></span><input type="text" name="name" maxlength="40" autocomplete="given-name"></label>${window.SBUNAME ? SBUNAME.bdayField(true) + `<div class="u13" id="u13" hidden><p class="mini" style="margin:0"><b>Under 13?</b> A parent or guardian makes the account with their own email and confirms it. Publishing and sharing with a link stay off until you're 13.</p><label class="mi-check"><input type="checkbox" name="parentok" id="u13ok"> I'm the parent or guardian, and I agree to the Terms and Privacy Policy for my child</label></div>` : ""}${emailIn()}${sbPwHtml("Password", "new-password", {autofocus: !!email})}`,
    confirm: `<p style="margin:0">If <b>${esc(email)}</b> can be used for a new account, we sent a code to it. Type it here to finish, or open the link in the email.</p><p class="mini" style="margin:0">Confirm your email to start using your account. Already have one? Use Back to Sign In.</p>${codeIn}`,
    forgot: `<p style="margin:0">Enter your email and, if an account uses it, we'll send you a code to set a new password.</p>${emailIn()}`,
    reset: `<p style="margin:0">If an account uses <b>${esc(email)}</b>, we sent it a code. Enter the code with your new password.</p>${codeIn}${sbPwHtml("New Password", "new-password")}`
  }[mode];
  const links = {
    hello: "",
    signin: `<button type="button" class="link-btn" data-sbm="forgot">Forgot Password?</button> · <button type="button" class="link-btn" id="sbLater">${first ? "Use Without an Account" : "Not Now"}</button>`,
    signup: `<button type="button" class="link-btn" data-sbm="signin">I Already Have an Account</button> · <button type="button" class="link-btn" id="sbLater">${first ? "Use Without an Account" : "Not Now"}</button>`,
    confirm: `<button type="button" class="link-btn" id="sbResend">Send a New Code</button> · <button type="button" class="link-btn" data-sbm="signin">Back to Sign In</button>`,
    forgot: `<button type="button" class="link-btn" data-sbm="signin">Back to Sign In</button>`,
    reset: `<button type="button" class="link-btn" id="sbResend">Send a New Code</button> · <button type="button" class="link-btn" data-sbm="signin">Back to Sign In</button>`
  }[mode];
  const foot = {
    hello: "",
    signin: `<button type="button" class="btn" data-sbm="signup">Create Account</button><span class="spacer"></span><button type="button" class="btn primary" data-submit>Sign In</button>`,
    signup: `<span class="spacer"></span><button type="button" class="btn primary" data-submit>Create Account</button>`,
    confirm: `<span class="spacer"></span><button type="button" class="btn primary" data-submit>Confirm</button>`,
    forgot: `<span class="spacer"></span><button type="button" class="btn primary" data-submit>Send Code</button>`,
    reset: `<span class="spacer"></span><button type="button" class="btn primary" data-submit>Save Password</button>`
  }[mode];
  const custom = (sbCustom() ? `<p class="mini" style="margin:0"><button type="button" class="link-btn" id="sbServer">Custom Server</button></p>` : "")
    + ((mode === "signin" || mode === "signup" || mode === "hello") && window.SBLEGAL ? SBLEGAL.line() : "");
  let busy = false;
  const say = t => { const m = $("#sbMsg"); if (m) m.textContent = t; };
  const done = t => { try { localStorage.setItem("studioso:welcomed", "1"); } catch(e) {} if (dlg.open) dlg.close(); toast(t); };
  const hello = mode === "hello";
  openSheet(`<form class="sheet sb-acct" data-mode="${mode}"${first ? " data-first" : ""}>${head(T)}
    <div class="sheet-body">
      ${hello ? "" : REQ_NOTE}${body}
      ${hello ? "" : `<p class="status-msg" id="sbMsg" style="margin:0" aria-live="polite">${esc(note || "")}</p>
      <p class="mini" style="margin:0">${links}</p>`}${custom}
    </div>
    ${hello ? "" : `<div class="sheet-foot">${foot}</div>`}
  </form>`, fd => {
    if (busy || hello) return false;
    const em = String(fd.get("email") || email || "").trim(), pw = String(fd.get("password") || ""), code = String(fd.get("code") || "").replace(/\s+/g, "");
    const go = async () => {
      busy = true;
      try {
        if (mode === "signin") {
          say("Signing in…");
          const {error} = await sb.auth.signInWithPassword({email: em, password: pw});
          if (error && /confirm/i.test(error.message)) { sbLinkAsked(); await sb.auth.resend({type: "signup", email: em}).catch(() => {}); busy = false; sbSignInSheet("confirm", em, "Your email isn't confirmed yet, so we sent a new code."); return; }
          if (error) throw error;
          done("Signed in");
        } else if (mode === "signup") {
          if (pw.length < 8) { say("Use a password of at least 8 characters."); return; }
          if (!sbStrength(pw).ok) { say(SB_WEAK); return; }
          const askAge = !!(window.SBUNAME && dlg.querySelector(".sb-acct .bday"));
          const bday = askAge ? SBUNAME.bdayOf(fd) : "";
          if (askAge) {
            if (!bday) { say("Enter your birthday."); return; }
            if (SBUNAME.yearsOld(bday) < 13 && !fd.get("parentok")) { say("A parent or guardian makes the account for students under 13. Tick the box to agree."); return; }
          }
          say("Creating your account…");
          const nm = String(fd.get("name") || "").replace(/\s+/g, " ").trim().slice(0, 40);
          if (nm) try { localStorage.setItem("studyboard:comp:uname", nm); } catch(e) {}
          const meta = Object.assign(nm ? {first_name: nm.split(" ")[0], full_name: nm} : {}, bday ? {birth_date: bday} : {}, bday && SBUNAME.yearsOld(bday) < 13 ? {parent_consent: new Date().toISOString()} : {});
          sbLinkAsked(); const {data, error} = await sb.auth.signUp({email: em, password: pw, options: Object.assign(redirect ? {} : {emailRedirectTo: back}, Object.keys(meta).length ? {data: meta} : {})});
          if (error) throw error;
          if (data && data.session) { done("Welcome to Studyboard!"); return; }
          busy = false; sbSignInSheet("confirm", em); return;
        } else if (mode === "confirm") {
          if (!/^\d{6,10}$/.test(code)) { say("Enter the code from the email. It's all numbers."); return; }
          say("Checking…");
          const {error} = await sb.auth.verifyOtp({email: em, token: code, type: "email"});
          if (error) { const r = await sb.auth.verifyOtp({email: em, token: code, type: "signup"}); if (r.error) throw r.error; }
          done("Your email is confirmed. Welcome to Studyboard!");
        } else if (mode === "forgot") {
          say("Sending…");
          sbLinkAsked(); const {error} = await sb.auth.resetPasswordForEmail(em, redirect ? {} : {redirectTo: back});
          if (error) throw error;
          busy = false; sbSignInSheet("reset", em); return;
        } else if (mode === "reset") {
          if (!/^\d{6,10}$/.test(code)) { say("Enter the code from the email. It's all numbers."); return; }
          if (pw.length < 8) { say("Use a password of at least 8 characters."); return; }
          if (!sbStrength(pw).ok) { say(SB_WEAK); return; }
          say("Saving…");
          const v = await sb.auth.verifyOtp({email: em, token: code, type: "recovery"});
          if (v.error) throw v.error;
          const {error} = await sb.auth.updateUser({password: pw});
          if (error) throw error;
          done("Password updated. You're signed in.");
        }
      } catch (e) { say(sbWords(e)); }
      finally { busy = false; }
    };
    go();
    return false;
  });
  dlg.querySelectorAll("[data-sbm]").forEach(b => b.addEventListener("click", () => sbSignInSheet(b.dataset.sbm)));
  sbPwWire(dlg);
  if (mode === "signup" && window.SBUNAME && dlg.querySelector(".sb-acct .bday")) {
    const form = dlg.querySelector("form.sb-acct"), em = form && form.querySelector("input[name=email]"), lab = em && em.closest("label") && em.closest("label").querySelector(".lh");
    const upd = () => { const iso = SBUNAME.bdayOf(new FormData(form)), young = !!iso && SBUNAME.yearsOld(iso) < 13; $("#u13").hidden = !young; $("#u13ok").required = young; if (lab) lab.firstChild.textContent = young ? "Parent or Guardian's Email " : "Email "; };
    form.querySelectorAll(".bday input").forEach(x => { x.addEventListener("change", upd); x.addEventListener("input", upd); });
  }
  const later = $("#sbLater");
  if (later) later.addEventListener("click", () => { dlg.close(); sbUseLater(first); });
  const start = $("#sbStart");
  if (start) start.addEventListener("click", () => { dlg.close(); sbUseLater(true); });
  const rs = $("#sbResend");
  if (rs) {
    const ckey = mode + ":" + String(email).toLowerCase(), label = rs.textContent;
    const tick = () => {
      const left = Math.ceil(((SB_RESEND[ckey] || 0) - Date.now()) / 1000);
      if (!rs.isConnected) return;
      if (left > 0) { rs.disabled = true; rs.textContent = `Send again in ${left}s`; setTimeout(tick, 1000); }
      else { rs.disabled = false; rs.textContent = label; }
    };
    tick();
    rs.addEventListener("click", async () => {
      if ((SB_RESEND[ckey] || 0) > Date.now()) return;
      SB_RESEND[ckey] = Date.now() + SB_RESEND_MS; tick(); say("Sending a new code…");
      sbLinkAsked(); const {error} = mode === "reset" ? await sb.auth.resetPasswordForEmail(email, redirect ? {} : {redirectTo: back}) : await sb.auth.resend({type: "signup", email});
      say(error ? sbWords(error) : "Sent. Check your email (and your junk folder).");
    });
  }
  const sv = $("#sbServer"); if (sv) sv.addEventListener("click", sbSetupSheet);
}
// The first thing a new student sees: Mochi says hi, then Get Started (on this device) or sign in
function sbWelcomeHtml(){
  let mochi = ""; try { mochi = window.SBCOMP ? SBCOMP.rigSvg("plain-mochi", {eyes: "happy", mouth: "smile"}) : ""; } catch(e) {}
  const ic = d => `<i aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</svg></i>`;
  return `<div class="sb-welc">
    <div class="sb-welc-m" aria-hidden="true">${mochi}</div>
    <h3>Hi! I'm Mochi.<br>Let's plan your semester.</h3>
    <p>Studyboard turns your syllabi into a calm plan for every day.</p>
    <ul>
      <li>${ic('<path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5zM13 4h5.5A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5H13z"/>')}Add courses and deadlines in minutes</li>
      <li>${ic('<circle cx="12" cy="12" r="8.5"/><path d="M8.5 12.2l2.4 2.4 4.6-5"/>')}See exactly what to do next, today</li>
      <li>${ic('<path d="M12 20v-7"/><path d="M12 13c0-3.5-2.5-6-6.5-6 0 3.6 2.6 6 6.5 6zM12 11c0-3 2.2-5.5 6.5-5.5 0 3.2-2.4 5.5-6.5 5.5z"/>')}Works offline, no account needed</li>
    </ul>
    <button type="button" class="btn primary sb-welc-go" id="sbStart">Get Started</button>
    <button type="button" class="link-btn sb-welc-alt" data-sbm="signin">I Already Have an Account</button>
  </div>`;
}
// "Use Without an Account", "Not Now", or closing the first sign-in sheet
function sbUseLater(first){
  try { localStorage.setItem("studioso:welcomed", "1"); if (first) { localStorage.setItem(SB_CFG, JSON.stringify("local")); SBGUEST.chose(); } } catch(e) {}
  syncLabel();
  toast(first ? "Saving on this device only. Sign in any time from Settings." : "Working on this device. Sign in from Settings to sync.");
}
document.getElementById("dlg").addEventListener("close", () => {
  if (sbUser || !dlg.querySelector('.sb-acct[data-first]:is([data-mode="hello"], [data-mode="signin"], [data-mode="signup"])')) return;
  try { if (localStorage.getItem("studioso:welcomed")) return; } catch(e) { return; }
  sbUseLater(true);
});
// Opened from the link in a password email (recovery session)
function sbNewPasswordSheet(){
  openSheet(`<form class="sheet sb-acct" data-mode="newpass">${head("Set a New Password")}
    <div class="sheet-body">${REQ_NOTE}
      ${sbPwHtml("New Password", "new-password", {autofocus: true})}
      <label class="f"><span class="lh">Confirm New Password ${REQ}</span><input type="password" name="confirm" required minlength="8" autocomplete="new-password"></label>
      <p class="status-msg" id="sbMsg" style="margin:0" aria-live="polite"></p></div>
    <div class="sheet-foot"><span class="spacer"></span><button type="button" class="btn primary" data-submit>Save Password</button></div>
  </form>`, fd => {
    const password = String(fd.get("password") || ""), say = t => { const m = $("#sbMsg"); if (m) m.textContent = t; };
    if (password.length < 8) { say("Use at least 8 characters."); return false; }
    if (!sbStrength(password).ok) { say(SB_WEAK); return false; }
    if (password !== String(fd.get("confirm") || "")) { say("The two passwords don't match."); return false; }
    say("Saving…");
    sb.auth.updateUser({password}).then(({error}) => {
      if (error) say(sbWords(error));
      else { if (dlg.open) dlg.close(); toast("Password updated. You're signed in."); }
    }, e => say(sbWords(e)));
    return false;
  });
  sbPwWire(dlg);
}
// A link in an email failed (expired or already used)
function sbLinkErrorSheet(){
  openSheet(`<div class="sheet sb-acct">${head("That Link Didn't Work")}
    <div class="sheet-body"><p style="margin:0" role="status">This link has expired or was already used. Links in Studyboard emails work once, for 1 hour.</p>
      <p class="mini" style="margin:0">Ask for a new one:</p>
      <div class="menu-list"><button type="button" data-sbm="forgot"><span>Send a New Password Reset</span></button><button type="button" data-sbm="signup"><span>Send a New Confirmation Code (New Account)</span></button><button type="button" data-sbm="signin"><span>Back to Sign In</span></button></div></div>
    <div class="sheet-foot"><span class="spacer"></span><button type="button" class="btn" data-act="close">Close</button></div></div>`);
  dlg.querySelectorAll("[data-sbm]").forEach(b => b.addEventListener("click", () => sbSignInSheet(b.dataset.sbm)));
}
// Signing out removes this account's copy from the device
const WIPE_KEYS = () => [LS2, LS1, LSB, OUTBOX, LS_TRASH, "studyboard:bugq", "studyboard:comp:uname", "studyboard:comp:helloDay"];
async function wipeDeviceData(){
  deviceWiping = true;
  state = {courses:{}, tasks:{}, files:{}, notes:{}, decks:{}, events:{}, trash:{}, settings:{capacity:15}, updated:0};
  try { WIPE_KEYS().forEach(k => localStorage.removeItem(k)); } catch(e) {}
  try { Object.keys(localStorage).filter(k => k.startsWith("studyboard:ext:")).forEach(k => localStorage.removeItem(k)); } catch(e) {}
  try { if (SBC.db) { const d = await SBC.db; d.close(); SBC.db = null; } } catch(e) {}
  try { if (window.caches) for (const k of await caches.keys()) { const c = await caches.open(k); for (const r of await c.keys()) if (/\/widgets\/today-data\.json/.test(r.url)) await c.delete(r); } } catch(e) {}
  try { if (lmsBridge()) await Promise.race([Promise.all(["brightspace", "canvas", "blackboard"].map(id => Promise.resolve(lmsBridge().signOut(id)).catch(() => {}))), new Promise(r => setTimeout(r, 1500))]); } catch(e) {}
  try { localStorage.removeItem("studyboard:cvmail"); await Promise.race([DEVSECRET.wipe(["canvas-mail"]), new Promise(r => setTimeout(r, 1500))]); window.dispatchEvent(new Event("sb:secrets-wiped")); } catch(e) {}
  try {
    const names = ["studyboard-sync", "studyboard-search", "studyboard-photos", "studioso-fs", "studyboard-files"];
    try { if (FCACHE.db) { (await FCACHE.db).close(); FCACHE.db = null; } } catch (e) {}
    await Promise.race([Promise.all(names.map(n => new Promise(ok => { try { const r = indexedDB.deleteDatabase(n); r.onsuccess = r.onerror = r.onblocked = () => ok(); } catch(e) { ok(); } }))), new Promise(r => setTimeout(r, 1200))]);
  } catch(e) {}
  try { WIPE_KEYS().forEach(k => localStorage.removeItem(k)); localStorage.setItem(OWNER, NO_OWNER); } catch(e) {}
}
async function sbSignOut(){
  const waiting = () => { let n = Object.keys(outboxGet()).length; try { (state.settings.photoThemes || []).forEach(r => { if (r && !r.asset) n++; }); } catch(e) {} return n; };
  try { await Promise.race([flushOutbox(), new Promise(r => setTimeout(r, 6000))]); } catch(e) {}
  const n = waiting();
  const note = n ? ` ${n} recent change${n === 1 ? "" : "s"} (or a photo) haven't reached your account yet and will be lost if you sign out now. Stay online for a minute and try again, or use Export in Settings first.` : "";
  confirmSheet(n ? "Not everything is saved yet" : "Sign out?", (n ? note.trim() : "Your data stays safe in your Studyboard account. This device's copy is removed, so sign back in to see it here again."), n ? "Sign Out Anyway" : "Sign Out", async () => {
    try { window.dispatchEvent(new Event("sb:signing-out")); } catch(e) {}
    try { await sb.auth.signOut(); } catch(e) {}
    aiWipeLocal(true);
    await wipeDeviceData();
    location.reload();
  });
}

