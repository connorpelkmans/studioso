// Browser test: the last exam reflection sets the next prep plan's defaults, and whiteboards are found by Search and [[links]]
const path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const FILE = "file://" + path.join(__dirname, "..", "index.html");
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const NOW = new Date(2026, 9, 4, 10, 0, 0);
const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const plus = k => { const d = new Date(NOW); d.setDate(d.getDate() + k); return iso(d); };
const SEED = {v: 2,
  courses: [{id: "c1", name: "Biology", code: "BIO 101", color: "#3B6FE0"}],
  tasks: [
    // last exam: started the night before, felt 85% ready, got 62%
    {id: "q1", title: "Quiz 1", courseId: "c1", type: "Quiz", due: plus(-20), status: "done", doneAt: NOW.getTime() - 20 * 864e5, mark: {got: 62, outOf: 100},
      wrap: {at: NOW.getTime() - 19 * 864e5, methods: ["reread"], start: "night", next: "", felt: 85, measured: null, mark: 62}},
    {id: "ex1", title: "Midterm", courseId: "c1", type: "Exam", due: plus(12), status: "todo", start: plus(12)},
    {id: "hw", title: "Lab report", courseId: "c1", type: "Assignment", due: plus(3), status: "todo"}],
  decks: [],
  notes: [
    {id: "n1", text: "Lab report plan\nsee [[Krebs Cycle Board]]", courseId: "c1", taskId: "hw", x: 40, y: 40, rot: 0, color: "yellow", z: 1},
    {id: "wb1", text: "Krebs Cycle Board", courseId: "c1", wb: {v: 1, tpl: "blank"}, wbItems: [{id: "i1", k: "t", x: 100, y: 100, s: "oxaloacetate joins acetyl CoA"}], created: 1, updated: 1}],
  files: [], events: [], settings: {capacity: 15, dailyHours: 3}, updated: 1};

const act = (page, a, id, extra) => page.evaluate(([a, i, x]) => { const b = document.createElement("button"); b.dataset.act = a; if (i) b.dataset.id = i; x && Object.entries(x).forEach(([k, v]) => { b.dataset[k] = v; }); b.style.display = "none"; document.body.appendChild(b); b.click(); b.remove(); }, [a, id, extra]);
const store = page => page.evaluate(() => JSON.parse(localStorage.getItem("coursework:v2")));

(async () => {
  const browser = await chromium.launch({executablePath});
  const ctx = await browser.newContext({viewport: {width: 1200, height: 900}});
  await ctx.clock.install({time: NOW});
  await ctx.addInitScript(seed => {
    try { if (!sessionStorage.getItem("seeded") && !localStorage.getItem("coursework:v2")) { sessionStorage.setItem("seeded", "1"); localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "1"); localStorage.setItem("coursework:v2", JSON.stringify(seed)); } } catch (e) {}
  }, SEED);
  const page = await ctx.newPage(), errs = [];
  page.on("pageerror", e => errs.push(e.message));
  await page.goto(FILE); await page.waitForTimeout(1500);

  // 1. Plan My Prep reads the last reflection
  await act(page, "exam-plan", "ex1"); await page.waitForSelector("#ppBody .pp-lesson");
  const lesson = await page.$eval("#ppBody .pp-lesson", el => el.textContent);
  ok(/Quiz 1/.test(lesson) && /night before/.test(lesson), "the plan says it starts early because last time started the night before: " + lesson.slice(0, 160));
  ok(/Shaky/.test(lesson) && /85%/.test(lesson) && /62%/.test(lesson), "and that topics start at Shaky after feeling more ready than the mark");
  await page.fill("#ppAdd", "Glycolysis, Krebs cycle, Electron transport"); await page.click('[data-pp="add"]'); await page.waitForTimeout(150);
  const nTopics = await page.locator("#ppBody .pp-topic").count();
  ok(nTopics >= 3 && await page.locator('#ppBody .pp-topics [data-pp="conf"][data-v="weak"][aria-pressed="true"]').count() === nTopics, "new topics start at Shaky");
  await page.click('.pp-lesson [data-pp="lesson"][data-k="shaky"]'); await page.waitForTimeout(150);
  ok(await page.locator('#ppBody .pp-topics [data-pp="conf"][data-v="ok"][aria-pressed="true"]').count() === nTopics && !/Shaky/.test(await page.$eval("#ppBody .pp-lesson", el => el.textContent)), "Undo puts the topics back to OK and drops that line");
  await page.click("#ppCreate"); await page.waitForTimeout(400);
  const s1 = await store(page), ex = s1.tasks.find(t => t.id === "ex1"), learns = s1.tasks.filter(t => t.prepFor === "ex1" && t.kind === "learn");
  ok(ex.prep.lesson && ex.prep.lesson.early === "night" && !ex.prep.lesson.shaky, "the plan keeps what the reflection changed (minus what was undone)");
  ok(learns.length >= 3 && learns.every(t => t.due <= plus(7)), "every topic is first learned 5+ days before the exam: " + learns.map(t => t.due).join(", "));

  // 2. Whiteboards in Search Everywhere
  await act(page, "search"); await page.waitForSelector("#sxDlg[open]");
  await page.fill("#sxQ", "oxaloacetate"); await page.waitForTimeout(500);
  const row = page.locator('#sxList .sx-row:has-text("Krebs Cycle Board")');
  ok(await row.count() >= 1 && /Whiteboard/.test(await row.first().textContent()), "the text typed on a whiteboard finds it in Search");
  await row.first().click(); await page.waitForTimeout(400);
  ok(await page.evaluate(() => window.__sbProStudy.ui.tab === "notes" && window.SBWB.on() && window.SBWB.curId() === "wb1"), "opening the result opens that whiteboard");

  // 3. [[links]] and Linked items
  await page.evaluate(() => { window.SBWB.setView("notes"); window.__sbProStudy.render(); }); await page.waitForTimeout(300);
  ok(await page.locator('.note[data-note="n1"] .note-link.k-board').count() === 1, "a [[link]] to a whiteboard's name resolves to it");
  await page.click('.note[data-note="n1"] .note-link.k-board'); await page.waitForTimeout(400);
  ok(await page.evaluate(() => window.SBWB.on() && window.SBWB.curId() === "wb1"), "and opens it");
  await act(page, "edit-task", "hw", {edit: "1"}); await page.waitForTimeout(400);
  ok(await page.locator('#dlg .lk-chip.k-board:has-text("Krebs Cycle Board")').count() === 1, "the task's Linked row shows the whiteboard its note links");

  ok(!errs.length, "no page errors: " + errs.join(" | "));
  await browser.close();
  console.log(`connect-features.e2e.js: ${n} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
