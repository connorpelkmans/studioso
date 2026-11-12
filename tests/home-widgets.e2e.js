// node tests/home-widgets.e2e.js: the page's side of the iPhone and iPad Home Screen and Lock Screen widgets (src/js/70-widgets.js
// phoneData, ios-wrapper/native/HomeWidgets), with a stand-in for the StudyboardHomeWidgets plugin: what the widgets are sent, tasks
// ticked on a widget done in the app, Start a Focus from a widget, and nothing left on the Home Screen after signing out.
const path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const F = "file://" + path.resolve(__dirname, "..", "index.html");
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const dated = d => { const x = new Date(); x.setDate(x.getDate() + d); return x.getFullYear() + "-" + String(x.getMonth() + 1).padStart(2, "0") + "-" + String(x.getDate()).padStart(2, "0"); };
const seed = () => ({v: 2, courses: [{id: "c1", name: "Biology 101", code: "BIO101", color: "#2a9d8f"}, {id: "c2", name: "English", code: "ENGL", color: "#d06a2e"}],
  tasks: [
    {id: "t1", title: "Lab report", courseId: "c1", type: "Assignment", due: dated(0), time: "23:59", start: dated(0), hours: 1, status: "todo", priority: "high", created: 1},
    {id: "t2", title: "Discussion post", courseId: "c2", type: "Assignment", due: dated(1), start: dated(0), hours: 1, status: "todo", priority: "med", created: 1},
    {id: "t3", title: "Reading notes", courseId: "c2", type: "Assignment", due: dated(-1), start: dated(-3), hours: 1, status: "todo", priority: "med", created: 1},
    {id: "x1", title: "Midterm", courseId: "c1", type: "Exam", due: dated(2), time: "09:00", start: dated(-5), status: "todo", priority: "high", created: 1},
    {id: "t4", title: "Essay outline", courseId: "c2", type: "Assignment", due: dated(4), start: dated(1), hours: 2, status: "todo", priority: "med", created: 1}],
  files: [], notes: [], decks: [], events: [], settings: {capacity: 15}, updated: 1});

(async () => {
  const b = await chromium.launch({executablePath});
  try {
    const ctx = await b.newContext({viewport: {width: 390, height: 844}, isMobile: true, hasTouch: true});
    await ctx.addInitScript(s => {
      window.__SB_TEST = true;
      localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "done"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local"));
      if (!localStorage.getItem("coursework:v2")) localStorage.setItem("coursework:v2", JSON.stringify(s));
      window.__hw = {saved: [], queue: [], acked: [], cleared: 0};
      window.StudyboardNative = Object.assign(window.StudyboardNative || {}, {homeWidgets: {
        save: d => { window.__hw.saved.push(JSON.parse(JSON.stringify(d))); return Promise.resolve(true); },
        drain: () => Promise.resolve(window.__hw.queue.slice()),
        ack: ids => { window.__hw.acked.push(...ids); window.__hw.queue = window.__hw.queue.filter(x => !ids.includes(x.id)); return Promise.resolve(); },
        clear: () => { window.__hw.cleared++; return Promise.resolve(); }}});
    }, seed());
    const p = await ctx.newPage(); const errs = []; p.on("pageerror", e => errs.push(e.message));
    await p.goto(F); await p.waitForTimeout(2500);
    await p.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
    const last = () => p.evaluate(() => window.__hw.saved[window.__hw.saved.length - 1] || null);

    let d = await last();
    ok(d && d.v === 1, "the app sends the widgets their day on start");
    ok(d.day === dated(0) && typeof d.at === "number" && d.dateLabel, `it's for today (${d.day})`);
    ok(Array.isArray(d.tasks) && d.tasks.length >= 2, `with today's list (${d.tasks.map(t => t.title).join(", ")})`);
    ok(d.tasks.every(t => /^#[0-9A-F]{6}$/.test(t.color) && typeof t.done === "boolean"), "each task has a course colour as #RRGGBB and done");
    const lab = d.tasks.find(t => t.id === "t1");
    ok(lab && lab.due === dated(0) && lab.time === "23:59" && lab.course === "BIO101", "a task carries its due date, time and course");
    ok(d.tasks.some(t => t.id === "t3" && t.late), "the overdue task is marked late");
    ok(d.next && d.next.id && d.next.mins >= 5, `Do This Next is there (${d.next && d.next.title}, ${d.next && d.next.mins}m)`);
    ok(Array.isArray(d.days) && d.days.length === 6 && d.days[0].date === dated(1), "and the six days after today");
    ok(d.days.find(x => x.date === dated(2)).items.some(i => i.id === "x1" && i.exam), "the week ahead lists the exam, marked as an exam");
    ok(d.days.find(x => x.date === dated(4)).items.some(i => i.id === "t4"), "and later due dates");
    ok(d.exam && d.exam.id === "x1" && d.exam.days === 2, `Exam Mode is sent for an exam in 2 days (${JSON.stringify(d.exam)})`);
    ok(/^#[0-9A-F]{6}$/.test(d.theme.accent) && /^#[0-9A-F]{6}$/.test(d.theme.late), "with the theme's colours");
    ok(d.focus === null && d.dayOff === false, "no Focus running, not a Day Off");

    // a change in the app reaches the widgets
    const before = await p.evaluate(() => window.__hw.saved.length);
    await p.evaluate(() => { const b = document.querySelector('[data-act="toggle"][data-id="t1"]'); if (b) b.click(); });
    await p.waitForTimeout(1500);
    d = await last();
    ok((await p.evaluate(() => window.__hw.saved.length)) > before && d.tasks.find(t => t.id === "t1").done, "checking off a task in the app sends the new day");
    // unchanged: nothing more is sent
    const quiet = await p.evaluate(() => window.__hw.saved.length);
    await p.waitForTimeout(1200);
    ok((await p.evaluate(() => window.__hw.saved.length)) === quiet, "and nothing is sent again while nothing changes");

    // a task ticked on the widget while the app was closed
    await p.evaluate(at => { window.__hw.queue = [{id: "a1", kind: "done", task: "t2", at}, {id: "a2", kind: "done", task: "t1", at}, {id: "a3", kind: "done", task: "gone", at}]; }, Date.now() - 60000);
    await p.evaluate(() => window.__sbPhoneWidgets.drain()); await p.waitForTimeout(800);
    const t2 = await p.evaluate(() => { const s = JSON.parse(localStorage.getItem("coursework:v2")); const t = (s.tasks || []).find ? s.tasks.find(x => x.id === "t2") : s.tasks.t2; return t; });
    ok(t2 && t2.status === "done", "a task ticked on the widget is done in the app");
    ok(t2.doneAt <= Date.now() - 50000, "at the time it was ticked");
    ok((await p.evaluate(() => window.__hw.acked.slice().sort().join(","))) === "a1,a2,a3", "every queued tick is acknowledged, including one already done and one for a task that's gone");
    ok((await p.evaluate(() => (document.getElementById("toastMsg") || {}).textContent || "")).includes("from the widget"), "the toast says it came from the widget (with Undo)");
    await p.waitForTimeout(800);
    const t2w = (await last()).tasks.find(t => t.id === "t2");
    ok(!t2w || t2w.done, "and the widgets get the new day back");

    // Start a Focus on a widget: studyboard://action/focus?task=t4
    await p.evaluate(() => window.SBOPEN(new URLSearchParams("action=focus&task=t4"))); await p.waitForTimeout(1200);
    const pomo = await p.evaluate(() => { const d = document.getElementById("pomoDlg"); return {open: !!(d && d.open), text: d ? d.textContent : ""}; });
    ok(pomo.open && pomo.text.includes("Essay outline"), "Start a Focus from a widget opens the timer on that task");
    await p.evaluate(() => { const b = document.querySelector('#pomoDlg [data-act="pomo-start"]') || document.querySelector('[data-act="pomo-start"]'); if (b) b.click(); });
    await p.waitForTimeout(1500);
    d = await last();
    ok(d.focus && d.focus.running && d.focus.endsAt > Date.now() && d.focus.mode === "focus", `a running Focus is sent with when it ends (${JSON.stringify(d.focus)})`);

    // signing out clears the widgets
    await p.evaluate(() => { const b = document.createElement("button"); b.dataset.act = "sb-signout"; b.hidden = true; document.body.appendChild(b); b.dispatchEvent(new MouseEvent("click", {bubbles: true})); b.remove(); });
    ok((await p.evaluate(() => window.__hw.cleared)) === 1, "signing out clears what the widgets show");
    ok(!errs.length, "no page errors: " + errs.join(" | "));
    console.log("home-widgets.e2e: " + n + " checks passed");
  } finally { await b.close(); }
})().catch(e => { console.error(e); process.exit(1); });
