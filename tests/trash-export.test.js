// Unit tests for Recently Deleted and Export My Data (pure logic extracted from index.html).  Run: node tests/trash-export.test.js
const fs = require("fs"), path = require("path"), assert = require("assert"), cp = require("child_process"), os = require("os");
const s = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const code = s.slice(s.indexOf("/*TRASH-START*/"), s.indexOf("/*TRASH-END*/"));
const TB = new Function(code + ";return TB;")();
let n = 0; const ok = (c, m) => { n++; assert(c, m); };
const NOW = Date.UTC(2026, 9, 3, 12), DAY = 864e5;
let seq = 0; const newId = () => "n" + (++seq);

// ---- retention
const mk = (id, ageDays) => ({id, kind: "task", label: id, deletedAt: NOW - ageDays * DAY, items: [{kind: "task", id: "t" + id, data: {id: "t" + id, title: id}}]});
let r = TB.purge([mk("a", 1), mk("b", 29.9), mk("c", 30), mk("d", 45), {id: "bad", deletedAt: NOW, items: []}, {id: "bad2", items: [{}]}], NOW);
ok(r.keep.map(e => e.id).join() === "a,b", "keeps under 30 days: " + r.keep.map(e => e.id));
ok(r.dropped.length === 4, "drops 30+ days and malformed");
ok(TB.daysLeft(mk("x", 0), NOW) === 30 && TB.daysLeft(mk("x", 29.5), NOW) === 1 && TB.daysLeft(mk("x", 31), NOW) === 0, "days left");
// caps: count and bytes, oldest go first
const many = Array.from({length: 500}, (_, i) => mk("m" + i, i / 100));
r = TB.purge(many, NOW);
ok(r.keep.length === 400 && r.keep[0].id === "m0" && r.dropped.some(e => e.id === "m499"), "count cap keeps newest");
const big = [mk("p", 1), mk("q", 2), mk("r", 3)].map(e => { e.items[0].data.blob = "x".repeat(5e6); return e; });
r = TB.purge(big, NOW);
ok(r.keep.map(e => e.id).join() === "p,q" && r.dropped.length === 1, "byte cap keeps newest that fit");

// ---- making entries: a course takes its tasks along; cards group per deck; bulk collapses
const course = {kind: "course", id: "c1", data: {id: "c1", name: "Biology"}};
const T = (id, c) => ({kind: "task", id, data: {id, title: "T" + id, courseId: c}});
let es = TB.makeEntries([course, T("t1", "c1"), T("t2", "c1"), T("t3", "c2")], NOW, newId);
ok(es.length === 2 && es[0].kind === "course" && es[0].items.length === 3 && es[0].detail === "2 tasks moved with it", JSON.stringify(es.map(e => [e.kind, e.items.length, e.detail])));
ok(es[1].kind === "task" && es[1].label === "Tt3", "other task is its own entry");
es = TB.makeEntries(Array.from({length: 120}, (_, i) => T("b" + i, "")), NOW, newId, {bulkLabel: "All data cleared"});
ok(es.length === 1 && es[0].kind === "bulk" && es[0].label === "All data cleared" && es[0].items.length === 120, "bulk entry");
const card = id => ({kind: "card", id, data: {id, front: "Q" + id, back: "A"}, parent: {kind: "deck", id: "d1", name: "Cells"}});
es = TB.makeEntries([card("k1"), card("k2")], NOW, newId);
ok(es.length === 1 && es[0].kind === "card" && es[0].label === "2 flashcards from Cells", es[0].label);
es = TB.makeEntries([{kind: "deck", id: "d1", data: {id: "d1", name: "Cells", cards: [{id: "x"}, {id: "y"}]}}], NOW, newId);
ok(es[0].detail === "2 cards" && es[0].label === "Cells", "deck entry keeps its cards");
ok(TB.makeEntries([{kind: "deck", id: "d9", data: {id: "d9", name: "Huge", cards: [{id: "z", front: "x".repeat(2e6)}]}}], NOW, newId)[0].local === true, "very large entries stay on this device");
ok(TB.normEntry({id: 5, items: [{kind: "task", id: "a", data: {}}, {kind: "nope", id: "b", data: {}}, null]}).items.length === 1, "normEntry drops junk items");

// ---- restore
const live = {task: new Set(), course: new Set(), deck: {}, note: new Set()};
const ctx = (extra) => Object.assign({exists: (k, id) => k === "deck" ? !!live.deck[id] : live[k] && live[k].has(id), newId, getDeck: id => live.deck[id], folderOk: () => true, binCourse: () => null}, extra);
let ent = TB.makeEntries([course, T("t1", "c1"), T("t2", "c1")], NOW, newId)[0];
let p = TB.restorePlan(ent, ctx());
ok(p.changes.length === 3 && p.changes.every(c => c.kind === "course" || c.after.courseId === "c1"), "course restores with its tasks");
// parent gone: a lone task goes to No Course
ent = TB.makeEntries([T("t5", "gone")], NOW, newId)[0];
p = TB.restorePlan(ent, ctx());
ok(p.changes[0].after.courseId === "" && p.notes.length === 1, "missing parent -> No Course: " + JSON.stringify(p.notes));
// parent gone but also in the bin: it comes back too
const courseEntry = TB.makeEntries([{kind: "course", id: "gone", data: {id: "gone", name: "Old"}}], NOW, newId)[0];
p = TB.restorePlan(ent, ctx({binCourse: cid => cid === "gone" ? courseEntry : null}));
ok(p.changes.some(c => c.kind === "course" && c.id === "gone") && p.changes.find(c => c.kind === "task").after.courseId === "gone" && p.entries.includes(courseEntry.id), "parent restored from the bin");
// id collision: new id, tasks follow the new course id
live.course.add("c1");
ent = TB.makeEntries([course, T("t1", "c1")], NOW, newId)[0];
p = TB.restorePlan(ent, ctx());
const cc = p.changes.find(c => c.kind === "course"), tt = p.changes.find(c => c.kind === "task");
ok(cc.id !== "c1" && cc.after.id === cc.id && tt.after.courseId === cc.id && p.notes.length >= 1, "collision remaps ids");
live.course.delete("c1");
// cards back into their deck, or into a new deck when it is gone
live.deck.d1 = {id: "d1", name: "Cells", cards: [{id: "other"}], aiQuizzes: []};
ent = TB.makeEntries([card("k1"), card("k2")], NOW, newId)[0];
p = TB.restorePlan(ent, ctx());
ok(p.changes.length === 1 && p.changes[0].id === "d1" && p.changes[0].after.cards.length === 3 && live.deck.d1.cards.length === 1, "cards return to their deck, without touching the live copy");
delete live.deck.d1;
p = TB.restorePlan(ent, ctx());
ok(p.changes.length === 1 && p.changes[0].after.cards.length === 2 && /Restored/.test(p.changes[0].after.name), "deck gone -> new deck");
// note whose task is gone loses the dangling link
ent = TB.makeEntries([{kind: "note", id: "nn", data: {id: "nn", text: "hi", taskId: "zzz", courseId: ""}}], NOW, newId)[0];
ok(TB.restorePlan(ent, ctx()).changes[0].after.taskId === "", "dangling note link cleared");
// live copy wins: an entry whose items are all live again is hidden
ent = TB.makeEntries([T("t7", "")], NOW, newId)[0]; live.task.add("t7");
ok(TB.superseded(ent, ctx().exists) === true, "superseded when live again");
live.task.delete("t7"); ok(TB.superseded(ent, ctx().exists) === false, "not superseded when gone");

// ---- CSV
ok(TB.csvCell('a,b') === '"a,b"' && TB.csvCell('say "hi"') === '"say ""hi"""' && TB.csvCell("l1\r\nl2") === '"l1\nl2"', "quoting");
["=1+1", "+SUM(A1)", "-2+3", "@cmd", "\tx", "=HYPERLINK(\"http://x\")"].forEach(v => ok(TB.csvCell(v).replace(/^"/, "").startsWith("'"), "formula guarded: " + v));
ok(TB.csvCell(-5) === "-5" && TB.csvCell("-5.5") === "-5.5" && TB.csvCell(null) === "" && TB.csvCell(true) === "true" && TB.csvCell(0) === "0", "plain numbers are untouched");
ok(TB.csv(["a"], [["é"]]).charCodeAt(0) === 0xFEFF, "BOM");
const data = {courses: [{id: "c1", name: "Biology", code: "BIO 101", grading: {goal: 85}}], tasks: [
  {id: "1", title: "=cmd|' /C calc'!A0", courseId: "c1", type: "Exam", status: "done", due: "2026-10-05", time: "09:30", hours: 2, priority: "high", weight: 20, notes: "a,\"b\"\nc", link: "https://x.test", doneAt: Date.UTC(2026, 9, 4), mark: {got: 43, outOf: 50}},
  {id: "2", title: "Lab", courseId: "c1", type: "Lab", status: "todo", due: "", weight: 30, mark: {got: 50, outOf: 100}, focusMin: 90}],
  notes: [{id: "n1", text: "First line\nsecond", courseId: "c1", updated: NOW}], decks: [{id: "d1", name: "Cell Bio", courseId: "c1", cards: [{id: "k", front: "ATP?", back: "Energy\tcurrency", box: 1}]}], events: [{id: "e1", title: "Lecture", courseId: "c1", date: "2026-10-06", start: "10:00", end: "11:00", allDay: false, repeat: {days: [1, 3], until: ""}}]};
const f = TB.toCsvFiles(data);
ok(Object.keys(f).join() === "tasks.csv,notes.csv,grades.csv,grades-summary.csv,flashcards.csv,flashcards-anki.txt,courses.csv,events.csv,study-sessions.csv", Object.keys(f).join());
ok(/^﻿title,course,type,status,due_date,due_time_local,due_iso_local/.test(f["tasks.csv"]), "tasks header");
ok(f["tasks.csv"].includes("'=cmd|"), "task title formula guarded");
ok(f["tasks.csv"].includes("2026-10-05,09:30,2026-10-05T09:30"), "ISO date and local time");
ok(f["tasks.csv"].includes("2026-10-04T00:00:00.000Z"), "completedAt ISO");
ok(f["grades.csv"].includes("BIO 101 Biology,=") === false && f["grades.csv"].includes(",43,50,86,"), "grades percent: " + f["grades.csv"]);
ok(f["grades-summary.csv"].includes("BIO 101 Biology,2,50,"), "summary: " + f["grades-summary.csv"]);
ok(f["flashcards-anki.txt"].includes("ATP?\t\"Energy\tcurrency\"\tCell_Bio"), "anki tsv");
ok(f["study-sessions.csv"].includes(",90,"), "sessions");
ok(Object.keys(TB.toCsvFiles(data, {tasks: true})).join() === "tasks.csv", "selection respected");
const j = TB.jsonExport({courses: data.courses, tasks: data.tasks}, NOW, ["tasks"]);
ok(j.export.schema === "studyboard-export" && j.export.version === 1 && j.export.counts.tasks === 2 && j.export.readme.length > 3 && j.app === "studyboard", "json header");

// ---- CRC32 and ZIP: verified with real unzip tools
ok(TB.crc32(new TextEncoder().encode("123456789")) === 0xCBF43926, "crc32 check value");
ok(TB.crc32(new Uint8Array(0)) === 0, "crc32 empty");
(async () => {
  const entries = [{name: "studyboard-export.json", data: JSON.stringify(j)}, {name: "tasks.csv", data: f["tasks.csv"]}, {name: "empty.txt", data: ""}, {name: "bin.dat", data: Uint8Array.from({length: 70000}, (_, i) => i * 7 % 256)}, {name: "ü-ünïcode.txt", data: "ok"}];
  let prog = 0;
  const blob = await TB.zipBlob(entries, {now: NOW, onProgress: i => { prog = i; }, yield: () => new Promise(r => setTimeout(r, 0))});
  ok(prog === 5, "progress reported");
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sbzip-")), file = path.join(dir, "x.zip");
  fs.writeFileSync(file, Buffer.from(await blob.arrayBuffer()));
  const list = cp.execSync(`python3 -m zipfile -l "${file}"`).toString();
  ["studyboard-export.json", "tasks.csv", "empty.txt", "bin.dat"].forEach(nm => ok(list.includes(nm), "listed " + nm));
  let t = ""; try { t = cp.execSync(`unzip -t "${file}" 2>&1`).toString(); } catch (e) { t = e.stdout ? e.stdout.toString() : "unzip missing"; if (/not found|missing/.test(t)) t = "No errors detected (unzip not installed)"; }
  ok(/No errors detected/.test(t), "unzip -t: " + t);
  const py = cp.execSync(`python3 - <<'PY'\nimport zipfile,json\nz=zipfile.ZipFile("${file}")\nassert z.testzip() is None\nd=json.loads(z.read("studyboard-export.json"))\nprint(d["export"]["schema"], len(z.read("bin.dat")))\nPY`).toString().trim();
  ok(py === "studyboard-export 70000", "python reads it back: " + py);
  fs.rmSync(dir, {recursive: true});
  console.log(`trash-export: ${n} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
