// node tools/capture-site-screens.js [outDir]    (Playwright + Chromium)
// Runs the real app with made-up student data on a fixed date and saves screenshots (PNG, light and dark) for the website home page.
// Convert them to WebP for website/assets/screens/ (for example with Pillow: Image.open(p).save(p.replace(".png", ".webp"), quality=82)).
const http = require("http"), fs = require("fs"), path = require("path"), os = require("os");
const {chromium} = require("/opt/node-tools/node_modules/playwright");
const root = path.join(__dirname, ".."), OUT = process.argv[2] || fs.mkdtempSync(path.join(os.tmpdir(), "sbshots-"));
fs.mkdirSync(OUT, {recursive: true});
const MIME = {".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".png": "image/png", ".css": "text/css", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".webp": "image/webp", ".webmanifest": "application/manifest+json"};
const server = http.createServer((q, r) => { let p = decodeURIComponent(new URL(q.url, "http://x").pathname); if (p === "/") p = "/index.html"; const f = path.join(root, p);
  if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); r.end(); return; } r.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(r); });
const NOW = new Date(2026, 9, 8, 10, 0, 0);   // Thursday Oct 8 2026
const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const plus = k => { const d = new Date(NOW); d.setDate(d.getDate() + k); return iso(d); };
const card = (id, f, b, o) => Object.assign({id, front: f, back: b, box: 0, due: "", seen: 0, right: 0, wrong: 0}, o || {});
const SEED = {v: 2,
  courses: [{id: "bio", name: "Biology", code: "BIO 201", color: "#1E9E74"}, {id: "nur", name: "Adult Health Nursing", code: "NURS 310", color: "#1F6FEB"}, {id: "eng", name: "Composition", code: "ENGL 102", color: "#7A4FD6"}, {id: "chem", name: "Organic Chemistry", code: "CHEM 221", color: "#E4513B"}, {id: "stat", name: "Statistics", code: "STAT 200", color: "#B86A00"}],
  tasks: [
    {id: "t1", title: "Lab Report 4: Enzyme Kinetics", courseId: "bio", type: "Assignment", due: plus(1), weight: 10, hours: 3, status: "doing", pct: 65},
    {id: "t2", title: "Exam 2: Cardiac & Respiratory", courseId: "nur", type: "Exam", due: plus(4), time: "09:00", weight: 20, hours: 6, status: "todo", start: plus(4)},
    {id: "t3", title: "Read Ch. 7-8, Rhetorical Situations", courseId: "eng", type: "Reading", due: plus(0), hours: 1, status: "todo"},
    {id: "t4", title: "Problem Set 5", courseId: "chem", type: "Assignment", due: plus(0), weight: 5, hours: 2, status: "todo"},
    {id: "t5", title: "Essay 2 outline", courseId: "eng", type: "Assignment", due: plus(6), weight: 8, hours: 2, status: "doing", pct: 30},
    {id: "t6", title: "Quiz 4: Hypothesis Testing", courseId: "stat", type: "Quiz", due: plus(5), time: "11:00", weight: 5, hours: 1, status: "todo"},
    {id: "t7", title: "Clinical reflection", courseId: "nur", type: "Assignment", due: plus(7), weight: 6, hours: 2, status: "todo"},
    {id: "t8", title: "Care plan draft", courseId: "nur", type: "Assignment", due: plus(-6), weight: 8, status: "done", pct: 100},
    {id: "t9", title: "Quiz 3: Cell Respiration", courseId: "bio", type: "Quiz", due: plus(-7), weight: 5, status: "done", pct: 100},
    {id: "t10", title: "Reading response 2", courseId: "eng", type: "Assignment", due: plus(-3), weight: 4, status: "done", pct: 100},
    {id: "t11", title: "Lab 3 write-up", courseId: "chem", type: "Lab", due: plus(-4), weight: 6, status: "done", pct: 100},
    {id: "t12", title: "Midterm study guide", courseId: "stat", type: "Study", due: plus(10), hours: 3, status: "todo"}],
  decks: [
    {id: "d1", name: "Cardiac Drugs", courseId: "nur", created: 1, cards: [card("k1", "Beta blocker example", "Metoprolol", {seen: 3, due: plus(0)}), card("k2", "ACE inhibitor example", "Lisinopril", {seen: 2, due: plus(0)}), card("k3", "Statin action", "Lowers LDL cholesterol", {seen: 1, due: plus(0)}), card("k4", "Digoxin toxicity signs", "Nausea, halos, bradycardia", {seen: 2, due: plus(1)}), card("k5", "Loop diuretic example", "Furosemide", {seen: 4, box: 2, due: plus(3)})]},
    {id: "d2", name: "Enzyme Kinetics", courseId: "bio", created: 2, cards: [card("k6", "Km means", "Substrate level at half Vmax", {seen: 2, due: plus(0)}), card("k7", "Competitive inhibitor changes", "Raises Km, same Vmax", {seen: 1, due: plus(1)}), card("k8", "Michaelis-Menten plot shape", "Hyperbola", {seen: 3, box: 1, due: plus(2)})]}],
  notes: [
    {id: "n1", text: "Ask Dr. Patel about the Km graph in office hours", courseId: "bio", x: 40, y: 40, rot: -2, color: "yellow", z: 1},
    {id: "n2", text: "Cardiac drugs\n- beta blockers end in -olol\n- ACE inhibitors end in -pril", courseId: "nur", x: 300, y: 50, rot: 1.5, color: "blue", z: 2},
    {id: "n3", text: "Essay 2: argue one claim, three sources", courseId: "eng", x: 560, y: 40, rot: -1, color: "pink", z: 3},
    {id: "n4", text: "Study group Sunday 3pm, library room 204", x: 90, y: 250, rot: 2, color: "green", z: 4}],
  files: [], events: [], settings: {capacity: 15, dailyHours: 3, style: {skin: "classic"}}, updated: 1};

const dismiss = async page => {
  for (let i = 0; i < 4; i++) {
    await page.evaluate(() => {
      [...document.querySelectorAll("button")].filter(b => /^(Not now|No Thanks|Dismiss|Later|Not This Week)$/i.test(b.textContent.trim())).forEach(b => b.click());
      const h = [...document.querySelectorAll("div,section,aside")].find(e => /^Heavy week ahead/.test(e.textContent.trim()) && e.querySelector("button") && e.textContent.length < 260);
      if (h) { const bs = h.querySelectorAll("button"); bs[bs.length - 1].click(); }
    });
    await page.waitForTimeout(250);
  }
};
async function capture(browser, scheme) {
  const ctx = await browser.newContext({viewport: {width: 1280, height: 800}, colorScheme: scheme, deviceScaleFactor: 1, serviceWorkers: "block"});
  await ctx.clock.setFixedTime(NOW);
  await ctx.addInitScript(([seed, scheme]) => { try { if (!localStorage.getItem("coursework:v2")) {
    localStorage.setItem("coursework:v2", JSON.stringify(seed)); localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "1"); localStorage.setItem("studioso:theme", scheme); localStorage.setItem("studyboard:tips", "off");
    localStorage.setItem("studyboard:aiKeys", JSON.stringify({gemini: "AIzaSyDEMO-NOT-A-REAL-KEY-FOR-SCREENSHOTS"})); localStorage.setItem("studyboard:aiConsent", JSON.stringify({gemini: {v: 1, at: 1}})); } } catch (e) {} }, [SEED, scheme]);   // AI switched on (no request is made), so the screens show it as a person with a key sees it
  const page = await ctx.newPage(); await page.goto("http://localhost:" + server.address().port + "/"); await page.waitForSelector("#view", {state: "attached"}); await page.waitForTimeout(2500);
  await page.addStyleTag({content: ".toast,#toast{display:none!important}"});
  // first-run banners and dialogs out of the way
  await page.evaluate(() => { document.querySelectorAll("dialog[open] [data-act=close], dialog[open] .x").forEach(b => b.click()); });
  await page.keyboard.press("Escape").catch(() => {});
  await dismiss(page);
  await page.waitForTimeout(500);
  // the sidebar shows the signed-in state, as a person with an account sees it
  const shot = async name => { await page.waitForTimeout(700); await page.screenshot({path: path.join(OUT, `${name}-${scheme}.png`)}); console.log("saved", `${name}-${scheme}.png`); };
  const tab = async label => { await page.evaluate(l => { const b = [...document.querySelectorAll("button")].find(e => e.closest("nav,aside,#nav,.side") && e.textContent.trim().replace(/\d+$/, "") === l); b && b.click(); }, label); await page.waitForTimeout(1200); };
  await shot("plan");                                              // Board > Today's Plan
  await page.evaluate(() => { const b = [...document.querySelectorAll("button, [role=tab]")].find(e => /^Task Board$/i.test(e.textContent.trim())); b && b.click(); }); await shot("board");
  await tab("Calendar"); await shot("calendar");
  await tab("Flashcards"); await shot("flashcards");
  await tab("Notes"); await shot("notes");
  await tab("Courses"); await shot("courses");
  await tab("Companion"); await shot("companion");
  await page.evaluate(() => document.querySelector('[data-act="shop"]').click()); await page.waitForTimeout(1200);
  await page.evaluate(() => { const t = document.querySelector('.sheet [data-act="shop-tab"][data-id="collections"]'); t && t.click(); }); await shot("style");
  await ctx.close();
}
var THEMES = ["winter", "autumn", "sakura", "forest", "galaxy", "sunset", "ocean", "nursing", "compsci"];
const WINDOW = {width: 1000, height: 625};   // a smaller window than the other shots, so the scenes and cards read larger on the website
async function openSeeded(browser, scheme, seed, viewport) {
  const ctx = await browser.newContext({viewport, colorScheme: scheme, deviceScaleFactor: 1, serviceWorkers: "block"});
  await ctx.clock.setFixedTime(NOW);
  await ctx.addInitScript(([seed, scheme]) => { try { if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("coursework:v2", JSON.stringify(seed)); localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "1"); localStorage.setItem("studioso:theme", scheme); } } catch (e) {} }, [seed, scheme]);
  const page = await ctx.newPage(); await page.goto("http://localhost:" + server.address().port + "/"); await page.waitForSelector("#view", {state: "attached"}); await page.waitForTimeout(3000);
  await page.addStyleTag({content: ".toast,#toast{display:none!important}"});
  await dismiss(page);
  return {ctx, page};
}
const taskBoard = async page => { await page.evaluate(() => { const b = [...document.querySelectorAll("button, [role=tab]")].find(e => /^Task Board$/i.test(e.textContent.trim())); b && b.click(); }); await page.waitForTimeout(1500); };
async function captureThemes(browser, scheme) {
  for (const th of THEMES) {
    const seed = JSON.parse(JSON.stringify(SEED)); seed.settings.style = {skin: th}; seed.settings.owned = THEMES.map(t => "skin:" + t);   // Pro enforcement is on, so own the themes shown
    const {ctx, page} = await openSeeded(browser, scheme, seed, WINDOW);
    await taskBoard(page); await page.screenshot({path: path.join(OUT, `theme-${th}-${scheme}.png`)}); console.log("saved", `theme-${th}-${scheme}.png`); await ctx.close();
  }
}
// The home page hero: a calm Task Board with a few real cards, without the quick-add row
async function captureHero(browser, scheme) {
  const seed = JSON.parse(JSON.stringify(SEED)); const keep = new Set(["t3", "t4", "t2", "t1", "t5", "t8", "t9"]); seed.tasks = seed.tasks.filter(t => keep.has(t.id));
  const {ctx, page} = await openSeeded(browser, scheme, seed, {width: 1000, height: 640});
  await taskBoard(page);
  await page.evaluate(() => { const q = [...document.querySelectorAll("input")].find(i => /Add a task by typing/i.test(i.placeholder || "")); const row = q && (q.closest("form") || q.parentElement.parentElement); if (row) row.style.display = "none"; [...document.querySelectorAll("div,span,label")].filter(e => /^Group By/i.test(e.textContent.trim()) && e.textContent.length < 40 && e.querySelectorAll("button").length <= 2).forEach(e => { e.style.display = "none"; }); });
  await page.waitForTimeout(600); await page.screenshot({path: path.join(OUT, `hero-${scheme}.png`)}); console.log("saved", `hero-${scheme}.png`); await ctx.close();
}
(async () => { await new Promise(r => server.listen(0, r)); const browser = await chromium.launch(); try { for (const s of ["light", "dark"]) { await captureHero(browser, s); await captureThemes(browser, s); } for (const s of ["light", "dark"]) await capture(browser, s); } finally { await browser.close(); server.close(); } console.log("done:", OUT); })().catch(e => { console.error(e); process.exit(1); });
