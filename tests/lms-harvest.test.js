// The school-platform sync as it really runs
const path = require("path"), assert = require("assert"), vm = require("vm"), Module = require("module");

const realLoad = Module._load;
Module._load = function (req, ...rest) {
  if (req === "electron") return { app: { isPackaged: true, userAgentFallback: "" }, BrowserWindow: function () {}, ipcMain: { handle() {} }, net: {}, session: {} };
  return realLoad.call(this, req, ...rest);
};
const L = require(path.join(__dirname, "..", "lms.js"));
Module._load = realLoad;

let n = 0, fail = 0;
const t = async (name, fn) => { n++; try { await fn(); } catch (e) { fail++; console.log("FAIL", name, "\n  ", String(e && e.stack || e).split("\n").slice(0, 5).join("\n   ")); } };

const DAY = 864e5, iso = d => new Date(Date.now() + d * DAY).toISOString();
const SAFE = { pastDays: 60, aheadDays: 240, grades: true, news: true, only: null, skip: [] };

// A tiny fetch: routes are [regex on path+query, body or function, extra headers]
function fakeFetch(routes, seen) {
  return async (url, opts) => {
    const p = String(url);
    seen.push(p);
    assert(!opts || !opts.method || opts.method === "GET", "only GET requests: " + p);
    for (const [re, body, headers] of routes) {
      if (!re.test(p)) continue;
      const b = typeof body === "function" ? body(p) : body;
      const text = typeof b === "string" ? b : JSON.stringify(b);
      const h = Object.assign({ "content-type": "application/json" }, headers || {});
      return { ok: true, status: 200, headers: { get: k => h[String(k).toLowerCase()] || null }, json: async () => JSON.parse(text), text: async () => text };
    }
    return { ok: false, status: 404, headers: { get: () => null }, json: async () => ({}), text: async () => "" };
  };
}
// Runs the injected script the way Electron would
async function runInjected(id, origin, routes, safe) {
  const seen = [];
  const ctx = vm.createContext({ fetch: fakeFetch(routes, seen), AbortController, setTimeout, clearTimeout, location: { origin }, console });
  const script = L.harvestScript(L.P[id], safe || SAFE);
  assert(typeof script === "string" && script.includes("function htmlText"), "the injected script carries htmlText");
  const out = await vm.runInContext(script, ctx, { filename: id + "-injected.js" });
  return { out, seen };
}

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
  [/\/calendar\/events\/myEvents\//, { Objects: [{ CalendarEventId: 12, OrgUnitId: 999, Title: "CHEM 1020 Midterm Exam", StartDateTime: iso(4), EndDateTime: iso(4.05), IsAllDayEvent: true }, { CalendarEventId: 11, OrgUnitId: 101, Title: "Lecture", Description: "<p>Room&nbsp;5</p>", StartDateTime: iso(1), EndDateTime: iso(1.05), IsAllDayEvent: false, LocationName: "B-5", CalendarEventViewUrl: "/d2l/le/calendar/101/event/11/detailsview" }], Next: null }],
  [/\/content\/myItems\/completions\//, { Objects: [], Next: null }],
  [/\/content\/myItems\//, { Objects: [{ OrgUnitId: 101, ItemId: 1, ItemName: "Read chapter 1", ItemType: 3, ActivityType: 1, ItemUrl: "/d2l/le/content/101/viewContent/1/View", DueDate: iso(3) }], Next: null }]
];
const CV = [
  [/^\/api\/v1\/users\/self$/, { id: 9, name: "Ana Lee" }],
  [/^\/api\/v1\/courses\?enrollment_state=active/, [{ id: 201, name: "History 200", course_code: "HIS200", start_at: iso(-30), end_at: iso(60), apply_assignment_group_weights: true,
    enrollments: [{ computed_current_score: 91.5, computed_current_grade: "A-" }] }]],
  [/^\/api\/v1\/courses\/201\/assignments\?/, [{ id: 1, name: "Essay", due_at: iso(4), published: true, points_possible: 20, assignment_group_id: 3, html_url: "https://x.instructure.com/courses/201/assignments/1",
    description: '<p>Write 1500 words. See <a href="/courses/201/files/77/download">Rubric &amp; guide</a>.</p><ul><li>MLA</li></ul>', submission_types: ["online_upload"], submission: { workflow_state: "unsubmitted" } },
    { id: 2, name: "Quiz 2", due_at: iso(6), published: true, points_possible: 10, assignment_group_id: 3, quiz_id: 55, is_quiz_assignment: true, description: "<p>Timed</p>", submission_types: ["online_quiz"], submission: { workflow_state: "graded", score: 9, grade: "9", graded_at: iso(-1) } }]],
  [/^\/api\/v1\/courses\/201\/assignment_groups/, [{ id: 3, group_weight: 40 }]],
  [/^\/api\/v1\/calendar_events\?/, [{ id: 31, title: "Seminar", description: "<p>Bring&nbsp;notes</p>", start_at: iso(2), end_at: iso(2.05), location_name: "Hall", html_url: "https://x.instructure.com/calendar?event_id=31" }]],
  [/^\/api\/v1\/courses\/201\/quizzes\?/, [{ id: 55, quiz_type: "assignment", time_limit: 30, one_question_at_a_time: true }]],
  [/^\/api\/v1\/announcements\?/, "while(1);" + JSON.stringify([{ id: 41, context_code: "course_201", title: "Room change", message: "<p>We meet in <strong>Room 12</strong> &amp; online</p>", posted_at: iso(-1), html_url: "https://x.instructure.com/courses/201/discussion_topics/41" }])],
  [/^\/api\/v1\/planner\/items\?/, [{ course_id: 201, plannable_type: "discussion_topic", plannable_id: 66, plannable: { title: "Week 3 discussion", todo_date: iso(7) }, html_url: "/courses/201/discussion_topics/66" }]]
];
const BB = [
  [/^\/learn\/api\/public\/v1\/users\/me$/, { id: "_5_1", name: { given: "Ana", family: "Lee" } }],
  [/^\/learn\/api\/public\/v1\/users\/_5_1\/courses\?/, { results: [{ course: { id: "_301_1", courseId: "CHEM110", name: "Chemistry 110", externalAccessUrl: "https://bb.example.edu/ultra/courses/_301_1/outline" }, lastAccessed: iso(-2) }], paging: {} }],
  [/^\/learn\/api\/public\/v1\/calendars\/items\?/, { results: [{ id: "c1", calendarId: "_301_1", type: "GradebookColumn", title: "Lab report", end: iso(8), itemSourceId: "_9_1", description: "<p>Due &lt;Friday&gt; &amp; on paper</p>" },
    { id: "c2", calendarId: "_301_1", type: "Course", title: "Lab session", start: iso(1), end: iso(1.1), description: "<p>Wear&nbsp;goggles</p>", location: "Lab 2" }] }],
  [/^\/learn\/api\/public\/v2\/courses\/_301_1\/gradebook\/columns\?/, { results: [{ id: "_8_1", name: "Midterm exam", grading: { due: iso(10), type: "Attempts" }, score: { possible: 50 }, description: "<p>Bring a <strong>pencil</strong></p>" }] }],
  [/^\/learn\/api\/public\/v2\/courses\/_301_1\/gradebook\/users\/_5_1$/, { results: [{ columnId: "_8_1", score: 40, status: "Graded", displayGrade: { text: "40/50" }, modified: iso(-1) }] }],
  [/^\/learn\/api\/public\/v1\/courses\/_301_1\/announcements\?/, { results: [{ id: "_a1", title: "Hi", body: "<p>Welcome &amp; hello</p>", created: iso(-1) }] }]
];

(async () => {
  await t("the bare harvest (without the prelude) really fails in a page: this test would catch the bug", async () => {
    const ctx = vm.createContext({ fetch: fakeFetch(BS, []), AbortController, setTimeout, clearTimeout, location: { origin: "https://learn.example.edu" } });
    await assert.rejects(vm.runInContext(`(${L.bsHarvest.toString()})(${JSON.stringify(SAFE)})`, ctx), e => e && e.name === "ReferenceError" && /htmlText/.test(e.message));
  });

  await t("Brightspace: a quiz you sat counts as done, from its attempts or the Quizzes page, even with only an opening date", async () => {
    const page = `<table><tr><th>EXAMS</th><th>Evaluation Status</th><th>Attempts</th></tr>
      <tr><td><a href="/d2l/lms/quizzing/user/quiz_summary.d2l?qi=8&amp;ou=101">BSNC 1000 Midterm Exam- Requires Respondus LockDown Browser</a><br>Available on 10/6/2026 5:00 AM</td><td></td><td>1 / 1</td></tr>
      <tr><td><a href="/d2l/lms/quizzing/user/quiz_summary.d2l?qi=7&amp;ou=101">Quiz 1</a><br>Available on 10/6/2026 5:00 AM until 11/29/2026 8:00 AM</td><td></td><td>0 / 1</td></tr></table>`;
    const routes = BS.filter(([re]) => !/quizzes\\\/\$/.test(re.source)).concat([
      [/^\/d2l\/api\/le\/1\.70\/101\/quizzes\/$/, { Objects: [{ QuizId: 7, Name: "Quiz 1", DueDate: iso(9), IsActive: true }, { QuizId: 8, Name: "BSNC 1000 Midterm Exam- Requires Respondus LockDown Browser", StartDate: iso(-10), IsActive: true },
        { QuizId: 9, Name: "Practice Quiz", StartDate: iso(-10), IsActive: true }, { QuizId: 10, Name: "Unit Test", StartDate: iso(-3), IsActive: true },
        { QuizId: 11, Name: "Lab Quiz", StartDate: iso(-3), IsActive: true }], Next: null }],
      [/quiz_summary\.d2l\?qi=10&/, "<h2>Attempts</h2><p>Allowed - 1, Completed - 1</p>", { "content-type": "text/html" }],
      [/quiz_summary\.d2l\?qi=11&/, "<p>Allowed - 2, Completed - 0</p>", { "content-type": "text/html" }],
      [/quiz_submissions\.d2l\?qi=11&/, "<table><tr><td>Attempt 1</td><td>Pending Evaluation</td></tr></table>", { "content-type": "text/html" }],
      [/quiz_summary\.d2l\?qi=7&/, "<p>Completed: 10/6/2026 5:00 AM</p>", { "content-type": "text/html" }],
      [/\/quizzes\/9\/attempts\/$/, [{ AttemptId: 4, AttemptNumber: 1 }]],
      [/quizzes_list\.d2l\?ou=101/, page, { "content-type": "text/html" }]]);
    const { out } = await runInjected("brightspace", "https://learn.example.edu", routes);
    const q = id => out.courses[0].quizzes.find(x => x.id === id);
    assert.strictEqual(q("8").done, true, "the Quizzes page's 1 / 1 (and not the date 10/6) says the midterm was sat");
    assert.notStrictEqual(q("7").done, true, "0 / 1 is not done, though its row has dates like 10/6/2026");
    assert.strictEqual(q("9").done, true, "an attempt pending evaluation counts");
    assert.strictEqual(q("10").done, true, "the quiz's own summary page: Completed - 1");
    assert.strictEqual(q("11").done, true, "the quiz's Submissions page: Attempt 1, Pending Evaluation");
    assert.notStrictEqual(q("7").done, true, "a date after Completed isn't a count");
    assert(/2 of 3 sat from their own pages/.test(out.courses[0].quizNote), out.courses[0].quizNote);
  });

  await t("Brightspace: a quiz's mark that's only on its Submissions page is read, and Grades wins when it has one", async () => {
    const subm = `<h1>Quiz Submissions - Midterm Exam- Requires Respondus LockDown Browser</h1><table><tr><th>Individual Attempts</th><th>Grade</th></tr>
      <tr><td>Attempt 1</td><td>34 / 45 - 75.56 %</td></tr><tr><td><b>Overall Grade</b> (highest attempt):</td><td>34 / 45 - 75.56 %</td></tr></table>
      <p>To view your results you must use the Respondus LockDown Browser</p>`;
    const routes = BS.filter(([re]) => !/quizzes\\\/\$/.test(re.source)).concat([
      [/^\/d2l\/api\/le\/1\.70\/101\/quizzes\/$/, { Objects: [{ QuizId: 8, Name: "Midterm Exam- Requires Respondus LockDown Browser", StartDate: iso(-5), DueDate: iso(-3), IsActive: true },
        { QuizId: 7, Name: "Quiz 1", DueDate: iso(-2), IsActive: true, GradeItemId: 9 }, { QuizId: 6, Name: "Quiz 0", DueDate: iso(-2), IsActive: true }], Next: null }],
      [/\/quizzes\/(8|7|6)\/attempts\/$/, [{ AttemptId: 4, AttemptNumber: 1 }]],
      [/quiz_submissions\.d2l\?qi=8&/, subm, { "content-type": "text/html" }],
      [/quiz_submissions\.d2l\?qi=7&/, "<tr><td>Attempt 1</td><td>1 / 10</td></tr>", { "content-type": "text/html" }],
      [/quiz_submissions\.d2l\?qi=6&/, "<tr><td>Attempt 1</td><td>4 / 10</td></tr><tr><td>Attempt 2</td><td>7 / 10</td></tr><tr><td>Attempt 3</td><td>Pending Evaluation</td></tr>", { "content-type": "text/html" }]]);
    const { out, seen } = await runInjected("brightspace", "https://learn.example.edu", routes);
    const q = id => { const m = out.courses[0].marks.find(x => x.kind === "quiz" && x.id === id); return m ? Object.assign({}, m) : null; };
    assert.deepStrictEqual(q("8"), { kind: "quiz", id: "8", num: 34, den: 45, from: "quizPage", how: "highest attempt" }, "the Overall Grade line");
    assert.strictEqual(q("7"), null, "Quiz 1's mark is in Grades (8 / 10), so its page isn't read for one");
    assert(!seen.some(u => /quiz_submissions\.d2l\?qi=7&/.test(u)), "and isn't fetched");
    assert.deepStrictEqual(q("6"), { kind: "quiz", id: "6", num: 7, den: 10, from: "quizPage", how: "highest attempt" }, "no Overall Grade line: the best attempt");
    assert(/quiz Submissions pages 2 of 2/.test(out.courses[0].markNote), out.courses[0].markNote);
    const off = await runInjected("brightspace", "https://learn.example.edu", routes, Object.assign({}, SAFE, { marks: { quizPage: false } }));
    assert(!off.out.courses[0].marks.length && !off.seen.some(u => /quiz_submissions\.d2l\?qi=8&/.test(u)), "switched off, the Submissions pages aren't read");
  });

  await t("Brightspace: the midterm's mark is found even when the quiz list API refuses, or nothing says it was sat", async () => {
    const list = `<table><tr><th>Current Quizzes</th><th>Evaluation Status</th><th>Attempts</th></tr>
      <tr><td><a class="d2l-link" href="/d2l/lms/quizzing/user/quiz_summary.d2l?qi=1234&amp;ou=101" title="Midterm Exam- Requires Respondus LockDown Browser">Midterm Exam- Requires Respondus LockDown Browser</a></td><td>Feedback: On Attempt</td><td>1 / 1</td></tr>
      <tr><td><a href="/d2l/lms/quizzing/user/quiz_summary.d2l?qi=1235&amp;ou=101">Final Exam</a><div>Available on Dec 10, 2026 8:00 AM</div></td><td></td><td>0 / 1</td></tr></table>`;
    const subm = `<table class="d2l-table"><tr><th>Individual Attempts</th><th>Grade</th></tr><tr><td><a href="quiz_submissions_attempt.d2l?qi=1234&amp;ai=9">Attempt 1</a></td><td><label>34 / 45</label> - <label>75.56 %</label></td></tr>
      <tr><td><strong>Overall Grade</strong> (highest attempt):</td><td>34&nbsp;/&nbsp;45&nbsp;-&nbsp;75.56&nbsp;%</td></tr></table><p>To view your results you must use the Respondus LockDown Browser</p>`;
    const routes = BS.filter(([re]) => !/quizzes\\\/\$/.test(re.source)).concat([
      [/^\/d2l\/api\/le\/1\.70\/101\/quizzes\/$/, {}, 403],
      [/quizzes_list\.d2l\?ou=101/, list, { "content-type": "text/html" }],
      [/quiz_submissions\.d2l\?qi=1234&/, subm, { "content-type": "text/html" }]]);
    const r403 = routes.map(x => x[2] === 403 ? [x[0], () => { throw Object.assign(new Error("denied"), { status: 403 }); }] : x);
    const { out } = await runInjected("brightspace", "https://learn.example.edu", r403);
    const c = out.courses[0], q = c.quizzes.find(x => x.id === "1234");
    assert(q && q.name === "Midterm Exam- Requires Respondus LockDown Browser" && q.done === true, "the midterm comes from the Quizzes page, sat: " + JSON.stringify(c.quizzes));
    assert(!c.quizzes.some(x => x.id === "1235" && x.done === true), "the Final Exam (0 / 1) isn't sat");
    const m = c.marks.find(x => x.id === "1234");
    assert(m && m.num === 34 && m.den === 45 && m.from === "quizPage", "and its mark from the Submissions page: " + JSON.stringify(c.marks));
    assert(/2 only on the Quizzes page/.test(c.quizNote), c.quizNote);
    // the API lists it, but nothing says it was sat (attempts refused, no Quizzes page): its Submissions page says both
    const r2 = BS.filter(([re]) => !/quizzes\\\/\$/.test(re.source)).concat([
      [/^\/d2l\/api\/le\/1\.70\/101\/quizzes\/$/, { Objects: [{ QuizId: 1234, Name: "Midterm Exam- Requires Respondus LockDown Browser", StartDate: iso(-4), IsActive: true }], Next: null }],
      [/quiz_submissions\.d2l\?qi=1234&/, subm, { "content-type": "text/html" }]]);
    const two = await runInjected("brightspace", "https://learn.example.edu", r2);
    const c2 = two.out.courses[0];
    assert(c2.quizzes[0].done === true && c2.marks.some(x => x.id === "1234" && x.num === 34), "read from its Submissions page, it's sat and marked: " + JSON.stringify([c2.quizzes[0], c2.marks, c2.quizNote]));
  });

  await t("Brightspace: yesterday's discussion post is seen even with many older topics, a busy topic, or no due date", async () => {
    const topics = [];
    for (let i = 1; i <= 26; i++) topics.push({ TopicId: 100 + i, Name: "Week " + i + " Discussion", DueDate: iso(-27 + i), IsHidden: false });
    topics.push({ TopicId: 200, Name: "Introductions", IsHidden: false });
    const others = n => Array.from({ length: n }, (_, i) => ({ PostId: i, PostingUserId: 7000 + i }));
    const routes = BS.concat([
      [/^\/d2l\/api\/le\/1\.70\/101\/discussions\/forums\/$/, [{ ForumId: 1, Name: "Weekly Discussions", IsHidden: false }]],
      [/\/discussions\/forums\/1\/topics\/$/, topics],
      // Week 26 (due yesterday): 230 classmates' posts first, yours on page 2
      [/\/topics\/126\/posts\/\?pageSize=200&pageNumber=1$/, others(200)],
      [/\/topics\/126\/posts\/\?pageSize=200&pageNumber=2$/, others(30).concat([{ PostId: 999, PostingUserId: 42 }])],
      [/\/topics\/125\/posts\//, others(12)],
      [/\/topics\/200\/posts\//, [{ PostId: 5, PostingUserId: 42 }]],
      [/\/topics\/\d+\/posts\//, []]]);
    const { out } = await runInjected("brightspace", "https://learn.example.edu", routes);
    const d = id => out.courses[0].discussions.find(x => x.id === String(id));
    assert(d(126) && d(126).posted === true, "yesterday's topic, the last of 26 and with your post on the second page, is posted: " + JSON.stringify(d(126)));
    assert(d(125) && d(125).posted === false, "the one before it, with no post of yours, isn't");
    assert(d(200) && d(200).posted === true && d(200).due === null, "a topic with no due date is read too");
    assert(/discussions: \d+ posted/.test(out.courses[0].topicNote), out.courses[0].topicNote);
  });

  await t("Brightspace: your post is found by your name, or on the topic's page when the posts list is refused", async () => {
    const routes = BS.concat([
      [/^\/d2l\/api\/le\/1\.70\/101\/discussions\/forums\/$/, [{ ForumId: 1, Name: "Module Discussions", IsHidden: false }]],
      [/\/discussions\/forums\/1\/topics\/$/, [{ TopicId: 306, Name: "Module 6 Discussion", DueDate: iso(-1), IsHidden: false },
        { TopicId: 307, Name: "Module 7 Discussion", DueDate: iso(-1), IsHidden: false }, { TopicId: 305, Name: "Module 5 group Discussion PART A", DueDate: iso(-6), IsHidden: false }]],
      [/\/topics\/307\/posts\//, [{ PostId: 1, PostingUserId: "u-42-x", PostingUserDisplayName: "Ana Lee", DatePosted: iso(-1.5) }]],
      [/\/topics\/305\/posts\//, [{ PostId: 2, PostingUserId: 77, PostingUserDisplayName: "Joori Yum" }]],
      [/\/d2l\/le\/101\/discussions\/topics\/306\/View/, "<div><a>Professionalism</a></div><div>Ana Lee posted Oct 25, 2026 11:34 AM \u2022 275 Words</div><div>Last post yesterday at 10:41 PM by Joori Yum</div><header>Ana Lee</header>", { "content-type": "text/html" }]]);
    const { out } = await runInjected("brightspace", "https://learn.example.edu", routes);
    const d = id => out.courses[0].discussions.find(x => x.id === String(id));
    assert(d(306).posted === true && /^2026-10-25/.test(d(306).at || ""), "posts list refused: the topic's page says Ana Lee posted Oct 25: " + JSON.stringify(d(306)));
    assert(d(307).posted === true, "a post whose id is in another form is yours by name");
    assert(d(305).posted === false && d(305).groupPosted === true, "a group topic with a group member's post: your group posted");
    assert(/from the topic's page/.test(out.courses[0].topicNote), out.courses[0].topicNote);
  });

  await t("Brightspace: assignment and discussion marks that aren't in Grades: feedback, the Assignments page, the topic's page", async () => {
    const F = (Id, Name, GradeItemId, den) => ({ Id, Name, DueDate: iso(-4), IsHidden: false, GradeItemId, Assessment: { ScoreDenominator: den }, Attachments: [] });
    const list = `<table><tr><th>Assignment</th><th>Completion Status</th><th>Score</th><th>Evaluation Status</th><th>Due Date</th></tr>
      <tr><td><a href="folder_submit_files.d2l?db=22&amp;ou=101">Care Plan</a></td><td>1 Submission, 1 File</td><td>18 / 20 - 90 %</td><td>Feedback: Unread</td><td>Oct 20, 2026 11:59 PM</td></tr>
      <tr><td><a href="folder_submit_files.d2l?db=23&amp;ou=101">Reflection 2</a></td><td>1 Submission, 1 File</td><td>-</td><td></td><td>Oct 21, 2026 11:59 PM</td></tr>
      <tr><td><a href="folder_submit_files.d2l?db=24&amp;ou=101">Journal</a></td><td>1 Submission, 1 File</td><td></td><td></td><td>10/21/2026</td></tr></table>`;
    const routes = BS.filter(([re]) => !/dropbox\\\/folders\\\/\$/.test(re.source)).concat([
      [/^\/d2l\/api\/le\/1\.70\/101\/dropbox\/folders\/$/, [F(21, "Lab 2", 31, 10), F(22, "Care Plan", 32, 20), F(23, "Reflection 2", 33, 5), F(24, "Journal", 34, 10), F(25, "Lab 0 Redo", 9, 10)]],
      [/\/dropbox\/folders\/21\/submissions\/mysubmissions\/$/, [{ Submissions: [{ SubmissionDate: iso(-5) }], Feedback: { Score: 9, Feedback: { Text: "Nice" } } }]],
      [/\/dropbox\/folders\/(22|23|24|25)\/submissions\/mysubmissions\/$/, [{ Submissions: [{ SubmissionDate: iso(-5) }] }]],
      [/folders_list\.d2l\?ou=101/, list, { "content-type": "text/html" }],
      [/^\/d2l\/api\/le\/1\.70\/101\/discussions\/forums\/$/, [{ ForumId: 1, Name: "Weekly", IsHidden: false }]],
      [/\/discussions\/forums\/1\/topics\/$/, [{ TopicId: 41, Name: "Week 6 Discussion", DueDate: iso(-3), IsHidden: false, ScoreOutOf: 4, GradeItemId: 51 },
        { TopicId: 42, Name: "Week 7 Discussion", DueDate: iso(-2), IsHidden: false, ScoreOutOf: 4 }]],
      [/\/discussions\/forums\/1\/topics\/(41|42)\/posts\/$/, [{ PostingUserId: 42, Message: { Text: "I'd rate this 3/4" } }]],
      [/\/d2l\/le\/101\/discussions\/topics\/41\/View/, "<div>Week 6 Discussion</div><p>Ana: I'd give it 1 / 4 honestly</p><div class=\"score\">Score: 3.5 / 4</div>", { "content-type": "text/html" }],
      [/\/d2l\/le\/101\/discussions\/topics\/42\/View/, "<p>Ana: Grade: 7 / 10 on my last essay</p>", { "content-type": "text/html" }]]);
    const { out, seen } = await runInjected("brightspace", "https://learn.example.edu", routes);
    const m = Object.fromEntries(out.courses[0].marks.map(x => [x.kind + x.id, x.num + "/" + x.den + " " + x.from]));
    assert.strictEqual(m.folder21, "9/10 assignmentFeedback", "the score in the assignment's feedback");
    assert.strictEqual(m.folder22, "18/20 assignmentsPage", "the Assignments page's Score column");
    assert(!m.folder23 && !m.folder24, "no score on the page (a dash, a date) is no mark: " + JSON.stringify(m));
    assert(!m.folder25, "an assignment whose mark is in Grades isn't looked for elsewhere");
    assert.strictEqual(m.topic41, "3.5/4 discussionPage", "the topic page's labelled score, not a post's 1 / 4");
    assert(!m.topic42, "a post's 'Grade: 7 / 10' isn't the topic's mark (the topic is out of 4)");
    assert(/assignment feedback 1/.test(out.courses[0].markNote) && /Assignments page 1 of 3/.test(out.courses[0].markNote) && /discussion pages 1 of 2/.test(out.courses[0].markNote), out.courses[0].markNote);
    const off = await runInjected("brightspace", "https://learn.example.edu", routes, Object.assign({}, SAFE, { marks: { assignmentFeedback: false, assignmentsPage: false, discussionPage: false } }));
    assert(!off.out.courses[0].marks.length && !off.seen.some(u => /topics\/41\/View/.test(u)), "each source can be switched off");
    assert(seen.some(u => /topics\/41\/View/.test(u)));
  });

  await t("Blackboard: a graded attempt's score counts when the gradebook cell is still empty", async () => {
    const routes = BB.filter(([re]) => !/gradebook\\\/columns\\\?|gradebook\\\/users/.test(re.source)).concat([
      [/^\/learn\/api\/public\/v2\/courses\/_301_1\/gradebook\/columns\?/, { results: [{ id: "_8_1", name: "Midterm exam", grading: { due: iso(-3), type: "Attempts" }, score: { possible: 50 } },
        { id: "_8_2", name: "Quiz 2", grading: { due: iso(-2), type: "Attempts" }, score: { possible: 10 } }] }],
      [/^\/learn\/api\/public\/v2\/courses\/_301_1\/gradebook\/users\/_5_1$/, { results: [{ columnId: "_8_1", status: "NeedsGrading" }] }],
      [/gradebook\/columns\/_8_1\/attempts/, { results: [{ id: "a1", status: "Completed", score: 41, attemptDate: iso(-3) }] }],
      [/gradebook\/columns\/_8_2\/attempts/, { results: [{ id: "a2", status: "NeedsGrading", score: 0, attemptDate: iso(-2) }] }]]);
    const { out } = await runInjected("blackboard", "https://bb.example.edu", routes);
    const m = out.courses[0].marks.map(x => x.id + " " + x.num + "/" + x.den + " " + x.from);
    assert.strictEqual(JSON.stringify(m), JSON.stringify(["_8_1 41/50 attemptScore"]), "the graded attempt, not one still waiting to be graded: " + JSON.stringify(m));
  });

  await t("Brightspace: injected script runs in an empty page context and reads HTML text", async () => {
    const { out, seen } = await runInjected("brightspace", "https://learn.example.edu", BS);
    assert.strictEqual(out.ok, true, JSON.stringify(out).slice(0, 300));
    assert.deepStrictEqual(Array.from(out.errors), [], "no route errors");
    const c = out.courses[0];
    assert.strictEqual(c.ou, "101");
    assert.strictEqual(c.folders[0].text, "Write & submit your lab report\n\n\u2022 Intro\n\u2022 Method");
    assert.strictEqual(c.folders[0].files[0].name, "rubric.pdf");
    assert.strictEqual(c.quizzes[0].text, "Chapters 1–3 open book");
    assert.strictEqual(c.news[0].text, "Hello class <3", "script content dropped, entities decoded");
    assert.strictEqual(c.events[0].text, "Room 5");
    assert.deepStrictEqual(Array.from(c.events, e => e.id), ["11"], "another course's event listed in this course's calendar is left out");
    assert.strictEqual(c.grades[0].shown, "80 %");
    assert.strictEqual(out.items[0].name, "Read chapter 1");
    assert(seen.some(p => /myGradeValues/.test(p)) && seen.some(p => /content\/myItems/.test(p)), "the grade and content routes were read");
    const clean = L.cleanHarvest(out, "https://learn.example.edu");
    assert.strictEqual(clean.ok, true);
    assert.strictEqual(clean.courses[0].folders[0].text, c.folders[0].text);
    assert.strictEqual(clean.courses[0].events[0].url, "/d2l/le/calendar/101/event/11/detailsview", "relative https link kept");
    assert.strictEqual(clean.lp, "1.40");
  });

  await t("Canvas: injected script runs in an empty page context and reads HTML text", async () => {
    const { out } = await runInjected("canvas", "https://x.instructure.com", CV);
    assert.strictEqual(out.ok, true, JSON.stringify(out).slice(0, 300));
    const c = out.courses[0], essay = c.items.find(x => x.name === "Essay");
    assert.strictEqual(essay.text, "Write 1500 words. See Rubric & guide.\n\n\u2022 MLA");
    assert.deepStrictEqual(JSON.parse(JSON.stringify(essay.files)), [{ id: "77", name: "Rubric & guide", size: 0 }]);
    assert.strictEqual(c.items.find(x => x.name === "Quiz 2").rx.tl, 30);
    assert.strictEqual(c.news[0].text, "We meet in Room 12 & online");
    assert.strictEqual(c.events[0].text, "Bring notes");
    assert(c.items.some(x => x.name === "Week 3 discussion"), "planner item added");
    assert.strictEqual(c.final.pct, 91.5);
    assert.strictEqual(L.cleanHarvest(out, "https://x.instructure.com").courses[0].items.length, c.items.length);
  });

  await t("Blackboard: injected script runs in an empty page context and reads HTML text", async () => {
    const { out } = await runInjected("blackboard", "https://bb.example.edu", BB);
    assert.strictEqual(out.ok, true, JSON.stringify(out).slice(0, 300));
    const c = out.courses[0];
    assert.strictEqual(c.items.find(x => x.name === "Midterm exam").text, "Bring a pencil");
    assert.strictEqual(c.items.find(x => x.name === "Lab report").text, "Due <Friday> & on paper");
    assert.strictEqual(c.news[0].text, "Welcome & hello");
    assert.strictEqual(c.events[0].text, "Wear goggles");
    assert.strictEqual(c.grades[0].num, 40);
  });

  await t("Canvas points-based course: grades get their share of all the points; New Quizzes count as quizzes; same-named items stay apart", async () => {
    const routes = CV.map(r => r.slice());
    routes[1] = [/^\/api\/v1\/courses\?enrollment_state=active/, [{ id: 201, name: "History 200", course_code: "HIS200", start_at: iso(-30), end_at: iso(60), apply_assignment_group_weights: false, enrollments: [] }]];
    routes[2] = [/^\/api\/v1\/courses\/201\/assignments\?/, [
      { id: 1, name: "Reflection", due_at: iso(4), published: true, points_possible: 10, assignment_group_id: 3, submission_types: ["online_text_entry"], submission: { workflow_state: "graded", score: 8, submitted_at: iso(-1) } },
      { id: 2, name: "Reflection", due_at: iso(11), published: true, points_possible: 10, assignment_group_id: 3, submission_types: ["online_text_entry"], submission: { workflow_state: "unsubmitted" } },
      { id: 3, name: "Unit test", due_at: iso(20), published: true, points_possible: 30, assignment_group_id: 3, is_quiz_lti_assignment: true, submission_types: ["external_tool"], submission: null },
      { id: 4, name: "Bonus", due_at: iso(20), published: true, points_possible: 50, omit_from_final_grade: true, assignment_group_id: 3, submission_types: ["online_upload"], submission: null }]];
    routes[7] = [/^\/api\/v1\/planner\/items\?/, [{ course_id: 201, plannable_type: "assignment", plannable_id: 2, plannable: { title: "Reflection", due_at: iso(11) }, submissions: { submitted: true } }]];
    const { out } = await runInjected("canvas", "https://x.instructure.com", routes);
    const c = out.courses[0], w = id => c.grades.find(g => g.gid === id).weight;
    assert.strictEqual(w("1"), 20); assert.strictEqual(w("2"), 20); assert.strictEqual(w("3"), 60);
    assert(!c.grades.some(g => g.gid === "4"), "omitted from the final grade: no weight");
    assert.strictEqual(c.grades.find(g => g.gid === "1").num, 8);
    assert.strictEqual(c.items.find(x => x.id === "3").kind, "quiz");
    assert.strictEqual(c.items.filter(x => x.name === "Reflection").length, 2);
    assert.strictEqual(c.items.find(x => x.id === "2").done, true, "the planner's 'submitted' lands on the item with its id");
  });

  await t("Blackboard: counted columns get their share of all the points, so grades count in the Grade Tracker", async () => {
    const routes = BB.map(r => r.slice());
    routes[3] = [/^\/learn\/api\/public\/v2\/courses\/_301_1\/gradebook\/columns\?/, { results: [
      { id: "_8_1", name: "Midterm exam", grading: { due: iso(10), type: "Attempts" }, score: { possible: 50 } },
      { id: "_8_2", name: "Final exam", grading: { due: iso(40), type: "Attempts" }, score: { possible: 150 } },
      { id: "_8_3", name: "Practice", grading: { type: "Attempts" }, score: { possible: 10 }, includeInCalculations: false },
      { id: "_8_4", name: "Total", grading: { type: "Calculated" }, score: { possible: 200 } }] }];
    const { out } = await runInjected("blackboard", "https://bb.example.edu", routes);
    const g = out.courses[0].grades;
    assert.strictEqual(g.find(x => x.gid === "_8_1").weight, 25);
    assert.strictEqual(g.find(x => x.gid === "_8_1").num, 40);
    assert.strictEqual(g.find(x => x.gid === "_8_2").weight, 75);
    assert.strictEqual(g.find(x => x.gid === "_8_2").num, null, "not graded yet: weight only");
    assert(!g.some(x => x.gid === "_8_3" || x.gid === "_8_4"));
  });

  await t("Canvas: an assignment with no due date is sent along (with whether it's handed in) and takes the planner's date", async () => {
    const routes = CV.map(r => r.slice());
    routes[2] = [/^\/api\/v1\/courses\/201\/assignments\?/, [
      { id: 7, name: "Capacity Building with a Community Client", due_at: null, published: true, points_possible: 20, assignment_group_id: 3, submission_types: ["online_upload"], submission: { workflow_state: "submitted", submitted_at: iso(-2) } },
      { id: 8, name: "Group Charter", due_at: null, published: true, points_possible: 5, assignment_group_id: 3, submission_types: ["online_upload"], submission: { workflow_state: "unsubmitted" } }]];
    routes[7] = [/^\/api\/v1\/planner\/items\?/, [{ course_id: 201, plannable_type: "assignment", plannable_id: 8, plannable: { title: "Group Charter", todo_date: iso(6) } }]];
    const { out } = await runInjected("canvas", "https://x.instructure.com", routes);
    const c = out.courses[0], a = c.items.find(x => x.id === "7"), b = c.items.find(x => x.id === "8");
    assert(a && a.due === null && a.done === true, "the undated, submitted one is there: " + JSON.stringify(a && {due: a.due, done: a.done}));
    assert(b && b.due && b.done === false, "the planner's date lands on the undated one with its id");
  });

  await t("Blackboard: a column with no due date takes the calendar's, keeping whether it's handed in", async () => {
    const routes = BB.map(r => r.slice());
    routes[2] = [/^\/learn\/api\/public\/v1\/calendars\/items\?/, { results: [{ id: "c9", calendarId: "_301_1", type: "GradebookColumn", title: "Reflection Paper", end: iso(-3), itemSourceId: "_8_9" }] }];
    routes[3] = [/^\/learn\/api\/public\/v2\/courses\/_301_1\/gradebook\/columns\?/, { results: [
      { id: "_8_9", name: "Reflection Paper", grading: { type: "Attempts" }, score: { possible: 20 } }] }];
    routes.push([/\/gradebook\/columns\/_8_9\/attempts/, { results: [{ id: "a1", status: "NeedsGrading", created: iso(-4) }] }]);
    routes[4] = [/^\/learn\/api\/public\/v2\/courses\/_301_1\/gradebook\/users\/_5_1$/, { results: [] }];
    const { out } = await runInjected("blackboard", "https://bb.example.edu", routes);
    const items = out.courses[0].items.filter(x => x.name === "Reflection Paper");
    assert.strictEqual(items.length, 1, "one item, not a calendar copy beside it: " + items.length);
    assert(items[0].due && items[0].done === true, "dated by the calendar and submitted (an attempt waiting to be graded): " + JSON.stringify({due: items[0].due, done: items[0].done}));
  });

  await t("Brightspace: the class's average, median, high and low on a graded item, when allowed; one refusal stops the rest", async () => {
    const grades = { Objects: [], Next: null };
    const vals = [{ GradeObjectIdentifier: "9", GradeObjectName: "Lab 0", GradeObjectType: 1, PointsNumerator: 8, PointsDenominator: 10, DisplayedGrade: "80 %" },
                  { GradeObjectIdentifier: "12", GradeObjectName: "Quiz 1", GradeObjectType: 1, PointsNumerator: 7, PointsDenominator: 10, DisplayedGrade: "70 %" }];
    const routes = BS.filter(([re]) => !/myGradeValues/.test(re.source)).concat([[/\/grades\/values\/myGradeValues\/$/, vals],
      [/\/grades\/9\/statistics$/, { Minimum: 4, Maximum: 10, Average: 7.25, Median: 7.5 }], [/\/grades\/12\/statistics$/, { Minimum: 2, Maximum: 10, Average: 6.1, Median: 6 }]]);
    const { out } = await runInjected("brightspace", "https://learn.example.edu", routes);
    const g = id => out.courses[0].grades.find(x => x.gid === id);
    assert.strictEqual(JSON.stringify(g("9").cls), JSON.stringify({ mean: 7.25, median: 7.5, lo: 4, hi: 10 }));
    assert.strictEqual(g("12").cls.mean, 6.1);
    const refused = BS.filter(([re]) => !/myGradeValues/.test(re.source)).concat([[/\/grades\/values\/myGradeValues\/$/, vals]]);
    const r2 = await runInjected("brightspace", "https://learn.example.edu", refused);
    assert.strictEqual(r2.seen.filter(p => /\/statistics$/.test(p)).length, 1, "asked once, then not again for the course");
    assert(!r2.out.courses[0].grades.some(x => x.cls), "no class results when they aren't shown");
  });

  await t("the pass mark from the course's grade scheme: Brightspace's default scheme and Canvas's grading standard (65% in nursing)", async () => {
    const bs = BS.concat([[/\/grades\/setup\/$/, { GradingSystem: "Points", DefaultGradeSchemeId: 44 }],
      [/\/grades\/schemes\/44$/, { Id: 44, Name: "BSN Scheme", Ranges: [{ Symbol: "F", PercentStart: 0 }, { Symbol: "C", PercentStart: 65 }, { Symbol: "B", PercentStart: 73 }, { Symbol: "A", PercentStart: 86 }] }]]);
    const a = await runInjected("brightspace", "https://learn.example.edu", bs);
    assert.strictEqual(a.out.courses[0].passMark && a.out.courses[0].passMark.pct, 65);
    const none = await runInjected("brightspace", "https://learn.example.edu", BS);
    assert(!none.out.courses[0].passMark, "no scheme readable: nothing guessed");
    const cv = CV.map(r => r.slice());
    cv[1] = [/^\/api\/v1\/courses\?enrollment_state=active/, [{ id: 201, name: "Nursing 200", course_code: "NURS200", start_at: iso(-30), end_at: iso(60), grading_standard_id: 7, enrollments: [] }]];
    cv.push([/\/api\/v1\/courses\/201\/grading_standards/, [{ id: 7, title: "BCIT Nursing", grading_scheme: [{ name: "A", value: 0.86 }, { name: "B", value: 0.73 }, { name: "C", value: 0.65 }, { name: "F", value: 0 }] }]]);
    const c = await runInjected("canvas", "https://x.instructure.com", cv);
    assert.strictEqual(c.out.courses[0].passMark && c.out.courses[0].passMark.pct, 65);
  });

  await t("cleanHarvest keeps only plain, capped data and https links", async () => {
    const evil = { ok: true, origin: "https://evil.example", me: { name: "x".repeat(999), id: 5 }, lp: "1.40; alert(1)", all: [], errors: [],
      courses: [{ ou: "1", name: "y".repeat(20000), url: "javascript:alert(1)", home: "http://plain.example/", items: new Array(2000).fill({ name: "i", url: "https://ok.example/a", fn: "s", "bad key!": 1, n: Infinity }), deep: { a: { b: { c: { d: { e: { f: { g: 1 } } } } } } } }] };
    const c = L.cleanHarvest(evil, "https://learn.example.edu");
    assert.strictEqual(c.origin, "https://learn.example.edu", "origin is ours, not the page's");
    assert.strictEqual(c.me.name.length, 200);
    assert.strictEqual(c.lp, undefined);
    const k = c.courses[0];
    assert.strictEqual(k.name.length, 8000);
    assert.strictEqual(k.url, ""); assert.strictEqual(k.home, "");
    assert.strictEqual(k.items.length, 1000);
    assert.strictEqual(k.items[0].url, "https://ok.example/a");
    assert(!("bad key!" in k.items[0]) && k.items[0].n === null);
    assert.deepStrictEqual(L.cleanHarvest({ needLogin: true, junk: 1 }, "https://a.b"), { needLogin: true });
    assert.deepStrictEqual(L.cleanHarvest("nope", "https://a.b"), { error: "bad-result" });
    assert.deepStrictEqual(L.cleanHarvest({ error: "e".repeat(500) }, "https://a.b").error.length, 200);
  });

  await t("cleanFile accepts real base64 under the cap only", async () => {
    assert.deepStrictEqual(L.cleanFile({ ok: true, name: "a/b.pdf", type: "application/pdf", b64: Buffer.from("hello").toString("base64") }), { ok: true, name: "a_b.pdf", type: "application/pdf", b64: "aGVsbG8=" });
    assert.deepStrictEqual(L.cleanFile({ ok: true, name: "x", type: "text/html", b64: "not base64!" }), { error: "bad-file" });
    assert.deepStrictEqual(L.cleanFile({ ok: true, b64: "A".repeat(Math.ceil(52428800 / 3) * 4 + 4) }), { error: "bad-file" });
    assert.strictEqual(L.cleanFile({ ok: true, b64: "", type: "<script>" }).type, "");
  });

  await t("school addresses: home-network names and private addresses are refused", async () => {
    for (const h of ["printer.local", "nas.lan", "router.home", "x.internal", "a.localhost", "10.0.0.1", "localhost"]) assert.strictEqual(L.originOf(h), null, h);
    assert.strictEqual(L.originOf("learn.example.edu"), "https://learn.example.edu");
    for (const ip of ["10.1.2.3", "127.0.0.1", "169.254.169.254", "172.20.0.1", "192.168.1.1", "100.64.0.1", "0.0.0.0", "::1", "fe80::1", "fd00::1", "::ffff:192.168.0.1", "::ffff:c0a8:0001"]) assert.strictEqual(L.privateIp(ip), true, ip);
    for (const ip of ["8.8.8.8", "142.250.1.1", "2607:f8b0:4004:800::200e", "172.32.0.1", "100.128.0.1"]) assert.strictEqual(L.privateIp(ip), false, ip);
  });

  await t("Canvas: at most 3 requests at a time, and a request turned away for the rate limit waits and is asked again", async () => {
    const plainRun = await runInjected("canvas", "https://x.instructure.com", CV);
    const base = fakeFetch(CV, []); let cur = 0, max = 0, limited = 0; const asked = [];
    const f = async (url, opts) => {
      cur++; max = Math.max(max, cur);
      try {
        await new Promise(r => setTimeout(r, 15));
        if (/\/assignments\?/.test(String(url)) && !limited) { limited++;
          return { ok: false, status: 403, headers: { get: k => String(k).toLowerCase() === "x-rate-limit-remaining" ? "0" : null }, clone() { return { text: async () => "403 Forbidden (Rate Limit Exceeded)" }; }, text: async () => "", json: async () => ({}) }; }
        asked.push(String(url)); return await base(url, opts);
      } finally { cur--; }
    };
    const ctx = vm.createContext({ fetch: f, AbortController, setTimeout, clearTimeout, location: { origin: "https://x.instructure.com" }, console });
    const out = await vm.runInContext(L.harvestScript(L.P.canvas, SAFE), ctx, { filename: "canvas-limit.js" });
    assert(out && out.ok, "the read still works: " + JSON.stringify(out).slice(0, 200));
    assert(max <= 3, "never more than 3 requests at once: " + max);
    assert(limited === 1 && asked.some(u => /\/assignments\?/.test(u)), "the rate-limited request was asked again");
    const items = o => o.courses.reduce((k, c) => k + (c.items || []).length, 0);
    assert(items(out) === items(plainRun.out) && items(out) > 0, "and nothing was lost: " + items(out) + " items");
  });

  console.log(fail ? `lms-harvest: ${fail} of ${n} failed` : `lms-harvest: ${n} checks passed`);
  process.exitCode = fail ? 1 : 0;
})();
