// node tests/lecture-chain.e2e.js
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const csp = require("../scripts/csp");
const root = path.join(__dirname, "..");
const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x"); let p = decodeURIComponent(u.pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  const ext = path.extname(f), mime = {".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".css": "text/css", ".webmanifest": "application/manifest+json"};
  res.writeHead(200, {"content-type": mime[ext] || "application/octet-stream"});
  if (p === "/index.html" || /^\/bundle\/[^/]+\.js$/.test(p)) { res.end((/\.html$/.test(p) ? csp.apply : String)(fs.readFileSync(f, "utf8").replace("const PRO_ENFORCED = true;", "const PRO_ENFORCED = false;"))); return; }
  fs.createReadStream(f).pipe(res);
});
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const pad = x => String(x).padStart(2, "0");
const day = off => { const d = new Date(); d.setDate(d.getDate() + off); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const ms = off => new Date(day(off) + "T10:00:00").getTime();
const TR1 = "Today we talk about osmosis. Osmosis is water moving across a membrane toward the side with more solute. A membrane that lets water through but not solute is semipermeable. Tonicity compares solute on two sides of a membrane.";
const TR2 = "Diffusion is the movement of particles from high concentration to low concentration. Facilitated diffusion uses channel proteins. Active transport uses ATP to move against the gradient.";
const NOTE_OSMOSIS = {title: "Osmosis and Membranes", summary: "How water crosses membranes toward more solute.", sections: [{heading: "Osmosis", points: ["Osmosis is water moving across a membrane toward more solute", "A semipermeable membrane lets water through but not solute"]}, {heading: "Tonicity", points: ["Tonicity compares solute on two sides of a membrane"]}],
  terms: [{term: "Osmosis", definition: "Water moving across a membrane toward more solute"}, {term: "Semipermeable membrane", definition: "A membrane that lets water through but not solute"}, {term: "Tonicity", definition: "Compares solute on two sides of a membrane"}], questions: ["Which way does water move in osmosis?"]};
const NOTE_DIFF = {title: "Diffusion and Transport", summary: "How particles move from high to low concentration.", sections: [{heading: "Diffusion", points: ["Diffusion is particles moving from high concentration to low concentration", "Facilitated diffusion uses channel proteins"]}, {heading: "Active Transport", points: ["Active transport uses ATP to move against the gradient"]}],
  terms: [{term: "Diffusion", definition: "Particles moving from high concentration to low concentration"}, {term: "Active transport", definition: "Uses ATP to move against the gradient"}], questions: []};
// Cards are checked against the note's own text, so each one quotes it
const CARDS = {
  osmosis: [{front: "What is osmosis?", back: "Water moving across a membrane toward more solute", quote: "Water moving across a membrane toward more solute"},
    {front: "What does a semipermeable membrane do?", back: "It lets water through but not solute", quote: "A membrane that lets water through but not solute"},
    {front: "What does tonicity compare?", back: "Solute on two sides of a membrane", quote: "Compares solute on two sides of a membrane"}],
  diffusion: [{front: "What is diffusion?", back: "Particles moving from high concentration to low concentration", quote: "Particles moving from high concentration to low concentration"},
    {front: "What does facilitated diffusion use?", back: "Channel proteins", quote: "Facilitated diffusion uses channel proteins"},
    {front: "What does active transport use to move against the gradient?", back: "ATP", quote: "Active transport uses ATP to move against the gradient"}]};
function SEED(){
  const lec = (id, name, off, text) => ({id, name, courseId: "c1", folderId: "lectures", kind: "file", taskIds: [], desc: "", url: "", revs: [], dur: 3000, created: ms(off), updated: ms(off), tr: {text, by: "ai", at: ms(off)}, lec: {org: "", sum: "", at: ms(off)}});
  const files = [lec("L1", "BIO101 Lecture, Osmosis", -12, TR1), lec("L2", "BIO101 Lecture, Diffusion", -6, TR2)];
  files[0].lec.att = [{k: "note", id: "nSlides"}];
  const notes = [{id: "nSlides", text: "Lecture 5 slides\nOsmosis, semipermeable membranes, tonicity (hypertonic, hypotonic).", color: "yellow", x: 40, y: 40, z: 1, courseId: "c1", created: ms(-12)},
    {id: "nPlain", text: "Cell membranes\nPhospholipid bilayer: two layers of lipids with heads facing out.\nCholesterol: keeps the membrane fluid.", color: "pink", x: 300, y: 40, z: 2, courseId: "c1", created: ms(-3)}];
  const tasks = [{id: "mt1", title: "Midterm 1", courseId: "c1", type: "Exam", due: day(-20), start: day(-20), status: "done", priority: "high", created: ms(-40)}];
  return {v: 2, updated: 1, decks: [], notes, tasks, files, settings: {capacity: 15}, courses: [{id: "c1", name: "Biology", code: "BIO101", color: "#3B6FE0"}]};
}
(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath, args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"]});
  const mkCtx = async (o) => {
    o = o || {};
    const ctx = await browser.newContext({viewport: o.phone ? {width: 390, height: 844} : {width: 1200, height: 900}, permissions: ["microphone"], serviceWorkers: "block", colorScheme: o.dark ? "dark" : "light"});
    ctx.ai = [];
    await ctx.route(/generativelanguage\.googleapis\.com/, route => {
      const body = route.request().postData() || ""; ctx.ai.push(body);
      const reply = /into a student's study notes/.test(body) ? (/Diffusion/.test(body) && !/osmosis/i.test(body.split("Transcript:")[1] || "") ? NOTE_DIFF : NOTE_OSMOSIS)
        : /lecture study notes into flashcards/.test(body) ? {cards: /Diffusion and Transport/.test(body) ? CARDS.diffusion : CARDS.osmosis}
        : /sort a student's lectures into the topics/.test(body) ? {topics: [{name: "Membrane Transport", lectures: (body.match(/L\d+(?= \|)/g) || []).filter((x, i, a) => a.indexOf(x) === i)}]}
        : /inline_data/.test(body) ? {text: TR1}
        : /tidy the raw transcript/.test(body) ? {text: "## Osmosis\n\n" + TR1}
        : /detailed but compact summary/.test(body) ? {overview: "Osmosis.", sections: [{heading: "Osmosis", points: ["Water follows solute"]}], terms: [], takeaways: []}
        : {};
      route.fulfill({status: 200, contentType: "application/json", body: JSON.stringify({candidates: [{content: {parts: [{text: JSON.stringify(reply)}]}, finishReason: "STOP"}]})});
    });
    await ctx.addInitScript(([seed, o]) => {
      window.__SB_TEST = true;
      try {
        if (!localStorage.getItem("coursework:v2")) {
          localStorage.setItem("coursework:v2", JSON.stringify(seed)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("studyboard:tour", "done");
          if (o.ai) { localStorage.setItem("studyboard:aiKeys", JSON.stringify({gemini: "AIzaTESTTESTTESTTESTTESTTEST12345"})); localStorage.setItem("studyboard:aiConsent", JSON.stringify({gemini: {v: 1, at: 1}})); }
          if (o.free) localStorage.setItem("studyboard:paywall-test", "1");
          if (o.dark) localStorage.setItem("studioso:theme", "dark");
        }
      } catch (e) {}
    }, [SEED(), o]);
    return ctx;
  };
  const open = async ctx => {
    const page = await ctx.newPage(); page.errs = [];
    page.on("pageerror", e => page.errs.push(e.message)); page.on("console", m => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) page.errs.push(m.text()); });
    page.on("dialog", d => { page.errs.push("native dialog: " + d.message()); d.dismiss().catch(() => {}); });
    await page.goto(base); await page.waitForFunction(() => window.__sbSync && window.SBLC && window.SBPREP);
    await page.waitForTimeout(700); return page;
  };
  const S = page => page.evaluate(() => JSON.parse(JSON.stringify(window.__sbSync.state)));
  const act = (page, a, id) => page.evaluate(([a, id]) => { const b = document.createElement("button"); b.dataset.act = a; if (id) b.dataset.id = id; b.style.display = "none"; document.body.appendChild(b); b.click(); b.remove(); }, [a, id || ""]);
  const barText = page => page.evaluate(() => { const b = document.getElementById("lcNext"); return b ? b.textContent : ""; });
  const lectureSheet = async (page, id) => { await act(page, "lec-view", id); await page.waitForSelector(`.lc-chain[data-lc="${id}"]`, {timeout: 5000}); };
  try {
    const page = await open(await mkCtx({ai: true}));

    /* 1. Lecture to study notes */
    await lectureSheet(page, "L1");
    ok(/From Lecture to Exam/.test(await page.textContent(".lc-chain")) && await page.locator('.lc-chain [data-act="lc-notes"]').count() === 1, "a transcribed lecture offers Make Study Notes, on the lecture itself");
    await page.click('.lc-chain [data-act="lc-notes"]');
    await page.waitForFunction(() => Object.values(window.__sbSync.state.notes).some(n => n.lec === "L1"), null, {timeout: 8000});
    let st = await S(page); const note1 = Object.values(st.notes).find(n => n.lec === "L1");
    const sent = page.context().ai.find(b => /into a student's study notes/.test(b));
    ok(sent && /Today we talk about osmosis/.test(sent) && /Slides and notes for this lecture/.test(sent) && /hypertonic, hypotonic/.test(sent), "the AI gets the transcript and the attached slides");
    ok(!/AIzaTEST/.test(sent || ""), "no key in the request body");
    ok(note1.courseId === "c1" && note1.lecAt === day(-12) && st.files.L1.lec.note === note1.id, "the note is filed under the course, with the lecture's date, and the lecture links to it");
    ok(/^Osmosis and Membranes/.test(note1.text) && /\[\[BIO101 Lecture, Osmosis\]\]/.test(note1.text) && /• Osmosis: Water moving across a membrane/.test(note1.text), "the note has a title, a link back to the lecture and the terms: " + JSON.stringify(note1.text.slice(0, 120)));
    ok(/Next: Make Cards/.test(await barText(page)), "the next step is offered: Next: Make Cards");
    ok(await page.locator('.lc-chain .lc-step.done').count() === 1 && await page.locator('.lc-chain [data-act="lc-cards"]').count() === 1, "the lecture's chain shows the notes done and offers Make Cards for the course's deck");
    await page.click('#lcNext [data-act="lc-undo"]'); await page.waitForTimeout(300);
    st = await S(page);
    ok(!Object.values(st.notes).some(n => n.lec === "L1") && !st.files.L1.lec.note && await page.locator("#lcNext").count() === 0, "Undo removes the note and the lecture's link to it");
    await page.click('.lc-chain [data-act="lc-notes"]');
    await page.waitForFunction(() => Object.values(window.__sbSync.state.notes).some(n => n.lec === "L1"), null, {timeout: 8000});

    /* 2. Notes to draft cards */
    await page.click('#lcNext [data-act="lc-go"]');
    await page.waitForFunction(() => Object.values(window.__sbSync.state.decks).some(d => d.cards.some(c => c.draft)), null, {timeout: 8000});
    st = await S(page); let deck = Object.values(st.decks)[0];
    ok(Object.keys(st.decks).length === 1 && deck.name === "BIO101 Lectures" && deck.courseId === "c1", "with no deck for the course, the cards go to a new BIO101 Lectures deck");
    ok(deck.cards.length === 3 && deck.cards.every(c => c.draft === true && c.from && c.from.k === "lecture" && c.from.id === "L1" && c.from.at === day(-12) && Object.keys(c.from).join() === "k,id,at"), "every card is a draft with from = {k: lecture, id, at: the lecture date}");
    ok(JSON.stringify(deck.origins) === JSON.stringify([{k: "lecture", id: "L1", at: day(-12)}]), "the deck keeps its origins");
    ok(/3 draft cards ready to check/.test(await barText(page)) && await page.locator('#lcNext [data-act="lc-go"]').textContent() === "Check Now", "the prompt says 3 draft cards ready to check, with Check Now");
    const sentCards = page.context().ai.find(b => /lecture study notes into flashcards/.test(b));
    ok(sentCards && /Osmosis and Membranes/.test(sentCards) && !/Today we talk about osmosis/.test(sentCards), "only the note's text goes to the AI for cards");
    ok(await page.evaluate(() => { const d = Object.values(window.__sbSync.state.decks)[0]; return d.cards.filter(c => c.seen === 0 && !c.draft).length === 0; }), "drafts aren't studied yet");
    await page.click('#lcNext [data-act="lc-go"]'); await page.waitForSelector(".lc-check .lc-card");
    ok(await page.locator(".lc-check .lc-card").count() === 3, "Check Now lists the drafts");
    await page.locator(".lc-check .lc-card").nth(2).locator("[data-lc-keep]").uncheck();
    await page.locator(".lc-check .lc-card").nth(0).locator("[data-lc-f]").fill("Osmosis: which way does water move?");
    ok(await page.textContent("#lcKeepGo") === "Keep 2 Cards", "the button counts what's kept");
    await page.click("#lcKeepGo"); await page.waitForTimeout(300);
    st = await S(page); deck = Object.values(st.decks)[0];
    ok(deck.cards.length === 2 && deck.cards.every(c => !c.draft && c.from.id === "L1") && deck.cards[0].front === "Osmosis: which way does water move?", "kept cards lose draft (and keep from), edits are saved, the unticked one is left out");
    ok(/has no exam after/.test(await barText(page)) && /Next: Add the Exam/.test(await barText(page)), "with no exam yet, the last step offers Add the Exam");
    await page.click('#lcNext [data-act="lc-skip"]'); await page.waitForTimeout(150);
    ok(await page.locator("#lcNext").count() === 0, "Skip leaves it quietly waiting");

    await page.evaluate(() => window.SBLC.makeNotes("L2"));
    await page.waitForFunction(() => Object.values(window.__sbSync.state.notes).some(n => n.lec === "L2"), null, {timeout: 8000});
    await page.click('#lcNext [data-act="lc-skip"]'); await page.waitForTimeout(100);
    ok(await page.locator("#lcNext").count() === 0, "the notes step's prompt can be skipped too");
    const note2 = Object.values((await S(page)).notes).find(n => n.lec === "L2");
    await page.evaluate(id => { const T = window.__sbSync; if (T.dlg.open) T.dlg.close(); T.ui.tab = "notes"; T.render(); }, note2.id); await page.waitForTimeout(200);
    await page.click(`.note[data-note="${note2.id}"] .note-body`); await page.waitForSelector(".note.editing .lc-nrow");
    ok(/From BIO101 Lecture, Diffusion/.test(await page.textContent(".note.editing .lc-nrow")) && /Make Cards for BIO101 Deck/.test(await page.textContent(".note.editing .lc-nrow")), "the open note says which lecture it's from and offers Make Cards for BIO101 Deck");
    await page.click('.note.editing [data-act="lc-cards"]');
    await page.waitForFunction(() => Object.values(window.__sbSync.state.decks)[0].cards.length === 5, null, {timeout: 8000});
    st = await S(page); deck = Object.values(st.decks)[0];
    ok(Object.keys(st.decks).length === 1 && deck.cards.filter(c => c.draft).length === 3 && deck.cards.filter(c => c.from.id === "L2").every(c => c.from.at === day(-6)), "the second lecture's drafts join the same deck, dated by their lecture");
    ok(deck.origins.length === 2 && deck.origins[0].id === "L2" && deck.origins[1].id === "L1", "origins: one per lecture, newest first");
    await page.click('#lcNext [data-act="lc-undo"]'); await page.waitForTimeout(300);
    ok((await S(page)).decks[deck.id].cards.length === 2, "Undo takes the drafts back out");
    await page.evaluate(id => window.SBLC.makeCards(id), note2.id);
    await page.waitForFunction(() => Object.values(window.__sbSync.state.decks)[0].cards.length === 5, null, {timeout: 8000});
    await page.evaluate(() => { const T = window.__sbSync; T.ui.tab = "flashcards"; T.ui.deckId = Object.keys(T.state.decks)[0]; T.render(); }); await page.waitForTimeout(250);
    ok(/3 draft cards ready to check/.test(await page.textContent(".lc-drafts")), "the deck page shows the drafts waiting");
    await page.click('.lc-drafts [data-act="lc-check"]'); await page.waitForSelector(".lc-check");
    await page.click("#lcKeepGo"); await page.waitForTimeout(300);
    ok((await S(page)).decks[deck.id].cards.every(c => !c.draft) && await page.locator(".lc-drafts").count() === 0, "checking them from the deck page keeps them");
    await page.evaluate(() => { const b = document.querySelector('#lcNext [data-act="lc-skip"]'); if (b) b.click(); });

    /* 3. An exam added later pulls the cards in by lecture date */
    await page.evaluate(([a, b]) => { const T = window.__sbSync, d = T.clone(Object.values(T.state.decks)[0]);
      d.cards.push({id: "old1", front: "Old", back: "From before Midterm 1", box: 0, due: "", seen: 0, right: 0, wrong: 0, from: {k: "lecture", id: "L0", at: a}});
      d.cards.push({id: "late1", front: "Late", back: "After Midterm 2", box: 0, due: "", seen: 0, right: 0, wrong: 0, from: {k: "lecture", id: "L9", at: b}});
      T.applyChanges([{kind: "deck", id: d.id, after: d}], ""); }, [day(-25), day(6)]);
    await lectureSheet(page, "L1");
    ok(await page.locator('.lc-chain [data-act="lc-add-exam"]').count() === 1, "the lecture's chain offers Add the Exam");
    await page.click('.lc-chain [data-act="lc-add-exam"]'); await page.waitForSelector("#dlg select[name=type]");
    ok(await page.inputValue("#dlg select[name=type]") === "Exam", "Add the Exam opens the task form as an exam in the course");
    await page.fill("#dlg input[name=title]", "Midterm 2");
    await page.fill("#dlg input[name=due]", day(4));
    await page.click("#dlg [data-submit]");
    await page.waitForFunction(() => { const t = Object.values(window.__sbSync.state.tasks).find(x => x.title === "Midterm 2"); return t && t.prep && t.prep.topics && t.prep.topics.length; }, null, {timeout: 8000});
    st = await S(page); let ex = Object.values(st.tasks).find(x => x.title === "Midterm 2");
    const ids = ex.prep.topics.flatMap(t => t.links.filter(l => l.k === "deck").flatMap(l => l.cardIds));
    ok(ex.courseId === "c1" && ids.length === 5 && st.decks[deck.id].cards.filter(c => c.from.id === "L1" || c.from.id === "L2").every(c => ids.includes(c.id)), "the new exam pulls in both lectures' cards");
    ok(!ids.includes("old1") && !ids.includes("late1"), "a lecture before the previous exam, and one after this exam, aren't pulled in");
    ok(ex.prep.topics.length === 1 && ex.prep.topics[0].name === "Membrane Transport" && ex.prep.topics[0].links.filter(l => l.k === "note").length === 2, "the AI sorts the lectures into the exam's topics, with their notes linked");
    ok(page.context().ai.some(b => /sort a student's lectures into the topics/.test(b) && /BIO101 Lecture, Osmosis/.test(b) && /Osmosis and Membranes/.test(b) && !/Today we talk about osmosis/.test(b)), "sorting sends titles and note headings, not transcripts");
    ok(/Pulled in 2 lectures \(5 cards\)/.test(await barText(page)), "Exam Prep says Pulled in 2 lectures (5 cards): " + await barText(page));
    await page.click('#lcNext [data-act="lc-go"]'); await page.waitForSelector("#ppBody .lc-prep");
    ok(/Pulled in 2 lectures \(5 cards\) by lecture date/.test(await page.textContent("#ppBody .lc-prep")) && /Membrane Transport/.test(await page.inputValue("#ppBody [data-pn]")), "Exam Prep lists the topic and says what it pulled in");
    ok(/BIO101 Lectures/.test(await page.textContent("#ppBody .pp-topic")), "the topic's linked material is the lecture deck");
    await page.evaluate(() => window.__sbSync.dlg.close());
    await page.evaluate(() => window.SBLC.pullIn(Object.values(window.__sbSync.state.tasks).find(x => x.title === "Midterm 2").id, {show: true}));
    ok(/already in Midterm 2 prep/.test(await page.evaluate(() => window.__sbSync.toastText())), "pulling in twice adds nothing twice");
    await lectureSheet(page, "L1");
    ok(/In Midterm 2 prep/.test(await page.textContent(".lc-chain")) && await page.locator(".lc-chain .lc-step.done").count() === 3, "the lecture's chain is done: notes, cards, exam prep");
    ex = Object.values((await S(page)).tasks).find(x => x.title === "Midterm 2");
    await page.evaluate(id => { const T = window.__sbSync, e = T.clone(T.state.tasks[id]); e.prep = null; T.applyChanges([{kind: "task", id, after: e}], ""); }, ex.id);
    await page.waitForSelector('.lc-chain [data-act="lc-pull"]', {timeout: 4000});
    await page.click('.lc-chain [data-act="lc-pull"]');
    await page.waitForFunction(() => /Pulled in 2 lectures/.test((document.getElementById("lcNext") || {}).textContent || ""), null, {timeout: 8000});
    await page.click('#lcNext [data-act="lc-undo"]'); await page.waitForTimeout(300);
    ok(!((await S(page)).tasks[ex.id].prep || {}).topics, "Undo takes the pulled-in topics back out");

    /* The recorder's Saved view offers the chain right where the transcript lands */
    await page.evaluate(() => { const T = window.__sbSync; if (T.dlg.open) T.dlg.close(); }); await page.waitForTimeout(100);
    await page.evaluate(() => window.SBPRO.openRecorder("c1"));
    await page.waitForSelector('[data-act="lec-start"]'); if (await page.locator("#lecCap").count()) await page.uncheck("#lecCap");
    await page.click('[data-act="lec-start"]'); await page.waitForSelector(".lec-live", {timeout: 8000}).catch(async e => { console.log("DBG", await page.evaluate(() => document.getElementById("dlg").innerText), page.errs); throw e; }); await page.waitForTimeout(900);
    await page.click('[data-act="lec-stop"]'); await page.waitForSelector("#lecText", {timeout: 8000});
    await page.fill("#lecText", TR2 + " " + TR2); await page.fill("#lecName", "Transport Review");
    await page.click('[data-act="lec-save"]'); await page.waitForSelector(".lec-done", {timeout: 15000});
    ok(await page.locator('.lec-done + .lc-chain [data-act="lc-notes"], .lec-body .lc-chain [data-act="lc-notes"]').count() === 1, "after Save, the recorder offers Make Study Notes");
    ok(!Object.values((await S(page)).notes).some(n => n.text.includes("Transport Review")), "and makes no note until asked");
    await page.click('.lec-body .lc-chain [data-act="lc-notes"]');
    await page.waitForFunction(() => { const f = Object.values(window.__sbSync.state.files).find(x => x.name === "Transport Review"); return f && f.lec && f.lec.note; }, null, {timeout: 8000});
    ok(await page.locator(".lec-body .lc-chain .lc-step.done").count() === 1 && /Next: Make Cards/.test(await barText(page)), "the Saved view updates in place, with the next step");
    await page.evaluate(() => { const b = document.querySelector('#lcNext [data-act="lc-skip"]'); if (b) b.click(); window.__sbSync.dlg.close(); });
    ok(page.errs.length === 0, "no console errors: " + page.errs.join(" | "));
    await page.context().close();

    /* Without AI */
    const p2 = await open(await mkCtx({}));
    await lectureSheet(p2, "L1");
    const row = await p2.textContent(".lc-chain");
    ok(/written by AI with your own key/.test(row) && await p2.locator('.lc-chain [data-act="lc-trnote"]').count() === 1 && await p2.locator('.lc-chain [data-act="lc-ai-setup"]').count() === 1, "without AI: it says so and offers Keep the Transcript as a Note, or Set Up AI");
    await p2.click('.lc-chain [data-act="lc-trnote"]'); await p2.waitForTimeout(300);
    let s2 = await S(p2); const tn = Object.values(s2.notes).find(n => n.lec === "L1");
    ok(tn && /Today we talk about osmosis/.test(tn.text) && tn.lecAt === day(-12) && s2.files.L1.lec.note === tn.id, "the transcript becomes a note, linked and dated");
    ok(!/written by AI with your own key/.test(await p2.textContent(".lc-chain")), "the explanation shows once");
    await p2.click('#lcNext [data-act="lc-go"]'); await p2.waitForSelector(".nc-sheet", {timeout: 5000});
    ok(await p2.locator(".nc-sheet .nc-card").count() >= 1, "Make Cards opens the card maker, cards made on this device");
    await p2.click("#ncSave"); await p2.waitForTimeout(300);
    s2 = await S(p2); const dk2 = Object.values(s2.decks)[0];
    ok(dk2 && dk2.cards.length >= 1 && dk2.cards.every(c => c.from && c.from.k === "lecture" && c.from.id === "L1" && c.from.at === day(-12) && !c.draft) && dk2.origins[0].id === "L1", "cards made by hand still record where they came from, and the deck its origins");
    ok(/has no exam after/.test(await barText(p2)), "and the next step is offered");
    ok(p2.context().ai.length === 0, "nothing was sent to an AI");
    ok(p2.errs.length === 0, "no console errors without AI: " + p2.errs.join(" | "));
    await p2.context().close();

    /* The free plan */
    const p3 = await open(await mkCtx({ai: true, free: true}));
    await p3.evaluate(() => window.SBLC.makeNotes("L1")); await p3.waitForTimeout(400);
    ok(!Object.values((await S(p3)).notes).some(n => n.lec) && await p3.evaluate(() => window.__sbSync.dlg.open && /Pro/.test(window.__sbSync.dlg.textContent)), "free: study notes from a lecture are Pro, like Record a Lecture");
    await p3.evaluate(() => window.__sbSync.dlg.close()); await p3.waitForTimeout(100);
    await p3.evaluate(() => window.SBNC.open("nPlain")); await p3.waitForSelector(".nc-sheet");
    await p3.click("#ncSave"); await p3.waitForTimeout(300);
    const dk3 = Object.values((await S(p3)).decks)[0];
    ok(dk3 && dk3.cards.every(c => c.from && c.from.k === "note" && c.from.id === "nPlain" && c.from.at === day(-3)) && dk3.origins[0].k === "note", "free: cards from an ordinary note record from = {k: note}");
    await p3.evaluate(d => window.__sbSync.applyChanges([{kind: "task", id: "fx", after: {id: "fx", title: "Final", courseId: "c1", type: "Exam", due: d, start: d, status: "todo", priority: "high", created: Date.now()}}], "Added Final"), day(9));
    await p3.waitForFunction(() => { const t = window.__sbSync.state.tasks.fx; return t && t.prep && t.prep.topics && t.prep.topics.length; }, null, {timeout: 6000});
    const fx = (await S(p3)).tasks.fx;
    ok(fx.prep.topics[0].links.some(l => l.k === "deck" && l.cardIds.length === dk3.cards.length) && fx.prep.topics[0].links.some(l => l.k === "note" && l.id === "nPlain"), "free: an exam added later pulls in the note's cards (sorted by their words, no AI asked)");
    ok(!p3.context().ai.some(b => /sort a student's lectures/.test(b)), "one source and no topics yet: nothing to sort, so nothing is sent");
    ok(p3.errs.length === 0, "no console errors on the free plan: " + p3.errs.join(" | "));
    await p3.context().close();

    /* A 390px phone, dark theme */
    const p4 = await open(await mkCtx({ai: true, phone: true, dark: true}));
    await lectureSheet(p4, "L1");
    await p4.click('.lc-chain [data-act="lc-notes"]');
    await p4.waitForSelector('#lcNext [data-act="lc-go"]', {timeout: 8000});
    const fit = await p4.evaluate(() => { const d = document.getElementById("dlg"), b = document.getElementById("lcNext").getBoundingClientRect(), c = document.querySelector(".lc-chain").getBoundingClientRect();
      const bg = getComputedStyle(document.getElementById("lcNext")).backgroundColor, fg = getComputedStyle(document.getElementById("lcNext")).color;
      return {over: d.scrollWidth - d.clientWidth, bl: b.left, br: b.right, cl: c.left, cr: c.right, w: innerWidth, page: document.documentElement.scrollWidth, bg, fg}; });
    ok(fit.over <= 1 && fit.bl >= 0 && fit.br <= fit.w && fit.cl >= 0 && fit.cr <= fit.w && fit.page <= fit.w, "at 390px the chain and the prompt fit, no sideways scroll: " + JSON.stringify(fit));
    ok(fit.bg !== fit.fg && !/rgb\(255, 255, 255\)/.test(fit.bg), "dark theme: the prompt follows the theme: " + fit.bg + " on " + fit.fg);
    await p4.click('#lcNext [data-act="lc-go"]');
    await p4.waitForSelector('#lcNext [data-act="lc-go"]:text("Check Now")', {timeout: 8000});
    await p4.keyboard.press("Tab");
    ok(await p4.evaluate(() => { const b = document.querySelectorAll("#lcNext button"); return b.length === 3 && [...b].every(x => x.offsetHeight >= 28); }), "the prompt's buttons are real buttons, big enough to tap");
    await p4.click('#lcNext [data-act="lc-go"]'); await p4.waitForSelector(".lc-check");
    ok(await p4.evaluate(() => { const d = document.getElementById("dlg"); return d.scrollWidth <= d.clientWidth + 1; }), "the draft check sheet fits a phone");
    await p4.click("#lcKeepGo"); await p4.waitForTimeout(200);
    await p4.evaluate(() => { const T = window.__sbSync; T.ui.tab = "flashcards"; T.ui.deckId = Object.keys(T.state.decks)[0]; T.render(); });
    ok(await p4.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "the deck page fits too");
    ok(p4.errs.length === 0, "no console errors on the phone: " + p4.errs.join(" | "));
    await p4.context().close();
  } finally { await browser.close(); server.close(); }
  console.log(`lecture-chain.e2e.js: ${n} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
