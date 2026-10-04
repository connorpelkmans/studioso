// Browser checks for "can this exam or quiz be taken from home?" (Playwright + Chromium). Run: node tests/remotex.e2e.js [outDir]
// Fixed clock: Monday 2026-10-05 15:00 in New York. Runs at 1280 and 390 wide; the AI is stubbed. Screenshots go to outDir.
const {chromium} = require("/opt/node-tools/node_modules/playwright");
const path = require("path"), fs = require("fs");
const OUT = process.argv[2] || "/tmp/remotex-shots", FILE = "file://" + path.join(__dirname, "..", "index.html");
fs.mkdirSync(OUT, {recursive: true});
let checks = 0; const ok = (c, m) => { checks++; if (!c) { console.log("FAIL:", m); process.exitCode = 1; } };

const T = (id, title, type, due, o) => Object.assign({id, title, courseId: "c1", type, start: type === "Exam" || type === "Quiz" ? due : "2026-10-01", due, time: "", priority: "med", status: "todo", notes: "", hours: type === "Assignment" || type === "Study" ? 2 : null, checklist: [], pct: 0, dependsOn: [], history: [], created: 1, order: 10}, o || {});
const COURSE = {id: "c1", name: "Biology 101", code: "BIO101", color: "#4F8A5B", meetings: [{id: "m1", kind: "Lecture", days: [2, 4], start: "09:00", end: "10:15"}]};
const SC = {
  // an in-person midterm, an online quiz from the school site, a final nothing can settle, a normal assignment and a study session
  mixed: [T("m1", "Midterm 2", "Exam", "2026-10-06", {time: "09:00", weight: 30, notes: "Held in class on Tuesday. Bring a pencil. Covers chapters 1 to 5."}),
    T("q1", "Quiz 3", "Quiz", "2026-10-06", {time: "23:59", cv: {key: "1|quiz3", ou: "1", rx: {k: "quiz", st: ["online_quiz"], tl: 30}}}),
    T("m2", "Final Exam", "Exam", "2026-10-09", {weight: 40, notes: "Chapters 1 to 8."}),
    T("a1", "Stats homework", "Assignment", "2026-10-08"),
    T("s1", "Study: Midterm 2 basics", "Study", "2026-10-05", {hours: 1, prepFor: "m1"})],
  online: [T("m1", "Midterm 2", "Exam", "2026-10-06", {time: "09:00", weight: 30, notes: "Held in class on Tuesday. Bring a pencil."}),
    T("q1", "Quiz 3", "Quiz", "2026-10-06", {time: "23:59", cv: {key: "1|quiz3", ou: "1", rx: {k: "quiz", st: ["online_quiz"]}}}),
    T("a1", "Stats homework", "Assignment", "2026-10-10")],
  unknown: [T("m2", "Final Exam", "Exam", "2026-10-06", {weight: 40, notes: "Chapters 1 to 8."}), T("a1", "Stats homework", "Assignment", "2026-10-10")],
  ai: [T("e1", "Anatomy Exam 1", "Exam", "2026-10-12", {notes: "Students will sit the exam in a supervised session using the school's laptops."}),
    T("e2", "Quiz 5", "Quiz", "2026-10-13", {notes: "Questions may be posted in the discussion forum before it opens."}),
    T("e3", "Final Review Exam", "Exam", "2026-10-14", {notes: "Cumulative, covers the whole term. Expect 60 questions."}),
    T("e4", "Midterm 9", "Exam", "2026-10-15", {notes: ""}),
    T("a1", "Stats homework", "Assignment", "2026-10-10")]
};
const seedFn = ([tasks, ai]) => {
  localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("studioso:tour", "done"); localStorage.setItem("sb:onboarded", "1");
  if (!localStorage.getItem("coursework:v2")) localStorage.setItem("coursework:v2", JSON.stringify({v: 2, courses: [window.__COURSE], tasks, files: [], notes: [], decks: [], events: [], settings: {capacity: 15, dailyHours: 4}, updated: 1}));
  if (ai) { localStorage.setItem("studyboard:aiKeys", JSON.stringify({gemini: "AIzaTESTTESTTESTTESTTESTTEST12345"})); localStorage.setItem("studyboard:aiConsent", JSON.stringify({gemini: {v: 1, at: 1}})); }
};
const REPLIES = {"Anatomy Exam 1": {takeHome: "no", confidence: 0.85, evidence: "supervised session using the school's laptops"},
  "Quiz 5": {takeHome: "yes", confidence: 0.9, evidence: "The quiz is held in Room 12 on campus"},
  "Final Review Exam": {takeHome: "yes", confidence: 0.4, evidence: "Cumulative, covers the whole term"}};

async function open(browser, W, scenario, o) {
  o = o || {};
  const ctx = await browser.newContext({viewport: {width: W, height: W > 600 ? 900 : 844}, timezoneId: "America/New_York", locale: "en-US"});
  ctx.aiCalls = [];
  await ctx.route(/generativelanguage\.googleapis\.com/, async route => {
    const body = route.request().postData() || ""; ctx.aiCalls.push(body);
    let reply = {};
    if (/triple quotes|everything the school site gave/.test(body)) { const k = Object.keys(REPLIES).find(x => body.includes("Title: " + x)); reply = k ? REPLIES[k] : {takeHome: "unknown", confidence: 0.1, evidence: ""}; }
    route.fulfill({status: 200, contentType: "application/json", body: JSON.stringify({candidates: [{content: {parts: [{text: JSON.stringify(reply)}]}, finishReason: "STOP"}]})});
  });
  const p = await ctx.newPage(), errs = [];
  p.on("pageerror", e => errs.push(e.message));
  await p.clock.install({time: new Date("2026-10-05T15:00:00-04:00")});
  await p.addInitScript(c => { window.__COURSE = c; }, COURSE);
  await p.addInitScript(seedFn, [SC[scenario], !!o.ai]);
  await p.goto(FILE); await p.waitForTimeout(1500);
  return {ctx, p, errs};
}
const overflow = p => p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
const txt = (p, sel) => p.evaluate(s => Array.from(document.querySelectorAll(s)).map(e => e.textContent.replace(/\s+/g, " ").trim()), sel);
const plan = p => p.evaluate(() => window.__sbPlan());
const eff = (p, id) => p.evaluate(i => window.__sbRemote.of(i), id);
const stored = (p, id) => p.evaluate(i => (JSON.parse(localStorage.getItem("coursework:v2")).tasks.find(t => t.id === i) || {}), id);
const showToday = p => p.evaluate(() => window.__sbAvail.view({tab: "board", bview: "plan"}));

(async () => {
  const browser = await chromium.launch({executablePath: "/opt/pw-browsers/chromium"});
  for (const W of [1280, 390]) {
    const tag = W + "w";
    // ---------- 1. Mixed list, no AI: rules and the one-tap question ----------
    {
      const {ctx, p, errs} = await open(browser, W, "mixed");
      await showToday(p); await p.waitForTimeout(900);
      const m1 = await eff(p, "m1"), q1 = await eff(p, "q1"), m2 = await eff(p, "m2");
      ok(m1.v === "no" && m1.src === "rule" && !m1.can, tag + " in-class midterm is in person (" + m1.why + ")");
      ok(q1.v === "yes" && q1.src === "lms" && q1.can, tag + " online quiz from the school site is take-home (" + q1.why + ")");
      ok(m2.v === "" && !m2.can, tag + " final with nothing to go on is unknown, so not eligible");
      const pl = await plan(p);
      ok(pl.next && !["m1", "m2"].includes(pl.next.id), tag + " Do This Next is never an unsure or in-person exam: " + (pl.next && pl.next.id));
      ok(!pl.ranked.some(x => x.id === "m1" && x.alloc > 0), tag + " the in-person midterm gets no study time slot");
      ok(await p.locator(".next-up").count() === 1, tag + " Do This Next card shows");
      const nu = (await txt(p, ".next-up .nu-title"))[0];
      ok(!/^(Midterm 2|Final Exam)( |$)/.test(nu), tag + " card title: " + nu);
      const rowsFocus = await p.evaluate(() => Array.from(document.querySelectorAll(".plan-row")).filter(r => /Midterm 2|Final Exam/.test(r.textContent) && r.querySelector(".focus-go")).length);
      ok(rowsFocus === 0, tag + " no focus button on exam rows");
      const fixed = await txt(p, ".plan-fixed li");
      ok(fixed.length === 2 && /Midterm 2/.test(fixed[0]) && /In person/.test(fixed[0]) && /Final Exam/.test(fixed[1]) && /Not sure/.test(fixed[1]), tag + " On the Calendar lists both exams: " + fixed.join(" | "));
      const q = await txt(p, '.auto-ins li[data-kind="remote"]');
      ok(q.length === 1 && /Can you take “Final Exam” from home\?/.test(q[0]), tag + " one question for the final: " + q.join("|"));
      ok(await p.locator('[data-act="rmt-set"]').count() === 2, tag + " Yes and No buttons");
      ok((await p.locator('[data-act="rmt-set"]').evaluateAll(els => els.every(e => e.getBoundingClientRect().height >= 30))), tag + " question buttons are tappable");
      ok((await overflow(p)) <= 0, tag + " Today has no horizontal overflow");
      await p.screenshot({path: path.join(OUT, `01-today-${tag}.png`), fullPage: true});
      // the board row hint
      await p.evaluate(() => window.__sbAvail.view({tab: "board", bview: "board"})); await p.waitForTimeout(300);
      const qm = await p.locator(".rx-q").count();
      ok(qm === 1, tag + " one '?' hint on the unsure exam, none on the others (" + qm + ")");
      await p.evaluate(() => window.__sbAvail.view({tab: "board", bview: "plan"})); await p.waitForTimeout(200);
      // the edit sheet
      await p.click('.plan-fixed [data-id="m1"]'); await p.waitForSelector("dialog[open] #rxFs");
      ok(await p.locator("dialog[open] #rxFs legend").textContent() === "Where is this taken?", tag + " edit sheet asks where it is taken");
      const note = await p.locator("dialog[open] #rxNote").textContent();
      ok(/In person/.test(note) && /Detected by:\s*Auto/.test(note) && /in class/i.test(note), tag + " evidence line: " + note);
      ok(await p.locator('dialog[open] input[name=remote][value="no"]').isChecked(), tag + " In person is selected");
      ok(await p.locator("dialog[open] .focus-btn").count() === 0, tag + " no Focus button in the sheet for an in-person exam");
      await p.screenshot({path: path.join(OUT, `02-sheet-${tag}.png`)});
      await p.keyboard.press("Escape"); await p.waitForTimeout(150);
      // answer the question: Yes
      await p.click('[data-act="rmt-set"][data-v="yes"]'); await p.waitForTimeout(400);
      const m2b = await eff(p, "m2"), st = await stored(p, "m2");
      ok(m2b.v === "yes" && m2b.src === "user" && m2b.can, tag + " answering Yes makes the final eligible at once");
      ok(st.remote === "yes" && st.remoteSrc === "user", tag + " answer stored as the student's own");
      ok((await p.locator('.auto-ins li[data-kind="remote"]').count()) === 0, tag + " question is gone");
      const st1 = await stored(p, "m1"), stq = await stored(p, "q1");
      ok(st1.remote === "no" && st1.remoteSrc === "rule" && stq.remote === "yes" && stq.remoteSrc === "lms", tag + " rule and school-site answers are saved on the tasks");
      await p.reload(); await p.waitForTimeout(1200);
      const m2c = await eff(p, "m2"); ok(m2c.v === "yes" && m2c.src === "user", tag + " persists after reload");
      // a school sync can't overwrite it: rules never touch a user answer
      await p.waitForTimeout(1200);
      ok((await stored(p, "m2")).remoteSrc === "user", tag + " user answer survives the store pass");
      ok(errs.length === 0, tag + " no page errors: " + errs.join("|"));
      await ctx.close();
    }
    // ---------- 2. The online quiz is Do This Next; the in-person midterm never is ----------
    {
      const {ctx, p, errs} = await open(browser, W, "online");
      await showToday(p); await p.waitForTimeout(700);
      let pl = await plan(p);
      ok(pl.next && pl.next.id === "q1", tag + " the take-home quiz due tomorrow is Do This Next (" + (pl.next && pl.next.id) + ")");
      const nu = (await txt(p, ".next-up"))[0] || "";
      ok(/Quiz 3/.test(nu) && /Take-home/.test(nu), tag + " card names it and says Take-home: " + nu.slice(0, 80));
      await p.screenshot({path: path.join(OUT, `03-quiz-next-${tag}.png`)});
      // Something Else walks the alternatives: the midterm never comes up
      for (let i = 0; i < 4; i++) { if (await p.locator('[data-act="nu-skip"]').count()) { await p.click('[data-act="nu-skip"]'); await p.waitForTimeout(150); } }
      const n2 = (await txt(p, ".next-up .nu-title"))[0] || "";
      ok(!/Midterm 2/.test(n2), tag + " alternatives never offer the in-person midterm: " + n2);
      // the in-person midterm is not startable by any route
      await p.evaluate(() => { const b = document.createElement("button"); b.dataset.act = "pomo-task"; b.dataset.id = "m1"; b.hidden = true; document.body.appendChild(b); b.click(); });
      await p.waitForTimeout(200);
      ok(!(await p.evaluate(() => window.__sbAvail.pomo().running)) && /taken in person/.test(await p.textContent("#toastMsg")), tag + " a focus session can't be started on it");
      // answering "From home" in the sheet makes the midterm eligible, and it can then lead
      await p.evaluate(() => window.__sbAvail.view({tab: "board", bview: "plan"}));
      await p.click('.plan-fixed [data-id="m1"]'); await p.waitForSelector("dialog[open] #rxFs");
      await p.locator('dialog[open] input[name=remote][value="yes"]').check({force: true});
      ok(/You/.test(await p.locator("dialog[open] #rxNote").textContent()), tag + " note says you set it");
      await p.click("dialog[open] [data-submit]"); await p.waitForTimeout(500);
      const m1 = await eff(p, "m1"); ok(m1.v === "yes" && m1.src === "user" && m1.can, tag + " From home saved as your answer, eligible now");
      pl = await plan(p);
      ok(pl.ranked.some(x => x.id === "m1" && x.alloc > 0) || pl.next.id === "m1", tag + " the midterm now takes study time or leads");
      await p.reload(); await p.waitForTimeout(1200);
      ok((await eff(p, "m1")).v === "yes", tag + " still From home after reload");
      ok(errs.length === 0, tag + " no page errors: " + errs.join("|"));
      await ctx.close();
    }
    // ---------- 3. Unknown is not eligible; answering In person keeps it out ----------
    {
      const {ctx, p} = await open(browser, W, "unknown");
      await showToday(p); await p.waitForTimeout(700);
      let pl = await plan(p);
      ok(pl.next && pl.next.id === "a1", tag + " an unsure exam due tomorrow is not suggested; the assignment is (" + (pl.next && pl.next.id) + ")");
      await p.click('[data-act="rmt-set"][data-v="no"]'); await p.waitForTimeout(400);
      ok((await eff(p, "m2")).v === "no", tag + " In person answer");
      pl = await plan(p); ok(pl.next.id === "a1", tag + " still not suggested after saying In person");
      await ctx.close();
    }
    // ---------- 4. With AI: accepted, rejected, low confidence, no text ----------
    {
      const {ctx, p, errs} = await open(browser, W, "ai", {ai: true});
      await showToday(p);
      await p.waitForFunction(() => Object.keys(window.__sbRemote.auto()).length >= 3, null, {timeout: 40000}).catch(() => {});
      await p.waitForTimeout(500);
      const e1 = await eff(p, "e1"), e2 = await eff(p, "e2"), e3 = await eff(p, "e3"), e4 = await eff(p, "e4"), why = await p.evaluate(() => window.__sbRemote.why());
      ok(e1.v === "no" && e1.src === "ai" && e1.can === false, tag + " AI answer with real evidence is applied (" + JSON.stringify(e1) + ")");
      ok(e2.v === "" && why.e2 === "evidence-not-in-text", tag + " a quote that isn't in the text is rejected (" + why.e2 + ")");
      ok(e3.v === "" && why.e3 === "low-confidence", tag + " low confidence is not applied (" + why.e3 + ")");
      ok(e4.v === "" && !("e4" in (await p.evaluate(() => window.__sbRemote.auto()))), tag + " no description: never sent to the AI");
      ok(!ctx.aiCalls.some(b => b.includes("Title: Midterm 9")), tag + " the AI never saw the task without text");
      ok(ctx.aiCalls.filter(b => /everything the school site gave/.test(b)).every(b => !/https?:\/\//.test(b.split("everything the school site gave")[1] || "")), tag + " no links are sent");
      const st = await stored(p, "e1"); ok(st.remote === "no" && st.remoteSrc === "ai" && st.remoteWhy && st.remoteWhy.length <= 120, tag + " stored with source ai and a short reason");
      const qs = await p.evaluate(() => window.__sbRemote.questions());
      ok(qs.length === 1 && ["e2", "e3", "e4"].includes(qs[0]), tag + " the tray asks about one unsettled exam: " + qs.join());
      // the same text is not sent twice
      const before = ctx.aiCalls.filter(b => /everything the school site gave/.test(b)).length;
      await p.evaluate(() => window.__sbRemote.cands()); await p.waitForTimeout(3500);
      ok(ctx.aiCalls.filter(b => /everything the school site gave/.test(b)).length === before, tag + " cached by text: no repeat calls");
      await p.screenshot({path: path.join(OUT, `04-ai-${tag}.png`), fullPage: true});
      ok(errs.length === 0, tag + " no page errors: " + errs.join("|"));
      await ctx.close();
    }
  }
  // ---------- 6. School site data: how items are handed in reaches the task, sanitized, and drives the answer ----------
  {
    const {ctx, p, errs} = await open(browser, 1280, "unknown");
    const out = await p.evaluate(() => {
      const L = window.SBLMS.canvas, D = (iso, h) => new Date(Date.parse(iso) + h * 36e5).toISOString();
      const harvest = {ok: true, origin: "https://x.instructure.com", me: {name: "A", id: "1"}, all: [{ou: "101", code: "BIO101", name: "Biology 101"}], errors: [], ms: 1, courses: [{ou: "101", code: "BIO101", name: "Biology 101", grades: [], final: null, news: [], events: [],
        items: [{kind: "quiz", id: "5", name: "Online Unit Quiz", due: "2026-10-20T03:59:00Z", start: "2026-10-18T12:00:00Z", end: "2026-10-20T03:59:00Z", text: "<p>Open book.</p>", url: "/courses/101/assignments/5", gid: "5", outOf: 10, done: false, files: [], rx: {k: "quiz", st: ["online_quiz"], tl: 30, ul: "2026-10-18T12:00:00Z", ll: "2026-10-20T03:59:00Z", evil: "<script>", ld: 1}},
          {kind: "assignment", id: "6", name: "Midterm Exam 1", due: "2026-10-21T14:00:00Z", text: "Chapters 1 to 4", url: "/courses/101/assignments/6", gid: "6", outOf: 100, done: false, files: [], rx: {k: "assign", st: ["none"]}},
          {kind: "assignment", id: "7", name: "Final Exam", due: "2026-10-22T14:00:00Z", text: "", url: "/courses/101/assignments/7", gid: "7", outOf: 100, done: false, files: [], rx: {k: "assign", st: ["on_paper"], junk: 1}}]}]};
      const data = L.fromApi(harvest), r = data.recs.map(x => ({title: x.title, type: x.type, rx: x.rx}));
      const pl = L.plan(data, {map: {"101": "c1"}});
      return {r, tasks: pl.changes.filter(c => c.kind === "task").map(c => c.after)};
    });
    ok(out.r.length === 3 && out.r[0].type === "Quiz" && out.r[1].type === "Exam" && out.r[2].type === "Exam", 'school sync' + " mapper keeps types: " + out.r.map(x => x.type).join());
    ok(JSON.stringify(Object.keys(out.r[0].rx).sort()) === JSON.stringify(["k", "ld", "ll", "st", "tl", "ul"]) && !("evil" in out.r[0].rx) && !("junk" in out.r[2].rx), 'school sync' + " extra fields are dropped: " + JSON.stringify(out.r[0].rx));
    ok(out.tasks.length === 3 && out.tasks.every(t => t.cv && t.cv.rx), 'school sync' + " the sync stores how each item is handed in on the task");
    // put them on the board and ask what Studyboard now believes
    await p.evaluate(ts => { const s = JSON.parse(localStorage.getItem("coursework:v2")); s.tasks = s.tasks.concat(ts); s.updated = Date.now(); localStorage.setItem("coursework:v2", JSON.stringify(s)); }, out.tasks);
    await p.reload(); await p.waitForTimeout(1200);
    const ids = out.tasks.map(t => t.id), e = [];
    for (const id of ids) e.push(await eff(p, id));
    ok(e[0].v === "yes" && e[0].src === "lms", 'school sync' + " online quiz from Canvas is take-home (" + e[0].why + ")");
    ok(e[1].v === "no" && e[1].src === "lms", 'school sync' + " exam with nothing handed in online is in person (" + e[1].why + ")");
    ok(e[2].v === "no", 'school sync' + " exam handed in on paper is in person (" + e[2].why + ")");
    ok(errs.length === 0, 'school sync' + " no page errors: " + errs.join("|"));
    await ctx.close();
  }
  // ---------- 5. Settings: the Automatic AI panel explains it ----------
  {
    const {ctx, p} = await open(browser, 1280, "mixed", {ai: true});
    await showToday(p); await p.waitForTimeout(500);
    await p.evaluate(() => { const b = document.createElement("button"); b.dataset.act = "auto-panel"; b.hidden = true; document.body.appendChild(b); b.click(); });
    await p.waitForSelector("dialog[open] [data-feat=remote]");
    const row = await p.locator('dialog[open] .ap-row:has([data-feat=remote])').textContent();
    ok(/Exam Location Check/.test(row) && /Uses AI/.test(row) && /Example/.test(row), "panel entry: " + row.replace(/\s+/g, " ").slice(0, 120));
    await p.screenshot({path: path.join(OUT, "05-panel.png")});
    await p.locator("dialog[open] [data-feat=remote]").uncheck(); await p.waitForTimeout(300);
    ok((await p.evaluate(() => window.__sbRemote.questions())).length === 0, "turning it off hides the question");
    await ctx.close();
  }
  await browser.close();
  console.log(`remotex.e2e: ${checks} checks ${process.exitCode ? "FAILED" : "passed"}`);
})().catch(e => { console.error(e); process.exit(1); });
