// node tests/whiteboard.e2e.js  (Playwright + Chromium; no network)
// Notes > Whiteboard: boards are notes with n.wb (never shown as sticky notes); marker, highlighter, shapes, held-still snapping, text in the
// marker font, the eraser (parts and whole strokes), select / move / resize / delete, undo and redo, zoom, export, saving and Recently Deleted.
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
  notes: [{id: "n1", text: "A sticky note", color: "yellow", x: 40, y: 40, z: 1, rot: 0, courseId: "", board: "", created: 1, stickers: []}]};
(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  const errs = [];
  const ctx = await browser.newContext({viewport: {width: 1280, height: 900}, acceptDownloads: true});
  await ctx.addInitScript(seed => {
    try { localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "1");
      if (!localStorage.getItem("coursework:v2")) localStorage.setItem("coursework:v2", JSON.stringify(seed)); } catch (e) {}
  }, SEED);
  const page = await ctx.newPage(); page.on("pageerror", e => errs.push(e.message));
  const act = (a, id) => page.evaluate(([a, id]) => { const b = document.createElement("button"); b.dataset.act = a; if (id) b.dataset.id = id; b.hidden = true; document.body.appendChild(b); b.click(); b.remove(); }, [a, id]);
  const wb = (a, id) => page.evaluate(([a, id]) => { const b = document.querySelector(`.wb-stage [data-wb="${a}"]${id != null ? `[data-id="${id}"]` : ""}`); b.click(); }, [a, id]);
  const saved = () => page.evaluate(() => { const s = JSON.parse(localStorage.getItem("coursework:v2")); const a = Array.isArray(s.notes) ? s.notes : Object.values(s.notes); return a.filter(x => x.wb); });
  const live = () => page.evaluate(() => SBWB.board());
  const flush = () => page.evaluate(() => SBWB.flush());
  let F;
  const frameBox = async () => (F = await page.evaluate(() => { const r = document.querySelector(".wb-frame").getBoundingClientRect(); return {x: r.left, y: r.top, w: r.width, h: r.height}; }));
  const toScreen = (wx, wy) => page.evaluate(([wx, wy]) => { const c = SBWB.cam(), r = document.querySelector(".wb-frame").getBoundingClientRect(); return [r.left + wx * c.z + c.x, r.top + wy * c.z + c.y]; }, [wx, wy]);
  const stroke = async (pts, hold) => { await page.mouse.move(pts[0][0], pts[0][1]); await page.mouse.down(); for (const p of pts.slice(1)) await page.mouse.move(p[0], p[1], {steps: 2}); if (hold) await page.waitForTimeout(800); await page.mouse.up(); await page.waitForTimeout(60); };
  const decode = d => page.evaluate(d => { const AL = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"; const nums = []; let v = 0, m = 1; for (const ch of d) { const k = AL.indexOf(ch); if (k >= 32) { v += (k - 32) * m; m *= 32; } else { v += k * m; nums.push(v & 1 ? -(v + 1) / 2 : v / 2); v = 0; m = 1; } } const out = []; let x = 0, y = 0; for (let i = 0; i + 1 < nums.length; i += 2) { x += nums[i]; y += nums[i + 1]; out.push([x / 4, y / 4]); } return out; }, d);
  try {
    await page.goto(base); await page.waitForSelector("#view", {state: "attached"}); await page.waitForTimeout(1500);
    await page.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
    await page.evaluate(() => { const b = document.querySelector('nav.tabs [data-tab="notes"]'); b && b.click(); });
    await page.waitForSelector(".nv-tabs");
    ok(await page.locator('.nv-tabs [data-id="board"][aria-selected=true]').count() === 1 && await page.locator("#nbBoard .note").count() === 1, "Notes opens on the sticky notes, with a Notes | Whiteboard switch");
    await page.click('.nv-tabs [data-id="wb"]'); await page.waitForTimeout(300);
    ok(await page.locator('.wb-empty [data-act="wb-quick"][data-id="blank"]').count() === 1 && await page.locator(".wb-empty .wb-tile").count() === 9 && /Add Board/.test(await page.locator("#fab").textContent()) && await page.locator("#fab").isVisible(), "with no boards yet, the Whiteboard offers a Blank Board or one of 9 templates, and the + button is Add Board");

    // a new board from the sheet: name, template, course
    await act("wb-new"); await page.waitForSelector("dialog[open] .wb-start");
    await page.fill('dialog[open] input[name="name"]', "Cell Biology");
    ok(await page.isChecked('dialog[open] input[name="start"][value="blank"]') && await page.locator("dialog[open] .wb-tpl-pick").isHidden(), "New Whiteboard asks: Blank Board (picked) or A Template (templates hidden until chosen)");
    await page.click('dialog[open] .wb-start label:has(input[value="tpl"])');
    ok(await page.locator("dialog[open] .wb-tpl-pick").isVisible() && await page.locator("dialog[open] .wb-tpl-pick .wb-tile").count() === 9, "choosing A Template shows the 9 templates");
    await page.click('dialog[open] .wb-tile:has(input[value="grid"])');
    await page.selectOption('dialog[open] select[name="courseId"]', "c1");
    await page.click("dialog[open] [data-submit]"); await page.waitForSelector(".wb-stage .wb-frame"); await page.waitForTimeout(400);
    let b = await saved();
    ok(b.length === 1 && b[0].text === "Cell Biology" && b[0].wb.tpl === "grid" && b[0].courseId === "c1", "Create Whiteboard saves the board with its name, template and course");
    ok(await page.locator(".wb-tplbox pattern").count() === 1 && await page.locator("#nbBoard .note").count() === 0, "the board shows its grid; sticky notes aren't on it");
    await page.click('.nv-tabs [data-id="board"]'); await page.waitForTimeout(250);
    ok(await page.locator("#nbBoard .note").count() === 1 && !(await page.locator("#nbBoard").textContent()).includes("Cell Biology"), "the board never shows up as a sticky note");
    await page.click('.nv-tabs [data-id="wb"]'); await page.waitForTimeout(300);
    await frameBox();
    const z0 = (await page.evaluate(() => SBWB.cam())).z;
    ok(z0 < 0.4, "a new board opens showing the whole board: " + z0);
    // the board's own colour: light or dark whatever the app uses
    const bg = () => page.evaluate(() => getComputedStyle(document.querySelector(".wb-back")).backgroundColor);
    const light0 = await bg();
    await page.click('.wb-zoom [data-wb="theme"]'); await page.waitForTimeout(150);
    ok(await page.evaluate(() => document.querySelector(".wb-stage").classList.contains("wb-dk")) && await bg() !== light0 && !(await page.evaluate(() => document.documentElement.getAttribute("data-theme") === "dark")), "the moon button makes the board dark while the app stays light");
    await act("wb-opts"); await page.waitForSelector('dialog[open] input[name="wbTheme"]');
    ok(await page.isChecked('dialog[open] input[name="wbTheme"][value="dark"]'), "Options shows Board Color: Dark");
    await page.click('dialog[open] .wb-start label:has(input[value="auto"])'); await page.click("dialog[open] [data-submit]"); await page.waitForTimeout(200);
    ok(!(await page.evaluate(() => document.querySelector(".wb-stage").classList.contains("wb-dk"))) && await bg() === light0, "Match App puts it back to the app's light board");
    await page.click('.wb-zoom [data-wb="zoom-reset"]'); await page.waitForTimeout(100);
    ok((await page.evaluate(() => SBWB.cam())).z === 1 && /100%/.test(await page.locator(".wbz-pct").textContent()), "100% zooms to full size");

    // marker
    await wb("tool", "pen"); await wb("pen", "blue"); await wb("pw", 1);
    const p1 = []; for (let i = 0; i <= 30; i++) p1.push([F.x + 100 + i * 10, F.y + 120 + Math.sin(i / 3) * 40]);
    await stroke(p1);
    let L = await live();
    ok(L.strokes.length === 1 && L.strokes[0].t === "pen" && L.strokes[0].c === "blue" && L.strokes[0].w === 70, "the marker draws a blue Medium stroke: " + JSON.stringify(L.strokes[0] && {c: L.strokes[0].c, w: L.strokes[0].w}));
    const px = await page.evaluate(([x, y]) => { const c = document.querySelector(".wb-ink"), d = c.getContext("2d").getImageData(Math.round(x * devicePixelRatio), Math.round(y * devicePixelRatio), 1, 1).data; return [...d]; }, [p1[15][0] - F.x, p1[15][1] - F.y]);
    ok(px[3] > 0 && px[2] > px[0], "and it's on the ink canvas, in blue: " + px);
    await page.waitForTimeout(1300);
    b = await saved();
    ok((b[0].wbInk || []).length === 1, "a moment after drawing, the stroke is saved with the board");

    // highlighter, shape tool, hold-still snapping
    await wb("tool", "hl"); await stroke([[F.x + 100, F.y + 260], [F.x + 400, F.y + 262]]);
    await wb("tool", "shape"); await wb("shape", "ellipse"); await stroke([[F.x + 500, F.y + 100], [F.x + 700, F.y + 220]]);
    await wb("tool", "pen");
    const tri = [[F.x + 800, F.y + 300], [F.x + 900, F.y + 120], [F.x + 1000, F.y + 300], [F.x + 802, F.y + 298]];
    const dense = []; for (let i = 1; i < tri.length; i++) for (let k = 0; k < 12; k++) dense.push([tri[i - 1][0] + (tri[i][0] - tri[i - 1][0]) * k / 12 + (k % 3) * 2, tri[i - 1][1] + (tri[i][1] - tri[i - 1][1]) * k / 12 + (k % 2) * 3]);
    dense.push(tri[3]);
    await stroke(dense, true);
    L = await live();
    const kinds = L.strokes.map(s => s.t);
    ok(kinds.filter(t => t === "hl").length === 1, "the highlighter makes a highlighter stroke");
    const ell = await decode(L.strokes[2].d), trip = await decode(L.strokes[3].d);
    ok(ell.length >= 60, "the Shapes tool draws an ellipse: " + ell.length + " points");
    ok(trip.length === 4, "a wobbly triangle held still at the end becomes a neat triangle: " + trip.length + " points");
    const sl = [[F.x + 120, F.y + 400]]; for (let i = 1; i <= 20; i++) sl.push([F.x + 120 + i * 20, F.y + 400 + (i % 2 ? 4 : -3)]);
    await stroke(sl, true);
    L = await live(); const line = await decode(L.strokes[L.strokes.length - 1].d);
    ok(line.length === 2 && Math.abs(line[0][1] - line[1][1]) < 1, "a shaky line held still becomes straight (and level): " + JSON.stringify(line));

    // undo / redo
    await page.keyboard.press("Control+z"); await page.waitForTimeout(60);
    ok((await live()).strokes.length === 4, "Ctrl+Z takes the last stroke away");
    await wb("redo"); ok((await live()).strokes.length === 5, "Redo puts it back");

    // text in the marker font
    await wb("tool", "text"); await wb("pen", "red");
    await page.mouse.click(F.x + 150, F.y + 520); await page.waitForTimeout(80);
    ok(await page.locator(".wb-ta").count() === 1, "the Text tool opens a text box where you click");
    await page.keyboard.type("Mitosis\nPMAT"); await page.keyboard.press("Escape"); await page.waitForTimeout(100);
    L = await live();
    const t = L.items.find(i => i.k === "t");
    ok(t && t.s === "Mitosis\nPMAT" && t.c === "red" && t.f === 46, "Escape saves the text, in red, Medium size: " + JSON.stringify(t));
    const ff = await page.evaluate(() => getComputedStyle(document.querySelector(".wb-t")).fontFamily);
    ok(/Permanent Marker/.test(ff) && await page.evaluate(() => document.fonts.check('40px "Permanent Marker"')), "typed text is in the marker font (served from vendor/fonts)");
    await page.mouse.dblclick(F.x + 170, F.y + 525); await page.waitForTimeout(80);
    ok(await page.locator(".wb-ta").inputValue() === "Mitosis\nPMAT", "double-clicking text opens it for editing");
    await page.keyboard.press("End"); await page.keyboard.type("!"); await page.keyboard.press("Escape"); await page.waitForTimeout(80);
    ok((await live()).items[0].s === "Mitosis\nPMAT!", "and the edit is kept");

    // writing styles
    await page.keyboard.press("Escape");
    await page.click('.wb-tray .wb-fontpick[data-id="font"]'); await page.waitForTimeout(60);
    ok(await page.locator('.wb-fontmenu [data-wb="font"]').count() === 5 && await page.locator('.wb-tray .wb-fontpick[data-id="font"][aria-expanded=true]').count() === 1, "the Text tool's writing style dropdown lists 5 styles");
    await page.keyboard.press("Escape"); await page.waitForTimeout(40);
    ok(await page.locator(".wb-fontmenu").count() === 0, "Escape closes it");
    await page.evaluate(() => SBWB.select([SBWB.board().items[0]].map(i => "i" + i.id)));
    await page.click('.wb-tray .wb-fontpick[data-id="font"]'); await page.click('.wb-fontmenu [data-id="neat"]'); await page.waitForTimeout(80);
    ok(/Neat/.test(await page.locator('.wb-tray .wb-fontpick[data-id="font"]').textContent()) && await page.locator(".wb-fontmenu").count() === 0, "picking from the dropdown closes it and shows the choice");
    const ff1 = await page.evaluate(() => [SBWB.board().items[0].ff, getComputedStyle(document.querySelector(".wb-t")).fontFamily]);
    ok(ff1[0] === "neat" && /Patrick Hand/.test(ff1[1]) && await page.evaluate(() => document.fonts.check("40px 'Patrick Hand'")), "picking Neat changes the selected text to it (font served from vendor/fonts): " + ff1.join(" / "));
    await page.mouse.click(F.x + 600, F.y + 120); await page.waitForTimeout(60); await page.keyboard.type("Quick"); await page.keyboard.press("Escape"); await page.waitForTimeout(60);
    ok((await live()).items.some(i => i.s === "Quick" && i.ff === "neat"), "new text is written in the chosen style");
    await page.evaluate(() => { const it = SBWB.board().items.find(i => i.s === "Quick"); SBWB.change(set => set("i", it.id, null)); });
    await page.evaluate(() => SBWB.select([SBWB.board().items[0]].map(i => "i" + i.id))); await page.click('.wb-tray .wb-fontpick[data-id="font"]'); await page.click('.wb-fontmenu [data-id="marker"]'); await page.waitForTimeout(60);
    ok(!(await live()).items[0].ff, "and Marker puts it back");
    // text size dropdown: resizes the selected text
    await page.evaluate(() => SBWB.select([SBWB.board().items[0]].map(i => "i" + i.id)));
    const f0 = (await live()).items[0].f;
    await page.click('.wb-tray .wb-fontpick[data-id="size"]'); await page.waitForTimeout(40);
    ok(await page.locator('.wb-fontmenu [data-wb="tsize"]').count() === 4, "the text size dropdown has Small, Medium, Large and Huge");
    await page.click('.wb-fontmenu [data-wb="tsize"][data-id="3"]'); await page.waitForTimeout(80);
    const f1 = (await live()).items[0].f;
    ok(f1 > f0 * 1.8 && /Huge/.test(await page.locator('.wb-tray .wb-fontpick[data-id="size"]').textContent()), "Huge makes the selected text bigger: " + f0 + " to " + f1);
    await page.evaluate(() => SBWB.undo()); await page.click('.wb-tray .wb-fontpick[data-id="size"]'); await page.click('.wb-fontmenu [data-wb="tsize"][data-id="1"]'); await page.evaluate(() => SBWB.undo()); await page.waitForTimeout(40);
    // the rainbow marker is Pro
    ok(await page.locator('.wb-tray [data-wb="pen-any"] .wb-pro').count() === 1, "the rainbow (any color) marker shows a Pro badge on a free plan");
    await page.click('.wb-tray [data-wb="pen-any"]'); await page.waitForTimeout(250);
    ok(/any color/i.test(await page.locator("dialog[open]").textContent()), "and opens the Pro sheet");
    await page.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
    await page.keyboard.press("Escape"); await page.waitForTimeout(40);
    await page.evaluate(() => SBWB.select([SBWB.board().items[0]].map(i => "i" + i.id)));

    // moving without switching to Select
    const tBB = () => page.evaluate(() => { const it = SBWB.board().items[0], b = SBWB.itemBB(it), c = SBWB.cam(), r = document.querySelector(".wb-frame").getBoundingClientRect(); return {x: r.left + (b[0] + b[2]) / 2 * c.z + c.x, y: r.top + (b[1] + b[3]) / 2 * c.z + c.y, ix: it.x, iy: it.y}; });
    ok(await page.locator(".wb-selbar:not([hidden])").count() === 1, "text you've just written stays picked up (its box shows), ready to drag");
    let tb = await tBB();
    await page.mouse.move(tb.x, tb.y); await page.mouse.down(); await page.mouse.move(tb.x + 40, tb.y + 20, {steps: 4}); await page.mouse.move(tb.x + 80, tb.y + 40, {steps: 4}); await page.mouse.up(); await page.waitForTimeout(80);
    let tb2 = await tBB();
    ok(Math.abs(tb2.ix - tb.ix - 80) < 2 && Math.abs(tb2.iy - tb.iy - 40) < 2 && await page.evaluate(() => SBWB.tool()) === "text" && await page.locator(".wb-ta").count() === 0, "with the Text tool, dragging text moves it (no switching tools)");
    await page.keyboard.press("Escape"); await page.waitForTimeout(40);
    tb = await tBB();
    await page.mouse.move(tb.x, tb.y); await page.mouse.down(); await page.mouse.move(tb.x + 60, tb.y, {steps: 5}); await page.mouse.up(); await page.waitForTimeout(80);
    tb2 = await tBB();
    ok(Math.abs(tb2.ix - tb.ix - 60) < 2, "and so does dragging text that isn't picked up yet");
    await page.keyboard.press("Escape"); await page.mouse.click(tb2.x + 60, tb2.y); await page.waitForTimeout(700);
    ok(await page.locator(".wb-ta").count() === 0 && await page.locator(".wb-selbar:not([hidden])").count() === 1 && /Edit Text/.test(await page.locator(".wb-selbar").textContent()), "a first tap on text picks it up and its menu stays open");
    await page.mouse.click(tb2.x + 60, tb2.y); await page.waitForTimeout(120);
    ok(await page.locator(".wb-ta").count() === 1 && await page.locator(".wb-ta").inputValue() === "Mitosis\nPMAT!", "a second tap opens it for editing");
    { const tr = await page.evaluate(() => { const r = document.querySelector(".wb-ta").getBoundingClientRect(); return {x: r.left + 12, y: r.top + 10}; });
      await page.mouse.dblclick(tr.x, tr.y); await page.waitForTimeout(400);
      const sel = await page.evaluate(() => { const t = document.querySelector(".wb-ta"); return t && document.activeElement === t ? t.value.slice(t.selectionStart, t.selectionEnd) : null; });
      ok(sel === "Mitosis", "double-clicking a word in the open text selects it, and it stays selected: " + JSON.stringify(sel)); }
    await page.keyboard.press("Escape"); await page.keyboard.press("Escape"); await page.waitForTimeout(60);
    // the marker: press and hold on a stroke to pick it up and move it
    await wb("tool", "pen");
    const nS0 = (await live()).strokes.length, s1 = (await live()).strokes[0], p1d = await decode(s1.d);
    const [hx, hy] = await toScreen(p1d[5][0], p1d[5][1]);
    await page.mouse.move(hx, hy); await page.mouse.down(); await page.waitForTimeout(650);
    await page.mouse.move(hx + 30, hy + 30, {steps: 4}); await page.mouse.move(hx + 50, hy + 70, {steps: 4}); await page.mouse.up(); await page.waitForTimeout(80);
    const L2 = await live(), m1 = await decode(L2.strokes.find(x => x.id === s1.id).d), z2 = (await page.evaluate(() => SBWB.cam())).z;
    ok(L2.strokes.length === nS0 && Math.abs((m1[0][0] - p1d[0][0]) * z2 - 50) < 2 && Math.abs((m1[0][1] - p1d[0][1]) * z2 - 70) < 2 && await page.evaluate(() => SBWB.tool()) === "pen",
      "with the marker, pressing and holding on a stroke picks it up and moves it (no new stroke drawn)");
    await page.keyboard.press("Escape");
    await page.mouse.move(hx, hy + 160); await page.mouse.down(); await page.mouse.move(hx + 80, hy + 170, {steps: 5}); await page.mouse.up(); await page.waitForTimeout(60);
    ok((await live()).strokes.length === nS0 + 1, "drawing straight away (no hold) still just draws");
    await page.keyboard.press("Control+z");

    // select: click a stroke, drag it, resize it, delete
    await wb("tool", "select");
    const s0 = (await live()).strokes[0], before = await decode(s0.d);
    const [sx, sy] = await toScreen(before[8][0], before[8][1]);
    await page.mouse.click(sx, sy); await page.waitForTimeout(60);
    ok(await page.locator(".wb-selbar:not([hidden])").count() === 1, "clicking a stroke with Select picks it (and shows its menu)");
    await page.mouse.move(sx, sy); await page.mouse.down(); await page.mouse.move(sx + 50, sy + 30, {steps: 5}); await page.mouse.move(sx + 100, sy + 60, {steps: 5}); await page.mouse.up(); await page.waitForTimeout(80);
    const moved = await decode((await live()).strokes.find(s => s.id === s0.id).d);
    ok(Math.abs(moved[0][0] - before[0][0] - 100) < 1.5 && Math.abs(moved[0][1] - before[0][1] - 60) < 1.5, "dragging moves it 100 by 60 at 100% (same stroke id, so sync keeps it one stroke)");
    await page.evaluate(() => document.querySelector('.wb-selbar [data-wb="sel-color"][data-id="green"]').click());
    ok((await live()).strokes.find(s => s.id === s0.id).c === "green", "a colour in the selection menu recolours it");
    await page.keyboard.press("Delete"); await page.waitForTimeout(60);
    ok(!(await live()).strokes.some(s => s.id === s0.id), "Delete removes the selection");
    await page.keyboard.press("Control+z");
    ok((await live()).strokes.some(s => s.id === s0.id), "and Undo brings it back");
    // marquee select everything, duplicate
    await page.keyboard.press("Control+a"); await page.waitForTimeout(40);
    const cnt = (await live()).strokes.length + (await live()).items.length;
    await page.keyboard.press("Control+d"); await page.waitForTimeout(60);
    L = await live();
    ok(L.strokes.length + L.items.length === cnt * 2, "Ctrl+A then Ctrl+D duplicates everything: " + cnt + " to " + (L.strokes.length + L.items.length));
    await page.keyboard.press("Control+z"); await page.keyboard.press("Escape");

    // the eraser: parts splits a stroke in two, whole strokes removes it
    await wb("tool", "pen"); await wb("pw", 2);
    await stroke([[F.x + 300, F.y + 450], [F.x + 700, F.y + 450]]);
    L = await live(); const longId = L.strokes[L.strokes.length - 1].id, nS = L.strokes.length;
    await wb("tool", "eraser"); await wb("erase", "part"); await wb("ew", 1);
    await stroke([[F.x + 500, F.y + 400], [F.x + 500, F.y + 500]]);
    L = await live();
    ok(!L.strokes.some(s => s.id === longId) && L.strokes.length === nS + 1, "Erase Parts cuts a line through the middle into two strokes");
    const mid = await page.evaluate(([x, y]) => SBWB.toWorld(x, y), [F.x + 500, F.y + 450]);
    const ends = await Promise.all(L.strokes.slice(-2).map(s => decode(s.d)));
    ok(ends.every(e => e.every(p => Math.abs(p[0] - mid[0]) > 14)), "and nothing is left under the eraser");
    await wb("erase", "whole");
    const [ex, ey] = [F.x + 400, F.y + 450];
    await stroke([[ex, ey - 30], [ex, ey + 30]]);
    ok((await live()).strokes.length === nS, "Whole Strokes removes the whole piece it touches");
    await page.keyboard.press("Control+z"); await page.keyboard.press("Control+z");
    ok((await live()).strokes.some(s => s.id === longId), "two undos bring the uncut line back");
    // the eraser on typed text: Erase Parts takes only the letters it passes over
    await wb("tool", "text"); await page.mouse.click(F.x + 150, F.y + 330); await page.waitForTimeout(60);
    await page.keyboard.type("ABCDEFGH"); await page.keyboard.press("Escape"); await page.keyboard.press("Escape"); await page.waitForTimeout(60);
    const tx = (await live()).items.find(i => i.s === "ABCDEFGH");
    const tm = await page.evaluate(id => { const it = SBWB.board().items.find(i => i.id === id), b = SBWB.itemBB(it), c = SBWB.cam(), r = document.querySelector(".wb-frame").getBoundingClientRect(); return {x: r.left + (b[0] + b[2]) / 2 * c.z + c.x, y: r.top + (b[1] + b[3]) / 2 * c.z + c.y, top: r.top + b[1] * c.z + c.y, bot: r.top + b[3] * c.z + c.y}; }, tx.id);
    await wb("tool", "eraser"); await wb("erase", "part"); await wb("ew", 0);
    await stroke([[tm.x, tm.top - 10], [tm.x, tm.bot + 10]]);
    const parts = (await live()).items.filter(i => i.k === "t" && /^[A-H]+$/.test(i.s)).sort((a, b) => a.x - b.x);
    ok(!(await live()).items.some(i => i.id === tx.id) && parts.length === 2 && (parts[0].s + parts[1].s).length >= 5 && (parts[0].s + parts[1].s).length < 8 && "ABCDEFGH".startsWith(parts[0].s) && "ABCDEFGH".endsWith(parts[1].s) && parts[0].x === tx.x,
      "Erase Parts cuts letters out of typed text, and the rest stays in place: " + parts.map(p => p.s + "@" + p.x).join(", "));
    await page.keyboard.press("Control+z");
    ok((await live()).items.some(i => i.s === "ABCDEFGH"), "Undo puts the whole text back");
    await page.evaluate(id => SBWB.change(set => set("i", id, null)), tx.id);

    // zoom with Ctrl + scroll around the pointer
    await page.mouse.move(F.x + 400, F.y + 300);
    const wBefore = await page.evaluate(([x, y]) => SBWB.toWorld(x, y), [F.x + 400, F.y + 300]);
    await page.keyboard.down("Control"); await page.mouse.wheel(0, 300); await page.keyboard.up("Control"); await page.waitForTimeout(100);
    const zc = (await page.evaluate(() => SBWB.cam())).z, wAfter = await page.evaluate(([x, y]) => SBWB.toWorld(x, y), [F.x + 400, F.y + 300]);
    ok(zc < 1 && Math.abs(wAfter[0] - wBefore[0]) < 3 && Math.abs(wAfter[1] - wBefore[1]) < 3, "Ctrl + scroll zooms out around the pointer: " + zc);
    const strokeW = async () => { await wb("tool", "pen"); await stroke([[F.x + 200, F.y + 560], [F.x + 260, F.y + 560]]); const l = await live(); return l.strokes[l.strokes.length - 1].w; };
    await wb("tool", "pen"); await wb("pw", 1);
    const wz = await strokeW();
    ok(Math.abs(wz - Math.round(70 / zc)) <= 1, "zoomed out, a Medium marker is still Medium on screen (thicker on the board): " + wz);
    await page.keyboard.press("Control+z");

    // saved, survives a reload, two boards and the picker
    await flush(); await page.waitForTimeout(200);
    const keep = (await live());
    await page.reload(); await page.waitForTimeout(1500);
    await page.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
    await page.evaluate(() => { const b = document.querySelector('nav.tabs [data-tab="notes"]'); b && b.click(); });
    await page.waitForSelector(".wb-stage"); await page.waitForTimeout(300);
    L = await live();
    ok(L.strokes.length === keep.strokes.length && L.items.length === 1 && Math.abs((await page.evaluate(() => SBWB.cam())).z - zc) < 0.01, "after a reload the Whiteboard view, the board, its drawing and its zoom are all back");
    await act("wb-quick", "kanban"); await page.waitForTimeout(400);
    ok((await saved()).length === 2 && await page.locator("[data-wb-pick] option").count() === 3 && (await live()).strokes.length === 0, "a second board starts empty and the picker lists both (plus New)");
    await page.selectOption("[data-wb-pick]", (await saved()).find(x => x.text === "Cell Biology").id); await page.waitForTimeout(300);
    ok((await live()).strokes.length === keep.strokes.length, "picking the first board in the dropdown opens it again");

    // export a picture
    const [dl] = await Promise.all([page.waitForEvent("download"), (async () => { await act("wb-export"); await page.click('dialog[open] [data-wbx="png"]'); })()]);
    const file = await dl.path(), buf = fs.readFileSync(file);
    ok(dl.suggestedFilename() === "Cell Biology.png" && buf.slice(1, 4).toString() === "PNG" && buf.length > 5000, "Export > Save as Picture downloads a PNG of the board: " + buf.length + " bytes");
    // All Boards
    await act("wb-all"); await page.waitForSelector("dialog[open] .wb-card img");
    ok(await page.locator("dialog[open] .wb-card[data-wbopen]").count() === 2, "All Boards shows both boards with pictures of them");
    await page.keyboard.press("Escape");

    // delete: Recently Deleted, and undo
    await act("wb-opts"); await page.click('dialog[open] [data-wbo="del"]'); await page.click("dialog[open] [data-submit]"); await page.waitForTimeout(400);
    await page.waitForTimeout(300); await act("trash-open"); await page.waitForSelector("dialog[open]"); await page.waitForTimeout(400);
    ok((await saved()).length === 1 && (await page.locator("dialog[open]").textContent()).includes("Whiteboard: Cell Biology"), "Delete Board sends it to Recently Deleted as “Whiteboard: Cell Biology”");
    await page.keyboard.press("Escape"); await page.waitForTimeout(150);
    // the last board deleted: someone who has made boards gets the New Whiteboard sheet, not the first-time start screen
    await act("wb-opts"); await page.click('dialog[open] [data-wbo="del"]'); await page.click("dialog[open] [data-submit]"); await page.waitForTimeout(500);
    ok((await saved()).length === 0 && await page.locator(".wb-empty:not(.wb-none)").count() === 0 && await page.locator(".wb-none").count() === 1, "with every board deleted, the start screen doesn't come back (just a New Whiteboard button)");
    await page.click('.nv-tabs [data-id="board"]'); await page.waitForTimeout(200); await page.click('.nv-tabs [data-id="wb"]'); await page.waitForTimeout(300);
    ok(/New Whiteboard/.test(await page.locator("dialog[open] h2").textContent()), "and opening Whiteboard again goes straight to the New Whiteboard sheet");
    ok(!errs.length, "no page errors: " + errs.join(" | "));
    await ctx.close();
    console.log(`whiteboard.e2e: ${n} checks passed`);
  } finally { await browser.close(); server.close(); }
})().catch(e => { console.error(e); process.exit(1); });
