// node tests/quickadd-repeat.test.js
// Repeats and pages in a typed sentence (the capture core in 75-capture.js, between CAPTURE-START and CAPTURE-END), and the reading pace
// maths (the accuracy core in 92-accuracy.js, between ACC-START and ACC-END). Today is Thursday 26 November 2026.
const assert = require("assert");
const src = require("../scripts/app-files").source();
const CAP = new Function(src.slice(src.indexOf("/* CAPTURE-START"), src.indexOf("/* CAPTURE-END */")) + "; return CAP;")();
const ACC = new Function(src.slice(src.indexOf("/*ACC-START*/"), src.indexOf("/*ACC-END*/")) + ";return ACC;")();
let n = 0; const t = (name, fn) => { fn(); n++; console.log("ok -", name); };
const courses = [{id: "c1", code: "ENGL 210", name: "English Literature"}];
const ctx = {today: "2026-11-26", courses};
const P = s => CAP.parseLine(s, ctx);
const rep = d => d.repeat ? [d.repeat.every, d.repeat.days.join(""), d.repeat.until].join("|") : "";

t("a table of sentences: title, first due date, rule and pages", () => {
  // [sentence, title, due, "every|days|until" ("" = no repeat), pages (0 = none)]
  const rows = [
    ["math homework every monday", "Math Homework", "2026-11-30", "7|1|", 0],
    ["lab report every other thu", "Lab Report", "2026-11-26", "14|4|", 0],
    ["reading weekdays until dec 12", "Reading", "2026-11-26", "7|12345|2026-12-12", 0],
    ["quiz every 2 weeks fri", "Quiz", "2026-11-27", "14|5|", 0],
    ["journal every day", "Journal", "2026-11-26", "1||", 0],
    ["stretch daily", "Stretch", "2026-11-26", "1||", 0],
    ["lecture notes mon wed fri", "Lecture Notes", "2026-11-27", "7|135|", 0],
    ["problem set MWF", "Problem Set", "2026-11-27", "7|135|", 0],
    ["lab prep TTh", "Lab Prep", "2026-11-26", "7|24|", 0],
    ["lab prep T/Th", "Lab Prep", "2026-11-26", "7|24|", 0],
    ["discussion post every Mon, Wed and Fri", "Discussion Post", "2026-11-27", "7|135|", 0],
    ["vocab every 3 days", "Vocab", "2026-11-26", "3||", 0],
    ["flashcards every other day", "Flashcards", "2026-11-26", "2||", 0],
    ["rent every month", "Rent", "2026-11-26", "m||", 0],
    ["reflection every week on sunday", "Reflection", "2026-11-29", "7|0|", 0],
    ["reflection weekly on fri", "Reflection", "2026-11-27", "7|5|", 0],
    ["club meeting tuesdays and thursdays", "Club Meeting", "2026-11-26", "7|24|", 0],
    ["reading log every weekend", "Reading Log", "2026-11-28", "7|60|", 0],
    ["hw every monday until jan 15", "Homework", "2026-11-30", "7|1|2027-01-15", 0],
    ["hw every monday till 1/15", "Homework", "2026-11-30", "7|1|2027-01-15", 0],
    ["hw every monday for 4 weeks", "Homework", "2026-11-30", "7|1|2026-12-27", 0],
    ["hw every fri until the end of the month", "Homework", "2026-11-27", "7|5|2026-11-30", 0],
    ["reading weekdays starting dec 1", "Reading", "2026-12-01", "7|12345|", 0],
    ["engl essay draft every fri 5pm", "Essay Draft", "2026-11-27", "7|5|", 0],
    ["read chapter 4 pages 30 thursday", "Read Chapter 4", "2026-12-03", "", 30],
    ["read ch 4 30 pages fri", "Read Chapter 4", "2026-11-27", "", 30],
    ["read pp. 45-80 fri", "Read", "2026-11-27", "", 36],
    ["read pp 45–80 fri", "Read", "2026-11-27", "", 36],
    ["read pages 12 to 40 fri", "Read", "2026-11-27", "", 29],
    ["article 30pg fri", "Article", "2026-11-27", "", 30],
    ["read pp. 145-62 tomorrow", "Read", "2026-11-27", "", 18],
    ["read 5 pages of ch 2 fri", "Read Chapter 2", "2026-11-27", "", 5],
    ["reading 20 pages every monday", "Reading", "2026-11-30", "7|1|", 20],
    // left alone: "every" in a title, unclear repeats, pages that are writing
    ["Everything Bagel essay fri", "Everything Bagel essay", "2026-11-27", "", 0],
    ["every chapter summary fri", "Every Chapter Summary", "2026-11-27", "", 0],
    ["biweekly check-in fri", "Biweekly Check-in", "2026-11-27", "", 0],
    ["everyday life essay fri", "Everyday Life Essay", "2026-11-27", "", 0],
    ["essay 5 pages fri", "Essay 5 Pages", "2026-11-27", "", 0],
    ["read page 30 fri", "Read Page 30", "2026-11-27", "", 0],
    ["t/f quiz fri", "T/F Quiz", "2026-11-27", "", 0],
    ["quiz mon", "Quiz", "2026-11-30", "", 0]
  ];
  const bad = [];
  rows.forEach(([s, title, due, r, pages]) => {
    const d = P(s), got = [d.title, d.due, rep(d), d.pages || 0], want = [title, due, r, pages];
    if (JSON.stringify(got) !== JSON.stringify(want)) bad.push(`${s}: got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);
  });
  assert.ok(!bad.length, "\n" + bad.join("\n"));
  assert.ok(rows.length >= 30);
});
t("the repeat words never stay in the title (the old bug: \"Math Homework Every\")", () => {
  ["math homework every monday", "lab report every other thu", "quiz every 2 weeks fri", "reading weekdays until dec 12"].forEach(s => assert.ok(!/\b(every|other|weekdays?|until|dec|weeks?)\b/i.test(P(s).title), s + " -> " + P(s).title));
});
t("plain words for the rule", () => {
  const L = s => P(s).repeat.label;
  assert.strictEqual(L("math homework every monday"), "Every Monday"); assert.strictEqual(L("reading weekdays until dec 12"), "Every weekday until Dec 12");
  assert.strictEqual(L("lab report every other thu"), "Every other Thursday"); assert.strictEqual(L("quiz every 2 weeks fri"), "Every other Friday");
  assert.strictEqual(L("quiz every 3 weeks fri"), "Every 3 weeks on Friday"); assert.strictEqual(L("problem set MWF"), "Every Mon, Wed and Fri"); assert.strictEqual(L("lab TTh"), "Every Tue and Thu");
  assert.strictEqual(L("journal daily"), "Every day"); assert.strictEqual(L("rent monthly"), "Every month"); assert.strictEqual(L("vocab every 3 days"), "Every 3 days"); assert.strictEqual(L("hw every week"), "Every week");
  assert.strictEqual(L("hw every monday until jan 15"), "Every Monday until Jan 15");
  assert.strictEqual(CAP.ruleLabel({every: "7", days: [1], until: "2027-12-20"}, "2026-11-26"), "Every Monday until Dec 20, 2027", "a year away says the year");
});
t("an exam never repeats, and the sentence's own date still counts", () => {
  assert.strictEqual(P("midterm every monday").repeat, undefined);
  const d = P("every 2 weeks quiz fri"); assert.strictEqual(rep(d), "14||"); assert.strictEqual(d.due, "2026-11-27", "the date given is the first one");
});
t("until across the year end, and a day already gone is left for the check", () => {
  assert.strictEqual(P("hw every monday until jan 15").repeat.until, "2027-01-15");
  assert.strictEqual(P("hw every monday until 2027-02-01").repeat.until, "2027-02-01");
  const d = P("hw every mon until nov 20"); assert.strictEqual(d.repeat.until, ""); assert.ok(d.flags.includes("date") && !d.confident, "not added without the check");
  assert.strictEqual(P("hw every mon until dec 12th").repeat.until, "2026-12-12");
  // typed in late December: until a January day is next year
  const dec = CAP.parseLine("hw every friday until jan 8", {today: "2026-12-28", courses: []}); assert.strictEqual(dec.due, "2027-01-01"); assert.strictEqual(dec.repeat.until, "2027-01-08");
});
t("pages edge cases", () => {
  const pg = s => CAP.readPages(s);
  assert.deepStrictEqual(pg("pp. 45-80"), {pages: 36, reading: "pp. 45–80", rest: ""});
  assert.strictEqual(pg("pp.45-80").pages, 36); assert.strictEqual(pg("p. 12-14").pages, 3); assert.strictEqual(pg("pg 1 to 10").pages, 10); assert.strictEqual(pg("pages 12 thru 40").pages, 29);
  assert.strictEqual(pg("pp. 80-45"), null, "a range backwards is unclear"); assert.strictEqual(pg("pp. 1-3000"), null, "too many pages");
  assert.strictEqual(pg("pp."), null); assert.strictEqual(pg("page 30"), null, "one page number is not a count");
  assert.strictEqual(pg("a 30-page reading").pages, 30); assert.strictEqual(pg("30 pgs").pages, 30); assert.strictEqual(pg("30 pp.").pages, 30);
  assert.strictEqual(pg("chapter 4 pages 30").pages, 30, "the chapter number isn't the count"); assert.strictEqual(pg("ch. 12 20 pages").pages, 20);
  assert.strictEqual(pg("0 pages"), null);
  assert.strictEqual(P("30pg").type, "Reading", "pages alone make it a reading"); assert.strictEqual(P("essay 5 pages fri").pages, undefined, "an essay's pages are writing");
  assert.strictEqual(P("read pp. 45-80 fri").reading, "pp. 45–80", "a range is kept as what to read");
});
t("rule dates", () => {
  const D = (r, a, b) => CAP.ruleDates(r, a, b).join(",");
  assert.strictEqual(D({every: "7", days: [1, 3, 5]}, "2026-11-27", "2026-12-07"), "2026-11-27,2026-11-30,2026-12-02,2026-12-04,2026-12-07");
  assert.strictEqual(D({every: "14", days: [4]}, "2026-11-26", "2026-12-31"), "2026-11-26,2026-12-10,2026-12-24");
  assert.strictEqual(D({every: "1", days: []}, "2026-12-30", "2027-01-02"), "2026-12-30,2026-12-31,2027-01-01,2027-01-02", "across the year end");
  assert.strictEqual(D({every: "m", days: []}, "2027-01-31", "2027-04-30"), "2027-01-31,2027-02-28,2027-03-31,2027-04-30", "month ends");
  assert.strictEqual(CAP.ruleDates({every: "1", days: []}, "2026-01-01", "2027-12-31").length, 121, "at most 121 (the first and 120 more, like the Repeat field)");
  assert.strictEqual(CAP.repeatFirst({every: "7", days: [1]}, "2026-11-26"), "2026-11-30"); assert.strictEqual(CAP.repeatFirst({every: "7", days: [4]}, "2026-11-26"), "2026-11-26", "today counts");
});
t("the parse is the same in every time zone (plain calendar math)", () => {
  const cp = require("child_process");
  for (const tz of ["Pacific/Auckland", "America/Los_Angeles"]) {
    const r = cp.spawnSync(process.execPath, ["-e", `const s=require(${JSON.stringify(require.resolve("../scripts/app-files"))}).source();const C=new Function(s.slice(s.indexOf("/* CAPTURE-START"),s.indexOf("/* CAPTURE-END */"))+";return CAP;")();const d=C.parseLine("reading weekdays until dec 12",{today:"2026-11-26",courses:[]});console.log(d.due+" "+d.repeat.until+" "+C.ruleDates(d.repeat,d.due,d.repeat.until).length)`], {env: Object.assign({}, process.env, {TZ: tz}), encoding: "utf8"});
    assert.strictEqual(r.stdout.trim(), "2026-11-26 2026-12-12 12", tz + " " + r.stderr);
  }
});

/* reading pace */
const DAY = 864e5, T0 = new Date(2026, 10, 1).getTime();
const rd = (o) => Object.assign({type: "Reading", status: "done", courseId: "c1", pages: 20, doneAt: T0}, o);
t("a finished reading gives minutes a page from logged time, else focus time", () => {
  assert.strictEqual(ACC.pageSample(rd({focusMin: 80})).mpp, 4);
  assert.strictEqual(ACC.pageSample(rd({focusMin: 40, actualMin: 60})).mpp, 3, "the time you said wins when it's more");
  assert.strictEqual(ACC.pageSample(rd({focusMin: 5})), null, "a few minutes of focus is not a reading");
  assert.strictEqual(ACC.pageSample(rd({focusMin: 600})), null, "30 min a page: a timer left running");
  assert.strictEqual(ACC.pageSample(rd({focusMin: 60, status: "todo"})), null, "not finished");
  assert.strictEqual(ACC.pageSample(rd({focusMin: 60, pages: 0})), null, "no pages");
  assert.strictEqual(ACC.pageSamples([rd({focusMin: 80, courseId: "c2"}), rd({focusMin: 60})], "c1").length, 1, "one course's readings");
});
t("the pace is a smoothed average that starts at 3 (or the student's own number)", () => {
  assert.deepStrictEqual(ACC.pace([], 0), {mpp: 3, n: 0, skipped: 0});
  assert.strictEqual(ACC.pace([{mpp: 4, at: 1}], 0).mpp, 3.3, "one reading moves it 30% of the way");
  assert.strictEqual(ACC.pace([{mpp: 4, at: 1}, {mpp: 4, at: 2}], 0).mpp, 3.5);
  assert.strictEqual(ACC.pace([{mpp: 2, at: 1}], 5).mpp, 4.1, "from the student's setting");
  const many = Array.from({length: 12}, (_, i) => ({mpp: 5, at: i})); assert.ok(Math.abs(ACC.pace(many, 0).mpp - 5) < 0.1, "it settles on the student's real pace");
  assert.strictEqual(ACC.pace([{mpp: 4, at: 1}], 4, 5).n, 0, "readings before a pace set by hand don't count");
});
t("outliers are set aside", () => {
  const S = [{mpp: 3, at: 1}, {mpp: 3, at: 2}, {mpp: 15, at: 3}, {mpp: 0.6, at: 4}, {mpp: 3.5, at: 5}];
  const r = ACC.pace(S, 0); assert.strictEqual(r.skipped, 2); assert.strictEqual(r.n, 3); assert.strictEqual(r.mpp, 3.2, "3, 3, then 3.5 (the 15 and the 0.6 set aside)");
  const S2 = ACC.pageSamples([rd({focusMin: 60, doneAt: T0 + DAY}), rd({focusMin: 60, doneAt: T0}), rd({focusMin: 600, doneAt: T0 + 2 * DAY})], "c1");
  assert.deepStrictEqual(S2.map(x => x.mpp), [3, 3], "oldest first, the runaway timer dropped");
});
console.log(`\nquickadd-repeat.test: ${n} groups passed`);
