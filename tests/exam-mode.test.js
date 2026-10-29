// Unit tests for Exam Mode's rules (pure logic extracted from index.html)
const fs = require("fs"), path = require("path"), assert = require("assert");
const s = require("../scripts/app-files").source();
const a = s.indexOf("/*EXAMMODE-START*/"), b = s.indexOf("/*EXAMMODE-END*/");
assert(a > 0 && b > a, "EXAMMODE block found");
const E = new Function(s.slice(a, b) + ";return EXAMMODE;")();
let n = 0; const ok = (c, m) => { n++; assert(c, m); };
const TODAY = "2026-10-21", NOW = new Date(2026, 9, 21, 10, 0, 0).getTime();
const T = (id, type, due, o) => Object.assign({id, title: id, type, due, status: "todo"}, o || {});
const pick = (tasks, o) => E.pick(Object.assign({tasks, today: TODAY, now: NOW, off: {}, enabled: true}, o || {}));

// Off with nothing in the window
ok(pick([]) === null, "no tasks, no mode");
ok(pick([T("ex", "Exam", "2026-10-25")]) === null, "an exam 4 days out is outside the window");
ok(pick([T("a1", "Assignment", "2026-10-22")]) === null, "assignments alone never turn it on");
ok(pick([T("ex", "Exam", "2026-10-23", {status: "done"})]) === null, "a done exam doesn't count");
ok(pick([T("ex", "Exam", "2026-10-20")]) === null, "a past exam doesn't count");

// On with an exam in 2 days
{
  const m = pick([T("ex", "Exam", "2026-10-23", {courseId: "bio"})]);
  ok(m && m.exam.id === "ex" && m.days === 2, "an exam in 2 days turns it on");
}
ok(pick([T("ex", "Exam", "2026-10-24")]).days === 3, "3 days out is still in the window");
ok(pick([T("q", "Quiz", "2026-10-22", {weight: 10})]).exam.id === "q", "quizzes worth 10% or more count");
ok(pick([T("q", "Quiz", "2026-10-22", {weight: 5})]) === null && pick([T("q", "Quiz", "2026-10-22")]) === null, "smaller quizzes don't take over the plan");
ok(pick([T("q", "Quiz", "2026-10-22", {weight: 5, w: 12})]).exam.id === "q", "the share of the grade from points counts too");
ok(pick([T("m", "Other", "2026-10-22", {title: "Midterm 2"})]).exam.id === "m", "a task titled Midterm counts");
ok(pick([T("s", "Study", "2026-10-22", {title: "Midterm review", prepFor: "x"})]) === null, "a study session never counts as the exam");
ok(pick([T("ex", "Exam", "2026-10-23")], {enabled: false}) === null, "the setting turns it off");

// Exam day: on until 2 hours after it starts (or the end of the day with no time)
ok(pick([T("ex", "Exam", TODAY, {time: "09:00"})]) !== null, "on during an exam that started an hour ago");
ok(pick([T("ex", "Exam", TODAY, {time: "07:30"})]) === null, "off once the exam is over");
ok(pick([T("ex", "Exam", TODAY, {time: "07:30"})], {now: new Date(2026, 9, 21, 9, 0).getTime()}) !== null, "but on before it ended");
ok(pick([T("ex", "Exam", TODAY)]) !== null, "an exam today with no time stays on all day");

// Several exams
{
  const tasks = [T("e2", "Exam", "2026-10-24", {time: "09:00"}), T("e1", "Exam", "2026-10-23", {time: "13:00"}), T("q1", "Quiz", "2026-10-23", {time: "08:00", weight: 15})];
  const m = pick(tasks);
  ok(m.exam.id === "q1" && m.others.map(t => t.id).join() === "e1,e2", "soonest first, others listed: " + m.exam.id + " / " + m.others.map(t => t.id));
  const m2 = pick(tasks, {off: {q1: true}});
  ok(m2.exam.id === "e1" && m2.others.map(t => t.id).join() === "e2", "Not Now on one exam focuses on the next");
  ok(pick(tasks, {off: {q1: true, e1: true, e2: true}}) === null, "Not Now on all of them turns it off");
}

// Also due: work in the window, every course, by due time; no study sessions, no later work
{
  const tasks = [T("ex", "Exam", "2026-10-23", {time: "09:00", courseId: "bio"}),
    T("lab", "Lab", "2026-10-22", {time: "23:59", courseId: "bio"}), T("ess", "Assignment", "2026-10-21", {time: "17:00", courseId: "his"}),
    T("late", "Assignment", "2026-10-24", {courseId: "chem"}), T("far", "Assignment", "2026-10-26"), T("ss", "Study", "2026-10-22", {prepFor: "ex"}),
    T("dead", "Assignment", "2026-10-22", {dead: true}), T("old", "Assignment", "2026-10-19"), T("oldok", "Assignment", "2026-10-20", {lateOk: true}), T("dn", "Assignment", "2026-10-22", {status: "done"})];
  const m = pick(tasks);
  ok(m.also.map(t => t.id).join() === "oldok,ess,lab,late", "also due, soonest first: " + m.also.map(t => t.id));
}

// Do This Next order
{
  const exDue = new Date(2026, 9, 23, 9, 0).getTime();
  const at = (d, h) => new Date(2026, 9, d, h || 23, h ? 0 : 59).getTime();
  const items = [
    {id: "study1", kind: "study", dueMs: at(21)},
    {id: "other", kind: "other", dueMs: at(22)},
    {id: "far", kind: "work", dueMs: at(28), inWindow: false},
    {id: "afterEx", kind: "work", dueMs: at(23), inWindow: true},
    {id: "labTmrw", kind: "work", dueMs: at(22), inWindow: true},
    {id: "essToday", kind: "work", dueMs: at(21, 17), inWindow: true},
    {id: "riskLater", kind: "work", dueMs: at(24), inWindow: true, risk: true},
    {id: "study2", kind: "study", dueMs: at(22)}];
  const O = {dayEnd: new Date(2026, 9, 23, 23, 59, 59).getTime(), examDay: false};
  const o = E.order(items.map(x => Object.assign({}, x)), exDue, O);
  const ids = o.map(x => x.id);
  ok(ids.join() === "essToday,riskLater,study1,study2,labTmrw,afterEx,other,far", "order, with a study session due today: " + ids.join());
  ok(o.find(x => x.id === "essToday").lane === "first" && o.find(x => x.id === "riskLater").lane === "first" && o.find(x => x.id === "study1").lane === "study" && o.find(x => x.id === "labTmrw").lane === "after" && o.find(x => x.id === "far").lane === "rest", "lanes");
  // With no session on the list ("Study for ..." stands in)
  const noS = items.filter(x => x.kind !== "study").map(x => Object.assign({}, x));
  const oV = E.order(noS, exDue, O);
  ok(oV.map(x => x.id).join() === "essToday,labTmrw,afterEx,riskLater,other,far" && oV.find(x => x.id === "afterEx").lane === "first", "no sessions: " + oV.map(x => x.id).join());
  // On the exam day itself, only what's due before the exam (or at risk) leads
  const oD = E.order(items.filter(x => x.kind !== "study").map(x => Object.assign({}, x)), exDue, {dayEnd: O.dayEnd, examDay: true});
  ok(oD.find(x => x.id === "afterEx").lane === "after" && oD.find(x => x.id === "labTmrw").lane === "first", "on the exam day: " + oD.map(x => x.id + ":" + x.lane).join());
  // Nothing is ever dropped
  ok(o.length === items.length && new Set(ids).size === items.length, "every item kept");
  // With nothing due before the exam, study leads
  const o2 = E.order([{id: "w", kind: "work", dueMs: at(24), inWindow: true}, {id: "s", kind: "study", dueMs: at(22)}], exDue, O);
  ok(o2[0].id === "s", "study first when the work is due after the exam's day");
  // Work due sooner than the study session leads, even when the app had it lower
  const o3 = E.order([{id: "s", kind: "study", dueMs: at(22)}, {id: "w", kind: "work", dueMs: at(21, 17), inWindow: true}], exDue, O);
  ok(o3[0].id === "w", "work due sooner than the study comes first");
  const o4 = E.order([{id: "s", kind: "study", dueMs: at(21)}, {id: "w", kind: "work", dueMs: at(22), inWindow: true, risk: true}], exDue, O);
  ok(o4[0].id === "w", "work short of time comes first");
}

// Words
ok(E.tag({type: "Exam"}, 2) === "Exam in 2 days" && E.tag({type: "Quiz"}, 1) === "Quiz tomorrow" && E.tag({type: "Exam"}, 0) === "Exam today", "tags");

console.log(`exam-mode.test.js: ${n} checks passed`);
