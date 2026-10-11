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
  if (p === "/index.html") { res.end(csp.apply(fs.readFileSync(f, "utf8").replace("const PRO_ENFORCED = true;", "const PRO_ENFORCED = false;"))); return; }
  fs.createReadStream(f).pipe(res);
});
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const pad = x => String(x).padStart(2, "0");
const day = off => { const d = new Date(); d.setDate(d.getDate() + off); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
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
  return {v: 2, updated: 1, decks, notes, tasks, settings: {}, courses: [{id: "c1", name: "Biology", code: "BIO101", color: "#3B6FE0"}]};
}
(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  const mkCtx = async (seed, free) => {
    const ctx = await browser.newContext({viewport: {width: 1200, height: 900}});
    await ctx.addInitScript(([seed, free]) => {
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
    }, [seed, !!free]);
    return ctx;
  };
  const open = async ctx => { const page = await ctx.newPage(); page.errs = []; page.on("pageerror", e => page.errs.push(e.message)); page.on("console", m => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) page.errs.push(m.text()); }); await page.goto(base); await page.waitForSelector("#view", {state: "attached"}); await page.waitForFunction(() => window.__sbProStudy);
    await page.evaluate(() => { const T = window.__sbProStudy; Object.defineProperty(window, "state", {get: () => T.state(), configurable: true}); Object.defineProperty(window, "dlg", {get: () => T.dlg(), configurable: true}); Object.defineProperty(window, "noteEditing", {get: () => T.editing(), configurable: true}); ["ui", "render", "applyChanges", "clone", "saveNoteText"].forEach(k => { window[k] = T[k]; }); });
    await page.waitForTimeout(900); return page; };
  const act = (page, a, id, data) => page.evaluate(([a, id, data]) => { const b = document.createElement("button"); b.dataset.act = a; if (id) b.dataset.id = id; Object.assign(b.dataset, data || {}); b.style.display = "none"; document.body.appendChild(b); b.click(); b.remove(); }, [a, id || "", data || null]);
  const tab = async (page, t) => { await page.evaluate(t => { ui.tab = t; render(); }, t); await page.waitForTimeout(250); };
  try {
    const page = await open(await mkCtx(SEED()));

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

    /* ---------- Free plan ---------- */
    const free = await open(await mkCtx(SEED(), true));
    await tab(free, "notes");
    ok(await free.locator(".note-link").count() === 0 && /\[\[Calvin cycle\]\]/.test(await free.locator('.note[data-note="n1"] .note-body').textContent()), "free: links stay plain text");
    await free.evaluate(() => { ui.tab = "flashcards"; ui.deckId = "d1"; render(); }); await free.waitForTimeout(250);
    ok(await free.locator('[data-act="ls-open"]').count() === 0, "free: no Listen button");
    await act(free, "ls-open", "d1"); await free.waitForTimeout(300);
    ok(await free.evaluate(() => !!dlg.querySelector(".plan-sheet")), "free: Listen opens the Pro sheet");
    ok(free.errs.length === 0, "no console errors (free): " + free.errs.join(" | "));
  } finally { await browser.close(); server.close(); }
  console.log(`\npro-study.e2e: ${n} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
