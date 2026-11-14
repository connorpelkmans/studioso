// node tests/haptics.e2e.js: sbHaptic (src/js/01-helpers.js). Phones and tablets feel the app's moments, in the iPhone and Android
// apps through @capacitor/haptics and in an Android browser through navigator.vibrate; computers stay silent; Settings can turn it
// off; at most one every 120 ms; only right after the student touched the screen unless the moment forces it.
const path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const F = "file://" + path.resolve(__dirname, "..", "index.html");
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const dated = d => { const x = new Date(); x.setDate(x.getDate() + d); return x.getFullYear() + "-" + String(x.getMonth() + 1).padStart(2, "0") + "-" + String(x.getDate()).padStart(2, "0"); };
const seed = () => ({v: 2, courses: [{id: "c1", name: "Biology 101", code: "BIO101", color: "#2a9d8f"}],
  tasks: [0, 1, 2].map(i => ({id: "t" + i, title: ["Lab report", "Read chapter 4", "Problem set 3"][i], courseId: "c1", type: "Assignment", due: dated(i + 3), start: dated(0), hours: 1, status: "todo", priority: "med", created: 1})),
  files: [], notes: [], decks: [], events: [], settings: {capacity: 15}, updated: 1});

// native: a stand-in for the Capacitor bridge and its Haptics plugin that records each call
async function open(b, {phone, native, off, noPlugin}) {
  const ctx = await b.newContext(phone ? {viewport: {width: 390, height: 844}, deviceScaleFactor: 2, isMobile: true, hasTouch: true} : {viewport: {width: 1280, height: 800}});
  await ctx.addInitScript(([s, native, off, noPlugin]) => {
    window.__SB_TEST = true; localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "done"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local"));
    if (!localStorage.getItem("coursework:v2")) localStorage.setItem("coursework:v2", JSON.stringify(s));
    if (off) localStorage.setItem("studyboard:haptics", "off");
    window.__h = [];
    Object.defineProperty(navigator, "vibrate", {configurable: true, value: p => { window.__h.push(["vibrate", JSON.stringify(p)]); return true; }});
    if (native) {
      const rec = k => o => { window.__h.push([k, o ? (o.style || o.type || "") : ""]); return Promise.resolve(); };
      // as in the real app: Capacitor.Plugins starts empty, and a plugin whose own script isn't loaded is reached by registering it
      const H = {impact: rec("impact"), notification: rec("notification"), selectionStart: rec("selectionStart"), selectionChanged: rec("selectionChanged")};
      window.Capacitor = {isNativePlatform: () => true, isPluginAvailable: n => n === "Haptics" && !noPlugin, getPlatform: () => "ios", Plugins: {},
        registerPlugin: n => { window.__h.push(["register", n]); return n === "Haptics" ? H : {}; }};
    }
  }, [seed(), !!native, !!off, !!noPlugin]);
  const p = await ctx.newPage(); p.errs = []; p.on("pageerror", e => p.errs.push(e.message));
  await p.goto(F); await p.waitForTimeout(2000);
  await p.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
  return {ctx, p};
}
const calls = p => p.evaluate(() => { const h = window.__h.filter(x => x[0] !== "register"); window.__h.length = 0; return h; });
// the student's own touch (a trusted key press: it reaches the input listener without tapping anything on the page)
const touch = p => p.keyboard.press("Shift");
const checkOff = async (p, id) => {
  await p.evaluate(() => { window.__h.length = 0; });
  const sel = `[data-act="toggle"][data-id="${id}"]`;
  await p.evaluate(() => { const b = document.querySelector('nav.tabs [data-tab="board"]'); if (b) b.click(); });
  await p.waitForTimeout(300);
  const el = await p.$(sel); assert(el, "a check circle for " + id);
  await el.scrollIntoViewIfNeeded(); await el.tap().catch(() => el.click());
  await p.waitForTimeout(500);
  return calls(p);
};

(async () => {
  const b = await chromium.launch({executablePath});
  try {
    { // the iPhone or Android app
      const {ctx, p} = await open(b, {phone: true, native: true});
      ok(await p.evaluate(() => typeof sbHaptic === "function" && __sbHaptic.device()), "the app counts as a phone");
      let h = await checkOff(p, "t0");
      ok(h.length === 1 && h[0][0] === "impact" && h[0][1] === "MEDIUM", `checking off a task is one firm tap (${JSON.stringify(h)})`);
      ok(!h.some(x => x[0] === "vibrate"), "the app never uses navigator.vibrate when the plugin is there");
      await touch(p); await p.waitForTimeout(150);
      const fired = await p.evaluate(() => [window.sbHaptic("tap"), window.sbHaptic("tap")]); await calls(p);
      ok(fired[0] === true && fired[1] === false, "a second haptic within 120 ms is dropped");
      await p.waitForTimeout(1700);
      ok(await p.evaluate(() => window.sbHaptic("tap")) === false, "nothing when the student hasn't touched the screen for a while");
      ok(await p.evaluate(() => window.sbHaptic("success", {force: true})) === true, "unless the moment forces it (a Focus ending)");
      await p.waitForTimeout(150); await touch(p);
      ok(await p.evaluate(() => window.sbHaptic("bogus")) === false, "an unknown kind does nothing");
      await calls(p);
      await p.evaluate(() => { window.sbHaptic("tick"); }); await p.waitForTimeout(150); await touch(p); await p.evaluate(() => { window.sbHaptic("tick"); });
      h = await calls(p);
      ok(h.filter(x => x[0] === "selectionStart").length === 1 && h.filter(x => x[0] === "selectionChanged").length === 2, `tick starts Apple's selection generator once, then ticks (${JSON.stringify(h)})`);
      await p.waitForTimeout(150); await touch(p); await p.evaluate(() => { window.sbHaptic("error"); }); h = await calls(p);
      ok(h.length === 1 && h[0][0] === "notification" && h[0][1] === "ERROR", "error is a notification");
      // deleting is a warning; Undo is a tap
      await p.waitForTimeout(150); await touch(p); await p.evaluate(() => __sbHaptic.del("t1")); await p.waitForTimeout(300); h = await calls(p);
      ok(h.some(x => x[0] === "notification" && x[1] === "WARNING"), `deleting a task is a warning (${JSON.stringify(h)})`);
      await p.waitForTimeout(150); const u = await p.$("#toastUndo"); await u.tap().catch(() => u.click()); await p.waitForTimeout(300); h = await calls(p);
      ok(h.length === 1 && h[0][0] === "impact", `Undo is a tap (${JSON.stringify(h)})`);
      ok(await p.evaluate(() => !!__sbHaptic.task("t1")), "and the task is back");
      // the last task left today: clearing the plan is a success
      await p.evaluate(() => { __sbHaptic.apply(["t1", "t2"].map(id => ({kind: "task", id, after: Object.assign(__sbHaptic.task(id), {status: "done", doneAt: Date.now()})}))); });
      await p.evaluate(() => { const t = __sbHaptic.task("t0"); t.status = "todo"; t.doneAt = null; t.due = __sbHaptic.today(); __sbHaptic.apply([{kind: "task", id: "t0", after: t}]); });
      await p.waitForTimeout(400);
      ok(await p.evaluate(() => !__sbHaptic.cleared()), "with a task due today, the plan isn't cleared");
      h = await checkOff(p, "t0");
      ok(h.length === 1 && h[0][0] === "notification" && h[0][1] === "SUCCESS", `checking off the last task of the day is a success (${JSON.stringify(h)})`);
      // Settings
      await p.evaluate(() => { const m = document.querySelector('[data-act="menu"]'); if (m) m.click(); }); await p.waitForTimeout(600);
      ok(await p.evaluate(() => !!dlg.querySelector('input[data-act="haptics"]')), "Settings has a Haptic Feedback row on a phone");
      // Try It: sends a tap at once and says it went to the iPhone
      await calls(p); await p.evaluate(() => dlg.querySelector('[data-act="haptic-try"]').click()); await p.waitForTimeout(900);
      { const h = await calls(p), t = await p.evaluate(() => document.getElementById("toastMsg").textContent);
        ok(h.length === 2 && h[0][0] === "impact" && h[0][1] === "HEAVY" && h[1][0] === "notification" && /Sent two taps/.test(t) && /System Haptics/.test(t), `Try It sends a strong tap and the success pattern, and says where to look if nothing is felt (${JSON.stringify(h)}; "${t}")`); }
      await p.evaluate(() => { const i = dlg.querySelector('input[data-act="haptics"]'); i.click(); }); await p.waitForTimeout(200);
      ok(await p.evaluate(() => localStorage.getItem("studyboard:haptics")) === "off", "turning it off is remembered on this device");
      await p.waitForTimeout(150); await touch(p);
      ok(await p.evaluate(() => window.sbHaptic("tap")) === false, "and then nothing fires");
      ok(!p.errs.length, "no page errors: " + p.errs.join(" | "));
      await ctx.close();
    }
    { // the iPhone app, from a build made without @capacitor/haptics
      const {ctx, p} = await open(b, {phone: true, native: true, noPlugin: true});
      await p.evaluate(() => { const m = document.querySelector('[data-act="menu"]'); if (m) m.click(); }); await p.waitForTimeout(600);
      await p.evaluate(() => dlg.querySelector('[data-act="haptic-try"]').click()); await p.waitForTimeout(300);
      const t = await p.evaluate(() => document.getElementById("toastMsg").textContent);
      ok(/can't reach the iPhone's haptics/.test(t) && /plugin listed: no/.test(t) && /newest build/.test(t), `Try It in a build without the haptics plugin says so, and what it can see ("${t}")`);
      ok(!p.errs.length, "no page errors: " + p.errs.join(" | "));
      await ctx.close();
    }
    { // a browser on an Android phone
      const {ctx, p} = await open(b, {phone: true});
      const h = await checkOff(p, "t0");
      ok(h.length === 1 && h[0][0] === "vibrate" && h[0][1] === "10", `the browser gets a short vibration (${JSON.stringify(h)})`);
      ok(!p.errs.length, "no page errors: " + p.errs.join(" | "));
      await ctx.close();
    }
    { // turned off before the app opened
      const {ctx, p} = await open(b, {phone: true, native: true, off: true});
      const h = await checkOff(p, "t0");
      ok(h.length === 0, "with Haptic Feedback off, checking off a task is silent");
      await ctx.close();
    }
    { // a computer
      const {ctx, p} = await open(b, {phone: false});
      ok(await p.evaluate(() => !__sbHaptic.device()), "a computer with a mouse isn't a haptic device");
      const h = await checkOff(p, "t0");
      ok(h.length === 0, "checking off a task on a computer is silent");
      await p.evaluate(() => { const m = document.querySelector('[data-act="menu"]'); if (m) m.click(); }); await p.waitForTimeout(600);
      ok(await p.evaluate(() => !dlg.querySelector('input[data-act="haptics"]')), "and Settings has no Haptic Feedback row");
      ok(!p.errs.length, "no page errors: " + p.errs.join(" | "));
      await ctx.close();
    }
    console.log("haptics.e2e: " + n + " checks passed");
  } finally { await b.close(); }
})().catch(e => { console.error(e); process.exit(1); });
