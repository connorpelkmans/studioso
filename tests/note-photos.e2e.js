// node tests/note-photos.e2e.js (Playwright + Chromium; file storage is stubbed) Pro notes
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const root = path.join(__dirname, ".."), SHOTS = process.env.SHOTS || path.join(require("os").tmpdir(), "note-photo-shots");
fs.mkdirSync(SHOTS, {recursive: true});
const MIME = {".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".webmanifest": "application/manifest+json", ".png": "image/png", ".css": "text/css", ".woff2": "font/woff2", ".svg": "image/svg+xml", ".webp": "image/webp"};
const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x"); let p = decodeURIComponent(u.pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  res.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
// A 40x30 orange PNG, made by the test page itself
const SEED = {v: 2, courses: [{id: "c1", name: "Anatomy", code: "BIO120", color: "#2F8A4E"}], settings: {}, updated: 1, tasks: [], decks: [],
  files: [{id: "f1", name: "Lecture 4 slides.pdf", courseId: "c1", folderId: "notes", kind: "file", revs: [{assetId: "a-pdf", size: 10, type: "application/pdf", at: 1, name: "Lecture 4 slides.pdf"}], taskIds: [], created: 2},
          {id: "f2", name: "Lab manual", courseId: "", folderId: "other", kind: "link", url: "https://example.com/lab", revs: [], taskIds: [], created: 1}],
  notes: [{id: "n1", text: "Heart anatomy\nFour chambers.", color: "yellow", x: 40, y: 40, z: 1, rot: 0, courseId: "c1", created: 1}]};
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  const mk = async free => {
    const ctx = await browser.newContext({viewport: {width: 1280, height: 900}});
    await ctx.route(/supabase\.co/, r => r.abort());
    await ctx.addInitScript(([seed, free]) => { try { if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("coursework:v2", JSON.stringify(seed)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("studyboard:tour", "done"); }
      if (free) localStorage.setItem("studyboard:paywall-test", "1"); } catch (e) {} }, [SEED, free]);
    const page = await ctx.newPage(); page.errs = []; page.on("pageerror", e => page.errs.push(e.message));
    await page.goto(base); await page.waitForFunction(() => window.__sbProStudy && window.__sbNotePhotos);
    await page.evaluate(free => {
      if (!free) SBPRO.locked = () => false;
      const T = window.__sbProStudy; Object.defineProperty(window, "state", {get: () => T.state(), configurable: true});
      window.__bytes = {};
      const NP = window.__sbNotePhotos; NP.IO.upload = async (list, opts) => { const made = []; for (const f of list) { const id = "ph" + Math.random().toString(36).slice(2, 8), aid = "asset-" + id;
        window.__bytes[aid] = new Uint8Array(await f.arrayBuffer());
        const file = NP.normFile({id, name: f.name, courseId: opts.courseId || "", folderId: opts.folderId || "other", kind: "file", revs: [{assetId: aid, size: f.size, type: f.type || "image/png", at: Date.now(), name: f.name}], taskIds: [], created: Date.now()});
        T.applyChanges([{kind: "file", id, after: file}], ""); made.push(file); } window.__lastOpts = opts; return made; };
      NP.IO.bytes = async id => { if (!window.__bytes[id]) throw new Error("none"); return window.__bytes[id]; };
      window.__png = async (color, name) => { const c = document.createElement("canvas"); c.width = 40; c.height = 30; const g = c.getContext("2d"); g.fillStyle = color; g.fillRect(0, 0, 40, 30);
        const b = await new Promise(r => c.toBlob(r, "image/png")); return new File([b], name || "board.png", {type: "image/png"}); };
      T.ui.tab = "notes"; T.ui.noteBoard = ""; T.render();
    }, free);
    await page.waitForSelector('.note[data-note="n1"]'); await page.waitForTimeout(300);
    return {ctx, page};
  };
  const edit = async page => { await page.click('.note[data-note="n1"] .note-body'); await page.waitForSelector('.note.editing[data-note="n1"] #noteText'); await page.waitForTimeout(150); };
  const note = page => page.evaluate(() => JSON.parse(JSON.stringify(state.notes.n1)));
  try {
    /* Pro */
    {
      const {ctx, page} = await mk(false);
      await edit(page);
      const bar = await page.evaluate(() => [...document.querySelectorAll(".note.editing .np-bar .btn")].map(b => b.textContent.trim()));
      ok(bar.length === 2 && bar[0] === "Add Photo" && bar[1] === "Link a File", "an open note has Add Photo and Link a File: " + bar.join(", "));
      await page.evaluate(async () => { await window.__sbNotePhotos.addPhotos("n1", [await window.__png("#E8743B", "whiteboard.png")]); });
      await page.waitForTimeout(400);
      let nt = await note(page);
      ok(nt.photos && nt.photos.length === 1, "the photo is on the note");
      ok(await page.evaluate(id => !!state.files[id] && state.files[id].courseId === "c1" && window.__lastOpts.folderId === "notes", nt.photos[0]), "it's stored as a file in the note's course, under Lecture Notes");
      ok(await page.evaluate(() => { const i = document.querySelector(".note.editing .np-photos img"); return !!i && /^blob:/.test(i.src); }), "the open note shows the photo");
      ok(await page.evaluate(() => !!document.querySelector(".note.editing .np-x")), "an open note has a remove button on each photo");
      await page.evaluate(() => { const t = document.querySelector("#noteText"); t.focus(); const at = t.value.indexOf("\n"); t.setSelectionRange(at, at); });
      await page.click('.note.editing [data-act="np-link"]'); await page.waitForSelector("#dlg .np-link-sheet #npList .np-opt");
      ok(await page.evaluate(() => document.querySelectorAll("#npList .np-opt").length === 3), "Link a File lists every file and link in the app");
      await page.fill("#npQ", "slides"); await page.waitForTimeout(80);
      ok(await page.evaluate(() => document.querySelectorAll("#npList .np-opt").length === 1), "search narrows the list");
      await page.screenshot({path: path.join(SHOTS, "1-link-sheet.png")});
      await page.click("#npList .np-opt"); await page.waitForTimeout(200);
      const txt = await page.evaluate(() => document.querySelector("#noteText").value);
      ok(txt.startsWith("Heart anatomy [[Lecture 4 slides.pdf]]\n"), "the link is typed where the cursor was: " + JSON.stringify(txt.slice(0, 50)));
      await page.evaluate(async () => { const t = document.querySelector("#noteText"); const dt = new DataTransfer(); dt.items.add(await window.__png("#3B6FE0", "image.png")); t.dispatchEvent(new ClipboardEvent("paste", {clipboardData: dt, bubbles: true, cancelable: true})); });
      await page.waitForTimeout(400);
      nt = await note(page);
      ok(nt.photos.length === 2, "pasting an image into the note adds it as a photo");
      ok(/^Pasted photo \d{4}-\d\d-\d\d/.test(await page.evaluate(id => state.files[id].name, nt.photos[1])), "a pasted photo gets a dated name");
      ok(nt.text.includes("[[Lecture 4 slides.pdf]]"), "the typed link was kept when the photo was added");
      await page.screenshot({path: path.join(SHOTS, "2-editing.png")});
      await page.click('.note.editing [data-act="note-done"]'); await page.waitForTimeout(250);
      ok(await page.evaluate(() => document.querySelectorAll('.note[data-note="n1"]:not(.editing) .np-photos img[src^="blob:"]').length === 2), "the resting note shows both photos");
      ok(await page.evaluate(() => !!document.querySelector('.note[data-note="n1"] .note-link.k-file')), "the link shows as a file link on the note");
      await page.screenshot({path: path.join(SHOTS, "3-resting.png")});
      await page.click('.note[data-note="n1"] .np-img'); await page.waitForSelector("#dlg .np-sheet .np-big img");
      ok(await page.evaluate(() => !document.querySelector(".note.editing") && /^blob:/.test(document.querySelector(".np-big img").src)), "tapping a photo opens it large without starting to edit");
      await page.screenshot({path: path.join(SHOTS, "4-photo.png")});
      const gone = nt.photos[0];
      await page.click('#dlg [data-act="np-remove"]'); await page.waitForTimeout(250);
      nt = await note(page);
      ok(nt.photos.length === 1 && !nt.photos.includes(gone) && await page.evaluate(id => !!state.files[id], gone), "Remove from Note takes it off the note and keeps the file");
      ok(!page.errs.length, "no page errors " + page.errs.join(" | "));
      await ctx.close();
    }
    /* Free */
    {
      const {ctx, page} = await mk(true);
      await edit(page);
      ok(await page.evaluate(() => [...document.querySelectorAll(".note.editing .np-bar .btn")].every(b => b.querySelector(".pro-badge"))), "a free account sees both buttons with a Pro badge");
      await page.click('.note.editing [data-act="np-add"]'); await page.waitForTimeout(300);
      ok(await page.evaluate(() => !!document.querySelector("#dlg .plan-sheet")), "Add Photo opens the Pro sheet");
      await page.evaluate(() => document.querySelector("#dlg").close());
      ok(await page.evaluate(() => !state.notes.n1.photos), "nothing was added");
      ok(!page.errs.length, "no page errors " + page.errs.join(" | "));
      await ctx.close();
    }
    console.log(`\n${n} passed`);
  } catch (e) { console.error(e); process.exitCode = 1; }
  finally { await browser.close(); server.close(); }
})();
