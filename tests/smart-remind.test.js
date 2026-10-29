// Unit tests for Smart Reminders (the pure part of src/js/99-smart-remind.js between @@SMR-CORE markers), with the free-time
// engine (AVAIL) and the reminders core (RM_CORE) it feeds. Run: node tests/smart-remind.test.js (re-runs itself in three time zones)
const fs = require("fs"), path = require("path"), assert = require("assert"), cp = require("child_process");

if (!process.env.SMR_CHILD) {
  let bad = 0;
  ["UTC", "America/New_York", "Europe/Berlin"].forEach(tz => {
    const r = cp.spawnSync(process.execPath, [__filename], {env: Object.assign({}, process.env, {TZ: tz, SMR_CHILD: "1"}), stdio: "inherit"});
    if (r.status !== 0) bad++;
  });
  process.exit(bad ? 1 : 0);
}

const src = f => fs.readFileSync(path.join(__dirname, "..", "src", "js", f), "utf8");
const block = (s, a, b) => { const i = s.indexOf(a), j = s.indexOf(b); assert(i >= 0 && j > i, "block " + a); return s.slice(i, j); };
const S = new Function(block(src("99-smart-remind.js"), "/*@@SMR-CORE*/", "/*@@SMR-CORE-END*/") + ";return SMR_CORE;")();
const R = new Function(block(src("60-reminders.js"), "/*@@RM-CORE*/", "/*@@RM-CORE-END*/") + ";return RM_CORE;")();
const A = new Function(block(src("01-courses.js"), "/* AVAIL-START", "/* AVAIL-END */") + ";return AVAIL;")();

let n = 0; const ok = (c, m) => { n++; assert(c, m); };
const eq = (a, b, m) => { n++; assert.deepStrictEqual(a, b, m); };
const at = (day, hhmm) => { const [y, mo, d] = day.split("-").map(Number), [h, mi] = hhmm.split(":").map(Number); return new Date(y, mo - 1, d, h, mi, 0, 0).getTime(); };
const hhmm = ms => { const d = new Date(ms); return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0"); };
const ymd = ms => { const d = new Date(ms); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const W = {"2026-11-02": "Monday", "2026-11-03": "Tuesday", "2026-11-04": "Wednesday", "2026-11-05": "Thursday", "2026-11-06": "Friday", "2026-11-07": "Saturday", "2026-11-08": "Sunday", "2026-11-09": "Monday"};
const cfg = o => R.cfgOf(Object.assign({}, o || {}));
const T = (id, o) => Object.assign({id, title: "Task " + id, type: "Assignment", due: "2026-11-04", time: "", status: "todo", rem: 1, worked: false}, o);
const run = (o) => S.plan(Object.assign({cfg: cfg(), mode: "avail", sent: {}, fmtWeekday: s => W[s] || s, fmtDay: s => "on " + s}, o));
const w = (a, b) => { const m = x => Number(x.slice(0, 2)) * 60 + Number(x.slice(3)); return {s: m(a), e: m(b)}; };

// A busy week: classes in the morning, a work shift most afternoons; quiet hours 22:00-07:00 (the default)
const FREE = {
  "2026-11-02": [w("12:00", "12:20"), w("18:00", "20:00")],          // a 20-minute gap isn't worth a reminder
  "2026-11-03": [w("07:00", "08:00"), w("19:00", "23:00")],          // the evening runs into quiet hours: 19-22 counts
  "2026-11-04": [w("19:00", "21:00")],
  "2026-11-05": [w("08:00", "10:00")],
  "2026-11-06": [w("13:00", "17:00")],
};
const MON10 = at("2026-11-02", "10:00");

// Tight tasks get one reminder at the start of their next real free window, with an accurate message
{
  const tasks = [
    T("lab", {title: "Lab Report", due: "2026-11-04", time: "09:00", rem: 4.5}),        // 6h free before it: 75% → tight
    T("ps", {title: "Problem Set", due: "2026-11-03", time: "17:00", rem: 5}),          // 3h free before it: more than that
    T("essay", {title: "Essay", due: "2026-11-05", rem: 2}),                            // plenty of time
    T("done", {title: "Old", due: "2026-11-03", rem: 9, status: "done"}),
    T("study", {title: "Study for Exam", type: "Study", due: "2026-11-03", rem: 9}),
    T("tiny", {title: "Sign Up", due: "2026-11-03", rem: 0.25}),
    T("far", {title: "Project", due: "2026-11-12", rem: 40}),
    T("off", {title: "Muted", due: "2026-11-03", rem: 9, remind: "off"}),
    T("past", {title: "Overdue", due: "2026-11-01", rem: 9}),
  ];
  const out = run({now: MON10, tasks, free: FREE});
  eq(out.map(r => r.taskId), ["ps", "lab"], "only the two tight tasks, tightest first in time");
  const ps = out[0], lab = out[1];
  ok(ps.at === at("2026-11-02", "18:00"), "the tightest task takes tonight's 2h window (the 20-minute gap is skipped)");
  eq(ps.body, "You have 2h free tonight and this needs about 5h by 17:00 tomorrow, more than your free time until then. Start now?", "problem set message: " + ps.body);
  ok(ps.id === "r:s:ps:2026-11-02" && ps.kind === "smart" && ps.title === "Problem Set" && ps.key === "ps|2026-11-02", "id, title and key");
  ok(lab.at === at("2026-11-03", "07:00"), "the next task takes the next free window, not the same moment: " + hhmm(lab.at));
  eq(lab.body, "You have 1h free this morning and this needs about 4h 30m by 09:00 tomorrow, more than your free time until then. Start now?", "lab message: from 7:00 only 4h are left before it");
  ok(out.every(r => !R.inQuiet(r.at, cfg())), "nothing in quiet hours");
}

// Due day words, quiet hours cutting a window, and the due time cutting a window
{
  const out = run({now: MON10, tasks: [T("thu", {title: "Reading Response", due: "2026-11-06", time: "12:00", rem: 6})], free: {"2026-11-03": [w("19:00", "23:30")], "2026-11-06": [w("08:00", "10:00")]}});
  eq(out.length, 1, "one reminder");
  ok(out[0].at === at("2026-11-03", "19:00"), "starts at the window");
  eq(out[0].body, "You have 3h free tonight and this needs about 6h by Friday at 12:00, more than your free time until then. Start now?", "window ends at quiet hours; weekday named: " + out[0].body);
  const early = run({now: MON10, tasks: [T("e", {due: "2026-11-03", time: "08:00", rem: 2})], free: {"2026-11-03": [w("05:00", "09:00")]}});
  ok(early.length === 1 && early[0].at === at("2026-11-03", "07:00"), "a window that starts in quiet hours is used from when they end");
  ok(/You have 1h free this morning/.test(early[0].body) && /by 08:00 today/.test(early[0].body), "and its length stops at the due time: " + early[0].body);
  const short = run({now: MON10, tasks: [T("e", {due: "2026-11-03", time: "07:20", rem: 2})], free: {"2026-11-03": [w("05:00", "09:00")]}});
  eq(short.length, 0, "20 minutes before the due time isn't worth a reminder");
  const today = run({now: MON10, tasks: [T("t", {due: "2026-11-02", rem: 1.5})], free: {"2026-11-02": [w("18:00", "20:00")]}});
  ok(today.length === 1 && /by the end of today/.test(today[0].body), "due today with no time: " + (today[0] || {}).body);
}

// Never spam: worked on today, the daily cap, one per task per day, and what already went out
{
  const tasks = [T("lab", {title: "Lab Report", due: "2026-11-04", time: "09:00", rem: 4.5}), T("ps", {title: "Problem Set", due: "2026-11-03", time: "17:00", rem: 5, worked: true})];
  const out = run({now: MON10, tasks, free: FREE});
  ok(out.find(r => r.taskId === "ps").at === at("2026-11-03", "07:00"), "worked on today: no reminder today, the next day's window instead");
  ok(out.find(r => r.taskId === "lab").at === at("2026-11-02", "18:00"), "the other task gets tonight");
  // five tight tasks, lots of free windows today: at most two today
  const many = {"2026-11-02": [w("12:00", "13:00"), w("14:00", "15:00"), w("16:00", "17:00"), w("18:00", "19:00")], "2026-11-03": [w("12:00", "13:00"), w("14:00", "15:00"), w("16:00", "17:00")]};
  const five = run({now: MON10, tasks: ["a", "b", "c", "d", "e"].map(id => T(id, {due: "2026-11-03", time: "18:00", rem: 6})), free: many});
  const per = {}; five.forEach(r => { per[ymd(r.at)] = (per[ymd(r.at)] || 0) + 1; });
  ok(per["2026-11-02"] === 2 && per["2026-11-03"] === 2 && five.length === 4, "two a day at most: " + JSON.stringify(per));
  eq(new Set(five.map(r => r.taskId)).size, five.length, "one per task");
  eq(new Set(five.map(r => r.at)).size, five.length, "never two at the same moment");
  // what went out already counts toward the day and the task
  const tight = [T("lab", {due: "2026-11-04", time: "09:00", rem: 4.5})];
  const later = at("2026-11-02", "18:30");
  const after = run({now: later, tasks: tight, free: FREE, sent: {"lab|2026-11-02": at("2026-11-02", "18:00")}});
  ok(after.length === 1 && after[0].at === at("2026-11-03", "07:00"), "once it went out today, the next one is tomorrow at the earliest");
  const recent = run({now: at("2026-11-02", "18:05"), tasks: tight, free: FREE, sent: {"lab|2026-11-02": at("2026-11-02", "18:00")}});
  ok(recent.length === 1 && recent[0].at === at("2026-11-02", "18:00") && recent[0].id === "r:s:lab:2026-11-02", "one due a few minutes ago stays in the list unchanged, so the app can still show it once");
  const capped = run({now: MON10, tasks: tight, free: FREE, sent: {"x|2026-11-02": at("2026-11-02", "08:00"), "y|2026-11-02": at("2026-11-02", "09:00")}});
  ok(capped.length === 1 && ymd(capped[0].at) === "2026-11-03", "two others went out today, so this one waits for tomorrow");
  eq(run({now: MON10, tasks: tight, free: FREE, cfg: cfg({smart: false})}), [], "switched off: nothing");
  // the record: plans that didn't go out are dropped, what went out is kept a few days
  const rec = S.remember({"old|2026-10-20": 1, "lab|2026-11-02": at("2026-11-02", "08:00"), "gone|2026-11-02": at("2026-11-02", "20:00")}, [{kind: "smart", key: "ps|2026-11-02", at: at("2026-11-02", "18:00")}], MON10);
  eq(Object.keys(rec).sort(), ["lab|2026-11-02", "ps|2026-11-02"], "remember keeps sent and planned, drops stale and unplanned");
}

// Window in progress: wait for the next one (no reminder 'now' that would move every refresh)
{
  const out = run({now: at("2026-11-02", "18:30"), tasks: [T("lab", {due: "2026-11-04", time: "09:00", rem: 4})], free: FREE});
  ok(out.length === 1 && out[0].at === at("2026-11-03", "07:00"), "mid-window, the next window is used");
}

// No availability blocks: the plan's daily study hours, at the nudge time
{
  const daily = {h: 2, today: 2, start: 420, end: 1380};
  const out = run({now: MON10, mode: "daily", daily, tasks: [T("e", {title: "Essay", due: "2026-11-04", rem: 5}), T("r", {title: "Reading", due: "2026-11-06", rem: 3})]});
  eq(out.length, 1, "only the tight task (5h of 6h)");
  ok(out[0].at === at("2026-11-02", "16:00"), "at the study nudge time");
  eq(out[0].body, "This needs about 5h by Wednesday, and your plan has about 6h of study time until then. Start now?", "daily message: " + out[0].body);
  const late = run({now: at("2026-11-02", "17:00"), mode: "daily", daily: {h: 2, today: 1, start: 420, end: 1380}, tasks: [T("e", {due: "2026-11-04", rem: 4})]});
  ok(late.length === 1 && late[0].at === at("2026-11-03", "16:00") && /about 4h of study time/.test(late[0].body), "after today's nudge time it's tomorrow's: " + (late[0] || {}).body);
  const nudge = run({now: MON10, mode: "daily", daily, cfg: cfg({nudgeTime: "23:00"}), tasks: [T("e", {due: "2026-11-04", rem: 5})]});
  eq(nudge.length, 0, "a nudge time inside quiet hours sends nothing");
}

// With the real free-time engine: classes, a café job and placement days (about 7h free before Thursday 1 PM)
{
  const blocks = [
    {id: "cls", type: "class", title: "Lectures", days: [1, 3, 5], start: "09:00", end: "12:00"},
    {id: "job", type: "work", title: "Café", days: [1, 2, 3, 4], start: "13:00", end: "21:00"},
    {id: "pl", type: "shift", title: "Placement", days: [2, 4], start: "07:00", end: "15:00"},
  ].map(A.normBlock);
  const free = {};
  for (let d = "2026-11-02"; d <= "2026-11-09"; d = A.addD(d, 1)) free[d] = A.freeWindows(d, {blocks, cfg: {}}).windows.map(x => ({s: x.s, e: x.e}));
  const out = run({now: MON10, free, tasks: [T("p", {title: "Policy Brief", due: "2026-11-05", time: "13:00", rem: 6}), T("q", {title: "Quiz Prep", due: "2026-11-06", rem: 1})]});
  eq(out.map(r => r.taskId), ["p"], "only the brief is tight");
  const day = ymd(out[0].at), startMin = new Date(out[0].at).getHours() * 60 + new Date(out[0].at).getMinutes(), win = free[day].find(x => x.s === startMin);
  ok(win && out[0].at > MON10, "the reminder starts at one of the engine's free windows: " + day + " " + hhmm(out[0].at));
  ok(out[0].at === at("2026-11-02", "12:00"), "the gap between lectures and the café shift today");
  ok(!R.inQuiet(out[0].at, cfg()), "outside quiet hours");
  const len = Math.min(win.e, 22 * 60) - win.s;
  ok(out[0].body.startsWith(`You have ${S.hm(len)} free`), "the message names that window's length: " + out[0].body);
}

// DST: a window on the day clocks change is still at its wall-clock time
{
  const out = run({now: at("2026-11-01", "08:00"), tasks: [T("d", {due: "2026-11-02", time: "10:00", rem: 3})], free: {"2026-11-01": [w("18:00", "21:00")]}});
  ok(out.length === 1 && hhmm(out[0].at) === "18:00" && ymd(out[0].at) === "2026-11-01", "18:00 on the change-over day");
}

// Into RM_CORE: smart reminders join the list, keep out of quiet hours, and don't duplicate a regular reminder
{
  const now = MON10, base = {now, cfg: {}, tasks: [{id: "lab", title: "Lab Report", type: "Assignment", due: "2026-11-04", time: "09:00", status: "todo"}], occ: [], snoozes: []};
  const sm = (id, ms) => ({id, at: ms, title: "Lab Report", body: "You have 2h free tonight…", taskId: "lab", key: "lab|x", kind: "smart"});
  const out = R.compute(Object.assign({}, base, {smart: [sm("r:s:lab:2026-11-02", at("2026-11-02", "18:00"))]}));
  const s = out.find(r => r.kind === "smart");
  ok(s && s.at === at("2026-11-02", "18:00") && s.taskId === "lab" && s.body === "You have 2h free tonight…", "a smart reminder is in the list as it came");
  ok(out.some(r => r.kind === "task" && r.taskId === "lab"), "regular reminders are still there");
  const dup = R.compute(Object.assign({}, base, {smart: [sm("r:s:lab:2026-11-03", at("2026-11-03", "18:20"))]}));
  ok(!dup.some(r => r.kind === "smart"), "dropped when the regular day-before reminder (18:00) fires within 45 minutes");
  const q = R.compute(Object.assign({}, base, {smart: [sm("r:s:lab:2026-11-02", at("2026-11-02", "23:00"))]}));
  ok(!q.some(r => r.kind === "smart"), "dropped in quiet hours");
  const offc = R.compute(Object.assign({}, base, {cfg: {smart: false}, smart: [sm("r:s:lab:2026-11-02", at("2026-11-02", "18:00"))]}));
  ok(!offc.some(r => r.kind === "smart"), "dropped when Smart Reminders are off");
  ok(R.cfgOf({}).smart === true, "on by default");
}

console.log(`smart-remind.test (${process.env.TZ}): ${n} checks passed`);
