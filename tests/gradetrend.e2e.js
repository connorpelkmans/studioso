// node tests/gradetrend.e2e.js [screenshot-dir]   (Playwright + Chromium; see tests/pw.js)
// Grade trend: chart in a course's Grades tab (weighted marks, goal line, summary, hidden data table, LMS-synced mark), empty states, sparkline on course cards, dark theme, XL text.
// Study Groups on phones: the Groups tab in the bottom bar (Board to Groups, no More button), aria-current on Groups, the "Study with a friend" Board card
// (queued behind a backup reminder, signed out, signed in with and without groups, Not now, Don't show again), desktop unchanged, no horizontal scroll, 44px targets.
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const root = path.join(__dirname, ".."), SHOTS = process.argv[2] || process.env.SHOTS || path.join(require("os").tmpdir(), "gt-shots");
fs.mkdirSync(SHOTS, {recursive: true});
const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x"); let p = decodeURIComponent(u.pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  const ext = path.extname(f), mime = {".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".css": "text/css", ".webmanifest": "application/manifest+json"};
  res.writeHead(200, {"content-type": mime[ext] || "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const T = (id, title, course, due, w, mark, extra) => Object.assign({id, title, courseId: course, type: "Assignment", due, start: due, status: mark ? "done" : "todo", priority: "med", weight: w, created: 1000 + Number(id.replace(/\D/g, "")), mark: mark ? {got: mark, outOf: 100} : undefined}, extra || {});
const SEED = () => ({v: 2, updated: 1, settings: {}, courses: [
  {id: "c1", name: "Marine Biology", code: "BIO210", color: "#3B6FE0", grading: {goal: 80}},
  {id: "c2", name: "Statistics", code: "STA101", color: "#1E9E74"},
  {id: "c3", name: "Art History", code: "ART100", color: "#C79A12"}], tasks: [
  T("1", "Quiz 1", "c1", "2026-09-01", 10, 70), T("2", "Lab report", "c1", "2026-09-10", 20, 78),
  T("3", "Midterm", "c1", "2026-09-20", 30, 84, {cv: {key: "cv|c1|midterm", ou: "1"}, mark: {got: 84, outOf: 100, src: "cv"}}), T("4", "Quiz 2", "c1", "2026-09-27", 10, 90),
  T("5", "Final", "c1", "2026-12-15", 30, null),
  T("6", "Assignment 1", "c2", "2026-09-05", 25, 88), T("7", "Assignment 2", "c2", "2026-12-05", 25, null),
  T("8", "Essay", "c3", "2026-12-01", null, null)].filter(Boolean)});
(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  const mkCtx = async (o = {}) => {
    const ctx = await browser.newContext({viewport: {width: o.w || 390, height: o.h || 844}});
    await ctx.addInitScript(([seed, stubGroups, backedUp]) => {
      try {
        if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("coursework:v2", JSON.stringify(seed)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("studyboard:tour", "done"); if (backedUp) localStorage.setItem("studioso:lastExport", String(Date.now())); }
      } catch (e) {}
      if (stubGroups != null) {
        const rows = stubGroups;
        const chain = () => new Proxy({}, {get: (t, k) => k === "then" ? (res => res({data: rows, error: null})) : () => chain()});
        window.__sbGroupsStub = {user: {id: "u1", email: "u1@x.com"}, client: {from: () => chain(), rpc: () => chain(), channel: () => ({on() { return this; }, subscribe() { return this; }}), removeChannel() {}}};
      }
    }, [o.seed ? o.seed(SEED()) : SEED(), o.groups == null ? null : o.groups, !!o.backedUp]);
    return ctx;
  };
  const open = async ctx => { const page = await ctx.newPage(); page.errs = []; page.on("pageerror", e => page.errs.push(e.message)); page.on("console", m => { if (m.type() === "error") page.errs.push(m.text()); }); await page.goto(base); await page.waitForSelector("#view", {state: "attached"}); await page.waitForTimeout(900); return page; };
  const noOverflow = async (page, what) => { const o = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth); ok(o <= 0, "no horizontal scroll " + what + " (" + o + ")"); };
  const noErr = (page, what) => ok(!page.errs.length, "no console errors " + what + (page.errs.length ? ": " + page.errs.join(" | ") : ""));
  const goCourse = async (page, id) => {
    await page.click('nav.tabs [data-tab="courses"]'); await page.waitForTimeout(150);
    await page.evaluate(() => { const b = document.querySelector('[data-act="cf-view"][data-id="courses"]'); if (b) b.click(); });
    await page.click(`.course-card[data-act="open-course"][data-id="${id}"]`); await page.waitForTimeout(150);
    await page.click('[data-act="course-tab"][data-id="grades"]'); await page.waitForTimeout(250);
  };
  try {
    /* ---------- Grade trend, phone ---------- */
    {
      const ctx = await mkCtx(); const page = await open(ctx);
      await page.click('nav.tabs [data-tab="courses"]'); await page.waitForTimeout(250);
      await page.evaluate(() => { const b = document.querySelector('[data-act="cf-view"][data-id="courses"]'); if (b) b.click(); });
      await page.waitForTimeout(150);
      ok(await page.locator('.course-card[data-id="c1"] .gt-spark').count() === 1, "course card with marks shows a sparkline");
      ok(await page.locator('.course-card[data-id="c2"] .gt-spark').count() === 0 && await page.locator('.course-card[data-id="c3"] .gt-spark').count() === 0, "no sparkline with one mark or no graded work");
      ok(/Trend:\s*Up \d+ points? over your last 4 grades/.test(await page.locator('.course-card[data-id="c1"] .gt-spark .sr').textContent()), "sparkline has a text equivalent");
      await page.screenshot({path: path.join(SHOTS, "courses-390.png")});
      await goCourse(page, "c1");
      ok(await page.locator(".gt-sec .gt-svg").count() === 1, "trend chart is in the course Grades tab");
      const svg = page.locator(".gt-svg");
      ok(await svg.getAttribute("role") === "img", "chart has role=img");
      const label = await svg.getAttribute("aria-label");
      ok(/^Up 11 points over your last 4 grades\./.test(label) && /Marine Biology|BIO210/.test(label) && /Your goal is 80%/.test(label), "accessible summary: " + label);
      ok(await page.locator(".gt-sum").textContent() === "Up 11 points over your last 4 grades", "visible one-line summary");
      ok(await page.locator(".gt-fig table.sr tbody tr").count() === 4, "hidden data table has a row per graded item (4)");
      ok(await page.locator(".gt-fig table.sr caption").count() === 1 && await page.locator(".gt-fig table.sr th[scope=col]").count() === 3, "data table has a caption and column headers");
      ok(await page.locator(".gt-goal").count() === 1 && /Goal 80%/.test(await page.locator(".gt-goal-t").textContent()), "goal line is drawn and labelled (dashed, not color alone)");
      ok(await page.locator(".gt-dot").count() === 4, "a marker per graded item");
      const cur = (await page.locator(".gr-top .gr-v").first().textContent()).trim(), lastLbl = (await page.locator(".gt-val").textContent()).trim();
      ok(lastLbl.startsWith(cur.split(" ")[0]), `chart's last value matches the grade shown (${lastLbl} vs ${cur})`);
      const rows = await page.$$eval(".gt-fig table.sr tbody tr td:last-child", t => t.map(e => e.textContent));
      ok(rows[0].startsWith("70%") && rows[3].startsWith(lastLbl.split(" ")[0]), "table runs 70% to the current grade: " + rows.join(", "));
      const box = await svg.boundingBox(); ok(box.width <= 390 && box.width > 250, "chart fits phone width (" + Math.round(box.width) + "px)");
      await noOverflow(page, "in the grade view"); noErr(page, "in the grade view");
      await svg.evaluate(e => e.scrollIntoView({block: "center"})); await page.waitForTimeout(150);
      await page.screenshot({path: path.join(SHOTS, "trend-390.png")});
      await svg.screenshot({path: path.join(SHOTS, "trend-chart.png")});
      // dark theme and XL text
      await page.evaluate(() => { document.documentElement.dataset.theme = "dark"; document.documentElement.dataset.ts = "xl"; });
      await page.waitForTimeout(200);
      const dark = await page.evaluate(() => { const l = document.querySelector(".gt-line"), v = document.querySelector(".gt-val"); return {line: getComputedStyle(l).stroke, val: getComputedStyle(v).fill, bg: getComputedStyle(document.body).backgroundColor}; });
      ok(dark.line && dark.val && dark.val !== dark.bg, "dark theme: chart colors resolve (" + JSON.stringify(dark) + ")");
      await noOverflow(page, "dark and XL text"); await page.screenshot({path: path.join(SHOTS, "trend-390-dark-xl.png")});
      await page.evaluate(() => { document.documentElement.dataset.theme = "light"; document.documentElement.dataset.ts = "m"; });
      // a drop reads neutrally: change the last mark and look at the wording
      await ctx.close();
    }
    {
      const ctx = await mkCtx({seed: s => { s.tasks.find(t => t.id === "4").mark = {got: 50, outOf: 100}; s.tasks.find(t => t.id === "1").mark = {got: 95, outOf: 100}; return s; }}); const page = await open(ctx);
      await goCourse(page, "c1");
      const t = await page.locator(".gt-sum").textContent();
      ok(/^Down \d+ points? over your last 4 grades$/.test(t) && !/warn|drop|fall|worse|bad/i.test(t), "a drop is worded neutrally: " + t);
      await ctx.close();
    }
    {
      const ctx = await mkCtx(); const page = await open(ctx);
      await goCourse(page, "c2");
      ok(await page.locator(".gt-svg").count() === 0 && /One mark so far/.test(await page.locator(".gt-empty").textContent()), "one mark: friendly empty state, no chart");
      await page.screenshot({path: path.join(SHOTS, "trend-empty-390.png")});
      await ctx.close();
      const c2 = await mkCtx({seed: s => { s.tasks = s.tasks.filter(t => t.courseId !== "c2" || t.id === "7"); return s; }}); const p2 = await open(c2);
      await goCourse(p2, "c2");
      ok(/once you have two marks/.test(await p2.locator(".gt-empty").textContent()), "no marks: friendly empty state");
      await c2.close();
      const c3 = await mkCtx(); const p3 = await open(c3);
      await goCourse(p3, "c3");
      ok(await p3.locator(".gt-sec").count() === 0, "course with no graded work shows no trend section (its own empty prompt remains)");
      await c3.close();
    }
    {
      // undated items still chart; unweighted course math untouched
      const ctx = await mkCtx({seed: s => { s.tasks.forEach(t => { if (t.courseId === "c1") delete t.due; }); return s; }}); const page = await open(ctx);
      await goCourse(page, "c1");
      ok(await page.locator(".gt-dot").count() === 4, "items without dates are still charted");
      noErr(page, "with undated items"); await ctx.close();
    }

    /* ---------- Phone bar: Board to Groups, no More button (the three dots hold settings) ---------- */
    for (const W of [390, 360, 320]) {
      const ctx = await mkCtx({w: W, h: 760}); const page = await open(ctx);
      ok(!(await page.locator("nav.tabs .nav-more").isVisible()), `no More button in the phone bar @${W}`);
      const rects = await page.$$eval("nav.tabs .in > button", bs => bs.filter(b => b.offsetParent).map(b => { const r = b.getBoundingClientRect(); return {l: r.left, r: r.right, t: r.top, b: r.bottom, w: r.width, h: r.height, tx: b.textContent.trim(), tab: b.dataset.tab || ""}; }));
      ok(rects.length === 7 && rects[0].tab === "board" && rects[6].tab === "groups", `7 tabs in the phone bar, Board to Groups @${W}: ${rects.map(r => r.tx).join(",")}`);
      ok(rects.every((r, i) => !i || r.l >= rects[i - 1].r - 0.5) && rects[0].l >= 0 && rects[6].r <= W, `bar buttons don't overlap and stay on screen @${W}`);
      ok(rects.every(r => r.h >= 44), `bar targets are at least 44px tall @${W}`);
      const spans = await page.$$eval("nav.tabs .in > button", bs => bs.filter(b => b.offsetParent).map(b => { const s = [...b.childNodes].find(x => x.nodeType === 3 && x.nodeValue.trim()) || b.querySelector(".nm-l").firstChild; const r = document.createRange(); r.selectNodeContents(s); const q = r.getBoundingClientRect(); return [q.left, q.right]; }));
      ok(spans.every((q, i) => !i || q[0] >= spans[i - 1][1] - 0.5), `bar labels never run into each other @${W}`);
      if (W === 390) await page.screenshot({path: path.join(SHOTS, "nav-390.png"), clip: {x: 0, y: 760 - 110, width: 390, height: 110}});
      await page.click('nav.tabs [data-tab="groups"]'); await page.waitForTimeout(300);
      ok(await page.evaluate(() => document.body.dataset.view) === "groups" && /Study Groups/.test(await page.locator("#view h2").first().textContent()), "the Groups tab opens the Study Groups page");
      ok(await page.locator('nav.tabs [data-tab="groups"]').getAttribute("aria-current") === "page", "Groups is highlighted while on Groups");
      ok(await page.locator('nav.tabs [data-tab][aria-current="page"]:visible').count() === 1, "no other visible tab claims to be current");
      ok(/Sign In|Set Up Sync/.test(await page.locator("#view .grp-offline").textContent()), "signed out, the Groups page offers Sign In");
      await page.click('nav.tabs [data-tab="board"]'); await page.waitForTimeout(200);
      ok(await page.locator('nav.tabs [data-tab="groups"]').getAttribute("aria-current") !== "page", "Groups no longer current after going to the Board");
      await noOverflow(page, `phone bar @${W}`); noErr(page, `phone bar @${W}`);
      await ctx.close();
    }
    // focus timer button and existing tabs still work
    {
      const ctx = await mkCtx(); const page = await open(ctx);
      for (const t of ["plan", "flashcards", "notes", "courses", "companion", "board"]) { await page.click(`nav.tabs [data-tab="${t}"]`); await page.waitForTimeout(150); ok(await page.locator(`nav.tabs [data-tab="${t}"]`).getAttribute("aria-current") === "page", "tab still works: " + t); }
      ok(await page.evaluate(() => !!document.querySelector('#navPomo[data-act="pomo-open"]')), "focus timer button still exists");
      await ctx.close();
    }
    // Board card, signed out
    {
      // The Board shows one notice at a time: a pending backup reminder comes first and the card waits behind "More Notices".
      const c0 = await mkCtx(); let page = await open(c0);
      const order = await page.evaluate(() => [...document.querySelectorAll("#view > *")].map(e => e.classList[0]));
      ok(order.indexOf("nudge") === 0 && order.indexOf("gn-card") > 0 && order.indexOf("gn-card") < order.indexOf("qa-wrap"), "with a backup reminder pending, it leads and the card is queued above quick add: " + order.join(","));
      ok(!(await page.locator(".gn-card").isVisible()) && await page.locator(".bn-more").isVisible(), "the queued card waits behind More Notices");
      await page.click(".bn-more"); await page.waitForTimeout(200);
      const r0 = await page.locator(".gn-card").boundingBox(), q0 = await page.locator(".qa-wrap").boundingBox();
      ok(r0 && q0 && r0.y + r0.height <= q0.y + 1, "More Notices shows the card, still above quick add");
      await c0.close();
      // backed up recently: the card is the notice that shows
      const ctx = await mkCtx({backedUp: true}); page = await open(ctx);
      const card = page.locator(".gn-card");
      ok(await card.count() === 1 && /Study with a friend/.test(await card.textContent()), "signed out: the Study with a friend card shows");
      ok(/sign in/i.test(await card.textContent()), "signed out: the card says an account comes first");
      const r = await card.boundingBox(), qa = await page.locator(".qa-wrap").boundingBox();
      ok(r.y + r.height <= qa.y + 1 && r.x >= 0 && r.x + r.width <= 390, "card sits above quick add and doesn't overlap it");
      const nb = await page.locator("nav.tabs").boundingBox(); ok(r.y + r.height < nb.y, "card is clear of the bottom bar");
      const small = await page.$$eval(".gn-card button", b => b.filter(x => x.getBoundingClientRect().height < 44).length); ok(small === 0, "card buttons are 44px+");
      await page.screenshot({path: path.join(SHOTS, "board-card-390.png")});
      await noOverflow(page, "with the card"); noErr(page, "Board with card");
      await page.click('.gn-card [data-act="gn-open"]'); await page.waitForTimeout(250);
      ok(await page.evaluate(() => document.body.dataset.view) === "groups" && /Sign In|Set Up Sync/.test(await page.locator("#view .grp-offline").textContent()), "card opens Study Groups, which nudges sign in");
      await page.click('nav.tabs [data-tab="board"]'); await page.waitForTimeout(200);
      ok(await page.locator(".gn-card").count() === 0, "after opening Groups the card rests for a while");
      await ctx.close();
      const c2 = await mkCtx({backedUp: true}); page = await open(c2);
      await page.click('.gn-card [data-act="gn-later"]'); await page.waitForTimeout(200);
      ok(await page.locator(".gn-card").count() === 0, "Not now hides the card");
      await page.reload(); await page.waitForTimeout(800);
      ok(await page.locator(".gn-card").count() === 0, "Not now is remembered after a reload");
      const st = await page.evaluate(() => JSON.parse(localStorage.getItem("studyboard:grpNudge")));
      ok(st.snooze > Date.now() + 20 * 864e5 && !st.never, "snoozed for about three weeks");
      await page.evaluate(() => localStorage.setItem("studyboard:grpNudge", JSON.stringify({snooze: Date.now() - 1, count: 1}))); await page.reload(); await page.waitForTimeout(800);
      ok(await page.locator(".gn-card").count() === 1, "it comes back after the snooze");
      await c2.close();
      const c3 = await mkCtx({backedUp: true}); page = await open(c3);
      await page.click('.gn-card [data-act="gn-never"]'); await page.reload(); await page.waitForTimeout(800);
      ok(await page.locator(".gn-card").count() === 0 && (await page.evaluate(() => JSON.parse(localStorage.getItem("studyboard:grpNudge")))).never === true, "Don't show again is permanent");
      await c3.close();
      const c4 = await mkCtx({backedUp: true, seed: s => { s.tasks = s.tasks.slice(0, 2); return s; }}); page = await open(c4);
      ok(await page.locator(".gn-card").count() === 0, "no card until there are a few tasks");
      await c4.close();
    }
    // Board card, signed in
    {
      const ctx = await mkCtx({groups: []}); const page = await open(ctx);
      await page.waitForTimeout(500);
      ok(await page.locator(".gn-card").count() === 1 && !/sign in/i.test(await page.locator(".gn-card").textContent()), "signed in with no groups: card shows (without the sign-in line)");
      await ctx.close();
      const c2 = await mkCtx({groups: [{id: "g1", name: "Bio Squad", course: "BIO", owner_id: "u1", invite_code: "ABC", created_at: "2026-01-01"}]}); const p2 = await open(c2);
      await p2.waitForTimeout(500);
      ok(await p2.locator(".gn-card").count() === 0, "signed in with a group: no card");
      await c2.close();
    }
    // desktop is unchanged
    {
      const ctx = await mkCtx({w: 1280, h: 900}); const page = await open(ctx);
      ok(!(await page.locator("nav.tabs .nav-more").isVisible()), "desktop: no More button");
      ok(await page.locator('nav.tabs [data-tab="groups"]').isVisible(), "desktop: side menu still lists Groups");
      await page.click('nav.tabs [data-tab="groups"]'); await page.waitForTimeout(200);
      ok(await page.locator('nav.tabs [data-tab="groups"]').getAttribute("aria-current") === "page", "desktop: Groups highlights as before");
      await ctx.close();
    }
    // landscape phone, tablet
    for (const [w, h, nm] of [[844, 390, "landscape"], [768, 1024, "tablet"]]) {
      const ctx = await mkCtx({w, h}); const page = await open(ctx);
      ok(!(await page.locator("nav.tabs .nav-more").isVisible()) && await page.locator('nav.tabs [data-tab="groups"]').isVisible(), nm + ": Groups is a tab, no More button");
      const rr = await page.$$eval("nav.tabs .in > button", bs => bs.filter(b => b.offsetParent).map(b => b.getBoundingClientRect()).map(r => [r.left, r.right]));
      ok(rr.every((r, i) => !i || r[0] >= rr[i - 1][1] - 0.5) && rr[rr.length - 1][1] <= w, nm + ": bar buttons don't overlap");
      await noOverflow(page, nm); noErr(page, nm); await ctx.close();
    }
    // reduced motion, XL text on the phone bar
    {
      const ctx = await browser.newContext({viewport: {width: 390, height: 780}, reducedMotion: "reduce"});
      await ctx.addInitScript(seed => { try { if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("coursework:v2", JSON.stringify(seed)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("studyboard:tour", "done"); localStorage.setItem("studyboard:textsize", "xl"); } } catch (e) {} }, SEED());
      const page = await open(ctx);
      await page.evaluate(() => { document.documentElement.dataset.ts = "xl"; }); await page.waitForTimeout(300);
      const rects = await page.$$eval("nav.tabs .in > button", bs => bs.filter(b => b.offsetParent).map(b => { const r = b.getBoundingClientRect(); return [r.left, r.right, r.height]; }));
      ok(rects.length === 7 && rects.every((r, i) => !i || r[0] >= rects[i - 1][1] - 0.5) && rects[6][1] <= 390, "XL text: bar still fits");
      const sp = await page.$$eval("nav.tabs .in > button", bs => bs.filter(b => b.offsetParent).map(b => { const s = [...b.childNodes].find(x => x.nodeType === 3 && x.nodeValue.trim()) || b.querySelector(".nm-l").firstChild; const r = document.createRange(); r.selectNodeContents(s); const q = r.getBoundingClientRect(); return [q.left, q.right]; }));
      ok(sp.every((q, i) => !i || q[0] >= sp[i - 1][1] - 0.5), "XL text: bar labels never run into each other");
      await page.screenshot({path: path.join(SHOTS, "nav-390-xl.png"), clip: {x: 0, y: 670, width: 390, height: 110}});
      await noOverflow(page, "XL text and reduced motion"); noErr(page, "XL text");
      await ctx.close();
    }
    console.log(`\ngradetrend e2e: ${n} checks passed. Screenshots in ${SHOTS}`);
  } catch (e) { console.error(e); process.exitCode = 1; }
  await browser.close(); server.close();
})();
