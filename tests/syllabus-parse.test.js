// Unit tests for the on-device syllabus reader (SY in src/js/01-syllabus.js): class days, one-line grade weights, due times,
// and filling in after an AI answer that ran out of room; plus the AI reader's date check (src/js/01-ai.js)
// Run: node tests/syllabus-parse.test.js
const fs = require("fs"), path = require("path"), assert = require("assert");
const src = f => fs.readFileSync(path.join(__dirname, "..", "src", "js", f), "utf8");
const syl = src("01-syllabus.js"), i0 = syl.indexOf("const SY = (() => {"), i1 = syl.indexOf("\n})();", i0);
assert(i0 >= 0 && i1 > i0, "SY block");
const SY = new Function(syl.slice(i0, i1 + 6) + ";return SY;")();
let n = 0; const ok = (c, m) => { n++; assert(c, m); }, eq = (a, b, m) => { n++; assert.deepStrictEqual(a, b, m); };
const T = "2026-09-01";
const items = text => SY.parse(text, T).items;
const find = (its, title) => its.find(x => x.title === title) || {};

// Class days
const DAYS = {"T/R 9:00": [2, 4], "M W F 9-9:50": [1, 3, 5], "Tu/Th": [2, 4], "Tu/Th 2pm": [2, 4], "MWF": [1, 3, 5], "TTh 9:30": [2, 4], "TR": [2, 4], "T R 9:00": [2, 4], "MW F 10:00": [1, 3, 5],
  "M & W 10:00": [1, 3], "Mon/Wed 10:00": [1, 3], "M/W 10:00": [1, 3], "M-F 9:00": [1, 2, 3, 4, 5], "MW 10:30-11:45": [1, 3], "Tues & Thurs 2pm": [2, 4], "W 6pm": [3], "R 3:00": [4], "Monday 9am": [1], "": []};
Object.entries(DAYS).forEach(([s, d]) => eq(SY.meetingDays(s), d, "class days of " + JSON.stringify(s)));

// Grade weights: one line, or one per line
{
  const r = SY.parse("CS 101 Intro\nGrading\nQuizzes 20%, Homework 20%, Midterm 30%, Final 30%\nSchedule\nOct 12 Quiz 1\nOct 14 Homework 3 due\nOct 20 Homework 4 due\nNov 2 Midterm exam\nDec 10 Final exam", T);
  eq(Object.keys(r.byType).sort(), ["Assignment", "Exam", "Final", "Quiz"], "one-line breakdown: every category gets its weight");
  eq([find(r.items, "Quiz 1").weight, find(r.items, "Homework 3").weight, find(r.items, "Midterm").weight, find(r.items, "Final Exam").weight], [20, 10, 30, 30], "and each item its share");
  ok(r.weightsFound, "weights found");
  const r2 = SY.parse("Grading\nQuizzes; 20% of the grade\nSchedule\nOct 12 Quiz 1\nOct 14 Homework 3 due", T);
  ok(r2.weightsFound && find(r2.items, "Homework 3").weight == null, "weightsFound is about items that got one");
  const r3 = SY.parse("Grading\nHomework 20% (lowest dropped)\nQuizzes 10%\nExams 70%\nSchedule\nOct 14 Homework 3 due\nOct 21 Homework 4 due\nOct 16 Quiz 1\nOct 30 Exam 1\nDec 4 Exam 2", T);
  eq([find(r3.items, "Homework 3").weight, find(r3.items, "Quiz 1").weight, find(r3.items, "Exam 1").weight], [10, 10, 35], "one weight per line still works");
  const r4 = SY.parse("Grading\nMidterm 1 25%\nMidterm 2 25%\nFinal exam 50%\nSchedule\nOct 1 Midterm 1\nNov 5 Midterm 2\nDec 12 Final exam", T);
  eq([find(r4.items, "Midterm 1").weight, find(r4.items, "Midterm 2").weight, find(r4.items, "Final Exam").weight], [25, 25, 50], "numbered lines go to their own item");
  const r5 = SY.parse("Schedule\nOct 14 Homework 3 due", T);
  ok(!r5.weightsFound, "no breakdown, no weights claimed");
}

// Due times: only from the item's own text, or a date/time column
{
  const a = items("Schedule\nOct 12 Lecture 10:00 am; Homework 3 due");
  eq([find(a, "Homework 3").due, find(a, "Homework 3").time], ["2026-10-12", ""], "the lecture's time isn't the homework's");
  const b = items("Schedule\nOct 12\t11:59 pm\tHomework 3 due");
  eq(find(b, "Homework 3").time, "23:59", "a time column is the due time");
  const c = items("Schedule\nHomework 2 due 9/15 at 11:59 pm\nQuiz 1 on 9/18 at 10am\nOct 3 Homework 4 due by 5pm");
  eq([find(c, "Homework 2").due, find(c, "Homework 2").time, find(c, "Quiz 1").time, find(c, "Homework 4").time], ["2026-09-15", "23:59", "10:00", "17:00"], "times in the item's own text");
  const d = items("Schedule\nOct 6 Midterm 1 9:30-10:45 am\nOct 8\t9:30 am\tQuiz 2 in class");
  eq([find(d, "Midterm 1").due, find(d, "Midterm 1").time, find(d, "Quiz 2").time], ["2026-10-06", "09:30", "09:30"], "an exam takes its start time");
}

// Dates and the term (already working)
{
  eq(SY.findDates("Due Oct 12, 2026 and 2027-03-04", () => 2026).map(d => d.iso), ["2026-10-12", "2027-03-04"], "dates in a line");
  eq(SY.findDates("Feb 30", () => 2026).length, 0, "no Feb 30");
  eq(SY.termInfo("Fall 2026 Syllabus"), {season: "fall", year: 2026, label: "Fall 2026"}, "the term");
  const r = SY.parse("BIO 110 General Biology\nFall 2026\nInstructor: Dr. Jane Smith\nClass: TR 9:30-10:45 am\n\nSchedule\nWeek 1 Aug 31 Intro\nSep 4 Lab 1 report due\nDec 15 Final exam", T);
  ok(r.course.code === "BIO 110" && /General Biology/.test(r.course.name) && r.course.instructor === "Dr. Jane Smith", "course details: " + JSON.stringify(r.course));
  eq(SY.meetingDays(r.course.schedule), [2, 4], "class days from the schedule line");
  ok(find(r.items, "Lab 1 report").due === "2026-09-04" && find(r.items, "Final Exam").due === "2026-12-15", "items: " + JSON.stringify(r.items.map(x => x.title + "@" + x.due)));
}

// Same task, other wording
{
  const N = SY.normTitle;
  ok(N("HW 3") === N("Homework 3") && N("Homework #03") === N("homework 3") && N("Midterm Exam 1") === N("Midterm 1") && N("PS 2") === N("Problem Set 2"), "titles fold together");
  ok(N("Homework 3") !== N("Homework 4") && N("Quiz 1") !== N("Homework 1"), "but numbers and kinds still differ");
}

// The AI ran out of room: from the last date it got to, what this device read and the AI didn't
{
  const ai = {items: [{title: "HW 1", type: "Assignment", due: "2026-09-10"}, {title: "Midterm Exam", type: "Exam", due: "2026-10-15"}, {title: "Lab 2", type: "Lab", due: ""}]};
  const local = {items: [{title: "Homework 1", type: "Assignment", due: "2026-09-10"}, {title: "Midterm", type: "Exam", due: "2026-10-15"}, {title: "Homework 5", type: "Assignment", due: "2026-11-01"},
    {title: "Final Exam", type: "Exam", due: "2026-12-14"}, {title: "Homework 2", type: "Assignment", due: "2026-09-20"}, {title: "Reading", type: "Reading", due: ""}]};
  const f = SY.fillCut(ai, local);
  eq(f.last, "2026-10-15", "the last date the AI got to");
  eq(f.added.map(x => x.title), ["Homework 5", "Final Exam"], "only later items it hasn't got are added");
  ok(f.added.every(x => x.source === "cut") && local.items[2].source === undefined, "marked for checking, without changing the parser's own");
  eq(SY.fillCut(ai, null), {last: "2026-10-15", added: []}, "no text to read");
  eq(SY.fillCut({items: []}, local).added.length, 5, "nothing from the AI: every dated item");
}

// The AI's dates must be real days
{
  const ai = src("01-ai.js"), m = ai.match(/\n\s*const isDate = (s => [^\n]*?), isTime = /);
  assert(m, "the AI syllabus date check");
  const isDate = eval(m[1]);
  ok(isDate("2026-02-28") && isDate("2028-02-29") && isDate("2026-12-31"), "real days pass");
  ok(!isDate("2026-02-30") && !isDate("2027-02-29") && !isDate("2026-13-01") && !isDate("2026-04-31") && !isDate("2026-1-5") && !isDate("") && !isDate(null), "impossible days don't");
}
// A weight written after the title ("Quiz 7 (5%)") is that item's weight and not part of its title; a reading keeps what's read;
// the room after the class times on the same line
{
  const r = SY.parse("PSYC 1010 Intro to Psychology\nInstructor: Dr. Lee\nClass: Tue/Thu 11:30-12:50, Hall C\n\nSchedule\nNov 19 - Quiz 7 (5%)\nNov 26 - Research proposal due (10%)\nDec 3 - Chapter 9 reading\nDec 10 - Final Exam (35%)", "2026-11-12");
  eq(r.items.map(i => [i.title, i.weight == null ? null : i.weight]), [["Quiz 7", 5], ["Research proposal", 10], ["Read Chapter 9", null], ["Final Exam", 35]], "inline weights, clean titles, a reading keeps its chapter");
  eq(r.course.room, "Hall C", "the room after the class times");
}
console.log(`syllabus-parse.test: ${n} checks passed`);
