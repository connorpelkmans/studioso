// node tests/companion-chat.e2e.js  (Playwright + Chromium; the AI call is stubbed)
// Checks: the Companion tab chat takes attachments, the AI's reply offers actions, and tapping one saves a note to a new board / adds tasks.
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const root = path.join(__dirname, "..");
const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x"); let p = decodeURIComponent(u.pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  res.writeHead(200, {"content-type": p.endsWith(".js") ? "text/javascript" : p.endsWith(".html") ? "text/html" : "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
const SEED = {v: 2, courses: [{id: "c1", name: "Intro Biology", code: "BIO101", color: "#3B6FE0"}], tasks: [], settings: {capacity: 15}, updated: 1};
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  const ctx = await browser.newContext({viewport: {width: 1280, height: 800}});
  await ctx.addInitScript(seed => { try { if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("coursework:v2", JSON.stringify(seed)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("studyboard:tour", "done");
    localStorage.setItem("studyboard:aiKeys", JSON.stringify({gemini: "AIzaTESTTESTTESTTESTTESTTEST12345"})); localStorage.setItem("studyboard:aiConsent", JSON.stringify({gemini: {v: 1, at: 1}})); } } catch (e) {} }, SEED);
  const reply = {answer: "I read your slide notes. I can save them to a Biology board and add the exam.", sources: [], followUps: [], actions: [
    {type: "note", label: "Save to Biology board", board: "Biology", course: "BIO101", noteTitle: "Cell Basics", text: "- Mitochondria make ATP\n- Nucleus holds DNA"},
    {type: "tasks", label: "Add the exam", course: "BIO101", tasks: [{title: "Cells Exam", type: "Exam", due: "2030-05-01"}]},
    {type: "flashcards", label: "Make flashcards", course: "BIO101", deckName: "Cell Basics"},
    {type: "edit_tasks", label: "Move the exam", edits: [{task: "Cells Exam", due: "2030-05-03"}]}]};
  const cardsReply = {deckTitle: "Cell Basics", cards: [{front: "What do mitochondria make?", back: "ATP"}, {front: "What does the nucleus hold?", back: "DNA"}]};
  await ctx.route(/generativelanguage\.googleapis\.com/, route => { const body = route.request().postData(); if (!/You write excellent flashcards/.test(body)) ctx.last = body; route.fulfill({status: 200, contentType: "application/json", body: JSON.stringify({candidates: [{content: {parts: [{text: JSON.stringify(/You write excellent flashcards/.test(body) ? cardsReply : reply)}]}, finishReason: "STOP"}]})}); });
  const page = await ctx.newPage(); const errs = []; page.on("pageerror", e => errs.push(e.message));
  await page.goto(base); await page.waitForFunction(() => window.SBCOMP && SBCOMP.tab);
  await page.evaluate(() => SBCOMPTAB.open());
  await page.waitForSelector("#cptIn");
  ok(await page.$(".cpt-attach"), "attach button is there");
  await page.setInputFiles("#cptFile", {name: "slides.txt", mimeType: "text/plain", buffer: Buffer.from("Cell basics\nMitochondria make ATP\nThe nucleus holds DNA")});
  await page.waitForSelector(".cpt-chip");
  ok((await page.textContent(".cpt-chip")).includes("slides.txt"), "attachment shows as a chip");
  await page.click("#cptGo");
  await page.waitForSelector(".cpt-action");
  ok((await page.$$(".cpt-action")).length === 4, "four actions offered");
  ok(ctx.last && ctx.last.includes("Mitochondria make ATP"), "the attachment went to the AI");
  await page.click('[data-act="cpt-do"][data-i="0"]');
  await page.waitForSelector(".cpt-done");
  const st = await page.evaluate(() => { const d = JSON.parse(localStorage.getItem("coursework:v2")); return {boards: d.settings.noteBoards, notes: d.notes || []}; });
  ok(st.boards && st.boards.length === 1 && st.boards[0].name === "Biology", "a Biology board was created");
  ok(st.notes.length === 1 && st.notes[0].board === st.boards[0].id && st.notes[0].text.includes("Cell Basics"), "the note is on that board");
  await page.click('[data-act="cpt-do"][data-i="1"]');
  await page.waitForFunction(() => (JSON.parse(localStorage.getItem("coursework:v2")).tasks || []).some(t => t.title === "Cells Exam"));
  ok(true, "the exam task was added");
  await page.click('[data-act="cpt-do"][data-i="3"]');
  await page.waitForFunction(() => (JSON.parse(localStorage.getItem("coursework:v2")).tasks || []).some(t => t.title === "Cells Exam" && t.due === "2030-05-03"));
  ok(true, "edit_tasks moved the exam");
  // refresh, then make the flashcards without attaching the file again
  await page.reload(); await page.waitForFunction(() => window.SBCOMPTAB); await page.evaluate(() => SBCOMPTAB.open());
  await page.click('[data-act="cpt-tab"][data-id="history"]'); await page.click(".cpt-hmain");
  await page.waitForSelector('[data-act="cpt-do"][data-i="2"]');
  await page.click('[data-act="cpt-do"][data-i="2"]');
  await page.waitForSelector('[data-act="cpt-open-deck"]');
  const decks = await page.evaluate(() => JSON.parse(localStorage.getItem("coursework:v2")).decks || []);
  ok(decks.length === 1 && decks[0].name === "Cell Basics" && decks[0].cards.length === 2, "flashcards were saved to a deck after a refresh, with no re-upload");
  ok(errs.length === 0, "no page errors: " + errs.join("; "));
  await browser.close(); server.close(); console.log(n + " checks passed");
})().catch(e => { console.error(e); process.exit(1); });
