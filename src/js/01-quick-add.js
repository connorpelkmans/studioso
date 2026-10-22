/* ===== module: 01-quick-add.js: the app's core, quick add: type a sentence ===== */
/* ---------- Quick add: type a sentence ---------- */
const QA_MONTHS = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];
const QA_DAYS = [["sun","sunday"],["mon","monday"],["tue","tues","tuesday"],["wed","weds","wednesday"],["thu","thur","thurs","thursday"],["fri","friday"],["sat","saturday"]];
function qaCourse(text){
  const words = (text.toLowerCase().match(/[a-z]+|\d+/g) || []);
  const flat = text.toLowerCase().replace(/[^a-z0-9]/g, "");
  let best = null, score = 0, used = [];
  coursesArr().forEach(c => {
    const code = (c.code || "").toLowerCase().replace(/[^a-z0-9]/g, ""), letters = code.replace(/\d+/g, ""), num = (code.match(/\d+/) || [""])[0];
    const nameW = (c.name || "").toLowerCase().split(/[^a-z]+/).filter(w => w.length > 3 && !["intro", "introduction", "principles", "fundamentals", "with", "and"].includes(w));
    let s = 0, u = [];
    if (code && code.length >= 4 && flat.includes(code)) { s = 4; u = [letters, num]; }
    words.forEach(w => {
      if (letters && w === letters && s < 3) { s = 3; u = [w]; if (num && words.includes(num)) u.push(num); }
      else if (w.length >= 3 && letters && letters.startsWith(w) && s < 2.5) { s = 2.5; u = [w]; }
      else if (w.length >= 4 && nameW.some(n => n.startsWith(w) || w.startsWith(n)) && s < 2) { s = 2; u = [w]; }
    });
    if (s > score) { score = s; best = c; used = u; }
  });
  return score >= 2 ? {course: best, used} : null;
}
function qaLocal(text){
  const today = todayISO(), t = {title: "", type: "Assignment", due: "", time: "", hours: null, weight: null, priority: "med", courseId: ""};
  let s = " " + text.replace(/\s+/g, " ") + " ";
  const take = (re, fn) => { const m = s.match(re); if (m) { fn(m); s = s.replace(m[0], " "); return true; } return false; };
  take(/\b(?:worth\s*)?(\d{1,2}(?:\.\d+)?)\s*%(?:\s*of\s*(?:the\s*|my\s*)?(?:final\s*)?grade)?/i, m => { t.weight = Number(m[1]); });
  take(/\b(?:takes?\s*|about\s*|~\s*)?(\d{1,2}(?:\.\d+)?)\s*(?:h|hr|hrs|hours?)\b/i, m => { t.hours = Number(m[1]); }) ||
    take(/\b(?:takes?\s*|about\s*)?(\d{2,3})\s*(?:m|min|mins|minutes)\b/i, m => { t.hours = Math.round(Number(m[1]) / 60 * 4) / 4; });
  take(/\b(urgent|asap)\b/i, () => { t.priority = "urgent"; }) || take(/\b(important|high priority)\b/i, () => { t.priority = "high"; });
  take(/\b(?:at\s*|@\s*)?(\d{1,2})(?::([0-5]\d))?\s*(am|pm|a\.m\.|p\.m\.)/i, m => { let h = Number(m[1]) % 12; if (/p/i.test(m[3])) h += 12; t.time = pad(h) + ":" + (m[2] || "00"); }) ||
    take(/\b(?:at\s*)?([01]?\d|2[0-3]):([0-5]\d)\b/, m => { t.time = pad(Number(m[1])) + ":" + m[2]; }) ||
    take(/\b(?:at\s*)?noon\b/i, () => { t.time = "12:00"; }) || take(/\b(?:at\s*)?(midnight|end of (?:the )?day|eod)\b/i, () => { t.time = "23:59"; });
  const wd = QA_DAYS.map(a => a.join("|")).join("|");
  take(/\b(today|tonight)\b/i, m => { t.due = today; if (/tonight/i.test(m[1]) && !t.time) t.time = "23:59"; }) ||
  take(/\b(tomorrow|tmrw|tmr|tmw)\b/i, () => { t.due = addDays(today, 1); }) ||
  take(/\bin\s+(\d+|a|one|two|three)\s+(days?|weeks?)\b/i, m => { const n = ({a: 1, one: 1, two: 2, three: 3})[m[1].toLowerCase()] || Number(m[1]); t.due = addDays(today, /week/i.test(m[2]) ? n * 7 : n); }) ||
  take(new RegExp(`\\b(next\\s+|this\\s+)?(${wd})\\b\\.?`, "i"), m => {
    const k = QA_DAYS.findIndex(a => a.includes(m[2].toLowerCase())), cur = parse(today).getDay();
    let n = (k - cur + 7) % 7; if (/next/i.test(m[1] || "")) n += 7;
    t.due = addDays(today, n);
  }) ||
  take(/\b(jan|feb|mar|apr|may|jun|jul|aug|sept?|oct|nov|dec)[a-z]*\.?\s+(\d{1,2})(?:st|nd|rd|th)?\b/i, m => { t.due = qaYear(QA_MONTHS.indexOf(m[1].slice(0, 3).toLowerCase()), Number(m[2]), today); }) ||
  take(/\b(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+)?(jan|feb|mar|apr|may|jun|jul|aug|sept?|oct|nov|dec)[a-z]*\b/i, m => { t.due = qaYear(QA_MONTHS.indexOf(m[2].slice(0, 3).toLowerCase()), Number(m[1]), today); }) ||
  take(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/, m => { t.due = m[3] ? `${m[3].length === 2 ? "20" + m[3] : m[3]}-${pad(Number(m[1]))}-${pad(Number(m[2]))}` : qaYear(Number(m[1]) - 1, Number(m[2]), today); });
  if (t.due && !isDate(t.due)) t.due = "";
  const types = [[/\b(midterm|final exam|finals?|exam|test)\b/i, "Exam"], [/\bquiz(?:zes)?\b/i, "Quiz"], [/\blab\b/i, "Lab"], [/\bproject\b/i, "Project"], [/\b(read|reading|chapter|ch\.?\s*\d)/i, "Reading"], [/\b(study|review)\b/i, "Study"]];
  const hit = types.find(([re]) => re.test(s)); if (hit) t.type = hit[1];
  const cm = qaCourse(s);
  if (cm) { t.courseId = cm.course.id; cm.used.forEach(w => { if (w) s = s.replace(new RegExp(`\\b${w}\\b`, "i"), " "); }); }
  let title = s.replace(/\b(due|by|on|at|for|is|it's|its|the)\s*(?=[,.;\s]*$)/gi, " ").replace(/^\s*(add|new|a|an)\b/i, " ").replace(/\s+(due|by|on)\s*$/i, " ").replace(/\s{2,}/g, " ").replace(/^[\s,.;:-]+|[\s,.;:-]+$/g, "").trim();
  title = title.replace(/\bhw\b/i, "Homework").replace(/\bpset\b/i, "Problem Set").replace(/\bdue\b\s*$/i, "").trim();
  t.title = title ? title.charAt(0).toUpperCase() + title.slice(1) : t.type;
  return t;
}
function qaYear(mo, day, today){
  if (mo < 0 || !day) return "";
  const y = parse(today).getFullYear();
  let d = `${y}-${pad(mo + 1)}-${pad(day)}`;
  if (dayDiff(today, d) < -45) d = `${y + 1}-${pad(mo + 1)}-${pad(day)}`;
  return d;
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
  // Quick capture: a clear sentence with a date is added right away (Undo in the toast)
  if (window.SBCAPTURE && SBCAPTURE.fast(text)) { ui.qa = null; ui.qaText = ""; render(); setTimeout(() => { const i = $("#qaIn"); if (i) i.focus(); }, 30); return; }
  ui.qa = {busy: true, text, items: []}; render();
  let items = null, by = "local", err = "";
  // Dates, times, durations, courses and types are read on this device first (instant, free, always the same). The AI only steps in
  // when the sentence is ambiguous: several tasks in one line, or words that look like a date this reader didn't understand.
  const loc = qaLocal(text), sure = qaConfident(text, loc);
  if (sure) items = [loc];
  if (!sure && aiReady()) {
    try {
      const today = todayISO(), d = parse(today);
      const courses = coursesArr().map(c => `${c.code || c.name}${c.code ? ` (${c.name})` : ""}`).join("; ") || "none";
      const r = await aiCall({task: "quickadd", fast: true, maxTokens: 3000, temperature: 0.1, schema: QA_SCHEMA, parts: [{text: `Today is ${d.toLocaleDateString("en-US", {weekday: "long"})} ${today}. Courses: ${courses}.\nStudent wrote: "${text}"`}],
        system: `You turn a student's quick note into planner tasks. Resolve relative dates from today: a weekday name means the next one on or after today, "next Friday" means the Friday of next week, "end of the month" means its last day. Leave due empty if no date is given. Match the course to one of the listed codes when the note clearly refers to it (abbreviations like "bio", "chem", "calc" count). Titles are short and specific, like "Homework 3" or "Quiz 2: Cell Membranes", without the course name or date. Make one task per separate deliverable. hours: a realistic estimate of focused work for a typical college student (0 for exams and quizzes). Only set weight if a percentage is stated. Return JSON only.`});
      const byCode = {}; coursesArr().forEach(c => { byCode[(c.code || c.name).toLowerCase()] = c.id; byCode[c.name.toLowerCase()] = c.id; });
      items = (r.data.tasks || []).map(x => ({title: String(x.title || "").trim(), type: TYPES.includes(x.type) ? x.type : "Assignment", due: isDate(x.due) ? x.due : "", time: /^\d\d:\d\d$/.test(x.time || "") ? x.time : "", start: isDate(x.start) ? x.start : "",
        hours: Number(x.hours) > 0 && !MILESTONE(x.type) ? Math.round(Number(x.hours) * 4) / 4 : null, weight: Number(x.weight) > 0 ? Number(x.weight) : null, priority: PRIO[x.priority] ? x.priority : "med", difficulty: DIFF_M[x.difficulty] ? x.difficulty : "med",
        courseId: byCode[String(x.course || "").toLowerCase()] || "", location: String(x.location || ""), reading: String(x.reading || ""), notes: String(x.notes || "")})).filter(x => x.title);
      // Don't trust a date, time or hours figure the AI made up when the sentence states one plainly
      items.forEach(x => { if (x.due && (dayDiff(today, x.due) < -45 || dayDiff(today, x.due) > 800)) x.due = ""; if (x.hours && x.hours > 40) x.hours = null; });
      if (items.length === 1) { const x = items[0]; if (loc.due) x.due = loc.due; if (loc.time) x.time = loc.time; if (loc.hours && !MILESTONE(x.type)) x.hours = loc.hours; if (loc.weight) x.weight = loc.weight; if (!x.courseId && loc.courseId) x.courseId = loc.courseId; }
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
      <button type="button" class="x-btn" data-act="qa-rm" data-i="${i}" aria-label="Remove">${CLOSE}</button></li>`;
  return `<form class="qa-bar" id="qaForm" autocomplete="off">
      <span class="qa-ic" aria-hidden="true">${aiReady() ? AI_ICON : "+"}</span>
      <input type="text" id="qaIn" value="${esc(ui.qaText || "")}" ${(ex => phPh("Add a task by typing, e.g. " + (ex || "bio quiz fri 2pm worth 5%"), "e.g. " + (ex ? ex.split(" ").slice(0, 2).join(" ") : "bio quiz fri")))(window.SBAREA && SBAREA.example())} aria-label="Add a task by typing a sentence" maxlength="400" data-noenter>
      <button type="button" class="btn small cap-cam" data-act="cap-photo" aria-label="Add tasks from a photo of a whiteboard or slide" title="Photo of a whiteboard or slide"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8.5A1.5 1.5 0 0 1 5.5 7H8l1.2-2h5.6L16 7h2.5A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5z"/><circle cx="12" cy="13" r="3.4"/></svg></button>
      <button type="submit" class="btn small primary" ${q && q.busy ? "disabled" : ""}>${q && q.busy ? `<span class="ai-spin" aria-hidden="true"></span>Reading` : "Add"}</button>
    </form>
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
  // "work Tue Thu 4-9pm" or "shift 7a-7:30p Mon Wed Fri" opens the availability form filled in; anything else is a task
  try { const aq = AVAIL.parseQuick(v); if (aq) { ui.qaText = ""; $("#qaIn").value = ""; availForm(null, aq); return; } } catch(err) {}
  ui.qaText = v; qaRun(v);
});
document.addEventListener("input", e => { if (e.target.id === "qaIn") ui.qaText = e.target.value; const i = e.target.dataset && e.target.dataset.qa; if (i && ui.qa && e.target.type === "text") ui.qa.items[Number(e.target.dataset.i)][i] = e.target.value; });
document.addEventListener("change", e => { const k = e.target.dataset && e.target.dataset.qa; if (!k || !ui.qa) return; const it = ui.qa.items[Number(e.target.dataset.i)]; if (!it) return; it[k] = e.target.value; if (k === "courseId" || k === "type") render(); });
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
  const ex1 = changes.length === 1 && MILESTONE(changes[0].after.type) && changes[0].after.due > todayISO() ? changes[0].after : null;
  if (changes.length) applyChanges(changes, changes.length === 1 ? `Added ${changes[0].after.title}` : `Added ${changes.length} tasks`, ex1 && window.SBPREP ? {label: "Plan My Prep", fn: () => SBPREP.open(ex1.id)} : undefined); else render();
  const ask = changes.map(c => c.after).find(t => MILESTONE(t.type) && t.due && t.due >= todayISO() && state.tasks[t.id] && !remoteOf(state.tasks[t.id]).v);   // where is it taken? (the first one; the Suggestions tray asks about any others)
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

