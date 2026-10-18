// node tests/lms-grab.e2e.js   (Playwright + Chromium; see tests/pw.js)
// The website's school sites: the cleaning every read from the Studyboard School Sync extension goes through, built into index.html, is
// current with lms.js; the Connect sheet never offers a bookmark (there isn't one any more) and offers the extension, with its Chrome Web
// Store link, in desktop Google Chrome only; and an old bookmark's #sbgrab= address does nothing.
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const {grabIn} = require("../scripts/build-lms-mobile.js");
const root = path.join(__dirname, "..");
const DAY = 864e5, at = d => new Date(Math.floor(Date.now() / DAY) * DAY + d * DAY + 16 * 3600e3).toISOString();
const SCHOOL = "https://canvas.example.edu";
const CV = [
  [/^\/api\/v1\/users\/self$/, {id: 9, name: "Ana Lee"}],
  [/^\/api\/v1\/conversations\?scope=inbox/, [{id: 77, subject: "Essay 2 extension", context_name: "History 200", last_message_at: at(-1), workflow_state: "unread", participants: [{id: 5, name: "Prof. Ruiz"}, {id: 9, name: "Ana Lee"}]}]],
  [/^\/api\/v1\/conversations\/77\?auto_mark_as_read=false$/, {id: 77, subject: "Essay 2 extension", context_name: "History 200", participants: [{id: 5, name: "Prof. Ruiz"}, {id: 9, name: "Ana Lee"}],
    messages: [{id: 2, author_id: 5, created_at: at(-1), body: "Yes, Friday is fine.", attachments: []}, {id: 1, author_id: 9, created_at: at(-2), body: "Could I have until Friday?", attachments: []}]}],
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
  { const g = grabIn(fs.readFileSync(path.join(root, "index.html"), "utf8")); ok(g.now === g.withFresh.slice(g.withFresh.indexOf("/* LMS-GRAB-START"), g.withFresh.indexOf("/* LMS-GRAB-END */") + 18), "the cleaning code in index.html is current with lms.js (run: node scripts/build-lms-mobile.js --grab)"); }
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
    // Connect sheet on the website: never the bookmark. The extension is offered in desktop Google Chrome only; elsewhere the calendar link leads
    await app.evaluate(() => SBLMS.canvas.connectSheet());
    let ways = await app.evaluate(() => [...document.querySelectorAll("#dlg .bs-way")].map(w => ({t: w.querySelector("b").textContent, rec: w.classList.contains("rec"), pill: (w.querySelector(".bs-pill") || {}).textContent, text: w.innerText})));
    ok(!/bookmark/i.test(await app.evaluate(() => document.querySelector("#dlg").innerText)) && !(await app.locator('dialog [data-act="cv-grab"]').count()), "the Connect sheet never mentions or offers the bookmark");
    ok(ways.length === 1 && /Calendar Link/.test(ways[0].t) && ways[0].rec, "not Google Chrome (this test browser): no extension, the calendar link is the way offered: " + JSON.stringify(ways.map(w => [w.t, w.pill])));
    await app.evaluate(() => { Object.defineProperty(navigator, "userAgentData", {configurable: true, get: () => ({brands: [{brand: "Google Chrome", version: "141"}], mobile: false})}); document.querySelector("#dlg").close(); SBLMS.canvas.connectSheet(); });
    ways = await app.evaluate(() => [...document.querySelectorAll("#dlg .bs-way")].map(w => ({t: w.querySelector("b").textContent, rec: w.classList.contains("rec"), pill: (w.querySelector(".bs-pill") || {}).textContent, text: w.innerText})));
    ok(/Studyboard School Sync Extension/.test(ways[0].t) && ways[0].rec && ways[0].pill === "Recommended" && ways.filter(w => w.rec).length === 1, "in desktop Chrome the extension comes first and is the one recommended: " + JSON.stringify(ways.map(w => [w.t, w.pill])));
    ok(await app.getAttribute('#dlg .bs-way a.btn', "href") === "https://chromewebstore.google.com/detail/studyboard-school-sync/ibibaefpedmlgaamopopcoelnnaaollf", "its button opens the extension's Chrome Web Store page");
    ok(/only reads|Read only/.test(ways[0].text) && /never sees your password/.test(ways[0].text), "it says plainly what the extension reads and that it never sees your password");
    ok(/Due Dates Only/.test(ways[1].pill) && /can't see grades/.test(ways[1].text), "the calendar link is offered second, as due dates only");
    await app.evaluate(() => { delete navigator.userAgentData; document.querySelector("#dlg").close(); });
    // An old bookmark's address (#sbgrab=...) is ignored: nothing is imported and nothing is asked
    const tab = await ctx.newPage(); tab.on("pageerror", e => errs.push(e.message));
    await tab.goto(base + "#sbgrab=SBG1j.eyJ2IjoxLCJpZCI6ImNhbnZhcyJ9"); await tab.waitForFunction(() => window.SBLMS); await tab.waitForTimeout(2500);
    ok(!(await tab.evaluate(() => SBLMS.canvas.cfg().host)) && !(await tab.evaluate(() => document.querySelector("#dlg").open)) && !(await tab.evaluate(() => "grabReceive" in SBLMS)), "an old bookmark's address does nothing");
    ok(!errs.length, "no page errors: " + errs.join(" | "));
    console.log("\nlms-grab.e2e: " + n + " checks passed");
  } finally { await browser.close(); server.close(); }
})().catch(e => { console.error(e); process.exit(1); });
