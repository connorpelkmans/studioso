// node tests/pro-study.e2e.js   (Playwright + Chromium; see tests/pw.js)
// Studyboard Pro study extras (module 99-pro): Linked Notes ([[links]], Mentioned In, renames), Listen (a deck read aloud),
// the PDF reader with highlights, the lecture recorder, Email to Studyboard and two-way calendar sync, plus the free-plan locks.
/* global saveNoteText, applyChanges, clone -- copied onto window from __sbProStudy in open() below */
// Speech, the microphone and the network are stubbed so every check is deterministic in headless Chromium.
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const csp = require("../scripts/csp");
const root = path.join(__dirname, "..");
const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x"); let p = decodeURIComponent(u.pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  const ext = path.extname(f), mime = {".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".css": "text/css", ".webmanifest": "application/manifest+json"};
  res.writeHead(200, {"content-type": mime[ext] || "application/octet-stream"});
  if (p === "/index.html") { res.end(csp.apply(fs.readFileSync(f, "utf8").replace("const PRO_ENFORCED = true;", "const PRO_ENFORCED = false;").replace('const CAPTURE_EMAIL_DOMAIN = "";', 'const CAPTURE_EMAIL_DOMAIN = "in.studyboard.test";'))); return; }
  fs.createReadStream(f).pipe(res);
});
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const pad = x => String(x).padStart(2, "0");
const day = off => { const d = new Date(); d.setDate(d.getDate() + off); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
// A two-page PDF of plain text lines (Helvetica), like a reading
function textPdf(){
  const page = lines => lines.map((l, i) => `BT /F1 14 Tf 72 ${700 - i * 24} Td (${l}) Tj ET`).join("\n");
  const c1 = page(["Chapter 4: The Cell", "Mitochondria produce most of the cell's ATP.", "Ribosomes build proteins from amino acids.", "The membrane controls what enters the cell."]);
  const c2 = page(["Chapter 4, continued", "Osmosis moves water across a membrane.", "Diffusion goes from high to low concentration."]);
  const objs = ["<< /Type /Catalog /Pages 2 0 R >>", "<< /Type /Pages /Kids [3 0 R 5 0 R] /Count 2 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 6 0 R >>", "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 7 0 R >>",
    `<< /Length ${c1.length} >>\nstream\n${c1}\nendstream`, `<< /Length ${c2.length} >>\nstream\n${c2}\nendstream`];
  let out = "%PDF-1.4\n"; const offs = [];
  objs.forEach((o, i) => { offs.push(out.length); out += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const x = out.length; out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + offs.map(o => String(o).padStart(10, "0") + " 00000 n \n").join("") + `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${x}\n%%EOF`;
  return [...Buffer.from(out, "latin1")];
}
function SEED(){
  const card = (id, f, bk, box, due, extra) => Object.assign({id, front: f, back: bk, box, due, seen: box ? 3 : 0, right: box ? 2 : 0, wrong: box ? 1 : 0, last: box ? day(-2) : ""}, extra || {});
  const decks = [{id: "d1", name: "Cell Biology", courseId: "c1", created: 1, quizzes: [], cards: [
    card("k1", "ATP", "Energy currency of the cell", 2, day(0)), card("k2", "Osmosis", "Water moving across a membrane", 3, day(5)),
    card("k3", "Lipid", "A fat", 0, ""), card("k4", "Ribosome", "Makes proteins", 1, day(-1), {wrong: 3, right: 0, seen: 3}),
    card("k5", "Nucleus", "", 1, day(0), {img: {k: "i:x", w: 4, h: 3, m: [[0.1, 0.1, 0.2, 0.1]], i: 0, mode: "one"}})]}];
  const notes = [
    {id: "n1", text: "Photosynthesis\nLight reactions feed the [[Calvin cycle]]. See [[Lab report 3]] and [[Cell Biology]].", color: "yellow", x: 40, y: 40, z: 1, courseId: "c1"},
    {id: "n2", text: "Calvin cycle\nFixes carbon.", color: "blue", x: 320, y: 40, z: 2, courseId: "c1"},
    {id: "n3", text: "Exam topics\n[[Calvin cycle]] and [[Krebs cycle]]", color: "pink", x: 40, y: 300, z: 3, courseId: "c1"}];
  const tasks = [{id: "t1", title: "Lab report 3", courseId: "c1", type: "Lab", due: day(4), start: day(1), status: "todo", priority: "med", created: 5}];
  const files = [{id: "f2", name: "BIO101 Lecture, Oct 2.webm", courseId: "c1", folderId: "notes", kind: "file", taskIds: [], desc: "", url: "", dur: 3000, tr: {text: "Cells are the unit of life.", by: "ai", at: 1},
      revs: [{assetId: "local:a-lec", name: "BIO101 Lecture, Oct 2.webm", size: 900000, type: "audio/webm", at: 1}]},
    {id: "f1", name: "Reading 4.pdf", courseId: "c1", folderId: "other", kind: "file", taskIds: [], desc: "", url: "", revs: [{assetId: "a-read4", name: "Reading 4.pdf", size: 1200, type: "application/pdf", at: 1}]}];
  return {v: 2, updated: 1, decks, notes, tasks, files, settings: {}, courses: [{id: "c1", name: "Biology", code: "BIO101", color: "#3B6FE0"}]};
}
(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath, args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream", "--autoplay-policy=no-user-gesture-required"]});
  const mkCtx = async (seed, free, ai) => {
    const ctx = await browser.newContext({viewport: {width: 1200, height: 900}, permissions: ["microphone"]});
    ctx.aiBodies = [];
    await ctx.route(/generativelanguage\.googleapis\.com/, async route => {
      const body = route.request().postData() || ""; ctx.aiBodies.push(body);
      const em = /forwarded to their planner/.test(body) && /Subject: Fwd: Lab 4 moved/.test(body);
      const reply = em ? {items: [{title: "Lab 4", dueDate: ctx.emailDue, dueTime: "17:00", course: "BIO101", type: "Lab", notes: "Bring goggles", confidence: 0.92}], rawText: ""}
        : /inline_data/.test(body) ? {text: "Today we talk about osmosis. Water moves across a membrane toward the side with more solute."}
        : /study notes/.test(body) ? {title: "Osmosis and Diffusion", summary: "How water and solutes cross membranes.", sections: [{heading: "Osmosis", points: ["Water moves toward more solute", "Needs a membrane"]}],
            terms: [{term: "Osmosis", definition: "Water moving across a membrane"}], questions: ["Which way does water move in osmosis?"]}
        : {front: "Q", back: "A"};
      route.fulfill({status: 200, contentType: "application/json", body: JSON.stringify({candidates: [{content: {parts: [{text: JSON.stringify(reply)}]}, finishReason: "STOP"}]})});
    });
    await ctx.addInitScript(([seed, free, ai]) => {
      if (ai) { localStorage.setItem("studyboard:aiKeys", JSON.stringify({gemini: "AIzaTESTTESTTESTTESTTESTTEST12345"})); localStorage.setItem("studyboard:aiConsent", JSON.stringify({gemini: {v: 1, at: 1}})); }
      // Live captions: a speech recognizer the test speaks into with window.__say(text)
      window.SpeechRecognition = window.webkitSpeechRecognition = function(){ const me = this; window.__sr = me; this.start = () => { me.on = true; }; this.stop = () => { me.on = false; setTimeout(() => me.onend && me.onend(), 0); }; };
      window.__say = text => { const r = window.__sr; if (!r || !r.on || !r.onresult) return false; const res = [{transcript: text}]; res.isFinal = true; r.onresult({resultIndex: 0, results: [res]}); return true; };
      try {
        if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("coursework:v2", JSON.stringify(seed)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); }
        if (free) localStorage.setItem("studyboard:paywall-test", "1");
      } catch (e) {}
      // A speech engine that "speaks" instantly and remembers what it said
      window.__said = [];
      const fake = {speaking: false, cancel(){}, pause(){}, resume(){}, getVoices: () => [{name: "Test Voice", lang: "en-US", voiceURI: "test", default: true}],
        speak(u){ window.__said.push(u.text); setTimeout(() => u.onend && u.onend(), 5); }};
      Object.defineProperty(window, "speechSynthesis", {value: fake, configurable: true});
      window.SpeechSynthesisUtterance = function(t){ this.text = t; };
    }, [seed, !!free, !!ai]);
    return ctx;
  };
  const open = async ctx => { const page = await ctx.newPage(); page.errs = []; page.on("pageerror", e => page.errs.push(e.message)); page.on("console", m => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) page.errs.push(m.text()); }); await page.goto(base); await page.waitForSelector("#view", {state: "attached"}); await page.waitForFunction(() => window.__sbProStudy);
    await page.evaluate(() => { const T = window.__sbProStudy; Object.defineProperty(window, "state", {get: () => T.state(), configurable: true}); Object.defineProperty(window, "dlg", {get: () => T.dlg(), configurable: true}); Object.defineProperty(window, "noteEditing", {get: () => T.editing(), configurable: true}); ["ui", "render", "applyChanges", "clone", "saveNoteText"].forEach(k => { window[k] = T[k]; }); });
    await page.waitForTimeout(900); return page; };
  const act = (page, a, id, data) => page.evaluate(([a, id, data]) => { const b = document.createElement("button"); b.dataset.act = a; if (id) b.dataset.id = id; Object.assign(b.dataset, data || {}); b.style.display = "none"; document.body.appendChild(b); b.click(); b.remove(); }, [a, id || "", data || null]);
  const tab = async (page, t) => { await page.evaluate(t => { ui.tab = t; render(); }, t); await page.waitForTimeout(250); };
  try {
    const page = await open(await mkCtx(SEED(), false, true));

    /* ---------- Linked notes ---------- */
    await tab(page, "notes");
    const links = page.locator('.note[data-note="n1"] .note-link');
    ok(await links.count() === 3, "a note's [[links]] are buttons");
    ok(await page.locator('.note[data-note="n1"] .note-link.k-note').count() === 1 && await page.locator('.note[data-note="n1"] .note-link.k-task').count() === 1 && await page.locator('.note[data-note="n1"] .note-link.k-deck').count() === 1, "links find a note, a task and a deck");
    ok(await page.locator('.note[data-note="n3"] .note-link.miss').count() === 1, "a link to nothing yet is marked");
    await links.filter({hasText: "Lab report 3"}).click(); await page.waitForTimeout(300);
    ok(await page.evaluate(() => dlg.open && /Lab report 3/.test(dlg.querySelector("input[name=title]") ? dlg.querySelector("input[name=title]").value : dlg.textContent)), "a task link opens the task");
    await page.evaluate(() => dlg.close()); await page.waitForTimeout(150);
    ok(await page.evaluate(() => noteEditing === null), "clicking a link doesn't open the note for editing");
    await page.locator('.note[data-note="n1"] .note-link', {hasText: "Calvin cycle"}).click(); await page.waitForTimeout(300);
    ok(await page.locator('.note[data-note="n2"].nl-flash').count() === 1, "a note link points out the note");
    await page.locator('.note[data-note="n1"] .note-link', {hasText: "Cell Biology"}).click(); await page.waitForTimeout(300);
    ok(await page.evaluate(() => ui.tab === "flashcards" && ui.deckId === "d1"), "a deck link opens the deck");
    await tab(page, "notes");
    await page.locator('.note[data-note="n3"] .note-link.miss').click(); await page.waitForTimeout(400);
    ok(await page.evaluate(() => Object.values(state.notes).some(n => /^Krebs cycle/.test(n.text)) && noteEditing && /^Krebs cycle/.test(state.notes[noteEditing].text)), "a missing link makes a new note with that name, open to write in");
    await page.evaluate(() => saveNoteText()); await page.waitForTimeout(200);
    ok(await page.locator('.note[data-note="n3"] .note-link.miss').count() === 0, "the link now finds it");
    // Mentioned In
    await page.locator('.note[data-note="n2"] .note-body').click(); await page.waitForTimeout(300);
    ok(await page.locator('.note.editing .nl-back .note-link').count() === 2, "an open note lists the two notes that mention it");
    // Typing [[
    await page.evaluate(() => { const t = document.getElementById("noteText"); t.focus(); t.setSelectionRange(t.value.length, t.value.length); });
    await page.keyboard.type(" see [[Lab");
    await page.waitForTimeout(150);
    ok(await page.locator(".nl-pop .nl-opt").count() >= 1 && /Lab report 3/.test(await page.locator(".nl-pop").textContent()), "typing [[ suggests matching names");
    await page.keyboard.press("Enter"); await page.waitForTimeout(100);
    ok(/see \[\[Lab report 3\]\]$/.test(await page.evaluate(() => document.getElementById("noteText").value)), "Enter puts in the whole link");
    ok(await page.locator(".nl-pop").count() === 0, "the suggestions close");
    await page.evaluate(() => saveNoteText()); await page.waitForTimeout(200);
    // Rename keeps links
    await page.evaluate(() => { const n = state.notes.n2; applyChanges([{kind: "note", id: "n2", after: Object.assign(clone(n), {text: n.text.replace(/^Calvin cycle/, "The Calvin Cycle")})}], ""); });
    await page.waitForTimeout(200);
    ok(await page.evaluate(() => /\[\[The Calvin Cycle\]\]/.test(state.notes.n1.text) && /\[\[The Calvin Cycle\]\]/.test(state.notes.n3.text)), "renaming a note updates the links to it");
    await page.evaluate(() => { const t = state.tasks.t1; applyChanges([{kind: "task", id: "t1", after: Object.assign(clone(t), {title: "Lab report three"})}], ""); });
    await page.waitForTimeout(200);
    ok(await page.evaluate(() => /\[\[Lab report three\]\]/.test(state.notes.n1.text) && /\[\[Lab report three\]\]/.test(state.notes.n2.text)), "renaming a task updates the links to it");

    /* ---------- Listen ---------- */
    await page.evaluate(() => { ui.tab = "flashcards"; ui.deckId = "d1"; ui.fc = null; render(); }); await page.waitForTimeout(300);
    ok(await page.locator('[data-act="ls-open"][data-id="d1"]').count() === 1, "the deck page has Listen");
    await page.click('[data-act="ls-open"][data-id="d1"]'); await page.waitForTimeout(300);
    ok(/Card 1 of 3/.test(await page.locator(".ls-deck").textContent()), "due and new cards: 3 (not due later, an image card is skipped)");
    await page.click('[data-act="ls-play"]'); await page.waitForTimeout(400);
    let said = await page.evaluate(() => window.__said.slice());
    ok(said[0] === "ATP", "it reads the front first: " + said[0]);
    await page.evaluate(() => { const p = JSON.parse(localStorage.getItem("studyboard:listen") || "{}"); p.gap = 1; localStorage.setItem("studyboard:listen", JSON.stringify(p)); });
    await page.waitForTimeout(4600);
    said = await page.evaluate(() => window.__said.slice());
    ok(said.includes("Energy currency of the cell"), "then the back, after the pause");
    await page.click('[data-act="ls-play"]'); await page.waitForTimeout(100);
    ok(await page.locator('.ls-play[aria-label="Play"]').count() === 1, "pause");
    await page.click('[data-act="ls-set"][data-k="set"][data-id="tricky"]'); await page.waitForTimeout(200);
    ok(/Card 1 of 3/.test(await page.locator(".ls-deck").textContent()) && /Ribosome/.test(await page.locator(".ls-card").textContent()), "Tricky: the most-missed card first");
    await page.click('[data-act="ls-set"][data-k="order"][data-id="back"]'); await page.waitForTimeout(200);
    ok(/Makes proteins/.test(await page.locator(".ls-card .ls-a").textContent()), "Back first");
    await page.evaluate(() => dlg.close()); await page.waitForTimeout(150);
    ok(page.errs.length === 0, "no console errors (Pro): " + page.errs.join(" | "));

    /* ---------- PDF reader and highlights ---------- */
    await page.evaluate(async bytes => { await window.__sbProStudy.idbSet("pdf:a-read4", new Blob([new Uint8Array(bytes)], {type: "application/pdf"})); }, textPdf());
    await act(page, "f-open", "f1"); await page.waitForTimeout(250);
    ok(await page.locator('.sheet-foot [data-act="pdr-open"]').count() === 1, "a PDF's file sheet has Read");
    await page.click('.sheet-foot [data-act="pdr-open"]');
    await page.waitForSelector(".pdr-page .textLayer span", {timeout: 15000});
    ok(/of 2/.test(await page.locator("#pdrOf").textContent()), "the reader knows the page count");
    ok(await page.locator(".pdr-page .pdr-cv").count() >= 1, "pages are drawn");
    const selectText = (word) => page.evaluate(word => {
      const span = [...document.querySelectorAll(".pdr-page .textLayer span")].find(s => s.textContent.includes(word));
      const tn = span.firstChild, r = document.createRange(), i = tn.textContent.indexOf(word);
      r.setStart(tn, i); r.setEnd(tn, i + word.length);
      const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r);
      span.dispatchEvent(new MouseEvent("mousedown", {bubbles: true})); span.dispatchEvent(new MouseEvent("mouseup", {bubbles: true}));
    }, word);
    await selectText("Mitochondria produce most"); await page.waitForTimeout(200);
    ok(await page.locator(".pdr-pop").count() === 1, "selecting text shows the highlight bar");
    await page.click('.pdr-pop [data-act="pdr-hl-add"][data-id="green"]'); await page.waitForTimeout(250);
    let hl = await page.evaluate(() => state.files.f1.hl || []);
    ok(hl.length === 1 && hl[0].t === "Mitochondria produce most" && hl[0].c === "green" && hl[0].p === 1 && hl[0].a === "a-read4", "a highlight is kept on the file: " + JSON.stringify(hl[0] && {t: hl[0].t, c: hl[0].c}));
    ok(hl[0].r.every(r => r[0] >= 0 && r[1] >= 0 && r[0] + r[2] <= 1.001 && r[3] > 0.005 && r[3] < 0.1), "its box sits on the page");
    ok(await page.locator(".pdr-hl i").count() >= 1 && /1/.test(await page.locator("#pdrN").textContent()), "it's painted, and counted");
    await selectText("Ribosomes build proteins"); await page.waitForTimeout(200);
    await page.click('.pdr-pop [data-act="pdr-sel-note"]'); await page.waitForTimeout(300);
    const made = await page.evaluate(() => Object.values(state.notes).find(n => /Ribosomes build proteins/.test(n.text)));
    ok(made && /\[\[Reading 4\.pdf#p1\]\]/.test(made.text) && made.courseId === "c1", "Note makes a note with a link back to the page");
    ok(await page.evaluate(() => (state.files.f1.hl || []).length === 2 && !!state.files.f1.hl[1].n), "and remembers it");
    await page.click("#pdrSideBtn"); await page.waitForTimeout(200);
    ok(await page.locator(".pdr-list li").count() === 2, "the Highlights panel lists both");
    await page.click('.pdr-list [data-act="pdr-hl-card"]'); await page.waitForTimeout(200);
    await page.fill("#pdrFront", "What makes most of a cell's ATP?");
    await page.click('[data-act="pdr-card-save"]'); await page.waitForTimeout(300);
    const card = await page.evaluate(() => state.decks.d1.cards.find(c => c.src && c.src.f === "f1"));
    ok(card && card.front === "What makes most of a cell's ATP?" && card.back === "Mitochondria produce most" && card.src.p === 1, "Card adds a flashcard to the course's deck, from the page");
    ok(await page.locator(".pdr-list li").first().locator("text=Card made").count() === 1, "the panel shows the card was made");
    // Tap a highlight: change it or remove it
    const box = await page.locator('.pdr-hl i').first().boundingBox();
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2); await page.waitForTimeout(200);
    ok(await page.locator('.pdr-pop [data-act="pdr-hl-del"]').count() === 1, "tapping a highlight offers its choices");
    await page.click('.pdr-pop [data-act="pdr-hl-del"]'); await page.waitForTimeout(250);
    ok(await page.evaluate(() => (state.files.f1.hl || []).length === 1), "Remove takes it off");
    await page.evaluate(() => dlg.close()); await page.waitForTimeout(200);
    // A [[file#p]] link opens the reader at that page
    await tab(page, "notes");
    await page.locator(`.note[data-note="${made.id}"] .note-link`).click();
    await page.waitForSelector(".pdr-page .textLayer span", {timeout: 15000}); await page.waitForTimeout(300);
    ok(await page.evaluate(() => !!window.__sbProStudy.reader() && window.__sbProStudy.reader().fid === "f1"), "a note's page link opens the reader");
    await page.evaluate(() => dlg.close()); await page.waitForTimeout(150);
    ok(page.errs.length === 0, "no console errors (reader): " + page.errs.join(" | "));

    /* ---------- Record a Lecture ---------- */
    await tab(page, "notes");
    ok(await page.locator('.tl-controls [data-act="lec-open"]').count() === 1, "Notes has Record Lecture");
    await page.click('.tl-controls [data-act="lec-open"]'); await page.waitForTimeout(250);
    ok(await page.evaluate(() => document.getElementById("lecCourse").value === "" && /Lecture, /.test(document.getElementById("lecTitle").value)), "the recorder starts with a title");
    await page.selectOption("#lecCourse", "c1");
    ok(/^BIO101 Lecture, /.test(await page.inputValue("#lecTitle")), "choosing the course names the lecture");
    await page.click('[data-act="lec-start"]');
    await page.waitForSelector(".lec-live", {timeout: 8000});
    ok(await page.evaluate(() => window.__sbProStudy.rec().view === "rec"), "recording");
    await page.waitForTimeout(1300);
    ok(await page.evaluate(() => window.__say("Osmosis moves water across a membrane.")), "live captions are listening");
    await page.click('[data-act="lec-mark"]'); await page.waitForTimeout(200);
    await page.evaluate(() => window.__say("Diffusion goes from high to low."));
    await page.waitForTimeout(200);
    ok(/Osmosis moves water/.test(await page.locator(".lec-caps").textContent()) && /★ 0:0\d/.test(await page.locator(".lec-caps").textContent()), "captions and the mark show while recording");
    await page.evaluate(() => dlg.close()); await page.waitForTimeout(250);
    ok(await page.locator("#lecPill").count() === 1 && /Recording/.test(await page.locator("#lecPill").textContent()), "closing the sheet leaves a Recording pill");
    await page.click("#lecPill"); await page.waitForTimeout(250);
    ok(await page.locator(".lec-live").count() === 1 && await page.locator("#lecPill").count() === 0, "the pill brings the recorder back");
    await page.click('[data-act="lec-pause"]'); await page.waitForTimeout(150);
    ok(/Paused/.test(await page.locator(".lec-state").textContent()), "pause");
    await page.click('[data-act="lec-pause"]'); await page.waitForTimeout(600);
    await page.click('[data-act="lec-stop"]');
    await page.waitForSelector("#lecText", {timeout: 8000});
    const rv = await page.evaluate(() => { const R = window.__sbProStudy.rec(); return {segs: R.segs.length, size: R.blob.size, text: document.getElementById("lecText").value, audio: !!document.querySelector(".lec-audio")}; });
    ok(rv.size > 0 && rv.audio, "stopping gives a recording to listen to (" + rv.size + " bytes)");
    ok(/Osmosis moves water across a membrane\.[\s\S]*★ 0:0\d[\s\S]*Diffusion goes/.test(rv.text), "the transcript has the captions with the mark in place: " + JSON.stringify(rv.text));
    ok(rv.segs === 1, "one part to transcribe");
    ok(await page.locator("#lecKeep").isDisabled(), "without file storage, keeping the recording isn't offered");
    await page.click('[data-act="lec-ai"]');
    await page.waitForFunction(() => { const t = document.getElementById("lecText"); return t && /Today we talk about osmosis/.test(t.value); }, null, {timeout: 15000});
    const sent = page.context().aiBodies.find(b => /inline_data/.test(b));
    ok(!!sent && /"mime_type":"audio\/webm"/.test(sent), "Transcribe with AI sends the audio to Gemini");
    ok(/★ 0:0\d/.test(await page.inputValue("#lecText")), "the marks are kept");
    ok(await page.isChecked('input[name="lecMake"][value="ai"]'), "with AI, study notes are the default");
    await page.click('[data-act="lec-save"]');
    await page.waitForSelector(".lec-done", {timeout: 15000});
    const lec = await page.evaluate(() => Object.values(state.notes).find(n => /^Osmosis and Diffusion/.test(n.text)));
    ok(lec && lec.courseId === "c1" && /Terms\n• Osmosis: Water moving across a membrane/.test(lec.text) && /Questions to Review/.test(lec.text), "Save makes study notes on the course's board");
    ok(await page.locator('.lec-foot [data-act="notecards-open"]').count() === 1, "Make Flashcards is offered");
    await page.click('.lec-foot [data-act="notecards-open"]'); await page.waitForTimeout(400);
    ok(await page.evaluate(() => /Flashcards|Cards/i.test(dlg.querySelector("h2") ? dlg.querySelector("h2").textContent : "")), "it opens Notes to Flashcards on the new note");
    await page.evaluate(() => dlg.close()); await page.waitForTimeout(150);
    ok(await page.locator("#lecPill").count() === 0 && await page.evaluate(() => !window.__sbProStudy.rec()), "the recorder is finished");
    // A recording in Files: its transcript
    await act(page, "f-open", "f2"); await page.waitForTimeout(250);
    ok(await page.locator('.sheet-foot [data-act="lec-file"]').count() === 1, "a recording's file sheet has Transcript");
    await page.click('.sheet-foot [data-act="lec-file"]'); await page.waitForTimeout(500);
    ok(/Cells are the unit of life/.test(await page.locator(".lec-tr").textContent()), "it shows the saved transcript");
    await page.evaluate(() => dlg.close()); await page.waitForTimeout(150);
    const lecErrs = page.errs.filter(e => !/only on the computer/.test(e));
    ok(lecErrs.length === 0, "no console errors (recorder): " + lecErrs.join(" | "));

    /* ---------- Email to Studyboard ---------- */
    const due5 = day(5), mon = new Date(due5 + "T12:00:00").toLocaleDateString("en-US", {month: "short"}), dd5 = Number(due5.slice(8));
    page.context().emailDue = due5;
    const mailRow = (id, extra) => Object.assign({id, text: "Fwd: Lab 4 moved", body: `Hi all,\nLab 4 is now due ${mon} ${dd5} at 5pm.\nBring your goggles.\n\nProf. Smith`, sender: "prof@school.edu", source: "email"}, extra || {});
    let handled = await page.evaluate(row => window.SBPRO.emailIngest([row]), mailRow("e1"));
    await page.waitForTimeout(400);
    ok(handled.join() === "e1", "an email is taken care of");
    const asked = page.context().aiBodies.find(b => /forwarded to their planner/.test(b));
    ok(!!asked && /prof@school\.edu/.test(asked) && /Lab 4 is now due/.test(asked), "with AI set up, the email is read by the AI");
    const cap = await page.evaluate(() => { const c = document.getElementById("capDlg"); return {open: !!c && c.open, text: c ? c.textContent : ""}; });
    ok(cap.open && /From an email: “Fwd: Lab 4 moved”/.test(cap.text) && /Lab 4/.test(cap.text), "what it found opens in the capture check sheet, not added straight away");
    ok(await page.evaluate(() => !Object.values(state.tasks).some(t => t.title === "Lab 4")), "nothing is added before the check");
    await page.evaluate(() => document.getElementById("capDlg").close()); await page.waitForTimeout(200);
    handled = await page.evaluate(() => window.SBPRO.emailIngest([{id: "g1", text: "Gmail Forwarding Confirmation", body: "Confirmation code: 834729163\nTo allow, click https://mail-settings.google.com/mail/vf-%5BABC%5D-123 now", sender: "forwarding-noreply@google.com", source: "email"}]));
    await page.waitForTimeout(300);
    ok(handled.join() === "g1" && /834729163/.test(await page.locator(".em-code").textContent()), "Gmail's forwarding code is shown, not turned into a task");
    await page.evaluate(() => dlg.close()); await page.waitForTimeout(150);
    ok(/Sign in to your Studyboard account/.test(await page.evaluate(() => window.__sbProStudy.email.box())), "signed out, the address waits for a sign-in");
    ok(page.errs.length === 0, "no console errors (email): " + page.errs.join(" | "));

    /* ---------- Free plan ---------- */
    const free = await open(await mkCtx(SEED(), true));
    await tab(free, "notes");
    ok(await free.locator(".note-link").count() === 0 && /\[\[Calvin cycle\]\]/.test(await free.locator('.note[data-note="n1"] .note-body').textContent()), "free: links stay plain text");
    await free.evaluate(() => { ui.tab = "flashcards"; ui.deckId = "d1"; render(); }); await free.waitForTimeout(250);
    ok(await free.locator('[data-act="ls-open"]').count() === 0, "free: no Listen button");
    await act(free, "ls-open", "d1"); await free.waitForTimeout(300);
    ok(await free.evaluate(() => !!dlg.querySelector(".plan-sheet")), "free: Listen opens the Pro sheet");
    await act(free, "f-open", "f1"); await free.waitForTimeout(250);
    ok(await free.locator('[data-act="pdr-open"]').count() === 0, "free: no Read on a PDF");
    await free.evaluate(() => dlg.close()); await free.waitForTimeout(100);
    await tab(free, "notes");
    ok(await free.locator('[data-act="lec-open"]').count() === 0, "free: no Record Lecture");
    await act(free, "lec-open"); await free.waitForTimeout(300);
    ok(await free.evaluate(() => !!dlg.querySelector(".plan-sheet")), "free: the recorder opens the Pro sheet");
    await free.evaluate(() => dlg.close());
    ok(/See Studyboard Pro/.test(await free.evaluate(() => window.__sbProStudy.email.box())), "free: Email to Studyboard points to Pro");
    // Without AI, the app's own reader finds the date
    await free.evaluate(() => dlg.close());
    const got = await free.evaluate(row => window.SBPRO.emailIngest([row]), mailRow("e2"));
    await free.waitForTimeout(400);
    const drafts = await free.evaluate(() => { const c = document.getElementById("capDlg"); return c && c.open ? c.textContent : ""; });
    ok(got.join() === "e2" && /Lab 4/.test(drafts) && free.context().aiBodies.length === 0, "without AI the app reads the email itself and asks first");
    await free.evaluate(() => document.getElementById("capDlg").close());
    ok(free.errs.length === 0, "no console errors (free): " + free.errs.join(" | "));
  } finally { await browser.close(); server.close(); }
  console.log(`\npro-study.e2e: ${n} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
