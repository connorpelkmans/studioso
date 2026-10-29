// node tests/lms-class-avg.e2e.js
// A Brightspace class average stays on a mark when a later sync doesn't bring class stats (it used to be wiped)
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const root = path.join(__dirname, "..");
const DAY = 864e5, dateOf = d => new Date(Math.floor(Date.now() / DAY) * DAY + d * DAY).toISOString().slice(0, 10);
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  const mime = {".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".css": "text/css"}[path.extname(f)];
  res.writeHead(200, {"content-type": mime || "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
// Copies an older version made from calendar entries
const copy = (id, title, due) => ({id, created: 1, title, courseId: "c1", type: "Assignment", due, time: "", status: "todo", order: 1,
  bs: {key: "7|" + title.toLowerCase().replace(/[^a-z0-9]/g, ""), ou: "7", last: {title, due, courseId: "c1"}, seen: {feed: 1}}});
const SEED = {v: 2, updated: 1, courses: [{id: "c1", created: 1, name: "Health Sciences", code: "HSIP 0100", color: "#3b82f6", links: [], meetings: []}],
  tasks: [copy("t1", "Capacity Building Assignment Due", dateOf(-4)), copy("t2", "HSIP 0100 Quiz Completed", dateOf(-9)), copy("t3", "Workshop Quiz - Available", dateOf(-12))],
  settings: {brightspace: {host: "learn.example.edu", mode: "api", name: "Ana", map: {"7": "c1"}, courses: {"7": {code: "HSIP0100", name: "Health Sciences"}}}}};
// What the bookmark read
const rec = (title, due, done) => ({ou: "7", pid: "f" + title.length, title, type: "Assignment", due, time: "23:00", start: "", notes: "", url: "", gid: "", done, sure: true});
const DATA = {src: "api", origin: "https://learn.example.edu", name: "Ana", courses: [{ou: "7", code: "HSIP 0100", name: "Health Sciences"}],
  recs: [rec("Capacity Building Assignment", dateOf(-4), true), rec("HSIP 0100 Quiz", dateOf(-9), true), rec("Workshop Quiz", dateOf(-10), false)],
  evs: [], grades: [], finals: {}, news: [], synced: ["7"]};

(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://127.0.0.1:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  const ctx = await browser.newContext({viewport: {width: 1100, height: 900}, timezoneId: "UTC"});
  await ctx.addInitScript(seed => { try { if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("coursework:v2", JSON.stringify(seed)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); } } catch (e) {} }, SEED);
  const app = await ctx.newPage(); const errs = []; app.on("pageerror", e => errs.push(e.message));
  try {
    await app.goto(base); await app.waitForFunction(() => window.SBLMS && SBLMS.brightspace && SBLMS.st().tasks.t1);
    const sync = fb => app.evaluate(([d, fb]) => { const L = SBLMS.brightspace; d = JSON.parse(JSON.stringify(d)); d.recs[1].gid = "g5"; d.recs[1].fb = fb; L.applyPlan(d, L.plan(d), "grab", true); const t = SBLMS.st().tasks.t2; return JSON.parse(JSON.stringify((t.bs || {}).fb || null)); }, [DATA, fb]);
    let fb = await sync({c: [], ra: [], sc: 41, of: 50, g: "82 %", cls: {mean: 36, median: 37, lo: 20, hi: 50}});
    ok(fb && fb.cls && fb.cls.mean === 36, "the first sync saves the class average on the midterm");
    fb = await sync({c: [], ra: [], sc: 41, of: 50, g: "82 %"});
    ok(fb && fb.cls && fb.cls.mean === 36 && fb.sc === 41, "a later sync without class stats keeps it (it used to wipe it)");
    fb = await sync({c: [], ra: [], sc: 43, of: 50, g: "86 %", cls: {mean: 38, median: 38, lo: 22, hi: 50}});
    ok(fb.cls.mean === 38 && fb.sc === 43, "and new class stats replace the old ones");
    const vs = await app.evaluate(() => SBLMS_TASK(SBLMS.st().tasks.t2));
    ok(/class average/i.test(vs), "the task sheet still shows the class comparison");
    ok(!errs.length, "no page errors: " + errs.join(" | "));
    console.log("\nlms-class-avg.e2e: " + n + " checks passed");
  } finally { await browser.close(); server.close(); }
})().catch(e => { console.error(e); process.exit(1); });
