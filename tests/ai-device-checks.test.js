// node tests/ai-device-checks.test.js: the checks that keep a small on-device model's mistakes from reaching a student
// (src/js/01-ai.js): is a fact really from the notes (aiBasisOk), and are a syllabus's weights and dates really in it
// (aiDevCheckSyllabus).
const fs = require("fs"), path = require("path"), assert = require("assert");
const src = fs.readFileSync(path.join(__dirname, "..", "src", "js", "01-ai.js"), "utf8");
const fn = name => { const i = src.indexOf(`function ${name}(`), j = src.indexOf("\n}\n", i) + 2; assert(i >= 0, name); return src.slice(i, j); };
eval(fn("aiBasisOk") + "\n" + fn("aiDevCheckSyllabus"));
let n = 0; const ok = (c, m) => { n++; assert(c, m); };

const NOTES = `The 13th Amendment (1865) abolished slavery. Many freed families became sharecroppers: they farmed land owned by someone
else in exchange for a share of the crop, which often trapped them in debt. Violent groups such as the Ku Klux Klan used terror to stop
Black citizens from voting. Congress passed the Enforcement Acts of 1870-1871 to fight them. The 15th Amendment (1870) protected the
right to vote regardless of race.`;
// true facts in other words: kept
for (const f of ["The 13th Amendment, ratified in 1865, officially ended slavery.", "Sharecropping often left families deeply in debt.",
  "The Ku Klux Klan used intimidation to keep Black people from voting.", "Congress fought the Klan with the Enforcement Acts."]) ok(aiBasisOk(f, NOTES), "kept: " + f);
// invented specifics: dropped
for (const f of ["The 15th Amendment was passed in 1875.", "General Sherman led the Freedmen's Bureau.", "Ulysses Grant won the 1868 election.",
  "Mitochondria are purple bananas that sing loudly.", ""]) ok(!aiBasisOk(f, NOTES), "dropped: " + (f || "(empty)"));

const SYL = `HIST 101, Fall 2026. Grading: Quizzes 20% (10 quizzes), Midterm 30%, Research Paper 25%, Final Exam 25%.
Quiz 1 is on September 9. The midterm is Oct 14. The research paper is due 11/20. The final exam is in the last week of term.`;
const items = [{title: "Quiz 1", weight: 2, due: "2026-09-09"}, {title: "Midterm", weight: 30, due: "2026-10-14"}, {title: "Research Paper", weight: 25, due: "2026-11-20"},
  {title: "Final Exam", weight: 25, due: "2026-12-10"}, {title: "Homework 1", weight: 10, due: "2026-09-02"}];
aiDevCheckSyllabus(items, SYL);
ok(items[0].weight === 2 && items[1].weight === 30 && items[2].weight === 25, "weights in the syllabus, or following from one there (20% over 10 quizzes), are kept");
ok(items[4].weight === null, "a weight that isn't there is left blank");
ok(!items[0].source && !items[1].source && !items[2].source, "dates written in the syllabus (September 9, Oct 14, 11/20) aren't marked");
ok(items[3].source === "ai-low" && items[3].due === "2026-12-10", "a date the AI worked out ('the last week of term') is kept but marked to double-check");
ok(items[4].source === "ai-low", "and so is one that isn't there at all");

// an answer field written into the answer text by a small model ("Found: false. There are no notes...") is taken out
eval(src.match(/const aiNoFieldEcho = [^\n]+/)[0].replace("const ", "var "));
ok(aiNoFieldEcho("Found: false. There are no notes about that.") === "There are no notes about that.", "'Found: false.' is taken out of an answer");
ok(aiNoFieldEcho("Answer: The Krebs cycle makes NADH.") === "The Krebs cycle makes NADH.", "'Answer:' too");
ok(aiNoFieldEcho("Found in your notes: the Krebs cycle.") === "Found in your notes: the Krebs cycle.", "but ordinary sentences are left alone");
// a small model's answer that stops mid-phrase is ended at its last whole thought
eval(src.match(/const AI_DANGLE = [^\n]+/)[0].replace("const ", "var ") + "\n" + fn("aiWholeSentence"));
ok(aiWholeSentence("I found your sticky note about being grumpy on the") === "I found your sticky note about being grumpy.", "'...grumpy on the' ends as '...grumpy.'");
ok(aiWholeSentence("Your bio quiz is tomorrow, so review the cards and") === "Your bio quiz is tomorrow, so review the cards.", "a dangling 'and' goes too");
ok(aiWholeSentence("Here it is!") === "Here it is!" && aiWholeSentence("Due Friday: Lab 3") === "Due Friday: Lab 3", "finished answers and labels are left alone");
ok(aiWholeSentence("It is the") === "It is the", "too little left to make sense: unchanged");
ok(aiWholeSentence("You have three tasks due today") === "You have three tasks due today", "an answer that doesn't dangle is left as it is");
// the key terms in slides and notes, found by code, so a small model has to name them on its cards
eval(src.match(/const AI_TERM_SKIP = [^\n]+/)[0].replace("const ", "var ") + "\n" + fn("aiKeyTerms"));
const SLIDES = `Psychoanalytic Theory\nFreud's Levels of Awareness\nConscious\nContains all the material a person is aware of at any one time\nPreconscious\nContains material that can be retrieved rather easily through conscious effort\nPersonality structure\nId\nPleasure principle\nReflex action\nEgo\nProblem solver\nReality tester\nObjectives\nSecurity operations: measures the individual employs to reduce anxiety and enhance security\nThe **self-system** protects self-esteem.\nImplications for Nursing\nPrioritizing: what is most important in the sequencing of nursing actions`;
const KT = aiKeyTerms(SLIDES, 20);
ok(["Conscious", "Preconscious", "Id", "Ego", "Security operations", "self-system"].every(t => KT.includes(t)), "slide terms are found: " + KT.join(", "));
ok(!KT.some(t => /^(Objectives|Implications for Nursing|Prioritizing|Psychoanalytic Theory)$/.test(t)), "headings and list words aren't: " + KT.join(", "));
// the same rules work for any subject (they look at the shape of the text, never at the topic)
const MIXED = {
  econ: "Market Structures\nMonopoly\nA single seller controls the whole market and sets the price\nOligopoly\nA few large firms dominate the market\nElasticity: how much demand changes when the price changes",
  chem: "Covalent bond: two atoms share a pair of electrons\nAn ion is an atom that has gained or lost electrons.\nIsotopes\nAtoms of one element with different numbers of neutrons",
  history: "Causes of World War I\nMilitarism\nArms race\nLarge standing armies\nNationalism\nPride in one's nation\nRivalry between empires",
  cs: "Recursion: a function that calls itself on a smaller input\nThe **base case** stops the recursion.\nBig-O notation describes how running time grows with input size."};
const W = {econ: ["Monopoly", "Oligopoly", "Elasticity"], chem: ["Covalent bond", "ion", "Isotopes"], history: ["Militarism", "Nationalism"], cs: ["Recursion", "base case", "Big-O notation"]};
for (const k of Object.keys(MIXED)) { const t = aiKeyTerms(MIXED[k], 20).map(x => x.toLowerCase()); ok(W[k].every(w => t.includes(w.toLowerCase())), `${k}: ${t.join(", ")}`); }
ok(aiKeyTerms("Osmosis is the diffusion of water across a membrane. Cells need it.").includes("Osmosis"), "'X is the...' sentences give their term");
console.log(`ai-device-checks: ${n} checks passed`);
