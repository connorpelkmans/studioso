// node tests/lecture-chain.test.js
const fs = require("fs"), path = require("path"), assert = require("assert");
const src = require("../scripts/app-files").source();
const a = src.indexOf("/*LECCHAIN-START*/"), b = src.indexOf("/*LECCHAIN-END*/");
assert(a > 0 && b > a, "the LECCHAIN block is in index.html");
const L = new Function(src.slice(a, b) + "; return LECCHAIN;")();
let n = 0; const t = (name, fn) => { fn(); n++; console.log("ok -", name); };
const lec = ["2026-09-08", "2026-09-10", "2026-09-15", "2026-09-17", "2026-09-22", "2026-10-06", "2026-10-08", "2026-10-20"];

t("by default: from the previous exam up to this one", () => {
  assert.deepStrictEqual(L.coverage({due: "2026-10-14", prev: "2026-09-24", notes: "", lectureDates: lec}), {from: "2026-09-24", to: "2026-10-14", why: "since"});
  const c = L.coverage({due: "2026-10-14", prev: "", notes: "", lectureDates: lec});
  assert.strictEqual(c.from, ""); assert.strictEqual(c.to, "2026-10-14");
});
t("the exam day and later lectures are not covered", () => {
  const c = L.coverage({due: "2026-10-14", prev: "2026-09-24", lectureDates: lec});
  assert(L.inRange("2026-10-08", c)); assert(L.inRange("2026-09-24", c));
  assert(!L.inRange("2026-10-14", c)); assert(!L.inRange("2026-10-20", c)); assert(!L.inRange("2026-09-22", c)); assert(!L.inRange("", c));
});
t("cumulative covers everything before the exam", () => assert.deepStrictEqual(L.coverage({due: "2026-12-10", prev: "2026-10-14", notes: "Final exam, cumulative.", lectureDates: lec}), {from: "", to: "2026-12-10", why: "all"}));
t("weeks named in the notes, week 1 from the first lecture's Monday", () => {
  const c = L.coverage({due: "2026-10-14", prev: "", notes: "Covers weeks 2-3", lectureDates: lec});
  assert.deepStrictEqual(c, {from: "2026-09-14", to: "2026-09-28", why: "weeks"});
  assert(L.inRange("2026-09-22", c) && !L.inRange("2026-09-10", c) && !L.inRange("2026-10-06", c));
});
t("lectures by number", () => assert.deepStrictEqual(L.coverage({due: "2026-10-14", notes: "Lectures 3 to 5", lectureDates: lec}), {from: "2026-09-15", to: "2026-10-06", why: "lectures"}));
t("dates named in the notes", () => {
  assert.deepStrictEqual(L.coverage({due: "2026-10-14", notes: "Material from Sept 15 to Oct 6", lectureDates: lec}), {from: "2026-09-15", to: "2026-10-07", why: "dates"});
  assert.deepStrictEqual(L.coverage({due: "2026-10-14", prev: "2026-09-01", notes: "Everything since Oct 6", lectureDates: lec}), {from: "2026-10-06", to: "2026-10-14", why: "dates"});
  assert.deepStrictEqual(L.coverage({due: "2026-10-14", prev: "2026-09-12", notes: "up to 2026-09-22", lectureDates: lec}), {from: "2026-09-12", to: "2026-09-23", why: "dates"});
  assert.strictEqual(L.datesIn("Jan 3", "2026-02-01")[0].d, "2026-01-03");
  assert.strictEqual(L.datesIn("Dec 3", "2026-02-01")[0].d, "2025-12-03");
});
t("no exam date: nothing is covered", () => assert(!L.inRange("2026-10-01", L.coverage({due: ""}))));
t("origins: one per source, newest first, at most 20", () => {
  let o = [];
  for (let i = 0; i < 25; i++) o = L.addOrigin(o, {k: "lecture", id: "f" + i, at: "2026-10-01"});
  assert.strictEqual(o.length, 20); assert.strictEqual(o[0].id, "f24");
  o = L.addOrigin(o, {k: "lecture", id: "f10", at: "2026-10-02"});
  assert.strictEqual(o.length, 20); assert.strictEqual(o[0].id, "f10"); assert.strictEqual(o.filter(x => x.id === "f10").length, 1);
  assert.deepStrictEqual(Object.keys(o[0]), ["k", "id", "at"]);
});
t("count label", () => {
  assert.strictEqual(L.countLabel([{k: "lecture"}, {k: "lecture"}, {k: "lecture"}], 86), "3 lectures (86 cards)");
  assert.strictEqual(L.countLabel([{k: "lecture"}, {k: "note"}], 1), "1 lecture and 1 note (1 card)");
});
console.log(`lecture-chain: ${n} checks passed`);
