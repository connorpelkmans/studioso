// node tests/grades-final.e2e.js: a course isn't "Final" just because everything listed is marked; only a couple of weeks after classes end
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const root = path.join(__dirname, "..");
const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x"); let p = decodeURIComponent(u.pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  const mime = {".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".css": "text/css"};
  res.writeHead(200, {"content-type": mime[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const pad = x => String(x).padStart(2, "0");
const day = k => { const d = new Date(); d.setDate(d.getDate() + k); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const T = (id, course, due, w, got, extra) => Object.assign({id, title: "Item " + id, courseId: course, type: "Assignment", due, status: got != null ? "done" : "todo", priority: "med", weight: w, created: 1, mark: got != null ? {got, outOf: 100} : undefined}, extra || {});
const SEED = {v: 2, updated: 1, settings: {grades: {prompt: false}}, courses: [
  {id: "c1", name: "Practice of Nursing", code: "BSNC 1030", color: "#C0392B"},
  {id: "c2", name: "Old Course", code: "OLD 100", color: "#3B6FE0"},
  {id: "c3", name: "Weekly Class", code: "WK 200", color: "#1E9E74"},
  {id: "c4", name: "Ended Weekly", code: "WK 300", color: "#C79A12"}],
  tasks: [
    // c1: everything listed is marked, but the term is still going (last date a few days ago, plus an ungraded reading next week)
    T("a1", "c1", day(-20), 50, 100), T("a2", "c1", day(-5), 50, 100), T("a3", "c1", day(6), null, null, {type: "Reading"}),
    // c2: everything marked and the last date was over two weeks ago
    T("b1", "c2", day(-60), 40, 80), T("b2", "c2", day(-30), 60, 90),
    // c3: old dates, but a weekly class with no end date is still running
    T("w1", "c3", day(-40), 100, 70),
    // c4: weekly class that ended over two weeks ago
    T("x1", "c4", day(-50), 100, 75)],
  events: [
    {id: "e1", title: "WK 200 lecture", courseId: "c3", date: day(-70), start: "09:00", end: "10:00", repeat: {days: [1], every: 1, until: ""}},
    {id: "e2", title: "WK 300 lecture", courseId: "c4", date: day(-90), start: "09:00", end: "10:00", repeat: {days: [2], every: 1, until: day(-20)}}]};
(async () => {
  await new Promise(r => server.listen(0, r));
  const browser = await chromium.launch({executablePath});
  try {
    const ctx = await browser.newContext({viewport: {width: 1280, height: 900}});
    await ctx.addInitScript(seed => { window.__SB_TEST = true; try { if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("coursework:v2", JSON.stringify(seed)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("studyboard:tour", "done"); } } catch (e) {} }, SEED);
    const page = await ctx.newPage(); const errs = []; page.on("pageerror", e => errs.push(e.message));
    await page.goto("http://localhost:" + server.address().port + "/"); await page.waitForFunction(() => window.__sbSync && window.SBGRADES);
    await page.click('nav.tabs [data-tab="courses"]'); await page.waitForTimeout(200);
    await page.evaluate(() => { const b = document.querySelector('[data-act="cf-view"][data-id="grades"]'); if (b) b.click(); }); await page.waitForTimeout(300);
    const row = c => page.evaluate(c => { const r = [...document.querySelectorAll(".gp-course")].find(x => x.textContent.includes(c)); return r ? r.querySelector(".gp-line").textContent : ""; }, c);
    const r1 = await row("BSNC 1030");
    ok(!/^Final/.test(r1) && /100% A\+ on everything marked so far\. Not final until a couple of weeks after classes end\./.test(r1), "all marked mid-term: not called final: " + r1);
    ok(/^Final 86/.test(await row("OLD 100")), "all marked and classes ended over two weeks ago: Final: " + await row("OLD 100"));
    ok(!/^Final/.test(await row("WK 200")), "a weekly class with no end date keeps it from being final: " + await row("WK 200"));
    ok(/^Final 75/.test(await row("WK 300")), "a weekly class that ended over two weeks ago lets it be final: " + await row("WK 300"));
    const lines = await page.evaluate(() => window.SBGRADES.lines().join("\n"));
    ok(/BSNC 1030.*not final/i.test(lines) && /OLD 100.*Final 86/.test(lines), "the companion and AI are told the same");
    // archived (put away in a past term) counts as over
    await page.evaluate(() => { const s = window.__sbSync.state; s.courses.c1.archived = "Fall"; window.__sbSync.render(); }); await page.waitForTimeout(200);
    ok(await page.evaluate(() => /^Final/.test(window.SBGRADES.now(window.__sbSync.state.courses.c1).line)), "a course put away in a past term is final");
    ok(!errs.length, "no page errors: " + errs.join(" | "));
    console.log("\ngrades-final.e2e: " + n + " checks passed");
  } finally { await browser.close(); server.close(); }
})().catch(e => { console.error(e); process.exit(1); });
