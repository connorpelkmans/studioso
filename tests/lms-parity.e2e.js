// node tests/lms-parity.e2e.js (Playwright + Chromium) School sync in the apps
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const root = path.join(__dirname, "..");
const MIME = {".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".webmanifest": "application/manifest+json", ".png": "image/png", ".css": "text/css", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".webp": "image/webp"};
const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x"); let p = decodeURIComponent(u.pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  res.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const ORIGIN = "https://school.instructure.com";
const iso = d => new Date(Date.now() + d * 864e5).toISOString();
// One read of a Canvas site
const H = {ok: true, origin: ORIGIN, me: {name: "Anna Student"}, errors: [], courses: [
  {ou: "101", code: "BIOL 1200", name: "BIOL 1200 - Anatomy", staff: [{name: "Dr. Lee", email: "lee@school.edu", role: "Instructor"}],
    items: [{kind: "assignment", id: "1", name: "Lab Report 1", due: iso(3), start: null, end: null, text: "Write it up", url: "/courses/101/assignments/1", gid: "1", outOf: 20, done: false, files: []},
      {kind: "assignment", id: "2", name: "Lab Report 0", due: iso(-5), start: null, end: null, text: "", url: "/courses/101/assignments/2", gid: "2", outOf: 20, done: true, files: []},
      {kind: "quiz", id: "3", name: "Chapter 4 Quiz", due: iso(6), start: null, end: null, text: "", url: "/courses/101/quizzes/3", gid: "3", outOf: 10, done: false, files: []}],
    events: [{id: "e1", title: "Midterm Exam", text: "", start: iso(12), end: iso(12.1), allDay: false, where: "Hall A", assoc: false, kind: "", url: ""},
      {id: "e2", title: "Office Hours", text: "", start: iso(2), end: iso(2.05), allDay: false, where: "Room 3", assoc: false, kind: "", url: ""}],
    grades: [{gid: "2", name: "Lab Report 0", num: 18, den: 20, weight: 10, shown: "18", at: iso(-2)}], final: {shown: "90%", pct: 90},
    news: [{id: "n1", title: "Midterm room change", text: "The midterm is now in Hall A.", date: iso(-1), url: "/courses/101/announcements/n1"}]},
  {ou: "102", code: "PSYC 1010", name: "PSYC 1010 - Intro Psych", staff: [],
    items: [{kind: "assignment", id: "4", name: "Reflection Essay", due: iso(9), start: null, end: null, text: "", url: "/courses/102/assignments/4", gid: "4", outOf: 50, done: false, files: []}],
    events: [], grades: [], final: null, news: []}]};

(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  const seed = () => { try { localStorage.setItem("coursework:v2", JSON.stringify({v: 2, updated: 1, courses: [{id: "c1", name: "Anatomy", code: "BIOL 1200", color: "#1E9E74"}, {id: "c2", name: "Intro Psych", code: "PSYC 1010", color: "#3B6FE0"}], tasks: [], settings: {}}));
    localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("studyboard:tour", "done"); } catch (e) {} };
  const snapshot = page => page.evaluate(() => {
    const S = SBLMS.st(), cn = id => (S.courses[id] || {}).code || id;
    const tasks = Object.values(S.tasks).map(t => [cn(t.courseId), t.title, t.type, t.due, t.time || "", t.status, t.mark ? t.mark.got + "/" + t.mark.outOf : "", t.url || ""].join(" | ")).sort();
    const events = Object.values(S.events || {}).map(e => [cn(e.courseId), e.title, e.date, e.start || "", e.where || ""].join(" | ")).sort();
    const c = SBLMS.canvas.cfg();
    return {tasks, events, news: (c.newsItems || []).map(x => x.title).sort(), finals: JSON.stringify(Object.keys(c.finals || {}).sort()), courses: Object.keys(c.courses || {}).sort().join(",")};
  });

  let ctx = await browser.newContext({serviceWorkers: "block"}); await ctx.addInitScript(require("./consent-ok")); await ctx.route(/supabase\.co/, r => r.abort()); await ctx.addInitScript(seed);
  await ctx.addInitScript(h => { window.studiosoLms = {sync: async () => JSON.parse(JSON.stringify(h)), connect: async () => ({ok: true}), signOut: async () => true, file: async () => ({error: "x"}), feed: async () => ({error: "x"})}; }, H);
  let page = await ctx.newPage(); const errs = []; page.on("pageerror", e => errs.push(e.message));
  await page.goto(base); await page.waitForFunction(() => window.SBLMS && SBLMS.canvas, null, {timeout: 40000});
  await page.evaluate(o => SBLMS.canvas.save({mode: "api", host: o, map: {"101": "c1", "102": "c2"}}), ORIGIN);
  await page.evaluate(() => SBLMS.canvas.syncNow({quiet: true}));
  await page.waitForFunction(() => Object.keys(SBLMS.st().tasks).length >= 4, null, {timeout: 20000});
  await page.waitForTimeout(800);
  const app = await snapshot(page);
  await ctx.close();

  ctx = await browser.newContext({serviceWorkers: "block"}); await ctx.route(/supabase\.co/, r => r.abort()); await ctx.addInitScript(seed); await ctx.addInitScript(require("./consent-ok"));
  await ctx.addInitScript(([h, o]) => { localStorage.setItem("studyboard:canvas", JSON.stringify({mode: "api", host: o, map: {"101": "c1", "102": "c2"}}));
    window.addEventListener("message", ev => { const d = ev.data; if (!d || d.source !== "studyboard-app") return;
      if (d.type === "hello") window.postMessage({source: "studyboard-ext", type: "ready", version: "1.0.3"}, location.origin);
      if (d.type === "get") window.postMessage({source: "studyboard-ext", type: "data", version: "1.0.3", schools: [{id: "canvas", origin: o, state: "ok", at: Date.now()}], list: [{v: 1, id: "canvas", origin: o, at: Date.now(), h}]}, location.origin); }); }, [H, ORIGIN]);
  page = await ctx.newPage(); page.on("pageerror", e => errs.push(e.message));
  await page.goto(base); await page.waitForFunction(() => window.SBLMS && SBLMS.canvas, null, {timeout: 40000});
  await page.waitForSelector("#dlg[open] [data-ext-no]", {timeout: 20000}); await page.click("#dlg[open] [data-submit]");
  await page.waitForFunction(() => Object.keys(SBLMS.st().tasks).length >= 4, null, {timeout: 20000});
  await page.waitForTimeout(800);
  const ext = await snapshot(page);
  await ctx.close();

  console.log("app tasks:\n  " + app.tasks.join("\n  "));
  ok(app.tasks.length >= 5, "the app path brought in every assignment, the quiz and the calendar exam (" + app.tasks.length + " tasks)");
  ok(JSON.stringify(app.tasks) === JSON.stringify(ext.tasks), "the extension gives exactly the same tasks (course, title, type, due date and time, status, mark, link)" + (JSON.stringify(app.tasks) === JSON.stringify(ext.tasks) ? "" : "\napp: " + JSON.stringify(app.tasks) + "\next: " + JSON.stringify(ext.tasks)));
  ok(app.tasks.some(t => /Lab Report 0 .*\| done \| 18\/20/.test(t)) && app.tasks.some(t => /Lab Report 1 .*\| todo \|/.test(t)), "submitted work is Complete with its mark; unsubmitted work is To Do");
  ok(JSON.stringify(app.events) === JSON.stringify(ext.events) && app.events.some(e => /Office Hours/.test(e)), "the same calendar events: " + app.events.join("; "));
  ok(JSON.stringify(app.news) === JSON.stringify(ext.news) && app.news.length === 1, "the same announcements: " + app.news.join("; "));
  ok(app.finals === ext.finals && app.finals.includes("101"), "the same final grades");
  ok(app.courses === ext.courses, "the same courses linked");
  ok(!errs.length, "no page errors: " + errs.join(" | "));
  await browser.close(); server.close();
  console.log(`\nlms-parity.e2e: ${n} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
