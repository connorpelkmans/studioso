// node tests/lms-crosscourse.e2e.js
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const root = path.join(__dirname, "..");
const MIME = {".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".webmanifest": "application/manifest+json", ".png": "image/png", ".css": "text/css", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".webp": "image/webp"};
const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x"); let p = decodeURIComponent(u.pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  res.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };

(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  try {
    const ctx = await browser.newContext({serviceWorkers: "block"});
    await ctx.route(/supabase\.co/, r => r.abort());
    await ctx.addInitScript(() => { try { localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", '"local"'); } catch (e) {} });
    const page = await ctx.newPage(); const errs = []; page.on("pageerror", e => errs.push(e.message));
    await page.goto(base);
    await page.waitForFunction(() => window.SBLMS && SBLMS.brightspace && SBLMS.brightspace.fromApi, null, {timeout: 40000});
    const read = (withOu) => page.evaluate(withOu => {
      const ev = (id, title, start, end, allDay, ou) => Object.assign({id, title, text: "", start, end, allDay, where: "", assoc: false, kind: "", url: ""}, ou ? {ou} : {});
      const mid = ou => ev("500", "BSNC 1020 Midterm Exam", "2026-10-23T07:00:00.000Z", "2026-10-24T07:00:00.000Z", true, ou);
      const course = (ou, name, events) => ({ou, code: name.split(" - ")[0].replace(" ", ""), name, folders: [], quizzes: [], grades: [], news: [], discussions: [], staff: [], events});
      const d = SBLMS.brightspace.fromApi({ok: true, origin: "https://learn.example.edu", me: {}, all: [], errors: [], items: [], completions: [], courses: [
        course("20", "BSNC 1030 - Practice of Nursing 1", [withOu ? mid("10") : mid(), ev("501", "Midterm Clinical Evaluation", "2026-10-23T15:30:00.000Z", "2026-10-23T17:00:00.000Z", false)]),
        course("10", "BSNC 1020 - Context of Nursing and Health Care 1", [mid()])]});
      return (d.recs || []).map(t => t.ou + ":" + t.title);
    }, withOu);
    for (const withOu of [false, true]) {
      const r = await read(withOu), how = withOu ? " (event marked with its own course)" : " (event named for another course)";
      ok(r.filter(x => /Midterm Exam/.test(x)).length === 1 && r.includes("10:BSNC 1020 Midterm Exam"), "1020's midterm is in BSNC 1020 only" + how + ": " + r.join(", "));
      ok(r.includes("20:Midterm Clinical Evaluation") && !r.some(x => x.startsWith("20:") && /Midterm Exam/.test(x)), "BSNC 1030 keeps its own evaluation and nothing of 1020's" + how);
    }
    ok(!errs.length, "no page errors: " + errs.join(" | "));
  } finally { await browser.close(); server.close(); }
  console.log(`\nlms-crosscourse.e2e: ${n} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
