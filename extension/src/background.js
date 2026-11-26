// Studyboard School Sync
"use strict";

const SBX = globalThis.__studyboardExt;
const NAMES = { canvas: "Canvas", brightspace: "Brightspace", blackboard: "Blackboard", moodle: "Moodle" };
const DEF = { every: 60, on: true };
const EVERY = [15, 30, 60, 180, 360, 720];
// Kind to the school site
const GAP = 5 * 60000, OPEN_FRESH = 10 * 60000, APP_GAP = 2 * 60000, BACKOFF_MAX = 6 * 3600000;
function mayRun(why, st) {
  if (why === "button" || why === "added") return true;
  const now = Date.now(), last = st.at || 0;
  if (why === "app") return now - last >= APP_GAP;
  if (now - last < GAP) return false;
  if (why === "open") return !(st.state === "ok" && now - (st.lastOk || 0) < OPEN_FRESH);
  if (why === "timer" && st.fails > 0) return now - last >= Math.min(BACKOFF_MAX, 15 * 60000 * Math.pow(2, st.fails - 1));
  return true;
}
const RUN_MS = 170000;
const busy = {};

const get = keys => chrome.storage.local.get(keys);
const set = obj => chrome.storage.local.set(obj);
async function load() {
  const s = await get(["schools", "settings", "status", "pending"]);
  return { schools: s.schools || {}, settings: Object.assign({}, DEF, s.settings || {}), status: s.status || {}, pending: s.pending || null };
}
const granted = origin => chrome.permissions.contains({ origins: [origin + "/*"] }).catch(() => false);
// p, or an error after ms (the timer is cleared as soon as p settles)
function within(p, ms) {
  let t; const late = new Promise((_, rej) => { t = setTimeout(() => rej(new Error("timeout")), ms); });
  return Promise.race([p, late]).finally(() => clearTimeout(t));
}
const errText = e => String((e && e.message) || e || "error").slice(0, 160);

// What the harvest is asked for
// Remote switches (stored by relay.js): Blackboard's internal endpoints, and where else marks may be read from besides the Grades page
let FLAGS = {};
chrome.storage.local.get("flags").then(r => { FLAGS = (r && r.flags) || {}; }).catch(() => {});
chrome.storage.onChanged.addListener((ch, area) => { if (area === "local" && ch.flags) FLAGS = ch.flags.newValue || {}; });
const OPTS = id => ({ pastDays: 60, aheadDays: 240, grades: true, news: true, only: null, skip: [], mail: id === "canvas", internal: FLAGS.bbInternal !== false, marks: FLAGS.marks && typeof FLAGS.marks === "object" ? FLAGS.marks : {}, budget: 120000 });

// fetch for the background read
// Reads only (GET); the one exception is Moodle's AJAX service, which takes its read requests as POST
function schoolFetch(origin) {
  return (u, o) => {
    let url;
    try { url = new URL(String(u), origin); } catch (e) { return Promise.reject(new Error("bad-url")); }
    if (url.origin !== origin) return Promise.reject(new Error("off-site"));
    const post = !!o && String(o.method || "").toUpperCase() === "POST" && /\/lib\/ajax\/service\.php$/.test(url.pathname);
    const opts = Object.assign({}, o || {}, { credentials: "include", method: post ? "POST" : "GET" });
    if (!post) delete opts.body;
    return fetch(url.href, opts);
  };
}

// Reading in the background
async function runBackground(id, origin) {
  return within(SBX.make(schoolFetch(origin), { origin })[id](OPTS(id)), RUN_MS);
}
// Reading inside an open tab of the school site
async function runInTab(tabId, id) {
  let world = "MAIN";
  try { await chrome.scripting.executeScript({ target: { tabId }, world, files: ["harvest.js"] }); }
  catch (e) { world = "ISOLATED"; await chrome.scripting.executeScript({ target: { tabId }, world, files: ["harvest.js"] }); }
  const res = await within(chrome.scripting.executeScript({
    target: { tabId }, world, args: [id, OPTS(id)],
    func: (p, o) => window.__studyboardExt.make(fetch, location)[p](o)
  }), RUN_MS);
  return res && res[0] ? res[0].result : null;
}
async function openTabOf(origin) {
  try { const tabs = await chrome.tabs.query({ url: origin + "/*" }); return tabs.find(t => t.id != null && !t.discarded && t.status === "complete") || null; } catch (e) { return null; }
}

const count = h => {
  const cs = h.courses || [];
  const items = cs.reduce((a, c) => a + (c.items || []).length + (c.folders || []).length + (c.quizzes || []).length + (c.discussions || []).length, 0) + (h.items || []).length;
  const grades = cs.reduce((a, c) => a + (c.grades || []).filter(g => g && g.num != null).length, 0);
  return { courses: cs.length, items, grades };
};

async function setStatus(id, patch) {
  const s = await get("status"), all = s.status || {};
  all[id] = Object.assign({}, all[id] || {}, patch);
  await set({ status: all });
  await badge();
}
async function badge() {
  const { schools, status } = await load();
  const bad = Object.keys(schools).some(id => status[id] && ["login", "error", "permission"].includes(status[id].state));
  try {
    await chrome.action.setBadgeText({ text: bad ? "!" : "" });
    if (bad) await chrome.action.setBadgeBackgroundColor({ color: "#C2410C" });
  } catch (e) {}
}

// One school site, start to finish
function syncOne(id, why) {
  if (busy[id]) return busy[id];
  busy[id] = (async () => {
    const { schools, status } = await load(), s = schools[id];
    if (!s) return { error: "not-connected" };
    if (!mayRun(why, status[id] || {})) return { skipped: true };
    if (!(await granted(s.origin))) { await setStatus(id, { state: "permission", at: Date.now() }); return { error: "permission" }; }
    const prev = status[id] || {};
    await setStatus(id, { state: "syncing", since: Date.now() });
    const awake = setInterval(() => { chrome.runtime.getPlatformInfo().catch(() => {}); }, 20000);
    let h = null, err = "";
    try {
      try { h = await runBackground(id, s.origin); } catch (e) { err = errText(e); }
      if (!h || h.needLogin || !h.ok) {
        const tab = await openTabOf(s.origin);
        if (tab) { try { h = await runInTab(tab.id, id); } catch (e) { err = errText(e); } }
      }
    } finally { clearInterval(awake); }
    const c = h ? SBX.clean(h, s.origin) : { error: err || "no-result" };
    if (c.ok) {
      const at = Date.now();
      await set({ ["result:" + id]: { v: 1, id, origin: s.origin, at, h: c } });
      await setStatus(id, Object.assign({ state: "ok", at, lastOk: at, error: "", fails: 0, why: why || "", name: (c.me && c.me.name) || "" }, count(c)));
      handOrigin(s.origin).catch(() => {});
      return { ok: true };
    }
    await setStatus(id, { state: c.needLogin ? "login" : "error", at: Date.now(), error: c.needLogin ? "" : String(c.error || err || "error").slice(0, 160), lastOk: prev.lastOk || 0, fails: Math.min(20, (prev.fails || 0) + 1) });
    return { error: c.needLogin ? "login" : c.error || "error" };
  })().catch(async e => { await setStatus(id, { state: "error", at: Date.now(), error: errText(e) }); return { error: errText(e) }; })
    .finally(() => { busy[id] = null; });
  return busy[id];
}
async function syncAll(why) {
  const { schools, settings } = await load();
  if (!settings.on && why === "timer") return [];
  return Promise.all(Object.keys(schools).map(id => syncOne(id, why)));
}

// Which platform a site is
async function detect(origin) {
  const f = schoolFetch(origin), json = r => /json/i.test(r.headers.get("content-type") || "");
  const probes = [["canvas", "/api/v1/users/self"], ["brightspace", "/d2l/api/versions/"], ["blackboard", "/learn/api/public/v1/system/version"]];
  for (const [id, p] of probes) {
    try { const r = await within(f(p, { headers: { Accept: "application/json" } }), 15000); if ((r.ok || r.status === 401 || r.status === 403) && json(r)) return id; } catch (e) {}
  }
  // Moodle: its sign-in page loads Moodle's own scripts
  try { const r = await within(f("/login/index.php", { headers: { Accept: "text/html" } }), 15000); if (r.ok && /M\.cfg\s*=|\/lib\/javascript\.php|\/theme\/yui_combo\.php/.test(await r.text())) return "moodle"; } catch (e) {}
  return null;
}

// One site per platform: connecting a second school on the same platform replaces the first only once the person has said so (replace)
async function addSchool(origin0, platform, replace) {
  const origin = SBX.originOf(origin0);
  if (!origin) return { error: "bad-address" };
  if (!(await granted(origin))) return { error: "permission" };
  const id = NAMES[platform] ? platform : await detect(origin);
  if (!id) return { error: "unknown-platform" };
  const st = await load();
  const old = st.schools[id];
  if (old && old.origin !== origin && !replace) return { error: "exists", id, origin, old: old.origin };
  st.schools[id] = { id, origin, added: Date.now() };
  await set({ schools: st.schools, pending: null });
  if (old && old.origin !== origin) {
    await chrome.storage.local.remove("result:" + id);
    if (!Object.values(st.schools).some(x => x.origin === old.origin)) chrome.permissions.remove({ origins: [old.origin + "/*"] }).catch(() => {});
  }
  syncOne(id, "added");
  handOrigin(origin).catch(() => {});
  return { ok: true, id };
}
// The person signed out of Studyboard
async function forgetReads() {
  const all = await chrome.storage.local.get(null);
  const keys = Object.keys(all).filter(k => k.startsWith("result:"));
  if (keys.length) await chrome.storage.local.remove(keys);
  return { ok: true };
}
async function removeSchool(id) {
  const st = await load(), s = st.schools[id];
  if (!s) return { ok: true };
  delete st.schools[id]; delete st.status[id];
  await set({ schools: st.schools, status: st.status });
  await chrome.storage.local.remove("result:" + id);
  if (!Object.values(st.schools).some(x => x.origin === s.origin)) { try { await within(chrome.permissions.remove({ origins: [s.origin + "/*"] }), 3000); } catch (e) {} }
  await badge();
  return { ok: true };
}

async function schedule() {
  const { settings } = await load();
  const every = EVERY.includes(Number(settings.every)) ? Number(settings.every) : DEF.every;
  await chrome.alarms.clear("sync");
  if (settings.on) await chrome.alarms.create("sync", { delayInMinutes: 1, periodInMinutes: every });
}

chrome.runtime.onInstalled.addListener(() => { schedule(); badge(); });
chrome.runtime.onStartup.addListener(() => { schedule(); badge(); });
chrome.alarms.onAlarm.addListener(a => { if (a.name === "sync") syncAll("timer"); });

// Opening the school site syncs it when the last read is more than half an hour old
chrome.tabs.onUpdated.addListener(async (tabId, info, tab) => {
  if (info.status !== "complete" || !tab || !tab.url) return;
  const { schools, status } = await load();
  for (const id of Object.keys(schools)) {
    const s = schools[id], st = status[id] || {};
    if (!tab.url.startsWith(s.origin + "/")) continue;
    if ((st.state === "syncing" && Date.now() - (st.since || 0) < 5 * 60000) || (st.state === "ok" && Date.now() - (st.lastOk || 0) < 30 * 60000)) continue;
    syncOne(id, "visit");
  }
});

// The Studyboard iPhone app (the copy of this extension built into it; ios-wrapper/native/SchoolSafari/)
// Schools that sign in with Google can't be signed in to inside the app (Google allows its sign-in only in a browser),
// so the student signs in here in Safari, and this hands that school site's own sign-in (its cookies on that site, never
// a Google cookie or password) to the app on the same iPhone. The app then syncs by itself. Only sites the app asks
// for, only once Safari has let this extension read them, and only while the student is really signed in there.
const TO_APP = (chrome.runtime.getManifest().permissions || []).includes("nativeMessaging");
const APP_ID = "com.studyboardapp.studyboard";
const HAND_EVERY = 6 * 3600000;
function toApp(m) {
  try {
    const B = globalThis.browser || chrome;
    if (!B.runtime || !B.runtime.sendNativeMessage) return Promise.resolve(null);
    return within(Promise.resolve(B.runtime.sendNativeMessage(APP_ID, m)), 8000).catch(() => null);
  } catch (e) { return Promise.resolve(null); }
}
// The sites the app wants a sign-in for (telling it which sites Safari lets this extension read, for its setup steps)
async function appWants() {
  if (!TO_APP) return [];
  let granted = [];
  try { granted = ((await chrome.permissions.getAll()).origins || []).slice(0, 500); } catch (e) {}
  const r = await toApp({ v: 1, op: "wanted", granted });
  if (!r || r.v !== 1 || !Array.isArray(r.wanted)) return [];
  return r.wanted.filter(w => w && NAMES[w.id] && typeof w.origin === "string" && SBX.originOf(w.origin) === w.origin).map(w => ({ id: w.id, origin: w.origin, need: w.need === true }));
}
// Whether the student is signed in to the site (self-contained: also run inside a tab of the site, where Safari's
// tracking protection can't keep the site's sign-in from the request)
async function signedInHere(id, base, f) {
  f = f || ((u, o) => fetch(new URL(u, base).href, Object.assign({ credentials: "include" }, o || {})));
  const json = async p => { const r = await f(p, { headers: { Accept: "application/json" } }); return r.ok && /json/i.test(r.headers.get("content-type") || "") ? r.json() : null; };
  try {
    if (id === "canvas") { const me = await json("/api/v1/users/self"); return !!(me && me.id); }
    if (id === "blackboard") {
      for (const p of ["/learn/api/public/v1/users/me", "/learn/api/v1/users/me"]) { try { const me = await json(p); if (me && me.id) return true; } catch (e) {} }
      return false;
    }
    if (id === "brightspace") {
      const v = await json("/d2l/api/versions/"), lp = String(((Array.isArray(v) ? v : []).find(x => x && String(x.ProductCode).toLowerCase() === "lp") || {}).LatestVersion || "1.30");
      const me = await json("/d2l/api/lp/" + (/^\d{1,2}\.\d{1,3}$/.test(lp) ? lp : "1.30") + "/users/whoami");
      return !!(me && (me.Identifier || me.UniqueName));
    }
    if (id === "moodle") {
      const r = await f("/user/profile.php", { headers: { Accept: "text/html" } });
      if (!r.ok) return false;
      const u = new URL(r.url);
      return u.origin === new URL(base).origin && !/\/login\//.test(u.pathname) && /data-userid|usermenu|user-menu-toggle|userbutton/.test(await r.text());
    }
  } catch (e) {}
  return false;
}
// The site's cookies (those it gets on any of its pages), as the app's handler expects them
async function siteCookies(origin) {
  const B = globalThis.browser || chrome, host = new URL(origin).hostname;
  if (!B.cookies || !B.cookies.getAll) return [];
  const lists = await Promise.all([B.cookies.getAll({ url: origin + "/" }).catch(() => []), B.cookies.getAll({ domain: host }).catch(() => [])]);
  const seen = new Set(), out = [];
  for (const c of [].concat(lists[0] || [], lists[1] || [])) {
    if (!c || typeof c.name !== "string" || typeof c.value !== "string" || typeof c.domain !== "string") continue;
    const d = c.domain.toLowerCase().replace(/^\./, "");
    if (!(host === d || host.endsWith("." + d))) continue;
    const k = c.name + "\n" + d + "\n" + (c.path || "/");
    if (seen.has(k)) continue; seen.add(k);
    out.push({ name: c.name, value: c.value, domain: c.domain, path: c.path || "/", secure: !!c.secure, httpOnly: !!c.httpOnly, hostOnly: !!c.hostOnly,
      sameSite: typeof c.sameSite === "string" ? c.sameSite : null, expirationDate: typeof c.expirationDate === "number" ? c.expirationDate : null });
  }
  return out.slice(0, 150);
}
// A note on the school page when the app was waiting: back to the app in one tap
function backToAppNote(name) {
  if (document.getElementById("studyboard-app-note")) return;
  const host = document.createElement("div"); host.id = "studyboard-app-note";
  host.style.cssText = "position:fixed;left:12px;right:12px;bottom:max(12px,env(safe-area-inset-bottom));z-index:2147483647;";
  const root = host.attachShadow({ mode: "closed" }), box = document.createElement("div"), txt = document.createElement("span"), go = document.createElement("a"), x = document.createElement("button");
  box.setAttribute("role", "status");
  box.style.cssText = "display:flex;align-items:center;gap:12px;padding:14px 16px;border-radius:14px;background:#0E2A56;color:#fff;font:15px/1.35 -apple-system,system-ui,sans-serif;box-shadow:0 6px 24px rgba(0,0,0,.25);";
  txt.textContent = "Signed in. Studyboard can sync " + name + " now."; txt.style.flex = "1";
  go.textContent = "Back to Studyboard"; go.href = "studyboard://school-signed-in";
  go.style.cssText = "color:#0E2A56;background:#fff;border-radius:10px;padding:9px 12px;font-weight:600;text-decoration:none;white-space:nowrap;";
  x.textContent = "×"; x.setAttribute("aria-label", "Close");
  x.style.cssText = "background:none;border:0;color:#fff;font-size:22px;line-height:1;padding:4px;cursor:pointer;";
  x.onclick = () => host.remove();
  box.append(txt, go, x); root.append(box); document.documentElement.append(host);
}
const handing = {};
async function handToApp(w, tabId) {
  if (handing[w.origin]) return handing[w.origin];
  handing[w.origin] = (async () => {
    const key = "handAt:" + w.origin, last = Number((await get(key))[key]) || 0;
    if (!w.need && Date.now() - last < HAND_EVERY) return false;
    if (!(await granted(w.origin))) return false;
    let ok = await within(signedInHere(w.id, w.origin, schoolFetch(w.origin)), 20000).catch(() => false);
    if (!ok && tabId != null) {
      try { const r = await within(chrome.scripting.executeScript({ target: { tabId }, func: signedInHere, args: [w.id, w.origin, null] }), 20000); ok = !!(r && r[0] && r[0].result); } catch (e) {}
    }
    if (!ok) return false;
    const cookies = await siteCookies(w.origin).catch(() => []);
    if (!cookies.length) return false;
    const r = await toApp({ v: 1, op: "handoff", id: w.id, origin: w.origin, at: Date.now(), cookies });
    if (!r || r.ok !== true) return false;
    await set({ [key]: Date.now() });
    if (w.need && tabId != null) chrome.scripting.executeScript({ target: { tabId }, func: backToAppNote, args: [NAMES[w.id]] }).catch(() => {});
    return true;
  })().catch(() => false).finally(() => { handing[w.origin] = null; });
  return handing[w.origin];
}
// After the school site loads in a tab, after connecting a site, and after a good read
async function handOrigin(origin, tabId) {
  if (!TO_APP || !origin) return;
  const w = (await appWants()).find(x => x.origin === origin);
  if (!w) return;
  if (tabId == null) { const t = await openTabOf(origin); tabId = t ? t.id : null; }
  await handToApp(w, tabId);
}
if (TO_APP) chrome.tabs.onUpdated.addListener((tabId, info, tab) => {
  if (info.status !== "complete" || !tab || !tab.url) return;
  let o = ""; try { o = new URL(tab.url).origin; } catch (e) { return; }
  if (SBX.originOf(o) === o) handOrigin(o, tabId).catch(() => {});
});

// Firefox closes the toolbar popup when it asks for a permission
chrome.permissions.onAdded.addListener(async p => {
  const { pending } = await load();
  if (!pending || Date.now() - pending.at > 10 * 60000) return;
  if (!(p.origins || []).some(o => o === pending.origin + "/*")) return;
  // the popup asks about replacing the next time it opens
  const r = await addSchool(pending.origin, pending.platform);
  if (r && r.error === "exists") await set({ pending: Object.assign({}, pending, { platform: r.id, conflict: { id: r.id, old: r.old } }) });
});
chrome.permissions.onRemoved.addListener(async p => {
  const { schools } = await load();
  for (const id of Object.keys(schools)) if ((p.origins || []).includes(schools[id].origin + "/*")) await setStatus(id, { state: "permission", at: Date.now() });
});

// The Studyboard website talking to the extension directly
const APP_ORIGINS = ["https://studyboardapp.com", "https://www.studyboardapp.com"];
async function results() {
  const all = await chrome.storage.local.get(null), status = all.status || {}, schools = all.schools || {};
  return { v: 1, version: chrome.runtime.getManifest().version,
    list: Object.keys(all).filter(k => /^result:(canvas|brightspace|blackboard|moodle)$/.test(k)).map(k => all[k]).filter(Boolean),
    schools: Object.keys(schools).map(id => ({ id, origin: schools[id].origin, state: (status[id] || {}).state || "", at: (status[id] || {}).lastOk || 0 })) };
}
if (chrome.runtime.onMessageExternal) chrome.runtime.onMessageExternal.addListener((m, sender, reply) => {
  let origin = ""; try { origin = sender.origin || new URL(sender.url).origin; } catch (e) {}
  if (!APP_ORIGINS.includes(origin) || !m || typeof m !== "object") return false;
  if (m.type === "get" || m.type === "hello") { results().then(reply, () => reply({ error: "unavailable" })); return true; }
  if (m.type === "sync") { syncAll(m.why === "open" ? "open" : "app"); reply({ ok: true }); return false; }
  return false;
});

// Requests from the toolbar popup (everything) and from relay.js on the Studyboard website
chrome.runtime.onMessage.addListener((m, sender, reply) => {
  if (!m || typeof m !== "object" || sender.id !== chrome.runtime.id) return false;
  const fromPage = !String(sender.url || "").startsWith(chrome.runtime.getURL(""));
  const go = async () => {
    if (fromPage && m.op === "forget") return forgetReads();
    if (fromPage) return m.op === "sync" ? { ok: true, started: (syncAll(m.why === "open" ? "open" : "app"), true) } : { error: "not-allowed" };
    switch (m.op) {
      case "status": { const st = await load(), p = st.pending; return { schools: st.schools, settings: st.settings, status: st.status, version: chrome.runtime.getManifest().version,
        conflict: p && p.conflict && Date.now() - p.at < 10 * 60000 ? { id: p.conflict.id, old: p.conflict.old, origin: p.origin } : null }; }
      case "pending": await set({ pending: { origin: SBX.originOf(m.origin) || "", platform: NAMES[m.platform] ? m.platform : "", at: Date.now() } }); return { ok: true };
      case "add": return addSchool(m.origin, m.platform, m.replace === true);
      // "Keep" on the replace question: forget the question and the new site's permission (unless it's in use)
      case "keep": {
        const st = await load(), o = SBX.originOf(m.origin);
        await set({ pending: null });
        if (o && !Object.values(st.schools).some(x => x.origin === o)) chrome.permissions.remove({ origins: [o + "/*"] }).catch(() => {});
        return { ok: true };
      }
      case "remove": return removeSchool(String(m.id || ""));
      case "sync": { if (m.id) await syncOne(String(m.id), "button"); else await syncAll("button"); return { ok: true }; }
      case "settings": {
        const st = await load(), s = Object.assign({}, st.settings);
        if (EVERY.includes(Number(m.every))) s.every = Number(m.every);
        if (typeof m.on === "boolean") s.on = m.on;
        await set({ settings: s }); await schedule(); return { ok: true, settings: s };
      }
      default: return { error: "bad-request" };
    }
  };
  go().then(reply, e => reply({ error: errText(e) }));
  return true;
});
