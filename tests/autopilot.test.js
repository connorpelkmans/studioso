// Unit tests for Autopilot's planning (the AUTOPILOT block of src/js/99-autopilot.js), with the real Exam Prep engine for re-plans
const assert = require("assert");
const s = require("../scripts/app-files").source();
const cut = (a, b) => s.slice(s.indexOf(a), s.indexOf(b));
const AP = new Function(cut("/*AUTOPILOT-START*/", "/*AUTOPILOT-END*/") + ";return AUTOPILOT;")();
const EP = new Function(cut("/*EXAMPREP-START*/", "/*EXAMPREP-END*/") + ";return EXAMPREP;")();
let n = 0; const ok = (c, m) => { n++; assert(c, m); };
const eq = (a, b, m) => { n++; assert.deepStrictEqual(a, b, m); };

// Wednesday 4 November 2026. A biology course with a midterm on the 10th and a prep plan; two sessions were missed (Mon, Tue).
const TODAY = "2026-11-04";
const t = (id, o) => Object.assign({id, title: id, courseId: "bio", type: "Assignment", start: "", due: "", status: "todo", hours: null}, o);
const sess = (id, due, topicId, kind, extra) => t(id, Object.assign({title: `BIO101 Midterm: ${topicId === "tA" ? "Cell biology" : "Genetics"} (${kind})`, type: "Study", start: due, due, hours: 0.75, prepFor: "ex", topicId, kind}, extra));
const seed = () => [
  t("ex", {title: "Biology Midterm", type: "Exam", due: "2026-11-10", prep: {topics: [{id: "tA", name: "Cell biology", conf: "weak"}, {id: "tB", name: "Genetics", conf: "ok"}], examDue: "2026-11-10"}}),
  sess("s1", "2026-11-02", "tA", "learn"), sess("s2", "2026-11-03", "tB", "learn"), sess("s3", "2026-11-05", "tA", "cards"),
  sess("s4", "2026-11-07", "tB", "questions"), sess("s5", "2026-11-09", "tA", "recap"), sess("s0", "2026-11-01", "tB", "recall", {status: "done"}),
  // A research paper broken into milestones; step 2 passed on Tuesday
  t("paper", {title: "Research Paper", due: "2026-11-12", breakdownParent: true, bdDue: "2026-11-12", hours: 8}),
  t("m1", {title: "Find sources", type: "Reading", due: "2026-11-01", start: "2026-11-01", breakdownOf: "paper", step: "1/4", hours: 2, status: "done"}),
  t("m2", {title: "Outline", type: "Project", due: "2026-11-03", start: "2026-11-03", breakdownOf: "paper", step: "2/4", hours: 1.5}),
  t("m3", {title: "Draft", type: "Project", due: "2026-11-07", start: "2026-11-07", breakdownOf: "paper", step: "3/4", hours: 3}),
  t("m4", {title: "Revise", type: "Project", due: "2026-11-10", start: "2026-11-10", breakdownOf: "paper", step: "4/4", hours: 1.5}),
  // Your own Study task, overdue; a real assignment due yesterday; school-synced items; a calendar-feed item
  t("st", {title: "Review lecture 7", type: "Study", due: "2026-11-03", hours: 1}),
  t("lab", {title: "Lab Report 3", due: "2026-11-03", hours: 3}),
  t("lms", {title: "Canvas practice set", type: "Study", due: "2026-11-02", hours: 1, cv: {id: "c9"}}),
  t("lms2", {title: "D2L Quiz 4", type: "Quiz", due: "2026-11-03", bs: {id: "q4"}}),
  t("ics", {title: "Feed study block", type: "Study", due: "2026-11-02", icsUid: "u1"}),
  t("done", {title: "Old study", type: "Study", due: "2026-11-01", status: "done"})
];
// Real free time from availability: a placement fills Friday the 6th
const CAP = {"2026-11-04": 2.5, "2026-11-05": 2, "2026-11-06": 0, "2026-11-07": 4, "2026-11-08": 4, "2026-11-09": 2, "2026-11-10": 2, "2026-11-11": 2, "2026-11-12": 2};
// The app's Catch Up, in miniature: the real planner, then old sessions reused by topic and kind (as applyPlan does)
const replanWith = (cap, off) => (ex, why) => {
  const tasks = cur;
  const out = EP.plan({today: TODAY, due: ex.due, topics: ex.prep.topics, intensity: 90, dayInfo: d => ({cap: off[d] ? 0 : Math.round((cap[d] == null ? 2 : cap[d]) * 60), blocked: !!off[d]})});
  if (out.err || !out.sessions.length) return {ok: false, warn: out.warnings[0]};
  const olds = tasks.filter(x => x.prepFor === ex.id && x.status !== "done"), used = new Set(), changes = [];
  out.sessions.forEach((x, i) => {
    const old = olds.find(o => !used.has(o.id) && o.topicId === (x.topicIds[0] || "") && o.kind === x.kind);
    const f = {title: "BIO101 Midterm: " + x.topic + " (" + x.kind + ")", type: "Study", due: x.date, start: x.date, hours: x.min / 60, prepFor: ex.id, topicId: x.topicIds[0] || "", kind: x.kind, status: "todo"};
    if (old) { used.add(old.id); changes.push({kind: "task", id: old.id, after: Object.assign({}, old, f)}); }
    else changes.push({kind: "task", id: "new" + i, after: Object.assign({id: "new" + i, courseId: "bio"}, f)});
  });
  olds.filter(o => !used.has(o.id)).forEach(o => changes.push({kind: "task", id: o.id, after: null}));
  changes.push({kind: "task", id: ex.id, after: Object.assign({}, ex, {prep: Object.assign({}, ex.prep, {examDue: ex.due})})});
  return {ok: true, changes, notes: out.warnings.filter(w => /^Not enough time|crash plan/.test(w)), why};
};
let cur = [];
const run = (tasks, o) => { o = o || {}; cur = tasks; return AP.plan({today: o.today || TODAY, tasks, off: o.off || {}, cap: o.cap || CAP, dh: 2, only: o.only, replanExam: o.noPrep ? null : replanWith(o.cap || CAP, o.off || {})}); };
const applied = (tasks, res) => { const m = {}; tasks.forEach(x => { m[x.id] = x; }); res.changes.forEach(c => { if (c.after) m[c.id] = c.after; else delete m[c.id]; }); return Object.values(m); };
const byId = (list, id) => list.find(x => x.id === id);

// The first run of the day
const base = seed(), r = run(base, {off: {"2026-11-08": 1}});
const after = applied(base, r), ids = new Set(r.changes.map(c => c.id));
ok(["lab", "lms", "lms2", "ics", "done", "paper", "m1"].every(id => !ids.has(id)), "a real assignment due yesterday, school-synced and feed items, done work and the parent never change: " + [...ids].join(","));
ok(byId(after, "ex").due === "2026-11-10" && byId(after, "lab").due === "2026-11-03" && byId(after, "lms2").due === "2026-11-03", "real due dates stay");
eq(r.exams.map(e => [e.id, e.why, e.missed]), [["ex", "missed", 2]], "the midterm's prep is re-spread because two sessions slipped");
const prep = after.filter(x => x.prepFor === "ex" && x.status !== "done");
ok(prep.length >= 3 && prep.every(x => x.due >= TODAY && x.due < "2026-11-10"), "every open prep session is between today and the day before the exam: " + prep.map(x => x.due).join(","));
ok(prep.every(x => x.due !== "2026-11-08" && x.due !== "2026-11-06"), "no session on the day off or the full placement day");
ok(r.moves.some(m => m.id === "s1" && m.from === "2026-11-02" && m.to >= TODAY && /Missed/.test(m.why)), "the missed session is listed with from, to and why: " + JSON.stringify(r.moves.find(m => m.id === "s1")));
ok(byId(after, "s0").due === "2026-11-01" && byId(after, "s0").status === "done", "a done prep session is kept as it was");
const m2 = byId(after, "m2");
ok(m2.due >= TODAY && m2.due <= "2026-11-07" && m2.start === m2.due, "the passed milestone goes to free time before the next step: " + m2.due);
ok(byId(after, "m3").due === "2026-11-07" && byId(after, "m4").due === "2026-11-10", "milestones that are on track stay put");
ok(r.moves.some(m => m.id === "m2" && /Missed step/.test(m.why) && /Research Paper/.test(m.why)), "the milestone's reason names the assignment");
const st = byId(after, "st");
ok(st.due >= TODAY && st.due !== "2026-11-06" && st.due !== "2026-11-08", "the overdue Study task gets a real free day: " + st.due);
ok(after.filter(x => AP.kindOf(x)).every(x => x.due >= TODAY), "nothing soft is left in the past");
ok(r.changes.every(c => !c.after || c.after.due !== "2026-11-08"), "nothing lands on the day off");
ok(r.moves.every(m => !m.to || m.to >= TODAY), "never before today");
ok(!r.short.length, "everything fit: " + JSON.stringify(r.short));
// Room is respected: soft hours on a day never go past its free time (beyond one item that is bigger than any day)
{
  const per = {}; after.filter(x => AP.kindOf(x) && x.due >= TODAY).forEach(x => { per[x.due] = (per[x.due] || 0) + (Number(x.hours) || 1); });
  ok(Object.keys(per).every(d => per[d] <= (CAP[d] == null ? 2 : CAP[d]) + 2), "no day is overfilled: " + JSON.stringify(per));
}

// A second run the same day changes nothing
const r2 = run(after, {off: {"2026-11-08": 1}});
eq([r2.changes.length, r2.moves.length, r2.short.length, r2.exams.length], [0, 0, 0, 0], "idempotent: a second run moves nothing");

// The exam moved (to the 11th): prep is re-planned to match
{
  const moved = applied(after, {changes: [{id: "ex", after: Object.assign({}, byId(after, "ex"), {due: "2026-11-11"})}]});
  const r3 = run(moved);
  eq(r3.exams.map(e => e.why), ["moved"], "an exam with a new date is re-planned");
  ok(applied(moved, r3).filter(x => x.prepFor === "ex" && x.status !== "done").every(x => x.due < "2026-11-11"), "and its sessions fit before the new date");
  ok(byId(applied(moved, r3), "ex").prep.examDue === "2026-11-11", "the plan now matches the date");
}

// Day off (only what is planned that day): Saturday the 7th has a prep session, the Draft milestone and a Study task
{
  const day = "2026-11-07", tasks = after.concat([t("st2", {title: "Flashcards for history", type: "Study", due: day, hours: 1})]);
  const r4 = run(tasks, {off: {[day]: 1}, only: day}), a4 = applied(tasks, r4);
  ok(a4.filter(x => AP.kindOf(x)).every(x => x.due !== day), "nothing soft is left on the day off: " + a4.filter(x => x.due === day).map(x => x.id).join(","));
  ok(r4.moves.some(m => m.id === "m3" && m.from === day && m.to < "2026-11-10" && m.to >= TODAY && m.why === "Your day off"), "the milestone moves to a nearby free day, still before the next step");
  ok(r4.moves.some(m => m.id === "st2" && m.why === "Your day off"), "the Study task moves too");
  ok(r4.exams.length === 1 && r4.exams[0].why === "dayoff", "prep on that day is re-planned around it");
  ok(byId(a4, "lab").due === "2026-11-03", "the rest is untouched");
  const r5 = run(tasks, {off: {}, only: "2026-11-05"});
  ok(r5.changes.every(c => c.id === "ex" || (c.after ? c.after.prepFor === "ex" : true)) && !r5.moves.some(m => m.id === "m3" || m.id === "st2"), "only that day's things are touched");
}

// Can't fit: the paper is due tomorrow and today is full; a Study task with no free day in two weeks
{
  const tight = [t("p2", {title: "Lab Writeup", due: "2026-11-05"}), t("k1", {title: "Analyse data", type: "Project", due: "2026-11-02", breakdownOf: "p2", step: "1/2", hours: 3}),
    t("k2", {title: "Write it up", type: "Project", due: "2026-11-05", breakdownOf: "p2", step: "2/2", hours: 2}), t("lone", {title: "Read chapter 4", type: "Study", due: "2026-11-01", hours: 2})];
  const full = {}; for (let i = 0; i < 20; i++) full[AP.add(TODAY, i)] = 0;
  const r6 = run(tight, {cap: full, noPrep: true}), a6 = applied(tight, r6);
  eq(r6.changes.length, 0, "nothing moves when nothing fits");
  ok(byId(a6, "k1").due === "2026-11-02" && byId(a6, "lone").due === "2026-11-01", "they stay where they are");
  ok(r6.short.length === 2 && /no free time left before “Lab Writeup” is due/.test(r6.short.find(x => x.title === "Analyse data").text), "and each is named honestly: " + JSON.stringify(r6.short));
  // A parent that was due before today: its steps are not moved past it
  const gone = [t("p3", {title: "Essay", due: "2026-11-03"}), t("k3", {title: "Final read", type: "Project", due: "2026-11-02", breakdownOf: "p3", step: "1/1", hours: 1})];
  const r7 = run(gone, {noPrep: true});
  ok(!r7.changes.length && /was due before today/.test(r7.short[0].text), "steps of an assignment whose due date passed stay");
  // Prep that can't fit: the exam is tomorrow and every day is blocked
  const ex = seed().filter(x => x.id === "ex" || x.prepFor === "ex").map(x => x.id === "ex" ? Object.assign({}, x, {due: "2026-11-05", prep: Object.assign({}, x.prep, {examDue: "2026-11-05"})}) : x);
  const r8 = run(ex, {cap: full});
  ok(!r8.changes.length && r8.short.length === 1 && /stay where they are/.test(r8.short[0].text), "prep with no room is left alone and named: " + JSON.stringify(r8.short));
  // The exam is today: nothing to re-plan
  ok(!run(ex.map(x => x.id === "ex" ? Object.assign({}, x, {due: TODAY}) : x)).changes.length, "an exam today is not re-planned");
}

// Which items count as soft
ok(AP.kindOf({id: "a", type: "Study", due: "2026-11-01", status: "todo"}) === "study", "own Study task");
ok(AP.kindOf({id: "a", type: "Assignment", due: "2026-11-01", status: "todo"}) === "", "assignment: never");
ok(AP.kindOf({id: "a", type: "Exam", due: "2026-11-01", status: "todo"}) === "", "exam: never");
ok(AP.kindOf({id: "a", type: "Study", due: "2026-11-01", status: "todo", bb: {id: 1}}) === "", "Blackboard item: never");
ok(AP.kindOf({id: "a", type: "Study", due: "2026-11-01", status: "todo", synced: true}) === "", "synced item: never");
ok(AP.kindOf({id: "a", type: "Project", due: "2026-11-01", status: "todo", breakdownOf: "p"}) === "step", "milestone");
ok(AP.kindOf({id: "a", type: "Study", due: "2026-11-01", status: "todo", prepFor: "x"}) === "prep", "prep session");
ok(AP.kindOf({id: "a", type: "Study", due: "", status: "todo"}) === "", "no date: nothing to move");
console.log(`autopilot.test.js: ${n} passed`);
