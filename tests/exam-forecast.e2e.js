// Browser test for the Exam Day Forecast (Pro) in an exam's Prep Plan: node tests/exam-forecast.e2e.js
// It's worked out with the plan's own readiness math: "If you do every session" counts every session still to come as done, and
// "At your pace" counts the same share of them as of the sessions due so far. Free plan: a locked card that opens the Pro sheet.
const assert = require("assert");
const {chromium, executablePath} = require("./pw");
const F = require("./exam-study-fixture");
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const fc = page => page.evaluate(() => window.SBPREP.forecast(window.__sbProStudy.state().tasks.ex1));
const dlgText = page => page.evaluate(() => (document.querySelector("dialog[open]") || {}).innerText || "");

// s1 came due yesterday; done or not
const seedWith = done => {
  const s = F.SEED(), s1 = s.tasks.find(t => t.id === "s1");
  Object.assign(s1, {start: F.plus(-1), due: F.plus(-1)}, done ? {status: "done", doneAt: Date.parse(F.plus(-1) + "T18:00:00")} : {});
  return s;
};

(async () => {
  const browser = await chromium.launch({executablePath});
  try {
    // Pro, nothing due yet: every-session forecast only, and the topic to work on next
    for (const [W, H] of [[1280, 800], [390, 844]]) {
      const {ctx, page} = await F.mk(browser, W, H);
      const f = await fc(page);
      ok(f && f.pace == null && f.full > 0 && f.left === 3 && f.days > 0, `${W}px: with no session due yet, a forecast for doing every session, and no pace yet: ` + JSON.stringify({pace: f && f.pace, full: f && f.full, left: f && f.left}));
      ok(f.full >= (f.now || 0) && f.full <= 95, "doing every session never forecasts less than now, and never more than 95%");
      ok(f.thin === true, "with no flashcards or quizzes in the evidence yet, it says the forecast could be sharper");
      await F.act(page, "exam-plan", "ex1"); await page.waitForSelector("#ppBody .pp-fc");
      const t = await dlgText(page);
      ok(/Exam Day Forecast/.test(t) && /If you do every session left/.test(t) && new RegExp(f.full + "%").test(t), "the Prep Plan shows the forecast with its number");
      ok(/pace shows once your first session has come due/.test(t), "and says when the pace forecast starts");
      ok(await page.locator('#ppBody .pp-fc [data-act="tb-open"]').count() <= 1 && (f.weakest.full >= 85 || /Work on next/.test(t)), "it names the topic to work on next");
      ok(await F.noHScroll(page) && await F.dlgScroll(page), `${W}px: nothing scrolls sideways`);
      ok(page.errs.length === 0, "no page errors: " + page.errs.join(" | "));
      await ctx.close();
    }

    // Pro, one session came due and was done: at your pace = every session
    {
      const {ctx, page} = await F.mk(browser, 1280, 800, {seed: seedWith(true)});
      const f = await fc(page);
      ok(f.rate === 1 && f.pace === f.full, "everything due so far done: at your pace equals doing every session: " + JSON.stringify({rate: f.rate, pace: f.pace, full: f.full}));
      await F.act(page, "exam-plan", "ex1"); await page.waitForSelector("#ppBody .pp-fc");
      ok(/At your pace/.test(await dlgText(page)) && /done 1 of the 1 session due so far/.test(await dlgText(page)), "it shows the pace, and why");
      await ctx.close();
    }
    // Pro, one session came due and was missed: at your pace stays where it is now
    {
      const {ctx, page} = await F.mk(browser, 1280, 800, {seed: seedWith(false)});
      const f = await fc(page);
      ok(f.rate === 0 && (f.pace == null ? f.now == null : f.pace === f.now) && (f.pace || 0) < f.full, "nothing due so far done: at your pace stays at today's readiness, below doing every session: " + JSON.stringify({now: f.now, pace: f.pace, full: f.full}));
      await F.act(page, "exam-plan", "ex1"); await page.waitForSelector("#ppBody .pp-fc");
      ok(/No session done yet/.test(await dlgText(page)), "with nothing done yet, it says where to start instead of a number");
      await ctx.close();
    }
    // Free: a locked card that opens the Pro sheet, never the numbers
    {
      const {ctx, page} = await F.mk(browser, 390, 844, {free: true});
      await F.act(page, "exam-plan", "ex1"); await page.waitForSelector("#ppBody .pp-fc");
      ok(await page.locator("#ppBody .pp-fc-lock").count() === 1 && await page.locator("#ppBody .pp-fc .pp-fc-row").count() === 0, "free: a locked Exam Day Forecast card without the numbers");
      await page.click('#ppBody [data-act="pp-fc-pro"]'); await page.waitForTimeout(400);
      ok(/Exam Day Forecast is part of Studyboard Pro/.test(await dlgText(page)), "free: See Pro opens the Pro sheet with the reason");
      ok(page.errs.length === 0, "no page errors (free): " + page.errs.join(" | "));
      await ctx.close();
    }
    console.log(`\nexam-forecast.e2e: ${n} checks passed`);
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
