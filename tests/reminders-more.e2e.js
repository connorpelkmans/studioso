// Browser checks for the reminder additions: Keep Reminding Until Done and the snooze length in settings, extra reminders and
// keep-reminding on a task, and the snooze choices
const path = require("path"), fs = require("fs"), assert = require("assert");
const file = path.resolve(__dirname, "..", "index.html");
const shots = path.resolve(process.argv[2] || path.join(__dirname, "..", "tests-out"));
fs.mkdirSync(shots, {recursive: true});
const {chromium, executablePath} = require("./pw");
let checks = 0; const ok = (c, m) => { checks++; assert(c, m); };

(async () => {
  const browser = await chromium.launch({executablePath});
  try {
    const ctx = await browser.newContext({viewport: {width: 1280, height: 900}});
    const page = await ctx.newPage(), errs = [];
    page.on("pageerror", e => errs.push(e.message));
    const day = n => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
    await page.addInitScript(due => {
      const seed = {v: 2, updated: 1, notes: [], decks: [], settings: {capacity: 15, dailyHours: 3}, courses: [{id: "c1", name: "English", code: "ENGL 101", color: "#3B6FE0"}],
        tasks: [{id: "t1", title: "Essay draft", type: "Assignment", courseId: "c1", due, time: "17:00", status: "todo", created: 1}]};
      try { localStorage.setItem("coursework:v2", JSON.stringify(seed)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("studyboard:tour", "done"); } catch (e) {}
    }, day(3));
    await page.goto("file://" + file); await page.waitForTimeout(1200);
    const act = (a, data) => page.evaluate(([a, data]) => { const b = document.createElement("button"); b.dataset.act = a; Object.assign(b.dataset, data || {}); document.body.appendChild(b); b.click(); b.remove(); }, [a, data]);
    const st = () => page.evaluate(() => window.__sbBreakdown.state());

    // Settings
    await act("rm-open"); await page.waitForSelector('dialog[open] [data-rm="nag"]');
    ok(await page.locator('dialog[open] [data-rm="nagEvery"]').count() === 1 && await page.locator('dialog[open] [data-rm="snooze"]').count() === 1, "settings: keep-reminding and snooze length");
    await page.check('dialog[open] [data-rm="nag"]'); await page.selectOption('dialog[open] [data-rm="nagEvery"]', "10"); await page.selectOption('dialog[open] [data-rm="snooze"]', "15");
    await page.waitForTimeout(500);
    const rm = (await st()).settings.reminders;
    ok(rm.nag === true && rm.nagEvery === 10 && rm.snooze === 15, "settings saved: " + JSON.stringify(rm));
    ok(/Still to do/.test(await page.textContent("#rmComing")) || (await page.evaluate(() => window.studyboardReminders.list().some(r => r.kind === "nag"))), "repeats are planned");
    // Course registration
    const reg = (() => { const d = new Date(); d.setDate(d.getDate() + 10); return d.toISOString().slice(0, 10); })();
    await page.fill('dialog[open] [data-rm="regDate"]', reg); await page.waitForTimeout(600);
    await page.fill('dialog[open] [data-rm="regNote"]', "CRN 41023"); await page.press('dialog[open] [data-rm="regNote"]', "Tab"); await page.waitForTimeout(500);
    const rs = (await st()).settings.reminders;
    ok(rs.regDate === reg && rs.regNote === "CRN 41023", "registration day saved: " + JSON.stringify({d: rs.regDate, n: rs.regNote}));
    const regs = await page.evaluate(() => { window.studyboardReminders.refresh(); return window.studyboardReminders.list().filter(r => r.kind === "reg").map(r => r.title); });
    ok(regs.length === 5 && regs[4] === "Registration Is Open", "five registration reminders planned: " + regs.join(", "));
    ok(await page.locator('dialog[open] [data-act="rm-reg-clear"]').count() === 1, "a Clear button appears");
    await page.evaluate(() => document.querySelector('dialog[open] [data-rm="regDate"]').scrollIntoView({block: "center"}));
    await page.screenshot({path: shots + "/rm-registration.png"});
    await page.click('dialog[open] [data-act="rm-reg-clear"]'); await page.waitForTimeout(500);
    ok((await st()).settings.reminders.regDate === "" && await page.evaluate(() => { window.studyboardReminders.refresh(); return !window.studyboardReminders.list().some(r => r.kind === "reg"); }), "Clear removes them");
    await page.evaluate(() => document.querySelector('dialog[open] [data-rm="nag"]').scrollIntoView({block: "center"}));
    await page.screenshot({path: shots + "/rm-settings.png"});
    await page.keyboard.press("Escape"); await page.waitForTimeout(300);

    // A task: extra reminders, and keep-reminding off for this one
    await act("edit-task", {id: "t1", edit: "1"}); await page.waitForSelector("dialog[open] .rm-more", {state: "attached"});
    await page.evaluate(() => { const d = document.querySelector("dialog[open] details:not([open])"); if (d) d.open = true; });
    ok(await page.isChecked("#rmNag"), "the task follows the setting (on)");
    await page.click('dialog[open] [data-also="1w"]'); await page.click('dialog[open] [data-also="15m"]');
    await page.uncheck("#rmNag");
    await page.screenshot({path: shots + "/rm-task.png"});
    await page.click("dialog[open] [data-submit]"); await page.waitForTimeout(500);
    const t = (await st()).tasks.t1;
    ok(JSON.stringify(t.remindAlso) === JSON.stringify(["1w", "15m"]) && t.nag === false, "saved on the task: " + JSON.stringify({also: t.remindAlso, nag: t.nag}));
    const L = await page.evaluate(() => { window.studyboardReminders.refresh(); return window.studyboardReminders.list().filter(r => r.taskId === "t1"); });
    ok(L.some(r => /:15m:/.test(r.id)) && !L.some(r => r.kind === "nag"), "the list has the extra reminder and no repeats for this task: " + JSON.stringify(L.map(r => [r.id, r.kind])) + JSON.stringify(await page.evaluate(() => window.__sbBreakdown.state().tasks.t1)));
    // Untimed task: minutes-before choices hide
    await act("edit-task", {id: "t1", edit: "1"}); await page.waitForSelector("dialog[open] .rm-more", {state: "attached"});
    await page.evaluate(() => { const d = document.querySelector("dialog[open] details:not([open])"); if (d) d.open = true; const i = document.querySelector('dialog[open] input[name="time"]'); i.value = ""; i.dispatchEvent(new Event("input", {bubbles: true})); });
    ok(await page.evaluate(() => document.querySelector('dialog[open] [data-also="15m"]').hidden && !document.querySelector('dialog[open] [data-also="1w"]').hidden), "without a due time, only day choices show");
    await page.keyboard.press("Escape"); await page.waitForTimeout(300);

    // Snooze choices
    await page.evaluate(() => window.studyboardReminders.snoozeSheet({id: "r:t:t1:1d:x", title: "Essay draft", body: "", taskId: "t1"}));
    await page.waitForSelector("dialog[open] [data-snz]");
    const labels = await page.$$eval("dialog[open] [data-snz]", bs => bs.map(b => b.textContent));
    ok(labels.length >= 3 && /10 Minutes/.test(labels[0]) && labels.some(l => /Tomorrow Morning/.test(l)), "snooze choices: " + labels.join(" | "));
    await page.screenshot({path: shots + "/rm-snooze.png"});
    await page.click('dialog[open] [data-snz="0"]'); await page.waitForTimeout(400);
    ok(await page.evaluate(() => JSON.parse(localStorage.getItem("studyboard:remSnooze") || "[]").some(s => s.taskId === "t1" && s.at > Date.now() + 9 * 60000 && s.at < Date.now() + 11 * 60000)), "10 Minutes snoozes for 10 minutes");
    ok(errs.length === 0, "no page errors: " + errs.join(" | "));
    await ctx.close();
  } finally { await browser.close(); }
  console.log(`reminders-more e2e: ${checks} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
