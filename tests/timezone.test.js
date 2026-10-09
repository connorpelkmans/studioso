// node tests/timezone.test.js
// Runs the app's real date helpers (extracted from index.html) under several TZ settings: DST changes, travel zones, +14, +5:30.
// Model under test: a due date is a floating calendar day and a due time a wall-clock reading ("Nov 1, 11:59 PM" stays that
// wherever the device is). Day maths never uses 24-hour ms steps. Instants from school sites become wall-clock in the HOME zone.
const fs = require("fs"), path = require("path"), assert = require("assert"), cp = require("child_process");
const ZONES = ["America/Los_Angeles", "America/New_York", "Europe/London", "Europe/Berlin", "Asia/Kolkata", "Pacific/Auckland", "Pacific/Apia", "Pacific/Kiritimati", "UTC"];

if (!process.env.TZ_CHILD) {
  let bad = 0;
  for (const tz of ZONES) {
    const r = cp.spawnSync(process.execPath, [__filename], { env: Object.assign({}, process.env, { TZ: tz, TZ_CHILD: "1" }), encoding: "utf8" });
    const last = (r.stdout || "").trim().split("\n").pop();
    console.log(`${tz.padEnd(22)} ${r.status === 0 ? "ok" : "FAIL"}  ${last}`);
    if (r.status !== 0) { bad++; console.log((r.stdout || "") + (r.stderr || "")); }
  }
  process.exit(bad ? 1 : 0);
}

const src = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const between = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i); assert(i > 0 && j > i, "marker missing: " + a); return src.slice(i, j); };

// A Date whose "now" can be set, so todayISO() and friends can be run at 23:30 and across a clock change.
class FakeDate extends Date { constructor(...a) { if (!a.length) super(FakeDate.at); else super(...a); } static now() { return FakeDate.at; } }
FakeDate.at = Date.now();
const at = (y, m, d, h = 0, mi = 0) => { FakeDate.at = new Date(y, m - 1, d, h, mi).getTime(); };

const APP = new Function("Date", between("/* ---------- Dates ---------- */", "/* ---------- State ---------- */") + "; return {iso, parse, todayISO, dayDiff, addDays, isDate, mondayOf, fmtTime};")(FakeDate);
const TZ = new Function("Date", between("/* TZ-CORE-START */", "/* TZ-CORE-END */") + "; return SBTZ_CORE;")(FakeDate);
const ICS = new Function(between("// ==== STUDYBOARD ICS CORE START ====", "// ==== STUDYBOARD ICS CORE END ====") + "; return SBICS;")();
let n = 0; const t = (name, fn) => { try { fn(); n++; } catch (e) { console.log("FAIL -", name); throw e; } };

// 1. 'today' is the local calendar day, also in the evening (toISOString().slice(0,10) is the UTC day: wrong for US zones after 4 or 5 PM).
t("todayISO at 23:30 local is the local day", () => {
  at(2026, 11, 1, 23, 30); assert.strictEqual(APP.todayISO(), "2026-11-01"); assert.strictEqual(TZ.todayLocal(new FakeDate()), "2026-11-01");
  at(2026, 11, 2, 0, 5); assert.strictEqual(APP.todayISO(), "2026-11-02");
  at(2026, 12, 31, 23, 59); assert.strictEqual(APP.todayISO(), "2026-12-31");
  at(2027, 1, 1, 0, 0); assert.strictEqual(APP.todayISO(), "2027-01-01");
});
t("parse of a date-only string is local midnight, not UTC", () => {
  for (const s of ["2026-11-01", "2026-03-08", "2026-10-25", "2028-02-29"]) { const d = APP.parse(s); assert.strictEqual(APP.iso(d), s); assert.strictEqual(d.getHours(), 0); }
});

// 2. Day arithmetic across every clock change in 2026 to 2029: app helpers and the shared core agree with a pure UTC reference.
t("addDays and dayDiff match a UTC reference for every day 2026 to 2029", () => {
  const ref = (s, k) => { const d = new Date(Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10) + k)); return d.getUTCFullYear() + "-" + String(d.getUTCMonth() + 1).padStart(2, "0") + "-" + String(d.getUTCDate()).padStart(2, "0"); };
  let s = "2026-01-01";
  for (let i = 0; i < 365 * 4 + 1; i++) {
    for (const k of [1, -1, 7, 30]) { const want = ref(s, k); assert.strictEqual(APP.addDays(s, k), want, `app addDays ${s}+${k}`); assert.strictEqual(TZ.addDays(s, k), want, `core addDays ${s}+${k}`); assert.strictEqual(APP.dayDiff(s, want), k, `app dayDiff ${s}..${want}`); assert.strictEqual(TZ.dayDiff(s, want), k, `core dayDiff ${s}..${want}`); }
    s = ref(s, 1);
  }
});
t("clock-change days", () => {
  for (const [a, b, k] of [["2026-03-07", "2026-03-09", 2], ["2026-03-28", "2026-03-30", 2], ["2026-10-24", "2026-10-26", 2], ["2026-10-31", "2026-11-02", 2], ["2026-03-08", "2026-03-09", 1], ["2026-11-01", "2026-11-02", 1]]) {
    assert.strictEqual(APP.dayDiff(a, b), k); assert.strictEqual(TZ.dayDiff(a, b), k); assert.strictEqual(APP.addDays(a, k), b);
  }
});
t("leap day, month and year boundaries", () => {
  assert.strictEqual(APP.addDays("2028-02-28", 1), "2028-02-29"); assert.strictEqual(APP.addDays("2028-02-28", 2), "2028-03-01");
  assert.strictEqual(APP.addDays("2027-02-28", 1), "2027-03-01"); assert.strictEqual(APP.addDays("2026-12-31", 1), "2027-01-01");
  assert.strictEqual(APP.addDays("2027-01-01", -1), "2026-12-31"); assert.strictEqual(APP.dayDiff("2028-02-28", "2028-03-01"), 2); assert.strictEqual(APP.dayDiff("2026-12-31", "2027-01-01"), 1);
  assert.strictEqual(TZ.dayDiff("2027-01-01", "2028-01-01"), 365); assert.strictEqual(TZ.dayDiff("2028-01-01", "2029-01-01"), 366);
});
t("weekday and week start (Monday)", () => {
  assert.strictEqual(TZ.weekday("2026-11-01"), 0); assert.strictEqual(TZ.weekday("2028-02-29"), 2); assert.strictEqual(TZ.weekday("2026-03-08"), 0);
  for (const [d, mon] of [["2026-11-01", "2026-10-26"], ["2026-11-02", "2026-11-02"], ["2026-11-08", "2026-11-02"], ["2026-10-25", "2026-10-19"], ["2026-03-29", "2026-03-23"], ["2027-01-01", "2026-12-28"], ["2028-02-29", "2028-02-28"]]) {
    assert.strictEqual(APP.mondayOf(d), mon, "app " + d); assert.strictEqual(TZ.mondayOf(d), mon, "core " + d);
  }
});

// 3. Streaks: one step per local day, whatever the length of the day.
t("a streak runs unbroken across both clock changes", () => {
  for (const [from, days] of [["2026-10-20", 20], ["2026-03-01", 40], ["2026-10-20", 3]]) {
    let s = { cur: 0, best: 0, last: "" }, d = from;
    for (let i = 0; i < days; i++) {
      // the app's rule (noteProgress): extend when last === yesterday
      const next = TZ.streakStep(s, d); assert.strictEqual(next.cur, i + 1, `core streak day ${d}`);
      const app = APP.addDays(d, -1) === s.last ? s.cur + 1 : 1; assert.strictEqual(app, i + 1, `app streak day ${d}`);
      s = next; d = APP.addDays(d, 1);
    }
  }
  let s = TZ.streakStep({}, "2026-11-01"); s = TZ.streakStep(s, "2026-11-03"); assert.strictEqual(s.cur, 1, "a missed day resets");
});

// 4. Overdue classification at the edges, including the repeated hour when the clocks fall back.
t("due today / overdue at 23:58, 23:59:59 and 00:01", () => {
  const task = { due: "2026-11-01", time: "23:59", status: "todo" };
  const cls = (y, m, d, h, mi) => TZ.dueClass(task, new Date(y, m - 1, d, h, mi).getTime());
  assert.strictEqual(cls(2026, 11, 1, 0, 0), "today"); assert.strictEqual(cls(2026, 11, 1, 1, 30), "today"); assert.strictEqual(cls(2026, 11, 1, 23, 58), "today");
  assert.strictEqual(cls(2026, 11, 2, 0, 1), "overdue"); assert.strictEqual(cls(2026, 10, 31, 23, 59), "tomorrow"); assert.strictEqual(cls(2026, 10, 30, 12, 0), "later");
  assert.strictEqual(TZ.dueClass({ due: "2026-11-01", status: "done" }, new Date(2026, 10, 5).getTime()), "none");
  assert.strictEqual(TZ.dueClass({ due: "2026-11-01" }, new Date(2026, 10, 1, 23, 59, 30).getTime()), "today", "no time: due at the end of the day");
  assert.strictEqual(TZ.dueClass({ due: "2026-11-01" }, new Date(2026, 10, 2, 0, 0, 1).getTime()), "overdue");
  // the spring-forward day: the 2:30 AM wall time may not exist; still the same calendar day
  assert.strictEqual(TZ.dueClass({ due: "2026-03-08", time: "02:30" }, new Date(2026, 2, 8, 1, 0).getTime()), "today");
  assert.strictEqual(TZ.dueMs("2026-11-01", "23:59") % 60000, 0); assert.strictEqual(new Date(TZ.dueMs("2026-11-01", "23:59")).getHours(), 23);
  assert.strictEqual(new Date(TZ.dueMs("2026-11-01", "")).getHours(), 23);
});

// 5. Instants from school sites (Canvas due_at is UTC) become the wall-clock time in the HOME zone, so a trip doesn't move deadlines.
t("wallIn / wallOfIso convert a UTC instant to a zone's wall clock", () => {
  const cases = [["2026-11-02T07:59:00Z", "America/Los_Angeles", "2026-11-01", "23:59"], ["2026-11-02T07:59:00Z", "America/Chicago", "2026-11-02", "01:59"],   // (not Vancouver: newer time zone data has British Columbia on permanent daylight time from 2026, so its answer depends on the runtime)
    ["2026-11-02T07:59:00Z", "Asia/Tokyo", "2026-11-02", "16:59"], ["2026-11-02T07:59:00Z", "Asia/Kolkata", "2026-11-02", "13:29"], ["2026-11-02T07:59:00Z", "Pacific/Kiritimati", "2026-11-02", "21:59"],
    ["2026-11-02T07:59:00Z", "Pacific/Auckland", "2026-11-02", "20:59"], ["2026-11-02T07:59:00Z", "Pacific/Apia", "2026-11-02", "20:59"],
    ["2026-10-30T06:59:00Z", "America/Los_Angeles", "2026-10-29", "23:59"],   // still PDT
    ["2026-03-09T06:59:00Z", "America/Los_Angeles", "2026-03-08", "23:59"],   // the day clocks sprang forward
    ["2026-10-26T04:59:00Z", "Europe/London", "2026-10-26", "04:59"], ["2026-10-25T22:59:00Z", "Europe/Berlin", "2026-10-25", "23:59"], ["2026-10-26T22:59:00Z", "Europe/Berlin", "2026-10-26", "23:59"]];
  for (const [iso, tz, d, tm] of cases) { const w = TZ.wallOfIso(iso, tz); assert.deepStrictEqual(w, { date: d, time: tm }, `${iso} in ${tz}`); }
  assert.deepStrictEqual(TZ.wallOfIso("2026-11-01", "Asia/Tokyo"), { date: "2026-11-01", time: "" }, "a bare date is floating");
  assert.strictEqual(TZ.wallOfIso("nope", "UTC"), null); assert.strictEqual(TZ.wallIn(0, "Not/AZone"), null);
});
t("LMS localDT: bare dates float, instants use the home zone (never the travel zone)", () => {
  const code = between("const localDT = s => {", "\n  };") + "\n  };";
  const mk = home => { const SBTZ = { schoolZone: () => home, wallIn: TZ.wallIn }; return new Function("window", "SBTZ", "isDate", "iso", "pad", code + "; return localDT;")({ SBTZ }, SBTZ, APP.isDate, APP.iso, n => String(n).padStart(2, "0")); };
  const la = mk("America/Los_Angeles"), tokyo = mk("Asia/Tokyo"), none = mk(null);
  assert.deepStrictEqual(la("2026-11-02T07:59:00Z"), { date: "2026-11-01", time: "23:59" });
  assert.deepStrictEqual(tokyo("2026-11-02T07:59:00Z"), { date: "2026-11-02", time: "16:59" });
  assert.deepStrictEqual(la("2026-11-01"), { date: "2026-11-01", time: "" }); assert.deepStrictEqual(none("2026-11-01"), { date: "2026-11-01", time: "" });
  const d = new Date("2026-11-02T07:59:00Z"); assert.deepStrictEqual(none("2026-11-02T07:59:00Z"), { date: APP.iso(d), time: String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0") }, "no home zone: device zone");
  assert.strictEqual(la(""), null); assert.strictEqual(la("garbage"), null);
});
t("travel: a deadline synced from home keeps its wall-clock whatever the device zone", () => {
  // The same Canvas instant, converted in the home zone, gives the same task on every device zone.
  const w = TZ.wallOfIso("2026-11-02T07:59:00Z", "America/Los_Angeles"); assert.deepStrictEqual(w, { date: "2026-11-01", time: "23:59" });
  assert.strictEqual(TZ.zoneChanged("America/Los_Angeles", "Asia/Tokyo"), true); assert.strictEqual(TZ.zoneChanged("America/Los_Angeles", "America/Los_Angeles"), false); assert.strictEqual(TZ.zoneChanged("", "Asia/Tokyo"), false);
});

// 6. ICS: floating wall-clock times written with a TZID and a VTIMEZONE that carries the clock change, and read back unchanged.
t("ICS round trip across the November clock change", () => {
  const tasks = [{ id: "a", title: "Lab report", courseId: "c1", due: "2026-10-31", time: "23:59", status: "todo", type: "Assignment" }, { id: "b", title: "Essay", courseId: "c1", due: "2026-11-01", time: "23:59", status: "todo", type: "Assignment" }, { id: "c", title: "Quiz", courseId: "c1", due: "2026-11-02", time: "09:00", status: "todo", type: "Quiz" }];
  const data = { tasks, courses: [{ id: "c1", name: "Biology 101", code: "BIO 101" }], events: [], settings: {} };
  const now = Date.UTC(2026, 9, 3, 12);
  for (const tz of ["America/Los_Angeles", "Europe/Berlin", "Asia/Kolkata", "Pacific/Auckland"]) {
    const out = ICS.build(data, { tz, pastDays: 60 }, now, true), txt = out.text;
    assert(/BEGIN:VTIMEZONE/.test(txt) && txt.includes("TZID:" + tz), "VTIMEZONE for " + tz);
    const lines = txt.replace(/\r\n[ \t]/g, "").split(/\r?\n/);
    const starts = []; lines.forEach((l, i) => { const m = /^DTSTART;TZID=([^:]+):(\d{8}T\d{6})$/.exec(l); if (m) starts.push({ tz: m[1], v: m[2], ev: lines.slice(0, i).filter(x => x.startsWith("SUMMARY")).pop() }); });
    assert(starts.length >= 3, "timed starts for " + tz + " (got " + starts.length + ")");
    const wall = new Set(starts.map(s => s.v.slice(0, 8) + "T" + s.v.slice(9, 13)));
    // Each task keeps its wall-clock reading: the due time (or an hour before it for the event block) on the same calendar day.
    ["20261031", "20261101", "20261102"].forEach(d => assert([...wall].some(w => w.startsWith(d)), `${tz}: an event on ${d}`));
    starts.forEach(s => assert.strictEqual(s.tz, tz));
  }
  // The instants the TZID wall-clocks mean differ by an hour across the change: 23:59 PDT is 06:59Z, 23:59 PST is 07:59Z.
  const ms = (d, tm, tz) => { const g = Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10), +tm.slice(0, 2), +tm.slice(3, 5)); const p = z => { const o = {}; new Intl.DateTimeFormat("en-US", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" }).formatToParts(new Date(z)).forEach(x => { o[x.type] = x.value; }); return (Date.UTC(+o.year, +o.month - 1, +o.day, +o.hour % 24, +o.minute, +o.second) - Math.floor(z / 1000) * 1000) / 6e4; }; let r = g - p(g) * 6e4; r = g - p(r) * 6e4; return r; };
  assert.strictEqual(new Date(ms("2026-10-31", "23:59", "America/Los_Angeles")).toISOString(), "2026-11-01T06:59:00.000Z");
  assert.strictEqual(new Date(ms("2026-11-01", "23:59", "America/Los_Angeles")).toISOString(), "2026-11-02T07:59:00.000Z");
  assert.strictEqual(new Date(ms("2026-10-25", "23:59", "Europe/Berlin")).toISOString(), "2026-10-25T22:59:00.000Z");
  assert.strictEqual(new Date(ms("2026-03-29", "12:00", "Europe/London")).toISOString(), "2026-03-29T11:00:00.000Z");
});
t("calendar-feed core in supabase-functions/calendar-feed/index.ts is identical to the app's copy", () => {
  const ts = fs.readFileSync(path.join(__dirname, "..", "supabase-functions", "calendar-feed", "index.ts"), "utf8");
  const blk = s => { const a = s.indexOf("// ==== STUDYBOARD ICS CORE START ===="), b = s.indexOf("// ==== STUDYBOARD ICS CORE END ===="); return s.slice(a, b).replace(/\r\n/g, "\n"); };
  assert.strictEqual(blk(ts).trim(), blk(src).trim());
});

// 8. Importing a calendar (.ics) from your school: instants and TZIDs become wall-clock in the HOME zone; floating times stay as written.
t("ICS import: icsWhen / icsTz", () => {
  const code = between("function icsTz(", "const icsDur =");
  const mk = home => { const SBTZ = { schoolZone: () => home, wallIn: TZ.wallIn }; return new Function("window", "SBTZ", "iso", "pad", code + "; return {icsWhen, icsTz};")({ SBTZ }, SBTZ, APP.iso, n => String(n).padStart(2, "0")); };
  const la = mk("America/Los_Angeles").icsWhen, none = mk(null).icsWhen, x = (v, p) => ({ v, p: p || {} });
  assert.deepStrictEqual(la(x("20261102T075900Z")), { date: "2026-11-01", time: "23:59", allDay: false, ms: Date.UTC(2026, 10, 2, 7, 59) });
  assert.deepStrictEqual(la(x("20261101T235900", { TZID: "America/Los_Angeles" })).time, "23:59");
  assert.strictEqual(la(x("20261101T235900", { TZID: "America/Los_Angeles" })).date, "2026-11-01");
  assert.deepStrictEqual(la(x("20261101")), { date: "2026-11-01", time: "", allDay: true });
  const fl = la(x("20261101T235900")); assert.strictEqual(fl.date + " " + fl.time, "2026-11-01 23:59", "a floating time stays as written");
  // times next to a clock change resolve to the right instant
  const icsTz = mk(null).icsTz;
  assert(["2026-11-01T08:30:00.000Z", "2026-11-01T09:30:00.000Z"].includes(icsTz(2026, 11, 1, 1, 30, "America/Los_Angeles").toISOString()));
  assert.strictEqual(icsTz(2026, 11, 1, 23, 59, "America/Los_Angeles").toISOString(), "2026-11-02T07:59:00.000Z");
  assert.strictEqual(icsTz(2026, 3, 9, 0, 30, "America/Los_Angeles").toISOString(), "2026-03-09T07:30:00.000Z");
  assert.strictEqual(icsTz(2026, 3, 8, 12, 0, "America/Los_Angeles").toISOString(), "2026-03-08T19:00:00.000Z");
  assert.strictEqual(icsTz(2026, 10, 25, 12, 0, "Europe/Berlin").toISOString(), "2026-10-25T11:00:00.000Z");
  assert.strictEqual(icsTz(2026, 10, 26, 12, 0, "Europe/Berlin").toISOString(), "2026-10-26T11:00:00.000Z");
  assert.strictEqual(icsTz(2026, 11, 2, 9, 0, "Asia/Kolkata").toISOString(), "2026-11-02T03:30:00.000Z");
});

// 7. The notice and settings use the device zone name the same way everywhere.
t("device time zone resolves to an IANA name that Intl accepts", () => {
  const z = Intl.DateTimeFormat().resolvedOptions().timeZone; assert(TZ.valid(z), z);
  assert.strictEqual(TZ.valid("America/Los_Angeles"), true); assert.strictEqual(TZ.valid("PST8PDT-ish"), false);
});
t("fmtTime never throws on the clock-change days and shows the asked time", () => {
  for (const d of [[2026, 3, 8], [2026, 11, 1], [2026, 3, 29], [2026, 10, 25]]) { at(...d, 12, 0); assert(/11:59/.test(APP.fmtTime("23:59")) || /23:59/.test(APP.fmtTime("23:59"))); assert(/2:30|02:30/.test(APP.fmtTime("02:30"))); }
});

console.log(`${n} timezone checks passed (TZ=${process.env.TZ}, offset now ${-new Date().getTimezoneOffset()} min)`);
