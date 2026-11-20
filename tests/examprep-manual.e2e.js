// Browser test for making your own exam prep plan: node tests/examprep-manual.e2e.js [screenshot dir]
// A new plan first asks "Plan It for Me" or "I'll Make My Own"; the second adds sessions by hand (day, kind, topic, minutes, note).
const path = require("path"), fs = require("fs"), assert = require("assert"), os = require("os");
const {chromium, executablePath} = require("./pw");
const F = require("./exam-study-fixture");
const OUT = process.argv[2] || fs.mkdtempSync(path.join(os.tmpdir(), "sbmanual-"));
fs.mkdirSync(OUT, {recursive: true});
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const txt = (page, q) => page.evaluate(q => (document.querySelector(q) || {}).textContent || "", q);
// The fixture's midterm, without its prep plan or sessions
const SEED = () => { const s = F.SEED(); s.tasks = s.tasks.filter(t => !t.prepFor); delete s.tasks[0].prep; delete s.tasks[0].planTopics; return s; };
const prepTasks = async page => (await F.store(page)).tasks.filter(t => t.prepFor === "ex1").sort((a, b) => (a.due < b.due ? -1 : 1));

(async () => {
  const browser = await chromium.launch({executablePath});
  try {
    for (const [W, H] of [[1280, 800], [390, 844]]) {
      console.log("== " + W + " wide");
      const {page} = await F.mk(browser, W, H, {seed: SEED()});
      await F.act(page, "exam-plan", "ex1"); await page.waitForTimeout(500);
      ok(await page.locator('#ppBody [data-pp="pick-auto"]').count() === 1 && await page.locator('#ppBody [data-pp="pick-manual"]').count() === 1, "a new plan asks how to plan first");
      ok(await F.noHScroll(page) && await F.dlgScroll(page), "no horizontal scroll on the choice");
      await page.screenshot({path: path.join(OUT, `choose-${W}.png`)});
      // Plan It for Me goes to the planner, and Cancel leaves nothing behind
      await page.click('[data-pp="pick-auto"]'); await page.waitForTimeout(300);
      ok(await page.locator("#ppCreate").count() === 1, "Plan It for Me opens the planner");
      await page.keyboard.press("Escape"); await page.waitForTimeout(300);
      ok((await prepTasks(page)).length === 0, "cancelling makes no sessions");
      // I'll Make My Own
      await F.act(page, "exam-plan", "ex1"); await page.waitForTimeout(400);
      await page.click('[data-pp="pick-manual"]'); await page.waitForTimeout(300);
      ok(/Make Your Own Plan/.test(await txt(page, "#ppTitle")), "the builder opens");
      ok(await page.locator("#ppmCreate[disabled]").count() === 1, "Create Plan waits for a session");
      ok(await page.locator('#ppmDate').getAttribute("max") === F.plus(9), "days stop before the exam");
      await page.click('[data-pp="madd"]'); await page.waitForTimeout(200);
      ok(/Type a topic/.test(await txt(page, "#ppmMsg")), "a session needs a topic");
      ok(await page.locator("#ppmTopics option").count() >= 2, "topics are suggested from the course");
      await page.fill("#ppmTopic", "Kinematics"); await page.fill("#ppmMin", "45"); await page.click('[data-pp="madd"]'); await page.waitForTimeout(200);
      await page.click('[data-pp="mkind"][data-v="cards"]'); await page.fill("#ppmTopic", "Forces"); await page.fill("#ppmNote", "Mechanics deck, all cards"); await page.press("#ppmNote", "Enter"); await page.waitForTimeout(200);
      await page.click('[data-pp="mkind"][data-v="past"]'); await page.waitForTimeout(200);
      ok(await page.locator("#ppmTopic").count() === 0, "timed practice needs no topic");
      await page.fill("#ppmDate", F.plus(8)); await page.fill("#ppmMin", "90"); await page.click('[data-pp="madd"]'); await page.waitForTimeout(200);
      // one more, then take it out again
      await page.click('[data-pp="mkind"][data-v="recall"]'); await page.fill("#ppmTopic", "Waves"); await page.click('[data-pp="madd"]'); await page.waitForTimeout(200);
      ok(await page.locator("#ppBody .pp-sess").count() === 4, "four sessions listed");
      await page.click('#ppBody .pp-sess:has-text("Waves") [data-pp="mrm"]'); await page.waitForTimeout(200);
      ok(await page.locator("#ppBody .pp-sess").count() === 3 && /Create Plan \(3 Sessions\)/.test(await txt(page, "#ppmCreate")), "a session can be taken out before creating");
      ok(await F.noHScroll(page) && await F.dlgScroll(page), "no horizontal scroll in the builder");
      await page.screenshot({path: path.join(OUT, `builder-${W}.png`)});
      await page.click("#ppmCreate"); await page.waitForTimeout(600);
      const ss = await prepTasks(page);
      ok(ss.length === 3, "three prep sessions made");
      ok(ss[0].due === F.plus(0) && ss[0].kind === "learn" && ss[0].topic === "Kinematics" && Math.round(ss[0].hours * 60) === 45 && ss[0].notes.length > 10, "the first: today, learn Kinematics, 45 min, with a standard instruction");
      ok(ss[1].due === F.plus(1) && ss[1].kind === "cards" && ss[1].notes === "Mechanics deck, all cards" && ss[1].matKind === "deck" && !!ss[1].matId, "the second: tomorrow, flashcards with the student's note and a deck to open: " + JSON.stringify([ss[1].due, F.plus(1), ss[1].kind, ss[1].notes, ss[1].matKind, ss[1].matId]));
      ok(ss[2].due === F.plus(8) && ss[2].kind === "past" && ss[2].topic === "" && Math.round(ss[2].hours * 60) === 90, "the third: timed practice, 90 min");
      const ex = (await F.store(page)).tasks.find(t => t.id === "ex1");
      ok(ex.prep && ex.prep.manual === true && ex.prep.topics.map(t => t.name).join() === "Kinematics,Forces", "the exam keeps a hand-made plan with its two topics");
      ok(/Prep Plan/.test(await txt(page, "#ppTitle")) && await page.locator("#ppBody .pp-sess").count() === 3, "the Prep Plan shows the sessions");
      ok(await page.locator('#ppFoot [data-pp="manual"]').count() === 1 && await page.locator('#ppFoot [data-pp="replan"]').count() === 1 && await page.locator('#ppFoot [data-pp="edit"]').count() === 0, "a hand-made plan offers Add Sessions and Let Studyboard Plan It");
      await page.screenshot({path: path.join(OUT, `view-${W}.png`)});
      // add one more later
      await page.click('#ppFoot [data-pp="manual"]'); await page.waitForTimeout(300);
      ok(/Add Sessions/.test(await txt(page, "#ppTitle")) && (await page.locator("#ppmDate").inputValue()) === F.plus(9), "Add Sessions starts the day after the last one");
      await page.fill("#ppmTopic", "Waves"); await page.click('[data-pp="madd"]'); await page.waitForTimeout(200);
      await page.click("#ppmCreate"); await page.waitForTimeout(600);
      ok((await prepTasks(page)).length === 4 && (await F.store(page)).tasks.find(t => t.id === "ex1").prep.topics.length === 3, "adding more keeps the first three and adds the topic");
      ok(page.errs.length === 0, "no page errors: " + page.errs.join(" | "));
      await page.context().close();
    }
    console.log(`\nexamprep-manual.e2e: ${n} checks passed. Screenshots in ${OUT}`);
  } catch (e) { console.error(e); console.error(`\nexamprep-manual.e2e: ${n} checks passed before a failure`); process.exitCode = 1; }
  finally { await browser.close(); }
})();
