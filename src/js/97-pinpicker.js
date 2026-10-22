/* ===== module: 97-pinpicker.js ===== */
/* A pin picker for notes. The pin list is long (a dozen basics plus a few pins for every scene theme), so instead of a long drop-down each
   note gets a button that opens a searchable gallery: a search box, quick filters (All, Basic, Your Theme, Free) and the pins grouped by theme
   (your theme first, the rest folded away until you search or open them). The note's real <select class="note-pin"> stays in the page (hidden)
   and still does the saving, so locks, Undo and sync all behave exactly as before. */
(() => {
  let S = null;   // {id: note id, q, chip, open: {theme: true}}
  const themeName = id => { const s = SKINS.find(x => x.id === id); return s ? s.name : id; };
  const defId = () => (PINS.find(x => x.id === styleCfg().pin) || PINS[0]).id;
  const curTheme = () => { try { return document.documentElement.dataset.skin || effSkinId() || ""; } catch (e) { return ""; } };
  const themeOrder = () => { const t = window.SBTP ? SBTP.ordered() : []; PINS.forEach(p => { if (p.theme && t.indexOf(p.theme) < 0) t.push(p.theme); }); return t; };
  const chosen = id => { const n = state.notes[id]; return n && n.pin && n.pin !== defId() ? n.pin : defId(); };
  const hay = p => (pinBase(p) + " " + (p.desc || "") + " " + (p.theme ? themeName(p.theme) : tr("pp.basicWord", "basic classic")) + " " + (p.tier === "pro" ? "pro" : "free")).toLowerCase();
  const CHIPS = () => [["all", tr("pp.all", "All")], ["basic", tr("pp.basic", "Basic")], ["theme", tr("pp.yourTheme", "Your Theme")], ["free", tr("pp.free", "Free")]];

  function matches(p){
    const q = S.q.trim().toLowerCase();
    if (q && !q.split(/\s+/).every(w => hay(p).includes(w))) return false;
    if (S.chip === "basic") return !p.theme;
    if (S.chip === "theme") return !!curTheme() && p.theme === curTheme();
    if (S.chip === "free") return owns("pin", p.id);
    return true;
  }
  function tile(p, i){
    const on = chosen(S.id) === p.id, locked = !owns("pin", p.id), isDef = p.id === defId();
    const name = pinBase(p) + (isDef ? " (" + tr("pp.default", "Default") + ")" : "");
    return `<button type="button" class="pp-tile${on ? " on" : ""}${locked ? " locked" : ""}" data-act="pp-pick" data-id="${esc(p.id)}" aria-pressed="${on}" aria-label="${esc(name + (locked ? ", " + tr("pp.locked", "needs Pro") : "") + (on ? ", " + tr("pp.selected", "selected") : ""))}">
      ${noteDemo(noteShapeOf(null), p.id, i)}<span class="pp-name">${esc(name)}${p.tier === "pro" ? ` <span class="pp-pro" aria-hidden="true">✦</span>` : ""}</span>${locked ? `<span class="pp-lock" aria-hidden="true">🔒</span>` : ""}</button>`;
  }
  function results(){
    const searching = !!S.q.trim(), list = PINS.filter(matches);
    const basic = list.filter(p => !p.theme), order = themeOrder().filter(th => list.some(p => p.theme === th));
    let n = 0, html = "";
    if (basic.length) html += `<section class="pp-group"><h3 class="pp-h">${esc(tr("pp.basicH", "Basic Pins"))} <span class="pp-n">${basic.length}</span></h3><div class="pp-grid" role="group" aria-label="${esc(tr("pp.basicH", "Basic Pins"))}">${basic.map(p => tile(p, n++)).join("")}</div></section>`;
    order.forEach(th => {
      const ps = list.filter(p => p.theme === th), open = searching || S.chip === "theme" || !!S.open[th] || chosenTheme() === th;
      html += `<details class="pp-group" data-theme="${esc(th)}"${open ? " open" : ""}><summary><span class="pp-h">${esc(themeName(th))}${th === curTheme() ? ` <span class="pp-now">${esc(tr("pp.now", "Your Theme"))}</span>` : ""}</span> <span class="pp-n">${ps.length}</span></summary><div class="pp-grid" role="group" aria-label="${esc(themeName(th))}">${ps.map(p => tile(p, n++)).join("")}</div></details>`;
    });
    const count = trn("pp.count", list.length, "{n} pin|{n} pins");
    return {html: html || `<p class="empty-note">${esc(tr("pp.none", "No pins match that. Try a shorter word, like “heart” or “tape”."))}</p>`, count};
  }
  const chosenTheme = () => { const p = PINS.find(x => x.id === chosen(S.id)); return p && p.theme || ""; };
  function draw(){
    const r = results(), box = dlg.querySelector("#ppRes"); if (!box) return;
    const top = box.scrollTop; box.innerHTML = r.html; box.scrollTop = top;
    const c = dlg.querySelector("#ppCount"); if (c) c.textContent = r.count;
    dlg.querySelectorAll(".pp-chip").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.id === S.chip)));
  }
  function open(id){
    if (!state.notes[id]) return;
    S = {id, q: "", chip: "all", open: {}};
    openSheet(`<div class="sheet pp-sheet">${head(tr("pp.title", "Choose a Pin"))}
      <div class="sheet-body pp-body">
        <label class="f pp-search"><span class="lh">${esc(tr("pp.search", "Search pins"))}</span><input type="search" id="ppQ" autocomplete="off" spellcheck="false" placeholder="${esc(tr("pp.ph", "Try “heart”, “tape” or a theme name"))}"></label>
        <div class="pp-chips" role="group" aria-label="${esc(tr("pp.filters", "Filter pins"))}">${CHIPS().map(([k, l]) => `<button type="button" class="pp-chip" data-act="pp-chip" data-id="${k}" aria-pressed="${k === "all"}">${esc(l)}</button>`).join("")}</div>
        <p class="mini pp-count" id="ppCount" aria-live="polite"></p>
        <div class="pp-res" id="ppRes"></div>
      </div></div>`);
    const q = dlg.querySelector("#ppQ"); if (q) q.addEventListener("input", () => { S.q = q.value; draw(); });
    dlg.querySelector("#ppRes").addEventListener("click", e => { const sm = e.target.closest("summary"); if (!sm || !sm.parentElement.dataset.theme) return; S.open[sm.parentElement.dataset.theme] = !sm.parentElement.open; });
    draw();
    // the current pin's group is already open: bring its tile into view
    setTimeout(() => { const on = dlg.querySelector(".pp-tile.on"); if (on && on.scrollIntoView) on.scrollIntoView({block: "center"}); if (q && !(window.matchMedia && matchMedia("(pointer:coarse)").matches)) q.focus(); }, 30);
  }
  function pick(pid){
    if (!S) return;
    const sel = document.querySelector(`select.note-pin[data-id="${CSS.escape(S.id)}"]`), noteId = S.id;
    if (!owns("pin", pid)) { if (dlg.open) dlg.close(); shopUnlock("pin", pid); return; }
    if (sel) { sel.value = pid === defId() ? "" : pid; sel.dispatchEvent(new Event("change", {bubbles: true})); }
    if (dlg.open) dlg.close();
    setTimeout(() => { const b = document.querySelector(`.pp-btn[data-id="${CSS.escape(noteId)}"]`); if (b) b.focus(); }, 80);
  }
  // Every note's pin drop-down becomes a button showing its pin; the drop-down stays (hidden) as the thing that saves
  function enhance(){
    document.querySelectorAll("select.note-pin").forEach(sel => {
      const id = sel.dataset.id, p = PINS.find(x => x.id === chosen(id)) || PINS[0], isDef = p.id === defId();
      const label = pinBase(p) + (isDef ? " (" + tr("pp.default", "Default") + ")" : "");
      let btn = sel.previousElementSibling && sel.previousElementSibling.classList.contains("pp-btn") ? sel.previousElementSibling : null;
      if (!btn) { btn = document.createElement("button"); btn.type = "button"; btn.className = "pp-btn"; btn.dataset.act = "pp-open"; btn.dataset.id = id; sel.parentNode.insertBefore(btn, sel); }
      btn.innerHTML = `<span class="pp-btn-pin" aria-hidden="true">${pinHtml(p.id)}</span><span class="pp-btn-name">${esc(label)}</span><svg class="pp-chev" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>`;
      btn.setAttribute("aria-label", tr("pp.btnAria", "Pin: {name}. Choose a different pin", {name: label}));
      btn.setAttribute("aria-haspopup", "dialog");
      sel.classList.add("pp-native"); sel.tabIndex = -1; sel.setAttribute("aria-hidden", "true");
    });
  }
  hook("render", () => { try { enhance(); } catch (e) { console.warn("pin picker", e); } });
  hook("act", (a, el) => {
    if (a === "pp-open") { open(el.dataset.id); return true; }
    if (a === "pp-pick") { pick(el.dataset.id); return true; }
    if (a === "pp-chip") { if (S) { S.chip = el.dataset.id; draw(); } return true; }
    return false;
  });
  window.SBPINPICK = {open, enhance, state: () => state, ui, render, pins: () => PINS};   // the last four are for tests, like the other modules
})();

