/* ===== module: 01-undo.js: the app's core, changes and undo ===== */
/* ---------- Changes and undo ---------- */
let lastDelete = null;   // the newest delete that can still be undone with Ctrl/Cmd+Z
const mapOf = kind => state[KIND_MAP[kind]];
const getItem = (kind, id) => mapOf(kind)[id] || null;
function historyDiff(a, b){
  const out = [];
  const nameOf = id => { const c = courseOf(id); return c ? courseLabel(c) : "No Course"; };
  const f = (k, label, fmt) => { const x = a[k] || "", y = b[k] || ""; if (String(x) !== String(y)) out.push(`${label}: ${fmt ? fmt(x) : (x || "none")} → ${fmt ? fmt(y) : (y || "none")}`); };
  f("title", "Renamed");
  f("status", "Status", v => STATUS_LABEL[v] || v);
  f("start", "Start", v => v ? fmtShort(v) : "none");
  f("due", "Due", v => v ? fmtShort(v) : "none");
  f("priority", "Priority", v => PRIO[v] || v);
  f("courseId", "Course", nameOf);
  if ((a.pct || 0) !== (b.pct || 0) && (MILESTONE(b.type) || !(b.checklist || []).length)) out.push(`${MILESTONE(b.type) ? "Preparedness" : "Progress"}: ${a.pct || 0}% → ${b.pct || 0}%`);
  f("type", "Type");
  const pa = progress(a), pb = progress(b);
  if (pb.total && (pa.done !== pb.done || pa.total !== pb.total)) out.push(`Checklist: ${pa.done}/${pa.total} → ${pb.done}/${pb.total}`);
  const da = (a.dependsOn || []).join(), db = (b.dependsOn || []).join();
  if (da !== db) out.push("Dependencies changed");
  return out;
}
function setItem(kind, id, obj, record){
  const m = mapOf(kind);
  if (obj === null) delete m[id];
  else {
    const n = norm(kind, clone(obj));
    if (kind === "task" && record) {
      const before = m[id];
      const entries = before ? historyDiff(before, n) : (n.history.length ? [] : ["Created"]);
      if (entries.length) n.history = n.history.concat(entries.map(text => ({at: Date.now(), text}))).slice(-30);
    }
    m[id] = n;
  }
  queueWrite(kind, id, obj === null ? null : m[id]);
}
function applyChanges(changes, label, extra){
  if (!changes.length) return;
  const inverse = changes.map(c => ({kind:c.kind, id:c.id, after: clone(getItem(c.kind, c.id))}));
  const progressed = label !== null && typeof isProgress === "function" && changes.some(c => c.kind === "task" && c.after && isProgress(getItem("task", c.id), c.after));
  // Anything deleted here goes to Recently Deleted (Settings) for 30 days. Undo (label === null) is never binned.
  let binned = [];
  if (label !== null) { try { binned = trashCapture(changes, label); } catch(e) { console.warn("Recently Deleted", e); } }
  changes.forEach(c => setItem(c.kind, c.id, c.after === null ? null : c.after, label !== null));
  state.updated = Date.now();
  saveLocal();
  scheduleRender();
  const undo = () => { applyChanges(inverse, null); trashDrop(binned); toast("Undone"); };
  if (label) toast(label, undo, extra);
  if (binned.length) lastDelete = {at: Date.now(), undo, label: label || ""};
  if (typeof scheduleFolderBackup === "function") scheduleFolderBackup(DESK ? 3000 : 60000);
  if (progressed) { try { noteProgress(); } catch(e) { console.warn(e); } }
  fire("changed", changes, inverse);   // inverse: each item as it was before, so a hook can tell what was deleted
  return inverse;
}
// AI keys stay on this device: the copy sent to your account never includes them. Neither do school calendar links
// (Brightspace, Canvas, Blackboard): a private calendar link works like a password to that calendar, so it is kept on the device it was added on.
const LMS_FEED_IDS = ["brightspace", "canvas", "blackboard"];
function dropFeeds(o){ LMS_FEED_IDS.forEach(id => { if (o[id] && typeof o[id] === "object" && "feed" in o[id]) { o[id] = Object.assign({}, o[id]); delete o[id].feed; } }); return o; }
function syncSettings(st){
  const o = Object.assign({}, st || {});
  if (o.ai && typeof o.ai === "object") { o.ai = Object.assign({}, o.ai); delete o.ai.keys; delete o.ai.key; }
  return dropFeeds(o);
}
// Settings from the account: this device's own calendar links stay. A link an older version saved to the account is taken in once
// (so nothing stops working here) and the account copy is then removed (true is returned so the caller sends the cleaned settings).
function keepLocalFeeds(st, mine){
  let had = false;
  LMS_FEED_IDS.forEach(id => {
    const r = st[id] && typeof st[id] === "object" ? st[id].feed : "", l = mine && mine[id] && typeof mine[id] === "object" ? mine[id].feed : "";
    if (r) had = true;
    if (l || r) st[id] = Object.assign({}, st[id] || {}, {feed: l || r});
  });
  return had;
}
function saveSettings(){
  state.updated = Date.now(); saveLocal();
  queueWrite("meta", "meta", {schema: Math.max(2, cloud.schema || 2), settings: syncSettings(state.settings)});
}

