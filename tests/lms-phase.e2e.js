// node tests/lms-phase.e2e.js   (Playwright + Chromium; see tests/pw.js)
// Brightspace's calendar names its entries with a word after the item's name, with or without a dash: "Workshop Quiz - Available",
// "HSIP 0100 Quiz Completed", "Capacity Building Assignment Due". Those words are not part of the name, so:
//  - the names are cleaned the same way whichever form the school uses
//  - copies an older version made from such entries (titled with the word) are ticked off when the real item is done on Brightspace,
//    and otherwise offered for removal in the platform's sheet, never deleted by themselves
//  - a second read changes nothing more
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
// Copies an older version made from calendar entries (from the calendar link: seen by "feed")
const copy = (id, title, due) => ({id, created: 1, title, courseId: "c1", type: "Assignment", due, time: "", status: "todo", order: 1,
  bs: {key: "7|" + title.toLowerCase().replace(/[^a-z0-9]/g, ""), ou: "7", last: {title, due, courseId: "c1"}, seen: {feed: 1}}});
const SEED = {v: 2, updated: 1, courses: [{id: "c1", created: 1, name: "Health Sciences", code: "HSIP 0100", color: "#3b82f6", links: [], meetings: []}],
  tasks: [copy("t1", "Capacity Building Assignment Due", dateOf(-4)), copy("t2", "HSIP 0100 Quiz Completed", dateOf(-9)), copy("t3", "Workshop Quiz - Available", dateOf(-12))],
  settings: {brightspace: {host: "learn.example.edu", mode: "api", name: "Ana", map: {"7": "c1"}, courses: {"7": {code: "HSIP0100", name: "Health Sciences"}}}}};
// What the bookmark read: the real items, by their real names
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
    const names = await app.evaluate(() => ["Capacity Building Assignment Due", "HSIP 0100 Quiz Completed", "Workshop Quiz - Available", "Essay 1 - Due", "Lab 2 – Availability Ends", "Quiz 3: Unavailable", "Due Process Essay"]
      .map(s => SBLMS.brightspace.cleanTitle(s)));
    ok(JSON.stringify(names.map(x => x.title)) === JSON.stringify(["Capacity Building Assignment", "HSIP 0100 Quiz", "Workshop Quiz", "Essay 1", "Lab 2", "Quiz 3", "Due Process Essay"]),
      "the calendar's words come off the names, with or without a dash: " + JSON.stringify(names.map(x => x.title)));
    ok(JSON.stringify(names.map(x => x.phase)) === JSON.stringify(["due", "ends", "starts", "due", "ends", "ends", ""]), "and say which date each entry is");
    // The read: each real item takes over its copy (renamed to the real name); the submitted ones are ticked off. Nothing is doubled.
    const r1 = await app.evaluate(d => { const L = SBLMS.brightspace, p = L.plan(d); L.applyPlan(d, p, "grab", true); const ts = Object.values(SBLMS.st().tasks); return {n: ts.length, done: p.rep.done.map(t => t.id), gone: p.rep.gone.map(t => t.id), t: ts.map(t => [t.id, t.title, t.status])}; }, DATA);
    ok(r1.n === 3, "no task is added twice: " + JSON.stringify(r1.t));
    ok(JSON.stringify(r1.t) === JSON.stringify([["t1", "Capacity Building Assignment", "done"], ["t2", "HSIP 0100 Quiz", "done"], ["t3", "Workshop Quiz", "todo"]]), "the copies take the real names, and the submitted ones are ticked off");
    ok(!r1.gone.length, "nothing is offered for removal when each copy is the real item");
    // The task sheet says what the latest read said, even when the task itself didn't change
    const line = await app.evaluate(d => { const L = SBLMS.brightspace; d.recs[2].sub = "no"; L.applyPlan(d, L.plan(d), "grab", true); return SBLMS_TASK(SBLMS.st().tasks.t3); }, DATA);
    ok(/said nothing was handed in yet/.test(line), "the task sheet tells what the latest read said: " + line.replace(/<[^>]+>/g, "").slice(0, 120));
    const r2 = await app.evaluate(d => { const p = SBLMS.brightspace.plan(d); return {done: p.rep.done.length, added: p.rep.added.length, gone: p.rep.gone.length}; }, DATA);
    ok(r2.done === 0 && r2.added === 0 && r2.gone === 0, "a second read changes nothing more: " + JSON.stringify(r2));
    // When the real item already has its own task (an earlier read), the leftover copy is ticked off if it's done, or offered for removal
    const r3 = await app.evaluate(d => {
      const L = SBLMS.brightspace, mk = (id, title, due) => ({kind: "task", id, after: {id, created: 1, title, courseId: "c1", type: "Assignment", due, time: "", status: "todo", order: 1, bs: {key: "7|" + title.toLowerCase().replace(/[^a-z0-9]/g, ""), ou: "7", last: {title, due, courseId: "c1"}, seen: {feed: 1}}}});
      SBLMS.applyChanges([mk("x1", "Capacity Building Assignment Due", d.recs[0].due), mk("x2", "Workshop Quiz - Available", d.recs[2].due)], "");
      const p = L.plan(d); L.applyPlan(d, p, "grab", true); const st = SBLMS.st().tasks;
      return {x1: st.x1.status, x2: st.x2.status, gone: L.cfg().gone};
    }, DATA);
    ok(r3.x1 === "done" && r3.x2 === "todo" && r3.gone.includes("x2") && !r3.gone.includes("x1"), "a leftover copy is ticked off when the item is done, or else offered for removal: " + JSON.stringify(r3));
    // An assignment with no due date of its own (the student's dates come from special access, through Brightspace's "my items"):
    // the item still gets the folder's answer about the submission
    const r4 = await app.evaluate(ago => SBLMS.brightspace.fromApi({ok: true, origin: "https://learn.example.edu", me: {name: "Ana"}, all: [], errors: [],
      courses: [{ou: "7", code: "HSIP0100", name: "Health Sciences", folders: [{id: "1", name: "Capacity Building Assignment", due: null, end: null, sub: true, files: []}], quizzes: [], grades: [], news: [], events: []}],
      items: [{ou: "7", id: "1", act: 3, type: 1, name: "Capacity Building Assignment", due: ago, url: "/d2l/lms/dropbox/user/folder_submit_files.d2l?db=1&ou=7", done: null, exempt: false}], completions: []}).recs
      .map(r => [r.title, r.done, r.sub]), new Date(Date.now() - 4 * DAY).toISOString());
    ok(JSON.stringify(r4) === JSON.stringify([["Capacity Building Assignment", true, "yes"]]), "an assignment dated only by your own dates still ticks off when it's submitted: " + JSON.stringify(r4));
    ok(!errs.length, "no page errors: " + errs.join(" | "));
  } finally { await browser.close(); server.close(); }
  console.log(`\nlms-phase.e2e: ${n} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
