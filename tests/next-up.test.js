// Unit tests for Do This Next: how the moment's nudges, stickiness, skips and the timeline pick one task
const assert = require("assert"), vm = require("vm");
const src = require("../scripts/app-files").source();
let n = 0, fail = 0;
const t = (name, fn) => { n++; try { fn(); } catch (e) { fail++; console.log("FAIL", name, "\n  ", e.message.split("\n").slice(0, 4).join("\n   ")); } };
const fnText = name => { const i = src.indexOf("function " + name + "("); assert(i > 0, name); let d = 0; for (let j = src.indexOf("{", i); j < src.length; j++) { if (src[j] === "{") d++; else if (src[j] === "}" && --d === 0) return src.slice(i, j + 1); } throw new Error("unbalanced " + name); };
const lineOf = name => { const m = new RegExp("^const " + name + " = .*$", "m").exec(src); assert(m, name); return m[0]; };
const CODE = ["NUSKIP_LS", "NU_TIER", "NU_STICK", "nuSig", "nuSubmit"].map(lineOf).concat(["nuSkips", "nuStick", "nuScore", "nuAiPick", "nextUp", "nextUpStudy", "nufbWeights", "nufbMult"].map(fnText)).join("\n");
// A fixed "now": Monday 2026-10-05, 14:00 local time
const NOW = new Date(2026, 9, 5, 14, 0).getTime();
class FakeDate extends Date { constructor(...a){ if (a.length) super(...a); else super(NOW); } static now(){ return NOW; } }
const mk = (o = {}) => {
  const ctx = Object.assign({todayISO: () => "2026-10-05", ui: {}, state: {updated: 7}, inFilter: () => true, pad: x => String(x).padStart(2, "0"), pomoCfg: () => ({focus: 25}), schOccurrences: () => [], tasksArr: () => [],
    nufbLoad: () => [], diffOf: t => t.difficulty || "med", deadlineGuard: () => {}, autoPlanOn: () => false, AUTO: {}, fmtTime: x => x, enoughToday: () => false, canDoNow: () => true, accOf: () => null,
    MILESTONE: ty => ty === "Exam" || ty === "Quiz", planSessions: () => [], dueDate: t => t.due, tr: (k, d) => d, localStorage: {getItem: () => null, setItem: () => {}}, Date: FakeDate, Number, Math, JSON, Array, Set}, o);
  vm.createContext(ctx); vm.runInContext(CODE, ctx); return ctx;
};
const X = (id, score, o) => Object.assign({t: Object.assign({id, type: "Assignment", title: id, checklist: [], history: []}, (o || {}).t), score, alloc: 1, R: 1, dl: 1, reasons: ["Due tomorrow"], behind: 0, rho: 0.3, own: 0.2}, o, {t: Object.assign({id, type: "Assignment", title: id, checklist: [], history: []}, (o || {}).t)});
const justWorked = {history: [{text: "Focus session 25m", at: NOW - 30 * 60000}]};

t("a small nudge doesn't lift a minor due-today task over a much more important one", () => {
  // Both due today (score has the +1000 tier). Before, x1.15 on 1050 (=1207) beat 1150.
  const c = mk(), r = c.nextUp({ranked: [X("minor", 1050, {dl: 0, t: justWorked}), X("major", 1150, {dl: 0})]});
  assert.strictEqual(r.x.t.id, "major");
});
t("the nudge still reorders tasks that are close", () => {
  const c = mk(), r = c.nextUp({ranked: [X("a", 1095, {dl: 0, t: justWorked}), X("b", 1100, {dl: 0})]});
  assert.strictEqual(r.x.t.id, "a");
});
t("a nudge can't move a later task into the due-today tier", () => {
  const c = mk(), r = c.nextUp({ranked: [X("later", 990, {dl: 2, t: justWorked}), X("today", 1001, {dl: 0})]});
  assert.strictEqual(r.x.t.id, "today");
});
t("the task already shown stays while it's within 15% and nothing changed", () => {
  const c = mk(); c.ui.nuLast = {id: "b", sig: "7|2026-10-05", at: NOW - 60000};
  assert.strictEqual(c.nextUp({ranked: [X("a", 100), X("b", 90)]}).x.t.id, "b");
});
t("...but gives way to a clearly better task", () => {
  const c = mk(); c.ui.nuLast = {id: "b", sig: "7|2026-10-05", at: NOW - 60000};
  assert.strictEqual(c.nextUp({ranked: [X("a", 100), X("b", 80)]}).x.t.id, "a");
});
t("...and is re-checked once your data changes", () => {
  const c = mk(); c.ui.nuLast = {id: "b", sig: "6|2026-10-05", at: NOW - 60000};
  assert.strictEqual(c.nextUp({ranked: [X("a", 100), X("b", 90)]}).x.t.id, "a");
});
t("stickiness never crosses the due-today tier", () => {
  const c = mk(); c.ui.nuLast = {id: "b", sig: "7|2026-10-05", at: NOW - 60000};
  assert.strictEqual(c.nextUp({ranked: [X("a", 1001, {dl: 0}), X("b", 990)]}).x.t.id, "a");
});
t("nextUp remembers what it showed", () => {
  const c = mk(); c.nextUp({ranked: [X("a", 100), X("b", 90)]});
  assert.strictEqual(c.ui.nuLast.id, "a"); assert.strictEqual(c.ui.nuLast.sig, "7|2026-10-05");
});
const DAY = 864e5;
t("skips on one day don't count against the whole type or course", () => {
  const c = mk(), w = c.nufbWeights([{k: "skip", id: "x", ty: "Lab", c: "bio", at: NOW - 1000}, {k: "skip", id: "y", ty: "Lab", c: "bio", at: NOW - 2000}], NOW);
  assert(!w.type.Lab && !w.course.bio, JSON.stringify(w)); assert(w.task.x > 0, "the skipped task itself still steps back");
});
t("skips on two different days do", () => {
  const c = mk(), w = c.nufbWeights([{k: "skip", id: "x", ty: "Lab", c: "bio", at: NOW - 1000}, {k: "skip", id: "y", ty: "Lab", c: "bio", at: NOW - 2 * DAY}], NOW);
  assert(w.type.Lab < 0 && w.course.bio < 0, JSON.stringify(w));
});
t("accepts always count", () => {
  const c = mk(), w = c.nufbWeights([{k: "accept", id: "x", ty: "Lab", c: "bio", at: NOW - 1000}], NOW);
  assert(w.type.Lab > 0 && w.course.bio > 0);
});
t("a task with no work left but not done is still offered, low down, as something to hand in", () => {
  const c = mk();
  assert.strictEqual(c.nextUp({ranked: [X("fin", 200, {R: 0, dl: 3}), X("hw", 120)]}).x.t.id, "hw");
  const r = c.nextUp({ranked: [X("fin", 200, {R: 0, dl: 3, alloc: 0})]});
  assert.strictEqual(r.x.t.id, "fin"); assert(r.why.some(w => /hand it in/.test(w)), JSON.stringify(r.why)); assert(r.mins <= 15); assert(/hand it in/.test(r.step.text));
});
t("...but never an exam whose study is planned elsewhere", () => {
  const c = mk(); assert.strictEqual(c.nextUp({ranked: [X("ex", 200, {R: 0, dl: 3, t: {type: "Exam"}})]}), null);
});
const classAt = m => () => [{start: `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`, title: "Biology", type: "meet", m: {kind: "Lecture"}}];
t("before a class, a big task whose session fits isn't held back", () => {
  const c = mk({schOccurrences: classAt(14 * 60 + 60)});
  const r = c.nextUp({ranked: [X("big", 100, {R: 4, alloc: 0.75, t: {difficulty: "hard"}}), X("other", 100, {R: 4, alloc: 0, t: {difficulty: "hard"}})]});
  assert.strictEqual(r.x.t.id, "big"); assert(r.why.some(w => /A session fits in the 60 minutes before Biology/.test(w)), JSON.stringify(r.why));
});
t("before a class, something you can finish in the gap still wins", () => {
  const c = mk({schOccurrences: classAt(14 * 60 + 60)});
  assert.strictEqual(c.nextUp({ranked: [X("big", 100, {R: 4, alloc: 0.75}), X("small", 90, {R: 0.75, alloc: 0.75})]}).x.t.id, "small");
});
const EX = (id, dl) => ({t: {id, type: "Exam", title: "Midterm", due: "2026-10-0" + (5 + dl), history: []}, fixed: true, dl});
t("with no timeline, studying for a close in-person exam can still be suggested", () => {
  const r = mk().nextUp({ranked: [X("hw", 40, {dl: 6})], info: {m: EX("m", 2)}});
  assert(r.study && r.x.t.id === "m");
});
t("when the timeline has a slot planned, Do This Next follows it rather than switching to exam study", () => {
  const r = mk().nextUp({ranked: [X("hw", 40, {dl: 6})], info: {m: EX("m", 2)}, slotsBy: {hw: [{s: 14 * 60, e: 15 * 60}]}});
  assert(!r.study && r.x.t.id === "hw");
});
t("the timeline's current slot decides", () => {
  const r = mk().nextUp({ranked: [X("a", 100), X("b", 60)], slotsBy: {a: [{s: 16 * 60, e: 17 * 60}], b: [{s: 13 * 60 + 30, e: 14 * 60 + 30}]}});
  assert.strictEqual(r.x.t.id, "b");
});
t("Something Else survives a reload for the rest of the day", () => {
  const store = {"studyboard:nextSkip": JSON.stringify({day: "2026-10-05", ids: ["a"]})};
  const c = mk({localStorage: {getItem: k => store[k] || null, setItem: (k, v) => { store[k] = v; }}});
  assert.strictEqual(c.nextUp({ranked: [X("a", 100), X("b", 60)]}).x.t.id, "b");
});
t("...but not into the next day", () => {
  const store = {"studyboard:nextSkip": JSON.stringify({day: "2026-10-04", ids: ["a"]})};
  const c = mk({localStorage: {getItem: k => store[k] || null, setItem: () => {}}});
  assert.strictEqual(c.nextUp({ranked: [X("a", 100), X("b", 60)]}).x.t.id, "a");
});
t("nuLead (what the timeline puts first) matches nextUp's choice", () => {
  const c = mk(); vm.runInContext(fnText("nuLead"), c);
  const F = {ranked: [X("minor", 1050, {dl: 0, t: justWorked}), X("major", 1150, {dl: 0}), X("near", 300, {t: justWorked}), X("x", 310)]};
  assert.strictEqual(c.nuLead(F), c.nextUp(F).x.t.id);
});

/* -- Wiring */
const has = (re, m) => t(m, () => assert(re.test(src), "missing: " + re));
has(/availPlan\(av, ranked, th0, needToday, day, today, now, nuLead\(\{ranked, info\}\)\)/, "computeFocus lays the timeline out with Do This Next's pick first");
has(/if \(ui\.nextShown === id\) \{ nufbAdd\("accept", t\)/, "ticking the suggested task done counts as accepting it");
has(/"nu-skip": el => \{ nuSkips\(\)\.ids\.push\(el\.dataset\.id\); nuSkipSave\(\);/, "Something Else is saved");
has(/"nu-back": \(\) => \{ const id = nuSkips\(\)\.ids\.pop\(\); nuSkipSave\(\); ui\.nuLast = null;/, "Go Back is saved and isn't held back by stickiness");

console.log(`next-up.test.js: ${n - fail} of ${n} checks passed`);
if (fail) process.exitCode = 1;
