// Browser test: class pages. A course's Lectures tab lists every class of the term; each class has a page with its notes,
// files and recording; the Schedule's class sheet opens it; and the course's Lecture Notes folder in Files shows the same, by class.
// Run: node tests/class-pages.e2e.js [screenshot folder]
const path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const FILE = "file://" + path.join(__dirname, "..", "index.html"), SHOTS = process.argv[2] || "";
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const NOW = new Date(2026, 9, 5, 10, 30, 0); // Monday, during the 10:00 lecture
const at = (d, h, m) => new Date(d + "T" + String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0") + ":00").getTime();
const WED = "2026-09-30", WEDKEY = WED + "|10:00|Lecture", TODAYKEY = "2026-10-05|10:00|Lecture";
const SEED = {v: 2,
  courses: [{id: "c2", name: "Nursing Knowledge 1", code: "BSNC 1000", color: "#1E9E74", created: at("2026-09-01", 9, 0), classDates: {from: "2026-09-07", until: "2026-12-11"}},
    {id: "c1", name: "Biology", code: "BIO 101", color: "#3B6FE0", instructor: "Dr. Alvarez", created: at("2026-09-01", 9, 0), classDates: {from: "2026-09-07", until: "2026-12-11"},
    meetings: [{id: "m1", kind: "Lecture", days: [1, 3], start: "10:00", end: "11:20", where: "Hall B 120"}, {id: "m2", kind: "Lab", days: [4], start: "14:00", end: "16:50", where: "Sci 204"}, {id: "m3", kind: "Office Hours", days: [2], start: "13:00", end: "14:00", where: "Sci 310"}]}],
  tasks: [{id: "hw", title: "Lab report: enzymes", courseId: "c1", type: "Assignment", due: "2026-10-07", status: "todo"}, {id: "ex1", title: "Midterm", courseId: "c1", type: "Exam", due: "2026-10-16", status: "todo"}],
  decks: [],
  notes: [{id: "n1", text: "Cell respiration\n- glycolysis in the cytoplasm\n- Krebs cycle in the matrix", courseId: "c1", cls: WEDKEY, x: 40, y: 40, rot: 0, color: "yellow", z: 1, created: at(WED, 10, 5)},
    {id: "n2", text: "Loose idea\nnot for a class", courseId: "c1", x: 300, y: 40, rot: 0, color: "pink", z: 2}],
  files: [
    {id: "f1", name: "Week 4 slides.pdf", courseId: "c1", folderId: "notes", kind: "link", url: "https://example.com/w4.pdf", cls: WEDKEY, revs: [], taskIds: [], created: at(WED, 9, 0)},
    {id: "f2", name: "Syllabus.pdf", courseId: "c1", folderId: "notes", kind: "link", url: "https://example.com/syl.pdf", revs: [], taskIds: [], created: at("2026-09-07", 9, 0)},
    // a recording saved at the end of Wednesday's lecture, with no class of its own: matched by its time
    {id: "r1", name: "Cell respiration lecture", courseId: "c1", folderId: "lectures", kind: "file", revs: [], taskIds: [], created: at(WED, 11, 24), dur: 4700, tr: {text: "Today we cover cell respiration..."}, lec: {sum: "## Main ideas\n- Glycolysis\n- Krebs cycle"}}],
  events: [
    // BSNC 1000 has no class times of its own: its classes come from the school calendar, as events linked to the course
    {id: "e1", title: "NK1 Module 8, Class 3", courseId: "c2", label: "Lecture", date: "2026-10-06", start: "08:30", end: "10:30", where: "SE12 403"},
    {id: "e2", title: "NK1 Module 8, Class 3", courseId: "c2", label: "Lecture", date: "2026-10-06", start: "12:00", end: "14:00", where: "SE12 403"},
    {id: "e3", title: "NK 1 Module 9, Class 1", courseId: "c2", label: "Lecture", date: "2026-10-09", start: "12:00", end: "14:00", where: "SW3 4675/95"},
    {id: "e4", title: "Clinical orientation", courseId: "c2", label: "", date: "2026-10-08", start: "09:00", end: "11:00"},
    {id: "e5", title: "Pizza night", courseId: "c2", label: "Social", date: "2026-10-08", start: "18:00", end: "20:00"},
    {id: "e6", title: "Reading week", courseId: "c2", label: "", date: "2026-10-12", allDay: true}],
  settings: {capacity: 15, dailyHours: 3}, updated: 1};

const act = (page, a, id, extra) => page.evaluate(([a, i, x]) => { const b = document.createElement("button"); b.dataset.act = a; if (i) b.dataset.id = i; x && Object.entries(x).forEach(([k, v]) => { b.dataset[k] = v; }); b.style.display = "none"; document.body.appendChild(b); b.click(); b.remove(); }, [a, id, extra]);
const store = page => page.evaluate(() => JSON.parse(localStorage.getItem("coursework:v2")));
const shot = async (page, name, sel) => { if (!SHOTS) return; await page.waitForTimeout(250); await (sel ? page.locator(sel).first() : page).screenshot({path: path.join(SHOTS, name + ".png")}); };

(async () => {
  const browser = await chromium.launch({executablePath});
  const ctx = await browser.newContext({viewport: {width: 430, height: 900}, deviceScaleFactor: SHOTS ? 2 : 1});
  await ctx.clock.install({time: NOW});
  await ctx.addInitScript(seed => {
    try { if (!sessionStorage.getItem("seeded") && !localStorage.getItem("coursework:v2")) { sessionStorage.setItem("seeded", "1"); localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "1"); localStorage.setItem("coursework:v2", JSON.stringify(seed)); } } catch (e) {}
  }, SEED);
  const page = await ctx.newPage(), errs = [];
  page.on("pageerror", e => errs.push(e.message));
  await page.goto(FILE); await page.waitForTimeout(1500);

  // 1. Courses > Biology > Lectures: every class of the term, week by week
  await page.evaluate(() => { const b = document.querySelector('[data-tab="courses"]'); if (b) b.click(); }); await page.waitForTimeout(200);
  await act(page, "open-course", "c1"); await page.waitForTimeout(300);
  await act(page, "course-tab", "lectures"); await page.waitForSelector(".cls-tab");
  const rows = await page.locator(".cls-row").count();
  ok(rows >= 13 * 4 && await page.locator(".cls-wk").count() >= 13, `the term's classes are listed week by week (${rows} classes)`);
  ok(await page.locator('.cls-row:has-text("Lecture 8")').count() === 1 && await page.locator('.cls-row:has-text("Lab 4")').count() === 1 && await page.locator('.cls-row:has-text("Office Hours")').count() >= 13, "lectures and labs are numbered; office hours are listed");
  const wed = page.locator(`.cls-row[data-key="${WEDKEY}"]`);
  ok(/Lecture 8/.test(await wed.textContent()) && await wed.locator(".cls-b").count() === 3, "the class with notes and a summarized recording shows it in its row");
  ok(await page.locator(`.cls-row.is-today[data-key="${TODAYKEY}"]`).count() === 1 && await page.locator(".cls-week.is-now").count() === 1, "today's class and this week are marked");
  ok(!(await page.locator(".lec-tab").count()), "a recording that belongs to a class isn't listed again under Other Recordings");
  await page.click('.cls-kinds [data-k="Lab"]'); await page.waitForTimeout(150);
  ok(await page.locator(".cls-row").count() >= 13 && !(await page.locator('.cls-row:has-text("Lecture")').count()), "the kind chips filter the list");
  await page.click('.cls-kinds [data-k=""]'); await page.waitForTimeout(150);
  await page.evaluate(() => { const w = document.querySelector(".cls-week.is-now"); if (w) w.previousElementSibling.scrollIntoView(); });
  await shot(page, "1-lectures-tab");

  // 2. A class's page
  await wed.click(); await page.waitForSelector("#dlg .cls-sheet");
  const pg = await page.$eval("#dlg .cls-sheet", el => el.textContent);
  ok(/Lecture 8/.test(pg) && /Wednesday, September 30/.test(pg), "the class page names the class and its date");
  ok(/Cell respiration/.test(pg) && /Week 4 slides\.pdf/.test(pg) && /Cell respiration lecture/.test(pg) && /Summary/.test(pg), "it holds the class's note, slides and recording with its summary");
  ok(!/Lab report|Loose idea|Syllabus/.test(pg), "and nothing from other classes or tasks");
  await shot(page, "2-class-page", "#dlg .sheet");
  await page.click('#dlg [data-act="cls-sum"]'); await page.waitForSelector("#dlg .lec-docv");
  ok(/Glycolysis/.test(await page.$eval("#dlg .lec-docv", el => el.textContent)), "Summary opens the recording's summary");
  await wed.click().catch(() => {}); await page.evaluate(() => document.querySelector("#dlg").close());
  await act(page, "cls-open", "", {cid: "c1", key: "2026-09-30|10:00|Lecture"}); await page.waitForSelector("#dlg .cls-sheet");
  await page.click('#dlg [data-act="cls-go"]:has-text("Lecture 9")'); await page.waitForTimeout(200);
  ok(/Monday, October 5/.test(await page.$eval("#dlg .cls-sheet", el => el.textContent)), "the arrows step to the next class");
  // add a Google Drive file (no Drive connected on this device: a Share link)
  await page.click('#dlg [data-act="cls-drive"]'); await page.waitForSelector('#dlg input[name="url"]');
  await page.fill('#dlg input[name="url"]', "https://docs.google.com/presentation/d/abc123/edit"); await page.click("#dlg [data-submit]"); await page.waitForSelector("#dlg .cls-sheet");
  ok(/Google Slides/.test(await page.$eval("#dlg .cls-sheet", el => el.textContent)), "a Google Drive link is added to the class");
  // The section is named for the kind of class; Upload leads and there's no New Note
  const sec = await page.$eval("#dlg .cls-sec h3", el => el.textContent);
  ok(/^Lecture Notes and Files/.test(sec) && await page.locator('#dlg [data-act="cls-new-note"]').count() === 0 && await page.locator('#dlg .btn.primary[data-act="cls-upload"]').count() === 1, "Lecture Notes and Files, with Upload highlighted and no New Note: " + sec);
  // From Studyboard: lists the course's files, not notes; the syllabus goes with today's class
  await page.click('#dlg [data-act="cls-pick"]'); await page.waitForSelector('#dlg [data-cls="file:f2"]');
  ok(await page.locator('#dlg [data-cls^="note:"]').count() === 0, "From Studyboard lists files, not notes from the note board");
  await page.check('#dlg [data-cls="file:f2"]'); await page.click("#clsPickOk"); await page.waitForSelector("#dlg .cls-sheet");
  let s = await store(page);
  ok(s.files.find(x => x.id === "f2").cls === TODAYKEY && s.files.some(f => f.kind === "link" && f.cls === TODAYKEY && f.folderId === "notes"), "picked files and added links belong to the class, in Lecture Notes");
  await page.click('#dlg [data-act="cls-unlink"][data-id="f2"]'); await page.waitForTimeout(150);
  s = await store(page); ok(!s.files.find(x => x.id === "f2").cls && s.files.some(x => x.id === "f2"), "taking a file off a class keeps the file");
  await page.evaluate(() => document.querySelector("#dlg").close());

  // 3. The Schedule's class sheet opens the class page
  await act(page, "sch-occ", "c1", {type: "meet", key: TODAYKEY}); await page.waitForSelector("#dlg .occv-rows");
  const occ = await page.$eval("#dlg .occv-rows", el => el.textContent);
  ok(/Open Class Notes/.test(occ) && /Lecture 9 · 1 file/.test(occ) && !/Lab report/.test(occ), "the class on the Schedule links its class page (no task row)");
  await shot(page, "3-schedule-class", "#dlg .sheet");
  await page.click('#dlg [data-act="cls-open"]'); await page.waitForSelector("#dlg .cls-sheet");
  ok(/Monday, October 5/.test(await page.$eval("#dlg .cls-sheet", el => el.textContent)), "the button opens that class's page");

  // 4. Files > Biology > Lecture Notes: the same things, by class
  await act(page, "sch-occ", "c1", {type: "meet", key: TODAYKEY}); await page.waitForSelector("#dlg .occv-rows");
  await page.click('#dlg [data-act="cls-open"]'); await page.waitForSelector("#dlg .cls-sheet");
  await page.click('#dlg [data-act="cls-files"]'); await page.waitForTimeout(400);
  const fx = await page.$eval("#fpane", el => el.textContent);
  ok(/Lecture Notes›Lecture 9, Oct 5/.test(fx) && /Google Slides|docs\.google/.test(fx), "Open in Files opens the class's own folder, with what was added to it: " + fx.replace(/\s+/g, " ").slice(0, 160));
  await page.click('#fpane [data-act="f-cls"][data-key=""]'); await page.waitForTimeout(250);
  const all = await page.$eval("#fpane", el => el.textContent);
  ok(await page.locator(`#fpane .lf-tile[data-key="${WEDKEY}"]`).count() === 1 && await page.locator(`#fpane .lf-tile[data-key="${TODAYKEY}"]`).count() === 1 && /Not Linked to a Class/.test(all) && /Syllabus\.pdf/.test(all),
    "Lecture Notes has a folder for every class, and the rest under Not Linked to a Class");
  await shot(page, "4-files-lecture-notes");
  // dropping a file on a class's folder links it to that class
  await page.evaluate(k => { const t = document.querySelector(`#fpane .lf-tile[data-key="${k}"]`), dt = new DataTransfer(); dt.setData("text/x-file-id", "f2"); t.dispatchEvent(new DragEvent("drop", {bubbles: true, cancelable: true, dataTransfer: dt})); }, WEDKEY);
  await page.waitForTimeout(200);
  ok((await store(page)).files.find(f => f.id === "f2").cls === WEDKEY, "a file dropped on a class's folder is linked to that class");
  await page.click(`#fpane .lf-tile[data-key="${WEDKEY}"]`); await page.waitForTimeout(250);
  const wf = await page.$eval("#fpane", el => el.textContent);
  ok(/Week 4 slides\.pdf/.test(wf) && /Syllabus\.pdf/.test(wf) && /Cell respiration lecture/.test(wf) && /Typed note/.test(wf), "a class's folder holds its files, typed notes and recording");
  await page.click('#fpane [data-act="cls-open"]'); await page.waitForSelector("#dlg .cls-sheet");
  ok(/Wednesday, September 30/.test(await page.$eval("#dlg .cls-sheet", el => el.textContent)), "Open Class Page opens it");

  // 5. A course whose classes come only from calendar events (a school calendar's lectures)
  await page.evaluate(() => document.querySelector("#dlg").open && document.querySelector("#dlg").close());
  await page.evaluate(() => { const u = window.__sbProStudy.ui; u.tab = "courses"; u.courseId = null; window.__sbProStudy.render(); }); await page.waitForTimeout(200);
  await act(page, "open-course", "c2"); await page.waitForTimeout(300);
  await act(page, "course-tab", "lectures");
  await page.waitForSelector(".cls-tab");
  const nk = await page.$eval(".cls-tab", el => el.textContent);
  ok(!/No Class Times Yet/.test(nk) && await page.locator(".cls-row").count() === 4, `the course's calendar lectures are its classes (${await page.locator(".cls-row").count()})`);
  ok(/NK1 Module 8, Class 3/.test(nk) && /NK 1 Module 9, Class 1/.test(nk) && /Clinical orientation/.test(nk) && /Lecture 3/.test(nk), "each shows its own title and is numbered");
  ok(!/Pizza night|Reading week/.test(nk), "a social event and an all-day event aren't classes");
  await act(page, "sch-occ", "e3", {type: "event", key: "2026-10-09"}); await page.waitForSelector("#dlg .occv-rows");
  ok(/Start Notes for This Class/.test(await page.$eval("#dlg .occv-rows", el => el.textContent)), "the Schedule's sheet for a calendar lecture links its class page");
  await page.click('#dlg [data-act="cls-open"]'); await page.waitForSelector("#dlg .cls-sheet");
  ok(/NK 1 Module 9, Class 1/.test(await page.$eval("#dlg .cls-sheet", el => el.textContent)), "and opens it, with the lecture's title");
  await shot(page, "5-calendar-lectures", "#dlg .sheet");
  ok(!errs.length, "no page errors: " + errs.join(" | "));
  await browser.close();
  console.log(`class-pages.e2e.js: ${n} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
