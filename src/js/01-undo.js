/* ===== module: 01-undo.js: the app's core, changes and undo ===== */
/* Changes and undo */
// Ctrl/Cmd+Z steps back through recent changes, newest first
const undoStack = [];
function undoLast(){
  while (undoStack.length) {
    const s = undoStack.pop();
    if (s.done || Date.now() - s.at > 30 * 60000) continue;
    s.undo(); toast(s.label ? `Undone: ${s.label}` : "Undone");
    return true;
  }
  toast("Nothing to undo");
  return false;
}
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
function applyChanges(changes, label, extra, opts){
  if (!changes.length) return;
  const inverse = changes.map(c => ({kind:c.kind, id:c.id, after: clone(getItem(c.kind, c.id))}));
  const progressed = label !== null && typeof isProgress === "function" && changes.some(c => c.kind === "task" && c.after && isProgress(getItem("task", c.id), c.after));
  let binned = [];
  if (label !== null) { try { binned = trashCapture(changes, label); } catch(e) { console.warn("Recently Deleted", e); } }
  // An exam or quiz marked done keeps how ready you were right then (how ready you felt, and what your results said), so the
  // reflection after the mark compares the mark with the readiness before the exam, on every device
  if (label !== null && typeof examReadiness === "function") changes.forEach(c => {
    const a = c.kind === "task" && c.after, b = a && getItem("task", c.id);
    if (!a || !MILESTONE(a.type) || a.prepFor || a.status !== "done" || (b && b.status === "done") || a.readySnap) return;
    try { const xr = examReadiness(Object.assign({}, a, {status: "todo"})); c.after = Object.assign({}, a, {readySnap: {felt: xr ? xr.self : null, measured: xr ? xr.measured : null, at: Date.now()}}); } catch (e) { console.warn("readiness snapshot", e); }
  });
  changes.forEach(c => setItem(c.kind, c.id, c.after === null ? null : c.after, label !== null));
  state.updated = Date.now();
  saveLocal();
  scheduleRender();
  const step = {label: label || "", at: Date.now(), done: false, binned: binned.length > 0};
  const undo = () => { if (step.done) return; step.done = true; applyChanges(inverse, null); trashDrop(binned); toast("Undone"); };
  step.undo = undo;
  if (typeof extra === "function") extra = extra();
  if (label) { toast(label, undo, extra, opts); undoStack.push(step); if (undoStack.length > 20) undoStack.shift(); }
  if (typeof scheduleFolderBackup === "function") scheduleFolderBackup(DESK ? 3000 : 60000);
  if (progressed) { try { noteProgress(); } catch(e) { console.warn(e); } }
  fire("changed", changes, inverse);
  return inverse;
}
// AI keys stay on this device
const LMS_FEED_IDS = ["brightspace", "canvas", "blackboard", "moodle", "schoology"];
function dropFeeds(o){ LMS_FEED_IDS.forEach(id => { if (o[id] && typeof o[id] === "object" && "feed" in o[id]) { o[id] = Object.assign({}, o[id]); delete o[id].feed; } }); return o; }
function syncSettings(st){
  const o = Object.assign({}, st || {});
  if (o.ai && typeof o.ai === "object") { o.ai = Object.assign({}, o.ai); delete o.ai.keys; delete o.ai.key; }
  return dropFeeds(o);
}
// Settings from the account
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

