// node tests/study-credits.e2e.js: Studyboard Credits (98-0study-credits.js), the gold coins earned by studying and spent on companion
// accessories in the Wardrobe (98-companion.js). Each kind of work earns by how hard it is, deleting old work never takes credits
// back, presentations count once per run, accessories earned before credits stay yours, and buying puts the accessory on.
const {chromium, executablePath} = require("./pw");
const path = require("path"), fs = require("fs"), http = require("http");
const ROOT = path.join(__dirname, "..");
const MIME = {".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".css": "text/css", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".png": "image/png", ".webp": "image/webp"};
const server = http.createServer((req, res) => {
  let f; try { f = path.join(ROOT, decodeURIComponent(new URL(req.url, "http://x").pathname)); } catch (e) { res.writeHead(400); res.end(); return; }
  if (!f.startsWith(ROOT + path.sep) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
let fails = 0, n = 0; const ok = (c, m) => { n++; console.log((c ? "ok   " : "FAIL ") + m); if (!c) fails++; };
const today = new Date(), iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const at = k => { const d = new Date(today); d.setDate(d.getDate() - k); d.setHours(12, 0, 0, 0); return d.getTime(); };
// 100 cards reviewed (20 credits), a passed 10-question quiz at 8/10 (8 + 3 = 11), a perfect 5/5 (5 + 3 + 3 = 11), a failed one (0)
const cards = Array.from({length: 10}, (_, i) => ({id: "k" + i, front: "Q" + i, back: "A" + i, box: 2, due: iso(today), seen: 10}));
// tasks: an exam (25) and an assignment (8) on one day, a reading (4) on another, one not done (0), 12 small "Other" tasks on one day
// (only 10 count: 30), and a step of a broken-down task (2)
const tasks = [
  {id: "t1", title: "Bio Exam", type: "Exam", status: "done", doneAt: at(3), due: iso(today)},
  {id: "t2", title: "Lab report", type: "Assignment", status: "done", doneAt: at(3), due: iso(today)},
  {id: "t3", title: "Chapter 4", type: "Reading", status: "done", doneAt: at(2), due: iso(today)},
  {id: "t4", title: "Essay", type: "Assignment", status: "todo", due: iso(today)},
  {id: "t5", title: "Outline", type: "Other", status: "done", doneAt: at(5), breakdownOf: "t4", due: iso(today)}
].concat(Array.from({length: 12}, (_, i) => ({id: "o" + i, title: "Little thing " + i, type: "Other", status: "done", doneAt: at(1), due: iso(today)})));
const SEED = {v: 2, updated: 1, tasks, files: [], notes: [], events: [], courses: [],
  settings: {capacity: 15, focusDays: {[iso(new Date(at(2)))]: 50, [iso(new Date(at(1)))]: 30}, comp: {earned: {scarf: 1}}},
  decks: [{id: "d1", name: "Cells", created: 1, cards, quizzes: [{score: 8, total: 10, at: 1}, {score: 5, total: 5, at: 2}, {score: 1, total: 5, at: 3}], aiQuizzes: []}]};
// focus 80 min = 40; cards 100/5 = 20; quizzes 22; tasks 25 + 8 + 4 + 2 + 30 = 69. Total 151.
const WANT = {focus: 40, cards: 20, quiz: 22, task: 69};

(async () => {
  await new Promise(r => server.listen(0, "127.0.0.1", r));
  const port = server.address().port, b = await chromium.launch({executablePath});
  try {
    const ctx = await b.newContext({viewport: {width: 1100, height: 900}, serviceWorkers: "block"});
    await ctx.addInitScript(s => { window.__SB_TEST = true; localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "done"); localStorage.setItem("studioso:welcomed", "1");
      localStorage.setItem("studyboard:whatsNew", JSON.stringify({v: "9.9.9"}));
      if (!localStorage.getItem("coursework:v2")) localStorage.setItem("coursework:v2", JSON.stringify(s)); }, SEED);
    const p = await ctx.newPage(); const errs = []; p.on("pageerror", e => errs.push(e.message));
    await p.goto(`http://127.0.0.1:${port}/index.html`);
    await p.waitForFunction(() => window.__sbSync && window.SBSC && window.SBCOMP && SBCOMP.current(), null, {timeout: 30000});
    await p.waitForTimeout(3600); // the first quiet count
    await p.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));

    // 1. what each kind of work earned
    const t = await p.evaluate(() => SBSC.totals());
    ok(Math.round(t.by.focus) === WANT.focus, "focus: 1 credit per 2 minutes (80 min = 40): " + t.by.focus);
    ok(Math.round(t.by.cards) === WANT.cards, "flashcards: 1 per 5 reviews (100 = 20): " + t.by.cards);
    ok(t.by.quiz === WANT.quiz, "quizzes: right answers + 3 for passing + 3 for perfect, nothing for a fail (22): " + t.by.quiz);
    ok(t.by.task === WANT.task, "tasks by size, at most 10 a day, a step 2, unfinished 0 (69): " + t.by.task);
    ok(t.earned === 151 && t.balance === 151 && t.spent === 0, "151 credits earned, all to spend: " + JSON.stringify(t));

    // 2. deleting old work never takes credits back (each kind keeps its highest total)
    await p.evaluate(() => { const S = window.__sbSync; S.applyChanges([{kind: "deck", id: "d1", after: null}], "Deleted deck"); });
    await p.waitForTimeout(300);
    ok(await p.evaluate(() => !window.__sbSync.state.decks.d1), "(the deck is gone)");
    const t2 = await p.evaluate(() => SBSC.totals());
    ok(t2.earned === 151, "after deleting the deck the credits stay: " + t2.earned);

    // 3. the Wardrobe: the balance, prices, an accessory earned before credits stays yours
    await p.evaluate(() => SBCOMP.open()); await p.waitForSelector(".cp-pickbody .cp-acc-tile");
    const w = await p.evaluate(() => { const b = document.querySelector(".cp-pickbody");
      const tile = id => b.querySelector(`.cp-acc-tile[data-acc="${id}"]`);
      return {pill: (b.querySelector(".scr-pill [data-scr-bal]") || {}).textContent, scarf: tile("scarf").textContent.replace(/\s+/g, " ").trim(), hat: tile("hat").textContent.replace(/\s+/g, " ").trim(),
        hatBuy: tile("hat").classList.contains("can-buy"), crownBuy: tile("crown").classList.contains("can-buy"), how: !!b.querySelector(".scr-how"), owned: SBCOMP.ownedNames()}; });
    ok(w.pill === "151", "the Wardrobe shows the balance: " + w.pill);
    ok(/Wear/.test(w.scarf) && w.owned.includes("Cozy Scarf"), "the scarf earned before credits is still yours: " + w.scarf);
    ok(/75/.test(w.hat) && w.hatBuy && !w.crownBuy, "the hat shows its price (75) and is affordable; the crown isn't: " + w.hat);
    ok(w.how, "How to Earn Credits lists each kind of work");

    // 4. short of credits: the buy sheet says how many more, with no Buy button
    await p.click('.cp-pickbody .cp-acc-tile[data-acc="crown"]'); await p.waitForSelector(".cp-buy");
    const short = await p.evaluate(() => ({txt: document.querySelector(".cp-buy").innerText, buy: !!document.querySelector('.cp-buy [data-act="comp-buy"]')}));
    ok(/849 more to earn/.test(short.txt) && !short.buy, "the crown (1,000) is 849 short, with no Buy button");
    await p.click('.cp-buy [data-act="comp-buy-back"]'); await p.waitForSelector(".cp-pickbody");
    ok(true, "Back returns to the companion picker");

    // 5. buying the hat: it's yours, it goes on, the balance drops
    await p.click('.cp-pickbody .cp-acc-tile[data-acc="hat"]'); await p.waitForSelector('.cp-buy [data-act="comp-buy"]');
    ok(/76 left after/.test(await p.textContent(".cp-buy")), "the buy sheet says what's left after (76)");
    await p.click('.cp-buy [data-act="comp-buy"]'); await p.waitForSelector(".cp-pickbody"); await p.waitForTimeout(300);
    const bought = await p.evaluate(() => ({bal: SBSC.balance(), worn: SBCOMP.wornNames(), pill: document.querySelector(".cp-pickbody .scr-pill [data-scr-bal]").textContent, own: (window.__sbSync.state.settings.sc || {}).own}));
    ok(bought.bal === 76 && bought.pill === "76", "151 - 75 = 76 credits left: " + JSON.stringify(bought));
    ok(bought.worn.includes("Tiny Hat"), "the hat goes straight on");
    ok(bought.own && bought.own.hat === 75, "the purchase is kept in the synced settings");
    await p.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));

    // 6. the chat knows prices
    const info = await p.evaluate(() => SBCOMP.earnInfo("how do i get the little crown"));
    ok(/1,000 credits/.test(info) && /76 credits/.test(info), "asking how to get the crown gives its price and the balance: " + info);

    // 7. presentations: 10 a run (2 a day each), +40 the first time a run lands on target
    const pr = await p.evaluate(() => {
      const fire = window.__sbFire, pres = {id: "p1"}, run = (id, total) => ({id, total, target: 300, times: [], sec: null});
      const e0 = SBSC.earned(true);
      fire("pr-finish", pres, run("r1", 200000)); const e1 = SBSC.earned(true);   // too fast: a run, not mastered
      fire("pr-finish", pres, run("r2", 305000)); const e2 = SBSC.earned(true);   // on target: a run + mastered
      fire("pr-finish", pres, run("r3", 300000)); const e3 = SBSC.earned(true);   // a third run today: nothing
      fire("pr-finish", pres, Object.assign(run("r4", 300000), {sec: [0, 2]})); const e4 = SBSC.earned(true); // one section: nothing
      return [e1 - e0, e2 - e1, e3 - e2, e4 - e3];
    });
    ok(pr.join() === "10,50,0,0", "presentation runs: 10, then 10 + 40 mastered, then nothing past 2 a day or for a section: " + pr.join());
    await p.waitForSelector(".scr-pop.show", {timeout: 3000});
    ok(/\+\d+ Credits/.test(await p.textContent(".scr-pop")), "earning shows a little +Credits pop");

    // 8. finishing a task pops +8 (an assignment)
    await p.waitForTimeout(3600);
    const before = await p.evaluate(() => SBSC.earned(true));
    await p.evaluate(() => { const S = window.__sbSync, t = S.clone(S.state.tasks.t4); t.status = "done"; t.doneAt = Date.now(); S.applyChanges([{kind: "task", id: "t4", after: t}], "Done"); S.render(); });
    await p.waitForFunction(() => /\+8 Credits/.test((document.querySelector(".scr-pop.show") || {}).textContent || ""), null, {timeout: 6000}).then(() => ok(true, "finishing an assignment pops +8 Credits"), () => ok(false, "finishing an assignment pops +8 Credits"));
    ok(await p.evaluate(b => SBSC.earned(true) - b, before) === 8, "and adds 8");

    ok(!errs.length, "no page errors" + (errs.length ? ": " + errs.join(" | ") : ""));
  } finally { await b.close(); server.close(); }
  console.log(`\nstudy-credits: ${n - fails} of ${n} checks passed`);
  if (fails) process.exit(1);
})().catch(e => { console.error(e); process.exit(1); });
