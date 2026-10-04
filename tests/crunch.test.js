// Unit tests for the Crunch Forecast model (pure logic extracted from index.html).  Run: node tests/crunch.test.js
const fs = require("fs"), path = require("path"), assert = require("assert"), cp = require("child_process");
const TZS = ["UTC", "America/New_York", "America/Los_Angeles", "Europe/London", "Australia/Sydney", "Pacific/Auckland", "Asia/Kolkata"];
if (!process.env.CRUNCH_TZ_CHILD && !process.env.CRUNCH_NO_TZ) {
  for (const tz of TZS) {
    const r = cp.spawnSync(process.execPath, [__filename], {env: Object.assign({}, process.env, {TZ: tz, CRUNCH_TZ_CHILD: "1"}), encoding: "utf8"});
    process.stdout.write(`[${tz}] ${r.stdout.trim().split("\n").pop()}\n`);
    if (r.status !== 0) { process.stderr.write(r.stderr + r.stdout); process.exit(1); }
  }
  process.exit(0);
}
const s = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const code = s.slice(s.indexOf("/*CRUNCH-START*/"), s.indexOf("/*CRUNCH-END*/"));
const C = new Function(code + ";return CRUNCH;")();
let n = 0; const ok = (c, m) => { n++; assert(c, m); };
const T = (id, type, due, o) => Object.assign({id, title: id, type, due, status: "todo", est: true}, o || {});
const build = (tasks, o) => C.build(Object.assign({today: "2026-10-05", tasks, dailyHours: 3}, o || {}));   // 2026-10-05 is a Monday
const wk = (m, start) => m.weeks.find(w => w.start === start);
const day = (m, d) => m.days.find(x => x.date === d);

// empty term
{ const m = build([]); ok(m.empty && m.days.length === 0 && m.weeks.length === 0, "empty"); }
{ const m = build([T("a", "Exam", "2026-10-10", {status: "done"})]); ok(m.empty, "only done tasks = empty"); }

// one exam: busy around it, never crunch, heat builds before the day
{
  const m = build([T("e1", "Exam", "2026-10-14", {rem: 8})]);
  const w = wk(m, "2026-10-12");
  ok(w && w.levelIdx >= 1 && w.levelIdx <= 2, "one exam week is steady or busy, never crunch: " + w.level + " " + w.score);
  ok(day(m, "2026-10-13").ratio > day(m, "2026-10-09").ratio && day(m, "2026-10-09").ratio > 0.05, "prep builds toward the exam");
  ok(day(m, "2026-10-08").ratio === 0, "nothing before the 5-day lead-up");
  ok(day(m, "2026-10-14").due[0].id === "e1" && /1 exam/.test(day(m, "2026-10-14").reasons), "exam day listed: " + day(m, "2026-10-14").reasons);
}

// three exams + a paper in one week: crunch, visible 4+ weeks ahead through the lead-up
{
  const tasks = [T("bio", "Exam", "2026-11-10", {rem: 8, weight: 25}), T("chem", "Exam", "2026-11-11", {rem: 8, weight: 25}), T("stat", "Exam", "2026-11-12", {rem: 7, weight: 20}), T("essay", "Assignment", "2026-11-13", {title: "History term paper", rem: 10, weight: 20})];
  const m = build(tasks);
  const w = wk(m, "2026-11-09");
  ok(w.level === "crunch", "3 exams + paper is crunch: " + w.score + " " + w.level);
  ok(/3 exams \+ 1 paper/.test(w.reasons), "reasons: " + w.reasons);
  ok(C.diff("2026-10-05", w.start) >= 28, "more than 4 weeks ahead");
  ok(C.heaviest(m).start === "2026-11-09" && C.nextCrunch(m, "2026-10-05", {min: 4, maxDays: 60}).start === "2026-11-09" && C.nextCrunch(m, "2026-10-05", {maxDays: 60}).start === "2026-11-02", "heaviest / nextCrunch");
  ok(C.companionPick(m, "2026-09-28") === null && C.companionPick(m, "2026-10-05").start === "2026-11-09", "6 weeks ahead is too early for the companion");
  ok(C.companionPick(m, "2026-10-19").start === "2026-11-09", "companion picks it 3 weeks ahead");
  ok(C.companionPick(m, "2026-11-02") === null, "but not within 2 weeks");
  // the lead-up reaches into the week before, so that week is already heating
  ok(wk(m, "2026-11-02").levelIdx >= 2, "week before is already busy+: " + wk(m, "2026-11-02").level);
  ok(wk(m, "2026-10-12").level === "calm", "weeks far out stay calm");
  ok(w.headline === "3 exams and a paper", "headline: " + w.headline);
  const pre = wk(m, "2026-11-02");
  ok(pre.prepCounts.exam === 3 && pre.prepCounts.paper === 1 && /^prep for 3 exams and a paper$/.test(pre.headline) && /prep for 3 exams \+ 1 paper/.test(pre.reasons), "lead-up week says what it is preparing for: " + pre.headline + " / " + pre.reasons);
  ok(w.top.length >= 3 && w.top[0].total >= w.top[1].total, "top contributors sorted");
  ok(day(m, "2026-11-11").top.some(x => x.id === "chem" && x.kind === "due"), "day top contributors");
}

// four majors in a week can't be anything but crunch even with big capacity
{
  const tasks = [T("a", "Exam", "2026-11-10", {rem: 1}), T("b", "Exam", "2026-11-11", {rem: 1}), T("c", "Project", "2026-11-12", {rem: 1}), T("d", "Assignment", "2026-11-13", {title: "Essay", rem: 1})];
  ok(wk(build(tasks, {dailyHours: 12}), "2026-11-09").level === "crunch", "four big deadlines floor");
  ok(wk(build(tasks.slice(0, 3), {dailyHours: 12}), "2026-11-09").levelIdx >= 3, "three big deadlines floor at heavy");
}

// done tasks excluded; doing counts a little less stress
{
  const tasks = [T("e1", "Exam", "2026-11-10", {rem: 8}), T("e2", "Exam", "2026-11-11", {rem: 8}), T("e3", "Exam", "2026-11-12", {rem: 8}), T("p", "Project", "2026-11-13", {rem: 10})];
  const all = build(tasks), noneDone = build(tasks.map(t => Object.assign({}, t, {status: "done"})));
  const some = build(tasks.map((t, i) => i < 2 ? Object.assign({}, t, {status: "done"}) : t));
  ok(noneDone.empty, "all done");
  ok(wk(some, "2026-11-09").score < wk(all, "2026-11-09").score && wk(some, "2026-11-09").levelIdx < wk(all, "2026-11-09").levelIdx, "done tasks drop out");
  ok(!wk(some, "2026-11-09").top.some(x => x.id === "e1"), "done task not a contributor");
  const doing = build([T("x", "Assignment", "2026-10-09", {rem: 3, status: "doing"})]), todo = build([T("x", "Assignment", "2026-10-09", {rem: 3})]);
  ok(day(doing, "2026-10-09").demand < day(todo, "2026-10-09").demand, "in-progress has less stress");
}

// synced tasks: model treats them the same; moves use the start date
{
  const tasks = [T("e1", "Exam", "2026-11-10", {rem: 8}), T("e2", "Exam", "2026-11-11", {rem: 8}), T("e3", "Exam", "2026-11-12", {rem: 8}),
    T("lms", "Assignment", "2026-11-13", {title: "Research paper", rem: 10, synced: true}), T("own", "Assignment", "2026-11-14", {title: "Lab report", rem: 6})];
  const r = C.suggest({today: "2026-10-05", tasks, dailyHours: 3}, {weekStart: "2026-11-09", max: 3});
  const lms = r.moves.find(m => m.id === "lms"), own = r.moves.find(m => m.id === "own");
  ok(r.moves.length >= 1, "suggestions exist");
  if (lms) ok(lms.mode === "start" && lms.to < lms.from, "synced task moves its start date, not its due date");
  if (own) ok(own.mode === "due" && own.to < own.from, "own task moves its due date");
  ok(r.moves.every(m => m.id !== "e1" && m.id !== "e2" && m.id !== "e3"), "exams are never suggested");
}

// overdue counted today; no due date range spill
{
  const m = build([T("late", "Assignment", "2026-09-30", {rem: 4})]);
  ok(day(m, "2026-10-05").demand >= 4 && day(m, "2026-10-05").top[0].kind === "overdue", "overdue lands on today");
  ok(day(m, "2026-10-06").demand === 0, "nothing after");
  ok(build([T("late", "Assignment", "2026-09-30", {rem: 4, dead: true})]).empty, "late work that can't be turned in counts for nothing");
}

// no estimate: default hours by type, flagged
{
  const a = build([T("p", "Project", "2026-10-30", {est: false})]), b = build([T("p", "Project", "2026-10-30", {rem: 10})]);
  ok(a.noEstimate === 1 && b.noEstimate === 0, "noEstimate counted");
  ok(Math.abs(a.weeks.reduce((s, w) => s + w.demand, 0) - b.weeks.reduce((s, w) => s + w.demand, 0)) < 0.1, "default is the typical project hours");
  const c = build([T("p", "Project", "2026-10-30", {est: false, pct: 50})]);
  ok(c.weeks.reduce((s, w) => s + w.demand, 0) < a.weeks.reduce((s, w) => s + w.demand, 0), "progress reduces defaulted hours");
  const z = build([T("e", "Exam", "2026-10-30", {rem: 0})]);
  ok(z.weeks.reduce((s, w) => s + w.demand, 0) < 3, "an exam with a study plan (rem 0) only costs its exam day");
}

// a light term has no crunch
{
  const tasks = []; for (let w = 0; w < 12; w++) { tasks.push(T("a" + w, "Assignment", C.add("2026-10-08", 7 * w), {rem: 2})); if (w % 3 === 0) tasks.push(T("r" + w, "Reading", C.add("2026-10-12", 7 * w), {rem: 1})); }
  const m = build(tasks);
  ok(m.weeks.every(w => w.levelIdx <= 1), "light term never above steady: " + m.weeks.map(w => w.level).join(","));
  ok(C.nextCrunch(m, "2026-10-05") === null && C.companionPick(m, "2026-10-05") === null, "no crunch");
  ok(C.suggest({today: "2026-10-05", tasks, dailyHours: 3}, {}).moves.length === 0, "no suggestions");
}

// classes and shifts eat capacity
{
  const tasks = [T("a", "Assignment", "2026-10-09", {rem: 4})];
  const free = build(tasks), busy = build(tasks, {busy: {"2026-10-08": 9, "2026-10-09": 9, "2026-10-07": 9}});
  ok(day(busy, "2026-10-08").capacity < day(free, "2026-10-08").capacity && day(busy, "2026-10-08").ratio > day(free, "2026-10-08").ratio, "busy days have less capacity");
  ok(day(busy, "2026-10-08").capacity >= 0.89, "capacity floors at 30% of your usual time");
  const more = build(tasks, {dailyHours: 6});
  ok(day(more, "2026-10-08").ratio < day(free, "2026-10-08").ratio, "more daily hours = lower ratio");
}

// pulling forward lowers the peak, never moves the crunch elsewhere, and slots land on lighter days
{
  const tasks = [T("e1", "Exam", "2026-11-10", {rem: 8}), T("e2", "Exam", "2026-11-11", {rem: 8}), T("e3", "Exam", "2026-11-12", {rem: 7}),
    T("paper", "Assignment", "2026-11-13", {title: "Term paper", rem: 12}), T("proj", "Project", "2026-11-16", {rem: 10})];
  const inp = {today: "2026-10-05", tasks, dailyHours: 3};
  const before = C.build(inp), w0 = wk(before, "2026-11-09");
  const r = C.suggest(inp, {weekStart: "2026-11-09", max: 3});
  ok(r.moves.length >= 1, "has moves");
  ok(r.after.score < r.before.score, `suggestions lower the crunch score: ${r.before.score} -> ${r.after.score}`);
  const after = C.build(Object.assign({}, inp, {tasks: C.applyMoves(tasks, r.moves)}));
  const w1 = wk(after, "2026-11-09");
  ok(Math.abs(w1.score - r.after.score) < 1e-6 && w1.peak <= w0.peak, "verified by rebuilding with the moves: peak " + w0.peak + " -> " + w1.peak);
  ok(after.weeks.every(w => w.start === "2026-11-09" || w.score <= Math.max(wk(before, w.start).score, w0.score) + 0.002), "no other week becomes worse than the crunch week was");
  ok(after.weeks.every(w => w.start === "2026-11-09" || w.levelIdx <= Math.max(wk(before, w.start).levelIdx, 3)), "no new crunch week appears elsewhere");
  r.moves.forEach(m => { ok(m.gain > 0 && m.to < m.from, "each move is earlier and helps"); ok(m.to >= "2026-10-06" || m.mode === "start", "never into the past"); m.slots.forEach(sl => ok(sl.date >= "2026-10-05" && sl.hours >= 0.5, "slot ok")); });
  ok(w0.level === "crunch" || w0.levelIdx >= 3, "scenario starts heavy+");
  // each individual move on its own also reduces the score
  r.moves.forEach(m => { const one = C.build(Object.assign({}, inp, {tasks: C.withMove(tasks, m)})); ok(wk(one, "2026-11-09").score < w0.score, "single move helps " + m.id); });
  // blocked tasks are never suggested
  const bl = C.suggest({today: "2026-10-05", tasks: tasks.map(t => t.id === "paper" || t.id === "proj" ? Object.assign({}, t, {blocked: true}) : t), dailyHours: 3}, {weekStart: "2026-11-09"});
  ok(bl.moves.length === 0, "blocked tasks are not candidates");
  // moves that are today-or-later only
  const soon = C.suggest({today: "2026-11-09", tasks: [T("p", "Assignment", "2026-11-10", {title: "Paper", rem: 12}), T("e", "Exam", "2026-11-11", {rem: 10}), T("e2", "Exam", "2026-11-12", {rem: 10}), T("e3", "Exam", "2026-11-13", {rem: 10})], dailyHours: 3}, {weekStart: "2026-11-09"});
  ok(soon.moves.every(m => m.to >= "2026-11-09"), "can't move before today");
}

// the plan of a synced task: starting earlier really lowers the week
{
  const tasks = [T("e1", "Exam", "2026-11-10", {rem: 8}), T("e2", "Exam", "2026-11-11", {rem: 8}), T("e3", "Exam", "2026-11-12", {rem: 8}), T("lms", "Assignment", "2026-11-13", {title: "Term paper", rem: 12, synced: true})];
  const inp = {today: "2026-10-05", tasks, dailyHours: 3}, a = wk(C.build(inp), "2026-11-09");
  const moved = C.build(Object.assign({}, inp, {tasks: C.withMove(tasks, {id: "lms", mode: "start", to: "2026-10-26"})}));
  ok(wk(moved, "2026-11-09").score < a.score, "an earlier start date lowers the week");
  ok(moved.days.find(d => d.date === "2026-10-27").demand > C.build(inp).days.find(d => d.date === "2026-10-27").demand, "and adds work earlier");
}

// day grid: continuous ISO dates, Mondays first, DST and Feb 29
{
  const m = build([T("a", "Assignment", "2026-12-15", {rem: 3})], {today: "2026-10-28"});
  ok(m.start === "2026-10-26" && C.diff(m.start, m.end) === m.days.length - 1, "grid starts Monday and is continuous");
  m.days.forEach((d, i) => { ok(/^\d{4}-\d{2}-\d{2}$/.test(d.date) && d.date === C.add(m.start, i), "day " + i + " " + d.date); ok(new Date(d.date + "T12:00:00").getDay() === (i + 1) % 7, "weekday " + d.date); });
  ok(m.days.length % 7 === 0 && m.weeks.every(w => w.days.length === 7), "whole weeks");
  ok(m.days.find(d => d.date === "2026-11-01") && m.days.find(d => d.date === "2026-03-08") === undefined, "Nov 1 present (US fall back)");
  const spring = build([T("a", "Assignment", "2026-03-12", {rem: 4})], {today: "2026-03-02"});
  const ds = spring.days.map(d => d.date);
  ok(ds.includes("2026-03-08") && ds.includes("2026-03-09") && new Set(ds).size === ds.length, "spring-forward day exists exactly once");
  ok(C.diff("2026-03-07", "2026-03-09") === 2 && C.diff("2026-10-31", "2026-11-02") === 2, "day diffs across DST");
  ok(C.add("2026-03-07", 1) === "2026-03-08" && C.add("2026-03-08", 1) === "2026-03-09" && C.add("2026-10-31", 1) === "2026-11-01" && C.add("2026-11-01", 1) === "2026-11-02", "add across DST");
  // Australia/NZ DST and an early-morning due time don't change which day a task is due
  const d = day(spring, "2026-03-12"); ok(d.due.length === 1, "due on its own day");
}
{
  const m = build([T("a", "Exam", "2028-03-01", {rem: 8}), T("b", "Assignment", "2028-02-29", {rem: 3})], {today: "2028-02-21"});
  const d29 = day(m, "2028-02-29"), d28 = day(m, "2028-02-28");
  ok(d29 && d28 && C.add("2028-02-28", 1) === "2028-02-29" && C.add("2028-02-29", 1) === "2028-03-01", "Feb 29 exists in a leap year");
  ok(new Date("2028-02-29T12:00:00").getDay() === 2, "Feb 29 2028 is a Tuesday");
  ok(d29.due.some(x => x.id === "b") && day(m, "2028-03-01").due.some(x => x.id === "a"), "due items on the leap day");
  ok(C.diff("2028-02-28", "2028-03-01") === 2 && C.diff("2027-02-28", "2027-03-01") === 1, "leap day diffs");
  ok(m.days.every((d, i) => d.date === C.add(m.start, i)), "continuous through Feb 29");
}

// ranges: capped at 20 weeks; far-off tasks ignored
{
  const m = build([T("far", "Assignment", "2027-09-01", {rem: 3}), T("near", "Assignment", "2026-10-09", {rem: 3})]);
  ok(m.weeks.length <= 20 && m.days.length <= 140, "20 week cap");
  ok(m.weeks.length >= 6, "at least six weeks shown");
}
// a start date in the past is just the creation default and changes nothing; a future one narrows the window
{
  const a = build([T("p", "Assignment", "2026-10-30", {title: "Essay", rem: 8})]), b = build([T("p", "Assignment", "2026-10-30", {title: "Essay", rem: 8, start: "2026-10-01"})]);
  ok(JSON.stringify(a.days.map(d => d.demand)) === JSON.stringify(b.days.map(d => d.demand)), "past start ignored");
  const c = build([T("p", "Assignment", "2026-10-30", {title: "Essay", rem: 8, start: "2026-10-28"})]);
  ok(day(c, "2026-10-28").demand > day(a, "2026-10-28").demand, "a late planned start squeezes the work");
}
// phrases and a single task's best move
{
  ok(C.phrase({exam: 3, paper: 1}) === "3 exams and a paper" && C.phrase({exam: 1}) === "an exam" && C.phrase({quiz: 2, assignment: 1, exam: 1}) === "an exam, 2 quizzes and an assignment" && C.phrase({}) === "", "phrase");
  ok(C.describe({exam: 3, paper: 1}) === "3 exams + 1 paper", "describe");
  const tasks = [T("e1", "Exam", "2026-11-10", {rem: 8}), T("e2", "Exam", "2026-11-11", {rem: 8}), T("e3", "Exam", "2026-11-12", {rem: 8}), T("paper", "Assignment", "2026-11-13", {title: "Term paper", rem: 12})];
  const inp = {today: "2026-10-05", tasks, dailyHours: 3};
  const m = C.moveFor(inp, "2026-11-09", "paper");
  ok(m && m.id === "paper" && m.to < m.from && m.gain > 0 && m.slots.length > 0, "moveFor paper");
  ok(C.moveFor(inp, "2026-11-09", "e1") === null && C.moveFor(inp, "2026-11-09", "nope") === null, "exam / unknown not movable");
  ok(C.moveFor({today: "2026-10-05", tasks: [T("x", "Assignment", "2026-10-09", {rem: 2})], dailyHours: 3}, "2026-10-05", "x") === null, "a calm week has nothing worth moving");
}
console.log(`crunch tests ok (${n} checks)`);
