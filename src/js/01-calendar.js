/* ===== module: 01-calendar.js: the app's core, calendar events, .ics import, daily quote, weekly schedule ===== */
/* Calendar events */
const eventsArr = () => Object.values(state.events || {});
const minToT = m => pad(Math.floor(m / 60)) + ":" + pad(m % 60);
const tToMin = t => { const [h, m] = String(t || "0:0").split(":").map(Number); return h * 60 + (m || 0); };
const EV_LABEL_CLASS = {Lecture: "k-lecture", Lab: "k-lab", Discussion: "k-discussion", Tutorial: "k-discussion", "Office Hours": "k-officehours"};
const wkDiff = (a, b) => Math.round((parse(mondayOf(a)) - parse(mondayOf(b))) / 6048e5);
// Every class meeting and event that lands between from and to (inclusive)
function schOccurrences(from, to){
  const out = [], lo = addDays(from, -7), hi = addDays(to, 7), inRange = d => d >= from && d <= to;
  coursesArr().forEach(c => courseMeetings(c).forEach(m => {
    for (let d = lo; d <= hi; d = addDays(d, 1)) {
      if (!m.days.includes(parse(d).getDay())) continue;
      const key = `${d}|${m.start}|${m.kind}`, mv = (c.meetMoves || {})[key];
      const o = {type: "meet", id: c.id, key, c, m, orig: d, date: d, start: m.start, end: m.end, moved: false, skipped: false, color: c.color, title: courseLabel(c), label: m.kind, where: m.where || "", cls: "k-" + m.kind.replace(/\s/g, "").toLowerCase()};
      if (mv) { if (mv.skip) o.skipped = true; else Object.assign(o, {date: mv.date || d, start: mv.start || m.start, end: mv.end || m.end, moved: true}); }
      if (inRange(o.date)) out.push(o);
    }
  }));
  eventsArr().forEach(ev => {
    const c = ev.courseId ? courseOf(ev.courseId) : null;
    const base = {type: "event", id: ev.id, ev, color: c ? c.color : "var(--accent)", title: ev.title, label: ev.label || "", course: c, where: ev.where || "", allDay: ev.allDay, cls: EV_LABEL_CLASS[ev.label] || "k-event"};
    const push = d => {
      if (ev.exdates.includes(d)) return;
      const mv = ev.moved[d], o = Object.assign({}, base, {key: d, orig: d, date: d, start: ev.start, end: ev.end, moved: false, skipped: false});
      if (mv) { if (mv.skip) o.skipped = true; else Object.assign(o, {date: mv.date || d, start: mv.start || ev.start, end: mv.end || ev.end, moved: true}); }
      if (inRange(o.date)) out.push(o);
    };
    if (!ev.repeat) {
      if (ev.allDay && ev.endDate && ev.endDate > ev.date) { for (let d = ev.date; d <= ev.endDate && d <= hi; d = addDays(d, 1)) if (inRange(d)) out.push(Object.assign({}, base, {key: d, orig: d, date: d, start: "", end: "", moved: false, skipped: false})); }
      else push(ev.date);
      return;
    }
    for (let d = lo > ev.date ? lo : ev.date; d <= hi; d = addDays(d, 1)) {
      if (ev.repeat.until && d > ev.repeat.until) break;
      if (!ev.repeat.days.includes(parse(d).getDay())) continue;
      if (ev.repeat.every > 1 && wkDiff(d, ev.date) % ev.repeat.every) continue;
      push(d);
    }
  });
  try { availOccs(from, to).forEach(o => out.push(o)); } catch(e) {}
  return out;
}
const occWhen = o => `${parse(o.date).toLocaleDateString(undefined, {weekday: "short", month: "short", day: "numeric"})}${o.allDay ? "" : `, ${fmtTime(o.start)}–${fmtTime(o.end)}`}`;
// Change one week's class or event without touching the others
function setOccurrence(type, id, key, val, label){
  if (type === "meet") {
    const c = state.courses[id]; if (!c) return;
    const n = clone(c); n.meetMoves = Object.assign({}, n.meetMoves || {});
    if (val) n.meetMoves[key] = val; else delete n.meetMoves[key];
    applyChanges([{kind: "course", id, after: n}], label);
  } else {
    const ev = state.events[id]; if (!ev) return;
    const n = clone(ev); n.moved = Object.assign({}, n.moved || {});
    if (val) n.moved[key] = val; else delete n.moved[key];
    applyChanges([{kind: "event", id, after: n}], label);
  }
}
function evInSeries(ev){
  if (!ev || ev.repeat || ev.allDay || !ev.start) return false;
  const tl = String(ev.title || "").trim().toLowerCase();
  return eventsArr().some(o => o.id !== ev.id && !o.repeat && !o.allDay && o.start === ev.start && String(o.title || "").trim().toLowerCase() === tl && (n => n !== 0 && n % 7 === 0 && Math.abs(n) <= 63)(dayDiff(o.date, ev.date)));
}
function findOcc(type, id, key){
  const d = type === "meet" ? key.split("|")[0] : key;
  return schOccurrences(addDays(d, -8), addDays(d, 8)).find(o => o.type === type && o.id === id && o.key === key) || null;
}
/* A class or event on the Schedule, shown in full */
function occView(type, id, key){
  if (type === "avail") { availOccSheet(id, key); return; }
  const ev0 = type === "event" ? state.events[id] : null;
  if (ev0 && window.SBPRO && SBPRO.extEventSheet && SBPRO.extEventSheet(ev0)) return;
  const o = findOcc(type, id, key); if (!o) { occSheet(type, id, key); return; }
  const c = o.c || o.course || null, ev = o.ev || null, m = o.m || null;
  const ic = d => `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const I = {cal: ic('<rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M3 10h18M8 3v4M16 3v4"/>'), clock: ic('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
    pin: ic('<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>'), rep: ic('<path d="M17 2l3 3-3 3"/><path d="M4 11V9a4 4 0 0 1 4-4h12M7 22l-3-3 3-3"/><path d="M20 13v2a4 4 0 0 1-4 4H4"/>'),
    person: ic('<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>'), book: ic('<path d="M4 19V5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M8 7h7"/>'),
    note: ic('<path d="M5 3h10l4 4v14H5z"/><path d="M9 11h6M9 15h6"/>'), link: ic('<path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/>')};
  const DAYS = ["Sundays", "Mondays", "Tuesdays", "Wednesdays", "Thursdays", "Fridays", "Saturdays"];
  const list = a => a.length < 2 ? a.join("") : a.slice(0, -1).join(", ") + " and " + a[a.length - 1];
  const daysOf = ds => list([...ds].sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7)).map(d => DAYS[d]));
  const mins = (a, b) => { if (!a || !b) return 0; const [h1, m1] = a.split(":").map(Number), [h2, m2] = b.split(":").map(Number); return h2 * 60 + m2 - (h1 * 60 + m1); };
  const dur = n => n <= 0 ? "" : n < 60 ? `${n} min` : `${Math.floor(n / 60)} h${n % 60 ? " " + (n % 60) + " min" : ""}`;
  const title = type === "meet" ? (c ? c.name || courseLabel(c) : o.title) : o.title;
  const kind = type === "meet" ? (m && m.kind) || "" : (o.label || "");
  const when = parse(o.date).toLocaleDateString(undefined, {weekday: "long", month: "long", day: "numeric"});
  const rows = [];
  rows.push([I.cal, esc(when), o.skipped ? "Skipped this week" : o.moved ? `Moved this week (usually ${esc(parse(o.orig).toLocaleDateString(undefined, {weekday: "short", month: "short", day: "numeric"}))})` : ""]);
  if (o.start && o.end) rows.push([I.clock, `${esc(fmtTime(o.start))} – ${esc(fmtTime(o.end))}`, esc(dur(mins(o.start, o.end)))]);
  else rows.push([I.clock, "All day", ""]);
  if (o.where) rows.push([I.pin, esc(o.where), ""]);
  if (m && m.days && m.days.length) rows.push([I.rep, `Every week on ${esc(daysOf(m.days))}`, ""]);
  else if (ev && ev.repeat && ev.repeat.days) rows.push([I.rep, `${ev.repeat.every > 1 ? `Every ${ev.repeat.every} weeks` : "Every week"} on ${esc(daysOf(ev.repeat.days))}`, ev.repeat.until ? `Until ${esc(fmtShort(ev.repeat.until))}` : ""]);
  if (c && c.instructor) rows.push([I.person, esc(c.instructor), "Instructor"]);
  if (c && type === "event") rows.push([I.book, esc(c.name || courseLabel(c)), esc(c.code && c.name ? c.code : "")]);
  if (ev && ev.notes) rows.push([I.note, `<span class="occv-notes">${esc(ev.notes)}</span>`, ""]);
  const url = ev && ev.url && /^https:\/\//i.test(ev.url) ? ev.url : "";
  if (url) rows.push([I.link, `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">Open link</a>`, ""]);
  const band = c ? `<span class="occv-ic" aria-hidden="true">${courseRingHtml(c)}</span><b>${esc(courseLabel(c))}</b>` : `<span class="occv-ic" aria-hidden="true">${I.cal}</span><b>Event</b>`;
  openSheet(`<div class="sheet occv" style="--c:${esc(String(o.color || "var(--accent)"))}">
    <div class="occv-band">${band}<button type="button" class="icon-btn occv-x" data-act="close" aria-label="Close">${CLOSE}</button></div>
    <div class="sheet-body occv-body">
      <h2 class="occv-title">${esc(title)}</h2>
      ${kind || o.skipped || o.moved ? `<div class="occv-tags">${kind ? `<span class="occv-tag">${esc(kind)}</span>` : ""}${o.skipped ? `<span class="occv-tag warn">Skipped this week</span>` : o.moved ? `<span class="occv-tag">Moved this week</span>` : ""}</div>` : ""}
      <ul class="occv-rows">${rows.map(([i, a, b]) => `<li><span class="occv-ri">${i}</span><div><b>${a}</b>${b ? `<span>${b}</span>` : ""}</div></li>`).join("")}</ul>
    </div>
    <div class="sheet-foot"><span class="spacer"></span><button type="button" class="btn" data-act="close">Close</button><button type="button" class="btn primary" id="occEdit">Edit</button></div>
  </div>`);
  const b = $("#occEdit"); if (b) b.addEventListener("click", () => { dlg.close(); setTimeout(() => occSheet(type, id, key), 30); });
}
function occSheet(type, id, key){
  if (type === "avail") { availOccSheet(id, key); return; }
  if (type === "event" && state.events[id] && !state.events[id].repeat && !evInSeries(state.events[id])) { eventForm(state.events[id]); return; }
  const o = findOcc(type, id, key); if (!o) return;
  const usual = type === "meet" ? {date: o.orig, start: o.m.start, end: o.m.end} : {date: o.orig, start: o.ev.start, end: o.ev.end};
  const name = `${o.title}${o.label && o.label !== o.title ? " " + o.label : ""}`;
  openSheet(`<form class="sheet">${head(name)}
    <div class="sheet-body">
      <p class="mini" style="margin:0 0 10px">Usually ${esc(parse(usual.date).toLocaleDateString(undefined, {weekday: "long"}))}s, ${esc(fmtTime(usual.start))}–${esc(fmtTime(usual.end))}${o.where ? `, ${esc(o.where)}` : ""}. Changes here only affect the week of ${esc(fmtShort(o.orig))}; every other week stays the same.${o.skipped ? " <b>Skipped this week.</b>" : o.moved ? " <b>Moved this week.</b>" : ""}</p>
      <div class="two">
        <label class="f">Date<input type="date" name="date" value="${esc(o.skipped ? usual.date : o.date)}" required></label>
        <span></span>
      </div>
      <div class="two">
        <label class="f">Starts<input type="time" name="start" value="${esc(o.skipped ? usual.start : o.start)}" required></label>
        <label class="f">Ends<input type="time" name="end" value="${esc(o.skipped ? usual.end : o.end)}" required></label>
      </div>
      <p class="mini" style="margin:6px 0 0">Tip: on the schedule you can also drag a class to a new time or day.</p>
    </div>
    <div class="sheet-foot occ-foot">
      <button type="button" class="btn" id="occSkip">${o.skipped ? "Don't Skip" : "Skip This Week"}</button>
      ${o.moved ? `<button type="button" class="btn" id="occReset">Reset to Usual Time</button>` : ""}
      <button type="button" class="btn" id="occAll">${type === "meet" ? "Edit All Weeks" : "Edit Event"}</button>
      <button type="button" class="btn primary" data-submit>Save This Week</button></div>
  </form>`, fd => {
    const date = String(fd.get("date") || ""), start = String(fd.get("start") || ""), end = String(fd.get("end") || "");
    if (!isDate(date) || !start || !end || end <= start) { toast("Pick a date, and an end time after the start"); return false; }
    const same = date === usual.date && start === usual.start && end === usual.end;
    setOccurrence(type, id, key, same ? null : {date, start, end}, same ? `${name} is back to its usual time` : `Moved ${name} to ${fmtShort(date)}, ${fmtTime(start)} (this week only)`);
  });
  $("#occSkip").addEventListener("click", () => { dlg.close(); setOccurrence(type, id, key, o.skipped ? null : {skip: true}, o.skipped ? `${name} is back on` : `Skipped ${name} on ${fmtShort(o.orig)}`); });
  const r = $("#occReset"); if (r) r.addEventListener("click", () => { dlg.close(); setOccurrence(type, id, key, null, `${name} is back to its usual time`); });
  $("#occAll").addEventListener("click", () => { dlg.close(); setTimeout(() => type === "meet" ? courseForm(state.courses[id]) : eventForm(state.events[id]), 30); });
}
function eventForm(ev, preset){
  if (ev && window.SBPRO && SBPRO.extEventSheet && SBPRO.extEventSheet(ev)) return;
  const isNew = !ev;
  ev = ev ? clone(ev) : normEvent(Object.assign({title: "", date: todayISO(), start: "10:00", end: "11:00"}, preset || {}));
  const rp = ev.repeat, days = rp ? rp.days : [parse(ev.date).getDay()];
  openSheet(`<form class="sheet">${head(isNew ? "New Event" : "Edit Event")}
    <div class="sheet-body">${REQ_NOTE}
      <label class="f"><span class="lh">Title ${REQ}</span><input type="text" name="title" required maxlength="120" value="${esc(ev.title)}" autofocus placeholder="e.g. Advisor meeting, Work shift, Study group"></label>
      <div class="two">
        <label class="f">Course<select name="courseId"><option value="">No course</option>${coursesArr().map(c => `<option value="${esc(c.id)}" ${c.id === ev.courseId ? "selected" : ""}>${esc(courseLabel(c))}</option>`).join("")}</select></label>
        <label class="f">Where<input type="text" name="where" maxlength="80" value="${esc(ev.where)}"></label>
      </div>
      <div class="two">
        <label class="f">Date<input type="date" name="date" required value="${esc(ev.date)}"></label>
        <label class="mi-check" style="align-self:end;padding-bottom:10px"><input type="checkbox" name="allDay" ${ev.allDay ? "checked" : ""}> All day</label>
      </div>
      <div class="two ev-times">
        <label class="f">Starts<input type="time" name="start" value="${esc(ev.start || "10:00")}"></label>
        <label class="f">Ends<input type="time" name="end" value="${esc(ev.end || "11:00")}"></label>
      </div>
      <label class="f">Repeats<select name="rep"><option value="">Doesn't repeat</option><option value="1" ${rp && rp.every === 1 ? "selected" : ""}>Every week</option><option value="2" ${rp && rp.every === 2 ? "selected" : ""}>Every 2 weeks</option></select></label>
      <div class="ev-rep" ${rp ? "" : "hidden"}>
        <div class="meet-days" role="group" aria-label="Days" id="evDays">${WEEK_ORDER.map(d => `<button type="button" data-day="${d}" aria-pressed="${days.includes(d)}">${DAY_SHORT[d]}</button>`).join("")}</div>
        <label class="f">Until <span class="hint">optional</span><input type="date" name="until" value="${esc(rp ? rp.until : "")}"></label>
      </div>
      <label class="f">Notes<textarea name="notes" maxlength="4000">${esc(ev.notes)}</textarea></label>
    </div>
    <div class="sheet-foot">${isNew ? "" : `<button type="button" class="btn danger" id="evDel">Delete</button>`}<span class="spacer"></span><button type="button" class="btn" data-act="close">Cancel</button><button type="button" class="btn primary" data-submit>${isNew ? "Add Event" : "Save Event"}</button></div>
  </form>`, fd => {
    const title = String(fd.get("title") || "").trim(); if (!title) return false;
    const allDay = !!fd.get("allDay"), start = String(fd.get("start") || ""), end = String(fd.get("end") || ""), rep = Number(fd.get("rep") || 0);
    if (!allDay && (!start || !end || end <= start)) { toast("The event needs to end after it starts"); return false; }
    if (rep && !pickDays.length) { toast("Pick the days it repeats on"); return false; }
    const n = normEvent(Object.assign(clone(ev), {title, courseId: fd.get("courseId") || "", where: String(fd.get("where") || "").trim(), date: String(fd.get("date")), allDay, start: allDay ? "" : start, end: allDay ? "" : end,
      repeat: rep ? {days: pickDays, every: rep, until: String(fd.get("until") || "")} : null, notes: String(fd.get("notes") || "")}));
    if (isNew) n.id = uid();
    applyChanges([{kind: "event", id: n.id, after: n}], isNew ? `Added ${title}` : "Event saved");
    ui.schWeek = mondayOf(n.date);
  });
  let pickDays = days.slice();
  const f = dlg.querySelector("form"), repSel = f.elements.rep, box = f.querySelector(".ev-rep"), times = f.querySelector(".ev-times"), ad = f.elements.allDay;
  const sync = () => { box.hidden = !repSel.value; times.hidden = ad.checked; };
  repSel.addEventListener("change", sync); ad.addEventListener("change", sync); sync();
  $("#evDays").addEventListener("click", e => { const b = e.target.closest("[data-day]"); if (!b) return; const d = Number(b.dataset.day); pickDays = pickDays.includes(d) ? pickDays.filter(x => x !== d) : pickDays.concat(d); b.setAttribute("aria-pressed", pickDays.includes(d)); });
  const del = $("#evDel"); if (del) del.addEventListener("click", () => { dlg.close(); applyChanges([{kind: "event", id: ev.id, after: null}], `Deleted ${ev.title}`); });
}

/* Drag a class, event or exam on the schedule to a new time or day */
let schDragEnd = 0;
(function schDrag(){
  let st = null;
  const reset = () => { if (st) { clearTimeout(st.timer); if (st.started) scheduleRender(); } st = null; document.body.classList.remove("sch-dragging"); };
  const begin = () => {
    st.started = true; const b = st.b;
    st.col0 = b.parentElement; st.top0 = parseFloat(b.style.top) || 0;
    st.dur = Number(b.dataset.dur) || 60;
    b.classList.add("dragging"); document.body.classList.add("sch-dragging");
    b.style.left = "2px"; b.style.width = "calc(100% - 4px)";
    if (!b.querySelector(".sch-dt")) b.insertAdjacentHTML("beforeend", `<em class="sch-dt"></em>`);
    try { navigator.vibrate && navigator.vibrate(8); } catch(e) {}
  };
  document.addEventListener("pointerdown", e => {
    const b = e.target.closest && e.target.closest(".sch-b[data-drag]"); if (!b || e.button > 0) return;
    const grid = b.closest(".sch-grid"); if (!grid) return;
    st = {b, grid, x0: e.clientX, y0: e.clientY, pid: e.pointerId, touch: e.pointerType !== "mouse", started: false};
    if (st.touch) st.timer = setTimeout(() => { if (st && !st.started) begin(); }, 380);
  });
  document.addEventListener("touchmove", e => { if (st && st.started) e.preventDefault(); }, {passive: false});
  document.addEventListener("pointermove", e => {
    if (!st || e.pointerId !== st.pid) return;
    const dx = e.clientX - st.x0, dy = e.clientY - st.y0;
    if (!st.started) {
      if (st.touch) { if (Math.hypot(dx, dy) > 8) { clearTimeout(st.timer); st = null; } return; }
      if (Math.hypot(dx, dy) < 6) return;
      begin();
    }
    e.preventDefault();
    const cols = [...st.grid.querySelectorAll(".sch-col")].filter(c => c.offsetParent !== null);
    const col = cols.find(c => { const r = c.getBoundingClientRect(); return e.clientX >= r.left && e.clientX < r.right; }) || st.b.parentElement;
    const pph = Number(st.grid.dataset.pph), h0 = Number(st.grid.dataset.h0), h1 = Number(st.grid.dataset.h1);
    let m = Math.round((h0 * 60 + (st.top0 + dy) / pph * 60) / 5) * 5;
    m = Math.max(h0 * 60, Math.min(h1 * 60 - Math.min(st.dur, 60), m));
    if (col !== st.b.parentElement) col.appendChild(st.b);
    st.b.style.top = ((m - h0 * 60) / 60 * pph) + "px";
    const end = Math.min(24 * 60 - 1, m + st.dur);
    st.target = {date: col.dataset.date, start: minToT(m), end: minToT(end)};
    st.b.querySelector(".sch-dt").textContent = `${parse(col.dataset.date).toLocaleDateString(undefined, {weekday: "short"})} ${fmtTime(st.target.start)}–${fmtTime(st.target.end)}`;
  }, {passive: false});
  document.addEventListener("pointerup", e => {
    if (!st || e.pointerId !== st.pid) return;
    const s = st; clearTimeout(s.timer);
    if (!s.started) { st = null; return; }
    schDragEnd = Date.now(); st = null; document.body.classList.remove("sch-dragging");
    if (!s.target) { scheduleRender(); return; }
    schDrop(s.b.dataset.type, s.b.dataset.id, s.b.dataset.key, s.target);
  });
  document.addEventListener("pointercancel", reset);
  document.addEventListener("keydown", e => { if (e.key === "Escape" && st && st.started) reset(); });
  document.addEventListener("click", e => { if (Date.now() - schDragEnd < 350 && e.target.closest && e.target.closest(".sch-b")) { e.preventDefault(); e.stopPropagation(); } }, true);
  document.addEventListener("contextmenu", e => { if (st && st.touch && e.target.closest && e.target.closest(".sch-b[data-drag]")) e.preventDefault(); });
})();
function schDrop(type, id, key, tg){
  const when = `${parse(tg.date).toLocaleDateString(undefined, {weekday: "short"})} ${fmtTime(tg.start)}`;
  if (type === "task") {
    const t = state.tasks[id]; if (!t) return;
    if (t.due === tg.date && t.time === tg.start) { scheduleRender(); return; }
    applyChanges([{kind: "task", id, after: Object.assign(clone(t), {due: tg.date, time: tg.start})}], `Moved ${t.title} to ${when}`);
    return;
  }
  if (type === "event" && state.events[id] && !state.events[id].repeat && !evInSeries(state.events[id])) {
    const ev = state.events[id];
    if (ev.date === tg.date && ev.start === tg.start) { scheduleRender(); return; }
    applyChanges([{kind: "event", id, after: Object.assign(clone(ev), {date: tg.date, start: tg.start, end: tg.end})}], `Moved ${ev.title} to ${when}`);
    return;
  }
  const o = findOcc(type, id, key); if (!o) { scheduleRender(); return; }
  const usual = type === "meet" ? {date: o.orig, start: o.m.start} : {date: o.orig, start: o.ev.start};
  if (tg.date === o.date && tg.start === o.start) { scheduleRender(); return; }
  const back = tg.date === usual.date && tg.start === usual.start;
  const name = `${o.title}${o.label && o.label !== o.title ? " " + o.label : ""}`;
  setOccurrence(type, id, key, back ? null : tg, back ? `${name} is back to its usual time` : `Moved ${name} to ${when}, this week only`);
}

/* Import from Apple Calendar or any .ics file */
function icsParse(text){
  const lines = String(text).replace(/\r\n[ \t]/g, "").replace(/\n[ \t]/g, "").split(/\r?\n/);
  const items = [], stack = []; let cur = null;
  for (const raw of lines) {
    const i = raw.indexOf(":"); if (i < 0) continue;
    const left = raw.slice(0, i), val = raw.slice(i + 1), parts = left.split(";"), N = parts[0].toUpperCase();
    if (N === "BEGIN") { const v = val.trim().toUpperCase(); stack.push(v); if (v === "VEVENT" || v === "VTODO") cur = {type: v, props: {}}; continue; }
    if (N === "END") { const v = stack.pop(); if (cur && v === cur.type) { items.push(cur); cur = null; } continue; }
    if (!cur || stack[stack.length - 1] !== cur.type) continue;
    const p = {}; parts.slice(1).forEach(x => { const j = x.indexOf("="); if (j > 0) p[x.slice(0, j).toUpperCase()] = x.slice(j + 1).replace(/^"|"$/g, ""); });
    (cur.props[N] = cur.props[N] || []).push({v: val, p});
  }
  return items;
}
const icsTxt = s => scrubText(String(s || "").replace(/\\n/gi, "\n").replace(/\\([,;\\])/g, "$1").trim(), false);
function icsTz(y, mo, d, h, mi, tz){
  try {
    const f = new Intl.DateTimeFormat("en-US", {timeZone: tz.replace(/^\//, ""), hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit"});
    const off = ms => { const P = {}; f.formatToParts(new Date(ms)).forEach(x => { P[x.type] = x.value; }); return Date.UTC(+P.year, +P.month - 1, +P.day, +P.hour % 24, +P.minute) - Math.floor(ms / 6e4) * 6e4; };
    const guess = Date.UTC(y, mo - 1, d, h, mi); let t = guess - off(guess); const o2 = off(t); if (guess - o2 !== t) t = guess - o2;
    return new Date(t);
  } catch(e) { return new Date(y, mo - 1, d, h, mi); }
}
function icsWhen(x){
  if (!x) return null;
  const m = String(x.v).trim().match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?/); if (!m) return null;
  if (!m[4]) return {date: `${m[1]}-${m[2]}-${m[3]}`, time: "", allDay: true};
  const d = m[7] ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5])) : x.p.TZID ? icsTz(+m[1], +m[2], +m[3], +m[4], +m[5], x.p.TZID) : new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
  const hz = (m[7] || x.p.TZID) && window.SBTZ && SBTZ.schoolZone(), w = hz && SBTZ.wallIn(d.getTime(), hz);
  if (w) return {date: w.date, time: w.time, allDay: false, ms: d.getTime()};
  return {date: iso(d), time: pad(d.getHours()) + ":" + pad(d.getMinutes()), allDay: false, ms: d.getTime()};
}
const icsDur = s => { const m = String(s || "").match(/P(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?)?/); return m ? ((+m[1] || 0) * 7 * 1440 + (+m[2] || 0) * 1440 + (+m[3] || 0) * 60 + (+m[4] || 0)) : 0; };
const ICS_DAY = {SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6};
const TASK_RX = /\b(exam|midterm|final exam|finals?|quiz(?:zes)?|test|due|deadline|assignment|homework|hw\s?\d*|problem set|p-?set|project|paper|essay|lab report|presentation|submission|submit)\b/i;
// Something about an exam that isn't the exam itself, told by where the words sit
const notSitting = s => { const t = String(s || "").replace(/\s+/g, " ");
  return /\b(exams?|examination|midterms?|mid-term|finals?|tests?|quiz(zes)?)(\s+exam)?\s*[-:]?\s*(review|prep|preparation|tutorial|workshop|study\s+session|info(rmation)?\s+session|walk-?through|debrief|q\s*&\s*a|results|feedback|solutions?|answer\s+key|registration|sign[- ]?up|booking|accommodations?|reflection|grades|marks|scores|viewing|overview)\b/i.test(t)
    || /\b(review|prep|preparation|help|study|info(rmation)?|tutorial|catch-?up)\s+(session|class|lecture|workshop|day)\b/i.test(t)
    || /^\s*(review|prep|preparation|practice|mock|sample)\b/i.test(t)
    || /(^|[-:(\[\d]\s*|\b(a|the)\s+)(practice|mock|sample)\s+(exams?|examination|midterms?|finals?|tests?|quiz(zes)?|questions|problems)\b/i.test(t)
    || /\b(mock|sample)\s+(exams?|midterms?|finals?|tests?|quiz(zes)?)\b/i.test(t)
    || /\b(study\s+guide|office\s+hours|exam\s+schedule|exam\s+timetable)\b/i.test(t); };
const NOT_SITTING = {test: notSitting};
// An exam or test you sit
const isExamSitting = s => { const t = String(s || ""); if (notSitting(t)) return false;
  if (/\b(midterm|mid-term|final)\b(\s+\w+)?\s+(project|paper|essay|report|reflection|presentation|portfolio|assignment|draft|submission|video|poster|demo|journal|case\s+study|care\s+plan|lab\s+report|proposal)\b/i.test(t)) return false;
  return /\b(exams?|examination|midterms?|mid-term|tests?|finals?)\b/i.test(t); };
const guessTaskType = s => isExamSitting(s) && /\b(exams?|examination|midterms?|mid-term)\b/i.test(s) ? "Exam" : /\bquiz/i.test(s) && !notSitting(s) ? "Quiz" : isExamSitting(s) ? "Exam" : /\bproject|presentation\b/i.test(s) ? "Project" : /\blab\b/i.test(s) ? "Lab" : /\bread/i.test(s) ? "Reading" : "Assignment";
const guessMeetLabel = s => /office\s*hours?|\bOH\b/i.test(s) ? "Office Hours" : /\blab\b/i.test(s) ? "Lab" : /tutorial|\btut\b/i.test(s) ? "Tutorial" : /discussion|recitation|\bsection\b|\bdis\b/i.test(s) ? "Discussion" : /lecture|\blec\b|\bclass\b/i.test(s) ? "Lecture" : "";
const codeKey = s => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
// Turns calendar entries into Studyboard events and tasks
function icsPlan(text){
  const raw = icsParse(text), today = todayISO(), out = [], overrides = [];
  raw.forEach(it => {
    const g = k => (it.props[k] || [])[0], txt = k => icsTxt(g(k) && g(k).v);
    const status = txt("STATUS").toUpperCase(), uidv = txt("UID") || uid();
    if (it.type === "VEVENT" && g("RECURRENCE-ID")) { overrides.push({uid: uidv, rid: icsWhen(g("RECURRENCE-ID")), s: icsWhen(g("DTSTART")), e: icsWhen(g("DTEND")), dur: icsDur(txt("DURATION")), cancel: status === "CANCELLED"}); return; }
    if (status === "CANCELLED") return;
    const title = txt("SUMMARY").replace(/\s+/g, " ").trim() || "Untitled";
    if (it.type === "VTODO") {
      const due = icsWhen(g("DUE")) || icsWhen(g("DTSTART")); if (!due) return;
      out.push({kind: "task", uid: uidv, title, due: due.date, time: due.allDay ? "" : due.time, notes: txt("DESCRIPTION"), where: txt("LOCATION"), done: status === "COMPLETED", past: due.date < addDays(today, -30)});
      return;
    }
    const s = icsWhen(g("DTSTART")); if (!s) return;
    let e = icsWhen(g("DTEND")); const dur = icsDur(txt("DURATION"));
    let end = "", endDate = "";
    if (s.allDay) { if (e && e.date > addDays(s.date, 1)) endDate = addDays(e.date, -1); }
    else if (e && e.ms) end = e.date === s.date ? e.time : "23:59"; else end = minToT(Math.min(1439, tToMin(s.time) + (dur || 60)));
    let repeat = null, until = "", note = "";
    const rr = txt("RRULE");
    if (rr) {
      const R = {}; rr.split(";").forEach(kv => { const [k, v] = kv.split("="); R[(k || "").toUpperCase()] = v || ""; });
      const iv = Math.max(1, Math.min(4, Number(R.INTERVAL) || 1));
      if (R.UNTIL) { const u = icsWhen({v: R.UNTIL, p: {}}); until = u ? u.date : ""; }
      if (R.FREQ === "WEEKLY" || R.FREQ === "DAILY") {
        const days = R.FREQ === "DAILY" ? [0, 1, 2, 3, 4, 5, 6] : (R.BYDAY ? R.BYDAY.split(",").map(x => ICS_DAY[x.replace(/^[-+\d]+/, "").toUpperCase()]).filter(x => x != null) : [parse(s.date).getDay()]);
        repeat = {days: [...new Set(days)], every: R.FREQ === "DAILY" ? 1 : iv, until};
        if (R.COUNT && !until) { let n = Number(R.COUNT), d = s.date, last = s.date; for (let guard = 0; n > 0 && guard < 3000; guard++, d = addDays(d, 1)) { if (repeat.days.includes(parse(d).getDay()) && !(repeat.every > 1 && wkDiff(d, s.date) % repeat.every)) { n--; last = d; } } repeat.until = last; }
      } else if (R.FREQ === "YEARLY") {
        let d = s.date; for (let g = 0; d < today && g < 200; g++) d = `${Number(d.slice(0, 4)) + 1}${d.slice(4)}`;
        note = "Repeats every year; only the next one was added."; s.date = d;
      } else note = "Repeats monthly; only the first one was added.";
    }
    const exd = []; (it.props.EXDATE || []).forEach(x => String(x.v).split(",").forEach(v => { const w = icsWhen({v, p: x.p}); if (w) exd.push(w.date); }));
    const lastDate = repeat ? (repeat.until || "9999-12-31") : (endDate || s.date);
    const past = lastDate < addDays(today, -30);
    const isTask = !repeat && TASK_RX.test(title);
    out.push({kind: isTask ? "task" : "event", uid: uidv, title, date: s.date, endDate, allDay: s.allDay, start: s.allDay ? "" : s.time, end: s.allDay ? "" : end, repeat, exdates: exd, where: txt("LOCATION"), notes: [txt("DESCRIPTION"), note].filter(Boolean).join("\n\n"), past, label: guessMeetLabel(title)});
  });
  overrides.forEach(ov => {
    const it = out.find(x => x.uid === ov.uid && x.repeat); if (!it || !ov.rid) return;
    it.moved = it.moved || {};
    if (ov.cancel) { it.exdates.push(ov.rid.date); return; }
    if (ov.s) { const end = ov.e && ov.e.ms ? ov.e.time : minToT(Math.min(1439, tToMin(ov.s.time) + (ov.dur || tToMin(it.end) - tToMin(it.start)))); it.moved[ov.rid.date] = {date: ov.s.date, start: ov.s.time, end}; }
  });
  const cs = coursesArr(), newCourses = {};
  out.forEach(it => {
    const hay = codeKey(it.title), c = cs.find(c => c.code && codeKey(c.code).length >= 3 && hay.includes(codeKey(c.code))) || cs.find(c => c.name && c.name.length > 3 && it.title.toLowerCase().includes(c.name.toLowerCase()));
    if (c) { it.courseId = c.id; return; }
    const m = it.title.match(/\b([A-Z]{2,5})\s?-?(\d{2,4}[A-Z]?)\b/);
    if (m && (it.repeat || it.kind === "task")) { const code = `${m[1]} ${m[2]}`; newCourses[code] = (newCourses[code] || 0) + 1; it.newCourse = code; }
  });
  return {items: out, newCourses};
}
// Which calendar a file is
function icsSrcKey(text, fileName){
  const m = String(text).match(/^X-WR-CALNAME[^:\r\n]*:([^\r\n]*)/mi);
  const n = (m && icsTxt(m[1])) || String(fileName || "").replace(/\.(ics|ical|icalendar|ifb)$/i, "").replace(/\s*\(\d+\)$/, "");
  return n.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().slice(0, 80) || "calendar";
}
function icsImportSheet(text, fileName){
  let plan;
  try { plan = icsPlan(text); } catch(e) { console.warn(e); toast("That file isn't a calendar file Studyboard can read"); return; }
  if (!plan.items.length) { toast("No events or to-dos were found in that file"); return; }
  const its = plan.items;
  const src = icsSrcKey(text, fileName);
  const mine = x => x.icsUid && (x.icsSrc ? x.icsSrc === src : true);
  const evByUid = {}, tByUid = {};
  eventsArr().forEach(e => { if (mine(e)) (evByUid[e.icsUid] = evByUid[e.icsUid] || []).push(e); });
  allTasks().forEach(t => { if (mine(t)) (tByUid[t.icsUid] = tByUid[t.icsUid] || []).push(t); });
  const pick = (L, it) => L ? (L.find(x => x.icsSrc === src) || L.find(x => !x.icsSrc && x.title === it.title)) : undefined;
  const existingEv = {}, existingT = {};
  its.forEach(it => { const e = pick(evByUid[it.uid], it), t = pick(tByUid[it.uid], it); if (e) existingEv[it.uid] = e; if (t) existingT[it.uid] = t; });
  const whenOf = it => it.kind === "task" && !it.date ? `Due ${fmtShort(it.due)}${it.time ? " " + fmtTime(it.time) : ""}` : it.repeat ? `${it.repeat.every === 2 ? "Every 2 weeks" : "Every week"} on ${daysLabel(it.repeat.days)}${it.allDay ? "" : `, ${fmtTime(it.start)}–${fmtTime(it.end)}`}${it.repeat.until ? `, until ${fmtShort(it.repeat.until)}` : ""}` : `${fmtShort(it.date)}${it.allDay ? (it.endDate ? ` to ${fmtShort(it.endDate)}` : ", all day") : `, ${fmtTime(it.start)}–${fmtTime(it.end)}`}`;
  const courseName = it => it.courseId ? courseLabel(courseOf(it.courseId)) : it.newCourse ? `${it.newCourse} (new)` : "";
  const ncs = Object.entries(plan.newCourses);
  openSheet(`<form class="sheet ics-sheet">${head("Import Calendar")}
    <div class="sheet-body">
      <p class="mini" style="margin:0 0 8px">From <b>${esc(fileName || "your calendar")}</b>. Classes, appointments and other events go on your Schedule; exams, quizzes and anything due become tasks. Anything imported from this calendar before is updated, not added twice; other calendars you've imported aren't touched.</p>
      ${ncs.length ? `<fieldset><legend>New Courses</legend><div class="check-list">${ncs.map(([code, n]) => `<label class="mi-check"><input type="checkbox" name="nc" value="${esc(code)}" checked> Add ${esc(code)} as a course <span class="mini">${n} item${n === 1 ? "" : "s"}</span></label>`).join("")}</div></fieldset>` : ""}
      <label class="mi-check"><input type="checkbox" id="icsPast"> Include things that already happened <span class="mini">(older than a month)</span></label>
      <div class="ics-list" id="icsList"></div>
    </div>
    <div class="sheet-foot"><span class="mini" id="icsCount"></span><span class="spacer"></span><button type="button" class="btn" data-act="close">Cancel</button><button type="button" class="btn primary" data-submit>Import</button></div>
  </form>`, fd => {
    const past = $("#icsPast").checked, keep = new Set(fd.getAll("nc")), rows = [...dlg.querySelectorAll(".ics-row")];
    const ch = [], made = {};
    const courseFor = it => {
      if (it.courseId) return it.courseId;
      if (!it.newCourse || !keep.has(it.newCourse)) return "";
      if (made[it.newCourse]) return made[it.newCourse];
      const used = coursesArr().map(x => x.color).concat(Object.values(made).map(id => (ch.find(c => c.id === id) || {after: {}}).after.color));
      const nc = {id: uid(), created: Date.now(), name: it.newCourse, code: it.newCourse, instructor: "", schedule: "", room: "", office: "", color: COLORS.find(x => !used.includes(x)) || COLORS[used.length % COLORS.length], notes: "", links: [], meetings: []};
      ch.push({kind: "course", id: nc.id, after: nc}); made[it.newCourse] = nc.id; return nc.id;
    };
    let nE = 0, nT = 0, nU = 0;
    rows.forEach(r => {
      const it = its[Number(r.dataset.i)];
      if (!r.querySelector("input[type=checkbox]").checked || (it.past && !past)) return;
      const as = r.querySelector("select").value, courseId = courseFor(it);
      if (as === "task") {
        const prev = existingT[it.uid], due = it.due || it.date, time = it.time != null ? it.time : it.start;
        const t = prev ? Object.assign(clone(prev), {title: it.title, due, time: time || "", icsSrc: src}) : normTask({id: uid(), created: Date.now(), title: it.title, courseId, type: guessTaskType(it.title), due, time: time || "", location: it.where || "", notes: it.notes || "", status: it.done ? "done" : "todo", doneAt: it.done ? Date.now() : null, order: nextOrder(it.done ? "done" : "todo"), icsUid: it.uid, icsSrc: src});
        if (prev && JSON.stringify(prev) === JSON.stringify(t)) return;
        ch.push({kind: "task", id: t.id, after: t}); prev ? nU++ : nT++;
      } else {
        const prev = existingEv[it.uid];
        const ev = normEvent(Object.assign(prev ? clone(prev) : {id: uid(), created: Date.now(), src: "ics"}, {title: it.title, courseId: prev && prev.courseId && !courseId ? prev.courseId : courseId, label: it.label || "", date: it.date || it.due, endDate: it.endDate || "", allDay: !!it.allDay || !it.start, start: it.start || "", end: it.end || "", repeat: it.repeat, exdates: it.exdates || [], where: it.where || "", notes: prev && prev.notes ? prev.notes : (it.notes || ""), icsUid: it.uid, icsSrc: src,
          moved: Object.assign({}, it.moved || {}, prev ? prev.moved : {})}));
        if (prev && JSON.stringify(prev) === JSON.stringify(ev)) return;
        ch.push({kind: "event", id: ev.id, after: ev}); prev ? nU++ : nE++;
      }
    });
    if (!ch.length) { toast("Everything in that file is already here"); return; }
    const nC = Object.keys(made).length;
    const parts = [nE && `${nE} event${nE === 1 ? "" : "s"}`, nT && `${nT} task${nT === 1 ? "" : "s"}`, nC && `${nC} course${nC === 1 ? "" : "s"}`, nU && `${nU} updated`].filter(Boolean);
    applyChanges(ch, `Imported ${parts.join(", ")}`);
    const first = its.filter(it => it.kind === "event" && !it.past).map(it => it.date).sort().find(d => d >= mondayOf(todayISO()));
    ui.tab = "schedule"; ui.schWeek = mondayOf(first && first < addDays(todayISO(), 21) ? first : todayISO());
  });
  const list = $("#icsList"), count = $("#icsCount"), pastBox = $("#icsPast");
  const draw = () => {
    const past = pastBox.checked;
    const vis = its.map((it, i) => ({it, i})).filter(({it}) => past || !it.past).sort((a, b) => ((a.it.date || a.it.due) < (b.it.date || b.it.due) ? -1 : 1));
    list.innerHTML = vis.length ? vis.map(({it, i}) => `<div class="ics-row" data-i="${i}"><input type="checkbox" checked aria-label="Import ${esc(it.title)}">
      <div class="ics-main"><b>${esc(it.title)}</b><span class="mini">${esc(whenOf(it))}${courseName(it) ? ` · ${esc(courseName(it))}` : ""}${(it.kind === "task" ? existingT : existingEv)[it.uid] ? " · already imported" : ""}</span></div>
      <select aria-label="Import as"><option value="event" ${it.kind === "event" ? "selected" : ""}>Event</option><option value="task" ${it.kind === "task" ? "selected" : ""}>Task</option></select></div>`).join("")
      : `<p class="mini">Everything in this file happened more than a month ago. Tick the box above to include it.</p>`;
    const nPast = its.filter(it => it.past).length;
    count.textContent = `${vis.length} item${vis.length === 1 ? "" : "s"}${!past && nPast ? `, ${nPast} older hidden` : ""}`;
  };
  pastBox.addEventListener("change", draw); draw();
}
// One or several calendar files
function icsPick(){
  const inp = document.createElement("input"); inp.type = "file"; inp.multiple = true; inp.accept = ".ics,.ical,.ifb,.icalendar,text/calendar";
  inp.addEventListener("change", async () => {
    const all = [...(inp.files || [])], files = all.filter(f => f.size <= 8e6);
    if (files.length < all.length) toast(all.length === 1 ? "That calendar file is too big (over 8 MB)" : "Skipped a calendar file over 8 MB");
    const run = async i => {
      if (i >= files.length) return;
      let text = ""; try { text = await files[i].text(); } catch (e) { run(i + 1); return; }
      icsImportSheet(text, files[i].name);
      if (i + 1 >= files.length) return;
      if (dlg.open) dlg.addEventListener("close", () => setTimeout(() => run(i + 1), 60), {once: true}); else setTimeout(() => run(i + 1), 900);
    };
    run(0);
  });
  inp.click();
}
function icsHelpSheet(){
  openSheet(`<div class="sheet">${head("Import a Calendar")}
    <div class="sheet-body"><p style="margin-top:0">Studyboard reads calendar files (.ics), which Apple Calendar, Google Calendar and Outlook can all make.</p>
    <ul class="help-list">
      <li><b>Apple Calendar on a Mac:</b> select the calendar in the sidebar, then File &gt; Export &gt; Export.</li>
      <li><b>iPhone or iPad:</b> export from Calendar on a Mac, or from iCloud.com on a computer: share the calendar publicly, then open its link in a browser to download the .ics file.</li>
      <li><b>Google Calendar:</b> Settings &gt; Import &amp; export &gt; Export.</li>
      <li><b>Outlook:</b> File &gt; Save Calendar.</li>
      <li><b>Your school's portal:</b> many have an "Export" or "Download .ics" button for your class schedule.</li>
    </ul>
    <p class="mini">Repeating classes stay repeating, so you can still move just one week. Importing the same file again updates what's already here.</p></div>
    <div class="sheet-foot"><span class="spacer"></span><button type="button" class="btn" data-act="close">Cancel</button><button type="button" class="btn primary" id="icsGo">Choose a File</button></div></div>`);
  $("#icsGo").addEventListener("click", () => { dlg.close(); icsPick(); });
}

/* Daily quote and progress streak */
const DAILY_QUOTES = [
  ["A journey of a thousand miles begins with a single step.", "Laozi"],
  ["Well begun is half done.", "Aristotle"],
  ["The beginning is the most important part of the work.", "Plato"],
  ["You may encounter many defeats, but you must not be defeated.", "Maya Angelou"],
  ["Start where you are. Use what you have. Do what you can.", "Arthur Ashe"],
  ["You gain strength, courage and confidence by every experience in which you really stop to look fear in the face.", "Eleanor Roosevelt"],
  ["The beautiful thing about learning is that nobody can take it away from you.", "B.B. King"],
  ["Education is the most powerful weapon which you can use to change the world.", "Nelson Mandela"],
  ["Genius is one percent inspiration and ninety-nine percent perspiration.", "Thomas Edison"],
  ["Nothing in life is to be feared, it is only to be understood. Now is the time to understand more, so that we may fear less.", "Marie Curie"],
  ["I'm not afraid of storms, for I'm learning how to sail my ship.", "Louisa May Alcott"],
  ["The roots of education are bitter, but the fruit is sweet.", "Aristotle"],
  ["We are what we repeatedly do. Excellence, then, is not an act, but a habit.", "Will Durant"],
  ["The more that you read, the more things you will know. The more that you learn, the more places you'll go.", "Dr. Seuss"],
  ["If you can't fly, then run. If you can't run, then walk. If you can't walk, then crawl. But whatever you do, you have to keep moving forward.", "Martin Luther King Jr."],
  ["Never give in, never give in, never, never, never, never.", "Winston Churchill"],
  ["The only way to do great work is to love what you do.", "Steve Jobs"],
  ["The best way to predict the future is to invent it.", "Alan Kay"],
  ["It is hard to fail, but it is worse never to have tried to succeed.", "Theodore Roosevelt"],
  ["Far and away the best prize that life offers is the chance to work hard at work worth doing.", "Theodore Roosevelt"],
  ["Patience and diligence, like faith, remove mountains.", "William Penn"],
  ["Learning without thought is labor lost; thought without learning is perilous.", "Confucius"],
  ["When you know a thing, to hold that you know it, and when you do not know a thing, to allow that you do not know it: this is knowledge.", "Confucius"],
  ["I have no special talents. I am only passionately curious.", "Albert Einstein"],
  ["Life is like riding a bicycle. To keep your balance, you must keep moving.", "Albert Einstein"],
  ["The important thing is not to stop questioning. Curiosity has its own reason for existing.", "Albert Einstein"],
  ["Ever tried. Ever failed. No matter. Try again. Fail again. Fail better.", "Samuel Beckett"],
  ["There are no secrets to success. It is the result of preparation, hard work, and learning from failure.", "Colin Powell"],
  ["I am always doing that which I cannot do, in order that I may learn how to do it.", "Pablo Picasso"],
  ["Knowing is not enough; we must apply. Willing is not enough; we must do.", "Johann Wolfgang von Goethe"],
  ["It's not whether you get knocked down, it's whether you get up.", "Vince Lombardi"],
  ["You miss 100% of the shots you don't take.", "Wayne Gretzky"],
  ["I've failed over and over and over again in my life. And that is why I succeed.", "Michael Jordan"],
  ["Champions keep playing until they get it right.", "Billie Jean King"],
  ["The harder the conflict, the more glorious the triumph.", "Thomas Paine"],
  ["I attribute my success to this: I never gave or took any excuse.", "Florence Nightingale"],
  ["Unless we are making progress every year, every month, every week, take my word for it, we are going back.", "Florence Nightingale"],
  ["Success is to be measured not so much by the position that one has reached in life as by the obstacles which he has overcome while trying to succeed.", "Booker T. Washington"],
  ["If there is no struggle, there is no progress.", "Frederick Douglass"],
  ["The most difficult thing is the decision to act. The rest is merely tenacity.", "Amelia Earhart"],
  ["Nothing will work unless you do.", "Maya Angelou"],
  ["First say to yourself what you would be; and then do what you have to do.", "Epictetus"],
  ["It is not that we have a short time to live, but that we waste a lot of it.", "Seneca"],
  ["The impediment to action advances action. What stands in the way becomes the way.", "Marcus Aurelius"],
  ["Nothing great was ever achieved without enthusiasm.", "Ralph Waldo Emerson"],
  ["If one advances confidently in the direction of his dreams, and endeavors to live the life which he has imagined, he will meet with a success unexpected in common hours.", "Henry David Thoreau"],
  ["In the long run, we shape our lives, and we shape ourselves.", "Eleanor Roosevelt"],
  ["I learned that courage was not the absence of fear, but the triumph over it.", "Nelson Mandela"],
  ["Education is the passport to the future, for tomorrow belongs to those who prepare for it today.", "Malcolm X"],
  ["One child, one teacher, one book, one pen can change the world.", "Malala Yousafzai"],
  ["Determine never to be idle. No person will have occasion to complain of the want of time who never loses any.", "Thomas Jefferson"],
  ["Lost time is never found again.", "Benjamin Franklin"],
  ["Well done is better than well said.", "Benjamin Franklin"],
  ["Diligence is the mother of good luck.", "Benjamin Franklin"],
  ["Have no fear of perfection. You'll never reach it.", "Salvador Dalí"],
  ["Slow and steady wins the race.", "Aesop"],
  ["Great works are performed not by strength but by perseverance.", "Samuel Johnson"],
  ["Great things are done by a series of small things brought together.", "Vincent van Gogh"],
  ["If you hear a voice within you say ‘you cannot paint,’ then by all means paint, and that voice will be silenced.", "Vincent van Gogh"],
  ["Optimism is the faith that leads to achievement. Nothing can be done without hope and confidence.", "Helen Keller"],
  ["Alone we can do so little; together we can do so much.", "Helen Keller"],
  ["Life is not easy for any of us. But what of that? We must have perseverance and above all confidence in ourselves.", "Marie Curie"],
  ["Nothing is impossible. The word itself says ‘I'm possible’!", "Audrey Hepburn"],
  ["Do the best you can until you know better. Then when you know better, do better.", "Maya Angelou"],
  ["Study hard what interests you the most in the most undisciplined, irreverent and original manner possible.", "Richard Feynman"],
  ["Knowledge itself is power.", "Francis Bacon"],
  ["Always bear in mind that your own resolution to succeed is more important than any other one thing.", "Abraham Lincoln"],
  ["Perfection is not attainable, but if we chase perfection we can catch excellence.", "Vince Lombardi"],
  ["The only limit to our realization of tomorrow will be our doubts of today.", "Franklin D. Roosevelt"],
  ["Life shrinks or expands in proportion to one's courage.", "Anaïs Nin"],
  ["Waste no more time arguing about what a good man should be. Be one.", "Marcus Aurelius"],
  ["Very little is needed to make a happy life; it is all within yourself, in your way of thinking.", "Marcus Aurelius"],
  ["Never let the future disturb you. You will meet it, if you have to, with the same weapons of reason which today arm you against the present.", "Marcus Aurelius"],
  ["If it is not right, do not do it; if it is not true, do not say it.", "Marcus Aurelius"],
  ["As long as you live, keep learning how to live.", "Seneca"],
  ["Difficulties strengthen the mind, as labor does the body.", "Seneca"],
  ["Begin at once to live, and count each separate day as a separate life.", "Seneca"],
  ["It is not because things are difficult that we do not dare; it is because we do not dare that they are difficult.", "Seneca"],
  ["We suffer more often in imagination than in reality.", "Seneca"],
  ["No man was ever wise by chance.", "Seneca"],
  ["While we teach, we learn.", "Seneca"],
  ["No great thing is created suddenly.", "Epictetus"],
  ["Only the educated are free.", "Epictetus"],
  ["Men are disturbed not by things, but by the views which they take of things.", "Epictetus"],
  ["If you want to improve, be content to be thought foolish and stupid.", "Epictetus"],
  ["Pleasure in the job puts perfection in the work.", "Aristotle"],
  ["For the things we have to learn before we can do them, we learn by doing them.", "Aristotle"],
  ["We become just by doing just acts, temperate by doing temperate acts, brave by doing brave acts.", "Aristotle"],
  ["All men by nature desire to know.", "Aristotle"],
  ["Hope is a waking dream.", "Aristotle"],
  ["Wonder is the feeling of a philosopher, and philosophy begins in wonder.", "Plato"],
  ["The first and best victory is to conquer self.", "Plato"],
  ["The unexamined life is not worth living.", "Socrates"],
  ["Is it not pleasant to learn with a constant perseverance and application?", "Confucius"],
  ["The superior man is modest in his speech, but exceeds in his actions.", "Confucius"],
  ["When we see men of worth, we should think of equaling them.", "Confucius"],
  ["Learn as if you could not reach your object, and were always fearing also lest you should lose it.", "Confucius"],
  ["To see what is right and not to do it is want of courage.", "Confucius"],
  ["Knowing others is intelligence; knowing yourself is true wisdom.", "Laozi"],
  ["He who conquers others is strong; he who conquers himself is mighty.", "Laozi"],
  ["Great acts are made up of small deeds.", "Laozi"],
  ["Learning must never stop.", "Xunzi"],
  ["Without accumulating small steps, one cannot travel a thousand miles.", "Xunzi"],
  ["Drop by drop is the water pot filled. Likewise, the wise man, gathering it little by little, fills himself with good.", "The Buddha"],
  ["Dripping water hollows out stone, not through force but through persistence.", "Ovid"],
  ["Be patient and tough; someday this pain will be useful to you.", "Ovid"],
  ["They can because they think they can.", "Virgil"],
  ["Fortune favors the bold.", "Virgil"],
  ["Dare to be wise; begin!", "Horace"],
  ["Seize the day, and put as little trust as you can in tomorrow.", "Horace"],
  ["Practice is the best of all instructors.", "Publilius Syrus"],
  ["Anyone can hold the helm when the sea is calm.", "Publilius Syrus"],
  ["Heaven never helps the man who will not act.", "Sophocles"],
  ["Leave no stone unturned.", "Euripides"],
  ["Life is short, the art long, opportunity fleeting.", "Hippocrates"],
  ["Wherever the art of medicine is loved, there is also a love of humanity.", "Hippocrates"],
  ["The mind is not a vessel to be filled, but a fire to be kindled.", "Plutarch"],
  ["There is no royal road to geometry.", "Euclid"],
  ["Give me a place to stand, and I shall move the earth.", "Archimedes"],
  ["Become such as you are, having learned what that is.", "Pindar"],
  ["A sound mind in a sound body.", "Juvenal"],
  ["Little by little does the trick.", "Aesop"],
  ["Self-help is the best help.", "Aesop"],
  ["Union gives strength.", "Aesop"],
  ["Consider your origin: you were not made to live like brutes, but to follow virtue and knowledge.", "Dante Alighieri"],
  ["Iron rusts from disuse, stagnant water loses its purity, and in cold weather becomes frozen; even so does inaction sap the vigor of the mind.", "Leonardo da Vinci"],
  ["I am still learning.", "Michelangelo"],
  ["Give light, and the darkness will disappear of itself.", "Desiderius Erasmus"],
  ["Our doubts are traitors, and make us lose the good we oft might win, by fearing to attempt.", "William Shakespeare"],
  ["We know what we are, but know not what we may be.", "William Shakespeare"],
  ["Things won are done; joy's soul lies in the doing.", "William Shakespeare"],
  ["Be not afraid of greatness: some are born great, some achieve greatness, and some have greatness thrust upon them.", "William Shakespeare"],
  ["Strong reasons make strong actions.", "William Shakespeare"],
  ["The fault, dear Brutus, is not in our stars, but in ourselves.", "William Shakespeare"],
  ["This above all: to thine own self be true.", "William Shakespeare"],
  ["The value of life lies not in the length of days, but in the use we make of them.", "Michel de Montaigne"],
  ["Diligence is the mother of good fortune.", "Miguel de Cervantes"],
  ["Reading maketh a full man; conference a ready man; and writing an exact man.", "Francis Bacon"],
  ["A wise man will make more opportunities than he finds.", "Francis Bacon"],
  ["It is not enough to have a good mind; the main thing is to use it well.", "René Descartes"],
  ["If I have seen further, it is by standing on the shoulders of giants.", "Isaac Newton"],
  ["If I have ever made any valuable discoveries, it has been owing more to patient attention than to any other talent.", "Isaac Newton"],
  ["The mind is its own place, and in itself can make a heaven of hell, a hell of heaven.", "John Milton"],
  ["Reading furnishes the mind only with materials of knowledge; it is thinking that makes what we read ours.", "John Locke"],
  ["All things excellent are as difficult as they are rare.", "Baruch Spinoza"],
  ["Today is victory over yourself of yesterday; tomorrow is your victory over lesser men.", "Miyamoto Musashi"],
  ["Little strokes fell great oaks.", "Benjamin Franklin"],
  ["Dost thou love life? Then do not squander time, for that's the stuff life is made of.", "Benjamin Franklin"],
  ["Never leave that till tomorrow which you can do today.", "Benjamin Franklin"],
  ["He that can have patience can have what he will.", "Benjamin Franklin"],
  ["Early to bed and early to rise makes a man healthy, wealthy, and wise.", "Benjamin Franklin"],
  ["What we hope ever to do with ease, we must learn first to do with diligence.", "Samuel Johnson"],
  ["Few things are impossible to diligence and skill.", "Samuel Johnson"],
  ["Talent develops in quiet places, character in the full current of human life.", "Johann Wolfgang von Goethe"],
  ["One must be something in order to do something.", "Johann Wolfgang von Goethe"],
  ["The best is the enemy of the good.", "Voltaire"],
  ["Have courage to use your own understanding.", "Immanuel Kant"],
  ["Perseverance and spirit have done wonders in all ages.", "George Washington"],
  ["Let us dare to read, think, speak, and write.", "John Adams"],
  ["Learning is not attained by chance; it must be sought for with ardor and attended to with diligence.", "Abigail Adams"],
  ["Great necessities call out great virtues.", "Abigail Adams"],
  ["What we obtain too cheap, we esteem too lightly.", "Thomas Paine"],
  ["Nothing contributes so much to tranquilize the mind as a steady purpose.", "Mary Shelley"],
  ["Impossible is a word to be found only in the dictionary of fools.", "Napoleon Bonaparte"],
  ["Things do not change; we change.", "Henry David Thoreau"],
  ["It is not enough to be busy. The question is: what are we busy about?", "Henry David Thoreau"],
  ["If you have built castles in the air, your work need not be lost; that is where they should be. Now put the foundations under them.", "Henry David Thoreau"],
  ["Do the thing you fear, and the death of fear is certain.", "Ralph Waldo Emerson"],
  ["Finish each day and be done with it. You have done what you could.", "Ralph Waldo Emerson"],
  ["Trust thyself: every heart vibrates to that iron string.", "Ralph Waldo Emerson"],
  ["Every artist was first an amateur.", "Ralph Waldo Emerson"],
  ["Write it on your heart that every day is the best day in the year.", "Ralph Waldo Emerson"],
  ["Man's mind, once stretched by a new idea, never regains its original dimensions.", "Oliver Wendell Holmes Sr."],
  ["Let us, then, be up and doing, with a heart for any fate; still achieving, still pursuing, learn to labor and to wait.", "Henry Wadsworth Longfellow"],
  ["Great is the art of beginning, but greater is the art of ending.", "Henry Wadsworth Longfellow"],
  ["Hope is the thing with feathers that perches in the soul.", "Emily Dickinson"],
  ["If I can stop one heart from breaking, I shall not live in vain.", "Emily Dickinson"],
  ["I am no bird; and no net ensnares me: I am a free human being with an independent will.", "Charlotte Brontë"],
  ["What do we live for, if it is not to make life less difficult for each other?", "George Eliot"],
  ["No one is useless in this world who lightens the burdens of another.", "Charles Dickens"],
  ["A man who dares to waste one hour of time has not discovered the value of life.", "Charles Darwin"],
  ["Chance favors only the prepared mind.", "Louis Pasteur"],
  ["Let me tell you the secret that has led me to my goal. My strength lies solely in my tenacity.", "Louis Pasteur"],
  ["Even the darkest night will end and the sun will rise.", "Victor Hugo"],
  ["He who opens a school door, closes a prison.", "Victor Hugo"],
  ["The two most powerful warriors are patience and time.", "Leo Tolstoy"],
  ["Everyone thinks of changing the world, but no one thinks of changing himself.", "Leo Tolstoy"],
  ["I do the very best I know how, the very best I can; and I mean to keep on doing so until the end.", "Abraham Lincoln"],
  ["If you want to lift yourself up, lift up someone else.", "Booker T. Washington"],
  ["Excellence is to do a common thing in an uncommon way.", "Booker T. Washington"],
  ["Character is power.", "Booker T. Washington"],
  ["Nothing ever comes to one, that is worth having, except as a result of hard work.", "Booker T. Washington"],
  ["How very little can be done under the spirit of fear.", "Florence Nightingale"],
  ["Rather, ten times, die in the surf, heralding the way to a new world, than stand idly on the shore.", "Florence Nightingale"],
  ["Were there none who were discontented with what they have, the world would never reach anything better.", "Florence Nightingale"],
  ["The door that nobody else will go in at seems always to swing open widely for me.", "Clara Barton"],
  ["I may be compelled to face danger, but never fear it.", "Clara Barton"],
  ["It is not easy to be a pioneer, but oh, it is fascinating!", "Elizabeth Blackwell"],
  ["Failure is impossible.", "Susan B. Anthony"],
  ["Courage is resistance to fear, mastery of fear, not absence of fear.", "Mark Twain"],
  ["Always do right. This will gratify some people and astonish the rest.", "Mark Twain"],
  ["Habit is habit, and not to be flung out of the window, but coaxed downstairs a step at a time.", "Mark Twain"],
  ["Experience is the name everyone gives to their mistakes.", "Oscar Wilde"],
  ["To be what we are, and to become what we are capable of becoming, is the only end of life.", "Robert Louis Stevenson"],
  ["He who has a why to live can bear almost any how.", "Friedrich Nietzsche"],
  ["What does not kill me makes me stronger.", "Friedrich Nietzsche"],
  ["Life can only be understood backwards; but it must be lived forwards.", "Søren Kierkegaard"],
  ["Act as if what you do makes a difference. It does.", "William James"],
  ["Before anything else, preparation is the key to success.", "Alexander Graham Bell"],
  ["There is no substitute for hard work.", "Thomas Edison"],
  ["I never did a day's work in my life. It was all fun.", "Thomas Edison"],
  ["Many of life's failures are people who did not realize how close they were to success when they gave up.", "Thomas Edison"],
  ["Failure is simply the opportunity to begin again, this time more intelligently.", "Henry Ford"],
  ["Anyone who stops learning is old, whether at twenty or eighty.", "Henry Ford"],
  ["Nothing is particularly hard if you divide it into small jobs.", "Henry Ford"],
  ["To strive, to seek, to find, and not to yield.", "Alfred, Lord Tennyson"],
  ["I am the master of my fate, I am the captain of my soul.", "William Ernest Henley"],
  ["If you can fill the unforgiving minute with sixty seconds' worth of distance run, yours is the Earth and everything that's in it.", "Rudyard Kipling"],
  ["Ah, but a man's reach should exceed his grasp, or what's a heaven for?", "Robert Browning"],
  ["Every noble work is at first impossible.", "Thomas Carlyle"],
  ["Quality is never an accident; it is always the result of intelligent effort.", "John Ruskin"],
  ["Great things are done when men and mountains meet.", "William Blake"],
  ["The great aim of education is not knowledge but action.", "Herbert Spencer"],
  ["Be ashamed to die until you have won some victory for humanity.", "Horace Mann"],
  ["Persistence and determination alone are omnipotent.", "Calvin Coolidge"],
  ["Education must not simply teach work; it must teach life.", "W.E.B. Du Bois"],
  ["Education is the key to unlock the golden door of freedom.", "George Washington Carver"],
  ["Where there is no vision, there is no hope.", "George Washington Carver"],
  ["The secret of success in life is for a man to be ready for his opportunity when it comes.", "Benjamin Disraeli"],
  ["I am not afraid; I was born to do this.", "Joan of Arc"],
  ["Our greatest glory is not in never falling, but in rising every time we fall.", "Oliver Goldsmith"],
  ["The good physician treats the disease; the great physician treats the patient who has the disease.", "William Osler"],
  ["Listen to your patient; he is telling you the diagnosis.", "William Osler"],
  ["The practice of medicine is an art, not a trade; a calling, not a business.", "William Osler"],
  ["To study the phenomena of disease without books is to sail an uncharted sea, while to study books without patients is not to go to sea at all.", "William Osler"],
  ["The reward for work well done is the opportunity to do more.", "Jonas Salk"],
  ["The purpose of human life is to serve, and to show compassion and the will to help others.", "Albert Schweitzer"],
  ["Keep your eyes on the stars, and your feet on the ground.", "Theodore Roosevelt"],
  ["The credit belongs to the man who is actually in the arena, who, at the worst, if he fails, at least fails while daring greatly.", "Theodore Roosevelt"],
  ["Nothing in the world is worth having or worth doing unless it means effort, pain, difficulty.", "Theodore Roosevelt"],
  ["Imagination is more important than knowledge.", "Albert Einstein"],
  ["Strive not to be a success, but rather to be of value.", "Albert Einstein"],
  ["It is the supreme art of the teacher to awaken joy in creative expression and knowledge.", "Albert Einstein"],
  ["One never notices what has been done; one can only see what remains to be done.", "Marie Curie"],
  ["Be less curious about people and more curious about ideas.", "Marie Curie"],
  ["Strength does not come from physical capacity. It comes from an indomitable will.", "Mahatma Gandhi"],
  ["I am an optimist. It does not seem too much use being anything else.", "Winston Churchill"],
  ["To improve is to change; to be perfect is to change often.", "Winston Churchill"],
  ["The only thing we have to fear is fear itself.", "Franklin D. Roosevelt"],
  ["You must do the thing you think you cannot do.", "Eleanor Roosevelt"],
  ["Leadership and learning are indispensable to each other.", "John F. Kennedy"],
  ["We choose to do these things not because they are easy, but because they are hard.", "John F. Kennedy"],
  ["Everybody can be great, because anybody can serve.", "Martin Luther King Jr."],
  ["The ultimate measure of a man is not where he stands in moments of comfort and convenience, but where he stands at times of challenge and controversy.", "Martin Luther King Jr."],
  ["Darkness cannot drive out darkness; only light can do that.", "Martin Luther King Jr."],
  ["The function of education is to teach one to think intensively and to think critically.", "Martin Luther King Jr."],
  ["You must never be fearful about what you are doing when it is right.", "Rosa Parks"],
  ["Do not judge me by my successes; judge me by how many times I fell down and got back up again.", "Nelson Mandela"],
  ["After climbing a great hill, one only finds that there are many more hills to climb.", "Nelson Mandela"],
  ["Not all of us can do great things. But we can do small things with great love.", "Mother Teresa"],
  ["Life is either a daring adventure or nothing.", "Helen Keller"],
  ["Although the world is full of suffering, it is full also of the overcoming of it.", "Helen Keller"],
  ["Character cannot be developed in ease and quiet. Only through experience of trial and suffering can the soul be strengthened.", "Helen Keller"],
  ["The more one does and sees and feels, the more one is able to do.", "Amelia Earhart"],
  ["Adventure is worthwhile in itself.", "Amelia Earhart"],
  ["How wonderful it is that nobody need wait a single moment before starting to improve the world.", "Anne Frank"],
  ["Whoever is happy will make others happy too.", "Anne Frank"],
  ["All we have to decide is what to do with the time that is given us.", "J.R.R. Tolkien"],
  ["Even the smallest person can change the course of the future.", "J.R.R. Tolkien"],
  ["Not all those who wander are lost.", "J.R.R. Tolkien"],
  ["The world breaks everyone, and afterward many are strong at the broken places.", "Ernest Hemingway"],
  ["If you don't like something, change it. If you can't change it, change your attitude.", "Maya Angelou"],
  ["You can't use up creativity. The more you use, the more you have.", "Maya Angelou"],
  ["If there's a book that you want to read, but it hasn't been written yet, then you must write it.", "Toni Morrison"],
  ["Hold fast to dreams, for if dreams die, life is a broken-winged bird that cannot fly.", "Langston Hughes"],
  ["The best way out is always through.", "Robert Frost"],
  ["In three words I can sum up everything I've learned about life: it goes on.", "Robert Frost"],
  ["When we are no longer able to change a situation, we are challenged to change ourselves.", "Viktor Frankl"],
  ["I fear not the man who has practiced 10,000 kicks once, but I fear the man who has practiced one kick 10,000 times.", "Bruce Lee"],
  ["Do not pray for an easy life; pray for the strength to endure a difficult one.", "Bruce Lee"],
  ["I hated every minute of training, but I said, ‘Don't quit. Suffer now and live the rest of your life as a champion.’", "Muhammad Ali"],
  ["A life is not important except in the impact it has on other lives.", "Jackie Robinson"],
  ["It's hard to beat a person who never gives up.", "Babe Ruth"],
  ["In order to make dreams come into reality, it takes an awful lot of determination, dedication, self-discipline, and effort.", "Jesse Owens"],
  ["Never underestimate the power of dreams and the influence of the human spirit.", "Wilma Rudolph"],
  ["Success is no accident. It is hard work, perseverance, learning, studying, sacrifice and most of all, love of what you are doing.", "Pelé"],
  ["Everything negative, pressure, challenges, is all an opportunity for me to rise.", "Kobe Bryant"],
  ["A champion is defined not by their wins, but by how they can recover when they fall.", "Serena Williams"],
  ["Do not let what you cannot do interfere with what you can do.", "John Wooden"],
  ["Be quick, but don't hurry.", "John Wooden"],
  ["Make each day your masterpiece.", "John Wooden"],
  ["Success is a journey, not a destination. The doing is often more important than the outcome.", "Arthur Ashe"],
  ["Your time is limited, so don't waste it living someone else's life.", "Steve Jobs"],
  ["Have the courage to follow your heart and intuition.", "Steve Jobs"],
  ["If you are working on something that you really care about, you don't have to be pushed. The vision pulls you.", "Steve Jobs"],
  ["Science is a way of thinking much more than it is a body of knowledge.", "Carl Sagan"],
  ["That's one small step for man, one giant leap for mankind.", "Neil Armstrong"],
  ["Remember to look up at the stars and not down at your feet.", "Stephen Hawking"],
  ["However difficult life may seem, there is always something you can do and succeed at.", "Stephen Hawking"],
  ["The first principle is that you must not fool yourself, and you are the easiest person to fool.", "Richard Feynman"],
  ["What I cannot create, I do not understand.", "Richard Feynman"],
  ["Self-education is, I firmly believe, the only kind of education there is.", "Isaac Asimov"],
  ["You fail only if you stop writing.", "Ray Bradbury"],
  ["Discipline is the bridge between goals and accomplishment.", "Jim Rohn"],
  ["You don't have to be great to start, but you have to start to be great.", "Zig Ziglar"],
  ["Inaction breeds doubt and fear. Action breeds confidence and courage.", "Dale Carnegie"],
  ["Whatever the mind of man can conceive and believe, it can achieve.", "Napoleon Hill"],
  ["The biggest adventure you can take is to live the life of your dreams.", "Oprah Winfrey"],
  ["Success isn't about how much money you make; it's about the difference you make in people's lives.", "Michelle Obama"],
  ["Change will not come if we wait for some other person or some other time. We are the ones we've been waiting for.", "Barack Obama"],
  ["Fight for the things that you care about, but do it in a way that will lead others to join you.", "Ruth Bader Ginsburg"],
  ["When the whole world is silent, even one voice becomes powerful.", "Malala Yousafzai"],
  ["Never be limited by other people's limited imaginations.", "Mae Jemison"],
  ["Like what you do, and then you will do your best.", "Katherine Johnson"],
  ["A ship in port is safe, but that's not what ships are built for.", "Grace Hopper"],
  ["That brain of mine is something more than merely mortal, as time will show.", "Ada Lovelace"],
  ["What you do makes a difference, and you have to decide what kind of difference you want to make.", "Jane Goodall"],
  ["The whole world opened to me when I learned to read.", "Mary McLeod Bethune"],
  ["If they don't give you a seat at the table, bring a folding chair.", "Shirley Chisholm"],
  ["Feet, what do I need you for when I have wings to fly?", "Frida Kahlo"],
  ["I've been absolutely terrified every moment of my life, and I've never let it keep me from doing a single thing I wanted to do.", "Georgia O'Keeffe"],
  ["The worst enemy to creativity is self-doubt.", "Sylvia Plath"],
  ["Have regular hours for work and play; make each day both useful and pleasant.", "Louisa May Alcott"],
  ["Isn't it nice to think that tomorrow is a new day with no mistakes in it yet?", "L.M. Montgomery"],
  ["You have brains in your head. You have feet in your shoes. You can steer yourself any direction you choose.", "Dr. Seuss"],
  ["Today you are You, that is truer than true. There is no one alive who is Youer than You.", "Dr. Seuss"],
  ["Often when you think you're at the end of something, you're at the beginning of something else.", "Fred Rogers"],
  ["In the depth of winter, I finally learned that within me there lay an invincible summer.", "Albert Camus"],
  ["You can't cross the sea merely by standing and staring at the water.", "Rabindranath Tagore"],
  ["Arise, awake, and stop not till the goal is reached.", "Swami Vivekananda"],
  ["Dream is not that which you see while sleeping; it is something that does not let you sleep.", "A.P.J. Abdul Kalam"],
  ["If you want to shine like a sun, first burn like a sun.", "A.P.J. Abdul Kalam"],
  ["Do your little bit of good where you are; it's those little bits of good put together that overwhelm the world.", "Desmond Tutu"],
  ["Knowledge is of no value unless you put it into practice.", "Anton Chekhov"],
  ["Experience is not what happens to a man; it is what a man does with what happens to him.", "Aldous Huxley"],
  ["Those who cannot change their minds cannot change anything.", "George Bernard Shaw"],
  ["A problem is a chance for you to do your best.", "Duke Ellington"],
  ["Just don't give up trying to do what you really want to do.", "Ella Fitzgerald"],
  ["To achieve great things, two things are needed: a plan, and not quite enough time.", "Leonard Bernstein"],
  ["All adventures, especially into new territory, are scary.", "Sally Ride"],
  ["By endurance we conquer.", "Ernest Shackleton"],
  ["In any given moment we have two options: to step forward into growth or to step back into safety.", "Abraham Maslow"],
  ["Ability is what you're capable of doing. Motivation determines what you do. Attitude determines how well you do it.", "Lou Holtz"],
  ["Opportunities multiply as they are seized.", "Sun Tzu"],
  ["Courage is the most important of all the virtues, because without courage you can't practice any other virtue consistently.", "Maya Angelou"],
  ["Knowledge is love and light and vision.", "Helen Keller"],
  ["A man is but the product of his thoughts. What he thinks, he becomes.", "Mahatma Gandhi"],
  ["An ounce of practice is worth more than tons of preaching.", "Mahatma Gandhi"],
  ["Learn everything you can, anytime you can, from anyone you can; there will always come a time when you will be grateful you did.", "Sarah Caldwell"],
  ["I am learning all the time. The tombstone will be my diploma.", "Eartha Kitt"],
  ["There are no shortcuts to any place worth going.", "Beverly Sills"],
  ["You may be disappointed if you fail, but you are doomed if you don't try.", "Beverly Sills"],
  ["Patience is bitter, but its fruit is sweet.", "Jean-Jacques Rousseau"],
  ["Rome was not built in a day.", "John Heywood"],
  ["Nothing is impossible to a willing heart.", "John Heywood"],
  ["Patience, persistence and perspiration make an unbeatable combination for success.", "Napoleon Hill"],
  ["Dream big and dare to fail.", "Norman Vaughan"],
  ["I am a part of all that I have met.", "Alfred, Lord Tennyson"],
  ["Hope is being able to see that there is light despite all of the darkness.", "Desmond Tutu"],
  ["Knowledge will give you power, but character respect.", "Bruce Lee"],
  ["Mistakes are always forgivable, if one has the courage to admit them.", "Bruce Lee"],
  ["The most effective way to do it, is to do it.", "Amelia Earhart"],
  ["Perseverance is failing nineteen times and succeeding the twentieth.", "Julie Andrews"],
  ["We are all in the gutter, but some of us are looking at the stars.", "Oscar Wilde"],
  ["Courage is being scared to death, but saddling up anyway.", "John Wayne"]
];
function todaysQuote(){
  const t = todayISO(), n = Math.floor(Date.UTC(+t.slice(0, 4), +t.slice(5, 7) - 1, +t.slice(8, 10)) / 864e5), N = DAILY_QUOTES.length;
  return DAILY_QUOTES[((n * 37) % N + N) % N];
}
const streakOf = () => { const s = Object.assign({cur: 0, best: 0, last: ""}, (state.settings && state.settings.streak) || {}); if (s.last && s.last < addDays(todayISO(), -1)) s.cur = 0; return s; };
// The streak the student actually sees: the gentle one when it is on
const shownStreak = () => { if (window.SBSTREAK && SBSTREAK.on()) { const r = SBSTREAK.state(); return {cur: r.run, best: r.best}; } const s = streakOf(); return {cur: s.cur, best: s.best}; };
function streakLine(){
  if (window.SBSTREAK && SBSTREAK.on()) return SBSTREAK.line();
  const s = streakOf(), today = s.last === todayISO();
  if (!s.cur) return "Make progress on a task today to start a streak.";
  return `🔥 ${s.cur}-day streak${today ? "" : " (make progress today to keep it)"}.${s.best > s.cur ? ` Your best is ${s.best} days.` : ""}`;
}
function isProgress(a, b){
  if (!a || !b) return false;
  const r = {todo: 0, doing: 1, done: 2};
  if ((r[b.status] || 0) > (r[a.status] || 0)) return true;
  if ((Number(b.pct) || 0) > (Number(a.pct) || 0)) return true;
  const ca = (a.checklist || []).filter(x => x.done).length, cb = (b.checklist || []).filter(x => x.done).length;
  return cb > ca;
}
function noteProgress(){
  const d = todayISO(), s = streakOf();
  if (s.last === d) return;
  s.cur = s.last === addDays(d, -1) ? s.cur + 1 : 1; s.last = d; s.best = Math.max(s.best || 0, s.cur);
  state.settings = Object.assign({}, state.settings, {streak: s});
  saveSettings();
}

function qodPop(html, cls){
  const old = document.getElementById("qod"); if (old) old.remove();
  const w = document.createElement("div"); w.id = "qod"; w.className = "qod-wrap " + (cls || "");
  w.innerHTML = `<div class="qod" role="dialog" aria-modal="true" aria-labelledby="qodT">${html}</div>`;
  document.body.appendChild(w);
  const close = () => { w.classList.add("out"); setTimeout(() => w.remove(), 260); document.removeEventListener("keydown", esc2); };
  const esc2 = e => { if (e.key === "Escape") close(); };
  w.addEventListener("click", e => { if (e.target === w || e.target.closest("[data-qod-close]")) close(); });
  document.addEventListener("keydown", esc2);
  requestAnimationFrame(() => w.classList.add("in"));
  const b = w.querySelector("[data-qod-close]"); if (b) b.focus();
}
function dailyQuote(force){
  if (!force && styleCfg().quotes === false) return;
  if (!force && navigator.webdriver && !window.__qodTest) return;
  const d = todayISO();
  let last = ""; try { last = localStorage.getItem("studyboard:quoteDay") || ""; } catch(e) {}
  if (!force && last === d) return;
  if (!force && (dlg.open || document.getElementById("qod") || document.hidden)) { setTimeout(() => dailyQuote(false), 4000); return; }
  try { localStorage.setItem("studyboard:quoteDay", d); } catch(e) {}
  const [q, who] = todaysQuote();
  qodPop(`<div class="qod-eyebrow">${esc(new Date().toLocaleDateString(undefined, {weekday: "long", month: "long", day: "numeric"}))}</div>
    <p class="qod-q" id="qodT">“${esc(q)}”</p>${who ? `<p class="qod-who">${esc(who)}</p>` : ""}
    <p class="qod-streak">${esc(streakLine())}</p>
    <div class="qod-foot"><button type="button" class="btn primary" data-qod-close>Let's Go</button></div>`);
}

/* Weekly class schedule */
const COURSE_COLORS = ["#3B6FE0", "#1E9E74", "#E0673B", "#9A4FD1", "#D6386F", "#1D9BB8", "#C79A12", "#5E6B7E", "#DC2626", "#16A34A", "#65A30D", "#0D9488", "#4F46E5", "#C026D3", "#EA580C", "#92400E", "#334155"];
const COURSE_COLOR_NAMES = ["Blue", "Emerald", "Coral", "Purple", "Raspberry", "Ocean", "Gold", "Slate Gray", "Red", "Green", "Lime", "Teal", "Indigo", "Magenta", "Orange", "Brown", "Charcoal"];
const MEET_KINDS = ["Lecture", "Lab", "Discussion", "Tutorial", "Office Hours", "Other"];
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];
const DAY_SHORT = {1: "M", 2: "T", 3: "W", 4: "Th", 5: "F", 6: "Sa", 0: "Su"};
const toMin = t => { const [h, m] = String(t || "0:0").split(":").map(Number); return h * 60 + (m || 0); };
function parseTimeRange(s){
  const m = String(s).match(/(\d{1,2})(?:[:.](\d{2}))?\s*(a\.?m\.?|p\.?m\.?)?\s*(?:-|–|—|to)\s*(\d{1,2})(?:[:.](\d{2}))?\s*(a\.?m\.?|p\.?m\.?)?/i);
  if (!m) return null;
  let sh = +m[1], sm = +(m[2] || 0), eh = +m[4], em = +(m[5] || 0);
  const a1 = m[3] && m[3][0].toLowerCase(), a2 = m[6] && m[6][0].toLowerCase();
  const to24 = (h, ap) => ap === "p" ? (h % 12) + 12 : ap === "a" ? h % 12 : h;
  eh = a2 ? to24(eh, a2) : (eh < 8 ? eh + 12 : eh);
  if (a1) sh = to24(sh, a1); else if (a2 === "p" && sh < 12 && sh + 12 <= eh) sh += 12; else if (!a2 && sh < 8) sh += 12;
  if (sh > 23 || eh > 23 || sm > 59 || em > 59 || eh * 60 + em <= sh * 60 + sm) return null;
  return {start: pad(sh) + ":" + pad(sm), end: pad(eh) + ":" + pad(em)};
}
function parseMeetings(text, kind, where){
  const out = [];
  String(text || "").split(/;|\n|\s\/\s|,\s(?=[A-Z][a-z]*\s*(?:lab|discussion|recitation)\b)/i).forEach(part => {
    const days = SY.meetingDays(part), tr = parseTimeRange(part);
    if (days.length && tr) out.push({id: uid(), kind: /\blab\b/i.test(part) ? "Lab" : /tutorial|\btut\b/i.test(part) ? "Tutorial" : /discussion|recitation|\bdis\b/i.test(part) ? "Discussion" : kind || "Lecture", days, start: tr.start, end: tr.end, where: where || ""});
  });
  return out;
}
const daysLabel = ds => WEEK_ORDER.filter(d => ds.includes(d)).map(d => DAY_SHORT[d]).join("");
// Courses saved before class times existed still have a "Meets" line; read the times from it
const courseMeetings = c => Array.isArray(c.meetings) ? c.meetings : parseMeetings(c.schedule, "Lecture", c.room).concat(parseMeetings(c.office, "Office Hours"));
// The class times on a course's colour band, always in one format
const DAY_ABBR = {1: "Mon", 2: "Tue", 3: "Wed", 4: "Thu", 5: "Fri", 6: "Sat", 0: "Sun"};
function meetDaysText(ds){
  const ord = WEEK_ORDER.filter(d => ds.includes(d));
  if (ord.length === 5 && [1, 2, 3, 4, 5].every(d => ord.includes(d))) return "Mon–Fri";
  return ord.map(d => DAY_ABBR[d]).join(", ");
}
function meetTimeText(a, b){
  const s = fmtTime(a), e = fmtTime(b), sm = s.match(/^(.*?)\s?([AaPp]\.?[Mm]\.?)$/), em = e.match(/^(.*?)\s?([AaPp]\.?[Mm]\.?)$/);
  return sm && em && sm[2].toUpperCase() === em[2].toUpperCase() ? `${sm[1]}–${e}` : `${s}–${e}`;
}
function courseTimesText(c){
  let ms = []; try { ms = courseMeetings(c).filter(m => m && m.kind !== "Office Hours" && Array.isArray(m.days) && m.days.length && m.start && m.end); } catch (e) { ms = []; }
  if (!ms.length) return String(c.schedule || "").trim();
  const main = ms.find(m => m.kind === "Lecture") || ms[0];
  const extra = [...new Set(ms.filter(m => m !== main && m.kind !== main.kind).map(m => m.kind))];
  const same = ms.filter(m => m.kind === main.kind && m !== main && m.start === main.start && m.end === main.end);
  const days = [...new Set(main.days.concat(...same.map(m => m.days)))];
  return `${meetDaysText(days)} · ${meetTimeText(main.start, main.end)}${extra.length ? " + " + extra.join(", ") : ""}`;
}
const meetingsSummary = ms => ms.filter(m => m.kind !== "Office Hours").map(m => `${daysLabel(m.days)} ${fmtTime(m.start)}–${fmtTime(m.end)}`).join("; ");
let schNoticeHtml = "";
function viewSchedule(){
  const today = todayISO(), mon = ui.schWeek || mondayOf(today);
  const cs = coursesArr();
  const nav = `<div class="view-head sch-top">
    <div class="sch-nav"><button class="icon-btn" data-act="sch-prev" aria-label="Previous week"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg></button>
    <span class="sch-range">${esc(fmtShort(mon))} – ${esc(fmtShort(addDays(mon, 6)))}</span>
    <button class="icon-btn" data-act="sch-next" aria-label="Next week"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg></button>
    <button class="btn small" data-act="sch-today" ${mon === mondayOf(today) && ui.schDay == null ? 'disabled aria-pressed="true" title="You are viewing this week"' : 'aria-pressed="false"'}>This Week</button>
    <button class="btn small" data-act="avail-open" title="Add or edit work, shifts, travel and protected time so Today's Plan only uses free time">Availability</button>${proBtns("schedule")}
</div></div>`;
  const withEvents = new Set(eventsArr().map(e => e.courseId).filter(Boolean));
  const missing = cs.filter(c => !courseMeetings(c).length && !withEvents.has(c.id));
  const hasAny = cs.some(c => courseMeetings(c).length) || eventsArr().length || availBlocks().length;
  const setup = hasAny ? "" : `<div class="sch-setup" role="region" aria-label="Set up your schedule"><p style="margin:0"><strong>Add Your Class Times</strong><span class="mini">Your week fills in from each course's class times: lectures, labs, discussions and office hours. You can also add your own events, or import your Apple, Google or Outlook calendar. Deadlines already show below.</span></p>
    ${cs.length ? `<div class="sch-missing">${cs.map(c => `<button class="chip" style="--c:${esc(c.color)}" data-act="edit-course" data-id="${esc(c.id)}"><span class="dot"></span>${esc(courseLabel(c))}: Add Class Times</button>`).join("")}</div>` : `<div class="sch-missing"><button class="btn small primary" data-act="new-course">Add a Course</button></div>`}
    <div class="sch-missing"><button class="btn small" data-act="sch-add">+ Add an Event</button><button class="btn small" data-act="avail-add">+ Add Shift or Work</button><button class="btn small" data-act="sch-ics">Import a Calendar File</button></div></div>`;
  const occ = schOccurrences(mon, addDays(mon, 6));
  const hasWeekend = occ.some(o => { const w = parse(o.date).getDay(); return w === 0 || w === 6; }) || tasksArr().some(t => t.status !== "done" && t.due && t.due >= addDays(mon, 5) && t.due <= addDays(mon, 6));
  const days = []; for (let i = 0; i < (hasWeekend ? 7 : 5); i++) { const iso = addDays(mon, i); days.push({i, iso, wd: parse(iso).getDay()}); }
  const lastDay = days[days.length - 1].iso;
  const weekTasks = tasksArr().filter(t => t.due && t.due >= mon && t.due <= lastDay && t.status !== "done");
  const onGrid = t => MILESTONE(t.type) && t.time;
  const shown = new Set(days.map(d => d.iso)), timed = occ.filter(o => !o.allDay && shown.has(o.date));
  let lo = Math.min(...timed.map(o => tToMin(o.start)), ...weekTasks.filter(onGrid).map(t => tToMin(t.time)), 9 * 60);
  let hi = Math.max(...timed.map(o => tToMin(o.end)), ...weekTasks.filter(onGrid).map(t => tToMin(t.time) + 60), 17 * 60);
  const h0 = Math.max(0, Math.floor(lo / 60)), h1 = Math.min(24, Math.ceil(hi / 60));
  const PPH = 56, top = m => (m - h0 * 60) / 60 * PPH, H = (h1 - h0) * PPH;
  const sel = ui.schDay === -1 ? days.length - 1 : ui.schDay != null && days[ui.schDay] ? ui.schDay : Math.max(0, days.findIndex(d => d.iso === today));
  let classMin = 0, availMinSum = 0;
  const cols = days.map(d => {
    const items = timed.filter(o => o.date === d.iso).map(o => ({s: tToMin(o.start), e: Math.max(tToMin(o.end), tToMin(o.start) + 15), o}))
      .concat(weekTasks.filter(t => t.due === d.iso && onGrid(t)).map(t => ({s: tToMin(t.time), e: tToMin(t.time) + 60, t}))).sort((a, b) => a.s - b.s || b.e - a.e);
    let group = [], groupEnd = -1;
    const flush = () => { const lanes = []; group.forEach(it => { let l = lanes.findIndex(end => end <= it.s); if (l < 0) { l = lanes.length; lanes.push(0); } lanes[l] = it.e; it.lane = l; }); group.forEach(it => it.lanes = lanes.length); group = []; };
    items.forEach(it => { if (it.s >= groupEnd) { flush(); groupEnd = it.e; } else groupEnd = Math.max(groupEnd, it.e); group.push(it); });
    flush();
    const blocks = items.map(it => {
      const pos = `top:${top(it.s)}px;height:${Math.max(22, top(it.e) - top(it.s) - 2)}px;left:calc(${it.lane} * 100% / ${it.lanes} + 2px);width:calc(100% / ${it.lanes} - 4px)`;
      if (it.t) { const c = courseOf(it.t.courseId); return `<button class="sch-b sch-exam" style="${pos};--c:${esc(colorOf(it.t.courseId))}" data-act="edit-task" data-id="${esc(it.t.id)}" data-drag="1" data-type="task" data-dur="60"><b>${esc(it.t.title)}</b><span>${esc(fmtTime(it.t.time))}${c ? " · " + esc(courseLabel(c)) : ""}${it.t.location ? " · " + esc(it.t.location) : ""}</span></button>`; }
      const o = it.o;
      if (o.type === "meet" && o.label !== "Office Hours" && !o.skipped) classMin += it.e - it.s;
      if (o.type === "avail" && !o.skipped) availMinSum += Math.max(0, it.e - it.s) * (o.avail.kind === "work" || o.avail.kind === "shift" ? 1 : 0);
      const sub = o.skipped ? (o.type === "avail" ? "Skipped this day" : "Skipped this week") : o.type === "avail" ? `${esc(o.label)} · ${esc(o.rangeText)}` : `${o.type === "meet" ? esc(o.label) + " · " : o.label ? esc(o.label) + " · " : o.course ? esc(courseLabel(o.course)) + " · " : ""}${esc(fmtTime(o.start))}–${esc(fmtTime(o.end))}`;
      const tip = o.type === "avail" ? `${o.title}, ${o.label}, ${o.rangeText}${o.moved ? " (changed this day only)" : ""}. Tap to change or skip this day.` : `${o.title}${o.label ? ", " + o.label : ""}, ${fmtTime(o.start)}–${fmtTime(o.end)}${o.where ? ", " + o.where : ""}${o.moved ? " (moved this week only)" : ""}. Drag to move${o.type === "meet" || (o.ev && o.ev.repeat) ? " just this week" : ""}.`;
      return `<button class="sch-b ${esc(o.cls)}${o.skipped ? " skipped" : ""}${o.moved ? " moved" : ""}" style="${pos};--c:${esc(o.color)}" data-act="sch-occ" data-type="${o.type}" data-id="${esc(o.id)}" data-key="${esc(o.key)}" data-dur="${tToMin(o.end) - tToMin(o.start)}" ${o.skipped || o.type === "avail" ? "" : `data-drag="1"`} title="${esc(tip)}">${o.type === "meet" && o.c && !o.skipped && o.label !== "Office Hours" ? `<span class="sch-band"><span class="cc-ic" aria-hidden="true">${courseRingHtml(o.c)}</span><b>${esc(o.title)}</b></span><span class="sch-bd"><span>${sub}</span>${o.where ? `<span>${esc(o.where)}</span>` : ""}</span>`
        : o.type === "event" && o.course && !o.skipped ? `<span class="sch-band"><span class="cc-ic" aria-hidden="true">${courseRingHtml(o.course)}</span><b>${esc(courseLabel(o.course))}</b></span><span class="sch-bd"><span class="sch-t">${esc(o.title)}</span><span>${o.label ? esc(o.label) + " · " : ""}${esc(fmtTime(o.start))}–${esc(fmtTime(o.end))}</span>${o.where ? `<span>${esc(o.where)}</span>` : ""}</span>` : `<b>${esc(o.title)}</b><span>${sub}</span>${o.where && !o.skipped ? `<span>${esc(o.where)}</span>` : ""}`}${o.moved ? `<i class="sch-mv">${o.type === "avail" ? "This day only" : "This week only"}</i>` : ""}</button>`;
    }).join("");
    const allDay = occ.filter(o => o.allDay && o.date === d.iso);
    const dueList = weekTasks.filter(t => t.due === d.iso && !onGrid(t)).sort(sortTasks);
    const now = new Date(), nowM = now.getHours() * 60 + now.getMinutes();
    const nowLine = d.iso === today && nowM >= h0 * 60 && nowM <= h1 * 60 ? `<i class="sch-now" style="top:${top(nowM)}px"></i>` : "";
    return {d, dueList, allDay, html: `<div class="sch-col ${d.iso === today ? "is-today" : ""} ${d.i === sel ? "sel" : ""}" data-date="${d.iso}" style="height:${H}px">${blocks}${nowLine}</div>`};
  });
  const heads = cols.map(({d, dueList, allDay}) => {
    const chips = allDay.map(o => `<button class="sch-chip sch-allday${o.type === "avail" ? " k-av k-av-" + o.avail.kind : ""}" style="--c:${esc(o.color)}" data-act="sch-occ" data-type="${o.type}" data-id="${esc(o.id)}" data-key="${esc(o.key)}" title="${esc(o.title)}">${esc(o.title)}</button>`)
      .concat(dueList.map(t => `<button class="sch-chip" style="--c:${esc(colorOf(t.courseId))}" data-act="edit-task" data-id="${esc(t.id)}" title="${esc(t.title)}">${esc(t.title)}${t.time ? ` <span>${esc(fmtTime(t.time))}</span>` : ""}</button>`));
    return `<div class="sch-head ${d.iso === today ? "is-today" : ""} ${d.i === sel ? "sel" : ""}"><div class="sch-dn"><span>${esc(parse(d.iso).toLocaleDateString(undefined, {weekday: "short"}))}</span><b>${parse(d.iso).getDate()}</b></div>
    <div class="sch-due">${chips.slice(0, 3).join("")}${chips.length > 3 ? `<span class="mini">+${chips.length - 3} more</span>` : ""}</div></div>`;
  }).join("");
  let gutter = ""; for (let h = h0; h < h1; h++) { const d = new Date(); d.setHours(h, 0, 0, 0); gutter += `<span style="top:${(h - h0) * PPH}px">${esc(d.toLocaleTimeString(undefined, {hour: "numeric"}))}</span>`; }
  const pills = days.map(d => `<button data-act="sch-day" data-id="${d.i}" aria-pressed="${d.i === sel}" class="${d.iso === today ? "is-today" : ""}"><span>${esc(parse(d.iso).toLocaleDateString(undefined, {weekday: "narrow"}))}</span><b>${parse(d.iso).getDate()}</b></button>`).join("");
  const nEv = occ.filter(o => o.type === "event" && !o.skipped).length;
  const avKinds = AV_ORDER.filter(k => occ.some(o => o.type === "avail" && o.avail.kind === k));
  schNoticeHtml = `<p style="margin:0">${fmtHM(classMin / 60) || "0m"} of class this week${availMinSum >= 15 ? `, ${fmtHM(availMinSum / 60)} of work and shifts` : ""}${nEv ? `, ${nEv} event${nEv === 1 ? "" : "s"}` : ""}${weekTasks.length ? `, ${weekTasks.length} deadline${weekTasks.length === 1 ? "" : "s"}` : ""}. Tap a class to change just this week, or drag it to a new time.</p>${missing.length ? `<div class="sch-ntc"><b>No class times yet</b><span class="mini">Add them so these courses show on your Schedule.</span><div class="sch-missing">${missing.map(c => `<button class="chip" style="--c:${esc(c.color)}" data-act="edit-course" data-id="${esc(c.id)}"><span class="dot"></span>${esc(courseLabel(c))}: Add Class Times</button>`).join("")}</div></div>` : ""}`;
  const ntcBtn = `<button class="btn small sch-ntc-btn" data-act="sch-notices" title="This week's summary${missing.length ? " and courses missing class times" : ""}">Notices${missing.length ? `<span class="sch-ntc-n">${missing.length}</span>` : ""}</button>`;
  return nav.replace(/<\/div><\/div>$/, ntcBtn + "</div></div>") + setup + `
    <div class="sch-pills" role="group" aria-label="Day">${pills}</div>
    <div class="sch-wrap" style="--n:${days.length}">
      <div class="sch-grid" data-h0="${h0}" data-h1="${h1}" data-pph="${PPH}">
        <div class="sch-corner"></div>${heads}
        <div class="sch-gutter" style="height:${H}px">${gutter}</div>${cols.map(c => c.html).join("")}
      </div>
    </div>
    <div class="sch-legend mini"><span class="lg k-lecture">Lecture</span><span class="lg k-lab">Lab</span><span class="lg k-discussion">Discussion or Tutorial</span><span class="lg k-officehours">Office Hours</span><span class="lg k-event">Event</span><span class="lg sch-exam">Exam or Quiz</span>${avKinds.map(k => `<span class="lg k-av k-av-${k}" style="--c:${esc(AVAIL.TYPES[k].color)}">${esc(AVAIL.TYPES[k].label)}</span>`).join("")}</div>`;
}

/* Calendar: Timeline and Schedule share one tab */
const isPlanTab = t => t === "timeline" || t === "schedule" || t === "crunch";
function planViewSet(t){
  if (ui.planView === t) return;
  ui.planView = t;
  try { localStorage.setItem("studyboard:planview", t); } catch(e) {}
}
/* Page header: a title with one line of context, then the page's tabs underneath */
function pageHeadHtml(title, sub, right){
  return `<header class="pg-head"><div class="pg-tt"><h2 class="pg-title">${esc(title)}</h2>${sub ? `<p class="pg-sub">${esc(sub)}</p>` : ""}</div>${right ? `<div class="pg-right">${right}</div>` : ""}</header>`;
}
const relDays = n => n <= 0 ? "today" : n === 1 ? "tomorrow" : `in ${n} days`;
function nextExamWords(list){
  const today = todayISO(), ex = (list || tasksArr()).filter(t => t.status !== "done" && t.due && t.due >= today && /^(Exam|Quiz)$/.test(t.type)).sort((a, b) => a.due.localeCompare(b.due) || String(a.time || "").localeCompare(String(b.time || "")))[0];
  return ex ? `next ${ex.type === "Quiz" ? "quiz" : "exam"} ${relDays(dayDiff(today, ex.due))}` : "";
}
// One line of context for each tabbed page
const nWord = (n, one, many) => `${n} ${n === 1 ? one : many || one + "s"}`;
function pageSub(){
  const today = todayISO(), open = tasksArr().filter(t => t.status !== "done");
  try {
    if (ui.tab === "board") {
      const dueToday = open.filter(t => t.due === today).length, late = open.filter(t => t.due && t.due < today).length, ex = nextExamWords(open);
      if ((ui.bview || "plan") === "plan") return [new Date().toLocaleDateString(undefined, {weekday: "long", month: "long", day: "numeric"}), dueToday ? `${dueToday} due today` : "nothing due today", ex].filter(Boolean).join(" · ");
      return [nWord(open.length, "open task"), open.filter(t => t.status === "doing").length ? `${open.filter(t => t.status === "doing").length} in progress` : "", late ? `${late} overdue` : ""].filter(Boolean).join(" · ");
    }
    if (ui.tab === "flashcards") {
      if (ui.rvView === "quizzes") { const qs = quizzesAll(), taken = qs.filter(x => (x.qz.results || []).length).length; return qs.length ? `${nWord(qs.length, "quiz", "quizzes")} · ${taken} taken` : "Practice quizzes from your decks and notes"; }
      const ds = deckListArr(), cards = ds.reduce((s, d) => s + d.cards.length, 0), due = allDueCount();
      return ds.length ? [nWord(ds.length, "deck"), nWord(cards, "card"), due ? `${due} due today` : (k => k ? `${k} new to learn` : "nothing due today")(ds.reduce((m, d) => m + d.cards.filter(c => !c.draft && cardNew(c)).length, 0))].join(" · ") : "Make a deck to start reviewing";
    }
    if (ui.tab === "courses" && ui.courseTab === "grades") {
      const gs = coursesArr().map(c => window.SBGRADES && SBGRADES.now(c)).filter(g => g && g.pct != null);
      return gs.length ? `${nWord(gs.length, "course")} with marks · average ${Math.round(gs.reduce((s, g) => s + g.pct, 0) / gs.length)}%` : "Add marks to see where you stand";
    }
    if (ui.tab === "courses") {
      const cs = coursesArr(), gs = cs.map(c => window.SBGRADES && SBGRADES.now(c)).filter(g => g && g.pct != null);
      return cs.length ? [nWord(cs.length, "course"), nWord(open.length, "open task"), gs.length ? `average ${Math.round(gs.reduce((s, g) => s + g.pct, 0) / gs.length)}%` : ""].filter(Boolean).join(" · ") : "Add each class you're taking this term";
    }
    if (ui.tab === "files") { const n = Object.keys(state.files || {}).length; return n ? `${nWord(n, "file")} across your courses` : "Slides, readings and handouts in one place"; }
    if (ui.tab === "emails") return "Messages from your school account";
    if (ui.tab === "notes" && window.SBWB && SBWB.on()) { const n = SBWB.boards().length; return n ? nWord(n, "whiteboard") : "Sketch and plan on a big board"; }
    if (ui.tab === "notes") {
      const n = notesArr().filter(x => !x.archived).length; return n ? `${nWord(n, "note")} · ${nWord(new Set(notesArr().filter(x => !x.archived).map(x => x.courseId).filter(Boolean)).size, "course")}` : "Quick notes for your classes";
    }
  } catch (e) { return ""; }
  return "";
}
// Lift the page's own heading above its tabs, with its context line and its buttons beside it
function pageHeadUp(v){
  if (v.querySelector(":scope > .pg-head")) return;
  const tabs = v.querySelector(":scope > .pview-tabs, :scope > .bview-row"); if (!tabs) return;
  const phone = innerWidth < 640, sub = pageSub();
  let title = "", head = null;
  if (tabs.matches(".bview-row")) { const s = tabs.querySelector("[aria-selected=true]"); title = s ? s.textContent.trim() : ""; }
  else {
    head = [...v.querySelectorAll(":scope > .view-head, :scope > .tl-controls, :scope > section > .view-head")].find(h => h.querySelector(":scope > h2") && (tabs.compareDocumentPosition(h) & Node.DOCUMENT_POSITION_FOLLOWING));
    if (!head) return;
    title = head.querySelector(":scope > h2").textContent.trim();
  }
  if (!title) return;
  const box = document.createElement("div"); box.innerHTML = pageHeadHtml(title, sub, "");
  const pg = box.firstChild;
  if (head && !phone) {
    head.querySelector(":scope > h2").remove();
    [...head.attributes].filter(x => x.name.startsWith("data-")).forEach(x => pg.setAttribute(x.name, x.value));
    const rest = [...head.children];
    if (rest.length && rest.length <= 6 && rest.every(c => c.matches("button, .btn, .segb, a.btn, .wb-pick"))) {
      const r = document.createElement("div"); r.className = "pg-right"; rest.forEach(c => r.appendChild(c)); pg.appendChild(r); head.remove();
    } else if (!rest.length) head.remove();
  }
  (tabs.matches(".bview-row") ? tabs.querySelector(".bview-tabs") : tabs).classList.add("pg-tabs");
  v.insertBefore(pg, tabs);
}
{ let was = null; addEventListener("resize", () => { const p = innerWidth < 640; if (was !== null && p !== was && typeof ui !== "undefined" && document.querySelector("#view > .pg-head")) scheduleRender(); was = p; }); }
function planHeadHtml(){
  const t = ui.tab, today = todayISO(), open = tasksArr().filter(x => x.status !== "done" && inFilter(x));
  let title = "Due Dates", sub = [], right = "";
  if (t === "schedule") {
    const mon = ui.schWeek || mondayOf(today), n = open.filter(x => x.due && x.due >= mon && x.due <= addDays(mon, 6)).length;
    title = "Schedule"; sub = [`${fmtShort(mon)} to ${fmtShort(addDays(mon, 6))}`, n ? `${n} due that week` : "nothing due that week"];
  } else if (t === "crunch") {
    title = "Crunch Forecast";
    let w = null; try { w = (SBCRUNCH.model().weeks || []).filter(x => !x.past).slice(0, 6).reduce((m, x) => !m || x.levelIdx > m.levelIdx ? x : m, null); } catch (e) { w = null; }
    const lv = w ? ["calm", "steady", "busy", "heavy", "like a crunch"][w.levelIdx] || "steady" : "";
    sub = [w ? `Heaviest week ahead: ${w.start <= today ? "this week" : `week of ${fmtShort(w.start)}`}, ${w.levelIdx >= 4 ? "a crunch" : lv}` : "How heavy each week ahead looks"];
  } else {
    const dated = open.filter(x => x.due), cs = new Set(dated.map(x => x.courseId).filter(Boolean)).size;
    sub = [dated.length ? `${dated.length} open task${dated.length === 1 ? "" : "s"}${cs > 1 ? ` across ${cs} courses` : ""}` : "No open tasks with due dates", nextExamWords(open)];
    if (!tlPhone()) right = `<div class="segb" role="group" aria-label="View"><button data-act="tl-mode" data-id="bars" aria-pressed="${ui.tlMode === "bars"}">Timeline</button><button data-act="tl-mode" data-id="calendar" aria-pressed="${ui.tlMode === "calendar"}">Month</button></div>`;
  }
  return pageHeadHtml(title, sub.filter(Boolean).join(" · "), right);
}
function planSwitchHtml(){
  const t = ui.tab;
  return `<div class="pview-tabs pg-tabs" role="tablist" aria-label="Calendar view"><button role="tab" data-act="plan-view" data-id="timeline" aria-selected="${t === "timeline"}">Due Dates</button><button role="tab" data-act="plan-view" data-id="schedule" aria-selected="${t === "schedule"}">Schedule</button><button role="tab" data-act="plan-view" data-id="crunch" aria-selected="${t === "crunch"}">Crunch</button></div>`;
}

/* Courses and Files share one nav tab */
const isCfTab = t => t === "courses" || t === "files" || t === "emails";
function cfSwitchHtml(){
  const t = ui.tab, g = t === "courses" && ui.courseTab === "grades", hasCourses = typeof coursesArr === "function" && coursesArr().length > 0;
  return `<div class="pview-tabs cf-tabs" role="tablist" aria-label="Courses, Grades, Emails and Files"><button role="tab" data-act="cf-view" data-id="courses" aria-selected="${t === "courses" && !g}">Courses</button>${hasCourses ? `<button role="tab" data-act="cf-view" data-id="grades" aria-selected="${g}">Grades</button>` : ""}${t === "emails" || (window.SBEMAIL && SBEMAIL.available()) ? `<button role="tab" data-act="cf-view" data-id="emails" aria-selected="${t === "emails"}">Emails</button>` : ""}<button role="tab" data-act="cf-view" data-id="files" aria-selected="${t === "files"}">Files</button></div>`;
}

