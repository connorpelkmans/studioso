// node tests/sch-month-keep.e2e.js
// Schedule's Month view stays chosen until the student switches back: across other pages, a reload, and a See Week look at one
// week from the month. Phone (Options > Month View / Week View) and desktop (Week / Month switch).
const path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const SEED = {v: 2, updated: 1, tasks: [], notes: [], files: [], decks: [], events: [], settings: {}, courses: [{id: "c1", name: "Bio", code: "BIO", color: "#36c", meetings: [{kind: "Lecture", days: [1, 3], start: "10:00", end: "11:00"}]}]};
(async () => {
  const browser = await chromium.launch({executablePath}), errs = [];
  try {
    for (const phone of [true, false]) {
      const W = phone ? "phone" : "desktop";
      const ctx = await browser.newContext(phone ? {viewport: {width: 402, height: 874}, isMobile: true, hasTouch: true} : {viewport: {width: 1280, height: 860}});
      await ctx.addInitScript(seed => { window.__SB_TEST = true; try { if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:tour", "done"); localStorage.setItem("coursework:v2", JSON.stringify(seed)); } } catch (e) {} }, SEED);
      const page = await ctx.newPage(); page.on("pageerror", e => errs.push(e.message));
      const go = async t => { await page.evaluate(t => { const S = window.__sbSync; S.ui.tab = t; S.render(); }, t); await page.waitForTimeout(250); };
      const month = () => page.evaluate(() => !!document.querySelector(".sch-month"));
      const pick = async want => { if (phone) await page.evaluate(() => { document.querySelector(".ph-more").open = true; }); await page.click(`[data-act="sch-mode"][data-id="${want}"]`); await page.waitForTimeout(250); };
      await page.goto("file://" + path.join(__dirname, "..", "index.html")); await page.waitForTimeout(1800);
      await go("schedule");
      ok(!(await month()), `${W}: the Schedule starts on the week`);
      await pick("month");
      ok(await month(), `${W}: Month view is chosen`);
      await go("board"); await go("schedule");
      ok(await month(), `${W}: still Month after visiting another page`);
      await page.reload(); await page.waitForTimeout(1800); await go("schedule");
      ok(await month(), `${W}: still Month after reopening the app`);
      await page.click(".smc-week"); await page.waitForTimeout(250);
      ok(!(await month()), `${W}: See Week shows that week`);
      await go("notes"); await go("schedule");
      ok(await month(), `${W}: coming back after See Week, it's Month again (See Week was just a look)`);
      await page.reload(); await page.waitForTimeout(1800); await go("schedule");
      ok(await month(), `${W}: and still Month after reopening`);
      await pick("week");
      await go("board"); await go("schedule");
      ok(!(await month()), `${W}: switching back to Week keeps Week`);
      await page.reload(); await page.waitForTimeout(1800); await go("schedule");
      ok(!(await month()), `${W}: Week after reopening too`);
      await ctx.close();
    }
    ok(!errs.length, "no page errors" + (errs.length ? ": " + errs.join(" | ") : ""));
    console.log("sch-month-keep.e2e: " + n + " checks passed");
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
