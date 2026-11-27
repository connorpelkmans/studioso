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
// 100 cards reviewed (20 credits), a passed 10-question quiz at 8/10 (8 + 3 = 11), a perfect 5/5 (5 + 3 + 3 = 11), a failed 1/5 (1, its one right answer)
const cards = Array.from({length: 10}, (_, i) => ({id: "k" + i, front: "Q" + i, back: "A" + i, box: 2, due: iso(today), seen: 10}));
// tasks: an exam (30) and an assignment (10) on one day, a reading (5) on another, one not done (0), 12 small "Other" tasks on one day
// (only 8 count: 24), and a step of a broken-down task (2)
const tasks = [
  {id: "t1", title: "Bio Exam", type: "Exam", status: "done", doneAt: at(3), due: iso(today)},
  {id: "t2", title: "Lab report", type: "Assignment", status: "done", doneAt: at(3), due: iso(today)},
  {id: "t3", title: "Chapter 4", type: "Reading", status: "done", doneAt: at(2), due: iso(today)},
  {id: "t4", title: "Essay", type: "Assignment", status: "todo", due: iso(today)},
  {id: "t5", title: "Outline", type: "Other", status: "done", doneAt: at(5), breakdownOf: "t4", due: iso(today)}
].concat(Array.from({length: 12}, (_, i) => ({id: "o" + i, title: "Little thing " + i, type: "Other", status: "done", doneAt: at(1), due: iso(today)})));
const SEED = {v: 2, updated: 1, tasks, files: [], notes: [], events: [], courses: [],
  settings: {capacity: 15, focusDays: {[iso(new Date(at(2)))]: 50, [iso(new Date(at(1)))]: 30, [iso(new Date(at(6)))]: 300}, comp: {earned: {scarf: 1}}},
  decks: [{id: "d1", name: "Cells", created: 1, cards, quizzes: [{score: 8, total: 10, at: 1}, {score: 5, total: 5, at: 2}, {score: 1, total: 5, at: 3}], aiQuizzes: []}]};
// focus 80 min = 40, plus a 300-minute day counted as 180 (90); cards 100/5 = 20; quizzes 23; tasks 30 + 10 + 5 + 2 + 24 = 71. Total 244.
const WANT = {focus: 130, cards: 20, quiz: 23, task: 71};

(async () => {
  await new Promise(r => server.listen(0, "127.0.0.1", r));
  const port = server.address().port, b = await chromium.launch({executablePath});
  try {
    const ctx = await b.newContext({viewport: {width: 1100, height: 900}, serviceWorkers: "block"});
    await ctx.addInitScript(s => { window.__SB_TEST = true; localStorage.setItem("studyboard:rewards-test", "1"); localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "done"); localStorage.setItem("studioso:welcomed", "1");
      localStorage.setItem("studyboard:whatsNew", JSON.stringify({v: "9.9.9"}));
      if (!localStorage.getItem("coursework:v2")) localStorage.setItem("coursework:v2", JSON.stringify(s)); }, SEED);
    const p = await ctx.newPage(); const errs = []; p.on("pageerror", e => errs.push(e.message));
    await p.goto(`http://127.0.0.1:${port}/index.html`);
    await p.waitForFunction(() => window.__sbSync && window.SBSC && window.SBCOMP && SBCOMP.current(), null, {timeout: 30000});
    await p.waitForTimeout(3600); // the first quiet count
    await p.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));

    // 1. what each kind of work earned
    const t = await p.evaluate(() => SBSC.totals());
    ok(Math.round(t.by.focus) === WANT.focus, "focus: 1 credit per 2 minutes, at most 3 hours a day (80 min + a 300-minute day = 40 + 90): " + t.by.focus);
    ok(Math.round(t.by.cards) === WANT.cards, "flashcards: 1 per 5 reviews (100 = 20): " + t.by.cards);
    ok(t.by.quiz === WANT.quiz, "quizzes: right answers + 3 for passing + 3 for perfect; a fail still counts its right answers (23): " + t.by.quiz);
    ok(t.by.task === WANT.task, "tasks by size, at most 8 a day, a step 2, unfinished 0 (71): " + t.by.task);
    ok(t.earned === 244 && t.balance === 244 && t.spent === 0, "244 credits earned, all to spend: " + JSON.stringify(t));

    // 2. deleting old work never takes credits back (each kind keeps its highest total)
    await p.evaluate(() => { const S = window.__sbSync; S.applyChanges([{kind: "deck", id: "d1", after: null}], "Deleted deck"); });
    await p.waitForTimeout(300);
    ok(await p.evaluate(() => !window.__sbSync.state.decks.d1), "(the deck is gone)");
    const t2 = await p.evaluate(() => SBSC.totals());
    ok(t2.earned === 244, "after deleting the deck the credits stay: " + t2.earned);

    // 3. the Wardrobe: the balance, prices, an accessory earned before credits stays yours
    await p.evaluate(() => SBCOMP.open()); await p.waitForSelector(".cp-pickbody .cp-acc-tile");
    const w = await p.evaluate(() => { const b = document.querySelector(".cp-pickbody");
      const tile = id => b.querySelector(`.cp-acc-tile[data-acc="${id}"]`);
      return {pill: (b.querySelector(".scr-pill [data-scr-bal]") || {}).textContent, scarf: tile("scarf").textContent.replace(/\s+/g, " ").trim(), hat: tile("hat").textContent.replace(/\s+/g, " ").trim(),
        hatBuy: tile("hat").classList.contains("can-buy"), crownBuy: tile("crown").classList.contains("can-buy"), how: !!b.querySelector(".scr-how"), owned: SBCOMP.ownedNames()}; });
    ok(w.pill === "244", "the Wardrobe shows the balance: " + w.pill);
    ok(/Wear/.test(w.scarf) && w.owned.includes("Cozy Scarf"), "the scarf earned before credits is still yours: " + w.scarf);
    ok(/100/.test(w.hat) && /Common/.test(w.hat) && w.hatBuy && !w.crownBuy, "the hat is Common at 100 and affordable; the Legendary crown isn't: " + w.hat);
    ok(w.how, "How to Earn Credits lists each kind of work");

    // 4. short of credits: the buy sheet says how many more, with no Buy button
    await p.click('.cp-pickbody .cp-acc-tile[data-acc="crown"]'); await p.waitForSelector(".cp-buy");
    const short = await p.evaluate(() => ({txt: document.querySelector(".cp-buy").innerText, buy: !!document.querySelector('.cp-buy [data-act="comp-buy"]')}));
    ok(/756 more to earn/.test(short.txt) && !short.buy, "the crown (Legendary, 1,000) is 756 short, with no Buy button");
    await p.click('.cp-buy [data-act="comp-buy-back"]'); await p.waitForSelector(".cp-pickbody");
    ok(true, "Back returns to the companion picker");

    // 5. buying the hat: it's yours, it goes on, the balance drops
    await p.click('.cp-pickbody .cp-acc-tile[data-acc="hat"]'); await p.waitForSelector('.cp-buy [data-act="comp-buy"]');
    ok(/144 left after/.test(await p.textContent(".cp-buy")), "the buy sheet says what's left after (144)");
    await p.click('.cp-buy [data-act="comp-buy"]'); await p.waitForSelector(".cp-pickbody"); await p.waitForTimeout(300);
    const bought = await p.evaluate(() => ({bal: SBSC.balance(), worn: SBCOMP.wornNames(), pill: document.querySelector(".cp-pickbody .scr-pill [data-scr-bal]").textContent, own: (window.__sbSync.state.settings.sc || {}).own}));
    ok(bought.bal === 144 && bought.pill === "144", "244 - 100 = 144 credits left: " + JSON.stringify(bought));
    ok(bought.worn.includes("Tiny Hat"), "the hat goes straight on");
    ok(bought.own && bought.own.hat === 100, "the purchase is kept in the synced settings");
    await p.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));

    // 6. the chat knows prices
    const info = await p.evaluate(() => SBCOMP.earnInfo("how do i get the little crown"));
    ok(/1,000 credits/.test(info) && /144 credits/.test(info), "asking how to get the crown gives its price and the balance: " + info);

    const closeReward = () => p.evaluate(() => { const b = document.querySelector(".scr-rw [data-scr=ok]"); if (b) b.click(); }).then(() => p.waitForTimeout(500));
    // 7. presentations: 2 a slide inside its time, +15 the whole talk on target, +25 the first time; 2 runs a day each, sections count their slides
    const run = (id, total, times, sec) => ({id, total, target: 100, times, budgets: [25000, 25000, 25000, 25000], sec: sec || null});
    const fireRun = r => p.evaluate(r => { const e0 = SBSC.earned(true); window.__sbFire("pr-finish", {id: "p1", name: "Enzymes Talk"}, r); return SBSC.earned(true) - e0; }, r);
    const r1 = await fireRun(run("r1", 140000, [25000, 50000, 40000, 25000]));
    await p.waitForSelector(".scr-rw .scr-lines li");
    const rs = await p.evaluate(() => ({lines: [...document.querySelectorAll(".scr-rw .scr-lines li")].map(li => li.innerText.replace(/\s+/g, " ")), kick: document.querySelector(".scr-rw .scr-kick").innerText}));
    ok(r1 === 4 && /2 of 4 slides on time/.test(rs.lines[0]), "a long run: 2 of 4 slides on time = 4 credits, shown line by line: " + r1 + " " + JSON.stringify(rs));
    await p.waitForFunction(() => document.querySelector(".scr-rw [data-n]").textContent === "4", null, {timeout: 4000}).then(() => ok(true, "the big number counts up to 4"), () => ok(false, "the big number counts up to 4"));
    await closeReward();
    const r2 = await fireRun(run("r2", 101000, [25000, 26000, 24000, 26000]));
    const ks = await p.evaluate(() => [...document.querySelectorAll(".scr-rw .scr-lines li")].map(li => li.innerText.replace(/\s+/g, " ")).join(" | "));
    ok(r2 === 8 + 15 + 25 && /Mastered/.test(ks), "all on time and on target the first time: 8 + 15 + 25: " + r2 + " " + ks);
    await closeReward();
    const r3 = await fireRun(run("r3", 100000, [25000, 25000, 25000, 25000]));
    ok(r3 === 0 && /No credits this time/.test(await p.textContent(".scr-rw")), "a third run today earns nothing, and says why");
    await closeReward();

    // 8. a quiz: 1 per right answer, +3 passing, +3 perfect; 3 tries of the same quiz a day
    const q1 = await p.evaluate(() => { const e0 = SBSC.earned(true); SBSC.quizDone(10, 10, "qz"); return SBSC.earned(true) - e0; });
    ok(q1 === 16 && /Perfect Quiz/.test(await p.textContent(".scr-rw .scr-kick")), "a perfect 10-question quiz: 10 + 3 + 3 = 16, Perfect Quiz!");
    await closeReward();
    const q2 = await p.evaluate(() => { const e0 = SBSC.earned(true); SBSC.quizDone(4, 10, "qz"); return SBSC.earned(true) - e0; });
    ok(q2 === 4, "a failed try still counts its right answers (4)");
    await closeReward();
    const q3 = await p.evaluate(() => { const e0 = SBSC.earned(true); SBSC.quizDone(9, 10, "qz"); SBSC.quizDone(9, 10, "qz"); return SBSC.earned(true) - e0; });
    ok(q3 === 12, "the third try of the day counts (9 + 3), a fourth doesn't: " + q3);
    await closeReward(); await closeReward();

    // 9. a focus session: its own screen
    const f1 = await p.evaluate(() => { const e0 = SBSC.earned(true); window.__sbFire("focus", {type: "end", mode: "focus", minutes: 30}); return new Promise(r => setTimeout(() => r(SBSC.earned(true) - e0), 300)); });
    ok(f1 === 15 && /Focus Session Done/i.test(await p.textContent(".scr-rw .scr-kick")), "30 minutes of focus: 15 credits on the Focus Session Done screen: " + f1);
    await closeReward();

    // 10. finishing a task: the small card with +10 (an assignment)
    await p.waitForTimeout(1500);
    const before = await p.evaluate(() => SBSC.earned(true));
    await p.evaluate(() => { const S = window.__sbSync, t = S.clone(S.state.tasks.t4); t.status = "done"; t.doneAt = Date.now(); S.applyChanges([{kind: "task", id: "t4", after: t}], "Done"); S.render(); });
    await p.waitForFunction(() => /\+10 Credits/.test((document.querySelector(".scr-mini") || {}).textContent || "") && /Essay/.test(document.querySelector(".scr-mini").textContent), null, {timeout: 8000}).then(() => ok(true, "finishing an assignment shows a card with +10 Credits and its name"), () => ok(false, "finishing an assignment shows a card with +10 Credits and its name"));
    ok(await p.evaluate(b => SBSC.earned(true) - b, before) === 10, "and adds 10");

    ok(!errs.length, "no page errors" + (errs.length ? ": " + errs.join(" | ") : ""));
  } finally { await b.close(); server.close(); }
  console.log(`\nstudy-credits: ${n - fails} of ${n} checks passed`);
  if (fails) process.exit(1);
})().catch(e => { console.error(e); process.exit(1); });
