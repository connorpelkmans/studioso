// node tests/learning-science.e2e.js [shotsDir] (Playwright + Chromium)
// Readiness measured before feeling, exam-aware flashcards, mixed reviews with the exam's cards first, a light night before
// an exam, effort-based rewards, and the exam wrapper. Pass a folder to also save screenshots of each.
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
  // Biology: a midterm in 6 days that feels 80% ready, but the flashcards and a practice quiz say otherwise
  const bioDeck = {id: "d1", name: "Cell Biology", courseId: "c1", created: 1, cards: Array.from({length: 20}, (_, i) => card("b" + i)), quizzes: [{at: Date.now() - DAY, score: 5, total: 10}]};
  try {
    { // 1. Readiness: measured first, the slider second, and the gap said out loud
      const {ctx, page} = await open({tasks: [mk("x", "Midterm 2", "Exam", 6, Object.assign({weight: 30, pct: 80}, inPerson)), mk("y", "Quiz 4", "Quiz", 9, Object.assign({weight: 5, pct: 40, courseId: "c3"}, inPerson))], decks: [bioDeck]});
      await act(page, "edit-task", "x"); await page.waitForSelector("dialog[open] .tv-ready");
      const tv = await page.locator("dialog[open] .tv-ready").innerText();
      ok(/Readiness From Your Results/.test(tv) && /flashcards for the course \(20 of 20 studied\)/.test(tv) && /practice quiz \(50% average\)/.test(tv), "task view: readiness from results, and what it's made of: " + tv.replace(/\s+/g, " ").slice(0, 140));
      ok(/You rate yourself 80% ready, but your results say about \d\d%/.test(await page.locator("dialog[open] .tv-gap").innerText()), "task view: the gap between feeling and results is pointed out");
      ok(/How Ready You Feel/.test(await page.locator("dialog[open] .tv-prog:not(.tv-ready) .tv-prog-h b").innerText()), "task view: the slider is labelled How Ready You Feel");
      await shot(page, "1-readiness-task", "dialog[open] .sheet");
      await page.keyboard.press("Escape");
      await act(page, "edit-task", "y"); await page.waitForSelector("dialog[open] .tv-noready");
      ok(/readiness goes by how ready you feel\. Your results will show here/.test(await page.locator("dialog[open] .tv-noready").innerText()), "task view: with nothing measured, it says how to measure it");
      await page.keyboard.press("Escape");
      const pl = await page.evaluate(() => __sbPlan());
      const st = pl.ranked.find(x => x.id === "study:x") || pl.laterRows.find(x => x.id === "study:x");
      ok(st && st.reasons.some(w => /You feel 80% ready, but your flashcards and quizzes say about \d\d%/.test(w)), "Today's Plan: the study entry gives the gap as a reason");
      ok(st && st.reasons.some(w => /study starts \d+ days before it because .*(you're about|put you at) \d\d% ready/i.test(w)), "Today's Plan: the study window follows measured readiness: " + (st && st.reasons.find(w => /Study starts/.test(w))));
      ok(st && st.R > 4, "less ready (measured) means more study time: " + (st && st.R) + "h");
      await done(ctx, page);
    }
    { // 1b. Exam Mode's card: readiness from results; the gap is in Heads Up
      const {ctx, page} = await open({tasks: [mk("z", "Midterm 1", "Exam", 2, Object.assign({weight: 25, pct: 85, time: "09:00"}, inPerson))], decks: [bioDeck]});
      await page.waitForSelector(".exm-card");
      const c = await page.locator(".exm-card").innerText();
      ok(/\d\d% ready \(from your results/.test(c), "Exam Mode: readiness from results: " + c.replace(/\s+/g, " ").slice(0, 160));
      const g = await page.locator(".plan-notes .pn-ready").innerText();
      ok(/Midterm 1 \(in 2 days\): you feel 85% ready, but your results say about \d\d%/.test(g) && /Test Yourself/.test(g), "Heads Up: the gap for the next exam, with Test Yourself: " + g.replace(/\s+/g, " "));
      await shot(page, "1b-exam-mode", ".exm-card");
      await done(ctx, page);
    }
    { // 2-4. Flashcards: exam-aware reviews, and mixed reviews with the exam's cards first
      const chem = {id: "d2", name: "Reactions", courseId: "c2", created: 2, cards: Array.from({length: 5}, (_, i) => card("c" + i, {box: 4, due: addD(20), last: addD(-10), right: 3, wrong: 0, rate: "good"})).concat([card("cw", {box: 4, due: addD(20), last: addD(-1), rate: "good"})])};
      const hist = {id: "d3", name: "Revolutions", courseId: "c3", created: 3, cards: Array.from({length: 6}, (_, i) => card("h" + i, {due: addD(-1)}))};
      const bio = Object.assign({}, bioDeck, {cards: bioDeck.cards.map(c => Object.assign({}, c, {due: addD(3)}))});
      const {ctx, page} = await open({tasks: [mk("q", "Quiz 3", "Quiz", 2, Object.assign({courseId: "c2", weight: 15}, inPerson)), mk("x", "Midterm 2", "Exam", 12, Object.assign({weight: 30}, inPerson))], decks: [bio, chem, hist]});
      const due = await page.evaluate(() => Number((document.querySelector(".fc-navdue") || {}).textContent || 0));
      ok(due === 11, `exam-aware: 5 chemistry cards due in 20 days come due now, 2 days before the quiz (plus 6 history cards): ${due} due`);
      await act(page, "fc-review-all"); await page.waitForTimeout(300);
      const q = await page.evaluate(() => window.__sbSync.ui.fc.q.map(x => x.deckId));
      ok(q.length === 11 && q.filter(d => d === "d2").length === 5 && !q.includes("d1"), "exam-aware: the card reviewed yesterday (inside the 3 days before) and cards due later aren't pulled in");
      ok(q.slice(0, 4).filter(d => d === "d2").length >= 3 && q.slice(0, 5).includes("d3"), "mixed: the quiz's cards come up most at the start, with the other deck mixed in: " + q.join(","));
      // while both decks still have cards (after the quiz's cards run out, only one deck is left)
      const both = Math.min(q.lastIndexOf("d2"), q.lastIndexOf("d3")) + 1;
      let run = 0, max = 0; q.slice(0, both).forEach((d, i, a) => { run = i && a[i - 1] === d ? run + 1 : 1; max = Math.max(max, run); });
      ok(max <= 3, "mixed: never more than 3 in a row from one deck while both have cards: " + max);
      ok(/Cards for Quiz 3 \(in 2 days\) come up most, mixed in with the rest/.test(await page.locator(".view").first().innerText().catch(() => "") || await page.textContent("body")), "mixed: the session says why");
      await shot(page, "2-mixed-review", "#view");
      // a well-known biology card (midterm in 12 days): its long next gap is pulled into the week before the exam, and the button says so
      await page.evaluate(() => { const S = window.__sbSync, c = S.state.decks.d1.cards.find(x => x.id === "b0"); c.box = 4; const f = S.ui.fc; f.q.unshift({deckId: "d1", cardId: "b0"}); f.i = 0; f.flipped = true; S.render(); });
      await page.waitForTimeout(200);
      const easy = await page.locator(".rate-btn.easy span").innerText();
      ok(/^(5|6|7|8|9|10) days \(before your exam\)$/.test(easy.trim()), "exam-aware: the rating button says the next review comes before the exam: " + easy);
      await shot(page, "3-rate-before-exam", "#view");
      await done(ctx, page);
    }
    { // 5. The day before an exam: light review only
      const {ctx, page} = await open({tasks: [mk("f", "Final Exam", "Exam", 1, Object.assign({weight: 40, time: "09:00"}, inPerson)), mk("a", "Lab report", "Lab", 5, {weight: 10, hours: 3})], decks: [bioDeck]});
      const pl = await page.evaluate(() => __sbPlan());
      const s = pl.ranked.find(x => x.id === "study:f");
      ok(s && s.alloc > 0 && s.alloc <= 0.5, `night before: studying for tomorrow's exam gets at most 30 minutes (${s && s.alloc}h)`);
      ok(s && s.reasons.some(w => /Light review only today/.test(w)), "night before: and says why (sleep)");
      ok(pl.next && pl.next.id === "study:f" ? pl.next.mins <= 30 : true, "night before: Do This Next's study timer is 30 minutes at most");
      const step = await page.locator(".next-up .nu-step").first().innerText().catch(() => "");
      ok(!pl.next.study || /light review only/i.test(step), "night before: the card says light review, then sleep: " + step);
      ok(await page.locator('.next-up [data-act="fc-study-course"]').count() === (pl.next.study ? 1 : 0), "the study card offers Test Yourself (this course's flashcards)");
      await shot(page, "4-night-before", ".next-up");
      await done(ctx, page);
      const o = await open({tasks: [mk("f", "Final Exam", "Exam", 4, Object.assign({weight: 40, time: "09:00"}, inPerson))]});
      const p2 = await o.page.evaluate(() => __sbPlan()), s2 = p2.ranked.find(x => x.id === "study:f");
      ok(s2 && s2.alloc >= 1, `four days out: real study time today, spread before the light day (${s2 && s2.alloc}h)`);
      await done(o.ctx, o.page);
    }
    { // 6. Exam wrapper: after the mark, how you studied and how ready you were next to the result; shown again before the next exam
      const {ctx, page} = await open({tasks: [mk("e1", "Quiz 1", "Quiz", -1, Object.assign({weight: 10, pct: 80}, inPerson)), mk("x", "Midterm 2", "Exam", 6, Object.assign({weight: 30}, inPerson))], decks: [bioDeck]});
      await act(page, "toggle", "e1"); await page.waitForTimeout(300);
      await act(page, "g-mark", "e1"); await page.waitForSelector("dialog[open] #gmIn");
      await page.fill("dialog[open] #gmIn", "62%"); await page.click("dialog[open] [data-submit]");
      await page.waitForSelector("dialog[open] .ewr", {timeout: 4000});
      const cmp = await page.locator("dialog[open] .ewr-cmp").innerText();
      ok(/How ready you felt\s*80%/.test(cmp) && /What your results said\s*\d\d%/.test(cmp) && /Your mark\s*62%/.test(cmp), "wrapper: felt, measured and the mark side by side: " + cmp.replace(/\s+/g, " "));
      ok(/You felt more ready \(80%\) than your mark shows \(62%\)/.test(await page.locator("dialog[open] .ewr-read").innerText()), "wrapper: says what the comparison means");
      await page.locator('dialog[open] input[name="m"][value="reread"]').check({force: true});
      ok(/Rereading and rewatching feel productive/.test(await page.locator("#ewrTip").innerText()), "wrapper: a tip on how they studied");
      await page.locator('dialog[open] input[name="st"][value="short"]').check({force: true});
      await page.fill('dialog[open] input[name="next"]', "start practice questions a week before");
      await shot(page, "5-wrapper", "dialog[open] .sheet");
      await page.click("dialog[open] [data-submit]"); await page.waitForTimeout(300);
      const w = (await task(page, "e1")).wrap;
      ok(w && w.methods.includes("reread") && w.start === "short" && w.felt === 80 && w.mark === 62 && w.measured > 0 && /practice questions/.test(w.next), "wrapper: saved on the quiz: " + JSON.stringify(w));
      await act(page, "edit-task", "x"); await page.waitForSelector("dialog[open] .ewr-last");
      const last = await page.locator("dialog[open] .ewr-last").innerText();
      ok(/Last time: Quiz 1/.test(last) && /you got 62%/.test(last) && /start practice questions a week before/.test(last), "next exam: shows what you wrote last time");
      await shot(page, "6-last-time", "dialog[open] .sheet");
      await done(ctx, page);
    }
    { // 7. Rewards follow effort: study days, not tasks ticked off
      const many = Array.from({length: 12}, (_, i) => mk("t" + i, "Tiny task " + i, "Assignment", 2, {status: "done", doneAt: Date.now() - 3600e3, created: Date.now() - 2 * DAY}));
      const {ctx, page} = await open({tasks: many});
      await page.evaluate(() => { const S = window.__sbSync; S.ui.tab = "scrapbook"; S.render(); }); await page.waitForTimeout(800);
      const body = await page.textContent("body");
      ok(!/10 Tasks Done/.test(body) && /Study Days|Study Habits/.test(body), "scrapbook: no task-count stickers; study-day stickers instead");
      await shot(page, "7-scrapbook", "#view");
      await done(ctx, page);
    }
  } finally { await browser.close(); server.close(); }
  console.log(`\n${n} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
