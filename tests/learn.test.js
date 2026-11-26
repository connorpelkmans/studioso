// Learn (97-learn.js): rounds of 7, New -> Familiar (picked right) -> Mastered (typed right), misses step back and come
// back later in the round, wrong options without repeats, typo tolerance, and a session kept between visits.
const assert = require("assert");
const s = require("../scripts/app-files").source();
let n = 0; const ok = (c, m) => { n++; assert(c, m); };
const between = (a, b) => { const i = s.indexOf(a), j = s.indexOf(b, i); assert(i >= 0 && j > i, "marker " + a); return s.slice(i + a.length, j); };
const L = new Function(between("/*LEARN-START*/", "/*LEARN-END*/") + ";return LEARN;")();
// a seeded random, so every run is the same
const seeded = k => () => { k = (k * 16807) % 2147483647; return (k - 1) / 2147483646; };
const card = (id, front, back, x) => Object.assign({id, front, back, box: 0, seen: 0}, x || {});
const DECK = [
  card("a", "Osmosis", "Water moving across a membrane"), card("b", "Niche", "A species' role"), card("c", "Biome", "Large climate region"),
  card("d", "Producer", "Makes its own food"), card("e", "Detritivore", "Eats dead matter"), card("f", "Keystone species", "Others depend on it"),
  card("g", "Mitochondria", "Powerhouse of the cell"), card("h", "Ribosome", "Makes protein"), card("i", "Nucleus", "Holds DNA"),
  card("p", "Name the hidden label", "Aorta", {img: {k: "a:x", w: 10, h: 10}}), card("q", "Hidden", "", {img: {k: "a:x", w: 10, h: 10, nl: 1}}),
  card("m", "Kinetic energy", "$\\frac{1}{2}mv^2$"), card("x", "Draft", "Back", {draft: true}), card("y", "", "No front")];
const byId = Object.fromEntries(DECK.map(c => [c.id, c]));

/* Which cards, and how */
const use = L.usable(DECK).map(c => c.id);
ok(use.join() === "a,b,c,d,e,f,g,h,i,p,m", "drafts, cards missing a side and picture cards with no typed label are left out: " + use);
ok(L.kindOf(byId.a) === "type" && L.kindOf(byId.p) === "pic" && L.kindOf(byId.m) === "pick", "text cards are typed later; picture and math answers are picked only");
ok(L.typeFor(byId.a, 0) === "mc" && L.typeFor(byId.a, 1) === "type" && L.typeFor(byId.p, 1) === "mc" && L.typeFor(byId.m, 1) === "mc", "New is multiple choice, Familiar is typed (picture and math cards stay multiple choice)");

/* Typo tolerance */
const right = (g, e) => L.check(g, e).ok;
ok(right("Mitochondria", "mitochondria") && right("  MITOCHONDRIA ", "Mitochondria"), "case and spaces don't count");
ok(right("cafe", "Café") && right("Eriksson", "Erikssön"), "accents don't count");
ok(L.check("mitocondria", "Mitochondria").ok && L.check("mitocondria", "Mitochondria").close, "one letter off on a long word is right, marked close");
ok(right("holds th dna", "Holds the DNA") && right("HOLDS TH DNA", "Holds the DNA"), "a typo in a little word is still a small typo");
ok(!right("mitoxxxxdria", "Mitochondria"), "more than a small typo is a miss");
ok(!right("cat", "car") && !right("ab", "ac"), "short answers must be exact");
ok(!right("1946", "1945") && !right("123457", "123456") && right("1945", "1945."), "numbers must be exact");
ok(right("Powerhouse of cell", "Powerhouse of the cell") && right("the nucleus", "Nucleus"), "the, a and an don't count");
ok(right("ATP", "ATP (adenosine triphosphate)") && right("ATP synthase", "ATP synthase; F0F1") && right("F0F1", "ATP synthase; F0F1") && right("lion", "lion/tiger"), "either part of A; B or A/B, and an answer without its brackets");
ok(!right("1", "1/2") && right("1/2", "1/2"), "a fraction isn't split");
ok(!right("", "Nucleus") && !right("   ", "Nucleus"), "an empty answer is a miss");
ok(right("membrane water moving across", "Water moving across a membrane"), "the key words of a longer answer, in any order, count");
ok(!right("water", "Water moving across a membrane"), "one word of a long answer isn't enough");

/* Wrong options */
for (let k = 1; k < 30; k++) {
  const r = seeded(k), ch = L.choices(byId.a, DECK, r), texts = ch.opts.map(o => L.plain(o.text));
  ok(ch.opts.length === 4 && new Set(texts).size === 4 && ch.opts[ch.right].id === "a", "4 options, no repeats, the right one marked (" + k + ")");
}
const dup = [card("1", "One", "Same"), card("2", "Two", "same"), card("3", "Three", "SAME!"), card("4", "Four", "Other"), card("5", "Five", "Third")];
let ch = L.choices(dup[0], dup, seeded(3));
ok(ch.opts.length === 3 && new Set(ch.opts.map(o => L.plain(o.text))).size === 3 && ch.opts.filter(o => L.plain(o.text) === "same").length === 1, "answers that only differ in case or marks count once, so fewer than 4 options: " + JSON.stringify(ch.opts));
ch = L.choices(dup[3], dup.slice(0, 4), seeded(5));
ok(ch.opts.length === 2 && ch.opts[ch.right].text === "Other", "two different answers in the deck: two options");
ok(!L.distractors(byId.a, DECK, seeded(2)).some(o => ["x", "y", "q", "a"].includes(o.id)), "wrong options never come from drafts, empty cards or the card itself");
ok(L.distractors(byId.a, DECK, seeded(2), 20).length === 10, "at most every other usable answer");

/* A whole session, answering everything right */
let S = L.create(DECK, {deckId: "d1"}, seeded(7));
ok(S.order.length === 11 && L.counts(S).fresh === 11 && !S.count, "a session starts with every usable card New, Count toward review off");
let r1 = L.startRound(S, seeded(1));
ok(r1.ids.length === 7 && r1.n === 1 && r1.ids.every(id => S.order.slice(0, 7).includes(id)), "round 1 has 7 cards");
const pickRight = () => { const q = L.question(S, byId, seeded(9)); return L.answer(S, byId, q.type === "mc" ? {pick: q.right} : {text: byId[q.id].back}); };
let q = L.question(S, byId, seeded(9));
ok(q.type === "mc" && q.opts.length === 4 && L.question(S, byId, seeded(10)) === q, "a New card is asked as multiple choice, and the question stays the same until answered");
let fb = L.answer(S, byId, {pick: q.right});
ok(fb.ok && fb.from === 0 && fb.to === 1 && S.items[q.id].lv === 1 && L.counts(S).familiar === 1, "picked right: New to Familiar");
ok(L.answer(S, byId, {pick: 0}) === null, "no second answer while the feedback shows");
L.next(S);
for (let k = 0; k < 6; k++) { pickRight(); L.next(S); }
ok(L.roundOver(S) && L.counts(S).familiar === 7, "after 7 right picks the round is over, 7 Familiar");
L.startRound(S, seeded(2));
const firstT = S.round.ids.find(id => L.kindOf(byId[id]) === "type");
q = L.question(S, byId, seeded(3));
ok(S.round.ids.length === 7 && S.round.ids.every(id => S.items[id].lv === 1), "round 2 asks the same 7 again (they aren't mastered yet)");
if (q.type === "type") { fb = L.answer(S, byId, {text: byId[q.id].back.toUpperCase()}); ok(fb.ok && fb.to === 2 && fb.mastered, "Familiar typed right: Mastered"); L.next(S); }
while (!L.roundOver(S)) { pickRight(); L.next(S); }
ok(L.counts(S).mastered === 7 && L.counts(S).fresh === 4, "7 mastered, the other 4 still New");
L.startRound(S, seeded(4));
ok(S.round.ids.length === 4 && S.round.ids.every(id => S.items[id].lv === 0), "the next round takes the cards left");
let guard = 0;
while (!L.done(S) && guard++ < 50) { if (L.roundOver(S)) L.startRound(S, seeded(guard)); pickRight(); L.next(S); }
ok(L.done(S) && L.counts(S).mastered === 11, "all mastered: the session is done");
let sum = L.summary(S);
ok(sum.total === 11 && sum.first === 11 && !sum.missed.length && sum.answers === 22, "the summary: 11 right first time, 22 answers: " + JSON.stringify(sum));
ok(L.rateFor(S.items.a) === "good", "a card never missed rates Good when it counts toward review");

/* Misses */
S = L.create(DECK.slice(0, 9), {}, seeded(11));
L.startRound(S, seeded(1));
q = L.question(S, byId, seeded(1));
const wrong = (q.right + 1) % q.opts.length;
fb = L.answer(S, byId, {pick: wrong});
ok(!fb.ok && fb.to === 0 && S.items[q.id].miss === 1 && S.round.queue[S.round.queue.length - 1] === q.id && S.round.queue.length === 7, "a wrong pick stays New and the card comes back at the end of the round");
ok(fb.pick === wrong && fb.right === q.right && fb.opts.length === 4, "the feedback keeps the pick and the right one, to show both");
L.next(S);
// bring the missed card back up and type it wrong
while (S.round.queue.length > 1) { pickRight(); L.next(S); }
q = L.question(S, byId, seeded(2)); const missed = q.id; pickRight(); L.next(S);
ok(S.items[missed].lv === 1, "picked right the second time: Familiar");
L.startRound(S, seeded(3));
while (L.question(S, byId, seeded(4)).id !== missed) { pickRight(); L.next(S); }
fb = L.answer(S, byId, {text: "no idea at all"});
ok(!fb.ok && fb.from === 1 && fb.to === 0 && S.items[missed].miss === 2 && S.round.queue.includes(missed), "typed wrong: Familiar back to New, again later in the round");
const back = L.override(S);
ok(back && back.ok && back.over && back.to === 2 && back.mastered && S.items[missed].lv === 2 && S.items[missed].miss === 1 && !S.round.queue.includes(missed), "\"I was right\": the miss is taken back and the card is Mastered, not asked again");
ok(L.override(S) === null, "\"I was right\" works once");
ok(L.rateFor(S.items[missed]) === "hard", "a card missed on the way rates Hard");
L.next(S);
// a card missed three times in a round waits for the next round
S = L.create(DECK.slice(0, 5), {}, seeded(5)); L.startRound(S, seeded(5));
q = L.question(S, byId, seeded(5)); const stubborn = q.id; let times = 0;
while (S.round.queue.length) { const qq = L.question(S, byId, seeded(6)); if (qq.id === stubborn) { times++; L.answer(S, byId, {skip: true}); } else L.answer(S, byId, {pick: qq.right}); L.next(S); }
ok(times === 3 && S.items[stubborn].lv === 0, "a card missed comes back at most twice in a round (3 asks), then waits: " + times);
ok(L.answer(S, byId, {pick: 0}) === null && L.roundOver(S), "an empty round has no question");
// "I was right" only for typed answers
S = L.create(DECK.slice(0, 5), {}, seeded(8)); L.startRound(S, seeded(8)); q = L.question(S, byId, seeded(8)); L.answer(S, byId, {pick: (q.right + 1) % 4});
ok(L.override(S) === null, "\"I was right\" isn't offered for a wrong pick");

/* Picture and math cards: picked twice */
S = L.create([byId.p, byId.a, byId.b, byId.c, byId.m], {}, seeded(1)); L.startRound(S, seeded(1));
const asked = {};
while (!L.done(S)) { if (L.roundOver(S)) L.startRound(S, seeded(2)); const qq = L.question(S, byId, seeded(3)); (asked[qq.id] = asked[qq.id] || []).push(qq.type); L.answer(S, byId, qq.type === "mc" ? {pick: qq.right} : {text: byId[qq.id].back}); L.next(S); }
ok(asked.p.join() === "mc,mc" && asked.m.join() === "mc,mc" && asked.a.join() === "mc,type", "picture and math cards are picked twice; text cards picked then typed: " + JSON.stringify(asked));

/* Wrong options look like the right one */
S = L.create(DECK, {}, seeded(4)); S.round = {n: 1, ids: ["a"], queue: ["a"], back: {}};
let plainOnly = true; for (let k = 1; k < 40; k++) { S.cur = null; if (L.question(S, byId, seeded(k)).opts.some(o => o.id === "m" || o.id === "p")) plainOnly = false; }
ok(plainOnly, "a text card's wrong options aren't formulas or picture labels when there are enough text answers");

/* Fewer than 2 different answers: typed straight away */
const same = [card("s1", "One", "Same"), card("s2", "Two", "same"), card("s3", "Three", "SAME"), card("s4", "Four", "Same.")];
S = L.create(same, {}, seeded(2)); L.startRound(S, seeded(2));
ok(L.question(S, Object.fromEntries(same.map(c => [c.id, c])), seeded(2)).type === "type", "with no other answers to pick from, a card is typed");

/* Kept between visits */
S = L.create(DECK, {deckId: "d1", count: true}, seeded(3)); L.startRound(S, seeded(3));
q = L.question(S, byId, seeded(3)); L.answer(S, byId, {pick: q.right}); L.next(S); q = L.question(S, byId, seeded(4));
let R = L.unpack(L.pack(S));
ok(R && R.count && R.deckId === "d1" && R.round.n === 1 && R.cur.id === q.id && JSON.stringify(R.cur.opts) === JSON.stringify(q.opts) && L.counts(R).familiar === 1, "a session packed and unpacked comes back on the same question, with the same options");
ok(L.question(R, byId, seeded(99)) === R.cur, "the saved question is asked, not a new one");
ok(L.unpack("{bad json") === null && L.unpack(JSON.stringify({v: 99})) === null && L.unpack(null) === null, "a broken or old saved session is ignored");
const fewer = DECK.filter(c => c.id !== q.id).concat(card("z", "Golgi", "Packages proteins"));
L.sync(R, fewer);
ok(!R.items[q.id] && !R.order.includes(q.id) && !R.cur && R.items.z && R.order[R.order.length - 1] === "z" && !R.round.queue.includes(q.id), "the deck changed: a deleted card leaves the session, a new card joins as New");
ok(L.counts(R).total === 11, "counts follow the deck");

console.log(`learn.test: ${n} checks passed`);
