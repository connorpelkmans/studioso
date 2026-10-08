// node tests/plan-split.e2e.js  (Playwright + Chromium)
// Today's Plan: the suggested time on each task adds up to the study time the person set for today, unless there is a reason (which the plan then says).
// Checks the model (__sbPlan) and what is on screen: hero + list rows + the "more tasks" summary row = the planned total.
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const root = path.join(__dirname, "..");
const MIME = {".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".webmanifest": "application/manifest+json", ".png": "image/png", ".css": "text/css", ".woff2": "font/woff2", ".svg": "image/svg+xml"};
const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x"); let p = decodeURIComponent(u.pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  res.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const addD = n => { const d = new Date(); d.setDate(d.getDate() + n); return iso(d); };
const mk = (id, title, type, due, hours, o) => Object.assign({id, title, courseId: "c1", type, due: addD(due), start: addD(-1), hours, status: "todo", priority: "med", created: Date.now() - 864e5}, o || {});
const many = Array.from({length: 9}, (_, i) => mk("m" + i, "Task " + i, "Assignment", 1 + i, 3));
const SC = {
  plenty: [mk("a", "Essay", "Assignment", 5, 10), mk("b", "Lab", "Lab", 3, 4), mk("c", "HW", "Assignment", 2, 2), mk("d", "Read", "Reading", 9, 3)],
  nineTasks: many,
  dueToday: [mk("a", "HW", "Assignment", 0, 1), mk("b", "Essay", "Assignment", 6, 12)],
  exam: [mk("a", "Midterm", "Exam", 4, 6), mk("b", "Essay", "Assignment", 8, 8)],
  littleWork: [mk("a", "HW", "Assignment", 2, 0.5), mk("b", "Read", "Reading", 4, 1)],
};
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const q = h => Math.round(h * 4) / 4;
(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  const open = async (tasks, th, extra) => {
    const ctx = await browser.newContext({viewport: {width: 1280, height: 900}});
    await ctx.addInitScript(([seed, th]) => { try { localStorage.setItem("coursework:v2", JSON.stringify(seed)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1");
      const d = new Date(), t = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); localStorage.setItem("coursework:today", JSON.stringify({d: t, h: th})); } catch (e) {} },
      [Object.assign({v: 2, courses: [{id: "c1", name: "Biology", code: "BIO1", color: "#3B6FE0"}], settings: {capacity: 15, dailyHours: 3}, updated: 1, tasks}, extra || {}), th]);
    const page = await ctx.newPage(); page.errs = []; page.on("pageerror", e => page.errs.push(e.message));
    await page.goto(base); await page.waitForFunction(() => window.__sbPlan && document.querySelector(".focus.plan"), null, {timeout: 20000});
    return {ctx, page};
  };
  const mins = txt => { let m = 0; const h = /(\d+)h/.exec(txt), mm = /(\d+)m/.exec(txt); if (h) m += 60 * Number(h[1]); if (mm) m += Number(mm[1]); return m; };
  try {
    for (const [name, tasks] of Object.entries(SC)) for (const th of [2, 3, 3.4, 4.5]) {
      const {ctx, page} = await open(tasks, th);
      const r = await page.evaluate(() => { const p = __sbPlan(); return {th: p.th, thSet: p.thSet, alloc: p.ranked.map(x => x.alloc), R: p.ranked.reduce((t, x) => t + x.R, 0), gap: p.gapWhy,
        hero: (document.querySelector(".nu-alloc") || {}).textContent || "", rows: [...document.querySelectorAll(".plan-list:not(.plan-more .plan-list) .plan-row .alloc:not(.idle)")].map(e => e.textContent.trim()),
        more: (document.querySelector(".plan-rows") || {}).textContent || "", sum: (document.querySelector(".focus-sum") || {}).textContent || "", gapText: (document.querySelector(".plan-gap") || {}).textContent || ""}; });
      const planned = r.alloc.reduce((t, x) => t + x, 0), want = Math.min(q(r.thSet), Math.ceil(r.R * 4) / 4 + 0.0001);
      if (r.R * 1 >= r.thSet) ok(Math.abs(planned - q(r.thSet)) < 0.01, `${name} @${th}h: the times add up to the time you set (${planned} of ${q(r.thSet)})`);
      else ok(r.gap.length > 0 && /free/.test(r.gap.join(" ")), `${name} @${th}h: less work than time, and the plan says why: ${r.gap.join(" ")}`);
      // what is on screen adds up: hero + rows + summary row
      const screen = mins(r.hero) + r.rows.reduce((t, x) => t + mins(x), 0) + mins(r.more.replace(/^\d+ more tasks? today,/, ""));
      ok(Math.abs(screen - Math.round(planned * 60)) <= 1, `${name} @${th}h: what's on screen adds up (${screen}m shown, ${Math.round(planned * 60)}m planned)`);
      ok(r.gapText === "" || r.gap.length > 0, `${name} @${th}h: no unexplained gap text`);
      ok(page.errs.length === 0, "no page errors " + page.errs.join(";"));
      await ctx.close();
    }
    // nine tasks: only five rows, the rest in one summary row that opens to show all of them
    { const {ctx, page} = await open(SC.nineTasks, 6);
      const rows = () => page.locator(".plan-list:not(.plan-more .plan-list) .plan-row").count();
      const before = await rows(), btn = page.locator(".plan-rows");
      ok(await btn.count() === 1 || before <= 5, `long day: ${before} rows and a summary row`);
      if (await btn.count()) { await btn.click(); await page.waitForTimeout(150); ok(await rows() > before, "the summary row opens the full list"); ok(await page.locator('.plan-rows[aria-expanded="true"]').count() === 1, "and offers Show fewer"); }
      await ctx.close(); }
  } finally { await browser.close(); server.close(); }
  console.log(`\n${n} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
