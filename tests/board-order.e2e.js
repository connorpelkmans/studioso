// Task Board order: To Do and In Work go by due date and Complete puts the most recently finished on top, until a column is rearranged by hand.
// Run: node tests/board-order.e2e.js
const {chromium, executablePath} = require("./pw");
const path = require("path"), fs = require("fs"), http = require("http");
const ROOT = path.join(__dirname, "..");
const MIME = {".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".webmanifest": "application/manifest+json", ".css": "text/css", ".png": "image/png", ".svg": "image/svg+xml", ".woff2": "font/woff2"};
const server = http.createServer((req, res) => {
  let f; try { f = path.join(ROOT, decodeURIComponent(new URL(req.url, "http://x").pathname)); } catch (e) { res.writeHead(400); res.end(); return; }
  if (!f.startsWith(ROOT + path.sep) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
let checks = 0; const ok = (c, m) => { checks++; if (!c) { console.log("FAIL:", m); process.exitCode = 1; } };
const COURSE = {id: "c1", name: "Biology 101", code: "BIO101", color: "#4F8A5B"};
// order numbers are the opposite of the due dates (the order they were added), to show the due date wins until you rearrange
const T = (id, title, due, status, order, doneAt) => ({id, title, courseId: "c1", type: "Assignment", start: "2026-10-01", due, time: "", priority: "med", status, notes: "", hours: 2, checklist: [], pct: status === "done" ? 100 : 0, dependsOn: [], history: [], created: 1, order, doneAt: doneAt || null});
const TASKS = [T("t1", "Late Due", "2026-10-20", "todo", 10), T("t2", "Soon Due", "2026-10-08", "todo", 20), T("t3", "Middle Due", "2026-10-12", "todo", 30),
  T("d1", "Done First", "2026-10-02", "done", 10, Date.parse("2026-10-03T10:00:00Z")), T("d2", "Done Last", "2026-10-01", "done", 20, Date.parse("2026-10-05T10:00:00Z")), T("d3", "Done Middle", "2026-10-04", "done", 30, Date.parse("2026-10-04T10:00:00Z"))];
const seed = ([tasks, course, manual]) => {
  localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("studioso:tour", "done"); localStorage.setItem("sb:onboarded", "1");
  if (!localStorage.getItem("coursework:v2")) localStorage.setItem("coursework:v2", JSON.stringify({v: 2, courses: [course], tasks, files: [], notes: [], decks: [], events: [], settings: Object.assign({capacity: 15, dailyHours: 4}, manual ? {boardManual: manual} : {}), updated: 1}));
};
const col = (p, k) => p.evaluate(s => Array.from(document.querySelectorAll(`.col[data-status="${s}"] .card .card-title`)).map(e => e.textContent.trim()), k);
async function open(browser, manual){
  const ctx = await browser.newContext({viewport: {width: 1280, height: 900}, timezoneId: "America/New_York", locale: "en-US", serviceWorkers: "block"});
  const p = await ctx.newPage(), errs = []; p.on("pageerror", e => errs.push(e.message));
  await p.clock.install({time: new Date("2026-10-06T15:00:00-04:00")});
  await p.addInitScript(seed, [TASKS, COURSE, manual || null]);
  await p.goto("http://127.0.0.1:" + server.address().port + "/index.html");
  await p.waitForFunction(() => window.__sbAvail && document.readyState === "complete", null, {timeout: 20000});
  await p.evaluate(() => { try { localStorage.setItem("coursework:group", "none"); } catch (e) {} window.__sbAvail.view({tab: "board", bview: "board"}); });
  await p.waitForSelector('.col[data-status="todo"] .card', {timeout: 10000});
  return {ctx, p, errs};
}
(async () => {
  await new Promise(r => server.listen(0, "127.0.0.1", r));
  const browser = await chromium.launch({executablePath});
  {
    const {ctx, p, errs} = await open(browser);
    const todo = await col(p, "todo"), done = await col(p, "done");
    ok(JSON.stringify(todo) === JSON.stringify(["Soon Due", "Middle Due", "Late Due"]), "To Do goes by due date: " + todo.join(" | "));
    ok(JSON.stringify(done) === JSON.stringify(["Done Last", "Done Middle", "Done First"]), "Complete puts the most recently completed on top: " + done.join(" | "));
    ok(await p.locator(".col-resort").count() === 0, "no Sort button while nothing is rearranged");
    // drag Late Due above Soon Due: the column now keeps that order
    const card = n => p.locator('.col[data-status="todo"] .card', {hasText: n}).first();
    const a = await card("Late Due").boundingBox(), b = await card("Soon Due").boundingBox();
    await p.mouse.move(a.x + 20, a.y + 15); await p.mouse.down();
    for (let i = 1; i <= 12; i++) { await p.mouse.move(a.x + 20, a.y + 15 + (b.y + 4 - a.y - 15) * i / 12); await p.waitForTimeout(30); }
    await p.mouse.up(); await p.waitForTimeout(500);
    const dragged = await col(p, "todo");
    ok(dragged[0] === "Late Due" && await p.evaluate(() => !!(JSON.parse(localStorage.getItem("coursework:v2")).settings.boardManual || {}).todo), "dragging within To Do keeps your order: " + dragged.join(" | "));
    ok(!errs.length, "no page errors: " + errs.join("|"));
    await ctx.close();
  }
  {
    const {ctx, p, errs} = await open(browser, {todo: true, done: true});
    ok(JSON.stringify(await col(p, "todo")) === JSON.stringify(["Late Due", "Soon Due", "Middle Due"]), "a rearranged To Do keeps the order you chose");
    ok(JSON.stringify(await col(p, "done")) === JSON.stringify(["Done First", "Done Last", "Done Middle"]), "a rearranged Complete keeps the order you chose");
    await p.click('.col[data-status="todo"] .col-resort'); await p.waitForTimeout(300);
    ok(JSON.stringify(await col(p, "todo")) === JSON.stringify(["Soon Due", "Middle Due", "Late Due"]), "Sort by Due puts To Do back in due-date order");
    await p.click('.col[data-status="done"] .col-resort'); await p.waitForTimeout(300);
    ok(JSON.stringify(await col(p, "done")) === JSON.stringify(["Done Last", "Done Middle", "Done First"]), "Newest First puts Complete back");
    ok(!errs.length, "no page errors: " + errs.join("|"));
    await ctx.close();
  }
  await browser.close(); server.close();
  console.log(`board-order.e2e: ${checks} checks ${process.exitCode ? "FAILED" : "passed"}`);
})().catch(e => { console.error(e); process.exit(1); });
