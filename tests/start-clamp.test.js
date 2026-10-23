// Unit test: a task's start (startOf in 01-helpers.js) never reaches back past a year before its due date, so a missing or broken
// created time (created: 1 is 1970) can't spread its hours over 56 years of days
const assert = require("assert");
const s = require("../scripts/app-files").source();
const grab = (from, to) => { const i = s.indexOf(from); assert(i >= 0, "found " + from); return s.slice(i, s.indexOf(to, i)); };
const code = grab("const START_SPAN_DAYS", "function progress(") + grab("function workloadByDay(", "function weekHours(");
const pad = n => String(n).padStart(2, "0");
const iso = d => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
const parse = x => { const [y, m, d] = x.split("-").map(Number); return new Date(y, m - 1, d); };
const addDays = (x, k) => { const d = parse(x); d.setDate(d.getDate() + k); return iso(d); };
const dayDiff = (a, b) => Math.round((parse(b) - parse(a)) / 864e5);
const H = new Function("MILESTONE", "iso", "addDays", "dayDiff", "isNum", "bdHasKids", code + ";return {startOf, workloadByDay};")(t => t === "Exam", iso, addDays, dayDiff, v => v !== null && v !== "" && isFinite(Number(v)), () => false);
let n = 0; const ok = (c, m) => { n++; assert(c, m); };
const T = o => Object.assign({id: "a", type: "Assignment", status: "todo", hours: 10, due: "2026-11-10", start: ""}, o);
ok(H.startOf(T({created: 1})) === "2026-11-10", "created: 1 is ignored (no start, so the task starts on its due date)");
ok(H.startOf(T({created: Date.UTC(2026, 9, 20, 12)})) === "2026-10-20", "a real created time is still used");
ok(H.startOf(T({start: "1970-01-01"})) === "2025-11-10", "an ancient start is clamped to a year before the due date");
ok(H.startOf(T({start: "2026-11-01"})) === "2026-11-01", "a normal start is kept");
ok(H.startOf(T({start: "2026-12-01"})) === "2026-11-10", "a start after the due date is the due date");
ok(H.startOf(T({type: "Exam", start: "1970-01-01"})) === "2026-11-10", "an exam starts on its date");
ok(H.startOf(T({due: "", created: 1})) === "", "no due date and a broken created time: no start");
const per = H.workloadByDay([T({start: "1970-01-01", hours: 365}), T({id: "b", created: 1, hours: 2})]);
ok(Object.keys(per).length <= 366 && Object.keys(per).every(k => k >= "2025-11-10"), "workload is spread over at most a year: " + Object.keys(per).length + " days");
console.log(`start-clamp: ${n} checks passed`);
