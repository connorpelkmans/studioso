// node tests/undo-merge.test.js: Ctrl+Z puts back only what its step changed, never later edits (src/js/01-undo.js undoMerge)
const fs = require("fs"), path = require("path"), vm = require("vm"), assert = require("assert");
const src = fs.readFileSync(path.join(__dirname, "..", "src", "js", "01-undo.js"), "utf8");
const a = src.indexOf("/*UNDO-MERGE-START*/"), b = src.indexOf("/*UNDO-MERGE-END*/");
assert(a >= 0 && b > a, "undoMerge markers found");
const undoMerge = vm.runInNewContext(src.slice(a, b) + "\nundoMerge;", {Object, Set});
const eq = (x, y) => JSON.stringify(x) === JSON.stringify(y);
let n = 0; const ok = (c, m) => { n++; assert(c, m); };

const before = {id: "t1", title: "Essay", status: "todo", start: "2026-11-01", due: "2026-11-05", history: []};
const done = Object.assign({}, before, {status: "done", doneAt: 5, history: [{text: "Status"}]});

let r = undoMerge(before, done, done, eq);
ok(!r.skip && !r.kept && eq(r.val, before), "nothing changed since: the whole item goes back");

const moved = Object.assign({}, done, {start: "2026-11-08", due: "2026-11-12"});
r = undoMerge(before, done, moved, eq);
ok(r.val.status === "todo" && !("doneAt" in r.val), "undoing Done puts the status back and drops the field the step added");
ok(r.val.start === "2026-11-08" && r.val.due === "2026-11-12", "the dates moved afterwards are kept");
ok(!r.kept, "nothing the step changed was touched again, so nothing is reported kept");

const reopened = Object.assign({}, done, {status: "doing", due: "2026-11-20"}); delete reopened.doneAt;
r = undoMerge(before, done, reopened, eq);
ok(r.skip && r.kept, "every field the step changed was changed again: the item is left as it is, and that's reported");

const both = Object.assign({}, done, {status: "doing", doneAt: 5});
r = undoMerge(Object.assign({}, before, {due: "2026-11-01"}), Object.assign({}, done, {due: "2026-11-09"}), Object.assign({}, both, {due: "2026-11-09"}), eq);
ok(!r.skip && r.kept && r.val.status === "doing" && r.val.due === "2026-11-01", "a field changed again is kept while the step's other change goes back");

r = undoMerge(null, done, moved, eq);
ok(r.skip && r.kept, "an item the step created and that was edited since isn't deleted");
r = undoMerge(null, done, done, eq);
ok(!r.skip && r.val === null, "an untouched item the step created is removed");
r = undoMerge(before, null, null, eq);
ok(!r.skip && eq(r.val, before), "an item the step deleted comes back");
r = undoMerge(before, null, moved, eq);
ok(r.skip, "an item the step deleted that's already back isn't overwritten");
r = undoMerge(before, done, null, eq);
ok(r.skip, "an item deleted after the step stays deleted");
console.log(`undo-merge: ${n} checks passed`);
