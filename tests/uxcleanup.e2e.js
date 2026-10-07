// node tests/uxcleanup.e2e.js  (Playwright + Chromium)
// Square default note, notes trash opens Recently Deleted, one Review button, + Add Card on a deck, fewer course-page buttons.
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium} = require("/opt/node-tools/node_modules/playwright");
const root = path.join(__dirname, "..");
const MIME = {".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".webmanifest": "application/manifest+json", ".png": "image/png", ".css": "text/css", ".svg": "image/svg+xml"};
const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x"); let p = decodeURIComponent(u.pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  res.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
const today = new Date().toISOString().slice(0, 10);
const SEED = () => ({v: 2, courses: [{id: "c1", name: "Biology", code: "BIO1", color: "#3B6FE0"}], settings: {capacity: 15, dailyHours: 3, style: {skin: "sakura"}}, updated: 1, tasks: [],
  decks: [{id: "d1", name: "Cells", courseId: "c1", created: 1, cards: [
    {id: "k1", front: "Mitochondria", back: "Powerhouse", box: 1, due: today, seen: 2, right: 0, wrong: 2},
    {id: "k2", front: "Nucleus", back: "Holds DNA", box: 3, due: "", seen: 0, right: 0, wrong: 0}]}],
  notes: [{id: "n1", text: "Quiz on Friday", color: "yellow", x: 40, y: 40, z: 1, rot: 0, courseId: "", archived: false, shape: "", pin: "", stickers: [], created: 1}]});
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch();
  try {
    for (const W of [1280, 390]) {
      console.log("\n=== width", W);
      const ctx = await browser.newContext({viewport: {width: W, height: W === 390 ? 780 : 900}});
      await ctx.addInitScript(seed => { try { if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("coursework:v2", JSON.stringify(seed)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("studyboard:tour", "done"); } } catch (e) {} }, SEED());
      const page = await ctx.newPage(); const errs = []; page.on("pageerror", e => errs.push(e.message));
      await page.goto(base); await page.waitForSelector("#view", {state: "attached"});
      await page.waitForFunction(() => window.SBPINPICK);
      await page.evaluate(() => { const T = window.SBPINPICK; Object.defineProperty(window, "state", {get: () => T.state(), configurable: true}); window.ui = T.ui; window.render = T.render; });
      // 1. notes
      await page.evaluate(() => { ui.tab = "notes"; render(); });
      await page.waitForSelector(".note[data-note]");
      ok(await page.evaluate(() => document.documentElement.dataset.skin) === "sakura", "the Sakura theme (whose own note shape is scalloped) is on");
      ok(await page.locator(".note.ns-classic").count() === 1 && await page.locator(".note.ns-scallop").count() === 0, "the note is drawn square");
      ok(await page.locator('.tl-controls [data-act="note-archive-open"]').count() === 0, "no Archive button in the top row");
      ok(await page.locator('.tl-controls [data-act="trash-open"]').count() === 0, "no Recently Deleted button in the top row");
      await page.locator('.nb-target.trash').click(); await page.waitForSelector("#dlg[open] #trQ");
      ok(/Recently Deleted/.test(await page.textContent("#dlg .sheet-head")), "the trash can opens Recently Deleted");
      await page.keyboard.press("Escape");
      // 2. flashcards
      await page.evaluate(() => { ui.tab = "flashcards"; ui.deckId = null; render(); });
      await page.waitForSelector(".view-head");
      ok(await page.locator('[data-act="fc-review-menu"]').count() === 1, "one Review button");
      ok(await page.locator('.view-head [data-act="fc-review-all"], .view-head [data-act="fc-weak"]').count() === 0, "Review Due and Weak Spots are not separate buttons");
      await page.click('[data-act="fc-review-menu"]'); await page.waitForSelector('#dlg[open] [data-act="fc-weak"]');
      ok(await page.locator('#dlg [data-act="fc-review-all"]:not([disabled])').count() === 1 && await page.locator('#dlg [data-act="fc-weak"]:not([disabled])').count() === 1, "Review offers flashcards due and weak spots");
      await page.click('#dlg [data-act="fc-weak"]'); await page.waitForSelector("#dlg .sheet-head");
      ok(/Weak Spots/.test(await page.textContent("#dlg .sheet-head")), "Weak Spots opens its practice sheet");
      await page.keyboard.press("Escape");
      await page.click('[data-act="fc-review-menu"]'); await page.click('#dlg [data-act="fc-review-all"]');
      await page.waitForFunction(() => !document.querySelector("#dlg").open);
      ok(await page.evaluate(() => !!ui.fc), "Flashcards Due starts a study session");
      await page.evaluate(() => { ui.fc = null; ui.tab = "flashcards"; ui.deckId = "d1"; render(); });
      await page.waitForSelector(".deck-head");
      ok(await page.locator("#view #fcAdd").count() === 0, "no add-card form at the top of a deck");
      const fab = page.locator('.fc-fab'); ok(await fab.count() === 1 && /Add Card/.test(await fab.textContent()), "a + Add Card button");
      const bb = await fab.boundingBox(), vp = page.viewportSize();
      ok(bb.x + bb.width > vp.width * 0.6 && bb.y + bb.height > vp.height * 0.6, "it sits at the bottom right");
      await fab.click(); await page.waitForSelector("#dlg[open] #fcFront");
      await page.fill("#fcFront", "Ribosome"); await page.fill("#fcBack", "Makes protein"); await page.click('#dlg button[type="submit"]');
      await page.waitForFunction(() => state.decks.d1.cards.length === 3);
      await page.waitForFunction(() => { const f = document.querySelector("#fcFront"); return f && f.value === ""; }).then(() => ok(true, "the sheet clears for the next card"), () => ok(false, "the sheet clears for the next card"));
      await page.fill("#fcFront", "Golgi"); await page.fill("#fcBack", "Packages proteins"); await page.keyboard.press("Control+Enter");
      await page.waitForFunction(() => state.decks.d1.cards.length === 4);
      ok(true, "Ctrl + Enter adds another card");
      await page.click('#dlg [data-act="close"]');
      // 3. course page
      await page.evaluate(() => { ui.tab = "courses"; ui.courseId = "c1"; render(); });
      await page.waitForSelector(".detail-head");
      const top = await page.evaluate(() => [...document.querySelectorAll(".row-actions")].find(r => r.querySelector('[data-act="new-task"]')).querySelectorAll("button").length);
      ok(top <= 4, "course page shows " + top + " buttons, not 7");
      ok(await page.locator('.row-actions [data-act="import-syllabus"], .row-actions [data-act="bd-new-course"], .row-actions [data-act="edit-course"]').count() === 0, "rare actions moved out of the row");
      await page.click('[data-act="course-more"]'); await page.waitForSelector('#dlg[open] [data-act="edit-course"]');
      ok(await page.locator('#dlg [data-act="import-syllabus"]').count() === 1 && await page.locator('#dlg [data-act="bd-new-course"]').count() === 1, "More lists Import Syllabus and Break Down an Assignment");
      await page.click('#dlg [data-act="edit-course"]'); await page.waitForSelector("#dlg .sheet-head");
      ok(/Edit Course/.test(await page.textContent("#dlg .sheet-head")), "Edit Course opens from More");
      ok(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1), "no sideways scroll");
      ok(errs.length === 0, "no page errors " + errs.join(";"));
      await ctx.close();
    }
  } finally { await browser.close(); server.close(); }
  console.log(`\n${n} checks passed.`);
})().catch(e => { console.error(e); process.exit(1); });
