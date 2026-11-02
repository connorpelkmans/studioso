// Unit tests for OneNote (the pure block between /*ONENOTE-START*/ and /*ONENOTE-END*/): the page Save to OneNote sends,
// which pages a linked section brings in, and the checks on a note's OneNote fields. Reading a page's HTML is in onenote.e2e.js
"use strict";
const assert = require("assert");
const s = require("../scripts/app-files").source();
const between = (a, b) => { const i = s.indexOf(a), j = s.indexOf(b, i); assert(i >= 0 && j > i, "marker " + a); return s.slice(i + a.length, j); };
const O = new Function(between("/*ONENOTE-START*/", "/*ONENOTE-END*/") + ";return ONENOTE;")();
let n = 0; const ok = (c, m) => { n++; assert(c, m); }; const eq = (a, b, m) => { n++; assert.deepStrictEqual(a, b, m); };

// Save to OneNote: the page
const html = O.pageHtml("Cell division\n\nMitosis makes two cells & keeps <chromosomes>\n• Prophase\n• Metaphase\n1. Count\n2. Draw\n☐ Read ch. 5\n☑ Watch video\n## Key terms\nSee [[Lecture 3|the lecture]] and [[Lab 2]]", Date.parse("2026-11-02T10:00:00Z"));
ok(html.includes("<title>Cell division</title>"), "the first line is the title");
ok(html.includes('<meta name="created" content="2026-11-02T10:00:00.000Z" />'), "created time");
ok(html.includes("<p>Mitosis makes two cells &amp; keeps &lt;chromosomes&gt;</p>"), "text is escaped");
ok(html.includes("<ul><li>Prophase</li><li>Metaphase</li></ul>"), "bullets become a list");
ok(html.includes("<ol><li>Count</li><li>Draw</li></ol>"), "numbered lines become a numbered list");
ok(html.includes('<p data-tag="to-do">Read ch. 5</p>') && html.includes('<p data-tag="to-do:completed">Watch video</p>'), "checkboxes become OneNote to-dos");
ok(html.includes("<h2>Key terms</h2>"), "a # heading");
ok(html.includes("See the lecture and Lab 2") && !html.includes("[["), "[[links]] become plain text");
ok(!/<script/i.test(O.pageHtml("<script>alert(1)</script>\n<script>x</script>")), "no markup gets through");
ok(O.pageHtml("").includes("<title>Studyboard note</title>"), "an empty note still has a title");

// Which pages come in
const pg = (id, m, title) => ({id, title: title || id, lastModifiedDateTime: m, links: {oneNoteWebUrl: {href: "https://onedrive.live.com/view.aspx?p=" + id}}});
const note = (p, m, text, edited) => ({id: "n" + p, text: edited ? text + " (mine)" : text, on: {p, s: "S", m: new Date(m).toISOString(), h: O.hash(text)}});
const pages = [pg("a", "2026-11-01T10:00:00Z"), pg("b", "2026-11-02T10:00:00Z"), pg("c", "2026-10-01T10:00:00Z"), pg("d", "2026-11-02T09:00:00Z"), pg("e", "2026-11-02T08:00:00Z")];
const notes = [note("a", "2026-11-01T10:00:00Z", "A"), note("b", "2026-11-01T10:00:00Z", "B"), note("d", "2026-11-01T10:00:00Z", "D", true)];
const P = O.plan(pages, notes, ["c"]);
eq(P.fetch.map(x => x.page.id), ["b", "e"], "changed (b) and new (e) pages, newest first; unchanged (a) left alone");
ok(P.fetch[0].note && P.fetch[0].note.id === "nb" && P.fetch[1].note === null, "an update knows its note");
eq([P.kept, P.gone], [1, 1], "a note edited in Studyboard (d) keeps its edits; a page whose note was deleted (c) isn't brought back");
const many = Array.from({length: O.PER_RUN + 7}, (_, i) => pg("p" + i, "2026-11-02T10:00:00Z"));
const M = O.plan(many, [], []);
eq([M.fetch.length, M.more], [O.PER_RUN, 7], "a big section comes in over several updates");
eq(O.plan([{id: "x".repeat(300)}, null, {nope: 1}], [], []).fetch.length, 0, "junk in the list is skipped");

// small pieces
eq(O.webUrl({links: {oneNoteWebUrl: {href: "https://x.sharepoint.com/a"}}}), "https://x.sharepoint.com/a", "a page's web link");
eq(O.webUrl({links: {oneNoteWebUrl: {href: "javascript:alert(1)"}}}), "", "only https links");
eq(O.seenNext(["a", "b"], ["b", "c"]), ["b", "c", "a"], "seen pages, newest first, no repeats");
eq(O.normOn({p: "a", s: "S", u: "javascript:x", m: "2026", h: "z"}), {p: "a", s: "S", u: "", m: "2026", h: "z"}, "a bad link is dropped");
eq(O.normOn({s: "S"}), null, "no page, nothing");
ok(O.hash("abc") === O.hash("abc") && O.hash("abc") !== O.hash("abd"), "the fingerprint tells texts apart");

console.log(`onenote.test: ${n} checks passed`);
