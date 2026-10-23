// node tests/qol-study.e2e.js (Playwright + Chromium; no network) Notes, review, quizzes, the PDF reader and the course page on desktop and phone
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const csp = require("../scripts/csp");
const root = path.join(__dirname, "..");
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  const mime = {".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".webp": "image/webp"};
  res.writeHead(200, {"content-type": mime[path.extname(f)] || "application/octet-stream"});
  if (p === "/index.html" || /^\/bundle\/[^/]+\.js$/.test(p)) { res.end((/\.html$/.test(p) ? csp.apply : String)(fs.readFileSync(f, "utf8").replace("const PRO_ENFORCED = true;", "const PRO_ENFORCED = false;"))); return; }
  fs.createReadStream(f).pipe(res);
});
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const pad = x => String(x).padStart(2, "0");
const day = off => { const d = new Date(); d.setDate(d.getDate() + off); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
function textPdf(){
  const page = lines => lines.map((l, i) => `BT /F1 14 Tf 72 ${700 - i * 24} Td (${l}) Tj ET`).join("\n");
  const c1 = page(["Chapter 4: The Cell", "Mitochondria produce ATP."]), c2 = page(["Chapter 4, continued", "Osmosis moves water."]), c3 = page(["Chapter 5", "Proteins fold."]);
  const objs = ["<< /Type /Catalog /Pages 2 0 R >>", "<< /Type /Pages /Kids [3 0 R 5 0 R 8 0 R] /Count 3 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 6 0 R >>", "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 7 0 R >>",
    `<< /Length ${c1.length} >>\nstream\n${c1}\nendstream`, `<< /Length ${c2.length} >>\nstream\n${c2}\nendstream`,
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 9 0 R >>", `<< /Length ${c3.length} >>\nstream\n${c3}\nendstream`];
  let out = "%PDF-1.4\n"; const offs = [];
  objs.forEach((o, i) => { offs.push(out.length); out += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const x = out.length; out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + offs.map(o => String(o).padStart(10, "0") + " 00000 n \n").join("") + `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${x}\n%%EOF`;
  return [...Buffer.from(out, "latin1")];
}
function SEED(){
  const card = (id, box, due, seen) => ({id, front: "Front " + id, back: "Back " + id, box, due, seen, right: seen, wrong: 0, last: seen ? day(-3) : ""});
  const note = (id, x, y, text, extra) => Object.assign({id, text, color: "yellow", x, y, z: 1, rot: 0, courseId: "", board: "", created: 1, stickers: []}, extra || {});
  return {v: 2, updated: 1, events: [], settings: {noteBoards: [{id: "b1", name: "Ideas", courseId: ""}]},
    courses: [{id: "c1", name: "Biology", code: "BIO101", color: "#3B6FE0", meetings: []}, {id: "c2", name: "History", code: "HIS200", color: "#C8352E", meetings: []}],
    tasks: [{id: "t1", title: "Midterm", courseId: "c1", type: "Exam", due: day(9), status: "todo", priority: "high", created: 1},
      {id: "t2", title: "Lab report", courseId: "c1", type: "Assignment", due: day(3), status: "todo", priority: "med", created: 2}],
    decks: [{id: "d1", name: "Cells", courseId: "c1", created: 1, quizzes: [], cards: [card("a", 2, day(-1), 2), card("b", 1, day(0), 1), card("c", 0, "", 0), card("d", 3, day(5), 3), card("e", 2, day(6), 2), card("f", 2, day(7), 2)]},
      {id: "d2", name: "Wars", courseId: "c2", created: 2, quizzes: [], cards: [card("g", 1, day(0), 1), card("h", 0, "", 0), card("i", 0, "", 0)]}],
    files: [{id: "f1", name: "Reading 4.pdf", courseId: "c1", folderId: "other", kind: "file", taskIds: [], desc: "", url: "", revs: [{assetId: "a-read4", name: "Reading 4.pdf", size: 1200, type: "application/pdf", at: 1}]}],
    notes: [note("n1", 40, 40, "First", {courseId: "c1"}), note("n2", 420, 60, "Second", {color: "blue"}), note("n3", 40, 420, "Low on the board\nwith two lines"), note("n4", 60, 60, "On the Ideas board", {board: "b1"})]};
}
(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  const open = async (opts, seed) => {
    const ctx = await browser.newContext(Object.assign({serviceWorkers: "block"}, opts));
    await ctx.addInitScript(s => { try { if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("coursework:v2", JSON.stringify(s)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("studyboard:tour", "1"); } } catch (e) {} }, seed || SEED());
    const page = await ctx.newPage(); page.errs = []; page.on("pageerror", e => page.errs.push(e.message));
    await page.goto(base); await page.waitForSelector("#view", {state: "attached"}); await page.waitForFunction(() => window.__sbProStudy);
    await page.evaluate(() => { const T = window.__sbProStudy; Object.defineProperty(window, "state", {get: () => T.state(), configurable: true}); window.ui = T.ui; window.render = T.render; document.querySelectorAll("dialog[open]").forEach(d => d.close()); });
    await page.waitForTimeout(700);
    return {ctx, page};
  };
  const act = (page, a, id, data) => page.evaluate(([a, id, data]) => { const b = document.createElement("button"); b.dataset.act = a; if (id) b.dataset.id = id; Object.assign(b.dataset, data || {}); b.style.display = "none"; document.body.appendChild(b); b.click(); b.remove(); }, [a, id || "", data || {}]);
  const tab = async (page, t) => { await page.evaluate(t => { const b = document.querySelector(`nav.tabs [data-tab="${t}"]`); b.click(); }, t); await page.waitForTimeout(350); };
  const rect = (page, sel) => page.evaluate(s => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return {x: r.left, y: r.top, w: r.width, h: r.height, b: r.bottom, r: r.right}; }, sel);
  const stored = page => page.evaluate(() => JSON.parse(localStorage.getItem("coursework:v2")));
  const arr = o => Array.isArray(o) ? o : Object.values(o || {});
  try {
    /* Desktop */
    const {ctx, page} = await open({viewport: {width: 1280, height: 800}});
    await tab(page, "notes"); await page.waitForSelector('#nbBoard .note[data-note="n3"]');
    await page.click('.note[data-note="n3"] .note-body'); await page.waitForSelector(".note.editing #noteText"); await page.waitForTimeout(300);
    const sc = await rect(page, "#nbScroll"), done = await rect(page, '.note.editing [data-act="note-done"]'), ed = await rect(page, ".note.editing");
    ok(done.y >= sc.y && done.b <= sc.b && done.b <= 800, "the note editor scrolls fully into view, with Done on screen: " + JSON.stringify({done, sc}));
    ok(ed.w >= 270, "it is wide enough that the task list reads in full: " + ed.w);
    ok(await page.locator(".note.editing .note-moredd .note-shape").count() === 1 && !(await page.locator(".note.editing .note-shape").isVisible()) && await page.locator(".note.editing select.note-pin").count() === 1 && !(await page.locator('.note.editing .pp-btn').isVisible()), "Shape and Pin wait under More");
    await page.click(".note.editing .note-moredd > summary"); await page.waitForTimeout(100);
    ok(await page.locator(".note.editing .note-shape").isVisible() && await page.locator('.note.editing .pp-btn').isVisible(), "and show when More opens");
    ok(/^No task attached$/.test((await page.locator(".note.editing select.note-task option").first().textContent()).trim()), "the task list starts with a short label");
    await page.click('.note.editing [data-act="note-color"][data-color="pink"]'); await page.waitForTimeout(250);
    ok(await page.evaluate(() => document.querySelector(".note.editing .note-moredd").open), "More stays open after a change redraws the note");
    await page.focus("#noteText"); await page.keyboard.press("Escape");
    ok(await page.waitForFunction(() => document.activeElement && document.activeElement.dataset.note === "n3" && !document.querySelector(".note.editing"), null, {timeout: 3000}).then(() => true, () => false), "Escape closes the editor and keyboard focus goes back to the note");
    const before = arr((await stored(page)).notes).length;
    await page.click("#fab"); await page.waitForTimeout(400);
    ok(await page.evaluate(() => !document.querySelector("dialog[open]")) && await page.locator(".note.editing #noteText").count() === 1, "Add Note makes a note right away, no menu first");
    const all = arr((await stored(page)).notes), made = all.find(x => !["n1", "n2", "n3", "n4"].includes(x.id));
    ok(all.length === before + 1 && made.color === "pink", "the new note takes the last color you picked: " + (made && made.color));
    const overlap = await page.evaluate(id => { const a = document.querySelector(`.note[data-note="${id}"]`); const ra = {x: a.offsetLeft, y: a.offsetTop, w: 200, h: 140}; return [...document.querySelectorAll("#nbBoard .note")].filter(e => e !== a).some(e => e.offsetLeft < ra.x + ra.w && e.offsetLeft + e.offsetWidth > ra.x && e.offsetTop < ra.y + ra.h && e.offsetTop + e.offsetHeight > ra.y); }, made.id);
    ok(!overlap, "and lands in an empty spot, not on top of another note: " + JSON.stringify({x: made.x, y: made.y}));
    await page.keyboard.press("Escape"); await page.waitForTimeout(200);
    ok(await page.locator('.tl-controls [data-act="note-photo"], .pg-head [data-act="note-photo"]').count() === 1, "Photo to Note is a button beside the board");
    await act(page, "note-archive-open"); await page.waitForTimeout(250);
    ok(/Drag a note onto the folder, or open it and choose Archive/.test(await page.locator("dialog[open]").textContent()), "an empty Archive explains both ways to archive");
    await page.evaluate(() => document.querySelector("dialog[open]").close());
    await page.click('.nb-tab[data-id="b1"]'); await page.waitForTimeout(250);
    await act(page, "nb-edit", "b1"); await page.waitForTimeout(250);
    await page.click("[data-nb-del]"); await page.waitForTimeout(300);
    ok(!(await page.evaluate(() => state.settings.noteBoards.some(b => b.id === "b1"))) && await page.evaluate(() => state.notes.n4.board === ""), "deleting a board moves its notes to My Notes");
    await page.click("#toastUndo"); await page.waitForTimeout(300);
    ok(await page.evaluate(() => state.settings.noteBoards.some(b => b.id === "b1" && b.name === "Ideas") && state.notes.n4.board === "b1" && ui.noteBoard === "b1"), "Undo brings the board back with its name and notes");

    /* Whiteboard: Add Board floats bottom right and the board fills the page */
    await page.evaluate(() => { const T = window.__sbProStudy; T.applyChanges([{kind: "note", id: "w1", after: {id: "w1", text: "", wb: {v: 1, tpl: "grid"}, color: "yellow", x: 0, y: 0, z: 1, created: 1}}], null); });
    await act(page, "nv-view", "wb"); await page.waitForSelector(".wb-frame"); await page.waitForTimeout(1200);
    ok(await page.evaluate(() => { const f = document.getElementById("fab"); return getComputedStyle(f).display !== "none" && f.dataset.act === "wb-new" && /Add Board/.test(f.textContent); }), "the Add Board button floats bottom right on an open whiteboard");
    const cv = await rect(page, ".wb-frame"), vh = await page.evaluate(() => innerHeight);
    ok(cv.b >= vh - 40, "the board fills the page down to the bottom: " + JSON.stringify({b: cv.b, vh}));
    await act(page, "nv-view", "board"); await page.waitForTimeout(250);

    /* Course page */
    await page.evaluate(() => { ui.tab = "courses"; ui.courseId = "c1"; render(); }); await page.waitForTimeout(300);
    const view = await page.locator("#view").textContent();
    ok((view.match(/Midterm/g) || []).length === 1 && await page.locator('#view [data-act="exam-plan"]').count() === 1, "the exam shows once, with one Plan My Prep");
    ok(/Your Decks/.test(view) && await page.locator('#view [data-act="course-deck"][data-id="d1"]').count() === 1 && /2 due · 1 new/.test(await page.locator('#view [data-act="course-deck"][data-id="d1"]').textContent()), "the course page lists your decks with what's due");
    ok(await page.locator('#view [data-act="course-note"][data-id="n1"]').count() === 1, "and your notes for the course");
    await page.click('#view [data-act="course-note"][data-id="n1"]'); await page.waitForTimeout(400);
    ok(await page.evaluate(() => ui.tab === "notes" && !!document.querySelector('.note.editing[data-note="n1"]')), "a note opens on its board, ready to edit");
    await page.keyboard.press("Escape"); await page.waitForTimeout(200);

    /* Review */
    await tab(page, "flashcards"); await page.evaluate(() => { ui.rvView = "cards"; ui.filter = "all"; render(); }); await page.waitForTimeout(200);
    ok(/2 due · 1 new/.test(await page.locator('[data-act="fc-study"][data-id="d1"]').locator("xpath=ancestor::article").textContent()), "a deck tile shows what's due and new");
    const heroCount = 6;
    ok(new RegExp(`\\b${heroCount} cards ready to review`).test(await page.locator("#view .rv-hero h3").textContent()) && await page.locator('#view .rv-hero [data-act="fc-review-start"]').count() === 1 && await page.locator('#view .rv-hero [data-act="fc-review-menu"]').count() === 1, "the review hero counts the cards ready (" + heroCount + "), with Start Review and Review Options");
    ok((await page.locator('nav.tabs [data-tab="flashcards"] .fc-navdue').textContent()) === "3", "and so does the Review tab");
    await page.evaluate(() => { ui.filter = "c2"; render(); }); await page.waitForTimeout(200);
    await act(page, "fc-review-menu"); await page.waitForTimeout(250);
    const rv = await page.locator('dialog[open] [data-act="fc-review-all"]').textContent();
    ok(/1 due \+ 2 new/.test(rv), "the Review menu counts only the chosen course, in words: " + rv.trim());
    await page.click('dialog[open] [data-act="fc-review-all"]'); await page.waitForTimeout(300);
    ok(await page.evaluate(() => ui.fc.mode === "study" && ui.fc.deckIds.join() === "d2" && ui.fc.q.length === 3), "and the session holds exactly those cards");
    await page.evaluate(() => { ui.filter = "all"; });
    const card0 = await page.evaluate(() => { const it = ui.fc.q[0]; return JSON.stringify(state.decks[it.deckId].cards.find(c => c.id === it.cardId)); });
    await page.keyboard.press("Space"); await page.waitForTimeout(150);
    await page.click('[data-act="fc-rate"][data-id="again"]'); await page.waitForTimeout(250);
    ok(await page.evaluate(() => ui.fc.i === 1 && ui.fc.q.length === 4 && ui.fc.again === 1), "rating Again moves on and brings the card back later");
    await page.click('#view [data-act="fc-undo"]'); await page.waitForTimeout(250);
    ok(await page.evaluate(([c0]) => { const it = ui.fc.q[0]; return ui.fc.i === 0 && ui.fc.q.length === 3 && ui.fc.again === 0 && ui.fc.flipped && JSON.stringify(state.decks[it.deckId].cards.find(c => c.id === it.cardId)) === c0; }, [card0]), "Undo puts the card and the session back as they were");
    await page.keyboard.press("3"); await page.waitForTimeout(200);
    await page.keyboard.press("z"); await page.waitForTimeout(200);
    ok(await page.evaluate(() => ui.fc.i === 0 && ui.fc.good === 0), "Z undoes too");
    await act(page, "fc-exit"); await page.waitForTimeout(200);

    /* Make a Quiz */
    await page.evaluate(() => { ui.deckId = "d1"; render(); }); await page.waitForTimeout(200);
    await page.click('#view [data-act="fc-quiz"][data-id="d1"]'); await page.waitForTimeout(250);
    ok(await page.inputValue('dialog[open] input[name="qname"]') === "Cells Quiz", "the quiz gets the deck's name");
    await page.check('dialog[open] input[name="qn"][value="5"]');
    await page.uncheck('dialog[open] input[name="qt"][value="mc"]'); await page.uncheck('dialog[open] input[name="qt"][value="tf"]');
    await page.click("dialog[open] [data-submit]"); await page.waitForTimeout(500);
    ok(await page.evaluate(() => ui.fc && ui.fc.mode === "aiquiz" && ui.fc.qs.length === 5 && !document.querySelector("dialog[open]")), "Make Quiz starts the quiz right away");
    ok(await page.evaluate(() => document.activeElement && document.activeElement.id === "aiWritten"), "a written first question has the cursor in the answer box");
    await page.fill("#aiWritten", "Back zzz"); await page.click('#aiForm button[type="submit"]'); await page.waitForTimeout(400);
    await page.click('#view [data-act="fc-exit"]'); await page.waitForTimeout(250);
    ok(/Quit This Quiz/.test(await page.locator("dialog[open]").textContent()), "quitting after answering asks first");
    await page.click('dialog[open] [data-act="close"]'); await page.waitForTimeout(200);
    ok(await page.evaluate(() => ui.fc && ui.fc.mode === "aiquiz" && ui.fc.ans.filter(Boolean).length === 1), "Cancel keeps the quiz and its answer");
    await page.click('#view [data-act="fc-exit"]'); await page.waitForTimeout(250);
    await page.click("dialog[open] [data-submit]"); await page.waitForTimeout(250);
    ok(await page.evaluate(() => !ui.fc), "Quit Quiz leaves");
    await page.evaluate(() => { ui.rvView = "cards"; ui.deckId = "d1"; render(); }); await page.waitForTimeout(200);
    await page.click('#view [data-act="fc-quiz"][data-id="d1"]'); await page.waitForTimeout(250);
    ok(await page.inputValue('dialog[open] input[name="qname"]') === "Cells Quiz (2)", "a second quiz from the deck gets its own name");
    ok(await page.isChecked('dialog[open] input[name="qn"][value="5"]') && !(await page.isChecked('dialog[open] input[name="qt"][value="mc"]')) && await page.isChecked('dialog[open] input[name="qt"][value="written"]'), "and the choices from last time");
    await page.check('dialog[open] input[name="qt"][value="tf"]'); await page.uncheck('dialog[open] input[name="qt"][value="written"]');
    await page.click("dialog[open] [data-submit]"); await page.waitForTimeout(500);
    ok(await page.evaluate(() => ui.fc.qs[0].type === "truefalse"), "a true or false quiz starts");
    await page.keyboard.press("t"); await page.waitForTimeout(200);
    ok(await page.evaluate(() => !!ui.fc.ans[0] && ui.fc.ans[0].given[0] === ui.fc.qs[0].options.findIndex(o => /true/i.test(o))), "T answers True in a saved quiz");
    ok(await page.evaluate(() => { const t = Object.values(state.decks.d1.aiQuizzes).map(q => q.title); return t.includes("Cells Quiz") && t.includes("Cells Quiz (2)"); }), "both quizzes are saved under different names");
    await page.evaluate(() => { ui.fc = null; render(); });

    /* PDF reader */
    await page.evaluate(async bytes => { await window.__sbProStudy.idbSet("pdf:a-read4", new Blob([new Uint8Array(bytes)], {type: "application/pdf"})); }, textPdf());
    await page.evaluate(() => { ui.tab = "files"; ui.fCourse = "all"; ui.fFolder = ""; render(); }); await page.waitForTimeout(250);
    ok(await page.locator('.frow[data-fid="f1"] .fmain[data-act="pdr-open"]').count() === 1 && await page.locator('.frow[data-fid="f1"] [data-act="f-open"]').count() === 1, "tapping a PDF reads it; Edit is the second choice");
    await act(page, "f-open", "f1"); await page.waitForTimeout(250);
    ok(/Open in Browser/.test(await page.locator("dialog[open] .sheet-foot").textContent()), "the file sheet says where Open goes");
    await page.evaluate(() => document.querySelector("dialog[open]").close());
    await page.click('.frow[data-fid="f1"] .fmain'); await page.waitForSelector(".pdr-page .textLayer span", {timeout: 15000});
    const P = () => page.evaluate(() => window.__sbProStudy.P.reader().cur);
    const onPage = k => page.waitForFunction(k => { const R = window.__sbProStudy.P.reader(), b = document.getElementById("pdrPages"); return R.cur === k && Math.abs(b.scrollTop - Math.min(b.scrollHeight - b.clientHeight, R.pages[k - 1].el.offsetTop - 12)) < 4; }, k, {timeout: 5000}).then(() => true, () => false);
    await page.focus("#pdrPages"); await page.keyboard.press("PageDown");
    ok(await onPage(2), "Page Down goes to the next page");
    await page.keyboard.press("ArrowLeft");
    ok(await onPage(1), "the left arrow goes back");
    await page.keyboard.press("End");
    ok(await onPage(3), "End goes to the last page");
    const s0 = await page.evaluate(() => window.__sbProStudy.P.reader().fit);
    await page.click("#pdrFit"); await page.waitForTimeout(500);
    const fitH = await page.evaluate(() => { const b = document.getElementById("pdrPages"), p = b.querySelector(".pdr-page"); return p.offsetHeight <= b.clientHeight; });
    ok(fitH && await page.evaluate(() => window.__sbProStudy.P.reader().fit) < s0, "Fit Page shows a whole page at once");
    await page.click("#pdrFit"); await page.waitForTimeout(400);
    await page.focus("#pdrPages"); await page.keyboard.press("ArrowLeft"); await onPage(2);
    await page.evaluate(() => document.querySelector("dialog[open]").close()); await page.waitForTimeout(200);
    await page.click('.frow[data-fid="f1"] .fmain'); await page.waitForSelector(".pdr-page .textLayer span", {timeout: 15000}); await page.waitForTimeout(400);
    ok(await P() === 2 && await page.inputValue("#pdrPg") === "2", "the reader opens where you left off");
    await page.evaluate(() => document.querySelector("dialog[open]").close());
    ok(page.errs.length === 0, "no page errors on desktop: " + page.errs.join(" | "));
    await ctx.close();

    /* Phone */
    const ph = await open({viewport: {width: 390, height: 844}, isMobile: true, hasTouch: true, colorScheme: "dark"});
    const p2 = ph.page;
    await tab(p2, "notes"); await p2.waitForSelector('#nbBoard .note[data-note="n1"]');
    for (const sel of [".nb-zoom button"]) { const r = await rect(p2, sel); ok(r.w >= 40 && r.h >= 40, `${sel} is at least 40px: ${r.w}x${r.h}`); }
    const rot = await rect(p2, '.note[data-note="n1"] .note-rot');
    ok(await p2.evaluate(([x, y]) => { const e = document.elementFromPoint(x, y); return !!(e && e.closest(".note-rot")); }, [rot.x + rot.w / 2 + 18, rot.y + rot.h / 2]), "the rotate handle answers a touch 18px from its middle");
    await p2.tap('.note[data-note="n1"] .note-body'); await p2.waitForSelector(".note.editing #noteText"); await p2.waitForTimeout(300);
    const sh = await rect(p2, ".note.editing");
    ok(await p2.evaluate(() => document.querySelector(".note.editing").matches(":popover-open")) && sh.w >= 388 && Math.abs(sh.b - 844) < 2, "on a phone the editor is a full-width sheet at the bottom: " + JSON.stringify(sh));
    for (const sel of ['.note.editing [data-act="note-done"]', '.note.editing [data-act="note-undo"]', '.note.editing [data-act="np-link"]']) {
      const r = await rect(p2, sel);
      ok(r && r.b <= 844 && await p2.evaluate(([x, y, s]) => { const e = document.elementFromPoint(x, y); return !!(e && e.closest(s)); }, [r.x + r.w / 2, r.y + r.h / 2, sel]), `${sel.split('"')[1]} is on screen and nothing covers it`);
    }
    const dot = await rect(p2, '.note.editing .nc');
    ok(dot.w >= 40 && dot.h >= 40, "color dots are easy to tap: " + dot.w);
    await p2.fill("#noteText", "First, edited on a phone");
    await p2.touchscreen.tap(195, 30); await p2.waitForTimeout(400);
    ok(await p2.evaluate(() => !document.querySelector(".note.editing") && state.notes.n1.text === "First, edited on a phone" && ui.tab === "notes"), "tapping above the sheet saves and closes it, without tapping what's behind");
    await p2.evaluate(() => { const T = window.__sbProStudy; T.applyChanges([{kind: "note", id: "w1", after: {id: "w1", text: "", wb: {v: 1, tpl: "grid"}, color: "yellow", x: 0, y: 0, z: 1, created: 1}}], null); });
    await act(p2, "nv-view", "wb"); await p2.waitForSelector(".wb-tool"); await p2.waitForTimeout(600);
    const tools = await p2.evaluate(() => [...document.querySelectorAll(".wb-tool,.wb-hist button")].map(b => { const r = b.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; }));
    ok(tools.length >= 9 && tools.every(([w, h]) => w >= 40 && h >= 40), "whiteboard tools are at least 40px: " + JSON.stringify(tools));
    await act(p2, "nv-view", "board");
    await p2.evaluate(() => { ui.tab = "flashcards"; ui.rvView = "cards"; render(); }); await p2.waitForTimeout(200);
    await act(p2, "fc-study", "d1"); await p2.waitForTimeout(300);
    await p2.tap(".flip"); await p2.waitForTimeout(250);
    ok(await p2.evaluate(() => [...document.querySelectorAll("#view .kbd-only")].every(e => !e.offsetParent)), "no keyboard hints on a touch screen");
    await act(p2, "fc-exit");
    ok(p2.errs.length === 0, "no page errors on a phone: " + p2.errs.join(" | "));
    await ph.ctx.close();

    console.log(`\n${n} checks passed`);
  } catch (e) { console.error(e); process.exitCode = 1; }
  finally { await browser.close(); server.close(); }
})();
