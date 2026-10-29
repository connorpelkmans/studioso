/* ===== module: 01-render.js: the app's core, render and dialogs ===== */
/* Render */
let renderQueued = false, renderBlocked = false;
let renderHold = 0;
function scheduleRender(){
  if (renderQueued) return;
  renderQueued = true;
  const go = () => { const w = renderHold - Date.now(); if (w > 0) { setTimeout(() => requestAnimationFrame(go), w); return; } renderQueued = false; render(); };
  requestAnimationFrame(go);
}
// A finished check pops before the list redraws (phones, when motion is on)
function popDone(el){
  if (!el || !el.isConnected || !el.classList || !el.classList.contains("check") || !window.matchMedia) return;
  if (!matchMedia("(max-width:639px)").matches || matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.dataset.motion === "static") return;
  el.classList.add("sb-pop");
  const row = el.closest("li, .plan-row, .nu-row, .card, .next-up");
  if (row) row.classList.add("sb-popped");
  renderHold = Math.max(renderHold, Date.now() + 300);
}
// The big button at the bottom right does the main "add" for the page you're on
function fabConfig(){
  if ((VIEWS[ui.tab] && ui.tab !== "groups") || ui.tab === "archive") return null;
  if (ui.tab === "courses" && ui.courseId && ui.courseTab === "lectures" && ui.courseTabFor === ui.courseId && window.SBLEC && SBLEC.canAdd()) return {act: "fab-lecture", label: "Add Lecture"};
  if (ui.tab === "courses") return ui.courseId || ui.courseTab === "grades" ? null : {act: "fab-course", label: "Add Course"};
  if (ui.tab === "files") return {act: "fab-file", label: "Add File"};
  if (ui.tab === "schedule") return {act: "sch-add", label: "Add Event"};
  if (ui.tab === "notes") return window.SBWB && SBWB.on() ? {act: "wb-new", label: "Add Board"} : {act: "fab-note", label: "Add Note"};
  if (ui.tab === "flashcards") { const dk = $("#view [data-fc-deck]"); return dk ? {act: "fc-add", label: "Add Card", id: dk.dataset.fcDeck} : $("#view [data-fc-list]") ? {act: "fab-deck", label: "Add Deck"} : $("#view [data-qz-list]") ? {act: "qz-add", label: "Add Quiz"} : null; }
  if (ui.tab === "groups") return $("#view [data-grp-list]") ? {act: "fab-group", label: "Add Group"} : (window.SBGRPFAB && window.SBGRPFAB()) || null;
  return {act: "new-task", label: "Add Task"};
}
function refreshFab(){
  const fab = $("#fab"), cfg = fabConfig(); if (!fab) return;
  fab.style.display = cfg ? "" : "none";
  if (cfg) { fab.dataset.act = cfg.act; if (cfg.id) fab.dataset.id = cfg.id; else delete fab.dataset.id; const sp = fab.querySelector("span"); if (sp && sp.textContent !== cfg.label) sp.textContent = cfg.label; }
}
// The app tour's example planner (49-apptour.js)
let tourDemo = null, demoDrawing = false;
function render(){
  if (!tourDemo || demoDrawing) return renderNow();
  const real = state; demoDrawing = true; state = Object.assign({}, tourDemo, {settings: real.settings, trash: {}});
  try { return renderNow(); } finally { state = real; demoDrawing = false; FOCUS = null; }
}
function renderNow(){
  if (renderBlocked) { renderQueued = false; setTimeout(scheduleRender, 120); return; }
  try { AUTO_ON = autoState().on; } catch(e) { AUTO_ON = false; }
  if (window.__SB_TEST && window.__sbForceAuto) AUTO_ON = true;
  try { const want = (s => skinOk(s) && SKINS.some(x => x.id === s) ? s : "classic")(styleCfg().skin); if ((document.documentElement.dataset.skin || "classic") !== want) applySkin(); } catch(e) {}
  computeFocus(); remoteStoreSoon();
  // the date, and what today is at school (Day 3, B Day, or a day off)
  const sdT = (() => { try { return schoolDayText(todayISO()); } catch (e) { return ""; } })();
  { const nd = new Date(); $("#navDate").innerHTML = esc(nd.toLocaleDateString(undefined, {weekday:"short", month:"short", day:"numeric"})) + (sdT ? `<span class="nd-sd">${esc(sdT)}</span>` : ""); }
  { const sk = streakOf(); $("#todayLabel").innerHTML = `<span class="wd">${esc(new Date().toLocaleDateString(undefined, {weekday:"long"}))}</span> ${esc(new Date().toLocaleDateString(undefined, {month:"long", day:"numeric"}))}${sdT ? ` <span class="nd-sd">· ${esc(sdT)}</span>` : ""}${sk.cur >= 2 && !(window.SBSTREAK && SBSTREAK.on()) ? `<button class="streak-chip" data-act="daily-quote" title="${esc(streakLine())}">🔥 ${sk.cur}</button>` : ""}`; }
  if (ui.tab === "plan" || ui.tab === "calendar") ui.tab = ui.planView;
  if (isPlanTab(ui.tab)) planViewSet(ui.tab);
  const navTab = isPlanTab(ui.tab) ? "plan" : ui.tab === "files" || ui.tab === "emails" ? "courses" : ui.tab;
  $$("nav.tabs button").forEach(b => b.setAttribute("aria-current", b.dataset.tab === navTab ? "page" : "false"));
  document.body.classList.add("wide");
  const v = $("#view");
  const y = window.scrollY;
  const nt = $("#noteText"), ntVal = nt ? nt.value : null, ntFocus = nt && document.activeElement === nt, ntSel = nt ? [nt.selectionStart, nt.selectionEnd] : null;
  const nbs = $("#nbScroll"), nbPos = nbs ? [nbs.scrollLeft, nbs.scrollTop] : null;
  const bds = $$(".board").map(b => b.scrollLeft);
  const fk = focusKeep(v);
  v.innerHTML = (isPlanTab(ui.tab) ? planHeadHtml() + planSwitchHtml() : isCfTab(ui.tab) && !(ui.tab === "courses" && ui.courseId) ? cfSwitchHtml() : "") + (VIEWS[ui.tab] ? VIEWS[ui.tab]() : ui.tab === "archive" ? viewArchive() : ui.tab === "schedule" ? viewSchedule() : ui.tab === "timeline" ? viewTimeline() : ui.tab === "courses" ? viewCourses() : ui.tab === "files" ? viewFiles() : ui.tab === "notes" ? viewNotes() : ui.tab === "flashcards" ? viewFlashcards() : viewBoard());
  pageHeadUp(v);
  refreshFab();
  document.body.dataset.view = ui.tab;
  const nbs2 = $("#nbScroll"); if (nbs2) fitNoteBoard(); if (nbs2 && nbPos) { nbs2.scrollLeft = nbPos[0]; nbs2.scrollTop = nbPos[1]; }
  const nt2 = $("#noteText");
  if (nt2 && ntVal !== null) { nt2.value = ntVal; if (ntFocus) { nt2.focus(); try { nt2.setSelectionRange(ntSel[0], ntSel[1]); } catch(e){} } }
  const sc = $(".tl-scroll");
  if (sc) {
    if (ui.tlJump || ui.tlScroll == null) {
      const lw = Number(($(".tl", sc) || {dataset: {}}).dataset.lw || 0), dw = Number(sc.dataset.dw || 22);
      const target = Math.max(0, Number(sc.dataset.today || 0) + dw / 2 - (sc.clientWidth - lw) / 2);
      if (ui.tlJump === "smooth") { const from = ui.tlScroll || 0; sc.scrollLeft = from; sc.scrollTo({left: target, behavior: "smooth"}); flashToday(); } else sc.scrollLeft = target;
      ui.tlJump = false;
    }
    else sc.scrollLeft = ui.tlScroll;
    ui.tlScroll = sc.scrollLeft;
    sc.addEventListener("scroll", () => { ui.tlScroll = sc.scrollLeft; }, {passive: true});
  }
  drawDeps();
  if (Math.abs(window.scrollY - y) > 1) window.scrollTo(0, y);
  restoreBoards(bds);
  if (AUTO_ON) autoKick();
  if (ui.tab === "notes") fitNoteBoard();
  fire("render", ui.tab);
  focusBack(v, fk);
  if (Math.abs(window.scrollY - y) > 1) window.scrollTo(0, y);
}
// Keyboard focus survives a redraw: the same control, or the nearest one after it, or the page itself
const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),summary,[tabindex]:not([tabindex="-1"])';
function focusSel(el){
  const d = el.dataset || {};
  if (el.id) return "#" + CSS.escape(el.id);
  if (d.act) return `[data-act="${CSS.escape(d.act)}"]` + (d.id ? `[data-id="${CSS.escape(d.id)}"]` : "");
  if (d.tab) return `[data-tab="${CSS.escape(d.tab)}"]`;
  if (d.note) return `[data-note="${CSS.escape(d.note)}"]`;
  if (el.name) return `${el.tagName.toLowerCase()}[name="${CSS.escape(el.name)}"]`;
  return null;
}
function focusKeep(v){
  const a = document.activeElement;
  if (!a || a === v || !v.contains(a)) return null;
  const all = [...v.querySelectorAll(FOCUSABLE)], i = all.indexOf(a), own = focusSel(a);
  const near = all.slice(i + 1, i + 8).concat(all.slice(Math.max(0, i - 6), Math.max(0, i)).reverse()).map(focusSel).filter(Boolean);
  return {own, nth: own ? [...v.querySelectorAll(own)].indexOf(a) : 0, near, value: a.value, sel: "selectionStart" in a ? (() => { try { return [a.selectionStart, a.selectionEnd]; } catch (e) { return null; } })() : null};
}
function focusBack(v, k){
  if (!k) return;
  const a = document.activeElement;
  if (a && a !== document.body && a !== v && a.isConnected) return;
  const shown = el => el && el.getClientRects().length > 0 && !el.disabled;
  let t = null;
  if (k.own) { const m = [...v.querySelectorAll(k.own)]; t = shown(m[k.nth]) ? m[k.nth] : m.find(shown) || null; }
  for (let i = 0; !t && i < k.near.length; i++) t = [...v.querySelectorAll(k.near[i])].find(shown) || null;
  try { (t || v).focus({preventScroll: true}); } catch (e) {}
  if (t && k.sel && t.value === k.value) { try { t.setSelectionRange(k.sel[0], k.sel[1]); } catch (e) {} }
}
// Size the note board to its notes
function fitNoteBoard(){
  const board = $("#nbBoard"); if (!board || (drag && drag.kind === "note" && drag.started)) return;
  let w = 0, h = 0;
  board.querySelectorAll(".note:not(.n-sheet)").forEach(n => { w = Math.max(w, n.offsetLeft + n.offsetWidth); h = Math.max(h, n.offsetTop + n.offsetHeight); });
  board.style.width = w ? (w + 28) + "px" : "";
  board.style.height = h ? (h + 28) + "px" : "";
  nbZoomApply();
}
/* -- Note board zoom */
const NBZ_KEY = "studyboard:noteZoom", NBZ_MIN = 0.4, NBZ_MAX = 2;
let NBZ = 1; try { NBZ = Math.min(NBZ_MAX, Math.max(NBZ_MIN, Number(localStorage.getItem(NBZ_KEY)) || 1)); } catch (e) {}
const nbZ = () => NBZ;
function nbZoomCtl(){
  const pct = Math.round(NBZ * 100);
  return `<div class="nb-zoom" role="group" aria-label="Board zoom"><button type="button" class="nbz-b" data-act="nb-zoom" data-id="out" aria-label="Zoom out"${NBZ <= NBZ_MIN + 0.001 ? " disabled" : ""}>−</button><button type="button" class="nbz-pct${pct === 100 ? "" : " on"}" data-act="nb-zoom" data-id="reset" aria-label="${pct === 100 ? "Zoom 100%" : `Zoom ${pct}%. Back to 100%`}" title="Back to 100%">${pct === 100 ? "100%" : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/></svg>${pct}%`}</button><button type="button" class="nbz-b" data-act="nb-zoom" data-id="in" aria-label="Zoom in"${NBZ >= NBZ_MAX - 0.001 ? " disabled" : ""}>+</button></div>`;
}
function nbZoomApply(){
  const sc = $("#nbScroll"), sz = $("#nbSizer"), b = $("#nbBoard"); if (!sc || !sz || !b) return;
  if (Math.abs(NBZ - 1) < 0.001) { b.style.transform = ""; b.style.minWidth = b.style.minHeight = ""; sz.style.width = sz.style.height = ""; sz.classList.remove("zoomed"); return; }
  sz.classList.add("zoomed"); sz.style.setProperty("--nbz", NBZ);
  b.style.transform = `scale(${NBZ})`;
  b.style.minWidth = (sc.clientWidth / NBZ) + "px"; b.style.minHeight = (sc.clientHeight / NBZ) + "px";
  sz.style.width = (b.offsetWidth * NBZ) + "px"; sz.style.height = (b.offsetHeight * NBZ) + "px";
}
// Zoom to z, keeping the point under (cx, cy) on the screen where it is
function nbZoomTo(z, cx, cy){
  const sc = $("#nbScroll"); if (!sc) return;
  z = Math.round(Math.min(NBZ_MAX, Math.max(NBZ_MIN, z)) * 100) / 100;
  if (Math.abs(z - NBZ) < 0.001) return;
  const r = sc.getBoundingClientRect(), px = (cx == null ? r.left + sc.clientWidth / 2 : cx) - r.left, py = (cy == null ? r.top + sc.clientHeight / 2 : cy) - r.top;
  const bx = (sc.scrollLeft + px) / NBZ, by = (sc.scrollTop + py) / NBZ;
  NBZ = z; try { localStorage.setItem(NBZ_KEY, String(z)); } catch (e) {}
  nbZoomApply();
  sc.scrollLeft = bx * z - px; sc.scrollTop = by * z - py;
  const ctl = document.querySelector(".nb-zoom"); if (ctl) ctl.outerHTML = nbZoomCtl();
}
const NBZ_STEPS = [0.4, 0.5, 0.6, 0.75, 0.9, 1, 1.25, 1.5, 1.75, 2];
function nbZoomStep(dir){ const z = dir > 0 ? NBZ_STEPS.find(v => v > NBZ + 0.001) : [...NBZ_STEPS].reverse().find(v => v < NBZ - 0.001); if (z) nbZoomTo(z); }
// Trackpad pinch (Chrome, Edge, Firefox send it as Ctrl + wheel) and Ctrl/⌘ + mouse wheel
document.addEventListener("wheel", e => {
  if (!(e.ctrlKey || e.metaKey) || ui.tab !== "notes" || !e.target.closest || !e.target.closest("#nbScroll")) return;
  e.preventDefault();
  nbZoomTo(NBZ * Math.exp(-Math.max(-50, Math.min(50, e.deltaY)) * (e.deltaMode === 1 ? 0.05 : 0.01)), e.clientX, e.clientY);
}, {passive: false});
// Safari on a Mac trackpad
let nbGest = null;
document.addEventListener("gesturestart", e => { if (ui.tab === "notes" && e.target.closest && e.target.closest("#nbScroll")) { e.preventDefault(); nbGest = {z: NBZ}; } });
document.addEventListener("gesturechange", e => { if (nbGest) { e.preventDefault(); nbZoomTo(nbGest.z * e.scale, e.clientX, e.clientY); } });
document.addEventListener("gestureend", e => { if (nbGest) { e.preventDefault(); nbGest = null; } });
// Phones and tablets
let nbPinch = null;
const nbTouchMid = t => ({x: (t[0].clientX + t[1].clientX) / 2, y: (t[0].clientY + t[1].clientY) / 2, d: Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY)});
document.addEventListener("touchstart", e => {
  if (ui.tab !== "notes" || e.touches.length !== 2 || !e.target.closest || !e.target.closest("#nbScroll") || (drag && drag.started) || (typeof sDrag !== "undefined" && sDrag)) return;
  const m = nbTouchMid(e.touches); if (m.d < 10) return;
  nbPinch = {z: NBZ, d: m.d}; nbHoldCancel();
  e.preventDefault();
}, {passive: false});
document.addEventListener("touchmove", e => {
  if (!nbPinch || e.touches.length !== 2) return;
  e.preventDefault();
  const m = nbTouchMid(e.touches); nbZoomTo(nbPinch.z * m.d / nbPinch.d, m.x, m.y);
}, {passive: false});
document.addEventListener("touchend", e => { if (nbPinch && e.touches.length < 2) nbPinch = null; });
document.addEventListener("touchcancel", () => { nbPinch = null; });
// Keep each board strip where it was across redraws; after a drop
function restoreBoards(prev){
  const boards = $$(".board");
  boards.forEach((b, i) => { if (prev[i] != null) b.scrollLeft = prev[i]; });
  const f = ui.boardFocus; ui.boardFocus = null;
  if (!f) return;
  const col = $$(".board .col").find(c => c.dataset.status === f.status && (f.course == null || c.dataset.course === f.course));
  if (!col) return;
  const b = col.closest(".board");
  if (b.scrollWidth <= b.clientWidth + 2) return;
  const pad = parseFloat(getComputedStyle(b).scrollPaddingLeft) || parseFloat(getComputedStyle(b).paddingLeft) || 0;
  b.scrollLeft += col.getBoundingClientRect().left - b.getBoundingClientRect().left - pad;
}
function flashToday(){
  const l = $(".tl-bg .today-line"), d = $(".tl-d.is-today");
  [l, d].forEach(x => { if (!x) return; x.classList.remove("flash"); void x.offsetWidth; x.classList.add("flash"); });
}
function drawDeps(){
  const tl = $(".tl"); if (!tl) return;
  const base = tl.getBoundingClientRect();
  const pos = id => {
    const els = $$(`.tl-track [data-id="${CSS.escape(id)}"]`, tl); if (!els.length) return null;
    const rs = els.map(e => e.getBoundingClientRect());
    return {l: Math.min(...rs.map(r => r.left)) - base.left, r: Math.max(...rs.map(r => r.right)) - base.left, y: rs[0].top + rs[0].height / 2 - base.top};
  };
  let paths = "";
  tasksArr().forEach(t => (t.dependsOn || []).forEach(pid => {
    const a = pos(pid), b = pos(t.id), pt = state.tasks[pid];
    if (!a || !b || !pt) return;
    const bad = t.due && pt.due && startOf(t) <= pt.due;
    const x1 = a.r, y1 = a.y, x2 = b.l, y2 = b.y, mx = Math.max(x1 + 8, Math.min(x2 - 8, x1 + 14));
    const d = x2 - 8 > x1 ? `M${x1} ${y1} H${mx} V${y2} H${x2 - 2}` : `M${x1} ${y1} h8 V${(y1 + y2) / 2} H${x2 - 12} V${y2} H${x2 - 2}`;
    paths += `<path d="${d}" class="${bad ? "bad" : ""}" marker-end="url(#${bad ? "arrBad" : "arr"})"/>`;
  }));
  if (!paths) return;
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", "deps"); svg.setAttribute("width", tl.scrollWidth); svg.setAttribute("height", tl.scrollHeight);
  svg.innerHTML = `<defs><marker id="arr" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L8 4L0 8z" class="head"/></marker><marker id="arrBad" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L8 4L0 8z" class="head bad"/></marker></defs>${paths}`;
  tl.appendChild(svg);
}
/* Dialogs */
const dlg = $("#dlg");
// A sheet with unsaved changes asks before it closes
let dlgGuard = null;
function dlgClose(){
  if (!(dlgGuard && dlgGuard())) { dlg.close(); return; }
  askBox({title: "Discard Changes?", text: "Your changes to this task aren't saved yet.", yes: "Discard", no: "Keep Editing", danger: true}).then(ok => { if (ok && dlg.open) { dlgGuard = null; dlg.close(); } });
}
function openSheet(html, onSubmit){
  dlgGuard = null;
  const tt = $("#toast"), inSheet = !!tt && tt.parentNode === dlg;
  if (inSheet) document.body.appendChild(tt);
  dlg.innerHTML = html;
  if (inSheet) dlg.appendChild(tt);
  const form = dlg.querySelector("form");
  if (form) form.addEventListener("submit", e => e.preventDefault());
  if (form && onSubmit) {
    const run = () => {
      const bad = [...form.querySelectorAll("input[required]")].find(i => !String(i.value).trim());
      if (bad) { bad.focus(); { const lb = bad.closest("label"), nm = lb ? (lb.querySelector(".lh,.lbl") || lb).firstChild : null; toast("Fill in the " + ((nm && nm.textContent || "").replace(/\*/g, "").trim().toLowerCase() || "required field") + " first"); } return; }
      let ok;
      try { ok = onSubmit(new FormData(form), form); }
      catch (err) { console.error(err); toast("Something went wrong saving that. Try again."); return; }
      if (ok !== false && dlg.open) dlg.close();
    };
    const btn = form.querySelector("[data-submit]");
    if (btn) btn.addEventListener("click", e => { e.preventDefault(); e.stopPropagation(); run(); });
    form.addEventListener("keydown", e => {
      if (e.key === "Enter" && e.target.tagName === "INPUT" && !e.target.hasAttribute("data-noenter") && !["checkbox","radio","button"].includes(e.target.type)) { e.preventDefault(); run(); }
    });
  }
  if (!dlg.open) dlg.showModal();
  const first = dlg.querySelector("[autofocus]");
  if (first && window.matchMedia("(min-width:601px)").matches) first.focus();
}
// A backdrop tap closes a sheet only when it both started and ended on the backdrop (not a text selection dragged out)
const backdropClose = (d, close) => { let down = false; d.addEventListener("pointerdown", e => { down = e.target === d; }); d.addEventListener("click", e => { const was = down; down = false; if (e.target === d && was) close(); }); };
backdropClose(dlg, () => dlgClose()); backdropClose($("#pomoDlg"), () => $("#pomoDlg").close());
dlg.addEventListener("keydown", e => { if (e.key === "Escape" && !e.defaultPrevented && dlgGuard && dlgGuard()) { e.preventDefault(); dlgClose(); } });
dlg.addEventListener("cancel", e => { if (dlgGuard && dlgGuard()) { e.preventDefault(); dlgClose(); } });
dlg.addEventListener("close", () => { dlgGuard = null; });
const FAB_IC = {
  course: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5M9 8h6"/>',
  syllabus: '<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5M10 13h6M10 17h4"/>',
  upload: '<path d="M12 16V5M7 9l5-5 5 5M5 19h14"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  note: '<path d="M4 4h16v10l-6 6H4z"/><path d="M14 20v-6h6"/>',
  write: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4M14 20h6"/>',
  deck: '<rect x="3" y="7" width="14" height="13" rx="2"/><path d="M7 4h12a2 2 0 0 1 2 2v11"/>',
  group: '<circle cx="9" cy="8" r="3.2"/><path d="M3 20a6 6 0 0 1 12 0M16 5.5a3 3 0 0 1 0 5.8M18 20a5.5 5.5 0 0 0-3-5"/>',
  project: '<rect x="3" y="4.5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v3M16 3v3M8 14h3"/>',
  code: '<rect x="3" y="7" width="18" height="10" rx="2"/><path d="M7 12h.01M11 12h.01M15 12h2"/>',
  school: '<path d="M3 9.5 12 5l9 4.5-9 4.5z"/><path d="M7 11.5V16c0 1.2 2.2 2.5 5 2.5s5-1.3 5-2.5v-4.5M21 9.5V15"/>'
};
// A pop-up of big, friendly choices
const fabMenu = (title, items) => { openSheet(`<div class="sheet fab-menu">${head(title)}<div class="sheet-body"><div class="menu-list fm-list">${items.map(([act, label, sub, ic, ai]) => `<button data-act="${act}"${ai ? ' class="ai-row"' : ""}><i class="fm-ic" aria-hidden="true">${ai ? AI_ICON : `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${FAB_IC[ic] || ""}</svg>`}</i><span class="fm-t"><b>${esc(label)}</b><span class="sub">${esc(sub)}</span></span><svg class="fm-go" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg></button>`).join("")}</div></div></div>`);
  const fl = dlg.querySelector(".fm-list"); if (fl) fl.addEventListener("click", e => { if (e.target.closest("button[data-act]") && dlg.open) dlg.close(); }, true); };
const head = title => `<div class="sheet-head"><h2>${esc(title)}</h2><button type="button" class="icon-btn" data-act="close" aria-label="Close">${CLOSE}</button></div>`;
// A sheet header with a colour band and a line icon in a ring (Direction 1)
const bandHead = (title, icon, color, sub, big) => `<div class="sheet-head g2-sheet-head${big ? " sh-big" : ""}" style="--c:${esc(color)}"><span class="g2-ring sh-ring" aria-hidden="true">${icon}</span>${big ? `<span class="sh-kick">${esc(title)}</span><div class="sh-t"><h2 class="sh-name">${big}</h2></div>` : `<div class="sh-t"><h2>${esc(title)}</h2>${sub ? `<span class="mini">${sub}</span>` : ""}</div>`}<button type="button" class="icon-btn" data-act="close" aria-label="Close">${CLOSE}</button></div>`;
const SH_IC = {
  pencil: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16.5 3.5l4 4L8 20l-5 1 1-5z"/><path d="M14 6l4 4"/></svg>',
  timer: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="13.5" r="7.5"/><path d="M12 9.5v4l2.5 2M9.5 2.5h5M12 2.5v3.5"/></svg>'};
const seg = (name, opts, val) => `<div class="seg">${opts.map(([v, l]) => `<label><input type="radio" name="${name}" value="${v}" ${v === val ? "checked" : ""}><span>${l}</span></label>`).join("")}</div>`;

function gcalLink(t){
  const c = courseOf(t.courseId);
  const text = (c ? courseLabel(c) + ": " : "") + t.title;
  let dates;
  const d = t.due.replace(/-/g, "");
  if (t.time) {
    const st = d + "T" + t.time.replace(":", "") + "00";
    const e = parse(t.due); const [h, m] = t.time.split(":").map(Number); e.setHours(h + 1, m);
    dates = st + "/" + iso(e).replace(/-/g, "") + "T" + pad(e.getHours()) + pad(e.getMinutes()) + "00";
  } else dates = d + "/" + addDays(t.due, 1).replace(/-/g, "");
  const details = [t.type, "Priority: " + PRIO[t.priority], t.notes].filter(Boolean).join("\n");
  return "https://calendar.google.com/calendar/render?action=TEMPLATE&text=" + encodeURIComponent(text) + "&dates=" + dates + "&details=" + encodeURIComponent(details);
}

// Clicking a task shows it first; Edit opens the full form. The progress bar can be dragged right here.
let tvRedraw = null;
hook("changed", changes => { if (tvRedraw && dlg.open && dlg.querySelector(".tv") && !dlg.querySelector(".tv-bar.drag")) tvRedraw(changes); });
function taskView(t0){
  const id = t0.id, PSTEP = 5;
  const ic = d => `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const I = {cal: ic('<rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M3 10h18M8 3v4M16 3v4"/>'), start: ic('<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>'), clock: ic('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
    pin: ic('<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>'), book: ic('<path d="M4 19V5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M8 7h7"/>'),
    person: ic('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c1-3.5 3.5-5 6.5-5s5.5 1.5 6.5 5M16 4.5a3.5 3.5 0 0 1 0 7M18 15c2 .6 3.2 2.2 3.8 5"/>'), link: ic('<path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/>'),
    note: ic('<path d="M5 3h10l4 4v14H5z"/><path d="M9 11h6M9 15h6"/>'), lock: ic('<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>'), rep: ic('<path d="M17 2l3 3-3 3"/><path d="M4 11V9a4 4 0 0 1 4-4h12M7 22l-3-3 3-3"/><path d="M20 13v2a4 4 0 0 1-4 4H4"/>')};
  const draw = () => {
    const t = state.tasks[id]; if (!t) { if (dlg.open) dlg.close(); return; }
    const c = courseOf(t.courseId), cfg = cfgOf(t.type), ms = MILESTONE(t.type), done = t.status === "done", today = todayISO();
    const items = t.checklist || [], p = progress(t), fromCl = !ms && items.length > 0, drag = !fromCl && !p.ms;
    const val = drag ? Math.max(0, Math.min(100, Math.round(Number(t.pct) || 0))) : Math.round(p.frac * 100);
    const rows = [];
    if (t.due) {
      const n = dayDiff(today, t.due);
      rows.push([I.cal, esc(parse(t.due).toLocaleDateString(undefined, {weekday: "long", month: "long", day: "numeric"})) + (t.time && cfg.time ? ", " + esc(fmtTime(t.time)) : ""),
        esc(cfg.due) + (done ? "" : n === 0 ? " · Today" : n === 1 ? " · Tomorrow" : n > 1 ? ` · In ${n} days` : ` · ${-n} day${n === -1 ? "" : "s"} late`)]);
    } else rows.push([I.cal, "No due date", ""]);
    const st = !cfg.single && (t.start || startOf(t));
    if (st && st !== t.due) rows.push([I.start, esc(fmtDate(st)), esc(cfg.start || "Start Date")]);
    // once work has started, what's left (a range, from your pace, check-ins and how tasks like this usually go)
    const leftTxt = !done && !ms && (Number(t.focusMin) > 0 || progress(t).frac > 0) && remainingOf(t) > 0 ? ` · ${esc(leftRange(t))} left` : "";
    if (cfg.hours && isNum(t.hours) && !ms) rows.push([I.clock, esc(fmtH(Number(t.hours))), esc(cfg.hours) + (t.focusMin ? ` · ${esc(fmtMins(t.focusMin))} focused so far` : "") + leftTxt]);
    else if (t.focusMin) rows.push([I.clock, esc(fmtMins(t.focusMin)) + " focused", `${t.pomos || 0} focus session${t.pomos === 1 ? "" : "s"}` + leftTxt]);
    if (cfg.reading && t.reading) rows.push([I.book, esc(t.reading), esc(cfg.reading)]);
    if (cfg.location && t.location) rows.push([I.pin, esc(t.location), esc(cfg.location)]);
    if (cfg.team && t.team) rows.push([I.person, esc(t.team), esc(cfg.team)]);
    const url = cfg.link && t.link ? safeUrl(t.link) : "";
    if (url) rows.push([I.link, `<button type="button" class="link-btn" data-act="lms-go" data-url="${esc(url)}">Open in ${esc(lmsSite(t) || "browser")}</button>`, esc(cfg.link)]);
    const bl = blockers(t); if (bl.length && !done) rows.push([I.lock, esc(bl.map(x => x.title).join(", ")), "Finish first"]);
    if (t.seriesId) rows.push([I.rep, "Repeats", "Part of a repeating series"]);
    if (t.notes && t.notes.trim()) rows.push([I.note, `<span class="occv-notes">${esc(t.notes.trim())}</span>`, esc(cfg.notes)]);
    const late = !done && t.due && t.due < today;
    const tags = [`<span class="occv-tag">${esc(t.type || "Task")}</span>`, `<span class="occv-tag${done ? " ok" : ""}">${esc(statusLabels(t.type)[t.status] || t.status)}</span>`,
      t.priority && t.priority !== "med" ? `<span class="occv-tag${t.priority === "urgent" || t.priority === "high" ? " warn" : ""}">${esc((ms ? "Importance: " : "") + PRIO[t.priority])}</span>` : "", late ? `<span class="occv-tag warn">Late</span>` : ""].join("");
    const band = c ? `<span class="occv-ic" aria-hidden="true">${courseRingHtml(c)}</span><b>${esc(courseLabel(c))}</b>` : `<span class="occv-ic" aria-hidden="true">${typeIcon(t.type)}</span><b>${esc(t.type || "Task")}</b>`;
    const hint = !drag ? (p.ms ? `Progress comes from its milestones: ${p.done} of ${p.total} done.` : `Progress comes from the checklist: ${items.filter(i => i.done).length} of ${items.length} done.`)
      : "";
    // Exams: readiness measured from your results comes first; the slider is how ready you feel, and a big gap between them is pointed out
    const xr = ms && !done ? examReadiness(t) : null, feelLbl = ms ? "How Ready You Feel" : cfg.prog || "Progress";
    const ready = !xr ? "" : xr.measured != null ? `<div class="tv-prog ro tv-ready"><div class="tv-prog-h"><b>Readiness From Your Results</b><span>${xr.measured}%</span></div>
      <div class="tv-bar" role="progressbar" aria-label="Readiness from your results" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${xr.measured}" style="--v:${xr.measured}%"><i class="tv-fill"></i></div>
      <p class="mini tv-hint">From ${esc(readinessSource(xr))}.${xr.from === "both" ? " With a little more studying it will rely on these alone." : ""}${xr.parts.plan == null ? ` <button type="button" class="link-btn" data-act="xr-decks" data-id="${esc(t.id)}">Choose Which Flashcards and Quizzes Count</button>` : ""}</p>
      ${xr.gap ? `<p class="tv-gap ${xr.gap > 0 ? "over" : "under"}" role="note">${esc(readinessGapText(xr))}</p>` : ""}</div>`
      : `<p class="mini tv-hint tv-noready">Until you study this course's flashcards or take a practice quiz, readiness goes by how ready you feel. Your results will show here as you go.${decksArr().length ? ` <button type="button" class="link-btn" data-act="xr-decks" data-id="${esc(t.id)}">Choose Which Flashcards and Quizzes Count</button>` : ""}</p>`;
    const prog = ready + (window.SBWRAP ? SBWRAP.viewHtml(t) : "") + `<div class="tv-prog${drag ? "" : " ro"}"><div class="tv-prog-h"><b>${esc(feelLbl)}</b><span id="tvPct">${val}%</span></div>
      <div class="tv-bar" id="tvBar" ${drag ? `title="${ms ? "Drag to say how ready you feel" : "Drag to update your progress"}" role="slider" tabindex="0" aria-label="${esc(cfg.prog || "Progress")}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${val}" aria-valuetext="${val}%"` : `role="progressbar" aria-label="${esc(cfg.prog || "Progress")}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${val}"`} style="--v:${val}%"><i class="tv-fill"></i>${drag ? `<span class="tv-knob" aria-hidden="true"></span>` : ""}</div>
      ${hint ? `<p class="mini tv-hint">${esc(hint)}</p>` : ""}</div>`;
    const cl = items.length ? `<div class="tv-cl"><h3>${esc(cfg.checklist || "Checklist")} <span class="mini">${items.filter(i => i.done).length}/${items.length}</span></h3><ul>${items.map((i, k) => `<li class="${i.done ? "done" : ""}"><label><input type="checkbox" data-tv-cl="${k}" ${i.done ? "checked" : ""}><span>${esc(i.text)}</span></label></li>`).join("")}</ul></div>` : "";
    const prepBtn = ms && t.due > today && !done ? (ps => `<button type="button" class="btn" data-act="exam-plan" data-id="${esc(id)}">${ps.length ? `Prep Plan (${ps.filter(x => x.status === "done").length}/${ps.length})` : "Plan My Prep"}</button>`)(planSessions(id)) : "";
    const keep = document.activeElement && document.activeElement.id === "tvBar" && dlg.contains(document.activeElement), sc = dlg.querySelector(".occv-body"), top = sc ? sc.scrollTop : 0;
    openSheet(`<div class="sheet occv tv" style="--c:${esc(colorOf(t.courseId))}">
      <div class="occv-band">${band}<button type="button" class="icon-btn occv-x" data-act="close" aria-label="Close">${CLOSE}</button></div>
      <div class="sheet-body occv-body">
        <h2 class="occv-title">${esc(t.title)}</h2>
        <div class="occv-tags">${tags}</div>
        <ul class="occv-rows">${rows.map(([i, a, b]) => `<li><span class="occv-ri">${i}</span><div><b>${a}</b>${b ? `<span>${b}</span>` : ""}</div></li>`).join("")}</ul>
        ${cl}
        ${prog}
      </div>
      <div class="sheet-foot">${!done && canDoNow(t) ? `<button type="button" class="btn focus-btn" data-act="pomo-task" data-id="${esc(id)}">${TOMATO}Focus</button>` : ""}${prepBtn}<span class="spacer"></span><button type="button" class="btn" id="tvDone">${done ? "Mark Not Done" : "Mark Done"}</button><button type="button" class="btn primary" id="tvEdit">Edit</button></div>
    </div>`);
    const sc2 = dlg.querySelector(".occv-body"); if (sc2) sc2.scrollTop = top;
    $("#tvEdit").addEventListener("click", () => { const x = state.tasks[id]; if (x) taskForm(x); });
    $("#tvDone").addEventListener("click", () => { dlg.close(); toggleTask(id); });
    dlg.querySelectorAll("[data-tv-cl]").forEach(cb => cb.addEventListener("change", () => {
      const x = state.tasks[id]; if (!x) return; const n = clone(x), k = Number(cb.dataset.tvCl); if (!n.checklist[k]) return;
      n.checklist[k].done = cb.checked; applyChanges([{kind: "task", id, after: n}], cb.checked ? "Step done" : "Step not done");
    }));
    if (drag) wire($("#tvBar"), val, keep);
  };
  tvRedraw = changes => { if (changes.some(c => c.kind === "task" && c.id === id)) draw(); };
  // Pointer drag (mouse, touch, pen) plus arrow keys; the change saves when you let go
  const wire = (bar, start, refocus) => {
    let v = start, timer = 0, dragging = false;
    const show = x => { v = x; bar.style.setProperty("--v", x + "%"); bar.setAttribute("aria-valuenow", x); bar.setAttribute("aria-valuetext", x + "%"); $("#tvPct").textContent = x + "%"; };
    const at = e => { const r = bar.getBoundingClientRect(); return Math.max(0, Math.min(100, Math.round((e.clientX - r.left) / Math.max(1, r.width) * 100 / PSTEP) * PSTEP)); };
    bar.addEventListener("pointerdown", e => { if (e.button > 0) return; e.preventDefault(); dragging = true; bar.classList.add("drag"); try { bar.setPointerCapture(e.pointerId); } catch (err) {} bar.focus({preventScroll: true}); show(at(e)); });
    bar.addEventListener("pointermove", e => { if (dragging) show(at(e)); });
    const end = () => { if (!dragging) return; dragging = false; bar.classList.remove("drag"); commit(v); };
    bar.addEventListener("pointerup", end); bar.addEventListener("pointercancel", end); bar.addEventListener("lostpointercapture", end);
    bar.addEventListener("keydown", e => {
      const d = {ArrowRight: PSTEP, ArrowUp: PSTEP, ArrowLeft: -PSTEP, ArrowDown: -PSTEP, PageUp: 10, PageDown: -10}[e.key];
      let x = d != null ? v + d : e.key === "Home" ? 0 : e.key === "End" ? 100 : null; if (x == null) return;
      e.preventDefault(); show(Math.max(0, Math.min(100, x))); clearTimeout(timer); timer = setTimeout(() => commit(v), 600);
    });
    if (refocus) bar.focus({preventScroll: true});
  };
  const commit = v => {
    const x = state.tasks[id]; if (!x || !dlg.open || v === Math.round(Number(x.pct) || 0)) return;
    const n = clone(x); n.pct = v;
    let finished = false;
    if (!MILESTONE(x.type)) {
      const s = v >= 100 ? "done" : v > 0 ? "doing" : "todo";
      if (s !== x.status) { n.status = s; n.order = nextOrder(s); n.doneAt = s === "done" ? Date.now() : null; finished = s === "done"; }
    }
    if (finished) celebrate("check");
    applyChanges([{kind: "task", id, after: n}], finished ? `Completed ${x.title}` : `${x.title}: ${v}%`, undefined, finished ? {done: true} : undefined);
  };
  draw();
}

function taskForm(t, preset = {}){
  const isNew = !t;
  t = t ? clone(t) : normTask({id: uid(), title:"", courseId: preset.courseId || (ui.filter !== "all" ? ui.filter : ""), type:"Assignment",
    start: (preset.due && preset.due < todayISO()) ? preset.due : todayISO(), due: preset.due || "", status: preset.status || "todo"});
  let items = clone(t.checklist || []);
  const rxEff = isNew ? {v: "", src: ""} : remoteOf(t), rxInit = rxEff.v || "";
  let deps = (t.dependsOn || []).filter(id => state.tasks[id]);
  let attached = new Set(filesOfTask(t.id).map(f => f.id));
  let noteSet = new Set(notesOfTask(t.id).map(n => n.id)), newNotes = [];
  let planAfter = false;
  const canRepeat = isNew || !(t.seriesId || lmsOf(t) || t.prepFor || t.breakdownOf || t.breakdownParent || t.gt);
  const dependsOnSelf = (id, seen = new Set()) => { if (id === t.id) return true; if (seen.has(id)) return false; seen.add(id); return ((state.tasks[id] || {}).dependsOn || []).some(x => dependsOnSelf(x, seen)); };
  const courseOpts = `<option value="">No course</option>` + coursesArr().map(c => `<option value="${esc(c.id)}" ${c.id === t.courseId ? "selected" : ""}>${esc(c.name)}</option>`).join("");
  openSheet(`<form class="sheet">${bandHead(isNew ? "New Task" : "Edit Task", SH_IC.pencil, t.courseId ? colorOf(t.courseId) : "#2F6FE4", "", isNew ? "" : esc(t.title))}
    <div class="sheet-body">${REQ_NOTE}${window.SBBREAK ? SBBREAK.formHtml(isNew ? null : t, isNew) : ""}${!isNew && window.SBLINKED ? SBLINKED.taskHtml(t) : ""}
      <label class="f"><span class="lh">Title ${REQ}</span><input type="text" name="title" required maxlength="200" value="${esc(t.title)}" autofocus></label>
      <div class="two">
        <label class="f">Type<select name="type" id="tfType">${(window.SBAREA ? SBAREA.types() : TYPES).map(x => `<option ${x === t.type ? "selected" : ""}>${x}</option>`).join("")}</select></label>
        <label class="f">Course<select name="courseId">${courseOpts}</select></label>
      </div>
      <label class="f" data-fld="reading"><span class="lbl">What to Read</span><input type="text" name="reading" maxlength="200" value="${esc(t.reading)}" placeholder="e.g. Ch. 4, pp. 101–130"></label>
      <div class="two">
        <label class="f"><span><span class="lbl" id="dueLbl">Due Date</span> <span class="req" id="dueReq" aria-hidden="true" hidden>*</span></span><input type="date" name="due" value="${esc(t.due)}"></label>
        <label class="f" data-fld="time"><span class="lbl">Due Time</span><input type="time" name="time" value="${esc(t.time)}"></label>
      </div>
      <div class="two">
        <label class="f" data-fld="start"><span class="lbl">Start Date</span><input type="date" name="start" value="${esc(isNew ? t.start : (t.start || startOf(t) || ""))}"></label>
        ${canRepeat ? `<label class="f" id="repeatWrap">Repeat<select name="repeat"><option value="">Doesn't repeat</option><option value="1">Every day</option><option value="7">Every week</option><option value="14">Every 2 weeks</option><option value="m">Every month</option></select></label>` : ""}
      </div>
      ${canRepeat ? `<label class="f" id="untilWrap" hidden><span class="lh">Repeat Until <span class="hint" id="untilHint"></span></span><input type="date" name="until"></label>` : ""}
      <fieldset id="statusFs" ${isNew ? "hidden" : ""}><legend>Status</legend><div id="statusSeg">${seg("status", STATUSES.map(x => [x[0], statusLabels(t.type)[x[0]]]), t.status)}</div></fieldset>
      <fieldset data-fld="remote" id="rxFs" ${MILESTONE(t.type) ? "" : "hidden"}><legend>Where is this taken?</legend>${seg("remote", [["yes", "From home"], ["no", "In person"], ["", "Not sure"]], rxInit)}<p class="mini rx-note" id="rxNote" aria-live="polite"></p></fieldset>
      <fieldset><legend id="prioLbl">Priority</legend>${seg("priority", [["low","Low"],["med","Medium"],["high","High"],["urgent","Urgent"]], t.priority)}</fieldset>
      <label class="f" id="pctWrap" ${isNew ? "hidden" : ""}><span><span class="lbl" id="pctLbl">Progress</span> <span class="hint" id="pctOut">${t.pct}%</span></span><input type="range" name="pct" min="0" max="100" step="10" value="${t.pct}"><span class="mini" id="pctHint"></span></label>
      <p class="mini" id="pctFromCl" hidden style="margin:0"></p>
      ${!isNew && window.SBPREP ? SBPREP.formHtml(t) : ""}
      <label class="f"><span class="lbl" id="notesLbl">Notes</span><textarea name="notes" maxlength="5000">${esc(t.notes)}</textarea></label>
      ${!isNew && window.SBLMS_TASK ? SBLMS_TASK(t) : ""}
      ${!isNew && accOf() ? accOf().logHtml(t) : ""}
      <details class="adv" id="tfAdv" ${ui.advOpen ? "open" : ""}>
        <summary><span class="adv-title">Advanced Settings</span><span class="adv-sum" id="advSum"></span></summary>
        <div class="adv-body">
          <div class="two">
            <label class="f" data-fld="hours"><span class="lh"><span class="lbl">Hours Needed</span>${inPreview() ? "" : `<button type="button" class="link-btn est-btn" id="tfEst" data-act="tf-est">${aiReady() ? AI_ICON + " " : ""}Estimate</button>`}</span><input type="number" name="hours" min="0" step="0.25" inputmode="decimal" value="${isNum(t.hours) ? esc(t.hours) : ""}" placeholder="e.g. 3"></label>
          </div>
          <p class="mini est-hint" id="estHint" hidden aria-live="polite"></p>
          <p class="mini acc-hint" id="accHint" hidden aria-live="polite"></p>
          <label class="f" data-fld="location"><span class="lbl">Location</span><input type="text" name="location" maxlength="120" value="${esc(t.location)}" placeholder="e.g. Loew Hall 101"></label>
          <label class="f" data-fld="team"><span class="lbl">Team Members</span><input type="text" name="team" maxlength="200" value="${esc(t.team)}" placeholder="e.g. Ana, Ben, Chris"></label>
          <label class="f" data-fld="link"><span class="lh"><span class="lbl">Link</span>${t.link && safeUrl(t.link) ? `<button type="button" class="link-btn" data-act="lms-go" data-url="${esc(safeUrl(t.link))}">Open in ${esc(lmsSite(t) || "browser")}</button>` : ""}</span><input type="url" name="link" maxlength="500" value="${esc(t.link)}" placeholder="https://…"></label>
          <fieldset class="plan-fs"><legend>Planning Details <span class="hint">used to rank Today's Plan</span></legend>
            <div class="two">
              <label class="f"><span class="lh">Grade Weight <span class="hint">% of course grade</span></span><input type="number" name="weight" min="0" max="100" step="0.5" inputmode="decimal" value="${hasWeight(t) ? esc(t.weight) : ""}"></label>
              <label class="f">Late Work<select name="late">${Object.entries(LATE_LABEL).map(([k, l]) => `<option value="${k}" ${k === t.late ? "selected" : ""}>${l}</option>`).join("")}</select></label>
            </div>
            <label class="f" id="latePenWrap"${t.late === "penalty" ? "" : " hidden"}><span class="lh">Late Penalty <span class="hint">% off for each day late</span></span><input type="number" name="latePen" min="0" max="100" step="1" inputmode="decimal" value="${hasLatePen(t) ? esc(t.latePen) : ""}" placeholder="10"></label>
            <div><span class="lbl" style="font-size:.88rem;font-weight:600">Difficulty</span>${seg("difficulty", [["easy","Easy"],["med","Medium"],["hard","Hard"]], t.difficulty)}</div>
            <p class="plan-hint" id="planHint" aria-live="polite"></p>
          </fieldset>
          <fieldset><legend id="clLegend">Checklist</legend><ul class="cl-edit" id="clList"></ul>
            <div class="cl-new"><input type="text" id="clNew" placeholder="Add a step" data-noenter aria-label="New checklist item"><button type="button" class="btn small" id="clAdd">Add</button></div></fieldset>
          <fieldset><legend>Depends On</legend><div class="dep-list" id="depList"></div>
            <select id="depAdd" aria-label="Add a task this one depends on"></select></fieldset>
          <fieldset><legend>Files</legend><ul class="tf-files" id="tfFiles"></ul>
            <div class="cl-new"><select id="tfAttach" aria-label="Attach an existing file"></select><button type="button" class="btn small" id="tfUpload">Upload</button><input type="file" id="tfFile" multiple class="sr" tabindex="-1" aria-label="Choose files to attach"></div></fieldset>
          <fieldset><legend>Sticky Notes</legend><div class="tf-notes" id="tfNotes"></div>
            <div class="cl-new"><input type="text" id="tfNoteNew" placeholder="Write a new sticky note" maxlength="2000" data-noenter aria-label="New sticky note"><button type="button" class="btn small" id="tfNoteAddBtn">Add</button></div>
            <select id="tfNoteAttach" aria-label="Attach an existing sticky note"></select></fieldset>
          ${!isNew && t.pomos ? `<p class="mini" style="margin:0">${TOMATO} ${t.pomos} focus session${t.pomos === 1 ? "" : "s"}, ${fmtMins(t.focusMin)} focused on this task.</p>` : ""}
        </div>
      </details>
      ${!isNew && t.due ? `<div class="link-row"><a href="${esc(gcalLink(t))}" target="_blank" rel="noopener noreferrer">Add to Google Calendar</a></div>` : ""}
      ${!isNew && t.seriesId ? `<p class="mini" style="margin:0">${REPEAT} Part of a repeating series. Changes here apply to this task only.</p>` : ""}
      ${!isNew && t.history.length ? `<details class="hist"><summary>History (${t.history.length})</summary><ul>${t.history.slice().reverse().map(h => `<li><span>${esc(h.text)}</span><time>${esc(new Date(h.at).toLocaleString(undefined, {month:"short", day:"numeric", hour:"numeric", minute:"2-digit"}))}</time></li>`).join("")}</ul></details>` : ""}
    </div>
    <div class="sheet-foot">${isNew ? "" : `<button type="button" class="btn danger" data-act="delete-task" data-id="${esc(t.id)}">Delete</button>${canDoNow(t) ? `<button type="button" class="btn focus-btn" data-act="pomo-task" data-id="${esc(t.id)}">${TOMATO}Focus</button>` : ""}${MILESTONE(t.type) && t.due > todayISO() && t.status !== "done" ? (ps => `<button type="button" class="btn" data-act="exam-plan" data-id="${esc(t.id)}">${ps.length ? `Prep Plan (${ps.filter(x => x.status === "done").length}/${ps.length})` : "Plan My Prep"}</button>`)(planSessions(t.id)) : ""}${t.type === "Study" && (t.studyDecks || []).some(id => state.decks[id]) ? `<button type="button" class="btn" data-act="${t.studyKind === "practice" ? "fc-practice-plan" : "fc-study-plan"}" data-id="${esc(t.id)}">${t.studyKind === "practice" ? "Practice Quiz" : "Study Cards"}</button>` : ""}`}<span class="spacer"></span><button type="button" class="btn" data-act="close">Cancel</button>${isNew ? `<button type="button" class="btn" id="tfPlanPrep" hidden>Add &amp; Plan Prep</button>` : ""}<button type="button" class="btn primary" data-submit>${isNew ? "Add Task" : "Save Task"}</button></div>
  </form>`, fd => {
    const title = String(fd.get("title") || "").trim();
    if (!title) return false;
    const pending = $("#clNew").value.trim();
    if (pending) items.push({id: uid(), text: pending, done: false});
    const hours = fd.get("hours");
    const type = fd.get("type") || "Assignment", cfg = cfgOf(type);
    const txt = k => String(fd.get(k) || "").trim();
    let link = "";
    if (cfg.link && txt("link")) { link = safeUrl(txt("link")); if (!link) { toast("Enter a valid web address for the link"); return false; } }
    const due = fd.get("due") || "";
    const data = {
      title, courseId: fd.get("courseId") || "", type,
      start: cfg.single ? due : (fd.get("start") || ""), due, time: cfg.time ? (fd.get("time") || "") : "",
      status: fd.get("status") || "todo", priority: fd.get("priority") || "med",
      notes: String(fd.get("notes") || ""), hours: !cfg.hours || hours === "" || hours === null ? null : Number(hours),
      checklist: items.filter(i => i.text.trim()).map(i => ({id: i.id, text: i.text.trim(), done: !!i.done})),
      pct: Number(fd.get("pct") || 0), dependsOn: deps.slice(),
      weight: isNum(fd.get("weight")) && Number(fd.get("weight")) > 0 ? Math.min(100, Number(fd.get("weight"))) : null,
      difficulty: fd.get("difficulty") || "med", late: fd.get("late") || "unknown",
      latePen: fd.get("late") === "penalty" && isNum(fd.get("latePen")) && Number(fd.get("latePen")) > 0 ? Math.min(100, Number(fd.get("latePen"))) : null,
      location: cfg.location ? txt("location") : "", team: cfg.team ? txt("team") : "", reading: cfg.reading ? txt("reading") : "", link
    };
    if (MILESTONE(type)) {
      const rv = String(fd.get("remote") || "");
      if (rv !== rxInit) { if (rv === "yes" || rv === "no") Object.assign(data, {remote: rv, remoteSrc: "user", remoteWhy: "You set this", remoteAt: Date.now(), remoteSig: ""}); else Object.assign(data, {remote: "", remoteSrc: "", remoteWhy: "", remoteAt: 0, remoteSig: ""}); }
    }
    if (cfg.single && !due) { toast(`Pick the ${type.toLowerCase()} date`); dlg.querySelector("input[name=due]").focus(); return false; }
    const pendNote = $("#tfNoteNew").value.trim(); if (pendNote) newNotes.push(pendNote);
    const noteChanges = notesArr().filter(n => noteSet.has(n.id) !== (n.taskId === t.id)).map(n => ({kind:"note", id: n.id, after: Object.assign(clone(n), {taskId: noteSet.has(n.id) ? t.id : ""})}));
    { let z = notesArr().reduce((m, n) => Math.max(m, n.z || 0), 0);
      newNotes.forEach((text, i) => { const n = normNote({id: uid(), text, color: "yellow", x: 60 + (i % 4) * 230 + Math.round(Math.random() * 30), y: 50 + Math.round(Math.random() * 60), z: ++z, rot: Math.round((Math.random() * 4 - 2) * 10) / 10, courseId: fd.get("courseId") || "", taskId: t.id, created: Date.now()}); noteChanges.push({kind:"note", id: n.id, after: n}); }); }
    const fileChanges = noteChanges.concat(Object.values(state.files).filter(f => attached.has(f.id) !== f.taskIds.includes(t.id)).map(f => {
      const n = clone(f); n.taskIds = attached.has(f.id) ? n.taskIds.concat(t.id) : n.taskIds.filter(x => x !== t.id);
      return {kind:"file", id: f.id, after: n};
    }));
    if (data.start && data.due && data.start > data.due) data.start = data.due;
    const every = canRepeat && type !== "Exam" ? String(fd.get("repeat") || "") : "", untilIn = fd.get("until") || "";
    if (every && !data.due) { toast("Set a due date to repeat this task"); return false; }
    if (every && untilIn && untilIn < data.due) { toast("Pick a Repeat Until date after the due date"); return false; }
    const until = every ? untilIn || repeatEnd(data.due, data.courseId) : "";
    if (isNew) {
      const base = newTask(Object.assign({}, data, {id: t.id, doneAt: data.status === "done" ? Date.now() : null}));
      if (every) base.seriesId = uid();
      const changes = [{kind:"task", id: base.id, after: base}].concat(every ? repeatCopies(base, every, until) : []);
      applyChanges(changes.concat(fileChanges), changes.length > 1 ? `Added ${changes.length} tasks` : "Task added");
      if (planAfter && MILESTONE(base.type) && base.due) setTimeout(() => { if (window.SBPREP) SBPREP.open(base.id); }, 80);
      else if (MILESTONE(base.type) && base.due && base.due >= todayISO() && base.status !== "done") setTimeout(() => { if (!dlg.open) remoteAsk(base.id); }, 80);
    } else {
      const x = state.tasks[t.id]; if (!x) return;
      const next = Object.assign(clone(x), data);
      if (data.status === "done" && x.status !== "done") next.doneAt = Date.now();
      if (data.status !== "done") next.doneAt = null;
      if (data.status !== x.status) next.order = nextOrder(data.status);
      if (every) next.seriesId = uid();
      const copies = every ? repeatCopies(next, every, until) : [];
      const moved = next.due !== x.due || startOf(next) !== startOf(x);
      applyChanges([{kind:"task", id: t.id, after: next}].concat(copies, fileChanges), copies.length ? `Task saved, repeating ${copies.length} more time${copies.length === 1 ? "" : "s"}` : "Task saved", () => moved ? shiftOffer(t.id) : null);
    }
  });
  const list = $("#clList");
  let drawRepeat = () => {};
  const curType = () => $("#tfType").value;
  const advSummary = () => {
    const f = dlg.querySelector("form"); if (!f) return;
    const v = n => (f.elements[n] && !f.elements[n].closest("[hidden]")) ? String(f.elements[n].value || "").trim() : "";
    const bits = [];
    if (v("hours")) bits.push(v("hours") + "h");
    if (v("location")) bits.push(v("location"));
    if (v("team")) bits.push("team");
    if (v("link")) bits.push("link");
    if (v("weight")) bits.push(v("weight") + "% of grade");
    const diff = (f.querySelector("input[name=difficulty]:checked") || {}).value; if (diff && diff !== "med") bits.push(DIFF_LABEL[diff].toLowerCase());
    { const nn = (typeof noteSet !== "undefined" ? noteSet.size : 0) + (typeof newNotes !== "undefined" ? newNotes.length : 0); if (nn) bits.push(nn + " sticky note" + (nn === 1 ? "" : "s")); }
    if (items.length) bits.push(`checklist ${items.filter(i => i.done).length}/${items.length}`);
    if (deps.length) bits.push(`${deps.length} dependenc${deps.length === 1 ? "y" : "ies"}`);
    if (attached.size) bits.push(`${attached.size} file${attached.size === 1 ? "" : "s"}`);
    $("#advSum").textContent = bits.length ? bits.join(", ") : "Hours, checklist, files and more";
  };
  const drawCl = () => {
    const pw = $("#pctWrap"); if (pw) pw.hidden = isNew || (items.length > 0 && !MILESTONE(curType()));
    const pc = $("#pctFromCl"); if (pc) { pc.hidden = isNew || !(items.length > 0 && !MILESTONE(curType())); pc.textContent = `Progress comes from the checklist in Advanced Settings: ${items.filter(i => i.done).length} of ${items.length} done.`; }
    if (typeof advSummary === "function" && $("#advSum")) advSummary();
    list.innerHTML = items.map((i, n) => `<li class="${i.done ? "done" : ""}"><input type="checkbox" data-i="${n}" ${i.done ? "checked" : ""} aria-label="Done"><input type="text" data-i="${n}" value="${esc(i.text)}" data-noenter aria-label="Step ${n + 1}"><button type="button" class="x-btn" data-rm="${n}" aria-label="Remove step">${CLOSE}</button></li>`).join("");
  };
  drawCl();
  list.addEventListener("change", e => { const n = e.target.dataset.i; if (e.target.type === "checkbox" && n != null) { items[n].done = e.target.checked; drawCl(); } });
  list.addEventListener("input", e => { const n = e.target.dataset.i; if (e.target.type === "text" && n != null) items[n].text = e.target.value; });
  list.addEventListener("click", e => { const b = e.target.closest("[data-rm]"); if (b) { items.splice(Number(b.dataset.rm), 1); drawCl(); } });
  const add = () => { const inp = $("#clNew"), v = inp.value.trim(); if (!v) return; items.push({id: uid(), text: v, done: false}); inp.value = ""; drawCl(); inp.focus(); };
  const pctIn = dlg.querySelector("input[name=pct]");
  const pctHint = () => {
    const v = Number(pctIn.value);
    const xr = MILESTONE(curType()) && state.tasks[t.id] ? examReadiness(state.tasks[t.id]) : null;
    $("#pctHint").textContent = MILESTONE(curType()) ? (v >= 90 ? "Ready" : v >= 60 ? "Mostly ready, a few topics to review" : v >= 30 ? "Getting there" : "Just starting to study") + (xr && xr.measured != null ? `. Your results say about ${xr.measured}%, and those count first.` : "") : "";
  };
  const setStatus = v => { const r = dlg.querySelector(`input[name=status][value="${v}"]`); if (r && !r.checked) r.checked = true; };
  pctIn.addEventListener("input", () => {
    $("#pctOut").textContent = pctIn.value + "%"; pctHint();
    if (!MILESTONE(curType())) { const v = Number(pctIn.value); setStatus(v >= 100 ? "done" : v > 0 ? "doing" : "todo"); }
  });
  const tForm = dlg.querySelector("form");
  tForm.addEventListener("change", e => {
    if (e.target.name !== "status" || MILESTONE(curType())) return;
    const v = e.target.value, cur = Number(pctIn.value);
    if (v === "done" && cur < 100) pctIn.value = 100;
    else if (v === "todo" && cur > 0) pctIn.value = 0;
    else if (v === "doing" && cur >= 100) pctIn.value = 90;
    $("#pctOut").textContent = pctIn.value + "%";
  });
  const applyType = () => {
    const type = curType(), cfg = cfgOf(type);
    const show = (fld, on, label) => { const el = dlg.querySelector(`[data-fld="${fld}"]`); if (!el) return; el.hidden = !on; if (label) el.querySelector(".lbl").textContent = label; };
    show("start", !cfg.single, cfg.start);
    show("time", !!cfg.time, cfg.time);
    show("hours", !!cfg.hours, cfg.hours);
    show("location", !!cfg.location, cfg.location);
    show("team", !!cfg.team, cfg.team);
    show("link", !!cfg.link, cfg.link);
    show("reading", !!cfg.reading, cfg.reading);
    show("remote", MILESTONE(type));
    $("#dueLbl").textContent = cfg.due;
    $("#pctLbl").textContent = cfg.prog;
    $("#clLegend").textContent = cfg.checklist;
    $("#clNew").placeholder = cfg.step;
    $("#notesLbl").textContent = cfg.notes;
    dlg.querySelector("textarea[name=notes]").placeholder = cfg.notesPh;
    dlg.querySelector("input[name=title]").placeholder = cfg.title;
    $("#prioLbl").textContent = MILESTONE(type) ? "Importance" : "Priority";
    const cur = (dlg.querySelector("input[name=status]:checked") || {}).value || t.status;
    $("#statusSeg").innerHTML = seg("status", STATUSES.map(x => [x[0], statusLabels(type)[x[0]]]), cur);
    const rr = $("#repeatWrap"); if (rr) rr.hidden = type === "Exam";
    $$(".two", dlg).forEach(row => { row.hidden = [...row.children].every(c => c.hidden); });
    drawRepeat();
    const dueIn = dlg.querySelector("input[name=due]"); dueIn.required = !!cfg.single; $("#dueReq").hidden = !cfg.single;
    pctHint(); drawCl(); if (typeof planHint === "function") planHint(); advSummary();
  };
  $("#tfType").addEventListener("change", applyType);
  {
    const rs = dlg.querySelector("select[name=repeat]"), un = dlg.querySelector("input[name=until]"), dueIn = dlg.querySelector("input[name=due]"), cSel = dlg.querySelector("select[name=courseId]");
    if (rs) {
      let touched = false;
      drawRepeat = () => {
        const on = !!rs.value && !$("#repeatWrap").hidden, end = dueIn.value ? repeatEnd(dueIn.value, cSel.value) : "";
        $("#untilWrap").hidden = !on;
        if (!touched) un.value = on ? end : "";
        const n = on && dueIn.value ? repeatDates(dueIn.value, rs.value, un.value || end).length : 0;
        $("#untilHint").textContent = !on ? "" : !dueIn.value ? "Set a due date first" : `${n} more after this one${touched ? "" : ", to the end of term"}`;
      };
      un.addEventListener("input", () => { touched = !!un.value; drawRepeat(); });
      [rs, dueIn, cSel].forEach(x => x.addEventListener("change", drawRepeat));
    }
  }
  { const ppB = $("#tfPlanPrep"); if (ppB) { const sync = () => { ppB.hidden = !MILESTONE(curType()); }; $("#tfType").addEventListener("change", sync); sync(); ppB.addEventListener("click", () => { planAfter = true; try { dlg.querySelector("[data-submit]").click(); } finally { planAfter = false; } }); } }
  const drawRx = () => {
    const n = $("#rxNote"); if (!n) return;
    const v = String((dlg.querySelector("input[name=remote]:checked") || {}).value || "");
    n.innerHTML = v === rxInit ? remoteNoteHtml(rxEff) : v ? remoteNoteHtml({v, src: "user", why: "Your answer wins over anything detected, and a school sync never changes it."}) : `<span class="rx-chip unk">Not sure</span> Studyboard keeps checking your school site and the instructions. Until it is sure, this isn't suggested as Do This Next.`;
  };
  dlg.querySelectorAll("input[name=remote]").forEach(r => r.addEventListener("change", drawRx));
  drawRx();
  { const ls = dlg.querySelector("select[name=late]"), pw = $("#latePenWrap"); if (ls && pw) ls.addEventListener("change", () => { pw.hidden = ls.value !== "penalty"; }); }
  const planHint = () => {
    const f = new FormData(dlg.querySelector("form"));
    const probe = normTask(Object.assign(clone(t), {type: f.get("type"), hours: f.get("hours") === "" ? null : Number(f.get("hours")), pct: Number(f.get("pct") || 0),
      status: f.get("status") || "todo", weight: f.get("weight") === "" ? null : Number(f.get("weight")), difficulty: f.get("difficulty") || "med", checklist: items}));
    const w = dlg.querySelector("input[name=weight]"); w.placeholder = `typical ${typeDef(probe).w}`;
    const R = remainingOf(probe);
    const ms = MILESTONE(probe.type);
    const x = FOCUS && FOCUS.info[t.id];
    const rankTxt = x ? (() => { const i = FOCUS.ranked.indexOf(x); return i >= 0 ? ` Currently #${i + 1} in Today's Plan${x.alloc > 0 ? `, with ${fmtHM(x.alloc)} suggested today` : ""}.` : ""; })() : "";
    const inPerson = ms && !canDoNow(probe) && !planSessions(t.id).length, lead = inPerson ? examLead(probe) : null;
    $("#planHint").innerHTML = (ms ? `Estimated <b>${fmtHM(R)}</b> of studying left, based on difficulty, grade weight and preparedness.${lead ? ` Today's Plan starts study time for it ${lead.days} days before${lead.risk ? ", sooner because of your standing in the course" : ""}${lead.p < 0.75 ? `${lead.risk ? " and" : ", sooner"} because ${esc(readyWords(lead.from, lead.p))}` : ""}.` : ""}`
      : `Estimated <b>${esc(leftRange(probe))}</b> of work left${isNum(probe.hours) && probe.hours > 0 ? "" : " (a typical amount for this type; add Hours Needed for a better plan)"}.`) + rankTxt;
  };
  tForm.addEventListener("input", planHint); tForm.addEventListener("change", planHint);
  tForm.addEventListener("input", advSummary); tForm.addEventListener("change", advSummary);
  $("#tfAdv").addEventListener("toggle", e => { ui.advOpen = e.target.open; });
  const depList = $("#depList"), depAdd = $("#depAdd");
  const drawDeps = () => {
    depList.innerHTML = deps.map(id => { const x = state.tasks[id]; return x ? `<span class="dep-chip" style="--c:${esc(colorOf(x.courseId))}">${x.status === "done" ? CHECK.replace('<svg', '<svg width="12" height="12"') : ""}${esc(x.title)}${x.due ? ` <span class="mini">${esc(fmtShort(x.due))}</span>` : ""}<button type="button" class="x-btn" data-dep-rm="${esc(id)}" aria-label="Remove dependency on ${esc(x.title)}">${CLOSE}</button></span>` : ""; }).join("") || `<span class="mini">None. Add tasks that must be finished before this one can start.</span>`;
    const cid = dlg.querySelector("select[name=courseId]").value;
    const cands = tasksArr().filter(x => x.id !== t.id && !deps.includes(x.id) && !dependsOnSelf(x.id)).sort(sortTasks);
    const grp = (label, arr) => arr.length ? `<optgroup label="${esc(label)}">${arr.map(x => `<option value="${esc(x.id)}">${esc(x.title)}${x.due ? " (" + esc(fmtShort(x.due)) + ")" : ""}</option>`).join("")}</optgroup>` : "";
    depAdd.innerHTML = `<option value="">Add a task this depends on…</option>` + grp("This course", cands.filter(x => (x.courseId || "") === cid)) + grp("Other courses", cands.filter(x => (x.courseId || "") !== cid));
  };
  depAdd.addEventListener("change", () => { if (depAdd.value) { deps.push(depAdd.value); drawDeps(); } });
  depList.addEventListener("click", e => { const b = e.target.closest("[data-dep-rm]"); if (b) { deps = deps.filter(x => x !== b.dataset.depRm); drawDeps(); } });
  dlg.querySelector("select[name=courseId]").addEventListener("change", () => { drawDeps(); drawFiles(); });
  drawDeps();
  const tfFiles = $("#tfFiles"), tfAttach = $("#tfAttach");
  const drawFiles = () => {
    const fs = [...attached].map(id => state.files[id]).filter(Boolean);
    tfFiles.innerHTML = fs.map(f => `<li>${fileIcon(f)}<a href="${esc(fileHref(f))}" ${fileAttr(f)} target="_blank" rel="noopener noreferrer">${esc(f.name)}</a>${f.kind === "file" && f.revs.length > 1 ? `<span class="mini">Rev ${revLetter(f.revs.length - 1)}</span>` : ""}<button type="button" class="x-btn" data-f-rm="${esc(f.id)}" aria-label="Detach ${esc(f.name)}">${CLOSE}</button></li>`).join("") || `<li class="mini">No files attached.</li>`;
    const cid = dlg.querySelector("select[name=courseId]").value;
    const cands = Object.values(state.files).filter(f => !attached.has(f.id)).sort((a, b) => a.name.localeCompare(b.name));
    const grp = (label, arr) => arr.length ? `<optgroup label="${esc(label)}">${arr.map(f => `<option value="${esc(f.id)}">${esc(f.name)}</option>`).join("")}</optgroup>` : "";
    tfAttach.innerHTML = `<option value="">Attach a file…</option>` + grp("This course", cands.filter(f => (f.courseId || "") === cid)) + grp("Other files", cands.filter(f => (f.courseId || "") !== cid));
    $("#tfUpload").hidden = !caps.assets;
  };
  tfAttach.addEventListener("change", () => { if (tfAttach.value) { attached.add(tfAttach.value); drawFiles(); } });
  tfFiles.addEventListener("click", e => { const b = e.target.closest("[data-f-rm]"); if (b) { attached.delete(b.dataset.fRm); drawFiles(); } });
  $("#tfUpload").addEventListener("click", () => $("#tfFile").click());
  $("#tfFile").addEventListener("change", async e => {
    const list = [...(e.target.files || [])]; e.target.value = "";
    if (!list.length) return;
    const cid = dlg.querySelector("select[name=courseId]").value;
    const made = await uploadFiles(list, {courseId: cid, folderId: "assignments", quiet: true, cloud: true});
    made.forEach(f => attached.add(f.id));
    if (dlg.open) drawFiles();
  });
  drawFiles();
  const tfNotes = $("#tfNotes"), tfNoteAttach = $("#tfNoteAttach");
  const drawNotes = () => {
    const ns = [...noteSet].map(id => state.notes[id]).filter(Boolean);
    tfNotes.innerHTML = ns.map(n => `<div class="tf-note" style="--nc:${noteColor(n.color)}"><span>${esc(n.text.slice(0, 140)) || "<i>Empty note</i>"}</span><button type="button" class="x-btn" data-n-rm="${esc(n.id)}" aria-label="Detach note">${CLOSE}</button></div>`).join("")
      + newNotes.map((txt, i) => `<div class="tf-note" style="--nc:${noteColor("yellow")}"><span>${esc(txt.slice(0, 140))}</span><button type="button" class="x-btn" data-n-new="${i}" aria-label="Remove new note">${CLOSE}</button></div>`).join("")
      || `<span class="mini">No sticky notes. Write one here, or attach one from the Notes board.</span>`;
    const cands = notesArr().filter(n => !noteSet.has(n.id) && !n.archived).sort((a, b) => (b.updated || b.created || 0) - (a.updated || a.created || 0));
    tfNoteAttach.innerHTML = `<option value="">Attach a note from the board…</option>` + cands.map(n => `<option value="${esc(n.id)}">${esc((n.text.trim() || "Empty note").slice(0, 60))}${n.taskId && state.tasks[n.taskId] ? " (on " + esc(state.tasks[n.taskId].title) + ")" : ""}</option>`).join("");
    tfNoteAttach.hidden = !cands.length;
    if (typeof advSummary === "function") advSummary();
  };
  tfNoteAttach.addEventListener("change", () => { if (tfNoteAttach.value) { noteSet.add(tfNoteAttach.value); drawNotes(); } });
  tfNotes.addEventListener("click", e => { const b = e.target.closest("[data-n-rm]"), c = e.target.closest("[data-n-new]"); if (b) { noteSet.delete(b.dataset.nRm); drawNotes(); } if (c) { newNotes.splice(Number(c.dataset.nNew), 1); drawNotes(); } });
  const addNote = () => { const inp = $("#tfNoteNew"), v = inp.value.trim(); if (!v) return; newNotes.push(v); inp.value = ""; drawNotes(); inp.focus(); };
  $("#tfNoteAddBtn").addEventListener("click", addNote);
  $("#tfNoteNew").addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); addNote(); } });
  drawNotes();
  $("#clAdd").addEventListener("click", add);
  $("#clNew").addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); add(); } });
  applyType();
  const snap = () => { const f = dlg.querySelector("form"); return f ? JSON.stringify([[...new FormData(f)].filter(([k]) => k !== "until"), items, deps, [...attached], [...noteSet], newNotes, $("#clNew").value, $("#tfNoteNew").value]) : ""; };
  let start = null;
  ["focusin", "pointerdown", "keydown"].forEach(ev => tForm.addEventListener(ev, () => { if (start === null) start = snap(); }, true));
  dlgGuard = () => start !== null && snap() !== start;
}
// Repeats run until the course's last deadline, or the end of the usual term
function repeatEnd(due, cid){
  const last = cid ? allTasks().filter(x => x.courseId === cid && x.due && !x.seriesId).reduce((m, x) => x.due > m ? x.due : m, "") : "";
  if (last && dayDiff(due, last) >= 14) return last;
  const d = parse(due), y = d.getFullYear(), m = d.getMonth(), end = m >= 7 ? `${y}-12-15` : m >= 4 ? `${y}-08-15` : `${y}-05-15`;
  return dayDiff(due, end) >= 14 ? end : addDays(due, 84);
}
function repeatDue(due, every, n){
  if (every !== "m") return addDays(due, Number(every) * n);
  const d = parse(due), x = new Date(d.getFullYear(), d.getMonth() + n, 1);
  x.setDate(Math.min(d.getDate(), new Date(x.getFullYear(), x.getMonth() + 1, 0).getDate()));
  return iso(x);
}
function repeatDates(due, every, until){
  const out = [];
  for (let n = 1; n <= 120; n++) { const d = repeatDue(due, every, n); if (d > until) break; out.push(d); }
  return out;
}
function repeatCopies(base, every, until){
  const off = dayDiff(base.start || base.due, base.due);
  return repeatDates(base.due, every, until).map((d, i) => {
    const keep = {}; ["title", "courseId", "type", "time", "priority", "notes", "hours", "weight", "difficulty", "late", "latePen", "location", "team", "reading", "link", "seriesId"].forEach(k => { if (base[k] !== undefined) keep[k] = clone(base[k]); });
    const x = newTask(Object.assign(keep, {due: d, start: addDays(d, -off), status: "todo", checklist: (base.checklist || []).map(i => ({id: uid(), text: i.text, done: false}))}));
    x.order += i + 1;
    return {kind: "task", id: x.id, after: x};
  });
}

function deleteTask(id){
  const t = state.tasks[id]; if (!t) return;
  if (window.SBBREAK && SBBREAK.deleteHook(id)) return;
  const later = t.seriesId ? tasksArr().filter(x => x.seriesId === t.seriesId && x.id !== id && x.due >= t.due) : [];
  const prep = MILESTONE(t.type) ? planSessions(id).filter(x => x.status !== "done") : [];
  if (prep.length) { dlg.close(); applyChanges([t].concat(prep).map(x => ({kind:"task", id:x.id, after:null})), `Deleted ${t.title} and ${prep.length} prep session${prep.length === 1 ? "" : "s"}`); return; }
  if (!later.length) { dlg.close(); applyChanges([{kind:"task", id, after:null}], `Deleted ${t.title}`); return; }
  openSheet(`<form class="sheet">${head("Delete Repeating Task")}<div class="sheet-body"><p style="margin:0">${esc(t.title)} repeats. Delete just this one, or this one and the ${later.length} after it?</p></div>
    <div class="sheet-foot"><button type="button" class="btn" data-act="close">Cancel</button><span class="spacer"></span><button type="button" class="btn" id="delOne">Just This One</button><button type="button" class="btn primary" id="delAll" style="background:var(--late);border-color:var(--late);color:#fff">This and Later</button></div></form>`);
  $("#delOne").addEventListener("click", () => { dlg.close(); applyChanges([{kind:"task", id, after:null}], `Deleted ${t.title}`); });
  $("#delAll").addEventListener("click", () => { dlg.close(); applyChanges([t, ...later].map(x => ({kind:"task", id:x.id, after:null})), `Deleted ${later.length + 1} tasks`); });
}

function courseForm(c){
  const isNew = !c;
  const used = coursesArr().map(x => x.color);
  c = c ? clone(c) : {name:"", code:"", instructor:"", schedule:"", room:"", office:"", color: COLORS.find(x => !used.includes(x)) || COLORS[used.length % COLORS.length], notes:"", links:[]};
  const linksText = (c.links || []).map(l => l.label && l.label !== "Link" ? `${l.label} | ${l.url}` : l.url).join("\n");
  openSheet(`<form class="sheet">${head(isNew ? "New Course" : "Edit Course")}
    <div class="sheet-body">${REQ_NOTE}
      <label class="f"><span class="lh">Course Name ${REQ}</span><input type="text" name="name" required maxlength="120" value="${esc(c.name)}" autofocus placeholder="e.g. Organic Chemistry"></label>
      <div class="two">
        <label class="f"><span class="lh">Code <span class="hint">short label</span></span><input type="text" name="code" maxlength="30" value="${esc(c.code)}" placeholder="CHEM 201"></label>
        <label class="f">Instructor<input type="text" name="instructor" maxlength="100" value="${esc(c.instructor)}"></label>
      </div>
      <fieldset class="meet-fs"><legend>Class Times <span class="hint">shown on your weekly schedule</span></legend>
        <div id="meetList" class="meet-list"></div>
        <button type="button" class="btn small" id="meetAdd">+ Add a Class Time</button>
        ${cycOn() ? "" : `<button type="button" class="link-btn mini cyc-q" id="cycSet">Rotating schedule, like Day 1 to 6 or A/B days?</button>
        <div class="cyc-inline" id="cycInline" hidden><div class="two"><label class="f"><span class="lh">Days in the cycle</span><select id="cycN">${[2, 3, 4, 5, 6, 7, 8, 9, 10].map(v => `<option value="${v}"${v === 2 ? " selected" : ""}>${v}</option>`).join("")}</select></label>
          <label class="f"><span class="lh">Called</span><select id="cycNames"><option value="abc">A Day, B Day…</option><option value="num">Day 1, Day 2…</option></select></label></div>
          <label class="f"><span class="lh" id="cycRefL"></span><select id="cycK"></select></label>
          <p class="mini" style="margin:0">Weekends are skipped. Add holidays and snow days, which pause the cycle, in School Days on your Schedule.</p></div>`}</fieldset>
      <div class="two">
        <label class="f"><span class="lh">Room <span class="hint">default for class times</span></span><input type="text" name="room" maxlength="80" value="${esc(c.room)}"></label>
        <label class="f"><span class="lh">Office Hours <span class="hint">notes</span></span><input type="text" name="office" maxlength="120" value="${esc(c.office || "")}"></label>
      </div>
      <fieldset><legend>Color</legend><div class="swatches cc-sw">${COURSE_COLORS.map((x, i) => `<label title="${esc(COURSE_COLOR_NAMES[i] || "")}"><input type="radio" name="color" value="${x}" ${x.toLowerCase() === String(c.color || "").toLowerCase() ? "checked" : ""} aria-label="${esc(COURSE_COLOR_NAMES[i] || "Color " + (i + 1))}"><span style="--c:${x}"></span></label>`).join("")}${(cv => `<label class="cc-custom" title="Any color"><input type="radio" name="color" id="ccRadio" value="${esc(cv)}" ${COURSE_COLORS.some(x => x.toLowerCase() === String(c.color || "").toLowerCase()) ? "" : "checked"} aria-label="Custom color"><span style="--c:${esc(cv)}"></span><input type="color" id="ccPick" value="${esc(cv)}" aria-label="Pick any color" tabindex="-1"></label>`)(/^#[0-9a-f]{6}$/i.test(c.color || "") ? c.color : "#7C3AED")}</div></fieldset>
      <fieldset class="ci-fs"><legend>Icon <span class="hint">shown in the course's circle</span></legend><div class="ci-grid" id="ciGrid" style="--c:${esc(c.color)}" data-picked="${COURSE_ICONS[c.icon] || customIcon(c.icon) ? "1" : ""}">
        ${Object.keys(COURSE_ICONS).map(k => `<label title="${esc(COURSE_ICONS[k][0])}"><input type="radio" name="icon" value="${k}" ${courseIconKey(c) === k ? "checked" : ""} aria-label="${esc(COURSE_ICONS[k][0])}"><span>${courseIconSvg(k)}</span></label>`).join("")}${customIcons().map(x => `<label title="${esc(x.name)} (made with AI)"><input type="radio" name="icon" value="x:${esc(x.id)}" ${courseIconKey(c) === "x:" + x.id ? "checked" : ""} aria-label="${esc(x.name)}"><span>${courseIconSvg("x:" + x.id)}</span></label>`).join("")}<button type="button" class="ci-ai-btn" data-act="ci-ai" title="Describe an icon and AI draws it in this style">${AI_ICON}<span>Create</span>${typeof PLAN !== "undefined" && PLAN && PLAN.paywall() && !PLAN.isPro() ? `<i class="pro-badge">PRO</i>` : ""}</button></div>
        <div class="ci-ai" id="ciAi" hidden><label class="f"><span class="lh">Describe the Icon<span class="beta-sym" title="Beta: still being improved" role="img" aria-label="Beta">β</span> <span class="hint">e.g. "a stethoscope with a heart" or "a hockey stick and puck"</span></span><input type="text" id="ciAiQ" maxlength="120" autocomplete="off"></label>
          <div class="ci-ai-row"><button type="button" class="btn primary small" data-act="ci-ai-go">Draw It</button><span class="ci-ai-prev" id="ciAiPrev" aria-live="polite"></span><button type="button" class="btn small" data-act="ci-ai-use" id="ciAiUse" hidden>Use This Icon</button></div></div></fieldset>
      <label class="f"><span class="lh">Links <span class="hint">one per line, optionally "Label | url"</span></span><textarea name="links" placeholder="Syllabus | https://…&#10;Canvas | https://…">${esc(linksText)}</textarea></label>
      <label class="f">Notes<textarea name="notes" maxlength="10000" placeholder="Grading breakdown, exam dates, TA contact…">${esc(c.notes)}</textarea></label>
    </div>
    <div class="sheet-foot">${isNew ? "" : `<button type="button" class="btn danger" data-act="delete-course" data-id="${esc(c.id)}">Delete</button>`}<span class="spacer"></span><button type="button" class="btn" data-act="close">Cancel</button><button type="button" class="btn primary" data-submit>${isNew ? "Add Course" : "Save Course"}</button></div>
  </form>`, fd => {
    const name = String(fd.get("name") || "").trim();
    if (!name) return false;
    const links = String(fd.get("links") || "").split("\n").map(s => s.trim()).filter(Boolean).map(line => {
      const i = line.indexOf("|");
      return i > -1 ? {label: line.slice(0, i).trim() || "Link", url: line.slice(i + 1).trim()} : {label: "Link", url: line};
    }).filter(l => safeUrl(l.url));
    const rot = m => !!cycC() && m.rep === "c", noDays = m => rot(m) ? !(m.cyc || []).length : !m.days.length;
    const bad = meets.find(m => noDays(m) || !m.start || !m.end || m.end <= m.start);
    if (bad) { toast(noDays(bad) ? (rot(bad) ? "Pick the cycle days for each class time" : "Pick the days for each class time") : "Each class time needs a start and an end time"); return false; }
    const meetings = meets.map(m => Object.assign({id: m.id || uid(), kind: m.kind, days: rot(m) ? [] : m.days.slice().sort(), start: m.start, end: m.end, where: String(m.where || "").trim()}, rot(m) ? {cyc: m.cyc.filter(k => k <= cycC().n).sort((a, b) => a - b)} : {}));
    // a rotating schedule set up right here in the form
    if (cycNew && meetings.some(m => m.cyc)) { const ref = SBSCHOOL.nextSchool({off: (schoolCfg() || {}).off, cycle: {n: cycNew.n, ref: todayISO(), k: 1, days: [1, 2, 3, 4, 5]}}, todayISO());
      state.settings = Object.assign({}, state.settings, {school: Object.assign({}, schoolCfg() || {}, {cycle: {n: cycNew.n, ref, k: cycNew.k, days: [1, 2, 3, 4, 5], names: cycNew.names}})}); saveSettings(); }
    const data = {name, code: String(fd.get("code") || "").trim(), instructor: String(fd.get("instructor") || "").trim(), meetings,
      schedule: meetings.length ? meetingsSummary(meetings) : (c.meetings && c.meetings.length ? "" : c.schedule || ""), room: String(fd.get("room") || "").trim(), office: String(fd.get("office") || "").trim(),
      color: fd.get("color") || COLORS[0], icon: (COURSE_ICONS[fd.get("icon")] || customIcon(String(fd.get("icon") || ""))) && ($("#ciGrid") || {dataset: {}}).dataset.picked ? String(fd.get("icon")) : "", notes: String(fd.get("notes") || ""), links};
    if (isNew) { const nc = Object.assign({id: uid(), created: Date.now()}, data); applyChanges([{kind:"course", id: nc.id, after: nc}], `Added ${name}`); }
    else { applyChanges([{kind:"course", id: c.id, after: Object.assign(clone(state.courses[c.id] || c), data)}], "Course saved"); }
  });
  dlg.querySelectorAll('input[name="color"]').forEach(r => r.addEventListener("change", () => { const g = $("#ciGrid"); if (g) g.style.setProperty("--c", r.value); }));
  { const pk = $("#ccPick"), rd = $("#ccRadio");
    if (pk && rd) { pk.addEventListener("input", () => { rd.value = pk.value; rd.nextElementSibling.style.setProperty("--c", pk.value); rd.checked = true; rd.dispatchEvent(new Event("change", {bubbles: true})); });
      rd.addEventListener("click", () => { try { pk.showPicker ? pk.showPicker() : pk.click(); } catch (e) { pk.click(); } }); } }
  { const g = $("#ciGrid"), follow = () => { if (!g || g.dataset.picked) return; const k = courseIconKey({name: (dlg.querySelector('input[name="name"]') || {}).value, code: (dlg.querySelector('input[name="code"]') || {}).value}); const r = g.querySelector(`input[value="${k}"]`); if (r) r.checked = true; };
    if (g) { g.addEventListener("change", () => { g.dataset.picked = "1"; }); dlg.querySelectorAll('input[name="name"],input[name="code"]').forEach(i => i.addEventListener("input", follow)); } }
  let meets = clone(courseMeetings(c)).map(m => Object.assign(m, {days: m.days || [], cyc: m.cyc || [], rep: m.cyc && m.cyc.length ? "c" : "w"}));
  // the school's rotating cycle (Day 1 to 6, A/B days): saved, or being set up in this form
  let cycNew = null;
  const cycC = () => cycNew || (cycOn() ? SBSCHOOL.norm(schoolCfg()).cycle : null);
  const cycName = k => (cycC() && cycC().names === "abc") ? String.fromCharCode(64 + k) : String(k);
  const mList = $("#meetList");
  const drawMeets = () => {
    const C = cycC();
    mList.innerHTML = meets.map((m, i) => `<div class="meet-row${C ? " has-rep" : ""}" data-i="${i}">
      <select data-k="kind" aria-label="Type">${MEET_KINDS.map(k => `<option ${k === m.kind ? "selected" : ""}>${k}</option>`).join("")}</select>
      ${C ? `<select data-k="rep" aria-label="Repeats"><option value="c"${m.rep === "c" ? " selected" : ""}>Rotating</option><option value="w"${m.rep !== "c" ? " selected" : ""}>Weekly</option></select>` : ""}
      ${C && m.rep === "c" ? `<div class="meet-days meet-cyc" role="group" aria-label="${C.names === "abc" ? "Days in the cycle" : "Cycle days"}">${Array.from({length: C.n}, (_, j) => `<button type="button" data-cyc="${j + 1}" aria-pressed="${m.cyc.includes(j + 1)}" aria-label="${esc(C.names === "abc" ? cycName(j + 1) + " Day" : "Day " + (j + 1))}">${C.names === "abc" ? "" : "D"}${cycName(j + 1)}</button>`).join("")}</div>`
      : `<div class="meet-days" role="group" aria-label="Days">${WEEK_ORDER.map(d => `<button type="button" data-day="${d}" aria-pressed="${m.days.includes(d)}">${DAY_SHORT[d]}</button>`).join("")}</div>`}
      <span class="meet-times"><input type="time" data-k="start" value="${esc(m.start)}" aria-label="Starts"><span>to</span><input type="time" data-k="end" value="${esc(m.end)}" aria-label="Ends"></span>
      <input type="text" data-k="where" value="${esc(m.where || "")}" placeholder="Room" aria-label="Room" maxlength="60" data-noenter>
      <button type="button" class="x-btn" data-rm="${i}" aria-label="Remove class time">${CLOSE}</button></div>`).join("") || `<p class="mini" style="margin:0">No class times yet. Add lectures, labs and office hours to see them on your Schedule.</p>`;
  };
  drawMeets();
  mList.addEventListener("input", e => { const r = e.target.closest(".meet-row"); if (r && e.target.dataset.k) meets[Number(r.dataset.i)][e.target.dataset.k] = e.target.value; });
  mList.addEventListener("change", e => { const r = e.target.closest(".meet-row"); if (r && e.target.dataset.k) { meets[Number(r.dataset.i)][e.target.dataset.k] = e.target.value; if (e.target.dataset.k === "rep") drawMeets(); } });
  mList.addEventListener("click", e => {
    const r = e.target.closest(".meet-row"); if (!r) return;
    const m = meets[Number(r.dataset.i)], db = e.target.closest("[data-day]"), rm = e.target.closest("[data-rm]");
    if (db) { const d = Number(db.dataset.day); m.days = m.days.includes(d) ? m.days.filter(x => x !== d) : m.days.concat(d); db.setAttribute("aria-pressed", m.days.includes(d)); }
    const cb = e.target.closest("[data-cyc]");
    if (cb) { const k = Number(cb.dataset.cyc); m.cyc = m.cyc.includes(k) ? m.cyc.filter(x => x !== k) : m.cyc.concat(k); cb.setAttribute("aria-pressed", m.cyc.includes(k)); }
    if (rm) { meets.splice(Number(rm.dataset.rm), 1); drawMeets(); }
  });
  $("#meetAdd").addEventListener("click", () => {
    const last = meets[meets.length - 1];
    meets.push(Object.assign(last ? {id: uid(), kind: last.kind === "Lecture" ? "Lab" : "Lecture", days: [], start: last.start, end: last.end, where: ""} : {id: uid(), kind: "Lecture", days: [], start: "10:00", end: "10:50", where: dlg.querySelector("input[name=room]").value.trim()}, {cyc: [], rep: cycC() ? "c" : "w"}));
    drawMeets();
  });
  // Set up a rotating schedule here: how many days, what they're called, and what today (or the next school day) is
  { const q = $("#cycSet"), box = $("#cycInline");
    if (q && box) {
      const refD = () => SBSCHOOL.nextSchool({off: (schoolCfg() || {}).off, cycle: {n: 2, ref: todayISO(), k: 1, days: [1, 2, 3, 4, 5]}}, todayISO());
      const sync = () => { cycNew = {n: Number($("#cycN").value), names: $("#cycNames").value, k: Math.min(Number($("#cycN").value), Number($("#cycK").value) || 1)};
        const r = refD(); $("#cycRefL").textContent = r === todayISO() ? "Today is" : `${parse(r).toLocaleDateString(undefined, {weekday: "long"})} (${fmtShort(r)}) is`;
        $("#cycK").innerHTML = Array.from({length: cycNew.n}, (_, j) => `<option value="${j + 1}"${j + 1 === cycNew.k ? " selected" : ""}>${cycNew.names === "abc" ? String.fromCharCode(65 + j) + " Day" : "Day " + (j + 1)}</option>`).join("");
        drawMeets(); };
      q.addEventListener("click", () => { box.hidden = false; q.hidden = true; meets.forEach(m => { if (!m.days.length) m.rep = "c"; }); sync(); if (!meets.length) $("#meetAdd").click(); });
      // the names follow the length (A/B for 2 days, Day 1, 2… for longer) until you pick them
      let namesSet = false;
      box.addEventListener("change", e => { if (e.target.id === "cycNames") namesSet = true; if (e.target.id === "cycN" && !namesSet) $("#cycNames").value = Number(e.target.value) === 2 ? "abc" : "num"; sync(); });
    } }
}

// A small question in the app's own style that opens ON TOP of whatever is open
function askBox(o){
  return new Promise(res => {
    let d = document.getElementById("askDlg");
    if (!d) { d = document.createElement("dialog"); d.id = "askDlg"; d.className = "ask-dlg"; document.body.appendChild(d); }
    const inp = o.input ? `<label class="f"><span class="lh">${esc(o.input.label || "")}</span><input type="text" id="askIn" maxlength="${Number(o.input.max) || 200}" value="${esc(o.input.value || "")}" autocomplete="off"></label>` : "";
    d.innerHTML = `<form class="sheet ask-sheet"><div class="sheet-head"><h2>${esc(o.title || "Are you sure?")}</h2></div><div class="sheet-body">${o.text ? `<p style="margin:0">${esc(o.text)}</p>` : ""}${inp}</div>
      <div class="sheet-foot"><span class="spacer"></span><button type="button" class="btn" id="askNo">${esc(o.no || "Cancel")}</button><button type="submit" class="btn ${o.danger ? "danger" : "primary"}" id="askYes">${esc(o.yes || "OK")}</button></div></form>`;
    let done = false;
    const fin = v => { if (done) return; done = true; try { d.close(); } catch (e) {} res(v); };
    const nope = () => fin(o.input ? null : false);
    d.querySelector("#askNo").addEventListener("click", nope);
    d.querySelector("form").addEventListener("submit", e => { e.preventDefault(); fin(o.input ? String(d.querySelector("#askIn").value) : true); });
    d.oncancel = e => { e.preventDefault(); nope(); };
    d.onclick = e => { if (e.target === d) nope(); };
    d.onkeydown = e => { e.stopPropagation(); if (e.key === "Escape") { e.preventDefault(); nope(); } };
    try { d.showModal(); } catch (e) { d.setAttribute("open", ""); }
    setTimeout(() => { const f = d.querySelector(o.input ? "#askIn" : "#askYes"); if (f) { f.focus(); if (o.input) f.select(); } }, 30);
  });
}
function confirmSheet(title, text, label, onYes){
  openSheet(`<form class="sheet">${head(title)}<div class="sheet-body"><p style="margin:0">${esc(text)}</p></div>
    <div class="sheet-foot"><span class="spacer"></span><button type="button" class="btn" data-act="close">Cancel</button><button type="button" class="btn primary" data-submit style="background:var(--late);border-color:var(--late);color:#fff">${esc(label)}</button></div></form>`, () => { onYes(); });
}

function accountRows(){
  if (inPreview()) return "";
  if (!sbConfig()) return SB_HOSTED ? `<button data-act="sb-signin"><span>Sign In or Create Account<span class="sub">${window.SBGUEST && SBGUEST.is() ? "Your planner is only on this device. A free account keeps it safe and on all your devices, and everything here comes with you." : "A free Studyboard account keeps your data and files in sync on all your devices"}</span></span></button>`
    : `<button data-act="sb-connect"><span>Sync Across Devices<span class="sub">Save your data and files online and use them on all your devices</span></span></button>`;
  return (sbUser
    ? `<div class="cap-row"><span style="flex:1;font-weight:600">Studyboard Account<span class="sub">Signed in as ${esc(sbUser.email || "")}${cloud.on ? "" : ", reconnecting…"}</span></span><button class="btn small" data-act="sb-signout">Sign Out</button></div>${sbDiagHtml()}`
    : `<button data-act="sb-signin"><span>Sign In or Create Account<span class="sub">A free Studyboard account keeps your data and files in sync</span></span></button>`)
    + (sbCustom() || !SB_HOSTED ? `<button data-act="sb-connect"><span>Custom Server<span class="sub">${esc((sbConfig().url || "").replace(/^https:\/\//, ""))}</span></span></button>` : "");
}
function menuSheet(){
  openSheet(`<div class="sheet">${head("Settings")}
    <div class="sheet-body"><div class="menu-list">
      ${themeRow()}
      ${shopRow()}
      ${animRows()}
      ${aiRow()}
      ${fire("menu").filter(Boolean).join("")}
      ${accountRows()}
      ${folderBackupRow()}
      ${installRow()}
      ${storageRow()}
      <div class="cap-row"><label for="dailyIn" style="flex:1;font-weight:600">Study Hours per Day<span class="sub">Today's Plan fits your work into this. You can change just today on the Board.</span></label><input type="number" id="dailyIn" min="0" max="16" step="0.5" value="${esc(dailyHours())}"> h</div>
      <button data-act="avail-open"><span>Availability and Free Time<span class="sub">Work, shifts, placements and protected time. Today's Plan only uses the free time left.</span></span></button>
      <div class="cap-row"><label for="capIn" style="flex:1;font-weight:600">Weekly Hours Limit<span class="sub">The most hours Rough Week Rescue plans for in a week</span></label><input type="number" id="capIn" min="0" step="1" value="${esc(state.settings.capacity ?? 15)}"> h</div>
      <button data-act="import-syllabus"><span>Import a Syllabus<span class="sub">Upload a PDF to add the course and its deadlines</span></span></button>
      <button data-act="bd-new-course"><span>Break Down an Assignment<span class="sub">Paste a prompt or rubric and get milestones scheduled backward from the due date</span></span></button>
      <button data-act="new-term"><span>Start a New Term<span class="sub">Put last term's courses, tasks and flashcards in the Archive</span></span></button>
      <button data-act="archive-open"><span>Archive<span class="sub">Finished tasks and past terms</span></span></button>
      <button data-act="trash-open"><span>Recently Deleted<span class="sub">${trashVisible().length ? `${trashVisible().length} item${trashVisible().length === 1 ? "" : "s"} you can still restore. Kept for ${TB.KEEP_DAYS} days.` : `Anything you delete waits here for ${TB.KEEP_DAYS} days`}</span></span></button>
      <button data-act="export-data"><span>Export My Data<span class="sub">Tasks, notes, grades and flashcards as a ZIP of spreadsheet files and one JSON file</span></span></button>
      <button data-act="cal-export"><span>Add Deadlines to Your Calendar<span class="sub">Download a calendar file with reminders</span></span></button>
      ${(() => { const n = Object.values(state.files).filter(f => f.kind === "file" && (f.revs || []).some(r => r && r.assetId)).length; return n
        ? `<button data-act="export"><span>Export a Backup File<span class="sub">One ZIP with your data and your ${n} uploaded file${n === 1 ? "" : "s"}. Keep it anywhere, like Google Drive or a USB drive.</span></span></button>
      <button data-act="export-json"><span>Export Data Only<span class="sub">A smaller file without your uploaded files</span></span></button>`
        : `<button data-act="export"><span>Export a Backup File<span class="sub">Download a file you can keep anywhere, like Google Drive or a USB drive</span></span></button>`; })()}
      <button data-act="backup-now"><span>Save a Copy on This Device<span class="sub">Kept in this browser, which also saves a copy each day. It won't survive clearing the browser.</span></span></button>
      <button data-act="restore"><span>Restore a Backup</span></button>
      <button data-act="import"><span>Import from a Backup File</span></button>
      <button data-act="ia-open"><span>Import From Another App<span class="sub">Anki, Quizlet, Todoist or Notion. Read on this device, nothing is uploaded.</span></span></button>
      <button data-act="clear-all" style="color:var(--late)"><span>Clear All Data</span></button>
    </div>
    <p class="summary-sub" style="font-size:.85rem">${inPreview() ? (cloud.on ? "Your data is saved to your account and stays in sync across your devices." : "Your data is saved in this browser only. Export a backup now and then so you don't lose it.") : sbUser ? "Your data and files sync to your Studyboard account, with a copy on this device so the app works offline. Download a backup now and then for extra peace of mind." : "Your data is saved in this browser only. Sign in to a Studyboard account, or export a backup file now and then so you don't lose it."}</p>
    </div></div>`);
  $("#dailyIn").addEventListener("change", e => {
    const v = Math.max(0, Math.min(16, Number(e.target.value) || 0));
    state.settings = Object.assign({}, state.settings, {dailyHours: v});
    saveSettings(); scheduleRender(); toast(`Study time set to ${v}h a day`);
  });
  $("#capIn").addEventListener("change", e => {
    const v = Math.max(0, Number(e.target.value) || 0);
    state.settings = Object.assign({}, state.settings, {capacity: v});
    saveSettings(); scheduleRender(); toast(v ? `Weekly limit set to ${v}h` : "Weekly limit turned off");
  });
}

async function restoreSheet(){
  openSheet(`<div class="sheet">${head("Restore a Backup")}<div class="sheet-body"><p class="status-msg">Loading backups…</p></div></div>`);
  let list = [];
  try { list = await listBackups(); } catch(e) {}
  if (!dlg.open) return;
  const body = dlg.querySelector(".sheet-body");
  if (!list.length) { body.innerHTML = `<p class="status-msg">No backups yet. One is saved on this device each day you use Studyboard, or choose Save a Copy on This Device in Settings.</p>`; return; }
  body.innerHTML = `<p class="status-msg" style="margin:0">Restoring replaces everything with the backup. You can undo right after.</p><div class="backup-list">${list.map((b, i) => `<button data-i="${i}"><span>${esc(new Date(b.at).toLocaleString(undefined, {weekday:"short", month:"short", day:"numeric", hour:"numeric", minute:"2-digit"}))}</span><small>${b.where === "cloud" ? "Online · " : b.where === "device" ? "This device · " : b.where === "drive" ? esc(b.label || "Cloud") + " · " : ""}${(b.courses || []).length} course${(b.courses || []).length === 1 ? "" : "s"}, ${(b.tasks || []).length} task${(b.tasks || []).length === 1 ? "" : "s"}</small></button>`).join("")}</div>`;
  body.querySelectorAll("[data-i]").forEach(btn => btn.addEventListener("click", () => {
    const b = list[Number(btn.dataset.i)];
    confirmSheet("Restore This Backup?", `Everything here is replaced with the backup from ${new Date(b.at).toLocaleString(undefined, {month:"short", day:"numeric", hour:"numeric", minute:"2-digit"})}. What's here now is saved as a device backup first, and you can undo right after.`, "Restore", () => {
    backupBefore("Before restoring a backup");
    applyChanges(replaceAllChanges(b.courses || [], b.tasks || [], Array.isArray(b.files) ? b.files : null, Array.isArray(b.notes) ? b.notes : null, Array.isArray(b.decks) ? b.decks : null, Array.isArray(b.events) ? b.events : null), "Backup restored");
    if (b.avail !== undefined) { try { availRestore(b.avail); } catch(e) {} }
    restoreSettingsFrom(b.keep);
    });
  }));
}

