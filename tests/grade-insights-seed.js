// A realistic term for the grade insights tests and demos: 4 courses with marks, a late penalty, a missed item, class results,
// focus time and start dates (for patterns), exam readiness, credits, a goal and one past term.
const day = k => { const d = new Date(); d.setDate(d.getDate() + k); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const at = (k, h, m) => { const d = new Date(); d.setDate(d.getDate() + k); d.setHours(h, m || 0, 0, 0); return d.getTime(); };
let seq = 0;
function T(id, title, course, type, due, w, mark, extra){
  seq++;
  const t = {id, title, courseId: course, type, due, start: due, time: "23:59", status: mark != null ? "done" : "todo", priority: "med", weight: w, created: 1000 + seq, late: "penalty"};
  if (mark != null) {
    t.mark = typeof mark === "object" ? mark : {got: mark, outOf: 100};
    // pattern data: when work started (days before it was due), how long it took, and the hour it was mostly done
    const p = t.mark.got / t.mark.outOf * 100;
    const lead = p >= 87 ? 5 : p >= 80 ? 3 : 1, mins = type === "Exam" ? 0 : Math.round(30 + (p - 60) * 4), night = p < 80;
    const dueK = Math.round((new Date(due + "T12:00") - new Date(day(0) + "T12:00")) / 864e5);
    if (type !== "Exam") {
      const parts = Math.max(1, lead);
      t.workLog = Array.from({length: parts}, (_, i) => ({id: id + "w" + i, d: day(dueK - lead + i), m: Math.round(mins / parts), k: "focus", at: at(dueK - lead + i, night ? 23 : 16, 30)}));
      t.focusMin = mins;
    }
    t.doneAt = at(dueK, 20);
  }
  return Object.assign(t, extra || {});
}
const cls = (sc, mean, median, lo, hi, lq, uq) => ({cv: {key: "cv|" + seq, fb: {c: [], ra: [], sc, of: 100, g: "", cls: {mean, median, lo, hi, lq, uq}}}});
// flashcards that have been studied to the given boxes (level 0 to 5), last seen a few days ago
const cards = (deck, n, boxes) => Array.from({length: n}, (_, i) => { const b = boxes[i % boxes.length]; return {id: deck + "c" + i, front: "Card " + (i + 1), back: "Answer", box: b, seen: 2 + b, right: 1 + b, wrong: 1, last: day(-2 - (i % 3)), due: day(b >= 3 ? 4 : 0)}; });
function SEED(){
  seq = 0;
  const tasks = [
    // Marine Biology: 4 credits, goal 85%
    T("b1", "Quiz 1", "c1", "Quiz", day(-62), 3, 92), T("b2", "Quiz 2", "c1", "Quiz", day(-52), 3, 85), T("b3", "Quiz 3", "c1", "Quiz", day(-41), 3, 78),
    T("b4", "Quiz 4", "c1", "Quiz", day(-30), 3, 95), T("b5", "Quiz 5", "c1", "Quiz", day(-18), 3, 88), T("b6", "Quiz 6", "c1", "Quiz", day(-4), 3, 90),
    T("b7", "Lab Report 1", "c1", "Lab", day(-55), 8, 86, cls(86, 79, 80, 52, 97, 72, 87)),
    T("b8", "Lab Report 2", "c1", "Lab", day(-34), 8, {got: 74, outOf: 100, before: 84, pen: {v: 10, pct: true}}, Object.assign(cls(74, 78, 79, 45, 96, 70, 86), {doneAt: at(-32, 14)})),
    T("b9", "Lab Report 3", "c1", "Lab", day(-12), 8, 91, cls(91, 80, 81, 50, 99, 73, 88)),
    T("b10", "Midterm", "c1", "Exam", day(-24), 20, 76, Object.assign(cls(76, 70, 71, 38, 98, 62, 81), {readySnap: {felt: 85, measured: 80, at: at(-24, 9)}})),
    T("b11", "Research Project", "c1", "Project", day(6), 13, null, {hours: 6}),
    T("b12", "Final Exam", "c1", "Exam", day(20), 25, null, {hours: 8, prep: {v: 1, topics: [
      {id: "tp1", name: "Coral reef ecology", conf: "strong", weight: 1, links: []}, {id: "tp2", name: "Osmoregulation", conf: "weak", weight: 2, links: [{k: "deck", id: "d2", title: "Fish Anatomy"}]},
      {id: "tp3", name: "Ocean acidification", conf: "ok", weight: 1, links: [{k: "deck", id: "d3", title: "Ocean Chemistry"}]}, {id: "tp4", name: "Deep-sea adaptations", conf: "weak", weight: 1, links: []}], sessions: []}}),
    // Statistics: 3 credits, close to an A-
    T("s1", "Problem Set 1", "c2", "Assignment", day(-60), 6, 95), T("s2", "Problem Set 2", "c2", "Assignment", day(-46), 6, 88),
    T("s3", "Problem Set 3", "c2", "Assignment", day(-33), 6, 92), T("s4", "Problem Set 4", "c2", "Assignment", day(-19), 6, 84),
    T("s5", "Problem Set 5", "c2", "Assignment", day(-5), 6, 90),
    T("s6", "Midterm", "c2", "Exam", day(-27), 25, 89, {readySnap: {felt: 80, measured: 86, at: at(-27, 9)}}),
    T("s7", "Problem Set 6", "c2", "Assignment", day(3), 6, null, {hours: 2}),
    T("s8", "Final Exam", "c2", "Exam", day(25), 39, null, {hours: 10}),
    // English Literature: 3 credits, a missed response and a late essay
    T("e1", "Essay 1", "c3", "Assignment", day(-50), 15, 82, cls(82, 76, 77, 50, 95, 70, 84)),
    T("e2", "Essay 2", "c3", "Assignment", day(-26), 15, {got: 76, outOf: 100, before: 81, pen: {v: 5, pct: true}}, Object.assign(cls(76, 75, 76, 48, 94, 68, 83), {doneAt: at(-25, 11)})),
    T("e3", "Response Paper 1", "c3", "Reading", day(-58), 5, 88), T("e4", "Response Paper 2", "c3", "Reading", day(-44), 5, 80),
    T("e5", "Response Paper 3", "c3", "Reading", day(-15), 5, null, {late: "none"}),
    T("e6", "Response Paper 4", "c3", "Reading", day(-3), 5, 84),
    T("e7", "Essay 3", "c3", "Assignment", day(10), 20, null, {hours: 7}),
    T("e8", "Final Paper", "c3", "Project", day(30), 30, null, {hours: 12}),
    // Chemistry: 4 credits, right under a C-
    T("h1", "Quiz 1", "c4", "Quiz", day(-57), 5, 70), T("h2", "Quiz 2", "c4", "Quiz", day(-43), 5, 64), T("h3", "Quiz 3", "c4", "Quiz", day(-29), 5, 75), T("h4", "Quiz 4", "c4", "Quiz", day(-9), 5, 68),
    T("h5", "Lab 1", "c4", "Lab", day(-48), 5, 80), T("h6", "Lab 2", "c4", "Lab", day(-36), 5, 72), T("h7", "Lab 3", "c4", "Lab", day(-2), 5, 78),
    T("h8", "Midterm", "c4", "Exam", day(-22), 25, 66, {readySnap: {felt: 75, measured: 70, at: at(-22, 9)}}),
    T("h9", "Final Exam", "c4", "Exam", day(18), 40, null, {hours: 10})];
  return {v: 2, updated: 1, settings: {recapLast: {key: "c:demo", from: day(-70), to: day(0), name: "Fall 2026"}, grades: {cls: true, terms: [{id: "pt1", name: "Fall 2025", at: Date.now() - 200 * 864e5, courses: [
      {name: "Intro Biology", code: "BIO101", credits: 4, pct: 88, letter: "B+"}, {name: "Calculus I", code: "MAT120", credits: 4, pct: 81, letter: "B-"},
      {name: "Writing Seminar", code: "WRT100", credits: 3, pct: 91, letter: "A-"}, {name: "Psychology", code: "PSY101", credits: 3, pct: 85, letter: "B"}]}]}},
    decks: [
      {id: "d1", name: "Marine Ecosystems", courseId: "c1", cards: cards("d1", 24, [5, 4, 4, 3, 5, 4]), quizzes: []},
      {id: "d2", name: "Fish Anatomy", courseId: "c1", cards: cards("d2", 18, [1, 0, 2, 1, 0, 1]), quizzes: []},
      {id: "d3", name: "Ocean Chemistry", courseId: "c1", cards: cards("d3", 15, [2, 3, 2, 1, 3, 2]), quizzes: []}],
    courses: [
      {id: "c1", name: "Marine Biology", code: "BIO210", color: "#3B6FE0", credits: 4, grading: {goal: 85}},
      {id: "c2", name: "Statistics", code: "STA101", color: "#1E9E74", credits: 3},
      {id: "c3", name: "English Literature", code: "ENG150", color: "#C2410C", credits: 3},
      {id: "c4", name: "Chemistry", code: "CHM110", color: "#8B5CF6", credits: 4}],
    tasks};
}
// Seeds a fresh browser context with this term
const SEED_INIT = seed => {
  try {
    if (!localStorage.getItem("coursework:v2")) {
      localStorage.setItem("coursework:v2", JSON.stringify(seed)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1");
      localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("studyboard:tour", "done");
    }
  } catch (e) {}
  // a seeded term with lots of finished work earns companion props; their celebration would cover the page
  try { new MutationObserver(() => document.querySelectorAll(".cpu,.cp").forEach(x => { try { x.hidePopover(); } catch (e) {} x.remove(); })).observe(document, {childList: true, subtree: true}); } catch (e) {}
};
module.exports = {SEED, SEED_INIT, day};
