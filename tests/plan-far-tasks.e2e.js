// node tests/plan-far-tasks.e2e.js
// Today's Plan: work due well after the nearest deadline waits for the nearer work, unless it needs attention long in advance
const path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const FILE = "file://" + path.join(__dirname, "..", "index.html");
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const day = k => { const d = new Date("2026-10-27T12:00:00-07:00"); d.setDate(d.getDate() + k); return d.toISOString().slice(0, 10); };
const T = (id, title, due, hours, extra) => Object.assign({id, title, courseId: "c1", type: "Assignment", start: "", due, time: "", priority: "med", status: "todo", notes: "", hours, checklist: [], history: [], pct: 0, order: 1, created: 1}, extra || {});

async function plan(browser, tasks, dailyHours){
  const ctx = await browser.newContext({viewport: {width: 1300, height: 900}, timezoneId: "America/Vancouver"});
  const p = await ctx.newPage(), errs = []; p.on("pageerror", e => errs.push(e.message));
  await p.clock.install({time: new Date("2026-10-27T10:00:00-07:00")});
  await p.addInitScript(([tasks, dh]) => {
    localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("studioso:tour", "done"); localStorage.setItem("sb:onboarded", "1");
    localStorage.setItem("coursework:v2", JSON.stringify({v: 2, courses: [{id: "c1", name: "Nursing", code: "BSNC 1030", color: "#8B5CF6", meetings: [], links: []}], tasks, files: [], notes: [], decks: [], events: [], settings: {dailyHours: dh, capacity: dh * 7}, updated: 1}));
  }, [tasks, dailyHours]);
  await p.goto(FILE); await p.waitForFunction(() => window.__sbPlan, null, {timeout: 40000}); await p.waitForTimeout(500);
  const r = await p.evaluate(() => window.__sbPlan());
  await ctx.close();
  const by = {}; r.ranked.forEach(x => { by[x.id] = x; });
  return {r, by, errs};
}

(async () => {
  const browser = await chromium.launch({executablePath});
  try {
    // The case from the screenshot: 3h today, a reflection due in 6 days, an assignment in 7, a small portfolio in 17
    { const {r, by, errs} = await plan(browser, [T("sim", "Sim Reflection", day(6), 3), T("a2", "Assignment 2", day(7), 2), T("pf", "Professional Portfolio", day(17), 1.5)], 3);
      ok(!(by.pf.alloc > 0), "a small task due 17 days out gets no time today: " + JSON.stringify(r.ranked.map(x => [x.title, x.alloc])));
      ok(by.sim.alloc + by.a2.alloc >= r.th - 0.01 && by.sim.alloc >= 2, "today's time goes to the work due this week: " + JSON.stringify(r.ranked.map(x => [x.title, x.alloc])));
      ok(!errs.length, "no page errors: " + errs.join(" | ")); }

    // The same portfolio, but a big one: it starts now, and says why
    { const {r, by} = await plan(browser, [T("sim", "Sim Reflection", day(6), 3), T("a2", "Assignment 2", day(7), 2), T("pf", "Professional Portfolio", day(17), 14)], 3);
      ok(by.pf.alloc > 0, "a big task due 17 days out still gets time today: " + JSON.stringify(r.ranked.map(x => [x.title, x.alloc])));
      ok(by.pf.reasons.some(s => /start (now|well ahead)|steady time every day/.test(s)), "and it says why it starts early: " + JSON.stringify(by.pf.reasons)); }

    // When the near work can't all fit, the nearest deadline comes first: nothing goes to a small far task
    { const busy = [1, 3, 5, 7, 9, 11, 13].map((d, i) => T("b" + i, "Lab Report " + (i + 1), day(d), 5));
      const {r, by} = await plan(browser, busy.concat(T("pf", "Professional Portfolio", day(17), 3)), 3);
      ok(!(by.pf.alloc > 0) && by.b0.alloc >= 2, "when work due tomorrow can't fit, the far task waits: " + JSON.stringify(r.ranked.map(x => [x.title, x.alloc]))); }

    // Spare time once the near work is covered still goes to the far task
    { const {r, by} = await plan(browser, [T("sim", "Sim Reflection", day(6), 1), T("pf", "Professional Portfolio", day(17), 2)], 3);
      ok(by.sim.alloc >= 1 - 0.01 && by.pf.alloc >= 2 - 0.01, "with time left over, the far task gets all of it it can use: " + JSON.stringify(r.ranked.map(x => [x.title, x.alloc]))); }

    // Close deadlines still share the day as before
    { const {r, by} = await plan(browser, [T("x", "Essay", day(3), 4), T("y", "Quiz Prep", day(5), 3)], 3);
      ok(by.x.alloc > 0 && by.y.alloc > 0, "work due within a few days of each other still shares the day: " + JSON.stringify(r.ranked.map(x => [x.title, x.alloc]))); }
  } finally { await browser.close(); }
  console.log(`\nplan-far-tasks.e2e: ${n} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
