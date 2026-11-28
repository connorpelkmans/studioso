// Builds a full sample student data set as a Studyboard backup file, for testing.
// Import it with Settings > Import from a Backup File (it replaces what's in the account; Undo is offered right after).
//   node sample-data/make-sample-backup.js [YYYY-MM-DD]
// Dates are built around "today" (or the date given), so the board always has overdue, due-soon and later work.
const fs = require("fs"), path = require("path");

const TODAY = process.argv[2] && /^\d{4}-\d{2}-\d{2}$/.test(process.argv[2]) ? process.argv[2] : new Date().toISOString().slice(0, 10);
const pad = n => String(n).padStart(2, "0");
const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const base = new Date(TODAY + "T12:00:00");
const D = n => { const d = new Date(base); d.setDate(d.getDate() + n); return iso(d); };
const NOW = base.getTime();
const ago = days => NOW - days * 864e5;
// the term runs from about 12 weeks back to 3 weeks ahead
const TERM_START = D(-82), TERM_END = D(22);

/* ---------- Courses ---------- */
const courses = [
  {id: "s-bio", name: "Anatomy & Physiology I", code: "BIOL 1200", color: "#1E9E74", instructor: "Dr. Priya Raman", office: "Tue 2:00-3:30 PM, SW1 3104",
    meetings: [{id: "s-m1", kind: "Lecture", days: [1, 3], start: "09:30", end: "11:20", where: "SW1 2015"}, {id: "s-m2", kind: "Lab", days: [4], start: "13:30", end: "16:20", where: "Science Lab B"}],
    links: [{t: "Course Site", u: "https://example.edu/biol1200"}], grading: {goal: 85, pass: 50}, created: ago(85), order: 1},
  {id: "s-psy", name: "Introduction to Psychology", code: "PSYC 1010", color: "#3B6FE0", instructor: "Prof. Daniel Okafor", office: "Thu 10:00-11:00 AM, Hall C 210",
    meetings: [{id: "s-m3", kind: "Lecture", days: [2, 4], start: "11:30", end: "12:50", where: "Hall C 101"}, {id: "s-m4", kind: "Tutorial", days: [5], start: "09:00", end: "09:50", where: "Hall C 015"}],
    grading: {goal: 80, pass: 50}, created: ago(85), order: 2},
  {id: "s-eng", name: "Academic Writing", code: "ENGL 1100", color: "#D9661F", instructor: "Ms. Hannah Leclerc", office: "By appointment",
    meetings: [{id: "s-m5", kind: "Seminar", days: [5], start: "10:00", end: "11:50", where: "Room 214"}],
    grading: {goal: 80, pass: 50}, created: ago(85), order: 3},
  {id: "s-mat", name: "Calculus I", code: "MATH 1500", color: "#8E44AD", instructor: "Dr. Marcus Feld", office: "Mon/Wed 1:00-2:00 PM, Math 402",
    meetings: [{id: "s-m6", kind: "Lecture", days: [1, 3, 5], start: "08:30", end: "09:20", where: "Math 110"}, {id: "s-m7", kind: "Tutorial", days: [2], start: "15:30", end: "16:20", where: "Math 205"}],
    // category weights, so every quiz shares the Quiz slice and so on
    grading: {goal: 75, pass: 50, cats: [{cat: "Assignment", w: 15, by: "eq"}, {cat: "Quiz", w: 15, by: "eq"}, {cat: "Exam", w: 30, by: "eq"}, {cat: "Final", w: 40, by: "eq"}]}, created: ago(85), order: 4},
  {id: "s-his", name: "World History Since 1900", code: "HIST 1250", color: "#C0392B", instructor: "Dr. Elena Vasquez", office: "Wed 3:00-4:00 PM, Arts 318",
    meetings: [{id: "s-m8", kind: "Lecture", days: [2, 4], start: "14:00", end: "15:20", where: "Arts 120"}],
    grading: {goal: 80, pass: 50}, created: ago(85), order: 5}
];

/* ---------- Tasks ---------- */
let order = 0;
const T = (id, title, c, type, due, o) => Object.assign({
  id: "s-" + id, title, courseId: "s-" + c, type, start: "", due, time: "23:59", priority: "med", status: "todo", notes: "", hours: 2,
  checklist: [], pct: 0, dependsOn: [], history: [], location: "", link: "", team: "", reading: "", weight: null, difficulty: "med", late: "unknown",
  focusMin: 0, created: ago(80), order: ++order * 10}, o || {});
// finished work: done some days after... and marked
const done = (got, outOf, doneDaysAgo, extra) => Object.assign({status: "done", pct: 100, doneAt: ago(doneDaysAgo), mark: got == null ? undefined : {got, outOf}}, extra || {});
const cl = (...items) => items.map((x, i) => ({id: "c" + i, text: x.replace(/^\+/, ""), done: x.startsWith("+")}));

const tasks = [
  // Biology: weights add to 100
  T("b1", "Lab 1: Microscopy & Cell Structure", "bio", "Lab", D(-70), Object.assign({weight: 5, hours: 3, focusMin: 150}, done(44, 50, 70))),
  T("b2", "Quiz 1: Tissues", "bio", "Quiz", D(-63), Object.assign({weight: 3, hours: 1, time: "10:00"}, done(17, 20, 63))),
  T("b3", "Lab 2: Membrane Transport", "bio", "Lab", D(-56), Object.assign({weight: 5, hours: 3, focusMin: 170}, done(41, 50, 57))),
  T("b4", "Quiz 2: Integumentary System", "bio", "Quiz", D(-49), Object.assign({weight: 3, hours: 1, time: "10:00"}, done(15, 20, 49))),
  T("b5", "Midterm Exam 1", "bio", "Exam", D(-42), Object.assign({weight: 15, hours: 8, time: "09:30", location: "SW1 1020", difficulty: "hard", focusMin: 420}, done(71, 90, 42))),
  T("b6", "Lab 3: Bone Identification", "bio", "Lab", D(-35), Object.assign({weight: 5, hours: 3}, done(47, 50, 35))),
  T("b7", "Quiz 3: Skeletal System", "bio", "Quiz", D(-28), Object.assign({weight: 3, hours: 1, time: "10:00"}, done(13, 20, 28))),
  T("b8", "Lab 4: Muscle Physiology", "bio", "Lab", D(-14), Object.assign({weight: 5, hours: 3, notes: "Bring the EMG worksheet."}, done(43, 50, 13))),
  T("b9", "Midterm Exam 2", "bio", "Exam", D(-9), Object.assign({weight: 15, hours: 8, time: "09:30", location: "SW1 1020", difficulty: "hard", focusMin: 380}, done(null, null, 9))),
  T("b10", "Lab Report: Nervous System Reflexes", "bio", "Lab", D(2), {weight: 6, hours: 4, status: "doing", pct: 55, priority: "high", start: D(-5), focusMin: 95,
    checklist: cl("+Collect class data", "+Make reflex time graphs", "Write discussion", "Format references (APA)"), late: "penalty", latePen: 10}),
  T("b11", "Quiz 4: Nervous System", "bio", "Quiz", D(4), {weight: 3, hours: 1.5, time: "10:00"}),
  T("b12", "Read Chapter 15: Special Senses", "bio", "Reading", D(3), {hours: 1.5, reading: "Marieb ch. 15, pp. 540-588"}),
  T("b13", "Lab 5: Special Senses", "bio", "Lab", D(7), {weight: 5, hours: 3}),
  T("b14", "Final Exam", "bio", "Exam", D(18), {weight: 27, hours: 12, time: "09:00", location: "Gym A", difficulty: "hard", priority: "high", start: D(4),
    prep: {v: 1, intensity: 90, style: ["mc", "short"], light: true, ai: false, start: D(4), examDue: D(18), createdAt: ago(2), updatedAt: ago(2), manual: true,
      topics: [{id: "pt1", name: "Tissues & Integumentary", conf: "strong"}, {id: "pt2", name: "Skeletal System", conf: "weak"}, {id: "pt3", name: "Muscular System", conf: "ok"},
        {id: "pt4", name: "Nervous System", conf: "weak"}, {id: "pt5", name: "Special Senses", conf: "ok"}]}}),

  // Psychology: weights add to 100
  T("p1", "Chapter 1 Quiz", "psy", "Quiz", D(-68), Object.assign({weight: 2, hours: 0.5}, done(9, 10, 68))),
  T("p2", "Chapter 2 Quiz", "psy", "Quiz", D(-61), Object.assign({weight: 2, hours: 0.5}, done(8, 10, 61))),
  T("p3", "Research Ethics Reflection", "psy", "Assignment", D(-54), Object.assign({weight: 8, hours: 3}, done(36, 40, 54))),
  T("p4", "Chapter 3 Quiz", "psy", "Quiz", D(-47), Object.assign({weight: 2, hours: 0.5}, done(7, 10, 47))),
  T("p5", "Midterm Exam", "psy", "Exam", D(-38), Object.assign({weight: 25, hours: 6, time: "11:30", location: "Hall C 101", focusMin: 300}, done(78, 100, 38))),
  T("p6", "Chapter 5 Quiz", "psy", "Quiz", D(-26), Object.assign({weight: 2, hours: 0.5}, done(10, 10, 26))),
  T("p7", "Chapter 6 Quiz", "psy", "Quiz", D(-12), Object.assign({weight: 2, hours: 0.5}, done(6, 10, 12))),
  T("p8", "Research Participation (SONA credits)", "psy", "Other", D(10), {weight: 3, hours: 2, pct: 66, status: "doing", notes: "2 of 3 credits done.", checklist: cl("+Study 1: Memory", "+Study 2: Attention", "Study 3")}),
  T("p9", "Chapter 7 Quiz", "psy", "Quiz", D(-1), {weight: 2, hours: 0.5, priority: "high", late: "none"}),
  T("p10", "Read Chapter 8: Motivation & Emotion", "psy", "Reading", D(1), {hours: 1.5}),
  T("p11", "Group Presentation: Sleep & Memory", "psy", "Project", D(6), {weight: 15, hours: 8, team: "Aisha, Ben, Carmen", status: "doing", pct: 30, start: D(-10), priority: "high",
    checklist: cl("+Pick topic", "+Split sections", "Find 3 studies each", "Build slides", "Rehearse together")}),
  T("p12", "Chapter 8 Quiz", "psy", "Quiz", D(8), {weight: 2, hours: 0.5}),
  T("p13", "Final Exam", "psy", "Exam", D(16), {weight: 35, hours: 10, time: "14:00", location: "Gym B", priority: "high"}),

  // English: weights add to 100
  T("e1", "Diagnostic Essay", "eng", "Assignment", D(-71), Object.assign({weight: 5, hours: 2}, done(null, null, 71, {mark: {got: 100, outOf: 100, pf: "pass"}}))),
  T("e2", "Discussion Post 1", "eng", "Assignment", D(-64), Object.assign({weight: 2, hours: 1}, done(2, 2, 64))),
  T("e3", "Summary & Response", "eng", "Assignment", D(-57), Object.assign({weight: 10, hours: 4}, done(16, 20, 56))),
  T("e4", "Discussion Post 2", "eng", "Assignment", D(-50), Object.assign({weight: 2, hours: 1}, done(2, 2, 50))),
  T("e5", "Rhetorical Analysis", "eng", "Assignment", D(-36), Object.assign({weight: 15, hours: 6, focusMin: 260}, done(null, null, 35, {mark: {got: 82, outOf: 100, before: 91.1, pen: {v: 10, pct: true}}}))),
  T("e6", "Discussion Post 3", "eng", "Assignment", D(-29), Object.assign({weight: 2, hours: 1}, done(1.5, 2, 29))),
  T("e7", "Annotated Bibliography", "eng", "Assignment", D(-15), Object.assign({weight: 10, hours: 5}, done(44, 50, 15))),
  T("e8", "Discussion Post 4", "eng", "Assignment", D(-3), {weight: 2, hours: 1, late: "free", notes: "Forgot this one, still accepted this week."}),
  T("e9", "Research Essay: Outline", "eng", "Assignment", D(-6), Object.assign({weight: 4, hours: 2}, done(9, 10, 6))),
  T("e10", "Research Essay: Full Draft", "eng", "Assignment", D(3), {weight: 10, hours: 8, status: "doing", pct: 40, priority: "high", start: D(-6), focusMin: 140,
    checklist: cl("+Outline", "+Find 6 sources", "Write introduction", "Write body sections", "Write conclusion", "Proofread"), late: "penalty", latePen: 5}),
  T("e11", "Peer Review Workshop", "eng", "Assignment", D(5), {weight: 3, hours: 1.5, time: "10:00", location: "Room 214"}),
  T("e12", "Research Essay: Final", "eng", "Assignment", D(14), {weight: 25, hours: 10, dependsOn: ["s-e10"]}),
  T("e13", "Portfolio Reflection", "eng", "Assignment", D(19), {weight: 10, hours: 3}),

  // Calculus: category weights in Grade Settings, no per-task weights
  T("m1", "Assignment 1: Limits", "mat", "Assignment", D(-66), done(18, 20, 66, {hours: 3})),
  T("m2", "Quiz 1", "mat", "Quiz", D(-60), done(8, 10, 60, {hours: 0.5, time: "15:30"})),
  T("m3", "Assignment 2: Derivatives", "mat", "Assignment", D(-52), done(15, 20, 52, {hours: 3})),
  T("m4", "Quiz 2", "mat", "Quiz", D(-46), done(6, 10, 46, {hours: 0.5, time: "15:30"})),
  T("m5", "Midterm Exam", "mat", "Exam", D(-40), done(52, 75, 40, {hours: 8, time: "18:30", location: "Math 110", difficulty: "hard", focusMin: 360})),
  T("m6", "Assignment 3: Chain Rule & Implicit Diff.", "mat", "Assignment", D(-31), done(17, 20, 31, {hours: 3})),
  T("m7", "Quiz 3", "mat", "Quiz", D(-25), done(7, 10, 25, {hours: 0.5, time: "15:30"})),
  T("m8", "Assignment 4: Related Rates", "mat", "Assignment", D(-11), done(14, 20, 10, {hours: 4})),
  T("m9", "Quiz 4", "mat", "Quiz", D(-4), {hours: 0.5, time: "15:30", status: "done", pct: 100, doneAt: ago(4), notes: "Mark not posted yet."}),
  T("m10", "Practice Problems 4.1-4.4", "mat", "Study", D(0), {hours: 1.5, difficulty: "hard", checklist: cl("+4.1 odd", "4.2 odd", "4.3 odd", "4.4 odd")}),
  T("m11", "Assignment 5: Optimization", "mat", "Assignment", D(5), {hours: 4, difficulty: "hard", priority: "high", link: "https://example.edu/math1500/a5.pdf"}),
  T("m12", "Quiz 5", "mat", "Quiz", D(10), {hours: 0.5, time: "15:30"}),
  T("m13", "Final Exam", "mat", "Exam", D(20), {hours: 14, time: "18:30", location: "Gym A", difficulty: "hard", priority: "urgent"}),

  // History: weights add to 100
  T("h1", "Map Quiz: Europe 1914", "his", "Quiz", D(-65), Object.assign({weight: 5, hours: 1}, done(45, 50, 65))),
  T("h2", "Primary Source Analysis 1", "his", "Assignment", D(-55), Object.assign({weight: 10, hours: 4}, done(null, null, 55, {mark: {got: 88.5, outOf: 100, letter: "B+"}}))),
  T("h3", "Midterm Exam", "his", "Exam", D(-37), Object.assign({weight: 20, hours: 6, time: "14:00"}, done(81, 100, 37))),
  T("h4", "Primary Source Analysis 2", "his", "Assignment", D(-20), Object.assign({weight: 10, hours: 4}, done(null, null, 20, {excused: true, notes: "Excused, medical note submitted."}))),
  T("h5", "Read: The Cold War, ch. 11-12", "his", "Reading", D(2), {hours: 2}),
  T("h6", "Tutorial Participation", "his", "Other", D(19), {weight: 10, hours: null, notes: "Graded at the end of term."}),
  T("h7", "Research Paper: Decolonization", "his", "Project", D(9), {weight: 20, hours: 12, status: "doing", pct: 15, start: D(-14), difficulty: "hard",
    checklist: cl("+Choose a case study (Algeria)", "Library research", "Thesis + outline", "First draft", "Revise & cite (Chicago)")}),
  T("h8", "Final Exam", "his", "Exam", D(17), {weight: 25, hours: 8, time: "09:00", location: "Arts 120"}),

  // not tied to a course
  T("x1", "Apply for winter bursary", "", "Other", D(12), {courseId: "", hours: 1.5, priority: "high", link: "https://example.edu/awards"}),
  T("x2", "Register for winter courses", "", "Other", D(-2), {courseId: "", hours: 1, status: "done", pct: 100, doneAt: ago(2)})
];
tasks.forEach(t => { if (t.mark === undefined) delete t.mark; if (t.status === "done" && !t.focusMin) t.focusMin = Math.round(t.hours * 50); });

/* ---------- Calendar events ---------- */
const events = [
  {id: "s-ev1", title: "Part-time Shift (Campus Bookstore)", label: "Work", date: TERM_START, start: "17:00", end: "21:00", allDay: false, where: "Bookstore", repeat: {days: [2, 4], every: 1, until: TERM_END}, created: ago(85)},
  {id: "s-ev2", title: "Weekend Shift", label: "Work", date: TERM_START, start: "10:00", end: "15:00", allDay: false, where: "Bookstore", repeat: {days: [6], every: 1, until: TERM_END}, created: ago(85)},
  {id: "s-ev3", title: "Biology Study Group", courseId: "s-bio", date: TERM_START, start: "16:00", end: "17:30", allDay: false, where: "Library, Room 3B", repeat: {days: [1], every: 1, until: TERM_END}, created: ago(80)},
  {id: "s-ev4", title: "Intramural Volleyball", label: "Personal", date: TERM_START, start: "19:00", end: "20:30", allDay: false, where: "Rec Centre", repeat: {days: [3], every: 1, until: TERM_END}, created: ago(80)},
  {id: "s-ev5", title: "Math Help Centre", courseId: "s-mat", date: D(-21), start: "12:00", end: "13:00", allDay: false, where: "Math 301", repeat: {days: [4], every: 2, until: TERM_END}, created: ago(21)},
  {id: "s-ev6", title: "Dentist Appointment", date: D(1), start: "08:00", end: "09:00", allDay: false, where: "Downtown Dental", created: ago(10)},
  {id: "s-ev7", title: "Presentation Rehearsal", courseId: "s-psy", date: D(4), start: "18:00", end: "19:30", allDay: false, where: "Library Room 2A", notes: "Bring laptop + clicker.", created: ago(3)},
  {id: "s-ev8", title: "Last Day of Classes", date: D(8), allDay: true, created: ago(85)},
  {id: "s-ev9", title: "Exam Period", date: D(11), endDate: D(22), allDay: true, created: ago(85)},
  {id: "s-ev10", title: "Mom's Birthday Dinner", date: D(13), start: "18:30", end: "21:00", allDay: false, where: "Home", created: ago(20)},
  {id: "s-ev11", title: "Fall Reading Week", date: D(-47), endDate: D(-43), allDay: true, created: ago(85)},
  {id: "s-ev12", title: "Career Fair", date: D(-17), start: "10:00", end: "14:00", allDay: false, where: "Student Centre", created: ago(30)}
];

/* ---------- Sticky notes and a whiteboard ---------- */
const notes = [
  {id: "s-n1", text: "Ask Dr. Raman whether the final is cumulative", courseId: "s-bio", color: "yellow", x: 40, y: 40, rot: -2, pin: "pin", stickers: [{k: "think", x: 82, y: 74, r: 8}], created: ago(5)},
  {id: "s-n2", text: "Essay thesis idea: social media changes how we argue, not just where", courseId: "s-eng", color: "pink", x: 280, y: 60, rot: 2, pin: "tape", stickers: [{k: "pencil", x: 82, y: 80, r: 12}], created: ago(8)},
  {id: "s-n3", text: "Bring calculator + formula sheet Thursday", courseId: "s-mat", color: "blue", x: 520, y: 30, rot: -1, pin: "pin", created: ago(3)},
  {id: "s-n4", text: "Cranial nerves: Oh Oh Oh To Touch And Feel Very Good Velvet AH", courseId: "s-bio", color: "green", x: 760, y: 70, rot: 1, created: ago(15)},
  {id: "s-n5", text: "Group meeting Sunday 4pm on Discord", courseId: "s-psy", color: "orange", x: 60, y: 300, rot: 3, pin: "pin", stickers: [{k: "fstar", x: 84, y: 76, r: 14}], taskId: "s-p11", created: ago(4)},
  {id: "s-n6", text: "Office hours moved to Room 3110 this week", courseId: "s-bio", color: "yellow", x: 300, y: 320, rot: -3, created: ago(2)},
  {id: "s-n7", text: "Chain rule: d/dx f(g(x)) = f'(g(x)) * g'(x)", courseId: "s-mat", color: "purple", x: 540, y: 300, rot: 0, created: ago(30)},
  {id: "s-n8", text: "Paper sources: Fanon, Wretched of the Earth; Connelly, A Diplomatic Revolution", courseId: "s-his", color: "green", x: 780, y: 320, rot: 2, taskId: "s-h7", created: ago(9)},
  {id: "s-n9", text: "Groceries: oat milk, eggs, rice, apples", color: "yellow", x: 60, y: 560, rot: -1, created: ago(1)},
  {id: "s-n10", text: "Pay phone bill by the 5th", color: "pink", x: 300, y: 580, rot: 1, pin: "pin", created: ago(6)},
  {id: "s-n11", text: "Old note from week 2 (archived)", courseId: "s-psy", color: "blue", x: 540, y: 560, rot: 0, archived: true, created: ago(70)},
  {id: "s-wb1", text: "Cold War Timeline", courseId: "s-his", color: "yellow", x: 780, y: 560, created: ago(12),
    wb: {v: 1, tpl: "timeline"}, wbItems: [
      {id: "w1", k: "t", x: 120, y: 200, s: "1947 Truman Doctrine", c: "ink", f: 40},
      {id: "w2", k: "t", x: 620, y: 200, s: "1948 Berlin Airlift", c: "ink", f: 40},
      {id: "w3", k: "t", x: 1120, y: 200, s: "1962 Cuban Missile Crisis", c: "red", f: 40},
      {id: "w4", k: "t", x: 1720, y: 200, s: "1989 Fall of the Berlin Wall", c: "blue", f: 40}]}
];
notes.forEach((n, i) => { n.z = i + 1; });

/* ---------- Flashcard decks ---------- */
let cardN = 0;
// each card: [front, back, box]; box 0 is new, higher boxes were reviewed and come back later
const deck = (id, name, c, rows, extra) => Object.assign({id: "s-" + id, name, courseId: c ? "s-" + c : "", created: ago(60 - cardN / 4),
  cards: rows.map(([front, back, box]) => {
    const k = {id: "s-k" + (++cardN), front, back, box: box || 0, due: "", seen: 0, right: 0, wrong: 0};
    if (box) {
      const gap = [0, 1, 3, 7, 14, 30][box], last = -((cardN * 7) % Math.max(2, gap + 2));
      Object.assign(k, {seen: box + (cardN % 3), right: box + (cardN % 2), wrong: cardN % 3 === 0 ? 1 : 0, last: D(last), due: D(last + gap)});
    }
    return k;
  }), quizzes: [], aiQuizzes: []}, extra || {});
const decks = [
  deck("d1", "Nervous System Terms", "bio", [
    ["Neuron", "The basic functional cell of the nervous system; carries electrical impulses", 3], ["Myelin", "Fatty sheath around axons that speeds up conduction", 2],
    ["Synapse", "The junction where one neuron passes a signal to another cell", 4], ["Action potential", "A brief reversal of membrane charge that travels down the axon", 1],
    ["Resting membrane potential", "About -70 mV", 2], ["Dendrite", "Branch that receives signals and carries them toward the cell body", 5],
    ["Axon", "Long projection that carries impulses away from the cell body", 5], ["Neurotransmitter", "Chemical messenger released at a synapse", 3],
    ["Reflex arc", "Receptor > sensory neuron > integration center > motor neuron > effector", 1], ["Node of Ranvier", "Gap in the myelin where the impulse jumps (saltatory conduction)", 0],
    ["Sympathetic division", "Fight or flight", 4], ["Parasympathetic division", "Rest and digest", 4], ["Cerebellum", "Coordinates balance and fine movement", 0], ["Medulla oblongata", "Controls heart rate, breathing and blood pressure", 0]]),
  deck("d2", "Bones of the Skeleton", "bio", [
    ["Femur", "Thigh bone; longest bone in the body", 5], ["Patella", "Kneecap", 5], ["Scapula", "Shoulder blade", 3], ["Clavicle", "Collarbone", 4],
    ["Sternum", "Breastbone", 3], ["Tibia", "Larger, medial bone of the lower leg", 2], ["Fibula", "Thin, lateral bone of the lower leg", 1], ["Humerus", "Upper arm bone", 4],
    ["Radius", "Forearm bone on the thumb side", 1], ["Ulna", "Forearm bone on the pinky side", 1], ["Carpals", "8 wrist bones", 0], ["Vertebrae (count)", "33: 7 cervical, 12 thoracic, 5 lumbar, 5 sacral, 4 coccygeal", 0]]),
  deck("d3", "Psych Key Terms", "psy", [
    ["Classical conditioning", "Learning by pairing a neutral stimulus with one that triggers a response (Pavlov)", 3], ["Operant conditioning", "Learning from consequences: reinforcement and punishment (Skinner)", 3],
    ["Negative reinforcement", "Removing something unpleasant to increase a behaviour", 1], ["Encoding", "Getting information into memory", 4], ["Retrieval", "Getting information back out of memory", 4],
    ["Working memory", "Short-term store where information is actively held and used", 2], ["REM sleep", "Rapid eye movement stage; vivid dreams and memory consolidation", 0],
    ["Circadian rhythm", "The roughly 24-hour biological clock", 0], ["Confirmation bias", "Favouring information that supports what you already believe", 2], ["Placebo effect", "Improvement caused by expectation rather than the treatment", 2]]),
  deck("d4", "Derivative Rules", "mat", [
    ["d/dx [x^n]", "n x^(n-1)", 5], ["d/dx [sin x]", "cos x", 4], ["d/dx [cos x]", "-sin x", 3], ["d/dx [e^x]", "e^x", 5], ["d/dx [ln x]", "1/x", 3],
    ["Product rule", "(fg)' = f'g + fg'", 2], ["Quotient rule", "(f/g)' = (f'g - fg') / g^2", 1], ["Chain rule", "(f(g(x)))' = f'(g(x)) g'(x)", 2],
    ["d/dx [tan x]", "sec^2 x", 0], ["d/dx [arctan x]", "1 / (1 + x^2)", 0]]),
  deck("d5", "20th Century Dates", "his", [
    ["Start of WWI", "1914", 4], ["Treaty of Versailles", "1919", 3], ["Wall Street Crash", "1929", 2], ["Start of WWII", "1939", 4], ["End of WWII", "1945", 5],
    ["Indian independence", "1947", 1], ["Cuban Missile Crisis", "1962", 1], ["Fall of the Berlin Wall", "1989", 0], ["Dissolution of the USSR", "1991", 0]]),
  deck("d6", "French Vocab (just for fun)", "", [
    ["la bibliothèque", "the library", 2], ["un devoir", "an assignment / homework", 1], ["réussir un examen", "to pass an exam", 0], ["la rentrée", "back to school", 0]])
];



/* ---------- Files (links only, so nothing has to be uploaded) ---------- */
const F = (id, name, c, folderId, url, extra) => Object.assign({id: "s-f" + id, name, courseId: c ? "s-" + c : "", folderId, kind: "link", url, revs: [], taskIds: [], desc: "", created: ago(70)}, extra || {});
const files = [
  F(1, "BIOL 1200 Syllabus", "bio", "syllabus", "https://example.edu/biol1200/syllabus.pdf"),
  F(2, "Lab Manual", "bio", "assignments", "https://example.edu/biol1200/lab-manual.pdf"),
  F(3, "Lecture 18: Reflexes (slides)", "bio", "notes", "https://example.edu/biol1200/lec18.pdf", {created: ago(6)}),
  F(4, "PSYC 1010 Syllabus", "psy", "syllabus", "https://example.edu/psyc1010/syllabus"),
  F(5, "Presentation Rubric", "psy", "assignments", "https://example.edu/psyc1010/rubric.pdf", {taskIds: ["s-p11"]}),
  F(6, "Research Essay Guidelines", "eng", "assignments", "https://example.edu/engl1100/essay.pdf", {taskIds: ["s-e10", "s-e12"]}),
  F(7, "Purdue OWL: APA Style", "", "other", "https://owl.purdue.edu/owl/research_and_citation/apa_style/"),
  F(8, "Calculus Formula Sheet", "mat", "exams", "https://example.edu/math1500/formulas.pdf"),
  F(9, "Past Final Exam (2025)", "mat", "exams", "https://example.edu/math1500/final-2025.pdf", {taskIds: ["s-m13"]}),
  F(10, "HIST 1250 Course Outline", "his", "syllabus", "https://example.edu/hist1250/outline"),
  F(11, "Chicago Style Quick Guide", "his", "other", "https://www.chicagomanualofstyle.org/tools_citationguide.html", {taskIds: ["s-h7"]})
];

/* ---------- Settings (only ones a backup file is allowed to bring in) ---------- */
const settings = {
  capacity: 18,
  dailyHours: 4,
  streak: {cur: 6, best: 14, last: D(-1)},
  grades: {prompt: true, rescue: true}
};

const out = {app: "studyboard", v: 2, courses, tasks, files, notes, decks, events, trash: [], settings, updated: NOW};
const dir = __dirname, file = path.join(dir, "studyboard-backup-sample.json");
fs.writeFileSync(file, JSON.stringify(out, null, 2) + "\n");
const cards = decks.reduce((s, d) => s + d.cards.length, 0);
console.log(`Wrote ${path.relative(process.cwd(), file)} for ${TODAY}: ${courses.length} courses, ${tasks.length} tasks, ${events.length} events, ${notes.length} notes, ${decks.length} decks (${cards} cards), ${files.length} files`);
