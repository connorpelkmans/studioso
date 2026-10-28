// node tests/quiz-maker.e2e.js
// Write Your Own Quiz: build a quiz by hand, take it, and edit it later
const path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const FILE = "file://" + path.join(__dirname, "..", "index.html");
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };

(async () => {
  const browser = await chromium.launch({executablePath});
  try {
    for (const vp of [{width: 1300, height: 900}, {width: 390, height: 844}]) {
      const ctx = await browser.newContext({viewport: vp}), p = await ctx.newPage(), errs = [];
      p.on("pageerror", e => errs.push(e.message));
      await p.addInitScript(() => {
        localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("studioso:tour", "done"); localStorage.setItem("sb:onboarded", "1");
        localStorage.setItem("studyboard:rvview", "quizzes");
        localStorage.setItem("coursework:v2", JSON.stringify({v: 2, courses: [{id: "c1", name: "Pharmacology", code: "BSNC 1040", color: "#2563eb", meetings: [], links: []}], tasks: [], files: [], notes: [], decks: [], events: [], settings: {}, updated: 1}));
      });
      await p.goto(FILE); await p.waitForTimeout(1000);
      await p.click('nav [data-tab="flashcards"]'); await p.waitForTimeout(500);
      const w = vp.width;

      // The Add Quiz menu offers it
      await p.evaluate(() => { const b = document.createElement("button"); b.dataset.act = "qz-add"; document.body.appendChild(b); b.click(); b.remove(); });
      await p.waitForTimeout(300);
      ok(await p.locator('dialog[open] [data-act="qz-write"]').isVisible(), `${w}: Add Quiz has Write Your Own`);
      await p.click('dialog[open] [data-act="qz-write"]'); await p.waitForTimeout(300);
      ok(await p.locator("dialog[open] .qm-q").count() === 1, `${w}: the builder opens with one question`);

      await p.fill("#qmName", "Cardiac Meds");
      await p.selectOption('dialog[open] select[name="qmCourse"]', "c1");
      // Q1: multiple choice, but no right answer picked yet
      const q = i => `#qmList .qm-q[data-i="${i}"]`;
      await p.fill(`${q(0)} [data-qm="stem"]`, "Which drug is a beta blocker?");
      for (const [k, t] of [[0, "Metoprolol"], [1, "Furosemide"], [2, "Digoxin"]]) await p.fill(`${q(0)} [data-qm="opt"][data-k="${k}"]`, t);
      await p.click('dialog[open] [data-submit]'); await p.waitForTimeout(300);
      ok(/Question 1: pick the right answer/.test(await p.locator("#toast").textContent()), `${w}: saving without a right answer says what's missing`);
      await p.check(`${q(0)} [data-qm="pick"][data-k="0"]`);
      // Q2: true or false
      await p.click("#qmAdd"); await p.selectOption(`${q(1)} [data-qm="type"]`, "truefalse");
      await p.fill(`${q(1)} [data-qm="stem"]`, "Digoxin slows the heart rate.");
      ok(await p.locator(`${q(1)} .qm-tf`).count() === 2, `${w}: true or false shows True and False`);
      await p.check(`${q(1)} [data-qm="pick"][data-k="0"]`);
      // Q3: written answer
      await p.click("#qmAdd"); await p.selectOption(`${q(2)} [data-qm="type"]`, "short");
      await p.fill(`${q(2)} [data-qm="stem"]`, "Name the antidote for heparin.");
      await p.fill(`${q(2)} [data-qm="answer"]`, "Protamine sulfate");
      await p.fill(`${q(2)} [data-qm="rationale"]`, "Protamine binds heparin.");
      // Q4: select all, with an extra option
      await p.click("#qmAdd"); await p.selectOption(`${q(3)} [data-qm="type"]`, "multiple");
      await p.fill(`${q(3)} [data-qm="stem"]`, "Select all loop diuretics.");
      await p.click(`${q(3)} [data-qm="addopt"]`);
      for (const [k, t] of [[0, "Furosemide"], [1, "Bumetanide"], [2, "Spironolactone"], [3, "Torsemide"], [4, "Mannitol"]]) await p.fill(`${q(3)} [data-qm="opt"][data-k="${k}"]`, t);
      for (const k of [0, 1, 3]) await p.check(`${q(3)} [data-qm="pick"][data-k="${k}"]`);
      // Q5: put in order
      await p.click("#qmAdd"); await p.selectOption(`${q(4)} [data-qm="type"]`, "order");
      await p.fill(`${q(4)} [data-qm="stem"]`, "Order the steps of giving a med.");
      for (const [k, t] of [[0, "Check the order"], [1, "Identify the patient"], [2, "Give the medication"]]) await p.fill(`${q(4)} [data-qm="opt"][data-k="${k}"]`, t);
      // Q6: left blank, so it's skipped
      await p.click("#qmAdd");
      ok(await p.locator("dialog[open] .qm-q").count() === 6, `${w}: six questions in the builder`);
      const over = await p.evaluate(() => { const d = document.querySelector("dialog[open]"); return [...d.querySelectorAll(".qm-q *")].filter(e => { const r = e.getBoundingClientRect(), b = d.getBoundingClientRect(); return r.width && (r.right > b.right + 1 || r.left < b.left - 1); }).map(e => e.className || e.tagName).slice(0, 4); });
      ok(!over.length, `${w}: nothing in the builder spills out of the sheet: ${over.join(", ")}`);
      await p.click('dialog[open] [data-submit]'); await p.waitForTimeout(600);
      ok(!(await p.locator("dialog[open]").count()), `${w}: the quiz saves`);

      const saved = await p.evaluate(() => { const s = JSON.parse(localStorage.getItem("coursework:v2")); const d = (Array.isArray(s.decks) ? s.decks : Object.values(s.decks || {}))[0]; return d && {quizOnly: d.quizOnly, courseId: d.courseId, qz: d.aiQuizzes[0]}; });
      ok(saved && saved.quizOnly && saved.courseId === "c1" && saved.qz.title === "Cardiac Meds", `${w}: saved as its own quiz in the course: ` + JSON.stringify(saved && {t: saved.qz.title, c: saved.courseId}));
      const Q = saved.qz.questions;
      ok(Q.length === 5 && Q.map(x => x.type).join() === "single,truefalse,short,multiple,order", `${w}: five questions kept, the blank one skipped: ` + Q.map(x => x.type).join());
      ok(Q[0].correct[0] === 0 && Q[1].correct[0] === 0 && Q[2].answer === "Protamine sulfate" && Q[2].rationale === "Protamine binds heparin." && Q[3].correct.join() === "0,1,3", `${w}: right answers and the explanation are saved`);
      const ordered = Q[4].correct.map(i => Q[4].options[i]).join("|");
      ok(ordered === "Check the order|Identify the patient|Give the medication" && Q[4].options.join("|") !== ordered, `${w}: a Put in Order question is saved mixed up, with the right order kept: ${Q[4].options.join("|")}`);
      ok(/Cardiac Meds/.test(await p.locator("#view h2").first().textContent()), `${w}: the new quiz's page opens`);
      await p.locator("#view .g2-band button", {hasText: "More"}).first().click().catch(() => {}); await p.waitForTimeout(300);
      ok(await p.locator('[data-act="qz-edit"]:visible').count() > 0, `${w}: the quiz page has Edit (under More)`);
      await p.keyboard.press("Escape"); await p.waitForTimeout(200);

      // Take it
      await p.click('#view [data-act="ai-quiz-start"]'); await p.waitForTimeout(400);
      ok(await p.evaluate(() => !!document.querySelector("#view .mc, #view #aiWritten, #view [data-act=ai-up], #view [data-act=ai-down]")), `${w}: the quiz can be taken`);
      await p.click('[data-act="fc-exit"]').catch(() => {}); await p.waitForTimeout(300);

      // Edit it: rename, change Q1's right answer, delete Q2
      await p.evaluate(ref => { const b = document.createElement("button"); b.dataset.act = "qz-edit"; b.dataset.id = ref; document.body.appendChild(b); b.click(); b.remove(); }, (await p.evaluate(() => { const s = JSON.parse(localStorage.getItem("coursework:v2")); const d = (Array.isArray(s.decks) ? s.decks : Object.values(s.decks || {}))[0]; return d.id + ":" + d.aiQuizzes[0].id; })));
      await p.waitForTimeout(300);
      ok(await p.locator("dialog[open] .qm-q").count() === 5 && await p.inputValue("#qmName") === "Cardiac Meds", `${w}: Edit opens the quiz's questions`);
      ok(await p.inputValue(`${q(4)} [data-qm="opt"][data-k="0"]`) === "Check the order", `${w}: Put in Order steps are listed in the right order for editing`);
      await p.fill("#qmName", "Cardiac Meds Review");
      await p.check(`${q(0)} [data-qm="pick"][data-k="2"]`);
      await p.click(`${q(1)} [data-qm="rmq"]`);
      await p.click('dialog[open] [data-submit]'); await p.waitForTimeout(600);
      const ed = await p.evaluate(() => { const s = JSON.parse(localStorage.getItem("coursework:v2")); const d = (Array.isArray(s.decks) ? s.decks : Object.values(s.decks || {})); return {n: d.length, qz: d[0].aiQuizzes[0]}; });
      ok(ed.n === 1 && ed.qz.title === "Cardiac Meds Review" && ed.qz.questions.length === 4 && ed.qz.questions[0].correct[0] === 2 && ed.qz.questions[0].id === Q[0].id, `${w}: edits are saved to the same quiz: ` + JSON.stringify({n: ed.n, t: ed.qz.title, len: ed.qz.questions.length}));

      // Cancel with changes asks first
      await p.evaluate(() => { const b = document.createElement("button"); b.dataset.act = "qz-write"; document.body.appendChild(b); b.click(); b.remove(); }); await p.waitForTimeout(300);
      await p.fill(`${q(0)} [data-qm="stem"]`, "Half written");
      await p.click('dialog[open] .sheet-foot [data-act="close"]'); await p.waitForTimeout(300);
      ok(/Discard/.test(await p.evaluate(() => document.body.innerText)), `${w}: closing a half-written quiz asks before discarding`);
      ok(!errs.length, `${w}: no page errors: ` + errs.join(" | "));
      await ctx.close();
    }
  } finally { await browser.close(); }
  console.log(`\nquiz-maker.e2e: ${n} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
