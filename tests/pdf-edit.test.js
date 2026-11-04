// node tests/pdf-edit.test.js
// The PDF editor's engine (module 99-pdf-edit): reading page content, taking letters out, and writing the edited file
const assert = require("assert"), path = require("path");
const L = require("pdf-lib");
const src = require("../scripts/app-files").source();
const block = (a, b, names) => { const i = src.indexOf(a), j = src.indexOf(b, i); assert.ok(i > 0 && j > i, "markers " + a); return new Function(src.slice(i + a.length, j) + `; return {${names}};`)(); };
const E = block("/*PDFEDIT-ENGINE-START*/", "/*PDFEDIT-ENGINE-END*/", "pdeLex, pdeStrip, pdeBake, pdeProbe, pdeBadChars, pdeTidy, pdeInside, pdeCmap, pdeWrap, pdeFontRights, pdeShapeOps, pdeReorg, pdeSigned, pdeOcrLayer, pdeCompress, pdeShown, pdeNumText, pdePage, pdeImages, pdeDetectFields, pdeProtect");
const T = block("/*PDFTOOLS-START*/", "/*PDFTOOLS-END*/", "pdtParagraphs, pdtDocxBody, pdtTokens");
const RV = block("/*REVIEW-START*/", "/*REVIEW-END*/", "REVIEW_ON, reviewNorm, reviewMerge, reviewCan, reviewKey, reviewMemoryStore");
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const enc = s => Buffer.from(s, "latin1");
const dec = u8 => Buffer.from(u8).toString("latin1");

// A one-page PDF from a content stream, with Helvetica as /F1 (no widths in the file, like many generators)
function pdf(content, extra){
  const objs = ["<< /Type /Catalog /Pages 2 0 R >>", "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R /F2 6 0 R >> >> /Contents 5 0 R${(extra && extra.page) || ""} >>`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>", `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Times-Roman /Encoding /WinAnsiEncoding >>"];
  if (extra && extra.objs) objs.push(...extra.objs);
  let out = "%PDF-1.4\n"; const offs = [];
  objs.forEach((o, i) => { offs.push(out.length); out += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const x = out.length;
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + offs.map(o => String(o).padStart(10, "0") + " 00000 n \n").join("") + `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R${(extra && extra.trailer) || ""} >>\nstartxref\n${x}\n%%EOF`;
  return new Uint8Array(enc(out));
}
let pdfjs = null;
async function textOf(bytes){
  if (!pdfjs) pdfjs = await import(path.join(__dirname, "..", "node_modules", "pdfjs-dist", "legacy", "build", "pdf.mjs"));
  const doc = await pdfjs.getDocument({data: bytes.slice(), disableFontFace: true, isEvalSupported: false, verbosity: 0}).promise;
  const tc = await (await doc.getPage(1)).getTextContent();
  return tc.items.filter(i => i.str.trim()).map(i => ({s: i.str, x: i.transform[4], y: i.transform[5], w: i.width, fs: Math.hypot(i.transform[2], i.transform[3])}));
}
const region = (it, extra) => Object.assign({k: "t", p: 1, o: [it.x, it.y], r: 0, w: it.w, y0: -0.22 * it.fs, y1: 0.9 * it.fs, fs: it.fs, f: "h", b: 0, i: 0, c: "#000000", bg: "#ffffff", old: it.s}, extra);

(async () => {
  /* Reading content */
  const ops = E.pdeLex(enc("q % a comment (not a string)\n/P <</MCID 3 /Alt (a\\)b)>> BDC BT /F1 12 Tf (a\\(b\\)c \\101\\\\ (nest) x) Tj <48 65 6c 6C 6f> Tj [(A) -120 (B)] TJ ET EMC\nBI /W 2 /H 1 /BPC 8 /CS /G ID \x00EI\xffx EI Q"));
  const names = ops.map(o => o.op);
  ok(names.join(" ") === "q BDC BT Tf Tj Tj TJ ET EMC BI Q", "operators in order, with comments, dictionaries and an inline image skipped: " + names.join(" "));
  ok(dec(ops[4].args[0].v) === "a(b)c A\\ (nest) x", "literal strings: escapes, octal and nested brackets");
  ok(dec(ops[5].args[0].v) === "Hello", "hex strings");
  ok(ops[6].args[0].v.length === 3 && ops[6].args[0].v[1].v === -120, "TJ arrays keep their spacing numbers");
  ok(names[9] === "BI" && names[10] === "Q", "image data that happens to hold “EI” doesn't end the image early");

  /* Taking letters out without moving the others */
  const c1 = "BT /F1 14 Tf 72 700 Td (Mitochondria produce most of the cell's ATP.) Tj ET\nBT /F1 14 Tf 72 676 Td (Ribosomes build proteins.) Tj ET";
  const b1 = pdf(c1), t1 = await textOf(b1);
  const line = t1.find(i => /Mitochondria/.test(i.s));
  const hv = L.StandardFontEmbedder.for(L.StandardFonts.Helvetica), wd = s => hv.widthOfTextAtSize(s, 14);
  const x0 = 72 + wd("Mitochondria produce "), x1 = x0 + wd("most");
  const r1 = await E.pdeBake(L, b1, [{k: "w", p: 1, o: [x0 + 1, 696], r: 0, w: x1 - x0 - 2, h: 14, bg: "#ffffff"}]);
  const t1b = await textOf(r1.bytes), rest = t1b.filter(i => /Mitochondria|of the cell/.test(i.s));
  ok(!t1b.some(i => /most/.test(i.s)) && rest.length >= 1, "a white-out takes out just the word under it: " + t1b.map(i => i.s).join(" | "));
  const of = t1b.find(i => /of the cell/.test(i.s));
  ok(of && Math.abs(of.x - (x1 + wd(" "))) < 0.6 || (rest.length === 1 && /Mitochondria produce\s+of the cell/.test(rest[0].s)), "the words after it stay exactly where they were");
  ok(t1b.some(i => i.s === "Ribosomes build proteins."), "other lines aren't touched");

  /* Replacing a line keeps the PDF's font when it has the letters */
  const r2 = await E.pdeBake(L, b1, [region(line, {t: "Chloroplasts produce most of the cell's sugar."})]);
  const t2 = await textOf(r2.bytes);
  ok(t2.some(i => /Chloroplasts produce most of the cell.s sugar\./.test(i.s)) && !t2.some(i => /Mitochondria|ATP/.test(i.s)), "the line's text is replaced in the file");
  ok(r2.report.kept === 1 && r2.report.swapped === 0 && r2.report.covered === 0, "in the PDF's own font, with nothing left to cover: " + JSON.stringify(r2.report));
  const nl = t2.find(i => /Chloroplasts/.test(i.s));
  ok(Math.abs(nl.x - 72) < 0.01 && Math.abs(nl.y - 700) < 0.01 && Math.abs(nl.fs - 14) < 0.01, "on the same baseline, at the same size");
  const r2b = await E.pdeBake(L, b1, [region(line, {t: "Mitochondria café"})]);
  ok(r2b.report.swapped === 1 && (await textOf(r2b.bytes)).some(i => /Mitochondria/.test(i.s)), "a letter the font can't draw (é) falls back to a standard font rather than failing");
  const r2c = await E.pdeBake(L, b1, [region(line, {t: ""})]);
  ok(!(await textOf(r2c.bytes)).some(i => /Mitochondria/.test(i.s)), "an empty line removes the text");
  const rQ = await E.pdeBake(L, b1, [{k: "n", p: 1, o: [72, 500], r: 0, fs: 12, f: "h", t: "Room Ω and 📚"}]);
  ok(rQ.report.qmarks === 2 && r2b.report.qmarks === 0, "letters no font can draw become ?, and the report counts them so saving can say so: " + rQ.report.qmarks);

  /* Kerning arrays, ' and ", Tz and Tc, and a WinAnsi font */
  const c3 = "BT /F2 12 Tf 14 TL 80 600 Td [(Mid) 40 (term) -250 (on) -250 (Friday)] TJ (Second line) ' 2 0.5 (Third line) \" 110 Tz 1 Tc 0 -40 Td (Wide caf\xe9 text) Tj ET";
  const b3 = pdf(c3), t3 = await textOf(b3);
  for (const want of ["Second line", "Third line", "Wide café text"]) {
    const it = t3.find(i => i.s.includes(want.split(" ")[0])); assert(it, want);
    const r = await E.pdeBake(L, b3, [region(it, {f: "t", t: "Changed: " + want})]);
    const tx = (await textOf(r.bytes)).map(i => i.s).join(" | ");
    ok(tx.includes("Changed: " + want) && tx.split(want).length === 2 && r.report.covered === 0, `replaced a line shown with ${want === "Second line" ? "'" : want === "Third line" ? '"' : "Tz and Tc"}: ${tx}`);
  }
  const mid = t3.find(i => /Mid/.test(i.s)), r3 = await E.pdeBake(L, b3, [region(mid, {f: "t", t: "Final on Monday"})]);
  ok((await textOf(r3.bytes)).some(i => i.s === "Final on Monday") && r3.report.kept === 1, "a TJ line with kerning is replaced in the PDF's own font");

  /* Unbalanced q/Q and a moved, rotated coordinate system */
  const c4 = "Q 1 0 0 1 100 100 cm q 0 1 -1 0 300 200 cm BT /F1 12 Tf 0 0 Td (Turned text here) Tj ET";
  const b4 = pdf(c4), t4 = await textOf(b4), turned = t4.find(i => /Turned/.test(i.s));
  const tr = turned && (await (async () => { const pj = await import(path.join(__dirname, "..", "node_modules", "pdfjs-dist", "legacy", "build", "pdf.mjs")); const d = await pj.getDocument({data: b4.slice(), verbosity: 0}).promise; const it = (await (await d.getPage(1)).getTextContent()).items.find(i => /Turned/.test(i.str)); return it.transform; })());
  const rot = Math.atan2(tr[1], tr[0]) * 180 / Math.PI;
  const r4 = await E.pdeBake(L, b4, [region(turned, {r: rot, t: "Upright now"})]);
  const t4b = await textOf(r4.bytes);
  ok(!t4b.some(i => /Turned/.test(i.s)) && t4b.some(i => i.s === "Upright now"), "rotated text inside a moved coordinate system is found and replaced (rotation " + Math.round(rot) + "°)");
  const nu = t4b.find(i => i.s === "Upright now");
  ok(Math.abs(nu.x - turned.x) < 0.01 && Math.abs(nu.y - turned.y) < 0.01, "and lands where the old text started, even after an extra Q in the page");

  /* Two-byte fonts (Identity-H) with a ToUnicode map, as Word and Chrome write them */
  const cmap = "/CIDInit /ProcSet findresource begin 12 dict begin begincmap 1 begincodespacerange <0000> <FFFF> endcodespacerange 3 beginbfchar <0003> <0020> <0010> <0041> <0011> <0042> endbfchar 1 beginbfrange <0020> <0022> <0063> endbfrange endcmap end end";
  const cm = E.pdeCmap(enc(cmap));
  ok(cm.map.get(0x10) === "A" && cm.map.get(0x21) === "d" && cm.map.get(3) === " ", "ToUnicode maps: single codes and ranges");
  const c5 = "BT /F3 12 Tf 72 500 Td <0010001100030020> Tj ET";
  const b5 = pdf(c5, {page: "", objs: [`<< /Type /Font /Subtype /Type0 /BaseFont /ABCDEF+Calibri /Encoding /Identity-H /DescendantFonts [8 0 R] /ToUnicode 9 0 R >>`, `<< /Type /Font /Subtype /CIDFontType2 /BaseFont /ABCDEF+Calibri /CIDSystemInfo << /Registry (Adobe) /Ordering (Identity) /Supplement 0 >> /DW 500 /W [3 [250] 16 [600 550]] /FontDescriptor 10 0 R >>`, `<< /Length ${cmap.length} >>\nstream\n${cmap}\nendstream`, "<< /Type /FontDescriptor /FontName /ABCDEF+Calibri /Flags 32 /FontBBox [0 0 1000 1000] /ItalicAngle 0 /Ascent 750 /Descent -250 /CapHeight 700 /StemV 80 >>"]});
  const b5f = new Uint8Array(enc(dec(b5).replace("/Font << /F1 4 0 R /F2 6 0 R >>", "/Font << /F1 4 0 R /F2 6 0 R /F3 7 0 R >>")));
  const doc5 = await L.PDFDocument.load(b5f);
  const e5 = {k: "t", p: 1, o: [72, 500], r: 0, w: 600 * 0.012 + 550 * 0.012 + 3 + 6, y0: -3, y1: 11, fs: 12, f: "h", old: "AB c", t: "BA d"};
  const pr = E.pdeProbe(L, doc5, 1, [e5])[0];
  ok(pr && pr.hits === 3 && pr.keep === true && pr.base === "Calibri" && !pr.serif, "a two-byte font: its letters are found, it can draw “BA d”, and its name is read: " + JSON.stringify(pr));
  ok(E.pdeProbe(L, doc5, 1, [Object.assign({}, e5, {t: "Zebra"})])[0].keep === false, "but not letters it doesn't have (cut-down fonts)");
  const r5 = await E.pdeBake(L, b5f, [e5]), body = await (async () => { const d = await L.PDFDocument.load(r5.bytes); const pg = d.getPages()[0].node, cs = d.context.lookup(pg.get(L.PDFName.of("Contents"))); return [0, 1].map(k => dec(L.decodePDFRawStream(d.context.lookup(cs.get(k))).decode())).join("\n"); })();
  ok(/\/F3 12 Tf/.test(body) && /<0011001000030021>/.test(body), "it's written with the same font and two-byte codes");
  ok(/\[\s*(-?[\d.]+\s*)*\]\s*TJ/.test(body) && !/<0010001100030020>/.test(body), "and the old letters are gone from the page");

  /* Locked files */
  const b6 = pdf("BT /F1 12 Tf 72 700 Td (Secret) Tj ET", {objs: ["<< /Filter /Standard /V 1 /R 2 /O (aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa) /U (aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa) /P -4 >>"], trailer: " /Encrypt 7 0 R /ID [<00> <00>]"});
  let locked = null; try { await E.pdeBake(L, b6, [{k: "w", p: 1, o: [70, 690], r: 0, w: 60, h: 20}]); } catch (e) { locked = e; }
  ok(locked && locked.code === "locked", "an encrypted PDF is refused, not written broken");

  /* Text the PDF's fonts can draw */
  const r2d = await E.pdeBake(L, b1, [region(line, {t: "Arrow → here"})]);
  ok((await textOf(r2d.bytes)).some(i => /Arrow \? here/.test(i.s)), "a letter no font here can draw becomes ? instead of stopping the save");
  ok(E.pdeBadChars("Café – “quotes” €5").length === 0 && E.pdeBadChars("日本 ok ж").join("") === "日本ж", "letters outside Windows-1252 are caught before saving");
  ok(E.pdeTidy("a‑b c​d−e") === "a-b cd-e", "pasted text is tidied (non-breaking hyphens, spaces, invisible characters, minus signs)");

  /* What's kept on the file (and synced) is checked */
  const fn = src.slice(src.indexOf("function normPdfEdits("), src.indexOf("\n}\n", src.indexOf("function normPdfEdits(")) + 2);
  const norm = new Function(fn + "; return normPdfEdits;")();
  const kept = norm([{id: "a", a: "r1", p: 2, k: "t", o: [1, 2], r: 0, w: 50, y0: -2, y1: 9, fs: 10, t: "x", old: "y", c: "#FF0000", bg: "#fff", cf: "\"Georgia\",serif"},
    {id: "b", k: "w", p: 1, o: [0, 0], w: 0, h: 5}, {id: "c", k: "n", p: 1, o: [5, 5], fs: 9999, t: "z".repeat(5000), c: "red", f: "comic"}, {id: "a", k: "n", p: 1, o: [0, 0], fs: 9}, {id: "<x>", k: "n", p: 1, o: [0, 0], fs: 9},
    {id: "d", k: "t", p: 1, o: [0, 0], w: 5, y0: 4, y1: 2, fs: 9}, {id: "e", k: "t", p: 1, o: [0, 0], w: 5, y0: 0, y1: 2, fs: 9, cf: "x;background:url(evil)"}], 200);
  ok(kept.map(e => e.id).join() === "a,c,e", "bad edits are dropped (no size, duplicate or odd ids, upside-down areas)");
  ok(kept[0].c === "#ff0000" && kept[0].bg === "#ffffff" && kept[0].cf === "\"Georgia\",serif", "colors must be #rrggbb, font names plain");
  ok(kept[1].fs === 500 && kept[1].t.length === 2000 && kept[1].c === "#000000" && kept[1].f === "h", "sizes, lengths, colors and fonts are clamped");
  ok(!("cf" in kept[2]), "a font name that could carry CSS is dropped");

  /* Paragraphs, font licences, marks, forms, markup and pages */
  ok(JSON.stringify(E.pdeWrap("one two three\nfour", 9, t => t.length)) === JSON.stringify([{t: "one two", end: false}, {t: "three", end: true}, {t: "four", end: true}]), "paragraphs wrap to their width, and keep their line breaks");
  ok(E.pdeWrap("abcdefghijkl", 5, t => t.length).map(l => l.t).join("|") === "abcde|fghij|kl", "a word wider than the paragraph is split");
  const fs = t => ({"OS/2": {fsType: Object.assign({noEmbedding: false, viewOnly: false, editable: false, noSubsetting: false, bitmapOnly: false}, t)}});
  ok(E.pdeFontRights(fs({})).ok && E.pdeFontRights(fs({})).subset, "an installable font can be embedded, as a subset");
  ok(!E.pdeFontRights(fs({noEmbedding: true})).ok && /Restricted/.test(E.pdeFontRights(fs({noEmbedding: true})).why), "a font marked Restricted License can't be put in a PDF, and says why");
  ok(!E.pdeFontRights(fs({bitmapOnly: true})).ok, "nor one that only allows its bitmaps");
  ok(E.pdeFontRights(fs({viewOnly: true})).ok && /viewing and printing only/.test(E.pdeFontRights(fs({viewOnly: true})).why), "a Preview & Print font can be used, and says it's for viewing and printing");
  ok(E.pdeFontRights(fs({noSubsetting: true})).subset === false, "a font that forbids subsetting is embedded whole");
  ok(/re S/.test(E.pdeShapeOps({sh: "rect", o: [10, 10], w: 20, h: 10})) && / c /.test(E.pdeShapeOps({sh: "ellipse", o: [0, 0], w: 20, h: 10})) && /h f/.test(E.pdeShapeOps({sh: "arrow", pts: [0, 0, 50, 50]})), "marks become drawing instructions (box, circle, arrow with its head)");
  const fdoc = await L.PDFDocument.create(), fpg = fdoc.addPage([612, 792]), form = fdoc.getForm();
  form.createTextField("name").addToPage(fpg, {x: 50, y: 700, width: 200, height: 20}); form.createCheckBox("ok").addToPage(fpg, {x: 50, y: 650, width: 14, height: 14});
  const fbytes = await fdoc.save();
  const rf = await E.pdeBake(L, fbytes, [{k: "f", name: "name", v: "Ana López"}, {k: "f", name: "ok", v: true}, {k: "f", name: "missing", v: "x"}]);
  const ff = (await L.PDFDocument.load(rf.bytes)).getForm();
  ok(ff.getTextField("name").getText() === "Ana López" && ff.getCheckBox("ok").isChecked() && rf.report.fields === 2 && rf.report.fieldsSkipped === 1, "form answers are written into the fields; a field that isn't there is counted, not fatal");
  const ra = await E.pdeBake(L, b1, [], {annots: [{p: 1, k: "hl", quads: [[72, 715, 200, 715, 72, 700, 200, 700]], c: "#ffd84d", t: "Mitochondria"}, {p: 1, k: "ink", paths: [[[80, 600], [120, 640]]], w: 2, c: "#2457c5"}]});
  const annots = (await L.PDFDocument.load(ra.bytes)).getPages()[0].node.Annots();
  ok(annots && annots.size() === 2 && ra.report.annots === 2, "highlights and handwriting become standard PDF annotations");
  ok(/Studyboard/.test((await L.PDFDocument.load(ra.bytes, {updateMetadata: false})).getProducer() || ""), "a saved file says it was edited with Studyboard");
  const two = await (async () => { const d = await L.PDFDocument.create(); for (let i = 0; i < 3; i++) d.addPage([612, 792]); return d.save(); })();
  const re3 = await L.PDFDocument.load(await E.pdeReorg(L, two, [{s: 0, p: 3, rot: 90}, {blank: [300, 300]}, {s: 1, p: 1}, {s: 0, p: 1}], [b1]));
  ok(re3.getPageCount() === 4 && re3.getPages()[0].getRotation().angle === 90 && re3.getPages()[1].getWidth() === 300, "pages: a new order, turned, a blank page, and a page from another PDF");
  let none = null; try { await E.pdeReorg(L, two, []); } catch (e) { none = e; } ok(none, "a PDF can't be left with no pages");
  ok(E.pdeSigned(L, await L.PDFDocument.load(fbytes)) === 0, "a PDF without a filled signature field isn't treated as signed");
  const kept2 = norm([{id: "p1", k: "p", p: 1, o: [1, 2], fs: 10, W: 300, lh: 14, al: "j", lines: [{o: [1, 2], w: 300, y0: -2, y1: 9, old: "a"}, {o: [1, -12], w: 5, y0: 4, y1: 2}], t: "x"},
    {id: "s1", k: "s", p: 1, sh: "arrow", o: [0, 0], pts: [0, 0, 5, 5], c: "#c0262d", lw: 2}, {id: "s2", k: "s", p: 1, sh: "star", o: [0, 0], w: 5, h: 5},
    {id: "i1", k: "i", p: 1, o: [0, 0], w: 50, h: 20, img: "0123456789abcdef", sig: 1}, {id: "i2", k: "i", p: 1, o: [0, 0], w: 50, h: 20, img: "../evil"},
    {id: "f1", k: "f", p: 1, name: "name", v: "Ana"}, {id: "f2", k: "f", p: 1, name: "name", v: "dup"}, {id: "t1", k: "n", p: 1, o: [0, 0], fs: 9, ff: "abc", fn: "x"}], 200);
  ok(kept2.map(e => e.id).join() === "p1,s1,i1,f1,t1", "paragraphs, marks, pictures and form answers are checked; unknown marks, odd picture ids and repeated fields are dropped: " + kept2.map(e => e.id).join());
  ok(kept2[0].lines.length === 1 && kept2[2].sig === 1 && !("ff" in kept2[4]), "an upside-down paragraph line and a font id that isn't one are dropped");

  /* Comments, locking, header and page numbers, recognized text, smaller files */
  const rc = await E.pdeBake(L, b1, [], {annots: [{p: 1, k: "ul", quads: [[72, 715, 200, 715, 72, 700, 200, 700]], c: "#2457c5", t: "why?"}, {p: 1, k: "so", quads: [[72, 691, 200, 691, 72, 676, 200, 676]], c: "#c0262d"}, {p: 1, k: "note", at: [400, 600], t: "Ask in class"}]});
  const ca = (await L.PDFDocument.load(rc.bytes)).getPages()[0].node.Annots(), subs = [];
  for (let k = 0; k < ca.size(); k++) subs.push(rc.bytes && (await L.PDFDocument.load(rc.bytes)).context.lookup(ca.get(k)).get(L.PDFName.of("Subtype")).decodeText());
  ok(subs.join() === "Underline,StrikeOut,Text", "underlines, strike-throughs and sticky notes are standard PDF comments: " + subs.join());
  const rl = await E.pdeBake(L, b1, [], {annots: [{p: 1, k: "note", at: [400, 600], t: "x"}], flatten: true});
  const la = (await L.PDFDocument.load(rl.bytes)).getPages()[0].node.Annots();
  ok((!la || la.size() === 0) && rl.report.annots === 1, "locked: the markup is drawn into the page instead");
  const rh = await E.pdeBake(L, b1, [{id: "h", k: "h", p: 1, text: "Ana · BIO 101", pos: "tr", num: "bc", fmt: "pnn", fs: 10}]);
  const th = await textOf(rh.bytes);
  ok(th.some(i => i.s === "Ana · BIO 101" && i.x > 400 && i.y > 740) && th.some(i => i.s === "Page 1 of 1" && i.y < 40), "a header at the top right and page numbers at the bottom");
  const rotDoc = await L.PDFDocument.create(); rotDoc.addPage([612, 792]).setRotation(L.degrees(90));
  const s0 = E.pdeShown(rotDoc.getPages()[0], 30, 30);
  ok(s0.r === 90 && s0.w === 792 && s0.h === 612 && s0.x === 30 && s0.y === 30, "on a turned page, the header is placed and turned to read upright");
  ok(E.pdeNumText("pnn", 2, 9) === "Page 2 of 9" && E.pdeNumText("n", 2, 9) === "2", "page number styles");
  const od = await L.PDFDocument.load(b1), ofont = await od.embedFont(L.StandardFonts.Helvetica);
  ok(await E.pdeOcrLayer(L, od, 1, [{t: "Recognized words here", o: [72, 400], r: 0, w: 200, h: 14}, {t: "", o: [0, 0], w: 5, h: 5}], ofont) === 1, "recognized lines become invisible text (empty ones are skipped)");
  const ob = await od.save(), ot = await textOf(ob);
  ok(ot.some(i => i.s === "Recognized words here" && Math.abs(i.x - 72) < 0.5 && Math.abs(i.w - 200) < 2), "where the words are, as wide as they are");
  const oi = ot.find(i => i.s === "Recognized words here"), ore = await E.pdeBake(L, ob, [region(oi, {t: "Changed words"})]);
  ok(ore.report.covered === 1, "editing recognized text still covers the picture of the old words");
  const big = await L.PDFDocument.create(); big.addPage([612, 792]);
  const raw = new Uint8Array(400 * 300 * 3).fill(128), st = big.context.flateStream(raw, {Type: "XObject", Subtype: "Image", Width: 400, Height: 300, ColorSpace: "DeviceRGB", BitsPerComponent: 8});
  const imgRef = big.context.register(st);
  let asked = null;
  const cr = await E.pdeCompress(L, big, 100, async x => { asked = x; return {bytes: new Uint8Array(50), w: 200, h: 150}; });
  ok(cr.done === 1 && asked.kind === "raw" && asked.comps === 3 && asked.maxPx === 1100 && big.context.lookup(imgRef).dict.get(L.PDFName.of("Filter")).decodeText() === "DCTDecode", "smaller: a picture is re-saved as JPEG no sharper than the dpi asked for");
  const masks = await L.PDFDocument.create(); masks.context.register(masks.context.flateStream(new Uint8Array(100 * 100), {Type: "XObject", Subtype: "Image", Width: 100, Height: 100, ImageMask: true, BitsPerComponent: 1}));
  ok((await E.pdeCompress(L, masks, 100, async () => { throw new Error("no"); })).done === 0, "masks and odd pictures are left alone");

  /* Worksheets made fillable, the PDF's own pictures, stamps, a watermark, links, contents and passwords */
  const wsDocB = await L.PDFDocument.create(), wsPgB = wsDocB.addPage([612, 792]), wsFB = await wsDocB.embedFont(L.StandardFonts.Helvetica);
  wsPgB.drawText("Student name:", {x: 72, y: 700, size: 12, font: wsFB}); wsPgB.drawLine({start: {x: 160, y: 698}, end: {x: 420, y: 698}, thickness: 0.8});
  wsPgB.drawText("Notes", {x: 72, y: 640, size: 12, font: wsFB}); wsPgB.drawRectangle({x: 72, y: 520, width: 400, height: 100, borderWidth: 1, borderColor: L.rgb(0, 0, 0)});
  wsPgB.drawRectangle({x: 72, y: 480, width: 10, height: 10, borderWidth: 1, borderColor: L.rgb(0, 0, 0)}); wsPgB.drawText("I give permission", {x: 90, y: 481, size: 11, font: wsFB});
  const dotB = await wsDocB.embedPng(Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64"));
  wsPgB.drawImage(dotB, {x: 400, y: 300, width: 100, height: 80});
  const wsB = await wsDocB.save(), wsItemsB = (await textOf(wsB)).map(i => ({str: i.s, o: [i.x, i.y], w: i.w, fs: i.fs, r: 0}));
  const wslB = await L.PDFDocument.load(wsB), wspB = E.pdePage(L, wslB, 1), foundB = E.pdeDetectFields(wspB.content, wsItemsB);
  ok(foundB.some(f => f.ft === "text" && /Student name/.test(f.name)) && foundB.some(f => f.ft === "multi" && /Notes/.test(f.name)) && foundB.some(f => f.ft === "check" && /permission/.test(f.name)), "a flat worksheet's blank line, writing box and tick box are found and named from their words: " + foundB.map(f => f.ft + ":" + f.name).join(", "));
  const picsB = E.pdeImages(wspB.content, wspB.xobj);
  ok(picsB.length === 1 && Math.round(picsB[0].m[4]) === 400 && Math.round(picsB[0].m[0]) === 100, "the PDF's own picture is found where it's drawn");
  const mB0 = picsB[0].m, editsB4 = foundB.map((f, k) => ({id: "q" + k, k: "q", p: 1, ft: f.ft, o: [f.x, f.y], w: f.w, h: f.h, name: f.name}))
    .concat([{id: "x1", k: "x", p: 1, i: 0, m0: mB0, m: [mB0[0], 0, 0, mB0[3], 100, 100]}, {id: "m1", k: "m", p: 1, text: "DRAFT", fs: 72, c: "#c0262d", op: 0.2},
      {id: "k1", k: "k", p: 1, o: [400, 650], w: 120, h: 44, r: 0, t: "GRADED\nNov 2, 2026", c: "#c0262d"}, {id: "l1", k: "l", p: 1, o: [72, 200], w: 120, h: 20, url: "https://example.edu"},
      {id: "o1", k: "o", p: 1, items: [{t: "Form", p: 1, kids: [{t: "Notes", p: 1}]}]}]);
  const rB4 = await E.pdeBake(L, wsB, editsB4);
  if (!pdfjs) pdfjs = await import(path.join(__dirname, "..", "node_modules", "pdfjs-dist", "legacy", "build", "pdf.mjs"));
  const dB4 = await pdfjs.getDocument({data: rB4.bytes.slice(), verbosity: 0}).promise, pB4 = await dB4.getPage(1), anB4 = await pB4.getAnnotations();
  ok(anB4.filter(a => a.fieldName).length === foundB.length && anB4.some(a => a.fieldType === "Btn" && a.checkBox), "the fields become real form fields, the tick box a checkbox");
  ok(anB4.some(a => a.subtype === "Link" && a.url === "https://example.edu/" || a.url === "https://example.edu"), "an added link is a PDF link");
  const olB4 = await dB4.getOutline();

  ok(olB4 && olB4[0].title === "Form" && olB4[0].items[0].title === "Notes", "the contents are written as the PDF's bookmarks");
  const txB4 = (await pB4.getTextContent()).items.map(i => i.str).join("|");
  ok(/DRAFT/.test(txB4) && /GRADED/.test(txB4) && /Nov 2, 2026/.test(txB4), "the watermark and stamp are on the page");
  const opsB4 = await pB4.getOperatorList(), paintIdxB = opsB4.fnArray.findIndex(f => f === pdfjs.OPS.paintImageXObject);
  const movedB = await L.PDFDocument.load(rB4.bytes), mpB = E.pdeImages(E.pdePage(L, movedB, 1).content, E.pdePage(L, movedB, 1).xobj);
  ok(paintIdxB >= 0 && mpB.length === 1 && Math.round(mpB[0].m[4]) === 100 && Math.round(mpB[0].m[5]) === 100, "the picture is moved to its new place");
  const rB5 = await E.pdeBake(L, wsB, [{id: "x2", k: "x", p: 1, i: 0, mB0, del: true}]), pB5 = await (await pdfjs.getDocument({data: rB5.bytes.slice(), verbosity: 0}).promise).getPage(1);
  ok(!(await pB5.getOperatorList()).fnArray.includes(pdfjs.OPS.paintImageXObject), "a picture taken out is gone from the page");
  const LCB = require("@cantoo/pdf-lib"), lockedB = await E.pdeProtect(LCB, rB4.bytes, {pw: "abc123", print: true, copy: false});
  let needsB = false; try { await pdfjs.getDocument({data: new Uint8Array(lockedB), verbosity: 0}).promise; } catch (e) { needsB = e.name === "PasswordException"; }
  ok(needsB, "a protected PDF needs its password to open");
  const unB = await pdfjs.getDocument({data: new Uint8Array(lockedB), password: "abc123", verbosity: 0}).promise;
  ok(unB.numPages === 1 && (await (await unB.getPage(1)).getAnnotations()).filter(a => a.fieldName).length === foundB.length, "with the password it opens, fields and all");
  const keptB4 = norm([{id: "x1", k: "x", p: 1, o: [0, 0], w: 5, h: 5, i: 0, m0: [1, 0, 0, 1, 0, 0], m: [1, 0, 0, 1, 2, 2]}, {id: "x2", k: "x", p: 1, o: [0, 0], w: 5, h: 5, i: -1, m0: [1, 0, 0, 1, 0, 0]},
    {id: "k1", k: "k", p: 1, o: [0, 0], w: 50, h: 20, t: "DRAFT"}, {id: "l1", k: "l", p: 1, o: [0, 0], w: 5, h: 5, url: "javascript:alert(1)"}, {id: "l2", k: "l", p: 1, o: [0, 0], w: 5, h: 5, url: "https://a.b"},
    {id: "l3", k: "l", p: 1, del: true, rect: [1, 2, 3, 4]}, {id: "q1", k: "q", p: 1, o: [0, 0], w: 5, h: 5, ft: "evil", name: ""}, {id: "m1", k: "m", p: 1, text: "  "}, {id: "m2", k: "m", p: 1, text: "DRAFT", op: 5},
    {id: "o1", k: "o", p: 1, items: [{t: "A", p: 2, kids: [{t: "B", p: 3, kids: [{t: "C"}]}]}, {t: ""}]}], 200);
  ok(keptB4.map(e => e.id).join() === "x1,k1,l2,l3,q1,m2,o1", "new kinds are checked: a bad picture number, a script link and an empty watermark are dropped: " + keptB4.map(e => e.id).join());
  const qB1 = keptB4.find(e => e.id === "q1"), mB2 = keptB4.find(e => e.id === "m2"), oB1 = keptB4.find(e => e.id === "o1");
  ok(qB1.ft === "text" && qB1.name === "Field" && mB2.op === 0.6 && oB1.items.length === 1 && !oB1.items[0].kids[0].kids, "field kinds, watermark strength and two levels of contents are kept in bounds");

  /* Convert: a PDF's text as paragraphs and headings, then a Word bodyB */
  const itemsB = [{str: "Lab Report", x: 72, y: 720, fs: 22}, {str: "The first line of a", x: 72, y: 680, fs: 11}, {str: "paragraph that wraps.", x: 72, y: 666, fs: 11},
    {str: "A new paragraph after a gap.", x: 72, y: 630, fs: 11}, {str: "Method", x: 72, y: 590, fs: 15}, {str: "• Cut five slices", x: 72, y: 560, fs: 11}, {str: "• Weigh each one", x: 72, y: 546, fs: 11}];
  const blB = T.pdtParagraphs([itemsB, [{str: "Page two", x: 72, y: 700, fs: 11}]]);
  ok(blB[0].style === "Heading1" && blB[0].t === "Lab Report" && blB[1].t === "The first line of a paragraph that wraps." && blB[2].t === "A new paragraph after a gap." && blB[3].style === "Heading2", "PDF to Word: big type becomes headings, wrapped lines join into paragraphs: " + JSON.stringify(blB.slice(0, 4)));
  ok(blB[4].t === "• Cut five slices" && blB[5].t === "• Weigh each one" && blB[6].pageBreak && blB[7].t === "Page two", "list items stay separate, and pages break");
  const bodyB = T.pdtDocxBody([{style: "Heading1", t: "A & B"}, {runs: [{t: "bold", b: true}, {t: " <i>", i: true}]}]);
  ok(bodyB.includes('<w:pStyle w:val="Heading1"/>') && bodyB.includes("A &amp; B") && bodyB.includes("<w:b/>") && bodyB.includes("&lt;i&gt;"), "the Word body is escaped and styled");
  ok(T.pdtTokens([{t: "two words\nnext", b: true}]).map(t => t.br ? "BR" : t.t).join("|") === "two| |words|BR|next", "words for laying out Word and PowerPoint text");

  /* Group review: only the groundwork, switched off */
  ok(RV.REVIEW_ON === false && RV.reviewCan("add", null, "u1", "owner") === false, "group review is off: nothing can be shared");
  const fkB = await RV.reviewKey(new TextEncoder().encode("same pdf"));
  ok(/^[a-f0-9]{64}$/.test(fkB) && fkB === await RV.reviewKey(new TextEncoder().encode("same pdf")), "a PDF's review key is its SHA-256 (the same file, the same key)");
  const mkB = (o) => Object.assign({id: "mark01", fk: fkB, gid: "g1", uid: "u1", k: "hl", p: 1, r: [[0.1, 0.1, 0.2, 0.05]], upd: 1, at: 1}, o);
  ok(RV.reviewNorm(mkB({})) && !RV.reviewNorm(mkB({k: "script"})) && !RV.reviewNorm(mkB({fk: "x"})) && !RV.reviewNorm(mkB({r: [[0, 0, "a", 1]]})) && RV.reviewNorm(mkB({t: "x".repeat(900)})).t.length === 200, "shared marks are checked; quoted words are kept short");
  const mergedB = RV.reviewMerge([mkB({cm: "old", upd: 1}), mkB({id: "mark02", upd: 3})], [mkB({cm: "new", upd: 2}), mkB({id: "mark02", del: true, upd: 3})]);
  ok(mergedB.length === 2 && mergedB[0].cm === "new" && mergedB.find(x => x.id === "mark02").del, "merging: the newer change wins and a removal stays removed");
  const storeB = RV.reviewMemoryStore(); let toldB = 0; const stopB = storeB.watch(fkB, "g1", () => toldB++);
  await storeB.put(mkB({})); await storeB.remove("mark01", "u1", 5); stopB(); await storeB.put(mkB({id: "mark03"}));
  ok(toldB === 2 && (await storeB.list(fkB, "g1")).find(x => x.id === "mark01").del, "the store keeps marks and removals and tells watchers");

  console.log(`\n${n} checks passed`);
})().catch(e => { console.error("FAIL:", e && e.stack || e); process.exit(1); });
