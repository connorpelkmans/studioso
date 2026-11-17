// A Google Doc or Word file linked in Writing Studio (LIVEDOC): the text Writing Studio checks is the document's, tidied the way every
// draft is, and each fix made in the document lands exactly where the same fix lands in the text, in Google Docs (as the Docs API would
// make the batchUpdate) and in Word's XML (keeping the formatting, links and tabs around it). A new line in a fix is a new paragraph.
const assert = require("assert");
const {DOMParser, XMLSerializer} = require("@xmldom/xmldom");
const s = require("../scripts/app-files").source();
let n = 0; const ok = (c, m) => { n++; assert(c, m); };
const between = (a, b) => { const i = s.indexOf(a), j = s.indexOf(b, i); assert(i >= 0 && j > i, "marker " + a); return s.slice(i + a.length, j); };
const CITE = new Function(between("/*CITE-START*/", "/*CITE-END*/") + ";return CITE;")();
const L = new Function(between("/*LIVEDOC-START*/", "/*LIVEDOC-END*/") + ";return LIVEDOC;")();

/* norm: the same tidy text as every draft, and where each character came from */
["Hello  \nworld\n\n\n\nEnd.  ", "\n\n  Title\r\nBody\t \nMore\n", "a", "", "x\n\n\ny\n \n\nz"].forEach(raw => {
  const N = L.norm(raw);
  ok(N.text === CITE.capDraft(raw, 1e9), "norm gives capDraft's text: " + JSON.stringify(raw));
  ok(N.map.length === N.text.length + 1 && [...N.text].every((c, i) => raw[N.map[i]] === c || (c === "\n" && raw[N.map[i]] === "\r")), "and each character's place in the document");
});

/* the same fixes in the text and in the document */
const src = [CITE.clean({id: "a", type: "article-journal", title: "Parks and heat", author: [{family: "Smith", given: "J"}, {family: "Lee", given: "K"}], issued: {"date-parts": [[2021]]}}),
  CITE.clean({id: "b", type: "book", title: "Urban trees", author: [{family: "Ng", given: "M"}], issued: {"date-parts": [[2019]]}})];
const refs = {b: "Ng, M. (2019). Urban trees.", a: "Smith, J., & Lee, K. (2021). Parks and heat."};
const APA = {style: "apa", kind: "author-date", label: "APA", refs};
// a draft with every kind of fix, laid out as a document would be (extra spaces, blank paragraphs)
const PARAS = ["Heat in Cities", "", "Cities are warming fast (Smith & Lee 2021). Ng (2019) says cities must plan.  ", "Parks are cooler (Smith & Lee, 2018).", "", "", "", "Bibliography", "Ng, M. (2019). Urban trees."];
const RAW = PARAS.join("\n");
function rounds(raw, apply){
  // Fix All, as the app does it: check, fix, check again, made in the document each round
  let doc = raw, total = 0;
  for (let r = 0; r < 6; r++) {
    const N = L.norm(doc), res = CITE.check(N.text, src, APA), edits = res.issues.flatMap(x => x.edits || []); if (!edits.length) break;
    const A = CITE.applyEdits(N.text, edits); if (!A.n) break;
    doc = apply(doc, L.toRaw(doc, N, A.plan));
    ok(L.norm(doc).text === A.text, `round ${r + 1}: the document says what the fixed text says`);
    total += A.n;
  }
  return {doc, total};
}
const expect = (() => { let t = CITE.capDraft(RAW); for (let r = 0; r < 6; r++) { const e = CITE.check(t, src, APA).issues.flatMap(x => x.edits || []); if (!e.length) break; t = CITE.applyEdits(t, e).text; } return t; })();
ok(/\(Smith & Lee, 2021\)\. Ng/.test(expect) && /cooler \(Smith & Lee, 2021\)/.test(expect) && /References\nNg, M\. \(2019\)\. Urban trees\.\nSmith, J\., & Lee, K\. \(2021\)/.test(expect), "the fixes themselves: " + JSON.stringify(expect));

/* Google Docs: a document as documents.get gives it, and batchUpdate as the API makes it */
function gDoc(raw, o){
  // paragraphs of runs (split where a word changes style), with a picture (one index, no text) and a table, from index 1
  o = o || {}; let i = 1; const content = [{sectionBreak: {}, endIndex: 1}];
  const paras = raw.split("\n");
  paras.forEach((p, k) => {
    const text = p + "\n", els = [];
    if (o.pic && k === 0) { els.push({startIndex: i, endIndex: i + 1, inlineObjectElement: {inlineObjectId: "x"}}); i += 1; }
    const cut = text.length > 12 ? 9 : text.length;
    [[0, cut], [cut, text.length]].filter(([a, b]) => b > a).forEach(([a, b]) => { els.push({startIndex: i, endIndex: i + b - a, textRun: {content: text.slice(a, b)}}); i += b - a; });
    content.push({paragraph: {elements: els}, startIndex: els[0].startIndex, endIndex: i});
  });
  return {body: {content}, revisionId: "r1"};
}
// the document as one string of its indexes (index 1 is the first character), to make a batchUpdate on
function gBatch(doc, req){
  const chars = [""]; let last = 1;
  doc.body.content.forEach(el => (el.paragraph ? el.paragraph.elements : []).forEach(pe => { if (pe.textRun) for (const c of pe.textRun.content) chars.push(c); else chars.push("\u0001"); last = pe.endIndex; }));
  let arr = chars.slice();
  req.forEach(r => {
    if (r.deleteContentRange) { const {startIndex: a, endIndex: b} = r.deleteContentRange.range; assert(a >= 1 && b <= arr.length - 1 && b > a, "a range in the body, not the last mark: " + a + "-" + b); arr.splice(a, b - a); }
    else { const at = r.insertText.location.index; assert(at >= 1 && at <= arr.length - 1, "an insert inside the body"); arr.splice(at, 0, ...r.insertText.text); }
  });
  const text = arr.slice(1).join(""); assert(text.endsWith("\n"), "the last mark stays");
  return text.replace(/\u0001/g, "");
}
const gApply = pic => (raw, plan) => { const d = gDoc(raw, {pic}), G = L.gText(d); assert(G.raw === raw.replace(/\n$/, ""), "the text read back is the document's"); const req = L.gRequests(G, plan); assert(req, "requests for every fix"); return gBatch(d, req).replace(/\n$/, ""); };
{
  const d = gDoc(RAW, {pic: true}), G = L.gText(d);
  ok(G.raw === RAW, "Google: the text of the document (a picture adds no text)");
  const r = rounds(RAW, gApply(true));
  ok(L.norm(r.doc).text === expect && r.total >= 4, `Google: Fix All made in the document gives the fixed draft (${r.total} fixes)`);
  ok(/^Heat in Cities\n\nCities are warming fast \(Smith & Lee, 2021\)\. Ng \(2019\) says cities must plan\. {2}\n/.test(r.doc), "and what wasn't fixed (the spaces, the blank paragraph) stays as it was");
  // a table: its cells are paragraphs too
  const tb = {body: {content: [{sectionBreak: {}, endIndex: 1}, {table: {tableRows: [{tableCells: [{content: [{paragraph: {elements: [{startIndex: 3, endIndex: 7, textRun: {content: "Cell\n"}}]}}]}]}]}}, {paragraph: {elements: [{startIndex: 9, endIndex: 13, textRun: {content: "End\n"}}]}}]}};
  const T = L.gText(tb); ok(T.raw === "Cell\nEnd", "a table's text is read");
  const q = L.gRequests(T, [{at: 5, len: 3, from: "End", to: "Fin"}]);
  ok(JSON.stringify(q) === JSON.stringify([{deleteContentRange: {range: {startIndex: 9, endIndex: 12}}}, {insertText: {location: {index: 9}, text: "Fin"}}]), "and fixed at the document's own indexes: " + JSON.stringify(q));
  ok(L.gRequests(T, [{at: 50, len: 0, from: "", to: "x"}]) === null, "a place that isn't in the document makes no requests");
  const sb = L.gText({body: {content: [{paragraph: {elements: [{startIndex: 1, endIndex: 12, textRun: {content: "a\u000bline\nnext"}}]}}]}});
  ok(sb.raw === "a\nline\nnext", "a line break in a paragraph reads as a new line");
}

/* Word: document.xml, with styled runs, a link, a tab and a table */
const NS = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"';
const run = (t, b) => `<w:r>${b ? "<w:rPr><w:b/></w:rPr>" : ""}<w:t xml:space="preserve">${t.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</w:t></w:r>`;
function wXml(paras){
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document ${NS}><w:body>${paras.map((p, k) => {
    const pPr = /^Bibliography|^References/.test(p) ? '<w:pPr><w:pStyle w:val="Heading1"/></w:pPr>' : k > 7 ? '<w:pPr><w:ind w:left="720" w:hanging="720"/></w:pPr>' : "";
    // split each paragraph into runs: the first word bold, then the rest in two runs (and a link around a citation)
    if (!p) return `<w:p>${pPr}</w:p>`;
    const sp = p.indexOf(" ") > 0 ? p.indexOf(" ") : p.length, rest = p.slice(sp), mid = Math.floor(rest.length / 2);
    const link = rest.slice(0, mid).includes("(Smith") ? `<w:hyperlink r:id="rId9">${run(rest.slice(0, mid))}</w:hyperlink>` : run(rest.slice(0, mid));
    return `<w:p>${pPr}${run(p.slice(0, sp), true)}${rest ? link + run(rest.slice(mid)) : ""}</w:p>`;
  }).join("")}<w:tbl><w:tr><w:tc><w:p><w:r><w:t>Cell</w:t></w:r><w:r><w:tab/><w:t>two</w:t></w:r></w:p></w:tc></w:tr></w:tbl><w:sectPr/></w:body></w:document>`;
}
const parse = x => new DOMParser().parseFromString(x, "text/xml");
{
  const doc = parse(wXml(PARAS)), I = L.wIndex(doc);
  ok(I.raw === RAW + "\nCell\ttwo", "Word: the text of every paragraph, the table's too, with its tab: " + JSON.stringify(I.raw.slice(-30)));
  let dom = doc;
  const r = rounds(I.raw, (raw, plan) => { L.wApply(dom, plan); dom = parse(new XMLSerializer().serializeToString(dom)); return L.wIndex(dom).raw; });
  ok(L.norm(r.doc).text === expect + "\nCell\ttwo", `Word: Fix All made in the file gives the fixed draft (${r.total} fixes)`);
  const xml = new XMLSerializer().serializeToString(dom);
  ok(/<w:hyperlink r:id="rId9">/.test(xml) && /<w:b\/><\/w:rPr><w:t xml:space="preserve">Cities<\/w:t>/.test(xml), "the link and the bold first word are still there");
  ok(/<w:tab\/><w:t>two<\/w:t>/.test(xml) || /<w:tab\/><w:t xml:space="preserve">two<\/w:t>/.test(xml), "and the table's tab");
  const ps = Array.from(dom.getElementsByTagNameNS(L.W, "p")).map(p => ({t: Array.from(p.getElementsByTagNameNS(L.W, "t")).map(t => t.textContent).join(""), x: new XMLSerializer().serializeToString(p)}));
  const head = ps.find(p => p.t === "References"), smith = ps.find(p => /^Smith, J\., & Lee/.test(p.t));
  ok(head && /Heading1/.test(head.x), "the heading renamed keeps its heading style");
  ok(smith && /w:hanging="720"/.test(smith.x), "a new entry is its own paragraph, with the list's hanging indent");
  ok(!ps.some(p => /\n/.test(p.t)), "no new line is left inside a paragraph's text");
}
{
  // edits across paragraphs (a list put in order), at the very start and the very end, and in an empty document
  const d = parse(wXml(["B entry", "A entry", "Last one"])), I = L.wIndex(d);
  L.wApply(d, [{at: I.raw.length, len: 0, from: "", to: "\nAdded at end"}, {at: 0, len: 15, from: "B entry\nA entry", to: "A entry\nB entry"}, {at: 0, len: 0, from: "", to: "Title\n"}]);
  ok(L.wIndex(d).raw === "Title\nA entry\nB entry\nLast one\nCell\ttwo\nAdded at end", "Word: a reorder across paragraphs, and new paragraphs at the start and end: " + JSON.stringify(L.wIndex(d).raw));
  const e = parse(`<w:document ${NS}><w:body><w:p/></w:body></w:document>`);
  L.wApply(e, [{at: 0, len: 0, from: "", to: "References\nNg, M. (2019)."}]);
  ok(L.wIndex(e).raw === "References\nNg, M. (2019).", "an empty document gets the text, in paragraphs");
  const t = parse(`<w:document ${NS}><w:body><w:p><w:r><w:t>One</w:t><w:tab/><w:t>Two</w:t></w:r></w:p></w:body></w:document>`);
  L.wApply(t, [{at: 3, len: 1, from: "\t", to: " "}]);
  ok(L.wIndex(t).raw === "One Two", "a tab replaced by a space");
}
console.log(`livedoc: ${n} checks passed`);
