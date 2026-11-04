// node tests/pdf-edit.e2e.js   (PDE_SHOTS=<folder> also saves screenshots of each step; PDE_VIEW=390x844 for a phone)
// The PDF reader's Edit mode: change a line of text, add a text box, white-out, then download the PDF and check its text
/* global state, dlg */
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
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

// A syllabus the way Chrome or Word writes one: embedded, cut-down fonts with two-byte codes
const SYLLABUS = `<html><body style="margin:56px 64px;font-family:Arial;color:#1d1d1f">
<h1 style="font-size:26px;margin:0 0 4px">BIO 101: Introduction to Biology</h1>
<p style="font-size:14px;color:#555;margin:0 0 18px">Fall Semester · Section 02 · Hall B, Room 114</p>
<p style="font-size:14px;margin:0 0 6px"><b>Instructor:</b> Dr. Maria Rivera</p>
<p style="font-size:14px;margin:0 0 18px"><b>Office hours:</b> Tuesday and Thursday, 2:00 to 4:00 pm</p>
<h2 style="font-size:17px;margin:0 0 6px">Exams and Deadlines</h2>
<p style="font-family:Georgia;font-size:14px;line-height:1.5;text-align:justify;margin:0 0 14px">The midterm exam is on October 20 in Hall B and covers chapters one through six. The final project is due December 5 and is worth forty percent of your grade. Late work loses ten percent per day unless you ask for an extension before the deadline.</p>
<h2 style="font-size:17px;margin:0 0 6px">Grading</h2>
<p style="font-size:14px;margin:0 0 4px">Labs 30% · Midterm 30% · Final project 40%</p>
<p style="font-size:12px;color:#1a4fb0;margin:70px 0 0">Draft copy: not for distribution</p>
</body></html>`;

(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  try {
    const maker = await browser.newPage(); await maker.setContent(SYLLABUS); const pdf = await maker.pdf({format: "Letter"}); await maker.close();
    const seed = {v: 2, updated: 1, decks: [], notes: [], tasks: [], settings: {}, courses: [{id: "c1", name: "Biology", code: "BIO101", color: "#3B6FE0"}],
      files: [{id: "f1", name: "BIO 101 Syllabus.pdf", courseId: "c1", folderId: "other", kind: "file", taskIds: [], desc: "", url: "", revs: [{assetId: "a-syl", name: "BIO 101 Syllabus.pdf", size: pdf.length, type: "application/pdf", at: 1}]}]};
    const [vw, vh] = (process.env.PDE_VIEW || "1280x860").split("x").map(Number); // PDE_VIEW=390x844 runs it phone-sized
    const ctx = await browser.newContext({viewport: {width: vw, height: vh}, hasTouch: vw < 600, serviceWorkers: "block", acceptDownloads: true});
    await ctx.addInitScript(seed => { try { if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("coursework:v2", JSON.stringify(seed)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("studyboard:tour", "1"); } } catch (e) {} }, seed);
    const page = await ctx.newPage(); const errs = [];
    page.on("pageerror", e => errs.push(e.message)); page.on("console", m => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errs.push(m.text()); });
    await page.goto(base); await page.waitForSelector("#view", {state: "attached"}); await page.waitForFunction(() => window.__sbProStudy);
    await page.evaluate(() => { const T = window.__sbProStudy; Object.defineProperty(window, "state", {get: () => T.state(), configurable: true}); Object.defineProperty(window, "dlg", {get: () => T.dlg(), configurable: true}); });
    await page.waitForTimeout(600);
    // the tools under More open from its menu
    const tool = async id => { if (await page.locator(`.pde-tools > .pde-tool[data-id="${id}"]`).count()) await page.click(`.pde-tools > .pde-tool[data-id="${id}"]`); else { await page.click('[data-act="pde-more"]'); await page.click(`.pde-mi[data-id="${id}"]`); } await page.waitForTimeout(200); };
    const shot = async name => { if (SHOTS) { fs.mkdirSync(SHOTS, {recursive: true}); await page.screenshot({path: path.join(SHOTS, name + ".png")}); } };
    await page.evaluate(async bytes => { await window.__sbProStudy.idbSet("pdf:a-syl", new Blob([new Uint8Array(bytes)], {type: "application/pdf"})); }, [...pdf]);
    await page.evaluate(() => { const b = document.createElement("button"); b.dataset.act = "pdr-open"; b.dataset.id = "f1"; document.body.appendChild(b); b.click(); b.remove(); });
    await page.waitForSelector(".pdr-page .textLayer span", {timeout: 15000}); await page.waitForTimeout(400);

    /* Edit mode */
    ok(await page.locator("#pdeBtn").count() === 1, "the reader has an Edit button");
    await page.click("#pdeBtn"); await page.waitForTimeout(300);
    ok(await page.locator(".pde-bar").isVisible(), "Edit shows the edit tools");
    ok(await page.locator('.pde-tool[data-id="text"][aria-pressed="true"]').count() === 1, "Edit Text is the tool to start with");
    await page.click('[data-act="pde-more"]');
    ok(await page.evaluate(() => !!document.querySelector(".pde-menu") && getComputedStyle(document.querySelector(".pde-tools")).animationName === "none"), "More opens its whole menu at once (the tool row isn't faded back in, which hid the menu behind the page)");
    await page.click('[data-act="pde-more"]'); await page.waitForTimeout(150);
    await page.waitForFunction(() => !!window.PDFLib, null, {timeout: 10000});
    ok(true, "pdf-lib loads on demand from vendor/pdflib/");

    // where a word is on screen, from the page's text layer
    const wordAt = word => page.evaluate(word => {
      const span = [...document.querySelectorAll(".pdr-page .textLayer span")].find(s => s.textContent.includes(word)); if (!span) return null;
      const tn = span.firstChild, i = tn.textContent.indexOf(word), r = document.createRange(); r.setStart(tn, i); r.setEnd(tn, i + word.length);
      const b = r.getBoundingClientRect(); return {x: b.left + b.width / 2, y: b.top + b.height / 2, l: b.left, r: b.right};
    }, word);
    // select a word inside the open editor
    const selectInEditor = word => page.evaluate(word => {
      const t = document.querySelector(".pde-e.editing .pde-t"), tn = t.firstChild, i = tn.textContent.indexOf(word), r = document.createRange();
      r.setStart(tn, i); r.setEnd(tn, i + word.length); const s = getSelection(); s.removeAllRanges(); s.addRange(r); return i >= 0;
    }, word);

    // 1. change a date in the justified paragraph
    const oct = await wordAt("October 20");
    await page.mouse.move(oct.x, oct.y); await page.waitForTimeout(150);
    ok(await page.locator(".pde-hover:not([hidden])").count() === 1, "pointing at text outlines the line that can be edited");
    await page.mouse.click(oct.x, oct.y); await page.waitForTimeout(400);
    ok(await page.locator(".pde-e.k-p.editing").count() === 1 && await page.locator('[data-act="pde-line"]').count() === 1, "clicking text in a paragraph opens the whole paragraph, with Edit One Line to change just a line");
    await page.click('[data-act="pde-line"]'); await page.waitForTimeout(250);
    ok(await page.locator(".pde-e.k-p").count() === 0 && (await page.evaluate(() => state.files.f1.pe || [])).length === 0, "Edit One Line leaves the paragraph as it was (no edit)");
    await page.mouse.click(oct.x, oct.y); await page.waitForTimeout(300);
    ok(await page.locator(".pde-e.editing .pde-t[contenteditable]").count() === 1, "clicking text opens it for typing, in place");
    ok(/October 20 in Hall B/.test(await page.locator(".pde-e.editing .pde-t").textContent()), "with the line's own words");
    await selectInEditor("October 20"); await page.keyboard.type("December 22");
    await shot("1-typing");
    await page.keyboard.press("Enter"); await page.waitForTimeout(400);
    let pe = await page.evaluate(() => state.files.f1.pe || []);
    ok(pe.length === 1 && pe[0].k === "t" && /December 22 in Hall B/.test(pe[0].t) && /October 20/.test(pe[0].old) && pe[0].a === "a-syl", "Enter keeps the change as an edit on this version of the file");
    await page.waitForFunction(() => /Same font as the PDF|similar font/i.test((document.getElementById("pdeMsg") || {}).textContent || ""), null, {timeout: 8000}).catch(() => {});
    ok(/Same font as the PDF/.test(await page.locator("#pdeMsg").textContent()), "the new words can use the PDF's own font (every letter is in it)");
    ok(await page.getAttribute("#pdrSaveSlot [data-act=pde-save]", "aria-label") === "Save 1 edit" && (await page.textContent("#pdrSaveSlot .pdr-badge")).trim() === "1", "Save counts the edits");

    // 2. a name the PDF's font can't fully draw (it has no capital Z) gets a similar font, and says so
    const riv = await wordAt("Rivera");
    await page.mouse.click(riv.x, riv.y); await page.waitForTimeout(300);
    await selectInEditor("Maria Rivera"); await page.keyboard.type("Zoe Kim"); await page.keyboard.press("Escape"); await page.waitForTimeout(300);
    ok((await page.evaluate(() => state.files.f1.pe || [])).some(e => /Zoe Kim/.test(e.t)) && await page.locator(".pde-e.editing").count() === 0, "Esc closes the editor and keeps what was typed");
    await page.waitForFunction(() => /similar font/i.test((document.getElementById("pdeMsg") || {}).textContent || ""), null, {timeout: 8000}).catch(() => {});
    ok(/similar font/.test(await page.locator("#pdeMsg").textContent()), "letters the PDF's font doesn't have get a similar standard font, and the bar says so");

    // 3. a new text box
    await page.click('.pde-tool[data-id="add"]');
    const grade = await wordAt("Labs 30%");
    await page.mouse.click(grade.l, grade.y + 40); await page.waitForTimeout(300);
    ok(await page.locator(".pde-e.k-n.editing").count() === 1, "Add Text opens a new text box where you click");
    await page.keyboard.type("Lab reports go in the Canvas dropbox.");
    await page.click('.pde-fmt [data-act="pde-b"]'); await page.waitForTimeout(150);
    await page.click('.pde-fmt [data-act="pde-color"][data-id="#c0262d"]'); await page.waitForTimeout(150);
    ok(await page.locator(".pde-e.k-n.editing").count() === 1, "styling it keeps it open for typing");
    await page.keyboard.press("Control+Enter"); await page.waitForTimeout(300);
    pe = await page.evaluate(() => state.files.f1.pe || []);
    const box = pe.find(e => e.k === "n");
    ok(box && box.t === "Lab reports go in the Canvas dropbox." && box.b === 1 && box.c === "#c0262d", "the text box is kept, bold and red");
    // keys in a box over the editor are that box's: Backspace there doesn't delete the picked text box
    await page.evaluate(() => { const d = document.createElement("dialog"); d.id = "testDlg"; d.innerHTML = "<button>OK</button>"; document.body.appendChild(d); d.showModal(); d.querySelector("button").focus(); });
    await page.keyboard.press("Backspace"); await page.keyboard.press("Delete"); await page.keyboard.press("Escape");
    await page.evaluate(() => document.getElementById("testDlg").remove());
    ok((await page.evaluate(() => state.files.f1.pe || [])).some(e => e.k === "n"), "Backspace in a dialog over the editor doesn't delete the picked edit");

    // 4. white-out the draft line
    await page.click('.pde-tool[data-id="white"]');
    await page.evaluate(() => { const s = [...document.querySelectorAll(".pdr-page .textLayer span")].find(s => s.textContent.includes("Draft copy")); s.scrollIntoView({block: "center"}); }); await page.waitForTimeout(300);
    const dr = await wordAt("Draft copy");
    const end = await wordAt("distribution");
    await page.mouse.move(dr.l - 4, dr.y - 12); await page.mouse.down(); await page.mouse.move((dr.l + end.r) / 2, dr.y, {steps: 4}); await page.mouse.move(end.r + 4, dr.y + 12, {steps: 4}); await page.mouse.up();
    await page.waitForTimeout(300);
    pe = await page.evaluate(() => state.files.f1.pe || []);
    ok(pe.some(e => e.k === "w" && e.w > 50 && e.h > 5 && e.r === 0 && e.bg === "#ffffff"), "dragging with White-Out covers an area in the page's own background color");
    await page.click('.pde-tool[data-id="text"]'); await page.waitForTimeout(200);
    await page.mouse.move(10, 10);
    await shot("2-edited");

    // Ctrl+Z takes back the last edit (then the white-out is made again)
    const before = pe.length;
    await page.keyboard.press("Control+z"); await page.waitForTimeout(300);
    ok((await page.evaluate(() => (state.files.f1.pe || []).length)) === before - 1, "Ctrl+Z undoes the last edit");
    // Undo and Redo buttons at the right end of the edit row, after More
    { const pos = await page.evaluate(() => { const u = document.querySelector('.pde-ur [data-id="-1"]'), r = document.querySelector('.pde-ur [data-id="1"]'), m = document.querySelector('[data-act="pde-more"]'), bar = document.querySelector(".pde-bar");
        if (!u || !r) return null; const ub = u.getBoundingClientRect(), rb = r.getBoundingClientRect(), bb = bar.getBoundingClientRect(), mb = m ? m.getBoundingClientRect() : {right: 0};
        return {after: ub.left > mb.right, right: bb.right - rb.right, sameRow: Math.abs(ub.top - (m ? mb.top : ub.top)) < 4, redoOn: !r.disabled}; });
      ok(pos && pos.after && pos.sameRow && pos.right < 40, "Undo and Redo sit at the right end of the edit row, after More: " + JSON.stringify(pos));
      ok(pos.redoOn, "after an undo, Redo is available");
      await page.click('.pde-ur [data-id="1"]'); await page.waitForTimeout(300);
      ok((await page.evaluate(() => (state.files.f1.pe || []).length)) === before, "the Redo button brings the edit back");
      await page.click('.pde-ur [data-id="-1"]'); await page.waitForTimeout(300);
      ok((await page.evaluate(() => (state.files.f1.pe || []).length)) === before - 1, "the Undo button takes it back again");
      ok(await page.evaluate(() => !document.querySelector('.pde-ur [data-id="1"]').disabled), "Redo stays available after Undo"); }
    await page.mouse.move(dr.l - 4, dr.y - 12);
    await page.click('.pde-tool[data-id="white"]');
    await page.mouse.move(dr.l - 4, dr.y - 12); await page.mouse.down(); await page.mouse.move(end.r + 4, dr.y + 12, {steps: 6}); await page.mouse.up(); await page.waitForTimeout(300);
    await page.click('.pde-tool[data-id="text"]'); await page.waitForTimeout(200);

    /* Download: the PDF's text really changed */
    await page.click('[data-act="pde-dl"]'); await page.waitForSelector('[data-act="pde-dl-go"]');
    const [dl] = await Promise.all([page.waitForEvent("download", {timeout: 20000}), page.click('[data-act="pde-dl-go"]')]);
    ok(/BIO 101 Syllabus \(edited\)\.pdf$/.test(dl.suggestedFilename()), "Download PDF saves “… (edited).pdf”: " + dl.suggestedFilename());
    const out = fs.readFileSync(await dl.path());
    const text = await page.evaluate(async bytes => {
      const doc = await window.pdfjsLib.getDocument({data: new Uint8Array(bytes), disableFontFace: true, isEvalSupported: false}).promise, tc = await (await doc.getPage(1)).getTextContent();
      return tc.items.map(i => i.str).join("\n");
    }, [...out]);
    ok(/December 22 in Hall B/.test(text) && !/October 20/.test(text), "the old date is gone from the file's text, not just covered");
    ok(/Dr\. Zoe Kim/.test(text) && !/Rivera/.test(text), "the new name is in the file");
    ok(/Lab reports go in the Canvas dropbox\./.test(text), "the text box is in the file");
    ok(!/Draft copy/.test(text) && !/distribution/.test(text), "the white-out took the words under it out of the file");
    ok(/Labs 30%/.test(text) && /final project is due December 5/i.test(text.replace(/\n/g, " ")), "everything else is still there");
    if (SHOTS) fs.writeFileSync(path.join(SHOTS, "edited.pdf"), out), fs.writeFileSync(path.join(SHOTS, "original.pdf"), pdf);

    /* Leaving Edit: the edits still show, and highlighting works again */
    await page.click("#pdeBtn"); await page.waitForTimeout(250);
    ok(await page.locator(".pde-bar").count() === 0 && await page.locator(".pde-e").count() >= 3, "Edit off hides the tools; the edits stay drawn on the page");
    ok(/4/.test(await page.locator("#pdeBtn .pdr-badge").textContent()), "the Edit button counts unsaved edits");

    /* Save as a new version */
    // file storage comes with an account or the desktop app; here, a stand-in that keeps the upload in memory
    await page.evaluate(() => { window.__ups = []; window.__sbProStudy.caps.assets = {upload: async (file, o) => { window.__ups.push({name: file.name, type: o.type, size: file.size}); return {id: "a-syl-2", sizeBytes: file.size, contentType: o.type}; }}; });
    // a highlight on the old version comes along to the new one
    await page.evaluate(() => { const f = state.files.f1; window.__sbProStudy.applyChanges([{kind: "file", id: "f1", after: Object.assign(window.__sbProStudy.clone(f), {hl: [{id: "h1", a: "a-syl", p: 1, r: [[0.1, 0.1, 0.2, 0.02]], t: "Grading", c: "yellow", at: 1}]})}], null); });
    await page.click("#pdeBtn"); await page.waitForTimeout(250);
    await page.click('[data-act="pde-save"]'); await page.waitForSelector("#askDlg[open] #askAlt");
    ok(/Update Rev A/.test(await page.textContent("#askDlg #askAlt")) && /New Version/.test(await page.textContent("#askDlg #askYes")), "Save asks: a new version, or update the one you opened");
    await page.click("#askDlg #askYes");
    await page.waitForFunction(() => state.files.f1.revs.length === 2, null, {timeout: 20000});
    const f = await page.evaluate(() => state.files.f1);
    ok(f.revs.length === 2 && !f.pe && f.revs[1].assetId === "a-syl-2" && f.revs[1].name === "BIO 101 Syllabus.pdf", "Save adds a new version of the file, and the edits are now part of it");
    ok(await page.evaluate(() => window.__ups.length === 1 && window.__ups[0].type === "application/pdf"), "the edited PDF is uploaded once, as a PDF");
    ok(f.hl.length === 1 && f.hl[0].a === "a-syl-2", "highlights move to the new version");
    await page.waitForSelector(".pdr-page .textLayer span", {timeout: 15000}); await page.waitForTimeout(500);
    ok(await page.evaluate(() => window.__sbProStudy.reader().rev === state.files.f1.revs[1].assetId), "the reader opens the new version");
    ok(/December 22/.test(await page.locator(".pdr-page .textLayer").first().textContent()), "and shows the new words");
    await shot("3-new-version");

    ok(errs.length === 0, "no page errors: " + errs.join(" | "));
    console.log(`\n${n} checks passed`);
  } finally { await browser.close(); server.close(); }
})().catch(e => { console.error("FAIL:", e && e.stack || e); server.close(); process.exit(1); });
