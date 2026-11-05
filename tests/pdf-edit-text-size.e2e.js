// node tests/pdf-edit-text-size.e2e.js   (PDE_SHOTS=<folder> also saves screenshots)
// Edited PDF text keeps the size it had: a heading in a Type3 font drawn at size 1 and scaled up (PDF.js reports such text
// 10-20% too tall, from the font's box), and words PDF.js reads with a space that isn't there ("Summe r") keep their letters together
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const L = require("pdf-lib");
const {chromium, executablePath} = require("./pw");
const csp = require("../scripts/csp");
const root = path.join(__dirname, "..");
const SHOTS = process.env.PDE_SHOTS || "";
const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x"); let p = decodeURIComponent(u.pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  const ext = path.extname(f), mime = {".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".css": "text/css", ".webmanifest": "application/manifest+json"};
  res.writeHead(200, {"content-type": mime[ext] || "application/octet-stream"});
  if (p === "/index.html" || /^\/bundle\/[^/]+\.js$/.test(p)) { res.end((/\.html$/.test(p) ? csp.apply : String)(fs.readFileSync(f, "utf8").replace("const PRO_ENFORCED = true;", "const PRO_ENFORCED = false;"))); return; }
  fs.createReadStream(f).pipe(res);
});
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };

// A syllabus page: a 16 pt heading in a Type3 font (glyphs in 2048 units, drawn at size 1 with a text matrix of 16), split
// into two runs inside "Summer" a little apart; and a 14 pt line in Times-Bold split the same way
async function syllabus(){
  const tb = L.StandardFontEmbedder.for(L.StandardFonts.TimesRomanBold);
  const doc = await L.PDFDocument.create(), page = doc.addPage([612, 792]), ctx = doc.context;
  const text = "BIOS 230 Ecology and Evolution, Summer 2027", chars = [...new Set(text)];
  const names = {" ": "space", ",": "comma", "0": "zero", "2": "two", "3": "three", "7": "seven"}, gname = ch => names[ch] || ch;
  const codes = new Map(chars.map((ch, i) => [ch, 33 + i])), procs = {}, widths = [];
  chars.forEach(ch => {
    const w = Math.round(tb.widthOfTextAtSize(ch, 2048));
    procs[gname(ch)] = ctx.register(ctx.stream(ch === " " ? `${w} 0 d0` : `${w} 0 0 0 ${w} 1384 d1 ${Math.round(w * 0.1)} 0 ${Math.round(w * 0.8)} 1384 re f`));
    widths[codes.get(ch) - 33] = w;
  });
  const diffs = []; chars.forEach(ch => diffs.push(codes.get(ch), L.PDFName.of(gname(ch))));
  const cmap = `/CIDInit /ProcSet findresource begin 12 dict begin begincmap /CMapName /X def 1 begincodespacerange <00> <FF> endcodespacerange ${chars.length} beginbfchar ${chars.map(ch => `<${codes.get(ch).toString(16).padStart(2, "0")}> <${ch.charCodeAt(0).toString(16).padStart(4, "0")}>`).join(" ")} endbfchar endcmap CMapName currentdict /CMap defineresource pop end end`;
  const t3 = ctx.register(ctx.obj({Type: "Font", Subtype: "Type3", FontBBox: [-344, -446, 2048, 1915], FontMatrix: [1 / 2048, 0, 0, 1 / 2048, 0, 0],
    CharProcs: procs, Encoding: {Type: "Encoding", Differences: diffs}, FirstChar: 33, LastChar: 32 + chars.length, Widths: widths, ToUnicode: ctx.register(ctx.stream(cmap)), Resources: {}}));
  page.node.setFontDictionary(L.PDFName.of("T3"), t3);
  page.node.setFontDictionary(L.PDFName.of("TB"), ctx.register(ctx.obj({Type: "Font", Subtype: "Type1", BaseFont: "Times-Bold", Encoding: "WinAnsiEncoding"})));
  const hex = s => "<" + [...s].map(ch => codes.get(ch).toString(16).padStart(2, "0")).join("") + ">";
  const head = "BIOS 230 Ecology and Evolution, Summer 2026".replace("2026", "2020"), k = head.indexOf("Summe") + 5;
  const wa = tb.widthOfTextAtSize(head.slice(0, k), 1);
  const line = "Office Hours and Contacts", k2 = line.indexOf("Hou") + 3, wb = tb.widthOfTextAtSize(line.slice(0, k2), 14);
  const content = `BT /T3 1 Tf 16 0 0 16 140 720 Tm ${hex(head.slice(0, k))} Tj ET BT /T3 1 Tf 16 0 0 16 ${140 + (wa + 0.15) * 16} 720 Tm ${hex(head.slice(k))} Tj ET\n`
    + `BT /TB 14 Tf 72 680 Td (${line.slice(0, k2)}) Tj ET BT /TB 14 Tf ${72 + wb + 2} 680 Td (${line.slice(k2)}) Tj ET\n`;
  page.node.set(L.PDFName.of("Contents"), ctx.obj([ctx.register(ctx.stream(content))]));
  page.drawText("Instructor: Dr. Jane Smith. Office hours Monday and Wednesday, 2 to 4 pm.", {x: 72, y: 650, size: 12, font: await doc.embedFont(L.StandardFonts.TimesRoman)});
  return Buffer.from(await doc.save());
}

(async () => {
  const pdf = await syllabus();
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  try {
    const seed = {v: 2, updated: 1, decks: [], notes: [], tasks: [], settings: {}, courses: [{id: "c1", name: "Biology", code: "BIOS230", color: "#3B6FE0"}],
      files: [{id: "f1", name: "BIOS 230 Syllabus.pdf", courseId: "c1", folderId: "other", kind: "file", taskIds: [], desc: "", url: "", revs: [{assetId: "a-syl", name: "BIOS 230 Syllabus.pdf", size: pdf.length, type: "application/pdf", at: 1}]}]};
    const ctx = await browser.newContext({viewport: {width: 1280, height: 900}, deviceScaleFactor: 1, serviceWorkers: "block", acceptDownloads: true});
    await ctx.addInitScript(seed => { try { if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("coursework:v2", JSON.stringify(seed)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("studyboard:tour", "1"); } } catch (e) {} }, seed);
    const page = await ctx.newPage(); const errs = [];
    page.on("pageerror", e => errs.push(e.message)); page.on("console", m => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errs.push(m.text()); });
    await page.goto(base); await page.waitForSelector("#view", {state: "attached"}); await page.waitForFunction(() => window.__sbProStudy);
    await page.evaluate(() => { const T = window.__sbProStudy; Object.defineProperty(window, "state", {get: () => T.state(), configurable: true}); });
    await page.waitForTimeout(500);
    const shot = async name => { if (SHOTS) { fs.mkdirSync(SHOTS, {recursive: true}); await page.screenshot({path: path.join(SHOTS, name + ".png")}); } };
    const wordAt = word => page.evaluate(word => {
      const span = [...document.querySelectorAll(".pdr-page .textLayer span")].find(s => s.textContent.includes(word)); if (!span) return null;
      const tn = span.firstChild, i = tn.textContent.indexOf(word), r = document.createRange(); r.setStart(tn, i); r.setEnd(tn, i + word.length);
      const b = r.getBoundingClientRect(); return {x: b.left + b.width / 2, y: b.top + b.height / 2};
    }, word);
    const clickWord = async word => { const p = await wordAt(word); assert(p, "on the page: " + word); await page.mouse.click(p.x, p.y); await page.waitForTimeout(500); };
    const ed = () => page.evaluate(() => { const s = window.__sbProStudy.pde(), el = document.querySelector(".pde-e.editing .pde-t"), pg = s.ed && s.pages.get(s.ed.e.p);
      return s.ed ? {k: s.ed.e.k, t: s.ed.e.t, fs: s.ed.e.fs, css: el ? parseFloat(getComputedStyle(el).fontSize) : 0, scale: pg ? pg.vp.scale : 0} : null; });
    const replaceIn = async (from, to) => {
      await page.evaluate(from => { const t = document.querySelector(".pde-e.editing .pde-t"), tn = t.firstChild, i = tn.textContent.indexOf(from), r = document.createRange(); r.setStart(tn, i); r.setEnd(tn, i + from.length); const s = getSelection(); s.removeAllRanges(); s.addRange(r); }, from);
      await page.keyboard.type(to); await page.keyboard.press("Enter"); await page.waitForTimeout(400);
    };
    const pdfText = bytes => page.evaluate(async bytes => {
      const doc = await window.pdfjsLib.getDocument({data: new Uint8Array(bytes), disableFontFace: true, isEvalSupported: false}).promise, tc = await (await doc.getPage(1)).getTextContent();
      return tc.items.filter(i => i.str.trim()).map(i => ({s: i.str, x: i.transform[4], y: i.transform[5], w: i.width, fs: Math.hypot(i.transform[2], i.transform[3])}));
    }, [...bytes]);

    await page.evaluate(async bytes => { await window.__sbProStudy.idbSet("pdf:a-syl", new Blob([new Uint8Array(bytes)], {type: "application/pdf"})); }, [...pdf]);
    await page.evaluate(() => { const b = document.createElement("button"); b.dataset.act = "pdr-open"; b.dataset.id = "f1"; document.body.appendChild(b); b.click(); b.remove(); });
    await page.waitForSelector(".pdr-page .textLayer span", {timeout: 15000}); await page.waitForTimeout(400);
    await page.click("#pdeBtn"); await page.waitForFunction(() => !!window.PDFLib, null, {timeout: 10000}); await page.waitForTimeout(600);

    const before = await pdfText(pdf);
    ok(Math.abs(before.find(i => /BIOS/.test(i.s)).fs - 18.45) < 0.01, "PDF.js reads the Type3 heading as 18.45 pt (its letters' box), though it's drawn at 16 pt");

    /* The Type3 heading */
    await clickWord("Ecology");
    let s = await ed();
    ok(s && s.k === "t" && s.fs === 16, "the heading opens at the 16 pt it's drawn at, not PDF.js's 18.45: " + JSON.stringify(s));
    ok(Math.abs(s.css - 16 * s.scale) < 0.05, `and the text being typed is shown at that size on the page (${s.css}px at ${s.scale}x)`);
    ok(s.t === "BIOS 230 Ecology and Evolution, Summer 2020", "with its words as the PDF has them, not \"Summe r\": " + s.t);
    await shot("1-heading-open");
    await replaceIn("2020", "2027");

    /* The Times-Bold line, kept in its own font */
    await clickWord("Contacts");
    s = await ed();
    ok(s && s.t === "Office Hours and Contacts" && s.fs === 14, "a line PDF.js reads as \"Office Hou rs\" opens as the PDF has it: " + JSON.stringify(s));
    await replaceIn("Contacts", "Contact Info");
    await shot("2-edited");
    const pe = await page.evaluate(() => state.files.f1.pe || []);
    ok(pe.length === 2 && pe.every(e => !/Summe r|Hou rs/.test(e.t + e.old)), "neither edit has the made-up space: " + pe.map(e => e.t).join(" | "));

    /* The saved file */
    await page.click('[data-act="pde-dl"]'); await page.waitForSelector('[data-act="pde-dl-go"]');
    const [dl] = await Promise.all([page.waitForEvent("download", {timeout: 30000}), page.click('[data-act="pde-dl-go"]')]);
    const after = await pdfText(fs.readFileSync(await dl.path()));
    const h = after.find(i => /BIOS/.test(i.s)), o = after.find(i => /Office Hours/.test(i.s));
    // drawn in a standard font (the Type3 font has no 7), at its real size: 16 pt is how PDF.js reads standard-font text
    ok(h && h.s === "BIOS 230 Ecology and Evolution, Summer 2027" && Math.abs(h.fs - 16) < 0.01, "the saved heading is 16 pt, as it was drawn before: " + JSON.stringify(h));
    ok(Math.abs(h.x - 140) < 0.01 && Math.abs(h.y - 720) < 0.01, "on the same baseline");
    // (this test font has no name, so a sans look-alike stands in: within 5%; at 18.45 pt it would be 15% wider or more)
    ok(h.w < before.find(i => /BIOS/.test(i.s)).w * 1.05, `and about as wide as before, not 15% wider (${h.w.toFixed(1)} vs ${before.find(i => /BIOS/.test(i.s)).w.toFixed(1)} pt)`);
    ok(o && o.s === "Office Hours and Contact Info" && Math.abs(o.fs - 14) < 0.01 && Math.abs(o.x - 72) < 0.01, "the Times-Bold line is saved at 14 pt with no space inside Hours: " + JSON.stringify(o));
    ok(!errs.length, "no errors: " + errs.join(" | "));
    console.log(`\n${n} checks passed`);
  } finally { await browser.close(); server.close(); }
})().catch(e => { console.error("FAIL:", e && e.stack || e); process.exit(1); });
