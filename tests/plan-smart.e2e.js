// node tests/plan-smart.e2e.js (Playwright + Chromium) Today's Plan and Do This Next: closed late work, due times, undated steps,
// late penalties, study time for in-person exams, Do This Next leading the timeline, busy days ahead, and what to leave for last
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
const mk = (id, title, type, due, hours, o) => Object.assign({id, title, courseId: "c1", type, due: due == null ? "" : addD(due), start: addD(-3), hours, status: "todo", priority: "med", created: Date.now() - 3 * 864e5, checklist: [], history: []}, o || {});
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  const open = async (tasks, o) => {
    o = o || {};
    const ctx = await browser.newContext({viewport: {width: 1280, height: 900}});
    await ctx.addInitScript(([seed, th]) => { try { localStorage.setItem("coursework:v2", JSON.stringify(seed)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1");
      const d = new Date(), t = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); if (!sessionStorage.getItem("seeded")) { localStorage.setItem("coursework:today", JSON.stringify({d: t, h: th})); sessionStorage.setItem("seeded", "1"); } } catch (e) {} },
      [{v: 2, courses: [{id: "c1", name: "Biology", code: "BIO1", color: "#3B6FE0"}], settings: {capacity: 15, dailyHours: 3}, updated: 1, tasks, events: o.events || []}, o.th || 3]);
    await ctx.clock.install({time: new Date(iso(new Date()) + "T12:00:00")});
    const page = await ctx.newPage(); page.errs = []; page.on("pageerror", e => page.errs.push(e.message));
    await page.goto(base); await page.waitForFunction(() => window.__sbPlan && document.querySelector(".focus.plan"), null, {timeout: 20000});
    page.plan = () => page.evaluate(() => { const p = __sbPlan(); delete p.est; return p; });
    return {ctx, page};
  };
  const row = (p, id) => p.ranked.find(x => x.id === id);
  // Do This Next and the first thing on today's timeline are always the same task
  const agree = (p, m) => { if (p.next && !p.next.study && p.firstSlot) ok(p.next.id === p.firstSlot, `${m}: Do This Next (${p.next.id}) is first on the timeline (${p.firstSlot})`); };
  const done = async (ctx, page) => { ok(page.errs.length === 0, "no page errors " + page.errs.join("; ")); await ctx.close(); };
  try {
    { // 1. Past due with no late work accepted: no time today, said once
      const {ctx, page} = await open([mk("d", "Lab report", "Lab", -2, 3, {late: "none"}), mk("e", "Homework", "Assignment", 3, 1), mk("p", "Essay", "Assignment", -1, 2, {late: "penalty"})]);
      const p = await page.plan();
      ok(row(p, "d").dead && row(p, "d").alloc === 0, "closed: overdue with no late work accepted gets no time");
      ok(row(p, "p").alloc > 0 && !row(p, "p").dead, "closed: overdue with late work accepted still gets time");
      ok(row(p, "e").alloc >= 1, "closed: the homework gets its full hour");
      ok(p.next.id !== "d", "closed: never Do This Next");
      const card = page.locator(".plan-notes .pn-late");
      ok(await card.count() === 1 && /talk to your instructor/i.test(await card.innerText()), "closed: one note says to talk to your instructor");
      await page.locator('.plan-notes [data-act="closed-ok"]').click(); await page.waitForTimeout(150);
      ok(await page.locator(".plan-notes .pn-late").count() === 0, "closed: Got It hides it");
      await page.reload(); await page.waitForFunction(() => window.__sbPlan && document.querySelector(".focus.plan"));
      ok(await page.locator(".plan-notes .pn-late").count() === 0, "closed: and it stays hidden");
      agree(p, "closed"); await done(ctx, page);
    }
    { // 2. Due earlier today: past its due time it is late, and the late policy decides
      const {ctx, page} = await open([mk("a", "Reading quiz", "Assignment", 0, 1, {time: "09:00", late: "none", weight: 1}), mk("a2", "Worksheet", "Assignment", 0, 1, {time: "09:00", late: "penalty", latePen: 20, weight: 4}), mk("b", "Essay", "Assignment", 1, 4, {weight: 20}), mk("c", "Lab prep", "Assignment", 0, 3, {time: "13:00"})]);
      const p = await page.plan();
      ok(row(p, "a").dead && row(p, "a").alloc === 0, "due time passed: no late work, so no time today");
      ok(row(p, "a2").past && !row(p, "a2").dead && row(p, "a2").tier, "due time passed: late work accepted, so it is due now");
      ok(row(p, "a2").reasons.some(r => /Was due at 9/.test(r)) && row(p, "a2").reasons.some(r => /loses 20% a day/.test(r)), "due time passed: says when it was due and the penalty you set");
      ok(row(p, "c").reasons.some(r => /more time than is left before 1/.test(r)), "due at 1 PM: only the hour before it counts");
      ok(p.next.id !== "a", "due time passed: never Do This Next");
      agree(p, "due time"); await done(ctx, page);
    }
    { // 3. A step with no due date that a dated task waits on
      const {ctx, page} = await open([mk("o", "Outline", "Other", null, 2), mk("s", "Essay", "Assignment", 4, 6, {dependsOn: ["o"], weight: 25})]);
      const p = await page.plan(), o = row(p, "o");
      ok(o && o.alloc > 0, "undated step: it is in today's plan");
      ok(o.due && o.due <= addD(2), `undated step: due early enough to leave time for the essay (${o.due})`);
      ok(p.blocked.includes("s"), "undated step: the essay waits for it");
      ok(o.reasons[0].includes("Essay needs it first"), "undated step: says why");
      ok(p.next.id === "o", "undated step: it is Do This Next");
      ok(await page.locator(".rb-lb").filter({hasText: "Outline"}).count() === 0, "undated step: not pinned on the deadline ribbon");
      agree(p, "undated"); await done(ctx, page);
    }
    { // 4. Late work that loses marks every day against a small task due today
      const tasks = [mk("p", "Project", "Project", -1, 3, {late: "penalty", weight: 30}), mk("r", "Reading", "Reading", 0, 0.5, {weight: 1})];
      let {ctx, page} = await open(tasks);
      let p = await page.plan();
      ok(p.ranked[0].id === "p" && p.next.id === "p", "short of time: the 30% project losing marks comes before the 1% reading");
      ok(row(p, "p").reasons.some(r => /saves the most marks/.test(r)), "short of time: says it saves the most marks");
      agree(p, "penalty"); await done(ctx, page);
      ({ctx, page} = await open(tasks, {th: 4}));
      p = await page.plan();
      ok(row(p, "p").alloc >= 3 && row(p, "r").alloc >= 0.5, "enough time: both get done today");
      await done(ctx, page);
      ({ctx, page} = await open([mk("f", "Report", "Assignment", -1, 2, {late: "free", weight: 10}), mk("h", "Homework", "Assignment", 1, 2, {weight: 10})]));
      p = await page.plan();
      ok(!row(p, "f").tier && p.ranked[0].id === "h", "late work with no penalty waits behind work due tomorrow");
      await done(ctx, page);
    }
    { // 5. In-person exams: study time from one to two weeks before
      const exam = (id, due, o) => mk(id, "Midterm", "Exam", due, null, Object.assign({weight: 30, remote: "no", remoteSrc: "user"}, o || {}));
      let {ctx, page} = await open([exam("x", 3), mk("h", "Lab report", "Lab", 6, 3, {weight: 5})]);
      let p = await page.plan(), s = row(p, "study:x");
      ok(s && s.alloc >= 1, `exam in 3 days: study time today (${s && s.alloc}h)`);
      ok(row(p, "x").alloc === 0, "exam in 3 days: the exam itself is not a task");
      ok(p.next.id === "study:x" && p.next.study, "exam in 3 days: Do This Next is studying for it");
      ok(await page.locator(".next-up .nu-title").first().innerText().then(t => /^Study for Midterm/.test(t.trim())), "exam in 3 days: the card says Study for Midterm");
      ok(await page.locator('.next-up [data-act="pomo-task"][data-study="1"][data-id="x"]').count() === 1, "exam in 3 days: the focus button studies for the exam");
      ok(await page.locator(".rb-lb").filter({hasText: "Study for"}).count() === 0, "exam in 3 days: no extra ribbon pin");
      agree(p, "exam"); await done(ctx, page);
      const leadOf = async (tasks, id) => { const o = await open(tasks), q = await o.page.plan(); const r = q.laterRows.find(x => x.id === "study:" + id) || row(q, "study:" + id); await done(o.ctx, o.page); return r; };
      let r = await leadOf([exam("x", 12)], "x");
      ok(r && r.start === addD(2), `exam in 12 days, 0% prepared: study starts 10 days before (${r && r.start})`);
      r = await leadOf([exam("x", 12, {pct: 80})], "x");
      ok(r && r.start === addD(5), `exam in 12 days, 80% prepared: study starts 7 days before (${r && r.start})`);
      r = await leadOf([exam("x", 12, {pct: 60})], "x");
      ok(r && r.start === addD(4), `exam in 12 days, 60% prepared: study starts 8 days before (${r && r.start})`);
      r = await leadOf([exam("x", 12), mk("g", "Assignment 1", "Assignment", -10, 2, {status: "done", weight: 40, mark: {got: 20, outOf: 100}})], "x");
      ok(r && r.start === addD(-2), `exam in 12 days, failing the course: study starts 14 days before (${r && r.start})`);
      ({ctx, page} = await open([exam("x", 12), mk("g", "Assignment 1", "Assignment", -10, 2, {status: "done", weight: 40, mark: {got: 20, outOf: 100}})]));
      p = await page.plan();
      ok(row(p, "study:x") && row(p, "study:x").alloc > 0, "exam in 12 days, failing the course: study time today");
      await done(ctx, page);
      r = await leadOf([mk("q", "Quiz 2", "Quiz", 12, null, {weight: 5, remote: "no", remoteSrc: "user"})], "q");
      ok(r && r.start === addD(7), `quiz in 12 days: study starts 5 days before (${r && r.start})`);
      ({ctx, page} = await open([exam("x", 5, {pct: 100})]));
      p = await page.plan();
      ok(!row(p, "study:x"), "exam marked 100% prepared: no study entry");
      await done(ctx, page);
    }
    { // 6. Do This Next adjusts for right now, and the timeline follows it
      const {ctx, page} = await open([mk("A", "Problem set", "Assignment", 3, 2, {weight: 10}), mk("B", "Worksheet", "Assignment", 3, 1, {weight: 10, history: [{at: Date.now() - 3600e3, text: "Focus session: 25m"}]})]);
      const p = await page.plan();
      ok(p.next.id === "B" && p.next.why.some(w => /just working on this/.test(w)), "right now: what you were just working on comes first");
      ok(p.firstSlot === "B", "right now: and the timeline starts with it");
      await done(ctx, page);
    }
    { // 7. Busy days coming up
      const events = [{id: "ev1", title: "Clinical placement", date: addD(1), allDay: true, courseId: ""}];
      const {ctx, page} = await open([mk("e", "Care plan", "Assignment", 3, 12, {weight: 20})], {events});
      let p = await page.plan();
      ok(p.busyAhead && p.busyAhead.add >= 0.5, `busy days: more study time is suggested (${p.busyAhead && p.busyAhead.add}h)`);
      const card = page.locator(".plan-notes .pn-busy");
      ok(await card.count() === 1 && /Tomorrow \(Clinical placement\)/.test(await card.innerText()), "busy days: the card names tomorrow's placement");
      const to = p.busyAhead.to;
      await card.locator('[data-act="today-set"]').click(); await page.waitForTimeout(200);
      p = await page.plan();
      ok(Math.abs(p.thSet - to) < 0.01, `busy days: one tap sets today to ${to}h`);
      ok(await page.locator(".plan-notes .pn-busy").count() === 0, "busy days: then the card goes away");
      await done(ctx, page);
      const o = await open([mk("e", "Care plan", "Assignment", 3, 12, {weight: 20})], {events});
      await o.page.locator('.plan-notes .pn-busy [data-act="busy-hide"]').click(); await o.page.waitForTimeout(150);
      ok(await o.page.locator(".plan-notes .pn-busy").count() === 0, "busy days: Not Today hides it");
      await done(o.ctx, o.page);
      const q = await open([mk("e", "Care plan", "Assignment", 3, 12, {weight: 20})]), qp = await q.page.plan();
      ok(!qp.busyAhead, "no busy days: no card");
      await done(q.ctx, q.page);
    }
    { // 8. Not enough time for everything: the fewest marks for the time go last, and the plan says so
      const {ctx, page} = await open([mk("a", "Essay", "Assignment", 2, 4, {weight: 20}), mk("b", "Report", "Assignment", 2, 4, {weight: 10}), mk("c", "Reading log", "Assignment", 2, 4, {weight: 1})]);
      const p = await page.plan();
      ok(p.drop && p.drop.ids[0] === "c", "short of time: the 1% reading log gives the fewest marks for the time");
      ok(p.ranked[p.ranked.length - 1].id === "c" && row(p, "c").drop, "short of time: it is ranked last");
      const w = await page.locator(".plan-notes .pn-warn").innerText();
      ok(/Fewest marks for the time: Reading log/.test(w), "short of time: the warning names it");
      await done(ctx, page);
    }
  } finally { await browser.close(); server.close(); }
  console.log(`\n${n} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
