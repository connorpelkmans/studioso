/* ===== module: 71-native-actions.js ===== */
/* Reminder buttons on the phone apps: Mark Done and Snooze 1 Hour, pressed on the phone or on a paired watch, often with the app
   closed. The phone sends each press to the server itself and keeps it in a small queue (window.StudyboardNative.notifActions,
   native-bridge.js section 13) until the page runs; here a Mark Done ticks the task off on this device too (at the time it was
   pressed, with Undo), then the queue is acknowledged. A Snooze needs nothing here: the server sends the reminder again, or the
   phone shows it again itself when the server couldn't be reached. (The Focus timer's notification buttons go through
   StudyboardNative.focusActivity, the same as the iPhone's Live Activity: src/js/01-focus.js.) */
(() => {
  const api = () => { const n = window.StudyboardNative; return n && n.notifActions && typeof n.notifActions.drain === "function" ? n.notifActions : null; };
  // the queue's items, done in the page; returns the ids to acknowledge (every item, even one with nothing left to do)
  function applyNotifActions(list){
    const ids = [];
    (Array.isArray(list) ? list : []).forEach(a => {
      if (!a || typeof a.id !== "string" || !a.id) return;
      ids.push(a.id);
      if (a.kind !== "done" || typeof a.task !== "string") return;
      const t = state.tasks[a.task];
      if (!t || t.status === "done") return;
      const n = clone(t), now = Date.now();
      n.status = "done"; n.doneAt = Number(a.at) > 0 && Number(a.at) <= now ? Number(a.at) : now;
      if (!MILESTONE(t.type)) n.pct = 100;
      n.order = nextOrder("done");
      applyChanges([{kind: "task", id: t.id, after: n}], `Completed ${t.title} (from a reminder)`);
    });
    return ids;
  }
  let draining = false;
  function drainNotifActions(){
    const N = api(); if (!N || draining) return Promise.resolve();
    draining = true;
    return Promise.resolve().then(() => N.drain()).then(list => {
      const ids = applyNotifActions(list);
      if (ids.length && typeof N.ack === "function") return N.ack(ids);
    }).catch(() => {}).then(() => { draining = false; });
  }
  if (window.__SB_TEST) window.__sbNotifActions = {apply: applyNotifActions, drain: drainNotifActions};
  hook("boot", () => {
    if (!api()) return;
    drainNotifActions();
    document.addEventListener("visibilitychange", () => { if (!document.hidden) drainNotifActions(); });
  });
})();
