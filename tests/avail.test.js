// Unit tests for availability blocks and the free-time engine (pure logic extracted from index.html between AVAIL-START and AVAIL-END).
// Run: node tests/avail.test.js   It re-runs itself under three time zones so the DST days (US and EU) are real.
const fs = require("fs"), path = require("path"), assert = require("assert"), cp = require("child_process");

if (!process.env.AV_CHILD) {
  let bad = 0;
  ["UTC", "America/New_York", "Europe/Berlin"].forEach(tz => {
    const r = cp.spawnSync(process.execPath, [__filename], {env: Object.assign({}, process.env, {TZ: tz, AV_CHILD: "1"}), stdio: "inherit"});
    if (r.status !== 0) bad++;
  });
  process.exit(bad ? 1 : 0);
}

const s = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const code = s.slice(s.indexOf("/* AVAIL-START"), s.indexOf("/* AVAIL-END */"));
assert(code.length > 1000, "AVAIL block found");
const A = new Function(code + ";return AVAIL;")();
const TZ = process.env.TZ;
let n = 0; const ok = (c, m) => { n++; assert(c, m); };
const eq = (a, b, m) => { n++; assert.deepStrictEqual(a, b, m); };
const blk = o => A.normBlock(Object.assign({id: "b" + Math.random().toString(36).slice(2, 7), type: "work", title: "T", days: [1], start: "09:00", end: "17:00"}, o));
const free = (date, blocks, extra) => A.freeWindows(date, Object.assign({blocks, cfg: {}}, extra || {}));
const wins = r => r.windows.map(w => w.a + "-" + w.b);

// ---- sanitizing ----
{
  const b = A.normBlock({id: "x", type: "bogus", title: "<b>Hi</b>\n\n" + "x".repeat(200), color: "red;}body{", days: [1, 1, 9, "3", -1, 2.5], start: "25:00", end: "7:5", every: 99, bufB: 9999, bufA: -5});
  ok(b.type === "other" && b.title.indexOf("<") < 0 && b.title.length <= 80, "type/title cleaned");
  ok(b.color === A.TYPES.other.color, "bad color replaced");
  eq(b.days, [1, 3], "days validated");
  ok(b.start === "09:00" && b.end === "17:00", "bad times fall back");
  ok(b.every === 8 && b.bufB === 240 && b.bufA === 0, "numbers clamped");
  ok(A.normBlock({type: "work", days: []}) === null, "no days and no dates means no block");
  ok(A.normBlock(null) === null && A.normBlock([]) === null && A.normBlock("x") === null, "junk rejected");
  const d = A.normBlock({type: "shift", dates: ["2026-02-30", "2026-11-03", "nope", "2026-11-03", "2026-11-05"]});
  eq(d.dates, ["2026-11-03", "2026-11-05"], "roster dates validated, deduped, sorted");
  const many = A.normBlock({type: "shift", dates: Array.from({length: 900}, (_, i) => A.addD("2026-01-01", i))});
  ok(many.dates.length === A.MAX_DATES, "dates capped");
  const av = A.normAvail({blocks: Array.from({length: 250}, (_, i) => ({id: "i" + i, type: "work", days: [1]})), cfg: {dayStart: "99:99", minChunk: 1}});
  ok(av.blocks.length === A.MAX_BLOCKS, "blocks capped");
  ok(av.cfg.dayStart === 420 && av.cfg.minChunk === 5, "cfg sanitized");
  ok(A.normAvail("garbage").blocks.length === 0 && A.normAvail(undefined).cfg.dayEnd === 1380, "bad input gives defaults");
  eq(A.normAvail({blocks: [{id: "a", days: [1]}, {id: "a", days: [2]}]}).blocks.length, 1, "duplicate ids dropped");
  const once = A.normAvail({blocks: [{id: "q", type: "shift", title: "Night", dates: ["2026-11-03"], start: "19:00", end: "07:30", bufB: 20, skip: {"2026-11-03": {start: "20:00", end: "06:00"}}}, {id: "r", days: [1, 3], every: 2, anchor: "2026-11-02", from: "2026-09-01"}], cfg: {dayStart: "08:00", dayEnd: "22:00", recover: true, minChunk: 30}});
  eq(A.normAvail(JSON.parse(JSON.stringify(once))), once, "cleaning is idempotent (also through JSON)");
  ok(once.cfg.dayStart === 480 && once.cfg.dayEnd === 1320 && once.cfg.recover, "cfg minutes survive a second pass");
  const sk = A.normBlock({id: "k", days: [1], skip: {"2026-11-02": {skip: true}, "bad": {skip: true}, "2026-11-09": {start: "10:00", end: "10:00"}, "2026-11-16": {start: "10:00", end: "11:00"}}});
  eq(Object.keys(sk.skip).sort(), ["2026-11-02", "2026-11-16"], "skip map validated");
  ok(A.normBlock({id: "z", type: "shift", days: [1], allDay: true}).start === "00:00", "all-day normalized");
  ok(A.normBlock({id: "z", days: [1], bufB: 30, type: "protected"}).bufB === 0, "protected has no buffers");
}

// ---- which days a block occurs on ----
{
  const wk = blk({days: [2, 4]});               // Tue Thu
  ok(A.occursOn(wk, "2026-11-03") && A.occursOn(wk, "2026-11-05") && !A.occursOn(wk, "2026-11-04"), "weekly days");
  const term = blk({days: [1], from: "2026-09-07", until: "2026-12-11"});
  ok(!A.occursOn(term, "2026-08-31") && A.occursOn(term, "2026-09-07") && A.occursOn(term, "2026-12-07") && !A.occursOn(term, "2026-12-14"), "term range");
  const ab = blk({days: [3], every: 2, anchor: "2026-11-02"});   // A weeks start the week of Nov 2
  ok(A.occursOn(ab, "2026-11-04") && !A.occursOn(ab, "2026-11-11") && A.occursOn(ab, "2026-11-18") && !A.occursOn(ab, "2026-10-28") && A.occursOn(ab, "2026-10-21"), "alternating weeks, both directions");
  const b3 = blk({days: [5], every: 3, anchor: "2026-11-02"});
  ok(A.occursOn(b3, "2026-11-06") && !A.occursOn(b3, "2026-11-13") && !A.occursOn(b3, "2026-11-20") && A.occursOn(b3, "2026-11-27"), "every 3 weeks");
  const roster = blk({type: "shift", days: [], dates: ["2026-11-03", "2026-11-05", "2026-11-08"]});
  ok(A.occursOn(roster, "2026-11-03") && A.occursOn(roster, "2026-11-08") && !A.occursOn(roster, "2026-11-04"), "roster dates");
  const one = blk({days: [], dates: ["2026-12-25"]});
  ok(A.occursOn(one, "2026-12-25") && !A.occursOn(one, "2026-12-26"), "one-off date");
  // parity must survive daylight saving changes
  const dst = blk({days: [0], every: 2, anchor: "2026-03-02"});
  ok(A.occursOn(dst, "2026-03-08") && !A.occursOn(dst, "2026-03-15") && A.occursOn(dst, "2026-03-22") && A.occursOn(dst, "2026-04-05"), "A/B weeks across US spring-forward");
  const dst2 = blk({days: [0], every: 2, anchor: "2026-10-19"});
  ok(A.occursOn(dst2, "2026-10-25") && !A.occursOn(dst2, "2026-11-01") && A.occursOn(dst2, "2026-11-08"), "A/B weeks across the fall changes");
}

// ---- free time basics ----
{
  const r = free("2026-11-04", []);
  eq(wins(r), ["07:00-23:00"], "empty day is one waking window");
  ok(r.total === 960 && r.largest === 960 && !r.none, "empty day totals");
  const r2 = free("2026-11-02", [blk({days: [1], start: "09:00", end: "17:00"})]);
  eq(wins(r2), ["07:00-09:00", "17:00-23:00"], "work block splits the day");
  ok(r2.total === 480 && r2.largest === 360, "total and largest");
  // back-to-back and overlapping
  const bb = free("2026-11-02", [blk({start: "09:00", end: "10:00"}), blk({start: "10:00", end: "11:00"})]);
  eq(wins(bb), ["07:00-09:00", "11:00-23:00"], "back-to-back blocks leave no sliver");
  const ov = free("2026-11-02", [blk({start: "09:00", end: "12:00"}), blk({start: "10:00", end: "14:00", type: "class"})]);
  eq(wins(ov), ["07:00-09:00", "14:00-23:00"], "overlapping blocks merge, not double counted");
  // minimum chunk
  const gap = [blk({start: "10:00", end: "12:00"}), blk({start: "12:20", end: "14:00"})];
  ok(!wins(free("2026-11-02", gap)).includes("12:00-12:20"), "20 minute gap ignored at the default 25");
  ok(wins(free("2026-11-02", gap, {cfg: {minChunk: 15}})).includes("12:00-12:20"), "kept when the minimum is 15");
  // waking window
  eq(wins(free("2026-11-02", [], {cfg: {dayStart: "08:00", dayEnd: "22:00"}})), ["08:00-22:00"], "custom waking window");
  eq(wins(free("2026-11-02", [blk({start: "05:00", end: "08:00"})])), ["08:00-23:00"], "block before waking time trims the start");
  // all-day shift and the whole-day state
  const full = free("2026-11-02", [blk({type: "shift", allDay: true})]);
  ok(full.none && full.windows.length === 0 && full.total === 0, "all-day shift leaves no free time");
  ok(!free("2026-11-03", [blk({type: "shift", allDay: true})]).none, "...but only on its own day");
  // fully blocked by timed blocks
  ok(free("2026-11-02", [blk({start: "06:00", end: "23:30"})]).none, "timed block over the whole window");
  // skipped and moved occurrences
  const sk = blk({start: "09:00", end: "17:00", skip: {"2026-11-02": {skip: true}}});
  eq(wins(free("2026-11-02", [sk])), ["07:00-23:00"], "skipped occurrence frees the day");
  ok(wins(free("2026-11-09", [sk])).length === 2, "other weeks unaffected");
  const mv = blk({start: "09:00", end: "17:00", skip: {"2026-11-02": {start: "13:00", end: "15:00"}}});
  eq(wins(free("2026-11-02", [mv])), ["07:00-13:00", "15:00-23:00"], "changed times for one day");
  // travel buffers
  const tb = free("2026-11-02", [blk({start: "16:00", end: "21:00", bufB: 30, bufA: 30})]);
  eq(wins(tb), ["07:00-15:30", "21:30-23:00"], "travel before and after");
  ok(tb.busy[0].parts.some(p => p.kind === "travel"), "buffer is labelled travel");
  const spill = free("2026-11-02", [blk({type: "shift", days: [2], start: "00:10", end: "06:00", bufB: 30})]);   // starts Tue 00:10: buffer is Mon 23:40-24:00
  eq(wins(spill), ["07:00-23:00"], "Mon unaffected before the 23:00 end");
  eq(wins(free("2026-11-02", [blk({type: "shift", days: [2], start: "00:10", end: "06:00", bufB: 30})], {cfg: {dayEnd: "24:00"}})).length, 1, "waking window cannot pass midnight");
  // protected time and outside events
  eq(wins(free("2026-11-02", [blk({type: "protected", start: "12:00", end: "13:00"})])), ["07:00-12:00", "13:00-23:00"], "protected time is never free");
  const ext = free("2026-11-02", [], {ext: [{start: "10:00", end: "11:00", title: "Bio"}, {start: "10:30", end: "10:30"}, {allDay: true, title: "Birthday"}]});
  eq(wins(ext), ["07:00-10:00", "11:00-23:00"], "classes and events block; zero-length and plain all-day events don't");
  const clin = free("2026-11-02", [], {ext: [{allDay: true, title: "Hospital clinical day", label: ""}]});
  eq(wins(clin), ["07:00-08:00", "16:00-23:00"], "existing all-day placement events keep the 8 hour placement-day rule");
  eq(wins(free("2026-11-02", [], {done: [{s: 600, e: 660}]})), ["07:00-10:00", "11:00-23:00"], "focus already done is subtracted");
  // today clips to now
  eq(wins(free("2026-11-02", [blk({start: "17:00", end: "19:00"})], {nowMin: 16 * 60 + 41})), ["19:00-23:00"], "gap under the minimum after now is dropped");
  eq(wins(free("2026-11-02", [], {nowMin: 20 * 60 + 3})), ["20:05-23:00"], "now rounds up to 5 minutes");
  ok(free("2026-11-02", [], {nowMin: 23 * 60 + 30}).none, "after the waking window nothing is free");
}

// ---- overnight shifts ----
{
  const night = blk({type: "shift", title: "Night", dates: ["2026-11-03"], start: "19:00", end: "07:30"});
  eq(wins(free("2026-11-03", [night])), ["07:00-19:00"], "evening of day 1 is blocked");
  eq(wins(free("2026-11-04", [night])), ["07:30-23:00"], "morning of day 2 is blocked until the shift ends");
  eq(wins(free("2026-11-05", [night])), ["07:00-23:00"], "day 3 is free");
  eq(wins(free("2026-11-04", [night], {cfg: {recover: true}})), ["12:00-23:00"], "recovery rule: no study before noon after a night shift");
  eq(wins(free("2026-11-03", [night], {cfg: {recover: true}})), ["07:00-19:00"], "recovery doesn't touch the shift day");
  const lateEnd = blk({type: "shift", dates: ["2026-11-03"], start: "20:00", end: "13:00"});
  eq(wins(free("2026-11-04", [lateEnd], {cfg: {recover: true}})), ["13:00-23:00"], "shift ending after noon needs no recovery block");
  const dayShift = blk({type: "shift", dates: ["2026-11-03"], start: "07:00", end: "15:00"});
  eq(wins(free("2026-11-04", [dayShift], {cfg: {recover: true}})), ["07:00-23:00"], "recovery only follows overnight shifts");
  const nwork = blk({type: "other", dates: ["2026-11-03"], start: "19:00", end: "07:30"});
  eq(wins(free("2026-11-04", [nwork], {cfg: {recover: true}})), ["07:30-23:00"], "recovery only for shifts and work");
  // weekly overnight: Fri 19:00-07:30 blocks Fri evening and Sat morning
  const wk = blk({type: "shift", days: [5], start: "19:00", end: "07:30"});
  eq(wins(free("2026-11-06", [wk])), ["07:00-19:00"], "weekly overnight, first night");
  eq(wins(free("2026-11-07", [wk])), ["07:30-23:00"], "weekly overnight, next morning");
  eq(wins(free("2026-11-08", [wk])), ["07:00-23:00"], "...and not the one after");
  // skipping the shift skips both halves
  const skipped = Object.assign({}, night, {skip: {"2026-11-03": {skip: true}}});
  eq(wins(free("2026-11-04", [skipped])), ["07:00-23:00"], "skipped night frees the next morning too");
  // display rows: two segments, one key
  const rows = A.occurrences([night], "2026-11-01", "2026-11-10");
  ok(rows.length === 2 && rows[0].key === rows[1].key && rows[0].avail.seg === "head" && rows[1].avail.seg === "tail", "two display rows share a key");
  ok(rows[0].date === "2026-11-03" && rows[0].start === "19:00" && rows[0].end === "23:59" && rows[1].date === "2026-11-04" && rows[1].start === "00:00" && rows[1].end === "07:30", "head and tail times");
  eq(A.occurrences([night], "2026-11-04", "2026-11-04").map(o => o.avail.seg), ["tail"], "range starting on day 2 still shows the morning");
  eq(A.occurrences([night], "2026-11-03", "2026-11-03").map(o => o.avail.seg), ["head"], "range ending on day 1 shows only the evening");
  ok(rows.every(o => o.type === "avail" && o.cls.indexOf("k-av-shift") > 0 && o.label === "Shift / Placement"), "row shape matches the schedule's rows");
  ok(A.occurrences([skipped], "2026-11-01", "2026-11-10").every(o => o.skipped), "skipped rows are flagged");
  const allday = A.occurrences([blk({type: "shift", allDay: true, days: [1]})], "2026-11-02", "2026-11-02")[0];
  ok(allday.allDay && allday.start === "" && allday.end === "", "all-day row has no times, like events");
}

// ---- real durations on daylight saving days (wall-clock windows, real minutes) ----
{
  const win = {dayStart: "00:00", dayEnd: "06:00"};
  const real = d => free(d, [], {cfg: win}).total;
  const exp = {"2026-03-08": TZ === "America/New_York" ? 300 : 360, "2026-11-01": TZ === "America/New_York" ? 420 : 360,
    "2026-03-29": TZ === "Europe/Berlin" ? 300 : 360, "2026-10-25": TZ === "Europe/Berlin" ? 420 : 360, "2026-03-09": 360, "2026-06-15": 360};
  Object.keys(exp).forEach(d => ok(real(d) === exp[d], `${TZ} ${d}: ${real(d)} vs ${exp[d]}`));
  // a block across the changeover
  const spring = free("2026-03-08", [blk({days: [], dates: ["2026-03-08"], start: "01:00", end: "04:00"})], {cfg: win});
  eq(wins(spring), ["00:00-01:00", "04:00-06:00"], "wall-clock windows around a block spanning the gap");
  ok(spring.total === (TZ === "America/New_York" ? 60 + 120 : 180), `${TZ} spring block total ${spring.total}`);
  // ordinary-hours days are the same everywhere
  ok(free("2026-03-08", []).total === 960 && free("2026-11-01", []).total === 960 && free("2026-03-29", []).total === 960 && free("2026-10-25", []).total === 960, "default window unaffected by DST");
  // weekly Sunday shift across both changes, and day numbers never skip
  const sun = blk({type: "shift", days: [0], start: "07:00", end: "19:00"});
  ["2026-03-08", "2026-03-29", "2026-10-25", "2026-11-01"].forEach(d => eq(wins(free(d, [sun])), ["19:00-23:00"], "Sunday shift on " + d));
  eq(A.addD("2026-03-07", 1), "2026-03-08", "addD over spring forward");
  eq(A.addD("2026-11-01", 1), "2026-11-02", "addD over fall back");
  eq(A.addD("2026-03-28", 2), "2026-03-30", "addD over EU change");
  ok(A.dow("2026-03-08") === 0 && A.dow("2026-11-01") === 0 && A.dow("2026-10-25") === 0, "weekdays");
  // overnight shift on the changeover night
  const night = blk({type: "shift", dates: ["2026-03-07"], start: "19:00", end: "07:30"});
  eq(wins(free("2026-03-08", [night])), ["07:30-23:00"], "overnight into US spring-forward morning");
}

// ---- placing work in free windows ----
{
  const W = (a, b) => ({s: a, e: b, min: b - a});
  // "4:15-5:45 PM: Bio lab report (90 min)"
  let p = A.place([W(975, 1080)], [{id: "bio", min: 90}]);
  eq(p.slots.map(x => [x.id, x.s, x.e]), [["bio", 975, 1065]], "90 minute task takes 4:15-5:45 PM");
  ok(Object.keys(p.unplaced).length === 0 && p.placed === 90, "all placed");
  // split across windows
  p = A.place([W(600, 660), W(900, 990)], [{id: "a", min: 120}], {maxSession: 120});
  eq(p.slots.map(x => [x.s, x.e]), [[600, 660], [900, 960]], "task split across two windows");
  ok(p.slots[0].part === 1 && p.slots[0].of === 2 && p.slots[1].part === 2, "part numbering");
  // a long task is split with a break
  p = A.place([W(540, 840)], [{id: "a", min: 150}], {maxSession: 90, breakMin: 10});
  eq(p.slots.map(x => [x.s, x.e]), [[540, 630], [640, 700]], "max session then a break");
  // several tasks in rank order, with a break between
  p = A.place([W(540, 720)], [{id: "a", min: 60}, {id: "b", min: 45}], {maxSession: 90, breakMin: 10});
  eq(p.slots.map(x => [x.id, x.s, x.e]), [["a", 540, 600], ["b", 610, 655]], "ranked order, break between tasks");
  // never into a block: blocks aren't windows, so a too-big load is left over
  p = A.place([W(1200, 1260)], [{id: "a", min: 40}, {id: "b", min: 60}], {breakMin: 10});
  ok(p.slots.length === 1 && p.unplaced.b === 60 && p.slots.every(x => x.e <= 1260), "overflow stays unplaced, never past the window");
  p = A.place([], [{id: "a", min: 30}]);
  ok(p.slots.length === 0 && p.unplaced.a === 30, "no windows, nothing placed");
  // slots from a real day never touch a block
  const day = free("2026-11-02", [blk({start: "16:00", end: "21:00", bufB: 30, bufA: 15})]);
  p = A.place(day.windows, [{id: "a", min: 240}, {id: "b", min: 240}, {id: "c", min: 120}], {cfg: {}});
  const busy = [[930, 1275]];
  ok(p.slots.length > 0 && p.slots.every(x => busy.every(([a, b]) => x.e <= a || x.s >= b)), "no slot overlaps work or its travel");
}

// ---- explaining the day ----
{
  const shift = blk({type: "shift", dates: ["2026-11-03"], title: "Ward shift", start: "11:00", end: "19:30", bufA: 30});
  const r = free("2026-11-03", [shift], {cfg: {dayEnd: "22:00"}, nowMin: 15 * 60});
  eq(wins(r), ["20:00-22:00"], "window after the shift and travel");
  const msg = A.explain(r, {nowMin: 15 * 60});
  ok(/on shift until 8 PM/.test(msg) && /free window is 8–2?10? ?PM|free window is 8.*10 PM/.test(msg), msg);
  ok(/^Free for the rest of today/.test(A.explain(free("2026-11-03", []), {nowMin: 600})), "no block now: just lists the windows");
  const none = free("2026-11-03", [blk({type: "shift", allDay: true, dates: ["2026-11-03"]})]);
  ok(A.explain(none, {nowMin: 600}) === "No free time today. You're on shift all day.", "no free time message: " + A.explain(none, {nowMin: 600}));
  const rec = free("2026-11-04", [blk({type: "shift", dates: ["2026-11-03"], start: "19:00", end: "07:30"})], {cfg: {recover: true}, nowMin: 8 * 60});
  ok(/recovering from your night shift until 12 PM/.test(A.explain(rec, {nowMin: 8 * 60})), A.explain(rec, {nowMin: 8 * 60}));
}

// ---- typing helpers ----
{
  const T = "2026-10-03";
  eq(A.parseDates("Mon Nov 3, Wed Nov 5, Sat Nov 8", T).dates, ["2026-11-03", "2026-11-05", "2026-11-08"], "roster text");
  eq(A.parseDates("11/10, 11/12", T).dates, ["2026-11-10", "2026-11-12"], "m/d");
  eq(A.parseDates("Nov 12-14", T).dates, ["2026-11-12", "2026-11-13", "2026-11-14"], "range in one month");
  eq(A.parseDates("2026-11-10; 3 Dec and Jan 2", T).dates, ["2026-11-10", "2026-12-03", "2027-01-02"], "iso, d Mon, year rolls over");
  eq(A.parseDates("Feb 30, banana, 13/45", T), {dates: [], bad: ["Feb 30", "banana", "13/45"]}, "bad dates reported");
  eq(A.parseDates("9/1", T).dates, ["2026-09-01"], "recent past date stays this year");
  eq(A.parseDates("Aug 1", T).dates, ["2027-08-01"], "older date means next year");
  eq(A.parseDates("11/3/27", T).dates, ["2027-11-03"], "two digit year");
  const q = A.parseQuick("work Tue Thu 4-9pm");
  ok(q && q.type === "work" && q.days.join() === "2,4" && q.start === "16:00" && q.end === "21:00", "work Tue Thu 4-9pm");
  const q2 = A.parseQuick("shift 7a-7:30p Mon Wed Fri");
  ok(q2 && q2.type === "shift" && q2.days.join() === "1,3,5" && q2.start === "07:00" && q2.end === "19:30", "shift 7a-7:30p Mon Wed Fri");
  const q3 = A.parseQuick("Placement Mon-Fri 8am-4pm");
  ok(q3 && q3.type === "shift" && q3.days.join() === "1,2,3,4,5" && q3.start === "08:00" && q3.end === "16:00", "day range");
  const q4 = A.parseQuick("shift 7p-7a Sat");
  ok(q4 && q4.start === "19:00" && q4.end === "07:00", "overnight");
  const q5 = A.parseQuick("work weekdays 9-5pm");
  ok(q5 && q5.start === "09:00" && q5.end === "17:00" && q5.days.length === 5, "9-5pm");
  ["work on bio report friday 5pm", "bio quiz fri 2pm", "read chapter 4 tue", "work Tue Thu", "shift 4-9 Mon", "clinical paperwork Mon 7a-3p", "class", ""].forEach(t => ok(A.parseQuick(t) === null, "not a block: " + t));
}

console.log(`avail.test.js (${TZ}): ${n} checks passed`);
