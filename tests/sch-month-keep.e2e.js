// node tests/sch-month-keep.e2e.js
// Schedule's Month view stays chosen until the student switches back: across other pages, a reload, and a See Week look at one
// week from the month. Phone (Options > Month View / Week View) and desktop (Week / Month switch).
const path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const SEED = {v: 2, updated: 1, tasks: [], notes: [], files: [], decks: [], events: [], settings: {}, courses: [{id: "c1", name: "Bio", code: "BIO", color: "#36c", meetings: [{kind: "Lecture", days: [1, 3], start: "10:00", end: "11:00"}]}]};
(async () => {
  const browser = await chromium.launch({executablePath}), errs = [];
  try {
    for (const phone of [true, false]) {
      const W = phone ? "phone" : "desktop";
      const ctx = await browser.newContext(phone ? {viewport: {width: 402, height: 874}, isMobile: true, hasTouch: true} : {viewport: {width: 1280, height: 860}});
      await ctx.addInitScript(seed => { window.__SB_TEST = true; try { if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:tour", "done"); localStorage.setItem("coursework:v2", JSON.stringify(seed)); } } catch (e) {} }, SEED);
      const page = await ctx.newPage(); page.on("pageerror", e => errs.push(e.message));
      const ready = () => page.waitForFunction(() => window.__sbSync && window.__sbSync.ui && document.querySelector("#view"), null, {timeout: 15000}).then(() => page.waitForTimeout(600));
      const go = async t => { await page.evaluate(t => { const S = window.__sbSync; S.ui.tab = t; S.render(); }, t); await page.waitForTimeout(250); };
      const month = () => page.evaluate(() => !!document.querySelector(".sch-month"));
      const pick = async want => { if (phone) await page.evaluate(() => { document.querySelector(".ph-more").open = true; }); await page.click(`[data-act="sch-mode"][data-id="${want}"]`); await page.waitForTimeout(250); };
      await page.goto("file://" + path.join(__dirname, "..", "index.html")); await ready();
      await go("schedule");
      ok(!(await month()), `${W}: the Schedule starts on the week`);
      await pick("month");
      ok(await month(), `${W}: Month view is chosen`);
      await go("board"); await go("schedule");
      ok(await month(), `${W}: still Month after visiting another page`);
      await page.reload(); await ready(); await go("schedule");
      ok(await month(), `${W}: still Month after reopening the app`);
      await page.click(".smc-week"); await page.waitForTimeout(250);
      ok(!(await month()), `${W}: See Week shows that week`);
      await go("notes"); await go("schedule");
      ok(await month(), `${W}: coming back after See Week, it's Month again (See Week was just a look)`);
      await page.reload(); await ready(); await go("schedule");
      ok(await month(), `${W}: and still Month after reopening`);
      await pick("week");
      await go("board"); await go("schedule");
      ok(!(await month()), `${W}: switching back to Week keeps Week`);
      await page.reload(); await ready(); await go("schedule");
      ok(!(await month()), `${W}: Week after reopening too`);
      await ctx.close();
    }
    // one of every kind this month: classes (lecture, lab, discussion, office hours) and events (exam, meeting, shift, appointment, other)
    const d0 = new Date(), day = k => { const x = new Date(d0.getFullYear(), d0.getMonth(), 1 + k); return x.getFullYear() + "-" + String(x.getMonth() + 1).padStart(2, "0") + "-" + String(x.getDate()).padStart(2, "0"); };
    const ALL = Object.assign({}, SEED, {courses: [{id: "c1", name: "Bio", code: "BIO", color: "#36c", meetings: [{kind: "Lecture", days: [1], start: "10:00", end: "11:00"}, {kind: "Lab", days: [2], start: "10:00", end: "11:00"}, {kind: "Discussion", days: [3], start: "10:00", end: "11:00"}, {kind: "Office Hours", days: [4], start: "10:00", end: "11:00"}]}],
      events: ["Midterm", "Study group", "Work shift", "Dentist", "Career fair"].map((t, i) => ({id: "e" + i, title: t, date: day(i + 1), start: "15:00", end: "16:00"}))});
    // every kind's icon drawing is centred in its 24 x 24 box, and the icon in the middle of its dot
    {
      const ctx = await browser.newContext({viewport: {width: 402, height: 874}, isMobile: true, hasTouch: true});
      await ctx.addInitScript(seed => { window.__SB_TEST = true; try { localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:tour", "done"); localStorage.setItem("studyboard:schmode", "month"); localStorage.setItem("coursework:v2", JSON.stringify(seed)); } catch (e) {} }, ALL);
      const page = await ctx.newPage(); page.on("pageerror", e => errs.push(e.message));
      await page.goto("file://" + path.join(__dirname, "..", "index.html")); await page.waitForFunction(() => window.__sbSync && window.__sbSync.ui, null, {timeout: 15000}); await page.waitForTimeout(600);
      await page.evaluate(() => { const S = window.__sbSync; S.ui.tab = "schedule"; S.render(); }); await page.waitForTimeout(300);
      const kinds = await page.evaluate(() => {
        const out = [], legend = [...document.querySelectorAll(".smc-legend i svg")];
        // the legend lists only kinds in the month; draw every kind from a picked day's rows and the legend's icons
        legend.forEach(s => { const g = [...s.children].reduce((a, c) => { const r = c.getBBox(), m = c.transform && c.transform.baseVal.consolidate(), dx = m ? m.matrix.e : 0, dy = m ? m.matrix.f : 0;
          return {x0: Math.min(a.x0, r.x + dx), y0: Math.min(a.y0, r.y + dy), x1: Math.max(a.x1, r.x + r.width + dx), y1: Math.max(a.y1, r.y + r.height + dy)}; }, {x0: 99, y0: 99, x1: -99, y1: -99});
          out.push({name: s.parentNode.parentNode.textContent.trim(), cx: (g.x0 + g.x1) / 2, cy: (g.y0 + g.y1) / 2}); });
        const i = document.querySelector(".sch-month .dots i.ci"), sv = i.querySelector("svg"), a = i.getBoundingClientRect(), c = sv.getBoundingClientRect();
        return {out, dx: c.left + c.width / 2 - (a.left + a.width / 2), dy: c.top + c.height / 2 - (a.top + a.height / 2), gap: (a.width - c.width) / 2};
      });
      ok(kinds.out.length === 9 && kinds.out.every(k => Math.abs(k.cx - 12) < 0.01 && Math.abs(k.cy - 12) < 0.01), "each icon's drawing is centred: " + kinds.out.map(k => `${k.name} ${k.cx.toFixed(2)},${k.cy.toFixed(2)}`).join("; "));
      ok(Math.abs(kinds.dx) < 0.01 && Math.abs(kinds.dy) < 0.01 && Number.isInteger(kinds.gap), `the icon sits in the middle of its dot, a whole ${kinds.gap}px from each edge`);
      await ctx.close();
    }
    ok(!errs.length, "no page errors" + (errs.length ? ": " + errs.join(" | ") : ""));
    console.log("sch-month-keep.e2e: " + n + " checks passed");
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
