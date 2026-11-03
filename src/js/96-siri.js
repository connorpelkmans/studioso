/* ===== module: 96-siri.js ===== */
/* SIRI-START
   Ask Siri about your work (iPhone and iPad app only). Siri runs Studyboard's App Intents (ios-wrapper/native/StudyboardAskIntents.swift)
   without opening the app, so they can't run this page. Instead this module keeps a small copy of what Siri may answer about on the device:
   tasks with their due dates and marks, courses with their current grade and class times, and the class meetings of the next two weeks
   (worked out here, so rotating Day 1-6 / A-B schedules, days off and moved classes come out exactly as the Schedule shows them). It is
   written through StudyboardNative.siriData.save() into the app's own container, never to a server, and is deleted on sign-out.
   Grades are left out when the person turns "Siri can tell me my grades" off (per device). The native side reads it, answers, and indexes
   assignments and courses so Siri and Spotlight can find them by name. Shape: SIRI_V below; the Swift Codable types in SBSiriData.swift
   must match it (tests/siri.test.js checks both). */
const SIRI_V = 1, SIRI_MAX_TASKS = 600, SIRI_DAYS = 14;
const siriStr = (s, n) => { const t = String(s == null ? "" : s).replace(/[\u0000-\u001f\u007f<>]/g, " ").replace(/\s+/g, " ").trim(); return t.length > n ? t.slice(0, n - 1) + "…" : t; };
const siriDate = s => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : "";
const siriTime = s => typeof s === "string" && /^\d{2}:\d{2}$/.test(s) ? s : "";
const siriNum = v => typeof v === "number" && isFinite(v) ? Math.round(v * 10) / 10 : null;
/* in: {now, today, grades, tasks:[task], courses:[course], courseLabel(c), gradeItems:[{id, pct, mark, letter}], courseGrade(c) -> {pct, letter, marked} | null,
        timesText(c) -> "Mon, Wed · 10–10:50 AM", classes:[{courseId, kind, date, start, end, where}]} */
function siriSnapshot(i){
  const grades = !!i.grades, today = i.today, marks = new Map();
  if (grades) (i.gradeItems || []).forEach(g => { if (g && g.id && siriNum(g.pct) != null) marks.set(g.id, {pct: siriNum(g.pct), text: siriStr(g.mark, 24), letter: siriStr(g.letter, 4)}); });
  const courses = (i.courses || []).filter(c => c && c.id && !c.archived).map(c => {
    const o = {id: String(c.id), name: siriStr(c.name || c.code, 80) || "Course", code: siriStr(c.code, 24), room: siriStr(c.room, 60), times: ""};
    try { o.times = siriStr(i.timesText ? i.timesText(c) : "", 120); } catch (e) { o.times = ""; }
    if (grades) { let g = null; try { g = i.courseGrade ? i.courseGrade(c) : null; } catch (e) { g = null; } if (g && siriNum(g.pct) != null) o.grade = {pct: siriNum(g.pct), letter: siriStr(g.letter, 4), marked: siriNum(g.marked)}; }
    return o;
  });
  const known = new Set(courses.map(c => c.id));
  // What Siri is asked about: real work (not Exam Prep sessions or the steps of a broken-down task), open work first, then recent and marked work
  const real = (i.tasks || []).filter(t => t && t.id && !t.prepFor && !t.breakdownOf && siriStr(t.title, 2));
  const open = real.filter(t => t.status !== "done" && !t.archivedTerm), done = real.filter(t => !open.includes(t));
  const byDue = (a, b) => ((a.due || "9999") + (a.time || "")).localeCompare((b.due || "9999") + (b.time || ""));
  const recent = (a, b) => (Number(b.doneAt) || 0) - (Number(a.doneAt) || 0) || String(b.due).localeCompare(String(a.due));
  const pick = open.sort(byDue).concat(done.filter(t => marks.has(t.id) || (t.due && t.due >= addDaysPure(today, -30))).sort(recent)).slice(0, SIRI_MAX_TASKS);
  const tasks = pick.map(t => {
    const o = {id: String(t.id), title: siriStr(t.title, 140), course: known.has(t.courseId) ? String(t.courseId) : "", type: siriStr(t.type, 24), due: siriDate(t.due), time: siriDate(t.due) ? siriTime(t.time) : "", done: t.status === "done"};
    if (marks.has(t.id)) o.mark = marks.get(t.id);
    return o;
  });
  const classes = (i.classes || []).filter(m => m && known.has(m.courseId) && siriDate(m.date) && siriTime(m.start) && siriTime(m.end))
    .map(m => ({course: String(m.courseId), kind: siriStr(m.kind, 24), date: m.date, start: m.start, end: m.end, where: siriStr(m.where, 60)}))
    .sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start)).slice(0, 400);
  return {v: SIRI_V, at: Number(i.now) || 0, grades, tasks, courses, classes};
}
// The app's addDays, without depending on it (this part is tested on its own)
function addDaysPure(s, n){ const [y, m, d] = String(s).split("-").map(Number); const x = new Date(y, m - 1, d + n); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`; }
/* SIRI-PURE-END */
(() => {
  const nb = () => { const n = window.StudyboardNative; return n && n.siriData && typeof n.siriData.save === "function" ? n.siriData : null; };
  const GRADES_KEY = "studyboard:siriGrades";
  const gradesOn = () => { try { return localStorage.getItem(GRADES_KEY) !== "0"; } catch (e) { return true; } };
  function input(){
    const today = todayISO(), G = window.SBGRADES;
    let classes = [];
    try {
      classes = schOccurrences(today, addDays(today, SIRI_DAYS - 1)).filter(o => o.type === "meet" && !o.skipped && o.c)
        .map(o => ({courseId: o.c.id, kind: o.label, date: o.date, start: o.start, end: o.end, where: o.where || (o.m && o.m.where) || o.c.room || ""}));
    } catch (e) { classes = []; }
    return {now: Date.now(), today, grades: gradesOn(), tasks: allTasks(), courses: coursesArr(),
      gradeItems: G && typeof G.items === "function" ? (() => { try { return G.items(); } catch (e) { return []; } })() : [],
      courseGrade: c => { const g = G && typeof G.now === "function" ? G.now(c) : null; return g && g.pct != null ? {pct: g.pct, letter: g.letter, marked: g.marked} : null; },
      timesText: c => courseTimesText(c), classes};
  }
  let last = "", t = null;
  function push(){
    clearTimeout(t); t = null;
    const S = nb(); if (!S) return;
    let snap; try { snap = siriSnapshot(input()); } catch (e) { console.warn("siri snapshot", e); return; }
    const sig = JSON.stringify(Object.assign({}, snap, {at: 0}));
    if (sig === last) return;
    last = sig;
    S.save(snap).catch(() => { last = ""; });
  }
  const soon = () => { if (nb() && !t) t = setTimeout(push, 2000); };
  hook("boot", () => { if (!nb()) return; setTimeout(push, 3000); setInterval(push, 15 * 60000); });
  hook("changed", soon);
  hook("render", soon);
  // leaving the app: write it now, it's what Siri sees until the app is opened again
  document.addEventListener("visibilitychange", () => { if (document.hidden && nb()) push(); });
  // signing out deletes it (and its Spotlight entries)
  document.addEventListener("click", e => { const b = e.target.closest && e.target.closest('[data-act="sb-signout"]'); if (b && nb()) { last = ""; nb().clear(); } }, true);
  window.SBSIRI = {
    available: () => !!nb(),
    gradesOn,
    setGrades: on => { try { localStorage.setItem(GRADES_KEY, on ? "1" : "0"); } catch (e) {} last = ""; push(); },
    refresh: () => { last = ""; push(); },
    snapshot: () => siriSnapshot(input())
  };
})();
/* SIRI-END */
