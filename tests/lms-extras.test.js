// What the school sites say beyond due dates and grades, on Brightspace, Canvas and Blackboard alike: submitted when, late, missing,
// extensions; your feedback (comments and rubric scores); the rubric itself; who teaches the course; and the syllabus. Brightspace
// discussion topics too. Runs each platform's real harvest script in an empty vm context against a fake school site, then cleanHarvest.
// Run: node tests/lms-extras.test.js   (no Electron needed: the electron module is stubbed)
const path = require("path"), assert = require("assert"), vm = require("vm"), Module = require("module");
const realLoad = Module._load;
Module._load = function (req, ...rest) { return req === "electron" ? { app: { isPackaged: true, userAgentFallback: "" } } : realLoad.call(this, req, ...rest); };
const L = require(path.join(__dirname, "..", "lms.js"));
Module._load = realLoad;
const soon = new Date(Date.now() + 3 * 864e5).toISOString(), ago = new Date(Date.now() - 3 * 864e5).toISOString(), ago2 = new Date(Date.now() - 2 * 864e5).toISOString();
function run(P, routes){
  // the longest matching route prefix answers; anything else is a 404
  const fetch = async (u) => { u = String(u); const k = Object.keys(routes).sort((a, b) => b.length - a.length).find(k => u.startsWith(k)); if (!k) return { ok: false, status: 404, headers: { get: () => "" } };
    const b = routes[k]; return { ok: true, status: 200, headers: { get: () => "" }, json: async () => b, text: async () => typeof b === "string" ? b : JSON.stringify(b) }; };
  return vm.runInNewContext(L.harvestScript(P, { pastDays: 60 }), { fetch, location: { origin: "https://x.edu" }, AbortController, setTimeout, clearTimeout, encodeURIComponent, Date, URL });
}
const clean = h => { const c = L.cleanHarvest(h, "https://x.edu"); assert.strictEqual(c.ok, true); return JSON.parse(JSON.stringify(c.courses[0])); };   // plain objects of this realm, for deepStrictEqual
(async () => {
  const cv = clean(await run(L.P.canvas, {
    "/api/v1/users/self": { id: 5, name: "Me" },
    "/api/v1/courses?": [{ id: 1, name: "Bio", course_code: "BIO101" }],
    "/api/v1/courses/1/assignments": [{ id: 10, name: "Essay", due_at: ago, points_possible: 10, published: true, submission_types: ["online_upload"],
      rubric: [{ id: "r1", description: "Thesis", long_description: "Clear claim", points: 5, ratings: [{ id: "a", description: "Strong", points: 5 }, { id: "b", description: "Weak", points: 2 }] }], rubric_settings: { title: "Essay rubric", points_possible: 5 },
      submission: { submitted_at: ago2, late: true, workflow_state: "graded", score: 8, grade: "8" } }],
    "/api/v1/courses/1/students/submissions": [{ assignment_id: 10, submitted_at: ago2, late: true, score: 8, grade: "8", late_policy_status: "extended", submission_comments: [{ author_name: "Prof X", author_id: 9, comment: "Nice <b>work</b>", created_at: ago }], rubric_assessment: { r1: { points: 5, rating_id: "a", comments: "good" } } }],
    "/api/v1/courses/1?include": { id: 1, syllabus_body: "<p>Instructor: Dr. Smith</p><p>Lectures MWF 10:00-10:50 in Room 101</p><p>Office hours: Tue 2-3pm</p><p>Midterm 25%</p>" },
    "/api/v1/courses/1/users": [{ id: 9, name: "Prof X", email: "x@x.edu", enrollments: [{ type: "TeacherEnrollment" }] }, { id: 8, name: "TA Y", enrollments: [{ type: "TaEnrollment" }] }],
  }));
  const b = "/d2l/api/le/1.50/7";
  const bs = clean(await run(L.P.brightspace, {
    "/d2l/api/versions/": [{ ProductCode: "lp", LatestVersion: "1.30" }, { ProductCode: "le", LatestVersion: "1.50" }],
    "/d2l/api/lp/1.30/users/whoami": { Identifier: "42", FirstName: "A" },
    "/d2l/api/lp/1.30/enrollments/myenrollments/": { Items: [{ OrgUnit: { Id: 7, Name: "Bio", Code: "BIO101" } }], PagingInfo: {} },
    [b + "/dropbox/folders/1/submissions"]: [{ Status: 3, Submissions: [{ SubmissionDate: ago2 }], Feedback: { Score: 9, Feedback: { Text: "Great job" }, RubricAssessments: [{ CriteriaOutcome: [{ CriterionId: 100, LevelId: 1, Score: 4, Feedback: "solid" }] }] } }],
    [b + "/dropbox/folders/"]: [{ Id: 1, Name: "Essay", DueDate: ago, GradeItemId: 50, Assessment: { ScoreDenominator: 10, Rubrics: [{ Name: "R", CriteriaGroups: [{ Levels: [{ Id: 1, Name: "Good", Points: 4 }, { Id: 2, Name: "Poor", Points: 1 }], Criteria: [{ Id: 100, Name: "Argument", Cells: [{ Description: { Text: "strong" }, Points: 4 }, { Description: { Text: "weak" }, Points: 1 }] }] }] }] } }],
    [b + "/quizzes/"]: { Objects: [] },
    [b + "/grades/values/myGradeValues/"]: [{ GradeObjectIdentifier: "50", GradeObjectName: "Essay", PointsNumerator: 9, PointsDenominator: 10, GradeObjectType: 1, Comments: { Text: "See rubric" } }],
    [b + "/discussions/forums/3/topics/4/posts/"]: [{ PostingUserId: 42 }],
    [b + "/discussions/forums/3/topics/"]: [{ TopicId: 4, ForumId: 3, Name: "Week 1 post", DueDate: soon }],
    [b + "/discussions/forums/"]: [{ ForumId: 3, Name: "F" }],
    [b + "/classlist/"]: [{ DisplayName: "Dr. D", Email: "d@x.edu", ClasslistRoleDisplayName: "Instructor" }, { DisplayName: "Stu", ClasslistRoleDisplayName: "Student" }],
    [b + "/overview"]: { Description: { Text: "Welcome to Bio" } },
    [b + "/content/toc"]: { Modules: [{ Topics: [{ TopicId: 77, Title: "Course Syllabus", Url: "/content/enforced/7/syl.html" }] }] },
    "/content/enforced/7/syl.html": "<html><body><h1>Syllabus</h1><p>Lab Thursdays 13:00-15:50</p></body></html>",
  }));
  const c = "_1_1";
  const bb = clean(await run(L.P.blackboard, {
    "/learn/api/public/v1/users/me": { id: "_u", name: { given: "A" } },
    "/learn/api/public/v1/users/_u/courses": { results: [{ course: { id: c, name: "Chem", description: "Intro chem" }, lastAccessed: ago }] },
    [`/learn/api/public/v2/courses/${c}/gradebook/columns/_a/attempts`]: { results: [{ status: "NeedsGrading", attemptDate: ago2, feedback: "<p>Good draft</p>" }] },
    [`/learn/api/public/v2/courses/${c}/gradebook/columns/_b/attempts`]: { results: [] },
    [`/learn/api/public/v2/courses/${c}/gradebook/columns`]: { results: [{ id: "_a", name: "Paper", grading: { due: ago }, score: { possible: 10 } }, { id: "_b", name: "Report", grading: { due: ago }, score: { possible: 10 } }] },
    [`/learn/api/public/v1/courses/${c}/users`]: { results: [{ courseRoleId: "Instructor", user: { name: { given: "Pat", family: "Lee" }, contact: { email: "lee@x.edu" } } }] },
    [`/learn/api/public/v1/courses/${c}/contents/_s/children`]: { results: [{ title: "Schedule", body: "<p>Lectures Tue/Thu 9:30-10:45</p>" }] },
    [`/learn/api/public/v1/courses/${c}/contents`]: { results: [{ id: "_s", title: "Syllabus", hasChildren: true, body: "" }] },
    [`/learn/api/v1/courses/${c}/rubricAssociations`]: { results: [{ gradebookColumnId: "_a", rubricId: "rb" }] },
    [`/learn/api/v1/courses/${c}/rubrics`]: { results: [{ id: "rb", title: "Paper rubric", rubricColumns: [{ id: "k1", header: "Excellent" }], rubricRows: [{ id: "w1", header: "Clarity", rubricCells: [{ rubricColumnId: "k1", points: 5, description: "Very clear" }] }] }] },
  }));

  // Canvas
  const ci = cv.items[0];
  assert.deepStrictEqual([ci.done, ci.st.late, ci.st.ext, !!ci.st.subAt], [true, true, true, true], "Canvas: submitted, late, extension");
  assert.strictEqual(ci.fb.c[0].t, "Nice work", "Canvas: comment, as plain text");
  assert.deepStrictEqual([ci.fb.ra[0].c, ci.fb.ra[0].lv, ci.fb.ra[0].pts], ["Thesis", "Strong", 5], "Canvas: rubric score");
  assert.deepStrictEqual(ci.rub.cr[0].lv.map(v => v.t), ["Strong", "Weak"], "Canvas: the rubric keeps its levels");
  assert.deepStrictEqual(cv.staff.map(u => u.role), ["Instructor", "TA"], "Canvas: instructor and TA");
  assert(/MWF 10:00-10:50/.test(cv.syl.join("")) && /^https:\/\/x\.edu\//.test(cv.sylUrl), "Canvas: syllabus text and link");
  assert(cv.grades[0].fb, "Canvas: feedback travels with the grade too");
  // Brightspace
  const bf = bs.folders[0];
  assert.deepStrictEqual([bf.sub, bf.st.late, bf.fb.c[0].t, bf.fb.ra[0].lv], [true, true, "Great job", "Good"], "Brightspace: submitted late, feedback, rubric level");
  assert.deepStrictEqual(bf.rub.cr[0].lv.map(v => v.t + ":" + v.d), ["Good:strong", "Poor:weak"], "Brightspace: rubric levels with descriptions");
  assert.strictEqual(bs.grades[0].fb.c[0].t, "See rubric", "Brightspace: grade comments");
  assert.deepStrictEqual(bs.discussions.map(d => [d.name, d.posted]), [["Week 1 post", true]], "Brightspace: discussion topics and whether you posted");
  assert.deepStrictEqual(bs.staff.map(u => u.name), ["Dr. D"], "Brightspace: only instructors from the class list");
  assert(/Lab Thursdays/.test(bs.syl.join("")) && /viewContent\/77/.test(bs.sylUrl), "Brightspace: syllabus page from Content");
  // Blackboard
  const [pa, re] = bb.items;
  assert.deepStrictEqual([pa.done, pa.st.late, pa.fb.c[0].t, pa.rub.cr[0].t, pa.rub.cr[0].lv[0].t], [true, true, "Good draft", "Clarity", "Excellent"], "Blackboard: attempt, late, feedback, rubric");
  assert.deepStrictEqual([re.done, re.st.missing], [false, true], "Blackboard: missing when past due with no attempt");
  assert.deepStrictEqual(bb.staff.map(u => u.email), ["lee@x.edu"], "Blackboard: instructor email");
  assert(/Tue\/Thu 9:30-10:45/.test(bb.syl.join("")), "Blackboard: syllabus from course content");
  console.log("lms-extras: all checks passed");
})().catch(e => { console.error(e); process.exit(1); });
