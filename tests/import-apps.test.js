// Unit tests for Import From Another App (the pure block between /*IMPORTAPPS-START*/ and /*IMPORTAPPS-END*/ in index.html):
// the read-only SQLite reader, Anki collections to Studyboard cards, CSV, Todoist
"use strict";
const fs = require("fs"), path = require("path"), assert = require("assert");
const {ankiCollection, local} = require("./anki-fixture");
const s = require("../scripts/app-files").source();
const between = (a, b) => { const i = s.indexOf(a), j = s.indexOf(b, i); assert(i >= 0 && j > i, "marker " + a); return s.slice(i + a.length, j); };
const IA = new Function(between("/*IMPORTAPPS-START*/", "/*IMPORTAPPS-END*/") + ";return IA;")();
const FSRS = new Function(between("/*FSRS-START*/", "/*FSRS-END*/") + ";return FSRS;")();
let n = 0; const ok = (c, m) => { n++; assert(c, m); };
const eq = (a, b, m) => { n++; assert.deepStrictEqual(a, b, m); };

// small pieces
ok([0, 0.5, 1, 2, 3, 5, 8, 9, 15, 20, 21, 400].every(d => IA.boxFor(d) === FSRS.boxFor(d)), "levels from intervals match Smart scheduling's");
eq(IA.htmlText("Line one<br>Line two<div>Three</div><div>Four</div>"), "Line one\nLine two\nThree\nFour", "line breaks from <br> and <div>");
const pc = {pics: 0, sounds: 0};
eq(IA.htmlText("A &amp; B &lt;3 &#233;t&eacute; &#x1F600; <img src=x.jpg> [sound:a.mp3]&nbsp;end", pc), "A & B <3 été 😀 end", "entities decoded");
ok(pc.pics === 1 && pc.sounds === 1, "pictures and sounds are counted");
eq(IA.htmlText("<ul><li>one</li><li>two</li></ul><style>.x{}</style>"), "• one\n• two", "lists keep their items, styles go");
eq(IA.clozeCard("{{c1::Paris}} is in {{c2::France::country}}", 1), {front: "_____ is in France", back: "Paris"}, "cloze 1");
eq(IA.clozeCard("{{c1::Paris}} is in {{c2::France::country}}", 2), {front: "Paris is in _____ (country)", back: "France"}, "cloze 2 with its hint");
eq(IA.clozeCard("{{c1::a}} and {{c1::b}}", 1), {front: "_____ and _____", back: "a, b"}, "two blanks of the same number");
ok(IA.clozeCard("{{c1::a}}", 3) === null, "a cloze number that isn't there");
ok(IA.pbKind(new Uint8Array([8, 1, 26, 2, 97, 98])) === 1 && IA.pbKind(new Uint8Array([26, 2, 97, 98])) === 0 && IA.pbKind(null) === 0, "note type kind from protobuf");

// zstd frames (newer Anki)
const fz = require("../vendor/fzstd-0.1.1.umd.js");
const big = new Uint8Array(300000).map((x, i) => i * 7 % 251);
ok(Buffer.from(fz.decompress(IA.zstdRaw(big))).equals(Buffer.from(big)) && IA.isZstd(IA.zstdRaw(big)), "raw zstd frame round trip (several blocks)");

// SQLite + Anki (needs python3 to write the collections)
const c11 = ankiCollection("11", {filler: 400});
if (!c11) console.log("python3 with sqlite3 not found: SQLite and Anki checks skipped");
else {
  ok(IA.isSqlite(c11) && !IA.isSqlite(new Uint8Array(20)), "spots a SQLite file");
  const db = IA.sqlite(c11);
  ok(["col", "notes", "cards", "revlog"].every(t => db.tables().includes(t)) && !db.has("decks"), "tables from sqlite_master: " + db.tables());
  ok(db.count("cards") === 409 && db.count("notes") === 407, "every row across interior pages: " + db.count("cards"));
  const long = db.all("notes").find(r => r.id === 1007);
  ok(long && long.flds.length > 4000 && long.flds.endsWith("\u001fBack 7"), "a long field read through overflow pages: " + (long && long.flds.length));
  ok(db.all("cards").find(r => r.id === 19).due === -100000, "negative integers");
  ok(db.all("revlog").every(r => r.factor === 2500 && r.id > 1e12), "floats and 6-byte integers");
  ok(!IA.isPlaceholder(db), "a real collection isn't the placeholder");

  const a = IA.readAnki(db);
  const names = a.decks.map(d => d.name).sort();
  eq(names, ["Big", "Biology › Cells", "Chem › Cells", "Spanish"], "one deck per Anki deck with cards, full path when names clash");
  ok(!a.decks.some(d => d.name === "Default" || d.name === "Filtered Deck"), "an empty deck and a filtered deck don't become decks");
  const D = nm => a.decks.find(d => d.name === nm), card = (nm, front) => D(nm).cards.find(c => c.front === front);
  const c1 = card("Biology › Cells", "Mitochondria\norganelle");
  eq(c1, {front: "Mitochondria\norganelle", back: "Powerhouse & energy", box: 0, due: "", seen: 0, right: 0, wrong: 0}, "a new card");
  const c2 = card("Biology › Cells", "Ribosome");
  ok(c2.back === "Makes proteins" && c2.due === local(2026, 10, 25) && c2.seen === 5 && c2.wrong === 1 && c2.right === 4 && c2.box === IA.boxFor(12), "a review card keeps its schedule: " + JSON.stringify(c2));
  ok(c2.last === local(2026, 10, 13), "last review from the review log: " + c2.last);
  ok(c2.fs.s === 12 && c2.fs.d === 5, "memory state from the interval and ease: " + JSON.stringify(c2.fs));
  const h = card("Spanish", "hola"), rev = card("Spanish", "hello");
  ok(h.back === "hello" && h.fs.s === 30.5 && h.fs.d === 3.2 && h.box === 5 && h.due === local(2026, 11, 5), "Anki's own FSRS state wins: " + JSON.stringify(h));
  ok(h.last === "2026-10-11", "no review log: last review worked back from due and interval: " + h.last);
  ok(rev && rev.back === "hola" && rev.seen === 0, "the reverse card of a two-field note");
  const z1 = card("Biology › Cells", "The capital of _____ is Paris."), z2 = card("Biology › Cells", "The capital of France is _____ (city).");
  ok(z1 && z1.back === "France\n\nExtra info" && z2 && z2.back === "Paris\n\nExtra info", "cloze cards, with the extra field on the back");
  ok(z1.seen === 1 && z1.due === local(2026, 10, 21) && z1.box === 0, "a learning card: due from its time in seconds: " + JSON.stringify(z1));
  const sus = card("Chem › Cells", "Suspended Q");
  ok(sus.due === local(2026, 11, 1) && sus.seen === 8 && sus.wrong === 3 && sus.box === 5 && sus.fs.d === 8 && sus.last === local(2026, 10, 2), "a suspended card keeps its due date; a low ease is harder: " + JSON.stringify(sus));
  const fl = card("Spanish", "Filtered");
  ok(fl && fl.due === local(2026, 10, 30), "a card in a filtered deck goes back to its home deck with its real due date");
  ok(a.pics === 2 && a.sounds === 1 && a.skipped === 1, "pictures and sounds counted, a picture-only card left out: " + JSON.stringify({p: a.pics, s: a.sounds, k: a.skipped}));
  ok(a.total === 408 && a.learned === 5 && !a.capped, "totals: " + a.total + " " + a.learned);
  const capped = IA.readAnki(db, {cap: 100});
  ok(capped.total === 100 && capped.capped && capped.found === 408, "a card cap");
  ok(D("Big").cards[0].front === "Filler 0" && D("Big").cards[7].front.length <= 4000, "cards in the order they were written, long sides clipped");

  // the new schema (collection.anki21b)
  const c18 = ankiCollection("18");
  const b = IA.readAnki(IA.sqlite(c18));
  eq(b.decks.map(d => d.name).sort(), ["Biology › Cells", "Chem › Cells", "Spanish"], "deck names from the decks table (\\x1f paths)");
  ok(b.decks.find(d => d.name === "Biology › Cells").cards.some(c => c.front === "The capital of _____ is Paris."), "cloze from the note type's protobuf kind");
  ok(IA.isPlaceholder(IA.sqlite(ankiCollection("dummy"))), "Anki's please-update placeholder is spotted");
  // a SQLite file inside a zstd frame decodes to the same collection
  ok(Buffer.from(fz.decompress(IA.zstdRaw(new Uint8Array(c18)))).equals(c18), "a zstd-wrapped collection round trip");
  // image occlusion notes become picture cards (masks and pictures are filled in from the package's media)
  for (const k of ["io", "io18"]) {
    const db2 = IA.sqlite(ankiCollection(k));
    if (k === "io18") ok(db2.all("fields").filter(r => r.ntid === 1005).length === 11, "field names from a table made WITHOUT ROWID");
    const r = IA.readAnki(db2), cs = r.decks[0].cards, pics = cs.filter(c => c.pic);
    ok(r.pictures === 8 && pics.length === 8 && r.skipped === 0 && r.pics === 0, k + ": 8 picture cards, their pictures not counted as left out");
    ok(pics.filter(c => c.pic.kind === "io").length === 5 && pics.filter(c => c.pic.kind === "ioe").length === 3 && new Set(pics.filter(c => c.pic.kind === "ioe").map(c => c.pic.set)).size === 1, k + ": both note types, the add-on's notes in one set");
    const media = {"heart diagram.png": {w: 800, h: 600}, "cell.png": {w: 400, h: 300}, "brain.png": {w: 500, h: 400}};
    Object.entries(require("./anki-fixture").ioMedia()).forEach(([n, b]) => { if (/\.svg$/.test(n)) media[n] = b.toString(); });
    pics.forEach(c => { c.img = IA.picCard(c.pic, media); }); IA.nameBoxes(cs);
    const h3 = pics.find(c => c.pic.ord === 3);
    ok(h3.img.g.join() === "2,3" && h3.back === "Box 3" && h3.fs.s === 20.5 && h3.due === local(2026, 11, 20) && h3.img.src === "heart diagram", k + ": a grouped card with its schedule: " + JSON.stringify(h3.img));
    ok(IA.picCard(Object.assign({}, h3.pic, {media: "missing.png"}), media) === null, k + ": no picture, no card");
  }
  // broken files fail cleanly
  let threw = false; try { IA.sqlite(new Uint8Array(c11.subarray(0, 3000))); IA.readAnki(IA.sqlite(new Uint8Array(c11.subarray(0, 3000)))); } catch (e) { threw = true; }
  ok(threw, "a cut-off database throws instead of hanging");
}

// Math: kept as TeX through the HTML clean-up, Anki's older forms turned into \( \) and \[ \]
eq(IA.htmlText("Energy \\(E = mc^2 &lt; x<br>+1\\) is <b>it</b>"), "Energy \\(E = mc^2 < x +1\\) is it", "\\( \\) kept, entities decoded and <br> dropped inside it");
eq(IA.htmlText("<div>\\[\\frac{a}{b} &amp; {c}\\]</div>"), "\\[\\frac{a}{b} & {c}\\]", "\\[ \\] kept with its braces and backslashes");
eq(IA.htmlText("[$]x_1[/$] and [$$]\\sum_i i[/$$]"), "\\(x_1\\) and \\[\\sum_i i\\]", "[$] and [$$] become \\( \\) and \\[ \\]");
eq(IA.htmlText("[latex]\\documentclass{article}\\usepackage{amsmath}\\begin{document}$A = \\pi r^2$\\end{document}[/latex]"), "\\[A = \\pi r^2\\]", "[latex] becomes \\[ \\], without its preamble");
eq(IA.clozeCard(IA.htmlText("{{c1::\\(x^2\\)}} is the square"), 1), {front: "_____ is the square", back: "\\(x^2\\)"}, "math inside a cloze");

// Image occlusion (Anki's own note type)
const near = (a, b) => a.length === b.length && a.every((v, i) => typeof v === "string" ? v === b[i] : Math.abs(v - b[i]) < 0.001);
const OCC = "{{c1::image-occlusion:rect:left=.2345:top=.3:width=.1:height=.05:oi=1}}<br>{{c2::image-occlusion:ellipse:left=.5:top=.5:rx=.1:ry=.05:oi=1}}<br>{{c3::image-occlusion:polygon:left=.1:top=.6:points=.1,.6 .3,.6 .2,.8:oi=1}}<br>{{c3::image-occlusion:rect:left=.7:top=.7:width=.1:height=.1:oi=1}}<br>{{c0::image-occlusion:text:left=.4:top=.1:text=A\\: label:scale=1:fs=.05}}";
const sh = IA.ioShapes(OCC);
ok(sh.length === 5 && sh[4].kind === "text" && sh[4].text === "A: label" && sh[0].left === 0.2345 && sh[0].oi === 1 && IA.isIO(OCC) && !IA.isIO("{{c1::Paris}}"), "shapes from the Occlusion field: " + JSON.stringify(sh[4]));
const io3 = IA.ioCard(OCC, 3, 800, 600);
ok(near(io3.m.flat(), [0.2345, 0.3, 0.1, 0.05, 0.5, 0.5, 0.2, 0.1, "e", 0.1, 0.6, 0.2, 0.2, "p0,0 100,0 50,100", 0.7, 0.7, 0.1, 0.1]), "rect, ellipse (rx, ry) and polygon masks; text isn't a mask: " + JSON.stringify(io3.m));
ok(io3.i === 2 && io3.g.join() === "2,3" && io3.mode === "all" && io3.nl === 1, "shapes sharing c3 are one card; oi=1 is hide all");
ok(IA.ioCard(OCC, 1, 800, 600).i === 0 && !IA.ioCard(OCC, 1, 800, 600).g && IA.ioCard(OCC, 9, 800, 600) === null, "one card per cN; a missing one gives none");
const px = IA.ioCard("{{c1::image-occlusion:rect:left=80:top=60:width=160:height=120}}{{c2::image-occlusion:polygon:points=400,300 600,300 500,450}}", 2, 800, 600);
ok(near(px.m.flat(), [0.1, 0.1, 0.2, 0.2, 0.5, 0.5, 0.25, 0.25, "p0,0 100,0 50,100"]) && px.mode === "one", "pixel coordinates (older notes) become fractions; no oi is hide one: " + JSON.stringify(px.m));
ok(IA.ioCard("{{c1,2::image-occlusion:rect:left=.1:top=.1:width=.1:height=.1}}", 2, 10, 10).i === 0, "a shape in two cards");

// Image Occlusion Enhanced (SVG masks)
const SHAPES = q => [`<rect x="50" y="40" width="100" height="40" fill="${q === 1 ? "#FF7E7E" : "#FFEBA2"}"${q === 1 ? ' class="qshape"' : ""}/>`, `<ellipse cx="300" cy="100" rx="50" ry="20" fill="${q === 2 ? "#FF7E7E" : "#FFEBA2"}"/>`,
  `<g id="x-3"${q === 3 ? ' class="qshape"' : ""}><rect x="100" y="300" width="50" height="40"/><polygon points="300,300 400,300 350,380"/></g>`];
const svg = q => `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="400"><g><title>Masks</title>${SHAPES(q).join("")}</g></svg>`;
const ss = IA.svgShapes(svg(3));
ok(ss.w === 500 && ss.shapes.length === 4 && ss.shapes[2].grp && ss.shapes[2].grp === ss.shapes[3].grp && !ss.shapes[0].grp && ss.shapes[2].q && !ss.shapes[0].q, "SVG shapes, groups and the card's own (qshape) shape");
const e1 = IA.ioeCard(svg(1), svg(0), "abc-ao-1", 500, 400), e3 = IA.ioeCard(svg(3), svg(0), "abc-ao-3", 500, 400);
ok(near(e1.m.flat(), [0.1, 0.1, 0.2, 0.1, 0.5, 0.2, 0.2, 0.1, "e", 0.2, 0.75, 0.1, 0.1, 0.6, 0.75, 0.2, 0.2, "p0,0 100,0 50,100"]) && e1.i === 0 && !e1.g && e1.mode === "all", "masks from the original mask, the card's from its question mask: " + JSON.stringify(e1.m));
ok(e3.i === 2 && e3.g.join() === "2,3" && IA.ioeCard(svg(2), svg(0), "abc-oa-2", 500, 400).mode === "one" && IA.ioeCard(svg(2), svg(0), "abc-oa-2", 500, 400).i === 1, "a grouped shape is one card; -oa- is hide one");
ok(IA.ioeCard(`<svg width="500" height="400"><g><title>Masks</title>${SHAPES(2)[1].replace("#FFEBA2", "#FF7E7E")}</g></svg>`, "", "", 500, 400).m.length === 1, "without an original mask, the question mask's own shapes");
ok(IA.imgSrc('<div><img alt="" src="a &amp; b.png"></div>') === "a & b.png" && IA.imgSrc("no picture") === "", "a picture's file name from its field");
eq(IA.pbMedia(new Uint8Array([10, 9, 10, 5, 97, 46, 112, 110, 103, 16, 3, 10, 7, 10, 3, 98, 46, 106, 16, 1])), [{name: "a.png", zip: "0"}, {name: "b.j", zip: "1"}], "the media list of a newer package");

// CSV
eq(IA.parseCSV('a,b,c\r\n"x, y","say ""hi""",\n"multi\nline",2,3'), [["a", "b", "c"], ["x, y", 'say "hi"', ""], ["multi\nline", "2", "3"]], "quotes, commas, CRLF and line breaks in a field");
eq(IA.parseCSV("﻿Term\tDefinition\nA\tB"), [["Term", "Definition"], ["A", "B"]], "tabs and a byte order mark");

// dates
const T = "2026-10-21";
const d = x => { const r = IA.looseDate(x, T); return r ? r.date + (r.time ? " " + r.time : "") : ""; };
eq([d("2026-10-22"), d("Oct 22 2026"), d("22 Oct 2026"), d("October 22, 2026 5:30 PM"), d("Oct 2"), d("Oct 25"), d("today"), d("tomorrow at 9am")],
  ["2026-10-22", "2026-10-22", "2026-10-22", "2026-10-22 17:30", "2027-10-02", "2026-10-25", T, "2026-10-22 09:00"], "concrete dates");
eq([d("every monday"), d("every wed"), d("every day"), d("every 3 months starting Nov 3"), d("10/30/2026"), d("someday"), d("Feb 30 2026")],
  ["2026-10-26", "2026-10-21", T, "2026-11-03", "2026-10-30", "", ""], "recurring dates keep the next date; nonsense gives none");

// Todoist
const td = IA.todoist([
  "TYPE,CONTENT,DESCRIPTION,PRIORITY,INDENT,AUTHOR,RESPONSIBLE,DATE,DATE_LANG,TIMEZONE,DURATION,DURATION_UNIT,DEADLINE,DEADLINE_LANG",
  "section,Readings,,1,1,,,,,,,,,",
  "task,Read **chapter 4**,Pages 80-120,4,1,Me,,Oct 22 2026,en,,,,,",
  "task,Take notes,,1,2,Me,,,,,,,,",
  "note,Bring the textbook,,,,,,,,,,,,",
  "task,[Lab report](https://example.com/lab),,3,1,Me,,every monday,en,,,,2026-10-30,en",
  "",
  "task,Someday task,,1,1,Me,,,,,,,,",
].join("\n"), "BIO 101 [2203306141].csv", T);
ok(td.name === "BIO 101" && td.tasks.length === 3 && td.steps === 1, "project name and tasks: " + JSON.stringify(td.name));
eq(td.tasks[0], {title: "Read chapter 4", notes: "Pages 80-120\n\nSection: Readings\n\nBring the textbook", priority: "urgent", due: "2026-10-22", start: "", time: "", checklist: ["Take notes"]}, "a task with its section, sub-task and comment");
ok(td.tasks[1].title === "Lab report (https://example.com/lab)" && td.tasks[1].due === "2026-10-30" && td.tasks[1].start === "2026-10-26" && td.tasks[1].priority === "high", "a deadline is the due date, the next date of a repeat is the start: " + JSON.stringify(td.tasks[1]));
ok(td.tasks[2].due === "" && td.tasks[2].notes === "Section: Readings", "no date stays undated");
ok(IA.todoist("Name,Date\nx,y", "a.csv", T) === null, "not a Todoist file");

// Notion
eq(IA.notionTitle("Export/My Notes/Lecture 3 0123456789abcdef0123456789abcdef.md"), "Lecture 3", "Notion's id leaves the title");
eq(IA.notionTitle("Tasks 0123456789abcdef0123456789abcdef_all.csv"), "Tasks", "and the _all of a database");
const md = "# Cell Biology\n\n## Organelles\n\n- **Nucleus**: holds DNA\n    - nested item\n- [ ] review\n- [x] read\n1. first\n\n> a quote\n\n![diagram](Cell%20Biology/diagram.png)\n\nSee [Lecture 2](Lecture%202%200123456789abcdef0123456789abcdef.md) and [the site](https://example.com).\n\n| A | B |\n|---|---|\n| 1 | 2 |\n\n```\ncode line\n```";
const cnt = {pics: 0};
eq(IA.mdText(md, cnt), "Cell Biology\n\nOrganelles\n\n• Nucleus: holds DNA\n  • nested item\n☐ review\n☑ read\n1. first\n\na quote\n\nSee Lecture 2 and the site (https://example.com).\n\n| A | B |\n| 1 | 2 |\n\ncode line", "Markdown to plain note text");
ok(cnt.pics === 1, "pictures are counted");
const tasksDb = IA.notionTable("Name,Due Date,Status,Priority\nEssay,\"October 22, 2026\",Not started,High\nOld,\"October 1, 2026\",Done,\nTrip,\"October 24, 2026 → October 26, 2026\",,", "Tasks 0123456789abcdef0123456789abcdef.csv", T);
ok(tasksDb.kind === "tasks" && tasksDb.tasks.length === 2 && tasksDb.done === 1 && tasksDb.name === "Tasks", "a task database: " + JSON.stringify(tasksDb));
ok(tasksDb.tasks[0].due === "2026-10-22" && tasksDb.tasks[0].priority === "high" && tasksDb.tasks[1].due === "2026-10-26" && tasksDb.tasks[1].start === "2026-10-24", "dates, ranges and priority");
const deckDb = IA.notionTable("Term,Definition,Tags\nOsmosis,Water moving across a membrane,bio\n,missing\nATP,Energy currency,", "Vocab abc.csv", T);
ok(deckDb.kind === "deck" && deckDb.cards.length === 2 && deckDb.cards[0].back === "Water moving across a membrane", "a flashcard database");
ok(IA.notionTable("Name,Tags,Created\nx,y,z", "Other.csv", T) === null, "another kind of table is left out");

const files = [
  {name: "Export/Home 0123456789abcdef0123456789abcdef.md", text: "# Home\n\nWelcome page"},
  {name: "Export/Home/Empty 11111111111111111111111111111111.md", text: "# Empty\n"},
  {name: "Export/Tasks 22222222222222222222222222222222.csv", text: "Name,Date\nA,\"October 23, 2026\""},
  {name: "Export/Tasks 22222222222222222222222222222222_all.csv", text: "Name,Date\nA,\"October 23, 2026\"\nB,"},
  {name: "Export/Tasks/A 33333333333333333333333333333333.md", text: "# A\n\nDate: October 23, 2026"},
  {name: "Export/Vocab 44444444444444444444444444444444.csv", text: "Front,Back\nq,a"},
  {name: "Export/Big 55555555555555555555555555555555.md", text: "# Big\n\n" + "word ".repeat(3000)},
];
const p = IA.plan(files, T);
eq(p.groups.map(g => g.kind + ":" + g.name + ":" + g.items.length), ["tasks:Tasks:2", "deck:Vocab:1", "notes:Pages:2"], "a Notion export: database rows aren't notes too, the _all view wins, empty pages skipped");
ok(p.groups[2].items[0].text === "Home\n\nWelcome page" && p.groups[2].items[1].text.length <= 8000 && p.notesCut === 1, "notes text, long pages shortened");

// courses
const courses = [{id: "c1", name: "Biology", code: "BIO 101"}, {id: "c2", name: "Chemistry", code: "CHEM 2"}, {id: "c3", name: "Art", code: ""}];
eq([IA.matchCourse("BIO 101 [123].csv", courses), IA.matchCourse("bio101 homework", courses), IA.matchCourse("Chemistry notes", courses), IA.matchCourse("Party", courses)], ["c1", "c1", "c2", ""], "a course from the file name");
console.log(`import-apps.test: ${n} checks passed`);
