// Browser test for the Formula and Diagram Sheet (Pro): node tests/exam-sheet.e2e.js [screenshot dir]
const path = require("path"), fs = require("fs"), assert = require("assert"), os = require("os");
const {chromium, executablePath} = require("./pw");
const F = require("./exam-study-fixture");
const OUT = process.argv[2] || fs.mkdtempSync(path.join(os.tmpdir(), "sbsheet-"));
fs.mkdirSync(OUT, {recursive: true});
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };

(async () => {
  const browser = await chromium.launch({executablePath});
  try {
    for (const [W, H] of [[1280, 800], [390, 844]]) {
      console.log("== " + W + " wide");
      const {page} = await F.mk(browser, W, H);
      await F.putPicture(page);
      ok(page.errs.length === 0, "no page errors on load: " + page.errs.join("; "));
      // the Prep Plan offers it once the exam has linked material
      await F.act(page, "exam-plan", "ex1"); await page.waitForTimeout(500);
      ok((await page.locator("#ppTitle").textContent()) === "Prep Plan", "the exam's Prep Plan opens");
      ok(await page.locator('#ppBody [data-act="xs-open"]').count() === 1, "it has one Formula and Diagram Sheet action, under Topics");
      ok(await page.locator('#ppBody [data-act="xs-open"] .pro-badge').count() === 0, "no PRO badge for Pro");
      ok(await F.noHScroll(page) && await F.dlgScroll(page), "no horizontal scroll in the Prep Plan");
      await page.click('#ppBody [data-act="xs-open"]'); await page.waitForTimeout(1200);
      ok(await page.locator('#dlg .pr-kind').count() === 5, "Print and PDF opens with five layouts");
      ok(await page.locator('#dlg .pr-kind[data-id="sheet"][aria-checked="true"]').count() === 1, "Formula and Diagram Sheet is chosen");
      ok(await page.locator("#dlg [data-pr-exam]").inputValue() === "ex1", "for this exam");
      const prev = () => page.locator("#dlg .pr-prev .xs-page");
      const txt = await prev().innerText(), html = await prev().innerHTML();
      ok(/Midterm: Formula and Diagram Sheet/.test(txt) && /PHYS 101/.test(txt), "titled with the exam and course");
      const secs = await page.locator("#dlg .pr-prev .xs-sec h2").allTextContents();
      ok(JSON.stringify(secs) === JSON.stringify(["Kinematics", "Forces", "Lecture 5: Momentum"]), "grouped by topic, then the lecture cards pulled in by date; a topic with nothing linked is left out: " + secs.join(" | "));
      const fx = await page.locator("#dlg .pr-prev .xs-x").allTextContents();
      ok(fx.includes("v = u + at") && fx.includes("E=mc2") && fx.includes("F = ma") && fx.includes("p = mv"), "formulas from cards and lecture cards: " + fx.join(" | "));
      ok(fx.filter(x => x === "F = ma").length === 1 && fx.filter(x => x === "v = u + at").length === 1, "each formula once (the reversed card and the note line are duplicates)");
      ok(/E=mc<sup>2<\/sup>/.test(html), "LaTeX is shown readably ($E=mc^2$ becomes E=mc², no dollar signs)");
      ok(!fx.some(x => /x = y \+ z/.test(x)), "draft cards are left out");
      const dt = await page.locator("#dlg .pr-prev .xs-d b").allTextContents();
      ok(["Vector", "Velocity", "Acceleration", "Inertia", "Impulse"].every(t => dt.includes(t)), "definitions from term cards, note lines and lecture cards: " + dt.join(" | "));
      ok(!dt.some(t => /^(Due|Room|Unit of force|The answer)/.test(t)) && !/whatever you think/.test(txt) && !/Due: Friday|Room/.test(txt), "no false definitions or formulas from 'Due: Friday', 'Room: 4B' or 'The answer = whatever you think'");
      ok(await page.locator("#dlg .pr-prev .xs-pic img").count() === 1 && /^blob:/.test(await page.locator("#dlg .pr-prev .xs-pic img").getAttribute("src")), "the picture card's picture is on the sheet");
      ok(await page.locator("#dlg .pr-prev .xs-pic .xs-n").count() === 3 && /Weight/.test(txt) && /Normal force/.test(txt) && /Friction/.test(txt), "with its labels numbered on the picture and listed under it");
      ok(await page.locator("#dlg .pr-prev .xs-cols").count() === 1, "set in columns");
      ok(await F.noHScroll(page) && await F.dlgScroll(page), "no horizontal scroll in Print and PDF");
      await page.screenshot({path: path.join(OUT, `print-sheet-${W}.png`)});
      // what to include
      await page.click('#dlg [data-pr-opt="xsD"]'); await page.waitForTimeout(250);
      ok(await page.locator("#dlg .pr-prev .xs-d").count() === 0 && await page.locator("#dlg .pr-prev .xs-f").count() > 0, "unticking Definitions leaves them out");
      await page.click('#dlg [data-pr-opt="xsD"]'); await page.waitForTimeout(250);
      ok(await page.locator("#dlg .pr-prev .xs-d").count() > 0, "and ticking brings them back");
      // print
      await page.evaluate(() => { window.__printed = 0; window.print = () => { window.__printed++; }; });
      await page.click('#dlg [data-act="pro-pr-go"]'); await page.waitForTimeout(500);
      const printed = await page.evaluate(() => { const b = document.getElementById("sbPrint"); return {n: window.__printed, html: b ? b.innerHTML : ""}; });
      ok(printed.n === 1, "Print opens the print dialog");
      ok(/xs-page/.test(printed.html) && /v = u \+ at/.test(printed.html) && /<b>Inertia<\/b>/.test(printed.html) && /<img src="blob:/.test(printed.html) && /Lecture 5: Momentum/.test(printed.html), "the print area holds the sheet: formulas, definitions and the picture");
      ok(!/Due: Friday|whatever you think|x = y \+ z/.test(printed.html), "and nothing that isn't a formula, definition or picture");
      ok(await F.noHScroll(page), "no horizontal scroll after printing");
      ok(page.errs.length === 0, "no console errors: " + page.errs.join(" | "));
      await page.context().close();
    }

    // the menu's Print and PDF has it as a fifth page; empty cases say what to link
    {
      const seed = F.SEED(); seed.tasks[0].prep.topics.forEach(t => { if (t.id !== "t3") t.links = []; }); seed.decks[1].cards = [];
      seed.tasks.push({id: "ex2", title: "Quiz 3", courseId: "c1", type: "Quiz", due: F.plus(5), start: F.plus(5), status: "todo", priority: "med"});
      const {page} = await F.mk(browser, 1280, 800, {seed});
      await F.act(page, "exam-plan", "ex1"); await page.waitForTimeout(400);
      ok(await page.locator('#ppBody [data-act="xs-open"]').count() === 0, "with nothing linked, the Prep Plan doesn't offer the sheet");
      await F.act(page, "pro-pr-open", "sheet"); await page.waitForTimeout(500);
      ok(await page.locator('#dlg .pr-kind[data-id="sheet"][aria-checked="true"]').count() === 1, "Print and PDF can open on the sheet");
      ok(await page.locator("#dlg [data-pr-exam] option").count() === 1, "only exams with topics are offered (not Quiz 3)");
      ok(/Nothing is linked to this exam's topics yet/.test(await page.locator("#dlg .pr-prev").innerText()), "an exam with nothing linked says what to link");
      ok(page.errs.length === 0, "no console errors (empty): " + page.errs.join(" | "));
      await page.context().close();
    }
    {
      const seed = F.SEED(); seed.decks[0].cards = seed.decks[0].cards.filter(c => ["k7", "k12"].includes(c.id)); seed.decks[1].cards = []; seed.notes[0].text = "Motion\nDue: Friday\nRoom: 4B";
      const {page} = await F.mk(browser, 390, 844, {seed});
      await F.act(page, "pro-pr-open", "sheet"); await page.waitForTimeout(500);
      ok(/No formulas, definitions or picture cards were found/.test(await page.locator("#dlg .pr-prev").innerText()), "linked material with no formulas or definitions says so, with examples");
      ok(await F.noHScroll(page) && await F.dlgScroll(page), "no horizontal scroll (empty, 390)");
      await page.context().close();
    }
    {
      const seed = F.SEED(); seed.tasks = seed.tasks.filter(t => t.id !== "ex1" && !t.prepFor);
      const {page} = await F.mk(browser, 1280, 800, {seed});
      await F.act(page, "pro-pr-open", "sheet"); await page.waitForTimeout(500);
      ok(/No upcoming exam has topics yet/.test(await page.locator("#dlg .pr-body").innerText()), "no exam with topics: says how to add them");
      ok(page.errs.length === 0, "no console errors (no exam): " + page.errs.join(" | "));
      await page.context().close();
    }

    // free account with Pro switched on: PRO badge and the Pro sheet
    {
      const {page} = await F.mk(browser, 390, 844, {free: true});
      await F.act(page, "exam-plan", "ex1"); await page.waitForTimeout(400);
      ok(await page.locator('#ppBody [data-act="xs-open"] .pro-badge').count() === 1, "free: the action shows a PRO badge");
      await page.click('#ppBody [data-act="xs-open"]'); await page.waitForTimeout(600);
      ok(/Formula and Diagram Sheet is part of Studyboard Pro/.test(await page.evaluate(() => (document.querySelector("dialog[open]") || {}).textContent || "")), "free: it opens the Pro sheet with the reason");
      ok(page.errs.length === 0, "no console errors (free): " + page.errs.join(" | "));
      await page.context().close();
    }
    console.log(`\nexam-sheet.e2e: ${n} checks passed`);
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
