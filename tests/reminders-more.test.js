// Unit tests for Keep Reminding Until Done, extra reminders per task and snooze choices (the RM-CORE block of src/js/60-reminders.js),
// and the extra reminders in the calendar link (src/js/50-calfeed.js)
const fs = require("fs"), path = require("path"), assert = require("assert");
const src = f => fs.readFileSync(path.join(__dirname, "..", "src", "js", f), "utf8");
const block = (s, a, b) => { const i = s.indexOf(a), j = s.indexOf(b); assert(i >= 0 && j > i, "block " + a); return s.slice(i, j); };
const R = new Function(block(src("60-reminders.js"), "/*@@RM-CORE*/", "/*@@RM-CORE-END*/") + ";return RM_CORE;")();
let n = 0; const ok = (c, m) => { n++; assert(c, m); };
const eq = (a, b, m) => { n++; assert.deepStrictEqual(a, b, m); };

const at = (day, hhmm) => { const [y, mo, d] = day.split("-").map(Number), [h, mi] = hhmm.split(":").map(Number); return new Date(y, mo - 1, d, h, mi, 0, 0).getTime(); };
const hm = ms => { const d = new Date(ms); return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0"); };
const NOW = at("2026-11-02", "08:00");
const T = o => Object.assign({id: "t1", title: "Essay", type: "Assignment", due: "2026-11-04", time: "17:00", status: "todo", course: "ENGL 101"}, o);
const run = (tasks, cfg, now) => R.compute({now: now || NOW, tasks, occ: [], cards: [], cfg: Object.assign({quiet: false}, cfg || {}), top: "", snoozes: [], smart: []});
const forT = (list, kind) => list.filter(r => r.taskId === "t1" && (!kind || r.kind === kind));

// Defaults: nothing new happens until it's turned on
{
  const c = R.cfgOf({});
  ok(c.nag === false && c.nagEvery === 15 && c.nagTimes === 5 && c.snooze === 60, "defaults: off, every 15 min, 5 times, snooze 1 hour");
  eq(forT(run([T()]), "nag").length, 0, "off: no repeats");
  const cl = R.cfgOf({nagEvery: 1, nagTimes: 99, snooze: 1});
  ok(cl.nagEvery === 5 && cl.nagTimes === 10 && cl.snooze === 5, "settings are kept in range");
}

// Keep Reminding Until Done: after the last reminder, every N minutes, N times
{
  const L = run([T()], {nag: true, nagEvery: 10, nagTimes: 3});
  const last = Math.max(...forT(L, "task").map(r => r.at)), nags = forT(L, "nag");
  eq(hm(last), "15:00", "the last usual reminder is 2 hours before the due time");
  eq(nags.map(r => hm(r.at)), ["15:10", "15:20", "15:30"], "then every 10 minutes, 3 times");
  ok(nags.every(r => /^Still to do\. Due in /.test(r.body)), "the repeats say it's still to do: " + nags[0].body);
  ok(new Set(nags.map(r => r.id)).size === 3 && nags.every(r => /^r:t:t1:nag\d:/.test(r.id)), "each repeat has its own id, tied to the task (Mark Done on the server clears them by task)");
  eq(forT(run([T({status: "done"})], {nag: true})).length, 0, "a done task gets nothing");
  eq(forT(run([T({nag: false})], {nag: true}), "nag").length, 0, "a task can turn it off for itself");
  eq(forT(run([T({remind: "off"})], {nag: true})).length, 0, "No Reminder means no repeats either");
}
// A task can turn it on for itself, even with it off in settings
{
  const nags = forT(run([T({nag: true})], {nag: false, nagEvery: 30, nagTimes: 2}), "nag");
  eq(nags.map(r => hm(r.at)), ["15:30", "16:00"], "per-task on");
  const late = forT(run([T({nag: true, due: "2026-11-02", time: "08:30"})], {nag: false, nagEvery: 60, nagTimes: 3}, at("2026-11-02", "08:00")), "nag");
  ok(late.some(r => /^Still not done\. Was due /.test(r.body)), "a repeat after the due time says it was due: " + late.map(r => r.body).join(" | "));
}
// Never in quiet hours, never more than a day past due
{
  const nags = forT(run([T({due: "2026-11-03", time: "23:30", remind: "1h"})], {nag: true, nagEvery: 30, nagTimes: 5, quiet: true, quietFrom: "22:00", quietTo: "07:00"}), "nag");
  ok(nags.every(r => !R.inQuiet(r.at, R.cfgOf({quiet: true}))), "no repeats in quiet hours");
  const far = forT(run([T({nag: true, due: "2026-11-02", time: "09:00"})], {nagEvery: 120, nagTimes: 10}, at("2026-11-02", "06:00")), "nag");
  ok(far.every(r => r.at <= at("2026-11-03", "09:00")), "stops a day after the due time");
}
// More than one reminder per task
{
  const L = forT(run([T({remindAlso: ["1w", "1d", "15m", "bogus"]})]), "task").map(r => r.id.split(":")[3]);
  ok(L.includes("1d") && L.includes("h") && L.includes("15m"), "extras are added to the usual reminders: " + L.join(","));
  ok(!L.includes("bogus"), "unknown choices are ignored");
  const one = forT(run([T({remind: "2h", remindAlso: ["1d", "2h"]})]), "task");
  eq(one.length, 2, "an override plus an extra (the same choice twice counts once)");
  const untimed = forT(run([T({time: "", remindAlso: ["15m"]})], {tasks: false}), "task");
  eq(untimed.map(r => hm(r.at)), ["07:30"], "a minutes-before extra on a task without a due time is the morning of the due day");
  eq(R.alsoOf({remindAlso: ["1w", "3d", "1d", "2h", "1h"]}).length, 4, "at most 4 extras");
}
// Snooze choices
{
  const ch = R.snoozeChoices(at("2026-11-02", "14:00"), {dayTime: "18:00", morningTime: "07:30"});
  eq(ch.map(c => c.label), ["10 Minutes", "1 Hour", "This Evening", "Tomorrow Morning"], "four choices in the afternoon");
  eq(hm(ch[2].at), "18:00"); eq(hm(ch[3].at), "07:30");
  ok(new Date(ch[3].at).getDate() === 3, "tomorrow is tomorrow");
  eq(R.snoozeChoices(at("2026-11-02", "17:30"), {dayTime: "18:00"}).map(c => c.label), ["10 Minutes", "1 Hour", "Tomorrow Morning"], "no This Evening when it's nearly evening");
  eq([R.snoozeLabel(60), R.snoozeLabel(120), R.snoozeLabel(15)], ["Snooze 1 Hour", "Snooze 2 Hours", "Snooze 15 Min"], "button labels");
}

// The calendar link carries the extra reminders too
{
  const cf = src("50-calfeed.js");
  const i = cf.indexOf("  const REM_DEF"), j = cf.indexOf("  const trigger = m =>");
  const isTime = t => /^([01]\d|2[0-3]):[0-5]\d$/.test(t || ""), tMin = t => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
  const C = new Function("isTime", "tMin", cf.slice(i, j) + ";return {taskAlarms, remCfgOf};")(isTime, tMin);
  const cfg = C.remCfgOf({reminders: {}}, true);
  const base = C.taskAlarms({due: "2026-11-04", time: "17:00", type: "Assignment"}, "app", cfg);
  const more = C.taskAlarms({due: "2026-11-04", time: "17:00", type: "Assignment", remindAlso: ["1w", "15m"]}, "app", cfg);
  ok(more.length === base.length + 2 && more.includes(-15), "extras become extra calendar alarms: " + more.join(","));
  eq(C.taskAlarms({due: "2026-11-04", time: "17:00", remindAlso: ["1w"]}, 60, cfg), [-60], "a fixed calendar choice ignores them");
  eq(C.taskAlarms({due: "2026-11-04", time: "17:00", remind: "off", remindAlso: ["1w"]}, "app", cfg), [], "No Reminder still means none");
}

console.log(`reminders-more: ${n} checks passed`);
