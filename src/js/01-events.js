/* ===== module: 01-events.js: the app's core, events and dragging ===== */
/* Events */
const proBtns = where => { try { return window.SBPRO && SBPRO.tabBtns ? SBPRO.tabBtns(where) : ""; } catch (e) { return ""; } };
let suppressClick = false;
function toggleTask(id, el){
  const t = state.tasks[id]; if (!t) return;
  const n = clone(t);
  if (t.status === "done") { n.status = "todo"; n.doneAt = null; if (!MILESTONE(t.type) && n.pct >= 100) n.pct = 0; } else { n.status = "done"; n.doneAt = Date.now(); if (!MILESTONE(t.type)) n.pct = 100; }
  n.order = nextOrder(n.status);
  if (n.status === "done") { celebrate("check"); popDone(el); }
  applyChanges([{kind:"task", id, after:n}], n.status === "done" ? `Completed ${t.title}` : `Moved ${t.title} back to To Do`, undefined, n.status === "done" ? {done: true} : undefined);
}
document.addEventListener("click", e => {
  if (suppressClick) { suppressClick = false; e.preventDefault(); e.stopPropagation(); return; }
  const tab = e.target.closest("[data-tab]");
  if (tab) {
    if (tab.dataset.tab === "flashcards" && ui.tab === "flashcards") { ui.fc = null; ui.deckId = null; }
    let want = tab.dataset.tab;
    if (want === "plan" || want === "calendar") want = isPlanTab(ui.tab) ? ui.tab : ui.planView;
    if (want === "courses" && (ui.tab === "files" || ui.tab === "emails")) want = ui.tab;
    if (want === "timeline" && ui.tab !== "timeline") ui.tlJump = true;
    if (want === ui.tab && ui.tab === "courses") ui.courseId = null;
    ui.tab = want; if (ui.tab !== "courses") ui.courseId = null;
    render(); window.scrollTo(0, 0); return;
  }
  if (ui.tab === "notes" && !e.target.closest("dialog")) {
    const nEl = e.target.closest(".note");
    if (e.target.closest(".note-rot")) return;
    if (nEl && !nEl.classList.contains("editing") && !e.target.closest(".note-task-tag") && !e.target.closest(".note-conflict") && !e.target.closest(".note-link") && !e.target.closest(".np-photos")) { if (noteEditing) saveNoteText(); noteEditing = nEl.dataset.note; render(); setTimeout(() => { const t = $("#noteText"); if (t) { t.focus(); t.setSelectionRange(t.value.length, t.value.length); } }, 30); return; }
    if (noteEditing && !e.target.closest(".note.editing") && !e.target.closest("[data-act^=note]")) { saveNoteText(); }
  }
  const el = e.target.closest("[data-act]");
  if (!el) return;
  const id = el.dataset.id, act = el.dataset.act;
  if (fire("act", act, el, id).some(Boolean)) return;
  if (AI_ACTS[act]) { AI_ACTS[act](el); return; }
  if (STYLE_ACTS[act]) { STYLE_ACTS[act](el); return; }
  if ((act.startsWith("ai-") || act === "fc-ai") && aiQuizAction(act, el)) return;
  if (act === "ai-setup") { aiSetupSheet(false); return; }
  if (act.startsWith("fc-") && fcAction(act, el)) return;
  if (act.startsWith("pomo-") && pomoAction(act, el)) return;
  switch (act) {
    case "close": { const dd = el.closest("dialog") || dlg; if (dd === dlg) dlgClose(); else dd.close(); break; }
    case "menu": menuSheet(); break;
    case "search": toggleSearch(true); break;
    case "search-close": toggleSearch(false); break;
    case "search-clear": ui.q = ""; $("#searchInput").value = ""; render(); break;
    case "fsb-choose": backupWhereSheet(); break;
    case "cbk-go": dlg.close(); chooseBackupFolder(el.dataset.id); break;
    case "cbk-now": if (cloudBk()) cloudBk().run(); break;
    case "cbk-stop": dlg.close(); if (cloudBk()) cloudBk().stop(); break;
    case "desk-open": DESK && DESK.openDir(""); break;
    case "theme-toggle": setTheme(isDark() ? "light" : "dark"); break;
    case "theme-set": setTheme(id); $$('[data-act="theme-set"]').forEach(b => b.setAttribute("aria-pressed", b.dataset.id === id)); break;
    case "desk-choose": dlg.close(); deskChooseFolder(); break;
    case "storage-protect": storageProtect(true).then(r => { toast(r === "granted" ? "Done. This browser will keep your Studyboard data until you remove it." : r === "unsupported" ? "This browser can't promise to keep website data. Sign in or export a backup so you always have a copy." : "Your browser said not yet. Install Studyboard as an app (or add it to your Home Screen), then try again. Meanwhile, sign in or export a backup."); scheduleRender(); }); break;
    case "pwa-install": if (installEvt) { dlg.close(); installEvt.prompt(); installEvt.userChoice.then(() => { installEvt = null; }); } break;
    case "fsb-resume": dlg.close(); resumeFolderBackup(); break;
    case "fsb-stop": dlg.close(); stopFolderBackup(); break;
    case "export-full": dlg.close(); exportFullBackup(); break;
    case "sb-connect": dlg.close(); setTimeout(() => SB_HOSTED && !sbCustom() ? sbAsk() : sbSetupSheet(), 30); break;
    case "sb-signin": dlg.close(); setTimeout(sbAsk, 30); break;
    case "sb-signout": dlg.close(); setTimeout(sbSignOut, 30); break;
    case "sb-retry": sbRetryNow(); toast("Trying again…"); break;
    case "nudge-later": try { localStorage.setItem("studioso:nudge", String(Date.now())); } catch(err) {} render(); break;
    case "today-h": { const v = Math.max(0, Math.min(16, todayHours() + Number(id))); setTodayHours(v); render(); break; }
    case "focus-toggle": ui.focusOpen = !ui.focusOpen; render(); break;
    case "plan-rows": ui.planAllToday = !ui.planAllToday; render(); break;
    case "plan-tile": ui.planTile = id && ui.planTile !== id ? id : ""; render(); requestAnimationFrame(() => { const l = ui.planTile && document.querySelector("#view .plan .plan-past, #view .plan #planListLbl"); if (l && l.scrollIntoView) l.scrollIntoView({block: "nearest", behavior: "smooth"}); }); break;
    case "move-date": { const t = state.tasks[id]; if (!t) break; taskForm(t); const d = dlg.querySelector("input[name=due]"); if (d) { d.focus(); try { d.showPicker(); } catch (err) {} } break; }
    case "plan-sec": { const k = id === "how" ? "planHow" : "planMore"; ui[k] = !ui[k]; const p = document.getElementById("plan-" + id); if (p) p.hidden = !ui[k]; el.setAttribute("aria-expanded", String(ui[k])); break; }
    case "plan-why": { ui.planWhy = ui.planWhy || {}; const on = !ui.planWhy[id]; if (on) ui.planWhy[id] = 1; else delete ui.planWhy[id]; const p = document.getElementById("pw-" + id); if (p) p.hidden = !on; el.setAttribute("aria-expanded", String(on)); const li = el.closest(".plan-row"); if (li) li.classList.toggle("why-open", on); break; }
    case "show-old": ui.showOldDone = true; render(); break;
    case "hide-old": ui.showOldDone = false; render(); break;
    case "new-task":
      taskForm(null, {courseId: el.dataset.course || (ui.tab === "courses" && ui.courseId) || undefined,
        due: el.dataset.due || (ui.tab === "timeline" && ui.tlMode === "calendar" ? ui.calDay : ""), status: el.dataset.status});
      break;
    case "edit-task": { const t = state.tasks[id]; if (t) (el.dataset.edit ? taskForm : taskView)(t); break; }
    case "toggle": toggleTask(id, el); break;
    case "delete-task": deleteTask(id); break;
    case "archive-open": ui.tab = "archive"; dlg.open && dlg.close(); render(); window.scrollTo(0, 0); break;
    case "archive-back": ui.tab = "board"; render(); window.scrollTo(0, 0); break;
    case "arch-all": ui.archAll = true; render(); break;
    case "arch-restore": restoreTask(id, el.dataset.status); break;
    case "arch-course-restore": restoreCourse(id); break;
    case "new-term": if (dlg.open) dlg.close(); setTimeout(newTermSheet, 30); break;
    case "sch-prev": case "sch-next": ui.schWeek = addDays(ui.schWeek || mondayOf(todayISO()), act === "sch-prev" ? -7 : 7); render(); break;
    case "sch-notices": openSheet(`<div class="sheet">${head("Notices")}<div class="sheet-body sch-ntc-body">${schNoticeHtml}</div><div class="sheet-foot"><span class="spacer"></span><button type="button" class="btn primary" data-act="close">Done</button></div></div>`); break;
    case "sch-today": ui.schWeek = mondayOf(todayISO()); ui.schDay = null; render(); break;
    case "sch-day": ui.schDay = Number(id); render(); break;
    case "sch-occ": occView(el.dataset.type, id, el.dataset.key); break;
    case "sch-add": { const wk = ui.schWeek || mondayOf(todayISO()); eventForm(null, {date: wk === mondayOf(todayISO()) ? todayISO() : wk}); break; }
    case "avail-add": if (dlg.open) dlg.close(); setTimeout(() => availForm(null), 30); break;
    case "avail-open": if (dlg.open) dlg.close(); setTimeout(availManager, 30); break;
    case "avail-edit": { const b = availBlocks().find(x => x.id === id); if (b) { if (dlg.open) dlg.close(); setTimeout(() => availForm(b), 30); } break; }
    case "avail-dup": if (dlg.open) dlg.close(); availDuplicate(id); break;
    case "avail-del": if (dlg.open) dlg.close(); availDelete(id); break;
    case "avail-focus": availFocus(Number(el.dataset.s), Number(el.dataset.e)); break;
    case "daily-quote": if (dlg.open) dlg.close(); setTimeout(() => dailyQuote(true), 60); break;
    case "new-course": courseForm(null); break;
    case "edit-course": { const c = courseOf(id); if (c) courseForm(c); break; }
    case "course-more": { const c = courseOf(id); if (c) courseMoreSheet(c); break; }
    case "delete-course": {
      const c = courseOf(id); if (!c) break;
      const ts = allTasks().filter(t => t.courseId === id);
      confirmSheet("Delete Course?", `${c.name} and its ${ts.length} task${ts.length === 1 ? "" : "s"}${ts.length >= 5 ? ` (${ts.filter(t => t.status === "done").length} finished)` : ""} will be moved to Recently Deleted. You can undo right after, or restore it from Settings for ${TB.KEEP_DAYS} days.`, "Delete Course", () => {
        if (ui.filter === id) ui.filter = "all";
        ui.courseId = null;
        applyChanges([{kind:"course", id, after:null}, ...ts.map(t => ({kind:"task", id:t.id, after:null}))], `Deleted ${c.name}`);
      });
      break;
    }
    case "open-course": ui.courseId = id; ui.courseTab = ""; render(); window.scrollTo(0, 0); break;
    case "back": ui.courseId = null; render(); break;
    case "filter": ui.filter = id; render(); break;
    case "tl-mode": ui.tlMode = id; ui.tlJump = true; try { localStorage.setItem("studyboard:tlmode", id); } catch(err) {} render(); break;
    case "note-new": if (noteEditing) saveNoteText(); newNoteAt(); break;
    case "board-max": boardMax(!boardMaxOn()); break;
    case "nb-zoom": if (id === "reset") nbZoomTo(1); else nbZoomStep(id === "in" ? 1 : -1); break;
    case "nb-pick": if (noteEditing) saveNoteText(); ui.noteBoard = el.dataset.id || ""; try { localStorage.setItem(NB_KEY, ui.noteBoard); } catch (e) {} render(); break;
    case "nb-new": if (noteEditing) saveNoteText(); noteBoardSheet(""); break;
    case "nb-edit": noteBoardSheet(el.dataset.id); break;
    case "note-done": { const nid = noteEditing; saveNoteText(); noteRefocus(nid); break; }
    case "note-undo": noteUndoRedo(-1); break;
    case "note-redo": noteUndoRedo(1); break;
    case "note-versions": noteVersionsSheet(id); break;
    case "note-export": if (noteEditing && !id) saveNoteText(); noteExportSheet(id || ""); break;
    case "note-color": { const n = state.notes[id]; if (!n) break; const t = $("#noteText"); try { localStorage.setItem(NOTE_COLOR_KEY, el.dataset.color); } catch (err) {} applyChanges([{kind:"note", id, after: Object.assign(clone(n), {color: el.dataset.color, text: t ? t.value : n.text})}], ""); break; }
    case "note-archive": noteToArchive(id); break;
    case "note-trash": noteToTrash(id); break;
    case "note-archive-open": if (noteEditing) saveNoteText(); archiveSheet(); break;
    case "board-resort": setBoardManual(id, false); render(); toast(id === "done" ? "Most recently completed first" : "Sorted by due date"); break;
    case "group": ui.groupBy = id; try { localStorage.setItem("coursework:group", id); } catch(err){} render(); break;
    case "f-nav": ui.fCourse = el.dataset.c; ui.fFolder = el.dataset.f || ""; render(); break;
    case "f-go": ui.tab = "files"; ui.fCourse = el.dataset.c; ui.fFolder = el.dataset.f || ""; ui.courseId = null; render(); window.scrollTo(0, 0); break;
    case "f-open": { const f = state.files[id]; if (f) fileSheet(f); break; }
    case "f-upload": if (dlg.open) dlg.close(); $("#fUploadIn").click(); break;
    case "fab-course": fabMenu("Add Course", [["new-course", "Add Course", "Name, code, color and class times", "course"], ["import-syllabus", "Import a Syllabus", "Upload a PDF to add the course and its deadlines", "syllabus"], ["lms-open", "Connect Canvas, Brightspace or Blackboard", "Bring in your courses, due dates and grades", "school"]]); break;
    case "fab-file": fabMenu("Add File", [...(caps.assets ? [["f-upload", "Upload File", "PDFs, slides, documents and images", "upload"], ["f-quick", "Quick Add", "Drop files and let " + aiWho("Studyboard") + " sort them into the right course and folder", "", true]] : []), ["f-link", "Add Link", "For files kept in OneDrive, Google Drive or Canvas", "link"]]); break;
    case "fab-note": if (noteEditing) saveNoteText(); newNoteAt(); break;
    case "fab-deck": fabMenu("Add Deck", [["fc-new", "New Deck", "Add cards yourself or paste a list", "deck"], ...(inPreview() ? [] : [["fc-ai-cards", "Create with " + aiWho("AI"), "Upload slides or notes and get flashcards", "", true]]), ["ia-open", "Import From Another App", "Anki, Quizlet or Notion decks, read on this device", "upload"]]); break;
    case "qz-add": fabMenu("Add Quiz", [...(inPreview() ? [] : [["qz-ai", "From Slides or Notes", "Upload slides, notes or readings and get a practice quiz or case studies. No flashcards needed.", "", true]]), ["qz-from-deck", "From a Deck", aiReady() ? `${aiWho("AI")} writes questions from your flashcards` : "Questions from your flashcards", "deck"]]); break;
    case "qz-from-deck": quizSheet(ui.filter !== "all" ? decksArr().filter(d => d.courseId === ui.filter && d.cards.length).slice(0, 1).map(d => d.id) : []); break;
    case "qz-ai": aiStudySheet(null, "quiz"); break;
    case "fc-ai-cards": aiStudySheet(id || null, "cards"); break;
    case "rv-view": rvSet(id); ui.deckId = null; ui.fc = null; ui.qzOpen = null; render(); window.scrollTo(0, 0); break;
    case "qz-open": ui.qzOpen = id; render(); window.scrollTo(0, 0); break;
    case "qz-back": ui.qzOpen = null; render(); break;
    case "qz-archive": qzSetArchived(id, true); break;
    case "qz-unarchive": qzSetArchived(id, false); if (dlg.open) archivedQuizzesSheet(); break;
    case "qz-arch-open": archivedQuizzesSheet(); break;
    case "fc-share": case "qz-share": toast(`Sharing ${act === "fc-share" ? "decks" : "quizzes"} is done through a study group. Open Groups to start or join one.`, null, {label: "Groups", fn: () => { const b = document.querySelector('nav [data-tab="groups"]'); if (b) b.click(); }}); break;
    case "fab-group": fabMenu("Add Group", [["grp-new", "Create Group", "Start a study group or a group project", "group"], ["grp-code", "Enter a Code", "Join a group a classmate invited you to", "code"]]); break;
    case "f-link": linkSheet(); break;
    case "f-newfolder": folderSheet(null); break;
    case "f-folder-edit": { const fo = foldersOf(ui.fCourse === "all" ? "" : ui.fCourse).find(x => x.id === ui.fFolder); if (fo) folderSheet(fo); break; }
    case "f-sort": ui.fSort = id; render(); break;
    case "tl-zoom": ui.tlZoom = id; ui.tlJump = true; try { localStorage.setItem("studyboard:tlzoom", id); } catch(err) {} render(); break;
    case "tl-today": ui.tlJump = "smooth"; if (ui.tlMode !== "bars") ui.tlMode = "bars"; render(); break;
    case "pick-day": ui.calDay = id; if (id.slice(0, 7) !== ui.calMonth.slice(0, 7)) ui.calMonth = id.slice(0, 7) + "-01"; render(); break;
    case "cal-prev": case "cal-next": {
      const m = parse(ui.calMonth); m.setMonth(m.getMonth() + (act === "cal-prev" ? -1 : 1));
      ui.calMonth = iso(m); render(); break;
    }
    case "cal-today": ui.calDay = todayISO(); ui.calMonth = ui.calDay.slice(0, 7) + "-01"; render(); requestAnimationFrame(() => { const d = document.querySelector("#view .cal .today, #view .cal [aria-current]"); if (d && d.scrollIntoView) d.scrollIntoView({block: "nearest", behavior: "smooth"}); }); break;
    case "import-syllabus": importSheet(el.dataset.course || (ui.tab === "courses" ? ui.courseId : "") || ""); break;
    case "cal-export": calExportSheet(); break;
    case "backup-now":
      dlg.close();
      makeBackup().then(() => toast("Copy saved on this device")).catch(() => toast("Couldn't make a backup right now"));
      break;
    case "restore": restoreSheet(); break;
    case "export": dlg.close(); exportBackup(); break;
    case "import": dlg.close(); $("#importFile").click(); break;
    case "clear-all":
      confirmSheet("Clear All Data?", `This removes ${plural0(Object.keys(state.courses).length, "course")}, ${plural0(Object.keys(state.tasks).length, "task")}, ${plural0(Object.keys(state.notes).length, "note")}, ${plural0(Object.keys(state.decks || {}).length, "flashcard deck")}, ${plural0(Object.keys(state.files).length, "file")} and ${plural0(Object.keys(state.events || {}).length, "event")}. All of it goes to Recently Deleted for ${TB.KEEP_DAYS} days, you can undo right after, and weekly backups stay available.`, "Clear Everything", () => {
        ui.courseId = null; ui.filter = "all";
        backupBefore("Before clearing all data");
        applyChanges(replaceAllChanges([], [], [], [], [], []), "All data cleared");
        try { availRestore(null); } catch(e) {}
      });
      break;
  }
});
// Note board: press and hold an empty spot to pin a new note there
let nbHold = null, nbLastTouch = 0;
document.addEventListener("pointerdown", e => {
  if (e.pointerType !== "mouse") nbLastTouch = Date.now();
  if (ui.tab !== "notes" || e.target.id !== "nbBoard" || (e.pointerType === "mouse" && e.button !== 0)) return;
  clearTimeout(nbHold && nbHold.t);
  const board = e.target, x0 = e.clientX, y0 = e.clientY;
  nbHold = {x0, y0, id: e.pointerId, t: setTimeout(() => {
    if (!nbHold || !board.isConnected) return;
    nbHold = null;
    if (navigator.vibrate) { try { navigator.vibrate(12); } catch (x) {} }
    nbHoldDone = Date.now();
    const r = board.getBoundingClientRect();
    newNoteAt((x0 - r.left) / nbZ() - NOTE_W() / 2, (y0 - r.top) / nbZ() - 20);
  }, 500)};
});
let nbHoldDone = 0;
const nbHoldCancel = e => { if (nbHold && (!e || e.pointerId === nbHold.id)) { clearTimeout(nbHold.t); nbHold = null; } };
document.addEventListener("pointermove", e => { if (nbHold && e.pointerId === nbHold.id && Math.hypot(e.clientX - nbHold.x0, e.clientY - nbHold.y0) > 8) nbHoldCancel(e); }, {passive: true});
document.addEventListener("pointerup", nbHoldCancel);
document.addEventListener("pointercancel", nbHoldCancel);
document.addEventListener("scroll", () => nbHoldCancel(), {passive: true, capture: true});
document.addEventListener("contextmenu", e => { if (ui.tab === "notes" && e.target.id === "nbBoard" && (nbHold || Date.now() - nbHoldDone < 800)) e.preventDefault(); });
document.addEventListener("dblclick", e => {
  if (ui.tab !== "notes" || e.target.id !== "nbBoard" || Date.now() - nbLastTouch < 1000 || Date.now() - nbHoldDone < 800) return;
  const r = e.target.getBoundingClientRect();
  newNoteAt((e.clientX - r.left) / nbZ() - NOTE_W() / 2, (e.clientY - r.top) / nbZ() - 20);
});
document.addEventListener("change", e => {
  if (e.target.classList && e.target.classList.contains("note-task")) {
    const n = state.notes[e.target.dataset.id]; const t = $("#noteText");
    const tk = state.tasks[e.target.value];
    if (n) applyChanges([{kind:"note", id: n.id, after: Object.assign(clone(n), {taskId: e.target.value || "", courseId: tk && !n.courseId ? tk.courseId || "" : n.courseId, text: t ? t.value : n.text})}], tk ? `Note attached to ${tk.title}` : "Note detached");
    return;
  }
  if (e.target.classList && e.target.classList.contains("note-course")) {
    const n = state.notes[e.target.dataset.id]; const t = $("#noteText");
    if (n) applyChanges([{kind:"note", id: n.id, after: Object.assign(clone(n), {courseId: e.target.value, text: t ? t.value : n.text})}], "");
    return;
  }
  if (e.target.id === "fUploadIn") { const list = [...(e.target.files || [])]; e.target.value = ""; if (list.length) uploadFiles(list, Object.assign(uploadTarget(), {cloud: true})); }
});
document.addEventListener("keydown", e => {
  if (e.target.id === "noteText" && (e.key === "Escape" || (e.key === "Enter" && (e.metaKey || e.ctrlKey)))) { e.preventDefault(); const nid = noteEditing; saveNoteText(); noteRefocus(nid); return; }
  const nf = e.target.matches && e.target.matches('.note[role="button"]') ? state.notes[e.target.dataset.note] : null;
  if (nf && (e.key === "[" || e.key === "]")) {
    e.preventDefault();
    const r = Math.round(((Number(nf.rot) || 0) + (e.key === "]" ? 5 : -5) + 540) % 360 - 180);
    applyChanges([{kind:"note", id: nf.id, after: Object.assign(clone(nf), {rot: r})}], "");
    setTimeout(() => { const el = $(`.note[data-note="${CSS.escape(nf.id)}"]`); if (el) el.focus(); }, 40); return;
  }
  if (nf) {
    const step = e.shiftKey ? 40 : 10, mv = {ArrowLeft:[-step,0], ArrowRight:[step,0], ArrowUp:[0,-step], ArrowDown:[0,step]}[e.key];
    if (mv) { e.preventDefault(); applyChanges([{kind:"note", id: nf.id, after: Object.assign(clone(nf), {x: Math.max(0, nf.x + mv[0]), y: Math.max(0, nf.y + mv[1])})}], ""); setTimeout(() => { const el = $(`.note[data-note="${CSS.escape(nf.id)}"]`); if (el) el.focus(); }, 40); return; }
    if (e.key === "Delete" || e.key === "Backspace") { e.preventDefault(); noteToTrash(nf.id); return; }
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.target.click(); return; }
  }
  if ((e.key === "Enter" || e.key === " ") && e.target.matches && e.target.matches('.card[role="button"]')) { e.preventDefault(); e.target.click(); }
});
function toggleSearch(open){
  const row = $("#searchRow");
  row.hidden = !open;
  if (open) $("#searchInput").focus();
  else { ui.q = ""; $("#searchInput").value = ""; render(); }
}
let qT;
$("#searchInput").addEventListener("input", e => { clearTimeout(qT); qT = setTimeout(() => { ui.q = e.target.value; render(); }, 120); });
$("#searchInput").addEventListener("keydown", e => { if (e.key === "Escape") toggleSearch(false); });

/* Drag: board cards and timeline bars (mouse, pen and touch) */
let drag = null;
document.addEventListener("pointerdown", e => {
  if (drag || (e.pointerType === "mouse" && e.button !== 0)) return;
  if (e.target.closest && e.target.closest(".lms-go, .card-check")) return;
  const rotEl = e.target.closest && e.target.closest(".note-rot");
  if (rotEl) {
    const nEl = rotEl.closest(".note");
    drag = {kind: "rot", id: rotEl.dataset.rot, el: nEl, x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY, started: false, touch: e.pointerType !== "mouse", pid: e.pointerId};
    e.preventDefault(); return;
  }
  const noteEl = e.target.closest && e.target.closest(".note:not(.editing)");
  const cardEl = !noteEl && e.target.closest && e.target.closest(".board .card");
  const barEl = !noteEl && !cardEl && e.target.closest && e.target.closest(".tlbar, .ms");
  if (!cardEl && !barEl && !noteEl) return;
  const el = cardEl || barEl || noteEl;
  drag = {kind: noteEl ? "note" : cardEl ? "card" : "bar", id: noteEl ? noteEl.dataset.note : el.dataset.id, el, x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY, started: false, touch: e.pointerType !== "mouse", pid: e.pointerId};
  if (barEl) {
    const r = barEl.getBoundingClientRect(), edge = Math.min(12, r.width / 3);
    drag.isMs = barEl.classList.contains("ms");
    drag.mode = drag.isMs ? (barEl.dataset.dueonly ? "end" : "move") : e.clientX - r.left < edge ? "start" : r.right - e.clientX < edge ? "end" : "move";
  }
  if (drag.touch && cardEl && e.target.closest(".card-grip")) { e.preventDefault(); startDrag(); return; }
  if (drag.touch && drag.kind !== "note") drag.timer = setTimeout(() => { if (drag && !drag.started) startDrag(); }, drag.kind === "card" ? 200 : 320);
});
document.addEventListener("pointermove", e => {
  if (!drag) {
    const b = e.pointerType === "mouse" && e.target.closest && e.target.closest(".tlbar");
    if (b) { const r = b.getBoundingClientRect(), edge = Math.min(12, r.width / 3); b.style.cursor = (e.clientX - r.left < edge || r.right - e.clientX < edge) ? "ew-resize" : "grab"; }
    return;
  }
  if (e.pointerId !== drag.pid) return;
  drag.x = e.clientX; drag.y = e.clientY;
  if (!drag.started) {
    const d = Math.hypot(drag.x - drag.x0, drag.y - drag.y0);
    if (drag.touch && drag.kind !== "note" && drag.kind !== "rot") { if (d > 10) { clearTimeout(drag.timer); drag = null; } }
    else if (d > (drag.kind === "rot" ? 1 : 5)) startDrag();
    return;
  }
  e.preventDefault();
}, {passive: false});
document.addEventListener("pointerup", e => { if (!drag || e.pointerId !== drag.pid) return; clearTimeout(drag.timer); if (drag.started) endDrag(true); else drag = null; });
// On phones the browser can cancel a long-press drag part way
document.addEventListener("pointercancel", e => { if (!drag || e.pointerId !== drag.pid) return; clearTimeout(drag.timer); if (drag.started) endDrag(drag.kind === "card" && drag.touch); else drag = null; });
document.addEventListener("touchend", () => { if (drag && drag.started && drag.touch && drag.kind === "card") { clearTimeout(drag.timer); endDrag(true); } });
document.addEventListener("touchmove", e => { if (drag && drag.started) e.preventDefault(); }, {passive: false});
document.addEventListener("contextmenu", e => { if (drag) e.preventDefault(); });
window.addEventListener("keydown", e => { if (e.key === "Escape" && drag && drag.started) endDrag(false); });

function startDrag(){
  drag.started = true; renderBlocked = true;
  if (navigator.vibrate) { try { navigator.vibrate(12); } catch(e){} }
  if (drag.kind === "rot") {
    const n = state.notes[drag.id];
    if (!n) { drag.started = false; renderBlocked = false; drag = null; return; }
    const r = drag.el.getBoundingClientRect();
    drag.cx = r.left + r.width / 2; drag.cy = r.top + r.height / 2;
    drag.a0 = Math.atan2(drag.y0 - drag.cy, drag.x0 - drag.cx); drag.rot0 = Number(n.rot) || 0; drag.rot = drag.rot0;
    drag.el.classList.add("rotating");
  } else if (drag.kind === "note") {
    const n = state.notes[drag.id];
    if (!n) { drag.started = false; renderBlocked = false; drag = null; return; }
    const br = $("#nbBoard").getBoundingClientRect();
    drag.dx = (drag.x0 - br.left) / nbZ() - n.x; drag.dy = (drag.y0 - br.top) / nbZ() - n.y;
    drag.nx = n.x; drag.ny = n.y;
    drag.el.classList.add("dragging"); drag.el.style.zIndex = 9500;
    document.body.classList.add("dragging-note");
  } else if (drag.kind === "card") {
    const el = drag.el, r = el.getBoundingClientRect();
    drag.dx = drag.x - r.left; drag.dy = drag.y - r.top;
    const g = el.cloneNode(true);
    g.classList.add("ghost"); g.removeAttribute("tabindex"); g.setAttribute("aria-hidden", "true");
    g.style.width = r.width + "px"; g.style.left = r.left + "px"; g.style.top = r.top + "px";
    drag.gl = r.left; drag.gt = r.top;
    document.body.appendChild(g); drag.ghost = g;
    const ph = document.createElement("div"); ph.className = "placeholder"; ph.style.height = r.height + "px";
    el.after(ph); el.style.display = "none"; drag.ph = ph;
    drag.board = el.closest(".board"); if (drag.board) drag.board.classList.add("dragging");
  } else {
    const t = state.tasks[drag.id];
    if (!t) { drag.started = false; renderBlocked = false; drag = null; return; }
    const sc = drag.el.closest(".tl-scroll");
    drag.sc = sc; drag.dw = Number(sc.dataset.dw) || 22; drag.s0 = sc.scrollLeft;
    drag.start0 = startOf(t); drag.due0 = t.due; drag.start = drag.start0; drag.due = drag.due0;
    drag.left0 = parseFloat(drag.el.style.left); drag.w0 = parseFloat(drag.el.style.width);
    drag.el.classList.add("dragging");
    const tip = document.createElement("div"); tip.className = "tl-tip"; document.body.appendChild(tip); drag.tip = tip;
  }
  drag.raf = requestAnimationFrame(tick);
}
function tick(){
  if (!drag || !drag.started) return;
  if (drag.kind === "rot") {
    let r = drag.rot0 + (Math.atan2(drag.y - drag.cy, drag.x - drag.cx) - drag.a0) * 180 / Math.PI;
    r = ((r + 540) % 360) - 180;
    if (Math.abs(r) < 4) r = 0;
    else if (Math.abs(Math.abs(r) - 90) < 3) r = Math.sign(r) * 90;
    drag.rot = Math.round(r);
    drag.el.style.setProperty("--rot", drag.rot + "deg");
    drag.el.dataset.deg = drag.rot + "°";
    drag.raf = requestAnimationFrame(tick); return;
  }
  if (drag.kind === "note") {
    const sc = $("#nbScroll"), board = $("#nbBoard");
    const overT = (() => { const u = document.elementFromPoint(drag.x, drag.y); return !!(u && u.closest("[data-drop-note]")) || $$(".nb-target").some(t => { const q = t.getBoundingClientRect(); return drag.x >= q.left - 8 && drag.x <= q.right + 8 && drag.y >= q.top - 8 && drag.y <= q.bottom + 8; }); })();
    if (sc && board) {
      const r = sc.getBoundingClientRect();
      if (!overT) {
        if (drag.x < r.left + 40) sc.scrollLeft -= 10; else if (drag.x > r.right - 40) sc.scrollLeft += 10;
        if (drag.y < r.top + 40) sc.scrollTop -= 10; else if (drag.y > r.bottom - 40) sc.scrollTop += 10;
      }
      const br = board.getBoundingClientRect();
      drag.nx = Math.max(0, Math.min(6000, Math.round((drag.x - br.left) / nbZ() - drag.dx)));
      drag.ny = Math.max(0, Math.min(6000, Math.round((drag.y - br.top) / nbZ() - drag.dy)));
      const needW = drag.nx + drag.el.offsetWidth + 28, needH = drag.ny + drag.el.offsetHeight + 28;
      let grew = false;
      if (!overT && needW > board.offsetWidth) { board.style.width = needW + "px"; grew = true; }
      if (!overT && needH > board.offsetHeight) { board.style.height = needH + "px"; grew = true; }
      if (grew) nbZoomApply();
      drag.el.style.left = drag.nx + "px"; drag.el.style.top = drag.ny + "px";
    }
    const under = document.elementFromPoint(drag.x, drag.y);
    const tgt = under && under.closest("[data-drop-note]");
    $$("[data-drop-note]").forEach(t => t.classList.toggle("hot", t === tgt));
    drag.el.classList.toggle("over-target", !!tgt);
    drag.target = tgt ? tgt.dataset.dropNote : null;
    drag.raf = requestAnimationFrame(tick);
    return;
  }
  if (drag.kind === "card") {
    const pm = drag.x !== drag.lx || drag.y !== drag.ly, moved = pm || window.scrollY !== drag.sy; drag.lx = drag.x; drag.ly = drag.y; drag.sy = window.scrollY;
    if (pm) drag.ghost.style.translate = (drag.x - drag.dx - drag.gl) + "px " + (drag.y - drag.dy - drag.gt) + "px";
    const edge = drag.y < 110 || drag.y > window.innerHeight - 120;
    if (!moved && !edge && !drag.hs) { drag.raf = requestAnimationFrame(tick); return; }
    const under = document.elementFromPoint(drag.x, drag.y);
    const b = (under && under.closest(".board")) || drag.board;
    drag.hs = false;
    if (b && b.scrollWidth > b.clientWidth) { const br = b.getBoundingClientRect(); if (drag.x < br.left + 40) { b.scrollLeft -= 10; drag.hs = true; } else if (drag.x > br.right - 40) { b.scrollLeft += 10; drag.hs = true; } }
    if (drag.y < 110) window.scrollBy(0, -9); else if (drag.y > window.innerHeight - 120) window.scrollBy(0, 9);
    placeAt(drag.x, drag.y);
  } else {
    const sc = drag.sc, r = sc.getBoundingClientRect();
    if (drag.x < r.left + 160 && sc.scrollLeft > 0) sc.scrollLeft -= 8; else if (drag.x > r.right - 40) sc.scrollLeft += 8;
    const n = Math.round((drag.x - drag.x0 + sc.scrollLeft - drag.s0) / drag.dw);
    let s = drag.start0, d = drag.due0;
    if (drag.mode === "move") { s = addDays(s, n); d = addDays(d, n); }
    else if (drag.mode === "start") { s = addDays(s, n); if (s > d) s = d; }
    else { d = addDays(d, n); if (d < s) { if (drag.isMs) s = d; else d = s; } }
    drag.start = s; drag.due = d;
    const shiftL = (drag.isMs ? dayDiff(drag.due0, d) : dayDiff(drag.start0, s)) * drag.dw, w = (dayDiff(s, d) + 1) * drag.dw;
    drag.el.style.left = (drag.left0 + shiftL) + "px"; if (!drag.isMs) drag.el.style.width = w + "px";
    drag.tip.textContent = (s === d ? fmtDate(d) : fmtShort(s) + " to " + fmtShort(d));
    drag.tip.style.left = Math.min(window.innerWidth - 170, Math.max(8, drag.x - 60)) + "px";
    drag.tip.style.top = Math.max(8, drag.y - 52) + "px";
  }
  drag.raf = requestAnimationFrame(tick);
}
/* Runs step() at a steady 60 steps a second whatever the screen's refresh rate */
function loop60(step){
  let last = 0, acc = 0;
  const run = now => {
    acc += Math.min(100, now - (last || now - 16.6)); last = now;
    let n = 0;
    while (acc >= 16.6 && n < 4) { acc -= 16.6; n++; if (!step()) return; }
    requestAnimationFrame(run);
  };
  requestAnimationFrame(run);
}
function fireworks(){
  if (window.SBMotion && SBMotion.noParticles()) { SBMotion.flash(); return; }
  const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const cv = document.createElement("canvas");
  cv.className = "confetti"; cv.setAttribute("aria-hidden", "true");
  const dpr = Math.min(2, window.devicePixelRatio || 1), W = window.innerWidth, H = window.innerHeight;
  cv.width = W * dpr; cv.height = H * dpr; document.body.appendChild(cv);
  const g = cv.getContext("2d"); g.scale(dpr, dpr);
  const pal = [["#FF5A4E", "#FFB199"], ["#FFD23F", "#FFF1A8"], ["#3BA4FF", "#B9E0FF"], ["#34D399", "#B5F5DA"], ["#C084FC", "#EBD5FF"], ["#FF7AC6", "#FFD1EC"]];
  const rockets = [], sparks = [];
  const nR = reduce ? 2 : Math.max(5, Math.min(9, Math.round(W / 190)));
  for (let i = 0; i < nR; i++) {
    const x = W * (0.12 + 0.76 * (i + Math.random() * 0.6) / nR), ty = H * (0.12 + Math.random() * 0.33);
    rockets.push({x, y: H + 10, vx: (Math.random() - 0.5) * 1.6, vy: -Math.sqrt(2 * 0.18 * (H + 10 - ty)), c: pal[Math.floor(Math.random() * pal.length)], delay: Math.floor(i * (reduce ? 10 : 7) + Math.random() * 6), trail: []});
  }
  const burst = r => {
    const n = reduce ? 30 : 70 + Math.floor(Math.random() * 30), ring = Math.random() < 0.35;
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2 + Math.random() * 0.1, sp = ring ? 4.6 : 1.2 + Math.random() * 4.4;
      sparks.push({x: r.x, y: r.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 60 + Math.random() * 30, age: 0, c: Math.random() < 0.7 ? r.c[0] : r.c[1], tw: Math.random() < 0.3});
    }
  };
  let f = 0;
  const step = () => {
    g.globalCompositeOperation = "destination-out"; g.fillStyle = "rgba(0,0,0,0.28)"; g.fillRect(0, 0, W, H);
    g.globalCompositeOperation = "lighter";
    let alive = 0;
    rockets.forEach(r => {
      if (r.done) return; alive++;
      if (f < r.delay) return;
      r.x += r.vx; r.y += r.vy; r.vy += 0.18;
      g.fillStyle = r.c[1]; g.beginPath(); g.arc(r.x, r.y, 2.2, 0, 6.3); g.fill();
      g.fillStyle = "rgba(255,220,160,.6)"; g.beginPath(); g.arc(r.x - r.vx, r.y - r.vy * 0.6, 1.6, 0, 6.3); g.fill();
      if (r.vy >= -0.6) { r.done = true; burst(r); }
    });
    sparks.forEach(p => {
      if (p.age > p.life) return; alive++;
      p.age++; p.vx *= 0.975; p.vy = p.vy * 0.975 + 0.055; p.x += p.vx; p.y += p.vy;
      const a = 1 - p.age / p.life;
      if (p.tw && Math.random() < 0.3) return;
      g.globalAlpha = Math.max(0, a); g.fillStyle = p.c; g.beginPath(); g.arc(p.x, p.y, 1.1 + a * 1.6, 0, 6.3); g.fill(); g.globalAlpha = 1;
    });
    f++;
    if (alive && f < 260) return true;
    cv.style.transition = "opacity .3s"; cv.style.opacity = "0"; setTimeout(() => cv.remove(), 320); return false;
  };
  loop60(step);
}
function confetti(){
  if (window.SBMotion && SBMotion.noParticles()) { SBMotion.flash(); return; }
  const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const cv = document.createElement("canvas");
  cv.className = "confetti"; cv.setAttribute("aria-hidden", "true");
  const dpr = Math.min(2, window.devicePixelRatio || 1), W = window.innerWidth, H = window.innerHeight;
  cv.width = W * dpr; cv.height = H * dpr;
  document.body.appendChild(cv);
  const g = cv.getContext("2d"); g.scale(dpr, dpr);
  const cols = ["#E8483B", "#1E9E74", "#FFC933", "#3B82F6", "#9A4FD1", "#FF8A3D", "#23B5D3", "#F062A0"].concat(coursesArr().map(c => c.color));
  const N = reduce ? 40 : Math.min(320, Math.round(W * H / 5200));
  const bursts = [[0.12, 1.02], [0.88, 1.02], [0.5, 1.04], [0.3, 0.2], [0.7, 0.2]];
  const P = [];
  for (let i = 0; i < N; i++) {
    const [bx, by] = bursts[i % bursts.length], up = by > 0.5;
    const a = up ? (-Math.PI / 2 + (Math.random() - 0.5) * 1.1 + (bx < 0.4 ? 0.35 : bx > 0.6 ? -0.35 : 0)) : Math.random() * Math.PI * 2;
    const sp = up ? (H * 0.028 + Math.random() * H * 0.018) : (3 + Math.random() * 7);
    P.push({x: bx * W, y: by * H, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, w: 6 + Math.random() * 7, h: 4 + Math.random() * 6, r: Math.random() * 6.3, vr: (Math.random() - 0.5) * 0.35,
      c: cols[Math.floor(Math.random() * cols.length)], shape: Math.random() < 0.25 ? 1 : 0, wob: Math.random() * 6.3, delay: up ? 0 : 6 + Math.floor(Math.random() * 10)});
  }
  let f = 0;
  const step = () => {
    g.clearRect(0, 0, W, H);
    let alive = 0;
    for (const p of P) {
      if (f < p.delay) { alive++; continue; }
      p.vy += 0.32; p.vx *= 0.985; p.vy *= 0.985; p.x += p.vx + Math.sin(p.wob) * 0.8; p.y += p.vy; p.r += p.vr; p.wob += 0.1;
      if (p.y > H + 30) continue;
      alive++;
      const fade = f > 150 ? Math.max(0, 1 - (f - 150) / 50) : 1;
      g.save(); g.globalAlpha = fade; g.translate(p.x, p.y); g.rotate(p.r); g.fillStyle = p.c;
      if (p.shape) { g.beginPath(); g.arc(0, 0, p.h / 1.6, 0, 6.3); g.fill(); } else { g.scale(1, Math.cos(p.wob)); g.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); }
      g.restore();
    }
    f++;
    if (alive && f < 200) return true;
    cv.remove(); return false;
  };
  loop60(step);
}
function placeAt(x, y){
  const under = document.elementFromPoint(x, y);
  const col = under && under.closest(".col");
  $$(".col.over").forEach(c => { if (c !== col) c.classList.remove("over"); });
  if (!col) return;
  col.classList.add("over");
  const shown = el => el.checkVisibility ? el.checkVisibility() : !!el.getClientRects().length;
  const lists = [...col.querySelectorAll(".col-list")].filter(shown);
  const list = lists[lists.length - 1] || col.querySelector(".col-list");
  const cards = [...col.querySelectorAll(".card")].filter(c => c !== drag.el && shown(c));
  let before = null;
  for (const c of cards) { const r = c.getBoundingClientRect(); if (y < r.top + r.height / 2) { before = c; break; } }
  if (before) { if (drag.ph.nextElementSibling !== before) before.parentNode.insertBefore(drag.ph, before); }
  else if (list.lastElementChild !== drag.ph) list.appendChild(drag.ph);
}
function endDrag(ok){
  cancelAnimationFrame(drag.raf);
  const d = drag; drag = null; renderBlocked = false;
  suppressClick = true; setTimeout(() => { suppressClick = false; }, 400);
  if (d.kind === "rot") {
    d.el.classList.remove("rotating");
    const n = state.notes[d.id];
    if (!ok || !n || d.rot === n.rot) { render(); return; }
    applyChanges([{kind:"note", id: n.id, after: Object.assign(clone(n), {rot: d.rot})}], "");
    return;
  }
  if (d.kind === "note") {
    document.body.classList.remove("dragging-note");
    $$("[data-drop-note]").forEach(t => t.classList.remove("hot"));
    const n = state.notes[d.id];
    if (!ok || !n) { render(); return; }
    if (d.target === "trash") { noteToTrash(n.id); return; }
    if (d.target === "archive") { noteToArchive(n.id); return; }
    if (d.target && d.target.startsWith("board:")) { noteToBoard(n.id, d.target.slice(6)); return; }
    const z = notesArr().reduce((m, x) => Math.max(m, x.z || 0), 0) + (n.z === notesArr().reduce((m, x) => Math.max(m, x.z || 0), 0) ? 0 : 1);
    if (d.nx === n.x && d.ny === n.y && z === n.z) { render(); return; }
    applyChanges([{kind:"note", id: n.id, after: Object.assign(clone(n), {x: d.nx, y: d.ny, z})}], "");
    return;
  }
  const t = state.tasks[d.id];
  if (d.kind === "bar") {
    d.tip.remove(); d.el.classList.remove("dragging");
    if (!ok || !t || (d.start === d.start0 && d.due === d.due0)) { render(); return; }
    const n = Object.assign(clone(t), {start: d.start, due: d.due});
    const label = `${t.title}: ${d.start === d.due ? fmtShort(d.due) : fmtShort(d.start) + " to " + fmtShort(d.due)}`;
    const inv = applyChanges([{kind:"task", id: t.id, after: n}], "");
    const redo = () => { applyChanges(inv, null); toast("Undone"); };
    toast(label, redo, shiftOffer(t.id));
    return;
  }
  d.ghost.remove();
  if (d.board) d.board.classList.remove("dragging");
  $$(".col.over").forEach(c => c.classList.remove("over"));
  if (d.el && d.el.dataset && d.el.dataset.gt) {
    const colEl = ok && d.ph && d.ph.parentNode ? d.ph.closest(".col") : null;
    if (colEl && window.SBGROUPTASKS) {
      const status = colEl.dataset.status, gid = d.el.dataset.gt;
      const fromCol = d.el.closest && d.el.closest(".col"); if (fromCol && fromCol.dataset.status === status) setBoardManual(status, true);
      const ids = [...colEl.querySelectorAll(".col-list > *")].filter(n => n === d.ph || (n.classList.contains("card") && n !== d.el)).map(n => n === d.ph ? gid : n.dataset.id);
      const changes = renumberBoardCol(ids, status);
      if (changes.length) applyChanges(changes, "");
      window.SBGROUPTASKS.setStatus(gid, status);
    }
    render(); return;
  }
  if (!ok || !t || !d.ph.parentNode || !d.ph.closest(".col")) { render(); return; }
  const colEl = d.ph.closest(".col");
  const status = colEl.dataset.status;
  const laneCourse = colEl.hasAttribute("data-course") ? colEl.dataset.course : null;
  const seq = [...d.ph.closest(".col").querySelectorAll(".col-list > *")].filter(n => n === d.ph || (n.classList.contains("card") && n !== d.el));
  const i = seq.indexOf(d.ph);
  const prev = seq[i - 1] ? state.tasks[seq[i - 1].dataset.id] : null, next = seq[i + 1] ? state.tasks[seq[i + 1].dataset.id] : null;
  const num = x => x && typeof x.order === "number";
  const changes = [];
  let order;
  const gNeighbour = (seq[i - 1] && seq[i - 1].dataset.gt) || (seq[i + 1] && seq[i + 1].dataset.gt);
  if (gNeighbour || (prev && !num(prev)) || (next && !num(next)) || (num(prev) && num(next) && Math.abs(next.order - prev.order) < 1e-6)) {
    const colTasks = tasksArr().filter(x => x.status === status && x.id !== t.id).sort(boardOrder);
    const ids = seq.map(n => n === d.ph ? t.id : n.dataset.id);
    const rest = colTasks.filter(x => !ids.includes(x.id)).map(x => x.id).concat(groupBoardRows(status).filter(r => !ids.includes(r.id)).map(r => r.id)), gOrd = {};
    [...ids, ...rest].forEach((tid, k) => {
      if (tid === t.id) { order = (k + 1) * 10; return; }
      const x = state.tasks[tid]; if (!x) { gOrd[tid] = (k + 1) * 10; return; }
      if (x.order !== (k + 1) * 10) changes.push({kind:"task", id: tid, after: Object.assign(clone(x), {order: (k + 1) * 10})});
    });
    if (window.SBGROUPTASKS && Object.keys(gOrd).length) window.SBGROUPTASKS.setOrders(gOrd);
  } else if (num(prev) && num(next)) order = (prev.order + next.order) / 2;
  else if (num(prev)) order = prev.order + 10;
  else if (num(next)) order = next.order - 10;
  else order = 10;
  const n = Object.assign(clone(t), {status, order});
  if (t.status === status) setBoardManual(status, true);
  if (status === "done" && t.status !== "done") { n.doneAt = Date.now(); n.pct = 100; }
  if (status !== "done") n.doneAt = null;
  if (!MILESTONE(t.type) && status !== t.status) { if (status === "todo") n.pct = 0; else if (status === "doing" && n.pct >= 100) n.pct = 90; }
  const movedCourse = laneCourse !== null && laneCourse !== (t.courseId || "");
  if (movedCourse) n.courseId = laneCourse;
  changes.push({kind:"task", id: t.id, after: n});
  const cName = movedCourse ? (courseOf(laneCourse) ? courseLabel(courseOf(laneCourse)) : "No Course") : "";
  if (status === "done" && t.status !== "done") celebrate("drag");
  ui.boardFocus = {status, course: laneCourse};
  applyChanges(changes, movedCourse ? `Moved ${t.title} to ${cName}${t.status !== status ? ", " + STATUS_LABEL[status] : ""}` : t.status !== status ? `Moved ${t.title} to ${STATUS_LABEL[status]}` : "Card moved");
}


