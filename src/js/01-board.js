/* ===== module: 01-board.js: the app's core, the Board, the focus engine and what the planner knows ===== */
/* Board */
function card(t){
  const c = courseOf(t.courseId);
  const nf = filesOfTask(t.id).length;
  const late = t.status !== "done" && t.due && t.due < todayISO();
  const p = progress(t);
  return `<div class="card ${c ? "has-tab" : ""} ${t.status === "done" ? "is-done" : ""}" role="button" tabindex="0" data-act="edit-task" data-id="${esc(t.id)}" style="--c:${esc(colorOf(t.courseId))}">
    <span class="card-grip" aria-hidden="true"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><circle cx="9" cy="6" r="1.6"/><circle cx="15" cy="6" r="1.6"/><circle cx="9" cy="12" r="1.6"/><circle cx="15" cy="12" r="1.6"/><circle cx="9" cy="18" r="1.6"/><circle cx="15" cy="18" r="1.6"/></svg></span>
    ${c ? `<div class="card-course"><span class="cc-ic" aria-hidden="true">${courseRingHtml(c)}</span>${esc(courseLabel(c))}</div>` : ""}
    <div class="card-title"><button type="button" class="check card-check" data-act="toggle" data-id="${esc(t.id)}" aria-label="${t.status === "done" ? "Mark not done" : "Mark complete"}: ${esc(t.title)}" aria-pressed="${t.status === "done"}">${CHECK}</button><span>${esc(t.title)}</span></div>
    ${(t.reading && t.type === "Reading") || (t.location && (MILESTONE(t.type) || t.type === "Lab")) ? `<div class="card-sub">${esc(t.type === "Reading" ? t.reading : t.location)}</div>` : ""}
    <div class="card-foot">${t.priority && t.priority !== "med" ? prioBadge(t.priority) : ""}${(() => { if (!t.due) return ""; if (late) return `<span class="soon late">${esc(relDue(t))}</span>`; const sb = soonBadge(t); return sb ? sb + (t.time && !/Due in \d+h/.test(sb) ? `<span>${esc(fmtTime(t.time))}</span>` : "") : ""; })()}${statusBadges(t)}<span>${esc(t.type || "Task")}</span>${MILESTONE(t.type) && t.status !== "done" && !remoteOf(t).v ? `<button type="button" class="rx-q" data-act="edit-task" data-id="${esc(t.id)}" title="Not sure if this can be taken from home. Open it to say where it is taken." aria-label="Not sure where ${esc(t.title)} is taken. Open it to set that">?</button>` : ""}${t.due && !late && !soonBadge(t) ? `<span>${esc(relDue(t).replace(/^Due /, ""))}</span>` : ""}${isNum(t.hours) && !MILESTONE(t.type) ? `<span>${fmtH(Number(t.hours))}</span>` : ""}${t.seriesId ? `<span title="Repeats">${REPEAT}</span>` : ""}${nf ? `<span title="${nf} attached file${nf === 1 ? "" : "s"}">${CLIP}${nf}</span>` : ""}${(nn => nn ? `<span class="note-count" title="${nn} sticky note${nn === 1 ? "" : "s"}">${NOTE_ICON}${nn}</span>` : "")(notesOfTask(t.id).length)}${t.pomos ? `<span class="pomo-count" title="${t.pomos} focus session${t.pomos === 1 ? "" : "s"}, ${fmtMins(t.focusMin)}">${TOMATO}${t.pomos}</span>` : ""}${lmsGoBtn(t)}</div>
    ${t.breakdownOf && window.SBBREAK ? `<div class="card-sub">${SBBREAK.rowMeta(t)}</div>` : ""}
    ${p.prep ? (t.status !== "done" ? `<div class="prog"><span class="track"><i style="width:${(p.frac * 100).toFixed(0)}%"></i></span>${Math.round(p.frac * 100)}% prepared</div>` : "") : p.total ? `<div class="prog"><span class="track"><i style="width:${(p.frac * 100).toFixed(0)}%"></i></span>${p.done}/${p.total}</div>` : (t.status !== "done" && p.frac > 0 ? `<div class="prog"><span class="track"><i style="width:${(p.frac * 100).toFixed(0)}%"></i></span>${Math.round(p.frac * 100)}%</div>` : "")}
  </div>`;
}
function backupNudge(){
  if (inPreview() || !tasksArr().length) return "";
  if (FSB.status === "paused") return `<div class="nudge"><span>Automatic backups to “${esc(FSB.where)}” are paused until you allow access again.</span><button class="btn small primary" data-act="fsb-resume">Resume Backups</button></div>`;
  if (FSB.status === "on") return "";
  const last = Number(localStorage.getItem("studioso:lastExport") || 0), later = Number(localStorage.getItem("studioso:nudge") || 0);
  const week = 7 * 864e5;
  if (Date.now() - last < week || Date.now() - later < 5 * 864e5) return "";
  const days = last ? Math.floor((Date.now() - last) / 864e5) : 0;
  return `<div class="nudge"><span>${last ? `Last backup: ${days} days ago.` : "No backup saved to this computer yet."}</span><button class="btn small primary" data-act="export">Download Backup</button><button class="btn small" data-act="nudge-later">Later</button></div>`;
}
const COL_MAX = 5;
// Group project tasks assigned to me, shown on the Task Board in the column for their status
const groupBoardRows = status => window.SBGROUPTASKS ? window.SBGROUPTASKS.boardRows(status) : [];
// a group task's course here (matched by its course code)
const groupRowCourse = r => { const k = String(r && r.courseCode || "").replace(/\s+/g, "").toLowerCase(); const c = k ? coursesArr().find(x => (x.code || "").replace(/\s+/g, "").toLowerCase() === k) : null; return c ? c.id : ""; };
const groupBoardShown = status => groupBoardRows(status).filter(r => ui.filter === "all" || groupRowCourse(r) === ui.filter);
function groupBoardCard(r){
  const p = {id: r.id, due: r.due, status: r.status, time: ""}, today = todayISO(), late = r.status !== "done" && r.due && r.due < today, sb = soonBadge(p);
  const prio = r.priority && r.priority !== "med" && r.priority !== "" ? prioBadge(r.priority) : "";
  return `<div class="card has-tab gcard ${r.status === "done" ? "is-done" : ""}" role="button" tabindex="0" data-act="grp-pt-open" data-g="${esc(r.gid)}" data-l="${esc(r.listId)}" data-id="${esc(r.id)}" data-gt="${esc(r.id)}" style="--c:#C9702B">
    <div class="card-course">${esc(r.groupName || "Group project")}</div>
    <div class="card-title">${esc(r.title)}</div>
    <div class="card-foot">${prio}${r.due ? (late ? `<span class="soon late">${esc(relDue(p))}</span>` : sb) : ""}<span>Group Task</span>${r.due && !late && !sb ? `<span>${esc(relDue(p).replace(/^Due /, ""))}</span>` : ""}</div></div>`;
}
// Has this column been rearranged by hand
const boardManual = k => !!((state.settings && state.settings.boardManual) || {})[k];
function setBoardManual(k, on){
  const m = Object.assign({}, (state.settings && state.settings.boardManual) || {});
  if (!!m[k] === !!on) return;
  if (on) m[k] = true; else delete m[k];
  state.settings = Object.assign({}, state.settings, {boardManual: m}); saveSettings();
}
const doneAtOf = x => Number(x && (x.doneAt || x.updated || x.created)) || 0;
function autoBoardOrder(k){
  if (k === "done") return (a, b) => (doneAtOf(b) - doneAtOf(a)) || sortTasks(a, b);
  return sortTasks;
}
// One column of the Task Board
function mergeBoardCol(list, gRows, k){
  if (k && !boardManual(k)) {
    const cmp = autoBoardOrder(k), gDue = r => String(r.due || "9999-99-99");
    if (k === "done") return list.map(t => ({t})).concat(gRows.map(r => ({r})));
    return list.map(t => ({t, d: t.due ? t.due : "9999-99-99"})).concat(gRows.map(r => ({r, d: gDue(r)})))
      .sort((a, b) => a.t && b.t ? cmp(a.t, b.t) : a.d !== b.d ? (a.d < b.d ? -1 : 1) : a.t ? -1 : b.t ? 1 : String(a.r.title).localeCompare(String(b.r.title)));
  }
  const num = x => typeof x.order === "number" ? x.order : Infinity;
  return list.map(t => ({t, o: num(t)})).concat(gRows.map(r => ({r, o: num(r)}))).sort((a, b) => a.o !== b.o ? (a.o < b.o ? -1 : 1) : a.t && b.t ? sortTasks(a.t, b.t) : a.t ? -1 : b.t ? 1 : String(a.r.due || "9999").localeCompare(String(b.r.due || "9999")) || String(a.r.title).localeCompare(String(b.r.title)));
}
// Give every card in a column a clean position (10, 20, 30...), in the order shown
function renumberBoardCol(ids, status){
  const rest = tasksArr().filter(x => x.status === status && !ids.includes(x.id)).sort(boardOrder).map(x => x.id).concat(groupBoardRows(status).filter(r => !ids.includes(r.id)).map(r => r.id));
  const changes = [], gOrd = {};
  ids.concat(rest).forEach((id, k) => { const x = state.tasks[id], o = (k + 1) * 10; if (x) { if (x.order !== o) changes.push({kind: "task", id, after: Object.assign(clone(x), {order: o})}); } else gOrd[id] = o; });
  if (window.SBGROUPTASKS) window.SBGROUPTASKS.setOrders(gOrd);
  return changes;
}
// On a computer the mouse wheel scrolls the row of note boards sideways
document.addEventListener("wheel", e => { const r = e.target.closest && e.target.closest(".nb-boards"); if (!r || !e.deltaY || Math.abs(e.deltaX) > Math.abs(e.deltaY) || r.scrollWidth <= r.clientWidth) return; r.scrollLeft += e.deltaY; e.preventDefault(); }, {passive: false});
let boardRefreshT = 0;
function boardRefresh(){ if (ui.tab !== "board" || boardRefreshT) return; boardRefreshT = setTimeout(() => { boardRefreshT = 0; if (ui.tab === "board") scheduleRender(); }, 60); }
ui.colOpen = {};
document.addEventListener("toggle", e => { const d = e.target; if (d && d.classList && d.classList.contains("col-more")) ui.colOpen[d.dataset.col] = d.open; if (d && d.id === "planExtra") ui.planExtraOpen = d.open; if (d && d.classList && d.classList.contains("deck-archived")) ui.decksArchOpen = d.open; }, true);
function viewBoard(){
  const hasAny = tasksArr().length || coursesArr().length;
  const banner = coursesArr().length ? "" : `<div class="empty tb-setup${hasAny ? "" : " sb-es"}">${hasAny ? "" : emptyArt()}<span class="tb-setup-t"><strong>${hasAny ? "Color-Code by Class" : "Let's Set Up Your Term"}</strong>Add your courses so each card gets its class color, or import one straight from a syllabus PDF.</span><button class="btn primary small" data-act="import-syllabus">Import a Syllabus</button><button class="btn small" data-act="new-course">Add a Course</button></div>`;
  const ts = visibleTasks();
  const weekAgo = Date.now() - 7 * 864e5;
  const colsFor = (tsx, laneId) => STATUSES.map(([k, label, col]) => {
    let list = tsx.filter(t => t.status === k).sort(boardManual(k) ? boardOrder : autoBoardOrder(k));
    let older = 0;
    const gRows = laneId == null || laneId === "" ? groupBoardShown(k) : [];
    const merged = mergeBoardCol(list, gRows, k), shown = x => x.t ? card(x.t) : groupBoardCard(x.r);
    const nArch = k === "done" ? allTasks().filter(t => autoArchived(t) && !t.archivedTerm && inFilter(t) && matchesQ(t) && (laneId == null || (t.courseId || "") === laneId)).length : 0;
    return `<section class="col" data-status="${k}" ${laneId != null ? `data-course="${esc(laneId)}"` : ""} style="--sc:${col}" aria-label="${label}">
      <div class="col-head"><span class="sd"></span>${label}<span class="n">${list.length + older + gRows.length}</span>${boardManual(k) ? `<button type="button" class="col-resort" data-act="board-resort" data-id="${k}" title="${k === "done" ? "Put the most recently completed first again" : "Order by due date again"}">${k === "done" ? "Newest First" : "Sort by Due"}</button>` : ""}</div>
      <div class="col-list">${merged.slice(0, COL_MAX).map(shown).join("")}</div>
      ${merged.length > COL_MAX ? (() => { const key = (laneId == null ? "all" : laneId || "none") + ":" + k, more = merged.length - COL_MAX; return `<details class="col-more" data-col="${esc(key)}" ${ui.colOpen[key] ? "open" : ""}><summary><span class="cm-open">Show ${more} more</span><span class="cm-close">Show less</span></summary><div class="col-list">${merged.slice(COL_MAX).map(shown).join("")}</div></details>`; })() : ""}
      ${older ? `<button class="show-old" data-act="show-old" style="width:100%;margin-top:8px">Show ${older} Completed More Than a Week Ago</button>` : ""}
      ${k === "done" && ui.showOldDone ? `<button class="show-old" data-act="hide-old" style="width:100%;margin-top:8px">Hide Older Completed Tasks</button>` : ""}
      ${nArch ? `<button class="arch-link" data-act="archive-open">${ARCHIVE_SM}${nArch} finished more than 2 weeks ago ${nArch === 1 ? "is" : "are"} in the Archive</button>` : ""}
    </section>`;
  }).join("");
  const groupCtl = `<div class="board-ctl"><span class="mini">Group By</span><div class="segb" role="group" aria-label="Group board"><button data-act="group" data-id="none" aria-pressed="${ui.groupBy !== "course"}">None</button><button data-act="group" data-id="course" aria-pressed="${ui.groupBy === "course"}">Course</button></div></div>`;
  let boardHtml;
  if (ui.groupBy === "course") {
    const lanes = [...coursesArr().filter(c => inFilterCourse(c.id)).map(c => ({id: c.id, name: c.name, code: c.code, color: c.color})), {id: "", name: "No Course", color: "#8A94A6"}];
    boardHtml = lanes.map(l => {
      const lt = ts.filter(t => (t.courseId || "") === l.id && (l.id || !courseOf(t.courseId)));
      if (!lt.length && !l.id && !groupBoardShown().length) return "";
      const done = lt.filter(t => t.status === "done").length;
      return `<section class="lane" style="--c:${esc(l.color)}"><h3 class="lane-head"><span class="sd"></span>${esc(l.name)}<span class="n">${done}/${lt.length} complete</span></h3><div class="board lane-board">${colsFor(lt, l.id)}</div></section>`;
    }).join("");
  } else boardHtml = `<div class="board" id="board">${colsFor(ts, null)}</div>`;
  const bv = ui.bview || (() => { try { return localStorage.getItem("studyboard:bview") || "plan"; } catch(e) { return "plan"; } })();
  const tabs = `<div class="bview-tabs" role="tablist" aria-label="Board view"><button role="tab" data-act="bview" data-id="plan" aria-selected="${bv === "plan"}">Today's Plan</button><button role="tab" data-act="bview" data-id="board" aria-selected="${bv === "board"}">Task Board</button></div>`, tabRow = `<div class="bview-row">${tabs}${bv === "board" ? groupCtl : ""}</div>`;
  const planPane = hasAny && tasksArr().length ? (window.SBEXAM ? SBEXAM.todayHtml() : "") + focusHtml() : `<div class="empty bview-empty"><strong>Nothing Planned Yet</strong>Add tasks with due dates and Today's Plan will line up what to work on.</div>`;
  return backupNudge() + (window.SBCRUNCH ? SBCRUNCH.cardHtml() : "") + `<div class="qa-wrap">${qaBarHtml()}</div>` + tabRow + `<div class="bview" data-bview="${bv}"><div class="bpane-plan">${planPane}</div><div class="bpane-board">` + banner + `<section class="board-sec" aria-label="Task Board">
    <div class="board-sec-head"><h2>Task Board</h2></div>
    ${chipsHtml(groupCtl)}${searchNote()}${boardHtml}
    <p class="hint-line tip-everyday">Drag cards between columns to change status.</p></section></div></div>`;
}

/* Focus engine: what to work on today */
const TYPE_DEFAULTS = {Assignment:{w:5, h:3}, Project:{w:15, h:10}, Lab:{w:5, h:4}, Reading:{w:1, h:1.5}, Exam:{w:20, h:8}, Quiz:{w:3, h:2}, Study:{w:2, h:1}, Other:{w:2, h:1.5}};
const DIFF_M = {easy:0.7, med:1, hard:1.5};
const DIFF_LABEL = {easy:"Easy", med:"Medium", hard:"Hard"};
const PRIO_M = {low:0.8, med:1, high:1.25, urgent:1.6};
const LATE_M = {none:1.2, penalty:1, free:0.85, unknown:1};
const LATE_LABEL = {unknown:"Not sure", none:"Not accepted", penalty:"Accepted with a penalty", free:"Accepted, no penalty"};
const dailyHours = () => Math.max(0, Number(state.settings.dailyHours ?? 3));
function todayHours(){
  try { const o = JSON.parse(localStorage.getItem("coursework:today") || "null"); if (o && o.d === todayISO() && isNum(o.h)) return Number(o.h); } catch(e) {}
  return dailyHours();
}
function setTodayHours(h){ try { localStorage.setItem("coursework:today", JSON.stringify({d: todayISO(), h})); } catch(e) {} }
const typeDef = t => TYPE_DEFAULTS[t.type] || TYPE_DEFAULTS.Other;
const hasWeight = t => isNum(t.weight) && Number(t.weight) > 0;
const weightOf = t => hasWeight(t) ? Number(t.weight) : t.prepFor && state.tasks[t.prepFor] ? Math.max(typeDef(t).w, weightOf(state.tasks[t.prepFor]) * 0.5) : (PTS_W[t.id] || typeDef(t).w);

/* What the planner knows beyond the task itself (1.11) - School sync */
const lmsOf = t => (t && (t.bs || t.cv || t.bb)) || null;
// Difficulty: yours when you've set Easy or Hard
const diffOf = t => t.difficulty && t.difficulty !== "med" ? t.difficulty : autoPlanOn() && t.aiDiff && autoFresh(t.aiDiff, 14) ? t.aiDiff.level : (t.difficulty || "med");
// Late policy: yours if you set one, otherwise what the platform's submission window says
function lateOf(t){
  if (t.late && t.late !== "unknown") return t.late;
  const u = lateUntilOf(t); if (!u || !t.due) return "unknown";
  return u > t.due + " " + (t.time || "23:59") ? "penalty" : "none";
}
function lateUntilOf(t){ if (t.late && t.late !== "unknown") return ""; const L = lmsOf(t); return (L && typeof L.lateUntil === "string" && L.lateUntil) || ""; }
const nowStamp = () => { const d = new Date(); return todayISO() + " " + pad(d.getHours()) + ":" + pad(d.getMinutes()); };
// Grade weight from points when a course's gradebook isn't weighted
let PTS_W = {};
function pointsWeights(){
  const by = {}, out = {};
  allTasks().forEach(t => { if (!t.courseId || t.prepFor) return; const b = by[t.courseId] || (by[t.courseId] = {weighted: 0, items: []}); if (hasWeight(t)) b.weighted++; const L = lmsOf(t), o = L && Number(L.outOf); if (o > 0) b.items.push([t.id, o]); });
  Object.values(by).forEach(b => { if (b.weighted || b.items.length < 3) return; const sum = b.items.reduce((s, x) => s + x[1], 0); if (sum > 0) b.items.forEach(([id, o]) => { out[id] = Math.max(0.5, Math.min(60, o / sum * 100)); }); });
  return out;
}
// Hours already taken up each day by classes, labs, placements, work shifts and events
const CLINICAL_RX = /clinical|practicum|placement|internship|co-?op|field ?work|preceptor|\bshift\b|practice (day|experience)|hospital|sim(ulation)? lab|site visit/i;
let BUSY_CACHE = {k: "", m: {}, what: {}};
function busyDays(from, to){
  const k = from + "|" + to + "|" + (state.updated || 0);
  if (BUSY_CACHE.k === k) return BUSY_CACHE;
  const m = {}, what = {}, mins = x => { const [h, mm] = String(x || "0:0").split(":").map(Number); return (h || 0) * 60 + (mm || 0); };
  try {
    schOccurrences(from, to).forEach(o => {
      if (o.skipped || (o.type === "meet" && o.m && o.m.kind === "Office Hours") || (o.type === "avail" && o.avail.kind === "protected")) return;
      const label = (o.label || "") + " " + (o.title || "");
      let h = 0;
      if (o.allDay || !o.start) { if (CLINICAL_RX.test(label) || o.type === "avail") h = 8; }
      else h = Math.max(0, (mins(o.end || o.start) - mins(o.start)) / 60);
      if (!h) return;
      m[o.date] = (m[o.date] || 0) + Math.min(h, 12);
      if (CLINICAL_RX.test(label) || h >= 4) (what[o.date] = what[o.date] || []).push(o.label || o.title);
    });
  } catch(e) {}
  BUSY_CACHE = {k, m, what};
  return BUSY_CACHE;
}
// A typical class day leaves your usual study time; a long day
const busyFactor = h => Math.max(0.3, Math.min(1, 1 - Math.max(0, h - 3) / 8));
const courseRisk = cid => { try { const g = window.__sbGrades && cid && courseOf(cid) ? window.__sbGrades.courseGrade(cid) : null; return g || null; } catch(e) { return null; } };
// Instructions that mention an earlier step with its own deadline
const EARLY_STEP_RX = /\b(draft|outline|proposal|pre-?lab|pre-?quiz|pre-?class|sign[- ]?up|peer[- ]review|topic approval|check-?in|reading quiz)\b[^.\n]{0,70}\b(due|by|before|submit|posted|complete)\b/i;
// Total hours the task takes
function effortOf(t){
  const d = typeDef(t), dm = DIFF_M[diffOf(t)] || 1;
  if (MILESTONE(t.type)) return d.h * dm * Math.min(2, Math.sqrt(weightOf(t) / d.w));
  if (isNum(t.hours) && Number(t.hours) > 0) return Number(t.hours) * (t.prepFor ? 1 : accOf() ? accOf().ratioFor(t) : learned().ratio);
  return autoPlanOn() && t.aiHours && t.aiHours.h > 0 ? t.aiHours.h : localEstimate(t).hours;
}
// A big assignment that has been split into milestones
const bdHasKids = t => !!(t && t.breakdownParent) && allTasks().some(k => k.breakdownOf === t.id);
function remainingOf(t){
  if (t.status === "done") return 0;
  if (bdHasKids(t)) return 0.25;
  if (MILESTONE(t.type) && planSessions(t.id).length) return 0;
  const e = effortOf(t), p = progress(t).frac, fm = (Number(t.focusMin) || 0) / 60;
  if (autoPlanOn() && !MILESTONE(t.type) && t.aiLeft && t.aiLeft.sig === leftSig(t)) return Math.min(t.aiLeft.h, e * 1.5);
  if (p === 0 && fm > 0 && !MILESTONE(t.type)) return Math.max(e * 0.15, e - fm);
  return e * (1 - p);
}
// Share of the due day you can still use
function dueDayFrac(t){
  if (MILESTONE(t.type)) return 0.25;
  if (!t.time) return 0.75;
  return t.time < "12:00" ? 0 : t.time < "18:00" ? 0.4 : 0.75;
}
// Study hours available from now until the task is due
function capacityUntil(t, today, dh, th, cum, day){
  const dl = dayDiff(today, t.due);
  if (dl < 0) return 0;
  if (dl === 0) return th * (MILESTONE(t.type) ? 0.25 : 1);
  if (cum && dl < cum.length) return cum[dl] + day[dl] * dueDayFrac(t);
  return th + dh * (dl - 1) + dh * dueDayFrac(t);
}
const fmtHM = h => { const m = Math.round(h * 60 / 15) * 15; const hh = Math.floor(m / 60), mm = m % 60; return hh && mm ? `${hh}h ${mm}m` : hh ? `${hh}h` : `${mm}m`; };
const fmtMins = n => { const m = Math.max(0, Math.round(Number(n) || 0)), hh = Math.floor(m / 60), mm = m % 60; return hh && mm ? `${hh}h ${mm}m` : hh ? `${hh}h` : `${mm}m`; };
// Deadline guard
function deadlineGuard(list, get, key){
  const near = list.filter(it => { const x = get(it); return x.dl >= 0 && x.dl <= 7 && !x.dead && (x.R > 0 || MILESTONE(x.t.type)); });
  if (!near.length) return;
  list.forEach(it => {
    const x = get(it);
    if (x.dl < 0 || (x.own || 0) >= 0.75) return;
    let cap = Infinity;
    near.forEach(n => { const y = get(n); if (n !== it && x.dl >= y.dl + 10) cap = Math.min(cap, n[key]); });
    if (cap < Infinity && it[key] >= cap) { it[key] = cap * 0.97; x.guarded = true; }
  });
}
let FOCUS = null;
// Splits today's study time over the ranked tasks
function splitToday(ranked, th, own){
  let left = Math.max(0, th); left = own ? Math.round(left * 4) / 4 : Math.floor(left * 4 + 1e-9) / 4;
  const q = h => Math.floor(h * 4 + 1e-9) / 4, BLOCK = 0.5, maxN = Math.max(1, Math.min(4, Math.round(left)));
  const urgent = x => x.dl <= 1 || (x.own || 0) >= 0.75 || (x.behind || 0) >= 0.5;
  const give = (x, a) => { a = q(Math.min(a, left)); if (a <= 0) return 0; x.alloc += a; left -= a; return a; };
  ranked.forEach(x => { x.moved = 0; x.alloc = 0; });
  const picked = [];
  ranked.forEach(x => {
    if (!(x.need > 0) || left < 0.25) return;
    const u = urgent(x);
    if (!u && picked.length >= maxN) return;
    const block = u ? x.need : Math.min(x.R || x.need, Math.max(x.need, BLOCK));
    if (!u && left + 1e-9 < Math.min(block, BLOCK)) return;
    if (give(x, block)) picked.push(x);
  });
  picked.forEach(x => { if (left >= 0.25 && x.R > x.alloc + 0.125) give(x, Math.round((x.R - x.alloc) * 4) / 4); });
  ranked.forEach(x => {
    if (left < BLOCK || picked.includes(x) || !(x.need > 0)) return;
    if (give(x, Math.min(x.R || x.need, Math.max(x.need, BLOCK)))) picked.push(x);
  });
  return left;
}
// Group project tasks assigned to me, as plan entries
function groupPlanTasks(){
  let rows = []; try { rows = groupBoardRows(""); } catch (e) { return []; }
  return rows.filter(r => r && r.status !== "done" && /^\d{4}-\d{2}-\d{2}$/.test(r.due || "")).map(r => {
    const c = r.courseCode ? coursesArr().find(x => (x.code || "").replace(/\s+/g, "").toLowerCase() === String(r.courseCode).replace(/\s+/g, "").toLowerCase()) : null;
    return {id: "gt:" + r.id, title: r.title, due: r.due, time: "", type: "Assignment", status: r.status === "doing" ? "doing" : "todo", priority: r.priority || "med", courseId: c ? c.id : "", hours: Number(r.hours) > 0 ? Number(r.hours) : 1, notes: r.notes || "", checklist: [], taskIds: [], gt: {gid: r.gid, listId: r.listId, id: r.id, name: r.groupName || r.listTitle || "Group project"}};
  });
}
const gtOpenAttrs = t => t.gt ? `data-act="grp-pt-open" data-g="${esc(t.gt.gid)}" data-l="${esc(t.gt.listId)}" data-id="${esc(t.gt.id)}"` : `data-act="edit-task" data-id="${esc(t.id)}"`;
function computeFocus(){
  const today = todayISO(), dh0 = dailyHours(), thSet = todayHours(), now = new Date();
  const dh = dh0 * (accOf() ? accOf().capScale() : 1);
  let doneToday = 0; try { if (typeof SBSTATS !== "undefined") doneToday = SBSTATS.focusMinutes(today, today) / 60; } catch(e) {}
  // the time left in your study day (it may end after midnight); before the day starts, the whole coming day
  const sd = studyDay(now), leftH = (sd.night ? sd.end - sd.start : sd.left) / 60;
  const th0 = Math.max(0, Math.min(thSet - doneToday, leftH));
  let av = null; try { av = availToday(now); } catch(e) {}
  const th = av && av.active ? Math.min(th0, av.res.total / 60) : th0;
  const open = tasksArr().filter(t => t.status !== "done" && t.due).concat(groupPlanTasks());
  const info = {};
  PTS_W = pointsWeights();
  const horizon = Math.min(90, Math.max(14, open.reduce((m, t) => Math.max(m, dayDiff(today, t.due)), 0) + 1));
  const B = busyDays(today, addDays(today, horizon));
  const day = [th], cum = [0];
  let AD = null; if (av && av.active) { try { AD = availDays(addDays(today, 1), addDays(today, horizon)); } catch(e) {} }
  for (let i = 1; i <= horizon; i++) { const d = addDays(today, i); day.push(Math.min(dh * (accOf() ? accOf().wkScale(d) : 1) * busyFactor(B.m[d] || 0), AD && AD[d] != null ? AD[d] : Infinity)); }
  for (let i = 1; i <= horizon; i++) cum.push(cum[i - 1] + day[i - 1]);
  const stamp = nowStamp();
  const byDue = open.slice().sort((a, b) => dueDate(a) - dueDate(b));
  let load = 0;
  byDue.forEach(t => {
    const fx = MILESTONE(t.type) && !canDoNow(t);
    const R = fx ? 0 : remainingOf(t);
    const lu = lateUntilOf(t), lp = lateOf(t);
    const dead = dayDiff(today, t.due) < 0 && (lp === "none" || (lu && lu < stamp));
    if (!dead) load += R;
    const A = capacityUntil(t, today, dh, th, cum, day);
    info[t.id] = {t, R, L: load, A, rho: load / Math.max(A, 0.25), behind: Math.max(0, load - A), dl: dayDiff(today, t.due), late: lp, lateUntil: lu, dead, fixed: fx};
  });
  const nowMs = now.getTime();
  Object.values(info).forEach(x => {
    const t = x.t, W = weightOf(t), p = progress(t).frac, ms = MILESTONE(t.type);
    const dd = Math.max(0, (dueDate(t).getTime() - nowMs) / 864e5);
    x.dd = dd;
    const T = 1 / Math.pow(1 + dd / 2, 1.6);
    x.own = x.R > 0 ? x.R / Math.max(x.A, 0.25) : 0;
    const S = x.own >= 1 ? 1 : 0.6 * Math.pow(x.own, 2.5);
    let urg = 1 - (1 - T) * (1 - S);
    if (x.dl < 0) urg = x.dead ? 0.12 : 1.15;
    const I = Math.max(0.6, Math.min(1.9, 0.6 + 0.35 * Math.log(1 + W / 3)));
    let score = urg * I;
    const m = [];
    const mul = (f, why) => { score *= f; if (why) m.push(why); };
    mul(PRIO_M[t.priority] || 1);
    if (x.dl >= 0) mul(x.late === "none" ? 1.15 : x.late === "free" ? 0.85 : 1);
    if (x.own >= 1 && x.dl >= 0) mul(1.15, "fit");
    x.early = !ms && x.dl >= 1 && EARLY_STEP_RX.test(t.notes || "");
    if (x.early) mul(1.06);
    const fullDay = [1, 2].map(i => addDays(today, i)).find(d => d <= t.due && (B.m[d] || 0) >= 7);
    if (fullDay && x.dl >= 1 && x.dl <= 4 && x.R > 0) { mul(1.12); x.fullDay = fullDay; }
    if (ms && x.dl >= 0 && x.dl <= 7) mul(1.1);
    if (t.status === "doing") mul(1.05);
    if (!ms && p >= 0.7) mul(1.08);
    if (!ms && x.R > 0 && x.R <= 0.5 && x.dl >= 0 && x.dl <= 2) { mul(1.08); x.quick = true; }
    if (diffOf(t) === "hard" && x.dl >= 0 && x.dl <= 5) mul(1.06);
    const hl = t.history || [];
    x.stale = t.status === "doing" && hl.length && Date.now() - hl[hl.length - 1].at > 5 * 864e5;
    if (x.stale && x.dl >= 0 && x.dl <= 14) mul(1.05);
    if (accOf() && x.dl >= 1 && x.dl <= 6 && x.R > 0 && p === 0 && !(Number(t.focusMin) > 0)) { const nz = accOf().startNudge(t); if (nz > 1) { mul(nz); x.nudged = true; } }
    x.score = score * 100;
    // What is due today comes before anything already overdue (overdue work still ranks above what is due later)
    if (x.dl === 0 && x.R > 0 && !x.dead && !x.fixed) x.score += 1000;
    x.W = W; x.p = p;
  });
  for (let pass = 0; pass < 3; pass++) {
    Object.values(info).forEach(x => (x.t.dependsOn || []).forEach(id => {
      const d = info[id];
      if (d && d.score < x.score * 0.9) { d.score = x.score * 0.9; d.unblocks = x.t; }
    }));
  }
  const ranked = [], blocked = [], later = [];
  Object.values(info).forEach(x => {
    if (blockers(x.t).length) blocked.push(x);
    else if ((MILESTONE(x.t.type) && !x.fixed ? remoteOpens(x.t) : x.t.start) > today && x.t.status === "todo" && x.rho < 0.9 && !x.unblocks) later.push(x);
    else ranked.push(x);
  });
  ranked.sort((a, b) => b.score - a.score);
  deadlineGuard(ranked, x => x, "score");
  ranked.sort((a, b) => b.score - a.score);
  ranked.forEach(x => {
    const t = x.t, R = x.R;
    let n = 0;
    if (R > 0) {
      if (x.dl <= 0) n = R;
      else if (MILESTONE(t.type)) n = x.dl > 7 ? 0 : R / Math.min(x.dl, 7);
      else {
        const days = x.dl + (dueDayFrac(t) >= 0.4 ? 1 : 0);
        n = R / Math.max(1, days);
        n = Math.max(n, R - dh * Math.max(0, days - 1));
        if (diffOf(t) === "hard") n *= 1.3;
      }
      n = Math.min(R, n);
    }
    x.need = n > 0 ? Math.max(0.25, Math.ceil(n * 4) / 4) : 0;
  });
  const left = splitToday(ranked, th, th >= thSet - doneToday - 0.001);
  // A task you have done enough on today (or said was enough) has no time left today anywhere: not in the plan, the schedule or Do This Next
  ranked.forEach(x => { if (x.alloc > 0 && enoughToday(x.t, x)) { x.enough = true; x.alloc = 0; x.need = 0; } });
  const needToday = ranked.reduce((s, x) => s + x.need, 0);
  let avail = null; if (av) { try { avail = availPlan(av, ranked, th0, needToday, day, today, now, nuLead({ranked, info})); } catch(e) { console.warn(e); } }
  const crunch = byDue.map(t => info[t.id]).find(x => x.behind >= 0.5 && x.dl >= 0);
  Object.values(info).forEach(x => {
    const t = x.t, r = [];
    const luD = x.lateUntil ? x.lateUntil.slice(0, 10) : "", luT = x.lateUntil ? x.lateUntil.slice(11) : "";
    if (x.dl < 0) r.push([100, x.dead ? `Past due, and late work isn't accepted. Check with your instructor.` : luD ? `Overdue. Late submissions close ${fmtDate(luD)}${luT && luT !== "23:59" ? " at " + fmtTime(luT) : ""}` : `Overdue by ${-x.dl} day${x.dl === -1 ? "" : "s"}`]);
    else r.push([x.dl <= 1 ? 90 : 60 - x.dl, x.dl === 0 ? "Due today" : x.dl === 1 ? "Due tomorrow" : `Due in ${x.dl} days`]);
    if (x.behind >= 0.5 && x.dl >= 0) r.push([95, `About ${fmtHM(x.behind)} short of time before this is due, counting everything due first`]);
    else if (x.own >= 1 && x.dl >= 0) r.push([93, "It needs more time than you have left before it's due, so start now"]);
    else if (x.rho >= 0.75 && x.dl >= 0 && x.dl <= 14) r.push([70, "Little spare time before it's due"]);
    if (x.own >= 0.5 && x.own < 1 && x.dl > 7) r.push([66, "Big enough that it needs steady time every day until it's due"]);
    if (x.quick) r.push([44, "Quick to clear, and due soon"]);
    if (x.stale) r.push([33, "Started a while ago and hasn't moved since"]);
    if (hasWeight(t) || x.W >= 10 || PTS_W[t.id]) r.push([50 + x.W, `${hasWeight(t) ? "" : "About "}${Math.round(x.W * 10) / 10}% of your grade${!hasWeight(t) && PTS_W[t.id] ? " (from its points)" : ""}`]);
    if (x.fullDay) r.push([72, `${dayDiff(today, x.fullDay) === 1 ? "Tomorrow" : parse(x.fullDay).toLocaleDateString(undefined, {weekday: "long"})} is a full day${(B.what[x.fullDay] || [])[0] ? ` (${B.what[x.fullDay][0]})` : ""}, so it helps to get ahead`]);
    if (x.early) r.push([68, "The instructions mention an earlier step (like a draft or pre-lab). Check for a sooner deadline"]);
    const pr = MILESTONE(t.type) ? progress(t) : null;
    if (pr && pr.ai) r.push([56, `About ${pr.ai.pct}% ready${pr.ai.note ? ": " + pr.ai.note : ""}`]);
    else if (x.fixed) r.push([55, `${remoteOf(t).v === "no" ? "Taken in person" : "Not confirmed as take-home"}, so it is a fixed event, not a task to do now${x.p > 0 ? ` (${Math.round(x.p * 100)}% prepared)` : ""}`]);
    else if (MILESTONE(t.type)) r.push([55, progress(t).plan ? `${Math.round(x.p * 100)}% prepared, following your study plan` : `${Math.round(x.p * 100)}% prepared, about ${fmtHM(x.R)} of study left`]);
    else if (x.R > 0) r.push([40, `About ${fmtHM(x.R)} of work left`]);
    if (accOf() && x.R > 0 && isNum(t.hours) && !MILESTONE(t.type)) { const ex = accOf().explain(t); if (ex) r.push([39, ex + " " + tr("acc.planAllows", "Today's Plan allows for it.")]); }
    if (x.nudged) r.push([36, tr("acc.startSooner", "You often finish close to the deadline, so starting a little early helps")]);
    if (x.unblocks) r.push([80, `Needed before ${x.unblocks.title}`]);
    if (x.late === "none" && x.dl >= 0) r.push([45, t.late === "none" ? "No late work accepted" : "Submissions close at the due time"]);
    else if (luD && x.dl >= 0 && t.late !== "penalty" && t.late !== "free") r.push([25, `Late submissions accepted until ${fmtDate(luD)}`]);
    if (!MILESTONE(t.type) && x.p >= 0.7) r.push([42, "Almost done"]);
    if (t.status === "doing") r.push([30, "Already in progress"]);
    if (diffOf(t) === "hard") r.push([35, t.difficulty === "hard" ? "Hard, so it helps to start early" : "Looks demanding, so it helps to start early"]);
    if (t.priority === "urgent" || t.priority === "high") r.push([38, `You marked it ${PRIO[t.priority]}`]);
    const b = blockers(t); if (b.length) r.push([99, `Waiting on ${b.map(y => y.title).join(", ")}`]);
    if (t.start && t.start > today && !MILESTONE(t.type)) r.push([20, `Starts ${fmtDate(t.start)}`]);
    x.reasons = r.sort((a, b) => b[0] - a[0]).map(y => y[1]);
  });
  const lateCap = thSet - doneToday > leftH + 0.01;
  FOCUS = {sd, info, ranked, blocked, later, today, th, thSet, doneToday, dh: dh0, planned: avail && avail.active ? avail.planned : th - Math.max(0, left), needToday, crunch, busy: B, day, avail, slotsBy: avail ? avail.by : {}, av, th0, now, lateCap};
  FOCUS.gapWhy = planGapWhy(FOCUS);
  return FOCUS;
}
// Why today's suggested times don't add up to the "Time Today" you set, when they don't
function planGapWhy(F){
  const q = h => Math.round(h * 4) / 4, planned = F.ranked.reduce((t, x) => t + (x.alloc || 0), 0), why = [];
  const gap = q(F.thSet) - q(planned);
  if (gap < 0.25) return why;
  let rest = gap;
  if (F.doneToday >= 0.25) { const d = Math.min(rest, q(F.doneToday)); why.push(tr("plan.gap.done", "{time} of focus is already done today, so it comes off the {set} you set.", {time: fmtHM(d), set: fmtHM(F.thSet)})); rest -= d; }
  if (F.lateCap && rest >= 0.25) { const end = F.sd ? fmtTime(AVAIL.toT(F.sd.end % 1440)) : "1:00 AM"; why.push(F.sd && F.sd.past && !F.sd.night ? tr("plan.gap.over", "Your study day ended at {end}, so today's plan is done.", {end}) : tr("plan.gap.late", "It's late, so today's plan stops at {end}, your end of day.", {end})); rest = 0; }
  if (F.avail && F.avail.active && F.avail.note) rest = 0;
  return why;
}
// For tests: the plan as the app sees it right now
window.__sbPlan = () => { const F = computeFocus(), n = nextUp(F); const pick = x => ({id: x.t.id, title: x.t.title, score: Math.round(x.score), alloc: x.alloc, R: x.R, W: x.W, late: x.late, dead: !!x.dead, fixed: !!x.fixed, reasons: x.reasons}); return {th: F.th, thSet: F.thSet, doneToday: F.doneToday, gapWhy: F.gapWhy, day: F.day.slice(0, 5), ranked: F.ranked.map(pick), later: F.later.map(x => x.t.id), next: n ? {id: n.x.t.id, why: n.why, mins: n.mins, ai: n.ai, study: !!n.study} : null, est: id => localEstimate(state.tasks[id])}; };
// Pick the one reason a row shows up front
function planLead(rs){
  rs = rs || [];
  let k = 0;
  if (/% of your grade/.test(rs[0] || "")) { const d = rs.findIndex(r => /^(Due |Overdue|Past due)/.test(r)); if (d > 0) k = d; }
  return k;
}
// A phone-only rail above Do This Next: today in order, with classes and calendar events, the tasks the plan
// puts in your free time, and the gaps left open
function dayTimelineHtml(F, todayList, heroId){
  // Your study day: its end may be after midnight; once it's over (or before it starts) nothing is put in it
  const sd = (F && F.sd) || studyDay(), atT = m => fmtTime(AVAIL.toT(m % 1440));
  if (sd.past) return `<div class="dtl dtl-over" role="group" aria-label="Today's schedule"><div class="dtl-rail"><div class="dtl-c fr dtl-end" data-anchor><span>Past your end of day</span><b>${esc(sd.night ? `Your day starts at ${atT(sd.start)}` : `Your day ended at ${atT(sd.end)}`)}</b></div></div></div>`;
  const sb = (F && F.slotsBy) || {}, a = F && F.avail, items = [];
  (todayList || []).forEach(x => (sb[x.t.id] || []).forEach(sl => { if (sl && sl.e > sl.s) items.push({k: "tk", s: sl.s, e: sl.e, t: x.t}); }));
  try {
    // just after midnight, today's calendar is the late part of the evening's day
    const off = sd.tail ? 1440 : 0;
    schOccurrences(todayISO(), todayISO()).forEach(o => {
      if ((o.type !== "meet" && o.type !== "event") || o.skipped || o.allDay || !o.start || !o.end) return;
      const s = toMin(o.start) + off, e = toMin(o.end) + off; if (e > s) items.push({k: "ev", s, e, title: o.title, label: o.label || (o.type === "meet" ? "Class" : "Event"), color: o.color || "var(--accent)", where: o.where || ""});
    });
  } catch (e) {}
  // Do This Next always has a card: when the plan found it no slot, it starts right now for one session
  // ...for the time Today's Plan gives it today (the same as Do This Next says), up to your end of day
  const nowMin = Math.max(sd.now, sd.start);
  if (heroId && !items.some(x => x.k === "tk" && x.t.id === heroId)) {
    const hx = F && F.info ? F.info[heroId] : null, want = hx && hx.alloc > 0 ? Math.round(hx.alloc * 60) : focusMinsFor(heroId);
    if (hx && hx.t) items.push({k: "tk", s: nowMin, e: Math.min(sd.end, nowMin + Math.max(5, want)), t: hx.t});
  }
  if (!items.length) return "";
  // The short breaks between one task's back-to-back sessions are not shown: those sessions read as one card
  items.sort((p, q) => p.s - q.s || p.e - q.e);
  for (let i = items.length - 1; i > 0; i--) {
    const cur = items[i], prev = items[i - 1];
    if (cur.k === "tk" && prev.k === "tk" && cur.t.id === prev.t.id && cur.s - prev.e <= 15) { prev.mn = (prev.mn || prev.e - prev.s) + (cur.mn || cur.e - cur.s); prev.e = Math.max(prev.e, cur.e); items.splice(i, 1); }
  }
  // Anything between the day's start and end with no task, class or event in it is shown as Free
  const dayS = sd.start, dayE = sd.end;
  { const busy = items.map(x => [Math.max(dayS, x.s), Math.min(dayE, x.e)]).filter(([s0, e0]) => e0 > s0).sort((p, q) => p[0] - q[0]);
    let cur = dayS; const gaps = [];
    busy.concat([[dayE, dayE]]).forEach(([s0, e0]) => { if (s0 - cur >= 10) gaps.push([cur, s0]); cur = Math.max(cur, e0); });
    gaps.forEach(([s0, e0]) => { if (e0 > nowMin) { if (e0 - Math.max(s0, nowMin) >= 10) items.push({k: "fr", s: Math.max(s0, nowMin), e: e0}); } else if (s0 > dayS) items.push({k: "fr", s: s0, e: e0}); });
  }
  items.sort((p, q) => p.s - q.s || p.e - q.e);
  // Back-to-back sessions of one task (split by short breaks) read as a single card
  const rows = [];
  items.forEach(x => {
    const last = rows[rows.length - 1];
    if (x.k === "tk" && last && last.k === "tk" && last.t.id === x.t.id && x.s - last.e <= 15) { last.e = Math.max(last.e, x.e); last.min += x.e - x.s; }
    else { if (x.k === "tk") x.min = x.mn || x.e - x.s; rows.push(x); }
  });
  const nowM = sd.now;
  const anchor = rows.findIndex(x => x.e > nowM);
  const cards = rows.map((x, i) => {
    const past = x.e <= nowM, on = x.s <= nowM && nowM < x.e, when = availRange(x.s, x.e), len = fmtHM((x.k === "tk" ? x.min : x.e - x.s) / 60) || "";
    const cls = " dtl-c" + (past ? " past" : "") + (on ? " now" : ""), at = i === anchor ? " data-anchor" : "";
    if (x.k === "fr") return `<div class="dtl-c fr${past ? " past" : ""}" style="--m:${x.e - x.s}"${at}><span>Free</span><b>${esc(when)}</b></div>`;
    if (x.k === "ev") return `<div class="${cls.trim()} ev" style="--c:${esc(x.color)};--m:${x.e - x.s}"${at}><span class="dtl-t">${esc(when)}</span><b class="dtl-n">${esc(x.title)}</b><span class="dtl-s">${esc(x.label)}${x.where ? " · " + esc(x.where) : ""}</span></div>`;
    const hero = x.t.id === heroId;
    return `<button type="button" class="${cls.trim()} tk${hero ? " next" : ""}" ${gtOpenAttrs(x.t)} style="--c:${esc(colorOf(x.t.courseId))};--m:${x.e - x.s}"${at} aria-label="${esc(x.t.title)}, ${esc(when)}"><span class="dtl-t">${esc(when)}</span><b class="dtl-n">${esc(x.t.title)}</b><span class="dtl-m"><span>${esc(len)}</span>${on ? `<span class="dtl-badge">Now</span>` : hero ? `<span class="dtl-badge">Next</span>` : ""}</span></button>`;
  }).join("");
  return `<div class="dtl" role="group" aria-label="Today's schedule"><div class="dtl-rail">${cards}</div></div>`;
}
// Scroll the rail so what is happening now (or next) starts at the left edge
hook("render", () => { document.querySelectorAll(".dtl-rail").forEach(r => { const t = r.querySelector("[data-anchor]"); if (t) r.scrollLeft = Math.max(0, t.offsetLeft - r.offsetLeft - 8); }); });
function planRow(x, i, showScore, noRank){
  const t = x.t, c = courseOf(t.courseId);
  const rs = x.reasons || [], li = planLead(rs), lead = rs[li] || "", rest = rs.filter((r, k) => k !== li);
  const key = (showScore ? (noRank ? "w" : "r") : "t") + "-" + t.id, open = !!(ui.planWhy && ui.planWhy[key]);
  const side = showScore ? `<span class="score" title="Focus score" aria-label="Focus score ${Math.round(x.score)}">${Math.round(x.score)}</span>`
    : x.alloc > 0 ? `<span class="alloc" title="Time Today's Plan suggests for this today">${fmtHM(x.alloc)}<small class="alloc-l"> today</small></span>` : `<span class="alloc idle">Later</span>`;
  return `<li class="plan-row${open ? " why-open" : ""}" style="--c:${esc(colorOf(t.courseId))}">
    ${t.gt ? `<span class="check gt-dot" aria-hidden="true"></span>` : `<button class="check" data-act="toggle" data-id="${esc(t.id)}" aria-label="Mark complete: ${esc(t.title)}">${CHECK}</button>`}
    <button class="plan-main" ${gtOpenAttrs(t)} title="${esc(rs.join("\n"))}"><span class="task-title">${esc(t.title)}</span>${t.gt ? `<span class="pr-chip gt-chip">${esc(t.gt.name)}</span>` : ""}${c ? `<span class="pr-chip">${esc(courseLabel(c))}</span>` : ""}</button>${c ? `<span class="pr-chip pr-chip-out">${esc(courseLabel(c))}</span>` : ""}
    ${lead ? rest.length ? `<button class="pr-why${/^(Overdue|Past due)/.test(lead) ? " late" : ""}" data-act="plan-why" data-id="${esc(key)}" aria-expanded="${open}" aria-controls="pw-${esc(key)}" title="${esc(lead)}. Show all ${rs.length} reasons"><span class="pr-lead">${esc(lead)}</span><span class="pr-n" aria-hidden="true">+${rest.length} more</span></button>` : `<span class="pr-why${/^(Overdue|Past due)/.test(lead) ? " late" : ""}"><span class="pr-lead">${esc(lead)}</span></span>` : `<span class="pr-why"></span>`}
    <span class="plan-side">${lmsGoBtn(t)}${window.SBPREP ? SBPREP.matBtn(t) : ""}${side}${showScore || !canDoNow(t) ? "" : `<button class="focus-go" data-act="pomo-task" data-id="${t.gt ? "" : esc(t.id)}" aria-label="Start a focus session on ${esc(t.title)}" title="Start a focus session">${TOMATO}</button>`}</span>
    ${(sl => !showScore && ((sl && sl.length) || x.moved > 0.05) ? `<span class="pr-slot">${sl && sl.length ? `<b>${esc(availSlotText(sl))}</b>` : ""}${x.moved > 0.05 ? `${sl && sl.length ? " " : ""}<span class="mini">${esc(fmtHM(x.moved))} moved to a lighter day</span>` : ""}</span>` : "")(FOCUS && FOCUS.slotsBy ? FOCUS.slotsBy[t.id] : null)}
    ${rest.length ? `<ul class="pr-more" id="pw-${esc(key)}"${open ? "" : " hidden"}>${rest.map(r => `<li>${esc(r)}</li>`).join("")}</ul>` : ""}
  </li>`;
}
/* Today's Plan: the next two weeks */
const RB_DAYS = 14;
function weekAhead(F, inView){
  const today = todayISO(), all = Object.values(F.info).filter(x => inView(x) && x.t.status !== "done");
  return Array.from({length: RB_DAYS}, (_, i) => {
    const iso = addDays(today, i), rows = all.filter(x => x.t.due === iso).sort((a, b) => dueDate(a.t) - dueDate(b.t));
    return {i, iso, rows, hours: rows.reduce((s, x) => s + (x.R || 0), 0)};
  });
}
// Deadline ribbon: a pin per thing due, spaced by day, labels on two rows that never overlap
function ribbonHtml(week, pick, late){
  const S = 1.5, pct = c => (c / RB_DAYS * 100).toFixed(3) + "%", at = (c, off) => `${pct(c)} + ${off}px`;
  const days = week.map(w => {
    const d = parse(w.iso), wd = d.getDay() === 0 || d.getDay() === 6, n = w.rows.length;
    const said = `${w.i === 0 ? "Today, " : ""}${fmtDate(w.iso)}: ${n ? `${n} due${fmtHM(w.hours) ? `, ${fmtHM(w.hours)} of work` : ""}` : "nothing due"}. Show only that day`;
    return `<li class="rb-col${w.i === 0 ? " is-today" : ""}${wd ? " is-wkend" : ""}"><button type="button" class="rb-day" data-act="plan-tile" data-id="d:${w.iso}" aria-pressed="${pick === "d:" + w.iso}" aria-label="${esc(said)}">${esc(w.i === 0 ? "Today" : d.toLocaleDateString(undefined, {weekday: "short"}))}<b>${d.getDate()}</b></button></li>`;
  }).join("");
  // x is in day columns from Today's left edge; same-day pins are nudged apart by off px
  const items = late.n ? [{late: true, x: -0.4, left: "var(--lead) / -2", aLeft: "var(--lead) / -2", lane: 1}] : [];
  week.forEach(w => w.rows.forEach((r, k, a) => { const off = Math.round((k - (a.length - 1) / 2) * Math.min(10, 36 / Math.max(1, a.length - 1))); items.push({r, w, x: w.i + 0.5, off, left: at(w.i + 0.5, off)}); }));
  // Two label rows: each label needs S columns clear, exams and quizzes get first pick, and near the right edge a label hangs left of its pin
  const rows = [[], []], more = {}, big = o => !o.late && MILESTONE(o.r.t.type);
  [...items].sort((p, q) => !!q.late - !!p.late || big(q) - big(p) || p.x - q.x).forEach(o => {
    o.flip = !o.late && o.x > RB_DAYS - S; o.a = o.flip ? o.x - S : o.x;
    o.lane = o.late ? 1 : [0, 1].find(l => rows[l].every(p => Math.abs(p.a - o.a) >= S));
    if (o.lane == null) { more[o.w.i] = (more[o.w.i] || 0) + 1; return; }
    o.aLeft = o.flip ? at(o.a, o.off) : o.left; rows[o.lane].push(o);
  });
  rows.forEach(l => l.sort((p, q) => p.a - q.a).forEach((o, k) => { const nx = l[k + 1]; o.maxw = o.flip ? `calc(${pct(S)} - 8px)` : `min(calc(${nx ? nx.aLeft : "100%"} - (${o.aLeft}) - 8px), 16rem)`; }));
  const pin = (o, cls, c) => `<i class="rb-dot${cls}" style="left:calc(${o.left});--c:${c}"></i>`;
  const stem = (o, c) => `<i class="rb-stem r${o.lane}" style="left:calc(${o.left});--c:${c}"></i>`;
  const pins = items.map(o => {
    if (o.late) return pin(o, " rb-late", "var(--late)") + stem(o, "var(--late)") + `<button type="button" class="rb-lb rb-late r1" data-act="plan-tile" data-id="late" aria-pressed="${pick === "late"}" style="left:calc(${o.left});max-width:${o.maxw}" aria-label="${esc(`${late.n} overdue. Show only the overdue`)}"><span class="rb-t"><b>${late.n}</b> late</span>${late.title ? `<small>${esc(late.title)}</small>` : ""}</button>`;
    const t = o.r.t, c = esc(colorOf(t.courseId)), big = MILESTONE(t.type), co = courseOf(t.courseId), h = fmtHM(o.r.R || 0);
    const sub = big || !h ? (co ? courseLabel(co) : t.type || "") : h;
    if (o.lane == null) return pin(o, big ? " rb-big" : "", c);
    return pin(o, big ? " rb-big" : "", c) + stem(o, c) + `<button type="button" class="rb-lb r${o.lane}${big ? " rb-big" : ""}${o.flip ? " rb-flip" : ""}" ${gtOpenAttrs(t)} style="left:calc(${o.left});max-width:${o.maxw};--c:${c}" title="${esc(t.title)}"><span class="rb-t">${esc(t.title)}</span>${sub ? `<small>${esc(sub)}</small>` : ""}</button>`;
  }).join("") + Object.entries(more).map(([i, n]) => { const iso = week[i].iso; return `<button type="button" class="rb-more" data-act="plan-tile" data-id="d:${iso}" style="left:${pct(+i + 0.5)}" aria-label="${esc(`${n} more due ${fmtDate(iso)}. Show only that day`)}">+${n}</button>`; }).join("");
  return `<div class="rb${late.n ? " has-late" : ""}${Object.keys(more).length ? " has-more" : ""}" role="group" aria-label="The next two weeks"><ol class="rb-days">${days}</ol><i class="rb-line" aria-hidden="true"></i><div class="rb-pins">${pins}</div></div>`;
}
function focusHtml(){
  const F = FOCUS || computeFocus();
  const inView = x => inFilter(x.t) && matchesQ(x.t);
  const ranked = F.ranked.filter(inView);
  const workable = ranked.filter(x => !x.fixed);
  const todayList = workable.filter(x => x.alloc > 0);
  ui.focusOpen = true;
  let hero = null; if (ui.focusOpen) { try { hero = nextUp(F); } catch (e) { hero = null; } }
  const heroId = hero ? hero.x.t.id : "";
  const pastFixed = Object.values(F.info).filter(x => x.fixed && inView(x) && x.t.status !== "done" && x.dl < 0).sort((a, b) => b.dl - a.dl);
  const lateRows = workable.filter(x => x.dl < 0), soonRows = workable.filter(x => !(x.alloc > 0));
  const overdue = lateRows.length + pastFixed.length, queued = soonRows.length;
  const week = weekAhead(F, inView), pickDay = /^d:/.test(ui.planTile || "") ? week.find(w => w.iso === ui.planTile.slice(2)) : null;
  if ((ui.planTile === "late" && !overdue) || (/^d:/.test(ui.planTile || "") && !pickDay) || (ui.planTile && ui.planTile !== "late" && !/^d:/.test(ui.planTile))) ui.planTile = "";
  const pick = ui.planTile || "";
  const base = pick === "late" ? lateRows : pickDay ? pickDay.rows : todayList.length ? todayList : workable, rowsAll = pick ? base : base.filter(x => x.t.id !== heroId);
  const cap = pick || (todayList.length && ui.planAllToday) ? rowsAll.length : todayList.length ? 5 : 3;
  const show = rowsAll.slice(0, cap), hiddenToday = !pick && todayList.length ? rowsAll.slice(show.length) : [];
  const sum = [];
  if (todayList.length) sum.push(`<b>${fmtHM(todayList.reduce((s, x) => s + x.alloc, 0))}</b> planned across ${todayList.length} task${todayList.length === 1 ? "" : "s"}`);
  if (overdue) sum.push(`<span class="late"><b>${overdue}</b> overdue</span>`);
  const pastHtml = pastFixed.length && (!pick || pick === "late") ? `<div class="plan-past" role="region" aria-label="Past exams and quizzes"><ul>${pastFixed.slice(0, 3).map(x => { const t = x.t, c = courseOf(t.courseId); return `<li style="--c:${esc(colorOf(t.courseId))}"><span class="pp-q">Did you take <button class="link-btn" data-act="edit-task" data-id="${esc(t.id)}">${esc(t.title)}</button>?<span class="mini">${x.dl === -1 ? "Yesterday" : esc(fmtDate(t.due))}${c ? " · " + esc(courseLabel(c)) : ""}</span></span><span class="pp-acts"><button class="btn small primary" data-act="toggle" data-id="${esc(t.id)}">Mark Done</button><button class="btn small" data-act="move-date" data-id="${esc(t.id)}">Move Date</button></span></li>`; }).join("")}</ul>${pastFixed.length > 3 ? `<p class="mini">${pastFixed.length - 3} more past ${pastFixed.length - 3 === 1 ? "exam or quiz is" : "exams or quizzes are"} on the Task Board.</p>` : ""}</div>` : "";
  const fixedEv = Object.values(F.info).filter(x => x.fixed && inView(x) && x.t.status !== "done" && x.dl >= 0 && x.dl <= 7).sort((a, b) => dueDate(a.t) - dueDate(b.t)).slice(0, 3);
  const fixedHtml = fixedEv.length ? `<div class="plan-fixed" role="region" aria-label="Exams and quizzes on the calendar"><h3 class="plan-sub">On the Calendar</h3><ul>${fixedEv.map(x => { const t = x.t, e = remoteOf(t); return `<li style="--c:${esc(colorOf(t.courseId))}"><button class="plan-main" data-act="edit-task" data-id="${esc(t.id)}"><span class="task-title">${esc(t.title)}</span></button><span class="pf-when">${x.dl === 0 ? "Today" : x.dl === 1 ? "Tomorrow" : esc(fmtShort(t.due))}${t.time ? " " + esc(fmtTime(t.time)) : ""}</span><span class="rx-chip${e.v ? "" : " unk"}" title="${esc(e.v === "no" ? "Taken in person, so it is not suggested as something to do now." : "Not confirmed as take-home, so it is not suggested as something to do now. Open it to say where it is taken.")}">${e.v === "no" ? "In person" : "Not sure"}</span></li>`; }).join("")}</ul></div>` : "";
  if (queued) sum.push(`${queued} more lined up for the coming days`);
  const warn = F.crunch && inView(F.crunch) ? `<p class="plan-warn"><span class="pw-ic" aria-hidden="true">!</span><span class="pw-main">${"From now to " + (d => d === todayISO() ? "the end of today" : d === addDays(todayISO(), 1) ? "tomorrow" : esc(fmtDate(d)))(F.crunch.t.due)}, ${Math.abs((F.thSet == null ? F.dh : F.thSet) - F.dh) < 0.01 ? `at ${fmtHM(F.dh)} a day` : `with ${fmtHM(F.thSet)} today and ${fmtHM(F.dh)} a day after`}, you're about <b>${fmtHM(F.crunch.behind)}</b> short for what's due by then.</span> <span class="pw-tip">Add study time, start sooner, or talk to your instructor early.</span></p>` : "";
  const nBlk = F.blocked.filter(inView).length, nLater = F.later.filter(inView).length;
  const more = ranked.length > show.length + (heroId ? 1 : 0) || nBlk || nLater;
  const listLabel = pick === "late" ? "Overdue" : pickDay ? (pickDay.i === 0 ? "Due Today" : "Due " + esc(fmtDate(pickDay.iso))) : heroId ? (show.some(x => x.alloc > 0) ? "Also Today" : "Then") : "";
  let spare = ""; if (ui.focusOpen && !heroId && !show.length && !pick) { try { spare = nextUpSpare(F, inView); } catch (e) { spare = ""; } }
  const skipped = !heroId && ui.skipNext && ui.skipNext.day === todayISO() && ui.skipNext.ids.length ? `<p class="nu-skipped mini">You skipped every suggestion for now. <button class="link-btn" data-act="nu-back">Go Back</button></p>` : "";
  const foot = (k, label, open) => `<button class="pf-link" data-act="plan-sec" data-id="${k}" aria-expanded="${open}" aria-controls="plan-${k}">${label}<svg class="pf-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></button>`;
  const moreOpen = !!ui.planMore, howOpen = !!ui.planHow;
  let extraHtml = "";
  if (ui.focusOpen) {
    const fcN = allDueCount(), parts = [];
    const prepH = window.SBPREP ? SBPREP.todayHtml() : "", headH = headsHtml(), insH = insightsHtml();
    const fcH = fcN ? `<div class="plan-fc">${FC_ICON}<span><b>${fcN}</b> flashcard${fcN === 1 ? "" : "s"} due for review</span><button class="btn small" data-act="fc-review-all">Review</button></div>` : "";
    if (prepH) parts.push("Exam Prep"); if (headH) parts.push("Heads Up"); if (insH) parts.push("Suggestions"); if (fcH) parts.push(fcN + " Flashcard" + (fcN === 1 ? "" : "s") + " Due");
    if (parts.length) extraHtml = `<details class="plan-extra" id="planExtra"${ui.planExtraOpen ? " open" : ""}><summary><span class="pe-t">More for Today<i class="pe-dot" aria-hidden="true" style="margin-left:7px"></i></span><span class="pe-s">${esc(parts.join(", "))}</span></summary><div class="pe-b">${fcH}${prepH}${headH}${insH}</div></details>`;
  }
  const planH = todayList.reduce((s, x) => s + x.alloc, 0), freeMin = F.avail && F.avail.show && F.avail.res ? (F.avail.res.windows || []).reduce((s, w) => s + (w.min || 0), 0) : null;
  const hoursTitle = F.doneToday >= 0.25 ? `${fmtMins(F.doneToday * 60)} done so far, ${fmtHM(F.th)} left` : planH && Math.abs(planH - F.thSet) >= 0.25 ? `${fmtHM(planH)} of tasks planned` : "";
  const planTile = `<div class="pt-stat pt-hours" role="group" aria-label="Study time today"><div class="pt-adj"><button class="icon-btn sm" data-act="today-h" data-id="-0.5" aria-label="Less time today">−</button><b${hoursTitle ? ` title="${esc(hoursTitle)}"` : ""}>${fmtHM(F.thSet) || "0m"}</b><button class="icon-btn sm" data-act="today-h" data-id="0.5" aria-label="More time today">+</button></div><span>Planned Today</span>${freeMin != null ? `<span class="pt-free">${esc(fmtHM(freeMin / 60) || "0m")} free left</span>` : ""}</div>`;
  const ptStats = todayList.length || overdue || queued ? `<div class="pt-stats">${planTile}${ribbonHtml(week, pick, {n: overdue, title: ((lateRows[0] || pastFixed[0]) || {t: {}}).t.title || ""})}</div>` : "";
  return `<section class="focus plan" aria-label="Today's Plan">
    <div class="focus-head"><div class="fh-txt"><h2><span>Today's Plan</span></h2>${ptStats}<div class="focus-sum${ptStats ? " pt-sr" : ""}">${sum.join(", ") || (fixedEv.length ? "No assignments due yet, just what's on the calendar below." : "Nothing due yet. Add tasks with due dates to get a plan.")}</div>${F.gapWhy && F.gapWhy.length ? `<p class="plan-gap">${F.gapWhy.map(esc).join(" ")}</p>` : ""}</div>
      ${(hoursBar => `<div class="fh-ctl${ptStats ? " fh-chip has-stats" : ""}">${hoursBar}${autoChipHtml()}</div>`)(`<div class="hours-ctl" role="group" aria-label="Study time available today"><span class="mini">Time Today</span><button class="icon-btn sm" data-act="today-h" data-id="-0.5" aria-label="Less time today">−</button><b${hoursTitle ? ` title="${esc(hoursTitle)}"` : ""}>${fmtHM(F.thSet) || "0m"}</b><button class="icon-btn sm" data-act="today-h" data-id="0.5" aria-label="More time today">+</button></div>`)}</div>
    ${ui.focusOpen ? `${window.SBPRO ? SBPRO.todayHtml() : ""}${dayTimelineHtml(F, todayList, heroId)}${nextUpHtml(F, hero)}${skipped}${spare}${warn}${pastHtml}${availStripHtml(F)}
      ${show.length ? `${listLabel ? `<h3 class="plan-sub" id="planListLbl">${listLabel}</h3>` : ""}<ol class="plan-list"${listLabel ? ' aria-labelledby="planListLbl"' : ""}>${show.map((x, i) => planRow(x, i)).join("")}</ol>${ui.planAllToday && rowsAll.length > 5 ? `<button type="button" class="pf-link plan-rows" data-act="plan-rows" aria-expanded="true">${esc(tr("plan.fewerRows", "Show fewer"))}</button>` : ""}${hiddenToday.length ? `<button type="button" class="pf-link plan-rows" data-act="plan-rows" aria-expanded="false">${esc(trn("plan.moreRows", hiddenToday.length, "{n} more task today, {time} | {n} more tasks today, {time}", {time: fmtHM(hiddenToday.reduce((t, x) => t + x.alloc, 0))}))}</button>` : ""}` : pickDay ? `<p class="focus-sum" style="margin-top:10px">Nothing due that day.</p>` : heroId || spare || pick ? "" : `<p class="focus-sum" style="margin-top:10px">Nothing to work on right now.</p>`}${pick ? `<button type="button" class="pf-link plan-rows" data-act="plan-tile" data-id="">Back to Today's Plan</button>` : ""}
      ${fixedHtml}
      ${extraHtml}
      <div class="plan-foot">${more ? foot("more", `Full Ranking${nBlk ? `, Waiting (${nBlk})` : ""}${nLater ? `, Coming Up (${nLater})` : ""}`, moreOpen) : ""}${foot("how", "How This Is Ranked", howOpen)}</div>
      ${more ? `<div class="plan-more" id="plan-more" role="region" aria-label="Full Ranking"${moreOpen ? "" : " hidden"}>
        <p class="plan-cap">Everything open, in ranked order. The number on the right is each task's focus score.</p>
        <ol class="plan-list">${ranked.map((x, i) => planRow(x, i, true)).join("")}</ol>
        ${nBlk ? `<h3 class="fsec">Waiting on Another Task</h3><ul class="plan-list">${F.blocked.filter(inView).map((x, i) => planRow(x, i, true, true)).join("")}</ul>` : ""}
        ${nLater ? `<h3 class="fsec">Not Started Yet</h3><ul class="plan-list">${F.later.filter(inView).map((x, i) => planRow(x, i, true, true)).join("")}</ul>` : ""}
      </div>` : ""}
      <div class="plan-how" id="plan-how" role="region" aria-label="How This Is Ranked"${howOpen ? "" : " hidden"}>
        <p><b>Deadlines come first.</b> Each task's score starts from how close its exact due time is: something due tomorrow counts about five times as much as something due in a week, and dozens of times more than something due in a month. Anything due in the next week always stays above work due 10 or more days after it. The one exception is a big task that needs most of your study time before its deadline (or more than you have), which climbs early so it gets started in time. <b>Grade weight</b> then fine-tunes the order between similar deadlines (a 40% project counts about twice as much as a 1% reading, not more). After that it adjusts for your priority, the late-work policy, tasks already in progress or nearly done, small tasks due soon, hard tasks, work left alone for days, a full placement or class day coming up, and tasks that others depend on.</p>
        <p>${aiWho() ? `${esc(aiWho())}, your study companion, uses this ranking to choose Do This Next and the ideas it offers you. ` : ""}Today's time is split in score order. Each task gets its fair share of the days left before it's due, more if it can't fit otherwise. Hard tasks are front-loaded, and exam studying is spread over the week before. Work left comes from your hours estimate and progress, minus time you've already spent in focus sessions. When a task has no estimate, Studyboard uses how long your past tasks of that type actually took, and if you usually take longer than you estimate, it allows for that. <b>Do This Next</b> picks from the top of the ranking for right now: something due later today first, what you were just working on, hard tasks in the morning, and shorter ones late at night.${AUTO_ON ? " <b>Automatic AI is on</b>, so the AI also reads your whole list a few times a day: it picks Do This Next and the alternatives, estimates hours for tasks you didn't estimate (using how long your past tasks took), estimates the work left on started tasks from your focus time and progress, judges how ready you are for each exam from your study sessions, flashcards and quizzes, tunes the next study sessions to what you keep missing, and prepares the practice test for practice days. Each part can be turned off under Suggestions, Manage." : ""} For exams and quizzes, work left comes from difficulty, grade weight and how prepared you are. It also reads your Schedule (long class, lab and placement days leave less study time, and it suggests something short when a class is coming up), takes off the focus time you've already done today, and uses what school sync knows: when late submissions close, how many points each item is worth when the gradebook isn't weighted, and word or page counts in the instructions for time estimates. An exam or quiz is only Do This Next when it can be taken from home (Studyboard checks your school site and the instructions, and asks you if it can't tell); in-person ones show under On the Calendar, and their study sessions are what gets suggested.${AUTO_ON ? " The AI also reads your instructions, recent announcements, your schedule and your course standings, and lists anything easy to miss under Heads Up." : ""} Set your usual study hours per day in Settings.</p>
      ${accOf() ? accOf().howHtml() : ""}
      <${"!--"}plan-how-end--></div>` : ""}
  </section>`;
}

