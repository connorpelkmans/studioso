// node tests/whiteboard-ai.e2e.js
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const root = path.join(__dirname, "..");
const MIME = {".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".png": "image/png", ".css": "text/css", ".svg": "image/svg+xml", ".webp": "image/webp", ".woff2": "font/woff2"};
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  res.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const NOTES = "• Mitosis makes two identical cells\n• Phases: prophase, metaphase, anaphase, telophase\n• Meiosis makes four cells with half the chromosomes";
const CARDS = [{front: "What does mitosis make?", back: "Two identical cells", quote: "Mitosis makes two identical cells"},
  {front: "What does meiosis make?", back: "Four cells with half the chromosomes", quote: "Meiosis makes four cells with half the chromosomes"}];
const SEED = {v: 2, courses: [{id: "c1", name: "Biology", code: "BIO 101", color: "#2E9A5A"}], tasks: [], decks: [], files: [], events: [], settings: {}, updated: 1,
  notes: [{id: "wb1", text: "Cell Division", wb: {v: 1, tpl: "blank"}, courseId: "c1", created: 1, updated: 1, wbItems: [{id: "t1", k: "t", x: 400, y: 400, s: "Mitosis -> 2 cells\nMeiosis -> 4 cells", c: "blue", f: 80, at: 1}]}]};
(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  const mk = async ai => {
    const ctx = await browser.newContext({viewport: {width: 1280, height: 900}, serviceWorkers: "block"});
    ctx.ai = [];
    await ctx.route(/generativelanguage\.googleapis\.com/, route => {
      const body = route.request().postData() || ""; ctx.ai.push(body);
      const reply = /You read handwriting drawn on a whiteboard/.test(body) ? {found: true, text: "Mitosis"} : /picture of a student's whiteboard/.test(body) ? {title: "Cell Division", notes: NOTES} : /lecture study notes into flashcards/.test(body) ? {cards: CARDS} : {};
      route.fulfill({status: 200, contentType: "application/json", body: JSON.stringify({candidates: [{content: {parts: [{text: JSON.stringify(reply)}]}, finishReason: "STOP"}]})});
    });
    await ctx.route(/supabase\.co/, r => r.abort());
    await ctx.addInitScript(([seed, ai]) => {
      window.__SB_TEST = true;
      try { if (!localStorage.getItem("coursework:v2")) {
        localStorage.setItem("coursework:v2", JSON.stringify(seed)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("studyboard:tour", "1"); localStorage.setItem("studyboard:notesView", "wb");
        if (ai) { localStorage.setItem("studyboard:aiKeys", JSON.stringify({gemini: "AIzaTESTTESTTESTTESTTESTTEST12345"})); localStorage.setItem("studyboard:aiConsent", JSON.stringify({gemini: {v: 1, at: 1}})); } } } catch (e) {}
    }, [SEED, ai]);
    const page = await ctx.newPage(); page.errs = []; page.on("pageerror", e => page.errs.push(e.message));
    await page.goto(base); await page.waitForFunction(() => window.__sbSync && window.SBWB && window.SBLC);
    await page.evaluate(() => { document.querySelectorAll("dialog[open]").forEach(d => d.close()); const b = document.querySelector('nav.tabs [data-tab="notes"]'); b && b.click(); });
    await page.waitForSelector(".wb-stage"); await page.waitForTimeout(400);
    return {ctx, page};
  };
  const S = page => page.evaluate(() => JSON.parse(JSON.stringify(window.__sbSync.state)));
  try {
    {
      const {ctx, page} = await mk(true);
      ok(await page.locator('#view [data-act="wb-ai"]').count() === 1, "the board's header has Notes and Cards");
      await page.click('#view [data-act="wb-ai"]'); await page.waitForSelector("dialog[open] #wbaGo");
      await page.waitForFunction(() => { const i = document.getElementById("wbaImg"); return i && i.src && i.naturalWidth > 0; });
      ok(true, "the sheet shows a picture of the board");
      ok(await page.inputValue("#wbaCourse") === "c1", "it starts with the board's course");
      await page.check('input[name="wbaK"][value="cards"]');
      await page.click("#wbaGo"); await page.waitForSelector("#wbaText", {timeout: 15000});
      const sent = ctx.ai.find(b => /picture of a student's whiteboard/.test(b)) || "";
      ok(/"mime_type":"image\/jpeg"/.test(sent) && /Board name: Cell Division/.test(sent), "the board went to the AI as a JPEG picture, with its name");
      ok((await page.inputValue("#wbaText")).startsWith("Cell Division\n\n• Mitosis makes two identical cells"), "the typed notes come back to check and edit");
      await page.fill("#wbaText", (await page.inputValue("#wbaText")) + "\n• Checked by me");
      await page.click("#wbaSave"); await page.waitForTimeout(1500);
      const st = await S(page), notes = Object.values(st.notes), made = notes.find(x => !x.wb && /Checked by me/.test(x.text));
      ok(made && made.courseId === "c1" && made.fromWb === "wb1", "Save Note puts the edited notes in Notes, in Biology, remembering the board");
      ok(await page.evaluate(() => !SBWB.on()) && await page.locator(`#nbBoard .note[data-note="${made.id}"]`).count() === 1, "and shows them on the sticky-note board");
      const decks = Object.values(st.decks), cards = decks.flatMap(d => d.cards || []);
      ok(cards.length === 2 && cards.every(c => c.draft && c.srcNote === made.id) && decks[0].courseId === "c1", "with “and flashcards”, two draft cards are made from the notes in Biology's deck: " + cards.length);
      ok(!page.errs.length, "no page errors: " + page.errs.join(" | "));
      // The stub counts bright red pixels in the picture it gets: the board's added picture is a red square
      await page.evaluate(() => {
        window.__redIn = async blob => { const bm = await createImageBitmap(blob), c = document.createElement("canvas"); c.width = bm.width; c.height = bm.height; const g = c.getContext("2d"); g.drawImage(bm, 0, 0); const d = g.getImageData(0, 0, c.width, c.height).data; let r = 0; for (let i = 0; i < d.length; i += 4) if (d[i] > 180 && d[i + 1] < 80 && d[i + 2] < 80) r++; return r; };
        SBPRO.locked = () => false; window.__ic = null; SBPRO.scanImage = async (blob, name) => ({blob, name, red: await window.__redIn(blob), boxes: [{x: 0.1, y: 0.1, w: 0.2, h: 0.1, t: "Mitosis"}]}); SBPRO.openImageEditor = (deckId, q) => { window.__ic = {deckId, n: q.length, name: q[0].name, size: q[0].blob.size, found: q[0].found, red: q[0].red}; };
      });
      await page.click('.nv-tabs [data-id="wb"]'); await page.waitForSelector(".wb-stage .wb-frame"); await page.waitForTimeout(200);
      const RED = await page.evaluate(() => { const c = document.createElement("canvas"); c.width = 120; c.height = 90; const g = c.getContext("2d"); g.fillStyle = "#ff0000"; g.fillRect(0, 0, 120, 90); return c.toDataURL("image/png"); });
      const PIC = {id: "p1", k: "i", x: 100, y: 100, w: 240, h: 180, src: RED, at: 2};
      await page.evaluate(pic => SBWB.set("i", pic.id, pic), PIC); await page.waitForTimeout(200);
      ok(await page.evaluate(async () => window.__redIn(await new Promise(r => SBWB.renderBoard(SBWB.board(), {max: 800}).then(cv => cv.toBlob(r, "image/png"))))) > 1000, "a normal render of the board shows its added picture");
      await page.click('#view [data-act="wb-ai"]'); await page.waitForSelector("dialog[open] #wbaGo");
      ok(await page.locator("dialog[open] .wb-ai-k legend").count() === 0, "no stray Make label over the choices");
      await page.check('input[name="wbaK"][value="pics"]'); await page.waitForTimeout(60);
      ok(await page.isVisible("#wbaDeck") && /New deck: Cell Division/.test(await page.locator("#wbaDeck").textContent()) && /Make Picture Cards/.test(await page.locator("#wbaGo").textContent()), "Picture flashcards asks for a deck (or a new one named after the board)");
      await page.selectOption("#wbaDeck", "__new");
      await page.click("#wbaGo"); await page.waitForTimeout(1500);
      const ic = await page.evaluate(() => window.__ic), dk = ic && await page.evaluate(id => window.__sbSync.state.decks[id], ic.deckId);
      ok(ic && ic.n === 1 && ic.size > 1000 && ic.found && dk && dk.name === "Cell Division" && dk.courseId === "c1", "the board opens in Picture Cards with its labels found, in a new Cell Division deck: " + JSON.stringify([ic, dk && {n: dk.name, c: dk.courseId}]));
      ok(ic && ic.red === 0, "picture cards use only what the student drew and wrote: the board's added picture is left out (" + (ic && ic.red) + " red pixels)");
      ok(/Left out 1 picture/.test(await page.textContent("#toastMsg").catch(() => "")), "it says the board's picture was left out");
      // A board with nothing but pictures can't become picture cards
      await page.evaluate(pic => { const S = window.__sbSync, nb = {id: "wb2", text: "Slide Photo", wb: {v: 1, tpl: "blank"}, courseId: "c1", created: 2, updated: 2, wbItems: [pic]}; S.applyChanges([{kind: "note", id: "wb2", after: nb}], null); window.__ic = null; SBWB.open("wb2"); }, PIC);
      await page.waitForSelector(".wb-stage .wb-frame"); await page.waitForTimeout(300);
      await page.click('#view [data-act="wb-ai"]'); await page.waitForSelector("dialog[open] #wbaGo");
      await page.check('input[name="wbaK"][value="pics"]'); await page.waitForTimeout(60);
      await page.click("#wbaGo"); await page.waitForTimeout(800);
      ok(await page.evaluate(() => window.__ic) === null && /made only from what you draw or write yourself/.test(await page.textContent("#wbaStatus")) && !Object.values(await page.evaluate(() => window.__sbSync.state.decks)).some(d => d.name === "Slide Photo"), "a board with only pictures on it is refused, and no deck is made");
      await page.keyboard.press("Escape"); await page.waitForTimeout(150);
      await page.evaluate(() => SBWB.open("wb1")); await page.waitForTimeout(300);
      await page.click('.nv-tabs [data-id="wb"]'); await page.waitForSelector(".wb-stage .wb-frame"); await page.waitForTimeout(300);
      await page.evaluate(() => SBWB.setTool("pen"));
      const fr = await page.evaluate(() => { const r = document.querySelector(".wb-frame").getBoundingClientRect(); return [r.left, r.top]; });
      for (const [x0, y0] of [[300, 300], [340, 300]]) { await page.mouse.move(fr[0] + x0, fr[1] + y0); await page.mouse.down(); for (let q = 1; q <= 6; q++) await page.mouse.move(fr[0] + x0 + q * 3, fr[1] + y0 + q * 8, {steps: 2}); await page.mouse.up(); await page.waitForTimeout(80); }
      const sids = await page.evaluate(() => SBWB.board().strokes.map(x => "s" + x.id));
      await page.evaluate(ids => { SBPRO.locked = () => true; SBWB.select(ids); }, sids); await page.waitForTimeout(80);
      ok(await page.locator('.wb-selbar [data-wb="ink-text"] .wb-pro').count() === 1 && await page.evaluate(() => { const a = document.querySelector('.wb-selbar [data-wb="ink-text"]'); return a.nextElementSibling && a.nextElementSibling.dataset.wb === "sel-copy"; }), "drawn lines get an A button (Pro) just before Duplicate");
      await page.evaluate(ids => { SBPRO.locked = () => false; SBWB.select([]); SBWB.select(ids); }, sids); await page.waitForTimeout(80);
      await page.click('.wb-selbar [data-wb="ink-text"]'); await page.waitForTimeout(1200);
      const b2 = await page.evaluate(() => SBWB.board());
      ok(ctx.ai.some(x => /You read handwriting/.test(x) && /image\/png/.test(x)) && b2.strokes.length === 0 && b2.items.some(i => i.k === "t" && i.s === "Mitosis"), "the AI reads the writing and it becomes typed text in its place");
      await page.evaluate(() => SBWB.undo()); await page.waitForTimeout(80);
      ok((await page.evaluate(() => SBWB.board())).strokes.length === sids.length, "Undo brings the handwriting back");
      await ctx.close();
    }
    {
      const {ctx, page} = await mk(false);
      await page.click('#view [data-act="wb-ai"]'); await page.waitForTimeout(400);
      ok(await page.locator("dialog[open] #wbaGo").count() === 0 && await page.locator("dialog[open]").count() === 1, "without AI set up, Notes and Cards opens AI setup instead");
      ok(!page.errs.length, "no page errors (no AI): " + page.errs.join(" | "));
      await ctx.close();
    }
    console.log(`whiteboard-ai.e2e: ${n} checks passed`);
  } finally { await browser.close(); server.close(); }
})().catch(e => { console.error(e); process.exit(1); });
