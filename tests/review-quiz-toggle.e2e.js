// node tests/review-quiz-toggle.e2e.js
// Review Before Saving: when the AI made cards and a quiz, a switch decides whether the quiz is saved too
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const root = path.join(__dirname, "..");
const server = http.createServer((req, res) => { const u = new URL(req.url, "http://x"); let p = decodeURIComponent(u.pathname); if (p === "/") p = "/index.html"; const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; } const mime = {".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json"}; res.writeHead(200, {"content-type": mime[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res); });
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const SET = {title: "Osmosis", quizTitle: "Osmosis Quiz", cases: [], notes: [],
  cards: [{front: "What is osmosis?", back: "Water moving across a membrane toward more solute."}, {front: "What are aquaporins?", back: "Water channel proteins."}],
  questions: [{type: "single", stem: "Which way does water move?", options: ["Toward more solute", "Toward less solute"], correct: [0], answer: "", rationale: "Toward more solute."}, {type: "single", stem: "What speeds it up?", options: ["Aquaporins", "Ribosomes"], correct: [0], answer: "", rationale: "Aquaporins."}]};
(async () => {
  await new Promise(r => server.listen(0, r)); const browser = await chromium.launch({executablePath});
  try {
    const run = async (keepQuiz, setOverride) => {
      const ctx = await browser.newContext({viewport: {width: 1280, height: 900}});
      await ctx.addInitScript(() => { window.__SB_TEST = true; try { if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("coursework:v2", JSON.stringify({v: 2, updated: 1, courses: [{id: "c1", name: "Bio", code: "BIO1", color: "#3B6FE0"}], tasks: [], decks: [], settings: {}})); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("studyboard:tour", "done"); } } catch (e) {} });
      const page = await ctx.newPage(); const errs = []; page.on("pageerror", e => errs.push(e.message));
      await page.goto("http://localhost:" + server.address().port + "/"); await page.waitForFunction(() => window.__sbSync);
      await page.evaluate(s => window.__sbSync.aiReviewSheet(JSON.parse(JSON.stringify(s)), {deck: null, courseId: "c1", sources: ["Notes"], mode: ""}), setOverride || SET);
      await page.waitForSelector("#arSave");
      const has = await page.locator("#arQuizOn").count();
      if (keepQuiz === false) {
        ok(has === 1 && await page.isChecked("#arQuizOn"), "with cards and a quiz, Save the Practice Quiz Too is there and on");
        await page.uncheck("#arQuizOn"); await page.waitForTimeout(100);
        ok(await page.evaluate(() => [...document.querySelectorAll("#dlg .ar-quiz")].every(x => x.offsetParent === null)), "turning it off hides the quiz name and questions");
      }
      await page.click("#arSave"); await page.waitForTimeout(400);
      const decks = await page.evaluate(() => Object.values(window.__sbSync.state.decks).map(d => ({cards: d.cards.length, quizzes: (d.aiQuizzes || d.quizzes || []).length})));
      await ctx.close(); return {has, decks, errs};
    };
    let r = await run(false);
    ok(r.decks.length === 1 && r.decks[0].cards === 2 && r.decks[0].quizzes === 0, "saving with it off keeps just the cards: " + JSON.stringify(r.decks));
    r = await run(true);
    ok(r.decks[0].cards === 2 && r.decks[0].quizzes === 1, "with it on, the quiz is saved too: " + JSON.stringify(r.decks));
    r = await run(null, Object.assign({}, SET, {cards: []}));
    ok(r.has === 0 && r.decks[0].quizzes === 1, "a quiz on its own has no switch and saves as before");
    r = await run(null, Object.assign({}, SET, {questions: []}));
    ok(r.has === 0 && r.decks[0].cards === 2, "cards on their own have no switch");
    ok(!r.errs.length, "no page errors");
    console.log("\nreview-quiz-toggle.e2e: " + n + " checks passed");
  } finally { await browser.close(); server.close(); }
})().catch(e => { console.error(e); process.exit(1); });
