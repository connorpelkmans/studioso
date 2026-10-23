/* ===== module: 99-linked.js ===== */
/* Linked items: one compact row of chips on a task (its edit sheet) and on a deck page */
(() => {
  const MAX = 5, KS = ["lecture", "note", "file"];
  const keyOf = s => String(s || "").toLowerCase().replace(/[[\]]/g, "").replace(/\s+/g, " ").trim();
  const pro = () => window.SBPRO && SBPRO.parseLinks && SBPRO.linkIndex ? SBPRO : null;
  const isLec = f => !!f && f.folderId === "lectures";
  const isPdf = f => !!f && f.kind === "file" && Array.isArray(f.revs) && f.revs.length && /\.pdf$/i.test((curRev(f) || {}).name || f.name || "");
  const noteName = n => { const p = pro(); const t = p && p.noteTitle ? p.noteTitle(n.text) : String(n.text || "").split("\n").map(l => l.trim()).find(Boolean) || ""; return t || "Untitled note"; };

  /* Indexes, once per change */
  let C = null;
  function idx(){
    if (C && C.at === state.updated && C.st === state) return C;
    const byTask = new Map(), out = new Map(), into = new Map(), filesBy = new Map(), p = pro(), li = p ? p.linkIndex() : null;
    const push = (m, k, v) => { const a = m.get(k); if (a) { if (!a.includes(v)) a.push(v); } else m.set(k, [v]); };
    Object.values(state.notes || {}).forEach(n => {
      if (!n || !n.id) return;
      if (n.taskId) push(byTask, n.taskId, n.id);
      if (!li || String(n.text || "").indexOf("[[") < 0) return;
      p.parseLinks(n.text).forEach(l => { const hit = li.get(keyOf(l.name)); if (!hit || (hit.kind === "note" && hit.id === n.id)) return; push(out, n.id, hit.kind + ":" + hit.id); push(into, hit.kind + ":" + hit.id, n.id); });
    });
    Object.values(state.files || {}).forEach(f => { if (f && Array.isArray(f.taskIds)) f.taskIds.forEach(t => push(filesBy, t, f.id)); });
    C = {at: state.updated, st: state, byTask, out, into, filesBy};
    return C;
  }

  /* Items: {k: note | deck | quiz | file | lecture, id, deck (a quiz's deck), why} */
  function item(k, id, extra){
    if (k === "note") { const n = state.notes[id]; return n ? {k, id, name: noteName(n)} : null; }
    if (k === "deck") { const d = state.decks[id]; return d ? {k, id, name: d.name || "Untitled Deck"} : null; }
    if (k === "quiz") { const d = state.decks[extra]; const q = d && (d.aiQuizzes || []).find(x => x.id === id); return q ? {k, id, deck: d.id, name: q.title || "Practice Quiz"} : null; }
    if (k === "file" || k === "lecture") { const f = state.files[id]; return f ? {k: isLec(f) ? "lecture" : "file", id, name: f.name || "Untitled file", pdf: isPdf(f)} : null; }
    return null;
  }
  function collect(list){
    const seen = new Set(), out = [];
    list.forEach(x => { if (!x) return; const key = (x.k === "lecture" ? "file" : x.k) + ":" + x.id; if (seen.has(key)) return; seen.add(key); out.push(x); });
    return out;
  }
  const split = s => { const i = s.indexOf(":"); return [s.slice(0, i), s.slice(i + 1)]; };
  function forTask(t){
    if (!t || !t.id) return [];
    const I = idx(), notes = [], decks = [], files = [], as = (x, why) => x ? Object.assign(x, {why}) : null;
    const own = I.byTask.get(t.id) || [];
    own.forEach(id => notes.push(as(item("note", id), "attached")));
    (I.into.get("task:" + t.id) || []).forEach(id => notes.push(as(item("note", id), "mentions")));
    const mat = (k, id, deck, why) => { const x = as(item(k, id, deck), why); if (!x) return; (x.k === "note" ? notes : x.k === "deck" || x.k === "quiz" ? decks : files).push(x); };
    own.forEach(nid => (I.out.get(nid) || []).forEach(s => { const [k, id] = split(s); if (k === "deck" || k === "file") mat(k, id, "", "note"); }));
    ((t.prep && t.prep.topics) || []).forEach(tp => (tp.links || []).forEach(l => mat(l.k, l.id, l.deckId, "prep")));
    if (t.matKind) mat(t.matKind, t.matId, t.matDeck, "prep");
    (Array.isArray(t.studyDecks) ? t.studyDecks : []).forEach(id => mat("deck", id, "", "prep"));
    (I.filesBy.get(t.id) || []).forEach(id => mat("file", id, "", "attached"));
    return collect(notes.concat(decks, files));
  }
  function originsOf(d){
    const list = [];
    (Array.isArray(d.origins) ? d.origins : []).forEach(o => { if (o && KS.includes(o.k)) list.push([o.k, o.id]); });
    (d.cards || []).forEach(c => {
      if (!c) return;
      if (c.from && KS.includes(c.from.k)) list.push([c.from.k, c.from.id]);
      if (c.srcNote) list.push(["note", c.srcNote]);
      if (c.src && typeof c.src === "object" && c.src.f) list.push(["file", c.src.f]);
    });
    return list.map(([k, id]) => { const x = item(k === "lecture" ? "file" : k, String(id || "")); return x ? Object.assign(x, {why: "from"}) : null; });
  }
  function forDeck(d){
    if (!d || !d.id) return [];
    const from = collect(originsOf(d)), I = idx();
    const order = {lecture: 0, file: 1, note: 2};
    from.sort((a, b) => order[a.k] - order[b.k]);
    return collect(from.concat((I.into.get("deck:" + d.id) || []).map(id => { const x = item("note", id); return x ? Object.assign(x, {why: "mentions"}) : null; })));
  }

  /* The row */
  const SV = p => `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${p}</svg>`;
  const IC = {
    note: SV('<path d="M4 4h16v10l-6 6H4z"/><path d="M14 20v-6h6"/>'),
    deck: SV('<rect x="3" y="7" width="14" height="13" rx="2"/><path d="M7 4h12a2 2 0 0 1 2 2v11"/>'),
    quiz: SV('<path d="M9 11l2 2 4-4"/><rect x="4" y="3" width="16" height="18" rx="2"/>'),
    file: SV('<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5"/>'),
    pdf: SV('<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5M10 13h6M10 17h4"/>'),
    lecture: SV('<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>')
  };
  const WORD = {note: "Note", deck: "Deck", quiz: "Quiz", file: "File", lecture: "Lecture"};
  const lead = x => x.why === "from" ? `Made from ${x.k === "file" && x.pdf ? "PDF" : WORD[x.k].toLowerCase()}: ` : x.why === "mentions" ? "Note that links here: " : `${x.k === "file" && x.pdf ? "PDF" : WORD[x.k]}: `;
  function chip(x, hide){
    const attrs = x.k === "lecture" ? `data-act="lec-view" data-id="${esc(x.id)}"` : `data-act="lk-open" data-k="${x.k}" data-id="${esc(x.id)}"${x.deck ? ` data-deck="${esc(x.deck)}"` : ""}`;
    return `<li${hide ? " hidden" : ""}><button type="button" class="lk-chip k-${x.k}" ${attrs}>${IC[x.k === "file" && x.pdf ? "pdf" : x.k]}<span class="sr">${esc(lead(x))}</span><span class="lk-n">${esc(x.name)}</span></button></li>`;
  }
  function row(list, where, label){
    if (!list.length) return "";
    const cut = list.length > MAX + 1 ? MAX : list.length;
    return `<div class="lk-row lk-${where}" role="group" aria-label="${esc(label)}"><span class="lk-h" aria-hidden="true">${esc(label)}</span><ul class="lk-list">${list.map((x, i) => chip(x, i >= cut)).join("")}${cut < list.length ? `<li><button type="button" class="lk-chip lk-more" data-act="lk-more">+${list.length - cut} more<span class="sr"> linked item${list.length - cut === 1 ? "" : "s"}</span></button></li>` : ""}</ul></div>`;
  }
  const taskHtml = t => { try { return row(forTask(t), "task", "Linked"); } catch (e) { console.warn("linked items", e); return ""; } };
  const deckHtml = d => { try { const l = forDeck(d); return row(l, "deck", l.every(x => x.why === "from") ? "Made From" : "Linked"); } catch (e) { console.warn("linked items", e); return ""; } };

  /* Opening a chip */
  function openItem(k, id, deck){
    const p = window.SBPRO;
    if (k === "quiz") { if (dlg.open) dlg.close(); if (state.decks[deck]) startAiQuiz(deck, id); return; }
    if (k === "deck" && !state.decks[id] || k === "note" && !state.notes[id] || k === "file" && !state.files[id]) { toast("That isn't in Studyboard any more"); return; }
    if (p && p.openLink) { p.openLink({kind: k, id}, 0); return; }
    if (dlg.open) dlg.close();
    if (k === "deck") { ui.tab = "flashcards"; ui.fc = null; ui.deckId = id; render(); window.scrollTo(0, 0); }
    else if (k === "file") fileSheet(state.files[id]);
    else if (k === "note") { ui.tab = "notes"; render(); }
  }
  hook("act", (act, el, id) => {
    if (act === "lk-open") { openItem(el.dataset.k, id, el.dataset.deck || ""); return true; }
    if (act === "lk-more") {
      const ul = el.closest(".lk-list"); if (!ul) return true;
      const first = ul.querySelector("li[hidden] .lk-chip");
      ul.querySelectorAll("li[hidden]").forEach(li => { li.hidden = false; });
      el.closest("li").remove();
      if (first) first.focus();
      return true;
    }
    return false;
  });

  /* Recording where new cards came from (the shared origin format) */
  function origin(k, id){
    const f = (k === "file" || k === "lecture") && state.files[id];
    if (f) return {k: isLec(f) ? "lecture" : "file", id, at: isLec(f) && f.created ? iso(new Date(f.created)) : todayISO()};
    return k === "note" && state.notes[id] ? {k, id, at: todayISO()} : null;
  }
  // Adds origins to deck d (deduplicated, the last 20) and
  function stamp(d, list, cards){
    const add = (list || []).filter(o => o && KS.includes(o.k) && o.id).map(o => ({k: o.k, id: String(o.id).slice(0, 64), at: isDate(o.at) ? o.at : todayISO()}));
    if (!d || !add.length) return d;
    const seen = new Set();
    d.origins = (Array.isArray(d.origins) ? d.origins : []).concat(add).filter(o => { const key = o && o.k + ":" + o.id; if (!o || !o.k || !o.id || seen.has(key)) return false; seen.add(key); return true; }).slice(-20);
    const one = [...new Set(add.map(o => o.k + ":" + o.id))].length === 1;
    if (one) (cards || []).forEach(c => { if (c && !c.from) c.from = {k: add[0].k, id: add[0].id, at: add[0].at}; });
    return d;
  }

  window.SBLINKED = {taskHtml, deckHtml, forTask, forDeck, origin, stamp};

  const css = document.createElement("style");
  css.textContent = `
.lk-row{display:flex;flex-wrap:wrap;align-items:center;gap:6px 8px;min-width:0;max-width:100%}
.lk-row.lk-deck{margin:10px 0 2px}
.lk-row.lk-task{margin:0 0 2px}
.lk-h{font-size:.76rem;font-weight:700;letter-spacing:.02em;color:var(--muted)}
.lk-list{display:flex;flex-wrap:wrap;gap:6px;margin:0;padding:0;list-style:none;min-width:0;max-width:100%}
.lk-list>li{min-width:0;max-width:100%;display:flex}
.lk-list>li[hidden]{display:none}
.lk-chip{display:inline-flex;align-items:center;gap:5px;min-width:0;max-width:100%;min-height:32px;padding:4px 11px 4px 9px;border:1px solid var(--line);border-radius:999px;background:var(--surface);color:var(--ink);font:inherit;font-size:.84rem;line-height:1.2;cursor:pointer;text-align:left}
.lk-chip svg{flex:none;color:var(--muted)}
.lk-chip.k-lecture svg,.lk-chip.k-deck svg,.lk-chip.k-quiz svg{color:var(--accent)}
.lk-n{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:24ch}
.lk-chip:hover{border-color:color-mix(in srgb,var(--accent) 55%,var(--line))}
.lk-chip:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.lk-more{color:var(--muted);border-style:dashed;font-weight:600}
@media (pointer:coarse){.lk-chip{min-height:44px}}
@media (max-width:600px){.lk-n{max-width:min(24ch,62vw)}}
`;
  document.head.appendChild(css);
})();

