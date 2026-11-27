// Unit tests for the grade insights math (GINS in 90-grade-insights.js): points lost, letter cutoffs, class spread, the forecast,
// Target GPA, the best next hour, study patterns and the term timeline. GRULES (90-grades.js) does the grade itself.
const assert = require("assert");
const s = require("../scripts/app-files").source();
const cut = (a, b) => s.slice(s.indexOf(a), s.indexOf(b));
const G = new Function(cut("/*GINS-START*/", "/*GINS-END*/") + ";return GINS;")();
const R0 = new Function(cut("/*GRULES-START*/", "/*GRULES-END*/") + ";return GRULES;")();
let n = 0; const ok = (c, m) => { n++; assert(c, m); };
const near = (a, b, e) => Math.abs(a - b) <= (e == null ? 1e-9 : e);
const US = [["A+", 97], ["A", 93], ["A-", 90], ["B+", 87], ["B", 83], ["B-", 80], ["C+", 77], ["C", 73], ["C-", 70], ["D+", 67], ["D", 63], ["D-", 60], ["F", 0]];

// 1. points lost
{
  const L = G.lost([{id: "q", title: "Quiz", cat: "Quiz", w: 10, pct: 70}, {id: "e", title: "Essay", cat: "Assignment", w: 20, pct: 80, pen: 10},
    {id: "m", title: "Missed", cat: "Reading", w: 5, missed: true}, {id: "d", title: "Dropped", cat: "Quiz", w: 10, pct: 20, dropped: true}, {id: "p", title: "Perfect", cat: "Lab", w: 5, pct: 100}]);
  ok(near(L.total, 3 + 4 + 5), "total lost: 3 on the quiz, 4 on the essay, 5 missed: " + L.total);
  ok(near(L.late, 2), "the late penalty's share: 10% of a 20% essay is 2 points");
  ok(near(L.missed, 5) && L.dropped === 1, "missed work and dropped marks are counted apart");
  ok(near(L.marked, 40) && near(L.earned, 28), "marked 40 (dropped left out), earned 28: " + L.marked + " " + L.earned);
  ok(L.slices.map(x => x.key).join() === "missed,Quiz,Assignment,late", "slices, biggest first: " + L.slices.map(x => x.key + x.pts).join());
  ok(near(L.slices.find(x => x.key === "Assignment").pts, 2), "the essay's own slice leaves out its late penalty");
  ok(L.items[0].id === "m" && !L.items.some(x => x.id === "p" || x.id === "d"), "full marks and dropped marks aren't listed");
  ok(G.lost([]).total === 0 && G.lost(null).slices.length === 0, "nothing marked, nothing lost");
  ok(near(G.lost([{id: "x", w: 10, pct: 120}]).total, 0), "a bonus mark over 100% loses nothing");
}

// 2. letter cutoffs
{
  let b = G.boundary(82.5, US);
  ok(b.letter === "B-" && near(b.above, 2.5) && b.up.letter === "B" && near(b.up.gap, 0.5), "82.5 is a B-, 0.5 from B");
  ok(G.boundary(98, US).up === null && G.boundary(98, US).letter === "A+", "top of the scale has no next letter");
  ok(G.boundary(10, US).letter === "F" && G.boundary(10, US).down === null, "an F has nothing below it");
  ok(G.boundary(null, US) === null && G.boundary(80, null) === null, "no grade or scale, no boundary");
  let e = G.edge(89.4, US, 1); ok(e && e.dir === "up" && e.letter === "A-" && near(e.gap, 0.6), "0.6 from A-");
  e = G.edge(80.7, US, 1); ok(e && e.dir === "down" && e.letter === "B-" && e.below === "C+" && near(e.gap, 0.7), "0.7 above the B- line");
  ok(G.edge(85, US, 1) === null, "in the middle of a letter, no edge");
  ok(G.edge(90, US, 1).dir === "down", "exactly on a cutoff is just above it");
  ok(G.edge(0.5, US, 1) === null, "F has no line to fall below");
}

// 8. class spread
{
  const sp = G.spread({lo: 20, lq: 30, median: 35, uq: 42, hi: 50, mean: 34}, 50, 88);
  ok(near(sp.med, 70) && near(sp.lo, 40) && near(sp.hi, 100) && near(sp.vs, 18) && sp.band === "top", "points out of 50 become percents; 88 is in the top quarter");
  ok(G.spread({mean: 70}, 100, 60).band === "lower" && G.spread({mean: 70}, 100, 75).band === "upper", "with only a mean, above or below it");
  ok(G.spread({median: 70, lq: 65, uq: 80}, 100, 60).band === "low", "under the lower quartile is the bottom quarter");
  ok(G.spread(null, 100, 50) === null && G.spread({lo: 1}, 100, 50) === null && G.spread({mean: 5}, 0, 50) === null, "nothing to compare with");
}

// random numbers repeat for a seed
{
  const a = G.rng(42), b = G.rng(42), xs = [a(), a(), a.normal()], ys = [b(), b(), b.normal()];
  ok(xs.join() === ys.join() && xs[0] >= 0 && xs[0] < 1, "same seed, same numbers");
  const r = G.rng(7), v = Array.from({length: 4000}, () => r.normal()), m = v.reduce((s, x) => s + x, 0) / v.length, sd = Math.sqrt(v.reduce((s, x) => s + (x - m) * (x - m), 0) / v.length);
  ok(Math.abs(m) < 0.06 && Math.abs(sd - 1) < 0.06, "normal draws: mean 0, spread 1: " + m.toFixed(3) + " " + sd.toFixed(3));
  ok(G.seedOf("c1") === G.seedOf("c1") && G.seedOf("c1") !== G.seedOf("c2"), "a course id makes a steady seed");
}

// 3. forecast
{
  const R = R0.norm({});
  const it = (id, cat, w, pct, z) => ({id, cat, w, fin: false, pct: pct == null ? null : pct, z: !!z});
  const items = [it("a", "Quiz", 10, 80), it("b", "Quiz", 10, 84), it("c", "Exam", 30, 78), it("d", "Quiz", 10, null), it("e", "Exam", 40, null)];
  const f = G.forecast(R0, items, R, 100, {seed: 1, runs: 3000, scale: US});
  ok(f && f.p10 < f.p50 && f.p50 < f.p90, "a range, low to high");
  ok(f.p50 > 76 && f.p50 < 82, "the middle sits near the average so far: " + f.p50.toFixed(2));
  ok(near(f.buckets.reduce((s, b) => s + b.p, 0), 1, 1e-9), "letter chances add up to 1");
  ok(f.top && ["C+", "B-", "C"].includes(f.top.letter), "most likely letter: " + f.top.letter);
  ok(f.at(0) === 1 && f.at(101) === 0 && f.at(70) > f.at(85), "the chance of reaching a line falls as the line goes up");
  ok(f.samples.length === 3000, "the runs are kept in order for the term GPA");
  const f2 = G.forecast(R0, items, R, 100, {seed: 1, runs: 3000, scale: US});
  ok(f2.p50 === f.p50, "same seed, same forecast");
  const fx = G.forecast(R0, items, R, 100, {seed: 1, runs: 1500, scale: US, fix: {e: 100}});
  ok(fx.p50 > f.p50 + 5, "full marks on the 40% final moves the forecast up a lot");
  ok(G.forecast(R0, items.slice(0, 2).concat(items.slice(3)), R, 100, {}) === null, "under 3 marks: too early");
  ok(G.forecast(R0, items.slice(0, 3), R, 100, {}) === null, "nothing left: no forecast");
  // a missed item stays 0 in every run
  const z = G.forecast(R0, [it("a", "Quiz", 20, 80), it("b", "Quiz", 20, 80), it("c", "Quiz", 20, 80), it("m", "Quiz", 20, null, true), it("o", "Quiz", 20, null)], R, 100, {seed: 3, runs: 2000});
  ok(z.p90 <= 80 + 1e-9, "missed work counts as 0: the best case is 80: " + z.p90.toFixed(2));
  // the spread never gets too small, even when every mark is the same
  const same = G.forecast(R0, [it("a", "Quiz", 10, 80), it("b", "Quiz", 10, 80), it("c", "Quiz", 10, 80), it("d", "Quiz", 70, null)], R, 100, {seed: 5, runs: 2000});
  ok(same.p90 - same.p10 > 8, "identical marks still leave room either way: " + (same.p90 - same.p10).toFixed(2));
  // drop rules are applied in each run
  const RD = R0.norm({drops: [{cat: "Quiz", n: 1}]});
  const dd = G.forecast(R0, [it("a", "Quiz", 10, 20), it("b", "Quiz", 10, 90), it("c", "Quiz", 10, 90), it("d", "Quiz", 10, null), it("x", "Exam", 60, 90)], RD, 100, {seed: 9, runs: 1000});
  ok(dd.p10 > 75, "the dropped 20% doesn't drag the forecast down: " + dd.p10.toFixed(2));
  const cs = G.catStats([it("a", "Quiz", 10, 90), it("b", "Quiz", 10, 70), it("c", "Exam", 10, 60)]);
  ok(cs.of("Exam").m > 60 && cs.of("Exam").m < cs.mAll + 1e-9 && cs.of("Exam").s >= 8 && cs.of("Lab").m === cs.mAll, "few marks lean on the overall average; exams vary at least 8");
}

// 4. Target GPA
{
  const o = (letter, pts, need) => ({letter, pts, need});
  const courses = [
    {id: "a", cr: 4, rem: 40, base: 82, opts: [o("A", 4, 99), o("B+", 3.3, 92), o("B", 3, 84), o("B-", 2.7, 76), o("C+", 2.3, 60), o("C", 2, 40)]},
    {id: "b", cr: 3, rem: 50, base: 88, opts: [o("A", 4, 98), o("A-", 3.7, 92), o("B+", 3.3, 86), o("B", 3, 78)]},
    {id: "c", cr: 3, rem: 0, base: 75, opts: [o("C", 2, null)]}];
  let r = G.gpaPlan(courses, 3.0);
  ok(r.ok && r.gpa >= 3 - 1e-9, "a plan that reaches 3.0: " + (r.gpa && r.gpa.toFixed(2)));
  ok(r.picks.find(p => p.id === "c").letter === "C" && r.picks.find(p => p.id === "c").fixed, "a finished course keeps its letter");
  const pa = r.picks.find(p => p.id === "a"), pb = r.picks.find(p => p.id === "b");
  ok(pa.need <= 100 && pb.need <= 100, "every pick is reachable");
  // brute force agrees: no cheaper combination reaches 3.0
  let best = Infinity;
  courses[0].opts.forEach(x => courses[1].opts.forEach(y => { const g = (4 * x.pts + 3 * y.pts + 3 * 2) / 10; if (g < 3 - 1e-9) return;
    const c = (cc, z) => z.need <= 0 ? 0 : cc.cr * cc.rem / 100 * Math.pow(Math.max(0, z.need - cc.base) / 10, 2) + cc.cr * cc.rem / 100 * z.need / 1e4; best = Math.min(best, c(courses[0], x) + c(courses[1], y)); }));
  ok(near(r.cost, best, 1e-9), "the cheapest plan: " + r.cost + " vs " + best);
  r = G.gpaPlan(courses, 3.95); ok(!r.ok && r.why === "reach" && near(r.max, (16 + 12 + 6) / 10), "out of reach says the most possible: " + r.max);
  r = G.gpaPlan(courses, 2.8, {a: "A"}); ok(r.ok && r.picks.find(p => p.id === "a").letter === "A", "a lock is kept");
  r = G.gpaPlan(courses, 2.8, {a: "Z"}); ok(!r.ok && r.why === "lock", "a lock that can't be reached is said");
  // secured letters: nothing lower is offered, and they cost nothing
  r = G.gpaPlan([{id: "s", cr: 3, rem: 30, base: 90, opts: [o("A", 4, 95), o("A-", 3.7, -5), o("B+", 3.3, -20)]}], 3.5);
  ok(r.ok && r.picks[0].letter === "A-" && r.cost === 0, "a secured A- is free and enough");
  ok(!G.gpaPlan([], 3).ok && !G.gpaPlan([{id: "x", cr: 0, opts: [o("A", 4, 50)]}], 3).ok, "no credits, no plan");
  ok(near(G.cumNeed({pastPts: 3 * 30, pastCr: 30, termGpa: 3.2, termCr: 15, target: 3.3, futureCr: 45}), (3.3 * 90 - 90 - 48) / 45), "cumulative: the GPA future credits need");
  ok(G.cumNeed({target: 3, futureCr: 0}) === null, "no future credits, no answer");
}

// 7. best next hour
{
  const r = G.roi([{id: "a", w: 40, hours: 10, m: 70}, {id: "b", w: 5, hours: 1, m: 95}, {id: "c", w: 20, hours: 4, m: 80, gapUp: 1}, {id: "z", w: 0, hours: 1, m: 50}]);
  ok(r.length === 3 && !r.some(x => x.id === "z"), "unweighted work is left out");
  ok(near(r.find(x => x.id === "a").lift, 13.5) && near(r.find(x => x.id === "b").lift, 2), "lift: half the room under 97, at least 2");
  ok(r.every((x, i) => !i || r[i - 1].perHour >= x.perHour - 1e-12), "ranked by course points per hour");
  ok(r.find(x => x.id === "c").cross === true && r.find(x => x.id === "a").cross === false, "notes work that could reach the next letter");
  ok(G.roi([{id: "q", w: 10, hours: 0.1, m: 80}])[0].h === 0.25, "a tiny job counts as at least 15 minutes");
  ok(G.roi([{id: "q", w: 10, m: 80}])[0].h === 1, "no estimate counts as an hour");
}

// 5. habits
{
  const mk = (pct, o) => Object.assign({pct, type: "Assignment"}, o);
  const marks = [88, 90, 86, 92, 85].map(p => mk(p, {lead: 5, min: 200, late: false, night: false})).concat([70, 74, 72, 68].map(p => mk(p, {lead: 0, min: 60, late: true, penPts: 0.5, night: true})));
  const H = G.habits(marks), k = H.map(h => h.key);
  ok(k.includes("lead") && k.includes("night") && k.includes("late") && k.includes("lateMark"), "finds starting early, late nights and lateness: " + k.join());
  const lead = H.find(h => h.key === "lead"); ok(near(lead.a, 88.2) && near(lead.b, 71) && lead.na === 5 && lead.nb === 4, "averages each side");
  ok(near(H.find(h => h.key === "late").cost, 2) && H.find(h => h.key === "late").n === 4, "adds up what late penalties cost");
  ok(H.find(h => h.key === "time") && H.find(h => h.key === "time").type === "Assignment", "time on a type, with 8+ marks");
  ok(H.every((h, i) => !i || H[i - 1].w >= h.w), "strongest first");
  ok(G.habits(marks.slice(0, 7)).every(h => h.key !== "lead"), "under 4 marks on a side, no finding");
  ok(G.habits([88, 87, 86, 85, 84, 83, 82, 81].map((p, i) => mk(p, {lead: i < 4 ? 5 : 0}))).every(h => h.key !== "lead"), "a gap under 5 points isn't a finding");
  const rd = G.habits([mk(80, {ready: 82}), mk(70, {ready: 73}), mk(90, {ready: 88})]).find(h => h.key === "ready");
  ok(rd && rd.err <= 8, "practice scores that predict marks well are said");
  const hi = G.habits([mk(60, {ready: 80}), mk(65, {ready: 82}), mk(70, {ready: 90})]).find(h => h.key === "ready");
  ok(hi && hi.bias > 8, "practice scores well above marks are said");
  ok(G.habits([]).length === 0 && G.habits(null).length === 0, "no marks, no findings");
}

// 6. timeline
{
  const w = G.weeks("2026-09-02", "2026-10-01");
  ok(w[0] === "2026-09-06" && w[w.length - 1] === "2026-10-01" && w.length === 5, "Sundays, then the end day: " + w.join());
  ok(G.weeks("2026-09-06", "2026-09-06").join() === "2026-09-06", "one day is one point");
  ok(G.weeks("bad", "2026-01-01").length === 0 && G.weeks("2026-02-01", "2026-01-01").length === 0, "bad ranges give nothing");
  const mv = G.moves([{key: "a", v: 80}, {key: "b", v: null}, {key: "c", v: 76}, {key: "d", v: 77}]);
  ok(near(mv.last, 1) && mv.big.key === "c" && near(mv.big.d, -4), "last week's change and the biggest move: " + JSON.stringify(mv));
  ok(G.moves([{key: "a", v: 80}]).last === null, "one point has no change");
}

console.log("grade-insights: " + n + " checks passed");
