/* ===== module: 01-courses.js: the app's core, Timeline, Courses and Archive ===== */
/* Timeline */
const TYPE_ICONS = {
  Assignment: '<path d="M7 3h8l4 4v14H7z"/><path d="M15 3v4h4M10 12h6M10 16h6"/>',
  Exam: '<g transform="translate(0 1.8)"><path d="M12 3l9 4-9 4-9-4z"/><path d="M7 9.5V14c0 1.5 2.2 3 5 3s5-1.5 5-3V9.5"/></g>',
  Quiz: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17h.01"/>',
  Reading: '<path d="M3 5.5C5 4.5 8 4.5 12 6.5c4-2 7-2 9-1v13c-2-1-5-1-9 1-4-2-7-2-9-1z"/><path d="M12 6.5v13"/>',
  Project: '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M12 12l8-4.5M12 12L4 7.5M12 12v9"/>',
  Lab: '<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3l-5-9V3"/><path d="M7.5 15h9"/>',
  Study: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>',
  Other: '<circle cx="12" cy="12" r="3.2"/><circle cx="12" cy="12" r="9"/>'
};
function typeIcon(type){ return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${TYPE_ICONS[type] || TYPE_ICONS.Other}</svg>`; }
// Phones show the Timeline as the month calendar only
const tlPhone = () => innerWidth < 640;
{ let was = null; addEventListener("resize", () => { const now = tlPhone(); if (was !== null && now !== was && typeof ui !== "undefined" && ui.tab === "timeline") render(); was = now; }); }
function viewTimeline(){
  return tlPhone() || ui.tlMode === "calendar" ? viewCalendar() : viewBars();
}
function viewBars(){
  const today = todayISO();
  const all = visibleTasks().filter(t => t.status !== "done");
  const ts = all.filter(t => t.due);
  const noDue = all.length - ts.length;
  const dw = {week: 42, month: 22, term: 9}[ui.tlZoom] || 22;
  const LW = window.matchMedia("(min-width:700px)").matches ? 230 : 140;
  let min = addDays(today, ui.tlZoom === "term" ? -60 : ui.tlZoom === "week" ? -14 : -30), max = addDays(today, ui.tlZoom === "term" ? 100 : 40);
  ts.forEach(t => { const s = startOf(t); if (s < min) min = s; if (t.due > max) max = t.due; });
  const floor = addDays(today, -183), ceil = addDays(today, 400);
  if (min < floor) min = floor; if (max > ceil) max = ceil;
  min = mondayOf(addDays(min, -3)); max = addDays(max, 10);
  const days = dayDiff(min, max) + 1, W = days * dw;
  const x = d => dayDiff(min, d) * dw;

  let bg = "", months = "", dayh = "";
  const mStarts = []; for (let i = 0; i < days; i++) { const d = parse(addDays(min, i)); if (i === 0 || d.getDate() === 1) mStarts.push(i); }
  for (let i = 0; i < days; i++) {
    const k = addDays(min, i), d = parse(k), wd = d.getDay();
    if (wd === 0 || wd === 6) bg += `<i class="we" style="left:${i*dw}px;width:${dw}px"></i>`;
    if (i === 0 || d.getDate() === 1) { const nx = mStarts[mStarts.indexOf(i) + 1], span = ((nx == null ? days : nx) - i) * dw; months += `<span class="tl-m" style="left:${i*dw}px;width:${span}px">${esc(d.toLocaleDateString(undefined, {month: dw >= 20 && span >= 120 ? "long" : "short"}))}${(i === 0 || d.getMonth() === 0) && span >= 130 ? `<small>${d.getFullYear()}</small>` : ""}</span>`; }
    if (dw >= 20) dayh += `<span class="tl-d ${k === today ? "is-today" : ""}" style="left:${i*dw}px;width:${dw}px"><b>${d.getDate()}</b></span>`;
    else if (wd === 1) dayh += `<span class="tl-d" style="left:${i*dw}px;width:${dw*7}px;justify-content:flex-start;padding-left:4px">${d.getDate()}</span>`;
  }
  const groups = coursesArr().map(c => ({c, list: ts.filter(t => t.courseId === c.id)}));
  groups.push({c: null, list: ts.filter(t => !courseOf(t.courseId))});
  let rows = "";
  groups.filter(g => g.list.length).forEach(g => {
    const col = g.c ? g.c.color : "#8A94A6";
    rows += `<div class="tl-row tl-group" style="--c:${esc(col)}"><div class="tl-label" style="width:${LW}px"><span class="tl-gic" aria-hidden="true">${g.c ? courseRingHtml(g.c) : GENERAL_ICON}</span><span class="tt"${g.c && g.c.code && g.c.name ? ` title="${esc(g.c.name)}"` : ""}>${esc(g.c ? courseLabel(g.c) : "No Course")}</span></div><div class="tl-track" style="width:${W}px"><span class="tl-gname">${esc(g.c && g.c.code && g.c.name !== courseLabel(g.c) ? g.c.name : "")}</span><span class="tl-gn">${g.list.length} open</span></div></div>`;
    g.list.slice().sort((a, b) => (startOf(a) < startOf(b) ? -1 : startOf(a) > startOf(b) ? 1 : sortTasks(a, b))).forEach(t => {
      const s = startOf(t);
      const late = t.due < today;
      const range = s === t.due ? fmtShort(t.due) : `${fmtShort(s)} to ${fmtShort(t.due)}`;
      const ms = MILESTONE(t.type);
      const icon = `<button class="ms tl-ic ${late ? "late" : ""}" style="left:${x(t.due) + dw / 2 - 13}px" data-act="edit-task" data-id="${esc(t.id)}" data-dueonly="${ms ? "" : 1}" title="${esc(t.type)}: ${esc(t.title)}, due ${esc(fmtShort(t.due))}" aria-label="${esc(t.title)}, ${esc(t.type)}, due ${esc(fmtShort(t.due))}${late ? ", past due" : ""}">${typeIcon(t.type)}</button>`;
      rows += `<div class="tl-row" style="--c:${esc(col)}">
        <button class="tl-label" style="width:${LW}px" data-act="edit-task" data-id="${esc(t.id)}"><span class="tt">${esc(t.title)}</span><small>${esc([t.type, isNum(t.hours) && !MILESTONE(t.type) ? fmtH(Number(t.hours)) : ""].filter(Boolean).join(" · "))}</small></button>
        <div class="tl-track" style="width:${W}px">${icon}<span class="tl-dl${late ? " late" : ""}" style="left:${x(t.due) + dw / 2 + 17}px">${esc(fmtShort(t.due))}${ms ? `<em>${esc(t.type)}</em>` : ""}</span></div>
      </div>`;
    });
  });

  const zoom = [["week","Days"],["month","Weeks"],["term","Term"]].map(([k, l]) => `<button data-act="tl-zoom" data-id="${k}" aria-pressed="${ui.tlZoom === k}">${l}</button>`).join("");
  const head = `<div class="tl-controls tl-tools">${coursePickHtml()}${tlModeSeg()}<div class="segb" role="group" aria-label="Zoom">${zoom}</div><button class="btn small" data-act="tl-today">Today</button>${proBtns("timeline")}</div>`;
  if (!ts.length) return head + searchNote() + `<div class="empty" style="margin-top:14px"><strong>Nothing to Show Yet</strong>Tasks show up here as an icon on their due date.${noDue ? `<br>${noDue} task${noDue === 1 ? " has" : "s have"} no due date.` : ""}</div>`;
  return head + searchNote() + `<div class="tl-scroll" data-today="${x(today)}" data-dw="${dw}">
      <div class="tl" style="width:${LW + W}px" data-lw="${LW}">
        <div class="tl-bg" style="left:${LW}px;width:${W}px">${bg}</div><div class="tl-bg tl-bg-top" style="left:${LW}px;width:${W}px"><i class="today-line" style="left:${x(today) + dw/2 - 1}px"></i></div>
        <div class="tl-row tl-headrow"><div class="tl-label" style="width:${LW}px"></div><div class="tl-track" style="width:${W}px">${months}</div></div>
        <div class="tl-row tl-headrow"><div class="tl-label" style="width:${LW}px"></div><div class="tl-track" style="width:${W}px">${dayh}</div></div>
        ${rows}
      </div></div>
    <div class="tl-legend">${TYPES.filter(k => ts.some(t => t.type === k)).map(k => `<span><i class="tl-ic key">${typeIcon(k)}</i>${esc(k)}</span>`).join("")}<span><i class="dep-key"></i>Depends On</span><span><i class="tl-ic key late">${typeIcon("Other")}</i>Past Due</span></div>
    <p class="hint-line tip-everyday">Drag an icon to move its due date. Finished tasks are hidden.${noDue ? ` ${noDue} without a due date ${noDue === 1 ? "isn't" : "aren't"} shown.` : ""}</p>`;
}
function viewCalendar(){
  const today = todayISO();
  if (!ui.calMonth) ui.calMonth = today.slice(0, 7) + "-01";
  if (!ui.calDay) ui.calDay = today;
  const m = parse(ui.calMonth);
  const first = new Date(m.getFullYear(), m.getMonth(), 1);
  const start = new Date(first); start.setDate(1 - first.getDay());
  const byDay = {};
  visibleTasks().forEach(t => { if (t.due) (byDay[t.due] = byDay[t.due] || []).push(t); });
  const dows = [];
  for (let i = 0; i < 7; i++) { const d = new Date(2023, 0, 1 + i); dows.push(`<div class="dow${i === 0 || i === 6 ? " wkend" : ""}" aria-hidden="true"><span class="dw-n">${d.toLocaleDateString(undefined, {weekday:"narrow"})}</span><span class="dw-s">${d.toLocaleDateString(undefined, {weekday:"short"})}</span><span class="dw-l">${d.toLocaleDateString(undefined, {weekday:"long"})}</span></div>`); }
  let cells = "";
  const weeks = Math.ceil((first.getDay() + new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate()) / 7);
  for (let i = 0; i < weeks * 7; i++) {
    const d = new Date(start); d.setDate(start.getDate() + i);
    const k = iso(d);
    const ts = (byDay[k] || []).slice().sort(sortTasks);
    const out = d.getMonth() !== m.getMonth();
    const late = ts.filter(t => t.status !== "done" && k < today).length;
    const dots = ts.slice(0, 3).map(t => `<span class="ci-row${t.status !== "done" && k < today ? " late" : ""}${t.status === "done" ? " done" : /^(Exam|Quiz)$/.test(t.type) ? " big" : ""}" style="--c:${esc(colorOf(t.courseId))}"><i class="ci" title="${esc(t.type)}: ${esc(t.title)}${t.status !== "done" && k < today ? ", overdue" : ""}" style="--c:${esc(colorOf(t.courseId))};${t.status === "done" ? "opacity:.35" : ""}">${typeIcon(t.type)}</i><span class="ci-t${t.status === "done" ? " done" : ""}">${esc(t.title)}</span></span>`).join("") + (ts.length > 3 ? `<b class="ci-more">+${ts.length - 3}<span class="ci-mw"> more</span></b>` : "");
    cells += `<button class="day ${out ? "out" : ""} ${k === today ? "is-today" : ""}${late ? " has-late" : ""}${k < today ? " past" : ""}${d.getDay() === 0 || d.getDay() === 6 ? " wkend" : ""}" data-act="pick-day" data-id="${k}" aria-pressed="${k === ui.calDay}" aria-label="${esc(d.toLocaleDateString(undefined, {weekday:"long", month:"long", day:"numeric"}))}, ${ts.length} task${ts.length === 1 ? "" : "s"} due${late ? `, ${late} overdue` : ""}"><span class="num">${d.getDate()}${k === today ? `<span class="num-t"> Today</span>` : ""}</span><span class="dots">${dots}</span></button>`;
  }
  const dayTasks = (byDay[ui.calDay] || []).slice().sort(sortTasks);
  const dayLabel = parse(ui.calDay).toLocaleDateString(undefined, {weekday:"long", month:"long", day:"numeric"});
  return `${tlPhone() ? chipsHtml() : `<div class="tl-controls tl-tools">${coursePickHtml()}${tlModeSeg()}</div>`}${searchNote()}
    <div class="cal-head">
      <button class="icon-btn" data-act="cal-prev" aria-label="Previous month"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg></button>
      <h2>${esc(m.toLocaleDateString(undefined, {month:"long", year:"numeric"}))}</h2>
      <button class="btn small" data-act="cal-today" ${ui.calMonth.slice(0, 7) === today.slice(0, 7) && (!ui.calDay || ui.calDay === today) ? 'disabled aria-pressed="true" title="You are viewing today"' : 'aria-pressed="false"'}>Today</button>
      <button class="icon-btn" data-act="cal-next" aria-label="Next month"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg></button>
    </div>
    <div class="cal">${dows.join("")}${cells}</div>
    <h2 class="sec ${ui.calDay === today ? "hl" : ""}"><span class="t">Due ${esc(dayLabel)}</span><span class="n">${dayTasks.length || ""}</span></h2>
    ${dayTasks.length ? taskList(dayTasks) : `<div class="empty">Nothing due. <button class="link-btn" data-act="new-task" data-due="${ui.calDay}">Add a Task Due This Day</button></div>`}`;
}

/* Courses */
// School sites name courses like "0 - Context of Nursing 1 - 44861": the card shows just the name
const cardName = n => { const t = String(n || "").replace(/^\s*\d{1,3}\s*[-–:]\s*/, "").replace(/\s*[-–]\s*\d{4,}\s*$/, "").trim(); return t || n; };
function viewCourses(){
  if (ui.courseId) {
    const c = courseOf(ui.courseId);
    if (c) return viewCourseDetail(c);
    ui.courseId = null;
  }
  const cs = coursesArr();
  const imp = `<button class="btn small" data-act="import-syllabus">Import a Syllabus</button>`;
  if (!cs.length) return `<div class="empty sb-es" style="margin-top:18px">${emptyArt()}<strong>No Courses Yet</strong>Add each class you're taking this term.<br><button class="btn primary" data-act="new-course">Add a Course</button> ${imp}</div>${(n => n ? `<div class="term-bar"><span>${ARCHIVE_SM}${n} course${n === 1 ? " is" : "s are"} in the Archive from past terms.</span><button class="btn small" data-act="archive-open">Open Archive (${n})</button></div>` : "")(allCourses().filter(c => c.archived).length)}`;
  const today = todayISO();
  const cards = cs.map(c => {
    const ts = courseTasks(c);
    const open = ts.filter(t => t.status !== "done");
    const hrs = weekHours(open, mondayOf(today));
    const doneN = ts.length - open.length, nFiles = Object.values(state.files).filter(f => f.courseId === c.id).length;
    const gn = window.SBGRADES && SBGRADES.now(c), pill = courseStatusPill(open, today), when = courseTimesText(c), pct = ts.length ? (doneN / ts.length * 100).toFixed(0) : 0;
    const mini = (ts.length ? `<span class="c2-mini"><i><b style="width:${pct}%"></b></i><span aria-hidden="true">${doneN}/${ts.length}</span><span class="sr">${doneN} of ${ts.length} done</span></span>` : "")
      + (nFiles ? `<span class="c2-mini c2-files"><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 11.5l-7.8 7.8a5 5 0 0 1-7.1-7.1l8.2-8.2a3.4 3.4 0 0 1 4.8 4.8l-8.2 8.2a1.7 1.7 0 0 1-2.4-2.4l7.5-7.5"/></svg><span aria-hidden="true">${nFiles}</span><span class="sr">${nFiles} file${nFiles === 1 ? "" : "s"}</span></span>` : "");
    return `<div class="course-wrap" data-sort-id="${esc(c.id)}"><button class="course-card c2-card" style="--c:${esc(c.color)}" data-code="${esc(courseLabel(c))}" data-act="open-course" data-id="${esc(c.id)}">
      <span class="c2-band"><span class="g2-kick">${esc(courseLabel(c))}</span>${when ? `<span class="c2-sched">${esc(when)}</span>` : ""}</span>
      <span class="c2-top"><span class="g2-ring c2-ring" aria-hidden="true">${courseRingHtml(c)}</span><h3><span class="c2-name">${esc(cardName(c.name))}</span><span class="c2-code">${esc(courseLabel(c))}</span></h3></span>
      <span class="body">
        ${when ? `<span class="c2-when">${esc(when)}</span>` : ""}${courseNextHtml(open, today)}
        ${ts.length ? `<div class="prog" style="--c:${esc(c.color)}"><span class="track"><i style="width:${pct}%"></i></span>${doneN} of ${ts.length} done${nFiles ? `, ${nFiles} file${nFiles === 1 ? "" : "s"}` : ""}</div>` : ""}
        ${gn || hrs > 0 || pill || mini ? `<span class="c2-foot${gn || hrs > 0 || pill ? "" : " c2-foot-m"}">${mini}${gn && gn.pct != null ? `<span class="c2-grade"><span class="c2-gl">Grade </span><b>${esc(gn.fmt(gn.pct))}</b>${gn.letter ? `<span class="c2-letter">${esc(gn.letter)}</span>` : ""}<span class="mini">· ${esc(gn.fmt(gn.marked))} marked</span></span>` : gn ? `<span class="mini c2-nomarks">No marks yet</span>` : hrs > 0 ? `<span class="mini"><b>${fmtH(hrs)}</b> this week</span>` : "<span></span>"}${pill}</span>` : ""}
      </span></button></div>`;
  }).join("");
  return `<div class="view-head"><h2>Your Courses</h2>${proBtns("courses")}${trashBtn("course")}</div><div class="course-list" data-sortable="courses">${cards}</div>
    <div class="term-bar"><span>${ARCHIVE_SM}Term over? Put its courses and tasks away, and bring anything back later.</span><button class="btn small" data-act="new-term">Start a New Term</button><button class="btn small" data-act="archive-open">Open Archive${(n => n ? ` (${n})` : "")(allCourses().filter(c => c.archived).length)}</button></div>`;
}
// The line under a course's name
function courseNextHtml(open, today){
  const dated = open.filter(t => t.due).sort((a, b) => (a.due + (a.time || "99")).localeCompare(b.due + (b.time || "99")));
  const late = dated.filter(t => t.due < today).length, next = dated.find(t => t.due >= today);
  if (!late && !next) return "";
  const lateHtml = late ? `<span class="late">${late} late</span>` : "";
  return next ? `<div class="next">Next: <b>${esc(next.title)}</b> · ${esc(fmtShort(next.due))}</div>` : late ? `<div class="next">${lateHtml}</div>` : "";
}
// 30 study-topic icons a course can wear in its ring (Edit Course > Icon)
const COURSE_ICONS = {
  // classes: a = course colour, b = light tint, w = white, y = warm yellow, g = leaf green
  bio: ["Biology", '<path class="sa" d="M8 3c0 5 8 6 8 9s-8 4-8 9"/><path class="sb" d="M16 3c0 5-8 6-8 9s8 4 8 9"/><path d="M9 6h6M9.5 18h5M10 9.5h4M10 14.5h4"/>'],
  chem: ["Chemistry", '<path class="b" d="M10 3v6l-5.5 9.5A1.7 1.7 0 0 0 6 21h12a1.7 1.7 0 0 0 1.5-2.5L14 9V3z"/><path class="a" d="M6.6 14.5h10.8l2.1 4A1.7 1.7 0 0 1 18 21H6a1.7 1.7 0 0 1-1.5-2.5z"/><path d="M9 3h6M10 3v6l-5.5 9.5A1.7 1.7 0 0 0 6 21h12a1.7 1.7 0 0 0 1.5-2.5L14 9V3"/><circle class="w" cx="10" cy="17.5" r="1"/><circle class="w" cx="13.5" cy="18.5" r=".7"/>'],
  phys: ["Physics", '<ellipse cx="12" cy="12" rx="9" ry="3.6"/><ellipse cx="12" cy="12" rx="9" ry="3.6" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="9" ry="3.6" transform="rotate(-60 12 12)"/><circle class="a" cx="12" cy="12" r="2.6"/>'],
  math: ["Math", '<rect class="b" x="3" y="3" width="18" height="18" rx="5"/><path class="sa" d="M16.5 7H8l5 5-5 5h8.5"/>'],
  geom: ["Geometry", '<path class="b" d="M4 20 20 4v16z"/><path d="M4 20 20 4v16z"/><path class="a" d="M14.5 20v-3a2.5 2.5 0 0 1 2.5-2.5h3V20z"/>'],
  stats: ["Statistics", '<rect class="b" x="5" y="11" width="4" height="8" rx="1"/><rect class="a" x="10" y="5" width="4" height="14" rx="1"/><rect class="y" x="15" y="13" width="4" height="6" rx="1"/><path d="M3.5 20h17"/>'],
  code: ["Computer Science", '<rect class="a" x="2.5" y="4" width="19" height="16" rx="3"/><path class="ws" d="M9 9l-3 3 3 3M15 9l3 3-3 3M13 7.5l-2 9"/>'],
  eng: ["Engineering", '<path class="a" d="M12 2.8l1.6 2.4 2.8-.6.6 2.8 2.4 1.6-1.2 2.6 1.2 2.6-2.4 1.6-.6 2.8-2.8-.6L12 21.2l-1.6-2.4-2.8.6-.6-2.8-2.4-1.6L5.8 12 4.6 9.4 7 7.8l.6-2.8 2.8.6z"/><circle class="w" cx="12" cy="12" r="3.4"/>'],
  geo: ["Geography", '<circle class="b" cx="12" cy="12" r="9"/><path class="a" d="M7.5 6.5c2 0 3 1.5 2.5 3s-2.5 2-3.5 4c-1-1-2-3-1.5-5s1.5-2 2.5-2zM14 12.5c1.5-.5 3.5.5 3.5 2s-1.5 3-3.5 3.5c-.5-1.5-1-4 0-5.5zM13 5c1.5 0 3 .7 3.5 2-1.2.4-2.6.2-3.5-.5z"/><circle cx="12" cy="12" r="9"/>'],
  hist: ["History", '<path class="b" d="M7 3c0 5 10 5 10 9s-10 4-10 9h10c0-5-10-5-10-9s10-4 10-9z"/><path class="a" d="M9 6.5h6L12 9.5zM8.2 19.8c1-2 2.6-3.2 3.8-3.2s2.8 1.2 3.8 3.2z"/><path d="M6 3h12M6 21h12M7 3c0 5 10 5 10 9s-10 4-10 9M17 3c0 5-10 5-10 9s10 4 10 9"/>'],
  pol: ["Politics", '<path class="a" d="M3 9l9-5 9 5z"/><rect class="b" x="4.5" y="9" width="15" height="8.5"/><path d="M3 9l9-5 9 5zM6.5 9v8.5M10 9v8.5M14 9v8.5M17.5 9v8.5M3 20h18"/>'],
  lang: ["Languages", '<path class="a" d="M3.5 4.5h12v8.5H8l-4.5 3.5z"/><path class="y" d="M15.5 9h5v8.5l-3-2.2h-6V13h4z"/><path class="ws" d="M7 8.5h5"/>'],
  lit: ["Literature", '<path class="b" d="M12 6c-2-1.5-5-2-8-1.5V19c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5V4.5c-3-.5-6 0-8 1.5z"/><path class="a" d="M12 6c2-1.5 5-2 8-1.5V19c-3-.5-6 0-8 1.5z"/><path d="M12 6c-2-1.5-5-2-8-1.5V19c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5V4.5c-3-.5-6 0-8 1.5zM12 6v14.5"/>'],
  write: ["Writing", '<path class="a" d="M16.5 3.5l4 4L8 20l-4-4z"/><path class="y" d="M4 16l4 4-5 1z"/><path d="M16.5 3.5l4 4L8 20l-5 1 1-5zM14 6l4 4"/>'],
  art: ["Art", '<path class="b" d="M12 3a9 9 0 1 0 0 18c1.4 0 2-1 2-2 0-1.5-1.2-1.8-1.2-3s.9-2 2.2-2H17a4 4 0 0 0 4-4c0-4-4-7-9-7z"/><path d="M12 3a9 9 0 1 0 0 18c1.4 0 2-1 2-2 0-1.5-1.2-1.8-1.2-3s.9-2 2.2-2H17a4 4 0 0 0 4-4c0-4-4-7-9-7z"/><circle class="a" cx="7.5" cy="11" r="1.6"/><circle class="y" cx="10.5" cy="7" r="1.6"/><circle class="r" cx="15" cy="7.5" r="1.6"/><circle class="g" cx="7.5" cy="15.5" r="1.4"/>'],
  music: ["Music", '<path d="M9 18V5l11-2v13"/><path class="sa" d="M9 8l11-2"/><circle class="a" cx="6.5" cy="18" r="2.8"/><circle class="a" cx="17.5" cy="16" r="2.8"/>'],
  drama: ["Drama", '<path class="a" d="M4 4h16v6a8 8 0 0 1-16 0z"/><path class="ws" d="M8 9h1.5M14.5 9H16M9 13.5c1.8 1.6 4.2 1.6 6 0"/>'],
  psych: ["Psychology", '<path class="b" d="M9 4a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 2 5 3 3 0 0 0 3 3 2 2 0 0 0 3-1.5V5.5A2 2 0 0 0 9 4z"/><path class="a" d="M15 4a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-2 5 3 3 0 0 1-3 3 2 2 0 0 1-3-1.5V5.5A2 2 0 0 1 15 4z"/><path d="M9 4a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 2 5 3 3 0 0 0 3 3 2 2 0 0 0 3-1.5V5.5A2 2 0 0 0 9 4zM15 4a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-2 5 3 3 0 0 1-3 3 2 2 0 0 1-3-1.5"/>'],
  econ: ["Economics", '<circle class="y" cx="7" cy="17" r="3.5"/><path d="M7 15.5v3"/><path class="sa" d="M3 13l6-6 4 4 8-8"/><path class="sa" d="M15 3h6v6"/>'],
  biz: ["Business", '<rect class="a" x="3" y="7" width="18" height="13" rx="2"/><path class="ws" d="M3 12.5h18"/><rect class="y" x="10" y="11" width="4" height="3" rx=".8"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/>'],
  law: ["Law", '<path class="a" d="M2 14h6a3 3 0 0 1-6 0zM16 14h6a3 3 0 0 1-6 0z"/><path d="M12 3v18M7 21h10M5 7h14M5 7l-3 7M5 7l3 7M19 7l-3 7M19 7l3 7"/><circle class="y" cx="12" cy="4.5" r="1.6"/>'],
  nurse: ["Nursing", '<path d="M6 3v6a5 5 0 0 0 10 0V3"/><path d="M11 14v2a4 4 0 0 0 8 0v-2"/><circle class="a" cx="19" cy="11.5" r="2.6"/><circle class="b" cx="6" cy="3" r="1.3"/><circle class="b" cx="16" cy="3" r="1.3"/>'],
  health: ["Health", '<path class="a" d="M20.5 8.5c0 5-8.5 11-8.5 11S3.5 13.5 3.5 8.5A4.5 4.5 0 0 1 12 6a4.5 4.5 0 0 1 8.5 2.5z"/><path class="ws" d="M6 12h3l1.5-2.5 2 5L14 12h4"/>'],
  astro: ["Astronomy", '<circle class="a" cx="12" cy="12" r="5.2"/><path class="ws" d="M9 10.5c1-1 2.5-1.3 3.5-1"/><ellipse cx="12" cy="12" rx="10.5" ry="3.2" transform="rotate(-20 12 12)"/><circle class="y" cx="19.5" cy="5" r="1.2"/>'],
  env: ["Environment", '<path class="a" d="M5 19c0-8 5-13 14-14 0 9-5 14-13 14z"/><path class="ws" d="M5 19c3-5 6-8 10-10"/>'],
  phil: ["Philosophy", '<path class="y" d="M12 3a6 6 0 0 0-4 10.5c.8.8 1 1.6 1 2.5h6c0-.9.2-1.7 1-2.5A6 6 0 0 0 12 3z"/><path d="M12 3a6 6 0 0 0-4 10.5c.8.8 1 1.6 1 2.5h6c0-.9.2-1.7 1-2.5A6 6 0 0 0 12 3z"/><rect class="a" x="8.5" y="16.5" width="7" height="2.5" rx="1"/><path d="M10 21h4"/>'],
  soc: ["Sociology", '<circle class="b" cx="17" cy="9" r="2.8"/><path class="b" d="M14.5 19.5c0-2.8 1.3-5.2 3.5-5.4 2.3.2 3.5 2.4 3.5 5.4z"/><circle class="a" cx="9" cy="8" r="3.4"/><path class="a" d="M3 19.5c0-3.2 2.7-5.5 6-5.5s6 2.3 6 5.5z"/>'],
  edu: ["Education", '<path class="a" d="M12 7.5c-1.5-1-5-1.5-6.5 1.5S5 16 8 19c1.5 1.5 2.5 1 4 .5 1.5.5 2.5 1 4-.5 3-3 4-7.5 2.5-10.5S13.5 6.5 12 7.5z"/><path d="M12 7.5c0-2 1-3.5 3-4.5"/><path class="g" d="M12.5 5.5c1-1.8 3-2.3 4.5-1.8-.6 1.6-2.5 2.5-4.5 1.8z"/><path class="ws" d="M8 10.5c-.8 1-1 2.2-.8 3.3"/>'],
  sport: ["Sports", '<path d="M6.5 12h11"/><rect class="a" x="4.5" y="6" width="4" height="12" rx="1.4"/><rect class="a" x="15.5" y="6" width="4" height="12" rx="1.4"/><rect class="b" x="2" y="9" width="2.5" height="6" rx="1"/><rect class="b" x="19.5" y="9" width="2.5" height="6" rx="1"/>'],
  acct: ["Accounting", '<rect class="b" x="5" y="3" width="14" height="18" rx="2.5"/><rect class="a" x="7.5" y="5.5" width="9" height="4" rx="1"/><path d="M5 5.5A2.5 2.5 0 0 1 7.5 3h9A2.5 2.5 0 0 1 19 5.5v13a2.5 2.5 0 0 1-2.5 2.5h-9A2.5 2.5 0 0 1 5 18.5zM9 13h.01M12 13h.01M15 13h.01M9 16.5h.01M12 16.5h.01M15 16.5h.01"/>']
  ,
  micro: ["Lab Science", '<rect class="a" x="8.5" y="2.5" width="4" height="9" rx="1" transform="rotate(-25 10.5 7)"/><path d="M6 21h12M9 18h6M15.5 10.5a5 5 0 0 1-3 7.5"/><circle class="b" cx="11.5" cy="13" r="1.6"/>'],
  calc: ["Calculus", '<rect class="b" x="3" y="3" width="18" height="18" rx="5"/><path class="sa" d="M14.5 6c-1.8-.8-3 .4-3.4 2.4l-1.3 7.2c-.4 2-1.6 3.2-3.4 2.4"/><path d="M15 13l3 3M18 13l-3 3"/>'],
  robot: ["Robotics", '<rect class="a" x="5" y="7" width="14" height="11" rx="3"/><circle class="w" cx="9.5" cy="12" r="1.6"/><circle class="w" cx="14.5" cy="12" r="1.6"/><path d="M12 7V4.5M3 11v4M21 11v4"/><circle class="y" cx="12" cy="3.5" r="1.3"/><path class="ws" d="M10 15.5h4"/>'],
  med: ["Medicine", '<rect class="a" x="3" y="3" width="18" height="18" rx="5"/><path class="w" d="M10 6.5h4V10h3.5v4H14v3.5h-4V14H6.5v-4H10z"/>'],
  pharm: ["Pharmacy", '<path class="a" d="M10.5 4.5a4.6 4.6 0 0 1 6.5 6.5l-3.5 3.5L7 8z"/><path class="b" d="M13.5 14.5L10 18a4.6 4.6 0 0 1-6.5-6.5L7 8z"/><path d="M10.5 4.5a4.6 4.6 0 0 1 6.5 6.5L10 18a4.6 4.6 0 0 1-6.5-6.5zM7 8l6.5 6.5"/>'],
  photo: ["Photography", '<path class="a" d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle class="w" cx="12" cy="13" r="4"/><circle class="b" cx="12" cy="13" r="2.2"/><circle class="y" cx="18" cy="10.5" r=".9"/>'],
  film: ["Film", '<rect class="a" x="3" y="9" width="18" height="11" rx="2"/><path class="b" d="M3 9l.8-4.4L20.5 3.8 21 8.2z"/><path d="M3 9h18M7.5 4.2L9 8.6M12.5 3.9L14 8.4M17.5 3.6L19 8.2"/>'],
  design: ["Design", '<path class="a" d="M12 3l6 7-6 11-6-11z"/><circle class="w" cx="12" cy="11" r="1.6"/><path class="ws" d="M12 12.6V20"/>'],
  arch: ["Architecture", '<path class="b" d="M4 21V8l8-5 8 5v13z"/><path d="M4 21V8l8-5 8 5v13M2.5 21h19"/><rect class="a" x="10" y="15" width="4" height="6"/><rect class="y" x="7" y="10" width="2.5" height="2.5" rx=".5"/><rect class="y" x="14.5" y="10" width="2.5" height="2.5" rx=".5"/>'],
  agri: ["Agriculture", '<path d="M12 18v-6"/><path class="g" d="M12 12c0-4-3-6-7-6 0 4 3 6 7 6z"/><path class="a" d="M12 10c0-3.5 2.5-5.5 6.5-5.5 0 3.5-2.5 5.5-6.5 5.5z"/><path class="b" d="M5.5 21h13L17 17.5H7z"/>'],
  geol: ["Geology", '<path class="a" d="M2.5 20L9 9l4 6 2.5-3.5L21.5 20z"/><path class="w" d="M9 9l2 3-1 .8-1-1.3-1 1.3-1-.6z"/><circle class="y" cx="18" cy="6" r="2"/>'],
  marine: ["Marine Science", '<path class="a" d="M3 12c3-5 9-6 13-2l4-3v10l-4-3c-4 4-10 3-13-2z"/><circle class="w" cx="8" cy="11" r="1.2"/><path class="ws" d="M11.5 9.5c.8 1.5.8 3.5 0 5"/>'],
  data: ["Data Science", '<path class="b" d="M5 5.5v13c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-13z"/><path class="a" d="M5 5.5V12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V5.5z"/><ellipse class="y" cx="12" cy="5.5" rx="7" ry="2.5"/><path d="M5 5.5v13c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-13"/>'],
  it: ["Information Tech", '<rect class="a" x="4.5" y="4.5" width="15" height="10.5" rx="1.5"/><rect class="b" x="6.5" y="6.5" width="11" height="6.5" rx=".5"/><path class="b" d="M2 18h20l-1.5 2h-17z"/><path d="M2 18h20"/>'],
  cook: ["Culinary", '<path class="w" d="M7 14a4 4 0 1 1 1.5-7.7A4 4 0 0 1 15.5 6 4 4 0 1 1 17 14z"/><rect class="a" x="7" y="14" width="10" height="5.5" rx="1"/><path d="M7 14a4 4 0 1 1 1.5-7.7A4 4 0 0 1 15.5 6 4 4 0 1 1 17 14"/>'],
  elec: ["Electrical", '<path class="a" d="M13.5 2L4.5 13.5H11L9.5 22l9-12H12z"/><path d="M13.5 2L4.5 13.5H11L9.5 22l9-12H12z"/>'],
  mech: ["Mechanical", '<path class="a" d="M14.5 3.5a5 5 0 0 0-5 6.3l-5.9 5.9a2.1 2.1 0 0 0 3 3l5.9-5.9a5 5 0 0 0 6.3-6.3l-3 3-2.6-.7-.7-2.6z"/><circle class="w" cx="5.2" cy="17.3" r=".9"/>'],
  vet: ["Veterinary", '<ellipse class="a" cx="12" cy="15.5" rx="4.5" ry="4"/><ellipse class="a" cx="6" cy="10" rx="2" ry="2.6"/><ellipse class="a" cx="18" cy="10" rx="2" ry="2.6"/><ellipse class="a" cx="9.3" cy="5.8" rx="1.9" ry="2.4"/><ellipse class="a" cx="14.7" cy="5.8" rx="1.9" ry="2.4"/>'],
  mkt: ["Marketing", '<path class="a" d="M4 10v4a1 1 0 0 0 1 1h2l9 4V5L7 9H5a1 1 0 0 0-1 1z"/><path class="b" d="M7 15l1.5 5H11l-1.3-4.3"/><path class="sa" d="M19 9.5a3.5 3.5 0 0 1 0 5"/>'],
  fin: ["Finance", '<path class="a" d="M5 11a7 6 0 0 1 12.5-2.5H20v3l-1.5.8A6 6 0 0 1 16 16v3h-2.5v-1.6a8 8 0 0 1-3 0V19H8v-3a6 6 0 0 1-3-5z"/><circle class="w" cx="15" cy="10.5" r=".9"/><circle class="y" cx="11" cy="4.5" r="2"/>'],
  note: ["General", '<rect class="a" x="5" y="3" width="14" height="18" rx="2"/><rect class="b" x="8" y="6.5" width="8" height="3.5" rx=".8"/><path d="M5 7H3.5M5 12H3.5M5 17H3.5"/>']
};
// Each icon's drawing measured and centred in a square
const COURSE_ICON_VB = {"bio":"1.6 1.6 20.8 20.8","chem":"1.6 1.6 20.8 20.8","phys":"1.01 1.01 21.99 21.99","math":"1.6 1.6 20.8 20.8","geom":"2.6 2.6 18.8 18.8","stats":"2.1 1.9 19.8 19.8","code":"1.1 1.1 21.8 21.8","eng":"1.4 1.4 21.2 21.2","geo":"1.6 1.6 20.8 20.8","hist":"1.6 1.6 20.8 20.8","pol":"1.6 1.6 20.8 20.8","lang":"2.1 1.1 19.8 19.8","lit":"2.51 2.91 18.99 18.99","write":"1.6 2.1 20.3 20.3","art":"1.6 1.6 20.8 20.8","music":"1.7 1.6 20.6 20.6","drama":"2.6 1.6 18.8 18.8","psych":"1.83 1.83 20.34 20.34","econ":"1.6 0.45 20.8 20.8","biz":"1.6 0.4 20.8 20.8","law":"0.6 0.55 22.8 22.8","nurse":"2.6 -0.6 21.1 21.1","health":"2.07 1.58 19.85 19.85","astro":"-0.36 -1.16 24.72 24.72","env":"3.6 3.6 16.8 16.8","phil":"1.6 1.6 20.8 20.8","soc":"1.6 1.4 21.3 21.3","edu":"2.1 1.6 19.8 19.8","sport":"0.6 0.6 22.8 22.8","acct":"1.6 1.6 20.8 20.8","micro":"1.14 0.68 21.72 21.72","calc":"1.6 1.6 20.8 20.8","robot":"1.6 -0.3 20.8 20.8","med":"1.6 1.6 20.8 20.8","pharm":"0.88 1.88 18.74 18.74","photo":"1.6 2.1 20.8 20.8","film":"1.6 1.4 20.8 20.8","design":"1.6 1.6 20.8 20.8","arch":"1.1 1.1 21.8 21.8","agri":"2.1 3.1 19.3 19.3","geol":"1.1 1.1 21.8 21.8","marine":"1.6 2.1 19.8 19.8","data":"1.6 1.6 20.8 20.8","it":"0.6 0.85 22.8 22.8","cook":"1.58 1.72 20.14 20.14","elec":"0.1 0.6 22.8 22.8","mech":"1.58 1.98 18.87 18.87","vet":"2.55 2 18.9 18.9","mkt":"2.6 2.37 18.85 18.85","fin":"2.85 0.4 19.3 19.3","note":"0.85 1.6 20.8 20.8"};
// Course icons made with AI (Pro)
const CI_TAGS = new Set(["path", "circle", "ellipse", "rect", "line", "polyline", "polygon", "g"]);
const CI_CLS = new Set(["a", "b", "w", "y", "g", "r", "sa", "sb", "ws"]);
const CI_ATTR = {d: /^[MmLlHhVvCcSsQqTtAaZz0-9.,\s-]{1,2000}$/, transform: /^((rotate|translate|scale)\(\s*-?[0-9.]+(\s*[ ,]\s*-?[0-9.]+){0,2}\s*\)\s*){1,3}$/, points: /^[0-9.,\s-]{1,800}$/};
["cx", "cy", "r", "rx", "ry", "x", "y", "width", "height", "x1", "y1", "x2", "y2"].forEach(k => { CI_ATTR[k] = /^-?([0-9]{1,3}(\.[0-9]{1,3})?|\.[0-9]{1,3})$/; });
function ciClean(markup){
  try {
    const doc = new DOMParser().parseFromString(`<svg xmlns="http://www.w3.org/2000/svg">${String(markup || "").slice(0, 6000)}</svg>`, "image/svg+xml");
    if (doc.querySelector("parsererror")) return "";
    let n = 0;
    const walk = el => [...el.children].map(ch => {
      const tag = ch.tagName.toLowerCase(); if (!CI_TAGS.has(tag) || ++n > 40) return "";
      const at = [...ch.attributes].map(a => { const k = a.name.toLowerCase(), v = a.value.trim();
        if (k === "class") { const c = v.split(/\s+/).filter(x => CI_CLS.has(x)); return c.length ? `class="${c.join(" ")}"` : ""; }
        return CI_ATTR[k] && CI_ATTR[k].test(v) ? `${k}="${v}"` : ""; }).filter(Boolean).join(" ");
      return tag === "g" ? `<g${at ? " " + at : ""}>${walk(ch)}</g>` : `<${tag}${at ? " " + at : ""}/>`;
    }).join("");
    return walk(doc.documentElement);
  } catch (e) { return ""; }
}
const customIcons = () => Array.isArray(state.settings && state.settings.customIcons) ? state.settings.customIcons : [];
const customIcon = k => typeof k === "string" && k.startsWith("x:") ? customIcons().find(x => "x:" + x.id === k) || null : null;
const CI_CACHE = new Map();
const customIconSvg = (k, cls) => { const ic = customIcon(k); if (!ic) return ""; const key = k + "|" + ic.svg; if (!CI_CACHE.has(key)) CI_CACHE.set(key, ciClean(ic.svg)); const vb = /^-?[0-9.]+ -?[0-9.]+ [0-9.]+ [0-9.]+$/.test(ic.vb || "") ? ic.vb : "0 0 24 24"; return `<svg class="${cls || "ci-svg"}" viewBox="${vb}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${CI_CACHE.get(key)}</svg>`; };
// Make a course icon with AI
let ciPending = null;
function ciMeasure(markup){
  try {
    const ns = "http://www.w3.org/2000/svg", sv = document.createElementNS(ns, "svg"); sv.setAttribute("viewBox", "0 0 24 24"); sv.setAttribute("style", "position:fixed;left:-9999px;top:0;width:240px;height:240px"); sv.setAttribute("stroke-width", "2");
    sv.innerHTML = markup; document.body.appendChild(sv); const b = sv.getBBox(); sv.remove();
    if (!(b.width > 0 && b.height > 0)) return "0 0 24 24";
    const side = Math.max(b.width, b.height) + 3.2, cx = b.x + b.width / 2, cy = b.y + b.height / 2, r = v => Math.round(v * 100) / 100;
    return `${r(cx - side / 2)} ${r(cy - side / 2)} ${r(side)} ${r(side)}`;
  } catch (e) { return "0 0 24 24"; }
}
// AI course icons
let ciCands = [];
const CI_STYLE = `Style rules (follow exactly):
- A 24 by 24 viewBox. Use only path, circle, ellipse, rect, line, polyline, polygon and g. No text, gradients, style attributes, ids or colours: every shape gets a 2-unit dark outline automatically.
- Fill areas only with these classes: "a" (the course colour, for the main mass), "b" (a light tint of it, for secondary parts), "w" (white highlights), "y" (warm yellow), "g" (leaf green), "r" (red). "sa" and "sb" are thick strokes in the course colour or its tint; "ws" a white detail stroke. A shape without a class is an outline only.
- Draw back to front: big filled shapes first, small accents and detail lines last.`;
const CI_CRAFT = `How to make it look good:
- Pick the one object or symbol people instantly recognise for the subject, seen from its most recognisable side (front or side on, not at an angle). Get its real proportions right.
- Build it from 3 to 9 bold, simple shapes: one big main mass in "a", a secondary part in "b", and one or two small accents (a "w" shine, a "y" or "r" detail). Leave out anything smaller than about 2 units.
- Use smooth, deliberate geometry: real circles, rounded rects (rx 1 to 3), symmetrical shapes mirrored exactly about x=12 when the object is symmetrical, and clean cubic curves. No wobbly or jagged paths, no stray points, no shapes poking out at odd angles.
- Centre it and fill the space: the drawing should span about 18 to 20 units in its longer direction, within 2 to 22 on both axes.
- Keep lines at least 1.5 units apart so it reads at 32 pixels. Fewer, larger parts beat many small ones.`;
// Icons from Lucide (ISC licence, lucide.dev): ~1,800 professionally drawn 24x24 icons in the same rounded-stroke style as these.
// The library loads from the jsDelivr CDN only when you make an icon
const LU_BASE = "https://cdn.jsdelivr.net/npm/lucide-static@1.49.0/";
// Lucide's licence (and Feather's, for the icons Lucide took from it), shown in full under Settings, About, Credits and licenses
const LU_LICENSE = "ISC License\n\nCopyright (c) 2026 Lucide Icons and Contributors\n\nPermission to use, copy, modify, and/or distribute this software for any\npurpose with or without fee is hereby granted, provided that the above\ncopyright notice and this permission notice appear in all copies.\n\nTHE SOFTWARE IS PROVIDED \"AS IS\" AND THE AUTHOR DISCLAIMS ALL WARRANTIES\nWITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF\nMERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR\nANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES\nWHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN\nACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF\nOR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.\n\nSome Lucide icons are derived from the Feather project:\nairplay, alert-circle, alert-octagon, alert-triangle, aperture, arrow-down-circle, arrow-down-left, arrow-down-right, arrow-down, arrow-left-circle, arrow-left, arrow-right-circle, arrow-right, arrow-up-circle, arrow-up-left, arrow-up-right, arrow-up, at-sign, calendar, cast, check, chevron-down, chevron-left, chevron-right, chevron-up, chevrons-down, chevrons-left, chevrons-right, chevrons-up, circle, clipboard, clock, code, columns, command, compass, corner-down-left, corner-down-right, corner-left-down, corner-left-up, corner-right-down, corner-right-up, corner-up-left, corner-up-right, crosshair, database, divide-circle, divide-square, dollar-sign, download, external-link, feather, frown, hash, headphones, help-circle, info, italic, key, layout, life-buoy, link-2, link, loader, lock, log-in, log-out, maximize, meh, minimize, minimize-2, minus-circle, minus-square, minus, monitor, moon, more-horizontal, more-vertical, move, music, navigation-2, navigation, octagon, pause-circle, percent, plus-circle, plus-square, plus, power, radio, rss, search, server, share, shopping-bag, sidebar, smartphone, smile, square, table-2, tablet, target, terminal, trash-2, trash, triangle, tv, type, upload, x-circle, x-octagon, x-square, x, zoom-in, zoom-out\n\nThe MIT License (MIT) (for the Lucide icons derived from Feather)\n\nCopyright (c) 2013-present Cole Bemis\n\nPermission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the \"Software\"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:\n\nThe above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.\n\nTHE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.";
let luLib = null;
async function luLoad(){
  if (luLib) return luLib;
  const get = async f => { const r = await fetch(LU_BASE + f, {credentials: "omit", referrerPolicy: "no-referrer"}); if (!r.ok) throw new Error("lucide " + r.status); return r.json(); };
  const [tags, nodes] = await Promise.all([get("tags.json"), get("icon-nodes.json")]);
  if (!tags || !nodes || typeof nodes !== "object") throw new Error("lucide data");
  luLib = {tags, nodes};
  return luLib;
}
const LU_STOP = new Set(["a", "an", "the", "and", "or", "with", "of", "for", "in", "on", "to", "icon", "my", "some", "its", "their"]);
const luWords = t => String(t || "").toLowerCase().replace(/[^a-z0-9\s-]/g, " ").split(/[\s-]+/).filter(w => w && !LU_STOP.has(w));
const luStem = w => w.replace(/(ies)$/, "y").replace(/(es|s)$/, "");
// Icons scored against search words
function luSearch(lib, words, max){
  const ws = [...new Set(words.map(luStem).filter(w => w.length > 1))]; if (!ws.length) return [];
  const out = [];
  for (const name of Object.keys(lib.nodes)) {
    const nw = name.split("-").map(luStem), tw = (lib.tags[name] || []).flatMap(t => luWords(t)).map(luStem);
    let sc = 0;
    ws.forEach(w => { if (nw.includes(w)) sc += 4; else if (nw.some(x => x.startsWith(w) && w.length > 3)) sc += 2; if (tw.includes(w)) sc += 2; else if (tw.some(x => x.startsWith(w) && w.length > 3)) sc += 1; });
    if (sc) out.push({name, sc});
  }
  return out.sort((a, b) => b.sc - a.sc || a.name.length - b.name.length).slice(0, max);
}
// A Lucide icon's shapes as this app's markup
function luMarkup(lib, name){
  const nodes = lib.nodes[name]; if (!Array.isArray(nodes)) return "";
  const esc2 = v => String(v).replace(/[^-0-9a-zA-Z.,\s]/g, "");
  const raw = nodes.map(([tag, at]) => `<${tag} ${Object.keys(at).map(k => `${k}="${esc2(at[k])}"`).join(" ")}/>`);
  let info = raw.map(() => ({area: 0, closed: false}));
  try {
    const sv = document.createElementNS("http://www.w3.org/2000/svg", "svg"); sv.setAttribute("viewBox", "0 0 24 24"); sv.style.cssText = "position:absolute;left:-9999px;width:24px;height:24px";
    sv.innerHTML = ciClean(raw.join("")); document.body.appendChild(sv);
    info = [...sv.children].map(el => { const b = el.getBBox(), tag = el.tagName.toLowerCase(); let closed = tag === "circle" || tag === "ellipse" || tag === "rect" || tag === "polygon";
      if (tag === "path") { try { const L = el.getTotalLength(), a = el.getPointAtLength(0), z = el.getPointAtLength(L); closed = /z/i.test(el.getAttribute("d") || "") || Math.hypot(a.x - z.x, a.y - z.y) <= 4.5; } catch (e) {} }
      return {area: b.width * b.height, box: b, closed: closed && b.width > 1.5 && b.height > 1.5}; });
    sv.remove();
  } catch (e) {}
  const big = Math.max(0, ...info.filter(x => x.closed).map(x => x.area));
  const inside = (x, k, m) => info.some((y, j) => j !== k && y.closed && y.area >= big * 0.3 && x.box && y.box && x.box.x >= y.box.x + m && x.box.y >= y.box.y + m && x.box.x + x.box.width <= y.box.x + y.box.width - m && x.box.y + x.box.height <= y.box.y + y.box.height - m);
  return raw.map((m, k) => { const x = info[k] || {}; const cls = x.closed && big ? (x.area >= big * 0.3 ? "a" : inside(x, k, 0) ? "w" : "b") : big && inside(x, k, 1) ? "ws" : "";
    return cls ? m.replace(/^<(\w+) /, `<$1 class="${cls}" `) : m; }).join("");
}
const luTitle = name => name.split("-").map(w => w ? w[0].toUpperCase() + w.slice(1) : "").join(" ");
async function ciFromLibrary(q, say){
  say("Finding icons…");
  const lib = await luLoad();
  let found = luSearch(lib, luWords(q), 40);
  if (found.filter(f => f.sc >= 4).length < 4) {
    const r = await aiCall({task: "rewrite", fast: true, maxTokens: 300, temperature: 0.2, schema: {type: "OBJECT", properties: {words: {type: "ARRAY", items: {type: "STRING"}}}, required: ["words"]},
      system: "You help find icons in an icon library. Give up to 10 single, common English words to search for: the object itself, synonyms, and the everyday symbol people would draw for it (for 'nursing': heart, stethoscope, syringe, cross, hospital). Lowercase nouns only.",
      parts: [{text: `Icon wanted: ${q}`}]});
    const extra = ((r && r.data && r.data.words) || []).slice(0, 12);
    found = luSearch(lib, luWords(q).concat(extra.flatMap(luWords)), 40);
  }
  if (!found.length) return [];
  say("Choosing the best ones…");
  const list = found.map(f => `${f.name}: ${(lib.tags[f.name] || []).slice(0, 8).join(", ")}`).join("\n");
  const r2 = await aiCall({task: "rewrite", fast: true, maxTokens: 400, temperature: 0.2,
    schema: {type: "OBJECT", properties: {picks: {type: "ARRAY", items: {type: "OBJECT", properties: {icon: {type: "STRING"}, badge: {type: "STRING", description: "optional second icon shown small in the corner, or empty"}, name: {type: "STRING"}}, required: ["icon", "name"]}}}, required: ["picks"]},
    system: "You pick icons for a student's course from a list. Choose the 3 that best show what they asked for, the most recognisable first, each different. Use only icon names from the list. Add a badge (a second list icon shown small in the corner) only when the request clearly has two things, like 'a stethoscope with a heart'. name: two or three words for the icon.",
    parts: [{text: `Wanted: ${q}\nIcons:\n${list}`}]});
  const picks = ((r2 && r2.data && r2.data.picks) || []).filter(p => p && lib.nodes[p.icon]).slice(0, 3);
  (picks.length ? [] : found.slice(0, 3).map(f => ({icon: f.name}))).forEach(p => picks.push(p));
  return picks.map(p => {
    let svg = luMarkup(lib, p.icon);
    if (p.badge && p.badge !== p.icon && lib.nodes[p.badge]) svg += `<circle class="w" cx="18.5" cy="18.5" r="6"/><g transform="translate(13.5 13.5) scale(0.42)">${luMarkup(lib, p.badge)}</g>`;
    svg = ciClean(svg);
    return svg ? {id: uid(), name: String(p.name || luTitle(p.icon)).slice(0, 40), svg, vb: ciMeasure(svg), src: "lucide:" + p.icon + (p.badge && lib.nodes[p.badge] ? "+" + p.badge : "")} : null;
  }).filter(Boolean);
}
async function ciDraw(q, col, say){
  try { const lib = await ciFromLibrary(q, say); if (lib.length) return lib; } catch (e) { console.warn("icon library", e); }
  return ciDrawFree(q, col, say);
}
async function ciDrawFree(q, col, say){
  const EX = ["chem", "health", "music", "arch", "photo", "law", "marine", "robot"].filter(k => COURSE_ICONS[k]).map(k => `${COURSE_ICONS[k][0]}: ${COURSE_ICONS[k][1]}`).join("\n");
  const one = {type: "OBJECT", properties: {idea: {type: "STRING", description: "The plan first: the object, the view, and each shape with its class and rough position"}, name: {type: "STRING", description: "Two or three words naming the icon"}, svg: {type: "STRING", description: "SVG child elements only, no <svg> wrapper"}}, required: ["idea", "name", "svg"]};
  const many = {type: "OBJECT", properties: {icons: {type: "ARRAY", items: one}}, required: ["icons"]};
  const sys = `You are a professional icon designer drawing small, friendly course icons as SVG, in exactly the style of these examples:\n${EX}\n\n${CI_STYLE}\n\n${CI_CRAFT}`;
  const keep = arr => (Array.isArray(arr) ? arr : []).map(d => { const svg = ciClean(d && d.svg); return svg ? {id: uid(), name: String((d && d.name) || q).slice(0, 40), svg, vb: ciMeasure(svg)} : null; }).filter(Boolean).slice(0, 3);
  say("Sketching three ideas…");
  const r = await aiCall({task: "rewrite", maxTokens: 9000, temperature: 0.8, schema: many, system: sys,
    parts: [{text: `Draw three different icons of: ${q}\nMake each a different take (a different object, view or composition), and plan each one in "idea" before you draw it.`}]});
  let cands = keep(r && r.data && r.data.icons);
  if (!cands.length) return [];
  try {
    say("Polishing them…");
    const pics = await Promise.all(cands.map(c => ciPng(c, col)));
    if (pics.every(Boolean)) {
      const parts = [{text: `The request was: ${q}\nHere are your three drafts, rendered at 96 pixels in a course colour, each followed by its SVG.`}];
      cands.forEach((c, k) => { parts.push({text: `Draft ${k + 1}, "${c.name}":`}, {inline_data: {mime_type: "image/png", data: pics[k]}}, {text: c.svg}); });
      parts.push({text: "Look hard at each rendering. Is the subject instantly recognisable? Are the proportions right, the shapes clean and symmetrical where they should be, the drawing centred and filling the space, with nothing cluttered, tiny, stray or overlapping badly? Then redraw each one fixing every problem you saw (keep its idea, or replace it if it doesn't work). Return all three, in the same order."});
      const r2 = await aiCall({task: "rewrite", maxTokens: 9000, temperature: 0.3, schema: many, system: sys, parts});
      const better = keep(r2 && r2.data && r2.data.icons);
      if (better.length) cands = better;
    }
  } catch (e) { console.warn("icon polish", e); }
  return cands;
}
// One icon as a PNG (base64), drawn as it appears in the app
function ciPng(c, col){
  return new Promise(res => {
    try {
      const ink = "#2B2233", tint = "color-mix(in srgb," + col + " 30%,#fff)";
      const css = `*{stroke:${ink};stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round;fill:none}.a{fill:${col}}.b{fill:${tint}}.w{fill:#fff;stroke:none}.y{fill:#FFC93C}.g{fill:#3DBE6A}.r{fill:#F25C54}.sa{stroke:${col};stroke-width:3}.sb{stroke:${tint};stroke-width:3}.ws{stroke:#fff;stroke-width:1.8}`;
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="${c.vb}"><style>${css}</style>${c.svg}</svg>`;
      const img = new Image();
      img.onload = () => { try { const cv = document.createElement("canvas"); cv.width = cv.height = 96; const x = cv.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, 96, 96); x.drawImage(img, 0, 0, 96, 96); res(cv.toDataURL("image/png").split(",")[1] || ""); } catch (e) { res(""); } };
      img.onerror = () => res("");
      img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
    } catch (e) { res(""); }
  });
}
hook("act", (act, el) => {
  if (act === "course-deck") { ui.tab = "flashcards"; rvSet("cards"); ui.fc = null; ui.deckId = el.dataset.id; ui.courseId = null; render(); window.scrollTo(0, 0); return true; }
  if (act === "course-deck-new") { const f = ui.filter; ui.filter = el.dataset.id; try { deckSheet(null); } finally { ui.filter = f; } return true; }
  if (act === "course-note" || act === "course-notes") {
    const n = act === "course-note" && state.notes[el.dataset.id], cid = n ? n.courseId : el.dataset.id;
    const b = n ? noteBoardOf(n) : (noteBoards().find(x => x.courseId === cid) || {}).id || "";
    if (window.SBWB && SBWB.on()) SBWB.setView("board");
    ui.tab = "notes"; ui.courseId = null; ui.noteBoard = b; try { localStorage.setItem(NB_KEY, b); } catch (e) {}
    if (n) noteEditing = n.id;
    render(); window.scrollTo(0, 0);
    return true;
  }
  if (act === "cd-old") { ui.cdOld = ui.cdOld === ui.courseId ? null : ui.courseId; render(); return true; }
  if (act === "ci-ai") {
    if (typeof PLAN !== "undefined" && PLAN && PLAN.paywall() && !PLAN.isPro()) { toast("Making your own icons with AI is part of Studyboard Pro", null, {label: "See Pro", fn: () => PLAN.openSheet("ai-icons")}); return true; }
    if (!aiReady()) { toast("Set up AI to make your own icons", null, {label: "Set Up AI", fn: () => aiSetupSheet(true)}); return true; }
    const box = $("#ciAi"); if (box) { box.hidden = !box.hidden; if (!box.hidden) { const q = $("#ciAiQ"); if (q) q.focus(); } }
    return true;
  }
  if (act === "ci-ai-go") {
    const q = String(($("#ciAiQ") || {}).value || "").trim(), out = $("#ciAiPrev"), use = $("#ciAiUse");
    if (!q) { toast("Describe the icon first"); return true; }
    ciPending = null; ciCands = []; if (use) use.hidden = true;
    const say = t => { if (out) out.innerHTML = `<span class="ai-spin" aria-hidden="true"></span> ${esc(t)}`; };
    const col = (getComputedStyle($("#ciGrid") || document.body).getPropertyValue("--c") || "").trim() || "#3B6FE0";
    ciDraw(q, col, say).then(cands => {
      if (!cands.length) { if (out) out.textContent = "That didn't come out right. Try again, or describe it a little differently."; return; }
      ciCands = cands; ciPending = cands[0];
      if (out) out.innerHTML = cands.map((c, k) => `<button type="button" class="ci-cand${k ? "" : " on"}" data-act="ci-ai-pick" data-id="${k}" aria-pressed="${!k}" title="${esc(c.name)}"><span class="g2-ring ci-ai-ring" style="--c:${esc(col)}"><svg class="ci-svg" viewBox="${c.vb}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${c.svg}</svg></span><span>${esc(c.name)}</span></button>`).join("") + (cands.some(c => c.src) ? `<span class="mini ci-src">From the <a href="https://lucide.dev" target="_blank" rel="noopener noreferrer">Lucide</a> icon set (ISC License; see Settings, About)</span>` : "");
      if (use) use.hidden = false;
    }).catch(e => { if (out) out.textContent = "Couldn't reach the AI. Check your connection and try again."; console.warn(e); });
    return true;
  }
  if (act === "ci-ai-pick") {
    const k = Number(el.dataset.id); if (!ciCands[k]) return true;
    ciPending = ciCands[k];
    document.querySelectorAll("#ciAiPrev .ci-cand").forEach((b, n) => { b.classList.toggle("on", n === k); b.setAttribute("aria-pressed", String(n === k)); });
    return true;
  }
  if (act === "ci-ai-use") {
    if (!ciPending) return true;
    const ic = ciPending; ciPending = null;
    state.settings = Object.assign({}, state.settings, {customIcons: [ic].concat(customIcons()).slice(0, 40)}); saveSettings();
    const g = $("#ciGrid"), btn = g && g.querySelector(".ci-ai-btn");
    if (g && btn) { btn.insertAdjacentHTML("beforebegin", `<label title="${esc(ic.name)} (made with AI)"><input type="radio" name="icon" value="x:${esc(ic.id)}" checked aria-label="${esc(ic.name)}"><span>${courseIconSvg("x:" + ic.id)}</span></label>`); g.dataset.picked = "1"; }
    const box = $("#ciAi"); if (box) box.hidden = true; const out = $("#ciAiPrev"); if (out) out.innerHTML = ""; const use = $("#ciAiUse"); if (use) use.hidden = true;
    toast(`${ic.name} added to your icons`);
    return true;
  }
  return false;
});
const courseIconSvg = (k, cls) => customIcon(k) ? customIconSvg(k, cls) : COURSE_ICONS[k] ? `<svg class="${cls || "ci-svg"}" viewBox="${COURSE_ICON_VB[k] || "0 0 24 24"}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${COURSE_ICONS[k][1]}</svg>` : "";
// What a course's ring holds
const COURSE_ICON_GUESS = [[/physical ed|phys ed|kinesi|sport|fitness|athlet/, "sport"], [/biochem|bio|genetic|cell|microbio|zoolog|botan/, "bio"], [/pharm/, "pharm"], [/chem/, "chem"], [/astro|space/, "astro"], [/phys/, "phys"],
  [/calc/, "calc"], [/stat/, "stats"], [/geom|trig/, "geom"], [/math|algebra|mat\b/, "math"], [/robot/, "robot"], [/data/, "data"], [/comput|\bcs\b|\bcsc|program|software|coding|cpsc|\bcomp\s?sci/, "code"], [/information tech|\bit\b|network|cyber|\bist\b/, "it"],
  [/electr/, "elec"], [/mechan/, "mech"], [/architect|\barch\b/, "arch"], [/engin|\beng\b|\bengr/, "eng"], [/geolog|earth sci/, "geol"], [/marine|ocean/, "marine"], [/geog|\bgis\b/, "geo"], [/hist/, "hist"], [/polit|govern|\bpols?\b|\bpoli/, "pol"],
  [/spanish|french|german|japanese|chinese|korean|italian|arabic|latin|language|\blang|linguist/, "lang"], [/journal|writ|rhetoric|composition/, "write"], [/litera|english|\bengl|poetry|novel/, "lit"], [/photo/, "photo"], [/film|cinema|media/, "film"],
  [/design|graphic|\bux\b/, "design"], [/\bart|draw|paint|sculpt/, "art"], [/music|\bmus\b|choir|band/, "music"], [/drama|theat|\bthtr|acting/, "drama"], [/psych|\bpsy/, "psych"], [/econ/, "econ"], [/market|advertis|public relations/, "mkt"],
  [/financ|\bfin\b|bank|invest/, "fin"], [/account|\bacct|\bacc\b/, "acct"], [/busi|\bbus\b|manag|\bmgmt|entrepren/, "biz"], [/\blaw|legal|\bjuris/, "law"], [/nurs|\bnrs|\bbsn/, "nurse"], [/medic|\bmed\b|anatom|physiol|surg/, "med"],
  [/vet|animal/, "vet"], [/health|nutri|wellness|public health/, "health"], [/agri|horti|crop|farm/, "agri"], [/enviro|ecolog|sustain|climate/, "env"], [/philos|\bphil\b|ethic|logic/, "phil"], [/sociol|\bsoc\b|anthrop|social/, "soc"],
  [/educ|teach|pedagog/, "edu"], [/culin|cook|food|baking/, "cook"], [/lab\b|laboratory|science|\bsci\b/, "micro"]];
const courseIconKey = c => { if (!c) return "note"; if (COURSE_ICONS[c.icon] || customIcon(c.icon)) return c.icon; const t = (String(c.name || "") + " " + String(c.code || "")).toLowerCase(); const hit = COURSE_ICON_GUESS.find(x => x[0].test(t)); return hit ? hit[1] : "note"; };
const courseRingHtml = c => courseIconSvg(courseIconKey(c));
// Work with no course ("General") always wears this one; it isn't offered for courses
const GENERAL_ICON = `<svg class="ci-svg" viewBox="2.4 2.4 19.2 19.2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect class="b" x="7" y="4" width="13" height="10" rx="2" transform="rotate(8 13.5 9)"/><rect class="a" x="4" y="9" width="13" height="10" rx="2"/><path class="ws" d="M7.5 13h6M7.5 15.8h4"/></svg>`;
// A course's initials for its ring
function courseInitials(c){
  const m = String(c.code || "").match(/[A-Za-z]{2,5}/);
  if (m) return m[0].toUpperCase().slice(0, 4);
  return String(c.name || "?").split(/\s+/).filter(w => /^[A-Za-z]/.test(w)).slice(0, 2).map(w => w[0]).join("").toUpperCase() || "?";
}
// One pill for a course card
function courseStatusPill(open, today){
  const dated = open.filter(t => t.due), late = dated.filter(t => t.due < today).length;
  if (late) return `<span class="g2-pill late">${late} late</span>`;
  const next = dated.filter(t => t.due >= today).sort((a, b) => a.due.localeCompare(b.due))[0];
  if (!next) return "";
  const n = dayDiff(today, next.due);
  if (n > 6) return "";
  return `<span class="g2-pill${n <= 1 ? " due" : ""}">${n === 0 ? "Due today" : n === 1 ? "Due tomorrow" : "Due " + esc(parse(next.due).toLocaleDateString(undefined, {weekday: "short"}))}</span>`;
}
function courseMoreSheet(c){
  openSheet(`<div class="sheet">${head(courseLabel(c))}
    <div class="sheet-body"><div class="menu-list">
      <button data-act="import-syllabus" data-course="${esc(c.id)}"><span>Import Syllabus<span class="sub">Upload a PDF to add this course's deadlines</span></span></button>
      <button data-act="bd-new-course" data-course="${esc(c.id)}"><span>Break Down an Assignment<span class="sub">Paste a prompt or rubric and get milestones scheduled backward from the due date</span></span></button>
      <button data-act="edit-course" data-id="${esc(c.id)}"><span>Edit Course<span class="sub">Name, color, schedule, instructor and links</span></span></button>
    </div></div>
    <div class="sheet-foot"><span class="spacer"></span><button type="button" class="btn" data-act="close">Cancel</button></div></div>`);
}
// Every task of a course this term, including finished work the Board has tucked away
const courseTasks = c => allTasks().filter(t => t.courseId === c.id && !t.archivedTerm);
function viewCourseDetail(c){
  const ts = tasksArr().filter(t => t.courseId === c.id && matchesQ(t));
  const exams = new Set(window.SBPREP && SBPREP.courseExams ? SBPREP.courseExams(c).map(t => t.id) : []);
  const by = k => ts.filter(t => t.status === k && !exams.has(t.id)).sort(sortTasks);
  const old = courseTasks(c).filter(t => autoArchived(t) && matchesQ(t)).sort(sortTasks), showOld = ui.cdOld === c.id;
  const doneL = by("done").concat(showOld ? old : []), kick = [c.code, courseTimesText(c), c.room].filter(Boolean).join(" · ");
  const lmsL = lmsCourseLink(c), isLms = l => lmsL && ((l.url && l.url === lmsL.url) || String(l.label || "").trim().toLowerCase() === String(lmsL.name || "").toLowerCase());
  const links = (c.links || []).filter(l => !isLms(l)).map(l => { const u = safeUrl(l.url); return u ? `<dt>${esc(l.label || "Link")}</dt><dd><a href="${esc(u)}" target="_blank" rel="noopener noreferrer">${esc(u.replace(/^https?:\/\//, "").replace(/\/$/, ""))}</a></dd>` : ""; }).join("");
  return `<button class="back" data-act="back"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg>All Courses</button>
    <div class="detail-head c2-head" style="--c:${esc(c.color)}">
      <div class="g2-band"><span class="g2-kick">${esc(kick || "Course")}</span>
        <div class="row-actions">${(l => l ? `<button class="btn small" data-act="lms-go" data-url="${esc(l.url)}">Open in ${esc(l.name)}</button>` : "")(lmsCourseLink(c))}${inPreview() ? "" : `<button class="btn small ai-btn" data-act="ask-course" data-sx-ask="1" data-id="${esc(c.id)}">${AI_ICON} Ask About This Course</button>`}${window.SBLEC ? SBLEC.btn(c) : ""}<button class="btn small" data-act="import-syllabus" data-course="${esc(c.id)}">Import Syllabus</button><button class="btn small" data-act="edit-course" data-id="${esc(c.id)}">Edit Course</button></div></div>
      <div class="g2-low"><span class="g2-ring" aria-hidden="true">${courseRingHtml(c)}</span>
        <div class="g2-txt"><h2>${esc(c.name)}</h2><div class="g2-meta"><span>${esc(courseMetaLine(c))}</span></div></div></div>
      <!--cd-tabs--></div><!--cd-body-->
    <div class="c2-cols" style="--c:${esc(c.color)}"><div class="c2-main">
    ${c.notes ? `<h2 class="sec"><span class="t">Notes</span></h2><p class="notes">${esc(c.notes)}</p>` : ""}
    ${searchNote()}
    ${window.SBPREP ? SBPREP.courseHtml(c) : ""}
    ${section("To Do", by("todo"), "", {hideCourse:true})}
    ${section("In Progress", by("doing"), "", {hideCourse:true})}
    ${doneL.length || old.length ? `<h2 class="sec"><span class="t">Complete</span><span class="n">${by("done").length + old.length}</span></h2>${doneL.length ? taskList(doneL, {hideCourse:true}) : ""}${old.length ? `<button class="show-old" data-act="cd-old" aria-expanded="${showOld}">${showOld ? "Hide Older" : `Show Older (${old.length})`}</button>` : ""}` : ""}
    ${!ts.length && !old.length ? `<div class="empty" style="margin-top:18px"><strong>No Tasks Yet</strong>Add assignments, exams and readings for this course.</div>` : ""}
    ${window.SBOBJ ? SBOBJ.courseHtml(c) : ""}
    ${window.SBSHARE ? SBSHARE.courseHtml(c) : ""}
    </div><aside class="c2-side">
    ${courseGradeSide(c)}
    ${courseTeamHtml(c, "")}
    ${courseFilesHtml(c)}
    ${courseDecksHtml(c)}
    ${courseNotesHtml(c)}
    ${links ? `<h2 class="sec"><span class="t">Links</span></h2><dl class="facts">${links}</dl>` : ""}
    </aside></div>`;
}
// Teaching Team on a course page
function courseTeamHtml(c, staff){
  const rows = staff || (c.instructor ? `<li><div class="bs-main"><b>${esc(c.instructor)}</b><span class="mini">Instructor</span></div></li>` : "");
  if (!rows && !c.office) return "<!--team--><!--/team-->";
  return `<!--team--><h2 class="sec"><span class="t">Teaching Team</span></h2><div class="bs-course">${rows ? `<ul class="bs-list lms-staff">${rows}</ul>` : ""}${c.office ? `<p class="mini c-office"><b>Office Hours</b> ${esc(c.office)}</p>` : ""}</div><!--/team-->`;
}
// The line under a course's name on its page
function courseMetaLine(c){
  const all = courseTasks(c), done = all.filter(t => t.status === "done").length, today = todayISO();
  const ex = all.filter(t => t.status !== "done" && MILESTONE(t.type) && t.due && t.due >= today).length, gn = window.SBGRADES && SBGRADES.now(c);
  return [all.length ? `${done} of ${all.length} done` : "No tasks yet", ex ? `${ex} exam${ex === 1 ? "" : "s"} coming` : "", gn && gn.pct != null ? `${gn.fmt(gn.pct)}${gn.letter ? " " + gn.letter : ""} so far` : ""].filter(Boolean).join(" · ");
}
// The side card on a course's page
function courseGradeSide(c){
  const gn = window.SBGRADES && SBGRADES.now(c); if (!gn) return "";
  return `<section class="c2-card2"><h2 class="sec"><span class="t">Grade So Far</span><span class="n">${esc(gn.fmt(gn.marked))} marked</span></h2>
    ${gn.pct != null ? `<div class="c2-big">${esc(gn.fmt(gn.pct))}${gn.letter ? `<span class="c2-letter">${esc(gn.letter)}</span>` : ""}</div><div class="prog"><span class="track"><i style="width:${Math.min(100, gn.marked).toFixed(0)}%"></i></span></div>` : ""}
    <p class="mini" style="margin:6px 0 10px">${esc(gn.line)}</p><button class="btn small" data-act="course-tab" data-id="grades">See Grades</button></section>`;
}
// The student's own decks and notes for a course
function courseDecksHtml(c){
  const ds = deckListArr().filter(d => d.courseId === c.id);
  const row = d => { const st = deckStats(d), n = studyCounts([d.id]);
    return `<li><button class="c2-li-main" data-act="course-deck" data-id="${esc(d.id)}"><b>${esc(d.name)}</b><span class="mini${st.due ? " c2-due" : ""}">${st.total ? (st.due || st.fresh ? `${st.due} due · ${st.fresh} new` : "All caught up") : "No cards yet"}</span></button>${st.total ? `<button class="btn small${n.due ? " primary" : ""}" data-act="fc-study" data-id="${esc(d.id)}" aria-label="Study ${esc(d.name)}">Study</button>` : ""}</li>`; };
  return `<h2 class="sec"><span class="t">Your Decks</span><span class="n">${ds.length || ""}</span></h2>
    ${ds.length ? `<ul class="c2-list">${ds.map(row).join("")}</ul>` : `<div class="facts c2-none"><span class="mini">No flashcard decks for this course yet.</span><button class="btn small" data-act="course-deck-new" data-id="${esc(c.id)}">New Deck</button></div>`}`;
}
function courseNotesHtml(c){
  const ns = notesArr().filter(n => !n.archived && n.courseId === c.id).sort((a, b) => (b.updated || b.created || 0) - (a.updated || a.created || 0));
  const title = n => (String(n.text || "").split("\n").map(x => x.trim()).find(Boolean) || "Empty note").slice(0, 80);
  const shown = ns.slice(0, 5);
  return `<h2 class="sec"><span class="t">Notes</span><span class="n">${ns.length || ""}</span></h2>
    ${ns.length ? `<ul class="c2-list">${shown.map(n => `<li><button class="c2-li-main" data-act="course-note" data-id="${esc(n.id)}" style="--nc:${noteColor(n.color)}"><b><span class="c2-nc" aria-hidden="true"></span>${esc(title(n))}</b></button></li>`).join("")}</ul>${ns.length > shown.length ? `<button class="link-btn c2-more" data-act="course-notes" data-id="${esc(c.id)}">See All ${ns.length} Notes</button>` : ""}`
      : `<div class="facts c2-none"><span class="mini">No notes for this course yet.</span><button class="btn small" data-act="course-notes" data-id="${esc(c.id)}">Open Notes</button></div>`}`;
}
function courseFilesHtml(c){
  const fs = Object.values(state.files).filter(f => f.courseId === c.id && f.folderId !== "lectures");
  const byF = foldersOf(c.id).map(fo => [fo, fs.filter(f => f.folderId === fo.id).length]).filter(x => x[1]);
  return `<h2 class="sec"><span class="t">Files</span><span class="n">${fs.length || ""}</span></h2>
    <div class="facts" style="display:flex;flex-wrap:wrap;gap:8px;align-items:center">${byF.map(([fo, n]) => `<button class="chip" data-act="f-go" data-c="${esc(c.id)}" data-f="${esc(fo.id)}">${FOLDER}${esc(fo.name)} <span class="mini">${n}</span></button>`).join("") || `<span class="mini" style="flex:1">No files yet. Keep the syllabus, assignment sheets and notes for this course here.</span>`}
    <button class="btn small" data-act="f-go" data-c="${esc(c.id)}" data-f="">Open Files</button></div>`;
}


/* Archive */
const ARCHIVE_SM = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="5" rx="1.5"/><path d="M5 9v9.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V9M10 13h4"/></svg>';
function archRow(t){
  const c = courseOf(t.courseId), lab = statusLabels(t.type)[t.status] || STATUS_LABEL[t.status];
  const meta = [c ? courseLabel(c) : "", t.type, t.due ? "Due " + fmtShort(t.due) : "", t.status === "done" ? "Finished " + new Date(doneTime(t)).toLocaleDateString(undefined, {month: "short", day: "numeric", year: "numeric"}) : ""].filter(Boolean);
  return `<li class="arch-row" style="--c:${esc(colorOf(t.courseId))}">
    <span class="arch-st st-${esc(t.status)}">${esc(lab)}</span>
    <button class="arch-main" data-act="edit-task" data-id="${esc(t.id)}"><span class="arch-t">${esc(t.title)}</span><span class="mini">${esc(meta.join(" · "))}</span></button>
    <span class="arch-acts"><span class="mini">Move to</span><button class="btn small" data-act="arch-restore" data-id="${esc(t.id)}" data-status="todo">To Do</button><button class="btn small" data-act="arch-restore" data-id="${esc(t.id)}" data-status="doing">In Progress</button></span></li>`;
}
function viewArchive(){
  const q = t => matchesQ(t) && inFilter(t);
  const done = allTasks().filter(t => autoArchived(t) && !t.archivedTerm && q(t)).sort((a, b) => doneTime(b) - doneTime(a));
  const terms = {};
  const termOf = name => terms[name] = terms[name] || {name, at: 0, courses: {}, loose: []};
  allCourses().filter(c => c.archived).forEach(c => { const g = termOf(c.archived); g.at = Math.max(g.at, c.archivedAt || 0); g.courses[c.id] = {c, tasks: []}; });
  allTasks().filter(t => t.archivedTerm && q(t)).forEach(t => {
    const g = termOf(t.archivedTerm); g.at = Math.max(g.at, t.archivedAt || 0);
    const c = state.courses[t.courseId];
    if (c && c.archived === t.archivedTerm) g.courses[c.id].tasks.push(t);
    else if (c) (g.courses[c.id] = g.courses[c.id] || {c, tasks: [], active: !c.archived}).tasks.push(t);
    else g.loose.push(t);
  });
  const decksByTerm = {}; Object.values(state.decks || {}).filter(d => d.archived).forEach(d => { decksByTerm[d.archived] = (decksByTerm[d.archived] || 0) + 1; });
  const termList = Object.values(terms).sort((a, b) => b.at - a.at);
  const shown = ui.archAll ? done : done.slice(0, 25);
  const termHtml = termList.map((g, i) => {
    const cs = Object.values(g.courses), nT = cs.reduce((n, x) => n + x.tasks.length, 0) + g.loose.length;
    return `<details class="arch-term" ${i === 0 || ui.q ? "open" : ""}><summary><span class="arch-term-name">${esc(g.name)}</span><span class="mini">${cs.length} course${cs.length === 1 ? "" : "s"}, ${nT} task${nT === 1 ? "" : "s"}${decksByTerm[g.name] ? `, ${decksByTerm[g.name]} flashcard deck${decksByTerm[g.name] === 1 ? "" : "s"}` : ""}${g.at ? ` · archived ${esc(new Date(g.at).toLocaleDateString(undefined, {month: "short", day: "numeric", year: "numeric"}))}` : ""}</span></summary>
      ${cs.map(x => `<div class="arch-course" style="--c:${esc(x.c.color)}"><div class="arch-course-head"><span class="sd"></span><strong>${esc(x.c.name)}</strong>${x.c.code ? `<span class="mini">${esc(x.c.code)}</span>` : ""}<span class="spacer"></span>${x.c.archived ? `<button class="btn small" data-act="arch-course-restore" data-id="${esc(x.c.id)}">Restore Course</button>` : `<span class="mini">Course is active again</span>`}</div>
        ${x.tasks.length ? `<ul class="arch-list">${x.tasks.sort(sortTasks).map(archRow).join("")}</ul>` : `<p class="mini" style="margin:6px 0 0">No tasks.</p>`}</div>`).join("")}
      ${g.loose.length ? `<div class="arch-course" style="--c:#8A94A6"><div class="arch-course-head"><span class="sd"></span><strong>No Course</strong></div><ul class="arch-list">${g.loose.sort(sortTasks).map(archRow).join("")}</ul></div>` : ""}
    </details>`;
  }).join("");
  return `<div class="view-head"><h2>Archive</h2><button class="btn small" data-act="new-term">Start a New Term</button><button class="btn small" data-act="archive-back">Back to Board</button></div>
    <p class="mini" style="margin:6px 0 0;max-width:70ch">Completed tasks move here ${ARCHIVE_DAYS} days after you finish them, and past terms move here when you start a new one. Move anything back to To Do or In Progress any time.</p>
    ${chipsHtml()}${searchNote()}
    <h3 class="fsec">${ARCHIVE_SM}Completed Tasks<span class="n">${done.length}</span></h3>
    ${done.length ? `<ul class="arch-list">${shown.map(archRow).join("")}</ul>${done.length > shown.length ? `<button class="show-old" data-act="arch-all" style="width:100%;margin-top:8px">Show All ${done.length}</button>` : ""}` : `<div class="empty">Nothing here yet. Tasks you finish show up here two weeks later.</div>`}
    <h3 class="fsec">${ARCHIVE_SM}Past Terms<span class="n">${termList.length}</span></h3>
    ${termHtml || `<div class="empty">No past terms yet. When a term ends, choose Start a New Term to put its courses and tasks away here.</div>`}`;
}
function seasonGuess(){
  const ds = tasksArr().filter(t => t.due && courseOf(t.courseId)).map(t => t.due).sort();
  const d = ds.length ? parse(ds[Math.floor(ds.length / 2)]) : new Date();
  const m = d.getMonth();
  return `${m <= 4 ? "Spring" : m <= 7 ? "Summer" : "Fall"} ${d.getFullYear()}`;
}
function newTermSheet(){
  const cs = coursesArr();
  const loose = tasksArr().filter(t => !courseOf(t.courseId)).length;
  if (!cs.length && !loose) { toast("There's nothing to archive yet"); return; }
  const cnt = c => tasksArr().filter(t => t.courseId === c.id).length, today = todayISO();
  const ahead = t => t.status !== "done" && !!t.due && t.due > today, nAhead = tasksArr().filter(ahead).length;
  openSheet(`<form class="sheet">${head("Start a New Term")}
    <div class="sheet-body">${REQ_NOTE}
      <p style="margin:0">This puts the finished term's courses, tasks, flashcards and sticky notes in the Archive, so your board, timeline and plan start clean. Nothing is deleted, and you can bring anything back later.</p>
      <label class="f"><span class="lh">Name of the Term That's Ending ${REQ}</span><input type="text" name="term" required maxlength="40" value="${esc(seasonGuess())}"></label>
      <fieldset><legend>Courses to Archive</legend><div class="nt-list">
        ${cs.map(c => `<label class="mi-check nt-row" style="--c:${esc(c.color)}"><input type="checkbox" name="c" value="${esc(c.id)}" checked><span class="sd"></span><span><b>${esc(c.name)}</b> <span class="mini">${esc(c.code || "")} · ${cnt(c)} task${cnt(c) === 1 ? "" : "s"}</span></span></label>`).join("")}
        ${loose ? `<label class="mi-check nt-row"><input type="checkbox" name="loose" checked><span class="sd" style="--c:#8A94A6"></span><span><b>Tasks with no course</b> <span class="mini">${loose} task${loose === 1 ? "" : "s"}</span></span></label>` : ""}
      </div></fieldset>
      <fieldset><legend>Also Archive</legend>
        <label class="mi-check"><input type="checkbox" name="decks" checked> Flashcard decks for these courses</label>
        <label class="mi-check"><input type="checkbox" name="notes" checked> Sticky notes for these courses</label>
      </fieldset>
      ${window.SBGRADES && SBGRADES.snapCount && SBGRADES.snapCount(cs.map(c => c.id)) ? `<label class="mi-check"><input type="checkbox" name="hist" checked> Save Final Grades to Past Terms <span class="mini">keeps them for your cumulative GPA on the Grades page</span></label>` : ""}
      <label class="mi-check"><input type="checkbox" name="keep" checked> Keep Unfinished Work Due After Today${nAhead ? ` <span class="mini">${nAhead} task${nAhead === 1 ? "" : "s"}</span>` : ""}</label>
      <p class="mini" style="margin:0">Other open tasks are archived too. Move any you're carrying over back to To Do from the Archive.</p>
    </div>
    <div class="sheet-foot"><span class="spacer"></span><button type="button" class="btn" data-act="close">Cancel</button><button type="button" class="btn primary" data-submit>Archive Term</button></div>
  </form>`, fd => {
    const label = String(fd.get("term") || "").trim(); if (!label) return false;
    const ids = new Set(fd.getAll("c")), now = Date.now(), ch = [];
    if (!ids.size && !fd.get("loose")) { toast("Pick at least one course"); return false; }
    if (fd.get("hist") && window.SBGRADES && SBGRADES.snapTerm) { try { SBGRADES.snapTerm(label, [...ids]); } catch (e) { console.warn("past terms", e); } }
    ids.forEach(id => ch.push({kind: "course", id, after: Object.assign(clone(state.courses[id]), {archived: label, archivedAt: now})}));
    let nT = 0;
    const keep = !!fd.get("keep");
    allTasks().filter(t => !t.archivedTerm && !(keep && ahead(t)) && (ids.has(t.courseId) || (fd.get("loose") && !courseOf(t.courseId) && !(state.courses[t.courseId] || {}).archived))).forEach(t => { nT++; ch.push({kind: "task", id: t.id, after: Object.assign(clone(t), {archivedTerm: label, archivedAt: now})}); });
    if (fd.get("decks")) decksArr().filter(d => ids.has(d.courseId)).forEach(d => ch.push({kind: "deck", id: d.id, after: Object.assign(clone(d), {archived: label})}));
    if (fd.get("notes")) notesArr().filter(n => !n.archived && ids.has(n.courseId)).forEach(n => ch.push({kind: "note", id: n.id, after: Object.assign(clone(n), {archived: true, archivedAt: now})}));
    ui.filter = "all"; ui.courseId = null; ui.deckId = null;
    applyChanges(ch, `Archived ${label}: ${ids.size} course${ids.size === 1 ? "" : "s"}, ${nT} task${nT === 1 ? "" : "s"}`, {label: "Add New Courses", fn: () => { ui.tab = "courses"; render(); courseForm(null); }});
  });
}
function restoreTask(id, st){
  const t = state.tasks[id]; if (!t) return;
  const n = clone(t);
  n.status = st; n.doneAt = null; n.archivedTerm = null; n.archivedAt = null;
  if (!MILESTONE(t.type)) { if (st === "todo") n.pct = 0; else if (n.pct >= 100) n.pct = 90; }
  n.order = nextOrder(st);
  const ch = [{kind: "task", id, after: n}];
  const c = state.courses[t.courseId];
  if (c && c.archived) ch.push({kind: "course", id: c.id, after: Object.assign(clone(c), {archived: null, archivedAt: null})});
  applyChanges(ch, `${t.title} moved to ${STATUS_LABEL[st]}${c && c.archived ? `, and ${courseLabel(c)} is active again` : ""}`);
}
function restoreCourse(id){
  const c = state.courses[id]; if (!c) return;
  const ch = [{kind: "course", id, after: Object.assign(clone(c), {archived: null, archivedAt: null})}];
  allTasks().filter(t => t.courseId === id && t.archivedTerm).forEach(t => ch.push({kind: "task", id: t.id, after: Object.assign(clone(t), {archivedTerm: null, archivedAt: null})}));
  Object.values(state.decks || {}).filter(d => d.courseId === id && d.archived).forEach(d => ch.push({kind: "deck", id: d.id, after: Object.assign(clone(d), {archived: null})}));
  applyChanges(ch, `Restored ${c.name}`);
}



/* AVAIL-START: availability blocks and the free-time engine.
   Pure: no DOM and no app state, so tests/avail.test.js extracts this block and runs it in node. Everything is wall-clock
   (local dates as YYYY-MM-DD, times as minutes from local midnight); date maths uses day numbers, never local-time arithmetic, so DST days
   can't shift anything. Only durations (realMin) ask the runtime's time zone, so a spring-forward gap or a repeated fall-back hour counts as it really is.
   Shared helpers other code may read: AVAIL.occurrences (display occurrences, same shape as schOccurrences rows, type "avail"),
   AVAIL.freeWindows (a day's free intervals), AVAIL.place (slots for plan items). Output shapes are stable; extend, don't change. */
const AVAIL = (() => {
  const TYPES = {
    class:     {label: "Class",             color: "#4C78C8", verb: "in class"},
    work:      {label: "Work",              color: "#C4733A", verb: "at work"},
    shift:     {label: "Shift / Placement", color: "#1E9A86", verb: "on shift"},
    travel:    {label: "Commute / Travel",  color: "#7E8AA0", verb: "travelling"},
    other:     {label: "Other commitment",  color: "#8A62B8", verb: "busy"},
    protected: {label: "Protected time",    color: "#5E8C6A", verb: "in protected time"}
  };
  const MAX_BLOCKS = 100, MAX_DATES = 366, MAX_SKIPS = 120;
  const p2 = n => String(n).padStart(2, "0");
  const isT = x => typeof x === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(x);
  const toMin = t => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
  const toT = m => { m = Math.max(0, Math.min(1439, Math.round(m))); return p2(Math.floor(m / 60)) + ":" + p2(m % 60); };
  const dnum = s => { const [y, m, d] = s.split("-").map(Number); return Math.round(Date.UTC(y, m - 1, d) / 864e5); };
  const fromDn = n => new Date(n * 864e5).toISOString().slice(0, 10);
  const addD = (s, n) => fromDn(dnum(s) + n);
  const dow = s => new Date(dnum(s) * 864e5).getUTCDay();
  const monN = s => { const n = dnum(s); return n - ((dow(s) + 6) % 7); };
  const isDate = s => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && fromDn(dnum(s)) === s && s >= "1970-01-01" && s <= "2100-12-31";
  const colorOk = c => /^(#[0-9a-f]{3,8}|(rgb|hsl)a?\([\d\s.,%\/-]{1,60}\))$/i.test(String(c || "").trim());
  const clampInt = (v, lo, hi, def) => { v = Math.round(Number(v)); return isFinite(v) ? Math.max(lo, Math.min(hi, v)) : def; };
  const str = (s, n) => String(s == null ? "" : s).replace(/[\u0000-\u001f<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, n);

  function normBlock(b){
    if (!b || typeof b !== "object" || Array.isArray(b)) return null;
    const type = TYPES[b.type] ? b.type : "other";
    const o = {id: str(b.id, 40).replace(/[^\w.-]/g, "") || "av" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), type,
      title: str(b.title, 80) || TYPES[type].label, color: colorOk(b.color) ? String(b.color).trim() : TYPES[type].color, allDay: !!b.allDay};
    o.start = isT(b.start) ? b.start : "09:00"; o.end = isT(b.end) ? b.end : "17:00";
    if (o.start === o.end) o.end = toT((toMin(o.start) + 60) % 1440);
    if (o.allDay) { o.start = "00:00"; o.end = "23:59"; }
    o.days = [...new Set((Array.isArray(b.days) ? b.days : []).map(Number))].filter(d => Number.isInteger(d) && d >= 0 && d <= 6).sort((x, y) => x - y);
    o.dates = [...new Set((Array.isArray(b.dates) ? b.dates : []).filter(isDate))].sort().slice(0, MAX_DATES);
    o.from = isDate(b.from) ? b.from : ""; o.until = isDate(b.until) ? b.until : "";
    if (o.from && o.until && o.from > o.until) { const t = o.from; o.from = o.until; o.until = t; }
    o.every = clampInt(b.every, 1, 8, 1);
    o.anchor = isDate(b.anchor) ? b.anchor : "";
    o.bufB = clampInt(b.bufB, 0, 240, 0); o.bufA = clampInt(b.bufA, 0, 240, 0);
    if (o.type === "protected" || o.type === "travel") { o.bufB = 0; o.bufA = 0; }
    o.skip = {};
    if (b.skip && typeof b.skip === "object" && !Array.isArray(b.skip)) {
      Object.keys(b.skip).filter(isDate).slice(0, MAX_SKIPS).forEach(k => {
        const v = b.skip[k]; if (!v || typeof v !== "object") return;
        if (v.skip) o.skip[k] = {skip: true};
        else if (isT(v.start) && isT(v.end) && v.start !== v.end) o.skip[k] = {start: v.start, end: v.end};
      });
    }
    o.created = Number(b.created) > 0 ? Number(b.created) : 0;
    if (!o.dates.length && !o.days.length) return null;
    return o;
  }
  function normCfg(c){
    c = c && typeof c === "object" ? c : {};
    const tm = v => isT(v) ? toMin(v) : Number.isInteger(v) && v >= 0 && v <= 1440 ? v : null;
    const ds = tm(c.dayStart) == null ? 420 : tm(c.dayStart), de = tm(c.dayEnd) == null ? 1380 : tm(c.dayEnd);
    const ok = de - ds >= 120;
    return {dayStart: ok ? ds : 420, dayEnd: ok ? de : 1380, minChunk: clampInt(c.minChunk, 5, 180, 25), maxSession: clampInt(c.maxSession, 15, 240, 90),
      breakMin: clampInt(c.breakMin, 0, 60, 10), defBuf: clampInt(c.defBuf, 0, 120, 0), recover: !!c.recover, set: !!c.set};
  }
  function normAvail(a){
    a = a && typeof a === "object" ? a : {};
    const seen = new Set(), blocks = [];
    (Array.isArray(a.blocks) ? a.blocks : []).forEach(raw => {
      if (blocks.length >= MAX_BLOCKS) return;
      const b = normBlock(raw); if (!b || seen.has(b.id)) return;
      seen.add(b.id); blocks.push(b);
    });
    return {v: 1, blocks, cfg: normCfg(a.cfg)};
  }

  function occursOn(b, d){
    if (b.dates.length) return b.dates.includes(d);
    if (b.from && d < b.from) return false;
    if (b.until && d > b.until) return false;
    if (!b.days.includes(dow(d))) return false;
    if (b.every > 1) {
      const wk = (monN(d) - monN(b.anchor || b.from || "2001-01-01")) / 7;
      return ((wk % b.every) + b.every) % b.every === 0;
    }
    return true;
  }
  function raw(blocks, from, to){
    const out = [];
    blocks.forEach(b => {
      for (let n = dnum(from), end = dnum(to); n <= end; n++) {
        const d = fromDn(n); if (!occursOn(b, d)) continue;
        const sk = b.skip[d], o = {b, id: b.id, key: d, date: d, type: b.type, allDay: b.allDay, skipped: false, moved: false};
        let st = b.start, en = b.end;
        if (sk && sk.skip) o.skipped = true; else if (sk && !b.allDay) { st = sk.start; en = sk.end; o.moved = true; }
        o.s = b.allDay ? 0 : toMin(st); o.e = b.allDay ? 1440 : toMin(en);
        if (!b.allDay && o.e <= o.s) o.e += 1440;
        o.overnight = o.e > 1440;
        out.push(o);
      }
    });
    return out;
  }
  function occurrences(blocks, from, to){
    const out = [];
    raw(blocks, addD(from, -1), to).forEach(o => {
      const b = o.b, inR = d => d >= from && d <= to;
      const base = {type: "avail", id: b.id, key: o.key, orig: o.key, moved: o.moved, skipped: o.skipped, color: b.color, title: b.title, label: TYPES[b.type].label, where: "", cls: "k-av k-av-" + b.type,
        allDay: o.allDay, avail: {kind: b.type, block: b, overnight: o.overnight, seg: "whole", bufB: b.bufB, bufA: b.bufA, fullStart: toT(o.s), fullEnd: o.allDay ? "23:59" : toT(o.e % 1440)}};
      if (o.allDay) { if (inR(o.date)) out.push(Object.assign({}, base, {date: o.date, start: "", end: ""})); return; }
      if (!o.overnight) { if (inR(o.date)) out.push(Object.assign({}, base, {date: o.date, start: toT(o.s), end: toT(o.e)})); return; }
      if (inR(o.date)) out.push(Object.assign({}, base, {date: o.date, start: toT(o.s), end: "23:59", avail: Object.assign({}, base.avail, {seg: "head"})}));
      const nd = addD(o.date, 1);
      if (inR(nd)) out.push(Object.assign({}, base, {date: nd, start: "00:00", end: toT(o.e - 1440), avail: Object.assign({}, base.avail, {seg: "tail"})}));
    });
    return out.sort((a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : a.start < b.start ? -1 : a.start > b.start ? 1 : 0);
  }

  function realMin(date, a, b){
    const [y, m, d] = date.split("-").map(Number);
    const r = Math.round((new Date(y, m - 1, d, Math.floor(b / 60), b % 60) - new Date(y, m - 1, d, Math.floor(a / 60), a % 60)) / 60000);
    return isFinite(r) ? Math.max(0, r) : Math.max(0, b - a);
  }
  const CLINICAL = /clinical|practicum|placement|internship|co-?op|field ?work|preceptor|\bshift\b|practice (day|experience)|hospital|sim(ulation)? lab|site visit/i;

  function busy(date, blocks, cfg, ext, done){
    const iv = [], add = (s, e, kind, title) => { s = Math.max(0, s); e = Math.min(1440, e); if (e > s) iv.push({s, e, kind, title: title || TYPES[kind] && TYPES[kind].label || kind}); };
    const dn = dnum(date);
    raw(blocks, addD(date, -1), addD(date, 1)).forEach(o => {
      if (o.skipped) return;
      const off = (dnum(o.date) - dn) * 1440, b = o.b;
      if (o.allDay) { if (off === 0 && b.type !== "travel") add(0, 1440, b.type, b.title); return; }
      add(o.s + off, o.e + off, b.type, b.title);
      if (b.bufB) add(o.s + off - b.bufB, o.s + off, "travel", "Travel to " + b.title);
      if (b.bufA) add(o.e + off, o.e + off + b.bufA, "travel", "Travel from " + b.title);
      if (cfg.recover && o.overnight && (b.type === "shift" || b.type === "work") && (o.e - 1440) < 720) add(o.e + off, 1440 + 720 + off, "recovery", "Recovery after " + b.title);
    });
    (ext || []).forEach(x => {
      if (x.allDay || !x.start) { if (CLINICAL.test((x.label || "") + " " + (x.title || ""))) add(480, 960, "class", x.title || x.label || "Placement"); return; }
      if (!isT(x.start)) return;
      const s = toMin(x.start), e = isT(x.end) ? toMin(x.end) : s;
      if (e > s) add(s, e, "class", x.title || x.label || "Class");
    });
    (done || []).forEach(x => add(x.s, x.e, "done", "Focus session"));
    return iv;
  }
  const RANK = {shift: 5, work: 5, class: 4, other: 3, recovery: 2, protected: 2, done: 1, travel: 0};
  const mainOf = parts => parts.slice().sort((p, q) => (RANK[q.kind] || 0) - (RANK[p.kind] || 0) || (q.e - q.s) - (p.e - p.s))[0];
  function merge(iv){
    const a = iv.slice().sort((x, y) => x.s - y.s || x.e - y.e), out = [];
    a.forEach(x => {
      const l = out[out.length - 1];
      if (l && x.s <= l.e) { l.e = Math.max(l.e, x.e); l.parts.push(x); }
      else out.push({s: x.s, e: x.e, parts: [x]});
    });
    out.forEach(m => { const main = mainOf(m.parts); m.kind = main.kind; m.title = main.title; });
    return out;
  }

  function freeWindows(date, opts){
    opts = opts || {};
    const cfg = normCfg(opts.cfg), blocks = opts.blocks || [];
    let lo = cfg.dayStart; const we = cfg.dayEnd;
    if (opts.nowMin != null) lo = Math.max(lo, Math.ceil(opts.nowMin / 5) * 5);
    const mb = merge(busy(date, blocks, cfg, opts.ext, opts.done));
    const raw0 = []; let cur = lo;
    for (const m of mb) {
      if (cur >= we) break;
      if (m.e <= cur) continue;
      if (m.s > cur) raw0.push([cur, Math.min(m.s, we)]);
      cur = Math.max(cur, m.e);
    }
    if (cur < we) raw0.push([cur, we]);
    const windows = raw0.map(([s, e]) => ({s, e, min: realMin(date, s, e), a: toT(s), b: e >= 1440 ? "24:00" : toT(e)})).filter(w => w.min >= cfg.minChunk);
    const total = windows.reduce((t, w) => t + w.min, 0);
    return {date, windows, total, largest: windows.reduce((m, w) => Math.max(m, w.min), 0), none: total === 0, busy: mb, ws: cfg.dayStart, we, lo};
  }

  function place(windows, tasks, o){
    o = o || {};
    const cfg = normCfg(o.cfg), maxS = o.maxSession || cfg.maxSession, brk = o.breakMin != null ? o.breakMin : cfg.breakMin, minSlot = o.minSlot || 15;
    const left = (tasks || []).map(t => ({id: t.id, left: Math.max(0, Math.round(t.min))})).filter(t => t.left > 0);
    const slots = []; let ti = 0;
    (windows || []).forEach(w => {
      let cur = w.s;
      while (cur < w.e && ti < left.length) {
        const t = left[ti], room = w.e - cur;
        if (room < Math.min(minSlot, t.left)) break;
        const len = Math.min(t.left, maxS, room);
        slots.push({id: t.id, s: cur, e: cur + len, min: len});
        t.left -= len; cur += len;
        if (t.left <= 0) ti++;
        if (cur < w.e && ti < left.length) cur += brk;
      }
    });
    const n = {}; slots.forEach(s => { n[s.id] = (n[s.id] || 0) + 1; });
    const k = {}; slots.forEach(s => { k[s.id] = (k[s.id] || 0) + 1; s.part = k[s.id]; s.of = n[s.id]; });
    const unplaced = {}; left.forEach(t => { if (t.left > 0) unplaced[t.id] = t.left; });
    return {slots, unplaced, placed: slots.reduce((t, s) => t + s.min, 0)};
  }

  const defFmt = m => { const h = Math.floor(m / 60) % 24, mm = m % 60, ap = h >= 12 ? "PM" : "AM"; return `${h % 12 || 12}${mm ? ":" + p2(mm) : ""} ${ap}`; };
  const rangeTxt = (w, f) => `${f(w.s)}–${f(w.e)}`;
  function explain(res, opts){
    opts = opts || {}; const f = opts.fmt || defFmt, now = opts.nowMin;
    const list = res.windows.map(w => rangeTxt(w, f)).join(" and ");
    let act = now != null ? res.busy.find(m => m.s <= now && m.e > now) : null;
    if (act) { const cur = mainOf(act.parts.filter(p => p.s <= now && p.e > now)); act = Object.assign({}, act, {kind: cur.kind, title: cur.title}); }
    const verb = m => m.kind === "recovery" ? "recovering from your night shift" : (TYPES[m.kind] ? TYPES[m.kind].verb : "busy");
    const what = verb;
    if (!res.windows.length) {
      const last = res.busy.length ? res.busy[res.busy.length - 1] : null;
      if (act && act.s <= res.ws && act.e >= res.we) return `No free time today. You're ${what(act)} all day.`;
      if (act && last && last.e >= res.we - 1) return `No free time today. You're ${what(act)} until ${f(act.e)}.`;
      if (act) return `No free time left today. You're ${what(act)} until ${f(act.e)}.`;
      return now != null && now >= res.we ? "The day is over for study time." : "No free time today: everything from " + f(res.ws) + " to " + f(res.we) + " is taken.";
    }
    if (act) return `You're ${what(act)} until ${f(act.e)}; your free ${res.windows.length > 1 ? "windows are" : "window is"} ${list}.`;
    return `Free ${now != null ? "for the rest of today" : "that day"}: ${list}.`;
  }

  // Typing helpers
  const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
  const DAYW = [["sun", "sunday"], ["mon", "monday"], ["tue", "tues", "tuesday"], ["wed", "weds", "wednesday"], ["thu", "thur", "thurs", "thursday"], ["fri", "friday"], ["sat", "saturday"]];
  const dayIdx = w => DAYW.findIndex(a => a.includes(String(w).toLowerCase().replace(/\.$/, "")));
  function parseDates(text, today){
    const out = new Set(), bad = [], ty = Number(today.slice(0, 4));
    const mk = (m, d, y) => {
      if (m < 0 || m > 11 || !d) return "";
      let yr = y || ty, s = `${yr}-${p2(m + 1)}-${p2(d)}`;
      if (!isDate(s)) return "";
      if (!y && dnum(s) - dnum(today) < -45) { s = `${yr + 1}-${p2(m + 1)}-${p2(d)}`; if (!isDate(s)) return ""; }
      return s;
    };
    const yfix = y => y ? (String(y).length === 2 ? 2000 + Number(y) : Number(y)) : 0;
    const mon = "(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\\.?";
    String(text || "").split(/[,;\n]+|\band\b|&/i).forEach(tok => {
      let t = tok.replace(/\b(mon|tue|wed|thu|fri|sat|sun)[a-z]*\.?/gi, " ").replace(/\s+/g, " ").trim(), m;
      if (!t) return;
      if ((m = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/))) { const s = `${m[1]}-${p2(m[2])}-${p2(m[3])}`; return isDate(s) ? out.add(s) : bad.push(tok.trim()); }
      if ((m = t.match(new RegExp(`^${mon}\\s*(\\d{1,2})(?:st|nd|rd|th)?\\s*(?:-|–|to)\\s*(\\d{1,2})(?:st|nd|rd|th)?(?:\\s*,?\\s*(\\d{4}))?$`, "i")))) {
        const mi = MONTHS.indexOf(m[1].toLowerCase()), a = Number(m[2]), z = Number(m[3]); let ok = a <= z && z - a < 31;
        if (ok) for (let d = a; d <= z; d++) { const s = mk(mi, d, yfix(m[4])); if (s) out.add(s); else ok = false; }
        return ok ? null : bad.push(tok.trim());
      }
      if ((m = t.match(new RegExp(`^${mon}\\s*(\\d{1,2})(?:st|nd|rd|th)?(?:\\s*,?\\s*(\\d{4}))?$`, "i")))) { const s = mk(MONTHS.indexOf(m[1].toLowerCase()), Number(m[2]), yfix(m[3])); return s ? out.add(s) : bad.push(tok.trim()); }
      if ((m = t.match(new RegExp(`^(\\d{1,2})(?:st|nd|rd|th)?\\s*${mon}(?:\\s*,?\\s*(\\d{4}))?$`, "i")))) { const s = mk(MONTHS.indexOf(m[2].toLowerCase()), Number(m[1]), yfix(m[3])); return s ? out.add(s) : bad.push(tok.trim()); }
      if ((m = t.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/))) { const s = mk(Number(m[1]) - 1, Number(m[2]), yfix(m[3])); return s ? out.add(s) : bad.push(tok.trim()); }
      bad.push(tok.trim());
    });
    return {dates: [...out].sort(), bad};
  }
  function parseQuick(text){
    let s = " " + String(text || "").trim().replace(/\s+/g, " ") + " ";
    if (s.length > 170) return null;
    const lead = s.match(/^\s*(?:add\s+|new\s+)?(work|job|shift|shifts|placement|clinical|practicum|class|lecture|commute|travel|appointment|practice|training|meeting|lunch|dinner|sleep)\b/i);
    if (!lead) return null;
    const w = lead[1].toLowerCase();
    const type = /^(work|job)$/.test(w) ? "work" : /^(shift|shifts|placement|clinical|practicum)$/.test(w) ? "shift" : /^(class|lecture)$/.test(w) ? "class" : /^(commute|travel)$/.test(w) ? "travel" : /^(lunch|dinner|sleep)$/.test(w) ? "protected" : "other";
    s = s.replace(lead[0], " ");
    let time = null;
    const tr = s.match(/(\d{1,2})(?::([0-5]\d))?\s*(?:(a\.?m\.?|p\.?m\.?|a|p)(?![a-z]))?\s*(?:-|–|to|until)\s*(\d{1,2})(?::([0-5]\d))?\s*(?:(a\.?m\.?|p\.?m\.?|a|p)(?![a-z]))?(?![\d:])/i);
    if (tr) {
      const ap = x => x ? (/^p/i.test(x) ? "p" : "a") : "", a1 = ap(tr[3]), a2 = ap(tr[6]);
      const h1 = Number(tr[1]), m1 = Number(tr[2] || 0), h2 = Number(tr[4]), m2 = Number(tr[5] || 0);
      const conv = (h, m, a) => (h % 12 + (a === "p" ? 12 : 0)) * 60 + m;
      let a = null, b = null;
      if (a1 && a2) { a = conv(h1, m1, a1); b = conv(h2, m2, a2); }
      else if (a2 && !a1 && h1 <= 12) { b = conv(h2, m2, a2); a = conv(h1, m1, a2); if (a >= b) a = conv(h1, m1, a2 === "p" ? "a" : "p"); }
      else if (a1 && !a2 && h2 <= 12) { a = conv(h1, m1, a1); b = conv(h2, m2, a1); if (b <= a) b = conv(h2, m2, a1 === "p" ? "a" : "p"); }
      else if (!a1 && !a2 && (h1 > 12 || h2 > 12 || tr[2] || tr[5]) && h1 < 24 && h2 < 24 && /:/.test(tr[0])) { a = h1 * 60 + m1; b = h2 * 60 + m2; }
      if (a != null && b != null && a !== b && a < 1440 && b < 1440) { time = {start: toT(a), end: toT(b)}; s = s.replace(tr[0], " "); }
    }
    if (!time) return null;
    const days = new Set();
    s = s.replace(/\b(mon|tue|wed|thu|fri|sat|sun)[a-z]*\.?\s*(?:-|–|to|through|thru)\s*(mon|tue|wed|thu|fri|sat|sun)[a-z]*\.?/i, (all, x, y) => { let i = dayIdx(x), j = dayIdx(y); for (let n = 0; n < 7; n++) { days.add(i); if (i === j) break; i = (i + 1) % 7; } return " "; });
    s = s.replace(/\b(weekdays?)\b/i, () => { [1, 2, 3, 4, 5].forEach(d => days.add(d)); return " "; });
    s = s.replace(/\b(weekends?)\b/i, () => { days.add(6); days.add(0); return " "; });
    s = s.replace(/\b(every ?day|daily)\b/i, () => { for (let d = 0; d < 7; d++) days.add(d); return " "; });
    s = s.replace(/\b(sun(?:day)?|mon(?:day)?|tues?(?:day)?|weds?(?:nesday)?|thu(?:rs?(?:day)?)?|fri(?:day)?|sat(?:urday)?)s?\b\.?/gi, (all, x) => { const i = dayIdx(x); if (i >= 0) days.add(i); return " "; });
    s = s.replace(/\b(on|every|each|from|at|and|the|shift|work|,)\b|[,&]/gi, " ").replace(/\s+/g, " ").trim();
    if (!days.size || s) return null;
    return {type, title: w === "shifts" ? "Shift" : w.charAt(0).toUpperCase() + w.slice(1), days: [...days].sort((x, y) => x - y), start: time.start, end: time.end};
  }

  return {TYPES, MAX_BLOCKS, MAX_DATES, normBlock, normCfg, normAvail, occursOn, occurrences, freeWindows, place, explain, realMin, parseDates, parseQuick, isDate, isT, toMin, toT, addD, dnum, dow, monN, fromDn, defFmt};
})();
/* AVAIL-END */

/* AVAIL-UI-START: availability in the app. Blocks live in state.settings.avail = {v, blocks, cfg}, so they sync with the account,
   go into backups, and are cleaned by AVAIL.normAvail on every read. The engine above does the maths; this part is storage, forms and the free-time strip. */
let AV_CACHE = {src: null, val: null};
function availState(){
  const raw = state.settings && state.settings.avail;
  if (AV_CACHE.val && AV_CACHE.src === raw) return AV_CACHE.val;
  const v = AVAIL.normAvail(raw); AV_CACHE = {src: raw, val: v}; return v;
}
const availBlocks = () => availState().blocks;
const availCfg = () => availState().cfg;
// Plan limits switch on once there's a block or the person has saved availability settings
const availActive = () => { const a = availState(); return a.blocks.length > 0 || a.cfg.set; };
function availSet(v){ state.settings = Object.assign({}, state.settings, {avail: v}); saveSettings(); scheduleRender(); }
function availCommit(next, label){
  const prev = state.settings && state.settings.avail != null ? state.settings.avail : null;
  availSet(AVAIL.normAvail(next));
  if (label) toast(label, () => { availSet(prev); toast("Undone"); });
}
// For backup restore and import
function restoreSettingsFrom(src){
  try {
    if (!src || typeof src !== "object") return;
    const cur = state.settings || {}, next = Object.assign({}, cur), ok = a => Array.isArray(a) ? a.filter(x => x && typeof x === "object") : [];
    const have = new Set(ok(cur.noteBoards).map(b => b.id));
    if (Array.isArray(src.noteBoards)) next.noteBoards = ok(cur.noteBoards).concat(ok(src.noteBoards).filter(b => b.id && !have.has(b.id)));
    if (Array.isArray(src.photoThemes)) { next.photoThemes = ok(cur.photoThemes); next.photoGone = ok(cur.photoGone); keepPhotoThemes(next, {photoThemes: src.photoThemes, photoGone: src.photoGone}); }
    ["style", "comp"].forEach(k => { if (!cur[k] && src[k] && typeof src[k] === "object") next[k] = src[k]; });
    state.settings = next; saveSettings();
  } catch(e) { console.warn("settings restore", e); }
}
function availRestore(v){ availSet(v == null ? null : AVAIL.normAvail(v)); }
const availMin = m => m >= 1440 ? "midnight" : fmtTime(AVAIL.toT(m));
function availRange(s, e){
  const a = availMin(s), b = availMin(e), sx = x => ((x.match(/\s?[AP]M$/i) || [""])[0]).trim().toLowerCase();
  return (sx(a) && sx(a) === sx(b) ? a.replace(/\s?[AP]M$/i, "") : a) + "\u2013" + b;
}
// What an availability row says about its time (shown on the schedule grid)
function availOccs(from, to){
  const a = availState(); if (!a.blocks.length) return [];
  return AVAIL.occurrences(a.blocks, from, to).map(o => {
    const v = o.avail;
    o.rangeText = o.allDay ? "All day" : v.seg === "head" ? `${fmtTime(o.start)}–${fmtTime(v.fullEnd)} (overnight)` : v.seg === "tail" ? `until ${fmtTime(o.end)} (overnight)` : `${fmtTime(o.start)}–${fmtTime(o.end)}`;
    return o;
  });
}
// Timed things other than availability blocks (classes, events) per date, for the engine
function availExtMap(from, to){
  const m = {};
  schOccurrences(from, to).forEach(o => {
    if (o.type === "avail" || o.skipped || (o.type === "meet" && o.m && o.m.kind === "Office Hours")) return;
    (m[o.date] = m[o.date] || []).push({start: o.start, end: o.end, allDay: !!o.allDay, title: o.title, label: o.label});
  });
  return m;
}
function availFreeDay(date, nowMin, extMap){
  const a = availState(), ext = (extMap || availExtMap(date, date))[date] || [];
  return AVAIL.freeWindows(date, {blocks: a.blocks, cfg: a.cfg, ext, nowMin});
}
let AV_DAYS = {k: "", v: null};
// Free hours per future date, cached until something changes
function availDays(from, to){
  const k = from + "|" + to + "|" + (state.updated || 0);
  if (AV_DAYS.k === k) return AV_DAYS.v;
  const ext = availExtMap(from, to), out = {};
  for (let d = from; d <= to; d = addDays(d, 1)) out[d] = availFreeDay(d, null, ext).total / 60;
  AV_DAYS = {k, v: out}; return out;
}
// Today's window, from now on
function availToday(now){
  const res = availFreeDay(todayISO(), now.getHours() * 60 + now.getMinutes());
  return {res, active: availActive()};
}
const availWhen = (day, today) => { for (let i = 1; i < day.length; i++) if (day[i] >= 0.5) return i === 1 ? "tomorrow" : parse(addDays(today, i)).toLocaleDateString(undefined, {weekday: "long"}); return "the coming days"; };
// Fill in what Today's Plan can say about free time
function availPlan(av, ranked, th0, needToday, day, today, now){
  const res = av.res, a = availState();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  // A task you have done enough on today gets no more time today, and one you set aside with Something Else moves down behind the new first task
  const skipped = new Set(typeof ui !== "undefined" && ui.skipNext && ui.skipNext.day === today ? ui.skipNext.ids : []);
  const isEnough = x => { try { return typeof enoughToday === "function" && enoughToday(x.t, x); } catch (e) { return false; } };
  const live = ranked.filter(x => x.alloc > 0 && !isEnough(x));
  const enoughH = ranked.filter(x => x.alloc > 0 && isEnough(x)).reduce((t, x) => t + x.alloc, 0);
  const fresh = live.filter(x => !skipped.has(x.t.id)), aside = live.filter(x => skipped.has(x.t.id));
  const tasks = fresh.slice(0, 1).concat(aside, fresh.slice(1)).map(x => ({id: x.t.id, min: Math.round(x.alloc * 60)}));
  const pl = AVAIL.place(res.windows, tasks, {cfg: a.cfg});
  const by = {}; pl.slots.forEach(s => { (by[s.id] = by[s.id] || []).push(s); });
  if (av.active) ranked.forEach(x => {
    if (!(x.alloc > 0)) return;
    if (isEnough(x)) { x.alloc = 0; return; }
    const placed = (by[x.t.id] || []).reduce((t, s) => t + s.min, 0);
    if (placed < x.alloc * 60 - 1) { x.moved = x.alloc - placed / 60; x.alloc = placed / 60; }
  });
  const planned = ranked.reduce((t, x) => t + (x.alloc || 0), 0), freeH = res.total / 60, wantH = Math.max(0, Math.min(th0, needToday) - enoughH);
  let note = "";
  if (av.active && wantH > planned + 0.2) {
    const over = wantH - planned, when = availWhen(day, today);
    note = res.none ? `Nothing fits in today's free time, so ${fmtHM(over)} of work moves to ${when}.` : `${fmtHM(wantH)} of work doesn't fit in today's ${fmtHM(freeH)} of free time: moved ${fmtHM(over)} to ${when}.`;
  }
  const has = res.busy.some(m => m.kind !== "done");
  return {res, active: av.active, line: AVAIL.explain(res, {nowMin, fmt: availMin}), note, slots: pl.slots, by, planned, show: av.active || has};
}
const availSlotText = list => list.map(s => availRange(s.s, s.e)).join(", then ");

/* -- Today's Plan */
function availStripHtml(F){
  const a = F.avail; if (!a || !a.show) return "";
  const chips = a.res.windows.map(w => `<button type="button" class="av-chip" data-act="avail-focus" data-s="${w.s}" data-e="${w.e}" aria-label="Start a focus session in your free time, ${esc(availRange(w.s, w.e))}"><b>${esc(availRange(w.s, w.e))}</b><small>${esc(fmtHM(w.min / 60))}</small></button>`).join("");
  return `<div class="av-strip" role="region" aria-label="Free time today">
    <div class="av-top"><h3 class="plan-sub">Free Time Today</h3><span class="av-acts"><button type="button" class="btn small" data-act="avail-open">Availability</button></span></div>
    <p class="av-line">${esc(a.line)}</p>
    ${chips ? `<div class="av-chips" role="group" aria-label="Free windows. Tap one to start a focus session">${chips}</div>` : ""}
    ${a.note ? `<p class="av-note">${esc(a.note)}</p>` : ""}
  </div>`;
}
// Start a focus session sized to a free window (or to the plan's slot in it)
function availFocus(s, e){
  const F = FOCUS || computeFocus(), slot = ((F.avail || {}).slots || []).find(x => x.s >= s && x.e <= e);
  if (pomo.running) { openPomo(); toast("A focus session is already running"); return; }
  const dur = Math.max(5, Math.min(Math.round(e - s), slot ? slot.min : Number(pomoCfg().focus) || 25, 120));
  pomoSetMode("focus"); pomo.left = dur * 60000; pomo.preset = dur; pomo.taskId = slot ? slot.id : pomo.taskId; pomoSave();
  openPomo(); pomoStart();
}

/* -- Forms */
const AV_ORDER = ["class", "work", "shift", "travel", "other", "protected"];
const AV_HELP = {class: "A class that isn't in your courses", work: "A job or work shift", shift: "Placement, clinical, practicum, rotation or other shifts", travel: "Time to get somewhere", other: "Sports, family, appointments", protected: "Meals, sleep, personal time. The planner never uses it"};
function availSummary(b){
  const days = b.days.length === 7 ? "Every day" : WEEK_ORDER.filter(d => b.days.includes(d)).map(d => parse("2024-01-0" + (d === 0 ? 7 : d)).toLocaleDateString(undefined, {weekday: "short"})).join(", ");
  const when = b.dates.length ? (b.dates.length === 1 ? fmtDate(b.dates[0]) : `${b.dates.length} dates, ${fmtShort(b.dates[0])} to ${fmtShort(b.dates[b.dates.length - 1])}`) : days + (b.every > 1 ? `, every ${b.every} weeks` : "") + (b.from || b.until ? `, ${b.from ? "from " + fmtShort(b.from) : ""}${b.until ? " until " + fmtShort(b.until) : ""}` : "");
  const t = b.allDay ? "All day" : `${fmtTime(b.start)}–${fmtTime(b.end)}${b.end <= b.start ? " (overnight)" : ""}`;
  return `${when} · ${t}${b.bufB || b.bufA ? ` · travel ${b.bufB || 0}/${b.bufA || 0} min` : ""}`;
}
function availManager(){
  const a = availState(), c = a.cfg;
  const rows = a.blocks.length ? a.blocks.map(b => `<li class="av-row" style="--c:${esc(b.color)}"><span class="av-dot" aria-hidden="true"></span><span class="av-rt"><b>${esc(b.title)}</b> <span class="mini">${esc(AVAIL.TYPES[b.type].label)}</span><br><span class="mini">${esc(availSummary(b))}</span></span>
      <span class="av-ra"><button type="button" class="btn small" data-act="avail-edit" data-id="${esc(b.id)}" aria-label="Edit ${esc(b.title)}">Edit</button><button type="button" class="btn small" data-act="avail-dup" data-id="${esc(b.id)}" aria-label="Duplicate ${esc(b.title)}">Duplicate</button><button type="button" class="btn small danger" data-act="avail-del" data-id="${esc(b.id)}" aria-label="Delete ${esc(b.title)}">Delete</button></span></li>`).join("")
    : `<li class="mini av-none">Nothing added yet. Your course classes and calendar events already count as busy time.</li>`;
  openSheet(`<form class="sheet av-form">${head("Availability")}
    <div class="sheet-body">
      <p class="mini" style="margin:0">Add work, shifts, placements, travel and time the planner must never use. Today's Plan only schedules into the free time left. Your classes and calendar events already count.</p>
      <ul class="av-list">${rows}</ul>
      <button type="button" class="btn small" data-act="avail-add">+ Add Shift or Work</button>
      <fieldset class="av-set"><legend>Study Time</legend>
        <div class="two"><label class="f">Day starts<input type="time" name="dayStart" value="${esc(AVAIL.toT(c.dayStart))}" required></label><label class="f">Day ends<input type="time" name="dayEnd" value="${esc(AVAIL.toT(c.dayEnd))}" required></label></div>
        <div class="two"><label class="f">Shortest useful gap (min)<input type="number" name="minChunk" min="5" max="180" step="5" value="${c.minChunk}"></label><label class="f">Longest single session (min)<input type="number" name="maxSession" min="15" max="240" step="5" value="${c.maxSession}"></label></div>
        <div class="two"><label class="f">Break between sessions (min)<input type="number" name="breakMin" min="0" max="60" step="5" value="${c.breakMin}"></label><label class="f">Usual travel time for new shifts and work (min)<input type="number" name="defBuf" min="0" max="120" step="5" value="${c.defBuf}"></label></div>
        <label class="mi-check"><input type="checkbox" name="recover" ${c.recover ? "checked" : ""}> Treat the morning after an overnight shift as recovery (no study before noon)</label>
        <p class="mini" style="margin:6px 0 0">Gaps shorter than the shortest useful gap are ignored. Your Study Hours per Day in Settings still sets how much you want to do; free time only caps it.</p>
      </fieldset>
    </div>
    <div class="sheet-foot"><span class="spacer"></span><button type="button" class="btn" data-act="close">Close</button><button type="button" class="btn primary" data-submit>Save Settings</button></div>
  </form>`, fd => {
    const ds = String(fd.get("dayStart")), de = String(fd.get("dayEnd"));
    if (!AVAIL.isT(ds) || !AVAIL.isT(de) || AVAIL.toMin(de) - AVAIL.toMin(ds) < 120) { toast("Your day needs to be at least 2 hours long"); return false; }
    const cfg = {dayStart: ds, dayEnd: de, minChunk: Number(fd.get("minChunk")), maxSession: Number(fd.get("maxSession")), breakMin: Number(fd.get("breakMin")), defBuf: Number(fd.get("defBuf")), recover: !!fd.get("recover"), set: true};
    availCommit({blocks: availBlocks(), cfg}, "Availability settings saved");
  });
}
function availForm(block, preset){
  const cfg = availCfg(), today = todayISO(), isNew = !block || !availBlocks().some(x => x.id === block.id);
  let b = block ? clone(block) : null;
  if (!b || isNew) b = Object.assign({id: uid(), type: "work", title: "", days: [], dates: [], start: "16:00", end: "21:00", allDay: false, every: 1, from: "", until: "", anchor: "", bufB: cfg.defBuf, bufA: cfg.defBuf, skip: {}}, b || {}, preset || {});
  const mode0 = preset && preset.roster ? "dates" : b.dates.length ? (b.dates.length === 1 && !b.days.length ? "one" : "dates") : "weekly";
  const pat0 = (() => { if (b.every < 2 || !b.anchor) return 0; return (((AVAIL.monN(b.anchor) - AVAIL.monN(today)) / 7) % b.every + b.every) % b.every; })();
  let color = b.color || AVAIL.TYPES[b.type].color, colorTouched = !!b.color && b.color !== AVAIL.TYPES[b.type].color, days = b.days.slice(), dates = b.dates.slice(), calM = (dates[0] || today).slice(0, 7);
  const bufOpts = [0, 5, 10, 15, 20, 30, 45, 60, 90, 120].concat([b.bufB, b.bufA]).filter((v, i, arr) => arr.indexOf(v) === i).sort((x, y) => x - y);
  const sel = (name, val) => `<select name="${name}">${bufOpts.map(v => `<option value="${v}" ${v === val ? "selected" : ""}>${v ? v + " min" : "None"}</option>`).join("")}</select>`;
  openSheet(`<form class="sheet av-form">${head(isNew ? "Add Shift or Work" : "Edit Availability")}
    <div class="sheet-body">${REQ_NOTE}
      <label class="f"><span class="lh">Type</span><select name="type">${AV_ORDER.map(k => `<option value="${k}" ${k === b.type ? "selected" : ""}>${esc(AVAIL.TYPES[k].label)}</option>`).join("")}</select></label>
      <p class="mini av-help" id="avHelp" style="margin:-4px 0 8px">${esc(AV_HELP[b.type])}</p>
      <div class="two">
        <label class="f"><span class="lh">Title ${REQ}</span><input type="text" name="title" required maxlength="80" value="${esc(b.title)}" autofocus placeholder="e.g. Hospital placement, Cafe shift, Soccer practice"></label>
        <label class="f">Color<input type="color" name="color" value="${esc(/^#[0-9a-f]{6}$/i.test(color) ? color : AVAIL.TYPES[b.type].color)}"></label>
      </div>
      <fieldset class="av-when"><legend>When</legend>
        ${seg("mode", [["weekly", "Every week"], ["dates", "Specific dates"], ["one", "One day"]], mode0)}
        <div class="av-pane" data-pane="weekly">
          <div class="meet-days" role="group" aria-label="Days of the week" id="avDays">${WEEK_ORDER.map(d => `<button type="button" data-day="${d}" aria-pressed="${days.includes(d)}">${DAY_SHORT[d]}</button>`).join("")}</div>
          <div class="two">
            <label class="f">Repeats<select name="every">${[1, 2, 3, 4].map(n => `<option value="${n}" ${b.every === n ? "selected" : ""}>${n === 1 ? "Every week" : "Every " + n + " weeks"}</option>`).join("")}</select></label>
            <label class="f av-pat">Which weeks<select name="pat"></select></label>
          </div>
          <div class="two">
            <label class="f">Term starts <span class="hint">optional</span><input type="date" name="from" value="${esc(b.from)}"></label>
            <label class="f">Term ends <span class="hint">optional</span><input type="date" name="until" value="${esc(b.until)}"></label>
          </div>
        </div>
        <div class="av-pane" data-pane="dates">
          <label class="f">Type or paste your roster <span class="hint">e.g. Mon Nov 3, Wed Nov 5, Sat Nov 8 or 11/10, 11/12-11/14</span><textarea name="roster" rows="2" maxlength="2000" placeholder="Mon Nov 3, Wed Nov 5, Sat Nov 8"></textarea></label>
          <div class="av-rrow"><button type="button" class="btn small" id="avAddRoster">Add These Dates</button><span class="mini" id="avRMsg" role="status" aria-live="polite"></span></div>
          <div class="av-cal" id="avCal"></div>
          <div class="av-dchips" id="avDChips" aria-label="Selected dates"></div>
        </div>
        <div class="av-pane" data-pane="one"><label class="f">Date<input type="date" name="date" value="${esc(b.dates[0] || today)}"></label></div>
      </fieldset>
      <fieldset class="av-time"><legend>Time</legend>
        <label class="mi-check"><input type="checkbox" name="allDay" ${b.allDay ? "checked" : ""}> All day</label>
        <div class="two av-times">
          <label class="f">Starts<input type="time" name="start" value="${esc(b.allDay ? "09:00" : b.start)}"></label>
          <label class="f">Ends<input type="time" name="end" value="${esc(b.allDay ? "17:00" : b.end)}"></label>
        </div>
        <p class="mini av-ovn" id="avOvn" role="status" aria-live="polite" style="margin:0 0 8px"></p>
        <div class="two av-buf"><label class="f">Travel before${sel("bufB", b.bufB)}</label><label class="f">Travel after${sel("bufA", b.bufA)}</label></div>
      </fieldset>
    </div>
    <div class="sheet-foot">${isNew ? "" : `<button type="button" class="btn danger" id="avDel">Delete</button><button type="button" class="btn" id="avDup">Duplicate</button>`}<span class="spacer"></span><button type="button" class="btn" data-act="close">Cancel</button><button type="button" class="btn primary" data-submit>${isNew ? "Add" : "Save"}</button></div>
  </form>`, fd => {
    const type = AVAIL.TYPES[fd.get("type")] ? String(fd.get("type")) : "work", allDay = !!fd.get("allDay"), start = String(fd.get("start") || ""), end = String(fd.get("end") || ""), mode = String(fd.get("mode") || "weekly");
    const title = String(fd.get("title") || "").trim() || AVAIL.TYPES[type].label;
    if (!allDay && (!AVAIL.isT(start) || !AVAIL.isT(end) || start === end)) { toast("Pick a start and an end time that are different"); return false; }
    const n = Object.assign(clone(b), {type, title, color: String(fd.get("color") || ""), allDay, start: allDay ? "00:00" : start, end: allDay ? "23:59" : end, bufB: Number(fd.get("bufB")) || 0, bufA: Number(fd.get("bufA")) || 0, created: b.created || Date.now()});
    if (mode === "weekly") {
      if (!days.length) { toast("Pick the days of the week"); return false; }
      const every = Number(fd.get("every")) || 1, pat = Math.min(every - 1, Number(fd.get("pat")) || 0);
      Object.assign(n, {days, dates: [], every, from: String(fd.get("from") || ""), until: String(fd.get("until") || ""), anchor: every > 1 ? AVAIL.addD(AVAIL.fromDn(AVAIL.monN(today)), 7 * pat) : ""});
      if (n.from && n.until && n.until < n.from) { toast("The term can't end before it starts"); return false; }
    } else if (mode === "one") {
      const d = String(fd.get("date") || ""); if (!AVAIL.isDate(d)) { toast("Pick the date"); return false; }
      Object.assign(n, {days: [], dates: [d], every: 1, from: "", until: "", anchor: ""});
    } else {
      if (!dates.length) { toast("Add at least one date to your roster"); return false; }
      Object.assign(n, {days: [], dates: dates.slice().sort(), every: 1, from: "", until: "", anchor: ""});
    }
    const cleaned = AVAIL.normBlock(n); if (!cleaned) { toast("That block never happens. Check the days and dates."); return false; }
    const list = availBlocks().filter(x => x.id !== cleaned.id).concat(cleaned);
    ui.schWeek = mondayOf(cleaned.dates[0] || (cleaned.from && cleaned.from > today ? cleaned.from : today));
    availCommit({blocks: list, cfg: availCfg()}, isNew ? `Added ${cleaned.title}` : `Saved ${cleaned.title}`);
  });
  const f = dlg.querySelector("form"), q = s => f.querySelector(s);
  const paneSync = () => { const m = f.elements.mode.value || mode0; f.querySelectorAll(".av-pane").forEach(p => { p.hidden = p.dataset.pane !== m; }); };
  f.querySelectorAll('input[name="mode"]').forEach(r => r.addEventListener("change", paneSync)); paneSync();
  const patSync = () => {
    const every = Number(f.elements.every.value) || 1, box = q(".av-pat"), s = f.elements.pat;
    box.hidden = every < 2;
    s.innerHTML = Array.from({length: every}, (_, i) => `<option value="${i}" ${i === Math.min(pat0, every - 1) ? "selected" : ""}>${i === 0 ? "This week, then every " + every + (every === 2 ? "nd" : every === 3 ? "rd" : "th") + " week" : i === 1 ? "Next week, then every " + every + (every === 2 ? "nd" : every === 3 ? "rd" : "th") + " week" : "In " + i + " weeks, then every " + every + "th week"}</option>`).join("");
    if (every === 2) s.innerHTML = `<option value="0" ${pat0 === 0 ? "selected" : ""}>This week and every other week (A weeks)</option><option value="1" ${pat0 === 1 ? "selected" : ""}>Next week and every other week (B weeks)</option>`;
  };
  f.elements.every.addEventListener("change", patSync); patSync();
  q("#avDays").addEventListener("click", e => { const x = e.target.closest("[data-day]"); if (!x) return; const d = Number(x.dataset.day); days = days.includes(d) ? days.filter(v => v !== d) : days.concat(d); x.setAttribute("aria-pressed", days.includes(d)); });
  const timeSync = () => {
    const ad = f.elements.allDay.checked; q(".av-times").hidden = ad; q(".av-buf").hidden = ad || f.elements.type.value === "protected" || f.elements.type.value === "travel";
    const s = f.elements.start.value, e = f.elements.end.value, note = q("#avOvn");
    note.textContent = ad ? "Blocks the whole day." : s && e && e < s ? `Overnight: blocks from ${fmtTime(s)} that evening until ${fmtTime(e)} the next morning.${cfg.recover ? " The morning after counts as recovery." : ""}` : "";
  };
  ["allDay", "start", "end", "type"].forEach(n => f.elements[n].addEventListener("change", timeSync)); timeSync();
  f.elements.color.addEventListener("input", () => { colorTouched = true; color = f.elements.color.value; });
  f.elements.type.addEventListener("change", () => {
    const t = f.elements.type.value; q("#avHelp").textContent = AV_HELP[t] || "";
    if (!colorTouched) f.elements.color.value = AVAIL.TYPES[t].color;
    if (t === "protected" || t === "travel") { f.elements.bufB.value = "0"; f.elements.bufA.value = "0"; }
    timeSync();
  });
  const calDraw = () => {
    const first = calM + "-01", lead = (AVAIL.dow(first) + 6) % 7, [y, m] = calM.split("-").map(Number), nxt = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, "0")}-01`, nd = AVAIL.dnum(nxt) - AVAIL.dnum(first);
    let cells = ""; for (let i = 0; i < lead; i++) cells += "<span></span>";
    for (let d = 1; d <= nd; d++) { const k = `${calM}-${String(d).padStart(2, "0")}`; cells += `<button type="button" data-d="${k}" aria-pressed="${dates.includes(k)}" aria-label="${esc(fmtDate(k))}"${k === today ? ' class="is-today"' : ""}>${d}</button>`; }
    q("#avCal").innerHTML = `<div class="av-cal-h"><button type="button" class="icon-btn" data-mv="-1" aria-label="Previous month">‹</button><b>${esc(parse(first).toLocaleDateString(undefined, {month: "long", year: "numeric"}))}</b><button type="button" class="icon-btn" data-mv="1" aria-label="Next month">›</button></div>
      <div class="av-cal-w" aria-hidden="true">${WEEK_ORDER.map(d => `<span>${DAY_SHORT[d]}</span>`).join("")}</div><div class="av-cal-g">${cells}</div>`;
    q("#avDChips").innerHTML = dates.length ? `<p class="mini" style="margin:6px 0 4px">${dates.length} date${dates.length === 1 ? "" : "s"} selected. Tap one to remove it.</p>` + dates.slice().sort().map(k => `<button type="button" class="av-dc" data-rm="${k}" aria-label="Remove ${esc(fmtDate(k))}">${esc(fmtDate(k))} ✕</button>`).join("") : `<p class="mini" style="margin:6px 0 0">No dates yet. Type them above or tap days on the calendar.</p>`;
  };
  q("#avCal").addEventListener("click", e => {
    const mv = e.target.closest("[data-mv]"); if (mv) { const [y, m] = calM.split("-").map(Number), dt = new Date(Date.UTC(y, m - 1 + Number(mv.dataset.mv), 1)); calM = dt.toISOString().slice(0, 7); calDraw(); return; }
    const x = e.target.closest("[data-d]"); if (!x) return; const k = x.dataset.d;
    dates = dates.includes(k) ? dates.filter(v => v !== k) : dates.length < AVAIL.MAX_DATES ? dates.concat(k) : dates; calDraw();
    const again = q(`#avCal [data-d="${k}"]`); if (again) again.focus();
  });
  q("#avDChips").addEventListener("click", e => { const x = e.target.closest("[data-rm]"); if (!x) return; dates = dates.filter(v => v !== x.dataset.rm); calDraw(); });
  q("#avAddRoster").addEventListener("click", () => {
    const r = AVAIL.parseDates(f.elements.roster.value, today), msg = q("#avRMsg");
    if (!r.dates.length) { msg.textContent = r.bad.length ? `Couldn't read: ${r.bad.slice(0, 3).join(", ")}` : "Type some dates first"; return; }
    const before = dates.length; dates = [...new Set(dates.concat(r.dates))].sort().slice(0, AVAIL.MAX_DATES); calM = r.dates[0].slice(0, 7);
    msg.textContent = `Added ${dates.length - before} date${dates.length - before === 1 ? "" : "s"}${r.bad.length ? `. Couldn't read: ${r.bad.slice(0, 3).join(", ")}` : ""}`;
    f.elements.roster.value = ""; calDraw();
  });
  calDraw();
  const del = q("#avDel"); if (del) del.addEventListener("click", () => { dlg.close(); availDelete(b.id); });
  const dup = q("#avDup"); if (dup) dup.addEventListener("click", () => { dlg.close(); availDuplicate(b.id); });
}
function availDelete(id){
  const b = availBlocks().find(x => x.id === id); if (!b) return;
  availCommit({blocks: availBlocks().filter(x => x.id !== id), cfg: availCfg()}, `Deleted ${b.title}`);
}
function availDuplicate(id){
  const b = availBlocks().find(x => x.id === id); if (!b) return;
  const n = Object.assign(clone(b), {id: uid(), title: b.title + " (copy)", skip: {}, created: Date.now()});
  availCommit({blocks: availBlocks().concat(n), cfg: availCfg()}, `Duplicated ${b.title}`);
  setTimeout(() => availForm(availBlocks().find(x => x.id === n.id) || n), 60);
}
// Tap a block on the schedule
function availOccSheet(id, key){
  const b = availBlocks().find(x => x.id === id); if (!b) return;
  const sk = b.skip[key], skipped = !!(sk && sk.skip), moved = !!(sk && !sk.skip);
  const st = moved ? sk.start : b.start, en = moved ? sk.end : b.end;
  openSheet(`<form class="sheet">${head(b.title)}
    <div class="sheet-body">
      <p class="mini" style="margin:0 0 10px">${esc(AVAIL.TYPES[b.type].label)}: usually ${esc(availSummary(b))}. Changes here only affect ${esc(fmtDate(key))}; every other day stays the same.${skipped ? " <b>Skipped this day.</b>" : moved ? " <b>Changed this day.</b>" : ""}</p>
      ${b.allDay ? "" : `<div class="two"><label class="f">Starts<input type="time" name="start" value="${esc(st)}" required></label><label class="f">Ends<input type="time" name="end" value="${esc(en)}" required></label></div>`}
    </div>
    <div class="sheet-foot occ-foot">
      <button type="button" class="btn" id="avSkip">${skipped ? "Don't Skip" : "Skip This Day"}</button>
      ${moved ? `<button type="button" class="btn" id="avReset">Reset to Usual Time</button>` : ""}
      <button type="button" class="btn" id="avAll">Edit All</button>
      ${b.allDay ? "" : `<button type="button" class="btn primary" data-submit>Save This Day</button>`}</div>
  </form>`, fd => {
    const s = String(fd.get("start") || ""), e = String(fd.get("end") || "");
    if (!AVAIL.isT(s) || !AVAIL.isT(e) || s === e) { toast("Pick a start and an end time that are different"); return false; }
    avSetSkip(b, key, s === b.start && e === b.end ? null : {start: s, end: e}, `${b.title} changed on ${fmtShort(key)}`);
  });
  $("#avSkip").addEventListener("click", () => { dlg.close(); avSetSkip(b, key, skipped ? null : {skip: true}, skipped ? `${b.title} is back on` : `Skipped ${b.title} on ${fmtShort(key)}`); });
  const r = $("#avReset"); if (r) r.addEventListener("click", () => { dlg.close(); avSetSkip(b, key, null, `${b.title} is back to its usual time`); });
  $("#avAll").addEventListener("click", () => { dlg.close(); setTimeout(() => availForm(b), 30); });
}
function avSetSkip(b, key, val, label){
  const n = clone(b); n.skip = Object.assign({}, n.skip); if (val) n.skip[key] = val; else delete n.skip[key];
  availCommit({blocks: availBlocks().map(x => x.id === b.id ? n : x), cfg: availCfg()}, label);
}
// Test and crunch-view hook
window.__sbAvail = {state: () => availState(), free: (d, nowMin) => availFreeDay(d, nowMin == null ? null : nowMin), occ: (a, b) => availOccs(a, b), plan: () => (FOCUS || computeFocus()).avail,
  // for tests
  view: o => { Object.assign(ui, o); render(); }, pomo: () => ({running: pomo.running, preset: pomo.preset, endAt: pomo.endAt, mode: pomo.mode, taskId: pomo.taskId}), pomoReset: () => { pomoReset(); const d = $("#pomoDlg"); if (d.open) d.close(); },
  exportArrays: () => exportArrays(), restore: availRestore, day: () => (FOCUS || computeFocus()).day.slice(0, 6)};
/* AVAIL-UI-END */

