// node tests/whiteboard-pro.e2e.js  (Playwright + Chromium; file storage and the AI are stubbed)
// Whiteboard pictures (Pro): the Picture tool adds a picture as a file, it shows on the board, Select moves and resizes it, ink goes over it,
// Draw in Marker redraws it (AI, with the white made see-through) or traces it on this device without AI, and exports include it.
// On a free plan the Picture tool has a Pro badge and opens the Pro sheet, and pictures already on a board still show.
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const root = path.join(__dirname, "..");
const MIME = {".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".png": "image/png", ".css": "text/css", ".svg": "image/svg+xml", ".webp": "image/webp", ".woff2": "font/woff2"};
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  res.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const SEED = {v: 2, courses: [{id: "c1", name: "Biology", code: "BIO 101", color: "#2E9A5A"}], tasks: [], decks: [], files: [], events: [], settings: {}, updated: 1,
  notes: [{id: "wb1", text: "Cells", wb: {v: 1, tpl: "blank"}, courseId: "c1", created: 1, updated: 1}]};
(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  const mk = async (free, seed) => {
    const ctx = await browser.newContext({viewport: {width: 1280, height: 900}});
    await ctx.route(/supabase\.co|googleapis\.com/, r => r.abort());
    await ctx.addInitScript(([seed, free]) => { try { if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("coursework:v2", JSON.stringify(seed)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studyboard:tour", "1"); localStorage.setItem("studyboard:notesView", "wb"); localStorage.setItem("studioso:sb", JSON.stringify("local")); }
      if (free) localStorage.setItem("studyboard:paywall-test", "1"); } catch (e) {} }, [seed || SEED, free]);
    const page = await ctx.newPage(); page.errs = []; page.on("pageerror", e => page.errs.push(e.message));
    await page.goto(base); await page.waitForFunction(() => window.__sbProStudy && window.__sbNotePhotos && window.SBWB && SBWB.pictures);
    await page.evaluate(free => {
      if (!free) SBPRO.locked = () => false;
      const T = window.__sbProStudy; Object.defineProperty(window, "state", {get: () => T.state(), configurable: true});
      window.__bytes = window.__bytes || {};
      const NP = window.__sbNotePhotos, IO = SBWB.pictures.IO;
      IO.upload = async (list, opts) => { const made = []; for (const f of list) { const id = "ph" + Math.random().toString(36).slice(2, 8), aid = "asset-" + id;
        window.__bytes[aid] = new Uint8Array(await f.arrayBuffer());
        const file = NP.normFile({id, name: f.name, courseId: opts.courseId || "", folderId: opts.folderId || "other", kind: "file", revs: [{assetId: aid, size: f.size, type: f.type || "image/png", at: Date.now(), name: f.name}], taskIds: [], created: Date.now()});
        T.applyChanges([{kind: "file", id, after: file}], ""); made.push(file); } window.__lastOpts = opts; return made; };
      IO.bytes = async id => { if (!window.__bytes[id]) throw new Error("none"); return window.__bytes[id]; };
      // a picture: white background, a dark blue square in the middle
      window.__pic = async () => { const c = document.createElement("canvas"); c.width = 400; c.height = 300; const g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, 400, 300); g.fillStyle = "#1D3B8C"; g.fillRect(120, 80, 160, 140);
        const b = await new Promise(r => c.toBlob(r, "image/png")); return new File([b], "diagram.png", {type: "image/png"}); };
      document.querySelectorAll("dialog[open]").forEach(d => d.close());
      T.ui.tab = "notes"; T.render();
    }, free);
    await page.waitForSelector(".wb-stage"); await page.waitForTimeout(300);
    return {ctx, page};
  };
  const items = page => page.evaluate(() => SBWB.board().items);
  try {
    {
      const {ctx, page} = await mk(false);
      ok(await page.locator('.wb-tray [data-wb="pic"]').count() === 1 && await page.locator('.wb-tray [data-wb="pic"] .wb-pro').count() === 0, "Pro: the tray has the Picture tool, no Pro badge");
      await page.evaluate(async () => { await SBWB.pictures.add([await window.__pic()]); });
      await page.waitForTimeout(300);
      let it = (await items(page)).find(i => i.k === "i");
      const f = await page.evaluate(id => state.files[id], it && it.f);
      ok(it && f && /\.webp$/.test(f.name) && f.folderId === "notes" && f.courseId === "c1", "Add a Picture stores it as a file (WebP, in the board's course): " + (f && f.name));
      ok(Math.abs(it.w / it.h - 4 / 3) < 0.02, "it keeps its shape: " + it.w + " x " + it.h);
      ok(await page.locator(".wb-imgs .wb-img img").count() === 1 && await page.locator(".wb-selbar:not([hidden])").count() === 1 && await page.evaluate(() => SBWB.tool()) === "select", "it shows on the board, selected, with Select on");
      ok((await page.locator('.wb-selbar [data-wb="restyle"]').textContent()).includes("Draw in Marker"), "its menu offers Draw in Marker");

      // resize from the corner handle
      const box = await page.evaluate(id => { const b = SBWB.itemBB(SBWB.getI(id)), c = SBWB.cam(), r = document.querySelector(".wb-frame").getBoundingClientRect(); return {x: r.left + b[2] * c.z + c.x, y: r.top + b[3] * c.z + c.y, z: c.z}; }, it.id);
      await page.mouse.move(box.x, box.y); await page.mouse.down(); await page.mouse.move(box.x + 40, box.y + 30, {steps: 4}); await page.mouse.move(box.x + 80, box.y + 60, {steps: 4}); await page.mouse.up(); await page.waitForTimeout(100);
      const it2 = (await items(page)).find(i => i.id === it.id);
      ok(it2.w > it.w * 1.1 && Math.abs(it2.w / it2.h - it.w / it.h) < 0.02, "dragging the corner makes it bigger, same shape: " + it.w + " to " + it2.w);
      // ink goes over it
      await page.evaluate(() => SBWB.setTool("pen"));
      const c = await page.evaluate(id => { const b = SBWB.itemBB(SBWB.getI(id)), c = SBWB.cam(), r = document.querySelector(".wb-frame").getBoundingClientRect(); return {x: r.left + (b[0] + b[2]) / 2 * c.z + c.x, y: r.top + (b[1] + b[3]) / 2 * c.z + c.y}; }, it.id);
      await page.mouse.move(c.x - 60, c.y); await page.mouse.down(); await page.mouse.move(c.x + 60, c.y, {steps: 8}); await page.mouse.up(); await page.waitForTimeout(60);
      ok((await page.evaluate(() => SBWB.board().strokes.length)) === 1 && (await items(page)).length === 1, "drawing on top of the picture adds a stroke and leaves the picture alone");

      // Draw in Marker with the AI (stubbed: returns a marker drawing on white)
      await page.evaluate(() => { SBWB.pictures.IO.ai = async () => { const c = document.createElement("canvas"); c.width = 500; c.height = 375; const g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, 500, 375); g.strokeStyle = "#1D5BD6"; g.lineWidth = 14; g.strokeRect(150, 100, 200, 175);
        return await new Promise(r => { const im = new Image(); im.onload = () => r(im); im.src = c.toDataURL(); }); }; });
      await page.evaluate(id => SBWB.select(["i" + id]), it.id); await page.waitForTimeout(60);
      await page.click('.wb-selbar [data-wb="restyle"]'); await page.waitForTimeout(800);
      const it3 = (await items(page)).find(i => i.id === it.id), f3 = await page.evaluate(id => state.files[id], it3.f);
      ok(it3.r === 1 && it3.f !== it.f && /\(marker\)\.png$/.test(f3.name), "Draw in Marker replaces it with the redrawn picture (a new PNG file, marked as drawn): " + f3.name);
      const px = await page.evaluate(async aid => { const b = window.__bytes[aid], u = URL.createObjectURL(new Blob([b], {type: "image/png"})); const im = await new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = u; });
        const c = document.createElement("canvas"); c.width = im.width; c.height = im.height; const g = c.getContext("2d"); g.drawImage(im, 0, 0); return {bg: [...g.getImageData(20, 20, 1, 1).data], line: [...g.getImageData(152, 180, 1, 1).data]}; }, f3.revs[0].assetId);
      ok(px.bg[3] === 0 && px.line[3] > 200 && px.line[2] > px.line[0], "its white background is see-through and the marker line stays blue: " + JSON.stringify(px));
      ok(await page.locator(".wb-img.drawn img").count() === 1, "it shows as a drawn picture");
      // colours: original, or all in one marker colour
      ok(await page.locator('.wb-selbar [data-wb="sel-color"][data-id="orig"][aria-pressed=true]').count() === 1 && await page.locator('.wb-selbar [data-wb="sel-color"]').count() === 7, "a drawn picture's menu has Original Colors (picked) and the six marker colours");
      await page.click('.wb-selbar [data-wb="sel-color"][data-id="red"]'); await page.waitForTimeout(120);
      ok((await items(page)).find(i => i.id === it.id).tint === "red" && await page.locator(".wb-img .wb-tint").count() === 1 && await page.locator('.wb-selbar [data-id="red"][aria-pressed=true]').count() === 1, "picking red draws the whole picture in red");
      const red = await page.evaluate(async () => { const c = await SBWB.renderBoard(state.notes.wb1, {max: 600}), d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data; let r = 0, b = 0; for (let i = 0; i < d.length; i += 4) { if (d[i] > 180 && d[i + 1] < 90 && d[i + 2] < 90) r++; if (d[i + 2] > 150 && d[i] < 90) b++; } return {r, b}; });
      ok(red.r > 50 && red.b < 10, "and the exported picture has it in red: " + JSON.stringify(red));
      await page.click('.wb-selbar [data-wb="sel-color"][data-id="orig"]'); await page.waitForTimeout(120);
      ok(!(await items(page)).find(i => i.id === it.id).tint && await page.locator(".wb-img .wb-tint").count() === 0, "Original Colors puts its own colours back");
      // Fade Edges
      await page.click('.wb-selbar [data-wb="fade"]'); await page.waitForTimeout(120);
      ok((await items(page)).find(i => i.id === it.id).fade === 1 && await page.locator(".wb-img.fade").count() === 1 && await page.locator('.wb-selbar [data-wb="fade"][aria-pressed=true]').count() === 1, "Fade Edges softens the picture's edges (and shows as on)");
      await page.click('.wb-selbar [data-wb="fade"]'); await page.waitForTimeout(120);
      ok(!(await items(page)).find(i => i.id === it.id).fade && await page.locator(".wb-img.fade").count() === 0, "pressing it again turns it off");
      await page.evaluate(() => { SBWB.undo(); SBWB.undo(); SBWB.undo(); SBWB.undo(); }); await page.waitForTimeout(60);
      await page.evaluate(() => SBWB.undo()); await page.waitForTimeout(80);
      ok(!(await items(page)).find(i => i.id === it.id).r, "Undo brings the original picture back");

      // without AI: traced on this device
      await page.evaluate(() => { SBWB.pictures.IO.ai = async () => null; });
      await page.evaluate(id => SBWB.select(["i" + id]), it.id); await page.waitForTimeout(60);
      await page.click('.wb-selbar [data-wb="restyle"]'); await page.waitForTimeout(1500);
      const it4 = (await items(page)).find(i => i.id === it.id), f4 = await page.evaluate(id => state.files[id], it4.f);
      const tr = await page.evaluate(async aid => { const b = window.__bytes[aid], u = URL.createObjectURL(new Blob([b], {type: "image/png"})); const im = await new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = u; });
        const c = document.createElement("canvas"); c.width = im.width; c.height = im.height; const g = c.getContext("2d"); g.drawImage(im, 0, 0); const d = g.getImageData(0, 0, im.width, im.height).data; let dark = 0, clear = 0;
        for (let i = 0; i < d.length; i += 4) { if (d[i + 3] === 255 && d[i] < 60) dark++; if (d[i + 3] === 0) clear++; } return {dark, clear, all: d.length / 4}; }, f4.revs[0].assetId);
      ok(it4.r === 1 && tr.dark > 200 && tr.clear > tr.all * 0.5, "without AI it's traced here: dark marker outlines on a see-through background: " + JSON.stringify(tr));
      ok(/on this device/.test(await page.locator("#toast").textContent()), "and says it was traced on this device (with how to get a full redraw)");

      // export includes the picture
      const ex = await page.evaluate(async () => { const n = state.notes.wb1; const c = await SBWB.renderBoard(n, {max: 600}); const g = c.getContext("2d"); const d = g.getImageData(0, 0, c.width, c.height).data; let dark = 0; for (let i = 0; i < d.length; i += 4) if (d[i] < 80 && d[i + 1] < 80 && d[i + 2] < 90) dark++; return dark; });
      ok(ex > 100, "the exported picture of the board includes it: " + ex + " dark pixels");
      ok(!page.errs.length, "no page errors (Pro): " + page.errs.join(" | "));
      await page.evaluate(() => SBWB.flush());
      var saved = await page.evaluate(() => ({note: state.notes.wb1, files: Object.values(state.files), bytes: Object.fromEntries(Object.entries(window.__bytes).map(([k, v]) => [k, Array.from(v)]))}));
      await ctx.close();
    }
    {
      const seed = Object.assign({}, SEED, {notes: [saved.note], files: saved.files});
      const {ctx, page} = await mk(true, seed);
      await page.evaluate(b => { Object.entries(b).forEach(([k, v]) => { window.__bytes[k] = new Uint8Array(v); }); SBWB.pictures.retry(); }, saved.bytes);
      await page.waitForTimeout(400);
      ok(await page.locator('.wb-tray [data-wb="pic"] .wb-pro').count() === 1, "free: the Picture tool shows a Pro badge");
      ok(await page.locator(".wb-imgs .wb-img img").count() === 1, "free: a picture already on the board still shows");
      await page.click('.wb-tray [data-wb="pic"]'); await page.waitForTimeout(300);
      ok(await page.locator("dialog[open]").count() === 1 && /Pictures on the whiteboard/.test(await page.locator("dialog[open]").textContent()), "free: the Picture tool opens the Pro sheet");
      ok(!page.errs.length, "no page errors (free): " + page.errs.join(" | "));
      await ctx.close();
    }
    console.log(`whiteboard-pro.e2e: ${n} checks passed`);
  } finally { await browser.close(); server.close(); }
})().catch(e => { console.error(e); process.exit(1); });
