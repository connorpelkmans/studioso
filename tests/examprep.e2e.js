// Browser test for the Exam Prep Planner.  Run: node tests/examprep.e2e.js [outDir]    (Playwright + Chromium; the AI network call is stubbed; the clock is faked)
// Covers, at 1280 and 390 wide: opening the planner from the exam row, suggesting topics from a seeded course (2 decks, 3 notes, a quiz), confidence, creating the plan,
// one Undo, the agenda, opening a deck session in study mode, marking done (coverage and readiness change), missed days (fake clock) -> catch up, a new exam date -> re-plan,
// no AI -> offline plan, AI wording, no material -> the generator offer, and that every old entry point lands in the same flow with nothing duplicated.
const path = require("path"), fs = require("fs"), assert = require("assert"), os = require("os");
const {chromium} = require(process.env.PW_MODULE || "/opt/node-tools/node_modules/playwright");
const FILE = "file://" + path.join(__dirname, "..", "index.html");
const OUT = process.argv[2] || fs.mkdtempSync(path.join(os.tmpdir(), "sbprep-"));
fs.mkdirSync(OUT, {recursive: true});
const exe = fs.existsSync("/opt/pw-browsers/chromium") ? "/opt/pw-browsers/chromium" : undefined;
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const NOW = new Date(2026, 9, 4, 10, 0, 0);          // Sunday Oct 4 2026, 10:00
const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const plus = k => { const d = new Date(NOW); d.setDate(d.getDate() + k); return iso(d); };
const TODAY = plus(0), EXAM = plus(10);
const card = (id, f, b, o) => Object.assign({id, front: f, back: b, box: 0, due: "", seen: 0, right: 0, wrong: 0}, o || {});
const SEED = {v: 2,
  courses: [{id: "c1", name: "Biology", code: "BIO 101", color: "#3B6FE0"}, {id: "c2", name: "Statistics", code: "STA 200", color: "#1E9E74"}, {id: "c3", name: "Art History", code: "ART 110", color: "#9A4FD1"}],
  tasks: [{id: "ex1", title: "Midterm", courseId: "c1", type: "Exam", due: EXAM, time: "09:00", weight: 30, notes: "Chapters 3-4, bring a pencil", status: "todo", start: EXAM},
    {id: "ex3", title: "Final", courseId: "c3", type: "Exam", due: plus(14), status: "todo", start: plus(14)},
    {id: "hw", title: "Stats homework", courseId: "c2", type: "Assignment", due: plus(2), hours: 2, status: "todo"}],
  decks: [
    {id: "d1", name: "Cardiac Drugs", courseId: "c1", created: 1, cards: [card("k1", "Beta blocker example", "Metoprolol", {seen: 2, box: 0, due: TODAY}), card("k2", "ACE inhibitor example", "Lisinopril", {seen: 1, box: 0, due: TODAY}), card("k3", "Statin action", "Lowers LDL"), card("k4", "Digoxin toxicity", "Nausea, halos", {seen: 3, box: 0, due: plus(5)})]},
    {id: "d2", name: "Renal Physiology", courseId: "c1", created: 2, cards: [card("k5", "Nephron", "Functional unit"), card("k6", "GFR", "Filtration rate")],
      aiQuizzes: [{id: "q1", title: "Renal quiz", style: "", results: [], sources: [], questions: [{id: "z1", type: "single", stem: "Where does filtration happen?", options: ["Glomerulus", "Loop", "Ureter", "Bladder"], correct: [0], answer: "", rationale: "Glomerulus"}]}]},
    {id: "d3", name: "Cardiac formulas (stats)", courseId: "c2", created: 3, cards: [card("k7", "Mean", "Sum over n")]}],
  notes: [{id: "n1", text: "Cardiac drugs\n- beta blockers\n- statins", courseId: "c1", x: 40, y: 40, rot: 0, color: "yellow", z: 1}, {id: "n2", text: "Respiratory system\nlungs and gas exchange", courseId: "c1", x: 260, y: 40, rot: 0, color: "pink", z: 2}, {id: "n3", text: "Acid base balance\nbuffers", courseId: "c1", x: 40, y: 220, rot: 0, color: "blue", z: 3}],
  files: [], events: [], settings: {capacity: 15, dailyHours: 3}, updated: 1};
const AI_REPLY = {sessions: []};

async function mk(browser, w, h, o = {}) {
  const ctx = await browser.newContext({viewport: {width: w, height: h}});
  await ctx.clock.install({time: o.time || NOW});
  await ctx.addInitScript(([seed, ai]) => {
    try { if (!sessionStorage.getItem("seeded")) { sessionStorage.setItem("seeded", "1"); localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "1"); localStorage.setItem("coursework:v2", JSON.stringify(seed));
      if (ai) { localStorage.setItem("studyboard:aiKeys", JSON.stringify({gemini: "AIzaTESTTESTTESTTESTTESTTEST12345"})); localStorage.setItem("studyboard:aiConsent", JSON.stringify({gemini: {v: 1, at: 1}})); } } } catch (e) {}
  }, [o.seed || SEED, !!o.ai]);
  ctx.aiCalls = [];
  await ctx.route(/generativelanguage\.googleapis\.com/, route => { ctx.aiCalls.push(JSON.parse(route.request().postData() || "{}")); route.fulfill({status: 200, contentType: "application/json", body: JSON.stringify({candidates: [{content: {parts: [{text: JSON.stringify(ctx.aiReply || AI_REPLY)}]}, finishReason: "STOP"}]})}); });
  const page = await ctx.newPage(); page.errs = [];
  page.on("pageerror", e => page.errs.push(e.message));
  await page.goto(FILE); await page.waitForTimeout(1500);
  return {ctx, page};
}
const act = (page, a, id, extra) => page.evaluate(([a, i, x]) => { const b = document.createElement("button"); b.dataset.act = a; if (i) b.dataset.id = i; x && Object.entries(x).forEach(([k, v]) => { b.dataset[k] = v; }); b.style.display = "none"; document.body.appendChild(b); b.click(); b.remove(); }, [a, id, extra]);
const goCourse = async (page, id) => { await page.evaluate(() => { const b = document.querySelector('[data-tab="courses"]'); if (b) b.click(); }); await page.waitForTimeout(200); await act(page, "open-course", id); await page.waitForTimeout(300); };
const goBoard = async page => { await page.evaluate(() => { const b = document.querySelector('[data-tab="board"]'); if (b) b.click(); }); await page.waitForTimeout(200); await act(page, "bview", "plan"); await page.waitForTimeout(300); };
const store = page => page.evaluate(() => JSON.parse(localStorage.getItem("coursework:v2")));
const sessions = async (page, ex = "ex1") => (await store(page)).tasks.filter(t => t.prepFor === ex);
const exam = async (page, id = "ex1") => (await store(page)).tasks.find(t => t.id === id);
const vis = (page, sel) => page.evaluate(s => { const e = document.querySelector(s); return !!e && !!(e.offsetWidth || e.offsetHeight); }, sel);
const txt = (page, sel) => page.evaluate(s => { const e = document.querySelector(s); return e ? e.innerText : ""; }, sel);
const noHScroll = page => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
const dlgScroll = page => page.evaluate(() => { const d = document.querySelector("#dlg"); return d ? d.scrollWidth <= d.clientWidth + 1 : true; });

(async () => {
  const browser = await chromium.launch({executablePath: exe});
  try {
    for (const [W, H] of process.env.ONLY ? [] : [[1280, 800], [390, 844]]) {
      const tag = W + "w";
      console.log("== " + W + " wide");
      const {ctx, page} = await mk(browser, W, H);
      ok(page.errs.length === 0, "no page errors on load: " + page.errs.join("; "));
      // ---- entry point 1: the exam row on the course page (row action + Upcoming Exams)
      await goCourse(page, "c1");
      ok(await vis(page, ".pp-exams"), "the course page lists upcoming exams");
      ok((await txt(page, ".pp-exams")).includes("Midterm") && (await txt(page, ".pp-exams")).includes("Plan My Prep"), "next to the exam: Plan My Prep");
      ok(await page.evaluate(() => !!document.querySelector("li.task .pp-row-btn")), "the exam row has a Plan My Prep action");
      await page.screenshot({path: path.join(OUT, `course-${tag}.png`)});
      await page.click("li.task .pp-row-btn"); await page.waitForTimeout(500);
      ok(await vis(page, "#ppBody"), "the planner sheet opens from the exam row");
      ok((await txt(page, "#ppTitle")) === "Plan My Prep", "title");
      // suggested topics from material: deck names, note headings, chapters in the exam notes
      const tn = await page.evaluate(() => [...document.querySelectorAll("[data-pn]")].map(i => i.value));
      ok(tn.includes("Cardiac Drugs") && tn.includes("Renal Physiology") && tn.includes("Respiratory system") && tn.includes("Acid base balance"), "topics suggested from decks and notes: " + tn.join(" | "));
      ok(tn.includes("Chapter 3") && tn.includes("Chapter 4"), "and from the chapters named in the exam notes");
      ok(!tn.some(t => /stats|formulas/i.test(t)), "no topic from another course's deck");
      // linked material per topic, with course scoping
      const links = await page.evaluate(() => [...document.querySelectorAll(".pp-topic")].map(li => ({n: li.querySelector("[data-pn]").value, s: (li.querySelector(".pp-mat-s") || {}).innerText || "", t: li.querySelector(".pp-mat-t").innerText})));
      const cardiac = links.find(l => l.n === "Cardiac Drugs"); ok(/Deck: Cardiac Drugs/.test(cardiac.s) && /Note: Cardiac drugs/.test(cardiac.s), "Cardiac Drugs links its deck and note: " + cardiac.s);
      ok(!links.some(l => /formulas/.test(l.s)), "no link into another course");
      const renal = links.find(l => l.n === "Renal Physiology"); ok(/Deck: Renal Physiology/.test(renal.s) && /Quiz: Renal quiz/.test(renal.s), "Renal Physiology links its deck and its quiz: " + renal.s);
      // edit links: remove one, add it back
      await page.click(`.pp-topic:has([data-pn="${await page.evaluate(() => [...document.querySelectorAll("[data-pn]")].find(i => i.value === "Cardiac Drugs").dataset.pn)}"]) .pp-mat-t`);
      ok(await vis(page, ".pp-mat"), "Linked material opens");
      const before = await page.evaluate(() => document.querySelectorAll(".pp-mat li").length);
      await page.click(".pp-mat [data-pp=unlink]"); await page.waitForTimeout(100);
      ok((await page.evaluate(() => document.querySelectorAll(".pp-mat li").length)) === before - 1, "a link can be removed");
      await page.click(".pp-mat [data-pp=rematch]"); await page.waitForTimeout(100);
      ok((await page.evaluate(() => document.querySelectorAll(".pp-mat li").length)) === before, "and matched again");
      await page.click(".pp-mat-t");
      // confidence
      const cid = await page.evaluate(() => [...document.querySelectorAll("[data-pn]")].find(i => i.value === "Cardiac Drugs").dataset.pn);
      await page.click(`[data-pp=conf][data-id="${cid}"][data-v=weak]`);
      ok(await page.evaluate(id => document.querySelector(`[data-pp=conf][data-id="${id}"][data-v=weak]`).getAttribute("aria-pressed") === "true", cid), "Shaky is selected");
      // typing / pasting a list adds topics
      await page.fill("#ppAdd", "Heart failure\n- Antibiotics, Pain relief\nHeart failure"); await page.click("[data-pp=add]"); await page.waitForTimeout(100);
      const tn2 = await page.evaluate(() => [...document.querySelectorAll("[data-pn]")].map(i => i.value));
      ok(tn2.includes("Heart failure") && tn2.includes("Antibiotics") && tn2.includes("Pain relief") && tn2.filter(x => x === "Heart failure").length === 1, "a pasted list is split into topics, duplicates dropped");
      // remove the two chapter placeholders to keep the plan tidy
      for (const nm of ["Chapter 3", "Chapter 4"]) { const id = await page.evaluate(nm => { const i = [...document.querySelectorAll("[data-pn]")].find(i => i.value === nm); return i && i.dataset.pn; }, nm); if (id) await page.click(`[data-pp=rm][data-id="${id}"]`); }
      // format, intensity, options
      await page.click("[data-pp=style][data-v=mc]"); await page.click("[data-pp=int][data-v='90']");
      ok(await vis(page, ".pp-sum"), "a live summary of the plan is shown"); const sum = await txt(page, ".pp-sum");
      ok(/\d+ sessions? over \d+ days?/.test(sum), "summary: " + sum.slice(0, 80));
      ok(!(await vis(page, "[data-pp=aifind]")) && !(await vis(page, "[data-pp=ai]")), "no AI controls when AI isn't set up");
      ok(await noHScroll(page) && await dlgScroll(page), "no horizontal scrolling in the sheet");
      await page.screenshot({path: path.join(OUT, `planner-${tag}.png`)});
      // create
      const nBefore = (await store(page)).tasks.length;
      await page.click("#ppCreate"); await page.waitForTimeout(500);
      const ss = await sessions(page); ok(ss.length >= 8, "plan created as Study tasks: " + ss.length);
      ok(ss.every(t => t.type === "Study" && t.prepFor === "ex1" && t.due >= TODAY && t.due < EXAM && t.hours > 0), "every session is a Study task before the exam, linked by prepFor");
      ok(ss.some(t => t.matKind === "deck" && t.matId === "d1" && /Cardiac Drugs/.test(t.title)) && ss.every(t => /^BIO 101 Midterm: /.test(t.title)), "titles like 'BIO 101 Midterm: Cardiac Drugs (flashcards)': " + ss[0].title);
      ok(ss.some(t => t.matKind === "note" && t.kind === "learn") && ss.some(t => t.matKind === "quiz" && t.matId === "q1" && t.matDeck === "d2"), "sessions link notes and quizzes");
      const ex = await exam(page); ok(ex.prep && ex.prep.topics.length >= 6 && ex.prep.topics.some(t => t.name === "Cardiac Drugs" && t.conf === "weak" && t.links.length), "the plan settings live on the exam task (prep): topics, confidence, links");
      ok(ex.planTopics && ex.planTopics.length === ex.prep.topics.length, "old planTopics are kept in step for Tune Study Sessions and practice tests");
      ok(await vis(page, "#toast.show"), "a toast offers Undo");
      // single Undo
      await page.click("#toastUndo"); await page.waitForTimeout(300);
      ok((await sessions(page)).length === 0 && (await store(page)).tasks.length === nBefore, "one Undo removes every session and nothing else");
      ok(!(await exam(page)).prep, "and the plan settings");
      // plan again, this time keep it
      await act(page, "exam-plan", "ex1"); await page.waitForTimeout(400);
      ok(await vis(page, "#ppBody") && (await txt(page, "#ppTitle")) === "Plan My Prep", "re-opening after Undo starts a fresh plan");
      await page.click("[data-pp=suggest]"); await page.waitForTimeout(100);
      await page.click(`[data-pp=conf][data-id="${await page.evaluate(() => [...document.querySelectorAll("[data-pn]")].find(i => i.value === "Cardiac Drugs").dataset.pn)}"][data-v=weak]`);
      await page.click("#ppCreate"); await page.waitForTimeout(500);
      const ss2 = await sessions(page); ok(ss2.length >= 8, "plan created again: " + ss2.length);
      const kinds = new Set(ss2.map(t => t.kind)); ok(["learn", "cards", "questions", "recap", "light"].every(k => kinds.has(k)), "session types: " + [...kinds].join(", "));
      // ---- no duplicates: planning again opens the existing plan
      await act(page, "exam-plan", "ex1"); await page.waitForTimeout(400);
      ok((await txt(page, "#ppTitle")) === "Prep Plan" && await vis(page, ".pp-agenda"), "planning an exam that already has a plan opens it");
      ok(await vis(page, "[data-pp=replan]"), "and offers Re-plan");
      ok((await sessions(page)).length === ss2.length, "nothing duplicated");
      // agenda: grouped by date, today highlighted, coverage bars, links, readiness gate
      const days = await page.evaluate(() => [...document.querySelectorAll(".pp-day")].map(d => d.querySelector(".ep-day-head b").innerText));
      ok(days.length >= 5 && new Set(days).size === days.length, "agenda grouped by day: " + days.length + " days");
      ok(await vis(page, ".pp-day.is-today"), "today is highlighted");
      ok((await page.evaluate(() => document.querySelectorAll(".pp-cov").length)) >= 6, "per-topic coverage bars");
      ok(/0 of \d+ sessions done/.test(await txt(page, ".pp-line")) && /Readiness shows once/.test(await txt(page, ".pp-head")), "no evidence yet: no readiness percentage (the evidence gate)");
      ok(await noHScroll(page) && await dlgScroll(page), "agenda fits the width");
      await page.screenshot({path: path.join(OUT, `agenda-${tag}.png`)});
      // the row and the detail sheet show progress
      await page.keyboard.press("Escape"); await page.waitForTimeout(200);
      await act(page, "edit-task", "ex1"); await page.waitForTimeout(300);
      ok(/0 of \d+ sessions done/.test(await txt(page, ".pp-form")), "the exam detail shows the progress summary: " + (await txt(page, ".pp-form")).replace(/\n/g, " "));
      ok(/Prep Plan \(0\/\d+\)/.test(await txt(page, ".sheet-foot")), "and a Prep Plan button");
      await page.keyboard.press("Escape"); await page.waitForTimeout(200);
      // Today's Plan shows a prep session with an open-material button
      await goBoard(page);
      ok(await vis(page, ".plan-row .pp-open, .next-up .pp-open"), "Today's Plan shows prep sessions as Study tasks with an Open Deck or Open Note button");
      await page.evaluate(() => { const e = document.querySelector(".plan-row .pp-open, .next-up .pp-open"); if (e) e.scrollIntoView({block: "center"}); }); await page.waitForTimeout(200); await page.screenshot({path: path.join(OUT, `today-${tag}.png`)});
      // open a deck session in study mode
      await act(page, "exam-plan", "ex1"); await page.waitForTimeout(300);
      const deckBtn = await page.evaluate(() => { const b = [...document.querySelectorAll(".pp-sess")].find(s => /Cardiac Drugs: flashcards/.test(s.innerText) && s.querySelector(".pp-open")); return b ? b.querySelector(".pp-open").dataset.id : ""; });
      ok(deckBtn, "a flashcards session has an Open Deck button");
      await page.click(`#ppBody .pp-open[data-id="${deckBtn}"]`); await page.waitForTimeout(500);
      ok(!(await vis(page, "#ppBody")), "the sheet closes");
      const studying = await page.evaluate(() => /Beta blocker|ACE inhibitor|Statin|Digoxin|Show Answer|Reveal|Flip/i.test(document.body.innerText) && !!document.querySelector("#view"));
      ok(studying, "the linked deck opens in study mode");
      await page.screenshot({path: path.join(OUT, `study-${tag}.png`)});
      // mark done: coverage and readiness change
      await act(page, "exam-plan", "ex1"); await page.waitForTimeout(300);
      const firstDone = await page.evaluate(() => document.querySelector(".pp-day .pp-check").dataset.id);
      const covBefore = await page.evaluate(() => [...document.querySelectorAll(".pp-cov-top .mini:last-child")].map(e => e.innerText).join("|"));
      await page.click(`.pp-check[data-id="${firstDone}"]`); await page.waitForTimeout(400);
      ok(await page.evaluate(id => document.querySelector(`.pp-check[data-id="${id}"]`).closest(".pp-sess").classList.contains("is-done"), firstDone), "Mark done ticks the session");
      const covAfter = await page.evaluate(() => [...document.querySelectorAll(".pp-cov-top .mini:last-child")].map(e => e.innerText).join("|"));
      ok(covAfter !== covBefore, "topic coverage changed");
      ok(/1 of \d+ sessions done/.test(await txt(page, ".pp-line")) && /readiness \d+%/.test(await txt(page, ".pp-line")), "readiness appears once there is evidence: " + (await txt(page, ".pp-line")));
      const r1 = Number((await txt(page, ".pp-line")).match(/readiness (\d+)%/)[1]);
      const second = await page.evaluate(() => document.querySelectorAll(".pp-day .pp-check")[1].dataset.id);
      await page.click(`.pp-check[data-id="${second}"]`); await page.waitForTimeout(400);
      const r2 = Number((await txt(page, ".pp-line")).match(/readiness (\d+)%/)[1]); ok(r2 >= r1, `readiness grows with finished sessions (${r1}% -> ${r2}%)`);
      await page.keyboard.press("Escape"); await page.waitForTimeout(200);
      // the exam's bar and row line
      await goCourse(page, "c1");
      ok(/2\/\d+ sessions/.test(await page.evaluate(() => document.querySelector("li.task .task-meta") ? [...document.querySelectorAll("li.task")].map(l => l.innerText).join("\n") : "")), "the exam row says how many sessions are done");
      // ---- old entry points: nothing duplicated, one flow
      const count = (await sessions(page)).length;
      await act(page, "exam-plan", "ex1"); await page.waitForTimeout(300); ok(await vis(page, "#ppBody") && !(await vis(page, "#epBody")), "the old exam-plan action opens the new planner"); await page.keyboard.press("Escape");
      await act(page, "prep-plan"); await page.waitForTimeout(300); ok(await vis(page, "#ppBody"), "Search Everywhere's 'Plan My Exam Prep' opens it too"); await page.keyboard.press("Escape");
      ok((await sessions(page)).length === count, "still the same sessions");
      // ---- missed days (fake clock) -> banner and catch up
      await page.evaluate(() => { try { sessionStorage.setItem("seeded", "1"); } catch (e) {} });
      await ctx.clock.setSystemTime(new Date(2026, 9, 8, 10, 0, 0)); await page.reload(); await page.waitForTimeout(1500);
      await page.waitForFunction(() => /slipped/.test((document.querySelector(".pp-today") || {innerText: ""}).innerText), null, {timeout: 5000}).catch(() => {});
      ok(await vis(page, ".pp-today"), "a gentle banner on Today when sessions were missed");
      ok(/slipped/.test(await txt(page, ".pp-today")), "it says sessions slipped: " + (await txt(page, ".pp-today")).replace(/\n/g, " ").slice(0, 100));
      await page.evaluate(() => { const e = document.querySelector(".pp-today"); if (e) e.scrollIntoView({block: "center"}); }); await page.waitForTimeout(200); await page.screenshot({path: path.join(OUT, `missed-${tag}.png`)});
      const doneIds = (await sessions(page)).filter(t => t.status === "done").map(t => t.id), openOld = (await sessions(page)).filter(t => t.status !== "done" && t.due < plus(4));
      ok(openOld.length > 0, "some open sessions are in the past now: " + openOld.length);
      await page.click(".pp-today [data-act=prep-catch]"); await page.waitForTimeout(600);
      const after = await sessions(page);
      ok(after.filter(t => t.status === "done").map(t => t.id).sort().join() === doneIds.sort().join(), "catch up keeps the finished sessions");
      ok(after.filter(t => t.status !== "done").every(t => t.due >= plus(4) && t.due < EXAM), "and re-spreads the rest over the days left, none in the past");
      ok(!/slipped/.test(await txt(page, ".pp-today")), "the missed-sessions banner is gone");
      ok(await vis(page, "#toast.show"), "catch up is one undoable batch"); await page.click("#toastUndo"); await page.waitForTimeout(300);
      ok((await sessions(page)).filter(t => t.status !== "done" && t.due < plus(4)).length === openOld.length, "Undo puts the missed sessions back");
      await page.click("body"); await act(page, "prep-catch", "ex1"); await page.waitForTimeout(500);
      ok((await sessions(page)).filter(t => t.status !== "done" && t.due < plus(4)).length === 0, "caught up again");
      // ---- the exam moves: re-plan offer, keep done sessions
      await act(page, "edit-task", "ex1"); await page.waitForTimeout(300);
      await page.fill("input[name=due]", plus(16)); await page.click("[data-submit]"); await page.waitForTimeout(1200);
      ok(await vis(page, "#toast.show") && /Re-plan your prep/.test(await txt(page, "#toastMsg")), "moving the exam offers a re-plan: " + (await txt(page, "#toastMsg")));
      ok(/moved to/.test(await txt(page, ".pp-today") || ""), "and Today says so");
      const doneBefore = (await sessions(page)).filter(t => t.status === "done").map(t => t.id).sort().join();
      await page.click("#toastExtra"); await page.waitForTimeout(700);
      const re = await sessions(page);
      ok(re.filter(t => t.status === "done").map(t => t.id).sort().join() === doneBefore, "re-plan keeps the done sessions");
      ok(re.every(t => t.due < plus(16)) && re.some(t => t.due >= plus(10) && t.status !== "done"), "and moves the rest to the new date: last " + re.map(t => t.due).sort().pop());
      ok((await exam(page)).prep.examDue === plus(16), "the plan remembers the new date");
      ok(re.length === new Set(re.map(t => t.id)).size && re.filter(t => t.status !== "done").length === new Set(re.filter(t => t.status !== "done").map(t => t.kind + "|" + t.topicId + "|" + t.due)).size, "no duplicate sessions");
      // ---- no material -> the generator offer; no AI -> offline plan
      await act(page, "exam-plan", "ex3"); await page.waitForTimeout(400);
      ok(await vis(page, "#ppBody"), "a second exam opens a fresh planner");
      await page.fill("#ppAdd", "Impressionism\nBaroque"); await page.click("[data-pp=add]"); await page.waitForTimeout(100);
      ok(/No material for Impressionism: make flashcards from your notes/.test(await txt(page, ".pp-offer")), "unmatched topics get an offer: " + (await txt(page, ".pp-offer")).slice(0, 90));
      const nAi = ctx.aiCalls.length;
      await page.click("#ppCreate"); await page.waitForTimeout(500);
      const s3 = await sessions(page, "ex3"); ok(s3.length >= 4 && ctx.aiCalls.length === nAi, "offline: plan made with no AI call");
      ok(s3.every(t => t.notes && t.notes.length > 10), "with a one-line instruction on each");
      await act(page, "exam-plan", "ex3"); await page.waitForTimeout(300);
      await page.click(".pp-cov [data-pp=gen]"); await page.waitForTimeout(500);
      ok(!(await vis(page, "#ppBody")) && /Create|Flashcards|study set|Make/i.test(await page.evaluate(() => document.body.innerText)), "the offer opens the existing card generator (no automatic spend)");
      ok(ctx.aiCalls.length === nAi, "and made no AI call");
      await page.keyboard.press("Escape");
      ok(page.errs.length === 0, "no page errors: " + page.errs.join("; "));
      await ctx.close();
    }

    // ---- with AI set up: the topics flow, wording only
    if (!process.env.ONLY) {
      console.log("== AI stub");
      const {ctx, page} = await mk(browser, 1280, 800, {ai: true});
      await act(page, "exam-plan", "ex1"); await page.waitForTimeout(500);
      ok(await vis(page, "[data-pp=aifind]") && await vis(page, "[data-pp=ai]"), "AI controls appear when AI is set up");
      const first = await page.evaluate(() => [...document.querySelectorAll("[data-pn]")].map(i => i.value));
      ctx.aiReply = {sessions: []};
      // compute the plan once to learn session ids, then answer with wording for the first two
      const plan = await page.evaluate(() => ({sessions: SBPREP._state().out.sessions}));
      ctx.aiReply = {sessions: plan.sessions.slice(0, 2).map((s, i) => ({id: s.id, text: i ? "Do not change this: " : "Sketch the cardiac cycle from memory, then label each drug's site of action."})).map((x, i) => i ? {id: x.id, text: "Stay organized and keep up the good work!"} : x)};
      const before = plan.sessions[0];
      await page.click("#ppCreate"); await page.waitForTimeout(1000);
      ok(ctx.aiCalls.length === 1 && /examplan|Sessions \(id/.test(JSON.stringify(ctx.aiCalls[0])), "one AI call, for wording only");
      ok(/never change them/.test(JSON.stringify(ctx.aiCalls[0].systemInstruction)), "the prompt tells the model the dates, lengths and material are fixed");
      const ss = await sessions(page); const first1 = ss.find(t => t.due === before.date && t.kind === before.kind && t.topicId === (before.topicIds[0]));
      ok(first1 && /Sketch the cardiac cycle/.test(first1.notes) && Math.round(first1.hours * 60) === before.min && first1.due === before.date, "AI wording replaces the instruction but never the date or the minutes");
      ok(ss.filter(t => /Stay organized/.test(t.notes)).length === 0, "generic AI filler is rejected and the standard line kept");
      await ctx.close();
    }
    // ---- a captured exam offers the planner; Add & Plan Prep; exam passed
    if (!process.env.ONLY) {
      console.log("== capture and Add sheet");
      const {ctx, page} = await mk(browser, 1280, 800);
      await act(page, "new-task"); await page.waitForTimeout(300);
      await page.selectOption("#tfType", "Exam"); await page.fill("input[name=title]", "Quiz two"); await page.fill("input[name=due]", plus(6));
      ok(await vis(page, "#tfPlanPrep"), "the New exam form offers Add & Plan Prep");
      await page.click("#tfPlanPrep"); await page.waitForTimeout(700);
      ok(await vis(page, "#ppBody"), "the planner opens after the exam is added");
      await page.keyboard.press("Escape"); await page.waitForTimeout(200);
      const made = (await store(page)).tasks.find(t => t.title === "Quiz two"); ok(made && made.type === "Exam" && !(await sessions(page, made.id)).length, "the exam exists; no plan until you create one");
      // an exam captured from text offers the planner after it is created
      await goBoard(page);
      await page.fill("#qaIn", "midterm bio 101 oct 28 9am"); await page.press("#qaIn", "Enter"); await page.waitForTimeout(1200);
      const cap = (await store(page)).tasks.find(t => /midterm/i.test(t.title) && t.due === "2026-10-28");
      ok(cap && cap.type === "Exam" && cap.time === "09:00", "captured: " + JSON.stringify(cap && [cap.title, cap.type, cap.due, cap.time]));
      ok(await vis(page, "#toast.show") && /Plan My Prep/.test(await txt(page, "#toastExtra")), "the capture toast offers Plan My Prep after creating the exam");
      await page.click("#toastExtra"); await page.waitForTimeout(500);
      ok(await vis(page, "#ppBody") && /Plan My Prep/.test(await txt(page, "#ppTitle")) && (await page.evaluate(() => SBPREP._state().exId)) === cap.id, "which opens the planner on that exam");
      ok((await page.evaluate(() => document.querySelector("#ppDue").value)) === "2026-10-28" && (await page.evaluate(() => document.querySelector("#ppTime").value)) === "09:00", "prefilled with the captured date and time");
      await page.keyboard.press("Escape");
      await ctx.close();
    }
    {
      console.log("== exam passed and the Today prompt");
      const {ctx, page} = await mk(browser, 1280, 800);
      await goBoard(page);
      ok(/Midterm/.test(await txt(page, ".pp-today")) && /Plan My Prep/.test(await txt(page, ".pp-today")), "Today offers the planner once for an exam within 21 days with no plan: " + (await txt(page, ".pp-today")).replace(/\n/g, " ").slice(0, 120));
      await page.click(".pp-today [data-act=prep-dismiss]"); await page.waitForTimeout(300);
      ok(!/Midterm/.test(await txt(page, ".pp-today")), "Not now silences it for that exam");
      await act(page, "exam-plan", "ex1"); await page.waitForTimeout(400); await page.click("#ppCreate"); await page.waitForTimeout(500);
      ok((await sessions(page)).length >= 4, "a plan for the exam: " + (await sessions(page)).length);
      await ctx.clock.setSystemTime(new Date(2026, 9, 16, 10, 0, 0)); await page.reload(); await page.waitForTimeout(1500);
      await goBoard(page); await page.waitForFunction(() => /passed/.test((document.querySelector(".pp-today") || {innerText: ""}).innerText), null, {timeout: 8000}).catch(() => {});
      ok(/passed/.test(await txt(page, ".pp-today")), "after the exam: 'How did it go?' " + (await txt(page, ".pp-today")).replace(/\n/g, " ").slice(0, 300));
      await page.click(".pp-today [data-act=prep-wrap]"); await page.waitForTimeout(900);
      const ex = await exam(page); ok(ex.status === "done" && ex.prep.archived, "wrapping up marks the exam done and archives its plan");
      ok((await sessions(page)).every(t => t.status === "done"), "unused sessions are removed (and are in Recently Deleted)");
      ok(await vis(page, "#dlg[open]") && /mark/i.test(await txt(page, "#dlg")), "and opens 'Add Your Mark'");
      await ctx.close();
    }
  } finally { await browser.close(); }
  console.log(`examprep.e2e.js: ${n} checks passed. Screenshots in ${OUT}`);
})().catch(e => { console.error(e); process.exit(1); });
