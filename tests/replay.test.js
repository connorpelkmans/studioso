// node tests/replay.test.js
const assert = require("assert");
const src = require("../scripts/app-files").source();
const a = src.indexOf("/*REPLAY-START*/"), b = src.indexOf("/*REPLAY-END*/");
assert(a > 0 && b > a, "the REPLAY block is in the app");
const R = new Function(src.slice(a, b) + "; return RPLAY;")();
let n = 0; const t = (name, fn) => { fn(); n++; console.log("ok -", name); };

// A 20-minute lecture: one topic every 4 minutes, a sentence every 20 seconds
const TOPICS = [
  ["osmosis", "Osmosis is water moving across a semipermeable membrane toward the side with more solute", "Tonicity compares solute concentration on two sides of a membrane", "A hypertonic solution makes the cell shrink as water leaves"],
  ["diffusion", "Diffusion moves particles from high concentration to low concentration", "Facilitated diffusion uses channel proteins and carrier proteins", "No energy is needed because particles follow the gradient"],
  ["active", "Active transport uses ATP to pump ions against the gradient", "The sodium potassium pump moves three sodium out and two potassium in", "Secondary transport couples glucose to the sodium gradient"],
  ["endocytosis", "Endocytosis wraps the plasma membrane around large particles", "Phagocytosis is cell eating by white blood cells", "Receptor mediated endocytosis brings in cholesterol with LDL"],
  ["signaling", "Cell signaling starts when a ligand binds a receptor protein", "G protein coupled receptors activate second messengers like cyclic AMP", "Kinase cascades amplify the signal inside the cell"]];
const pieces = []; let tm = 0;
TOPICS.forEach(tp => { for (let k = 0; k < 12; k++) { pieces.push({t: tm, s: tp[1 + (k % 3)] + (k > 2 ? ` and so on number ${k}.` : ".")}); tm += 20000; } });
const text = pieces.map(p => p.s).join(" ");
const DUR = tm;
const at = R.anchorsFor(text, pieces);

t("every caption piece gets an anchor, in order", () => {
  assert.strictEqual(at.length, pieces.length);
  assert(at.every((x, i) => !i || (x[0] > at[i - 1][0] && x[1] >= at[i - 1][1])));
  assert.strictEqual(at[3][1], 60000);
});
t("live captions start a little before they were finished", () => {
  const live = R.anchorsFor("Hello there everyone. Today is osmosis.", [{t: 5000, s: "Hello there everyone."}, {t: 9000, s: "Today is osmosis."}], {live: true});
  assert(live[0][1] < 5000 && live[0][1] >= 0 && live[1][1] < 9000 && live[1][1] >= live[0][1], JSON.stringify(live));
});
t("edited text keeps the anchors it still has", () => {
  const edited = text.replace(pieces[5].s, "Something the student retyped.");
  const ea = R.anchorsFor(edited, pieces);
  assert(ea.length === pieces.length - 1);
});
t("time at a character: interpolated between anchors, the end is the duration", () => {
  const m = R.mapper([[0, 0], [100, 10000]], 200, 30000);
  assert.strictEqual(m(50), 5000); assert.strictEqual(m(100), 10000); assert.strictEqual(m(150), 20000); assert.strictEqual(m(500), 30000);
  const even = R.mapper([], 1000, 60000); assert.strictEqual(even(500), 30000);
  assert.strictEqual(R.mapper([[5, -3], ["x", 2], [9, 9e9]], 100, 0)(50), 0, "bad anchors from sync are dropped");
});
t("transcribed parts join with an anchor at each part", () => {
  const j = R.joinParts([["Part one words.", 0], ["", 300000], ["Part three.", 600000]], "\n\n");
  assert.strictEqual(j.text, "Part one words.\n\nPart three.");
  assert.deepStrictEqual(j.at, [[0, 0], [17, 600000]]);
});

const IX = R.index(R.units(text, at, DUR));
const near = (got, want, slack, what) => assert(got != null && Math.abs(got - want) <= slack, `${what}: ${got == null ? "no time" : R.clock(got)} vs ${R.clock(want)}`);
t("the transcript becomes windows of about 20 seconds", () => { assert(IX.wins.length > 20 && IX.wins.length < 80, IX.wins.length); });
t("notes written afterwards: each line lands where it was said", () => {
  const note = "Membranes lecture\n- osmosis: water goes toward more solute across semipermeable membrane\n- facilitated diffusion = channel proteins, carrier proteins\n\nNa/K pump: 3 sodium out, 2 potassium in\n* phagocytosis = cell eating (white blood cells)\nGPCRs activate second messengers (cAMP)\nRemember to buy milk";
  const segs = R.noteSegs(note), al = R.align(IX, segs.map(s => s.s));
  const byText = s => al[segs.findIndex(x => x.s.startsWith(s))];
  near(byText("osmosis").t, 0, 25000, "osmosis");
  near(byText("facilitated").t, 4 * 60000 + 20000, 30000, "facilitated diffusion");
  near(byText("Na/K").t, 8 * 60000 + 40000, 30000, "pump");
  near(byText("phagocytosis").t, 12 * 60000 + 40000, 30000, "phagocytosis");
  near(byText("GPCRs").t, 16 * 60000 + 40000, 30000, "GPCRs");
  assert.strictEqual(byText("Remember").t, null, "a line about something else stays untimed");
});
t("a note's title and headings take the time of the first line under them", () => {
  const segs = R.noteSegs("Membrane Transport (Wed)\n- osmosis: water goes toward more solute across semipermeable membrane\n## Pumps\n- Na/K pump: 3 sodium out, 2 potassium in");
  assert.deepStrictEqual(segs.map(s => !!s.head), [true, false, true, false]);
  const tl = R.timeLines(IX, segs);
  near(tl[1].t, 0, 25000, "osmosis"); assert.strictEqual(tl[0].t, tl[1].t, "title"); assert.strictEqual(tl[2].t, tl[3].t, "heading");
  assert.deepStrictEqual(R.noteSegs("Just one line about osmosis").map(s => s.head), [false], "a one-line note is no title");
});
t("a line out of order still finds its place when the match is strong", () => {
  const segs = ["Kinase cascades amplify the signal inside the cell", "Tonicity compares solute concentration on two sides of a membrane"];
  const al = R.align(IX, segs);
  near(al[0].t, 16 * 60000 + 40000, 60000, "kinase"); near(al[1].t, 20000, 60000, "tonicity, said earlier");
});
t("on their own (summary points, a card), each is placed independently", () => {
  const al = R.align(IX, ["Receptor mediated endocytosis brings cholesterol in with LDL", "Hypertonic solution: the cell shrinks"], {order: false});
  near(al[0].t, 12 * 60000 + 40000, 60000, "LDL"); near(al[1].t, 40000, 60000, "hypertonic");
});
t("a line typed during the lecture is placed where it was said just before", () => {
  const got = R.refineTyped(IX, "sodium potassium pump 3 out 2 in", 9 * 60000 + 10000);
  assert(got <= 9 * 60000 + 10000 && got >= 8 * 60000, R.clock(got));
  assert.strictEqual(R.refineTyped(IX, "ask about the homework", 300000), 296000, "nothing matching: a few seconds before");
});
t("slides: each page lands where its words were said, in order", () => {
  const deck = "[Slide 1] Membrane transport\nOsmosis and tonicity\n[Slide 2] Diffusion\nFacilitated diffusion with channel proteins\n[Slide 3] Active transport\nATP pumps ions against the gradient, sodium potassium pump";
  const pg = R.pageSegs(deck); assert.deepStrictEqual(pg.map(p => p.key), ["p1", "p2", "p3"]); assert.strictEqual(pg[1].label, "Slide 2");
  const al = R.align(IX, pg.map(p => p.s));
  near(al[0].t, 0, 40000, "slide 1"); near(al[1].t, 4 * 60000, 40000, "slide 2"); near(al[2].t, 8 * 60000, 40000, "slide 3");
});
t("a tidied transcript: paragraphs, headings and marks get times", () => {
  const org = "## Osmosis\n\nOsmosis is water moving across a semipermeable membrane toward the side with more solute.\n\n## Active Transport\n\nActive transport uses ATP to pump ions against the gradient. The sodium potassium pump moves three sodium out.\n\n★ 14:32";
  const bl = R.docBlocks(org), tb = R.timeBlocks(IX, bl);
  assert.deepStrictEqual(bl.map(x => x.k), ["h", "p", "h", "p", "mark"]);
  near(tb[1].t, 0, 25000, "osmosis paragraph"); assert.strictEqual(tb[0].t, tb[1].t, "a heading takes its text's time");
  near(tb[3].t, 8 * 60000, 40000, "active transport paragraph"); assert.strictEqual(tb[4].t, 14 * 60000 + 32000);
});
t("a long paragraph starts where its first sentence was said", () => {
  const S = ["Welcome everyone, today is about membranes.", "Osmosis moves water across a semipermeable membrane toward more solute.", "Tonicity compares the solute on both sides of the membrane.",
    "Diffusion moves particles from high concentration to low concentration.", "Facilitated diffusion uses channel proteins and carrier proteins.", "Active transport spends ATP to pump ions against the gradient.",
    "The sodium potassium pump sends three sodium out and two potassium in.", "Endocytosis wraps the plasma membrane around large particles.", "Phagocytosis is cell eating by white blood cells.", "Next week we start cell signaling and receptors."];
  const ps = S.map((s, i) => ({t: i * 6000, s})), tx = S.join(" "), X = R.index(R.units(tx, R.anchorsFor(tx, ps), 60000));
  const tb = R.timeBlocks(X, R.docBlocks("## A\n\n" + S.slice(0, 5).join(" ") + "\n\n## B\n\n" + S.slice(5).join(" ")));
  assert(tb[1].t <= 500, tb[1].t); assert(Math.abs(tb[3].t - 30000) <= 1000, tb[3].t);
});
t("line keys: stable, and repeated lines kept apart", () => {
  const s = R.noteSegs("Intro\n- Osmosis\n\n- osmosis \nIntro");
  assert.strictEqual(s.length, 4); assert.strictEqual(s[0].key, R.lineKey("Intro")); assert.strictEqual(s[3].key, R.lineKey("Intro") + ".1");
  assert.strictEqual(s[1].key, s[2].key.split(".")[0]);
});
t("pins from sync are cleaned", () => assert.deepStrictEqual(R.cleanPins({abc: 1000, "p3": 2.5, "bad key!": 5, x: -1, y: "7"}), {abc: 1000, p3: 3, y: 7}));
t("clock", () => { assert.strictEqual(R.clock(872000), "14:32"); assert.strictEqual(R.parseClock("14:32"), 872000); assert.strictEqual(R.parseClock("1:02:05"), 3725000); });
t("a long lecture is quick to match", () => {
  const big = []; for (let i = 0; i < 400; i++) big.push({t: i * 9000, s: TOPICS[i % 5][1 + (i % 3)] + ` point ${i} about topic ${Math.floor(i / 20)}.`});
  const bt = big.map(p => p.s).join(" "), t0 = Date.now(), BX = R.index(R.units(bt, R.anchorsFor(bt, big), 3600000));
  R.align(BX, Array.from({length: 300}, (_, i) => TOPICS[i % 5][1]));
  assert(Date.now() - t0 < 3000, `took ${Date.now() - t0} ms`);
});
console.log(`\n${n} passed`);
