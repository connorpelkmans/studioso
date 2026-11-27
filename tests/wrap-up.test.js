// Unit tests for Wrap Up Today (src/js/01-wrap-up.js): when the row shows, the moves (Tomorrow / Pick a Day / Let It Go, the first
// task), laying tomorrow's blocks, and the first task's hold on Do This Next. Run: node tests/wrap-up.test.js
const assert = require("assert");
const s = require("../scripts/app-files").source();
let n = 0; const ok = (c, m) => { n++; assert(c, m); }, eq = (a, b, m) => { n++; assert.deepStrictEqual(a, b, m); };
const a = s.indexOf("/*WRAPUP-START*/"), b = s.indexOf("/*WRAPUP-END*/");
assert(a > 0 && b > a, "markers missing");
const W = new Function(s.slice(a, b) + ";return WRAPUP;")();
const A = new Function(s.slice(s.indexOf("/* AVAIL-START"), s.indexOf("/* AVAIL-END */")) + ";return AVAIL;")();
const DAY = "2026-11-24", NEXT = "2026-11-25";

// When the row shows. Study day 7:00 AM to 11:00 PM (420..1380)
{
  const sd = (now, o) => Object.assign({date: DAY, start: 420, end: 1380, now, night: now < 420, past: now >= 1380 || now < 420, left: Math.max(0, 1380 - Math.max(now, 420))}, o || {});
  const base = {on: true, off: false, wrapped: "", planLeft: 2, did: true, open: true};
  const st = (now, o) => W.rowState(Object.assign({}, base, {sd: sd(now)}, o || {}));
  eq(st(14 * 60), "", "mid-afternoon with work planned: nothing");
  eq(st(21 * 60 + 59), "", "just over an hour before the end: nothing");
  eq(st(22 * 60), "open", "the last hour of the study day: the row");
  eq(st(22 * 60 + 45), "open", "late in the last hour: the row");
  eq(st(23 * 60 + 30), "open", "after the study day ended, same evening: still the row");
  eq(st(6 * 60), "", "early morning before the day starts: nothing");
  eq(st(14 * 60, {planLeft: 0}), "open", "the plan is all done (and something got done): the row");
  eq(st(14 * 60, {planLeft: 0, did: false}), "", "nothing planned and nothing done: no row before the last hour");
  eq(st(22 * 60, {off: true}), "", "not on a day off");
  eq(st(14 * 60, {off: true, planLeft: 0}), "", "not on a day off, even with the plan done");
  eq(st(22 * 60, {on: false}), "", "the setting off: nothing");
  eq(st(22 * 60, {wrapped: DAY}), "done", "after wrapping up: the quiet done line");
  eq(st(9 * 60, {wrapped: DAY}), "done", "it stays for the rest of the day");
  eq(st(22 * 60, {wrapped: "2026-11-23"}), "open", "yesterday's wrap-up doesn't count today");
  eq(st(22 * 60, {wrapped: DAY, off: true}), "", "a day off shows nothing at all");
  eq(st(22 * 60, {open: false, did: false}), "", "an empty planner: nothing");
  eq(st(22 * 60, {open: false, did: true, planLeft: 0}), "open", "everything done: the row, to close the day");
  // a study day ending after midnight: 12:30 AM still belongs to the evening's day
  eq(W.rowState(Object.assign({}, base, {sd: {date: DAY, start: 480, end: 1500, now: 1470, night: false, past: false, left: 30}})), "open", "a late end of day: just after midnight is still its last hour");
  eq(W.rowState(Object.assign({}, base, {sd: null})), "", "no study day: nothing");
}

// The moves
{
  const t = {id: "t1", title: "Lab", status: "todo", start: "2026-11-20", due: "2026-11-28", pins: [{date: DAY, s: 900, e: 960}, {date: "2026-11-26", s: 600, e: 660}]};
  const c = o => Object.assign({kind: "", first: false, date: DAY, nd: NEXT, day: "", slot: null}, o);
  const go = W.moveTask(t, c({kind: "go"}));
  eq(go.pins, [{date: DAY, s: 0, e: 0}, {date: "2026-11-26", s: 600, e: 660}], "Let It Go: today's time goes, other days' pins stay");
  eq([go.title, go.status, go.start, go.due], ["Lab", "todo", "2026-11-20", "2026-11-28"], "Let It Go changes nothing else about the task");
  ok(t.pins.length === 2 && t.pins[0].s === 900, "the task passed in isn't changed");
  const tm = W.moveTask(t, c({kind: "tomorrow", slot: {date: NEXT, s: 420, e: 480}}));
  eq(tm.pins, [{date: DAY, s: 0, e: 0}, {date: NEXT, s: 420, e: 480}, {date: "2026-11-26", s: 600, e: 660}], "Tomorrow: nothing today, a block tomorrow");
  eq(tm.start, "2026-11-20", "Tomorrow doesn't change the start");
  eq(W.moveTask(t, c({kind: "tomorrow"})).pins, [{date: DAY, s: 0, e: 0}, {date: "2026-11-26", s: 600, e: 660}], "Tomorrow with no free time tomorrow: just nothing today");
  const tm2 = W.moveTask(Object.assign({}, t, {pins: [{date: NEXT, s: 0, e: 0}, {date: NEXT, s: 430, e: 470}]}), c({kind: "tomorrow", slot: {date: NEXT, s: 420, e: 480}}));
  eq(tm2.pins, [{date: DAY, s: 0, e: 0}, {date: NEXT, s: 420, e: 480}], "an old 'not tomorrow' pin and an overlapping one give way to the new block");
  const pd = W.moveTask(t, c({kind: "day", day: "2026-11-26", slot: {date: "2026-11-26", s: 420, e: 480}}));
  eq(pd.start, "2026-11-26", "Pick a Day: it starts that day");
  eq(pd.pins, [{date: DAY, s: 0, e: 0}, {date: "2026-11-26", s: 420, e: 480}, {date: "2026-11-26", s: 600, e: 660}], "Pick a Day: a block that day (a pin at another time that day stays)");
  ok(pd.pins.some(p => p.date === "2026-11-26" && p.s === 420), "Pick a Day: the new block is there");
  eq(W.moveTask(t, c({kind: "day", day: "2026-11-30"})).start, "2026-11-20", "a day after the due date doesn't move the start");
  eq(W.moveTask(Object.assign({}, t, {start: "2026-11-27"}), c({kind: "day", day: "2026-11-26"})).start, "2026-11-27", "a start already later is kept");
  eq(W.moveTask(Object.assign({}, t, {due: ""}), c({kind: "day", day: "2026-12-02"})).start, "2026-12-02", "no due date: any day");
  const ex = W.moveTask(Object.assign({}, t, {type: "Exam"}), c({kind: "day", day: "2026-11-26", slot: {date: "2026-11-26", s: 420, e: 480}}));
  ok(ex.start === "2026-11-20" && ex.pins.some(p => p.date === "2026-11-26" && p.s === 420), "an exam's study time can go to another day, but the exam's start stays");
  const nothing = W.moveTask(t, c({}));
  eq(nothing.pins, t.pins, "no choice: nothing changes");
  ok(!("firstOn" in nothing), "no choice: no first mark");
  // the first task tomorrow
  const f = W.moveTask(t, c({first: true, slot: {date: NEXT, s: 420, e: 450}}));
  eq(f.firstOn, NEXT, "first tomorrow: marked for tomorrow");
  eq(f.pins, [{date: DAY, s: 0, e: 0}, {date: NEXT, s: 420, e: 450}, {date: "2026-11-26", s: 600, e: 660}], "first tomorrow: a block at the start of tomorrow");
  const fd = W.moveTask(t, c({first: true, kind: "day", day: "2026-11-27", slot: {date: NEXT, s: 420, e: 450}}));
  ok(fd.firstOn === NEXT && fd.start === "2026-11-20" && fd.pins.some(p => p.date === NEXT && p.s === 420), "first tomorrow wins over Pick a Day");
  const fg = W.moveTask(t, c({first: true, kind: "go", slot: {date: NEXT, s: 420, e: 450}}));
  ok(fg.firstOn === NEXT && fg.pins.some(p => p.date === DAY && p.e === 0) && !fg.pins.some(p => p.date === NEXT), "first tomorrow with Let It Go: marked, today cleared, no block pinned");
  eq(W.movePins(null, "go", DAY, null), [{date: DAY, s: 0, e: 0}], "no pins before: one pin");
}

// Tomorrow's blocks, one after another from the start of the free time, around a class
{
  const cfg = A.normCfg({dayStart: "07:00", dayEnd: "23:00", breakMin: 10});
  const r = A.freeWindows(NEXT, {blocks: [], cfg, ext: [{start: "08:00", end: "09:30", title: "BIOL 1200"}], nowMin: null});
  const busy = r.busy.map(m => ({s: m.s, e: m.e}));
  const lay = W.layDay([{id: "first", len: 30}, {id: "b", len: 45}, {id: "c", len: 60}], busy, r.ws, r.we, 10, A.snap);
  eq(lay.first, {s: 420, e: 450}, "the first task at the start of the day");
  ok(lay.b.s >= 460 && lay.b.e <= 480 || lay.b.s >= 570, "the next one after a break, not in the class: " + JSON.stringify(lay.b));
  ok(lay.c.s >= lay.b.e + 10 && !(lay.c.s < 570 && lay.c.e > 480), "the third after it, not in the class: " + JSON.stringify(lay.c));
  ok(Object.values(lay).every((x, i, l) => l.every((y, j) => i === j || x.e + 10 <= y.s || y.e + 10 <= x.s)), "no two blocks touch");
  eq(W.layDay([{id: "x", len: 60}], [{s: 420, e: 1380}], 420, 1380, 10, A.snap), {}, "a full day: no block");
  eq([W.blockLen(0, 0), W.blockLen(47, 3), W.blockLen(200, 0), W.blockLen(0, 0.25), W.blockLen(0, 5)], [30, 45, 60, 15, 60], "block lengths: today's time, else the work left, 15 minutes to an hour");
  eq(W.dayRange(NEXT, "2026-11-30"), {min: NEXT, max: "2026-11-30"}, "Pick a Day: from tomorrow to the due date");
  eq(W.dayRange(NEXT, "2026-11-24"), {min: NEXT, max: ""}, "a due date already passed: no upper limit");
  eq(W.dayRange(NEXT, ""), {min: NEXT, max: ""}, "no due date: no upper limit");
}

// The first task's hold on Do This Next: its day only, until a focus session on it
{
  const from = new Date(2026, 10, 25).getTime();
  const h = {id: "t5", status: "todo", firstOn: NEXT, history: [{at: from - 3600e3, text: "Focus session: 25m"}]};
  ok(W.isFirst(h, NEXT, from), "first on its day (yesterday's session doesn't count)");
  ok(!W.isFirst(h, DAY, from - 864e5), "not the day before");
  ok(!W.isFirst(h, "2026-11-26", from + 864e5), "not the day after");
  ok(!W.isFirst(Object.assign({}, h, {history: h.history.concat([{at: from + 9 * 3600e3, text: "Focus session: 25m"}])}), NEXT, from), "a focus session on it that day lets the plan choose again");
  ok(W.isFirst(Object.assign({}, h, {history: [{at: from + 9 * 3600e3, text: "Status: To Do → Doing"}]}), NEXT, from), "other history lines don't");
  ok(!W.isFirst(Object.assign({}, h, {status: "done"}), NEXT, from), "not once it's done");
  ok(!W.isFirst(null, NEXT, from), "no task");
}

// What got done today
{
  const from = new Date(2026, 10, 24).getTime(), to = from + 22 * 3600e3;
  const L = [{id: "a", status: "done", doneAt: from + 3600e3}, {id: "b", status: "done", doneAt: from - 60e3}, {id: "c", status: "todo", doneAt: from + 3600e3}, {id: "d", status: "done", doneAt: to + 60e3}, {id: "e", status: "done"}, null];
  eq(W.doneBetween(L, from, to).map(t => t.id), ["a"], "only tasks finished today, up to now");
}
console.log(`wrap-up.test: ${n} checks passed`);
