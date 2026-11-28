// node tests/study-credits.e2e.js: Studyboard Credits (98-0study-credits.js), the gold coins earned by studying and spent on companion
// accessories in the Wardrobe (98-companion.js). Each kind of work earns by how hard it is, deleting old work never takes credits
// back, presentations count once per run, accessories unlocked by milestones are taken back, and buying puts the accessory on.
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
// 100 cards reviewed (100 credits), a passed 10-question quiz at 8/10 (8 + 5 = 13), a perfect 5/5 (5 + 5 + 5 = 15), a failed 1/5 (1, its one right answer)
const cards = Array.from({length: 10}, (_, i) => ({id: "k" + i, front: "Q" + i, back: "A" + i, box: 2, due: iso(today), seen: 10}));
// tasks: an exam (40) and an assignment (12) on one day, a reading (6) on another, one not done (0), 12 small "Other" tasks on one day
// (only 8 count: 32), and a step of a broken-down task (3)
const tasks = [
  {id: "t1", title: "Bio Exam", type: "Exam", status: "done", doneAt: at(3), due: iso(today)},
  {id: "t2", title: "Lab report", type: "Assignment", status: "done", doneAt: at(3), due: iso(today)},
  {id: "t3", title: "Chapter 4", type: "Reading", status: "done", doneAt: at(2), due: iso(today)},
  {id: "t4", title: "Essay", type: "Assignment", status: "todo", due: iso(today)},
  {id: "t5", title: "Outline", type: "Other", status: "done", doneAt: at(5), breakdownOf: "t4", due: iso(today)}
].concat(Array.from({length: 12}, (_, i) => ({id: "o" + i, title: "Little thing " + i, type: "Other", status: "done", doneAt: at(1), due: iso(today)})));
const SEED = {v: 2, updated: 1, tasks, files: [], notes: [], events: [], courses: [],
  settings: {capacity: 15, focusDays: {[iso(new Date(at(2)))]: 50, [iso(new Date(at(1)))]: 30, [iso(new Date(at(6)))]: 300}, comp: {earned: {scarf: Date.UTC(2026, 9, 1), glasses: 1, crown: Date.UTC(2026, 10, 27, 8), phoenix: Date.UTC(2026, 9, 1)}, wear: {"plain-mochi": ["scarf", "crown"]}}},
  decks: [{id: "d1", name: "Cells", created: 1, cards, quizzes: [{score: 8, total: 10, at: 1}, {score: 5, total: 5, at: 2}, {score: 1, total: 5, at: 3}], aiQuizzes: []}]};
// focus 80 min = 40, plus a 300-minute day counted as 180 (90); cards 100; quizzes 29; tasks 40 + 12 + 6 + 3 + 32 = 93. Total 352.
const WANT = {focus: 130, cards: 100, quiz: 29, task: 93};

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
    ok(Math.round(t.by.focus) === WANT.focus, "focus: 1 credit every 2 minutes, at most 3 hours a day (80 min + a 300-minute day = 40 + 90): " + t.by.focus);
    ok(Math.round(t.by.cards) === WANT.cards, "flashcards: 1 per card reviewed (100): " + t.by.cards);
    ok(t.by.quiz === WANT.quiz, "quizzes: right answers + 5 for passing + 5 for perfect; a fail still counts its right answers (29): " + t.by.quiz);
    ok(t.by.task === WANT.task, "tasks by size, at most 8 a day, a step 3, unfinished 0 (93): " + t.by.task);
    ok(t.earned === 352 && t.balance === 352 && t.spent === 0, "352 credits earned, all to spend: " + JSON.stringify(t));

    // 2. deleting old work never takes credits back (each kind keeps its highest total)
    await p.evaluate(() => { const S = window.__sbSync; S.applyChanges([{kind: "deck", id: "d1", after: null}], "Deleted deck"); });
    await p.waitForTimeout(300);
    ok(await p.evaluate(() => !window.__sbSync.state.decks.d1), "(the deck is gone)");
    const t2 = await p.evaluate(() => SBSC.totals());
    ok(t2.earned === 352, "after deleting the deck the credits stay: " + t2.earned);

    // 3. the Wardrobe: the balance, prices, an accessory earned before credits stays yours
    await p.evaluate(() => SBCOMP.open()); await p.waitForSelector(".cp-pickbody .cp-acc-tile");
    const w = await p.evaluate(() => { const b = document.querySelector(".cp-pickbody");
      const tile = id => b.querySelector(`.cp-acc-tile[data-acc="${id}"]`);
      return {pill: (b.querySelector(".scr-pill [data-scr-bal]") || {}).textContent, scarf: tile("scarf").textContent.replace(/\s+/g, " ").trim(), hat: tile("hat").textContent.replace(/\s+/g, " ").trim(),
        hatBuy: tile("hat").classList.contains("can-buy"), crownBuy: tile("crown").classList.contains("can-buy"), how: !!b.querySelector(".scr-how"), owned: SBCOMP.ownedNames()}; });
    ok(w.pill === "352", "the Wardrobe shows the balance: " + w.pill);
    ok(/Wear/.test(w.scarf) && w.owned.includes("Cozy Scarf") && w.owned.includes("Round Glasses"), "props earned before credits are still yours: " + w.scarf);
    ok(!w.owned.includes("Little Crown") && !w.owned.some(n => /Phoenix/.test(n)), "a prop unlocked by milestones after credits went in (the crown), or a newer prop (Phoenix Crest), is taken back: " + w.owned.join(", "));
    ok(await p.evaluate(() => { const S = window.__sbSync.state.settings, c = S.comp || {}, w = (c.wear || {})["plain-mochi"] || []; return !c.earned && w.join() === "scarf" && S.sc.own.scarf === 0 && S.sc.own.glasses === 0; }), "the kept ones are owned for good at no cost, the old record is cleared, and only the taken-back crown comes off");
    ok(/100/.test(w.hat) && /Common/.test(w.hat) && w.hatBuy && !w.crownBuy, "the hat is Common at 100 and affordable; the Legendary crown isn't: " + w.hat);
    ok(w.how, "How to Earn Credits lists each kind of work");

    // 4. short of credits: the buy sheet says how many more, with no Buy button
    await p.click('.cp-pickbody .cp-acc-tile[data-acc="crown"]'); await p.waitForSelector(".cp-buy");
    const short = await p.evaluate(() => ({txt: document.querySelector(".cp-buy").innerText, buy: !!document.querySelector('.cp-buy [data-act="comp-buy"]')}));
    ok(/648 more to earn/.test(short.txt) && !short.buy, "the crown (Legendary, 1,000) is 648 short, with no Buy button");
    await p.click('.cp-buy [data-act="comp-buy-back"]'); await p.waitForSelector(".cp-pickbody");
    ok(true, "Back returns to the companion picker");

    // 5. buying the hat: it's yours, it goes on, the balance drops
    await p.click('.cp-pickbody .cp-acc-tile[data-acc="hat"]'); await p.waitForSelector('.cp-buy [data-act="comp-buy"]');
    ok(/252 left after/.test(await p.textContent(".cp-buy")), "the buy sheet says what's left after (252)");
    await p.click('.cp-buy [data-act="comp-buy"]');
    // the new accessory is shown big in its burst of light first; closing that goes back to the picker it was bought from
    await p.waitForSelector(".cpu .cpu-name", {timeout: 5000}); ok((await p.textContent(".cpu .cpu-name")) === "Tiny Hat" && /Bought with 100 credits/.test(await p.textContent(".cpu")), "buying shows the hat in its burst of light, bought with 100 credits");
    await p.click(".cpu [data-cpu]"); await p.waitForSelector(".cp-pickbody"); await p.waitForTimeout(300);
    const bought = await p.evaluate(() => ({bal: SBSC.balance(), worn: SBCOMP.wornNames(), pill: document.querySelector(".cp-pickbody .scr-pill [data-scr-bal]").textContent, own: (window.__sbSync.state.settings.sc || {}).own}));
    ok(bought.bal === 252 && bought.pill === "252", "352 - 100 = 252 credits left: " + JSON.stringify(bought));
    ok(bought.worn.includes("Tiny Hat"), "the hat goes straight on");
    ok(bought.own && bought.own.hat === 100, "the purchase is kept in the synced settings");
    await p.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));

    // 6. the chat knows prices
    const info = await p.evaluate(() => SBCOMP.earnInfo("how do i get the little crown"));
    ok(/1,000 credits/.test(info) && /252 credits/.test(info), "asking how to get the crown gives its price and the balance: " + info);

    const closeReward = () => p.evaluate(() => { const b = document.querySelector(".scr-rw [data-scr=ok]"); if (b) b.click(); }).then(() => p.waitForTimeout(500));
    // 7. presentations: 3 a slide inside its time, +20 the whole talk on target, +30 the first time; 2 runs a day each, sections count their slides
    const run = (id, total, times, sec) => ({id, total, target: 100, times, budgets: [25000, 25000, 25000, 25000], sec: sec || null});
    const fireRun = r => p.evaluate(r => { const e0 = SBSC.earned(true); window.__sbFire("pr-finish", {id: "p1", name: "Enzymes Talk"}, r); return SBSC.earned(true) - e0; }, r);
    const r1 = await fireRun(run("r1", 140000, [25000, 50000, 40000, 25000]));
    await p.waitForSelector(".scr-rw .scr-lines li");
    const rs = await p.evaluate(() => ({lines: [...document.querySelectorAll(".scr-rw .scr-lines li")].map(li => li.innerText.replace(/\s+/g, " ")), kick: document.querySelector(".scr-rw .scr-kick").innerText}));
    ok(r1 === 6 && /4 slides, 2 on time/.test(rs.lines[0]), "a long run: 2 of 4 slides on time = 6 credits, shown line by line: " + r1 + " " + JSON.stringify(rs));
    await p.waitForFunction(() => document.querySelector(".scr-rw [data-n]").textContent === "6", null, {timeout: 4000}).then(() => ok(true, "the big number counts up to 6"), () => ok(false, "the big number counts up to 6"));
    await closeReward();
    const r2 = await fireRun(run("r2", 101000, [25000, 26000, 24000, 26000]));
    const ks = await p.evaluate(() => [...document.querySelectorAll(".scr-rw .scr-lines li")].map(li => li.innerText.replace(/\s+/g, " ")).join(" | "));
    ok(r2 === 12 + 20 + 30 && /Mastered/.test(ks), "all on time and on target the first time: 12 + 20 + 30: " + r2 + " " + ks);
    await closeReward();
    const r3 = await fireRun(run("r3", 100000, [25000, 25000, 25000, 25000]));
    await p.waitForTimeout(400);
    ok(r3 === 0 && !(await p.$(".scr-rw:not(.scr-out)")), "a third run today earns nothing, and shows no screen for 0 credits");
    await closeReward();

    // 8. a quiz: 1 per right answer, +5 passing, +5 perfect; 3 tries of the same quiz a day
    const q1 = await p.evaluate(() => { const e0 = SBSC.earned(true); SBSC.quizDone(10, 10, "qz"); return SBSC.earned(true) - e0; });
    ok(q1 === 20 && /Perfect Quiz/.test(await p.textContent(".scr-rw .scr-kick")), "a perfect 10-question quiz: 10 + 5 + 5 = 20, Perfect Quiz!");
    await closeReward();
    const q2 = await p.evaluate(() => { const e0 = SBSC.earned(true); SBSC.quizDone(4, 10, "qz"); return SBSC.earned(true) - e0; });
    ok(q2 === 4, "a failed try still counts its right answers (4)");
    await closeReward();
    const q3 = await p.evaluate(() => { const e0 = SBSC.earned(true); SBSC.quizDone(9, 10, "qz"); SBSC.quizDone(9, 10, "qz"); return SBSC.earned(true) - e0; });
    ok(q3 === 14, "the third try of the day counts (9 + 5), a fourth doesn't: " + q3);
    await closeReward(); await closeReward();

    // 9. a focus session: its own screen
    const f1 = await p.evaluate(() => { const e0 = SBSC.earned(true); window.__sbFire("focus", {type: "end", mode: "focus", minutes: 30}); return new Promise(r => setTimeout(() => r(SBSC.earned(true) - e0), 300)); });
    ok(f1 === 15 && /Focus Session Done/i.test(await p.textContent(".scr-rw:not(.scr-out) .scr-kick")) && /You focused for 30 minutes/.test(await p.textContent(".scr-rw:not(.scr-out) .scr-lines")), "30 minutes of focus: 15 credits, and the screen says how long you focused on the Focus Session Done screen: " + f1 + " | " + await p.evaluate(() => [...document.querySelectorAll(".scr-rw")].map(x => x.className + ": " + x.innerText.replace(/\s+/g, " ").slice(0, 140)).join(" || ")));
    await closeReward();

    // 9a2. a focus session stopped part way (Reset or Skip): the minutes it logged earn credits, with a small card that says so (the big screen is for a finished session)
    const f2 = await p.evaluate(() => { const e0 = SBSC.earned(true); window.__sbFire("focus", {type: "end", mode: "focus", minutes: 0}); const S = window.__sbSync; const fd = Object.assign({}, S.state.settings.focusDays); const d = Object.keys(fd).sort().pop() || ""; return e0; });
    await p.evaluate(() => { const S = window.__sbSync, d = new Date(), k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; S.state.settings = Object.assign({}, S.state.settings, {focusDays: Object.assign({}, S.state.settings.focusDays, {[k]: (Number((S.state.settings.focusDays || {})[k]) || 0) + 8})}); window.__sbFire("focus", {type: "early", mode: "focus", minutes: 8, why: "reset"}); });
    await p.waitForSelector(".scr-mini .scr-mini-k", {timeout: 4000}).catch(() => {});
    const fk = await p.evaluate(e0 => ({k: (document.querySelector(".scr-mini .scr-mini-k") || {}).textContent || "", big: !!document.querySelector(".scr-rw:not(.scr-out)"), n: SBSC.earned(true) - e0}), f2);
    ok(/Focus Time Counted/.test(fk.k) && !fk.big && fk.n === 4, "a focus session reset part way: its 8 minutes earn 4 credits, with a small card: " + JSON.stringify(fk));
    await closeReward();

    // 9b. a study session: each card once, whatever it was rated (Again brings a card back in the same session; that earns nothing more)
    const c4 = await p.evaluate(() => { const S = window.__sbSync, keep = S.ui.fc; S.ui.fc = {mode: "study"}; const e0 = SBSC.earned(true);
      ["again", "again", "good"].forEach(r => window.__sbFire("fc-rated", {rating: r, cardId: "y1"})); window.__sbFire("fc-rated", {rating: "easy", cardId: "y2"}); window.__sbFire("fc-rated", {rating: "hard", cardId: "y3"});
      const n = SBSC.earned(true) - e0; S.ui.fc = keep; return n; });
    ok(c4 === 3, "3 cards gone through (one rated Again twice and seen three times) earn 3, whatever the ratings: " + c4);

    // 9c. flashcards: 1 a card, at most 150 a day
    const c1 = await p.evaluate(() => { const e0 = SBSC.earned(true); for (let i = 0; i < 157; i++) window.__sbFire("fc-rated", {rating: "good"}); return SBSC.earned(true) - e0; });
    ok(c1 === 147, "157 more cards today (160 in all) earn only up to the daily limit of 150: " + c1);
    await p.waitForFunction(() => !document.querySelector(".scr-rw"), null, {timeout: 3000}).catch(() => {});
    await p.evaluate(() => SBSC.cardsDone(160));
    await p.waitForFunction(() => /Only 150 cards a day earn credits/.test((document.querySelector(".scr-rw:not(.scr-out)") || {}).textContent || ""), null, {timeout: 4000}).then(() => ok(true, "the session screen says the daily limit was reached"), () => ok(false, "the session screen says the daily limit was reached"));
    await closeReward();
    const c2 = await p.evaluate(() => { const S = window.__sbSync; return {cd: S.state.settings.sc.cd, base: S.state.settings.sc.cbase}; });
    ok(Object.values(c2.cd || {})[0] === 160 && c2.base === 100, "today's reviews are saved by day, and reviews from before are counted once: " + JSON.stringify(c2));

    // 9d. chests: found while studying, opened at the end (one by one), then a line each on the credits screen
    await p.evaluate(() => localStorage.setItem("studyboard:chest-test", "rare"));
    const found = await p.evaluate(() => { const c = SBSC.rollChest("quiz"); return c && {t: c.t, c: c.c}; });
    await p.evaluate(() => localStorage.removeItem("studyboard:chest-test"));
    ok(found && found.t === "rare" && found.c >= 20 && found.c <= 50, "a Rare chest holds 20 to 50 credits: " + JSON.stringify(found));
    await p.waitForSelector(".scr-found.show", {timeout: 3000}).then(() => ok(true, "finding it shows a small note"), () => ok(false, "finding it shows a small note"));
    ok(/Opens at the end/.test(await p.textContent(".scr-found")), "the first chest ever says it opens at the end");
    ok(await p.evaluate(() => SBSC.pendingChests().length === 1), "it waits, unopened, until the session ends");
    const e0 = await p.evaluate(() => SBSC.earned(true));
    await p.evaluate(() => SBSC.quizDone(4, 5, "chestqz"));
    await p.waitForSelector(".scr-ch .scr-go", {timeout: 4000});
    ok(/Rare Chest/.test(await p.textContent(".scr-ch h2")), "the quiz's end opens the chest first");
    await p.click(".scr-ch .scr-go"); await p.waitForTimeout(400); await p.click(".scr-ch .scr-go");
    await p.waitForSelector(".scr-rw:not(.scr-ch) .scr-l-chest", {timeout: 4000});
    const lines = await p.evaluate(() => [...document.querySelectorAll(".scr-rw:not(.scr-ch) .scr-lines li")].map(li => li.innerText.replace(/\s+/g, " ")).join(" | "));
    ok(new RegExp("Rare Chest.*\\+" + found.c).test(lines), "then the credits screen has a line for it: " + lines);
    ok(await p.evaluate(e0 => SBSC.earned(true) - e0, e0) === 4 + 5 + found.c && await p.evaluate(() => SBSC.pendingChests().length === 0), "and its credits are added once (4 right + 5 for passing + the chest)");
    await closeReward();
    await p.evaluate(() => localStorage.setItem("studyboard:chest-test", "common"));
    await p.evaluate(() => { document.querySelectorAll(".scr-found").forEach(x => x.remove()); SBSC.rollChest("cards"); });
    await p.evaluate(() => localStorage.removeItem("studyboard:chest-test"));
    ok(await p.evaluate(() => { const n = document.querySelector(".scr-found"); return !!n && /Common Chest found/.test(n.textContent) && !/Opens at the end/.test(n.textContent); }), "later chests just say what they are");
    await p.evaluate(() => SBSC.quizDone(1, 1, "chestqz2")); await p.waitForSelector(".scr-ch .scr-go", {timeout: 4000});
    await p.click(".scr-ch .scr-go"); await p.waitForTimeout(400); await p.click(".scr-ch .scr-go"); await p.waitForSelector(".scr-rw:not(.scr-ch)", {timeout: 4000}); await closeReward();

    // 9e. the prize wheel: a spin for a grade of 80% or more, once per task, at most 3 a week; grades already there don't count
    const ws = await p.evaluate(() => { const S = window.__sbSync;
      const mk = (id, got, type) => { const t = S.clone(S.state.tasks[id]); t.type = type || "Exam"; t.mark = {got, outOf: 100}; return {kind: "task", id, after: t}; };
      // grades already there the first time it looks earn nothing
      const keep = S.state.settings.sc.wg; S.state.settings.sc.wg = undefined; S.applyChanges([mk("t1", 95)], null); SBSC.checkGrades();
      const a = SBSC.spinQueue().length;
      S.applyChanges([mk("t2", 79)], null); SBSC.checkGrades();               // under 80: nothing
      S.applyChanges([mk("t4", 97, "Assignment")], null); SBSC.checkGrades(); // not an exam: nothing
      const b = SBSC.spinQueue().length;
      S.applyChanges([mk("t3", 86)], null); SBSC.checkGrades();               // a new good grade: a spin
      const c = SBSC.spinQueue().length;
      S.applyChanges([mk("t3", 90)], null); SBSC.checkGrades();               // the same task again: no second spin
      const d = SBSC.spinQueue().length;
      S.applyChanges([mk("o0", 88)], null); SBSC.checkGrades(); S.applyChanges([mk("o1", 91)], null); SBSC.checkGrades(); S.applyChanges([mk("o2", 99)], null); SBSC.checkGrades();
      const e = SBSC.spinQueue().length;                                      // the weekly limit: 3
      S.applyChanges(["o3", "o4", "o5", "o6"].map(id => mk(id, 90)), null); SBSC.checkGrades();
      return [a, b, c, d, e, SBSC.spinQueue().length, SBSC.spinsLeftThisWeek()]; });
    ok(ws.join() === "0,0,1,1,3,3,0", "spins: exams only, none for grades already there or under 80%, one per exam, at most 3 a week: " + ws.join());
    // spinning: the prize is the student's, and the queue goes down
    const e1 = await p.evaluate(() => SBSC.earned(true));
    await p.evaluate(() => SBSC.spinSoon()); await p.waitForSelector(".scr-wh .wh-go", {timeout: 6000});
    ok(/Great Exam Grade/i.test(await p.textContent(".scr-wh .scr-kick")) && (await p.locator(".wh-svg > path").count()) === 12 && (await p.locator(".wh-svg .wh-badge").count()) === 6, "a good exam grade opens the wheel: 12 prizes, the 6 accessories drawn on it");
    const odds = await p.evaluate(() => [...document.querySelectorAll(".wh-odds li b")].map(x => parseFloat(x.textContent)).reduce((a, b) => a + b, 0));
    ok(Math.round(odds) === 100, "the prize odds add up to 100%: " + odds);
    await p.click(".wh-go"); await p.waitForSelector(".scr-wh.wh-won", {timeout: 8000}); await p.waitForTimeout(300);
    const won = await p.evaluate(() => document.querySelector(".wh-result").innerText.replace(/\s+/g, " "));
    const gotC = await p.evaluate(e1 => SBSC.earned(true) - e1, e1);
    ok(/credits/.test(won) ? gotC > 0 && new RegExp("\\+" + gotC + " credits").test(won) : /yours to keep/.test(won), "the prize is the student's: " + won + " (credits added: " + gotC + ")");
    ok(await p.evaluate(() => SBSC.spinQueue().length) === 2, "and that spin is used");
    await p.click(".scr-wh .scr-acts [data-wh]"); await p.waitForTimeout(400);
    await p.evaluate(() => { window.__sbSync.state.settings.sc.wsq = []; });
    // 9g. credits already counted (here from another device, after the last count) are never shown again as earned now
    await p.evaluate(() => { const sc = window.__sbSync.state.settings.sc; sc.ev = Object.assign({}, sc.ev, {"chest:2000-01-01:synced": 7}); sc.chq = [{id: "lo1", t: "common", c: 10}]; SBSC.openLeftovers(); });
    await p.waitForSelector(".scr-ch .scr-go", {timeout: 6000});
    await p.click(".scr-ch .scr-go"); await p.waitForTimeout(400); await p.click(".scr-ch .scr-go");
    await p.waitForSelector(".scr-rw:not(.scr-ch) .scr-lines", {timeout: 6000}); await p.waitForTimeout(300);
    const lo = await p.evaluate(() => document.querySelector(".scr-rw:not(.scr-ch):not(.scr-out)").innerText.replace(/\s+/g, " "));
    ok(!/Other studying/.test(lo) && /\+10\b/.test(lo) && !/\+17\b/.test(lo), "credits already counted aren't shown again as earned: " + lo.slice(0, 160));
    await closeReward();

    // 9f. Pro: a free spin every week, on top of the exam spins; the Wardrobe says so to free students, with Get Pro
    const pr = await p.evaluate(() => { const out = [];
      SBSC.planTest({paywall: true, pro: false});
      const free = SBSC.proSpinHtml(); out.push(/Get Pro/.test(free) && /data-act="plan-open"/.test(free));
      SBSC.checkPro(); out.push(SBSC.spinQueue().length);                       // free: no spin
      SBSC.planTest({paywall: true, pro: true}); SBSC.checkPro(); out.push(SBSC.spinQueue().filter(x => x.pro).length);
      SBSC.checkPro(); out.push(SBSC.spinQueue().filter(x => x.pro).length);  // once a week
      out.push(SBSC.spinsLeftThisWeek());                                       // not counted against the exam limit (used up above)
      out.push(/Your free Pro spin/.test(SBSC.proSpinHtml()) && /wh-pro-spin/.test(SBSC.proSpinHtml()));
      SBSC.planTest(null); return out.join(); });
    ok(pr === "true,0,1,1,0,true", "Pro: one free spin a week, apart from the exam spins; free students see Get Pro: " + pr);
    await p.evaluate(() => { window.__sbSync.state.settings.sc.wsq = []; });
    // Pro: double the accessory chances on every spin, marked (x2) PRO; the coins share what's left
    await p.evaluate(() => { SBSC.planTest({paywall: true, pro: true}); window.__sbSync.state.settings.sc.wsq = [{id: "px", title: "Final Exam", pct: 91}]; SBSC.spinSoon(); });
    await p.waitForSelector(".scr-wh .wh-go", {timeout: 6000});
    const px = await p.evaluate(() => { const li = [...document.querySelectorAll(".wh-odds li")], pc = l => parseFloat(l.querySelector("b").textContent);
      const items = li.filter(l => l.querySelector(".cp-rar")); return {sum: Math.round(li.reduce((a, l) => a + pc(l), 0)), items: Math.round(items.reduce((a, l) => a + pc(l), 0)), x2: items.every(l => l.querySelector(".wh-x2")), line: !!document.querySelector(".wh-x2-line .pro-badge")}; });
    ok(px.sum === 100 && px.items === 56 && px.x2 && px.line, "Pro: accessories 56% (double), marked (x2) PRO, odds add up to 100: " + JSON.stringify(px));
    await p.click(".wh-go"); await p.waitForSelector(".scr-wh.wh-won", {timeout: 8000}); await p.waitForTimeout(300);
    await p.click(".scr-wh .scr-acts [data-wh]"); await p.waitForTimeout(400);
    await p.evaluate(() => { SBSC.planTest(null); window.__sbSync.state.settings.sc.wsq = []; });

    // 10. finishing a task: the small card with +12 (an assignment)
    await p.waitForTimeout(1500);
    const before = await p.evaluate(() => SBSC.earned(true));
    await p.evaluate(() => { const S = window.__sbSync, t = S.clone(S.state.tasks.t4); t.status = "done"; t.doneAt = Date.now(); S.applyChanges([{kind: "task", id: "t4", after: t}], "Done"); S.render(); });
    await p.waitForFunction(() => /\+12 Credits/.test((document.querySelector(".scr-mini") || {}).textContent || "") && /Essay/.test(document.querySelector(".scr-mini").textContent), null, {timeout: 8000}).then(() => ok(true, "finishing an assignment shows a card with +12 Credits and its name"), () => ok(false, "finishing an assignment shows a card with +12 Credits and its name"));
    ok(await p.evaluate(b => SBSC.earned(true) - b, before) === 12, "and adds 12");

    ok(!errs.length, "no page errors" + (errs.length ? ": " + errs.join(" | ") : ""));
  } finally { await b.close(); server.close(); }
  console.log(`\nstudy-credits: ${n - fails} of ${n} checks passed`);
  if (fails) process.exit(1);
})().catch(e => { console.error(e); process.exit(1); });
