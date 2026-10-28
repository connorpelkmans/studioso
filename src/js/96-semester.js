/* ===== module: 96-semester.js ===== */
/* "Set up your semester" */
(() => {
const LS = "studyboard:semester";
const read = () => { try { const o = JSON.parse(localStorage.getItem(LS) || "null"); return o && typeof o === "object" ? o : {}; } catch (e) { return {}; } };
let M = read();
const save = patch => { M = Object.assign({}, M, patch); try { localStorage.setItem(LS, JSON.stringify(M)); } catch (e) {} };
const IDS = ["courses", "work", "review", "times", "prep", "week"];
const stepName = id => ({
  courses: tr("sem.step.courses", "Courses"), work: tr("sem.step.work", "Your work"), review: tr("sem.step.review", "Review"),
  times: tr("sem.step.times", "Times"), prep: tr("sem.step.prep", "Prep"), week: tr("sem.step.week", "Your week")})[id] || id;
const R = {away: false, before: null, queue: [], qTotal: 0, scope: "new", msg: "", removed: [], showAll: false, since: null, solo: false};
const ico = d => `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const CHECK = ico('<path d="M5 12.5l4.5 4.5L19 7.5"/>');
const isEmpty = () => !allTasks().length;
const stepIdx = () => Math.max(0, IDS.indexOf(M.step));
const mine = t => t && !t.breakdownOf && !t.prepFor;
const aiOn = () => { try { return !!aiReady(); } catch (e) { return false; } };
const keyOf = t => String(t.title).toLowerCase().replace(/\W+/g, "") + "|" + t.due;

/* What this run found */
function found(){
  const since = R.since != null ? R.since : Number(M.since) || 0;
  let L = tasksArr().filter(mine);
  L = R.scope === "all" ? L.filter(t => t.status !== "done") : L.filter(t => (Number(t.created) || 0) >= since);
  return L.sort(sortTasks);
}
const upcomingExams = () => found().filter(t => MILESTONE(t.type) && t.due && t.due > todayISO() && t.status !== "done");
const hasPlan = t => allTasks().some(x => x.prepFor === t.id);
const hasKids = t => allTasks().some(x => x.breakdownOf === t.id);
const bigOnes = () => !window.SBBREAK ? [] : found().filter(t => !MILESTONE(t.type) && t.due && t.due > todayISO() && t.status !== "done" && !t.breakdownParent && !hasKids(t) && SBBREAK.big(t));
const needTimes = () => found().filter(t => SBEST.needs(t));
const suggestH = t => { let h = 1; try { h = t.aiHours && Number(t.aiHours.h) > 0 ? Number(t.aiHours.h) : localEstimate(t).hours; } catch (e) { h = 1; } return Math.max(0.25, Math.round(h * 4) / 4); };
const hrs = h => fmtHM(h) || (h * 60) + "m";
function tallyText(){
  const n = found().length, c = coursesArr().length;
  return tr("sem.tally", "{a}, {b}", {a: trn("sem.tally.i", n, "{n} item found so far|{n} items found so far"), b: trn("sem.tally.c", c, "{n} course|{n} courses")});
}
const snap = () => ({t: allTasks().length, c: allCourses().length});

/* The sheet */
function announce(text){ const l = $("#semLive"); if (!l) return; l.textContent = ""; setTimeout(() => { l.textContent = text; }, 40); }
function shell(){
  return `<div class="sheet sem-sheet" role="group" aria-labelledby="semH"><p class="sr" id="semLive" role="status" aria-live="polite"></p><div class="sem-main"></div></div>`;
}
function stepper(){
  const cur = stepIdx();
  return `<div class="sem-top"><p class="sem-count mini">${esc(tr("sem.count", "Step {i} of {n}", {i: cur + 1, n: IDS.length}))}</p>
    <ol class="sem-steps" aria-label="${esc(tr("sem.progress", "Setup progress"))}">${IDS.map((id, i) => {
      const st = i === cur ? "cur" : M.done && M.done[id] ? "done" : M.skip && M.skip[id] ? "skip" : "";
      const state = st === "cur" ? tr("sem.st.cur", "current") : st === "done" ? tr("sem.st.done", "done") : st === "skip" ? tr("sem.st.skip", "skipped") : "";
      const lab = tr("sem.st.label", "Step {i} of {n}: {name}", {i: i + 1, n: IDS.length, name: stepName(id)}) + (state ? ", " + state : "");
      return `<li><button type="button" class="sem-st ${st}" data-sem="goto" data-id="${id}" ${st === "cur" ? 'aria-current="step"' : ""} aria-label="${esc(lab)}"><span class="sem-n" aria-hidden="true">${st === "done" ? CHECK : i + 1}</span><span class="sem-l">${esc(stepName(id))}</span></button></li>`;
    }).join("")}</ol></div>`;
}
function foot(){
  if (R.solo) return `<div class="sheet-foot"><span class="spacer"></span><button type="button" class="btn primary" data-sem="solo-done">${esc(tr("sem.solo.done", "Done"))}</button></div>`;
  const i = stepIdx(), last = i === IDS.length - 1;
  if (last) return `<div class="sheet-foot"><button type="button" class="btn" data-sem="back">${esc(tr("sem.back", "Back"))}</button><span class="spacer"></span>
    <button type="button" class="btn" data-sem="finish" data-id="crunch">${esc(tr("sem.week.crunch", "See Crunch Forecast"))}</button>
    <button type="button" class="btn primary" data-sem="finish" data-id="board">${esc(tr("sem.week.plan", "Open Today's Plan"))}</button></div>`;
  return `<div class="sheet-foot"><button type="button" class="btn" data-sem="back" ${i === 0 ? "hidden" : ""}>${esc(tr("sem.back", "Back"))}</button><span class="spacer"></span>
    <button type="button" class="link-btn sem-skip" data-sem="skip">${esc(tr("sem.skip", "Skip This Step"))}</button>
    <button type="button" class="btn primary" data-sem="next">${esc(tr("sem.next", "Next"))}</button></div>`;
}
function paint(keep, focusHead, say){
  const main = dlg.querySelector(".sem-sheet .sem-main"); if (!main) return;
  const old = main.querySelector(".sem-body"), top = old ? old.scrollTop : 0, id = R.solo ? "review" : IDS[stepIdx()];
  main.innerHTML = head(R.solo ? tr("sem.solo.title", "Check What We Found") : tr("sem.title", "Set Up Your Semester")) + (R.solo ? "" : stepper()) + `<div class="sheet-body sem-body">${VIEW[id]()}</div>` + foot();
  const b = main.querySelector(".sem-body"); if (keep && b) b.scrollTop = top;
  if (focusHead) { const h = $("#semH"); if (h) try { h.focus({preventScroll: true}); } catch (e) { } }
  if (say) announce(say === true ? tr("sem.live.step", "Step {i} of {n}: {name}", {i: stepIdx() + 1, n: IDS.length, name: stepName(id)}) : say);
}
function open(o){
  o = o || {};
  if (window.SBTOUR && SBTOUR.active()) return false;
  const fresh = !M.since || M.fin || !IDS.includes(M.step) || Date.now() - Number(M.since) > 45 * 864e5;
  // Courses are already there (from the welcome setup, or added by hand), so start at bringing in work
  const had = coursesArr().length > 0;
  if (fresh || o.restart) save({since: Date.now(), step: had ? "work" : "courses", done: had ? {courses: true} : {}, skip: {}, fin: 0, from: o.from || ""});
  R.scope = "new"; R.msg = ""; R.removed = []; R.queue = []; R.qTotal = 0; R.away = false; R.showAll = false; R.since = null; R.solo = false;
  openSheet(shell());
  paint(false, true, tr("sem.live.open", "Set up your semester. Step {i} of {n}. Every step can be skipped.", {i: stepIdx() + 1, n: IDS.length}));
  return true;
}
function go(id, say){ if (!IDS.includes(id)) return; save({step: id}); R.msg = ""; paint(false, true, say === undefined ? true : say); }
function mark(kind){
  const id = M.step, done = Object.assign({}, M.done), skip = Object.assign({}, M.skip);
  if (kind === "done") { done[id] = true; delete skip[id]; } else { skip[id] = true; delete done[id]; }
  save({done, skip});
}
function finish(to){
  const done = Object.assign({}, M.done, {week: true});
  save({done, fin: Date.now(), step: "week"});
  if (dlg.open) dlg.close();
  ui.courseId = null; ui.tab = to === "crunch" && window.SBCRUNCH ? "crunch" : "board";
  render(); window.scrollTo(0, 0);
}

/* Leaving for another sheet, and coming back */
function leave(fn){
  R.away = true; R.before = snap();
  try { fn(); } catch (e) { console.warn("semester", e); }
  if (dlg.querySelector(".sem-sheet")) R.away = false;
}
function nextSyllabus(){
  const f = R.queue.shift(); if (!f) return;
  leave(() => importSheet("", f));
}
function back(){
  if (!R.away || dlg.open) return;
  R.away = false;
  const a = R.before || snap(), b = snap(), dt = Math.max(0, b.t - a.t), dc = Math.max(0, b.c - a.c);
  if (R.queue.length && (dt || dc)) { R.msg = ""; nextSyllabus(); return; }
  R.msg = dt || dc
    ? tr("sem.back.added", "Added {tasks} and {courses}.", {tasks: trn("sem.n.tasks", dt, "{n} task|{n} tasks"), courses: trn("sem.n.courses", dc, "{n} course|{n} courses")})
    : tr("sem.back.none", "Nothing was added. That is okay, you can try another way.");
  openSheet(shell()); paint(false, true, R.msg);
}
dlg.addEventListener("close", () => { if (R.solo) { R.solo = false; R.since = null; } if (R.away) setTimeout(back, 250); });

/* Step 1: courses */
function vCourses(){
  const cs = coursesArr();
  return `<h3 class="sem-h" id="semH" tabindex="-1">${esc(tr("sem.courses.h", "Which classes are you taking?"))}</h3>
    <p class="sem-lead">${esc(tr("sem.courses.lead", "Add each class so its work gets its own color. Skipping is fine: a syllabus adds its own course in the next step."))}</p>
    ${cs.length ? `<ul class="sem-chips" aria-label="${esc(tr("sem.courses.list", "Your courses"))}">${cs.map(c => `<li style="--c:${esc(c.color || "#8A94A6")}"><span class="sem-dot" aria-hidden="true"></span><b>${esc(courseLabel(c))}</b>${c.code && c.name && c.name !== c.code ? ` <span class="mini">${esc(c.name)}</span>` : ""}</li>`).join("")}</ul>` : ""}
    <div class="sem-add">
      <label class="f"><span class="lbl">${esc(tr("sem.courses.code", "Course code"))}</span><input type="text" id="semCode" maxlength="24" autocomplete="off" placeholder="BIO 210" data-noenter></label>
      <label class="f"><span class="lbl">${esc(tr("sem.courses.name", "Course name"))}</span><input type="text" id="semName" maxlength="80" autocomplete="off" placeholder="${esc(tr("sem.courses.ph", "Marine Biology"))}" data-noenter></label>
      <button type="button" class="btn" data-sem="course-add">${esc(tr("sem.courses.add", "Add Course"))}</button>
    </div>
    <p class="status-msg sem-msg" id="semMsg">${esc(R.msg)}</p>`;
}
// quiet: on the way to another step, so a typed course isn't lost
function addCourse(quiet){
  const code = (($("#semCode") || {}).value || "").trim(), name = (($("#semName") || {}).value || "").trim(), msg = $("#semMsg");
  if (quiet && (!code && !name || coursesArr().some(c => (code && String(c.code || "").toLowerCase() === code.toLowerCase()) || (!code && String(c.name || "").toLowerCase() === name.toLowerCase())))) return;
  if (!code && !name) { const t = tr("sem.courses.empty", "Type a course code or a name first."); if (msg) msg.textContent = t; announce(t); const f = $("#semCode"); if (f) f.focus(); return; }
  const dup = coursesArr().find(c => (code && String(c.code || "").toLowerCase() === code.toLowerCase()) || (!code && String(c.name || "").toLowerCase() === name.toLowerCase()));
  if (dup) { const t = tr("sem.courses.dup", "{name} is already in your list.", {name: courseLabel(dup)}); if (msg) msg.textContent = t; announce(t); return; }
  const used = coursesArr().map(c => c.color);
  const nc = {id: uid(), created: Date.now(), name: name || code, code, instructor: "", schedule: "", room: "", office: "", meetings: [], color: COLORS.find(x => !used.includes(x)) || COLORS[used.length % COLORS.length], notes: "", links: []};
  applyChanges([{kind: "course", id: nc.id, after: nc}], "");
  if (quiet) return;
  R.msg = tr("sem.courses.added", "Added {name}. Add another, or choose Next.", {name: nc.name});
  paint(true, false, R.msg);
  const f = $("#semCode"); if (f) try { f.focus({preventScroll: true}); } catch (e) { }
}

/* Step 2: bring in work */
function qPanel(){
  if (!R.queue.length) return "";
  return `<div class="sem-queue" role="group" aria-label="${esc(tr("sem.q.label", "Syllabi waiting"))}"><span>${esc(trn("sem.q.n", R.queue.length, "{n} more syllabus is waiting. Next: {name}|{n} more syllabi are waiting. Next: {name}", {name: R.queue[0].name}))}</span>
    <button type="button" class="btn small" data-sem="q-next">${esc(tr("sem.q.next", "Read Next One"))}</button><button type="button" class="link-btn" data-sem="q-clear">${esc(tr("sem.q.clear", "Clear"))}</button></div>`;
}
function typeBox(){
  return `<label class="f"><span class="lbl">${esc(tr("sem.type.l", "Or type a few things, one per line"))}</span>
    <textarea id="semType" rows="3" data-noenter placeholder="${esc(tr("sem.type.ph", "Bio quiz Friday 2pm\nEssay 1 due Oct 20\nMidterm Nov 3"))}"></textarea></label>
    <div class="sem-row-btns"><button type="button" class="btn" data-sem="type-add">${esc(tr("sem.type.add", "Add These"))}</button></div>`;
}
function vWork(){
  return `<h3 class="sem-h" id="semH" tabindex="-1">${esc(tr("sem.work.h", "Bring in your work"))}</h3>
    <p class="sem-lead">${esc(tr("sem.work.lead", "Use whichever is easiest, or more than one. You'll check everything in the next step."))}</p>
    <div class="sem-card sem-drop" id="semDrop"><div><b>${esc(tr("sem.work.pdf", "Syllabus PDFs"))}</b><span class="mini">${esc(tr("sem.work.pdf.s", "Choose one per course, or all at once. They're read here on your device."))}</span></div>
      <div class="sem-row-btns"><button type="button" class="btn primary" data-sem="pdf">${esc(tr("sem.work.pdf.b", "Choose PDFs"))}</button><button type="button" class="btn" data-sem="paste">${esc(tr("sem.work.paste", "Paste Text"))}</button></div>
      <input type="file" id="semPdf" class="sr" tabindex="-1" multiple accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain${aiOn() ? ",image/*" : ""}" aria-label="${esc(tr("sem.work.pdf.b", "Choose PDFs"))}">
      ${qPanel()}</div>
    <div class="sem-card"><div><b>${esc(tr("sem.work.lms", "Your school's site"))}</b><span class="mini">${esc((() => { try { return window.SBLMS && SBLMS.grabOk && SBLMS.grabOk(); } catch (e) { return false; } })()
        ? tr("sem.work.lms.web", "Brightspace, Canvas or Blackboard: due dates, grades, announcements and what you've already submitted. On the website in desktop Chrome, the Studyboard School Sync extension brings it all in. It only reads and never sees your password. Your school's calendar link brings in due dates in any browser.")
        : tr("sem.work.lms.s", "Brightspace, Canvas or Blackboard. Studyboard only reads from it."))}</span></div>
      <div class="sem-row-btns"><button type="button" class="btn" data-sem="lms">${esc(tr("sem.work.lms.b", "Connect School Site"))}</button></div></div>
    <div class="sem-card"><div><b>${esc(tr("sem.work.ics", "A calendar file"))}</b><span class="mini">${esc(tr("sem.work.ics.s", "A .ics file from Google, Apple or Outlook, or your school's calendar export."))}</span></div>
      <div class="sem-row-btns"><button type="button" class="btn" data-sem="ics">${esc(tr("sem.work.ics.b", "Choose Calendar File"))}</button></div>
      <input type="file" id="semIcs" class="sr" tabindex="-1" accept=".ics,.ical,.icalendar,text/calendar" aria-label="${esc(tr("sem.work.ics.b", "Choose Calendar File"))}"></div>
    <div class="sem-card sem-type">${typeBox()}</div>
    <p class="status-msg sem-msg" id="semMsg">${esc(R.msg)}</p>
    <p class="sem-tally mini" id="semTally">${esc(tallyText())}</p>`;
}
function queueFiles(list){
  const ai = aiOn();
  const ok = [...list].filter(f => /\.(pdf|docx|txt)$/i.test(f.name) || f.type === "application/pdf" || f.type === "text/plain" || (ai && /^image\//.test(f.type)));
  if (!ok.length) { R.msg = tr("sem.q.bad2", "Those files are not PDF or Word files. Choose a syllabus as a PDF or .docx, or paste its text."); const m = $("#semMsg"); if (m) m.textContent = R.msg; announce(R.msg); return; }
  R.queue = R.queue.concat(ok).slice(0, 12); R.qTotal = R.queue.length;
  nextSyllabus();
}
function typeAdd(){
  const ta = $("#semType"), msg = $("#semMsg"); if (!ta) return;
  const text = ta.value.trim();
  const say = t => { R.msg = t; if (msg) msg.textContent = t; announce(t); };
  if (!text) { say(tr("sem.type.empty", "Type something first, like Bio quiz Friday 2pm.")); ta.focus(); return; }
  let drafts = [];
  try { const r = window.SBCAPTURE && SBCAPTURE.parse(text); drafts = ((r && r.drafts) || []).filter(d => d && String(d.title || "").trim()); } catch (e) { console.warn("semester parse", e); }
  if (!drafts.length) { say(tr("sem.type.none", "No task found in that yet. Try one per line, like Bio quiz Friday 2pm.")); ta.focus(); return; }
  const made = SBCAPTURE.commit(drafts, {inline: true}) || [];
  R.msg = trn("sem.type.added", made.length, "Added {n} task.|Added {n} tasks.");
  paint(true, false, R.msg);
  const t2 = $("#semType"); if (t2) try { t2.focus({preventScroll: true}); } catch (e) { }
}

/* Step 3: review */
const flagsOf = (t, dupes) => {
  const out = [];
  if (!t.due) out.push(tr("sem.flag.nodate", "Needs a date"));
  else if (t.due < todayISO() && t.status !== "done") out.push(tr("sem.flag.past", "This date has passed"));
  if (dupes.has(keyOf(t))) out.push(tr("sem.flag.dup", "Looks like a duplicate"));
  return out;
};
const dupesOf = L => { const seen = new Set(), d = new Set(); L.forEach(t => { const k = keyOf(t); if (seen.has(k)) d.add(k); seen.add(k); }); return d; };
function summaryLine(L){
  const ex = L.filter(t => MILESTONE(t.type)).length, nd = L.filter(t => !t.due).length;
  return trn("sem.sum.found", L.length, "{n} item found|{n} items found") + (ex ? ", " + trn("sem.sum.ex", ex, "{n} exam or quiz|{n} exams and quizzes") : "") + (nd ? ". " + trn("sem.sum.nd", nd, "{n} needs a date.|{n} need a date.") : ".");
}
function vReview(){
  const L = found(), cs = coursesArr(), dupes = dupesOf(L);
  const LIM = 60, shown = R.showAll ? L : L.slice(0, LIM);
  const undo = R.removed.length ? `<button type="button" class="link-btn" data-sem="undo-rm">${esc(tr("sem.rv.undo", "Undo Remove"))}</button>` : "";
  const scope = `<div class="segb" role="group" aria-label="${esc(tr("sem.rv.scope", "Which items"))}"><button type="button" data-sem="scope" data-id="new" aria-pressed="${R.scope === "new"}">${esc(tr("sem.rv.new", "Added in this setup"))}</button><button type="button" data-sem="scope" data-id="all" aria-pressed="${R.scope === "all"}">${esc(tr("sem.rv.all", "Everything coming up"))}</button></div>`;
  const rows = shown.map(t => {
    const fl = flagsOf(t, dupes), tt = t.title;
    return `<li class="sem-r${fl.length ? " chk" : ""}" data-id="${esc(t.id)}" style="--c:${esc(colorOf(t.courseId))}">
      <input type="text" data-sf="title" value="${esc(tt)}" maxlength="200" aria-label="${esc(tr("sem.rv.title", "Title"))}">
      <div class="sem-r2">
        <select data-sf="type" aria-label="${esc(tr("sem.rv.type", "Type for {t}", {t: tt}))}">${TYPES.map(x => `<option ${x === t.type ? "selected" : ""}>${esc(x)}</option>`).join("")}</select>
        <input type="date" data-sf="due" value="${esc(t.due || "")}" aria-label="${esc(tr("sem.rv.due", "Due date for {t}", {t: tt}))}" ${t.due ? "" : 'aria-invalid="true"'}>
        ${cs.length ? `<select data-sf="courseId" aria-label="${esc(tr("sem.rv.course", "Course for {t}", {t: tt}))}"><option value="">${esc(tr("sem.rv.nocourse", "No course"))}</option>${cs.map(c => `<option value="${esc(c.id)}" ${c.id === t.courseId ? "selected" : ""}>${esc(courseLabel(c))}</option>`).join("")}</select>` : ""}
        <button type="button" class="icon-btn sem-rm" data-sem="rm" data-id="${esc(t.id)}" aria-label="${esc(tr("sem.rv.rm", "Remove {t}", {t: tt}))}">${ico('<path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12"/>')}</button>
      </div>
      ${fl.length ? `<span class="sem-flag">${esc(fl.join(". "))}</span>` : ""}</li>`;
  }).join("");
  const empty = `<div class="empty sem-empty"><strong>${esc(tr("sem.rv.none", "Nothing Found Yet"))}</strong>${esc(tr("sem.rv.none.s", "That is fine. Type a few things below and they will show up here, or go back and try another way."))}
    <div class="sem-type sem-card">${typeBox()}</div></div>`;
  return `<h3 class="sem-h" id="semH" tabindex="-1">${esc(tr("sem.rv.h", "Check what we found"))}</h3>
    <p class="sem-lead">${esc(tr("sem.rv.lead", "Fix a title, a type or a date right here. Changes save as you go."))}</p>
    <div class="sem-bar">${scope}<span class="spacer"></span>${undo}</div>
    <p class="status-msg sem-msg" id="semMsg">${esc(R.msg)}</p>
    ${L.length ? `<p class="sem-sumline" id="semSum">${esc(summaryLine(L))}</p><ul class="sem-list">${rows}</ul>${L.length > shown.length ? `<button type="button" class="btn small" data-sem="show-all">${esc(tr("sem.rv.more", "Show All {n}", {n: L.length}))}</button>` : ""}` : empty}`;
}
const startFor = n => {
  const t0 = todayISO();
  if (!n.due) return n.start;
  if (MILESTONE(n.type)) return n.due;
  const s = addDays(n.due, -(SPAN[n.type] ?? 3));
  return s < t0 ? (n.due < t0 ? n.due : t0) : s;
};
function editRow(el){
  const li = el.closest(".sem-r"), t = li && state.tasks[li.dataset.id]; if (!t) return;
  const n = clone(t), f = el.dataset.sf, v = el.value;
  if (f === "title") { if (!v.trim()) { el.value = t.title; return; } n.title = v.trim().slice(0, 200); }
  else if (f === "type") {
    n.type = TYPES.includes(v) ? v : n.type;
    if (MILESTONE(n.type)) { n.hours = null; n.priority = "high"; }
    n.start = startFor(n);
  }
  else if (f === "due") { n.due = isDate(v) ? v : ""; n.start = startFor(n); }
  else if (f === "courseId") n.courseId = v;
  applyChanges([{kind: "task", id: n.id, after: normTask(n)}], "");
  const L = found(), sum = $("#semSum"); if (sum) sum.textContent = summaryLine(L);
  if (f === "due" || f === "type") {
    const fl = flagsOf(state.tasks[n.id], dupesOf(L)); let s = li.querySelector(".sem-flag");
    li.classList.toggle("chk", !!fl.length);
    if (fl.length) { if (!s) { s = document.createElement("span"); s.className = "sem-flag"; li.appendChild(s); } s.textContent = fl.join(". "); } else if (s) s.remove();
    const di = li.querySelector('[data-sf="due"]'); if (di) { if (n.due) di.removeAttribute("aria-invalid"); else di.setAttribute("aria-invalid", "true"); }
  }
  announce(tr("sem.rv.saved", "Saved."));
}
function removeRow(id){
  const t = state.tasks[id]; if (!t) return;
  const gone = [t].concat(allTasks().filter(x => x.breakdownOf === id || x.prepFor === id));
  R.removed = gone.map(x => clone(x));
  applyChanges(gone.map(x => ({kind: "task", id: x.id, after: null})), "");
  R.msg = tr("sem.rv.removed", "Removed {t}. You can undo this.", {t: t.title});
  paint(true, false, R.msg);
  const u = dlg.querySelector('[data-sem="undo-rm"]'); if (u) try { u.focus({preventScroll: true}); } catch (e) { }
}
function undoRemove(){
  if (!R.removed.length) return;
  applyChanges(R.removed.map(x => ({kind: "task", id: x.id, after: x})), "");
  R.msg = tr("sem.rv.restored", "Put it back."); R.removed = [];
  paint(true, false, R.msg);
}

/* Step 4: time estimates */
function vTimes(){
  const L = needTimes(), have = found().filter(t => !MILESTONE(t.type) && isNum(t.hours) && Number(t.hours) > 0).length;
  const rows = L.slice(0, 40).map(t => { const c = courseOf(t.courseId); return `<li class="sem-r1" style="--c:${esc(colorOf(t.courseId))}"><span class="sem-r1t"><b>${esc(t.title)}</b><span class="mini">${c ? esc(courseLabel(c)) + " · " : ""}${esc(t.type || "")} · ${esc(relDue(t))}</span></span><span class="sem-est">${esc(hrs(suggestH(t)))}</span></li>`; }).join("");
  return `<h3 class="sem-h" id="semH" tabindex="-1">${esc(tr("sem.t.h", "How long will each take?"))}</h3>
    <p class="sem-lead">${esc(tr("sem.t.lead", "Today's Plan uses these to spread work over the days before each due date. They're suggestions from your history or typical times, and you can change any later."))}</p>
    <p class="status-msg sem-msg" id="semMsg">${esc(R.msg)}</p>
    ${L.length ? `<div class="sem-bar"><button type="button" class="btn primary" data-sem="est-all">${esc(trn("sem.t.all", L.length, "Use Suggested Time|Use Suggested Times ({n})"))}</button><button type="button" class="btn" data-sem="est-open">${esc(tr("sem.t.one", "Choose One by One"))}</button></div>
      <ul class="sem-list">${rows}</ul>${L.length > 40 ? `<p class="mini">${esc(tr("sem.t.more", "And {n} more. The button above covers all of them.", {n: L.length - 40}))}</p>` : ""}`
    : `<div class="empty sem-empty"><strong>${esc(found().length ? tr("sem.t.done", "Every Item Has a Time") : tr("sem.t.none", "Nothing Needs a Time Yet"))}</strong>${esc(tr("sem.t.none.s", "Exams and quizzes are left out: they happen at a set time."))}${have ? " " + esc(trn("sem.t.have", have, "{n} item already has one.|{n} items already have one.")) : ""}</div>`}`;
}
function useTimes(){
  const L = needTimes(); if (!L.length) return;
  applyChanges(L.map(t => { const n = clone(t); n.hours = suggestH(t); return {kind: "task", id: t.id, after: n}; }), "");
  try { localStorage.setItem("studyboard:est:done", todayISO()); } catch (e) { }
  R.msg = trn("sem.t.saved", L.length, "Added {n} time estimate.|Added {n} time estimates.");
  paint(true, false, R.msg);
}

/* Step 5: exam prep and breakdown */
function vPrep(){
  const ex = upcomingExams(), big = bigOnes();
  const meta = t => { const c = courseOf(t.courseId); return `${c ? esc(courseLabel(c)) + " · " : ""}${esc(relDue(t))}`; };
  const exRows = ex.map(t => { const has = hasPlan(t); return `<li class="sem-r1" style="--c:${esc(colorOf(t.courseId))}"><span class="sem-r1t"><b>${esc(t.title)}</b><span class="mini">${meta(t)}</span></span>
    <button type="button" class="btn small" data-sem="prep" data-id="${esc(t.id)}" aria-label="${esc(has ? tr("sem.p.view", "View prep plan for {t}", {t: t.title}) : tr("sem.p.plan", "Plan prep for {t}", {t: t.title}))}">${esc(has ? tr("sem.p.made", "Plan Made") : tr("sem.p.btn", "Plan My Prep"))}</button></li>`; }).join("");
  const bigRows = big.map(t => `<li class="sem-r1" style="--c:${esc(colorOf(t.courseId))}"><span class="sem-r1t"><b>${esc(t.title)}</b><span class="mini">${meta(t)}</span></span>
    <button type="button" class="btn small" data-sem="bd" data-id="${esc(t.id)}" aria-label="${esc(tr("sem.p.bd.l", "Break down {t}", {t: t.title}))}">${esc(tr("sem.p.bd", "Break It Down"))}</button></li>`).join("");
  return `<h3 class="sem-h" id="semH" tabindex="-1">${esc(tr("sem.p.h", "Get ahead of the big ones"))}</h3>
    <p class="sem-lead">${esc(tr("sem.p.lead", "Exams get a study plan worked back from the date, and big assignments split into smaller steps. Both are optional and quick."))}</p>
    <p class="status-msg sem-msg" id="semMsg">${esc(R.msg)}</p>
    ${!ex.length && !big.length ? `<div class="empty sem-empty"><strong>${esc(tr("sem.p.none", "Nothing Needs This Right Now"))}</strong>${esc(tr("sem.p.none.s", "No upcoming exams or big assignments were found. You can plan prep any time from an exam."))}</div>` : ""}
    ${ex.length ? `<h4 class="sem-h4">${esc(tr("sem.p.ex", "Exams and quizzes"))}</h4><ul class="sem-list">${exRows}</ul>` : ""}
    ${big.length ? `<h4 class="sem-h4">${esc(tr("sem.p.big", "Big assignments"))}</h4>
      <div class="sem-bar"><button type="button" class="btn" data-sem="bd-all">${esc(trn("sem.p.bd.all", big.length, "Break It Down|Break Down All ({n})"))}</button><span class="mini">${esc(tr("sem.p.bd.s", "Quick version, on this device. Open one to tune the steps."))}</span></div><ul class="sem-list">${bigRows}</ul>` : ""}`;
}
function bdAll(){
  const ch = []; let n = 0;
  bigOnes().forEach(t => { const x = SBBREAK.expandNew(t); if (!x) return; ch.push({kind: "task", id: x.parent.id, after: x.parent}); x.kids.forEach(k => ch.push({kind: "task", id: k.id, after: k})); n++; });
  if (ch.length) applyChanges(ch, "");
  R.msg = n ? trn("sem.p.bd.done", n, "Split {n} assignment into steps.|Split {n} assignments into steps.") : tr("sem.p.bd.nope", "Those could not be split automatically. Open one to do it by hand.");
  paint(true, false, R.msg);
}

/* Step 6: your week */
const LEVEL = l => ({calm: tr("sem.lv.calm", "calm"), steady: tr("sem.lv.steady", "steady"), busy: tr("sem.lv.busy", "busy"), heavy: tr("sem.lv.heavy", "heavy"), crunch: tr("sem.lv.crunch", "crunch")})[l] || l;
function weeksAhead(){
  try { const m = window.SBCRUNCH && SBCRUNCH.model(); return ((m && m.weeks) || []).filter(w => !w.past).slice(0, 4); } catch (e) { return []; }
}
function vWeek(){
  const L = found(), t0 = todayISO(), lim = addDays(t0, 7);
  const cs = new Set(L.map(t => t.courseId).filter(Boolean)).size, ex = L.filter(t => MILESTONE(t.type) && t.status !== "done").length;
  const withT = L.filter(t => MILESTONE(t.type) || (isNum(t.hours) && Number(t.hours) > 0)).length;
  const soon = tasksArr().filter(t => mine(t) && t.status !== "done" && t.due && t.due >= t0 && t.due <= lim).sort(sortTasks);
  const wk = weeksAhead(), worst = wk.reduce((a, w) => Math.max(a, w.levelIdx || 0), 0);
  const total = Math.round(tasksArr().filter(t => mine(t) && t.status !== "done").reduce((s, t) => s + (Number(t.hours) || 0), 0) * 10) / 10;
  const summary = !L.length ? tr("sem.w.empty", "Nothing is planned yet, and that's okay. Add things from the Board any time, or go back and bring some in.")
    : tr("sem.w.sum", "{items} across {courses}{exams}. {done} have a time or a set date.", {
      items: trn("sem.n.items", L.length, "{n} item|{n} items"), courses: trn("sem.n.courses", cs, "{n} course|{n} courses"),
      exams: ex ? tr("sem.w.incl", ", including {x}", {x: trn("sem.sum.ex", ex, "{n} exam or quiz|{n} exams and quizzes")}) : "", done: withT});
  const tone = worst >= 3 ? tr("sem.w.heavy", "One of the coming weeks looks heavy. The Crunch Forecast shows where, and how to spread it out.")
    : wk.length && L.length ? tr("sem.w.calm", "The weeks ahead look manageable. Today's Plan will fit your work into your study hours.") : "";
  return `<h3 class="sem-h" id="semH" tabindex="-1">${esc(tr("sem.w.h", "Here is your week"))}</h3>
    <p class="sem-lead sem-ok">${CHECK}<span>${esc(summary)}${total > 0 ? " " + esc(tr("sem.w.hours", "About {h} of work in all.", {h: hrs(total)})) : ""}</span></p>
    <h4 class="sem-h4">${esc(tr("sem.w.next", "Due in the next 7 days"))}</h4>
    ${soon.length ? `<ul class="sem-list">${soon.slice(0, 8).map(t => { const c = courseOf(t.courseId); return `<li class="sem-r1" style="--c:${esc(colorOf(t.courseId))}"><span class="sem-r1t"><b>${esc(t.title)}</b><span class="mini">${c ? esc(courseLabel(c)) + " · " : ""}${esc(t.type || "")}</span></span><span class="sem-est">${esc(relDue(t))}</span></li>`; }).join("")}</ul>${soon.length > 8 ? `<p class="mini">${esc(tr("sem.w.more", "And {n} more.", {n: soon.length - 8}))}</p>` : ""}`
      : `<p class="empty-note mini">${esc(tr("sem.w.quiet", "Nothing is due in the next 7 days. A calm start."))}</p>`}
    ${wk.length ? `<h4 class="sem-h4">${esc(tr("sem.w.fc", "The weeks ahead"))}</h4><ul class="sem-weeks">${wk.map(w => `<li class="lv${w.levelIdx || 0}"><b>${esc(tr("sem.w.of", "Week of {d}", {d: fmtShort(w.start)}))}</b> <span>${esc(LEVEL(w.level))}</span></li>`).join("")}</ul>` : ""}
    ${tone ? `<p class="sem-lead">${esc(tone)}</p>` : ""}`;
}

const VIEW = {courses: vCourses, work: vWork, review: vReview, times: vTimes, prep: vPrep, week: vWeek};

/* Events */
dlg.addEventListener("click", e => {
  const b = e.target.closest("[data-sem]"); if (!b || !b.closest(".sem-sheet")) return;
  e.preventDefault(); e.stopPropagation();
  const a = b.dataset.sem, id = b.dataset.id, i = stepIdx();
  if (a === "solo-done") { R.solo = false; R.since = null; dlg.close(); return; }
  if (!R.solo && IDS[i] === "courses" && (a === "goto" || a === "next")) addCourse(true);
  switch (a) {
    case "goto": go(id); break;
    case "back": if (i > 0) go(IDS[i - 1]); break;
    case "next": mark("done"); go(IDS[i + 1]); break;
    case "skip": mark("skip"); go(IDS[i + 1]); break;
    case "finish": finish(id); break;
    case "course-add": addCourse(); break;
    case "pdf": { const f = $("#semPdf"); if (f) f.click(); break; }
    case "paste": leave(() => importSheet("")); break;
    case "lms": leave(() => fire("lms-connect")); break;
    case "ics": { const f = $("#semIcs"); if (f) f.click(); break; }
    case "type-add": typeAdd(); break;
    case "q-next": nextSyllabus(); break;
    case "q-clear": R.queue = []; R.qTotal = 0; paint(true, false, tr("sem.q.cleared", "Cleared the waiting list.")); break;
    case "scope": { R.scope = id === "all" ? "all" : "new"; R.showAll = false; paint(true, false); const x = dlg.querySelector(`[data-sem="scope"][data-id="${R.scope}"]`); if (x) x.focus({preventScroll: true}); break; }
    case "show-all": R.showAll = true; paint(true, false); break;
    case "rm": removeRow(id); break;
    case "undo-rm": undoRemove(); break;
    case "est-all": useTimes(); break;
    case "est-open": leave(() => SBEST.open(true)); break;
    case "prep": leave(() => SBPREP.open(id)); break;
    case "bd": leave(() => SBBREAK.open(id)); break;
    case "bd-all": bdAll(); break;
  }
});
dlg.addEventListener("change", e => {
  const t = e.target; if (!t.closest || !t.closest(".sem-sheet")) return;
  if (t.id === "semPdf") { const fs = [...(t.files || [])]; t.value = ""; if (fs.length) queueFiles(fs); }
  else if (t.id === "semIcs") {
    const f = t.files && t.files[0]; t.value = ""; if (!f) return;
    const say = s => { R.msg = s; const m = $("#semMsg"); if (m) m.textContent = s; announce(s); };
    if (f.size > 8e6) { say(tr("sem.ics.big", "That calendar file is too big (over 8 MB).")); return; }
    f.text().then(txt => leave(() => icsImportSheet(txt, f.name))).catch(() => say(tr("sem.ics.bad", "Could not read that file.")));
  }
  else if (t.dataset && t.dataset.sf) editRow(t);
});
dlg.addEventListener("keydown", e => {
  const t = e.target; if (!t.closest || !t.closest(".sem-sheet")) return;
  if (e.key === "Enter" && (t.id === "semCode" || t.id === "semName")) { e.preventDefault(); addCourse(); }
  else if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && t.id === "semType") { e.preventDefault(); typeAdd(); }
  else if (e.key === "Enter" && t.dataset && t.dataset.sf === "title") { e.preventDefault(); t.blur(); }
});
["dragover", "dragenter"].forEach(ev => dlg.addEventListener(ev, e => { const d = e.target.closest && e.target.closest("#semDrop"); if (d) { e.preventDefault(); d.classList.add("over"); } }));
["dragleave", "drop"].forEach(ev => dlg.addEventListener(ev, e => {
  const d = e.target.closest && e.target.closest("#semDrop"); if (!d) return;
  e.preventDefault(); d.classList.remove("over");
  if (ev === "drop" && e.dataTransfer && e.dataTransfer.files.length) queueFiles(e.dataTransfer.files);
}));
hook("changed", () => { if (!dlg.open) return; const t = $("#semTally"); if (t) t.textContent = tallyText(); });

/* Entry points */
// Not right after the welcome setup (finished or skipped), and not once this setup was finished
const obRecent = () => { try { return Date.now() - (Number(localStorage.getItem("sb:onboarded:at")) || 0) < 3 * 864e5; } catch (e) { return false; } };
const cardDue = () => isEmpty() && !M.hide && !M.fin && !obRecent() && !(window.SBOB && SBOB.pending());
hook("render", tab => {
  // Not while the first sign-in or the welcome setup is still to come
  if (tab !== "board" || !cardDue()) return;
  const v = $("#view"); if (!v || v.querySelector(".sem-card-b")) return;
  const going = M.since && !M.fin && M.step && M.step !== "courses";
  v.insertAdjacentHTML("afterbegin", `<section class="sem-card-b" aria-labelledby="semCardT"><div class="sem-cb-t"><b id="semCardT">${esc(tr("sem.card.h", "Set Up Your Semester"))}</b><span>${esc(going ? tr("sem.card.resume", "Pick up where you left off. It takes a couple of minutes.") : tr("sem.card.s", "Bring in your syllabi, school site or calendar and see your first week planned in about two minutes."))}</span></div>
    <div class="sem-cb-b"><button type="button" class="btn primary" data-act="sem-open">${esc(going ? tr("sem.card.go2", "Continue") : tr("sem.card.go", "Start"))}</button><button type="button" class="link-btn" data-act="sem-hide">${esc(tr("sem.card.no", "Not now"))}</button></div></section>`);
});
hook("act", a => {
  if (a === "sem-open") { if (dlg.open) dlg.close(); setTimeout(() => open({from: "ui"}), 30); return true; }
  if (a === "sem-hide") { save({hide: true}); render(); toast(tr("sem.card.hidden", "Okay. You can find Set Up Your Semester in Settings any time.")); return true; }
  return false;
});
hook("menu", () => {
  const going = M.since && !M.fin && IDS.includes(M.step) && Date.now() - Number(M.since) < 45 * 864e5;
  return `<button data-act="sem-open"><span>${esc(tr("sem.menu", "Set Up Your Semester"))}<span class="sub">${esc(going ? tr("sem.menu.resume", "Pick up where you left off") : tr("sem.menu.s", "Syllabi, school site or calendar, then reviewed dates, times and your first week"))}</span></span></button>`;
});

window.SBSEM = {
  open,
  cardDue,
  found: () => found().map(t => t.id),
  state: () => Object.assign({}, M),
  // For the welcome setup's courses step: the review list on its own, for what was added since a time
  review(since){
    if (window.SBTOUR && SBTOUR.active()) return false;
    R.scope = "new"; R.msg = ""; R.removed = []; R.showAll = false; R.away = false; R.since = Number(since) || 0; R.solo = true;
    openSheet(shell()); paint(false, true, tr("sem.solo.live", "Check what we found. Changes save as you go."));
    return true;
  },
  // Suggested times for what was added since a time (the welcome setup's Finish)
  suggestTimes(since){
    const L = tasksArr().filter(t => mine(t) && (Number(t.created) || 0) >= (Number(since) || 0) && SBEST.needs(t));
    if (L.length) applyChanges(L.map(t => { const n = clone(t); n.hours = suggestH(t); return {kind: "task", id: t.id, after: n}; }), "");
    return L.length;
  },
  // Due in the next 7 days, for the welcome setup's last page
  soon(){ const t0 = todayISO(), lim = addDays(t0, 7); return tasksArr().filter(t => mine(t) && t.status !== "done" && t.due && t.due >= t0 && t.due <= lim).sort(sortTasks); },
  // The study companion mentions it once, only to someone with an empty planner
  offer(){
    if (M.offered || M.fin || M.hide || !isEmpty() || dlg.open || obRecent()) return null;
    return {text: tr("sem.comp", "Want a head start? I can help you bring in your syllabi and plan your first week."), action: "semester", yes: tr("sem.comp.yes", "Set Up"), local: true};
  },
  offered(){ save({offered: Date.now()}); },
  ideaValid: () => isEmpty() && !M.fin,
  runIdea(){ save({offered: Date.now()}); open({from: "companion"}); }
};
})();

