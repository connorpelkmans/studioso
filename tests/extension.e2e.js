/* global chrome */
// node tests/extension.e2e.js   (Playwright + Chromium; see tests/pw.js)
// The Studyboard School Sync browser extension, end to end, as the stores will ship it (extension/build/chrome, built here first):
// it loads in Chromium; its popup shows; connecting a stand-in Canvas (https://canvas.example.edu, answered by Playwright) reads it
// (in the open Canvas tab, the way it does when the background read isn't signed in) and keeps the cleaned result in extension storage;
// then Studyboard on studyboardapp.com (this repository's index.html, answered by Playwright) picks it up through relay.js and imports it:
// tasks, the submitted one marked done, grades, the teaching team. Only GET requests reach the school, and only for read routes.
// The test build only adds a host permission for the stand-in Canvas, since a permission prompt can't be clicked in a test.
const http = require("http"), fs = require("fs"), path = require("path"), os = require("os"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const {build} = require("../scripts/build-extension.js");
const root = path.join(__dirname, ".."), OUT = path.join(root, "tests-out");
const DAY = 864e5, at = d => new Date(Math.floor(Date.now() / DAY) * DAY + d * DAY + 16 * 3600e3).toISOString();
const SCHOOL = "https://canvas.example.edu", APP = "https://studyboardapp.com";
const CV = [
  [/^\/api\/v1\/users\/self$/, {id: 9, name: "Ana Lee"}],
  [/^\/api\/v1\/courses\?enrollment_state=active/, [{id: 201, name: "History 200", course_code: "HIS200", start_at: at(-30), end_at: at(60), apply_assignment_group_weights: false, enrollments: [{computed_current_score: 85, computed_current_grade: "B"}]}]],
  [/^\/api\/v1\/courses\/201\/assignments\?/, [
    {id: 1, name: "Essay 1", due_at: at(-3), published: true, points_possible: 20, assignment_group_id: 3, submission_types: ["online_upload"], html_url: SCHOOL + "/courses/201/assignments/1",
      submission: {workflow_state: "graded", score: 17, grade: "17", submitted_at: at(-4)}, score_statistics: {min: 9, max: 20, mean: 15.2, median: 16, lower_q: 13, upper_q: 18}},
    {id: 2, name: "Essay 2", due_at: at(9), published: true, points_possible: 20, assignment_group_id: 3, submission_types: ["online_upload"], html_url: SCHOOL + "/courses/201/assignments/2", submission: {workflow_state: "unsubmitted"}}]],
  [/^\/api\/v1\/courses\/201\/students\/submissions\?/, [{assignment_id: 1, submitted_at: at(-4), score: 17, grade: "17", submission_comments: [{author_name: "Prof. Ruiz", author_id: 5, comment: "Strong thesis.", created_at: at(-2)}]}]],
  [/^\/api\/v1\/courses\/201\/users\?/, [{id: 5, name: "Prof. Ruiz", email: "ruiz@example.edu", enrollments: [{type: "TeacherEnrollment"}]}]],
  [/^\/api\/v1\/courses\/201\?include/, {id: 201, syllabus_body: "<p>Lectures Tue/Thu 9:30-10:45 in Hall 2</p>"}]
];
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  const mime = {".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".css": "text/css", ".png": "image/png", ".webp": "image/webp", ".svg": "image/svg+xml", ".woff2": "font/woff2"}[path.extname(f)];
  res.writeHead(200, {"content-type": mime || "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const until = async (fn, ms, what) => { const end = Date.now() + ms; for (;;) { const v = await fn(); if (v) return v; if (Date.now() > end) throw new Error("timed out: " + what); await new Promise(r => setTimeout(r, 250)); } };

(async () => {
  // SB_EXT_BUILD: an extension build made elsewhere (for example the version in store review), tested against today's website
  if (!process.env.SB_EXT_BUILD) build();
  const ext = fs.mkdtempSync(path.join(os.tmpdir(), "sb-ext-")), prof = fs.mkdtempSync(path.join(os.tmpdir(), "sb-prof-"));
  fs.cpSync(process.env.SB_EXT_BUILD || path.join(root, "extension", "build", "chrome"), ext, {recursive: true});
  const man = JSON.parse(fs.readFileSync(path.join(ext, "manifest.json"), "utf8"));
  ok(man.manifest_version === 3 && !man.host_permissions && JSON.stringify(man.optional_host_permissions) === '["https://*/*"]' && man.permissions.join() === "storage,alarms,scripting,activeTab",
    "the store build asks for no site at install: school sites are optional permissions, granted one at a time");
  man.host_permissions = [SCHOOL + "/*"]; fs.writeFileSync(path.join(ext, "manifest.json"), JSON.stringify(man));
  await new Promise(r => server.listen(0, r)); const local = "http://127.0.0.1:" + server.address().port;
  // Playwright's default headless browser (chromium-headless-shell, what CI installs) can't load extensions; its "chromium" channel can.
  const ctx = await chromium.launchPersistentContext(prof, {executablePath, ...(executablePath ? {} : {channel: "chromium"}), headless: true, viewport: {width: 1100, height: 900}, timezoneId: "UTC",
    args: ["--disable-extensions-except=" + ext, "--load-extension=" + ext]});
  const asked = [];
  await ctx.route(SCHOOL + "/**", route => {
    const u = new URL(route.request().url()), p = u.pathname + u.search;
    asked.push([route.request().method(), p]);
    if (u.pathname === "/") return route.fulfill({status: 200, contentType: "text/html", body: "<!doctype html><title>Dashboard</title><h1>Canvas</h1>"});
    const hit = CV.find(([re]) => re.test(p));
    return hit ? route.fulfill({status: 200, contentType: "application/json", body: JSON.stringify(hit[1])}) : route.fulfill({status: 404, contentType: "application/json", body: "[]"});
  });
  await ctx.route(APP + "/**", async route => { const u = new URL(route.request().url()); const r = await fetch(local + u.pathname + u.search); route.fulfill({status: r.status, headers: {"content-type": r.headers.get("content-type") || "text/plain"}, body: Buffer.from(await r.arrayBuffer())}); });
  const errs = [];
  try {
    const sw = ctx.serviceWorkers()[0] || await ctx.waitForEvent("serviceworker", {timeout: 15000});
    const id = new URL(sw.url()).host;
    ok(/^[a-p]{32}$/.test(id), "the extension loads and its background starts");
    // The popup, before anything is connected
    const pop = await ctx.newPage(); pop.on("pageerror", e => errs.push("popup: " + e.message));
    await pop.setViewportSize({width: 360, height: 600});
    await pop.goto(`chrome-extension://${id}/popup.html`);
    await pop.waitForSelector("form.connect");
    ok(/Connect Your School Site/.test(await pop.textContent("main")) && await pop.locator("#addr").count() === 1, "the popup offers to connect a school site");
    const needEmpty = await pop.evaluate(() => ["header", "main", "footer"].reduce((n, sel) => n + document.querySelector(sel).offsetHeight, 0));
    if (!process.env.SB_EXT_BUILD) ok(needEmpty <= 540, "connecting needs no scrolling either, with room for larger text: " + needEmpty + "px");
    fs.mkdirSync(OUT, {recursive: true}); await pop.setViewportSize({width: 360, height: 200}); await pop.screenshot({path: path.join(OUT, "extension-popup-empty.png"), fullPage: true});
    // The student has Canvas open, then connects it
    const school = await ctx.newPage(); await school.goto(SCHOOL + "/");
    const r = await pop.evaluate(o => chrome.runtime.sendMessage({op: "add", origin: o, platform: "canvas"}), SCHOOL);
    ok(r && r.ok && r.id === "canvas", "connecting Canvas works: " + JSON.stringify(r));
    const res = await until(() => pop.evaluate(() => chrome.storage.local.get("result:canvas").then(x => x["result:canvas"] || null)), 60000, "the extension's read");
    ok(res.v === 1 && res.id === "canvas" && res.origin === SCHOOL && res.h.ok && res.h.courses.length === 1, "it read Canvas and kept the cleaned result");
    ok(res.h.courses[0].staff[0].name === "Prof. Ruiz" && res.h.courses[0].items.find(x => x.name === "Essay 1").fb.c[0].t === "Strong thesis.", "the result has the teaching team and the feedback");
    ok(asked.length > 3 && asked.every(([m]) => m === "GET"), "only GET requests reached the school site (" + asked.length + ")");
    const st = await pop.evaluate(() => chrome.runtime.sendMessage({op: "status"}));
    ok(st.status.canvas.state === "ok" && st.status.canvas.courses === 1, "its status says it synced: " + JSON.stringify(st.status.canvas));
    await pop.reload(); await pop.waitForSelector(".school");
    ok(/Synced just now/.test(await pop.textContent(".school")), "the popup says when it last synced");
    await pop.setViewportSize({width: 360, height: 200}); await pop.screenshot({path: path.join(OUT, "extension-popup-synced.png"), fullPage: true});
    // Studyboard on studyboardapp.com picks it up
    const app = await ctx.newPage(); app.on("pageerror", e => errs.push("app: " + e.message));
    await app.addInitScript(() => { try { if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("coursework:v2", JSON.stringify({v: 2, updated: 1, courses: [], tasks: [], settings: {}})); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); } } catch (e) {} });   // a student using Studyboard without an account
    await app.goto(APP + "/"); await app.waitForFunction(() => window.SBLMS && window.SBEXT);
    await until(() => app.evaluate(() => SBEXT.on()), 15000, "the app sees the extension");
    ok(true, "the Studyboard website sees the extension through relay.js");
    // The extension's reads are applied by themselves: no "Ready to Import", just a notice of what changed
    await app.waitForFunction(() => Object.values(SBLMS.st().tasks).some(t => t.cv), null, {timeout: 15000});
    ok(!/Ready to Import/.test(await app.evaluate(() => { const d = document.querySelector("#dlg"); return d.open ? d.textContent : ""; })), "the extension's read is applied by itself, without asking to import");
    const got = await until(() => app.evaluate(() => { const ts = Object.values(SBLMS.st().tasks).filter(t => t.cv); return ts.length >= 2 ? ts.map(t => ({title: t.title, status: t.status, mark: t.mark, fb: !!t.cv.fb})) : null; }), 15000, "the import");
    const e1 = got.find(t => t.title === "Essay 1"), e2 = got.find(t => t.title === "Essay 2");
    ok(e1 && e1.status === "done" && e1.mark && e1.mark.got === 17 && e1.fb, "Essay 1 is in, marked done because it's submitted, with its grade and feedback");
    ok(e2 && e2.status === "todo", "Essay 2 is in, still to do");
    const course = await app.evaluate(() => Object.values(SBLMS.st().courses).find(c => c.cv));
    ok(course && course.instructor === "Prof. Ruiz" && (course.meetings || []).length === 1, "the course has its instructor and class times from the syllabus");
    // Chrome and Edge builds that let studyboardapp.com talk to them directly: the page can ask for what was read
    if (man.externally_connectable) {
      const direct = await app.evaluate(id => new Promise(res => chrome.runtime.sendMessage(id, {type: "get"}, r => res(r || null))), id);
      ok(direct && direct.list && direct.list[0] && direct.list[0].id === "canvas", "studyboardapp.com can also read it from the extension directly (externally_connectable)");
    }
    // Sync Now on the website asks the extension (through relay.js) to read the school site again
    const before = await pop.evaluate(() => chrome.runtime.sendMessage({op: "status"}).then(x => x.status.canvas.lastOk));
    // (as if the last read were a while ago: the extension spaces out reads of the school site)
    await pop.evaluate(() => chrome.storage.local.get("status").then(x => { const st = x.status; st.canvas.at = Date.now() - 6 * 60000; st.canvas.lastOk = Date.now() - 6 * 60000; return chrome.storage.local.set({status: st}); }));
    const before2 = await pop.evaluate(() => chrome.runtime.sendMessage({op: "status"}).then(x => x.status.canvas.lastOk));
    await app.evaluate(() => window.postMessage({source: "studyboard-app", type: "sync"}, location.origin));
    const after = await until(() => pop.evaluate(b => chrome.runtime.sendMessage({op: "status"}).then(x => x.status.canvas.state === "ok" && x.status.canvas.lastOk > b ? x.status.canvas.lastOk : null), before2), 60000, "a sync asked for by the website");
    ok(after > before2 && before === before, "the website's Sync Now makes the extension read the school site again");
    // The feedback, where the student looks for it (a picture for the store listing: scripts/extension-store-assets.js)
    await app.evaluate(cid => SBLMS.go("courses", cid), course.id); await app.waitForTimeout(300);
    await app.waitForTimeout(1500); await app.evaluate(() => { const d = document.querySelector("#dlg"); if (d.open) d.close(); });   // the app's own "Sign In to Studyboard" prompt
    await app.click('[data-act="course-tab"][data-id="grades"]'); await app.waitForTimeout(300);
    await app.click('[data-act="lms-fb"]'); await app.waitForSelector(".gr-drop:not([hidden]) .lms-fb");
    const drop = await app.textContent(".gr-drop:not([hidden])");
    ok(/Strong thesis\./.test(drop), "clicking Essay 1 in the Grades tab opens its feedback right there");
    ok(/Average\s*15\.2 \/ 20/.test(drop) && /High\s*20 \/ 20/.test(drop) && /Low\s*9 \/ 20/.test(drop) && /9% above the class average \(you 85%, class 76%\)/.test(drop), "with the class's average, high and low from Canvas, and where the mark sits: " + drop.replace(/\s+/g, " ").slice(0, 300));
    await app.waitForTimeout(300); await app.screenshot({path: path.join(OUT, "extension-app-feedback.png")});
    await app.click('[data-act="lms-fb"]'); await app.waitForTimeout(200);
    ok(await app.locator(".gr-drop:not([hidden])").count() === 0, "clicking it again closes it");
    // The same read is not imported twice
    await app.evaluate(async () => { for (const r of await navigator.serviceWorker.getRegistrations()) await r.unregister(); });   // the app's own offline worker would answer instead of the test
    await app.reload(); await app.waitForFunction(() => window.SBEXT && SBEXT.on()); await app.waitForTimeout(1200);
    const dlgText = await app.locator("dialog[open]").count() ? await app.textContent("dialog[open]") : "";
    ok(!/Ready to Import/.test(dlgText), "a read already imported is not imported again" + (dlgText ? " (open: " + dlgText.slice(0, 80) + ")" : ""));
    // Everything fits in the popup's 600px (the tallest a popup can be in Chrome; Safari's is kept at the height it needs)
    const need = await pop.evaluate(() => ["header", "main", "footer"].reduce((n, sel) => n + document.querySelector(sel).offsetHeight, 0));
    if (!process.env.SB_EXT_BUILD) ok(need <= 540, "the synced popup needs no scrolling, with room for larger text: " + need + "px");
    // Remove, asked inside the popup (Safari's popups can't show confirm() dialogs; released builds before 1.0.3 used confirm())
    if (!process.env.SB_EXT_BUILD) {
    await pop.reload(); await pop.waitForSelector(".school");
    await pop.click(".school .link"); await pop.waitForSelector(".school .confirm");
    ok(/Stop syncing Canvas\?/.test(await pop.textContent(".school .confirm")), "Remove asks inside the popup");
    await pop.click('.school .confirm button:has-text("Cancel")');
    ok(await pop.locator(".school .confirm").count() === 0 && await pop.locator(".school").count() === 1, "Cancel keeps the school");
    await pop.click(".school .link"); await pop.click('.school .confirm button:has-text("Stop Syncing")');
    await pop.waitForSelector("form.connect", {timeout: 10000});
    ok(await pop.evaluate(() => chrome.runtime.sendMessage({op: "status"}).then(x => !Object.keys(x.schools || {}).length)), "Stop Syncing removes it");
    }
    ok(!errs.length, "no page errors: " + errs.join(" | "));
  } finally { await ctx.close(); server.close(); }
  console.log(`\nextension.e2e: ${n} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
