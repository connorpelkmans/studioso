// node tests/estimates.e2e.js [shotsDir] (Playwright + Chromium)
// Time estimates that keep up: work left as a range, your pace on the task, running over, the "how much is left?" check-in,
// and what a finished task teaches the plan.
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
      const d = new Date(), t = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); localStorage.setItem("coursework:today", JSON.stringify({d: t, h: th})); } } catch (e) {} },
      [Object.assign({v: 2, courses: COURSES, settings: {capacity: 15, dailyHours: 3}, updated: 1, notes: [], files: [], events: []}, seed), o.th || 3]);
    await ctx.clock.install({time: new Date(iso(new Date()) + "T12:00:00")});
    const page = await ctx.newPage(); page.errs = []; page.on("pageerror", e => page.errs.push(e.message));
    await page.goto(base); await page.waitForFunction(() => window.__sbPlan && window.__sbSync && document.querySelector(".focus.plan"), null, {timeout: 20000});
    await page.keyboard.press("Escape"); await page.waitForTimeout(200);
    return {ctx, page};
  };
  const act = (page, a, id, extra) => page.evaluate(([a, i, x]) => { const b = document.createElement("button"); b.dataset.act = a; if (i) b.dataset.id = i; Object.assign(b.dataset, x || {}); b.hidden = true; document.body.appendChild(b); b.click(); b.remove(); }, [a, id, extra]);
  const shot = async (page, name, sel) => { if (!SHOTS) return; await page.waitForTimeout(250); const el = sel ? page.locator(sel).first() : null; if (el && await el.count()) await el.screenshot({path: path.join(SHOTS, name + ".png")}); else await page.screenshot({path: path.join(SHOTS, name + ".png")}); };
  const done = async (ctx, page) => { ok(page.errs.length === 0, "no page errors " + page.errs.join("; ")); await ctx.close(); };
  const task = (page, id) => page.evaluate(id => window.__sbSync.state.tasks[id], id);
  try {
    // five finished labs that took 1.0x to 1.6x their 2h estimates
    const hist = [1, 1.1, 1.3, 1.4, 1.6].map((r, i) => mk("h" + i, "Lab " + i, "Lab", -10 - i, {status: "done", doneAt: Date.now() - (10 + i) * DAY, hours: 2, focusMin: Math.round(120 * r)}));
    const plan = page => page.evaluate(() => window.__sbPlan());
    const row = (p, id) => p.ranked.find(x => x.id === id) || p.laterRows.find(x => x.id === id);
    const task = (page, id) => page.evaluate(id => window.__sbSync.state.tasks[id], id);
    { // 1. A range, planned toward the long end when the due date is close
      const {ctx, page} = await open({tasks: hist.concat([mk("a", "Lab Report 4", "Lab", 2, {hours: 3}), mk("b", "Lab Report 5", "Lab", 9, {hours: 3})])});
      const p = await plan(page), a = row(p, "a"), b = row(p, "b");
      ok(a.R > b.R + 0.1, `due in 2 days, more time is set aside than for the same task due in 9 (${a.R.toFixed(2)}h vs ${b.R.toFixed(2)}h)`);
      ok(b.R > 3.5 && b.R < 4.4, "the usual plan allows for how long labs take you (about 1.3x of 3h): " + b.R.toFixed(2));
      const why = p.next && p.next.id === "a" ? p.next.why.join(" | ") : "";
      ok(/\d+h( \d+m)? to \d+h( \d+m)? of work left, planned for the longer end/.test(why), "Do This Next gives the range and says why it plans long: " + why);
      await act(page, "edit-task", "a"); await page.waitForSelector("dialog[open]");
      await done(ctx, page);
    }
    { // 2. Running over with nothing marked done: the time left grows instead of sitting at a sliver
      const {ctx, page} = await open({tasks: [mk("o", "Essay", "Assignment", 6, {hours: 3, focusMin: 330})]});
      const p = await plan(page), o = row(p, "o");
      ok(o.R >= 1, "5h 30m into a 3h essay, it plans at least an hour more (it used to be 27m): " + o.R.toFixed(2));
      await done(ctx, page);
    }
    { // 3. Your pace: half the checklist done in 3h of a 2h estimate means more than 1h left
      const {ctx, page} = await open({tasks: [mk("q", "Problem Set", "Assignment", 8, {hours: 2, focusMin: 180, checklist: [{text: "1", done: true}, {text: "2", done: true}, {text: "3", done: false}, {text: "4", done: false}]})]});
      const r = row(await plan(page), "q").R;
      ok(r > 1.6 && r < 2.4, "pace and estimate count half each: about 2h left, not 1h: " + r.toFixed(2));
      await act(page, "edit-task", "q"); await page.waitForSelector("dialog[open]");
      const v = (await page.locator("dialog[open]").innerText()).replace(/\s+/g, " ");
      ok(/focused so far · (about \d|\d+h( \d+m)? to )[^·]* left/.test(v), "the task view shows what's left once work has started: " + (v.match(/focused so far[^·]*·[^·]*/) || [""])[0]);
      await done(ctx, page);
    }
    { // 4. The check-in: past 80% of the plan, it asks; the answer sets what's left, and it doesn't ask again right away
      const {ctx, page} = await open({tasks: [mk("c", "Lab Report 6", "Assignment", 8, {hours: 2, focusMin: 90})]});
      await act(page, "acc-log", "c", {min: "15"});
      await page.waitForSelector('#accChip[data-kind="left"]:not([hidden])', {timeout: 5000});
      const chip = (await page.locator("#accChip").innerText()).replace(/\s+/g, " ");
      ok(/How much of “Lab Report 6” is left\?/.test(chip) && /Almost Done/.test(chip) && /About Half/.test(chip) && /More Than I Thought/.test(chip) && /Barely Started/.test(chip), "it asks how much is left, with four answers: " + chip.slice(0, 160));
      ok(!/In My Words/.test(chip), "with no AI set up, there's no In My Words option");
      await shot(page, "e4-checkin");
      const times = await page.locator('#accChip [data-act="acc-left"] .acc-tm').allInnerTexts();
      ok(times.length === 4 && times.every(Boolean), "each answer shows the time it leads to: " + times.join(", "));
      await page.click('#accChip [data-act="acc-left"][data-v="half"]');
      await page.waitForTimeout(200);
      const t = await task(page, "c");
      ok(t.left && t.left.p === 0.5 && t.left.fm === 105 && t.status !== "done", "the answer is saved as time left, and the task stays open: " + JSON.stringify(t.left));
      const r = row(await plan(page), "c").R;
      ok(Math.abs(r - t.left.h) < 0.05 && r > 1, `and the plan uses it (${r.toFixed(2)}h)`);
      await act(page, "acc-log", "c", {min: "15"}); await page.waitForTimeout(300);
      ok(await page.locator('#accChip:not([hidden])[data-kind="left"]').count() === 0, "15 more minutes doesn't ask again");
      const r2 = row(await plan(page), "c").R;
      ok(r2 < r && r2 > r - 0.3, `time logged after the answer comes off what you said was left (${r2.toFixed(2)}h)`);
      await done(ctx, page);
    }
    { // 5. Ticking a checklist item after the check-in: the checklist leads again
      const {ctx, page} = await open({tasks: [mk("k", "Report", "Assignment", 8, {hours: 2, focusMin: 120, left: {h: 3, fm: 120, ck: 0, pct: 0, p: 0.25, at: Date.now()}, checklist: [{text: "a", done: false}, {text: "b", done: false}]})]});
      const r0 = row(await plan(page), "k").R;
      ok(Math.abs(r0 - 3) < 0.05, "the check-in answer counts: " + r0.toFixed(2));
      await page.evaluate(() => { const S = window.__sbSync, t = S.clone(S.state.tasks.k); t.checklist[0].done = true; S.applyChanges([{kind: "task", id: "k", after: t}], null); });
      const r1 = row(await plan(page), "k").R;
      ok(Math.abs(r1 - 3) > 0.05, "after ticking an item, the plan reads the checklist and your pace instead: " + r1.toFixed(2));
      await done(ctx, page);
    }
    { // 6. Finishing a task with tracked time says what the plan learned
      const {ctx, page} = await open({tasks: hist.concat([mk("f", "Lab Report 7", "Lab", 3, {hours: 2, focusMin: 200})])});
      await act(page, "toggle", "f");
      await page.waitForSelector('#accChip[data-kind="learned"]:not([hidden])', {timeout: 5000});
      const s = (await page.locator("#accChip").innerText()).replace(/\s+/g, " ");
      ok(/took 3h 20m, against your 2h estimate/.test(s) && /labs/.test(s) && /\d\.\dx your estimate/.test(s), "a short note: " + s);
      await shot(page, "e6-learned");
      await done(ctx, page);
    }
    { // 7. The hint under Hours gives the range the plan will use
      const {ctx, page} = await open({tasks: hist.concat([mk("g", "Lab Report 8", "Lab", 9, {hours: 3})])});
      await page.evaluate(() => { const b = document.createElement("button"); b.dataset.act = "edit-task"; b.dataset.id = "g"; document.body.appendChild(b); b.click(); b.remove(); });
      await page.waitForSelector("dialog[open]");
      const edit = page.locator('dialog[open] [data-act="edit"], dialog[open] button:has-text("Edit")').first();
      if (await edit.count()) await edit.click();
      await page.waitForSelector("#accHint", {state: "attached", timeout: 5000});
      await page.waitForTimeout(200);
      const h = (await page.locator("#accHint").textContent()).replace(/\s+/g, " ");
      ok(/You usually take about 1\.\dx your estimate on (BIO 101 )?labs\. Today's Plan counts this as about \d+h( \d+m)? \(\d+h( \d+m)? to \d+h( \d+m)?\)\./.test(h), "the hint: " + h);
      const ph = (await page.locator("#planHint").textContent()).replace(/\s+/g, " ");
      ok(/Estimated \d+h( \d+m)? to \d+h( \d+m)? of work left/.test(ph), "and the plan line under it gives the range: " + ph.slice(0, 90));
      await done(ctx, page);
    }
  } finally { await browser.close(); server.close(); }
  console.log(`\n${n} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
