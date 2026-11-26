// Unit tests for the Time Cushion maths (CUSH, between /*CUSH-START*/ and /*CUSH-END*/ in src/js/92-cushion.js), fed the way
// Today's Plan feeds it: the planner's own capacityUntil() gives the study time until each deadline.  Run: node tests/cushion.test.js
const assert = require("assert");
const s = require("../scripts/app-files").source();
const code = s.slice(s.indexOf("/*CUSH-START*/"), s.indexOf("/*CUSH-END*/"));
assert(code.length > 500, "CUSH block found");
const C = new Function(code + ";return CUSH;")();
// the planner's capacity function, with day numbers standing in for dates
const capSrc = s.slice(s.indexOf("function dueDayFrac(t)"), s.indexOf("// Late work: your penalty per day"));
assert(/function capacityUntil/.test(capSrc), "capacityUntil found");
const capacityUntil = new Function("dayDiff", "MILESTONE", "dueDate", capSrc + ";return capacityUntil;")((a, b) => b - a, ty => ty === "Exam" || ty === "Quiz", () => new Date());
let n = 0; const ok = (c, m) => { n++; assert(c, m); };

/* A student's next days, built like computeFocusNow: day[0] is today's time, a day off has none, cum[i] is the time before day i.
   tasks: [{id, dl, R, type?}] (dl = days until due). Returns the cushion. */
function plan({dh = 3, th = dh, off = [], tasks = [], overdue = 0, roomToday = 0}){
  const horizon = 20, day = [off.includes(0) ? 0 : th], cum = [0];
  for (let i = 1; i <= horizon; i++) day.push(off.includes(i) ? 0 : dh);
  for (let i = 1; i <= horizon; i++) cum.push(cum[i - 1] + day[i - 1]);
  let L = overdue;
  const rows = tasks.slice().sort((a, b) => a.dl - b.dl).map(t => {
    L += t.R;
    const tt = {type: t.type || "Assignment", due: t.dl, time: ""};
    return {id: t.id, title: t.title || t.id, due: "2026-12-" + String(10 + t.dl).padStart(2, "0"), dl: t.dl, R: t.R, L, A: capacityUntil(tt, 0, dh, day[0], cum, day, null, null), noEst: !!t.noEst};
  });
  const offDays = off.map(i => ({date: "2026-12-" + String(10 + i).padStart(2, "0"), i, h: dh}));
  return C.calc({rows, overdue, roomToday: off.includes(0) ? 0 : roomToday, offDays});
}

// spare: 2h due in 2 days with 3h a day: 3 + 3 + 3 * 0.75 = 8h 15m of time, 6h 15m to spare
{
  const c = plan({tasks: [{id: "a", dl: 2, R: 2}]});
  ok(c.state === "spare" && c.mins === 375, "spare: " + c.state + " " + c.mins);
  ok(c.by === "2026-12-12" && c.groups.length === 1 && c.groups[0].needM === 120 && c.groups[0].haveM === 495, "the row has the work and the time");
  ok(c.fixes.length === 0, "nothing to fix when there's room");
}
// the tightest point is the smallest cushion, not the nearest deadline
{
  const c = plan({tasks: [{id: "a", dl: 1, R: 1}, {id: "b", dl: 4, R: 12}, {id: "c", dl: 9, R: 2}]});
  ok(c.groups[c.tight].ids[0] === "b" && c.by === "2026-12-14", "tightest is b: " + JSON.stringify(c.groups.map(g => g.mins)));
  ok(c.groups.every(g => g.haveM - g.needM === g.mins), "time minus work is the cushion on every row");
}
// tight: under 30 minutes spare. 3 + 3 + 2.25 = 8h 15m of time against 8h of work
{
  const c = plan({tasks: [{id: "a", dl: 2, R: 8}], roomToday: 2});
  ok(c.state === "tight" && c.mins === 15, "tight: " + c.state + " " + c.mins);
  ok(c.fixes[0] && c.fixes[0].kind === "today" && c.fixes[0].mins === 30, "tight: add 30m today " + JSON.stringify(c.fixes));
}
// short: more work than time
{
  const c = plan({tasks: [{id: "a", dl: 1, R: 2}, {id: "big", dl: 3, R: 10.5}], roomToday: 4});
  ok(c.state === "short" && c.mins === -75, "short: " + c.state + " " + c.mins);
  ok(c.fixes[0].kind === "today" && c.fixes[0].mins === 90 && c.fixes[0].all, "short: add enough today (rounded up to half hours) " + JSON.stringify(c.fixes[0]));
  ok(c.fixes[1] && c.fixes[1].kind === "earlier" && c.fixes[1].id === "big", "short: start the big task earlier " + JSON.stringify(c.fixes[1]));
  const late = plan({tasks: [{id: "a", dl: 1, R: 2}, {id: "big", dl: 3, R: 10.5}], roomToday: 0.5});
  ok(late.fixes[0].kind === "today" && late.fixes[0].mins === 30 && !late.fixes[0].all, "late in the day: only what today has room for " + JSON.stringify(late.fixes));
  const none = plan({tasks: [{id: "a", dl: 1, R: 2}, {id: "big", dl: 3, R: 10.5}]});
  ok(none.fixes.length === 1 && none.fixes[0].kind === "earlier", "no room today: no add-time fix " + JSON.stringify(none.fixes));
}
// work that is overdue counts against every deadline after it
{
  const c = plan({tasks: [{id: "a", dl: 2, R: 2}], overdue: 6});
  ok(c.state === "tight" && c.mins === 15 && c.overdueM === 360, "overdue work eats the cushion: " + c.mins);
}
// no work: nothing due in the next 14 days, or nothing left to do
{
  ok(plan({tasks: []}).state === "none", "no tasks: none");
  ok(plan({tasks: [{id: "far", dl: 20, R: 30}]}).state === "none", "only work due after 14 days: none");
  ok(plan({tasks: [{id: "done", dl: 3, R: 0}]}).state === "none", "nothing left to do: none");
  const c = C.calc({}); ok(c.state === "none" && c.mins === 0 && c.by === "" && c.fixes.length === 0, "empty input: none");
}
// a day off: no study time that day, so the same work goes from spare to short, and studying that day is a fix
{
  const tasks = [{id: "a", dl: 3, R: 8}];
  const on = plan({tasks}), off = plan({tasks, off: [1, 2]});
  ok(on.state === "spare" && on.mins === 195, "without days off: spare " + on.mins);
  ok(off.state === "short" && off.mins === -165, "two days off before it: short " + off.mins);
  ok(off.fixes.some(f => f.kind === "dayoff" && f.date === "2026-12-11" && f.mins === 180), "fix: study on the first day off " + JSON.stringify(off.fixes));
  const today = plan({tasks: [{id: "a", dl: 2, R: 6}], off: [0], roomToday: 3});
  ok(today.state === "short" && !today.fixes.some(f => f.kind === "today"), "today off: no add-today fix " + JSON.stringify(today));
  ok(today.fixes.some(f => f.kind === "dayoff" && f.date === "2026-12-10"), "today off: studying today is offered " + JSON.stringify(today.fixes));
  const after = plan({tasks: [{id: "a", dl: 2, R: 9}], off: [5]});
  ok(!after.fixes.some(f => f.kind === "dayoff"), "a day off after the deadline doesn't help");
}
// several things due the same day: one row, at its tightest
{
  const c = plan({tasks: [{id: "a", dl: 2, R: 1, title: "Essay"}, {id: "b", dl: 2, R: 2, title: "Lab"}]});
  ok(c.groups.length === 1 && c.groups[0].ids.length === 2 && c.groups[0].needM === 180, "one row for the day, all its work: " + JSON.stringify(c.groups));
}
// tasks without an estimate are counted (with the planner's default) and named
{
  const c = plan({tasks: [{id: "a", dl: 2, R: 1, noEst: true}, {id: "b", dl: 5, R: 2, noEst: true}, {id: "c", dl: 6, R: 1}]});
  ok(c.noEst === 2, "two without an estimate");
}
// whole minutes, in steps of 5
{
  const c = plan({tasks: [{id: "a", dl: 1, R: 1.37}]});
  ok(Number.isInteger(c.mins) && c.mins % 5 === 0, "minutes are whole and in 5s: " + c.mins);
}
console.log(`cushion.test: ${n} checks passed`);
