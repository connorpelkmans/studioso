// Unit tests for the grade trend math and the Study Groups card rule (pure logic extracted from index.html).  Run: node tests/gradetrend.test.js
const fs = require("fs"), path = require("path"), assert = require("assert");
const s = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const cut = (a, b) => s.slice(s.indexOf(a), s.indexOf(b));
const G = new Function(cut("/*TREND-START*/", "/*TREND-END*/") + ";return GTREND;")();
const showCard = new Function(cut("/*NUDGE-START*/", "/*NUDGE-END*/") + ";return showCard;")();
let n = 0; const ok = (c, m) => { n++; assert(c, m); };

// A stand-in for the app's courseGrade(c, ids).current: weighted average of the marks in ids (the app passes its own math in)
const W = {a: [10, 80], b: [20, 90], c: [20, 70], d: [10, 70]};   // id -> [weight, percent]
const running = ids => { let w = 0, e = 0; ids.forEach(id => { w += W[id][0]; e += W[id][0] * W[id][1]; }); return w ? e / w : null; };
const it = (id, key, seq) => ({id, title: id, key, seq});

// ordering: dated by date, undated last, ties by seq then id
{
  const o = G.order([it("x", "", 1), it("b", "2026-10-05", 2), it("a", "2026-10-01", 9), it("c", "2026-10-05", 1)]);
  ok(o.map(i => i.id).join("") === "acbx", "order: " + o.map(i => i.id).join(""));
  ok(G.order([]).length === 0, "empty order");
}

// running grade after each item
{
  const p = G.points([it("a", "2026-09-01", 1), it("b", "2026-09-10", 2), it("c", "2026-09-20", 3), it("d", "2026-09-25", 4)], running);
  ok(p.length === 4, "four points");
  ok(Math.abs(p[0].pct - 80) < 1e-9 && Math.abs(p[1].pct - (10 * 80 + 20 * 90) / 30) < 1e-9, "weighted running grade");
  ok(Math.abs(p[3].pct - (800 + 1800 + 1400 + 700) / 60) < 1e-9, "last point equals the course grade: " + p[3].pct);
  const given = []; G.points([it("a", "2026-09-01", 1), it("b", "2026-09-10", 2)], ids => { given.push([...ids].join("")); return 50; });
  ok(given.join("|") === "a|ab", "each step counts only the marks so far: " + given.join("|"));
  ok(G.points([it("a", "", 1)], () => null).length === 0, "items with no grade yet are skipped");
}

// summary: neutral, whole points, last 4 grades
{
  const P = (...v) => v.map(pct => ({pct}));
  ok(G.summary(P(70)) === null && G.summary([]) === null && G.summary(null) === null, "needs two grades");
  let r = G.summary(P(60, 70, 71, 73, 74)); ok(r.dir === "up" && r.n === 4 && r.pts === 4, "last 4 only: up 70->74: " + JSON.stringify(r));
  r = G.summary(P(80, 78)); ok(r.dir === "down" && r.pts === 2 && r.n === 2, "down 2 over 2 grades");
  r = G.summary(P(75, 75.3, 74.8)); ok(r.dir === "flat" && r.pts === 0, "tiny wobble is steady");
  r = G.summary(P(70, 72.5)); ok(r.pts === 3 && r.dir === "up", "2.5 rounds to 3");
  r = G.summary(P(90, 80, 70, 60, 50), 3); ok(r.n === 3 && r.pts === 20, "custom window");
}

// chart range
{
  let d = G.domain([72, 78]); ok(d.lo === 65 && d.hi === 85, "padded to fives: " + JSON.stringify(d));
  d = G.domain([99, 100]); ok(d.hi === 100 && d.hi - d.lo >= 10, "stays under 100: " + JSON.stringify(d));
  d = G.domain([0, 2]); ok(d.lo === 0 && d.hi >= 10, "stays above 0");
  d = G.domain([50, 50, 80]); ok(d.lo === 45 && d.hi === 85, "goal line is part of the range");
  d = G.domain([]); ok(d.lo === 0 && d.hi === 100, "no values");
  const box = {l: 10, t: 5, w: 100, h: 50}, dom = {lo: 0, hi: 100};
  const a = G.xy(0, 3, 100, dom, box), b = G.xy(2, 3, 0, dom, box), m = G.xy(1, 3, 50, dom, box);
  ok(a.x === 10 && a.y === 5 && b.x === 110 && b.y === 55 && m.x === 60 && m.y === 30, "xy corners and middle");
  ok(G.xy(0, 1, 40, dom, box).x === 10, "single point sits at the left edge");
}

// the Study Groups card
{
  const now = 1e12, base = {now, tasks: 5, groups: 0, banner: false, unavailable: false};
  ok(showCard({}, base) === true, "shows with tasks and no groups");
  ok(showCard(null, base) === true, "no saved state");
  ok(showCard({}, Object.assign({}, base, {tasks: 2})) === false, "waits for a few tasks");
  ok(showCard({}, Object.assign({}, base, {groups: 1})) === false, "hidden when in a group");
  ok(showCard({}, Object.assign({}, base, {groups: null})) === false, "hidden while the group count is unknown");
  ok(showCard({}, Object.assign({}, base, {banner: true})) === false, "yields to the rough week banner");
  ok(showCard({}, Object.assign({}, base, {unavailable: true})) === false, "hidden where sharing isn't available");
  ok(showCard({never: true}, base) === false, "don't show again");
  ok(showCard({snooze: now + 1000}, base) === false && showCard({snooze: now - 1}, base) === true, "not now snoozes, then returns");
}
console.log(`gradetrend: ${n} checks passed`);
