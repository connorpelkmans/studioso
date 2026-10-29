// node tests/release-fixes.e2e.js [shotsDir] (Playwright + Chromium)
// Exam-aware flashcards spread over the week before an exam that matters, streak rewards from study days, the reflection
// offered for marks from any source, readiness kept with the exam, per-exam readiness, the forecast reading Today's Plan,
// focus time on group tasks, and one Heads Up block.
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const root = path.join(__dirname, ".."), SHOTS = process.argv[2] || "";
const MIME = {".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".webmanifest": "application/manifest+json", ".png": "image/png", ".css": "text/css", ".woff2": "font/woff2", ".svg": "image/svg+xml"};
const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x"); let p = decodeURIComponent(u.pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  res.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const addD = n => { const d = new Date(); d.setDate(d.getDate() + n); return iso(d); };
const DAY = 864e5;
const mk = (id, title, type, due, o) => Object.assign({id, title, courseId: "c1", type, due: due == null ? "" : addD(due), start: addD(-3), hours: type === "Exam" || type === "Quiz" ? null : 2, status: "todo", priority: "med", created: Date.now() - 20 * DAY, checklist: [], history: []}, o || {});
const card = (id, o) => Object.assign({id, front: "Q " + id, back: "A " + id, box: 1, due: addD(3), last: addD(-1), seen: 3, right: 1, wrong: 2, rate: "hard"}, o || {});
const COURSES = [{id: "c1", name: "Biology", code: "BIO 101", color: "#3B6FE0"}, {id: "c2", name: "Chemistry", code: "CHEM 110", color: "#D9822B"}, {id: "c3", name: "History", code: "HIS 200", color: "#1E9E74"}];
const inPerson = {remote: "no", remoteSrc: "user"};
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  const open = async (seed, o) => {
    o = o || {};
    const ctx = await browser.newContext({viewport: o.vp || {width: 1280, height: 900}});
    await ctx.addInitScript(([seed, th]) => { window.__SB_TEST = true; try { if (!sessionStorage.getItem("seeded")) { sessionStorage.setItem("seeded", "1"); localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("studyboard:tour", "1");
      localStorage.setItem("coursework:v2", JSON.stringify(seed)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1");
      const d = new Date(), t = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); localStorage.setItem("coursework:today", JSON.stringify({d: t, h: th})); } } catch (e) {} },
      [Object.assign({v: 2, courses: COURSES, settings: {capacity: 15, dailyHours: 3}, updated: 1, notes: [], files: [], events: []}, seed), o.th || 3]);
    await ctx.clock.install({time: new Date(iso(new Date()) + "T12:00:00")});
    const page = await ctx.newPage(); page.errs = []; page.on("pageerror", e => page.errs.push(e.message));
    await page.goto(base); await page.waitForFunction(() => window.__sbPlan && window.__sbSync && document.querySelector(".focus.plan"), null, {timeout: 20000});
    await page.keyboard.press("Escape"); await page.waitForTimeout(200);
    return {ctx, page};
  };
  const act = (page, a, id, extra) => page.evaluate(([a, i, x]) => { const b = document.createElement("button"); b.dataset.act = a; if (i) b.dataset.id = i; Object.assign(b.dataset, x || {}); b.hidden = true; document.body.appendChild(b); b.click(); b.remove(); }, [a, id, extra]);
  const shot = async (page, name, sel) => { if (!SHOTS) return; await page.waitForTimeout(250); const el = sel ? page.locator(sel).first() : null; if (el && await el.count()) await el.screenshot({path: path.join(SHOTS, name + ".png")}); else await page.screenshot({path: path.join(SHOTS, name + ".png")}); };
  const done = async (ctx, page) => { ok(page.errs.length === 0, "no page errors " + page.errs.join("; ")); await ctx.close(); };
  const task = (page, id) => page.evaluate(id => window.__sbSync.state.tasks[id], id);
  try {
    { // 1. Flashcards: only exams that matter pull cards in, spread over the week before, at most 30 a day per course
      const big = {id: "dA", name: "Anatomy", courseId: "c1", created: 1, cards: Array.from({length: 120}, (_, i) => card("a" + i, {box: 4, due: addD(30), last: addD(-20), rate: "good", right: 3, wrong: 0}))};
      const small = {id: "dB", name: "Vocab", courseId: "c2", created: 2, cards: Array.from({length: 40}, (_, i) => card("v" + i, {box: 4, due: addD(30), last: addD(-20), rate: "good", right: 3, wrong: 0}))};
      const {ctx, page} = await open({tasks: [mk("ex", "Midterm", "Exam", 5, inPerson), mk("wq", "Weekly Quiz 6", "Quiz", 2, Object.assign({courseId: "c2", weight: 3}, inPerson))], decks: [big, small]});
      const due = await page.evaluate(() => Number((document.querySelector(".fc-navdue") || {}).textContent || 0));
      ok(due > 0 && due <= 30, `the midterm's 120 cards don't all come due today: ${due} today (at most 30)`);
      await act(page, "fc-review-all"); await page.waitForTimeout(300);
      const q = await page.evaluate(() => (window.__sbSync.ui.fc || {q: []}).q.map(x => x.deckId));
      ok(!q.includes("dB"), "a 3% weekly quiz doesn't pull its course's cards in");
      await done(ctx, page);
    }
    { // 2. Streak stickers follow study days: three days of focus time (no task progress) earn the 3-day sticker
      const fd = {[addD(-2)]: 30, [addD(-1)]: 30, [addD(0)]: 30};
      const {ctx, page} = await open({tasks: [mk("t1", "Essay", "Assignment", 9)], settings: {capacity: 15, dailyHours: 3, focusDays: fd, focusSess: fd, gentle: {on: true}}});
      await page.evaluate(() => { const S = window.__sbSync; S.ui.tab = "scrapbook"; S.render(); }); await page.waitForTimeout(1500);
      const txt = await page.textContent("body");
      ok(/3-Day Streak[\s\S]{0,120}Earned/.test(txt) || /3-Day Streak/.test(await page.locator(".sb-page, #view").first().innerText()), "three study days of focus time earn the 3-Day Streak sticker");
      ok(/Study 3 days in a row/.test(txt), "the sticker says it counts study days");
      await done(ctx, page);
    }
    { // 3. A mark from anywhere (here: already on the exam, as school sync would put it) is offered for reflection in Heads Up,
      //    and the reflection uses the readiness saved with the exam when it was done
      const {ctx, page} = await open({tasks: [mk("q1", "Quiz 1", "Quiz", -2, Object.assign({weight: 10, status: "done", doneAt: Date.now() - 2 * DAY, mark: {got: 31, outOf: 50}, readySnap: {felt: 75, measured: 48, at: Date.now() - 2 * DAY}}, inPerson))]});
      const row = page.locator(".plan-notes .pn-wrap");
      ok(await row.count() === 1 && /How did Quiz 1 go\? You got 62%/.test(await row.innerText()), "Heads Up offers a reflection for a mark that came in without the mark sheet");
      await row.locator('[data-act="ewr-open"]').click(); await page.waitForSelector("dialog[open] .ewr");
      const cmp = await page.locator("dialog[open] .ewr-cmp").innerText();
      ok(/How ready you felt\s*75%/.test(cmp) && /Your practice scores\s*48%/.test(cmp) && /Your mark\s*62%/.test(cmp), "the reflection uses the readiness saved with the exam: " + cmp.replace(/\s+/g, " "));
      await shot(page, "r3-reflect", "dialog[open] .sheet");
      await page.click("#ewrSkip"); await page.waitForTimeout(200);
      ok(await page.locator(".plan-notes .pn-wrap").count() === 0, "Skip removes it from Heads Up");
      await done(ctx, page);
    }
    { // 4. Marking an exam done saves how ready you were, on the exam itself (so it syncs)
      const deck = {id: "d1", name: "Cells", courseId: "c1", created: 1, cards: Array.from({length: 12}, (_, i) => card("c" + i)), quizzes: [{at: Date.now() - DAY, score: 6, total: 10}]};
      const {ctx, page} = await open({tasks: [mk("m", "Midterm", "Exam", 0, Object.assign({weight: 30, pct: 70}, inPerson))], decks: [deck]});
      await act(page, "toggle", "m"); await page.waitForTimeout(300);
      const t = await task(page, "m");
      ok(t.readySnap && t.readySnap.felt === 70 && t.readySnap.measured > 0 && t.readySnap.measured < 70, "the exam keeps how ready you felt and measured when it was marked done: " + JSON.stringify(t.readySnap));
      await done(ctx, page);
    }
    { // 5. Readiness per exam: topics from the exam's notes, the cards since the last exam, or the decks you pick; the whole course otherwise
      const cells = {id: "d1", name: "Chapters 1-3: Cells", courseId: "c1", created: 1, cards: Array.from({length: 15}, (_, i) => card("c" + i, {front: "Mitochondria function " + i, box: 4, right: 3, wrong: 0, rate: "good"}))};
      const gen = {id: "d2", name: "Chapters 4-6: Genetics", courseId: "c1", created: 2, cards: Array.from({length: 10}, (_, i) => card("g" + i, {front: "Allele dominance " + i, box: 0, right: 0, wrong: 2, rate: "again"}))};
      const {ctx, page} = await open({tasks: [mk("m2", "Midterm 2", "Exam", 8, Object.assign({weight: 30, notes: "Covers chapters 4 to 6."}, inPerson)), mk("fin", "Final Exam", "Exam", 30, Object.assign({weight: 40}, inPerson))], decks: [cells, gen]});
      await act(page, "edit-task", "m2"); await page.waitForSelector("dialog[open] .tv-ready");
      const a = await page.locator("dialog[open] .tv-ready").innerText();
      ok(/flashcards on this exam's topics \(10 of 10 studied\)/.test(a), "Midterm 2 (chapters 4-6) counts only the genetics cards: " + a.replace(/\s+/g, " ").slice(0, 160));
      const m2 = Number((/(\d+)%/.exec(a) || [])[1]);
      await page.keyboard.press("Escape"); await act(page, "edit-task", "fin"); await page.waitForSelector("dialog[open] .tv-ready");
      const f = await page.locator("dialog[open] .tv-ready").innerText(), fin = Number((/(\d+)%/.exec(f) || [])[1]);
      ok(/your flashcards for the course \(25 of 25 studied\)/.test(f) && fin > m2, `the Final counts the whole course, and reads higher than Midterm 2 (${fin}% vs ${m2}%)`);
      await page.keyboard.press("Escape"); await act(page, "edit-task", "m2"); await page.waitForSelector("dialog[open] .tv-ready");
      await page.click('dialog[open] [data-act="xr-decks"]'); await page.waitForSelector("dialog[open] .xr-sheet");
      ok(/matches this exam's topics/.test(await page.locator("dialog[open] .xr-sheet").innerText()), "the sheet says what Automatic does right now");
      await shot(page, "r5-which-cards", "dialog[open] .sheet");
      await page.locator('dialog[open] input[name="d"][value="d1"]').check({force: true});
      await page.click("dialog[open] [data-submit]"); await page.waitForTimeout(300);
      ok(JSON.stringify((await task(page, "m2")).readyDecks) === '["d1"]', "picking a deck saves it on the exam");
      await act(page, "edit-task", "m2"); await page.waitForSelector("dialog[open] .tv-ready");
      ok(/the flashcards you linked \(15 of 15 studied\)/.test(await page.locator("dialog[open] .tv-ready").innerText()), "and readiness then uses the linked deck");
      await done(ctx, page);
      // the cards made since the previous exam
      const old = {id: "d3", name: "Unit A", courseId: "c1", created: Date.now() - 40 * DAY, cards: Array.from({length: 10}, (_, i) => card("o" + i))};
      const fresh = {id: "d4", name: "Unit B", courseId: "c1", created: Date.now() - 5 * DAY, cards: Array.from({length: 8}, (_, i) => card("n" + i))};
      const o = await open({tasks: [mk("p1", "Midterm 1", "Exam", -20, Object.assign({status: "done", doneAt: Date.now() - 20 * DAY, weight: 25}, inPerson)), mk("p2", "Midterm 2", "Exam", 6, Object.assign({weight: 25}, inPerson))], decks: [old, fresh]});
      await act(o.page, "edit-task", "p2"); await o.page.waitForSelector("dialog[open] .tv-ready");
      ok(/flashcards added since Midterm 1 \(8 of 8 studied\)/.test(await o.page.locator("dialog[open] .tv-ready").innerText()), "Midterm 2 counts the cards added since Midterm 1");
      await done(o.ctx, o.page);
    }
    { // 5c. With Automatic AI on, the decks it matched to the exam's topics count; with it off (or the course's decks change), Studyboard's own matching does
      const cells = {id: "d1", name: "Cells", courseId: "c1", created: 1, cards: Array.from({length: 15}, (_, i) => card("c" + i, {front: "Mitochondria function " + i, box: 4, right: 3, wrong: 0, rate: "good"}))};
      const gen = {id: "d2", name: "Genetics", courseId: "c1", created: 2, cards: Array.from({length: 10}, (_, i) => card("g" + i, {front: "Allele dominance " + i, box: 0, right: 0, wrong: 2, rate: "again"}))};
      const seed = {tasks: [mk("m2", "Midterm 2", "Exam", 8, Object.assign({weight: 30, aiDecks: {ids: ["d2"], sig: "d1,d2|0", at: Date.now() - DAY}}, inPerson))], decks: [cells, gen]};
      const read = async page => { await act(page, "edit-task", "m2"); await page.waitForSelector("dialog[open] .tv-ready"); const a = await page.locator("dialog[open] .tv-ready").innerText(); await page.keyboard.press("Escape"); return a.replace(/\s+/g, " "); };
      let o = await open(seed);
      ok(/your flashcards for the course \(25 of 25 studied\)/.test(await read(o.page)), "with AI off, readiness falls back to the whole course");
      await o.page.evaluate(() => { window.__sbForceAuto = true; window.__sbSync.render(); });
      const a = await read(o.page);
      ok(/flashcards the AI matched to this exam \(10 of 10 studied\)/.test(a), "with Automatic AI on, the deck it matched counts: " + a.slice(0, 140));
      await act(o.page, "edit-task", "m2"); await o.page.waitForSelector("dialog[open] .tv-ready");
      await o.page.click('dialog[open] [data-act="xr-decks"]'); await o.page.waitForSelector("dialog[open] .xr-sheet");
      ok(/matched to this exam's topics: Genetics/.test(await o.page.locator("dialog[open] .xr-sheet").innerText()), "and the picker names it");
      await done(o.ctx, o.page);
      seed.decks.push({id: "d5", name: "Ecology", courseId: "c1", created: 3, cards: [card("e1")]});
      o = await open(seed); await o.page.evaluate(() => { window.__sbForceAuto = true; window.__sbSync.render(); });
      ok(/your flashcards for the course/.test(await read(o.page)), "a new deck in the course retires the AI's old match until it looks again");
      await done(o.ctx, o.page);
    }
    { // 5b. Quizzes not made from flashcards (from slides, notes or your own questions) count too, matched to the exam's topics
      const qz = (id, title, score, srcs) => ({id: "h" + id, name: title, courseId: "c1", created: 5, quizOnly: true, cards: [], quizzes: [], aiQuizzes: [{id: "q" + id, title, style: "", created: Date.now() - 3 * DAY, sources: srcs, questions: [{id: "x1", type: "single", q: "Question about " + title, choices: ["a", "b"], answer: 0}], results: [{at: Date.now() - DAY, score, total: 10}]}]});
      const {ctx, page} = await open({tasks: [mk("m2", "Midterm 2", "Exam", 8, Object.assign({weight: 30, pct: 90, notes: "Covers chapters 4 to 6."}, inPerson))],
        decks: [qz("2", "Chapter 2 slides quiz", 9, ["Lecture 2 slides.pdf"]), qz("5", "Chapter 5 slides quiz", 4, ["Lecture 5 slides.pdf"])]});
      await act(page, "edit-task", "m2"); await page.waitForSelector("dialog[open] .tv-ready");
      const a = await page.locator("dialog[open] .tv-ready").innerText();
      ok(/a practice quiz \(40% average\)/.test(a) && /\b40%/.test(a), "with no flashcards, readiness comes from the chapter 5 quiz only (40%), not the chapter 2 one: " + a.replace(/\s+/g, " ").slice(0, 150));
      ok(/You rate yourself 90% ready, but your results say about 40%/.test(a), "and the gap with how ready you feel is shown");
      await page.click('dialog[open] [data-act="xr-decks"]'); await page.waitForSelector("dialog[open] .xr-sheet");
      const sh = await page.locator("dialog[open] .xr-sheet").innerText();
      ok(/Chapter 5 slides quiz\s*1 quiz/.test(sh) && /and 1 quiz/.test(sh), "the picker lists quizzes and says Automatic matched one: " + sh.replace(/\s+/g, " ").slice(0, 200));
      await done(ctx, page);
    }
    { // 6. The Crunch Forecast reads Today's Plan: an in-person exam carries its study time, light the night before
      const {ctx, page} = await open({tasks: [mk("x", "Midterm", "Exam", 4, Object.assign({weight: 30}, inPerson)), mk("late", "Old lab", "Lab", -2, {late: "none"})]});
      const r = await page.evaluate(() => { const inp = SBCRUNCH.input() || (SBCRUNCH.model(), SBCRUNCH.input()), m = SBCRUNCH.model(), p = __sbPlan(), st = p.ranked.concat(p.laterRows).find(x => x.id === "study:x");
        const ex = inp.tasks.find(t => t.id === "x"), eve = new Date(); eve.setDate(eve.getDate() + 3);
        const ed = eve.getFullYear() + "-" + String(eve.getMonth() + 1).padStart(2, "0") + "-" + String(eve.getDate()).padStart(2, "0"), D = m.days.find(d => d.date === ed);
        return {rem: ex && ex.rem, studyR: st && st.R, dead: (inp.tasks.find(t => t.id === "late") || {}).dead, ids: inp.tasks.map(t => t.id), eve: D && D.items.x ? D.items.x.hours : 0, eveCap: ex && ex.eveCap}; });
      ok(r.rem > 0 && Math.abs(r.rem - r.studyR) < 0.01, `the forecast uses the exam's study time from Today's Plan (${r.rem}h)`);
      ok(r.dead === true && !r.ids.some(id => /^study:/.test(id)), "closed work is closed in both, and the study entry isn't counted twice");
      ok(r.eveCap === 0.5 && r.eve <= 0.5 * 1.27 + 1e-6, `the night before stays light in the forecast too (${r.eve.toFixed(2)}h)`);
      await done(ctx, page);
    }
    { // 7. Focus time on a group project task counts toward it
      const {ctx, page} = await open({tasks: [mk("far", "Reading log", "Reading", 25, {hours: 1})]});
      await page.evaluate(() => { window.SBGROUPTASKS = Object.assign({}, window.SBGROUPTASKS || {}, {boardRows: () => [{id: "r1", gid: "g1", listId: "l1", title: "Group poster", due: (d => { const x = new Date(); x.setDate(x.getDate() + 3); return x.getFullYear() + "-" + String(x.getMonth() + 1).padStart(2, "0") + "-" + String(x.getDate()).padStart(2, "0"); })(), status: "todo", hours: 2, groupName: "Poster team"}]}); window.__sbSync.render(); });
      await page.waitForTimeout(300);
      const before = await page.evaluate(() => __sbPlan().ranked.find(x => x.id === "gt:r1"));
      ok(before && before.R >= 1.5, "the group task is in Today's Plan: " + (before && before.R) + "h left");
      ok(await page.locator('.next-up [data-act="pomo-task"][data-id="gt:r1"]').count() === 1, "its focus button starts focus on it");
      await page.locator('.next-up [data-act="pomo-task"][data-id="gt:r1"]').click(); await page.waitForTimeout(300);
      await page.clock.runFor(26 * 60 * 1000); await page.waitForTimeout(500);
      const after = await page.evaluate(() => ({w: window.__sbSync.state.settings.gtWork, r: __sbPlan().ranked.find(x => x.id === "gt:r1")}));
      ok(after.w && after.w.r1 && after.w.r1.m >= 25, "a finished focus session is recorded for the group task: " + JSON.stringify(after.w));
      ok(after.r && after.r.R < before.R - 0.3, `and its work left goes down (${before.R}h to ${after.r && after.r.R}h)`);
      await done(ctx, page);
    }
    { // 8. One Heads Up block: short of time, busy days ahead and closed work together
      const events = [{id: "ev1", title: "Clinical placement", date: addD(1), allDay: true, courseId: ""}];
      const {ctx, page} = await open({tasks: [mk("e", "Care plan", "Assignment", 3, {hours: 12, weight: 20}), mk("d", "Old lab", "Lab", -2, {late: "none"})], events});
      ok(await page.locator(".plan-notes").count() === 1, "one Heads Up block");
      const k = await page.locator(".plan-notes .pn").evaluateAll(els => els.map(e => e.className));
      ok(k.some(c => /pn-warn/.test(c)) && k.some(c => /pn-busy/.test(c)) && k.some(c => /pn-late/.test(c)), "with short of time, busy days ahead and the closed lab as rows: " + k.join(" | "));
      ok(k.length === 2 && /pn-warn pn-busy/.test(k[0]), "short of time and busy days ahead share one row, since both ask for more time today");
      ok(await page.locator(".plan-warn").count() === 0, "and no separate warning cards");
      await shot(page, "r8-heads-up", ".plan-notes");
      await done(ctx, page);
    }
  } finally { await browser.close(); server.close(); }
  console.log(`\n${n} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
