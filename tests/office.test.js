// Office files (01-office.js): the parsing path, run in Node without a page
const fs = require("fs"), path = require("path"), vm = require("vm"), assert = require("assert");
const F = require("./office-fixture");
const ROOT = path.join(__dirname, "..");
let n = 0; const ok = (c, m) => { n++; assert(c, m); };
const eq = (a, b, m) => { n++; assert.strictEqual(a, b, m + ` (got ${JSON.stringify(a)})`); };

// The zip reader from 01-ai.js, and esc/safeUrl from the core
const ai = fs.readFileSync(path.join(ROOT, "src/js/01-ai.js"), "utf8");
const zipSrc = ai.slice(ai.indexOf("const ZIP_MAX_IN"), ai.indexOf("async function unzipText"));
ok(/async function unzipBytes/.test(zipSrc) && /async function inflateBytes/.test(zipSrc), "found unzipBytes and inflateBytes in 01-ai.js");
const core = fs.readFileSync(path.join(ROOT, "src/js/00-core.js"), "utf8"), escLine = core.split("\n").find(l => l.startsWith("const esc0 = "));
const helpers = fs.readFileSync(path.join(ROOT, "src/js/01-helpers.js"), "utf8"), su = helpers.slice(helpers.indexOf("function safeUrl("), helpers.indexOf("\n}\n", helpers.indexOf("function safeUrl(")) + 3);
const ctx = {window: {}, Blob, DecompressionStream, TextDecoder, URL, btoa, console};
vm.createContext(ctx);
vm.runInContext(`const aiErr = (code, message) => Object.assign(new Error(message), {code});\n${escLine}\nconst esc = esc0;\n${su}\n${zipSrc}\n${fs.readFileSync(path.join(ROOT, "src/js/01-office.js"), "utf8")}\nglobalThis.O = OFFICE;`, ctx, {filename: "01-office.js"});
const O = ctx.O;

(async () => {
  // kindOf
  eq(O.kindOf("Lecture 3.PPTX"), "pptx", "pptx by extension");
  eq(O.kindOf("essay.docx", "application/octet-stream"), "docx", "docx by extension");
  eq(O.kindOf("data.tsv"), "csv", "tsv is csv");
  eq(O.kindOf("old.doc"), "legacy", ".doc is legacy");
  eq(O.kindOf("deck.key"), "legacy", ".key is legacy");
  eq(O.kindOf("file", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"), "xlsx", "xlsx by MIME");
  eq(O.kindOf("file", "application/vnd.ms-powerpoint"), "legacy", "ppt MIME is legacy");
  eq(O.kindOf("notes.pdf", "application/pdf"), "", "pdf is not an office file");
  eq(O.kindOf("x.csv", "application/vnd.ms-excel"), "csv", "extension wins over Windows' csv MIME");

  // XML reader
  const x = O._.parseXml('<?xml version="1.0"?><!DOCTYPE x [<!ENTITY a "AAAA">]><r xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:q="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><t q:id="1">a &amp; &#60;b&#x3e; &a; \u0001</t><t xml:space="preserve"> </t><!-- c --><v><![CDATA[<raw>]]></v></r>');
  eq(x.n, "r", "root element");
  eq(x.c[0].c[0], "a & <b>  ", "entities decoded, unknown entities and control characters dropped");
  eq(x.c[0].a["r:id"], "1", "namespace prefixes mapped to the usual ones");
  eq(x.c[1].c[0], " ", "whitespace kept in text elements");
  eq(x.c[2].c[0], "<raw>", "CDATA");

  // number formats
  const f = O._.fmtCell;
  eq(f(1234.5, "#,##0.00"), "1,234.50", "thousands and decimals");
  eq(f(0.875, "0.0%"), "87.5%", "percent");
  eq(f(45306, "m/d/yyyy"), "1/15/2024", "date serial");
  eq(f(45306.75, "yyyy-mm-dd hh:mm"), "2024-01-15 18:00", "date and time; mm after hh is minutes");
  eq(f(45306, "d-mmm-yy"), "15-Jan-24", "month names");
  eq(f(0.5, "h:mm AM/PM"), "12:00 PM", "12-hour clock");
  eq(f(-1234.567, "#,##0.00;(#,##0.00)"), "(1,234.57)", "negative section");
  eq(f(-5, "0"), "-5", "minus sign without a negative section");
  eq(f(1 / 3, "General"), "0.3333333333", "General");
  eq(f(12345678901234, "General"), "1.23457E+13", "General, large");
  eq(f(1234.5, '"$"#,##0.00'), "$1,234.50", "currency literal");
  eq(f(1234.5, "[$€-407]#,##0"), "€1,235", "locale currency");
  eq(f(0, '_("$"* #,##0.00_);_("$"* \\(#,##0.00\\);_("$"* "-"??_);_(@_)'), " $-   ", "accounting zero");
  eq(f(12345, "0.00E+00"), "1.23E+04", "scientific");
  eq(O._.colName(0) + O._.colName(25) + O._.colName(26) + O._.colName(701), "AZAAZZ", "column letters");

  // CSV
  const rows = O._.parseCsv('a;b\n"x;y";"q ""z"""\n', {warnings: [], warned: new Set()});
  eq(JSON.stringify(rows), JSON.stringify([["a", "b"], ["x;y", 'q "z"']]), "semicolon CSV with quotes");
  eq(O._.parseCsv("a\tb\tc\n1\t2\t3", {warnings: [], warned: new Set()})[1][2], "3", "tab CSV");

  // fonts
  ok(/^Calibri,Carlito/.test(O._.fontCss("Calibri")), "Calibri falls back to Carlito");
  eq(O._.fontCss("x';background:url(y)"), null, "unsafe font names dropped");
  eq(O._.fontCss("My Font 2"), "'My Font 2',sans-serif", "other names quoted");

  // whole files, text only
  const dt = await O.text(F.docx({filler: 3}), "report.docx");
  ok(dt.includes("Lab Report") && dt.includes("bold words") && dt.includes("1. First step") && dt.includes("2. Second step"), "docx text with list numbers");
  ok(dt.includes("Merged header\tH3") && dt.includes("Tall cell\tB2\tC2"), "docx table text, tab-separated");
  ok(dt.includes("<script>alert(1)</script>"), "docx text is plain text (not escaped)");
  const stored = await O.text(F.docx({filler: 1, store: true}), "s.docx");
  ok(stored.includes("Lab Report"), "stored (method 0) zip reads too");
  const pt = await O.text(F.pptx(), "deck.pptx");
  ok(/^Slide 1:\nCell Biology/.test(pt), "slides in presentation order with Slide N: prefix: " + pt.slice(0, 40));
  ok(pt.includes("• Mitochondria") && pt.includes("Speaker notes: Remember the powerhouse joke"), "bullets inherited from the master, speaker notes");
  ok(pt.includes("Slide 2:\nSecond slide") && pt.includes("Organelle\tRole"), "second slide with table text");
  const xt = await O.text(F.xlsx(), "grades.xlsx");
  ok(xt.includes("Sheet: Grades") && xt.includes("Name\tScore\tDue\tPct") && xt.includes("Ada <script>\t1234.5\t1/15/2024\t87.5%\tTRUE\t-1,234.57"), "xlsx text with formats: " + xt);
  ok(xt.includes("Sheet: Budget\nRent\t800\nFood\t200") && !xt.includes("hidden"), "second sheet; hidden sheet left out");
  const ct = await O.text(F.csv(), "list.csv");
  ok(ct.includes("Smith; Ann\t91.5") && ct.includes('said "hi"'), "csv text");

  // errors
  const code = async (p) => { try { await p; return "ok"; } catch (e) { return e.code; } };
  eq(await code(O.text(Buffer.from("not a zip at all"), "x.docx")), "bad", "a broken docx");
  eq(await code(O.text(Buffer.from([0xD0, 0xCF, 0x11, 0xE0, 1, 2, 3, 4]), "x.docx")), "locked", "a password-protected docx");
  eq(await code(O.text(Buffer.from([0xD0, 0xCF, 0x11, 0xE0, 1, 2, 3, 4]), "x.doc")), "legacy", "an old .doc");
  eq(await code(O.text(F.zip({"a.txt": "hi"}), "x.zip")), "unsupported", "a zip that isn't an office file");
  eq(await code(O.text(F.docx({filler: 1}), "renamed.doc")), "ok", "a .docx renamed .doc still opens");
  // a zip bomb: one part that inflates far past the limit
  const bomb = F.zip({"[Content_Types].xml": "<Types/>", "word/document.xml": "<w:document>" + " ".repeat(60 * 1024 * 1024) + "</w:document>"});
  eq(await code(O.text(bomb, "bomb.docx")), "bad", "a part over the size limit is skipped (no document)");
  console.log(`office: ${n} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
