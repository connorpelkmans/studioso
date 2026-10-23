/* ===== module: 60-reminders.js ===== */
/* 60-reminders: Reminders and Notifications.
   Works out the reminders for the next 14 days from tasks, events, flashcards and settings, then delivers them:
   1. while the app is open (timers, a system notification or an in-app toast),
   2. by the desktop app with the window closed (DESK.setReminders),
   3. to phones and browsers with the app closed (Web Push through the user's own Supabase: reminder_queue + send-reminders). */
(() => {
/*@@RM-CORE*/
// The pure scheduling part. No app globals in here, so test/reminders-core.test.js can run it in Node.
const RM_CORE = (() => {
  const DEF = {tasks: true, dayBefore: true, dayTime: "18:00", hoursBefore: true, hours: 2, exams: true,
    events: true, eventLead: 15, classes: false, morning: false, morningTime: "07:30",
    nudges: true, nudgeTime: "16:00", cards: false, cardsTime: "19:00",
    quiet: true, quietFrom: "22:00", quietTo: "07:00", vapid: "", push: false};
  const HOUR = 36e5, DAY = 864e5, WINDOW = 14 * DAY, GRACE = 10 * 60000;
  const p2 = n => String(n).padStart(2, "0");
  const ymd = d => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
  const pd = s => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
  const addD = (s, n) => { const d = pd(s); d.setDate(d.getDate() + n); return ymd(d); };
  const isT = t => /^([01]\d|2[0-3]):[0-5]\d$/.test(t || "");
  const isD = s => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
  const mins = t => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
  const at = (day, t) => { const d = pd(day); const m = mins(isT(t) ? t : "09:00"); d.setHours(Math.floor(m / 60), m % 60, 0, 0); return d.getTime(); };
  const MS = type => type === "Exam" || type === "Quiz";
  // Per-task choices (t.remind). Minute ones need a due time; day ones use the chosen "day before" time.
  const OVR_MIN = {"0": 0, "15m": 15, "1h": 60, "2h": 120};
  const OVR_DAY = {"1d": 1, "2d": 2, "3d": 3, "1w": 7};
  const cfgOf = c => { const o = Object.assign({}, DEF, c || {}); ["dayTime", "morningTime", "nudgeTime", "cardsTime", "quietFrom", "quietTo"].forEach(k => { if (!isT(o[k])) o[k] = DEF[k]; });
    o.hours = Math.max(0.25, Math.min(24, Number(o.hours) || DEF.hours)); o.eventLead = Math.max(0, Math.min(240, Number(o.eventLead) || 0)); return o; };
  // Quiet hours: is this moment inside them, and when do they end / start around it.
  function inQuiet(ms, c){
    if (!c.quiet) return false;
    const d = new Date(ms), m = d.getHours() * 60 + d.getMinutes(), a = mins(c.quietFrom), b = mins(c.quietTo);
    if (a === b) return false;
    return a < b ? m >= a && m < b : m >= a || m < b;
  }
  function quietEnd(ms, c){
    const d = new Date(ms), m = d.getHours() * 60 + d.getMinutes(), b = mins(c.quietTo), day = ymd(d);
    return at(m < b ? day : addD(day, 1), c.quietTo);
  }
  function quietStart(ms, c){
    const d = new Date(ms), m = d.getHours() * 60 + d.getMinutes(), a = mins(c.quietFrom), day = ymd(d);
    return at(m >= a ? day : addD(day, -1), c.quietFrom) - 5 * 60000;
  }
  // Move a reminder out of quiet hours: to when they end, unless that's too late (after the deadline), then to just before they start.
  function place(ms, c, deadline, now){
    if (!inQuiet(ms, c)) return ms;
    const end = quietEnd(ms, c);
    if (!deadline || end <= deadline - 5 * 60000) return end;
    const start = quietStart(ms, c);
    return start > now ? start : null;
  }
  const list = (a, n) => a.length <= n ? a.join(", ") : a.slice(0, n).join(", ") + ` and ${a.length - n} more`;
  function hm(m){ const h = Math.floor(m / 60), r = m % 60; return h && r ? `${h}h ${r}m` : h ? `${h}h` : `${r}m`; }
  // in: {now, tasks, occ, cards, cfg, top, snoozes, fmtTime(hh:mm), fmtDay(iso)}; out: [{id, at, title, body, taskId, kind}] sorted by time.
  function compute(inp){
    const c = cfgOf(inp.cfg), now = inp.now, today = ymd(new Date(now)), end = now + WINDOW;
    const fT = inp.fmtTime || (t => t), fD = inp.fmtDay || (s => s);
    const out = [], ok = ms => ms != null && ms >= now - GRACE && ms <= end;
    const add = (r, deadline) => { const ms = place(r.at, c, deadline, now); if (!ok(ms)) return; r.at = ms; if (deadline && ms > deadline) return; out.push(r); };
    const dueMs = t => t.time && isT(t.time) ? at(t.due, t.time) : at(t.due, "23:59");
    const phrase = (t, ms) => {
      const timed = !!(t.time && isT(t.time)), dd = Math.round((pd(t.due) - pd(ymd(new Date(ms)))) / DAY);
      const what = MS(t.type) ? t.type : t.type === "Reading" ? "Read by" : "Due";
      const when = dd === 0 ? "today" : dd === 1 ? "tomorrow" : dd < 7 ? `on ${fD(t.due)}` : `on ${fD(t.due)}`;
      let s = `${what} ${when}${timed ? ` at ${fT(t.time)}` : ""}`;
      if (timed && dd === 0) { const left = Math.round((dueMs(t) - ms) / 60000); if (left > 0 && left <= 180) s = `${what} in ${hm(left)}, at ${fT(t.time)}`; }
      return s + (t.course ? ` · ${t.course}` : "");
    };
    // 1. Tasks
    (inp.tasks || []).forEach(t => {
      if (!t || !t.id || !isD(t.due) || t.status === "done" || t.type === "Study") return;
      const timed = !!(t.time && isT(t.time)), dl = dueMs(t), mk = (code, ms) => add({id: `r:t:${t.id}:${code}:${Math.round(ms / 60000).toString(36)}`, at: ms, title: t.title || "Task", body: "", taskId: t.id, kind: "task", _t: t}, dl);
      const o = t.remind;
      if (o === "off") return;
      if (o && (o in OVR_MIN || o in OVR_DAY)) {
        if (o in OVR_DAY) mk(o, at(addD(t.due, -OVR_DAY[o]), c.dayTime));
        else if (timed) mk(o, dl - OVR_MIN[o] * 60000);
        else mk(o, at(t.due, c.morningTime));
        return;
      }
      if (!c.tasks) return;
      if (c.dayBefore) mk("1d", at(addD(t.due, -1), c.dayTime));
      if (c.hoursBefore && timed) mk("h", dl - c.hours * HOUR);
      if (c.exams && MS(t.type)) mk("3d", at(addD(t.due, -3), c.dayTime));
    });
    // 2. Calendar events and (optionally) classes; study blocks count as study nudges
    (inp.occ || []).forEach(o => {
      if (!o || !isD(o.date) || !isT(o.start)) return;
      const startMs = at(o.date, o.start);
      if (o.study) { if (c.nudges) add({id: `r:n:${o.id}`, at: startMs - 10 * 60000, title: "Study Session Soon", body: `${o.title} at ${fT(o.start)}${o.where ? " · " + o.where : ""}`, taskId: "", kind: "nudge"}, startMs); return; }
      if (!c.events || (o.meeting && !c.classes)) return;
      add({id: `r:e:${o.id}`, at: startMs - c.eventLead * 60000, title: o.title || "Event", body: `${c.eventLead ? "Starts" : "Starting now,"} at ${fT(o.start)}${o.label ? " · " + o.label : ""}${o.where ? " · " + o.where : ""}`, taskId: "", kind: "event"}, startMs);
    });
    // 3. Study nudges for planned study sessions (Study tasks on their study day)
    if (c.nudges) (inp.tasks || []).forEach(t => {
      if (!t || t.type !== "Study" || t.status === "done" || t.remind === "off") return;
      // A one-day session is nudged on its day. A longer study task is nudged on the first day left and on its last day.
      const first = isD(t.start) ? t.start : t.due, last = isD(t.due) ? t.due : first;
      if (!isD(first)) return;
      const days = [...new Set([first < today && last >= today ? today : first, last])];
      const timed = !!(t.time && isT(t.time)), len = Number(t.hours) > 0 ? ` · about ${hm(Math.round(Number(t.hours) * 60))}` : "";
      days.forEach(day => {
        const soon = timed && day === last, ms = soon ? at(day, t.time) - 10 * 60000 : at(day, c.nudgeTime);
        add({id: `r:n:${t.id}:${day}`, at: ms, title: soon ? "Study Session Soon" : "Study Session Today", body: `${t.title}${len}${t.course ? " · " + t.course : ""}`, taskId: t.id, kind: "nudge"}, isD(t.due) ? dueMs(t) : null);
      });
    });
    // 4. Morning summary and 5. flashcards, once a day
    const open = (inp.tasks || []).filter(t => t && isD(t.due) && t.status !== "done");
    for (let i = 0; i < 14; i++) {
      const day = addD(today, i), next = addD(day, 1);
      if (c.morning) {
        const td = open.filter(t => t.due === day).map(t => t.title), tm = open.filter(t => t.due === next).map(t => t.title), bits = [];
        if (td.length) bits.push(`Due today: ${list(td, 3)}.`);
        if (tm.length) bits.push(`Tomorrow: ${list(tm, 3)}.`);
        if (inp.top) bits.push(`First on Today's Plan: ${inp.top}.`);
        add({id: `r:m:${day}`, at: at(day, c.morningTime), title: "Morning Summary", body: bits.join(" ") || "Nothing due today or tomorrow. A good day to get ahead.", taskId: "", kind: "morning"}, null);
      }
      if (c.cards) {
        const n = (inp.cards || []).filter(x => x && x.seen > 0 && (!x.due || x.due <= day)).length;
        if (n) add({id: `r:f:${day}`, at: at(day, c.cardsTime), title: "Flashcards Due", body: `${n} flashcard${n === 1 ? " is" : "s are"} ready for review. A few minutes keeps them fresh.`, taskId: "", kind: "cards"}, null);
      }
    }
    // Snoozed reminders pass straight through.
    (inp.snoozes || []).forEach(s => { if (s && s.id && ok(s.at)) out.push({id: s.id, at: s.at, title: s.title || "Reminder", body: s.body || "", taskId: s.taskId || "", kind: "snooze"}); });
    // Fill in task wording now that the final times are known; drop exact repeats (same task within 15 minutes).
    out.forEach(r => { if (r._t) { r.body = phrase(r._t, r.at); delete r._t; } });
    out.sort((a, b) => a.at - b.at || (a.id < b.id ? -1 : 1));
    const seen = new Set(), last = {};
    return out.filter(r => {
      if (seen.has(r.id)) return false; seen.add(r.id);
      if (r.taskId && r.kind === "task") { if (last[r.taskId] && r.at - last[r.taskId] < 15 * 60000) return false; last[r.taskId] = r.at; }
      return true;
    }).slice(0, 400);
  }
  return {DEF, cfgOf, compute, inQuiet, place, OVR_MIN, OVR_DAY, at, addD, ymd};
})();
/*@@RM-CORE-END*/

  const LS_FIRED = "studyboard:remFired", LS_SNOOZE = "studyboard:remSnooze", LS_PUSH = "studyboard:push";
  const FN = "send-reminders", SNOOZE_MIN = 60;
  const lsGet = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k) || "null"); return v == null ? d : v; } catch (e) { return d; } };
  const lsSet = (k, v) => { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  const rmCfg = () => RM_CORE.cfgOf(state.settings && state.settings.reminders);
  function rmSave(patch, quiet){
    state.settings = Object.assign({}, state.settings, {reminders: Object.assign({}, (state.settings && state.settings.reminders) || {}, patch)});
    saveSettings(); refreshSoon(80);
    if (!quiet) toast("Reminder settings saved");
  }
  const deskNative = () => !!(DESK && typeof DESK.setReminders === "function");
  const canNotify = () => "Notification" in window && (() => { try { return window.self === window.top; } catch (e) { return false; } })();
  const perm = () => canNotify() ? Notification.permission : "unsupported";
  const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const standalone = () => !!((window.matchMedia && matchMedia("(display-mode: standalone)").matches) || navigator.standalone);
  // The App Store / Google Play apps get notifications through APNs / FCM (native-bridge.js), not Web Push.
  const NB = () => window.StudyboardNative || null;
  const nativePush = () => { try { const n = NB(); return !!(n && n.pushAvailable && typeof n.enablePush === "function"); } catch (e) { return false; } };
  const pushCapable = () => nativePush() || (!DESK && !inClaude() && "serviceWorker" in navigator && "PushManager" in window && location.protocol === "https:");
  const needsHomeScreen = () => isIOS() && !standalone() && !nativePush();
  const appUrl = () => /^https?:$/.test(location.protocol) ? location.origin + location.pathname : "";
  const fmtAt = ms => { const d = new Date(ms), day = iso(d), t = pad(d.getHours()) + ":" + pad(d.getMinutes()), td = todayISO();
    return `${day === td ? "Today" : day === addDays(td, 1) ? "Tomorrow" : fmtDate(day)}, ${fmtTime(t)}`; };

  /* ---------- Working out the list ---------- */
  let LIST = [], lastSig = "", debT = 0, timer = 0;
  function gather(){
    const c = rmCfg(), today = todayISO(), now = Date.now();
    const tasks = tasksArr().filter(t => t.due && t.status !== "done").map(t => {
      const co = courseOf(t.courseId);
      return {id: t.id, title: t.title, type: t.type, due: t.due, time: t.time, start: t.start, status: t.status, remind: t.remind, hours: t.hours, course: co ? courseLabel(co) : ""};
    });
    let occ = [];
    if (c.events || c.nudges) {
      try {
        occ = schOccurrences(today, addDays(today, 14)).filter(o => !o.skipped && !o.allDay && o.start && o.type !== "avail").map(o => ({
          id: `${o.type === "meet" ? "c" : "e"}:${o.id}:${o.key}`, date: o.date, start: o.start, title: o.title, where: o.where || "", label: o.label || "",
          meeting: o.type === "meet", study: o.type === "event" && /\b(study|focus|revision|review session)\b/i.test(`${o.title} ${o.label}`)}));
      } catch (e) { console.warn("reminders: events", e); }
    }
    let cards = [];
    if (c.cards) { try { cards = decksArr().flatMap(d => (d.cards || []).map(x => ({due: x.due, seen: x.seen}))); } catch (e) {} }
    let top = "";
    if (c.morning) { try { const F = FOCUS || computeFocus(); const x = F && F.ranked && F.ranked.find(r => r.t && !MILESTONE(r.t.type)); top = x && x.t ? x.t.title : ""; } catch (e) {} }
    const snoozes = lsGet(LS_SNOOZE, []).filter(s => s && s.at > now - 36e5);
    return {now, tasks, occ, cards, cfg: c, top, snoozes, fmtTime, fmtDay: s => fmtDate(s)};
  }
  function refresh(){
    let list = [];
    try { list = RM_CORE.compute(gather()); } catch (e) { console.warn("reminders", e); return; }
    LIST = list;
    const sig = JSON.stringify(list.map(r => [r.id, r.at, r.title, r.body]));
    const changed = sig !== lastSig; lastSig = sig;
    if (changed) { deskSend(list); queueSoon(); }
    arm();
  }
  function refreshSoon(ms){ clearTimeout(debT); debT = setTimeout(refresh, ms == null ? 1200 : ms); }

  /* ---------- 1. While the app is open ---------- */
  function fired(){ const f = lsGet(LS_FIRED, {}), old = Date.now() - 2 * 864e5; Object.keys(f).forEach(k => { if (!(f[k] > old)) delete f[k]; }); return f; }
  function arm(){
    clearTimeout(timer);
    if (deskNative()) return;                      // the desktop app shows them itself, even with the window closed
    const f = fired(), now = Date.now();
    const due = LIST.filter(r => !f[r.id] && r.at <= now);
    if (due.length) {
      due.forEach(r => { f[r.id] = now; });
      lsSet(LS_FIRED, f);
      const fresh = due.filter(r => now - r.at <= 10 * 60000);
      if (fresh.length > 3) show({id: "r:batch:" + now, title: `${fresh.length} Reminders`, body: fresh.slice(0, 4).map(r => r.title).join(", "), taskId: ""});
      else fresh.forEach(show);
      markSent(due.map(r => r.id));
    }
    const next = LIST.find(r => !f[r.id] && r.at > now);
    timer = setTimeout(arm, Math.max(1000, Math.min(next ? next.at - now + 250 : 6e5, 6e5)));
  }
  async function swReg(){
    if (!("serviceWorker" in navigator)) return null;
    try { return (await Promise.race([navigator.serviceWorker.getRegistration(), sleep(1500).then(() => null)])) || null; } catch (e) { return null; }
  }
  async function show(r, force){
    const visible = !force && document.visibilityState === "visible" && document.hasFocus();
    if (visible || perm() !== "granted") {
      if (document.visibilityState === "visible") toast(`${r.title}${r.body ? ": " + r.body : ""}`, null, r.taskId && state.tasks[r.taskId] ? {label: "Open", fn: () => openTask(r.taskId)} : {label: "Snooze", fn: () => snooze(r)});
      if (visible) return;
    }
    if (DESK && typeof DESK.notify === "function") { try { await DESK.notify({title: r.title, body: r.body, taskId: r.taskId}); return; } catch (e) {} }
    if (perm() !== "granted") return;
    const data = {sbRem: 1, rid: r.id, taskId: r.taskId || "", title: r.title, body: r.body, url: appUrl()};
    const reg = await swReg();
    if (reg && reg.showNotification) {
      try {
        const actions = [{action: "snooze", title: "Snooze 1 Hour"}].concat(r.taskId ? [{action: "done", title: "Mark Done"}] : []);
        await reg.showNotification(r.title, {body: r.body, tag: r.id, data, icon: "icons/icon-192.png", badge: "icons/icon-192.png", actions});
        return;
      } catch (e) {}
    }
    try {
      const n = new Notification(r.title, {body: r.body, tag: r.id, icon: FAVICON});
      n.onclick = () => { try { window.focus(); } catch (e) {} n.close(); if (r.taskId) openTask(r.taskId); };
    } catch (e) {}
  }
  function openTask(id){
    const t = state.tasks[id];
    if (!t) { ui.tab = "board"; render(); return; }
    try { if (dlg.open) dlg.close(); } catch (e) {}
    taskForm(t);
  }
  function markDone(id){
    const t = state.tasks[id];
    if (!t) { toast("That task isn't here any more."); return; }
    if (t.status === "done") { toast(`${t.title} is already complete`); return; }
    // Same path as ticking the box, so undo, sync and celebrations all work.
    const b = document.createElement("button"); b.dataset.act = "toggle"; b.dataset.id = id; b.hidden = true;
    document.body.appendChild(b); b.click(); b.remove();
  }
  function snooze(r, minutes){
    const m = minutes || SNOOZE_MIN, base = String(r.rid || r.id || "x").replace(/^s:/, "").slice(0, 120);
    const s = {id: `s:${base}:${Date.now().toString(36)}`, at: Date.now() + m * 60000, title: r.title || "Reminder", body: r.body || "", taskId: r.taskId || ""};
    lsSet(LS_SNOOZE, lsGet(LS_SNOOZE, []).filter(x => x && x.at > Date.now() - 36e5).concat(s).slice(-30));
    toast(`Snoozed until ${fmtTime(pad(new Date(s.at).getHours()) + ":" + pad(new Date(s.at).getMinutes()))}`);
    refreshSoon(50);
  }
  // Taps on notification buttons, passed on by the service worker, or by the desktop app.
  function handle(msg){
    if (!msg || typeof msg !== "object") return;
    const act = msg.action, rid = String(msg.rid || ""), taskId = String(msg.taskId || "");
    const r = LIST.find(x => x.id === rid) || {id: rid, title: msg.title || "Reminder", body: msg.body || "", taskId};
    if (act === "snooze") snooze(Object.assign({}, r, {taskId: r.taskId || taskId}));
    else if (act === "done" && taskId) markDone(taskId);
    else if (taskId) openTask(taskId);
  }
  if ("serviceWorker" in navigator) { try { navigator.serviceWorker.addEventListener("message", e => { if (e.data && e.data.type === "sb-reminder") handle(e.data); }); } catch (e) {} }
  function bootUrl(){
    let q; try { q = new URLSearchParams(location.search); } catch (e) { return; }
    const act = q.get("sbrem"), task = q.get("sbtask"), rid = q.get("sbrid") || "";
    if (!act && !task) return;
    ["sbrem", "sbtask", "sbrid", "sbt", "sbb"].forEach(k => q.delete(k));
    try { history.replaceState(null, "", location.pathname + (q.toString() ? "?" + q : "") + location.hash); } catch (e) {}
    setTimeout(() => { refresh(); handle({action: act || "open", taskId: task || "", rid, title: "", body: ""}); }, 600);
  }

  /* ---------- 2. Desktop app, window closed ---------- */
  let deskSig = "";
  function deskSend(list){
    if (!deskNative()) return;
    const payload = list.map(r => ({id: r.id, at: r.at, title: r.title, body: r.body, taskId: r.taskId || ""}));
    const sig = JSON.stringify(payload);
    if (sig === deskSig) return;
    deskSig = sig;
    try { const p = DESK.setReminders(payload); if (p && p.catch) p.catch(e => console.warn("reminders: desktop", e)); } catch (e) { console.warn("reminders: desktop", e); }
  }
  if (DESK && typeof DESK.onOpenTask === "function") { try { DESK.onOpenTask(id => { if (id) openTask(String(id)); }); } catch (e) {} }

  /* ---------- 3. Phones and browsers, app closed: the queue in Supabase ---------- */
  const Q = {missing: false, err: "", at: 0, sig: "", busy: false, t: 0, vkey: "", vtried: 0};
  // On Studyboard's own server, one notification key is shared by everyone (the vapid_public row in studyboard_config).
  const hostedPush = () => { try { return SB_HOSTED && !sbCustom(); } catch (e) { return false; } };
  const vKey = () => hostedPush() ? Q.vkey : rmCfg().vapid;
  async function loadVkey(){
    if (!hostedPush() || Q.vkey || !sbActive() || Date.now() - Q.vtried < 60000) return Q.vkey;
    Q.vtried = Date.now();
    try { const {data} = await sb.from("studyboard_config").select("value").eq("key", "vapid_public").maybeSingle(); if (data && typeof data.value === "string" && data.value.length > 40) Q.vkey = data.value; } catch (e) {}
    return Q.vkey;
  }
  const cloudOk = () => { try { return sbActive() && cloud.on; } catch (e) { return false; } };
  function queueSoon(){ clearTimeout(Q.t); Q.t = setTimeout(queueSync, Math.max(1500, 20000 - (Date.now() - Q.at))); }
  const missingErr = e => /does not exist|Could not find the (function|table)|schema cache|PGRST20[0-9]|42P01|42883/i.test(String((e && (e.message || e.code)) || e));
  async function queueSync(){
    if (!cloudOk() || !rmCfg().push || Q.missing || Q.busy) return;
    const items = LIST.filter(r => r.at > Date.now() - 60000).map(r => ({id: r.id.slice(0, 200), fire_at: new Date(r.at).toISOString(), title: r.title.slice(0, 200), body: (r.body || "").slice(0, 1000),
      url: appUrl() ? appUrl() + (r.taskId ? "?sbtask=" + encodeURIComponent(r.taskId) : "") : "", task_id: r.taskId || ""}));
    const sig = JSON.stringify(items);
    if (sig === Q.sig) return;
    Q.busy = true; Q.at = Date.now();
    try {
      const {error} = await sb.rpc("studyboard_reminders_replace", {items});
      if (error) throw error;
      Q.sig = sig; Q.err = "";
    } catch (e) {
      if (missingErr(e)) Q.missing = true;
      Q.err = String((e && e.message) || e).slice(0, 200);
      console.warn("reminders: queue", e);
    }
    Q.busy = false;
  }
  // A reminder this device already showed shouldn't come again by push.
  async function markSent(ids){
    const mine = ids.filter(id => /^[rs]:/.test(id));
    if (!mine.length || !cloudOk() || !rmCfg().push || Q.missing) return;
    try {
      const {error} = await sb.rpc("studyboard_reminders_mark_sent", {ids: mine});
      // Servers that haven't re-run reminders.sql yet don't have the function: fall back to the direct update they still allow.
      if (error) await sb.from("reminder_queue").update({sent_at: new Date().toISOString()}).eq("user_id", sbUser.id).in("id", mine).is("sent_at", null);
    } catch (e) {}
  }

  /* ---------- Web Push on this device ---------- */
  const b64u = u8 => { let s = ""; u8.forEach(b => { s += String.fromCharCode(b); }); return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); };
  const unb64u = s => { const t = String(s).replace(/-/g, "+").replace(/_/g, "/"), b = atob(t + "===".slice((t.length + 3) % 4)); return Uint8Array.from(b, ch => ch.charCodeAt(0)); };
  async function makeVapid(){
    const kp = await crypto.subtle.generateKey({name: "ECDSA", namedCurve: "P-256"}, true, ["sign", "verify"]);
    const pub = new Uint8Array(await crypto.subtle.exportKey("raw", kp.publicKey));
    const jwk = await crypto.subtle.exportKey("jwk", kp.privateKey);
    return {publicKey: b64u(pub), privateKey: jwk.d};
  }
  function deviceLabel(){
    const u = navigator.userAgent, os = /iPhone/.test(u) ? "iPhone" : /iPad/.test(u) || isIOS() ? "iPad" : /Android/.test(u) ? "Android" : /Mac/.test(u) ? "Mac" : /Windows/.test(u) ? "Windows" : /CrOS/.test(u) ? "Chromebook" : /Linux/.test(u) ? "Linux" : "Device";
    const br = /Edg\//.test(u) ? "Edge" : /Firefox\//.test(u) ? "Firefox" : /Chrome\//.test(u) ? "Chrome" : /Safari\//.test(u) ? "Safari" : "Browser";
    return `${os}, ${standalone() ? "Home Screen app" : br}`;
  }
  const sameKey = (sub, key) => { try { const k = sub.options && sub.options.applicationServerKey; return !k || b64u(new Uint8Array(k)) === key; } catch (e) { return true; } };
  async function pushSub(){ const reg = await swReg(); if (!reg || !reg.pushManager) return {reg, sub: null}; try { return {reg, sub: await reg.pushManager.getSubscription()}; } catch (e) { return {reg, sub: null}; } }
  async function saveSub(sub){
    const j = sub.toJSON();
    const {error} = await sb.from("push_subscriptions").upsert({user_id: sbUser.id, endpoint: j.endpoint, p256dh: j.keys.p256dh, auth: j.keys.auth, device: deviceLabel(), updated_at: new Date().toISOString()}, {onConflict: "user_id,endpoint"});
    if (error) throw error;
    lsSet(LS_PUSH, {endpoint: j.endpoint, key: vKey(), at: Date.now()});
  }
  async function saveNativeSub(t){   // t = {platform, kind: "apns" | "fcm", token} from StudyboardNative.enablePush()
    const endpoint = t.kind + ":" + t.token;
    const {error} = await sb.from("push_subscriptions").upsert({user_id: sbUser.id, endpoint, kind: t.kind, p256dh: "", auth: "",
      device: (t.platform === "android" ? "Android" : isIOS() && /iPad/.test(navigator.userAgent) ? "iPad" : "iPhone") + ", Studyboard app", updated_at: new Date().toISOString()}, {onConflict: "user_id,endpoint"});
    if (error) throw error;
    lsSet(LS_PUSH, {endpoint, native: true, at: Date.now()});
  }
  async function pushOn(){
    if (nativePush()) {
      if (!cloudOk()) throw new Error("Sign in to your Studyboard account first.");
      const t = await NB().enablePush();
      if (!t || !t.token) throw new Error("Notifications weren't allowed. Allow them for Studyboard in your phone's Settings, then try again.");
      const old = lsGet(LS_PUSH, null);
      try { await saveNativeSub(t); }
      catch (e) { if (missingErr(e)) throw new Error(hostedPush() ? "Phone notifications aren't available yet. Please check back soon." : "The reminders tables aren't on your server yet. Run reminders.sql (step 1), then try again."); throw e; }
      if (old && old.endpoint && old.endpoint !== t.kind + ":" + t.token) { try { await sb.from("push_subscriptions").delete().eq("user_id", sbUser.id).eq("endpoint", old.endpoint); } catch (e) {} }
      if (!rmCfg().push) rmSave({push: true}, true);
      Q.missing = false; Q.sig = ""; queueSoon();
      return true;
    }
    await loadVkey();
    const key = vKey();
    if (!pushCapable()) throw new Error("This browser can't get notifications while Studyboard is closed.");
    if (needsHomeScreen()) throw new Error("On iPhone and iPad, add Studyboard to your Home Screen first, then open it from there and try again.");
    if (!cloudOk()) throw new Error("Sign in to your Studyboard account first.");
    if (!key) throw new Error(hostedPush() ? "Phone notifications aren't available yet. Please check back soon." : "Make your keys first (step 2).");
    const p = perm() === "granted" ? "granted" : await Notification.requestPermission();
    if (p !== "granted") throw new Error(p === "denied" ? "Notifications are blocked for Studyboard. Allow them in your browser or phone settings, then try again." : "Notifications weren't allowed.");
    const {reg} = await pushSub();
    if (!reg) throw new Error("Studyboard's offline helper isn't running yet. Reload the page and try again.");
    let sub = await reg.pushManager.getSubscription();
    if (sub && !sameKey(sub, key)) { try { await sub.unsubscribe(); } catch (e) {} sub = null; }
    if (!sub) sub = await reg.pushManager.subscribe({userVisibleOnly: true, applicationServerKey: unb64u(key)});
    try { await saveSub(sub); }
    catch (e) { if (missingErr(e)) throw new Error(hostedPush() ? "Phone notifications aren't available yet. Please check back soon." : "The reminders tables aren't on your server yet. Run reminders.sql (step 1), then try again."); throw e; }
    if (!rmCfg().push) rmSave({push: true}, true);
    Q.missing = false; Q.sig = ""; queueSoon();
    return true;
  }
  async function pushOff(){
    if (nativePush()) {
      const m = lsGet(LS_PUSH, null);
      try { if (typeof NB().disablePush === "function") await NB().disablePush(); } catch (e) {}
      if (m && m.endpoint && cloudOk()) { try { await sb.from("push_subscriptions").delete().eq("user_id", sbUser.id).eq("endpoint", m.endpoint); } catch (e) {} }
      lsSet(LS_PUSH, null);
      return;
    }
    const {sub} = await pushSub();
    if (sub) {
      const ep = sub.endpoint;
      try { await sub.unsubscribe(); } catch (e) {}
      if (cloudOk()) { try { await sb.from("push_subscriptions").delete().eq("user_id", sbUser.id).eq("endpoint", ep); } catch (e) {} }
    }
    lsSet(LS_PUSH, null);
  }
  // Keep this device's subscription saved (browsers sometimes renew it).
  let pushChecked = false;
  async function pushCheck(){
    if (pushChecked || !cloudOk() || !lsGet(LS_PUSH, null) || !pushCapable()) return;
    pushChecked = true;
    if (nativePush()) {   // the token can change (reinstall, restore): re-read it without prompting and save it when it did
      try {
        const mem = lsGet(LS_PUSH, {}), t = await NB().enablePush({prompt: false});
        if (!t || !t.token) return;
        const ep = t.kind + ":" + t.token;
        if (ep !== mem.endpoint || Date.now() - (mem.at || 0) > 7 * 864e5) {
          await saveNativeSub(t);
          if (mem.endpoint && mem.endpoint !== ep) { try { await sb.from("push_subscriptions").delete().eq("user_id", sbUser.id).eq("endpoint", mem.endpoint); } catch (e) {} }
        }
      } catch (e) { console.warn("reminders: native push check", e); }
      return;
    }
    try {
      const {sub} = await pushSub(), mem = lsGet(LS_PUSH, {});
      await loadVkey();
      const key = vKey();
      if (!sub || !key) return;
      if (!sameKey(sub, key)) { await pushOn(); return; }
      if (sub.endpoint !== mem.endpoint || Date.now() - (mem.at || 0) > 7 * 864e5) await saveSub(sub);
    } catch (e) { console.warn("reminders: push check", e); }
  }
  async function pushTest(){
    const {data, error} = await sb.functions.invoke(FN, {body: {action: "test"}});
    if (error) {
      let m = ""; try { const j = await error.context.json(); m = j.error || ""; } catch (e) {}
      throw new Error(m || (hostedPush() ? "Couldn't send a test just now. Please try again later." : /not found|404/i.test(String(error.message)) ? "The send-reminders function isn't deployed yet (step 3)." : "Couldn't reach the send-reminders function. Check step 3, then try again."));
    }
    return data || {};
  }

  /* ---------- Screens ---------- */
  const tIn = (k, v) => `<input type="time" class="rm-time" data-rm="${k}" value="${esc(v)}" aria-label="Time">`;
  const cb = (k, v, label) => `<label class="mi-check"><input type="checkbox" data-rm="${k}" ${v ? "checked" : ""}> ${label}</label>`;
  const sel = (k, v, opts, label) => `<select data-rm="${k}" class="rm-sel" aria-label="${esc(label)}">${opts.map(([x, l]) => `<option value="${x}" ${String(x) === String(v) ? "selected" : ""}>${esc(l)}</option>`).join("")}</select>`;
  function deviceStatus(){
    const p = perm(), rows = [];
    if (deskNative()) rows.push(`<p class="rm-ok"><b>This computer:</b> reminders show as desktop notifications, even with the window closed, while Studyboard runs in the ${DESK.platform === "darwin" ? "menu bar" : "notification area"}.</p>`);
    else if (p === "unsupported") rows.push(`<p class="mini" style="margin:0">This browser can't show notifications here, so reminders appear inside Studyboard while it's open.</p>`);
    else if (p === "granted") rows.push(`<p class="rm-ok"><b>This device:</b> notifications are on. Reminders show while Studyboard is open, even in another tab.</p>`);
    else if (p === "denied") rows.push(`<p class="plan-warn" style="margin:0">Notifications are blocked for Studyboard on this device. Allow them in your browser or phone settings, then come back. Until then, reminders appear inside Studyboard.</p>`);
    else rows.push(`<div class="rm-perm"><p style="margin:0">Studyboard can pop up a notification when something is coming up. Your browser will ask you to allow it. You can turn it off any time.</p><button type="button" class="btn primary" data-act="rm-perm">Turn On Notifications</button></div>`);
    return rows.join("");
  }
  function phoneRow(){
    if (DESK) return "";
    const set = !!lsGet(LS_PUSH, null);
    const sub = !sbConfig() || sbLocalOnly() || !sbUser ? "Needs a Studyboard account. Without it, reminders come only while Studyboard is open, or from the desktop app."
      : set ? "On for this device. Reminders arrive even when Studyboard is closed." : "Get reminders on your phone or computer even when Studyboard is closed.";
    return `<div class="menu-list rm-list"><button type="button" data-act="rm-phone"><span>Set Up Phone Notifications<span class="sub">${esc(sub)}</span></span></button></div>`;
  }
  function comingHtml(){
    const now = Date.now(), up = LIST.filter(r => r.at > now).slice(0, 5);
    const n = LIST.filter(r => r.at > now).length;
    return up.length ? `<ul class="rm-up">${up.map(r => `<li><time>${esc(fmtAt(r.at))}</time><span><b>${esc(r.title)}</b>${r.body ? `<span class="mini">${esc(r.body)}</span>` : ""}</span></li>`).join("")}</ul><p class="mini" style="margin:0">${n} reminder${n === 1 ? "" : "s"} in the next 14 days.</p>`
      : `<p class="mini" style="margin:0">No reminders in the next 14 days. Add due dates to your tasks, or turn on more options above.</p>`;
  }
  function setupSheet(){
    refresh();
    const c = rmCfg();
    const quietWarn = ["dayTime", "morningTime", "nudgeTime", "cardsTime"].filter(k => RM_CORE.inQuiet(RM_CORE.at(todayISO(), c[k]), c)).length;
    openSheet(`<div class="sheet rm-sheet">${head("Reminders and Notifications")}
      <div class="sheet-body">
        ${deviceStatus()}
        ${phoneRow()}
        <fieldset><legend>Task Reminders</legend>
          ${cb("tasks", c.tasks, "Remind me before tasks are due")}
          <div class="rm-sub" ${c.tasks ? "" : "hidden"}>
            <div class="rm-row">${cb("dayBefore", c.dayBefore, "1 day before, at")}${tIn("dayTime", c.dayTime)}</div>
            <div class="rm-row">${cb("hoursBefore", c.hoursBefore, "Before a due time:")}${sel("hours", c.hours, [[0.5, "30 minutes"], [1, "1 hour"], [2, "2 hours"], [3, "3 hours"], [6, "6 hours"]], "How long before")}</div>
            ${cb("exams", c.exams, "Exams and quizzes also 3 days before")}
          </div>
          <p class="mini" style="margin:0">You can change the reminder for a single task in its Advanced Settings.</p>
        </fieldset>
        <fieldset><legend>Calendar Events</legend>
          <div class="rm-row">${cb("events", c.events, "Before events:")}${sel("eventLead", c.eventLead, [[0, "At the start"], [5, "5 minutes"], [10, "10 minutes"], [15, "15 minutes"], [30, "30 minutes"], [60, "1 hour"]], "How long before")}</div>
          ${cb("classes", c.classes, "Include my classes and labs")}
        </fieldset>
        <fieldset><legend>Morning Summary</legend>
          <div class="rm-row">${cb("morning", c.morning, "Every morning at")}${tIn("morningTime", c.morningTime)}</div>
          <p class="mini" style="margin:0">What's due today and tomorrow, and the first thing on Today's Plan.</p>
        </fieldset>
        <fieldset><legend>Study Nudges</legend>
          <div class="rm-row">${cb("nudges", c.nudges, "Nudge me on study days at")}${tIn("nudgeTime", c.nudgeTime)}</div>
          <p class="mini" style="margin:0">For planned study sessions, like the ones from an exam study plan. Study sessions with a set time get a nudge 10 minutes before.</p>
        </fieldset>
        <fieldset><legend>Flashcards Due</legend>
          <div class="rm-row">${cb("cards", c.cards, "Once a day when cards are due, at")}${tIn("cardsTime", c.cardsTime)}</div>
        </fieldset>
        <fieldset><legend>Quiet Hours</legend>
          <div class="rm-row">${cb("quiet", c.quiet, "No reminders from")}${tIn("quietFrom", c.quietFrom)}<span>to</span>${tIn("quietTo", c.quietTo)}</div>
          <p class="mini" style="margin:0">Reminders during quiet hours arrive when they end, or just before they start if that would be too late.${quietWarn ? " <b>One of your times above is inside quiet hours</b>, so it will move." : ""}</p>
        </fieldset>
        <fieldset><legend>Coming Up</legend><div id="rmComing">${comingHtml()}</div></fieldset>
      </div>
      <div class="sheet-foot"><button type="button" class="btn" data-act="rm-test">Send a Test</button><span class="spacer"></span><button type="button" class="btn primary" data-act="close">Done</button></div>
    </div>`);
    const root = dlg.querySelector(".rm-sheet");
    $$("[data-rm]", root).forEach(el => el.addEventListener("change", () => {
      const k = el.dataset.rm, v = el.type === "checkbox" ? el.checked : el.tagName === "SELECT" ? Number(el.value) : el.value;
      if (el.type === "time" && !v) return;
      rmSave({[k]: v}, true);
      if (k === "tasks") { const s = root.querySelector(".rm-sub"); if (s) s.hidden = !v; }
      setTimeout(() => { refresh(); const box = $("#rmComing"); if (box) box.innerHTML = comingHtml(); }, 120);
    }));
  }
  async function askPermission(){
    if (!canNotify()) { toast("This browser can't show notifications. Reminders will appear inside Studyboard."); return false; }
    let p = Notification.permission;
    try { if (p === "default") p = await Notification.requestPermission(); } catch (e) {}
    if (p === "granted") { toast("Notifications are on for this device"); refreshSoon(50); }
    else if (p === "denied") toast("Notifications are blocked. Allow them in your browser settings to get reminders.");
    return p === "granted";
  }
  function phoneSheet(keys){
    const c = rmCfg(), local = !sbConfig() || sbLocalOnly(), set = !!lsGet(LS_PUSH, null);
    const email = sbUser && sbUser.email ? sbUser.email : "you@example.com";
    const copyBox = (label, name, val) => `<label class="f"><span class="lh">${esc(label)} <span class="hint">${esc(name)}</span></span><span class="key-row rm-key"><input type="text" readonly value="${esc(val)}" spellcheck="false" data-noenter><button type="button" class="btn small" data-act="rm-copy">Copy</button></span></label>`;
    const warns = `${needsHomeScreen() ? `<p class="plan-warn" style="margin:0"><b>On iPhone and iPad</b>, notifications only work after you add Studyboard to your Home Screen (Share, then Add to Home Screen) and open it from there. It needs iOS 16.4 or newer.</p>` : ""}
        ${!pushCapable() ? `<p class="plan-warn" style="margin:0">This browser can't get notifications while Studyboard is closed. Open Studyboard's web address in Chrome, Edge, Firefox or Safari${isIOS() ? " from your Home Screen" : ""}.</p>` : ""}`;
    const onBtns = `<div class="rm-btns">${set ? `<span class="rm-ok">On for this device</span><button type="button" class="btn small" data-act="rm-sub-off">Turn Off Here</button>` : `<button type="button" class="btn primary" data-act="rm-sub" ${pushCapable() && (nativePush() || vKey()) && !needsHomeScreen() ? "" : "disabled"}>Turn On for This Device</button>`}</div>`;
    const body = local ? `<p style="margin:0">Notifications that arrive while Studyboard is closed need a free Studyboard account, so they can reach all your devices. You're using Studyboard without one right now.</p>
        <p style="margin:0">Without it, reminders still work while Studyboard is open, and in the desktop app.</p>
        <button type="button" class="btn primary" data-act="sb-signin">Sign In or Create Account</button>`
      : !cloudOk() ? `<p style="margin:0">Sign in to your Studyboard account first, then come back here.</p><button type="button" class="btn primary" data-act="sb-signin">Sign In</button>`
      : hostedPush() ? `${warns}
        ${Q.vkey ? `<p style="margin:0">Get reminders on this phone or computer even when Studyboard is closed. Turn it on for each device you want them on.</p>
        ${onBtns}
        <div class="rm-btns"><button type="button" class="btn small" data-act="rm-ptest" ${set ? "" : "disabled"}>Send a Test Now</button></div>` : `<p style="margin:0">${Q.vtried ? "Notifications while Studyboard is closed aren't available yet. Please check back soon." : "Checking…"}</p>`}
        <p class="status-msg" id="rmPMsg" aria-live="polite"></p>`
      : `${needsHomeScreen() ? `<p class="plan-warn" style="margin:0"><b>On iPhone and iPad</b>, notifications only work after you add Studyboard to your Home Screen (Share, then Add to Home Screen) and open it from there. It needs iOS 16.4 or newer.</p>` : ""}
        ${!pushCapable() ? `<p class="plan-warn" style="margin:0">This browser can't get notifications while Studyboard is closed. Open Studyboard's web address in Chrome, Edge, Firefox or Safari${isIOS() ? " from your Home Screen" : ""}.</p>` : ""}
        <p style="margin:0">Your server sends reminders to your devices every 5 minutes, even when Studyboard is closed. It takes about 10 minutes to set up, once. The guide has every click; here's the short version.</p>
        <ol class="rm-steps">
          <li><b>Add the reminder tables.</b> In your server's dashboard, open <b>SQL Editor</b>, paste <code>reminders.sql</code>, put your Project URL and publishable key in the two marked lines at the top, and click <b>Run</b>.</li>
          <li><b>Make your keys.</b> These let your server send notifications that only your devices accept.
            ${keys ? `<div class="rm-keys">${copyBox("Public Key", "VAPID_PUBLIC_KEY", keys.publicKey)}${copyBox("Private Key", "VAPID_PRIVATE_KEY", keys.privateKey)}${copyBox("Contact", "VAPID_SUBJECT", "mailto:" + email)}
              <p class="mini" style="margin:0">In your server's dashboard open <b>Edge Functions</b>, then <b>Secrets</b>, and add these three with the names shown. <b>Copy the private key now.</b> Studyboard doesn't keep it, and it's never saved in your data.</p></div>`
              : c.vapid ? `<p class="mini rm-ok" style="margin:6px 0 0">Keys are made. If you lost the private key, make new ones and update all three secrets.</p><button type="button" class="btn small" data-act="rm-keys" data-id="again">Make New Keys</button>`
              : `<div><button type="button" class="btn" data-act="rm-keys">Make Keys</button></div>`}</li>
          <li><b>Add the send-reminders function.</b> In <b>Edge Functions</b>, deploy a new function named <code>send-reminders</code> with the code from <code>supabase-functions/send-reminders/index.ts</code>, and turn off <b>Verify JWT</b> for it.</li>
          <li><b>Turn it on for this device.</b> Do this on each phone or computer you want reminders on.
            <div class="rm-btns">${set ? `<span class="rm-ok">On for this device</span><button type="button" class="btn small" data-act="rm-sub-off">Turn Off Here</button>` : `<button type="button" class="btn primary" data-act="rm-sub" ${pushCapable() && (nativePush() || c.vapid) && !needsHomeScreen() ? "" : "disabled"}>Turn On for This Device</button>`}</div></li>
          <li><b>Check it works.</b> <button type="button" class="btn small" data-act="rm-ptest" ${set ? "" : "disabled"}>Send a Test Now</button></li>
        </ol>
        <p class="status-msg" id="rmPMsg" aria-live="polite">${Q.missing ? "Your server doesn't have the reminder tables yet. Run reminders.sql (step 1)." : ""}</p>`;
    openSheet(`<div class="sheet rm-sheet">${head("Set Up Phone Notifications")}<div class="sheet-body">${body}</div>
      <div class="sheet-foot"><button type="button" class="btn" data-act="rm-open">Back</button><span class="spacer"></span><button type="button" class="btn primary" data-act="close">Done</button></div></div>`);
  }
  const pmsg = t => { const m = $("#rmPMsg"); if (m) m.textContent = t; };

  /* ---------- Per-task reminder in the task form ---------- */
  const OVR = [["", "Default"], ["off", "No Reminder"], ["0", "At Due Time"], ["15m", "15 Minutes Before"], ["1h", "1 Hour Before"], ["2h", "2 Hours Before"], ["1d", "1 Day Before"], ["2d", "2 Days Before"], ["3d", "3 Days Before"], ["1w", "1 Week Before"]];
  let armed = null;
  const origForm = taskForm;
  taskForm = function (...a) {
    const r = origForm.apply(this, a);
    try { addPicker(a[0]); } catch (e) { console.warn("reminders: task form", e); }
    return r;
  };
  function addPicker(t){
    const form = dlg.querySelector("form.sheet"); if (!form || form.querySelector(".rm-pick")) return;
    const timeF = form.querySelector('[data-fld="time"]'), row = timeF && timeF.closest(".two");
    if (!row) return;
    const cur = t && t.remind ? String(t.remind) : "";
    row.insertAdjacentHTML("afterend", `<label class="f rm-pick"><span class="lh"><span class="lbl">Reminder</span> <span class="hint" id="rmPickHint"></span></span><select name="sbRemind" id="rmPick">${OVR.map(([v, l]) => `<option value="${v}" ${v === cur ? "selected" : ""}>${esc(l)}</option>`).join("")}</select></label>`);
    const pick = $("#rmPick", form), timeIn = form.querySelector('input[name="time"]'), typeSel = form.querySelector("#tfType");
    const upd = () => {
      const timed = !!(timeIn && timeIn.value && !timeIn.closest("[hidden]")), c = rmCfg();
      [...pick.options].forEach(o => { if (o.value in RM_CORE.OVR_MIN && o.value !== "0") o.disabled = !timed; if (o.value === "0") o.textContent = timed ? "At Due Time" : "Morning of the Due Date"; });
      if (pick.selectedOptions[0] && pick.selectedOptions[0].disabled) pick.value = "0";
      const def = [];
      if (c.tasks) { if (c.dayBefore) def.push(`1 day before at ${fmtTime(c.dayTime)}`); if (c.hoursBefore && timed) def.push(`${c.hours < 1 ? c.hours * 60 + " min" : c.hours + "h"} before`); if (c.exams && typeSel && MILESTONE(typeSel.value)) def.push("3 days before"); }
      $("#rmPickHint", form).textContent = pick.value === "" ? (def.length ? "Default: " + def.join(", ") : "Default reminders are off") : pick.value === "off" ? "" : (c.quiet ? "Moves out of quiet hours" : "");
    };
    if (timeIn) timeIn.addEventListener("input", upd);
    if (typeSel) typeSel.addEventListener("change", () => setTimeout(upd, 0));
    upd();
    const delBtn = form.querySelector('[data-act="delete-task"]');
    const editId = t && t.id && state.tasks[t.id] ? t.id : delBtn ? delBtn.dataset.id : null;
    const arm = () => { armed = {id: editId, isNew: !editId, val: pick.value}; setTimeout(() => { armed = null; }, 0); };
    const btn = form.querySelector("[data-submit]");
    if (btn) btn.addEventListener("click", arm, true);
    form.addEventListener("keydown", e => { if (e.key === "Enter" && e.target.tagName === "INPUT") arm(); }, true);
  }
  // The form's save builds its own task object, so the choice is added as the save goes through.
  const origApply = applyChanges;
  applyChanges = function (changes, label, extra) {
    const A = armed;
    if (A && Array.isArray(changes)) changes = changes.map(ch => {
      if (ch.kind !== "task" || !ch.after || !(A.isNew ? !state.tasks[ch.id] : ch.id === A.id)) return ch;
      const after = Object.assign({}, ch.after);
      if (A.val) after.remind = A.val; else delete after.remind;
      return Object.assign({}, ch, {after});
    });
    return origApply.call(this, changes, label, extra);
  };

  /* ---------- Hooks ---------- */
  hook("menu", () => {
    const c = rmCfg(), on = [c.tasks && "tasks", c.events && "events", c.morning && "morning summary", c.nudges && "study nudges", c.cards && "flashcards"].filter(Boolean);
    const where = deskNative() ? "Desktop notifications" : perm() === "granted" ? "Notifications on" : perm() === "denied" ? "Notifications blocked here" : "In the app only";
    return `<button data-act="rm-open"><span>Reminders and Notifications<span class="sub">${esc(on.length ? `${where}. Reminding you about ${on.join(", ")}.` : "All reminders are off.")}</span></span></button>`;
  });
  hook("reminders-setup", () => { setupSheet(); return true; });
  hook("changed", () => refreshSoon());
  let wasCloud = false;
  hook("render", () => {
    refreshSoon();
    const on = cloudOk();
    if (on && !wasCloud) { Q.sig = ""; pushCheck(); queueSoon(); }
    wasCloud = on;
  });
  hook("boot", () => { bootUrl(); refreshSoon(300); });
  hook("act", (act, el, id) => {
    switch (act) {
      case "rm-open": setupSheet(); return true;
      case "rm-perm": askPermission().then(() => { if (dlg.open && dlg.querySelector(".rm-sheet")) setupSheet(); }); return true;
      case "rm-test": {
        const r = {id: "r:test:" + Date.now(), title: "Test Reminder", body: "This is how Studyboard reminders look.", taskId: ""};
        if (deskNative() && typeof DESK.notify === "function") { DESK.notify({title: r.title, body: r.body}); toast("Test sent. Check your desktop notifications."); return true; }
        if (perm() === "granted") { toast("Test sent. It shows in a few seconds."); setTimeout(() => show(r, true), 4000); }
        else toast(`${r.title}: ${r.body}`);
        return true;
      }
      case "rm-phone": phoneSheet(null); if (hostedPush() && !Q.vkey) loadVkey().then(() => { if (dlg.open && dlg.querySelector(".rm-sheet")) phoneSheet(null); }); return true;
      case "rm-keys": {
        (id === "again" ? askBox({title: "Make New Keys?", text: "You'll need to update all three secrets on your server, and turn notifications on again on each device.", yes: "Make New Keys", danger: true}) : Promise.resolve(true)).then(go => go && makeVapid().then(k => { rmSave({vapid: k.publicKey}, true); lsSet(LS_PUSH, null); phoneSheet(k); })
          .catch(() => toast("Couldn't make keys in this browser. Try Chrome, Edge, Firefox or Safari.")));
        return true;
      }
      case "rm-copy": {
        const inp = el.parentElement.querySelector("input"); if (!inp) return true;
        inp.select();
        (navigator.clipboard ? navigator.clipboard.writeText(inp.value) : Promise.reject()).then(() => toast("Copied"), () => { try { document.execCommand("copy"); toast("Copied"); } catch (e) { toast("Select the text and copy it"); } });
        return true;
      }
      case "rm-sub": el.disabled = true; pmsg("Turning on…");
        pushOn().then(() => { phoneSheet(null); pmsg("On for this device. Send a test to check."); })
          .catch(e => { el.disabled = false; pmsg(String((e && e.message) || e)); });
        return true;
      case "rm-sub-off": pushOff().then(() => { phoneSheet(null); pmsg("Turned off for this device."); }); return true;
      case "rm-ptest": el.disabled = true; pmsg("Sending…");
        pushTest().then(d => { el.disabled = false; pmsg(d.sent ? `Sent to ${d.sent} device${d.sent === 1 ? "" : "s"}. It should arrive in a few seconds.` : d.error || "No devices are set up yet. Turn it on for this device first."); })
          .catch(e => { el.disabled = false; pmsg(String((e && e.message) || e)); });
        return true;
    }
    return false;
  });
  setInterval(() => { if (!deskNative()) arm(); }, 60000);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) { arm(); refreshSoon(500); } });
  window.studyboardReminders = {list: () => LIST.slice(), refresh, core: RM_CORE};
})();


