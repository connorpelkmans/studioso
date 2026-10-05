// Browser test for Quick Add Files, learning objectives and the companion's file search.
// Run: node tests/quickadd.e2e.js [outDir]    (Playwright + Chromium; file storage and the AI network call are stubbed)
// Covers: Quick Add (sorted by keywords with no AI, fix a guess, save into the right folders, undo), sorting with AI, objectives found in an
// uploaded syllabus and reviewed, edited, checked off, coverage, flashcards per objective, objectives as Exam Prep topics, and
// SBSEARCH.retrieve (the retrieval the companion now shares with Search Everywhere's Ask With AI) finding text inside a file and a note.
const path = require("path"), fs = require("fs"), assert = require("assert"), os = require("os");
const {chromium} = require(process.env.PW_MODULE || "/opt/node-tools/node_modules/playwright");
const FILE = "file://" + path.join(__dirname, "..", "index.html");
const OUT = process.argv[2] || fs.mkdtempSync(path.join(os.tmpdir(), "sbqadd-"));
fs.mkdirSync(OUT, {recursive: true});
const exe = fs.existsSync("/opt/pw-browsers/chromium") ? "/opt/pw-browsers/chromium" : undefined;
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const NOW = new Date(2026, 9, 4, 10, 0, 0);
const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const plus = k => { const d = new Date(NOW); d.setDate(d.getDate() + k); return iso(d); };
const SEED = {v: 2,
  courses: [{id: "c1", name: "Biology", code: "BIO 101", instructor: "Dr. Jane Okafor", color: "#3B6FE0"}, {id: "c2", name: "Calculus II", code: "MATH 152", instructor: "Prof. Lee Chen", color: "#1E9E74"}],
  tasks: [{id: "ex1", title: "Midterm", courseId: "c1", type: "Exam", due: plus(10), time: "09:00", weight: 30, status: "todo", start: plus(10)}],
  decks: [], notes: [{id: "n1", text: "Mitochondria produce ATP through the Krebs cycle and the electron transport chain", courseId: "c1", x: 40, y: 40, rot: 0, color: "yellow", z: 1}],
  files: [], events: [], settings: {capacity: 15, dailyHours: 3}, updated: 1};
const SYLLABUS = "BIO 101 Syllabus\nInstructor: Dr. Jane Okafor\nOffice hours: Tuesdays 2-4\nGrading policy: exams 50%\n\nLearning Objectives\nBy the end of this course, students will be able to:\n- Describe the structure of the cell membrane\n- Explain how the Krebs cycle produces ATP\n- Compare mitosis and meiosis\n- Solve genetics problems using Punnett squares\n\nCourse schedule\nWeek 1: Cells";
const HW = "Calculus II homework 3. Due Friday Oct 9. Submit through Canvas. 20 points. Integrals and series.";
const MYSTERY = "hello there";

async function mk(browser, w, h, ai) {
  const ctx = await browser.newContext({viewport: {width: w, height: h}});
  await ctx.clock.install({time: NOW});
  await ctx.addInitScript(([seed, ai]) => {
    try { if (!sessionStorage.getItem("seeded")) { sessionStorage.setItem("seeded", "1"); localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "1"); localStorage.setItem("coursework:v2", JSON.stringify(seed));
      if (ai) { localStorage.setItem("studyboard:aiKeys", JSON.stringify({gemini: "AIzaTESTTESTTESTTESTTESTTEST12345"})); localStorage.setItem("studyboard:aiConsent", JSON.stringify({gemini: {v: 1, at: 1}})); } } } catch (e) {}
  }, [SEED, !!ai]);
  ctx.aiCalls = [];
  await ctx.route(/generativelanguage\.googleapis\.com/, route => {
    const body = JSON.parse(route.request().postData() || "{}"), sys = ((body.systemInstruction || {}).parts || [{}])[0].text || "";
    ctx.aiCalls.push({sys, text: JSON.stringify(body.contents)});
    let reply = {};
    if (/file documents/.test(sys)) reply = {files: [{n: 1, courseId: "c1", type: "syllabus", confidence: 0.9}, {n: 2, courseId: "c2", type: "assignment", confidence: 0.9}, {n: 3, courseId: "c1", type: "reading", confidence: 0.7}]};
    else if (/learning objectives out of/.test(sys)) reply = {objectives: ["Describe the structure of the cell membrane", "Explain how the Krebs cycle produces ATP", "Invent a new moon base"]};
    else if (/flashcards/.test(sys)) reply = {deckTitle: "Objectives", cards: [{front: "What does the Krebs cycle produce?", back: "ATP, NADH and FADH2", source: "O1 · Slide 2"}, {front: "Name one product of mitosis", back: "Two identical daughter cells", source: "O2"}]};
    route.fulfill({status: 200, contentType: "application/json", body: JSON.stringify({candidates: [{content: {parts: [{text: JSON.stringify(reply)}]}, finishReason: "STOP"}]})});
  });
  const page = await ctx.newPage(); page.errs = [];
  page.on("pageerror", e => page.errs.push(e.message));
  await page.goto(FILE); await page.waitForTimeout(1500);
  // File storage is stubbed: uploads succeed and Studyboard keeps the bytes in memory
  await page.evaluate(() => {
    window.__bytes = {};
    __sbQadd.caps.assets = {upload: async (f, o) => { const id = "a" + Math.random().toString(36).slice(2, 8); window.__bytes[id] = new Uint8Array(await f.arrayBuffer()); return {id, sizeBytes: f.size, contentType: o.type}; }, delete: async () => {}};
    __sbQadd.setAssetBytes(async id => window.__bytes[id]);
    window.__sxBytes = async id => window.__bytes[id] || null;
    __sbQadd.render();
  });
  return {ctx, page};
}
const files = page => page.evaluate(() => Object.values(__sbQadd.state().files).map(f => ({name: f.name, courseId: f.courseId, folderId: f.folderId, ftype: f.ftype || ""})));
const course = (page, id) => page.evaluate(i => JSON.parse(JSON.stringify(__sbQadd.state().courses[i])), id);
const vis = (page, sel) => page.evaluate(s => { const e = document.querySelector(s); return !!e && !!(e.offsetWidth || e.offsetHeight); }, sel);
const goTab = async (page, t) => { await page.evaluate(t => { const b = document.querySelector(`[data-tab="${t}"]`); if (b) b.click(); }, t); await page.waitForTimeout(250); };
const goCourse = async (page, id) => { await goTab(page, "courses"); await page.evaluate(i => { __sbQadd.ui.courseId = i; __sbQadd.render(); }, id); await page.waitForTimeout(250); };
const noHScroll = page => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
const pick = (page, list) => page.setInputFiles("#qaIn", list.map(([name, text]) => ({name, mimeType: "text/plain", buffer: Buffer.from(text)})));

(async () => {
  const browser = await chromium.launch({executablePath: exe});
  try {
    for (const [W, H] of [[1280, 800], [390, 844]]) {
      const tag = W + "w";
      console.log("== " + W + " wide, no AI");
      const {ctx, page} = await mk(browser, W, H, false);
      await goTab(page, "files");
      ok(await vis(page, '[data-act="f-quick"]'), "the Files tab has Quick Add");
      await page.click('[data-act="f-quick"]'); await page.waitForTimeout(300);
      ok(await vis(page, "#qaDrop"), "the Quick Add sheet opens with a drop area and no course or type to pick");
      await pick(page, [["BIO101_syllabus.txt", SYLLABUS], ["hw3.txt", HW], ["scan.txt", MYSTERY]]);
      await page.waitForFunction(() => document.querySelectorAll(".qa-row select[data-qa-kind]").length === 3, null, {timeout: 8000});
      const rows = () => page.evaluate(() => [...document.querySelectorAll(".qa-row")].map(r => ({name: r.querySelector(".qa-name").firstChild.textContent.trim(), course: r.querySelector("[data-qa-course]").value, kind: r.querySelector("[data-qa-kind]").value, warn: !!r.querySelector(".qa-why.warn")})));
      let r = await rows();
      ok(r[0].course === "c1" && r[0].kind === "syllabus", "syllabus: filed under Biology as a syllabus by its words: " + JSON.stringify(r[0]));
      ok(r[1].course === "c2" && r[1].kind === "assignment", "homework: Calculus II, assignment: " + JSON.stringify(r[1]));
      ok(r[2].course === "" && r[2].kind === "other" && r[2].warn, "an unclear file is flagged for a check");
      ok(!await page.evaluate(() => document.querySelector("#qaAI")), "no AI toggle without AI set up");
      if (W === 390) { ok(await noHScroll(page), "no sideways scroll at phone width"); ok(await page.evaluate(() => { const d = document.querySelector("#dlg"); return d.scrollWidth <= d.clientWidth + 1; }), "sheet fits the phone"); }
      await page.screenshot({path: path.join(OUT, `quickadd-${tag}.png`)});
      // fix the wrong guess: the unclear file is Biology notes
      await page.selectOption('.qa-row:nth-child(3) [data-qa-course]', "c1"); await page.selectOption('.qa-row:nth-child(3) [data-qa-kind]', "notes");
      ok((await page.textContent("#qaSave")).includes("Add 3 Files"), "the button counts the files");
      await page.click("#qaSave"); await page.waitForTimeout(1500);
      let fs_ = await files(page);
      const by = n => fs_.find(f => f.name === n) || {};
      ok(fs_.length === 3, "three files saved");
      ok(by("BIO101_syllabus.txt").courseId === "c1" && by("BIO101_syllabus.txt").folderId === "syllabus", "syllabus in Biology > Syllabus");
      ok(by("hw3.txt").courseId === "c2" && by("hw3.txt").folderId === "assignments", "homework in Calculus II > Assignments");
      ok(by("scan.txt").courseId === "c1" && by("scan.txt").folderId === "notes" && by("scan.txt").ftype === "notes", "the fixed file went where the person chose");
      ok(page.errs.length === 0, "no page errors: " + page.errs.join("; "));
      // learning objectives were found in the syllabus and offered, not added
      await page.waitForFunction(() => window.SBOBJ && SBOBJ.pending("c1"), null, {timeout: 8000});
      ok((await page.evaluate(() => SBOBJ.pending("c1").list)).length === 4, "four objectives found in the syllabus text");
      ok((await course(page, "c1")).objectives === undefined, "nothing is added until the person reviews them");
      await goCourse(page, "c1");
      ok(await vis(page, ".obj-pend"), "the course page offers the suggested objectives");
      await page.click('[data-act="obj-review"]'); await page.waitForTimeout(300);
      ok((await page.$$("[data-rv]")).length === 4, "the review sheet lists them");
      await page.fill('[data-rt="2"]', "Compare mitosis and meiosis in detail");
      await page.uncheck('[data-rv="3"]');
      await page.click("#rvAdd"); await page.waitForTimeout(400);
      let objs = (await course(page, "c1")).objectives;
      ok(objs.length === 3 && objs[2].text === "Compare mitosis and meiosis in detail", "reviewed objectives saved, edit kept, unticked one left out");
      ok(await vis(page, ".obj-list"), "listed on the course page");
      ok((await page.textContent(".obj-bar")).includes("0 of 3"), "progress shows");
      // coverage: the Krebs objective is matched by the note and the (searchable) file; Punnett has none
      const covTxt = await page.evaluate(() => [...document.querySelectorAll(".obj-li")].map(li => li.innerText.replace(/\s+/g, " ")));
      ok(/1 note/.test(covTxt[1]), "the Krebs objective shows the note that covers it: " + covTxt[1]);
      ok(/No material yet/.test(covTxt[0]) || /file/.test(covTxt[0]), "an objective with nothing shows a gap or its file: " + covTxt[0]);
      // mastered
      await page.click('.obj-li:nth-child(1) input[data-act="obj-done"]'); await page.waitForTimeout(300);
      ok((await course(page, "c1")).objectives[0].done === true && (await page.textContent(".obj-bar")).includes("1 of 3"), "check one off as mastered");
      ok(await page.evaluate(() => document.querySelector(".obj-li.done") !== null), "mastered rows are marked");
      // edit: change one, add one, remove one
      await page.click('[data-act="obj-edit"]'); await page.waitForTimeout(300);
      await page.fill('#oeList li:nth-child(2) [data-ot]', "Explain the Krebs cycle");
      await page.click("#oeAdd"); await page.keyboard.type("Define osmosis"); await page.click('#oeList li:nth-child(3) [data-orm]');
      await page.click("#oeSave"); await page.waitForTimeout(400);
      objs = (await course(page, "c1")).objectives;
      ok(objs.length === 3 && objs[1].text === "Explain the Krebs cycle" && objs[2].text === "Define osmosis" && objs[0].done === true, "edit sheet: changed, added, removed, mastered kept");
      // exam prep offers the unmastered objectives as topics
      const names = await page.evaluate(() => SBOBJ.topicNames("c1"));
      ok(names.length === 2 && names.includes("Krebs cycle") && !names.some(x => /membrane/i.test(x)), "Exam Prep gets the objectives that aren't mastered: " + names.join(" | "));
      await page.screenshot({path: path.join(OUT, `objectives-${tag}.png`)});
      // retrieval shared with Search Everywhere's Ask With AI: text inside a stored file and a note
      await page.waitForTimeout(500);
      const hit = await page.evaluate(async () => { const x = await SBSEARCH.retrieve("what are Punnett squares used for"); return {text: x.text, src: x.src}; });
      ok(/Punnett/i.test(hit.text), "retrieve finds text inside an uploaded file: " + hit.src.join(" | "));
      const hit2 = await page.evaluate(async () => (await SBSEARCH.retrieve("which cycle makes ATP in mitochondria")).text);
      ok(/Krebs/i.test(hit2), "and in a sticky note");
      ok(page.errs.length === 0, "no page errors at the end: " + page.errs.join("; "));
      await ctx.close();
    }

    console.log("== with AI");
    {
      const {ctx, page} = await mk(browser, 1280, 800, true);
      await goTab(page, "files");
      await page.click('[data-act="f-quick"]'); await page.waitForTimeout(300);
      ok(await vis(page, "#qaAI"), "AI toggle shows when AI is set up");
      await pick(page, [["notes_a.txt", SYLLABUS], ["b.txt", HW], ["c.txt", MYSTERY]]);
      await page.waitForFunction(() => document.querySelectorAll(".qa-row .qa-why").length === 3 && /Sorted by AI/.test(document.querySelector(".qa-list").innerText), null, {timeout: 8000});
      const r = await page.evaluate(() => [...document.querySelectorAll(".qa-row")].map(r => [r.querySelector("[data-qa-course]").value, r.querySelector("[data-qa-kind]").value]));
      ok(JSON.stringify(r) === JSON.stringify([["c1", "syllabus"], ["c2", "assignment"], ["c1", "reading"]]), "AI picks the course and type: " + JSON.stringify(r));
      ok(ctx.aiCalls.length === 1 && /file documents/.test(ctx.aiCalls[0].sys), "one AI call for all three files");
      ok(/Punnett/.test(ctx.aiCalls[0].text) && /Calculus II homework/.test(ctx.aiCalls[0].text), "it sent the start of each file's text");
      await page.click("#qaSave"); await page.waitForTimeout(1500);
      const f = await files(page);
      ok(f.find(x => x.name === "c.txt").folderId === "other" && f.find(x => x.name === "c.txt").ftype === "reading", "a reading is filed under Other and remembers its type");
      // AI objectives: kept only if the text supports them (the invented one is dropped)
      await page.waitForFunction(() => window.SBOBJ && SBOBJ.pending("c1"), null, {timeout: 8000});
      const list = await page.evaluate(() => SBOBJ.pending("c1").list);
      ok(list.length >= 4 && !list.some(x => /moon base/i.test(x)), "AI and keyword objectives merged without repeats, invented ones dropped: " + list.length);
      ok(new Set(list.map(x => x.toLowerCase())).size === list.length, "no repeats");
      await goCourse(page, "c1");
      await page.click('[data-act="obj-review"]'); await page.waitForTimeout(300); await page.click("#rvAdd"); await page.waitForTimeout(400);
      // flashcards per objective
      await page.click('[data-act="obj-cards"]'); await page.waitForTimeout(500);
      ok(await vis(page, "#ocGo"), "the flashcards sheet opens");
      ok((await page.$$("[data-oc]")).length >= 4 && (await page.$$("[data-of]")).length >= 1, "lists the objectives and the course's files");
      await page.click("#ocGo"); await page.waitForTimeout(2000);
      const dk = await page.evaluate(() => Object.values(__sbQadd.state().decks).map(d => ({name: d.name, courseId: d.courseId, cards: d.cards.map(c => ({front: c.front, obj: c.obj, src: c.src}))})));
      ok(dk.length === 1 && dk[0].name === "BIO 101 Objectives" && dk[0].courseId === "c1" && dk[0].cards.length === 2, "cards saved in an objectives deck for the course: " + JSON.stringify(dk));
      const objs = (await course(page, "c1")).objectives;
      ok(dk[0].cards[0].obj === objs[0].id && dk[0].cards[1].obj === objs[1].id && dk[0].cards[0].src === "Slide 2", "each card is linked to its objective");
      const li = await page.evaluate(() => [...document.querySelectorAll(".obj-li")].map(x => x.innerText.replace(/\s+/g, " ")));
      ok(/1 card/.test(li[0]) && /1 card/.test(li[1]), "coverage shows the new cards: " + li[0]);
      ok(ctx.aiCalls.some(c => /flashcards/.test(c.sys) && /O1\. /.test(c.text)), "one AI call carried every objective");
      // the companion's chat now sees inside files, through the same retrieval as Search Everywhere's Ask With AI
      ctx.aiCalls.length = 0;
      await page.evaluate(() => { SBCOMPTAB.open("What are Punnett squares used for in my files?"); });
      await page.waitForFunction(() => document.querySelector(".cpt-a:not(.cpt-wait)"), null, {timeout: 10000}).catch(() => {});
      const chat = ctx.aiCalls.find(c => /study companion/.test(c.sys));
      ok(!!chat && /SEARCH RESULTS/.test(chat.text) && /Punnett squares/.test(chat.text), "the companion chat's prompt carries passages found inside the uploaded file");
      ok(page.errs.length === 0, "no page errors: " + page.errs.join("; "));
      await ctx.close();
    }
    console.log(`\nquickadd.e2e: ${n} checks passed`);
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
