// Unit tests for school days: days off and a rotating class cycle (SBSCHOOL, inside the calendar core so the live feed agrees).  Run: node tests/school-days.test.js
const assert = require("assert");
const src = require("../scripts/app-files").source();
const between = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i); assert(i > 0 && j > i, "marker missing: " + a); return src.slice(i, j); };
const core = between("// ==== STUDYBOARD ICS CORE START ====", "// ==== STUDYBOARD ICS CORE END ====");
const {S, ICS} = new Function(core + "; return {S: SBSCHOOL, ICS: SBICS};")();
let n = 0; const ok = (c, m) => { n++; assert(c, m); };

// Nothing set up: weekly classes as before, no cycle
{
  ok(S.dayOf(undefined, "2026-10-05") === 0 && S.dayOf({}, "2026-10-05") === 0, "no cycle: day 0");
  ok(S.meets({}, {days: [1]}, "2026-10-05") && !S.meets({}, {days: [2]}, "2026-10-05"), "weekly class times meet on their weekdays");
  ok(!S.meets({}, {cyc: [1]}, "2026-10-05"), "a rotating class time with no cycle set up doesn't meet");
}
// Days off
const off = [{id: "t", name: "Thanksgiving", from: "2026-10-12", to: "2026-10-12"}, {id: "r", name: "Reading Week", from: "2026-10-19", to: "2026-10-23"}];
{
  const s = {off};
  ok(!S.meets(s, {days: [1]}, "2026-10-12") && S.meets(s, {days: [1]}, "2026-10-05"), "no class on a holiday");
  ok(!S.meets(s, {days: [3]}, "2026-10-21") && S.off(s, "2026-10-21").name === "Reading Week", "a week off covers every day in it");
  ok(S.off(s, "2026-10-24") === null && S.off(s, "2026-10-18") === null, "and stops at its ends");
  ok(S.norm({off: [{from: "2026-10-30", to: "2026-10-01"}]}).off[0].to === "2026-10-30", "an end before the start is the start");
}
// A 6-day cycle that skips weekends; Monday Oct 5 is Day 1
const cyc = {n: 6, ref: "2026-10-05", k: 1, days: [1, 2, 3, 4, 5], names: "num"};
{
  const s = {cycle: cyc}, d = x => S.dayOf(s, x);
  ok([d("2026-10-05"), d("2026-10-06"), d("2026-10-07"), d("2026-10-08"), d("2026-10-09")].join() === "1,2,3,4,5", "Mon to Fri: Days 1 to 5");
  ok(d("2026-10-10") === 0 && d("2026-10-11") === 0, "weekends aren't school days");
  ok(d("2026-10-12") === 6 && d("2026-10-13") === 1, "the cycle carries over the weekend and wraps after Day 6");
  ok(d("2026-10-02") === 6 && d("2026-10-01") === 5, "and runs backwards before the reference day");
  ok(S.label(s, 3) === "Day 3" && S.label(s, 3, true) === "3", "labels: Day 3");
  ok(S.label({cycle: Object.assign({}, cyc, {names: "abc"})}, 2) === "B Day", "or B Day");
}
// Holidays push the cycle back
{
  const s = {cycle: cyc, off}, d = x => S.dayOf(s, x);
  ok(d("2026-10-12") === 0, "Thanksgiving Monday has no cycle day");
  ok(d("2026-10-13") === 6 && d("2026-10-14") === 1, "the day after picks up where the cycle left off");
  ok(d("2026-10-26") === 4, "after Reading Week it carries on: " + d("2026-10-26"));
  ok(S.meets(s, {cyc: [6]}, "2026-10-13") && !S.meets(s, {cyc: [6]}, "2026-10-12"), "a Day 6 class meets on the next Day 6");
  ok(S.nextSchool(s, "2026-10-10") === "2026-10-13", "the next school day skips the weekend and the holiday");
}
// A/B days
{
  const s = {cycle: {n: 2, ref: "2026-10-05", k: 1, names: "abc"}};
  ok(["2026-10-05", "2026-10-06", "2026-10-07", "2026-10-08", "2026-10-09", "2026-10-12"].map(x => S.label(s, S.dayOf(s, x), true)).join("") === "ABABAB", "A/B days alternate");
}
// The calendar feed: rotating classes on their days only, weekly ones skip days off
{
  const data = {courses: [{id: "c1", code: "BIO 11", name: "Biology", created: 0, meetings: [{id: "m1", kind: "Lecture", cyc: [1], start: "09:00", end: "10:00"}, {id: "m2", kind: "Lab", days: [3], start: "13:00", end: "14:00"}]}],
    tasks: [], events: [], settings: {school: {cycle: cyc, off}}};
  const out = ICS.build(data, {tz: "UTC", classes: true, classesFrom: "2026-10-05", classesUntil: "2026-10-31"}, Date.UTC(2026, 9, 5, 12), true).text;
  const days = [...out.matchAll(/UID:class-c1-m1-(\d{4}-\d\d-\d\d)@/g)].map(m => m[1]);
  ok(days.join() === "2026-10-05,2026-10-14,2026-10-29", "Day 1 lectures in the feed: " + days.join());
  ok(/EXDATE[^:]*:20261021T130000/.test(out) && !/EXDATE[^:]*:20261014T130000/.test(out), "the weekly lab skips Reading Week's Wednesday");
}
// Public holidays, from the home time zone
{
  S.zone("America/New_York");
  const hol = (y, name) => (S.holidayList("US", y).find(h => h.name === name) || {}).date;
  ok(hol(2026, "Thanksgiving Day") === "2026-11-26" && hol(2025, "Thanksgiving Day") === "2025-11-27", "Thanksgiving is the fourth Thursday of November");
  ok(hol(2026, "Martin Luther King Jr. Day") === "2026-01-19" && hol(2026, "Memorial Day") === "2026-05-25" && hol(2026, "Labor Day") === "2026-09-07", "Monday holidays");
  ok(S.easter(2026) === "2026-04-05" && S.easter(2027) === "2027-03-28" && S.easter(2025) === "2025-04-20", "Easter");
  const lec = {days: [4]};
  ok(!S.meets({}, lec, "2026-11-26") && S.off({}, "2026-11-26").name === "Thanksgiving Day", "Thanksgiving: a day off with nothing set up, since every school takes it");
  ok(S.meets({}, {days: [1]}, "2026-01-19"), "MLK Day: classes as usual until you say otherwise");
  ok(!S.meets({ans: {"US:mlk": "off"}}, {days: [1]}, "2026-01-19") && !S.meets({ans: {"US:mlk": "off"}}, {days: [1]}, "2027-01-18"), "once you say it's a day off, it is every year");
  ok(S.meets({ans: {"US:mlk": "on"}}, {days: [1]}, "2026-01-19"), "or classes as usual");
  ok(S.meets({pub: false}, lec, "2026-11-26"), "public holidays can be turned off");
  const asks = S.holidays({}, "2026-01-01", "2026-12-31").filter(h => !h.sure).map(h => h.name);
  ok(asks.includes("Martin Luther King Jr. Day") && asks.includes("Day after Thanksgiving") && !asks.includes("Thanksgiving Day"), "the common ones are the ones to ask about");
  S.zone("America/Toronto");
  ok(S.countryName() === "Canada" && S.off({}, "2026-09-07").name === "Labour Day" && S.off({}, "2026-11-26") === null, "Canada: Labour Day, not US Thanksgiving");
  ok((S.holidayList("CA", 2026).find(h => h.name === "Victoria Day") || {}).date === "2026-05-18" && (S.holidayList("CA", 2026).find(h => h.name === "Thanksgiving") || {}).date === "2026-10-12", "Victoria Day and Canadian Thanksgiving");
  S.zone("Europe/Paris");
  ok(S.countryName() === "" && S.off({}, "2026-12-25") === null, "a country with no list: nothing automatic");
  S.zone("UTC");
  ok(S.off({}, "2026-12-25") === null, "no time zone country: nothing automatic");
  // the cycle pauses on public holidays too
  S.zone("America/New_York");
  ok(S.dayOf({cycle: {n: 2, ref: "2026-11-25", k: 1}}, "2026-11-27") === 2, "A/B days skip Thanksgiving");
  S.zone("");
}
// The feed builds in its own home zone and leaves the app's alone
{
  S.zone("Europe/London");
  const data = {courses: [{id: "c1", code: "BIO", name: "Bio", created: 0, meetings: [{id: "m2", kind: "Lab", days: [4], start: "13:00", end: "14:00"}]}], tasks: [], events: [], settings: {}};
  const out = ICS.build(data, {tz: "America/New_York", classes: true, classesFrom: "2026-11-01", classesUntil: "2026-11-30"}, Date.UTC(2026, 10, 1, 12), true).text;
  ok(/EXDATE[^:]*:20261126T130000/.test(out), "the feed skips Thanksgiving for a US school");
  ok(S.zone() === "Europe/London", "and puts the app's zone back");
  S.zone("");
}
console.log(`school-days: ${n} checks passed`);
