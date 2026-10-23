// node tests/qol-setup.e2e.js  First run, grades, syllabus import, school sites, course page, settings and the Pro sheet
const http = require("http"), fs = require("fs"), path = require("path"), zlib = require("zlib"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const root = path.join(__dirname, "..");
const MIME = {".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".webmanifest": "application/manifest+json", ".png": "image/png", ".css": "text/css", ".svg": "image/svg+xml", ".webp": "image/webp"};
const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x"); let p = decodeURIComponent(u.pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  res.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const DAY = 864e5, iso = ms => new Date(ms).toISOString().slice(0, 10), day = k => iso(Date.now() + k * DAY);
const long = k => new Date(Date.now() + k * DAY).toLocaleDateString("en-US", {month: "long", day: "numeric", year: "numeric"});

// A Word file is a zip with word/document.xml
function docx(lines){
  const xml = `<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${lines.map(l => `<w:p><w:r><w:t xml:space="preserve">${l.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</w:t></w:r></w:p>`).join("")}</w:body></w:document>`;
  const files = [["[Content_Types].xml", '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"/>'], ["word/document.xml", xml]];
  const parts = [], central = []; let off = 0;
  for (const [name, text] of files) {
    const raw = Buffer.from(text), data = zlib.deflateRawSync(raw), nm = Buffer.from(name), crc = zlib.crc32(raw);
    const h = Buffer.alloc(30); h.writeUInt32LE(0x04034b50, 0); h.writeUInt16LE(20, 4); h.writeUInt16LE(8, 8); h.writeUInt32LE(crc, 14); h.writeUInt32LE(data.length, 18); h.writeUInt32LE(raw.length, 22); h.writeUInt16LE(nm.length, 26);
    const c = Buffer.alloc(46); c.writeUInt32LE(0x02014b50, 0); c.writeUInt16LE(20, 4); c.writeUInt16LE(20, 6); c.writeUInt16LE(8, 10); c.writeUInt32LE(crc, 16); c.writeUInt32LE(data.length, 20); c.writeUInt32LE(raw.length, 24); c.writeUInt16LE(nm.length, 28); c.writeUInt32LE(off, 42);
    parts.push(h, nm, data); central.push(c, nm); off += 30 + nm.length + data.length;
  }
  const cd = Buffer.concat(central), e = Buffer.alloc(22); e.writeUInt32LE(0x06054b50, 0); e.writeUInt16LE(files.length, 8); e.writeUInt16LE(files.length, 10); e.writeUInt32LE(cd.length, 12); e.writeUInt32LE(off, 16);
  return Buffer.concat(parts.concat([cd, e]));
}

const SYL = ["BIO 101: Cell Biology", "Instructor: Dr. Ada Park", "", "Grading", "Midterm 1 20%", "Midterm 2 20%", "Final Exam 40%", "Assignments 20%", "", "Schedule",
  long(-30) + ": Midterm 1", long(-10) + ": Assignment 1 due", long(20) + ": Midterm 2", long(25) + ": Assignment 2 due", long(45) + ": Final Exam"];
const T = (id, title, type, due, o) => Object.assign({id, title, courseId: "c1", type, due, start: due, time: "", status: "todo", priority: "med", created: 1000 + Number(id.replace(/\D/g, "")), order: 10}, o || {});
const PLANNER = () => ({v: 2, updated: 1, settings: {capacity: 15, dailyHours: 3}, courses: [{id: "c1", name: "Cell Biology", code: "BIO 101", color: "#3B6FE0", created: 1}], tasks: [
  T("a1", "Quiz 1", "Quiz", day(-40), {status: "done", doneAt: Date.now() - 38 * DAY, pct: 100, weight: 20, mark: {got: 92, outOf: 100}}),
  T("a2", "Lab 1", "Lab", day(-20), {status: "done", doneAt: Date.now() - 18 * DAY, pct: 100, weight: 20, mark: {got: 88, outOf: 100}}),
  T("a3", "Reading 1", "Reading", day(-2), {status: "done", doneAt: Date.now() - DAY, pct: 100}),
  T("a4", "Essay", "Assignment", day(10), {weight: 20}),
  T("a5", "Final Exam", "Exam", day(40), {weight: 40})]});

(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  const errs = [];
  // seed: a planner to start from; first: the very first run (nothing set up yet)
  const mk = async ({w = 1280, seed = null, first = false, local = true, pay = false} = {}) => {
    const ctx = await browser.newContext({viewport: {width: w, height: w < 500 ? 844 : 900}});
    await ctx.route(/supabase\.co/, r => r.abort());
    await ctx.addInitScript(([seed, first, local, pay]) => {
      try {
        if (sessionStorage.getItem("seeded")) return; sessionStorage.setItem("seeded", "1");
        if (local) localStorage.setItem("studioso:sb", JSON.stringify("local"));
        if (!first) { localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "done"); }
        else if (local) localStorage.setItem("studioso:welcomed", "1");
        if (seed) localStorage.setItem("coursework:v2", JSON.stringify(seed));
        if (pay) localStorage.setItem("studyboard:paywall-test", "1");
      } catch (e) {}
      window.__SB_TEST = 1;
    }, [seed, first, local, pay]);
    const page = await ctx.newPage(); page.on("pageerror", e => errs.push(e.message));
    await page.goto(base); await page.waitForSelector("#view", {state: "attached"}); await page.waitForTimeout(700);
    return {ctx, page};
  };
  const act = (page, a, id) => page.evaluate(([a, id]) => { const b = document.createElement("button"); b.dataset.act = a; if (id) b.dataset.id = id; b.hidden = true; document.body.appendChild(b); b.click(); b.remove(); }, [a, id || ""]);
  const txt = (page, sel) => page.evaluate(s => (document.querySelector(s) || {}).textContent || "", sel);
  const saved = page => page.evaluate(() => JSON.parse(localStorage.getItem("coursework:v2")));
  try {
    /* First run on the hosted app: closing the welcome works like Get Started (Use Without an Account) */
    {
      const {ctx, page} = await mk({first: true, local: false});
      await page.waitForSelector("dialog[open] #sbStart", {timeout: 20000});
      ok(await page.locator(".sem-card-b").count() === 0, "the semester card doesn't show behind the first sign-in");
      await page.click('dialog[open] .sheet-head [data-act="close"]');
      await page.waitForSelector(".sheet.ob", {timeout: 8000});
      ok(await page.evaluate(() => localStorage.getItem("studioso:sb") === '"local"' && !!localStorage.getItem("studioso:welcomed") && SBGUEST.is()), "closing it with × is remembered like Use Without an Account, and the setup starts");
      ok(await page.locator(".sem-card-b").count() === 0, "the semester card waits while the welcome setup is open");
      await page.click('.sheet.ob [data-ob="skip"]'); await page.waitForTimeout(400);
      await page.reload(); await page.waitForTimeout(2500);
      ok(await page.locator("dialog[open] form.sb-acct").count() === 0, "the sign-in sheet doesn't come back on every reload");
      // Sign-up: strength meter, Show, no username, one birthday box that says why
      await act(page, "sb-signin"); await page.waitForSelector('dialog[open] form.sb-acct [data-sbm="signup"]', {timeout: 15000});
      await page.click('dialog[open] [data-sbm="signup"]'); await page.waitForSelector('dialog[open] form.sb-acct[data-mode="signup"]');
      ok(await page.locator("dialog[open] [name=username]").count() === 0, "sign-up doesn't ask for a username (it's asked when first needed, for publishing)");
      ok(await page.locator("dialog[open] input[name=bday][type=date]").count() === 1 && /age rules/.test(await txt(page, "dialog[open] .bday")), "the birthday is one date box and says why it's asked");
      await page.fill("dialog[open] input[name=password]", "abcdefgh");
      ok(/Weak/.test(await txt(page, "#sbStrength")) && await page.getAttribute("dialog[open] .pw-meter", "data-s") === "1", "a strength meter reacts as you type: " + await txt(page, "#sbStrength"));
      await page.click("dialog[open] .pw-eye");
      ok(await page.getAttribute("dialog[open] input[name=password]", "type") === "text" && await page.getAttribute("dialog[open] .pw-eye", "aria-pressed") === "true", "Show reveals the password");
      const eye = await page.locator("dialog[open] .pw-eye").boundingBox(); ok(eye.height >= 40, "Show is a 40px target");
      await page.fill("dialog[open] input[name=email]", "new@example.com"); await page.fill("dialog[open] input[name=bday]", "2000-01-02");
      await page.click("dialog[open] [data-submit]"); await page.waitForTimeout(300);
      ok(/too easy to guess/.test(await txt(page, "#sbMsg")), "a weak password is refused at sign-up, like Change Password");
      await ctx.close();
    }

    /* First run on a phone: the essentials, a typed course isn't lost, the last button fits, and the semester setup skips courses */
    {
      const {ctx, page} = await mk({w: 390, first: true});
      await page.waitForSelector(".sheet.ob", {timeout: 15000});
      for (let i = 0; i < 8 && (await page.getAttribute(".sheet.ob", "data-step")) !== "done"; i++) {
        if ((await page.getAttribute(".sheet.ob", "data-step")) === "courses") { await page.fill("#obCode", "CHEM 110"); await page.fill("#obName", "Chemistry"); }
        await page.click('.sheet.ob [data-ob="next"]'); await page.waitForTimeout(150);
      }
      ok(await page.evaluate(() => Object.values(JSON.parse(localStorage.getItem("coursework:v2")).courses || {}).some(c => c.code === "CHEM 110")), "a course typed in the setup is added on Next");
      const go = await page.locator(".sheet.ob .ob-go").boundingBox();
      ok(go.height >= 40 && go.height <= 60, "Add My First Task is a normal-size button on a phone (" + Math.round(go.height) + "px)");
      await page.click('.sheet.ob [data-ob="semester"]'); await page.waitForSelector(".sem-sheet");
      ok(await page.getAttribute(".sem-st.cur", "data-id") === "work", "the semester setup starts at bringing in work, without asking for courses again");
      await page.click('.sem-sheet [data-sem="goto"][data-id="courses"]'); await page.waitForTimeout(150);
      await page.fill("#semCode", "PHYS 120"); await page.click('.sem-sheet [data-sem="next"]'); await page.waitForTimeout(200);
      ok(await page.evaluate(() => Object.values(JSON.parse(localStorage.getItem("coursework:v2")).courses || {}).some(c => c.code === "PHYS 120")), "in the semester setup too, Next adds a course that was typed in");
      await ctx.close();
    }

    /* Paste Grades: a preview, no made-up weights or dates, a total check and neutral wording */
    {
      const {ctx, page} = await mk({seed: PLANNER()});
      await act(page, "g-paste", "c1"); await page.waitForSelector("#pgIn");
      ok(/on your school's site/.test(await txt(page, "dialog[open]")) && !/Brightspace/.test(await txt(page, "dialog[open] .sheet-body p")), "without a connected site it says your school's site, not Brightspace");
      await page.fill("#pgIn", "Grade Item\tPoints\tWeight Achieved\tGrade\nQuiz 1\t9 / 10\t\t90 %\nMidterm Review\t45 / 50\t\t90 %\nLab 2\t18 / 20\t81 / 90\t90 %");
      await page.waitForSelector(".pg-list li");
      ok(await page.locator(".pg-list li").count() === 3, "pasted grades are previewed before anything is added");
      ok(await page.inputValue('[data-pg-w="1"]') === "" && await page.inputValue('[data-pg-w="2"]') === "90", "a weight is only filled in where the page shows one");
      ok(/more than 100%/.test(await txt(page, "#pgSum")) && await page.locator("#pgSum.pg-over").count() === 1, "weights over 100% are flagged: " + await txt(page, "#pgSum"));
      await page.fill('[data-pg-w="2"]', ""); await page.waitForTimeout(100);
      ok(/add up to 100%\./.test(await txt(page, "#pgSum")) && !/more than 100%/.test(await txt(page, "#pgSum")), "clearing the weight clears the warning: " + await txt(page, "#pgSum"));
      await page.click("#pgGo"); await page.waitForTimeout(300);
      const ts = Object.values((await saved(page)).tasks);
      const mr = ts.find(t => t.title === "Midterm Review"), lab = ts.find(t => t.title === "Lab 2"), q = ts.find(t => t.id === "a1");
      ok(mr && !mr.due && !(Number(mr.weight) > 0) && lab && !lab.due && !(Number(lab.weight) > 0), "new grades get no date and no invented weight: " + JSON.stringify([mr && [mr.due, mr.weight], lab && [lab.due, lab.weight]]));
      ok(q.mark.got === 9 && q.mark.outOf === 10 && Number(q.weight) === 20, "a matching task gets the mark and keeps its weight");
      await ctx.close();
    }

    /* Grades: a goal is asked for, the default message keeps the letter, the Pass Mark card is neutral, a short trend chart */
    {
      const {ctx, page} = await mk({seed: PLANNER()});
      await page.evaluate(() => { const {ui, render} = __sbSync; ui.tab = "courses"; ui.courseId = "c1"; ui.courseTab = "grades"; ui.courseTabFor = "c1"; render(); });
      await page.waitForSelector(".gr-card");
      const need = await txt(page, ".gr-need");
      ok(/To keep your A- \(90%\)/.test(need) && !/To pass/.test(need), "for an A- student, What You Need is about keeping the A-, not passing: " + need.replace(/\s+/g, " ").slice(0, 200));
      ok(await page.evaluate(() => { const p = document.querySelector(".gr-pass"), s = document.querySelector(".gr-stat:not(.gr-pass)"); return getComputedStyle(p).backgroundColor === getComputedStyle(s).backgroundColor; }), "the Pass Mark card has the same neutral look as the others");
      const gt = await page.locator(".gt-svg").boundingBox();
      ok(gt && gt.height <= 210 && gt.width >= 400, "the grade trend chart is wide and short (" + Math.round(gt.width) + "x" + Math.round(gt.height) + ")");
      ok(await page.locator(".gr-goal-ask .chip[data-act=g-goal]").count() >= 2, "with marks in and no goal, it asks what grade you're aiming for");
      await page.click('.gr-goal-ask [data-act="g-goal"][data-id="93"]'); await page.waitForTimeout(250);
      ok((await saved(page)).courses[0].grading.goal === 93 && await page.locator(".gr-goal-ask").count() === 0 && /Your goal: 93%/.test(await txt(page, ".gr-pass")), "one tap sets the goal");
      await page.evaluate(() => { const {ui, render, clone, state, applyChanges} = __sbSync, c = clone(state.courses.c1); c.grading = {}; applyChanges([{kind: "course", id: "c1", after: c}], ""); ui.courseId = null; ui.courseTab = "grades"; render(); });
      await page.waitForSelector(".gp-need");
      ok(!/to pass/.test(await txt(page, ".gp-need")) && /A-/.test(await txt(page, ".gp-need")), "the Grades page's What Do I Need? aims at the current letter: " + (await txt(page, ".gp-need")).replace(/\s+/g, " "));
      await ctx.close();
    }

    /* Syllabus import: past items wait under Already Past, per-item weights and their total, roomy fields, Word files */
    {
      const {ctx, page} = await mk({seed: PLANNER()});
      await act(page, "import-syllabus"); await page.waitForSelector("#impFile", {state: "attached"});
      ok(/\.docx/.test(await page.getAttribute("#impFile", "accept")), "the file picker accepts Word files");
      await page.evaluate(() => { document.querySelector("#impPaste").open = true; });
      await page.fill("#impText", SYL.join("\n")); await page.click("#impRead"); await page.waitForSelector("#impLists");
      const past = page.locator("#impLists details.imp-group", {hasText: "Already Past"});
      ok(await past.count() === 1 && /Already Past \(2\)/.test(await past.locator("summary").textContent()), "past-dated items are grouped under Already Past");
      ok(await past.locator("input[type=checkbox][data-n]:checked").count() === 0, "and left unticked");
      const w = await page.$$eval('#impLists input[data-f="weight"]', xs => xs.map(x => [x.closest("li").querySelector('[data-f="title"]').value, x.value]));
      const wOf = t => (w.find(x => x[0] === t) || [])[1];
      ok(wOf("Midterm 1") === "20" && wOf("Midterm 2") === "20" && wOf("Final Exam") === "40", "Midterm 1 20% and Midterm 2 20% keep 20% each: " + JSON.stringify(w));
      ok(/add up to 70%/.test(await txt(page, "#impWSum")), "the total of the ticked weights is shown: " + await txt(page, "#impWSum"));
      const box = await page.locator('#impLists input[data-f="weight"]').first().boundingBox(), dbox = await page.locator('#impLists input[data-f="due"]').first().boundingBox();
      ok(box.width >= 64 && dbox.width >= 130, "the weight and date boxes are wide enough to read (" + Math.round(box.width) + "px, " + Math.round(dbox.width) + "px)");
      await past.locator("summary").click();
      await past.locator("li", {hasText: ""}).filter({has: page.locator('input[value="Midterm 1"]')}).locator("input[type=checkbox][data-n]").check();
      await page.click("#impAdd"); await page.waitForTimeout(400);
      const ts = Object.values((await saved(page)).tasks);
      ok(ts.find(t => t.title === "Midterm 1").status === "done" && ts.find(t => t.title === "Midterm 2").status === "todo" && !ts.some(t => t.title === "Assignment 1"), "a past item ticked on purpose goes in as done; the others aren't added");
      await act(page, "import-syllabus"); await page.waitForSelector("#impFile", {state: "attached"});
      await page.setInputFiles("#impFile", {name: "syllabus.docx", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", buffer: docx(SYL)});
      await page.waitForSelector("#impLists", {timeout: 8000});
      ok(/Midterm 2/.test(await page.evaluate(() => [...document.querySelectorAll('#impLists [data-f="title"]')].map(x => x.value).join(", "))), "a .docx syllabus is read");
      await ctx.close();
    }

    /* School sites: connect from Courses and the Add Course chooser; without an account the calendar link says it needs one */
    {
      const {ctx, page} = await mk({seed: PLANNER()});
      await page.click('nav.tabs [data-tab="courses"]'); await page.waitForTimeout(250);
      await page.evaluate(() => { const b = document.querySelector('[data-act="cf-view"][data-id="courses"]'); if (b) b.click(); }); await page.waitForTimeout(200);
      ok(/Connect Canvas, Brightspace or Blackboard/.test(await txt(page, ".lms-bar")) && await page.locator('.lms-bar [data-act="lms-open"]').count() === 1, "the Courses page offers to connect a school site");
      const card = await txt(page, '.course-card[data-id="c1"]');
      ok(/3 of 5 done/.test(card), "the course card counts finished work the Board has tucked away: " + card.replace(/\s+/g, " ").slice(0, 120));
      await act(page, "fab-course"); await page.waitForSelector("dialog[open] .fm-list");
      ok(/Connect Canvas, Brightspace or Blackboard/.test(await txt(page, 'dialog[open] .fm-list [data-act="lms-open"]')), "the Add Course chooser has Connect Canvas, Brightspace or Blackboard");
      await page.click('dialog[open] .fm-list [data-act="lms-open"]'); await page.waitForSelector('dialog[open] .bs-pcard[data-act="cv-open"]');
      await page.click('dialog[open] .bs-pcard[data-act="cv-open"]'); await page.waitForSelector("dialog[open] .bs-sheet");
      const sh = await txt(page, "dialog[open] .bs-sheet");
      ok(/Needs a Free Account/.test(sh) && await page.locator('dialog[open] .bs-sheet [data-act="sb-signin"]').count() === 1 && await page.locator("#bsFeedIn").count() === 0, "without an account the calendar link says it needs a free one and offers Sign In");
      ok(await page.locator('dialog[open] .bs-sheet [data-act="cv-file"]').count() >= 1 && !/Settings, Sync\)/.test(sh), "it leads with importing a calendar file, and the old (Settings, Sync) wording is gone");
      ok(/website\/#download/.test(await page.getAttribute('dialog[open] .bs-sheet a[href*="download"]', "href")), "the desktop app is a link to the download page");
      await ctx.close();
    }

    /* The course page: work first, empty extras folded, the code once, older finished work under Show Older */
    for (const W of [390, 1280]) {
      const {ctx, page} = await mk({w: W, seed: PLANNER()});
      await page.evaluate(() => { const {ui, render} = __sbSync; ui.tab = "courses"; ui.courseId = "c1"; ui.courseTab = ""; render(); }); await page.waitForSelector(".c2-main");
      const order = await page.evaluate(() => { const m = document.querySelector(".c2-main"), h = [...m.querySelectorAll("h2.sec .t, details.c2-promo > summary")].map(x => x.textContent.trim()); return h; });
      ok(order.indexOf("To Do") >= 0 && order.findIndex(x => /Learning Objectives/.test(x)) > order.indexOf("To Do"), `${W}px: To Do comes before Learning Objectives: ` + order.join(" | "));
      ok(await page.locator(".c2-main details.c2-promo:not([open])", {hasText: "Learning Objectives"}).count() === 1, `${W}px: an empty Learning Objectives is folded to one line`);
      const head = await txt(page, ".c2-head");
      ok((head.match(/BIO 101/g) || []).length === 1, `${W}px: the course code shows once in the header`);
      ok(/Complete/.test(await txt(page, ".c2-main")) && await page.locator('.c2-main [data-act="cd-old"]').count() === 1 && /Show Older \(2\)/.test(await txt(page, '.c2-main [data-act="cd-old"]')), `${W}px: Complete has Show Older for finished work older than two weeks`);
      ok(/3 of 5 done/.test(head), `${W}px: the header counts every task: ` + head.replace(/\s+/g, " ").slice(0, 160));
      if (W === 390) { const b = await page.locator('.c2-main [data-act="cd-old"]').boundingBox(); ok(b.height >= 40, "Show Older is a 40px target on a phone"); }
      await page.click('.c2-main [data-act="cd-old"]'); await page.waitForTimeout(200);
      ok(/Quiz 1/.test(await txt(page, ".c2-main")) && /Hide Older/.test(await txt(page, '.c2-main [data-act="cd-old"]')), `${W}px: Show Older lists the graded work too`);
      await ctx.close();
    }

    /* Settings: backups in one place, Import and Export, and Grades inside Study Plan */
    {
      const {ctx, page} = await mk({seed: PLANNER()});
      await act(page, "menu"); await page.waitForSelector(".us-cat");
      await page.click('.us-cat[data-us="data"]'); await page.waitForTimeout(200);
      const subs = await page.$$eval(".us-pane.on .us-sub-tab", b => b.map(x => x.textContent));
      ok(subs.join() === "Backups,Import and Export,Cleanup", "Data and Backups: " + subs.join(", "));
      const vis = s => page.locator(s).first().isVisible();
      ok(await vis('.us-pane.on [data-act="export"]') && /Save a Copy on This Device/.test(await txt(page, '.us-pane.on [data-act="backup-now"]')), "Backups holds Export a Backup File, and Back Up Now says what it does");
      await page.evaluate(() => document.querySelectorAll(".us-pane.on .us-sub-tab")[1].click()); await page.waitForTimeout(150);
      ok(await vis('.us-pane.on [data-act="ia-open"]') && await vis('.us-pane.on [data-act="import"]'), "Import From Another App sits under Import and Export");
      await page.click('.us-cat[data-us="study"]'); await page.waitForTimeout(200);
      const st = await page.$$eval(".us-pane.on .us-sub-tab", b => b.map(x => x.textContent));
      ok(!st.includes("Grades") && await vis('.us-pane.on [data-act="g-grades"]'), "Grades is a row in Study Plan, not a tab of its own: " + st.join(", "));
      await ctx.close();
    }

    /* Start a New Term keeps work due later */
    {
      const {ctx, page} = await mk({seed: PLANNER()});
      await act(page, "new-term"); await page.waitForSelector('dialog[open] input[name="keep"]');
      ok(await page.isChecked('dialog[open] input[name="keep"]') && /Keep Unfinished Work Due After Today/.test(await txt(page, "dialog[open]")), "Keep Unfinished Work Due After Today is on by default");
      await page.click("dialog[open] [data-submit]"); await page.waitForTimeout(300);
      const all = Object.values((await saved(page)).tasks), ts = Object.fromEntries(all.map(t => [t.id, t]));
      ok(!ts.a4.archivedTerm && !ts.a5.archivedTerm && ts.a3.archivedTerm, "unfinished work due later stays; the rest goes to the Archive");
      await ctx.close();
    }

    /* The Pro sheet without an account */
    {
      const {ctx, page} = await mk({seed: PLANNER(), pay: true});
      await page.evaluate(() => StudyboardPlan.openSheet()); await page.waitForSelector(".plan-sheet");
      const body = await txt(page, ".plan-sheet");
      ok(/Create a Free Account to Get a Week of Pro/.test(body) && await page.locator('.plan-gift [data-act="plan-signup"]').count() === 1, "it leads with the free week that comes with an account");
      ok(!/Your Storage/.test(body), "no storage meter without an account");
      const y = s => page.evaluate(q => document.querySelector(q).getBoundingClientRect().top, s);
      ok(await y(".plan-gift") < await y(".plan-prices") && await y(".plan-prices") < await y(".plan-compare"), "the plan choice comes before the long comparison");
      await ctx.close();
    }
    ok(!errs.length, "no page errors: " + errs.join(" | "));
  } finally { await browser.close(); server.close(); }
  console.log(`\nqol-setup.e2e: ${n} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
