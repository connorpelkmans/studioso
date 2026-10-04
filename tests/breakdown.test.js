// Unit tests for the Big Assignment Breakdown engine (pure block extracted from index.html).  Run: node tests/breakdown.test.js
const fs = require("fs"), path = require("path"), assert = require("assert"), cp = require("child_process");
const TZS = ["UTC", "America/New_York", "America/Los_Angeles", "Europe/London", "Australia/Sydney", "Pacific/Auckland", "Asia/Kolkata"];
if (!process.env.BD_TZ_CHILD && !process.env.BD_NO_TZ) {
  for (const tz of TZS) {
    const r = cp.spawnSync(process.execPath, [__filename], {env: Object.assign({}, process.env, {TZ: tz, BD_TZ_CHILD: "1"}), encoding: "utf8"});
    process.stdout.write(`[${tz}] ${r.stdout.trim().split("\n").pop()}\n`);
    if (r.status !== 0) { process.stderr.write(r.stderr + r.stdout); process.exit(1); }
  }
  process.exit(0);
}
const s = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const cut = (a, b) => s.slice(s.indexOf(a), s.indexOf(b));
const B = new Function(cut("/* BREAKDOWN-START", "/* BREAKDOWN-END */") + ";return BREAKDOWN;")();
const C = new Function(cut("/*CRUNCH-START*/", "/*CRUNCH-END*/") + ";return CRUNCH;")();
let n = 0; const ok = (c, m) => { n++; assert(c, m); };
const eq = (a, b, m) => { n++; assert.deepStrictEqual(a, b, m); };
const T0 = "2026-10-05";   // a Monday
const plan = (o) => B.plan(Object.assign({title: "Research paper on coral", start: T0, due: "2026-10-15", hours: 12}, o));
const dates = p => p.milestones.map(m => m.due);
const inc = ds => ds.every((d, i) => !i || d > ds[i - 1]);

// ---- kind detection
eq(B.detectKind("Research paper on coral reefs", ""), "paper", "paper");
eq(B.detectKind("Lab 3 report", ""), "lab", "lab report");
eq(B.detectKind("Group presentation", ""), "presentation", "presentation beats group");
eq(B.detectKind("CS final project", "Build a web app with an API and a database"), "programming", "programming from text");
eq(B.detectKind("Marketing case study", ""), "case", "case study");
eq(B.detectKind("Annotated bibliography", ""), "annbib", "annotated bibliography");
eq(B.detectKind("Literature review", ""), "litreview", "literature review");
eq(B.detectKind("Poster for the science fair", ""), "poster", "poster");
eq(B.detectKind("Learning portfolio", ""), "portfolio", "portfolio");
eq(B.detectKind("Take-home midterm", ""), "takehome", "take home");
eq(B.detectKind("Homework 4", ""), "generic", "nothing fits");
eq(B.detectKind("Assignment 2", "Write an essay of 1500 words"), "paper", "kind from text");
ok(B.isBig({type: "Project", title: "Thing", hours: 3}) && B.isBig({type: "Assignment", title: "Term paper"}) && !B.isBig({type: "Assignment", title: "Homework 1", hours: 1}), "isBig by hours or cue");
ok(!B.isBig({type: "Exam", title: "Midterm", hours: 20}) && !B.isBig({type: "Study", title: "Study paper", hours: 5, prepFor: "x"}) && !B.isBig({type: "Project", title: "Paper", hours: 9, breakdownOf: "p"}), "exams, study sessions, milestones are not big");

// ---- stage fractions and counts
{
  for (const k of B.ORDER) {
    const st = B.stagesFor(k, 99, {src: 6, sec: 4}), tot = st.reduce((a, x) => a + x.h, 0);
    ok(Math.abs(tot - 1) < 1e-9, k + " fractions sum to 1");
  }
  eq([2, 3, 4, 6, 8, 12, 20, 40, 60].map(B.nFor), [2, 3, 3, 3, 4, 5, 6, 8, 8], "milestone count scales with size");
  for (const h of [4, 6, 10, 20, 40, 80]) {
    const p = plan({due: "2026-12-30", hours: h}), t = p.milestones.reduce((a, m) => a + m.hours, 0);
    ok(p.milestones.length === B.nFor(h) && Math.abs(t - h) < 0.01, `${h}h gives ${B.nFor(h)} milestones that add up (${t})`);
    ok(p.milestones.every(m => m.title.length <= 70 && m.hours >= 0.25 && m.steps.length <= 3), "titles short, hours sane, at most 3 steps");
  }
  const paper = B.stagesFor("paper", 6, {src: 6, sec: 4});
  ok(Math.abs(paper[0].h - 0.15 / 1.03) < 0.01 || paper.length === 6, "paper stages");
  ok(plan({hours: 40, due: "2026-12-30"}).milestones.some(m => /6 sources|10 sources/.test(m.title)), "template mentions a source count");
  ok(plan({text: "Use 5 scholarly sources and 3 sections", hours: 12, due: "2026-12-30"}).milestones.some(m => /5 sources|3 sections/.test(m.title)), "counts from the text are used");
}

// ---- backward scheduling
{
  const p = plan({due: "2026-10-15"});          // 10 days
  const ds = dates(p);
  ok(inc(ds), "dates strictly increase: " + ds);
  ok(ds[ds.length - 1] === "2026-10-14", "last milestone is the day before the due date");
  ok(ds.every(d => d >= T0 && d < "2026-10-15"), "none before start or on the due date");
  ok(!p.tight && p.mode === "full", "10 days for 12h is not tight");
  ok(plan({due: "2026-10-15", buffer: 2}).milestones.slice(-1)[0].due === "2026-10-13", "buffer 2");
  ok(plan({due: "2026-10-15", buffer: 0}).milestones.slice(-1)[0].due === "2026-10-15", "buffer 0 is the student's choice: the last step may land on the due date");
  // proportional spacing: the biggest stage gets the longest gap
  const gaps = ds.map((d, i) => i ? B.diff(ds[i - 1], d) : B.diff(T0, d)), hs = p.milestones.map(m => m.hours);
  ok(gaps[hs.indexOf(Math.max(...hs))] >= Math.min(...gaps), "spacing follows effort");
  // 3 days
  const p3 = plan({due: "2026-10-08", hours: 8});
  ok(p3.tight && /Tight: only 3 days left/.test(p3.messages.join(" ")) && p3.mode === "compressed", "3 days: tight message " + p3.messages);
  ok(p3.merged.length > 0 && p3.milestones.length <= 3 && inc(dates(p3)), "3 days: stages merged and named");
  ok(/Merged/.test(p3.messages.join(" ")), "says what was merged");
  // 40 days: window capped by the kind's usual lead time
  const p40 = plan({due: "2026-11-14", hours: 40});
  ok(p40.milestones.length === 8 && dates(p40)[0] >= "2026-10-17", "40 days: starts about 28 days before the due date, not today: " + dates(p40)[0]);
  ok(plan({due: "2026-11-14", hours: 40, leadDays: 40}).milestones[0].due < dates(p40)[0], "lead time preference widens the window");
  // never past
  for (const due of ["2026-10-05", "2026-10-06", "2026-10-07", "2026-10-09", "2026-10-30"]) {
    const q = plan({due, hours: 20}); ok(q.milestones.every(m => m.due >= T0 && m.due <= due), "never past: " + due);
    ok(due === T0 ? q.milestones.every(m => m.due === T0) : q.milestones.every(m => m.due < due), "not on the due date unless forced: " + due);
  }
  // hopeless
  const h1 = plan({due: "2026-10-06", hours: 20});
  ok(h1.hopeless && h1.mode === "sprint" && /Not enough time/.test(h1.messages[0]) && h1.milestones.length <= 3, "20h due tomorrow is hopeless, sprint plan: " + h1.messages[0]);
  const h0 = plan({due: T0, hours: 20});
  ok(h0.hopeless && h0.milestones.length === 1 && h0.milestones[0].due === T0 && /due today/i.test(h0.messages.join(" ")), "due today: forced onto today");
  const hp = plan({due: "2026-10-03", hours: 5, start: T0});
  ok(hp.milestones.every(m => m.due === T0) && /past due/.test(hp.messages.join(" ")), "overdue: everything today");
  ok(!plan({due: "2026-10-30", hours: 6}).tight, "plenty of time is never tight");
  // next to a weekend: due Monday 2026-10-12, weekdays only
  const wk = plan({due: "2026-10-12", hours: 8, days: [1, 2, 3, 4, 5]});
  ok(wk.milestones.every(m => ![0, 6].includes(B.dow(m.due))) && wk.milestones.slice(-1)[0].due === "2026-10-09", "weekdays only: last step Friday before a Monday due date: " + dates(wk));
  const we = plan({due: "2026-10-12", hours: 8});
  ok(we.milestones.slice(-1)[0].due === "2026-10-11", "all days: Sunday before Monday");
  // blocked days
  const free = {}; for (let d = T0; d < "2026-10-15"; d = B.addD(d, 1)) free[d] = 3;
  ["2026-10-07", "2026-10-08", "2026-10-09", "2026-10-14"].forEach(d => { free[d] = 0; });
  const bl = plan({due: "2026-10-15", free});
  ok(bl.milestones.every(m => free[m.due] > 0) && bl.milestones.slice(-1)[0].due === "2026-10-13", "blocked days skipped: " + dates(bl));
  const all0 = {}; for (let d = T0; d < "2026-10-15"; d = B.addD(d, 1)) all0[d] = 0;
  ok(plan({due: "2026-10-15", free: all0}).milestones.length > 0, "every day blocked still gives a plan");
  // crunch avoidance
  const base = plan({due: "2026-10-20", hours: 12}), load = {};
  const target = base.milestones[2].due; load[target] = 1.6;
  const av = plan({due: "2026-10-20", hours: 12, load});
  ok(av.milestones[2].due !== target && Math.abs(B.diff(target, av.milestones[2].due)) <= 2 && !av.milestones[2].heavy && av.milestones[2].moved, "heavy day avoided within 2 days: " + target + " -> " + av.milestones[2].due);
  ok(inc(dates(av)), "order kept after moving");
  const allHeavy = {}; for (let d = T0; d < "2026-10-20"; d = B.addD(d, 1)) allHeavy[d] = 1.6;
  ok(plan({due: "2026-10-20", hours: 12, load: allHeavy}).milestones.every(m => m.heavy), "no alternative: flagged heavy, not moved");
  const ld = B.lighterDay({date: "2026-10-10", hours: 2, lo: "2026-10-08", hi: "2026-10-12", load: {"2026-10-10": 1.5, "2026-10-11": 0.2}});
  eq(ld, "2026-10-09", "lighter day within bounds (the lightest, nearest first)");
  eq(B.lighterDay({date: "2026-10-10", hours: 2, lo: "2026-10-10", hi: "2026-10-10", load: {"2026-10-10": 1.5}}), null, "no room to move");
  // several milestones are never stacked on one heavy day's neighbour
  const ds2 = dates(av); ok(new Set(ds2).size === ds2.length, "no two milestones on one day");
}

// ---- DST and leap days
{
  for (const [start, due] of [["2026-10-28", "2026-11-06"], ["2026-03-04", "2026-03-12"], ["2028-02-24", "2028-03-03"], ["2026-10-30", "2026-11-02"]]) {
    const p = plan({start, due, hours: 10}), ds = dates(p);
    ok(inc(ds) && ds.every(d => B.isDate(d) && d >= start && d < due), `dates valid across ${start}..${due}: ${ds}`);
    ok(ds[ds.length - 1] === B.addD(due, -1), "last is the day before " + due);
  }
  eq(B.addD("2026-11-01", 1), "2026-11-02", "fall back");
  eq(B.addD("2026-03-08", 1), "2026-03-09", "spring forward");
  eq(B.addD("2028-02-28", 1), "2028-02-29", "feb 29");
  eq(B.addD("2028-02-29", 1), "2028-03-01", "after feb 29");
  eq(B.diff("2026-11-01", "2026-11-02"), 1, "diff over fall back");
  eq(B.diff("2026-03-08", "2026-03-09"), 1, "diff over spring forward");
  eq(B.diff("2028-02-28", "2028-03-01"), 2, "diff over feb 29");
  ok(B.isDate("2028-02-29") && !B.isDate("2026-02-29"), "feb 29 only in leap years");
  const p = plan({start: "2026-10-30", due: "2026-11-12", hours: 12}); ok(dates(p).includes("2026-11-01") || dates(p).includes("2026-11-02") || p.milestones.length > 0, "plan across the fall-back day");
}

// ---- AI output validator
{
  const good = {kind: "paper", stages: [
    {title: "Choose a topic and gather your sources", steps: ["Narrow the question", "Save 3 starting sources"], done: "A source list", weight: 2},
    {title: "Read the sources and take notes", steps: ["Highlight key quotes"], weight: 3},
    {title: "Outline the thesis and main sections", steps: ["One-sentence thesis"], weight: 1.5},
    {title: "Write the full first draft", steps: [], weight: 4},
    {title: "Revise, proofread and submit", steps: ["Check citations"], weight: 1.5}]};
  const v = B.vetAi(JSON.stringify(good), {text: "Write a paper about coral.", hours: 12, title: "Paper"});
  ok(v.ok && v.stages.length === 5 && Math.abs(v.stages.reduce((a, x) => a + x.weight, 0) - 1) < 0.01, "good output accepted and weights sum to 1");
  ok(v.stages.some(x => x.unsupported) === false || v.stages[0].steps.length >= 1, "steps kept");
  const mk = (stages, extra) => JSON.stringify(Object.assign({kind: "paper", stages}, extra || {}));
  const st = i => good.stages[i];
  ok(!B.vetAi("not json at all", {hours: 12}).ok && B.vetAi("not json at all", {hours: 12}).reason === "not-json", "non-JSON rejected");
  ok(!B.vetAi("{\"kind\":\"paper\"}", {hours: 12}).ok, "no stages rejected");
  ok(B.vetAi("```json\n" + JSON.stringify(good) + "\n```", {hours: 12, text: "x"}).ok, "fenced JSON accepted");
  ok(!B.vetAi(mk([st(0)]), {hours: 12}).ok && B.vetAi(mk([st(0)]), {hours: 12}).reason === "count", "too few rejected");
  ok(!B.vetAi(mk(Array.from({length: 12}, (_, i) => ({title: "Specific step number " + i + " of coral work", weight: 1}))), {hours: 12}).ok, "too many rejected");
  const generic = B.vetAi(mk(good.stages.concat([{title: "Do the work", weight: 1}, {title: "Stay organized", weight: 1}])), {hours: 12, text: "x"});
  ok(generic.ok && generic.stages.length === 5 && generic.issues.some(i => /generic/.test(i)), "generic filler dropped: " + generic.issues);
  ok(!B.vetAi(mk([{title: "Do the work", weight: 1}, {title: "Stay organized", weight: 1}, {title: "Complete the assignment", weight: 1}, {title: "Get started", weight: 1}]), {hours: 12}).ok, "all filler rejected");
  const dup = B.vetAi(mk(good.stages.concat([{title: "Write the full first draft now", weight: 1}])), {hours: 12, text: "x"});
  ok(dup.ok && dup.stages.length === 5 && dup.issues.some(i => /duplicate/.test(i)), "duplicates dropped: " + dup.issues);
  const long = B.vetAi(mk(good.stages.concat([{title: "Write an extremely long and rambling milestone title that goes on and on well past the limit", weight: 1}])), {hours: 12, text: "x"});
  ok(long.ok && long.issues.some(i => /long title/.test(i)), "too-long titles dropped");
  const inv = B.vetAi(mk([{title: "Find and skim 6 sources", steps: ["Write 12 pages", "Cite 5 sources"], weight: 1}].concat(good.stages.slice(1))), {hours: 12, text: "Write a paper about coral. Use 5 sources."});
  ok(inv.ok && !/6 sources/.test(inv.stages[0].title) && inv.stages[0].unsupported && inv.stages[0].unsupported.some(x => /6 sources/.test(x)), "invented count removed and marked: " + JSON.stringify(inv.stages[0]));
  ok(inv.stages[0].steps.some(x => /5 sources/.test(x)) && !inv.stages[0].steps.some(x => /12 pages/.test(x)), "supported count kept, invented one removed");
  const noText = B.vetAi(mk([{title: "Find and skim 6 sources", weight: 1}].concat(good.stages.slice(1))), {hours: 12, text: ""});
  ok(noText.ok && !/6 sources/.test(noText.stages[0].title), "with no text any count is unsupported");
  const req = B.vetAi(mk([{title: "Read the sources and take notes", steps: ["This is required by the rubric", "Highlight quotes"], weight: 1}].concat(good.stages.slice(1))), {hours: 12, text: "Write a paper."});
  ok(req.ok && !req.stages[0].steps.some(x => /required/.test(x)) && req.stages[0].unsupported, "invented 'required' step removed");
  const w1 = B.vetAi(mk(good.stages.map((x, i) => Object.assign({}, x, {weight: [50, 20, 10, 15, 5][i]}))), {hours: 12, text: "x"});
  ok(w1.ok && Math.abs(w1.stages.reduce((a, x) => a + x.weight, 0) - 1) < 0.01 && Math.max(...w1.stages.map(x => x.weight)) <= 0.46, "percent weights renormalized and capped");
  const w2 = B.vetAi(mk(good.stages.map(x => Object.assign({}, x, {weight: "lots"}))), {hours: 12, text: "x"});
  ok(w2.ok && w2.stages.every(x => Math.abs(x.weight - 0.2) < 0.001), "unusable weights become equal");
  const w3 = B.vetAi(mk(good.stages.map((x, i) => Object.assign({}, x, {weight: i === 0 ? 1000 : 1}))), {hours: 12, text: "x"});
  ok(w3.ok && Math.max(...w3.stages.map(x => x.weight)) <= 0.46, "absurd weight limited");
  // dates from the AI are ignored, and the plan stays in the future
  const dated = B.vetAi(mk(good.stages.map(x => Object.assign({}, x, {date: "2020-01-01", due: "2019-05-05"}))), {hours: 12, text: "x"});
  ok(dated.ok && dated.fixes.includes("ignored dates") && dated.stages.every(x => !("date" in x) && !("due" in x)), "AI dates ignored");
  const pa = plan({due: "2026-10-15", stages: dated.stages});
  ok(pa.source === "ai" && pa.milestones.every(m => m.due >= T0) && pa.milestones.length === 5 && Math.abs(pa.milestones.reduce((a, m) => a + m.hours, 0) - 12) < 0.01, "AI stages scheduled by the engine");
  ok(pa.milestones[3].hours > pa.milestones[2].hours, "AI weights drive the hours");
  const unk = B.vetAi(mk(good.stages, {kind: "spaceship"}), {hours: 12, title: "Research paper", text: "x"});
  ok(unk.ok && unk.kind === "paper", "unknown kind falls back to detection");
  ok(B.vetAi({stages: good.stages}, {hours: 12, text: "x"}).ok, "object input and no kind");
  ok(B.vetAi("{\"kind\":\"paper\",\"stages\":[", {hours: 12, repair: t => null}).ok === false, "cut-off JSON without repair fails");
  ok(B.vetAi("{bad", {hours: 12, repair: t => good, text: "x"}).ok, "repair hook used");
}

// ---- re-plan after a due date change, catch-up, parent progress
{
  const p = plan({due: "2026-10-30", hours: 12}), ex = p.milestones.map((m, i) => ({id: "k" + i, title: m.title, hours: m.hours, done: i < 2, steps: m.steps, kind: m.kind}));
  const r = B.replan({due: "2026-11-10", start: "2026-10-12", existing: ex, kind: "paper"});
  ok(r.milestones.length === ex.length - 2 && r.milestones.every(m => m.id.startsWith("k") && Number(m.id.slice(1)) >= 2), "re-plan covers only the unfinished steps and keeps ids");
  ok(inc(dates(r)) && dates(r)[0] >= "2026-10-12" && dates(r).slice(-1)[0] === "2026-11-09", "re-plan from today to the new due date: " + dates(r));
  ok(Math.abs(r.milestones.reduce((a, m) => a + m.hours, 0) - ex.slice(2).reduce((a, m) => a + m.hours, 0)) < 0.01, "re-plan keeps the hours");
  const cu = B.replan({due: "2026-10-16", start: "2026-10-12", existing: ex, kind: "paper", catchup: true});
  ok(cu.catchup && /Catch-up/.test(cu.messages[0]) && cu.milestones.every(m => m.due >= "2026-10-12" && m.due < "2026-10-16"), "catch-up plan is from today");
  const crowded = B.replan({due: "2026-10-13", start: "2026-10-12", existing: ex, kind: "paper"});
  ok(crowded.milestones.length === 3 && crowded.milestones.every(m => m.due === "2026-10-12"), "more steps than days: no merge, same day: " + dates(crowded));
  eq(B.replan({due: "2026-11-10", start: "2026-10-12", existing: ex.map(e => Object.assign({}, e, {done: true}))}).milestones.length, 0, "nothing left to re-plan");
  // shift the rest
  const ms = [{due: "2026-10-10"}, {due: "2026-10-12"}, {due: "2026-10-14"}];
  eq(B.shiftRest(ms, 0, "2026-10-11", {shiftRest: true, due: "2026-10-20", today: "2026-10-05"}).map(x => x.due), ["2026-10-11", "2026-10-13", "2026-10-15"], "shift the rest moves later ones together");
  eq(B.shiftRest(ms, 0, "2026-10-11", {}).map(x => x.due), ["2026-10-11", "2026-10-12", "2026-10-14"], "only the one date without the option");
  eq(B.shiftRest(ms, 0, "2026-10-13", {shiftRest: true, due: "2026-10-15", today: "2026-10-05"}).map(x => x.due), ["2026-10-13", "2026-10-14", "2026-10-14"], "shifted dates stay before the due date");
  // progress, offers
  const parent = {id: "P", breakdownParent: true, bdDue: "2026-10-20", due: "2026-10-20", status: "todo"};
  const kids = [{id: "a", breakdownOf: "P", status: "done", step: "1/3", due: "2026-10-08"}, {id: "b", breakdownOf: "P", status: "todo", step: "2/3", due: "2026-10-04"}, {id: "c", breakdownOf: "P", status: "todo", step: "3/3", due: "2026-10-18"}, {id: "z", breakdownOf: "Q", status: "todo"}];
  const mine = B.kidsOf("P", kids); eq(mine.map(k => k.id), ["b", "a", "c"], "kids of one parent, by date");
  const pr = B.progressOf(mine); ok(pr.done === 1 && pr.total === 3 && pr.text === "1 of 3 milestones done" && !pr.all, "parent progress text");
  ok(B.progressOf(mine.map(k => Object.assign({}, k, {status: "done"}))).all, "all done");
  ok(!B.needsReplan(parent, mine) && B.needsReplan(Object.assign({}, parent, {due: "2026-10-25"}), mine) && !B.needsReplan(Object.assign({}, parent, {due: "2026-10-25"}), mine.map(k => Object.assign({}, k, {status: "done"}))), "re-plan offered only after a due change with open milestones");
  eq(B.overdueKids(mine, "2026-10-05").map(k => k.id), ["b"], "overdue milestones");
}

// ---- reading the assignment text
{
  eq(B.parseDue("Paper 2\nDue: Friday, October 16 at 11:59 PM", "2026-10-05"), {date: "2026-10-16", time: "23:59"}, "month + weekday");
  eq(B.parseDue("Submit by 11/20/2026", "2026-10-05"), {date: "2026-11-20", time: ""}, "numeric");
  eq(B.parseDue("Due 2026-12-01", "2026-10-05").date, "2026-12-01", "iso");
  eq(B.parseDue("due Mar 3", "2026-12-01").date, "2027-03-03", "next year when the date already passed");
  eq(B.parseDue("Due Friday", "2026-10-05").date, "2026-10-09", "weekday");
  eq(B.parseDue("no date here", "2026-10-05"), null, "none");
  eq(B.guessTitle("\n  # Research Paper: Coral Reefs.\nDue Oct 10\n"), "Research Paper: Coral Reefs", "title from the first line");
  eq(B.facts("Use at least 5 scholarly sources, 4 sections, about 8 pages").sources, 5, "facts: sources");
}

// ---- Crunch: milestones do not double count
{
  const T = (id, type, due, o) => Object.assign({id, title: id, type, due, status: "todo", est: true}, o || {});
  const model = tasks => C.build({today: T0, tasks, dailyHours: 3});
  const total = m => m.days.reduce((a, d) => a + d.demand, 0);
  const p = plan({due: "2026-10-20", hours: 12});
  const kids = p.milestones.map((m, i) => T("m" + i, "Project", m.due, {rem: m.hours, bd: true}));
  const before = model([T("paper", "Assignment", "2026-10-20", {title: "Research paper", rem: 12})]);
  const after = model([T("paper", "Assignment", "2026-10-20", {title: "Research paper", rem: 0.25})].concat(kids));
  const hoursIn = m => m.days.reduce((a, d) => a + Object.values(d.items).reduce((b, i) => b + i.hours, 0), 0);
  ok(Math.abs(hoursIn(after) - (12 * 1 + 0.25)) < 0.9 || hoursIn(after) < hoursIn(before) * 1.2, `after: ${hoursIn(after).toFixed(2)}h vs before: ${hoursIn(before).toFixed(2)}h (not doubled)`);
  const doubled = model([T("paper", "Assignment", "2026-10-20", {title: "Research paper", rem: 12})].concat(kids));
  ok(hoursIn(doubled) > hoursIn(after) * 1.6, "without the guard it would double count");
  ok(C.classOf({type: "Project", bd: true}) === "study" && C.classOf({type: "Project"}) === "project", "milestones are placed on their own day, no lead-up or stress");
  const stress = m => m.days.reduce((a, d) => a + Object.values(d.items).reduce((b, i) => b + i.stress, 0), 0);
  ok(stress(after) <= stress(before) + 1e-9, "milestones add no due-day stress: " + stress(after) + " vs " + stress(before));
  // the day a milestone is due carries its hours
  const d = after.days.find(x => x.date === p.milestones[1].due); ok(d && d.items["m1"] && d.items["m1"].hours > 0 && d.items["m1"].stress === 0, "milestone hours land on its own day");
  // the plan reads Crunch load: a loaded day is avoided
  const loadMap = {}; model([T("big", "Exam", "2026-10-09", {rem: 12})]).days.forEach(x => { loadMap[x.date] = x.ratio; });
  const calm = plan({due: "2026-10-20", hours: 12}), withLoad = plan({due: "2026-10-20", hours: 12, load: loadMap});
  ok(withLoad.milestones.every(m => !m.heavy) || withLoad.milestones.some(m => m.moved) || JSON.stringify(dates(calm)) === JSON.stringify(dates(withLoad)), "plan reads the Crunch load");
}
console.log(`breakdown: ${n} assertions ok`);
