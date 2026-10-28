// node tests/lms-deleted-course.e2e.js
// A school course you deleted from Studyboard isn't added back by the next sync; restoring it, or choosing it again, brings it back
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

const SEED = {v: 2, updated: 1, tasks: [], courses: [{id: "c10", created: 1, name: "Context of Nursing", code: "BSNC 1020", color: "#22c55e", links: [], meetings: []}],
  settings: {brightspace: {host: "learn.example.edu", mode: "api", name: "Ana", map: {"10": "c10"}, courses: {"10": {code: "BSNC1020", name: "BSNC-1020-0 - Context of Nursing"}}}}};
const course = (ou, code, name, quiz) => ({ou, code, name, folders: [], grades: [], news: [], discussions: [], staff: [], events: [],
  quizzes: [{id: "q" + ou, name: quiz, due: iso(5), start: iso(4), end: null, done: false}], marks: []});
const H = () => ({ok: true, origin: "https://learn.example.edu", me: {name: "Ana"}, all: [], errors: [], items: [], completions: [], courses: [
  Object.assign(course("10", "BSNC1020", "BSNC-1020-0 - Context of Nursing", "Quiz 3"), {events: [{id: "ev1", ou: "10", title: "Lecture", text: "", start: iso(2), end: iso(2.04), allDay: false, where: "Room 5", assoc: false, kind: "", eid: "", url: ""}]}),
  course("30", "", "Safer Campuses for Everyone", "Module 1 Check"),
  course("40", "COMM1116", "Business Communication", "Quiz 1")]});

(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://127.0.0.1:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  try {
    const ctx = await browser.newContext({viewport: {width: 1100, height: 900}, serviceWorkers: "block"});
    await ctx.route(/supabase\.co/, r => r.abort());
    await ctx.addInitScript(s => { try { if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("coursework:v2", JSON.stringify(s)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:tour", "done"); localStorage.setItem("studioso:sb", JSON.stringify("local")); } } catch (e) {} }, SEED);
    const page = await ctx.newPage(), errs = []; page.on("pageerror", e => errs.push(e.message));
    await page.goto(base); await page.waitForFunction(() => window.SBLMS && SBLMS.brightspace && SBLMS.st().courses.c10, null, {timeout: 40000});
    const sync = () => page.evaluate(h => { const L = SBLMS.brightspace, d = L.fromApi(h), p = L.plan(d); L.applyPlan(d, p, "grab", true); const x = document.querySelector("#dlg"); if (x && x.open) x.close(); return p.rep.courses; }, H());
    const look = () => page.evaluate(() => { const st = SBLMS.st(), c = SBLMS.brightspace.cfg();
      return {courses: Object.values(st.courses).map(x => x.name), tasks: Object.values(st.tasks).map(t => t.title + "@" + ((st.courses[t.courseId] || {}).name || "?")), map: c.map, gone: c.goneCourses || {}}; });
    const idOf = name => page.evaluate(nm => (Object.values(SBLMS.st().courses).find(x => x.name === nm) || {}).id, name);

    // First sync brings in both new courses
    const made = await sync(); let s = await look();
    ok(made.length === 2 && s.courses.includes("Safer Campuses for Everyone") && s.courses.includes("Business Communication"), "the first sync adds the two new courses: " + JSON.stringify(s.courses));

    // Delete one through the app, the way you would
    const safer = await idOf("Safer Campuses for Everyone");
    await page.evaluate(id => { const b = document.createElement("button"); b.dataset.act = "delete-course"; b.dataset.id = id; document.body.appendChild(b); b.click(); b.remove(); }, safer);
    await page.waitForTimeout(300);
    await page.locator("dialog[open] button", {hasText: "Delete Course"}).last().click(); await page.waitForTimeout(400);
    s = await look();
    ok(!s.courses.includes("Safer Campuses for Everyone") && s.map["30"] === "skip" && s.gone["30"] === safer, "deleting it remembers to keep it off: " + JSON.stringify({map: s.map, gone: s.gone}));
    for (let i = 0; i < 2; i++) await sync();
    s = await look();
    ok(!s.courses.includes("Safer Campuses for Everyone") && !s.tasks.some(t => /Module 1 Check/.test(t)), "syncing again doesn't add it back, or its work: " + JSON.stringify(s));
    ok(s.tasks.some(t => t === "Quiz 3@Context of Nursing") && s.tasks.some(t => t === "Quiz 1@Business Communication"), "other courses still sync: " + JSON.stringify(s.tasks));

    // Deleted somewhere the app can't see coming (another device): Recently Deleted still holds it, so it stays off
    const comm = await idOf("Business Communication");
    await page.evaluate(id => SBLMS.applyChanges([{kind: "course", id, after: null}, ...Object.values(SBLMS.st().tasks).filter(t => t.courseId === id).map(t => ({kind: "task", id: t.id, after: null}))], "gone"), comm);
    await sync(); s = await look();
    ok(!s.courses.includes("Business Communication") && s.map["40"] === "skip" && s.gone["40"] === comm, "a course deleted on another device isn't added back either: " + JSON.stringify({c: s.courses, map: s.map}));

    // Restored from Recently Deleted: syncing picks it up again
    await page.evaluate(id => { const e = Object.values(SBLMS.st().trash || {}).find(x => (x.items || []).some(i => i.kind === "course" && i.id === id)); SBLMS.applyChanges(e.items.map(i => ({kind: i.kind, id: i.id, after: i.data})), "back"); }, comm);
    await sync(); s = await look();
    ok(s.courses.filter(x => x === "Business Communication").length === 1 && s.map["40"] === comm && !s.gone["40"] && s.tasks.some(t => t === "Quiz 1@Business Communication"), "a restored course syncs again, without a second copy: " + JSON.stringify({c: s.courses, map: s.map, gone: s.gone}));

    // Choosing New Course for it in the sync settings brings it back
    await page.evaluate(() => SBLMS.brightspace.bsSheet && SBLMS.brightspace.bsSheet()); await page.waitForTimeout(400);
    const sel = page.locator('dialog[open] select[data-bs-map="30"]');
    ok(await sel.count() === 1 && await sel.inputValue() === "skip", "the sync settings show the deleted course as Don't Import");
    await sel.selectOption("new"); await page.waitForTimeout(200);
    await page.evaluate(() => { const d = document.querySelector("#dlg"); if (d && d.open) d.close(); });
    await sync(); s = await look();
    ok(s.courses.includes("Safer Campuses for Everyone") && s.tasks.some(t => /Module 1 Check@Safer Campuses/.test(t)) && !s.gone["30"], "choosing New Course brings it back: " + JSON.stringify(s.courses));
    // A copy deleted while you keep the course itself: the school course goes to the one you kept, so its classes keep syncing
    await page.evaluate(() => { SBLMS.applyChanges([{kind: "course", id: "c10b", after: {id: "c10b", created: 2, name: "Context of Nursing (copy)", code: "BSNC 1020", color: "#111111", links: [], meetings: []}}], "");
      SBLMS.brightspace.save({map: Object.assign({}, SBLMS.brightspace.cfg().map, {"10": "c10b"})}); });
    await page.evaluate(() => { const b = document.createElement("button"); b.dataset.act = "delete-course"; b.dataset.id = "c10b"; document.body.appendChild(b); b.click(); b.remove(); });
    await page.waitForTimeout(300);
    await page.locator("dialog[open] button", {hasText: "Delete Course"}).last().click(); await page.waitForTimeout(400);
    s = await look();
    ok(s.map["10"] === "c10" && !s.gone["10"], "deleting a copy points the school course at the course you kept: " + JSON.stringify({map: s.map, gone: s.gone}));
    // Left off by an older version (copy deleted, school course set to Don't Import): the next sync goes to the course you kept
    await page.evaluate(() => { const c = SBLMS.brightspace.cfg(); SBLMS.brightspace.save({map: Object.assign({}, c.map, {"10": "skip"}), goneCourses: Object.assign({}, c.goneCourses, {"10": "c10b"})}); });
    await sync(); s = await look();
    const evs = await page.evaluate(() => Object.values(SBLMS.st().events || {}).map(e => e.title + "@" + e.courseId));
    ok(s.map["10"] === "c10" && !s.gone["10"] && evs.includes("Lecture@c10"), "a course left off that way syncs again, classes included: " + JSON.stringify({map: s.map, evs}));
    ok(!errs.length, "no page errors: " + errs.join(" | "));
  } finally { await browser.close(); server.close(); }
  console.log(`\nlms-deleted-course.e2e: ${n} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
