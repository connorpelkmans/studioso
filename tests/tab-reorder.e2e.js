// node tests/tab-reorder.e2e.js
// Whiteboards keep their place in the tabs (editing one doesn't move it), and whiteboard and note board tabs can be dragged into a new order
// (kept with the boards, so it syncs; Undo puts whiteboards back). My Notes stays first.
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
const SEED = {v: 2, courses: [{id: "c1", name: "Biology", code: "BIO 101", color: "#2E9A5A"}], tasks: [], decks: [], files: [], events: [], updated: 1,
  settings: {noteBoards: [{id: "b1", name: "Alpha"}, {id: "b2", name: "Beta"}, {id: "b3", name: "Gamma"}]},
  notes: [{id: "wb1", text: "One", wb: {v: 1, tpl: "blank"}, created: 1, updated: 1}, {id: "wb2", text: "Two", wb: {v: 1, tpl: "blank"}, created: 2, updated: 2}, {id: "wb3", text: "Three", wb: {v: 1, tpl: "blank"}, created: 3, updated: 3},
    {id: "n1", text: "A note", created: 1, x: 40, y: 40, z: 1}]};
(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  const ctx = await browser.newContext({viewport: {width: 1280, height: 900}});
  await ctx.routeWebSocket(/supabase\.co/, ws => ws.close()); await ctx.route(/supabase\.co|googleapis\.com/, r => r.abort());
  await ctx.addInitScript(seed => { try { if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("coursework:v2", JSON.stringify(seed)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studyboard:tour", "1"); } } catch (e) {} }, SEED);
  const page = await ctx.newPage(); page.errs = []; page.on("pageerror", e => page.errs.push(e.message));
  await page.goto(base); await page.waitForFunction(() => window.__sbProStudy && window.SBWB);
  await page.evaluate(() => { document.querySelectorAll("dialog[open]").forEach(d => d.close()); const T = window.__sbProStudy; T.ui.tab = "notes"; T.ui.notesView = "wb"; T.render(); });
  await page.waitForSelector('.wb-boards [data-sort-id="wb3"]');
  const wbTabs = () => page.$$eval(".wb-boards .nb-tab[data-sort-id]", x => x.map(e => e.dataset.sortId).join());
  ok(await wbTabs() === "wb1,wb2,wb3", "whiteboard tabs are in the order they were made");
  // editing one (newer updated time) doesn't move it
  await page.evaluate(() => { const T = window.__sbProStudy, n = T.state().notes.wb1; T.applyChanges([{kind: "note", id: "wb1", after: Object.assign({}, n, {updated: Date.now()})}], null); T.render(); });
  await page.waitForTimeout(200);
  ok(await wbTabs() === "wb1,wb2,wb3", "editing a whiteboard doesn't move its tab");
  // drag the third tab to the front
  const drag = async (from, to) => { await page.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close())); await page.waitForTimeout(150); const a = await page.locator(from).boundingBox(), b = await page.locator(to).boundingBox(); await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2); await page.mouse.down(); await page.mouse.move(a.x + a.width / 2 - 10, a.y + a.height / 2, {steps: 3}); await page.mouse.move(b.x + 6, b.y + b.height / 2, {steps: 8}); await page.mouse.up(); await page.waitForTimeout(400); };
  await drag('.wb-boards [data-sort-id="wb3"]', '.wb-boards [data-sort-id="wb1"]');
  ok(await wbTabs() === "wb3,wb1,wb2", "a whiteboard tab dragged to the front stays there: " + await wbTabs());
  const ords = await page.evaluate(() => ["wb1", "wb2", "wb3"].map(id => window.__sbProStudy.state().notes[id].wbOrd));
  ok(JSON.stringify(ords) === "[1,2,0]", "the order is kept with the boards (so it syncs): " + JSON.stringify(ords));
  await page.click("#toastUndo"); await page.waitForTimeout(300);
  ok(await wbTabs() === "wb1,wb2,wb3", "Undo puts them back");
  // note boards
  await page.evaluate(() => { const T = window.__sbProStudy; T.ui.notesView = "board"; T.render(); });
  await page.waitForSelector('.nb-boards [data-sort-id="b3"]');
  const nbTabs = () => page.$$eval(".nb-boards .nb-tab[data-act=nb-pick]", x => x.map(e => e.dataset.id || "my").join());
  ok(await nbTabs() === "my,b1,b2,b3", "note board tabs: My Notes, then the boards");
  await drag('.nb-boards [data-sort-id="b3"]', '.nb-boards [data-sort-id="b1"]');
  ok(await nbTabs() === "my,b3,b1,b2", "a note board tab dragged before another moves there (My Notes stays first): " + await nbTabs());
  ok(JSON.stringify(await page.evaluate(() => window.__sbProStudy.state().settings.noteBoards.map(b => b.id))) === '["b3","b1","b2"]', "and the order is saved");
  ok(await page.evaluate(() => (document.querySelector(".nb-boards .nb-tab.on") || {}).dataset.id || "") === "", "dragging doesn't open the board");
  ok(!page.errs.length, "no page errors: " + page.errs.join(" | "));
  await browser.close(); server.close();
  console.log(`tab-reorder.e2e: ${n} passed`);
})().catch(e => { console.error(e); process.exit(1); });
