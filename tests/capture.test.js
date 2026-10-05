// node tests/capture.test.js  (extracts the CAPTURE block from index.html and tests the pure core: parser, courses, links, validators)
const fs = require("fs"), path = require("path"), assert = require("assert");
const src = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const block = src.slice(src.indexOf("/* CAPTURE-START"), src.indexOf("/* CAPTURE-END */"));
const CAP = new Function(block + "; return CAP;")();
let n = 0; const t = (name, fn) => { fn(); n++; console.log("ok -", name); };
const courses = [{id: "c1", code: "BIO101", name: "Intro Biology", aliases: ["bio"]}, {id: "c2", code: "CHEM201", name: "Organic Chemistry"}, {id: "c3", code: "MATH 140", name: "Calculus II"}];
const ctx = {today: "2026-10-03", courses, termStart: "2026-08-31"};      // a Saturday
const P = s => CAP.parseLine(s, ctx);
const many = [{id: "a", code: "BIO101", name: "Biology I"}, {id: "b", code: "BIO201", name: "Biology II"}];

t("date matrix (today is Sat 2026-10-03)", () => {
  const cases = [["quiz fri", "2026-10-09"], ["quiz next tue", "2026-10-06"], ["quiz tue", "2026-10-06"], ["oct 28 reading", "2026-10-28"], ["10/28 hw", "2026-10-28"], ["hw by monday 5pm", "2026-10-05"],
    ["hw tomorrow", "2026-10-04"], ["hw in 3 days", "2026-10-06"], ["hw in two weeks", "2026-10-17"], ["report end of the month", "2026-10-31"], ["paper eom", "2026-10-31"], ["wk 9 problem set", "2026-10-30"],
    ["exam 12/5 9am", "2026-12-05"], ["essay 28 oct", "2026-10-28"], ["essay 2026-11-03", "2026-11-03"], ["essay today", "2026-10-03"], ["essay sat", "2026-10-10"], ["essay this sat", "2026-10-03"], ["hw jan 5", "2027-01-05"], ["hw 10/28/27", "2027-10-28"]];
  cases.forEach(([s, due]) => assert.strictEqual(P(s).due, due, s));
});
t("times and durations", () => {
  assert.strictEqual(P("exam 12/5 9am").time, "09:00"); assert.strictEqual(P("hw fri 5:30 pm").time, "17:30"); assert.strictEqual(P("hw fri 17:00").time, "17:00"); assert.strictEqual(P("hw fri noon").time, "12:00");
  assert.strictEqual(P("hw fri eod").time, "23:59"); assert.strictEqual(P("hw tonight").time, "23:59");
  assert.strictEqual(P("lab report fri 2h").hours, 2); assert.strictEqual(P("read ch 3 fri 90 min").hours, 1.5);
  assert.strictEqual(P("hw fri worth 10%").weight, 10);
});
t("the example sentence: Bio lab report, due Fri 5 PM", () => {
  const d = P("bio lab report due fri 5pm");
  assert.strictEqual(d.title, "Bio lab report"); assert.strictEqual(d.due, "2026-10-09"); assert.strictEqual(d.time, "17:00"); assert.strictEqual(d.type, "Lab"); assert.strictEqual(d.courseId, "c1"); assert.ok(d.confident);
});
t("types by keyword", () => {
  [["midterm oct 20", "Exam"], ["final exam dec 5", "Exam"], ["quiz fri", "Quiz"], ["lab 4 fri", "Lab"], ["group project fri", "Project"], ["read chapter 3 fri", "Reading"], ["hw 3 fri", "Assignment"], ["study notes fri", "Study"]]
    .forEach(([s, ty]) => assert.strictEqual(P(s).type, ty, s));
});
t("course matching: code, spaced code, nickname, number, name word, ambiguity", () => {
  assert.strictEqual(P("chem201 pset fri").courseId, "c2"); assert.strictEqual(P("chem 201 pset fri").courseId, "c2"); assert.strictEqual(P("math140 hw fri").courseId, "c3");
  assert.strictEqual(P("organic quiz fri").courseId, "c2"); assert.strictEqual(P("calculus hw fri").courseId, "c3");
  assert.strictEqual(CAP.matchCourse("bio 201 lab", many).course.id, "b");
  const amb = CAP.matchCourse("bio lab", many); assert.strictEqual(amb.course, null); assert.deepStrictEqual(amb.ambiguous.sort(), ["a", "b"]);
  const d = CAP.parseLine("bio lab fri 5pm", {today: "2026-10-03", courses: many}); assert.ok(d.flags.includes("course")); assert.ok(!d.confident);
  assert.strictEqual(P("buy milk fri").courseId, "");
  assert.strictEqual(P("chem201 pset in 3 days").title, "Problem Set");
});
t("confidence: clear is confident, ambiguous or missing date is not", () => {
  assert.ok(P("hw 3 fri").confident); assert.ok(P("read ch 4 oct 28").confident);
  ["finish paper next week", "study for midterm", "hw 2 due 2/30", "read ch 3 at 5", "quiz fri and exam mon", "hw this weekend"].forEach(s => assert.ok(!P(s).confident, s));
  assert.ok(P("hw 2 due 2/30").flags.includes("date"));
  assert.ok(!P("hw 10/01").confident, "past date is checked first");
});
t("DST-safe: dates never move across the spring and fall changes", () => {
  const d1 = CAP.parseLine("hw in 1 day", {today: "2026-03-07", courses: []}); assert.strictEqual(d1.due, "2026-03-08");
  assert.strictEqual(CAP.addDays("2026-03-08", 1), "2026-03-09"); assert.strictEqual(CAP.addDays("2026-11-01", 1), "2026-11-02"); assert.strictEqual(CAP.addDays("2026-11-01", -1), "2026-10-31");
  assert.strictEqual(CAP.parseLine("hw fri", {today: "2026-11-01", courses: []}).due, "2026-11-06");
  assert.strictEqual(CAP.parseLine("hw in 3 weeks", {today: "2026-10-20", courses: []}).due, "2026-11-10");
  assert.strictEqual(CAP.diff("2026-03-01", "2026-04-01"), 31);
  assert.strictEqual(CAP.parseLine("hw feb 29", {today: "2027-01-10", courses: []}).due, "2028-02-29");
  assert.strictEqual(CAP.parseLine("hw feb 29", {today: "2027-12-10", courses: []}).due, "2028-02-29");
});
t("several lines are several tasks; a date-only line joins the task above", () => {
  const r = CAP.fromText("- bio quiz fri 2pm\n- chem201 pset oct 28\n3) read ch 4 tomorrow", ctx);
  assert.strictEqual(r.drafts.length, 3); assert.ok(r.multi); assert.ok(r.confident); assert.strictEqual(r.drafts[0].kind, "multi");
  const j = CAP.fromText("Essay 2\nDue Oct 28 at 11:59pm", ctx); assert.strictEqual(j.drafts.length, 1); assert.strictEqual(j.drafts[0].due, "2026-10-28"); assert.strictEqual(j.drafts[0].time, "23:59");
  assert.strictEqual(CAP.fromText("hw 1 fri; hw 2 mon", ctx).drafts.length, 2);
  assert.strictEqual(CAP.fromText(Array(40).fill("hw fri").join("\n"), ctx).drafts.length, 20);
});
t("shared links: LMS recognised, never fetched, link attached", () => {
  assert.strictEqual(CAP.lmsInfo("https://school.instructure.com/courses/12/assignments/34").platform, "Canvas");
  assert.strictEqual(CAP.lmsInfo("https://x.brightspace.com/d2l/lms/dropbox/user/folder_submit_files.d2l").platform, "Brightspace");
  assert.strictEqual(CAP.lmsInfo("https://bb.school.edu/webapps/blackboard/execute/x").platform, "Blackboard");
  assert.strictEqual(CAP.lmsInfo("https://example.com/"), null); assert.strictEqual(CAP.lmsInfo("javascript:alert(1)"), null);
  const r = CAP.fromShare({title: "Essay 2 - BIO101", text: "Due Oct 28 at 11:59pm", url: "https://school.instructure.com/courses/12/assignments/34"}, ctx);
  assert.strictEqual(r.drafts.length, 1); const d = r.drafts[0];
  assert.strictEqual(d.link, "https://school.instructure.com/courses/12/assignments/34"); assert.strictEqual(d.platform, "Canvas"); assert.strictEqual(d.due, "2026-10-28"); assert.strictEqual(d.courseId, "c1");
  const only = CAP.fromShare({url: "https://school.instructure.com/courses/12/assignments/34"}, ctx);
  assert.strictEqual(only.drafts[0].title, "Canvas link"); assert.ok(!only.confident); assert.ok(only.drafts[0].flags.includes("needsTitle"));
  const inText = CAP.fromShare({text: "hw 3 fri https://example.com/page"}, ctx); assert.strictEqual(inText.drafts[0].link, "https://example.com/page"); assert.strictEqual(inText.drafts[0].title, "Homework 3");
});
t("sanitizing: html stripped, control chars gone, caps applied", () => {
  const d = P("<img src=x onerror=alert(1)> hw 3 fri <script>x</script>"); assert.ok(!/[<>]/.test(d.title)); assert.strictEqual(d.due, "2026-10-09");
  assert.strictEqual(CAP.clean("a\u0000b‮c", 10), "abc"); assert.strictEqual(CAP.clean("x".repeat(500), 50).length, 50);
  assert.strictEqual(CAP.safeLink("javascript:alert(1)"), ""); assert.strictEqual(CAP.safeLink("https://u:p@x.com/"), ""); assert.strictEqual(CAP.safeLink("https://x.com/a b"), "");
});
t("URL params: valid, caps, allowlist, hash form, schemes", () => {
  let r = CAP.parseUrl("https://app.example/?capture=bio%20quiz%20fri%202pm&source=ios-shortcut&due=2026-10-09&course=BIO101&evil=1", {today: ctx.today});
  assert.ok(r.ok); assert.strictEqual(r.action, "text"); assert.strictEqual(r.params.text, "bio quiz fri 2pm"); assert.strictEqual(r.params.source, "ios-shortcut"); assert.ok(r.trustedSource); assert.strictEqual(r.params.due, "2026-10-09"); assert.strictEqual(r.ignored, 1);
  r = CAP.parseUrl("https://app.example/#capture=hw%203%20fri&source=siri"); assert.ok(r.ok); assert.strictEqual(r.params.text, "hw 3 fri");
  r = CAP.parseUrl("studyboard://add?title=Read%20ch%205&due=2026-10-12&hours=2&type=reading&source=shortcuts"); assert.ok(r.ok); assert.strictEqual(r.params.title, "Read ch 5"); assert.strictEqual(r.params.type, "Reading"); assert.strictEqual(r.params.hours, 2); assert.ok(r.trustedSource);
  assert.strictEqual(CAP.parseUrl("studyboard://capture?photo=1").action, "photo"); assert.strictEqual(CAP.parseUrl("https://a.b/?capture=photo").action, "photo");
  assert.strictEqual(CAP.parseUrl("https://a.b/?capture=1").action, "open"); assert.strictEqual(CAP.parseUrl("studyboard://capture").action, "open");
  assert.strictEqual(CAP.parseUrl("https://a.b/?share=1&title=T&text=x").action, "share");
  // hostile input
  assert.ok(!CAP.parseUrl("javascript:alert(1)").ok); assert.ok(!CAP.parseUrl("studyboard://open?task=1").ok); assert.ok(!CAP.parseUrl("data:text/html,x").ok); assert.ok(!CAP.parseUrl("https://a.b/?x=1").ok);
  assert.ok(!CAP.parseUrl("https://u:p@a.b/?capture=x").ok); assert.ok(!CAP.parseUrl("https://a.b/?capture=" + "x".repeat(7000)).ok); assert.ok(!CAP.parseUrl(null).ok);
  r = CAP.parseUrl("https://a.b/?capture=" + encodeURIComponent("<b>hw</b> <script>alert(1)</script> fri" + "y".repeat(5000)) + "&due=2020-01-01&time=25:00&type=hax&hours=-3&source=evil&link=javascript:x&course=" + "c".repeat(200), {today: ctx.today});
  assert.ok(r.ok); assert.ok(!/[<>]/.test(r.params.text)); assert.ok(r.params.text.length <= 2000); assert.strictEqual(r.params.due, ""); assert.strictEqual(r.params.time, ""); assert.strictEqual(r.params.type, "");
  assert.strictEqual(r.params.hours, null); assert.strictEqual(r.params.source, "web"); assert.ok(!r.trustedSource); assert.strictEqual(r.params.link, ""); assert.strictEqual(r.params.course.length, 40);
  assert.strictEqual(CAP.parseUrl("https://a.b/?capture=x&due=2026-02-30").params.due, "");
  assert.strictEqual(CAP.parseUrl("https://a.b/?share=1&sw=abc123def").params.sw, "abc123def"); assert.strictEqual(CAP.parseUrl("https://a.b/?share=1&sw=../../x").params.sw, "");
});
t("rate limit: 10 a minute", () => {
  let now = 0; const rl = CAP.rateLimiter(10, 60000, () => now); let ok = 0;
  for (let i = 0; i < 15; i++) { now += 1000; if (rl.take()) ok++; } assert.strictEqual(ok, 10);
  now += 60000; assert.ok(rl.take());
});
t("queue keeps the newest 50", () => {
  let q = []; for (let i = 0; i < 60; i++) q = CAP.queuePush(q, i, 50); assert.strictEqual(q.length, 50); assert.strictEqual(q[0], 10); assert.strictEqual(q[49], 59);
});
t("inbox drafts are made to fit", () => {
  const d = CAP.sanitizeDraft({id: 7, title: "<b>Read ch 3</b>", dueDate: "2026-10-12", course: "bio101", type: "reading", hours: 500, link: "javascript:x", confidence: 0.4}, ctx);
  assert.strictEqual(d.title, "Read ch 3"); assert.strictEqual(d.courseId, "c1"); assert.strictEqual(d.type, "Reading"); assert.strictEqual(d.hours, null); assert.strictEqual(d.link, ""); assert.ok(!d.confident); assert.strictEqual(d.extId, "7");
  assert.strictEqual(CAP.sanitizeDraft({title: ""}, ctx), null); assert.strictEqual(CAP.sanitizeDraft(null, ctx), null); assert.strictEqual(CAP.sanitizeDraft({title: "x", due: "1999-01-01"}, ctx).due, "");
});
t("dedupe by normalized title + date", () => {
  const ex = [{title: "Lab Report 3", due: "2026-10-09"}, {title: "Read ch 1", due: ""}];
  const r = CAP.dedupe([{title: "lab report 3!", due: "2026-10-09"}, {title: "Lab report 3", due: "2026-10-16"}, {title: "The read ch 1", due: "2026-10-20"}, {title: "Quiz", due: "2026-10-09"}, {title: "quiz", due: "2026-10-09"}], ex);
  assert.deepStrictEqual(r.drafts.map(d => d.title), ["Lab report 3", "The read ch 1", "Quiz"]); assert.strictEqual(r.dups, 2);
});
// ---- the photo model's answer ----
const vc = Object.assign({existing: [{title: "Problem set 4", due: "2026-10-16"}]}, ctx);
const it = (o) => Object.assign({title: "Lab report 3", dueDate: "2026-10-09", dueTime: "", course: "", type: "Lab", notes: "", confidence: 0.9}, o);
t("vision: good output passes, relative date kept, low confidence unchecked", () => {
  const g = CAP.gateVision({items: [it({course: "BIO101"}), it({title: "Midterm", dueDate: "2026-10-20", type: "Exam", confidence: 0.4})], rawText: "Lab report 3 due Friday\nMidterm Oct 20"}, vc);
  assert.strictEqual(g.items.length, 2); assert.strictEqual(g.items[0].courseId, "c1"); assert.ok(g.items[0].checked); assert.ok(!g.items[1].checked); assert.strictEqual(g.low, 1); assert.strictEqual(g.items[1].priority, "high");
});
t("vision: invented dates are removed (no date in the photo, or a different date)", () => {
  let g = CAP.gateVision({items: [it({title: "Read chapter 4", dueDate: "2026-10-15"})], rawText: "Read chapter 4"}, vc);
  assert.strictEqual(g.items[0].due, ""); assert.ok(g.items[0].flags.includes("invented"));
  g = CAP.gateVision({items: [it({title: "Midterm", dueDate: "2026-11-19", type: "Exam"})], rawText: "Midterm Nov 12"}, vc); assert.strictEqual(g.items[0].due, "");
  g = CAP.gateVision({items: [it({title: "Midterm", dueDate: "2026-11-12", type: "Exam"})], rawText: "Midterm Nov 12"}, vc); assert.strictEqual(g.items[0].due, "2026-11-12");
  g = CAP.gateVision({items: [it({dueDate: "2026-10-09", dueTime: "17:00"})], rawText: "Lab report 3 due Fri 5pm"}, vc); assert.strictEqual(g.items[0].time, "17:00");
  g = CAP.gateVision({items: [it({dueDate: "", dueTime: "17:00"})], rawText: "Lab report 3"}, vc); assert.strictEqual(g.items[0].time, "");
});
t("vision: past, far future, impossible dates and bad times", () => {
  let g = CAP.gateVision({items: [it({dueDate: "2025-01-10"})], rawText: "Jan 10"}, vc); assert.strictEqual(g.items[0].due, "");
  g = CAP.gateVision({items: [it({dueDate: "2031-01-10"})], rawText: "Jan 10"}, vc); assert.strictEqual(g.items[0].due, "");
  g = CAP.gateVision({items: [it({dueDate: "2026-02-31"})], rawText: "Feb 31"}, vc); assert.strictEqual(g.items[0].due, "");
  g = CAP.gateVision({items: [it({dueDate: "2026-10-01"})], rawText: "Oct 1"}, vc); assert.ok(g.items[0].flags.includes("past")); assert.ok(!g.items[0].checked);
  g = CAP.gateVision({items: [it({dueDate: "2026-10-09", dueTime: "25:99"})], rawText: "Fri"}, vc); assert.strictEqual(g.items[0].time, "");
  g = CAP.gateVision({items: [it({dueDate: "2026-10-09"})]}, vc); assert.ok(g.items[0].confidence <= 0.55, "no rawText: cannot verify");
});
t("vision: duplicates, generic, empty, over-long, cap of 20", () => {
  const g = CAP.gateVision({items: [it(), it({title: "LAB report 3."}), it({title: "Problem set 4", dueDate: "2026-10-16"}), it({title: "homework"}), it({title: "   "}), it({title: "x".repeat(300)}), null, "junk", it({title: "Quiz 2", dueDate: "2026-10-12", type: "Quiz"})], rawText: "Lab report 3 Fri\nProblem set 4 Oct 16\nQuiz 2 Oct 12"}, vc);
  assert.deepStrictEqual(g.items.map(d => d.title), ["Lab report 3", "Quiz 2"]); assert.ok(g.dropped.dup >= 2); assert.strictEqual(g.dropped.generic, 1); assert.strictEqual(g.dropped.long, 1); assert.ok(g.dropped.empty >= 2);
  const many = Array.from({length: 45}, (_, i) => it({title: "Task number " + i, dueDate: "2026-10-12"}));
  assert.strictEqual(CAP.gateVision({items: many, rawText: "Oct 12"}, vc).items.length, 20);
  assert.strictEqual(CAP.gateVision({items: [it({title: "Exam", course: "BIO101", type: "Exam"})], rawText: "Fri"}, vc).items[0].title, "BIO101 exam");
});
t("vision: non-JSON, fenced JSON, prose around JSON, wrong shape", () => {
  assert.ok(CAP.gateVision("sorry, I can't read that", vc).bad); assert.ok(CAP.gateVision(null, vc).bad); assert.ok(CAP.gateVision("", vc).bad);
  assert.strictEqual(CAP.gateVision("```json\n" + JSON.stringify({items: [it()], rawText: "Fri"}) + "\n```", vc).items.length, 1);
  assert.strictEqual(CAP.gateVision("Here: " + JSON.stringify({items: [it()], rawText: "Fri"}) + " done", vc).items.length, 1);
  assert.strictEqual(CAP.gateVision({items: "nope"}, vc).items.length, 0); assert.strictEqual(CAP.gateVision({items: [it({type: "Banana", title: "Lab report 3"})], rawText: "Fri"}, vc).items[0].type, "Lab");
  assert.strictEqual(CAP.gateVision({items: [it({title: "**Bold** <b>x</b>"})], rawText: "Fri"}, vc).items[0].title.includes("<"), false);
});
t("vision prompt and schema", () => {
  const u = CAP.visionUser(ctx, "due friday"), s = CAP.visionSystem();
  assert.match(u, /Saturday 2026-10-03/); assert.match(s, /Never invent/i); assert.match(s, /next <weekday>/); assert.deepStrictEqual(CAP.VISION_SCHEMA.required, ["items", "rawText"]);
  assert.ok(CAP.VISION_SCHEMA.properties.items.items.properties.dueDate && CAP.VISION_SCHEMA.properties.items.items.properties.confidence);
});
t("screenshot prompt and schema classify what the picture is", () => {
  const S = CAP.shotSystem();
  assert.match(S, /Never invent/i); assert.match(S, /syllabus/); assert.match(S, /timetable/); assert.match(S, /empty items array/i);
  assert.deepStrictEqual(CAP.SHOT_KINDS, ["tasks", "syllabus", "course", "notes", "other"]);
  assert.deepStrictEqual(CAP.SHOT_SCHEMA.properties.kind.enum, CAP.SHOT_KINDS); assert.ok(CAP.SHOT_SCHEMA.required.includes("kind"));
  assert.ok(CAP.SHOT_SCHEMA.properties.items && CAP.SHOT_SCHEMA.properties.rawText);        // everything a photo returns, plus the kind
  assert.deepStrictEqual(CAP.VISION_SCHEMA.required, ["items", "rawText"]);                 // photos are unchanged
});
console.log(n + " capture tests passed");
