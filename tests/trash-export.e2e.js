// Browser test for Recently Deleted and Export My Data.  Run: node tests/trash-export.e2e.js [outDir]
// Needs Playwright with Chromium (see tests/pw.js for how Playwright and Chromium are found).
const path = require("path"), fs = require("fs"), assert = require("assert"), cp = require("child_process"), os = require("os");
const {chromium, executablePath} = require("./pw");
const FILE = "file://" + path.join(__dirname, "..", "index.html");
const OUT = process.argv[2] || fs.mkdtempSync(path.join(os.tmpdir(), "sbtrash-"));
const today = new Date(); const iso = d => d.toISOString().slice(0, 10); const plus = n => iso(new Date(today.getTime() + n * 864e5));
const seed = {v: 2, courses: [{id: "c1", name: "Biology", code: "BIO 101", color: "#3B6FE0"}, {id: "c2", name: "Statistics", code: "STA 200", color: "#1E9E74"}],
  tasks: [{id: "t1", title: "Lab report", courseId: "c1", type: "Lab", due: plus(3), time: "09:30", weight: 15, mark: {got: 43, outOf: 50}}, {id: "t2", title: "Midterm", courseId: "c1", type: "Exam", due: plus(9), weight: 30},
    {id: "t3", title: "Problem set =1+1", courseId: "c2", type: "Assignment", due: plus(2), notes: "has, comma\nand \"quotes\""}, {id: "t4", title: "Standalone", courseId: "", type: "Other", due: plus(5)}],
  files: [{id: "f1", name: "Syllabus link", kind: "link", url: "https://example.com/syllabus", courseId: "c1", folderId: "other", revs: [], taskIds: []}],
  notes: [{id: "n1", text: "Remember the Krebs cycle", x: 40, y: 40, rot: 0, color: "yellow", z: 1, courseId: "c1"}, {id: "n2", text: "Second note", x: 260, y: 60, rot: 0, color: "pink", z: 2}],
  decks: [{id: "d1", name: "Cell Biology", courseId: "c1", created: 1, cards: [{id: "k1", front: "What makes ATP?", back: "Mitochondria"}, {id: "k2", front: "Powerhouse?", back: "Mitochondria"}, {id: "k3", front: "Ribosome job", back: "Makes protein"}]}],
  events: [{id: "e1", title: "Study group", courseId: "c2", date: plus(1), start: "14:00", end: "15:00", allDay: false}], settings: {capacity: 15}, updated: 1};
let n = 0; const ok = (c, m) => { n++; assert(c, m); };
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function open(browser, w, h, opts = {}) {
  const ctx = await browser.newContext({viewport: {width: w, height: h}, acceptDownloads: true});
  await ctx.addInitScript(([seedJson, doSeed]) => {
    try { if (!sessionStorage.getItem("seeded")) { sessionStorage.setItem("seeded", "1"); localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "1"); if (doSeed) localStorage.setItem("coursework:v2", seedJson); } } catch (e) {}
  }, [JSON.stringify(seed), opts.seed !== false]);
  const page = await ctx.newPage(); const errs = [];
  page.on("pageerror", e => errs.push(e.message));
  await page.goto(FILE); await page.waitForTimeout(1200);
  return {ctx, page, errs};
}
const click = (page, act, id, extra = "") => page.evaluate(([a, i, x]) => { const b = document.createElement("button"); b.dataset.act = a; if (i) b.dataset.id = i; x && Object.entries(JSON.parse(x)).forEach(([k, v]) => { b.dataset[k] = v; }); b.style.display = "none"; document.body.appendChild(b); b.click(); b.remove(); }, [act, id || "", extra]);
const ls = (page, k) => page.evaluate(k => localStorage.getItem(k), k);
const counts = page => page.evaluate(() => { const s = JSON.parse(localStorage.getItem("coursework:v2") || "{}"); return {c: (s.courses || []).length, t: (s.tasks || []).length, n: (s.notes || []).length, d: (s.decks || []).length, f: (s.files || []).length, e: (s.events || []).length, cards: ((s.decks || [])[0] || {cards: []}).cards.length}; });
const binList = async page => { await sleep(700); const r = await ls(page, "studioso:trash"); return r ? JSON.parse(r) : []; };
const clickText = (page, sel, text) => page.locator(sel, {hasText: text}).first().click();

async function deleteEach(page) {
  // task (no later steps in a series, so it deletes straight away)
  await click(page, "delete-task", "t4"); await sleep(250);
  // note
  await click(page, "note-trash", "n2"); await sleep(250);
  // event
  await click(page, "sch-occ", "e1", JSON.stringify({type: "event", key: plus(1)})); await sleep(300);
  await page.click("#evDel"); await sleep(250);
  // file
  await click(page, "f-open", "f1"); await sleep(300); await page.click("#fsDel"); await sleep(250);
  // single card
  await click(page, "fc-open", "d1"); await sleep(300); await click(page, "fc-card", "k1"); await sleep(300); await page.click("#cdDel"); await sleep(250);
  // deck
  await click(page, "fc-edit", "d1"); await sleep(300); await page.click("#dkDel"); await sleep(250);
  // course (with its tasks) through the confirm sheet
  await click(page, "delete-course", "c1"); await sleep(300); await page.click("[data-submit]"); await sleep(300);
}

(async () => {
  const browser = await chromium.launch({executablePath});
  for (const [w, h] of [[1280, 800], [390, 800]]) {
    const tag = "w" + w;
    // ---- undo for every kind (the toast Undo button), nothing lingers in the bin
    let {ctx, page, errs} = await open(browser, w, h);
    const base = await counts(page); ok(base.t === 4 && base.cards === 3, "seeded " + JSON.stringify(base));
    const undoOne = async (fn, check, label) => { await fn(); await sleep(250); ok(await check(false), label + " deleted"); ok(await page.isVisible("#toastUndo"), label + " has undo"); await page.click("#toastUndo"); await sleep(300); ok(await check(true), label + " undone"); };
    await undoOne(() => click(page, "delete-task", "t4"), async back => (await counts(page)).t === (back ? 4 : 3), "task");
    await undoOne(() => click(page, "note-trash", "n2"), async back => (await counts(page)).n === (back ? 2 : 1), "note");
    await undoOne(async () => { await click(page, "f-open", "f1"); await sleep(300); await page.click("#fsDel"); }, async back => (await counts(page)).f === (back ? 1 : 0), "file");
    await undoOne(async () => { await click(page, "sch-occ", "e1", JSON.stringify({type: "event", key: plus(1)})); await sleep(300); await page.click("#evDel"); }, async back => (await counts(page)).e === (back ? 1 : 0), "event");
    await undoOne(async () => { await click(page, "fc-open", "d1"); await sleep(300); await click(page, "fc-card", "k1"); await sleep(300); await page.click("#cdDel"); }, async back => (await counts(page)).cards === (back ? 3 : 2), "card");
    await undoOne(async () => { await click(page, "fc-edit", "d1"); await sleep(300); await page.click("#dkDel"); }, async back => (await counts(page)).d === (back ? 1 : 0), "deck");
    await undoOne(async () => { await click(page, "delete-course", "c1"); await sleep(300); await page.click("[data-submit]"); }, async back => { const c = await counts(page); return back ? c.c === 2 && c.t === 4 : c.c === 1 && c.t === 2; }, "course and its tasks");
    ok((await binList(page)).length === 0, "undo leaves nothing in the bin: " + (await binList(page)).length);
    // Ctrl+Z undoes the last delete
    await click(page, "delete-task", "t4"); await sleep(250); ok((await counts(page)).t === 3, "deleted for ctrl+z");
    await page.keyboard.press("Control+z"); await sleep(300); ok((await counts(page)).t === 4, "ctrl+z undid the delete"); ok((await binList(page)).length === 0, "ctrl+z cleared bin entry");

    // ---- delete everything once, find it in the bin
    await deleteEach(page);
    let list = await binList(page);
    const kinds = list.map(e => e.kind).sort().join();
    ok(kinds === "card,course,deck,event,file,note,task", "bin kinds: " + kinds);
    const courseE = list.find(e => e.kind === "course"); ok(courseE.items.length === 3 && courseE.detail.includes("2 tasks"), "course took its tasks: " + JSON.stringify(courseE.detail));
    const after = await counts(page); ok(after.t === 1, "only the other course task is left: " + after.t);
    await click(page, "menu"); await sleep(400);
    await page.evaluate(() => { const d = document.querySelector(".us-q"); }); ok((await page.locator('[data-act="trash-open"]').count()) >= 1, "settings row");
    await click(page, "trash-open"); await sleep(400);
    await page.screenshot({path: path.join(OUT, `bin-${tag}.png`)});
    ok((await page.locator(".tr-row").count()) === 7, "7 rows: " + await page.locator(".tr-row").count());
    ok((await page.locator(".tr-group").count()) === 7, "grouped by type");
    await page.fill("#trQ", "mito"); await sleep(200); ok((await page.locator(".tr-row").count()) === 2, "search finds card and deck by card text: " + await page.locator(".tr-row").count());
    await page.fill("#trQ", "krebs"); await sleep(200); ok((await page.locator(".tr-row").count()) === 0, "no note match"); // note n2 was deleted, not krebs
    await page.fill("#trQ", "second"); await sleep(200); ok((await page.locator(".tr-row").count()) === 1, "note found");
    await page.fill("#trQ", ""); await sleep(200);
    // restore the deck while its course is gone? deck belongs to c1 (also in bin): the course comes back too
    await page.locator('[aria-label="Restore Cell Biology"]').click(); await sleep(500);
    let c2 = await counts(page); ok(c2.d === 1 && c2.c === 2, "deck restored and its course came back: " + JSON.stringify(c2));
    // restore the lone task whose course is back; restore the rest
    for (const nm of ["Standalone", "Second note", "Study group", "Syllabus link"]) { await page.locator(`[aria-label="Restore ${nm}"]`).click(); await sleep(300); }
    c2 = await counts(page); ok(c2.n === 2 && c2.e === 1 && c2.f === 1 && c2.t >= 3, "restored " + JSON.stringify(c2));
    // the card: deck exists again -> goes back inside
    await page.locator('[aria-label="Restore What makes ATP?"]').click(); await sleep(400);
    ok((await counts(page)).cards === 3, "card back in its deck");
    // delete forever with confirm
    const rows = await page.locator(".tr-row").count(); ok(rows <= 1, "left in bin: " + rows);
    await page.screenshot({path: path.join(OUT, `bin-restored-${tag}.png`)});
    await page.keyboard.press("Escape"); await sleep(200);
    ok(errs.length === 0, "page errors: " + errs.join("; "));
    await ctx.close();

    // ---- delete forever / empty bin / purge by the 30 day clock
    ({ctx, page, errs} = await open(browser, w, h));
    await click(page, "delete-task", "t4"); await sleep(200); await click(page, "note-trash", "n2"); await sleep(300);
    await click(page, "trash-open"); await sleep(400);
    await page.locator('.tr-row:has-text("Standalone") [data-tr="ask"]').click(); await sleep(150);
    ok(await page.locator('[data-tr="forever"]').isVisible(), "asks first"); await page.locator('[data-tr="no"]').click(); await sleep(150);
    ok((await page.locator(".tr-row").count()) === 2, "cancel keeps it");
    await page.locator('.tr-row:has-text("Standalone") [data-tr="ask"]').click(); await page.locator('[data-tr="forever"]').click(); await sleep(300);
    ok((await page.locator(".tr-row").count()) === 1, "deleted forever");
    await page.click('[data-em="ask"]'); await sleep(100); await page.click('[data-em="yes"]'); await sleep(400);
    ok((await page.locator(".tr-row").count()) === 0 && (await binList(page)).length === 0, "bin emptied");
    await ctx.close();
    // purge: an entry 31 days old and one 29 days old are in storage at load
    ({ctx, page, errs} = await open(browser, w, h));
    await page.evaluate(() => { const e = (id, age, t) => ({id, kind: "task", label: t, detail: "", deletedAt: Date.now() - age * 864e5, items: [{kind: "task", id: "x" + id, data: {id: "x" + id, title: t}}]}); localStorage.setItem("studioso:trash", JSON.stringify([e("old", 31, "Too old"), e("new", 29, "Almost gone")])); });
    await page.reload(); await sleep(1200);
    list = await binList(page); ok(list.length === 1 && list[0].label === "Almost gone", "purged at load: " + JSON.stringify(list.map(e => e.label)));
    await click(page, "trash-open"); await sleep(300); ok((await page.textContent(".tr-row")).includes("1 day left"), "days left shown: " + await page.textContent(".tr-row"));
    await page.screenshot({path: path.join(OUT, `bin-days-${tag}.png`)});
    await ctx.close();
    // fake clock: delete now, jump 31 days, the hourly sweep removes it
    ctx = await browser.newContext({viewport: {width: w, height: h}});
    await ctx.addInitScript(s => { try { if (!sessionStorage.getItem("seeded")) { sessionStorage.setItem("seeded", "1"); localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "1"); localStorage.setItem("coursework:v2", s); } } catch (e) {} }, JSON.stringify(seed));
    page = await ctx.newPage(); await page.clock.install({time: new Date()}); await page.goto(FILE); await page.waitForTimeout(800);
    await click(page, "delete-task", "t4"); await page.clock.runFor(900); ok((await binList(page)).length === 1, "in bin before the clock moves");
    for (let i = 0; i < 31; i++) await page.clock.fastForward(864e5); await page.clock.runFor(1000);
    ok((await ls(page, "studioso:trash") || "[]") === "[]" || JSON.parse(await ls(page, "studioso:trash")).length === 0, "30 day purge by fake clock");
    await ctx.close();

    // ---- export My Data: ZIP download, parse it, and round trip the JSON into a fresh profile
    ({ctx, page, errs} = await open(browser, w, h));
    await click(page, "menu"); await sleep(300); await click(page, "export-data"); await sleep(300);
    await page.screenshot({path: path.join(OUT, `export-${tag}.png`)});
    const [dl] = await Promise.all([page.waitForEvent("download"), page.click("#xpGo")]);
    const zipPath = path.join(OUT, `export-${tag}.zip`); await dl.saveAs(zipPath);
    ok(/^studyboard-export-\d{4}-\d\d-\d\d\.zip$/.test(dl.suggestedFilename()), dl.suggestedFilename());
    const names = cp.execSync(`python3 -m zipfile -l "${zipPath}"`).toString();
    ["README.txt", "studyboard-export.json", "tasks.csv", "notes.csv", "grades.csv", "grades-summary.csv", "flashcards.csv", "flashcards-anki.txt", "courses.csv", "events.csv"].forEach(f => ok(names.includes(f), "zip has " + f));
    ok(/No errors detected/.test(cp.execSync(`unzip -t "${zipPath}"`).toString()), "unzip -t");
    const dir = path.join(OUT, "unzipped-" + tag); fs.rmSync(dir, {recursive: true, force: true}); cp.execSync(`mkdir -p "${dir}" && unzip -o -q "${zipPath}" -d "${dir}"`);
    const tasksCsv = fs.readFileSync(path.join(dir, "tasks.csv"), "utf8");
    ok(tasksCsv.charCodeAt(0) === 0xFEFF && tasksCsv.includes("'Problem set =1+1") === false && tasksCsv.includes("Problem set =1+1"), "BOM; '=' inside text left alone");
    ok(/Lab report,BIO 101 Biology,Lab,todo,\d{4}-\d\d-\d\d,09:30,\d{4}-\d\d-\d\dT09:30/.test(tasksCsv), "task row: " + tasksCsv.split("\r\n")[1]);
    ok(tasksCsv.includes('"has, comma\nand ""quotes"""'), "escaping");
    const json = JSON.parse(fs.readFileSync(path.join(dir, "studyboard-export.json"), "utf8"));
    ok(json.export.schema === "studyboard-export" && json.tasks.length === 4 && json.decks[0].cards.length === 3 && !JSON.stringify(Object.assign({}, json, {export: 0})).match(/"keys?"|token|deviceId/i), "json content and no secrets");
    await ctx.close();
    // round trip: fresh profile (nothing seeded), import the JSON through the normal restore path
    ({ctx, page, errs} = await open(browser, w, h, {seed: false}));
    ok((await counts(page)).t === 0, "fresh profile is empty");
    await page.setInputFiles("#importFile", path.join(dir, "studyboard-export.json")); await sleep(500);
    await page.click("[data-submit]"); await sleep(800);
    let rt = await counts(page); ok(rt.c === 2 && rt.t === 4 && rt.n === 2 && rt.d === 1 && rt.cards === 3 && rt.e === 1 && rt.f === 1, "JSON round trip: " + JSON.stringify(rt));
    await ctx.close();
    // the ZIP itself imports too
    ({ctx, page, errs} = await open(browser, w, h, {seed: false}));
    await page.setInputFiles("#importFile", zipPath); await sleep(500); await page.click("[data-submit]"); await sleep(800);
    rt = await counts(page); ok(rt.t === 4 && rt.d === 1, "ZIP round trip: " + JSON.stringify(rt));
    ok(errs.length === 0, "page errors: " + errs.join("; "));
    await ctx.close();
    console.log(tag, "ok");
  }
  await browser.close();
  console.log(`trash-export e2e: ${n} checks passed (screenshots in ${OUT})`);
})().catch(e => { console.error(e); process.exit(1); });
