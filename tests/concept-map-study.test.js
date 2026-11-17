// Concept maps and studying: a map's connections as flashcards (and keeping that deck in step), how well each idea is known
// from flashcard and quiz results, and an idea's link to a PDF page or a lecture moment.
const assert = require("assert");
const s = require("../scripts/app-files").source();
let n = 0; const ok = (c, m) => { n++; assert(c, m); };
const between = (a, b) => { const i = s.indexOf(a), j = s.indexOf(b, i); assert(i >= 0 && j > i, "marker " + a); return s.slice(i + a.length, j); };
const CMAP = new Function(between("/*CMAP-START*/", "/*CMAP-END*/") + ";return CMAP;")();
const G = user => CMAP.graph({root: {label: "Cell respiration"}, blank: true, user});
const g = G({add: [{id: "a", label: "Glycolysis"}, {id: "b", label: "Pyruvate"}, {id: "c", label: "Krebs cycle"}, {id: "d", label: "ATP"}, {id: "p", label: ""  , img: {k: "i:x"}}],
  links: [{a: "root", b: "idea:a", label: "starts with"}, {a: "idea:a", b: "idea:b", label: "makes"}, {a: "idea:b", b: "idea:c", label: ""}, {a: "idea:c", b: "idea:d", label: "produces"}, {a: "idea:d", b: "idea:p", label: "looks like"}]});

/* Map to flashcards */
let m = CMAP.mapCards(g);
ok(m.cards.length === 3 && m.skipped === 2, `worded connections become cards; a line with no words, or to a picture with no name, is skipped (${m.cards.length}, ${m.skipped})`);
const gp = m.cards.find(c => c.back === "Pyruvate");
ok(gp && gp.front === "Glycolysis → makes → ?" && gp.d === "f" && gp.a === "idea:a" && gp.b === "idea:b", "a card reads along the arrow: Glycolysis → makes → ?, back Pyruvate");
ok(m.cards.some(c => c.front === "Cell respiration → starts with → ?" && c.back === "Glycolysis"), "the map's name (the middle) counts as an idea");
m = CMAP.mapCards(g, {both: true});
ok(m.cards.length === 6 && m.cards.some(c => c.front === "? → makes → Pyruvate" && c.back === "Glycolysis" && c.d === "r"), "both directions: also ? → makes → Pyruvate");
const auto = CMAP.graph({root: {label: "Course"}, decks: [{id: "k", label: "Deck", from: [["note", "n"]]}], notes: [{id: "n", label: "Note", text: ""}]});
ok(CMAP.mapCards(auto).cards.length === 0, "lines Studyboard drew by itself (deck made from note) don't become cards");

/* Keeping the deck in step */
let k = 0; const id = () => "c" + (++k);
let r = CMAP.syncCards([{id: "x", front: "Mine", back: "Own card", box: 2, right: 3, wrong: 0}], CMAP.mapCards(g).cards, "c:bio:m1", id);
ok(r.added === 3 && r.changed === 0 && r.cards.length === 4 && r.cards[0].id === "x", "first time: 3 cards added beside the deck's own");
ok(r.cards.slice(1).every(c => c.from.k === "cmap" && c.from.id === "c:bio:m1" && c.box === 0 && c.right === 0), "each card remembers its map and connection");
const studied = r.cards.map(c => c.back === "Pyruvate" ? Object.assign({}, c, {box: 3, right: 4, wrong: 1}) : c);
const g2 = G({add: [{id: "a", label: "Glycolysis"}, {id: "b", label: "Pyruvate"}, {id: "c", label: "Krebs cycle"}, {id: "d", label: "ATP"}],
  links: [{a: "idea:a", b: "idea:b", label: "produces"}, {a: "idea:b", b: "idea:c", label: "feeds"}, {a: "idea:c", b: "idea:d", label: "produces"}]});
r = CMAP.syncCards(studied, CMAP.mapCards(g2).cards, "c:bio:m1", id);
const py = r.cards.find(c => c.back === "Pyruvate");
ok(r.added === 1 && r.changed === 1 && py.front === "Glycolysis → produces → ?" && py.box === 3 && py.right === 4, "again: new words on a line update its card and keep its progress; a newly worded line is added");
ok(r.gone === 1 && r.cards.length === 5, "a connection taken off the map keeps its card (counted, never deleted)");
r = CMAP.syncCards(r.cards, CMAP.mapCards(g2).cards, "c:bio:m1", id);
ok(r.added === 0 && r.changed === 0, "nothing new: nothing changes");
ok(CMAP.syncCards(r.cards, CMAP.mapCards(g2).cards, "c:bio:m2", id).added === 3, "another map's cards are its own");

/* How well each idea is known */
const ev = [
  {text: "Glycolysis → makes → ? Pyruvate", right: 1, wrong: 4, ids: ["idea:a", "idea:b"], card: {d: "k", c: "1"}},
  {text: "Where does the Krebs cycle happen? Mitochondria", right: 6, wrong: 0, card: {d: "k", c: "2"}},
  {text: "What does ATP synthase make?", right: 1, wrong: 1},
  {text: "Glycolysis happens in the cytoplasm", right: 0, wrong: 0, card: {d: "k", c: "3"}},
  {text: "ATPase", right: 0, wrong: 5}, {text: "krebs", right: 0, wrong: 9},
];
const kf = CMAP.knowFrom(g, ev);
ok(kf["idea:a"].lvl === "weak" && kf["idea:b"].lvl === "weak" && kf["idea:a"].pct === 20, "a card made from the map counts for the two ideas it joins (1 of 5 right: shaky)");
ok(kf["idea:c"].lvl === "strong" && kf["idea:c"].right === 6, "a card that names an idea counts for it (6 of 6: strong)");
ok(kf["idea:d"].lvl === "ok" || kf["idea:d"].lvl === "weak", "a quiz question naming ATP counts for ATP");
ok(kf["idea:d"].wrong === 1, "whole words only: 'ATPase' isn't ATP, and 'krebs' alone isn't Krebs cycle");
ok(kf["idea:a"].cards.length === 2 && kf["idea:a"].cards.some(c => c.c === "3"), "a card never studied still belongs to its idea (so Review can include it), without colouring it");
ok(!kf.root, "the map's middle isn't coloured");
const exam = CMAP.graph({root: {label: "Midterm"}, mode: "exam", exams: [{id: "x", label: "Midterm", topics: [{id: "t1", name: "Enzymes", conf: "weak"}]}], user: {add: [{id: "z", label: "Catalase"}], links: [{a: "topic:x:t1", b: "idea:z"}]}});
let L = CMAP.levels(exam, []);
ok(L.lv["topic:x:t1"] === "weak" && L.lv["idea:z"] === "weak", "with no results, an exam's map uses how sure you said you are of each topic");
L = CMAP.levels(exam, [{text: "Catalase breaks down peroxide", right: 5, wrong: 0}, {text: "Enzymes lower activation energy", right: 9, wrong: 0}]);
ok(L.lv["idea:z"] === "strong" && L.lv["topic:x:t1"] === "strong", "results win over the guess");

/* An idea's link to a page or a lecture moment */
ok(JSON.stringify(CMAP.atOf({f: "f1", p: 12})) === '{"f":"f1","p":12}' && JSON.stringify(CMAP.atOf({f: "f2", t: 754000})) === '{"f":"f2","t":754000}', "a page or a time");
ok([null, {}, {f: "f1"}, {f: "f1", p: 0}, {f: "f1", p: -3}, {f: "", p: 2}, {f: 5, p: 2}, {f: "f1", t: -1}, {f: "f1", t: 9e9}].every(a => CMAP.atOf(a) === null), "anything else is no link");
ok(CMAP.clock(754000) === "12:34" && CMAP.clock(3723000) === "1:02:03" && CMAP.parseClock("12:34") === 754000 && CMAP.parseClock("1:02:03") === 3723000 && CMAP.parseClock("7:61") === null && CMAP.parseClock("abc") === null, "times read and written as 12:34");
const ga = CMAP.graph({root: {label: "Bio"}, files: [{id: "f1", label: "Lecture 3 slides.pdf", pdf: true}], user: {add: [{id: "a", label: "Glycolysis", at: {f: "f1", p: 12}}, {id: "b", label: "Gone", at: {f: "nope", p: 2}}]}});
const ia = ga.nodes.find(x => x.id === "idea:a");
ok(ia.at.p === 12 && ga.edges.some(e => e.key === [ "file:f1", "idea:a"].sort().join("|") && e.label === "p. 12"), "an idea linked to a page sits next to that PDF on the map, the line saying which page");
ok(ga.nodes.find(x => x.id === "idea:b").at.f === "nope" && !ga.edges.some(e => e.a === "idea:b" || e.b === "idea:b"), "a link to a file not on the map draws no line");
/* Lines: thickness and colour; the old thick line is a solid, thick one */
{ const gl = CMAP.graph({root: {label: "M"}, blank: true, user: {add: [{id: "a", label: "A"}, {id: "b", label: "B"}, {id: "c", label: "C"}], links: [{a: "root", b: "idea:a", line: "thick"}, {a: "root", b: "idea:b", line: "dashed", w: 4, col: "#D6336C"}, {a: "root", b: "idea:c", w: 9, col: "red; x"}]}});
  const E = id => gl.edges.find(e => e.b === id || e.a === id && e.b === "root");
  ok(E("idea:a").line === "solid" && E("idea:a").w === 3, "an old thick line becomes solid and thick");
  ok(E("idea:b").line === "dashed" && E("idea:b").w === 4 && E("idea:b").col === "#D6336C", "a line keeps its pattern, thickness and colour");
  ok(E("idea:c").w === 0 && E("idea:c").col === "", "a thickness or colour that isn't one is ignored"); }
console.log(`concept-map-study: ${n} checks passed`);
