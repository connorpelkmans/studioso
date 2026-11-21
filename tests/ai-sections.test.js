// node tests/ai-sections.test.js: the study set pipeline's no-AI half (src/js/01-ai-sections.js, between SECTIONS-START and
// SECTIONS-END): headings found in notes, slides, Word headings and PDF font sizes; sections of a useful size; filler left out;
// the cards shared across sections by how much each has to learn.
const fs = require("fs"), path = require("path"), assert = require("assert"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "..", "src", "js", "01-ai-sections.js"), "utf8");
const body = src.slice(src.indexOf("/*SECTIONS-START*/"), src.indexOf("/*SECTIONS-END*/"));
const S = vm.runInNewContext(body + "\nSBSECT;", {});
let n = 0; const ok = (c, m) => { n++; assert(c, m); }, eq = (a, b, m) => { n++; assert.deepStrictEqual(JSON.parse(JSON.stringify(a)), JSON.parse(JSON.stringify(b)), m); };
const para = (topic, k) => Array.from({length: k}, (_, i) => `${topic} fact ${i + 1} is an important idea that students should remember because it explains how the ${topic.toLowerCase()} works in the cell.`).join(" ");

/* Headings: what is and isn't one */
eq(S.headingOf("## Glycolysis", para("x", 1)), {level: 2, title: "Glycolysis"}, "markdown heading");
eq(S.headingOf("2.1 The Krebs Cycle", para("x", 1)).level, 2, "numbered outline heading, level from its number");
ok(S.headingOf("CELLULAR RESPIRATION", para("x", 1)), "an all-caps line before a paragraph");
ok(S.headingOf("Key Terms:", "- ATP: the cell's energy currency"), "a short line ending in a colon, before a list");
ok(S.headingOf("The Electron Transport Chain", para("x", 2)), "a short Title Case line before a paragraph");
ok(!S.headingOf("Glycolysis happens in the cytoplasm.", para("x", 1)), "a sentence is never a heading");
ok(!S.headingOf("2. ATP is made.", para("x", 1)), "a numbered sentence isn't either");
ok(!S.headingOf("The cell makes ATP in many ways and stores some of it for later use", para("x", 1)), "a long line isn't");
eq(S.headingOf("Slide 4:", "Mitochondria").slide, 4, "a slide marker from the slides reader");
ok(S.headingOf("Lecture 7: Membranes", para("x", 1)), "Lecture 7: Membranes");

/* Notes with headings become sections, with their place in the outline */
const notes = `# Cell Respiration\n\n## Glycolysis\n${para("Glycolysis", 6)}\n\n## Krebs Cycle\n${para("Krebs", 6)}\n\n## Electron Transport Chain\n${para("ETC", 7)}\n\n## References\nCampbell Biology, 12th ed. Smith et al. 2020.`;
const secs = S.fromSources([{name: "Lecture.pdf", text: notes}], "cloud");
eq(secs.map(s => s.title), ["Glycolysis", "Krebs Cycle", "Electron Transport Chain"], "one section per heading; References left out");
eq(S.label(secs[0]), "Cell Respiration › Glycolysis", "each section knows where it sits");

/* Slides: each slide's first line is its title; tiny slides join their neighbours */
const slides = Array.from({length: 6}, (_, i) => `Slide ${i + 1}:\n${["Title Slide", "Mitochondria", "ATP Synthase", "Thanks!", "Questions?", "Glycolysis"][i]}\n${i === 0 ? "BIO 110, Week 4" : i >= 3 && i <= 4 ? "" : para(["", "Mitochondria", "ATP", "", "", "Glycolysis"][i], 5)}`).join("\n\n");
const ss = S.fromSources([{name: "Week4.pptx", text: "Source file: Week4.pptx\n\n" + slides}], "cloud");
ok(ss.length >= 2 && ss.length <= 4 && ss.every(s => s.words >= 15), "slides become a few sections of real content: " + ss.map(s => s.title + ":" + s.words).join(", "));
ok(!ss.some(s => /Thanks|Questions/.test(s.title)), "the thank-you and questions slides are left out");

/* A PDF read on the device: big lines are headings, page numbers and running headers go */
const P = (n, rows) => ({n, lines: rows.map(([text, size]) => ({text, size}))});
const pdf = [P(1, [["BIO 110 Notes", 9], ["Photosynthesis", 20], ...para("Light", 6).split(/(?<=\.)\s/).map(t => [t, 10]), ["1", 9]]),
  P(2, [["BIO 110 Notes", 9], ["Light Reactions", 16], ...para("Light reactions", 6).split(/(?<=\.)\s/).map(t => [t, 10]), ["2", 9]]),
  P(3, [["BIO 110 Notes", 9], ["Calvin Cycle", 16], ...para("Calvin", 6).split(/(?<=\.)\s/).map(t => [t, 10]), ["3", 9]])];
const ps = S.fromSources([{name: "Photosynthesis.pdf", pdf}], "cloud");
eq(ps.map(s => s.title), ["Photosynthesis", "Light Reactions", "Calvin Cycle"], "headings from font size: " + ps.map(s => s.title).join(", "));
ok(!ps.some(s => /BIO 110 Notes|^\d$/m.test(s.text)), "the running header and page numbers are gone");
eq(S.label(ps[1]), "Photosynthesis › Light Reactions", "and the outline comes from the sizes too");

/* Size: long sections split at paragraphs, never mid-sentence; the number of sections is capped */
const long = `## Membranes\n${Array.from({length: 8}, (_, i) => para("Membrane " + i, 6)).join("\n\n")}`;
const ls = S.fromSources([{text: long}], "cloud");
ok(ls.length >= 2 && ls.every(s => s.words <= S.SIZES.cloud.max) && ls.every(s => /[.]$/.test(s.text.trim())), "a long section splits into parts under the size, at sentence ends: " + ls.map(s => s.words).join(", "));
ok(/part 2/.test(ls[1].title), "the parts are named");
const many = Array.from({length: 40}, (_, i) => `## Topic ${i + 1}\n${para("Topic " + i, 2)}`).join("\n\n");
ok(S.fromSources([{text: many}], "cloud").length <= S.SIZES.cloud.maxSections, "no more than " + S.SIZES.cloud.maxSections + " sections");
ok(S.fromSources([{text: many}], "small").every(s => s.words <= S.SIZES.small.max), "a small engine gets shorter sections");

/* Sharing the cards */
const pl = S.plan(secs, 12, "cloud");
eq(pl.reduce((a, x) => a + x.count, 0), 12, "exactly the 12 asked for");
ok(pl.length === 3 && pl.every(x => x.count >= 1), "every section gets some");
ok(pl[2].count >= pl[0].count, "the longest section gets the most");
const capd = S.plan(secs, 60, "cloud");
ok(capd.every(x => x.count <= S.SIZES.cloud.perSection), "never more than " + S.SIZES.cloud.perSection + " from one section (more just repeats it)");
const auto = S.plan(secs, 0, "cloud");
ok(auto.reduce((a, x) => a + x.count, 0) >= secs.length, "'as many as it supports' scales with the material");
ok(S.plan(secs, 2, "cloud").length === 2, "fewer cards than sections: the richest sections get them");
eq(S.plan([], 10, "cloud"), [], "nothing to plan");

/* When to split at all */
ok(!S.worth(secs, 300, "cloud"), "short material keeps one request on a cloud engine (no slower, no dearer)");
ok(S.worth(secs, 2000, "cloud"), "long material is split");
ok(S.worth(secs, 300, "small"), "a small engine always gets sections");
ok(!S.worth(secs.slice(0, 1), 5000, "cloud"), "one section: nothing to split");

console.log(`ai-sections: ${n} checks passed`);
