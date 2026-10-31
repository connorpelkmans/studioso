// node tests/high-school-sites.e2e.js: School Sites keeps Schoology and Google Classroom under a High School Sites dropdown;
// Google Classroom connects through the account and brings in classwork, what's turned in, grades and announcements
// (the cloud-files function and Google's Classroom API are faked); Schoology connects with its calendar link only.
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const root = path.join(__dirname, "..");
const MIME = {".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".css": "text/css", ".png": "image/png", ".svg": "image/svg+xml", ".webp": "image/webp", ".woff2": "font/woff2"};
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  res.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const act = (page, a) => page.evaluate(a => { const b = document.createElement("button"); b.dataset.act = a; document.body.appendChild(b); b.click(); b.remove(); }, a);
(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  const errs = [];
  try {
    const ctx = await browser.newContext({viewport: {width: 430, height: 900}, isMobile: true, hasTouch: true, serviceWorkers: "block"});
    await ctx.route(/supabase\.co/, r => r.fulfill({status: 200, contentType: "application/json", headers: {"access-control-allow-origin": "*"}, body: "[]"}));
    await ctx.addInitScript(() => {
      localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "1");
      // the phone app's school-site layer: Schoology must not offer signing in through it
      window.studiosoLms = {connect: () => Promise.resolve({ok: false}), sync: () => Promise.resolve({}), signOut: () => Promise.resolve(), feed: () => Promise.resolve({})};
    });
    const page = await ctx.newPage(); page.on("pageerror", e => errs.push(e.message));
    await page.goto(base); await page.waitForFunction(() => window.SBLMS && window.__sbGc); await page.waitForTimeout(1500);
    await page.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));

    // School Sites: three cards, then the High School Sites dropdown, closed
    await act(page, "lms-open"); await page.waitForSelector(".bs-hs");
    const pick = await page.evaluate(() => ({main: [...document.querySelectorAll(".bs-sheet > .sheet-body > .bs-plist .bs-pcard b")].map(b => b.textContent),
      hs: [...document.querySelectorAll(".bs-hs .bs-pcard b")].map(b => b.textContent), sum: document.querySelector(".bs-hs > summary b").textContent, open: document.querySelector(".bs-hs").open}));
    ok(JSON.stringify(pick.main) === JSON.stringify(["Canvas", "Brightspace", "Blackboard", "Moodle"]), "School Sites shows Canvas, Brightspace, Blackboard, then Moodle fourth: " + pick.main.join(", "));
    ok(pick.sum === "High School Sites" && !pick.open && JSON.stringify(pick.hs) === JSON.stringify(["Schoology", "Google Classroom"]), "Schoology and Google Classroom sit in a closed High School Sites dropdown");
    ok(!(await page.isVisible(".bs-hs .bs-pcard")), "hidden until it's opened");
    await page.tap(".bs-hs > summary"); await page.waitForTimeout(200);
    ok(await page.isVisible(".bs-hs .bs-pcard"), "opening it shows them");
    if (process.env.SHOT) await page.screenshot({path: process.env.SHOT});

    // Schoology: calendar link only
    await page.tap('.bs-hs [data-act="sg-open"]'); await page.waitForSelector("#bsFeedIn");
    ok(!(await page.$("#bsHostIn")) && !/Sign In to Schoology/.test(await page.textContent(".bs-sheet")), "Schoology connects with its calendar link, with no sign-in offered");
    await act(page, "sg-feed-help"); await page.waitForTimeout(200);
    ok(/Export/.test(await page.textContent(".bs-steps")), "How to Find It says where Schoology's link is (Calendar, then Export)");
    const sg = await page.evaluate(() => {
      const L = window.SBLMS.schoology, d = new Date(Date.now() + 3 * 864e5), z = x => String(x).padStart(2, "0"), day = `${d.getUTCFullYear()}${z(d.getUTCMonth() + 1)}${z(d.getUTCDate())}`;
      const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "BEGIN:VEVENT", "UID:a1@schoology", `DTSTART:${day}T235900Z`, "SUMMARY:Essay draft", "CATEGORIES:English 10", "URL:https://app.schoology.com/assignment/7788",
        "DESCRIPTION:Write 500 words.", "END:VEVENT", "BEGIN:VEVENT", "UID:e1@schoology", `DTSTART;VALUE=DATE:${day}`, "SUMMARY:Pep rally", "URL:https://app.schoology.com/event/55", "END:VEVENT", "END:VCALENDAR"].join("\r\n");
      const out = L.fromFeed(ics, "feed");
      return {ok: L.P.feedRx.test("https://app.schoology.com/calendar/feed/ical/1700000000/abc123/ical.ics"), bad: L.P.feedRx.test("https://app.schoology.com/home"), recs: out.recs.map(r => r.title), evs: out.evs.map(e => e.title), course: (out.courses[0] || {}).name};
    });
    ok(sg.ok && !sg.bad, "Schoology's calendar export link is accepted, other pages aren't");
    ok(sg.recs.includes("Essay draft") && sg.evs.includes("Pep rally") && sg.course === "English 10", "a Schoology calendar brings in its assignment as a task and its event as an event: " + JSON.stringify(sg));

    // Moodle: calendar link only, and its calendar's course short names become courses
    await page.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
    await act(page, "md-open"); await page.waitForSelector("#bsFeedIn");
    ok(!(await page.$("#bsHostIn")) && /Moodle/.test(await page.textContent(".bs-sheet")), "Moodle connects with its calendar link");
    const md = await page.evaluate(() => {
      const L = window.SBLMS.moodle, d = new Date(Date.now() + 4 * 864e5), z = x => String(x).padStart(2, "0"), day = `${d.getUTCFullYear()}${z(d.getUTCMonth() + 1)}${z(d.getUTCDate())}`;
      const ev = (uid, sum, cat, when) => ["BEGIN:VEVENT", "UID:" + uid, "SUMMARY:" + sum, "DESCRIPTION:", "CLASS:PUBLIC", "CATEGORIES:" + cat, "DTSTART:" + when, "DTEND:" + when, "END:VEVENT"];
      const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Moodle Pty Ltd//NONSGML Moodle Version 2024100700//EN",
        ...ev("1@moodle.school.edu", "Lab report 2 is due", "CHEM 1010", day + "T235900Z"), ...ev("2@moodle.school.edu", "Unit 3 quiz closes", "MATH 1100", day + "T170000Z"),
        ...ev("3@moodle.school.edu", "Study group", "CHEM 1010", day + "T150000Z"), "END:VCALENDAR"].join("\r\n");
      const out = L.fromFeed(ics, "feed");
      return {ok: L.P.feedRx.test("https://moodle.school.edu/calendar/export_execute.php?userid=12&authtoken=abc&preset_what=all&preset_time=recentupcoming"), bad: L.P.feedRx.test("https://moodle.school.edu/calendar/view.php"),
        recs: out.recs.map(r => r.title), evs: out.evs.map(e => e.title), courses: out.courses.map(c => c.code || c.name).sort()};
    });
    ok(md.ok && !md.bad, "Moodle's Get calendar URL link is accepted, other pages aren't");
    ok(md.recs.includes("Lab report 2") && md.recs.includes("Unit 3 quiz") && md.evs.includes("Study group") && JSON.stringify(md.courses) === JSON.stringify(["CHEM 1010", "MATH 1100"]), "a Moodle calendar brings in due work as tasks, its courses from the course short names: " + JSON.stringify(md));

    // Google Classroom
    await page.evaluate(() => {
      window.__sbGc.signedIn = () => true;
      const W = window.__gcw = {connected: false, auth: [], calls: []};
      const day = n => { const d = new Date(Date.now() + n * 864e5); return {year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate()}; };
      window.__sbGc.call = async b => {
        W.calls.push(b.action + ":" + b.provider);
        if (b.action === "start") return {ok: true, status: 200, data: {url: "https://x.supabase.co/functions/v1/cloud-files?begin=abc"}};
        if (b.action === "status") return {ok: true, status: 200, data: {accounts: W.connected ? [{provider: "classroom", account: "sam@school.org", status: "ok"}] : [], providers: {classroom: true}}};
        if (b.action === "token") return {ok: true, status: 200, data: {access: "gc-at", expires_in: 3600}};
        return {ok: true, status: 200, data: {}};
      };
      const json = o => new Response(JSON.stringify(o), {status: 200, headers: {"content-type": "application/json"}});
      window.__sbGc.fetch = async url => {
        const u = new URL(url); W.auth.push(u.pathname);
        if (u.pathname === "/v1/courses") return json({courses: [{id: "111", name: "Biology 11", section: "Period 2", alternateLink: "https://classroom.google.com/c/MTEx"}]});
        if (u.pathname === "/v1/courses/111/courseWork") return json({courseWork: [
          {id: "w1", title: "Cell lab report", dueDate: day(2), dueTime: {hours: 23, minutes: 30}, maxPoints: 20, alternateLink: "https://classroom.google.com/c/MTEx/a/w1", workType: "ASSIGNMENT"},
          {id: "w2", title: "Chapter 3 quiz", dueDate: day(6), maxPoints: 10, alternateLink: "https://classroom.google.com/c/MTEx/a/w2", workType: "ASSIGNMENT"},
          {id: "w3", title: "Microscope worksheet", dueDate: day(-3), dueTime: {hours: 23}, maxPoints: 20, workType: "ASSIGNMENT"},
          {id: "w4", title: "Reading with no due date", workType: "ASSIGNMENT"}]});
        if (u.pathname === "/v1/courses/111/courseWork/-/studentSubmissions") return json({studentSubmissions: [{courseWorkId: "w1", state: "TURNED_IN", updateTime: new Date().toISOString()}, {courseWorkId: "w2", state: "CREATED"}, {courseWorkId: "w3", state: "RETURNED", assignedGrade: 18, updateTime: new Date().toISOString()}]});
        if (u.pathname === "/v1/courses/111/announcements") return json({announcements: [{id: "n1", text: "Field trip Friday\nBring your permission forms", creationTime: new Date().toISOString(), alternateLink: "https://classroom.google.com/c/MTEx/p/n1"}]});
        return new Response("{}", {status: 404});
      };
    });
    await page.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
    await act(page, "gc-open"); await page.waitForSelector("[data-gc-go]");
    ok(/Read only/.test(await page.textContent(".bs-sheet")) && /ask your school's IT team/.test(await page.textContent(".bs-sheet")), "Google Classroom explains it's read-only, and what to do if a school account blocks it");
    ok(await page.getAttribute("[data-gc-go]", "href") === "https://x.supabase.co/functions/v1/cloud-files?begin=abc", "Connect With Google goes to Google's sign-in through the account");
    // they sign in on Google's page in another tab, then come back
    await page.evaluate(() => { const a = document.querySelector("[data-gc-go]"); a.addEventListener("click", e => e.preventDefault()); a.click(); window.__gcw.connected = true; window.dispatchEvent(new Event("focus")); });
    await page.waitForSelector("[data-submit]", {timeout: 8000});
    ok(/Biology 11/.test(await page.textContent(".bs-sheet")), "after connecting, the classes are ready to import");
    await page.click("[data-submit]"); await page.waitForTimeout(800);
    const got = await page.evaluate(() => { const st = window.SBLMS.st(); const ts = Object.values(st.tasks || {}).filter(t => t.gc); const g = window.SBLMS.classroom.cfg();
      return {mark: (ts.find(t => t.title === "Microscope worksheet") || {}).mark || null, tasks: ts.map(t => ({title: t.title, status: t.status, due: t.due, time: t.time})), mode: g.mode, acct: g.acct, news: (g.newsItems || []).map(x => x.title), course: Object.values(st.courses || {}).find(c => c.gc) || null};
    });
    const by = t => got.tasks.find(x => x.title === t) || {};
    ok(got.mode === "direct" && got.acct === "sam@school.org", "Google Classroom is connected as sam@school.org");
    ok(by("Cell lab report").status === "done" && by("Chapter 3 quiz").status === "todo" && by("Chapter 3 quiz").time === "", "classwork comes in as tasks; turned-in work is marked done, work due without a time has no time: " + JSON.stringify(got.tasks));
    ok(got.mark && got.mark.got === 18 && got.mark.outOf === 20 && got.mark.src === "gc", "a returned grade comes in: 18 / 20");
    ok(!by("Reading with no due date").title, "classwork with no due date isn't added");
    ok(got.news.includes("Field trip Friday"), "announcements come in");
    ok(got.course && got.course.name === "Biology 11" && (got.course.links || []).some(l => l.url === "https://classroom.google.com/c/MTEx"), "the class becomes a course, linked to its Classroom page");
    ok(await page.evaluate(() => window.__gcw.auth.length > 0 && window.__gcw.calls.includes("token:classroom")), "it reads Google's Classroom API with a token from the account");
    await act(page, "gc-open"); await page.waitForTimeout(300);
    ok(/sam@school\.org/.test(await page.textContent(".bs-sheet")) && !(await page.$("#bsFeedIn")), "its settings show the Google account, with no calendar link box");
    await ctx.close();
    ok(!errs.length, "no page errors: " + errs.join(" | "));
    console.log(`high-school-sites.e2e: ${n} checks passed`);
  } finally { await browser.close(); server.close(); }
})().catch(e => { console.error(e); process.exit(1); });
