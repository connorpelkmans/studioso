// Task Board and quick add: a double click completes one task (B1), a draft waiting for review is kept (B2), the day rolls
// over at midnight (T8), archived courses' tasks show under No Course (T5), and the early-morning timeline wording (B6)
const {chromium, executablePath} = require("./pw");
const path = require("path"), fs = require("fs"), http = require("http");
const ROOT = path.join(__dirname, "..");
const MIME = {".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".webmanifest": "application/manifest+json", ".css": "text/css", ".png": "image/png", ".svg": "image/svg+xml", ".woff2": "font/woff2"};
const server = http.createServer((req, res) => {
  let f; try { f = path.join(ROOT, decodeURIComponent(new URL(req.url, "http://x").pathname)); } catch (e) { res.writeHead(400); res.end(); return; }
  if (!f.startsWith(ROOT + path.sep) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
let checks = 0; const ok = (c, m) => { checks++; if (!c) { console.log("FAIL:", m); process.exitCode = 1; } };
const COURSES = [{id: "c1", name: "Biology 101", code: "BIO101", color: "#4F8A5B"}, {id: "old", name: "History 100", code: "HIS100", color: "#8A4F5B", archived: true}];
const T = (id, title, due, courseId) => ({id, title, courseId: courseId || "c1", type: "Assignment", start: "2026-10-01", due, time: "", priority: "med", status: "todo", notes: "", hours: 2, checklist: [], pct: 0, dependsOn: [], history: [], created: 1, order: 0});
const TASKS = [T("t1", "First Task", "2026-10-08"), T("t2", "Second Task", "2026-10-09"), T("t3", "Third Task", "2026-10-10"), T("t4", "Carried Over Essay", "2026-10-11", "old"),
  // a weight split from points by school sync is an estimate (B4)
  Object.assign(T("t5", "Points Worksheet", "2026-10-20"), {weight: 3, cv: {last: {wPts: 10, weight: 3}}})];
const seed = ([tasks, courses]) => {
  localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("studioso:tour", "done"); localStorage.setItem("sb:onboarded", "1");
  if (!localStorage.getItem("coursework:v2")) localStorage.setItem("coursework:v2", JSON.stringify({v: 2, courses, tasks, files: [], notes: [], decks: [], events: [], settings: {capacity: 15, dailyHours: 4}, updated: 1}));
};
async function open(browser, o){
  const ctx = await browser.newContext({viewport: o.vp, timezoneId: "America/New_York", locale: "en-US", serviceWorkers: "block", hasTouch: !!o.touch, isMobile: !!o.touch});
  const p = await ctx.newPage(), errs = []; p.on("pageerror", e => errs.push(e.message));
  await p.clock.install({time: new Date(o.at || "2026-10-06T15:00:00-04:00")});
  await p.addInitScript(seed, [TASKS, COURSES]);
  await p.goto("http://127.0.0.1:" + server.address().port + "/index.html");
  await p.waitForFunction(() => window.__sbAvail && document.readyState === "complete", null, {timeout: 20000});
  await p.evaluate(v => { try { localStorage.setItem("coursework:group", "none"); } catch (e) {} window.__sbAvail.view({tab: "board", bview: v, groupBy: "none"}); }, o.bview || "board");
  return {ctx, p, errs};
}
const doneIds = p => p.evaluate(() => JSON.parse(localStorage.getItem("coursework:v2") || "{}").tasks.filter(t => t.status === "done").map(t => t.id));
(async () => {
  await new Promise(r => server.listen(0, "127.0.0.1", r));
  const browser = await chromium.launch({executablePath});
  // B1: a double click on the complete circle completes one task, at desktop and phone sizes
  for (const o of [{vp: {width: 1280, height: 900}, name: "desktop"}, {vp: {width: 390, height: 844}, name: "phone", touch: false}]) {
    const {ctx, p, errs} = await open(browser, o);
    await p.waitForSelector('.col[data-status="todo"] .card-check', {timeout: 10000});
    // the board can redraw once just after loading; measure the checkbox once it's settled
    let b = null; for (let i = 0; i < 20 && !b; i++) { await p.waitForTimeout(100); b = await p.locator('.col[data-status="todo"] .card-check').first().boundingBox().catch(() => null); }
    await p.mouse.dblclick(b.x + b.width / 2, b.y + b.height / 2);
    await p.waitForTimeout(1500);
    let d = await doneIds(p);
    ok(d.length === 1 && d[0] === "t1", `${o.name}: a double click completes only the first task: ${d.join(",")}`);
    // a later, deliberate click in the same spot still works
    const b2 = await p.locator('.col[data-status="todo"] .card-check').first().boundingBox();
    await p.mouse.click(b2.x + b2.width / 2, b2.y + b2.height / 2);
    await p.waitForTimeout(1000);
    d = await doneIds(p);
    ok(d.length === 2, `${o.name}: a click after a pause completes the next one: ${d.join(",")}`);
    ok(!errs.length, o.name + ": no page errors: " + errs.join(" | "));
    await ctx.close();
  }
  // B2: a quick-add draft waiting for review is kept when another one is typed
  {
    const {ctx, p, errs} = await open(browser, {vp: {width: 1280, height: 900}});
    await p.fill("#qaIn", "quiz tomorrow"); await p.press("#qaIn", "Enter");
    await p.waitForSelector(".qa-preview .qa-item", {timeout: 10000});
    await p.fill("#qaIn", "bio essay due fri 5pm"); await p.press("#qaIn", "Enter");
    await p.waitForFunction(() => document.querySelectorAll(".qa-preview .qa-item").length === 2, null, {timeout: 10000}).catch(() => {});
    const titles = await p.$$eval(".qa-preview .qa-item input[data-qa=title]", a => a.map(x => x.value));
    ok(titles.length === 2 && /quiz/i.test(titles[0]) && /essay/i.test(titles[1]), "both drafts wait for review: " + titles.join(" | "));
    // an ambiguous time shows the check with a hint
    await p.click('[data-act="qa-cancel"]');
    await p.fill("#qaIn", "lab report fri 11:59"); await p.press("#qaIn", "Enter");
    await p.waitForSelector(".qa-preview .qa-item", {timeout: 5000});
    ok(await p.locator(".qa-ampm").count() === 1 && await p.inputValue(".qa-item input[data-qa=time]") === "23:59", "11:59 with no AM or PM is checked first, as 11:59 PM");
    ok(!errs.length, "quick add: no page errors: " + errs.join(" | "));
    await ctx.close();
  }
  // T5: an archived course's task shows in the No Course lane
  {
    const {ctx, p} = await open(browser, {vp: {width: 1280, height: 900}});
    const rs = await p.evaluate(() => { const pl = window.__sbPlan(), r = pl.ranked.concat(pl.laterRows || []).find(x => x.id === "t5"); return r ? r.reasons : []; });
    ok(rs.some(r => /^About 3% of your grade/.test(r)) && !rs.some(r => /^3% of your grade/.test(r)), "B4: an estimated weight says About: " + rs.join(" | "));
    await p.evaluate(() => window.__sbAvail.view({tab: "board", bview: "board", groupBy: "course"}));
    const lanes = await p.$$eval(".lane", ls => ls.map(l => l.querySelector(".lane-head").textContent + ": " + Array.from(l.querySelectorAll(".card-title")).map(c => c.textContent.trim()).join(",")));
    ok(lanes.some(l => /^No Course/.test(l) && /Carried Over Essay/.test(l)), "the archived course's task is in No Course: " + lanes.join(" | "));
    await ctx.close();
  }
  // T4, T9: the event form offers every 1-4 weeks and refuses a repeat that ends before it starts
  {
    const {ctx, p, errs} = await open(browser, {vp: {width: 1280, height: 900}});
    await p.evaluate(() => { const b = document.createElement("button"); b.dataset.act = "sch-add"; b.id = "tAdd"; document.body.appendChild(b); b.click(); });
    await p.waitForSelector("dialog[open] select[name=rep]");
    const opts = await p.$$eval("dialog[open] select[name=rep] option", o => o.map(x => x.value + ":" + x.textContent));
    ok(opts.join("|") === ":Doesn't repeat|1:Every week|2:Every 2 weeks|3:Every 3 weeks|4:Every 4 weeks", "Repeats offers 1-4 weeks: " + opts.join("|"));
    await p.fill("dialog[open] input[name=title]", "Club");
    await p.fill("dialog[open] input[name=date]", "2026-10-08"); await p.selectOption("dialog[open] select[name=rep]", "3");
    await p.fill("dialog[open] input[name=until]", "2026-10-01");
    await p.click("dialog[open] [data-submit]"); await p.waitForTimeout(300);
    const evs = await p.evaluate(() => JSON.parse(localStorage.getItem("coursework:v2")).events.length);
    ok(evs === 0 && await p.locator("dialog[open] select[name=rep]").count() === 1, "a repeat ending before its date is not saved");
    await p.fill("dialog[open] input[name=until]", ""); await p.click("dialog[open] [data-submit]"); await p.waitForTimeout(400);
    const ev = await p.evaluate(() => JSON.parse(localStorage.getItem("coursework:v2")).events[0]);
    ok(ev && ev.repeat && ev.repeat.every === 3, "every 3 weeks is saved: " + JSON.stringify(ev && ev.repeat));
    ok(!errs.length, "event form: no page errors: " + errs.join(" | "));
    await ctx.close();
  }
  // T8: the plan and badges move to the new day at midnight
  {
    const {ctx, p} = await open(browser, {vp: {width: 1280, height: 900}, at: "2026-10-07T23:58:00-04:00"});
    const before = await p.locator('.card:has-text("First Task") .soon').textContent().catch(() => "");
    await p.clock.runFor(4 * 60 * 1000);
    await p.waitForTimeout(300);
    const after = await p.locator('.card:has-text("First Task") .soon').textContent().catch(() => "");
    ok(/tomorrow/i.test(before) && /today/i.test(after), `the badge rolls over at midnight: "${before}" -> "${after}"`);
    await ctx.close();
  }
  // B6: before the day starts, the timeline says so
  {
    const {ctx, p} = await open(browser, {vp: {width: 390, height: 844}, at: "2026-10-06T06:25:00-04:00", bview: "plan"});
    const rail = (await p.locator(".dtl").first().textContent().catch(() => "")).replace(/\s+/g, " ");
    ok(/hasn't started yet/.test(rail) && !/Past your end of day/.test(rail) && /starts at 7:00\s?AM/.test(rail), "6:25 AM: " + rail);
    await ctx.close();
  }
  await browser.close(); server.close();
  console.log(`board-fixes: ${checks} checks${process.exitCode ? " (some FAILED)" : " passed"}`);
})().catch(e => { console.error(e); process.exit(1); });
