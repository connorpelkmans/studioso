// Browser checks for Project Tasks with an in-memory stand-in for the Supabase client
const path = require("path"), fs = require("fs"), assert = require("assert");
const file = path.resolve(process.argv[2] || path.join(__dirname, "..", "index.html"));
const shots = path.resolve(process.argv[3] || path.join(__dirname, "..", "tests-out"));
fs.mkdirSync(shots, {recursive: true});
const {chromium, executablePath} = require("./pw");
let checks = 0; const ok = (c, m) => { checks++; assert(c, m); };

const {stubInit} = require("./group-stub");

async function boot(browser, w, opts){
  const ctx = await browser.newContext({viewport: {width: w, height: w < 600 ? 844 : 900}});
  const page = await ctx.newPage(), errs = [];
  page.on("pageerror", e => errs.push("pageerror: " + e.message));
  page.on("console", c => { if (c.type() === "error" && !/net::ERR|CORS|Failed to load resource|supabase-js/.test(c.text())) errs.push("console: " + c.text().slice(0, 200)); });
  await page.addInitScript(stubInit, opts);
  await page.goto("file://" + file); await page.waitForTimeout(1500);
  return {ctx, page, errs};
}
const click = (page, sel) => page.evaluate(sel => { const b = document.createElement("button"); b.dataset.act = sel; document.body.appendChild(b); b.click(); b.remove(); }, sel);
async function openGroup(page){
  await click(page, "grp-page"); await page.waitForSelector('[data-act="grp-open"]'); await page.click('[data-act="grp-open"]');
  await page.waitForSelector("#grpDetail", {timeout: 5000});
  if (await page.locator('[data-act="grp-tab"][data-t="tasks"]').count()) await page.click('[data-act="grp-tab"][data-t="tasks"]');
  await page.waitForSelector("#grpPT", {state: "attached", timeout: 5000}); await page.waitForTimeout(700);
}
// the sign-in sheet may open over the Board (this stub signs in to groups, not to sync)
const toPlan = async page => { await page.evaluate(() => { const d = document.querySelector("#dlg"); if (d && d.open) d.close(); }); await page.click('[data-act="bview"][data-id="plan"]'); };
const txt = (page, sel) => page.evaluate(sel => { const e = document.querySelector(sel); return e ? e.innerText.replace(/\s+/g, " ") : ""; }, sel);
const noOverflow = async (page, label) => ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), "no horizontal overflow: " + label);

async function scenario(browser, w){
  const tag = w + "px";
  const {ctx, page, errs} = await boot(browser, w, {me: "u1", emptyList: true});
  await openGroup(page);
  await page.screenshot({path: path.join(shots, `pt-${w}-0-empty.png`), fullPage: false});
  ok(/BIOL 201 Poster/.test(await txt(page, "#grpPT")), tag + " the group's list shows");
  ok(/Split up the work: add the first task/.test(await txt(page, "#grpPT")), tag + " empty list wording");
  const add = async (title, who, due) => { await page.fill("#ptTitle", title); if (who) await page.selectOption("#ptWho", who); if (due) await page.fill("#ptDue", due); await page.press("#ptTitle", "Enter"); await page.waitForTimeout(200); };
  const day = n => { const d = new Date(); d.setDate(d.getDate() + n); const z = x => String(x).padStart(2, "0"); return d.getFullYear() + "-" + z(d.getMonth() + 1) + "-" + z(d.getDate()); };
  await add("Draft the intro", "u2", day(2));
  await add("Find three figures", "", "");
  await add("Make the slides", "u1", day(-1));
  await add("Write the abstract", "u3", day(-3));
  await page.waitForTimeout(300);
  let rows = await page.$$eval(".pt-task", els => els.map(e => e.innerText.replace(/\s+/g, " ")));
  ok(rows.length === 4, tag + " four tasks listed, got " + rows.length);
  ok(/Draft the intro.*Sam.*Due/.test(rows[0]), tag + " assignee chip and due pill: " + rows[0]);
  ok(/Find three figures.*Unassigned/.test(rows[1]) && /Claim this/i.test(rows[1]), tag + " unassigned task offers Claim this: " + JSON.stringify(rows));
  ok(/overdue|yesterday/.test(rows[2]) && /You/.test(rows[2]), tag + " my overdue task: " + rows[2]);
  ok(await page.$$eval("#grpPT .pt-due.late", e => e.length) === 2, tag + " two overdue pills");
  ok(await page.$$eval("#grpPT .pt-due.soon", e => e.length) === 1, tag + " one due-soon pill");
  ok(/0 of 4 done/.test(await txt(page, ".pt-prog")), tag + " progress 0 of 4");
  const load = await txt(page, ".pt-load"); ok(/Sam\s+1 open/.test(load) && /You\s+1 open/.test(load) && /Jo\s+1 open/.test(load) && /Unassigned\s+1 open/.test(load), tag + " workload summary: " + load.replace(/\s+/g, " "));
  ok(await page.evaluate(() => window.__DB.group_tasks.length) === 4, tag + " tasks reached the server stub");
  await noOverflow(page, tag + " after adding");
  await page.screenshot({path: path.join(shots, `pt-${w}-1-tasks.png`), fullPage: true});
  await page.click('[data-act="grp-pt-claim"]'); await page.waitForTimeout(250);
  ok(/Find three figures.*You/.test(await txt(page, ".pt-tasks li:nth-child(2)")), tag + " claim assigns me: " + (await txt(page, ".pt-tasks")).replace(/\s+/g, " "));
  ok(await page.evaluate(() => window.__DB.group_tasks.find(t => t.title === "Find three figures").assignee_id) === "u1", tag + " claim saved");
  ok(await page.$$eval('[data-act="grp-pt-nudge"]', e => e.length) === 0, tag + " no Nudge button (the feature was removed)");
  await page.click('.pt-task:has-text("Make the slides") [data-act="grp-pt-done"]'); await page.waitForTimeout(300);
  ok(/1 of 4 done/.test(await txt(page, ".pt-prog")), tag + " completing updates progress");
  ok(await page.evaluate(() => window.__DB.group_tasks.find(t => t.title === "Make the slides").status) === "done", tag + " completion saved");
  ok(await page.getAttribute('.pt-task:has-text("Make the slides") [data-act="grp-pt-done"]', "aria-checked") === "true", tag + " checkbox state is exposed");
  const filt = async f => { await page.click(`[data-act="grp-pt-filter"][data-f="${f}"]`); await page.waitForTimeout(100); return page.$$eval(".pt-task .pt-title", e => e.map(x => x.innerText)); };
  eq(await filt("mine"), ["Find three figures"], tag + " Mine");
  eq(await filt("unassigned"), [], tag + " Unassigned (none left)");
  ok(/Every open task has an owner/.test(await txt(page, "#grpPT")), tag + " empty filter message");
  eq(await filt("overdue"), ["Write the abstract"], tag + " Overdue");
  eq(await filt("done"), ["Make the slides"], tag + " Done");
  ok((await filt("all")).length === 4, tag + " All");
  await page.evaluate(() => { const t = window.__DB.group_tasks.find(x => x.title === "Draft the intro"); t.status = "done"; t.completed_by = "u2"; t.completed_at = new Date().toISOString(); t.updated_by = "u2"; window.__fire("group_tasks", "UPDATE"); });
  await page.waitForTimeout(900);
  ok(/2 of 4 done/.test(await txt(page, ".pt-prog")), tag + " realtime update from another member");
  ok(await page.evaluate(() => window.__chans.some(c => !c.gone && c.name.startsWith("sbt-"))), tag + " the task channel was opened once the tables were confirmed");
  await page.fill("#ptTitle", "Half typed"); await page.evaluate(() => window.__fire("group_tasks", "UPDATE")); await page.waitForTimeout(900);
  eq(await page.inputValue("#ptTitle"), "Half typed", tag + " live update keeps the draft");
  ok(await page.evaluate(() => document.activeElement && document.activeElement.id) === "ptTitle", tag + " and keeps focus");
  await page.fill("#ptTitle", "");
  await page.evaluate(() => { window.__fail = "update_group_task"; window.__failMsg = "You don't have permission to do that in this group."; });
  await page.click('.pt-task:has-text("Write the abstract") [data-act="grp-pt-done"]');
  await page.waitForTimeout(10);
  await page.waitForTimeout(300);
  ok(await page.getAttribute('.pt-task:has-text("Write the abstract") [data-act="grp-pt-done"]', "aria-checked") === "false", tag + " failed save rolls the checkbox back");
  ok(/permission/.test(await txt(page, "#toast")), tag + " the error is explained");
  await page.evaluate(() => { window.__offline = true; });
  await page.fill("#ptTitle", "Offline thought"); await page.press("#ptTitle", "Enter"); await page.waitForTimeout(400);
  eq(await page.$$eval(".pt-task", e => e.length), 4, tag + " offline add rolls back");
  eq(await page.inputValue("#ptTitle"), "Offline thought", tag + " offline add restores what was typed");
  ok(/reach Studyboard/.test(await txt(page, "#toast")), tag + " offline message");
  await page.evaluate(() => { window.__offline = false; }); await page.fill("#ptTitle", "");
  await page.click('.pt-task:has-text("Write the abstract") [data-act="grp-pt-edit"]'); await page.waitForSelector("dialog[open] input[name=title]");
  await page.fill('dialog input[name="title"]', "Write the abstract (150 words)"); await page.fill('dialog textarea[name="notes"]', "Keep it under 150 words"); await page.selectOption('dialog select[name="priority"]', "high"); await page.selectOption('dialog select[name="who"]', "u1");
  await noOverflow(page, tag + " edit sheet");
  await page.screenshot({path: path.join(shots, `pt-${w}-2-edit.png`)});
  await page.click("dialog [data-submit]"); await page.waitForTimeout(400);
  const saved = await page.evaluate(() => window.__DB.group_tasks.find(t => /abstract/.test(t.title)));
  ok(saved.title === "Write the abstract (150 words)" && saved.notes === "Keep it under 150 words" && saved.priority === "high" && saved.assignee_id === "u1", tag + " edit saved (owner may reassign)");
  ok(/High/.test(await txt(page, "#grpPT")), tag + " priority tag");
  await page.click('[data-act="grp-pt-list-edit"]'); await page.click('dialog [data-act="grp-pt-list-arch"]'); await page.waitForTimeout(300);
  ok(/All your lists are archived/.test(await txt(page, "#grpPT")), tag + " archive hides the list");
  await page.click('[data-act="grp-pt-arch"]'); await page.waitForTimeout(100);
  ok(/archived/.test(await txt(page, ".pt-lists")), tag + " archived lists can be shown");
  await page.click('[data-act="grp-pt-list-edit"]'); await page.click('dialog [data-act="grp-pt-list-arch"]'); await page.waitForTimeout(300);
  ok(await page.$$eval(".pt-task", e => e.length) === 4, tag + " restore brings tasks back");
  await noOverflow(page, tag + " final");
  await page.screenshot({path: path.join(shots, `pt-${w}-3-final.png`), fullPage: true});
  eq(errs, [], tag + " no page errors: " + errs.join(" | "));
  await ctx.close();
}
const eq = (a, b, m) => { checks++; assert.deepStrictEqual(a, b, m); };

async function plainMember(browser){
  const {ctx, page, errs} = await boot(browser, 390, {me: "u2", seed: true});
  await openGroup(page);
  await page.click('.pt-task:has-text("Book printing") [data-act="grp-pt-edit"]'); await page.waitForSelector("dialog[open] select[name=who]");
  ok(await page.$eval('dialog select[name="who"]', e => e.disabled), "a plain member can't reassign someone else's task (select is disabled)");
  ok(/Only Jo or the group owner/.test(await txt(page, "dialog")), "the reason is shown");
  ok(await page.$$eval('dialog [data-act="grp-pt-del"]', e => e.length) === 0, "no delete button for a task someone else added");
  await page.keyboard.press("Escape");
  await page.click('.pt-task:has-text("Proofread") [data-act="grp-pt-claim"]'); await page.waitForTimeout(300);
  ok(await page.evaluate(() => window.__DB.group_tasks.find(t => t.title === "Proofread").assignee_id) === "u2", "member claims an unassigned task");
  eq(errs, [], "no errors (member)");
  await ctx.close();
}

async function sqlNotRun(browser){
  for (const who of ["u1", "u2"]) {
    const {ctx, page, errs} = await boot(browser, 1280, {me: who, kind: "project", missing: ["group_task_lists", "group_tasks"]});
    await openGroup(page).catch(() => {});
    await page.waitForTimeout(500);
    const t = await txt(page, "#grpPT");
    if (who === "u1") { ok(/groups\.sql/.test(t) && /Tasks/.test(t), "owner sees the run groups.sql note: " + t.replace(/\s+/g, " ")); await page.screenshot({path: path.join(shots, "pt-1280-sql-not-run.png")}); }
    else ok(t.trim() === "", "members see nothing when the SQL isn't run");
    ok(await page.evaluate(() => !window.__chans.some(c => c.name.startsWith("sbt-"))), "no task channel is opened while the tables are missing (it would break the others)");
    ok(await page.$("#grpFiles") !== null, "the rest of the group page still works");
    eq(errs, [], "no errors (sql not run)");
    await ctx.close();
  }
}

async function planner(browser, w){
  const tag = "planner " + w;
  const {ctx, page, errs} = await boot(browser, w, {me: "u1", seed: true});
  await toPlan(page);
  await page.waitForSelector("#grpMine", {timeout: 6000});
  const card = await txt(page, "#grpMine");
  ok(/Group: BIOL 201 Poster/.test(card), tag + " group badge: " + card.replace(/\s+/g, " "));
  ok(/Write the methods section/.test(card) && /Collect survey data/.test(card) && !/Design the poster layout/.test(card) && !/Proofread/.test(card), tag + " only my tasks");
  ok(/1 group task due this week/.test(card), tag + " Today line: " + card.replace(/\s+/g, " ").slice(0, 160));
  ok(/1 overdue/.test(card), tag + " overdue count");
  ok(/about 1h/.test(card), tag + " default 1h effort");
  ok(await page.evaluate(() => typeof window.SBGROUPTASKS.mine === "function" && window.SBGROUPTASKS.mine().length === 2), tag + " accessor returns two rows");
  ok(await page.evaluate(() => window.SBGROUPTASKS.mine().every(r => r.hours === 1 && /^\d{4}-\d{2}-\d{2}$/.test(r.due))), tag + " rows have dates and hours");
  ok(await page.evaluate(() => !Object.values(JSON.parse(localStorage.getItem("coursework:v2") || "{}").tasks || {}).some(t => /methods section/.test(t.title || ""))), tag + " not copied into the personal task list");
  ok(await page.evaluate(() => (localStorage.getItem("sb:gtmine:u1") || "").includes("Write the methods section")), tag + " cached for offline");
  await page.screenshot({path: path.join(shots, `planner-${w}.png`), fullPage: true});
  await noOverflow(page, tag);
  await page.click('#grpMine [data-act="grp-pt-done"]:near(:text("Collect survey data"))').catch(async () => { await page.click('#grpMine li:has-text("Collect survey data") [data-act="grp-pt-done"]'); });
  await page.waitForTimeout(500);
  ok(await page.evaluate(() => window.__DB.group_tasks.find(t => t.id === "s2").status) === "done", tag + " completing here completes the shared task");
  ok(!/Collect survey data/.test(await txt(page, "#grpMine")), tag + " it leaves the card");
  await page.click('#grpMine [data-act="grp-pt-open"]:has-text("Write the methods section")'); await page.waitForSelector("#grpPT", {timeout: 4000}); await page.waitForTimeout(700);
  ok(/BIOL 201 Poster/.test(await txt(page, "#grpPT")), tag + " card opens the group's list");
  await page.click('.pt-task:has-text("Write the methods section") [data-act="grp-pt-done"]'); await page.waitForTimeout(400);
  ok(await page.evaluate(() => window.SBGROUPTASKS.mine().length === 0), tag + " completing in the group updates the planner list");
  eq(errs, [], tag + " no errors: " + errs.join(" | "));
  await ctx.close();
}

async function plannerRollback(browser){
  const {ctx, page, errs} = await boot(browser, 1280, {me: "u1", seed: true});
  await toPlan(page);
  await page.waitForSelector("#grpMine", {timeout: 6000});
  await page.evaluate(() => { window.__fail = "update_group_task"; window.__failMsg = "Couldn't reach Studyboard. Check your internet connection and try again."; });
  await page.click('#grpMine li:has-text("Collect survey data") [data-act="grp-pt-done"]'); await page.waitForTimeout(500);
  ok(/Collect survey data/.test(await txt(page, "#grpMine")), "a failed completion from the planner puts the row back");
  ok(await page.evaluate(() => window.__DB.group_tasks.find(t => t.id === "s2").status) === "todo", "and the shared task is untouched");
  eq(errs, [], "no errors (planner rollback)");
  await ctx.close();
}

(async () => {
  const browser = await chromium.launch({executablePath});
  try {
    await scenario(browser, 1280); await scenario(browser, 390);
    await plainMember(browser); await sqlNotRun(browser);
    await planner(browser, 1280); await planner(browser, 390); await plannerRollback(browser);
    console.log(`grouptasks.e2e.js: ${checks} checks passed. Screenshots in ${shots}`);
  } catch(e) { console.error("FAILED:", e.message); process.exitCode = 1; }
  await browser.close();
})();
