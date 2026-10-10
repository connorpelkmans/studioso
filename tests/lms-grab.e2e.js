// node tests/lms-grab.e2e.js   (Playwright + Chromium; see tests/pw.js)
// The website's "Read it in this browser": the Studyboard bookmark, built by the page from lms-grab.js, is run on a stand-in Canvas
// (https://canvas.example.edu, answered by Playwright) where the student is "signed in". It reads the courses there, its "Open in Studyboard"
// link opens Studyboard with the code in the address, and Studyboard imports grades and announcements, which the calendar link can't bring.
// Also: the bookmark code built into index.html is current with lms.js, Set It Up works with nothing extra to download, its messages show
// above the open sheet, forged or stale codes are refused, and the code leaves the address at once.
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const {grabIn} = require("../scripts/build-lms-mobile.js");
const root = path.join(__dirname, "..");
const DAY = 864e5, at = d => new Date(Math.floor(Date.now() / DAY) * DAY + d * DAY + 16 * 3600e3).toISOString();
const SCHOOL = "https://canvas.example.edu";
const CV = [
  [/^\/api\/v1\/users\/self$/, {id: 9, name: "Ana Lee"}],
  [/^\/api\/v1\/courses\?enrollment_state=active/, [{id: 201, name: "History 200", course_code: "HIS200", start_at: at(-30), end_at: at(60), apply_assignment_group_weights: false, enrollments: [{computed_current_score: 85, computed_current_grade: "B"}]}]],
  [/^\/api\/v1\/courses\/201\/assignments\?/, [
    {id: 1, name: "Essay 1", due_at: at(-3), published: true, points_possible: 20, assignment_group_id: 3, submission_types: ["online_upload"], submission: {workflow_state: "graded", score: 17, submitted_at: at(-4)}},
    {id: 2, name: "Essay 2", due_at: at(9), published: true, points_possible: 20, assignment_group_id: 3, submission_types: ["online_upload"], submission: {workflow_state: "unsubmitted"}}]],
  [/^\/api\/v1\/announcements\?/, [{id: 41, context_code: "course_201", title: "Room change", message: "<p>We meet in Room 12</p>", posted_at: at(-1), html_url: SCHOOL + "/courses/201/discussion_topics/41"}]]
];
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  const mime = {".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".css": "text/css"}[path.extname(f)];
  res.writeHead(200, {"content-type": mime || "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const SEED = {v: 2, updated: 1, courses: [], tasks: [], settings: {}};
(async () => {
  { const g = grabIn(fs.readFileSync(path.join(root, "index.html"), "utf8")); ok(g.now === g.withFresh.slice(g.withFresh.indexOf("/* LMS-GRAB-START"), g.withFresh.indexOf("/* LMS-GRAB-END */") + 18), "the bookmark code in index.html is current with lms.js (run: node scripts/build-lms-mobile.js --grab)"); }
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  const ctx = await browser.newContext({viewport: {width: 1100, height: 900}, timezoneId: "UTC"});
  const asked = [];
  await ctx.route(SCHOOL + "/**", route => {
    const u = new URL(route.request().url()), p = u.pathname + u.search;
    asked.push([route.request().method(), p]);
    if (u.pathname === "/") return route.fulfill({status: 200, contentType: "text/html", body: "<!doctype html><title>Dashboard</title><h1>Canvas</h1>"});
    const hit = CV.find(([re]) => re.test(p));
    return hit ? route.fulfill({status: 200, contentType: "application/json", body: JSON.stringify(hit[1])}) : route.fulfill({status: 404, body: "[]"});
  });
  await ctx.addInitScript(seed => {
    try { if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("coursework:v2", JSON.stringify(seed)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); } } catch (e) {}
  }, SEED);
  const app = await ctx.newPage(); const errs = []; app.on("pageerror", e => errs.push(e.message));
  try {
    await app.goto(base); await app.waitForSelector("#view", {state: "attached"}); await app.waitForFunction(() => window.SBLMS);
    // Connect sheet on the website offers the bookmark; its sheet builds the bookmark
    await app.evaluate(() => SBLMS.canvas.connectSheet());
    ok(await app.locator('dialog [data-act="cv-grab"]').count() === 1, "the website's Connect Canvas sheet offers reading Canvas in this browser");
    const fetched = []; app.on("request", r => fetched.push(new URL(r.url()).pathname));
    await app.click('dialog [data-act="cv-grab"]'); await app.waitForSelector("#grabLink", {timeout: 3000});
    ok(!fetched.some(p => /\.js$/.test(p)), "Set It Up opens its sheet without downloading anything: " + JSON.stringify(fetched));
    await app.click("#dlg [data-submit]");
    ok(await app.evaluate(() => { const t = document.querySelector("#toast"), r = t.getBoundingClientRect(), el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return /Click the bookmark/.test(t.innerText) && t.contains(el) && document.querySelector("#dlg").open; }), "a message from the sheet shows on top of it, not hidden behind it");
    const js = await app.getAttribute("#grabLink", "href");
    ok(/^javascript:/.test(js) && js.length < 60000, "the bookmark is a javascript: address of " + js.length + " characters");
    await app.click("#grabLink");
    ok(await app.evaluate(() => !!document.querySelector("#grabLink")), "clicking the bookmark button in Studyboard runs nothing (it's for dragging)");
    // Run the bookmark on the school's page
    const school = await ctx.newPage(); school.on("pageerror", e => errs.push("school: " + e.message));
    await school.goto(SCHOOL + "/");
    await school.evaluate(src => { (0, eval)(src); }, decodeURIComponent(js.slice("javascript:".length)));
    await school.getByText("Open in Studyboard").waitFor({timeout: 30000});
    ok(asked.every(([m]) => m === "GET"), "the bookmark only read (GET) from the school site");
    ok(/Read 1 course and 1 grade/.test(await school.locator("div >> nth=0").evaluate(() => document.body.lastElementChild.shadowRoot.textContent)), "it says what it read");
    const href = await school.getByText("Open in Studyboard").getAttribute("href");
    ok(href.startsWith(base + "#sbgrab=SBG1"), "it links back to this Studyboard with the code in the address");
    // Open it: the code leaves the address, the review sheet shows, Import brings in tasks, grades and the announcement
    const [tab] = await Promise.all([ctx.waitForEvent("page"), school.getByText("Open in Studyboard").click()]);
    tab.on("pageerror", e => errs.push("tab: " + e.message));
    await tab.waitForSelector("dialog .bs-sheet [data-submit]", {timeout: 15000});
    ok(!/sbgrab/.test(tab.url()), "the code is taken off the address right away: " + tab.url());
    ok(/HIS/.test(await tab.locator("#dlg").innerText()), "the review sheet lists the course");
    await tab.click("#dlg [data-submit]");
    await tab.waitForFunction(() => { const s = JSON.parse(localStorage.getItem("coursework:v2") || "{}"); return (s.tasks || []).some(t => t.title === "Essay 2"); }, null, {timeout: 15000});
    const st = await tab.evaluate(() => { const s = JSON.parse(localStorage.getItem("coursework:v2")); return {tasks: s.tasks, cfg: SBLMS.canvas.cfg(), line: SBLMS.canvas.statusLine()}; });
    const e1 = st.tasks.find(t => t.title === "Essay 1"), e2 = st.tasks.find(t => t.title === "Essay 2");
    ok(e1 && e1.mark && e1.mark.got === 17 && e1.mark.outOf === 20 && Number(e1.weight) === 50 && e1.status === "done", "the grade arrives with its weight, and the submitted essay is done");
    ok(e2 && e2.status !== "done" && Number(e2.weight) === 50, "upcoming work arrives with its weight");
    ok(st.cfg.newsItems.some(x => x.title === "Room change"), "announcements arrive");
    ok(st.cfg.finals["201"] && st.cfg.finals["201"].pct === 85, "Canvas's own course grade arrives");
    ok(st.cfg.mode === "api" && st.cfg.host === "canvas.example.edu" && /in this browser/.test(st.line), "connected to that school site; settings say it was read in this browser: " + st.line);
    // A second read with the same data changes nothing
    const before = JSON.stringify(st.tasks.map(t => [t.id, t.due, t.status]).sort());
    ok(await tab.evaluate(code => SBLMS.grabReceive(code), href.split("#sbgrab=")[1]), "the same code can be used again");
    await tab.waitForTimeout(500);
    ok(JSON.stringify((await tab.evaluate(() => JSON.parse(localStorage.getItem("coursework:v2")).tasks)).map(t => [t.id, t.due, t.status]).sort()) === before, "and adds nothing twice");
    // Refused: junk, an unknown platform, a stale read, an address that isn't a public https site
    const forged = async obj => tab.evaluate(async o => { const b = btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); return SBLMS.grabReceive("SBG1j." + b); }, obj);
    ok(await tab.evaluate(() => SBLMS.grabReceive("hello")) === false, "junk is refused");
    ok(await forged({v: 1, id: "__proto__", origin: SCHOOL, at: Date.now(), h: {ok: true}}) === false, "an unknown platform is refused");
    ok(await forged({v: 1, id: "canvas", origin: SCHOOL, at: Date.now() - 5 * DAY, h: {ok: true, courses: []}}) === false, "a read more than 3 days old is refused");
    ok(await forged({v: 1, id: "canvas", origin: "http://192.168.1.5", at: Date.now(), h: {ok: true, courses: []}}) === false, "a non-public or non-https school address is refused");
    ok(!errs.length, "no page errors: " + errs.join(" | "));
    console.log("\nlms-grab.e2e: " + n + " checks passed");
  } finally { await browser.close(); server.close(); }
})().catch(e => { console.error(e); process.exit(1); });
