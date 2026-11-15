// node tests/file-viewer.e2e.js: on a phone, stored files open inside Studyboard (fileViewer, src/js/01-notes.js) instead of in a
// new browser window, which shows nothing in the iPhone and Android apps or the Home Screen web app. PDFs are drawn page by page,
// pictures and text show as they are, anything else offers a download; a computer keeps its Open link.
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const {PDFDocument, StandardFonts} = require("pdf-lib");
const root = path.join(__dirname, "..");
const MIME = {".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".css": "text/css", ".woff2": "font/woff2", ".wasm": "application/wasm"};
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  res.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
const rev = (id, name, type, size) => ({assetId: id, name, type, size, at: 1});
const file = (id, name, type, asset, size) => ({id, name, courseId: "c1", folderId: "notes", kind: "file", taskIds: [], desc: "", url: "", created: 1, revs: [rev(asset, name, type, size)]});
const SEED = {v: 2, updated: 1, decks: [], notes: [], tasks: [], settings: {}, courses: [{id: "c1", name: "Biology", code: "BIO101", color: "#3B6FE0"}],
  files: [file("fpdf", "Lecture 4.pdf", "application/pdf", "u1/a-l4.pdf", 3000), file("fimg", "Whiteboard.png", "image/png", "u1/a-wb.png", PNG.length),
    file("ftxt", "Notes.txt", "text/plain", "u1/a-notes.txt", 40), file("fzip", "Project.zip", "application/zip", "u1/a-proj.zip", 30),
    file("floc", "Draft.pdf", "application/pdf", "local:abc", 3000)]};
const cachePut = (page, list) => page.evaluate(list => new Promise((res, rej) => {
  const r = indexedDB.open("studyboard-files", 1);
  r.onupgradeneeded = () => r.result.createObjectStore("f");
  r.onsuccess = () => { const tx = r.result.transaction("f", "readwrite"); list.forEach(([k, bytes, type]) => tx.objectStore("f").put({blob: new Blob([new Uint8Array(bytes)], {type}), size: bytes.length, type, at: Date.now()}, k)); tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error); };
  r.onerror = () => rej(r.error);
}), list);
const act = (p, a, id) => p.evaluate(([a, id]) => { const b = document.createElement("button"); b.dataset.act = a; b.dataset.id = id; b.hidden = true; document.body.appendChild(b); b.click(); b.remove(); }, [a, id]);

(async () => {
  const doc = await PDFDocument.create(), font = await doc.embedFont(StandardFonts.Helvetica);
  for (let i = 1; i <= 3; i++) doc.addPage([612, 792]).drawText("Lecture 4, page " + i, {x: 72, y: 700, size: 24, font});
  const PDF = Buffer.from(await doc.save());
  await new Promise(r => server.listen(0, r));
  const URL0 = "http://localhost:" + server.address().port + "/";
  const b = await chromium.launch({executablePath});
  try {
    const open = async phone => {
      const ctx = await b.newContext(phone ? {viewport: {width: 390, height: 844}, deviceScaleFactor: 2, isMobile: true, hasTouch: true, acceptDownloads: true} : {viewport: {width: 1280, height: 800}});
      await ctx.addInitScript(s => { if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("coursework:v2", JSON.stringify(s)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("studyboard:tour", "done"); } }, SEED);
      const p = await ctx.newPage(); p.errs = []; p.on("pageerror", e => p.errs.push(e.message));
      await p.goto(URL0); await p.waitForTimeout(2000);
      await cachePut(p, [["u1/a-l4.pdf", [...PDF], "application/pdf"], ["u1/a-wb.png", [...PNG], "image/png"], ["u1/a-notes.txt", [...Buffer.from("Mitochondria: the powerhouse of the cell.")], "text/plain"], ["u1/a-proj.zip", [...Buffer.from("PK not really a zip")], "application/zip"]]);
      await p.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
      return {ctx, p};
    };

    { // a phone
      const {ctx, p} = await open(true);
      await act(p, "f-open", "fimg"); await p.waitForTimeout(500);
      ok(await p.evaluate(() => !!dlg.querySelector('[data-act="f-view"]') && !dlg.querySelector('.fs-acts a[data-asset]')), "a file's details on a phone have Open (in the app), not a new-window link");
      ok(await p.evaluate(() => !!dlg.querySelector('[data-act="f-save"]')), "and Download (Share or Open In… in the app) next to it");
      await act(p, "f-open", "fpdf"); await p.waitForTimeout(500);
      const pdfActs = await p.evaluate(() => [...dlg.querySelectorAll(".fs-acts [data-act], .fs-acts a")].map(x => x.dataset.act || "link"));
      ok(!pdfActs.includes("link"), `a PDF's details on a phone have no new-window link either (${pdfActs.join(", ")})`);
      // Pro's reader is tested on its own; here the free plan's viewer
      await p.evaluate(() => { if (window.SBPRO) SBPRO.canRead = () => false; });
      await act(p, "f-view", "fpdf");
      await p.waitForFunction(() => document.querySelectorAll("#fvBody .fv-page canvas").length >= 1, null, {timeout: 20000}).catch(() => {});
      const pdf = await p.evaluate(() => ({pages: document.querySelectorAll("#fvBody .fv-page").length, drawn: document.querySelectorAll("#fvBody .fv-page canvas").length, label: (document.querySelector("#fvBody .fv-page") || {}).getAttribute && document.querySelector("#fvBody .fv-page").getAttribute("aria-label"), w: (document.querySelector("#fvBody .fv-page canvas") || {}).width || 0}));
      ok(pdf.pages === 3 && pdf.drawn >= 1 && pdf.w > 300, `a PDF opens in the app, page by page (${JSON.stringify(pdf)})`);
      ok(pdf.label === "Page 1 of 3", "each page is labelled for screen readers");
      const sideways = await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
      ok(!sideways, "no sideways scrolling on the phone");
      await act(p, "f-view", "fimg");
      await p.waitForFunction(() => { const i = document.querySelector("#fvBody img.fv-img"); return i && i.complete && i.naturalWidth > 0; }, null, {timeout: 8000}).catch(() => {});
      ok(await p.evaluate(() => { const i = document.querySelector("#fvBody img.fv-img"); return !!(i && i.naturalWidth > 0); }), "a picture shows");
      await act(p, "f-view", "ftxt"); await p.waitForTimeout(800);
      ok((await p.evaluate(() => (document.querySelector("#fvBody pre.fv-text") || {}).textContent || "")).includes("powerhouse"), "a text file shows its text");
      await act(p, "f-view", "fzip"); await p.waitForTimeout(800);
      ok(/can't show this kind of file/.test(await p.evaluate(() => (document.getElementById("fvBody") || {}).textContent || "")), "another kind of file says so and offers to download it");
      const dl = p.waitForEvent("download", {timeout: 8000}).catch(() => null);
      await p.evaluate(() => { const b = dlg.querySelector('[data-act="f-save"]'); if (b) b.click(); });
      const d = await dl;
      ok(d && d.suggestedFilename() === "Project.zip", "Download saves it with its own name");
      await act(p, "f-view", "floc"); await p.waitForTimeout(800);
      ok(/still on the computer it was added from/.test(await p.evaluate(() => (document.getElementById("fvBody") || {}).textContent || "")), "a file not uploaded yet says it's still on the computer it came from");
      ok(!p.errs.length, "no page errors: " + p.errs.join(" | "));
      await ctx.close();
    }
    { // a computer keeps its Open link
      const {ctx, p} = await open(false);
      await act(p, "f-open", "fpdf"); await p.waitForTimeout(500);
      ok(await p.evaluate(() => !dlg.querySelector('[data-act="f-view"]') && !!dlg.querySelector("a[data-asset]")), "on a computer, the file's details keep the Open link");
      ok(!p.errs.length, "no page errors: " + p.errs.join(" | "));
      await ctx.close();
    }
    console.log("file-viewer.e2e: " + n + " checks passed");
  } finally { await b.close(); server.close(); }
})().catch(e => { console.error(e); process.exit(1); });
