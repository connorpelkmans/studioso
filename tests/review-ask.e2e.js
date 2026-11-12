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
const seed = (fresh) => {
  const t0 = Date.now() - (fresh ? 2 : 30) * DAY, tasks = [];
  for (let i = 0; i < 12; i++) tasks.push({id: "d" + i, title: "Done " + i, courseId: "c1", type: "Assignment", due: dated(-(i % 6) - 1), start: dated(-10), hours: 1, status: "done", doneAt: Date.now() - ((i % 6) + 1) * DAY, priority: "med", created: t0});
  tasks.push({id: "last", title: "Last thing today", courseId: "c1", type: "Assignment", due: dated(0), start: dated(0), hours: 1, status: "todo", priority: "high", created: t0});
  return {v: 2, courses: [{id: "c1", name: "Biology 101", code: "BIO101", color: "#2a9d8f"}], tasks, files: [], notes: [], decks: [], events: [], settings: {capacity: 15}, updated: 1};
};

async function open(b, {fresh, native = true, ls = {}} = {}) {
  const ctx = await b.newContext({viewport: {width: 390, height: 844}, isMobile: true, hasTouch: true});
  await ctx.addInitScript(([s, native, ls]) => {
    window.__SB_TEST = true;
    localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "done"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local"));
    if (!localStorage.getItem("coursework:v2")) localStorage.setItem("coursework:v2", JSON.stringify(s));
    Object.entries(ls).forEach(([k, v]) => { if (localStorage.getItem("__seeded:" + k) == null) { localStorage.setItem(k, v); localStorage.setItem("__seeded:" + k, "1"); } });
    window.__asks = 0;
    if (native) window.Capacitor = {isNativePlatform: () => true, getPlatform: () => "ios", isPluginAvailable: n => n === "InAppReview",
      Plugins: {InAppReview: {requestReview: () => { window.__asks++; return Promise.resolve(); }}}};
  }, [seed(fresh), native, ls]);
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
      // (Chromium hands localStorage writes to disk in batches: a reload straight after one can come up before it's saved)
      await p.waitForTimeout(2500); await p.reload(); await p.waitForTimeout(2500);
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
      await ctx.close();
    }
    { // after an error message
      const {ctx, p} = await open(b);
      await p.evaluate(() => { const t = document.getElementById("toast"); t.classList.add("show", "toast-err"); });
      await p.waitForTimeout(2600);
      ok((await why(p)) === "an error just now", "not within 10 minutes of an error message");
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
