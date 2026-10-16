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
    // A calendar entry named a little differently from the assignment ("Group Care Plan Assignment" for the folder
    // "Group Care Plan – Individual"): Studyboard asks whether they're the same; once the student says Merge, the task made from the
    // calendar entry follows the assignment and ticks off; the answer is remembered, so it isn't asked again
    const H = due => ({ok: true, origin: "https://learn.example.edu", me: {name: "Ana"}, all: [], errors: [], items: [], completions: [],
      courses: [{ou: "7", code: "HSIP0100", name: "Health Sciences", quizzes: [], grades: [], news: [],
        folders: [{id: "9", name: "Group Care Plan – Individual", due, end: null, sub: true, files: []}, {id: "10", name: "Week 3 Reflection", due, end: null, sub: false, files: []}],
        events: [{id: "e1", title: "Group Care Plan Assignment Due", start: due, end: due, allDay: false, assoc: false, url: ""}, {id: "e2", title: "Week 3 Journal Due", start: due, end: due, allDay: false, assoc: false, url: ""}]}]});
    const due5 = new Date(Date.now() - 4 * DAY).toISOString();
    const r5 = await app.evaluate(h => {
      const L = SBLMS.brightspace, ts = h.courses[0].folders[0].due.slice(0, 10);
      SBLMS.applyChanges([{kind: "task", id: "cb", after: {id: "cb", created: 1, title: "Group Care Plan Assignment", courseId: "c1", type: "Assignment", due: ts, time: "23:30", status: "todo", order: 1,
        bs: {key: "7|groupcareplanassignment", ou: "7", last: {title: "Group Care Plan Assignment", due: ts, courseId: "c1"}, seen: {api: 1}}}}], "");
      const d = L.fromApi(h); L.applyPlan(d, L.plan(d), "grab", false);
      return {ask: d.ask.map(a => [a.copy, a.real]), cb: SBLMS.st().tasks.cb.status, recs: d.recs.map(r => r.title)};
    }, H(due5));
    ok(r5.cb === "todo" && JSON.stringify(r5.ask) === JSON.stringify([["Group Care Plan Assignment", "Group Care Plan – Individual"]]), "nothing is merged without asking; Studyboard asks about the pair: " + JSON.stringify(r5));
    ok(r5.recs.includes("Week 3 Journal") && r5.recs.includes("Week 3 Reflection") && r5.ask.length === 1, "two different items that only share a word aren't offered as a pair");
    await app.waitForSelector("dialog[open] .mg-row", {timeout: 5000});
    ok(/Same Item\?/.test(await app.textContent("dialog[open]")), "the student sees the pair and chooses");
    await app.click('dialog[open] [data-submit]');
    await app.waitForFunction(() => !SBLMS.st().tasks.cb, null, {timeout: 5000});
    const left = await app.evaluate(() => Object.values(SBLMS.st().tasks).filter(t => /Group Care Plan/.test(t.title)).map(t => [t.title, t.status]));
    ok(JSON.stringify(left) === JSON.stringify([["Group Care Plan – Individual", "done"]]), "after Merge there's one task for it, done because the assignment is submitted: " + JSON.stringify(left));
    const again = await app.evaluate(h => SBLMS.brightspace.fromApi(h).ask.length, H(due5));
    ok(again === 0, "the answer is remembered: the pair isn't asked about again");
    // Link to an Item: a task tied to something that doesn't say whether it's submitted; the student picks the real item
    const r6 = await app.evaluate(due => {
      const L = SBLMS.brightspace, ts = due.slice(0, 10);
      SBLMS.applyChanges([{kind: "task", id: "lk", after: {id: "lk", created: 1, title: "Capacity Building Assignment", courseId: "c1", type: "Assignment", due: ts, time: "23:30", status: "todo", order: 1,
        bs: {key: "7|capacitybuildingassignment", ou: "7", last: {title: "Capacity Building Assignment", due: ts, courseId: "c1"}, seen: {api: 1}}}}], "");
      const h = {ok: true, origin: "https://learn.example.edu", me: {name: "Ana"}, all: [], errors: [], items: [], completions: [],
        courses: [{ou: "7", code: "HSIP0100", name: "Health Sciences", quizzes: [], grades: [], news: [], folders: [{id: "31", name: "CB Project Upload", due, end: null, sub: true, files: []}],
          events: [{id: "e9", title: "Capacity Building Assignment Due", start: due, end: due, allDay: false, assoc: false, url: ""}]}]};
      const d = L.fromApi(h); L.applyPlan(d, L.plan(d), "grab", true);
      return SBLMS_TASK(SBLMS.st().tasks.lk);
    }, new Date(Date.now() - 4 * DAY).toISOString());
    ok(/Link to a Brightspace Item/.test(r6), "a task the read didn't say anything about offers Link to a Brightspace Item");
    await app.evaluate(() => { const d = document.querySelector("#dlg"); if (d.open) d.close(); });
    await app.evaluate(() => { const b = document.createElement("button"); b.dataset.act = "lms-link"; b.dataset.id = "lk"; document.body.appendChild(b); b.click(); });
    await app.waitForSelector('dialog[open] [data-act="lms-link-pick"]', {timeout: 5000});
    const rows = await app.evaluate(() => [...document.querySelectorAll("dialog[open] .mg-row")].map(r => r.innerText.replace(/\s+/g, " ")));
    ok(rows.some(r => /CB Project Upload/.test(r) && /Submitted/.test(r)), "it lists the course's items with what each said: " + JSON.stringify(rows));
    await app.click('dialog[open] .mg-row:has-text("CB Project Upload") [data-act="lms-link-pick"]');
    await app.waitForFunction(() => !SBLMS.st().tasks.lk || SBLMS.st().tasks.lk.status === "done", null, {timeout: 5000});
    const linked = await app.evaluate(() => Object.values(SBLMS.st().tasks).filter(t => /CB Project Upload|Capacity Building Assignment/.test(t.title) && !["t1", "x1"].includes(t.id)).map(t => [t.title, t.status]));
    ok(linked.length === 1 && linked[0][1] === "done", "after picking it, there's one task for it, done because the item is submitted: " + JSON.stringify(linked));
    // A quiz whose due date is before it even opens (a midterm "due" 10 days ago that opens today): it's due when it's open
    const q = await app.evaluate(() => {
      const now = new Date(), at = (d, h, m) => new Date(now.getFullYear(), now.getMonth(), now.getDate() + d, h, m).toISOString();
      const d = SBLMS.brightspace.fromApi({ok: true, origin: "https://learn.example.edu", me: {}, all: [], errors: [], items: [], completions: [],
        courses: [{ou: "7", code: "BSNC1000", name: "Nursing", folders: [], grades: [], news: [], events: [], quizzes: [{id: "5", name: "BSNC 1000 Midterm Exam", due: at(-10, 23, 59), start: at(0, 9, 50), end: at(0, 11, 30), gid: "", text: "", limit: 90}]}]});
      return [d.recs[0].due, d.recs[0].time, (() => { const n = new Date(); return n.getFullYear() + "-" + String(n.getMonth() + 1).padStart(2, "0") + "-" + String(n.getDate()).padStart(2, "0"); })()];
    });
    ok(q[0] === q[2] && q[1] === "09:50", "a quiz due before it opens is due when it's open (today 9:50): " + JSON.stringify(q));
    // The same exam from Brightspace (the quiz) and a calendar entry with a room: Studyboard asks, and Merge keeps one with the link and the room
    await app.evaluate(() => { const d = document.querySelector("#dlg"); if (d.open) d.close(); });
    await app.evaluate(() => {
      const td = (() => { const n = new Date(); return n.getFullYear() + "-" + String(n.getMonth() + 1).padStart(2, "0") + "-" + String(n.getDate()).padStart(2, "0"); })();
      SBLMS.applyChanges([
        {kind: "task", id: "mq", after: {id: "mq", created: 1, title: "BSNC 1000 Midterm Exam- Requires Respondus LockDown Browser", courseId: "c1", type: "Exam", due: td, time: "10:10", status: "todo", order: 1, bs: {key: "7|bsncmidtermexamrequiresrespondus", ou: "7", last: {}, seen: {api: 1}}}},
        {kind: "task", id: "mc", after: {id: "mc", created: 1, title: "NK1 Midterm Exam", courseId: "c1", type: "Exam", due: td, time: "09:30", location: "SW1 Room 2015", status: "todo", order: 1, notes: "Bring student ID"}},
        {kind: "task", id: "mo", after: {id: "mo", created: 1, title: "Chemistry Quiz 3", courseId: "c1", type: "Quiz", due: td, time: "13:00", status: "todo", order: 1}}], "");
      SBLMS_DUPES(false);
    });
    await app.waitForSelector("dialog[open] .mg-row", {timeout: 5000});
    const pairs = await app.evaluate(() => [...document.querySelectorAll("dialog[open] .mg-row")].map(r => r.innerText.replace(/\s+/g, " ")));
    ok(pairs.some(p => /BSNC 1000 Midterm/.test(p) && /NK1 Midterm Exam/.test(p)) && !pairs.some(p => /Chemistry Quiz 3/.test(p)) && /Same (Exam|Item)\?/.test(await app.textContent("dialog[open]")), "the same exam listed twice is put to the student (and not an unrelated quiz): " + JSON.stringify(pairs));
    await app.click("dialog[open] [data-submit]");
    await app.waitForFunction(() => !SBLMS.st().tasks.mc, null, {timeout: 5000});
    const kept = await app.evaluate(() => { const t = SBLMS.st().tasks.mq; return {loc: t.location, notes: t.notes, key: t.bs && t.bs.key}; });
    ok(kept.loc === "SW1 Room 2015" && /student ID/.test(kept.notes) && kept.key, "Merge keeps the Brightspace one with the room and notes: " + JSON.stringify(kept));
    await app.evaluate(() => SBLMS_DUPES(false)); await app.waitForTimeout(300);
    ok(!(await app.locator("dialog[open] .mg-row").count()), "and it isn't asked again");
    // Start Fresh: removes what came from Brightspace that you haven't changed, keeps the rest, turns off the calendar link; Undo puts it back
    await app.evaluate(() => { const d = document.querySelector("#dlg"); if (d.open) d.close(); });
    await app.evaluate(() => {
      const mk = (id, title, extra) => ({kind: "task", id, after: Object.assign({id, created: 1, title, courseId: "c1", type: "Assignment", due: "2026-12-01", time: "", status: "todo", order: 1}, extra)});
      const bs = (title, more) => ({bs: Object.assign({key: "7|" + title.toLowerCase().replace(/[^a-z0-9]/g, ""), ou: "7", last: {title, due: "2026-12-01", time: "", courseId: "c1"}, seen: {feed: 1}}, more || {})});
      SBLMS.applyChanges([mk("sf1", "Fresh Untouched", bs("Fresh Untouched")), mk("sf2", "Fresh Renamed By Me", bs("Fresh Original")), mk("sf3", "My Own Task", {}),
        mk("sf4", "Fresh With Checklist", Object.assign({checklist: [{id: "a", text: "outline", done: false}]}, bs("Fresh With Checklist"))),
        {kind: "event", id: "sfe", after: {id: "sfe", created: 1, title: "Fresh Lecture", courseId: "c1", date: "2026-12-02", start: "09:00", end: "10:00", allDay: false, bs: {key: "7|freshlecture|2026-12-02", ou: "7", last: {title: "Fresh Lecture", date: "2026-12-02", start: "09:00", end: "10:00"}}}}], "");
      SBLMS.brightspace.startFresh();
    });
    await app.waitForSelector("dialog[open] [data-submit]", {timeout: 5000});
    const freshText = await app.textContent("dialog[open]");
    ok(/Start Fresh with Brightspace\?/.test(freshText) && /Fresh Renamed By Me/.test(freshText) && /you edited it/.test(freshText) && /Fresh With Checklist/.test(freshText), "Start Fresh says what it removes and lists what it keeps, and why");
    await app.click("dialog[open] [data-submit]");
    await app.waitForFunction(() => !SBLMS.st().tasks.sf1, null, {timeout: 5000});
    const after = await app.evaluate(() => { const st = SBLMS.st(); return {sf1: !!st.tasks.sf1, sf2: !!st.tasks.sf2, sf3: !!st.tasks.sf3, sf4: !!st.tasks.sf4, ev: !!(st.events || {}).sfe, dropped: (SBLMS.brightspace.cfg().dropped || []).includes("7|freshuntouched")}; });
    ok(!after.sf1 && !after.ev && after.sf2 && after.sf3 && after.sf4, "it removes only Brightspace items you haven't changed: " + JSON.stringify(after));
    ok(!after.dropped, "and they aren't remembered as deleted by you, so the next read brings them back");
    await app.click("#toastUndo");
    await app.waitForFunction(() => !!SBLMS.st().tasks.sf1, null, {timeout: 5000});
    ok(await app.evaluate(() => !!(SBLMS.st().events || {}).sfe), "Undo puts everything back");
    // Where this came from: tucked away at the bottom of the task's sheet
    const src = await app.evaluate(() => { const L = SBLMS.brightspace; const d = L.fromApi({ok: true, origin: "https://learn.example.edu", me: {}, all: [], errors: [], items: [], completions: [], courses: [{ou: "7", code: "HSIP0100", name: "Health Sciences", folders: [{id: "77", name: "Source Check Essay", due: new Date(Date.now() + 5 * 864e5).toISOString(), end: null, sub: null, files: []}], quizzes: [], grades: [], news: [], events: []}]}); d.via = "extension"; L.applyPlan(d, L.plan(d), "grab", true); const t = Object.values(SBLMS.st().tasks).find(x => x.title === "Source Check Essay"); return SBLMS_TASK(t).replace(/<[^>]+>/g, " ").replace(/\s+/g, " "); });
    ok(/Where this came from/.test(src) && /Added by the Studyboard School Sync extension/.test(src), "a task's sheet says, tucked away, what added it: " + src.slice(-160));
    // Deleted by you: a sync keeps it off; Bring Them Back (in the platform's settings) lets the next read bring it back
    await app.evaluate(() => { const d = document.querySelector("#dlg"); if (d.open) d.close(); });
    const DROP = {ok: true, origin: "https://learn.example.edu", me: {}, all: [], errors: [], items: [], completions: [], courses: [{ou: "7", code: "HSIP0100", name: "Health Sciences", folders: [{id: "88", name: "Deleted Then Wanted", due: new Date(Date.now() + 6 * 864e5).toISOString(), end: null, sub: null, files: []}], quizzes: [], grades: [], news: [], events: []}]};
    const dr = await app.evaluate(h => {
      const L = SBLMS.brightspace, read = () => { const d = L.fromApi(h); L.applyPlan(d, L.plan(d), "grab", true); return Object.values(SBLMS.st().tasks).find(t => t.title === "Deleted Then Wanted"); };
      const t = read(); SBLMS.applyChanges([{kind: "task", id: t.id, after: null}], "");
      return {kept: !read(), dropped: (L.cfg().dropped || []).length};
    }, DROP);
    ok(dr.kept && dr.dropped > 0, "an assignment you delete stays deleted when syncing: " + JSON.stringify(dr));
    await app.evaluate(() => SBLMS.brightspace.bsSheet());
    await app.waitForSelector('dialog[open] [data-act="bs-undrop"]', {timeout: 5000});
    ok(/kept off/.test(await app.textContent("dialog[open]")), "the platform's settings say deleted items are kept off");
    await app.click('dialog[open] [data-act="bs-undrop"]');
    await app.waitForSelector('dialog[open] input[name="ubWay"]', {timeout: 5000});
    ok(/Studyboard bookmark/.test(await app.textContent("dialog[open]")) && await app.locator('dialog[open] input[name="ubWay"][value="any"]').count() === 0, "Bring Them Back offers a signed-in read (here the bookmark; no calendar link to offer)");
    await app.click("dialog[open] [data-submit]");
    const viaFeed = await app.evaluate(h => { const L = SBLMS.brightspace, d = L.fromApi(h); d.src = "feed"; L.applyPlan(d, L.plan(d), "feed", true); return !!Object.values(SBLMS.st().tasks).find(t => t.title === "Deleted Then Wanted"); }, DROP);
    ok(!viaFeed, "the calendar link doesn't bring it back");
    const back = await app.evaluate(h => { const L = SBLMS.brightspace, d = L.fromApi(h); L.applyPlan(d, L.plan(d), "grab", true); return {dropped: (L.cfg().dropped || []).length, apiOnly: (L.cfg().apiOnly || []).length, back: !!Object.values(SBLMS.st().tasks).find(t => t.title === "Deleted Then Wanted")}; }, DROP);
    ok(back.dropped === 0 && back.back, "the signed-in read (extension, bookmark or app) brings it back: " + JSON.stringify(back));
    // A calendar copy named nothing like the assignment ("Capacity Building Assignment" for "Upload Portal Week 6"), due the same day as the
    // only assignment in that course: Studyboard asks Same Item? by itself after the read, and Merge leaves the real one, done
    await app.evaluate(() => { const d = document.querySelector("#dlg"); if (d.open) d.close(); });
    const cdue = new Date(Date.now() + 9 * 864e5).toISOString(), cday = cdue.slice(0, 10);
    await app.evaluate(day => SBLMS.applyChanges([{kind: "task", id: "cpy", after: {id: "cpy", created: 1, title: "Totally Different Calendar Name", courseId: "c1", type: "Assignment", due: day, time: "", status: "todo", order: 1,
      bs: {key: "7|totallydifferentcalendarname", ou: "7", last: {title: "Totally Different Calendar Name", due: day, time: "", courseId: "c1"}, seen: {feed: 1}}}}], ""), cday);
    await app.evaluate(due => { const L = SBLMS.brightspace, d = L.fromApi({ok: true, origin: "https://learn.example.edu", me: {}, all: [], errors: [], items: [], completions: [],
      courses: [{ou: "7", code: "HSIP0100", name: "Health Sciences", folders: [{id: "91", name: "Upload Portal Week 6", due, end: null, sub: true, files: []}], quizzes: [], grades: [], news: [], events: []}]}); L.applyPlan(d, L.plan(d), "grab", true, {askLoud: true}); }, cdue);
    await app.waitForSelector("dialog[open] .mg-row", {timeout: 6000});
    const cp = await app.evaluate(() => [...document.querySelectorAll("dialog[open] .mg-row")].map(r => r.innerText.replace(/\s+/g, " ")));
    ok(cp.some(r => /Upload Portal Week 6/.test(r) && /Totally Different Calendar Name/.test(r) && /submitted/.test(r)), "Studyboard pairs the calendar copy with the only assignment due that day, and asks: " + JSON.stringify(cp));
    await app.click("dialog[open] [data-submit]");
    await app.waitForFunction(() => !SBLMS.st().tasks.cpy, null, {timeout: 5000});
    const realLeft = await app.evaluate(() => Object.values(SBLMS.st().tasks).filter(t => t.title === "Upload Portal Week 6").map(t => t.status));
    ok(JSON.stringify(realLeft) === JSON.stringify(["done"]), "after Merge, only the real assignment is left, done because it's submitted: " + JSON.stringify(realLeft));
    // The real case: the assignment folder has no date of its own ("Capacity Building with a Community Client"), and its date is only on a
    // calendar entry ("Capacity Building Assignment Due"); the task made from the entry ticks off because the folder is submitted
    const und = await app.evaluate(due => {
      const L = SBLMS.brightspace, ts = due.slice(0, 10);
      SBLMS.applyChanges([{kind: "task", id: "und", after: {id: "und", created: 1, title: "Outreach Planning Assignment", courseId: "c1", type: "Assignment", due: ts, time: "23:30", status: "todo", order: 1,
        bs: {key: "7|outreachplanningassignment", ou: "7", last: {title: "Outreach Planning Assignment", due: ts, time: "23:30", courseId: "c1"}, seen: {api: 1}}}}], "");
      const d = L.fromApi({ok: true, origin: "https://learn.example.edu", me: {}, all: [], errors: [], items: [], completions: [],
        courses: [{ou: "7", code: "HSIP0100", name: "Health Sciences", quizzes: [], grades: [], news: [],
          folders: [{id: "96", name: "Outreach Planning with a Partner Agency", due: null, end: null, sub: true, files: []}, {id: "97", name: "Unrelated Lab Report", due: null, end: null, sub: false, files: []}],
          events: [{id: "e7", title: "Outreach Planning Assignment Due", start: due, end: due, allDay: false, assoc: false, url: ""}]}]});
      L.applyPlan(d, L.plan(d), "grab", true);
      const t = SBLMS.st().tasks.und; return {status: t.status, item: t.bs.item, url: t.link || ""};
    }, new Date(Date.now() - 4 * 864e5).toISOString());
    ok(und.status === "done" && und.item === true && /db=96/.test(und.url), "an undated assignment's submission reaches the calendar entry that carries its date: " + JSON.stringify(und));
    // The same with what Brightspace often sends: the folder has no due date but does close at the end of term, so it must not become a
    // task of its own on that day; and a calendar entry Brightspace links to the folder gives the folder its date
    const und2 = await app.evaluate(due => {
      const L = SBLMS.brightspace, ts = due.slice(0, 10), end = new Date(Date.now() + 60 * 864e5).toISOString();
      SBLMS.applyChanges([{kind: "task", id: "und2", after: {id: "und2", created: 1, title: "Capacity Building Assignment", courseId: "c1", type: "Assignment", due: ts, time: "23:30", status: "todo", order: 1,
        bs: {key: "8|capacitybuildingassignment", ou: "8", last: {title: "Capacity Building Assignment", due: ts, time: "23:30", courseId: "c1"}, seen: {api: 1}}}}], "");
      const d = L.fromApi({ok: true, origin: "https://learn.example.edu", me: {}, all: [], errors: [], items: [], completions: [],
        courses: [{ou: "8", code: "NURS2000", name: "Community Health", quizzes: [], grades: [], news: [],
          folders: [{id: "81", name: "Capacity Building with a Community Client", due: null, end: end, sub: true, files: []},
                    {id: "82", name: "Reflective Journal Entry", due: null, end: end, sub: true, files: []},
                    {id: "83", name: "Group Teaching Plan", due: null, end: end, sub: false, files: []}],
          events: [{id: "e8", title: "Capacity Building Assignment Due", start: due, end: due, allDay: false, assoc: false, url: ""},
                   {id: "e9", title: "Reflective Journal Entry - Due", start: due, end: due, allDay: false, assoc: true, kind: "Dropbox", url: ""}]}]});
      L.applyPlan(d, L.plan(d), "grab", true);
      const all = Object.values(SBLMS.st().tasks).filter(t => t.bs && t.bs.ou === "8");
      const t = SBLMS.st().tasks.und2, j = all.find(x => /Reflective/.test(x.title)), g = all.find(x => /Teaching/.test(x.title));
      return {status: t.status, url: t.link || "", n: all.filter(x => /Capacity/.test(x.title)).length, j: j && [j.status, j.due], g: g && [g.status, g.due], ts, endD: end.slice(0, 10)};
    }, new Date(Date.now() - 4 * 864e5).toISOString());
    ok(und2.status === "done" && /db=81/.test(und2.url) && und2.n === 1, "a folder with only an end date still lends its submission to its calendar entry, with no second task: " + JSON.stringify(und2));
    ok(und2.j && und2.j[0] === "done" && und2.j[1] === und2.ts, "a calendar entry linked to an undated folder gives it its date: " + JSON.stringify(und2));
    ok(und2.g && und2.g[0] !== "done" && und2.g[1] === und2.endD, "an unmatched undated folder is still a task on the day it closes: " + JSON.stringify(und2));
    // The midterm: Brightspace's quiz says only "Available on Oct 6" (no due or end date) and is submitted; the calendar entry for the sitting
    // ("NK1 Midterm Exam") is today at 9:30 in a room. The quiz takes the entry's day, time and room, and Same Item? puts the two together.
    await app.evaluate(() => { const d = document.querySelector("#dlg"); if (d.open) d.close(); });
    const mt = new Date(Date.now() + 2 * 3600e3), mday = mt.toISOString().slice(0, 10), opened = new Date(Date.now() - 10 * 864e5).toISOString();
    const MQ = opened => ({ok: true, origin: "https://learn.example.edu", me: {}, all: [], errors: [], items: [], completions: [],
      courses: [{ou: "9", code: "BSNC1000", name: "Nursing Knowledge", folders: [], grades: [], news: [], events: [],
        quizzes: [{id: "501", name: "BSNC 1000 Midterm Exam- Requires Respondus LockDown Browser", due: null, end: null, start: opened, done: false}]}]});
    // before: an earlier read made the quiz a task on the day it opened (as it was), and the calendar made the sitting a task of its own
    const before = await app.evaluate(([h, day]) => { const L = SBLMS.brightspace, d = L.fromApi(h); L.applyPlan(d, L.plan(d), "grab", true);
      SBLMS.applyChanges([{kind: "task", id: "mc", after: {id: "mc", created: 1, title: "NK1 Midterm Exam", courseId: Object.values(SBLMS.st().tasks).find(t => t.bs && t.bs.ou === "9").courseId, type: "Exam", due: day, time: "09:30", status: "todo", order: 2,
        bs: {key: "9|nk1midtermexam", ou: "9", last: {title: "NK1 Midterm Exam", due: day, time: "09:30"}, seen: {feed: 1}}}}], "");
      return Object.values(SBLMS.st().tasks).filter(t => t.bs && t.bs.ou === "9").map(t => t.due); }, [MQ(opened), mday]);
    ok(before.length === 2, "set up: the quiz task and the calendar task: " + JSON.stringify(before));
    const mres = await app.evaluate(([at, opened]) => {
      const L = SBLMS.brightspace, d = L.fromApi({ok: true, origin: "https://learn.example.edu", me: {}, all: [], errors: [], items: [], completions: [],
        courses: [{ou: "9", code: "BSNC1000", name: "Nursing Knowledge", folders: [], grades: [], news: [],
          quizzes: [{id: "501", name: "BSNC 1000 Midterm Exam- Requires Respondus LockDown Browser", due: null, end: null, start: opened, done: true}],
          events: [{id: "e50", title: "NK1 Midterm Exam", start: at, end: new Date(Date.parse(at) + 2 * 3600e3).toISOString(), allDay: false, assoc: false, where: "SW3 4676/95", url: ""}]}]});
      const q = d.recs.find(r => r.pid === "q501");
      L.applyPlan(d, L.plan(d), "grab", true, {askLoud: true});
      return {due: q && q.due, loc: q && q.location, ask: d.ask.length};
    }, [mt.toISOString(), opened]);
    ok(mres.due === mday && mres.loc === "SW3 4676/95" && mres.ask === 1, "a quiz with only an opening date takes the day and room of its calendar entry, and the pair is asked about: " + JSON.stringify(mres));
    await app.waitForSelector("dialog[open] .mg-row", {timeout: 6000});
    const mrow = await app.evaluate(() => [...document.querySelectorAll("dialog[open] .mg-row")].map(r => r.innerText.replace(/\s+/g, " ")));
    ok(mrow.some(r => /NK1 Midterm Exam/.test(r) && /BSNC 1000 Midterm/.test(r)), "Same Item? shows the midterm pair: " + JSON.stringify(mrow));
    await app.click("dialog[open] [data-submit]");
    await app.waitForFunction(() => !SBLMS.st().tasks.mc, null, {timeout: 5000});
    const mleft = await app.evaluate(() => Object.values(SBLMS.st().tasks).filter(t => /Midterm/.test(t.title) && t.bs && t.bs.ou === "9").map(t => [t.title, t.status, t.due]));
    ok(mleft.length === 1 && mleft[0][1] === "done" && mleft[0][2] === mday, "after Merge, one midterm is left, on today's date, done because it was submitted: " + JSON.stringify(mleft));
    // The same, when the sitting is only in Studyboard from the calendar link (the read itself has no calendar entry for it)
    await app.evaluate(() => { const d = document.querySelector("#dlg"); if (d.open) d.close(); });
    const MQ2 = (opened, done) => ({ok: true, origin: "https://learn.example.edu", me: {}, all: [], errors: [], items: [], completions: [],
      courses: [{ou: "10", code: "BSNC1001", name: "Nursing Practice", folders: [], grades: [], news: [], events: [],
        quizzes: [{id: "601", name: "BSNC 1001 Midterm Exam- Requires Respondus LockDown Browser", due: null, end: null, start: opened, done}]}]});
    await app.evaluate(([h, day]) => { const L = SBLMS.brightspace, d = L.fromApi(h); L.applyPlan(d, L.plan(d), "grab", true);
      SBLMS.applyChanges([{kind: "task", id: "mc2", after: {id: "mc2", created: 1, title: "NK2 Midterm Exam", courseId: Object.values(SBLMS.st().tasks).find(t => t.bs && t.bs.ou === "10").courseId, type: "Exam", due: day, time: "09:30", location: "SW3 4676/95", status: "todo", order: 2,
        bs: {key: "77|nk2midtermexam", ou: "77", last: {title: "NK2 Midterm Exam", due: day, time: "09:30"}, seen: {feed: 1}}}}], ""); }, [MQ2(opened, false), mday]);
    const m2 = await app.evaluate(h => { const L = SBLMS.brightspace, d = L.fromApi(h), q = d.recs.find(r => r.pid === "q601");
      L.applyPlan(d, L.plan(d), "grab", true, {askLoud: true}); return {due: q && q.due, loc: q && q.location, ask: d.ask.length}; }, MQ2(opened, true));
    ok(m2.due === mday && m2.loc === "SW3 4676/95" && m2.ask === 1, "a calendar-link task in the same course gives the quiz its day and room, and the pair is asked about: " + JSON.stringify(m2));
    await app.waitForSelector("dialog[open] .mg-row", {timeout: 6000});
    await app.click("dialog[open] [data-submit]");
    await app.waitForFunction(() => !SBLMS.st().tasks.mc2, null, {timeout: 5000});
    const m2left = await app.evaluate(() => Object.values(SBLMS.st().tasks).filter(t => /Midterm/.test(t.title) && t.bs && (t.bs.ou === "10" || t.bs.ou === "77")).map(t => [t.title, t.status, t.due]));
    ok(m2left.length === 1 && m2left[0][1] === "done" && m2left[0][2] === mday, "after Merge, one midterm, today, done: " + JSON.stringify(m2left));
    ok(!errs.length, "no page errors: " + errs.join(" | "));
  } finally { await browser.close(); server.close(); }
  console.log(`\nlms-phase.e2e: ${n} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
