// Unit tests for the Exam Prep planner engine (pure code between EXAMPREP-START and EXAMPREP-END in index.html).
// Run: node tests/examprep.test.js          (re-runs itself under several time zones; EP_TZ=<zone> runs just one)
const fs = require("fs"), path = require("path"), assert = require("assert"), cp = require("child_process");
const ZONES = ["UTC", "America/New_York", "America/Los_Angeles", "Europe/London", "Australia/Sydney", "Pacific/Auckland"];
if (!process.env.EP_TZ) {
  let total = 0;
  ZONES.forEach(z => {
    const r = cp.spawnSync(process.execPath, [__filename], {env: Object.assign({}, process.env, {EP_TZ: z, TZ: z}), encoding: "utf8"});
    process.stdout.write(r.stdout.trimEnd().replace(/^/gm, `[${z}] `) + "\n"); if (r.stderr) process.stderr.write(r.stderr);
    if (r.status !== 0) { console.error("FAILED in " + z); process.exit(1); }
    total += Number((r.stdout.match(/(\d+) checks/) || [0, 0])[1]);
  });
  console.log(`examprep: all ${ZONES.length} time zones passed (${total} checks in all)`); process.exit(0);
}
const s = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const code = s.slice(s.indexOf("/*EXAMPREP-START*/"), s.indexOf("/*EXAMPREP-END*/"));
const E = new Function(code + ";return EXAMPREP;")();
let n = 0; const ok = (c, m) => { n++; assert(c, m); };
const eq = (a, b, m) => { n++; assert.deepStrictEqual(a, b, m); };
const T0 = "2026-10-04";
const topics = () => [
  {id: "a", name: "Cardiac drugs", conf: "weak", links: [{k: "deck", id: "d1", title: "Cardiac Drugs", total: 50, due: 40}, {k: "quiz", id: "q1", deckId: "d1", title: "Cardiac quiz"}]},
  {id: "b", name: "Renal physiology", conf: "ok", links: [{k: "note", id: "n1", title: "Renal notes"}]},
  {id: "c", name: "Acid base balance", conf: "strong", links: []},
  {id: "d", name: "Respiratory system", conf: "ok", links: []}];
const mk = (days, o) => E.plan(Object.assign({today: T0, due: E.add(T0, days), topics: topics(), intensity: 90}, o || {}));
const byTopic = (r, id) => r.sessions.filter(x => x.topicIds.includes(id));
const dates = r => [...new Set(r.sessions.map(x => x.date))].sort();
const minsOn = (r, d) => r.sessions.filter(x => x.date === d).reduce((a, x) => a + x.min, 0);

// ---- spreading: exam in 2 / 7 / 14 / 30 days
[2, 7, 14, 30].forEach(d => {
  const r = mk(d), due = E.add(T0, d);
  ok(!r.err && r.sessions.length >= 4, `sessions for ${d} days: ${r.sessions.length}`);
  r.sessions.forEach(x => { ok(x.date >= T0, "never in the past"); ok(x.date < due, "never on or after the exam day"); ok(x.min >= 10, "min length"); });
  ok(dates(r).length >= Math.min(d, 2), "spread over days");
  ok(r.sessions.every(x => x.text && x.text.length > 10), "every session has an instruction");
});
ok(dates(mk(30))[0] >= E.add(T0, 9), "a 30-day exam is not planned further out than 21 days: " + dates(mk(30))[0]);
ok(dates(mk(30, {start: T0}))[0] === T0, "unless a start date is asked for");
ok(dates(mk(14))[0] === T0 && dates(mk(14)).length >= 6, "14 days starts today");

// ---- per-day cap, interleaving, once a topic a day
{
  const many = []; for (let i = 0; i < 10; i++) many.push({id: "t" + i, name: "Topic number " + i, conf: i % 3 ? "ok" : "weak", links: []});
  const r = mk(14, {topics: many});
  dates(r).forEach(d => { const ss = r.sessions.filter(x => x.date === d && x.topicIds.length === 1); ok(new Set(ss.map(x => x.topicIds[0])).size === ss.length, "a topic once a day " + d); ok(ss.length <= 3, "at most 3 topics a day " + d + " " + ss.length); });
  const r2 = mk(14, {topics: many, intensity: 45});
  dates(r2).forEach(d => ok(r2.sessions.filter(x => x.date === d && x.topicIds.length === 1).length <= 2, "light days hold at most 2 topics"));
  dates(r).forEach(d => ok(minsOn(r, d) <= 90, "never over the day's minutes " + d + " " + minsOn(r, d)));
}

// ---- weak topics get more time and come back more often
{
  const r = mk(21, {topics: [{id: "w", name: "Shaky stuff", conf: "weak", links: []}, {id: "o", name: "Okay stuff", conf: "ok", links: []}, {id: "s", name: "Strong stuff", conf: "strong", links: []}]});
  const m = id => byTopic(r, id).reduce((a, x) => a + x.min, 0), c = id => byTopic(r, id).length;
  ok(m("w") > m("o") && m("o") > m("s"), `minutes weak ${m("w")} ok ${m("o")} strong ${m("s")}`);
  ok(c("w") > c("o") && c("o") >= c("s"), `touches weak ${c("w")} ok ${c("o")} strong ${c("s")}`);
  const hw = mk(21, {topics: [{id: "x", name: "Light topic", conf: "ok", weight: 10, links: []}, {id: "y", name: "Heavy topic", conf: "ok", weight: 60, links: []}]});
  ok(byTopic(hw, "y").reduce((a, x) => a + x.min, 0) > byTopic(hw, "x").reduce((a, x) => a + x.min, 0), "weight raises a topic's share");
}

// ---- expanding review gaps: learn, then +1, +3, +6 (shaky topic with plenty of room), a recap in the last 48 h
{
  const r = mk(21, {topics: [{id: "w", name: "Shaky stuff", conf: "weak", links: []}]});
  const ss = byTopic(r, "w").sort((a, b) => a.date < b.date ? -1 : 1), L = ss.find(x => x.kind === "learn");
  ok(L, "has a learn session"); ok(ss[0] === L, "learn comes first");
  const revs = ss.filter(x => !["learn", "recap", "light"].includes(x.kind)).map(x => E.diff(L.date, x.date));
  ok(revs.length === 3, "a shaky topic gets 3 reviews: " + revs);
  eq(revs, [1, 3, 6], "expanding gaps");
  const recap = ss.find(x => x.kind === "recap"); ok(recap && E.diff(recap.date, E.add(T0, 21)) <= 3, "recap in the last 48 h or so: " + (recap && recap.date));
  const gaps = ss.map((x, i) => i ? E.diff(ss[i - 1].date, x.date) : 0).slice(1); ok(gaps.every(g => g >= 1), "never twice in a day");
}

// ---- final day light review, rest day, past paper
{
  const r = mk(10), last = E.add(T0, 9), L = r.sessions.filter(x => x.date === last);
  ok(L.length === 1 && L[0].kind === "light" && L[0].min <= 30, "the day before is one light review of at most 30 min");
  ok(/no new material/i.test(L[0].text) && /sleep/i.test(L[0].text), "light review says no new material and sleep");
  const p = r.sessions.filter(x => x.kind === "past"); ok(p.length === 1 && E.diff(p[0].date, E.add(T0, 10)) >= 3 && E.diff(p[0].date, E.add(T0, 10)) <= 5, "one past paper 3 to 5 days out: " + (p[0] && p[0].date));
  const nl = mk(10, {light: false}); ok(!nl.sessions.some(x => x.kind === "light"), "light review can be turned off");
  const rest = mk(10, {rest: true}); ok(!rest.sessions.some(x => x.date === last), "rest day keeps the day before free"); ok(rest.sessions.some(x => x.kind === "light" && x.date === E.add(T0, 8)), "light review moves back a day");
  ok(!mk(4).sessions.some(x => x.kind === "past"), "no past paper when there are few days");
}

// ---- blocked days, chosen days, free minutes
{
  const blocked = new Set([E.add(T0, 2), E.add(T0, 3), E.add(T0, 4)]);
  const r = mk(14, {dayInfo: d => blocked.has(d) ? {blocked: true, cap: 0} : {}});
  ok(![...blocked].some(d => r.sessions.some(x => x.date === d)), "no sessions on blocked days"); ok(r.warnings.some(w => /blocked/.test(w)), "says so");
  ok(r.sessions.length >= 12, "prep isn't starved: " + r.sessions.length);
  const wk = mk(14, {days: [1, 3, 5]}); ok(wk.sessions.every(x => [1, 3, 5].includes(E.dow(x.date))), "only the chosen weekdays");
  const none = mk(5, {dayInfo: () => ({blocked: true})}); ok(none.err === "nodays" && !none.sessions.length, "all blocked: no plan, honest message");
  const small = mk(7, {dayInfo: () => ({cap: 40})}); dates(small).forEach(d => ok(minsOn(small, d) <= 40, "free minutes cap a day"));
  const fallback = mk(7, {days: [E.dow(E.add(T0, 40))], dayInfo: d => ({})}); ok(fallback.sessions.length > 0, "chosen days with nothing free fall back to other days");
}

// ---- crunch avoidance: heavy days are used last, never skipped when needed
{
  const heavy = new Set([E.add(T0, 1), E.add(T0, 2)]), info = d => heavy.has(d) ? {crunch: true} : {};
  const r = mk(14, {dayInfo: info}), h = r.sessions.filter(x => heavy.has(x.date));
  const base = mk(14);
  ok(h.reduce((a, x) => a + x.min, 0) < base.sessions.filter(x => heavy.has(x.date)).reduce((a, x) => a + x.min, 0) || h.length === 0, "heavy days get less than normal days");
  heavy.forEach(d => ok(minsOn(r, d) <= 54, "a crunch day is cut to 60%: " + minsOn(r, d)));
  ok(r.warnings.some(w => /busy day/.test(w)), "mentions busy days");
  const all = mk(5, {dayInfo: () => ({load: 6})}); ok(all.sessions.length >= 4, "all days heavy: still planned");
  const lo = mk(14, {dayInfo: d => ({load: E.diff(T0, d) < 7 ? 5 : 0})});
  ok(lo.sessions.filter(x => E.diff(T0, x.date) >= 7).length >= lo.sessions.filter(x => E.diff(T0, x.date) < 7).length / 2, "load pushes work toward lighter days");
}

// ---- compression: crash plan with dropped topics reported
{
  const r = mk(2, {topics: topics().concat([{id: "e", name: "Extra topic one", conf: "weak", links: []}, {id: "f", name: "Extra topic two", conf: "strong", links: []}, {id: "g", name: "Extra topic three", conf: "ok", links: []}]), intensity: 45});
  ok(r.crash, "crash plan"); ok(r.dropped.length >= 1, "drops topics that can't fit"); ok(r.warnings[0].startsWith("Not enough time to cover everything. Dropped: "), r.warnings[0]);
  r.dropped.forEach(d => { ok(!r.sessions.some(x => x.topicIds.includes(d.id)), "dropped topics have no sessions"); });
  const kept = new Set(r.sessions.flatMap(x => x.topicIds)), dropIds = new Set(r.dropped.map(x => x.id));
  ok(kept.has("a") || dropIds.size === 0, "the shaky topic is kept"); ok(dropIds.has("f") || dropIds.has("c") || dropIds.has("b") || dropIds.has("g"), "the lowest-need topics go first: " + [...dropIds]);
  ok(!dropIds.has("a"), "shaky topic never dropped before strong ones");
  const t1 = mk(1); ok(t1.sessions.length >= 1 && t1.sessions.every(x => x.date === T0) && !t1.sessions.some(x => x.kind === "light"), "exam tomorrow: everything today, no light review");
  ok(mk(3).crash, "3 days is a crash plan");
  ok(/crash plan/.test(mk(2).warnings.join(" ")), "says crash plan");
  ok(mk(0).err === "past" && mk(-3).err === "past", "no plan for an exam today or past");
  const room = mk(1, {topics: Array.from({length: 8}, (_, i) => ({id: "z" + i, name: "Z topic " + i, conf: "ok", links: []}))}); ok(room.dropped.length >= 4 && room.sessions.length <= 3, "one day, eight topics: at most 3 topics, the rest reported");
}

// ---- plenty of time: capped, not stretched
{
  const r = mk(60, {topics: [{id: "a", name: "Only topic", conf: "ok", links: []}]});
  ok(r.sessions.length <= 8, "a single topic isn't spread into dozens of sessions: " + r.sessions.length); ok(r.sessions.reduce((a, x) => a + x.min, 0) <= 200, "total minutes capped");
}

// ---- material matching
{
  const mat = {decks: [
    {id: "d1", name: "Cardiac Drugs", courseId: "c1", cards: [{id: "k1", front: "Beta blockers", back: "..."}, {id: "k2", front: "ACE inhibitors", back: "..."}], quizzes: [{id: "q1", title: "Cardio quiz"}]},
    {id: "d2", name: "Renal Physiology", courseId: "c1", cards: [{id: "k3", front: "Nephron", back: "..."}], quizzes: []},
    {id: "d3", name: "Heart drugs (other course)", courseId: "c2", cards: [], quizzes: []},
    {id: "d4", name: "Mixed bag", courseId: "c1", cards: [1, 2, 3, 4].map(i => ({id: "m" + i, front: "Glomerular filtration step " + i, back: "kidney"})).concat([{id: "m5", front: "unrelated", back: "x"}, {id: "m6", front: "unrelated 2", back: "x"}, {id: "m7", front: "unrelated 3", back: "x"}]), quizzes: []},
    {id: "d5", name: "Cardiac drugs", courseId: "", cards: [], quizzes: []}],
    notes: [{id: "n1", courseId: "c1", text: "Cardiac drugs\n- beta blockers\n- statins"}, {id: "n2", courseId: "c2", text: "Cardiac drugs for another course"}, {id: "n3", courseId: "c1", text: "Grocery list\nmilk"}, {id: "n4", courseId: "c1", text: "# Kidney function\nNephron structure and renal tubules"}],
    files: [{id: "f1", name: "Lecture 3 - Cardiac Drugs.pdf", courseId: "c1"}, {id: "f2", name: "Syllabus.pdf", courseId: "c1"}, {id: "f3", name: "cardiac_drugs_notes.docx", courseId: "c2"}]};
  const m = E.matchTopic("Cardiac drugs", mat, "c1");
  ok(m.decks[0].id === "d1", "deck by name"); ok(!m.decks.some(d => d.id === "d3"), "no deck from another course"); ok(!m.notes.some(x => x.id === "n2"), "no note from another course"); ok(!m.files.some(x => x.id === "f3"), "no file from another course");
  ok(m.notes[0].id === "n1", "note by heading"); ok(m.files[0].id === "f1", "file by name (lecture word and extension ignored)"); ok(m.quizzes.some(q => q.id === "q1" && q.deckId === "d1"), "quiz of the matching deck");
  ok(m.decks.some(d => d.id === "d5"), "an uncoursed deck with the exact name is allowed");
  const fz = E.matchTopic("Cardio drug", mat, "c1"); ok(fz.decks[0] && fz.decks[0].id === "d1", "fuzzy: alias and stemming (cardio~cardiac, drug~drugs)");
  const k = E.matchTopic("Kidney function", mat, "c1"); ok(k.notes[0] && k.notes[0].id === "n4", "note heading"); ok(k.decks.some(d => d.id === "d2"), "alias: kidney~renal deck");
  const g = E.matchTopic("Glomerular filtration", mat, "c1"); ok(g.decks.some(d => d.id === "d4" && d.cardIds && d.cardIds.length === 4), "deck matched by its cards carries the matching card ids");
  ok(E.flatLinks(E.matchTopic("Quantum chromodynamics", mat, "c1")).length === 0, "nothing for an unrelated topic");
  ok(E.flatLinks(E.matchTopic("Cardiac drugs", mat, "")).every(l => ["d5"].includes(l.id)), "an exam with no course only sees uncoursed material");
  ok(E.matchTopic("", mat, "c1").decks.length === 0, "empty topic");
  const one = E.matchTopic("Drugs", mat, "c1"); ok(!one.notes.some(x => x.id === "n3"), "one common word doesn't match unrelated notes");
}

// ---- topic suggestions and parsing
{
  eq(E.parseTopics("1. Cell cycle\n- Mitosis; Meiosis, DNA repair\n\n  • Cell cycle\n"), ["Cell cycle", "Mitosis", "Meiosis", "DNA repair"], "parse a pasted list, dedupe");
  eq(E.chaptersIn("Covers chapters 4-6 and Ch. 9"), ["Chapter 4", "Chapter 5", "Chapter 6", "Chapter 9"], "chapters named in notes");
  const sug = E.suggestTopics({decks: [{name: "Cardiac Drugs Deck", cards: []}], notes: [{text: "Renal physiology\nlots of text"}], files: [{name: "Lecture 5 - Acid base.pdf"}, {name: "Syllabus Fall.docx"}], examNotes: "Chapters 2-3\nBring a calculator", reading: "", checklist: ["Heart failure"], prior: ["Old topic"]});
  const names = sug.map(x => x.name); ["Old topic", "Heart failure", "Chapter 2", "Chapter 3", "Cardiac Drugs", "Renal physiology", "Acid base"].forEach(x => ok(names.includes(x), "suggested " + x + " in " + names));
  ok(new Set(names.map(E.keyOf)).size === names.length, "no duplicates");
}

// ---- session types from material, sizing from due-card counts
{
  const r = mk(14); const a = byTopic(r, "a"), b = byTopic(r, "b");
  ok(a.some(x => x.kind === "cards" && x.mat && x.mat.id === "d1"), "flashcards session opens the linked deck"); ok(a.some(x => x.kind === "questions" && x.mat && x.mat.k === "quiz" && x.mat.id === "q1" && /quiz/i.test(x.text)), "practice questions use the linked quiz");
  const lb = b.find(x => x.kind === "learn"); ok(lb.mat.k === "note" && /Renal notes/.test(lb.text), "learn session reads the linked note: " + lb.text);
  const gen = byTopic(r, "d").find(x => x.kind === "questions"); ok(!gen || (gen.gen && !gen.mat), "no quiz: offers to generate questions");
  ok(r.offers.some(o => o.topicId === "c" && /No material for Acid base balance: make flashcards from your notes/.test(o.text)), "no material -> offer");
  const today = mk(7, {topics: [{id: "a", name: "Cardiac drugs", conf: "weak", links: [{k: "deck", id: "d1", title: "Cardiac Drugs", total: 200, due: 40}]}]});
  const first = today.sessions.find(x => x.kind === "cards" && x.date === T0);
  const cardsAny = today.sessions.filter(x => x.kind === "cards"); ok(cardsAny.length >= 1, "has a flashcards session");
  cardsAny.forEach(x => { ok(/Review deck Cardiac Drugs: /.test(x.text), x.text); ok(x.min >= 10 && x.min <= 40, "cards minutes sized from the count: " + x.min); ok(x.n >= 40, "n from due and total: " + x.n); });
  const dueToday = E.plan({today: T0, due: E.add(T0, 3), topics: [{id: "a", name: "Cardiac drugs", conf: "weak", done: true, links: [{k: "deck", id: "d1", title: "Cardiac Drugs", total: 200, due: 40}]}], intensity: 90});
  const ct = dueToday.sessions.find(x => x.kind === "cards"); ok(!ct || ct.date !== T0 || /40 cards due/.test(ct.text), "40 cards due today is said plainly");
  const sm = mk(7, {topics: [{id: "a", name: "Tiny", conf: "weak", links: [{k: "deck", id: "d1", title: "Tiny deck", total: 6, due: 6}]}]}); sm.sessions.filter(x => x.kind === "cards").forEach(x => ok(x.min <= 15, "a 6-card deck isn't a 40 minute session: " + x.min));
  const essay = mk(14, {style: ["essay"]}); ok(essay.sessions.some(x => /essay/i.test(x.text)), "format changes the wording"); const calc = mk(14, {style: ["calc"]}); ok(calc.sessions.some(x => /problems/.test(x.text)), "calculation format uses problems");
  ok(mk(14, {style: ["essay"]}).sessions.find(x => x.kind === "past").text.includes("essay"), "timed practice follows the format");
}

// ---- slots in real time windows
{
  const win = d => ({windows: [{s: 9 * 60, e: 11 * 60}, {s: 18 * 60, e: 20 * 60}]});
  const r = mk(7, {dayInfo: win});
  const withSlot = r.sessions.filter(x => x.slot); ok(withSlot.length === r.sessions.length, "all sessions placed");
  dates(r).forEach(d => { const ss = r.sessions.filter(x => x.date === d && x.slot).sort((a, b) => a.slot.s - b.slot.s); ss.forEach((x, i) => { ok((x.slot.s >= 540 && x.slot.e <= 660) || (x.slot.s >= 1080 && x.slot.e <= 1200), "inside a free window " + JSON.stringify(x.slot)); if (i) ok(x.slot.s >= ss[i - 1].slot.e, "no overlap"); }); });
  ok(mk(7).sessions.every(x => x.slot === null), "date-only without windows");
  const custom = mk(7, {dayInfo: win, place: (w, items) => ({slots: items.map(it => ({id: it.id, s: w[0].s, e: w[0].s + it.min, min: it.min}))})}); ok(custom.sessions.every(x => x.slot && x.slot.s === 540), "uses the app's own placer when given");
}

// ---- readiness
{
  const tp = [{id: "a", name: "A", conf: "weak", links: [{k: "deck", id: "d1"}, {k: "quiz", id: "q1", deckId: "d1"}]}, {id: "b", name: "B", conf: "ok", links: []}];
  const ss = [{topicIds: ["a"], min: 30, done: false}, {topicIds: ["a"], min: 30, done: false}, {topicIds: ["b"], min: 40, done: false}];
  const none = E.readiness({topics: tp, sessions: ss}); ok(none.pct === null && !none.gate, "no evidence: no percentage (the same gate as the app's readiness)");
  const one = E.readiness({topics: tp, sessions: ss.map((x, i) => i === 0 ? Object.assign({}, x, {done: true}) : x)}); ok(one.gate && one.pct > 0 && one.evidence.sessions === 1, "one finished session opens the gate: " + one.pct);
  const all = E.readiness({topics: tp, sessions: ss.map(x => Object.assign({}, x, {done: true}))}); ok(all.pct > one.pct && all.pct <= 100, "more done: higher " + all.pct);
  const mastery = E.readiness({topics: tp, sessions: ss, decks: {d1: {mastery: 0.8}}}); ok(mastery.gate && mastery.pct > 0 && mastery.byTopic.a.mastery === 80, "flashcard mastery counts as evidence");
  const quiz = E.readiness({topics: tp, sessions: ss, quiz: {q1: 90}}); ok(quiz.gate && quiz.byTopic.a.quiz === 90, "quiz scores count as evidence");
  const poor = E.readiness({topics: tp, sessions: ss.map(x => Object.assign({}, x, {done: true})), decks: {d1: {mastery: 0.2}}, quiz: {q1: 20}}), great = E.readiness({topics: tp, sessions: ss.map(x => Object.assign({}, x, {done: true})), decks: {d1: {mastery: 1}}, quiz: {q1: 100}}); ok(poor.pct < all.pct && great.pct >= all.pct && poor.evidence.cards === 1 && poor.evidence.quizzes === 1, "weak cards and quiz scores pull readiness down even when every session is done");
  ok(all.byTopic.a.cov === 100 && one.byTopic.a.cov === 50, "coverage per topic");
  ok(E.readiness({topics: [{id: "x", name: "X", conf: "ok", done: true, links: []}], sessions: []}).gate, "a topic marked already studied is evidence");
  ok(E.readiness({topics: [], sessions: []}).pct === null, "empty");
  const heavy = E.readiness({topics: [{id: "a", conf: "ok", weight: 90, links: []}, {id: "b", conf: "ok", weight: 10, links: []}], sessions: [{topicIds: ["a"], min: 30, done: true}, {topicIds: ["b"], min: 30, done: false}]}); const light = E.readiness({topics: [{id: "a", conf: "ok", weight: 10, links: []}, {id: "b", conf: "ok", weight: 90, links: []}], sessions: [{topicIds: ["a"], min: 30, done: true}, {topicIds: ["b"], min: 30, done: false}]}); ok(heavy.pct > light.pct, "weight counts in readiness");
}

// ---- catch-up and re-plan keep done sessions; idempotent
{
  const first = mk(14); const done = first.sessions.filter(x => x.date < E.add(T0, 3)).map(x => ({topicId: x.topicIds[0], kind: x.kind, min: x.min, date: x.date}));
  ok(done.length >= 3, "something to keep");
  const later = "2026-10-08", r = E.plan({today: later, due: E.add(T0, 14), topics: topics(), intensity: 90, done});
  ok(r.sessions.every(x => x.date >= later && x.date < E.add(T0, 14)), "re-spread only over the days left");
  done.filter(d => d.kind === "learn").forEach(d => ok(!r.sessions.some(x => x.topicIds[0] === d.topicId && x.kind === "learn"), "a done learn session is not repeated: " + d.topicId));
  const fresh = E.plan({today: later, due: E.add(T0, 14), topics: topics(), intensity: 90}); ok(r.sessions.reduce((a, x) => a + x.min, 0) < fresh.sessions.reduce((a, x) => a + x.min, 0), "less to do once some is done");
  const missedAll = E.plan({today: E.add(T0, 12), due: E.add(T0, 14), topics: topics(), intensity: 90}); ok(missedAll.sessions.length >= 2 && missedAll.crash, "far behind: a crash plan over what's left");
  const marked = E.plan({today: T0, due: E.add(T0, 14), topics: topics().map(t => Object.assign(t, {done: t.id === "a"})), intensity: 90}); ok(!marked.sessions.some(x => x.topicIds[0] === "a" && x.kind === "learn"), "already studied: no learn session"); ok(marked.sessions.some(x => x.topicIds[0] === "a"), "but it still comes back for review");
  // date change
  const moved = E.plan({today: T0, due: E.add(T0, 21), topics: topics(), intensity: 90}), a = E.plan({today: T0, due: E.add(T0, 7), topics: topics(), intensity: 90});
  ok(moved.sessions.every(x => x.date < E.add(T0, 21)) && a.sessions.every(x => x.date < E.add(T0, 7)), "plans follow the exam date");
  ok(moved.sessions.some(x => x.date >= E.add(T0, 8)), "a later exam uses the extra days");
  // idempotent
  const inp = {today: T0, due: E.add(T0, 14), topics: topics(), intensity: 90, done};
  eq(E.plan(inp), E.plan(inp), "same input gives the same plan"); const ids = E.plan(inp).sessions.map(x => x.id); ok(new Set(ids).size === ids.length, "session ids are unique");
  const sig = x => x.sessions.map(s => [s.date, s.kind, s.topicIds.join("+"), s.min].join("|")).join(";"); eq(sig(E.plan(inp)), sig(E.plan(JSON.parse(JSON.stringify(Object.assign({}, inp, {topics: topics(), dayInfo: undefined}))))), "a copy of the input gives the same plan");
}

// ---- DST days and Feb 29 are plain calendar days
{
  const cases = [["2026-10-30", "2026-11-03", ["2026-10-30", "2026-10-31", "2026-11-01", "2026-11-02"]], ["2026-03-06", "2026-03-10", ["2026-03-06", "2026-03-07", "2026-03-08", "2026-03-09"]], ["2028-02-26", "2028-03-02", ["2028-02-26", "2028-02-27", "2028-02-28", "2028-02-29", "2028-03-01"]]];
  cases.forEach(([today, due, want]) => {
    const r = E.plan({today, due, topics: topics(), intensity: 90, light: false, paper: false});
    const ds = [...new Set(r.sessions.map(x => x.date))].sort(); ok(ds.every(d => want.includes(d)), `days stay on the calendar for ${today}: ${ds}`); ok(want.slice(0, 3).every(d => ds.includes(d)), "every early day is used: " + ds);
    ok(r.sessions.every(x => x.date >= today && x.date < due), "never past or on the exam day");
  });
  eq(E.add("2026-11-01", 1), "2026-11-02", "fall back day"); eq(E.add("2026-03-07", 2), "2026-03-09", "spring forward day"); eq(E.add("2028-02-28", 1), "2028-02-29", "leap day"); eq(E.add("2028-02-29", 1), "2028-03-01", "after the leap day");
  eq(E.diff("2026-10-31", "2026-11-02"), 2, "diff over a DST end"); eq(E.diff("2028-02-28", "2028-03-01"), 2, "diff over Feb 29"); eq(E.dow("2026-11-01"), 0, "weekday of the fall-back day");
  const wk = E.plan({today: "2026-10-30", due: "2026-11-09", topics: topics(), intensity: 90, days: [0]}); ok(wk.sessions.every(x => E.dow(x.date) === 0), "weekday filter is right across the DST change");
}

// ---- odd inputs
{
  ok(E.plan({}).err === "date", "no dates"); ok(E.plan({today: T0, due: "nope"}).err === "date", "bad date");
  const noTopics = E.plan({today: T0, due: E.add(T0, 7), topics: [], intensity: 90, examTitle: "Midterm"}); ok(noTopics.sessions.length > 0 && noTopics.sessions[0].topic === "Midterm", "no topics: plans the whole exam");
  ok(E.plan({today: T0, due: E.add(T0, 7), topics: [{name: "  "}, null], intensity: 90}).sessions.length > 0, "blank topics ignored");
  const huge = E.plan({today: T0, due: E.add(T0, 7), topics: topics(), intensity: 9999}); ok(huge.sessions.every(x => x.min <= 300), "intensity clamped");
}
// ---- the plan stored on the exam task: normalised, and merged field by field across devices
{
  const vm = require("vm");
  const fa = s.indexOf("function normPrep(p){"), fb = s.indexOf("\n}\n", fa) + 3;
  const normPrep = vm.runInNewContext(s.slice(fa, fb) + "\nnormPrep;", {isDate: x => typeof x === "string" && /^\d{4}-\d{2}-\d{2}$/.test(x), Math, Number, String, Array, Set});
  const p = normPrep({topics: [{id: "a", name: "  Cardiac <b>drugs</b> ", conf: "weak", weight: "25", links: [{k: "deck", id: "d1", title: "Deck", cardIds: ["k1", "k2"]}, {k: "evil", id: "x"}, null]}, {name: ""}, {id: "a", name: "dup id"}], intensity: 9999, style: ["mc", "nope"], days: [1, 3, 3, 9], rest: 1, start: "nope", examDue: "2026-10-14"});
  ok(p.topics.length === 1 && !/[<>]/.test(p.topics[0].name) && /Cardiac/.test(p.topics[0].name), "topic names cleaned, blank and duplicate ids dropped: " + p.topics[0].name);
  ok(p.topics[0].weight === 25 && p.topics[0].links.length === 1 && p.topics[0].links[0].cardIds.length === 2, "weight and links kept, bad links dropped");
  ok(p.intensity === 300 && p.style.length === 1 && p.days.join() === "1,3" && p.rest === true && p.start === "" && p.examDue === "2026-10-14" && p.light === true, "settings clamped");
  ok(normPrep(null) === null && normPrep([]) === null && normPrep("x") === null, "junk is not a plan");
  const sa = s.indexOf("/* SYNC-MERGE-START"), sb = s.indexOf("/* SYNC-MERGE-END */");
  const SM = vm.runInNewContext(s.slice(sa, sb) + "\nSyncMerge;", {Date, JSON, Math, Map, Set, Uint16Array, Object, Array, String, Number, Promise});
  const J = x => JSON.parse(JSON.stringify(x)), task = o => Object.assign({id: "ex1", title: "Midterm", type: "Exam", due: "2026-10-20", status: "todo", priority: "med", notes: "", checklist: [], dependsOn: [], history: [], pct: 0}, o);
  const topic = (id, name, o) => Object.assign({id, name, conf: "ok", weight: null, done: false, links: []}, o);
  const base = task({prep: {v: 1, intensity: 90, topics: [topic("a", "A"), topic("b", "B")]}});
  const mine = J(base), theirs = J(base); mine.prep.topics[0].conf = "weak"; mine.prep.intensity = 120; theirs.prep.topics.push(topic("c", "C")); theirs.prep.topics[1].done = true;
  const r = SM.mergeItem("task", base, mine, theirs, {now: Date.parse("2026-10-12T15:00:00Z")}).merged;
  ok(r.prep.topics.length === 3 && r.prep.topics.find(t => t.id === "a").conf === "weak" && r.prep.topics.find(t => t.id === "b").done && r.prep.topics.find(t => t.id === "c") && r.prep.intensity === 120, "two devices' edits to topics and settings merge field by field");
}
console.log(`examprep.test.js: ${n} checks passed`);
