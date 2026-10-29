/* ===== module: 99-review-streaks.js ===== */
/* Weekly Review and Streaks That Forgive. Everything is worked out on this device from the planner's own data; nothing is sent anywhere.
   1. Weekly Review: a calm summary card on the Board from Sunday afternoon through Monday (also from Settings, Review My Week):
      what got done and the biggest wins, what slipped (matter of fact, with a one tap new day), approximate study time per course,
      next week from the Crunch Forecast (SBCRUNCH.model), upcoming exams, and one gentle idea. Optional AI recap, only when AI is already on.
      "Not Now" hides the card for the rest of the day (this device); "Skip This Week" hides it until next Sunday (synced, state.settings.review).
   2. Gentle Study Streak (state.settings.gentle, on by default for new accounts, opt in for everyone else): counts study days (a task finished, focus time tracked or logged, a checklist step
      ticked, flashcards reviewed), never just opening the app. Rest days never break it: up to 2 a week are free, the student can mark more,
      and chosen weekdays are always off. A longer break pauses and then softens the run instead of resetting it, the last 4 weeks are always
      shown, and the best run is kept. When it is on it replaces the fire emoji line from the daily quote code (streakLine in the quote module),
      and companion props follow it (shownStreak); the older counter (state.settings.streak) keeps running and still feeds scrapbook stickers.
   The pure logic sits between the RS-START and RS-END markers so tests/review-streaks.test.js can run it in Node under several time zones. */
(() => {
/*RS-START*/
// Pure functions only (no app globals)
const RS = (() => {
  const p2 = n => String(n).padStart(2, "0");
  const isDay = s => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
  const dn = s => Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10)) / 864e5;
  const fromDn = n => { const d = new Date(n * 864e5); return d.getUTCFullYear() + "-" + p2(d.getUTCMonth() + 1) + "-" + p2(d.getUTCDate()); };
  const add = (s, n) => fromDn(dn(s) + n);
  const diff = (a, b) => dn(b) - dn(a);
  const wday = s => new Date(dn(s) * 864e5).getUTCDay();
  const monday = s => add(s, -((wday(s) + 6) % 7));
  const dayOf = ms => { const d = new Date(Number(ms)); return isFinite(d.getTime()) ? d.getFullYear() + "-" + p2(d.getMonth() + 1) + "-" + p2(d.getDate()) : ""; };
  const isMil = t => !!t && (t.type === "Exam" || t.type === "Quiz");
  const bornDone = t => !!(t.created && t.doneAt && t.doneAt - t.created < 60000);
  const doneDay = t => t && t.status === "done" && Number(t.doneAt) > 0 ? dayOf(t.doneAt) : "";
  const TIME_RX = /^(Focus session|Logged time):? (\d+)m/;
  const CHK_RX = /^Checklist: (\d+)\/(\d+) → (\d+)\/(\d+)/;
  const DUE_RX = /^Due: /;
  const FOCUS_MIN = 5;

  /* The review window */
  const mkPeriod = (ws, kind) => ({weekStart: ws, weekEnd: add(ws, 6), nextStart: add(ws, 7), nextEnd: add(ws, 13), kind});
  // Sunday from noon
  function reviewWindow(today, hour){
    const w = wday(today);
    if (w === 0 && Number(hour) >= 12) return mkPeriod(add(today, -6), "sun");
    if (w === 1) return mkPeriod(add(today, -7), "mon");
    return null;
  }
  // The period to review
  function periodFor(today, hour, manual){
    const w = reviewWindow(today, manual ? 24 : hour);
    if (w) return w;
    if (!manual) return null;
    return Object.assign(mkPeriod(monday(today), "sofar"), {weekEnd: today});
  }
  function cardShown(o){
    const w = o.period, r = o.review || {};
    if (!w || r.off || !o.worth) return false;
    if (r.skip === w.weekStart || r.seen === w.weekStart) return false;
    return o.snoozeDay !== o.today;
  }

  /* Week numbers */
  const TYPE_W = {Exam: 6, Project: 5, Quiz: 3, Lab: 2, Assignment: 2, Reading: 1, Study: 1};
  const winScore = t => (TYPE_W[t.type] || 1) + Math.min(8, Number(t.hours) > 0 ? Number(t.hours) : 0) + (Number(t.weight) > 0 ? Math.min(10, Number(t.weight) / 5) : 0) + ({urgent: 2, high: 1}[t.priority] || 0);
  const roundMin = m => Math.round(Number(m) / 5) * 5;
  // o: {tasks, live (open tasks that still count, default tasks), period, today, focusDays
  function weekStats(o){
    const P = o.period, a = P.weekStart, b = P.weekEnd, today = o.today, inR = d => !!d && d >= a && d <= b;
    const all = (o.tasks || []).filter(t => t && typeof t === "object"), live = (o.live || all).filter(t => t && typeof t === "object");
    const done = [], steps = [], sessions = [];
    all.forEach(t => { const d = doneDay(t); if (!inR(d) || bornDone(t)) return; (t.prepFor ? sessions : t.breakdownOf ? steps : done).push(t); });
    const ranked = done.slice().sort((x, y) => winScore(y) - winScore(x) || y.doneAt - x.doneAt || String(x.title).localeCompare(String(y.title))), wins = ranked.slice(0, 3);
    let hoursEst = 0; done.forEach(t => { if (!isMil(t) && Number(t.hours) > 0) hoursEst += Number(t.hours); });
    const hDay = {}, hCourse = {};
    all.forEach(t => (Array.isArray(t.history) ? t.history : []).forEach(h => {
      const m = TIME_RX.exec(String((h && h.text) || "")), d = Number(h && h.at) > 0 ? dayOf(h.at) : "", min = m ? Number(m[2]) : 0;
      if (!m || !inR(d) || !(min > 0)) return;
      hDay[d] = (hDay[d] || 0) + min; hCourse[t.courseId || ""] = (hCourse[t.courseId || ""] || 0) + min;
    }));
    const fd = o.focusDays || {}, tm = o.time || {}, tmDay = tm.byDay || {};
    const byDay = {}; let total = 0;
    for (let d = a; d <= b; d = add(d, 1)) { const v = Math.max(hDay[d] || 0, Number(fd[d]) || 0, Number(tmDay[d]) || 0); if (v > 0) { byDay[d] = v; total += v; } }
    const cm = tm.byCourse && typeof tm.byCourse === "object" ? tm.byCourse : hCourse;
    const courses = Object.keys(cm).map(id => ({id, min: Number(cm[id]) || 0})).filter(x => x.min >= 1).sort((x, y) => y.min - x.min);
    const courseSum = courses.reduce((s, x) => s + x.min, 0);
    total = Math.max(total, courseSum);
    const other = total - courseSum >= FOCUS_MIN ? total - courseSum : 0;
    const open = x => x.status !== "done";
    const slipped = live.filter(t => open(t) && isDay(t.due) && t.due < today && !t.prepFor && !t.breakdownOf && !isMil(t))
      .map(t => ({id: t.id, title: t.title, courseId: t.courseId || "", due: t.due, older: t.due < a}))
      .sort((x, y) => (x.older - y.older) || (x.due < y.due ? -1 : x.due > y.due ? 1 : 0) || String(x.title).localeCompare(String(y.title)));
    const moved = live.filter(t => open(t) && (Array.isArray(t.history) ? t.history : []).some(h => DUE_RX.test(String((h && h.text) || "")) && inR(Number(h.at) > 0 ? dayOf(h.at) : ""))).length;
    const hz = o.horizon || 21, until = add(today, hz);
    const exams = live.filter(t => open(t) && isMil(t) && isDay(t.due) && t.due >= today && t.due <= until).sort((x, y) => (x.due < y.due ? -1 : x.due > y.due ? 1 : 0) || String(x.title).localeCompare(String(y.title)))
      .map(t => ({id: t.id, title: t.title, type: t.type, courseId: t.courseId || "", due: t.due}));
    let studyDays = 0; Object.keys(o.active || {}).forEach(d => { if (inR(d)) studyDays++; });
    return {done: done.map(t => t.id), doneN: done.length, stepsN: steps.length, sessionsN: sessions.length, wins: wins.map(t => ({id: t.id, title: t.title, courseId: t.courseId || "", type: t.type})),
      rest: ranked.slice(3, 200).map(t => ({id: t.id, title: t.title, courseId: t.courseId || "", type: t.type})),
      hoursEst: Math.round(hoursEst * 4) / 4, minutes: {total: Math.round(total), tracked: total >= FOCUS_MIN, courses, other: Math.round(other), byDay},
      slipped, moved, exams, studyDays};
  }
  function worth(st){ return st.doneN + st.stepsN + st.sessionsN > 0 || st.minutes.tracked || st.slipped.length > 0 || st.exams.length > 0; }
  // One idea, tied to something real
  function suggestion(c){
    if (c.slipped && c.slipped.length) return {kind: "slipped", title: c.slipped[0].title};
    const nop = (c.exams || []).find(x => x.noPrep);
    if (nop) return {kind: "prep", title: nop.title};
    if (c.level >= 3 && c.topTitle) return {kind: "early", title: c.topTitle};
    if (c.topTitle) return {kind: "first", title: c.topTitle};
    return {kind: "rest"};
  }
  // The day with the most room (lowest load), earliest on a tie
  function pickDay(days, extra){
    let best = null;
    (days || []).forEach(d => { const r = (Number(d.ratio) || 0) + ((extra || {})[d.date] || 0); if (!best || r < best.r - 1e-9) best = {date: d.date, r}; });
    return best ? best.date : "";
  }

  /* An AI recap is only used when it sticks to the facts it was given */
  const BAD_RX = /\b(fail(ed|ing|ure|s)?|lazy|guilt\w*|behind|disappoint\w*|procrastinat\w*|should have|didn't manage|falling|worthless|terrible|slack\w*|wasted?)\b/i;
  const DAY_RX = /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tues?|wed|thu(rs?)?|fri|sat|sun)\b/gi;
  const MONTH_RX = /\b(january|february|april|june|july|august|september|october|november|december|jan|feb|apr|jun|jul|aug|sept?|oct|nov|dec)\b/i;
  const EMOJI_RX = /[\u{1F300}-\u{1FAFF}☀-➿⭐️]/u;
  // facts: {text (what the model was shown), titles
  function vetRecap(text, facts){
    let s = String(text == null ? "" : text).replace(/\s+/g, " ").trim();
    if (!s || s.length > 600 || !facts) return "";
    s = s.replace(/\s*[–—]\s*/g, ", ").replace(/ - /g, ", ");
    if (EMOJI_RX.test(s) || BAD_RX.test(s) || MONTH_RX.test(s)) return "";
    const shown = String(facts.text || ""), okNum = new Set(shown.match(/\d+/g) || []);
    if ((s.match(/\d+/g) || []).some(n => !okNum.has(n))) return "";
    const shownDays = new Set((shown.match(DAY_RX) || []).map(x => x.toLowerCase().slice(0, 3)));
    if ((s.match(DAY_RX) || []).some(x => !shownDays.has(x.toLowerCase().slice(0, 3)))) return "";
    const real = new Set((facts.titles || []).map(x => String(x).toLowerCase().trim()));
    const q = s.match(/["“][^"“”]{1,100}["”]/g) || [];
    if (q.some(x => !real.has(x.slice(1, -1).toLowerCase().trim()))) return "";
    if ((s.match(/[.!?](\s|$)/g) || []).length > 5) return "";
    return s;
  }

  /* The gentle streak */
  const GRACE = 3, MAXBACK = 800;
  const MILESTONES = [3, 7, 14, 21, 30, 50, 75, 100, 150, 200, 365];
  const normCfg = c => {
    c = c && typeof c === "object" ? c : {};
    const r = c.rpw === "" || c.rpw == null ? 2 : Math.round(Number(c.rpw));
    const wd = Array.isArray(c.wd) ? [...new Set(c.wd.map(Number).filter(n => Number.isInteger(n) && n >= 0 && n <= 6))].sort().slice(0, 6) : [];
    const rests = {}; if (c.rests && typeof c.rests === "object") Object.keys(c.rests).forEach(d => { if (isDay(d) && c.rests[d]) rests[d] = 1; });
    return {rpw: isFinite(r) ? Math.max(0, Math.min(2, r)) : 2, wd, rests};
  };
  // A run that has been quiet (beyond rest days) for more than GRACE days softens to half
  const soften = (n, gap) => n <= 0 || gap <= GRACE ? n : Math.max(1, Math.ceil(n / Math.pow(2, 1 + Math.floor((gap - GRACE - 1) / 7))));
  // o: {today, active: {day: anything}, cfg
  function streak(o){
    const today = o.today, act = o.active || {}, cfg = normCfg(o.cfg);
    const keys = Object.keys(act).filter(d => isDay(d) && d <= today).sort();
    const res = {today, run: 0, gap: 0, best: Math.max(0, Math.floor(Number(o.best) || 0)), todayActive: !!act[today], last28: 0, lastActive: "", resumedAfter: 0, status: {}, first: keys[0] || "", cfg, restsLeft: cfg.rpw, paused: false, softened: false};
    for (let i = 0; i < 28; i++) if (act[add(today, -i)]) res.last28++;
    if (!keys.length) return res;
    const from = keys[0] < add(today, -MAXBACK) ? add(today, -MAXBACK) : keys[0];
    let n = 0, gap = 0, prevGap = 0; const used = {};
    for (let d = from; d <= today; d = add(d, 1)) {
      if (act[d]) { prevGap = gap; n = soften(n, gap) + 1; gap = 0; res.lastActive = d; if (n > res.best) res.best = n; res.status[d] = "active"; }
      else if (cfg.rests[d] || cfg.wd.indexOf(wday(d)) >= 0) res.status[d] = "rest";
      else if (d === today) res.status[d] = "open";
      else { const w = monday(d); if ((used[w] || 0) < cfg.rpw) { used[w] = (used[w] || 0) + 1; res.status[d] = "rest"; } else { res.status[d] = "quiet"; gap++; } }
    }
    res.run = soften(n, gap); res.gap = gap; res.paused = !res.todayActive && gap > 0; res.softened = n > 0 && res.run < n;
    res.resumedAfter = res.lastActive === today ? prevGap : 0;
    res.restsLeft = Math.max(0, cfg.rpw - (used[monday(today)] || 0));
    return res;
  }
  // The calendar dots
  function grid(res, weeks){
    const n = weeks || 5, today = res.today, start = add(monday(today), -7 * (n - 1)), out = [];
    for (let i = 0; i < n * 7; i++) {
      const d = add(start, i), off = res.cfg.wd.indexOf(wday(d)) >= 0, marked = !!res.cfg.rests[d];
      let st = d > today ? "future" : res.status[d] || "none";
      if ((st === "future" || st === "none") && (off || marked)) st = "rest";
      out.push({date: d, status: st, today: d === today, wd: wday(d), marked, off});
    }
    return out;
  }
  // said: {m: {n: day}, wb: day}. A milestone is the run reaching a round number today
  function celebration(res, said, today){
    said = said || {};
    if (!res.todayActive) return null;
    if (res.resumedAfter >= 4 && !(said.wb && diff(said.wb, today) < 7)) return {kind: "welcome"};
    if (MILESTONES.indexOf(res.run) >= 0) { const w = (said.m || {})[res.run]; if (!(w && diff(w, today) < 28)) return {kind: "milestone", n: res.run}; }
    return null;
  }
  // The wording stays with the app; this only says which pool a milestone uses
  const tier = n => n >= 30 ? "m30" : n >= 21 ? "m21" : n >= 14 ? "m14" : n >= 7 ? "m7" : "m3";
  return {isDay, dn, fromDn, add, diff, wday, monday, dayOf, reviewWindow, periodFor, cardShown, weekStats, worth, suggestion, pickDay, vetRecap, activityDays, normCfg, soften, streak, grid, celebration, tier, MILESTONES, GRACE, winScore, roundMin};
  function activityDays(src){
    const out = {}, from = src.from || "", to = src.to || "9999-12-31";
    const mark = (d, why) => { if (isDay(d) && d >= from && d <= to) { const o = out[d] || (out[d] = {}); o[why] = (o[why] || 0) + 1; } };
    (src.tasks || []).forEach(t => {
      if (!t || typeof t !== "object") return;
      if (t.status === "done" && Number(t.doneAt) > 0 && !bornDone(t)) mark(dayOf(t.doneAt), "done");
      (Array.isArray(t.history) ? t.history : []).forEach(h => {
        const txt = String((h && h.text) || ""), d = Number(h && h.at) > 0 ? dayOf(h.at) : "";
        if (!d) return;
        let m = TIME_RX.exec(txt);
        if (m) { if (Number(m[2]) >= FOCUS_MIN) mark(d, "focus"); return; }
        m = CHK_RX.exec(txt);
        if (m && Number(m[3]) > Number(m[1])) mark(d, "check");
      });
    });
    const fd = src.focusDays || {}; Object.keys(fd).forEach(d => { if (Number(fd[d]) >= FOCUS_MIN) mark(d, "focus"); });
    const lg = src.log || {}; Object.keys(lg).forEach(d => { if (lg[d]) mark(d, "log"); });
    (src.timeDays || []).forEach(d => mark(d, "focus"));
    return out;
  }
})();
/*RS-END*/

/* Small helpers */
const lsr = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
const lsw = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };
const stg = k => { const v = state.settings && state.settings[k]; return v && typeof v === "object" && !Array.isArray(v) ? v : {}; };
function setStg(k, patch){ state.settings = Object.assign({}, state.settings, {[k]: Object.assign({}, stg(k), patch)}); saveSettings(); }
const fmtD = (iso, o) => SBI18N.fmtD(parse(iso), o);
const dayShort = iso => fmtD(iso, {weekday: "short", month: "short", day: "numeric"});
const dayLong = iso => fmtD(iso, {weekday: "long"});
const cut = (s, n) => { s = String(s || ""); return s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s; };
function durText(min){
  const m = Math.max(0, RS.roundMin(min)), h = Math.floor(m / 60), r = m % 60;
  if (m <= 0) return tr("review.fewmin", "a few minutes");
  return h && r ? tr("review.hm", "{h}h {m}m", {h, m: r}) : h ? tr("review.h", "{h}h", {h}) : tr("review.m", "{m}m", {m: r});
}
const focusDaysNow = () => { try { return typeof SBSTATS !== "undefined" ? SBSTATS.focusDays() : {}; } catch (e) { return {}; } };
// SBTIME (the time tracking module) is optional
function sbtimeMap(v){
  if (!v) return null;
  const o = {};
  if (Array.isArray(v)) { v.forEach(x => { if (!x || typeof x !== "object") return; const k = x.id != null ? x.id : x.courseId != null ? x.courseId : x.course != null ? x.course : x.date != null ? x.date : x.day, m = Number(x.minutes != null ? x.minutes : x.min != null ? x.min : x.m); if (k != null && m > 0) o[k] = (o[k] || 0) + m; }); return o; }
  if (typeof v === "object") { Object.keys(v).forEach(k => { const x = v[k], m = Number(x && typeof x === "object" ? (x.minutes != null ? x.minutes : x.min) : x); if (m > 0) o[k] = m; }); return o; }
  return null;
}
function sbtimeRange(a, b){
  const T = window.SBTIME; if (!T) return null;
  try { return {byDay: (T.minutesByDay && sbtimeMap(T.minutesByDay(a, b))) || {}, byCourse: (T.minutesByCourse && sbtimeMap(T.minutesByCourse(a, b))) || undefined}; } catch (e) { return null; }
}
function sbtimeDays(a, b){
  const T = window.SBTIME; if (!T || !T.workedDays) return [];
  try { const v = T.workedDays(a, b); return (Array.isArray(v) ? v : v instanceof Set ? [...v] : v && typeof v === "object" ? Object.keys(v) : []).filter(x => typeof x === "string"); } catch (e) { return []; }
}
const aiWord = () => { try { return aiWho("AI"); } catch (e) { return "AI"; } };
const levelWord = i => [tr("review.lv.0", "a light week"), tr("review.lv.1", "a steady week"), tr("review.lv.2", "a fairly busy week"), tr("review.lv.3", "a heavy week"), tr("review.lv.4", "a big week")][Math.max(0, Math.min(4, i | 0))];

/* ================= Weekly Review ================= */
const SNOOZE = "studyboard:review:snooze";
const reviewCfg = () => stg("review");
const nowHour = () => new Date().getHours();
const periodNow = () => RS.periodFor(todayISO(), nowHour(), false);
let RVMEMO = {k: "", v: null};
function reviewStats(period){
  const today = todayISO(), a = period.weekStart, b = period.weekEnd, g = stg("gentle");
  const k = [state.updated || 0, today, a, b, Object.keys(state.tasks || {}).length].join("|");
  if (RVMEMO.k === k) return RVMEMO.v;
  const tasks = allTasks(), time = sbtimeRange(a, b);
  const active = RS.activityDays({tasks, focusDays: focusDaysNow(), log: g.log, timeDays: sbtimeDays(a, b), from: a, to: b});
  const st = RS.weekStats({tasks, live: tasksArr(), period, today, focusDays: focusDaysNow(), time, active});
  RVMEMO = {k, v: st};
  return st;
}
function crunchModel(){ try { return window.SBCRUNCH ? SBCRUNCH.model() : null; } catch (e) { return null; } }
// The week ahead from the Crunch Forecast
function planOf(period){
  const m = crunchModel(); if (!m || !m.weeks) return null;
  const W = m.weeks.find(w => w.start === period.nextStart); if (!W) return null;
  const days = (m.days || []).filter(D => D.date >= period.nextStart && D.date <= period.nextEnd).map(D => ({date: D.date, ratio: D.ratio, level: D.levelIdx,
    items: (D.top || []).filter(x => state.tasks[x.id] && (x.kind === "due" || x.hours >= 0.25 || x.total >= 0.5)).slice(0, 2)})).filter(D => D.items.length);
  return {week: W, days, level: W.levelIdx, headline: W.headline || "", top: (days[0] && days[0].items[0] && days[0].items[0].title) || ((W.top || []).find(x => state.tasks[x.id]) || {}).title || ""};
}
function examRows(st){
  return st.exams.map(x => { const t = state.tasks[x.id]; let plan = false; try { plan = !!(window.SBPREP && SBPREP.sessions && SBPREP.sessions(x.id).length); } catch (e) {} return Object.assign({}, x, {plan, noPrep: !plan && !!window.SBPREP && !!t}); });
}
function whenWord(period){ return period.kind === "mon" ? tr("review.when.last", "last week") : tr("review.when.this", "this week"); }
function cardSummary(st, period){
  const bits = [], when = whenWord(period);
  if (st.doneN) bits.push(trn("review.card.done", st.doneN, "You finished {n} task {when}.|You finished {n} tasks {when}.", {when}));
  else bits.push(tr("review.card.quiet", "Here is a quick look back at {when}.", {when}));
  if (st.minutes.tracked) bits.push(tr("review.card.time", "About {time} of study time.", {time: durText(st.minutes.total)}));
  if (st.slipped.length) bits.push(trn("review.card.slip", st.slipped.length, "{n} task could use a new day.|{n} tasks could use a new day."));
  return bits.join(" ");
}
function reviewCardHtml(){
  const period = periodNow(); if (!period) return "";
  const today = todayISO();
  if (RS.cardShown({period, review: reviewCfg(), snoozeDay: lsr(SNOOZE), today, worth: true}) === false) return "";
  if (!tasksArr().length) return "";
  const st = reviewStats(period);
  if (!RS.cardShown({period, review: reviewCfg(), snoozeDay: lsr(SNOOZE), today, worth: RS.worth(st)})) return "";
  const when = whenWord(period);
  return `<section class="wkr-card" role="region" aria-label="${esc(tr("review.card.aria", "Weekly review"))}">
    <div class="wkr-t"><b>${esc(period.kind === "mon" ? tr("review.card.titleLast", "Last week in review") : tr("review.card.title", "Your week in review"))}</b><span class="wkr-s">${esc(cardSummary(st, period))}</span></div>
    <div class="wkr-acts"><button type="button" class="btn small primary" data-act="wkr-open">${esc(tr("review.card.open", "See My Week"))}</button><button type="button" class="btn small" data-act="wkr-later" aria-label="${esc(tr("review.card.laterAria", "Not now, hide the review for today"))}">${esc(tr("review.card.later", "Not Now"))}</button><button type="button" class="btn small" data-act="wkr-skip" aria-label="${esc(tr("review.card.skipAria", "Skip the review for {when}", {when}))}">${esc(tr("review.card.skip", "Skip This Week"))}</button></div>
  </section>`;
}

/* The review sheet */
let RV = null;
const courseName = id => { const c = courseOf(id); return c ? courseLabel(c) : tr("review.nocourse", "No course"); };
const dot = id => `<span class="wkr-dot" style="background:${esc(colorOf(id))}" aria-hidden="true"></span>`;
function planDays(today){
  const m = crunchModel(), out = [];
  for (let i = 1; i <= 7; i++) { const d = RS.add(today, i), D = m && (m.days || []).find(x => x.date === d); out.push({date: d, ratio: D ? D.ratio : 0, cap: D ? D.capacity : 3}); }
  return out;
}
const movable = t => !!t && t.status !== "done" && !lmsOf(t);
function moveChange(t, to){ const n = clone(t); n.due = to; if (n.start && n.start > n.due) n.start = n.due; return {kind: "task", id: t.id, after: n}; }
const slipLimit = () => RV && RV.moreSlip ? 40 : 12;
function suggestTo(list){
  const days = planDays(todayISO()), extra = {}, out = {};
  list.forEach(x => { const t = state.tasks[x.id]; if (!movable(t)) return; const d = RS.pickDay(days, extra), D = days.find(y => y.date === d), h = Number(t.hours) > 0 ? Number(t.hours) : 1; extra[d] = (extra[d] || 0) + h / ((D && D.cap) || 3); out[x.id] = d; });
  return out;
}
function sectionDone(st){
  const n = st.doneN, when = whenWord(RV.period);
  let h = `<section class="wkr-sec"><h3>${esc(tr("review.done.h", "What got done"))}</h3>`;
  if (n) {
    h += `<p class="wkr-big"><b>${esc(SBI18N.fmtN(n))}</b> ${esc(trn("review.done.n", n, "task finished {when}|tasks finished {when}", {when}))}</p>`;
    const extra = [];
    if (st.stepsN) extra.push(trn("review.done.steps", st.stepsN, "{n} step along the way|{n} steps along the way"));
    if (st.sessionsN) extra.push(trn("review.done.sess", st.sessionsN, "{n} study session|{n} study sessions"));
    if (extra.length) h += `<p class="mini">${esc(tr("review.done.plus", "Plus {list}.", {list: extra.join(tr("review.and", " and "))}))}</p>`;
    const shown = RV && RV.moreDone ? st.wins.concat(st.rest || []) : st.wins;
    h += `<p class="mini" style="margin:0">${esc(tr("review.done.wins", "Biggest wins"))}</p><ul class="wkr-list">${shown.map(w => `<li>${dot(w.courseId)}<span class="wkr-li"><b>${esc(w.title)}</b><span class="mini">${esc(courseName(w.courseId))}${w.type ? " · " + esc(w.type) : ""}</span></span></li>`).join("")}</ul>`;
    if (n > st.wins.length && (st.rest || []).length) h += `<p class="mini"><button type="button" class="link-btn" data-act="wkr-more-done" aria-expanded="${RV && RV.moreDone ? "true" : "false"}">${esc(RV && RV.moreDone ? tr("review.less", "Show Fewer") : trn("review.done.more", n - st.wins.length, "and {n} more|and {n} more"))}</button></p>`;
  } else h += `<p>${esc(tr("review.done.none", "A quieter week for finishing tasks. That happens, and a fresh week is almost here."))}</p>`;
  return h + `</section>`;
}
function sectionTime(st){
  const t = st.minutes;
  let h = `<section class="wkr-sec"><h3>${esc(tr("review.time.h", "Time studied"))}</h3>`;
  if (t.tracked) {
    const rows = t.courses.map(x => ({id: x.id, label: courseName(x.id), min: x.min, color: x.id ? colorOf(x.id) : "var(--muted)"}));
    if (t.other) rows.push({id: "", label: tr("review.time.other", "Not tied to a course"), min: t.other, color: "var(--muted)"});
    const max = Math.max(1, ...rows.map(r => r.min));
    h += `<p class="wkr-big"><b>${esc(durText(t.total))}</b> ${esc(tr("review.time.total", "in all, about"))}</p>`;
    h += `<ul class="wkr-bars">${rows.slice(0, 8).map(r => `<li><span class="wkr-bn">${esc(r.label)}</span><span class="wkr-track" role="img" aria-label="${esc(tr("review.time.aria", "{course}: about {time}", {course: r.label, time: durText(r.min)}))}"><i style="width:${Math.max(4, Math.round(r.min / max * 100))}%;background:${esc(r.color)}"></i></span><span class="wkr-bv">${esc(durText(r.min))}</span></li>`).join("")}</ul>`;
    h += `<p class="mini">${esc(tr("review.time.note", "Time is approximate. It comes from your focus sessions and any time you logged."))}</p>`;
  } else {
    h += `<p>${esc(tr("review.time.none", "No focus time was tracked, so there is no study time to show."))}${st.hoursEst > 0 ? " " + esc(tr("review.time.est", "The tasks you finished were estimated at about {time} in all.", {time: durText(st.hoursEst * 60)})) : ""}</p>`;
    h += `<p class="mini">${esc(tr("review.time.tip", "Start a focus timer on a task and it will show up here next week."))}</p>`;
  }
  return h + `</section>`;
}
function sectionSlipped(st){
  const L = st.slipped, to = suggestTo(L.slice(0, slipLimit()));
  let h = `<section class="wkr-sec"><h3 id="wkrSlipH" tabindex="-1">${esc(tr("review.slip.h", "Dates that passed"))}</h3>`;
  if (!L.length) return h + `<p>${esc(tr("review.slip.none", "Nothing is waiting on a new date. That is a tidy list."))}</p>${st.moved ? `<p class="mini">${esc(trn("review.slip.moved", st.moved, "{n} due date was moved this week.|{n} due dates were moved this week."))}</p>` : ""}</section>`;
  h += `<p class="mini" style="margin:0 0 6px">${esc(tr("review.slip.intro", "These are still open and their dates have passed. Give each a new day, or leave them be."))}</p><ul class="wkr-list">`;
  L.slice(0, RV && RV.moreSlip ? slipLimit() : 6).forEach(x => {
    const t = state.tasks[x.id], can = movable(t) && to[x.id];
    h += `<li>${dot(x.courseId)}<span class="wkr-li"><button type="button" class="link-btn" data-act="edit-task" data-id="${esc(x.id)}">${esc(x.title)}</button><span class="mini">${esc(courseName(x.courseId))} · ${esc(tr("review.slip.was", "was due {date}", {date: dayShort(x.due)}))}</span></span>`;
    h += can ? `<button type="button" class="btn small" data-act="wkr-move" data-id="${esc(x.id)}" data-to="${esc(to[x.id])}" aria-label="${esc(tr("review.slip.moveAria", "Move {title} to {date}", {title: x.title, date: dayShort(to[x.id])}))}">${esc(tr("review.slip.move", "Move to {day}", {day: fmtD(to[x.id], {weekday: "short"})}))}</button>`
      : `<span class="mini">${esc(tr("review.slip.school", "Date comes from your school"))}</span>`;
    h += `</li>`;
  });
  h += `</ul>`;
  if (L.length > 6) h += `<p class="mini"><button type="button" class="link-btn" data-act="wkr-more-slip" aria-expanded="${RV && RV.moreSlip ? "true" : "false"}">${esc(RV && RV.moreSlip ? tr("review.less", "Show Fewer") : trn("review.slip.more", L.length - 6, "and {n} more|and {n} more"))}</button></p>`;
  if (Object.keys(to).length > 1) h += `<p style="margin:8px 0 0"><button type="button" class="btn small" data-act="wkr-moveall">${esc(tr("review.slip.all", "Spread Them Across the Week"))}</button></p>`;
  if (st.moved) h += `<p class="mini">${esc(trn("review.slip.moved", st.moved, "{n} due date was moved this week.|{n} due dates were moved this week."))}</p>`;
  return h + `</section>`;
}
function sectionPlan(period, plan){
  const when = period.nextStart <= todayISO() ? tr("review.plan.hthis", "This week") : tr("review.plan.h", "Next week");
  let h = `<section class="wkr-sec"><h3>${esc(when)}</h3>`;
  if (!plan || !plan.days.length) return h + `<p>${esc(tr("review.plan.none", "Nothing is scheduled yet. A quiet week is a fine week."))}</p></section>`;
  h += `<p style="margin:0">${esc(tr("review.plan.lv", "It looks like {level}.", {level: levelWord(plan.level)}))}${plan.headline ? " " + esc(tr("review.plan.head", "The main things: {what}.", {what: plan.headline})) : ""}</p>`;
  h += `<ul class="wkr-days">${plan.days.map(D => `<li><b>${esc(fmtD(D.date, {weekday: "short"}))}</b><span>${D.items.map(x => { const bit = x.kind === "due" ? tr("review.plan.due", "due") : x.hours >= 0.25 ? tr("review.plan.about", "about {time}", {time: durText(x.hours * 60)}) : ""; return esc(cut(x.title, 44)) + (bit ? ` <span class="mini">(${esc(bit)})</span>` : ""); }).join("<br>")}</span></li>`).join("")}</ul>`;
  h += `<p style="margin:8px 0 0"><button type="button" class="btn small" data-act="wkr-forecast" data-id="${esc(period.nextStart)}">${esc(tr("review.plan.open", "Open the Forecast"))}</button></p>`;
  return h + `</section>`;
}
function sectionExams(rows){
  let h = `<section class="wkr-sec"><h3>${esc(tr("review.exam.h", "Exams and quizzes coming up"))}</h3>`;
  if (!rows.length) return h + `<p>${esc(tr("review.exam.none", "No exams or quizzes in the next three weeks."))}</p><p class="mini">${esc(tr("review.exam.tip", "When one is added, Exam Prep can build a study plan for it."))}</p></section>`;
  h += `<ul class="wkr-list">${rows.map(x => `<li>${dot(x.courseId)}<span class="wkr-li"><button type="button" class="link-btn" data-act="edit-task" data-id="${esc(x.id)}">${esc(x.title)}</button><span class="mini">${esc(courseName(x.courseId))} · ${esc(dayShort(x.due))}${x.plan ? " · " + esc(tr("review.exam.plan", "study plan in place")) : ""}</span></span>${x.noPrep ? `<button type="button" class="btn small" data-act="wkr-prep" data-id="${esc(x.id)}" aria-label="${esc(tr("review.exam.prepAria", "Plan my prep for {title}", {title: x.title}))}">${esc(tr("review.exam.prep", "Plan My Prep"))}</button>` : ""}</li>`).join("")}</ul>`;
  return h + `</section>`;
}
function ideaText(s, plan){
  const title = cut(s.title, 50);
  if (s.kind === "slipped") return tr("review.idea.slipped", "Pick one of the dates that passed, \"{title}\", and give it a day. Small steps count.", {title});
  if (s.kind === "prep") return tr("review.idea.prep", "\"{title}\" is coming up and has no study plan yet. Exam Prep can make one in a minute.", {title});
  if (s.kind === "early") return tr("review.idea.early", "The week ahead looks like {level}. Starting \"{title}\" a little early would give you room.", {title, level: levelWord(plan ? plan.level : 3)});
  if (s.kind === "first") return tr("review.idea.first", "Choose \"{title}\" as your first task for the week so it is easy to begin.", {title});
  return tr("review.idea.rest", "Enjoy the quiet. Nothing is pressing, so resting is a fine plan.");
}
// optional AI recap
const AI_KEY = ws => "studyboard:review:ai:" + ws;
const RECAP_SCHEMA = {type: "OBJECT", properties: {recap: {type: "STRING", description: "One short paragraph, 2 to 4 sentences, warm and calm"}}, required: ["recap"]};
// The facts are always written in English, with English weekday names
const dayEn = iso => parse(iso).toLocaleDateString("en-US", {weekday: "long"});
const enDur = min => { const m = Math.max(5, RS.roundMin(min)), h = Math.floor(m / 60), r = m % 60; return h && r ? `${h}h ${r}m` : h ? `${h}h` : `${r}m`; };
const LV_EN = ["a light week", "a steady week", "a fairly busy week", "a heavy week", "a big week"];
function recapFacts(R, st, plan, rows){
  const L = [], name = id => courseName(id);
  L.push(`Week reviewed: ${R.period.weekStart} to ${R.period.weekEnd}.`);
  L.push(`Finished ${st.doneN} tasks${st.wins.length ? ": " + st.wins.map(w => `"${w.title}" (${name(w.courseId)})`).join("; ") : ""}.`);
  if (st.minutes.tracked) L.push(`Study time about ${enDur(st.minutes.total)}${st.minutes.courses.length ? ": " + st.minutes.courses.slice(0, 5).map(x => `${name(x.id)} ${enDur(x.min)}`).join("; ") : ""}.`);
  L.push(st.slipped.length ? `Still open with a passed date: ${st.slipped.slice(0, 5).map(x => `"${x.title}" (was due ${dayEn(x.due)})`).join("; ")}.` : "Nothing is waiting on a new date.");
  if (plan && plan.days.length) L.push(`Next week looks like ${LV_EN[Math.max(0, Math.min(4, plan.level | 0))]}. ${plan.days.slice(0, 5).map(D => `${dayEn(D.date)}: ${D.items.map(x => `"${x.title}"`).join(", ")}`).join("; ")}.`);
  if (rows.length) L.push(`Exams and quizzes: ${rows.map(x => `"${x.title}" on ${dayEn(x.due)}`).join("; ")}.`);
  return L.join("\n");
}
async function aiRecap(){
  const R = RV; if (!R || R.ai.busy || !aiReady()) return;
  const st = reviewStats(R.period), plan = planOf(R.period), rows = examRows(st), text = recapFacts(R, st, plan, rows);
  R.ai.busy = true; R.ai.msg = ""; drawReview(true);
  try {
    const r = await aiCall({task: "weekly", fast: true, maxTokens: 800, temperature: 0.4, schema: RECAP_SCHEMA, parts: [{text}],
      system: "You write one short, warm, calm paragraph in English recapping a student's week inside their planner. Use only the facts given: never add tasks, dates, numbers or courses that are not in them. Name tasks only by quoting their exact titles in double quotes. Mention days only by weekday name. Celebrate real progress, describe anything unfinished matter of factly, and never use guilt, blame, dashes or emoji. Return JSON only."});
    const ok = RS.vetRecap(r && r.data && r.data.recap, {text, titles: Object.values(state.tasks).map(t => t.title)});
    if (ok) { R.ai.text = ok; lsw(AI_KEY(R.period.weekStart), ok); } else R.ai.msg = tr("review.ai.reject", "That recap did not match your tasks closely enough, so it was not used. The summary above is what your planner knows.");
  } catch (e) { R.ai.msg = (e && e.message) || tr("review.ai.err", "Could not reach the AI just now."); }
  R.ai.busy = false; if (RV === R) drawReview(true);
}
function reviewBody(){
  const period = RV.period, st = reviewStats(period), plan = planOf(period), rows = examRows(st), today = todayISO();
  const range = tr("review.range", "{a} to {b}", {a: fmtD(period.weekStart), b: fmtD(period.weekEnd)});
  const idea = RS.suggestion({slipped: st.slipped, exams: rows, level: plan ? plan.level : 0, topTitle: plan ? plan.top : ""});
  let streakLine = "";
  try { if (SBSTREAK.on() && st.studyDays) streakLine = `<p class="mini">${esc(trn("review.streak", st.studyDays, "You had {n} study day this week.|You had {n} study days this week."))}</p>`; } catch (e) {}
  const ai = aiReady() ? `<section class="wkr-sec"><h3>${esc(tr("review.ai.h", "A short recap"))}</h3>${RV.ai.text ? `<p class="wkr-ai">${esc(RV.ai.text)}</p><p class="mini">${esc(tr("review.ai.note", "Written by {who} from the facts above. Check it against your own list.", {who: aiWord()}))}</p>` : ""}
      <button type="button" class="btn small" data-act="wkr-ai" ${RV.ai.busy ? "disabled" : ""}>${RV.ai.busy ? `<span class="ai-spin" aria-hidden="true"></span> ${esc(tr("review.ai.busy", "Writing…"))}` : esc(RV.ai.text ? tr("review.ai.again", "Write It Again") : tr("review.ai.btn", "Write a Recap"))}</button></section>` : "";
  return `<p class="wkr-range">${esc(range)}${period.kind === "sofar" ? ` <span class="mini">${esc(tr("review.sofar", "(so far this week)"))}</span>` : ""}</p>
    ${sectionDone(st)}${streakLine}${sectionTime(st)}${sectionSlipped(st)}${sectionPlan(period, plan)}${sectionExams(rows)}${window.SBPRO ? SBPRO.reviewHtml() : ""}
    <section class="wkr-sec wkr-idea"><h3>${esc(tr("review.idea.h", "One gentle idea"))}</h3><p style="margin:0">${esc(ideaText(idea, plan))}</p></section>${ai}
    <p class="status-msg" id="wkrMsg" aria-live="polite">${esc(RV.ai.msg || "")}</p>`;
}
// A move can be taken back right in the sheet
function liveNote(text, undo){
  const el = $("#wkrLive"); if (!el) return;
  el.textContent = text || "";
  if (undo) el.insertAdjacentHTML("beforeend", ` <button type="button" class="link-btn" data-act="wkr-undo">${esc(tr("review.undo", "Undo"))}</button>`);
}
function drawReview(keep){
  const b = dlg.querySelector(".wkr-body"); if (!b || !RV) return;
  const top = b.scrollTop, had = b.contains(document.activeElement), act = had && document.activeElement.dataset ? document.activeElement.dataset.act : "";
  RVMEMO = {k: "", v: null};
  b.innerHTML = reviewBody();
  if (keep) b.scrollTop = top;
  if (had) { const again = act && b.querySelector(`[data-act="${act}"]:not([disabled])`); (again || b.querySelector("#wkrSlipH") || b).focus(); }
}
function openReview(manual){
  const today = todayISO(), period = RS.periodFor(today, nowHour(), manual !== false); if (!period) return;
  RV = {period, ai: {text: lsr(AI_KEY(period.weekStart)) || "", busy: false, msg: ""}};
  if (period.kind !== "sofar") setStg("review", {seen: period.weekStart});
  if (dlg.open) dlg.close();
  openSheet(`<div class="sheet wkr-sheet">${head(tr("review.title", "Weekly Review"))}<div class="sheet-body wkr-body" aria-live="off"></div>
    <div class="sheet-foot"><span class="wkr-live" id="wkrLive" role="status" aria-live="polite"></span><span class="spacer"></span><button type="button" class="btn" data-act="close">${esc(tr("review.close", "Close"))}</button></div></div>`);
  drawReview(false);
  try { scheduleRender(); } catch (e) {}
}
dlg.addEventListener("close", () => { RV = null; });

/* ================= Gentle study streak ================= */
/* The answer to "Try It" / "No Thanks" is also kept on this device */
const FGS_CHOICE = "studyboard:fgs:choice";
const gcfg = () => stg("gentle");
function fgsRestore(){
  const g = gcfg(), c = lsr(FGS_CHOICE);
  if (!c || g.on !== undefined || g.intro !== undefined) return;
  setStg("gentle", c === "on" ? {on: true, intro: true, since: todayISO()} : {on: false, intro: true});
}
const gentleOn = () => { fgsRestore(); return !!gcfg().on; };
let GMEMO = {k: "", v: null};
function streakNow(){
  const today = todayISO(), g = gcfg();
  const k = [state.updated || 0, today, Object.keys(state.tasks || {}).length, (focusDaysNow()[today] || 0)].join("|");
  if (GMEMO.k === k && GMEMO.v) return GMEMO.v;
  const from = RS.add(today, -400), active = RS.activityDays({tasks: allTasks(), focusDays: focusDaysNow(), log: g.log, timeDays: sbtimeDays(from, today), from, to: today});
  // A day off (Take Today Off) counts as a rest day
  const res = RS.streak({today, active, cfg: Object.assign({}, g, {rests: Object.assign({}, state.settings && state.settings.daysOff, g.rests)}), best: g.best});
  GMEMO = {k, v: res};
  return res;
}
function streakLineText(res){
  const k = res.last28;
  if (res.run >= 2) return (res.resumedAfter >= 4 ? tr("streak.line.back", "Welcome back. ") : "") + tr("streak.line.run", "{n} study days in a row, and {k} in the last 4 weeks.", {n: SBI18N.fmtN(res.run), k: SBI18N.fmtN(k)}) + (res.todayActive ? "" : " " + tr("streak.line.open", "Today is still open."));
  if (k > 0) return trn("streak.line.month", k, "{n} study day in the last 4 weeks. Rest days never break this.|{n} study days in the last 4 weeks. Rest days never break this.");
  return tr("streak.line.start", "Any small step today starts a gentle streak. Rest days never break it.");
}
// In the details sheet the 4 week count is the big number, so the run line leaves it out
function runLineText(res){
  if (res.run >= 2) return (res.resumedAfter >= 4 ? tr("streak.line.back", "Welcome back. ") : "") + trn("streak.sum.run", res.run, "{n} study day in a row.|{n} study days in a row.") + (res.todayActive ? "" : " " + tr("streak.line.open", "Today is still open.")) + (res.paused && res.gap > 0 ? " " + tr("streak.sum.pause", "A pause is fine. Your next study day picks up from here.") : "");
  return tr("streak.sum.calm", "Rest days never break this. Any small step today counts.");
}
function chipText(res){
  if (res.run >= 2) return trn("streak.chip.run", res.run, "{n} study day in a row|{n} study days in a row");
  if (res.last28 > 0) return trn("streak.chip.month", res.last28, "{n} study day this month|{n} study days this month");
  return tr("streak.chip.start", "Study days");
}
const LEAF = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 19c0-8 5-13 14-14 0 9-5 14-13 14z"/><path d="M5 19c3-5 6-8 10-10"/></svg>';
function streakStripHtml(hideIntro){
  if (gentleOn()) {
    const res = streakNow();
    return `<div class="fgs-strip"><button type="button" class="fgs-chip" data-act="fgs-open" aria-label="${esc(tr("streak.chip.aria", "Study streak. {line} Open details.", {line: streakLineText(res)}))}"><span class="fgs-pill">${LEAF}<span>${esc(chipText(res))}</span></span></button></div>`;
  }
  const g = gcfg();
  if (g.intro || hideIntro || Object.keys(state.tasks || {}).length < 3) return "";
  return `<section class="fgs-intro" role="region" aria-label="${esc(tr("streak.intro.aria", "Optional gentle streak"))}">
    <div class="fgs-it"><b>${esc(tr("streak.intro.h", "A streak that forgives"))}</b><span>${esc(tr("streak.intro.p", "Optional. Counts days you study. Rest days never break it."))}</span></div>
    <div class="wkr-acts"><button type="button" class="btn small primary" data-act="fgs-on">${esc(tr("streak.intro.on", "Try It"))}</button><button type="button" class="btn small" data-act="fgs-open">${esc(tr("streak.intro.more", "Learn More"))}</button><button type="button" class="btn small" data-act="fgs-no">${esc(tr("streak.intro.no", "No Thanks"))}</button></div></section>`;
}

/* Seeing what happened today */
const CARDS = "studyboard:fgs:cards";
let fcSeen = 0;
function logDay(){
  const today = todayISO(), g = gcfg(), log = Object.assign({}, g.log);
  if (log[today]) return;
  log[today] = 1;
  const keep = Object.keys(log).sort().slice(-120), out = {}; keep.forEach(d => { out[d] = 1; });
  setStg("gentle", {log: out});
}
function noteCards(){
  const f = ui && ui.fc;
  if (ui.tab !== "flashcards" || !f || f.mode !== "study") { fcSeen = 0; return; }
  const n = (f.again || 0) + (f.hard || 0) + (f.good || 0) + (f.easy || 0);
  if (n < fcSeen) fcSeen = 0;
  if (n <= fcSeen) return;
  const add = n - fcSeen; fcSeen = n;
  let c = {d: "", n: 0}; try { c = JSON.parse(lsr(CARDS) || "{}"); } catch (e) {}
  const today = todayISO(); if (c.d !== today) c = {d: today, n: 0};
  c.n += add; lsw(CARDS, JSON.stringify(c));
  if (c.n >= 5) logDay();
}
// Keep what was seen
function observe(res){
  const g = gcfg(), patch = {};
  if (res.todayActive && !(g.log && g.log[res.today])) { const log = Object.assign({}, g.log); log[res.today] = 1; const out = {}; Object.keys(log).sort().slice(-120).forEach(d => { out[d] = 1; }); patch.log = out; }
  if (res.best > (Number(g.best) || 0)) patch.best = res.best;
  const rests = Object.keys(g.rests || {}).filter(d => d >= RS.add(res.today, -120)); if (rests.length !== Object.keys(g.rests || {}).length) { const r = {}; rests.forEach(d => { r[d] = 1; }); patch.rests = r; }
  if (Object.keys(patch).length) setStg("gentle", patch);
}

/* The companion */
const SAID = "studyboard:streak:said";
const saidRead = () => { try { const v = JSON.parse(lsr(SAID) || "{}"); return v && typeof v === "object" ? v : {}; } catch (e) { return {}; } };
function lines(c){
  if (c.kind === "welcome") return [tr("streak.say.back1", "Welcome back. I am glad you are here. Let's pick up gently."), tr("streak.say.back2", "There you are. It is good to study with you again.")];
  const n = SBI18N.fmtN(c.n), t = RS.tier(c.n);
  const P = {
    m3: [tr("streak.say.m3a", "{n} study days in a row. That is a lovely rhythm.", {n}), tr("streak.say.m3b", "{n} days of showing up. You are settling into something good.", {n})],
    m7: [tr("streak.say.m7a", "A whole week of study days. I noticed, and I am proud of you."), tr("streak.say.m7b", "Seven study days in a row. What a steady week.")],
    m14: [tr("streak.say.m14a", "Two weeks of steady study days. That takes real care."), tr("streak.say.m14b", "{n} study days in a row. Look at you go.", {n})],
    m21: [tr("streak.say.m21a", "Three weeks of study days. This is turning into a real habit."), tr("streak.say.m21b", "{n} days in a row. Your future self says thank you.", {n})],
    m30: [tr("streak.say.m30a", "{n} study days in a row. Look how far this has come.", {n}), tr("streak.say.m30b", "{n} days of steady work. I am so happy to study beside you.", {n})]
  };
  return P[t];
}
let celT = 0, celTries = 0;
function celebrateSoon(delay){ clearTimeout(celT); celTries = 0; celT = setTimeout(tryCelebrate, delay == null ? 2500 : delay); }
function tryCelebrate(){
  try {
    if (!gentleOn()) return;
    const res = streakNow(), c = RS.celebration(res, saidRead(), res.today); if (!c) return;
    const C = window.SBCOMP; if (!C || !C.el || !C.el() || !C._speech) return;
    const cs = C.settings && C.settings(); if (!cs || cs.on === false || cs.talk === false) return;
    const busy = document.hidden || dlg.open || (C.bubble && C.bubble()) || (typeof pomo !== "undefined" && pomo && pomo.running && pomo.mode === "focus");
    if (busy) { if (++celTries < 20) celT = setTimeout(tryCelebrate, 6000); return; }
    const line = C._speech.choose(lines(c), "streak");
    if (!line) return;
    if (C.cheer) C.cheer("task");
    C.say(line, {cheer: true, name: false, again: false, cat: "streak"});
    if (C.bubble && C.bubble() === line) {
      const s = saidRead(); s.m = s.m || {};
      if (c.kind === "welcome") s.wb = res.today; else s.m[c.n] = res.today;
      lsw(SAID, JSON.stringify(s));
    } else if (++celTries < 20) celT = setTimeout(tryCelebrate, 6000);
  } catch (e) { console.warn("streak companion", e); }
}

/* The details sheet */
let SG = false;
const WD = [1, 2, 3, 4, 5, 6, 0];
const wdName = d => fmtD(RS.add("2026-10-04", d), {weekday: "long"});
const wdShort = d => fmtD(RS.add("2026-10-04", d), {weekday: "narrow"});
const STAT_WORD = {active: () => tr("streak.st.active", "study day"), rest: () => tr("streak.st.rest", "rest day"), quiet: () => tr("streak.st.quiet", "quiet day"), open: () => tr("streak.st.open", "today, still open"), future: () => tr("streak.st.future", "coming up"), none: () => tr("streak.st.none", "no record")};
function gridHtml(res){
  const cells = RS.grid(res, 5);
  const hd = WD.map(d => `<span class="fgs-h" aria-hidden="true">${esc(wdShort(d))}</span>`).join("");
  const body = cells.map(c => {
    const label = `${dayShort(c.date)}, ${STAT_WORD[c.status]()}${c.marked ? ", " + tr("streak.st.marked", "marked as a rest day") : ""}`;
    const can = c.status !== "active";
    return `<button type="button" class="fgs-d st-${c.status}${c.today ? " is-today" : ""}" data-act="fgs-day" data-id="${esc(c.date)}" aria-label="${esc(label)}" ${can ? `aria-pressed="${c.marked}"` : `aria-disabled="true"`}><span class="fgs-dot" aria-hidden="true"></span></button>`;
  }).join("");
  return `<div class="fgs-grid" role="group" aria-label="${esc(tr("streak.grid.aria", "The last five weeks. Tap a day that is not a study day to mark or unmark it as a rest day."))}">${hd}${body}</div>
    <p class="fgs-legend mini"><span class="lg"><i class="fgs-dot st-active"></i>${esc(tr("streak.lg.active", "Study day"))}</span><span class="lg"><i class="fgs-dot st-rest"></i>${esc(tr("streak.lg.rest", "Rest day"))}</span><span class="lg"><i class="fgs-dot st-quiet"></i>${esc(tr("streak.lg.quiet", "Quiet day"))}</span></p>`;
}
function streakBody(){
  const g = gcfg(), res = streakNow(), on = !!g.on, cfg = res.cfg;
  let h = `<p style="margin:0">${esc(tr("streak.about", "A study day is any day you finish a task, track focus time, tick a checklist step or review flashcards. Just opening the app doesn't count, and a quiet day never takes your progress away."))}</p>
    <label class="fgs-row"><input type="checkbox" data-act="fgs-toggle" ${on ? "checked" : ""}> <span><b>${esc(tr("streak.toggle", "Use the gentle streak"))}</b><span class="mini">${esc(tr("streak.toggle.sub", "When on, it replaces the fire streak line, and companion rewards follow it."))}</span></span></label>`;
  if (on) {
    h += `<div class="fgs-sum" aria-live="polite"><p class="fgs-big"><b>${esc(SBI18N.fmtN(res.last28))}</b> ${esc(trn("streak.sum.month", res.last28, "study day in the last 4 weeks|study days in the last 4 weeks"))}</p>
      <p style="margin:0">${esc(runLineText(res))}</p>
      <p class="mini" style="margin:2px 0 0">${esc(tr("streak.best", "Best run: {n}. It stays, whatever happens next.", {n: SBI18N.fmtN(res.best)}))}${res.softened ? " " + esc(tr("streak.soft", "Your run is resting at a gentler number until your next study day.")) : ""}</p></div>`;
    h += gridHtml(res);
    const today = res.today, st = res.status[today];
    if (st === "open" || cfg.rests[today]) h += `<p style="margin:6px 0 0"><button type="button" class="btn small" data-act="fgs-day" data-id="${esc(today)}" aria-pressed="${!!cfg.rests[today]}">${esc(cfg.rests[today] ? tr("streak.today.unrest", "Today is a rest day. Undo") : tr("streak.today.rest", "Take Today as a Rest Day"))}</button></p>`;
    h += `<h3 class="fgs-h3">${esc(tr("streak.set.h", "Rest days"))}</h3>
      <div class="fgs-row"><span><b>${esc(tr("streak.set.free", "Free rest days each week"))}</b><span class="mini">${esc(tr("streak.set.free.sub", "A quiet day is covered by a free rest day, up to this many a week. {left} left this week.", {left: SBI18N.fmtN(res.restsLeft)}))}</span></span>
        <div class="segb" role="group" aria-label="${esc(tr("streak.set.free", "Free rest days each week"))}">${[0, 1, 2].map(n => `<button type="button" data-act="fgs-rpw" data-id="${n}" aria-pressed="${cfg.rpw === n}">${n}</button>`).join("")}</div></div>
      <div class="fgs-row"><span><b>${esc(tr("streak.set.wd", "Days I always rest"))}</b><span class="mini">${esc(tr("streak.set.wd.sub", "These weekdays never break the streak, and they do not use up the free rest days."))}</span></span>
        <div class="segb fgs-wds" role="group" aria-label="${esc(tr("streak.set.wd", "Days I always rest"))}">${WD.map(d => `<button type="button" data-act="fgs-wd" data-id="${d}" aria-pressed="${cfg.wd.indexOf(d) >= 0}" aria-label="${esc(wdName(d))}">${esc(fmtD(RS.add("2026-10-04", d), {weekday: "short"}))}</button>`).join("")}</div></div>`;
  }
  return h;
}
function drawStreak(){
  const b = dlg.querySelector(".fgs-body"); if (!b || !SG) return;
  const top = b.scrollTop, a = document.activeElement, had = b.contains(a), key = had && a.dataset ? [a.dataset.act, a.dataset.id] : null;
  GMEMO = {k: "", v: null};
  b.innerHTML = streakBody(); b.scrollTop = top;
  if (key && key[0]) { const again = b.querySelector(`[data-act="${key[0]}"]${key[1] != null ? `[data-id="${key[1]}"]` : ""}`) || b.querySelector('[data-act="fgs-toggle"]'); if (again) again.focus(); }
}
function openStreak(){
  if (dlg.open) dlg.close();
  SG = true;
  openSheet(`<div class="sheet fgs-sheet">${head(tr("streak.title", "Study Streak"))}<div class="sheet-body fgs-body"></div>
    <div class="sheet-foot"><button type="button" class="btn" data-act="close">${esc(tr("review.close", "Close"))}</button></div></div>`);
  drawStreak();
}
dlg.addEventListener("close", () => { SG = false; });
function turnOn(){
  lsw(FGS_CHOICE, "on");
  setStg("gentle", {on: true, intro: true, since: todayISO()});
  GMEMO = {k: "", v: null};
  try { scheduleRender(); } catch (e) {}
  toast(tr("streak.toast.on", "Gentle streak is on. Rest days never break it."));
  celebrateSoon(3000);
}
// A brand new account starts with the gentle streak, unless a choice was already made
function newUser(){
  const g = gcfg();
  if (g.on !== undefined || g.intro !== undefined || lsr(FGS_CHOICE)) return;
  setStg("gentle", {on: true, intro: true, since: todayISO()});
  GMEMO = {k: "", v: null};
}
function turnOff(){
  lsw(FGS_CHOICE, "off");
  setStg("gentle", {on: false, intro: true});
  GMEMO = {k: "", v: null};
  try { scheduleRender(); } catch (e) {}
  toast(tr("streak.toast.off", "Gentle streak is off. Your progress is kept if you turn it back on."));
}
function toggleRest(day){
  const g = gcfg(), rests = Object.assign({}, g.rests);
  if (rests[day]) delete rests[day]; else rests[day] = 1;
  setStg("gentle", {rests}); GMEMO = {k: "", v: null};
  try { scheduleRender(); } catch (e) {}
}

/* ================= Wiring ================= */
function paintBoard(){
  const v = $("#view"); if (!v || v.querySelector(".wkr-card, .fgs-strip, .fgs-intro")) return;
  const card = reviewCardHtml(), strip = streakStripHtml(!!card);
  if (!card && !strip) return;
  const qa = v.querySelector(".qa-wrap");
  if (qa) qa.insertAdjacentHTML("beforebegin", card + strip); else v.insertAdjacentHTML("afterbegin", card + strip);
}
hook("render", tab => {
  try {
    if (gentleOn()) { noteCards(); const res = streakNow(); observe(res); if (res.todayActive) celebrateSoon(); }
    if (tab === "board") paintBoard();
    if (SG && dlg.open) drawStreak();
  } catch (e) { console.warn("review and streak", e); }
});
hook("changed", () => { try { if (gentleOn()) celebrateSoon(4000); } catch (e) {} });
hook("stats-focus", () => { try { if (gentleOn()) { GMEMO = {k: "", v: null}; scheduleRender(); celebrateSoon(4000); } } catch (e) {} });
hook("menu", () => {
  const r = reviewCfg(), on = gentleOn();
  return `<div class="cap-row sb-wide" data-group="study"><span style="flex:1;font-weight:600;min-width:12rem">${esc(tr("review.set.title", "Weekly Review"))}<span class="sub">${esc(tr("review.set.sub", "A calm summary of your week. The card shows on the Board from Sunday afternoon through Monday."))}</span></span><button type="button" class="btn small" data-act="wkr-open">${esc(tr("review.set.open", "Review My Week"))}</button><label class="anim-tog"><input type="checkbox" data-act="wkr-card-toggle" ${r.off ? "" : "checked"}> ${esc(tr("review.set.card", "Show the Sunday card"))}</label></div>
    <button type="button" data-act="fgs-open" data-group="study"><span>${esc(tr("streak.set.title", "Gentle Study Streak"))}<span class="sub">${esc(on ? streakLineText(streakNow()) : tr("streak.set.off", "Off. A streak that counts study days and forgives quiet ones."))}</span></span></button>`;
});
hook("act", (a, el) => {
  if (!a || (a.slice(0, 4) !== "wkr-" && a.slice(0, 4) !== "fgs-")) return false;
  const id = el && el.dataset ? el.dataset.id : "";
  switch (a) {
    case "wkr-open": openReview(true); return true;
    case "wkr-later": lsw(SNOOZE, todayISO()); scheduleRender(); toast(tr("review.toast.later", "Okay, I will leave it for now. You can find it in Settings any time.")); return true;
    case "wkr-skip": { const p = periodNow(); if (p) setStg("review", {skip: p.weekStart}); scheduleRender(); toast(tr("review.toast.skip", "Skipped this week. It will be back next Sunday.")); return true; }
    case "wkr-card-toggle": setStg("review", {off: !el.checked}); scheduleRender(); return true;
    case "wkr-more-done": if (RV) { RV.moreDone = !RV.moreDone; drawReview(true); } return true;
    case "wkr-more-slip": if (RV) { RV.moreSlip = !RV.moreSlip; drawReview(true); } return true;
    case "wkr-move": {
      const t = state.tasks[id], to = el.dataset.to; if (!t || !RS.isDay(to)) return true;
      const label = tr("review.moved", "Moved \"{title}\" to {day}", {title: cut(t.title, 36), day: dayShort(to)});
      if (RV) RV.undo = applyChanges([moveChange(t, to)], label);
      drawReview(true); liveNote(label, true); return true;
    }
    case "wkr-moveall": {
      const st = reviewStats(RV.period), to = suggestTo(st.slipped.slice(0, slipLimit())), ch = [];
      Object.keys(to).forEach(i => { const t = state.tasks[i]; if (t) ch.push(moveChange(t, to[i])); });
      const label = trn("review.movedall", ch.length, "Gave {n} task a new day|Gave {n} tasks a new day");
      if (ch.length && RV) RV.undo = applyChanges(ch, label);
      drawReview(true); if (ch.length) liveNote(label, true); return true;
    }
    case "wkr-forecast": { const ws = id; if (dlg.open) dlg.close(); try { if (!SBCRUNCH.openWeek(ws)) SBCRUNCH.openWeek(ws, {stay: true}); } catch (e) {} return true; }
    case "wkr-prep": { if (dlg.open) dlg.close(); setTimeout(() => { try { SBPREP.open(id); } catch (e) {} }, 30); return true; }
    case "wkr-undo": { const u = RV && RV.undo; if (u) { applyChanges(u, null); RV.undo = null; drawReview(true); liveNote(tr("review.undone", "Put back the way it was.")); } return true; }
    case "wkr-ai": aiRecap(); return true;
    case "fgs-open": openStreak(); return true;
    case "fgs-on": turnOn(); return true;
    case "fgs-no": lsw(FGS_CHOICE, "no"); setStg("gentle", {intro: true}); scheduleRender(); toast(tr("streak.toast.no", "No problem. You can turn it on any time in Settings, under Study and AI.")); return true;
    case "fgs-toggle": if (el.checked) turnOn(); else turnOff(); drawStreak(); return true;
    case "fgs-rpw": setStg("gentle", {rpw: Number(id)}); GMEMO = {k: "", v: null}; scheduleRender(); drawStreak(); return true;
    case "fgs-wd": {
      const cur = RS.normCfg(gcfg()).wd, d = Number(id), next = cur.indexOf(d) >= 0 ? cur.filter(x => x !== d) : cur.concat(d);
      if (next.length > 6) return true;
      setStg("gentle", {wd: next.sort()}); GMEMO = {k: "", v: null}; scheduleRender(); drawStreak(); return true;
    }
    case "fgs-day": if (el.getAttribute("aria-disabled") === "true") return true; toggleRest(id); drawStreak(); return true;
  }
  return false;
});
hook("boot", () => { try { if (gentleOn()) celebrateSoon(6000); } catch (e) {} });

window.SBREVIEW = {open: openReview, period: periodNow, stats: () => { const p = periodNow() || RS.periodFor(todayISO(), nowHour(), true); return reviewStats(p); }, cardHtml: reviewCardHtml, RS};
// Every study day from one date to another (a task finished, focus or logged time, a checklist step, flashcards), never just opening the app
let SDMEMO = {k: "", v: []};
function studyDays(from, to){
  to = to || todayISO();
  const k = [from, to, state.updated || 0, (focusDaysNow()[to] || 0)].join("|");
  if (SDMEMO.k === k) return SDMEMO.v;
  const g = gcfg(), v = Object.keys(RS.activityDays({tasks: allTasks(), focusDays: focusDaysNow(), log: g.log, timeDays: sbtimeDays(from, to), from, to})).sort();
  SDMEMO = {k, v}; return v;
}
window.SBSTREAK = {studyDays, on: gentleOn, line: () => streakLineText(streakNow()), state: streakNow, open: openStreak, newUser, enable: turnOn, disable: turnOff, celebrate: tryCelebrate, RS};
})();

