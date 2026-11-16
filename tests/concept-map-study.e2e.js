// node tests/concept-map-study.e2e.js
// Concept maps and studying (Pro): Make Flashcards from a map's worded connections (and Update, keeping progress), the map coloured by
// flashcard and quiz results with Review for shaky ideas, a card's way back to its map, and an idea linked to a PDF page or a lecture moment.
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
const SEED = {v: 2, updated: 1, settings: {}, courses: [
  {id: "c2", name: "Biology", code: "BIO 101", color: "#7C5CFF", maps: [{id: "m1", name: "Cell respiration", auto: false, created: 1, at: Date.now() - 864e5,
    add: [{id: "a", label: "Glycolysis"}, {id: "b", label: "Pyruvate"}, {id: "c", label: "Krebs cycle"}, {id: "d", label: "ATP"}],
    links: [{a: "root", b: "idea:a", label: "starts with"}, {a: "idea:a", b: "idea:b", label: "makes"}, {a: "idea:b", b: "idea:c", label: ""}, {a: "idea:c", b: "idea:d", label: "produces"}]}]}],
  tasks: [], notes: [], events: [],
  decks: [{id: "k1", name: "Bio basics", courseId: "c2", created: 1, cards: [
    {id: "kc1", front: "Where does the Krebs cycle happen?", back: "Mitochondria", box: 3, due: "", seen: 6, right: 5, wrong: 0},
    {id: "kc2", front: "What is ATP?", back: "The cell's energy currency", box: 0, due: "", seen: 3, right: 0, wrong: 3}], quizzes: [],
    aiQuizzes: [{id: "q1", title: "Practice Quiz", created: 1, results: [], questions: [{id: "qq1", type: "single", stem: "Where does glycolysis happen?", options: ["Cytoplasm", "Nucleus"], correct: [0], tries: 2, miss: 2}]}]}],
  files: [{id: "f1", kind: "file", name: "Lecture slides.pdf", courseId: "c2", folderId: "", created: 1, revs: [{name: "Lecture slides.pdf", assetId: "x1", at: 1}]},
    {id: "f2", kind: "file", name: "Lecture 3 recording", courseId: "c2", folderId: "lectures", created: 2, revs: [{name: "lecture.webm", assetId: "x2", at: 1}]}]};
(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  // a map control may sit in a toolbar menu (Add, Study, More), the idea panel's Attach menu, or its Style section: open whichever holds it, then click
  const cmClick = async (page, sel) => {
    const shown = () => page.locator(sel).first().isVisible().catch(() => false);
    for (const op of ['.cm-panel [data-cm="style"]', '.cm-tools [data-cm="menu"][data-v="add"]', '.cm-tools [data-cm="menu"][data-v="study"]', '.cm-tools [data-cm="menu"][data-v="more"]', '.cm-panel [data-cm="menu"][data-v="attach"]']) {
      if (await shown()) break;
      if (op.includes('"style"') && await page.locator(".cm-panel .cm-style").count()) continue;
      if (await page.locator(op).count()) { await page.click(op); await page.waitForTimeout(60); }
    }
    await page.click(sel);
  };
  const mkCtx = async viewport => {
    const ctx = await browser.newContext({viewport: viewport || {width: 1280, height: 860}, serviceWorkers: "block"});
    await ctx.addInitScript(seed => { try { if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("coursework:v2", JSON.stringify(seed)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("studyboard:tour", "done"); } } catch (e) {} }, SEED);
    return ctx;
  };
  const open = async ctx => { const page = await ctx.newPage(); page.errs = []; page.on("pageerror", e => page.errs.push(e.message)); page.on("console", m => { if (m.type() === "error" && !/Failed to load resource|ERR_FAILED/.test(m.text())) page.errs.push(m.text()); });
    await page.goto(base); await page.waitForFunction(() => window.__sbProStudy && window.SBCMAP); await page.waitForTimeout(500); return page; };
  const act = (page, a, id, extra) => page.evaluate(([a, id, extra]) => { const b = document.createElement("button"); b.dataset.act = a; if (id) b.dataset.id = id; Object.assign(b.dataset, extra || {}); b.style.display = "none"; document.body.appendChild(b); b.click(); b.remove(); }, [a, id || "", extra || {}]);
  const S = page => page.evaluate(() => JSON.parse(JSON.stringify(window.__sbProStudy.state())));
  const openMap = async page => { await act(page, "cm-open", "c2", {kind: "course", map: "m1"}); await page.waitForSelector('.cm-node[data-n="idea:a"]'); };
  const tap = async (page, id) => { await page.evaluate(() => { const S = SBCMAP.state(); S.sel = ""; S.selE = ""; S.lastTap = null; }); await page.focus(`.cm-node[data-n="${id}"]`); await page.keyboard.press("Enter"); await page.waitForTimeout(250); };
  const col = (page, id) => page.getAttribute(`.cm-node[data-n="${id}"]`, "data-col");
  const fits = page => page.evaluate(() => { const d = document.querySelector("dialog[open]"), w = document.documentElement; return w.scrollWidth <= w.clientWidth + 1 && (!d || [...d.querySelectorAll(".sheet-body, .cm-panel, .cm-row")].every(x => x.scrollWidth <= x.clientWidth + 1)); });
  const ctx = await mkCtx(), page = await open(ctx);

  /* Colour by Knowledge, from flashcard and quiz results */
  await openMap(page);
  await page.click('.cm-tools [data-cm="menu"][data-v="study"]'); const studyMenu = await page.textContent(".cm-tools .cm-menu"); await page.click('.cm-tools [data-cm="menu"][data-v="study"]');
  ok(await page.isVisible(".cm-chiptog") && /Make Flashcards/.test(studyMenu) && /Fill In the Map/.test(studyMenu), "every map offers Colour by Knowledge on the toolbar, and Make Flashcards in Study");
  await page.check('[data-cm="know"]'); await page.waitForTimeout(250);
  ok((await col(page, "idea:c")).toUpperCase() === "#2F9E44", "Krebs cycle is green: a card naming it, 5 of 5 right");
  ok((await col(page, "idea:d")).toUpperCase() === "#E03131", "ATP is red: a card naming it, 0 of 3");
  ok((await col(page, "idea:a")).toUpperCase() === "#E03131", "Glycolysis is red: a quiz question naming it, missed 2 of 2");
  ok((await col(page, "idea:b")).toUpperCase() === "#98A2B3", "Pyruvate is grey: no results yet");
  ok(/No results yet/.test(await page.textContent(".cm-legend")) && /Shaky/.test(await page.textContent(".cm-legend")), "the key says what the colours mean");
  await tap(page, "idea:d");
  ok(/Shaky · 0% right \(0 of 3\)/.test(await page.textContent(".cm-panel")) && await page.isVisible('[data-cm="study"]'), "an idea's panel shows its results and Review 1 Card");
  ok(/1 Shaky/.test(await page.textContent(".cm-tools")), "the toolbar offers Review for shaky ideas that have cards");
  await cmClick(page, '[data-cm="shaky"]'); await page.waitForFunction(() => { const s = window.__sbProStudy; return !document.querySelector("dialog[open] .cm-sheet"); }); await page.waitForTimeout(300);
  const fc = await page.evaluate(() => { const u = window.__sbProStudy.ui; return u.fc ? {mode: u.fc.mode, q: u.fc.q.map(x => x.cardId)} : null; });
  ok(fc && fc.mode === "study" && fc.q.length === 1 && fc.q[0] === "kc2", "Review Shaky Ideas studies just those cards (What is ATP?)");

  /* Make Flashcards from the map */
  await openMap(page);
  await cmClick(page, '[data-cm="cards"]'); await page.waitForSelector(".cm-cardsp");
  let t = await page.textContent(".cm-cardsp");
  ok(/3 worded connections · 1 without words skipped/.test(t) && /Glycolysis → makes → \?/.test(t) && /Pyruvate/.test(t), "Make Flashcards: a preview of the cards, and what's skipped");
  await page.check("[data-cm-both]"); await page.waitForTimeout(100); ok(/6 cards/.test(await page.textContent(".cm-cardsp")), "Also ask it backwards doubles them");
  await page.uncheck("[data-cm-both]"); await page.waitForTimeout(100);
  await cmClick(page, '[data-cm="cards-go"]'); await page.waitForTimeout(300);
  let st = await S(page), mp = st.courses.c2.maps[0], dk = st.decks[mp.deck];
  ok(dk && dk.name === "Cell respiration Map Cards" && dk.courseId === "c2" && dk.cards.length === 3, "a new deck for the course, named after the map, with 3 cards");
  ok(dk.cards.every(c => c.from.k === "cmap" && c.from.id === "c:c2:m1") && dk.cards.some(c => c.front === "Glycolysis → makes → ?" && c.back === "Pyruvate"), "each card knows its map and connection");
  await page.click('.cm-tools [data-cm="menu"][data-v="study"]'); const sm2 = await page.textContent(".cm-tools .cm-menu"); await page.click('.cm-tools [data-cm="menu"][data-v="study"]');
  ok(/Made 3 cards in Cell respiration Map Cards/.test(await page.textContent(".cm-panel")) && await page.locator('.cm-panel [data-cm="study-deck"]').count() === 1 && !(await page.locator("#toast.show").count()) && /Update Flashcards/.test(sm2), "the panel says what was made, with Study Now (no notice), and Study offers Update Flashcards");
  // the map's own cards colour the ideas they join
  await page.evaluate(id => { const d = window.__sbProStudy.state().decks[id]; const c = d.cards.find(x => x.back === "Pyruvate"); c.right = 0; c.wrong = 4; }, mp.deck);
  await page.evaluate(() => { const S = SBCMAP.state(); S.kc = null; S.know = true; }); await page.check('[data-cm="know"]').catch(() => {}); await page.evaluate(() => { const S = SBCMAP.state(); S.kc = null; }); await tap(page, "idea:b");
  ok((await col(page, "idea:b")).toUpperCase() === "#E03131" && /Review 1 Card/.test(await page.textContent(".cm-panel")), "studying the map's card (missed 4 times) turns Pyruvate red, with its card to review");
  // a new worded connection: Update adds just that, and keeps progress
  const ek = await page.evaluate(() => SBCMAP.state().g.edges.find(e => [e.a, e.b].sort().join() === ["idea:b", "idea:c"].sort().join()).key);
  await page.evaluate(k => { const S = SBCMAP.state(); S.sel = ""; S.selE = k; }, ek); await page.evaluate(() => { const b = document.createElement("button"); b.dataset.cm = "fit"; document.querySelector(".cm-tools").appendChild(b); b.click(); b.remove(); });
  await page.waitForSelector("[data-cm-elab]"); await page.fill("[data-cm-elab]", "feeds"); await page.press("[data-cm-elab]", "Enter"); await page.waitForTimeout(250);
  await cmClick(page, '[data-cm="cards"]'); await page.waitForSelector(".cm-cardsp");
  ok(/1 new, 0 changed/.test(await page.textContent(".cm-cardsp")), "Update Flashcards says what will change");
  await cmClick(page, '[data-cm="cards-go"]'); await page.waitForTimeout(300);
  dk = (await S(page)).decks[mp.deck];
  ok(dk.cards.length === 4 && dk.cards.find(c => c.back === "Pyruvate").wrong === 4 && dk.cards.some(c => c.front === "Pyruvate → feeds → ?"), "Update adds the new card and keeps the studied one's progress");
  ok(!(await page.locator('.cm-tools [data-cm="undo"]').isDisabled()), "the map's Undo button is ready");
  await page.click('.cm-tools [data-cm="undo"]'); await page.waitForTimeout(300);
  ok((await S(page)).decks[mp.deck].cards.length === 3 && !(await page.locator("#toast.show").count()), "the map's Undo takes the update back, quietly");
  ok(page.errs.length === 0, "no console errors (cards, knowledge): " + page.errs.join(" | "));
  await page.keyboard.press("Escape"); await page.waitForTimeout(200);

  /* A card made from the map leads back to it */
  await act(page, "fc-study", mp.deck); await page.waitForTimeout(300);
  await page.evaluate(() => { const b = document.querySelector('#view [data-act="fc-flip"], #view .fc-card, #view [data-act="flip"]'); if (b) b.click(); }); await page.waitForTimeout(250);
  await page.waitForSelector("#view .cm-fromcard");
  ok(/From your concept map Cell respiration/.test(await page.textContent(".cm-fromcard")), "studying, a map's card says which map it's from");
  await page.click(".cm-fromcard [data-act=cm-open]"); await page.waitForSelector(".cm-sheet");
  const sel = await page.evaluate(() => ({e: SBCMAP.state().selE, k: SBCMAP.state().know}));
  ok(sel.e && sel.k, "See It on the Map opens the map, coloured by knowledge, with that connection picked out");

  /* Link an idea to a PDF page or a lecture moment */
  await page.evaluate(() => { window.__went = []; SBPRO.openReader = (id, p) => window.__went.push(["pdf", id, p]); SBREPLAY.seek = (id, ms) => { window.__went.push(["lec", id, ms]); return Promise.resolve(); }; window.fileSheet = () => {}; });
  await tap(page, "idea:a"); ok(await page.locator('.cm-panel [data-cm="menu"][data-v="attach"]').count() === 1 && await page.locator('.cm-panel [data-cm="style"]').count() === 1, "an idea's panel: Attach (a page or lecture, a picture, a video) and Style");
  await cmClick(page, '[data-cm="at"]'); await page.waitForSelector("#cmAtF");
  ok(await page.$$eval("#cmAtF optgroup", g => g.map(x => x.label).join("|")) === "PDFs|Lectures", "the course's PDFs and lectures to pick from");
  await page.selectOption("#cmAtF", "f1"); await page.fill("#cmAtP", "12"); await page.click(".cm-atf [type=submit]"); await page.waitForTimeout(250);
  let idea = (await S(page)).courses.c2.maps[0].add.find(x => x.id === "a");
  ok(idea.at && idea.at.f === "f1" && idea.at.p === 12, "Glycolysis links to page 12 of the slides");
  ok(await page.textContent('.cm-node[data-n="idea:a"] .cm-atb text') === "p. 12", "the box shows a p. 12 tab");
  await tap(page, "idea:a"); ok(/Go to p\. 12/.test(await page.textContent(".cm-panel")), "its panel leads with Go to p. 12");
  await cmClick(page, '[data-cm="goat"]'); await page.waitForTimeout(200);
  ok(JSON.stringify(await page.evaluate(() => window.__went)) === JSON.stringify([["pdf", "f1", 12]]), "Go to p. 12 opens the PDF at page 12");
  await openMap(page); await page.evaluate(() => { window.__went = []; });
  await tap(page, "idea:d"); await cmClick(page, '[data-cm="at"]'); await page.waitForSelector("#cmAtF");
  await page.selectOption("#cmAtF", "f2"); ok(await page.isVisible("#cmAtT") && !(await page.isVisible("#cmAtP")), "a lecture asks for a time, not a page");
  await page.fill("#cmAtT", "7:99"); await page.click(".cm-atf [type=submit]"); ok(/like 12:34/.test(await page.textContent("[data-at-err]")), "a time that isn't one says how to write it");
  await page.fill("#cmAtT", "12:34"); await page.click(".cm-atf [type=submit]"); await page.waitForTimeout(250);
  idea = (await S(page)).courses.c2.maps[0].add.find(x => x.id === "d");
  ok(idea.at && idea.at.f === "f2" && idea.at.t === 754000 && await page.textContent('.cm-node[data-n="idea:d"] .cm-atb text') === "12:34", "ATP links to 12:34 in the lecture, shown on its box");
  await page.evaluate(() => { const S = SBCMAP.state(); S.sel = ""; S.lastTap = null; }); await page.focus('.cm-node[data-n="idea:d"]'); await page.keyboard.press("Enter"); await page.keyboard.press("Enter"); await page.waitForTimeout(300);
  ok(JSON.stringify(await page.evaluate(() => window.__went)) === JSON.stringify([["lec", "f2", 754000]]), "tapping the box twice plays the lecture from 12:34");
  await openMap(page); await tap(page, "idea:d"); await cmClick(page, '[data-cm="at"]'); await page.waitForSelector("#cmAtF"); await cmClick(page, '[data-cm="atoff"]'); await page.waitForTimeout(200);
  ok(!(await S(page)).courses.c2.maps[0].add.find(x => x.id === "d").at && !(await page.locator('.cm-node[data-n="idea:d"] .cm-atb').count()), "Remove Link takes it off");
  ok(page.errs.length === 0, "no console errors (links): " + page.errs.join(" | "));
  await ctx.close();

  /* Phone */
  const pctx = await mkCtx({width: 390, height: 844}), pp = await open(pctx);
  await openMap(pp); await tap(pp, "idea:a"); ok(await fits(pp), "an idea's panel fits at 390px");
  await cmClick(pp, '[data-cm="cards"]'); await pp.waitForSelector(".cm-cardsp"); ok(await fits(pp), "Make Flashcards fits at 390px");
  await tap(pp, "idea:a"); await cmClick(pp, '[data-cm="at"]'); await pp.waitForSelector("#cmAtF"); ok(await fits(pp), "the page or lecture link fits at 390px");
  ok(pp.errs.length === 0, "no console errors (phone): " + pp.errs.join(" | "));
  await pctx.close();
  await browser.close(); server.close();
  console.log(`concept-map-study.e2e: ${n} passed`);
})().catch(e => { console.error(e); process.exit(1); });
