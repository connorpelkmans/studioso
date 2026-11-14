// node tests/phone-widget-feed.e2e.js
// The iPhone and iPad app sends the day to the Home Screen and Lock Screen widgets (StudyboardNative.homeWidgets.save), and what it
// sends decodes as the widget's SBWData (ios-wrapper/native/HomeWidgets/StudyboardHomeWidgetData.swift): every field the widget
// requires is there, with its type, and whole numbers where Swift reads an Int (a fraction makes it refuse the whole day).
// It used to send nothing in the app (the feed only ran for the desktop app and Windows), so the widgets said "Open Studyboard to start".
const path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const iso = d => { const x = new Date(); x.setDate(x.getDate() + d); return x.getFullYear() + "-" + String(x.getMonth() + 1).padStart(2, "0") + "-" + String(x.getDate()).padStart(2, "0"); };
const SEED = {v: 2, updated: 1, notes: [], files: [], events: [], decks: [], settings: {capacity: 15},
  courses: [{id: "c1", name: "Nursing", code: "BSNC 1030", color: "#C0563A"}],
  tasks: [{id: "t1", title: "Sim (CH2) Reflection", courseId: "c1", type: "Assignment", due: iso(0), time: "23:59", hours: 1.5, status: "todo", priority: "med", created: 1},
    {id: "t2", title: "Final Clinical Evaluation", courseId: "c1", type: "Exam", due: iso(3), time: "18:00", status: "todo", priority: "med", created: 2},
    {id: "t3", title: "Care plan", courseId: "c1", type: "Assignment", due: iso(1), hours: 2.25, status: "todo", priority: "med", created: 3}]};
// SBWData, as the Swift structs declare it: [type, required]
const T = {
  data: {v: ["int", 1], day: ["string", 1], at: ["number", 1], dateLabel: ["string"], next: ["next"], tasks: [["task"], 1], more: ["int"], cards: ["int"], dayOff: ["bool"], exam: ["exam"], focus: ["focus"], days: [["day"]], theme: ["theme"]},
  task: {id: ["string", 1], title: ["string", 1], course: ["string"], color: ["string"], meta: ["string"], done: ["bool"], late: ["bool"], due: ["string"], time: ["string"], exam: ["bool"]},
  next: {id: ["string", 1], title: ["string", 1], course: ["string"], color: ["string"], why: ["string"], mins: ["int"], due: ["string"], time: ["string"]},
  exam: {id: ["string", 1], title: ["string", 1], course: ["string"], color: ["string"], due: ["string"], time: ["string"], days: ["int"], ready: ["int"]},
  focus: {mode: ["string", 1], running: ["bool", 1], endsAt: ["number", 1], left: ["int", 1], task: ["string"]},
  day: {date: ["string", 1], off: ["bool"], items: [["item"], 1], more: ["int"]},
  item: {id: ["string", 1], title: ["string", 1], course: ["string"], color: ["string"], time: ["string"], exam: ["bool"]},
  theme: {accent: ["string"], accentInk: ["string"], late: ["string"]}};
function decodes(v, type, at, errs){
  if (Array.isArray(type)) { if (!Array.isArray(v)) return errs.push(at + " isn't a list"); v.forEach((x, i) => decodes(x, type[0], `${at}[${i}]`, errs)); return; }
  if (type === "int") { if (!Number.isInteger(v)) errs.push(`${at} = ${v} isn't a whole number`); return; }
  if (type === "number") { if (typeof v !== "number") errs.push(at + " isn't a number"); return; }
  if (type === "string") { if (typeof v !== "string") errs.push(at + " isn't text"); return; }
  if (type === "bool") { if (typeof v !== "boolean") errs.push(at + " isn't true/false"); return; }
  if (!v || typeof v !== "object") return errs.push(at + " isn't an object");
  for (const [k, [t, req]] of Object.entries(T[type])) { if (v[k] == null) { if (req) errs.push(`${at}.${k} is missing`); continue; } decodes(v[k], t, `${at}.${k}`, errs); }
}
(async () => {
  const browser = await chromium.launch({executablePath}), errs = [];
  try {
    const ctx = await browser.newContext({viewport: {width: 402, height: 874}, isMobile: true, hasTouch: true});
    await ctx.addInitScript(seed => {
      window.__SB_TEST = true; window.__saved = [];
      // the iPhone app: Capacitor, and the bridge's homeWidgets (native-bridge.js) around StudyboardHomeWidgets
      window.Capacitor = {isNativePlatform: () => true, getPlatform: () => "ios", isPluginAvailable: () => false, Plugins: {}};
      window.StudyboardNative = {homeWidgets: {save: d => { window.__saved.push(JSON.parse(JSON.stringify(d))); return Promise.resolve(true); }, drain: () => Promise.resolve([]), ack: () => Promise.resolve(), clear: () => Promise.resolve()}};
      try { if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:tour", "done"); localStorage.setItem("coursework:v2", JSON.stringify(seed)); } } catch (e) {}
    }, SEED);
    const page = await ctx.newPage(); page.on("pageerror", e => errs.push(e.message));
    await page.goto("file://" + path.join(__dirname, "..", "index.html")); await page.waitForTimeout(2500);
    let saved = await page.evaluate(() => window.__saved);
    ok(saved.length >= 1, `the app sends the day to the widgets as it opens (${saved.length} save${saved.length === 1 ? "" : "s"})`);
    const d = saved[saved.length - 1], bad = []; decodes(d, "data", "day", bad);
    ok(!bad.length, "what it sends decodes as the widget's SBWData" + (bad.length ? ": " + bad.join("; ") : ""));
    ok(d.v === 1 && d.day === iso(0), "it's version 1, for today (" + d.day + ")");
    ok(d.tasks.some(t => t.title === "Sim (CH2) Reflection") && d.next && d.next.title, `today's tasks and Do This Next are in it (next: ${d.next && d.next.title})`);
    ok(d.days.length === 6 && d.days.some(x => x.items.some(i => i.title === "Final Clinical Evaluation" && i.exam)), "and the week ahead, with the exam marked");
    // a change is sent again
    await page.evaluate(() => { window.__saved.length = 0; const S = window.__sbSync, t = JSON.parse(JSON.stringify(S.state.tasks.t1)); t.status = "done"; t.doneAt = Date.now(); S.applyChanges([{kind: "task", id: "t1", after: t}], ""); });
    await page.waitForTimeout(1500);
    saved = await page.evaluate(() => window.__saved);
    const last = saved[saved.length - 1];
    ok(saved.length >= 1 && !last.tasks.some(t => t.id === "t1" && !t.done), "checking off a task sends the day again, with it done (or off the list)");
    ok(!errs.length, "no page errors" + (errs.length ? ": " + errs.join(" | ") : ""));
    console.log("phone-widget-feed.e2e: " + n + " checks passed");
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
