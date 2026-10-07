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
      const tile = await page.textContent(".deck");
      ok(!/due|new|quiz|practice/i.test(tile.replace(/Quiz|Archive|Study/g, "")), "a deck tile shows no due, new, last quiz or practice quiz text: " + tile.replace(/\s+/g, " "));
      ok(/\b2 cards\b/.test(tile), "it shows the number of cards");
      ok(await page.locator(".deck .mastery[aria-label$='prepared']").count() === 1, "and a Prepared bar");
      const pre = Number((await page.getAttribute(".deck .mastery", "aria-label")).match(/\d+/)[0]);
      ok(pre > 0 && pre < 60, "a deck with cards you keep missing is not ready: " + pre + "%");
      const ab = await page.locator(".deck .deck-actions button").evaluateAll(b => b.map(x => x.innerText.trim()));
      ok(ab.join() === "Study,Quiz,Archive", "Study, Quiz and Archive sit together at the bottom: " + ab.join());
      const r1 = await page.locator(".deck .deck-arch").boundingBox(), r0 = await page.locator(".deck .deck-actions [data-act=fc-quiz]").boundingBox();
      ok(r1.x > r0.x && Math.abs(r1.y - r0.y) < 8, "Archive is at the right end of that row");
      await page.screenshot({path: "/tmp/ux-decks-" + W + ".png"});
      await page.click(".deck .deck-arch"); await page.waitForTimeout(250);
      ok(await page.locator(".deck").count() === 0 && /Archived Decks/.test(await page.textContent(".deck-archived summary")), "Archive moves the deck to Archived Decks");
      await page.click(".deck-archived summary"); await page.click('[data-act="fc-unarchive"]'); await page.waitForTimeout(250);
      ok(await page.locator(".deck").count() === 1 && await page.locator(".deck-archived").count() === 0, "Restore brings it back");
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
      const fab = page.locator('#fab'); ok(await fab.count() === 1 && /Add Card/.test(await fab.textContent()), "a + Add Card button");
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
    // 4. default note: plain Square and yellow, even when an old theme switch had saved Graph Paper (and the last note was blue)
    for (const [style, want] of [[{skin: "arcade", note: "gridnote", noteAuto: false}, "classic"], [{skin: "arcade", note: "gridnote", noteAuto: false, notePicked: true}, "gridnote"], [{skin: "arcade", note: "gridnote", noteAuto: true}, "gridnote"]]) {
      const c2 = await browser.newContext({viewport: {width: 1280, height: 900}}), sd = SEED(); sd.notes[0].color = "blue"; sd.settings = {capacity: 15, dailyHours: 3, style};
      await c2.addInitScript(seed => { try { if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("coursework:v2", JSON.stringify(seed)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("studyboard:tour", "done"); } } catch (e) {} }, sd);
      const p2 = await c2.newPage(); await p2.goto(base); await p2.waitForSelector("#view", {state: "attached"}); await p2.waitForFunction(() => window.SBPINPICK);
      await p2.evaluate(() => { const T = window.SBPINPICK; Object.defineProperty(window, "state", {get: () => T.state(), configurable: true}); window.ui = T.ui; window.render = T.render; ui.tab = "notes"; render(); });
      await p2.waitForSelector(".note[data-note]");
      ok(await p2.locator(".note.ns-" + want).count() === 1, `saved ${style.note} (picked ${!!style.notePicked}, match theme ${!!style.noteAuto}) draws as ${want}`);
      if (want === "classic") {
        await p2.evaluate(() => { const b = document.createElement("button"); b.dataset.act = "note-new"; document.body.appendChild(b); b.click(); b.remove(); }); await p2.waitForTimeout(250);
        ok(await p2.evaluate(() => Object.values(state.notes).sort((a, b) => b.created - a.created)[0].color) === "yellow", "a new note is yellow even after a blue one");
      }
      await c2.close();
    }

    // 5. note boards are never renamed "Recovered Board"; 6. Photo to Note offers the camera on a phone; 7. Start a 45m Focus runs 45 minutes
    {
      const day = n => { const d = new Date(); d.setDate(d.getDate() + n); const z = x => String(x).padStart(2, "0"); return d.getFullYear() + "-" + z(d.getMonth() + 1) + "-" + z(d.getDate()); };
      const sd = SEED(); sd.settings = {capacity: 15, dailyHours: 3}; sd.notes[0].board = "b1"; sd.notes.push(Object.assign({}, sd.notes[0], {id: "n2", board: "b2"}));
      sd.tasks = [{id: "t1", title: "Write the lab report", courseId: "c1", type: "Assignment", status: "todo", due: day(1), start: day(0), hours: 4, priority: "high", created: 1}];
      const c3 = await browser.newContext({viewport: {width: 390, height: 844}, hasTouch: true, isMobile: true});
      await c3.addInitScript(seed => { try { if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("coursework:v2", JSON.stringify(seed)); localStorage.setItem("studyboard:noteBoardsBak", JSON.stringify([{id: "b1", name: "Biology Ideas"}])); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("studyboard:tour", "done"); } } catch (e) {} }, sd);
      const p3 = await c3.newPage(); await p3.goto(base); await p3.waitForSelector("#view", {state: "attached"}); await p3.waitForFunction(() => window.SBPINPICK);
      await p3.evaluate(() => { const T = window.SBPINPICK; Object.defineProperty(window, "state", {get: () => T.state(), configurable: true}); window.ui = T.ui; window.render = T.render; ui.tab = "notes"; render(); });
      await p3.waitForSelector(".note[data-note]");
      const names = await p3.evaluate(() => state.settings.noteBoards.map(b => b.name));
      ok(names.join() === "Biology Ideas", "a board known from this device's backup comes back under its real name, and an unknown one is not invented: " + names.join());
      ok(!/Recovered Board/.test(await p3.evaluate(() => document.body.innerText)), "nothing is called Recovered Board");
      await p3.evaluate(() => { const b = document.createElement("button"); b.dataset.act = "note-photo"; document.body.appendChild(b); b.click(); b.remove(); });
      await p3.waitForTimeout(400);
      const dlgTxt = await p3.evaluate(() => document.querySelector("dialog[open]") ? document.querySelector("dialog[open]").innerText : "");
      ok(/Take Photo/.test(dlgTxt) && /Choose Photos/.test(dlgTxt) || /key|AI|set up/i.test(dlgTxt), "Photo to Note offers Take Photo and Choose Photos on a phone (or asks for AI setup first)");
      if (/Take Photo/.test(dlgTxt)) ok(await p3.getAttribute("#pnCam", "capture") === "environment" && await p3.getAttribute("#pnFile", "capture") === null, "Take Photo opens the rear camera; Choose Photos does not force it");
      await p3.keyboard.press("Escape");
      await p3.evaluate(() => { ui.tab = "board"; ui.bview = "plan"; ui.focusOpen = true; render(); });
      const btn = p3.locator('.next-up [data-act="pomo-task"]');
      if (await btn.count()) {
        const want = await btn.getAttribute("data-mins"); await btn.click(); await p3.waitForTimeout(400);
        const shown = await p3.evaluate(() => (document.querySelector("#pomoDlg").innerText.match(/\b(\d{1,3}):\d\d\b/) || [])[1]);
        ok(Number(shown) === Number(want) || Number(shown) === Number(want) - 1, `Start a ${want}m Focus shows a ${want} minute timer (saw ${shown})`);
      }
      await c3.close();
    }
  } finally { await browser.close(); server.close(); }
  console.log(`\n${n} checks passed.`);
})().catch(e => { console.error(e); process.exit(1); });
