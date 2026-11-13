// node tests/review-ask.e2e.js: the App Store / Google Play review prompt (src/js/99-review-ask.js), with a stand-in for the
// @capacitor-community/in-app-review plugin. Asked once, at a good moment, only for someone who has used the app for a while,
// never twice within 120 days, never right after an error, a bug report or a Pro sheet, and never on the website.
const path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const F = "file://" + path.resolve(__dirname, "..", "index.html");
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const DAY = 864e5;
const dated = d => { const x = new Date(Date.now() + d * DAY); return x.getFullYear() + "-" + String(x.getMonth() + 1).padStart(2, "0") + "-" + String(x.getDate()).padStart(2, "0"); };
// a student of a month: 12 tasks done over 6 days, and one task left today
const seed = (fresh, overdue, exam) => {
  const t0 = Date.now() - (fresh ? 2 : 30) * DAY, tasks = [];
  for (let i = 0; i < 12; i++) tasks.push({id: "d" + i, title: "Done " + i, courseId: "c1", type: "Assignment", due: dated(-(i % 6) - 1), start: dated(-10), hours: 1, status: "done", doneAt: Date.now() - ((i % 6) + 1) * DAY, priority: "med", created: t0});
  if (exam) tasks.push({id: "exam", title: "Midterm", courseId: "c1", type: "Exam", due: dated(2), time: "09:00", start: dated(-5), status: "todo", priority: "high", created: t0});
  if (overdue) tasks.push({id: "late", title: "Overdue essay", courseId: "c1", type: "Assignment", due: dated(-3), start: dated(-8), hours: 2, status: "todo", priority: "high", created: t0});
  tasks.push({id: "last", title: "Last thing today", courseId: "c1", type: "Assignment", due: dated(0), start: dated(0), hours: 1, status: "todo", priority: "high", created: t0});
  return {v: 2, courses: [{id: "c1", name: "Biology 101", code: "BIO101", color: "#2a9d8f"}], tasks, files: [], notes: [], decks: [], events: [], settings: {capacity: 15}, updated: 1};
};

async function open(b, {fresh, overdue, exam, native = true, ls = {}} = {}) {
  const ctx = await b.newContext({viewport: {width: 390, height: 844}, isMobile: true, hasTouch: true});
  await ctx.addInitScript(([s, native, ls]) => {
    window.__SB_TEST = true;
    localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "done"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local"));
    if (!localStorage.getItem("coursework:v2")) localStorage.setItem("coursework:v2", JSON.stringify(s));
    Object.entries(ls).forEach(([k, v]) => { if (localStorage.getItem("__seeded:" + k) == null) { localStorage.setItem(k, v); localStorage.setItem("__seeded:" + k, "1"); } });
    window.__asks = 0;
    if (native) window.Capacitor = {isNativePlatform: () => true, getPlatform: () => "ios", isPluginAvailable: n => n === "InAppReview",
      Plugins: {InAppReview: {requestReview: () => { window.__asks++; return Promise.resolve(); }}}};
  }, [seed(fresh, overdue, exam), native, ls]);
  const p = await ctx.newPage(); p.errs = []; p.on("pageerror", e => p.errs.push(e.message));
  await p.goto(F); await p.waitForTimeout(2500);
  await p.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
  return {ctx, p};
}
const why = p => p.evaluate(() => window.__sbReviewAsk.whyNot());
const asks = p => p.evaluate(() => window.__asks);
// tick the last task of the day (clears Today's Plan: a good moment), then wait for the toast and celebration to pass
async function clearPlan(p) {
  await p.evaluate(() => { const b = document.querySelector('nav.tabs [data-tab="board"]'); if (b) b.click(); });
  await p.waitForTimeout(300);
  const el = await p.$('[data-act="toggle"][data-id="last"]'); assert(el, "the last task's circle");
  await el.scrollIntoViewIfNeeded(); await el.tap().catch(() => el.click());
}
const waitAsk = async (p, ms) => { const end = Date.now() + ms; while (Date.now() < end) { if (await asks(p)) return true; await p.waitForTimeout(500); } return false; };

(async () => {
  const b = await chromium.launch({executablePath});
  try {
    { // a student of a month, in the app
      const {ctx, p} = await open(b);
      const r = await p.evaluate(() => window.__sbReviewAsk.rec());
      ok(r.days.length >= 5 && Date.now() - r.first > 20 * 864e5, `an existing student's history is filled in from their tasks (${r.days.length} days, started ${Math.round((Date.now() - r.first) / 864e5)} days ago)`);
      ok((await why(p)) === "", "they can be asked");
      await clearPlan(p);
      await p.waitForTimeout(1000);
      ok((await asks(p)) === 0, "not while the moment's toast and celebration are on screen");
      ok(await waitAsk(p, 20000), "clearing Today's Plan brings up the store's review prompt once things settle");
      const rec = await p.evaluate(() => window.__sbReviewAsk.rec());
      ok(rec.asked.length === 1 && rec.lastKind === "plan", "the ask is remembered, with the moment that led to it");
      await p.evaluate(() => { window.__sbReviewAsk.moment("grade"); }); await p.waitForTimeout(3500);
      ok((await asks(p)) === 1, "a second good moment in the same launch doesn't ask again");
      // a later launch (reloading the page instead races Chromium's batched localStorage commits in this test browser)
      await p.evaluate(() => window.__sbReviewAsk.reset());
      const w = await why(p);
      ok(w === "asked within 120 days", `nor in a later launch within 120 days (${w} ${w ? "" : await p.evaluate(() => localStorage.getItem("studyboard:reviewAsk"))})`);
      ok(!p.errs.length, "no page errors: " + p.errs.join(" | "));
      await ctx.close();
    }
    { // new to the app
      const {ctx, p} = await open(b, {fresh: true});
      ok((await why(p)) === "used for less than a week", "someone who started two days ago isn't asked");
      await clearPlan(p); await p.waitForTimeout(6000);
      ok((await asks(p)) === 0, "even when they clear their plan");
      await ctx.close();
    }
    { // right after a Pro sheet, or a bug report
      const {ctx, p} = await open(b, {ls: {"studyboard:proShownAt": String(Date.now() - 3600e3)}});
      ok((await why(p)) === "a Pro sheet today", "not on a day a Pro sheet was shown");
      await p.evaluate(() => { localStorage.removeItem("studyboard:proShownAt"); localStorage.setItem("studyboard:bugsent", String(Date.now() - 5 * 864e5)); });
      ok((await why(p)) === "a bug report this month", "not within a month of sending a bug report");
      await p.evaluate(() => localStorage.removeItem("studyboard:bugsent"));
      ok((await why(p)) === "", "and fine again once both are long past");
      // a free-plan limit, a run of free AI checks used up, or the free weeks ending: quiet for a few days
      await p.evaluate(() => { window.__sbPlanObj().limitNote("test-limit-" + Date.now(), "This is one device more than the free plan syncs on (2).", {reason: "x"}); });
      const q = await p.evaluate(() => Number(localStorage.getItem("studyboard:reviewQuietUntil")) - Date.now());
      ok(q > 2.9 * 864e5 && q <= 3 * 864e5, "a free-plan limit note keeps the review prompt away for 3 days");
      ok(/lately/.test(await why(p)), "and says so");
      ok(await p.evaluate(() => [...document.querySelectorAll("#toast button")].some(b => !b.hidden && b.textContent === "Tell Us")), "the limit note offers Tell Us");
      await p.evaluate(() => localStorage.removeItem("studyboard:reviewQuietUntil"));
      ok((await why(p)) === "", "fine again once the quiet days are past");
      await ctx.close();
    }
    { // after an error message
      const {ctx, p} = await open(b);
      await p.evaluate(() => { const t = document.getElementById("toast"); t.classList.add("show", "toast-err"); });
      await p.waitForTimeout(2600);
      ok((await why(p)) === "an error just now", "not within 10 minutes of an error message");
      await ctx.close();
    }
    { // the calmer rules: once per version, never more than 3 times, a year after the second ask
      const old = Date.now() - 400 * 864e5;
      const {ctx, p} = await open(b);
      await p.evaluate(o => { const r = window.__sbReviewAsk.rec(); r.asked = [o]; r.vers = ["0.0.1"]; localStorage.setItem("studyboard:reviewAsk", JSON.stringify(r)); }, old);
      ok((await why(p)) === "", "a year after one ask in an older version, it can ask again");
      await p.evaluate(o => { const r = window.__sbReviewAsk.rec(); r.asked = [o]; r.vers = [window.__sbReviewAsk.version()]; localStorage.setItem("studyboard:reviewAsk", JSON.stringify(r)); }, old);
      ok(!!(await p.evaluate(() => window.__sbReviewAsk.version())) && (await why(p)) === "asked in this version", "but never twice in the same app version");
      await p.evaluate(o => { const r = window.__sbReviewAsk.rec(); r.asked = [o - 864e5, o]; localStorage.setItem("studyboard:reviewAsk", JSON.stringify(r)); }, Date.now() - 200 * 864e5);
      ok((await why(p)) === "asked twice, the last within a year", "after a second ask, it waits a year, not 120 days");
      await p.evaluate(() => { const r = window.__sbReviewAsk.rec(); r.asked = [1, 2, 3].map(i => Date.now() - (900 + i * 400) * 864e5); localStorage.setItem("studyboard:reviewAsk", JSON.stringify(r)); });
      ok((await why(p)) === "asked 3 times already", "and after three asks in all, never again");
      await p.evaluate(() => { const r = window.__sbReviewAsk.rec(); r.asked = []; r.vers = []; localStorage.setItem("studyboard:reviewAsk", JSON.stringify(r)); });
      ok((await why(p)) === "", "with no asks on record, it can ask");
      // an Undo is a sign something went wrong
      await p.evaluate(() => { const u = document.getElementById("toastUndo"); u.hidden = false; u.dispatchEvent(new MouseEvent("click", {bubbles: true})); });
      ok((await why(p)) === "an Undo just now", "not within 2 minutes of an Undo");
      await ctx.close();
    }
    { // a moment that no longer holds
      const {ctx, p} = await open(b);
      await clearPlan(p);
      // Undo straight away: the plan isn't cleared any more, so no prompt
      await p.waitForTimeout(400);
      await p.evaluate(() => { const u = document.getElementById("toastUndo"); if (u) u.click(); });
      await p.waitForTimeout(8000);
      ok((await asks(p)) === 0, "clearing the plan then pressing Undo doesn't bring up the prompt");
      await ctx.close();
    }
    { // in the middle of typing or tapping, it waits
      const {ctx, p} = await open(b);
      await p.evaluate(() => { const i = document.createElement("input"); i.id = "__typing"; document.body.appendChild(i); i.focus(); window.__sbReviewAsk.moment("grade"); });
      await p.waitForTimeout(6000);
      ok((await asks(p)) === 0, "not while a text field has the keyboard");
      await p.evaluate(() => { const i = document.getElementById("__typing"); i.blur(); i.remove(); });
      ok(await waitAsk(p, 8000), "and once typing is done, it asks");
      await ctx.close();
    }
    { // overdue work: a stressful day, so no prompt
      const {ctx, p} = await open(b, {overdue: true});
      ok((await why(p)) === "overdue work", "not while there's overdue work");
      await ctx.close();
    }
    { // Exam Mode: the last days before an exam are stressful
      const {ctx, p} = await open(b, {exam: true});
      ok((await why(p)) === "Exam Mode", "not in the days before an exam");
      await ctx.close();
    }
    { // the website
      const {ctx, p} = await open(b, {native: false});
      ok((await why(p)) === "not in the app", "the website never asks (there's no store prompt there)");
      await clearPlan(p); await p.waitForTimeout(4000);
      ok(!p.errs.length, "no page errors: " + p.errs.join(" | "));
      await ctx.close();
    }
    console.log("review-ask.e2e: " + n + " checks passed");
  } finally { await b.close(); }
})().catch(e => { console.error(e); process.exit(1); });
