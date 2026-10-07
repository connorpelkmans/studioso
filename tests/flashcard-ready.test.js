// Unit tests for a deck's Prepared bar (pure code between /*DR-START*/ and /*DR-END*/ in index.html).  Run: node tests/flashcard-ready.test.js
const fs = require("fs"), path = require("path"), assert = require("assert");
const s = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const DR = new Function(s.slice(s.indexOf("/*DR-START*/"), s.indexOf("/*DR-END*/")) + ";return DR;")();
let n = 0; const ok = (c, m) => { n++; assert(c, m); };
const T = "2026-10-10", day = k => new Date(Date.UTC(2026, 9, 10 + k)).toISOString().slice(0, 10);
const card = o => Object.assign({box: 0, due: "", seen: 0, right: 0, wrong: 0}, o);
const rev = (box, ago, extra) => card(Object.assign({seen: 4, right: 3, wrong: 1, box, last: day(-ago), due: day(-ago + [1, 1, 3, 7, 14, 30][box]), rate: "good"}, extra));

ok(DR.deck([], T) === 0, "an empty deck is 0");
ok(DR.deck([card(), card()], T) === 0, "cards never reviewed count for nothing");
const fresh = DR.deck([rev(4, 1), rev(4, 1), rev(4, 1)], T);
ok(fresh >= 70, "reviewed yesterday and known well: high (" + fresh + ")");
ok(DR.deck([rev(4, 1), rev(4, 1), card()], T) < fresh, "one card never reviewed pulls the whole deck down");
ok(DR.deck([rev(4, 1), rev(4, 1), rev(4, 1), card()], T) > DR.deck([rev(4, 1), card(), card(), card()], T), "more of the deck reviewed is higher");
// time: it goes down when you stop reviewing
const a = DR.deck([rev(4, 1)], T), b = DR.deck([rev(4, 30)], T), c = DR.deck([rev(4, 90)], T);
ok(a > b && b > c, `fades with time: ${a} > ${b} > ${c}`);
ok(DR.deck([rev(4, 10)], T) === DR.deck([rev(4, 14)], T), "no fade while still inside its review interval");
ok(c > 0, "never fades to nothing");
// how it felt
ok(DR.deck([rev(3, 1, {rate: "again", box: 0})], T) < DR.deck([rev(3, 1, {rate: "good"})], T), "marking a card as not known drops it");
ok(DR.deck([rev(3, 1, {rate: "hard"})], T) < DR.deck([rev(3, 1, {rate: "good"})], T), "hard is lower than good");
ok(DR.deck([rev(5, 1)], T) > DR.deck([rev(2, 1)], T), "a higher box (rated good again and again) is higher");
ok(DR.deck([rev(3, 1, {right: 9, wrong: 1, seen: 10})], T) > DR.deck([rev(3, 1, {right: 1, wrong: 9, seen: 10})], T), "mostly right beats mostly wrong");
// going up: reviewing and rating well
let k = card({seen: 1, right: 1, box: 1, last: day(-1), rate: "good", due: day(0)}); const before = DR.card(k, T);
k = Object.assign({}, k, {seen: 2, right: 2, box: 2, last: T, rate: "good", due: day(3)}); ok(DR.card(k, T) > before, "a good review today raises the card");
// cards from before this was recorded fall back on the due date
ok(DR.card(card({seen: 3, right: 3, box: 3, due: day(5)}), T) > DR.card(card({seen: 3, right: 3, box: 3, due: day(-60)}), T), "an old card with no record is judged by its due date");
ok(DR.card(card({seen: 3, right: 3, box: 3}), T) < DR.card(card({seen: 3, right: 3, box: 3, due: day(5)}), T), "no date at all counts as not touched for a while");
const all = [rev(5, 0, {seen: 12, right: 12, wrong: 0}), rev(5, 0, {seen: 12, right: 12, wrong: 0})]; ok(DR.deck(all, T) <= 100 && DR.deck(all, T) >= 90, "fully known and fresh is near 100");
console.log(`flashcard-ready.test: ${n} checks passed`);
