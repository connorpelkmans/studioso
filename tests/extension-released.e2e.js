// node tests/extension-released.e2e.js   (Playwright + Chromium; see tests/pw.js)
// Every released version of the Studyboard School Sync extension (extension/released/<version>/, the exact files sent to the stores)
// must keep working with the website as it is now: a store review or an old install runs that version's own reading code, while the
// website changes. For each version:
//  1. the whole flow in Chromium (tests/extension.e2e.js with that build): it loads, reads a stand-in Canvas, and studyboardapp.com
//     imports what it read (tasks, done when submitted, grade, feedback, instructor, class times)
//  2. its own Brightspace and Blackboard reading (harvest.js from that version) on stand-in sites, imported by today's page: courses,
//     tasks, the submitted ones done, no page errors
// Never change a folder in extension/released: add a new one for each version sent to a store.
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert"), vm = require("vm"), {spawnSync} = require("child_process");
const {chromium, executablePath} = require("./pw");
const root = path.join(__dirname, ".."), REL = path.join(root, "extension", "released");
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const DAY = 864e5, iso = d => new Date(Date.now() + d * DAY).toISOString();

// Stand-in Brightspace and Blackboard (the paths their APIs use; the longest matching prefix answers)
const BS = (b => ({
  "/d2l/api/versions/": [{ProductCode: "lp", LatestVersion: "1.30"}, {ProductCode: "le", LatestVersion: "1.50"}],
  "/d2l/api/lp/1.30/users/whoami": {Identifier: "42", FirstName: "Ana", LastName: "Lee"},
  "/d2l/api/lp/1.30/enrollments/myenrollments/": {Items: [{OrgUnit: {Id: 7, Name: "Health Sciences", Code: "HSIP0100"}}], PagingInfo: {}},
  [b + "/dropbox/folders/1/submissions/mysubmissions/"]: [{Status: 1, Submissions: [{SubmissionDate: iso(-5)}]}],
  [b + "/dropbox/folders/2/submissions/mysubmissions/"]: [],
  [b + "/dropbox/folders/"]: [{Id: 1, Name: "Care Plan 1", DueDate: iso(-4)}, {Id: 2, Name: "Care Plan 2", DueDate: iso(6)}],
  [b + "/quizzes/"]: {Objects: [{QuizId: 5, Name: "Module Quiz 1", DueDate: iso(3)}]}
}))("/d2l/api/le/1.50/7");
const BB = (c => ({
  "/learn/api/public/v1/users/me": {id: "_u", name: {given: "Ana", family: "Lee"}},
  "/learn/api/public/v1/users/_u/courses": {results: [{course: {id: c, name: "Chemistry 110", courseId: "CHEM110"}, lastAccessed: iso(-1)}]},
  [`/learn/api/public/v2/courses/${c}/gradebook/columns/_a/attempts`]: {results: [{status: "NeedsGrading", attemptDate: iso(-3)}]},
  [`/learn/api/public/v2/courses/${c}/gradebook/columns/_b/attempts`]: {results: []},
  [`/learn/api/public/v2/courses/${c}/gradebook/columns`]: {results: [{id: "_a", name: "Lab Report 1", grading: {due: iso(-2)}, score: {possible: 10}}, {id: "_b", name: "Lab Report 2", grading: {due: iso(5)}, score: {possible: 10}}]}
}))("_1_1");
const fakeFetch = routes => async u => {
  u = String(u); const k = Object.keys(routes).sort((a, b) => b.length - a.length).find(k => u.startsWith(k));
  if (!k) return {ok: false, status: 404, headers: {get: () => ""}, json: async () => ({}), text: async () => "{}"};
  const body = JSON.stringify(routes[k]);
  return {ok: true, status: 200, headers: {get: () => ""}, json: async () => JSON.parse(body), text: async () => body};
};
// The version's own harvest.js, run the way its background runs it: make(fetch, location)[platform](options), then its clean()
async function readWith(dir, id, routes) {
  const ctx = vm.createContext({URL, AbortController, setTimeout, clearTimeout, encodeURIComponent, Date, console});
  ctx.globalThis = ctx;
  vm.runInContext(fs.readFileSync(path.join(dir, "harvest.js"), "utf8"), ctx);
  const X = ctx.__studyboardExt, origin = "https://school.example.edu";
  const h = await X.make(fakeFetch(routes), {origin})[id]({pastDays: 60, aheadDays: 240, grades: true, news: true, only: null, skip: [], mail: false});
  return JSON.parse(JSON.stringify(X.clean(h, origin)));
}

const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  const mime = {".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".css": "text/css"}[path.extname(f)];
  res.writeHead(200, {"content-type": mime || "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});

(async () => {
  const versions = fs.existsSync(REL) ? fs.readdirSync(REL).filter(v => fs.existsSync(path.join(REL, v, "manifest.json"))).sort() : [];
  ok(versions.length > 0, "released versions to check: " + versions.join(", "));
  await new Promise(r => server.listen(0, r)); const base = "http://127.0.0.1:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  try {
    for (const v of versions) {
      const dir = path.join(REL, v);
      ok(JSON.parse(fs.readFileSync(path.join(dir, "manifest.json"), "utf8")).version === v, `${v}: the folder holds that version`);
      // 1. The whole flow, with this version's files
      const r = spawnSync(process.execPath, [path.join(__dirname, "extension.e2e.js")], {env: Object.assign({}, process.env, {SB_EXT_BUILD: dir}), encoding: "utf8", timeout: 240000});
      ok(r.status === 0, `${v}: the extension loads, reads Canvas, and today's website imports it` + (r.status === 0 ? "" : "\n" + (r.stdout || "").slice(-1500) + (r.stderr || "").slice(-1500)));
      // 2. Its Brightspace and Blackboard reading, imported by today's page
      for (const [id, routes, done, todo] of [["brightspace", BS, "Care Plan 1", "Care Plan 2"], ["blackboard", BB, "Lab Report 1", "Lab Report 2"]]) {
        const h = await readWith(dir, id, routes);
        ok(h.ok && h.courses.length === 1, `${v}: its ${id} reading works (${h.courses.length} course)`);
        const ctx = await browser.newContext({timezoneId: "UTC"}); await ctx.addInitScript(require("./consent-ok"));
        await ctx.addInitScript(() => { try { localStorage.setItem("coursework:v2", JSON.stringify({v: 2, updated: 1, courses: [], tasks: [], settings: {}})); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); } catch (e) {} });
        const page = await ctx.newPage(); const errs = []; page.on("pageerror", e => errs.push(e.message));
        await page.goto(base); await page.waitForFunction(() => window.SBLMS && window.SBLMS.canvas);
        await page.evaluate(([id, h]) => { const d = document.querySelector("#dlg"); if (d.open) d.close(); SBLMS[id].importGrab(h, "https://school.example.edu"); }, [id, h]);
        await page.waitForSelector("dialog[open] [data-submit]", {timeout: 10000}); await page.click("dialog[open] [data-submit]");
        const got = await page.waitForFunction(names => { const ts = Object.values(SBLMS.st().tasks); const a = ts.find(t => t.title === names[0]), b = ts.find(t => t.title === names[1]); return a && b ? {a: a.status, b: b.status} : null; }, [done, todo], {timeout: 10000}).then(x => x.jsonValue());
        ok(got.a === "done" && got.b === "todo", `${v}: today's page imports its ${id} read: ${done} done (submitted), ${todo} to do`);
        ok(!errs.length, `${v}: no page errors importing ${id}` + (errs.length ? ": " + errs.join(" | ") : ""));
        await ctx.close();
      }
    }
  } finally { await browser.close(); server.close(); }
  console.log(`\nextension-released.e2e: ${n} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
