// node tests/gradegpa.e2e.js (Playwright + Chromium; see tests/pw.js) Grades: credits, GPA, grading rules, past terms, Ask AI
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const root = path.join(__dirname, "..");
const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x"); let p = decodeURIComponent(u.pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  const ext = path.extname(f), mime = {".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".css": "text/css", ".webmanifest": "application/manifest+json"};
  res.writeHead(200, {"content-type": mime[ext] || "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const day = k => { const d = new Date(); d.setDate(d.getDate() + k); return d.toISOString().slice(0, 10); };
const T = (id, title, course, type, w, mark, due) => ({id, title, courseId: course, type, due: due || day(-20 + Number(id.replace(/\D/g, ""))), start: day(-30), status: mark != null ? "done" : "todo", priority: "med", weight: w, created: 1000 + Number(id.replace(/\D/g, "")), mark: mark != null ? {got: mark, outOf: 100} : undefined});
// STA101: quizzes 50, 90, 80 with the lowest dropped, midterm 85 -> 85 (B, 3.0), 3 credits
// ART100: essay 95 -> A (4.0), 1 credit. BIO210: lab 72 -> C- (1.7), no credits (counts as 2, the middle of 3 and 1)
const SEED = () => ({v: 2, updated: 1, settings: {}, courses: [
  {id: "c1", name: "Statistics", code: "STA101", color: "#3B6FE0", credits: 3, grading: {rules: {drops: [{cat: "Quiz", n: 1, src: "user"}]}}},
  {id: "c2", name: "Art History", code: "ART100", color: "#C79A12", credits: 1},
  {id: "c3", name: "Biology", code: "BIO210", color: "#1E9E74"}], tasks: [
  T("1", "Quiz 1", "c1", "Quiz", 10, 50), T("2", "Quiz 2", "c1", "Quiz", 10, 90), T("3", "Quiz 3", "c1", "Quiz", 10, 80),
  T("4", "Midterm", "c1", "Exam", 30, 85), T("5", "Final Exam", "c1", "Exam", 40, null, day(40)),
  T("6", "Essay", "c2", "Assignment", 50, 95), T("7", "Exam", "c2", "Exam", 50, null, day(30)),
  T("8", "Lab", "c3", "Lab", 40, 72), T("9", "Final", "c3", "Exam", 60, null, day(35))]});
const textOf = body => { try { const out = []; const walk = v => { if (typeof v === "string") out.push(v); else if (v && typeof v === "object") Object.values(v).forEach(walk); }; walk(JSON.parse(body)); return out.join("\n"); } catch (e) { return String(body || ""); } };
(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  const asks = [];
  const ctx = await browser.newContext({viewport: {width: 1200, height: 900}, serviceWorkers: "block"});
  await ctx.route(/generativelanguage\.googleapis\.com/, route => {
    const t = textOf(route.request().postData() || ""); asks.push(t);
    const body = /study coach looking at a student's grades/.test(t) ? {points: ["ART100 is your strongest course at 95%.", "BIO210 — at 72% — needs the most care."]} : {};
    route.fulfill({status: 200, contentType: "application/json", body: JSON.stringify({candidates: [{content: {parts: [{text: JSON.stringify(body)}]}, finishReason: "STOP"}]})});
  });
  await ctx.addInitScript(seed => {
    try {
      if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("coursework:v2", JSON.stringify(seed)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("studyboard:tour", "done"); }
      localStorage.setItem("studyboard:aiKeys", JSON.stringify({gemini: "AIzaTESTTESTTESTTESTTESTTEST12345"})); localStorage.setItem("studyboard:aiConsent", JSON.stringify({gemini: {v: 1, at: 1}}));
    } catch (e) {}
  }, SEED());
  const page = await ctx.newPage(); const errs = [];
  page.on("pageerror", e => errs.push(e.message)); page.on("console", m => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errs.push(m.text()); });
  const stored = () => page.evaluate(() => JSON.parse(localStorage.getItem("coursework:v2")));
  const text = sel => page.locator(sel).first().textContent().then(t => t.replace(/\s+/g, " ").trim());
  const goGrades = async () => {
    await page.click('nav.tabs [data-tab="courses"]'); await page.waitForTimeout(200);
    await page.evaluate(() => { const b = document.querySelector('[data-act="cf-view"][data-id="grades"]'); if (b) b.click(); }); await page.waitForTimeout(300);
  };
  try {
    await page.goto(base); await page.waitForSelector("#view", {state: "attached"}); await page.waitForTimeout(900);
    await goGrades();

    // Credit-weighted average and GPA
    const hero = await text(".gp-hero-t");
    ok(/Credit-Weighted Average/.test(hero) && /82\.3%/.test(hero), "the hero average is weighted by credits: " + hero);
    const strip = await text(".gp-gpa");
    ok(/Term GPA\s*2\.73/.test(strip), "term GPA from letters and credits: " + strip);
    ok(/Projected Term GPA/.test(strip), "a projected term GPA");
    ok(/1 course has no credits yet, so it counts as 2 credits/.test(strip), "says how a course with no credits counts");
    ok(!/Cumulative/.test(strip), "no cumulative GPA without past terms");

    // Grading rules on the course page
    await page.click('.gp-main[data-id="c1"]'); await page.waitForTimeout(300);
    ok(await page.locator(".gr-dropped").count() === 1, "one quiz is marked Dropped");
    ok(/Quiz 1/.test(await page.locator("li", {has: page.locator(".gr-dropped")}).first().textContent()), "the lowest quiz is the dropped one");
    const need = await text(".gr-need");
    ok(/Grading rules:\s*Lowest quiz dropped\. These numbers already count them/.test(need), "the rules are named: " + need.slice(0, 200));
    ok(/85%/.test(await text(".gr-top .gr-stat")), "current grade counts the drop");

    // Grade Settings: the rule is listed; add a bonus and credits
    await page.click('.gr-headrow [data-act="g-course-set"]'); await page.waitForTimeout(200);
    ok(await page.locator(".gr-drop-row").count() === 1 && await page.locator('.gr-drop-row select[name="dc"]').inputValue() === "Quiz", "the drop rule shows in Grade Settings");
    await page.click("#grDropAdd"); await page.waitForTimeout(80);
    ok(await page.locator(".gr-drop-row").count() === 2, "a second rule can be added");
    await page.locator(".gr-drop-row").nth(1).locator(".gr-drop-del").click();
    ok(await page.locator(".gr-drop-row").count() === 1, "and removed");
    ok(await page.locator('input[name="credits"]').inputValue() === "3", "credits are filled in");
    await page.fill('input[name="bpts"]', "3"); await page.fill('input[name="bgot"]', "4");
    await page.click("dialog [data-submit]"); await page.waitForTimeout(200);
    ok(await page.locator("dialog[open]").count() === 1, "earned bonus over the available bonus is refused");
    await page.fill('input[name="bgot"]', "1");
    await page.click("dialog [data-submit]"); await page.waitForTimeout(300);
    let st = await stored(), R = st.courses.find(c => c.id === "c1").grading.rules;
    ok(R && R.bonus && R.bonus.pts === 3 && R.bonus.got === 1 && R.drops.length === 1 && R.drops[0].cat === "Quiz", "rules saved: " + JSON.stringify(R));
    ok(st.courses.find(c => c.id === "c1").credits === 3, "credits kept");
    ok(/up to 3% bonus \(1% earned\)/.test(await text(".gr-need")), "the bonus is listed with the rules");
    const top = await text(".gr-top");
    ok(/Projected Final\s*86%/.test(top) && /Possible range 52% to 94%/.test(top), "projection counts the drop, earned bonus and bonus still possible: " + top);

    // What If still works with rules
    await page.fill('[data-wi]', "100"); await page.waitForTimeout(150);
    const wi = await text(".gr-wi-out"); ok(/would finish the course on <?b?>?9[0-9.]+%/.test(wi) || /would finish the course on 9[0-9.]+%/.test(wi), "What If counts the rules (85 kept, bonus 1, final 100): " + wi);

    // Credits sheet
    await goGrades();
    await page.click('.gp-gpa [data-act="gp-credits"]'); await page.waitForTimeout(200);
    await page.fill('input[name="cr-c3"]', "4");
    await page.click("dialog [data-submit]"); await page.waitForTimeout(300);
    st = await stored();
    ok(st.courses.find(c => c.id === "c3").credits === 4, "credits saved from the Credits sheet");
    ok(!/no credits yet/.test(await text(".gp-gpa")), "no note once every course has credits");

    // Past Terms: save this term, add an earlier record, see the cumulative GPA
    ok(/Keep each term's final grades/.test(await text(".gp-hist")), "Past Terms starts empty with a short how-to");
    await page.click('[data-act="gp-term-save"]'); await page.waitForTimeout(200);
    await page.fill('dialog input[name="term"]', "Fall 2026");
    await page.click("dialog [data-submit]"); await page.waitForTimeout(300);
    st = await stored();
    let terms = st.settings.grades.terms;
    ok(terms.length === 1 && terms[0].name === "Fall 2026" && terms[0].courses.length === 3, "term saved with its 3 courses");
    ok(terms[0].courses.every(x => x.est === true) && terms[0].courses.find(x => x.code === "ART100").letter === "A", "projected grades are flagged: " + JSON.stringify(terms[0].courses));
    ok(/Fall 2026/.test(await text(".gp-terms")), "the term is listed");
    await page.click('[data-act="gp-term-add"]'); await page.waitForTimeout(200);
    await page.fill('dialog input[name="gpa"]', "3.5"); await page.fill('dialog input[name="credits"]', "30");
    await page.click("dialog [data-submit]"); await page.waitForTimeout(300);
    st = await stored(); terms = st.settings.grades.terms;
    ok(terms.length === 2 && terms.some(t => t.manual && t.gpa === 3.5 && t.credits === 30), "earlier record saved");
    ok(/Cumulative GPA/.test(await text(".gp-gpa")), "a cumulative GPA appears with past terms");
    ok(/Cumulative GPA across past terms: [\d.]+/.test(await text(".gp-hist")), "Past Terms shows the cumulative GPA");
    const rows = await page.locator(".gp-term").allTextContents();
    ok(/Fall 2026/.test(rows[0]) && /Before Studyboard/.test(rows[1]), "newest term first, earlier record last");

    // Edit a term's letter, then delete it
    await page.locator(".gp-term", {hasText: "Fall 2026"}).click(); await page.waitForTimeout(200);
    await page.fill('dialog input[name="tl-0"]', "a-");
    await page.click("dialog [data-submit]"); await page.waitForTimeout(300);
    st = await stored();
    ok(st.settings.grades.terms.find(t => t.name === "Fall 2026").courses[0].letter === "A-", "a letter can be corrected");
    await page.locator(".gp-term", {hasText: "Fall 2026"}).click(); await page.waitForTimeout(200);
    await page.click("#gpTermDel"); await page.waitForTimeout(300);
    st = await stored();
    ok(st.settings.grades.terms.length === 1 && !st.settings.grades.terms.some(t => t.name === "Fall 2026"), "a term can be deleted");

    // Ask AI
    await page.click('[data-act="gp-ai"][data-id="sum"]');
    await page.waitForSelector(".gp-ai-list li", {timeout: 8000});
    const ai = await text(".gp-ai-out");
    ok(/ART100 is your strongest/.test(ai) && !/—/.test(ai), "the AI's points show, without em dashes: " + ai);
    const sent = asks.find(t => /study coach looking at a student's grades/.test(t)) || "";
    ok(/COURSE STA101/.test(sent) && /Grading rules: Lowest quiz dropped/.test(sent) && /Quiz 1 \(Quiz, worth 10%[^)]*\): 50%, dropped/.test(sent), "the AI gets courses, rules and dropped marks");
    ok(/Term GPA from grades now/.test(sent), "and the GPA");

    // GPA off
    await page.evaluate(() => { const d = document.querySelector(".gp-opts"); if (d) d.open = true; });
    await page.selectOption("#gGpaIn", "off"); await page.waitForTimeout(300);
    ok(!/Term GPA/.test(await text(".gp-hero")), "GPA hides when it's off");
    await page.selectOption("#gGpaIn", "4.3"); await page.waitForTimeout(300);
    ok(/Term GPA/.test(await text(".gp-gpa")), "and comes back on a 4.3 scale");

    // Starting a new term saves the grades to Past Terms
    await page.click('nav.tabs [data-tab="courses"]'); await page.waitForTimeout(200);
    await page.evaluate(() => { const b = document.querySelector('[data-act="cf-view"][data-id="courses"]'); if (b) b.click(); }); await page.waitForTimeout(200);
    await page.click('[data-act="new-term"]'); await page.waitForTimeout(200);
    ok(await page.locator('dialog input[name="hist"]').isChecked(), "Start a New Term offers to save grades to Past Terms");
    await page.fill('dialog input[name="term"]', "Winter 2026");
    await page.click("dialog [data-submit]"); await page.waitForTimeout(400);
    st = await stored();
    ok(st.settings.grades.terms.some(t => t.name === "Winter 2026" && t.courses.length === 3), "archiving the term saved its grades");
    ok(st.courses.every(c => c.archived === "Winter 2026"), "and the courses were archived");
    ok(!errs.length, "no console errors" + (errs.length ? ": " + errs.join(" | ") : ""));
    console.log("\ngradegpa.e2e: " + n + " checks passed");
  } finally { await browser.close(); server.close(); }
})().catch(e => { console.error(e); process.exit(1); });
