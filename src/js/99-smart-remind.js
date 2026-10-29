/* ===== module: 99-smart-remind.js ===== */
/* Smart Reminders (Pro): when a task due this week needs most of the free time left before it, one nudge comes at the start of
   your next real free window ("You have 2h free tonight and this needs about 3h by Thursday. Start now?"). The plan is worked out
   here and handed to the reminders list (60-reminders.js, gather() → RM_CORE.compute input "smart"), so it goes out the same ways
   as every other reminder: in the app, the desktop app and the push queue. At most one per task per day and two a day in all,
   never in quiet hours, never on a task you've already worked on today. */
var SBSMART = null;
/*@@SMR-CORE*/
// The pure part: no DOM and no app state (tests/smart-remind.test.js extracts this block)
const SMR_CORE = (() => {
  const MIN = 60000, HOUR = 36e5, GRACE = 10 * MIN;
  const AHEAD = 7, TIGHT = 0.7, MIN_WIN = 30, MIN_LEFT = 0.5, CAP = 2;
  const p2 = n => String(n).padStart(2, "0");
  const ymd = d => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
  const pd = s => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
  const addD = (s, n) => { const d = pd(s); d.setDate(d.getDate() + n); return ymd(d); };
  const isT = t => /^([01]\d|2[0-3]):[0-5]\d$/.test(t || "");
  const isD = s => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
  const mins = t => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
  // A wall-clock minute of a day (past 1440 runs into the next day), DST-safe
  const atMin = (day, m) => { const d = pd(day); d.setHours(0, m, 0, 0); return d.getTime(); };
  const dayDiff = (a, b) => Math.round((pd(b) - pd(a)) / 864e5);
  // "2h", "1h 45m": to the nearest 15 minutes, never under 15
  const hm = m => { m = Math.max(15, Math.round(m / 15) * 15); const h = Math.floor(m / 60), r = m % 60; return h && r ? `${h}h ${r}m` : h ? `${h}h` : `${r}m`; };
  // Quiet hours as intervals, from the day before `from` to `to`
  function quietIv(c, from, to){
    if (!c.quiet || !isT(c.quietFrom) || !isT(c.quietTo) || c.quietFrom === c.quietTo) return [];
    const a = mins(c.quietFrom), b = mins(c.quietTo), out = [];
    for (let d = addD(from, -1); d <= to; d = addD(d, 1)) out.push([atMin(d, a), atMin(d, b <= a ? b + 1440 : b)]);
    return out;
  }
  const minus = (iv, cuts) => cuts.reduce((cur, [x, y]) => cur.flatMap(([a, b]) => y <= a || x >= b ? [[a, b]] : [x > a ? [a, x] : null, y < b ? [y, b] : null].filter(Boolean)), iv);
  const overlap = (a, b, x, y) => Math.max(0, Math.min(b, y) - Math.max(a, x));
  const partOfDay = ms => { const h = new Date(ms).getHours(); return h < 12 ? "this morning" : h < 17 ? "this afternoon" : "tonight"; };
  // in: {now, cfg (reminder settings), tasks: [{id, title, type, due, time, status, remind, rem (hours left), worked (today)}],
  //   mode: "avail" with free: {date: [{s, e}]} (a day's free windows, minutes from its midnight), or "daily" with
  //   daily: {h (hours a day), today (hours left today), start, end (study day, minutes)}; sent: {"taskId|date": ms} what earlier
  //   plans scheduled (at or before now means it went out), fmtTime(hh:mm), fmtDay(iso), fmtWeekday(iso)}
  // out: [{id, at, title, body, taskId, key, kind: "smart"}]
  function plan(inp){
    const c = inp.cfg || {}, now = inp.now, today = ymd(new Date(now)), last = addD(today, AHEAD);
    if (c.smart === false) return [];
    const fT = inp.fmtTime || (t => t), fD = inp.fmtDay || (s => s), fW = inp.fmtWeekday || fD, sent = inp.sent || {}, cap = inp.cap || CAP;
    const q = quietIv(c, today, last), quiet = ms => q.some(([a, b]) => ms >= a && ms < b);
    // Free time as real moments, quiet hours taken out
    const slots = [];
    if (inp.mode === "daily") {
      const nt = isT(c.nudgeTime) ? c.nudgeTime : "16:00";
      for (let d = today; d <= last; d = addD(d, 1)) { const a = atMin(d, mins(nt)); if (!quiet(a)) slots.push({a, b: a + HOUR, date: d}); }
    } else {
      const free = inp.free || {};
      for (let d = today; d <= last; d = addD(d, 1)) (Array.isArray(free[d]) ? free[d] : []).forEach(w => {
        if (!(w && w.e > w.s)) return;
        minus([[atMin(d, w.s), atMin(d, w.e)]], q).forEach(([a, b]) => { if (b - a >= MIN_WIN * MIN) slots.push({a, b, date: ymd(new Date(a))}); });
      });
    }
    slots.sort((x, y) => x.a - y.a);
    const dueMs = t => isT(t.time) ? atMin(t.due, mins(t.time)) : atMin(t.due, 23 * 60 + 59);
    // Study time from `from` until the due moment: free windows, or the plan's daily hours
    const D = inp.daily || {};
    function room(t, from){
      const dl = dueMs(t);
      if (inp.mode !== "daily") return slots.reduce((m, s) => m + overlap(s.a, s.b, from, dl), 0) / MIN;
      const h = Math.max(0, Number(D.h) || 0), st = Number(D.start) || 420, en = Number(D.end) || 1380, fd = ymd(new Date(from));
      let tot = 0;
      for (let d = fd; d <= t.due; d = addD(d, 1)) {
        let x = d === today ? Math.max(0, Number(D.today) || 0) : h;
        if (d === t.due && isT(t.time)) x *= Math.max(0, Math.min(1, (mins(t.time) - st) / Math.max(60, en - st)));
        tot += x;
      }
      return Math.min(tot * 60, Math.max(0, dl - from) / MIN);
    }
    // What went out already: per task per day, and per day in all
    // (one due in the last 10 minutes stays in the list, so the app can still show it)
    const gone = {}, recent = {}, perDay = {};
    Object.keys(sent).forEach(k => { const ms = Number(sent[k]); if (!(ms <= now)) return; if (ms > now - GRACE) recent[k] = ms; else gone[k] = 1; const d = k.split("|").pop(); perDay[d] = (perDay[d] || 0) + 1; });
    const cand = (inp.tasks || []).filter(t => t && t.id && isD(t.due) && t.status !== "done" && t.type !== "Study" && t.remind !== "off" && Number(t.rem) >= MIN_LEFT)
      .map(t => { const dl = dueMs(t), dd = dayDiff(today, t.due), free = room(t, now); return {t, dl, dd, free, need: Number(t.rem) * 60}; })
      .filter(x => x.dd >= 0 && x.dd <= AHEAD && x.dl > now + MIN_WIN * MIN && x.free > 0 && x.need >= TIGHT * x.free)
      .sort((x, y) => y.need / y.free - x.need / x.free || x.dl - y.dl);
    const used = new Set(), out = [];
    cand.forEach(x => {
      const t = x.t;
      const s = slots.find(s => {
        const k = t.id + "|" + s.date, r = recent[k];
        if (gone[k] || used.has(s.a) || (r != null ? s.a !== r : s.a < now) || (perDay[s.date] || 0) - (r === s.a ? 1 : 0) >= cap) return false;
        if (s.date === today && t.worked) return false;
        return Math.min(s.b, x.dl) - s.a >= MIN_WIN * MIN;
      });
      if (!s) return;
      used.add(s.a); if (recent[t.id + "|" + s.date] !== s.a) perDay[s.date] = (perDay[s.date] || 0) + 1;
      const fd = ymd(new Date(s.a)), dd = dayDiff(fd, t.due), timed = isT(t.time);
      const by = dd === 0 ? (timed ? `${fT(t.time)} today` : "the end of today") : dd === 1 ? (timed ? `${fT(t.time)} tomorrow` : "tomorrow")
        : `${dd < 7 ? fW(t.due) : fD(t.due)}${timed ? ` at ${fT(t.time)}` : ""}`;
      const left = room(t, s.a), more = x.need > left + 1;
      let body;
      if (inp.mode === "daily") body = `This needs about ${hm(x.need)} by ${by}, and your plan has about ${hm(left)} of study time until then. Start now?`;
      else body = `You have ${hm((Math.min(s.b, x.dl) - s.a) / MIN)} free ${partOfDay(s.a)} and this needs about ${hm(x.need)} by ${by}${more ? ", more than your free time until then" : ""}. Start now?`;
      out.push({id: `r:s:${t.id}:${s.date}`, at: s.a, title: t.title || "Task", body, taskId: t.id, key: t.id + "|" + s.date, kind: "smart"});
    });
    return out.sort((a, b) => a.at - b.at);
  }
  // Keep the record of what was planned: drop plans that never went out, keep a few days of what did
  function remember(sent, list, now){
    const o = {}, today = ymd(new Date(now)), old = addD(today, -3);
    Object.keys(sent || {}).forEach(k => { const ms = Number(sent[k]), d = k.split("|").pop(); if (ms <= now && d >= old) o[k] = ms; });
    (list || []).forEach(r => { if (r && r.kind === "smart" && r.key && !(o[r.key] <= now)) o[r.key] = r.at; });
    return o;
  }
  return {plan, remember, hm, AHEAD, TIGHT, MIN_WIN, CAP};
})();
/*@@SMR-CORE-END*/

(() => {
  const LS_SENT = "studyboard:smartSent";
  const locked = () => !!(SBPRO && SBPRO.locked());
  const lsGet = () => { try { const v = JSON.parse(localStorage.getItem(LS_SENT) || "null"); return v && typeof v === "object" ? v : {}; } catch (e) { return {}; } };
  const lsSet = v => { try { localStorage.setItem(LS_SENT, JSON.stringify(v)); } catch (e) {} };
  const weekday = s => parse(s).toLocaleDateString(undefined, {weekday: "long"});
  // Free windows for the coming week, cached until something changes
  let FREE = {k: "", av: null, v: null};
  function freeMap(today){
    const last = addDays(today, SMR_CORE.AHEAD), av = availState(), k = today + "|" + (state.updated || 0);
    if (FREE.k === k && FREE.av === av) return FREE.v;
    const ext = availExtMap(today, last), v = {};
    for (let d = today; d <= last; d = addDays(d, 1)) v[d] = availFreeDay(d, null, ext).windows.map(w => ({s: w.s, e: w.e}));
    FREE = {k, av, v}; return v;
  }
  function list(c, now){
    if (!c || !c.smart || locked()) return [];
    const today = todayISO(), wt = t => { try { return (typeof workedToday === "function" && workedToday(t) > 0) || (typeof markedEnough === "function" && markedEnough(t)); } catch (e) { return false; } };
    const last = addDays(today, SMR_CORE.AHEAD);
    const tasks = tasksArr().filter(t => t.due && t.due >= today && t.due <= last && t.status !== "done" && t.type !== "Study" && t.remind !== "off")
      .map(t => ({id: t.id, title: t.title, type: t.type, due: t.due, time: t.time, status: t.status, remind: t.remind, rem: remainingOf(t), worked: wt(t)}));
    if (!tasks.length) return [];
    const active = availActive(), inp = {now, cfg: c, tasks, sent: lsGet(), fmtTime, fmtDay: s => fmtDate(s), fmtWeekday: weekday, mode: active ? "avail" : "daily"};
    if (active) inp.free = freeMap(today);
    else { const sd = studyDay(new Date(now)), th = todayHours(); inp.daily = {h: dailyHours(), today: sd.date === today ? Math.min(th, sd.left / 60) : th, start: sd.start, end: sd.end}; }
    return SMR_CORE.plan(inp);
  }
  // The final reminders list, after quiet hours and duplicates: remember what is planned
  function seen(all){
    const prev = lsGet(), next = SMR_CORE.remember(prev, (all || []).filter(r => r.kind === "smart" && r.key), Date.now());
    if (JSON.stringify(next) !== JSON.stringify(prev)) lsSet(next);
  }
  // The in-app toast offers Start Focus (an exam taken in person opens instead)
  function action(r){
    const t = r && r.kind === "smart" && state.tasks[r.taskId];
    if (!t || t.status === "done") return null;
    let can = true; try { can = typeof canDoNow !== "function" || canDoNow(t); } catch (e) {}
    return can ? {label: "Start Focus", fn: () => { try { if (dlg.open) dlg.close(); } catch (e) {} openPomo(t.id); }} : null;
  }
  // One row in Reminders and Notifications
  function row(c){
    if (locked()) return `<button type="button" class="pro-linkrow" data-act="smr-pro"><span>Smart Reminders</span>${PRO_BADGE}</button>`;
    return `<div class="rm-row"><label class="mi-check"><input type="checkbox" data-rm="smart" ${c.smart ? "checked" : ""}> Smart Reminders</label></div>
      <p class="mini" style="margin:0">When a task due this week needs most of your free time before it, a nudge comes at the start of your next free time. Uses your Availability, or your daily study hours.</p>`;
  }
  hook("act", act => {
    if (act !== "smr-pro") return false;
    if (typeof PLAN !== "undefined" && PLAN) PLAN.openSheet("Smart Reminders are part of Studyboard Pro: a nudge at the start of your free time when a task needs most of the time you have left.");
    return true;
  });
  if (SBPRO) SBPRO.addFeature({id: "smartremind", name: "Smart Reminders", where: "In Settings, Reminders and Notifications: nudges timed to your free time", act: "rm-open", icon: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/><path d="M12 2v1"/>'});
  SBSMART = {list, seen, action, row, core: SMR_CORE};
})();
