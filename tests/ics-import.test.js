// node tests/ics-import.test.js  Calendar file (.ics) import: repeat rules, missing UIDs, Windows and Mozilla zone names
const assert = require("assert"), cp = require("child_process");
// Runs in a fixed zone so the expected local dates are known
if (process.env.TZ !== "America/Los_Angeles") {
  const r = cp.spawnSync(process.execPath, [__filename], {env: Object.assign({}, process.env, {TZ: "America/Los_Angeles"}), stdio: "inherit"});
  process.exit(r.status);
}
const src = require("../scripts/app-files").source();
const between = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i); assert(i > 0 && j > i, "marker missing: " + a); return src.slice(i, j); };
class FakeDate extends Date { constructor(...a) { if (!a.length) super(FakeDate.at); else super(...a); } static now() { return FakeDate.at; } }
FakeDate.at = new Date(2026, 8, 1, 10, 0).getTime(); // Tue 2026-09-01
const APP = new Function("Date", between("/* ---------- Dates ---------- */", "/* ---------- State ---------- */") + "; return {iso, pad, parse, todayISO, dayDiff, addDays, isDate, mondayOf};")(FakeDate);
const code = between("/* Import from Apple Calendar or any .ics file */", "// Which calendar a file is");
const pad = n => String(n).padStart(2, "0");
const ICS = new Function("Date", "window", "SBTZ", "iso", "pad", "parse", "todayISO", "dayDiff", "addDays", "isDate", "mondayOf", "uid", "scrubText", "coursesArr",
  `const minToT = m => pad(Math.floor(m / 60)) + ":" + pad(m % 60); const tToMin = t => { const [h, m] = String(t || "0:0").split(":").map(Number); return h * 60 + (m || 0); };
   const wkDiff = (a, b) => Math.round((parse(mondayOf(a)) - parse(mondayOf(b))) / 6048e5);
   ${code}; return {icsPlan, icsZone, icsWhen};`)(FakeDate, {}, null, APP.iso, pad, APP.parse, APP.todayISO, APP.dayDiff, APP.addDays, APP.isDate, APP.mondayOf, () => "rnd" + Math.random(), s => s, () => []);
const cal = (...ev) => ["BEGIN:VCALENDAR", "VERSION:2.0", ...ev.flatMap(e => ["BEGIN:VEVENT", ...e, "END:VEVENT"]), "END:VCALENDAR"].join("\r\n");
const one = (...lines) => ICS.icsPlan(cal(lines)).items[0];
let n = 0; const t = (name, fn) => { fn(); n++; console.log("ok -", name); };

t("weekly BYDAY moves with the start when the zone change moves its day (T6)", () => {
  // Tuesday 03:00 UTC is Monday 8 PM in Los Angeles
  const e = one("UID:a1", "SUMMARY:Night class", "DTSTART:20260908T030000Z", "DTEND:20260908T041500Z", "RRULE:FREQ=WEEKLY;BYDAY=TU,TH");
  assert.strictEqual(e.date, "2026-09-07"); assert.strictEqual(e.start, "20:00"); assert.deepStrictEqual(e.repeat.days.sort(), [1, 3], "Mon and Wed here");
  const same = one("UID:a2", "SUMMARY:Lecture", "DTSTART;TZID=America/Los_Angeles:20260908T100000", "DTEND;TZID=America/Los_Angeles:20260908T110000", "RRULE:FREQ=WEEKLY;BYDAY=TU,TH");
  assert.deepStrictEqual(same.repeat.days.sort(), [2, 4], "no shift when the day doesn't move");
  const sun = one("UID:a3", "SUMMARY:Sat class", "DTSTART:20260906T030000Z", "DTEND:20260906T040000Z", "RRULE:FREQ=WEEKLY;BYDAY=SU");
  assert.deepStrictEqual(sun.repeat.days, [6], "Sunday UTC wraps back to Saturday");
});
t("daily rules keep their interval and weekdays (T7)", () => {
  const wk = one("UID:b1", "SUMMARY:Standup", "DTSTART;TZID=America/Los_Angeles:20260901T090000", "DTEND;TZID=America/Los_Angeles:20260901T091500", "RRULE:FREQ=DAILY;BYDAY=MO,TU,WE,TH,FR");
  assert.deepStrictEqual(wk.repeat.days.sort(), [1, 2, 3, 4, 5], "weekdays only"); assert.strictEqual(wk.repeat.every, 1);
  const all = one("UID:b2", "SUMMARY:Run", "DTSTART;TZID=America/Los_Angeles:20260901T070000", "DTEND;TZID=America/Los_Angeles:20260901T073000", "RRULE:FREQ=DAILY");
  assert.strictEqual(all.repeat.days.length, 7);
  const two = one("UID:b3", "SUMMARY:Gym", "DTSTART;TZID=America/Los_Angeles:20260825T070000", "DTEND;TZID=America/Los_Angeles:20260825T080000", "RRULE:FREQ=DAILY;INTERVAL=2");
  assert.strictEqual(two.repeat, null, "every 2 days is not made daily"); assert.strictEqual(two.date, "2026-09-02", "the next one on or after today"); assert.match(two.notes, /every 2 days/);
  const fort = one("UID:b4", "SUMMARY:Club", "DTSTART;TZID=America/Los_Angeles:20260901T180000", "DTEND;TZID=America/Los_Angeles:20260901T190000", "RRULE:FREQ=DAILY;INTERVAL=14");
  assert.deepStrictEqual(fort.repeat.days, [2]); assert.strictEqual(fort.repeat.every, 2, "every 14 days is every 2 weeks");
  const three = one("UID:b5", "SUMMARY:Seminar", "DTSTART;TZID=America/Los_Angeles:20260901T180000", "DTEND;TZID=America/Los_Angeles:20260901T190000", "RRULE:FREQ=WEEKLY;INTERVAL=3;BYDAY=TU");
  assert.strictEqual(three.repeat.every, 3);
});
t("yearly multi-day events keep their length (T7)", () => {
  const y = one("UID:c1", "SUMMARY:Reading week", "DTSTART;VALUE=DATE:20241014", "DTEND;VALUE=DATE:20241019", "RRULE:FREQ=YEARLY");
  assert.strictEqual(y.date, "2026-10-14"); assert.strictEqual(y.endDate, "2026-10-18"); assert.ok(y.endDate >= y.date);
});
t("events without a UID get the same id on every import (I7)", () => {
  const f = cal(["SUMMARY:Office hours", "DTSTART;TZID=America/Los_Angeles:20260902T140000", "DTEND;TZID=America/Los_Angeles:20260902T150000", "RRULE:FREQ=WEEKLY;BYDAY=WE"], ["SUMMARY:Tutorial", "DTSTART;TZID=America/Los_Angeles:20260903T140000", "DTEND;TZID=America/Los_Angeles:20260903T150000"]);
  const a = ICS.icsPlan(f).items, b = ICS.icsPlan(f).items;
  assert.strictEqual(a[0].uid, b[0].uid); assert.strictEqual(a[1].uid, b[1].uid); assert.notStrictEqual(a[0].uid, a[1].uid);
  assert.strictEqual(one("UID:keep-me", "SUMMARY:X", "DTSTART:20260902T140000Z").uid, "keep-me");
});
t("Windows and Mozilla zone names (I9)", () => {
  assert.strictEqual(ICS.icsZone("Eastern Standard Time"), "America/New_York"); assert.strictEqual(ICS.icsZone("W. Europe Standard Time"), "Europe/Berlin");
  assert.strictEqual(ICS.icsZone("/mozilla.org/20050126_1/America/New_York"), "America/New_York"); assert.strictEqual(ICS.icsZone("/Europe/London"), "Europe/London");
  assert.strictEqual(ICS.icsZone("America/Argentina/Buenos_Aires"), "America/Argentina/Buenos_Aires");
  // 9 AM in New York is 6 AM here, whatever this device's zone
  const e = one("UID:d1", "SUMMARY:Meeting", "DTSTART;TZID=Eastern Standard Time:20260910T090000", "DTEND;TZID=Eastern Standard Time:20260910T100000");
  assert.strictEqual(e.start, "06:00"); assert.strictEqual(e.end, "07:00");
  const m = one("UID:d2", "SUMMARY:Meeting", "DTSTART;TZID=/mozilla.org/20050126_1/Europe/London:20260910T170000", "DTEND;TZID=/mozilla.org/20050126_1/Europe/London:20260910T180000");
  assert.strictEqual(m.start, "09:00");
  // every Windows name in the table is a zone this runtime knows
  const tbl = between("const ICS_WIN_TZ = ", "function icsZone"), names = [...tbl.matchAll(/": "([^"]+)"/g)].map(x => x[1]);
  assert.ok(names.length > 60); names.forEach(z => new Intl.DateTimeFormat("en-US", {timeZone: z}));
});
console.log(n + " ics import tests passed");
