// node tests/semester.e2e.js  (Playwright + Chromium; no network, AI off)
// "Set up your semester": Board card for an empty planner (and none for someone with data), the Settings row, six skippable steps, quick typing,
// the review list with quick fixes and Undo, one-tap time estimates, Exam Prep / Break Down handoffs, several syllabi in a row (one per course),
// resume after a reload, nothing-found fallback, welcome-setup button, phone width, keyboard focus and aria-live, dark theme, no console errors.
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const root = path.join(__dirname, ".."), SHOTS = process.env.SHOTS || path.join(require("os").tmpdir(), "sem-shots");
fs.mkdirSync(SHOTS, {recursive: true});
const MIME = {".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".webmanifest": "application/manifest+json", ".png": "image/png", ".css": "text/css", ".woff2": "font/woff2", ".svg": "image/svg+xml"};
const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x"); let p = decodeURIComponent(u.pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  res.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const addD = n => { const d = new Date(); d.setDate(d.getDate() + n); return iso(d); };
const MON = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const longD = n => { const d = new Date(); d.setDate(d.getDate() + n); return `${MON[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`; };
const syllabus = (code, name, off) => `${code} ${name}
Instructor: Dr. Rivera
Meets: Mon Wed 10:00-11:15 AM
Course Schedule and Assignments
${longD(off)}: Quiz 1
${longD(off + 7)}: Homework 1 due
${longD(off + 14)}: Midterm Exam
${longD(off + 28)}: Research Paper due
Grading: Quizzes 20%, Homework 20%, Midterm 30%, Paper 30%. Late work is accepted for partial credit. Office hours are by appointment. Please read the whole syllabus.
`;
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  const mkCtx = async (opts = {}) => {
    const ctx = await browser.newContext({viewport: {width: opts.w || 1280, height: opts.h || 900}, colorScheme: opts.dark ? "dark" : "light"});
    await ctx.addInitScript(([seed, flags]) => {
      try { if (!localStorage.getItem("coursework:v2")) { if (seed) localStorage.setItem("coursework:v2", JSON.stringify(seed)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("studyboard:tour", "done");
        (flags || []).forEach(k => localStorage.removeItem(k)); } } catch (e) {}
    }, [opts.seed || null, opts.clear || []]);
    return ctx;
  };
  const open = async ctx => { const page = await ctx.newPage(); page.errs = []; page.on("pageerror", e => page.errs.push(e.message)); page.on("console", m => { if (m.type() === "error") page.errs.push(m.text()); }); await page.goto(base); await page.waitForSelector("#view", {state: "attached"}); await page.waitForFunction(() => window.SBSEM && window.SBEST && window.SBCAPTURE); await page.waitForTimeout(400); return page; };
  const ls = (page) => page.evaluate(() => JSON.parse(localStorage.getItem("coursework:v2") || "{}"));
  const noOverflow = async (page, what) => { const o = await page.evaluate(() => { const d = document.querySelector("#dlg"), b = document.querySelector("#dlg .sheet-body"); return {page: document.documentElement.scrollWidth - document.documentElement.clientWidth, dlg: d ? d.scrollWidth - d.clientWidth : 0, body: b ? b.scrollWidth - b.clientWidth : 0}; }); ok(o.page <= 0 && o.dlg <= 0 && o.body <= 0, `no horizontal overflow ${what} (${JSON.stringify(o)})`); };
  const step = page => page.evaluate(() => (document.querySelector(".sem-st[aria-current=step]") || {}).dataset.id);
  const focusedIsHeading = page => page.evaluate(() => document.activeElement && document.activeElement.id === "semH");
  const typeAll = async page => { await page.fill("#semType", "Bio quiz Friday 2pm\nEssay 1 due in 10 days\nMidterm exam in 3 weeks"); await page.click('[data-sem="type-add"]'); await page.waitForTimeout(300); };
  try {
    for (const W of [1280, 390]) {
      console.log("\n=== width", W);
      const ctx = await mkCtx({w: W, h: W === 390 ? 780 : 900}); const page = await open(ctx);
      // ---- empty planner: the Board card
      ok(await page.locator(".sem-card-b").count() === 1 && await page.locator('.sem-card-b [data-act="sem-open"]').count() === 1, "empty Board shows the Set up your semester card");
      await page.click('.sem-card-b [data-act="sem-open"]');
      await page.waitForSelector(".sem-sheet .sem-h");
      ok(await step(page) === "courses" && await focusedIsHeading(page), "the sheet opens on step 1 with the heading focused");
      ok(await page.locator(".sem-sheet #semLive[aria-live=polite]").count() === 1, "progress is announced through an aria-live region");
      await noOverflow(page, "on step 1 @" + W);
      await page.screenshot({path: path.join(SHOTS, `step1-${W}.png`)});
      // ---- step 1: add a course (Enter works), a duplicate is refused calmly
      await page.fill("#semCode", "BIO 210"); await page.fill("#semName", "Marine Biology"); await page.press("#semName", "Enter");
      await page.waitForSelector(".sem-chips li");
      ok(await page.locator(".sem-chips li").count() === 1, "a course is added with Enter");
      await page.fill("#semCode", "bio 210"); await page.click('[data-sem="course-add"]');
      ok(/already in your list/.test(await page.textContent("#semMsg")) && await page.locator(".sem-chips li").count() === 1, "a duplicate course is refused with a calm message");
      await page.click('[data-sem="next"]');
      ok(await step(page) === "work" && await focusedIsHeading(page), "Next goes to step 2 and moves focus to the heading");
      // ---- step 2: type a few things
      await page.click('[data-sem="type-add"]');
      ok(/Type something first/.test(await page.textContent("#semMsg")), "adding an empty box gives a calm hint, not an error");
      await typeAll(page);
      let st = await ls(page);
      ok(st.tasks.length >= 3, "typed lines become tasks (" + st.tasks.length + ")");
      ok(/\d+ items? found/.test(await page.textContent("#semTally")), "the tally counts what was found");
      await noOverflow(page, "on step 2 @" + W);
      await page.screenshot({path: path.join(SHOTS, `step2-${W}.png`)});
      // ---- step 3: review with quick fixes
      await page.click('[data-sem="next"]');
      ok(await step(page) === "review", "step 3 is the review");
      const rows = await page.locator(".sem-r").count();
      ok(rows >= 3, "review lists what was found (" + rows + ")");
      const first = page.locator(".sem-r").first();
      const tid = await first.getAttribute("data-id");
      await first.locator('[data-sf="title"]').fill("Bio quiz 1 (fixed)"); await first.locator('[data-sf="title"]').dispatchEvent("change");
      await first.locator('[data-sf="due"]').fill(addD(12)); await first.locator('[data-sf="due"]').dispatchEvent("change");
      st = await ls(page);
      const ft = st.tasks.find(t => t.id === tid);
      ok(ft && ft.title === "Bio quiz 1 (fixed)" && ft.due === addD(12), "editing a title and a date in the list saves to the task");
      await first.locator('[data-sf="type"]').selectOption("Exam"); await first.locator('[data-sf="type"]').dispatchEvent("change");
      st = await ls(page);
      ok(st.tasks.find(t => t.id === tid).type === "Exam", "the type can be fixed in the list");
      await page.click(`[data-sem="rm"][data-id="${tid}"]`);
      ok(!(await ls(page)).tasks.some(t => t.id === tid) && await page.locator('[data-sem="undo-rm"]').count() === 1, "Remove deletes and offers Undo");
      await page.click('[data-sem="undo-rm"]');
      ok((await ls(page)).tasks.some(t => t.id === tid), "Undo Remove puts it back");
      await noOverflow(page, "on the review step @" + W);
      await page.screenshot({path: path.join(SHOTS, `step3-${W}.png`)});
      // ---- step 4: one-tap estimates
      await page.click('[data-sem="next"]');
      ok(await step(page) === "times", "step 4 is time estimates");
      const need = await page.evaluate(() => SBEST.list(true).length);
      if (need) {
        await page.click('[data-sem="est-all"]');
        ok(await page.evaluate(() => SBEST.list(true).length) === 0, "one tap gives every item a suggested time");
      } else ok(true, "every typed item already had a time");
      await page.screenshot({path: path.join(SHOTS, `step4-${W}.png`)});
      // ---- step 5: prep
      await page.click('[data-sem="next"]');
      ok(await step(page) === "prep" && await page.locator('[data-sem="prep"]').count() >= 1, "step 5 lists the exam with Plan My Prep");
      await page.click('[data-sem="prep"]');
      await page.waitForSelector("#dlg .sheet:not(.sem-sheet)");
      ok(await page.locator(".sem-sheet").count() === 0, "Exam Prep opens over the flow");
      await page.keyboard.press("Escape");
      await page.waitForSelector(".sem-sheet .sem-h", {timeout: 4000});
      ok(await step(page) === "prep", "closing Exam Prep returns to the same step");
      await page.screenshot({path: path.join(SHOTS, `step5-${W}.png`)});
      // ---- step 6: your week
      await page.click('[data-sem="next"]');
      ok(await step(page) === "week" && /across/.test(await page.textContent(".sem-ok")), "step 6 shows a short success summary");
      ok(await page.locator(".sem-list li").count() >= 1 || /calm start/.test(await page.textContent(".sem-body")), "step 6 shows what is due in the next 7 days");
      await page.screenshot({path: path.join(SHOTS, `step6-${W}.png`)});
      await page.click('[data-sem="finish"][data-id="board"]');
      await page.waitForTimeout(300);
      ok(!(await page.evaluate(() => document.querySelector("#dlg").open)) && await page.locator(".sem-card-b").count() === 0, "finishing returns to the Board and the card is gone");
      ok((await page.evaluate(() => SBSEM.state())).fin > 0, "finish is remembered on this device");
      ok(page.errs.length === 0, "no console errors @" + W + " " + JSON.stringify(page.errs.slice(0, 3)));
      await ctx.close();
    }

    // ---- someone with data: no card; the Settings row still offers it
    console.log("\n=== existing data");
    {
      const seed = {v: 2, courses: [{id: "c1", name: "Chem", code: "CHE101", color: "#3B6FE0"}], settings: {dailyHours: 3}, updated: 1, tasks: [{id: "t1", title: "Lab 1", courseId: "c1", type: "Lab", due: addD(5), start: addD(1), hours: 2, status: "todo", priority: "med", created: Date.now() - 864e5}]};
      const ctx = await mkCtx({seed}); const page = await open(ctx);
      ok(await page.locator(".sem-card-b").count() === 0, "no first-run card for someone who already has tasks");
      ok(await page.evaluate(() => SBSEM.offer()) === null && await page.evaluate(() => SBSEM.tourButton()) === "", "no companion offer and no welcome-setup button for existing data");
      await page.evaluate(() => document.querySelector('nav.tabs [data-act="menu"], header.top [data-act="menu"]').click());
      await page.waitForSelector("#dlg");
      ok(await page.locator('#dlg [data-act="sem-open"]').count() >= 1, "Settings has the Set Up Your Semester row");
      await page.click('#dlg [data-us="school"]');
      await page.locator('#dlg [data-act="sem-open"]:visible').first().click();
      await page.waitForSelector(".sem-sheet .sem-h");
      await page.click('[data-sem="goto"][data-id="review"]');
      ok(/Nothing found yet/.test(await page.textContent(".sem-body")), "a rerun does not list or touch existing tasks (nothing found yet)");
      await page.click('[data-sem="scope"][data-id="all"]');
      ok(await page.locator(".sem-r").count() === 1, "'Everything coming up' lists existing open tasks");
      await page.keyboard.press("Escape");
      ok(page.errs.length === 0, "no console errors with existing data " + JSON.stringify(page.errs.slice(0, 3)));
      await ctx.close();
    }

    // ---- several syllabi in a row, one per course; resume after reload; nothing-found fallback
    console.log("\n=== syllabi in a row and resume");
    {
      const ctx = await mkCtx(); const page = await open(ctx);
      await page.click('.sem-card-b [data-act="sem-open"]');
      await page.click('[data-sem="next"]');
      await page.setInputFiles("#semPdf", [
        {name: "bio210.txt", mimeType: "text/plain", buffer: Buffer.from(syllabus("BIO 210", "Marine Biology", 5))},
        {name: "chem101.txt", mimeType: "text/plain", buffer: Buffer.from(syllabus("CHE 101", "General Chemistry", 6))}]);
      await page.waitForSelector("#impAdd:not([hidden])", {timeout: 8000});
      ok(await page.locator(".sem-sheet").count() === 0 && /Import a Syllabus/.test(await page.textContent("#dlg .sheet-head")), "the syllabus reader opens over the flow for the first file");
      const found1 = await page.locator(".imp-row").count();
      ok(found1 >= 3, "the first syllabus lists its items (" + found1 + ")");
      await page.click("#impAdd");
      // the second one starts by itself, without going back to the flow
      await page.waitForFunction(() => { const i = document.querySelector("#impAdd"); return i && !i.hidden && /CHE|Chem/i.test((document.querySelector("#icName") || {}).value + (document.querySelector("#icCode") || {}).value); }, null, {timeout: 8000});
      ok(true, "the next syllabus opens automatically after the first is added");
      await page.click("#impAdd");
      await page.waitForSelector(".sem-sheet .sem-h", {timeout: 6000});
      const st = await ls(page);
      ok(st.courses.length === 2 && st.tasks.length >= 6, "two syllabi gave two courses and their tasks (" + st.courses.length + " courses, " + st.tasks.length + " tasks)");
      ok(/Added \d+ tasks? and 1 course/.test(await page.textContent("#semMsg")), "returning to the flow says what was added");
      // resume
      await page.click('[data-sem="next"]');
      ok(await step(page) === "review", "moved on to review");
      await page.reload(); await page.waitForFunction(() => window.SBSEM);
      await page.waitForTimeout(400);
      ok((await page.evaluate(() => SBSEM.state())).step === "review", "the step is remembered on this device");
      await page.evaluate(() => SBSEM.open());
      await page.waitForSelector(".sem-sheet .sem-h");
      ok(await step(page) === "review", "reopening resumes where it left off");
      // cancel a syllabus: the queue waits instead of nagging
      await page.click('[data-sem="goto"][data-id="work"]');
      await page.setInputFiles("#semPdf", [{name: "a.txt", mimeType: "text/plain", buffer: Buffer.from(syllabus("ART 100", "Art", 9))}, {name: "b.txt", mimeType: "text/plain", buffer: Buffer.from(syllabus("MUS 100", "Music", 9))}]);
      await page.waitForSelector("#impAdd");
      await page.click('#dlg [data-act="close"]');
      await page.waitForSelector(".sem-sheet .sem-queue", {timeout: 4000});
      ok(/b\.txt/.test(await page.textContent(".sem-queue")), "cancelling one syllabus leaves the rest waiting, with a Read Next One button");
      await page.click('[data-sem="q-clear"]');
      ok(await page.locator(".sem-queue").count() === 0, "the waiting list can be cleared");
      ok(page.errs.length === 0, "no console errors in the syllabus flow " + JSON.stringify(page.errs.slice(0, 3)));
      await ctx.close();
    }

    // ---- keyboard, dark theme, welcome-setup button, hide card
    console.log("\n=== keyboard, dark, welcome setup");
    {
      const ctx = await mkCtx({dark: true, w: 390, h: 780}); const page = await open(ctx);
      await page.click('.sem-card-b [data-act="sem-hide"]');
      ok(await page.locator(".sem-card-b").count() === 0 && (await page.evaluate(() => SBSEM.state())).hide === true, "Not now hides the card and remembers it");
      await page.evaluate(() => SBSEM.open());
      await page.waitForSelector(".sem-sheet .sem-h");
      await page.keyboard.press("Tab"); await page.keyboard.press("Tab");
      const tabbable = await page.evaluate(() => !!document.activeElement.closest("#dlg"));
      ok(tabbable, "focus stays inside the sheet while tabbing");
      await page.focus('[data-sem="skip"]'); await page.keyboard.press("Enter");
      ok(await step(page) === "work" && await page.locator('.sem-st.skip[data-id="courses"]').count() === 1, "Skip with the keyboard moves on and marks the step skipped");
      const bg = await page.evaluate(() => getComputedStyle(document.querySelector(".sem-card")).backgroundColor);
      ok(!!bg && bg !== "rgba(0, 0, 0, 0)", "cards have a themed background in dark mode (" + bg + ")");
      await page.screenshot({path: path.join(SHOTS, "dark-390.png")});
      const reduced = await page.evaluate(() => { const css = [...document.styleSheets].flatMap(s => { try { return [...s.cssRules]; } catch (e) { return []; } }); return css.some(r => r.media && /prefers-reduced-motion/.test(r.media.mediaText) && /sem-sheet/.test(r.cssText)); });
      ok(reduced, "reduced motion is honored in the module's CSS");
      await ctx.close();
      // welcome setup: the last page offers it
      const c2 = await browser.newContext({viewport: {width: 1280, height: 900}});
      await c2.addInitScript(() => { try { localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); } catch (e) {} });
      const p2 = await c2.newPage(); p2.errs = []; p2.on("pageerror", e => p2.errs.push(e.message)); await p2.goto(base);
      await p2.waitForSelector(".sheet.ob", {timeout: 8000});
      for (let i = 0; i < 8; i++) { await p2.click('[data-ob="next"]'); await p2.waitForTimeout(150); }
      await p2.waitForSelector('[data-ob="semester"]');
      await p2.click('[data-ob="semester"]');
      await p2.waitForSelector(".sem-sheet .sem-h");
      ok(true, "the welcome setup's last page opens the semester flow");
      ok(p2.errs.length === 0, "no errors from the welcome setup handoff " + JSON.stringify(p2.errs.slice(0, 3)));
      await c2.close();
    }
  } finally { await browser.close(); server.close(); }
  console.log(`\n${n} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
