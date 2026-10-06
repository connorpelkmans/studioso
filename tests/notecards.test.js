// node tests/notecards.test.js  (extracts the NOTECARDS block from index.html: heuristic card extraction, dedupe against a deck, and the checks on AI cards)
const fs = require("fs"), path = require("path"), assert = require("assert");
const src = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const grab = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b); assert(i > 0 && j > i, "markers " + a); return src.slice(i, j); };
const NC = new Function(grab("/*NOTECARDS-START", "/*NOTECARDS-END*/") + "; return NOTECARDS;")();
const Q = new Function(grab("/* AI-QUALITY-START", "/* AI-QUALITY-END */") + "; return {aiTidyText, aiGateCards};")();
let n = 0; const t = (name, fn) => { fn(); n++; console.log("ok -", name); };
const by = (list, kind) => list.filter(c => c.kind === kind);
const has = (list, f, b) => list.some(c => c.front === f && (b === undefined || c.back === b));

t("definitions: X is / are / means / refers to / is defined as", () => {
  const r = NC.extract("Osmosis is the movement of water across a semipermeable membrane toward higher solute concentration.\nMitochondria are organelles that produce most of the cell's ATP.\nHomeostasis means keeping the internal environment stable.\nThe term allele refers to one of two or more versions of a gene.\nInflation is defined as a general rise in prices over time.");
  assert(has(r, "What is osmosis?".replace("osmosis", "Osmosis")) || r.some(c => /^What is Osmosis\?$/.test(c.front)), JSON.stringify(r));
  assert(r.some(c => /^What are Mitochondria\?$/.test(c.front) && /^Organelles that produce/.test(c.back)), "are");
  assert(r.some(c => /^What does Homeostasis mean\?$/.test(c.front) && /internal environment stable$/.test(c.back)), "means");
  assert(r.some(c => /^How is inflation defined\?$/i.test(c.front) || /defined/.test(c.front)), "defined as");
  assert(r.every(c => !/[.]$/.test(c.front.replace(/\?$/, ""))), "fronts carry no trailing period");
});
t("term separators: dash, en dash, colon, equals, arrow; with bullets and numbers", () => {
  const r = NC.extract("- Osmosis - movement of water across a membrane\n* Diffusion: passive movement from high to low concentration\n1. Active transport = movement against a gradient using energy\n2) ATP → the cell's energy currency\nGlycolysis – breakdown of glucose in the cytoplasm");
  ["Osmosis", "Diffusion", "Active transport", "ATP", "Glycolysis"].forEach(f => assert(has(by(r, "term"), f), "term " + f + " in " + JSON.stringify(r)));
  assert.strictEqual(r.find(c => c.front === "Diffusion").back, "passive movement from high to low concentration");
});
t("things that are not terms: times, labels, links, long sentences with a colon", () => {
  const r = NC.extract("Due: Friday at 5pm\nNote: bring your lab coat\nMeeting at 10:30 in room 4\nSee: https://example.com/page\nThere are three reasons why this matters: cost, time and risk");
  assert.strictEqual(by(r, "term").length, 0, JSON.stringify(r));
});
t("headed list: a heading with a colon over plain bullets becomes one list card", () => {
  const r = NC.extract("Stages of mitosis:\n- Prophase\n- Metaphase\n- Anaphase\n- Telophase");
  assert.strictEqual(r.length, 1); assert.strictEqual(r[0].kind, "list");
  assert.strictEqual(r[0].front, "What are the stages of mitosis?");
  assert.strictEqual(r[0].back, "• Prophase\n• Metaphase\n• Anaphase\n• Telophase");
});
t("headed list with term: definition bullets gives one card per bullet, not a list", () => {
  const r = NC.extract("Key terms:\n- Allele: a version of a gene\n- Locus: the position of a gene");
  assert.deepStrictEqual(r.map(c => c.kind), ["term", "term"]);
});
t("heading over a paragraph: the heading is the front, the first sentence the back", () => {
  const r = NC.extract("Photosynthesis\nThe process by which plants turn light into chemical energy stored in glucose. It happens in the chloroplasts.\n");
  assert.strictEqual(r[0].kind, "head"); assert.strictEqual(r[0].front, "Photosynthesis");
  assert(/^The process by which plants turn light/.test(r[0].back));
  assert.strictEqual(NC.extract("Lecture 4\nWe covered a lot of ground today in the lecture hall and then went to lunch.").filter(c => c.kind === "head").length, 0, "not a heading card");
});
t("question and answer pairs already written", () => {
  const r = NC.extract("Q: What is the powerhouse of the cell?\nA: The mitochondria\n\nQuestion 2. Why is the sky blue?\nAnswer: Short wavelengths scatter more.\nIt is called Rayleigh scattering.\nWhat causes tides?\nAnswer: The pull of the moon and sun.\nQ: Name the largest planet? A: Jupiter");
  assert.strictEqual(by(r, "qa").length, 4, JSON.stringify(r));
  assert.deepStrictEqual(r[0], Object.assign({}, r[0], {front: "What is the powerhouse of the cell?", back: "The mitochondria"}));
  assert(r.some(c => c.front === "Why is the sky blue?" && /Rayleigh scattering/.test(c.back)), "multi-line answers join");
  assert(r.some(c => c.front === "Name the largest planet?" && c.back === "Jupiter"), "inline");
});
t("cloze: hides the most testable word of a key sentence, once", () => {
  const r = NC.extract("The Krebs cycle was described by Hans Krebs in 1937 and takes place in the mitochondrial matrix.", {max: 10});
  assert.strictEqual(r.length, 1); assert.strictEqual(r[0].kind, "cloze");
  assert(/_____/.test(r[0].front) && !new RegExp(r[0].back).test(r[0].front), JSON.stringify(r));
  const k = NC.clozeOf("Plants absorb carbon dioxide (CO2) through tiny pores called stomata on their leaves.");
  assert.strictEqual(k.back, "CO2");
  assert.strictEqual(NC.clozeOf("Remember to bring your calculator to the quiz on Tuesday morning please."), null, "instructions are not facts");
  assert.strictEqual(NC.clozeOf("Short sentence here."), null);
  assert.strictEqual(NC.clozeOf("What is the capital city of France and why is it so famous today?"), null, "questions are not cloze");
});
t("abbreviations do not split sentences", () => {
  assert.deepStrictEqual(NC.sentences("Dr. Lee studied e.g. rats in the U.S. in 2010. It went well."), ["Dr. Lee studied e.g. rats in the U.S. in 2010.", "It went well."]);
  assert.deepStrictEqual(NC.sentences("The value is 3.5 percent. Next point."), ["The value is 3.5 percent.", "Next point."]);
});
t("junk and empty input give no cards, never throw", () => {
  ["", "   \n\n ", "hi", "- \n- \n", "Due: Friday", "https://example.com", "a:b", null, undefined].forEach(x => assert.deepStrictEqual(NC.extract(x), []));
  assert.doesNotThrow(() => NC.extract("x".repeat(50000)));
  assert.doesNotThrow(() => NC.extract("(((( [[[[ **** ____ ???? \\\\ \u0000"));
});
t("extract: order follows the text, max is honored, no duplicate cards inside one list", () => {
  const lines = []; for (let i = 0; i < 80; i++) lines.push(`Term${String.fromCharCode(97 + i % 26)}${i} - the definition number ${i} of this term`);
  const r = NC.extract(lines.join("\n"), {max: 25}); assert.strictEqual(r.length, 25);
  assert(r.every((c, i) => i === 0 || c.pos >= r[i - 1].pos), "in text order");
  const d = NC.extract("Osmosis - movement of water\nOsmosis: movement of water across a membrane\nWhat is osmosis?\nAnswer: movement of water");
  assert.strictEqual(d.length, 1, JSON.stringify(d));
});
t("a realistic page of notes", () => {
  const page = `Cell Transport

Passive transport: no energy needed
- Diffusion - molecules move from high to low concentration
- Osmosis - diffusion of water across a semipermeable membrane
- Facilitated diffusion - uses channel proteins

The sodium-potassium pump moves 3 Na+ out and 2 K+ in for every ATP used. Cells that burn lots of energy, such as neurons, contain many pumps.

Endocytosis is the process by which a cell engulfs material by folding its membrane around it.
Remember to review chapter 5 before Thursday.
Q: What is exocytosis?
A: Vesicles release material outside the cell`;
  const r = NC.extract(page);
  assert(r.length >= 5 && r.length <= 12, "sensible count: " + r.length + JSON.stringify(r));
  assert(has(r, "Diffusion") && has(r, "Osmosis") && has(r, "Facilitated diffusion"));
  assert(r.some(c => /Endocytosis/.test(c.front) && /engulfs material/.test(c.back)));
  assert(r.some(c => c.kind === "qa" && c.front === "What is exocytosis?"));
  assert(!r.some(c => /Remember to review/.test(c.front + c.back)));
  assert(r.every(c => c.front.length > 1 && c.back.length > 0 && c.front.length <= 300 && c.back.length <= 700));
});

t("similar: the same question worded differently, the same blank, the same answer", () => {
  assert(NC.similar({front: "What is osmosis?", back: "x"}, {front: "Osmosis", back: "y"}));
  assert(NC.similar({front: "Define osmosis", back: "a"}, {front: "What is osmosis?", back: "b"}));
  assert(!NC.similar({front: "Mitosis", back: "a"}, {front: "Meiosis", back: "b"}));
  assert(NC.similar({front: "The ____ is the powerhouse of the cell", back: "mitochondria"}, {front: "Powerhouse of the cell", back: "The mitochondria"}));
  assert(!NC.similar({front: "What is the capital of France?", back: "Paris"}, {front: "What is the capital of Spain?", back: "Madrid"}));
});
t("markDupes: flags cards the deck already has; keeps everything else", () => {
  const deck = [{id: "a", front: "What is osmosis?", back: "Water moving across a membrane"}, {id: "b", front: "ATP", back: "Energy currency"}];
  const draft = [{front: "Osmosis", back: "movement of water across a membrane"}, {front: "Diffusion", back: "movement from high to low"}, {front: "ATP", back: "the cell's energy currency"}];
  assert.deepStrictEqual(NC.markDupes(draft, deck).map(c => c.dup), [true, false, true]);
  assert.deepStrictEqual(NC.markDupes(draft, []).map(c => c.dup), [false, false, false]);
  assert.deepStrictEqual(NC.markDupes([draft[0], {front: "Osmosis", back: "same"}], [], true).map(c => c.dup), [false, true]);
  assert.deepStrictEqual(NC.markDupes(draft, null).map(c => c.dup), [false, false, false]);
});

const SOURCE = "Photosynthesis takes place in the chloroplasts. Chlorophyll absorbs red and blue light. The light reactions make ATP and NADPH, and the Calvin cycle uses them to fix carbon dioxide into glucose. A leaf has about 300 stomata per square millimetre.";
t("grounded: cards that say only what the text says pass; invented numbers and facts fail", () => {
  assert(NC.grounded({front: "Where does photosynthesis take place?", back: "In the chloroplasts"}, SOURCE));
  assert(NC.grounded({front: "What does the Calvin cycle use?", back: "ATP and NADPH from the light reactions, to fix carbon dioxide into glucose"}, SOURCE));
  assert(NC.grounded({front: "How many stomata per square millimetre?", back: "About 300"}, SOURCE));
  assert(!NC.grounded({front: "How many stomata per square millimetre?", back: "About 450"}, SOURCE), "a number that is not in the text");
  assert(!NC.grounded({front: "Who discovered the Calvin cycle?", back: "Melvin Calvin won a Nobel prize for mapping it with radioactive isotopes"}, SOURCE), "invented history");
});
t("vetAi: plain text, grounded, deduped, capped; counts what it dropped", () => {
  const raw = {cards: [
    {front: "**Where** does photosynthesis happen?", back: "In the <b>chloroplasts</b>", quote: "takes place in the chloroplasts"},
    {front: "Where is photosynthesis carried out?", back: "In the chloroplasts", quote: "takes place in the chloroplasts"},
    {front: "What color of light does chlorophyll absorb?", back: "Red and blue light", quote: "Chlorophyll absorbs red and blue light"},
    {front: "What is the capital of Mars?", back: "Olympus Mons, a volcano 25 km tall", quote: "Chlorophyll absorbs red and blue light"},
    {front: "Which gas does the Calvin cycle fix?", back: "Carbon dioxide", quote: "Calvin cycle was invented by aliens"},
    {front: "", back: "empty front"}, null, "text", {front: "Same", back: "Same"},
    {front: "What do the light reactions make?", back: "ATP and NADPH", quote: ""}]};
  const v = NC.vetAi(raw, SOURCE, {max: 3, tidy: Q.aiTidyText});
  assert.deepStrictEqual(v.cards.map(c => c.front), ["Where does photosynthesis happen?", "What color of light does chlorophyll absorb?", "What do the light reactions make?"]);
  assert.strictEqual(v.cards[0].back, "In the chloroplasts"); assert(v.cards.every(c => c.kind === "ai"));
  assert.deepStrictEqual(v.dropped, {ungrounded: 2, invalid: 4, dup: 1, over: 0});
  const cap = NC.vetAi(raw, SOURCE, {max: 1}); assert.strictEqual(cap.cards.length, 1); assert(cap.dropped.over >= 1);
  assert.deepStrictEqual(NC.vetAi(null, SOURCE).cards, []); assert.deepStrictEqual(NC.vetAi({cards: "no"}, SOURCE).cards, []);
  assert.deepStrictEqual(NC.vetAi([{front: "Q?? long", back: "x".repeat(900)}], SOURCE).dropped.invalid, 1, "oversized backs are dropped");
});
t("vetAi output also passes the app's card gate (aiGateCards)", () => {
  const v = NC.vetAi([{front: "Where does photosynthesis take place?", back: "In the chloroplasts"}, {front: "What absorbs red and blue light?", back: "Chlorophyll"}], SOURCE, {tidy: Q.aiTidyText});
  const g = Q.aiGateCards(v.cards, {max: 10}); assert.strictEqual(g.cards.length, 2); assert.deepStrictEqual(g.dropped, {dup: 0, long: 0, empty: 0});
});
t("the source of the module follows the repo conventions", () => {
  assert(/\/\* ===== module: 97-notecards\.js ===== \*\/[\s\S]*\/\* ===== module: 97-breakdown\.js ===== \*\//.test(src) && src.indexOf("module: 97-notecards.js") < src.indexOf("module: 97-breakdown.js"), "js module sits before 97-breakdown.js");
  assert(src.indexOf("module: 97-notecards.css") < src.indexOf("module: 99-motion-a11y-tz.css"), "css module sits before 99-motion-a11y-tz.css");
  const mod = src.slice(src.indexOf("module: 97-notecards.js"), src.indexOf("module: 97-breakdown.js"));
  assert(/srcNote: noteId/.test(mod), "new cards carry srcNote");
});
console.log(`notecards: ${n} checks passed`);
