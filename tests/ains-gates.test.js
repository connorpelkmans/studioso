// Unit tests for the Automatic AI quality gates (pure logic extracted from index.html).  Run: node tests/ains-gates.test.js
const fs = require("fs"), path = require("path"), assert = require("assert");
const s = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const code = s.slice(s.indexOf("/*AINS-START*/"), s.indexOf("/*AINS-END*/"));
const TYPES = ["Assignment", "Exam", "Quiz", "Reading", "Project", "Lab", "Study", "Other"];
const A = new Function("TYPES", code + ";return AINS;")(TYPES);
let n = 0; const ok = (c, m) => { n++; assert(c, m); };
const day = d => new Date(d + "T00:00:00").toLocaleDateString("en-US", {weekday: "long"});

// generic filler is rejected
["Stay organized and keep up the good work!", "Don't forget to plan ahead this week.", "It's important to manage your time wisely.", "Make sure to start early and prioritize your tasks.", "Remember to take breaks.", "You've got this!", "Exams are approaching, so stay on track."].forEach(t => ok(A.generic(t), t));
["Bio lab pre-quiz is due Wed, a day before the report.", "Stats HW is worth 20% and due Thursday.", "3 deadlines Thu: Bio lab, Stats HW, Essay draft"].forEach(t => ok(!A.generic(t), t));

// restating the title is rejected; adding data is fine
ok(A.restates("Work on Stats HW", "Stats HW"), "restate");
ok(A.restates("Finish the Stats HW now", "Stats HW"), "restate2");
ok(!A.restates("Due Thursday, worth 20%, 3h left", "Stats HW"), "adds facts");

// vet: length, citation, links
ok(A.vet("x".repeat(300) + " 3 days", {max: 140}) === "", "too long");
ok(A.vet("Check the syllabus for details soon", {needCite: true, titles: ["Stats HW"]}) === "", "no citation");
ok(A.vet("Stats HW needs the dataset first", {needCite: true, titles: ["Stats HW"]}) !== "", "cites title word");
ok(A.vet("Due Fri, see https://evil.example now", {}).indexOf("http") < 0, "links stripped");

// heads-up: invented ref, generic, duplicate, restating, cap of 2
const back = {t1: "id1", t2: "id2", t3: "id3"}, titles = ["Bio lab", "Stats HW", "Essay draft"];
const heads = A.cleanHeads([
  {ref: "t1", text: "Bio lab pre-quiz is due Wed, a day before the lab report"},
  {ref: "t9", text: "Stats HW is due in 2 days and still has no estimate"},          // invented id
  {ref: "t2", text: "Stay organized and plan ahead for this week"},                  // generic
  {ref: "t2", text: "Stats HW"},                                                     // restates
  {ref: "t1", text: "Bio lab pre-quiz is due Wed, a day before the lab report."},     // duplicate
  {ref: "", text: "Thursday has 3 deadlines in a row, so start the essay Tuesday"},
  {ref: "t3", text: "Essay draft instructions say an outline is due Monday"}           // over the cap
], back, {titleOf: id => ({id1: "Bio lab", id2: "Stats HW", id3: "Essay draft"})[id], titles, courses: []});
ok(heads.length === 2 && heads[0].id === "id1" && !heads[1].id, JSON.stringify(heads));
ok(A.cleanHeads([{text: "Thursday has 3 deadlines: Bio lab, Stats HW and Essay draft"}], {}, {visible: ["Thursday has 3 deadlines (Bio lab, Stats HW, Essay draft)."], titles}).length === 0, "already visible elsewhere");

// Do This Next text
let p = A.cleanPickText("Important task that should be done soon", "Start working on it", "Stats HW", {titles});
ok(p.why === "" && p.step === "", JSON.stringify(p));
p = A.cleanPickText("Due Thu and worth 20%, about 3h left", "Do problems 1 to 4 from the worksheet", "Stats HW", {titles});
ok(p.why && p.step, JSON.stringify(p));

// hours sanity vs the app's own estimate
ok(A.hoursSane(2, 2) === 2 && A.hoursSane(2.1, 2) === 2, "ok");
ok(A.hoursSane(30, 2) === null, "15x the local estimate");
ok(A.hoursSane(0, 2) === null && A.hoursSane(-3, 0) === null && A.hoursSane(100, 0) === null, "bounds");

// weekly review
const stats = {done: 5, doneTitles: ["Bio lab", "Quiz 2"], slipped: [{id: "a", title: "Essay draft", due: "2026-09-30"}], slippedN: 1, next: [{date: "2026-10-08", count: 3, titles: ["Bio lab", "Stats HW", "Essay"]}], heavy: [{date: "2026-10-08", count: 3}], exams: [], nextTotal: 4};
ok(A.weeklyWorth(stats), "worth");
ok(!A.weeklyWorth({done: 1, slippedN: 0, heavy: [], exams: [], next: [], nextTotal: 1}), "quiet week is skipped");
ok(A.vetWeekly({recap: "You finished 5 tasks and 1 slipped past its due date.", suggestion: "Do the Stats HW on Tuesday: Thursday already has 3 deadlines."}, stats, day), "good weekly");
ok(A.vetWeekly({recap: "You finished 9 tasks and 1 slipped past its due date.", suggestion: "Do the Stats HW on Tuesday: Thursday already has 3 deadlines."}, stats, day) === null, "wrong count");
ok(A.vetWeekly({recap: "You finished 5 tasks and 1 slipped past its due date.", suggestion: "Stay organized and keep up the good work this week."}, stats, day) === null, "generic suggestion");
ok(A.vetWeekly({recap: "You finished 5 tasks and 1 slipped past its due date.", suggestion: "Try to get more sleep and eat well during the week ahead."}, stats, day) === null, "names nothing real");

// announcements: summary restating title is dropped, proposals must come from the text, past dates dropped, dups dropped
const ann = {key: "k1", cid: "c1", title: "Midterm moved", text: "The Chem midterm has been moved to Friday October 17 at 10am in room 204."};
let r = A.cleanAnn({items: [{ref: "a1", summary: "Midterm moved", important: true, category: "exam", items: [
  {kind: "event", title: "Chem midterm", date: "2026-10-17", time: "10:00"},
  {kind: "task", title: "Quantum physics essay", date: "2026-10-20"},          // not in the announcement
  {kind: "event", title: "Chem midterm", date: "2026-09-01"}                   // past
]}]}, {a1: ann}, {today: "2026-10-03", tasks: [], events: [], types: TYPES});
ok(r.length === 1 && r[0].sum === "The Chem midterm has been moved to Friday October 17 at 10am in room 204." && r[0].imp && r[0].props.length === 1 && r[0].props[0].title === "Chem midterm", JSON.stringify(r));

// coach: generic steps and repeated focus replaced
const co = A.cleanCoach({sessions: [{focus: "Glycolysis and the Krebs cycle", steps: ["Review notes", "Draw the Krebs cycle from memory and label each enzyme", "Stay organized"]}, {focus: "Glycolysis and the Krebs cycle", steps: ["Work 10 past-paper questions on enzyme kinetics"]}]}, 2);
ok(co[0].steps.length === 1 && /Krebs/.test(co[0].steps[0]), JSON.stringify(co[0]));
ok(co[1].focus !== co[0].focus, "duplicate focus replaced");

// heads-up that claims "the instructions say" with no instructions or announcements to read is rejected
ok(A.cleanHeads([{ref: "t1", text: "Bio lab instructions say a pre-quiz is due Wed"}], back, {titles, hasSource: () => false}).length === 0, "unsupported source claim");
ok(A.cleanHeads([{ref: "t1", text: "Bio lab instructions say a pre-quiz is due Wed"}], back, {titles, hasSource: () => true}).length === 1, "supported source claim");

// triage: a course guess needs evidence in the task text; a bare hours guess is not offered
const tk = {id: "z", title: "hw3", type: "Assignment", priority: "med", courseId: "", notes: "", due: "2026-10-09", hours: null};
let tr = A.cleanTriage({items: [{ref: "t1", courseRef: "c1", hours: 2}]}, {t1: tk}, {c1: "cid"}, TYPES, {cid: "STAT 101 Statistics"});
ok(tr.length === 0, "no evidence for the course, hours alone: " + JSON.stringify(tr));
tr = A.cleanTriage({items: [{ref: "t1", title: "Homework 3: Chapter 3 problems", courseRef: "c1", hours: 2}]}, {t1: Object.assign({}, tk, {notes: "stat problems ch 3"})}, {c1: "cid"}, TYPES, {cid: "STAT 101 Statistics"});
ok(tr.length === 1 && tr[0].patch.courseId === "cid" && tr[0].patch.hours === 2, JSON.stringify(tr));

// exam plan: a 12-day window gives at most 6 sessions, none under 45 minutes, ending the day before the exam
const sl = A.examSlots({today: "2026-10-03", due: "2026-10-15", avail: () => 3, total: 10, maxPer: 2, minPer: 0.75, maxN: 6});
ok(sl.length === 6 && sl.every(x => x.hours >= 0.75) && sl[5].date === "2026-10-14", JSON.stringify(sl));
const g = A.cleanCoach(null, 6);
ok(new Set(g.map(x => x.focus)).size === 6, "fallback focuses are all different");

// count claims must match the data
const cctx = {titles, countOn: d => d === 4 ? 3 : 0, openCount: 6};
ok(A.cleanHeads([{text: "Thursday has 3 deadlines: Bio lab, Stats HW and Essay draft"}], {}, cctx).length === 1, "true count");
ok(A.cleanHeads([{text: "Thursday has 5 deadlines: Bio lab, Stats HW and Essay draft"}], {}, cctx).length === 0, "wrong count for the day");
ok(A.cleanHeads([{text: "9 tasks are waiting, starting with Bio lab"}], {}, cctx).length === 0, "more than are open");

console.log("ains-gates: " + n + " checks passed");
