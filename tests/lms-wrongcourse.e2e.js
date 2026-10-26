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
  {ou: "10", code: "BSNC1020", name: "BSNC-1020-0 - Context of Nursing and Health Care 1", grades: (more && more.g10) || [], news: [], staff: [], events: [],
    folders: (more && more.folders) || [], discussions: (more && more.topics) || [],
    quizzes: [{id: "8", name: MID, due: iso(-3), start: iso(-3.1), end: null, done: true, gid: (more && more.gid) || ""}],
    marks: [{kind: "quiz", id: "8", num: 34, den: 45, from: "quizPage", how: "highest attempt"}].concat((more && more.marks) || [])}]});
const bsTask = (id, title, cid, ou, extra) => Object.assign({id, created: 1, title, courseId: cid, type: "Exam", due: dateOf(-3), time: "", status: "todo", order: 1,
  bs: {key: ou + "|" + title.toLowerCase().replace(/[^a-z0-9]/g, ""), ou, last: {title, courseId: cid}, seen: {api: 1}, item: true}}, extra || {});

(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://127.0.0.1:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  const fresh = async tasks => {
    const ctx = await browser.newContext({viewport: {width: 1100, height: 900}, serviceWorkers: "block"});
    await ctx.route(/supabase\.co/, r => r.abort());
    await ctx.addInitScript(s => { try { if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("coursework:v2", JSON.stringify(s)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", '"local"'); } } catch (e) {} }, seed(tasks));
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
      const sheet = await page.evaluate(m => SBLMS_TASK(Object.values(SBLMS.st().tasks).find(t => t.title === m)).replace(/<[^>]+>/g, " ").replace(/\s+/g, " "), MID);
      ok(/Mark 34 \/ 45 read from the quiz(&#39;|')s Submissions page/.test(sheet) && /isn't on Brightspace's Grades page yet/.test(sheet), "the task says where its mark came from: " + sheet.slice(0, 160));
      await sync(page, H({gid: "55", g10: [{gid: "55", name: MID, type: 1, num: 36, den: 45, shown: "80 %"}]})); await closeDlg(page);
      const later = await page.evaluate(m => Object.values(SBLMS.st().tasks).filter(t => t.title === m).map(t => t.mark), MID);
      ok(later.length === 1 && later[0].got === 36 && !later[0].from, "once Grades has the mark, it takes over: " + JSON.stringify(later));
      ok(!page.errs.length, "no page errors: " + page.errs.join(" | "));
      await page.context().close(); }

    // 1b. Assignments and discussions too; a source switched off in app_flags is ignored
    { const page = await fresh([]);
      const more = {folders: [{id: "22", name: "Care Plan", due: iso(-4), end: null, sub: true, gid: "32", outOf: 20, files: []}],
        topics: [{id: "41", name: "Week 6 Discussion", due: iso(-3), start: null, text: "", gid: "", outOf: 4, posted: true}],
        marks: [{kind: "folder", id: "22", num: 18, den: 20, from: "assignmentsPage"}, {kind: "folder", id: "22", num: 17, den: 20, from: "assignmentFeedback"}, {kind: "topic", id: "41", num: 3.5, den: 4, from: "discussionPage"}]};
      await sync(page, H(more)); await closeDlg(page);
      const got = await page.evaluate(() => Object.fromEntries(Object.values(SBLMS.st().tasks).filter(t => t.mark).map(t => [t.title, t.mark.got + "/" + t.mark.outOf + " " + (t.mark.from || "")])));
      ok(got["Care Plan"] === "17/20 assignmentFeedback" && got["Week 6 Discussion"] === "3.5/4 discussionPage", "assignment and discussion marks come in, the feedback's ahead of the Assignments page's: " + JSON.stringify(got));
      const off = await page.evaluate(h => { localStorage.setItem("studyboard:appFlags", JSON.stringify({at: Date.now(), v: {marks_discussion_page: false}})); return true; }, null);
      await page.reload(); await page.waitForFunction(() => window.SBLMS && SBLMS.brightspace, null, {timeout: 40000});
      const d = await page.evaluate(h => SBLMS.brightspace.fromApi(h).grades.filter(g => g.from).map(g => g.name + " " + g.from), H(more));
      ok(off && !d.some(x => /discussionPage/.test(x)) && d.some(x => /quizPage/.test(x)), "a source switched off in app_flags isn't used: " + JSON.stringify(d));
      ok(!page.errs.length, "no page errors: " + page.errs.join(" | "));
      await page.context().close(); }

    // 1c. A discussion with no due date of its own ticks off its content-list entry when you've posted
    { const page = await fresh([]);
      const r = await page.evaluate(h => { h.items = [{ou: "10", id: "77", name: "Introductions Discussion", type: 1, act: 5, url: "/d2l/le/content/10/viewContent/77/View", due: new Date(Date.now() - 864e5).toISOString(), done: null, exempt: false}];
        h.courses[1].discussions = [{id: "200", name: "Introductions Discussion", due: null, start: null, text: "", gid: "", outOf: null, posted: true}];
        const d = SBLMS.brightspace.fromApi(h); return d.recs.filter(x => /Introductions/.test(x.title)).map(x => [x.title, x.done, x.pid]); }, H());
      ok(r.length === 1 && r[0][1] === true && r[0][2] === "d200", "the posted topic ticks off its entry: " + JSON.stringify(r));
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

    // 8. Dates: the exam is on its calendar day (Friday), never the day of the read; a grade with no day stays undated
    { const page = await fresh([]);
      const fri = new Date(Date.now() - 3 * DAY); fri.setHours(8, 30, 0, 0); const friDay = dateOf(-3);
      const noDates = (events, extra) => { const h = H(); const c = h.courses[1];
        c.quizzes = [{id: "8", name: MID, due: null, start: null, end: null, done: true, gid: "", at: null}]; c.events = events; Object.assign(c, extra || {}); return h; };
      const tied = [{id: "e8", title: "BSNC 1020 Midterm Exam", text: "", start: fri.toISOString(), end: new Date(fri.getTime() + 2 * 36e5).toISOString(), allDay: false, where: "", assoc: true, kind: "D2L.LE.Quizzing.Quiz", eid: "8", url: ""}];
      const untied = [Object.assign({}, tied[0], {assoc: false, kind: "", eid: "", allDay: true, start: friDay + "T07:00:00.000Z", end: dateOf(-2) + "T07:00:00.000Z"})];
      for (const [how, evs] of [["tied to the quiz", tied], ["a plain calendar entry", untied]]) {
        const r = await page.evaluate(h => { const d = SBLMS.brightspace.fromApi(h); return d.recs.filter(x => x.pid === "q8").map(x => x.due); }, noDates(evs));
        ok(r.length === 1 && r[0] === friDay, `the midterm with no dates of its own is on Friday, from ${how}: ` + JSON.stringify(r));
      }
      await page.evaluate(h => { const L = SBLMS.brightspace, d = L.fromApi(h); L.applyPlan(d, L.plan(d), "grab", true); }, noDates(tied)); await closeDlg(page);
      const t = await page.evaluate(m => { const t = Object.values(SBLMS.st().tasks).find(x => x.title === m); return {due: t.due, mark: t.mark && t.mark.got, doneAt: t.doneAt}; }, MID);
      ok(t.due === friDay && t.mark === 34 && t.doneAt < Date.now() - DAY, "the task: Friday, 34 / 45, finished then and not today: " + JSON.stringify(t));
      await page.context().close(); }
    { const page = await fresh([{id: "old", created: Date.now() - 36e5, title: MID, courseId: "c10", type: "Exam", due: dateOf(0), time: "", status: "done", doneAt: Date.now() - 36e5, order: 1,
        mark: {got: 34, outOf: 45, src: "bs", from: "quizPage"}, bs: {key: "10|midtermexamrequiresresponduslockdownbrowser", ou: "10", gid: "q8", last: {title: MID, courseId: "c10"}, seen: {api: Date.now() - 36e5}, doneSeen: true, ss: "done", fromGrade: true, madeAt: Date.now() - 36e5}}]);
      const none = await page.evaluate(h => { const c = h.courses[1]; c.quizzes = [{id: "9", name: "Pop Quiz", due: null, start: null, end: null, done: true, gid: ""}]; c.marks = [{kind: "quiz", id: "9", num: 3, den: 5, from: "quizPage"}];
        const L = SBLMS.brightspace, d = L.fromApi(h); L.applyPlan(d, L.plan(d), "grab", true); const t = Object.values(SBLMS.st().tasks).find(x => x.title === "Pop Quiz"); return t && [t.due, t.mark && t.mark.got]; }, H());
      ok(none && none[0] === "" && none[1] === 3, "a mark with nothing to date it is kept, undated rather than today: " + JSON.stringify(none));
      await closeDlg(page);
      const fixed = await page.evaluate(([h, fri]) => { const c = h.courses[1]; c.quizzes = [{id: "8", name: h.courses[1].quizzes[0].name, due: null, start: null, end: null, done: true, gid: ""}];
        c.events = [{id: "e8", title: "BSNC 1020 Midterm Exam", text: "", start: fri + "T07:00:00.000Z", end: fri + "T09:00:00.000Z", allDay: true, where: "", assoc: true, kind: "D2L.LE.Quizzing.Quiz", eid: "8", url: ""}];
        const L = SBLMS.brightspace, d = L.fromApi(h); L.applyPlan(d, L.plan(d), "grab", true); return Object.values(SBLMS.st().tasks).filter(t => t.title === h.courses[1].quizzes[0].name).map(t => [t.id, t.due, t.doneAt < Date.now() - 864e5]); }, [H(), dateOf(-3)]);
      ok(fixed.length === 1 && fixed[0][1] === dateOf(-3) && fixed[0][2], "an exam an earlier read dated today moves to Friday, finished then: " + JSON.stringify(fixed));
      await page.context().close(); }

    // 9. The Grades tab lists a mark with no weight, and the syllabus's "Midterm Exam" weight reaches the quiz
    { const page = await fresh([]);
      await sync(page, H()); await closeDlg(page);
      const gradesTab = async () => {
        await page.click('nav.tabs [data-tab="courses"]'); await page.waitForTimeout(150);
        await page.evaluate(() => { const b = document.querySelector('[data-act="cf-view"][data-id="courses"]'); if (b) b.click(); });
        await page.click('.course-card[data-act="open-course"][data-id="c10"]'); await page.waitForTimeout(150);
        await page.click('[data-act="course-tab"][data-id="grades"]'); await page.waitForTimeout(250);
        return (await page.textContent("#view")).replace(/\s+/g, " ");
      };
      const tab = await gradesTab();
      ok(/Marked, No Weight Yet 1/.test(tab) && /Midterm Exam- Requires Respondus LockDown Browser/.test(tab) && /75\.6%/.test(tab), "the Grades tab lists the midterm's mark though it has no weight yet: " + tab.slice(0, 300));
      const syl = "Course Evaluation\nMidterm Exam 30%\nFinal Exam 40%\nAssignments 30%\nThe minimum passing grade is 65%.";
      const w = await page.evaluate(([h, syl]) => { h.courses[1].syl = [syl]; const L = SBLMS.brightspace, d = L.fromApi(h); L.applyPlan(d, L.plan(d), "grab", true); return Object.values(SBLMS.st().tasks).filter(t => t.courseId === "c10").map(t => [t.title, t.weight]); }, [H(), syl]);
      ok(w.some(([t, x]) => t === MID && Number(x) === 30), "the syllabus's Midterm Exam 30% goes on the quiz: " + JSON.stringify(w));
      await closeDlg(page); const tab2 = await gradesTab();
      ok(/Where You Stand/.test(tab2) && !/No Weight Yet/.test(tab2), "with its weight it counts in the course grade: " + tab2.slice(0, 200));
      // later the mark is posted to Brightspace's Grades page, with the course's own weight: that mark and weight take over
      const later = await page.evaluate(([h, syl, m]) => { h.courses[1].syl = [syl]; h.courses[1].quizzes[0].gid = "55";
        h.courses[1].grades = [{gid: "55", name: m, type: 1, num: 36, den: 45, wnum: 20, wden: 25, shown: "80 %"}];
        const L = SBLMS.brightspace, d = L.fromApi(h); L.applyPlan(d, L.plan(d), "grab", true); const t = Object.values(SBLMS.st().tasks).find(x => x.title === m); return {w: t.weight, got: t.mark.got, from: t.mark.from || "grades"}; }, [H(), syl, MID]);
      ok(later.w === 25 && later.got === 36 && later.from === "grades", "once on the Grades page: its mark (36 / 45) and Brightspace's weight (25%) replace the syllabus's: " + JSON.stringify(later));
      await page.context().close(); }

    // 10. Discussions: the course's "Module 6 Discussion post" entry is the topic "Module 6 Discussion"; a group topic your group posted in
    { const page = await fresh([]);
      const r = await page.evaluate(h => { const c = h.courses[1], due = new Date(Date.now() - 864e5).toISOString();
        h.items = [{ou: "10", id: "61", name: "Module 6 Discussion post", type: 1, act: 1, url: "/d2l/le/content/10/viewContent/61/View", due, done: null, exempt: false},
                   {ou: "10", id: "62", name: "Module 5 group Discussion (NCLEX Questions activity) PART A", type: 1, act: 1, url: "/d2l/le/content/10/viewContent/62/View", due, done: null, exempt: false},
                   {ou: "10", id: "63", name: "Module 5 Discussion post", type: 1, act: 1, url: "/d2l/le/content/10/viewContent/63/View", due, done: null, exempt: false},
                   {ou: "10", id: "308", name: "Week 8 Reflection Activity", type: 1, act: 6, url: "/d2l/le/content/10/viewContent/88/View", due, done: null, exempt: false}];
        c.discussions = [{id: "306", name: "Module 6 Discussion", due: null, start: null, text: "", gid: "", outOf: null, posted: true, at: new Date(Date.now() - 2 * 864e5).toISOString()},
          {id: "305", name: "Module 5 group Discussion (NCLEX Questions activity) PART A", due: null, start: null, text: "", gid: "", outOf: null, posted: false, group: true, groupPosted: true},
          {id: "304", name: "Module 4 Discussion", due: null, start: null, text: "", gid: "", outOf: null, posted: true},
          {id: "308", name: "Professionalism in Practice", due: null, start: null, text: "", gid: "", outOf: null, posted: true}];
        const d = SBLMS.brightspace.fromApi(h); return Object.fromEntries(d.recs.filter(x => /Module|Week 8/.test(x.title)).map(x => [x.title, [x.done, x.doneAt ? x.doneAt.slice(0, 10) : ""]])); }, H());
      ok(r["Module 6 Discussion post"] && r["Module 6 Discussion post"][0] === true && r["Module 6 Discussion post"][1] === dateOf(-2), "Module 6 Discussion post is done, from the topic, when you posted: " + JSON.stringify(r));
      ok(r["Module 5 group Discussion (NCLEX Questions activity) PART A"][0] === true, "the group topic your group posted in is done");
      ok(!r["Module 5 Discussion post"][0], "Module 5's entry isn't ticked by Module 4's or 6's topic");
      ok(r["Week 8 Reflection Activity"] && r["Week 8 Reflection Activity"][0] === true, "a content entry for a discussion topic, named differently, follows that topic by its id: " + JSON.stringify(r["Week 8 Reflection Activity"]));
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
