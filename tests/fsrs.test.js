// Unit tests for Smart scheduling (FSRS-4.5, the pure block between /*FSRS-START*/ and /*FSRS-END*/ in index.html).  Run: node tests/fsrs.test.js
const fs = require("fs"), path = require("path"), assert = require("assert");
const s = require("../scripts/app-files").source();
const F = new Function(s.slice(s.indexOf("/*FSRS-START*/"), s.indexOf("/*FSRS-END*/")) + ";return FSRS;")();
let n = 0; const ok = (c, m) => { n++; assert(c, m); };
const W = F.W;

// a new card: the first stability is the rating's own weight, difficulty from the rating
let a = F.next(null, "good", 0);
ok(a.s === W[2] && Math.abs(a.d - W[4]) < 1e-9, "first Good: stability w2, difficulty w4");
ok(F.next(null, "again", 0).s === W[0] && F.next(null, "easy", 0).s === W[3], "first Again and Easy take w0 and w3");
ok(F.next(null, "easy", 0).d < F.next(null, "hard", 0).d, "Easy starts easier than Hard");

// at 90% retention the interval equals the stability (that's how FSRS defines it)
ok(F.interval(10, 0.9) === 10 && F.interval(3.7145, 0.9) === 4, "interval = stability at 90%");
ok(F.interval(10, 0.95) < 10 && F.interval(10, 0.85) > 10, "asking to remember more means sooner reviews");
ok(F.interval(0.01, 0.9) === 1, "never less than a day");

// reviewing on time
const on = F.next(a, "good", F.interval(a.s, 0.9)), hard = F.next(a, "hard", 4), easy = F.next(a, "easy", 4), again = F.next(a, "again", 4);
ok(on.s > a.s * 2, "Good on time more than doubles stability (" + a.s + " -> " + on.s + ")");
ok(easy.s > on.s && hard.s < on.s && hard.s > a.s, "Easy > Good > Hard > before");
ok(again.s < a.s, "Again lowers stability");
ok(again.d > a.d && easy.d < a.d, "Again makes the card harder, Easy easier");
for (let i = 0, x = a; i < 30; i++) { x = F.next(x, "again", 1); ok(x.d <= 10 && x.d >= 1 && x.s > 0, "difficulty stays 1..10"); if (i === 29) ok(x.d > 9, "many Agains approach the hardest"); }

// reviewing early gives a smaller boost than on time (the card was still well remembered)
ok(F.next(on, "good", 1).s < F.next(on, "good", F.interval(on.s, 0.9)).s, "a review long before it's due counts for less");

// days and boxes
ok(F.days(on, "again", 0.9) === 0, "Again is due today");
ok([0, 1, 2, 3, 5, 9, 15, 25, 400].map(F.boxFor).join() === "0,1,2,2,3,4,4,5,5", "boxes follow the interval");

// cards reviewed before Smart was on get a starting state from their box
ok(F.seed({seen: 0}) === null, "a new card has no state");
const sd = F.seed({seen: 6, right: 6, box: 4}), sw = F.seed({seen: 6, right: 1, box: 1});
ok(sd.s === 14 && sw.s === 1.2 && sd.d < sw.d, "seeded from the box, easier when usually right");
ok(F.seed({seen: 3, box: 2, fs: {s: 9, d: 4}}).s === 9, "a card's own state wins");
console.log(`fsrs.test: ${n} checks passed`);
