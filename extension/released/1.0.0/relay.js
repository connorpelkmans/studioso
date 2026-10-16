// Studyboard School Sync: the only page script of the extension. It runs on the Studyboard website (studyboardapp.com) and hands the
// web app what the extension read from the student's school site, kept in this browser's extension storage. The web app cleans it again
// (with the same code the Studyboard bookmark uses) before anything is imported. Nothing here runs on any other site.
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
  // Only the page itself (same window, same site) can ask, and it can only ask for the data or for a sync now
  window.addEventListener("message", e => {
    if (e.source !== window || e.origin !== ORIGIN || !e.data || e.data.source !== "studyboard-app") return;
    if (e.data.type === "hello" || e.data.type === "get") send();
    else if (e.data.type === "sync") chrome.runtime.sendMessage({ op: "sync" }).catch(() => {});
  });
  chrome.storage.onChanged.addListener((ch, area) => { if (area === "local" && Object.keys(ch).some(k => k.startsWith("result:") || k === "status")) send(); });
  post({ type: "ready", version });
})();
