// Unit tests for grading rules (drop the lowest, bonus), GPA math, and finding rules in a syllabus
const assert = require("assert");
const s = require("../scripts/app-files").source();
const cut = (a, b) => { const i = s.indexOf(a), j = s.indexOf(b); assert(i >= 0 && j > i, "markers " + a); return s.slice(i, j); };
const G = new Function(cut("/*GRULES-START*/", "/*GRULES-END*/") + ";return GRULES;")();
const find = new Function(cut("/*SYRULES-START*/", "/*SYRULES-END*/") + ";return gradeRules;")();
let n = 0; const ok = (c, m) => { n++; assert(c, m); };
const near = (a, b, e = 1e-6) => Math.abs(a - b) < e;
const it = (id, w, cat, pct, fin) => ({id, w, cat, pct: pct == null ? null : pct, fin: !!fin});

// Reading rules: bad entries are left out, one rule per type, earned bonus can't pass the available bonus
{
  const R = G.norm({drops: [{cat: "Quiz", n: 2}, {cat: "Quiz", n: 1}, {cat: "Nope", n: 1}, {cat: "Lab", n: 0}, {cat: "Lab", n: "1", src: "syllabus"}], bonus: {pts: 2, got: 3}});
  ok(R.drops.length === 2 && R.drops[0].cat === "Quiz" && R.drops[0].n === 2 && R.drops[1].src === "syllabus", "norm keeps the first rule per type: " + JSON.stringify(R.drops));
  ok(R.bonus.pts === 3 && R.bonus.got === 3, "earned bonus raises the available bonus");
  const E = G.norm(null); ok(!E.drops.length && E.bonus.pts === 0 && E.bonus.got === 0, "no rules");
  ok(!G.active([it("a", 10, "Quiz", 50)], E), "nothing to apply");
}

// Four 5% quizzes, lowest dropped, and an 80% exam
{
  const R = G.norm({drops: [{cat: "Quiz", n: 1}]});
  const items = [it("q1", 5, "Quiz", 50), it("q2", 5, "Quiz", 80), it("q3", 5, "Quiz", 90), it("q4", 5, "Quiz"), it("ex", 80, "Exam")];
  ok(G.active(items, R), "rule applies with more quizzes than it drops");
  const cu = G.current(items, R);
  ok(near(cu.pct, 85) && cu.out.has("q1") && cu.out.size === 1, "current drops the lowest marked quiz: " + cu.pct);
  ok(near(G.finalWith(items, R, 100, 100), 18 + 80), "full marks on the rest: quizzes keep 80, 90, 100: " + G.finalWith(items, R, 100, 100));
  ok(near(G.finalWith(items, R, 100, 0), (50 + 80 + 90) / 3 * 0.2), "zeros on the rest: the zero quiz is the one dropped");
  const nd = G.need(items, R, 100, 70);
  ok(nd > 0 && nd < 100 && near(G.finalWith(items, R, 100, nd), 70, 1e-4), "need solves for the target: " + nd);
  ok(G.need(items, R, 100, 10) === 0, "a target already secured needs 0");
  ok(G.need(items, R, 100, 99) > 100, "a target out of reach needs more than 100");
  const done = items.map(x => Object.assign({}, x, {pct: x.pct == null ? 70 : x.pct}));
  ok(G.need(done, R, 100, 50) === null, "nothing left to mark: no need");
  ok(near(G.finalWith(done, R, 100, 0), G.current(done, R).pct), "with everything marked the final equals the current grade");
}

// One mark so far keeps it, even with a drop rule
{
  const R = G.norm({drops: [{cat: "Quiz", n: 2}]});
  const cu = G.current([it("a", 2, "Quiz", 40), it("b", 2, "Quiz"), it("c", 2, "Quiz"), it("d", 2, "Quiz")], R);
  ok(near(cu.pct, 40) && cu.out.size === 0, "the only mark isn't dropped");
}

// A rule with as many drops as items doesn't apply
{
  const R = G.norm({drops: [{cat: "Lab", n: 2}]});
  ok(!G.active([it("a", 10, "Lab", 50), it("b", 10, "Lab", 60)], R), "two labs, drop two: no rule");
}

// Exam drops never drop the final
{
  const R = G.norm({drops: [{cat: "Exam", n: 1}]});
  const items = [it("m1", 20, "Exam", 60), it("m2", 20, "Exam", 90), it("f", 60, "Exam", 40, true)];
  const cu = G.current(items, R);
  ok(cu.out.has("m1") && !cu.out.has("f"), "the low midterm drops, not the lower final");
  ok(near(G.finalWith(items, R, 100, 0), 0.4 * 90 + 0.6 * 40), "the kept midterm carries both midterms' weight");
}

// Bonus points
{
  const R = G.norm({bonus: {pts: 3, got: 1}});
  const items = [it("a", 50, "Assignment", 80), it("b", 50, "Exam")];
  ok(G.active(items, R), "a bonus makes the rules apply");
  ok(near(G.finalWith(items, R, 100, 60), 40 + 30 + 1), "earned bonus is added to the final");
  ok(near(G.need(items, R, 100, 71), 60, 1e-4), "earned bonus lowers what's needed: " + G.need(items, R, 100, 71));
  ok(near(G.current(items, R).pct, 80), "bonus isn't added to the grade on marked work");
}

// GPA points
{
  const P = (l, m) => G.points(l, m || 4);
  ok(P("A") === 4 && P("A-") === 3.7 && P("B+") === 3.3 && P("B") === 3 && P("C-") === 1.7 && P("D+") === 1.3 && P("D-") === 0.7, "letters to points");
  ok(P("A+") === 4 && P("A+", 4.3) === 4.3, "A+ is 4.0 or 4.3");
  ok(P("F") === 0 && P("E") === 0 && P("f") === 0, "failing letters are 0");
  ok(P("1ST") === null && P("2:1") === null && P("") === null && P(null) === null, "other scales have no GPA points");
}

// Credit-weighted averages
{
  ok(near(G.avg([{v: 4, cr: 3}, {v: 2, cr: 1}]), 3.5), "weighted by credits");
  ok(near(G.avg([{v: 4, cr: 3}, {v: 2, cr: 0}]), 4), "0 credits leaves a course out");
  ok(near(G.avg([{v: 4, cr: 3}, {v: 2, cr: null}], 3), 3), "no credits counts as the typical credits");
  ok(near(G.avg([{v: 80}, {v: 60}]), 70), "no credits anywhere: a plain average");
  ok(G.avg([]) === null && G.avg([{v: null, cr: 3}]) === null, "nothing to average");
  ok(G.typical([3, 3, 4]) === 3 && G.typical([3, 4]) === 3.5 && G.typical([null, ""]) === 1, "typical credits are the middle value");
}

// Finding rules in a syllabus
{
  const q = t => JSON.stringify(find(t));
  let r = find("Grading\nQuizzes 20% (10 quizzes, lowest 2 dropped)\nMidterm 30%\nFinal 50%");
  ok(r && r.drops.length === 1 && r.drops[0].cat === "Quiz" && r.drops[0].n === 2 && !r.bonus, "breakdown line: " + q("Quizzes 20% (10 quizzes, lowest 2 dropped)"));
  r = find("Your lowest homework score will be dropped at the end of the term.");
  ok(r && r.drops[0].cat === "Assignment" && r.drops[0].n === 1, "lowest homework dropped");
  r = find("We will drop the two lowest lab reports.");
  ok(r && r.drops[0].cat === "Lab" && r.drops[0].n === 2, "two lowest labs");
  r = find("Your lowest quiz grade will be dropped, and homework counts for 20% of your grade.");
  ok(r && r.drops.length === 1 && r.drops[0].cat === "Quiz", "only the type next to 'lowest': " + JSON.stringify(r));
  ok(find("The final exam score can replace your lowest midterm score.") === null, "replacement policies aren't drops");
  ok(find("The add/drop deadline is September 10. Students with the lowest attendance should see me.") === null, "add/drop isn't a rule");
  r = find("Extra credit: up to 2% added to your final grade for research participation.");
  ok(r && r.bonus && r.bonus.pts === 2 && !r.drops.length, "extra credit on the final grade");
  r = find("Grading\nParticipation 10%\nBonus 3%");
  ok(r && r.bonus && r.bonus.pts === 3, "a bonus line in the breakdown");
  ok(find("Each midterm has a bonus question worth 5% of that exam.") === null, "a bonus inside one exam isn't a course bonus");
  r = find("Homework 20%, Quizzes 10% (lowest dropped)");
  ok(r && r.drops.length === 1 && r.drops[0].cat === "Quiz" && r.drops[0].n === 1, "the closest type wins: " + JSON.stringify(r));
  r = find("Your lowest quiz and your two lowest homework scores are dropped.");
  ok(r && r.drops.length === 2 && r.drops.find(d => d.cat === "Quiz").n === 1 && r.drops.find(d => d.cat === "Assignment").n === 2, "two rules in one sentence: " + JSON.stringify(r));
  r = find("At the end of term your lowest\nlab score is dropped.");
  ok(r && r.drops[0].cat === "Lab", "a sentence that wraps onto the next line");
  ok(find("Homework 30%\nMidterm 30%\nFinal 40%") === null, "no rules");
}

console.log("graderules.test: " + n + " checks passed");
