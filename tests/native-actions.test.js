// node tests/native-actions.test.js
// The page's side of the phone apps' notification buttons and Focus blocking:
//  - src/js/71-native-actions.js: Mark Done / Snooze presses queued by the phone (StudyboardNative.notifActions) are done in the page and
//    acknowledged;
//  - ios-wrapper/native-bridge.js: StudyboardNative.focusGuard (section 12) and notifActions (13) with stand-in plugins, only when the
//    plugin exists; the home-screen widgets (6b) and the Focus notification (7) on Android.
"use strict";
const fs = require("fs"), path = require("path"), vm = require("vm"), assert = require("assert");
const ROOT = path.join(__dirname, "..");
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
// (values made inside the vm are compared as plain JSON: their arrays and objects come from another realm)
const plain = v => v === undefined ? v : JSON.parse(JSON.stringify(v));
const eq = (a, b, m) => { n++; assert.deepStrictEqual(plain(a), plain(b), m); console.log("ok -", m); };
const tick = () => new Promise(r => setTimeout(r, 0));

/* ---- 71-native-actions.js ---- */
function page(native){
  const hooks = {}, changes = [], listeners = {};
  const state = {tasks: {
    t1: {id: "t1", title: "Lab report", type: "Assignment", status: "todo", pct: 40},
    t2: {id: "t2", title: "Midterm", type: "Exam", status: "todo"},
    t3: {id: "t3", title: "Essay", type: "Assignment", status: "done", doneAt: 5}
  }};
  const ctx = {
    window: {__SB_TEST: true, StudyboardNative: native},
    document: {hidden: false, addEventListener: (ev, fn) => { (listeners[ev] = listeners[ev] || []).push(fn); }},
    state, clone: o => JSON.parse(JSON.stringify(o)), MILESTONE: t => t === "Exam" || t === "Quiz", nextOrder: () => 99,
    applyChanges: (c, label) => { changes.push({c, label}); c.forEach(x => { state.tasks[x.id] = x.after; }); },
    hook: (name, fn) => { (hooks[name] = hooks[name] || []).push(fn); },
    Date, Promise, Number, Array, JSON, setTimeout
  };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(ROOT, "src", "js", "71-native-actions.js"), "utf8"), ctx);
  return {ctx, hooks, changes, listeners, state, api: ctx.window.__sbNotifActions};
}

(async () => {
  {
    const p = page(undefined);
    ok(typeof p.api.apply === "function" && typeof p.api.drain === "function", "test handle is there");
    (p.hooks.boot || []).forEach(f => f());
    ok(!p.listeners.visibilitychange, "without the native queue (website, desktop) nothing is listened for");
    const at = Date.now() - 3600000;
    const ids = p.api.apply([
      {id: "a1", kind: "done", task: "t1", at},
      {id: "a2", kind: "done", task: "t2", at: Date.now() + 999999},
      {id: "a3", kind: "done", task: "t3", at},
      {id: "a4", kind: "snooze", task: "t1", rid: "r:1", at, until: at + 3600000, server: true},
      {id: "a5", kind: "done", task: "gone", at},
      {kind: "done", task: "t1"}, null
    ]);
    eq(ids, ["a1", "a2", "a3", "a4", "a5"], "every item with an id is acknowledged, even when there's nothing left to do");
    eq(p.changes.length, 2, "two tasks were ticked off (one already done, one gone)");
    const t1 = p.state.tasks.t1, t2 = p.state.tasks.t2;
    ok(t1.status === "done" && t1.doneAt === at && t1.pct === 100 && t1.order === 99, "Mark Done ticks the task off at the time it was pressed");
    ok(t2.status === "done" && Math.abs(t2.doneAt - Date.now()) < 5000 && t2.pct === undefined, "a press time in the future becomes now; an exam gets no percentage");
    ok(/^Completed Lab report \(from a reminder\)$/.test(p.changes[0].label), "with an Undo label naming the task");
    ok(p.state.tasks.t3.doneAt === 5, "a task already done is left as it was");
  }
  {
    const acked = [], q = [{id: "x1", kind: "done", task: "t1", at: 1}, {id: "x2", kind: "snooze", task: "", at: 2}];
    const native = {notifActions: {drain: () => Promise.resolve(q.splice(0)), ack: ids => { acked.push(ids); return Promise.resolve(); }}};
    const p = page(native);
    (p.hooks.boot || []).forEach(f => f());
    await tick(); await tick();
    eq(acked, [["x1", "x2"]], "on start the queue is drained, done and acknowledged");
    ok(p.state.tasks.t1.status === "done", "the drained Mark Done is done in the page");
    ok(p.listeners.visibilitychange && p.listeners.visibilitychange.length === 1, "and again whenever the app comes back to the front");
    q.push({id: "x3", kind: "done", task: "t2", at: 3});
    p.listeners.visibilitychange[0](); await tick(); await tick();
    eq(acked[1], ["x3"], "a press made while the app was in the background is picked up on return");
    await p.api.drain(); await tick();
    eq(acked.length, 2, "an empty queue acknowledges nothing");
  }

  /* ---- native-bridge.js ---- */
  function bridge(platform, plugins){
    const noop = () => {};
    const el = () => ({classList: {add: noop, remove: noop, contains: () => false, toggle: noop}, style: {setProperty: noop}, appendChild: noop, setAttribute: noop});
    const win = {
      Capacitor: {isNativePlatform: () => true, getPlatform: () => platform, Plugins: plugins, isPluginAvailable: name => !!plugins[name], registerPlugin: name => plugins[name] || null},
      addEventListener: noop, removeEventListener: noop, dispatchEvent: noop, localStorage: {getItem: () => null, setItem: noop, removeItem: noop},
      location: {href: "https://localhost/", pathname: "/", search: "", hostname: "localhost", protocol: "https:"}, innerHeight: 800, innerWidth: 400, scrollY: 0,
      navigator: {userAgent: "Mozilla/5.0 (Linux; Android 15)", maxTouchPoints: 5}, screen: {width: 400, height: 800},
      document: {readyState: "complete", addEventListener: noop, querySelector: () => null, getElementById: () => null, documentElement: el(), body: el(), createElement: el, hidden: false},
      MutationObserver: function () { this.observe = noop; }, getComputedStyle: () => ({}), setTimeout, clearTimeout, URL, URLSearchParams, Promise, Date, JSON, Math, Number, String, Array, Object, Event: function () {}
    };
    win.window = win; win.self = win; win.top = win;
    vm.createContext(win);
    vm.runInContext(fs.readFileSync(path.join(ROOT, "ios-wrapper", "native-bridge.js"), "utf8"), win);
    return win.StudyboardNative;
  }
  {
    const N = bridge("android", {});
    ok(N && N.platform === "android", "the bridge runs (Android, no Studyboard plugins)");
    ok(!N.focusGuard && !N.notifActions && !N.homeWidgets && !N.focusActivity, "without the plugins there is no focusGuard, notifActions, homeWidgets or focusActivity");
  }
  {
    const calls = [];
    const FG = {
      available: () => Promise.resolve({dnd: true, apps: false}),
      pickApps: () => Promise.resolve({value: false}),
      start: o => { calls.push(o); return Promise.resolve({value: true}); },
      stop: () => Promise.resolve({value: true})
    };
    const N = bridge("android", {StudyboardFocusGuard: FG});
    const G = N.focusGuard;
    ok(G && ["available", "pickApps", "start", "stop"].every(k => typeof G[k] === "function"), "focusGuard has available, pickApps, start and stop");
    eq(await G.available(), {dnd: true, apps: false}, "available(): {dnd, apps} as booleans");
    eq(await G.pickApps(), false, "pickApps(): a boolean");
    const until = Date.now() + 25 * 60000;
    eq(await G.start({until, dnd: true, apps: false}), true, "start() resolves the plugin's answer");
    eq(calls[0], {until, apps: false, dnd: true}, "start() passes until, apps and dnd");
    eq(await G.start({until: Date.now() - 1000, dnd: true}), false, "an end in the past blocks nothing");
    eq(await G.start({until: Date.now() + 13 * 3600000, dnd: true}), false, "an end more than 12 hours away blocks nothing");
    eq(await G.start({until, dnd: false, apps: false}), false, "asking for neither blocks nothing");
    eq(calls.length, 1, "(and none of those reached the plugin)");
    eq(await G.stop(), true, "stop() resolves true");
    const bad = bridge("ios", {StudyboardFocusGuard: {available: () => Promise.reject(new Error("x")), start: () => Promise.reject(new Error("x")), stop: () => Promise.resolve(null)}});
    eq(await bad.focusGuard.available(), {dnd: false, apps: false}, "a failing plugin says nothing is available");
    eq(await bad.focusGuard.start({until, apps: true}), false, "a failing start resolves false");
    eq(await bad.focusGuard.pickApps(), false, "a missing method resolves false");
    eq(await bad.focusGuard.stop(), false, "an empty answer resolves false");
  }
  {
    let acked = null;
    const NA = {
      drain: () => Promise.resolve({items: [
        {id: "a-1", kind: "done", task: "t1", rid: "r:t:t1:1", at: 1700000000000, server: true},
        {id: "a-2", kind: "snooze", task: "", rid: "r:e:9", at: 1700000000001, until: 1700003600001, server: false},
        {id: "a-3", kind: "delete", task: "t1", at: 1},
        {id: "<script>", kind: "done", task: "t1", at: 1},
        {id: "a-4", kind: "done", task: "bad id!", at: 1},
        {id: "a-5", kind: "done", task: "t5", rid: "javascript:alert(1)/x", at: 1}
      ]}),
      ack: o => { acked = o; return Promise.resolve(); }
    };
    const N = bridge("ios", {StudyboardNotifActions: NA});
    const list = await N.notifActions.drain();
    eq(list.map(x => x.id), ["a-1", "a-2", "a-5"], "drain() keeps only well-formed done/snooze presses");
    eq(list[0], {id: "a-1", kind: "done", task: "t1", rid: "r:t:t1:1", at: 1700000000000, server: true}, "a Mark Done as the page gets it");
    eq(list[1], {id: "a-2", kind: "snooze", task: "", rid: "r:e:9", at: 1700000000001, server: false, until: 1700003600001}, "a Snooze with the time it comes back");
    eq(list[2].rid, "", "a malformed reminder id is dropped");
    await N.notifActions.ack(["a-1", 5, "a-2"]);
    eq(acked, {ids: ["a-1", "a-2"]}, "ack() passes the ids");
  }
  {
    const shown = [];
    const FA = {show: s => { shown.push(s); return Promise.resolve({shown: false}); }, end: () => Promise.resolve(), take: () => Promise.resolve({actions: [{a: "pause", t: 5, left: 300}, {a: "bad", t: 1}]}),
      alarm: () => Promise.resolve({allowed: true}), hasSound: () => Promise.resolve({value: true}), preview: () => Promise.resolve({played: true})};
    const HW = {save: () => Promise.resolve(), drain: () => Promise.resolve({items: [{id: "w1", kind: "done", task: "t1", at: 3}]}), ack: () => Promise.resolve(), clear: () => Promise.resolve()};
    const A = bridge("android", {StudyboardFocusActivity: FA, StudyboardHomeWidgets: HW});
    ok(A.homeWidgets && typeof A.homeWidgets.save === "function", "Android gets homeWidgets (the home-screen widgets) now");
    eq(await A.homeWidgets.drain(), [{id: "w1", kind: "done", task: "t1", at: 3}], "the widget check-off queue is the same as on iPhone");
    ok(A.focusActivity && typeof A.focusActivity.show === "function" && typeof A.focusActivity.take === "function", "Android gets focusActivity (the ongoing Focus notification)");
    ok(!A.focusActivity.alarm && !A.focusActivity.hasSound && !A.focusActivity.preview, "but not the iPhone's alarm and test sound");
    ok(!A.islandStatus, "and no Dynamic Island status");
    eq(await A.focusActivity.show({mode: "focus", label: "Focus", task: "Essay", running: true, endsAt: 9, total: 1500}), false, "show() resolves false on Android: the page keeps its header timer");
    eq(shown[0].task, "Essay", "the state reaches the plugin");
    eq(await A.focusActivity.take(), [{a: "pause", t: 5, left: 300}], "Pause/Stop presses come back through take()");
    const I = bridge("ios", {StudyboardFocusActivity: FA});
    ok(typeof I.focusActivity.alarm === "function" && typeof I.islandStatus === "function", "iPhone keeps its alarm and island status");
  }
  {
    // the Android build merges the widgets and other native parts and registers their plugins
    const b = fs.readFileSync(path.join(ROOT, "scripts", "android-build.js"), "utf8"), m = fs.readFileSync(path.join(ROOT, "android-wrapper", "app", "src", "main", "AndroidManifest.additions.xml"), "utf8");
    for (const p of ["StudyboardHomeWidgetsPlugin", "StudyboardFocusActivityPlugin", "StudyboardFocusGuardPlugin", "StudyboardNotifActionsPlugin"]) ok(b.includes(`registerPlugin(${p}::class.java)`), "MainActivity registers " + p);
    for (const r of [".widgets.TodayWidgetProvider", ".widgets.CountdownWidgetProvider", ".widgets.WidgetActionReceiver", ".focus.FocusActionReceiver", ".focus.FocusGuardReceiver", ".notify.ReminderActionReceiver", ".notify.StudyboardMessagingService"]) ok(m.includes(`android:name="${r}"`), "the manifest block declares " + r);
    ok(/WidgetActionReceiver"\s+android:exported="false"/.test(m) && /ReminderActionReceiver" android:exported="false"/.test(m), "the receivers that act on tasks are not exported");
    const jsNames = {"widgets/StudyboardHomeWidgetsPlugin.kt": "StudyboardHomeWidgets", "focus/StudyboardFocusActivityPlugin.kt": "StudyboardFocusActivity", "focus/FocusGuard.kt": "StudyboardFocusGuard", "notify/StudyboardNotifActionsPlugin.kt": "StudyboardNotifActions"};
    for (const [f, name] of Object.entries(jsNames)) ok(fs.readFileSync(path.join(ROOT, "android-wrapper/app/src/main/java/com/studyboardapp/studyboard", f), "utf8").includes(`@CapacitorPlugin(name = "${name}")`), f + " is the plugin " + name);
    const sw = {"FocusGuard/StudyboardFocusGuardPlugin.swift": "StudyboardFocusGuard", "Notifications/StudyboardNotifActions.swift": "StudyboardNotifActions"};
    for (const [f, name] of Object.entries(sw)) ok(fs.readFileSync(path.join(ROOT, "ios-wrapper/native", f), "utf8").includes(`jsName = "${name}"`), f + " has the same JS name, " + name);
    const mvc = fs.readFileSync(path.join(ROOT, "ios-wrapper/native/MainViewController.swift"), "utf8");
    ok(mvc.includes('"StudyboardFocusGuardPlugin"') && mvc.includes('"StudyboardNotifActionsPlugin"'), "MainViewController registers the two new iPhone plugins");
  }
  console.log("native-actions.test: " + n + " checks passed");
})().catch(e => { console.error(e); process.exit(1); });
