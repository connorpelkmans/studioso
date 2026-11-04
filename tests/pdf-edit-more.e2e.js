// node tests/pdf-edit-more.e2e.js   (PDE_SHOTS=<folder> also saves screenshots)
// The PDF editor's other tools: paragraphs, your own fonts (and fonts whose licence forbids embedding), marks, pictures and signatures,
// form filling, find and replace, pages, and highlights in a downloaded copy
/* global state */
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const csp = require("../scripts/csp");
const L = require("pdf-lib");
const root = path.join(__dirname, "..");
const SHOTS = process.env.PDE_SHOTS || "";
const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x"); let p = decodeURIComponent(u.pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  const ext = path.extname(f), mime = {".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".css": "text/css", ".woff2": "font/woff2"};
  res.writeHead(200, {"content-type": mime[ext] || "application/octet-stream"});
  if (p === "/index.html" || /^\/bundle\/[^/]+\.js$/.test(p)) { res.end((/\.html$/.test(p) ? csp.apply : String)(fs.readFileSync(f, "utf8").replace("const PRO_ENFORCED = true;", "const PRO_ENFORCED = false;"))); return; }
  fs.createReadStream(f).pipe(res);
});
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };

const SYLLABUS = `<html><body style="margin:56px 64px;font-family:Arial;color:#1d1d1f">
<h1 style="font-size:26px;margin:0 0 4px">BIO 101: Introduction to Biology</h1>
<p style="font-size:14px;color:#555;margin:0 0 18px">Fall Semester, Section 02, Hall B</p>
<h2 style="font-size:17px;margin:0 0 6px">Exams and Deadlines</h2>
<p style="font-family:Georgia;font-size:14px;line-height:1.5;text-align:justify;margin:0 0 14px">The midterm exam is on October 20 in Hall B and covers chapters one through six. The final project is due December 5 and is worth forty percent of your grade. Late work loses ten percent per day unless you ask for an extension before the deadline.</p>
<h2 style="font-size:17px;margin:0 0 6px">Questions</h2>
<p style="font-size:14px;margin:0 0 8px">1. Which organelle makes most of the cell's energy?</p>
<p style="font-size:14px;margin:0 0 8px">2. Ribosomes build proteins in Hall B labs.</p>
<p style="font-size:14px;margin:60px 0 0">Signature: ______________________</p></body></html>`;
async function formPdf(){
  const d = await L.PDFDocument.create(), pg = d.addPage([612, 792]), form = d.getForm(), f = await d.embedFont(L.StandardFonts.Helvetica);
  pg.drawText("Field trip permission form", {x: 72, y: 720, size: 18, font: f});
  pg.drawText("Student name:", {x: 72, y: 670, size: 12, font: f}); form.createTextField("student.name").addToPage(pg, {x: 170, y: 662, width: 250, height: 22});
  pg.drawText("Allergies:", {x: 72, y: 630, size: 12, font: f}); const ml = form.createTextField("allergies"); ml.enableMultiline(); ml.addToPage(pg, {x: 170, y: 570, width: 300, height: 70});
  pg.drawText("I give permission:", {x: 72, y: 540, size: 12, font: f}); form.createCheckBox("permission").addToPage(pg, {x: 180, y: 536, width: 16, height: 16});
  pg.drawText("Lunch:", {x: 72, y: 500, size: 12, font: f}); const rg = form.createRadioGroup("lunch"); rg.addOptionToPage("Packed", pg, {x: 130, y: 496, width: 14, height: 14}); rg.addOptionToPage("School", pg, {x: 220, y: 496, width: 14, height: 14});
  pg.drawText("Packed", {x: 148, y: 498, size: 11, font: f}); pg.drawText("School", {x: 238, y: 498, size: 11, font: f});
  pg.drawText("Grade:", {x: 72, y: 460, size: 12, font: f}); const dd = form.createDropdown("grade"); dd.addOptions(["9", "10", "11", "12"]); dd.addToPage(pg, {x: 130, y: 452, width: 80, height: 22});
  return Buffer.from(await d.save());
}
// A TrueType font whose licence setting (OS/2 fsType) says "Restricted License embedding"
function restricted(ttf){
  const b = Buffer.from(ttf), num = b.readUInt16BE(4);
  for (let i = 0; i < num; i++) { const rec = 12 + i * 16; if (b.toString("latin1", rec, rec + 4) === "OS/2") { const off = b.readUInt32BE(rec + 8); b.writeUInt16BE(0x0002, off + 8); return b; } }
  return null;
}

(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  try {
    const maker = await browser.newPage(); await maker.setContent(SYLLABUS); const pdf = await maker.pdf({format: "Letter"}); await maker.close();
    const form = await formPdf();
    const rev = (id, name, size) => ({assetId: id, name, size, type: "application/pdf", at: 1});
    const seed = {v: 2, updated: 1, decks: [], notes: [], tasks: [], settings: {}, courses: [{id: "c1", name: "Biology", code: "BIO101", color: "#3B6FE0"}],
      files: [{id: "f1", name: "BIO 101 Syllabus.pdf", courseId: "c1", folderId: "other", kind: "file", taskIds: [], desc: "", url: "", revs: [rev("a-syl", "BIO 101 Syllabus.pdf", pdf.length)],
        hl: [{id: "h1", a: "a-syl", p: 1, r: [[0.1, 0.06, 0.4, 0.03]], t: "BIO 101", c: "yellow", at: 1}]},
        {id: "f2", name: "Permission Form.pdf", courseId: "c1", folderId: "other", kind: "file", taskIds: [], desc: "", url: "", revs: [rev("a-form", "Permission Form.pdf", form.length)]}]};
    const ctx = await browser.newContext({viewport: {width: 1280, height: 900}, serviceWorkers: "block", acceptDownloads: true});
    await ctx.addInitScript(seed => { try { if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("coursework:v2", JSON.stringify(seed)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("studyboard:tour", "1"); } } catch (e) {} }, seed);
    const page = await ctx.newPage(); const errs = [];
    page.on("pageerror", e => errs.push(e.message)); page.on("console", m => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errs.push(m.text()); });
    await page.goto(base); await page.waitForSelector("#view", {state: "attached"}); await page.waitForFunction(() => window.__sbProStudy);
    await page.evaluate(() => { const T = window.__sbProStudy; Object.defineProperty(window, "state", {get: () => T.state(), configurable: true}); });
    await page.waitForTimeout(500);
    // the tools under More open from its menu
    const tool = async id => { if (await page.locator(`.pde-tools > .pde-tool[data-id="${id}"]`).count()) await page.click(`.pde-tools > .pde-tool[data-id="${id}"]`); else { await page.click('[data-act="pde-more"]'); await page.click(`.pde-mi[data-id="${id}"]`); } await page.waitForTimeout(200); };
    const shot = async name => { if (SHOTS) { fs.mkdirSync(SHOTS, {recursive: true}); await page.screenshot({path: path.join(SHOTS, name + ".png")}); } };
    await page.evaluate(async ([a, b]) => { await window.__sbProStudy.idbSet("pdf:a-syl", new Blob([new Uint8Array(a)])); await window.__sbProStudy.idbSet("pdf:a-form", new Blob([new Uint8Array(b)])); }, [[...pdf], [...form]]);
    const open = async fid => { await page.evaluate(fid => { const b = document.createElement("button"); b.dataset.act = "pdr-open"; b.dataset.id = fid; document.body.appendChild(b); b.click(); b.remove(); }, fid); await page.waitForSelector(".pdr-page .textLayer span", {timeout: 15000}); await page.waitForTimeout(400); };
    const wordAt = word => page.evaluate(word => {
      const span = [...document.querySelectorAll(".pdr-page .textLayer span")].find(s => s.textContent.includes(word)); if (!span) return null;
      const tn = span.firstChild, i = tn.textContent.indexOf(word), r = document.createRange(); r.setStart(tn, i); r.setEnd(tn, i + word.length);
      const b = r.getBoundingClientRect(); return {x: b.left + b.width / 2, y: b.top + b.height / 2, l: b.left, r: b.right, t: b.top, b: b.bottom};
    }, word);
    const edits = () => page.evaluate(() => (state.files[window.__sbProStudy.pde().fid].pe || []));
    const textOf = bytes => page.evaluate(async bytes => {
      const doc = await window.pdfjsLib.getDocument({data: new Uint8Array(bytes), disableFontFace: true, isEvalSupported: false}).promise, out = [];
      for (let p = 1; p <= doc.numPages; p++) { const pg = await doc.getPage(p); out.push({rot: pg.rotate, text: (await pg.getTextContent()).items.map(i => i.str).join(" "), annots: (await pg.getAnnotations()).map(a => a.subtype + (a.fieldName ? ":" + a.fieldName + "=" + JSON.stringify(a.fieldValue) : ""))}); }
      return out;
    }, [...bytes]);
    const download = async (marks) => {
      await page.click('[data-act="pde-dl"]'); await page.waitForSelector('[data-act="pde-dl-go"]');
      if (marks != null && await page.locator("#pdeDlMarks").count()) await page.setChecked("#pdeDlMarks", !!marks);
      const [dl] = await Promise.all([page.waitForEvent("download", {timeout: 30000}), page.click('[data-act="pde-dl-go"]')]);
      return fs.readFileSync(await dl.path());
    };

    await open("f1");
    await page.click("#pdeBtn"); await page.waitForFunction(() => !!window.PDFLib); await page.waitForTimeout(400);
    { const inRow = await page.locator(".pde-tools > .pde-tool[data-fit]").count();
      ok(await page.locator(".pde-tools > .pde-tool:not([data-fit])").count() === 6 && inRow >= 1, "six tools, then as many of the rest as fit (" + inRow + "), then More");
      await page.click('[data-act="pde-more"]'); ok(await page.locator(".pde-menu .pde-mi").count() === 11 - inRow, "More has the ones that didn't fit"); await page.keyboard.press("Escape"); }
    await shot("1-tools");

    /* Paragraphs */
    const oct = await wordAt("October 20");
    await page.mouse.click(oct.x, oct.y); await page.waitForTimeout(300);
    await page.waitForTimeout(300);
    ok(await page.locator(".pde-e.k-p.editing").count() === 1, "clicking a line in a paragraph opens the whole paragraph");
    const pe0 = (await edits()).find(e => e.k === "p");
    ok(!pe0 && await page.locator(".pde-e.k-p.editing .pde-pt").count() === 1, "it opens the whole paragraph for typing");
    const ptext = await page.locator(".pde-e.k-p.editing .pde-pt").textContent();
    ok(/^The midterm exam .* before the deadline\.$/.test(ptext.trim()), "with the paragraph's words joined up: " + ptext.slice(0, 60));
    await page.evaluate(() => { const t = document.querySelector(".pde-e.k-p.editing .pde-pt"); t.focus(); const r = document.createRange(); r.selectNodeContents(t); const s = getSelection(); s.removeAllRanges(); s.addRange(r); });
    await page.keyboard.type("The midterm exam is on December 22 in Hall C and covers chapters one through eight. The final project is due December 12 and is worth forty percent of your grade. Late work loses ten percent per day unless you ask for an extension before the deadline. Office hours are on Tuesdays.");
    await page.keyboard.press("Control+Enter"); await page.waitForTimeout(500);
    const pe = (await edits()).find(e => e.k === "p");
    ok(pe && pe.lines.length === 3 && pe.al === "j" && /Office hours are on Tuesdays\.$/.test(pe.t), "the paragraph is kept with its 3 lines, justified");
    await page.waitForFunction(() => document.querySelectorAll(".pde-e.k-p .pde-pl").length >= 3, null, {timeout: 8000}).catch(() => {});
    ok(await page.locator(".pde-e.k-p .pde-pl").count() >= 3 && /Tuesdays\.$/.test((await page.locator(".pde-e.k-p .pde-pl").last().textContent()).trim()), "the paragraph re-wraps on the page, line by line as it will be saved");
    await page.click('.pde-tool[data-id="text"]');

    /* Marks */
    await page.click('.pde-tool[data-id="mark"]'); await page.waitForTimeout(150);
    ok(await page.locator('.pde-marks [data-act="pde-shape"]').count() === 7, "Marks: checkmark, cross, box, circle, line, arrow and dot");
    const q1 = await wordAt("Which organelle");
    await page.mouse.click(q1.l - 22, q1.y); await page.waitForTimeout(250);
    await page.click('[data-act="pde-shape"][data-id="ellipse"]'); await page.click('[data-act="pde-scolor"][data-id="#c0262d"]');
    const q2 = await wordAt("Ribosomes");
    await page.mouse.move(q2.l - 6, q2.t - 5); await page.mouse.down(); await page.mouse.move(q2.r + 6, q2.b + 5, {steps: 5}); await page.mouse.up(); await page.waitForTimeout(250);
    await page.click('[data-act="pde-shape"][data-id="arrow"]');
    await page.mouse.move(q2.r + 120, q2.y + 30); await page.mouse.down(); await page.mouse.move(q2.r + 14, q2.y + 4, {steps: 5}); await page.mouse.up(); await page.waitForTimeout(250);
    let es = await edits();
    ok(es.some(e => e.k === "s" && e.sh === "check") && es.some(e => e.k === "s" && e.sh === "ellipse" && e.c === "#c0262d" && e.w > 20) && es.some(e => e.k === "s" && e.sh === "arrow" && e.pts.length === 4), "a checkmark (click), a red circle and an arrow (drag)");
    // a picked mark can be resized from its corner
    const circle = es.find(e => e.sh === "ellipse"), grip = page.locator(`.pde-e[data-e="${circle.id}"] .pde-grip`);
    await page.locator(`.pde-e[data-e="${circle.id}"] .pde-hit`).click({force: true}); await page.waitForTimeout(150);
    const gb = await page.locator(`.pde-e[data-e="${circle.id}"] .pde-grip`).boundingBox();
    await page.mouse.move(gb.x + 7, gb.y + 7); await page.mouse.down(); await page.mouse.move(gb.x + 37, gb.y + 17, {steps: 4}); await page.mouse.up(); await page.waitForTimeout(250);
    ok((await edits()).find(e => e.id === circle.id).w > circle.w + 10, "dragging the corner makes it bigger"); void grip;

    /* Signature */
    await page.click('.pde-tool[data-id="sign"]'); await page.waitForSelector(".pde-panel.sign");
    ok(/isn't a certified digital signature/.test(await page.locator(".pde-panel.sign").textContent()), "the signature panel says it's a picture, not a certified digital signature");
    const pad = await page.locator("#pdeSigPad").boundingBox();
    await page.mouse.move(pad.x + 40, pad.y + pad.height * 0.6); await page.mouse.down();
    for (let i = 1; i <= 24; i++) await page.mouse.move(pad.x + 40 + i * 14, pad.y + pad.height * (0.6 - 0.25 * Math.sin(i / 2.2)));
    await page.mouse.up();
    await shot("2-signature");
    await page.click('[data-act="pde-sig-use"]'); await page.waitForTimeout(500);
    const sg = await wordAt("Signature:");
    await page.mouse.click(sg.r + 10, sg.t - 12); await page.waitForTimeout(400);
    es = await edits();
    const sig = es.find(e => e.k === "i" && e.sig);
    ok(sig && sig.h >= 18 && sig.h <= 40 && sig.w <= 220, "Place Signature puts it where you click, sized by the text near it: " + JSON.stringify(sig && [sig.w, sig.h]));
    ok(await page.evaluate(() => JSON.parse(localStorage.getItem("studyboard:pdeSigs") || "[]").length === 1), "and keeps it on this device for next time");
    await page.waitForSelector(`.pde-e[data-e="${sig.id}"] img`, {timeout: 5000});
    // resizing a picture keeps it on screen the whole time (the same image, not a new one that has to load and blinks)
    { await page.click(`.pde-e[data-e="${sig.id}"] img`); await page.waitForTimeout(250);
      await page.locator(`.pde-e[data-e="${sig.id}"] .pde-grip`).last().scrollIntoViewIfNeeded(); await page.waitForTimeout(200);
      const g = await page.locator(`.pde-e[data-e="${sig.id}"] .pde-grip`).last().boundingBox();
      await page.evaluate(id => { window.__img0 = document.querySelector(`.pde-e[data-e="${id}"] img`); }, sig.id);
      await page.mouse.move(g.x + g.width / 2, g.y + g.height / 2); await page.mouse.down();
      let same = true;
      for (let i = 1; i <= 6; i++) { await page.mouse.move(g.x + g.width / 2 + i * 8, g.y + g.height / 2 + i * 3); same = same && await page.evaluate(id => document.querySelector(`.pde-e[data-e="${id}"] img`) === window.__img0 && window.__img0.complete, sig.id); }
      await page.mouse.up(); await page.waitForTimeout(300);
      ok(same, "resizing a picture keeps the same image showing while you drag (no blinking)");
      ok((await edits()).find(e => e.id === sig.id).w > sig.w + 5, "and it's bigger after"); }

    /* Your own fonts */
    const dejavu = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf";
    if (fs.existsSync(dejavu)) {
      const bad = restricted(fs.readFileSync(dejavu));
      const r1 = page.evaluate(b => window.__sbProStudy.pdeFonts.add(new Uint8Array(b)), [...bad]);
      await page.waitForSelector("#askDlg[open]");
      ok(/licence doesn't allow putting it in a PDF/.test(await page.locator("#askDlg").textContent()), "a font whose licence forbids embedding is refused, and the editor says why");
      await page.click("#askYes"); ok(await r1 === null, "and it isn't added");
      await page.click('.pde-tool[data-id="add"]');
      const lab = await wordAt("Signature:");
      await page.mouse.click(lab.l, lab.b + 60); await page.waitForTimeout(250);
      await page.keyboard.type("Подпись родителя / Firma del padre");
      await page.waitForTimeout(150);
      ok(/Cyrillic text isn't in this PDF's fonts.*Noto Sans/.test(await page.locator("#pdeMsg").textContent()), "letters the standard fonts can't draw are flagged as you type, by name: " + await page.locator("#pdeMsg").textContent());
      const fid = await page.evaluate(b => window.__sbProStudy.pdeFonts.add(new Uint8Array(b)), [...fs.readFileSync(dejavu)]);
      ok(/^[a-f0-9]{16}$/.test(fid || ""), "an ordinary font is added (kept on this device)");
      await page.evaluate(fid => { const s = document.getElementById("pdeFam"); s.value = "ff:" + fid; s.dispatchEvent(new Event("change", {bubbles: true})); }, fid);
      await page.waitForTimeout(400);
      await page.keyboard.press("Control+Enter"); await page.waitForTimeout(300);
      const fe = (await edits()).find(e => e.k === "n" && e.ff === fid);
      ok(fe && /Подпись/.test(fe.t), "with that font, Russian (or any script the font has) can be typed and kept");
      ok(await page.evaluate(() => window.__sbProStudy.pde().sel) === fe.id, "the text box stays picked");
      await page.evaluate(() => { const s = document.getElementById("pdeFam"); s.value = "+"; s.dispatchEvent(new Event("change", {bubbles: true})); });
      await page.waitForSelector(".pde-panel.fonts"); await page.waitForTimeout(300);
      ok(/Only use fonts you're allowed to use/.test(await page.locator(".pde-panel.fonts").textContent()) && await page.locator(".pde-panel.fonts .pde-fonts li").count() === 1, "Your Fonts lists the added font, with a reminder about font licences");
      await shot("7-fonts");
      await page.click('.pde-panel [data-act="pde-panel-close"]');
      await page.click('.pde-tool[data-id="text"]');
    } else console.log("skip - DejaVu Sans isn't installed here (font tests)");

    /* Find and replace */
    await tool('find'); await page.waitForTimeout(200);
    await page.fill("#pdeFindQ", "Hall B"); await page.waitForTimeout(600);
    ok(/2 matches on 1 page/.test(await page.locator("#pdeFindN").textContent()), "Find counts matches (the paragraph's own Hall B is already changed): " + await page.locator("#pdeFindN").textContent());
    await page.fill("#pdeFindR", "Room 210");
    await shot("3-find");
    await page.click('[data-act="pde-find-all"]'); await page.waitForTimeout(600);
    es = await edits();
    ok(es.filter(e => e.k === "t" && /Room 210/.test(e.t)).length === 2, "Replace All changes each line that has it");
    await tool('find');
    await page.mouse.move(5, 5); await page.waitForTimeout(300);
    await shot("4-edited");

    /* Download: everything is in the file, highlights too */
    const out = await download(true), info = await textOf(out);
    const t = info[0].text.replace(/\s+/g, " ");
    ok(/December 22 in Hall C/.test(t) && /Office hours are on Tuesdays/.test(t) && !/October 20/.test(t), "the new paragraph is in the file, the old one gone");
    ok(/Room 210/.test(t) && !/Hall B/.test(t), "both replacements are in the file");
    ok(!fs.existsSync(dejavu) || /Подпись родителя/.test(t), "text in an added font is in the file");
    ok(info[0].annots.includes("Highlight"), "the highlight came along as a standard PDF highlight");
    const doc = await L.PDFDocument.load(out, {updateMetadata: false});
    ok(/Studyboard/.test(doc.getProducer() || ""), "the file says it was edited with Studyboard");
    if (SHOTS) fs.writeFileSync(path.join(SHOTS, "edited.pdf"), out);
    // marks and the signature are drawn on the page: a picture XObject and the strokes
    const raw = Buffer.from(await (await L.PDFDocument.load(out)).save({useObjectStreams: false})).toString("latin1");
    ok(/\/Subtype \/Image/.test(raw), "the signature is in the file as a picture");

    /* Pages */
    await tool('pages'); await page.waitForSelector(".pde-panel.pages .pde-card");
    ok(await page.locator(".pde-card").count() === 1, "Pages shows the PDF's page");
    await page.click('[data-act="pde-pg"][data-id="b:0"]'); await page.click('[data-act="pde-pg"][data-id="r:0"]');
    await page.evaluate(() => { const s = document.getElementById("pdePagesFrom"); s.value = "f2"; s.dispatchEvent(new Event("change", {bubbles: true})); });
    await page.waitForFunction(() => document.querySelectorAll(".pde-card").length === 3, null, {timeout: 10000});
    await page.waitForTimeout(600);
    ok(await page.locator(".pde-card").count() === 3, "a blank page and a page from another file are added");
    await shot("5-pages");
    await page.evaluate(() => { window.__ups = []; window.__sbProStudy.caps.assets = {upload: async (file, o) => { window.__ups.push(file.name); return {id: "a-syl-" + window.__ups.length, sizeBytes: file.size, contentType: o.type}; }}; });
    await page.click('[data-act="pde-pages-apply"]');
    await page.waitForFunction(() => state.files.f1.revs.length === 2, null, {timeout: 30000});
    await page.waitForSelector(".pdr-page .textLayer span", {timeout: 15000}); await page.waitForTimeout(500);
    const f1 = await page.evaluate(() => state.files.f1);
    ok(!f1.pe && f1.hl[0].a === "a-syl-1" && f1.hl[0].p === 1, "Apply saves a new version with everything in it; the highlight follows its page");
    ok(/of 3/.test(await page.locator("#pdrOf").textContent()), "the new version has 3 pages");
    const saved = await page.evaluate(async () => { const b = await window.__sbProStudy.idbGet("pdf:a-syl-1"); return [...new Uint8Array(await b.arrayBuffer())]; }).catch(() => null);
    if (saved) { const pi = await textOf(Buffer.from(saved)); ok(pi[0].rot === 90 && /Room 210/.test(pi[0].text) && /Field trip permission form/.test(pi[2].text), "page 1 turned, with the edits; page 3 is the form's page"); }

    /* Forms */
    await page.evaluate(() => window.__sbProStudy.dlg().close());
    await open("f2");
    await page.waitForSelector(".pde-field", {timeout: 8000});
    ok(await page.locator(".pde-field").count() === 6, "a fillable PDF's fields can be typed into, in the reader");
    await page.fill('.pde-field[data-f="student.name"]', "Ana López"); await page.locator('.pde-field[data-f="student.name"]').blur();
    await page.fill('.pde-field[data-f="allergies"]', "Peanuts\nShellfish"); await page.locator('.pde-field[data-f="allergies"]').blur();
    await page.check('.pde-field[data-f="permission"]'); await page.check('.pde-field[data-f="lunch"][data-v="School"]');
    await page.selectOption('.pde-field[data-f="grade"]', "11"); await page.waitForTimeout(300);
    await shot("6-form");
    await page.click("#pdeBtn"); await page.waitForTimeout(300);
    const fo = await textOf(await download());
    const an = fo[0].annots.join(" ");
    ok(/student\.name="Ana López"/.test(an) && /permission="Yes"/.test(an) && /lunch="School"/.test(an) && /grade=\["11"\]/.test(an) && /allergies="Peanuts\\nShellfish"/.test(an), "the downloaded form has every answer in its fields: " + an);

    ok(errs.length === 0, "no page errors: " + errs.join(" | "));
    console.log(`\n${n} checks passed`);
  } finally { await browser.close(); server.close(); }
})().catch(e => { console.error("FAIL:", e && e.stack || e); server.close(); process.exit(1); });
