// node tests/sheet-keep-more.e2e.js
// The rest of the sheets keep their place like Create with AI does: Import a Syllabus, Rubric Check, Weak Spots, Make Flashcards
// (from a note), Photo to Note, Break It Down and Quick Capture. Tapping away (Escape, a tap outside, ✕) while AI works or with work in it sets the
// sheet aside, opening it again brings back the same sheet, a job that finishes meanwhile says so in a toast whose Open shows the
// result, Cancel clears it and stops the job, and a sheet with nothing in it just closes. Gemini is mocked with a delay.
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const csp = require("../scripts/csp");
const root = path.join(__dirname, "..");
const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x"); let p = decodeURIComponent(u.pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  const mime = {".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".css": "text/css"};
  res.writeHead(200, {"content-type": mime[path.extname(f)] || "application/octet-stream"});
  // Rubric Check is Pro: the paywall is off for this test
  if (p === "/index.html" || /^\/bundle\/[^/]+\.js$/.test(p)) { res.end((/\.html$/.test(p) ? csp.apply : String)(fs.readFileSync(f, "utf8").replace("const PRO_ENFORCED = true;", "const PRO_ENFORCED = false;"))); return; }
  fs.createReadStream(f).pipe(res);
});
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const pad = x => String(x).padStart(2, "0");
const day = off => { const d = new Date(); d.setDate(d.getDate() + off); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };

const SYLLABUS = `BIO 210: Cell Biology, Fall term. Instructor: Dr. Rosa Alvarez. Lectures Monday and Wednesday 10:00 to 11:15 in Hall B.
Grading: Lab reports 30%, Midterm 30%, Final exam 40%.
Schedule: Lab report 1 due ${day(9)}. Midterm exam on ${day(20)}. Lab report 2 due ${day(30)}. Final exam on ${day(60)}.`;
const SYL_REPLY = {course: {name: "Cell Biology", code: "BIO 210", instructor: "Dr. Rosa Alvarez", meetings: [{kind: "Lecture", days: [1, 3], start: "10:00", end: "11:15", where: "Hall B"}], links: []},
  items: [{title: "Lab report 1", type: "Lab", due: day(9), weight: 15, sure: true}, {title: "Midterm exam", type: "Exam", due: day(20), weight: 30, sure: true},
    {title: "Lab report 2", type: "Lab", due: day(30), weight: 15, sure: true}, {title: "Final exam", type: "Exam", due: day(60), weight: 40, sure: true}]};
const RUBRIC = "Argumentative Essay Rubric (100 points)\n- Clear, arguable thesis in the introduction (40 points)\n- Uses at least 4 scholarly sources, cited in MLA (30 points)\n- Addresses a counterargument (30 points)";
const DRAFT = "Cooling Cities With Parks. Every summer, cities get hotter than the countryside around them. In this essay I argue that urban green space is the cheapest and fastest way to cool a city, and that city councils should fund new parks before they fund new cooling centers. Parks in Phoenix are about four degrees cooler than the blocks around them (Smith 2021). Shade from street trees also lowers the temperature of sidewalks, which matters for people who walk or wait for buses.";
const RUBRIC_REPLY = {summary: "A clear thesis, but too few sources and no counterargument yet.", criteria: [
  {n: 1, criterion: "Thesis", status: "Strong", evidence: "I argue that urban green space is the cheapest and fastest way to cool a city", suggestion: "Keep tying each paragraph back to it."},
  {n: 2, criterion: "Sources", status: "Weak", evidence: "Parks in Phoenix are about four degrees cooler than the blocks around them (Smith 2021).", suggestion: "Add three more peer-reviewed sources."},
  {n: 3, criterion: "Counterargument", status: "Missing", evidence: "", suggestion: "Answer the strongest objection in its own paragraph."}]};
const WEAK_REPLY = {questions: [
  {type: "single", stem: "A red blood cell is placed in pure water. What happens to it?", options: ["It swells and may burst", "It shrivels", "Nothing changes", "It divides"], correct: [0], rationale: "Water moves in toward the higher solute concentration inside the cell.", topic: "Tonicity"},
  {type: "single", stem: "Which process needs no energy from the cell?", options: ["Active transport", "Simple diffusion", "Endocytosis", "The sodium-potassium pump"], correct: [1], rationale: "Diffusion runs down a concentration gradient.", topic: "Transport"}]};
const NOTE = "Photosynthesis takes place in the chloroplasts. Chlorophyll absorbs red and blue light. The light reactions make ATP and NADPH, and the Calvin cycle uses them to fix carbon dioxide into glucose. A leaf has about 300 stomata per square millimetre.";
const NC_REPLY = {cards: [
  {front: "Where does photosynthesis take place?", back: "In the chloroplasts", quote: "takes place in the chloroplasts"},
  {front: "What light does chlorophyll absorb?", back: "Red and blue light", quote: "Chlorophyll absorbs red and blue light"},
  {front: "What do the light reactions make?", back: "ATP and NADPH", quote: "The light reactions make ATP and NADPH"}]};
const CAP_REPLY = {rawText: "BIO 210 lab report 3 due friday", items: [{title: "Lab report 3", dueDate: day(4), dueTime: "17:00", course: "BIO 210", type: "Lab", notes: "", confidence: 0.92}]};
const PHOTO_REPLY = {title: "Cell membranes", notes: "Cell membranes\n• The membrane is a phospholipid bilayer\n• Proteins in it carry molecules across", course: "BIO 210", dates: []};
const SEED = {v: 2, updated: 1, settings: {}, files: [], events: [],
  courses: [{id: "c1", name: "Cell Biology", code: "BIO 210", color: "#3B6FE0"}, {id: "c2", name: "Writing and Rhetoric", code: "ENG 102", color: "#E0563B"}],
  tasks: [{id: "t1", title: "Argumentative essay: urban heat", courseId: "c2", type: "Assignment", due: day(6), start: day(0), status: "todo", priority: "high", notes: RUBRIC, checklist: [], created: 5}],
  decks: [{id: "d1", name: "Membranes", courseId: "c1", created: 1, cards: [
    {id: "k1", front: "What is osmosis?", back: "Water moving across a selectively permeable membrane toward more solute", box: 0, due: "", seen: 4, right: 1, wrong: 3},
    {id: "k2", front: "What is a hypotonic solution?", back: "One with less solute than the cell", box: 0, due: "", seen: 3, right: 0, wrong: 3},
    {id: "k3", front: "What do aquaporins do?", back: "Let water cross the membrane faster", box: 1, due: "", seen: 2, right: 0, wrong: 2}]}],
  notes: [{id: "n3", text: NOTE, color: "yellow", x: 40, y: 40, z: 1, rot: 0, courseId: "c1", created: 1}]};
const textOf = body => { try { const out = []; const walk = v => { if (typeof v === "string") out.push(v); else if (v && typeof v === "object") Object.values(v).forEach(walk); }; walk(JSON.parse(body)); return out.join("\n"); } catch (e) { return String(body || ""); } };

(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  try {
    const ctx = await browser.newContext({viewport: {width: 1280, height: 900}, serviceWorkers: "block"});
    const calls = {}; let delay = 2500;
    await ctx.route(/generativelanguage\.googleapis\.com/, async route => {
      const t = textOf(route.request().postData() || "");
      const kind = /course syllabi/.test(t) ? "syllabus" : /turn photos of whiteboards, lecture slides/.test(t) ? "photo" : /review a student's draft/.test(t) ? "rubric" : /weak spots/.test(t) ? "weak" : /flashcards from the notes between the tags/.test(t) ? "notecards" : /mime_type|inline_data|image/.test(route.request().postData() || "") ? "capture" : "other";
      calls[kind] = (calls[kind] || 0) + 1;
      const reply = {syllabus: SYL_REPLY, rubric: RUBRIC_REPLY, weak: WEAK_REPLY, notecards: NC_REPLY, capture: CAP_REPLY, photo: PHOTO_REPLY}[kind] || {};
      await new Promise(r => setTimeout(r, delay));
      try { await route.fulfill({status: 200, contentType: "application/json", body: JSON.stringify({candidates: [{content: {parts: [{text: JSON.stringify(reply)}]}, finishReason: "STOP"}]})}); } catch (e) {}
    });
    await ctx.route(/\/v1\/ai$/, route => route.fulfill({status: 500, body: "{}"}));
    await ctx.route(/supabase\.co/, r => r.abort());
    await ctx.addInitScript(seed => {
      window.__SB_TEST = true;
      try { if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("coursework:v2", JSON.stringify(seed)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("studyboard:tour", "done");
        localStorage.setItem("studyboard:aiKeys", JSON.stringify({gemini: "AIzaTESTTESTTESTTESTTESTTEST12345"})); localStorage.setItem("studyboard:aiConsent", JSON.stringify({gemini: {v: 1, at: 1}})); } } catch (e) {}
    }, SEED);
    const page = await ctx.newPage(); const errs = [];
    page.on("pageerror", e => errs.push(e.message)); page.on("console", m => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errs.push(m.text()); });
    await page.goto(base); await page.waitForFunction(() => window.__sbSync && window.SBRUBRIC && window.SBNC && window.SBCAPTURE); await page.waitForTimeout(600);
    const act = (a, id) => page.evaluate(([a, id]) => { const b = document.createElement("button"); b.dataset.act = a; if (id) b.dataset.id = id; b.hidden = true; document.body.appendChild(b); b.click(); b.remove(); }, [a, id || ""]);
    const isOpen = () => page.evaluate(() => document.getElementById("dlg").open);
    const away = async () => { await page.keyboard.press("Escape"); await page.waitForTimeout(250); };
    const toastText = () => page.evaluate(() => (document.getElementById("toastMsg") || {}).textContent || "");
    const clearToast = () => page.evaluate(() => { const m = document.getElementById("toastMsg"); if (m) m.textContent = ""; });
    const waitToast = re => page.waitForFunction(s => new RegExp(s).test((document.getElementById("toastMsg") || {}).textContent || ""), re.source, {timeout: 15000});
    // a mark on the sheet's element tells the same sheet (set aside and brought back) from a new one
    const mark = () => page.evaluate(() => { document.querySelector("#dlg .sheet").__kept = 1; });
    const marked = () => page.evaluate(() => { const s = document.querySelector("#dlg[open] .sheet"); return !!(s && s.__kept); });
    const cancel = async () => { await page.click('#dlg .sheet-foot [data-act="close"]'); await page.waitForTimeout(250); };

    /* Import a Syllabus: a read still running, then the found items, set aside and brought back */
    await act("import-syllabus"); await page.waitForSelector("#impRead", {state: "attached"});
    ok(await page.evaluate(() => !!document.querySelector("#impAI") && document.querySelector("#impAI").checked), "syllabus: Read with AI is on");
    await mark(); await away();
    await act("import-syllabus"); await page.waitForSelector("#impRead", {state: "attached"});
    ok(!(await marked()), "syllabus: a sheet with nothing in it isn't kept: Escape and open again gives a fresh one");
    await page.click("#impPaste summary"); await page.fill("#impText", SYLLABUS); await page.click("#impRead"); await page.waitForTimeout(300);
    ok(/is reading pasted text/.test(await page.textContent("#impStatus")), "syllabus: AI starts reading the pasted text");
    await mark(); await away();
    ok(!(await isOpen()) && /Import a Syllabus is still working/.test(await toastText()), "syllabus: Escape sets it aside and says it's still working: " + await toastText());
    await act("import-syllabus"); await page.waitForTimeout(250);
    ok(await marked() && /is reading pasted text/.test(await page.textContent("#impStatus")) && await page.inputValue("#impText") === SYLLABUS, "syllabus: opening it again brings back the same sheet, still reading, with the pasted text");
    await page.mouse.click(5, 5); await page.waitForTimeout(250);
    ok(!(await isOpen()), "syllabus: a tap outside sets it aside too");
    await waitToast(/syllabus has been read/);
    ok(!(await isOpen()) && calls.syllabus === 1, "syllabus: it finishes in the background without popping up, asking the AI once");
    await page.click("#toastExtra"); await page.waitForSelector("#dlg[open] .imp-row");
    ok(await marked() && await page.locator("#dlg[open] .imp-list .imp-row").count() === 4 && await page.isVisible("#impAdd"), "syllabus: Open in the toast shows the four items found, ready to add");
    await page.fill("#dlg .imp-row input[data-f=title] >> nth=0", "Lab report 1 (edited)"); await away();
    await act("import-syllabus"); await page.waitForTimeout(250);
    ok(await marked() && await page.inputValue("#dlg .imp-row input[data-f=title] >> nth=0") === "Lab report 1 (edited)", "syllabus: the found items are kept too, edits and all");
    await cancel();
    await act("import-syllabus"); await page.waitForSelector("#impRead", {state: "attached"});
    ok(!(await marked()) && await page.locator("#dlg .imp-row").count() === 0 && await page.inputValue("#impText") === "", "syllabus: after Cancel it starts fresh");
    ok(Object.keys(await page.evaluate(() => window.__sbSync.state.courses)).length === 2, "syllabus: nothing was added");
    await page.click("#impPaste summary"); await page.fill("#impText", SYLLABUS); await page.click("#impRead"); await page.waitForTimeout(300);
    await clearToast(); await cancel(); await page.waitForTimeout(delay + 800);
    ok(!/has been read/.test(await toastText()) && !(await isOpen()), "syllabus: Cancel while it reads stops it: no toast, nothing opens");
    await act("import-syllabus"); await page.waitForSelector("#impRead", {state: "attached"});
    ok(await page.inputValue("#impText") === "" && await page.locator("#dlg .imp-row").count() === 0, "syllabus: and the next one is fresh");
    await cancel();

    /* Rubric Check: a check still running is set aside, and its result waits in the sheet */
    await act("rb-check", "t1"); await page.waitForSelector("#dlg[open] [data-rb-draft]");
    await page.waitForFunction(() => /Clear, arguable thesis/.test(document.querySelector("[data-rb-rub]").value));
    await page.fill("[data-rb-draft]", DRAFT); await page.click("[data-rb-go]"); await page.waitForTimeout(300);
    ok(/Checking/.test(await page.textContent("[data-rb-go]")), "rubric: the check starts");
    await mark(); await away();
    ok(!(await isOpen()) && /Rubric Check is still working/.test(await toastText()), "rubric: Escape sets it aside while it checks: " + await toastText());
    await act("edit-task", "t1"); await page.waitForSelector('#dlg[open] [data-act="rb-check"]'); await page.click('#dlg[open] [data-act="rb-check"]'); await page.waitForTimeout(250);
    ok(await marked() && /Checking/.test(await page.textContent("#dlg[open] [data-rb-go]")) && await page.evaluate(() => document.querySelector("#dlg[open] [data-rb-go]").disabled), "rubric: Check Against Rubric again brings back the same sheet, still checking (so it can't run twice)");
    await page.click('#dlg .sheet-head [data-act="close"]'); await page.waitForTimeout(250);
    ok(!(await isOpen()), "rubric: ✕ sets it aside too");
    await waitToast(/rubric check is ready/);
    ok(!(await isOpen()) && calls.rubric === 1, "rubric: it finishes without popping up, one AI call");
    await page.click("#toastExtra"); await page.waitForSelector("#dlg[open] .rbx-item");
    ok(await marked() && await page.locator("#dlg[open] .rbx-item").count() === 3 && /Add 2 Steps/.test(await page.textContent("#dlg[open] [data-rb-save]")), "rubric: Open shows the result in the same sheet");
    await page.click('#dlg .sheet-foot [data-act="edit-task"]'); await page.waitForTimeout(250);
    await page.click('#dlg[open] [data-act="rb-check"]'); await page.waitForSelector("#dlg[open] .rbx-item");
    ok(!(await marked()), "rubric: a finished check isn't held as a sheet (the result stays with the task as before)");
    await page.keyboard.press("Escape"); await page.waitForTimeout(250);

    /* Weak Spots: the quiz being written is set aside; when done, Open starts it */
    await act("fc-weak", "d1"); await page.waitForSelector("#dlg[open] #wkGo");
    await mark(); await away(); await act("fc-weak", "d1"); await page.waitForSelector("#dlg[open] #wkGo");
    ok(!(await marked()), "weak spots: an untouched sheet just closes");
    await page.click("#wkGo"); await page.waitForTimeout(300); await mark(); await away();
    ok(/Weak spots quiz is still working/.test(await toastText()), "weak spots: Escape while it writes sets it aside: " + await toastText());
    await act("fc-weak", "d1"); await page.waitForTimeout(250);
    ok(await marked() && /Writing questions/.test(await page.textContent("#wkStatus")), "weak spots: opening it again shows the same sheet, still writing");
    await away(); await waitToast(/weak spots quiz is ready/);
    ok(!(await isOpen()) && await page.evaluate(() => !(window.__sbSync.ui.fc && window.__sbSync.ui.fc.mode === "aiquiz")), "weak spots: when done, the quiz doesn't start by itself");
    ok((await page.evaluate(() => (window.__sbSync.state.decks.d1.aiQuizzes || []).length)) === 1, "weak spots: the quiz is saved to the deck");
    await page.click("#toastExtra"); await page.waitForFunction(() => window.__sbSync.ui.fc && window.__sbSync.ui.fc.mode === "aiquiz", null, {timeout: 5000});
    ok(true, "weak spots: Open in the toast starts the quiz");
    await page.evaluate(() => { window.__sbSync.ui.fc = null; window.__sbSync.render(); });
    await act("fc-weak", "d1"); await page.waitForSelector("#dlg[open] #wkGo"); await page.click("#wkGo"); await page.waitForTimeout(300);
    await clearToast(); await cancel(); await page.waitForTimeout(delay + 800);
    ok(!/quiz is ready/.test(await toastText()) && (await page.evaluate(() => (window.__sbSync.state.decks.d1.aiQuizzes || []).length)) === 1, "weak spots: Cancel while it writes stops it, and nothing is saved");

    /* Make Flashcards from a note: Improve with AI keeps running when you tap away */
    await page.evaluate(() => window.SBNC.open("n3")); await page.waitForSelector("#dlg[open] .nc-sheet");
    await mark(); await away(); await page.evaluate(() => window.SBNC.open("n3")); await page.waitForSelector("#dlg[open] .nc-sheet");
    ok(!(await marked()), "note cards: an untouched sheet isn't kept");
    await page.click('#dlg [data-nc="ai"]'); await page.waitForTimeout(300); await mark(); await away();
    ok(/Make Flashcards is still working/.test(await toastText()), "note cards: Escape while AI works sets it aside (it isn't stopped any more): " + await toastText());
    await page.evaluate(() => window.SBNC.open("n3")); await page.waitForTimeout(250);
    ok(await marked() && await page.evaluate(() => document.querySelector('#dlg [data-nc="ai"]').disabled), "note cards: opening it again brings the same sheet back, AI still working");
    await away(); await waitToast(/AI flashcards are ready/);
    await page.click("#toastExtra"); await page.waitForSelector("#dlg[open] .nc-sheet");
    const fronts = await page.$$eval("#dlg[open] [data-nc-f]", x => x.map(e => e.value));
    ok(await marked() && fronts.includes("Where does photosynthesis take place?") && fronts.includes("What do the light reactions make?"), "note cards: Open shows the AI's cards in the same sheet: " + fronts.slice(0, 4).join(" | "));
    await cancel(); await page.evaluate(() => window.SBNC.open("n3")); await page.waitForSelector("#dlg[open] .nc-sheet");
    ok(!(await marked()) && !(await page.$$eval("#dlg[open] [data-nc-f]", x => x.map(e => e.value))).includes("What do the light reactions make?"), "note cards: after Cancel it starts fresh");
    const ncCalls = calls.notecards;
    await page.click('#dlg [data-nc="ai"]'); await page.waitForTimeout(300); await clearToast(); await cancel(); await page.waitForTimeout(delay + 800);
    ok(!/flashcards are ready/.test(await toastText()) && !(await isOpen()) && calls.notecards === ncCalls + 1, "note cards: Cancel while AI works stops it");

    /* Photo to Note: photos being read are set aside, and the note waits to be checked */
    const png = await page.evaluate(async () => { const c = document.createElement("canvas"); c.width = 320; c.height = 200; c.getContext("2d").fillRect(0, 0, 320, 200); return c.toDataURL("image/png").split(",")[1]; });
    const pngFile = {name: "board.png", mimeType: "image/png", buffer: Buffer.from(png, "base64")};
    await act("note-photo"); await page.waitForSelector("#dlg[open] #pnGo");
    await mark(); await away(); await act("note-photo"); await page.waitForSelector("#dlg[open] #pnGo");
    ok(!(await marked()), "photo to note: an untouched sheet isn't kept");
    await page.setInputFiles("#pnFile", pngFile); await page.waitForSelector("#dlg #pnSrcs li");
    await mark(); await away(); await act("note-photo"); await page.waitForSelector("#dlg[open] #pnGo");
    ok(await marked() && await page.locator("#dlg #pnSrcs li").count() === 1, "photo to note: a photo you added is kept after Escape");
    await page.click("#pnGo"); await page.waitForTimeout(300); await away();
    ok(/Photo to Note is still working/.test(await toastText()), "photo to note: Escape while it reads sets it aside: " + await toastText());
    await act("note-photo"); await page.waitForTimeout(250);
    ok(await marked() && /Reading your photos/.test(await page.textContent("#pnStatus")), "photo to note: opening it again shows it still reading");
    await away(); await waitToast(/note from the photos is ready/);
    await page.click("#toastExtra"); await page.waitForSelector("#dlg[open] #pnText");
    ok(await marked() && /phospholipid bilayer/.test(await page.inputValue("#pnText")), "photo to note: Open shows the note to check, in the same sheet");
    await cancel(); await act("note-photo"); await page.waitForSelector("#dlg[open] #pnGo");
    ok(!(await marked()) && await page.locator("#dlg #pnSrcs li").count() === 0, "photo to note: Cancel clears it");
    await cancel();

    /* Break It Down: a prompt typed in is kept */
    await act("bd-new"); await page.waitForSelector("#dlg[open] #bdText");
    await mark(); await away(); await act("bd-new"); await page.waitForSelector("#dlg[open] #bdText");
    ok(!(await marked()), "break it down: an untouched sheet isn't kept");
    await page.fill("#bdText", "Research paper on coral bleaching, 2000 words, at least 6 scholarly sources."); await mark(); await page.mouse.click(5, 5); await page.waitForTimeout(250);
    await act("bd-new"); await page.waitForSelector("#dlg[open] #bdText");
    ok(await marked() && /coral bleaching/.test(await page.inputValue("#bdText")), "break it down: the prompt you typed is still there after a tap outside");
    await cancel(); await act("bd-new"); await page.waitForSelector("#dlg[open] #bdText");
    ok(!(await marked()) && await page.inputValue("#bdText") === "", "break it down: Cancel clears it");
    await cancel();

    /* Quick Capture (its own dialog): a photo being read is kept on ✕, found tasks wait for you */
    const photo = () => page.evaluate(async () => { const c = document.createElement("canvas"); c.width = 320; c.height = 200; c.getContext("2d").fillRect(0, 0, 320, 200); const b = await new Promise(r => c.toBlob(r, "image/png")); window.SBCAPTURE.photoFiles([new File([b], "board.png", {type: "image/png"})], {source: "photo"}); });
    const capOpen = () => page.evaluate(() => document.getElementById("capDlg").open);
    await act("cap-open"); await page.waitForSelector("#capDlg[open] #qcIn"); await page.fill("#qcIn", "bio quiz fri"); await page.keyboard.press("Escape"); await page.waitForTimeout(250);
    await act("cap-open"); await page.waitForSelector("#capDlg[open] #qcIn");
    ok(await page.inputValue("#qcIn") === "", "capture: typed text alone still clears on Escape, as its hint says");
    await page.keyboard.press("Escape"); await page.waitForTimeout(200);
    await photo(); await page.waitForSelector("#capDlg[open] .cap-skel");
    await page.click('#capDlg .sheet-head [data-cap="close"]'); await page.waitForTimeout(250);
    ok(!(await capOpen()) && /Quick Capture is still reading your photo/.test(await toastText()), "capture: ✕ while it reads a photo sets it aside: " + await toastText());
    await act("cap-open"); await page.waitForTimeout(250);
    ok(await capOpen() && await page.locator("#capDlg .cap-skel").count() === 1, "capture: opening it again shows it still reading");
    await page.keyboard.press("Escape"); await page.waitForTimeout(250);
    await waitToast(/Found 1 task in your photo/);
    ok(!(await capOpen()), "capture: when it's done nothing pops up");
    await page.click("#toastExtra"); await page.waitForSelector("#capDlg[open] .qc-row");
    ok(await page.inputValue("#capDlg .qc-row input[data-f=title]") === "Lab report 3", "capture: Open shows the task found in the photo, to check and add");
    await page.keyboard.press("Escape"); await page.waitForTimeout(250); await act("cap-open"); await page.waitForTimeout(250);
    ok(await page.locator("#capDlg .qc-row").count() === 1, "capture: found tasks not added yet are kept too");
    await page.click('#capDlg [data-cap="back"]'); await page.keyboard.press("Escape"); await page.waitForTimeout(250);
    await act("cap-open"); await page.waitForTimeout(250);
    ok(await page.locator("#capDlg .qc-row").count() === 0 && await page.locator("#capDlg .cap-skel").count() === 0, "capture: Back then Escape clears it");
    await page.keyboard.press("Escape"); await page.waitForTimeout(200);

    ok(!errs.length, "no console errors: " + errs.join(" | "));
    console.log("\nsheet-keep-more.e2e: " + n + " checks passed");
  } finally { await browser.close(); server.close(); }
})().catch(e => { console.error(e); process.exit(1); });
