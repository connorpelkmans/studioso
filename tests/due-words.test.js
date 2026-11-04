// node tests/due-words.test.js  "Due tomorrow" badges come from calendar days (T3); class times with no AM/PM (T11)
const assert = require("assert"), cp = require("child_process");
if (process.env.TZ !== "America/New_York") {
  const r = cp.spawnSync(process.execPath, [__filename], {env: Object.assign({}, process.env, {TZ: "America/New_York"}), stdio: "inherit"});
  process.exit(r.status);
}
const src = require("../scripts/app-files").source();
const between = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i); assert(i > 0 && j > i, "marker missing: " + a); return src.slice(i, j); };
class FakeDate extends Date { constructor(...a) { if (!a.length) super(FakeDate.at); else super(...a); } static now() { return FakeDate.at; } }
const at = (y, m, d, h = 0, mi = 0) => { FakeDate.at = new Date(y, m - 1, d, h, mi).getTime(); };
at(2026, 11, 4, 10);
const APP = new Function("Date", between("/* ---------- Dates ---------- */", "/* ---------- State ---------- */") + "; return {iso, parse, todayISO, dayDiff, addDays};")(FakeDate);
const soonBadge = new Function("Date", "parse", "todayISO", "dayDiff", between("function dueDate(", "const blockers =") + "; return soonBadge;")(FakeDate, APP.parse, APP.todayISO, APP.dayDiff);
const parseTimeRange = new Function("pad", between("function parseTimeRange(", "function parseMeetings(") + "; return parseTimeRange;")(n => String(n).padStart(2, "0"));
let n = 0; const t = (name, fn) => { fn(); n++; console.log("ok -", name); };
const word = (due, time) => (soonBadge({status: "todo", due, time: time || ""}).match(/>([^<]*)</) || [])[1] || "";

t("badge words follow calendar days (T3)", () => {
  at(2026, 11, 4, 10); // Wednesday 10:00
  assert.strictEqual(word("2026-11-06", "09:00"), "Due Friday", "47 hours away on Friday is not tomorrow");
  assert.strictEqual(word("2026-11-05", "17:00"), "Due tomorrow");
  assert.strictEqual(word("2026-11-05", "08:00"), "Due in 22h");
  assert.strictEqual(word("2026-11-05"), "Due tomorrow");
  assert.strictEqual(word("2026-11-04", "15:00"), "Due in 5h"); assert.strictEqual(word("2026-11-04"), "Due today");
  assert.strictEqual(word("2026-11-07", "09:00"), "", "more than 48 hours away has no badge");
  assert.strictEqual(word("2026-11-03"), "Late");
  at(2026, 11, 4, 23, 30);
  assert.strictEqual(word("2026-11-06", "09:00"), "Due Friday", "late Wednesday, Friday morning is still Friday");
  assert.strictEqual(word("2026-11-05", "22:00"), "Due in 23h");
});
t("class times without AM or PM (T11)", () => {
  assert.deepStrictEqual(parseTimeRange("T 7-8:15"), {start: "19:00", end: "20:15"}, "an evening class is not dropped");
  assert.deepStrictEqual(parseTimeRange("MW 7:30-8:45"), {start: "19:30", end: "20:45"});
  assert.deepStrictEqual(parseTimeRange("MWF 9-9:50"), {start: "09:00", end: "09:50"});
  assert.deepStrictEqual(parseTimeRange("TTh 2-3:15"), {start: "14:00", end: "15:15"});
  assert.deepStrictEqual(parseTimeRange("M 11-12:15"), {start: "11:00", end: "12:15"});
  assert.deepStrictEqual(parseTimeRange("T 7-8:15 am"), {start: "07:00", end: "08:15"});
  assert.deepStrictEqual(parseTimeRange("W 6:30-9:20 pm"), {start: "18:30", end: "21:20"});
});
console.log(n + " due-words tests passed");
