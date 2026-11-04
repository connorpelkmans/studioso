// node tests/pdf-edit-text-fixes.e2e.js   (PDE_SHOTS=<folder> also saves screenshots)
// Editing text in a PDF, hands-on: lines made of several pieces, lines that aren't a paragraph, style-only changes, Replace All with letters
// a font can't draw, text past the page's edge, a paragraph that grows, zooming while typing, Escape, finishing a text box, Find's keys
/* global state, dlg */
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const csp = require("../scripts/csp");
const root = path.join(__dirname, "..");
const SHOTS = process.env.PDE_SHOTS || "";
const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x"); let p = decodeURIComponent(u.pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  const ext = path.extname(f), mime = {".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".css": "text/css", ".webmanifest": "application/manifest+json"};
  res.writeHead(200, {"content-type": mime[ext] || "application/octet-stream"});
  if (p === "/index.html" || /^\/bundle\/[^/]+\.js$/.test(p)) { res.end((/\.html$/.test(p) ? csp.apply : String)(fs.readFileSync(f, "utf8").replace("const PRO_ENFORCED = true;", "const PRO_ENFORCED = false;"))); return; }
  fs.createReadStream(f).pipe(res);
});
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };

// a syllabus: a bold label and a name on one line, lines that look alike but aren't a paragraph, a justified paragraph,
// and (page 2) separate lines, then a wrapped paragraph with a bold word in it
const SYL = `<html><body style="margin:56px 64px;font-family:Arial;color:#1d1d1f">
<h1 style="font-size:26px;margin:0 0 4px">BIO 101: Introduction to Biology</h1>
<p style="font-size:14px;color:#555;margin:0 0 18px">Fall Semester · Section 02 · Hall B, Room 114</p>
<p style="font-size:14px;margin:0 0 6px"><b>Instructor:</b> Dr. Maria Rivera</p>
<p style="font-size:14px;margin:0 0 18px"><b>Office hours:</b> Tuesday and Thursday, 2:00 to 4:00 pm</p>
<h2 style="font-size:17px;margin:0 0 6px">Exams and Deadlines</h2>
<p style="font-family:Georgia;font-size:14px;line-height:1.5;text-align:justify;margin:0 0 14px">The midterm exam is on October 20 in Hall B and covers chapters one through six. The final project is due December 5 and is worth forty percent of your grade. Late work loses ten percent per day unless you ask for an extension before the deadline.</p>
<h2 style="font-size:17px;margin:0 0 6px">Grading</h2>
<p style="font-size:14px;margin:0 0 4px">Labs 30% · Midterm 30% · Final project 40%</p>
<p style="font-size:12px;color:#1a4fb0;margin:70px 0 0">Draft copy: not for distribution</p>
<div style="page-break-before:always"></div>
<h1 style="font-size:22px">Week by week</h1>
<p style="font-size:14px">Week 1: Cells and membranes. Read chapter one.</p>
<p style="font-size:14px">Week 2: Energy and enzymes. Hall B lab.</p>
<p style="font-size:14px;width:330px;margin-top:30px">Safety comes first in every lab session this term. Students must wear <b>goggles</b> and closed shoes at all times, and keep bags under the benches.</p>
</body></html>`;

(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  try {
    const maker = await browser.newPage(); await maker.setContent(SYL); const pdf = await maker.pdf({format: "Letter"}); await maker.close();
    const seed = {v: 2, updated: 1, decks: [], notes: [], tasks: [], settings: {}, courses: [{id: "c1", name: "Biology", code: "BIO101", color: "#3B6FE0"}],
      files: [{id: "f1", name: "BIO 101 Syllabus.pdf", courseId: "c1", folderId: "other", kind: "file", taskIds: [], desc: "", url: "", revs: [{assetId: "a-syl", name: "BIO 101 Syllabus.pdf", size: pdf.length, type: "application/pdf", at: 1}]}]};
    const ctx = await browser.newContext({viewport: {width: 1280, height: 900}, deviceScaleFactor: 1, serviceWorkers: "block", acceptDownloads: true});
    await ctx.addInitScript(seed => { try { if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("coursework:v2", JSON.stringify(seed)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("studyboard:tour", "1"); } } catch (e) {} }, seed);
    const page = await ctx.newPage(); const errs = [];
    page.on("pageerror", e => errs.push(e.message)); page.on("console", m => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errs.push(m.text()); });
    await page.goto(base); await page.waitForSelector("#view", {state: "attached"}); await page.waitForFunction(() => window.__sbProStudy);
    await page.evaluate(() => { const T = window.__sbProStudy; Object.defineProperty(window, "state", {get: () => T.state(), configurable: true}); Object.defineProperty(window, "dlg", {get: () => T.dlg(), configurable: true}); });
    await page.waitForTimeout(500);
    // every toast shown, in order
    const toasts = []; await page.exposeFunction("__toast", t => toasts.push(t));
    await page.evaluate(() => { const m = document.getElementById("toastMsg"); new MutationObserver(() => window.__toast(m.textContent)).observe(m, {childList: true, characterData: true, subtree: true}); });
    const lastToast = () => toasts[toasts.length - 1] || "";
    const shot = async name => { if (SHOTS) { fs.mkdirSync(SHOTS, {recursive: true}); await page.screenshot({path: path.join(SHOTS, name + ".png")}); } };
    const tool = async id => { if (await page.locator(`.pde-tools > .pde-tool[data-id="${id}"]`).count()) await page.click(`.pde-tools > .pde-tool[data-id="${id}"]`); else { await page.click('[data-act="pde-more"]'); await page.click(`.pde-mi[data-id="${id}"]`); } await page.waitForTimeout(250); };
    const wordAt = word => page.evaluate(word => {
      const span = [...document.querySelectorAll(".pdr-page .textLayer span")].find(s => s.textContent.includes(word)); if (!span) return null;
      span.scrollIntoView({block: "center"});
      const tn = span.firstChild, i = tn.textContent.indexOf(word), r = document.createRange(); r.setStart(tn, i); r.setEnd(tn, i + word.length);
      const b = r.getBoundingClientRect(); return {x: b.left + b.width / 2, y: b.top + b.height / 2, l: b.left, r: b.right, t: b.top, b: b.bottom};
    }, word);
    const clickWord = async word => { const p = await wordAt(word); assert(p, "on the page: " + word); await page.mouse.click(p.x, p.y); await page.waitForTimeout(450); };
    const selectInEditor = word => page.evaluate(word => {
      const t = document.querySelector(".pde-e.editing .pde-t"), tn = t.firstChild, i = tn.textContent.indexOf(word), r = document.createRange();
      r.setStart(tn, i); r.setEnd(tn, i + word.length); const s = getSelection(); s.removeAllRanges(); s.addRange(r); return i >= 0;
    }, word);
    const S = () => page.evaluate(() => { const s = window.__sbProStudy.pde(); return {on: s.on, tool: s.tool, sel: s.sel, lineOnly: !!s.lineOnly, k: s.ed && s.ed.e.k, t: s.ed && s.ed.e.t, open: dlg.open, hist: ((s.hist || {}).undo || []).map(x => x.label), findAt: s.find && s.find.at}; });
    const edits = () => page.evaluate(() => state.files.f1.pe || []);
    const msg = () => page.evaluate(() => (document.getElementById("pdeMsg") || {}).textContent || "");
    const blank = async () => { const p = await wordAt("Draft copy"); await page.mouse.click(p.r + 150, p.y + 60); await page.waitForTimeout(400); };
    const pdfText = bytes => page.evaluate(async bytes => {
      const doc = await window.pdfjsLib.getDocument({data: new Uint8Array(bytes), disableFontFace: true, isEvalSupported: false}).promise, out = [];
      for (let p = 1; p <= doc.numPages; p++) { const tc = await (await doc.getPage(p)).getTextContent(); out.push(tc.items.filter(i => i.str.trim()).map(i => ({s: i.str, x: Math.round(i.transform[4]), y: Math.round(i.transform[5])}))); }
      return out;
    }, [...bytes]);
    const download = async () => {
      await page.click('[data-act="pde-dl"]'); await page.waitForSelector('[data-act="pde-dl-go"]');
      const [dl] = await Promise.all([page.waitForEvent("download", {timeout: 30000}), page.click('[data-act="pde-dl-go"]')]);
      return fs.readFileSync(await dl.path());
    };
    await page.evaluate(async bytes => { await window.__sbProStudy.idbSet("pdf:a-syl", new Blob([new Uint8Array(bytes)], {type: "application/pdf"})); }, [...pdf]);
    await page.evaluate(() => { const b = document.createElement("button"); b.dataset.act = "pdr-open"; b.dataset.id = "f1"; document.body.appendChild(b); b.click(); b.remove(); });
    await page.waitForSelector(".pdr-page .textLayer span", {timeout: 15000}); await page.waitForTimeout(400);
    await page.click("#pdeBtn"); await page.waitForFunction(() => !!window.PDFLib, null, {timeout: 10000}); await page.waitForTimeout(400);

    /* A line made of pieces (a bold label, then a name), and lines that look alike but aren't one paragraph */
    await clickWord("Rivera");
    let s = await S();
    ok(s.k === "t" && s.t === "Dr. Maria Rivera", "clicking the name opens just that line, not a paragraph made of it and the next line: " + s.k + " " + s.t);
    await selectInEditor("Maria Rivera"); await page.keyboard.type("Zoe Kim"); await page.keyboard.press("Enter"); await page.waitForTimeout(400);
    await clickWord("Thursday"); s = await S();
    ok(s.k === "t" && /^Tuesday and Thursday/.test(s.t), "the office hours line is its own line too");
    await page.keyboard.press("Escape"); await page.waitForTimeout(250);
    await clickWord("Energy"); s = await S();
    ok(s.k === "t" && /^Week 2/.test(s.t), "two short lines one after the other (Week 1, Week 2) aren't a paragraph");
    await page.keyboard.press("Escape"); await page.waitForTimeout(250);
    await clickWord("closed shoes"); s = await S();
    ok(s.k === "p" && /Students must wear goggles and closed shoes/.test(s.t) && /^Safety comes first/.test(s.t) && /benches\.$/.test(s.t), "a wrapped paragraph opens whole, with every word of a line that has a bold word in it: " + s.t);
    await page.keyboard.press("Escape"); await page.waitForTimeout(250);
    ok((await edits()).length === 1, "looking at lines without changing them makes no edits");
    await page.mouse.move(5, 5); await shot("1-instructor-line");

    /* Edit One Line lasts for one edit */
    await clickWord("October"); ok((await S()).k === "p", "the justified paragraph still opens whole");
    await page.click('[data-act="pde-line"]'); await page.waitForTimeout(200);
    await clickWord("October"); ok((await S()).k === "t", "Edit One Line opens just the line");
    await page.keyboard.press("Enter"); await page.waitForTimeout(250);
    ok(!(await S()).lineOnly, "and after that edit, clicks open paragraphs again");

    /* Changing only the look of the PDF's own text is kept */
    await clickWord("Labs 30%");
    await page.click('.pde-fmt [data-act="pde-color"][data-id="#c0262d"]'); await page.waitForTimeout(150);
    await page.keyboard.press("Enter"); await page.waitForTimeout(350);
    let pe = await edits(), lab = pe.find(e => e.k === "t" && /^Labs 30%/.test(e.t));
    ok(lab && lab.c === "#c0262d" && lab.t === lab.old, "a colour change with the words as they were is an edit: " + JSON.stringify(lab && {c: lab.c, t: lab.t}));
    await clickWord("October");
    await page.click('[data-act="pde-al"][data-id="l"]'); await page.waitForTimeout(150);
    await blank();
    pe = await edits(); const para = pe.find(e => e.k === "p" && /^The midterm/.test(e.t));
    ok(para && para.al === "l", "so is a paragraph changed from justified to left");

    /* A paragraph that grows over what's below it says so; Enter at its end doesn't leave an empty line */
    await clickWord("October"); await clickWord("October"); ok((await S()).k === "p", "a second click on the changed paragraph opens it again");
    await page.keyboard.press("Control+End");
    await page.keyboard.type(" Extra credit: write a two page reflection on the lab safety rules, the microscope procedure and the cell staining activity, and hand it in at the start of the final week of classes.");
    await page.waitForTimeout(400);
    ok(/This paragraph is now \d+ lines? longer and overlaps what's below/.test(await msg()), "while typing, the bar says the paragraph now overlaps what's below: " + await msg());
    await shot("2-paragraph-overlaps");
    await page.keyboard.press("Enter"); await page.keyboard.press("Control+Enter"); await page.waitForTimeout(500);
    ok(/overlaps what's below/.test(toasts.slice(-3).join(" | ")), "and says so again when it's done: " + toasts.slice(-3).join(" | "));
    pe = await edits();
    ok(/classes\.$/.test(pe.find(e => e.k === "p").t) && !(await page.evaluate(() => [...document.querySelectorAll(".pde-e.k-p .pde-pl")].some(l => !l.textContent.trim()))), "a new line at the very end isn't kept (no empty line drawn below it)");

    /* A new text box: finishing it, clicking away, picking it, nudging it */
    await tool("add");
    let g = await wordAt("Draft copy"); await page.mouse.click(g.l, g.b + 40); await page.waitForTimeout(350);
    await page.keyboard.type("Bring goggles");
    ok(/Ctrl\+Enter or click away to finish/.test(await msg()), "a text box says how to finish it: " + await msg());
    await blank();
    s = await S();
    ok(!s.k && (await edits()).some(e => e.k === "n" && e.t === "Bring goggles") && await page.locator(".pde-e.editing").count() === 0, "clicking away finishes the box, without starting another one");
    await tool("text"); const box = await page.locator(".pde-e.k-n .pde-t").first().boundingBox();
    await page.mouse.click(box.x + 8, box.y + box.height / 2); await page.waitForTimeout(300);
    ok(/Click again to type, drag to move, arrows to nudge/.test(await msg()) && !(await S()).k, "one click picks the box and says what you can do with it: " + await msg());
    for (let i = 0; i < 4; i++) await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(200);
    const hist = (await S()).hist;
    ok(hist.filter(l => l === "Moved").length === 1 && hist[hist.length - 1] === "Moved", "four nudges with the arrow keys are one change in History, called Moved: " + hist.slice(-3).join(", "));

    /* Escape: keeps what's typed, then steps back (pick, tool, Edit), and never closes the reader from Edit */
    await tool("add"); g = await wordAt("Draft copy"); await page.mouse.click(g.l + 260, g.b + 40); await page.waitForTimeout(350);
    await page.keyboard.type("Keep me");
    await page.keyboard.press("Escape"); await page.waitForTimeout(300);
    s = await S();
    ok(!s.k && (await edits()).some(e => e.k === "n" && e.t === "Keep me") && s.sel, "Escape in a new text box keeps the text");
    ok(await page.evaluate(() => document.activeElement && document.activeElement !== document.body && !!document.activeElement.closest(".pde-e.sel")), "and focus stays on the box (not lost)");
    await page.keyboard.press("Escape"); await page.waitForTimeout(200); s = await S();
    ok(!s.sel && s.tool === "add" && s.on && s.open, "Escape again lets go of it");
    await page.keyboard.press("Escape"); await page.waitForTimeout(200); s = await S();
    ok(s.tool === "text" && s.on && s.open, "then goes back to Edit Text");
    await page.keyboard.press("Escape"); await page.waitForTimeout(200); s = await S();
    ok(!s.on && s.open, "then leaves Edit, with the reader still open");
    await page.click("#pdeBtn"); await page.waitForTimeout(300);
    await clickWord("Semester"); await page.keyboard.press("End"); await page.keyboard.type(" (online)");
    await page.keyboard.press("Tab"); await page.waitForTimeout(300);
    ok((await edits()).some(e => e.k === "t" && /Room 114 \(online\)$/.test(e.t)) && await page.evaluate(() => document.activeElement !== document.body), "Tab finishes a line and keeps focus on it");

    /* Find: Enter for the next match, Shift+Enter for the one before; Escape leaves the box, then Find */
    await tool("find"); await page.fill("#pdeFindQ", "Hall"); await page.waitForTimeout(700);
    await page.press("#pdeFindQ", "Enter"); await page.waitForTimeout(150); const a0 = (await S()).findAt;
    await page.press("#pdeFindQ", "Enter"); await page.waitForTimeout(150); const a1 = (await S()).findAt;
    await page.press("#pdeFindQ", "Shift+Enter"); await page.waitForTimeout(150); const a2 = (await S()).findAt;
    ok(a0 === 0 && a1 === 1 && a2 === 0, `Enter goes to the next match and Shift+Enter back: ${a0} ${a1} ${a2}`);

    /* Replace All with a letter the fonts don't have: nothing turns into ?, and the count says what was skipped and why */
    await page.fill("#pdeFindQ", "Hall B"); await page.waitForTimeout(700);
    const nB = Number(((await page.textContent("#pdeFindN")).match(/^(\d+) match/) || [])[1]);
    await page.fill("#pdeFindR", "Hall Ω"); await page.click('[data-act="pde-find-all"]'); await page.waitForTimeout(1200);
    ok(nB === 3 && new RegExp(`skipped ${nB}: Ω isn't in this PDF's fonts`).test(lastToast()), "Replace All says which matches it skipped and why: " + lastToast());
    ok(!(await edits()).some(e => /Ω/.test(e.t || "")), "and no edit gets the letter (the paragraph already changed included)");
    await page.fill("#pdeFindR", "Hall C"); await page.click('[data-act="pde-find-all"]'); await page.waitForTimeout(1200);
    ok(/^Replaced 3 matches/.test(lastToast()), "with letters the fonts have, every match is replaced: " + lastToast());
    await page.focus("#pdeFindQ"); await page.keyboard.press("Escape"); await page.waitForTimeout(200); s = await S();
    ok(s.tool === "find" && s.open && await page.evaluate(() => document.activeElement.id !== "pdeFindQ"), "Escape in the Find box leaves the box (Find stays open)");
    await page.keyboard.press("Escape"); await page.waitForTimeout(200); s = await S();
    ok(s.tool === "text" && s.on && s.open, "and Escape again closes Find");

    /* Letters a font doesn't have, named plainly */
    await clickWord("Thursday"); await selectInEditor("Tuesday"); await page.keyboard.type("Δευτέρα 😀 月曜日です"); await page.waitForTimeout(250);
    ok(/^Greek, Japanese and 1 emoji aren't in this PDF's fonts\. .*Noto Sans.* Emoji can't be drawn/.test(await msg()), "the bar names what can't be saved (scripts, emoji): " + await msg());
    await page.keyboard.press("Escape"); await page.waitForTimeout(250);
    ok((await S()).k === "t" && /Greek/.test(lastToast()), "Escape won't save letters that can't be drawn; it says why and keeps the line open");
    await page.keyboard.press("Control+a"); await page.keyboard.type("Tuesday and Thursday, 2:00 to 4:00 pm"); await page.keyboard.press("Enter"); await page.waitForTimeout(300);

    /* Text past the page's right edge: the page doesn't scroll sideways, and the bar says so */
    await tool("add"); g = await wordAt("Labs 30%");
    const pb = await page.locator('.pdr-page[data-p="1"]').boundingBox();
    await page.mouse.click(pb.x + pb.width - 160, g.y + 40); await page.waitForTimeout(350);
    await page.keyboard.type("This note is long enough that it runs off the right side of the page for sure.");
    await page.waitForTimeout(300);
    ok(await page.evaluate(() => [...document.querySelectorAll(".pde-layer")].every(l => !l.scrollLeft && !l.scrollTop)), "the edits' layer never scrolls sideways (edits stay lined up with the page)");
    ok(/runs past the edge of the page/.test(await msg()), "the bar says the text runs past the page's edge: " + await msg());
    await shot("3-past-the-edge");
    await page.keyboard.press("Control+Enter"); await page.waitForTimeout(400);
    ok(/runs past the edge of the page/.test(toasts.slice(-2).join(" | ")), "and says so when it's done");
    await tool("text");

    /* Zooming while typing keeps the text open and focused */
    await clickWord("distribution"); await page.keyboard.press("End"); await page.keyboard.type(" Bring goggles.");
    await page.click('[data-act="pdr-zoom"][data-id="1"]'); await page.waitForTimeout(1200);
    s = await S();
    ok(s.k === "t" && /Bring goggles\.$/.test(s.t) && await page.evaluate(() => !!(document.activeElement.closest && document.activeElement.closest(".pde-e.editing"))), "zooming in keeps the line open, with what was typed, and focused");
    await page.keyboard.type(" Typed after zoom."); await page.keyboard.press("Enter"); await page.waitForTimeout(400);
    ok((await edits()).some(e => e.k === "t" && /Bring goggles\. Typed after zoom\.$/.test(e.t)), "typing after the zoom goes on in the same line, which is then saved");
    await page.click('[data-act="pdr-zoom"][data-id="-1"]'); await page.waitForTimeout(1000);

    /* The downloaded PDF */
    const out = await download(), tx = await pdfText(out), p1 = tx[0].map(i => i.s).join(" | "), p2 = tx[1].map(i => i.s).join(" | ");
    ok(/Instructor:/.test(p1) && /Dr\. Zoe Kim/.test(p1) && !/Maria Rivera/.test(p1), "the bold label stays in the saved PDF beside the changed name");
    ok(/Office hours:/.test(p1) && /Tuesday and Thursday, 2:00 to 4:00 pm/.test(p1), "the office hours line stays as it was, on its own line");
    ok((p1 + p2).split("Hall C").length - 1 === 3 && !/\?/.test(p1 + p2), "every Hall B became Hall C, and no letter became ?");
    ok(/Week 1: Cells and membranes\. Read chapter one\./.test(p2) && /not for distribution Bring goggles\. Typed after zoom\./.test(p1) && /Week 2: Energy and enzymes\. Hall C lab\./.test(p2), "the week lines are saved as separate lines");
    ok(/goggles/.test(p2) && /Safety comes first/.test(p2), "the page 2 paragraph is untouched");
    ok(!errs.length, "no errors: " + errs.join(" | "));
    console.log(`\n${n} checks passed`);
  } finally { await browser.close(); server.close(); }
})().catch(e => { console.error("FAIL:", e && e.stack || e); process.exit(1); });
