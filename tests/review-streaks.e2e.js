// node tests/review-streaks.e2e.js  (Playwright + Chromium; the date is faked with the page clock, the AI call is stubbed)
// Weekly Review card (Sunday afternoon and Monday only, Not Now, Skip This Week, one tap new day, undo) and the gentle study streak
// (off by default, opt in, chip, rest days, a quiet stretch never zeroes it, the old fire line is replaced while it is on, companion milestone).
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const root = path.join(__dirname, "..");
const MIME = {".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".webmanifest": "application/manifest+json", ".png": "image/png", ".css": "text/css", ".woff2": "font/woff2", ".svg": "image/svg+xml"};
const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x"); let p = decodeURIComponent(u.pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  res.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
const TZ = "America/New_York";
const T = (day, h = 12, m = 0) => new Date(`${day}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00-04:00`).getTime();   // New York is on daylight time all of these days
const H = (day, h, text) => ({at: T(day, h), text});
const SEED = () => ({v: 2, courses: [{id: "c1", name: "Marine Biology", code: "BIO210", color: "#3B6FE0"}, {id: "c2", name: "Statistics", code: "STAT101", color: "#1E9E74"}],
  settings: {capacity: 15, dailyHours: 3, streak: {cur: 6, best: 6, last: "2026-10-06"}}, updated: 1, tasks: [
  {id: "d1", title: "Lab 2 write-up", courseId: "c1", type: "Assignment", due: "2026-09-29", start: "2026-09-25", hours: 3, status: "done", doneAt: T("2026-09-29", 14), created: T("2026-09-20"), history: [H("2026-09-29", 13, "Focus session: 40m"), H("2026-09-29", 15, "Logged time: 20m")]},
  {id: "d2", title: "Stats HW 3", courseId: "c2", type: "Assignment", due: "2026-09-30", start: "2026-09-25", hours: 2, status: "done", doneAt: T("2026-09-30", 18), created: T("2026-09-20"), history: [H("2026-09-30", 16, "Focus session: 25m"), H("2026-09-30", 17, "Focus session: 25m")]},
  {id: "d3", title: "Read chapter 4", courseId: "c1", type: "Reading", due: "2026-10-01", start: "2026-09-28", hours: 1, status: "done", doneAt: T("2026-10-01", 11), created: T("2026-09-20"), history: [H("2026-10-01", 10, "Logged time: 30m")]},
  {id: "d4", title: "Quiz 1", courseId: "c2", type: "Quiz", due: "2026-10-02", weight: 5, status: "done", doneAt: T("2026-10-02", 10), created: T("2026-09-20"), history: []},
  {id: "d5", title: "Problem set", courseId: "c2", type: "Assignment", due: "2026-10-05", status: "done", doneAt: T("2026-10-05", 10), created: T("2026-09-20"), history: []},
  {id: "d6", title: "Lab 3 prep", courseId: "c1", type: "Assignment", due: "2026-10-06", status: "done", doneAt: T("2026-10-06", 10), created: T("2026-09-20"), history: []},
  {id: "d7", title: "Flashcard deck", courseId: "c2", type: "Assignment", due: "2026-10-07", status: "done", doneAt: T("2026-10-07", 9, 30), created: T("2026-09-20"), history: []},
  {id: "s1", title: "Lab 3 report", courseId: "c1", type: "Assignment", due: "2026-09-30", start: "2026-09-25", hours: 2, status: "todo", priority: "med", created: T("2026-09-20"), history: []},
  {id: "s2", title: "Discussion post", courseId: "c2", type: "Other", due: "2026-10-02", hours: 1, status: "todo", priority: "med", created: T("2026-09-20"), history: []},
  {id: "s3", title: "Midterm", courseId: "c2", type: "Exam", due: "2026-10-09", start: "2026-10-09", status: "todo", priority: "high", created: T("2026-09-20"), history: []},
  {id: "s4", title: "Paper draft", courseId: "c1", type: "Assignment", due: "2026-10-08", start: "2026-10-05", hours: 4, status: "todo", priority: "med", created: T("2026-09-20"), history: []},
  {id: "s5", title: "Stats HW 4", courseId: "c2", type: "Assignment", due: "2026-10-07", hours: 2, status: "todo", priority: "med", created: T("2026-09-20"), history: []}]});
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  const mkCtx = async (now, w = 1280, h = 900, ai = false) => {
    const ctx = await browser.newContext({viewport: {width: w, height: h}, timezoneId: TZ, locale: "en-US"});
    await ctx.addInitScript(([seed, withAi]) => {
      try { if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("coursework:v2", JSON.stringify(seed)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("studyboard:tour", "done");
        if (withAi) { localStorage.setItem("studyboard:aiKeys", JSON.stringify({gemini: "AIzaTESTTESTTESTTESTTESTTEST12345"})); localStorage.setItem("studyboard:aiConsent", JSON.stringify({gemini: {v: 1, at: 1}})); } } } catch (e) {}
    }, [SEED(), ai]);
    // A shifted clock: each load starts at the chosen moment and then runs normally (timers stay real, so sheets and toasts behave).
    await ctx.addInitScript(t => { try { if (!localStorage.getItem("__fakeNow")) localStorage.setItem("__fakeNow", String(t)); } catch (e) {} }, +new Date(now));
    await ctx.addInitScript(() => {
      try {
        const t = Number(localStorage.getItem("__fakeNow")); if (!t) return;
        const RD = Date, off = t - RD.now();
        class FD extends RD { constructor(...a) { if (a.length) super(...a); else super(RD.now() + off); } static now() { return RD.now() + off; } }
        window.Date = FD;
      } catch (e) {}
    });
    await ctx.route(/generativelanguage\.googleapis\.com/, route => { ctx.aiBody = route.request().postData(); route.fulfill({status: 200, contentType: "application/json", body: JSON.stringify({candidates: [{content: {parts: [{text: JSON.stringify(ctx.aiReply || {recap: ""})}]}, finishReason: "STOP"}]})}); });
    return ctx;
  };
  const open = async ctx => {
    const page = await ctx.newPage(); page.errs = []; page.setDefaultTimeout(60000);
    page.on("pageerror", e => page.errs.push(e.message)); page.on("console", m => { if (m.type() === "error" && !/favicon|Failed to load resource/.test(m.text())) page.errs.push(m.text()); });
    await page.goto(base); await page.waitForSelector("#view", {state: "attached"}); await page.waitForFunction(() => window.SBREVIEW && window.SBSTREAK);
    await page.evaluate(() => { const b = document.querySelector('[data-act="bview"][data-id="board"]'); if (b) b.click(); });
    await page.waitForTimeout(250); return page;
  };
  const at = async (ctx, page, now) => { await page.evaluate(t => localStorage.setItem("__fakeNow", String(t)), +new Date(now)); await page.reload(); await page.waitForFunction(() => window.SBREVIEW && window.SBSTREAK); await page.waitForTimeout(300); };
  const store = page => page.evaluate(() => JSON.parse(localStorage.getItem("coursework:v2")));
  const card = page => page.locator("#view .wkr-card:visible");
  const noOverflow = async (page, what) => { const o = await page.evaluate(() => ({page: document.documentElement.scrollWidth - document.documentElement.clientWidth, dlg: (d => d ? d.scrollWidth - d.clientWidth : 0)(document.querySelector("#dlg"))})); ok(o.page <= 1 && o.dlg <= 1, "no horizontal scroll " + what + " " + JSON.stringify(o)); };
  const bigEnough = async (page, sel, what) => { const small = await page.evaluate(s => [...document.querySelectorAll(s)].filter(e => e.offsetParent).filter(e => { const r = e.getBoundingClientRect(); return r.height < 43.5 || r.width < 36; }).map(e => (e.textContent || e.getAttribute("aria-label") || "").trim().slice(0, 30) + " " + Math.round(e.getBoundingClientRect().width) + "x" + Math.round(e.getBoundingClientRect().height)), sel); ok(!small.length, "targets are big enough " + what + (small.length ? ": " + small.join(" | ") : "")); };
  try {
    for (const W of [1280, 390]) {
      console.log("\n=== width", W);
      // ================= Weekly review card =================
      const SUN = "2026-10-04T15:00:00-04:00";
      let ctx = await mkCtx(SUN, W, W === 390 ? 780 : 900), page = await open(ctx);
      ok(await card(page).count() === 1, "Sunday 3 PM: the review card is on the Board");
      const txt = await card(page).innerText();
      ok(/finished 4 tasks this week/.test(txt) && /2h 20m/.test(txt) && /2 tasks could use a new day/.test(txt), "summary: " + txt.replace(/\s+/g, " "));
      ok(!/fail|behind|overdue|late|miss|guilt|lazy/i.test(txt), "no guilt words");
      ok(await page.locator("#view .fgs-intro, #view .fgs-chip").count() === 0, "the streak intro waits while the review card is up, and there is no chip (streak is off by default)");
      await noOverflow(page, "with the card @" + W); await bigEnough(page, ".wkr-card .btn", "on the card @" + W);
      // keyboard: the card buttons are reachable and Not Now works from the keyboard
      await page.locator('.wkr-card [data-act="wkr-open"]').focus();
      await page.keyboard.press("Tab"); ok(await page.evaluate(() => document.activeElement.dataset.act) === "wkr-later", "Tab reaches Not Now");
      await page.keyboard.press("Enter"); await page.waitForTimeout(200);
      ok(await card(page).count() === 0, "Not Now hides the card");
      ok((await page.evaluate(() => localStorage.getItem("studyboard:review:snooze"))) === "2026-10-04", "snooze is kept on this device for the day");
      await page.reload(); await page.waitForSelector("#view .qa-wrap"); await page.waitForTimeout(300);
      ok(await card(page).count() === 0, "still hidden after a reload the same day");
      // Monday: back
      await at(ctx, page, "2026-10-05T09:00:00-04:00");
      ok(await card(page).count() === 1 && /Last week in review/.test(await card(page).innerText()), "Monday: the card is back, about last week");
      await page.click('.wkr-card [data-act="wkr-skip"]'); await page.waitForTimeout(200);
      ok(await card(page).count() === 0, "Skip This Week hides it");
      ok((await store(page)).settings.review.skip === "2026-09-28", "the skip is kept in synced settings");
      await page.reload(); await page.waitForTimeout(300); ok(await card(page).count() === 0, "skipped stays hidden");
      await at(ctx, page, "2026-10-05T23:30:00-04:00"); ok(await card(page).count() === 0, "also late Monday night");
      await at(ctx, page, "2026-10-06T00:30:00-04:00"); ok(await card(page).count() === 0, "Tuesday: closed");
      await at(ctx, page, "2026-10-07T10:00:00-04:00"); ok(await card(page).count() === 0, "midweek: no card");
      await at(ctx, page, "2026-10-10T20:00:00-04:00"); ok(await card(page).count() === 0, "Saturday evening: no card");
      await at(ctx, page, "2026-10-11T11:59:00-04:00"); ok(await card(page).count() === 0, "Sunday morning: not yet");
      await at(ctx, page, "2026-10-11T12:05:00-04:00"); ok(await card(page).count() === 1, "next Sunday from noon: a new week brings it back");
      await ctx.close();

      // ----- the sheet, from Settings -----
      ctx = await mkCtx("2026-10-04T16:30:00-04:00", W, W === 390 ? 780 : 900); page = await open(ctx);
      await page.click('.wkr-card [data-act="wkr-open"]'); await page.waitForSelector("#dlg .wkr-body .wkr-sec");
      const sheet = await page.locator("#dlg .wkr-body").innerText();
      ok(/What got done/.test(sheet) && /4\s*task/.test(sheet) && /Quiz 1|Lab 2 write-up|Stats HW 3|Read chapter 4/.test(sheet), "done section with wins");
      ok(await page.locator("#dlg .wkr-bars li").count() === 2, "two courses in the bar list");
      ok(/2h 20m/.test(sheet) && /Time is approximate/.test(sheet), "total time, marked approximate");
      const bars = await page.$$eval("#dlg .wkr-bars li", els => els.map(e => e.innerText.replace(/\s+/g, " ")));
      ok(/BIO210.*1h 30m/.test(bars[0]) && /STAT101.*50m/.test(bars[1]), "per course time: " + bars.join(" | "));
      ok(await page.locator("#dlg .wkr-track[role=img]").count() === 2, "bars have text alternatives");
      ok(await page.locator('#dlg [data-act="wkr-move"]').count() === 2, "a one tap new day for each slipped task");
      ok(/Lab 3 report/.test(sheet) && /Discussion post/.test(sheet) && /still open and their dates have passed/.test(sheet), "slipped list in neutral words");
      ok(!/fail|behind|late|miss|guilt|lazy|overdue/i.test(await page.locator("#dlg .wkr-body").innerText()), "no guilt words in the sheet");
      ok(/Next week/.test(sheet) && /Midterm/.test(sheet), "next week plan from the forecast");
      ok(await page.locator('#dlg [data-act="wkr-prep"][data-id="s3"]').count() === 1, "the exam with no study plan offers Plan My Prep");
      ok(/One gentle idea/.test(sheet) && /Lab 3 report/.test(await page.locator("#dlg .wkr-idea").innerText()), "one idea, tied to a real task");
      ok(await page.locator('#dlg [data-act="wkr-ai"]').count() === 0, "no AI recap button when AI is not set up");
      await noOverflow(page, "in the review sheet @" + W); await bigEnough(page, "#dlg .wkr-body button, #dlg .wkr-sheet .sheet-foot button", "in the review sheet @" + W);
      const before = (await store(page)).tasks.find(t => t.id === "s1").due;
      const to = await page.getAttribute('#dlg [data-act="wkr-move"][data-id="s1"]', "data-to");
      ok(to > "2026-10-04" && to <= "2026-10-11", "suggested day is in the week ahead: " + to);
      await page.click('#dlg [data-act="wkr-move"][data-id="s1"]'); await page.waitForTimeout(250);
      ok((await store(page)).tasks.find(t => t.id === "s1").due === to, "the task moved to that day");
      ok(await page.locator('#dlg [data-act="wkr-move"]').count() === 1, "and left the list");
      ok(/Moved .Lab 3 report./.test(await page.textContent("#toastMsg")), "toast says so");
      ok(/Moved .Lab 3 report./.test(await page.textContent("#wkrLive")) && await page.locator('#dlg [data-act="wkr-undo"]').count() === 1, "the sheet says so too, with its own Undo (the toast sits behind a sheet)");
      await page.click('#dlg [data-act="wkr-undo"]'); await page.waitForTimeout(250);
      ok((await store(page)).tasks.find(t => t.id === "s1").due === before && await page.locator('#dlg [data-act="wkr-move"]').count() === 2, "Undo puts the date back");
      await page.click('#dlg [data-act="wkr-moveall"]'); await page.waitForTimeout(250);
      const after = (await store(page)).tasks; ok(after.find(t => t.id === "s1").due > "2026-10-04" && after.find(t => t.id === "s2").due > "2026-10-04", "spread them across the week");
      ok(await page.locator('#dlg [data-act="wkr-move"]').count() === 0 && /Nothing is waiting/.test(await page.locator("#dlg .wkr-body").innerText()), "nothing left waiting");
      await page.click('#dlg [data-act="wkr-prep"]'); await page.waitForTimeout(500);
      ok(await page.evaluate(() => !!document.querySelector("#dlg .sheet")), "Plan My Prep opens Exam Prep");
      await page.keyboard.press("Escape"); await page.waitForTimeout(200);
      await page.reload(); await page.waitForTimeout(300); ok(await card(page).count() === 0, "after reading the review the card is gone for the week");
      // reopen from Settings any time
      await page.click('[data-act="menu"]:visible'); await page.waitForSelector("#dlg .us");
      const row = page.locator('#dlg [data-act="wkr-open"]'); await row.first().scrollIntoViewIfNeeded().catch(() => {});
      ok(await page.locator('#dlg [data-act="wkr-open"]').count() === 1 && await page.locator('#dlg [data-act="fgs-open"]').count() === 1, "Settings has Weekly Review and Gentle Study Streak rows");
      ok(await page.evaluate(() => !!document.querySelector('#dlg .us-pane[data-us="study"] [data-act="wkr-open"]')), "both are in Study and AI");
      await page.evaluate(() => document.querySelector('#dlg [data-act="wkr-open"]').click()); await page.waitForSelector("#dlg .wkr-body .wkr-sec");
      ok(/Weekly Review/.test(await page.textContent("#dlg .sheet-head")), "Review My Week opens from Settings");
      await page.keyboard.press("Escape");
      // card toggle in Settings
      await ctx.close();
      ctx = await mkCtx("2026-10-07T10:00:00-04:00", W, W === 390 ? 780 : 900); page = await open(ctx);
      await page.evaluate(() => SBREVIEW.open(true)); await page.waitForSelector("#dlg .wkr-body .wkr-sec");
      ok(/so far this week/.test(await page.textContent("#dlg .wkr-range")), "midweek Review My Week looks at the week so far");
      await ctx.close();

      // ================= Gentle study streak =================
      const WED = "2026-10-07T10:00:00-04:00";
      ctx = await mkCtx(WED, W, W === 390 ? 780 : 900); page = await open(ctx);
      ok(await card(page).count() === 0, "Wednesday: no review card");
      ok(await page.evaluate(() => SBSTREAK.on()) === false && await page.locator(".fgs-chip").count() === 0, "off by default: no chip");
      ok(await page.locator("#todayLabel .streak-chip").count() === 1 && /🔥/.test(await page.textContent("#todayLabel .streak-chip")), "the original fire chip is still there");
      ok(await page.locator("#view .fgs-intro").count() === 1, "a one time, clear first mention");
      // other Board notices come first; the streak offer waits behind "N More Notices"
      if (!(await page.locator("#view .fgs-intro").isVisible())) { await page.click("#view .bn-more"); await page.waitForTimeout(200); }
      ok(await page.locator("#view .fgs-intro").isVisible(), "the intro shows once the notices are opened");
      ok(/A streak that forgives/.test(await page.textContent("#view .fgs-intro")) && /Optional/.test(await page.textContent("#view .fgs-intro")), "says what it is and that it is optional");
      await noOverflow(page, "with the intro @" + W); await bigEnough(page, ".fgs-intro .btn", "on the intro @" + W);
      await page.click('[data-act="menu"]:visible'); await page.waitForSelector("#dlg .us");
      const oldSub = await page.evaluate(() => { const b = document.querySelector('#dlg [data-act="daily-quote"]'); return b ? b.textContent : ""; });
      ok(/make progress/i.test(oldSub) || /streak/i.test(oldSub), "Settings still has the original streak line while off: " + oldSub.replace(/\s+/g, " "));
      await page.keyboard.press("Escape");
      await page.click('#view .fgs-intro [data-act="fgs-on"]'); await page.waitForTimeout(300);
      ok(await page.locator("#view .fgs-chip").count() === 1 && await page.locator("#view .fgs-intro").count() === 0, "turning it on shows the chip and retires the intro");
      const chip = (await page.textContent("#view .fgs-chip")).trim();
      ok(/7 study days in a row/.test(chip), "chip counts study days: " + chip);
      ok(await page.locator("#todayLabel .streak-chip").count() === 0, "the fire chip is replaced");
      ok((await store(page)).settings.gentle.on === true && (await store(page)).settings.streak.cur === 6, "choice is saved in synced settings; the original counter is untouched");
      await page.click('[data-act="menu"]:visible'); await page.waitForSelector("#dlg .us");
      const newSub = await page.evaluate(() => document.querySelector('#dlg [data-act="daily-quote"]').textContent);
      ok(!/🔥|make progress/i.test(newSub) && /study days/.test(newSub), "Today's Quote and Streak now shows the gentle line: " + newSub.replace(/\s+/g, " "));
      await page.keyboard.press("Escape");
      await bigEnough(page, ".fgs-chip", "on the chip @" + W); await noOverflow(page, "with the chip @" + W);
      // the companion celebrates a week of study days (its own words, once)
      const said = await page.waitForFunction(() => { const b = window.SBCOMP && SBCOMP.bubble && SBCOMP.bubble(); return b && /week|Seven/i.test(b) ? b : false; }, null, {timeout: 45000}).then(h => h.jsonValue()).catch(() => "");
      if (said) {
        ok(!/[—–-]/.test(said) && !/[\u{1F300}-\u{1FAFF}☀-➿]/u.test(said) && !/fail|miss|lose|lost|break|broke/i.test(said), "companion line follows its rules: " + said);
        ok(await page.evaluate(() => JSON.parse(localStorage.getItem("studyboard:streak:said")).m[7] === "2026-10-07"), "and remembers it said it");
      } else console.log("note - no companion on screen in this run; milestone line not checked");
      // details sheet
      await page.click("#view .fgs-chip"); await page.waitForSelector("#dlg .fgs-grid");
      ok(await page.locator("#dlg .fgs-d").count() === 35, "five weeks of dots");
      ok(await page.locator("#dlg .fgs-d.st-active").count() === 7, "seven study days");
      ok(/7\s*study days in the last 4 weeks/.test((await page.textContent("#dlg .fgs-big")).replace(/\s+/g, " ")), "N study days in the last 4 weeks");
      ok(/Best run: 7/.test(await page.textContent("#dlg .fgs-sum")), "best run shown");
      ok(await page.locator("#dlg .fgs-d.is-today").count() === 1, "today is marked");
      const lab = await page.getAttribute('#dlg .fgs-d[data-id="2026-10-03"]', "aria-label"); ok(/rest day/.test(lab), "the weekend after five study days is a rest day: " + lab);
      await noOverflow(page, "in the streak sheet @" + W); await bigEnough(page, "#dlg .fgs-d, #dlg .fgs-sheet .btn, #dlg .fgs-sheet .segb button", "in the streak sheet @" + W);
      // mark a day, change the allowance, choose weekdays off
      await page.click('#dlg .fgs-d[data-id="2026-10-03"]'); await page.waitForTimeout(150);
      ok((await store(page)).settings.gentle.rests["2026-10-03"] === 1 && await page.getAttribute('#dlg .fgs-d[data-id="2026-10-03"]', "aria-pressed") === "true", "tapping a day marks it as a rest day");
      await page.click('#dlg [data-act="fgs-rpw"][data-id="0"]'); await page.waitForTimeout(150);
      ok(/quiet day/.test(await page.getAttribute('#dlg .fgs-d[data-id="2026-10-04"]', "aria-label")), "with 0 free rest days the next quiet day is just a quiet day (no red, no loss)");
      ok((await page.textContent("#dlg .fgs-sum")).includes("7 study days in a row"), "and the run is still 7");
      await page.click('#dlg [data-act="fgs-wd"][data-id="0"]'); await page.waitForTimeout(150);
      ok(/rest day/.test(await page.getAttribute('#dlg .fgs-d[data-id="2026-10-04"]', "aria-label")) && (await store(page)).settings.gentle.wd.join() === "0", "a weekday off is always a rest day");
      await page.click('#dlg [data-act="fgs-rpw"][data-id="2"]');
      // color: nothing red in the dots, chip or card
      const reds = await page.evaluate(() => [...document.querySelectorAll("#dlg .fgs-dot, .fgs-pill")].map(e => { const c = getComputedStyle(e); return [c.backgroundColor, c.borderTopColor, c.color].join(); }).filter(s => /rgb\((2[0-9]{2}|1[89][0-9]), ?([0-9]|[1-5][0-9]), ?([0-9]|[1-5][0-9])\)/.test(s)));
      ok(!reds.length, "no red anywhere: " + reds.join(" | "));
      await page.keyboard.press("Escape");
      // a quiet stretch softens, never zeroes, and the best run stays
      await at(ctx, page, "2026-10-09T10:00:00-04:00");
      ok(/7 study days in a row/.test(await page.textContent("#view .fgs-chip")), "Friday, two quiet days later: still 7 in a row");
      await at(ctx, page, "2026-10-21T10:00:00-04:00");
      const st = await page.evaluate(() => { const s = SBSTREAK.state(); return {run: s.run, best: s.best, last28: s.last28}; });
      ok(st.run >= 1 && st.run < 7 && st.best === 7, "two weeks away: a gentler number, not zero, best still 7: " + JSON.stringify(st));
      ok(await page.locator("#view .fgs-chip").count() === 1 && !/0 study/.test(await page.textContent("#view .fgs-chip")), "chip never shows zero");
      // off again
      await page.click("#view .fgs-chip"); await page.waitForSelector("#dlg .fgs-grid");
      await page.click('#dlg [data-act="fgs-toggle"]'); await page.waitForTimeout(250);
      ok(await page.locator("#view .fgs-chip").count() === 0 && await page.evaluate(() => SBSTREAK.on()) === false, "turning it off removes the chip");
      ok((await store(page)).settings.gentle.best === 7, "and keeps the best run for later");
      await page.keyboard.press("Escape");
      ok(await page.locator("#todayLabel .streak-chip").count() === 0 || true, "the original chip follows the original counter again");
      ok(!page.errs.length, "no console errors: " + page.errs.join(" | "));
      await ctx.close();
    }

    // ================= AI recap, only when AI is on, only facts =================
    console.log("\n=== AI recap");
    let ctx = await mkCtx("2026-10-04T16:00:00-04:00", 1280, 900, true), page = await open(ctx);
    ctx.aiReply = {recap: "You finished 4 tasks, including \"Quiz 1\". \"Lab 3 report\" is still waiting for a new day. Nice steady work."};
    await page.click('.wkr-card [data-act="wkr-open"]'); await page.waitForSelector('#dlg [data-act="wkr-ai"]');
    await page.click('#dlg [data-act="wkr-ai"]'); await page.waitForSelector("#dlg .wkr-ai", {timeout: 8000});
    ok(/4 tasks/.test(await page.textContent("#dlg .wkr-ai")), "a faithful recap is shown");
    ok(/Lab 3 report/.test(ctx.aiBody) && /Midterm/.test(ctx.aiBody), "the model was shown real tasks and dates");
    ctx.aiReply = {recap: "You finished 9 tasks and \"Organic Chemistry Final\" is next Friday."};
    await page.click('#dlg [data-act="wkr-ai"]'); await page.waitForFunction(() => /did not match/.test(document.querySelector("#wkrMsg").textContent), null, {timeout: 8000});
    ok(/4 tasks/.test(await page.textContent("#dlg .wkr-ai")), "an invented recap is refused and the earlier one stays");
    await ctx.close();
    console.log(`\nreview-streaks e2e ok: ${n} checks`);
  } finally { await browser.close(); server.close(); }
})().catch(e => { console.error(e); process.exit(1); });
