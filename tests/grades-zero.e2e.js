// node tests/grades-zero.e2e.js
// A course whose every mark is 0% is flagged as probably missing marks (Grades page, the grades AI, the companion), not treated as a real F
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const csp = require("../scripts/csp");
const root = path.join(__dirname, "..");
const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x"); let p = decodeURIComponent(u.pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  const mime = {".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".css": "text/css"};
  res.writeHead(200, {"content-type": mime[path.extname(f)] || "application/octet-stream"});
  if (p === "/index.html") { res.end(csp.apply(fs.readFileSync(f, "utf8"))); return; }
  fs.createReadStream(f).pipe(res);
});
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const T = (id, title, course, due, w, got) => ({id, title, courseId: course, type: "Assignment", due, status: got != null ? "done" : "todo", priority: "med", weight: w, created: 1, mark: got != null ? {got, outOf: 100} : undefined});
const SEED = {v: 2, updated: 1, settings: {}, courses: [{id: "c1", name: "Context of Nursing", code: "BSNC 1020", color: "#1E9E74"}, {id: "c2", name: "Nursing Knowledge", code: "BSNC 1000", color: "#C79A12"}],
  tasks: [T("a1", "Paper", "c1", "2026-10-01", 50, 0), T("a2", "Exam", "c1", "2026-10-10", 50, 0), T("b1", "Quiz", "c2", "2026-10-05", 30, 73), T("b2", "Final", "c2", "2026-12-10", 70, null)]};
(async () => {
  await new Promise(r => server.listen(0, r));
  const browser = await chromium.launch({executablePath});
  try {
    const ctx = await browser.newContext({viewport: {width: 1280, height: 900}});
    await ctx.addInitScript(seed => { window.__SB_TEST = true; try { if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("coursework:v2", JSON.stringify(seed)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("studyboard:tour", "done");
      localStorage.setItem("studyboard:aiKeys", JSON.stringify({gemini: "AIzaTESTTESTTESTTESTTESTTEST12345"})); localStorage.setItem("studyboard:aiConsent", JSON.stringify({gemini: {v: 1, at: 1}})); } } catch (e) {} }, SEED);
    await ctx.route(/generativelanguage\.googleapis\.com/, route => { ctx.last = route.request().postData(); route.fulfill({status: 200, contentType: "application/json", body: JSON.stringify({candidates: [{content: {parts: [{text: JSON.stringify({points: ["ok"], bullets: ["ok"], answer: "ok"})}]}, finishReason: "STOP"}]})}); });
    const page = await ctx.newPage(); const errs = []; page.on("pageerror", e => errs.push(e.message));
    await page.goto("http://localhost:" + server.address().port + "/"); await page.waitForFunction(() => window.__sbSync && window.SBGRADES);
    await page.click('nav.tabs [data-tab="courses"]'); await page.waitForTimeout(200);
    await page.evaluate(() => { const b = document.querySelector('[data-act="cf-view"][data-id="grades"]'); if (b) b.click(); }); await page.waitForTimeout(300);
    const rowTxt = c => page.evaluate(c => { const r = [...document.querySelectorAll(".gp-course")].find(x => x.textContent.includes(c)); return r ? r.textContent : ""; }, c);
    ok(/Every mark here is 0%\. That usually means the marks aren't in yet/.test(await rowTxt("BSNC 1020")), "the all-zero course says to check its marks");
    ok(!/Every mark here is 0%/.test(await rowTxt("BSNC 1000")), "a normal course doesn't");
    // the note sits under the course name, as wide as the row's text (it used to fall into the narrow ring column)
    const noteBox = () => page.evaluate(() => { const z = document.querySelector(".gp-zero"), w = z.closest(".gp-main").querySelector(".gp-who"); const a = z.getBoundingClientRect(), b = w.getBoundingClientRect(); return {w: a.width, h: a.height, dx: Math.abs(a.left - b.left), below: a.top >= b.bottom - 1}; });
    for (const [W, H] of [[1280, 900], [390, 844]]) {
      await page.setViewportSize({width: W, height: H}); await page.waitForTimeout(300);
      const z = await noteBox();
      ok(z.w > (W > 600 ? 400 : 240) && z.h < 70 && z.dx < 2 && z.below, `the 0% note is a short wide line under the course name at ${W}px (${Math.round(z.w)}x${Math.round(z.h)}, off by ${Math.round(z.dx)})`);
      if (process.env.SHOT) await page.locator(".gp-course", {hasText: "BSNC 1020"}).screenshot({path: process.env.SHOT + "/zero-" + W + ".png"});
    }
    await page.setViewportSize({width: 1280, height: 900});
    const lines = await page.evaluate(() => window.SBGRADES.lines().join("\n"));
    ok(/BSNC 1020.*LOOKS WRONG: every mark in this course is 0%/.test(lines) && !/BSNC 1000.*LOOKS WRONG/.test(lines), "the companion and Ask With AI get the same warning");
    const focus = page.locator("button", {hasText: "Where Should I Focus?"}).first();
    if (await focus.count()) {
      await focus.click(); for (let i = 0; i < 40 && !ctx.last; i++) await page.waitForTimeout(100);
      const b = JSON.parse(ctx.last), txt = b.contents[0].parts.map(p => p.text || "").join(""), sys = b.systemInstruction.parts[0].text;
      ok(/COURSE BSNC 1020[\s\S]*LOOKS WRONG/.test(txt), "Where Should I Focus? sees the warning on the course");
      ok(/If a course is marked LOOKS WRONG[^.]*say that first/.test(sys) && /grade says final can no longer change/.test(sys) && /not final may still get more marks/.test(sys), "and is told to raise it first, and that a finished course can't change");
    } else ok(false, "Where Should I Focus? button is on the Grades page");
    ok(!errs.length, "no page errors: " + errs.join(" | "));
    console.log("\ngrades-zero.e2e: " + n + " checks passed");
  } finally { await browser.close(); server.close(); }
})().catch(e => { console.error(e); process.exit(1); });
