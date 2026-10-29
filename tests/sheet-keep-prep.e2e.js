// node tests/sheet-keep-prep.e2e.js
// Teach It Back and the Prep Plan keep their place like Create with AI: a Teach It Back check still running is set aside (not lost) when
// you tap away, opening it again brings back the same sheet, and when it finishes a toast's Open shows the result; topics added while
// editing a Prep Plan survive a tap outside until Cancel. Gemini is mocked (tests/exam-study-fixture.js) with a delay added here.
const assert = require("assert");
const {chromium, executablePath} = require("./pw");
const F = require("./exam-study-fixture");
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const REPLY = {right: [{point: "Final velocity is the starting velocity plus acceleration times time.", source: "S1"}],
  missed: [{point: "Acceleration is the rate of change of velocity over time.", kind: "missed", source: "S4", front: "What is acceleration?", back: "The rate of change of velocity over time."}],
  confidence: "ok", reason: "The main equation is right; acceleration needs a definition."};
const EXPLAIN = "Kinematics is about how things move. Velocity is how fast something goes in a direction. If something speeds up, the final velocity is the starting velocity plus acceleration times time, so v equals u plus a t.";

(async () => {
  const browser = await chromium.launch({executablePath});
  try {
    const {ctx, page} = await F.mk(browser, 1280, 800, {ai: true});
    ctx.aiReply = REPLY; let delay = 2500;
    await ctx.route(/generativelanguage\.googleapis\.com/, async route => { await new Promise(r => setTimeout(r, delay)); try { await route.fallback(); } catch (e) {} });
    const tbCalls = () => ctx.aiCalls.filter(c => /<explanation>/.test(JSON.stringify(c))).length;
    const isOpen = () => page.evaluate(() => document.getElementById("dlg").open);
    const toastText = () => page.evaluate(() => (document.getElementById("toastMsg") || {}).textContent || "");
    const waitToast = re => page.waitForFunction(s => new RegExp(s).test((document.getElementById("toastMsg") || {}).textContent || ""), re.source, {timeout: 15000});
    const mark = () => page.evaluate(() => { document.querySelector("#dlg .sheet").__kept = 1; });
    const marked = () => page.evaluate(() => { const s = document.querySelector("#dlg[open] .sheet"); return !!(s && s.__kept); });
    const away = async () => { await page.keyboard.press("Escape"); await page.waitForTimeout(250); };
    const openTopic = async tid => { await F.act(page, "exam-plan", "ex1"); await page.waitForSelector(`#ppBody [data-act="tb-open"][data-topic="${tid}"]`); await page.click(`#ppBody [data-act="tb-open"][data-topic="${tid}"]`); await page.waitForTimeout(300); };

    /* Teach It Back: a check still running is set aside */
    await openTopic("t1");
    await page.fill("#tbText", EXPLAIN); await page.click('[data-tb="check"]'); await page.waitForTimeout(300);
    ok(/Checking against your material/.test(await page.textContent("#tbStatus")), "teach back: the check starts");
    await mark(); await away();
    ok(!(await isOpen()) && /Teach It Back is still working/.test(await toastText()), "teach back: Escape sets it aside and says it's still working: " + await toastText());
    await openTopic("t1");
    ok(await marked() && /Checking against your material/.test(await page.textContent("#tbStatus")) && await page.evaluate(() => document.querySelector('[data-tb="check"]').disabled), "teach back: Teach It Back on the topic again brings back the same sheet, still checking");
    await page.mouse.click(5, 5); await page.waitForTimeout(250);
    await waitToast(/Teach It Back check is ready/);
    ok(!(await isOpen()) && tbCalls() === 1, "teach back: it finishes without popping up, one AI call (it used to be thrown away)");
    await page.click("#toastExtra"); await page.waitForSelector("#dlg[open] .tb-sug");
    ok(await marked() && /1 point right, 1 point to fix/.test(await page.textContent("#dlg[open] .tb-sheet")), "teach back: Open shows the result in the same sheet");
    await away();
    await openTopic("t1");
    ok(await page.locator("#dlg[open] .tb-sug").count() === 1 && !(await marked()), "teach back: a finished check isn't held as a sheet; the result shows as before");
    await away();

    /* Teach It Back: an untouched (not checking) sheet keeps its text as a draft, as before, but isn't held */
    await openTopic("t2"); await mark(); await page.fill("#tbText", "Forces make things accelerate."); await away();
    await openTopic("t2");
    ok(!(await marked()) && await page.inputValue("#tbText") === "Forces make things accelerate.", "teach back: typed text comes back from its draft, in a fresh sheet");
    await away();

    /* The Prep Plan while editing: topics you add survive a tap outside until Cancel */
    await F.act(page, "exam-plan", "ex1"); await page.waitForSelector('#ppFoot [data-pp="edit"]'); await page.click('#ppFoot [data-pp="edit"]'); await page.waitForSelector("#ppAdd");
    await page.fill("#ppAdd", "Projectile motion"); await page.click('#ppBody [data-pp="add"]'); await page.waitForTimeout(200);
    const has = () => page.evaluate(() => [...document.querySelectorAll("#dlg[open] [data-pn]")].some(i => i.value === "Projectile motion"));
    ok(await has(), "prep: a topic is added while editing");
    await mark(); await page.mouse.click(5, 5); await page.waitForTimeout(250);
    ok(!(await isOpen()), "prep: a tap outside closes it");
    await F.act(page, "exam-plan", "ex1"); await page.waitForSelector("#ppBody");
    ok(await marked() && await has(), "prep: opening the Prep Plan again brings back the edit with the new topic");
    await page.click('#ppFoot [data-act="close"]'); await page.waitForTimeout(250);
    await F.act(page, "exam-plan", "ex1"); await page.waitForSelector("#ppBody");
    ok(!(await marked()) && !(await has()) && (await F.exam(page)).prep.topics.every(t => t.name !== "Projectile motion"), "prep: after Cancel it's the saved plan again, unchanged");
    await away();
    await F.act(page, "exam-plan", "ex1"); await page.waitForSelector("#ppBody"); await mark(); await away();
    await F.act(page, "exam-plan", "ex1"); await page.waitForSelector("#ppBody");
    ok(!(await marked()), "prep: just looking at the plan isn't held");
    await away();

    ok(!page.errs.length, "no console errors: " + page.errs.join(" | "));
    console.log("\nsheet-keep-prep.e2e: " + n + " checks passed");
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
