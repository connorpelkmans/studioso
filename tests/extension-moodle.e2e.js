/* global chrome */
// node tests/extension-moodle.e2e.js: the School Sync extension reads a Moodle site from Chrome's background: it finds out the
// site is Moodle, reads courses, due dates, submissions and grades, and only ever POSTs to Moodle's AJAX service.
process.env.PW_EXPERIMENTAL_SERVICE_WORKER_NETWORK_EVENTS = "1";   // so the fake Moodle site answers the background too
const fs = require("fs"), path = require("path"), os = require("os"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const {build} = require("../scripts/build-extension.js");
const root = path.join(__dirname, "..");
const SCHOOL = "https://moodle.example.edu", NOW = Math.floor(Date.now() / 1000), DAY = 86400;
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const until = async (fn, ms, what) => { const end = Date.now() + ms; for (;;) { const v = await fn(); if (v) return v; if (Date.now() > end) throw new Error("timed out: " + what); await new Promise(r => setTimeout(r, 300)); } };
const html = body => `<!doctype html><html><head><script>var M = {cfg: {"wwwroot":"${SCHOOL}","sesskey":"sk123"}};</script><script src="${SCHOOL}/lib/javascript.php/1/lib/requirejs.js"></script></head><body>${body}</body></html>`;
const ev = (id, name, type, mod, cm, t) => ({id, name, eventtype: type, modulename: mod, timestart: t, timesort: t, timeduration: 0, course: {id: 11}, url: mod ? `${SCHOOL}/mod/${mod}/view.php?id=${cm}` : "", description: ""});

(async () => {
  if (!process.env.SB_EXT_BUILD) build();
  const ext = fs.mkdtempSync(path.join(os.tmpdir(), "sb-ext-")), prof = fs.mkdtempSync(path.join(os.tmpdir(), "sb-prof-"));
  fs.cpSync(process.env.SB_EXT_BUILD || path.join(root, "extension", "build", "chrome"), ext, {recursive: true});
  const man = JSON.parse(fs.readFileSync(path.join(ext, "manifest.json"), "utf8"));
  ok(man.permissions.join() === "storage,alarms,scripting,activeTab" && /Moodle/.test(man.description), "Moodle needs no new permission");
  man.host_permissions = [SCHOOL + "/*"]; fs.writeFileSync(path.join(ext, "manifest.json"), JSON.stringify(man));
  const ctx = await chromium.launchPersistentContext(prof, {executablePath, ...(executablePath ? {} : {channel: "chromium"}), headless: true, args: ["--disable-extensions-except=" + ext, "--load-extension=" + ext]});
  const asked = [];
  await ctx.route(SCHOOL + "/**", async route => {
    const rq = route.request(), u = new URL(rq.url()), send = (body, type) => route.fulfill({status: 200, contentType: type || "text/html", body});
    asked.push(rq.method() + " " + u.pathname);
    if (u.pathname === "/login/index.php" || u.pathname === "/my/") return send(html(`<div class="usermenu" data-userid="7"></div>`));
    if (u.pathname === "/user/profile.php") return send(html(`<div data-userid="7"></div><div class="page-header-headings"><h1>Sam Lee</h1></div>`));
    if (u.pathname === "/lib/ajax/service.php") {
      const [call] = JSON.parse(rq.postData() || "[{}]");
      if (call.methodname === "core_course_get_enrolled_courses_by_timeline_classification") return send(JSON.stringify([{error: false, data: {courses: [{id: 11, fullname: "Introductory Chemistry", shortname: "CHEM 1010"}]}}]), "application/json");
      if (call.methodname === "core_calendar_get_calendar_monthly_view") {
        const {year, month} = call.args, inMonth = t => { const d = new Date(t * 1000); return d.getFullYear() === year && d.getMonth() + 1 === month; };
        const all = [ev(1, "Lab report 2 is due", "due", "assign", 101, NOW + 3 * DAY), ev(2, "Essay is due", "due", "assign", 102, NOW + 9 * DAY)].filter(e => inMonth(e.timestart));
        return send(JSON.stringify([{error: false, data: {weeks: [{days: [{events: all}]}]}}]), "application/json");
      }
      return send(JSON.stringify([{error: true, exception: {errorcode: "invalidrecord"}}]), "application/json");
    }
    if (u.pathname === "/mod/assign/index.php") return send(html(`<table class="generaltable"><thead><tr><th>Topic</th><th>Assignments</th><th>Due date</th><th>Submission</th><th>Grade</th></tr></thead><tbody>
      <tr><td>1</td><td><a href="${SCHOOL}/mod/assign/view.php?id=101">Lab report 2</a></td><td>x</td><td>Submitted for grading</td><td>18.00 / 20.00</td></tr>
      <tr><td>2</td><td><a href="${SCHOOL}/mod/assign/view.php?id=102">Essay</a></td><td>x</td><td>No submission</td><td>-</td></tr></tbody></table>`));
    if (u.pathname === "/grade/report/user/index.php") return send(html(`<table class="user-grade"><tbody>
      <tr><th class="column-itemname"><a href="${SCHOOL}/mod/assign/view.php?id=101">Lab report 2</a></th><td class="column-weight">25.00 %</td><td class="column-grade">18.00</td><td class="column-range">0–20</td><td class="column-percentage">90.00 %</td></tr>
      <tr><th class="column-itemname">Course total</th><td class="column-grade">18.00</td><td class="column-range">0–20</td><td class="column-percentage">90.00 %</td></tr></tbody></table>`));
    return route.fulfill({status: 404, contentType: "text/html", body: "<p>Not found</p>"});
  });
  try {
    const sw = ctx.serviceWorkers()[0] || await ctx.waitForEvent("serviceworker", {timeout: 15000});
    const id = new URL(sw.url()).host;
    const pop = await ctx.newPage(); await pop.goto(`chrome-extension://${id}/popup.html`); await pop.waitForSelector("form.connect");
    const add = await pop.evaluate(origin => chrome.runtime.sendMessage({op: "add", origin, platform: ""}), SCHOOL);
    ok(add && add.ok && add.id === "moodle", "it finds out the site is Moodle by itself: " + JSON.stringify(add));
    const res = await until(() => sw.evaluate(() => chrome.storage.local.get(["result:moodle", "status"]).then(r => r["result:moodle"] ? r : (r.status && r.status.moodle && r.status.moodle.state === "error" ? r : null))), 60000, "the Moodle read");
    ok(res["result:moodle"], "it reads the Moodle site: " + JSON.stringify(res.status && res.status.moodle));
    const h = res["result:moodle"].h, c = h.courses.find(x => x.ou === "11"), it = k => c.items.find(x => x.id === k) || {};
    ok(h.me.name === "Sam Lee" && c.code === "CHEM 1010", "signed in as Sam Lee, with CHEM 1010");
    ok(it("101").done === true && it("102").done === false && it("101").due, "due dates from the calendar, what's submitted from the assignments list");
    ok(c.grades.some(g => g.gid === "101" && g.num === 18 && g.den === 20 && g.weight === 25) && c.final && c.final.pct === 90, "grades, weights and the course total");
    ok(asked.filter(x => x.startsWith("POST")).every(x => x === "POST /lib/ajax/service.php") && asked.some(x => x === "POST /lib/ajax/service.php"), "it only POSTs to Moodle's AJAX service; everything else is read with GET");
    const st = await sw.evaluate(() => chrome.storage.local.get("status").then(r => r.status.moodle));
    ok(st.state === "ok" && st.courses === 1, "the popup shows it synced");
    console.log(`extension-moodle.e2e: ${n} checks passed`);
  } finally { await ctx.close(); }
})().catch(e => { console.error(e); process.exit(1); });
