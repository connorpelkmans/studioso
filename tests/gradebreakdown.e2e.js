// node tests/gradebreakdown.e2e.js (Playwright + Chromium; see tests/pw.js)
// Grades: Where Your Grade Comes From (by type, biggest boost and drag), the opt-in class comparison, and Graded Work Coming Up
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const root = path.join(__dirname, ".."), SHOTS = process.argv[2] || process.env.SHOTS || path.join(require("os").tmpdir(), "gb-shots");
fs.mkdirSync(SHOTS, {recursive: true});
const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x"); let p = decodeURIComponent(u.pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  const ext = path.extname(f), mime = {".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".css": "text/css", ".webmanifest": "application/manifest+json"};
  res.writeHead(200, {"content-type": mime[ext] || "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const day = k => { const d = new Date(); d.setDate(d.getDate() + k); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const T = (id, title, course, type, due, w, mark, extra) => Object.assign({id, title, courseId: course, type, due, start: due, status: mark ? "done" : "todo", priority: "med", weight: w, created: 1000 + Number(id.replace(/\D/g, "")), mark: mark ? {got: mark, outOf: 100} : undefined}, extra || {});
const cls = (key, sc, mean) => ({cv: {key, fb: {c: [], ra: [], sc, of: 100, g: "", cls: {mean, median: mean}}}});
const SEED = () => ({v: 2, updated: 1, settings: {}, courses: [
  {id: "c1", name: "Marine Biology", code: "BIO210", color: "#3B6FE0"},
  {id: "c2", name: "Statistics", code: "STA101", color: "#1E9E74"}], tasks: [
  T("1", "Quiz 1", "c1", "Quiz", day(-40), 10, 95), T("2", "Lab report", "c1", "Assignment", day(-30), 20, 90),
  T("3", "Midterm", "c1", "Exam", day(-20), 30, 65, cls("cv|c1|mid", 65, 70)), T("4", "Quiz 2", "c1", "Quiz", day(-10), 10, 85, cls("cv|c1|q2", 85, 80)),
  T("5", "Final", "c1", "Exam", day(5), 30, null),
  T("6", "Assignment 1", "c2", "Assignment", day(-5), 25, 88), T("7", "Assignment 2", "c2", "Assignment", day(20), 25, null)]});
(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  try {
    const ctx = await browser.newContext({viewport: {width: 390, height: 844}});
    await ctx.addInitScript(seed => {
      try {
        if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("coursework:v2", JSON.stringify(seed)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("studyboard:tour", "done"); }
      } catch (e) {}
    }, SEED());
    const page = await ctx.newPage(); const errs = [];
    page.on("pageerror", e => errs.push(e.message)); page.on("console", m => { if (m.type() === "error") errs.push(m.text()); });
    await page.goto(base); await page.waitForSelector("#view", {state: "attached"}); await page.waitForTimeout(900);
    const overview = async () => {
      await page.click('nav.tabs [data-tab="courses"]'); await page.waitForTimeout(200);
      await page.evaluate(() => { const b = document.querySelector('[data-act="cf-view"][data-id="grades"]'); if (b) b.click(); });
      await page.waitForTimeout(300);
    };
    const course = async id => {
      await page.click('nav.tabs [data-tab="courses"]'); await page.waitForTimeout(150);
      await page.evaluate(() => { const b = document.querySelector('[data-act="cf-view"][data-id="courses"]'); if (b) b.click(); });
      await page.click(`.course-card[data-act="open-course"][data-id="${id}"]`); await page.waitForTimeout(150);
      await page.click('[data-act="course-tab"][data-id="grades"]'); await page.waitForTimeout(250);
    };

    // Graded Work Coming Up
    await overview();
    const soon = page.locator(".gb-soon");
    ok(await soon.count() === 1, "the overview lists graded work coming up");
    const soonTxt = (await soon.textContent()).replace(/\s+/g, " ");
    ok(/30% of BIO210 is due/.test(soonTxt) && /Final \(30%/.test(soonTxt), "it gives the share of the course and names the item: " + soonTxt);
    ok(!/STA101/.test(soonTxt), "work due later than 2 weeks is left out");
    await page.screenshot({path: path.join(SHOTS, "overview.png"), fullPage: true});

    // Where Your Grade Comes From
    await course("c1");
    const gb = page.locator(".gr-sub.gb");
    ok(await gb.count() === 1, "the course Grades tab has a Where Your Grade Comes From section");
    const types = await page.locator(".gb-types li").allTextContents();
    ok(types.length === 3, "one row per type of marked work: " + types.length);
    ok(/Exams/.test(types[2]) && /65%/.test(types[2]), "lowest type is last: " + types[2].replace(/\s+/g, " "));
    const gbTxt = (await gb.textContent()).replace(/\s+/g, " ");
    ok(/Your lowest is Exams, at 65%, 25 points under/.test(gbTxt), "names the weakest type and the gap: " + gbTxt);
    ok(/Exams still make up 30% of the course to come/.test(gbTxt), "says how much of that type is still to come");
    ok(/Biggest boost: Lab report \(\+4\.3 pts\)/.test(gbTxt), "biggest boost is the mark lifting the grade most");
    ok(/Biggest drag: Midterm \(−10\.7 pts\)/.test(gbTxt), "biggest drag is the mark lowering it most");
    ok(await page.locator(".gr-vs").count() === 0 && !/class average/.test(gbTxt), "class comparison is off by default");

    // Turn on the class comparison
    await overview();
    await page.click(".gp-opts summary"); await page.waitForTimeout(100);
    ok(!(await page.isChecked("#gClsIn")), "the option starts unchecked");
    await page.check("#gClsIn"); await page.waitForTimeout(300);
    await course("c1");
    const pills = (await page.locator(".gr-vs").allTextContents()).map(s => s.trim());
    ok(pills.length === 2 && pills.includes("−5 vs class") && pills.includes("+5 vs class"), "marks with class results show the difference: " + pills.join(", "));
    ok(/Above the class average on 1 of 2 items with class results\./.test((await gb.textContent()).replace(/\s+/g, " ")), "a one-line class summary");
    await page.screenshot({path: path.join(SHOTS, "course.png"), fullPage: true});
    const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    ok(over <= 0, "no horizontal scroll on a phone (" + over + ")");

    // A course with one type of work has no type rows
    await course("c2");
    ok(await page.locator(".gb-types").count() === 0, "one type of work shows no breakdown rows");
    ok(!errs.length, "no console errors: " + errs.join(" | "));
    console.log("\ngradebreakdown.e2e: " + n + " checks passed");
  } finally { await browser.close(); server.close(); }
})().catch(e => { console.error(e); process.exit(1); });
