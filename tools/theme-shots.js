// node tools/theme-shots.js <theme id> [more ids] [--out dir] [--quick]     (Playwright + Chromium)
// Opens the real app (index.html) with each theme on and saves screenshots, so new scenes and companions can be checked by eye:
//   <id>-light-c0.png, -c1, -c2   Task Board in light mode with each of the theme's three companions
//   <id>-dark-c0.png              the same in dark mode (night scene)
//   <id>-light-finish.png / -dark-finish.png (+ finish2)   2.2 s and 4.7 s into the "task finished" moment, with the board hidden
//   <id>-phone-light.png          a phone-sized window
// --quick: only light-c0, dark-c0 and the two finish shots. Prints every console error and page error, and exits 1 if there were any.
const http = require("http"), fs = require("fs"), path = require("path"), os = require("os");
const {chromium, executablePath} = require("../tests/pw");
const root = path.join(__dirname, "..");
const args = process.argv.slice(2), oi = args.indexOf("--out");
const OUT = oi >= 0 ? args[oi + 1] : fs.mkdtempSync(path.join(os.tmpdir(), "themeshots-"));
const QUICK = args.includes("--quick");
const IDS = args.filter((a, i) => !a.startsWith("--") && i !== oi + 1);
fs.mkdirSync(OUT, {recursive: true});
const MIME = {".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".png": "image/png", ".css": "text/css", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".webp": "image/webp", ".webmanifest": "application/manifest+json"};
const server = http.createServer((q, r) => { let p = decodeURIComponent(new URL(q.url, "http://x").pathname); if (p === "/") p = "/index.html"; const f = path.join(root, p);
  if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); r.end(); return; } r.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(r); });
const NOW = new Date(2026, 9, 8, 10, 0, 0);
const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const plus = k => { const d = new Date(NOW); d.setDate(d.getDate() + k); return iso(d); };
const SEED = {v: 2,
  courses: [{id: "bio", name: "Biology", code: "BIO 201", color: "#1E9E74"}, {id: "eng", name: "Composition", code: "ENGL 102", color: "#7A4FD6"}, {id: "chem", name: "Organic Chemistry", code: "CHEM 221", color: "#E4513B"}],
  tasks: [
    {id: "t1", title: "Lab Report 4: Enzyme Kinetics", courseId: "bio", type: "Assignment", due: plus(1), weight: 10, hours: 3, status: "doing", pct: 65},
    {id: "t3", title: "Read Ch. 7-8", courseId: "eng", type: "Reading", due: plus(0), hours: 1, status: "todo"},
    {id: "t4", title: "Problem Set 5", courseId: "chem", type: "Assignment", due: plus(0), weight: 5, hours: 2, status: "todo"},
    {id: "t5", title: "Essay 2 outline", courseId: "eng", type: "Assignment", due: plus(6), weight: 8, hours: 2, status: "doing", pct: 30}],
  decks: [], notes: [], files: [], events: [], settings: {capacity: 15, dailyHours: 3}, updated: 1};
const errors = [];
async function open(browser, id, scheme, pick, viewport) {
  const seed = JSON.parse(JSON.stringify(SEED));
  seed.settings.style = {skin: id}; seed.settings.owned = ["skin:" + id]; seed.settings.comp = {pick: {[id]: pick}};
  const ctx = await browser.newContext({viewport, colorScheme: scheme, deviceScaleFactor: 1, serviceWorkers: "block"});
  await ctx.clock.setFixedTime(NOW);
  await ctx.addInitScript(([seed, scheme]) => { try { if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("coursework:v2", JSON.stringify(seed)); localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "1"); localStorage.setItem("studioso:theme", scheme); localStorage.setItem("studyboard:tips", "off"); } } catch (e) {} }, [seed, scheme]);
  const page = await ctx.newPage();
  page.on("console", m => { if (m.type() === "error" || (m.type() === "warning" && /theme|scene|engine|comp/i.test(m.text()))) errors.push(`${id} ${scheme}: ${m.text()}`); });
  page.on("pageerror", e => errors.push(`${id} ${scheme}: ${e.message}`));
  await page.goto("http://localhost:" + server.address().port + "/"); await page.waitForSelector("#view", {state: "attached"}); await page.waitForTimeout(2500);
  await page.addStyleTag({content: ".toast,#toast{display:none!important}"});
  for (let i = 0; i < 3; i++) { await page.evaluate(() => { document.querySelectorAll("dialog[open] [data-act=close], dialog[open] .x").forEach(b => b.click()); [...document.querySelectorAll("button")].filter(b => /^(Not now|No Thanks|Dismiss|Later|Not This Week)$/i.test(b.textContent.trim())).forEach(b => b.click()); }); await page.keyboard.press("Escape").catch(() => {}); await page.waitForTimeout(200); }
  await page.evaluate(() => { const b = [...document.querySelectorAll("button, [role=tab]")].find(e => /^Task Board$/i.test(e.textContent.trim())); b && b.click(); });
  await page.waitForTimeout(1800);
  const skin = await page.evaluate(() => document.documentElement.getAttribute("data-skin"));
  if (skin !== id) errors.push(`${id}: the app is showing "${skin}" instead (theme did not register, or its scene is missing)`);
  return {ctx, page};
}
const shot = (page, name) => page.screenshot({path: path.join(OUT, name + ".png")}).then(() => console.log("saved", path.join(OUT, name + ".png")));
async function finish(page, name) {
  // the finish moment plays when a task is checked off (Today's Plan has the check buttons)
  await page.evaluate(() => { const b = [...document.querySelectorAll("button, [role=tab]")].find(e => /^Today.s Plan$/i.test(e.textContent.trim())); b && b.click(); });
  await page.waitForTimeout(900);
  const ok = await page.evaluate(() => { const t = document.querySelector('[data-act="toggle"]'); if (t) t.click(); return !!t; });
  if (!ok) errors.push("no task to check off for the finish shot");
  await page.waitForTimeout(400); await page.addStyleTag({content: "#view,.sheet,.toast,[role=dialog]{visibility:hidden!important}"});   // the scene's own finish moment, without the board over it
  await page.waitForTimeout(1800); await shot(page, name);
  await page.waitForTimeout(2500); await shot(page, name + "2");
}
(async () => {
  if (!IDS.length) { console.log("usage: node tools/theme-shots.js <theme id> [...] [--out dir] [--quick]"); process.exit(2); }
  await new Promise(r => server.listen(0, r));
  const browser = await chromium.launch({executablePath});
  const DESK = {width: 1280, height: 800}, PHONE = {width: 390, height: 844};
  try {
    for (const id of IDS) {
      for (const scheme of ["light", "dark"]) {
        for (const pick of (QUICK || scheme === "dark") ? [0] : [0, 1, 2]) {
          const {ctx, page} = await open(browser, id, scheme, pick, DESK);
          await shot(page, `${id}-${scheme}-c${pick}`);
          if (pick === 0) await finish(page, `${id}-${scheme}-finish`);
          await ctx.close();
        }
      }
      if (!QUICK) { const {ctx, page} = await open(browser, id, "light", 0, PHONE); await shot(page, `${id}-phone-light`); await ctx.close(); }
    }
  } finally { await browser.close(); server.close(); }
  if (errors.length) { console.log("\nERRORS:\n" + [...new Set(errors)].join("\n")); process.exit(1); }
  console.log("\nno console errors");
})();
