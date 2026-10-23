// Studyboard School Sync
"use strict";

const SBX = globalThis.__studyboardExt;
const NAMES = { canvas: "Canvas", brightspace: "Brightspace", blackboard: "Blackboard" };
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
const OPTS = id => ({ pastDays: 60, aheadDays: 240, grades: true, news: true, only: null, skip: [], mail: id === "canvas" });

// fetch for the background read
function schoolFetch(origin) {
  return (u, o) => {
    let url;
    try { url = new URL(String(u), origin); } catch (e) { return Promise.reject(new Error("bad-url")); }
    if (url.origin !== origin) return Promise.reject(new Error("off-site"));
    return fetch(url.href, Object.assign({}, o || {}, { credentials: "include", method: "GET" }));
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
  return null;
}

async function addSchool(origin0, platform) {
  const origin = SBX.originOf(origin0);
  if (!origin) return { error: "bad-address" };
  if (!(await granted(origin))) return { error: "permission" };
  const id = NAMES[platform] ? platform : await detect(origin);
  if (!id) return { error: "unknown-platform" };
  const st = await load();
  const old = st.schools[id];
  st.schools[id] = { id, origin, added: Date.now() };
  await set({ schools: st.schools, pending: null });
  if (old && old.origin !== origin) {
    await chrome.storage.local.remove("result:" + id);
    if (!Object.values(st.schools).some(x => x.origin === old.origin)) chrome.permissions.remove({ origins: [old.origin + "/*"] }).catch(() => {});
  }
  syncOne(id, "added");
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

// Firefox closes the toolbar popup when it asks for a permission
chrome.permissions.onAdded.addListener(async p => {
  const { pending } = await load();
  if (!pending || Date.now() - pending.at > 10 * 60000) return;
  if ((p.origins || []).some(o => o === pending.origin + "/*")) addSchool(pending.origin, pending.platform);
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
    list: Object.keys(all).filter(k => /^result:(canvas|brightspace|blackboard)$/.test(k)).map(k => all[k]).filter(Boolean),
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
      case "status": { const st = await load(); return { schools: st.schools, settings: st.settings, status: st.status, version: chrome.runtime.getManifest().version }; }
      case "pending": await set({ pending: { origin: SBX.originOf(m.origin) || "", platform: NAMES[m.platform] ? m.platform : "", at: Date.now() } }); return { ok: true };
      case "add": return addSchool(m.origin, m.platform);
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
