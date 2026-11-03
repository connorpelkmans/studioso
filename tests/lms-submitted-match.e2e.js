// node tests/lms-submitted-match.e2e.js
// A task that stands for a Brightspace assignment under another name ("Sim (CH1) Reflection" from the calendar or Content, the
// assignment "Sim Reflection 1") ticks off when that assignment is submitted: tied by the assignment's id in its link, else by a
// careful name match. Different assignments ("Reflection 1" / "Reflection 2", other courses, unclear fits) are never tied.
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const root = path.join(__dirname, "..");
const DAY = 864e5, iso = d => new Date(Date.now() + d * DAY).toISOString(), dateOf = d => iso(d).slice(0, 10);
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  const mime = {".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".css": "text/css"}[path.extname(f)];
  res.writeHead(200, {"content-type": mime || "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
let n = 0, failed = 0; const ok = (c, m) => { n++; if (!c) { failed++; console.log("FAIL -", m); } else console.log("ok -", m); };

const O = "https://learn.example.edu";
const seed = tasks => ({v: 2, updated: 1, tasks,
  courses: [{id: "c20", created: 1, name: "Practice of Nursing 1", code: "BSNC 1030", color: "#3b82f6", links: [], meetings: []},
            {id: "c10", created: 1, name: "Context of Nursing and Health Care 1", code: "BSNC 1020", color: "#22c55e", links: [], meetings: []}],
  settings: {brightspace: {host: "learn.example.edu", mode: "api", name: "Ana", map: {"20": "c20", "10": "c10"},
    courses: {"20": {code: "BSNC1030", name: "BSNC-1030-0 - Practice of Nursing 1"}, "10": {code: "BSNC1020", name: "BSNC-1020-0 - Context of Nursing and Health Care 1"}}}}});
// A read of both courses: folders/items per course
const H = (m) => ({ok: true, origin: O, me: {name: "Ana"}, all: [], errors: [], items: (m && m.items) || [], completions: [], courses: [
  {ou: "20", code: "BSNC1030", name: "BSNC-1030-0 - Practice of Nursing 1", folders: (m && m.f20) || [], quizzes: [], grades: [], news: [], discussions: (m && m.d20) || [], staff: [], events: [], tocDb: (m && m.toc20) || []},
  {ou: "10", code: "BSNC1020", name: "BSNC-1020-0 - Context of Nursing and Health Care 1", folders: (m && m.f10) || [], quizzes: [], grades: [], news: [], discussions: [], staff: [], events: []}]});
const folder = (id, name, dueIn, sub) => ({id, name, due: dueIn == null ? null : iso(dueIn), end: null, start: null, sub, files: [], st: sub === true ? {subAt: iso(-1.9)} : null});
// A task made from Brightspace's calendar link (the feed): its link is the Assignments list, or (made from Content) the folder itself
const feedTask = (id, title, cid, ou, extra) => {
  const due = dateOf(-1), link = (extra && extra.link) || `${O}/d2l/lms/dropbox/user/folders_list.d2l?ou=${ou}`;
  return Object.assign({id, created: 1, title, courseId: cid, type: "Assignment", due, time: "07:00", status: "todo", order: 1, link,
    bs: {key: ou + "|" + title.toLowerCase().replace(/[^a-z0-9]/g, ""), ou, ss: "todo", last: {title, due, time: "07:00", link, courseId: cid, type: "Assignment"}, seen: {feed: Date.now() - DAY}}}, extra || {});
};

(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://127.0.0.1:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  const fresh = async tasks => {
    const ctx = await browser.newContext({viewport: {width: 1100, height: 900}, serviceWorkers: "block"});
    await ctx.route(/supabase\.co/, r => r.abort());
    await ctx.addInitScript(s => { try { if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("coursework:v2", JSON.stringify(s)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("studyboard:tour", "done"); } } catch (e) {} }, seed(tasks));
    const page = await ctx.newPage(); const errs = []; page.on("pageerror", e => errs.push(e.message));
    await page.goto(base); await page.waitForFunction(() => window.SBLMS && SBLMS.brightspace && SBLMS.st().courses.c10, null, {timeout: 40000});
    page.errs = errs; return page;
  };
  const sync = (page, h) => page.evaluate(h => { const L = SBLMS.brightspace, d = L.fromApi(h), p = L.plan(d); L.applyPlan(d, p, "grab", true); const x = document.querySelector("#dlg"); if (x && x.open) x.close(); return p.rep.done.map(t => t.title); }, h);
  const byTitle = page => page.evaluate(() => { const o = {}; Object.values(SBLMS.st().tasks).forEach(t => { (o[t.title] = o[t.title] || []).push({id: t.id, s: t.status, c: t.courseId, sub: t.bs && t.bs.sub}); }); return o; });
  const one = async (tasks, h, title) => { const page = await fresh(tasks); const done = await sync(page, h); const all = await byTitle(page); const errs = page.errs; await page.context().close(); return {t: (all[title] || [])[0], all, done, errs}; };
  try {
    // 1. The reported case: "Sim (CH1) Reflection" (calendar link, due 7:00 AM) and the assignment "Sim Reflection 1" with 1 submission
    { const r = await one([feedTask("t1", "Sim (CH1) Reflection", "c20", "20")], H({f20: [folder("9144", "Sim Reflection 1", -1.3, true)]}), "Sim (CH1) Reflection");
      ok(r.t && r.t.s === "done" && r.t.sub === "yes", "the calendar task Sim (CH1) Reflection is ticked off: its assignment Sim Reflection 1 is submitted: " + JSON.stringify(r.all));
      ok(r.done.includes("Sim (CH1) Reflection"), "the sync report says so: " + JSON.stringify(r.done));
      ok(!r.errs.length, "no page errors: " + r.errs.join(" | ")); }
    // 1b. The same with an assignment that has no due date of its own (dated only by the calendar)
    { const r = await one([feedTask("t1", "Sim (CH1) Reflection", "c20", "20")], H({f20: [folder("9144", "Sim Reflection 1", null, true)]}), "Sim (CH1) Reflection");
      ok(r.t && r.t.s === "done", "and when the assignment has no due date of its own: " + JSON.stringify(r.all)); }
    // 1c. Its link is the assignment's own page (db=): tied by the id
    { const r = await one([feedTask("t1", "Sim (CH1) Reflection", "c20", "20", {link: `${O}/d2l/lms/dropbox/user/folder_submit_files.d2l?db=9144&grpid=0&isprv=0&bp=0&ou=20`})], H({f20: [folder("9144", "Sim Reflection 1", -1.3, true)]}), "Sim (CH1) Reflection");
      ok(r.t && r.t.s === "done", "a task whose link is the assignment's page is ticked off by the assignment's id: " + JSON.stringify(r.all)); }
    // 1d. A Content entry named "Sim (CH1) Reflection" for the assignment (its topic is the folder): the new task comes in done
    { const item = {ou: "20", id: "777", name: "Sim (CH1) Reflection", type: 1, act: 3, url: "/d2l/le/content/20/viewContent/777/View", due: iso(-1), end: null, start: null, done: null, exempt: false};
      const r = await one([], H({f20: [folder("9144", "Sim Reflection 1", -1.3, true)], items: [item], toc20: [{t: "777", f: "9144"}]}), "Sim (CH1) Reflection");
      ok(r.t && r.t.s === "done" && r.t.sub === "yes", "a Content entry tied to the assignment by its Content topic comes in done: " + JSON.stringify(r.all));
      const r2 = await one([], H({f20: [folder("9144", "Sim Reflection 1", -1.3, true)], items: [item]}), "Sim (CH1) Reflection");
      ok(r2.t && r2.t.s === "done", "and by its close name when Content doesn't say which assignment it is: " + JSON.stringify(r2.all)); }

    // 2. Tied by id even when the names have nothing in common
    { const r = await one([feedTask("t2", "Clinical paperwork week", "c20", "20", {link: `${O}/d2l/lms/dropbox/user/folder_submit_files.d2l?db=9002&ou=20`})],
        H({f20: [folder("9002", "Care Map Upload", -1, true), folder("9003", "Clinical Paperwork", -1, false)]}), "Clinical paperwork week");
      ok(r.t && r.t.s === "done", "the link's assignment (Care Map Upload, submitted) decides, not a name that fits another one: " + JSON.stringify(r.all)); }
    { const r = await one([feedTask("t2", "Sim (CH1) Reflection", "c20", "20", {link: `${O}/d2l/lms/dropbox/user/folder_submit_files.d2l?db=9003&ou=20`})],
        H({f20: [folder("9144", "Sim Reflection 1", -1.3, true), folder("9003", "Care Map Upload", -1, false)]}), "Sim (CH1) Reflection");
      ok(r.t && r.t.s === "todo", "a task whose link is another, unsubmitted assignment isn't ticked off by a name: " + JSON.stringify(r.all)); }

    // 3. Reflection 1 is never Reflection 2
    { const r = await one([feedTask("t3", "Sim Reflection 2", "c20", "20")], H({f20: [folder("9144", "Sim Reflection 1", -1.3, true)]}), "Sim Reflection 2");
      ok(r.t && r.t.s === "todo", "Sim Reflection 2 isn't ticked off by Sim Reflection 1's submission: " + JSON.stringify(r.all)); }
    { const r = await one([feedTask("t3", "Sim (CH2) Reflection", "c20", "20")], H({f20: [folder("9144", "Sim Reflection 1", -1.3, true), folder("9145", "Sim Reflection 2", -1.2, false)]}), "Sim (CH2) Reflection");
      ok(r.t && r.t.s === "todo", "Sim (CH2) Reflection stays To Do while Sim Reflection 2 isn't submitted: " + JSON.stringify(r.all)); }
    { const r = await one([feedTask("t3", "Sim Reflection Discussion", "c20", "20")], H({f20: [folder("9144", "Sim Reflection", -1.3, true)]}), "Sim Reflection Discussion");
      ok(r.t && r.t.s === "todo", "a discussion isn't ticked off by an assignment with a similar name: " + JSON.stringify(r.all)); }

    // 4. Another course's assignment never counts
    { const r = await one([feedTask("t4", "Sim (CH1) Reflection", "c10", "10")], H({f20: [folder("9144", "Sim Reflection 1", -1.3, true)]}), "Sim (CH1) Reflection");
      ok(r.t && r.t.s === "todo" && r.t.c === "c10", "a task in BSNC 1020 isn't ticked off by BSNC 1030's Sim Reflection 1: " + JSON.stringify(r.all)); }
    { const r = await one([feedTask("t4", "Sim (CH1) Reflection", "c10", "10", {link: `${O}/d2l/lms/dropbox/user/folder_submit_files.d2l?db=9144&ou=20`})], H({f20: [folder("9144", "Sim Reflection 1", -1.3, true)]}), "Sim (CH1) Reflection");
      ok(r.t && r.t.s === "todo", "nor by a link to another course's assignment: " + JSON.stringify(r.all)); }

    // 5. Unclear fits are left alone
    { const r = await one([feedTask("t5", "Sim Reflection", "c20", "20")], H({f20: [folder("9144", "Sim Reflection 1", -1.3, true), folder("9145", "Sim Reflection 2", -1.2, false)]}), "Sim Reflection");
      ok(r.t && r.t.s === "todo", "Sim Reflection fits Sim Reflection 1 and 2 equally: left alone: " + JSON.stringify(r.all)); }
    { const r = await one([feedTask("t5", "Sim Reflection", "c20", "20")], H({f20: [folder("9146", "Sim Reflection", -1.3, false), folder("9144", "Sim Reflection 1", -1.3, true)]}), "Sim Reflection");
      ok(r.t && r.t.s === "todo", "an assignment with exactly its name (not submitted) wins over a close one (submitted): " + JSON.stringify(r.all)); }
    { const r = await one([feedTask("t5", "Sim (CH1) Reflection", "c20", "20"), feedTask("t6", "Simulation Reflection #1", "c20", "20")], H({f20: [folder("9144", "Sim Reflection 1", -1.3, true)]}), "Sim (CH1) Reflection");
      ok(r.t && r.t.s === "todo" && r.all["Simulation Reflection #1"][0].s === "todo", "two different tasks that both fit one assignment by name: neither is ticked off: " + JSON.stringify(r.all)); }
    { const r = await one([feedTask("t5", "Sim (CH1) Reflection", "c20", "20")], H({f20: [folder("9144", "Sim Reflection 1", 12, true)]}), "Sim (CH1) Reflection");
      ok(r.t && r.t.s === "todo", "an assignment due two weeks away isn't this task: " + JSON.stringify(r.all)); }

    // 6. The student's own say wins
    { const r = await one([feedTask("t7", "Sim (CH1) Reflection", "c20", "20", {status: "doing", bs: Object.assign(feedTask("x", "Sim (CH1) Reflection", "c20", "20").bs, {ss: "todo", sm: true})})], H({f20: [folder("9144", "Sim Reflection 1", -1.3, true)]}), "Sim (CH1) Reflection");
      ok(r.t && r.t.s === "doing", "a task the student moved to In Progress stays there: " + JSON.stringify(r.all)); }
    { const r = await one([feedTask("t8", "Sim (CH1) Reflection", "c20", "20", {bs: Object.assign(feedTask("x", "Sim (CH1) Reflection", "c20", "20").bs, {doneSeen: true, ss: "done", sm: true})})], H({f20: [folder("9144", "Sim Reflection 1", -1.3, true)]}), "Sim (CH1) Reflection");
      ok(r.t && r.t.s === "todo", "a task the student moved back out of Complete stays To Do: " + JSON.stringify(r.all)); }
    { const page = await fresh([feedTask("t9", "Sim (CH1) Reflection", "c20", "20")]);
      await sync(page, H({f20: [folder("9144", "Sim Reflection 1", -1.3, true)]}));
      await page.evaluate(() => { const t = SBLMS.st().tasks.t9; SBLMS.applyChanges([{kind: "task", id: "t9", after: Object.assign({}, t, {status: "todo", doneAt: null, pct: 0})}], ""); });
      await sync(page, H({f20: [folder("9144", "Sim Reflection 1", -1.3, true)]}));
      const s = await page.evaluate(() => SBLMS.st().tasks.t9.status);
      ok(s === "todo", "once ticked off by a sync and moved back by the student, a later sync leaves it: " + s);
      await page.context().close(); }
  } finally { await browser.close(); server.close(); }
  console.log(`\nlms-submitted-match.e2e: ${n - failed} of ${n} checks passed`);
  if (failed) process.exit(1);
})().catch(e => { console.error(e); process.exit(1); });
