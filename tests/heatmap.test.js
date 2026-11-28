// Unit tests for the Study Heatmap's daily series (99-heatmap.js): merging the stored sources, the study-minute weighting,
// runs (current and longest, with the Gentle Streak's rest rules), the term total, the grid layout and the locale's first day.
// Runs itself again under several time zones, since day boundaries come from local time.
const assert = require("assert"), cp = require("child_process");
const TZS = ["UTC", "America/New_York", "America/Los_Angeles", "Europe/London", "Australia/Sydney", "Pacific/Auckland", "Asia/Kolkata", "Pacific/Apia", "Pacific/Kiritimati"];
if (!process.env.HM_TZ_CHILD && !process.env.HM_NO_TZ) {
  for (const tz of TZS) {
    const r = cp.spawnSync(process.execPath, [__filename], {env: Object.assign({}, process.env, {TZ: tz, HM_TZ_CHILD: "1"}), encoding: "utf8"});
    process.stdout.write(`[${tz}] ${r.stdout.trim().split("\n").pop()}\n`);
    if (r.status !== 0) { process.stderr.write(r.stderr + r.stdout); process.exit(1); }
  }
  process.exit(0);
}
const s = require("../scripts/app-files").source();
const a = s.indexOf("/*HM-START*/"), b = s.indexOf("/*HM-END*/");
assert(a > 0 && b > a, "markers missing");
const HM = new Function(s.slice(a, b) + ";return HM;")();
let n = 0; const ok = (c, m) => { n++; assert(c, m); };
const eq = (x, y, m) => { n++; assert.deepStrictEqual(x, y, m); };
// a local wall-clock instant, the way the app stamps doneAt and history lines
const at = (iso, h = 12, mi = 0) => new Date(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10), h, mi).getTime();
const T = (id, o) => Object.assign({id, title: id, type: "Assignment", status: "todo", courseId: "c1", history: []}, o || {});
const done = (id, day, o) => T(id, Object.assign({status: "done", doneAt: at(day, 15), created: at(day, 15) - 864e5}, o || {}));
const TODAY = "2026-11-26";  // a Thursday
const act = list => Object.fromEntries(list.map(d => [d, {focus: 30, cards: 0, tasks: 0, steps: 0, min: 30, study: true}]));

/* Day boundaries */
for (const d of ["2026-03-08", "2026-03-29", "2026-10-25", "2026-11-01", "2026-04-05", "2026-09-27", "2026-12-31", "2027-01-01"]) {
  eq(HM.dayOf(at(d, 23, 59)), d, "23:59 local is still " + d);
  eq(HM.dayOf(at(d, 0, 1)), d, "00:01 local is " + d);
}
eq(HM.dayOf(0), "", "no instant, no day");
eq(HM.add("2026-03-08", 1), "2026-03-09", "add across a US spring forward");
eq(HM.add("2026-10-25", 1), "2026-10-26", "add across the European fall back");
eq(HM.add("2028-02-28", 1), "2028-02-29", "leap day");

/* Merging the sources */
{
  // a task finished at 23:50 and another at 00:10 land on their own local days
  const tasks = [done("late", "2026-11-20", {doneAt: at("2026-11-20", 23, 50)}), done("early", "2026-11-21", {doneAt: at("2026-11-21", 0, 10)})];
  const V = HM.series({today: TODAY, tasks});
  eq(V["2026-11-20"].tasks, 1, "23:50 counts on that day");
  eq(V["2026-11-21"].tasks, 1, "00:10 counts on the next day");
  eq(V["2026-11-20"].min, 10, "a finished task is 10 study minutes");
}
{
  // the same 25 minutes reach SBSTATS, the focus log and the task's history: counted once (the largest), never added up
  const tasks = [T("t1", {history: [{at: at("2026-11-24", 10), text: "Focus session: 25m"}]})];
  const V = HM.series({today: TODAY, tasks, focusDays: {"2026-11-24": 25}, focusLog: [{d: "2026-11-24", h: 10, m: 25, c: "c1"}]});
  eq(V["2026-11-24"].focus, 25, "overlapping sources take the largest, not the sum");
  // a room session only SBSTATS knows about makes that source the larger one
  const V2 = HM.series({today: TODAY, tasks, focusDays: {"2026-11-24": 70}, focusLog: [{d: "2026-11-24", m: 25, c: "c1"}]});
  eq(V2["2026-11-24"].focus, 70, "the largest source wins");
}
{
  // workLog beats history lines on a task that has it (01-next-up.js does the same)
  const t = T("t1", {workLog: [{d: "2026-11-23", m: 40, k: "log", at: at("2026-11-23", 20)}], history: [{at: at("2026-11-22", 9), text: "Logged time: 15m"}]});
  const V = HM.series({today: TODAY, tasks: [t]});
  ok(V["2026-11-23"] && V["2026-11-23"].focus === 40 && !V["2026-11-22"], "the task's workLog is used when it has one");
  const V2 = HM.series({today: TODAY, tasks: [T("t2", {history: [{at: at("2026-11-22", 9), text: "Logged time: 15m"}, {at: at("2026-11-22", 18), text: "Focus session: 20m"}]})]});
  eq(V2["2026-11-22"].focus, 35, "older tasks: Logged time and Focus session lines on one day add up");
}
{
  // cards: fcDays as counts, fcDays as a list of days, and each card's last review day
  const cards = [{last: "2026-11-20"}, {last: "2026-11-20"}, {last: "2026-11-19"}, {last: "2026-11-18", draft: true}];
  const V = HM.series({today: TODAY, fcDays: {"2026-11-20": 40, "2026-11-25": 8}, cards});
  eq(V["2026-11-20"].cards, 40, "fcDays' count beats the cards last seen that day");
  eq(V["2026-11-19"].cards, 1, "a card's last review day counts");
  ok(!V["2026-11-18"], "draft cards don't count");
  eq(V["2026-11-25"].min, 4, "8 cards are 4 study minutes");
  const V2 = HM.series({today: TODAY, fcDays: ["2026-11-21", "2026-11-22"]});
  ok(V2["2026-11-21"].cards === 1 && V2["2026-11-21"].study, "a listed day had at least one card");
  // a mix of both (the two writers of fcDays overlapping) is still read without making days up
  const V3 = HM.series({today: TODAY, fcDays: {0: "2026-11-21", "2026-11-22": 3, junk: 5}});
  ok(V3["2026-11-21"].cards === 1 && V3["2026-11-22"].cards === 3 && Object.keys(V3).length === 2, "a mixed fcDays is read safely");
}
{
  // the weighting: focus + ½ minute per card + 10 minutes per task
  const V = HM.series({today: TODAY, focusDays: {"2026-11-24": 45}, fcDays: {"2026-11-24": 30}, tasks: [done("a", "2026-11-24"), done("b", "2026-11-24")]});
  eq(V["2026-11-24"].min, 45 + 15 + 20, "45 focus + 30 cards + 2 tasks = 80 study minutes");
  eq(HM.level(V["2026-11-24"]), 3, "80 minutes is the 4th step");
  eq([0, 1, 29, 30, 59, 60, 119, 120, 600].map(min => HM.level({min, study: true})), [1, 1, 1, 2, 2, 3, 3, 4, 4], "the step thresholds");
  eq(HM.level(null), 0, "no day, no colour");
  eq(HM.CARD_MIN, 0.5, "card weight"); eq(HM.TASK_MIN, 10, "task weight");
}
{
  // what counts as a study day follows the Gentle Streak
  const V = HM.series({today: TODAY, focusDays: {"2026-11-20": 3, "2026-11-21": 5}, tasks: [T("x", {history: [{at: at("2026-11-22", 9), text: "Checklist: 1/4 → 2/4"}, {at: at("2026-11-23", 9), text: "Checklist: 2/4 → 1/4"}]}),
    done("born", "2026-11-19", {created: at("2026-11-19", 15) - 1000})], gentleLog: {"2026-11-18": 1}});
  ok(V["2026-11-20"] && !V["2026-11-20"].study && HM.level(V["2026-11-20"]) === 0, "3 focus minutes alone isn't a study day (5 is)");
  ok(V["2026-11-21"].study, "5 focus minutes is a study day");
  ok(V["2026-11-22"].study && V["2026-11-22"].min === 0 && HM.level(V["2026-11-22"]) === 1, "a checklist step is a study day, at the first step");
  ok(!V["2026-11-23"], "unticking a step isn't study");
  ok(!V["2026-11-19"], "a task created already done doesn't count");
  ok(V["2026-11-18"].study, "a day the Gentle Streak logged counts");
}
{
  // one course only: its tasks, its focus log rows and its decks' cards; the app-wide stores (no course) are left out
  const tasks = [done("a", "2026-11-24"), done("b", "2026-11-24", {courseId: "c2"}), T("c", {courseId: "c1", history: [{at: at("2026-11-23", 9), text: "Focus session: 30m"}]})];
  const V = HM.series({today: TODAY, courseId: "c1", tasks, focusDays: {"2026-11-22": 90}, fcDays: {"2026-11-22": 50}, focusLog: [{d: "2026-11-21", m: 20, c: "c1"}, {d: "2026-11-21", m: 60, c: "c2"}], cards: [{last: "2026-11-20"}], gentleLog: {"2026-11-19": 1}});
  eq(Object.keys(V).sort(), ["2026-11-20", "2026-11-21", "2026-11-23", "2026-11-24"], "only that course's days");
  eq(V["2026-11-21"].focus, 20, "only that course's focus log rows");
  eq(V["2026-11-24"].tasks, 1, "only that course's tasks");
  eq(HM.series({today: TODAY, courseId: "c9", tasks, focusDays: {"2026-11-22": 90}}), {}, "a course with no history has an empty series");
}
{
  // only days up to today, and not before `from`
  const V = HM.series({today: TODAY, from: "2026-11-01", focusDays: {"2026-11-27": 50, "2026-10-31": 50, "2026-11-01": 50}});
  eq(Object.keys(V), ["2026-11-01"], "the range is kept");
}

/* Runs */
{
  eq(HM.runs({}, TODAY), {current: 0, longest: 0, studyDays: 0}, "nothing yet");
  const days = ["2026-11-16", "2026-11-17", "2026-11-18", "2026-11-19", "2026-11-20", "2026-11-23", "2026-11-24", "2026-11-25", "2026-11-26"];
  // Sat 21 and Sun 22 are the week's 2 free rest days, so the run carries on
  eq(HM.runs(act(days), TODAY).current, 9, "two quiet days in one week don't break a run (and don't add to it)");
  eq(HM.runs(act(days), TODAY, {rpw: 0}).current, 4, "with no free rest days a quiet day breaks it");
  eq(HM.runs(act(days), TODAY, {rpw: 0, wd: [0, 6]}).current, 9, "weekends chosen as days off never break it");
  eq(HM.runs(act(days), TODAY, {rpw: 0, rests: {"2026-11-21": 1, "2026-11-22": 1}}).current, 9, "marked rest days never break it");
  eq(HM.runs(act(days), TODAY, {rpw: 1}).current, 4, "one free rest day isn't enough for two quiet days");
  // today still open: the run so far stands
  eq(HM.runs(act(days.slice(0, -1)), TODAY, {rpw: 0}).current, 3, "today not studied yet doesn't break the run");
  // three quiet weekdays in a row (beyond the 2 free a week) break it; the longest is kept
  const long = act(["2026-11-02", "2026-11-03", "2026-11-04", "2026-11-05", "2026-11-06", "2026-11-07", "2026-11-08", "2026-11-09", "2026-11-10", "2026-11-11", "2026-11-12", "2026-11-25", "2026-11-26"]);
  const r = HM.runs(long, TODAY, {rpw: 2});
  ok(r.longest === 11 && r.current === 2 && r.studyDays === 13, "longest and current runs: " + JSON.stringify(r));
  // a non-study day in the series (3 focus minutes) is quiet
  const withQuiet = Object.assign(act(["2026-11-24", "2026-11-26"]), {"2026-11-25": {focus: 3, cards: 0, tasks: 0, steps: 0, min: 3, study: false}});
  eq(HM.runs(withQuiet, TODAY, {rpw: 0}).current, 1, "a day below a study day breaks a run with no rests");
  eq(HM.normCfg({rpw: 5, wd: [9, 1, 1], rests: {bad: 1, "2026-11-01": 1}}), {rpw: 2, wd: [1], rests: {"2026-11-01": 1}}, "settings are cleaned like the streak's");
}

/* Term total */
{
  const V = HM.series({today: TODAY, focusDays: {"2026-08-31": 100, "2026-09-01": 60, "2026-11-26": 30}, fcDays: {"2026-10-10": 10}});
  eq(HM.total(V, "2026-09-01", TODAY), {min: 95, days: 3}, "the term total adds study minutes and study days from the term's start");
}

/* The grid */
{
  for (const [fd, startWd] of [[0, 0], [1, 1], [6, 6]]) {
    const L = HM.layout(TODAY, 53, fd);
    eq(L.cols.length, 53, "53 weeks"); ok(L.cols.every(c => c.length === 7), "7 days a week");
    eq(HM.wday(L.start), startWd, "weeks start on the locale's first day " + fd);
    ok(L.cols[52].some(x => x.today) && L.cols[52].filter(x => !x.future).pop().today, "today is in the last week, its last shown day");
    eq(HM.diff(L.start, TODAY) < 371 && HM.diff(L.start, TODAY) >= 364, true, "about a year shown");
    eq(L.rows[0], fd, "rows start on the first day");
    ok(L.months.every((m, i) => !i || m.col > L.months[i - 1].col), "month labels go left to right");
    ok(L.months.length >= 12 && L.months.length <= 13, "a label for each month");
  }
  eq(HM.layout("2026-11-29", 1, 1).cols[0].map(x => x.d), ["2026-11-23", "2026-11-24", "2026-11-25", "2026-11-26", "2026-11-27", "2026-11-28", "2026-11-29"], "a Sunday ends a Monday-first week");
  eq(HM.layout("2026-11-29", 1, 0).cols[0][0].d, "2026-11-29", "a Sunday starts a Sunday-first week");
}

/* The monthly summary (the screen reader table) */
{
  const V = HM.series({today: TODAY, focusDays: {"2026-10-05": 60, "2026-10-06": 2, "2026-11-02": 30}, tasks: [done("a", "2026-11-03")]});
  const M = HM.months(V, "2026-09-27", TODAY);
  eq(M.map(m => m.ym), ["2026-09", "2026-10", "2026-11"], "one row a month");
  eq(M[1], {ym: "2026-10", days: 1, min: 62, focus: 62, cards: 0, tasks: 0}, "October");
  eq(M[2].days, 2, "November's study days"); eq(M[0].days, 0, "an empty month still has its row");
}

/* The locale's first day of the week */
eq(HM.firstDayOf("en-US"), 0, "US weeks start on Sunday");
eq(HM.firstDayOf("en-GB"), 1, "UK weeks start on Monday");
eq(HM.firstDayOf("de-DE"), 1, "German weeks start on Monday");
eq(HM.firstDayOf("ar-EG"), 6, "Egyptian weeks start on Saturday");
eq(HM.firstDayOf("es-MX"), 0, "Mexican weeks start on Sunday");
ok([0, 1, 6].includes(HM.firstDayOf("xx")), "an unknown locale still gets a day");

console.log(`heatmap.test: ${n} checks passed`);
