// node tests/lms-moodle.e2e.js: the Moodle reader (lms.js mdHarvest) on a fake Moodle site: courses and the calendar through
// Moodle's AJAX service, what's submitted and marks from the assignment, quiz and grade report pages, announcements from the
// announcements forum; signed out means "sign in again". Then the app turns it into tasks.
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const L = require("../lms.js");
const root = path.join(__dirname, "..");
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const NOW = Math.floor(Date.now() / 1000), DAY = 86400;
let signedIn = true; const ajax = [];
const html = body => `<!doctype html><html><head><script>var M = {cfg: {"wwwroot":"x","sesskey":"sk123"}};</script></head><body>${body}</body></html>`;
const ev = (id, name, type, mod, cm, t, extra) => Object.assign({id, name, eventtype: type, modulename: mod, timestart: t, timesort: t, timeduration: 0, course: {id: 11}, url: mod ? `BASE/mod/${mod}/view.php?id=${cm}` : "", description: ""}, extra || {});
const moodle = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x"), base = "http://127.0.0.1:" + moodle.address().port;
  const send = (s, type) => { res.writeHead(200, {"content-type": type || "text/html"}); res.end(s); };
  if (!signedIn && u.pathname !== "/login/index.php" && u.pathname !== "/lib/ajax/service.php") { res.writeHead(303, {location: "/login/index.php"}); res.end(); return; }
  if (u.pathname === "/login/index.php") return send(html(`<form action="${base}/login/index.php"><input name="username"></form>`));
  if (u.pathname === "/my/") return send(html(`<div class="usermenu" data-userid="7"><span class="usertext">Sam Lee</span></div>`));
  if (u.pathname === "/user/profile.php") return send(html(`<div data-userid="7"></div><div class="page-header-headings"><h1>Sam Lee</h1></div>`));
  if (u.pathname === "/lib/ajax/service.php") {
    let body = ""; req.on("data", c => body += c); req.on("end", () => {
      const [call] = JSON.parse(body); ajax.push(call.methodname + (u.searchParams.get("sesskey") === "sk123" ? "" : " BAD-SESSKEY"));
      if (!signedIn) return send(JSON.stringify([{error: true, exception: {errorcode: "servicerequireslogin"}}]), "application/json");
      if (call.methodname === "core_course_get_enrolled_courses_by_timeline_classification") return send(JSON.stringify([{error: false, data: {courses: [{id: 11, fullname: "Introductory Chemistry", shortname: "CHEM 1010", hidden: false}, {id: 12, fullname: "Old Course", shortname: "OLD 100", hidden: true}], nextoffset: 0}}]), "application/json");
      if (call.methodname === "core_calendar_get_calendar_monthly_view") {
        const {year, month} = call.args, inMonth = t => { const d = new Date(t * 1000); return d.getFullYear() === year && d.getMonth() + 1 === month; };
        const all = [ev(1, "Lab report 2 is due", "due", "assign", 101, NOW + 3 * DAY), ev(2, "Essay is due", "due", "assign", 102, NOW + 9 * DAY),
          ev(3, "Unit 3 quiz opens", "open", "quiz", 201, NOW + 2 * DAY), ev(4, "Unit 3 quiz closes", "close", "quiz", 201, NOW + 4 * DAY),
          ev(5, "Midterm review session", "course", "", 0, NOW + 5 * DAY), ev(6, "Lab report 1 is due", "due", "assign", 100, NOW - 6 * DAY)].filter(e => inMonth(e.timestart))
          .map(e => Object.assign(e, {url: e.url.replace("BASE", base)}));
        return send(JSON.stringify([{error: false, data: {weeks: [{days: [{events: all}]}]}}]), "application/json");
      }
      return send(JSON.stringify([{error: true, exception: {errorcode: "invalidrecord"}}]), "application/json");
    }); return;
  }
  if (u.pathname === "/mod/assign/index.php") return send(html(`<table class="generaltable"><thead><tr><th>Topic</th><th>Assignments</th><th>Due date</th><th>Submission</th><th>Grade</th></tr></thead><tbody>
    <tr><td>1</td><td><a href="${base}/mod/assign/view.php?id=100">Lab report 1</a></td><td>x</td><td>Submitted for grading</td><td>17.00 / 20.00</td></tr>
    <tr><td>1</td><td><a href="${base}/mod/assign/view.php?id=101">Lab report 2</a></td><td>x</td><td>Submitted for grading</td><td>-</td></tr>
    <tr><td>2</td><td><a href="${base}/mod/assign/view.php?id=102">Essay</a></td><td>x</td><td>No submission</td><td>-</td></tr></tbody></table>`));
  if (u.pathname === "/mod/quiz/index.php") return send(html(`<table class="generaltable"><thead><tr><th>Topic</th><th>Name</th><th>Quiz closes</th><th>Grade / 10.00</th></tr></thead><tbody>
    <tr><td>1</td><td><a href="${base}/mod/quiz/view.php?id=201">Unit 3 quiz</a></td><td>x</td><td></td></tr></tbody></table>`));
  if (u.pathname === "/grade/report/user/index.php") return send(html(`<table class="user-grade"><tbody>
    <tr><th class="column-itemname"><a href="${base}/mod/assign/view.php?id=100">Lab report 1</a></th><td class="column-weight">20.00 %</td><td class="column-grade">17.00</td><td class="column-range">0–20</td><td class="column-percentage">85.00 %</td></tr>
    <tr><th class="column-itemname"><a href="${base}/mod/quiz/view.php?id=201">Unit 3 quiz</a></th><td class="column-weight">10.00 %</td><td class="column-grade">-</td><td class="column-range">0–10</td><td class="column-percentage">-</td></tr>
    <tr><th class="column-itemname">Course total</th><td class="column-weight">-</td><td class="column-grade">17.00</td><td class="column-range">0–30</td><td class="column-percentage">56.67 %</td></tr></tbody></table>`));
  if (u.pathname === "/mod/forum/index.php") return send(html(`<table><tr><td><a href="${base}/mod/forum/view.php?f=5">Announcements</a></td></tr></table>`));
  if (u.pathname === "/mod/forum/view.php") return send(html(`<table><tr class="discussion"><th class="topic"><a href="${base}/mod/forum/discuss.php?d=9">Lab moved to Thursday</a></th></tr></table>`));
  if (u.pathname === "/mod/forum/discuss.php") return send(html(`<article><time datetime="${new Date((NOW - DAY) * 1000).toISOString()}">yesterday</time><div class="post-content-container"><p>This week's lab is on <b>Thursday</b> instead.</p></div></article>`));
  res.writeHead(404); res.end("no");
});
const app = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  res.writeHead(200, {"content-type": p.endsWith(".html") ? "text/html" : p.endsWith(".js") ? "text/javascript" : p.endsWith(".css") ? "text/css" : "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
(async () => {
  await new Promise(r => moodle.listen(0, "127.0.0.1", r)); await new Promise(r => app.listen(0, r));
  const site = "http://127.0.0.1:" + moodle.address().port, browser = await chromium.launch({executablePath});
  const errs = [];
  try {
    const ctx = await browser.newContext(), page = await ctx.newPage(); page.on("pageerror", e => errs.push(e.message));
    await page.goto(site + "/my/");
    const run = () => page.evaluate(L.harvestScript(L.P.moodle, {pastDays: 60, aheadDays: 120, grades: true, news: true, marks: L.markSwitches(), skip: [], only: null}));
    const h = await run();
    ok(h.ok && h.me.name === "Sam Lee" && h.me.id === "7", "signed in as Sam Lee");
    ok(!ajax.some(x => /BAD-SESSKEY/.test(x)) && ajax.includes("core_course_get_enrolled_courses_by_timeline_classification"), "it uses Moodle's own AJAX service with the page's session key");
    const c = h.courses.find(x => x.ou === "11");
    ok(c && c.code === "CHEM 1010" && c.name === "Introductory Chemistry" && !h.courses.some(x => x.ou === "12"), "it reads the current course, not the hidden old one");
    const it = id => c.items.find(x => x.id === id) || {};
    ok(it("101").kind === "assignment" && it("101").name === "Lab report 2" && it("101").done === true && Math.abs(Date.parse(it("101").due) / 1000 - (NOW + 3 * 86400)) < 2, "an assignment: its due date from the calendar, submitted from the assignments list");
    ok(it("102").done === false && it("102").st && it("102").st.missing === false, "not submitted yet");
    ok(it("201").kind === "quiz" && it("201").start && it("201").end && it("201").due === it("201").end && it("201").name === "Unit 3 quiz", "a quiz: opens and closes, due when it closes");
    ok(it("100").done === true && it("100").outOf === 20, "a past assignment, marked");
    const g = c.grades.find(x => x.gid === "100");
    ok(g && g.num === 17 && g.den === 20 && g.weight === 20 && c.final && c.final.pct === 56.67, "grades with weights, and the course total, from the grade report");
    ok(c.events.some(e => e.title === "Midterm review session"), "course events come in as events");
    ok(c.news.length === 1 && c.news[0].title === "Lab moved to Thursday" && /Thursday/.test(c.news[0].text) && c.news[0].date, "announcements from the announcements forum");
    ok(L.cleanHarvest(h, site).ok === true, "what it reads passes the desktop's cleaning");
    // in the app: tasks
    await page.goto("http://localhost:" + app.address().port + "/"); await page.waitForFunction(() => window.SBLMS && window.SBLMS.moodle);
    const recs = await page.evaluate(h => window.SBLMS.moodle.fromApi(h).recs.map(r => ({t: r.title, done: !!r.done, due: r.due})), L.cleanHarvest(h, site));
    ok(recs.some(r => r.t === "Lab report 2" && r.done) && recs.some(r => r.t === "Essay" && !r.done) && recs.some(r => r.t === "Unit 3 quiz"), "the app turns it into tasks: " + JSON.stringify(recs));
    // signed out
    signedIn = false; await page.goto(site + "/login/index.php");
    const out = await run();
    ok(out && out.needLogin === true, "signed out: it asks to sign in again");
    ok(L.P.moodle.home === "/my/" && typeof L.WHO.moodle === "string", "sign-in opens the Moodle dashboard and checks who's signed in");
    await ctx.close();
    ok(!errs.length, "no page errors: " + errs.join(" | "));
    console.log(`lms-moodle.e2e: ${n} checks passed`);
  } finally { await browser.close(); moodle.close(); app.close(); }
})().catch(e => { console.error(e); process.exit(1); });
