/* ===== module: 99-version-history.js ===== */
/* Version History (Pro): earlier versions of notes and decks from the last 30 days, invisible until someone needs it.
   - Free stays as it was: a note's Earlier Versions (01-notes.js, NOTEHIST: the last 20 versions per note in localStorage on this device,
     plus Undo and Redo while editing). Free users get that sheet unchanged, with one small line about Pro.
   - Pro adds, on this device, in IndexedDB ("studyboard-versions"): a snapshot of a note's text or a deck's cards taken from the "changed"
     hook (the state right before a change). At most one per item every 10 minutes of editing, plus one right before every risky change
     however recent the last one: deleting a note or deck, a big cut in a note, deleting 3 or more cards, adding 5 or more (an import or
     AI cards), changing 3 or more at once (an AI edit or bulk change), and restoring a version. Reviews never make a snapshot (only the
     cards' wording, pictures and the deck's name count, not their schedule). Snapshots older than 30 days go, each item keeps at most
     about 1.5 MB, and all of them together at most about 20 MB (the oldest go first).
   - Pro also lists versions from the online backups Pro already keeps (weekly, 30 days; and daily ones in Google Drive or OneDrive when
     backups go there), read on demand when the sheet opens: "From Online Backup, Oct 21". Those come from any device.
   - Notes: the existing Earlier Versions sheet (More, Versions) shows all of them, newest first, with Preview (what comes back and what
     goes, line by line) and Restore. Decks: "Earlier Versions" in the Edit Deck sheet, shown when the deck has a version or online backups
     are on. A deck's Preview lists the deleted cards that come back, the cards whose wording changes back and the cards added since
     (kept, unless "Also remove" is ticked).
   - Restoring a deck: cards that are the same keep everything. A card whose wording changed back only a little (a typo fix, a word or
     two) keeps today's review schedule; one whose wording changed a lot (really a different card) gets back the schedule it had in that
     version, which was earned on that wording. Deleted cards come back with the schedule they had then. Every restore is one
     applyChanges step, so Undo reverses it, and what you had is kept as a version first.
   The pure part (snapshots, throttling, pruning, risk, compare, restore, line diff) is between VH-START and VH-END and is unit tested
   in tests/version-history.test.js. */
(() => {
/*VH-START*/
const VH = (() => {
  const DAY = 864e5;
  const CAP = {days: 30, gap: 10 * 60000, item: 1500000, total: 20000000, text: 200000};
  // A card's review schedule; everything else on a card is its content
  const SCHED = ["box", "due", "seen", "right", "wrong", "last", "rate", "fs"];
  const content = c => { const o = {}; Object.keys(c || {}).sort().forEach(k => { if (k !== "id" && !SCHED.includes(k)) o[k] = c[k]; }); return o; };
  const cardKey = c => JSON.stringify(content(c));
  const deckSig = d => d ? JSON.stringify([String(d.name || ""), (d.cards || []).map(c => [c.id, cardKey(c)])]) : "";
  const snapSig = s => s && s.cards ? deckSig(s) : String(s && s.text);
  const noteSnap = (text, at, label) => { const t = String(text == null ? "" : text).slice(0, CAP.text); return {at: Number(at) || 0, label: String(label || "").slice(0, 60), text: t, n: t.length + 60}; };
  function deckSnap(d, at, label){
    const s = {at: Number(at) || 0, label: String(label || "").slice(0, 60), name: String((d && d.name) || ""), cards: ((d && d.cards) || []).filter(c => c && c.id).map(c => Object.assign({}, c))};
    s.n = JSON.stringify(s).length; return s;
  }
  const sizeOf = l => l.reduce((a, s) => a + (Number(s.n) || 0), 0);
  // Drops snapshots older than 30 days, then the oldest until the item fits
  function prune(list, now, cap){
    cap = cap || CAP; const from = now - cap.days * DAY;
    const out = (Array.isArray(list) ? list : []).filter(s => s && s.at >= from);
    let size = sizeOf(out);
    while (out.length > 1 && size > cap.item) size -= Number(out.shift().n) || 0;
    return out;
  }
  // Adds a snapshot to one item's list (oldest first); the same list back when nothing was added
  function add(list, snap, o){
    o = o || {}; const cap = o.cap || CAP; list = Array.isArray(list) ? list : [];
    if (!snap || (snap.cards ? !snap.cards.length : !String(snap.text || "").trim())) return list;
    const last = list[list.length - 1];
    if (last && snapSig(last) === snapSig(snap)) return list;
    if (!o.force && last && snap.at >= last.at && snap.at - last.at < cap.gap) return list;
    return prune(list.concat([snap]).sort((a, b) => a.at - b.at), snap.at, cap);
  }
  // Every item together: {key: list}; the oldest snapshots anywhere go first until it all fits
  function trimAll(map, now, cap){
    cap = cap || CAP; const out = {}; let size = 0;
    Object.keys(map || {}).forEach(k => { const l = prune(map[k], now, cap); if (l.length) { out[k] = l; size += sizeOf(l); } });
    while (size > cap.total) {
      let key = "", oat = Infinity;
      Object.keys(out).forEach(k => { if (out[k][0].at < oat) { oat = out[k][0].at; key = k; } });
      if (!key) break;
      size -= Number(out[key].shift().n) || 0; if (!out[key].length) delete out[key];
    }
    return out;
  }
  // How many characters were replaced or removed going from a to b
  function removed(a, b){
    const m = Math.min(a.length, b.length); let i = 0;
    while (i < m && a.charCodeAt(i) === b.charCodeAt(i)) i++;
    let j = 0;
    while (j < m - i && a.charCodeAt(a.length - 1 - j) === b.charCodeAt(b.length - 1 - j)) j++;
    return a.length - i - j;
  }
  // A note change worth a snapshot however recent the last one ("" when it's ordinary editing)
  function noteRisk(before, after){
    if (after == null) return "Before deleting";
    const a = String(before || ""), r = removed(a, String(after));
    return r >= 200 || (a.length >= 80 && r >= a.length * 0.5) ? "Before a big change" : "";
  }
  function deckChange(before, after){
    const bc = (before && before.cards) || [], ac = (after && after.cards) || [];
    const bm = new Map(bc.map(c => [c.id, c])), am = new Map(ac.map(c => [c.id, c]));
    let gone = 0, added = 0, changed = 0;
    bm.forEach((c, id) => { const x = am.get(id); if (!x) gone++; else if (cardKey(x) !== cardKey(c)) changed++; });
    am.forEach((c, id) => { if (!bm.has(id)) added++; });
    const renamed = !!after && String(after.name || "") !== String((before && before.name) || "");
    return {gone, added, changed, renamed, content: !after || !!(gone || added || changed || renamed)};
  }
  const pl = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;
  // {content: whether the cards or name changed (reviews don't count), risky, label}
  function deckRisk(before, after){
    if (!after) return {content: true, risky: true, label: "Before deleting this deck"};
    const ch = deckChange(before, after), n = ((before && before.cards) || []).length;
    if (!ch.content) return {content: false, risky: false, label: ""};
    const risky = ch.gone >= 3 || (n > 0 && ch.gone === n) || ch.added >= 5 || ch.changed >= 3;
    const label = ch.gone >= 3 || (ch.gone && ch.gone === n) ? `Before ${pl(ch.gone, "card")} ${ch.gone === 1 ? "was" : "were"} deleted`
      : ch.added >= 5 ? `Before ${pl(ch.added, "card")} were added` : ch.changed >= 3 ? `Before ${pl(ch.changed, "card")} changed`
      : ch.gone ? "Before a card was deleted" : ch.changed ? "Before editing" : ch.added ? "Before adding cards" : "Before renaming";
    return {content: true, risky, label};
  }
  const norm = s => String(s || "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
  function lev(a, b){
    if (a === b) return 0; if (!a.length || !b.length) return Math.max(a.length, b.length);
    let prev = Array.from({length: b.length + 1}, (_, j) => j);
    for (let i = 1; i <= a.length; i++) {
      const cur = [i];
      for (let j = 1; j <= b.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = cur;
    }
    return prev[b.length];
  }
  // How alike two sides of a card read, 0 to 1 (spelling and punctuation fixes count as alike)
  function similar(x, y){
    const a = norm(x), b = norm(y);
    if (a === b) return 1;
    if (a.length <= 300 && b.length <= 300) { const d = lev(a, b); if (d <= 2 || d <= Math.max(a.length, b.length) * 0.2) return 0.9; }
    const A = new Set(a.split(" ").filter(Boolean)), B = new Set(b.split(" ").filter(Boolean));
    if (!A.size || !B.size) return 0;
    let i = 0; A.forEach(w => { if (B.has(w)) i++; });
    return i / (A.size + B.size - i);
  }
  // Whether a card's wording changed enough that it's really a different card
  const meaningful = (a, b) => JSON.stringify((a && a.img) || null) !== JSON.stringify((b && b.img) || null) || similar(a.front, b.front) < 0.6 || similar(a.back, b.back) < 0.6;
  // A version's cards next to today's: back (deleted since), changed ({then, now, big}), same, added (since)
  function compare(snapCards, curCards){
    const cm = new Map((curCards || []).map(c => [c.id, c])), sm = new Map((snapCards || []).map(c => [c.id, c]));
    const back = [], changed = [], same = [], added = [];
    (snapCards || []).forEach(s => { const c = cm.get(s.id); if (!c) back.push(s); else if (cardKey(c) !== cardKey(s)) changed.push({then: s, now: c, big: meaningful(s, c)}); else same.push(s); });
    (curCards || []).forEach(c => { if (!sm.has(c.id)) added.push(c); });
    return {back, changed, same, added};
  }
  // The deck's cards after restoring a version: {name, cards, counts}
  function restore(snap, cur, o){
    o = o || {};
    const cmp = compare(snap.cards, cur.cards), sm = new Map(snap.cards.map((c, i) => [c.id, i])), ch = new Map(cmp.changed.map(x => [x.now.id, x]));
    const out = (cur.cards || []).filter(c => sm.has(c.id) || !o.dropAdded).map(c => {
      const x = ch.get(c.id); if (!x) return Object.assign({}, c);
      const from = x.big ? x.then : c, sched = {};
      SCHED.forEach(k => { if (k in from) sched[k] = from[k]; });
      return Object.assign(content(x.then), {id: c.id}, sched);
    });
    cmp.back.slice().sort((a, b) => sm.get(a.id) - sm.get(b.id)).forEach(b => {
      let at = 0;
      for (let j = sm.get(b.id) - 1; j >= 0; j--) { const k = out.findIndex(c => c.id === snap.cards[j].id); if (k >= 0) { at = k + 1; break; } }
      out.splice(at, 0, Object.assign({}, b));
    });
    return {name: snap.name || cur.name, cards: out, counts: {back: cmp.back.length, changed: cmp.changed.length, reset: cmp.changed.filter(x => x.big).length, added: cmp.added.length, removed: o.dropAdded ? cmp.added.length : 0}};
  }
  // Line by line from now to then: [{t: " " | "+" (comes back) | "-" (goes), s}]
  function lineDiff(now, then){
    const a = String(now || "").split("\n"), b = String(then || "").split("\n");
    if (a.length * b.length > 400000) return a.map(s => ({t: "-", s})).concat(b.map(s => ({t: "+", s})));
    const L = Array.from({length: a.length + 1}, () => new Uint16Array(b.length + 1));
    for (let i = a.length - 1; i >= 0; i--) for (let j = b.length - 1; j >= 0; j--) L[i][j] = a[i] === b[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
    const out = []; let i = 0, j = 0;
    while (i < a.length && j < b.length) {
      if (a[i] === b[j]) { out.push({t: " ", s: a[i]}); i++; j++; }
      else if (L[i + 1][j] >= L[i][j + 1]) out.push({t: "-", s: a[i++]});
      else out.push({t: "+", s: b[j++]});
    }
    while (i < a.length) out.push({t: "-", s: a[i++]});
    while (j < b.length) out.push({t: "+", s: b[j++]});
    return out;
  }
  // One note's or deck's versions inside whole-account backups ({at, where, label, notes, decks})
  function fromBackups(backups, kind, id, now){
    const out = [], from = (now || Date.now()) - CAP.days * DAY;
    (backups || []).forEach(b => {
      const at = Number(b && b.at) || 0, arr = b && (kind === "note" ? b.notes : b.decks);
      const x = at >= from && Array.isArray(arr) ? arr.find(y => y && y.id === id) : null; if (!x) return;
      const s = kind === "note" ? noteSnap(x.text, at, "") : deckSnap(x, at, "");
      s.src = b.where === "drive" ? "drive" : "cloud"; s.srcName = String(b.label || ""); out.push(s);
    });
    return out;
  }
  // Newest first, one per distinct content, leaving out what's there now
  function merge(lists, curSig){
    const seen = new Set([curSig]);
    return [].concat(...lists).filter(Boolean).sort((a, b) => b.at - a.at).filter(s => { const k = snapSig(s); if (seen.has(k)) return false; seen.add(k); return true; });
  }
  return {CAP, SCHED, content, cardKey, deckSig, snapSig, noteSnap, deckSnap, add, prune, trimAll, removed, noteRisk, deckChange, deckRisk, similar, meaningful, compare, restore, lineDiff, fromBackups, merge};
})();
/*VH-END*/

const DBN = "studyboard-versions", ST = "v";
const now = () => { try { if (typeof window.__SB_VH_NOW === "function") return Number(window.__SB_VH_NOW()) || Date.now(); } catch (e) {} return Date.now(); };
const on = () => !inPreview() && !!window.SBPRO && !SBPRO.locked();
let dbp = null;
function db(){
  if (dbp) return dbp;
  const p = dbp = new Promise((ok, no) => {
    try {
      const r = indexedDB.open(DBN, 1);
      const t = setTimeout(() => no(new Error("versions unavailable")), 4000);
      r.onupgradeneeded = () => { if (!r.result.objectStoreNames.contains(ST)) r.result.createObjectStore(ST); };
      r.onsuccess = () => { clearTimeout(t); const d = r.result; d.onversionchange = () => { try { d.close(); } catch (e) {} if (dbp === p) dbp = null; }; ok(d); };
      r.onerror = () => { clearTimeout(t); no(r.error); };
    } catch (e) { no(e); }
  }).catch(e => { if (dbp === p) dbp = null; throw e; });
  return dbp;
}
async function tx(mode, fn){
  const d = await db();
  return new Promise((ok, no) => { const t = d.transaction(ST, mode), r = fn(t.objectStore(ST)); t.oncomplete = () => ok(r && "result" in r ? r.result : undefined); t.onerror = t.onabort = () => no(t.error); });
}
const getList = k => tx("readonly", s => s.get(k)).then(v => Array.isArray(v) ? v : []).catch(() => []);
const putList = (k, v) => tx("readwrite", s => v && v.length ? s.put(v, k) : s.delete(k));
const keys = new Set(), lastAt = new Map(), BK = {list: null, at: 0};
let chain = Promise.resolve(), writes = 0, force = "";
function record(kind, id, snap, forced){
  const k = kind + ":" + id, l = lastAt.get(k);
  if (!forced && l != null && snap.at >= l && snap.at - l < VH.CAP.gap) return chain;
  chain = chain.then(async () => {
    const cur = await getList(k), next = VH.add(cur, snap, {force: forced});
    if (next.length) lastAt.set(k, next[next.length - 1].at);
    if (next === cur) return;
    await putList(k, next); if (next.length) keys.add(k); else keys.delete(k);
    if (++writes % 40 === 0) trim();
  }).catch(e => console.warn("version history", e));
  return chain;
}
// Everything past 30 days goes, and the oldest go first past the size cap
function trim(){
  chain = chain.then(async () => {
    const all = await tx("readonly", s => s.getAll()), ks = await tx("readonly", s => s.getAllKeys()), map = {};
    ks.forEach((k, i) => { map[k] = all[i]; });
    const out = VH.trimAll(map, now());
    for (const k of ks) { const a = map[k] || [], b = out[k] || []; if (a.length !== b.length || (a[0] && b[0] && a[0].at !== b[0].at)) await putList(k, b); }
    keys.clear(); Object.keys(out).forEach(k => keys.add(k));
  }).catch(e => console.warn("version history trim", e));
  return chain;
}
hook("boot", () => { setTimeout(() => { if (!inPreview()) tx("readonly", s => s.getAllKeys()).then(ks => { (ks || []).forEach(k => keys.add(k)); }).catch(() => {}); }, 1500); setTimeout(() => { if (on()) trim(); }, 30000); });
window.addEventListener("sb:secrets-wiped", () => {
  keys.clear(); lastAt.clear(); BK.list = null;
  const p = dbp; dbp = null;
  Promise.resolve(p).then(d => { try { if (d) d.close(); } catch (e) {} }).catch(() => {}).then(() => { try { indexedDB.deleteDatabase(DBN); } catch (e) {} });
});
// The state right before each change of a note's text or a deck's cards
hook("changed", (changes, inverse) => {
  if (!on()) return;
  const at = now(), why = force;
  (changes || []).forEach((c, i) => {
    const b = inverse && inverse[i] && inverse[i].after; if (!b || !c) return;
    if (c.kind === "note") {
      const bt = String(b.text || ""), aft = c.after ? String(c.after.text || "") : null;
      if (aft === bt) return;
      const risk = why || VH.noteRisk(bt, aft);
      record("note", c.id, VH.noteSnap(bt, at, risk || "Before editing"), !!risk);
    } else if (c.kind === "deck") {
      const r = VH.deckRisk(b, c.after); if (!r.content) return;
      record("deck", c.id, VH.deckSnap(b, at, why || r.label), !!(why || r.risky));
    }
  });
});

/* Online backups, read when the sheet opens */
const cloudOn = () => typeof window.__SB_VH_BACKUPS === "function" || (typeof cloudBackupsOn === "function" && cloudBackupsOn()) || !!(window.SBCLOUD && SBCLOUD.backup && SBCLOUD.backup.on());
async function backups(){
  if (typeof window.__SB_VH_BACKUPS === "function") return (await window.__SB_VH_BACKUPS()) || [];
  if (BK.list && Date.now() - BK.at < 5 * 60000) return BK.list;
  let all = [], failed = 0;
  if (typeof cloudBackupsOn === "function" && cloudBackupsOn()) { try { all = all.concat(await cloudBackupList()); } catch (e) { failed++; } }
  if (window.SBCLOUD && SBCLOUD.backup && SBCLOUD.backup.on()) { try { all = all.concat(await SBCLOUD.backup.restorable()); } catch (e) { failed++; } }
  if (failed && !all.length) throw new Error("backups");
  BK.list = all; BK.at = Date.now();
  return all;
}

/* The sheet */
const V = {kind: "", id: "", items: [], cloud: "", sel: -1, drop: false};
const when = at => new Date(at).toLocaleString(undefined, {month: "short", day: "numeric", hour: "numeric", minute: "2-digit"});
const dayOf = at => new Date(at).toLocaleDateString(undefined, {month: "short", day: "numeric"});
const itemOf = () => V.kind === "note" ? state.notes[V.id] : state.decks[V.id];
const curNoteText = () => { const box = $("#noteText"); return box && noteEditing === V.id ? box.value : ((state.notes[V.id] || {}).text || ""); };
const curSig = () => V.kind === "note" ? curNoteText() : VH.deckSig(itemOf());
const srcLabel = s => s.src === "cloud" ? `From Online Backup, ${dayOf(s.at)}` : s.src === "drive" ? `From ${s.srcName || "Drive"} Backup, ${dayOf(s.at)}` : "";
const cardsWord = n => `${n} card${n === 1 ? "" : "s"}`;
function preText(s){
  if (s.cards) return `${cardsWord(s.cards.length)}${s.cards.length ? ": " + s.cards.slice(0, 3).map(c => String(c.front || "Picture card").replace(/\s+/g, " ").slice(0, 40)).join(" · ") + (s.cards.length > 3 ? " …" : "") : ""}`;
  return s.text.slice(0, 300);
}
async function openFor(kind, id){
  const it = kind === "note" ? state.notes[id] : state.decks[id]; if (!it) return;
  Object.assign(V, {kind, id, items: [], cloud: cloudOn() ? "loading" : "", sel: -1, drop: false});
  const local = (await getList(kind + ":" + id)).map(s => Object.assign({src: "pro"}, s));
  const dev = kind === "note" ? (nhAll()[id] || []).map(x => VH.noteSnap(x.text, x.at, x.label)) : [];
  V.items = VH.merge([local, dev], curSig());
  draw();
  if (V.cloud) {
    try { const got = VH.fromBackups(await backups(), kind, id, now()); V.items = VH.merge([V.items, got], curSig()); V.cloud = got.length ? "done" : "none"; }
    catch (e) { V.cloud = "error"; }
    if (V.id === id && dlg.open && dlg.querySelector(".vh-sheet")) draw();
  }
}
function listHtml(){
  const what = V.kind === "note" ? "this note" : "this deck's cards";
  const cloudMsg = V.cloud === "loading" ? "Checking your online backups…" : V.cloud === "error" ? "Couldn't reach your online backups right now. The versions on this device are below." : V.cloud === "none" ? "Your online backups have no other version of this." : "";
  return `<p class="mini" style="margin:0">Versions of ${what} from the last 30 days${cloudOn() ? ", from this device and your online backups" : ", kept on this device"}. Restoring keeps what you have now as a version, and you can Undo it.</p>
    ${V.items.length ? `<ul class="nv-list vh-list">${V.items.map((s, i) => `<li><div class="nv-top"><span>${esc(srcLabel(s) || when(s.at) + (s.label ? " · " + s.label : ""))}</span><span class="vh-btns"><button type="button" class="btn small" data-vh-prev="${i}">Preview</button><button type="button" class="btn small" data-vh-res="${i}">Restore</button></span></div><div class="nv-pre">${esc(preText(s))}</div></li>`).join("")}</ul>`
      : `<p class="status-msg">${V.cloud === "loading" ? "Looking for earlier versions…" : "No earlier versions yet. They appear as you edit."}</p>`}
    ${cloudMsg ? `<p class="mini vh-cloud" role="status" style="margin:0">${esc(cloudMsg)}</p>` : ""}`;
}
function notePreview(s){
  const d = VH.lineDiff(curNoteText(), s.text), ch = d.filter(x => x.t !== " ").length;
  return `<p class="mini" style="margin:0">${ch ? "Highlighted lines come back. Struck-out lines are in your note now and are replaced." : "Only spacing differs from your note now."}</p>
    <div class="vh-diff" role="list">${d.map(x => `<div role="listitem" class="${x.t === "+" ? "vh-add" : x.t === "-" ? "vh-del" : ""}">${x.t === "+" ? '<span class="sr">Comes back: </span>' : x.t === "-" ? '<span class="sr">Goes: </span>' : ""}${esc(x.s) || "&nbsp;"}</div>`).join("")}</div>`;
}
function deckPreview(s){
  const cur = itemOf(), c = VH.compare(s.cards, cur.cards), rows = [], MAX = 60;
  const face = x => `<span class="vh-f">${esc(String(x.front || (x.img ? "Picture card" : "")).slice(0, 140))}</span><span class="vh-b">${esc(String(x.back || "").slice(0, 160))}</span>`;
  c.back.forEach(x => rows.push(`<li class="vh-back"><span class="pill">Comes Back</span>${face(x)}</li>`));
  c.changed.forEach(x => rows.push(`<li class="vh-chg"><span class="pill">${x.big ? "Changes Back, Earlier Schedule" : "Changes Back"}</span><span class="vh-now mini">Now: ${esc(String(x.now.front || "").slice(0, 100))} / ${esc(String(x.now.back || "").slice(0, 100))}</span>${face(x.then)}</li>`));
  c.added.forEach(x => rows.push(`<li class="vh-new"><span class="pill">Added Since</span>${face(x)}</li>`));
  const bits = [c.back.length ? `${cardsWord(c.back.length)} deleted since then come${c.back.length === 1 ? "s" : ""} back` : "", c.changed.length ? `${cardsWord(c.changed.length)} change${c.changed.length === 1 ? "s" : ""} back to ${c.changed.length === 1 ? "its" : "their"} wording then` : "", c.same.length ? `${cardsWord(c.same.length)} stay${c.same.length === 1 ? "s" : ""} as ${c.same.length === 1 ? "it is" : "they are"}` : ""].filter(Boolean);
  const renamed = s.name && s.name !== cur.name;
  return `<p style="margin:0">${esc(bits.join(", ") || "Nothing about the cards changes")}.${renamed ? ` The deck is named ${esc(s.name)} again.` : ""}</p>
    ${c.changed.length ? `<p class="mini" style="margin:0">A card that only had small fixes keeps today's review schedule. One whose wording changed a lot gets back the schedule it had then, since that's the wording you studied.</p>` : ""}
    ${c.added.length ? `<label class="cf-row vh-drop"><input type="checkbox" data-vh-drop ${V.drop ? "checked" : ""}><span>Also remove the ${cardsWord(c.added.length)} added since then</span></label>` : ""}
    ${rows.length ? `<ul class="vh-cards">${rows.slice(0, MAX).join("")}</ul>${rows.length > MAX ? `<p class="mini" style="margin:0">And ${rows.length - MAX} more.</p>` : ""}` : ""}`;
}
function draw(){
  const s = V.sel >= 0 ? V.items[V.sel] : null, it = itemOf();
  if (!it) { if (dlg.open) dlg.close(); return; }
  const title = s ? (srcLabel(s) || when(s.at)) : "Earlier Versions";
  openSheet(`<div class="sheet vh-sheet">${head(title)}<div class="sheet-body">${s ? (V.kind === "note" ? notePreview(s) : deckPreview(s)) : listHtml()}</div>
    <div class="sheet-foot">${s ? `<button type="button" class="btn" data-vh-back>Back</button><span class="spacer"></span><button type="button" class="btn primary" data-vh-res="${V.sel}">Restore This Version</button>` : `<span class="spacer"></span><button type="button" class="btn" data-act="close">Close</button>`}</div></div>`);
  dlg.querySelectorAll("[data-vh-prev]").forEach(b => b.addEventListener("click", () => { V.sel = +b.dataset.vhPrev; V.drop = false; draw(); }));
  dlg.querySelectorAll("[data-vh-res]").forEach(b => b.addEventListener("click", () => restoreAt(+b.dataset.vhRes)));
  const bk = dlg.querySelector("[data-vh-back]"); if (bk) bk.addEventListener("click", () => { V.sel = -1; draw(); });
  const dr = dlg.querySelector("[data-vh-drop]"); if (dr) dr.addEventListener("change", () => { V.drop = dr.checked; });
}
function restoreAt(i){
  const s = V.items[i], it = itemOf(); if (!s || !it) return;
  if (V.kind === "note") restoreNote(V.id, s.text); else restoreDeck(V.id, s, V.drop);
}
function withForce(fn){ force = "Before restoring"; try { return fn(); } finally { force = ""; } }
function restoreNote(id, text){
  const n = state.notes[id]; if (!n) return;
  const box = $("#noteText");
  if (dlg.open) dlg.close();
  if (box && noteEditing === id) {
    const prev = box.value;
    nhRecord(id, prev, "Before restoring");
    if (on()) record("note", id, VH.noteSnap(prev, now(), "Before restoring"), true);
    noteSetText(box, text);
    toast("Earlier version restored", () => { const b = $("#noteText"); if (b && noteEditing === id) noteSetText(b, prev); else if (state.notes[id]) applyChanges([{kind: "note", id, after: Object.assign(clone(state.notes[id]), {text: prev, updated: Date.now()})}], null); });
    return;
  }
  try { nhRecord(id, n.text, "Before restoring"); } catch (e) {}
  withForce(() => applyChanges([{kind: "note", id, after: Object.assign(clone(n), {text, updated: Date.now()})}], "Earlier version of the note restored"));
}
function restoreDeck(id, s, drop){
  const d = state.decks[id]; if (!d) return;
  const r = VH.restore(s, d, {dropAdded: drop});
  if (dlg.open) dlg.close();
  withForce(() => applyChanges([{kind: "deck", id, after: Object.assign(clone(d), {name: r.name, cards: r.cards, updated: Date.now()})}], `Earlier version of ${r.name} restored`));
}

/* Entry points */
const PRO_WHY = "Version History is part of Studyboard Pro: earlier versions of your notes and decks from the last 30 days, including versions from your online backups, so you can bring back anything you changed or deleted.";
function deckBtn(d){
  if (!d || inPreview() || !window.SBPRO || SBPRO.locked()) return "";
  return keys.has("deck:" + d.id) || cloudOn() ? `<button type="button" class="btn" data-act="vh-deck" data-id="${esc(d.id)}">Earlier Versions</button>` : "";
}
hook("act", (act, el, id) => {
  if (act === "note-versions") {
    if (!window.SBPRO || inPreview()) return false;
    if (SBPRO.locked()) {
      noteVersionsSheet(id);
      const body = dlg.querySelector(".sheet-body");
      if (body && !body.querySelector(".vh-hint")) body.insertAdjacentHTML("beforeend", `<p class="mini vh-hint" style="margin:0">Pro keeps 30 days of versions, for decks too. <button type="button" class="link-btn" data-act="vh-pro">See Pro</button></p>`);
      return true;
    }
    openFor("note", id); return true;
  }
  if (act === "vh-deck") { if (!state.decks[id]) return true; if (SBPRO.locked()) { PLAN.openSheet(PRO_WHY); return true; } openFor("deck", id); return true; }
  if (act === "vh-pro") { if (typeof PLAN !== "undefined" && PLAN) PLAN.openSheet(PRO_WHY); return true; }
  return false;
});
if (window.SBPRO) SBPRO.addFeature({id: "versions", name: "Version History", where: "In a note's Versions and a deck's Edit Deck: 30 days of earlier versions, also from your online backups", icon: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/>'});

const css = document.createElement("style");
css.textContent = `
.vh-list .nv-top{flex-wrap:wrap}
.vh-btns{display:flex;gap:6px;flex-wrap:wrap}
.vh-diff{max-height:50vh;overflow:auto;border:1px solid var(--line);border-radius:10px;padding:8px 10px;font-size:.86rem;white-space:pre-wrap;word-break:break-word;display:grid;gap:1px}
.vh-diff .vh-add{background:color-mix(in srgb,#2E9E5B 18%,transparent);border-radius:4px}
.vh-diff .vh-del{background:color-mix(in srgb,#D64545 14%,transparent);border-radius:4px;text-decoration:line-through;opacity:.85}
.vh-cards{list-style:none;margin:0;padding:0;display:grid;gap:6px;max-height:46vh;overflow:auto}
.vh-cards li{border:1px solid var(--line);border-radius:10px;padding:7px 10px;display:grid;gap:3px;font-size:.86rem;min-width:0}
.vh-cards .pill{justify-self:start}
.vh-cards .vh-f{font-weight:600;word-break:break-word}
.vh-cards .vh-b,.vh-cards .vh-now{word-break:break-word}
.vh-cards .vh-now{color:var(--muted);text-decoration:line-through}
.vh-drop{display:flex;gap:8px;align-items:center}
`;
document.head.appendChild(css);

window.SBVH = {VH, deckBtn, open: openFor, trim, keys: () => [...keys], list: (kind, id) => getList(kind + ":" + id), settle: () => chain};
})();
