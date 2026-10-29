// node tests/autopilot.e2e.js (Playwright + Chromium; see tests/pw.js) Autopilot (Pro): the daily run on the first open of a day,
// the line on Today's Plan, See What Changed, Undo, Ask Me First, Off, Day Off, no re-run on reload, the locked and free paths
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const csp = require("../scripts/csp");
const root = path.join(__dirname, "..");
// Served with Pro enforcement off (everything unlocked), like the other Pro tests; "studyboard:paywall-test" turns it back on
const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x"); let p = decodeURIComponent(u.pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  const ext = path.extname(f), mime = {".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".css": "text/css", ".webmanifest": "application/manifest+json"};
  res.writeHead(200, {"content-type": mime[ext] || "application/octet-stream"});
  if (p === "/index.html" || /^\/bundle\/[^/]+\.js$/.test(p)) { res.end((/\.html$/.test(p) ? csp.apply : String)(fs.readFileSync(f, "utf8").replace("const PRO_ENFORCED = true;", "const PRO_ENFORCED = false;"))); return; }
  fs.createReadStream(f).pipe(res);
});
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };

// Wednesday 4 November 2026, 7:30 AM in New York, the first open of the day. A biology midterm on the 10th with a prep plan whose
// Monday and Tuesday sessions were missed; a research paper broken into milestones whose outline (Tuesday) passed; an overdue Study
// task; a lab report due yesterday that must not move; school-synced items; availability with a placement filling Friday.
const NOW = "2026-11-04T07:30:00-05:00";
const SEED = ([mode, free, elsewhere]) => {
  const t = (id, o) => Object.assign({id, title: id, courseId: "bio", type: "Assignment", start: "", due: "", time: "", priority: "med", status: "todo", notes: "", hours: null, checklist: [], pct: 0, dependsOn: [], history: [], created: 1}, o);
  const sess = (id, due, topicId, topic, kind, extra) => t(id, Object.assign({title: `BIO101 Biology Midterm: ${topic} (${kind})`, type: "Study", start: due, due, hours: 0.75, prepFor: "ex", topicId, topic, kind, studyKind: kind}, extra));
  try {
    localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("studioso:tour", "done"); localStorage.setItem("studyboard:tour", "done"); localStorage.setItem("sb:onboarded", "1");
    if (free) localStorage.setItem("studyboard:paywall-test", "1");
    if (localStorage.getItem("coursework:v2")) return;
    const blocks = [{id: "pl", type: "shift", title: "Placement", days: [5], start: "07:00", end: "23:00"}];
    const settings = Object.assign({capacity: 15, dailyHours: 3, avail: {v: 1, blocks, cfg: {}}}, mode ? {autopilot: {mode}} : {});
    // Another device already ran today: its mark arrived with the synced settings
    if (elsewhere) settings.autopilot = {run: {day: "2026-11-04", id: "other-device", kind: "done", n: 0, moves: [], short: [], seen: false, at: 1}};
    localStorage.setItem("coursework:v2", JSON.stringify({v: 2, courses: [{id: "bio", name: "Biology", code: "BIO101", color: "#4F8A5B"}, {id: "his", name: "History", code: "HIS200", color: "#8A4F6B"}],
      tasks: [
        t("ex", {title: "Biology Midterm", type: "Exam", due: "2026-11-10", time: "09:00", prep: {v: 1, topics: [{id: "tA", name: "Cell biology", conf: "weak", links: []}, {id: "tB", name: "Genetics", conf: "ok", links: []}], intensity: 90, style: [], days: null, examDue: "2026-11-10", createdAt: 1}, planTopics: [{name: "Cell biology", conf: "weak"}, {name: "Genetics", conf: "ok"}]}),
        sess("s1", "2026-11-02", "tA", "Cell biology", "learn"), sess("s2", "2026-11-03", "tB", "Genetics", "learn"), sess("s3", "2026-11-05", "tA", "Cell biology", "cards"),
        sess("s4", "2026-11-07", "tB", "Genetics", "questions"), sess("s5", "2026-11-09", "tA", "Cell biology", "recap"),
        t("paper", {title: "Research Paper", courseId: "his", due: "2026-11-12", breakdownParent: true, bdDue: "2026-11-12", bdHours: 8, hours: 8}),
        t("m1", {title: "Find sources", courseId: "his", type: "Reading", due: "2026-11-01", start: "2026-11-01", breakdownOf: "paper", step: "1/4", hours: 2, status: "done", doneAt: 1}),
        t("m2", {title: "Outline the argument", courseId: "his", type: "Project", due: "2026-11-03", start: "2026-11-03", breakdownOf: "paper", step: "2/4", hours: 1.5}),
        t("m3", {title: "Write the first draft", courseId: "his", type: "Project", due: "2026-11-07", start: "2026-11-07", breakdownOf: "paper", step: "3/4", hours: 3}),
        t("m4", {title: "Revise and cite", courseId: "his", type: "Project", due: "2026-11-10", start: "2026-11-10", breakdownOf: "paper", step: "4/4", hours: 1.5}),
        t("st", {title: "Review lecture 7", type: "Study", due: "2026-11-03", hours: 1}),
        t("lab", {title: "Lab Report 3", due: "2026-11-03", hours: 3}),
        t("lms", {title: "Canvas practice set", type: "Study", due: "2026-11-02", hours: 1, cv: {id: "c9", course: "bio"}}),
        t("lms2", {title: "D2L Reading Quiz", type: "Quiz", due: "2026-11-03", bs: {id: "q4", ou: "1"}})
      ], files: [], notes: [], decks: [], events: [], settings, updated: 1}));
  } catch (e) {}
};
const SOFT = ["s1", "s2", "s3", "s4", "s5", "m2", "m3", "m4", "st"], FIXED = ["lab", "lms", "lms2", "paper", "m1"];

(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  const open = async (o = {}) => {
    const ctx = await browser.newContext({viewport: {width: o.w || 390, height: 844}, timezoneId: "America/New_York", locale: "en-US"});
    const p = await ctx.newPage(); p.errs = [];
    p.on("pageerror", e => p.errs.push(e.message)); p.on("console", m => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) p.errs.push(m.text()); });
    // The clock stands still until the test moves it, so the state before the run can be read
    await p.clock.install({time: new Date(new Date(NOW).getTime() - 1000)}); await p.clock.pauseAt(new Date(NOW));
    await p.addInitScript(SEED, [o.mode || "", !!o.free, !!o.elsewhere]);
    await p.goto(base); await p.waitForSelector("#view", {state: "attached"});
    await p.clock.runFor(1500); await settle(p, 200);
    p.pre = await tasks(p); p.preRun = ((await settings(p)).autopilot || {}).run || null;
    await p.clock.runFor(3000); await settle(p, 300);
    return p;
  };
  // The page's clock is paused: move it on so timers (renders, toasts) run
  const settle = async (p, ms) => { await p.clock.runFor(ms); await p.waitForTimeout(60); };
  const tasks = p => p.evaluate(() => JSON.parse(JSON.stringify(window.__sbBreakdown.state().tasks)));
  const settings = p => p.evaluate(() => JSON.parse(JSON.stringify(window.__sbBreakdown.state().settings)));
  const act = (p, a, id) => p.evaluate(([a, id]) => { const b = document.createElement("button"); b.dataset.act = a; if (id) b.dataset.id = id; b.style.display = "none"; document.body.appendChild(b); b.click(); b.remove(); }, [a, id]);
  const line = async p => { const l = p.locator(".plan .ap-line:not(.ap-offday)"); return await l.count() ? (await l.first().textContent()).replace(/\s+/g, " ").trim() : ""; };
  const overflow = p => p.evaluate(() => Math.max(document.documentElement.scrollWidth - document.documentElement.clientWidth, (() => { const d = document.querySelector("dialog[open] .sheet-body"); return d ? d.scrollWidth - d.clientWidth : 0; })()));
  const same = (a, b, ids) => ids.every(id => JSON.stringify(a[id]) === JSON.stringify(b[id]));
  const behindCard = p => p.evaluate(() => !!document.querySelector('.pp-today-row[data-kind="behind"]'));
  try {
    /* ---- On (the default for Pro) ---- */
    const p = await open();
    ok(p.pre.s1.due === "2026-11-02" && p.pre.m2.due === "2026-11-03" && !p.preRun, "before the run: the seeded plan, nothing has run");
    const T = await tasks(p), st = await settings(p), run = st.autopilot && st.autopilot.run;
    ok(run && run.day === "2026-11-04" && run.kind === "done" && run.id, "the run is marked for today in synced settings: " + JSON.stringify(run && {day: run.day, kind: run.kind, n: run.n}));
    ok(same(p.pre, T, FIXED) && T.ex.due === p.pre.ex.due && T.ex.time === p.pre.ex.time, "the exam's date, the lab report due yesterday, school-synced items and the paper's own due date are untouched");
    const prep = Object.values(T).filter(x => x.prepFor === "ex" && x.status !== "done");
    ok(prep.length >= 3 && prep.every(x => x.due >= "2026-11-04" && x.due < "2026-11-10"), "every prep session is now between today and the exam: " + prep.map(x => x.due).join(","));
    ok(prep.every(x => x.due !== "2026-11-06"), "none on the placement day");
    ok(T.m2.due >= "2026-11-04" && T.m2.due <= "2026-11-07" && T.m2.start === T.m2.due, "the passed milestone moved into free time before the next step: " + T.m2.due);
    ok(T.m3.due === "2026-11-07" && T.m4.due === "2026-11-10", "the on-track milestones stayed");
    ok(T.st.due >= "2026-11-04" && T.st.due !== "2026-11-06", "the overdue Study task got a free day: " + T.st.due);
    ok(T.ex.prep.examDue === "2026-11-10" && T.ex.due === "2026-11-10", "the exam's date is unchanged");
    const L = await line(p), m = /^Autopilot moved (\d+) things? last night\. See What Changed · Undo/.exec(L);
    ok(m && Number(m[1]) === run.n && run.n >= 3, "the line at the top of Today's Plan, with the right count: " + L);
    ok(!(await behindCard(p)), "the Catch Up card it already handled is gone");
    ok(await overflow(p) <= 0, "no horizontal overflow at 390px (Today's Plan)");

    // See What Changed lists each move, from → to and why
    await p.click('.ap-line [data-act="ap-open"]'); await p.waitForSelector("dialog[open] .ap-sheet");
    const rows = await p.locator(".ap-sheet .ap-list li").allTextContents();
    ok(rows.length === run.n, `${rows.length} rows, one per move`);
    ok(rows.some(r => /Review lecture 7/.test(r) && /Tue, Nov 3 → /.test(r) && /Missed, moved to your next free time/.test(r)), "the Study task's row: " + rows.find(r => /Review lecture 7/.test(r)));
    ok(rows.some(r => /Outline the argument/.test(r) && /Missed step, moved to free time before “Research Paper” is due/.test(r)), "the milestone's row names the assignment");
    ok(rows.some(r => /Cell biology \(learn\)/.test(r) && /Mon, Nov 2 → /.test(r) && /Missed, moved to a free day before the exam/.test(r)), "the missed prep session's row");
    ok(!rows.some(r => /Lab Report|Canvas|D2L/.test(r)), "nothing with a real or school date is listed");
    ok(await overflow(p) <= 0, "no horizontal overflow at 390px (What Changed)");
    await p.setViewportSize({width: 1280, height: 900}); await settle(p, 200);
    ok(await overflow(p) <= 0, "no horizontal overflow at 1280px (What Changed)");
    await p.setViewportSize({width: 390, height: 844});
    // Undo All puts every item back exactly
    await p.click('.ap-sheet [data-act="ap-undo"]'); await settle(p, 300);
    const U = await tasks(p);
    ok(Object.keys(U).length === Object.keys(p.pre).length && Object.keys(p.pre).every(id => JSON.stringify(U[id]) === JSON.stringify(p.pre[id])), "Undo restored every task exactly (" + Object.keys(U).length + " tasks)");
    ok(/Undone/.test(await p.locator("#toastMsg").textContent()), "Undo says so");
    ok(await line(p) === "", "the line is gone after Undo");
    // Reload: the same day doesn't run again
    await p.reload(); await p.waitForSelector("#view", {state: "attached"}); await p.clock.runFor(70000); await settle(p, 300);
    const R = await tasks(p);
    ok(same(p.pre, R, Object.keys(p.pre)), "after a reload the same day, nothing moves again");
    ok(await line(p) === "", "and no line");
    ok(!p.errs.length, "no console errors (On): " + p.errs.join(" | "));

    // The next day: it runs once more, on its own
    await p.clock.setSystemTime(new Date("2026-11-05T07:45:00-05:00")); await p.clock.runFor(65000); await settle(p, 300);
    const N = await tasks(p), st2 = await settings(p);
    ok(st2.autopilot.run.day === "2026-11-05" && N.st.due >= "2026-11-05" && N.m2.due >= "2026-11-05", "a new day runs again (fake clock moved to Thursday)");
    ok(/^Autopilot moved \d+ things? last night/.test(await line(p)), "with a new line");
    // The line hides once dismissed
    await p.click('.ap-line [data-act="ap-dismiss"]'); await settle(p, 200);
    ok(await line(p) === "", "dismissed: the line hides");

    // Day Off: today, from Today's Plan's footer. Thursday's sessions and steps move ahead of time; the plan is empty today.
    const before = await tasks(p), onDay = Object.values(before).filter(x => x.due === "2026-11-05" && x.status !== "done" && (x.type === "Study" || x.breakdownOf) && !x.cv).map(x => x.id);
    ok(onDay.length >= 1, "something soft is planned today before the day off: " + onDay.join(","));
    await p.click(".plan-foot .ap-off-btn"); await settle(p, 400);
    const D = await tasks(p);
    const named = ((await settings(p)).autopilot.run.short || []).map(x => x.title);
    const stay = onDay.filter(id => D[id] && D[id].due === "2026-11-05"), toast1 = await p.locator("#toastMsg").textContent();
    ok(onDay.some(id => D[id] && D[id].due !== "2026-11-05"), "sessions and steps planned today moved to other days: " + onDay.map(id => id + "→" + (D[id] && D[id].due)).join(", "));
    ok(stay.every(id => /couldn't move/.test(toast1) || toast1.includes("“" + D[id].title + "” couldn't move") || named.includes(D[id].title)), "anything that couldn't fit before its deadline is named, not squeezed: " + stay.join(","));
    ok(same(before, D, ["lab", "lms", "lms2", "paper"]) && D.ex.due === "2026-11-10", "real dates stay on a day off");
    ok(/Today is a day off\. Moved \d+ things? to other days\./.test(await p.locator("#toastMsg").textContent()), "the toast says what moved, with Undo: " + await p.locator("#toastMsg").textContent());
    ok(await p.locator(".plan .ap-offday").count() === 1 && await p.evaluate(() => [...document.querySelectorAll(".plan .plan-list li")].filter(li => !li.closest("#plan-more") && li.offsetParent).length) === 0 && await p.locator(".plan .next-up").count() === 0, "Today's Plan plans nothing today");
    ok(await p.evaluate(() => { const F = window.__sbPlan(); return F.th === 0 && F.ranked.every(x => !(x.alloc > 0)); }), "zero study time today: nothing is allocated");
    ok(await p.evaluate(() => !!window.SBSTREAK.state().cfg.rests["2026-11-05"]), "the Gentle Streak counts it as a rest day");
    ok(await p.locator(".plan-foot .ap-off-btn").textContent() === "Undo Day Off", "the footer button turns into Undo Day Off");
    ok(await overflow(p) <= 0, "no horizontal overflow at 390px (day off)");
    await p.setViewportSize({width: 1280, height: 900}); await settle(p, 200);
    ok(await overflow(p) <= 0, "no horizontal overflow at 1280px (Today's Plan)");
    await p.setViewportSize({width: 390, height: 844});
    await p.click(".plan .ap-offday [data-act=\"ap-dayoff\"]"); await settle(p, 300);
    ok(await p.locator(".plan .ap-offday").count() === 0 && !(await settings(p)).daysOff["2026-11-05"], "Undo Day Off makes it a study day again");

    // A future day off from the Calendar's day sheet: Saturday the 7th
    const b7 = await tasks(p), sat = Object.values(b7).filter(x => x.due === "2026-11-07" && x.status !== "done" && (x.prepFor || x.breakdownOf)).map(x => x.id);
    await act(p, "cr-day", "2026-11-07"); await p.waitForSelector("dialog[open] .cr-sheet .ap-dayrow");
    await p.click(".cr-sheet .ap-dayrow button"); await settle(p, 500);
    const A7 = await tasks(p);
    ok(sat.length >= 1 && sat.every(id => !A7[id] || A7[id].due !== "2026-11-07"), "Saturday's sessions and steps moved off it: " + sat.join(","));
    ok(A7.m3 && A7.m3.due < "2026-11-10" && A7.m3.due >= "2026-11-05", "the draft milestone is still before the next step: " + (A7.m3 && A7.m3.due));
    ok(await p.locator(".cr-sheet .ap-dayrow button").textContent() === "Undo Day Off", "the day sheet shows it as a day off");
    const draftRow = await p.locator(".cr-sheet .cr-items li", {hasText: "Write the first draft"}).allTextContents();
    ok(draftRow.every(r => !/due Sat, Nov 7/.test(r)), "the redrawn day sheet shows the milestone's new date: " + draftRow.map(r => r.replace(/\s+/g, " ").slice(0, 80)).join(" | "));
    ok(await p.evaluate(() => window.SBCRUNCH ? true : true) && await overflow(p) <= 0, "no horizontal overflow at 390px (Calendar day)");
    ok(!p.errs.length, "no console errors (day off): " + p.errs.join(" | "));

    /* ---- Ask Me First ---- */
    const a = await open({mode: "ask"});
    const AT = await tasks(a);
    ok(same(a.pre, AT, Object.keys(a.pre)), "Ask Me First: nothing moved on its own");
    const al = await line(a);
    ok(/^Autopilot can move \d+ things? to fit your plan\. See What Changes · Apply · Not Now$/.test(al), "it proposes on the same line: " + al);
    await a.click('.ap-line [data-act="ap-open"]'); await a.waitForSelector("dialog[open] .ap-sheet");
    ok(await a.locator(".ap-sheet h2").textContent() === "What Would Change" && await a.locator(".ap-sheet .ap-list li").count() >= 3, "See What Changes lists the proposal");
    await a.click('.ap-sheet [data-act="ap-apply"]'); await settle(a, 400);
    const AA = await tasks(a);
    ok(AA.st.due >= "2026-11-04" && AA.m2.due >= "2026-11-04" && Object.values(AA).filter(x => x.prepFor === "ex" && x.status !== "done").every(x => x.due >= "2026-11-04"), "Apply moves them");
    ok(same(a.pre, AA, FIXED), "and still leaves real dates alone");
    ok(/^Autopilot moved \d+ things? last night\. See What Changed · Undo/.test(await line(a)), "the line now says what moved");
    ok(!a.errs.length, "no console errors (Ask Me First): " + a.errs.join(" | "));

    /* ---- Off ---- */
    const o = await open({mode: "off"});
    ok(same(o.pre, await tasks(o), Object.keys(o.pre)) && await line(o) === "" && !(await settings(o)).autopilot.run, "Off: nothing moves, no line, no run");
    ok(await behindCard(o), "Off: the free Catch Up card is back");
    // The settings row: three choices
    await act(o, "menu"); await settle(o, 300); await o.click('dialog[open] .us-cat[data-us="study"]'); await settle(o, 300);
    ok(await o.locator('dialog[open] [data-act="ap-mode"]').count() === 3 && await o.locator('dialog[open] [data-act="ap-mode"][data-id="off"]').getAttribute("aria-pressed") === "true", "Settings has one Autopilot row with On, Ask Me First and Off");
    await o.click('dialog[open] [data-act="ap-mode"][data-id="on"]'); await settle(o, 200);
    ok((await settings(o)).autopilot.mode === "on" && await o.locator('dialog[open] [data-act="ap-mode"][data-id="on"]').getAttribute("aria-pressed") === "true", "choosing On is saved and shown");
    ok(await overflow(o) <= 0, "no horizontal overflow at 390px (Settings)");
    await o.setViewportSize({width: 1280, height: 900}); await settle(o, 200);
    ok(await overflow(o) <= 0, "no horizontal overflow at 1280px (Settings)");
    ok(!o.errs.length, "no console errors (Off): " + o.errs.join(" | "));

    /* ---- Another device ran today ---- */
    const e = await open({elsewhere: true});
    ok(same(e.pre, await tasks(e), Object.keys(e.pre)) && (await settings(e)).autopilot.run.id === "other-device" && await line(e) === "", "a run mark for today from another device: this one doesn't run again");
    ok(!e.errs.length, "no console errors (other device): " + e.errs.join(" | "));

    /* ---- Locked (free plan, paywall on) ---- */
    const f = await open({free: true});
    ok(same(f.pre, await tasks(f), Object.keys(f.pre)) && await line(f) === "", "locked: nothing moves and no line");
    ok(await behindCard(f), "locked: the free one-tap Catch Up card is exactly as before");
    await act(f, "menu"); await settle(f, 300); await f.click('dialog[open] .us-cat[data-us="study"]'); await settle(f, 300);
    ok(await f.locator('dialog[open] [data-act="ap-pro"] .pro-badge').count() === 1 && await f.locator('dialog[open] [data-act="ap-mode"]').count() === 0, "locked: an Autopilot row with a PRO badge");
    ok(await overflow(f) <= 0, "locked: no horizontal overflow at 390px");
    await f.click('dialog[open] [data-act="ap-pro"]'); await settle(f, 400);
    ok(await f.locator("dialog[open] .plan-sheet").count() === 1, "locked: tapping it opens the Pro sheet");
    await act(f, "close"); await settle(f, 200);
    // Day Off still works for free: zero time today, but nothing moves for you
    const fb = await tasks(f);
    await f.click(".plan-foot .ap-off-btn"); await settle(f, 400);
    ok(same(fb, await tasks(f), Object.keys(fb)), "free: Day Off moves nothing by itself");
    ok(await f.evaluate(() => window.__sbPlan().th === 0) && await f.locator(".plan .ap-offday").count() === 1, "free: it still plans no time today");
    ok(await f.locator("#toastMsg").textContent() === "Today is a day off. Nothing is planned that day.", "free: the toast says so");
    ok(await f.evaluate(() => !!window.SBSTREAK.state().cfg.rests["2026-11-04"]), "free: the Gentle Streak counts it as a rest day");
    // Saturday has a prep session and a milestone: they stay, and the toast offers Move Them (Pro)
    await act(f, "cr-day", "2026-11-07"); await f.waitForSelector("dialog[open] .cr-sheet .ap-dayrow");
    await f.click(".cr-sheet .ap-dayrow button"); await settle(f, 400);
    ok(same(fb, await tasks(f), Object.keys(fb)), "free: Saturday's sessions stay where they are");
    ok(/^Sat, Nov 7 is a day off\. \d+ things? (is|are) still planned that day\.$/.test(await f.locator("#toastMsg").textContent()) && await f.locator("#toastExtra").textContent() === "Move Them", "free: the toast offers Move Them: " + await f.locator("#toastMsg").textContent());
    await f.click("#toastExtra"); await settle(f, 400);
    ok(await f.locator("dialog[open] .plan-sheet").count() === 1, "free: Move Them opens the Pro sheet");
    ok(!f.errs.length, "no console errors (locked): " + f.errs.join(" | "));

    ok(await p.evaluate(() => window.SBPRO.compareRows().some(r => r[0] === "Autopilot")), "listed as a Studyboard Pro feature");
    console.log("\nautopilot.e2e: " + n + " checks passed");
  } finally { await browser.close(); server.close(); }
})().catch(e => { console.error(e); process.exit(1); });
