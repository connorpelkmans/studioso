// Browser test for Teach It Back (Pro, AI): node tests/teach-back.e2e.js [screenshot dir]
// The Gemini endpoint is mocked (see tests/exam-study-fixture.js).
const path = require("path"), fs = require("fs"), assert = require("assert"), os = require("os");
const {chromium, executablePath} = require("./pw");
const F = require("./exam-study-fixture");
const OUT = process.argv[2] || fs.mkdtempSync(path.join(os.tmpdir(), "sbteach-"));
fs.mkdirSync(OUT, {recursive: true});
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const sleep = ms => new Promise(r => setTimeout(r, ms));

// Kinematics links three cards of Mechanics (S1 to S3) and the note "Motion definitions" (S4)
const REPLY = {right: [{point: "Final velocity is the starting velocity plus acceleration times time.", source: "S1"}, {point: "Mass and energy are linked by E = mc².", source: "S9"}],
  missed: [{point: "A vector has both a size and a direction; you described velocity as just speed.", kind: "wrong", source: "S3", front: "What makes a quantity a vector?", back: "It has both a size and a direction."},
    {point: "Acceleration is the rate of change of velocity over time.", kind: "missed", source: "S4", front: "What is acceleration?", back: "The rate of change of velocity over time."}],
  confidence: "weak", reason: "You have the main equation but mixed up speed and velocity."};
const EXPLAIN = "Kinematics is about how things move. Velocity is just how fast something goes, its speed. If something speeds up, the final velocity is the starting velocity plus acceleration times time, so v equals u plus a t.";
const dlgText = page => page.evaluate(() => (document.querySelector("dialog[open]") || {}).innerText || "");
const openTopic = async (page, tid) => { await F.act(page, "exam-plan", "ex1"); await page.waitForTimeout(400); await page.click(`#ppBody [data-act="tb-open"][data-topic="${tid}"]`); await page.waitForTimeout(300); };
// Other AI features may call on load; only count Teach It Back's own calls
const tbCalls = ctx => ctx.aiCalls.filter(c => /<explanation>/.test(JSON.stringify(c)));
const topicConf = async (page, tid) => (await F.exam(page)).prep.topics.find(t => t.id === tid).conf;

(async () => {
  const browser = await chromium.launch({executablePath});
  try {
    // Happy path, at both widths
    for (const [W, H] of [[1280, 800], [390, 844]]) {
      console.log("== " + W + " wide");
      const {ctx, page} = await F.mk(browser, W, H, {ai: true});
      ctx.aiReply = REPLY;
      await F.act(page, "exam-plan", "ex1"); await page.waitForTimeout(400);
      ok(await page.locator('#ppBody .pp-covs [data-act="tb-open"]').count() === 3, "each topic in the Prep Plan has a quiet Teach It Back link");
      ok(await page.locator('#ppBody [data-act="tb-open"] .pro-badge').count() === 0, "no PRO badge for Pro");
      ok(await F.noHScroll(page) && await F.dlgScroll(page), "no horizontal scroll in the Prep Plan");
      await page.screenshot({path: path.join(OUT, `prep-${W}.png`)});
      await page.click('#ppBody [data-act="tb-open"][data-topic="t1"]'); await page.waitForTimeout(300);
      ok(/Teach It Back/.test(await page.locator("#dlg .sheet-head h2").textContent()) && /Kinematics/.test(await dlgText(page)), "the sheet opens on the topic");
      ok(/Deck: Mechanics \(3 cards\)/.test(await dlgText(page)) && /Note: Motion definitions/.test(await dlgText(page)), "it says what the explanation is checked against");
      await page.fill("#tbText", "Kinematics is motion."); await page.click('[data-tb="check"]'); await page.waitForTimeout(200);
      ok(/Say a bit more/.test(await page.locator("#tbStatus").textContent()) && tbCalls(ctx).length === 0, "a one-liner asks for more, without calling the AI");
      await page.fill("#tbText", EXPLAIN); await page.click('[data-tb="check"]');
      await page.waitForSelector(".tb-sug", {timeout: 8000});
      ok(tbCalls(ctx).length === 1, "one AI call");
      const sent = JSON.stringify(tbCalls(ctx)[0]);
      ok(/Topic: Kinematics/.test(sent) && /\[S1\] Flashcard in deck [^[]*v = u \+ at/.test(sent) && /\[S4\] Note/.test(sent) && sent.includes("Velocity is just how fast"), "the call carries the topic, the numbered sources and the explanation");
      ok(!/F = ma/.test(sent), "only the topic's own linked cards are sent (not the whole deck)");
      const t = await dlgText(page);
      ok(/2 points right, 2 points to fix/.test(t), "a summary line (an unknown source id still counts the point): " + t.slice(0, 200));
      ok(await page.locator(".tb-ok li").count() === 2 && await page.locator(".tb-miss li").count() === 2, "what was right and what was missed are listed");
      ok(await page.locator(".tb-ok li").nth(1).locator(".tb-src").count() === 0, "a point citing a source that wasn't sent has no source link");
      const srcs = await page.locator(".tb-src").allTextContents();
      ok(srcs.some(s => /^Card: Final velocity/.test(s)) && srcs.some(s => /^Card: What is a vector/.test(s)) && srcs.some(s => /^Note: Motion definitions/.test(s)), "each point names its source: " + srcs.join(" | "));
      ok(await page.locator(".tb-k.wrong").count() === 1, "a wrong point is marked Wrong");
      ok(/Suggested confidence\s*Shaky/.test(t) && await page.locator('[data-tb="conf"][data-v="weak"]').count() === 1, "suggests Shaky, with one tap to set it");
      ok(await F.noHScroll(page) && await F.dlgScroll(page), "no horizontal scroll in the result");
      await page.screenshot({path: path.join(OUT, `result-${W}.png`)});
      // set the confidence, with Undo
      await page.click('[data-tb="conf"]'); await page.waitForTimeout(300);
      ok(await topicConf(page, "t1") === "weak" && (await F.exam(page)).planTopics.find(x => x.name === "Kinematics").conf === "weak", "the topic is now Shaky (and planTopics follow)");
      ok(/Matches what you set/.test(await dlgText(page)), "the result says it matches now");
      ok(/Kinematics marked Shaky/.test(await page.locator("#toastMsg").textContent()), "a toast offers Undo");
      await page.click("#toastUndo"); await page.waitForTimeout(300);
      ok(await topicConf(page, "t1") === "ok" && await page.locator('[data-tb="conf"]').count() === 1, "Undo puts it back to OK, and the button returns");
      // draft cards from what was missed
      await page.click('[data-tb="cards"]'); await page.waitForTimeout(500);
      const d1 = await F.deck(page, "d1"), made = d1.cards.filter(c => c.src === "Teach It Back");
      ok(made.length === 2 && made.every(c => c.draft && c.ai) && made.some(c => c.front === "What is acceleration?"), "two draft cards in the topic's linked deck");
      ok(await page.locator("#dlg .lc-check").count() === 1 && await page.locator("#dlg .lc-card").count() >= 2, "Check Draft Cards opens on them");
      await page.click("#lcKeepGo"); await page.waitForTimeout(400);
      const kept = (await F.deck(page, "d1")).cards.filter(c => c.src === "Teach It Back");
      ok(kept.length === 2 && kept.every(c => !c.draft), "keeping them makes them real cards");
      // reopening shows the last result; Try Again keeps the words
      await openTopic(page, "t1");
      ok(await page.locator(".tb-sug").count() === 1, "reopening the topic shows the last check");
      await page.click('[data-tb="again"]'); await page.waitForTimeout(200);
      ok((await page.locator("#tbText").inputValue()) === EXPLAIN, "Try Again starts from the same explanation");
      // a source opens
      await page.click('[data-tb="check"]'); await page.waitForSelector(".tb-sug", {timeout: 8000});
      await page.locator(".tb-src", {hasText: "Note: Motion definitions"}).click(); await page.waitForTimeout(500);
      ok(!(await page.evaluate(() => document.querySelector("#dlg").open)) && await page.locator('.note[data-note="n1"]').count() === 1, "a note source opens the note");
      // a teach-back session's own sheet offers it; a flashcard session doesn't
      await F.act(page, "edit-task", "s1", {edit: "1"}); await page.waitForTimeout(400);
      ok(await page.locator('#dlg [data-act="tb-open"][data-topic="t1"]').count() === 1, "a teach-back session's sheet offers Teach It Back");
      await F.act(page, "close"); await page.waitForTimeout(200);
      await F.act(page, "edit-task", "s2", {edit: "1"}); await page.waitForTimeout(400);
      ok(await page.locator('#dlg [data-act="tb-open"]').count() === 0, "a flashcard session's sheet doesn't");
      await F.act(page, "close"); await page.waitForTimeout(200);
      ok(page.errs.length === 0, "no console errors: " + page.errs.join(" | "));
      await ctx.close();
    }

    // A topic with nothing linked: link it, or check against general knowledge (labelled)
    {
      const {ctx, page} = await F.mk(browser, 390, 844, {ai: true});
      ctx.aiReply = {right: [{point: "Waves carry energy without carrying matter along.", source: ""}], missed: [{point: "Frequency is how many waves pass a point each second.", kind: "missed", source: "", front: "What is frequency?", back: "How many waves pass a point each second."}], confidence: "ok", reason: "The main idea is there."};
      await openTopic(page, "t3");
      ok(/Nothing is linked to this topic yet/.test(await dlgText(page)) && await page.locator('[data-tb="check"][disabled]').count() === 1, "it asks to link material first; Check is off");
      await page.click('[data-tb="link"]'); await page.waitForTimeout(400);
      ok(/Plan My Prep/i.test(await page.locator("#ppTitle").textContent()) && await page.locator('[data-pn="t3"]').count() === 1, "Link Material opens the topic editor");
      await F.act(page, "close"); await page.waitForTimeout(200);
      await openTopic(page, "t3");
      await page.check('[data-tb="general"]'); await page.waitForTimeout(100);
      await page.fill("#tbText", "Waves move energy from one place to another. The particles wiggle back and forth but stay roughly where they started, and the wave keeps going.");
      await page.click('[data-tb="check"]'); await page.waitForSelector(".tb-sug", {timeout: 8000});
      ok(/no course material linked/.test(JSON.stringify(tbCalls(ctx)[0])), "the AI is told there's no material");
      ok(/Checked against general knowledge, not your course's material/.test(await dlgText(page)), "the result says plainly it's general knowledge");
      await page.click('[data-tb="cards"]'); await page.waitForTimeout(500);
      const s = await F.store(page), nd = (Array.isArray(s.decks) ? s.decks : Object.values(s.decks)).find(d => d.name === "Waves Cards");
      ok(nd && nd.cards.length === 1 && nd.cards[0].draft && s.tasks.find(t => t.id === "ex1").prep.topics.find(t => t.id === "t3").links.some(l => l.k === "deck" && l.id === nd.id), "with no deck linked, the cards go to a new Waves Cards deck that's linked to the topic");
      ok(await F.noHScroll(page) && await F.dlgScroll(page), "no horizontal scroll (390)");
      ok(page.errs.length === 0, "no console errors (general): " + page.errs.join(" | "));
      await ctx.close();
    }

    // No AI key: says so, opens AI setup, keeps the words
    {
      const {ctx, page} = await F.mk(browser, 1280, 800);
      await openTopic(page, "t1");
      ok(/Checking uses AI/.test(await dlgText(page)), "without AI it says checking needs AI");
      await page.fill("#tbText", EXPLAIN); await page.click('[data-tb="check"]'); await page.waitForTimeout(400);
      ok(await page.locator('#dlg [data-key="gemini"]').count() === 1 && tbCalls(ctx).length === 0, "Check opens AI setup and calls nothing");
      await F.act(page, "close"); await page.waitForTimeout(200);
      await openTopic(page, "t1");
      ok((await page.locator("#tbText").inputValue()) === EXPLAIN, "the explanation is still there afterwards");
      ok(page.errs.length === 0, "no console errors (no key): " + page.errs.join(" | "));
      await ctx.close();
    }

    // AI errors and bad replies
    {
      const {ctx, page} = await F.mk(browser, 1280, 800, {ai: true});
      await openTopic(page, "t2");
      await page.fill("#tbText", EXPLAIN);
      const tryWith = async (reply, re, what) => {
        ctx.aiReply = reply; const before = await topicConf(page, "t2");
        await page.click('[data-tb="check"]');
        await page.waitForFunction(() => !document.querySelector('[data-tb="check"][disabled]') || document.querySelector(".tb-sug"), null, {timeout: 15000});
        const msg = await page.locator("#tbStatus").textContent().catch(() => "");
        ok(re.test(msg) && await page.locator(".tb-sug").count() === 0, what + ": " + msg);
        ok((await page.locator("#tbText").inputValue()) === EXPLAIN && await topicConf(page, "t2") === before, "the explanation is kept and nothing changed");
      };
      await tryWith({raw: "this is not json"}, /garbled/, "a garbled reply says so");
      await tryWith({right: "yes", missed: null}, /didn't make sense/, "a reply in the wrong shape says so");
      await tryWith({right: [], missed: [], confidence: "strong", reason: ""}, /didn't find anything/, "an empty reply asks for more");
      await tryWith({status: 500, body: {error: {message: "internal"}}}, /busy/, "a server error says the AI is busy");
      ctx.aiReply = Object.assign({}, REPLY, {confidence: "excellent"});
      await page.click('[data-tb="check"]'); await page.waitForSelector(".tb-sug", {timeout: 15000});
      ok(/Suggested confidence\s*(Shaky|OK)/.test(await dlgText(page)), "an unknown confidence falls back to one worked out from the points");
      ok(page.errs.length === 0, "no console errors (errors): " + page.errs.join(" | "));
      await ctx.close();
    }

    // Free account with Pro switched on: PRO badge, the Pro sheet, no AI call
    {
      const {ctx, page} = await F.mk(browser, 390, 844, {ai: true, free: true});
      await F.act(page, "exam-plan", "ex1"); await page.waitForTimeout(400);
      ok(await page.locator('#ppBody [data-act="tb-open"] .pro-badge').count() === 3, "free: each Teach It Back shows a PRO badge");
      await page.click('#ppBody [data-act="tb-open"][data-topic="t1"]'); await page.waitForTimeout(600);
      ok(/Teach It Back is part of Studyboard Pro/.test(await dlgText(page)) && await page.locator("#tbText").count() === 0, "free: it opens the Pro sheet with the reason");
      ok(tbCalls(ctx).length === 0, "free: no AI call");
      ok(page.errs.length === 0, "no console errors (free): " + page.errs.join(" | "));
      await ctx.close();
    }
    console.log(`\nteach-back.e2e: ${n} checks passed`);
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
