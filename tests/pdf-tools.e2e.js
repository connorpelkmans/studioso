// node tests/pdf-tools.e2e.js   (PDE_SHOTS=<folder> also saves screenshots)
// Making a worksheet fillable, stamps, a watermark, links, the PDF's own pictures, history, copy and paste, aligning, passwords,
// Turn In, Ask This PDF and Study (with a stand-in AI), and in Files: Convert and PDF Batch
/* global state */
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const csp = require("../scripts/csp");
const L = require("pdf-lib"), LC = require("@cantoo/pdf-lib");
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


// a ZIP without compression (enough for a small Word file)
function zipStore(files){
  const zlib = require("zlib"), parts = [], cd = []; let off = 0;
  files.forEach(f => { const name = Buffer.from(f.name), data = Buffer.from(f.data), crc = zlib.crc32(data), h = Buffer.alloc(30);
    h.writeUInt32LE(0x04034b50, 0); h.writeUInt16LE(20, 4); h.writeUInt32LE(crc, 14); h.writeUInt32LE(data.length, 18); h.writeUInt32LE(data.length, 22); h.writeUInt16LE(name.length, 26);
    const c = Buffer.alloc(46); c.writeUInt32LE(0x02014b50, 0); c.writeUInt16LE(20, 4); c.writeUInt16LE(20, 6); c.writeUInt32LE(crc, 16); c.writeUInt32LE(data.length, 20); c.writeUInt32LE(data.length, 24); c.writeUInt16LE(name.length, 28); c.writeUInt32LE(off, 42);
    parts.push(h, name, data); cd.push(c, name); off += 30 + name.length + data.length; });
  const cdb = Buffer.concat(cd), e = Buffer.alloc(22); e.writeUInt32LE(0x06054b50, 0); e.writeUInt16LE(files.length, 8); e.writeUInt16LE(files.length, 10); e.writeUInt32LE(cdb.length, 12); e.writeUInt32LE(off, 16);
  return Buffer.concat([...parts, cdb, e]);
}
const DOT = "iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAIAAACQkWg2AAAAJ0lEQVR42mNkYPhfz0AEYBxVSF+FjAwM/xkYGP4TrRBdMQEFAwYAAEWDB/0R0B7nAAAAAElFTkSuQmCC";
const DOC = `<html><body style="margin:56px 64px;font-family:Arial;color:#1d1d1f">
<h1 style="font-size:24px">Field Trip Worksheet</h1>
<p style="font-size:14px">Student name: <span style="display:inline-block;width:260px;border-bottom:1px solid #000">&nbsp;</span></p>
<p style="font-size:14px">See <a href="https://example.edu/trip">the trip page</a> for the schedule. Osmosis moves water across a membrane.</p>
<p style="font-size:14px">Notes</p><div style="width:420px;height:120px;border:1px solid #000"></div>
<p style="font-size:14px"><span style="display:inline-block;width:12px;height:12px;border:1px solid #000;vertical-align:middle"></span> I give permission</p>
<img src="data:image/png;base64,${DOT}" style="width:120px;height:120px;margin-top:20px">
</body></html>`;

(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  try {
    const maker = await browser.newPage({viewport: {width: 900, height: 1100}});
    await maker.setContent(DOC); const ws = await maker.pdf({format: "Letter", tagged: true}); await maker.close();
    const locked = Buffer.from(await (async () => { const d = await LC.PDFDocument.create(), f = await d.embedFont(LC.StandardFonts.Helvetica); d.addPage([612, 792]).drawText("Secret reading", {x: 72, y: 700, size: 18, font: f}); d.encrypt({userPassword: "open123", ownerPassword: "owner-xyz"}); return d.save(); })());
    const rev = (id, name, size) => ({assetId: id, name, size, type: "application/pdf", at: 1});
    const seed = {v: 2, updated: 1, decks: [], notes: [], settings: {}, courses: [{id: "c1", name: "Biology", code: "BIO101", color: "#3B6FE0"}],
      tasks: [{id: "t1", title: "Field Trip Worksheet", courseId: "c1", due: "2026-11-09", status: "todo"}],
      files: [{id: "f1", name: "Worksheet.pdf", courseId: "c1", folderId: "other", kind: "file", taskIds: ["t1"], desc: "", url: "", revs: [rev("a-ws", "Worksheet.pdf", ws.length)]},
        {id: "f2", name: "Locked reading.pdf", courseId: "c1", folderId: "other", kind: "file", taskIds: [], desc: "", url: "", revs: [rev("a-lk", "Locked reading.pdf", locked.length)]},
        {id: "f3", name: "Copy of worksheet.pdf", courseId: "c1", folderId: "other", kind: "file", taskIds: [], desc: "", url: "", revs: [rev("a-ws2", "Copy of worksheet.pdf", ws.length)]}]};
    const ctx = await browser.newContext({viewport: {width: 1280, height: 900}, serviceWorkers: "block", acceptDownloads: true});
    ctx.aiBodies = [];
    await ctx.route(/generativelanguage\.googleapis\.com/, async route => {
      const body = route.request().postData() || ""; ctx.aiBodies.push(body);
      let reply = {};
      if (/answer a student's question/.test(body)) reply = {answer: "Water moves across a membrane by osmosis [p. 1].", found: true, cites: [{page: 1, quote: "Osmosis moves water across a membrane"}]};
      else if (/flashcards/.test(body)) reply = {cards: [{front: "What is osmosis?", back: "Water moving through a membrane toward more solute.", page: 1}, {front: "Where is the schedule?", back: "On the trip's web page.", page: 1}]};
      else if (/practice questions/.test(body)) reply = {questions: [{type: "single", q: "Osmosis moves which substance?", options: ["Water", "Salt", "Sugar", "Air"], correct: [0], explain: "It is the movement of water."}, {type: "short", q: "Name what water crosses.", answer: "A membrane", explain: "A membrane."}]};
      else if (/study outline/.test(body)) reply = {title: "Worksheet outline", sections: [{heading: "The trip", page: 1, points: ["Fill in your name", "Check the schedule online"]}]};
      route.fulfill({status: 200, contentType: "application/json", body: JSON.stringify({candidates: [{content: {parts: [{text: JSON.stringify(reply)}]}, finishReason: "STOP"}]})});
    });
    await ctx.addInitScript(seed => {
      try { if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("coursework:v2", JSON.stringify(seed)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("studyboard:tour", "1");
        localStorage.setItem("studyboard:aiKeys", JSON.stringify({gemini: "AIzaTESTTESTTESTTESTTESTTEST12345"})); localStorage.setItem("studyboard:aiConsent", JSON.stringify({gemini: {v: 1, at: 1}})); } } catch (e) {}
    }, seed);
    const page = await ctx.newPage(); const errs = [];
    page.on("pageerror", e => errs.push(e.message)); page.on("console", m => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errs.push(m.text()); });
    await page.goto(base); await page.waitForSelector("#view", {state: "attached"}); await page.waitForFunction(() => window.__sbProStudy);
    await page.evaluate(() => { const T = window.__sbProStudy; Object.defineProperty(window, "state", {get: () => T.state(), configurable: true}); });
    await page.waitForTimeout(500);
    const shot = async name => { if (SHOTS) { fs.mkdirSync(SHOTS, {recursive: true}); await page.screenshot({path: path.join(SHOTS, name + ".png")}); } };
    const MORE = ["fill", "header", "find", "pages", "ocr", "fields", "stamp", "watermark", "link", "history"];
    const tool = async id => { if (MORE.includes(id)) { await page.click('[data-act="pde-more"]'); await page.click(`.pde-mi[data-id="${id}"]`); } else await page.click(`.pde-tool[data-id="${id}"]`); await page.waitForTimeout(200); };
    await page.evaluate(async files => { for (const [k, b] of files) await window.__sbProStudy.idbSet("pdf:" + k, new Blob([new Uint8Array(b)])); }, [["a-ws", [...ws]], ["a-ws2", [...ws]], ["a-lk", [...locked]]]);
    await page.evaluate(() => { window.__ups = []; window.__sbProStudy.caps.assets = {upload: async (file, o) => { const id = "up-" + (window.__ups.length + 1), b = new Uint8Array(await file.arrayBuffer()); window.__ups.push({id, name: file.name, size: b.length}); await window.__sbProStudy.idbSet("pdf:" + id, new Blob([b])); return {id, sizeBytes: b.length, contentType: o.type}; }}; });
    const act = (a, id) => page.evaluate(([a, id]) => { const b = document.createElement("button"); b.dataset.act = a; if (id) b.dataset.id = id; document.body.appendChild(b); b.click(); b.remove(); }, [a, id]);
    const open = async fid => { await page.evaluate(() => { const d = window.__sbProStudy.dlg(); if (d.open) d.close(); }); await act("pdr-open", fid); await page.waitForSelector(".pdr-page .pdr-cv", {timeout: 15000}); await page.waitForTimeout(600); };
    const edits = () => page.evaluate(() => (state.files[window.__sbProStudy.pde().fid].pe || []));
    const wordAt = word => page.evaluate(word => {
      const span = [...document.querySelectorAll(".pdr-page .textLayer span")].find(s => !s.children.length && s.textContent.includes(word)); if (!span) return null;
      const tn = span.firstChild, i = tn.textContent.indexOf(word), r = document.createRange(); r.setStart(tn, i); r.setEnd(tn, i + word.length);
      const b = r.getBoundingClientRect(); return {x: b.left + b.width / 2, y: b.top + b.height / 2, l: b.left, r: b.right, t: b.top, b: b.bottom};
    }, word);
    const info = (bytes, password) => page.evaluate(async ([bytes, password]) => {
      const doc = await window.pdfjsLib.getDocument(Object.assign({data: new Uint8Array(bytes), disableFontFace: true, isEvalSupported: false}, password ? {password} : {})).promise, out = [];
      for (let p = 1; p <= doc.numPages; p++) { const pg = await doc.getPage(p); out.push({text: (await pg.getTextContent()).items.map(i => i.str).join(" "), annots: (await pg.getAnnotations()).map(a => a.subtype + (a.fieldName ? ":" + a.fieldName : "") + (a.url ? ":" + a.url : ""))}); }
      return {pages: out, outline: (await doc.getOutline() || []).map(o => o.title)};
    }, [[...bytes], password || ""]);
    const needsPw = bytes => page.evaluate(async bytes => { try { await window.pdfjsLib.getDocument({data: new Uint8Array(bytes)}).promise; return false; } catch (e) { return e.name === "PasswordException"; } }, [...bytes]);
    const downloadOf = async click => { const [dl] = await Promise.all([page.waitForEvent("download", {timeout: 30000}), click()]); return {name: dl.suggestedFilename(), bytes: fs.readFileSync(await dl.path())}; };

    /* Make Fillable */
    await open("f1");
    await page.click("#pdeBtn"); await page.waitForFunction(() => !!window.PDFLib); await page.waitForTimeout(400);
    await page.click('[data-act="pde-more"]');
    ok(await page.locator(".pde-menu .pde-mi").count() === 10, "More has the new tools: Make Fillable, Stamp, Watermark, Link and History");
    await page.keyboard.press("Escape");
    await tool("fields"); await page.waitForFunction(() => /Found|No blank/.test((document.getElementById("pdeFdMsg") || {}).textContent || ""), null, {timeout: 15000});
    const names = await page.$$eval("[data-fdn]", l => l.map(x => x.value));
    ok(names.length >= 3 && names.some(n => /Student name/.test(n)) && names.some(n => /permission/.test(n)), "Make Fillable finds the worksheet's blanks and names them: " + names.join(", "));
    await shot("1-fillable");
    await page.click('[data-act="pde-fd-add"]'); await page.waitForTimeout(300);
    const nq = (await edits()).filter(e => e.k === "q").length;
    ok(nq === names.length, "they're added as fields");
    ok(await page.locator(".pde-fld .pde-qf").count() === nq, "each new field has a box to fill in");
    await page.locator('.pde-fld input.pde-qf[type="text"]').first().click();
    await page.keyboard.type("Ana López"); await page.keyboard.press("Tab"); await page.waitForTimeout(800);
    ok((await edits()).some(e => e.k === "q" && e.v === "Ana López"), "a new field can be typed into straight away, and keeps what was typed");
    ok(await page.evaluate(() => !!document.activeElement && document.activeElement.classList.contains("pde-qf")), "Tab moves on to the next field (typing isn't lost to a redraw)");

    /* Stamps, copy and paste, aligning */
    await tool("stamp"); await page.click('[data-act="pde-stamp-t"][data-id="Graded"]');
    const pb = await page.locator(".pdr-page").first().boundingBox();
    await page.mouse.click(pb.x + pb.width * 0.72, pb.y + pb.height * 0.12); await page.waitForTimeout(300);
    let st = (await edits()).filter(e => e.k === "k");
    ok(st.length === 1 && /^GRADED\n/.test(st[0].t), "a Graded stamp with today's date: " + JSON.stringify(st[0] && st[0].t));
    await page.keyboard.press("Control+c"); await page.keyboard.press("Control+v"); await page.waitForTimeout(300);
    st = (await edits()).filter(e => e.k === "k");
    ok(st.length === 2 && st[1].o[0] !== st[0].o[0], "copy and paste makes a second one, a little apart");
    { const sb = await page.locator(`.pde-e[data-e="${st[0].id}"] .pde-stamp`).boundingBox(); await page.keyboard.down("Shift"); await page.mouse.click(sb.x + 4, sb.y + 4); await page.keyboard.up("Shift"); } await page.waitForTimeout(250);
    ok(await page.locator('[data-act="pde-align"]').count() === 8, "with two picked, the align buttons show");
    await page.click('[data-act="pde-align"][data-id="l"]'); await page.waitForTimeout(250);
    st = (await edits()).filter(e => e.k === "k");
    ok(Math.abs(st[0].o[0] - st[1].o[0]) < 0.01, "Left lines them up");

    /* History */
    const before = (await edits()).length;
    await page.keyboard.press("Escape"); await page.keyboard.press("Control+z"); await page.waitForTimeout(250);
    const undone = (await edits()).filter(e => e.k === "k");
    ok(Math.abs(undone[0].o[0] - undone[1].o[0]) > 0.01, "Ctrl+Z undoes the aligning");
    await page.keyboard.press("Control+y"); await page.waitForTimeout(250);
    ok((await edits()).length === before && Math.abs((await edits()).filter(e => e.k === "k").reduce((d, e, k, a) => a[0].o[0] - a[1].o[0], 0)) < 0.01, "Ctrl+Y redoes it");
    await tool("history"); await page.waitForSelector('[data-act="pde-hist-go"]');
    ok(await page.locator('.pde-hist li').count() >= 4 && await page.locator('[data-act="pde-hist-go"]').count() >= 3, "History lists the changes, each one to go back to");
    await page.click('[data-act="pde-panel-close"]').catch(() => {});

    /* Watermark */
    await tool("watermark"); await page.waitForSelector("#pdeWmText");
    ok((await edits()).some(e => e.k === "m" && e.text === "DRAFT") && await page.locator(".pde-wm").count() >= 1, "a watermark shows on the page as soon as it's opened");
    await page.fill("#pdeWmText", "SAMPLE"); await page.waitForTimeout(400);
    ok((await edits()).some(e => e.k === "m" && e.text === "SAMPLE"), "and changes as you type");
    await shot("2-stamp-watermark");
    await page.click('.pde-panel [data-act="pde-panel-close"]');

    /* Links */
    await tool("link"); await page.waitForTimeout(400);
    ok(await page.locator(".pde-oldlink").count() >= 1, "the Link tool shows the PDF's own links");
    await page.locator(".pde-oldlink").first().click(); await page.waitForTimeout(500);
    ok((await edits()).some(e => e.k === "l" && e.del), "clicking one takes it out");
    const h1 = await wordAt("Field Trip");
    await page.mouse.move(h1.l, h1.t); await page.mouse.down(); await page.mouse.move(h1.r, h1.b, {steps: 4}); await page.mouse.up(); await page.waitForSelector("#pdeLkUrl");
    await page.fill("#pdeLkUrl", "example.org/trip"); await page.click('[data-act="pde-link-add"]'); await page.waitForTimeout(300);
    ok((await edits()).some(e => e.k === "l" && e.url === "https://example.org/trip"), "dragging over a heading adds a link (https:// is added)");

    /* The PDF's own pictures */
    await page.click('.pde-tool[data-id="text"]'); await page.waitForTimeout(200);
    const cv = await page.locator(".pdr-page .pdr-cv").first().boundingBox();
    // the picture sits under "I give permission": find it from the PDF itself
    const perm = await wordAt("I give permission");
    await page.mouse.click(perm.l + 40, perm.b + 70); await page.waitForTimeout(300);
    ok(await page.locator('[data-act="pde-pic-del"]').count() === 1, "clicking one of the PDF's pictures picks it");
    await page.click('[data-act="pde-pic-del"]'); await page.waitForTimeout(300);
    ok((await edits()).some(e => e.k === "x" && e.del), "Take Out removes it");
    void cv;

    /* Save: everything is in the new version */
    await page.click('[data-act="pde-save"]');
    await page.waitForFunction(() => state.files.f1.revs.length === 2, null, {timeout: 30000}); await page.waitForTimeout(600);
    const savedId = await page.evaluate(() => state.files.f1.revs[1].assetId);
    const saved = Buffer.from(await page.evaluate(async id => [...new Uint8Array(await (await window.__sbProStudy.idbGet("pdf:" + id)).arrayBuffer())], savedId));
    const si = await info(saved), an = si.pages[0].annots.join(" ");
    ok(si.pages[0].annots.filter(a => /^Widget:/.test(a)).length === nq, "the saved PDF has the fields: " + an);
    { const L = require("pdf-lib"), d = await L.PDFDocument.load(saved); const vals = d.getForm().getFields().filter(f => f instanceof L.PDFTextField).map(f => f.getText() || "");
      ok(vals.includes("Ana López"), "what was typed in a new field is in the saved PDF's field: " + JSON.stringify(vals)); }
    ok(/Link:https:\/\/example\.org\/trip/.test(an) && !/example\.edu/.test(an), "the new link is in, the old one out");
    ok(/SAMPLE/.test(si.pages[0].text) && /GRADED/.test(si.pages[0].text), "the watermark and stamps are on the page");
    const imgs = await page.evaluate(async bytes => { const d = await window.pdfjsLib.getDocument({data: new Uint8Array(bytes)}).promise, ops = await (await d.getPage(1)).getOperatorList(); return ops.fnArray.filter(f => f === window.pdfjsLib.OPS.paintImageXObject).length; }, [...saved]);
    ok(imgs === 0, "the picture is gone");

    /* Password */
    if (!(await page.locator('[data-act="pde-dl"]').count())) { await page.click("#pdeBtn"); await page.waitForTimeout(400); }
    await page.click('[data-act="pde-dl"]'); await page.waitForSelector('[data-act="pde-dl-go"]');
    await page.check("#pdeDlPw"); await page.fill("#pdeDlPw1", "trip2026"); await page.fill("#pdeDlPw2", "trip2026");
    await shot("3-password");
    const pwd = await downloadOf(() => page.click('[data-act="pde-dl-go"]'));
    ok(await needsPw(pwd.bytes) && /GRADED/.test((await info(pwd.bytes, "trip2026")).pages[0].text), "a download with a password needs it to open, and opens with it");

    /* Turn In */
    if (await page.locator('[data-act="pde-dl"]').count()) { await page.click("#pdeBtn"); await page.waitForTimeout(300); }
    await page.click('[data-act="pde-dlmenu"]'); await page.click('.pdr-dlmenu [data-act="pde-ti"]'); await page.waitForSelector("#pdeTiTask");
    ok(await page.locator("#pdeTiTask").inputValue() === "t1", "Turn In picks the attached task");
    await page.fill("#pdeTiName", "Worksheet_turnin.pdf");
    const ti = await downloadOf(() => page.click('[data-act="pde-ti-go"]'));
    await page.waitForTimeout(500);
    const tinfo = await info(ti.bytes);
    ok(ti.name === "Worksheet_turnin.pdf" && /Page 1 of 1/.test(tinfo.pages[0].text) && !tinfo.pages[0].annots.some(a => /^Widget/.test(a)), "the turn-in copy has page numbers and is locked");
    ok(await page.evaluate(() => state.tasks.t1.status) === "done", "and the task is marked done");

    /* Ask This PDF */
    await page.click('[data-act="pde-ask"]'); await page.waitForSelector("#pdeAskQ");
    ok(/Google|Gemini/.test(await page.locator(".pde-panel").first().textContent()), "Ask says who gets the question and the matching parts");
    await page.fill("#pdeAskQ", "What does osmosis move?"); await page.press("#pdeAskQ", "Enter");
    await page.waitForSelector(".pde-a .pde-cite", {timeout: 10000});
    ok(/osmosis/.test(await page.locator(".pde-a").first().textContent()) && await page.locator('.pde-cite[data-id="1"]').count() >= 1, "the answer cites its page");
    await shot("4-ask");
    ok(ctx.aiBodies.some(b => /Osmosis moves water/.test(b) && /What does osmosis move/.test(b)), "only the question and the matching passage are sent");
    await page.click('.pde-panel [data-act="pde-panel-close"]').catch(() => {});

    /* Study */
    await page.click('[data-act="pde-st"]'); await page.waitForSelector('[data-act="pde-st-go"]');
    const decks0 = await page.evaluate(() => Object.keys(state.decks).length);
    await page.click('[data-act="pde-st-go"]');
    await page.waitForSelector(".pde-cardprev li", {timeout: 10000});
    await shot("5-cards-preview");
    ok(await page.locator(".pde-cardprev li").count() === 2 && await page.evaluate(() => Object.keys(state.decks).length) === decks0, "the flashcards are shown to check first, before anything is added");
    await page.fill('[data-cp-front="0"]', "Edited front"); await page.uncheck('[data-cp-keep="1"]');
    ok(/Add 1 Card$/.test((await page.textContent("#pdeCpAdd")).trim()), "unticking one updates the Add button");
    await page.check('[data-cp-keep="1"]');
    await page.click('[data-act="pde-st-add"]');
    await page.waitForFunction(() => Object.values(state.decks).some(d => d.cards.length === 2), null, {timeout: 10000});
    const deck = await page.evaluate(() => Object.values(state.decks).find(d => d.cards.length === 2));
    ok(deck.cards[0].front === "Edited front", "a card's wording can be fixed in the preview");
    ok(deck.courseId === "c1" && deck.cards.every(c => c.src && c.src.f === "f1" && c.src.p === 1), "Study makes flashcards in a new deck for the course, each linked to its page");
    await page.click('[data-act="pde-st"]'); await page.waitForSelector('[data-act="pde-st-go"]');
    await page.check('input[name="pdeStMake"][value="outline"]'); await page.click('[data-act="pde-st-go"]');
    await page.waitForFunction(() => Object.values(state.notes).some(n => /The trip/.test(n.text)), null, {timeout: 10000});
    ok(await page.evaluate(() => /\[\[Worksheet(\.pdf)?#p1\]\]/.test(Object.values(state.notes).find(n => /The trip/.test(n.text)).text)), "an outline note links each section to its page");

    /* A PDF with a password */
    await page.evaluate(() => { const d = window.__sbProStudy.dlg(); if (d.open) d.close(); });
    await act("pdr-open", "f2"); await page.waitForSelector("#askIn", {timeout: 15000});
    await page.fill("#askIn", "wrong"); await page.click("#askYes");
    ok(await page.waitForFunction(() => /Didn't Work/.test((document.querySelector("#askDlg[open] h2") || {}).textContent || ""), null, {timeout: 8000}).then(() => true, () => false), "a wrong password asks again");
    await page.fill("#askIn", "open123"); await page.click("#askYes");
    await page.waitForSelector(".pdr-page .textLayer span", {timeout: 15000});
    ok(/Secret reading/.test(await page.locator(".pdr-page .textLayer").first().textContent()), "the right one opens it");
    await page.evaluate(() => { const d = window.__sbProStudy.dlg(); if (d.open) d.close(); });

    /* Convert */
    ok(/Convert/.test(await page.evaluate(() => window.SBPDFT.filesBtns())) && /PDF Batch/.test(await page.evaluate(() => window.SBPDFT.filesBtns())), "Files has Convert and PDF Batch");
    await act("pdt-convert"); await page.waitForSelector("#pdtConv[open]");
    await page.selectOption('#pdtConv [data-pdt="pick"]', "f3"); await page.waitForSelector('#pdtConv input[name="pdtTo"]');
    const docx = await downloadOf(() => page.click('#pdtConv [data-pdt="go"]'));
    ok(docx.name === "Copy of worksheet.docx" && docx.bytes[0] === 0x50 && docx.bytes[1] === 0x4b && docx.bytes.includes(Buffer.from("word/document.xml")), "PDF to Word downloads a .docx");
    await page.check('#pdtConv input[name="pdtTo"][value="png"]');
    const pngs = await downloadOf(() => page.click('#pdtConv [data-pdt="go"]'));
    ok(/p1\.png$/.test(pngs.name) && pngs.bytes.subarray(1, 4).toString() === "PNG", "and a page as a picture");
    // Word to PDF: a small .docx made here
    const wordBytes = (() => {
      const W = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"';
      const body = `<w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>Lab Report</w:t></w:r></w:p><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Bold start </w:t></w:r><w:r><w:t>and the rest of a paragraph about osmosis.</w:t></w:r></w:p><w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr></w:pPr><w:r><w:t>A list item</w:t></w:r></w:p><w:tbl><w:tr><w:tc><w:p><w:r><w:t>Slice</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>Mass</w:t></w:r></w:p></w:tc></w:tr></w:tbl><w:p><w:r><w:br w:type="page"/></w:r></w:p><w:p><w:r><w:t>Second page</w:t></w:r></w:p>`;
      return zipStore([{name: "[Content_Types].xml", data: "<Types/>"}, {name: "word/document.xml", data: `<?xml version="1.0"?><w:document ${W}><w:body>${body}</w:body></w:document>`}]);
    })();
    await page.setInputFiles("#pdtConv [data-pdt-in]", {name: "Lab report.docx", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", buffer: wordBytes});
    await page.waitForSelector('#pdtConv [data-pdt="go"]'); await page.click('#pdtConv [data-pdt="go"]');
    await page.waitForFunction(() => Object.values(state.files).some(f => f.name === "Lab report.pdf"), null, {timeout: 20000});
    const wp = await page.evaluate(async () => { const f = Object.values(state.files).find(f => f.name === "Lab report.pdf"); return [...new Uint8Array(await (await window.__sbProStudy.idbGet("pdf:" + f.revs[0].assetId)).arrayBuffer())]; });
    const wi = await info(Buffer.from(wp));
    ok(wi.pages.length === 2 && /Lab Report/.test(wi.pages[0].text) && /Bold start/.test(wi.pages[0].text) && /Slice/.test(wi.pages[0].text) && /Second page/.test(wi.pages[1].text), "Word to PDF lays out headings, paragraphs, a table and the page break, and adds it to Files");
    // PowerPoint to PDF: one page per slide, at the slide's size
    const R = 'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"', PNS = 'xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"';
    const slide = (title, body) => `<?xml version="1.0"?><p:sld ${PNS} ${R}><p:cSld><p:spTree><p:sp><p:nvSpPr><p:cNvPr id="2" name="T"/><p:cNvSpPr/><p:nvPr><p:ph type="title"/></p:nvPr></p:nvSpPr><p:spPr><a:xfrm><a:off x="457200" y="274638"/><a:ext cx="8229600" cy="1143000"/></a:xfrm></p:spPr><p:txBody><a:p><a:r><a:rPr lang="en-US" b="1"/><a:t>${title}</a:t></a:r></a:p></p:txBody></p:sp><p:sp><p:nvSpPr><p:cNvPr id="3" name="B"/><p:cNvSpPr/><p:nvPr><p:ph idx="1"/></p:nvPr></p:nvSpPr><p:spPr/><p:txBody><a:p><a:r><a:t>${body}</a:t></a:r></a:p></p:txBody></p:sp></p:spTree></p:cSld></p:sld>`;
    const pptBytes = zipStore([{name: "[Content_Types].xml", data: "<Types/>"},
      {name: "ppt/presentation.xml", data: `<?xml version="1.0"?><p:presentation ${PNS} ${R}><p:sldIdLst><p:sldId id="256" r:id="rId2"/><p:sldId id="257" r:id="rId3"/></p:sldIdLst><p:sldSz cx="9144000" cy="6858000"/></p:presentation>`},
      {name: "ppt/_rels/presentation.xml.rels", data: `<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId2" Type="slide" Target="slides/slide1.xml"/><Relationship Id="rId3" Type="slide" Target="slides/slide2.xml"/></Relationships>`},
      {name: "ppt/slides/slide1.xml", data: slide("Cells", "Cells are the unit of life")}, {name: "ppt/slides/slide2.xml", data: slide("Osmosis", "Water moves toward more solute")}]);
    await page.setInputFiles("#pdtConv [data-pdt-in]", {name: "Cells.pptx", mimeType: "application/vnd.openxmlformats-officedocument.presentationml.presentation", buffer: pptBytes});
    await page.waitForSelector('#pdtConv [data-pdt="go"]'); await page.click('#pdtConv [data-pdt="go"]');
    await page.waitForFunction(() => Object.values(state.files).some(f => f.name === "Cells.pdf"), null, {timeout: 20000});
    const pp = await page.evaluate(async () => { const f = Object.values(state.files).find(f => f.name === "Cells.pdf"); return [...new Uint8Array(await (await window.__sbProStudy.idbGet("pdf:" + f.revs[0].assetId)).arrayBuffer())]; });
    const ppi = await info(Buffer.from(pp)), psz = await page.evaluate(async b => { const d = await window.pdfjsLib.getDocument({data: new Uint8Array(b)}).promise, v = (await d.getPage(1)).getViewport({scale: 1}); return [v.width, v.height]; }, pp);
    ok(ppi.pages.length === 2 && /Cells/.test(ppi.pages[0].text) && /unit of life/.test(ppi.pages[0].text) && /Osmosis/.test(ppi.pages[1].text) && Math.round(psz[0]) === 720 && Math.round(psz[1]) === 540, "PowerPoint to PDF: a page per slide, at the slide's size, with its text");
    await shot("5-convert");
    await page.click('#pdtConv [data-pdt="close"]');

    /* PDF Batch */
    await act("pdt-batch"); await page.waitForSelector("#pdtBatch[open]");
    await page.check('[data-pdt-f="f1"]'); await page.check('[data-pdt-f="f3"]');
    await page.selectOption('#pdtBatch [data-pdt="act"]', "wm"); await page.fill('#pdtBatch [data-pdt="wm"]', "COPY");
    await page.click('#pdtBatch [data-pdt="run"]');
    await page.waitForFunction(() => /2 changed/.test(document.getElementById("pdtBatchMsg").textContent), null, {timeout: 30000});
    const revs = await page.evaluate(() => [state.files.f1.revs.length, state.files.f3.revs.length]);
    ok(revs[0] === 3 && revs[1] === 2, "Batch gives each picked PDF a new version");
    const b3 = await page.evaluate(async () => [...new Uint8Array(await (await window.__sbProStudy.idbGet("pdf:" + state.files.f3.revs[1].assetId)).arrayBuffer())]);
    ok(/COPY/.test((await info(Buffer.from(b3))).pages[0].text), "with the watermark on it");
    await shot("6-batch");
    await page.selectOption('#pdtBatch [data-pdt="act"]', "pw"); await page.fill('#pdtBatch [data-pdt="pw1"]', "zip1234"); await page.fill('#pdtBatch [data-pdt="pw2"]', "zip1234");
    const zip = await downloadOf(() => page.click('#pdtBatch [data-pdt="run"]'));
    ok(zip.name === "Protected PDFs.zip" && zip.bytes.includes(Buffer.from("Worksheet.pdf")), "passwords come as a ZIP to download");
    ok(await page.evaluate(() => state.files.f1.revs.length) === 3, "and the copies in Studyboard stay without one");

    ok(errs.length === 0, "no page errors: " + errs.join(" | "));
    console.log(`\n${n} checks passed`);
  } finally { await browser.close(); server.close(); }
})().catch(e => { console.error("FAIL:", e && e.stack || e); process.exit(1); });
