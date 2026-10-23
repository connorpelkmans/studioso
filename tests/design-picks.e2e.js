// Exam Mode card and strip, the week ahead, the review hero, the month calendar and the page header, in the real app
const path = require("path"), fs = require("fs"), assert = require("assert"), os = require("os");
const {chromium, executablePath} = require("./pw");
const FILE = "file://" + path.join(__dirname, "..", "index.html");
const OUT = process.argv[2] || fs.mkdtempSync(path.join(os.tmpdir(), "sbpicks-"));
fs.mkdirSync(OUT, {recursive: true});
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const NOW = new Date(2026, 9, 23, 10, 0, 0);
const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const plus = k => { const d = new Date(NOW); d.setDate(d.getDate() + k); return iso(d); };
const T = (id, title, courseId, type, due, o) => Object.assign({id, title, courseId, type, due, start: due, hours: 1.5, status: "todo"}, o || {});
const card = (id, o) => Object.assign({id, front: "Q " + id, back: "A " + id, box: 1, due: plus(-1), seen: 2, right: 1, wrong: 1, last: plus(-2)}, o || {});
const SEED = {v: 2, courses: [{id: "bio", name: "Biology", code: "BIO 101", color: "#3B6FE0"}, {id: "art", name: "Art History", code: "ART 140", color: "#D9822B"}, {id: "sta", name: "Statistics", code: "STA 101", color: "#1E9E74"}],
  tasks: [
    T("qz", "Weekly quiz: Impressionism", "art", "Quiz", plus(1), {time: "10:00", hours: 0.5}),
    T("mid", "Midterm 2", "bio", "Exam", plus(6), {time: "09:30", hours: 6}),
    T("ps", "Problem Set 6", "sta", "Assignment", plus(0), {time: "23:59", hours: 2.5}),
    T("rd", "Read Chapter 9", "bio", "Reading", plus(0)),
    T("ess", "Gallery reflection", "art", "Assignment", plus(2), {hours: 3}),
    T("lab", "Lab report", "bio", "Lab", plus(3), {hours: 3}),
    T("old", "Late worksheet", "sta", "Assignment", plus(-1), {hours: 1}),
    T("w1", "Worksheet A", "sta", "Assignment", plus(4)), T("w2", "Worksheet B", "bio", "Assignment", plus(4)), T("w3", "Worksheet C", "art", "Reading", plus(4)), T("w4", "Worksheet D", "bio", "Reading", plus(4)),
    T("dn", "Old essay", "art", "Assignment", plus(-3), {status: "done"})],
  decks: [
    {id: "d1", name: "Organelles", courseId: "bio", created: 1, cards: [card("a1"), card("a2"), card("a3", {seen: 0, box: 0, due: "", last: ""})]},
    {id: "d2", name: "Stats vocab", courseId: "sta", created: 2, cards: [card("b1", {due: plus(3)})]}],
  notes: [], files: [], events: [], settings: {capacity: 15, dailyHours: 3, fcDays: [plus(-2)]}, updated: 1};
const go = (page, o) => page.evaluate(o => { const S = window.__sbSync; Object.assign(S.ui, o); S.render(); }, o);
const vis = (page, sel) => page.evaluate(s => { const e = document.querySelector(s); return !!e && !!(e.offsetWidth || e.offsetHeight) && getComputedStyle(e).visibility !== "hidden"; }, sel);
const txt = (page, sel) => page.evaluate(s => { const e = document.querySelector(s); return e ? e.innerText.replace(/\s+/g, " ").trim() : ""; }, sel);
const noOverflow = page => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1);

(async () => {
  const browser = await chromium.launch({executablePath});
  try {
    for (const [W, H] of [[1280, 800], [390, 844]]) for (const theme of ["light", "dark"]) {
      const tag = W + "-" + theme, phone = W < 640;
      console.log("== " + tag);
      const ctx = await browser.newContext({viewport: {width: W, height: H}});
      await ctx.clock.install({time: NOW});
      await ctx.addInitScript(([seed, theme]) => {
        window.__SB_TEST = true;
        try { if (!sessionStorage.getItem("seeded")) { sessionStorage.setItem("seeded", "1"); localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "done"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:theme", theme); localStorage.setItem("coursework:v2", JSON.stringify(seed)); } } catch (e) {}
      }, [SEED, theme]);
      const page = await ctx.newPage(); const errs = [];
      page.on("pageerror", e => errs.push(e.message));
      await page.goto(FILE); await page.waitForTimeout(1500);
      await page.waitForFunction(() => window.__sbSync && window.SBEXAM);

      /* Exam Mode */
      await go(page, {tab: "board", bview: "plan"}); await page.waitForTimeout(200);
      ok(await vis(page, ".exm-card .exm-cd"), tag + ": the Exam Mode card leads with a countdown tile");
      ok(/\b1\b/.test(await txt(page, ".exm-cd")) && /day/i.test(await txt(page, ".exm-cd")), tag + ": the tile counts the days: " + await txt(page, ".exm-cd"));
      ok(await page.locator(".exm-card [data-act=exm-study]").count() === 1 && await page.locator(".exm-card [data-act=exm-off]").count() === 1, tag + ": Study for It and Not Now are there");
      if (!phone) {
        ok(await vis(page, ".exm-card .exm-prep .exm-bar") && /prepared|Not started/.test(await txt(page, ".exm-prep")), tag + ": a prep bar and its line: " + await txt(page, ".exm-prep"));
        ok(await vis(page, ".exm-card [data-act=exam-plan]") && /Plan My Prep/.test(await txt(page, ".exm-card [data-act=exam-plan]")), tag + ": Plan My Prep sits under Study for It");
        const [s, p] = await Promise.all([".exm-card [data-act=exm-study]", ".exm-card [data-act=exam-plan]"].map(q => page.locator(q).boundingBox()));
        ok(p.y > s.y + s.height - 2 && Math.abs(p.x + p.width / 2 - (s.x + s.width / 2)) < 4, tag + ": the two actions are stacked");
        ok(/Exam Mode/i.test(await txt(page, ".exm-kick")) && /ART 140/.test(await txt(page, ".exm-title")), tag + ": the kicker and the course tag show");
      } else {
        const r = await page.locator(".exm-card").boundingBox();
        ok(r.height <= 92, tag + ": on a phone the card is a compact strip: " + Math.round(r.height) + "px");
        ok(!(await vis(page, ".exm-card [data-act=exam-plan]")) && !(await vis(page, ".exm-card .exm-prep")), tag + ": Plan My Prep and the prep bar leave the strip");
        const x = await page.locator(".exm-card [data-act=exm-off]").boundingBox(), st = await page.locator(".exm-card [data-act=exm-study]").boundingBox();
        ok(x.width >= 40 && x.height >= 40 && st.height >= 40, tag + ": the close and Study buttons are big enough to tap");
      }
      ok(await page.evaluate(() => { const c = document.querySelector(".exm-card"), t = c.querySelector(".exm-title"); return getComputedStyle(t).color !== getComputedStyle(c).backgroundColor; }), tag + ": the card text is readable");

      /* Week ahead */
      ok(await page.locator(".wk-strip .wk-day").count() === 7 && /Today/i.test(await txt(page, ".wk-day.today .wk-dow")), tag + ": seven day cards, Today first");
      ok(await page.locator(".wk-day >> nth=1").locator(".wk-flag").count() === 1 && /Quiz/i.test(await txt(page, `.wk-day[data-id="d:${plus(1)}"]`)), tag + ": tomorrow's card flags the quiz");
      ok((await page.locator(".wk-day").evaluateAll(b => b.map(x => x.getBoundingClientRect().height))).every(h => h >= 40), tag + ": day cards are big enough to tap");
      ok(await page.locator('.wk-day.today ~ .wk-late[data-act="plan-tile"][data-id="late"]').count() === 1 && /1\s*overdue/.test(await txt(page, ".wk-late")), tag + ": the overdue count sits on Today");
      await page.click(".wk-late"); await page.waitForTimeout(250);
      ok(/Overdue/i.test(await txt(page, "#planListLbl")) && /Late worksheet/.test(await txt(page, ".plan-list")), tag + ": and filters the list to the overdue work");
      await page.click('[data-act="plan-tile"][data-id=""]'); await page.waitForTimeout(250);
      const d4 = `.wk-day[data-id="d:${plus(4)}"]`;
      await page.locator(d4).scrollIntoViewIfNeeded(); await page.click(d4); await page.waitForTimeout(250);
      ok(await page.getAttribute(d4, "aria-pressed") === "true" && await page.locator("ol.plan-list[aria-labelledby] > .plan-row").count() === 4, tag + ": a day card shows what's due that day");
      ok(/4 due/.test(await page.getAttribute(d4, "aria-label")), tag + ": and says it to a screen reader: " + await page.getAttribute(d4, "aria-label"));
      await page.click('[data-act="plan-tile"][data-id=""]'); await page.waitForTimeout(200);
      ok(await noOverflow(page), tag + ": Today's Plan has no sideways scroll");
      await page.screenshot({path: path.join(OUT, `plan-${tag}.png`)});

      /* Review hero */
      await go(page, {tab: "flashcards", rvView: "cards", deckId: null, filter: "all"}); await page.waitForTimeout(250);
      ok(await vis(page, ".rv-hero") && /^3 cards ready to review$/.test(await txt(page, ".rv-hero h3")), tag + ": the review hero counts what's ready: " + await txt(page, ".rv-hero h3"));
      ok(/minute/.test(await txt(page, ".rv-hero p")) && /Organelles/.test(await txt(page, ".rv-hero p")) && /Midterm 2 is in 6 days/.test(await txt(page, ".rv-hero p")), tag + ": with the time, the decks and the next exam: " + await txt(page, ".rv-hero p"));
      ok(await page.locator(".rv-week .rv-wd").count() === 7 && await page.locator(".rv-week .rv-wd.on").count() >= 1 && await page.locator(".rv-week .rv-wd.now").count() === 1, tag + ": a week of review days, today ringed");
      ok(/2 due · 1 new/.test(await txt(page, '.deck:has([data-id="d1"])')), tag + ": a deck tile says what's due and new");
      await page.click('.rv-hero [data-act="fc-review-start"]'); await page.waitForTimeout(300);
      ok(await page.evaluate(() => { const f = window.__sbSync.ui.fc; return !!f && f.mode === "study" && f.q.length === 3; }), tag + ": Start Review starts a session with those cards");
      await go(page, {fc: null}); await page.waitForTimeout(150);
      await page.evaluate(() => { const S = window.__sbSync; ["d1", "d2"].forEach(id => { const d = S.clone(S.state.decks[id]); d.cards.forEach(c => { c.seen = 3; c.due = "2026-10-27"; }); S.applyChanges([{kind: "deck", id, after: d}], null); }); });
      await page.waitForTimeout(200);
      ok(/All caught up/.test(await txt(page, ".rv-hero h3")) && /Next review/.test(await txt(page, ".rv-hero p")) && await page.locator('.rv-hero [data-act="fc-review-start"]').count() === 0, tag + ": with nothing due it says so and when the next review is: " + await txt(page, ".rv-hero p"));
      ok(await noOverflow(page), tag + ": Review has no sideways scroll");
      await page.screenshot({path: path.join(OUT, `review-${tag}.png`)});

      /* Calendar */
      await go(page, {tab: "timeline", tlMode: "calendar", calMonth: "", calDay: ""}); await page.waitForTimeout(250);
      ok(await page.locator(".cal .day.is-today").count() === 1, tag + ": the month calendar shows today");
      if (!phone) {
        ok(/Due Dates/.test(await txt(page, ".pg-head .pg-title")) && await page.locator(".pg-sub").count() === 0, tag + ": a big page title with no context line");
        ok(await page.evaluate(() => { const t = document.querySelector(".pg-tabs"), b = t.querySelector("[aria-selected=true]"); return getComputedStyle(t).borderBottomWidth === "1px" && getComputedStyle(b).borderBottomWidth === "3px" && getComputedStyle(b).backgroundColor === "rgba(0, 0, 0, 0)"; }), tag + ": the views are underlined tabs on a hairline");
        ok(await page.evaluate(() => { const h = document.querySelector(".pg-head"), t = document.querySelector(".pg-tabs"); return !!(h.compareDocumentPosition(t) & Node.DOCUMENT_POSITION_FOLLOWING); }) && await vis(page, '.pg-right [data-act="tl-mode"]'), tag + ": the title comes first and the Timeline / Month switch sits top right");
        ok(await vis(page, ".cal .day.is-today .num-t") && await page.evaluate(() => getComputedStyle(document.querySelector(".cal .day.is-today")).boxShadow.includes("inset")), tag + ": today has a ring and a Today pill");
        ok(/Problem Set 6/.test(await txt(page, `.cal .day[data-id="${plus(0)}"] .ci-t`)) && await vis(page, ".cal .ci-row .ci-t"), tag + ": cells show chips with titles");
        ok(await page.locator(`.cal .day[data-id="${plus(1)}"] .ci-row.big`).count() === 1, tag + ": the quiz is a solid chip");
        ok(await page.locator(`.cal .day[data-id="${plus(4)}"] .ci-row`).count() === 3 && /\+1 more/.test(await txt(page, `.cal .day[data-id="${plus(4)}"] .ci-more`)), tag + ": at most three chips, then +N more");
        ok(await page.locator(`.cal .day[data-id="${plus(-1)}"] .ci-row.late`).count() === 1 && /overdue/.test(await page.getAttribute(`.cal .day[data-id="${plus(-1)}"]`, "aria-label")), tag + ": overdue work is still marked");
        ok(await page.evaluate(() => { const d = [...document.querySelectorAll(".cal .day")].find(x => x.classList.contains("wkend") && !x.classList.contains("out")), w = [...document.querySelectorAll(".cal .day")].find(x => !x.classList.contains("wkend") && !x.classList.contains("out") && !x.classList.contains("is-today")); return getComputedStyle(d).backgroundColor !== getComputedStyle(w).backgroundColor; }), tag + ": weekends are tinted");
        ok(await page.evaluate(() => { const c = document.querySelector(".cal").getBoundingClientRect(); return c.height < innerHeight; }), tag + ": the whole month fits on screen");
        ok(/^(Sun|Sunday)$/i.test(await txt(page, ".cal .dow")), tag + ": weekday names are written out: " + await txt(page, ".cal .dow"));
      } else {
        ok(!(await vis(page, ".pg-title")) && await page.locator(".pg-sub").count() === 0, tag + ": on a phone the title stays in the top bar, with no context line");
        ok(await vis(page, ".cal .dots i.ci") && !(await vis(page, ".cal .ci-t")), tag + ": the phone keeps the compact dot view");
      }
      ok(await noOverflow(page), tag + ": Calendar has no sideways scroll");
      await page.screenshot({path: path.join(OUT, `calendar-${tag}.png`)});
      for (const [t, sel] of [["schedule", "plan-view"], ["crunch", "plan-view"]]) {
        await go(page, {tab: t}); await page.waitForTimeout(250);
        ok(await page.locator(".pg-head").count() === 1 && await page.locator(".pg-sub").count() === 0 && (phone || await page.locator("#view h2", {hasText: /^(Schedule|Crunch Forecast)$/}).count() === 1), tag + ": " + t + " has the page header once");
      }

      /* The same header on the other tabbed pages */
      for (const [o, title] of [[{tab: "board", bview: "board"}, "Task Board"], [{tab: "flashcards", rvView: "quizzes"}, "Your Quizzes"], [{tab: "courses", courseId: null, courseTab: ""}, "Your Courses"], [{tab: "notes"}, "Notes"]]) {
        await go(page, Object.assign({rvView: "cards"}, o)); await page.waitForTimeout(300);
        const h = await page.evaluate(() => [...document.querySelectorAll("#view h2")].filter(e => e.offsetWidth).map(e => e.textContent.trim()));
        if (!phone) ok(await txt(page, ".pg-head .pg-title") === title && h.filter(x => x === title).length === 1 && await page.locator(".pg-tabs").count() === 1 && await page.locator(".pg-sub").count() === 0, tag + ": " + title + " gets the page header");
        else ok(!h.includes(title) && await page.locator(".pg-head").count() === 1, tag + ": " + title + " on a phone does not repeat its title");
        ok(await noOverflow(page), tag + ": " + title + " has no sideways scroll");
      }
      ok(!errs.length, tag + ": no page errors " + errs.join(" | "));
      await ctx.close();
    }
  } finally { await browser.close(); }
  console.log(`design-picks.e2e: ${n} checks passed. Screenshots in ${OUT}`);
})().catch(e => { console.error(e); console.log(`design-picks.e2e: ${n} checks FAILED`); process.exit(1); });
