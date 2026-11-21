// node tests/study-rewards.e2e.js: 01-study-rewards.js in the real app. Mochi's Hint (letters without AI, a nudge with AI that
// never gives the answer away), why a card is back, the "in a row" chip, the daily goal and its sheet, the end of a session
// (known ring, newly mastered, best run, goal, Mochi's next accessory), and AI quiz questions missed becoming cards, with Undo.
// No hearts, lockouts or anything bought anywhere.
const {chromium, executablePath} = require("./pw");
const path = require("path"), fs = require("fs"), http = require("http");
const ROOT = path.join(__dirname, ".."), SHOTS = path.join(ROOT, "tests-out");
const MIME = {".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".css": "text/css", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".png": "image/png", ".webp": "image/webp"};
const server = http.createServer((req, res) => {
  let f; try { f = path.join(ROOT, decodeURIComponent(new URL(req.url, "http://x").pathname)); } catch (e) { res.writeHead(400); res.end(); return; }
  if (!f.startsWith(ROOT + path.sep) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
let fails = 0, n = 0; const ok = (c, m) => { n++; console.log((c ? "ok   " : "FAIL ") + m); if (!c) fails++; };
const today = new Date(), iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const ago = k => { const d = new Date(today); d.setDate(d.getDate() - k); return iso(d); };
const CARDS = [
  ["What organelle makes most of the cell's ATP?", "Mitochondria"], ["What does ATP synthase use to make ATP?", "The proton gradient"],
  ["Where does glycolysis happen?", "The cytoplasm"], ["Net ATP from glycolysis?", "Two ATP"], ["What carries electrons to the chain?", "NADH and FADH2"],
  ["Final electron acceptor in respiration?", "Oxygen"]].map(([front, back], i) => ({id: "k" + i, front, back, box: i === 1 ? 1 : 3, due: ago(0), seen: i === 0 ? 0 : 3, right: 2, wrong: i === 1 ? 2 : 0, last: i === 1 ? ago(1) : ago(4), rate: i === 1 ? "again" : "good"}));
const QUIZ = {id: "qz1", title: "Cell Respiration Quiz", created: 1, questions: [
  {id: "q1", type: "single", stem: "Which structure is the site of the electron transport chain?", options: ["Outer membrane", "Inner membrane", "Matrix", "Cytoplasm"], correct: [1], rationale: "The cristae hold the carriers.", notes: ["", "", "", ""], topic: "ETC"},
  {id: "q2", type: "single", stem: "Net ATP from glycolysis?", options: ["1", "2", "4", "36"], correct: [1], rationale: "4 made, 2 used.", notes: ["", "", "", ""], topic: "Glycolysis"},
  {id: "q3", type: "single", stem: "Final electron acceptor?", options: ["Oxygen", "Water", "NAD+", "Glucose"], correct: [0], rationale: "Oxygen takes the electrons.", notes: ["", "", "", ""], topic: "ETC"}]};
const SEED = {v: 2, updated: 1, tasks: [{id: "t1", title: "Bio Exam", courseId: "c1", type: "Exam", due: iso(new Date(today.getTime() + 3 * 864e5)), status: "todo"}], files: [], notes: [], events: [],
  courses: [{id: "c1", name: "Biology", code: "BIO 110", color: "#3B6FE0"}], settings: {},
  decks: [{id: "d1", name: "Cell Biology", courseId: "c1", created: 1, cards: CARDS, quizzes: [], aiQuizzes: [QUIZ]}]};

(async () => {
  await new Promise(r => server.listen(0, "127.0.0.1", r));
  const port = server.address().port, b = await chromium.launch({executablePath});
  const boot = async (w, opts = {}) => {
    const ctx = await b.newContext({viewport: {width: w, height: w < 600 ? 844 : 900}, serviceWorkers: "block"});
    if (opts.ai) await ctx.route(/generativelanguage\.googleapis\.com/, route => route.fulfill({status: 200, contentType: "application/json",
      body: JSON.stringify({candidates: [{content: {parts: [{text: JSON.stringify(opts.ai)}]}, finishReason: "STOP"}]})}));
    await ctx.addInitScript(([s, ai]) => { window.__SB_TEST = true; localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "done"); localStorage.setItem("studioso:welcomed", "1");
      localStorage.setItem("studyboard:whatsNew", JSON.stringify({v: "1.15.8"}));
      if (!localStorage.getItem("coursework:v2")) localStorage.setItem("coursework:v2", JSON.stringify(s));
      if (ai) { localStorage.setItem("studyboard:aiKeys", JSON.stringify({gemini: "AIzaTESTTESTTESTTESTTESTTEST12345"})); localStorage.setItem("studyboard:aiConsent", JSON.stringify({gemini: {v: 1, at: 1}})); } }, [SEED, !!opts.ai]);
    const p = await ctx.newPage(); p.errs = []; p.on("pageerror", e => p.errs.push(e.message));
    await p.goto(`http://127.0.0.1:${port}/index.html`); await p.waitForFunction(() => window.__sbSync && window.__sbRewards, null, {timeout: 20000}); await p.waitForTimeout(400);
    return {ctx, p};
  };
  const act = (p, a, ds) => p.evaluate(([a, ds]) => { const x = document.createElement("button"); x.dataset.act = a; Object.assign(x.dataset, ds || {}); document.body.appendChild(x); x.click(); x.remove(); }, [a, ds]);
  const text = (p, s) => p.evaluate(s => (document.querySelector(s) || {}).innerText || "", s);

  for (const w of [1100, 390]) {
    const tag = w + "px: ", {ctx, p} = await boot(w);
    await p.evaluate(() => { const S = window.__sbSync; S.ui.tab = "flashcards"; S.ui.rvView = ""; S.render(); });
    await p.waitForSelector(".rv-hero .goal-btn");
    ok(/0 \/ 20/.test(await text(p, ".goal-btn")), tag + "the review card shows the daily goal ring: " + (await text(p, ".goal-btn")).replace(/\s+/g, " "));
    if (w < 600) await p.screenshot({path: path.join(SHOTS, "rewards-hero-phone.png")});
    // the goal sheet
    await p.click(".goal-btn"); await p.waitForSelector("dialog[open] .goal-opt");
    ok((await p.$$eval("dialog[open] .goal-opt", e => e.map(x => x.innerText.replace(/\s+/g, " ")))).join("|").match(/Tiny.*5\|Steady.*20\|Strong.*50\|Exam Week.*100/), tag + "the goal sheet offers Tiny 5, Steady 20, Strong 50, Exam Week 100");
    await p.click('dialog[open] .goal-opt[data-id="tiny"]'); await p.waitForTimeout(200);
    ok(/0 \/ 5/.test(await text(p, ".goal-btn")), tag + "picking Tiny sets the goal to 5");
    // studying
    await p.click('[data-act="fc-review-start"]'); await p.waitForSelector(".flip");
    const first = await p.evaluate(() => { const S = window.__sbSync, it = S.ui.fc.q[S.ui.fc.i]; return it.cardId; });
    const chips = await text(p, ".fc-chips");
    ok(first === "k0" ? /New card/.test(chips) : first === "k1" ? /You missed this yesterday/.test(chips) : true, tag + "the card says why it's here: " + chips.replace(/\s+/g, " "));
    ok(await p.locator('[data-act="fc-hint"]').count() === 1 && !(await p.$(".rate-btn")), tag + "Mochi's Hint is there before the answer, the rating buttons aren't yet");
    await p.click('[data-act="fc-hint"]'); await p.waitForSelector(".fc-bubble");
    const hint = await text(p, ".fc-bubble"), back = await p.evaluate(() => { const S = window.__sbSync, it = S.ui.fc.q[S.ui.fc.i]; return S.state.decks.d1.cards.find(c => c.id === it.cardId).back; });
    ok(/Starts like: \S/.test(hint) && !hint.includes(back), tag + "without AI the hint is first letters, never the answer: " + hint);
    if (w < 600) await p.screenshot({path: path.join(SHOTS, "rewards-hint-phone.png")}); else await p.screenshot({path: path.join(SHOTS, "rewards-hint-desk.png")});
    await p.click('[data-act="fc-flip"]'); await p.waitForSelector(".rate-btn");
    ok(await p.locator(".fc-buddy-after").count() === 1 && /Explain This/.test(await text(p, ".fc-buddy-after")), tag + "after the answer, Explain sits before the rating buttons");
    // rate every card Good: the run chip, then the end of the session
    let sawRun = false;
    for (let k = 0; k < 12; k++) {
      if (!(await p.$(".flip"))) break;
      if (!(await p.$(".rate-btn"))) await p.click('[data-act="fc-flip"]');
      await p.click('.rate-btn.good'); await p.waitForTimeout(60);
      if (/in a row/.test(await text(p, ".fc-chips"))) sawRun = true;
    }
    ok(sawRun, tag + "a run of known cards shows the 'in a row' chip");
    await p.waitForSelector(".done-card.sd");
    const done = (await text(p, ".done-card.sd")).replace(/\s+/g, " ");
    ok(/6 of 6 known/.test(done) && /best run/.test(done) && /5\/5 goal done|6\/5|5\/5/.test(done), tag + "the end of the session: known ring, best run, goal: " + done.slice(0, 160));
    ok(/You used 1 hint/.test(done), tag + "and it notes the hint, without any penalty");
    await p.screenshot({path: path.join(SHOTS, `rewards-done-${w < 600 ? "phone" : "desk"}.png`)});
    ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), tag + "no sideways scrolling");
    ok(!p.errs.length, tag + "no page errors: " + p.errs.join(" | "));
    await ctx.close();
  }

  // AI on: the hint is a nudge from the AI, and a hint that gives the answer away is replaced
  { const {ctx, p} = await boot(1100, {ai: {hint: "Think of the cell's power plant, the organelle with its own DNA."}});
    await p.evaluate(() => { const S = window.__sbSync; S.ui.tab = "flashcards"; S.render(); });
    await p.evaluate(() => window.__sbSync.ui && 0);
    await p.click('[data-act="fc-review-start"]'); await p.waitForSelector('[data-act="fc-hint"]');
    // make sure the first card is the mitochondria one
    await p.evaluate(() => { const S = window.__sbSync, f = S.ui.fc, k = f.q.findIndex(x => x.cardId === "k0"); const it = f.q.splice(k, 1)[0]; f.q.unshift(it); f.i = 0; S.render(); });
    await p.click('[data-act="fc-hint"]'); await p.waitForFunction(() => /power plant/.test((document.querySelector(".fc-bubble") || {}).innerText || ""), null, {timeout: 8000});
    ok(true, "with AI the hint is the companion's nudge");
    ok(await p.evaluate(() => window.__sbSync.state.decks.d1.cards.find(c => c.id === "k0").hint === "Think of the cell's power plant, the organelle with its own DNA."), "and it's kept on the card, so next time it's free");
    ok(await p.evaluate(() => window.__sbRewards.hintLeaks("It's the mitochondria!", "Mitochondria") && !window.__sbRewards.hintLeaks("The power plant", "Mitochondria")), "a hint that names the answer is caught");
    await p.screenshot({path: path.join(SHOTS, "rewards-hint-ai.png")});
    ok(!p.errs.length, "no page errors (AI hint): " + p.errs.join(" | "));
    await ctx.close(); }

  // AI quiz: a hint takes away a wrong option; missed questions become cards, with Undo
  for (const w of [1100, 390]) {
    const tag = w + "px quiz: ", {ctx, p} = await boot(w);
    await p.evaluate(() => { const S = window.__sbSync; S.ui.tab = "flashcards"; S.ui.rvView = "quizzes"; S.render(); });
    await p.click('.rv-quiz [data-act="ai-quiz-start"]'); await p.waitForSelector('[data-act="qz-hint"]');
    ok(!(await p.$(".hearts, .lives")) && !/lives|hearts/i.test(await text(p, "#view")), tag + "no hearts or lives anywhere");
    await p.click('[data-act="qz-hint"]'); await p.waitForSelector(".fc-bubble");
    ok(/It isn't/.test(await text(p, ".fc-bubble")) && await p.locator(".opt.struck").count() === 1, tag + "without AI, the hint takes one wrong option away: " + await text(p, ".fc-bubble"));
    await p.screenshot({path: path.join(SHOTS, `rewards-quiz-hint-${w < 600 ? "phone" : "desk"}.png`)});
    // answer: get the first wrong, the rest right
    for (let k = 0; k < 3; k++) {
      const q = await p.evaluate(() => { const f = window.__sbSync.ui.fc; return f.qs[f.i]; });
      const pick = k === 0 ? q.options.findIndex((o, i) => !q.correct.includes(i)) : q.correct[0];
      await p.click(`.opt[data-i="${pick}"]`); await p.waitForSelector("#aiNext"); await p.click("#aiNext"); await p.waitForTimeout(100);
    }
    await p.waitForSelector(".qz-added");
    ok(/1 missed question is now a card/.test(await text(p, ".qz-added")), tag + "the missed question became a card: " + (await text(p, ".qz-added")).replace(/\s+/g, " "));
    const added = await p.evaluate(() => window.__sbSync.state.decks.d1.cards.filter(c => c.fromQ).map(c => c.front + " → " + c.back.split("\n")[0]));
    ok(added.length === 1, tag + "in the deck: " + added[0]);
    await p.screenshot({path: path.join(SHOTS, `rewards-quiz-done-${w < 600 ? "phone" : "desk"}.png`)});
    await p.click('[data-act="qz-added-undo"]'); await p.waitForTimeout(200);
    ok(await p.evaluate(() => !window.__sbSync.state.decks.d1.cards.some(c => c.fromQ)) && !(await p.$(".qz-added")), tag + "Undo takes it back out");
    ok(await p.evaluate(() => window.__sbRewards.goalToday()) >= 3, tag + "quiz answers count toward the daily goal");
    ok(!p.errs.length, tag + "no page errors: " + p.errs.join(" | "));
    await ctx.close();
  }

  await b.close(); server.close();
  console.log(fails ? `study-rewards.e2e: ${fails} of ${n} FAILED` : `study-rewards.e2e: ${n} checks passed`);
  process.exitCode = fails ? 1 : 0;
})().catch(e => { console.error(e); process.exit(1); });
