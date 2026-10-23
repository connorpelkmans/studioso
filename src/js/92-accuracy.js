/* ===== module: 92-accuracy.js ===== */
/* Planning accuracy */
var SBACC = (() => {
/*ACC-START*/
// The accuracy model
const ACC = (() => {
  const pad = n => String(n).padStart(2, "0");
  const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const dayOf = ms => ymd(new Date(ms));
  const pd = s => { const [y, m, d] = String(s).split("-").map(Number); return new Date(y, m - 1, d); };
  const diff = (a, b) => Math.round((pd(b) - pd(a)) / 864e5);
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const r2 = x => Math.round(x * 100) / 100;
  const r05 = x => Math.round(x * 20) / 20;
  const FOCUS_RX = /^Focus session:? (\d+)m/, LOG_RX = /^Logged time:? (\d+)m/;
  const FEEL = {q: 0.7, r: 1, l: 1.5};
  const isMs = t => t === "Exam" || t === "Quiz";
  // One history line -> {at, min, kind} or null
  function entry(h){
    if (!h || typeof h.text !== "string" || !Number.isFinite(Number(h.at))) return null;
    let m = FOCUS_RX.exec(h.text); if (m) return {at: Number(h.at), min: Number(m[1]), kind: "focus"};
    m = LOG_RX.exec(h.text); if (m) return {at: Number(h.at), min: Number(m[1]), kind: "logged"};
    return null;
  }
  const entries = t => ((t && t.history) || []).map(entry).filter(Boolean);
  const bornDone = t => !!(t && t.created && t.doneAt && t.doneAt - t.created < 60000);
  // "90", "1h", "1.5h", "1h30", "1h 30m", "45m", "1:30" -> minutes (0 when it isn't a time)
  function parseDur(s){
    s = String(s == null ? "" : s).trim().toLowerCase().replace(/,/g, ".");
    if (!s) return 0;
    let m = /^(\d{1,2}):(\d{2})$/.exec(s); if (m) return Number(m[1]) * 60 + Number(m[2]);
    m = /^(\d+(?:\.\d+)?)\s*(h|hr|hrs|hour|hours)\s*(?:(\d{1,2})\s*(m|min|mins|minute|minutes)?)?$/.exec(s); if (m) return Math.round(Number(m[1]) * 60 + (m[3] ? Number(m[3]) : 0));
    m = /^(\d+(?:\.\d+)?)\s*(m|min|mins|minute|minutes)?$/.exec(s); if (m) return Math.round(Number(m[1]));
    return 0;
  }
  // ratios of real time to estimated time
  function samples(tasks, now, o){
    o = o || {}; const hl = o.halfLife || 60, out = [];
    (tasks || []).forEach(t => {
      if (!t || t.status !== "done" || t.prepFor || isMs(t.type)) return;
      const est = Number(t.hours); if (!(est > 0)) return;
      const meas = Number(t.focusMin) || 0, act = Number(t.actualMin) || 0, ck = t.checklist || [];
      let mins = 0, w = 0, src = "";
      if (act > 0 && act >= meas) { mins = act; w = 0.6; src = "said"; }
      else if (meas >= 15 && (!ck.length || ck.every(i => i.done))) { mins = meas; w = 1; src = "timer"; }
      else if (!meas && FEEL[t.feel]) { mins = est * 60 * FEEL[t.feel]; w = 0.35; src = "feel"; }
      else return;
      const r = clamp(mins / 60 / est, 0.25, 4);
      if (src === "timer" && r < 0.35) w *= 0.4;
      const when = Number(t.doneAt) || Number(t.created) || now, age = Math.max(0, (now - when) / 864e5);
      w *= Math.max(0.15, Math.pow(0.5, age / hl));
      out.push({r, w, type: t.type || "Other", c: t.courseId || "", src, at: when, mins});
    });
    return out;
  }
  const wsum = a => a.reduce((s, x) => s + x.w, 0);
  function wmed(a){
    if (!a.length) return 1;
    const s = a.slice().sort((x, y) => x.r - y.r), half = wsum(s) / 2; let c = 0;
    for (const x of s) { c += x.w; if (c >= half) return x.r; }
    return s[s.length - 1].r;
  }
  // Pull a thin group's ratio toward its parent's, in log space
  const shrink = (m, n, prior, K) => Math.exp((n * Math.log(m) + K * Math.log(prior)) / (n + K));
  const GLOBAL_LIM = [0.7, 1.8], GROUP_LIM = [0.6, 2.2];
  function global(S){
    if (S.length < 3) return {r: 1, n: S.length, level: "none"};
    return {r: r05(clamp(shrink(wmed(S), wsum(S), 1, 1.5), GLOBAL_LIM[0], GLOBAL_LIM[1])), n: S.length, level: "global"};
  }
  // The ratio for one kind of task (and one course)
  function ratio(S, type, course){
    const g = global(S), ty = S.filter(x => x.type === type);
    let r = g.r, n = g.n, level = g.level;
    if (ty.length >= 2) {
      r = shrink(wmed(ty), wsum(ty), g.r, 3); n = ty.length; level = "type";
      const ct = course ? ty.filter(x => x.c === course) : [];
      if (ct.length >= 2) { r = shrink(wmed(ct), wsum(ct), r, 3); n = ct.length; level = "course"; }
      r = r05(clamp(r, GROUP_LIM[0], GROUP_LIM[1]));
    }
    return {r, n, level, global: g.r, nGlobal: g.n};
  }
  // how much you actually finish
  function velocity(tasks, now, dh, o){
    o = o || {}; const g = Number(o.ratio) > 0 ? Number(o.ratio) : 1, none = {scale: 1, wk: [1, 1, 1, 1, 1, 1, 1], n: 0, days: 0, perDay: 0, ok: false};
    if (!(dh > 0)) return none;
    const from = now - 28 * 864e5, done = (tasks || []).filter(t => t && t.status === "done" && t.doneAt >= from && t.doneAt <= now + 864e5 && !isMs(t.type) && !t.prepFor && !bornDone(t) && Number(t.hours) > 0);
    const days = new Set(done.map(t => dayOf(t.doneAt)));
    if (done.length < 6 || days.size < 5) return Object.assign({}, none, {n: done.length, days: days.size});
    const first = Math.min(...done.map(t => t.doneAt)), span = clamp(Math.ceil((now - first) / 864e5), 1, 28);
    if (now - first < 14 * 864e5) return Object.assign({}, none, {n: done.length, days: days.size});
    const real = t => { const m = Math.max(Number(t.focusMin) || 0, Number(t.actualMin) || 0); return m >= 15 ? m / 60 : Number(t.hours) * g; };
    const total = done.reduce((s, t) => s + real(t), 0), perDay = total / span;
    const scale = r2(clamp(1 + (perDay / dh - 1) / 3, 0.8, 1.2));
    let wk = none.wk.slice();
    if (done.length >= 12 && span >= 21) {
      const hrs = [0, 0, 0, 0, 0, 0, 0], cnt = [0, 0, 0, 0, 0, 0, 0];
      done.forEach(t => { hrs[new Date(t.doneAt).getDay()] += real(t); });
      for (let i = 0; i < span; i++) cnt[new Date(now - i * 864e5).getDay()]++;
      const per = hrs.map((h, i) => cnt[i] ? h / cnt[i] : 0), mean = per.reduce((a, b) => a + b, 0) / 7;
      if (mean > 0) wk = per.map(p => r2(clamp(1 + 0.4 * (p / mean - 1), 0.85, 1.15)));
    }
    return {scale, wk, n: done.length, days: days.size, perDay: r2(perDay), ok: true};
  }
  // how close to the deadline you finish
  function lateness(tasks, now){
    const from = now - 90 * 864e5, leads = [];
    (tasks || []).forEach(t => {
      if (!t || t.status !== "done" || !t.due || !t.doneAt || t.doneAt < from || isMs(t.type) || t.prepFor || bornDone(t)) return;
      const lead = diff(dayOf(t.doneAt), t.due);
      if (lead < -7) return;
      leads.push(lead);
    });
    if (leads.length < 5) return {n: leads.length, share: 0, med: 0, nudge: 1};
    const share = leads.filter(l => l <= 0).length / leads.length, s = leads.slice().sort((a, b) => a - b);
    return {n: leads.length, share: r2(share), med: s[Math.floor(s.length / 2)], nudge: r2(1 + 0.08 * clamp((share - 0.5) / 0.4, 0, 1))};
  }
  // when you work
  function bins(tasks, ticks, now, o){
    o = o || {}; const b = new Array(24).fill(0), lim = now - 30 * 864e5; let ev = 0;
    (tasks || []).forEach(t => {
      if (!o.noHistory) entries(t).forEach(e => { if (e.kind === "focus" && e.at >= lim && e.at <= now + 36e5) b[new Date(e.at).getHours()] += e.min; });
      if (t && t.status === "done" && t.doneAt >= lim && t.doneAt <= now + 36e5 && !bornDone(t)) { b[new Date(t.doneAt).getHours()] += 25; ev++; }
    });
    (ticks || []).forEach(at => { if (at >= lim && at <= now + 36e5) { b[new Date(at).getHours()] += 8; ev++; } });
    return {bins: b, events: ev};
  }
  function peakOf(b, minTotal){
    const total = b.reduce((a, c) => a + c, 0); if (total < (minTotal || 90)) return null;
    let best = 0, bi = 0;
    for (let i = 0; i < 24; i++) { const s = b[i] + b[(i + 1) % 24] + b[(i + 2) % 24]; if (s > best) { best = s; bi = i; } }
    return {start: bi, text: `${pad(bi)}:00 to ${pad((bi + 3) % 24)}:00`, hours: [bi, (bi + 1) % 24, (bi + 2) % 24]};
  }
  // the worked-time reader (SBTIME)
  function minutesByDay(tasks, from, to){
    const out = {};
    (tasks || []).forEach(t => entries(t).forEach(e => { const d = dayOf(e.at); if (d >= from && d <= to) out[d] = (out[d] || 0) + e.min; }));
    return out;
  }
  function minutesByCourse(tasks, from, to){
    const out = {};
    (tasks || []).forEach(t => entries(t).forEach(e => { const d = dayOf(e.at); if (d >= from && d <= to) { const c = t.courseId || ""; out[c] = (out[c] || 0) + e.min; } }));
    return out;
  }
  function workedDays(tasks, from, to){
    const s = new Set();
    (tasks || []).forEach(t => {
      entries(t).forEach(e => { const d = dayOf(e.at); if (d >= from && d <= to && e.min > 0) s.add(d); });
      if (t && t.status === "done" && t.doneAt) { const d = dayOf(t.doneAt); if (d >= from && d <= to) s.add(d); }
    });
    return s;
  }
  return {entry, entries, parseDur, samples, wmed, shrink, global, ratio, velocity, lateness, bins, peakOf, minutesByDay, minutesByCourse, workedDays, FEEL, clamp, dayOf};
})();
/*ACC-END*/

/* Settings and cached numbers */
const cfg = () => Object.assign({adjust: true}, (state.settings && state.settings.accuracy) || {});
const on = () => cfg().adjust !== false;
const LS_ASK = "studyboard:acc:ask", LS_TICKS = "studyboard:acc:ticks", LS_PEND = "studyboard:acc:pend";
const lsGet = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k) || "null"); return v == null ? d : v; } catch (e) { return d; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } };
let MEMO = {k: "", S: [], vel: null, late: null, ratios: {}};
function memo(){
  const k = [state.updated || 0, todayISO(), on() ? 1 : 0, dailyHours()].join("|");
  if (MEMO.k !== k) {
    const now = Date.now(), tasks = allTasks(), S = on() ? ACC.samples(tasks, now) : [], g = ACC.global(S);
    MEMO = {k, S, g, ratios: {}, vel: on() ? ACC.velocity(tasks, now, dailyHours(), {ratio: g.r}) : null, late: on() ? ACC.lateness(tasks, now) : null};
  }
  return MEMO;
}
function ratioInfo(t){
  const M = memo(); if (!on() || !t) return {r: 1, n: 0, level: "none", global: 1, nGlobal: 0};
  const key = (t.type || "") + "|" + (t.courseId || "");
  return M.ratios[key] || (M.ratios[key] = ACC.ratio(M.S, t.type || "Other", t.courseId || ""));
}
const ratioFor = t => ratioInfo(t).r;
const capScale = () => { const v = memo().vel; return on() && v && v.ok ? v.scale : 1; };
const wkScale = d => { const v = memo().vel; return on() && v && v.ok ? (v.wk[parse(d).getDay()] || 1) : 1; };
const startNudge = t => { const L = memo().late; return on() && L && L.nudge > 1 && t && !MILESTONE(t.type) ? L.nudge : 1; };
// "labs", "assignments", "BIO210 labs"
const TYPE_WORD = {Assignment: "assignments", Exam: "exams", Quiz: "quizzes", Reading: "readings", Project: "projects", Lab: "labs", Study: "study sessions", Other: "tasks"};
function whatOf(t, info){
  const w = TYPE_WORD[t.type] || "tasks", c = info.level === "course" ? courseOf(t.courseId) : null;
  if (info.level === "none" || info.level === "global") return tr("acc.whatAll", "your tasks");
  return c ? tr("acc.whatCourse", "{course} {kind}", {course: courseLabel(c), kind: w}) : w;
}
// "You usually take about 1.4x your estimate on lab reports."
function explain(t){
  const i = ratioInfo(t);
  if (!on() || i.n < 3 || Math.abs(i.r - 1) < 0.15) return "";
  return i.r > 1
    ? tr("acc.over", "You usually take about {x}x your estimate on {what}.", {x: i.r.toFixed(1), what: whatOf(t, i)})
    : tr("acc.under", "You usually finish {what} in about {x}x your estimate.", {x: i.r.toFixed(1), what: whatOf(t, i)});
}

/* SBTIME: read-only tracked time */
const SBTIME = (() => {
  const T = () => allTasks();
  return {
    minutesByDay: (a, b) => ACC.minutesByDay(T(), a, b),
    minutesByCourse: (a, b) => ACC.minutesByCourse(T(), a, b),
    workedDays: (a, b) => ACC.workedDays(T(), a, b),
    ratioFor: t => ratioFor(t),
    ratioInfo: t => Object.assign({}, ratioInfo(t)),
    parse: h => ACC.entry(h)
  };
})();

/* Logging time */
function logTime(id, min, kind, label, at){
  const t = state.tasks[id]; min = Math.round(Number(min));
  if (!t || !(min > 0)) return false;
  const n = clone(t);
  n.focusMin = (Number(n.focusMin) || 0) + min;
  n.history = (n.history || []).concat({at: at || Date.now(), text: kind === "focus" ? `Focus session: ${min}m` : `Logged time: ${min}m`}).slice(-30);
  applyChanges([{kind: "task", id, after: n}], label || tr("acc.loggedToast", "Logged {t} on {title}", {t: fmtMins(min), title: t.title.length > 28 ? t.title.slice(0, 27) + "…" : t.title}));
  LEARN = null;
  return true;
}
const MIN_EARLY = 1;
// Called when a focus session is stopped
function early(min, taskId, why){
  min = Math.min(Math.round(Number(min) || 0), 180);
  if (min < MIN_EARLY) return false;
  try { SBSTATS.addFocus(min, "timer"); } catch (e) { }
  try { pomoToday(); pomo.minutes += min; pomoSave(); } catch (e) { }
  if (taskId && state.tasks[taskId] && state.tasks[taskId].status !== "done") return logTime(taskId, min, "focus", tr("acc.earlyToast", "Logged {t} of focus on {title}", {t: fmtMins(min), title: state.tasks[taskId].title.slice(0, 28)}));
  pending({min, at: Date.now(), why: why || "stop"});
  return false;
}

/* The small chip at the bottom */
let chip = null, chipT = 0;
function chipEl(){
  let el = document.getElementById("accChip");
  if (!el) {
    el = document.createElement("div"); el.id = "accChip"; el.className = "acc-chip"; el.hidden = true;
    el.setAttribute("role", "status"); el.setAttribute("aria-live", "polite");
    document.body.appendChild(el);
  }
  return el;
}
function chipHide(){ clearTimeout(chipT); chip = null; const el = document.getElementById("accChip"); if (el) { el.hidden = true; el.innerHTML = ""; } }
const X_ICON = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
const short = (s, n) => { s = String(s || ""); return s.length > n ? s.slice(0, n - 1) + "…" : s; };
function chipShow(c, timeoutMs){
  chip = c; const el = chipEl(); el.hidden = false;
  el.innerHTML = chipHtml(c);
  clearTimeout(chipT);
  if (timeoutMs) chipT = setTimeout(() => { if (el.contains(document.activeElement)) { chipT = setTimeout(() => chipDismiss(), timeoutMs); return; } chipDismiss(); }, timeoutMs);
}
function chipHtml(c){
  if (c.kind === "which") {
    const opts = c.opts.map(t => `<button type="button" class="acc-opt" data-act="acc-which" data-id="${esc(t.id)}">${esc(short(t.title, 26))}</button>`).join("");
    return `<span class="acc-q">${esc(tr("acc.which", "Which task was that for?"))} <span class="mini">${esc(fmtMins(c.min))}</span></span><span class="acc-opts">${opts}</span><button type="button" class="acc-x" data-act="acc-dismiss" aria-label="${esc(tr("acc.dismiss", "Dismiss"))}">${X_ICON}</button>`;
  }
  const t = state.tasks[c.id], title = short(t ? t.title : "", 30);
  if (c.exact) return `<span class="acc-q">${esc(tr("acc.exactQ", "How long did “{title}” take?", {title}))}</span><span class="acc-opts"><label class="acc-own"><span class="sr">${esc(tr("acc.exactLbl", "Time spent, like 45m or 1h 30m"))}</span><input type="text" id="accExact" inputmode="text" autocomplete="off" maxlength="12" placeholder="${esc(tr("acc.exactPh", "e.g. 1h 30m"))}" data-noenter></label><button type="button" class="acc-opt primary" data-act="acc-exact-save">${esc(tr("acc.save", "Save"))}</button><button type="button" class="acc-opt" data-act="acc-feel-back">${esc(tr("acc.back", "Back"))}</button></span><button type="button" class="acc-x" data-act="acc-dismiss" aria-label="${esc(tr("acc.dismiss", "Dismiss"))}">${X_ICON}</button>`;
  return `<span class="acc-q">${esc(tr("acc.tookQ", "How long did “{title}” take?", {title}))}</span><span class="acc-opts"><button type="button" class="acc-opt" data-act="acc-feel" data-v="q">${esc(tr("acc.quicker", "Quicker than I thought"))}</button><button type="button" class="acc-opt" data-act="acc-feel" data-v="r">${esc(tr("acc.right", "About right"))}</button><button type="button" class="acc-opt" data-act="acc-feel" data-v="l">${esc(tr("acc.longer", "Longer"))}</button><button type="button" class="acc-opt link" data-act="acc-exact">${esc(tr("acc.exact", "Exact Time"))}</button></span><button type="button" class="acc-x" data-act="acc-dismiss" aria-label="${esc(tr("acc.dismiss", "Dismiss"))}">${X_ICON}</button>`;
}
function askState(){ return Object.assign({askedLast: false, streak: 0, skip: 0}, lsGet(LS_ASK, {})); }
function chipDismiss(){
  if (chip && chip.kind === "took") { const a = askState(); a.streak++; a.skip = a.streak >= 4 ? 6 : a.streak >= 2 ? 2 : 0; lsSet(LS_ASK, a); }
  if (chip && chip.kind === "which") lsSet(LS_PEND, null);
  chipHide();
}
// A focus session with no task
function pending(p){
  lsSet(LS_PEND, p); showPending();
}
function showPending(){
  const p = lsGet(LS_PEND, null);
  if (!p || Date.now() - p.at > 30 * 60000) { if (p) lsSet(LS_PEND, null); return; }
  let list = []; try { list = (FOCUS ? FOCUS.ranked.map(x => x.t) : []).filter(t => canDoNow(t)); } catch (e) { list = []; }
  if (list.length < 3) list = list.concat(tasksArr().filter(t => t.status !== "done" && canDoNow(t)).sort(sortTasks)).filter((t, i, a) => a.indexOf(t) === i);
  const opts = list.filter(t => t.status !== "done").slice(0, 3);
  if (!opts.length) { lsSet(LS_PEND, null); return; }
  chipShow({kind: "which", min: p.min, at: p.at, opts}, 0);
}
// A task was just finished with no tracked time
function maybeAskTook(t, batch){
  if (!on() || batch > 1 || !t || MILESTONE(t.type) || t.prepFor || !(Number(t.hours) > 0)) return;
  if ((Number(t.focusMin) || 0) >= MIN_EARLY || Number(t.actualMin) > 0 || t.feel) return;
  if (t.created && t.doneAt && t.doneAt - t.created < 60000) return;
  const a = askState();
  if (a.askedLast) { a.askedLast = false; lsSet(LS_ASK, a); return; }
  if (a.skip > 0) { a.skip--; lsSet(LS_ASK, a); return; }
  if (chip && chip.kind === "which") return;
  a.askedLast = true; lsSet(LS_ASK, a);
  chipShow({kind: "took", id: t.id}, 30000);
}
function answerTook(patch, msg){
  const c = chip, t = c && state.tasks[c.id]; if (!t) { chipHide(); return; }
  const a = askState(); a.streak = 0; a.skip = 0; lsSet(LS_ASK, a);
  chipHide();
  applyChanges([{kind: "task", id: t.id, after: Object.assign(clone(t), patch)}], msg || tr("acc.noted", "Thanks, noted"));
  LEARN = null;
}

/* Passive signals */
const tickSeen = {};
function tickScan(changes){
  (changes || []).forEach(c => {
    if (c.kind !== "task" || !c.after) return;
    const n = (c.after.checklist || []).filter(i => i.done).length, was = tickSeen[c.id];
    tickSeen[c.id] = n;
    if (was != null && n > was && c.after.status !== "done") { const a = lsGet(LS_TICKS, []).filter(x => Date.now() - x < 30 * 864e5); a.push(Date.now()); lsSet(LS_TICKS, a.slice(-300)); }
  });
}
function peak(now){
  const b = ACC.bins(allTasks(), lsGet(LS_TICKS, []), now || Date.now());
  return ACC.peakOf(b.bins, 90);
}
// Extra hours-of-day evidence for peakStudyHours() when you don't use the timer
function extraBins(now){
  const b = ACC.bins(allTasks(), lsGet(LS_TICKS, []), now || Date.now(), {noHistory: true});
  return b.events >= 6 ? b.bins : null;
}
// Do This Next: tasks you habitually under-estimate get a little more weight, and a reason
function underBoost(t){
  const i = ratioInfo(t);
  return on() && i.n >= 3 && i.r >= 1.25 ? Math.min(1.08, 1 + (i.r - 1) * 0.1) : 1;
}

/* Pomodoro early stop, abandoned sessions */
function staleScan(){
  try {
    if (pomo.mode === "focus" && !pomo.running && pomo.left > 0 && pomo.pausedAt && Date.now() - pomo.pausedAt > 2 * 3600000) {
      const done = Math.max(0, (modeMs("focus") - pomo.left) / 60000), tid = pomo.taskId;
      pomo.left = 0; pomo.preset = 0; pomo.pausedAt = 0; pomoSave(); pomoUI(true);
      early(done, tid, "abandoned");
    }
  } catch (e) { }
}

/* Log time on a task */
const logHtml = t => `<div class="acc-log" id="accLog" data-id="${esc(t.id)}"><span class="lbl">${esc(tr("acc.logTime", "Log time"))}</span>
  <span class="acc-log-btns" role="group" aria-label="${esc(tr("acc.logAria", "Add time you spent on this task"))}"><button type="button" class="btn small" data-act="acc-log" data-id="${esc(t.id)}" data-min="15">+15m</button><button type="button" class="btn small" data-act="acc-log" data-id="${esc(t.id)}" data-min="30">+30m</button><button type="button" class="btn small" data-act="acc-log" data-id="${esc(t.id)}" data-min="60">+1h</button><button type="button" class="btn small" data-act="acc-log-custom" data-id="${esc(t.id)}">${esc(tr("acc.custom", "Custom"))}</button></span>
  <span class="mini acc-log-tot" aria-live="polite">${logTotal(t)}</span></div>`;
function logTotal(t){
  const m = Number(t.focusMin) || 0;
  return m ? esc(tr("acc.logTotal", "{t} tracked so far", {t: fmtMins(m)})) : esc(tr("acc.logNone", "Nothing tracked yet"));
}
function refreshLog(id){
  const box = document.getElementById("accLog"); if (!box || box.dataset.id !== id || !state.tasks[id]) return;
  const tot = box.querySelector(".acc-log-tot"); if (tot) tot.innerHTML = logTotal(state.tasks[id]);
}
function customLog(el){
  const box = el.closest(".acc-log"); if (!box) return;
  const id = el.dataset.id;
  box.innerHTML = `<label class="lbl" for="accLogIn">${esc(tr("acc.logCustomLbl", "Time to add (like 45m or 1h 30m)"))}</label><span class="acc-log-btns"><input type="text" id="accLogIn" maxlength="12" autocomplete="off" inputmode="text" data-noenter placeholder="${esc(tr("acc.exactPh", "e.g. 1h 30m"))}"><button type="button" class="btn small primary" data-act="acc-log-add" data-id="${esc(id)}">${esc(tr("acc.add", "Add"))}</button></span><span class="mini acc-log-tot" aria-live="polite"></span>`;
  const i = box.querySelector("input"); i.focus();
}

/* Words for Today's Plan */
function howHtml(){
  if (!on()) return `<p>${esc(tr("acc.howOff", "Learning from your own pace is turned off in Settings, so the plan uses your estimates exactly as you typed them."))}</p>`;
  return `<p>${esc(tr("acc.how", "Studyboard also learns your pace. After you finish a few tasks, it adjusts for how long your work really takes (by task type, and by course once there's enough history), matches each day's plan to what you actually get done, and starts tasks sooner if you tend to finish close to the deadline. You can turn this off in Settings."))}</p>`;
}

/* Wiring */
hook("act", (a, el) => {
  if (!a || a.slice(0, 4) !== "acc-") return false;
  if (a === "acc-dismiss") { chipDismiss(); return true; }
  if (a === "acc-which") {
    const p = lsGet(LS_PEND, null), id = el.dataset.id; lsSet(LS_PEND, null); chipHide();
    if (p && id) logTime(id, p.min, "focus", tr("acc.whichToast", "Added {t} to {title}", {t: fmtMins(p.min), title: short((state.tasks[id] || {}).title, 28)}), p.at);
    return true;
  }
  if (a === "acc-feel") { answerTook({feel: el.dataset.v}); return true; }
  if (a === "acc-exact") { if (chip) { chip.exact = true; chipShow(chip, 0); const i = document.getElementById("accExact"); if (i) i.focus(); } return true; }
  if (a === "acc-feel-back") { if (chip) { chip.exact = false; chipShow(chip, 30000); } return true; }
  if (a === "acc-exact-save") {
    const i = document.getElementById("accExact"), m = ACC.parseDur(i && i.value);
    if (!(m > 0 && m <= 1440)) { if (i) { i.setAttribute("aria-invalid", "true"); i.focus(); } toast(tr("acc.badTime", "Try a time like 45m or 1h 30m")); return true; }
    answerTook({actualMin: m}); return true;
  }
  if (a === "acc-log") { if (logTime(el.dataset.id, Number(el.dataset.min))) refreshLog(el.dataset.id); return true; }
  if (a === "acc-log-custom") { customLog(el); return true; }
  if (a === "acc-log-add") {
    const i = document.getElementById("accLogIn"), m = ACC.parseDur(i && i.value);
    if (!(m > 0 && m <= 1440)) { if (i) { i.setAttribute("aria-invalid", "true"); i.focus(); } toast(tr("acc.badTime", "Try a time like 45m or 1h 30m")); return true; }
    const id = el.dataset.id;
    if (logTime(id, m)) { const box = el.closest(".acc-log"); if (box) { const t = state.tasks[id]; const h = document.createElement("div"); h.innerHTML = logHtml(t); box.replaceWith(h.firstElementChild); } }
    return true;
  }
  if (a === "acc-toggle") {
    state.settings = Object.assign({}, state.settings, {accuracy: Object.assign({}, state.settings.accuracy || {}, {adjust: !!el.checked})});
    saveSettings(); LEARN = null; MEMO.k = ""; scheduleRender();
    toast(el.checked ? tr("acc.onToast", "Plans will allow for your own pace") : tr("acc.offToast", "Plans will use your estimates as typed"));
    return true;
  }
  return false;
});
document.addEventListener("keydown", e => {
  if (e.key !== "Enter" || !e.target || !e.target.id) return;
  if (e.target.id === "accExact") { e.preventDefault(); const b = document.querySelector('[data-act="acc-exact-save"]'); if (b) b.click(); }
  else if (e.target.id === "accLogIn") { e.preventDefault(); const b = document.querySelector('[data-act="acc-log-add"]'); if (b) b.click(); }
}, true);
hook("changed", changes => {
  if (!Array.isArray(changes)) return;
  tickScan(changes);
  const fresh = changes.filter(c => c.kind === "task" && c.after && c.after.status === "done" && c.after.doneAt && Date.now() - c.after.doneAt < 4000);
  changes.forEach(c => { if (chip && chip.kind === "took" && c.kind === "task" && c.id === chip.id && c.after && c.after.status !== "done") chipHide(); });
  if (fresh.length) maybeAskTook(fresh[0].after, fresh.length);
});
hook("menu", () => {
  const v = memo(), n = v.S.length;
  const sub = on() ? (n >= 3 ? tr("acc.setOnData", "On. Learned from {n} finished tasks.", {n}) : tr("acc.setOn", "On. It starts once you have finished a few tasks with a time estimate.")) : tr("acc.setOff", "Off. Plans use your estimates exactly as typed.");
  return `<div class="cap-row" data-group="study"><span style="flex:1;font-weight:600">${esc(tr("acc.setTitle", "Learn My Pace"))}<span class="sub">${esc(tr("acc.setSub", "Adjust plans to how long your work really takes, using time you track and how you finish tasks. Stays on this device and in your own tasks."))} ${esc(sub)}</span></span><label class="anim-tog"><input type="checkbox" data-act="acc-toggle" ${on() ? "checked" : ""}> ${esc(tr("acc.on", "On"))}</label></div>`;
});
// The task sheet's hint under Hours Needed
function formHint(){
  const el = document.getElementById("accHint"), f = el && el.closest("form"); if (!el || !f) return;
  const g = n => { const x = f.querySelector(`[name="${n}"]`); return x ? x.value : ""; };
  const h = Number(g("hours")), t = {type: g("type") || "Other", courseId: g("courseId") || ""}, i = ratioInfo(t), s = explain(t);
  const say = !s || !(h > 0) || MILESTONE(t.type) ? "" : `${s} ${tr("acc.hintPlan", "Today's Plan counts this as about {h}.", {h: fmtHM(h * i.r)})}`;
  el.hidden = !say;
  if (el.textContent !== say) el.textContent = say;
}
{
  const d = document.getElementById("dlg");
  if (d) new MutationObserver(() => formHint()).observe(d, {childList: true, subtree: true});
  ["input", "change"].forEach(ev => document.addEventListener(ev, e => { if (e.target && e.target.closest && e.target.closest("form") && document.getElementById("accHint")) formHint(); }, true));
}
hook("boot", () => {
  allTasks().forEach(t => { tickSeen[t.id] = (t.checklist || []).filter(i => i.done).length; });
  staleScan(); showPending();
  setInterval(staleScan, 10 * 60000);
});
// A focus session with no task
hook("focus", e => {
  if (e && e.type === "end" && e.mode === "focus" && !e.taskId && e.minutes && !e.missed) pending({min: e.minutes, at: Date.now(), why: "end"});
});
const api = {ACC, time: SBTIME, ratioInfo, ratioFor, memo, capScale, wkScale, startNudge, peak, extraBins, underBoost, explain, logTime, early, askState, maybeAskTook, chip: () => chip, on, howHtml, logHtml, formHint, sig: () => (on() ? 1 : 0) + "|" + capScale(), global: () => memo().g};
window.__sbAcc = Object.assign({state: () => state}, api);
return api;
})();
var SBTIME = SBACC.time;
window.SBACC = SBACC; window.SBTIME = SBTIME;

