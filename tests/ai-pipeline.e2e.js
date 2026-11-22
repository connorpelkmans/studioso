// node tests/ai-pipeline.e2e.js: the study set pipeline in the real app (01-ai-sections.js + aiMakeStudySet in 01-ai.js).
// A real 3-page PDF, made here with pdf-lib, is read on the device (lines, font sizes, running header and page numbers left out),
// split at its headings, and each section goes to the AI as its own short request; the cards come back checked, with repeats
// across sections removed and each card labelled with its section. Short notes still go as one request, exactly as before.
// The AI is stood in for; every request it gets is checked.
const {chromium, executablePath} = require("./pw");
const path = require("path"), fs = require("fs"), http = require("http"), vm = require("vm");
const ROOT = path.join(__dirname, ".."), SHOTS = path.join(ROOT, "tests-out");
const MIME = {".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".css": "text/css", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".png": "image/png", ".webp": "image/webp", ".wasm": "application/wasm"};
const server = http.createServer((req, res) => {
  let f; try { f = path.join(ROOT, decodeURIComponent(new URL(req.url, "http://x").pathname)); } catch (e) { res.writeHead(400); res.end(); return; }
  if (!f.startsWith(ROOT + path.sep) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
let fails = 0, n = 0; const ok = (c, m) => { n++; console.log((c ? "ok   " : "FAIL ") + m); if (!c) fails++; };

// The test PDF: three topics, each a big bold heading over body text, with a running header and page numbers
const TOPICS = [["Glycolysis", "glucose pyruvate cytoplasm"], ["Krebs Cycle", "citrate oxaloacetate matrix"], ["Electron Transport Chain", "cristae oxygen gradient"]];
const body = (topic, keys) => Array.from({length: 20}, (_, i) => `${topic} point ${i + 1} explains how ${keys.split(" ")[i % 3]} matters in cellular respiration and why students should understand this step for the exam.`).join(" ");
async function makePdf(){
  const ctx = {console}; ctx.self = ctx; ctx.window = ctx; ctx.globalThis = ctx; vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(ROOT, "vendor", "pdflib", "pdf-lib.min.js"), "utf8"), ctx);
  const {PDFDocument, StandardFonts} = ctx.PDFLib, doc = await PDFDocument.create(), reg = await doc.embedFont(StandardFonts.Helvetica), bold = await doc.embedFont(StandardFonts.HelveticaBold);
  TOPICS.forEach(([title, keys], k) => {
    const p = doc.addPage(); p.setSize(612, 792); let y = 760;
    p.drawText("BIO 110 Lecture Notes", {x: 50, y, size: 9, font: reg}); y -= 40;
    p.drawText(title, {x: 50, y, size: 22, font: bold}); y -= 34;
    const words = body(title, keys).split(" "); let line = "";
    words.forEach(w => { if ((line + " " + w).length > 88) { p.drawText(line.trim(), {x: 50, y, size: 11, font: reg}); y -= 16; line = ""; } line += " " + w; });
    if (line.trim()) p.drawText(line.trim(), {x: 50, y, size: 11, font: reg});
    p.drawText(String(k + 1), {x: 300, y: 30, size: 9, font: reg});
  });
  return Buffer.from(await doc.save());
}

// A small PNG, drawn here: coloured blocks (a "diagram") or a plain square (a "logo")
function png(w, h, paint){
  const zlib = require("zlib"), raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) { raw[y * (w * 3 + 1)] = 0; for (let x = 0; x < w; x++) { const [r, g, b] = paint(x, y); const o = y * (w * 3 + 1) + 1 + x * 3; raw[o] = r; raw[o + 1] = g; raw[o + 2] = b; } }
  const crc = buf => { let c, t = []; for (let n = 0; n < 256; n++) { c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } let x = 0xffffffff; for (const v of buf) x = t[(x ^ v) & 0xff] ^ (x >>> 8); return (x ^ 0xffffffff) >>> 0; };
  const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}
async function makeFigurePdf(){
  const ctx = {console}; ctx.self = ctx; ctx.window = ctx; ctx.globalThis = ctx; vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(ROOT, "vendor", "pdflib", "pdf-lib.min.js"), "utf8"), ctx);
  const U8 = vm.runInContext("Uint8Array", ctx), bytes = b => new U8(b);
  const {PDFDocument, StandardFonts} = ctx.PDFLib, doc = await PDFDocument.create(), reg = await doc.embedFont(StandardFonts.Helvetica), bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const logo = await doc.embedPng(bytes(png(40, 40, () => [200, 30, 40])));
  const diagram = await doc.embedPng(bytes(png(320, 220, (x, y) => x < 150 ? [60, 120, 220] : y < 110 ? [240, 180, 40] : [40, 170, 110])));
  const textPage = (title, keys, fig) => {
    const p = doc.addPage(); p.setSize(612, 792); let y = 740;
    p.drawImage(logo, {x: 540, y: 740, width: 36, height: 36});
    p.drawText(title, {x: 50, y, size: 22, font: bold}); y -= 34;
    const words = body(title, keys).split(" "); let line = "";
    words.forEach(w => { if ((line + " " + w).length > 88) { p.drawText(line.trim(), {x: 50, y, size: 11, font: reg}); y -= 16; line = ""; } line += " " + w; });
    if (line.trim()) { p.drawText(line.trim(), {x: 50, y, size: 11, font: reg}); y -= 16; }
    if (fig) p.drawImage(diagram, {x: 90, y: 40, width: 420, height: 290});
  };
  textPage("Glycolysis", "glucose pyruvate cytoplasm", false);
  textPage("Krebs Cycle", "citrate oxaloacetate matrix", true);
  textPage("Electron Transport Chain", "cristae oxygen gradient", false);
  // a diagram on a page of its own, after the topic it belongs to
  const p4 = doc.addPage(); p4.setSize(612, 792); p4.drawImage(logo, {x: 540, y: 740, width: 36, height: 36}); p4.drawImage(diagram, {x: 60, y: 200, width: 480, height: 330});
  return Buffer.from(await doc.save());
}

(async () => {
  const pdf = await makePdf(); fs.writeFileSync(path.join(SHOTS, "pipeline-figures.pdf"), await makeFigurePdf()); fs.writeFileSync(path.join(SHOTS, "pipeline-test.pdf"), pdf);
  await new Promise(r => server.listen(0, "127.0.0.1", r));
  const port = server.address().port, b = await chromium.launch({executablePath});
  const run = async ({file, paste, quiz, cardN}) => {
    // quiz: true or false; the sheet's own default is left alone when undefined
    const ctx = await b.newContext({viewport: {width: 1100, height: 900}, serviceWorkers: "block"}), sent = [];
    await ctx.route(/generativelanguage\.googleapis\.com/, async route => {
      let bodyJ = {}; try { bodyJ = JSON.parse(route.request().postData() || "{}"); } catch (e) {}
      const text = JSON.stringify(bodyJ), part = /Part (\d+) of (\d+) of the material: ([^\\\n"]*)/.exec(text);
      sent.push({text, part: part ? {i: Number(part[1]), n: Number(part[2]), label: part[3]} : null});
      const topic = part ? part[3].split(" › ").pop() : "the notes";
      let out;
      if (/practice question/.test(text)) out = {title: "Respiration Quiz", questions: [0, 1].map(k => ({type: "single", stem: `In ${topic}, which statement ${k ? "best describes the role of the main step" : "is true about where it happens"}?`, options: ["Option one about " + topic, "Option two", "Option three", "Option four"], correct: [0], rationale: `The ${topic} part says so.`, optionNotes: ["Right.", "No.", "No.", "No."], topic}))};
      else {
        // a model that does what it's asked: the number of cards requested, one of them repeated in every section
        const want = Number((/Make exactly (\d+) flashcard/.exec(text) || [])[1]) || 3, thin = route.request().url().includes("thin") || (globalThis.__thinOnce && part && /Krebs/.test(part[3]) && !/too few usable/.test(text));
        const qs = ["What is the main job of", "Where does it happen in", "What goes into", "What comes out of", "Which enzyme drives", "Why does it matter for", "What controls", "How fast is"];
        out = {deckTitle: "Cellular Respiration", cards: thin ? [{front: "x", back: ""}] : [{front: "What molecule stores energy for the cell?", back: "ATP, the energy currency of the cell."}].concat(
          Array.from({length: Math.max(0, want - 1)}, (_, k) => ({front: `${qs[k % qs.length]} ${topic}${k >= qs.length ? " (" + k + ")" : ""}?`,
            back: `${topic} ${["breaks glucose into two pyruvate and nets 2 ATP", "happens in a specific compartment of the cell", "takes in its starting molecule and electron carriers", "releases carbon dioxide and loads NADH", "is driven by its key enzymes", "supplies the energy the cell runs on"][k % 6]}.`}))).concat(
          // a lazy card that only points to the notes: must never reach the student
          [{front: `Summarize ${topic}.`, back: `The ${topic} part of the notes explains this for this stage of respiration.`}])};
      }
      await route.fulfill({status: 200, contentType: "application/json", body: JSON.stringify({candidates: [{content: {parts: [{text: JSON.stringify(out)}]}, finishReason: "STOP"}]})});
    });
    await ctx.addInitScript(() => { window.__SB_TEST = true; localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "done"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studyboard:whatsNew", JSON.stringify({v: "1.15.8"}));
      localStorage.setItem("coursework:v2", JSON.stringify({v: 2, updated: 1, tasks: [], files: [], notes: [], events: [], decks: [], settings: {}, courses: [{id: "c1", name: "Biology", code: "BIO 110", color: "#3B6FE0"}]}));
      localStorage.setItem("studyboard:aiKeys", JSON.stringify({gemini: "AIzaTESTTESTTESTTESTTESTTEST12345"})); localStorage.setItem("studyboard:aiConsent", JSON.stringify({gemini: {v: 1, at: 1}})); });
    const p = await ctx.newPage(); p.errs = []; p.on("pageerror", e => p.errs.push(e.message));
    await p.goto(`http://127.0.0.1:${port}/index.html`); await p.waitForFunction(() => window.__sbSync && window.SBSECT, null, {timeout: 20000}); await p.waitForTimeout(400);
    await p.evaluate(() => { const S = window.__sbSync; S.ui.filter = "c1"; S.ui.tab = "flashcards"; S.render(); const x = document.createElement("button"); x.dataset.act = "fc-ai"; document.body.appendChild(x); x.click(); x.remove(); });
    await p.waitForSelector("#dlg[open] #aiGo");
    if (file) { await p.setInputFiles("#aiFile", file); await p.waitForTimeout(800); }
    if (paste) await p.evaluate(t => { const d = document.querySelector("#dlg details"); if (d) d.open = true; const a = document.querySelector("#aiPaste"); a.value = t; a.dispatchEvent(new Event("input", {bubbles: true})); }, paste);
    if (quiz != null) await p.evaluate(want => { const q = document.querySelector("#aiQuiz"); if (q && q.checked !== want) q.click(); }, quiz);
    if (cardN) await p.evaluate(v => { const r = document.querySelector(`input[name=aiCardN][value="${v}"]`); if (r) r.click(); }, String(cardN));
    await p.click("#aiGo");
    await p.waitForSelector(".ai-live-bar.done, #toast.show.toast-err", {timeout: 30000}).catch(() => {});
    const cards = await p.evaluate(() => { const d = Object.values(window.__sbSync.state.decks).sort((a, b) => (b.updated || 0) - (a.updated || 0))[0] || {cards: [], aiQuizzes: []}; return d.cards.map(c => ({front: c.front, src: c.front + "\n" + c.back + "\n" + (c.src || "")})); });
    return {ctx, p, sent, cards};
  };

  // 1. A 3-page PDF: read on the device, one request per section
  { const R = await run({file: path.join(SHOTS, "pipeline-test.pdf"), cardN: 10, quiz: false});
    const parts = R.sent.filter(x => x.part);
    ok(parts.length === 3 && R.sent.length === 3, "one request per section, three in all: " + R.sent.length);
    const labels = parts.map(x => x.part.label.split(" › ").pop()).sort();
    ok(JSON.stringify(labels) === JSON.stringify(["Electron Transport Chain", "Glycolysis", "Krebs Cycle"]), "the sections are the PDF's headings, found by font size: " + labels.join(", "));
    const g = parts.find(x => /Glycolysis$/.test(x.part.label));
    ok(g && /pyruvate/.test(g.text) && !/oxaloacetate|cristae/.test(g.text), "each request has only its own section's text");
    ok(!R.sent.some(x => /BIO 110 Lecture Notes/.test(x.text)), "the running header is left out");
    ok(!R.sent.some(x => /"inline_data"/.test(x.text)), "the PDF itself isn't sent: its text was read on this device");
    const asked = R.sent.reduce((n, x) => n + Number((/Make exactly (\d+) flashcard/.exec(x.text) || [])[1] || 0), 0);
    ok(asked === 10, "the 10 cards asked for are shared across the sections: " + R.sent.map(x => (/Make exactly (\d+)/.exec(x.text) || [])[1]).join("+"));
    ok(R.cards.length === 8, "10 cards, less the 2 repeats of the card every section wrote (kept once): " + R.cards.length);
    ok(!R.cards.some(c => /notes explains|Summarize/.test(c.src)), "cards whose back only points to the notes are left out");
    ok(/pointed to your notes instead of giving the answer/.test(await R.p.evaluate(() => (document.querySelector(".ai-live-bar") || {}).innerText || "")), "and the finished set's note says so");
    ok(R.cards.every(c => /Glycolysis|Krebs Cycle|Electron Transport Chain/.test(c.src)), "each card says which section it came from");
    ok(R.cards.filter(c => /stores energy/.test(c.front)).length === 1, "the repeat is gone");
    await R.p.screenshot({path: path.join(SHOTS, "pipeline-review.png")});
    ok(!R.p.errs.length, "no page errors: " + R.p.errs.join(" | "));
    await R.ctx.close(); }

  // 1b. A PDF with figures: only the pages with real figures go as pictures, each with its own section; the logo never does
  { const R = await run({file: path.join(SHOTS, "pipeline-figures.pdf"), cardN: 10, quiz: false});
    const by = t => R.sent.find(x => x.part && x.part.label.split(" › ").pop() === t), imgs = x => (x.text.match(/"inline_data"/g) || []).length;
    const g = by("Glycolysis"), k = by("Krebs Cycle"), e = by("Electron Transport Chain");
    ok(g && k && e && R.sent.length === 3, "three sections, one request each: " + R.sent.length);
    ok(imgs(g) === 0, "Glycolysis (text only, plus the logo) gets no picture");
    ok(imgs(k) === 1 && /Page 2 of the material \(a figure in this part\)/.test(k.text), "Krebs Cycle gets the picture of its own page, page 2");
    ok(imgs(e) === 1 && /Page 4 of the material/.test(e.text), "the diagram-only page 4 goes with the topic it follows, Electron Transport Chain");
    ok(R.sent.reduce((n, x) => n + imgs(x), 0) === 2, "two pictures in all: the logo on every page never counts");
    ok(/Pictures of this part's pages with figures are attached/.test(k.text) && !/Pictures of this part/.test(g.text), "the sections with figures are asked to use them; the others aren't");
    const b64 = (/"data":"([A-Za-z0-9+/=]{200,})"/.exec(k.text) || [])[1] || "";
    ok(b64.startsWith("/9j/"), "the picture is a JPEG of the page, rendered on this device");
    if (b64) fs.writeFileSync(path.join(SHOTS, "pipeline-figure-page2.jpg"), Buffer.from(b64, "base64"));
    ok(!R.sent.some(x => /application\/pdf/.test(x.text)), "the PDF file itself is never sent");
    ok(!R.p.errs.length, "no page errors: " + R.p.errs.join(" | "));
    await R.ctx.close(); }

  // 1c. What counts as a figure: a vector chart drawn with shapes does; a small icon doesn't; text pages don't
  { const ctxv = {console}; ctxv.self = ctxv; ctxv.window = ctxv; ctxv.globalThis = ctxv; vm.createContext(ctxv);
    vm.runInContext(fs.readFileSync(path.join(ROOT, "vendor", "pdflib", "pdf-lib.min.js"), "utf8"), ctxv);
    const U8 = vm.runInContext("Uint8Array", ctxv), {PDFDocument, StandardFonts, rgb} = ctxv.PDFLib, doc = await PDFDocument.create(), reg = await doc.embedFont(StandardFonts.Helvetica);
    const icon = await doc.embedPng(new U8(png(24, 24, () => [20, 20, 200])));
    const p1 = doc.addPage(); p1.setSize(612, 792); p1.drawText("Plain text page with a small icon.", {x: 50, y: 700, size: 12, font: reg}); p1.drawImage(icon, {x: 50, y: 650, width: 20, height: 20});
    const p2 = doc.addPage(); p2.setSize(612, 792); p2.drawText("Enzyme activity by temperature", {x: 50, y: 740, size: 14, font: reg});
    for (let i = 0; i < 140; i++) p2.drawRectangle({x: 60 + (i % 35) * 14, y: 200 + Math.floor(i / 35) * 90, width: 10, height: 20 + (i * 7) % 60, color: rgb(0.2, 0.4, 0.8)});
    const bytes = [...Buffer.from(await doc.save())];
    const R = await run({});
    const pages = await R.p.evaluate(async b => (await window.__sbPdfPages(new Uint8Array(b), {figures: true})).map(p => ({n: p.n, figure: p.figure, img: !!p.img})), bytes);
    ok(pages.length === 2 && !pages[0].figure && !pages[0].img, "a text page with a small icon isn't a figure page");
    ok(pages[1].figure && pages[1].img, "a chart drawn with shapes (no image at all) is a figure page, and is rendered");
    const noFig = await R.p.evaluate(async b => (await window.__sbPdfPages(new Uint8Array(b), {})).every(p => !p.figure && !p.img), bytes);
    ok(noFig, "an engine that can't see pictures (on-device models) gets text only: nothing is looked for or rendered");
    await R.ctx.close(); }

  // 2. Long pasted notes with headings, cards and a quiz: both go section by section
  { const notes = TOPICS.map(([t, k]) => `## ${t}\n${body(t, k)}`).join("\n\n");
    const R = await run({paste: notes, quiz: true});
    const cardReqs = R.sent.filter(x => x.part && /flashcard/.test(x.text)), quizReqs = R.sent.filter(x => x.part && /practice question/.test(x.text));
    ok(cardReqs.length === 3 && quizReqs.length === 3, `pasted notes: ${cardReqs.length} card requests and ${quizReqs.length} quiz requests, one per section`);
    ok(cardReqs.every(x => /from this part only/.test(x.text)), "each asks for cards from its part only");
    const qs = await R.p.evaluate(() => { const d = Object.values(window.__sbSync.state.decks).sort((a, b) => (b.updated || 0) - (a.updated || 0))[0] || {cards: [], aiQuizzes: []}; return (d.aiQuizzes || []).reduce((n, q) => n + q.questions.length, 0); });
    ok(qs >= 2, "the quiz questions come back too: " + qs);
    ok(!R.p.errs.length, "no page errors: " + R.p.errs.join(" | "));
    await R.ctx.close(); }

  // 2b. A section that comes back thin is asked once more, and only once
  { globalThis.__thinOnce = true;
    const notes = TOPICS.map(([t, k]) => `## ${t}\n${body(t, k)}`).join("\n\n");
    const R = await run({paste: notes, quiz: false});
    globalThis.__thinOnce = false;
    const krebs = R.sent.filter(x => x.part && /Krebs/.test(x.part.label));
    ok(krebs.length === 2 && /too few usable/.test(krebs[1].text), "a thin section is asked once more, saying why: " + krebs.length);
    ok(R.sent.filter(x => x.part && !/Krebs/.test(x.part.label)).length === 2, "the others are asked once");
    await R.ctx.close(); }

  // 3. Short notes: one request, exactly as before
  { const R = await run({paste: "Glycolysis splits glucose into two pyruvate in the cytoplasm and makes a little ATP and NADH.", quiz: false});
    ok(R.sent.length === 1 && !R.sent[0].part, "short notes: one request, no sections: " + R.sent.length);
    ok(R.cards.length >= 2, "and the cards come back as usual: " + R.cards.length);
    await R.ctx.close(); }

  await b.close(); server.close();
  console.log(fails ? `ai-pipeline.e2e: ${fails} of ${n} FAILED` : `ai-pipeline.e2e: ${n} checks passed`);
  process.exitCode = fails ? 1 : 0;
})().catch(e => { console.error(e); process.exit(1); });
