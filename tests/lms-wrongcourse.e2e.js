// node tests/lms-wrongcourse.e2e.js
// A task in the wrong course is put to the student (Move / Keep Here) on the next sync; quiz marks that are only on a quiz's
// Submissions page come in; Same Exam? never pairs exams from two courses.
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
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };

const MID = "Midterm Exam- Requires Respondus LockDown Browser";
const seed = tasks => ({v: 2, updated: 1, tasks,
  courses: [{id: "c20", created: 1, name: "Practice of Nursing 1", code: "BSNC 1030", color: "#3b82f6", links: [], meetings: []},
            {id: "c10", created: 1, name: "Context of Nursing and Health Care 1", code: "BSNC 1020", color: "#22c55e", links: [], meetings: []}],
  settings: {brightspace: {host: "learn.example.edu", mode: "api", name: "Ana", map: {"20": "c20", "10": "c10"},
    courses: {"20": {code: "BSNC1030", name: "BSNC-1030-0 - Practice of Nursing 1"}, "10": {code: "BSNC1020", name: "BSNC-1020-0 - Context of Nursing and Health Care 1"}}}}});
// What the school site read: the midterm is a quiz in BSNC 1020, sat, and its mark is only on its Submissions page
const H = (more) => ({ok: true, origin: "https://learn.example.edu", me: {name: "Ana"}, all: [], errors: [], items: [], completions: [], courses: [
  {ou: "20", code: "BSNC1030", name: "BSNC-1030-0 - Practice of Nursing 1", folders: [], quizzes: [], grades: [], news: [], discussions: [], staff: [], events: (more && more.ev20) || []},
  {ou: "10", code: "BSNC1020", name: "BSNC-1020-0 - Context of Nursing and Health Care 1", folders: [], grades: (more && more.g10) || [], news: [], discussions: [], staff: [], events: [],
    quizzes: [{id: "8", name: MID, due: iso(-3), start: iso(-3.1), end: null, done: true, gid: (more && more.gid) || "", score: {num: 34, den: 45, how: "highest attempt"}}]}]});
const bsTask = (id, title, cid, ou, extra) => Object.assign({id, created: 1, title, courseId: cid, type: "Exam", due: dateOf(-3), time: "", status: "todo", order: 1,
  bs: {key: ou + "|" + title.toLowerCase().replace(/[^a-z0-9]/g, ""), ou, last: {title, courseId: cid}, seen: {api: 1}, item: true}}, extra || {});

(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://127.0.0.1:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  const fresh = async tasks => {
    const ctx = await browser.newContext({viewport: {width: 1100, height: 900}, serviceWorkers: "block"});
    await ctx.route(/supabase\.co/, r => r.abort());
    await ctx.addInitScript(s => { try { if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("coursework:v2", JSON.stringify(s)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); } } catch (e) {} }, seed(tasks));
    const page = await ctx.newPage(); const errs = []; page.on("pageerror", e => errs.push(e.message));
    await page.goto(base); await page.waitForFunction(() => window.SBLMS && SBLMS.brightspace && SBLMS.st().courses.c10, null, {timeout: 40000});
    page.errs = errs; return page;
  };
  const sync = (page, h) => page.evaluate(h => { const L = SBLMS.brightspace, d = L.fromApi(h), p = L.plan(d); L.applyPlan(d, p, "grab", false); return (p.rep.wrong || []).map(w => w.title + ">" + w.to); }, h);
  const mids = page => page.evaluate(m => Object.values(SBLMS.st().tasks).filter(t => t.title === m).map(t => ({id: t.id, c: t.courseId, mark: t.mark ? t.mark.got + "/" + t.mark.outOf : "", key: t.bs && t.bs.key})), MID);
  const closeDlg = page => page.evaluate(() => { const d = document.querySelector("#dlg"); if (d && d.open) d.close(); });
  try {
    // 1. A quiz mark that's only on the quiz's Submissions page reaches the task, in its own course
    { const page = await fresh([]);
      await sync(page, H()); await closeDlg(page);
      const m = await mids(page);
      ok(m.length === 1 && m[0].c === "c10" && m[0].mark === "34/45", "the midterm lands in BSNC 1020 with its 34 / 45 from the Submissions page: " + JSON.stringify(m));
      const rel = await page.evaluate(h => { const d = SBLMS.brightspace.fromApi(h); return d.grades.filter(g => g.ou === "10").map(g => g.got + "/" + g.outOf); },
        H({gid: "55", g10: [{gid: "55", name: MID, type: 1, num: 40, den: 45, shown: "88.9 %"}]}));
      ok(JSON.stringify(rel) === JSON.stringify(["40/45"]), "a mark released in Grades wins over the Submissions page: " + JSON.stringify(rel));
      const held = await page.evaluate(h => { const d = SBLMS.brightspace.fromApi(h); return d.grades.filter(g => g.ou === "10").map(g => g.got + "/" + g.outOf + " w" + g.weight); },
        H({gid: "55", g10: [{gid: "55", name: MID, type: 1, num: null, den: 45, wnum: null, wden: 20}]}));
      ok(JSON.stringify(held) === JSON.stringify(["34/45 w20"]), "a Grades row with no mark yet takes the Submissions page's mark and keeps its weight: " + JSON.stringify(held));
      ok(!page.errs.length, "no page errors: " + page.errs.join(" | "));
      await page.context().close(); }

    // 2. Filed in the wrong course: the next sync asks, and Move puts it right (no copy made meanwhile)
    { const page = await fresh([bsTask("w1", MID, "c20", "20", {notes: "Bring student ID"})]);
      const asked = await sync(page, H());
      ok(asked.length === 1 && /c10$/.test(asked[0]), "the sync notices the midterm is in the wrong course: " + JSON.stringify(asked));
      await page.waitForSelector("dialog[open] [data-wc]", {timeout: 5000});
      const text = (await page.textContent("dialog[open]")).replace(/\s+/g, " ");
      ok(/Wrong Course\?/.test(text) && /In Practice of Nursing 1|In BSNC 1030/.test(text) && /belongs in/.test(text), "it asks whether to move it: " + text.slice(0, 220));
      ok((await mids(page)).length === 1, "no second copy is made in BSNC 1020 while it waits for an answer");
      await page.click("dialog[open] [data-submit]");
      await page.waitForFunction(() => SBLMS.st().tasks.w1 && SBLMS.st().tasks.w1.courseId === "c10", null, {timeout: 5000});
      await page.waitForTimeout(300); await closeDlg(page);
      const m = await mids(page), w1 = await page.evaluate(() => SBLMS.st().tasks.w1);
      ok(m.length === 1 && m[0].id === "w1" && m[0].c === "c10" && /^10\|/.test(m[0].key) && m[0].mark === "34/45", "Move puts it in BSNC 1020, follows the right item, and its mark comes in: " + JSON.stringify(m));
      ok(w1.notes === "Bring student ID", "the task keeps its notes");
      const again = await sync(page, H()); await closeDlg(page);
      ok(!again.length && (await mids(page)).length === 1, "the next sync is quiet and still one task: " + JSON.stringify(again));
      ok(!page.errs.length, "no page errors: " + page.errs.join(" | "));
      await page.context().close(); }

    // 3. Keep Here: left where it is, the item gets its own task, and it isn't asked again
    { const page = await fresh([bsTask("w1", MID, "c20", "20")]);
      await sync(page, H());
      await page.waitForSelector('dialog[open] [data-wc="0"][data-v="keep"]', {timeout: 5000});
      await page.click('dialog[open] [data-wc="0"][data-v="keep"]'); await page.click("dialog[open] [data-submit]");
      await page.waitForFunction(m => Object.values(SBLMS.st().tasks).filter(t => t.title === m).length === 2, MID, {timeout: 5000});
      await page.waitForTimeout(300); await closeDlg(page);
      const m = await mids(page);
      ok(m.find(x => x.id === "w1").c === "c20" && m.some(x => x.id !== "w1" && x.c === "c10"), "Keep Here leaves it, and BSNC 1020 gets its own: " + JSON.stringify(m));
      const again = await sync(page, H()); await page.waitForTimeout(300);
      ok(!again.length && !(await page.locator("dialog[open] [data-wc]").count()), "and it isn't asked again");
      await page.context().close(); }

    // 4. A name that says another course; a task you moved yourself is left alone
    { const page = await fresh([bsTask("p1", "BSNC 1020 Care Plan", "c20", "20", {type: "Assignment"}),
        bsTask("p2", "Reading Log", "c20", "20", {type: "Assignment", bs: {key: "10|readinglog", ou: "10", last: {title: "Reading Log", courseId: "c10"}, seen: {api: 1}}})]);
      const asked = await sync(page, H());
      ok(asked.some(x => /^BSNC 1020 Care Plan>c10$/.test(x)), "a task named for BSNC 1020 but filed in BSNC 1030 is asked about: " + JSON.stringify(asked));
      ok(!asked.some(x => /Reading Log/.test(x)), "a task you moved to another course yourself is not");
      await page.waitForSelector("dialog[open] [data-wc]", {timeout: 5000});
      await page.click("dialog[open] [data-submit]");
      await page.waitForFunction(() => SBLMS.st().tasks.p1.courseId === "c10", null, {timeout: 5000});
      ok(true, "Move files it under BSNC 1020");
      await page.context().close(); }

    // 5. An item merged into a task in another course (before merges stayed in one course) can be brought back
    { const page = await fresh([]);
      await sync(page, H()); await closeDlg(page);
      const key = (await mids(page))[0].key;
      await page.evaluate(([key, d]) => {
        const id = Object.values(SBLMS.st().tasks).find(t => t.bs && t.bs.key === key).id;
        SBLMS.applyChanges([{kind: "task", id, after: null}, {kind: "task", id: "k1", after: {id: "k1", created: 1, title: "Midterm Clinical Evaluation", courseId: "c20", type: "Exam", due: d, time: "08:30", status: "done", order: 1,
          bs: {key: "20|midtermclinicalevaluation", ou: "20", last: {title: "Midterm Clinical Evaluation", courseId: "c20"}, seen: {api: 1}}}}], "");
        SBLMS.brightspace.drop(key, "merge");
      }, [key, dateOf(-3)]);
      const ev = [{id: "501", title: "Midterm Clinical Evaluation", text: "", start: iso(-3), end: iso(-2.95), allDay: false, where: "", assoc: false, kind: "", url: ""}];
      const asked = await sync(page, H({ev20: ev}));
      ok(asked.some(x => x.startsWith(MID)), "the midterm merged away into BSNC 1030 is offered back: " + JSON.stringify(asked));
      await page.waitForSelector("dialog[open] [data-wc]", {timeout: 5000});
      ok(/Bring Back/.test(await page.textContent("dialog[open]")), "with Bring Back");
      await page.click("dialog[open] [data-submit]");
      await page.waitForFunction(m => Object.values(SBLMS.st().tasks).some(t => t.title === m), MID, {timeout: 5000});
      await page.waitForTimeout(300); await closeDlg(page);
      const m = await mids(page);
      ok(m.length === 1 && m[0].c === "c10" && m[0].mark === "34/45", "it's back in BSNC 1020 with its mark: " + JSON.stringify(m));
      ok(await page.evaluate(() => SBLMS.st().tasks.k1.courseId === "c20"), "the BSNC 1030 evaluation stays in BSNC 1030");
      await page.context().close(); }

    // 6. Merged within its own course: not asked, and the mark goes to the task it was merged into
    { const page = await fresh([]);
      await sync(page, H()); await closeDlg(page);
      const key = (await mids(page))[0].key;
      await page.evaluate(([key, d]) => {
        const id = Object.values(SBLMS.st().tasks).find(t => t.bs && t.bs.key === key).id;
        SBLMS.applyChanges([{kind: "task", id, after: null}, {kind: "task", id: "k2", after: {id: "k2", created: 1, title: "BSNC 1020 Midterm Exam", courseId: "c10", type: "Exam", due: d, time: "", status: "done", order: 1,
          bs: {key: "10|midtermexam", ou: "10", item: false, last: {title: "BSNC 1020 Midterm Exam", courseId: "c10"}, seen: {api: 1}}}}], "");
        SBLMS.brightspace.drop(key, "merge");
      }, [key, dateOf(-3)]);
      const asked = await sync(page, H()); await page.waitForTimeout(300);
      const k2 = await page.evaluate(() => SBLMS.st().tasks.k2);
      ok(!asked.length && k2.courseId === "c10" && k2.mark && k2.mark.got === 34, "no question, and the kept task gets the mark: " + JSON.stringify({asked, mark: k2.mark}));
      await page.context().close(); }

    // 7. Same Exam? never pairs two courses' midterms on the same day
    { const page = await fresh([bsTask("e1", "BSNC 1030 Midterm Exam", "c20", "20"), Object.assign(bsTask("e2", "BSNC 1020 Midterm Exam", "c10", "10"), {bs: undefined})]);
      await page.evaluate(() => SBLMS_DUPES(false)); await page.waitForTimeout(500);
      ok(!(await page.locator("dialog[open] .mg-row").count()), "two courses' midterms on one day aren't offered as the same exam");
      ok(!page.errs.length, "no page errors: " + page.errs.join(" | "));
      await page.context().close(); }
  } finally { await browser.close(); server.close(); }
  console.log(`\nlms-wrongcourse.e2e: ${n} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
