/* ===== module: 01-quick-add.js: the app's core, quick add: type a sentence ===== */
/* Quick add: type a sentence */
// Reads a sentence with the same rules as Quick Capture (75-capture.js)
function qaCourse(text){
  const m = SBCAPTURE.core.matchCourse(text, coursesArr());
  return m && m.course ? {course: m.course, used: m.used} : null;
}
function qaLocal(text){
  const d = SBCAPTURE.line(text);
  return {title: d.title || d.type, type: d.type, due: d.due, time: d.time, hours: d.hours, weight: d.weight, priority: d.priority, courseId: d.courseId};
}
const QA_SCHEMA = {type: "OBJECT", properties: {tasks: {type: "ARRAY", items: {type: "OBJECT", properties: {
  title: {type: "STRING"}, course: {type: "STRING", description: "Exactly one of the listed course codes, or empty"},
  type: {type: "STRING", enum: ["Assignment", "Exam", "Quiz", "Reading", "Project", "Lab", "Study", "Other"]},
  due: {type: "STRING", description: "YYYY-MM-DD or empty"}, time: {type: "STRING", description: "24-hour HH:MM or empty"}, start: {type: "STRING", description: "YYYY-MM-DD or empty"},
  hours: {type: "NUMBER", description: "Realistic hours of work for this task (0 for exams and quizzes)"},
  weight: {type: "NUMBER", description: "Percent of the course grade if stated, else 0"},
  priority: {type: "STRING", enum: ["low", "med", "high", "urgent"]}, difficulty: {type: "STRING", enum: ["easy", "med", "hard"]},
  location: {type: "STRING"}, reading: {type: "STRING"}, notes: {type: "STRING"}}, required: ["title", "type", "due"]}}}, required: ["tasks"]};
async function qaRun(text){
  // Phones always show the check first: a mistyped date is easy to miss on a small screen
  const phoneQa = !!(window.matchMedia && matchMedia("(max-width:639px)").matches);
  if (!phoneQa && window.SBCAPTURE && SBCAPTURE.fast(text)) { ui.qa = null; ui.qaText = ""; render(); setTimeout(() => { const i = $("#qaIn"); if (i) i.focus(); }, 30); return; }
  ui.qa = {busy: true, text, items: []}; render();
  let items = null, by = "local", err = "";
  const loc = qaLocal(text), sure = qaConfident(text, loc);
  if (sure) items = [loc];
  if (!sure && aiReady()) {
    try {
      const today = todayISO(), d = parse(today);
      const courses = coursesArr().map(c => `${c.code || c.name}${c.code ? ` (${c.name})` : ""}`).join("; ") || "none";
      const r = await aiCall({task: "quickadd", fast: true, maxTokens: 3000, temperature: 0.1, schema: QA_SCHEMA, parts: [{text: `Today is ${d.toLocaleDateString("en-US", {weekday: "long"})} ${today}. Courses: ${courses}.\nStudent wrote: "${text}"`}],
        system: `You turn a student's quick note into planner tasks. Resolve relative dates from today: ${SBCAPTURE.core.WEEKDAY_RULE}; "end of the month" means its last day. Leave due empty if no date is given. Match the course to one of the listed codes when the note clearly refers to it (abbreviations like "bio", "chem", "calc" count). Titles are short and specific, like "Homework 3" or "Quiz 2: Cell Membranes", without the course name or date. Make one task per separate deliverable. hours: a realistic estimate of focused work for a typical college student (0 for exams and quizzes). Studying or reviewing for an exam or quiz is a Study task with hours, not an Exam or Quiz. Only set weight if a percentage is stated. Return JSON only.`});
      const byCode = {}; coursesArr().forEach(c => { byCode[(c.code || c.name).toLowerCase()] = c.id; byCode[c.name.toLowerCase()] = c.id; });
      items = (r.data.tasks || []).map(x => ({title: String(x.title || "").trim(), type: TYPES.includes(x.type) ? x.type : "Assignment", due: isDate(x.due) ? x.due : "", time: /^\d\d:\d\d$/.test(x.time || "") ? x.time : "", start: isDate(x.start) ? x.start : "",
        hours: Number(x.hours) > 0 && !MILESTONE(x.type) ? Math.round(Number(x.hours) * 4) / 4 : null, weight: Number(x.weight) > 0 ? Number(x.weight) : null, priority: PRIO[x.priority] ? x.priority : "med", difficulty: DIFF_M[x.difficulty] ? x.difficulty : "med",
        courseId: byCode[String(x.course || "").toLowerCase()] || "", location: String(x.location || ""), reading: String(x.reading || ""), notes: String(x.notes || "")})).filter(x => x.title);
      items.forEach(x => { if (x.due && (dayDiff(today, x.due) < -45 || dayDiff(today, x.due) > 800)) x.due = ""; if (x.hours && x.hours > 40) x.hours = null; });
      if (items.length === 1) { const x = items[0]; if (loc.type === "Study" && MILESTONE(x.type)) x.type = "Study"; if (loc.due) x.due = loc.due; if (loc.time) x.time = loc.time; if (loc.hours && !MILESTONE(x.type)) x.hours = loc.hours; if (loc.weight) x.weight = loc.weight; if (!x.courseId && loc.courseId) x.courseId = loc.courseId; }
      by = "ai";
    } catch(e) { err = e.code ? e.message : ""; console.warn(e); }
  }
  if (!items || !items.length) { items = [loc]; by = "local"; }
  items.forEach(x => { if (!isNum(x.hours) && !MILESTONE(x.type)) { const est = localEstimate(x); x.hours = est.hours; x.est = true; } });
  if (!ui.qa || ui.qa.text !== text) return;
  ui.qa = {text, items, by, err, sure}; render();
  setTimeout(() => { const b = $("#qaAddBtn"); if (b) b.focus(); }, 30);
}
function qaBarHtml(){
  const q = ui.qa;
  const row = (x, i) => `<li class="qa-item" style="--c:${esc(colorOf(x.courseId))}">
      <input type="text" data-qa="title" data-i="${i}" value="${esc(x.title)}" aria-label="Title" maxlength="200">
      <select data-qa="courseId" data-i="${i}" aria-label="Course"><option value="">No course</option>${coursesArr().map(c => `<option value="${esc(c.id)}" ${c.id === x.courseId ? "selected" : ""}>${esc(courseLabel(c))}</option>`).join("")}</select>
      <select data-qa="type" data-i="${i}" aria-label="Type">${TYPES.map(y => `<option ${y === x.type ? "selected" : ""}>${y}</option>`).join("")}</select>
      <input type="date" data-qa="due" data-i="${i}" value="${esc(x.due)}" aria-label="Due date">
      <input type="time" data-qa="time" data-i="${i}" value="${esc(x.time)}" aria-label="Due time">
      <span class="qa-meta">${!MILESTONE(x.type) && isNum(x.hours) ? `<span title="${x.est ? "Estimated" : "Hours"}">~${fmtHM(Number(x.hours))}</span>` : ""}${x.weight ? `<span>${x.weight}%</span>` : ""}${x.priority !== "med" ? `<span>${PRIO[x.priority]}</span>` : ""}</span>
      <button type="button" class="x-btn" data-act="qa-rm" data-i="${i}" aria-label="Remove">${CLOSE}</button>
      <span class="qa-past mini" ${qaPast(x.due) ? "" : "hidden"}>This date is in the past. Pick a new one, or add it anyway.</span></li>`;
  return `<form class="qa-bar" id="qaForm" autocomplete="off">
      <span class="qa-ic" aria-hidden="true">${aiReady() ? AI_ICON : "+"}</span>
      <input type="text" id="qaIn" value="${esc(ui.qaText || "")}" ${(ex => phPh("Add a task by typing, e.g. " + (ex || "bio quiz fri 2pm worth 5%"), "e.g. " + (ex ? ex.split(" ").slice(0, 2).join(" ") : "bio quiz fri")))(window.SBAREA && SBAREA.example())} aria-label="Add a task by typing a sentence" maxlength="400" data-noenter>
      <button type="button" class="btn small cap-cam" data-act="cap-photo" aria-label="Add tasks from a photo of a whiteboard or slide" title="Photo of a whiteboard or slide"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8.5A1.5 1.5 0 0 1 5.5 7H8l1.2-2h5.6L16 7h2.5A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5z"/><circle cx="12" cy="13" r="3.4"/></svg></button>
      <button type="submit" class="btn small primary" ${q && q.busy ? "disabled" : ""}>${q && q.busy ? `<span class="ai-spin" aria-hidden="true"></span>Reading` : "Add"}</button>
    </form>
    <p class="qa-live mini" id="qaLive" aria-live="polite">${q ? "" : esc(qaLiveText(ui.qaText))}</p>
    ${q && !q.busy && q.items.length ? `<div class="qa-preview" role="region" aria-label="Check the new task">
      <p class="mini">${q.by === "ai" ? `${AI_ICON} ${aiWho() ? esc(aiWho()) + " filled this in. " : ""}Check the details, then add.` : `Check the details, then add.${q.err ? " (" + esc(q.err) + " Read on this device instead.)" : aiReady() || q.sure ? "" : " Turn on AI Features for smarter reading."}`}</p>
      <ul class="qa-list">${q.items.map(row).join("")}</ul>
      ${q.items.some(x => !x.due) ? `<p class="mini" style="margin:6px 0 0">${q.items.filter(x => !x.due).length === 1 ? "One task has" : "Some tasks have"} no due date. Pick one above, or add it as it is.</p>` : ""}
      <div class="row-actions"><button class="btn primary small" data-act="qa-add" id="qaAddBtn">Add ${q.items.length === 1 ? "Task" : q.items.length + " Tasks"}</button>${q.items.length === 1 ? `<button class="btn small" data-act="qa-full">More Details</button>` : ""}<button class="btn small" data-act="qa-cancel">Cancel</button></div>
    </div>` : ""}`;
}
document.addEventListener("submit", e => {
  if (e.target.id !== "qaForm") return;
  e.preventDefault(); const v = $("#qaIn").value.trim(); if (!v) { $("#qaIn").focus(); return; }
  try { const aq = AVAIL.parseQuick(v); if (aq) { ui.qaText = ""; $("#qaIn").value = ""; availForm(null, aq); return; } } catch(err) {}
  ui.qaText = v; qaRun(v);
});
const qaPast = d => !!d && isDate(d) && d < todayISO();
// The line under the add bar that says what Add will do
function qaLiveText(v){
  v = String(v || "").trim(); if (v.length < 3 || !window.SBCAPTURE) return "";
  try { const aq = AVAIL.parseQuick(v); if (aq) return `Will add to your Availability: ${aq.title}`; } catch(err) {}
  const line = SBCAPTURE.preview(v); if (!line) return "";
  return line + (qaPast(SBCAPTURE.line(v).due) ? ". This date is in the past." : "");
}
document.addEventListener("input", e => { if (e.target.id === "qaIn") { ui.qaText = e.target.value; const l = $("#qaLive"); if (l && !ui.qa) l.textContent = qaLiveText(ui.qaText); } const i = e.target.dataset && e.target.dataset.qa; if (i && ui.qa && e.target.type === "text") ui.qa.items[Number(e.target.dataset.i)][i] = e.target.value; });
document.addEventListener("change", e => { const k = e.target.dataset && e.target.dataset.qa; if (!k || !ui.qa) return; const it = ui.qa.items[Number(e.target.dataset.i)]; if (!it) return; it[k] = e.target.value; if (k === "courseId" || k === "type") render();
  else if (k === "due") { const w = e.target.closest(".qa-item"), h = w && w.querySelector(".qa-past"); if (h) h.hidden = !qaPast(it.due); } });
document.addEventListener("keydown", e => {
  if (e.key !== "Escape" || e.defaultPrevented || !ui.qa || ui.qa.busy || document.querySelector("dialog[open]")) return;
  const t = e.target; if (t !== document.body && !(t.closest && t.closest(".qa-wrap"))) return;
  e.preventDefault(); ui.qa = null; render(); setTimeout(() => { const i = $("#qaIn"); if (i) i.focus(); }, 30);
});
function qaAdd(){
  const q = ui.qa; if (!q) return;
  const changes = q.items.filter(x => x.title.trim()).map(x => {
    const due = isDate(x.due) ? x.due : "";
    let start = isDate(x.start) ? x.start : due ? addDays(due, -(SPAN[x.type] ?? 3)) : todayISO();
    if (start < todayISO()) start = todayISO(); if (due && start > due) start = due;
    const t = newTask({title: x.title.trim(), type: x.type, courseId: x.courseId || "", due, time: x.time || "", start, hours: MILESTONE(x.type) ? null : (isNum(x.hours) ? Number(x.hours) : null),
      weight: x.weight || null, priority: x.priority || (x.type === "Exam" ? "high" : "med"), difficulty: x.difficulty || "med", location: x.location || "", reading: x.reading || "", notes: x.notes || ""});
    return {kind: "task", id: t.id, after: t};
  });
  ui.qa = null; ui.qaText = "";
  const one = changes.length === 1 ? changes[0].after : null, ex1 = one && MILESTONE(one.type) && one.due > todayISO() ? one : null;
  if (changes.length) applyChanges(changes, one ? `Added ${one.title}` : `Added ${changes.length} tasks`, one ? [ex1 && window.SBPREP ? {label: "Plan My Prep", fn: () => SBPREP.open(ex1.id)} : null, {label: "Edit", fn: () => { if (state.tasks[one.id]) taskForm(state.tasks[one.id]); }}] : undefined); else render();
  const ask = changes.map(c => c.after).find(t => MILESTONE(t.type) && t.due && t.due >= todayISO() && state.tasks[t.id] && !remoteOf(state.tasks[t.id]).v);
  if (ask) { remoteAsk(ask.id); return; }
  setTimeout(() => { const i = $("#qaIn"); if (i) i.focus(); }, 30);
}
function qaFull(){
  const x = ui.qa && ui.qa.items[0]; if (!x) return;
  ui.qa = null; ui.qaText = ""; render();
  taskForm(null, {courseId: x.courseId, due: x.due});
  const set = (n, v) => { const el = dlg.querySelector(`[name="${n}"]`); if (el && v != null && v !== "") el.value = v; };
  const ty = $("#tfType"); if (ty) { ty.value = x.type; ty.dispatchEvent(new Event("change", {bubbles: true})); }
  set("title", x.title); set("time", x.time); set("hours", MILESTONE(x.type) ? "" : x.hours); set("weight", x.weight); set("location", x.location); set("reading", x.reading); set("notes", x.notes);
  const pr = dlg.querySelector(`input[name=priority][value="${x.priority}"]`); if (pr) pr.checked = true;
}

