// Unit tests for the Weekly Review numbers and the gentle study streak (pure logic extracted from index.html). Run: node tests/review-streaks.test.js
// The logic works on calendar-day strings; instants (task done times, history lines) become a local day with dayOf, so the same data must give the
// same answers in every zone, across clock changes, and at 23:30 / 00:30 local.
const fs = require("fs"), path = require("path"), assert = require("assert"), cp = require("child_process");
const TZS = ["UTC", "America/New_York", "America/Los_Angeles", "Europe/London", "Australia/Sydney", "Pacific/Auckland", "Asia/Kolkata", "Pacific/Apia", "Pacific/Kiritimati"];
if (!process.env.RS_TZ_CHILD && !process.env.RS_NO_TZ) {
  for (const tz of TZS) {
    const r = cp.spawnSync(process.execPath, [__filename], {env: Object.assign({}, process.env, {TZ: tz, RS_TZ_CHILD: "1"}), encoding: "utf8"});
    process.stdout.write(`[${tz}] ${r.stdout.trim().split("\n").pop()}\n`);
    if (r.status !== 0) { process.stderr.write(r.stderr + r.stdout); process.exit(1); }
  }
  process.exit(0);
}
const s = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const a = s.indexOf("/*RS-START*/"), b = s.indexOf("/*RS-END*/");
assert(a > 0 && b > a, "markers missing");
const RS = new Function(s.slice(a, b) + ";return RS;")();
let n = 0; const ok = (c, m) => { n++; assert(c, m); };
const eq = (x, y, m) => { n++; assert.deepStrictEqual(x, y, m); };
// a local wall-clock instant, the way the app stamps doneAt and history lines
const at = (iso, h = 12, mi = 0) => new Date(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10), h, mi).getTime();
const T = (id, o) => Object.assign({id, title: id, type: "Assignment", status: "todo", courseId: "c1", history: []}, o || {});
const done = (id, day, o) => T(id, Object.assign({status: "done", doneAt: at(day, 15), created: at(day, 15) - 864e5}, o || {}));
const days = (from, k) => Array.from({length: k}, (_, i) => RS.add(from, i));
const act = list => Object.fromEntries(list.map(d => [d, {done: 1}]));

// ---------- day arithmetic ----------
eq(RS.add("2026-03-08", 1), "2026-03-09", "add across a US spring forward");
eq(RS.add("2026-11-01", 1), "2026-11-02", "add across a US fall back");
eq(RS.add("2026-02-28", 1), "2026-03-01", "no Feb 29 in 2026");
eq(RS.add("2028-02-28", 1), "2028-02-29", "Feb 29 in 2028");
eq(RS.monday("2026-10-04"), "2026-09-28", "Sunday belongs to the week that began on Monday");
eq(RS.monday("2026-10-05"), "2026-10-05", "Monday is its own week start");
eq(RS.diff("2026-10-25", "2026-11-02"), 8, "diff across the European fall back");
for (const d of ["2026-03-08", "2026-03-29", "2026-10-25", "2026-11-01", "2026-04-05", "2026-09-27", "2026-12-31", "2027-01-01"]) {
  eq(RS.dayOf(at(d, 23, 30)), d, "23:30 local is still " + d);
  eq(RS.dayOf(at(d, 0, 30)), d, "00:30 local is " + d);
  eq(RS.dayOf(at(d, 12, 0)), d, "noon local is " + d);
}
eq(RS.dayOf(NaN), "", "bad instant");

// ---------- the review window ----------
{
  const SUN = "2026-10-04", MON = "2026-10-05";
  eq(RS.reviewWindow("2026-10-03", 20), null, "Saturday evening: not yet");
  eq(RS.reviewWindow(SUN, 11), null, "Sunday morning: not yet");
  eq(RS.reviewWindow(SUN, 12).weekStart, "2026-09-28", "Sunday from noon: the week that ends today");
  eq(RS.reviewWindow(SUN, 23).weekEnd, SUN, "Sunday night");
  eq(RS.reviewWindow(SUN, 12).nextStart, MON, "next week starts tomorrow");
  eq(RS.reviewWindow(MON, 0).weekStart, "2026-09-28", "Monday morning: last week");
  eq(RS.reviewWindow(MON, 23).weekEnd, SUN, "Monday night: last week");
  eq(RS.reviewWindow(MON, 8).nextStart, MON, "on Monday 'next week' is this week, starting today");
  eq(RS.reviewWindow("2026-10-06", 9), null, "Tuesday: closed");
  for (const sun of ["2026-03-08", "2026-03-29", "2026-10-25", "2026-11-01", "2026-04-05", "2026-09-27", "2026-10-04"]) {
    const w = RS.reviewWindow(sun, 13); ok(w && RS.diff(w.weekStart, sun) === 6 && RS.wday(w.weekStart) === 1, "window ending a clock change Sunday " + sun);
    ok(RS.diff(w.weekStart, w.weekEnd) === 6 && RS.diff(w.nextStart, w.nextEnd) === 6, "7 calendar days on both sides, whatever the hours in them");
  }
  eq(RS.periodFor("2026-10-07", 10, false), null, "midweek: no card");
  const p = RS.periodFor("2026-10-07", 10, true);
  ok(p.kind === "sofar" && p.weekStart === "2026-10-05" && p.weekEnd === "2026-10-07" && p.nextStart === "2026-10-12", "manual midweek: this week so far");
  eq(RS.periodFor("2026-10-04", 6, true).kind, "sun", "manual on Sunday morning reviews the full week");
  eq(RS.periodFor("2026-10-05", 6, true).kind, "mon", "manual on Monday reviews last week");
  eq(RS.periodFor("2026-10-04", 6, false), null, "automatic card waits for the afternoon");
  const w = RS.reviewWindow(SUN, 14), base = {period: w, review: {}, snoozeDay: "", today: SUN, worth: true};
  ok(RS.cardShown(base), "shown");
  ok(!RS.cardShown(Object.assign({}, base, {worth: false})), "nothing to say: hidden");
  ok(!RS.cardShown(Object.assign({}, base, {review: {off: true}})), "turned off");
  ok(!RS.cardShown(Object.assign({}, base, {review: {skip: w.weekStart}})), "skipped this week");
  ok(RS.cardShown(Object.assign({}, base, {review: {skip: "2026-09-21"}})), "an old skip does not hide this week");
  ok(!RS.cardShown(Object.assign({}, base, {review: {seen: w.weekStart}})), "already reviewed");
  ok(!RS.cardShown(Object.assign({}, base, {snoozeDay: SUN})), "Not Now hides it for today");
  ok(RS.cardShown(Object.assign({}, base, {snoozeDay: SUN, today: MON, period: RS.reviewWindow(MON, 9)})), "and it is back on Monday");
  ok(!RS.cardShown({period: null, review: {}, today: SUN, worth: true}), "no window");
  // Skip on Sunday also covers Monday (same week), but not the next Sunday
  const sk = {skip: RS.reviewWindow(SUN, 14).weekStart};
  ok(!RS.cardShown({period: RS.reviewWindow(MON, 9), review: sk, today: MON, worth: true}), "skip lasts through Monday");
  ok(RS.cardShown({period: RS.reviewWindow("2026-10-11", 14), review: sk, today: "2026-10-11", worth: true}), "and ends by the next Sunday");
}

// ---------- week numbers ----------
{
  const P = RS.reviewWindow("2026-10-04", 14);   // Mon Sep 28 to Sun Oct 4
  const tasks = [
    done("in-mon", "2026-09-28"), done("in-sun", "2026-10-04"), T("late-sun", {status: "done", doneAt: at("2026-10-04", 23, 59)}),
    T("early-mon", {status: "done", doneAt: at("2026-10-05", 0, 1)}), done("before", "2026-09-27"),
    done("born", "2026-09-30", {created: at("2026-09-30", 15) - 1000}), done("prep1", "2026-10-01", {prepFor: "ex", type: "Study"}), done("step1", "2026-10-02", {breakdownOf: "p"}),
    done("exam", "2026-10-02", {type: "Exam", weight: 30, hours: 0}), done("proj", "2026-10-03", {type: "Project", hours: 10, weight: 20}), done("read", "2026-10-01", {type: "Reading", hours: 1}),
    T("open-late", {due: "2026-10-02"}), T("open-old", {due: "2026-09-10", title: "Old one"}), T("open-today", {due: "2026-10-04"}), T("open-future", {due: "2026-10-09"}),
    T("past-exam", {type: "Exam", due: "2026-10-01"}), T("step-late", {due: "2026-10-01", breakdownOf: "p"}), T("prep-late", {due: "2026-10-01", prepFor: "ex"}),
    T("moved", {due: "2026-10-12", history: [{at: at("2026-09-30", 9), text: "Due: Oct 2 → Oct 12"}]}),
    T("moved-before", {due: "2026-10-12", history: [{at: at("2026-09-20", 9), text: "Due: Sep 22 → Oct 12"}]}),
    T("ex1", {type: "Exam", due: "2026-10-08", courseId: "c2"}), T("quiz1", {type: "Quiz", due: "2026-10-04"}), T("ex-far", {type: "Exam", due: "2026-12-01"})
  ];
  const st = RS.weekStats({tasks, period: P, today: "2026-10-04"});
  eq(st.done.slice().sort(), ["exam", "in-mon", "in-sun", "late-sun", "proj", "read"], "done this week: Monday 00:00 to Sunday 23:59 local, not born done, no prep sessions or steps");
  ok(st.doneN === 6 && st.stepsN === 1 && st.sessionsN === 1, "steps and sessions counted apart");
  eq(st.wins.map(w => w.id), ["proj", "exam", "late-sun"], "biggest wins first (project, exam), then a tie goes to the latest finished; 3 shown");
  eq(st.hoursEst, 11, "estimated hours of finished work leave out exams");
  eq(st.slipped.map(x => x.id), ["open-late", "open-old"].sort((x, y) => x === "open-late" ? -1 : 1), "slipped: this week's first, then older; exams, steps and prep sessions never listed");
  ok(st.slipped.find(x => x.id === "open-old").older && !st.slipped.find(x => x.id === "open-late").older, "older flag");
  ok(!st.slipped.some(x => x.id === "open-today" || x.id === "open-future"), "due today or later is not slipped");
  eq(st.moved, 1, "a due date moved this week");
  eq(st.exams.map(x => x.id), ["quiz1", "ex1"], "exams and quizzes in the next 3 weeks by date (the far one is left out)");
  ok(RS.worth(st), "worth showing");
  ok(!RS.worth(RS.weekStats({tasks: [], period: P, today: "2026-10-04"})), "an empty week is not worth a card");
  // the same data from the other side of the clock change gives the same answer
  const e1 = RS.weekStats({tasks, period: P, today: "2026-10-04"}), e2 = RS.weekStats({tasks, period: P, today: "2026-10-04"});
  eq(e1, e2, "deterministic");
}
// weeks that contain a clock change still have 7 days of numbers
for (const [ws, bad] of [["2026-03-02", "2026-03-08"], ["2026-10-26", "2026-11-01"], ["2026-03-23", "2026-03-29"], ["2026-09-21", "2026-09-27"]]) {
  const P = {weekStart: ws, weekEnd: RS.add(ws, 6), nextStart: RS.add(ws, 7), nextEnd: RS.add(ws, 13), kind: "sun"};
  const tasks = days(ws, 7).map((d, i) => done("t" + i, d, {doneAt: at(d, i % 2 ? 23 : 0, 30)}));
  eq(RS.weekStats({tasks, period: P, today: P.weekEnd}).doneN, 7, `7 days of work around ${bad}, including 00:30 and 23:30`);
}

// ---------- time studied ----------
{
  const P = RS.reviewWindow("2026-10-04", 14);
  const H = (d, text, h = 10) => ({at: at(d, h), text});
  const tasks = [T("a", {courseId: "c1", history: [H("2026-09-29", "Focus session: 25m"), H("2026-09-29", "Focus session: 25m", 16), H("2026-10-01", "Logged time: 40m"), H("2026-09-20", "Focus session: 50m"), H("2026-09-30", "Renamed: x")]}),
    T("b", {courseId: "c2", history: [H("2026-10-02", "Focus session: 30m")]}), T("c", {courseId: "", history: [H("2026-10-03", "Logged time: 15m")]})];
  const st = RS.weekStats({tasks, period: P, today: "2026-10-04"});
  eq(st.minutes.total, 135, "history lines in the week add up; last week's line is left out");
  eq(st.minutes.courses.map(x => [x.id, x.min]), [["c1", 90], ["c2", 30], ["", 15]], "per course, biggest first");
  ok(st.minutes.tracked && st.minutes.other === 0, "tracked");
  // the per day focus log covers history that was trimmed away: the larger of the two for each day, the rest shows as 'not tied to a course'
  const st2 = RS.weekStats({tasks, period: P, today: "2026-10-04", focusDays: {"2026-09-29": 120, "2026-10-02": 10, "2026-09-10": 400}});
  eq(st2.minutes.total, 120 + 40 + 30 + 15, "focusDays wins on a day when it is larger");
  eq(st2.minutes.other, 70, "the part of the day total no task line explains");
  // SBTIME's per course answer is used when present
  const st3 = RS.weekStats({tasks: [], period: P, today: "2026-10-04", time: {byDay: {"2026-09-30": 90}, byCourse: {c9: 60, c8: 30}}});
  eq([st3.minutes.total, st3.minutes.courses.map(x => x.id)], [90, ["c9", "c8"]], "time module answers");
  // nothing tracked: no pretending
  const st4 = RS.weekStats({tasks: [done("x", "2026-09-30", {hours: 2})], period: P, today: "2026-10-04"});
  ok(!st4.minutes.tracked && st4.minutes.total === 0 && st4.hoursEst === 2, "no tracked time falls back to estimated hours");
  eq(RS.roundMin(137), 135, "rounded to 5 minutes");
  eq(RS.weekStats({tasks: [T("z", {history: [H("2026-09-30", "Focus session: 3m")]})], period: P, today: "2026-10-04"}).minutes.total, 3, "tiny totals are kept");
  ok(!RS.weekStats({tasks: [T("z", {history: [H("2026-09-30", "Focus session: 3m")]})], period: P, today: "2026-10-04"}).minutes.tracked, "but 3 minutes is not 'tracked'");
}

// ---------- suggestion, pick a day ----------
{
  eq(RS.suggestion({slipped: [{title: "A"}], exams: [{title: "E", noPrep: true}]}), {kind: "slipped", title: "A"}, "slipped first");
  eq(RS.suggestion({slipped: [], exams: [{title: "E", noPrep: false}, {title: "F", noPrep: true}]}), {kind: "prep", title: "F"}, "exam with no plan");
  eq(RS.suggestion({slipped: [], exams: [], level: 3, topTitle: "Paper"}), {kind: "early", title: "Paper"}, "heavy week ahead");
  eq(RS.suggestion({slipped: [], exams: [], level: 1, topTitle: "Paper"}), {kind: "first", title: "Paper"}, "ordinary week");
  eq(RS.suggestion({slipped: [], exams: [], level: 0, topTitle: ""}), {kind: "rest"}, "quiet");
  const D = [{date: "2026-10-05", ratio: 1.2}, {date: "2026-10-06", ratio: 0.3}, {date: "2026-10-07", ratio: 0.3}];
  eq(RS.pickDay(D), "2026-10-06", "lightest day, earliest on a tie");
  eq(RS.pickDay(D, {"2026-10-06": 0.5}), "2026-10-07", "load already given to a day counts");
  eq(RS.pickDay([]), "", "no days");
}

// ---------- AI recap vetting ----------
{
  const facts = {text: "Finished 4 tasks: \"Stats HW\" (STAT101).\nStill open: \"Lab 3\" (was due Tuesday).\nStudy time about 3h 30m.", titles: ["Stats HW", "Lab 3", "Essay"]};
  const good = "You finished 4 tasks this week, including \"Stats HW\". \"Lab 3\" is still waiting for a new day after Tuesday. About 3 hours of study is a solid base.";
  eq(RS.vetRecap(good, facts), good, "a faithful recap passes");
  eq(RS.vetRecap("You finished 5 tasks this week.", facts), "", "an invented number is thrown away");
  eq(RS.vetRecap("You finished 4 tasks. \"Chem Quiz\" is next.", facts), "", "an invented task is thrown away");
  eq(RS.vetRecap("You finished 4 tasks. Lab 3 is due Friday.", facts), "", "a weekday that was not given is thrown away");
  eq(RS.vetRecap("You finished 4 tasks and \"Stats HW\" is done. Lab 3 slipped on October 6.", facts), "", "a month is thrown away");
  eq(RS.vetRecap("You failed to finish \"Lab 3\".", facts), "", "guilt language is thrown away");
  eq(RS.vetRecap("You are falling behind on 4 tasks.", facts), "", "falling behind is thrown away");
  eq(RS.vetRecap("Nice week \u{1F389} with 4 tasks.", facts), "", "emoji is thrown away");
  eq(RS.vetRecap("Nice week — 4 tasks done.", facts), "Nice week, 4 tasks done.", "dashes are replaced");
  eq(RS.vetRecap("", facts), "", "empty");
  eq(RS.vetRecap("x".repeat(700), facts), "", "too long");
  eq(RS.vetRecap(good, null), "", "no facts, no trust");
}

// ---------- study days ----------
{
  const tasks = [done("d1", "2026-10-01"), T("born", {status: "done", doneAt: at("2026-10-02", 10), created: at("2026-10-02", 10) - 5000}),
    T("f", {history: [{at: at("2026-10-03", 9), text: "Focus session: 25m"}, {at: at("2026-10-04", 9), text: "Focus session: 2m"}, {at: at("2026-10-05", 22), text: "Logged time: 30m"}]}),
    T("c", {history: [{at: at("2026-10-06", 23, 30), text: "Checklist: 1/4 → 2/4"}, {at: at("2026-10-07", 9), text: "Checklist: 3/4 → 2/4"}, {at: at("2026-10-08", 9), text: "Status: To Do → In Work"}]})];
  const A = RS.activityDays({tasks, focusDays: {"2026-10-09": 20, "2026-10-10": 3}, log: {"2026-10-11": 1}, timeDays: ["2026-10-12"], to: "2026-10-31"});
  eq(Object.keys(A).sort(), ["2026-10-01", "2026-10-03", "2026-10-05", "2026-10-06", "2026-10-09", "2026-10-11", "2026-10-12"], "done, focus, logged time, a ticked step, flashcard log; not born done, 2 minutes, an unticked step or a status change");
  eq(Object.keys(RS.activityDays({tasks, from: "2026-10-05", to: "2026-10-06"})).sort(), ["2026-10-05", "2026-10-06"], "range");
}

// ---------- the streak ----------
{
  const S = (list, o) => RS.streak(Object.assign({today: "2026-10-14", active: act(list)}, o || {}));
  // 2026-10-14 is a Wednesday
  let r = S([]);
  ok(r.run === 0 && r.last28 === 0 && !r.todayActive, "nothing yet");
  r = S(["2026-10-12", "2026-10-13", "2026-10-14"]);
  ok(r.run === 3 && r.todayActive && r.best === 3 && r.last28 === 3, "three days in a row");
  r = S(["2026-10-12", "2026-10-13"]);
  ok(r.run === 2 && !r.todayActive && r.status["2026-10-14"] === "open", "today is open: it never breaks anything");
  // free rest days: two a week
  r = S(["2026-10-05", "2026-10-06", "2026-10-07", "2026-10-08", "2026-10-09", "2026-10-12", "2026-10-14"]);   // Mon to Fri, then Mon and Wed
  ok(r.status["2026-10-10"] === "rest" && r.status["2026-10-11"] === "rest" && r.status["2026-10-13"] === "rest", "quiet days are covered by 2 free rest days a week");
  ok(r.run === 7 && r.gap === 0 && r.restsLeft === 1, "none of that broke the run: " + r.run + " rests left " + r.restsLeft);
  r = S(["2026-10-05", "2026-10-10", "2026-10-14"]);   // Tue to Fri quiet in the first week: 2 free, 2 pause
  eq([r.status["2026-10-06"], r.status["2026-10-07"], r.status["2026-10-08"], r.status["2026-10-09"]], ["rest", "rest", "quiet", "quiet"], "the third quiet day of a week is a pause");
  ok(r.run === 3, "a short pause keeps the run and the next study day adds one: " + r.run);
  // weekday off never uses free rest days
  r = S(["2026-10-05", "2026-10-06", "2026-10-07"], {today: "2026-10-12", cfg: {wd: [0, 6], rpw: 0}});   // Sat/Sun off, no free rests
  ok(r.status["2026-10-10"] === "rest" && r.status["2026-10-11"] === "rest" && r.status["2026-10-08"] === "quiet", "weekdays off are rest days even with 0 free rest days");
  r = S(["2026-10-05", "2026-10-09", "2026-10-12"], {today: "2026-10-12", cfg: {wd: [0, 6], rpw: 2}});
  ok(r.status["2026-10-06"] === "rest" && r.status["2026-10-07"] === "rest" && r.status["2026-10-08"] === "quiet" && r.run === 3, "weekday off does not consume the free rest days: " + JSON.stringify(r.status));
  // marked rest days (as many as wanted)
  r = S(["2026-10-05", "2026-10-12"], {today: "2026-10-12", cfg: {rpw: 0, rests: {"2026-10-06": 1, "2026-10-07": 1, "2026-10-08": 1, "2026-10-09": 1, "2026-10-10": 1, "2026-10-11": 1}}});
  ok(r.run === 2 && r.gap === 0, "a week of marked rest days keeps the run");
  // active on a rest day still counts
  r = S(["2026-10-10", "2026-10-11"], {today: "2026-10-12", cfg: {wd: [0, 6]}});
  ok(r.run === 2 && r.status["2026-10-10"] === "active", "studying on a day off is a bonus");
  // a long gap softens, never resets
  const long = days("2026-09-01", 20);   // 20 days in a row
  r = S(long, {today: "2026-09-20"}); eq(r.run, 20, "20 in a row");
  r = S(long, {today: "2026-09-26"});    // after Sunday Sep 20: Mon 21 and Tue 22 are the week free rest days; 23, 24, 25 are quiet (today is still open) => gap 3
  ok(r.gap === 3 && r.run === 20 && r.paused && !r.softened, "a pause of up to 3 quiet days leaves the run alone: gap " + r.gap + " run " + r.run);
  r = S(long, {today: "2026-09-27"});
  ok(r.gap === 4 && r.run === 10 && r.softened, "longer: it softens to half, not to zero: " + r.run);
  r = S(long.concat(["2026-09-27"]), {today: "2026-09-27"});
  ok(r.run === 11 && r.resumedAfter === 4 && r.best === 20, "the next study day continues from the softer number: run " + r.run + " resumedAfter " + r.resumedAfter);
  r = S(long, {today: "2026-12-01"}); ok(r.run >= 1 && r.run < 5 && r.best === 20, "months away: small, but never zero, and the best is kept: " + r.run);
  r = S([], {best: 12}); ok(r.best === 12 && r.run === 0, "a stored best is never lowered");
  r = S(["2026-10-14"], {best: 30}); ok(r.best === 30 && r.run === 1, "stored best wins");
  eq([RS.soften(20, 3), RS.soften(20, 4), RS.soften(20, 10), RS.soften(20, 11), RS.soften(1, 40), RS.soften(0, 40)], [20, 10, 10, 5, 1, 0], "soften");
  // last 28 days
  r = S(days("2026-09-17", 12).concat(["2026-10-14", "2026-08-01"]));
  eq(r.last28, 13, "28 day window: 2026-09-17 to 2026-10-14, 12 + 1 days (the old one is outside)");
  // future activity is ignored
  r = S(["2026-10-20"]); ok(r.run === 0 && r.last28 === 0, "future days are ignored");
  // the calendar
  r = S(["2026-10-12", "2026-10-13", "2026-10-14"], {cfg: {wd: [0]}});
  const g = RS.grid(r, 5);
  ok(g.length === 35 && g[0].date === "2026-09-14" && g[34].date === "2026-10-18" && g.every((c, i) => !i || RS.diff(g[i - 1].date, c.date) === 1), "five Monday-first weeks ending this week");
  ok(g.every(c => c.wd === RS.wday(c.date)), "weekday ids");
  eq(g.find(c => c.date === "2026-10-14").status, "active", "today active");
  ok(g.find(c => c.date === "2026-10-14").today && !g.find(c => c.date === "2026-10-13").today, "today flagged");
  eq(g.find(c => c.date === "2026-10-18").status, "rest", "a future Sunday off shows as a rest day");
  eq(g.find(c => c.date === "2026-10-16").status, "future", "future");
  eq(g.find(c => c.date === "2026-09-20").status, "rest", "Sunday off before the first study day");
  eq(g.find(c => c.date === "2026-09-22").status, "none", "no record before the first study day");
  // normCfg
  eq(RS.normCfg(null), {rpw: 2, wd: [], rests: {}}, "defaults");
  eq(RS.normCfg({rpw: 9, wd: [1, 1, "2", 9, -1, "x"], rests: {"2026-10-01": 1, nope: 1, "2026-10-02": 0}}), {rpw: 2, wd: [1, 2], rests: {"2026-10-01": 1}}, "clamped and cleaned");
  eq(RS.normCfg({rpw: 0}).rpw, 0, "0 free rest days is allowed");
  eq(RS.normCfg({wd: [0, 1, 2, 3, 4, 5, 6]}).wd.length, 6, "never every day off");
}
// the streak is the same in every zone and across clock changes: a done time at 23:30 or 00:30 local is that local day
for (const start of ["2026-03-04", "2026-10-22", "2026-10-30", "2026-03-26", "2026-09-24", "2026-04-02"]) {
  const L = days(start, 12), tasks = L.map((d, i) => done("t" + i, d, {doneAt: at(d, i % 2 ? 23 : 0, 30)}));
  const A = RS.activityDays({tasks}), r = RS.streak({today: L[11], active: A});
  ok(r.run === 12 && r.last28 === 12 && r.gap === 0, `12 days in a row across a clock change from ${start}: ${r.run}`);
  const w = RS.streak({today: RS.add(L[11], 1), active: A});
  ok(w.run === 12 && w.status[RS.add(L[11], 1)] === "open", "the next morning it is still 12 and today is open");
}
// celebrations
{
  const run = k => RS.streak({today: "2026-10-14", active: act(days(RS.add("2026-10-14", -(k - 1)), k))});
  eq(RS.celebration(run(3), {}, "2026-10-14"), {kind: "milestone", n: 3}, "3 days");
  eq(RS.celebration(run(7), {}, "2026-10-14"), {kind: "milestone", n: 7}, "a week");
  eq(RS.celebration(run(4), {}, "2026-10-14"), null, "not a milestone");
  eq(RS.celebration(run(7), {m: {7: "2026-10-10"}}, "2026-10-14"), null, "said recently");
  eq(RS.celebration(run(7), {m: {7: "2026-08-01"}}, "2026-10-14"), {kind: "milestone", n: 7}, "again after a long while");
  eq(RS.celebration(RS.streak({today: "2026-10-14", active: act(days("2026-10-10", 4).slice(0, 3))}), {}, "2026-10-14"), null, "only on a day you studied");
  const back = RS.streak({today: "2026-10-14", active: act(["2026-09-20", "2026-09-21", "2026-10-14"])});
  ok(back.resumedAfter >= 4, "back after a break: " + back.resumedAfter);
  eq(RS.celebration(back, {}, "2026-10-14"), {kind: "welcome"}, "welcome back");
  eq(RS.celebration(back, {wb: "2026-10-10"}, "2026-10-14"), null, "welcome only once in a week");
  eq(RS.tier(3) + RS.tier(7) + RS.tier(14) + RS.tier(21) + RS.tier(30) + RS.tier(100), "m3m7m14m21m30m30", "tiers");
}
console.log(`review-streaks ok: ${n} checks`);
