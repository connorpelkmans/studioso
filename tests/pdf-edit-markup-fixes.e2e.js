// node tests/pdf-edit-markup-fixes.e2e.js   (PDE_SHOTS=<folder> also saves screenshots)
// Marking up, signing and filling in, as a person does it: signature size and where it lands, the Saved signatures, Quick Fill's
// matching fields (one Undo), Delete after scrolling away, stamps upright, the equation palette's Words, a click that only lets go,
// the bar's hints (Click or Tap), placing previews, editing a placed equation, naming drawn fields, highlights undone, spreading
// overlapping items, the Pen's colours, and dragging picked things on a touch screen
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
<h1 style="font-size:24px">Field Trip Worksheet</h1>
<p style="font-size:14px">Osmosis moves water across a membrane toward the side with more solute.</p>
<p style="font-size:14px">1. Which organelle makes most of the cell's energy?</p>
<p style="font-size:14px">2. Ribosomes build proteins in Hall B labs.</p>
<p style="font-size:14px;margin-top:40px">Signature: ______________________ Date: __________</p>
<div style="page-break-before:always"></div><h2 style="font-size:18px">Page Two Heading</h2><p style="font-size:14px">Mitochondria are the powerhouse of the cell.</p>
</body></html>`;
async function formPdf(){
  const d = await L.PDFDocument.create(), pg = d.addPage([612, 792]), form = d.getForm(), f = await d.embedFont(L.StandardFonts.Helvetica);
  pg.drawText("Field trip permission form", {x: 72, y: 720, size: 18, font: f});
  pg.drawText("Student name:", {x: 72, y: 670, size: 12, font: f}); form.createTextField("student_name").addToPage(pg, {x: 170, y: 662, width: 250, height: 22});
  pg.drawText("Student ID:", {x: 72, y: 640, size: 12, font: f}); form.createTextField("student_id").addToPage(pg, {x: 170, y: 632, width: 150, height: 22});
  pg.drawText("Date:", {x: 72, y: 610, size: 12, font: f}); form.createTextField("date").addToPage(pg, {x: 170, y: 602, width: 150, height: 22});
  return Buffer.from(await d.save());
}

(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  try {
    const maker = await browser.newPage(); await maker.setContent(DOC); const pdf = await maker.pdf({format: "Letter"});
    await maker.setContent(`<div style="width:400px;height:300px;background:linear-gradient(135deg,#3b6fe0,#c0262d)"></div>`); const png = await maker.screenshot({clip: {x: 0, y: 0, width: 400, height: 300}}); await maker.close();
    const form = await formPdf();
    const rev = (id, name, size) => ({assetId: id, name, size, type: "application/pdf", at: 1});
    const seed = {v: 2, updated: 1, decks: [], notes: [], tasks: [], settings: {}, courses: [{id: "c1", name: "Biology", code: "BIO101", color: "#3B6FE0"}],
      files: [{id: "f1", name: "Worksheet.pdf", courseId: "c1", folderId: "other", kind: "file", taskIds: [], desc: "", url: "", revs: [rev("a-ws", "Worksheet.pdf", pdf.length)]},
        {id: "f2", name: "Permission Form.pdf", courseId: "c1", folderId: "other", kind: "file", taskIds: [], desc: "", url: "", revs: [rev("a-form", "Permission Form.pdf", form.length)]}]};
    const open = async (vw, vh, touch) => {
      const ctx = await browser.newContext({viewport: {width: vw, height: vh}, hasTouch: touch, isMobile: touch, serviceWorkers: "block", acceptDownloads: true});
      await ctx.addInitScript(seed => { try { if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("coursework:v2", JSON.stringify(seed)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("studyboard:tour", "1"); localStorage.setItem("studyboard:ink-test", "1"); } } catch (e) {} }, seed);
      const page = await ctx.newPage(); const errs = [];
      page.on("pageerror", e => errs.push(e.message)); page.on("console", m => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errs.push(m.text()); });
      await page.goto(base); await page.waitForSelector("#view", {state: "attached"}); await page.waitForFunction(() => window.__sbProStudy);
      await page.evaluate(() => { const T = window.__sbProStudy; Object.defineProperty(window, "state", {get: () => T.state(), configurable: true}); });
      await page.waitForTimeout(500);
      await page.evaluate(async files => { for (const [k, b] of files) await window.__sbProStudy.idbSet("pdf:" + k, new Blob([new Uint8Array(b)])); }, [["a-ws", [...pdf]], ["a-form", [...form]]]);
      const H = {ctx, page, errs};
      H.open = async fid => { await page.evaluate(() => { const d = window.__sbProStudy.dlg(); if (d.open) d.close(); }); await page.evaluate(fid => { const b = document.createElement("button"); b.dataset.act = "pdr-open"; b.dataset.id = fid; document.body.appendChild(b); b.click(); b.remove(); }, fid); await page.waitForSelector(".pdr-page .pdr-cv", {timeout: 15000}); await page.waitForTimeout(700); };
      H.edit = async () => { await page.click("#pdeBtn"); await page.waitForFunction(() => !!window.PDFLib); await page.waitForTimeout(400); };
      H.tool = async id => { const press = s => touch ? page.tap(s) : page.click(s); if (await page.locator(`.pde-tools > .pde-tool[data-id="${id}"]`).count()) await press(`.pde-tools > .pde-tool[data-id="${id}"]`); else { await press('[data-act="pde-more"]'); await press(`.pde-mi[data-id="${id}"]`); } await page.waitForTimeout(250); };
      H.shot = async name => { if (SHOTS) { fs.mkdirSync(SHOTS, {recursive: true}); await page.screenshot({path: path.join(SHOTS, name + ".png")}); } };
      H.wordAt = word => page.evaluate(word => {
        const span = [...document.querySelectorAll(".pdr-page .textLayer span")].find(s => !s.children.length && s.textContent.includes(word)); if (!span) return null;
        const rb = span.getBoundingClientRect(); if (rb.top < 150 || rb.bottom > innerHeight - 60) span.scrollIntoView({block: "center"});
        const tn = span.firstChild, i = tn.textContent.indexOf(word), r = document.createRange(); r.setStart(tn, i); r.setEnd(tn, i + word.length);
        const b = r.getBoundingClientRect(); return {x: b.left + b.width / 2, y: b.top + b.height / 2, l: b.left, r: b.right, t: b.top, b: b.bottom};
      }, word);
      H.E = fn => page.evaluate(fn => { const E = window.__sbProStudy.pde(); return new Function("E", "return (" + fn + ")(E)")(E); }, String(fn));
      H.edits = fid => page.evaluate(fid => (state.files[fid].pe || []), fid || "f1");
      H.msg = () => page.evaluate(() => (document.getElementById("pdeMsg") || {}).textContent || "");
      H.toast = () => page.evaluate(() => { const t = document.getElementById("toast"); return t && t.classList.contains("show") ? document.getElementById("toastMsg").textContent : ""; });
      H.download = async () => {
        await page.click('[data-act="pde-dl"]'); await page.waitForSelector('[data-act="pde-dl-go"]');
        const [dl] = await Promise.all([page.waitForEvent("download", {timeout: 30000}), page.click('[data-act="pde-dl-go"]')]);
        return fs.readFileSync(await dl.path());
      };
      return H;
    };

    /* On a computer */
    const H = await open(1280, 900, false), {page} = H;
    await H.open("f1"); await H.edit();

    // Marks: the hint, a click that only lets go, a tap with a drawing shape
    await H.tool("mark");
    ok(/Click to add a ✓, ✗ or dot; drag for a box, circle, line or arrow/.test(await H.msg()), "Marks says how to add each kind: " + await H.msg());
    const q1 = await H.wordAt("Which organelle");
    await page.mouse.click(q1.l - 20, q1.y); await page.waitForTimeout(300);
    let es = await H.edits(); const check = es.find(e => e.k === "s" && e.sh === "check");
    ok(check && await H.E(E => E.sel) === check.id, "a click adds a checkmark, picked");
    const pb = await page.locator('.pdr-page[data-p="1"]').boundingBox();
    await page.mouse.click(pb.x + pb.width - 40, q1.y + 30); await page.waitForTimeout(300);
    ok((await H.edits()).length === 1 && !(await H.E(E => E.sel)), "with a mark picked, a click on the empty page only lets go of it (no new mark)");
    await page.click('[data-act="pde-shape"][data-id="rect"]');
    ok(/Drag on the page to draw a box/.test(await H.msg()), "with Box, the hint says to drag");
    await page.mouse.click(pb.x + pb.width - 40, q1.y + 30); await page.waitForTimeout(250);
    ok(/Drag to draw a box/.test(await H.toast()) && (await H.edits()).length === 1, "a click with Box says to drag, instead of doing nothing");
    await page.click('[data-act="pde-shape"][data-id="dot"]'); await page.mouse.click(q1.l - 40, q1.y); await page.waitForTimeout(300);
    ok((await H.edits()).some(e => e.sh === "dot") && await page.locator("#pdeSw").count() === 0, "a picked dot shows no line width (it has none of Thin, Medium, Thick)");
    await H.shot("1-marks-hint");

    // Delete doesn't take away a picked mark that's been scrolled out of sight
    await page.locator(`.pde-e[data-e="${check.id}"] .pde-hit`).first().click({force: true}); await page.waitForTimeout(200);
    ok(await H.E(E => E.sel) === check.id, "the checkmark is picked");
    await page.evaluate(() => document.querySelector('.pdr-page[data-p="2"]').scrollIntoView({block: "start"})); await page.waitForTimeout(500);
    await page.keyboard.press("Delete"); await page.waitForTimeout(250);
    ok((await H.edits()).some(e => e.id === check.id), "Delete after scrolling to another page leaves the out-of-sight mark alone");
    await page.evaluate(() => document.querySelector('.pdr-page[data-p="1"]').scrollIntoView({block: "start"})); await page.waitForTimeout(400);

    // Stamps: upright on screen (as saved), and held still for dragging on a touch screen
    await H.tool("stamp"); const pb1 = await page.locator('.pdr-page[data-p="1"]').boundingBox();
    await page.mouse.click(pb1.x + pb1.width * 0.75, pb1.y + 120); await page.waitForTimeout(300);
    const st = (await H.edits()).find(e => e.k === "k");
    ok(st && await page.evaluate(id => getComputedStyle(document.querySelector(`.pde-e[data-e="${id}"] .pde-stamp b`)).fontStyle, st.id) === "normal", "a stamp shows upright, as it's saved (not italic)");
    ok(await page.evaluate(id => getComputedStyle(document.querySelector(`.pde-e[data-e="${id}"]`)).touchAction, st.id) === "none", "a picked stamp doesn't scroll the page when dragged by touch");
    await page.mouse.click(pb1.x + pb1.width * 0.75, pb1.y + 250); await page.waitForTimeout(300);
    ok((await H.edits()).filter(e => e.k === "k").length === 1, "with the stamp picked, a click elsewhere lets go of it first");
    await H.shot("2-stamp-upright");

    // Spread Down with items too tall to fit apart: their middles are spread evenly
    await page.evaluate(() => { const f = state.files.f1, T = window.__sbProStudy, pe = (f.pe || []).filter(e => e.k !== "k");
      const mk = (id, y, h) => ({id, a: "a-ws", p: 1, k: "k", o: [200, y], r: 0, w: 130, h, t: "DRAFT", c: "#c0262d", at: 1});
      T.applyChanges([{kind: "file", id: "f1", after: Object.assign(T.clone(f), {pe: pe.concat([mk("sp1", 400, 34), mk("sp2", 410, 46), mk("sp3", 425, 46)])})}], null); });
    await page.waitForTimeout(300);
    await page.locator('.pde-e[data-e="sp2"] .pde-stamp').scrollIntoViewIfNeeded(); await page.waitForTimeout(300);
    for (const id of ["sp1", "sp2", "sp3"]) { const b = await page.locator(`.pde-e[data-e="${id}"] .pde-stamp`).boundingBox(); await page.keyboard.down("Shift"); await page.mouse.click(b.x + b.width - 6, b.y + b.height - 6); await page.keyboard.up("Shift"); await page.waitForTimeout(150); }
    ok(await H.E(E => E.multi && E.multi.size) === 3, "three overlapping stamps picked");
    await page.click('[data-act="pde-align"][data-id="v"]'); await page.waitForTimeout(300);
    { const s3 = (await H.edits()).filter(e => /^sp/.test(e.id)).sort((a, b) => a.o[1] - b.o[1]), c = s3.map(e => e.o[1] + e.h / 2);
      ok(Math.abs((c[1] - c[0]) - (c[2] - c[1])) < 0.5 && c[1] > c[0], "Spread Down evenly spaces their middles: " + c.map(v => v.toFixed(1)).join(", ")); }
    await page.evaluate(() => { const f = state.files.f1, T = window.__sbProStudy; T.applyChanges([{kind: "file", id: "f1", after: Object.assign(T.clone(f), {pe: (f.pe || []).filter(e => !/^sp/.test(e.id))})}], null); });
    await page.keyboard.press("Escape"); await page.waitForTimeout(200);

    // Signatures: a short name and a long one come out the same height, sitting on the line where you click
    const sign = async name => {
      await H.tool("sign"); await page.waitForSelector(".pde-panel.sign");
      await page.click('[data-act="pde-sig-tab"][data-id="Type"]'); await page.fill("#pdeSigName", name);
      await page.click('[data-act="pde-sig-use"]'); await page.waitForFunction(() => window.__sbProStudy.pde().place, null, {timeout: 8000});
    };
    await sign("Al");
    ok(await page.locator('.pde-tools > .pde-tool[data-id="sign"][aria-pressed="true"]').count() === 1 && /the line your signature goes on/.test(await H.msg()), "while placing, Sign shows pressed and the bar says where it goes");
    // (the line in the middle of the screen, clear of the message at the bottom)
    await page.evaluate(() => [...document.querySelectorAll(".pdr-page .textLayer span")].find(s => /Signature:/.test(s.textContent)).scrollIntoView({block: "center"})); await page.waitForTimeout(400);
    const sg = await H.wordAt("Signature:");
    const at1 = {x: sg.r + 30, y: sg.b};
    await page.mouse.move(at1.x - 40, at1.y - 20); await page.mouse.move(at1.x, at1.y, {steps: 3}); await page.waitForTimeout(300);
    const ghost = await page.locator(".pde-ghost").boundingBox();
    ok(ghost && Math.abs(ghost.x - at1.x) < 3 && Math.abs(ghost.y + ghost.height - at1.y) < 3, "a faint copy of the signature follows the pointer before you click, its bottom-left at the pointer");
    await H.shot("3-sig-preview");
    // (measured from the page's corner: the bar above can change height once it's placed)
    const pgAt = () => page.evaluate(() => { const r = document.querySelector('.pdr-page[data-p="1"]').getBoundingClientRect(); return {x: r.left, y: r.top}; }), pg0 = await pgAt();
    await page.mouse.click(at1.x, at1.y); await page.waitForTimeout(400);
    const sigs = () => H.edits().then(l => l.filter(e => e.k === "i" && e.sig));
    const s1 = (await sigs())[0];
    ok(s1 && s1.h >= 18 && s1.h <= 40 && s1.w <= 220, "a short name's signature isn't huge: " + JSON.stringify(s1 && [Math.round(s1.w), Math.round(s1.h)]));
    { const b = await page.evaluate(id => { const r = document.querySelector(`.pde-e[data-e="${id}"] .pde-pic`).getBoundingClientRect(); return {x: r.left, y: r.bottom}; }, s1.id), pg1 = await pgAt(); ok(Math.abs(b.x - pg1.x - (at1.x - pg0.x)) < 2 && Math.abs(b.y - pg1.y - (at1.y - pg0.y)) < 2, "its bottom-left is where you clicked (it sits on the line)"); }
    ok(await page.locator(".pde-ghost").count() === 0, "the preview goes once it's placed");
    await sign("Alexandra Montgomery-Smith");
    await page.mouse.click(pb1.x + 80, sg.b + 120); await page.waitForTimeout(400);
    const s2 = (await sigs()).find(e => e.id !== s1.id);
    ok(s2 && s2.h >= 18 && s2.w <= 220.5,"a long name's signature is still readable (tall enough), and capped in width: " + JSON.stringify(s2 && [Math.round(s2.w), Math.round(s2.h)]));
    await H.shot("4-sigs-placed");

    // Saved signatures: the panel opens on them, one is picked, Place Signature uses the picked one
    await H.tool("sign"); await page.waitForSelector(".pde-panel.sign");
    ok(await page.locator('[data-act="pde-sig-tab"][data-id="Saved"]').getAttribute("aria-selected") === "true", "with saved signatures, the panel opens on Saved");
    ok(await page.locator("#pdeSigKeep").isHidden(), "Keep this signature isn't offered for one that's already kept");
    ok(await page.locator('.pde-sigpick[aria-pressed="true"]').count() === 1, "the newest saved signature is picked");
    const pick2 = await page.locator(".pde-sigpick").nth(1).getAttribute("data-id");
    await page.click(".pde-sigpick >> nth=1");
    ok(await page.locator(".pde-sigpick").nth(1).getAttribute("aria-pressed") === "true" && await page.locator('.pde-sigpick[aria-pressed="true"]').count() === 1, "clicking another one picks it (shown as chosen), without placing it yet");
    await H.shot("5-sig-saved");
    await page.click('[data-act="pde-sig-use"]'); await page.waitForTimeout(250);
    ok(await H.E(E => E.place && E.place.id) === pick2, "Place Signature on the Saved tab places the picked signature");
    await page.mouse.click(pb1.x + 300, sg.b + 200); await page.waitForTimeout(400);
    ok((await sigs()).some(e => e.img === pick2 && e.id !== s1.id && e.id !== s2.id), "and it lands where you click");

    // A picture: Picture shows pressed while placing, and a click near the page's corner keeps it on the page
    await page.setInputFiles("#pdeImgFile", {name: "pic.png", mimeType: "image/png", buffer: png}); await page.waitForFunction(() => window.__sbProStudy.pde().place, null, {timeout: 8000});
    ok(await page.locator("label.pde-tool:has(#pdeImgFile)").getAttribute("aria-pressed") === "true", "Picture shows pressed while placing");
    await page.evaluate(() => document.querySelector('.pdr-page[data-p="1"]').scrollIntoView({block: "end"})); await page.waitForTimeout(400);
    { const b = await page.locator('.pdr-page[data-p="1"]').boundingBox(); await page.mouse.click(b.x + b.width - 6, b.y + b.height - 6); await page.waitForTimeout(400); }
    { const pic = (await H.edits()).find(e => e.k === "i" && !e.sig);
      ok(pic && pic.o[0] >= -0.5 && pic.o[1] >= -0.5 && pic.o[0] + pic.w <= 612.5 && pic.o[1] + pic.h <= 792.5, "a picture placed at the page's corner stays on the page: " + JSON.stringify(pic && [pic.o.map(Math.round), Math.round(pic.w), Math.round(pic.h)])); }
    ok(/Drag to move, the corner to resize/.test(await H.msg()), "your picked picture says how to move and resize it");
    await page.evaluate(() => document.querySelector('.pdr-page[data-p="1"]').scrollIntoView({block: "start"})); await page.waitForTimeout(300);

    // Equations: the Words button draws, and a placed equation opens again with its formula
    await H.tool("eq"); await page.waitForSelector(".rb-eq .rb-eq-in"); await page.waitForSelector('.rb-eq-pal .rb-pk[aria-label="Words"] .katex');
    { const h = await page.innerHTML('.rb-eq-pal .rb-pk[aria-label="Words"]'); ok(!/katex-error|\\square/.test(h) && /abc/.test(h), "the equation palette's Words button shows a word, not red code"); }
    await page.fill(".rb-eq .rb-eq-in", "x^2"); await page.waitForSelector(".rb-eq-prev .katex"); await page.click('.rb-eq [data-eqa="ok"]');
    await page.waitForFunction(() => { const p = window.__sbProStudy.pde().place; return p && p.eq; }, null, {timeout: 15000});
    ok(/where the equation goes/.test(await H.msg()), "the bar says where the equation goes (not a picture)");
    { const b = await page.locator('.pdr-page[data-p="1"]').boundingBox(); await page.mouse.click(b.x + 120, Math.max(b.y, 160) + 300); await page.waitForTimeout(500); }
    let eq = (await H.edits()).find(e => e.k === "i" && e.tex);
    ok(eq && eq.tex === "x^2" && /Equation added/.test(await H.toast()), "a placed equation keeps its formula (and says Equation added)");
    ok(/An equation: double-click it to change it/.test(await H.msg()), "a picked equation says it can be changed");
    await page.dblclick(`.pde-e[data-e="${eq.id}"] .pde-pic`); await page.waitForSelector(".rb-eq .rb-eq-in");
    ok(await page.inputValue(".rb-eq .rb-eq-in") === "x^2" && await page.locator('.rb-eq [data-eqa="ok"]').textContent() === "Update", "double-clicking it opens the formula, ready to change");
    await page.fill(".rb-eq .rb-eq-in", "x^2+y^2"); await page.waitForSelector(".rb-eq-prev .katex"); await page.click('.rb-eq [data-eqa="ok"]');
    await page.waitForFunction(id => (window.__sbProStudy.state().files.f1.pe || []).some(e => e.id === id && e.tex === "x^2+y^2"), eq.id, {timeout: 15000});
    { const eq2 = (await H.edits()).find(e => e.id === eq.id); ok(eq2.img !== eq.img && eq2.w > eq.w && Math.abs((eq2.o[1] + eq2.h) - (eq.o[1] + eq.h)) < 0.5 && Math.abs(eq2.o[0] - eq.o[0]) < 0.5, "Update replaces it in place (same top-left), wider for the longer formula"); }
    await page.keyboard.press("Escape"); await page.waitForTimeout(200);

    // Drawn fields can be named, and the name is the field's name in the saved PDF
    await H.tool("fields"); await page.waitForSelector('[data-act="pde-fd-draw"]'); await page.click('[data-act="pde-fd-draw"]'); await page.waitForTimeout(250);
    ok(await page.locator("#pdeFieldKind").count() === 1 && !/Draw a/.test(await page.locator(".pde-bar").innerText()), "the field kind picker is just the list (no wrapping 'Draw a' label)");
    { const d = await H.wordAt("Date:"); await page.mouse.move(d.r + 6, d.t - 4); await page.mouse.down(); await page.mouse.move(d.r + 120, d.b + 4, {steps: 5}); await page.mouse.up(); await page.waitForTimeout(400); }
    const fld = (await H.edits()).find(e => e.k === "q");
    ok(fld && await page.inputValue("#pdeFieldName") === fld.name, "a picked field shows its name, ready to change");
    await page.fill("#pdeFieldName", "Trip date"); await page.press("#pdeFieldName", "Enter"); await page.waitForTimeout(300);
    ok((await H.edits()).find(e => e.id === fld.id).name === "Trip date", "the new name is kept");
    ok(await page.evaluate(id => getComputedStyle(document.querySelector(`.pde-e[data-e="${id}"]`)).touchAction, fld.id) === "none", "a picked field doesn't scroll the page when dragged by touch");
    await H.shot("6-field-name");
    { const out = await H.download(), doc = await L.PDFDocument.load(out); const names = doc.getForm().getFields().map(f => f.getName());
      ok(names.includes("Trip date"), "the saved PDF has the field by that name: " + names.join(", ")); }
    await page.keyboard.press("Escape"); await page.waitForTimeout(200);

    // Quick Fill: no Fill Matching Fields on a PDF without fields
    await page.evaluate(() => localStorage.setItem("studyboard:pdeMe", JSON.stringify({name: "Ana López", id: "S-20417", cls: ""})));
    await H.tool("fill");
    ok(await page.locator('[data-act="pde-fill-fields"]').count() === 0, "Fill Matching Fields isn't offered on a PDF with no form fields");

    // Highlights in Mark Up mode can be undone
    await page.click("#pdeBtn"); await page.waitForTimeout(300);
    await page.click('[data-act="pdr-mode"][data-id="mark"]'); await page.waitForTimeout(300);
    ok(/Select text, then pick a color to highlight it/.test(await page.locator(".pdr-markhint").textContent()), "Mark Up's hint says how highlighting works");
    { const a = await H.wordAt("Osmosis"), b = await H.wordAt("membrane"); await page.mouse.move(a.l + 1, a.y); await page.mouse.down(); await page.mouse.move(b.r - 1, b.y, {steps: 8}); await page.mouse.up(); await page.waitForTimeout(400); }
    await page.click('.pdr-pop [data-act="pdr-hl-add"][data-id="yellow"]'); await page.waitForTimeout(300);
    const hlN = () => page.evaluate(() => (state.files.f1.hl || []).length);
    ok(await hlN() === 1 && /Highlight added/.test(await H.toast()), "a highlight says Highlight added, with Undo");
    await H.shot("7-highlight-undo");
    await page.mouse.click(1100, 860); await page.keyboard.press("Control+z"); await page.waitForTimeout(300);
    ok(await hlN() === 0 && /Undone: Highlight added/.test(await H.toast()), "Ctrl+Z takes the highlight away");

    // The Pen's Theme Color isn't offered when it looks just like Blue
    if (await page.locator("#inkModeBtn").count()) {
      await page.click("#inkModeBtn"); await page.waitForTimeout(300);
      const labels = await page.$$eval(".ink-col", l => l.map(b => b.getAttribute("aria-label")));
      ok(labels.includes("Blue") && !labels.includes("Theme Color"), "the Pen's colours are all different to look at: " + labels.join(", "));
      await page.click("#inkModeBtn"); await page.waitForTimeout(200);
    }

    // Quick Fill on a form: student_id is matched too, and filling is one step to undo
    await H.open("f2"); await H.edit(); await H.tool("fill");
    await page.waitForSelector('[data-act="pde-fill-fields"]', {timeout: 5000});
    const hist0 = await H.E(E => (E.hist ? E.hist.undo.length : 0));
    await page.click('[data-act="pde-fill-fields"]'); await page.waitForTimeout(500);
    const vals = async () => ({n: await page.inputValue('.pde-field[data-f="student_name"]'), id: await page.inputValue('.pde-field[data-f="student_id"]'), d: await page.inputValue('.pde-field[data-f="date"]')});
    { const v = await vals(); ok(v.n === "Ana López" && v.id === "S-20417" && /\d{4}/.test(v.d), "Fill Matching Fields fills student_name, student_id and date: " + JSON.stringify(v)); }
    ok(await H.E(E => E.hist.undo.length) === hist0 + 1 && await H.E(E => E.hist.undo[E.hist.undo.length - 1].label) === "Filled 3 fields", "it's one step in History, Filled 3 fields");
    await page.mouse.click(1100, 860); await page.keyboard.press("Control+z"); await page.waitForTimeout(400);
    { const v = await vals(); ok(!v.n && !v.id && !v.d, "one Undo empties all three"); }
    ok(!H.errs.length, "no page errors: " + H.errs.join(" | "));
    await H.ctx.close();

    /* On a phone: the hints say Tap */
    const P = await open(390, 844, true);
    await P.open("f1"); await P.page.tap("#pdeBtn"); await P.page.waitForFunction(() => !!window.PDFLib); await P.page.waitForTimeout(400);
    await P.tool("mark");
    ok(/^Tap to add a ✓, ✗ or dot/.test(await P.msg()), "on a touch screen, Marks says Tap: " + await P.msg());
    await P.shot("8-phone-marks-hint");
    ok(!P.errs.length, "no page errors on the phone: " + P.errs.join(" | "));
    await P.ctx.close();
  } finally { await browser.close(); server.close(); }
  console.log(`\n${n} checks passed`);
})().catch(e => { console.error("FAIL:", e.message); process.exit(1); });
