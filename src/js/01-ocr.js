/* ===== 01-ocr.js: reading the words in photos and scanned pages, on the device, so the small AI on the device (01-ai-device.js)
   gets plain text, which it handles well, instead of pictures, which it handles badly or not at all.
   - iPhone and iPad app: Apple's Vision framework (StudyboardOnDeviceAI.recognizeText in ios-wrapper/native/StudyboardOnDeviceAI.swift).
     Reads printed text and handwriting well.
   - Everywhere else: Tesseract.js (vendor/tesseract-7.0.0, Apache 2.0), English, loaded the first time it's needed (about 7 MB, then
     cached by the browser). Reads printed text well and handwriting poorly, which is why low confidence is reported, not hidden.
   Nothing leaves the device. Both engines give lines with their position, height and confidence; lines are put back into
   paragraphs here, and taller lines stay on their own, so a scanned page's headings still split notes into sections.
   API: SBOCR.readImage({data, mime_type} | Blob | canvas, opts), SBOCR.readPdf(bytes, opts), SBOCR.textOf(lines), SBOCR.supported() ===== */
const OCR_DIR = "vendor/tesseract-7.0.0/";
const OCR = {maxPages: 40, pagePx: 2000, minSide: 1400, maxSide: 2600, idleMs: 90000, junk: 40, hard: 60, unreadable: 35};
const SBOCR = (() => {
  const abs = p => new URL(p, location.href).href;
  const native = () => { try { const N = typeof devNative === "function" ? devNative() : null; return N && typeof N.recognizeText === "function" ? N : null; } catch (e) { return null; } };
  const supported = () => !!native() || (typeof Worker === "function" && typeof WebAssembly === "object");
  const stop = signal => { if (signal && signal.aborted) throw aiErr("aborted", "Stopped."); };

  /* Tesseract: one worker, kept while it's being used and closed after a while idle (it holds a lot of memory) */
  let tess = null, idle = null, report = null;
  const loadScript = src => new Promise((res, rej) => { const s = document.createElement("script"); s.src = src; s.onload = res; s.onerror = () => rej(new Error("couldn't load " + src)); document.head.appendChild(s); });
  function tessWorker(){
    clearTimeout(idle);
    if (!tess) tess = (async () => {
      if (!window.Tesseract) await loadScript(OCR_DIR + "tesseract.min.js");
      // workerBlobURL false: the worker runs from its own address, under its own policy (_headers), which alone allows WebAssembly
      return window.Tesseract.createWorker("eng", 1, {workerPath: abs(OCR_DIR + "worker.min.js"), corePath: abs(OCR_DIR + "core"), langPath: abs(OCR_DIR + "lang"),
        workerBlobURL: false, gzip: true, logger: m => { if (report && m && m.status === "recognizing text") report(m.progress || 0); }});
    })().catch(e => { tess = null; throw Object.assign(aiErr("ocr-failed", "This device couldn't start its text reader. Try again, or use Studyboard AI Pro or an AI key for photos and scans."), {detail: String(e && e.message || e)}); });
    return tess;
  }
  const rest = () => { clearTimeout(idle); idle = setTimeout(async () => { const t = tess; tess = null; try { (await t).terminate(); } catch (e) {} }, OCR.idleMs); };

  // A picture ready to read: small photos are enlarged (Tesseract reads text best when letters are 20 or more pixels tall), huge
  // ones shrunk, and the colors dropped
  async function canvasOf(src){
    let bmp;
    if (src && src.getContext) bmp = src;
    else {
      const blob = src instanceof Blob ? src : devBlob(src.data, src.mime_type || "image/jpeg");
      bmp = await createImageBitmap(blob, {imageOrientation: "from-image"});
    }
    const w = bmp.width, h = bmp.height, long = Math.max(w, h), short = Math.min(w, h);
    const k = short < OCR.minSide ? Math.min(2.5, OCR.minSide / short, OCR.maxSide / long) : long > OCR.maxSide ? OCR.maxSide / long : 1;
    const cv = document.createElement("canvas"); cv.width = Math.round(w * k); cv.height = Math.round(h * k);
    const cx = cv.getContext("2d", {willReadFrequently: true}); cx.fillStyle = "#fff"; cx.fillRect(0, 0, cv.width, cv.height);
    cx.filter = "grayscale(1) contrast(1.15)"; cx.drawImage(bmp, 0, 0, cv.width, cv.height); cx.filter = "none";
    if (bmp.close) try { bmp.close(); } catch (e) {}
    return cv;
  }
  const b64Of = cv => cv.toDataURL("image/jpeg", 0.85).split(",")[1] || "";

  // Lines from either engine, as {text, x, y, h, conf (0 to 100)}, in reading order
  async function lines(src, opts){
    const N = native();
    if (N) {
      const data = src && src.data ? src.data : b64Of(await canvasOf(src));
      const r = await N.recognizeText({image: data});
      return {engine: "apple", lines: (r && r.lines || []).map(l => ({text: String(l.text || ""), x: +l.x || 0, y: +l.y || 0, h: +l.height || 0, conf: Math.round((+l.confidence || 0) * 100)}))};
    }
    const cv = await canvasOf(src), w = await tessWorker();
    report = opts.onProgress || null;
    try {
      const r = await w.recognize(cv, {}, {text: true, blocks: true});
      const out = [];
      ((r.data && r.data.blocks) || []).forEach(b => (b.paragraphs || []).forEach((p, pi) => (p.lines || []).forEach((l, li) => {
        const bb = l.bbox || {}; out.push({text: String(l.text || "").trim(), x: bb.x0 || 0, y: bb.y0 || 0, h: Math.max(1, (bb.y1 || 0) - (bb.y0 || 0)), conf: Math.round(l.confidence || 0), para: li === 0});
      })));
      return {engine: "tesseract", lines: out};
    } finally { report = null; cv.width = cv.height = 0; rest(); }
  }
  // Leave out what isn't text: very unsure lines that are mostly symbols (smudges, lines of a diagram, page edges)
  const real = l => { const t = l.text.trim(); if (!t) return false; const al = (t.match(/[\p{L}\p{N}]/gu) || []).length / t.length;
    return !(l.conf < 25 || (l.conf < OCR.junk && (al < 0.6 || t.length < 4)) || al < 0.3); };
  const median = a => { const s = a.slice().sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : 0; };
  // Lines back into paragraphs, each with its height (the tallest line in it): a new paragraph at a gap or a heading (a line clearly
  // taller than the body text, which stays on its own), hyphenated words joined again
  function paras(ls){
    const L = ls.filter(real); if (!L.length) return [];
    const mh = median(L.map(l => l.h)) || 1, out = []; let cur = null, prev = null;
    L.forEach(l => {
      const head = l.h > mh * 1.3 && l.text.length < 90, gap = prev && (l.y - (prev.y + prev.h)) > mh * 1.1;
      if (!cur || head || gap || l.para || (prev && prev.head)) { cur = {lines: [], h: 0}; out.push(cur); }
      cur.lines.push(l.text); cur.h = Math.max(cur.h, l.h); prev = Object.assign({}, l, {head});
    });
    return out.map(p => ({h: p.h, text: p.lines.reduce((s2, t) => s2 ? (/[A-Za-z]-$/.test(s2) && /^[a-z]/.test(t) ? s2.slice(0, -1) + t : s2 + " " + t) : t, "").replace(/[ \t]+/g, " ").trim()})).filter(p => p.text);
  }
  const textOf = ls => paras(ls).map(p => p.text).join("\n\n");
  // How sure the reader was, weighted by how much each line says
  const confOf = ls => { const L = ls.filter(real), n = L.reduce((a, l) => a + l.text.length, 0); return n ? Math.round(L.reduce((a, l) => a + l.conf * l.text.length, 0) / n) : 0; };

  async function readImage(src, opts){
    opts = opts || {}; stop(opts.signal);
    const r = await lines(src, opts); stop(opts.signal);
    return {text: textOf(r.lines), conf: confOf(r.lines), engine: r.engine, lines: r.lines.filter(real)};
  }
  // A scanned PDF, page by page: each page drawn on the device and read. Returns pages shaped like aiPdfPages' ({n, lines: [{text,
  // size}]}), so the sections work the same way as for a PDF with real text
  async function readPdf(u8, opts){
    opts = opts || {}; const say = opts.onStatus || (() => {});
    await loadPdfJs();
    const doc = await window.pdfjsLib.getDocument({data: u8.slice(), ...PDF_OPTS}).promise, total = doc.numPages, n = Math.min(total, opts.maxPages || OCR.maxPages), pages = [];
    for (let i = 1; i <= n; i++) {
      stop(opts.signal);
      say(`Reading the words on page ${i} of ${n}${opts.name ? ` of ${opts.name}` : ""}…`);
      const page = await doc.getPage(i), v0 = page.getViewport({scale: 1}), vp = page.getViewport({scale: OCR.pagePx / Math.max(v0.width, v0.height)});
      const cv = document.createElement("canvas"); cv.width = Math.round(vp.width); cv.height = Math.round(vp.height);
      const cx = cv.getContext("2d"); cx.fillStyle = "#fff"; cx.fillRect(0, 0, cv.width, cv.height);
      await page.render({canvasContext: cx, viewport: vp}).promise;
      try { page.cleanup && page.cleanup(); } catch (e) {}
      const r = await readImage(cv, {signal: opts.signal, onProgress: p => say(`Reading the words on page ${i} of ${n}${opts.name ? ` of ${opts.name}` : ""}… ${Math.round(p * 100)}%`)});
      // the line's height stands in for its font size, so big lines are headings, as in a PDF with real text
      pages.push({n: i, lines: paras(r.lines).map(p => ({text: p.text, size: p.h})), conf: r.conf});
    }
    try { doc.destroy && doc.destroy(); } catch (e) {}
    const text = pages.map(p => p.lines.map(l => l.text).join("\n\n")).join("\n\n"), all = pages.filter(p => p.lines.length);
    return {pages, text, conf: all.length ? Math.round(all.reduce((a, p) => a + p.conf, 0) / all.length) : 0, cut: total > n, total};
  }
  // Started when a screen that reads pictures opens, so the reader is ready by the time the student presses the button (the first
  // start loads its engine and English data). Apple's reader needs no start. It closes again after a while idle, as usual
  function warm(){ try { if (devNative && devNative() && DEVAI.kind === "apple") return; tessWorker().then(rest, () => {}); } catch (e) {} }
  return {supported, readImage, readPdf, textOf, paras, confOf, OCR, warm};
})();
if (window.__SB_TEST) window.SBOCR = SBOCR;
