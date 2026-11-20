// Browser test for the Exam Wrapper's patterns across exams: node tests/exam-wrapper-patterns.e2e.js [screenshot dir]
// With 3 or more marked reflections, the wrapper and the next exam show at most two lines about what the student's own marks show.
const path = require("path"), fs = require("fs"), assert = require("assert"), os = require("os");
const {chromium, executablePath} = require("./pw");
const F = require("./exam-study-fixture");
const OUT = process.argv[2] || fs.mkdtempSync(path.join(os.tmpdir(), "sbwrap-"));
fs.mkdirSync(OUT, {recursive: true});
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };

// Four past exams, reflected on: started late on three (64% on average), early on one (85%); tested themselves on two (78%), only went over notes on two (61%)
const past = (id, k, start, methods, felt, mark) => ({id, title: "Quiz " + k, courseId: "c1", type: "Quiz", due: F.plus(-40 + k * 7), status: "done", priority: "med", doneAt: 1,
  mark: {got: mark, outOf: 100}, wrap: {at: 1000 + k, methods, start, next: "", felt, measured: null, mark}});
const WRAPS = [past("q1", 1, "night", ["reread"], 80, 60), past("q2", 2, "short", ["reread", "summary"], 75, 62), past("q3", 3, "week", ["practice", "cards"], 70, 85), past("q4", 4, "short", ["practice"], 80, 70)];
const seed = list => { const s = F.SEED(); s.tasks = s.tasks.concat(list); return s; };
const pats = (page, id) => page.evaluate(id => SBWRAP.patternsOf(id), id);

(async () => {
  const browser = await chromium.launch({executablePath});
  try {
    // two reflections are too few to call a pattern
    {
      const {page} = await F.mk(browser, 1280, 800, {seed: seed(WRAPS.slice(0, 2))});
      ok((await pats(page, "")).length === 0, "with 2 reflections, no pattern");
      await page.context().close();
    }
    {
      const {page} = await F.mk(browser, 1280, 800, {seed: seed(WRAPS)});
      const ls = await pats(page, "");
      ok(ls.length === 2, "two lines at most: " + ls.join(" | "));
      ok(/started 1 or 2 days before \(or the night before\) on 3 of your last 4 exams\. Those averaged 64%; the 1 exam you started 3 or more days early averaged 85%/.test(ls[0]), "the biggest difference first, when they started: " + ls[0]);
      ok(/tested yourself .* averaged 78% over 2 exams; when you only went over your notes, 61% over 2 exams/.test(ls[1]), "then testing themselves against going over notes: " + ls[1]);
      ok(!ls.some(l => /felt about/.test(l)), "no confidence line when the feeling was close on average (7 points)");
      // before the next exam, with "Last time"
      const view = await page.evaluate(() => SBWRAP.viewHtml(SBPREP.sessions ? Object.values(JSON.parse(localStorage.getItem("coursework:v2")).tasks).find(t => t.id === "ex1") : null));
      ok(/Your pattern/.test(view) && /Last time: Quiz 4/.test(view), "the upcoming exam shows the pattern under Last time");
      await F.act(page, "edit-task", "ex1"); await page.waitForTimeout(500);
      const pat = page.locator("#dlg .ewr-pat");
      ok(await pat.count() === 1, "the exam's sheet shows it");
      await pat.scrollIntoViewIfNeeded(); await page.waitForTimeout(200);
      await page.locator("#dlg .sheet").screenshot({path: path.join(OUT, "exam-sheet.png")});
      await page.keyboard.press("Escape"); await page.waitForTimeout(300);
      // the wrapper itself, for one of them
      await F.act(page, "ewr-open", "q4"); await page.waitForTimeout(500);
      ok(await page.locator("#dlg .ewr .ewr-pat").count() === 1, "the wrapper shows the pattern too");
      const own = await pats(page, "q4");
      ok(own.length === 1 && /on 2 of your last 3 exams\. Those averaged 61%/.test(own[0]), "from the other reflections only (3 left: the start-time line, but too few to compare testing yourself): " + own.join(" | "));
      await page.locator("#dlg .sheet").screenshot({path: path.join(OUT, "wrapper.png")});
      ok(page.errs.length === 0, "no page errors: " + page.errs.join(" | "));
      await page.context().close();
    }
    // feeling much more ready than the marks show
    {
      const over = [1, 2, 3].map(k => past("o" + k, k, "days", ["cards"], 90, 70));
      const {page} = await F.mk(browser, 390, 844, {seed: seed(over)});
      const ls = await pats(page, "");
      ok(ls.length === 1 && /felt about 20 points more ready than your mark showed/.test(ls[0]), "overconfidence is named: " + ls.join(" | "));
      await page.context().close();
    }
    console.log(`\nexam-wrapper-patterns.e2e: ${n} checks passed. Screenshots in ${OUT}`);
  } catch (e) { console.error(e); console.error(`\nexam-wrapper-patterns.e2e: ${n} checks passed before a failure`); process.exitCode = 1; }
  finally { await browser.close(); }
})();
