// Tests for Version History (Pro): snapshots, throttling, pruning, risky changes, comparing and restoring deck versions; and Rubric Check's pure part
const assert = require("assert");
const s = require("../scripts/app-files").source();
let n = 0; const ok = (c, m) => { n++; assert(c, m); };
const between = (a, b) => { const i = s.indexOf(a), j = s.indexOf(b, i); assert(i >= 0 && j > i, "marker " + a); return s.slice(i + a.length, j); };
const VH = new Function(between("/*VH-START*/", "/*VH-END*/") + ";return VH;")();
const MIN = 60000, DAY = 864e5, T0 = Date.UTC(2026, 9, 1, 14, 0);

/* Notes: one snapshot per 10 minutes of editing, plus every risky change */
const essay = "Thesis: Urban green space lowers summer heat.\nEvidence: Phoenix parks are 4°C cooler than nearby blocks.\nCounterpoint: water use.";
let l = VH.add([], VH.noteSnap(essay, T0, "Before editing"));
ok(l.length === 1 && l[0].text === essay && l[0].label === "Before editing", "first snapshot is kept");
ok(VH.add(l, VH.noteSnap(essay, T0 + 20 * MIN, "x")) === l, "the same text twice is one version");
ok(VH.add(l, VH.noteSnap(essay + " More.", T0 + 4 * MIN, "Before editing")) === l, "an edit 4 minutes later is throttled");
ok(VH.add(l, VH.noteSnap(essay + " More.", T0 + 9 * MIN + 59000, "Before editing")) === l, "still throttled just under 10 minutes");
l = VH.add(l, VH.noteSnap(essay + " More.", T0 + 10 * MIN, "Before editing"));
ok(l.length === 2, "10 minutes later a new snapshot is taken");
l = VH.add(l, VH.noteSnap("Thesis only", T0 + 11 * MIN, "Before a big change"), {force: true});
ok(l.length === 3 && l[2].label === "Before a big change", "a risky change is kept even a minute after the last one");
ok(VH.add([], VH.noteSnap("   \n ", T0, "x")).length === 0, "a blank note isn't a version");
ok(VH.noteRisk(essay, null) === "Before deleting", "deleting a note is risky");
ok(VH.noteRisk(essay, essay + " typo fix") === "", "typing more isn't risky");
ok(VH.noteRisk(essay, "Thesis") === "Before a big change", "cutting most of a note is risky");
ok(VH.noteRisk("x".repeat(500), "x".repeat(250)) === "Before a big change", "cutting 250 characters is risky");

/* Pruning: 30 days, a size cap per item and overall */
let old = [];
for (let d = 40; d >= 0; d -= 5) old = VH.add(old, VH.noteSnap("Day " + d + " notes on mitosis", T0 - d * DAY, ""), {force: true});
const pr = VH.prune(old, T0);
ok(pr.every(x => x.at >= T0 - 30 * DAY) && pr.length === 7 && pr[0].text === "Day 30 notes on mitosis", "versions past 30 days go: " + pr.map(x => x.text).join("|"));
const small = Object.assign({}, VH.CAP, {item: 500, total: 900});
let big = [];
for (let i = 0; i < 6; i++) big = VH.add(big, VH.noteSnap(String(i).repeat(150), T0 + i * 11 * MIN, ""), {cap: small});
ok(big.reduce((a, x) => a + x.n, 0) <= 500 && big[big.length - 1].text === "5".repeat(150), "an item over its size cap drops its oldest versions");
const all = VH.trimAll({"note:a": [VH.noteSnap("a".repeat(300), T0 - 2 * DAY), VH.noteSnap("b".repeat(300), T0 - DAY)], "deck:d": [VH.noteSnap("c".repeat(300), T0 - 3 * DAY), VH.noteSnap("d".repeat(300), T0)], "note:gone": [VH.noteSnap("e", T0 - 31 * DAY)]}, T0, small);
ok(!all["note:gone"] && !all["deck:d"].some(x => x.text[0] === "c") && !all["note:a"].some(x => x.text[0] === "a") && all["deck:d"].length === 1, "over the total cap the oldest versions anywhere go first: " + JSON.stringify(Object.keys(all).map(k => k + all[k].length)));

/* Decks: what counts as a change, and which changes are risky */
const card = (id, front, back, extra) => Object.assign({id, front, back, box: 2, due: "2026-10-05", seen: 4, right: 3, wrong: 1, last: "2026-09-30"}, extra || {});
const deck = {id: "d1", name: "BIO 101 Cell Biology", cards: [
  card("k1", "Mitochondria", "Make most of the cell's ATP through cellular respiration"),
  card("k2", "Ribosome", "Builds proteins from amino acids"),
  card("k3", "Osmosis", "Water moving across a membrane toward higher solute concentration"),
  card("k4", "Nucleus", "Holds the cell's DNA"),
  card("k5", "Golgi apparatus", "Packages and ships proteins")]};
const reviewed = Object.assign({}, deck, {cards: deck.cards.map((c, i) => i === 0 ? Object.assign({}, c, {box: 3, due: "2026-10-12", seen: 5, right: 4, last: "2026-10-01", rate: "good", fs: {s: 7, d: 4}}) : c)});
ok(!VH.deckRisk(deck, reviewed).content, "a review (schedule only) is not a content change");
ok(VH.deckSig(deck) === VH.deckSig(reviewed), "reviews don't change a deck's signature");
const edited = Object.assign({}, deck, {cards: deck.cards.map(c => c.id === "k2" ? Object.assign({}, c, {back: "Builds proteins from amino acids (rRNA + protein)"}) : c)});
const r1 = VH.deckRisk(deck, edited);
ok(r1.content && !r1.risky && r1.label === "Before editing", "one card edit is an ordinary change");
const three = Object.assign({}, deck, {cards: deck.cards.slice(3)});
const r2 = VH.deckRisk(deck, three);
ok(r2.risky && r2.label === "Before 3 cards were deleted", "deleting 3 cards is risky: " + r2.label);
const imported = Object.assign({}, deck, {cards: deck.cards.concat([1, 2, 3, 4, 5].map(i => card("n" + i, "Term " + i, "Def " + i)))});
ok(VH.deckRisk(deck, imported).label === "Before 5 cards were added" && VH.deckRisk(deck, imported).risky, "an import of 5 cards is risky");
const aiEdit = Object.assign({}, deck, {cards: deck.cards.map(c => Object.assign({}, c, {back: c.back + " (simplified)"}))});
ok(VH.deckRisk(deck, aiEdit).risky && /5 cards changed/.test(VH.deckRisk(deck, aiEdit).label), "an AI edit of every card is risky");
ok(VH.deckRisk(deck, null).label === "Before deleting this deck", "deleting a deck is risky");
ok(VH.deckRisk(deck, Object.assign({}, deck, {name: "Cells"})).label === "Before renaming", "a rename counts as a change");
ok(VH.add([], VH.deckSnap({name: "Empty", cards: []}, T0, "")).length === 0, "an empty deck isn't a version");

/* Restoring a deck version */
ok(VH.similar("Mitochondria", "Mitochondrion") >= 0.6 && !VH.meaningful(card("a", "Mitochondria", "Powerhouse of the cell"), card("a", "Mitochondrion", "Powerhouse of the cell.")), "a spelling fix is a small change");
ok(VH.meaningful(card("a", "ATP", "Energy currency"), card("a", "ADP", "Energy currency")) === false || VH.similar("ATP", "ADP") > 0, "three-letter terms one letter apart count as close");
ok(VH.meaningful(card("a", "Osmosis", "Water moving across a membrane"), card("a", "Diffusion", "Particles spreading from high to low concentration")), "a different term and definition is a meaningful change");
// Today: k1 front was reworded completely and its schedule moved on, k2 got a typo fix, k3 and k4 were deleted, n1 was added
const today = {id: "d1", name: "Cells", cards: [
  card("k1", "Cellular respiration", "Glucose + O2 → CO2 + H2O + ATP", {box: 1, due: "2026-10-20", seen: 1, right: 0, wrong: 1, last: "2026-10-19"}),
  card("k2", "Ribosome", "Builds proteins from amino-acids", {box: 4, due: "2026-11-02"}),
  card("k5", "Golgi apparatus", "Packages and ships proteins"),
  card("n1", "Lysosome", "Breaks down waste", {box: 0, due: "", seen: 0, right: 0, wrong: 0, last: ""})]};
const snap = VH.deckSnap(deck, T0, "Before 2 cards were deleted");
const cmp = VH.compare(snap.cards, today.cards);
ok(cmp.back.map(c => c.id).join() === "k3,k4" && cmp.changed.length === 2 && cmp.added.map(c => c.id).join() === "n1" && cmp.same.length === 1, "compare finds deleted, changed, added and same cards");
ok(cmp.changed.find(x => x.now.id === "k1").big && !cmp.changed.find(x => x.now.id === "k2").big, "k1's rewrite is meaningful, k2's typo fix isn't");
const res = VH.restore(snap, today);
const by = id => res.cards.find(c => c.id === id);
ok(res.cards.map(c => c.id).join() === "k1,k2,k3,k4,k5,n1", "deleted cards come back in their old places and the new card stays: " + res.cards.map(c => c.id));
ok(by("k1").front === "Mitochondria" && by("k1").box === 2 && by("k1").due === "2026-10-05" && by("k1").seen === 4, "a meaningfully reworded card gets back its wording and the schedule it had then");
ok(by("k2").back === "Builds proteins from amino acids" && by("k2").box === 4 && by("k2").due === "2026-11-02", "a card with a small fix gets its wording back and keeps today's schedule");
ok(by("k3").seen === 4 && by("k3").box === 2, "a deleted card comes back with its schedule");
ok(by("n1").front === "Lysosome", "cards added since stay by default");
ok(res.name === "BIO 101 Cell Biology" && res.counts.back === 2 && res.counts.changed === 2 && res.counts.reset === 1 && res.counts.removed === 0, "counts and the old name: " + JSON.stringify(res.counts));
const res2 = VH.restore(snap, today, {dropAdded: true});
ok(!res2.cards.some(c => c.id === "n1") && res2.counts.removed === 1 && res2.cards.length === 5, "Also remove drops the cards added since");
ok(VH.deckSig({name: res2.name, cards: res2.cards}) === VH.deckSig(deck), "restoring with Also remove gives back exactly that version's cards");
const allGone = VH.restore(snap, {id: "d1", name: "BIO 101 Cell Biology", cards: []});
ok(allGone.cards.map(c => c.id).join() === "k1,k2,k3,k4,k5", "after delete-all every card comes back in order");

/* Line diff for the note preview */
const d = VH.lineDiff("Thesis only\nNew line", essay);
ok(d.filter(x => x.t === "+").length === 3 && d.filter(x => x.t === "-").length === 2 && d.filter(x => x.t === " ").length === 0, "the diff marks what comes back and what goes");
ok(VH.lineDiff("a\nb\nc", "a\nc").map(x => x.t).join("") === " - ", "a removed line in the middle");

/* Versions in online backups */
const bks = [{at: T0 - 2 * DAY, where: "cloud", notes: [{id: "n1", text: "Backup text"}], decks: [deck]}, {at: T0 - 40 * DAY, where: "cloud", notes: [{id: "n1", text: "Too old"}]},
  {at: T0 - DAY, where: "drive", label: "Google Drive", notes: [{id: "n2", text: "Other note"}], decks: []}];
const fb = VH.fromBackups(bks, "note", "n1", T0);
ok(fb.length === 1 && fb[0].text === "Backup text" && fb[0].src === "cloud", "a backup's copy of the note, within 30 days");
ok(VH.fromBackups(bks, "deck", "d1", T0)[0].cards.length === 5, "a backup's copy of the deck");
const merged = VH.merge([[VH.noteSnap("Backup text", T0 - DAY, "")], fb, [VH.noteSnap("Now", T0, "")]], "Now");
ok(merged.length === 1 && merged[0].at === T0 - DAY, "merge drops duplicates and the current text, newest first");

/* Rubric Check's pure part */
const lines = new Function("DAYMS", between("/*GXP-START*/", "/*GXP-END*/") + ";return GXP.rubricLines;")(864e5);
const RBC = new Function(between("/*RUBRIC-START*/", "/*RUBRIC-END*/") + ";return RBC;")();
const rubric = "ENG 102 Argumentative Essay Rubric (100 points)\n- Clear, arguable thesis in the introduction (20 points)\n- Uses at least 4 scholarly sources, cited in MLA (20 pts)\n- Addresses a counterargument (15 points)\n- Organization and transitions (15 points)\n- Grammar and mechanics (10 points)\nTotal: 100";
const cr = RBC.criteria(rubric, lines);
ok(cr.length === 5 && cr[0].t === "Clear, arguable thesis in the introduction" && cr[0].pts === 20 && cr[1].pts === 20 && cr[4].pts === 10, "criteria and points come from the rubric: " + JSON.stringify(cr));
ok(RBC.eligible({type: "Assignment", status: "todo", title: "Essay"}) && RBC.eligible({type: "Other", status: "todo", title: "Final paper"}) && !RBC.eligible({type: "Exam", status: "todo", title: "Midterm"}) && !RBC.eligible({type: "Lab", status: "done", title: "Lab"}), "only assignment-like tasks that aren't done");
ok(/- Thesis \(20 points\): States a position/.test(RBC.lmsText({cr: [{t: "Thesis", pts: 20, d: "States a position"}]})), "a school-site rubric becomes text");
const draft = "Cities are getting hotter every summer. In this essay I argue that urban green space is the cheapest way to cool a city. Parks in Phoenix are four degrees cooler than the blocks around them (Smith 2021). Trees also shade sidewalks. ".repeat(3);
const out = RBC.parse({summary: "A clear thesis, but the sources are thin and there is no counterargument.", criteria: [
  {n: 1, criterion: "Thesis", status: "Strong", evidence: "I argue that urban green space is the cheapest way to cool a city", suggestion: "Keep it."},
  {n: 2, criterion: "Sources", status: "weak", evidence: "Parks in Phoenix are four degrees cooler than the blocks around them (Smith 2021). Trees also shade sidewalks and more words here", suggestion: "Add three more peer-reviewed sources."},
  {n: 3, criterion: "Counter", status: "Missing", evidence: "made up words", suggestion: "Name the strongest objection and answer it."},
  {n: 4, criterion: "Org", status: "Excellent", evidence: "", suggestion: "?"},
  {n: 5, criterion: "Grammar", status: "OK", evidence: "this is not in the draft at all", suggestion: "Proofread for comma splices."}]}, cr, draft);
ok(out.rows.length === 4 && out.skipped === 1, "a row with an unknown status is dropped and counted as skipped");
ok(out.rows[1].status === "Weak" && out.rows[1].quote.split(" ").length <= 20 && /Trees also shade sidewalks$/.test(out.rows[1].quote) && draft.includes(out.rows[1].quote), "status is normalized and a long quote is cut to the longest start (20 words at most) that is in the draft: " + out.rows[1].quote);
ok(out.rows[2].quote === "" && out.rows[3].quote === "", "a quote that isn't in the draft isn't shown");
ok(out.rows[0].t === cr[0].t && out.rows[0].pts === 20, "rows use the rubric's own criterion names and points");
ok(RBC.parse({summary: "x", criteria: "nope"}, cr, draft) === null && RBC.parse(null, cr, draft) === null && RBC.parse({criteria: [{status: "Great"}]}, cr, draft) === null, "a malformed reply is rejected");
let id = 0;
const st = RBC.steps(out.rows, [{id: "a", text: "Uses at least 4 scholarly sources, cited in MLA: old step", done: false}], () => "s" + (++id));
ok(st.length === 1 && /^Addresses a counterargument: Name the strongest objection/.test(st[0].text), "weak and missing criteria become steps, skipping ones already on the task");
const long = ("Paragraph about heat islands and parks. ".repeat(40) + "\n\n").repeat(60);
const c = RBC.clip(long, 60000);
ok(c.cut && c.text.length < 61000 && /middle of the draft was left out/.test(c.text) && c.kept < c.total, "a long draft keeps its start and end and says it was shortened");
ok(!RBC.clip(draft, 60000).cut, "a short draft is sent whole");
ok(/never write, rewrite, complete or paraphrase/i.test(RBC.SYSTEM) && /feedback only/i.test(RBC.SYSTEM), "the prompt forbids writing the student's work");

console.log(`version-history: ${n} checks passed`);
