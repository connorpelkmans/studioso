// node tests/pdf-edit-extra.e2e.js   (PDE_SHOTS=<folder> also saves screenshots)
// The PDF tools for handing work in and reading: comments, the Download options (markup, locking, a smaller file), header and page numbers,
// Quick Fill, Recognize Text (with a stand-in AI), Read Aloud, links and contents, comparing versions, and Scan to PDF
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

const DOC = `<html><body style="margin:56px 64px;font-family:Arial;color:#1d1d1f">
<h1 style="font-size:24px">Lab 4: Osmosis</h1>
<p style="font-size:14px">Read the <a href="#method">method</a> first. The full handout is on <a href="https://example.edu/lab4">the course site</a>.</p>
<p style="font-size:14px">Water moves across a membrane toward the side with more solute. Cells in salt water shrink. Cells in fresh water swell.</p>
<p style="font-size:14px">Student name: ____________________</p>
<h2 id="results" style="font-size:18px;margin-top:40px">Results</h2><p style="font-size:14px">Record the mass of each potato slice.</p>
<div style="height:1100px"></div>
<h2 id="method" style="font-size:18px">Method</h2><p style="font-size:14px">Cut five slices and weigh each one.</p></body></html>`;

(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  try {
    // the lab handout (Chrome writes its links and, with outline, its contents)
    const maker = await browser.newPage({viewport: {width: 900, height: 1100}});
    await maker.setContent(DOC); const lab = await maker.pdf({format: "Letter", outline: true, tagged: true});
    const lab2 = await (async () => { await maker.setContent(DOC.replace("toward the side with more solute", "toward the side with less water").replace("Cut five slices", "Cut six slices")); return maker.pdf({format: "Letter", outline: true, tagged: true}); })();
    // a "scanned" page: a picture of text, no text in the PDF
    // (a real scan: a big, high-quality JPEG with paper texture)
    const scanner = await browser.newPage({viewport: {width: 850, height: 1100}, deviceScaleFactor: 2.2});
    await scanner.setContent(`<html><body style="margin:0;background:repeating-radial-gradient(circle at 30% 20%,#fbfaf6 0 2px,#f1eee6 2px 5px)"><div style="padding:80px 90px;font:28px Georgia">Chapter 4: The Cell<br><br>Mitochondria make most of the cell's energy.</div></body></html>`);
    const shotJpg = await scanner.screenshot({type: "jpeg", quality: 100, clip: {x: 0, y: 0, width: 850, height: 1100}}); await scanner.close();
    // a photo of a page on a desk: dark around, white paper a little turned
    await maker.setContent(`<html><body style="margin:0;background:#3b3026;width:900px;height:1200px"><div style="position:absolute;left:150px;top:160px;width:600px;height:820px;background:#f4f2ec;transform:rotate(4deg);font:30px Georgia;padding:60px;box-sizing:border-box">Homework 3<br><br>1. Osmosis moves water.</div></body></html>`);
    const photo = await maker.screenshot({clip: {x: 0, y: 0, width: 900, height: 1200}});
    await maker.close();
    const scanPdf = await (async () => { const d = await L.PDFDocument.create(); const img = await d.embedJpg(shotJpg); d.addPage([612, 792]).drawImage(img, {x: 0, y: 0, width: 612, height: 792}); return Buffer.from(await d.save()); })();
    const formPdf = await (async () => { const d = await L.PDFDocument.create(), pg = d.addPage([612, 792]), f = await d.embedFont(L.StandardFonts.Helvetica), fm = d.getForm(); pg.drawText("Student name:", {x: 72, y: 700, size: 12, font: f}); fm.createTextField("student_name").addToPage(pg, {x: 170, y: 692, width: 250, height: 22}); pg.drawText("Date:", {x: 72, y: 660, size: 12, font: f}); fm.createTextField("date").addToPage(pg, {x: 170, y: 652, width: 150, height: 22}); return Buffer.from(await d.save()); })();
    const rev = (id, name, size, at) => ({assetId: id, name, size, type: "application/pdf", at: at || 1});
    const seed = {v: 2, updated: 1, decks: [], notes: [], tasks: [], settings: {}, courses: [{id: "c1", name: "Biology", code: "BIO101", color: "#3B6FE0"}],
      files: [{id: "f1", name: "Lab 4.pdf", courseId: "c1", folderId: "other", kind: "file", taskIds: [], desc: "", url: "", revs: [rev("a-lab1", "Lab 4.pdf", lab2.length, 1), rev("a-lab", "Lab 4.pdf", lab.length, 2)]},
        {id: "f2", name: "Chapter 4 scan.pdf", courseId: "c1", folderId: "other", kind: "file", taskIds: [], desc: "", url: "", revs: [rev("a-scan", "Chapter 4 scan.pdf", scanPdf.length)]},
        {id: "f3", name: "Sign-up form.pdf", courseId: "c1", folderId: "other", kind: "file", taskIds: [], desc: "", url: "", revs: [rev("a-form", "Sign-up form.pdf", formPdf.length)]}]};
    const ctx = await browser.newContext({viewport: {width: 1280, height: 900}, serviceWorkers: "block", acceptDownloads: true});
    ctx.aiBodies = [];
    await ctx.route(/generativelanguage\.googleapis\.com/, async route => {
      const body = route.request().postData() || ""; ctx.aiBodies.push(body);
      const reply = {lines: [{text: "Chapter 4: The Cell", box: [120, 70, 560, 105]}, {text: "Mitochondria make most of the cell's energy.", box: [120, 150, 900, 185]}]};
      route.fulfill({status: 200, contentType: "application/json", body: JSON.stringify({candidates: [{content: {parts: [{text: JSON.stringify(reply)}]}, finishReason: "STOP"}]})});
    });
    await ctx.addInitScript(seed => {
      try { if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("coursework:v2", JSON.stringify(seed)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("studyboard:tour", "1");
        localStorage.setItem("studyboard:aiKeys", JSON.stringify({gemini: "AIzaTESTTESTTESTTESTTESTTEST12345"})); localStorage.setItem("studyboard:aiConsent", JSON.stringify({gemini: {v: 1, at: 1}})); } } catch (e) {}
      // a stand-in voice that says each sentence at once
      window.__said = [];
      const fake = {speaking: false, paused: false, cancel(){}, pause(){}, resume(){}, getVoices: () => [{name: "Test Voice", lang: "en-US", voiceURI: "test", default: true}],
        speak(u){ window.__said.push(u.text); setTimeout(() => u.onend && u.onend(), 350); }};
      Object.defineProperty(window, "speechSynthesis", {value: fake, configurable: true}); window.SpeechSynthesisUtterance = function(t){ this.text = t; };
    }, seed);
    const page = await ctx.newPage(); const errs = [];
    page.on("pageerror", e => errs.push(e.message)); page.on("console", m => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errs.push(m.text()); });
    await page.goto(base); await page.waitForSelector("#view", {state: "attached"}); await page.waitForFunction(() => window.__sbProStudy);
    await page.evaluate(() => { const T = window.__sbProStudy; Object.defineProperty(window, "state", {get: () => T.state(), configurable: true}); });
    await page.waitForTimeout(500);
    const shot = async name => { if (SHOTS) { fs.mkdirSync(SHOTS, {recursive: true}); await page.screenshot({path: path.join(SHOTS, name + ".png")}); } };
    const tool = async id => { if (await page.locator(`.pde-tools > .pde-tool[data-id="${id}"]`).count()) await page.click(`.pde-tools > .pde-tool[data-id="${id}"]`); else { await page.click('[data-act="pde-more"]'); await page.click(`.pde-mi[data-id="${id}"]`); } await page.waitForTimeout(200); };
    await page.evaluate(async files => { for (const [k, b] of files) await window.__sbProStudy.idbSet("pdf:" + k, new Blob([new Uint8Array(b)])); }, [["a-lab", [...lab]], ["a-lab1", [...lab2]], ["a-scan", [...scanPdf]], ["a-form", [...formPdf]]]);
    // file storage: a stand-in that keeps uploads (and the reader's copy) on this device
    const fakeStore = () => page.evaluate(() => { window.__ups = []; window.__sbProStudy.caps.assets = {upload: async (file, o) => { const id = "up-" + (window.__ups.length + 1), b = new Uint8Array(await file.arrayBuffer()); window.__ups.push({id, name: file.name, size: b.length}); await window.__sbProStudy.idbSet("pdf:" + id, new Blob([b])); return {id, sizeBytes: b.length, contentType: o.type}; }}; });
    await fakeStore();
    const open = async fid => { await page.evaluate(() => { const d = window.__sbProStudy.dlg(); if (d.open) d.close(); }); await page.evaluate(fid => { const b = document.createElement("button"); b.dataset.act = "pdr-open"; b.dataset.id = fid; document.body.appendChild(b); b.click(); b.remove(); }, fid); await page.waitForSelector(".pdr-page .pdr-cv", {timeout: 15000}); await page.waitForTimeout(600); };
    const wordAt = word => page.evaluate(word => {
      const span = [...document.querySelectorAll(".pdr-page .textLayer span")].find(s => !s.children.length && s.textContent.includes(word)); if (!span) return null;
      const tn = span.firstChild, i = tn.textContent.indexOf(word), r = document.createRange(); r.setStart(tn, i); r.setEnd(tn, i + word.length);
      const b = r.getBoundingClientRect(); return {x: b.left + b.width / 2, y: b.top + b.height / 2, l: b.left, r: b.right, t: b.top, b: b.bottom};
    }, word);
    const select = word => page.evaluate(word => {
      const span = [...document.querySelectorAll(".pdr-page .textLayer span")].find(s => !s.children.length && s.textContent.includes(word)), tn = span.firstChild, r = document.createRange(), i = tn.textContent.indexOf(word);
      r.setStart(tn, i); r.setEnd(tn, i + word.length); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r);
      span.dispatchEvent(new MouseEvent("mousedown", {bubbles: true})); span.dispatchEvent(new MouseEvent("mouseup", {bubbles: true}));
    }, word);
    const hl = fid => page.evaluate(fid => state.files[fid].hl || [], fid);
    const download = async opts => {
      await page.click('[data-act="pde-dl"]'); await page.waitForSelector('[data-act="pde-dl-go"]');
      if (await page.locator("#pdeDlMarks").count()) await page.setChecked("#pdeDlMarks", !!opts.marks);
      await page.setChecked("#pdeDlFlat", !!opts.flat); await page.selectOption("#pdeDlSize", String(opts.size || 0));
      const [dl] = await Promise.all([page.waitForEvent("download", {timeout: 30000}), page.click('[data-act="pde-dl-go"]')]);
      return fs.readFileSync(await dl.path());
    };
    const pdfInfo = bytes => page.evaluate(async bytes => {
      const doc = await window.pdfjsLib.getDocument({data: new Uint8Array(bytes), disableFontFace: true, isEvalSupported: false}).promise, out = [];
      for (let p = 1; p <= doc.numPages; p++) { const pg = await doc.getPage(p); out.push({text: (await pg.getTextContent()).items.map(i => i.str).join(" "), annots: (await pg.getAnnotations()).map(a => a.subtype + (a.fieldName ? ":" + a.fieldName + "=" + JSON.stringify(a.fieldValue) : ""))}); }
      return out;
    }, [...bytes]);

    /* Comments */
    await open("f1");
    await select("toward the side"); await page.waitForTimeout(200);
    ok(await page.locator('.pdr-pop [data-act="pdr-mk-add"]').count() === 2, "selecting text offers underline and strike-through");
    await page.click('.pdr-pop [data-act="pdr-mk-add"][data-id="u"]'); await page.waitForTimeout(200);
    await select("shrink"); await page.waitForTimeout(200);
    await page.click('.pdr-pop [data-act="pdr-mk-add"][data-id="s"]'); await page.waitForTimeout(200);
    await select("swell"); await page.waitForTimeout(200);
    await page.click('.pdr-pop [data-act="pdr-sel-cm"]'); await page.waitForSelector("#pdrCm");
    await page.fill("#pdrCm", "Is this true for plant cells too?"); await page.click('.pdr-cmf button[type="submit"]'); await page.waitForTimeout(200);
    await page.click('[data-act="pdr-mode"][data-id="mark"]'); await page.click("#pdrCmBtn");
    const nm = await wordAt("Student name");
    await page.mouse.click(nm.r + 260, nm.y); await page.waitForSelector("#pdrCm");
    await page.fill("#pdrCm", "Write it neatly"); await page.keyboard.press("Control+Enter"); await page.waitForTimeout(250);
    let h1 = await hl("f1");
    ok(h1.some(h => h.m === "u" && /toward the side/.test(h.t)) && h1.some(h => h.m === "s") && h1.some(h => !h.m && h.cm === "Is this true for plant cells too?") && h1.some(h => h.m === "n" && h.cm === "Write it neatly"), "underline, strike-through, a comment on a highlight and a sticky note");
    ok(await page.locator(".pdr-hl i.m-u").count() >= 1 && await page.locator(".pdr-hl i.m-s").count() >= 1 && await page.locator(".pdr-note").count() === 1, "they're drawn on the page");
    await page.click("#pdrSideBtn"); await page.waitForTimeout(200);
    ok(/Write it neatly/.test(await page.locator(".pdr-side").textContent()) && /Strike-Through/.test(await page.locator(".pdr-side").textContent()), "the side panel lists them with their comments");
    await shot("1-comments");
    await page.click("#pdrSideBtn");

    /* Links and contents */
    ok(await page.locator(".pde-links .pde-link").count() >= 2, "the PDF's links can be clicked");
    ok(await page.locator('.pde-links a.pde-link[href="https://example.edu/lab4"][target="_blank"][rel~="noopener"]').count() === 1, "a web link opens in a new tab, safely");
    await page.locator('.pde-links button.pde-link').first().click(); await page.waitForTimeout(800);
    ok(await page.evaluate(() => window.__sbProStudy.reader().cur) === 2, "a link to a place in the PDF goes there");
    await page.click('[data-act="pdr-mode"][data-id="read"]'); await page.waitForSelector("#pdeTocBtn:not([hidden])", {timeout: 5000});
    await page.click("#pdeTocBtn"); await page.waitForSelector(".pde-toc-item");
    ok(/Results/.test(await page.locator(".pde-toc").first().textContent()) && /Method/.test(await page.locator(".pde-toc").first().textContent()), "Contents lists the PDF's own headings");
    await page.locator(".pde-toc-item", {hasText: "Results"}).click(); await page.waitForTimeout(700);
    ok(await page.evaluate(() => window.__sbProStudy.reader().cur) === 1, "and goes to them");

    /* Read aloud */
    await page.click("#pdeSayBtn"); await page.waitForFunction(() => window.__said.some(t => /shrink/.test(t)), null, {timeout: 8000});
    const said = await page.evaluate(() => window.__said.join(" | "));
    ok(/^Lab 4: Osmosis \| Read the method first\. \| The full handout is on the course site\. \|/.test(said) && /Cells in salt water shrink\./.test(said), "Listen reads the page a sentence at a time, the heading on its own: " + said.slice(0, 120));
    ok(await page.locator(".pde-saybar").count() === 1, "with play, pause, skip and speed controls");
    await page.waitForSelector(".pde-saybox", {timeout: 3000}).catch(() => {});
    ok(await page.locator(".pde-saybox").count() >= 1, "the sentence being read is marked on the page");
    await shot("2-listen");
    await page.click('[data-act="pde-say-stop"]'); await page.waitForTimeout(150);
    ok(await page.locator(".pde-saybar").count() === 0 && await page.locator(".pde-saybox").count() === 0, "Stop ends it");

    /* Compare versions */
    await page.click('[data-act="pde-cmp"]'); await page.waitForSelector('[data-act="pde-cmp-go"]');
    await page.click('[data-act="pde-cmp-go"]'); await page.waitForSelector(".pde-diff li", {timeout: 15000});
    const diffText = await page.locator(".pde-diff").textContent();
    ok(/2 changes/.test(await page.locator("#pdeCmpOut").textContent()) && await page.locator(".pde-diff ins", {hasText: "more solute."}).count() === 1 && await page.locator(".pde-diff del", {hasText: "less water."}).count() === 1, "Compare shows what changed between versions, word by word: " + diffText.slice(0, 120));
    await shot("3-compare");
    await page.click('[data-act="pde-panel-close"]');

    /* Header, page numbers, Quick Fill, and the Download options */
    await page.click("#pdeBtn"); await page.waitForFunction(() => !!window.PDFLib);
    await tool("fill");
    ok(/Add your details first/.test(await page.locator("#pdeMsg").textContent()), "Quick Fill asks for your details first");
    await page.click('[data-act="pde-me"]'); await page.fill("#pdeMeName", "Ana López"); await page.fill("#pdeMeId", "2026-0417"); await page.click('[data-act="pde-me-save"]'); await page.waitForTimeout(200);
    await page.click('[data-act="pde-chip"][data-id="name"]');
    const blank = await wordAt("Student name");
    await page.mouse.click(blank.r + 14, blank.y + 4); await page.waitForTimeout(300);
    let es = await page.evaluate(() => state.files.f1.pe || []);
    ok(es.some(e => e.k === "n" && e.t === "Ana López"), "a detail goes where you click");
    await tool("header");
    await page.click('[data-act="pde-hd-ins"][data-id="Ana López"]'); await page.click('[data-act="pde-hd-ins"][data-id="BIO101"]').catch(async () => { await page.locator('[data-act="pde-hd-ins"]').nth(2).click(); });
    await page.selectOption("#pdeHdNum", "bc"); await page.selectOption("#pdeHdFmt", "pnn"); await page.waitForTimeout(250);
    es = await page.evaluate(() => state.files.f1.pe || []);
    const hd = es.find(e => e.k === "h");
    ok(hd && /Ana López/.test(hd.text) && hd.num === "bc" && hd.fmt === "pnn", "Header: your name and class, and page numbers");
    ok(await page.locator(".pde-hd").count() >= 2, "shown on the pages as you set them");
    await page.click('[data-act="pde-panel-close"]');
    await shot("4-header");
    const out1 = await download({marks: true});
    const i1 = await pdfInfo(out1);
    ok(/Ana López/.test(i1[0].text) && /Page 1 of 2/.test(i1[0].text) && /Page 2 of 2/.test(i1[1].text), "the download has the header and page numbers on every page");
    ok(["Underline", "StrikeOut", "Highlight", "Text"].every(k => i1[0].annots.includes(k)), "and the comments as standard PDF comments: " + i1[0].annots.join(","));
    const out2 = await download({marks: true, flat: true});
    ok(!(await pdfInfo(out2))[0].annots.filter(a => a !== "Link").length, "Lock: the markup becomes part of the page (links still work)");

    /* Quick Fill for a form, then a locked copy */
    await open("f3"); await page.click("#pdeBtn"); await page.waitForTimeout(400);
    await tool("fill"); await page.click('[data-act="pde-fill-fields"]'); await page.waitForTimeout(400);
    ok(await page.inputValue('.pde-field[data-f="student_name"]') === "Ana López" && /\d{4}/.test(await page.inputValue('.pde-field[data-f="date"]')), "Fill Matching Fields puts your name and today's date into the form");
    const fl = await pdfInfo(await download({flat: true}));
    ok(!fl[0].annots.length && /Ana López/.test(fl[0].text), "a locked copy: the answers are part of the page, not fields anyone can change");

    /* A smaller file */
    await open("f2"); await page.click("#pdeBtn"); await page.waitForTimeout(300);
    const small = await download({size: 100});
    ok(small.length < scanPdf.length * 0.7, `Smallest makes a scan smaller (${scanPdf.length} to ${small.length} bytes)`);

    /* Recognize Text */
    await page.mouse.click(400, 400); await page.waitForTimeout(300);
    await tool("ocr"); await page.waitForSelector('[data-act="pde-ocr-go"]');
    const note = await page.locator(".pde-ai-note").textContent();
    ok(/pictures of your pages are sent to Google/.test(note) && /Nothing else from this file is sent/.test(note), "before anything is sent, it says pictures of the pages go to Google, and nothing else");
    // (the app's companion may chat with the AI on its own; only requests with a page in them count here)
    const ocrBodies = () => ctx.aiBodies.filter(b => /Read its text|inline_data/.test(b));
    ok(ocrBodies().length === 0, "no page has been sent yet");
    await shot("5-recognize");
    await page.click('[data-act="pde-ocr-go"]');
    await page.waitForFunction(() => state.files.f2.revs.length === 2, null, {timeout: 30000});
    ok(ocrBodies().length === 1 && /inline_data/.test(ocrBodies()[0]) && /image\/jpeg/.test(ocrBodies()[0]), "one page picture was sent, after you chose to");
    await page.waitForSelector(".pdr-page .textLayer span", {timeout: 15000}); await page.waitForTimeout(400);
    ok(/Mitochondria make most of the cell's energy/.test(await page.locator(".pdr-page .textLayer").first().textContent()), "the new version has real text: it can be searched, selected and highlighted");

    /* Scan to PDF (from Files) */
    await page.evaluate(() => { const d = window.__sbProStudy.dlg(); if (d.open) d.close(); window.__sbProStudy.ui.tab = "files"; window.__sbProStudy.render(); });
    await page.waitForSelector('[data-act="pde-scan"]', {timeout: 5000});
    await page.click('[data-act="pde-scan"]'); await page.waitForSelector("#pdeScanDlg[open]");
    await page.setInputFiles("#pdeScanDlg input[data-scan-in]:not([capture])", {name: "hw3.png", mimeType: "image/png", buffer: photo});
    await page.waitForSelector(".pde-scanlist li img[src^='data:']", {timeout: 15000});
    const q = await page.evaluate(() => null);
    void q;
    await page.click('[data-scan="crop"][data-i="0"]'); await page.waitForSelector(".pde-cropbox");
    const corners = await page.evaluate(() => [...document.querySelectorAll(".pde-corner")].map(c => [parseFloat(c.style.left), parseFloat(c.style.top)]));
    ok(corners[0][0] > 10 && corners[0][1] > 8 && corners[2][0] < 90 && corners[2][1] < 92, "the page's corners are found in the photo: " + JSON.stringify(corners.map(c => c.map(Math.round))));
    await shot("6-scan-corners");
    await page.focus(".pde-corner"); await page.keyboard.press("Escape"); await page.waitForSelector('[data-scan="make"]');
    ok(await page.locator("#pdeScanDlg[open] .pde-scanlist li").count() === 1, "Esc in the corners view is Done: the scan and its page stay");
    await page.click('#pdeScanDlg .sheet-foot [data-scan="close"]'); await page.waitForSelector("#askDlg[open]");
    await page.click("#askNo"); await page.waitForTimeout(200);
    ok(await page.locator("#pdeScanDlg[open] .pde-scanlist li").count() === 1, "Cancel with pages asks first; Keep Scanning keeps them");
    await shot("7-scan");
    const before = await page.evaluate(() => Object.keys(state.files).length);
    await page.click('[data-scan="make"]');
    await page.waitForFunction(n => Object.keys(state.files).length === n + 1, before, {timeout: 20000});
    const nf = await page.evaluate(() => Object.values(state.files).sort((a, b) => (b.created || 0) - (a.created || 0))[0]);
    ok(/^Scan .*\.pdf$/.test(nf.name) && nf.revs.length === 1 && nf.courseId === "", "Make PDF adds it to Files");

    ok(errs.length === 0, "no page errors: " + errs.join(" | "));
    console.log(`\n${n} checks passed`);
  } finally { await browser.close(); server.close(); }
})().catch(e => { console.error("FAIL:", e && e.stack || e); server.close(); process.exit(1); });
