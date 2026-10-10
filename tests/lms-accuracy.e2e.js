// node tests/lms-accuracy.e2e.js   (Playwright + Chromium; see tests/pw.js)
// How a signed-in Canvas sync lands in the real page (through the phone stand-in, like lms-mobile.e2e.js):
//  - two assignments with the same name and different dates stay two tasks, and a task an older version made from them (one task, key "ou|title") is reused, not doubled
//  - a second sync changes nothing (no flip-flopping between the twins)
//  - a points-based course (no group weights) gives each graded item its share of the points, so the Grade Tracker can use it
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert"), vm = require("vm");
const {chromium, executablePath} = require("./pw");
const {build} = require("../scripts/build-lms-mobile.js");
const root = path.join(__dirname, "..");
const DAY = 864e5, at = d => new Date(Math.floor(Date.now() / DAY) * DAY + d * DAY + 16 * 3600e3).toISOString(), dateOf = d => at(d).slice(0, 10);
const CV = [
  [/^\/api\/v1\/users\/self$/, {id: 9, name: "Ana Lee"}],
  [/^\/api\/v1\/courses\?enrollment_state=active/, [{id: 201, name: "History 200", course_code: "HIS200", start_at: at(-30), end_at: at(60), apply_assignment_group_weights: false, enrollments: [{computed_current_score: 80}]}]],
  [/^\/api\/v1\/courses\/201\/assignments\?/, [
    {id: 1, name: "Reflection", due_at: at(4), published: true, points_possible: 10, assignment_group_id: 3, submission_types: ["online_text_entry"], submission: {workflow_state: "graded", score: 8, submitted_at: at(-1)}},
    {id: 2, name: "Reflection", due_at: at(11), published: true, points_possible: 10, assignment_group_id: 3, submission_types: ["online_text_entry"], submission: {workflow_state: "unsubmitted"}},
    {id: 3, name: "Chapter 4 check", due_at: at(20), published: true, points_possible: 30, assignment_group_id: 3, is_quiz_lti_assignment: true, submission_types: ["external_tool"], submission: null}]],
  [/^\/api\/v1\/courses\/201\/assignment_groups/, [{id: 3, group_weight: 0}]]
];
function fakeFetch(routes) {
  return async url => {
    const p = String(url);
    for (const [re, body] of routes) if (re.test(p)) { const text = JSON.stringify(body); return {ok: true, status: 200, headers: {get: () => null}, json: async () => JSON.parse(text), text: async () => text}; }
    return {ok: false, status: 404, headers: {get: () => null}, json: async () => ({}), text: async () => ""};
  };
}
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  const mime = {".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".css": "text/css"}[path.extname(f)];
  res.writeHead(200, {"content-type": mime || "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const LEGACY = {id: "legacy1", created: 1, title: "Reflection", courseId: "c1", type: "Assignment", due: dateOf(4), time: "16:00", status: "todo", order: 1,
  cv: {key: "201|reflection", ou: "201", last: {title: "Reflection", due: dateOf(4), time: "16:00", courseId: "c1"}, seen: {api: 1}}};
const SEED = {v: 2, updated: 1, courses: [{id: "c1", created: 1, name: "History 200", code: "HIS 200", color: "#3b82f6", links: [], meetings: []}], tasks: [LEGACY],
  settings: {canvas: {host: "x.instructure.com", mode: "api", name: "Ana", map: {"201": "c1"}, courses: {"201": {code: "HIS200", name: "History 200"}}, addGraded: true}}};
(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  const ctx = await browser.newContext({viewport: {width: 390, height: 844}, timezoneId: "UTC"});
  await ctx.exposeFunction("__nodeRun", async a => ({ok: true, json: JSON.stringify(await vm.runInContext(a.script, vm.createContext({fetch: fakeFetch(CV), AbortController, setTimeout, clearTimeout, location: {origin: a.origin}, console})))}));
  await ctx.addInitScript(([seed, src]) => {
    try { if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("coursework:v2", JSON.stringify(seed)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); } } catch (e) {}
    window.Capacitor = {Plugins: {StudyboardLms: {connect: async () => ({ok: true, name: "Ana"}), run: a => window.__nodeRun(a), signOut: async () => ({})}}};
    (0, eval)(src);
  }, [SEED, build()]);
  const page = await ctx.newPage(); const errs = []; page.on("pageerror", e => errs.push(e.message));
  const tasks = () => page.evaluate(() => Object.values(JSON.parse(localStorage.getItem("coursework:v2")).tasks || {}));
  try {
    await page.goto(base); await page.waitForSelector("#view", {state: "attached"}); await page.waitForFunction(() => window.SBLMS && window.studiosoLms);
    await page.evaluate(() => SBLMS.canvas.syncNow({quiet: true})); await page.waitForTimeout(800);
    let ts = await tasks();
    const refl = ts.filter(t => t.title === "Reflection").sort((a, b) => a.due < b.due ? -1 : 1);
    ok(refl.length === 2, "two same-named assignments stay two tasks: " + JSON.stringify(refl.map(t => [t.id, t.due])));
    ok(refl[0].id === "legacy1" && refl[0].due === dateOf(4) && refl[1].due === dateOf(11), "the task an older sync made is reused for the item with its date");
    ok(refl[0].cv.key !== refl[1].cv.key && refl.every(t => /^201\|reflection\|/.test(t.cv.key)), "each twin has its own key");
    ok(refl[0].mark && refl[0].mark.got === 8 && refl[0].mark.outOf === 10, "the grade lands on the right twin");
    ok(Number(refl[0].weight) === 20 && Number(refl[1].weight) === 20, "points-based course: each item is worth its share of all the points");
    const quiz = ts.find(t => t.title === "Chapter 4 check");
    ok(quiz && quiz.type === "Quiz" && Number(quiz.weight) === 60, "a New Quizzes item comes in as a quiz with its weight: " + JSON.stringify(quiz && [quiz.type, quiz.weight]));
    const snap = JSON.stringify(ts.map(t => [t.id, t.due, t.cv && t.cv.key]).sort());
    await page.evaluate(() => SBLMS.canvas.syncNow({quiet: true})); await page.waitForTimeout(800);
    ts = await tasks();
    ok(JSON.stringify(ts.map(t => [t.id, t.due, t.cv && t.cv.key]).sort()) === snap, "a second sync changes nothing");
    ok(!errs.length, "no page errors: " + errs.join(" | "));
    console.log("\nlms-accuracy.e2e: " + n + " checks passed");
  } finally { await browser.close(); server.close(); }
})().catch(e => { console.error(e); process.exit(1); });
