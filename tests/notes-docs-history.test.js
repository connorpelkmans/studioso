// Tests for note version history (undo), Notes to Word/Google Docs, and the Your Photo theme fixes.  Run: node tests/notes-docs-history.test.js
const fs = require("fs"), path = require("path"), assert = require("assert"), cp = require("child_process"), os = require("os");
const s = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
let n = 0; const ok = (c, m) => { n++; assert(c, m); };
const between = (a, b) => { const i = s.indexOf(a), j = s.indexOf(b, i); assert(i >= 0 && j > i, "marker " + a); return s.slice(i + a.length, j); };

// ---- note history
const H = new Function(between("/*NOTEHIST-START*/", "/*NOTEHIST-END*/") + ";return {NH_CAP, nhRemoved, nhAdd, nhTrimAll, nhChain};")();
ok(H.nhRemoved("hello world", "hello world!") === 0, "adding at the end removes nothing");
ok(H.nhRemoved("hello world", "") === 11, "select all and delete");
ok(H.nhRemoved("hello world", "hello brave world") === 0, "inserting in the middle removes nothing");
ok(H.nhRemoved("one two three", "one X three") === 3, "replacing a word");
ok(H.nhRemoved("a".repeat(100), "b") === 100, "select all and type one letter counts as a big change");
let l = H.nhAdd([], "first", 1, "x");
ok(l.length === 1 && l[0].text === "first" && l[0].label === "x", "adds");
ok(H.nhAdd(l, "first", 2) === l, "a repeat of the newest is skipped");
ok(H.nhAdd(l, "   \n", 2) === l, "blank text is skipped");
for (let i = 0; i < 40; i++) l = H.nhAdd(l, "v" + i, 10 + i);
ok(l.length === H.NH_CAP.per && l[l.length - 1].text === "v39" && l[0].text === "v20", "per-note count cap keeps the newest");
let big = []; for (let i = 0; i < 20; i++) big = H.nhAdd(big, String(i).repeat(1) + "x".repeat(7999), i);
ok(big.reduce((a, x) => a + x.text.length, 0) <= H.NH_CAP.perChars && big[big.length - 1].at === 19, "per-note size cap");
ok(H.nhAdd([], "y".repeat(20000), 1)[0].text.length === H.NH_CAP.text, "one text is clipped to the note limit");
const all = {a: [{at: 1, text: "x".repeat(200000)}, {at: 5, text: "y"}], b: [{at: 2, text: "z".repeat(200000)}], gone: [{at: 0, text: "q"}]};
const tr = H.nhTrimAll(all, id => id !== "gone", 300000);
ok(!tr.gone && !tr.a.some(x => x.at === 1) && tr.b.length === 1, "unknown notes and the oldest snapshots go first: " + JSON.stringify(Object.keys(tr)));
ok(H.nhChain(["a", "a", "b"], "c").join() === "a,b,c" && H.nhChain(["a", "b"], "b").join() === "a,b", "undo chain ends with the text on screen, no repeats");

// ---- notes to documents
const code = between("/*NOTEDOC-START*/", "/*NOTEDOC-END*/");
const zipSrc = s.slice(s.indexOf("function crc32(bytes){"), s.indexOf("function zipOne(")) + s.slice(s.indexOf("function zipMany(entries){"), s.indexOf("function unzipStored("));
const D = new Function(zipSrc + code + ";return {noteDocModel, noteDocHtml, noteDocText, noteDocx, zipMany, nxX, NX_MIME};")();
const notes = [
  {id: "1", text: "Cell cycle\nG1, S, G2, M\n\n  indented <b>& more", courseId: "c1", created: 2},
  {id: "2", text: "", courseId: "", created: 1},
  {id: "3", text: "Quick idea \u{1F600}\u0007 \"quoted\"", courseId: "c1", created: 1},
  {id: "4", text: "x".repeat(150), courseId: "c0", created: 3}
];
const model = D.noteDocModel(notes, {courseName: id => ({c1: "BIO 101 · Biology", c0: "Art"})[id], taskTitle: nn => nn.id === "1" ? "Lab report" : "", when: () => "Oct 4, 2026", date: "Sunday"});
ok(model.groups.map(g => g.name).join("|") === "Art|BIO 101 · Biology|Other notes", "course groups sorted, no-course last: " + model.groups.map(g => g.name));
const bio = model.groups[1].notes;
ok(bio[0].title === "Quick idea \u{1F600}\u0007 \"quoted\"" || bio[0].title.startsWith("Quick idea"), "oldest note first");
ok(bio[1].title === "Cell cycle" && bio[1].body.length === 3 && bio[1].task === "Lab report", "first line is the heading, rest is the body");
ok(model.groups[0].notes[0].title.endsWith("…") && model.groups[0].notes[0].body[0].length === 150, "very long first line becomes body text");
ok(model.groups[2].notes[0].title === "Untitled note", "empty note");
const html = D.noteDocHtml(model);
ok(html.includes("indented &lt;b&gt;&amp; more") && !html.includes("<b>&") && !html.includes("\u0007"), "html is escaped and control characters are dropped");
ok(D.noteDocText(model).includes("BIO 101 · BIOLOGY") && D.noteDocText(model).includes("Cell cycle\nG1, S, G2, M"), "plain text");
const bytes = D.noteDocx(model, D.zipMany);
ok(bytes instanceof Uint8Array && bytes[0] === 0x50 && bytes[1] === 0x4b, "zip signature");
// read the stored zip back
const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength), files = {};
let p = 0; while (dv.getUint32(p, true) === 0x04034b50) { const sz = dv.getUint32(p + 18, true), nl = dv.getUint16(p + 26, true), nm = Buffer.from(bytes.slice(p + 30, p + 30 + nl)).toString(); files[nm] = Buffer.from(bytes.slice(p + 30 + nl, p + 30 + nl + sz)).toString("utf8"); p += 30 + nl + sz; }
ok(Object.keys(files)[0] === "[Content_Types].xml" && ["_rels/.rels", "word/document.xml", "word/styles.xml", "word/_rels/document.xml.rels"].every(k => k in files), "docx parts: " + Object.keys(files));
Object.entries(files).forEach(([k, v]) => {   // well-formed: every tag opens and closes
  const st = []; let m; const re = /<(\/?)([A-Za-z0-9:]+)[^>]*?(\/?)>/g; const body = v.replace(/<\?[^>]*\?>/g, "");
  while ((m = re.exec(body))) { if (m[3]) continue; if (m[1]) { ok(st.pop() === m[2], k + " closes " + m[2]); } else st.push(m[2]); }
  ok(st.length === 0, k + " is balanced");
});
const doc = files["word/document.xml"];
ok(doc.includes('w:pStyle w:val="Heading1"') && doc.includes("indented &lt;b&gt;&amp; more") && doc.includes("Attached to: Lab report") && !doc.includes("\u0007"), "document.xml content");
// zip integrity: the archive tools agree with our CRCs (skipped where unzip is missing)
try {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "nx-")), f = path.join(dir, "n.docx"); fs.writeFileSync(f, bytes);
  cp.execSync("unzip -tq " + f, {stdio: "pipe"}); ok(true, "unzip -t");
} catch (e) { if (!/not found|ENOENT/.test(String(e.stderr || e.message))) throw e; }

// ---- Your Photo theme: the picked color and gradient never paint over the photo
const stackSrc = s.slice(s.indexOf("  function stack(rec, photoImg){"), s.indexOf("  const lay = (pre, L, key)"));
const stack = new Function(stackSrc + ";return stack;")();
const rec = {fx: 40, fy: 60, vg: 0, gr: {m: "on", t: "linear", a: 135, c: ["#FF0000", "#0000FF"], op: 100}, tn: {c: "#00FF00", a: 100, b: "normal"}};
let L = stack(rec, "url(photo)");
ok(L.length === 1 && L[0].i === "url(photo)" && L[0].b === "normal", "with a gradient and a tint the photo is the only layer");
L = stack(Object.assign({}, rec, {vg: 50}), "url(photo)");
ok(L.length === 2 && !/#FF0000|rgba\(255,0,0|rgba\(0,255,0/i.test(L.map(x => x.i).join()), "only the vignette sits on the photo");
ok(!/\bgr\.m === "only"/.test(s.slice(s.indexOf("module: 98-photo.js"))), "no 'gradient instead of photo' mode left");

// ---- the theme only changes when the person changes it
const hookSrc = s.slice(s.indexOf("let missAt = 0, missTimer = 0;"), s.indexOf("hook(\"boot\", () => { setTimeout(() => housekeeping(true), 2500); });"));
ok(hookSrc.includes("grace") && !/setTimeout\(\(\) => \{ const c = styleCfg\(\); if \(isPh\(c\.skin\) && !recOf\(c\.skin\)\) \{ saveStyle/.test(hookSrc), "a missing photo record no longer resets the saved theme at once");
// run the render hook with stubs: a record that is missing for a moment and comes back must keep the theme; one that stays missing past the grace time is given up
function run(recBack){
  const saved = []; let render, now = 1000; const timers = [];
  const env = {
    hook: (k, f) => { if (k === "render") render = f; }, styleCfg: () => ({skin: "ph-1"}), isPh: id => /^ph-/.test(id), recOf: () => (recBack.v ? {id: "ph-1"} : null),
    root: {dataset: {}}, appliedSig: "", applySkin: () => {}, scheduleRender: () => {}, saveStyle: p => saved.push(p), prevSkin: () => "koi", grace: 30000, housekeeping: () => {},
    Date: {now: () => now}, setTimeout: (f, ms) => { timers.push({f, at: now + ms}); return timers.length; }, clearTimeout: () => {}, JSON, console
  };
  new Function(...Object.keys(env), "let hkTimer = 0;" + hookSrc.slice(0, hookSrc.indexOf("hook(\"boot\"")) + ";")(...Object.values(env));
  return {render: () => render(), saved, advance: ms => { now += ms; timers.splice(0).forEach(t => { if (t.at <= now) t.f(); else timers.push(t); }); }, back: () => { recBack.v = true; }};
}
let r = run({v: false}); r.render(); r.advance(1); ok(r.saved.length === 0, "not reset right away");
r.back(); r.advance(40000); ok(r.saved.length === 0, "record came back: the theme stays");
r = run({v: false}); r.render(); r.advance(31000); ok(r.saved.length === 1 && r.saved[0].skin === "koi", "still missing after the grace time: given up once");

console.log("notes-docs-history: " + n + " checks passed");
