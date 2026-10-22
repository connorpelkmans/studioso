// node tests/ipad-pen.e2e.js   (Playwright + Chromium; see tests/pw.js)
// Pen ink (module 99-ink): handwriting with Apple Pencil on PDF pages in the reader and on a note's drawing page. iPad app only: the tools must
// not appear without the iPad check (the test turns it on with localStorage "studyboard:ink-test"). Pen strokes are dispatched PointerEvents
// with pointerType "pen"; a finger ("touch") must not draw while Draw with Finger is off.
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const csp = require("../scripts/csp");
const root = path.join(__dirname, "..");
const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x"); let p = decodeURIComponent(u.pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  const ext = path.extname(f), mime = {".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".css": "text/css", ".webmanifest": "application/manifest+json"};
  res.writeHead(200, {"content-type": mime[ext] || "application/octet-stream"});
  if (p === "/index.html" || /^\/bundle\/[^/]+\.js$/.test(p)) { res.end((/\.html$/.test(p) ? csp.apply : String)(fs.readFileSync(f, "utf8").replace("const PRO_ENFORCED = true;", "const PRO_ENFORCED = false;"))); return; }
  fs.createReadStream(f).pipe(res);
});
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
// A two-page PDF of plain text lines (as in pro-study.e2e.js)
function textPdf(){
  const page = lines => lines.map((l, i) => `BT /F1 14 Tf 72 ${700 - i * 24} Td (${l}) Tj ET`).join("\n");
  const c1 = page(["Chapter 4: The Cell", "Mitochondria produce most of the cell's ATP.", "Ribosomes build proteins from amino acids."]);
  const c2 = page(["Chapter 4, continued", "Osmosis moves water across a membrane."]);
  const objs = ["<< /Type /Catalog /Pages 2 0 R >>", "<< /Type /Pages /Kids [3 0 R 5 0 R] /Count 2 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 6 0 R >>", "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 7 0 R >>",
    `<< /Length ${c1.length} >>\nstream\n${c1}\nendstream`, `<< /Length ${c2.length} >>\nstream\n${c2}\nendstream`];
  let out = "%PDF-1.4\n"; const offs = [];
  objs.forEach((o, i) => { offs.push(out.length); out += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const x = out.length; out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + offs.map(o => String(o).padStart(10, "0") + " 00000 n \n").join("") + `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${x}\n%%EOF`;
  return [...Buffer.from(out, "latin1")];
}
const SEED = () => ({v: 2, updated: 1, decks: [], tasks: [], settings: {},
  notes: [{id: "n1", text: "Cell parts", color: "yellow", x: 40, y: 40, z: 1, courseId: "c1"}],
  files: [{id: "f1", name: "Reading 4.pdf", courseId: "c1", folderId: "other", kind: "file", taskIds: [], desc: "", url: "", revs: [{assetId: "a-read4", name: "Reading 4.pdf", size: 1200, type: "application/pdf", at: 1}]}],
  courses: [{id: "c1", name: "Biology", code: "BIO101", color: "#3B6FE0"}]});
const IPAD_UA = "Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148";
const IPAD_DESKTOP_UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15";
const IPHONE_UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148";

(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  const mkCtx = async ({pen, free, dark, ua, touch} = {}) => {
    const ctx = await browser.newContext(Object.assign({viewport: {width: 1100, height: 900}, serviceWorkers: "block", colorScheme: dark ? "dark" : "light"}, ua ? {userAgent: ua} : {}, touch ? {hasTouch: true} : {}));
    await ctx.addInitScript(([seed, pen, free, dark]) => {
      try {
        if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("coursework:v2", JSON.stringify(seed)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); }
        if (pen) localStorage.setItem("studyboard:ink-test", "1");
        if (free) localStorage.setItem("studyboard:paywall-test", "1");
        if (dark) localStorage.setItem("studioso:theme", "dark");
      } catch (e) {}
    }, [SEED(), !!pen, !!free, !!dark]);
    if (touch) await ctx.addInitScript(() => { Object.defineProperty(Navigator.prototype, "maxTouchPoints", {get: () => 5, configurable: true}); });   // an iPad's touch screen
    return ctx;
  };
  const open = async (ctx, page) => {
    page = page || await ctx.newPage(); page.errs = page.errs || [];
    if (!page.__wired) { page.__wired = true; page.on("pageerror", e => page.errs.push(e.message)); page.on("console", m => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) page.errs.push(m.text()); }); }
    await page.goto(base); await page.waitForSelector("#view", {state: "attached"}); await page.waitForFunction(() => window.__sbProStudy && window.__sbInk);
    await page.evaluate(() => { const T = window.__sbProStudy; Object.defineProperty(window, "state", {get: () => T.state(), configurable: true}); Object.defineProperty(window, "dlg", {get: () => T.dlg(), configurable: true}); ["ui", "render"].forEach(k => { window[k] = T[k]; }); });
    await page.waitForTimeout(700); return page;
  };
  const act = (page, a, id) => page.evaluate(([a, id]) => { const b = document.createElement("button"); b.dataset.act = a; if (id) b.dataset.id = id; b.style.display = "none"; document.body.appendChild(b); b.click(); b.remove(); }, [a, id || ""]);
  // A stroke: points as fractions of the element, dispatched as Pointer Events
  const stroke = (page, sel, pts, type) => page.evaluate(([sel, pts, type]) => {
    const el = document.querySelector(sel); if (!el) return false;
    const r = el.getBoundingClientRect(), id = type === "pen" ? 7 : type === "touch" ? 9 : 1;
    const fire = (t, [x, y]) => el.dispatchEvent(new PointerEvent(t, {bubbles: true, cancelable: true, composed: true, pointerId: id, pointerType: type, isPrimary: true,
      clientX: r.left + x * r.width, clientY: r.top + y * r.height, pressure: t === "pointerup" ? 0 : 0.6, button: t === "pointermove" ? -1 : 0, buttons: t === "pointerup" ? 0 : 1}));
    fire("pointerdown", pts[0]); pts.slice(1).forEach(p => fire("pointermove", p)); fire("pointerup", pts[pts.length - 1]);
    return true;
  }, [sel, pts, type || "pen"]);
  const line = (x0, y0, x1, y1, k = 12) => Array.from({length: k + 1}, (_, i) => [x0 + (x1 - x0) * i / k, y0 + (y1 - y0) * i / k + Math.sin(i) * 0.002]);
  const inked = (page, sel) => page.evaluate(sel => { const c = document.querySelector(sel); if (!c || !c.width) return 0; const d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data; let k = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 0) k++; return k; }, sel);
  const alphaAt = (page, sel, fx, fy) => page.evaluate(([sel, fx, fy]) => { const c = document.querySelector(sel); if (!c) return -1; const g = c.getContext("2d"), x = Math.round(fx * c.width), y = Math.round(fy * c.height); const d = g.getImageData(Math.max(0, x - 3), Math.max(0, y - 3), 7, 7).data; let m = 0; for (let i = 3; i < d.length; i += 4) m = Math.max(m, d[i]); return m; }, [sel, fx, fy]);
  const pageInk = page => page.evaluate(() => window.__sbInk.session() ? window.__sbInk.session().store.list().filter(s => s.p === 1) : []);
  const openReader = async page => {
    await page.evaluate(async bytes => { await window.__sbProStudy.idbSet("pdf:a-read4", new Blob([new Uint8Array(bytes)], {type: "application/pdf"})); }, textPdf());
    await act(page, "f-open", "f1"); await page.waitForTimeout(250);
    await page.click('.sheet-foot [data-act="pdr-open"]');
    await page.waitForSelector('.pdr-page[data-p="1"] .pdr-cv', {timeout: 15000}); await page.waitForTimeout(300);
  };
  const P1 = '.pdr-page[data-p="1"] .ink-layer';
  try {
    /* ---------- Only in the iPad app ---------- */
    const web = await open(await mkCtx());
    ok(await web.evaluate(() => window.__sbInk.available()) === false, "the website (no iPad app): the pen is off");
    await openReader(web);
    ok(await web.locator('[data-act="ink-mode"]').count() === 0, "website: the reader has no Pen button");
    await web.evaluate(() => dlg.close()); await web.waitForTimeout(150);
    await web.evaluate(() => { ui.tab = "notes"; render(); }); await web.waitForTimeout(250);
    await web.locator('.note[data-note="n1"] .note-body').click(); await web.waitForTimeout(250);
    ok(await web.locator('.note.editing [data-act="ink-note"]').count() === 0, "website: a note has no Draw button");
    ok(web.errs.length === 0, "no console errors (website): " + web.errs.join(" | "));
    await web.context().close();

    // The check itself: the native iOS app on an iPad, and nothing else
    const fakeApp = (page, idiom) => page.evaluate(idiom => {
      const keep = window.Capacitor, keepD = window.StudyboardDevice;
      window.Capacitor = {isNativePlatform: () => true, getPlatform: () => "ios"};
      if (idiom) window.StudyboardDevice = {idiom}; else delete window.StudyboardDevice;
      const on = window.__sbInk.available();
      window.Capacitor = keep; if (keepD) window.StudyboardDevice = keepD; else delete window.StudyboardDevice;
      return on;
    }, idiom || "");
    const ipad = await open(await mkCtx({ua: IPAD_UA}));
    ok(await ipad.evaluate(() => window.__sbInk.available()) === false, "an iPad in Safari (not the app): off");
    ok(await fakeApp(ipad) === true, "the iOS app on an iPad (user agent): on");
    ok(await fakeApp(ipad, "phone") === false, "the app shell's own answer wins over the user agent");
    ok(await ipad.evaluate(() => { const keep = window.Capacitor; window.Capacitor = {isNativePlatform: () => true, getPlatform: () => "android"}; const on = window.__sbInk.available(); window.Capacitor = keep; return on; }) === false, "Android app: off");
    await ipad.context().close();
    const ipadDesk = await open(await mkCtx({ua: IPAD_DESKTOP_UA, touch: true}));
    ok(await fakeApp(ipadDesk) === true, "iPadOS's desktop user agent (Macintosh with a touch screen): on");
    await ipadDesk.context().close();
    const iphone = await open(await mkCtx({ua: IPHONE_UA, touch: true}));
    ok(await fakeApp(iphone) === false, "the iOS app on an iPhone: off");
    ok(await fakeApp(iphone, "pad") === true, "the app shell saying iPad: on");
    await iphone.context().close();

    /* ---------- On a PDF ---------- */
    const ctx = await mkCtx({pen: true});
    let page = await open(ctx);
    // the point code
    const rt = await page.evaluate(() => { const I = window.__sbInk, pts = [[0.1, 0.2, 0.5], [0.1003, 0.2004, 0.6], [0.9, 0.95, 1], [0, 1, 0]], d = I.encode(pts), back = I.decode(d);
      return {d, ok: back.length === 4 && back.every((p, i) => Math.abs(p[0] - pts[i][0]) < 1e-4 && Math.abs(p[1] - pts[i][1]) < 1e-4 && Math.abs(p[2] - pts[i][2]) < 0.02)}; });
    ok(rt.ok && /^[A-Za-z0-9_-]+$/.test(rt.d) && rt.d.length < 30, "points pack small and come back the same: " + rt.d);
    ok(await page.evaluate(() => { const k = window.__sbInk.normInk([{id: "a", t: "pen", c: "red", w: 35, d: "AAAAAA", at: 1}, {id: "a", d: "AAAAAA"}, {id: "<b>", d: "AAAAAA"}, {id: "x", d: "<svg>"}, {id: "y", c: "#f00\"/>", w: 1e9, d: "AAAAAA"}, null, "z"], 10);
      return k.length === 2 && k[1].c === "ink" && k[1].w === 600; }), "synced ink is checked: duplicates, bad ids, bad points and bad colours are dropped or fixed");

    await openReader(page);
    ok(await page.locator('[data-act="ink-mode"]').count() === 1, "with the iPad check on, the reader has a Pen button");
    await page.click('[data-act="ink-mode"]'); await page.waitForTimeout(150);
    ok(await page.locator("#inkBar .ink-t").count() === 3 && await page.locator("#inkBar .ink-col").count() === 6 && await page.locator("#inkBar .ink-w").count() === 3, "the pen tools: pen, highlighter, eraser, six colours, three widths");
    ok(await page.locator(P1).count() === 1 && await page.evaluate(() => document.querySelector("#pdrPages").classList.contains("ink-on")), "each page gets an ink layer");
    await stroke(page, P1, line(0.15, 0.3, 0.7, 0.32)); await page.waitForTimeout(100);
    let ink = await pageInk(page);
    ok(ink.length === 1 && ink[0].t === "pen" && ink[0].a === "a-read4" && ink[0].p === 1 && /^[A-Za-z0-9_-]+$/.test(ink[0].d), "a Pencil stroke is kept on page 1 of this revision");
    ok(await inked(page, P1 + " .ink-pen") > 50, "and drawn on the page");
    // a finger scrolls, it doesn't draw
    await stroke(page, P1, line(0.2, 0.6, 0.6, 0.62), "touch"); await page.waitForTimeout(100);
    ok((await pageInk(page)).length === 1, "a finger doesn't draw while Draw with Finger is off");
    ok(await page.evaluate(() => getComputedStyle(document.querySelector('.pdr-page[data-p="1"] .ink-layer')).touchAction) === "manipulation", "fingers can still scroll and zoom the page (touch-action)");
    // highlighter
    await page.click('[data-act="ink-tool"][data-id="hl"]'); await page.waitForTimeout(80);
    ok(await page.locator("#inkBar .ink-col").count() === 4, "the highlighter has its four colours");
    await stroke(page, P1, line(0.15, 0.45, 0.6, 0.45)); await page.waitForTimeout(100);
    ink = await pageInk(page);
    ok(ink.length === 2 && ink.filter(s => s.t === "hl").length === 1 && ink.find(s => s.t === "hl").w > ink.find(s => s.t === "pen").w, "a highlighter stroke, wider, on its own layer");
    ok(await inked(page, P1 + " .ink-hlc") > 50 && await page.evaluate(() => getComputedStyle(document.querySelector('.pdr-page[data-p="1"] .ink-hlc')).mixBlendMode) === "multiply", "the highlighter sits under the ink and lets the page show through");
    // the saved file
    await page.evaluate(() => window.__sbInk.flush()); await page.waitForTimeout(100);
    ok(await page.evaluate(() => (state.files.f1.ink || []).length === 2 && (state.files.f1.hl || []).length === 0), "the strokes are saved on the file (beside highlights)");
    // eraser
    await page.click('[data-act="ink-tool"][data-id="erase"]'); await page.waitForTimeout(80);
    await stroke(page, P1, line(0.4, 0.25, 0.4, 0.36, 6)); await page.waitForTimeout(100);
    ink = await pageInk(page);
    ok(ink.length === 1 && ink[0].t === "hl", "the eraser removes the stroke it touches, and only that one");
    // undo and redo
    await page.click('[data-act="ink-undo"]'); await page.waitForTimeout(80);
    ok((await pageInk(page)).length === 2 && await alphaAt(page, P1 + " .ink-pen", 0.4, 0.31) > 0, "Undo brings the erased stroke back");
    await page.click('[data-act="ink-redo"]'); await page.waitForTimeout(80);
    ok((await pageInk(page)).length === 1, "Redo erases it again");
    await page.click('[data-act="ink-undo"]'); await page.waitForTimeout(80);
    // clear the page, with a question first
    await page.click('[data-act="ink-clear"]'); await page.waitForTimeout(80);
    ok(await page.locator(".ink-ask").count() === 1 && /Clear all ink on page 1/.test(await page.locator(".ink-ask").textContent()) && await page.evaluate(() => dlg.open && !!dlg.querySelector(".pdr-sheet")), "Clear Page asks first, inside the reader");
    await page.click(".ink-ask [data-ink-yes]"); await page.waitForTimeout(80);
    ok((await pageInk(page)).length === 0 && await inked(page, P1 + " .ink-pen") === 0, "Clear Page clears it");
    await page.click('[data-act="ink-undo"]'); await page.waitForTimeout(80);
    ok((await pageInk(page)).length === 2, "and Undo brings it all back");
    // zoom: the ink stays where it was written
    const w0 = await page.evaluate(sel => document.querySelector(sel + " .ink-pen").width, P1);
    await page.click('[data-act="pdr-zoom"][data-id="1"]'); await page.waitForTimeout(900);
    const w1 = await page.evaluate(sel => { const c = document.querySelector(sel + " .ink-pen"); return c ? c.width : 0; }, P1);
    ok(w1 > w0 && await alphaAt(page, P1 + " .ink-pen", 0.4, 0.31) > 0, `after zooming in the ink is redrawn at the new size, in the same place (${w0} -> ${w1})`);
    // Pen off: the page is a page again
    await page.click('[data-act="ink-mode"]'); await page.waitForTimeout(80);
    ok(await page.locator("#inkBar").count() === 0 && await page.evaluate(sel => getComputedStyle(document.querySelector(sel)).pointerEvents, P1) === "none", "Pen off: the tools go and the text can be selected again");
    await page.evaluate(() => dlg.close()); await page.waitForTimeout(200);
    ok(await page.evaluate(() => (state.files.f1.ink || []).length === 2), "closing the reader saves");
    // reload
    await page.reload(); page = await open(ctx, page);
    ok(await page.evaluate(() => (state.files.f1.ink || []).length === 2), "the ink survives a reload");
    await openReader(page);
    ok(await inked(page, P1 + " .ink-pen") > 50 && await inked(page, P1 + " .ink-hlc") > 50, "and is drawn when the PDF opens again");
    await page.evaluate(() => dlg.close()); await page.waitForTimeout(150);

    /* ---------- On a note ---------- */
    await page.evaluate(() => { ui.tab = "notes"; render(); }); await page.waitForTimeout(250);
    await page.locator('.note[data-note="n1"] .note-body').click(); await page.waitForTimeout(250);
    ok(await page.locator('.note.editing [data-act="ink-note"]').count() === 1 && /Draw/.test(await page.locator('.note.editing [data-act="ink-note"]').textContent()), "an open note has Draw");
    await page.click('.note.editing [data-act="ink-note"]'); await page.waitForTimeout(300);
    ok(await page.evaluate(() => dlg.open && !!dlg.querySelector(".ink-sheet #inkPad canvas")), "Draw opens a drawing page");
    ok(await page.evaluate(() => { const r = document.querySelector("#inkPaper").getBoundingClientRect(); return Math.abs(r.height / r.width - 4 / 3) < 0.02; }), "a sheet of paper (3:4)");
    ok(await page.locator('#inkBar [data-act="ink-tool"][data-id="erase"][aria-pressed="true"]').count() === 1, "the tool last used (the eraser) is remembered");
    await page.click('[data-act="ink-tool"][data-id="pen"]');
    await stroke(page, "#inkPad", line(0.1, 0.1, 0.8, 0.2)); await stroke(page, "#inkPad", line(0.1, 0.3, 0.5, 0.5)); await page.waitForTimeout(100);
    await stroke(page, "#inkPad", line(0.1, 0.7, 0.9, 0.7), "touch"); await page.waitForTimeout(100);
    ok(await page.evaluate(() => window.__sbInk.session().store.list().length === 2), "two Pencil strokes on the note (the finger did nothing)");
    await page.click('[data-act="ink-finger"]'); await page.waitForTimeout(80);
    await stroke(page, "#inkPad", line(0.1, 0.8, 0.9, 0.8), "touch"); await page.waitForTimeout(100);
    ok(await page.evaluate(() => window.__sbInk.session().store.list().length === 3) && await page.evaluate(() => getComputedStyle(document.querySelector("#inkPad")).touchAction) === "none", "Draw with Finger: a finger draws (and the page doesn't scroll under it)");
    await page.click('[data-act="ink-undo"]'); await page.waitForTimeout(80);
    await page.click('[data-act="ink-finger"]'); await page.waitForTimeout(80);
    ok(await page.evaluate(() => window.__sbInk.session().store.list().length === 2), "Undo on the note");
    ok(await inked(page, "#inkPad .ink-pen") > 50, "drawn on the page");
    await page.click('.ink-sheet [data-act="close"]'); await page.waitForTimeout(300);
    ok(await page.evaluate(() => (state.notes.n1.ink || []).length === 2 && state.notes.n1.text === "Cell parts"), "Done saves the drawing on the note (its text kept)");
    ok(await page.locator('.note[data-note="n1"] .ink-thumb svg path').count() === 2, "the open note shows the drawing");
    ok(/Edit Drawing/.test(await page.locator('.note.editing .ink-nbar [data-act="ink-note"]').textContent()), "and offers Edit Drawing");
    await page.evaluate(() => window.__sbProStudy.saveNoteText()); await page.waitForTimeout(200);
    ok(await page.locator('.note[data-note="n1"]:not(.editing) .ink-thumb svg path').count() === 2, "the board shows the drawing on the note");
    await page.reload(); page = await open(ctx, page);
    await page.evaluate(() => { ui.tab = "notes"; render(); }); await page.waitForTimeout(250);
    ok(await page.evaluate(() => (state.notes.n1.ink || []).length === 2) && await page.locator('.note[data-note="n1"] .ink-thumb svg path').count() === 2, "the drawing survives a reload");
    ok(page.errs.length === 0, "no console errors (pen): " + page.errs.join(" | "));
    await ctx.close();

    /* ---------- Dark mode ---------- */
    const dctx = await mkCtx({pen: true, dark: true});
    const dk = await open(dctx);
    await dk.evaluate(() => { ui.tab = "notes"; render(); }); await dk.waitForTimeout(250);
    ok(await dk.evaluate(() => document.documentElement.getAttribute("data-theme") === "dark"), "dark mode is on");
    await dk.locator('.note[data-note="n1"] .note-body').click(); await dk.waitForTimeout(250);
    await dk.click('.note.editing [data-act="ink-note"]'); await dk.waitForTimeout(300);
    await dk.click('[data-act="ink-tool"][data-id="pen"]'); await dk.click('[data-act="ink-color"][data-id="ink"]');
    await stroke(dk, "#inkPad", line(0.2, 0.2, 0.8, 0.3)); await dk.waitForTimeout(100);
    const contrast = await dk.evaluate(() => {
      const c = document.querySelector("#inkPad .ink-pen"), g = c.getContext("2d"), d = g.getImageData(0, 0, c.width, c.height).data; let px = null;
      for (let i = 3; i < d.length; i += 4) if (d[i] > 200) { px = [d[i - 3], d[i - 2], d[i - 1]]; break; }
      const bg = getComputedStyle(document.querySelector("#inkPaper")).backgroundColor.match(/\d+/g).map(Number);
      const L = ([r, g2, b]) => [r, g2, b].map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }).reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0);
      if (!px) return 0; const a = L(px), b = L(bg); return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    });
    ok(contrast > 7, "dark mode: black ink on the note's paper stays readable (contrast " + contrast.toFixed(1) + ")");
    await dk.click('.ink-sheet [data-act="close"]'); await dk.waitForTimeout(300);
    ok(await dk.locator('.note[data-note="n1"] .ink-thumb svg path').count() === 1, "dark mode: the drawing shows on the note");
    ok(dk.errs.length === 0, "no console errors (dark): " + dk.errs.join(" | "));
    await dctx.close();

    /* ---------- Turn Into Typed Notes (the Photo to Note AI, given the drawing as a PNG) ---------- */
    const actx = await mkCtx({pen: true});
    const bodies = [];
    await actx.route(/generativelanguage\.googleapis\.com/, route => { bodies.push(route.request().postData() || "");
      route.fulfill({status: 200, contentType: "application/json", body: JSON.stringify({candidates: [{content: {parts: [{text: JSON.stringify({title: "Cell Parts", notes: "• Mitochondria make ATP", course: "", dates: []})}]}, finishReason: "STOP"}]})}); });
    await actx.addInitScript(() => { localStorage.setItem("studyboard:aiKeys", JSON.stringify({gemini: "AIzaTESTTESTTESTTESTTESTTEST12345"})); localStorage.setItem("studyboard:aiConsent", JSON.stringify({gemini: {v: 1, at: 1}})); });
    const ai = await open(actx);
    await ai.evaluate(() => { ui.tab = "notes"; render(); }); await ai.waitForTimeout(250);
    await ai.locator('.note[data-note="n1"] .note-body').click(); await ai.waitForTimeout(250);
    await ai.click('.note.editing .ink-nbar [data-act="ink-note"]'); await ai.waitForTimeout(300);
    ok(await ai.locator('.ink-sheet [data-act="ink-typed"]').count() === 1, "with AI set up, the drawing page offers Turn Into Typed Notes");
    await stroke(ai, "#inkPad", line(0.1, 0.1, 0.8, 0.2)); await ai.waitForTimeout(100);
    await ai.click('[data-act="ink-typed"]');
    await ai.waitForSelector("#pnText", {timeout: 15000});
    ok(/Mitochondria make ATP/.test(await ai.locator("#pnText").inputValue()) && bodies.some(b => /image\/png/.test(b)), "the drawing goes to the AI as a picture and comes back as typed notes to review");
    ok(await ai.evaluate(() => (state.notes.n1.ink || []).length === 1), "the drawing was saved first");
    ok(ai.errs.length === 0, "no console errors (typed notes): " + ai.errs.join(" | "));
    await actx.close();

    /* ---------- Free plan ---------- */
    const fseed = SEED(); fseed.notes[0].ink = [{id: "s1", t: "pen", c: "blue", w: 35, d: "w-Bw-BgBw7Fw-BAg6HnfG", at: 1}];
    const fctx = await browser.newContext({viewport: {width: 1100, height: 900}, serviceWorkers: "block"});
    await fctx.addInitScript(seed => { try { if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("coursework:v2", JSON.stringify(seed)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); }
      localStorage.setItem("studyboard:ink-test", "1"); localStorage.setItem("studyboard:paywall-test", "1"); } catch (e) {} }, fseed);
    const free = await open(fctx);
    await free.evaluate(() => { ui.tab = "notes"; render(); }); await free.waitForTimeout(250);
    ok(await free.locator('.note[data-note="n1"] .ink-thumb svg').count() === 1, "free: a drawing already on a note is still shown");
    await free.locator('.note[data-note="n1"] .note-body').click(); await free.waitForTimeout(250);
    ok(await free.locator('.note.editing .ink-nbar [data-act="ink-note"] .pro-badge').count() === 1, "free: Edit Drawing carries the Pro badge");
    await free.click('.note.editing .ink-nbar [data-act="ink-note"]'); await free.waitForTimeout(300);
    ok(await free.evaluate(() => !!dlg.querySelector(".plan-sheet") && !dlg.querySelector(".ink-sheet")), "free: it opens the Pro sheet, not the drawing page");
    ok(free.errs.length === 0, "no console errors (free): " + free.errs.join(" | "));
    await fctx.close();
  } finally { await browser.close(); server.close(); }
  console.log(`\nipad-pen.e2e: ${n} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
