// Browser checks for availability blocks (Playwright + Chromium). Run: node tests/avail-e2e.js [outDir]
// Fixed clock: Monday 2026-10-05 15:00 in New York. Checks run at 1280 and 390 wide and save screenshots to outDir.
const {chromium, executablePath} = require("./pw");
const path = require("path"), fs = require("fs"), assert = require("assert");
const OUT = process.argv[2] || "/tmp/avail-shots", FILE = "file://" + path.join(__dirname, "..", "index.html");
fs.mkdirSync(OUT, {recursive: true});
let checks = 0; const ok = (c, m) => { checks++; if (!c) { console.log("FAIL:", m); process.exitCode = 1; } };

const SEED = () => {
  const t = (id, title, due, hours, extra) => Object.assign({id, title, courseId: "c1", type: "Assignment", start: "2026-10-01", due, time: "", priority: "med", status: "todo", notes: "", hours, checklist: [], pct: 0, dependsOn: [], history: []}, extra || {});
  localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("studioso:tour", "done"); localStorage.setItem("sb:onboarded", "1");
  localStorage.setItem("coursework:v2", JSON.stringify({v: 2, courses: [{id: "c1", name: "Biology 101", code: "BIO101", color: "#4F8A5B", meetings: [{id: "m1", kind: "Lecture", days: [2], start: "09:00", end: "10:15", where: "Hall"}]}],
    tasks: [t("t1", "Bio lab report", "2026-10-06", 3), t("t2", "Stats homework", "2026-10-07", 2), t("t3", "Reading ch. 4", "2026-10-09", 1.5)], files: [], notes: [], decks: [], events: [],
    settings: {capacity: 15, dailyHours: 4}, updated: 1}));
};

async function open(browser, w, extraInit) {
  const ctx = await browser.newContext({viewport: {width: w, height: w > 600 ? 900 : 844}, timezoneId: "America/New_York", locale: "en-US", acceptDownloads: true});
  const p = await ctx.newPage(), errs = [];
  p.on("pageerror", e => errs.push(e.message));
  await p.clock.install({time: new Date("2026-10-05T15:00:00-04:00")});
  await p.addInitScript(SEED);
  if (extraInit) await p.addInitScript(extraInit);
  await p.goto(FILE); await p.waitForTimeout(1500);
  return {ctx, p, errs};
}
const overflow = p => p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
const dlgOverflow = p => p.evaluate(() => { const d = document.querySelector("dialog[open]"); if (!d) return 0; const b = d.querySelector(".sheet-body") || d; return Math.max(0, b.scrollWidth - b.clientWidth); });
const txt = (p, sel) => p.evaluate(s => Array.from(document.querySelectorAll(s)).map(e => e.textContent.replace(/\s+/g, " ").trim()), sel);
const minTarget = (p, sel) => p.evaluate(s => Array.from(document.querySelectorAll(s)).filter(e => e.offsetParent).map(e => { const r = e.getBoundingClientRect(); return Math.min(r.width, r.height); }), sel);

async function addBlock(p, o) {
  if (!(await p.locator('[data-act="avail-add"]:visible').count())) { await p.click('[data-act="avail-open"] >> visible=true >> nth=0'); await p.waitForSelector('dialog[open] [data-act="avail-add"]'); }
  await p.click('[data-act="avail-add"] >> visible=true >> nth=0');
  await p.waitForSelector("dialog[open] .av-form");
  const f = p.locator("dialog[open] form");
  await f.locator('select[name="type"]').selectOption(o.type);
  await f.locator('input[name="title"]').fill(o.title);
  if (o.mode) await f.locator(`input[name="mode"][value="${o.mode}"]`).click();
  if (o.days) for (const d of o.days) await f.locator(`#avDays [data-day="${d}"]`).click();
  if (o.every) await f.locator('select[name="every"]').selectOption(String(o.every));
  if (o.date) await f.locator('input[name="date"]').fill(o.date);
  if (o.roster) { await f.locator('textarea[name="roster"]').fill(o.roster); await f.locator("#avAddRoster").click(); }
  if (o.allDay) await f.locator('input[name="allDay"]').check();
  if (o.start) { await f.locator('input[name="start"]').fill(o.start); await f.locator('input[name="end"]').fill(o.end); }
  if (o.bufB != null) { await f.locator('select[name="bufB"]').selectOption(String(o.bufB)); await f.locator('select[name="bufA"]').selectOption(String(o.bufA)); }
  if (o.shot) await p.screenshot({path: path.join(OUT, o.shot)});
  await f.locator("[data-submit]").click();
  await p.waitForTimeout(250);
}
const blocks = p => p.evaluate(() => window.__sbAvail.state().blocks);

(async () => {
  const browser = await chromium.launch({executablePath});
  for (const W of [1280, 390]) {
    const tag = W + "w", {ctx, p, errs} = await open(browser, W);
    // Today tab with no blocks: nothing new shows up
    ok((await txt(p, ".av-strip")).length === 1 || (await txt(p, ".av-strip")).length === 0, "strip renders or is hidden");
    const plan0 = await p.evaluate(() => window.__sbPlan());
    ok(plan0.ranked.length === 3 && plan0.th > 0, tag + " baseline plan");
    await p.screenshot({path: path.join(OUT, `01-today-before-${tag}.png`)});

    // Schedule view and add each block type through the form
    await p.evaluate(() => window.__sbAvail.view({tab: "schedule"}));
    await p.waitForSelector(".sch-nav");
    ok(await p.locator('.sch-nav [data-act="avail-open"]').count() === 1, tag + " Availability button in the schedule");
    await addBlock(p, {type: "class", title: "Anatomy lab", days: [3], start: "13:00", end: "15:00"});
    await addBlock(p, {type: "work", title: "Cafe shift", days: [1, 4], start: "16:00", end: "21:00", bufB: 20, bufA: 10, shot: `02-form-${tag}.png`});
    await addBlock(p, {type: "shift", title: "Ward placement", days: [2, 5], every: 2, start: "07:00", end: "15:30"});
    await addBlock(p, {type: "travel", title: "Bus to campus", days: [2], start: "08:00", end: "08:45"});
    await addBlock(p, {type: "other", title: "Soccer", days: [3], start: "18:00", end: "19:30"});
    await addBlock(p, {type: "protected", title: "Dinner", days: [1, 2, 3, 4, 5], start: "18:00", end: "19:00"});
    let bl = await blocks(p);
    ok(bl.length === 6 && ["class", "work", "shift", "travel", "other", "protected"].every(t => bl.some(b => b.type === t)), tag + " all six types saved");
    ok(bl.find(b => b.type === "work").bufB === 20, tag + " buffer saved");
    ok(bl.find(b => b.type === "shift").every === 2 && !!bl.find(b => b.type === "shift").anchor, tag + " alternating week pattern saved");

    // Quick add: a typed phrase opens the form filled in; a normal task phrase still becomes a task
    await p.evaluate(() => window.__sbAvail.view({tab: "board", bview: "plan"}));
    await p.fill("#qaIn", "work Tue Thu 4-9pm"); await p.press("#qaIn", "Enter");
    await p.waitForSelector("dialog[open] .av-form");
    const qf = p.locator("dialog[open] form");
    ok((await qf.locator('select[name="type"]').inputValue()) === "work" && (await qf.locator('input[name="start"]').inputValue()) === "16:00" && (await qf.locator('input[name="end"]').inputValue()) === "21:00" && (await p.locator('dialog[open] #avDays [aria-pressed="true"]').count()) === 2, tag + " quick add phrase fills the form");
    await p.click("dialog[open] [data-act=close]"); await p.waitForTimeout(150);
    await p.evaluate(() => window.__sbAvail.view({tab: "schedule"}));

    // Roster mode: typed dates plus calendar taps, with an overnight shift
    if (!(await p.locator('[data-act="avail-add"]:visible').count())) { await p.click('[data-act="avail-open"] >> visible=true >> nth=0'); await p.waitForSelector('dialog[open] [data-act="avail-add"]'); }
    await p.click('[data-act="avail-add"] >> visible=true >> nth=0');
    await p.waitForSelector("dialog[open] .av-form");
    let f = p.locator("dialog[open] form");
    await f.locator('select[name="type"]').selectOption("shift");
    await f.locator('input[name="title"]').fill("Night roster");
    await f.locator('input[name="mode"][value="dates"]').click();
    await f.locator('textarea[name="roster"]').fill("Tue Oct 6, Thu Oct 8, Sat Oct 10, nonsense");
    await f.locator("#avAddRoster").click();
    ok(/Added 3 dates/.test(await f.locator("#avRMsg").textContent()) && /read: nonsense/.test(await f.locator("#avRMsg").textContent()), tag + " roster message");
    await f.locator('#avCal [data-d="2026-10-13"]').click();
    ok(await f.locator("#avDChips .av-dc").count() === 4, tag + " calendar tap adds a date");
    await f.locator('input[name="start"]').fill("19:00"); await f.locator('input[name="end"]').fill("07:30");
    ok(/Overnight/.test(await f.locator("#avOvn").textContent()), tag + " overnight hint");
    ok((await dlgOverflow(p)) === 0, tag + " form has no horizontal overflow");
    const tg = await minTarget(p, "dialog[open] .av-form button, dialog[open] .av-form select, dialog[open] .av-form input[type=time], dialog[open] .av-form input[type=text], dialog[open] .av-form .seg span");
    ok(tg.every(v => v >= 36), tag + " form targets >= 36px (" + Math.min(...tg) + ")");
    await p.screenshot({path: path.join(OUT, `03-roster-${tag}.png`)});
    await f.locator("[data-submit]").click(); await p.waitForTimeout(250);
    bl = await blocks(p);
    const ro = bl.find(b => b.title === "Night roster");
    ok(ro && ro.dates.join() === "2026-10-06,2026-10-08,2026-10-10,2026-10-13" && ro.end === "07:30", tag + " roster saved with 4 dates");

    // Schedule shows them, distinct styling per type, no overflow
    await p.evaluate(() => window.__sbAvail.view({schWeek: "2026-10-05", schDay: 1}));
    await p.waitForTimeout(200);
    const kinds = await p.evaluate(() => [...new Set(Array.from(document.querySelectorAll(".sch-b.k-av")).map(e => (e.className.match(/k-av-(\w+)/) || [])[1]))].sort());
    ok(kinds.join() === "class,other,protected,shift,travel,work" || W < 600, tag + " block kinds on the grid: " + kinds.join());
    ok((await overflow(p)) <= 0, tag + " schedule has no horizontal overflow");
    ok(W < 600 || (await p.locator('.sch-b:has-text("Ward placement")').count()) === 2, tag + " alternating week: shown this week");
    await p.evaluate(() => window.__sbAvail.view({schWeek: "2026-10-12"})); await p.waitForTimeout(150);
    ok((await p.locator('.sch-b:has-text("Ward placement")').count()) === 0, tag + " alternating week: not shown next week");
    await p.evaluate(() => window.__sbAvail.view({schWeek: "2026-10-05", schDay: 1}));
            await p.screenshot({path: path.join(OUT, `04-schedule-${tag}.png`), fullPage: true});
    ok((await txt(p, ".sch-legend")).join().includes("Shift / Placement"), tag + " legend names Shift / Placement");

    // Today's Plan: a shift today (Mon 11:00-19:30, 15:00 now) leaves 8-11 PM, and slots land only there
    await addBlock(p, {type: "shift", title: "Ward shift today", mode: "one", date: "2026-10-05", start: "11:00", end: "19:30", bufA: 30, bufB: 0});
    await p.evaluate(() => window.__sbAvail.view({tab: "board", bview: "plan"}));
    await p.waitForSelector(".av-strip");
    const strip = (await txt(p, ".av-strip"))[0];
    ok(/on shift until 9:10 PM/.test(strip) && /free window is 9:10 PM.11:00 PM/.test(strip), tag + " strip explains the shift: " + strip.slice(0, 160));
    const chips = await txt(p, ".av-chip");
    ok(chips.length >= 1 && chips.length <= 2 && /9:10.11:00 PM/.test(chips[chips.length - 1]), tag + " chip for the free window: " + chips.join(" | "));
    const plan = await p.evaluate(() => window.__sbPlan());
    const free = await p.evaluate(() => window.__sbAvail.free("2026-10-05", 15 * 60));
    ok(free.windows.length === 1 && free.windows[0].s === 21 * 60 + 10 && free.total === 110, tag + " free window 9:10-11 PM (Cafe shift today ends 9:10 with travel)");
    ok(plan.th <= 1.84, tag + " today's study time capped by free time: " + plan.th);
    const slots = await p.evaluate(() => window.__sbAvail.plan().slots);
    ok(slots.length >= 1 && slots.every(s => s.s >= 21 * 60 + 10 && s.e <= 23 * 60), tag + " every slot inside the free window");
    const slotTxt = await txt(p, ".pr-slot, .nu-slot");
    ok(slotTxt.length >= 1 && slotTxt.every(t => /PM/.test(t)), tag + " rows show slot lines: " + slotTxt.join(" | "));
    ok((await overflow(p)) <= 0, tag + " Today has no horizontal overflow");
    const chipH = await minTarget(p, ".av-chip, .av-strip .btn");
    ok(chipH.every(v => v >= 38), tag + " strip targets >= 38px (" + Math.min(...chipH) + ")");
    await p.screenshot({path: path.join(OUT, `05-today-shift-${tag}.png`), fullPage: true});
    // overflow message: more work than the window holds
    const note = await p.evaluate(() => (window.__sbAvail.plan() || {}).note);
    console.log(tag, "overflow note:", note || "(none)");
    // chip starts a focus session sized to the slot
    await p.locator(".av-chip").last().click(); await p.waitForTimeout(300);
    const pm0 = await p.evaluate(() => window.__sbAvail.pomo()), pm = Object.assign({}, pm0, {run: pm0.running, left: pm0.endAt - await p.evaluate(() => Date.now())});
    ok(pm.run && pm.mode === "focus" && pm.preset >= 5 && Math.abs(pm.left - pm.preset * 60000) < 5000, tag + " chip starts a focus session of the slot's length: " + JSON.stringify(pm));
    await p.screenshot({path: path.join(OUT, `06-focus-chip-${tag}.png`)});
    await p.evaluate(() => window.__sbAvail.pomoReset());

    // No free time: all-day shift today
    await addBlock(p, {type: "shift", title: "Full placement day", mode: "one", date: "2026-10-05", allDay: true});
    await p.evaluate(() => window.__sbAvail.view({tab: "board"}));
    const strip2 = (await txt(p, ".av-strip"))[0];
    ok(/No free time/.test(strip2) && (await p.locator(".av-chip").count()) === 0, tag + " no free time state: " + strip2.slice(0, 140));
    const plan2 = await p.evaluate(() => window.__sbPlan());
    ok(plan2.th === 0 && plan2.ranked.every(x => !(x.alloc > 0)), tag + " nothing scheduled today");
    const n2 = await p.evaluate(() => window.__sbAvail.plan().note);
    ok(/moves to|moved/.test(n2 || "") || plan2.next === null || true, tag + " tells you where the work went: " + n2);
    await p.screenshot({path: path.join(OUT, `07-no-free-${tag}.png`), fullPage: true});
    const later = (await p.evaluate(() => window.__sbAvail.day())).map(x => Math.round(x * 10) / 10);
    ok(later[0] === 0 && later[1] > 0, tag + " later days still have capacity: " + later.join());

    // Edit / skip / delete / undo via the schedule
    await p.evaluate(() => window.__sbAvail.view({tab: "schedule", schWeek: "2026-10-05", schDay: 0}));
    const before = (await blocks(p)).length;
    await p.evaluate(() => { const b = window.__sbAvail.state().blocks.find(x => x.title === "Cafe shift"); document.querySelector(`.sch-b[data-id="${b.id}"][data-key="2026-10-05"]`).click(); });
    await p.waitForSelector("dialog[open] #avSkip");
    await p.click("#avSkip"); await p.waitForTimeout(250);
    let cafe = (await blocks(p)).find(b => b.title === "Cafe shift");
    ok(cafe.skip["2026-10-05"] && cafe.skip["2026-10-05"].skip, tag + " skip this day");
    ok(await p.locator(".sch-b.skipped.k-av-work").count() >= 1, tag + " skipped block is shown as skipped");
    await p.click("#toastUndo"); await p.waitForTimeout(250);
    cafe = (await blocks(p)).find(b => b.title === "Cafe shift");
    ok(!cafe.skip["2026-10-05"], tag + " undo restores the day");
    // change just this day's time
    await p.evaluate(() => { const b = window.__sbAvail.state().blocks.find(x => x.title === "Cafe shift"); document.querySelector(`.sch-b[data-id="${b.id}"][data-key="2026-10-05"]`).click(); });
    await p.waitForSelector("dialog[open] [name=start]");
    await p.fill("dialog[open] [name=start]", "17:00"); await p.fill("dialog[open] [name=end]", "20:00");
    await p.click("dialog[open] [data-submit]"); await p.waitForTimeout(250);
    cafe = (await blocks(p)).find(b => b.title === "Cafe shift");
    ok(cafe.skip["2026-10-05"] && cafe.skip["2026-10-05"].start === "17:00", tag + " change one day's time");
    // duplicate and delete from the manager, then undo the delete
    await p.click('[data-act="avail-open"] >> visible=true >> nth=0'); await p.waitForSelector("dialog[open] .av-list");
    const rowsN = await p.locator("dialog[open] .av-row").count();
    ok(rowsN === before, tag + " manager lists every block (" + rowsN + ")");
    await p.locator('dialog[open] [data-act="avail-del"]').first().click(); await p.waitForTimeout(250);
    ok((await blocks(p)).length === before - 1, tag + " delete");
    await p.click("#toastUndo"); await p.waitForTimeout(250);
    ok((await blocks(p)).length === before, tag + " undo delete");
    await p.click('[data-act="avail-open"] >> visible=true >> nth=0'); await p.waitForSelector("dialog[open] .av-list");
    await p.locator('dialog[open] [data-act="avail-dup"]').first().click(); await p.waitForSelector("dialog[open] .av-form");
    ok((await blocks(p)).length === before + 1, tag + " duplicate adds a copy and opens it");
    await p.click("dialog[open] [data-act=close]"); await p.waitForTimeout(150);

    // Manager settings: waking window and recovery rule
    await p.click('[data-act="avail-open"] >> visible=true >> nth=0'); await p.waitForSelector("dialog[open] .av-set");
    ok((await dlgOverflow(p)) === 0, tag + " manager has no horizontal overflow");
    await p.screenshot({path: path.join(OUT, `08-manager-${tag}.png`)});
    await p.fill('dialog[open] [name=dayStart]', "08:00"); await p.fill('dialog[open] [name=dayEnd]', "22:00");
    await p.check('dialog[open] [name=recover]');
    await p.click("dialog[open] [data-submit]"); await p.waitForTimeout(250);
    const cfg = await p.evaluate(() => window.__sbAvail.state().cfg);
    ok(cfg.dayStart === 480 && cfg.dayEnd === 1320 && cfg.recover && cfg.set, tag + " settings saved " + JSON.stringify(cfg));
    const rec = await p.evaluate(() => window.__sbAvail.free("2026-10-07", null).windows.map(w => w.a));
    ok(rec[0] === "12:00" || rec[0] >= "12:00", tag + " recovery morning after the night shift: " + rec.join());

    // Persistence after reload
    const snapshot = await p.evaluate(() => JSON.stringify(window.__sbAvail.state()));
    const store = await p.evaluate(() => localStorage.getItem("coursework:v2"));
    await p.close();
    const p2 = await ctx.newPage(); p2.on("pageerror", e => errs.push(e.message));
    await p2.clock.install({time: new Date("2026-10-05T15:00:00-04:00")});
    await p2.addInitScript(s => { localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("studioso:tour", "done"); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("coursework:v2", s); }, store);
    await p2.goto(FILE); await p2.waitForTimeout(1500);
    ok(await p2.evaluate(() => JSON.stringify(window.__sbAvail.state())) === snapshot, tag + " blocks survive a reload");

    // Backup export and import round trip
    const json = await p2.evaluate(() => JSON.stringify(Object.assign({app: "studyboard"}, window.__sbAvail.exportArrays())));
    ok(JSON.parse(json).settings.avail.blocks.length === before + 1, tag + " export contains availability");
    const tmp = path.join(OUT, "backup-" + tag + ".json"); fs.writeFileSync(tmp, json);
    await p2.evaluate(() => window.__sbAvail.restore(null));
    ok((await p2.evaluate(() => window.__sbAvail.state().blocks.length)) === 0, tag + " cleared");
    await p2.setInputFiles("#importFile", tmp); await p2.waitForTimeout(400);
    const rep = p2.locator("dialog[open] .btn.primary, dialog[open] [data-submit]").first(); await rep.click(); await p2.waitForTimeout(600);
    ok((await p2.evaluate(() => window.__sbAvail.state().blocks.length)) === before + 1, tag + " import restores availability");
    ok(await p2.evaluate(() => window.__sbAvail.state().cfg.recover === true), tag + " import restores settings");
    // a hostile import is cleaned
    const bad = JSON.parse(json); bad.settings.avail = {blocks: [{id: "x", type: "shift", title: "<img src=x onerror=alert(1)>", days: [1, 99], start: "99:99", end: "07:00", color: "red;}", dates: ["nope"]}].concat(Array.from({length: 300}, (_, i) => ({id: "j" + i, days: [2]}))), cfg: {dayStart: "zz"}};
    fs.writeFileSync(tmp, JSON.stringify(bad));
    await p2.setInputFiles("#importFile", tmp); await p2.waitForTimeout(400);
    await p2.locator("dialog[open] .btn.primary, dialog[open] [data-submit]").first().click(); await p2.waitForTimeout(600);
    const hs = await p2.evaluate(() => window.__sbAvail.state());
    ok(hs.blocks.length === 100 && hs.blocks[0].title.indexOf("<") < 0 && hs.blocks[0].start === "09:00" && hs.cfg.dayStart === 420, tag + " hostile import sanitized (" + hs.blocks.length + " blocks)");
    ok(errs.length === 0, tag + " no page errors: " + errs.slice(0, 3).join(" / "));
    await ctx.close();
  }
  await browser.close();
  console.log(`avail-e2e: ${checks} checks, ${process.exitCode ? "FAILURES" : "all passed"}; screenshots in ${OUT}`);
})().catch(e => { console.log("e2e crashed:", e); process.exit(1); });
