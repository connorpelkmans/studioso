// node tests/grade-insights.e2e.js (Playwright + Chromium; see tests/pw.js)
// Deeper grade analysis (GRADE-ANALYSIS-PLAN.md): Where Your Points Went, letter cutoffs, How You Compare, the mark moment,
// the forecast, Target GPA, Best Use of Your Next Hour, the term timeline, Your Patterns, This Week in Grades, What to Shore Up
// and the grade cards in the Term Recap, on a computer and on a phone
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const {SEED, SEED_INIT, day} = require("./grade-insights-seed");
const root = path.join(__dirname, ".."), SHOTS = process.argv[2] || process.env.SHOTS || path.join(require("os").tmpdir(), "gi-shots");
fs.mkdirSync(SHOTS, {recursive: true});
const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x"); let p = decodeURIComponent(u.pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  const mime = {".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".css": "text/css", ".webmanifest": "application/manifest+json"};
  res.writeHead(200, {"content-type": mime[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const txt = async loc => ((await loc.textContent()) || "").replace(/\s+/g, " ");
(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  try {
    for (const vp of [{width: 1100, height: 900, name: "desktop"}, {width: 390, height: 844, name: "phone"}]) {
      const ctx = await browser.newContext({viewport: {width: vp.width, height: vp.height}});
      await ctx.addInitScript(SEED_INIT, SEED());
      await ctx.addInitScript(() => { window.__sbDigestAny = true; window.__SB_TEST = true; });
      const page = await ctx.newPage(); const errs = [];
      page.on("pageerror", e => errs.push(e.message)); page.on("console", m => { if (m.type() === "error") errs.push(m.text()); });
      await page.goto(base); await page.waitForSelector("#view", {state: "attached"}); await page.waitForTimeout(900);
      const act = (a, id, extra) => page.evaluate(([a, id, extra]) => { const x = document.createElement("button"); x.dataset.act = a; if (id) x.dataset.id = id; Object.assign(x.dataset, extra || {}); x.hidden = true; document.body.appendChild(x); x.click(); x.remove(); }, [a, id, extra]).then(() => page.waitForTimeout(250));
      const overview = async () => {
        await page.click('nav.tabs [data-tab="courses"]'); await page.waitForTimeout(150);
        await page.evaluate(() => { const b = document.querySelector('[data-act="cf-view"][data-id="grades"]'); if (b) b.click(); }); await page.waitForTimeout(400);
      };
      const course = async id => {
        await page.click('nav.tabs [data-tab="courses"]'); await page.waitForTimeout(150);
        await page.evaluate(() => { const b = document.querySelector('[data-act="cf-view"][data-id="courses"]'); if (b) b.click(); });
        await page.click(`.course-card[data-act="open-course"][data-id="${id}"]`); await page.waitForTimeout(150);
        await page.click('[data-act="course-tab"][data-id="grades"]'); await page.waitForTimeout(400);
      };
      const tag = s => `${s} (${vp.name})`;

      // This Week in Grades on Today
      await page.click('nav.tabs [data-tab="board"]').catch(() => {}); await page.waitForTimeout(300);
      // notices on Today sit behind the Notices button
      if (await page.locator("#view .bn-more[aria-expanded=false]").count()) { await page.click("#view .bn-more"); await page.waitForTimeout(300); }
      const dg = page.locator("#view .gi-dg");
      ok(await dg.count() === 1, tag("Today shows This Week in Grades when marks came in"));
      const dgT = (await dg.innerText()).replace(/\s+/g, " ");
      ok(/4 new marks/.test(dgT) && /Coming Up Research Project/i.test(dgT) && /Biggest Move CHM110 \+0\.8/i.test(dgT) && /Your Pattern: Starting Early/.test(dgT), tag("it has the week's marks, the biggest move, what's next and a pattern: " + dgT.slice(0, 160)));
      const row = (await page.locator("#view .gi-dg-rows li:not(.gi-dg-cols)").first().innerText()).replace(/\s+/g, " ");
      ok(await page.locator("#view .gi-dg-rows li:not(.gi-dg-cols)").count() === 4 && /Lab 3 CHM110 78% \+0\.8/.test(row), tag("one row per new mark, with what it did to the course: " + row));
      await page.click('#view .gi-dg [data-act="dg-hide"]'); await page.waitForTimeout(250);
      ok(await page.locator("#view .gi-dg").count() === 0, tag("Done for This Week hides it"));

      // The Grades page
      await overview();
      const gp = page.locator(".gi-page");
      ok(await gp.count() === 1, tag("the Grades page has the insights"));
      const order = await page.$$eval(".gi-page > *", els => els.map(e => e.className.split(" ").filter(c => c !== "gi-card")[0]));
      ok(order.join() === "gi-dg,gi-fc,gi-roi,gi-plan,gi-tl,gi-hab", tag("in order: week, forecast, next hour, Target GPA, timeline, patterns: " + order.join()));
      ok(/0\.3 pts from C-/.test(await txt(page.locator(".gp-course", {hasText: "Chemistry"}))) && /0\.7 pts above the B- line/.test(await txt(page.locator(".gp-course", {hasText: "English"}))), tag("course rows show a letter cutoff close by"));
      const fc = await txt(page.locator(".gi-page .gi-fc"));
      ok(/Term GPA likely 2\.\d\d/.test(fc) && /BIO210: most likely B-/.test(fc), tag("the term forecast: " + fc.slice(0, 120)));
      const roi = await page.locator(".gi-roi-list li").allTextContents();
      ok(roi.length === 5 && /Final Exam/.test(roi[0]) && /CHM110/.test(roi[0]) && /could tip you to C-/.test(roi[0]), tag("the best next hour is Chemistry's final, which could reach a C-"));
      const ph = (await page.$$eval(".gi-roi-v", e => e.map(x => parseFloat(x.textContent.replace(/[^\d.]/g, "")))));
      ok(ph.every((v, i) => !i || ph[i - 1] >= v), tag("ranked by points per hour: " + ph.join(", ")));
      // Target GPA
      ok(await page.inputValue("#giPlanT") === "2.4", tag("Target GPA starts just above the projected GPA"));
      await page.fill("#giPlanT", "2.8"); await page.dispatchEvent("#giPlanT", "change"); await page.waitForTimeout(300);
      let plan = await txt(page.locator(".gi-plan"));
      ok(/easiest way to a 2\.80/.test(plan) && /cumulative GPA at/.test(plan), tag("a 2.8 plan, with the cumulative it gives: " + plan.slice(0, 200)));
      const picks = await page.$$eval(".gi-plan-list select", s => s.map(x => [x.dataset.planC, x.value]));
      ok(picks.length === 4, tag("one letter per course: " + JSON.stringify(picks)));
      await page.selectOption('.gi-plan-list select[data-plan-c="c2"]', "A"); await page.waitForTimeout(300);
      ok(await page.inputValue('.gi-plan-list select[data-plan-c="c2"]') === "A" && /your pick/.test(await txt(page.locator(".gi-plan-list li", {hasText: "STA101"}))), tag("picking a letter locks it and re-plans the rest"));
      await page.fill("#giPlanT", "4"); await page.dispatchEvent("#giPlanT", "change"); await page.waitForTimeout(300);
      ok(/isn't reachable this term: the most still possible is 3\.\d\d/.test(await txt(page.locator(".gi-plan"))), tag("an unreachable target says the most possible"));
      await page.fill("#giPlanT", "2.6"); await page.dispatchEvent("#giPlanT", "change"); await page.waitForTimeout(300);
      await page.click('[data-act="gi-plan-save"]'); await page.waitForTimeout(400);
      const goals = await page.evaluate(() => ["c1", "c2", "c3", "c4"].map(id => (window.__sbSync.state.courses[id].grading || {}).goal));
      ok(goals.every(g => typeof g === "number" && g >= 60), tag("Use These as My Course Goals sets each course's goal: " + goals.join(",")));
      // timeline and patterns
      const tl = await txt(page.locator(".gi-tl"));
      ok(await page.locator(".gi-tl-svg path.gi-tl-c").count() === 4 && /since last week/.test(tl) && /Biggest week/.test(tl), tag("the term timeline: one line per course and the week's change"));
      const hab = await txt(page.locator(".gi-hab"));
      ok(/From 29 marks/.test(hab) && /Starting Early/.test(hab) && /averaged 86\.7% \(12 items\)/.test(hab) && /not what caused them/.test(hab), tag("Your Patterns finds starting early helped: " + hab.slice(0, 220)));
      ok(/Late Nights/.test(hab) && /Late Penalties/.test(hab) && await page.locator(".gi-late-note").count() === 0, tag("late nights and late penalties, said once"));
      const start = page.locator('.gi-hab [data-act="hb-start"]');
      ok(await start.count() === 1, tag("a pattern comes with something to do"));
      const sid = await start.getAttribute("data-id"), sv = await start.getAttribute("data-v");
      await start.click(); await page.waitForTimeout(300);
      ok(await page.evaluate(([id, v]) => window.__sbSync.state.tasks[id].start === v, [sid, sv]), tag("Start ... sets that work's start date"));
      if (vp.name === "phone") ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), tag("no sideways scrolling"));
      await page.screenshot({path: path.join(SHOTS, vp.name + "-grades.png"), fullPage: true});

      // A course's Grades tab (its goal is now 83%, from the plan saved above)
      await course("c1");
      const card = page.locator('.gr-card[aria-label="Grades"]');
      ok(/You're 0\.5 pts from B\./.test(await txt(card.locator(".gi-edge"))), tag("the letter cutoff is said under the numbers"));
      const f1 = await txt(card.locator(".gi-fc"));
      ok(/Most likely B-/.test(f1) && /Reaching your 83% goal: about \d+% likely/.test(f1) && /on Final Exam would make your 83% goal (about \d+%|very) likely/.test(f1), tag("the forecast, its chance of the goal, and what would change it: " + f1.slice(0, 200)));
      ok(!/Projected Final/.test(await txt(card.locator(".gr-top"))), tag("the forecast takes Projected Final's place"));
      const lost = await txt(card.locator(".gi-lost"));
      ok(/You've lost 10\.9 pts of BIO210 so far, out of the 62% marked/.test(lost) && /Lab Report 2 \(2\.1 pts, 0\.8 pts of it late\)/.test(lost), tag("Where Your Points Went, with the late share: " + lost.slice(0, 160)));
      const cmp = await card.locator(".gi-cmp-list li").allTextContents();
      ok(cmp.length === 4 && cmp.some(x => /Lab Report 3/.test(x) && /Top quarter/.test(x)), tag("How You Compare places each mark in the class's spread"));
      const su = await txt(card.locator(".gi-su"));
      ok(/Exams are where you've lost the most so far/.test(su) && /Osmoregulation\s?you rated it shaky/.test(su) && /Fish Anatomy18 cards · 21% ready/.test(su.replace(/ · /g, " · ")), tag("What to Shore Up: weakest topics and decks: " + su.slice(0, 220)));
      // the summary stays on top, the rest in tabs
      const tabs = await card.locator(".gi-tabs .gi-tab").allInnerTexts();
      ok(tabs.map(x => x.replace(/\s*\d+$/, "").trim()).join() === "Marks,Breakdown,Outlook,What If", tag("four tabs: " + tabs.join(" | ")));
      const inPan = async (k, sel) => card.locator(`#gpan-${k} ${sel}`).count();
      ok(await inPan("marks", ".gr-work") === 2 && await inPan("breakdown", ".gb") === 1 && await inPan("breakdown", ".gi-lost") === 1 && await inPan("breakdown", ".gi-cmp") === 1
        && await inPan("outlook", ".gi-fc") === 1 && await inPan("outlook", ".gt-sec") === 1 && await inPan("outlook", ".gi-su") === 1 && await inPan("whatif", ".gr-wi") === 1, tag("each section is in its tab"));
      ok(await card.locator(":scope > .gr-sub", {hasText: "What You Need"}).count() === 1 && await card.locator(":scope > .gr-bar").count() === 1, tag("What You Need and the grade bar stay in the summary"));
      ok(await card.locator("#gpan-marks").isVisible() && !(await card.locator("#gpan-outlook").isVisible()), tag("Marks shows first"));
      await card.locator('.gi-tab[data-id="outlook"]').click(); await page.waitForTimeout(150);
      ok(await card.locator("#gpan-outlook").isVisible() && !(await card.locator("#gpan-marks").isVisible()), tag("a tab shows its sections"));
      await card.locator('.gi-tab[data-id="outlook"]').press("ArrowRight"); await page.waitForTimeout(100);
      ok(await card.locator('.gi-tab[data-id="whatif"][aria-selected="true"]').count() === 1 && await card.locator("#gpan-whatif").isVisible(), tag("arrow keys move between tabs"));
      await card.locator('.gi-tab[data-id="marks"]').click(); await page.waitForTimeout(100);
      await page.screenshot({path: path.join(SHOTS, vp.name + "-course.png"), fullPage: true});

      // The mark moment: saving a mark says what it did
      await act("g-mark", "b11");
      await page.fill("#gmIn", "95"); await page.click("dialog [data-submit]"); await page.waitForTimeout(500);
      const mo = page.locator("#giMoment");
      ok(await mo.isVisible(), tag("saving a mark shows what it did"));
      const moT = await txt(mo);
      ok(/Research Project: 95% A/.test(moT) && /BIO210 is now 84\.6% \(\+2\.2\)/.test(moT) && /Up to B!|goal of 83% is locked in|Still B/.test(moT), tag("the mark, the course's new grade and change, and the letter: " + moT));
      await page.click('#giMoment [data-act="gi-mo-close"]'); await page.waitForTimeout(350);
      ok(!(await mo.isVisible()), tag("it closes"));

      // the Term Recap's grade cards (the recap itself is Pro: opened below)
      const rs = await page.evaluate(() => window.SBGINS.recapSlides({}).map(x => x.k + ": " + x.big));
      ok(rs.length === 3 && /^Term GPA: \d\.\d\d$/.test(rs[0]) && rs[1] === "Best Mark: 95%" && /^What Worked: Starting Early$/.test(rs[2]), tag("grade cards for the Term Recap: " + rs.join(" | ")));
      ok(!errs.length, tag("no console errors: " + errs.join(" | ")));
      await ctx.close();
    }
    // The Term Recap with Pro: this build enforces Pro and a test has no account, so the page gets the bundle with enforcement off
    {
      const ctx = await browser.newContext({viewport: {width: 1100, height: 900}});
      await ctx.route(/\/bundle\/app\.js/, async route => { const r = await route.fetch(); const body = (await r.text()).replace("const PRO_ENFORCED = true;", "const PRO_ENFORCED = false;"); await route.fulfill({response: r, body}); });
      await ctx.addInitScript(SEED_INIT, SEED());
      const page = await ctx.newPage(); const errs = [];
      page.on("pageerror", e => errs.push(e.message));
      await page.goto(base); await page.waitForSelector("#view", {state: "attached"}); await page.waitForTimeout(900);
      await page.evaluate(() => { const x = document.createElement("button"); x.dataset.act = "pro-recap-open"; x.hidden = true; document.body.appendChild(x); x.click(); x.remove(); }); await page.waitForTimeout(400);
      const ks = []; for (let i = 0; i < 12; i++) { const k = await page.locator(".prc-k").textContent().catch(() => null); if (!k || ks.includes(k)) break; ks.push(k); await page.click("#proRcNext"); await page.waitForTimeout(120); }
      ok(ks.includes("Term GPA") && ks.includes("Best Mark") && ks.includes("What Worked"), "the Term Recap shows the grade cards after the planner's: " + ks.join(", "));
      ok(!errs.length, "no errors in the recap: " + errs.join(" | "));
      await ctx.close();
    }
  } finally { await browser.close(); server.close(); }
  console.log(`\ngrade-insights.e2e: ${n} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
