// node tests/office-files.e2e.js [screenshot-dir]
// Word, PowerPoint and Excel in Files: an upload that hits a storage limit offers Google Drive or OneDrive, Preview (free)
// draws the file in the app, and the Pro reader opens it with highlights
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const csp = require("../scripts/csp");
const FX = require("./office-fixture");
const root = path.join(__dirname, "..");
const shots = path.resolve(process.argv[2] || path.join(require("os").tmpdir(), "office-files-shots"));
fs.mkdirSync(shots, {recursive: true});
const MIME = {".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".css": "text/css", ".woff2": "font/woff2", ".webmanifest": "application/manifest+json"};
// pro: every Pro feature unlocked (as the other Pro tests do); otherwise the free plan
const serve = pro => http.createServer((req, res) => {
  const u = new URL(req.url, "http://x"); let p = decodeURIComponent(u.pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  res.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"});
  if (pro && (p === "/index.html" || /^\/bundle\/[^/]+\.js$/.test(p))) { res.end((/\.html$/.test(p) ? csp.apply : String)(fs.readFileSync(f, "utf8").replace("const PRO_ENFORCED = true;", "const PRO_ENFORCED = false;"))); return; }
  fs.createReadStream(f).pipe(res);
});
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const rev = (id, name, type, size) => ({assetId: id, name, type, size, at: 1});
const SEED = {v: 2, updated: 1, decks: [], notes: [], tasks: [], settings: {}, courses: [{id: "c1", name: "Biology", code: "BIO101", color: "#3B6FE0"}],
  files: [{id: "fd", name: "Essay draft.docx", courseId: "c1", folderId: "assignments", kind: "file", taskIds: [], desc: "", url: "", created: 2, revs: [rev("u1/a-doc.docx", "Essay draft.docx", DOCX, 9000)]},
    {id: "fp", name: "Lecture 3.pptx", courseId: "c1", folderId: "notes", kind: "file", taskIds: [], desc: "", url: "", created: 1, revs: [rev("u1/a-ppt.pptx", "Lecture 3.pptx", "application/vnd.openxmlformats-officedocument.presentationml.presentation", 9000)]}]};
function seedInit(seed){
  try { if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("coursework:v2", JSON.stringify(seed)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("studyboard:tour", "done"); } } catch (e) {}
}
// The files' bytes, kept on this device the way opened files are (module 01-accounts.js, FCACHE), so no account is needed
const cachePut = (page, list) => page.evaluate(list => new Promise((res, rej) => {
  const r = indexedDB.open("studyboard-files", 1);
  r.onupgradeneeded = () => r.result.createObjectStore("f");
  r.onsuccess = () => { const tx = r.result.transaction("f", "readwrite"); list.forEach(([k, bytes, type]) => tx.objectStore("f").put({blob: new Blob([new Uint8Array(bytes)], {type}), size: bytes.length, type, at: Date.now()}, k)); tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error); };
  r.onerror = () => rej(r.error);
}), list);
(async () => {
  const free = serve(false), pro = serve(true);
  await new Promise(r => free.listen(0, r)); await new Promise(r => pro.listen(0, r));
  const browser = await chromium.launch({executablePath});
  const docx = [...FX.docx()], pptx = [...FX.pptx()];
  try {
    const open = async (srv, w) => {
      const ctx = await browser.newContext({viewport: {width: w || 1280, height: 860}, serviceWorkers: "block"});
      await ctx.addInitScript(seedInit, SEED);
      const page = await ctx.newPage(); page.errs = [];
      page.on("pageerror", e => page.errs.push(e.message));
      await page.goto("http://localhost:" + srv.address().port + "/"); await page.waitForFunction(() => window.__sbMath && window.SBOFFICE);
      await cachePut(page, [["u1/a-doc.docx", docx, DOCX], ["u1/a-ppt.pptx", pptx, "application/octet-stream"]]);
      await page.evaluate(() => { const M = window.__sbMath; M.ui.tab = "files"; M.ui.fCourse = "all"; M.render(); }); await page.waitForTimeout(400);
      return {ctx, page};
    };

    /* Free plan */
    const {ctx, page} = await open(free);
    ok(await page.locator('.frow[data-fid="fd"] .ficon.k-doc').count() === 1 && await page.locator('.frow[data-fid="fp"] .ficon.k-slides').count() === 1, "Word and PowerPoint files get their own icons");
    ok(await page.locator('.frow[data-fid="fd"] [data-act="f-preview"]').count() === 1, "a Word file has Preview in its row");
    await page.click('.frow[data-fid="fd"] [data-act="f-preview"]');
    await page.waitForSelector("#ofvBody .ofv-page .ofc-page", {timeout: 15000});
    const pv = await page.evaluate(() => ({pages: document.querySelectorAll("#ofvBody .ofv-page").length, text: document.querySelector("#ofvBody").innerText, cap: document.querySelector("#ofvBody figcaption").textContent,
      fits: [...document.querySelectorAll("#ofvBody .ofv-frame")].every(f => f.getBoundingClientRect().width <= document.querySelector("#ofvBody").clientWidth)}));
    ok(pv.pages >= 1 && pv.text.length > 40 && /Page 1/.test(pv.cap), "Preview draws the document's pages, labelled: " + pv.pages + " pages");
    ok(pv.fits, "each page is scaled to fit the sheet");
    ok(await page.locator('.ofv-sheet [data-act="pdr-open"]').count() === 1, "Preview offers highlighting (Pro)");
    await page.screenshot({path: path.join(shots, "preview-docx.png")});
    await page.click('.ofv-sheet [data-act="pdr-open"]'); await page.waitForTimeout(400);
    ok(await page.evaluate(() => !!document.querySelector("dialog .plan-sheet")), "on the free plan that opens the Pro sheet");
    await page.evaluate(() => document.querySelector("dialog").close()); await page.waitForTimeout(150);
    await page.click('.frow[data-fid="fp"] [data-act="f-preview"]');
    await page.waitForSelector("#ofvBody .ofc-pptx", {timeout: 15000});
    ok(/Slide 1/.test(await page.locator("#ofvBody figcaption").first().textContent()), "slides are labelled as slides");
    await page.screenshot({path: path.join(shots, "preview-pptx.png")});
    await page.evaluate(() => document.querySelector("dialog").close()); await page.waitForTimeout(150);
    // No account here, so there's no file storage: the upload offers Google Drive or OneDrive
    await page.setInputFiles("#fUploadIn", {name: "Lab report.docx", mimeType: DOCX, buffer: FX.docx()});
    await page.waitForSelector("dialog[open] .cl-sheet", {timeout: 5000});
    const sheet = await page.evaluate(() => ({title: document.querySelector("dialog[open] .sheet-head, dialog[open] h2").textContent, text: document.querySelector("dialog[open] .cl-sheet").innerText,
      btns: [...document.querySelectorAll('dialog[open] [data-act="cl-full-save"]')].map(b => b.dataset.id)}));
    ok(/Keep It in Your Cloud|Sign In to Keep Files/.test(sheet.title) && /Lab report\.docx/.test(sheet.text), "a file with nowhere to go is offered to the cloud by name: " + sheet.title);
    ok(JSON.stringify(sheet.btns) === '["google","microsoft"]' && /Connect Google Drive/.test(sheet.text) && /Connect OneDrive/.test(sheet.text), "with Connect Google Drive and Connect OneDrive");
    // without an account, signing in (free) leads, since it keeps files in Studyboard and the cloud connects through it
    ok(/sign in first/i.test(sheet.text) || (/Sign In \(Free\) to Keep Files/.test(sheet.text) && await page.locator('dialog[open] .cl-sheet [data-act="sb-signin"]').count() === 1), "and offers signing in, since the cloud connects to an account");
    await page.screenshot({path: path.join(shots, "cloud-offer.png")});
    ok(!page.errs.length, "free: no page errors: " + page.errs.join(" | "));
    await ctx.close();

    /* Pro: the reader */
    const P = await open(pro);
    const pp = P.page;
    await pp.evaluate(async bytes => { await window.__sbProStudy.idbSet("pdf:u1/a-ppt.pptx", new Blob([new Uint8Array(bytes)])); }, pptx);
    ok(await pp.locator('.frow[data-fid="fp"] [data-act="pdr-open"]').count() === 1 && await pp.locator('.frow[data-fid="fp"] [data-act="pde-edit"]').count() === 0, "Pro: a PowerPoint file has Read, and no PDF Edit");
    await pp.click('.frow[data-fid="fp"] [data-act="pdr-open"]');
    await pp.waitForSelector(".pdr-page .pdr-office .ofc-page", {timeout: 15000});
    const rd = await pp.evaluate(() => ({pages: document.querySelectorAll(".pdr-page").length, of: document.querySelector("#pdrOf").textContent, label: document.querySelector(".pdr-page").getAttribute("aria-label"),
      edit: !!document.querySelector("#pdeBtn"), dl: !!document.querySelector('[data-act="pde-dl"]')}));
    ok(rd.pages >= 1 && /of \d/.test(rd.of) && /Slide 1/.test(rd.label), "the reader shows the slides: " + JSON.stringify(rd));
    ok(!rd.edit && !rd.dl, "PDF-only tools (Edit, Download PDF) aren't offered for slides");
    // Highlight a word on the slide
    await pp.click('[data-act="pdr-mode"][data-id="mark"]'); await pp.waitForTimeout(150);
    const sel = await pp.evaluate(() => {
      const w = document.createTreeWalker(document.querySelector(".pdr-page .pdr-office"), NodeFilter.SHOW_TEXT); let t;
      while ((t = w.nextNode())) if (t.data.trim().length > 3) break;
      if (!t) return ""; const r = document.createRange(); r.setStart(t, 0); r.setEnd(t, Math.min(t.data.length, 12));
      const s = getSelection(); s.removeAllRanges(); s.addRange(r); return s.toString();
    });
    ok(sel.length > 3, "text on a slide can be selected: " + sel);
    const b = await pp.evaluate(() => { const r = getSelection().getRangeAt(0).getBoundingClientRect(); return {x: r.right - 2, y: r.top + r.height / 2}; });
    await pp.mouse.move(b.x, b.y); await pp.mouse.down(); await pp.mouse.up(); await pp.waitForTimeout(300);
    await pp.evaluate(() => { const r = document.createRange(), w = document.createTreeWalker(document.querySelector(".pdr-page .pdr-office"), NodeFilter.SHOW_TEXT); let t; while ((t = w.nextNode())) if (t.data.trim().length > 3) break; r.setStart(t, 0); r.setEnd(t, Math.min(t.data.length, 12)); const s = getSelection(); s.removeAllRanges(); s.addRange(r); document.querySelector(".pdr-pages").dispatchEvent(new MouseEvent("mouseup", {bubbles: true})); });
    await pp.waitForSelector(".pdr-pop [data-act]", {timeout: 5000});
    const add = await pp.$('.pdr-pop [data-act="pdr-hl-add"], .pdr-pop [data-act="pdr-mk-add"]'); await add.click(); await pp.waitForTimeout(300);
    ok(await pp.evaluate(() => document.querySelectorAll(".pdr-page .pdr-hl i").length) >= 1, "a highlight is drawn on the slide");
    ok(await pp.evaluate(() => (window.__sbProStudy.state().files.fp.hl || []).length === 1), "and saved with the file");
    await pp.screenshot({path: path.join(shots, "reader-pptx.png")});
    // what the Office reader left out is said above the pages; a file it can't read gets a short, specific message
    await pp.evaluate(() => { const O = window.SBOFFICE, r0 = O.render; window.__r0 = r0; O.render = async (...a) => Object.assign(await r0(...a), {warnings: ["Only the first 40 slides are shown."]}); window.__sbProStudy.dlg().close(); });
    await pp.click('.frow[data-fid="fp"] [data-act="pdr-open"]'); await pp.waitForSelector(".pdr-pages .pdr-warn", {timeout: 15000});
    ok(/first 40 slides/.test(await pp.textContent(".pdr-pages .pdr-warn")), "the Pro reader shows the Office reader's warnings");
    await pp.evaluate(() => { window.SBOFFICE.render = async () => { throw new Error("This file looks damaged (not a zip)"); }; window.__sbProStudy.dlg().close(); });
    await pp.click('.frow[data-fid="fp"] [data-act="pdr-open"]'); await pp.waitForFunction(() => /looks damaged/.test((document.querySelector(".pdr-pages .pdr-wait") || {}).textContent || ""), null, {timeout: 15000});
    ok(true, "and a damaged file says so");
    await pp.evaluate(() => { window.SBOFFICE.render = window.__r0; });
    ok(!pp.errs.length, "Pro: no page errors: " + pp.errs.join(" | "));
    await P.ctx.close();
  } finally { await browser.close(); free.close(); pro.close(); }
  console.log(`\n${n} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
