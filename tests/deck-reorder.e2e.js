// node tests/deck-reorder.e2e.js: drag (and Alt + Arrow) decks and quizzes into your own order on the Review tab
const {chromium, executablePath} = require("./pw");
const path = require("path"), fs = require("fs"), http = require("http");
const ROOT = path.join(__dirname, "..");
const MIME = {".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".webmanifest": "application/manifest+json", ".css": "text/css", ".png": "image/png", ".svg": "image/svg+xml", ".woff2": "font/woff2"};
const server = http.createServer((req, res) => {
  let f; try { f = path.join(ROOT, decodeURIComponent(new URL(req.url, "http://x").pathname)); } catch (e) { res.writeHead(400); res.end(); return; }
  if (!f.startsWith(ROOT + path.sep) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
let checks = 0; const ok = (c, m) => { checks++; if (!c) { console.log("FAIL:", m); process.exitCode = 1; } };
const card = id => ({id, front: "Front " + id, back: "Back " + id, box: 0, due: "", seen: 0, right: 0, wrong: 0});
const quiz = (id, title, created) => ({id, title, created, questions: [{id: id + "q", type: "single", stem: "Pick one", options: ["Yes", "No"], correct: [0]}], results: []});
const SEED = {v: 2, updated: 1, tasks: [], files: [], notes: [], events: [], settings: {},
  courses: [{id: "c1", name: "Biology", code: "BIO101", color: "#3B6FE0"}, {id: "c2", name: "History", code: "HIS200", color: "#C8352E"}],
  decks: [{id: "dA", name: "Deck A", courseId: "c1", created: 1, cards: [card("a1"), card("a2")], aiQuizzes: [quiz("q1", "Quiz One", 1), quiz("q2", "Quiz Two", 2)]},
    {id: "dB", name: "Deck B", courseId: "c1", created: 2, cards: [card("b1")], aiQuizzes: [quiz("q3", "Quiz Three", 3)]},
    {id: "dC", name: "Deck C", courseId: "c2", created: 3, cards: [card("c1")]}]};
const seed = s => {
  window.__SB_TEST = true;
  localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "done"); localStorage.setItem("studioso:welcomed", "1");
  if (!localStorage.getItem("coursework:v2")) localStorage.setItem("coursework:v2", JSON.stringify(s));
};
const show = (p, view, filter) => p.evaluate(([v, f]) => { const S = window.__sbSync; document.querySelectorAll("dialog[open]").forEach(d => d.close()); S.ui.tab = "flashcards"; S.ui.fc = null; S.ui.deckId = null; S.ui.qzOpen = null; S.ui.rvView = v; S.ui.filter = f || "all"; S.ui.q = ""; S.render(); }, [view, filter]);
const names = (p, sel) => p.evaluate(s => [...document.querySelectorAll(s)].map(e => e.textContent.trim()), sel);
const decks = p => names(p, ".deck-grid > .deck-fc .deck-name");
const quizzes = p => names(p, ".qz-grid > .qz-card .qz-title");
const stored = p => p.evaluate(() => JSON.parse(localStorage.getItem("coursework:v2")).decks);
// Mouse drag from the middle of one tile to a point on another
async function drag(p, from, to, side){
  const a = await p.locator(from).boundingBox(), b = await p.locator(to).boundingBox();
  const x0 = a.x + a.width / 2, y0 = a.y + a.height / 2, x1 = b.x + b.width * (side === "after" ? 0.8 : 0.2), y1 = b.y + b.height / 2;
  await p.mouse.move(x0, y0); await p.mouse.down();
  for (let i = 1; i <= 14; i++) { await p.mouse.move(x0 + (x1 - x0) * i / 14, y0 + (y1 - y0) * i / 14); await p.waitForTimeout(25); }
  await p.waitForTimeout(250);
  const lifted = await p.evaluate(() => !!document.querySelector(".rv-ghost") && !!document.querySelector(".rv-ph"));
  await p.mouse.up(); await p.waitForTimeout(400);
  return lifted;
}
async function open(ctx){
  const p = await ctx.newPage(); p.errs = []; p.on("pageerror", e => p.errs.push(e.message));
  await p.goto("http://127.0.0.1:" + server.address().port + "/index.html");
  await p.waitForFunction(() => window.__sbSync && document.readyState === "complete", null, {timeout: 20000});
  await p.waitForTimeout(400);
  return p;
}
(async () => {
  await new Promise(r => server.listen(0, "127.0.0.1", r));
  const browser = await chromium.launch({executablePath});
  const ctx = await browser.newContext({viewport: {width: 1280, height: 900}, serviceWorkers: "block", locale: "en-US"});
  await ctx.addInitScript(seed, SEED);
  let p = await open(ctx);
  await show(p, "cards");
  ok(JSON.stringify(await decks(p)) === JSON.stringify(["Deck A", "Deck B", "Deck C"]), "decks start oldest first: " + (await decks(p)).join(" | "));

  // Drag Deck A after Deck B
  const lifted = await drag(p, '[data-rv="dA"]', '[data-rv="dB"]', "after");
  ok(lifted, "a lifted tile and a gap show while dragging");
  ok(await p.evaluate(() => !document.querySelector(".rv-ghost, .rv-ph") && !window.__sbSync.ui.fc && !window.__sbSync.ui.deckId), "the drop cleans up and opens nothing");
  ok(JSON.stringify(await decks(p)) === JSON.stringify(["Deck B", "Deck A", "Deck C"]), "dragging Deck A after Deck B reorders: " + (await decks(p)).join(" | "));
  const st = await stored(p), ord = id => st.find(d => d.id === id).order;
  ok(ord("dB") < ord("dA") && ord("dA") < ord("dC"), "each deck saves a number order");
  await show(p, "cards");
  ok(JSON.stringify(await decks(p)) === JSON.stringify(["Deck B", "Deck A", "Deck C"]), "the order holds after a re-render");
  await p.close(); p = await open(ctx); await show(p, "cards");
  ok(JSON.stringify(await decks(p)) === JSON.stringify(["Deck B", "Deck A", "Deck C"]), "the order holds after a reload: " + (await decks(p)).join(" | "));

  // A click on Study still studies (a tiny wobble isn't a drag)
  const sb = await p.locator('[data-rv="dC"] [data-act="fc-study"]').boundingBox();
  await p.mouse.move(sb.x + sb.width / 2, sb.y + sb.height / 2); await p.mouse.down(); await p.mouse.move(sb.x + sb.width / 2 + 2, sb.y + sb.height / 2 + 1); await p.mouse.up();
  await p.waitForTimeout(300);
  ok(await p.evaluate(() => { const f = window.__sbSync.ui.fc; return !!f && f.mode === "study" && f.deckIds.join() === "dC"; }), "clicking Study opens studying that deck");
  ok(JSON.stringify((await stored(p)).map(d => d.order)) === JSON.stringify(st.map(d => d.order)), "a click doesn't change the order");

  // Keyboard, in a course filter: only the shown decks swap, Deck C keeps its place
  await show(p, "cards", "c1");
  ok(JSON.stringify(await decks(p)) === JSON.stringify(["Deck B", "Deck A"]), "the Biology filter shows its two decks");
  await p.focus('[data-rv="dA"] .rv-grip');
  ok(/Alt \+ Left or Right Arrow/.test(await p.getAttribute('[data-rv="dA"] .rv-grip', "aria-description")), "the grip tells you the keys");
  await p.keyboard.press("Alt+ArrowLeft"); await p.waitForTimeout(300);
  ok(JSON.stringify(await decks(p)) === JSON.stringify(["Deck A", "Deck B"]), "Alt + Left Arrow moves the deck back one place: " + (await decks(p)).join(" | "));
  ok(await p.evaluate(() => !!document.activeElement.closest('[data-rv="dA"]')), "focus stays on the moved deck");
  await show(p, "cards");
  ok(JSON.stringify(await decks(p)) === JSON.stringify(["Deck A", "Deck B", "Deck C"]), "the hidden deck keeps its place: " + (await decks(p)).join(" | "));
  await p.focus('[data-rv="dC"] [data-act="fc-open"]');
  await p.keyboard.press("Alt+ArrowLeft"); await p.waitForTimeout(300);
  ok(JSON.stringify(await decks(p)) === JSON.stringify(["Deck A", "Deck C", "Deck B"]), "Alt + Arrow works with the deck's own button focused too");

  // Quizzes
  await show(p, "quizzes");
  ok(JSON.stringify(await quizzes(p)) === JSON.stringify(["Quiz Three", "Quiz Two", "Quiz One"]), "quizzes start newest first");
  ok(await drag(p, '[data-rv="dA:q1"]', '[data-rv="dB:q3"]', "before"), "a quiz lifts while dragging");
  ok(JSON.stringify(await quizzes(p)) === JSON.stringify(["Quiz One", "Quiz Three", "Quiz Two"]), "dragging Quiz One before Quiz Three reorders: " + (await quizzes(p)).join(" | "));
  const qo = (await stored(p)).reduce((m, d) => { (d.aiQuizzes || []).forEach(q => { m[q.id] = q.order; }); return m; }, {});
  ok(qo.q1 < qo.q3 && qo.q3 < qo.q2, "each quiz saves its order with its deck");
  await p.close(); p = await open(ctx); await show(p, "quizzes");
  ok(JSON.stringify(await quizzes(p)) === JSON.stringify(["Quiz One", "Quiz Three", "Quiz Two"]), "the quiz order holds after a reload");
  await p.focus('[data-rv="dA:q2"] .rv-grip');
  await p.keyboard.press("Alt+ArrowLeft"); await p.waitForTimeout(300);
  ok(JSON.stringify(await quizzes(p)) === JSON.stringify(["Quiz One", "Quiz Two", "Quiz Three"]), "Alt + Left Arrow moves a quiz too");
  ok(!p.errs.length, "no page errors: " + p.errs.join(" | "));

  await browser.close(); server.close();
  console.log(`deck-reorder.e2e: ${checks} checks ${process.exitCode ? "FAILED" : "passed"}`);
})().catch(e => { console.error(e); process.exit(1); });
