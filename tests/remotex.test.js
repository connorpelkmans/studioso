// Unit tests for "can this exam or quiz be taken from home?" (the REMOTEX block in index.html) and where the answer is used.
// Run: node tests/remotex.test.js
const fs = require("fs"), path = require("path"), assert = require("assert"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const block = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b); assert(i > 0 && j > i, "block " + a); return src.slice(i, j); };
const R = new Function(block("/*REMOTEX-START*/", "/*REMOTEX-END*/") + ";return REMOTEX;")();
let n = 0, fail = 0;
const t = (name, fn) => { n++; try { fn(); } catch (e) { fail++; console.log("FAIL", name, "\n  ", e.message.split("\n").slice(0, 4).join("\n   ")); } };
const V = f => R.verdict(Object.assign({type: "Exam", title: "Midterm", text: ""}, f));
const is = (f, v, minC) => { const r = V(f); assert.strictEqual(r.verdict, v, JSON.stringify(f) + " -> " + JSON.stringify(r)); if (minC) assert(r.confidence >= minC, "confidence " + r.confidence); return r; };

/* ---- Canvas submission types ---- */
t("canvas online_quiz -> yes (lms)", () => { const r = is({type: "Quiz", title: "Quiz 3", rx: {st: ["online_quiz"]}}, "yes", 0.8); assert.strictEqual(r.src, "lms"); });
t("canvas online_upload / text entry / external tool -> yes", () => ["online_upload", "online_text_entry", "external_tool", "online_url"].forEach(s => is({rx: {st: [s]}}, "yes", 0.8)));
t("canvas on_paper -> no", () => is({rx: {st: ["on_paper"]}}, "no", 0.8));
t("canvas none + exam wording -> no (lower confidence)", () => { const r = is({title: "Midterm Exam", rx: {st: ["none"]}}, "no", 0.7); assert.strictEqual(r.src, "lms"); });
t("canvas none without any exam wording stays unknown", () => is({type: "Quiz", title: "Check-in", rx: {st: ["none"]}}, "unknown"));
t("canvas quiz object: k=quiz, time limit -> yes", () => is({type: "Quiz", title: "Quiz 1", rx: {k: "quiz", tl: 45}}, "yes", 0.8));
t("canvas quiz with an IP filter (campus network) is mixed, not yes", () => { const r = V({type: "Quiz", rx: {k: "quiz", st: ["online_quiz"], ip: 1}}); assert.strictEqual(r.verdict, "unknown"); assert(r.conflict); });
t("window of more than 12 hours -> yes", () => is({type: "Quiz", title: "Quiz 4", rx: {ul: "2026-10-05T08:00:00Z", ll: "2026-10-07T08:00:00Z"}}, "yes", 0.8));
t("window of 2 hours is not evidence", () => is({type: "Quiz", title: "Quiz 4", rx: {ul: "2026-10-05T08:00:00Z", ll: "2026-10-05T10:00:00Z"}}, "unknown"));
t("an exam with a multi-day window is take-home", () => is({type: "Exam", rx: {ul: "2026-12-01T08:00:00Z", ll: "2026-12-04T08:00:00Z"}}, "yes", 0.8));

/* ---- Respondus and friends: taken on a computer, so from home, unless the text says otherwise ---- */
t("Respondus lockdown browser (school site flag) -> yes", () => is({type: "Exam", rx: {ld: 1}}, "yes", 0.8));
t("Respondus in the text -> yes", () => is({text: "You must use Respondus LockDown Browser and a webcam."}, "yes", 0.8));
t("Proctorio / ProctorU / Honorlock -> yes", () => ["Proctorio extension required", "Book a ProctorU session", "Honorlock will record you"].forEach(x => is({text: x}, "yes", 0.8)));
t("Respondus but 'in the testing center' -> no", () => is({text: "Respondus LockDown Browser is required. Take it in the testing center.", rx: {st: ["online_quiz"]}}, "no", 0.8));
t("Respondus but 'on campus' -> no", () => is({text: "Uses Respondus. Must be completed on campus."}, "no", 0.8));
t("Respondus and 'in person' mixed with online -> not yes", () => assert.notStrictEqual(V({text: "Respondus required. In person at the testing center.", rx: {ld: 1}}).verdict, "yes"));

/* ---- In-person words ---- */
["Held in class on Tuesday", "This exam is in-class.", "Taken in person", "Meet on campus at 9am", "Testing center, bring ID", "Lecture hall A", "Bring a pencil and calculator", "Scantron answer sheet provided",
 "Paper exam", "Proctored in the gym", "Lab practical in the anatomy lab", "OSCE stations", "Clinical skills check-off", "ATI proctored on campus", "Face to face final"].forEach(x =>
  t("in-person text: " + x, () => is({text: x}, "no", 0.7)));
t("room number alone is a weaker no", () => is({text: "Midterm in Room 204", title: "Midterm"}, "no", 0.7));
t("written exam is a weaker no", () => is({text: "Written exam, ch 1-5"}, "no", 0.7));
t("'not in person' counts as online", () => is({text: "This exam is not in person; it is on Canvas."}, "yes", 0.8));
t("'no in-class component' counts as online", () => is({text: "There is no in-class component, take it at home."}, "yes", 0.8));

/* ---- Take-home words ---- */
["Take-home exam", "take home final", "Open book online", "Online quiz in Canvas", "Submit online through Canvas", "Quiz in Canvas, do it from home", "Complete it remotely", "Available from Monday until Wednesday night", "Taken on your own computer"].forEach(x =>
  t("take-home text: " + x, () => is({text: x}, "yes", 0.8)));
t("'online' alone is not enough", () => is({text: "Review the online resources before the exam."}, "unknown"));
t("'due by 11:59 pm' alone is not enough", () => is({text: "Due by 11:59 pm."}, "unknown"));
t("in-class beats an online word", () => is({text: "Online practice quiz available. The midterm itself is in class.", title: "Midterm"}, "no", 0.8));
t("in-person and take-home both strongly stated -> unknown", () => { const r = V({text: "The midterm is in class. A take-home makeup exam is available online."}); assert.strictEqual(r.verdict, "unknown"); assert(r.conflict); });

/* ---- Locations (calendar feed items) ---- */
t("a place -> no", () => is({location: "Loew Hall 101"}, "no", 0.8));
t("a different place -> no", () => is({location: "Science Building, Room 2"}, "no", 0.8));
t("a Zoom link -> yes", () => is({location: "https://zoom.us/j/123"}, "yes", 0.7));
t("'Online' location -> yes", () => is({location: "Online"}, "yes", 0.7));
t("TBA location is no evidence", () => is({location: "TBA"}, "unknown"));
t("location in person but school site says online quiz -> mixed", () => assert.strictEqual(V({location: "Rm 12", rx: {st: ["online_quiz"]}}).verdict, "unknown"));

/* ---- Your schedule ---- */
t("an event with a room at the exam time -> no", () => is({sched: {room: "Hall 3"}}, "no", 0.7));
t("inside a class meeting -> no for an exam", () => is({sched: {inClass: true}}, "no", 0.7));
t("inside a class meeting is only a weak no for a quiz (not applied alone)", () => is({type: "Quiz", title: "Quiz 2", sched: {inClass: true}}, "unknown"));
t("online quiz in the school site beats 'falls inside a class meeting'", () => is({type: "Quiz", title: "Quiz 2", rx: {st: ["online_quiz"]}, sched: {inClass: true}}, "yes", 0.7));

/* ---- Other platforms ---- */
t("Brightspace quiz -> yes", () => is({type: "Quiz", rx: {k: "quiz"}}, "yes", 0.8));
t("Brightspace dropbox: file / text -> yes, on paper / observed in person -> no", () => { is({rx: {k: "dropbox", sb: 0}}, "yes", 0.8); is({rx: {k: "dropbox", sb: 1}}, "yes", 0.8); is({rx: {k: "dropbox", sb: 2}}, "no", 0.8); is({rx: {k: "dropbox", sb: 3}}, "no", 0.8); });
t("Blackboard: online attempt -> yes; instructor-entered exam -> no", () => { is({rx: {gt: "Attempts"}}, "yes", 0.7); is({title: "Midterm Exam", rx: {gt: "Manual"}}, "no", 0.7); });

/* ---- Unknown is not eligible; user override wins ---- */
t("nothing known -> unknown and not eligible", () => { const r = V({text: "Chapters 1 to 8"}); assert.strictEqual(r.verdict, "unknown"); const e = R.remoteEff({type: "Exam"}, r, "s"); assert.strictEqual(e.v, ""); assert.strictEqual(R.canDoNow({type: "Exam"}, e), false); });
t("low-confidence rule is not applied", () => { const r = V({text: "Due by 11:59 pm"}); const e = R.remoteEff({type: "Exam"}, r, "s"); assert.strictEqual(e.v, ""); });
t("non exam/quiz types are always eligible", () => ["Assignment", "Project", "Lab", "Reading", "Study", "Other"].forEach(ty => { assert.strictEqual(R.canDoNow({type: ty}, {v: ""}), true); assert.strictEqual(R.remoteEff({type: ty}, V({type: ty}), "").v, "yes"); }));
t("only 'yes' lets an exam or quiz through", () => { ["Exam", "Quiz"].forEach(ty => { assert.strictEqual(R.canDoNow({type: ty}, {v: "yes"}), true); assert.strictEqual(R.canDoNow({type: ty}, {v: "no"}), false); assert.strictEqual(R.canDoNow({type: ty}, {v: ""}), false); assert.strictEqual(R.canDoNow({type: ty}, null), false); }); });
t("user answer beats a confident rule", () => { const rule = V({text: "Held in class"}); assert.strictEqual(rule.verdict, "no"); const e = R.remoteEff({type: "Exam", remote: "yes", remoteSrc: "user"}, rule, "s"); assert.strictEqual(e.v, "yes"); assert.strictEqual(e.src, "user"); });
t("user 'no' beats an online quiz", () => { const rule = V({type: "Quiz", rx: {st: ["online_quiz"]}}); const e = R.remoteEff({type: "Quiz", remote: "no", remoteSrc: "user"}, rule, "s"); assert.strictEqual(e.v, "no"); });
t("rules beat a stored AI answer; a stored AI answer for other text is ignored", () => {
  const rule = V({text: "Take-home exam"}); assert.strictEqual(R.remoteEff({type: "Exam", remote: "no", remoteSrc: "ai", remoteSig: "a"}, rule, "a").v, "yes");
  const none = V({text: "Chapters 1 to 8"});
  assert.strictEqual(R.remoteEff({type: "Exam", remote: "yes", remoteSrc: "ai", remoteSig: "a"}, none, "a").v, "yes");
  assert.strictEqual(R.remoteEff({type: "Exam", remote: "yes", remoteSrc: "ai", remoteSig: "a"}, none, "b").v, "", "the text changed since the AI read it");
});
t("a stored rule/lms answer is not trusted without the rules (they are recomputed live)", () => assert.strictEqual(R.remoteEff({type: "Exam", remote: "yes", remoteSrc: "rule"}, V({text: "Chapters"}), "s").v, ""));

/* ---- The AI answer is checked ---- */
const TEXT = "Title: Practical\nType: Exam\nDescription: Students will sit the exam in a supervised session using the school's laptops. Bring your student ID.";
const OK = {takeHome: "no", confidence: 0.85, evidence: "supervised session using the school's laptops"};
t("AI: a good 'no' with a real quote is accepted", () => { const v = R.vetAi(OK, {text: TEXT}); assert(v.ok && v.apply && v.verdict === "no", JSON.stringify(v)); assert(v.why.length <= 120); });
t("AI: JSON as a string is parsed", () => assert(R.vetAi(JSON.stringify(OK), {text: TEXT}).apply));
t("AI: not JSON -> rejected", () => { ["nope", "", null, 42, [], "{bad"].forEach(x => assert.strictEqual(R.vetAi(x, {text: TEXT}).ok, false)); });
t("AI: bad takeHome value -> rejected", () => assert.strictEqual(R.vetAi({takeHome: "maybe", confidence: 0.9, evidence: "x"}, {text: TEXT}).ok, false));
t("AI: unknown is fine but never applied", () => { const v = R.vetAi({takeHome: "unknown", confidence: 0.2, evidence: ""}, {text: TEXT}); assert(v.ok && !v.apply); });
t("AI: confidence below 0.7 is not applied", () => { const v = R.vetAi(Object.assign({}, OK, {confidence: 0.69}), {text: TEXT}); assert(!v.apply && v.reason === "low-confidence"); });
t("AI: confidence out of range -> rejected", () => assert.strictEqual(R.vetAi(Object.assign({}, OK, {confidence: 1.4}), {text: TEXT}).ok, false));
t("AI: no evidence -> rejected", () => { ["", "  ", "ok"].forEach(e => assert.strictEqual(R.vetAi(Object.assign({}, OK, {evidence: e}), {text: TEXT}).reason, "no-evidence")); });
t("AI: hallucinated quote -> rejected", () => assert.strictEqual(R.vetAi({takeHome: "no", confidence: 0.9, evidence: "\"The exam is held in Room 204 at 9am\""}, {text: TEXT}).reason, "evidence-not-in-text"));
t("AI: hallucinated paraphrase -> rejected", () => assert.strictEqual(R.vetAi({takeHome: "no", confidence: 0.9, evidence: "held in the gymnasium with an invigilator"}, {text: TEXT}).reason, "evidence-not-in-text"));
t("AI: a close paraphrase from the text is accepted", () => assert(R.vetAi({takeHome: "no", confidence: 0.8, evidence: "exam in a supervised session with the school laptops"}, {text: TEXT}).apply));
t("AI: a quote in quotation marks must be exact", () => { assert(R.vetAi(Object.assign({}, OK, {evidence: "\"supervised session using the school's laptops\""}), {text: TEXT}).apply); assert.strictEqual(R.vetAi(Object.assign({}, OK, {evidence: "\"supervised session with the school laptops\""}), {text: TEXT}).ok, false); });
t("AI: 'yes' with in-person cues in the text -> rejected", () => { const tx = "Description: Take the quiz online. Bring a pencil to the lecture hall."; assert.strictEqual(R.vetAi({takeHome: "yes", confidence: 0.95, evidence: "Take the quiz online"}, {text: tx}).reason, "in-person-cues"); });
t("AI: 'yes' with the in-person cue only in the evidence -> rejected", () => assert.strictEqual(R.vetAi({takeHome: "yes", confidence: 0.95, evidence: "supervised session, in person"}, {text: "Description: supervised session, in person"}).reason, "in-person-cues"));
t("AI: 'yes' with clean text is accepted", () => { const tx = "Description: Complete the questions during the weekend using any resources you like."; const v = R.vetAi({takeHome: "yes", confidence: 0.9, evidence: "Complete the questions during the weekend using any resources"}, {text: tx}); assert(v.apply, JSON.stringify(v)); });
t("AI: 'no' with strong online cues and no in-person evidence -> rejected", () => assert.strictEqual(R.vetAi({takeHome: "no", confidence: 0.9, evidence: "submit it on a Friday"}, {text: "Description: Take-home exam. Submit online through Canvas by Friday. You can submit it on a Friday."}).reason, "online-cues-without-evidence"));
t("AI: 'no' with strong online cues but in-person evidence in the text is allowed through to the other checks", () => { const v = R.vetAi({takeHome: "no", confidence: 0.9, evidence: "must be written in class"}, {text: "Description: Submit online through Canvas for part A. Part B must be written in class."}); assert(v.apply, JSON.stringify(v)); });
t("AI: evidence that isn't about the place is rejected for 'no'", () => assert.strictEqual(R.vetAi({takeHome: "no", confidence: 0.9, evidence: "covers chapters 1 to 5 only"}, {text: "Description: This test covers chapters 1 to 5 only and is worth 20 percent."}).reason, "evidence-not-about-place"));
t("AI: text for the model is sanitized, capped and has no links", () => {
  const x = R.aiText({title: "Quiz <b>1</b>", type: "Quiz", text: "See https://evil.example/x now. " + "word ".repeat(1000), location: "Rm 5", rx: {st: ["online_quiz"], tl: 30}});
  assert(!/https?:/.test(x) && !/<b>/.test(x) && x.length < 2400 && /Submission types: online_quiz/.test(x) && /Time limit: 30 minutes/.test(x), x.slice(0, 200));
});
t("AI: no real description -> hasText false (ask the student, don't call AI)", () => { assert.strictEqual(R.hasText({text: ""}), false); assert.strictEqual(R.hasText({text: "<p> </p>"}), false); assert.strictEqual(R.hasText({text: "Chapters 1 to 8 are covered."}), true); });
t("AI: signature changes with the text, type and school-site facts, not with whitespace noise", () => {
  const a = R.sigOf({title: "T", type: "Exam", text: "a b"}), b = R.sigOf({title: "T", type: "Exam", text: "a  b"});
  assert.strictEqual(a, b); assert.notStrictEqual(a, R.sigOf({title: "T", type: "Exam", text: "a c"})); assert.notStrictEqual(a, R.sigOf({title: "T", type: "Quiz", text: "a b"})); assert.notStrictEqual(a, R.sigOf({title: "T", type: "Exam", text: "a b", rx: {st: ["none"]}}));
});
t("cleanRx: small, plain and capped", () => {
  const o = R.cleanRx({st: ["Online_Quiz", "x".repeat(80), "<script>"], k: "quiz", tl: 30, oq: true, ld: 1, ul: "2026-10-05T08:00:00Z", ll: "garbage", sb: 3, gt: "attempts", evil: "x", qt: "assignment"});
  assert.deepStrictEqual(Object.keys(o).sort(), ["gt", "k", "ld", "oq", "qt", "sb", "st", "tl", "ul"]); assert(o.st.every(s => s.length <= 24 && /^[a-z0-9_ -]+$/.test(s))); assert.strictEqual(o.gt, "Attempts");
  assert.strictEqual(R.cleanRx(null), undefined); assert.strictEqual(R.cleanRx({evil: 1}), undefined); assert.strictEqual(R.cleanRx({tl: 99999}), undefined);
  assert(R.cleanRx({st: Array(50).fill("none")}).st.length <= 8);
});

/* ---- The gate in the code that makes suggestions: seeded states ---- */
const fnText = name => { const i = src.indexOf("function " + name + "("); assert(i > 0, name); let d = 0, k = src.indexOf("{", i); for (let j = k; j < src.length; j++) { if (src[j] === "{") d++; else if (src[j] === "}" && --d === 0) return src.slice(i, j + 1); } throw new Error("unbalanced " + name); };
const cleanNext = new Function(fnText("autoCleanNext") + ";return autoCleanNext;")();
t("autoCleanNext drops anything the 'ok' gate refuses (ineligible exams), keeps eligible ones, no repeats", () => {
  const back = {t1: "exam1", t2: "quiz1", t3: "hw", t4: "exam2"}, eff = {exam1: "no", quiz1: "yes", exam2: ""}, ty = {exam1: "Exam", quiz1: "Quiz", hw: "Assignment", exam2: "Exam"};
  const ok = id => R.canDoNow({type: ty[id]}, {v: eff[id] || ""});
  const out = cleanNext([{ref: "t1", why: "x"}, {ref: "t2", why: "y"}, {ref: "t4", why: "z"}, {ref: "t3", why: "w"}, {ref: "t3", why: "again"}, {ref: "t9", why: "invented"}], back, ok);
  assert.deepStrictEqual(out.map(x => x.id), ["quiz1", "hw"]);
});
// nextUp itself, with its helpers stubbed: an in-person midterm due tomorrow has the highest score and must never be picked
const mkNext = eff => {
  const ctx = {
    todayISO: () => "2026-10-05", ui: {}, inFilter: () => true, pad: x => String(x).padStart(2, "0"), pomoCfg: () => ({focus: 25}), schOccurrences: () => [], tasksArr: () => [],
    nufbLoad: () => ({}), nufbWeights: () => ({}), nufbMult: () => 1, diffOf: () => "med", deadlineGuard: () => {}, autoPlanOn: () => false, AUTO: {}, fmtTime: x => x,
    canDoNow: t => R.canDoNow(t, {v: eff[t.id] || ""}), Date, Number, Math
  };
  vm.createContext(ctx); vm.runInContext(fnText("nextUp"), ctx); return F => ctx.nextUp(F);
};
const X = (id, type, score, o) => Object.assign({t: {id, type, title: id, checklist: [], history: []}, score, alloc: 1, R: 1, dl: 1, reasons: [`Due tomorrow`], behind: 0, rho: 0.3, own: 0.2}, o || {});
t("nextUp: an in-person midterm with the top score is never Do This Next", () => {
  const nu = mkNext({m: "no", q: "yes"}), F = {ranked: [X("m", "Exam", 99), X("hw", "Assignment", 40)]};
  assert.strictEqual(nu(F).x.t.id, "hw");
});
t("nextUp: a take-home quiz due tomorrow can be Do This Next", () => {
  const nu = mkNext({q: "yes"}), F = {ranked: [X("q", "Quiz", 90), X("hw", "Assignment", 40)]};
  assert.strictEqual(nu(F).x.t.id, "q");
});
t("nextUp: unknown is treated as in person", () => {
  const nu = mkNext({}), F = {ranked: [X("m", "Exam", 99), X("q", "Quiz", 95), X("hw", "Assignment", 40)]};
  const r = nu(F); assert.strictEqual(r.x.t.id, "hw"); assert.strictEqual(r.left, 0, "no alternatives either");
});
t("nextUp: only ineligible exams -> nothing to suggest", () => { assert.strictEqual(mkNext({m: "no"})({ranked: [X("m", "Exam", 99), X("m2", "Quiz", 50)]}), null); });
t("nextUp: a Study prep task for the exam is still suggested", () => {
  const nu = mkNext({m: "no"}), F = {ranked: [X("m", "Exam", 99), X("prep", "Study", 60, {t: {id: "prep", type: "Study", prepFor: "m", title: "Study", checklist: [], history: []}})]};
  const r = nu(F); assert.strictEqual(r.x.t.id, "prep"); assert(r.why.some(w => /exam study plan/.test(w)));
});
t("nextUp: the alternatives (left) never count an ineligible exam", () => {
  const nu = mkNext({q: "yes"}), F = {ranked: [X("q", "Quiz", 90), X("m", "Exam", 80), X("hw", "Assignment", 40)]};
  assert.strictEqual(nu(F).left, 1);
});
t("nextUp: the AI's stored pick can't bring back an exam that has become ineligible", () => {
  const ctx = {todayISO: () => "2026-10-05", ui: {}, inFilter: () => true, pad: x => String(x).padStart(2, "0"), pomoCfg: () => ({focus: 25}), schOccurrences: () => [], tasksArr: () => [], nufbLoad: () => ({}), nufbWeights: () => ({}), nufbMult: () => 1, diffOf: () => "med", deadlineGuard: () => {},
    autoPlanOn: () => true, AUTO: {next: {day: "2026-10-05", at: Date.now(), list: [{id: "m", why: "x"}]}}, fmtTime: x => x, canDoNow: t => R.canDoNow(t, {v: ""}), Date, Number, Math};
  vm.createContext(ctx); vm.runInContext(fnText("nextUp"), ctx);
  const r = ctx.nextUp({ranked: [X("m", "Exam", 99), X("hw", "Assignment", 40)]}); assert.strictEqual(r.x.t.id, "hw"); assert.strictEqual(r.ai, false);
});

/* ---- Wiring: every place that suggests work goes through canDoNow ---- */
const has = (re, m) => t(m, () => assert(re.test(src), "missing: " + re));
has(/const pool = F\.ranked\.filter\(x => inFilter\(x\.t\) && canDoNow\(x\.t\)/, "nextUp pool uses canDoNow");
has(/t\.status !== "done" && canDoNow\(t\) && !blockers\(t\)\.length; \}, \(id, why, step\)/, "autoPlan's autoCleanNext validation uses canDoNow");
has(/FIXED EVENT \(taken in person or not confirmed as take-home: never choose it for next\)/, "autoPlan tells the model which exams are fixed events");
has(/const R = fx \? 0 : remainingOf\(t\)/, "computeFocus gives ineligible exams no study time");
has(/showScore \|\| !canDoNow\(t\) \? "" : `<button class="focus-go"/, "Today's Plan rows hide the focus button for ineligible exams");
has(/const workable = ranked\.filter\(x => !x\.fixed\)/, "Today's Plan lists only workable items");
has(/\(canDoNow\(t\) \|\| t\.id === pomo\.taskId\)/, "focus timer picker hides ineligible exams");
has(/case "pomo-task": \{ const tk = state\.tasks\[el\.dataset\.id\]; if \(tk && !canDoNow\(tk\)\)/, "starting a focus on an ineligible exam is refused everywhere");
has(/const canStart = dl >= 0 && canDoNow\(t\);/, "Crunch 'Start now' uses canDoNow");
has(/x\.alloc > 0 && x\.t\.status !== "done" && canDoNow\(x\.t\)/, "companion's top-of-plan idea uses canDoNow");
has(/state\.tasks\[i\.taskId\]\.status !== "done" && canDoNow\(state\.tasks\[i\.taskId\]\)/, "companion's focus ideas are checked with canDoNow");
t("the AI plan schema/prompt never lets the model pick fixed events", () => assert(/FIXED EVENT happens in person|a line saying FIXED EVENT happens in person at a set time, so never choose it/.test(src)));

/* ---- Task data: normalising, merging, exporting ---- */
const norm = (() => {
  const body = fnText("normTask"), ctx = {DIFF_M: {easy: 1, med: 1, hard: 1}, LATE_M: {unknown: 1}, STATUS_LABEL: {todo: 1, doing: 1, done: 1}, PRIO: {low: 1, med: 1, high: 1, urgent: 1}, isDate: x => /^\d{4}-\d{2}-\d{2}$/.test(x || ""), scrubFields: o => o, Object, Array, Number, Math, String};
  vm.createContext(ctx); vm.runInContext(body, ctx); return x => ctx.normTask(x);
})();
t("normTask keeps a valid answer and tidies the rest", () => {
  const a = norm({type: "Exam", remote: "yes", remoteSrc: "ai", remoteWhy: " <b>x</b> " + "y".repeat(300), remoteAt: "5", remoteSig: "abc"});
  assert(a.remote === "yes" && a.remoteSrc === "ai" && a.remoteWhy.length <= 120 && !/</.test(a.remoteWhy) && a.remoteAt === 5);
  assert.strictEqual(norm({remote: "yes", remoteSrc: "weird"}).remoteSrc, "rule");
});
t("normTask drops unknown / invalid values and adds nothing to normal tasks", () => {
  const a = norm({type: "Assignment"}); assert(!("remote" in a) && !("remoteSrc" in a));
  const b = norm({type: "Exam", remote: "maybe", remoteSrc: "user", remoteWhy: "x"}); assert(!("remote" in b) && !("remoteSrc" in b) && !("remoteWhy" in b));
});
const SM = vm.runInNewContext(block("/* SYNC-MERGE-START", "/* SYNC-MERGE-END */") + "\nSyncMerge;", {Date, JSON, Math, Map, Set, Uint16Array, Object, Array, String, Number, Promise});
const base = {id: "x", title: "Midterm", type: "Exam", due: "2026-10-06", status: "todo", notes: "n", history: []};
t("sync: the student's own answer wins over a rule or AI answer made on the other device", () => {
  const mine = Object.assign({}, base, {remote: "yes", remoteSrc: "user", remoteWhy: "You set this", remoteAt: 100}), theirs = Object.assign({}, base, {remote: "no", remoteSrc: "rule", remoteWhy: "in class", remoteAt: 900, due: "2026-10-07"});
  const r = SM.mergeItem("task", base, mine, theirs, {mineAt: 50, theirsAt: 5000}); assert.strictEqual(r.merged.remote, "yes"); assert.strictEqual(r.merged.remoteSrc, "user"); assert.strictEqual(r.merged.due, "2026-10-07");
  const r2 = SM.mergeItem("task", base, theirs, mine, {mineAt: 5000, theirsAt: 50}); assert.strictEqual(r2.merged.remote, "yes");
});
t("sync: two user answers: the later one wins; one-sided changes pass through", () => {
  const a = Object.assign({}, base, {remote: "yes", remoteSrc: "user", remoteAt: 100, title: "A"}), b = Object.assign({}, base, {remote: "no", remoteSrc: "user", remoteAt: 200, title: "B"});
  assert.strictEqual(SM.mergeItem("task", base, a, b, {mineAt: 1, theirsAt: 2}).merged.remote, "no");
  assert.strictEqual(SM.mergeItem("task", base, a, base, {}).merged.remote, "yes");
});
const TB = new Function(block("/*TRASH-START*/", "/*TRASH-END*/") + ";return TB;")();
t("export: tasks.csv has a take_home column (yes / no / blank)", () => {
  const f = TB.toCsvFiles({courses: [], tasks: [{id: "1", title: "Mid", type: "Exam", remote: "no"}, {id: "2", title: "Qz", type: "Quiz", remote: "yes"}, {id: "3", title: "HW", type: "Assignment"}, {id: "4", title: "Old", type: "Exam"}, {id: "5", title: "Odd", type: "Assignment", remote: "yes"}], notes: [], decks: [], events: [], files: []}, {tasks: true})["tasks.csv"];
  const rows = f.replace(/^﻿/, "").trim().split("\r\n"), head = rows[0].split(",");
  assert.strictEqual(head[head.length - 1], "take_home"); assert(rows[1].endsWith(",no") && rows[2].endsWith(",yes") && rows[3].endsWith(",") && rows[4].endsWith(",") && rows[5].endsWith(","), rows.join("\n"));
});

console.log(`remotex.test.js: ${n - fail} of ${n} checks passed`);
process.exit(fail ? 1 : 0);
