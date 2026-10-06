// The school-platform sync as it really runs: lms.js builds one script per platform and runs it inside the school's page
// (executeJavaScript), where nothing from lms.js exists. This takes that exact script and runs it in an empty vm context with only
// what a web page has (fetch, AbortController, timers, location), against a fake Brightspace, Canvas and Blackboard that answer
// with realistic JSON (including HTML descriptions). A ReferenceError here means the harvest uses something only lms.js has.
// Run: node tests/lms-harvest.test.js   (no Electron needed: the electron module is stubbed)
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

// A tiny fetch: routes are [regex on path+query, body or function, extra headers]. Anything else is a 404.
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
// Runs the injected script the way Electron would: a fresh global with page-like objects only.
async function runInjected(id, origin, routes) {
  const seen = [];
  const ctx = vm.createContext({ fetch: fakeFetch(routes, seen), AbortController, setTimeout, clearTimeout, location: { origin }, console });
  const script = L.harvestScript(L.P[id], SAFE);
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
  [/\/calendar\/events\/myEvents\//, { Objects: [{ CalendarEventId: 11, Title: "Lecture", Description: "<p>Room&nbsp;5</p>", StartDateTime: iso(1), EndDateTime: iso(1.05), IsAllDayEvent: false, LocationName: "B-5", CalendarEventViewUrl: "/d2l/le/calendar/101/event/11/detailsview" }], Next: null }],
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
    assert.strictEqual(L.originOf("learn.bcit.ca"), "https://learn.bcit.ca");
    for (const ip of ["10.1.2.3", "127.0.0.1", "169.254.169.254", "172.20.0.1", "192.168.1.1", "100.64.0.1", "0.0.0.0", "::1", "fe80::1", "fd00::1", "::ffff:192.168.0.1", "::ffff:c0a8:0001"]) assert.strictEqual(L.privateIp(ip), true, ip);
    for (const ip of ["8.8.8.8", "142.250.1.1", "2607:f8b0:4004:800::200e", "172.32.0.1", "100.128.0.1"]) assert.strictEqual(L.privateIp(ip), false, ip);
  });

  console.log(fail ? `lms-harvest: ${fail} of ${n} failed` : `lms-harvest: ${n} checks passed`);
  process.exitCode = fail ? 1 : 0;
})();
