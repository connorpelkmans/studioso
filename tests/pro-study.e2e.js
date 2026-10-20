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
  tasks.push({id: "t2", title: "Canvas Quiz 2", courseId: "c1", type: "Quiz", due: day(6), start: day(3), status: "todo", priority: "med", created: 6, cv: {id: "1234", url: "https://canvas.example/courses/1/quizzes/2"}});
  return {v: 2, updated: 1, decks, notes, tasks, files, settings: {}, courses: [{id: "c1", name: "Biology", code: "BIO101", color: "#3B6FE0", meetings: [{days: [1, 2, 3, 4, 5], start: "10:00", end: "11:20", kind: "Lecture", where: "Hall B"}]}]};
}
(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath, args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream", "--autoplay-policy=no-user-gesture-required"]});
  const mkCtx = async (seed, free, ai) => {
    const ctx = await browser.newContext({viewport: {width: 1200, height: 900}, permissions: ["microphone"], serviceWorkers: "block"});   // (so the test's stand-ins answer every request)
    ctx.aiBodies = [];
    // The icon library (Lucide on jsDelivr), cut down to a few icons
    ctx.luHits = 0;
    await ctx.route(/cdn\.jsdelivr\.net\/npm\/lucide-static@[\d.]+\/(tags|icon-nodes)\.json/, route => { ctx.luHits++;
      const tags = {"flask-conical": ["lab", "chemistry", "experiment"], "test-tube": ["lab", "science"], "beaker": ["lab", "chemistry"], "heart": ["love", "health"], "car": ["vehicle"]};
      const nodes = {"flask-conical": [["path", {d: "M14 2v6a2 2 0 0 0 .245.96l5.51 10.08A2 2 0 0 1 18 22H6a2 2 0 0 1-1.755-2.96l5.51-10.08A2 2 0 0 0 10 8V2"}], ["path", {d: "M6.453 15h11.094"}], ["path", {d: "M8.5 2h7"}]],
        "test-tube": [["path", {d: "M14.5 2v17.5c0 1.4-1.1 2.5-2.5 2.5c-1.4 0-2.5-1.1-2.5-2.5V2Z"}], ["path", {d: "M8.5 2h7"}], ["path", {d: "M14.5 16h-5"}]],
        "beaker": [["path", {d: "M4.5 3h15"}], ["path", {d: "M6 3v16a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V3Z"}], ["path", {d: "M6 14h12"}]], "heart": [["path", {d: "M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5Z"}]], "car": [["circle", {cx: "7", cy: "17", r: "2"}]]};
      route.fulfill({status: 200, contentType: "application/json", body: JSON.stringify(/tags/.test(route.request().url()) ? tags : nodes)}); });
    await ctx.route(/generativelanguage\.googleapis\.com/, async route => {
      const body = route.request().postData() || ""; ctx.aiBodies.push(body);
      const em = /forwarded to their planner/.test(body) && /Subject: Fwd: Lab 4 moved/.test(body);
      const reply = em ? {items: [{title: "Lab 4", dueDate: ctx.emailDue, dueTime: "17:00", course: "BIO101", type: "Lab", notes: "Bring goggles", confidence: 0.92}], rawText: ""}
        : /help find icons in an icon library/.test(body) ? {words: ["beaker", "lab"]}
        : /You pick icons for a student/.test(body) ? {picks: [{icon: "flask-conical", name: "Lab Flask"}, {icon: "test-tube", badge: "heart", name: "Test Tube"}, {icon: "beaker", name: "Beaker"}]}
        : /professional icon designer/.test(body) ? {icons: [1, 2, 3].map(k => ({idea: "a flask", name: (/three drafts/.test(body) ? "Polished " : "Flask ") + k, svg: '<path class="b" d="M10 3v6l-5 9h14l-5-9V3z"/><circle class="a" cx="12" cy="16" r="' + (1 + k) + '"/>'}))}
        : /inline_data/.test(body) ? {text: "Today we talk about osmosis. Water moves across a membrane toward the side with more solute."}
        : /tidy the raw transcript/.test(body) ? {text: "## Osmosis\n\nToday we talk about osmosis.\n\nWater moves toward more solute."}
        : /detailed but compact summary/.test(body) ? {overview: "How water and solutes cross membranes.", sections: [{heading: "Osmosis", points: ["Water moves toward more solute", "Needs a membrane"]}],
            terms: [{term: "Osmosis", definition: "Water moving across a membrane"}], takeaways: ["Water follows solute"]}
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
    await page.evaluate(() => { const n = state.notes.n2; applyChanges([{kind: "note", id: "n2", after: Object.assign(clone(n), {text: "TODO\n" + n.text})}], ""); });
    await page.waitForTimeout(200);
    ok(await page.evaluate(() => /\[\[The Calvin Cycle\]\]/.test(state.notes.n1.text) && !/\[\[TODO\]\]/.test(state.notes.n1.text)), "typing a new first line above a note's name is not a rename");

    /* ---------- Listen ---------- */
    await page.evaluate(() => { ui.tab = "flashcards"; ui.deckId = "d1"; ui.fc = null; render(); }); await page.waitForTimeout(300);
    ok(await page.locator('[data-act="ls-open"][data-id="d1"]').count() === 1, "the deck page has Listen");
    await page.click(".deck-head .ra-more-btn"); await page.click('[data-act="ls-open"][data-id="d1"]'); await page.waitForTimeout(300);   // Listen sits behind the deck's More
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

    /* ---------- Course icons made with AI ---------- */
    await tab(page, "courses"); await act(page, "edit-course", "c1"); await page.waitForTimeout(300);
    await page.click(".ci-ai-btn"); await page.fill("#ciAiQ", "a flask"); await page.click('[data-act="ci-ai-go"]');
    await page.waitForSelector("#ciAiPrev .ci-cand", {timeout: 15000});
    ok(await page.locator("#ciAiPrev .ci-cand").count() === 3, "AI icons: three drafts to choose from");
    const ib = page.context().aiBodies;
    ok(page.context().luHits >= 2 && ib.some(b => /You pick icons for a student/.test(b) && /flask-conical/.test(b)) && !ib.some(b => /professional icon designer/.test(b)), "icons come from the icon library: the AI only picks (nothing drawn from scratch)");
    ok(await page.evaluate(() => /class="a"/.test(document.querySelector("#ciAiPrev .ci-cand svg").innerHTML) && /<g transform="translate\(13\.5 13\.5\) scale\(0\.42\)">/.test(document.querySelectorAll("#ciAiPrev .ci-cand svg")[1].innerHTML)), "the library icon takes the course colour, and a badge sits small in the corner");
    await page.click('#ciAiPrev .ci-cand[data-id="2"]'); await page.click('[data-act="ci-ai-use"]'); await page.waitForTimeout(200);
    ok(await page.evaluate(() => { const c = state.settings.customIcons || []; return c.length > 0 && c[0].name === "Beaker"; }), "the chosen one is kept");
    await page.evaluate(() => dlg.close()); await page.waitForTimeout(150);

    /* ---------- Turning a sticker on a note ---------- */
    await tab(page, "notes");
    const sk = await page.evaluate(() => { const n = Object.values(state.notes).find(x => !x.board) || Object.values(state.notes)[0]; n.stickers = [{k: "dot", r: 0, s: 1, x: 50, yp: 50}]; render(); return n.id; });
    await page.waitForTimeout(300);
    const stk = page.locator(`.note[data-note="${sk}"] .stk`).first();
    await stk.hover(); const hb = await page.locator(`.note[data-note="${sk}"] .stk-rot`).first().boundingBox(), sb = await stk.boundingBox();
    const cx = sb.x + sb.width / 2, cy = sb.y + sb.height / 2;
    await page.mouse.move(hb.x + hb.width / 2, hb.y + hb.height / 2); await page.mouse.down();
    await page.mouse.move(cx + 40, cy + 20, {steps: 6}); await page.mouse.up(); await page.waitForTimeout(200);
    const sr = await page.evaluate(id => state.notes[id].stickers[0], sk);
    ok(sr && Math.abs(sr.r) > 20 && sr.x === 50, "a sticker turns with its handle and stays put (r " + (sr && sr.r) + ")");

    /* ---------- Record a Lecture ---------- */
    await tab(page, "notes");
    ok(await page.locator('[data-act="lec-open"]').count() === 0, "Notes no longer has Record Lecture");
    await tab(page, "courses"); await act(page, "open-course", "c1"); await page.waitForTimeout(250);
    ok(await page.evaluate(() => { const b = document.querySelector('.c2-head [data-act="lec-open"]'); return !!b && b.previousElementSibling && b.previousElementSibling.dataset.act === "ask-course"; }), "a course has Record Lecture beside Ask");
    ok(await page.locator('.cd-tabs [data-id="lectures"]').count() === 1, "a course has a Lectures tab");
    await page.click('.c2-head [data-act="lec-open"]'); await page.waitForTimeout(250);
    ok(await page.evaluate(() => /BIO101/.test(document.querySelector(".lec-for").textContent) && !document.getElementById("lecCourse") && !document.getElementById("lecTitle")), "from a course, the recorder is for that course and asks no name yet");
    // a microphone the browser has blocked: say how to unblock it (the browser can't ask again); one the person just didn't allow: ask again
    await page.evaluate(() => { const md = navigator.mediaDevices, orig = md.getUserMedia.bind(md), pq = navigator.permissions.query.bind(navigator.permissions); window.__micState = "denied";
      md.getUserMedia = c => window.__micState ? Promise.reject(Object.assign(new Error("no"), {name: "NotAllowedError"})) : orig(c);
      navigator.permissions.query = d => d && d.name === "microphone" && window.__micState ? Promise.resolve({state: window.__micState}) : pq(d); });
    await page.click('[data-act="lec-start"]'); await page.waitForSelector(".lec-err", {timeout: 4000});
    ok(/address bar, set Microphone to Allow/.test(await page.textContent(".lec-err")), "a blocked microphone says how to allow it");
    await page.evaluate(() => { window.__micState = "prompt"; });
    await page.click('[data-act="lec-start"]'); await page.waitForTimeout(300);
    ok(/Choose Allow when your browser asks/.test(await page.textContent(".lec-err")), "a dismissed prompt says to choose Allow and try again");
    await page.evaluate(() => { window.__micState = ""; });
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
    const sent = page.context().aiBodies.find(b => /inline_data/.test(b) && /audio\//.test(b));
    ok(!!sent && /"mime_type":"audio\/webm"/.test(sent), "Transcribe with AI sends the audio to Gemini");
    ok(/★ 0:0\d/.test(await page.inputValue("#lecText")), "the marks are kept");
    // Questions use the app's own box, on top of the open recorder (never the browser's grey confirm or prompt)
    let nativeBox = false; page.on("dialog", d => { nativeBox = true; d.dismiss().catch(() => {}); });
    await page.click('[data-act="lec-discard"]'); await page.waitForSelector("#askDlg[open]", {timeout: 4000});
    ok(/Throw Away This Recording/.test(await page.textContent("#askDlg")) && await page.evaluate(() => dlg.open && !!dlg.querySelector("#lecText")), "throwing a recording away asks in the app's own box, with the recorder still open under it");
    await page.click("#askNo"); await page.waitForTimeout(200);
    ok(await page.evaluate(() => !!window.__sbProStudy.rec() && dlg.open), "Keep It keeps the recording and the recorder");
    await act(page, "lec-ren", "f2"); await page.waitForSelector("#askDlg[open] #askIn", {timeout: 4000});
    await page.fill("#askIn", "BIO101 Lecture, Osmosis"); await page.click("#askYes"); await page.waitForTimeout(300);
    ok(await page.evaluate(() => window.__sbProStudy.state().files.f2.name) === "BIO101 Lecture, Osmosis", "renaming a lecture uses the app's own box");
    ok(!nativeBox, "no browser pop-up boxes");
    ok(await page.locator('input[name="lecMake"]').count() === 0, "no note to make");
    await page.fill("#lecName", "Osmosis Day");
    // Studyboard's storage is full: Save asks where the recording should go instead
    await page.evaluate(() => { const H = window.__sbProStudy; window.__fullDl = []; H.lecBk.assets = {upload: async () => { throw Object.assign(new Error("Over the free storage limit"), {code: "quota_or_state"}); }}; H.lecBk.download = (name, blob) => window.__fullDl.push(name + ":" + blob.size); const k = document.getElementById("lecKeep"); k.disabled = false; k.checked = true; });
    await page.click('[data-act="lec-save"]');
    await page.waitForSelector(".lec-full", {timeout: 8000});
    ok(/storage is full/i.test(await page.textContent(".lec-full")) && await page.locator('.lec-full [data-act="lec-full-dl"]').count() === 1 && await page.locator('.lec-full [data-act="lec-full-skip"]').count() === 1, "storage full: offers Save to This Device or Save Without It");
    ok(/Today we talk about osmosis/.test(await page.inputValue("#lecText")) && await page.inputValue("#lecName") === "Osmosis Day", "nothing typed is lost");
    await page.click('[data-act="lec-full-dl"]');
    await page.waitForSelector(".lec-done", {timeout: 15000});
    ok(await page.evaluate(() => window.__fullDl.length === 1 && /^Osmosis Day\.webm:[1-9]/.test(window.__fullDl[0])), "the recording downloads to this device: " + await page.evaluate(() => window.__fullDl.join()));
    ok(await page.evaluate(() => /saved to the device/.test(Object.values(state.files).find(f => f.folderId === "lectures").desc)), "and the lecture says where the recording is");
    await page.evaluate(() => { const H = window.__sbProStudy; H.lecBk.assets = null; H.lecBk.download = null; });
    const lf = await page.evaluate(() => Object.values(state.files).find(f => f.folderId === "lectures"));
    ok(lf && lf.name === "Osmosis Day" && lf.courseId === "c1" && /Today we talk about osmosis/.test(lf.tr.text), "Save keeps the lecture under the name given");
    ok(lf && /^## Osmosis/.test(lf.lec.org) && /How water and solutes[\s\S]*## Key Terms\n• Osmosis: Water moving across a membrane[\s\S]*## Takeaways/.test(lf.lec.sum), "with an organized transcript and a summary");
    ok(await page.evaluate(() => !Object.values(state.notes).some(n => n.lec || /Osmosis/.test(n.text))), "and no note");
    await page.click('.lec-foot [data-act="close"]'); await page.waitForTimeout(250);
    ok(await page.locator('.cd-tabs [data-id="lectures"][aria-selected="true"]').count() === 1 && await page.locator(".lec-row").count() === 1, "the course shows its Lectures");
    await page.click(".lec-row"); await page.waitForTimeout(300);
    ok(await page.locator(".lec-fopt").count() === 2, "a lecture offers its two files");
    await page.click('.lec-fopt[data-doc="sum"]'); await page.waitForTimeout(150);
    ok(/Key Terms/.test(await page.locator(".lec-docv").textContent()) && await page.locator(".lec-docv li").count() >= 3, "the summary");
    await page.click('.lec-doc-head [data-act="lec-doc"]'); await page.waitForTimeout(150);
    await page.click('.lec-fopt[data-doc="org"]'); await page.waitForTimeout(150);
    ok(/Today we talk about osmosis/.test(await page.locator(".lec-docv").textContent()) && await page.locator(".lec-docv h4").count() === 1, "the organized transcript");
    // Slides and Notes: pick a file and a note from the course; the summary is written with them, and Ask can read the lecture
    await page.click('.lec-doc-head [data-act="lec-doc"]'); await page.waitForTimeout(150);
    ok(await page.locator(".lec-att").count() === 1 && await page.locator('.lec-att [data-act="lec-att-up"]').count() === 1, "a lecture has Slides and Notes, with Upload Files and From Studyboard");
    await page.click('.lec-att [data-act="lec-att-pick"]'); await page.waitForSelector("#lecAttOk");
    await page.check('[data-att="file:f1"]'); await page.check('[data-att="note:n2"]'); await page.click("#lecAttOk");
    await page.waitForSelector(".lec-att-list li", {timeout: 5000});
    const lfa = await page.evaluate(() => Object.values(state.files).find(f => f.folderId === "lectures"));
    ok(lfa.lec.att.length === 2 && await page.locator(".lec-att-list li").count() === 2, "they're attached to the lecture");
    const nb = page.context().aiBodies.length;
    await page.click('.lec-fopt[data-doc="sum"]'); await page.waitForTimeout(150);
    await page.click('[data-act="lec-make"]'); await page.waitForTimeout(1500);
    ok(page.context().aiBodies.slice(nb).some(b => /Slides and notes/.test(b) && /Fixes carbon/.test(b)), "Write It Again sends the slides and notes as context");
    await page.evaluate(() => dlg.close()); await page.waitForTimeout(150);
    await act(page, "ask-course", "c1"); await page.waitForTimeout(300);
    ok(await page.evaluate(() => [...document.querySelectorAll("[data-askf]")].some(i => i.checked && /Lecture: Osmosis Day/.test(i.parentElement.textContent))), "Ask offers the lecture's transcript, checked");
    await page.evaluate(() => dlg.close()); await page.waitForTimeout(150);
    await page.click(".lec-row"); await page.waitForTimeout(300);
    await page.evaluate(() => dlg.close()); await page.waitForTimeout(150);
    ok(await page.locator("#lecPill").count() === 0 && await page.evaluate(() => !window.__sbProStudy.rec()), "the recorder is finished");
    await tab(page, "files");
    ok(!/Osmosis Day/.test(await page.locator("#view").textContent()), "lectures stay out of Files");
    // Back Up: to Files (sharing the stored recording), Google Drive / OneDrive, or this device
    await page.evaluate(() => { ui.tab = "courses"; ui.courseId = "c1"; ui.courseTab = "lectures"; ui.courseTabFor = "c1"; render(); }); await page.waitForTimeout(200);
    await page.click(".lec-row"); await page.waitForTimeout(300);
    await page.click('.lec-vfoot [data-act="lec-bk"]'); await page.waitForSelector(".lec-bk", {timeout: 5000});
    ok(await page.locator(".lec-bk-o").count() === 4, "Back Up offers Files, Google Drive, OneDrive and This Device");
    await page.evaluate(() => { window.__bkUp = []; window.__bkDl = []; SBCLOUD.connected = () => ["google"]; SBCLOUD.saveBlob = async (p, blob, name, o) => { window.__bkUp.push({p, name, folder: o.folderId, size: blob.size}); return {p, id: "x" + window.__bkUp.length, url: "https://drive.google.com/x"}; }; const H = window.__sbProStudy; H.lecBk.download = (name, blob) => window.__bkDl.push(name);
      H.lecBk.upload = async (list, o) => { const f = {id: "up" + Date.now(), name: list[0].name, courseId: o.courseId, folderId: o.folderId, kind: "file", revs: [{assetId: "a-up", name: list[0].name, size: list[0].size, type: "text/plain", at: Date.now()}], taskIds: [], desc: "", url: "", created: Date.now()}; window.__bkCloudFlag = o.cloud; H.applyChanges([{kind: "file", id: f.id, after: f}], ""); return [f]; }; });
    await page.click('.lec-bk-o[data-where="files"]');
    await page.waitForFunction(() => { const f = Object.values(state.files).find(x => x.folderId === "lectures"); return f && f.lec && f.lec.bk && f.lec.bk.files; }, null, {timeout: 8000});
    const bk = await page.evaluate(() => { const L = Object.values(state.files).find(x => x.folderId === "lectures"); return {L, copies: L.lec.bk.files.map(id => state.files[id])}; });
    ok(bk.copies.some(c => /Transcript and Summary\.txt$/.test(c.name) && c.folderId === "notes" && c.courseId === "c1"), "Files gets the transcript and summary, in the course's Lecture Notes");
    ok(await page.evaluate(() => window.__bkCloudFlag === false), "always in Studyboard's own storage (not redirected to the cloud)");
    ok(!bk.L.revs.length || bk.copies.some(c => c.revs.length && c.revs[0].assetId === bk.L.revs[bk.L.revs.length - 1].assetId), "and the recording, sharing the stored copy (no extra storage)");
    await page.waitForSelector('.lec-bk-o.done[data-where="files"]', {timeout: 5000});
    ok(true, "Files shows as backed up");
    await page.click('.lec-bk-o[data-where="google"]');
    await page.waitForFunction(() => window.__bkUp.length >= 1 && document.querySelector('.lec-bk-o.done[data-where="google"]'), null, {timeout: 8000});
    const up = await page.evaluate(() => window.__bkUp);
    ok(up.some(u => /Transcript and Summary\.txt$/.test(u.name) && u.p === "google" && u.folder === "lectures") && (!bk.L.revs.length || up.some(u => /^Osmosis Day\.(webm|m4a|ogg|wav)$/.test(u.name))), "Google Drive gets the recording and the transcript and summary, in Lectures: " + up.map(u => u.name).join(", "));
    await page.click('.lec-bk-o[data-where="microsoft"]'); await page.waitForTimeout(300);
    ok(await page.evaluate(() => /Cloud/i.test((document.querySelector("dialog[open]") || {}).textContent || "")), "OneDrive not connected: opens Cloud to connect it");
    await page.evaluate(() => dlg.close());
    await page.click(".lec-row"); await page.waitForTimeout(300);
    await page.click('.lec-vfoot [data-act="lec-bk"]'); await page.waitForSelector(".lec-bk");
    await page.click('.lec-bk-o[data-where="device"]'); await page.waitForTimeout(900);
    ok(await page.evaluate(() => window.__bkDl.some(n => /Transcript and Summary\.txt$/.test(n))), "This Device downloads the transcript and summary");
    // A lecture with its recording kept
    await page.evaluate(() => { window.__sbProStudy.applyChanges([{kind: "file", id: "lec2", after: {id: "lec2", name: "Week 2", courseId: "c1", folderId: "lectures", kind: "file", revs: [{assetId: "a-lec2", name: "Week 2.webm", size: 4096, type: "audio/webm", at: Date.now()}], taskIds: [], desc: "", url: "", created: Date.now(), tr: {text: "Hello class"}}}], ""); dlg.close(); window.__bkUp = []; });
    await act(page, "lec-bk", "lec2"); await page.waitForSelector(".lec-bk");
    await page.click('.lec-bk-o[data-where="files"]');
    await page.waitForFunction(() => { const f = window.__sbProStudy.state().files.lec2; return f.lec && f.lec.bk && f.lec.bk.files; }, null, {timeout: 8000});
    const c2 = await page.evaluate(() => { const S = window.__sbProStudy.state(); return S.files.lec2.lec.bk.files.map(id => S.files[id]); });
    ok(c2.some(c => c.name === "Week 2.webm" && c.revs[0].assetId === "a-lec2" && c.folderId === "notes"), "the recording's copy in Files points at the same stored file");
    await page.evaluate(() => dlg.close()); await page.waitForTimeout(150);
    await tab(page, "files");
    // A recording in Files: its transcript
    await act(page, "f-open", "f2"); await page.waitForTimeout(250);
    ok(await page.locator('.sheet-foot [data-act="lec-file"]').count() === 1, "a recording's file sheet has Transcript");
    await page.click('.sheet-foot [data-act="lec-file"]'); await page.waitForTimeout(500);
    ok(/Cells are the unit of life/.test(await page.locator(".lec-tr").textContent()), "it shows the saved transcript");
    await page.evaluate(() => dlg.close()); await page.waitForTimeout(150);
    // Live captions where the browser has no speech service (the desktop app): Gemini writes them from short pieces while recording
    await page.evaluate(() => { window.__srKeep = window.SpeechRecognition; window.SpeechRecognition = window.webkitSpeechRecognition = undefined; window.__sbProStudy.lecCapMs(1500); });
    await tab(page, "courses"); await act(page, "open-course", "c1"); await page.waitForTimeout(250);
    await page.click('.c2-head [data-act="lec-open"]'); await page.waitForTimeout(250);
    ok(/Written by Gemini every 30 seconds/.test(await page.textContent(".lec-body")) && await page.locator("#lecCap").isChecked(), "without the browser's speech service, live captions come from Gemini");
    const before = page.context().aiBodies.length;
    await page.click('[data-act="lec-start"]'); await page.waitForSelector(".lec-live", {timeout: 8000});
    await page.waitForFunction(() => /Today we talk about osmosis/.test((document.querySelector(".lec-caps") || {}).textContent || ""), null, {timeout: 15000});
    ok(true, "captions appear while recording");
    ok(page.context().aiBodies.slice(before).some(b => /inline_data/.test(b) && /Thirty seconds of a lecture/.test(b)), "each short piece goes to Gemini as it's recorded");
    await page.click('[data-act="lec-stop"]'); await page.waitForSelector("#lecText", {timeout: 20000});
    ok(await page.evaluate(() => /Today we talk about osmosis/.test(document.getElementById("lecText").value) && window.__sbProStudy.rec().by === "ai"), "when it stops, the transcript is already written");
    await page.click('[data-act="lec-discard"]'); await page.waitForSelector("#askDlg[open]", {timeout: 4000}); await page.click("#askYes"); await page.waitForTimeout(300);
    await page.evaluate(() => { window.SpeechRecognition = window.webkitSpeechRecognition = window.__srKeep; window.__sbProStudy.lecCapMs(30000); });
    // Drafts: a recording is kept on this device until it's saved or thrown away, even if the app closes
    const lecDrafts = pg => pg.evaluate(() => new Promise(res => { const r = indexedDB.open("studyboard-lecture-drafts", 1); r.onsuccess = () => { const db = r.result; if (!db.objectStoreNames.contains("meta")) { res([]); return; } const q = db.transaction("meta").objectStore("meta").getAll(); q.onsuccess = () => res(q.result); q.onerror = () => res([]); }; r.onerror = () => res([]); }));
    ok((await lecDrafts(page)).length === 0, "the saved lecture left no draft behind");
    await tab(page, "courses"); await act(page, "open-course", "c1"); await page.waitForTimeout(250);
    await page.click('.c2-head [data-act="lec-open"]'); await page.waitForTimeout(250);
    await page.click('[data-act="lec-start"]'); await page.waitForSelector(".lec-live", {timeout: 8000});
    ok((await lecDrafts(page)).some(d => d.state === "recording" && d.cid === "c1"), "a draft starts as soon as recording does");
    await page.waitForTimeout(1200); await page.click('[data-act="lec-stop"]'); await page.waitForSelector("#lecText", {timeout: 8000});
    await page.evaluate(() => dlg.close()); await page.waitForTimeout(250);
    ok(await page.locator("#lecPill.lp-card").count() === 1 && /Lecture recorded/.test(await page.textContent("#lecPill")) && /Name and Save/.test(await page.textContent("#lecPill")), "closing after recording leaves a Lecture recorded card");
    const d1 = (await lecDrafts(page))[0];
    ok(d1 && d1.state === "review", "and the recording is kept as a draft");
    // The app closing (a second window stands in for the next start): the draft is in the course's Lectures, to finish or delete
    const p2 = await open(page.context());
    await p2.evaluate(() => { window.confirm = () => true; ui.tab = "courses"; ui.courseId = "c1"; ui.courseTab = "lectures"; ui.courseTabFor = "c1"; render(); }); await p2.waitForSelector(".lec-draft", {timeout: 5000}).catch(() => {});
    ok(await p2.locator(".lec-draft").count() === 1 && /Draft, not saved yet/.test(await p2.textContent(".lec-draft")), "the draft shows in the course's Lectures");
    await p2.click('.lec-draft [data-act="lec-draft-open"]'); await p2.waitForSelector("#lecText", {timeout: 8000});
    ok(await p2.evaluate(() => !!document.querySelector(".lec-audio") && window.__sbProStudy.rec().view === "review"), "Finish opens it in the recorder, ready to listen, transcribe and save");
    await p2.evaluate(() => dlg.close()); await p2.waitForTimeout(200);
    await p2.close();
    await page.evaluate(() => { window.confirm = () => true; }); await page.evaluate(() => dlg.close());
    await act(page, "lec-open"); await page.waitForTimeout(200); await page.click('[data-act="lec-discard"]'); await page.waitForSelector("#askDlg[open]", {timeout: 4000}); await page.click("#askYes"); await page.waitForTimeout(400);
    ok((await lecDrafts(page)).length === 0, "Discard deletes the draft");
    // Add Lecture: record, or upload a recording made elsewhere (it's transcribed by itself and kept as a draft until saved)
    await page.evaluate(() => { ui.tab = "courses"; ui.courseId = "c1"; ui.courseTab = "lectures"; ui.courseTabFor = "c1"; render(); }); await page.waitForTimeout(300);
    ok(/Add Lecture/.test(await page.textContent(".fab")), "the Lectures tab's add button is Add Lecture");
    await page.click(".fab"); await page.waitForTimeout(200);
    ok(await page.locator('#dlg [data-act="lec-add-rec"]').count() === 1 && await page.locator('#dlg [data-act="lec-add-up"]').count() === 1, "it offers Record a Lecture and Upload a Recording");
    const wav = (secs, rate) => { const n = secs * rate, b = Buffer.alloc(44 + n * 2); b.write("RIFF", 0); b.writeUInt32LE(36 + n * 2, 4); b.write("WAVE", 8); b.write("fmt ", 12); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(rate, 24); b.writeUInt32LE(rate * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write("data", 36); b.writeUInt32LE(n * 2, 40); for (let i = 0; i < n; i++) b.writeInt16LE(Math.round(Math.sin(i / 8) * 8000), 44 + i * 2); return b; };
    const [chooser] = await Promise.all([page.waitForEvent("filechooser"), page.click('#dlg [data-act="lec-add-up"]')]);
    await chooser.setFiles({name: "Week 3 Membranes.wav", mimeType: "audio/wav", buffer: wav(3, 8000)});
    await page.waitForFunction(() => { const t = document.getElementById("lecText"); return t && /Today we talk about osmosis/.test(t.value); }, null, {timeout: 15000});
    ok(await page.evaluate(() => { const R = window.__sbProStudy.rec(); return R.uploaded && R.title === "Week 3 Membranes" && R.segs.length === 1 && R.dur > 2000 && !!document.querySelector(".lec-audio"); }), "an uploaded recording opens at the review, named from the file, and is transcribed by itself");
    ok((await lecDrafts(page)).some(d => d.title === "Week 3 Membranes"), "and is kept as a draft until saved");
    const parts = await page.evaluate(async b64 => { const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0)); const r = await window.__sbProStudy.lecSplit(new Blob([bytes], {type: "audio/wav"})); return {n: r.segs.length, dur: Math.round(r.dur), type: r.segs[0].type}; }, wav(380, 8000).toString("base64"));
    ok(parts.n === 2 && parts.dur === 380 && parts.type === "audio/wav", "a long recording is cut into 5-minute parts the AI can take: " + JSON.stringify(parts));
    await page.click('[data-act="lec-discard"]'); await page.waitForSelector("#askDlg[open]", {timeout: 4000}); await page.click("#askYes"); await page.waitForTimeout(300);
    ok((await lecDrafts(page)).length === 0, "Discard removes the uploaded draft too");
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
    ok(await page.evaluate(() => window.__sbProStudy.email.pending().length === 1), "closing the sheet keeps the email on the device, to check later");
    await page.evaluate(() => window.SBPRO.emailIngest([{id: "e1b", text: "Fwd: Lab 4 moved", body: "", sender: "prof@school.edu", source: "email"}]));
    await page.waitForTimeout(400);
    await page.click("#capAddAll"); await page.waitForTimeout(400);
    ok(await page.evaluate(() => Object.values(state.tasks).some(t => /Lab 4/.test(t.title)) && window.__sbProStudy.email.pending().length === 0), "adding what it found clears it");
    handled = await page.evaluate(() => window.SBPRO.emailIngest([{id: "g1", text: "Gmail Forwarding Confirmation", body: "Confirmation code: 834729163\nTo allow, click https://mail-settings.google.com/mail/vf-%5BABC%5D-123 now", sender: "forwarding-noreply@google.com", source: "email"}]));
    await page.waitForTimeout(300);
    ok(handled.join() === "g1" && /834729163/.test(await page.locator(".em-code").textContent()), "Gmail's forwarding code is shown, not turned into a task");
    await page.evaluate(() => dlg.close()); await page.waitForTimeout(150);
    ok(/Sign in to your Studyboard account/.test(await page.evaluate(() => window.__sbProStudy.email.box())), "signed out, the address waits for a sign-in");
    ok(page.errs.length === 0, "no console errors (email): " + page.errs.join(" | "));

    /* ---------- Two-way calendar sync ---------- */
    await page.evaluate(() => {
      const C = window.__sbProStudy.calsync, srv = window.__srv = {connected: false, syncs: [], reply: {}};
      C.T.transport = async body => {
        if (body.action === "status") return {ok: true, status: 200, data: {accounts: srv.connected ? [{provider: "google", account: "student@gmail.com", status: "ok", last_sync: null, sent: 0}] : [], providers: {google: true, microsoft: false}}};
        if (body.action === "start") return {ok: true, status: 200, data: {url: "https://accounts.google.com/o/oauth2/v2/auth?state=test"}};
        if (body.action === "sync") { srv.syncs.push(body); const r = srv.reply; srv.reply = {}; return {ok: true, status: 200, data: Object.assign({ok: true, changes: [], busy: null, more: false, stats: {created: body.events.length, updated: 0, removed: 0}}, r)}; }
        if (body.action === "disconnect") { srv.connected = false; return {ok: true, status: 200, data: {ok: true}}; }
        return {ok: false, status: 400, data: {}};
      };
    });
    await act(page, "cal-sync"); await page.waitForTimeout(300);
    ok(await page.locator('[data-cs-tab="two"]').count() === 1, "Calendar Sync has a Two-Way tab");
    await page.click('[data-cs-tab="two"]'); await page.waitForTimeout(600);
    ok(await page.locator('a[data-csy-go="google"][href^="https://accounts.google.com/"]').count() === 1, "Connect Google Calendar is a link to Google's page, ready to click");
    ok(await page.locator('[data-csy-go="microsoft"]').count() === 0, "a provider the server doesn't offer isn't shown");
    // Google sends the person back; the app notices and syncs
    await page.evaluate(() => { window.__srv.connected = true; });
    await page.evaluate(() => window.__sbProStudy.calsync.loadStatus());
    await page.evaluate(() => window.__sbProStudy.calsync.syncAll({provider: "google", quiet: true}));
    await page.waitForTimeout(200);
    const first = await page.evaluate(() => window.__srv.syncs[0]);
    ok(first && first.provider === "google" && /^[A-Za-z_]+\/[A-Za-z_]+|UTC/.test(first.tz) && first.bring === "titles", "a sync names the provider, the time zone and what to bring in");
    const lab = first.events.find(e => e.k === "t:t1"), quiz = first.events.find(e => e.k === "t:t2"), lecs = first.events.filter(e => e.k.startsWith("m:c1:"));
    ok(lab && lab.title === "Due: Lab report three · BIO101" && lab.allDay && !lab.busy, "a deadline: all day, not busy: " + JSON.stringify(lab));
    ok(quiz && quiz.title === "Canvas Quiz 2 · BIO101" && quiz.busy, "an exam or quiz marks you busy");
    ok(lecs.length >= 30 && lecs[0].title === "BIO101 Lecture" && lecs[0].start === "10:00" && lecs[0].end === "11:20" && lecs[0].where === "Hall B", "classes go week by week, with their room");
    ok(first.events.every(e => /^[tme]:[A-Za-z0-9_.:|-]+$/.test(e.k)), "every key is safe");
    // The calendar answers with a move, a school deadline move, a deletion and busy time
    await page.evaluate(([d5, d1]) => { const srv = window.__srv; srv.reply = {changes: [{k: "t:t1", allDay: false, date: d5, start: "14:00", end: "14:30"}, {k: "t:t2", allDay: true, date: d5}, {k: srv.syncs[0].events.find(e => e.k.startsWith("m:")).k, deleted: true}],
      busy: [{id: "aaaaaaaaaaaaaaaaaaaa", title: "Shift at café", where: "Main St", allDay: false, date: d1, start: "13:00", end: "17:00"}, {id: "bbbbbbbbbbbbbbbbbbbb", title: "Trip", allDay: true, date: d5, endDate: d5}], busyWindow: {from: d1, to: d5}}; }, [day(5), day(1)]);
    await page.evaluate(() => window.__sbProStudy.calsync.syncAll({provider: "google", quiet: true}));
    await page.waitForTimeout(300);
    const after = await page.evaluate(() => ({t1: state.tasks.t1, t2: state.tasks.t2, evs: Object.values(state.events).filter(e => e.src === "gcal"), toast: document.getElementById("toastMsg").textContent}));
    ok(after.t1.due === day(5) && after.t1.time === "14:00", "a deadline moved in Google moves here");
    ok(after.t2.due === day(6), "a school deadline keeps its date");
    ok(/Moved in Google Calendar: Lab report three/.test(after.toast), "with a message (and Undo): " + after.toast);
    ok(after.evs.length === 2 && after.evs.some(e => e.title === "Shift at café" && e.start === "13:00" && e.where === "Main St") && after.evs.some(e => e.allDay && e.title === "Trip"), "the person's own events come in as Schedule events");
    // A pulled event opens read-only
    const shift = after.evs.find(e => e.title === "Shift at café");
    await act(page, "sch-occ", shift.id, {type: "event", key: shift.date}); await page.waitForTimeout(250);
    ok(/From your Google Calendar/.test(await page.evaluate(() => dlg.textContent)) && await page.locator('dlg form input[name="title"], dialog input[name="title"]').count() === 0, "an event from Google opens read-only");
    await page.evaluate(() => dlg.close()); await page.waitForTimeout(150);
    // Next sync: the moved deadline is sent at its new time; the school one at its own
    await page.evaluate(() => window.__sbProStudy.calsync.syncAll({provider: "google", quiet: true}));
    await page.waitForTimeout(200);
    const third = await page.evaluate(() => window.__srv.syncs[2]);
    ok(third.events.find(e => e.k === "t:t1").start === "14:00" && third.events.find(e => e.k === "t:t2").date === day(6), "the next sync sends what Studyboard now has");
    ok(!third.events.some(e => /Shift at café/.test(e.title)), "events from a calendar are never sent back to one");
    // An event made in the Studyboard calendar itself: it becomes a Studyboard event, editable here, and is sent back under its own key
    await page.evaluate(d2 => { window.__srv.reply = {added: [{id: "cgn0123456789abcdef0123", title: "Dentist", where: "Main St", date: d2, allDay: false, start: "14:00", end: "15:00"}]}; }, day(2));
    await page.evaluate(() => window.__sbProStudy.calsync.syncAll({provider: "google"})); await page.waitForTimeout(300);
    const den = await page.evaluate(() => ({e: state.events.cgn0123456789abcdef0123, toast: document.getElementById("toastMsg").textContent}));
    ok(den.e && den.e.title === "Dentist" && den.e.start === "14:00" && den.e.end === "15:00" && den.e.where === "Main St" && !den.e.src && den.e.calFrom === "google", "an event added in the Studyboard calendar comes in as a Studyboard event: " + JSON.stringify(den.e));
    ok(/1 new from Google Calendar added/.test(den.toast), "and Sync Now says so: " + den.toast);
    await page.evaluate(() => window.__sbProStudy.calsync.syncAll({provider: "google", quiet: true})); await page.waitForTimeout(200);
    const back = await page.evaluate(d2 => window.__srv.syncs[window.__srv.syncs.length - 1].events.find(e => e.k === "e:cgn0123456789abcdef0123:" + d2), day(2));
    ok(back && back.title === "Dentist" && back.start === "14:00" && back.end === "15:00" && back.busy === true && back.where === "Main St" && back.note === "", "the next sync sends it back under its own key, exactly as the server expects: " + JSON.stringify(back));
    await page.evaluate(d2 => { window.__srv.reply = {changes: [{k: "e:cgn0123456789abcdef0123:" + d2, deleted: true}]}; }, day(2));
    await page.evaluate(() => window.__sbProStudy.calsync.syncAll({provider: "google", quiet: true})); await page.waitForTimeout(300);
    ok(await page.evaluate(() => !state.events.cgn0123456789abcdef0123), "deleted in Google Calendar: it goes from Studyboard too");
    // Google didn't let Studyboard read their calendar: Sync Now and the pane say so, with Connect Again
    await page.evaluate(() => { window.__srv.reply = {busyErr: "no_access"}; });
    await page.evaluate(() => window.__sbProStudy.calsync.syncAll({provider: "google"})); await page.waitForTimeout(300);
    ok(/can't see your Google Calendar events/.test(await page.evaluate(() => document.getElementById("toastMsg").textContent)), "Sync Now says it can't see their events");
    await act(page, "cal-sync"); await page.waitForTimeout(250); await page.click('[data-cs-tab="two"]'); await page.waitForTimeout(600);
    ok(/can't see the events in your Google Calendar/.test(await page.locator("#csPane").textContent()) && /See events on all your calendars/.test(await page.locator("#csPane").textContent()), "the pane explains what to allow");
    await page.evaluate(() => dlg.close()); await page.waitForTimeout(150);
    await page.evaluate(() => window.__sbProStudy.calsync.syncAll({provider: "google", quiet: true})); await page.waitForTimeout(200);
    // Settings: what to send, what to bring in
    await act(page, "cal-sync"); await page.waitForTimeout(250); await page.click('[data-cs-tab="two"]'); await page.waitForTimeout(400);
    ok(/student@gmail\.com/.test(await page.locator("#csPane").textContent()), "the pane shows the connected account");
    await page.uncheck('[data-csy-send="classes"]'); await page.waitForTimeout(100);
    await page.check('input[name="csyBring"][value="off"]'); await page.waitForTimeout(200);
    ok(await page.evaluate(() => Object.values(state.events).filter(e => e.src === "gcal").length === 0), "Don't bring them in removes the events that came in");
    await page.evaluate(() => window.__sbProStudy.calsync.syncAll({provider: "google", quiet: true})); await page.waitForTimeout(200);
    const fourth = await page.evaluate(() => window.__srv.syncs[window.__srv.syncs.length - 1]);
    ok(fourth.bring === "off" && !fourth.events.some(e => e.k.startsWith("m:")), "unticked classes aren't sent");
    // Reading Google Calendar switched off on the server: the choice is hidden and a note says why
    await page.evaluate(() => { window.__sbProStudy.calsync.setCache({reads: {google: false, microsoft: true}}); dlg.close(); }); await page.waitForTimeout(150);
    await act(page, "cal-sync"); await page.waitForTimeout(250); await page.click('[data-cs-tab="two"]'); await page.waitForTimeout(400);
    ok(await page.locator('input[name="csyBring"]').count() === 0 && /Bringing in your own Google Calendar events isn't available right now/.test(await page.locator("#csPane").textContent()), "with Google reading switched off, Bring In My Own Events is hidden");
    await page.evaluate(() => window.__sbProStudy.calsync.setCache({reads: {}}));
    await page.click('[data-act="csy-ask-off"][data-id="google"]'); await page.waitForTimeout(100);
    await page.click('[data-act="csy-off"][data-id="google"][data-remove="1"]'); await page.waitForTimeout(300);
    ok(/Connect Google Calendar/.test(await page.locator("#csPane").textContent()), "disconnect");
    await page.evaluate(() => dlg.close()); await page.waitForTimeout(150);
    ok(page.errs.length === 0, "no console errors (calendar sync): " + page.errs.join(" | "));

    /* ---------- Free plan ---------- */
    const free = await open(await mkCtx(SEED(), true));
    await tab(free, "notes");
    ok(await free.locator('.note[data-note="n1"] .note-link').count() > 0, "free: linked notes work on the free plan too");
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
    await act(free, "cal-sync"); await free.waitForTimeout(250);
    ok(await free.locator('[data-cs-tab="two"]').count() === 0 && await free.locator('[data-cs-tab="live"]').count() === 1, "free: Calendar Sync has no Two-Way tab");
    await free.evaluate(() => dlg.close()); await free.waitForTimeout(100);
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
