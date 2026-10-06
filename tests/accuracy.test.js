// Unit tests for the planning-accuracy model (pure logic extracted from index.html between /*ACC-START*/ and /*ACC-END*/).  Run: node tests/accuracy.test.js
const fs = require("fs"), path = require("path"), assert = require("assert"), cp = require("child_process");
const TZS = ["UTC", "America/New_York", "America/Los_Angeles", "Europe/London", "Australia/Sydney", "Pacific/Auckland", "Asia/Kolkata"];
if (!process.env.ACC_TZ_CHILD && !process.env.ACC_NO_TZ) {
  for (const tz of TZS) {
    const r = cp.spawnSync(process.execPath, [__filename], {env: Object.assign({}, process.env, {TZ: tz, ACC_TZ_CHILD: "1"}), encoding: "utf8"});
    process.stdout.write(`[${tz}] ${r.stdout.trim().split("\n").pop()}\n`);
    if (r.status !== 0) { process.stderr.write(r.stderr + r.stdout); process.exit(1); }
  }
  process.exit(0);
}
const s = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const code = s.slice(s.indexOf("/*ACC-START*/"), s.indexOf("/*ACC-END*/"));
const A = new Function(code + ";return ACC;")();
let n = 0; const ok = (c, m) => { n++; assert(c, m); };
const near = (a, b, e, m) => ok(Math.abs(a - b) <= e, `${m}: ${a} vs ${b}`);
const NOW = new Date(2026, 9, 6, 15, 0).getTime(), DAY = 864e5;
const done = (o) => Object.assign({id: "t" + Math.random(), type: "Assignment", status: "done", hours: 2, courseId: "c1", checklist: [], doneAt: NOW - 3 * DAY}, o);

// history parsing: both formats, and the old regex still reads the old format
{
  ok(A.entry({at: 5, text: "Focus session: 25m"}).min === 25 && A.entry({at: 5, text: "Focus session: 25m"}).kind === "focus", "focus entry");
  ok(A.entry({at: 5, text: "Logged time: 45m"}).min === 45 && A.entry({at: 5, text: "Logged time: 45m"}).kind === "logged", "logged entry");
  ok(A.entry({at: 5, text: "Status: To Do → Complete"}) === null && A.entry({text: "Logged time: 5m"}) === null && A.entry(null) === null, "other text ignored");
  ok(/^Focus session:? (\d+)m/.exec("Focus session: 12m")[1] === "12", "legacy regex");
}
// durations typed by people
{
  const d = A.parseDur;
  ok(d("90") === 90 && d("45m") === 45 && d("1h") === 60 && d("1.5h") === 90 && d("1h30") === 90 && d("1h 30m") === 90 && d("1:30") === 90 && d("2 hours") === 120 && d("1,5h") === 90, "durations");
  ok(d("") === 0 && d("abc") === 0 && d("-5") === 0 && d(null) === 0, "bad durations are 0");
}
// no data: exactly 1
{
  const S = A.samples([], NOW); ok(S.length === 0 && A.global(S).r === 1 && A.ratio(S, "Lab", "c1").r === 1, "no data = 1");
  const two = A.samples([done({focusMin: 240}), done({focusMin: 240})], NOW);
  ok(A.global(two).r === 1 && A.global(two).level === "none", "two samples are not enough for a global ratio");
  ok(A.samples([done({focusMin: 10})], NOW).length === 0, "under 15 timed minutes is not a sample");
  ok(A.samples([done({focusMin: 240, status: "todo"})], NOW).length === 0 && A.samples([done({focusMin: 240, hours: null})], NOW).length === 0 && A.samples([done({focusMin: 240, type: "Exam"})], NOW).length === 0 && A.samples([done({focusMin: 240, prepFor: "x"})], NOW).length === 0, "open, unestimated, exam and prep tasks are not samples");
  ok(A.samples([done({focusMin: 240, checklist: [{done: true}, {done: false}]})], NOW).length === 0, "timer ratios need a finished checklist");
}
// a 2h task that took 4h, five times: the ratio rises toward 2 but is shrunk and clamped
{
  const T = Array.from({length: 5}, () => done({focusMin: 240}));
  const g = A.global(A.samples(T, NOW));
  ok(g.r > 1.5 && g.r <= 1.8, "global rises: " + g.r);
  const big = A.global(A.samples(Array.from({length: 30}, () => done({focusMin: 600})), NOW));
  ok(big.r === 1.8, "global is clamped at 1.8: " + big.r);
  const quick = A.global(A.samples(Array.from({length: 30}, () => done({focusMin: 20, hours: 2, checklist: []})), NOW));
  ok(quick.r >= 0.7 && quick.r <= 1.0, "global never below 0.7: " + quick.r);
}
// per-type and per-course, with shrinkage toward the level above
{
  const T = [].concat(Array.from({length: 6}, () => done({type: "Lab", courseId: "c1", focusMin: 240})), Array.from({length: 6}, () => done({type: "Reading", courseId: "c1", focusMin: 60})), Array.from({length: 3}, () => done({type: "Lab", courseId: "c2", focusMin: 120})));
  const S = A.samples(T, NOW), lab = A.ratio(S, "Lab", "c9"), rd = A.ratio(S, "Reading", "c1"), c2 = A.ratio(S, "Lab", "c2"), c1 = A.ratio(S, "Lab", "c1");
  ok(lab.level === "type" && rd.level === "course" && lab.r > rd.r, `types differ: ${lab.r} vs ${rd.r}`);
  ok(c2.level === "course" && c2.r < lab.r && c2.r > 1, "a course with few tasks is pulled toward the type's ratio: " + c2.r + " vs " + lab.r);
  ok(c1.level === "course" && c1.r >= lab.r - 0.01, "the course that matches the type keeps it: " + c1.r);
  ok(A.ratio(S, "Quiz", "c1").level === "global", "an unseen type uses the global ratio");
  ok(A.ratio(S, "Lab", "c1").r <= 2.2 && A.ratio(S, "Reading", "c1").r >= 0.6, "group clamps");
}
// outlier resistance and recency
{
  const base = Array.from({length: 7}, () => done({focusMin: 150}));          // 1.25x
  const withOut = base.concat([done({focusMin: 1400})]);                         // one 11.7x task (capped at 4x)
  const a = A.global(A.samples(base, NOW)).r, b = A.global(A.samples(withOut, NOW)).r;
  ok(Math.abs(a - b) <= 0.1, `one huge task barely moves it: ${a} vs ${b}`);
  const old = Array.from({length: 6}, () => done({focusMin: 360, doneAt: NOW - 300 * DAY})).concat(Array.from({length: 6}, () => done({focusMin: 120, doneAt: NOW - 2 * DAY})));
  const g = A.global(A.samples(old, NOW)).r;
  ok(g < 1.2, "recent tasks outweigh old ones: " + g);
  const part = A.samples([done({focusMin: 20, hours: 4, checklist: []})], NOW)[0];
  ok(part.w < 0.5, "a tiny timer total on a big estimate counts for less: " + part.w);
}
// self-reports count for less than the timer
{
  const t = A.samples([done({actualMin: 240}), done({feel: "l"}), done({feel: "q"}), done({feel: "r"}), done({focusMin: 240})], NOW);
  const by = k => t.find(x => x.src === k);
  ok(by("said").w === by("said").w && by("said").w < by("timer").w && by("feel").w < by("said").w, "weights: timer > typed > tap");
  near(t.find(x => x.src === "feel" && x.r > 1).r, 1.5, 1e-9, "longer = 1.5x");
  ok(A.samples([done({focusMin: 10, feel: "l"})], NOW).length === 0, "a tap is ignored when some time was tracked but too little");
  ok(A.samples([done({focusMin: 600, actualMin: 120})], NOW)[0].src === "timer", "the larger of timer and typed time wins");
}
// velocity: needs data, gentle, clamped
{
  const mk = (days, per, h) => { const out = []; for (let i = 1; i <= days; i++) for (let k = 0; k < per; k++) out.push(done({hours: h, doneAt: NOW - i * DAY - k * 1000, created: NOW - 40 * DAY})); return out; };
  ok(A.velocity([], NOW, 3).scale === 1 && !A.velocity([], NOW, 3).ok, "no data");
  ok(!A.velocity(mk(4, 1, 1), NOW, 3).ok, "too few days");
  ok(!A.velocity(mk(10, 1, 1).filter((t, i) => i < 5), NOW, 3).ok, "too few tasks");
  const fast = A.velocity(mk(28, 3, 2), NOW, 3);       // 6h/day against 3h
  ok(fast.ok && fast.scale === 1.2, "clamped high: " + fast.scale);
  const slow = A.velocity(mk(28, 1, 0.25).concat([]), NOW, 6);   // 0.25h/day against 6h
  ok(slow.ok && slow.scale === 0.8, "clamped low: " + slow.scale);
  const mid = A.velocity(mk(28, 1, 3), NOW, 3);
  ok(mid.ok && mid.scale === 1, "matching your setting changes nothing: " + mid.scale);
  ok(A.velocity(mk(28, 1, 2), NOW, 0).scale === 1, "no daily hours set");
  ok(fast.wk.every(v => v >= 0.85 && v <= 1.15) && fast.wk.length === 7, "weekday factors clamped");
  // a weekday-heavy pattern shows up, softly
  const wkTasks = []; for (let i = 1; i <= 28; i++) { const d = new Date(NOW - i * DAY); if (d.getDay() === 0 || d.getDay() === 6) continue; for (let k = 0; k < 2; k++) wkTasks.push(done({hours: 2, doneAt: d.getTime() - k * 1000, created: NOW - 60 * DAY})); }
  const v = A.velocity(wkTasks, NOW, 3);
  ok(v.ok && v.wk[0] < 1 && v.wk[6] < 1 && v.wk[3] > 1, "weekends lighter, weekdays heavier: " + v.wk.join());
  ok(!A.velocity(mk(28, 2, 1).map(t => Object.assign(t, {created: t.doneAt - 5000})), NOW, 3).ok, "tasks added already finished don't count");
}
// lateness: needs 5, only last-minute people are nudged
{
  const mk = (leadDays, count) => Array.from({length: count}, (_, i) => { const d = new Date(NOW - (3 + i) * DAY), due = new Date(d.getFullYear(), d.getMonth(), d.getDate() + leadDays); return done({doneAt: d.getTime(), due: `${due.getFullYear()}-${String(due.getMonth() + 1).padStart(2, "0")}-${String(due.getDate()).padStart(2, "0")}`}); });
  ok(A.lateness(mk(0, 4), NOW).nudge === 1, "needs 5 tasks");
  const last = A.lateness(mk(0, 8), NOW), early = A.lateness(mk(4, 8), NOW), mixed = A.lateness(mk(0, 4).concat(mk(3, 4)), NOW);
  ok(last.nudge === 1.08 && last.share === 1, "always last-minute: " + last.nudge);
  ok(early.nudge === 1 && early.med >= 3, "early finishers get no nudge");
  ok(mixed.nudge >= 1 && mixed.nudge < 1.08, "half and half is a small nudge or none: " + mixed.nudge);
  ok(A.lateness(mk(-30, 8), NOW).n === 0, "check-offs more than a week late are ignored");
}
// when you work
{
  const at = (h) => new Date(2026, 9, 1, h, 30).getTime();
  const T = [{status: "todo", history: [{at: at(20), text: "Focus session: 50m"}, {at: at(21), text: "Focus session: 45m"}, {at: at(23), text: "Logged time: 120m"}, {at: at(20), text: "Created"}]}];
  const b = A.bins(T, [], NOW).bins;
  ok(b[20] === 50 && b[21] === 45, "timer sessions land in their hour");
  ok(b[23] === 0, "hand-logged time says nothing about when you work (it is stamped when typed in)");
  const none = A.peakOf(b, 200); ok(none === null, "below the threshold there is no peak");
  const p = A.peakOf(b, 90); ok(p && p.hours.includes(20) && p.hours.includes(21) && /^\d\d:00 to \d\d:00$/.test(p.text), "peak: " + (p && p.text));
  // never uses the timer: finished tasks and ticks
  const D = Array.from({length: 4}, (_, i) => done({doneAt: new Date(2026, 9, 1 + i % 3, 10, 5).getTime()}));
  const ticks = [at(10), at(10), at(11), at(11)];
  const e = A.bins(D, ticks, NOW, {noHistory: true});
  ok(e.events === 8 && e.bins[10] === 100 + 16 && e.bins[11] === 16 && A.peakOf(e.bins, 90).hours.includes(10), "completions and ticks count: " + e.bins[10]);
  ok(A.bins(D, [NOW - 40 * DAY], NOW).events === 4, "ticks older than 30 days are ignored");
}
// SBTIME readers
{
  const d1 = new Date(2026, 9, 4, 10), d2 = new Date(2026, 9, 5, 22);
  const T = [{courseId: "c1", status: "todo", history: [{at: d1.getTime(), text: "Focus session: 25m"}, {at: d1.getTime() + 1000, text: "Logged time: 15m"}]},
    {courseId: "c2", status: "done", doneAt: d2.getTime(), history: [{at: d2.getTime(), text: "Logged time: 30m"}]}, {courseId: "", status: "done", doneAt: new Date(2026, 9, 6, 9).getTime(), history: []}];
  const md = A.minutesByDay(T, "2026-10-04", "2026-10-06");
  ok(md["2026-10-04"] === 40 && md["2026-10-05"] === 30 && !md["2026-10-06"], "minutesByDay " + JSON.stringify(md));
  const mc = A.minutesByCourse(T, "2026-10-04", "2026-10-04"); ok(mc.c1 === 40 && !mc.c2, "minutesByCourse " + JSON.stringify(mc));
  const wd = A.workedDays(T, "2026-10-01", "2026-10-31"); ok(wd.has("2026-10-04") && wd.has("2026-10-05") && wd.has("2026-10-06") && wd.size === 3, "workedDays includes a completed task's day: " + [...wd]);
  ok(A.workedDays(T, "2026-10-05", "2026-10-05").size === 1, "range respected");
}
console.log(`accuracy: ${n} checks passed`);
