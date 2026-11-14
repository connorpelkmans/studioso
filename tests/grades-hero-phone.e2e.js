// node tests/grades-hero-phone.e2e.js
// Grades' summary on a phone is slim: a small cap beside the average and a one-line summary, three compact tiles with short labels,
// GPA tiles with the number and its scale only, and the credits note beside its button. Computers keep the full wording.
const path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const day = k => { const d = new Date(); d.setDate(d.getDate() + k); return d.toISOString().slice(0, 10); };
const T = (id, title, course, type, w, mark, due) => ({id, title, courseId: course, type, due: due || day(-20 + Number(id)), start: day(-30), status: mark != null ? "done" : "todo", priority: "med", weight: w, created: 1000 + Number(id), mark: mark != null ? {got: mark, outOf: 100} : undefined});
const SEED = {v: 2, updated: 1, settings: {}, notes: [], files: [], events: [], decks: [], courses: [
  {id: "c1", name: "Organic Chemistry", code: "OCHEM", color: "#8E3FA0"}, {id: "c2", name: "Nursing", code: "BSNC 1030", color: "#C0563A"}, {id: "c3", name: "Biology", code: "BIOL 260", color: "#1E9E74"}],
  tasks: [T("1", "Quiz 1", "c1", "Quiz", 10, 92), T("2", "Midterm", "c1", "Exam", 30, 90), T("3", "Final", "c1", "Exam", 40, null, day(30)),
    T("4", "Essay", "c2", "Assignment", 30, 95), T("5", "Exam", "c2", "Exam", 40, null, day(20)), T("6", "Lab", "c3", "Lab", 20, 88), T("7", "Final", "c3", "Exam", 50, null, day(25)),
    Object.assign(T("8", "Lab 2", "c3", "Lab", 10, null), {status: "done"})]};
(async () => {
  const browser = await chromium.launch({executablePath}), errs = [];
  try {
    for (const [label, opts] of [["phone", {viewport: {width: 402, height: 874}, isMobile: true, hasTouch: true}], ["computer", {viewport: {width: 1280, height: 900}}]]) {
      const ctx = await browser.newContext(opts);
      await ctx.addInitScript(seed => { try { if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:tour", "done"); localStorage.setItem("coursework:v2", JSON.stringify(seed)); } } catch (e) {} }, SEED);
      const page = await ctx.newPage(); page.on("pageerror", e => errs.push(e.message));
      await page.goto("file://" + path.join(__dirname, "..", "index.html")); await page.waitForTimeout(1500);
      await page.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
      await page.evaluate(() => { const b = document.querySelector('nav.tabs [data-tab="courses"]'); b && b.click(); }); await page.waitForTimeout(300);
      await page.evaluate(() => { const b = document.querySelector('[data-act="cf-view"][data-id="grades"]'); b && b.click(); }); await page.waitForTimeout(600);
      const g = await page.evaluate(() => { const band = document.querySelector("#view .gp-hero-band"), gpa = document.querySelector("#view .gp-gpa"), foot = gpa.querySelector(".gp-gpa-foot");
        const seen = el => el.innerText.replace(/\s+/g, " ").trim();
        return {band: band.getBoundingClientRect().height, gpa: gpa.getBoundingClientRect().height, tiles: [...band.querySelectorAll(".gp-tile")].map(seen), sub: seen(band.querySelector(".gp-hero-sub")),
          gpaTiles: [...gpa.querySelectorAll(".gp-g")].map(seen), btnTop: foot.querySelector(".btn").getBoundingClientRect().top, noteTop: foot.querySelector(".mini").getBoundingClientRect().top,
          tileTops: [...band.querySelectorAll(".gp-tile")].map(t => Math.round(t.getBoundingClientRect().top)), avg: seen(band.querySelector(".gp-avg"))}; });
      if (label === "phone") {
        ok(g.band <= 170 && g.gpa <= 140, `phone: the summary is slim (band ${Math.round(g.band)}px, GPA strip ${Math.round(g.gpa)}px; were about 230 and 220)`);
        ok(/^\d+(\.\d)?%$/.test(g.avg) && g.sub === "3 courses · all on track", "phone: the average and a one-line summary: " + g.sub);
        ok(g.tiles.join("|") === "0 Need attention|1 Awaiting mark|3 Still to come" && new Set(g.tileTops).size === 1, "phone: three tiles on one row with short labels: " + g.tiles.join(" | "));
        ok(g.gpaTiles.every(t => /^(Term GPA|Projected Term GPA) \d\.\d\d \/ 4\.0$/.test(t)), "phone: GPA tiles show the number and its scale: " + g.gpaTiles.join(" | "));
        ok(Math.abs(g.btnTop - g.noteTop) < 30, "phone: Add Credits sits beside the credits note");
      } else {
        ok(g.tiles.join("|") === "0 Need attention|1 Waiting for a mark|3 Marks still to come" && g.sub === "3 courses with marks · all on track to pass", "computer: the full wording stays: " + g.tiles.join(" | ") + " / " + g.sub);
        ok(g.gpaTiles.some(t => /out of 4\.0, from your grades now/.test(t)) && !g.gpaTiles.some(t => /\/ 4\.0/.test(t)), "computer: GPA tiles keep their explanation line");
      }
      await ctx.close();
    }
    ok(!errs.length, "no page errors" + (errs.length ? ": " + errs.join(" | ") : ""));
    console.log("grades-hero-phone.e2e: " + n + " checks passed");
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
