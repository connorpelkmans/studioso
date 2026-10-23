// A quiz made straight from slides or notes (no flashcards)
const path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const SEED = {v: 2, updated: 1, courses: [{id: "c1", name: "Biology", code: "BIOL 201", color: "#1E9E74"}], tasks: [], settings: {}, notes: [],
  decks: [{id: "d1", name: "Organelles", courseId: "c1", created: 1, cards: [{id: "k1", front: "Nucleus", back: "DNA", box: 0, due: "", seen: 0, right: 0, wrong: 0}]}]};
(async () => {
  const b = await chromium.launch({executablePath}), page = await (await b.newContext({viewport: {width: 1100, height: 900}})).newPage();
  const errs = []; page.on("pageerror", e => errs.push(String(e)));
  await page.addInitScript(s => { window.__SB_TEST = true; localStorage.setItem("coursework:v2", JSON.stringify(s)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); }, SEED);
  await page.goto("file://" + path.resolve(__dirname, "..", "index.html")); await page.waitForTimeout(1200);
  await page.evaluate(() => { document.querySelectorAll("dialog[open]").forEach(d => d.close()); __sbSync.ui.tab = "flashcards"; __sbSync.ui.rvView = "quizzes"; __sbSync.render(); });
  await page.waitForTimeout(300);
  ok(await page.evaluate(() => !document.querySelector('#view .view-head [data-act="qz-add"]') && /Add Quiz/.test((document.querySelector("#fab") || {}).textContent || "")), "Quizzes adds a quiz with the + Add Quiz button (no extra New Quiz button)");
  await page.click("#fab"); await page.waitForTimeout(300);
  ok(await page.evaluate(() => { const b = [...document.querySelectorAll('dialog[open] [data-act="qz-ai"],dialog[open] [data-act="qz-from-deck"]')]; return b.length === 2 && b[0].dataset.act === "qz-ai"; }), "it offers From Slides or Notes first, then From a Deck");
  await page.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
  await page.evaluate(() => __sbSync.aiReviewSheet({cards: [], cases: [], quizTitle: "Lecture 5 Quiz", questions: [
    {id: "q1", type: "single", stem: "Which organelle makes ATP?", options: ["Nucleus", "Mitochondria"], correct: [1], rationale: "Powerhouse."},
    {id: "q2", type: "single", stem: "Where are ribosomes made?", options: ["Nucleolus", "Golgi"], correct: [0], rationale: "In the nucleolus."}]},
    {deck: null, sources: ["Lecture 5.pdf"], courseId: "c1", mode: "quiz"}));
  await page.waitForSelector("dialog[open] #arSave");
  ok(await page.evaluate(() => !document.querySelector("#arDeck") && !document.querySelector("#arName") && document.querySelector("#arQzCourse").value === "c1"), "no deck to pick or name: just the course");
  await page.click("#arSave"); await page.waitForTimeout(400);
  const st = await page.evaluate(() => { const ds = Object.values(__sbSync.state.decks); const h = ds.find(d => d.quizOnly); return {n: ds.length, h: h && {name: h.name, cards: h.cards.length, q: h.aiQuizzes.length, course: h.courseId}}; });
  ok(st.h && st.h.cards === 0 && st.h.q === 1 && st.h.name === "Lecture 5 Quiz" && st.h.course === "c1", "the quiz is saved on its own, in the course");
  ok(await page.evaluate(() => __sbSync.ui.rvView === "quizzes" && /Lecture 5 Quiz/.test(document.querySelector("#view .qz-grid").textContent) && /from Lecture 5\b/.test(document.querySelector("#view .qz-grid").textContent)), "it shows in Quizzes, from the slides it came from");
  await page.evaluate(() => { __sbSync.ui.rvView = "cards"; __sbSync.ui.deckId = null; __sbSync.render(); }); await page.waitForTimeout(200);
  ok(await page.evaluate(() => document.querySelectorAll("#view .deck.deck-fc").length === 1 && !/Lecture 5 Quiz/.test(document.querySelector("#view .deck-grid").textContent)), "it never shows up as an empty deck in Flashcards");
  await page.evaluate(() => { __sbSync.ui.rvView = "quizzes"; __sbSync.render(); }); await page.waitForTimeout(200);
  await page.click("#view .qz-card .qz-body"); await page.waitForTimeout(300);
  ok(await page.evaluate(() => /from\s*Lecture 5/.test(document.querySelector("#view .deck-stats").textContent)), "its page says where it came from");
  ok(!errs.length, "no page errors: " + errs.join(" | "));
  await b.close(); console.log(`quiz-from-material.e2e: ${n} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
