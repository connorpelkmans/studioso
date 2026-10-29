// Planning quality-of-life fixes: task sheet, Task Board, quick add, Today's Plan, Calendar
const {chromium, executablePath} = require("./pw");
const path = require("path"), fs = require("fs"), http = require("http");
const ROOT = path.join(__dirname, "..");
const MIME = {".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".webmanifest": "application/manifest+json", ".css": "text/css", ".png": "image/png", ".svg": "image/svg+xml", ".woff2": "font/woff2"};
const server = http.createServer((req, res) => {
  let f; try { f = path.join(ROOT, decodeURIComponent(new URL(req.url, "http://x").pathname)); } catch (e) { res.writeHead(400); res.end(); return; }
  if (!f.startsWith(ROOT + path.sep) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
let checks = 0; const ok = (c, m) => { checks++; if (!c) { console.log("FAIL:", m); process.exitCode = 1; } else console.log("ok -", m); };
const COURSES = [{id: "c1", name: "Intro Biology", code: "BIO 101", color: "#4F8A5B", aliases: ["bio"]}, {id: "c2", name: "Intro Programming", code: "CS 110", color: "#2F6FE4"}];
const T = (id, title, cid, type, due, o) => Object.assign({id, title, courseId: cid, type, start: "2026-10-01", due, time: "", priority: "med", status: "todo", notes: "", hours: 2, checklist: [], pct: 0, dependsOn: [], history: [], created: 1}, o || {});
// Today is Friday 2026-10-23, 11:00 in New York
const TASKS = [T("t1", "Lab report 4", "c1", "Lab", "2026-10-23", {time: "17:00"}), T("t2", "Problem set 6", "c2", "Assignment", "2026-10-26", {hours: 4}),
  T("t3", "Quiz 3", "c1", "Quiz", "2026-10-21", {time: "10:00", hours: null, remote: "no", remoteSrc: "user"}), T("t4", "Midterm", "c2", "Exam", "2026-10-29", {time: "09:00", hours: null, remote: "no", remoteSrc: "user"}),
  T("t5", "Essay draft", "c1", "Assignment", "2026-10-20", {hours: 3}), T("t6", "Read ch 5", "c1", "Reading", "2026-10-24", {hours: 1.5}), T("t7", "Project proposal", "c2", "Project", "2026-11-04", {hours: 6})];
const seed = ([tasks, courses]) => {
  localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("studioso:tour", "done"); localStorage.setItem("sb:onboarded", "1");
  if (!localStorage.getItem("coursework:v2")) localStorage.setItem("coursework:v2", JSON.stringify({v: 2, courses, tasks, files: [], notes: [], decks: [], events: [], settings: {capacity: 15, dailyHours: 4}, updated: 1}));
};
const stored = p => p.evaluate(() => JSON.parse(localStorage.getItem("coursework:v2")).tasks);
const task = async (p, id) => (await stored(p)).find(t => t.id === id);
const wait = ms => new Promise(r => setTimeout(r, ms));
async function open(browser, W, opts = {}){
  const phone = W < 600;
  const ctx = await browser.newContext({viewport: {width: W, height: phone ? 844 : 900}, timezoneId: "America/New_York", locale: "en-US", serviceWorkers: "block", hasTouch: phone, isMobile: phone, colorScheme: opts.dark ? "dark" : "light"});
  const p = await ctx.newPage(), errs = []; p.on("pageerror", e => errs.push(e.message));
  await p.clock.install({time: new Date("2026-10-23T11:00:00-04:00")});
  await p.addInitScript(seed, [opts.tasks || TASKS, COURSES]);
  await p.goto("http://127.0.0.1:" + server.address().port + "/index.html");
  await p.waitForFunction(() => window.__sbAvail && window.SBCAPTURE && document.readyState === "complete", null, {timeout: 20000});
  await p.evaluate(() => { try { localStorage.setItem("coursework:group", "none"); } catch (e) {} });
  p.errs = errs;
  return {ctx, p};
}
const view = async (p, o) => { await p.evaluate(o => window.__sbAvail.view(o), o); await p.evaluate(() => document.querySelectorAll("details.col-more").forEach(d => { d.open = true; })); await wait(50); };
const typeAdd = async (p, text) => { await p.fill("#qaIn", text); await p.click('#qaForm button[type="submit"]'); await wait(400); };

(async () => {
  await new Promise(r => server.listen(0, "127.0.0.1", r));
  const browser = await chromium.launch({executablePath});
  try {
    /* desktop */
    {
      const {ctx, p} = await open(browser, 1280);
      // 3, 4, 18: quick add reads like Quick Capture
      await view(p, {tab: "board", bview: "plan"});
      await p.fill("#qaIn", "study for midterm 2 hrs tomorrow");
      ok(/Will add: Study for midterm · tomorrow · 2h/.test(await p.textContent("#qaLive")), "10: the add bar says what it will add as you type: " + await p.textContent("#qaLive"));
      await p.click('#qaForm button[type="submit"]'); await wait(400);
      let made = (await stored(p)).find(t => t.title === "Study for midterm");
      ok(made && made.type === "Study" && made.hours === 2 && made.due === "2026-10-24", "3: studying for a midterm is a Study task and keeps its 2 hours: " + JSON.stringify(made && {type: made.type, hours: made.hours, due: made.due}));
      await p.evaluate(() => localStorage.setItem("studyboard:cap:prefs", JSON.stringify({auto: false})));
      const same = [];
      for (const s of ["bio quiz fri 2pm", "due next tuesday essay", "Cs110 project fri"]) {
        await typeAdd(p, s); await p.waitForSelector(".qa-preview");
        same.push(await p.evaluate(s => { const v = k => document.querySelector(`.qa-item [data-qa="${k}"]`).value, b = SBCAPTURE.parse(s).drafts[0]; return [s, v("due"), b.due, v("title"), b.title, v("courseId"), b.courseId]; }, s));
        await p.click('[data-act="qa-cancel"]'); await wait(150);
      }
      await p.evaluate(() => localStorage.removeItem("studyboard:cap:prefs")); await p.fill("#qaIn", "");
      ok(same.every(r => r[1] === r[2] && r[3] === r[4] && r[5] === r[6]), "4: the add bar and Quick Capture read dates, titles and courses the same way: " + JSON.stringify(same));
      ok(same[0][1] === "2026-10-30" && same[1][1] === "2026-10-27", "4: one weekday rule (fri on a Friday is next week, next tuesday is the coming week's)");
      ok(same[0][3] === "Quiz" && same[0][5] === "c1" && same[2][3] === "Project" && same[2][5] === "c2", "18: the matched course word is taken out of the title");
      // 19: exam toast has Edit
      await typeAdd(p, "cs110 quiz wed 2pm");
      ok(/Plan My Prep/.test(await p.textContent("#toastExtra")) && await p.isVisible("#toastExtra2") && /Edit/.test(await p.textContent("#toastExtra2")) && await p.isVisible("#toastUndo"), "19: the exam or quiz toast offers Plan My Prep, Edit and Undo");
      await p.click("#toastExtra2"); await p.waitForSelector("#dlg[open] form");
      ok(/Quiz/.test(await p.inputValue('#dlg input[name="title"]')), "19: Edit opens the new quiz");
      await p.keyboard.press("Escape"); await wait(200);
      ok(!(await p.evaluate(() => document.querySelector("#dlg").open)), "1: an unchanged sheet closes on Escape without asking");
      // 8: preview Escape and past date
      await typeAdd(p, "bio essay 10/20");
      ok(await p.isVisible(".qa-preview") && await p.isVisible(".qa-item .qa-past"), "8: a past date shows a hint in the preview");
      await p.fill('.qa-item input[data-qa="due"]', "2026-11-02"); await p.dispatchEvent('.qa-item input[data-qa="due"]', "change");
      ok(!(await p.isVisible(".qa-item .qa-past")), "8: picking a future date clears the hint");
      await p.focus('.qa-item input[data-qa="title"]'); await p.keyboard.press("Escape"); await wait(200);
      ok(!(await p.locator(".qa-preview").count()) && await p.evaluate(() => document.activeElement && document.activeElement.id === "qaIn"), "8: Escape cancels the preview and goes back to the add bar");

      // 5, 20: new task sheet
      await p.fill("#qaIn", ""); await p.click("#fab"); await p.waitForSelector("#dlg[open] form");
      ok(await p.evaluate(() => { const d = document.querySelector('#dlg input[name="due"]').closest(".two"), t = document.querySelector('#dlg input[name="time"]'); return !!t && d.contains(t) && !t.closest("details"); }), "5: Due Time sits next to Due Date, outside Advanced Settings");
      ok(await p.evaluate(() => document.querySelector("#statusFs").hidden && document.querySelector("#pctWrap").hidden), "5: a new task doesn't show Status or Progress");
      ok(await p.evaluate(() => !document.querySelector('#dlg select[name="repeat"]').closest("details")), "20: Repeat is with the dates, not under Advanced");
      await p.fill('#dlg input[name="title"]', "Weekly reflection"); await p.fill('#dlg input[name="due"]', "2026-10-28"); await p.dispatchEvent('#dlg input[name="due"]', "change");
      await p.selectOption('#dlg select[name="repeat"]', "7");
      ok(await p.inputValue('#dlg input[name="until"]') === "2026-12-15" && /6 more/.test(await p.textContent("#untilHint")), "20: the end date defaults to the end of term: " + await p.inputValue('#dlg input[name="until"]'));
      // 1: a changed sheet asks first
      await p.keyboard.press("Escape"); await p.waitForSelector("#askDlg[open]");
      ok(/Discard/.test(await p.textContent("#askDlg")), "1: Escape on a changed sheet asks before discarding");
      await p.click("#askNo"); await wait(150);
      ok(await p.evaluate(() => document.querySelector("#dlg").open) && await p.inputValue('#dlg input[name="title"]') === "Weekly reflection", "1: Keep Editing keeps what you typed");
      await p.mouse.click(5, 450); await p.waitForSelector("#askDlg[open]");
      ok(true, "1: tapping outside a changed sheet asks too");
      await p.click("#askNo"); await wait(150);
      await p.click('#dlg [data-submit]'); await wait(300);
      ok((await stored(p)).filter(t => t.title === "Weekly reflection").length === 7, "20: weekly until the end of term makes 7 tasks");
      // 20: repeat when editing
      await view(p, {tab: "board", bview: "board"});
      await p.click('.card[data-id="t6"]');
      ok(await p.evaluate(() => document.querySelector("#dlg").open), "12: a board card opens right away on one click");
      await p.click("#dlg #tvEdit"); await p.waitForSelector('#dlg select[name="repeat"]');
      await p.selectOption('#dlg select[name="repeat"]', "14"); await p.fill('#dlg input[name="until"]', "2026-11-21"); await p.dispatchEvent('#dlg input[name="until"]', "input");
      await p.click('#dlg [data-submit]'); await wait(300);
      const reads = (await stored(p)).filter(t => t.title === "Read ch 5").map(t => t.due).sort();
      ok(JSON.stringify(reads) === JSON.stringify(["2026-10-24", "2026-11-07", "2026-11-21"]), "20: repeat can be set on an existing task: " + reads.join(", "));
      // 2: complete from a board card
      await p.click('.card[data-id="t2"] .card-check'); await wait(300);
      ok((await task(p, "t2")).status === "done" && !(await p.evaluate(() => document.querySelector("#dlg").open)), "2: the round check on a card completes it without opening it");
      await p.focus('.card[data-id="t7"] .card-check'); await p.keyboard.press("Enter"); await wait(300);
      ok((await task(p, "t7")).status === "done", "2: the check works from the keyboard");
      // 11: Ctrl+Z steps back through recent changes
      await p.click("body", {position: {x: 700, y: 20}}).catch(() => {});
      await p.keyboard.press("Control+z"); await wait(250);
      ok((await task(p, "t7")).status !== "done", "11: Ctrl+Z undoes the last change");
      await p.keyboard.press("Control+z"); await wait(250);
      ok((await task(p, "t2")).status !== "done", "11: and again undoes the one before it");
      await p.focus("#qaIn"); await p.keyboard.type("abc"); await p.keyboard.press("Control+z"); await wait(200);
      ok((await stored(p)).filter(t => t.title === "Read ch 5").length === 3, "11: Ctrl+Z while typing in a field is left to the field");
      await p.fill("#qaIn", "");
      // 11: the toast waits while you point at it
      await p.clock.runFor(10000);
      await p.click('.card[data-id="t5"]'); await p.click("#dlg #tvEdit"); await p.waitForSelector("#dlg[open] form"); await p.click('#dlg [data-act="delete-task"]'); await wait(200);
      const shown = () => p.evaluate(() => document.querySelector("#toast").classList.contains("show") && /^Deleted/.test(document.querySelector("#toastMsg").textContent));
      await p.clock.runFor(1000); await p.hover("#toast"); await p.clock.runFor(12000);
      ok(await shown(), "11: the Undo toast stays while the pointer is on it");
      await p.mouse.move(640, 300); await p.clock.runFor(9000);
      ok(!(await shown()), "11: and goes once the pointer leaves");
      await p.keyboard.press("Control+z"); await wait(250);
      ok((await stored(p)).some(t => t.id === "t5"), "11: Ctrl+Z still undoes the delete after the toast has gone");

      // 6, 17, 21, 22: Today's Plan
      await view(p, {tab: "board", bview: "plan"});
      ok(await p.isVisible(".plan-past") && /Did you take/.test(await p.textContent(".plan-past")) && /Quiz 3/.test(await p.textContent(".plan-past")), "6: a past quiz not marked done asks if you took it");
      const tile = await p.textContent('[data-act="plan-tile"][data-id="late"] b');
      const lateOnBoard = (await stored(p)).filter(t => t.status !== "done" && t.due && t.due < "2026-10-23").length;
      ok(Number(tile) === lateOnBoard, `6: the Overdue tile counts what the Board shows late (${tile} vs ${lateOnBoard})`);
      ok(/^From now to (the end of today|Fri, Oct 23)/.test((await p.textContent(".pn-warn .pn-main")).trim()), "17: the plan warning names its time window");
      ok(/today/.test(await p.textContent(".plan-row .alloc")), "21: a row's suggested time is labeled as today's");
      ok(/\+\d+ more/.test(await p.textContent(".plan-row .pr-n")), "21: the extra-reasons chip says how many more reasons");
      ok(await p.locator(".rb .rb-day").count() === 14 && /Today/i.test(await p.textContent(".rb-col.is-today .rb-day")), "21: the ribbon shows two weeks, today first");
      const hit = await p.evaluate(() => [...document.querySelectorAll(".pt-adj .icon-btn")].map(b => { const r = b.getBoundingClientRect(), a = getComputedStyle(b, "::after"); return r.width - parseFloat(a.left) - parseFloat(a.right); }));
      ok(hit.length === 2 && hit.every(w => w >= 40), `9: the Planned Today buttons have a 40px tap area: ${hit.join(", ")}`);
      if (Number(tile) > 0) {
        await p.click('[data-act="plan-tile"][data-id="late"]'); await wait(300);
        ok(await p.evaluate(() => document.querySelector('[data-act="plan-tile"][data-id="late"]').getAttribute("aria-pressed") === "true") && (await p.locator("#planListLbl", {hasText: "Overdue"}).count() === 1 || await p.isVisible(".plan-past")), "21: the overdue badge on Today filters the list");
        await p.click('[data-act="plan-tile"][data-id=""]'); await wait(300);
      }
      const days = await p.locator(".rb-day").evaluateAll(b => b.map(x => x.dataset.id.slice(2))), openT = (await stored(p)).filter(t => t.status !== "done");
      const day = days.slice(1).find(d => openT.some(t => t.due === d)) || days[1], dueThen = openT.filter(t => t.due === day).length;
      await p.click(`.rb-day[data-id="d:${day}"]`); await wait(300);
      ok(await p.getAttribute(`.rb-day[data-id="d:${day}"]`, "aria-pressed") === "true" && (dueThen ? await p.locator("#planListLbl", {hasText: /^Due /}).count() === 1 && await p.locator(".plan-list").first().locator(".plan-row").count() === dueThen : /Nothing due that day/.test(await p.textContent(".plan"))), `21: a day card filters the list to that day (${dueThen} due)`);
      await p.click('[data-act="plan-tile"][data-id=""]'); await wait(300);
      ok(!(await p.locator("#planListLbl", {hasText: /^Due /}).count()), "21: Back to Today's Plan clears the filter");
      const first = await p.getAttribute(".next-up .nu-title", "data-id");
      await p.evaluate(() => { const b = document.createElement("button"), pb = document.querySelector(".next-up [data-act=pomo-task]"), id = document.querySelector(".next-up .nu-title").dataset.id; b.dataset.act = "nu-skip"; b.dataset.id = pb && pb.dataset.study ? "study:" + id : id; b.hidden = true; document.body.appendChild(b); b.click(); b.remove(); }); await wait(200);
      ok(await p.getAttribute(".next-up .nu-title", "data-id") !== first, "22: skipping picks another task");
      await p.click('.next-up [data-act="nu-back"]'); await wait(200);
      ok(await p.getAttribute(".next-up .nu-title", "data-id") === first && !(await p.locator('.next-up [data-act="nu-back"]').count()), "22: Go Back returns to the first pick");
      await p.click('.plan-past [data-act="toggle"]'); await wait(300);
      ok((await task(p, "t3")).status === "done", "6: Mark Done on the question completes the quiz");
      // 23: tabs work with arrow keys
      const tabs = await p.locator(".pt-tab").count();
      if (tabs > 1) {
        await p.focus('.pt-tab[aria-selected="true"]'); const k0 = await p.evaluate(() => document.activeElement.dataset.k);
        await p.keyboard.press("ArrowRight"); await wait(100);
        const k1 = await p.evaluate(() => document.activeElement.dataset.k + "|" + document.activeElement.getAttribute("aria-selected"));
        ok(k1.split("|")[0] !== k0 && k1.endsWith("|true"), "23: ArrowRight moves to and selects the next tab");
      } else ok(true, "23: only one tab here");

      // 14: Break It Down needs hours, and can be waved off
      await view(p, {tab: "board", bview: "board"});
      await p.click('.card[data-id="t1"]'); await p.waitForSelector("#dlg[open] form");
      ok(!(await p.locator("#dlg .bd-panel.offer").count()), "14: a 2-hour lab report doesn't get the big-task banner from its name alone");
      await p.keyboard.press("Escape"); await wait(200);
      if ((await task(p, "t2")).status === "done") { await p.click('.card[data-id="t2"] .card-check'); await wait(300); }
      await p.click('.card[data-id="t2"]'); await p.waitForSelector("#dlg[open] form");
      ok(await p.locator("#dlg .bd-panel.offer").count() === 1, "14: a 4-hour assignment gets the banner");
      await p.click('#dlg [data-act="bd-no"]'); await wait(200);
      ok(!(await p.locator("#dlg .bd-panel.offer").count()) && await p.locator('#dlg .bd-new-link [data-act="bd-open"]').count() === 1, "14: dismissing it leaves the quiet link");
      await p.keyboard.press("Escape"); await wait(200);
      await p.click('.card[data-id="t2"]'); await p.waitForSelector("#dlg[open] form");
      ok(!(await p.locator("#dlg .bd-panel.offer").count()), "14: the dismissal is remembered for that task");
      await p.keyboard.press("Escape"); await wait(200);

      // 15: the add button keeps its "Add Task" label, and content clears it
      ok(await p.evaluate(() => /Add Task/.test(document.querySelector("#fab").textContent) && document.querySelector("#fab span").getBoundingClientRect().width > 20), "15: the floating button says Add Task");
      ok(await p.evaluate(() => { const f = document.querySelector("#fab").getBoundingClientRect(), w = parseFloat(getComputedStyle(document.querySelector(".wrap")).paddingBottom); return w >= innerHeight - f.top + 8; }), "15: the page leaves room under the content for the floating button");

      // 7, 13, 25: Calendar
      await view(p, {tab: "timeline"});
      ok(await p.textContent('[data-act="plan-view"][data-id="timeline"]') === "Due Dates" && /Timeline/.test(await p.textContent('[data-act="tl-mode"][data-id="bars"]')) && /Month/.test(await p.textContent('[data-act="tl-mode"][data-id="calendar"]')), "25: one set of names: Due Dates, with Timeline and Month");
      await p.click('[data-act="tl-mode"][data-id="calendar"]'); await wait(200);
      ok(await p.isVisible('.cal .day[data-id="2026-10-20"] .ci-t') && /Essay draft/.test(await p.textContent('.cal .day[data-id="2026-10-20"] .ci-t')), "7: a desktop month cell shows the task's title");
      ok(await p.locator('.cal .day[data-id="2026-10-20"] .ci-row.late').count() === 1 && /overdue/.test(await p.getAttribute('.cal .day[data-id="2026-10-20"]', "aria-label")), "7: an overdue task is marked");
      await p.reload(); await p.waitForFunction(() => window.__sbAvail && document.readyState === "complete");
      await view(p, {tab: "timeline"}); await wait(200);
      ok(await p.locator(".cal").count() === 1, "13: the Month choice is remembered after a reload");
      await p.click('[data-act="tl-mode"][data-id="bars"]'); await p.click('[data-act="tl-zoom"][data-id="term"]');
      await p.reload(); await p.waitForFunction(() => window.__sbAvail && document.readyState === "complete");
      await view(p, {tab: "timeline"}); await wait(200);
      ok(await p.locator(".tl").count() === 1 && await p.getAttribute('[data-act="tl-zoom"][data-id="term"]', "aria-pressed") === "true", "13: Timeline and its zoom are remembered too");

      // 16: Schedule without class times
      await view(p, {tab: "schedule"});
      ok(await p.isVisible(".sch-setup") && await p.isVisible(".sch-grid") && await p.locator(".sch-grid .sch-chip, .sch-grid .sch-exam").count() > 0, "16: the week shows its deadlines with a setup banner when there are no class times");
      ok(!p.errs.length, "no page errors: " + p.errs.join(" | "));
      await ctx.close();
    }
    /* phone */
    for (const dark of [false, true]) {
      const {ctx, p} = await open(browser, 390, {dark});
      const tag = dark ? "phone dark" : "phone";
      await view(p, {tab: "board", bview: "plan"});
      ok(await p.evaluate(() => [...document.querySelectorAll(".plan .pt-stats, .plan .rb, .plan .pt-hours")].every(e => !e.offsetWidth && !e.offsetHeight)), `${tag}: no strip above Do This Next on a phone`);
      ok(await p.evaluate(() => { const b = document.querySelector(".pt-bar"); return !b || b.scrollWidth <= b.clientWidth + 1; }), `23 (${tag}): every Today's Plan tab fits without hidden scrolling`);
      await p.click(".next-up .check"); await wait(1500);
      const r = await p.evaluate(() => { const a = document.querySelector("#accChip"), t = document.querySelector("#toast"); if (!a || a.hidden || !t.classList.contains("show")) return null; const x = a.getBoundingClientRect(), y = t.getBoundingClientRect(); return {chip: [x.top, x.bottom], toast: [y.top, y.bottom]}; });
      ok(!r || r.chip[1] <= r.toast[0] || r.toast[1] <= r.chip[0], `24 (${tag}): the Undo toast and How Long Did It Take don't overlap: ` + JSON.stringify(r));
      await view(p, {tab: "board", bview: "board"});
      const tap = await p.evaluate(() => { const b = document.querySelector(".card .card-check"), r = b.getBoundingClientRect(), a = getComputedStyle(b, "::after"); return r.width - parseFloat(a.left) - parseFloat(a.right); });
      ok(tap >= 40, `2 (${tag}): the card check has a 40px tap area: ${tap}`);
      await p.tap('.card[data-id="t6"] .card-check'); await wait(300);
      ok((await task(p, "t6")).status === "done", `2 (${tag}): tapping the card check completes it`);
      ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${tag}: no sideways page scroll`);
      ok(!p.errs.length, `${tag}: no page errors: ` + p.errs.join(" | "));
      await ctx.close();
    }
  } catch (e) { console.error(e); process.exitCode = 1; }
  await browser.close(); server.close();
  console.log(`qol-planning.e2e: ${checks} checks ${process.exitCode ? "FAILED" : "passed"}`);
})();
