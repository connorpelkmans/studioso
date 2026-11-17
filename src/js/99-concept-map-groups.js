/* ===== module: 99-concept-map-groups.js ===== */
/* Live concept maps in study groups, the way live whiteboards work (99-whiteboard-share.js):
   - Share: a map's ⋯ > Share With a Group…, or a group's Whiteboards tab > Share a Concept Map. The group gets its own copy of
     what's on the map (ideas, connections, places, styles, Map Style, embeds and pictures). Boxes that open the sharer's own notes,
     decks, files, exams or classes go as plain ideas, by name only (or are left out, if the sharer ticks that): what's in them,
     and the links to them, never leave the device. Ideas' links to PDF pages, lecture moments and cards stay private too.
     The sharer's own map is untouched; they get the live copy beside it, in the same course.
   - Members add it from the group's tab ("Add to My Maps"): it's filed under their matching course, and opens in the map editor.
   - Live: each change is a row of per-item changes in group_map_ops (an idea, a place, a style, a name, a connection, the map's
     name or style), sent a moment after it's made and taken in by everyone with the map open (Supabase realtime), caught up from
     where each device left off. Two people editing different boxes both keep their edits; on the same item the later change wins.
   - Presence: who has the map (group_map_people), the live chip (green while connected), and a box someone else just changed is
     outlined in their colour with their name for a few seconds.
   - Undo and Redo stay your own: they put back only what your step changed (99-concept-map.js asks for GM.steps / GM.change).
   - Offline: changes wait on the device (kept across restarts) and are sent when it's back online.
   - Pictures: added only after confirming they're yours to share (once per map per session), sent as small images inside the map.
   - Leaving the group, the group being deleted, or the map being taken off it: your copy stays as your own private map.
   Server: group_maps, group_map_ops, group_map_people, group_map_preview (supabase-groups.sql).
   The pure part is between CMG-START and CMG-END. */
(() => {
/*CMG-START*/
const CMGOF = CMAP => {
  const ek = (a, b) => a < b ? a + "|" + b : b + "|" + a;
  const okNode = id => typeof id === "string" && /^(root|idea:[\w-]{1,60})$/.test(id);
  const okKey = k => { const p = String(k || "").split("|"); return p.length === 2 && okNode(p[0]) && okNode(p[1]) && p[0] !== p[1] && ek(p[0], p[1]) === k; };
  const str = (v, n) => String(v == null ? "" : v).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "").slice(0, n);
  const fin = v => v !== null && v !== "" && Number.isFinite(Number(v)) ? Math.max(-100000, Math.min(100000, Math.round(Number(v)))) : null;
  const hex = v => /^#[0-9a-f]{6}$/i.test(String(v || "")) ? String(v) : "";
  const PIC = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/;
  const dim = v => Math.max(1, Math.min(6000, Math.round(Number(v) || 0))) || 4;
  const embV = e => e && typeof e === "object" && typeof e.e === "string" && e.e ? {p: str(e.p, 20), u: str(e.u, 600), e: str(e.e, 600), th: str(e.th, 600), tt: str(e.tt, 120)} : null;
  // an idea as the group sees it: its name, picture and embed (never a link to a PDF page, a lecture moment or cards: those are private)
  function ideaV(i){
    const o = {label: str(i.label, 120)}, em = embV(i.emb);
    if (i.img && typeof i.img === "object" && i.img.k) o.img = {k: String(i.img.k).slice(0, 200), w: dim(i.img.w), h: dim(i.img.h)};
    if (em) o.emb = em;
    return o;
  }
  function linkV(l){
    const o = {a: l.a, b: l.b, label: str(l.label, 60)};
    if (["dashed", "dotted", "thick"].includes(l.line)) o.line = l.line;
    if (["end", "both"].includes(l.arrow)) o.arrow = l.arrow;
    if ([1, 2, 3, 4].includes(Number(l.w))) o.w = Number(l.w);
    if (hex(l.col)) o.col = hex(l.col);
    if (Array.isArray(l.cv) && l.cv.length === 2 && l.cv.every(v => Number.isFinite(Number(v)))) o.cv = [Math.max(-1, Math.min(1, Number(l.cv[0]))), Math.max(-3, Math.min(3, Number(l.cv[1])))];
    return o;
  }
  // A map record's shared parts, one per item: a idea, p place, s style, n name on the map, h hidden, c removed line, l connection, m the map's name or style
  function parts(rec){
    const r = rec || {}, out = new Map(), put = (t, id, v) => out.set(t + " " + id, {t, id, v});
    (Array.isArray(r.add) ? r.add : []).forEach(i => { if (i && okNode("idea:" + i.id)) put("a", "idea:" + i.id, ideaV(i)); });
    const pos = r.pos && typeof r.pos === "object" ? r.pos : {};
    Object.keys(pos).forEach(id => { const p = pos[id]; if (okNode(id) && Array.isArray(p) && p.length === 2 && fin(p[0]) !== null && fin(p[1]) !== null) put("p", id, [fin(p[0]), fin(p[1])]); });
    const st = r.styles && typeof r.styles === "object" ? r.styles : {};
    Object.keys(st).forEach(id => { if (!okNode(id)) return; const s = CMAP.styleOf(st[id]); if (CMAP.styled(s)) put("s", id, s); });
    const nm = r.names && typeof r.names === "object" ? r.names : {};
    Object.keys(nm).forEach(id => { if (okNode(id) && String(nm[id] || "").trim()) put("n", id, str(nm[id], 120)); });
    (Array.isArray(r.hide) ? r.hide : []).forEach(id => { if (okNode(id) && id !== "root") put("h", id, 1); });
    (Array.isArray(r.cut) ? r.cut : []).forEach(k => { if (okKey(k)) put("c", k, 1); });
    (Array.isArray(r.links) ? r.links : []).forEach(l => { if (l && okNode(l.a) && okNode(l.b) && l.a !== l.b) put("l", ek(l.a, l.b), linkV(l)); });
    if (String(r.name || "").trim()) put("m", "name", str(r.name, 80));
    if (/^[\w-]{1,40}$/.test(String(r.pack || ""))) put("m", "pack", String(r.pack));
    return out;
  }
  // What changed between two versions of a map, item by item: the changes back (before) and forward (after)
  function steps(a, b){
    const A = parts(a), B = parts(b), before = [], after = [];
    new Set([...A.keys(), ...B.keys()]).forEach(k => {
      const x = A.get(k), y = B.get(k); if (JSON.stringify(x ? x.v : null) === JSON.stringify(y ? y.v : null)) return;
      const o = x || y; if (o.t === "m" && o.id === "name" && !(x && y)) return;   // a map always has a name
      before.push({t: o.t, id: o.id, v: x ? x.v : null}); after.push({t: o.t, id: o.id, v: y ? y.v : null});
    });
    return {before, after};
  }
  // Changes onto a map record: each item is replaced (or removed) on its own, so everything else stays as it is
  function apply(rec, ops){
    const r = Object.assign({}, rec || {});
    const add = (Array.isArray(r.add) ? r.add : []).slice(), links = (Array.isArray(r.links) ? r.links : []).slice();
    let hide = (Array.isArray(r.hide) ? r.hide : []).slice(), cut = (Array.isArray(r.cut) ? r.cut : []).slice();
    const pos = Object.assign({}, r.pos), styles = Object.assign({}, r.styles), names = Object.assign({}, r.names);
    (ops || []).forEach(o => {
      const v = o.v;
      if (o.t === "a") { const id = o.id.slice(5), i = add.findIndex(x => x && x.id === id); if (v == null) { if (i >= 0) add.splice(i, 1); } else { const rec2 = Object.assign({id}, v); if (i >= 0) add[i] = rec2; else add.push(rec2); } }
      else if (o.t === "p") { if (v == null) delete pos[o.id]; else pos[o.id] = v.slice(); }
      else if (o.t === "s") { if (v == null) delete styles[o.id]; else styles[o.id] = Object.assign({}, v); }
      else if (o.t === "n") { if (v == null) delete names[o.id]; else names[o.id] = v; }
      else if (o.t === "h") { hide = hide.filter(x => x !== o.id); if (v) hide.push(o.id); }
      else if (o.t === "c") { cut = cut.filter(x => x !== o.id); if (v) cut.push(o.id); }
      else if (o.t === "l") { const i = links.findIndex(l => l && ek(l.a, l.b) === o.id); if (v == null) { if (i >= 0) links.splice(i, 1); } else if (i >= 0) links[i] = Object.assign({}, v); else links.push(Object.assign({}, v)); }
      else if (o.t === "m") { if (o.id === "name") { if (v) r.name = v; } else if (o.id === "pack") { if (v) r.pack = v; else delete r.pack; } }
    });
    return Object.assign(r, {add, links, hide, cut, pos, styles, names});
  }
  // What arrives from others is checked like anything saved: only ideas and the map's middle, plain text, known styles
  function clean(list){
    if (!Array.isArray(list)) return [];
    return list.slice(0, 200).map(o => {
      if (!o || typeof o !== "object" || typeof o.t !== "string" || typeof o.id !== "string") return null;
      const t = o.t, id = o.id, v = o.v;
      if (t === "l" || t === "c") { if (!okKey(id)) return null; }
      else if (t === "m") { if (id !== "name" && id !== "pack") return null; }
      else if (!["a", "p", "s", "n", "h"].includes(t) || !okNode(id) || ((t === "a" || t === "h") && id === "root")) return null;
      if (v == null) return t === "m" && id === "name" ? null : {t, id, v: null};
      if (t === "a") {
        if (typeof v !== "object") return null;
        const out = {label: str(v.label, 120)}, em = embV(v.emb);
        if (v.img && typeof v.img === "object") {
          if (typeof v.img.src === "string" && v.img.src.length < 400000 && PIC.test(v.img.src)) out.img = {src: v.img.src, w: dim(v.img.w), h: dim(v.img.h)};
          else if (v.img.keep) out.img = {keep: 1, w: dim(v.img.w), h: dim(v.img.h)};
        }
        if (em) out.emb = em;
        return {t, id, v: out};
      }
      if (t === "p") return Array.isArray(v) && v.length === 2 && fin(v[0]) !== null && fin(v[1]) !== null ? {t, id, v: [fin(v[0]), fin(v[1])]} : null;
      if (t === "s") { const s = CMAP.styleOf(v); return {t, id, v: CMAP.styled(s) ? s : null}; }
      if (t === "n") { const s = str(v, 120).trim(); return {t, id, v: s || null}; }
      if (t === "h" || t === "c") return {t, id, v: 1};
      if (t === "l") { if (typeof v !== "object") return null; const p = id.split("|"); if (!((v.a === p[0] && v.b === p[1]) || (v.a === p[1] && v.b === p[0]))) return null; return {t, id, v: linkV(v)}; }
      if (t === "m") { const s = id === "name" ? str(v, 80).trim() : /^[\w-]{1,40}$/.test(String(v)) ? String(v) : ""; return s ? {t, id, v: s} : id === "pack" ? {t, id, v: null} : null; }
      return null;
    }).filter(Boolean);
  }
  /* The group's copy of a map, from what the map shows (CMAP.graph's nodes and edges and their places). Ideas and the middle go as
     they are; any other box (a note, deck, file, lecture, whiteboard, exam, topic or class of the sharer's) becomes a plain idea with
     just its name, or is left out with o.drop. Every box gets a new id, so nothing points back at the sharer's own things. */
  function privatize(g, pos, rec, o){
    o = o || {}; const styles = (rec && rec.styles) || {}, idOf = new Map(), out = {add: [], links: [], pos: {}, styles: {}, names: {}, hide: [], cut: []};
    let priv = 0, pics = 0;
    (g.nodes || []).forEach(nd => {
      if (nd.root) { idOf.set(nd.id, "root"); return; }
      if (nd.kind !== "idea") { priv++; if (o.drop) return; }
      const iid = o.newId(); idOf.set(nd.id, "idea:" + iid);
      const i = Object.assign({id: iid}, ideaV(nd.kind === "idea" ? {label: nd.label, img: nd.img, emb: nd.emb} : {label: nd.label}));
      if (i.img) pics++;
      out.add.push(i);
    });
    idOf.forEach((nid, old) => {
      const p = pos && pos[old]; if (Array.isArray(p) && fin(p[0]) !== null && fin(p[1]) !== null) out.pos[nid] = [fin(p[0]), fin(p[1])];
      const s = CMAP.styleOf(styles[old]); if (CMAP.styled(s)) out.styles[nid] = s;
    });
    const root = (g.nodes || []).find(n => n.root);
    if (root && o.name && str(root.label, 120) !== str(o.name, 120)) out.names.root = str(root.label, 120);
    (g.edges || []).forEach(e => { const a = idOf.get(e.a), b = idOf.get(e.b); if (a && b && a !== b) out.links.push(linkV({a, b, label: e.label, line: e.line, arrow: e.arrow, w: e.w, col: e.col, cv: e.cv})); });
    return {rec: out, priv, pics};
  }
  // The small picture on the group's tab: boxes, lines and places only (labels short), drawn by the app with the map's own thumbnail
  function preview(g, pos){
    const ns = (g.nodes || []).slice(0, 40), ids = new Map(ns.map((n, i) => [n.id, n.root ? "root" : "n" + i]));
    const out = {n: [], e: [], p: {}};
    ns.forEach(n => {
      const id = ids.get(n.id), x = {id, l: str(n.label, 40)};
      if (n.root) x.r = 1;
      const s = CMAP.styleOf(n); ["shape", "color", "fill", "stroke", "text"].forEach(k => { if (s[k]) x[k] = s[k]; });
      if (n.img) x.img = 1; if (n.emb) x.emb = 1;
      out.n.push(x);
      const p = pos && pos[n.id]; if (Array.isArray(p) && fin(p[0]) !== null && fin(p[1]) !== null) out.p[id] = [fin(p[0]), fin(p[1])];
    });
    (g.edges || []).forEach(e => { const a = ids.get(e.a), b = ids.get(e.b); if (a && b && out.e.length < 80) out.e.push(e.line && e.line !== "solid" ? [a, b, e.line] : [a, b]); });
    return out;
  }
  // ...and read back: anything odd is dropped, so a member's preview can only ever draw boxes and lines
  function readPreview(p){
    if (!p || typeof p !== "object" || !Array.isArray(p.n)) return null;
    const nodes = [], ids = new Set();
    p.n.slice(0, 40).forEach(x => {
      if (!x || typeof x !== "object" || typeof x.id !== "string" || !/^(root|n\d{1,2})$/.test(x.id) || ids.has(x.id)) return;
      ids.add(x.id); const s = CMAP.styleOf(x), n = {id: x.id, label: str(x.l, 40), kind: x.r ? "course" : "idea"};
      if (x.r) n.root = true; ["shape", "color", "fill", "stroke", "text"].forEach(k => { if (s[k]) n[k] = s[k]; });
      if (x.img) n.img = {k: "x"}; if (x.emb) n.emb = {e: "x"};
      nodes.push(n);
    });
    const pos = {}; Object.keys(p.p && typeof p.p === "object" ? p.p : {}).forEach(id => { const v = p.p[id]; if (ids.has(id) && Array.isArray(v) && fin(v[0]) !== null && fin(v[1]) !== null) pos[id] = [fin(v[0]), fin(v[1])]; });
    nodes.forEach(n => { if (!pos[n.id]) pos[n.id] = [0, 0]; });
    const edges = (Array.isArray(p.e) ? p.e : []).slice(0, 80).filter(e => Array.isArray(e) && ids.has(e[0]) && ids.has(e[1]) && e[0] !== e[1]).map(e => ({a: e[0], b: e[1], line: ["dashed", "dotted"].includes(e[2]) ? e[2] : "solid"}));
    return nodes.length ? {g: {nodes, edges}, pos} : null;
  }
  return {ek, okNode, okKey, parts, steps, apply, clean, privatize, preview, readPreview, ideaV, linkV};
};
/*CMG-END*/
const B = window.SBCMAP; if (!B || !B.CMAP) return;
const CMG = CMGOF(B.CMAP);
const G = () => (window.SBGROUPS && SBGROUPS.share) || null;
const online = () => { const g = G(); return !!(g && g.online()); };
const cli = () => G().cli();
const me = () => G().myId();
const q = async p => { const r = await p; if (r && r.error) throw r.error; return r ? r.data : null; };
const cut = (s, n) => String(s == null ? "" : s).slice(0, n);
const K_SEQ = "studyboard:cmSeq", K_Q = "studyboard:cmQueue", TAG = uid();
const missing = e => /does not exist|schema cache|Could not find/i.test(String(e && e.message));
const denied = e => !!e && (e.code === "42501" || /row-level security|permission denied|isn't in one of your groups/i.test(String(e.message || "")));

/* Your copies of group maps: maps on your courses with g = {gid (group), bid (the group's map), gn (group name)} */
const live = rec => (rec && rec.g && rec.g.bid && rec.g.gid) ? rec.g : null;
function mine(){ const out = []; Object.values(state.courses || {}).forEach(c => { if (c) B.mapsOf(c).forEach(m => { if (live(m)) out.push({cid: c.id, rec: m}); }); }); return out; }
const byBid = bid => mine().find(x => x.rec.g.bid === bid) || null;
const recOf = o => { if (!o || o.kind !== "course") return null; const c = state.courses[o.id]; return c ? B.mapsOf(c).find(m => m.id === o.map) || null : null; };
const liveOf = o => live(recOf(o));
let REMOTE = false;
// a change to one map of a course, from here (not sent on: it came from the group, or it's setting up)
function courseWith(cid, fn){
  const c = state.courses[cid]; if (!c) return null;
  const ms = B.mapsOf(c), next = fn(ms); if (!next) return null;
  const after = Object.assign(clone(c), {maps: next}); delete after.cmap;
  return {kind: "course", id: cid, after};
}
function quietSave(ch){ if (!ch) return; REMOTE = true; try { applyChanges([ch], null, null, {quiet: true}); } finally { REMOTE = false; } }

/* For 99-concept-map.js: undo and redo item by item */
const GM = window.SBCMAPG = {
  snap: o => { const r = recOf(o); return live(r) ? clone(r) : null; },
  steps: (a, b) => CMG.steps(a, b),
  change: (o, ops) => { const r = recOf(o); if (!live(r) || !ops || !ops.length) return null; return courseWith(o.id, ms => ms.map(m => m.id === r.id ? CMG.apply(m, ops) : m)); },
  picGate: (o, again) => {
    const g = liveOf(o); if (!g || RIGHTS.has(g.bid)) return false;
    const M = B.state(); M.gRights = {again}; M.gWho = false; M.sel = ""; M.selE = ""; M.busy = false; B.redraw(); return true;
  },
  CMG
};
const RIGHTS = new Set();
const repaint = () => { const M = B.state(); if (B.shown() && M.el) { const b = M.el.querySelector(".cm-panel"); if (b) { const h = panelHtml(M.own); if (h) b.innerHTML = h; } toolsChip(); } };

/* Sending: each change waits a moment (several in a row go together), and stays on the device until the group has it */
const seqs = () => { try { return JSON.parse(localStorage.getItem(K_SEQ) || "{}") || {}; } catch (e) { return {}; } };
const seqGet = bid => Number(seqs()[bid]) || 0;
const seqSet = (bid, v) => { const m = seqs(); if ((Number(m[bid]) || 0) >= v) return; m[bid] = v; try { localStorage.setItem(K_SEQ, JSON.stringify(m)); } catch (e) {} };
const Q = (() => { try { const v = JSON.parse(localStorage.getItem(K_Q) || "{}"); return v && typeof v === "object" ? v : {}; } catch (e) { return {}; } })();
const qSave = () => { try { localStorage.setItem(K_Q, JSON.stringify(Q)); } catch (e) {} };
const pendingKey = (bid, t, id) => !!(Q[bid] && Q[bid].q.some(o => o.t === t && o.id === id));
const KEYSEQ = new Map();   // bid|t id -> the newest change the group holds for that item (a late arrival of an older one is skipped)
const ksGet = (bid, o) => KEYSEQ.get(bid + "|" + o.t + " " + o.id) || 0;
const ksSet = (bid, o, id) => { const k = bid + "|" + o.t + " " + o.id; if ((KEYSEQ.get(k) || 0) < id) KEYSEQ.set(k, id); };
const SENT = new Set(), SEEN = new Set(), TIMERS = {}, BUSY = new Set();
function enqueue(bid, gid, ops){
  if (!ops.length) return;
  const x = Q[bid] = Q[bid] || {gid, q: []}; x.gid = gid;
  ops.forEach(o => { x.q = x.q.filter(p => !(p.t === o.t && p.id === o.id)); x.q.push(o); });
  qSave(); clearTimeout(TIMERS[bid]); TIMERS[bid] = setTimeout(() => send(bid), 250);
  toolsChip();
}
// Pictures go as small images inside the map
const SRC = new Map();
const loadImg = u => new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = u; });
async function picSrc(k){
  if (SRC.has(k)) return SRC.get(k);
  try {
    const b = window.SBPRO && SBPRO.imageBlob ? await SBPRO.imageBlob(k) : null; if (!b) return null;
    const u = URL.createObjectURL(b), im = await loadImg(u); URL.revokeObjectURL(u);
    for (const side of [900, 640, 420]) {
      const s = Math.min(1, side / Math.max(im.naturalWidth, im.naturalHeight)), c = document.createElement("canvas");
      c.width = Math.max(1, Math.round(im.naturalWidth * s)); c.height = Math.max(1, Math.round(im.naturalHeight * s));
      const x = c.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height); x.drawImage(im, 0, 0, c.width, c.height);
      const url = c.toDataURL("image/jpeg", 0.8); if (url.length < 380000) { SRC.set(k, url); return url; }
    }
  } catch (e) {}
  return null;
}
const wire = ops => Promise.all(ops.map(async o => {
  if (o.t !== "a" || !o.v || !o.v.img) return o;
  const src = await picSrc(o.v.img.k), img = src ? {src, w: o.v.img.w, h: o.v.img.h} : {keep: 1, w: o.v.img.w, h: o.v.img.h};
  return {t: o.t, id: o.id, v: Object.assign({}, o.v, {img})};
}));
let errShown = 0;
async function send(bid){
  const x = Q[bid]; if (!x || !x.q.length) { delete Q[bid]; qSave(); return; }
  if (BUSY.has(bid)) { clearTimeout(TIMERS[bid]); TIMERS[bid] = setTimeout(() => send(bid), 400); return; }
  if (!online() || (navigator.onLine === false)) { toolsChip(); return; }
  BUSY.add(bid); clearTimeout(TIMERS[bid]);
  const batch = x.q.slice(), list = JSON.parse(JSON.stringify(await wire(batch)));
  let i = 0;
  try {
    while (i < list.length) {
      let n = Math.min(150, list.length - i), part = list.slice(i, i + n);
      while (n > 1 && JSON.stringify(part).length > 500000) { n = Math.ceil(n / 2); part = list.slice(i, i + n); }
      const rows = await q(cli().from("group_map_ops").insert({map_id: bid, group_id: x.gid, ch: part, tag: TAG}).select("id"));
      (Array.isArray(rows) ? rows : rows ? [rows] : []).forEach(r => { SENT.add(r.id); seqSet(bid, r.id); part.forEach(o => ksSet(bid, o, r.id)); });
      // what was sent leaves the queue (unless it changed again meanwhile)
      const sent = batch.slice(i, i + n); x.q = x.q.filter(o => !sent.includes(o)); qSave();
      i += n;
    }
  } catch (e) {
    BUSY.delete(bid);
    if (denied(e)) { const h = byBid(bid); delete Q[bid]; qSave(); if (h) await detach(bid, `You're no longer in ${h.rec.g.gn || "that group"}, so “${h.rec.name}” is now just your own map.`); return; }
    TIMERS[bid] = setTimeout(() => send(bid), 4000);
    if (Date.now() - errShown > 60000) { errShown = Date.now(); toast("The group map isn't getting your changes right now. They'll be sent when you're back online."); }
    toolsChip(); return;
  }
  BUSY.delete(bid);
  // a new name shows on the group's tab too (only whoever shared it, or the group's owner, can change that)
  const nm = batch.find(o => o.t === "m" && o.id === "name" && o.v); if (nm) q(cli().from("group_maps").update({name: cut(nm.v, 80)}).eq("id", bid)).catch(() => {});
  if (!x.q.length) { delete Q[bid]; qSave(); } else { TIMERS[bid] = setTimeout(() => send(bid), 250); }
  toolsChip(); previewSoon(bid);
}
const flushAll = () => Object.keys(Q).forEach(bid => send(bid));
window.addEventListener("online", () => { flushAll(); resume(); toolsChip(); });
window.addEventListener("offline", () => { mark(); toolsChip(); });
document.addEventListener("visibilitychange", () => { if (document.hidden) mark(); else resume(); });
setTimeout(flushAll, 4000);

// Every change you make to a group map (on the map, its name in Review, Undo...) goes to the group, item by item
hook("changed", (changes, inverse) => {
  if (REMOTE) return;
  (changes || []).forEach((c, i) => {
    if (c.kind !== "course") return;
    const was = inverse && inverse[i] && inverse[i].after, list = x => x ? B.mapsOf(x).filter(m => live(m)) : [];
    const A = new Map(list(was).map(m => [m.g.bid, m])), Z = new Map(list(c.after).map(m => [m.g.bid, m]));
    A.forEach((m, bid) => {
      const n = Z.get(bid);
      if (!n) { gone(bid, m.g.gid); return; }
      const st = CMG.steps(m, n).after; if (st.length) enqueue(bid, n.g.gid, st);
    });
  });
});
// Deleting your copy takes you off the map's list (the group's copy stays for everyone else)
const goneList = () => (((state.settings || {}).cmGone) || []).filter(x => typeof x === "string");
function gone(bid, gid){
  const l = goneList(); if (!l.includes(bid)) { state.settings = Object.assign({}, state.settings, {cmGone: l.concat(bid).slice(-200)}); saveSettings(); }
  ADDED.delete(bid); delete Q[bid]; qSave(); if (L && L.bid === bid) stop();
  if (online()) q(cli().from("group_map_people").delete().eq("map_id", bid).eq("user_id", me())).catch(() => {});
  GB.delete(gid); fillPanes();
}
// The group's map is gone for you (you left, the group was deleted, or it was taken off the group): yours stays, as your own map
async function detach(bid, msg){
  const h = byBid(bid); if (!h) return;
  if (L && L.bid === bid) stop();
  delete Q[bid]; qSave();
  quietSave(courseWith(h.cid, ms => ms.map(m => m.id === h.rec.id ? (({g, ...rest}) => Object.assign(rest, {at: Date.now()}))(m) : m)));
  if (msg) toast(msg);
  if (B.shown()) { const M = B.state(); M.gWho = false; }
}

/* Taking in what others change */
let L = null;
const CHAIN = {};
const hashS = s => { let h = 2166136261; for (let i = 0; i < s.length; i += 7) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36) + s.length.toString(36); };
async function takePics(bid, ops){
  const h = byBid(bid), cur = new Map(((h && h.rec.add) || []).map(i => ["idea:" + i.id, i]));
  for (const o of ops) {
    if (o.t !== "a" || !o.v || !o.v.img) continue;
    if (o.v.img.keep) { const had = cur.get(o.id); if (had && had.img) o.v.img = Object.assign({}, had.img); else delete o.v.img; continue; }
    const src = o.v.img.src, k = "i:g" + hashS(src);
    if (!SRC.has(k)) { try { const b = await (await fetch(src)).blob(); if (typeof idbSet === "function") await idbSet("cimg:" + k, b); } catch (e) {} SRC.set(k, src); }
    o.v.img = {k, w: o.v.img.w, h: o.v.img.h};
  }
  return ops;
}
const PEER = new Map(), EDITING = new Map();   // node -> {uid, at}; member -> last change
function applyRows(bid, rows, now){
  CHAIN[bid] = (CHAIN[bid] || Promise.resolve()).then(async () => {
    let ops = [];
    rows.slice().sort((a, b) => a.id - b.id).forEach(r => {
      if (!r || r.tag === TAG || SENT.has(r.id) || SEEN.has(r.id)) { if (r) seqSet(bid, r.id); return; }
      SEEN.add(r.id);
      CMG.clean(r.ch).forEach(o => {
        if (pendingKey(bid, o.t, o.id) || ksGet(bid, o) > r.id) return;   // yours is on its way and comes after it
        ksSet(bid, o, r.id); ops.push(o);
        if (now && r.user_id && r.user_id !== me()) { const nd = o.t === "l" ? o.id.split("|")[1] : o.id; if (o.t !== "m" && CMG.okNode(nd)) PEER.set(nd, {uid: r.user_id, at: Date.now()}); EDITING.set(r.user_id, Date.now()); }
      });
      seqSet(bid, r.id);
    });
    if (!ops.length) return;
    ops = await takePics(bid, ops);
    const h = byBid(bid); if (!h) return;
    quietSave(courseWith(h.cid, ms => ms.map(m => m.id === h.rec.id ? CMG.apply(m, ops) : m)));
    peerSoon();
  }).catch(() => {});
  return CHAIN[bid];
}
async function fetchOps(bid, after){
  const out = []; let from = after;
  for (let k = 0; k < 60; k++) {
    const rows = (await q(cli().from("group_map_ops").select("id,user_id,ch,tag").eq("map_id", bid).gt("id", from).order("id").limit(500))) || [];
    out.push(...rows); if (rows.length < 500) break; from = rows[rows.length - 1].id;
  }
  return out;
}
async function catchUp(bid, from){ if (!online()) return; const rows = await fetchOps(bid, from != null ? Math.min(from, seqGet(bid)) : seqGet(bid)); if (rows.length) await applyRows(bid, rows); }
const mark = () => { if (L && L.low == null) L.low = seqGet(L.bid); };
function resume(){ const x = L; if (!x || x.low == null) return; const from = x.low; x.low = null; catchUp(x.bid, from).catch(() => { if (x.low == null) x.low = from; }); }
function stop(){
  if (!L) return; const x = L; L = null;
  try { if (x.ch) cli().removeChannel(x.ch); } catch (e) {}
}
// still in the group, and still shared there? (checked each time the map opens)
function still(x){
  const bid = x.bid;
  q(cli().from("group_maps").select("id,deleted,name").eq("id", bid).maybeSingle()).then(row => {
    if (L !== x) return;
    if (!row || row.deleted) { const nm = (byBid(bid) || {rec: {}}).rec; detach(bid, row && row.deleted ? `“${nm.name}” was taken off ${nm.g ? nm.g.gn : "the group"}. Your copy stays, as your own map.` : `“${nm.name}” isn't shared with you any more (you left ${nm.g ? nm.g.gn : "the group"}, or it was deleted). Your copy stays, as your own map.`); }
  }).catch(() => {});
}
function listen(bid){
  if (L && L.bid === bid) return;
  stop(); const h = byBid(bid); if (!h || !online()) return;
  const x = L = {bid, gid: h.rec.g.gid, ch: null, on: false, low: null};
  const c = cli();
  if (c && typeof c.channel === "function") {
    try {
      const ch = c.channel("sbcm-" + bid + "-" + uid());
      ch.on("postgres_changes", {event: "INSERT", schema: "public", table: "group_map_ops", filter: "map_id=eq." + bid}, p => { const r = p && p.new; if (r && L === x) applyRows(bid, [r], true); });
      ch.subscribe(st => { x.on = st === "SUBSCRIBED" || st === undefined; toolsChip(); if (!x.on) mark(); else if (x.subbed) resume(); else x.subbed = true; });
      x.ch = ch;
    } catch (e) {}
  }
  x.el = B.state().el; still(x);
  catchUp(bid).catch(() => {});
  if (Q[bid]) send(bid);
  addMe(bid, x.gid); access(bid);
  toolsChip();
}
// while a group map is open, it's live; closed, it stops listening (and catches up next time it opens)
hook("cm-painted", o => {
  const g = liveOf(o), el = B.state().el;
  if (g && L && L.bid === g.bid && L.el !== el) { L.el = el; if (online()) { still(L); catchUp(g.bid).catch(() => {}); } }
  if (g) listen(g.bid); else if (L) stop();
  peerMarks();
});
setInterval(() => { if (L && !B.shown()) stop(); }, 3000);

/* Who has it */
const ADDED = new Set();
async function addMe(bid, gid){
  if (!online() || ADDED.has(bid)) return; ADDED.add(bid);
  try { await q(cli().from("group_map_people").upsert({map_id: bid, group_id: gid}, {onConflict: "map_id,user_id", ignoreDuplicates: true})); } catch (e) { ADDED.delete(bid); }
}
const ACC = new Map();
async function access(bid, force){
  const c = ACC.get(bid); if (!online() || (!force && c && Date.now() - c.at < 30000)) return c;
  try { const rows = (await q(cli().from("group_map_people").select("user_id,added_at").eq("map_id", bid).order("added_at"))) || []; ACC.set(bid, {ids: rows.map(r => r.user_id), at: Date.now()}); toolsChip(); } catch (e) {}
  return ACC.get(bid);
}
const memberName = (gid, id) => { if (id === me()) return "You"; const m = ((G() && G().members) ? G().members(gid) : []).find(x => x.id === id); return (m && m.name) || "A member"; };
const memberColor = (gid, id) => { try { const m = (G().members(gid) || []).find(x => x.id === id), h = G().hue ? G().hue(gid, id, m ? m.name : "") : ""; return /^#[0-9a-f]{6}$/i.test(h || "") ? h : m && /^#[0-9A-F]{6}$/i.test(m.color || "") ? m.color : "#7C5CFF"; } catch (e) { return "#7C5CFF"; } };
const faceOf = (gid, id, titled) => {
  const nm = memberName(gid, id), real = nm === "You" ? (G() && G().myName && G().myName()) || "You" : nm;
  let h = ""; try { h = G() && G().avatar ? G().avatar(gid, id, real) : ""; } catch (e) {}
  if (h) return `<span class="wbg-face"${titled ? ` title="${esc(nm)}"` : ""}>${h}</span>`;
  return `<span class="wbg-av" style="--c:${esc(memberColor(gid, id))}"${titled ? ` title="${esc(nm)}"` : ""}>${esc(real.trim().charAt(0).toUpperCase() || "?")}</span>`;
};
const whoText = (gid, ids) => { const names = [...new Set(ids)].sort((a, b) => (b === me()) - (a === me())).map(id => memberName(gid, id)); return !names.length ? "Nobody has added it yet" : names.length <= 3 ? names.join(", ").replace(/, ([^,]*)$/, " and $1") + (names.length === 1 && names[0] !== "You" ? " has it" : " have it") : `${names.slice(0, 2).join(", ")} and ${names.length - 2} others have it`; };
const editingNow = gid => [...EDITING.entries()].filter(([id, at]) => id !== me() && Date.now() - at < 60000).map(([id]) => memberName(gid, id));

/* On the map */
function chipHtml(o){
  const g = liveOf(o); if (!g) return "";
  const a = ACC.get(g.bid), k = a ? new Set(a.ids.concat(me())).size : 0, on = !!(L && L.bid === g.bid && L.on) && navigator.onLine !== false && online();
  const waiting = Q[g.bid] && Q[g.bid].q.length, ed = editingNow(g.gid);
  const tip = !on ? "Offline: your changes stay here and are sent when you're back online" : ed.length ? `${ed.join(", ")} ${ed.length === 1 ? "is" : "are"} editing` : "Who has this map";
  return `<button type="button" class="btn small cm-glive${on ? " on" : ""}" data-cm="g-who" title="${esc(tip)}" aria-label="${esc((on ? "Live with " : "Offline, shared with ") + (g.gn || "your group") + (k ? `, ${k} ${k === 1 ? "person" : "people"}` : "") + (ed.length ? `. ${tip}` : ""))}"><span class="dot" aria-hidden="true"></span><span class="cm-ml">${on ? "Live with" : "Offline ·"} ${esc(cut(g.gn || "your group", 30))}</span><span class="cm-ms">${on ? "Live" : "Offline"}</span>${k ? `<span class="cm-gn"> · ${k}</span>` : ""}${waiting && !on ? `<span class="cm-gwait"> · ${waiting} to send</span>` : ""}${ed.length && on ? `<span class="cm-ged"> · ${esc(ed[0])}${ed.length > 1 ? ` +${ed.length - 1}` : ""} editing</span>` : ""}</button>`;
}
function toolsChip(){ const M = B.state(); if (!B.shown() || !M.el) return; const el = M.el.querySelector(".cm-glive"), h = chipHtml(M.own); if (el && h) { const t = document.createElement("div"); t.innerHTML = h; el.replaceWith(t.firstElementChild); } }
hook("cm-tools", o => chipHtml(o));
hook("cm-more", o => {
  const it = (cm, label) => `<button type="button" role="menuitem" class="cm-mi" data-cm="${cm}">${label}</button>`;
  if (!o || o.kind !== "course") return "";
  return liveOf(o) ? it("g-who", "Who Has This Map") + (G() && G().openBoards ? it("g-go", "Go to the Group") : "") : it("g-share", "Share With a Group…");
});
// a box someone else just changed: outlined in their colour, with their name, for a few seconds
const PEER_MS = 6000;
let peerT = 0;
function peerSoon(){ clearTimeout(peerT); peerT = setTimeout(() => { peerMarks(); toolsChip(); }, PEER_MS + 50); }
function peerMarks(){
  const M = B.state(); if (!B.shown() || !M.el) return; const g = liveOf(M.own); if (!g) return;
  M.el.querySelectorAll(".cm-node.cm-peer").forEach(el => { el.classList.remove("cm-peer"); el.style.removeProperty("--peer"); const t = el.querySelector(".cm-peertag"); if (t) t.remove(); });
  const now = Date.now();
  PEER.forEach((v, id) => {
    if (now - v.at > PEER_MS) { PEER.delete(id); return; }
    const el = M.el.querySelector(`.cm-node[data-n="${CSS.escape(id)}"]`), sz = M.size && M.size[id]; if (!el) return;
    el.classList.add("cm-peer"); el.style.setProperty("--peer", memberColor(g.gid, v.uid));
    const y = -((sz ? sz[1] : 36) / 2) - 8;
    el.insertAdjacentHTML("beforeend", `<text class="cm-peertag" x="0" y="${y}" text-anchor="middle">${esc(cut(memberName(g.gid, v.uid), 24))}</text>`);
  });
  if (PEER.size) peerSoon();
}
function panelHtml(o){
  const M = B.state(), g = liveOf(o);
  if (M.gRights && g) return `<div class="cm-gpanel"><p style="margin:0"><b>Pictures on a group map</b> <span class="mini">Everyone in ${esc(g.gn || "the group")} sees the pictures on this map. Only add pictures you took or made yourself, or have permission to share.</span></p>${G() && G().rightsBox ? G().rightsBox("pic") : ""}<div class="cm-row"><span class="spacer"></span><button type="button" class="btn small" data-cm="g-rights-x">Cancel</button><button type="button" class="btn small primary" data-cm="g-rights-ok">Continue</button></div></div>`;
  if (M.gWho && g && !M.sel && !M.selE) {
    const a = ACC.get(g.bid), ids = [...new Set(((a && a.ids) || []).concat(me()))].sort((x, y) => (y === me()) - (x === me())), ed = editingNow(g.gid);
    return `<div class="cm-gpanel"><div class="cm-row cm-ttl"><b>Shared with ${esc(g.gn || "your study group")}</b><span class="mini">Live: what anyone here changes shows up for everyone as it happens.${ed.length ? ` ${esc(ed.join(", "))} ${ed.length === 1 ? "is" : "are"} editing now.` : ""}</span><span class="spacer"></span>${G() && G().openBoards ? `<button type="button" class="btn small" data-cm="g-go">Go to Group</button>` : ""}<button type="button" class="icon-btn cm-pclose" data-cm="g-who-x" aria-label="Done" title="Done">${CLOSE}</button></div>
      <ul class="wbg-people cm-gpeople">${ids.map(id => `<li>${faceOf(g.gid, id)}${esc(memberName(g.gid, id))}</li>`).join("")}</ul>
      <p class="mini" style="margin:0">Anyone else in the group can add it from the group's Whiteboards tab. Undo only takes back your own changes. Deleting your copy only removes yours.</p></div>`;
  }
  return "";
}
hook("cm-panel", o => panelHtml(o));
const PRIVATE = new Set(["mat", "at", "atpdf", "atlec", "evp", "matchall"]);
hook("cm-act", (a, o, btn) => {
  const M = B.state(), g = liveOf(o);
  if (a === "g-share") { shareSheet(o); return true; }
  if (a === "g-who") { if (!g) return true; M.gWho = !M.gWho; M.sel = ""; M.selE = ""; M.looks = false; access(g.bid, true).then(() => { if (G() && G().loadMembers) return G().loadMembers(g.gid); }).then(repaint).catch(() => {}); B.redraw(); return true; }
  if (a === "g-who-x") { M.gWho = false; B.redraw(); return true; }
  if (a === "g-go") { if (g && G() && G().openBoards) { if (dlg.open) dlg.close(); G().openBoards(g.gid); } return true; }
  if (a === "g-rights-x") { M.gRights = null; B.redraw(); return true; }
  if (a === "g-rights-ok") { if (!(G() && G().rightsOk ? G().rightsOk() : true)) return true; const r = M.gRights; M.gRights = null; if (g) RIGHTS.add(g.bid); B.redraw(); if (r && r.again) r.again(); return true; }
  if (M.gWho && a !== "menu") M.gWho = false;
  // a group's map holds only what's on it: nothing links to your own notes, decks, files or cards from there
  if (g && PRIVATE.has(a)) { M.err = `This map is shared with ${g.gn || "a study group"}, so it doesn't link to your own notes, decks, files, PDF pages, lectures or cards. Those stay private.`; B.redraw(); return true; }
  return false;
});

/* Share With a Group */
const courseMaps = () => { const out = []; Object.values(state.courses || {}).filter(c => c && !c.archived).forEach(c => B.mapsOf(c).forEach(m => { if (!live(m)) out.push({cid: c.id, rec: m, c}); })); return out; };
function sharePlan(cid, mid){
  const c = state.courses[cid], rec = c && B.mapsOf(c).find(m => m.id === mid); if (!rec) return null;
  const pk = B.peek({cid, id: mid, at: rec.at || rec.created || 0}); if (!pk) return null;
  return {c, rec, pk, plan: CMG.privatize(pk.g, pk.pos, rec, {newId: uid, name: rec.name})};
}
async function groupsList(){ return (await q(cli().from("study_groups").select("id,name").order("created_at"))) || []; }
async function shareSheet(o, gidFixed){
  if (!o || o.kind !== "course") return;
  if (liveOf(o)) { toast(`This map is already live with ${liveOf(o).gn || "a study group"}.`); return; }
  if (!online()) { toast("Sign in to share maps with a study group.", null, window.SBGUEST && SBGUEST.signUp ? {label: "Sign In", fn: () => SBGUEST.signUp()} : undefined); return; }
  const sp = sharePlan(o.id, o.map || "main"); if (!sp) { toast("Change something on the map first, then share it."); return; }
  const title = "Share With a Group";
  openSheet(`<div class="sheet">${head(title)}<div class="sheet-body"><p class="mini" style="margin:0" role="status">Loading your groups…</p></div></div>`);
  let groups = [];
  try { groups = await groupsList(); } catch (e) { if (dlg.open) openSheet(`<div class="sheet">${head(title)}<div class="sheet-body"><p style="margin:0">${esc((e && e.message) || "Couldn't load your groups.")}</p></div></div>`); return; }
  if (!dlg.open) return;
  if (gidFixed) groups = groups.filter(g => g.id === gidFixed);
  if (!groups.length) {
    openSheet(`<div class="sheet">${head(title)}<div class="sheet-body"><p style="margin:0">Join or start a study group first. Then everyone in it can work on this map with you, live.</p></div>
      <div class="sheet-foot"><span class="spacer"></span><button type="button" class="btn" data-act="close">Not Now</button><button type="button" class="btn primary" id="cmGoGroups">Study Groups</button></div></div>`);
    $("#cmGoGroups").addEventListener("click", () => { dlg.close(); ui.tab = "groups"; render(); window.scrollTo(0, 0); });
    return;
  }
  const {plan} = sp, priv = plan.priv, pics = plan.pics;
  openSheet(`<form class="sheet cm-gshare">${head(title)}<div class="sheet-body">
    <p style="margin:0">The group gets its own copy of “${esc(sp.rec.name)}”. Whoever adds it can work on it with you: what anyone adds, moves, renames or styles shows up for everyone as it happens. Your own map stays as it is.</p>
    <fieldset class="wb-grp-pick"><legend>Group</legend>${groups.map((g, i) => `<label class="mi-check"><input type="radio" name="gid" value="${esc(g.id)}"${i ? "" : " checked"}> ${esc(g.name)}</label>`).join("")}</fieldset>
    ${priv ? `<div class="grp-note cm-gpriv"><b>${priv} box${priv === 1 ? " opens" : "es open"} your own notes, decks, files or exams.</b> Only ${priv === 1 ? "its name goes" : "their names go"} to the group, as plain ideas: what's in them, and links to PDF pages, lectures or cards, stay private.
      <label class="mi-check"><input type="checkbox" name="drop"> Leave ${priv === 1 ? "that box" : "those boxes"} out</label></div>` : ""}
    ${pics ? `<p class="mini" style="margin:0">Everyone in the group sees the map's pictures too.</p>${G().rightsBox("pic")}` : ""}</div>
    <div class="sheet-foot"><span class="spacer"></span><button type="button" class="btn" data-act="close">Cancel</button><button type="submit" class="btn primary" data-submit>Share</button></div></form>`, fd => {
    if (pics && !G().rightsOk()) return false;
    const gid = String(fd.get("gid") || ""), g = groups.find(x => x.id === gid); if (!g) return false;
    makeLive(o.id, o.map || "main", g.id, g.name, !!fd.get("drop")); return true;
  });
}
async function makeLive(cid, mid, gid, gname, drop){
  const c = state.courses[cid], rec = c && B.mapsOf(c).find(m => m.id === mid); if (!rec) return;
  if (B.mapsOf(c).length >= 30) { toast("This course has 30 maps. Delete one first, then share."); return; }
  const pk = B.peek({cid, id: mid, at: rec.at || rec.created || 0}); if (!pk) return;
  const {rec: shared} = CMG.privatize(pk.g, pk.pos, rec, {newId: uid, name: rec.name, drop});
  let row;
  try { row = await q(cli().from("group_maps").insert({group_id: gid, name: cut(rec.name || "Concept Map", 80), course: cut(c.code || c.name || "", 40)}).select().single()); }
  catch (e) { toast(missing(e) ? "Live group maps need the newest supabase-groups.sql on the server." : ((e && e.message) || "Couldn't share the map. Try again.")); return; }
  if (!row || !row.id) { toast("Couldn't share the map. Try again."); return; }
  const now = Date.now(), copy = Object.assign(shared, {id: uid(), name: rec.name || "Concept Map", auto: false, created: now, at: now, g: {gid, bid: row.id, gn: cut(gname, 80)}});
  if (/^[\w-]{1,40}$/.test(String(rec.pack || ""))) copy.pack = rec.pack;
  quietSave(courseWith(cid, ms => ms.concat([copy])));
  enqueue(row.id, gid, CMG.steps({}, copy).after); await send(row.id);
  await addMe(row.id, gid); previewSoon(row.id, true); GB.delete(gid);
  toast(`Shared with ${gname}. Everyone in the group can add it from the group's Whiteboards tab.`);
  if (dlg.open) dlg.close();
  B.open("course", cid, copy.id);
}

/* Adding a group's map: it's filed under your matching course */
async function addCopy(row, gname, gid){
  const have = byBid(row.id); if (have) return have;
  const G0 = G(), grp = (G0 && G0.groups ? G0.groups() : []).find(x => x.id === gid) || {};
  const cs = Object.values(state.courses || {}).filter(c => c && !c.archived);
  let cid = (G0 && G0.matchCourse && (G0.matchCourse(row.course) || G0.matchCourse(grp.course))) || (cs.length === 1 ? cs[0].id : "");
  if (!cid && cs.length) cid = await pickCourse(cs, row);
  if (cid === null) return null;
  if (!cid) { const nc = {id: uid(), created: Date.now(), name: cut(row.course || gname || "Study Group", 60), code: cut(row.course || "", 20), instructor: "", schedule: "", room: "", office: "", meetings: [], color: "#2F6FE4", notes: "", links: []}; quietSave({kind: "course", id: nc.id, after: nc}); cid = nc.id; }
  const c = state.courses[cid]; if (B.mapsOf(c).length >= 30) { toast(`${courseLabel(c)} has 30 maps. Delete one first, then add this one.`); return null; }
  const now = Date.now(), rec = {id: uid(), name: cut(row.name, 80) || "Group Map", auto: false, created: now, at: now, g: {gid: row.group_id, bid: row.id, gn: cut(gname || "your study group", 80)}};
  const gl = goneList(); if (gl.includes(row.id)) { state.settings = Object.assign({}, state.settings, {cmGone: gl.filter(x => x !== row.id)}); saveSettings(); }
  quietSave(courseWith(cid, ms => ms.concat([rec])));
  try { const s = seqs(); delete s[row.id]; localStorage.setItem(K_SEQ, JSON.stringify(s)); } catch (e) {}
  try { await catchUp(row.id, 0); } catch (e) {}
  await addMe(row.id, row.group_id);
  return byBid(row.id);
}
function pickCourse(cs, row){
  return new Promise(res => {
    let done = false; const fin = v => { if (!done) { done = true; res(v); } };
    openSheet(`<form class="sheet">${head("Add to Which Course?")}<div class="sheet-body"><p style="margin:0">“${esc(row.name)}” goes with your maps for the course you pick.</p>
      <fieldset class="wb-grp-pick"><legend>Course</legend>${cs.map((c, i) => `<label class="mi-check"><input type="radio" name="cid" value="${esc(c.id)}"${i ? "" : " checked"}> ${esc(courseLabel(c))}</label>`).join("")}</fieldset></div>
      <div class="sheet-foot"><span class="spacer"></span><button type="button" class="btn" data-act="close">Cancel</button><button type="submit" class="btn primary" data-submit>Add</button></div></form>`, fd => { fin(String(fd.get("cid") || "") || null); return true; });
    dlg.addEventListener("close", () => setTimeout(() => fin(null), 0), {once: true});
  });
}

/* The group's tab: Concept Maps, under its Whiteboards */
const GB = new Map();
async function loadGroup(gid, force){
  const c = GB.get(gid); if (!online() || (c && c.busy) || (!force && c && Date.now() - c.at < 15000)) return;
  const x = c || {rows: null, people: new Map(), at: 0}; x.busy = true; GB.set(gid, x);
  try {
    x.rows = (await q(cli().from("group_maps").select("*").eq("group_id", gid).eq("deleted", false).order("updated_at", {ascending: false}))) || [];
    const ppl = (await q(cli().from("group_map_people").select("map_id,user_id").eq("group_id", gid))) || [];
    x.people = new Map(); ppl.forEach(r => { if (!x.people.has(r.map_id)) x.people.set(r.map_id, []); x.people.get(r.map_id).push(r.user_id); });
    x.err = "";
  } catch (e) { x.err = missing(e) ? "Group concept maps need the newest supabase-groups.sql on the server." : "Couldn't load the group's concept maps."; if (!x.rows) x.rows = []; }
  x.at = Date.now(); x.busy = false; fillPanes();
  if (G() && G().loadMembers && await G().loadMembers(gid)) fillPanes();
}
const grpCol = gid => { const g = ((G() && G().groups ? G().groups() : []).find(x => x.id === gid)) || {}; const cid = G() && G().matchCourse ? G().matchCourse(g.course) : ""; return cid && typeof colorOf === "function" ? colorOf(cid) : "#7C5CFF"; };
function paneBody(gid){
  const c = GB.get(gid);
  if (!online()) return `<p class="empty mini">Sign in to share concept maps with your group.</p>`;
  if (!c || !c.rows) return `<p class="empty mini" role="status">Loading the group's concept maps…</p>`;
  if (c.err && !c.rows.length) return `<p class="empty mini">${esc(c.err)}</p>`;
  if (!c.rows.length) return `<p class="empty mini">No concept maps here yet. Share one, and everyone in the group can add it and work on it with you, live.</p>`;
  const col = grpCol(gid);
  return `<div class="wbg-grid">${c.rows.map(r => {
    const have = byBid(r.id), ids = c.people.get(r.id) || [], all = have ? [me()].concat(ids) : ids, who = whoText(gid, all);
    const dots = [...new Set(all)].slice(0, 5).map(id => faceOf(gid, id, true)).join("");
    const pv = CMG.readPreview(r.preview), pic = pv && B.peekSvg ? B.peekSvg(pv, col) : `<span class="wbg-ph">Concept Map</span>`;
    const canOff = r.created_by && r.created_by === me();
    return `<div class="wbg-card cmg-card">
      <button type="button" class="wbg-pv cmg-pv" style="--c:${esc(col)}" data-act="grp-cm-open" data-id="${esc(r.id)}" data-g="${esc(gid)}" aria-label="${have ? "Open" : "Add and open"} ${esc(r.name)}">${pic}</button>
      <div class="wbg-meta"><b>${esc(r.name)}</b><span class="wbg-who"><span class="wbg-avs" aria-hidden="true">${dots}</span>${esc(who)}</span></div>
      <div class="wbg-acts">${have ? `<button type="button" class="btn small" data-act="grp-cm-open" data-id="${esc(r.id)}" data-g="${esc(gid)}">Open</button>` : `<button type="button" class="btn small primary" data-act="grp-cm-add" data-id="${esc(r.id)}" data-g="${esc(gid)}">Add to My Maps</button>`}<details class="grp-more g2-mm grp-rep"><summary class="g2-dots" aria-label="More for ${esc(r.name)}">⋯</summary><div class="grp-menu"><button type="button" class="btn" data-act="grp-cm-report" data-id="${esc(r.id)}" data-g="${esc(gid)}">Report</button>${canOff ? `<button type="button" class="btn" data-act="grp-cm-off" data-id="${esc(r.id)}" data-g="${esc(gid)}">Take Off the Group</button>` : ""}</div></details></div>
    </div>`; }).join("")}</div>`;
}
function fillPanes(){ document.querySelectorAll(".grp-cms[data-gid]").forEach(el => { const b = el.querySelector(".grp-cms-body"); if (b) { const h = paneBody(el.dataset.gid); if (b.innerHTML !== h) b.innerHTML = h; } }); }
hook("grp-boards", g => g && g.id ? `<section class="card grp-sec grp-cms" data-gid="${esc(g.id)}"><div class="grp-wbs-head"><h3 class="fsec">Concept Maps</h3><button type="button" class="btn small" data-act="grp-cm-share" data-id="${esc(g.id)}">Share a Concept Map</button></div>
  <p class="mini" style="margin:0 0 10px">Maps shared here are live: add one to your maps to build it with everyone.</p><div class="grp-cms-body">${paneBody(g.id)}</div></section>` : "");
async function openFromGroup(bid, gid, add){
  let h = byBid(bid);
  if (!h) {
    const c = GB.get(gid), row = c && c.rows && c.rows.find(r => r.id === bid); if (!row) return;
    const gname = ((G() && G().groups ? G().groups() : []).find(x => x.id === gid) || {}).name;
    h = await addCopy(row, gname, gid); if (!h) return;
    (c.people.get(bid) || c.people.set(bid, []).get(bid)).push(me()); fillPanes();
    toast(`“${cut(row.name, 40)}” is in your maps for ${courseLabel(state.courses[h.cid])}. Changes show up for everyone as they happen.`, null, add ? {label: "Open", fn: () => B.open("course", h.cid, h.rec.id)} : undefined);
    if (add) return;
  }
  if (dlg.open) dlg.close();
  B.open("course", h.cid, h.rec.id);
}
function shareToGroupSheet(gid){
  const gname = ((G() && G().groups ? G().groups() : []).find(x => x.id === gid) || {}).name || "the group";
  const list = courseMaps();
  if (!list.length) { toast("Make a concept map first (Review > Concept Maps), then share it here."); return; }
  openSheet(`<form class="sheet">${head("Share a Concept Map")}<div class="sheet-body">
    <p style="margin:0">Pick a map to share with ${esc(gname)}. The group gets its own copy, and whoever adds it can work on it with you, live.</p>
    <fieldset class="wb-grp-pick"><legend>Map</legend>${list.map((x, i) => `<label class="mi-check"><input type="radio" name="m" value="${esc(x.cid + "|" + x.rec.id)}"${i ? "" : " checked"}> ${esc(x.rec.name || "Untitled Map")} <span class="mini">${esc(courseLabel(x.c))}</span></label>`).join("")}</fieldset></div>
    <div class="sheet-foot"><span class="spacer"></span><button type="button" class="btn" data-act="close">Cancel</button><button type="submit" class="btn primary" data-submit>Next</button></div></form>`, fd => {
    const [cid, mid] = String(fd.get("m") || "").split("|"); if (!cid || !mid) return false;
    setTimeout(() => shareSheet({kind: "course", id: cid, map: mid}, gid), 0); return true;
  });
}
hook("render", tab => {
  if (tab === "groups") setTimeout(() => { fillPanes(); document.querySelectorAll(".grp-cms[data-gid]").forEach(el => loadGroup(el.dataset.gid)); }, 0);
});
hook("act", (act, el, id) => {
  if (act === "grp-cm-open" || act === "grp-cm-add") { openFromGroup(id, el && el.dataset.g, act === "grp-cm-add"); return true; }
  if (act === "grp-cm-share") { shareToGroupSheet(id); return true; }
  if (act === "grp-cm-report") {
    const gid = el && el.dataset.g, c = GB.get(gid), row = c && c.rows && c.rows.find(r => r.id === id), g = G(); if (!row || !g || !g.reportBoard) return true;
    const m = (g.members ? g.members(gid) : []).find(x => x.id === row.created_by);
    if (el.closest("details")) el.closest("details").open = false;
    g.reportBoard(gid, row.id, {who: row.created_by || "", name: m ? m.name : "", excerpt: "concept map: " + cut(row.name, 120)});
    return true;
  }
  if (act === "grp-cm-off") {
    const gid = el && el.dataset.g, c = GB.get(gid), row = c && c.rows && c.rows.find(r => r.id === id); if (!row) return true;
    if (el.closest("details")) el.closest("details").open = false;
    confirmSheet(`Take ${row.name} Off the Group?`, "It leaves the group's tab and stops being live. Everyone who added it keeps their copy, as their own map.", "Take It Off", async () => {
      try { await q(cli().from("group_maps").update({deleted: true}).eq("id", id)); } catch (e) { toast((e && e.message) || "Couldn't take it off the group. Try again."); return; }
      if (byBid(id)) await detach(id, `“${row.name}” is off the group. Your copy stays, as your own map.`);
      loadGroup(gid, true);
    });
    return true;
  }
  return false;
});

/* The group's preview, kept fresh while people work */
const PV = new Map();
function previewSoon(bid, now){
  const h = byBid(bid); if (!h || !online()) return;
  const last = PV.get(bid) || 0;
  if (!now && Date.now() - last < 20000) { if (!PV.has("t" + bid)) PV.set("t" + bid, setTimeout(() => { PV.delete("t" + bid); previewSoon(bid, true); }, 20000 - (Date.now() - last))); return; }
  PV.set(bid, Date.now());
  setTimeout(async () => {
    try {
      const x = byBid(bid); if (!x) return;
      const pk = B.peek({cid: x.cid, id: x.rec.id, at: x.rec.at || 0}); if (!pk) return;
      await q(cli().rpc("group_map_preview", {p_map: bid, p_preview: CMG.preview(pk.g, pk.pos)}));
    } catch (e) {}
  }, 300);
}

Object.assign(GM, {live: () => L, queue: () => Q, discover: gid => loadGroup(gid, true), send: bid => send(bid)});

const css = document.createElement("style");
css.textContent = `
.cm-glive{display:inline-flex;align-items:center;gap:6px;white-space:nowrap;color:#137240;border-color:color-mix(in srgb,#178A4A 35%,transparent);background:color-mix(in srgb,#178A4A 10%,var(--surface))}
html[data-theme=dark] .cm-glive{color:#7FE3A6}
.cm-glive .dot{width:8px;height:8px;border-radius:50%;background:#9AA4B1;flex:none}
.cm-glive.on .dot{background:#22B35E;box-shadow:0 0 0 3px rgba(34,179,94,.22)}
.cm-glive:not(.on){color:var(--muted);background:var(--soft);border-color:var(--line)}
.cm-glive .cm-gn,.cm-glive .cm-ged,.cm-glive .cm-gwait{font-weight:600;opacity:.85}
.cm-glive .cm-ms{display:none}
@media (max-width:1400px){.cm-glive .cm-ml{display:none}.cm-glive .cm-ms{display:inline}}
@media (max-width:700px){.cm-glive .cm-ged{display:none}}
.cm-node.cm-peer .cm-shape,.cm-node.cm-peer rect:first-child{stroke:var(--peer)!important;stroke-width:3.2px!important}
.cm-node.cm-peer{filter:drop-shadow(0 0 5px color-mix(in srgb,var(--peer) 55%,transparent))}
.cm-peertag{font:700 11px var(--display,system-ui);fill:var(--peer);paint-order:stroke;stroke:var(--surface);stroke-width:3px;pointer-events:none}
.cm-gpanel{display:grid;gap:8px}.cm-gpeople{grid-template-columns:repeat(auto-fill,minmax(150px,1fr))}
.cm-gpriv{display:grid;gap:6px}
.cmg-pv{background:radial-gradient(circle,color-mix(in srgb,var(--c) 30%,transparent) 1px,transparent 1.5px) 0 0/14px 14px,linear-gradient(160deg,color-mix(in srgb,var(--c) 12%,var(--surface)),color-mix(in srgb,var(--c) 4%,var(--surface)))}
.cmg-pv .cm-peek{inset:8px;width:calc(100% - 16px);height:calc(100% - 16px)}
.cm-grpb{background:#178A4A!important;color:#fff!important}
`;
document.head.appendChild(css);
})();
