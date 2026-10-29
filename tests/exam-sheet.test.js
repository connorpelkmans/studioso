// Unit tests for the Formula and Diagram Sheet's pure code (between EXAMSHEET-START and EXAMSHEET-END in src/js/99-exam-sheet.js).
// Run: node tests/exam-sheet.test.js
const fs = require("fs"), path = require("path"), assert = require("assert");
const s = fs.readFileSync(path.join(__dirname, "..", "src", "js", "99-exam-sheet.js"), "utf8");
const code = s.slice(s.indexOf("/*EXAMSHEET-START*/"), s.indexOf("/*EXAMSHEET-END*/"));
const X = new Function(code + ";return EXAMSHEET;")();
let n = 0; const ok = (c, m) => { n++; assert(c, m); };
const eq = (a, b, m) => { n++; assert.deepStrictEqual(a, b, m); };

// formulas
["F = ma", "v = u + at", "$E=mc^2$", "E = mc²", "PV = nRT", "a² + b² = c²", "Area of a circle = πr²", "Density = mass / volume", "s = ut + ½at²",
  "\\frac{dy}{dx} = 2x", "KE = \\frac{1}{2}mv^2", "pH = -log[H+]", "Δx = x_f - x_i", "T = 2π√(L/g)", "2H2 + O2 -> 2H2O", "c ≈ 3 × 10^8 m/s", "F_net = Σ F"]
  .forEach(f => ok(X.isFormula(f), "formula: " + f));
// ordinary sentences with "=" or ":" are not formulas
["Due: Friday", "Due = Friday", "x = 5", "Score = 90%", "The answer = whatever you think", "Meeting = room 4B", "1 = strongly disagree, 5 = strongly agree",
  "Office hours = Tue 3:30 pm", "Read chapter 4 before class.", "Remember: the exam is on Monday", "See https://example.com/a=b", "Total = 3 lectures this week, then the quiz",
  "Price = 20 dollars", "Input -> Output", "Step 1 -> Step 2", "If you're late = no entry", "", "F = 10 × 2 = 20 N"]
  .forEach(f => ok(!X.isFormula(f), "not a formula: " + JSON.stringify(f)));
eq(X.formulaIn("Newton's second law: F = ma"), {expr: "F = ma", label: "Newton's second law"}, "a label before the formula is split off");
eq(X.formulaIn("Kinetic energy: KE = ½mv²"), {expr: "KE = ½mv²", label: "Kinetic energy"}, "and kept as the label even when the line is a formula as a whole");
eq(X.formulaIn("Example: F = 10 × 2 = 20 N"), null, "a worked example is not a formula");
eq(X.formulaIn("Note: x = y + 2"), null, "nor a line labelled Note");
eq(X.formulaIn("- **F = ma**"), {expr: "F = ma", label: ""}, "bullets and bold are stripped");
eq(X.formulaIn("Some words\nv = u + at\nmore"), {expr: "v = u + at", label: ""}, "the first formula line in a card");

// pretty printing
ok(X.pretty("$E=mc^2$") === "E=mc<sup>2</sup>", "LaTeX power: " + X.pretty("$E=mc^2$"));
ok(X.pretty("KE = \\frac{1}{2}mv^2") === "KE = 1/2mv<sup>2</sup>", "fraction: " + X.pretty("KE = \\frac{1}{2}mv^2"));
ok(X.pretty("\\Delta x = v_0 t + \\frac{1}{2} a t^{2}") === "Δ x = v<sub>0</sub> t + 1/2 a t<sup>2</sup>", "greek, subscripts: " + X.pretty("\\Delta x = v_0 t + \\frac{1}{2} a t^{2}"));
ok(X.pretty("\\sqrt{a^2 + b^2}") === "√(a<sup>2</sup> + b<sup>2</sup>)", "root: " + X.pretty("\\sqrt{a^2 + b^2}"));
ok(!/<script/i.test(X.pretty("x = <script>alert(1)</script>")) && /&lt;script&gt;/.test(X.pretty("x = <script>alert(1)</script>")), "pretty escapes HTML");

// definitions in notes
eq(X.defLine("Osmosis: movement of water across a semi-permeable membrane"), {term: "Osmosis", def: "movement of water across a semi-permeable membrane"}, "Term: definition");
eq(X.defLine("- Velocity — rate of change of displacement"), {term: "Velocity", def: "rate of change of displacement"}, "Term — definition, bulleted");
eq(X.defLine("**Inertia** - resistance of an object to a change in its motion"), {term: "Inertia", def: "resistance of an object to a change in its motion"}, "Term - definition, bold");
["Due: Friday", "Due: Friday, Oct 31 at 5 pm in room 4", "Room: 4B", "Chapter 3: Cells and their parts", "Office hours: Tuesdays 3-5 in the lab", "Note: bring a calculator to every lab",
  "Remember: the exam is on Monday", "Class: Tuesdays in room 4", "Time: 9:30 am", "Why does it fall: because of gravity acting on it", "Kinematics:", "Q: what is a vector quantity",
  "I think the best part was: when we all did the lab together", "Speed: fast", "Link: https://example.com/notes page", "Reading: pages 12 to 40 of the book", "Exam 2: covers chapters 4 to 6 and the labs"]
  .forEach(l => ok(X.defLine(l) === null, "not a definition: " + JSON.stringify(l)));
ok(X.defLine("Newton's second law: F = ma") === null, "a labelled formula is not a definition");

// definitions on cards
eq(X.defCard("Inertia", "Resistance of an object to a change in its motion"), {term: "Inertia", def: "Resistance of an object to a change in its motion"}, "term card");
eq(X.defCard("What is a vector?", "A quantity with both size and direction"), {term: "Vector", def: "A quantity with both size and direction"}, "What is ...? card");
eq(X.defCard("Beta blocker example", "Metoprolol"), null, "a one-word answer is not a definition");
eq(X.defCard("Why does ice float on water?", "It is less dense than liquid water"), null, "a why-question is not a definition");
eq(X.defCard("The mitochondria is the _____ of the cell", "powerhouse"), null, "a fill-in-the-blank is not a definition");
eq(X.defCard("Newton's second law", "F = ma"), null, "a formula card is not a definition");

// pictures: one per picture, labels numbered by mask, duplicates once, drafts left out
const img = {k: "i:heart", w: 400, h: 300, s: "set1", m: [[0.1, 0.1, 0.2, 0.1], [0.5, 0.5, 0.2, 0.1], [0.7, 0.2, 0.1, 0.1]], src: "Heart diagram"};
const pics = X.pictures([{id: "p1", back: "Aorta", img: Object.assign({}, img, {i: 0})}, {id: "p2", back: "Left ventricle", img: Object.assign({}, img, {i: 1})}, {id: "p3", back: "Aorta", img: Object.assign({}, img, {i: 2})}, {id: "p4", back: "Draft", draft: true, img: Object.assign({}, img, {i: 2, s: "other"})}]);
ok(pics.length === 1 && pics[0].title === "Heart diagram" && pics[0].labels.length === 3, "one picture with its three masks");
eq(pics[0].labels.filter(l => l.first).map(l => l.n + " " + l.text), ["1 Aorta", "2 Left ventricle"], "labels numbered, the repeat label shown once");

// collect: grouped by topic, deduplicated across cards, notes and topics
const card = (id, front, back, o) => Object.assign({id, front, back, deckId: "d1"}, o || {});
const M = X.collect([
  {name: "Kinematics", cards: [card("c1", "Newton's second law", "F = ma"), card("c2", "Final velocity", "v = u + at"), card("c3", "Mass-energy", "$E=mc^2$"), card("c4", "Inertia", "Resistance of an object to a change in its motion"),
    card("c5", "F = ma", "Newton's second law"), card("c6", "Draft", "x = y + z", {draft: true}), card("c7", "Beta blocker example", "Metoprolol"), card("c8", "Diagram", "Aorta", {img: Object.assign({}, img, {i: 0})})],
   notes: [{id: "n1", text: "Motion definitions\nVelocity — rate of change of displacement\nInertia: resistance to a change in motion\nDue: Friday\nv = u + at\nF=ma"}]},
  {name: "Energy", cards: [card("c9", "E = mc²", "Energy and mass are equivalent"), card("c10", "Kinetic energy", "KE = ½mv²")], notes: [{id: "n2", text: "Velocity: speed in a given direction\nWork: force times distance moved in the direction of the force"}]},
  {name: "Empty", cards: [card("c11", "Beta blocker example", "Metoprolol")], notes: []}
]);
eq(M.sections.map(x => x.name), ["Kinematics", "Energy"], "sections by topic; a topic with nothing on the sheet is left out");
eq(M.sections[0].formulas.map(f => f.expr), ["F = ma", "v = u + at", "$E=mc^2$"], "formulas from cards; the reversed F = ma card, the note's 'F=ma' and the note's v = u + at are duplicates; drafts left out");
eq(M.sections[0].formulas[0].label, "Newton's second law", "a formula keeps its card's front as the label");
eq(M.sections[0].defs.map(d => d.term), ["Inertia", "Velocity"], "definitions from cards and note lines, Inertia once");
ok(M.sections[0].defs[0].src.k === "card" && M.sections[0].defs[1].src.k === "note" && M.sections[0].defs[1].src.id === "n1", "each item points back to its source");
eq(M.sections[1].formulas.map(f => f.expr), ["KE = ½mv²"], "E = mc² is the same formula as $E=mc^2$ (dedupe across topics)");
eq(M.sections[1].defs.map(d => d.term), ["Work"], "Velocity again under Energy is a duplicate");
ok(M.sections[0].pictures.length === 1, "the picture card goes under its topic");
eq(M.counts, {formulas: 4, defs: 3, pictures: 1}, "counts");
eq(X.collect([]), {sections: [], counts: {formulas: 0, defs: 0, pictures: 0}}, "nothing linked: empty");
ok(X.exprKey("F = ma") === X.exprKey("F=ma") && X.exprKey("$E=mc^2$") === X.exprKey("E = mc²") && X.exprKey("F = ma") !== X.exprKey("f = ma"), "formula keys ignore spacing and notation, not case");

console.log(`exam-sheet: ${n} checks passed`);
