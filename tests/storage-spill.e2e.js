// node tests/storage-spill.e2e.js (Playwright + Chromium; no network)
// When localStorage is full the saved copy moves to IndexedDB and nothing is lost on reload;
// importing a backup file brings back every setting and keeps this device's AI keys.
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const root = path.join(__dirname, "..");
const MIME = {".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".png": "image/png", ".css": "text/css", ".svg": "image/svg+xml", ".webp": "image/webp", ".woff2": "font/woff2"};
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  res.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const SEED = {v: 2, courses: [{id: "c1", name: "Biology", code: "BIO 101", color: "#2E9A5A"}], tasks: [], decks: [], files: [], events: [], notes: [], updated: 1,
  settings: {capacity: 15, ai: {provider: "gemini", keys: {gemini: "device-key"}}, dailyHours: 3}};
const task = (id, title) => ({id, title, courseId: "c1", type: "Assignment", due: "2026-12-01", status: "todo", created: Date.now()});
(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  const errs = [];
  const ctx = await browser.newContext({viewport: {width: 1280, height: 900}});
  await ctx.addInitScript(seed => {
    window.__SB_TEST = true;
    try { localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "1");
      if (!localStorage.getItem("coursework:v2") && !localStorage.getItem("coursework:v2:idb")) localStorage.setItem("coursework:v2", JSON.stringify(seed)); } catch (e) {}
  }, SEED);
  const page = await ctx.newPage(); page.on("pageerror", e => errs.push(e.message));
  const boot = async () => { await page.waitForFunction(() => window.__sbSync && window.__sbSync.state && window.__sbSync.state.courses && window.__sbSync.state.courses.c1, null, {timeout: 30000}); };
  await page.goto(base + "index.html"); await boot();

  // 1. Fill localStorage almost to the brim, then make a change
  const filled = await page.evaluate(() => {
    let size = 1 << 20, total = 0, i = 0;
    while (size >= 1024) { try { localStorage.setItem("junk:" + i, "x".repeat(size)); total += size; i++; } catch (e) { size = size >> 1; } }
    return total;
  });
  ok(filled > 1e6, `localStorage filled with junk (${filled} chars)`);
  await page.evaluate(t => { const S = window.__sbSync; S.applyChanges([{kind: "task", id: t.id, after: t}], ""); }, task("t-big", "Lab report after the storage filled up"));
  await page.waitForFunction(() => !!localStorage.getItem("coursework:v2:idb"), null, {timeout: 10000});
    ok(await page.evaluate(() => !localStorage.getItem("coursework:v2")), "the full copy left localStorage, freeing its room");

  // 2. More changes go to IndexedDB too
  await page.evaluate(t => window.__sbSync.applyChanges([{kind: "task", id: t.id, after: t}], ""), task("t-two", "Second task while spilled"));
  await page.waitForTimeout(800);

  // 3. Reload: both tasks are still there
  await page.reload(); await boot();
  const ids = await page.evaluate(() => Object.keys(window.__sbSync.state.tasks).sort());
  ok(ids.includes("t-big") && ids.includes("t-two"), "both tasks survive a reload (" + ids.join(", ") + ")");
  ok(await page.evaluate(() => window.__sbSync.state.courses.c1 && window.__sbSync.state.courses.c1.name === "Biology"), "earlier data survives too");

  // 4. A change after the reload is saved and survives another reload
  await page.evaluate(t => window.__sbSync.applyChanges([{kind: "task", id: t.id, after: t}], ""), task("t-three", "After reload"));
  await page.evaluate(() => new Promise(r => { document.dispatchEvent(new Event("visibilitychange")); setTimeout(r, 600); }));
  await page.reload(); await boot();
  ok(await page.evaluate(() => !!window.__sbSync.state.tasks["t-three"]), "a change after the reload is kept");

  // 5. Importing a backup file restores every setting but keeps this device's AI key
  await page.evaluate(() => { Object.keys(localStorage).filter(k => k.startsWith("junk:")).forEach(k => localStorage.removeItem(k)); });
  const backup = {app: "studyboard", v: 2, courses: [{id: "c9", name: "History", code: "HIS 200", color: "#8A5A2E"}], tasks: [task("b1", "Essay")].map(t => Object.assign(t, {courseId: "c9"})),
    notes: [], decks: [], files: [], events: [],
    settings: {capacity: 20, dailyHours: 5, grades: {pass: 55}, folders: [{id: "f1", name: "Readings"}], streak: {best: 9, cur: "<img src=x>"}, ai: {provider: "claude", keys: {claude: "evil"}},
      sounds: {vol: '"><img src=x onerror=alert(1)>'}, area: {id: "sci", custom: {types: ["<script>"]}}, canvas: {mode: "api", host: "evil.example"},
      chats: [{id: "x", q: "fake", a: "planted"}], webUrl: "https://evil.example", search: {paidOk: true}}};
  const file = path.join(require("os").tmpdir(), "sb-spill-backup-" + process.pid + ".json");
  fs.writeFileSync(file, JSON.stringify(backup));
  await page.setInputFiles("#importFile", file);
  await page.waitForSelector("dialog[open] [data-submit]", {timeout: 10000});
  await page.click("dialog[open] [data-submit]");
  await page.waitForFunction(() => window.__sbSync.state.courses.c9, null, {timeout: 10000});
  const st = await page.evaluate(() => window.__sbSync.state.settings);
  ok(st.dailyHours === 5 && st.capacity === 20, "study hours and capacity come back from the backup");
  ok(st.grades && st.grades.pass === 55, "the grade scale comes back");
  ok(Array.isArray(st.folders) && st.folders[0].name === "Readings", "folders come back");
  ok(st.streak && st.streak.best === 9, "the streak comes back");
  ok(st.sounds && typeof st.sounds.vol === "number" && st.sounds.vol <= 1, "a hostile sound volume becomes a number");
  ok(st.streak.cur === 0, "a hostile streak count becomes 0");
  ok(st.area && st.area.id === "sci" && !st.area.custom, "custom study area types are not taken from a file");
  ok(!st.canvas && !st.chats && !st.webUrl && !st.search, "school logins, chats, links and paid-AI consent are not taken from a file");
  const keys = await page.evaluate(() => window.__sbSync.keys);
  ok(st.ai && st.ai.provider === "gemini" && keys.gemini === "device-key" && !keys.claude && !JSON.stringify(st.ai).includes("evil"), "this device's AI setup and keys stay, the backup's are ignored");
  fs.unlinkSync(file);

  ok(!errs.length, "no page errors" + (errs.length ? ": " + errs.join(" | ") : ""));
  await browser.close(); server.close();
  console.log(`storage-spill.e2e.js: ${n} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
