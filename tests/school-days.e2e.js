// node tests/school-days.e2e.js [shotsDir] (Playwright + Chromium)
// School days: days off pause classes and the plan treats them as free; a rotating cycle (Day 1 to 6, A/B days) that
// skips weekends and days off; set up in the School Days sheet or right in a course's Class Times.
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const root = path.join(__dirname, ".."), SHOTS = process.argv[2] || "";
const MIME = {".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".webmanifest": "application/manifest+json", ".png": "image/png", ".css": "text/css", ".woff2": "font/woff2", ".svg": "image/svg+xml"};
const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x"); let p = decodeURIComponent(u.pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  res.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const addD = n => { const d = new Date(); d.setDate(d.getDate() + n); return iso(d); };
const DAY = 864e5;
const mk = (id, title, type, due, o) => Object.assign({id, title, courseId: "c1", type, due: due == null ? "" : addD(due), start: addD(-3), hours: type === "Exam" || type === "Quiz" ? null : 2, status: "todo", priority: "med", created: Date.now() - 20 * DAY, checklist: [], history: []}, o || {});
const card = (id, o) => Object.assign({id, front: "Q " + id, back: "A " + id, box: 1, due: addD(3), last: addD(-1), seen: 3, right: 1, wrong: 2, rate: "hard"}, o || {});
const COURSES = [{id: "c1", name: "Biology", code: "BIO 101", color: "#3B6FE0"}, {id: "c2", name: "Chemistry", code: "CHEM 110", color: "#D9822B"}, {id: "c3", name: "History", code: "HIS 200", color: "#1E9E74"}];
const inPerson = {remote: "no", remoteSrc: "user"};
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  const open = async (seed, o) => {
    o = o || {};
    const ctx = await browser.newContext({viewport: o.vp || {width: 1280, height: 900}});
    await ctx.addInitScript(([seed, th]) => { window.__SB_TEST = true; try { if (!sessionStorage.getItem("seeded")) { sessionStorage.setItem("seeded", "1"); localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("studyboard:tour", "1");
      localStorage.setItem("coursework:v2", JSON.stringify(seed)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1");
      const d = new Date(th[1] + "T08:00:00"), t = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); localStorage.setItem("coursework:today", JSON.stringify({d: t, h: th[0]})); } } catch (e) {} },
      [Object.assign({v: 2, courses: COURSES, settings: {capacity: 15, dailyHours: 3}, updated: 1, notes: [], files: [], events: []}, seed), [o.th || 3, o.day || "2026-10-05"]]);
    await ctx.clock.install({time: new Date((o.day || "2026-10-05") + "T08:00:00")});
    const page = await ctx.newPage(); page.errs = []; page.on("pageerror", e => page.errs.push(e.message));
    await page.goto(base); await page.waitForFunction(() => window.__sbPlan && window.__sbSync && document.querySelector("#navDate") && document.querySelector("#view").children.length, null, {timeout: 20000});
    await page.keyboard.press("Escape"); await page.waitForTimeout(200);
    return {ctx, page};
  };
  const act = (page, a, id, extra) => page.evaluate(([a, i, x]) => { const b = document.createElement("button"); b.dataset.act = a; if (i) b.dataset.id = i; Object.assign(b.dataset, x || {}); b.hidden = true; document.body.appendChild(b); b.click(); b.remove(); }, [a, id, extra]);
  const shot = async (page, name, sel) => { if (!SHOTS) return; await page.waitForTimeout(250); const el = sel ? page.locator(sel).first() : null; if (el && await el.count()) await el.screenshot({path: path.join(SHOTS, name + ".png")}); else await page.screenshot({path: path.join(SHOTS, name + ".png")}); };
  const done = async (ctx, page) => { ok(page.errs.length === 0, "no page errors " + page.errs.join("; ")); await ctx.close(); };
  const task = (page, id) => page.evaluate(id => window.__sbSync.state.tasks[id], id);
  try {
    const W = (days, start, end, kind) => ({id: "w" + start.replace(":", ""), kind: kind || "Lecture", days, start, end, where: "Room 101"});
    const R = (cyc, start, end, kind) => ({id: "r" + start.replace(":", "") + cyc.join(""), kind: kind || "Lecture", days: [], cyc, start, end, where: "Room 204"});
    const school = {off: [{id: "t", name: "Thanksgiving", from: "2026-10-12", to: "2026-10-12"}], cycle: {n: 6, ref: "2026-10-05", k: 1, days: [1, 2, 3, 4, 5], names: "num"}};
    const courses = [{id: "c1", name: "Biology 11", code: "BIO 11", color: "#3B6FE0", meetings: [W([1, 3], "09:00", "10:00")]}, {id: "c2", name: "English 11", code: "ENG 11", color: "#D9822B", meetings: [R([1, 4], "11:00", "12:00")]}];
    const occ = (page, from, to) => page.evaluate(([a, b]) => [...document.querySelectorAll(".sch-col")].filter(c => c.dataset.date >= a && c.dataset.date <= b).map(c => c.dataset.date + ":" + [...c.querySelectorAll(".sch-b")].map(x => x.textContent.replace(/\s+/g, " ").trim().slice(0, 12)).join("|")), [from, to]);
    const toSchedule = async (page, week) => { await page.evaluate(w => { const S = window.__sbSync; S.ui.tab = "schedule"; S.ui.planView = "schedule"; S.ui.schWeek = w; S.render(); }, week); await page.waitForSelector(".sch-grid"); };
    { // 1. A rotating cycle, with Thanksgiving pausing it
      const {ctx, page} = await open({courses, settings: {capacity: 15, dailyHours: 3, school}, tasks: []});
      ok(/Day 1/.test(await page.textContent("#navDate")), "the sidebar says what today is at school: " + (await page.textContent("#navDate")));
      await toSchedule(page, "2026-10-12");
      const heads = await page.$$eval(".sch-head .sch-sd", els => els.map(e => e.textContent));
      ok(heads.join() === "Thanksgiving,Day 6,Day 1,Day 2,Day 3", "the week after: Thanksgiving, then the cycle picks up where it left off: " + heads.join());
      const cols = await occ(page, "2026-10-12", "2026-10-16");
      ok(!/BIO|ENG/.test(cols[0]), "no classes on Thanksgiving: " + cols[0]);
      ok(/BIO/.test(cols[2]) && /ENG/.test(cols[2]) && !/ENG/.test(cols[1]) && /ENG/.test(cols[4]) === false, "English meets on Days 1 and 4 only (Wed Oct 14 is Day 1): " + cols.join(" / "));
      ok(await page.locator(".sch-col.is-off").count() === 1, "the day off is shaded");
      await shot(page, "s1-schedule", ".sch-wrap");
      await toSchedule(page, "2026-10-05");
      const cols0 = await occ(page, "2026-10-05", "2026-10-09");
      ok(/ENG/.test(cols0[0]) && /ENG/.test(cols0[3]) && !/ENG/.test(cols0[1]), "the first week: English on Mon (Day 1) and Thu (Day 4)");
      await done(ctx, page);
    }
    { // 2. On a day off, Today's Plan has no classes in it
      const {ctx, page} = await open({courses, settings: {capacity: 15, dailyHours: 3, school}, tasks: [mk("a", "Lab report", "Lab", 3, {hours: 2})]}, {day: "2026-10-12"});
      ok(/Thanksgiving/.test(await page.textContent("#navDate")), "the sidebar says it's Thanksgiving");
      const rail = await page.evaluate(() => (document.querySelector(".dtl-rail") || {textContent: ""}).textContent);
      ok(!/BIO 11|ENG 11/.test(rail), "today's timeline has no classes: " + rail.replace(/\s+/g, " ").slice(0, 120));
      await done(ctx, page);
    }
    { // 3. The School Days sheet: a snow day and an A/B cycle
      const {ctx, page} = await open({courses: [courses[0]], settings: {capacity: 15, dailyHours: 3}, tasks: []});
      await toSchedule(page, "2026-10-05");
      ok(await page.locator('[data-act="school-open"]').count() === 1, "School Days sits beside Availability on the Schedule");
      await page.click('[data-act="school-open"]'); await page.waitForSelector("dialog[open] .sd-sheet");
      await page.fill("#sdName", "Snow Day"); await page.fill("#sdFrom", "2026-10-07"); await page.click("#sdAdd");
      ok(/Snow Day/.test(await page.textContent("#sdList")), "a day off is added to the list");
      await page.check('input[name="sdMode"][value="cycle"]', {force: true});
      await page.selectOption("#sdN", "2"); await page.selectOption("#sdNames", "abc"); await page.selectOption("#sdK", "2");
      ok(/Today is/.test(await page.textContent("#sdRefL")), "it asks what today is");
      await shot(page, "s3-sheet", "dialog[open] .sheet");
      await page.click("dialog[open] [data-submit]"); await page.waitForTimeout(300);
      const sc = await page.evaluate(() => window.__sbSync.state.settings.school);
      ok(sc && sc.off.length === 1 && sc.off[0].name === "Snow Day" && sc.cycle.n === 2 && sc.cycle.k === 2 && sc.cycle.ref === "2026-10-05" && sc.cycle.names === "abc", "saved: " + JSON.stringify(sc));
      ok(/B Day/.test(await page.textContent("#navDate")), "today is a B Day");
      await toSchedule(page, "2026-10-05");
      const heads = await page.$$eval(".sch-head .sch-sd", els => els.map(e => e.textContent));
      ok(heads.join() === "B Day,A Day,Snow Day,B Day,A Day", "the snow day pauses the A/B cycle: " + heads.join());
      await done(ctx, page);
    }
    { // 4. A course's class times: pick cycle days once a rotating schedule exists
      const {ctx, page} = await open({courses: [courses[0]], settings: {capacity: 15, dailyHours: 3, school}, tasks: []});
      await act(page, "edit-course", "c1"); await page.waitForSelector("dialog[open] #meetList");
      ok(await page.locator("#cycSet").count() === 0, "no setup link once the school has a cycle");
      await page.selectOption('#meetList .meet-row select[data-k="rep"]', "c");
      await page.click('#meetList [data-cyc="2"]'); await page.click('#meetList [data-cyc="5"]');
      await shot(page, "s4-course", "dialog[open] .meet-fs");
      await page.click("dialog[open] [data-submit]"); await page.waitForTimeout(300);
      const m = await page.evaluate(() => window.__sbSync.state.courses.c1.meetings[0]);
      ok(JSON.stringify(m.cyc) === "[2,5]" && m.days.length === 0, "the class time is saved on Days 2 and 5: " + JSON.stringify(m));
      await done(ctx, page);
    }
    { // 5. Or set the cycle up right in the course form, without losing what you typed
      const {ctx, page} = await open({courses: [], settings: {capacity: 15, dailyHours: 3}, tasks: []});
      await act(page, "new-course"); await page.waitForSelector("dialog[open] #meetList");
      await page.fill('dialog[open] input[name="name"]', "Chemistry 11");
      ok(await page.locator("#cycSet").count() === 1, "a small link offers a rotating schedule");
      await page.click("#cycSet"); await page.selectOption("#cycN", "4"); await page.selectOption("#cycK", "3");
      ok(await page.locator("#meetList [data-cyc]").count() === 4, "the class time now picks from Days 1 to 4");
      await page.click('#meetList [data-cyc="1"]');
      await page.click("dialog[open] [data-submit]"); await page.waitForTimeout(300);
      const r = await page.evaluate(() => ({c: Object.values(window.__sbSync.state.courses)[0], s: window.__sbSync.state.settings.school}));
      ok(r.c && r.c.name === "Chemistry 11" && JSON.stringify(r.c.meetings[0].cyc) === "[1]", "the course saves with its Day 1 class");
      ok(r.s && r.s.cycle && r.s.cycle.n === 4 && r.s.cycle.k === 3 && r.s.cycle.ref === "2026-10-05", "and the cycle is saved for the school: " + JSON.stringify(r.s));
      await done(ctx, page);
    }
  } finally { await browser.close(); server.close(); }
  console.log(`\n${n} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
