// node tests/lms-status.e2e.js
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
    await ctx.addInitScript(() => { try { if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("coursework:v2", JSON.stringify({v: 2, updated: 1, courses: [{id: "c1", name: "Biology", code: "BIOL 1200", color: "#1E9E74"}], tasks: [], settings: {}})); } localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("studyboard:tour", "done"); } catch (e) {} });
    const page = await ctx.newPage(); const errs = []; page.on("pageerror", e => errs.push(e.message));
    await page.goto(base);
    await page.waitForFunction(() => window.SBLMS && SBLMS.brightspace && SBLMS.brightspace.fromApi, null, {timeout: 40000});
    const read = sub => page.evaluate(sub => {
      const due = n => new Date(Date.now() + n * 864e5).toISOString();
      const L = SBLMS.brightspace, d = L.fromApi({ok: true, origin: "https://learn.example.edu", me: {}, all: [], errors: [], items: [], completions: [], courses: [{ou: "7", code: "BIOL1200", name: "BIOL 1200 - Biology",
        folders: [{id: "1", name: "Lab Report 1", due: due(3), end: null, sub: sub[0], files: []}, {id: "2", name: "Lab Report 2", due: due(5), end: null, sub: sub[1], files: []}, {id: "3", name: "Lab Report 3", due: due(7), end: null, sub: sub[2], files: []}],
        quizzes: [], grades: [], news: [], events: [], discussions: [], staff: []}]});
      L.save({map: {"7": "c1"}});
      L.applyPlan(d, L.plan(d), "grab", true);
    }, sub);
    const status = () => page.evaluate(() => Object.fromEntries(Object.values(SBLMS.st().tasks).filter(t => /^Lab Report/.test(t.title)).map(t => [t.title, t.status])));
    const setStatus = (title, s) => page.evaluate(([title, s]) => { const t = Object.values(SBLMS.st().tasks).find(x => x.title === title); SBLMS.applyChanges([{kind: "task", id: t.id, after: Object.assign({}, t, {status: s, doneAt: s === "done" ? Date.now() : null, pct: s === "done" ? 100 : 0})}], ""); }, [title, s]);

    await read([false, false, true]);
    let st = await status();
    ok(st["Lab Report 1"] === "todo" && st["Lab Report 2"] === "todo" && st["Lab Report 3"] === "done", "first read: unsubmitted work is To Do, submitted work is Complete: " + JSON.stringify(st));

    await setStatus("Lab Report 1", "doing");
    await setStatus("Lab Report 2", "done");
    await setStatus("Lab Report 3", "todo");
    await read([true, false, true]);
    st = await status();
    ok(st["Lab Report 1"] === "doing", "a task dragged to In Work stays there when a sync says it was submitted");
    ok(st["Lab Report 2"] === "done", "a task ticked off stays Complete when a sync says it isn't submitted");
    ok(st["Lab Report 3"] === "todo", "a task moved back out of Complete stays where the student put it");
    await read([true, true, true]);
    st = await status();
    ok(st["Lab Report 1"] === "doing" && st["Lab Report 2"] === "done" && st["Lab Report 3"] === "todo", "and later syncs leave them all alone: " + JSON.stringify(st));

    await setStatus("Lab Report 1", "todo");
    await read([true, true, true]);
    ok((await status())["Lab Report 1"] === "todo", "once the student has set a status, a sync never changes it again, even after they move it back");

    await page.evaluate(() => { const L = SBLMS.brightspace, due = new Date(Date.now() + 9 * 864e5).toISOString();
      const mk = sub => L.fromApi({ok: true, origin: "https://learn.example.edu", me: {}, all: [], errors: [], items: [], completions: [], courses: [{ou: "7", code: "BIOL1200", name: "BIOL 1200 - Biology", folders: [{id: "4", name: "Lab Report 4", due, end: null, sub, files: []}], quizzes: [], grades: [], news: [], events: [], discussions: [], staff: []}]});
      let d = mk(false); L.applyPlan(d, L.plan(d), "grab", true); d = mk(true); L.applyPlan(d, L.plan(d), "grab", true); });
    ok((await status())["Lab Report 4"] === "done", "a task the student never moved is still ticked off when it's submitted");
    ok(!errs.length, "no page errors: " + errs.join(" | "));
  } finally { await browser.close(); server.close(); }
  console.log(`\nlms-status.e2e: ${n} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
