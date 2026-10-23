/* ===== module: 01-sync.js: the app's core, cloud sync, the offline outbox and sync conflicts ===== */
/* Cloud sync: one document per task and per course */
const cloud = {on:false, base:null, tasks:null, courses:null, files:null, notes:null, decks:null, events:null, trash:null, backups:null};
const KIND_MAP = {task:"tasks", course:"courses", file:"files", note:"notes", deck:"decks", event:"events", trash:"trash"};
const queue = new Map(), intended = new Map();
let syncError = false;
function refFor(kind, id){
  if (kind === "meta") return cloud.base;
  return cloud[KIND_MAP[kind]].doc(id);
}
function syncLabel(){
  const el = $("#sync");
  { const g = !!(window.SBGUEST && window.SBGUEST.is()); ["#guestBadge", "#guestBadgeSide"].forEach(q => { const b = $(q); if (b) b.hidden = !g; }); }
  setTimeout(() => { el.dataset.state = /^(Saved|Saved on this device)$/.test(el.textContent) ? "ok" : /Saving|Connecting/.test(el.textContent) ? "busy" : "warn"; }, 0);
  if (!cloud.on && typeof sbConfig === "function" && !inPreview() && sbConfig() && !sbLocalOnly()) {
    const n = Object.keys(outboxGet()).length;
    el.textContent = !sb ? (n ? "Offline, changes will sync" : "Offline") : !sbUser ? (n ? "Not signed in, changes kept here" : "Not signed in") : n ? "Offline, changes will sync" : "Connecting…";
  }
  else if (!cloud.on) el.textContent = "Saved on this device";
  else if (queue.size) el.textContent = "Saving…";
  else if (syncError) el.textContent = "Not saved, retrying";
  else el.textContent = "Saved";
  const side = $("#syncSide");
  if (side) { const t = el.textContent; side.textContent = t === "Saved on this device" ? "On this device" : t; side.dataset.state = /^(Saved|Saved on this device)$/.test(t) ? "ok" : /Saving|Connecting/.test(t) ? "busy" : "warn"; side.title = t; }
}
function queueWrite(kind, id, data){
  if (demoDrawing) return;
  if (cloud.on && cloud.noteBase && !inPreview()) { try { cloud.noteBase(kind, kind === "meta" ? "planner" : id); } catch(e) {} }
  outboxAdd(kind, id, data);
  if (!cloud.on) return;
  if (kind === "trash" && !cloud.trash) return;
  const key = kind + ":" + id;
  intended.set(key, data === null ? null : clone(data));
  let e = queue.get(key);
  if (!e) { e = {running:false, next:null}; queue.set(key, e); }
  e.ref = refFor(kind, id);
  e.next = {data: data === null ? null : clone(data)};
  syncLabel();
  if (!e.running) runQueue(key, e);
}
async function runQueue(key, e){
  e.running = true;
  let tries = 0;
  if (window.SBERR) SBERR.crumb("sync", "start");
  while (e.next) {
    const job = e.next; e.next = null;
    try {
      const res = job.data === null ? await e.ref.delete() : await e.ref.set(job.data);
      tries = 0; syncError = false;
      outboxDone(key, job.data);
      if (res && res.merge) syncAdopt(key, job.data, res);
      if (window.SBERR) SBERR.crumb("sync", "ok");
    } catch(err) {
      const code = err && err.code;
      if ((code === "unavailable" || code === "resource_exhausted") && tries < 4) {
        tries++; syncError = true; syncLabel();
        await sleep((window.__SB_RETRY_MS || 900) * tries + Math.random() * 700);
        if (!e.next) e.next = job;
      } else {
        syncError = true; console.warn("Save failed", code, err && err.message);
        if (window.SBERR) { SBERR.crumb("sync", "fail"); if (code !== "quota_exceeded") SBERR.flow("sync", err, {tags: {code}}); }

        if (code === "quota_exceeded" || code === "quota_or_state") toast("Online storage is full, so recent changes can't sync. They are still saved on this device. Delete old items or export a backup.");
        if (code === "schema" && !window.__schemaWarned) { window.__schemaWarned = true; toast(SB_HOSTED ? "Flashcards are saved on this device but can't sync yet. They'll sync once Studyboard's server is updated." : "Flashcards are saved on this device but can't sync yet. Run the flashcards update SQL from the setup guide, then reload."); }
      }
    }
  }
  e.running = false; queue.delete(key); intended.delete(key); syncLabel();
}
function applySnap(kind, snap){
  const m = {};
  snap.docs.forEach(d => {
    const v = clone(d.data());
    if (!v) return;
    v.id = d.id;
    m[d.id] = norm(kind, v);
  });
  const pending = Object.assign({}, inPreview() ? {} : outboxGet());
  intended.forEach((v, key) => { pending[key] = v; });
  Object.keys(pending).forEach(key => {
    const i = key.indexOf(":"), k = key.slice(0, i), id = key.slice(i + 1), v = pending[key];
    if (k !== kind) return;
    if (v === null) delete m[id]; else m[id] = norm(kind, clone(v));
  });
  const prev = state[KIND_MAP[kind]] || {};
  if (kind === "trash") Object.keys(prev).forEach(id => { if (prev[id] && prev[id].local && !m[id]) m[id] = prev[id]; });
  const same = Object.keys(prev).length === Object.keys(m).length && Object.keys(m).every(id => prev[id] && JSON.stringify(prev[id]) === JSON.stringify(m[id]));
  if (same) return;
  state[KIND_MAP[kind]] = m;
  saveLocal();
  if (kind === "trash") { trashEnforce(); trashSaveLocal(); }
  fxDefer(scheduleRender);
}
const useCap = n => (window.claude && typeof window.claude.use === "function") ? window.claude.use(n).catch(() => null) : Promise.resolve(null);

async function initCloud(){
  if (!inPreview()) { initSupabase(); return; }
  useCap("downloads").then(d => { caps.downloads = d; });
  useCap("assets").then(a => { caps.assets = a; scheduleRender(); });
  try {
    const [db, user] = await Promise.all([useCap("db"), useCap("user")]);
    if (!db || !user) { syncLabel(); return; }
    const id = await user.id();
    if (!id) { syncLabel(); return; }
    const base = db.doc("data/users/" + id + "/planner");
    await connectBackend({base, tasks: base.collection("tasks"), courses: base.collection("courses"), files: base.collection("files"), notes: base.collection("notes"), decks: base.collection("decks"), events: base.collection("events"), trash: base.collection("trash"), backups: base.collection("backups")});
  } catch(e) {
    console.warn("Cloud unavailable", e);
    cloud.on = false; syncLabel();
  }
}
// Connects a storage backend
async function connectBackend(b){
  const snap = await b.base.get();
  if (b.alive && !b.alive()) return;
  const md = snap.exists ? clone(snap.data()) : null;
  if (b.hooks) b.hooks.onMeta = applyRemoteSettings;
  Object.assign(cloud, {noteBase: b.noteBase || null, base: b.base, tasks: b.tasks, courses: b.courses, files: b.files, notes: b.notes, decks: b.decks, events: b.events || null, trash: b.trash || null, backups: b.backups, refresh: b.refresh || null});
  cloud.schema = md && Number(md.schema) > 2 ? Number(md.schema) : 2;
  if (md && md.schema >= 2) {
    if (md.settings) {
      const rAi = md.settings.ai, lAi = state.settings && state.settings.ai, mineS = state.settings;
      let remote = md.settings, pending = false;
      if (outboxMine("meta:meta")) { pending = true; try { remote = SyncMerge.mergeItem("meta", b.metaBase ? b.metaBase() : null, syncSettings(mineS), md.settings, {}).merged || md.settings; } catch(e) { remote = md.settings; } }
      state.settings = Object.assign({capacity:15}, remote);
      keepPhotoThemes(state.settings, mineS);
      if (keepLocalFeeds(state.settings, mineS)) setTimeout(() => { try { saveSettings(); } catch(e) {} }, 1500);
      if (keepNoteBoards(state.settings, mineS)) setTimeout(() => { try { saveSettings(); } catch(e) {} }, 1500);
      if (window.SBUISYNC) SBUISYNC.keep(state.settings, mineS);
      { const was = md.settings.style && md.settings.style.skin; keepNewerSkin(state.settings, mineS); if ((state.settings.style || {}).skin !== was) setTimeout(() => { try { saveSettings(); } catch(e) {} }, 1500); }
      if (rAi || lAi) state.settings.ai = Object.assign({}, rAi || {}, lAi || {}, {keys: Object.assign({}, rAi && rAi.keys, lAi && lAi.keys)});
      if (rAi && (rAi.keys || rAi.key)) setTimeout(() => { try { saveSettings(); } catch(e) {} }, 1500);
    }
  } else {
    const v1 = md && (Array.isArray(md.courses) || Array.isArray(md.tasks)) ? fromArrays(md) : null;
    const localHas = Object.keys(state.tasks).length || Object.keys(state.courses).length || Object.keys(state.notes).length || Object.keys(state.decks || {}).length || Object.keys(state.events || {}).length;
    const src = (v1 && (!localHas || (v1.updated || 0) >= (state.updated || 0))) ? v1 : state;
    const items = [...Object.values(src.courses).map(c => ["course", c]), ...Object.values(src.tasks).map(t => ["task", t]),
      ...Object.values(src.files || {}).map(f => ["file", f]), ...Object.values(src.notes || {}).map(n => ["note", n]), ...Object.values(src.decks || {}).map(d => ["deck", d]), ...Object.values(src.events || {}).map(e => ["event", e]), ...Object.values(src.trash || {}).filter(e => !e.local).map(e => ["trash", e])];
    for (let i = 0; i < items.length; i += 5) {
      await Promise.all(items.slice(i, i + 5).map(([k, o]) => refFor(k, o.id).set(clone(o))));
    }
    await b.base.set({schema:2, settings: syncSettings(src.settings || state.settings), migratedAt: Date.now()});
    { const keep = state.trash; state = src; if (!Object.keys(state.trash || {}).length) state.trash = keep || {}; } saveLocal();
    if (items.length && !inPreview()) toast(`Moved ${items.length} item${items.length === 1 ? "" : "s"} from this device into your account`);
  }
  if (b.alive && !b.alive()) return;
  cloud.on = true; syncLabel();
  await flushOutbox();
  const got = {task:false, course:false, file:false, note:false};
  const sub = (kind, col) => {
    let retried = false;
    const start = () => col.onSnapshot(s => {
      applySnap(kind, s); got[kind] = true;
      if (got.task && got.course && got.file) maybeAutoBackup();
    }, err => {
      if (err && err.code === "unavailable" && !retried) { retried = true; setTimeout(start, 3000); return; }
      if (err && err.code === "revoked") { cloud.on = false; syncLabel(); }
    });
    start();
  };
  sub("task", cloud.tasks); sub("course", cloud.courses); sub("file", cloud.files); sub("note", cloud.notes); if (cloud.decks) sub("deck", cloud.decks); if (cloud.events) sub("event", cloud.events); if (cloud.trash) sub("trash", cloud.trash);
}

/* Offline outbox */
const OUTBOX = "studioso:outbox";
const outboxGet = () => { try { return JSON.parse(localStorage.getItem(OUTBOX) || "{}") || {}; } catch(e) { return {}; } };
// The outbox lives in localStorage, which every open tab and window of Studyboard shares
const outboxOwn = new Set(Object.keys(outboxGet()));
const outboxMine = k => outboxOwn.has(k) && k in outboxGet();
function outboxAdd(kind, id, data){
  if (demoDrawing) return;
  if (inPreview() || !sbConfig() || deviceWiping) return;
  outboxOwn.add(kind + ":" + id);
  const o = outboxGet(); o[kind + ":" + id] = data === null ? null : clone(data);
  try { localStorage.setItem(OUTBOX, JSON.stringify(o)); } catch(e) { try { toast("This device's storage is full, so offline changes may not be kept. Export a backup, then free some space."); } catch(e2) {} }
}
function outboxDone(key, data){
  if (inPreview()) return;
  const o = outboxGet();
  if (!(key in o)) return;
  if (JSON.stringify(o[key]) === JSON.stringify(data === null ? null : data)) { delete o[key]; try { localStorage.setItem(OUTBOX, JSON.stringify(o)); } catch(e) {} }
}
let flushing = false;
async function flushOutbox(){
  if (flushing || !cloud.on) return;
  const o = outboxGet(), keys = Object.keys(o);
  if (!keys.length) return;
  flushing = true;
  let sent = 0; const merged = [], sentBy = {}, readAs = {};
  keys.forEach(k => { readAs[k] = JSON.stringify(o[k]); });
  for (const k of keys) {
    const i = k.indexOf(":"), kind = k.slice(0, i), id = k.slice(i + 1);
    if (queue.has(k)) continue;
    if (!outboxOwn.has(k)) continue;
    if (kind === "meta") o[k] = {schema: Math.max(2, cloud.schema || 2), settings: syncSettings(state.settings)};
    try {
      const r = refFor(kind, id), res = o[k] === null ? await r.delete({outbox: true}) : await r.set(o[k], {outbox: true});
      const sentData = o[k]; sentBy[k] = sentData; delete o[k]; sent++;
      if (res && res.merge) { merged.push([k, sentData, res]); }
    }
    catch(e) { const c = e && e.code; if (c === "unavailable" || c === "resource_exhausted" || !c) break; }
  }
  try {
    const cur = outboxGet();
    Object.keys(sentBy).forEach(k => { if (k in cur && JSON.stringify(cur[k]) === readAs[k]) delete cur[k]; });
    localStorage.setItem(OUTBOX, JSON.stringify(cur));
  } catch(e) {}
  flushing = false;
  merged.forEach(([k, sentData, res]) => syncAdopt(k, sentData, res));
  if (sent && !merged.some(m => m[2].merge.state === "merged" || m[2].merge.state === "restored")) { toast(`Synced ${sent} change${sent === 1 ? "" : "s"} made while offline`); }
  if (sent) syncLabel();
}

/* Sync conflicts */
const syncNotes = [];
let syncNoteT = 0;
function syncNotify(info){
  syncNotes.push(info);
  clearTimeout(syncNoteT);
  syncNoteT = setTimeout(() => {
    const list = syncNotes.splice(0), say = list.filter(i => i && (i.state === "merged" || i.state === "restored"));
    if (!say.length) return;
    const bad = say.filter(i => i.conflict), nm = i => `"${i.title || "Untitled"}"`;
    if (say.length === 1 && bad.length) toast(`Two of your devices edited ${nm(say[0])} at once. Both versions are kept in the note.`, null, {label: "Resolve", fn: () => syncIssuesSheet()});
    else if (bad.length) toast(`${bad.length} notes were edited on two devices at once. Both versions are kept.`, null, {label: "Review", fn: () => syncIssuesSheet()});
    else if (say.length === 1) toast(say[0].state === "restored" ? (say[0].kept ? `${nm(say[0])} was edited on your other device, so it was kept.` : `${nm(say[0])} was deleted on your other device, but you edited it here. It's back.`) : `Merged edits to ${nm(say[0])} from your other device`);
    else toast(`Merged edits to ${say.length} items from your other device`);
  }, 80);
}
// Your theme choice carries the time you made it (style.skinAt)
function keepNewerSkin(next, mine){
  try {
    const m = mine && mine.style, t = next && next.style;
    if (m && m.skin && (Number(m.skinAt) || 0) > ((t && Number(t.skinAt)) || 0) && (!t || t.skin !== m.skin)) next.style = Object.assign({}, t || {}, {skin: m.skin, skinAt: m.skinAt});
  } catch (e) {}
  return next;
}
// Photo themes you made are merged by id, never replaced by a list from an older copy
function keepPhotoThemes(next, mine){
  try {
    const arr = v => Array.isArray(v) ? v.filter(x => x && typeof x === "object" && typeof x.id === "string") : [];
    const gl = [...arr(next.photoGone), ...arr(mine && mine.photoGone)], gone = new Map();
    gl.forEach(g => { if (!gone.has(g.id) || (g.at || 0) > gone.get(g.id).at) gone.set(g.id, {id: g.id, at: Number(g.at) || 0}); });
    const nn = arr(next.photoThemes), mm = arr(mine && mine.photoThemes), t = r => Number(r.ed || r.at) || 0;
    if (!nn.length && !mm.length && !gone.size) return next;
    const out = nn.filter(r => !gone.has(r.id)).map(r => { const m = mm.find(x => x.id === r.id); return m && (t(m) > t(r) || (t(m) === t(r) && m.asset && !r.asset)) ? m : r; });
    mm.forEach(r => { if (!gone.has(r.id) && !out.some(x => x.id === r.id)) out.push(r); });
    next.photoThemes = out;
    if (gone.size) next.photoGone = [...gone.values()].sort((a, b) => a.at - b.at).slice(-20);
  } catch (e) {}
  return next;
}
// Note boards are merged by id, never replaced by a list from the account or another device
/*NB-START*/
const RECOVERED_NAME = /^Recovered Board( \d+)?$/;
function keepNoteBoards(next, mine){
  try {
    const arr = v => Array.isArray(v) ? v.filter(x => x && typeof x === "object" && typeof x.id === "string" && x.id) : [];
    const gl = [...arr(next.noteBoardsGone), ...arr(mine && mine.noteBoardsGone)], gone = new Map();
    gl.forEach(g => { if (!gone.has(g.id) || (g.at || 0) > gone.get(g.id).at) gone.set(g.id, {id: g.id, at: Number(g.at) || 0}); });
    const nn = arr(next.noteBoards), mm = arr(mine && mine.noteBoards);
    if (!nn.length && !mm.length && !gone.size) return false;
    const real = b => !RECOVERED_NAME.test(String(b.name || ""));
    const out = nn.filter(b => !gone.has(b.id)).map(b => { const m = mm.find(x => x.id === b.id); return m && !real(b) && real(m) ? m : b; });
    let added = 0; mm.forEach(b => { if (!gone.has(b.id) && !out.some(x => x.id === b.id)) { out.push(b); added++; } });
    next.noteBoards = out;
    if (gone.size) next.noteBoardsGone = [...gone.values()].sort((a, b) => a.at - b.at).slice(-30);
    return added > 0;
  } catch (e) { return false; }
}
/*NB-END*/
function adoptSettings(st){
  const keep = state.settings && state.settings.ai, mine = state.settings;
  state.settings = Object.assign({capacity: 15}, st);
  keepPhotoThemes(state.settings, mine);
  keepNoteBoards(state.settings, mine);
  keepNewerSkin(state.settings, mine);
  if (window.SBUISYNC) SBUISYNC.keep(state.settings, mine);
  if (keepLocalFeeds(state.settings, mine)) setTimeout(() => { try { saveSettings(); } catch(e) {} }, 1500);
  if (keep) state.settings.ai = Object.assign({}, state.settings.ai || {}, keep.keys ? {keys: keep.keys} : {}, keep.key ? {key: keep.key} : {});
}
// Settings changed on another device
let remoteMetaLatest = null, remoteMetaTimer = 0, remoteMetaTries = 0;
function applyRemoteSettings(md){
  try {
    if (md && md.schema > (cloud.schema || 2)) cloud.schema = Number(md.schema);
    if (md && md.schema >= 2 && md.settings) remoteMetaLatest = md;
    if (!md || !(md.schema >= 2) || !md.settings) return;
    if (outboxMine("meta:meta") || intended.has("meta:meta")) {
      if (!remoteMetaTimer && remoteMetaTries++ < 20) remoteMetaTimer = setTimeout(() => { remoteMetaTimer = 0; if (remoteMetaLatest) applyRemoteSettings(remoteMetaLatest); }, 1500);
      return;
    }
    remoteMetaTries = 0;
    if (SyncMerge.eq(syncSettings(state.settings), md.settings)) return;
    adoptSettings(md.settings); saveLocal(); scheduleRender();
    if (!SyncMerge.eq(syncSettings(state.settings), md.settings)) queueWrite("meta", "meta", {schema: Math.max(2, cloud.schema || 2), settings: syncSettings(state.settings)});
  } catch(e) { console.warn(e); }
}
function syncAdopt(key, sent, res){
  try {
    const i = key.indexOf(":"), kind = key.slice(0, i), id = key.slice(i + 1), info = res.merge, merged = res.merged;
    if (merged === undefined) return;
    if (kind === "meta") {
      const curData = {schema: Math.max(2, cloud.schema || 2), settings: syncSettings(state.settings)};
      let next = merged;
      if (sent && !SyncMerge.eq(curData, sent)) next = SyncMerge.mergeItem("meta", sent, curData, merged, {mineAt: Date.now()}).merged;
      if (next && next.settings) { adoptSettings(next.settings); saveLocal(); scheduleRender(); }
      if (next && !SyncMerge.eq(next, merged)) queueWrite("meta", "meta", {schema: Math.max(2, cloud.schema || 2), settings: syncSettings(state.settings)});
      return;
    }
    const m = mapOf(kind); if (!m) return;
    if (merged === null) { delete m[id]; }
    else {
      const cur = m[id] || null;
      if (sent !== null && !cur) return;
      let next = merged;
      if (sent !== null && cur && !SyncMerge.eq(norm(kind, clone(cur)), norm(kind, clone(sent)))) next = SyncMerge.mergeItem(kind, sent, cur, merged, {mineAt: Date.now()}).merged;
      if (next === null) delete m[id]; else m[id] = norm(kind, clone(next));
      if (next !== null && !SyncMerge.eq(next, merged)) queueWrite(kind, id, m[id]);
    }
    state.updated = Date.now(); saveLocal(); scheduleRender();
    syncNotify(info);
  } catch(e) { console.warn("sync merge", e); }
}

// Sync issues: notes (and other items) where two devices edited the same text at once
const SYNC_KINDS = ["note", "task", "event", "deck", "course"];
const syncConflicts = () => SYNC_KINDS.flatMap(k => Object.values(mapOf(k) || {}).filter(o => o && o.conflict).map(o => ({kind: k, id: o.id, o})));
function syncPartsOf(o){
  let found = null;
  (function walk(v){ if (found) return; if (typeof v === "string") { if (SyncMerge.hasMarks(v)) { const p = SyncMerge.conflictParts(v)[0]; if (p) found = p; } } else if (Array.isArray(v)) v.forEach(walk); else if (v && typeof v === "object") Object.keys(v).forEach(k => { if (k !== "hist" && k !== "syncLog") walk(v[k]); }); })(o);
  return found || {mine: "", theirs: "", at: ""};
}
function syncResolve(kind, id, choice){
  const o = getItem(kind, id); if (!o) return;
  const walk = v => typeof v === "string" ? (SyncMerge.hasMarks(v) ? SyncMerge.resolveText(v, choice) : v) : Array.isArray(v) ? v.map(walk) : v && typeof v === "object" ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, k === "hist" || k === "syncLog" ? x : walk(x)])) : v;
  const n = walk(clone(o)); delete n.conflict;
  if (kind === "note" && o.text !== n.text) n.hist = (Array.isArray(o.hist) ? o.hist : []).concat([{at: Date.now(), from: "before you chose", text: String(o.text).slice(0, SyncMerge.CAP.histChars)}]).slice(-SyncMerge.CAP.hist);
  applyChanges([{kind, id, after: n}], choice === "mine" ? "Kept your version" : choice === "theirs" ? "Kept the other device's version" : "Kept both versions");
}
function syncIssuesSheet(){
  const list = syncConflicts(), sh = t => esc(String(t || "").slice(0, 600)) || '<span class="mini">(empty)</span>';
  openSheet(`<div class="sheet">${head("Sync Issues")}<div class="sheet-body">
    ${list.length ? `<p style="margin:0 0 10px">These were edited on two devices at once. Nothing was lost: both versions are in the item, between dividers. Choose what to keep.</p>`
      : `<p style="margin:0">Nothing needs your attention. When two devices edit the same thing, Studyboard merges the changes by itself.</p>`}
    ${list.map(({kind, id, o}) => { const p = syncPartsOf(o), title = SyncMerge.titleOf(kind, o) || "Untitled";
      return `<div class="sync-issue"><div><b>${esc(title)}</b> <span class="mini">${kind === "note" ? "Note" : kind === "deck" ? "Deck" : kind === "task" ? "Task" : "Item"}${o.conflict && o.conflict.at ? " · " + esc(new Date(o.conflict.at).toLocaleString(undefined, {month: "short", day: "numeric", hour: "numeric", minute: "2-digit"})) : ""}</span></div>
        <div class="sync-cols"><div><span class="mini"><b>This device</b></span><div class="sync-txt">${sh(p.mine)}</div></div><div><span class="mini"><b>Your other device</b>${p.at ? " · " + esc(p.at) : ""}</span><div class="sync-txt">${sh(p.theirs)}</div></div></div>
        <div class="sync-btns"><button type="button" class="btn small" data-act="sync-resolve" data-kind="${kind}" data-id="${esc(id)}" data-choice="mine">Keep Mine</button><button type="button" class="btn small" data-act="sync-resolve" data-kind="${kind}" data-id="${esc(id)}" data-choice="theirs">Keep Theirs</button><button type="button" class="btn small primary" data-act="sync-resolve" data-kind="${kind}" data-id="${esc(id)}" data-choice="both">Keep Both</button></div></div>`; }).join("")}
    </div><div class="sheet-foot"><span class="spacer"></span><button type="button" class="btn primary" data-act="close">Done</button></div></div>`);
}
hook("act", (act, el, id) => {
  switch (act) {
    case "note-resolve": case "sb-issues": if (dlg.open && act === "sb-issues") dlg.close(); setTimeout(syncIssuesSheet, act === "sb-issues" ? 30 : 0); return true;
    case "sync-resolve": syncResolve(el.dataset.kind, id, el.dataset.choice); if (syncConflicts().length) syncIssuesSheet(); else if (dlg.open) dlg.close(); return true;
  }
});
hook("menu", () => { try { const n = inPreview() ? 0 : syncConflicts().length; return n ? `<button data-act="sb-issues" data-group="account"><span>Sync Issues<span class="sub">${n} ${n === 1 ? "item was" : "items were"} edited on two devices. Choose what to keep.</span></span></button>` : ""; } catch(e) { return ""; } });

// Test handle (only when a test page sets window.__SB_TEST)
if (window.__SB_TEST) setTimeout(() => { window.__sbSync = {get state(){ return state; }, SY, useClient: c => { sb = c; }, claimDevice, wipeDeviceData, devKeys: {LS2, OUTBOX, OWNER}, mapOf, getItem, applyChanges, clone, saveSettings, outboxGet, idle: () => queue.size === 0 && !flushing, get cloud(){ return cloud; }, toastText: () => $("#toastMsg").textContent, trashVisible, trashRestore, trashForever, trashList, backupBefore, saveDeviceBackup, backupSnap, refresh: () => cloud.refresh && cloud.refresh(), ui, render, scheduleRender, menuSheet, dlg, setKeys: k => aiKeysSetLocal(k), aiReviewSheet: (r, c) => aiReviewSheet(r, c), sbDownload: (p, c) => sbDownload(p, c), FCACHE, wipeDeviceData2: () => wipeDeviceData(), get keys(){ return aiLocalKeys; }}; }, 0);

