// node tests/smart-remind.e2e.js (Playwright + Chromium; see tests/pw.js) Smart Reminders: timed to free time, in the reminders list,
// the settings row, the in-app toast, the daily-hours fallback and the locked Pro path
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

// Monday 2 November 2026, 10:00 in New York. Lectures MWF 9-12, a café job Mon-Thu 1-9 PM, placement Tue/Thu 7 AM-3 PM:
// about 7h of free time before the policy brief is due Thursday at 1 PM, and it needs 8h.
const NOW = "2026-11-02T10:00:00-05:00";
const SEED = ([avail, free]) => {
  const t = (id, title, due, time, hours, extra) => Object.assign({id, title, courseId: "c1", type: "Assignment", start: "2026-10-26", due, time, priority: "med", status: "todo", notes: "", hours, checklist: [], pct: 0, dependsOn: [], history: []}, extra || {});
  try {
    localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("studioso:tour", "done"); localStorage.setItem("studyboard:tour", "done"); localStorage.setItem("sb:onboarded", "1");
    if (free) localStorage.setItem("studyboard:paywall-test", "1");
    const blocks = [{id: "cls", type: "class", title: "Lectures", days: [1, 3, 5], start: "09:00", end: "12:00"},
      {id: "job", type: "work", title: "Café", days: [1, 2, 3, 4], start: "13:00", end: "21:00"},
      {id: "pl", type: "shift", title: "Placement", days: [2, 4], start: "07:00", end: "15:00"}];
    localStorage.setItem("coursework:v2", JSON.stringify({v: 2, courses: [{id: "c1", name: "Public Policy", code: "POL220", color: "#4F8A5B"}],
      tasks: avail ? [t("t1", "Policy Brief", "2026-11-05", "13:00", 8), t("t2", "Reading Notes", "2026-11-06", "", 1), t("t3", "Old Quiz", "2026-11-03", "", 4, {status: "done"})]
        : [t("t1", "Essay Draft", "2026-11-04", "", 5), t("t2", "Reading Notes", "2026-11-06", "", 1)],
      files: [], notes: [], decks: [], events: [], settings: Object.assign({capacity: 15, dailyHours: 2}, avail ? {avail: {v: 1, blocks, cfg: {}}} : {}), updated: 1}));
  } catch (e) {}
};

(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  const open = async (o = {}) => {
    const ctx = await browser.newContext({viewport: {width: o.w || 390, height: 844}, timezoneId: "America/New_York", locale: "en-US"});
    const p = await ctx.newPage(); p.errs = [];
    p.on("pageerror", e => p.errs.push(e.message)); p.on("console", m => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) p.errs.push(m.text()); });
    await p.clock.install({time: new Date(NOW)});
    await p.addInitScript(SEED, [o.avail !== false, !!o.free]);
    await p.goto(base); await p.waitForSelector("#view", {state: "attached"}); await p.waitForTimeout(1200);
    await p.clock.runFor(3000);
    return p;
  };
  const act = (p, a) => p.evaluate(a => { const b = document.createElement("button"); b.dataset.act = a; b.style.display = "none"; document.body.appendChild(b); b.click(); b.remove(); }, a);
  const smart = p => p.evaluate(() => window.studyboardReminders.list().filter(r => r.kind === "smart").map(r => {
    const d = new Date(r.at); return {title: r.title, body: r.body, taskId: r.taskId, day: d.getDate(), hm: d.getHours() * 60 + d.getMinutes()}; }));
  const overflow = p => p.evaluate(() => Math.max(document.documentElement.scrollWidth - document.documentElement.clientWidth, (() => { const d = document.querySelector("dialog[open] .sheet-body"); return d ? d.scrollWidth - d.clientWidth : 0; })()));
  try {
    // Pro (paywall off): the reminder is planned at the start of today's 12-1 PM gap
    const p = await open();
    const s = await smart(p);
    ok(s.length === 1 && s[0].title === "Policy Brief" && s[0].taskId === "t1", "one smart reminder, for the tight task only: " + JSON.stringify(s));
    ok(s[0].day === 2 && s[0].hm === 12 * 60, "at the start of the next free window (today 12:00 PM)");
    ok(/^You have 1h free this afternoon and this needs about \d+h( \d+m)? by Thursday at 1:00\s?PM, more than your free time until then\. Start now\?$/.test(s[0].body), "message names the window, the work left and the due time: " + s[0].body);
    ok(await p.evaluate(() => JSON.parse(localStorage.getItem("studyboard:smartSent") || "{}")["t1|2026-11-02"] > 0), "the plan is remembered so it only goes out once");

    // The settings row, in Reminders and Notifications
    await act(p, "rm-open"); await p.waitForSelector("dialog[open] .rm-sheet");
    ok(await p.locator('.rm-sheet input[data-rm="smart"]').isChecked(), "Smart Reminders row is on by default");
    ok(await p.locator('.rm-sheet [data-act="smr-pro"]').count() === 0 && await p.locator(".rm-sheet .pro-badge").count() === 0, "no Pro upsell when unlocked");
    const coming = (await p.locator("#rmComing").textContent()).replace(/\s+/g, " ");
    ok(/Today, 12:00\s?PM/.test(coming) && /Policy Brief/.test(coming) && /You have 1h free this afternoon/.test(coming), "it shows in Coming Up with its time: " + coming.slice(0, 160));
    ok(await overflow(p) <= 0, "no horizontal overflow at 390px");
    await p.setViewportSize({width: 1280, height: 900}); await p.waitForTimeout(200);
    ok(await overflow(p) <= 0, "no horizontal overflow at 1280px");
    await p.setViewportSize({width: 390, height: 844});
    await p.locator('.rm-sheet input[data-rm="smart"]').uncheck(); await p.clock.runFor(600);
    ok((await smart(p)).length === 0, "turning it off removes it from the list");
    ok(!/You have 1h free/.test(await p.locator("#rmComing").textContent()), "and from Coming Up");
    ok(await p.evaluate(() => JSON.parse(localStorage.getItem("coursework:v2")).settings.reminders.smart === false), "the setting is saved");
    await p.locator('.rm-sheet input[data-rm="smart"]').check(); await p.clock.runFor(600);
    ok((await smart(p)).length === 1, "turning it back on brings it back");
    await act(p, "close"); await p.waitForTimeout(100);

    // At 12:00 it shows in the app, with Start Focus
    const left = await p.evaluate(() => new Date("2026-11-02T12:00:30-05:00").getTime() - Date.now());
    await p.clock.fastForward(left); await p.clock.runFor(1000); await p.waitForTimeout(300);
    const toast = (await p.locator("#toastMsg").textContent()) || "";
    ok(/^Policy Brief: You have 1h free this afternoon/.test(toast), "the reminder shows at 12:00: " + toast);
    ok(await p.locator("#toastExtra").textContent() === "Start Focus" && await p.locator("#toastExtra2").textContent() === "Open", "with Start Focus and Open");
    await p.click("#toastExtra"); await p.waitForTimeout(400);
    ok(await p.evaluate(() => typeof pomo !== "undefined" ? pomo.taskId : null) === "t1" || await p.evaluate(() => { const d = document.querySelector("#pomoDlg"); return !!(d && d.open && /Policy Brief/.test(d.textContent)); }), "Start Focus opens the timer on the task");
    ok((await smart(p)).every(r => r.day !== 2 || r.hm === 12 * 60), "no second smart reminder for it today");
    ok(!p.errs.length, "no console errors (Pro): " + p.errs.join(" | "));

    // No availability blocks: the plan's daily study hours (2h a day), at the study nudge time
    const d = await open({avail: false});
    const ds = await smart(d);
    ok(ds.length === 1 && ds[0].title === "Essay Draft" && ds[0].day === 2 && ds[0].hm === 16 * 60, "falls back to daily hours, at 4:00 PM: " + JSON.stringify(ds));
    ok(/^This needs about \d+h( \d+m)? by Wednesday, and your plan has about \d+h( \d+m)? of study time until then\. Start now\?$/.test(ds[0].body), "daily-hours message: " + ds[0].body);
    ok(!d.errs.length, "no console errors (daily hours): " + d.errs.join(" | "));

    // Free plan with the paywall on: no smart reminders, a PRO row that opens the Pro sheet
    const f = await open({free: true});
    ok((await smart(f)).length === 0, "locked: nothing is planned");
    await act(f, "rm-open"); await f.waitForSelector("dialog[open] .rm-sheet");
    ok(await f.locator('.rm-sheet input[data-rm="smart"]').count() === 0 && await f.locator('.rm-sheet [data-act="smr-pro"] .pro-badge').count() === 1, "locked: a Smart Reminders row with a PRO badge");
    ok(await overflow(f) <= 0, "locked: no horizontal overflow at 390px");
    await f.click('.rm-sheet [data-act="smr-pro"]'); await f.waitForTimeout(400);
    ok(await f.locator("dialog[open] .plan-sheet").count() === 1, "locked: tapping it opens the Pro sheet");
    ok(!f.errs.length, "no console errors (locked): " + f.errs.join(" | "));

    // Listed under Studyboard Pro
    ok(await p.evaluate(() => window.SBPRO.compareRows().some(r => r[0] === "Smart Reminders")), "listed as a Studyboard Pro feature");
    console.log("\nsmart-remind.e2e: " + n + " checks passed");
  } finally { await browser.close(); server.close(); }
})().catch(e => { console.error(e); process.exit(1); });
