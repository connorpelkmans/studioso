// node tests/late-day.e2e.js
// A study day that ends after midnight; Today's timeline and Do This Next agree on today's time; past the end of day, nothing is put in it
const path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const FILE = "file://" + path.join(__dirname, "..", "index.html");
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };

const SEED = cfg => {
  const t = (id, title, due, hours) => ({id, title, courseId: "c1", type: "Assignment", start: "", due, time: "", priority: "med", status: "todo", notes: "", hours, checklist: [], history: [], pct: 0, order: 1, created: 1});
  localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("studioso:tour", "done"); localStorage.setItem("sb:onboarded", "1");
  localStorage.setItem("coursework:v2", JSON.stringify({v: 2, courses: [{id: "c1", name: "Practice of Nursing 1", code: "BSNC 1030", color: "#8B5CF6", meetings: [], links: []}],
    tasks: [t("t1", "Sim (CH1) Reflection", "2026-11-02", 3)], files: [], notes: [], decks: [], events: [],
    settings: Object.assign({capacity: 15, dailyHours: 7}, cfg ? {avail: {v: 1, blocks: [], cfg}} : {}), updated: 1}));
};
async function at(browser, when, cfg) {
  const ctx = await browser.newContext({viewport: {width: 1300, height: 900}, timezoneId: "America/Vancouver", locale: "en-US"});
  const p = await ctx.newPage(), errs = []; p.on("pageerror", e => errs.push(e.message));
  await p.clock.install({time: new Date(when)});
  await p.addInitScript(SEED, cfg);
  await p.goto(FILE); await p.waitForFunction(() => window.__sbAvail && window.__sbPlan, null, {timeout: 40000}); await p.waitForTimeout(800);
  p.errs = errs; return p;
}
const LATE = {dayStart: "07:00", dayEnd: "01:00", minChunk: 25, maxSession: 90, breakMin: 10, defBuf: 0, recover: false, set: true};

(async () => {
  const browser = await chromium.launch({executablePath});
  try {
    // 11:35 PM, the day ends at 1 AM
    { const p = await at(browser, "2026-10-26T23:35:00-07:00", LATE);
      const d = await p.evaluate(() => window.__sbAvail.studyDay());
      ok(d.end === 1500 && !d.past && d.left === 85, "a 1:00 AM end is after midnight: 85 minutes left at 11:35 PM: " + JSON.stringify(d));
      const plan = await p.evaluate(() => window.__sbPlan());
      ok(plan.th <= 85 / 60 + 0.01, "today's plan fits in what's left: " + plan.th);
      const rail = (await p.locator(".dtl").first().textContent().catch(() => "")).replace(/\s+/g, " "), alloc = (await p.locator(".nu-alloc").first().textContent().catch(() => "")).replace(/\s+/g, " ").trim();
      const len = (rail.match(/Sim \(CH1\) Reflection\s*([\dhm ]+)/) || [])[1] || "";
      ok(alloc && rail.includes(alloc.replace(/ today$/, "")), `the timeline card and Do This Next agree on today's time: card "${rail.slice(0, 120)}", Do This Next "${alloc}"`);
      ok(/1:00\s?AM/.test(rail) || /12:\d\d/.test(rail), "the timeline runs past midnight to 1:00 AM: " + rail.slice(0, 160));
      void len; ok(!p.errs.length, "no page errors: " + p.errs.join(" | "));
      await p.context().close(); }
    // 12:30 AM: still the evening's day
    { const p = await at(browser, "2026-10-27T00:30:00-07:00", LATE);
      const d = await p.evaluate(() => window.__sbAvail.studyDay());
      ok(d.tail && !d.past && d.left === 30, "at 12:30 AM it's still the evening's study day, 30 minutes left: " + JSON.stringify(d));
      ok(!/Past your end of day/.test(await p.locator(".dtl").first().textContent().catch(() => "")), "and the timeline isn't over yet");
      await p.context().close(); }
    // 1:30 AM: past the end of the day
    { const p = await at(browser, "2026-10-27T01:30:00-07:00", LATE);
      const rail = (await p.locator(".dtl").first().textContent().catch(() => "")).replace(/\s+/g, " ");
      ok(/Past your end of day/.test(rail) && /starts at 7:00\s?AM/.test(rail) && !/Reflection/.test(rail), "past the end of day the timeline says so, with no tasks in it: " + rail);
      await p.context().close(); }
    // The same day ending at 11 PM: at 11:35 PM it's over
    { const p = await at(browser, "2026-10-26T23:35:00-07:00", Object.assign({}, LATE, {dayEnd: "23:00"}));
      const rail = (await p.locator(".dtl").first().textContent().catch(() => "")).replace(/\s+/g, " ");
      ok(/Past your end of day/.test(rail) && /ended at 11:00\s?PM/.test(rail), "a day that ended at 11:00 PM: past it at 11:35 PM: " + rail);
      await p.context().close(); }
    // Never saved Study Time: the planner uses the times the form shows (7:00 AM to 11:00 PM), not a hidden 1 AM
    for (const when of ["2026-10-26T23:35:00-07:00", "2026-10-27T00:41:00-07:00"]) {
      const p = await at(browser, when, null);
      const d = await p.evaluate(() => window.__sbAvail.studyDay()), rail = (await p.locator(".dtl").first().textContent().catch(() => "")).replace(/\s+/g, " ");
      const gap = (await p.evaluate(() => window.__sbPlan().gapWhy || [])).join(" ");
      ok(d.end === 1380 && d.past && /Past your end of day/.test(rail) && !/1:00 AM/.test(gap + rail), `unsaved times at ${when.slice(11, 16)}: the day ended at 11:00 PM, as the form shows: ` + JSON.stringify({d, rail, gap}));
      await p.context().close();
    }
    // The Availability form takes an end after midnight, and refuses one that reaches the next day's start
    { const p = await at(browser, "2026-10-26T15:00:00-07:00", null);
      const save = async (ds, de) => p.evaluate(async ([ds, de]) => {
        const b = document.createElement("button"); b.dataset.act = "avail-open"; document.body.appendChild(b); b.click(); b.remove(); await new Promise(r => setTimeout(r, 400));
        const f = document.querySelector("dialog[open] form.av-form"); if (!f) return "no form";
        f.querySelector('[name="dayStart"]').value = ds; f.querySelector('[name="dayEnd"]').value = de;
        f.querySelector("[data-submit]").click(); await new Promise(r => setTimeout(r, 300));
        const t = document.querySelector("#toast, .toast"); const msg = t ? t.textContent : "";
        const d = document.querySelector("#dlg"); if (d && d.open) d.close();
        return msg + " | " + JSON.stringify(window.__sbAvail.state().cfg);
      }, [ds, de]);
      const r1 = await save("07:00", "01:00");
      ok(/"dayEnd":1500/.test(r1) && !/at least 2 hours/.test(r1), "a 1:00 AM end is saved as after midnight: " + r1);
      const r2 = await save("07:00", "07:00");
      ok(/aren't the same time/.test(r2) && /"dayEnd":1500/.test(r2), "an end at the day's start is refused: " + r2);
      await p.context().close(); }
  } finally { await browser.close(); }
  console.log(`\nlate-day.e2e: ${n} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
