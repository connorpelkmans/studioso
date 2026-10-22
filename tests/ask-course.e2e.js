// node tests/ask-course.e2e.js   (Playwright + Chromium; see tests/pw.js. The AI is stubbed, so every answer is fixed.)
// Ask Your Course (Search Everywhere, Ask With AI, module 30-search):
//   - Ask About This Course on the course page opens Ask scoped to that course; only its material is sent (another course's note is not)
//   - a question that names a course code scopes Ask to it by itself
//   - answers cite [n]; source chips open the exact note, lecture transcript or PDF page (with Read Page N in Pro)
//   - not covered: says so plainly, and Answer From General Knowledge is separate, labelled, and sends no sources
//   - a follow-up keeps the conversation (and the last answer's sources)
//   - Make Flashcards (review sheet, the course's deck picked), Save as Note ([[links]] to sources), Quiz Me (one question at a
//     time, checked, explained, saved as a practice quiz); Quiz Me is Pro (free shows the PRO badge and the Pro sheet)
//   - no horizontal scrolling at phone width
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const csp = require("../scripts/csp");
const root = path.join(__dirname, "..");
const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x"); let p = decodeURIComponent(u.pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  const ext = path.extname(f), mime = {".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".css": "text/css", ".webmanifest": "application/manifest+json"};
  res.writeHead(200, {"content-type": mime[ext] || "application/octet-stream"});
  // Pro on (enforcement off); the free context below forces the paywall back on with studyboard:paywall-test
  if (p === "/index.html") { res.end(csp.apply(fs.readFileSync(f, "utf8").replace("const PRO_ENFORCED = true;", "const PRO_ENFORCED = false;"))); return; }
  fs.createReadStream(f).pipe(res);
});
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const pad = x => String(x).padStart(2, "0");
const day = off => { const d = new Date(); d.setDate(d.getDate() + off); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
// A two-page PDF reading for BIO101 (page 2 has the stroma)
function textPdf(){
  const page = lines => lines.map((l, i) => `BT /F1 14 Tf 72 ${700 - i * 24} Td (${l}) Tj ET`).join("\n");
  const c1 = page(["Chapter 6: Photosynthesis", "Plants make sugar from carbon dioxide and water."]);
  const c2 = page(["Chapter 6, continued", "The Calvin cycle runs in the stroma of the chloroplast.", "It uses ATP and NADPH."]);
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
  return {v: 2, updated: 1, settings: {search: {meaning: false}},
    courses: [{id: "c1", name: "Biology", code: "BIO101", color: "#3B6FE0"}, {id: "c2", name: "Chemistry", code: "CHEM200", color: "#E0563B"}],
    notes: [
      {id: "n1", text: "Photosynthesis\nChlorophyll in the thylakoid membranes absorbs light to make ATP.", color: "yellow", x: 40, y: 40, z: 1, courseId: "c1"},
      {id: "n2", text: "Photochemistry\nIn photochemistry, light splits water molecules apart.", color: "blue", x: 320, y: 40, z: 2, courseId: "c2"}],
    decks: [{id: "d1", name: "Cell Biology", courseId: "c1", created: 1, cards: [{id: "k1", front: "What absorbs light in photosynthesis?", back: "Chlorophyll", box: 0, due: "", seen: 0, right: 0, wrong: 0}]}],
    tasks: [{id: "t1", title: "Photosynthesis lab report", courseId: "c1", type: "Lab", due: day(5), start: day(1), status: "todo", priority: "med", created: 5}],
    files: [
      {id: "f3", name: "Lecture 3 Photosynthesis", courseId: "c1", folderId: "lectures", kind: "file", taskIds: [], desc: "", url: "", dur: 3000,
        tr: {text: "Today we saw how light hits chlorophyll in the thylakoid. Then the Calvin cycle fixes carbon into sugar.", by: "ai", at: 1},
        revs: [{assetId: "local:a-lec3", name: "Lecture 3.webm", size: 900000, type: "audio/webm", at: 1}]},
      {id: "f9", name: "Photosynthesis Reading.pdf", courseId: "c1", folderId: "other", kind: "file", taskIds: [], desc: "", url: "",
        revs: [{assetId: "a-ps", name: "Photosynthesis Reading.pdf", size: 1200, type: "application/pdf", at: 1}]}]};
}
// Every string in a request body, joined (the prompt, the system text and the sources)
const textOf = body => { try { const out = []; const walk = v => { if (typeof v === "string") out.push(v); else if (v && typeof v === "object") Object.values(v).forEach(walk); }; walk(JSON.parse(body)); return out.join("\n"); } catch (e) { return String(body || ""); } };
// The number of the first numbered source whose block matches re
const srcNum = (t, re) => { for (const p of t.split(/\n(?=\[\d+\] )/)) { const m = /^\[(\d+)\] /.exec(p); if (m && re.test(p)) return Number(m[1]); } return 0; };
function reply(ctx, t){
  if (/You answer questions for a student inside their own planner app/.test(t)) {
    const q = (/QUESTION: ([^\n]*)/.exec(t) || [])[1] || "";
    ctx.asks.push({q, t});
    if (/light get absorbed/.test(q)) { const a = srcNum(t, /Sticky note: Photosynthesis/), b = srcNum(t, /^\[\d+\] Lecture: /); return {answer: `Chlorophyll in the thylakoid membranes absorbs light [${a}]. Your lecture covered it too [${b}].`, sources: [a, b], found: true, followUps: ["What does the Calvin cycle do?", "Where is chlorophyll found?"]}; }
    if (/more simply/.test(q)) { const a = srcNum(t, /Sticky note: Photosynthesis/); return {answer: `Plants catch light with a green pigment [${a}].`, sources: [a], found: true, followUps: []}; }
    if (/Krebs/.test(q)) return {answer: "Your notes don't mention the Krebs cycle.", sources: [], found: false, followUps: []};
    if (/splits water/.test(q)) { const a = srcNum(t, /Photochemistry/); return {answer: `Light splits water molecules [${a}].`, sources: [a], found: true, followUps: []}; }
    if (/stroma|Calvin cycle run/.test(q)) { const a = srcNum(t, /stroma/); return {answer: `In the stroma of the chloroplast [${a}].`, sources: [a], found: true, followUps: []}; }
    return {answer: "Not sure.", sources: [], found: false};
  }
  if (/from general knowledge, because their own course material/.test(t)) { ctx.gens.push(t); return {answer: "The Krebs cycle breaks down acetyl-CoA in the mitochondria to release energy."}; }
  if (/check a student's short answer/.test(t)) { ctx.judges.push(t); return {correct: true, feedback: "Yes, that green pigment is chlorophyll [1]."}; }
  if (/You write excellent flashcards/.test(t)) { ctx.cards.push(t); return {deckTitle: "Light Absorption", cards: [{front: "Where is chlorophyll found?", back: "In the thylakoid membranes", source: "[1]"}, {front: "What does chlorophyll absorb?", back: "Light", source: "[1]"}]}; }
  if (/You write high-quality practice exam questions/.test(t)) { ctx.quizzes.push(t); return {title: "Light", questions: [
    {type: "single", stem: "Where does chlorophyll absorb light?", options: ["Thylakoid membranes", "Nucleus", "Ribosome", "Cell wall"], correct: [0], rationale: "Chlorophyll sits in the thylakoid membranes [1].", source: "[1]"},
    {type: "short", stem: "What pigment absorbs light?", answer: "Chlorophyll", rationale: "Chlorophyll is the pigment [1].", source: "[1]"},
    {type: "truefalse", stem: "The Calvin cycle takes place inside the nucleus.", options: ["True", "False"], correct: [1], rationale: "It runs in the chloroplast, not the nucleus [1].", source: "[1]"}]}; }
  return {answer: "?", found: false};
}
(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  const mkCtx = async (free, viewport) => {
    const ctx = await browser.newContext({viewport: viewport || {width: 1200, height: 900}, serviceWorkers: "block"});
    Object.assign(ctx, {asks: [], gens: [], judges: [], cards: [], quizzes: []});
    await ctx.route(/generativelanguage\.googleapis\.com/, route => {
      const t = textOf(route.request().postData() || "");
      route.fulfill({status: 200, contentType: "application/json", body: JSON.stringify({candidates: [{content: {parts: [{text: JSON.stringify(reply(ctx, t))}]}, finishReason: "STOP"}]})});
    });
    await ctx.addInitScript(([seed, free, pdf]) => {
      try {
        if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("coursework:v2", JSON.stringify(seed)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("studyboard:tour", "done"); }
        localStorage.setItem("studyboard:aiKeys", JSON.stringify({gemini: "AIzaTESTTESTTESTTESTTESTTEST12345"})); localStorage.setItem("studyboard:aiConsent", JSON.stringify({gemini: {v: 1, at: 1}}));
        localStorage.setItem("studyboard:search:debug", "1");
        if (free) localStorage.setItem("studyboard:paywall-test", "1");
      } catch (e) {}
      window.__sxBytes = async assetId => assetId === "a-ps" ? new Uint8Array(pdf) : null;   // the PDF's bytes, for Search Inside Files
    }, [SEED(), !!free, textPdf()]);
    return ctx;
  };
  const openPage = async ctx => {
    const page = await ctx.newPage(); page.errs = [];
    page.on("pageerror", e => page.errs.push(e.message));
    await page.goto(base); await page.waitForSelector("#view", {state: "attached"});
    await page.waitForFunction(() => window.__sbProStudy && window.__sxDebug);
    await page.waitForTimeout(600);
    return page;
  };
  const H = page => page.evaluate(() => { const T = window.__sbProStudy; return {tab: T.ui.tab, notes: Object.values(T.state().notes), decks: T.state().decks}; });
  const closeAll = page => page.evaluate(() => { document.querySelectorAll("dialog[open]").forEach(d => d.close()); });
  const ask = async (page, q) => { await page.fill("#sxQ", q); await page.press("#sxQ", "Enter"); };
  const answered = (page, k) => page.waitForFunction(k => { const S = window.__sxDebug.S; return S.ask && S.ask.answer && S.ask.answer.state === "done" && S.thread.length >= k; }, k, {timeout: 15000});
  const openSearch = page => page.evaluate(() => { const b = document.createElement("button"); b.dataset.act = "search"; document.body.appendChild(b); b.click(); b.remove(); });

  /* ---------- Pro: the course page, scoped answers, citations, follow-ups, study tools ---------- */
  const ctx = await mkCtx(false), page = await openPage(ctx);
  await page.evaluate(() => { const T = window.__sbProStudy; T.ui.tab = "courses"; T.ui.courseId = "c1"; T.render(); });
  await page.waitForSelector('[data-act="ask-course"][data-sx-ask]');
  ok((await page.textContent('[data-act="ask-course"][data-sx-ask]')).includes("Ask About This Course"), "the course page has Ask About This Course");
  await page.click('[data-act="ask-course"][data-sx-ask]');
  await page.waitForSelector("#sxDlg[open].is-ask");
  ok(await page.$eval('#sxDlg .sx-scope [data-sx="scope"][aria-pressed="true"]', b => b.textContent.trim()) === "BIO101", "it opens Ask With AI, scoped to BIO101");
  ok(await page.locator('#sxAnswer .sx-fu [data-sx="fu"]').count() === 3 && (await page.getAttribute("#sxQ", "placeholder")) === "Ask about BIO101", "with three questions to try and an Ask About BIO101 box");

  await ask(page, "How does light get absorbed in photosynthesis?");
  await answered(page, 1); await page.waitForSelector("#sxAnswer .sx-cite");
  const first = ctx.asks[0].t;
  ok(/thylakoid membranes/.test(first) && !/photochemistry/i.test(first), "only BIO101's material is sent: its note, not CHEM200's note about light");
  ok(/COURSE: BIO101 \(Biology\)/.test(first), "the prompt says which course the question is about");
  ok(/\[\d+\] Lecture: Lecture 3 Photosynthesis/.test(first), "the lecture transcript is a numbered source");
  ok((first.match(/\n\[\d+\] /g) || []).length <= 8, "at most 8 passages are sent");
  ok(await page.locator("#sxAnswer .sx-ans .sx-cite").count() === 2, "the answer has two numbered citations");
  const chips = await page.$$eval("#sxAnswer .sx-from .sx-src", bs => bs.map(b => b.textContent));
  ok(chips.some(c => /Sticky note: Photosynthesis/.test(c)) && chips.some(c => /Lecture: Lecture 3 Photosynthesis/.test(c)), "source chips name the note and the lecture");
  ok(await page.locator('#sxAnswer .sx-fu [data-sx="fu"]').count() === 2, "two suggested follow-ups");
  ok(await page.locator('#sxAnswer [data-sx="mk-cards"]').count() === 1 && await page.locator('#sxAnswer [data-sx="quiz"]').count() === 1 && await page.locator('#sxAnswer [data-sx="save-note"]').count() === 1, "Make Flashcards, Quiz Me and Save as Note under the answer");
  ok(await page.locator('#sxAnswer [data-sx="quiz"] .pro-badge').count() === 0, "no PRO badge on Quiz Me for Pro");

  // Save as Note: the answer plus [[links]] to its sources
  const before = (await H(page)).notes.length;
  await page.click('#sxAnswer [data-sx="save-note"]');
  await page.waitForSelector('#sxAnswer [data-sx="open-note"]');
  const hs = await H(page), saved = hs.notes.find(x => /^How does light get absorbed/.test(x.text));
  ok(hs.notes.length === before + 1 && saved && saved.courseId === "c1", "Save as Note adds a BIO101 note named after the question");
  ok(/Sources:\n\[\d+\] \[\[Photosynthesis\]\]/.test(saved.text) && /\[\[Lecture 3 Photosynthesis\]\]/.test(saved.text) && /absorbs light \[\d+\]/.test(saved.text), "the note keeps the citations and links each source with [[...]]");

  // A citation opens the exact source: the lecture transcript, then the note
  await page.click('#sxAnswer .sx-from .sx-src:has-text("Lecture:")');
  await page.waitForSelector("dialog[open] .lec-sheet", {timeout: 5000});
  ok(!(await page.evaluate(() => document.querySelector("#sxDlg").open)), "the lecture citation closes search and opens the lecture");
  await closeAll(page);
  await openSearch(page); await page.waitForSelector("#sxDlg[open]");
  ok(await page.locator("#sxAnswer .sx-ans .sx-cite").count() === 2, "reopening search keeps the conversation");
  await page.click('#sxAnswer .sx-from .sx-src:has-text("Sticky note")');
  await page.waitForFunction(() => window.__sbProStudy.ui.tab === "notes");
  ok(true, "the note citation opens the note on the Notes board");

  // Follow-up: keeps context
  await openSearch(page); await page.waitForSelector("#sxDlg[open]");
  await ask(page, "Explain that more simply");
  await answered(page, 2); await page.waitForSelector("#sxAnswer .sx-turn");
  const fu = ctx.asks[ctx.asks.length - 1].t;
  ok(/CONVERSATION SO FAR/.test(fu) && /Student: How does light get absorbed in photosynthesis\?/.test(fu) && /Answer: Chlorophyll in the thylakoid membranes absorbs light\./.test(fu), "the follow-up sends the earlier question and answer");
  ok(/Sticky note: Photosynthesis/.test(fu), "and keeps the sources the last answer used");
  ok(await page.locator("#sxAnswer .sx-q").count() === 2 && /green pigment/.test(await page.textContent("#sxAnswer")), "both questions and answers show, like a chat");

  // Make Flashcards: the review sheet, with BIO101's deck picked
  await page.click('#sxAnswer [data-sx="mk-cards"]');
  await page.waitForSelector("dialog[open] #arSave", {timeout: 10000});
  ok(/thylakoid/.test(ctx.cards[0]) && !/photochemistry/i.test(ctx.cards[0]), "Make Flashcards sends the answer and its sources only");
  ok(await page.$eval("#arDeck", s => s.value) === "d1" && await page.locator("#arCards li").count() === 2, "the review sheet shows the cards, saving to Cell Biology");
  await page.click("#arSave"); await page.waitForTimeout(300);
  ok((await H(page)).decks.d1.cards.length === 3, "the cards are saved to Cell Biology");

  // Quiz Me: one question at a time, checked and explained with its source
  await openSearch(page); await page.waitForSelector("#sxDlg[open]");
  await page.click('#sxAnswer [data-sx="quiz"]');
  await page.waitForSelector("#sxAnswer .sx-tutor .sx-tq", {timeout: 10000});
  ok(/Question 1 of 3/.test(await page.textContent("#sxAnswer .sx-tutor")), "Quiz Me asks question 1 of 3");
  await page.click('#sxAnswer [data-sx="tq-opt"][data-id="0"]');
  await page.waitForSelector("#sxAnswer .sx-tres.ok");
  ok(await page.locator("#sxAnswer .sx-topt.ok").count() === 1 && await page.locator("#sxAnswer .sx-tutor .sx-from .sx-src").count() === 1, "a right answer is marked Correct, with the source it came from");
  await page.click('#sxAnswer [data-sx="tq-next"]');
  await page.waitForSelector("#sxTutorIn");
  await page.fill("#sxTutorIn", "the green pigment in leaves"); await page.press("#sxTutorIn", "Enter");
  await page.waitForSelector("#sxAnswer .sx-tres.ok");
  ok(ctx.judges.length === 1 && /EXPECTED ANSWER: Chlorophyll/.test(ctx.judges[0]) && /STUDENT'S ANSWER: the green pigment in leaves/.test(ctx.judges[0]), "a typed answer in other words is checked by the AI");
  ok(/that green pigment is chlorophyll/.test(await page.textContent("#sxAnswer .sx-tutor")), "and explained");
  await page.click('#sxAnswer [data-sx="tq-next"]');
  await page.click('#sxAnswer [data-sx="tq-opt"][data-id="0"]');
  await page.waitForSelector("#sxAnswer .sx-tres.no");
  ok(/The answer is False/.test(await page.textContent("#sxAnswer .sx-tres")), "a wrong answer says what the right one is");
  await page.click('#sxAnswer [data-sx="tq-next"]');
  ok(/You got 2 of 3 right/.test(await page.textContent("#sxAnswer .sx-tutor")), "the score at the end");
  await page.click('#sxAnswer [data-sx="tq-save"]');
  await page.waitForSelector("dialog[open] #arSave");
  await page.click("#arSave"); await page.waitForTimeout(300);
  const qz = Object.values((await H(page)).decks).filter(d => d.courseId === "c1").flatMap(d => d.aiQuizzes || []);
  ok(qz.length === 1 && qz[0].questions.length === 3, "Save as Practice Quiz saves the quiz in Biology (BIO101)");

  // Not covered: says so, and general knowledge is separate and sends no sources
  await openSearch(page); await page.waitForSelector("#sxDlg[open]");
  await page.click('#sxAnswer [data-sx="restart"]');
  ok(await page.locator("#sxAnswer .sx-q").count() === 0, "Start Over clears the conversation");
  await ask(page, "What is the Krebs cycle?");
  await answered(page, 1); await page.waitForSelector("#sxAnswer .sx-miss-l");
  ok((await page.textContent("#sxAnswer .sx-miss-l")).trim() === "Your BIO101 material doesn't cover this.", "it says plainly that BIO101's material doesn't cover it");
  ok(await page.locator('#sxAnswer [data-sx="mk-cards"]').count() === 0, "no study buttons for an answer that isn't in the material");
  await page.click('#sxAnswer [data-sx="general"]');
  await page.waitForSelector("#sxAnswer .sx-gen .sx-ans-t");
  const gtxt = await page.textContent("#sxAnswer .sx-gen");
  ok(/From General Knowledge/.test(gtxt) && /Not from your course material/.test(gtxt) && /acetyl-CoA/.test(gtxt), "Answer From General Knowledge is labelled as not from the course material");
  ok(ctx.gens.length === 1 && !/thylakoid|NUMBERED SOURCES/.test(ctx.gens[0]), "and sends only the question, none of the student's material");

  // A PDF page: once the file is read, a citation opens that page
  await page.waitForFunction(() => window.__sxDebug.IX.chunks.docs.some(d => !d.dead && /stroma/.test(d.text)), null, {timeout: 20000});
  await ask(page, "Where does the Calvin cycle run?");
  await answered(page, 2); await page.waitForSelector("#sxAnswer .sx-ans:not(.miss) .sx-cite");
  ok(/Photosynthesis Reading\.pdf, page 2/.test(ctx.asks[ctx.asks.length - 1].t), "the PDF's text is a source, with its page");
  await page.click('#sxAnswer .sx-from .sx-src:has-text("page 2")');
  await page.waitForSelector("dialog[open] .sx-prev");
  ok(/Page 2/.test(await page.textContent("dialog[open] .sx-prev .sx-pg")) && (await page.textContent("#sxRead")).trim() === "Read Page 2", "the citation shows that page's passage, with Read Page 2");
  await closeAll(page);

  // A question that names a course scopes Ask to it
  await page.evaluate(() => { const S = window.__sxDebug.S; S.course = ""; S.scopeSet = false; S.autoScope = ""; S.thread = []; S.ask = null; });
  await openSearch(page); await page.waitForSelector("#sxDlg[open]");
  await ask(page, "In CHEM200, what splits water with light?");
  await answered(page, 1); await page.waitForSelector("#sxAnswer .sx-cite");
  const ch = ctx.asks[ctx.asks.length - 1].t;
  ok(await page.$eval('#sxDlg .sx-scope [aria-pressed="true"]', b => b.textContent.trim()) === "CHEM200" && /because your question names it/.test(await page.textContent("#sxAnswer")), "naming CHEM200 scopes Ask to it, and says why");
  ok(/Photochemistry/.test(ch) && !/thylakoid/.test(ch), "only CHEM200's material is sent");
  ok(page.errs.length === 0, "no page errors: " + page.errs.join("; "));
  await ctx.close();

  /* ---------- Free, at phone width: the same answers, Quiz Me behind Pro ---------- */
  const fctx = await mkCtx(true, {width: 390, height: 844}), fp = await openPage(fctx);
  await fp.evaluate(() => { const T = window.__sbProStudy; T.ui.tab = "courses"; T.ui.courseId = "c1"; T.render(); });
  await fp.evaluate(() => { const b = document.querySelector('[data-act="ask-course"][data-sx-ask]'); if (b) b.click(); else { const x = document.createElement("button"); x.dataset.act = "sx-ask-course"; x.dataset.id = "c1"; document.body.appendChild(x); x.click(); x.remove(); } });
  await fp.waitForSelector("#sxDlg[open].is-ask");
  await ask(fp, "How does light get absorbed in photosynthesis?");
  await answered(fp, 1); await fp.waitForSelector("#sxAnswer .sx-cite");
  ok(await fp.locator('#sxAnswer [data-sx="mk-cards"]').count() === 1 && await fp.locator('#sxAnswer [data-sx="save-note"]').count() === 1, "free: cited answers, Make Flashcards and Save as Note");
  ok(await fp.locator('#sxAnswer [data-sx="quiz"] .pro-badge').count() === 1, "free: Quiz Me shows the PRO badge");
  ok(await fp.evaluate(() => { const s = document.querySelector("#sxDlg .sx"); return s.scrollWidth <= s.clientWidth + 1 && document.documentElement.scrollWidth <= window.innerWidth + 1; }), "no sideways scrolling at 390px");
  await fp.click('#sxAnswer [data-sx="quiz"]');
  await fp.waitForSelector("dialog[open] .plan-sheet, dialog[open] .pro-sheet", {timeout: 5000}).catch(() => {});
  ok(/Quiz Me is part of Studyboard Pro/.test(await fp.evaluate(() => (document.querySelector("dialog[open]") || {}).textContent || "")), "free: Quiz Me opens the Pro sheet with the reason");
  ok(fctx.quizzes.length === 0, "free: no quiz is written");
  ok(fp.errs.length === 0, "no page errors: " + fp.errs.join("; "));
  await browser.close(); server.close(); console.log(n + " checks passed");
})().catch(e => { console.error(e); process.exit(1); });
