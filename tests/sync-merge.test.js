// Unit tests for the sync conflict policy (the SYNC-MERGE block in index.html). Run: node tests/sync-merge.test.js
const fs = require("fs"), path = require("path"), vm = require("vm"), assert = require("assert");
const src = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const a = src.indexOf("/* SYNC-MERGE-START"), b = src.indexOf("/* SYNC-MERGE-END */");
assert(a > 0 && b > a, "SYNC-MERGE block not found");
const SM = vm.runInNewContext(src.slice(a, b) + "\nSyncMerge;", {Date, JSON, Math, Map, Set, Uint16Array, Object, Array, String, Number, Promise});
let n = 0, fail = 0;
const t = (name, fn) => { n++; try { fn(); } catch (e) { fail++; console.log("FAIL", name, "\n  ", e.message.split("\n").slice(0, 6).join("\n   ")); } };
const J = x => JSON.parse(JSON.stringify(x));
const T0 = Date.parse("2026-10-12T15:00:00Z");

/* ---- diff3 and text ---- */
t("text: only mine changed", () => assert.strictEqual(SM.mergeText("a\nb", "a\nB", "a\nb").text, "a\nB"));
t("text: only theirs changed", () => assert.strictEqual(SM.mergeText("a\nb", "a\nb", "A\nb").text, "A\nb"));
t("text: different lines merge cleanly", () => { const r = SM.mergeText("one\ntwo\nthree", "ONE\ntwo\nthree", "one\ntwo\nTHREE"); assert.strictEqual(r.text, "ONE\ntwo\nTHREE"); assert.strictEqual(r.conflicts, 0); });
t("text: both append at the end keeps both, no marker", () => { const r = SM.mergeText("a", "a\nmine", "a\ntheirs"); assert.strictEqual(r.conflicts, 0); assert(r.text.includes("mine") && r.text.includes("theirs")); });
t("text: same line edited keeps BOTH with dividers", () => {
  const r = SM.mergeText("x\nthe cell\ny", "x\nthe cell wall\ny", "x\nthe cell membrane\ny", {theirsAt: T0});
  assert.strictEqual(r.conflicts, 1); assert(r.text.includes("the cell wall") && r.text.includes("the cell membrane"));
  assert(r.text.includes("Conflicting edit from your other device (")); assert(SM.hasMarks(r.text));
  assert(r.text.startsWith("x\n") && r.text.endsWith("\ny"));
});
t("text: one side deleted a line the other edited -> edit wins", () => assert.strictEqual(SM.mergeText("a\nb\nc", "a\nc", "a\nB!\nc").text, "a\nB!\nc"));
t("text: no base, different texts keep both", () => { const r = SM.mergeText(null, "left", "right"); assert.strictEqual(r.conflicts, 1); assert(r.text.includes("left") && r.text.includes("right")); });
t("text: no base, one contains the other", () => assert.strictEqual(SM.mergeText(null, "abc\ndef", "abc").text, "abc\ndef"));
t("text: empty side never wins over text", () => assert.strictEqual(SM.mergeText(null, "", "keep me").text, "keep me"));
t("text: huge input falls back to keeping both", () => {
  const big = Array.from({length: 3000}, (_, i) => "line " + i).join("\n");
  const m = big.replace("line 5\n", "mine\n"), th = big.replace("line 2900\n", "theirs\n");
  const r = SM.mergeText(big, m + "\nzzz", th + "\nyyy"); assert(r.text.includes("zzz") && r.text.includes("yyy"));
});
t("text: no line is ever lost (random)", () => {
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let k = 0; k < 300; k++) {
    const base = Array.from({length: 1 + Math.floor(rnd() * 8)}, (_, i) => "b" + i);
    const edit = tag => { const x = base.slice(); for (let e = 0; e < 3; e++) { const r = rnd(), i = Math.floor(rnd() * (x.length + 1)); if (r < .4) x.splice(i, 0, tag + e + k); else if (r < .7 && x.length) x[Math.min(i, x.length - 1)] = tag + "mod" + e + k; } return x; };
    const A = edit("m"), B = edit("t"), r = SM.mergeText(base.join("\n"), A.join("\n"), B.join("\n"));
    // every line mine or theirs ADDED/CHANGED (not in base) must survive; this is the "never lose typed text" property
    [...A, ...B].filter(l => !base.includes(l)).forEach(l => assert(r.text.split("\n").includes(l), "lost " + l + " in " + JSON.stringify({base, A, B, out: r.text})));
  }
});
t("resolveText: mine / theirs / both", () => {
  const r = SM.mergeText("x\nq\ny", "x\nQ1\ny", "x\nQ2\ny", {theirsAt: T0}).text;
  assert.strictEqual(SM.resolveText(r, "mine"), "x\nQ1\ny"); assert.strictEqual(SM.resolveText(r, "theirs"), "x\nQ2\ny"); assert.strictEqual(SM.resolveText(r, "both"), "x\nQ1\nQ2\ny");
  assert(!SM.hasMarks(SM.resolveText(r, "both")));
  const p = SM.conflictParts(r); assert.strictEqual(p.length, 1); assert.strictEqual(p[0].mine, "Q1"); assert.strictEqual(p[0].theirs, "Q2");
});
t("resolveText: two blocks resolved together; plain text untouched", () => {
  const r = SM.mergeText("a\nb\nc\nd\ne", "a\nB1\nc\nD1\ne", "a\nB2\nc\nD2\ne").text;
  assert.strictEqual(SM.conflictParts(r).length, 2); assert.strictEqual(SM.resolveText(r, "theirs"), "a\nB2\nc\nD2\ne");
  assert.strictEqual(SM.resolveText("just text", "mine"), "just text");
});

/* ---- notes ---- */
const note = o => Object.assign({id: "n1", text: "", color: "yellow", x: 40, y: 40, z: 1, rot: 0, archived: false, stickers: []}, o);
t("note: edited on one side only", () => { const r = SM.mergeItem("note", note({text: "a"}), note({text: "a!"}), note({text: "a"})); assert.strictEqual(r.state, "mine"); assert.strictEqual(r.merged.text, "a!"); });
t("note: scenario 1 same line edited on both -> both kept, conflict flag, history ring", () => {
  const base = note({text: "Cell\nMitochondria"}), mine = note({text: "Cell\nMitochondria make ATP"}), theirs = note({text: "Cell\nMitochondria are organelles"});
  const r = SM.mergeItem("note", base, mine, theirs, {now: T0, theirsAt: T0 - 5e3, mineAt: T0 - 9e3});
  assert.strictEqual(r.state, "merged"); assert(r.conflict); assert(r.merged.conflict && r.merged.conflict.n === 1);
  assert(r.merged.text.includes("make ATP") && r.merged.text.includes("are organelles"));
  assert(r.merged.hist.some(h => h.text === mine.text) && r.merged.hist.some(h => h.text === theirs.text));
  assert.strictEqual(r.title, "Cell");
});
t("note: clean merge of different lines also snapshots both versions", () => {
  const r = SM.mergeItem("note", note({text: "a\nb\nc"}), note({text: "A\nb\nc"}), note({text: "a\nb\nC"}), {now: T0});
  assert.strictEqual(r.merged.text, "A\nb\nC"); assert(!r.conflict); assert(!r.merged.conflict); assert.strictEqual(r.merged.hist.length, 2);
});
t("note: history ring is capped at 5 and each entry is capped", () => {
  let item = note({text: "x"}), base = item;
  for (let i = 0; i < 12; i++) { const m = note({text: "m" + i + "\nq"}), th = note({text: "t" + i + "\nq"}); const r = SM.mergeItem("note", note({text: "q"}), m, th, {now: T0 + i}); item = Object.assign(r.merged, {}); }
  assert(item.hist.length <= 5);
  const big = "z".repeat(40000), r = SM.mergeItem("note", note({text: "q"}), note({text: big + "1"}), note({text: big + "2"}), {now: T0});
  assert(r.merged.hist.every(h => h.text.length <= SM.CAP.histChars));
});
t("note: scenario 5 reorder (z/x/y) on A while B edits text -> both", () => {
  const base = note({text: "t", x: 10, z: 1}), mine = note({text: "t", x: 200, y: 90, z: 7}), theirs = note({text: "t edited", x: 10, z: 1});
  const r = SM.mergeItem("note", base, mine, theirs, {now: T0}); assert.strictEqual(r.merged.text, "t edited"); assert.strictEqual(r.merged.x, 200); assert.strictEqual(r.merged.z, 7); assert(!r.conflict);
});
t("note: stale conflict flag clears once the markers are gone", () => {
  const flagged = note({text: "ok", conflict: {at: 1, n: 1}}), r = SM.mergeItem("note", note({text: "ok"}), note({text: "ok\nmore", conflict: {at: 1, n: 1}}), note({text: "ok", color: "blue", conflict: {at: 1, n: 1}}), {now: T0});
  assert(!r.merged.conflict); assert.strictEqual(r.merged.color, "blue");
});

/* ---- tasks / fields ---- */
const task = o => Object.assign({id: "t1", title: "Essay", due: "2026-10-20", status: "todo", priority: "med", notes: "", checklist: [], dependsOn: [], history: [], pct: 0}, o);
t("task: scenario 2 due date on A, done on B -> both", () => {
  const base = task(), mine = task({due: "2026-10-25"}), theirs = task({status: "done", pct: 100});
  const r = SM.mergeItem("task", base, mine, theirs, {now: T0}); assert.strictEqual(r.merged.due, "2026-10-25"); assert.strictEqual(r.merged.status, "done"); assert.strictEqual(r.merged.pct, 100); assert.strictEqual(r.losers.length, 0);
});
t("task: done is sticky over todo/doing on the other side", () => {
  const r = SM.mergeItem("task", task({status: "doing"}), task({status: "done"}), task({status: "todo"}), {now: T0, mineAt: T0, theirsAt: T0 + 1e3}); assert.strictEqual(r.merged.status, "done");
  const r2 = SM.mergeItem("task", task({status: "doing"}), task({status: "todo"}), task({status: "done"}), {now: T0, mineAt: T0 + 9e5, theirsAt: T0}); assert.strictEqual(r2.merged.status, "done");
  assert(r2.merged.syncLog && r2.merged.syncLog.some(l => l.field === "status"));
});
t("task: explicit reopen (one-sided) beats an old done", () => {
  const r = SM.mergeItem("task", task({status: "done"}), task({status: "todo"}), task({status: "done", title: "Essay v2"}), {now: T0}); assert.strictEqual(r.merged.status, "todo"); assert.strictEqual(r.merged.title, "Essay v2");
});
t("task: same field both sides -> newer by device clock wins, loser logged", () => {
  const o = {now: T0, mineAt: T0 - 60 * 6e4, theirsAt: T0 - 5e3};     // mine edited an hour before theirs was saved
  const r = SM.mergeItem("task", task(), task({due: "2026-11-01"}), task({due: "2026-12-01"}), o);
  assert.strictEqual(r.merged.due, "2026-12-01"); assert.strictEqual(r.merged.syncLog[0].lost, "2026-11-01"); assert(r.merged.history.some(h => /Sync:/.test(h.text)));
});
t("clock skew: device clock 1h ahead, corrected by skew, does not win by lying", () => {
  // device clock is 1h ahead: its edit at real 10:00 is stamped 11:00; server saw the other version at 10:30 (real)
  const skew = -36e5;                                               // server clock minus device clock
  const base = {mineAt: Date.parse("2026-10-12T11:00:00Z"), theirsAt: Date.parse("2026-10-12T10:30:00Z"), now: T0};
  const wrong = SM.mergeItem("task", task(), task({due: "2026-11-01"}), task({due: "2026-12-01"}), Object.assign({skew: 0}, base));
  assert.strictEqual(wrong.merged.due, "2026-11-01", "uncorrected, the fast clock looks newer (this is the bug skew correction prevents)");
  const ok = SM.mergeItem("task", task(), task({due: "2026-11-01"}), task({due: "2026-12-01"}), Object.assign({skew}, base));
  assert.strictEqual(ok.merged.due, "2026-12-01");
  assert.strictEqual(SM.skewFrom("2026-10-12T10:00:01Z", Date.parse("2026-10-12T10:59:59Z"), Date.parse("2026-10-12T11:00:01Z")), -36e5 + 1000);
});
t("clock skew: a clock days ahead cannot beat a server-stamped newer edit once skew is known", () => {
  const days = 4 * 864e5;
  const r = SM.mergeItem("task", task(), task({title: "A (fast clock)"}), task({title: "B"}), {now: T0, mineAt: T0 - 30 * 6e4 + days, theirsAt: T0, skew: -days});
  assert.strictEqual(r.merged.title, "B");
});
t("clock skew: within the guard the device merging last wins; unknown edit time never beats the server", () => {
  const close = SM.mergeItem("task", task(), task({title: "mine"}), task({title: "theirs"}), {now: T0, mineAt: T0 - 60e3, theirsAt: T0}); assert.strictEqual(close.merged.title, "mine");
  const unknown = SM.mergeItem("task", task(), task({title: "mine"}), task({title: "theirs"}), {now: T0}); assert.strictEqual(unknown.merged.title, "theirs"); assert.strictEqual(unknown.merged.syncLog[0].lost, "mine");
});
t("task: checklist merged by item id (add on both, tick on one)", () => {
  const cl = (...x) => x.map(([id, text, done]) => ({id, text, done: !!done}));
  const base = task({checklist: cl(["a", "read"], ["b", "write"])});
  const mine = task({checklist: cl(["a", "read", 1], ["b", "write"], ["c", "mine item"])}), theirs = task({checklist: cl(["a", "read"], ["b", "write", 1], ["d", "their item"])});
  const r = SM.mergeItem("task", base, mine, theirs, {now: T0}), ids = r.merged.checklist.map(x => x.id).sort();
  assert.deepStrictEqual(ids, ["a", "b", "c", "d"]); assert(r.merged.checklist.find(x => x.id === "a").done && r.merged.checklist.find(x => x.id === "b").done);
});
t("task: item removed on one side only if untouched on the other", () => {
  const cl = (...x) => x.map(([id, text]) => ({id, text, done: false}));
  const base = task({checklist: cl(["a", "1"], ["b", "2"])});
  const r = SM.mergeItem("task", base, task({checklist: cl(["a", "1"])}), task({checklist: cl(["a", "1"], ["b", "2 edited"])}), {now: T0}); assert.strictEqual(r.merged.checklist.length, 2);
  const r2 = SM.mergeItem("task", base, task({checklist: cl(["a", "1"]), title: "x"}), task({checklist: cl(["a", "1"], ["b", "2"]), priority: "high"}), {now: T0}); assert.strictEqual(r2.merged.checklist.length, 1);
});
t("task: both add different tasks is a union (scenario 4 at item level: different ids are different rows)", () => {
  const r = SM.mergeItem("task", null, task({id: "t-1", title: "mine"}), null, {now: T0}); assert(r.merged && r.merged.title === "mine");
});
t("generic arrays: dependsOn set merge honours removals and additions", () => {
  const r = SM.mergeItem("task", task({dependsOn: ["a", "b"]}), task({dependsOn: ["a", "b", "c"], title: "m"}), task({dependsOn: ["a"], priority: "high"}), {now: T0});
  assert.deepStrictEqual(r.merged.dependsOn.sort(), ["a", "c"]);
});

/* ---- decks / cards ---- */
const card = (id, front, back, extra) => Object.assign({id, front, back, box: 0, due: "", seen: 0, right: 0, wrong: 0}, extra);
const deck = (cards, o) => Object.assign({id: "d1", name: "Bio", courseId: "", cards, quizzes: []}, o);
t("deck: union of cards added on both sides", () => {
  const base = deck([card("c1", "q1", "a1")]), r = SM.mergeItem("deck", base, deck([card("c1", "q1", "a1"), card("cm", "mine", "m")]), deck([card("c1", "q1", "a1"), card("ct", "theirs", "t")]), {now: T0});
  assert.deepStrictEqual(r.merged.cards.map(c => c.id).sort(), ["c1", "cm", "ct"]);
});
t("deck: same card edited on both -> field rules (different sides both kept; same side both kept in text)", () => {
  const base = deck([card("c1", "q", "a")]);
  const r = SM.mergeItem("deck", base, deck([card("c1", "q?", "a")]), deck([card("c1", "q", "a!")]), {now: T0}); assert.strictEqual(r.merged.cards[0].front, "q?"); assert.strictEqual(r.merged.cards[0].back, "a!");
  const r2 = SM.mergeItem("deck", base, deck([card("c1", "mine front", "a")]), deck([card("c1", "their front", "a")]), {now: T0});
  assert(r2.conflict && r2.merged.cards[0].front.includes("mine front") && r2.merged.cards[0].front.includes("their front"));
});
t("deck: study progress on A (box/seen) and a typo fix on B merge", () => {
  const base = deck([card("c1", "teh", "x")]), r = SM.mergeItem("deck", base, deck([card("c1", "teh", "x", {box: 2, seen: 3, due: "2026-10-14"})]), deck([card("c1", "the", "x")]), {now: T0});
  assert.strictEqual(r.merged.cards[0].front, "the"); assert.strictEqual(r.merged.cards[0].box, 2);
});
t("deck: a card deleted on one side survives if the other edited it", () => {
  const base = deck([card("c1", "q", "a"), card("c2", "q2", "a2")]);
  const r = SM.mergeItem("deck", base, deck([card("c1", "q", "a")]), deck([card("c1", "q", "a"), card("c2", "q2", "a2 fixed")]), {now: T0}); assert.strictEqual(r.merged.cards.length, 2);
});
t("deck: reorder on one side + edit on the other", () => {
  const base = deck([card("c1", "1", "a"), card("c2", "2", "b"), card("c3", "3", "c")]);
  const r = SM.mergeItem("deck", base, deck([base.cards[2], base.cards[0], base.cards[1]]), deck([base.cards[0], Object.assign({}, base.cards[1], {back: "B!"}), base.cards[2]]), {now: T0});
  assert.deepStrictEqual(r.merged.cards.map(c => c.id), ["c3", "c1", "c2"]); assert.strictEqual(r.merged.cards[2].back, "B!");
});
t("deck: cards made from a note keep srcNote through a merge (both devices add cards from notes; one edits a card the other made)", () => {
  const base = deck([card("c1", "q1", "a1", {srcNote: "n1"})]);
  const mine = deck([card("c1", "q1 edited", "a1", {srcNote: "n1"}), card("cm", "mine", "m", {srcNote: "n2"})]);
  const theirs = deck([card("c1", "q1", "a1", {srcNote: "n1", box: 2}), card("ct", "theirs", "t", {srcNote: "n3", ai: true})]);
  const r = SM.mergeItem("deck", base, mine, theirs, {now: T0}), by = id => r.merged.cards.find(c => c.id === id);
  assert.deepStrictEqual(r.merged.cards.map(c => c.id).sort(), ["c1", "cm", "ct"]);
  assert.strictEqual(by("c1").srcNote, "n1"); assert.strictEqual(by("c1").front, "q1 edited"); assert.strictEqual(by("c1").box, 2);
  assert.strictEqual(by("cm").srcNote, "n2"); assert.strictEqual(by("ct").srcNote, "n3"); assert.strictEqual(by("ct").ai, true);
});
t("deck: srcNote added to an older card on one device is kept next to the other device's edit", () => {
  const base = deck([card("c1", "q", "a")]);
  const r = SM.mergeItem("deck", base, deck([card("c1", "q", "a", {srcNote: "n9"})]), deck([card("c1", "q", "a2")]), {now: T0});
  assert.strictEqual(r.merged.cards[0].srcNote, "n9"); assert.strictEqual(r.merged.cards[0].back, "a2");
});

/* ---- deletions ---- */
t("tombstone: deleted here, edited there -> edit wins (restored)", () => {
  const base = deck([card("c1", "q", "a")]), mine = Object.assign(J(base), {deletedAt: T0 - 1e3}), theirs = deck([card("c1", "q", "a2")]);
  const r = SM.mergeItem("deck", base, mine, theirs, {now: T0, theirsAt: T0 - 5e3, mineAt: T0 - 1e3}); assert.strictEqual(r.state, "restored"); assert.strictEqual(r.merged.cards[0].back, "a2"); assert(!r.merged.deletedAt);
});
t("tombstone: hard delete (null) never beats an edit made elsewhere", () => {
  const base = deck([card("c1", "q", "a")]), r = SM.mergeItem("deck", base, null, deck([card("c1", "q", "a2")]), {now: T0, theirsAt: T0 - 1e9}); assert.strictEqual(r.state, "restored"); assert.strictEqual(r.merged.cards[0].back, "a2");
});
t("tombstone: delete when other side is unchanged is a plain delete", () => {
  const base = deck([card("c1", "q", "a")]); assert.strictEqual(SM.mergeItem("deck", base, null, J(base), {}).merged, null);
  const tomb = Object.assign(J(base), {trashed: true, trashedAt: T0}); const r = SM.mergeItem("deck", base, tomb, J(base), {}); assert.strictEqual(r.merged.trashed, true);
});
t("tombstone: edited here while deleted elsewhere -> restored (and gone-from-server rows come back)", () => {
  const base = note({text: "a"}), theirs = Object.assign(J(base), {deleted: true, deletedAt: T0 - 60e3});
  const r = SM.mergeItem("note", base, note({text: "a edited"}), theirs, {now: T0, theirsAt: T0 - 60e3, mineAt: T0 - 30e3}); assert.strictEqual(r.state, "restored"); assert.strictEqual(r.merged.text, "a edited"); assert(!r.merged.deleted);
  const r2 = SM.mergeItem("note", base, note({text: "a edited"}), null, {now: T0}); assert.strictEqual(r2.state, "restored"); assert.strictEqual(r2.merged.text, "a edited");
});
t("tombstone: a soft deletion much newer than the edit (past the margin) wins; the content stays in the tombstone", () => {
  const base = note({text: "a"}), del = Object.assign(J(base), {trashed: true, trashedAt: T0});
  const r = SM.mergeItem("note", base, note({text: "a edited"}), del, {now: T0, theirsAt: T0, mineAt: T0 - 3 * 864e5}); assert.strictEqual(r.state, "deleted"); assert.strictEqual(r.merged.text, "a");
  const r2 = SM.mergeItem("note", base, Object.assign(J(base), {deletedAt: T0}), note({text: "edited"}), {now: T0, theirsAt: T0 - 3 * 864e5}); assert.strictEqual(r2.state, "deleted");
  const r3 = SM.mergeItem("note", base, Object.assign(J(base), {deletedAt: T0}), note({text: "edited"}), {now: T0, theirsAt: T0 - 36e5}); assert.strictEqual(r3.state, "restored");
});
t("tombstone helpers", () => { assert(SM.isTomb(null)); assert(SM.isTomb({deleted: true})); assert(SM.isTomb({trashedAt: "2026-10-01T00:00:00Z"})); assert(!SM.isTomb({deleted: false, text: "x"})); });

/* ---- settings (kind meta) ---- */
t("settings: different keys on both devices both survive; same key newest wins", () => {
  const base = {schema: 2, settings: {capacity: 15, theme: "light", daily: 3}};
  const r = SM.mergeItem("meta", base, {schema: 2, settings: {capacity: 20, theme: "light", daily: 3}}, {schema: 2, settings: {capacity: 15, theme: "dark", daily: 3}}, {now: T0});
  assert.strictEqual(r.merged.settings.capacity, 20); assert.strictEqual(r.merged.settings.theme, "dark");
  const r2 = SM.mergeItem("meta", base, {schema: 2, settings: {capacity: 20}}, {schema: 2, settings: {capacity: 30}}, {now: T0, mineAt: T0 - 36e5, theirsAt: T0});
  assert.strictEqual(r2.merged.settings.capacity, 30); assert(!r2.merged.syncLog);
});

t("settings: the data format version never goes down, even when only this device changed something", () => {
  const r = SM.mergeItem("meta", {schema: 3, settings: {a: 1}}, {schema: 2, settings: {a: 2}}, {schema: 3, settings: {a: 1}}, {now: T0});
  assert.strictEqual(r.merged.schema, 3); assert.strictEqual(r.merged.settings.a, 2);
});

t("settings: availability blocks (settings.avail) merge by id, not as one blob", () => {
  const blk = (id, d) => ({id, days: [d], start: 540, end: 600});
  const base = {schema: 2, settings: {avail: {v: 1, blocks: [blk("w1", 1), blk("w2", 2)], cfg: {set: true, buf: 10}}}};
  const mine = {schema: 2, settings: {avail: {v: 1, blocks: [blk("w1", 1), blk("w2", 2), blk("mine", 3)], cfg: {set: true, buf: 10}}}};
  const theirs = {schema: 2, settings: {avail: {v: 1, blocks: [blk("w1", 4), blk("w2", 2), blk("theirs", 5)], cfg: {set: true, buf: 15}}}};
  const a = SM.mergeItem("meta", base, mine, theirs, {now: T0}).merged.settings.avail;
  assert.deepStrictEqual(a.blocks.map(x => x.id).sort(), ["mine", "theirs", "w1", "w2"]); assert.deepStrictEqual(a.blocks.find(x => x.id === "w1").days, [4]); assert.strictEqual(a.cfg.buf, 15);
});

/* ---- schema differences / unknown fields / compatibility ---- */
t("schema: fields only one version knows are kept (unknown keys are never dropped)", () => {
  const r = SM.mergeItem("task", task(), task({future: {a: 1}}), task({otherNew: "x", status: "doing"}), {now: T0}); assert.deepStrictEqual(r.merged.future, {a: 1}); assert.strictEqual(r.merged.otherNew, "x"); assert.strictEqual(r.merged.status, "doing");
});
t("schema: base unknown (old rows without rev, wiped cache) still merges without losing text", () => {
  const r = SM.mergeItem("note", null, note({text: "mine only", color: "pink"}), note({text: "theirs only", color: "blue"}), {now: T0, theirsAt: T0});
  assert(r.merged.text.includes("mine only") && r.merged.text.includes("theirs only")); assert(r.conflict);
});
t("merge does not mutate its inputs and is idempotent on equal sides", () => {
  const base = note({text: "a"}), mine = note({text: "b"}), theirs = note({text: "c"}), snap = J([base, mine, theirs]);
  SM.mergeItem("note", base, mine, theirs, {now: T0}); assert.deepStrictEqual(J([base, mine, theirs]), snap);
  assert.strictEqual(SM.mergeItem("note", base, theirs, theirs, {}).state, "same");
});
t("caps: syncLog and history stay bounded over many merges", () => {
  let cur = task();
  for (let i = 0; i < 60; i++) cur = SM.mergeItem("task", cur, Object.assign(J(cur), {title: "m" + i}), Object.assign(J(cur), {title: "t" + i}), {now: T0 + i, mineAt: T0 + i, theirsAt: T0 + i}).merged;
  assert(cur.syncLog.length <= SM.CAP.log); assert(cur.history.length <= SM.CAP.history); assert(cur.syncLog.every(l => l.lost.length <= SM.CAP.logChars + 3));
});

console.log(fail ? `${fail} of ${n} FAILED` : `sync-merge: all ${n} tests passed`);
process.exit(fail ? 1 : 0);
