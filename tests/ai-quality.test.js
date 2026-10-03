// node tests/ai-quality.test.js  (extracts the AI-QUALITY block from index.html and tests it)
const fs = require("fs"), path = require("path"), assert = require("assert");
const src = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const block = src.slice(src.indexOf("/* AI-QUALITY-START"), src.indexOf("/* AI-QUALITY-END */"));
const api = new Function(block + "; return {aiRepairJson, aiTidyText, aiGateCards, aiGateQuestions, aiGateSyllabus, aiCleanCites, aiCorpus, aiGroundNote, qaConfident};")();
let n = 0; const t = (name, fn) => { fn(); n++; console.log("ok -", name); };

t("repairs cut-off JSON, keeping complete cards", () => {
  const r = api.aiRepairJson('{"deckTitle":"Cells","cards":[{"front":"A","back":"a"},{"front":"B","back":"b"},{"front":"C","ba');
  assert.deepStrictEqual(r.cards.map(c => c.front), ["A", "B"]);
});
t("repairs fenced and prefixed JSON; braces inside strings are safe", () => {
  const r = api.aiRepairJson('Here you go:\n```json\n{"cards":[{"front":"What is {x}?","back":"a \\"quote\\" ]"},{"front":"B"');
  assert.strictEqual(r.cards.length, 1); assert.strictEqual(r.cards[0].front, "What is {x}?");
});
t("returns null when nothing is complete", () => assert.strictEqual(api.aiRepairJson('{"cards":[{"front":"A'), null));
t("tidy strips markdown, html, latex and writes sub/superscripts", () => {
  assert.strictEqual(api.aiTidyText("**ATP** is made by <b>glycolysis</b>"), "ATP is made by glycolysis");
  assert.strictEqual(api.aiTidyText("6CO_2 + 6H_2O \\rightarrow C_6H_{12}O_6"), "6CO₂ + 6H₂O → C₆H₁₂O₆");
  assert.strictEqual(api.aiTidyText("$E = mc^2$ and $\\Delta G < 0$"), "E = mc² and ΔG < 0");
  assert.strictEqual(api.aiTidyText("costs $5 and $10"), "costs $5 and $10");
  assert.strictEqual(api.aiTidyText("## Heading\nline<br>two"), "Heading\nline\ntwo");
  assert.strictEqual(api.aiTidyText("\\frac{a}{b}"), "a/b");
  assert.strictEqual(api.aiTidyText("snake_case_name stays"), "snake_case_name stays");
});
t("card gate: dedupes, drops trivial/long/incomplete, caps count", () => {
  const long = "x".repeat(800);
  const g = api.aiGateCards([
    {front: "What is osmosis?", back: "Water moves across a membrane toward higher solute concentration."},
    {front: "Define osmosis", back: "Movement of water across a semipermeable membrane."},
    {front: "Osmosis?", back: "Water moves across a membrane toward higher solute concentration."},
    {front: "What is diffusion?", back: "Net movement of particles from high to low concentration."},
    {front: "Mitochondria", back: "Mitochondria"},
    {front: "Too long", back: long}, {front: "", back: "x"}, null,
    {front: "Where is ATP made?", back: "**Mitochondria**", source: "Slide 4"}], {max: 3});
  assert.deepStrictEqual(g.cards.map(c => c.front), ["What is osmosis?", "What is diffusion?", "Where is ATP made?"].map(String).slice(0, 3).map(x => x));
  assert.strictEqual(g.cards[2].back, "Mitochondria");
  assert.strictEqual(g.dropped.long, 1); assert.ok(g.dropped.dup >= 1); assert.ok(g.dropped.empty >= 2);
});
t("grounding check flags invented numbers and off-topic cards, passes real ones", () => {
  const corpus = api.aiCorpus(["Photosynthesis takes place in the chloroplast. The light reactions produce ATP and NADPH in the thylakoid membranes. The Calvin cycle fixes carbon dioxide. Optimal temperature is 25 degrees."]);
  assert.strictEqual(api.aiGroundNote("Where does the Calvin cycle fix carbon dioxide? In the stroma of the chloroplast", corpus), "");
  assert.match(api.aiGroundNote("Optimal temperature? 37 degrees", corpus), /37/);
  assert.strictEqual(api.aiGroundNote("Optimal temperature? 25 degrees", corpus), "");
  assert.match(api.aiGroundNote("Which hormone regulates glucose uptake? Insulin from pancreatic cells", corpus), /material/);
  assert.strictEqual(api.aiGroundNote("anything", null), "");
  const g = api.aiGateCards([{front: "Optimal temperature", back: "37 degrees"}], {corpus});
  assert.ok(g.cards[0].check);
});
t("question gate: repeated stems, repeated options, cap", () => {
  const q = (stem, options, extra) => Object.assign({type: "single", stem, options, correct: [0], answer: ""}, extra);
  const g = api.aiGateQuestions([q("Which organelle makes ATP?", ["Mitochondria", "Golgi", "Ribosome", "Nucleus"]), q("Which organelle makes ATP in cells?", ["Mitochondria", "Golgi", "Ribosome", "Nucleus"]),
    q("Where does the Calvin cycle fix CO₂?", ["Stroma", "Thylakoid"]), q("Where does the Calvin cycle fix carbon dioxide?", ["Stroma", "Thylakoid"]), q("Where is DNA stored?", ["Nucleus", "nucleus", "Golgi"]), q("What does the Golgi do?", ["Packages proteins", "Makes ATP"]), q("What do ribosomes make?", ["Protein", "Lipid"])], {max: 3});
  assert.strictEqual(g.questions.length, 3); assert.strictEqual(g.dropped.dup, 2); assert.strictEqual(g.dropped.bad, 1);
});
t("syllabus gate: repeats merged, outlier years blanked", () => {
  const it = (title, due, extra) => Object.assign({title, due, start: "", source: "ai"}, extra);
  const r = api.aiGateSyllabus([it("Homework 1", "2026-10-09"), it("Homework 1", "2026-10-09"), it("Midterm", "2026-11-12"), it("Final", "2025-12-10"), it("HW 2", "2026-10-16", {start: "2026-10-20"}), it("Project", "2026-12-01")], "2026-10-03");
  assert.strictEqual(r.dups, 1); assert.strictEqual(r.fixed, 1);
  assert.strictEqual(r.items.find(i => i.title === "Final").due, ""); assert.strictEqual(r.items.find(i => i.title === "Final").source, "ai-low");
  assert.strictEqual(r.items.find(i => i.title === "HW 2").start, "");
  assert.strictEqual(r.items.find(i => i.title === "Midterm").due, "2026-11-12");
});
t("citations to missing sources are removed", () => {
  assert.strictEqual(api.aiCleanCites("Cell walls are cellulose [2]. Also chitin [7].", 3), "Cell walls are cellulose [2]. Also chitin.");
});
t("quick add confidence", () => {
  const ok = (text, title, type) => api.qaConfident(text, {title, type: type || "Assignment"});
  assert.ok(ok("bio lab report fri 5pm 3h", "Lab report", "Lab"));
  assert.ok(ok("homework 3 due tomorrow", "Homework 3"));
  assert.ok(ok("chem quiz 2 monday", "Quiz 2", "Quiz"));
  assert.ok(!ok("read ch 4 next week", "Read ch 4 next week"));
  assert.ok(!ok("hw 3 due fri; lab 2 due mon", "Hw 3 due fri; lab 2 due mon"));
  assert.ok(!ok("essay due end of the month", "Essay end of the month"));
  assert.ok(!ok("x".repeat(200), "x"));
  assert.ok(!ok("", ""));
});
console.log(n + " tests passed");
