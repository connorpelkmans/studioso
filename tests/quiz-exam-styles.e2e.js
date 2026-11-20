// node tests/quiz-exam-styles.e2e.js: the quiz creator's Exam Style, Question Formats and Focus reach the AI as instructions,
// suited to the student's field, and a quiz made that way plays like the exam (here USMLE Step 1: a clinical vignette and
// 5 options; and NCLEX: select-all-that-apply). The AI is stood in for; the request it gets is checked word for word.
const {chromium, executablePath} = require("./pw");
const path = require("path"), fs = require("fs"), http = require("http");
const ROOT = path.join(__dirname, "..");
const MIME = {".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".css": "text/css", ".svg": "image/svg+xml", ".woff2": "font/woff2"};
const server = http.createServer((req, res) => {
  let f; try { f = path.join(ROOT, decodeURIComponent(new URL(req.url, "http://x").pathname)); } catch (e) { res.writeHead(400); res.end(); return; }
  if (!f.startsWith(ROOT + path.sep) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
let fails = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fails++; };
const VIGNETTE = "A 24-year-old woman comes to the emergency department because of a 2-day history of fever, flank pain and painful urination. Her temperature is 39.2°C (102.6°F), pulse is 112/min and blood pressure is 104/66 mm Hg. There is tenderness at the right costovertebral angle. Urinalysis shows white blood cell casts.";
const QUIZ = {title: "Renal Infections", questions: [
  {type: "single", stem: VIGNETTE + " Which of the following is the most likely route by which the causal organism reached the kidney?", options: ["Ascending infection from the bladder", "Hematogenous spread from the skin", "Lymphatic spread from the bowel", "Direct extension from the liver", "Reactivation of latent infection"], correct: [0], rationale: "Most pyelonephritis is ascending, from the urethra and bladder.", optionNotes: ["Right: ascending.", "Rare.", "Rare.", "Not adjacent.", "Not latent."], topic: "Pyelonephritis"},
  {type: "multiple", stem: "Which findings support acute pyelonephritis over cystitis? Select all that apply.", options: ["Fever", "White blood cell casts", "Costovertebral angle tenderness", "Suprapubic pain alone", "Dysuria alone"], correct: [0, 1, 2], rationale: "Systemic signs, WBC casts and CVA tenderness point to the kidney.", optionNotes: ["Yes.", "Yes.", "Yes.", "Cystitis.", "Cystitis."], topic: "Pyelonephritis"}]};
const NOTES = "Pyelonephritis: an infection of the kidney, usually ascending from the bladder (E. coli most often). Fever, flank pain, costovertebral angle tenderness and white blood cell casts in the urine set it apart from cystitis.";

(async () => {
  await new Promise(r => server.listen(0, "127.0.0.1", r));
  const port = server.address().port, b = await chromium.launch({executablePath});
  const run = async (area, picks, course) => {
    const ctx = await b.newContext({viewport: {width: 1100, height: 1000}, serviceWorkers: "block"}), sent = [];
    await ctx.route(/generativelanguage\.googleapis\.com/, async route => {
      let body = {}; try { body = JSON.parse(route.request().postData() || "{}"); } catch (e) {}
      sent.push(body);
      await route.fulfill({status: 200, contentType: "application/json", body: JSON.stringify({candidates: [{content: {parts: [{text: JSON.stringify(QUIZ)}]}, finishReason: "STOP"}]})});
    });
    const seed = {v: 2, updated: 1, tasks: [], files: [], notes: [], events: [], decks: [], settings: {area}, courses: [{id: "c1", name: course, code: course, color: "#C9302C"}]};
    await ctx.addInitScript(s => { window.__SB_TEST = true; localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "done"); localStorage.setItem("studioso:welcomed", "1");
      if (!localStorage.getItem("coursework:v2")) localStorage.setItem("coursework:v2", JSON.stringify(s));
      localStorage.setItem("studyboard:aiKeys", JSON.stringify({gemini: "AIzaTESTTESTTESTTESTTESTTEST12345"})); localStorage.setItem("studyboard:aiConsent", JSON.stringify({gemini: {v: 1, at: 1}}));
      new MutationObserver(() => document.querySelectorAll(".cpu,.cp").forEach(x => { try { x.hidePopover(); } catch (e) {} x.remove(); })).observe(document, {childList: true, subtree: true}); }, seed);
    const p = await ctx.newPage(); p._errs = []; p.on("pageerror", e => p._errs.push(e.message));
    await p.goto(`http://127.0.0.1:${port}/index.html`); await p.waitForFunction(() => window.__sbSync, null, {timeout: 20000}); await p.waitForTimeout(500);
    await p.evaluate(() => { const S = window.__sbSync; S.ui.filter = "c1"; const x = document.createElement("button"); x.dataset.act = "qz-ai"; document.body.appendChild(x); x.click(); x.remove(); });
    await p.waitForSelector("#dlg[open] #aiStylePick");
    await p.evaluate(t => { const d = document.querySelector("#dlg details"); if (d) d.open = true; const a = document.querySelector("#aiPaste"); a.value = t; a.dispatchEvent(new Event("input", {bubbles: true})); }, NOTES);
    for (const f of picks.formats || []) await p.click(`#dlg .ai-fmt[data-fmt="${f}"]`);
    if (picks.exam) await p.selectOption("#aiExam", picks.exam);
    if (picks.focus) await p.selectOption("#aiFocus", picks.focus);
    const offered = await p.evaluate(() => [...document.querySelectorAll("#aiExam option")].map(o => o.value).filter(Boolean));
    await p.click("#aiGo");
    await p.waitForSelector("dialog[open] #arSave", {timeout: 20000}).catch(() => {});
    const text = sent.map(x => JSON.stringify(x)).join(" ");
    return {ctx, p, sent, text, offered};
  };

  // 1. Health (pre-med course): USMLE Step 1, with Multiple Choice and Select All That Apply, and a Pathophysiology focus
  const A = await run({id: "health", text: ""}, {formats: ["mc", "sata"], exam: "step1", focus: "patho"}, "Pathology 301");
  ok(A.sent.length >= 1, "the quiz request went to the AI: " + A.sent.length);
  ok(/USMLE Step 1 style: a 3 to 6 sentence clinical vignette/.test(A.text) && /One best answer from 5 plausible options/.test(A.text), "the USMLE Step 1 instructions are in the request");
  ok(/Use a mix of these question formats: Multiple Choice, Select All That Apply/.test(A.text) && /Single best answer multiple choice/.test(A.text) && /Select-all-that-apply questions/.test(A.text), "both question formats are asked for");
  ok(/Focus on disease mechanisms/.test(A.text), "and the Pathophysiology focus");
  ok(/follow them exactly/.test(A.text) && /never copying or closely imitating its actual questions/.test(A.text), "styles come first, written as new questions (never copied from the real exam)");
  ok(/nursing or health sciences/.test(A.text), "the AI is told the student's field");
  // the review, then the quiz itself
  ok(await A.p.locator("dialog[open] #arSave").count() === 1, "the review opens with the questions");
  const nm = await A.p.inputValue("#arQuizName").catch(() => "");
  ok(/USMLE Step 1/.test(nm) || /Renal/.test(nm), "the quiz is named after the exam style (or the AI's title): " + nm);
  await A.p.click("#arSave"); await A.p.waitForTimeout(500);
  await A.p.evaluate(() => { const S = window.__sbSync; S.ui.tab = "flashcards"; S.ui.rvView = "quizzes"; S.render(); }); await A.p.waitForTimeout(300);
  await A.p.click('.rv-quiz [data-act="ai-quiz-start"]'); await A.p.waitForTimeout(600);
  // the quiz plays its questions in a shuffled order: check whichever comes first against what it should look like
  const shown = await A.p.evaluate(() => ({stem: (document.querySelector("#view") || {}).innerText || "", opts: document.querySelectorAll("#view button.opt").length}));
  if (/24-year-old woman/.test(shown.stem)) {
    ok(/costovertebral/.test(shown.stem) && shown.opts === 5, "the vignette question shows the whole vignette and 5 options, as on Step 1: " + shown.opts);
  } else {
    ok(/Select all that apply/i.test(shown.stem) && shown.opts === 5, "the select-all question shows its 5 options: " + shown.opts);
  }
  const saved = await A.p.evaluate(() => { const d = Object.values(window.__sbSync.state.decks).find(x => (x.aiQuizzes || []).length); const qs = d ? d.aiQuizzes[0].questions : []; return qs.map(q => ({type: q.type, n: q.options.length, vig: /24-year-old/.test(q.stem)})); });
  ok(saved.some(q => q.type === "single" && q.n === 5 && q.vig) && saved.some(q => q.type === "multiple" && q.n === 5), "the saved quiz keeps the vignette with 5 options and the select-all item: " + JSON.stringify(saved));
  await A.p.screenshot({path: "/tmp/quiz-usmle.png"});
  ok(!A.p._errs.length, "no page errors: " + A.p._errs.join(" | "));
  await A.ctx.close();

  // 2. Nursing: NCLEX-RN is offered and sent; a business student never sees it
  const N = await run({id: "health", text: ""}, {formats: ["sata"], exam: "nclex"}, "NURS 210");
  ok(N.offered.includes("nclex") && /NCLEX-RN style: client-centered stems/.test(N.text), "nursing: NCLEX-RN is offered and its instructions are sent");
  await N.ctx.close();
  const Bz = await run({id: "business", text: ""}, {exam: "cpa"}, "ACCT 201");
  ok(!Bz.offered.includes("nclex") && !Bz.offered.includes("step1") && Bz.offered.includes("cpa") && /CPA exam style/.test(Bz.text), "business: CPA offered and sent, no NCLEX or USMLE: " + Bz.offered.join(", "));
  ok(!/nursing or health sciences/.test(Bz.text) && /business and economics/.test(Bz.text), "and the AI is told it's business");
  await Bz.ctx.close();
  // 3. A field typed by the student: general styles only
  const C = await run({id: "other", text: "Marine Biology"}, {formats: ["short"]}, "MBIO 101");
  ok(C.offered.join() === "midterm,final", "a typed field gets the general exam styles only: " + C.offered.join(", "));
  const styleOf = t => { const m = /Student's style and instructions[^:]*:(.*?)Difficulty:/.exec(t); return m ? m[1] : ""; }, cs = styleOf(C.text);
  ok(/Short-answer questions that need a 1 to 3 sentence explanation/.test(cs) && !/USMLE|NCLEX|CPA|MCAT/.test(cs), "and its style instructions have only what was picked: " + cs.slice(0, 140));
  await C.ctx.close();

  await b.close(); server.close();
  console.log(fails ? `quiz-exam-styles.e2e: ${fails} FAILED` : "quiz-exam-styles.e2e: all passed");
  process.exitCode = fails ? 1 : 0;
})().catch(e => { console.error(e); process.exit(1); });
