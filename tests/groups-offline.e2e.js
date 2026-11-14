// Offline in Groups: messages, reactions, RSVPs and group tasks changed offline wait on the device, show as sending, go out in
// order when the connection is back, and anything that can't be sent stays listed with why (in-memory Supabase stand-in)
const path = require("path"), fs = require("fs"), assert = require("assert");
const file = path.resolve(process.argv[2] || path.join(__dirname, "..", "index.html"));
const shots = path.resolve(process.argv[3] || path.join(__dirname, "..", "tests-out"));
fs.mkdirSync(shots, {recursive: true});
const {chromium, executablePath} = require("./pw");
const {stubInit} = require("./group-stub");
let checks = 0; const ok = (c, m) => { checks++; assert(c, m); console.log("ok -", m); };

const txt = async (page, sel) => { const l = page.locator(sel).first(); return (await l.count()) ? (await l.innerText()).replace(/\s+/g, " ") : ""; };
const act = (page, a) => page.evaluate(a => { const b = document.createElement("button"); b.dataset.act = a; document.body.appendChild(b); b.click(); b.remove(); }, a);
const tab = async (page, t) => { await page.click(`[data-act="grp-tab"][data-t="${t}"]`); await page.waitForTimeout(250); };
const soon = () => new Date(Date.now() + 864e5).toISOString();

async function boot(browser, w){
  const ctx = await browser.newContext({viewport: {width: w, height: w < 600 ? 844 : 900}});
  const page = await ctx.newPage(), errs = [];
  page.on("pageerror", e => errs.push("pageerror: " + e.message));
  page.on("console", c => { if (c.type() === "error" && !/net::ERR|CORS|Failed to load resource|supabase-js/.test(c.text())) errs.push("console: " + c.text().slice(0, 200)); });
  await page.addInitScript(stubInit, {me: "u1", kind: "project", seed: true,
    msgs: [{user_id: "u2", body: "Hi all, poster due Friday", created_at: new Date(Date.now() - 36e5).toISOString()}],
    items: [{id: "ev1", kind: "event", user_id: "u2", author_name: "Sam", title: "Poster work session", data: {start: soon(), mins: 60}}]});
  await page.goto("file://" + file); await page.waitForTimeout(1500);
  await act(page, "grp-page"); await page.waitForSelector('[data-act="grp-open"]'); await page.click('[data-act="grp-open"]');
  await page.waitForSelector("#grpDetail", {timeout: 5000}); await page.waitForTimeout(800);
  return {ctx, page, errs};
}
const goOff = async (ctx, page) => { await page.evaluate(() => { window.__offline = true; }); await ctx.setOffline(true); await page.waitForTimeout(300); };
const goOn = async (ctx, page) => { await page.evaluate(() => { window.__offline = false; }); await ctx.setOffline(false); await page.waitForTimeout(2200); };

async function main(browser, w){
  const tag = w + "px";
  const {ctx, page, errs} = await boot(browser, w);
  await tab(page, "tasks");
  ok(/Write the methods section/.test(await txt(page, "#grpPT")), tag + " tasks loaded online");
  await tab(page, "chat");
  ok(/poster due Friday/.test(await txt(page, "#grpMsgList")), tag + " messages loaded online");

  await goOff(ctx, page);
  ok(/Offline/.test(await txt(page, "#grpDetail")) && /sent when you're back online/.test(await txt(page, ".grp-offline-line")), tag + " offline line says changes are sent later");
  // a message
  await page.fill("#grpMsgIn", "Printing is booked for 3pm"); await page.click("#grpPost button[type=submit]"); await page.waitForTimeout(300);
  ok(/Printing is booked for 3pm/.test(await txt(page, "#grpMsgList .grp-msg.is-pending")), tag + " the message shows in the list");
  ok(/Sending when you're back online/.test(await txt(page, "#grpMsgList .grp-msg.is-pending")), tag + " marked as sending later");
  ok(await page.inputValue("#grpMsgIn") === "", tag + " the box is cleared");
  await page.fill("#grpMsgIn", "Second thought"); await page.click("#grpPost button[type=submit]"); await page.waitForTimeout(300);
  // a reaction on Sam's message
  await page.click('.grp-msg:not(.is-pending) [data-act="grp-react-open"]'); await page.waitForTimeout(150);
  await page.click('.grp-msg:not(.is-pending) .grp-picker [data-act="grp-react"]'); await page.waitForTimeout(200);
  ok(await page.$(".grp-react.on.is-pending") !== null, tag + " the reaction shows, marked pending");
  await page.screenshot({path: path.join(shots, `so16-${w}-chat.png`)});
  // a task: add, complete, edit
  await tab(page, "tasks");
  ok(await page.$("#fab.is-off") === null, tag + " Add Task isn't dimmed offline");
  await page.click("#fab"); await page.waitForSelector("dialog[open] input[name=title]");
  await page.fill('dialog input[name="title"]', "Print the poster"); await page.click("#ptAddGo"); await page.waitForTimeout(400);
  ok(/Sending when you're back online/.test(await txt(page, ':is(.pt-task,.kb-card):has-text("Print the poster")')), tag + " the new task shows as sending later");
  await page.click(':is(.pt-task,.kb-card):has-text("Write the methods section") [data-act="grp-pt-done"]'); await page.waitForTimeout(300);
  ok(await page.getAttribute(':is(.pt-task,.kb-card):has-text("Write the methods section") [data-act="grp-pt-done"]', "aria-checked") === "true", tag + " completing works offline");
  await page.click(':is(.pt-task,.kb-card):has-text("Print the poster") [data-act="grp-pt-edit"]'); await page.waitForSelector("dialog[open] input[name=title]");
  await page.fill('dialog input[name="title"]', "Print the poster (A1)"); await page.click("dialog [data-submit]"); await page.waitForTimeout(300);
  ok(/Print the poster \(A1\)/.test(await txt(page, "#grpPT")), tag + " editing a task that's still waiting works");
  await page.screenshot({path: path.join(shots, `so16-${w}-tasks.png`)});
  // RSVP to the meeting
  await tab(page, "meetings");
  const rsvp = page.locator('[data-act="grp-rsvp"][data-s="yes"]').first();
  if (await rsvp.count()) { await rsvp.click(); await page.waitForTimeout(250); ok(await page.$('[data-act="grp-rsvp"].is-pending') !== null, tag + " the RSVP shows, marked pending"); }
  ok(/changes waiting/.test(await txt(page, ".grp-out-line")), tag + " the group says how many changes are waiting: " + await txt(page, ".grp-out-line"));
  ok(await page.evaluate(() => !window.__DB.group_messages.some(m => /Printing/.test(m.body)) && !window.__DB.group_tasks.some(t => /Print the poster/.test(t.title))), tag + " nothing reached the server yet");
  await page.screenshot({path: path.join(shots, `so16-${w}-offline.png`)});
  // still there after a reload while offline
  await page.reload(); await page.waitForTimeout(1500);
  await act(page, "grp-page"); await page.waitForTimeout(400);
  await page.waitForSelector('[data-act="grp-open"]'); await page.click('[data-act="grp-open"]'); await page.waitForSelector("#grpOut .grp-out-line", {timeout: 5000}).catch(() => {});
  await page.waitForFunction(() => /changes waiting/.test(document.body.innerText), null, {timeout: 8000}).catch(() => {});   // a busy machine can take longer than the waits above
  ok(/changes waiting/.test(await txt(page, "body")), tag + " the waiting changes survive a reload");

  await goOn(ctx, page);
  const db = await page.evaluate(() => ({msgs: window.__DB.group_messages.map(m => m.body), tasks: window.__DB.group_tasks.map(t => [t.title, t.status]), calls: window.__calls.filter(c => c[0] === "rpc").map(c => c[1])}));
  ok(db.msgs.indexOf("Printing is booked for 3pm") >= 0 && db.msgs.indexOf("Second thought") > db.msgs.indexOf("Printing is booked for 3pm"), tag + " both messages sent, in order");
  ok(db.tasks.some(([t]) => t === "Print the poster (A1)"), tag + " the new task was added with its edit: " + JSON.stringify(db.tasks.map(x => x[0])));
  ok(db.tasks.some(([t, s]) => t === "Write the methods section" && s === "done"), tag + " the completion was sent");
  ok(db.calls.includes("toggle_reaction"), tag + " the reaction was sent");
  ok(db.calls.indexOf("add_group_task") < db.calls.lastIndexOf("update_group_task"), tag + " the edit went after the add");
  ok(!(await page.$(".grp-out-line")), tag + " nothing is left waiting");
  ok(/Sent the \d+ changes you made offline/.test(await txt(page, "#toast")), tag + " a toast says they were sent");
  eq(errs, [], tag + " no page errors");
  await ctx.close();
}
const eq = (a, b, m) => { checks++; assert.deepStrictEqual(a, b, m); console.log("ok -", m); };

// Things that can't be sent are kept, with why
async function failures(browser){
  const {ctx, page, errs} = await boot(browser, 1280);
  await tab(page, "tasks");
  await goOff(ctx, page);
  await page.click(':is(.pt-task,.kb-card):has-text("Design the poster layout") [data-act="grp-pt-edit"]'); await page.waitForSelector("dialog[open] input[name=title]");
  await page.fill('dialog input[name="title"]', "Design the poster layout v2"); await page.click("dialog [data-submit]"); await page.waitForTimeout(300);
  await page.click(':is(.pt-task,.kb-card):has-text("Proofread") [data-act="grp-pt-claim"]'); await page.waitForTimeout(300);
  await tab(page, "chat");
  await page.fill("#grpMsgIn", "Don't lose me"); await page.click("#grpPost button[type=submit]"); await page.waitForTimeout(300);
  // while offline: Sam renamed the same task, and Proofread was deleted
  await page.evaluate(() => { const D = window.__DB; const t = D.group_tasks.find(x => x.title === "Design the poster layout"); t.title = "Poster layout (Sam's)"; t.updated_by = "u2"; t.updated_at = new Date().toISOString();
    D.group_tasks.find(x => x.title === "Proofread").deleted = true; });
  // and the message hits a server error
  await page.evaluate(() => { window.__failMsgs = true; });
  await page.evaluate(() => { const D = window.__DB, orig = D.group_messages; D.group_messages = new Proxy(orig, {get(t, k) { if (k === "push" && window.__failMsgs) return () => { throw new Error("You're not in that group"); }; return Reflect.get(t, k); }}); });
  await goOn(ctx, page);
  const fail = await txt(page, ".grp-out-fail");
  ok(/Not Sent/.test(fail), tag2 + " a Not Sent list shows: " + fail);
  ok(/Sam changed this task while you were offline/.test(fail), tag2 + " a conflicting edit isn't applied, and says who changed it");
  ok(await page.evaluate(() => window.__DB.group_tasks.some(t => t.title === "Poster layout (Sam's)")), tag2 + " Sam's change is kept");
  ok(/That task was deleted while you were offline/.test(fail), tag2 + " a change to a deleted task says so");
  ok(/Don't lose me/.test(fail) && await page.$('[data-act="grp-out-copy"]') !== null, tag2 + " the message that couldn't be sent keeps its text, with Copy Text");
  await page.screenshot({path: path.join(shots, "so16-1280-not-sent.png")});
  // Use Mine Anyway applies the edit; Discard clears one
  await page.click('[data-act="grp-out-retry"]:has-text("Use Mine Anyway")'); await page.waitForTimeout(800);
  ok(await page.evaluate(() => window.__DB.group_tasks.some(t => t.title === "Design the poster layout v2")), tag2 + " Use Mine Anyway applies the edit");
  const n0 = await page.$$eval(".grp-out-fail li", e => e.length);
  await page.click('.grp-out-fail li:has-text("deleted") [data-act="grp-out-drop"]'); await page.waitForTimeout(200);
  ok(await page.$$eval(".grp-out-fail li", e => e.length) === n0 - 1, tag2 + " Discard removes one");
  eq(errs, [], tag2 + " no page errors");
  await ctx.close();
}
const tag2 = "failures";

(async () => {
  const browser = await chromium.launch({executablePath});
  try { await main(browser, 1280); await main(browser, 390); await failures(browser); }
  finally { await browser.close(); }
  console.log(`groups-offline: ${checks} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
