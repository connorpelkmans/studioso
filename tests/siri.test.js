// node tests/siri.test.js
// Ask Siri: the on-device copy src/js/96-siri.js writes, and that the Swift side (ios-wrapper/native/SBSiriData.swift) reads the same keys
const fs = require("fs"), path = require("path"), assert = require("assert");
const src = require("../scripts/app-files").source();
const a = src.indexOf("/* SIRI-START"), b = src.indexOf("/* SIRI-PURE-END */");
assert.ok(a > 0 && b > a && src.indexOf("/* SIRI-END */") > b, "markers present");
const {siriSnapshot} = new Function(src.slice(a, b) + "; return {siriSnapshot};")();
let n = 0; const t = (name, fn) => { fn(); n++; console.log("ok -", name); };

const courses = [{id: "c1", name: "Biology", code: "BIO 101", room: "Room 204"}, {id: "c2", name: "Chemistry", code: "", room: ""}, {id: "c3", name: "Old", archived: true}];
const tasks = [
  {id: "t1", title: "Lab report", courseId: "c1", type: "Assignment", due: "2026-11-06", time: "17:00", status: "todo"},
  {id: "t2", title: "Midterm", courseId: "c2", type: "Exam", due: "2026-09-01", time: "", status: "done", doneAt: 5, mark: {got: 45, outOf: 50}},
  {id: "t3", title: "Essay", courseId: "c1", due: "2026-11-04", time: "", status: "todo"},
  {id: "t4", title: "Prep session", courseId: "c1", due: "2026-11-05", status: "todo", prepFor: "t2"},
  {id: "t5", title: "Step 1", courseId: "c1", due: "2026-11-05", status: "todo", breakdownOf: "t1"},
  {id: "t6", title: "Ancient done", courseId: "c1", due: "2025-01-01", status: "done"},
  {id: "t7", title: "No date <b>x</b>\u0007", courseId: "gone", status: "todo"}
];
const base = over => Object.assign({now: 1762300000000, today: "2026-11-03", grades: true, tasks, courses, courseLabel: c => c.code || c.name,
  gradeItems: [{id: "t2", pct: 90, mark: "45/50", letter: "A-"}],
  courseGrade: c => c.id === "c2" ? {pct: 90, letter: "A-", marked: 25} : null,
  timesText: c => c.id === "c1" ? "Mon, Wed · 10–10:50 AM" : "",
  classes: [{courseId: "c1", kind: "Lecture", date: "2026-11-05", start: "10:00", end: "10:50", where: "Room 204"}, {courseId: "c1", kind: "Lab", date: "2026-11-04", start: "14:00", end: "16:00", where: ""}, {courseId: "c3", kind: "Lecture", date: "2026-11-04", start: "09:00", end: "10:00"}, {courseId: "c1", date: "bad", start: "1", end: "2"}]
}, over || {});

t("open work first by due date, then marked or recent done work; prep sessions, breakdown steps and old done work left out", () => {
  const s = siriSnapshot(base());
  assert.deepStrictEqual(s.tasks.map(x => x.id), ["t3", "t1", "t7", "t2"]);
  assert.strictEqual(s.v, 1); assert.strictEqual(s.at, 1762300000000);
});
t("marks and course grades are there when allowed", () => {
  const s = siriSnapshot(base());
  assert.deepStrictEqual(s.tasks.find(x => x.id === "t2").mark, {pct: 90, text: "45/50", letter: "A-"});
  assert.deepStrictEqual(s.courses.find(x => x.id === "c2").grade, {pct: 90, letter: "A-", marked: 25});
  assert.strictEqual(s.grades, true);
});
t("with grades off, no mark or grade is in the copy at all", () => {
  const s = siriSnapshot(base({grades: false})), j = JSON.stringify(s);
  assert.strictEqual(s.grades, false);
  assert.ok(!/"mark"|"grade"|45\/50|"pct"/.test(j), j);
  assert.ok(!s.tasks.some(x => x.id === "t2"), "an old done task kept only for its mark is left out too");
});
t("archived courses, and classes of unknown courses or with bad times, are dropped; classes sorted", () => {
  const s = siriSnapshot(base());
  assert.deepStrictEqual(s.courses.map(c => c.id), ["c1", "c2"]);
  assert.deepStrictEqual(s.classes.map(c => c.date + " " + c.start), ["2026-11-04 14:00", "2026-11-05 10:00"]);
  assert.strictEqual(s.courses[0].times, "Mon, Wed · 10–10:50 AM");
});
t("text is cleaned: no tags or control characters; a course that's gone is blank", () => {
  const x = siriSnapshot(base()).tasks.find(y => y.id === "t7");
  assert.strictEqual(x.title, "No date b x /b"); assert.strictEqual(x.course, ""); assert.strictEqual(x.due, ""); assert.strictEqual(x.time, "");
});
t("a throwing grade or times helper doesn't break the copy", () => {
  const s = siriSnapshot(base({courseGrade: () => { throw new Error("x"); }, timesText: () => { throw new Error("y"); }}));
  assert.strictEqual(s.courses.length, 2); assert.ok(!s.courses.some(c => c.grade));
});
t("size stays bounded with thousands of tasks", () => {
  const many = Array.from({length: 3000}, (_, i) => ({id: "m" + i, title: "Task " + i + " ".repeat(5) + "x".repeat(300), courseId: "c1", due: "2026-12-01", status: "todo"}));
  const s = siriSnapshot(base({tasks: many}));
  assert.strictEqual(s.tasks.length, 600); assert.ok(s.tasks[0].title.length <= 140); assert.ok(JSON.stringify(s).length < 1500000);
});

// The Swift Codable types read every key the page writes (and "where" through its CodingKey)
t("SBSiriData.swift decodes the same keys", () => {
  const sw = fs.readFileSync(path.join(__dirname, "..", "ios-wrapper", "native", "SBSiriData.swift"), "utf8");
  const s = siriSnapshot(base()), keys = new Set();
  const walk = o => { if (Array.isArray(o)) o.forEach(walk); else if (o && typeof o === "object") for (const k of Object.keys(o)) { keys.add(k); walk(o[k]); } };
  walk(s);
  for (const k of keys) {
    if (k === "where") { assert.ok(/case place = "where"/.test(sw), "where -> place"); continue; }
    assert.ok(new RegExp("\\bvar " + k + ":").test(sw), "Swift has var " + k);
  }
  assert.ok(/fileName = "studyboard-siri\.json"/.test(sw));
});
t("the bridge, plugin and intents are wired up", () => {
  const root = path.join(__dirname, ".."), rd = p => fs.readFileSync(path.join(root, p), "utf8");
  assert.ok(/native\.siriData = \{/.test(rd("ios-wrapper/native-bridge.js")) && /plugin\("StudyboardSiriData"\)/.test(rd("ios-wrapper/native-bridge.js")));
  assert.ok(/jsName = "StudyboardSiriData"/.test(rd("ios-wrapper/native/StudyboardPlugins.swift")));
  assert.ok(/"StudyboardSiriDataPlugin"/.test(rd("ios-wrapper/native/MainViewController.swift")) && /"StudyboardSiriDataPlugin"/.test(rd("scripts/ios-stage.js")));
  const sc = rd("ios-wrapper/native/StudyboardShortcuts.swift"), shortcuts = (sc.match(/AppShortcut\(/g) || []).length;
  assert.ok(shortcuts <= 10, "at most 10 App Shortcuts, has " + shortcuts);
  for (const i of ["AddTaskIntent", "WhatsDueIntent", "AssignmentDueIntent", "CourseGradeIntent", "AssignmentGradeIntent", "ClassTimeIntent", "NextClassIntent"]) assert.ok(sc.includes(i + "()"), i);
  // every phrase names the app, and holds at most one parameter
  for (const p of sc.match(/^\s*"[^"\n]*"/gm).filter(x => /\\\(/.test(x))) {
    assert.ok(p.includes("\\(.applicationName)"), "phrase names the app: " + p.trim());
    assert.ok((p.match(/\\\(\\\.\$/g) || []).length <= 1, "one parameter: " + p.trim());
  }
  const ask = rd("ios-wrapper/native/StudyboardAskIntents.swift");
  assert.strictEqual((ask.match(/authenticationPolicy: IntentAuthenticationPolicy = \.requiresAuthentication/g) || []).length, 2, "both grade intents ask for unlock");
});
console.log(`\n${n} siri tests passed`);
