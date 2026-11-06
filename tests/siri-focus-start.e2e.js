// Browser test: Siri starting a focus timer (the queue the Siri shortcut leaves for the app). A plain timer with no task
// runs the length asked and isn't on the last session's task; one on a task is on that task
// Run: node tests/siri-focus-start.e2e.js
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const root = path.join(__dirname, "..");
const MIME = {".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".webp": "image/webp", ".json": "application/json", ".woff2": "font/woff2"};
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  res.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
(async () => {
  await new Promise(r => server.listen(0, r)); const url = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  try {
    const ctx = await browser.newContext({viewport: {width: 390, height: 844}, isMobile: true, hasTouch: true});
    await ctx.addInitScript(() => {
      try { if (!sessionStorage.getItem("seeded")) { sessionStorage.setItem("seeded", "1"); localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "1");
        localStorage.setItem("coursework:v2", JSON.stringify({v: 2, courses: [], tasks: [{id: "t1", title: "Old task", status: "todo", type: "assignment", due: ""}, {id: "t2", title: "Lab report", status: "todo", type: "assignment", due: ""}], decks: [], notes: [], files: [], events: [], settings: {}, updated: 1}));
        localStorage.setItem("studioso:pomo", JSON.stringify({mode: "focus", running: false, endAt: 0, left: 0, cycle: 0, taskId: "t1", day: "", sessions: 0, minutes: 0})); } } catch (e) {}
      window.__q = [];
      const noop = () => Promise.resolve({});
      const FA = new Proxy({take: () => Promise.resolve(window.__q.splice(0))}, {get: (o, k) => k in o ? o[k] : (k === "then" ? undefined : noop)});
      window.StudyboardNative = Object.assign(window.StudyboardNative || {}, {focusActivity: FA});
    });
    const page = await ctx.newPage(), errs = []; page.on("pageerror", e => errs.push(e.message));
    await page.goto(url); await page.waitForTimeout(1500);
    const send = item => page.evaluate(it => { window.__q.push(Object.assign({t: Date.now()}, it)); document.dispatchEvent(new Event("visibilitychange")); }, item);
    const pomo = () => page.evaluate(() => JSON.parse(localStorage.getItem("studioso:pomo") || "{}"));
    await send({a: "start", task: "", mins: 25}); await page.waitForTimeout(600);
    let p = await pomo();
    ok(p.running && p.mode === "focus", "a plain Siri timer starts a focus session");
    ok(p.taskId === "", "and it isn't on the last session's task (" + JSON.stringify(p.taskId) + ")");
    ok(Math.round((p.endAt - Date.now()) / 60000) === 25, "and it runs the 25 minutes asked (" + Math.round((p.endAt - Date.now()) / 60000) + ")");
    await send({a: "start", task: "t2", mins: 30}); await page.waitForTimeout(600);
    p = await pomo();
    ok(p.running && p.taskId === "t2" && Math.round((p.endAt - Date.now()) / 60000) === 30, "a Siri timer on a task is on that task, for its length");
    ok(!errs.length, "no page errors " + errs.join(" | "));
    console.log(`siri-focus-start.e2e: ${n} checks passed`);
  } finally { await browser.close(); server.close(); }
})().catch(e => { console.error(e); process.exit(1); });
