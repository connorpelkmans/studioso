// node tests/lms-mobile.e2e.js   (Playwright + Chromium; see tests/pw.js)
// The phone apps' school site layer inside the real page: with a stand-in for the native plugin (it runs the harvest script against a fake Brightspace, the way a hidden
// web view would), a connected school syncs from the phone: due dates arrive, the settings say "this phone", Sync Now works, and sign out reaches the plugin.
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert"), vm = require("vm"), Module = require("module");
const {chromium, executablePath} = require("./pw");
const {build} = require("../scripts/build-lms-mobile.js");
const root = path.join(__dirname, "..");
const realLoad = Module._load;
Module._load = function (req, ...rest) { if (req === "electron") return {app: {isPackaged: true, userAgentFallback: ""}, BrowserWindow: function () {}, ipcMain: {handle() {}}, net: {}, session: {}}; return realLoad.call(this, req, ...rest); };
const L = require(path.join(root, "lms.js")); Module._load = realLoad;
const DAY = 864e5, iso = d => new Date(Date.now() + d * DAY).toISOString();
const BS = [
  [/^\/d2l\/api\/versions\/$/, [{ ProductCode: "lp", LatestVersion: "1.40" }, { ProductCode: "le", LatestVersion: "1.70" }]],
  [/^\/d2l\/api\/lp\/1\.40\/users\/whoami$/, { Identifier: "42", FirstName: "Ana", LastName: "Lee", UniqueName: "alee" }],
  [/^\/d2l\/api\/lp\/1\.40\/enrollments\/myenrollments\//, { PagingInfo: { HasMoreItems: false, Bookmark: "" }, Items: [
    { OrgUnit: { Id: 101, Code: "BIO101", Name: "Biology 101" }, Access: { IsActive: true, CanAccess: true, StartDate: iso(-30), EndDate: iso(60), LastAccessed: iso(-1) } }] }],
  [/^\/d2l\/api\/le\/1\.70\/101\/dropbox\/folders\/$/, [{ Id: 5, Name: "Lab 1", DueDate: iso(5), IsHidden: false, GradeItemId: 9, Assessment: { ScoreDenominator: 10 }, SubmissionType: 0,
    CustomInstructions: { Text: "", Html: "<p>Write &amp; submit your <b>lab report</b></p><ul><li>Intro</li><li>Method</li></ul>" }, Attachments: [{ FileId: 77, FileName: "rubric.pdf", Size: 1234 }] }]],
  [/\/dropbox\/folders\/5\/submissions\/mysubmissions\/$/, [{ Submissions: [] }]],
  [/^\/d2l\/api\/le\/1\.70\/101\/quizzes\/$/, { Objects: [{ QuizId: 7, Name: "Quiz 1", DueDate: iso(9), IsActive: true, GradeItemId: 12, Description: { Text: { Text: "", Html: "<p>Chapters 1&ndash;3 &nbsp;<em>open book</em></p>" } } }], Next: null }],
  [/\/grades\/values\/myGradeValues\/$/, [{ GradeObjectIdentifier: "9", GradeObjectName: "Lab 0", GradeObjectType: 1, PointsNumerator: 8, PointsDenominator: 10, DisplayedGrade: " 80 % ", ReleasedDate: iso(-3) }]],
  [/\/grades\/final\/values\/myGradeValue$/, { PointsNumerator: 80, PointsDenominator: 100, DisplayedGrade: "B" }],
  [/^\/d2l\/api\/le\/1\.70\/101\/news\/$/, [{ Id: 3, Title: "Welcome", IsPublished: true, StartDate: iso(-2), Body: { Text: "", Html: "<div>Hello&nbsp;class &lt;3</div><script>alert(1)</script>" }, Attachments: [] }]],
  [/\/calendar\/events\/myEvents\//, { Objects: [{ CalendarEventId: 11, Title: "Lecture", Description: "<p>Room&nbsp;5</p>", StartDateTime: iso(1), EndDateTime: iso(1.05), IsAllDayEvent: false, LocationName: "B-5", CalendarEventViewUrl: "/d2l/le/calendar/101/event/11/detailsview" }], Next: null }],
  [/\/content\/myItems\/completions\//, { Objects: [], Next: null }],
  [/\/content\/myItems\//, { Objects: [{ OrgUnitId: 101, ItemId: 1, ItemName: "Read chapter 1", ItemType: 3, ActivityType: 1, ItemUrl: "/d2l/le/content/101/viewContent/1/View", DueDate: iso(3) }], Next: null }]
];
function fakeFetch(routes) {
  return async url => {
    const p = String(url);
    for (const [re, body] of routes) if (re.test(p)) { const text = typeof body === "string" ? body : JSON.stringify(body); return {ok: true, status: 200, headers: {get: k => (String(k).toLowerCase() === "content-type" ? "application/json" : null)}, json: async () => JSON.parse(text), text: async () => text}; }
    return {ok: false, status: 404, headers: {get: () => null}, json: async () => ({}), text: async () => ""};
  };
}
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  const mime = {".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".css": "text/css", ".webmanifest": "application/manifest+json"}[path.extname(f)];
  res.writeHead(200, {"content-type": mime || "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const SEED = {v: 2, updated: 1, courses: [], tasks: [], settings: {brightspace: {host: "learn.example.edu", mode: "api", name: "Ana", map: {"101": "new"}, courses: {"101": {code: "BIO101", name: "Biology 101"}}}}};
(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  const ctx = await browser.newContext({viewport: {width: 390, height: 844}});
  const asked = [];
  await ctx.exposeFunction("__nodeRun", async a => {
    asked.push(["run", a.id, a.origin, a.url]);
    const out = await vm.runInContext(a.script, vm.createContext({fetch: fakeFetch(BS), AbortController, setTimeout, clearTimeout, location: {origin: a.origin}, console}));
    return {ok: true, json: JSON.stringify(out)};
  });
  await ctx.exposeFunction("__nodeSignOut", async a => { asked.push(["signOut", a.id, a.origin]); return {}; });
  await ctx.addInitScript(([seed, src]) => {
    try { if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("coursework:v2", JSON.stringify(seed)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); } } catch (e) {}
    window.Capacitor = {Plugins: {StudyboardLms: {connect: async () => ({ok: true, name: "Ana"}), run: a => window.__nodeRun(a), signOut: a => window.__nodeSignOut(a)}}};
    (0, eval)(src);
  }, [SEED, build()]);
  const page = await ctx.newPage(); const errs = []; page.on("pageerror", e => errs.push(e.message));
  try {
    await page.goto(base); await page.waitForSelector("#view", {state: "attached"}); await page.waitForFunction(() => window.SBLMS && window.studiosoLms);
    ok(await page.evaluate(() => !window.studiosoDesktop && !!window.studiosoLms && SBLMS.brightspace.canSync()), "the phone counts as able to sync a connected school site");
    await page.evaluate(() => SBLMS.brightspace.syncNow({quiet: true})); await page.waitForTimeout(800);
    const titles = await page.evaluate(() => Object.values(JSON.parse(localStorage.getItem("coursework:v2")).tasks || {}).map(t => t.title));
    ok(titles.some(t => /Lab 1/.test(t)), "assignments arrive from the school site: " + JSON.stringify(titles));
    ok(asked.some(a => a[0] === "run" && a[1] === "brightspace" && a[2] === "https://learn.example.edu" && /\/d2l\/api\/versions\/$/.test(a[3])), "the plugin was asked to run the harvest on the school's own site");
    const st = await page.evaluate(() => SBLMS.brightspace.statusLine());
    ok(/Signed in on this phone/.test(st) && /Last synced/.test(st), "settings say it is signed in on this phone: " + st);
    // Sync Now in the School Sites sheet runs a real sync
    const before = asked.filter(a => a[0] === "run").length;
    await page.evaluate(() => SBLMS.pickerSheet()); await page.click('dialog [data-act="lms-sync-all"]'); await page.waitForTimeout(800);
    ok(asked.filter(a => a[0] === "run").length > before && !/can't be synced from here/.test(await page.evaluate(() => (document.querySelector("#toast") || {}).innerText || "")), "Sync Now asks the plugin to read the school site again");
    // Sign out
    await page.evaluate(() => window.studiosoLms.signOut("brightspace")); ok(asked.some(a => a[0] === "signOut" && a[2] === "https://learn.example.edu"), "sign out reaches the plugin with the school's address");
    ok(!errs.length, "no page errors: " + errs.join(" | "));
    console.log("\nlms-mobile.e2e: " + n + " checks passed");
  } finally { await browser.close(); server.close(); }
})().catch(e => { console.error(e); process.exit(1); });
