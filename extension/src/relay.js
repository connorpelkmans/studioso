// Studyboard School Sync
(() => {
  "use strict";
  const ORIGIN = location.origin;
  const post = m => window.postMessage(Object.assign({ source: "studyboard-ext" }, m), ORIGIN);
  const version = chrome.runtime.getManifest().version;
  async function send() {
    let all = {};
    try { all = await chrome.storage.local.get(null); } catch (e) { return; }
    const list = Object.keys(all).filter(k => /^result:(canvas|brightspace|blackboard)$/.test(k)).map(k => all[k]).filter(Boolean);
    const status = all.status || {}, schools = all.schools || {};
    post({ type: "data", v: 1, version, list, schools: Object.keys(schools).map(id => ({ id, origin: schools[id].origin, state: (status[id] || {}).state || "", at: (status[id] || {}).lastOk || 0 })) });
  }
  // Only the page itself (same window, same site) can ask, and it can only ask for the data
  window.addEventListener("message", e => {
    if (e.source !== window || e.origin !== ORIGIN || !e.data || e.data.source !== "studyboard-app") return;
    if (e.data.type === "hello" || e.data.type === "get") send();
    else if (e.data.type === "sync") chrome.runtime.sendMessage({ op: "sync" }).catch(() => {});
    else if (e.data.type === "signout") chrome.runtime.sendMessage({ op: "forget" }).catch(() => {});
    else if (e.data.type === "flags" && typeof e.data.bbInternal === "boolean") chrome.storage.local.set({ flags: { bbInternal: e.data.bbInternal } }).catch(() => {});
  });
  chrome.storage.onChanged.addListener((ch, area) => { if (area === "local" && Object.keys(ch).some(k => k.startsWith("result:") || k === "status")) send(); });
  post({ type: "ready", version });
  // Opening Studyboard brings the school site up to date
  chrome.runtime.sendMessage({ op: "sync", why: "open" }).catch(() => {});
})();
