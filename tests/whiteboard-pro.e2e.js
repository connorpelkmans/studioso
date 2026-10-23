// node tests/whiteboard-pro.e2e.js
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
      ok((await page.locator('.wb-selbar [data-wb="restyle-menu"]').textContent()).includes("Draw"), "its menu offers Draw (which opens the drawing styles)");
      await page.evaluate(async () => {
        const T = window.__sbProStudy, NP = window.__sbNotePhotos, IO = SBWB.pictures.IO, b0 = IO.bytes; let fails = 0;
        window.__bytes["asset-slow"] = window.__bytes[Object.keys(window.__bytes)[0]];
        IO.bytes = async id => { if (id === "asset-slow" && fails < 2) { fails++; throw new Error("not signed in"); } return b0(id); };
        T.applyChanges([{kind: "file", id: "slowpic", after: NP.normFile({id: "slowpic", name: "slow.png", courseId: "", folderId: "notes", kind: "file", revs: [{assetId: "asset-slow", size: 10, type: "image/png", at: Date.now(), name: "slow.png"}], taskIds: []})}], "");
        SBWB.change(set => set("i", "slowit", {id: "slowit", k: "i", f: "slowpic", x: 100, y: 1400, w: 400, h: 300, at: Date.now()}));
      });
      await page.waitForTimeout(250);
      ok(!(await page.locator(".wb-imgs").textContent()).includes("not available"), "a picture that can't load yet isn't shown as missing right away");
      await page.waitForTimeout(2600);
      ok(await page.locator(".wb-imgs .wb-img img").count() === 2, "and it shows once it loads, a moment later");
      await page.evaluate(() => SBWB.change(set => set("i", "slowit", null)));

      const box = await page.evaluate(id => { const b = SBWB.itemBB(SBWB.getI(id)), c = SBWB.cam(), r = document.querySelector(".wb-frame").getBoundingClientRect(); return {x: r.left + b[2] * c.z + c.x, y: r.top + b[3] * c.z + c.y, z: c.z}; }, it.id);
      await page.mouse.move(box.x, box.y); await page.mouse.down(); await page.mouse.move(box.x + 40, box.y + 30, {steps: 4}); await page.mouse.move(box.x + 80, box.y + 60, {steps: 4}); await page.mouse.up(); await page.waitForTimeout(100);
      const it2 = (await items(page)).find(i => i.id === it.id);
      ok(it2.w > it.w * 1.1 && Math.abs(it2.w / it2.h - it.w / it.h) < 0.02, "dragging the corner makes it bigger, same shape: " + it.w + " to " + it2.w);
      await page.evaluate(() => SBWB.setTool("pen"));
      const c = await page.evaluate(id => { const b = SBWB.itemBB(SBWB.getI(id)), c = SBWB.cam(), r = document.querySelector(".wb-frame").getBoundingClientRect(); return {x: r.left + (b[0] + b[2]) / 2 * c.z + c.x, y: r.top + (b[1] + b[3]) / 2 * c.z + c.y}; }, it.id);
      await page.mouse.move(c.x - 60, c.y); await page.mouse.down(); await page.mouse.move(c.x + 60, c.y, {steps: 8}); await page.mouse.up(); await page.waitForTimeout(60);
      ok((await page.evaluate(() => SBWB.board().strokes.length)) === 1 && (await items(page)).length === 1, "drawing on top of the picture adds a stroke and leaves the picture alone");

      await page.evaluate(() => { SBWB.pictures.IO.ai = async () => { const c = document.createElement("canvas"); c.width = 500; c.height = 375; const g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, 500, 375); g.strokeStyle = "#1D5BD6"; g.lineWidth = 14; g.strokeRect(150, 100, 200, 175);
        return await new Promise(r => { const im = new Image(); im.onload = () => r(im); im.src = c.toDataURL(); }); }; });
      await page.evaluate(id => SBWB.select(["i" + id]), it.id); await page.waitForTimeout(60);
      await page.click('.wb-selbar [data-wb="restyle-menu"]'); await page.click('.wb-stylemenu [data-id$="|marker"]'); await page.waitForTimeout(800);
      const it3 = (await items(page)).find(i => i.id === it.id), f3 = await page.evaluate(id => state.files[id], it3.f);
      ok(it3.r === 1 && it3.f !== it.f && /\(marker\)\.png$/.test(f3.name), "Draw in Marker replaces it with the redrawn picture (a new PNG file, marked as drawn): " + f3.name);
      const px = await page.evaluate(async aid => { const b = window.__bytes[aid], u = URL.createObjectURL(new Blob([b], {type: "image/png"})); const im = await new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = u; });
        const c = document.createElement("canvas"); c.width = im.width; c.height = im.height; const g = c.getContext("2d"); g.drawImage(im, 0, 0); return {bg: [...g.getImageData(20, 20, 1, 1).data], line: [...g.getImageData(152, 180, 1, 1).data]}; }, f3.revs[0].assetId);
      ok(px.bg[3] === 0 && px.line[3] > 200 && px.line[2] > px.line[0], "its white background is see-through and the marker line stays blue: " + JSON.stringify(px));
      ok(await page.locator(".wb-img.drawn img").count() === 1, "it shows as a drawn picture");
      ok(await page.locator('.wb-selbar [data-wb="sel-color"][data-id="orig"][aria-pressed=true]').count() === 1 && await page.locator('.wb-selbar [data-wb="sel-color"]').count() === 7, "a drawn picture's menu has Original Colors (picked) and the six marker colours");
      await page.click('.wb-selbar [data-wb="sel-color"][data-id="red"]'); await page.waitForTimeout(120);
      ok((await items(page)).find(i => i.id === it.id).tint === "red" && await page.locator(".wb-img .wb-tint").count() === 1 && await page.locator('.wb-selbar [data-id="red"][aria-pressed=true]').count() === 1, "picking red draws the whole picture in red");
      const red = await page.evaluate(async () => { const c = await SBWB.renderBoard(state.notes.wb1, {max: 600}), d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data; let r = 0, b = 0; for (let i = 0; i < d.length; i += 4) { if (d[i] > 180 && d[i + 1] < 90 && d[i + 2] < 90) r++; if (d[i + 2] > 150 && d[i] < 90) b++; } return {r, b}; });
      ok(red.r > 50 && red.b < 10, "and the exported picture has it in red: " + JSON.stringify(red));
      await page.click('.wb-selbar [data-wb="sel-color"][data-id="orig"]'); await page.waitForTimeout(120);
      ok(!(await items(page)).find(i => i.id === it.id).tint && await page.locator(".wb-img .wb-tint").count() === 0, "Original Colors puts its own colours back");
      await page.click('.wb-selbar [data-wb="fade"]'); await page.waitForTimeout(120);
      ok((await items(page)).find(i => i.id === it.id).fade === 1 && await page.locator(".wb-img.fade").count() === 1 && await page.locator('.wb-selbar [data-wb="fade"][aria-pressed=true]').count() === 1, "Fade Edges softens the picture's edges (and shows as on)");
      await page.click('.wb-selbar [data-wb="fade"]'); await page.waitForTimeout(120);
      ok(!(await items(page)).find(i => i.id === it.id).fade && await page.locator(".wb-img.fade").count() === 0, "pressing it again turns it off");
      await page.evaluate(() => { SBWB.undo(); SBWB.undo(); SBWB.undo(); SBWB.undo(); }); await page.waitForTimeout(60);
      await page.evaluate(() => SBWB.undo()); await page.waitForTimeout(80);
      ok(!(await items(page)).find(i => i.id === it.id).r, "Undo brings the original picture back");

      await page.evaluate(() => { SBWB.pictures.IO.ai = async () => null; });
      await page.evaluate(id => SBWB.select(["i" + id]), it.id); await page.waitForTimeout(60);
      await page.click('.wb-selbar [data-wb="restyle-menu"]'); await page.click('.wb-stylemenu [data-id$="|marker"]'); await page.waitForTimeout(1500);
      const it4 = (await items(page)).find(i => i.id === it.id), f4 = await page.evaluate(id => state.files[id], it4.f);
      const tr = await page.evaluate(async aid => { const b = window.__bytes[aid], u = URL.createObjectURL(new Blob([b], {type: "image/png"})); const im = await new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = u; });
        const c = document.createElement("canvas"); c.width = im.width; c.height = im.height; const g = c.getContext("2d"); g.drawImage(im, 0, 0); const d = g.getImageData(0, 0, im.width, im.height).data; let dark = 0, clear = 0;
        for (let i = 0; i < d.length; i += 4) { if (d[i + 3] > 150 && d[i] + d[i + 1] + d[i + 2] < 420) dark++; if (d[i + 3] === 0) clear++; } return {dark, clear, all: d.length / 4}; }, f4.revs[0].assetId);
      ok(it4.r === 1 && tr.dark > 200 && tr.clear > tr.all * 0.5, "without AI it's drawn here: marker outlines in the picture's colours, on a see-through background: " + JSON.stringify(tr));
      ok(/on this device/.test(await page.locator("#toast").textContent()), "and says it was traced on this device (with how to get a full redraw)");

      await page.evaluate(() => SBWB.setTool("pen"));
      await page.click('.wb-tray [data-wb="pen-any"]'); await page.waitForTimeout(100);
      const cpb = await page.evaluate(() => { const p = document.querySelector(".wb-cpick"), m = document.querySelector('.wb-tray [data-wb="pen-any"]'); if (!p) return null; const a = p.getBoundingClientRect(), b = m.getBoundingClientRect(); return {top: a.top - b.bottom, dx: Math.abs((a.left + a.width / 2) - (b.left + b.width / 2))}; });
      ok(cpb && cpb.top >= 0 && cpb.top < 20 && cpb.dx < 130, "Pro: the rainbow marker opens the board's colour picker right under it: " + JSON.stringify(cpb));
      await page.fill(".wb-cpick .wb-cp-hex", "00b3a4"); await page.waitForTimeout(60);
      await page.click(".wb-cpick .wb-cp-done"); await page.waitForTimeout(80);
      ok(await page.locator(".wb-cpick").count() === 0, "typing a hex colour and pressing Done closes it");
      ok(await page.locator('.wb-tray [data-wb="pen-any"][aria-pressed=true]').count() === 1, "the picked colour is now the marker");
      const fr = await page.evaluate(() => { const r = document.querySelector(".wb-frame").getBoundingClientRect(); return {x: r.left, y: r.top}; });
      await page.mouse.move(fr.x + 60, fr.y + 60); await page.mouse.down(); await page.mouse.move(fr.x + 260, fr.y + 70, {steps: 8}); await page.mouse.up(); await page.waitForTimeout(80);
      const cs = await page.evaluate(() => { const l = SBWB.board().strokes; return l[l.length - 1].c; });
      ok(/^h[a-p]{6}$/.test(cs), "a stroke in that colour is saved with it: " + cs);
      const teal = await page.evaluate(async () => { const c = await SBWB.renderBoard(state.notes.wb1, {max: 900, full: true}), d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (Math.abs(d[i] - 0) < 30 && Math.abs(d[i + 1] - 179) < 30 && Math.abs(d[i + 2] - 164) < 30) n++; return n; });
      ok(teal > 20, "and exports in exactly that colour: " + teal + " teal pixels");
      await page.evaluate(() => SBWB.undo());

      await page.evaluate(() => { SBWB.setTool("eraser"); });
      await page.click('.wb-tray [data-wb="erase"][data-id="part"]'); await page.click('.wb-tray [data-wb="ew"][data-id="2"]');
      const pc = await page.evaluate(id => { const b = SBWB.itemBB(SBWB.getI(id)), c = SBWB.cam(), r = document.querySelector(".wb-frame").getBoundingClientRect(); return {x0: r.left + b[0] * c.z + c.x, x1: r.left + b[2] * c.z + c.x, y: r.top + (b[1] + b[3]) / 2 * c.z + c.y}; }, it.id);
      await page.mouse.move(pc.x0 + 10, pc.y); await page.mouse.down(); await page.mouse.move(pc.x1 - 10, pc.y, {steps: 12}); await page.mouse.up(); await page.waitForTimeout(150);
      const er = (await items(page)).find(x => x.id === it.id);
      ok(er && er.er && er.er.length >= 3 && await page.locator(".wb-img .wb-er").count() === 1, "Erase Parts on a picture rubs out a line across it (" + (er && er.er ? er.er.length : 0) + " spots), keeping the picture");
      const hole = await page.evaluate(async id => { const it = SBWB.getI(id), c = await SBWB.renderBoard(state.notes.wb1, {area: [it.x, it.y, it.x + it.w, it.y + it.h], scale: 1}), g = c.getContext("2d"); const mid = g.getImageData(Math.round(c.width / 2), Math.round(c.height / 2), 1, 1).data; return [...mid]; }, it.id);
      ok(hole[0] > 240 && hole[1] > 240 && hole[2] > 240, "the export shows the board through the erased line: " + hole);
      await page.evaluate(() => SBWB.undo()); await page.waitForTimeout(60);
      ok(!((await items(page)).find(x => x.id === it.id).er), "Undo brings the picture back whole");
      await page.evaluate(() => SBWB.setTool("select"));

      const shp = await page.evaluate(async () => { const f = await window.__pic(), im = await new Promise(r => { const m = new Image(); m.onload = () => r(m); m.src = URL.createObjectURL(f); });
        const c = SBWB.pictures.sketch(im), x = c.getContext("2d"), sx = c.width / 400, sy = c.height / 300;
        const dark = (px, py) => { let n = 0; for (let dy = -6; dy <= 6; dy++) for (let dx = -6; dx <= 6; dx++) { const d = x.getImageData(Math.round(px * sx) + dx, Math.round(py * sy) + dy, 1, 1).data; if (d[0] + d[1] + d[2] < 450) n++; } return n > 0; };
        return {edges: [[120, 150], [280, 150], [200, 80], [200, 220]].every(q => dark(q[0], q[1])), corners: [[30, 30], [370, 30], [30, 270], [370, 270]].some(q => dark(q[0], q[1]))}; });
      ok(shp.edges && !shp.corners, "Draw in Marker on this device follows the picture's own outline (ink on the square's edges, empty corners stay empty): " + JSON.stringify(shp));
      const seg = await page.evaluate(async () => { const f = await window.__pic(), im = await new Promise(r => { const m = new Image(); m.onload = () => r(m); m.src = URL.createObjectURL(f); });
        const W0 = 400, H0 = 300, a = new Float32Array(W0 * H0); for (let y = 0; y < H0; y++) for (let x = 0; x < 200; x++) a[y * W0 + x] = 1;
        const c = SBWB.pictures.clearWhite(SBWB.pictures.sketch(im, "marker", {w: W0, h: H0, a})), x = c.getContext("2d"), sx = c.width / 400, sy = c.height / 300;
        const ink = (x0, x1) => { let n = 0; const d = x.getImageData(Math.round(x0 * sx), 0, Math.round((x1 - x0) * sx), c.height).data; for (let i = 3; i < d.length; i += 4) if (d[i] > 60) n++; return n; };
        return {left: ink(100, 190), right: ink(230, 300)}; });
      ok(seg.left > 200 && seg.right === 0, "with a subject outline, only the subject is drawn (nothing outside it): " + JSON.stringify(seg));
      await page.evaluate(id => SBWB.select(["i" + id]), it.id); await page.waitForTimeout(60);
      await page.click('.wb-selbar [data-wb="restyle-menu"]'); await page.waitForTimeout(80);
      ok(await page.locator('.wb-stylemenu [data-wb="restyle-as"]').count() === 4 && await page.locator('.wb-stylemenu .on').textContent() === "Marker", "the style menu offers 4 drawing styles, Marker first and picked");
      await page.click('.wb-stylemenu [data-id$="|outline"]'); await page.waitForTimeout(1500);
      ok(/Outline/.test(await page.locator("#toast").textContent()) && await page.locator(".wb-stylemenu").count() === 0 && await page.evaluate(() => localStorage.getItem("studyboard:wbDrawStyle")) === "outline", "picking Outline draws it as an outline and remembers the choice");
      const dr = (await items(page)).find(x => x.id === it.id);
      ok(dr.r === 1 && dr.o === it.f, "the drawing remembers the original picture it came from: " + JSON.stringify({o: dr.o, f: it.f}));
      await page.evaluate(id => SBWB.select(["i" + id]), it.id); await page.waitForTimeout(60);
      await page.click('.wb-selbar [data-wb="restyle-menu"]'); await page.click('.wb-stylemenu [data-id$="|bold"]'); await page.waitForTimeout(1500);
      const dr2 = (await items(page)).find(x => x.id === it.id);
      ok(dr2.o === it.f && dr2.f !== dr.f, "Draw Again in another style starts from the original again (not the last drawing)");
      await page.evaluate(() => SBWB.undo()); await page.waitForTimeout(80);
      await page.evaluate(() => { SBWB.undo(); localStorage.removeItem("studyboard:wbDrawStyle"); }); await page.waitForTimeout(80);

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
