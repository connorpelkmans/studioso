// node tests/gradeinsight.e2e.js   (Playwright + Chromium; see tests/pw.js)
// Grades: the "What Do I Need?" line on the Grades page, goal distance, biggest swing, and the what-if boxes (nothing is saved).
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const root = path.join(__dirname, ".."), SHOTS = process.argv[2] || process.env.SHOTS || path.join(require("os").tmpdir(), "gt-shots");
fs.mkdirSync(SHOTS, {recursive: true});
const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x"); let p = decodeURIComponent(u.pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  const ext = path.extname(f), mime = {".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".css": "text/css", ".webmanifest": "application/manifest+json"};
  res.writeHead(200, {"content-type": mime[ext] || "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const T = (id, title, course, due, w, mark, extra) => Object.assign({id, title, courseId: course, type: "Assignment", due, start: due, status: mark ? "done" : "todo", priority: "med", weight: w, created: 1000 + Number(id.replace(/\D/g, "")), mark: mark ? {got: mark, outOf: 100} : undefined}, extra || {});
const SEED = () => ({v: 2, updated: 1, settings: {}, courses: [
  {id: "c1", name: "Marine Biology", code: "BIO210", color: "#3B6FE0", grading: {goal: 80}},
  {id: "c2", name: "Statistics", code: "STA101", color: "#1E9E74"},
  {id: "c3", name: "Art History", code: "ART100", color: "#C79A12"}], tasks: [
  T("1", "Quiz 1", "c1", "2026-09-01", 10, 70), T("2", "Lab report", "c1", "2026-09-10", 20, 78),
  T("3", "Midterm", "c1", "2026-09-20", 30, 84, {cv: {key: "cv|c1|midterm", ou: "1"}, mark: {got: 84, outOf: 100, src: "cv"}}), T("4", "Quiz 2", "c1", "2026-09-27", 10, 90),
  T("5", "Final", "c1", "2026-12-15", 30, null),
  T("6", "Assignment 1", "c2", "2026-09-05", 25, 88), T("7", "Assignment 2", "c2", "2026-12-05", 25, null),
  T("8", "Essay", "c3", "2026-12-01", null, null)].filter(Boolean)});
(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  const mkCtx = async (o = {}) => {
    const ctx = await browser.newContext({viewport: {width: o.w || 390, height: o.h || 844}});
    await ctx.addInitScript(([seed, stubGroups]) => {
      try {
        if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("coursework:v2", JSON.stringify(seed)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("studyboard:tour", "done"); }
      } catch (e) {}
      if (stubGroups != null) {
        const rows = stubGroups;
        const chain = () => new Proxy({}, {get: (t, k) => k === "then" ? (res => res({data: rows, error: null})) : () => chain()});
        window.__sbGroupsStub = {user: {id: "u1", email: "u1@x.com"}, client: {from: () => chain(), rpc: () => chain(), channel: () => ({on() { return this; }, subscribe() { return this; }}), removeChannel() {}}};
      }
    }, [o.seed ? o.seed(SEED()) : SEED(), o.groups == null ? null : o.groups]);
    return ctx;
  };
  const open = async ctx => { const page = await ctx.newPage(); page.errs = []; page.on("pageerror", e => page.errs.push(e.message)); page.on("console", m => { if (m.type() === "error") page.errs.push(m.text()); }); await page.goto(base); await page.waitForSelector("#view", {state: "attached"}); await page.waitForTimeout(900); return page; };
  const noOverflow = async (page, what) => { const o = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth); ok(o <= 0, "no horizontal scroll " + what + " (" + o + ")"); };
  const noErr = (page, what) => ok(!page.errs.length, "no console errors " + what + (page.errs.length ? ": " + page.errs.join(" | ") : ""));
  const goCourse = async (page, id) => {
    await page.click('nav.tabs [data-tab="courses"]'); await page.waitForTimeout(150);
    await page.evaluate(() => { const b = document.querySelector('[data-act="cf-view"][data-id="courses"]'); if (b) b.click(); });
    await page.click(`.course-card[data-act="open-course"][data-id="${id}"]`); await page.waitForTimeout(150);
    await page.click('[data-act="course-tab"][data-id="grades"]'); await page.waitForTimeout(250);
  };
  try {
    const ctx = await mkCtx({seed: s => { s.tasks.push(T("9", "Quiz 3", "c1", "2026-11-01", 10, null)); s.tasks.forEach(x => { if (x.id === "5") x.weight = 20; }); return s; }}); const page = await open(ctx);
    await page.click('nav.tabs [data-tab="courses"]'); await page.waitForTimeout(250);
    await page.evaluate(() => { const b = document.querySelector('[data-act="cf-view"][data-id="grades"]'); if (b) b.click(); });
    await page.waitForTimeout(300);
    const need = await page.locator(".gp-need").textContent();
    ok(/What Do I Need\?/.test(need) && /You need [\d.]+% on the rest of/.test(need), "top line names a course and what it needs: " + need);
    const card = await page.locator('.gp-course', {hasText: 'BIO210'}).first().textContent();
    ok(/pts (above|to) goal/.test(card), "a course with a goal shows the distance to it: " + card.replace(/\s+/g, " ").slice(0, 160));
    await goCourse(page, "c1");
    ok(/Biggest swing:\s*Final is worth 20%/.test(await page.locator(".gr-need").textContent()), "biggest swing names the heaviest unmarked item");
    ok(await page.locator(".gr-swing").count() === 1, "its row carries a Biggest swing pill");
    ok(/pts (above|to) goal/.test(await page.locator(".gr-pass").textContent()), "goal distance sits beside the pass mark");
    ok(/Nothing is saved/.test(await page.locator(".gr-wi-out").textContent()), "what-if starts empty");
    const before = await page.evaluate(() => JSON.stringify(Object.values(JSON.parse(localStorage.getItem("coursework:v2")).tasks || {})));
    await page.fill('[data-wi]', "100"); await page.waitForTimeout(150);
    const out = await page.locator(".gr-wi-out").textContent();
    ok(/would be/.test(out) && /goal|pass/.test(out), "typing a mark updates the projection: " + out);
    await page.fill('[data-wi]', "abc"); await page.waitForTimeout(100);
    ok(await page.locator('[data-wi][aria-invalid="true"]').count() === 1, "an unreadable mark is flagged");
    await page.fill('[data-wi]', "43/50"); await page.waitForTimeout(100);
    ok(/would be/.test(await page.locator(".gr-wi-out").textContent()), "a fraction works too");
    await page.click('[data-act="wi-clear"]'); await page.waitForTimeout(200);
    ok(await page.locator('[data-wi]').first().inputValue() === "", "Clear What-Ifs empties the boxes");
    const after = await page.evaluate(() => JSON.stringify(Object.values(JSON.parse(localStorage.getItem("coursework:v2")).tasks || {})));
    ok(before === after, "nothing was saved");
    ok(!page.errs.length, "no console errors: " + page.errs.join(" | "));
    console.log("\ngradeinsight.e2e: " + n + " checks passed");
  } finally { await browser.close(); server.close(); }
})().catch(e => { console.error(e); process.exit(1); });
