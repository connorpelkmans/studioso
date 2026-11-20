// node tests/rv-drag-more.e2e.js: concept map, presentation and Writing Studio cards drag into your own order, like decks and
// quizzes. A drag saves the order (it stays after a reload), Undo puts it back, and Concept Maps switch to My Order.
const {chromium, executablePath} = require("./pw");
const path = require("path"), fs = require("fs"), http = require("http");
const ROOT = path.join(__dirname, "..");
const MIME = {".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".css": "text/css", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".pdf": "application/pdf"};
const server = http.createServer((req, res) => {
  let f; try { f = path.join(ROOT, decodeURIComponent(new URL(req.url, "http://x").pathname)); } catch (e) { res.writeHead(400); res.end(); return; }
  if (!f.startsWith(ROOT + path.sep) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
let fails = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fails++; };
const day = k => { const d = new Date(); d.setDate(d.getDate() + k); return d.toISOString().slice(0, 10); };
const node = (id, t) => ({id, x: 0, y: 0, t});
const T = (id, title, due, o) => Object.assign({id, title, courseId: "c1", type: "Assignment", due, status: "todo", created: 1, checklist: [], dependsOn: [], history: []}, o || {});
const SEED = {v: 2, updated: 1, files: [], notes: [], events: [], decks: [], settings: {},
  courses: [{id: "c1", name: "Biology", code: "BIOS 230", color: "#C9702B", meetings: [], maps: [{id: "m1", name: "Alpha Map", auto: false, at: 3, created: 3, add: [{id: "a", t: "One"}]}, {id: "m2", name: "Beta Map", auto: false, at: 2, created: 2}, {id: "m3", name: "Gamma Map", auto: false, at: 1, created: 1}]}],
  tasks: [T("w1", "Essay One", day(5)), T("w2", "Essay Two", day(8)), T("w3", "Essay Three", day(12))]};

(async () => {
  await new Promise(r => server.listen(0, "127.0.0.1", r));
  const b = await chromium.launch({executablePath});
  const ctx = await b.newContext({viewport: {width: 1280, height: 900}, serviceWorkers: "block"});
  await ctx.addInitScript(s => { window.__SB_TEST = true; localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "done"); localStorage.setItem("studioso:welcomed", "1");
    if (!localStorage.getItem("coursework:v2")) localStorage.setItem("coursework:v2", JSON.stringify(s));
    new MutationObserver(() => document.querySelectorAll(".cpu,.cp").forEach(x => { try { x.hidePopover(); } catch (e) {} x.remove(); })).observe(document, {childList: true, subtree: true}); }, SEED);
  const p = await ctx.newPage(); const errs = []; p.on("pageerror", e => errs.push(e.message));
  const port = server.address().port;
  await p.goto(`http://127.0.0.1:${port}/index.html`);
  await p.waitForFunction(() => window.__sbSync && window.SBCMAP && window.SBRV, null, {timeout: 20000}); await p.waitForTimeout(500);
  const view = async (tab, sub) => { await p.evaluate(([tab, sub]) => { const S = window.__sbSync; S.ui.tab = tab; if (tab === "flashcards") S.ui.rvView = sub; else S.ui.courseTab = sub; S.render(); }, [tab, sub]); await p.waitForTimeout(500); };
  const order = sel => p.$$eval(sel, els => els.map(e => e.dataset.rv));
  // drag a card onto another's right half (a short pause so the gap moves, then drop)
  const drag = async (from, to) => {
    const a = await p.locator(from).boundingBox(), c = await p.locator(to).boundingBox();
    await p.mouse.move(a.x + a.width / 2, a.y + 40); await p.mouse.down();
    await p.mouse.move(a.x + a.width / 2 + 20, a.y + 50, {steps: 4});
    await p.mouse.move(c.x + c.width * 0.8, c.y + c.height / 2, {steps: 12}); await p.waitForTimeout(300);
    await p.mouse.move(c.x + c.width * 0.82, c.y + c.height / 2 + 2, {steps: 2}); await p.waitForTimeout(250);
    await p.mouse.up(); await p.waitForTimeout(500);
  };

  // Concept maps
  await view("flashcards", "maps");
  const m0 = await order(".cm-grid > .cm-mapcard");
  ok(m0.join() === "c1:m1,c1:m2,c1:m3", "maps start newest first: " + m0);
  await drag('.cm-mapcard[data-rv="c1:m1"]', '.cm-mapcard[data-rv="c1:m3"]');
  const m1 = await order(".cm-grid > .cm-mapcard");
  ok(m1.join() === "c1:m2,c1:m3,c1:m1", "dragging Alpha after Gamma moves it there: " + m1);
  ok(await p.evaluate(() => window.__sbSync.ui.cmSort === "mine"), "the sort switches to My Order");
  ok(/Moved Alpha Map to 3 of 3/.test(await p.textContent("#toast")), "it says what moved, with Undo: " + await p.textContent("#toast"));
  ok(await p.evaluate(() => !document.querySelector(".cm-mapcard[data-rv] + dialog[open]") && !document.querySelector("dialog[open]")), "a drag doesn't open the map");

  // Presentations (two, made from the fixture deck)
  for (const nm of ["First Talk", "Second Talk"]) {
    await p.evaluate(() => window.SBPRESENT.add("")); await p.waitForSelector("#prFile", {state: "attached"});
    await p.setInputFiles("#prFile", path.join(__dirname, "fixtures/present-deck.pdf")); await p.waitForSelector(".pr-picked", {timeout: 20000});
    await p.fill("#prName", nm); await p.click('[data-act="pr-create"]'); await p.waitForSelector("#prStage .pr-play", {timeout: 15000});
    await p.keyboard.press("Escape"); await p.waitForSelector("#prStage", {state: "detached", timeout: 5000}).catch(() => {});
    await p.waitForTimeout(400);
  }
  await view("flashcards", "present"); await p.waitForTimeout(400);
  const p0 = await order(".pr-grid > .rv-pres");
  ok(p0.length === 2, "two presentation cards: " + p0.length);
  if (p0.length === 2) {
    await drag(`.rv-pres[data-rv="${p0[0]}"]`, `.rv-pres[data-rv="${p0[1]}"]`);
    const p1 = await order(".pr-grid > .rv-pres");
    ok(p1.join() === [p0[1], p0[0]].join(), "presentations swap places: " + p1 + " / toast: " + await p.textContent("#toast") + " / " + JSON.stringify(await p.evaluate(() => (window.__sbSync.state.settings.rvOrder || {}))));
  }

  // Writing Studio
  await view("courses", "writing");
  const w0 = await order('[data-rv-kind="writing"] > .wsr-card');
  ok(w0.length === 3, "three paper cards: " + w0);
  await drag('.wsr-card[data-rv="w1"]', '.wsr-card[data-rv="w3"]');
  const w1 = await order('[data-rv-kind="writing"] > .wsr-card');
  ok(w1.join() === "w2,w3,w1", "Essay One moves after Essay Three: " + w1);
  // Undo puts it back
  ok(/Moved Essay One to 3 of 3/.test(await p.textContent("#toast")), "the move is said, with Undo");
  await p.evaluate(() => { const b = [...document.querySelectorAll("#toast button")].find(x => /Undo/.test(x.textContent)); if (b) b.click(); }); await p.waitForTimeout(500);
  ok((await order('[data-rv-kind="writing"] > .wsr-card')).join() === w0.join(), "Undo puts the papers back");

  // The orders are kept (settings) after a reload
  await p.reload(); await p.waitForFunction(() => window.__sbSync && window.SBCMAP, null, {timeout: 20000}); await p.waitForTimeout(600);
  await view("flashcards", "maps");
  ok((await order(".cm-grid > .cm-mapcard")).join() === "c1:m2,c1:m3,c1:m1", "the maps' order stays after a reload");
  ok(!errs.length, "no page errors: " + errs.join(" | "));
  await b.close(); server.close();
  console.log(fails ? `rv-drag-more.e2e: ${fails} FAILED` : "rv-drag-more.e2e: all passed");
  process.exitCode = fails ? 1 : 0;
})().catch(e => { console.error(e); process.exit(1); });
