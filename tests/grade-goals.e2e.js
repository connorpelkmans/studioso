// node tests/grade-goals.e2e.js (Playwright + Chromium; see tests/pw.js) Grade Goals: Target Grade on a course page, and Today's Plan
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
const pad = x => String(x).padStart(2, "0");
const day = k => { const d = new Date(); d.setDate(d.getDate() + k); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
let seq = 0;
const T = (id, title, course, due, w, mark, extra) => Object.assign({id, title, courseId: course, type: "Assignment", due, status: mark != null ? "done" : "todo", priority: "med", weight: w, hours: 3, created: 1000 + seq++, mark: mark != null ? {got: mark, outOf: 100} : undefined}, extra || {});
// Two look-alike courses: Biology aims for 85 and averages 78, Statistics has no target. Chemistry is near its pass mark.
const SEED = () => ({v: 2, updated: 1, settings: {grades: {prompt: false}}, courses: [
  {id: "c1", name: "Marine Biology", code: "BIO210", color: "#3B6FE0", grading: {goal: 85}},
  {id: "c2", name: "Statistics", code: "STA101", color: "#1E9E74"},
  {id: "c3", name: "Organic Chemistry", code: "CHM220", color: "#C0563A", grading: {goal: 90}},
  {id: "c4", name: "Art History", code: "ART100", color: "#C79A12", grading: {goal: 70}}], tasks: [
  T("b1", "Quiz 1", "c1", day(-30), 10, 76), T("b2", "Lab report 1", "c1", day(-20), 15, 80), T("b3", "Midterm", "c1", day(-10), 25, 78),
  T("b4", "Lab report 2", "c1", day(6), 15, null), T("b5", "Final exam", "c1", day(12), 35, null, {type: "Exam", hours: undefined}),
  T("b6", "Final exam review", "c1", day(5), null, null, {type: "Study", prepFor: "b5", hours: 1}),
  T("s1", "Problem set 1", "c2", day(-30), 10, 77), T("s2", "Problem set 2", "c2", day(-20), 15, 79), T("s3", "Midterm", "c2", day(-10), 25, 78),
  T("s4", "Problem set 3", "c2", day(6), 15, null), T("s5", "Final exam", "c2", day(12), 35, null, {type: "Exam", hours: undefined}),
  T("h1", "Quiz 1", "c3", day(-25), 30, 48), T("h2", "Midterm", "c3", day(-8), 30, 52), T("h3", "Lab practical", "c3", day(6), 40, null),
  T("a1", "Essay 1", "c4", day(-20), 50, 92), T("a2", "Essay 2", "c4", day(6), 50, null)]});
(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  const mkCtx = async (o = {}) => {
    const ctx = await browser.newContext({viewport: {width: o.w || 390, height: o.h || 844}});
    await ctx.addInitScript(seed => {
      try { if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("coursework:v2", JSON.stringify(seed)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("studyboard:tour", "done"); } } catch (e) {}
    }, o.seed ? o.seed(SEED()) : SEED());
    return ctx;
  };
  const open = async ctx => { const page = await ctx.newPage(); page.errs = []; page.on("pageerror", e => page.errs.push(e.message)); page.on("console", m => { if (m.type() === "error") page.errs.push(m.text()); }); await page.goto(base); await page.waitForSelector("#view", {state: "attached"}); await page.waitForTimeout(900); return page; };
  const noOverflow = async (page, what) => { const o = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth); ok(o <= 0, "no horizontal scroll " + what + " (" + o + ")"); };
  const goCourse = async (page, id, tab) => {
    await page.click('nav.tabs [data-tab="courses"]'); await page.waitForTimeout(150);
    await page.evaluate(() => { const b = document.querySelector('[data-act="cf-view"][data-id="courses"]'); if (b) b.click(); });
    await page.click(`.course-card[data-act="open-course"][data-id="${id}"]`); await page.waitForTimeout(200);
    if (tab) { await page.click(`[data-act="course-tab"][data-id="${tab}"]`); await page.waitForTimeout(250); }
  };
  const plan = page => page.evaluate(() => window.__sbPlan());
  const stored = page => page.evaluate(() => JSON.parse(localStorage.getItem("coursework:v2")).courses);
  try {
    /* Today's Plan */
    const ctx = await mkCtx(); const page = await open(ctx);
    let P = await plan(page);
    const r = id => P.ranked.find(x => x.id === id);
    ok(r("b4") && r("s4"), "both look-alike tasks are in the plan");
    ok(r("b4").score > r("s4").score, `the course under its target ranks higher (${r("b4").score} vs ${r("s4").score})`);
    ok(r("b4").reasons.some(x => /BIO210 is [\d.]+ pts under your 85% target: you need about \d+% on what's left/.test(x)), "it says why: " + r("b4").reasons.slice(0, 3).join(" | "));
    ok(!r("s4").reasons.some(x => /target/.test(x)), "the course without a target gets no target reason");
    ok(r("b6") && r("b6").reasons.some(x => /target/.test(x)), "a study session for the course's graded exam gets the lift too");
    ok(r("h3").reasons.some(x => /pass/i.test(x)) && !r("h3").reasons.some(x => /target/.test(x)), "a course near its pass mark keeps the pass reason, not a target one");
    ok(r("a2") && !r("a2").reasons.some(x => /target/.test(x)), "a course already above its target gets no lift");
    const liftB = r("b4").score / r("s4").score;
    ok(liftB > 1.05 && liftB < 1.2, "the lift is gentle (" + liftB.toFixed(3) + "), below a pass-mark risk");

    /* The field on the course page */
    await goCourse(page, "c1");
    const side = page.locator(".c2-card2 .gr-target");
    ok(await side.count() === 1, "Overview's grade card has one Target Grade field");
    ok(await side.locator("input").inputValue() === "85", "it shows the target");
    ok(/pts under it now, so Today.s Plan gives this course more time/.test(await side.locator(".gr-target-n").textContent()), "and says what it means");
    await noOverflow(page, "course overview (phone)");
    await goCourse(page, "c2", "grades");
    const gf = page.locator(".gr-card .gr-target");
    ok(await page.locator(".gr-goal-ask").count() === 1 && await gf.count() === 0, "a course with marks and no target first asks once (no duplicate field)");
    await page.click('[data-act="g-goal-no"]'); await page.waitForTimeout(200);
    ok(await gf.count() === 1 && await gf.locator("input").inputValue() === "", "after Not Now, the empty Target Grade field shows");
    await gf.locator("input").fill("88"); await gf.locator("input").press("Tab"); await page.waitForTimeout(300);
    ok((await stored(page)).find(c => c.id === "c2").grading.goal === 88, "typing a target saves it");
    ok(/Statistics|STA101/.test(await page.locator(".gr-card").textContent()) && /pts to goal|pts under goal/.test(await page.locator(".gr-card").textContent()), "the grade card shows the distance to it");
    P = await plan(page);
    ok(r("s4").reasons.some(x => /STA101 is [\d.]+ pts under your 88% target/.test(x)), "Today's Plan picks the new target up straight away");
    await page.click("#toastUndo"); await page.waitForTimeout(400);
    ok(((await stored(page)).find(c => c.id === "c2").grading || {}).goal == null, "Undo takes it back");
    await goCourse(page, "c2", "grades");
    await gf.locator("input").fill("150"); await gf.locator("input").press("Tab"); await page.waitForTimeout(250);
    ok(await page.locator('[data-goal-in][aria-invalid="true"]').count() === 1 && ((await stored(page)).find(c => c.id === "c2").grading || {}).goal == null, "an impossible target is flagged and not saved");
    await goCourse(page, "c1", "grades");
    await gf.locator("input").fill(""); await gf.locator("input").press("Tab"); await page.waitForTimeout(300);
    ok((await stored(page)).find(c => c.id === "c1").grading.goal == null, "clearing the field removes the target");
    P = await plan(page);
    ok(!r("b4").reasons.some(x => /target/.test(x)), "and the plan stops lifting that course");
    await goCourse(page, "c4", "grades");
    ok(/On track/.test(await page.locator(".gr-card .gr-target-n").textContent()), "a course above its target says it's on track");
    await goCourse(page, "c3", "grades");
    ok(await page.locator(".gr-card .gr-target").count() === 1, "a course at pass-mark risk still shows its target field");
    await noOverflow(page, "grades tab (phone)");
    ok(!page.errs.length, "no console errors: " + page.errs.join(" | "));
    await ctx.close();

    /* Desktop width, and a course with no graded work */
    const ctx2 = await mkCtx({w: 1280, h: 860, seed: s => { s.courses.push({id: "c5", name: "Seminar", code: "SEM1", color: "#777"}); return s; }}); const p2 = await open(ctx2);
    await goCourse(p2, "c1");
    ok(await p2.locator(".c2-card2 .gr-target").count() === 1, "desktop overview shows the field");
    await noOverflow(p2, "course overview (desktop)");
    await goCourse(p2, "c5");
    ok(await p2.locator(".gr-target").count() === 0, "a course with no graded work shows no field");
    ok(!p2.errs.length, "no console errors on desktop: " + p2.errs.join(" | "));
    console.log("\ngrade-goals.e2e: " + n + " checks passed");
  } finally { await browser.close(); server.close(); }
})().catch(e => { console.error(e); process.exit(1); });
