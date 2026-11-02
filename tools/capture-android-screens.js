// node tools/capture-android-screens.js [outDir] [only...]
// Google Play phone screenshots at 1080x1920 (9:16): app screens,
// each in its own theme, with the app tour's sample semester on Tuesday, Oct 20 (no AI key, nothing sent anywhere).
const http = require("http"), fs = require("fs"), path = require("path");
const {chromium, executablePath} = require("../tests/pw");
const root = path.join(__dirname, ".."), OUT = process.argv[2] || path.join(root, "build-resources/play-listing/screenshots");
fs.mkdirSync(OUT, {recursive: true});
const MIME = {".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".png": "image/png", ".css": "text/css", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".webp": "image/webp", ".jpg": "image/jpeg", ".webmanifest": "application/manifest+json"};
const server = http.createServer((q, r) => { let p = decodeURIComponent(new URL(q.url, "http://x").pathname); if (p === "/") p = "/index.html"; if (p.endsWith("/")) p += "index.html"; const f = path.join(root, p);
  if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); r.end(); return; }
  if (p === "/index.html" && /[?&]pro=off\b/.test(q.url)) { r.writeHead(200, {"content-type": "text/html"}); r.end(require("../scripts/csp").apply(require("../scripts/app-files").source().replace("const PRO_ENFORCED = true;", "const PRO_ENFORCED = false;"))); return; }
  r.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(r); });

const NOW = new Date(2026, 9, 20, 8, 50, 0);
const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const D = k => { const d = new Date(NOW); d.setDate(d.getDate() + k); return iso(d); };
const now = NOW.getTime();
// The same sample semester as the app tour (src/js/49-apptour.js demoPlanner)
const T = (id, title, c, type, due, o) => Object.assign({id: "demo-" + id, title, courseId: "demo-" + c, type, start: D(-3), due, time: "", priority: "med", status: "todo", notes: "", hours: 2,
  checklist: [], pct: 0, dependsOn: [], history: [], created: now, order: 10}, o || {});
const SEED = {v: 2,
  courses: [
    {id: "demo-bio", name: "Anatomy & Physiology", code: "BIOL 1200", color: "#1E9E74", meetings: [{id: "m1", kind: "Lecture", days: [1, 3], start: "09:30", end: "11:20", where: "SW1 2015"}, {id: "m2", kind: "Lab", days: [4], start: "13:30", end: "16:20", where: "Lab B"}]},
    {id: "demo-psy", name: "Intro to Psychology", code: "PSYC 1010", color: "#3B6FE0", meetings: [{id: "m3", kind: "Lecture", days: [2, 4], start: "11:30", end: "12:50", where: "Hall C"}]},
    {id: "demo-eng", name: "Academic Writing", code: "ENGL 1100", color: "#D9661F", meetings: [{id: "m4", kind: "Seminar", days: [5], start: "10:00", end: "11:50", where: "Room 214"}]}],
  tasks: [
    T("t1", "Research Essay Draft", "eng", "Assignment", D(2), {time: "23:59", weight: 20, pct: 40, status: "doing", hours: 4, checklist: [{id: "a", text: "Outline", done: true}, {id: "b", text: "Find 5 sources", done: true}, {id: "c", text: "Write body", done: false}]}),
    T("t2", "Midterm Exam", "bio", "Exam", D(5), {time: "09:30", weight: 30, hours: 6, location: "SW1 1020"}),
    T("t3", "Chapter 6 Quiz", "psy", "Quiz", D(1), {time: "23:00", weight: 5, hours: 1}),
    T("t4", "Lab Report: Heart Rate", "bio", "Lab", D(8), {weight: 10, hours: 3}),
    T("t5", "Read Chapter 7", "psy", "Reading", D(3), {hours: 1}),
    T("t6", "Discussion Post 4", "eng", "Assignment", D(-1), {weight: 2, hours: 1}),
    T("t7", "Group Presentation", "psy", "Project", D(16), {weight: 20, hours: 5}),
    T("t8", "Final Exam", "bio", "Exam", D(40), {weight: 35, hours: 10}),
    T("t9", "Chapter 5 Quiz", "psy", "Quiz", D(-6), {status: "done", doneAt: now - 6 * 864e5, pct: 100, mark: {got: 22, outOf: 25}, weight: 5}),
    T("t10", "Lab Report: Cells", "bio", "Lab", D(-9), {status: "done", doneAt: now - 8 * 864e5, pct: 100, mark: {got: 46, outOf: 50}, weight: 10}),
    T("t11", "Essay Outline", "eng", "Assignment", D(-4), {status: "done", doneAt: now - 4 * 864e5, pct: 100, mark: {got: 81, outOf: 100}, weight: 5})],
  events: [{id: "demo-e1", title: "Study Group", courseId: "demo-bio", date: D(2), start: "15:00", end: "16:30", allDay: false, where: "Library", created: now},
    {id: "demo-e2", title: "Part-time Shift", date: D(4), start: "12:00", end: "17:00", allDay: false, created: now}],
  notes: [{id: "demo-n1", text: "Ask about the midterm review session", created: now, courseId: "demo-bio", color: "yellow", x: 540, y: 330, rot: -2, pin: "pin", stickers: [{k: "fstar", x: 84, y: 76, r: 14}]},
    {id: "demo-n2", text: "Essay: find one more peer-reviewed source", created: now - 1000, courseId: "demo-eng", color: "pink", x: 400, y: 90, rot: 2, pin: "tape", stickers: [{k: "pencil", x: 82, y: 80, r: 12}]},
    {id: "demo-n3", text: "Bring calculator Thursday", created: now - 2000, color: "blue", x: 610, y: 40, rot: -1, pin: "pin", stickers: [{k: "think", x: 82, y: 74, r: 8}]}],
  decks: [{id: "demo-d1", name: "Heart Terms", courseId: "demo-bio", cards: [{id: "k1", front: "Systole", back: "When the heart contracts"}, {id: "k2", front: "Diastole", back: "When the heart relaxes and fills"},
    {id: "k3", front: "Preload", back: "How stretched the heart is before it contracts"}, {id: "k4", front: "Afterload", back: "The pressure the heart pushes against"}], quizzes: [], aiQuizzes: []},
    {id: "demo-d2", name: "Memory and Learning", courseId: "demo-psy", cards: [{id: "k5", front: "Encoding", back: "Getting information into memory"}, {id: "k6", front: "Retrieval", back: "Getting it back out"}], quizzes: [], aiQuizzes: []}],
  files: [], settings: {capacity: 15, dailyHours: 3}, updated: 1};

// file name, theme, light/dark, how to get there
const SHOTS = [
  ["01-today", "classic", "light", ["Board", "Today's Plan"]],
  ["02-taskboard", "sakura", "light", ["Board", "Task Board"]],
  ["03-timeline", "galaxy", "dark", ["Calendar", "Due Dates", "Timeline", "Term"]],
  ["04-schedule", "ocean", "light", ["Calendar", "Schedule"]],
  ["05-crunch", "arctic", "dark", ["Calendar", "Crunch"]],
  ["06-notes", "spring", "light", ["Notes"]],
  ["07-grades", "arcade", "dark", ["Courses", "Grades"]],
  ["08-courses", "classic", "light", ["Courses", "Courses"]],
  ["09-companion", "forest", "light", ["Companion"]]];

const dismiss = async page => {
  for (let i = 0; i < 4; i++) {
    await page.evaluate(() => {
      [...document.querySelectorAll("button")].filter(b => /^(Not now|No Thanks|Dismiss|Later|Not This Week|Skip|Got It)$/i.test(b.textContent.trim()) && b.offsetParent).forEach(b => b.click());
      document.querySelectorAll("dialog[open] [data-act=close], dialog[open] .x").forEach(b => b.click());
    });
    await page.keyboard.press("Escape").catch(() => {});
    await page.waitForTimeout(250);
  }
};
// Click a nav item first, then tabs inside the page, by their visible label
const go = async (page, labels) => {
  for (let k = 0; k < labels.length; k++) {
    const ok = await page.evaluate(([l, nav]) => {
      const last = l.endsWith("@last"); l = l.replace(/@last$/, "");
      const clean = e => e.textContent.trim().replace(/\s*\d+$/, "");
      const all = [...document.querySelectorAll("button, [role=tab], a")].filter(e => e.offsetParent && clean(e) === l);
      const b = last ? all[all.length - 1] : nav ? all.find(e => e.closest("nav,aside,#nav,.side")) || all[0] : all.find(e => !e.closest("nav,aside,#nav,.side")) || all[0];
      if (b) b.click(); return !!b;
    }, [labels[k], k === 0]);
    if (!ok) console.warn("  no button:", labels[k]);
    await page.waitForTimeout(1200);
  }
};

async function shoot(browser, [name, skin, scheme, path_]) {
  const ctx = await browser.newContext({viewport: {width: 412, height: 732}, deviceScaleFactor: 1080 / 412, isMobile: true, hasTouch: true, userAgent: "Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36", colorScheme: scheme, serviceWorkers: "block"});
  await ctx.clock.setFixedTime(NOW);
  const seed = JSON.parse(JSON.stringify(SEED)); seed.settings.style = {skin}; seed.settings.owned = ["skin:" + skin];
  await ctx.addInitScript(([seed, scheme]) => { try { if (!localStorage.getItem("coursework:v2")) {
    localStorage.setItem("coursework:v2", JSON.stringify(seed)); localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "1"); localStorage.setItem("studioso:theme", scheme); localStorage.setItem("studyboard:tips", "off"); } } catch (e) {} }, [seed, scheme]);
  const page = await ctx.newPage();
  await page.goto("http://localhost:" + server.address().port + "/?pro=off"); await page.waitForSelector("#view", {state: "attached"}); await page.waitForTimeout(3000);
  await page.addStyleTag({content: ".toast,#toast{display:none!important} html{scrollbar-gutter:auto!important;scrollbar-width:none!important} ::-webkit-scrollbar{display:none!important}"});
  await dismiss(page);
  await go(page, path_);
  await dismiss(page);
  await page.evaluate(() => document.querySelectorAll(".cp-bubble.on").forEach(x => x.classList.remove("on")));
  await page.waitForTimeout(1500);
  await page.screenshot({path: path.join(OUT, name + ".png")}); console.log("saved", name + ".png");
  await ctx.close();
}
(async () => {
  await new Promise(r => server.listen(0, r)); const browser = await chromium.launch({executablePath, args: ["--hide-scrollbars"]});
  const only = process.argv.slice(3);
  try { for (const s of SHOTS) if (!only.length || only.includes(s[0])) await shoot(browser, s); }
  finally { await browser.close(); server.close(); }
  console.log("done:", OUT);
})().catch(e => { console.error(e); process.exit(1); });
