// node tests/lms-dupe-course.e2e.js
// School sync never leaves two Studyboard courses for one school course
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const root = path.join(__dirname, "..");
const DAY = 864e5, iso = d => new Date(Date.now() + d * DAY).toISOString();
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  const mime = {".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".css": "text/css"}[path.extname(f)];
  res.writeHead(200, {"content-type": mime || "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const course = (ou, code, name, quiz) => ({ou, code, name, folders: [], grades: [], news: [], discussions: [], staff: [], events: [],
  quizzes: [{id: "q" + ou, name: quiz, due: iso(5), start: iso(4), end: null, done: false}], marks: []});
const H = list => ({ok: true, origin: "https://learn.example.edu", me: {name: "Ana"}, all: [], errors: [], items: [], completions: [], courses: list});
const T = (id, title, cid, extra) => Object.assign({id, created: 1, title, courseId: cid, type: "Assignment", due: iso(6).slice(0, 10), time: "", status: "todo", order: 1, checklist: [], history: []}, extra || {});

(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://127.0.0.1:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  const open = async seed => {
    const ctx = await browser.newContext({viewport: {width: 1100, height: 900}, serviceWorkers: "block"});
    await ctx.route(/supabase\.co/, r => r.abort());
    await ctx.addInitScript(s => { try { if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("coursework:v2", JSON.stringify(s)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:tour", "done"); localStorage.setItem("studioso:sb", JSON.stringify("local")); } } catch (e) {} }, seed);
    const page = await ctx.newPage(), errs = []; page.on("pageerror", e => errs.push(e.message));
    await page.goto(base); await page.waitForFunction(() => window.SBLMS && SBLMS.brightspace && window.SBLMS_DEDUPE, null, {timeout: 40000});
    await page.waitForTimeout(3000);
    page.errs = errs; return page;
  };
  const sync = (page, h) => page.evaluate(h => { const L = SBLMS.brightspace, d = L.fromApi(h), p = L.plan(d); L.applyPlan(d, p, "grab", true); const x = document.querySelector("#dlg"); if (x && x.open) x.close(); }, h).then(() => page.waitForTimeout(300));
  const look = page => page.evaluate(() => { const st = SBLMS.st(); return {courses: Object.values(st.courses).map(c => (c.code || "") + "|" + c.name + (c.archived ? "|archived" : "")),
    tasks: Object.values(st.tasks).map(t => t.title + "@" + (st.courses[t.courseId] ? (st.courses[t.courseId].code || st.courses[t.courseId].name) : "MISSING")), map: SBLMS.brightspace.cfg().map}; });
  const bsSet = map => ({brightspace: {host: "learn.example.edu", mode: "api", name: "Ana", map, courses: {}}});
  try {
    // 1. The school lists one course twice (two sections) in the same read: one course
    { const page = await open({v: 2, updated: 1, tasks: [], courses: [], settings: bsSet({})});
      const h = H([course("50", "BSNC1040", "BSNC-1040-0 - Health Assessment", "Quiz A"), course("51", "BSNC1040", "BSNC-1040-L1 - Health Assessment Lab", "Quiz B")]);
      await sync(page, h); await sync(page, h);
      const s = await look(page);
      ok(s.courses.filter(c => /^BSNC 1040/.test(c)).length === 1, "two listings of one course make one course: " + JSON.stringify(s.courses));
      ok(s.tasks.includes("Quiz A@BSNC 1040") && s.tasks.includes("Quiz B@BSNC 1040"), "and both listings' work lands in it: " + JSON.stringify(s.tasks));
      ok(!page.errs.length, "no page errors: " + page.errs.join(" | "));
      await page.context().close(); }

    // 2. A course you archived isn't made again
    { const page = await open({v: 2, updated: 1, tasks: [], courses: [{id: "arc", created: 1, name: "Pharmacology", code: "BSNC 1060", color: "#3b82f6", links: [], meetings: [], archived: true}], settings: bsSet({})});
      await sync(page, H([course("60", "BSNC1060", "BSNC-1060-0 - Pharmacology", "Drug Quiz")]));
      const s = await look(page);
      ok(s.courses.length === 1 && /archived/.test(s.courses[0]) && s.map["60"] === "arc", "an archived course is matched, not copied: " + JSON.stringify(s));
      await page.context().close(); }

    // 3. Duplicates already made: the sync's copy is folded into your course
    { const seed = {v: 2, updated: 1, courses: [
        {id: "c1", created: 1, name: "Context of Nursing", code: "BSNC 1020", color: "#22c55e", links: [], meetings: [], instructor: ""},
        {id: "bsc_dup", created: 5, name: "Context of Nursing and Health Care 1", code: "BSNC 1020", color: "#ef4444", links: [{label: "Brightspace", url: "https://learn.example.edu/d2l/home/10"}], meetings: [], instructor: "Dr. Lee", bs: {ou: "10", home: 1}},
        {id: "m1", created: 2, name: "Lab A", code: "BSNC 1099", color: "#000", links: [], meetings: []}, {id: "m2", created: 3, name: "Lab B", code: "BSNC 1099", color: "#111", links: [], meetings: []}],
      tasks: [T("t1", "My Notes Review", "c1"), T("t2", "Quiz 3", "bsc_dup", {bs: {key: "10|quiz3", ou: "10", last: {title: "Quiz 3", courseId: "bsc_dup"}, seen: {api: 1}}})],
      settings: bsSet({"10": "bsc_dup"})};
      const page = await open(seed);
      let s = await look(page);
      ok(s.courses.filter(c => /^BSNC 1020/.test(c)).length === 1 && s.courses.includes("BSNC 1020|Context of Nursing"), "the copy is merged into the course you made: " + JSON.stringify(s.courses));
      ok(s.tasks.includes("Quiz 3@BSNC 1020") && s.tasks.includes("My Notes Review@BSNC 1020"), "its work moved across: " + JSON.stringify(s.tasks));
      ok(s.map["10"] === "c1", "the school course now points at your course: " + JSON.stringify(s.map));
      const kept = await page.evaluate(() => { const c = SBLMS.st().courses.c1; return {instructor: c.instructor, links: c.links.length, last: SBLMS.st().tasks.t2.bs.last.courseId}; });
      ok(kept.instructor === "Dr. Lee" && kept.links === 1 && kept.last === "c1", "blank details are filled in from the copy, and the task isn't seen as moved by you: " + JSON.stringify(kept));
      ok(s.courses.filter(c => /^BSNC 1099/.test(c)).length === 2, "two courses you made yourself are left alone");
      await sync(page, H([course("10", "BSNC1020", "BSNC-1020-0 - Context of Nursing and Health Care 1", "Quiz 3")]));
      s = await look(page);
      ok(s.courses.filter(c => /^BSNC 1020/.test(c)).length === 1 && s.tasks.filter(t => /^Quiz 3@/.test(t)).length === 1 && s.tasks.includes("Quiz 3@BSNC 1020"), "the next sync keeps it to one course and one Quiz 3: " + JSON.stringify(s));
      ok(!page.errs.length, "no page errors: " + page.errs.join(" | "));
      await page.context().close(); }
  } finally { await browser.close(); server.close(); }
  console.log(`\nlms-dupe-course.e2e: ${n} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
