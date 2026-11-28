// Unit tests for moving study blocks on Today's Plan (pins): the pure helpers in the AVAIL engine (pinsOn, carve, placePinned, snap),
// availPlan() planning around pins, and normPins() cleaning pins once their day is over.
// Run: node tests/plan-move.test.js
const assert = require("assert");
const s = require("../scripts/app-files").source();
let n = 0; const ok = (c, m) => { n++; assert(c, m); }, eq = (a, b, m) => { n++; assert.deepStrictEqual(a, b, m); };

const A = new Function(s.slice(s.indexOf("/* AVAIL-START"), s.indexOf("/* AVAIL-END */")) + ";return AVAIL;")();
// a function's source, from "function name(" to its closing brace at the start of a line
const fn = name => { const i = s.indexOf("function " + name + "("); assert(i >= 0, name + " found"); const j = s.indexOf("\n}\n", i); return s.slice(i, j + 2); };
const cfg = A.normCfg({dayStart: "07:00", dayEnd: "23:00", breakMin: 10, maxSession: 50, minChunk: 15});
const DAY = "2026-11-24";
// a Tuesday 9:00 AM with a class 11:30 AM to 12:50 PM
const res = A.freeWindows(DAY, {blocks: [], cfg, ext: [{start: "11:30", end: "12:50", title: "PSYC 1010"}], nowMin: 540});
const busyClass = res.busy;

// pinsOn: a date's pins, merged; finished ones dropped; the "moved off this day" pin
{
  const pins = [{date: DAY, s: 600, e: 630}, {date: DAY, s: 620, e: 660}, {date: DAY, s: 480, e: 500}, {date: "2026-11-25", s: 700, e: 730}];
  eq(A.pinsOn(pins, DAY, 540), {off: false, iv: [{s: 600, e: 660}]}, "today's pins, overlapping ones merged, the one already over left out");
  eq(A.pinsOn(pins, "2026-11-25", null), {off: false, iv: [{s: 700, e: 730}]}, "another day's pins");
  eq(A.pinsOn([{date: DAY, s: 0, e: 0}, {date: DAY, s: 600, e: 630}], DAY, 540), {off: true, iv: []}, "moved off the day: no time that day");
  eq(A.pinsOn(null, DAY, 540), {off: false, iv: []}, "no pins");
  eq(A.pinsOn([{date: DAY, s: "x", e: 5}, null, 7], DAY, 0), {off: false, iv: []}, "junk ignored");
}
// carve: free windows with pinned blocks (and a break around them) taken out
{
  const w = [{s: 540, e: 690, min: 150}, {s: 770, e: 1380, min: 610}];
  eq(A.carve(w, [{s: 600, e: 630}], 10).map(x => [x.s, x.e]), [[540, 590], [640, 690], [770, 1380]], "a pin splits its window, with a break each side");
  eq(A.carve(w, [{s: 530, e: 700}], 0).map(x => [x.s, x.e]), [[770, 1380]], "a pin covering a window removes it");
  eq(A.carve(w, [{s: 540, e: 687}], 0).map(x => [x.s, x.e]), [[770, 1380]], "slivers under 5 minutes go");
  eq(A.carve(w, [], 10), w.map(x => Object.assign({}, x)), "no pins, no change");
}
// placePinned: pinned blocks keep their time and the rest of the plan goes around them
{
  const tasks = [{id: "a", min: 60}, {id: "b", min: 30, pins: [{s: 780, e: 810}]}, {id: "c", min: 60}];
  const pl = A.placePinned(res.windows, tasks, {cfg});
  const b = pl.slots.filter(x => x.id === "b");
  eq(b.map(x => [x.s, x.e, !!x.pin]), [[780, 810, true]], "the pinned block is exactly where it was put");
  ok(pl.slots.filter(x => x.id !== "b").every(x => x.e + 10 <= 780 || x.s >= 810 + 10), "nothing else is planned on it, or in the break next to it");
  ok(pl.slots.every(x => !busyClass.some(m => m.s < x.e && m.e > x.s)), "nothing is planned in the class");
  eq(pl.slots.filter(x => x.id === "a").reduce((t, x) => t + x.min, 0), 60, "the others still get their time");
  eq(pl.slots.filter(x => x.id === "c").reduce((t, x) => t + x.min, 0), 60, "the others still get their time (2)");
  const before = A.place(res.windows, [{id: "a", min: 60}, {id: "b", min: 30}, {id: "c", min: 60}], {cfg});
  ok(before.slots.find(x => x.id === "b").s !== 780, "(without the pin, the planner had put it somewhere else)");
  // longer than its share: the pin holds; part of its share pinned: the rest is placed too
  eq(A.placePinned(res.windows, [{id: "b", min: 15, pins: [{s: 780, e: 840}]}], {cfg}).slots.map(x => [x.s, x.e]), [[780, 840]], "a pin longer than the task's share keeps all its time");
  const part = A.placePinned(res.windows, [{id: "b", min: 90, pins: [{s: 900, e: 930}]}], {cfg}).slots.filter(x => x.id === "b");
  eq(part.reduce((t, x) => t + x.min, 0), 90, "a task with one pinned block gets the rest of its time elsewhere");
  ok(part.some(x => x.pin && x.s === 900) && part.filter(x => !x.pin).every(x => x.e <= 890 || x.s >= 940), "around the pin");
  eq(part.map(x => x.part), part.map((x, i) => i + 1), "parts are numbered in time order");
  eq(A.placePinned(res.windows, [{id: "b", min: 60, off: true}, {id: "c", min: 30}], {cfg}).slots.map(x => x.id), ["c"], "moved off the day: no time today");
}
// snap: a drop that overlaps something fixed goes to the nearest free time
{
  const fixed = busyClass.map(m => ({s: m.s, e: m.e, title: m.title}));
  eq(A.snap(600, 30, fixed, 540, 1380), {s: 600, e: 630, moved: false, hit: null}, "a free time stays as it is");
  const a = A.snap(720, 30, fixed, 540, 1380);
  ok(a.s === 770 && a.e === 800 && a.moved && a.hit.title === "PSYC 1010", "dropped in the class (nearer its end): just after it " + JSON.stringify(a));
  const b = A.snap(700, 30, fixed, 540, 1380);
  ok(b.s === 660 && b.e === 690 && b.hit.title === "PSYC 1010", "dropped across the class's start: just before it " + JSON.stringify(b));
  eq(A.snap(603, 30, fixed, 540, 1380).s, 605, "starts are on 5 minutes");
  eq(A.snap(500, 30, fixed, 540, 1380).s, 540, "not before now");
  eq(A.snap(1370, 30, fixed, 540, 1380).s, 1350, "not past the end of the day");
  eq(A.snap(600, 120, [{s: 600, e: 700}, {s: 780, e: 1380}], 540, 1380), null, "nothing that long left: null");
  const p = A.snap(800, 30, fixed.concat([{s: 790, e: 850, title: "Essay", kind: "pin"}]), 540, 1380);
  ok(p.s === 850 && p.hit.title === "Essay", "another pinned block counts as fixed too " + JSON.stringify(p));
}

// availPlan: the planner itself, with the app around it stubbed
{
  const env = {AVAIL: A, ui: {}, fmtHM: h => h + "h", availMin: m => String(m), MILESTONE: t => t === "Exam" || t === "Quiz",
    state: {tasks: {}}, availState: () => ({cfg, blocks: []}), enoughToday: () => false, addDays: (d, k) => A.addD(d, k), parse: d => new Date(d)};
  const code = ["availPlan", "planPinHost", "planPinsFor"].map(fn).join("\n") + "\nconst availWhen = () => \"tomorrow\";";
  const make = new Function(...Object.keys(env), code + ";return availPlan;");
  const plan = (tasks, ranked) => {
    env.state.tasks = Object.fromEntries(tasks.map(t => [t.id, t]));
    return make(...Object.values(env))({res, active: true, sd: {date: DAY, now: 540}}, ranked, 3, 3, [3, 3], DAY, new Date(2026, 10, 24, 9, 0), "");
  };
  const T = (id, o) => Object.assign({id, title: id, type: "Assignment", status: "todo"}, o || {});
  const X = (t, alloc) => ({t, alloc});
  // no pins: as before
  let tasks = [T("a"), T("b"), T("c")], ranked = tasks.map(t => X(t, 0.5));
  const p0 = plan(tasks, ranked);
  eq(p0.by.b.map(x => x.s), [580], "no pins: b goes after a, as before");
  // b pinned at 3 PM
  tasks = [T("a"), T("b", {pins: [{date: DAY, s: 900, e: 930}]}), T("c")]; ranked = tasks.map(t => X(t, 0.5));
  let p = plan(tasks, ranked);
  eq(p.by.b.map(x => [x.s, x.e, !!x.pin]), [[900, 930, true]], "b keeps its pinned time");
  ok(p.by.c[0].s < 900 && p.by.c[0].s === 580, "c moves up into the time b had: " + JSON.stringify(p.by.c));
  ok(ranked[1].pinned && ranked[1].alloc === 0.5, "b is marked pinned, its time today unchanged");
  // a pin from another day is ignored
  tasks = [T("a"), T("b", {pins: [{date: "2026-11-23", s: 900, e: 930}]}), T("c")]; ranked = tasks.map(t => X(t, 0.5));
  eq(plan(tasks, ranked).by.b.map(x => x.s), [580], "yesterday's pin is ignored");
  // a pin that a class now covers moves to the nearest free time
  tasks = [T("a"), T("b", {pins: [{date: DAY, s: 760, e: 790}]})]; ranked = tasks.map(t => X(t, 0.5));
  eq(plan(tasks, ranked).by.b.map(x => [x.s, x.e]), [[770, 800]], "a pin overlapping a class snaps out of it");
  // longer than its share: alloc grows to the pinned time
  tasks = [T("b", {pins: [{date: DAY, s: 900, e: 990}]})]; ranked = tasks.map(t => X(t, 0.5));
  p = plan(tasks, ranked);
  ok(ranked[0].alloc === 1.5 && p.by.b[0].e === 990, "a pin longer than the task's share: the plan gives it the pinned time");
  // pinned but with no time today in the plan: it still gets its pinned block
  tasks = [T("b", {pins: [{date: DAY, s: 900, e: 930}]})]; ranked = tasks.map(t => X(t, 0));
  ok(plan(tasks, ranked).by.b[0].s === 900, "a pinned task the plan had no time for today still gets its block");
  // moved to tomorrow: nothing today
  tasks = [T("a"), T("b", {pins: [{date: DAY, s: 0, e: 0}, {date: "2026-11-25", s: 600, e: 630}]})]; ranked = tasks.map(t => X(t, 0.5));
  p = plan(tasks, ranked);
  ok(!p.by.b && ranked[1].alloc === 0 && ranked[1].pinOff, "Tomorrow: no time today");
  // done, group and fixed items don't use pins; "Study for" an exam uses the exam's pins, the exam's own (fixed) row doesn't
  tasks = [T("b", {status: "done", pins: [{date: DAY, s: 900, e: 930}]})]; ranked = tasks.map(t => X(t, 0.5));
  eq(plan(tasks, ranked).by.b.map(x => x.s), [540], "a done task's pins are ignored");
  const ex = T("ex", {type: "Exam", pins: [{date: DAY, s: 900, e: 960}]}), study = {id: "study:ex", title: "Study for ex", xs: {id: "ex"}};
  tasks = [T("a"), ex]; ranked = [X(tasks[0], 0.5), Object.assign(X(ex, 0), {fixed: true}), X(study, 1)];
  p = plan(tasks, ranked);
  eq(p.by["study:ex"].map(x => [x.s, x.e]), [[900, 960]], "the exam's study block uses the pins on the exam");
  ok(!p.by.ex, "the exam itself gets no block");
  tasks = [T("a")]; ranked = [X(Object.assign(T("g"), {gt: {id: "g"}, pins: [{date: DAY, s: 900, e: 930}]}), 0.5)];
  eq(plan(tasks, ranked).by.g.map(x => x.s), [540], "a group task can't be pinned");
}

// normPins: checked, and dropped once their day is over (the day before is kept: just after midnight it can still be the plan day)
{
  const pad = x => String(x).padStart(2, "0"), iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const env = {todayISO: () => DAY, addDays: (d, k) => A.addD(d, k), isDate: x => typeof x === "string" && /^\d{4}-\d{2}-\d{2}$/.test(x)};
  const normPins = new Function(...Object.keys(env), fn("normPins") + ";return normPins;")(...Object.values(env));
  eq(normPins([{date: DAY, s: 600, e: 630, extra: 1}, {date: "2026-11-23", s: 1500, e: 1530}, {date: "2026-11-22", s: 600, e: 630}, {date: "2026-11-25", s: 0, e: 0}]),
    [{date: "2026-11-23", s: 1500, e: 1530}, {date: DAY, s: 600, e: 630}, {date: "2026-11-25", s: 0, e: 0}], "older pins dropped, the rest cleaned and sorted");
  eq(normPins([{date: DAY, s: 630, e: 600}, {date: DAY, s: 5, e: 5}, {date: DAY, s: 1.5, e: 9}, {date: DAY, s: -5, e: 9}, {date: DAY, s: 0, e: 3000}, {date: "x", s: 0, e: 9}, "x", null]), [], "bad pins dropped");
  eq(normPins([{date: DAY, s: 600, e: 630}, {date: DAY, s: 600, e: 630}]).length, 1, "duplicates (two devices' merge) dropped");
  eq(normPins("nope"), [], "not a list");
  eq(normPins(Array.from({length: 40}, (_, i) => ({date: DAY, s: i * 10, e: i * 10 + 5}))).length, 24, "capped");
  ok(iso(new Date(2026, 10, 24)) === DAY, "(date helper)");
}
// normTask keeps a task's pins through normPins, and removes the field when none are left
ok(/if \(t\.pins != null\) t\.pins = normPins\(t\.pins\);/.test(s) && /if \(t\.pins && !t\.pins\.length\) delete t\.pins;/.test(s), "normTask cleans pins");

console.log(`plan-move.test: ${n} checks passed`);
