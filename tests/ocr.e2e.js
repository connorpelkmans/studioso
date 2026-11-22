// node tests/ocr.e2e.js: reading photos and scanned PDFs on the device (src/js/01-ocr.js) for the AI on the device.
// The real Tesseract.js (vendor/tesseract-7.0.0) runs here, under the same Content-Security-Policy headers as the website (_headers):
// the page's own policy, and the text reader's folder alone allowing WebAssembly. Pictures and scanned pages are drawn here, so the
// right words are known. Chrome's model is stood in for (it gets the text that was read); the iPhone's Vision is stood in for too.
const {chromium, executablePath} = require("./pw");
const path = require("path"), fs = require("fs"), http = require("http");
const ROOT = path.join(__dirname, ".."), SHOTS = path.join(ROOT, "tests-out");
const MIME = {".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".css": "text/css", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".png": "image/png", ".gz": "application/gzip", ".wasm": "application/wasm"};
// The website's security headers, from _headers: the site-wide policy, and the text reader's own
const H = fs.readFileSync(path.join(ROOT, "_headers"), "utf8");
const cspFor = p => { const m = new RegExp("^" + p.replace(/[.*]/g, c => "\\" + c) + "\\n(?:  .*\\n)*?  Content-Security-Policy: (.*)$", "m").exec(H); return m ? m[1] : ""; };
const SITE = cspFor("/*"), READER = cspFor("/vendor/tesseract-7.0.0/*");
const server = http.createServer((req, res) => {
  let p; try { p = decodeURIComponent(new URL(req.url, "http://x").pathname); } catch (e) { res.writeHead(400); res.end(); return; }
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT + path.sep) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream", "content-security-policy": p.startsWith("/vendor/tesseract-7.0.0/") ? READER : SITE});
  fs.createReadStream(f).pipe(res);
});
let fails = 0, n = 0; const ok = (c, m) => { n++; console.log((c ? "ok   " : "FAIL ") + m); if (!c) fails++; };
const PAGES = [["Light Reactions", ["The light reactions take place in the thylakoid membranes of the chloroplast.", "Chlorophyll absorbs light energy, which splits water molecules and releases oxygen gas.", "The energy is stored in two carriers, ATP and NADPH, which are used later in the Calvin cycle.", "Electrons lost by chlorophyll are replaced by electrons taken from water.", "A proton gradient across the thylakoid membrane drives ATP synthase."]],
  ["The Calvin Cycle", ["The Calvin cycle happens in the stroma and does not need light directly.", "The enzyme rubisco fixes carbon dioxide by attaching it to a five carbon sugar called RuBP.", "Using ATP and NADPH, the cycle builds a three carbon sugar that the plant turns into glucose.", "Most of that sugar is used to rebuild RuBP so the cycle can keep turning.", "Six turns of the cycle are needed to make one molecule of glucose."]]];
// Drawn in the page: a heading over lines of body text, as a scanned page or a photo of a handout would look
function drawPage([title, paras], w, h){
  const cv = document.createElement("canvas"); cv.width = w; cv.height = h; const cx = cv.getContext("2d");
  cx.fillStyle = "#fbfaf6"; cx.fillRect(0, 0, w, h); cx.fillStyle = "#1a1a1a";
  let y = 110; cx.font = "bold 46px Arial, Helvetica, sans-serif"; cx.fillText(title, 80, y); y += 80; cx.font = "26px Georgia, serif";
  paras.forEach(p => { let line = ""; p.split(" ").forEach(word => { if (cx.measureText(line + " " + word).width > w - 170) { cx.fillText(line.trim(), 80, y); y += 40; line = ""; } line += " " + word; }); cx.fillText(line.trim(), 80, y); y += 66; });
  return cv;
}
const fakeChrome = () => {
  const log = window.__devLog = {prompts: []};
  window.LanguageModel = {availability: async o => (o && (o.expectedInputs || []).some(x => x.type === "image")) ? "unavailable" : "available",
    create: async o => ({contextWindow: 6000, contextUsage: 300, destroy(){}, async prompt(input, po){
      const text = input.map(m => m.content.map(c => c.value).join("\n")).join("\n"); log.prompts.push(text);
      const sents = (text.split(/Notes[^:]*:\n/)[1] || text).split(/(?<=\.)\s+/).filter(x => x.split(" ").length > 6).slice(0, 3);
      return JSON.stringify({deckTitle: "Photosynthesis", cards: sents.map((b, i) => ({basis: b, front: `Question ${i + 1} about ${b.split(" ").slice(1, 4).join(" ")}?`, back: `It is ${b.split(" ").slice(-5).join(" ")}`}))});
    }})};
};

(async () => {
  ok(/wasm-unsafe-eval/.test(READER) && !/wasm-unsafe-eval/.test(SITE), "_headers: only the text reader's folder may compile WebAssembly");
  await new Promise(r => server.listen(0, "127.0.0.1", r));
  const port = server.address().port, b = await chromium.launch({executablePath});
  const open = async (o = {}) => {
    const ctx = await b.newContext({viewport: {width: 1100, height: 900}, serviceWorkers: "block"});
    // helpers as script text (the site's policy rightly blocks eval in the page)
    await ctx.addInitScript({content: `window.__drawPage = ${drawPage}; (${fakeChrome})();`});
    await ctx.addInitScript(([o]) => { window.__SB_TEST = true; window.__SB_DEVICE_AI_TEST = true;
      window.__csp = []; document.addEventListener("securitypolicyviolation", e => window.__csp.push(e.violatedDirective + " " + e.blockedURI));
      if (o.apple) { const plugin = {availability: async () => ({status: "available", contextSize: 4096, images: false}), generate: async x => ({json: '{"answer":"ok"}'}),
        recognizeText: async x => { (window.__vision = window.__vision || []).push(x.image.length); return {lines: o.apple}; }};
        window.Capacitor = {isNativePlatform: () => true, getPlatform: () => "ios", isPluginAvailable: n => n === "StudyboardOnDeviceAI", Plugins: {StudyboardOnDeviceAI: plugin}, registerPlugin: () => ({})}; }
      localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "done"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studyboard:whatsNew", JSON.stringify({v: "1.15.8"}));
      localStorage.setItem("coursework:v2", JSON.stringify({v: 2, updated: 1, tasks: [], files: [], notes: [], events: [], decks: [], settings: {}, courses: [{id: "c1", name: "Biology", code: "BIO 110", color: "#3B6FE0"}]})); }, [o]);
    const p = await ctx.newPage(); p.errs = []; p.on("pageerror", e => p.errs.push(e.message));
    await p.goto(`http://127.0.0.1:${port}/index.html`); await p.waitForFunction(() => window.__sbSync && window.SBOCR && window.__sbDevAI, null, {timeout: 30000}); await p.waitForTimeout(500);
    return {ctx, p};
  };
  const makeSet = async (p, file) => {
    await p.evaluate(() => { const S = window.__sbSync; S.ui.filter = "c1"; S.ui.tab = "flashcards"; S.render(); const x = document.createElement("button"); x.dataset.act = "fc-ai"; document.body.appendChild(x); x.click(); x.remove(); });
    await p.waitForSelector("#dlg[open] #aiGo");
    await p.setInputFiles("#aiFile", file); await p.waitForTimeout(800);
    await p.evaluate(() => { const q = document.querySelector("#aiQuiz"); if (q && q.checked) q.click(); });
    await p.click("#aiGo");
    await p.waitForSelector(".ai-live-bar.done, #toast.show.toast-err", {timeout: 240000}).catch(() => {});
    return p.evaluate(() => { const d = Object.values(window.__sbSync.state.decks)[0] || {cards: []}; const bar = (document.querySelector(".ai-live-bar") || {}).innerText || "", t = (document.querySelector("#toast.show") || {}).innerText || "";
      return {cards: d.cards.length, all: bar, status: bar + " " + t, prompts: window.__devLog.prompts}; });
  };

  // 1. A photo of a handout: the real Tesseract, under the site's policy, reads it; the heading stays on its own
  { const R = await open();
    const r = await R.p.evaluate(async page => { const cv = window.__drawPage(page.data, 1600, 1100); const t0 = Date.now(); const x = await window.SBOCR.readImage(cv); return {text: x.text, conf: x.conf, engine: x.engine, ms: Date.now() - t0, csp: window.__csp, T: !!window.Tesseract}; }, {draw: drawPage.toString(), data: PAGES[0]});
    const words = ["Light Reactions", "thylakoid", "chloroplast", "Chlorophyll", "oxygen", "NADPH", "Calvin"];
    ok(r.engine === "tesseract" && r.T, "on a computer the words are read by Tesseract.js, loaded only now");
    ok(words.every(w => r.text.includes(w)), `the words come back right (${r.ms} ms, confidence ${r.conf}): ` + words.filter(w => !r.text.includes(w)).join(", "));
    ok(r.conf >= 80, "with high confidence for clear print: " + r.conf);
    ok(/^Light Reactions\n\n/.test(r.text), "the heading is its own paragraph, so it can start a section: " + JSON.stringify(r.text.slice(0, 60)));
    ok(r.text.split("\n\n").length >= 3, "and the text is in paragraphs, not one line per row of print");
    ok(!r.csp.length, "nothing was blocked by the site's security policy: " + r.csp.join(", "));
    await R.ctx.close(); }

  // 2. A scanned PDF (pictures of pages, no text in it) on the AI on this device: each page is read, its headings found by size,
  //    and the model gets the words
  { const R = await open();
    const bytes = await R.p.evaluate(async ({draw, pages}) => {
      await new Promise((res, rej) => { const s = document.createElement("script"); s.src = "vendor/pdflib/pdf-lib.min.js"; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
      const D = window.PDFLib, doc = await D.PDFDocument.create();
      for (const pg of pages) { const cv = window.__drawPage(pg, 1275, 1650), png = await doc.embedPng(cv.toDataURL("image/png")); const page = doc.addPage([612, 792]); page.drawImage(png, {x: 0, y: 0, width: 612, height: 792}); }
      return [...await doc.save()];
    }, {draw: drawPage.toString(), pages: PAGES});
    const file = path.join(SHOTS, "ocr-scan.pdf"); fs.writeFileSync(file, Buffer.from(bytes));
    const out = await makeSet(R.p, file);
    const joined = out.prompts.join("\n");
    ok(out.prompts.length >= 2, "the scan is split into its two topics, one request each: " + out.prompts.length);
    ok(/Light Reactions/.test(joined) && /The Calvin Cycle/.test(joined) && /rubisco/i.test(joined) && /thylakoid/.test(joined), "the model gets the words read from the scanned pages");
    ok(out.prompts.some(x => /Notes \(.*Light Reactions\)/.test(x)) && out.prompts.some(x => /Notes \(.*Calvin Cycle\)/.test(x)), "each request is labelled with the heading found on its page");
    ok(out.cards >= 2, "and the cards come back for review: " + out.cards);
    ok(!R.p.errs.length, "no page errors: " + R.p.errs.join(" | "));
    await R.p.screenshot({path: path.join(SHOTS, "ocr-scan-review.png")});
    await R.ctx.close(); }

  // 3. A photo added to Create with AI
  { const R = await open();
    const png = await R.p.evaluate(async page => window.__drawPage(page.data, 1500, 1000).toDataURL("image/png").split(",")[1], {draw: drawPage.toString(), data: PAGES[1]});
    const file = path.join(SHOTS, "ocr-photo.png"); fs.writeFileSync(file, Buffer.from(png, "base64"));
    const out = await makeSet(R.p, file);
    ok(out.prompts.some(x => /rubisco/i.test(x) && /stroma/.test(x)), "a photo's words reach the model as text");
    ok(out.cards >= 1, "cards come back: " + out.cards + " " + out.status);
    await R.ctx.close(); }

  // 4. A picture with no words (a drawing), where the model can't see pictures: said plainly, nothing made up
  { const R = await open();
    const png = await R.p.evaluate(() => { const cv = document.createElement("canvas"); cv.width = 900; cv.height = 700; const cx = cv.getContext("2d"); cx.fillStyle = "#fff"; cx.fillRect(0, 0, 900, 700);
      cx.strokeStyle = "#2a6"; cx.lineWidth = 6; for (let i = 0; i < 6; i++) { cx.beginPath(); cx.arc(200 + i * 90, 350, 60 + i * 8, 0, Math.PI * 2); cx.stroke(); } return cv.toDataURL("image/png").split(",")[1]; });
    const file = path.join(SHOTS, "ocr-drawing.png"); fs.writeFileSync(file, Buffer.from(png, "base64"));
    const out = await makeSet(R.p, file);
    ok(/no words in that picture that this device can read/.test(out.status) && /diagrams and drawings need Studyboard AI/.test(out.status), "a drawing with no words is explained: " + out.status.slice(0, 160));
    ok(!out.prompts.length, "and nothing goes to the model");
    await R.ctx.close(); }

  // 5. The iPhone app: Apple's Vision reads it (stood in for); Tesseract is never loaded; its lines come back in paragraphs with the
  //    heading on its own
  { const lines = [{text: "Osmosis", confidence: 0.99, x: 60, y: 40, width: 300, height: 52}, {text: "Water moves across a membrane toward the", confidence: 0.95, x: 60, y: 130, width: 900, height: 26},
      {text: "side with more solute. It needs no ener-", confidence: 0.93, x: 60, y: 162, width: 900, height: 26}, {text: "gy from the cell.", confidence: 0.94, x: 60, y: 194, width: 400, height: 26},
      {text: "A cell in pure water swells and may burst.", confidence: 0.9, x: 60, y: 290, width: 900, height: 26}, {text: "~~ ' ,", confidence: 0.2, x: 900, y: 700, width: 30, height: 20}];
    const R = await open({apple: lines});
    const r = await R.p.evaluate(async () => { const cv = document.createElement("canvas"); cv.width = 800; cv.height = 600; const x = await window.SBOCR.readImage(cv); return {text: x.text, engine: x.engine, conf: x.conf, T: !!window.Tesseract, sent: window.__vision}; });
    ok(r.engine === "apple" && !r.T, "in the iPhone app, Apple's Vision reads it, and Tesseract is never loaded");
    ok(r.text === "Osmosis\n\nWater moves across a membrane toward the side with more solute. It needs no energy from the cell.\n\nA cell in pure water swells and may burst.", "lines become paragraphs, a split word is joined, the heading stands alone, a smudge is left out: " + JSON.stringify(r.text));
    ok(r.sent && r.sent[0] > 100, "the picture went to Vision as a JPEG");
    ok(r.conf >= 90, "confidence is reported on the same 0 to 100 scale: " + r.conf);
    await R.ctx.close();
    // hard to read: refused plainly, not turned into cards from misread words
    const R2 = await open({apple: [{text: "Wtr mvs acrss mbrn twrd", confidence: 0.22, x: 0, y: 0, width: 500, height: 30}, {text: "sde wth mre slte nd nds", confidence: 0.28, x: 0, y: 40, width: 500, height: 30}]});
    const msg = await R2.p.evaluate(async () => { try { await window.__sbDevAI.call({system: "x", parts: [{inline_data: {mime_type: "image/png", data: "iVBORw0KGgo="}}, {text: "Make notes."}]}); return ""; } catch (e) { return e.code + ": " + e.message; } });
    ok(/^device-unreadable/.test(msg), "a photo too hard to read is refused plainly: " + msg);
    await R2.ctx.close(); }

  await b.close(); server.close();
  console.log(fails ? `ocr.e2e: ${fails} of ${n} FAILED` : `ocr.e2e: ${n} checks passed`);
  process.exitCode = fails ? 1 : 0;
})().catch(e => { console.error(e); process.exit(1); });
