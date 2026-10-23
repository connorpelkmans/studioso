/* ===== module: 97-crunch.js ===== */
/* Crunch Forecast (Calendar, third view) */
(() => {
/*CRUNCH-START*/
// The Crunch Forecast model
const CRUNCH = (() => {
  const LEVELS = ["calm", "steady", "busy", "heavy", "crunch"];
  const CUTS = [0.4, 1.1, 1.3, 2.0];
  const levelOf = r => r >= CUTS[3] ? 4 : r >= CUTS[2] ? 3 : r >= CUTS[1] ? 2 : r >= CUTS[0] ? 1 : 0;
  const pad = n => String(n).padStart(2, "0");
  const pd = s => { const [y, m, d] = String(s).split("-").map(Number); return new Date(y, m - 1, d); };
  const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const add = (s, n) => { const d = pd(s); d.setDate(d.getDate() + n); return ymd(d); };
  const diff = (a, b) => Math.round((pd(b) - pd(a)) / 864e5);
  const monday = s => add(s, -((pd(s).getDay() + 6) % 7));
  const isDay = s => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
  const num = v => v !== null && v !== "" && v !== undefined && Number.isFinite(Number(v));
  const r2 = x => Math.round(x * 100) / 100;

  // Task classes: how heavy a deadline is
  const PROF = {
    exam:       {one: "exam", many: "exams", stress: 1.5, hours: 8, lead: 5, decay: 0.78, dueFrac: 0.1, w: 20, major: 1},
    quiz:       {one: "quiz", many: "quizzes", stress: 0.75, hours: 2, lead: 3, decay: 0.7, dueFrac: 0.2, w: 3, major: 0.5},
    project:    {one: "project", many: "projects", stress: 1, hours: 10, lead: 9, decay: 0.9, dueFrac: 0.5, w: 15, major: 1},
    paper:      {one: "paper", many: "papers", stress: 1, hours: 8, lead: 7, decay: 0.88, dueFrac: 0.5, w: 12, major: 1},
    lab:        {one: "lab", many: "labs", stress: 0.5, hours: 4, lead: 3, decay: 0.75, dueFrac: 0.5, w: 5, major: 0},
    assignment: {one: "assignment", many: "assignments", stress: 0.5, hours: 3, lead: 3, decay: 0.75, dueFrac: 0.5, w: 5, major: 0},
    reading:    {one: "reading", many: "readings", stress: 0.15, hours: 1.5, lead: 1, decay: 0.7, dueFrac: 0.6, w: 1, major: 0},
    study:      {one: "study session", many: "study sessions", stress: 0, hours: 1, lead: 0, decay: 1, dueFrac: 1, w: 2, major: 0},
    other:      {one: "task", many: "other tasks", stress: 0.25, hours: 1.5, lead: 2, decay: 0.75, dueFrac: 0.6, w: 2, major: 0}
  };
  const PAPER_RX = /\b(paper|essay|report|thesis|dissertation|term paper|case study|capstone)\b/i;
  const BIGPROJ_RX = /\b(presentation|portfolio|capstone|group project)\b/i;
  const EXAM_RX = /\b(midterm|final exam)\b/i;
  function classOf(t){
    const ty = t && t.type, title = String((t && t.title) || "");
    if (ty === "Exam") return "exam";
    if (ty === "Quiz") return "quiz";
    if (ty === "Study" || (t && (t.prep || t.bd))) return "study";
    if (ty === "Reading") return "reading";
    if (EXAM_RX.test(title)) return "exam";
    if (ty === "Project" || BIGPROJ_RX.test(title)) return "project";
    if (PAPER_RX.test(title)) return "paper";
    if (ty === "Lab") return "lab";
    if (ty === "Assignment") return "assignment";
    return "other";
  }
  const isMajor = c => (PROF[c] || PROF.other).major;
  const plural = (c, n) => `${n} ${n === 1 ? (PROF[c] || PROF.other).one : (PROF[c] || PROF.other).many}`;
  const ORDER = ["exam", "quiz", "paper", "project", "lab", "assignment", "reading", "other", "study"];
  // "3 exams + 1 paper"
  function describe(counts){
    return ORDER.filter(c => counts[c]).map(c => plural(c, counts[c])).join(" + ");
  }
  const weightFactor = (t, c) => { const w = num(t.weight) && Number(t.weight) > 0 ? Number(t.weight) : (PROF[c] || PROF.other).w; return Math.max(0.8, Math.min(1.6, 0.8 + w / 50)); };

  // Remaining hours
  function remOf(t, c){
    if (num(t.rem) && Number(t.rem) >= 0) return Number(t.rem);
    const p = num(t.pct) ? Math.max(0, Math.min(100, Number(t.pct))) : 0;
    return (PROF[c] || PROF.other).hours * (1 - p / 100);
  }
  const busyFactor = h => Math.max(0.3, Math.min(1, 1 - Math.max(0, h - 3) / 8));

  // Which open tasks count, and where each one's hours land
  function place(t, today, lastDay){
    const c = classOf(t), P = PROF[c] || PROF.other, wf = weightFactor(t, c);
    const R = remOf(t, c) * Math.sqrt(wf), S = P.stress * wf * (t.status === "doing" ? 0.85 : 1);
    const out = [];
    const due = t.due;
    if (diff(today, due) <= 0) {
      const over = diff(today, due) < 0;
      out.push({date: today, hours: R, stress: over ? S * 0.5 : S, kind: over ? "overdue" : "due"});
      return {c, out, R};
    }
    const start = isDay(t.start) && t.start > today && t.start < due ? t.start : "";
    const L = P.lead;
    let first = add(due, -L), decay = P.decay;
    if (start) {
      const planned = diff(start, due);
      first = planned > L ? start : (start > first ? start : first);
      if (planned > L) decay = Math.max(decay, 0.95);
      if (diff(first, due) > 28) first = add(due, -28);
    }
    if (first < today) first = today;
    const days = [];
    for (let d = first; d < due; d = add(d, 1)) days.push(d);
    const dueW = P.lead ? P.dueFrac : 1;
    let tot = dueW;
    const ws = days.map(d => { const w = Math.pow(decay, diff(d, due) - 1); tot += w; return w; });
    days.forEach((d, i) => { if (d <= lastDay) out.push({date: d, hours: R * ws[i] / tot, stress: 0, kind: "prep"}); });
    if (due <= lastDay) out.push({date: due, hours: R * dueW / tot, stress: S, kind: "due"});
    return {c, out, R};
  }

  // input: {today, tasks, busy: {date: hours}, dailyHours, maxWeeks (20), minWeeks
  function build(input){
    const today = input.today, maxWeeks = input.maxWeeks || 20, minWeeks = input.minWeeks || 6;
    const dh = num(input.dailyHours) ? Math.max(0.5, Number(input.dailyHours)) : 3, busy = input.busy || {};
    const cs = num(input.capScale) ? Math.max(0.75, Math.min(1.25, Number(input.capScale))) : 1;
    const wks = Array.isArray(input.wkScale) && input.wkScale.length === 7 ? input.wkScale.map(v => num(v) ? Math.max(0.8, Math.min(1.2, Number(v))) : 1) : null;
    const open = (input.tasks || []).filter(t => t && t.status !== "done" && isDay(t.due) && !t.dead);
    const g0 = monday(today), limit = add(g0, maxWeeks * 7 - 1);
    const counted = open.filter(t => diff(limit, t.due) <= 14);
    let lastDue = today; counted.forEach(t => { if (t.due > lastDue) lastDue = t.due; });
    const res = {today, start: g0, end: g0, days: [], weeks: [], empty: !open.length, tasks: open.length, noEstimate: 0, dailyHours: dh, capScale: cs, levels: LEVELS};
    open.forEach(t => { if (t.est === false && !(classOf(t) === "study")) res.noEstimate++; });
    if (!counted.length) { res.empty = !open.length; return res; }
    let gridEnd = add(monday(lastDue > limit ? limit : lastDue), 6);
    const minEnd = add(g0, minWeeks * 7 - 1);
    if (gridEnd < minEnd) gridEnd = minEnd;
    if (gridEnd > limit) gridEnd = limit;
    res.end = gridEnd;
    const byDay = {};
    for (let d = g0; d <= gridEnd; d = add(d, 1)) {
      byDay[d] = {date: d, past: d < today, today: d === today, demand: 0, busy: Math.max(0, Number(busy[d]) || 0), items: {}, due: [], counts: {}};
      res.days.push(byDay[d]);
    }
    const lastDay = gridEnd;
    counted.forEach(t => {
      const pl = place(t, today, lastDay), c = pl.c;
      pl.out.forEach(o => {
        const D = byDay[o.date]; if (!D) return;
        const tot = o.hours + o.stress;
        D.demand += tot;
        const it = D.items[t.id] || (D.items[t.id] = {id: t.id, title: t.title || "Untitled", cls: c, kind: o.kind, hours: 0, stress: 0, total: 0, due: t.due, synced: !!t.synced, est: t.est !== false, status: t.status});
        it.hours += o.hours; it.stress += o.stress; it.total += tot;
        if (o.kind === "due" || o.kind === "overdue") { it.kind = o.kind; D.due.push({id: t.id, title: t.title || "Untitled", cls: c, overdue: o.kind === "overdue"}); D.counts[c] = (D.counts[c] || 0) + 1; }
      });
    });
    res.days.forEach(D => {
      D.cap0 = r2(dh * cs * (wks ? wks[pd(D.date).getDay()] : 1));
      D.capacity = Math.max(0.5, D.cap0 * busyFactor(D.busy));
      D.demand = r2(D.demand);
      D.ratio = D.past ? 0 : r2(D.demand / D.capacity);
      D.levelIdx = D.past ? 0 : levelOf(D.ratio);
      D.level = LEVELS[D.levelIdx];
      D.top = Object.values(D.items).sort((a, b) => b.total - a.total).slice(0, 5).map(x => ({id: x.id, title: x.title, cls: x.cls, kind: x.kind, hours: r2(x.hours), stress: r2(x.stress), total: r2(x.total), due: x.due, synced: x.synced, est: x.est}));
      D.reasons = describe(D.counts);
    });
    for (let w = g0; w <= gridEnd; w = add(w, 7)) {
      const days = res.days.filter(D => D.date >= w && D.date <= add(w, 6)), live = days.filter(D => !D.past);
      const W = {start: w, end: add(w, 6), days: days.map(D => D.date), counts: {}, items: {}, past: !live.length};
      let dem = 0, cap = 0, peak = 0, peakDay = "";
      live.forEach(D => {
        dem += D.demand; cap += D.capacity;
        if (D.ratio > peak) { peak = D.ratio; peakDay = D.date; }
        Object.keys(D.counts).forEach(c => { W.counts[c] = (W.counts[c] || 0) + D.counts[c]; });
        Object.values(D.items).forEach(x => { const it = W.items[x.id] || (W.items[x.id] = Object.assign({}, x, {total: 0, hours: 0, stress: 0})); it.total += x.total; it.hours += x.hours; it.stress += x.stress; if (x.kind !== "prep") it.kind = x.kind; });
      });
      const mean = cap ? dem / cap : 0;
      W.demand = r2(dem); W.capacity = r2(cap); W.peak = r2(peak); W.peakDay = peakDay;
      W.score = r2(live.length ? 0.5 * peak + 0.5 * mean : 0);
      let lv = levelOf(W.score);
      W.major = Object.keys(W.counts).reduce((s, c) => s + isMajor(c) * W.counts[c], 0);
      if (W.major >= 4) lv = Math.max(lv, 4); else if (W.major >= 3) lv = Math.max(lv, 3);
      W.levelIdx = W.past ? 0 : lv; W.level = LEVELS[W.levelIdx];
      W.top = Object.values(W.items).sort((a, b) => b.total - a.total).slice(0, 6).map(x => ({id: x.id, title: x.title, cls: x.cls, kind: x.kind, hours: r2(x.hours), stress: r2(x.stress), total: r2(x.total), due: x.due, synced: x.synced, est: x.est}));
      W.prepCounts = {};
      Object.values(W.items).forEach(x => { if (x.kind === "prep" && isMajor(x.cls) && x.hours >= 0.5) W.prepCounts[x.cls] = (W.prepCounts[x.cls] || 0) + 1; });
      delete W.items;
      const due = describe(W.counts), prep = describe(W.prepCounts);
      W.reasons = (due || prep ? [due, prep ? `prep for ${prep}` : ""].filter(Boolean).join("; ") : "") || (W.top.length ? `Prep for ${W.top[0].title}` : "");
      const big = {}; Object.keys(W.counts).forEach(c => { if (isMajor(c)) big[c] = W.counts[c]; });
      const prepP = phrase(W.prepCounts), dueP = Object.keys(big).length ? phrase(big) : prepP ? "" : phrase(W.counts);
      W.headline = dueP && prepP ? `${dueP} due, plus prep for ${prepP}` : dueP || (prepP ? `prep for ${prepP}` : "");
      res.weeks.push(W);
    }
    return res;
  }

  // Whole weeks from this week to that one
  const weeksAway = (today, weekStart) => Math.max(0, Math.round(diff(monday(today), weekStart) / 7));
  function heaviest(model, minIdx){
    let best = null;
    (model.weeks || []).forEach(w => { if (!w.past && w.levelIdx >= (minIdx || 0) && (!best || w.score > best.score + 1e-9)) best = w; });
    return best;
  }
  // First week at "heavy" or worse that starts within maxDays (weeks already under way count)
  function nextCrunch(model, today, opts){
    const o = opts || {};
    return (model.weeks || []).find(w => !w.past && w.levelIdx >= (o.min == null ? 3 : o.min) && diff(today, w.start) <= (o.maxDays || 42) && diff(today, w.start) >= (o.minDays == null ? -6 : o.minDays)) || null;
  }

  // Pulling work forward
  const movable = (t, week, today) => {
    const c = classOf(t);
    if (!t || t.status === "done" || t.dead || !isDay(t.due) || c === "exam" || c === "quiz" || c === "study" || t.prep || t.blocked) return false;
    if (remOf(t, c) < 0.75) return false;
    return t.due >= week.start && t.due <= add(week.end, 7) && diff(today, t.due) >= 1;
  };
  // The date a task's work effectively begins, used to describe a move
  function effStart(t, today){
    const c = classOf(t), P = PROF[c] || PROF.other;
    const f = isDay(t.start) && t.start > today && t.start < t.due ? t.start : add(t.due, -P.lead);
    return f < today ? today : f;
  }
  function withMove(tasks, m){
    return tasks.map(t => {
      if (t.id !== m.id) return t;
      const n = Object.assign({}, t);
      if (m.mode === "start") n.start = m.to; else { n.due = m.to; if (n.start && n.start > n.due) n.start = n.due; }
      return n;
    });
  }
  function applyMoves(tasks, moves){ return (moves || []).reduce((ts, m) => withMove(ts, m), tasks); }
  const weekOf = (model, ws) => (model.weeks || []).find(w => w.start === ws);
  const SHIFTS = [1, 2, 3, 4, 5, 6, 7, 9, 11, 14, 18, 21];
  // Best single move for one task
  function bestMove(input, base, week, t, minGain){
    const today = input.today, c = classOf(t), cands = [];
    if (t.synced) {
      const s0 = effStart(t, today);
      SHIFTS.forEach(s => { const to = add(s0, -s); if (to > today && to < s0) cands.push({id: t.id, mode: "start", from: s0, to}); });
    } else {
      SHIFTS.forEach(s => { const to = add(t.due, -s); if (diff(today, to) >= 1) cands.push({id: t.id, mode: "due", from: t.due, to}); });
    }
    let best = null;
    const seen = {};
    cands.forEach(m => {
      if (seen[m.mode + m.to]) return; seen[m.mode + m.to] = 1;
      const after = build(Object.assign({}, input, {tasks: withMove(input.tasks, m)}));
      const nw = weekOf(after, week.start); if (!nw) return;
      const gain = week.score - nw.score;
      if (gain < (minGain == null ? 0.05 : minGain)) return;
      const worse = after.weeks.some(w => { const o = weekOf(base, w.start), o0 = weekOf(input.__orig || base, w.start); return o && w.start !== week.start && !w.past && (w.score > Math.max(o.score, nw.score) + 0.001 || w.score > Math.max(o0.score, input.__crunch || 0) + 0.001); });
      if (worse) return;
      const shift = Math.abs(diff(m.from, m.to));
      if (!best || gain > best.gain + 0.02 || (Math.abs(gain - best.gain) <= 0.02 && shift < best.shift)) best = Object.assign({}, m, {gain: r2(gain), shift, after, c});
    });
    return best;
  }
  function slotsFor(model, t, move, today){
    const c = classOf(t), R = remOf(t, c);
    const moved = withMove([t], move)[0], a = effStart(moved, today), b = moved.due;
    const days = model.days.filter(D => !D.past && D.date >= a && D.date < b && D.date >= today).map(D => ({date: D.date, spare: Math.max(0, D.capacity - (D.demand - ((D.items[t.id] || {}).total || 0)))}))
      .filter(D => D.spare >= 0.5).sort((x, y) => y.spare - x.spare || (x.date < y.date ? -1 : 1)).slice(0, 3).sort((x, y) => x.date < y.date ? -1 : 1);
    if (!days.length) return [];
    const each = Math.max(0.5, Math.round(Math.min(R / days.length, Math.min(...days.map(d => d.spare))) * 4) / 4);
    return days.map(d => ({date: d.date, hours: each}));
  }
  // suggest(input, {weekStart, max}) -> {week, before, after, moves
  function suggest(input, opts){
    const o = opts || {}, today = input.today, base = build(input);
    const week = (o.weekStart && weekOf(base, o.weekStart)) || heaviest(base, 2);
    const res = {week: week ? week.start : "", before: week ? {score: week.score, level: week.level, peak: week.peak} : null, after: null, moves: []};
    if (!week || week.past || week.levelIdx < 2) return res;
    let tasks = input.tasks, cur = base, curWeek = week;
    const used = {};
    for (let i = 0; i < (o.max || 3); i++) {
      const inp = Object.assign({}, input, {tasks, __orig: base, __crunch: week.score});
      const pool = tasks.filter(t => !used[t.id] && movable(t, week, today));
      let pick = null;
      pool.forEach(t => { const m = bestMove(inp, cur, curWeek, t); if (m && (!pick || m.gain > pick.gain)) pick = Object.assign(m, {task: t}); });
      if (!pick) break;
      used[pick.id] = 1;
      const t = pick.task;
      tasks = withMove(tasks, pick);
      cur = pick.after; curWeek = weekOf(cur, week.start);
      res.moves.push({id: t.id, title: t.title || "Untitled", cls: pick.c, mode: pick.mode, from: pick.from, to: pick.to, gain: pick.gain, shift: pick.shift, synced: !!t.synced, hours: r2(remOf(t, pick.c)), slots: slotsFor(cur, t, pick, today)});
      if (curWeek.levelIdx < 2) break;
    }
    if (res.moves.length) res.after = {score: curWeek.score, level: curWeek.level, peak: curWeek.peak};
    return res;
  }
  // Two or three weeks out up to five
  function companionPick(model, today, opts){
    const o = opts || {};
    return (model.weeks || []).find(w => !w.past && w.levelIdx >= 4 && diff(today, w.start) >= (o.minDays || 14) && diff(today, w.start) <= (o.maxDays || 35)) || null;
  }
  // The best move for one named task (null when it can't be moved or no date helps)
  function moveFor(input, weekStart, id){
    const base = build(input), week = weekOf(base, weekStart); if (!week || week.past) return null;
    const t = (input.tasks || []).find(x => x.id === id); if (!t || !movable(t, week, input.today)) return null;
    const m = bestMove(Object.assign({}, input, {__orig: base, __crunch: week.score}), base, week, t); if (!m) return null;
    return {id, title: t.title || "Untitled", cls: m.c, mode: m.mode, from: m.from, to: m.to, gain: m.gain, shift: m.shift, synced: !!t.synced, hours: r2(remOf(t, m.c)), slots: slotsFor(m.after, t, m, input.today)};
  }
  // "3 exams and a paper"
  function phrase(counts){
    const parts = ORDER.filter(c => counts[c] && c !== "study").map(c => counts[c] === 1 ? `${/^[aeiou]/.test((PROF[c] || PROF.other).one) ? "an" : "a"} ${(PROF[c] || PROF.other).one}` : plural(c, counts[c]));
    return parts.length < 2 ? parts.join("") : parts.slice(0, -1).join(", ") + " and " + parts[parts.length - 1];
  }
  return {LEVELS, CUTS, PROF, levelOf, classOf, plural, describe, phrase, build, weeksAway, heaviest, nextCrunch, suggest, moveFor, applyMoves, withMove, companionPick, add, diff, monday, remOf, effStart};
})();
/*CRUNCH-END*/

const C = CRUNCH;
const LV_WORD = ["Calm", "Steady", "Busy", "Heavy", "Crunch"];
const KEY = "studyboard:crunch";
const store = {
  get(){ try { const o = JSON.parse(localStorage.getItem(KEY) || "{}"); return o && typeof o === "object" ? o : {}; } catch (e) { return {}; } },
  set(o){ try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {} }
};
/* Style */
{
  const st = document.createElement("style"); st.id = "crunchCss";
  st.textContent = `
:root{--cr0:#A9CFF6;--cr1:#9DDBA8;--cr2:#F7DA63;--cr3:#F29A4A;--cr4:#D3352A;--cr-t3:#1C2433;--cr-t4:#FFFFFF;--cr-hatch:rgba(0,0,0,.16);--cr-ring:#1C2433}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--cr0:#244A73;--cr1:#235C35;--cr2:#6F5B12;--cr3:#9C4C17;--cr4:#C8352A;--cr-t3:#FFFFFF;--cr-hatch:rgba(255,255,255,.2);--cr-ring:#E9ECF2}}
:root[data-theme="dark"]{--cr0:#244A73;--cr1:#235C35;--cr2:#6F5B12;--cr3:#9C4C17;--cr4:#C8352A;--cr-t3:#FFFFFF;--cr-hatch:rgba(255,255,255,.2);--cr-ring:#E9ECF2}
.cr{display:grid;gap:12px}
.cr-call{display:flex;gap:12px;align-items:center;flex-wrap:wrap;padding:12px 14px;border:1px solid var(--line);border-radius:14px;background:var(--surface)}
.cr-call .cr-ct{flex:1 1 220px;min-width:0}
.cr-call b{font-family:var(--display)}
.cr-note{margin:0;padding:8px 12px;border-radius:10px;background:var(--soft);color:var(--muted);font-size:.88rem}
.cr-pill{display:inline-block;padding:2px 9px;border-radius:999px;font:700 .78rem var(--display);color:var(--ink);border:1px solid var(--line);vertical-align:middle;white-space:nowrap}
.cr-pill.lv0{background:var(--cr0)}.cr-pill.lv1{background:var(--cr1)}.cr-pill.lv2{background:var(--cr2)}
.cr-pill.lv3{background:var(--cr3);color:var(--cr-t3)}.cr-pill.lv4{background:var(--cr4);color:var(--cr-t4)}
.cr-legend{display:flex;flex-wrap:wrap;gap:6px 14px;align-items:center;font-size:.8rem;color:var(--muted)}
.cr-legend span.lg{display:inline-flex;align-items:center;gap:5px}
.cr-sw{width:18px;height:18px;border-radius:5px;border:1px solid var(--line);display:inline-block}
.cr-scroll{overflow-x:auto;padding:10px;margin-top:8px;background:var(--surface);border:1px solid var(--line);border-radius:14px;box-shadow:var(--shadow);-webkit-overflow-scrolling:touch}
.cr-grid{display:grid;gap:3px;min-width:352px}
.cr-row,.cr-dow{display:grid;grid-template-columns:54px repeat(7,minmax(40px,1fr));gap:2px;align-items:stretch}
@media (min-width:760px){.cr-row,.cr-dow{grid-template-columns:84px repeat(7,minmax(64px,1fr)) minmax(120px,170px);gap:5px}}
.cr-dow span{font:700 .72rem var(--display);color:var(--muted);text-align:center;padding:2px 0;text-transform:uppercase;letter-spacing:.04em}
.cr-wk{border:1px solid transparent;background:transparent;border-radius:10px;padding:2px 3px;text-align:left;display:flex;flex-direction:column;justify-content:center;gap:1px;min-height:44px;font:600 .78rem/1.15 var(--body);color:var(--ink)}
.cr-wk:hover{background:var(--soft)}
.cr-wk .mo{font:700 .66rem var(--display);color:var(--muted);text-transform:uppercase;letter-spacing:.05em}
.cr-wk b{font:700 .82rem var(--display);white-space:nowrap}
.cr-wk .lvw{font-size:.68rem;color:var(--muted)}
.cr-bar{display:block;height:4px;border-radius:3px;background:var(--soft);overflow:hidden;margin-top:2px}
.cr-bar i{display:block;height:100%;background:var(--cr3)}
.cr-bar.lv4 i{background:var(--cr4)}.cr-bar.lv2 i{background:var(--cr2)}.cr-bar.lv1 i{background:var(--cr1)}.cr-bar.lv0 i{background:var(--cr0)}
.cr-d{position:relative;min-height:54px;border-radius:8px;border:1px solid color-mix(in srgb,var(--ink) 12%,transparent);padding:3px 3px 2px;text-align:left;color:var(--ink);font:600 .78rem/1 var(--body);background:var(--cr0);display:block;overflow:hidden}
@media (min-width:760px){.cr-grid .cr-d{min-height:68px;padding:5px 6px 3px}.cr-grid .cr-d .dn{font-size:1rem}.cr-wk{min-height:68px}}
.cr-d.lv1{background:var(--cr1)}
.cr-d.lv2{background:var(--cr2)}
.cr-d.lv3{background:var(--cr3);color:var(--cr-t3)}
.cr-d.lv4{background:var(--cr4);color:var(--cr-t4);border:2px solid var(--cr-ring);padding:2px 2px 1px}
.cr-d.is-past{opacity:.45;background:transparent;border-style:dashed;cursor:default}
.cr-d.is-today{z-index:2;box-shadow:0 0 0 2px var(--surface),0 0 0 4px var(--accent)}
button.cr-d:hover{filter:brightness(.95)}
.cr-d .dn{font-weight:700;font-size:.8rem}
.cr-d.lv3 .dn,.cr-d.lv4 .dn{background:rgba(0,0,0,.5);color:#fff;border-radius:4px;padding:1px 3px;display:inline-block}
.cr-d .dn small{font-weight:600;font-size:.62rem;margin-right:2px;text-transform:uppercase}
.cr-d .mk{position:absolute;left:3px;bottom:3px;display:flex;gap:2px}
.cr-legend .mk-ic{display:inline-grid;place-items:center;vertical-align:middle;font-style:normal;margin-right:2px}
.cr-d .mk i svg,.cr-legend .mk-ic svg{width:11px;height:11px;display:block}
.cr-legend .mk-ic svg{width:14px;height:14px}
.cr-d .mk i{font:800 .6rem/1 var(--display);font-style:normal;min-width:15px;height:15px;border-radius:4px;display:grid;place-items:center;background:var(--surface);color:var(--ink);border:1px solid color-mix(in srgb,var(--ink) 40%,transparent)}
.cr-d .nb{position:absolute;right:3px;bottom:3px;font:800 .62rem/1 var(--display);min-width:14px;height:14px;border-radius:7px;display:grid;place-items:center;background:var(--ink);color:var(--surface);padding:0 3px}
.cr-d .td{position:absolute;right:3px;top:2px;font:800 .55rem var(--display);text-transform:uppercase}
.cr-sum{display:none;font-size:.8rem;color:var(--muted);align-self:center;min-width:0}
@media (min-width:760px){.cr-sum{display:flex;flex-wrap:wrap;gap:4px 10px;justify-content:center}}
.cr-ty{display:inline-flex;align-items:center;gap:4px;color:var(--ink)}
.cr-ty b{font:700 .95rem var(--display)}
.cr-ty svg{width:20px;height:20px;color:var(--muted)}
.cr-sum b{color:var(--ink)}
.cr-empty{margin-top:4px}
.cr-more{justify-self:start}
.cr-help{border:1px solid var(--line);border-radius:12px;background:var(--surface)}
.cr-help summary{cursor:pointer;padding:10px 14px;font:600 .88rem var(--display);color:var(--muted)}
.cr-help-b{display:grid;gap:10px;padding:0 14px 12px}
.cr-sheet .sheet-body{gap:12px}
.cr-sl{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.cr-strip{display:grid;grid-template-columns:repeat(7,1fr);gap:3px}
.cr-strip .cr-d{min-height:40px}
.cr-strip.wks{grid-template-columns:repeat(var(--n),1fr)}
.cr-box{border:1px solid var(--line);border-radius:14px;padding:12px;background:var(--soft);display:grid;gap:8px}
.cr-box.focus{border-color:var(--accent);box-shadow:0 0 0 2px color-mix(in srgb,var(--accent) 25%,transparent)}
.cr-box h3,.cr-sheet h3{margin:0;font:700 .98rem var(--display)}
.cr-box ul,.cr-items{list-style:none;margin:0;padding:0;display:grid;gap:8px}
.cr-items li{border:1px solid var(--line);border-radius:12px;padding:10px 12px;display:grid;gap:5px;background:var(--surface)}
.cr-items .ttl{display:flex;gap:8px;align-items:baseline;flex-wrap:wrap}
.cr-items .ttl .link-btn{font-weight:700;text-align:left}
.cr-chip{font:700 .68rem var(--display);padding:1px 7px;border-radius:999px;background:var(--soft);border:1px solid var(--line);color:var(--muted);text-transform:uppercase;letter-spacing:.03em}
.cr-acts{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.cr-acts .btn{min-height:40px}
.cr-pv{display:grid;gap:6px}
.cr-pv .lab{font:700 .75rem var(--display);color:var(--muted)}
.cr-pv .cr-d{pointer-events:none}
.crunch-card{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:10px 0 0;padding:10px 12px;border-radius:12px;border:1px solid var(--line);border-left:6px solid var(--cr3);background:var(--surface)}
.crunch-card.lv4{border-left-color:var(--cr4)}
.crunch-card .cc-t{flex:1 1 200px;min-width:0;font-size:.92rem}
.crunch-card .cc-t b{font-family:var(--display)}
.crunch-card .mini{display:block;color:var(--muted)}
@media (max-width:600px){.cr-call .btn{width:100%}.crunch-card .cc-t{flex-basis:100%}.crunch-card .btn{margin-left:auto}}
`;
  document.head.appendChild(st);
}

/* The planner's data, in the model's shape */
let MEMO = {k: "", m: null, input: null};
function inputNow(){
  const today = todayISO(), stamp = nowStamp();
  const tasks = tasksArr().filter(t => t.status !== "done" && t.due).map(t => {
    const lp = lateOf(t), lu = lateUntilOf(t);
    const dead = dayDiff(today, t.due) < 0 && (lp === "none" || (lu && lu < stamp));
    return {id: t.id, title: t.title, type: t.type, due: t.due, time: t.time || "", start: t.start || "", status: t.status, rem: remainingOf(t), weight: weightOf(t), pct: t.pct,
      est: (isNum(t.hours) && Number(t.hours) > 0) || !!(autoPlanOn() && t.aiHours && t.aiHours.h > 0) || !!t.prepFor, synced: !!lmsOf(t), blocked: blockers(t).length > 0, prep: !!t.prepFor, bd: !!t.breakdownOf, courseId: t.courseId || "", dead};
  });
  let busy = {}; const keep = BUSY_CACHE;
  try { busy = Object.assign({}, busyDays(today, addDays(today, 21 * 7)).m); } catch (e) {}
  BUSY_CACHE = keep;
  const A = typeof SBACC !== "undefined" ? SBACC : null;
  const cs = A ? A.capScale() : 1, wk = [0, 1, 2, 3, 4, 5, 6].map(i => A ? A.wkScale(addDays(today, i)) : 1).map((v, i) => ({d: parse(addDays(today, i)).getDay(), v})).sort((p, q) => p.d - q.d).map(x => x.v);
  return {today, tasks, busy, dailyHours: dailyHours() || 3, capScale: cs, wkScale: wk.some(v => v !== 1) ? wk : null, maxWeeks: 20, minWeeks: 6};
}
function modelNow(){
  const k = [state.updated || 0, todayISO(), dailyHours(), tasksArr().length, AUTO_ON ? 1 : 0, typeof SBACC !== "undefined" && SBACC ? SBACC.sig() : ""].join("|");
  if (MEMO.k === k && MEMO.m) return MEMO.m;
  const input = inputNow(), m = C.build(input);
  MEMO = {k, m, input};
  return m;
}
const inputCur = () => { modelNow(); return MEMO.input; };

/* Words */
const rangeLabel = (a, b) => { const x = parse(a), y = parse(b); return x.getMonth() === y.getMonth() ? `${fmtShort(a)}–${y.getDate()}` : `${fmtShort(a)}–${fmtShort(b)}`; };
const awayText = (today, ws) => { const n = C.weeksAway(today, ws); return n === 0 ? "this week" : n === 1 ? "next week" : `in ${n} weeks`; };
const dayWord = d => parse(d).toLocaleDateString(undefined, {weekday: "long", month: "short", day: "numeric"}).replace(",", "");
const ratioText = r => `${(Math.round(r * 10) / 10).toFixed(1)}×`;
function dayLabel(D){
  if (D.past) return `${dayWord(D.date)}: past`;
  return `${dayWord(D.date)}: ${D.level}${D.due.length ? ", " + C.phrase(D.counts) + " due" : D.demand > 0.05 ? ", prep and study load " + ratioText(D.ratio) + " of your time" : ""}`;
}
function weekLabel(W){ return `Week of ${fmtShort(W.start)} to ${fmtShort(W.end)}: ${W.level}${W.reasons ? ", " + W.reasons : ""}`; }
const cap1 = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
const typeName = c => ({exam: "Exam", quiz: "Quiz", paper: "Paper", project: "Project", lab: "Lab", assignment: "Assignment", reading: "Reading", study: "Study", other: "Task"})[c] || "Task";

/* The heatmap */
const MK_ORDER = ["exam", "quiz", "paper", "assignment", "project", "lab", "reading", "study", "other"];
const mkKinds = D => { const out = []; MK_ORDER.forEach(c => { const k = ICON_OF[c]; if (D.counts[c] && !out.includes(k)) out.push(k); }); return out; };
function cellHtml(D, o){
  o = o || {};
  const cls = `cr-d lv${D.levelIdx}${D.past ? " is-past" : ""}${D.today ? " is-today" : ""}`;
  const dn = parse(D.date).getDate(), first = dn === 1;
  const mk = mkKinds(D);
  const nDue = D.due.length;
  const inner = `<span class="dn">${first ? `<small>${esc(parse(D.date).toLocaleDateString(undefined, {month: "short"}))}</small>` : ""}${dn}</span>${D.today ? `<span class="td">today</span>` : ""}${mk.length ? `<span class="mk" aria-hidden="true">${(mk.length > 2 ? mk.slice(0, 1) : mk).map(k => `<i>${typeIcon(k)}</i>`).join("")}${mk.length > 2 ? `<i>+${mk.length - 1}</i>` : ""}</span>` : ""}${nDue ? `<span class="nb" aria-hidden="true">${nDue}</span>` : ""}`;
  if (o.plain) return `<span class="${cls}" role="img" aria-label="${esc(dayLabel(D))}">${inner}</span>`;
  if (D.past) return `<span class="${cls}" role="gridcell" aria-label="${esc(dayLabel(D))}" aria-disabled="true">${inner}</span>`;
  return `<button type="button" class="${cls}" role="gridcell" tabindex="${o.tab ? 0 : -1}" data-act="cr-day" data-id="${D.date}" aria-label="${esc(dayLabel(D))}" title="${esc(dayLabel(D))}">${inner}</button>`;
}
// What is due in a week
const ICON_OF = {exam: "Exam", quiz: "Quiz", paper: "Assignment", project: "Project", lab: "Lab", assignment: "Assignment", reading: "Reading", study: "Study", other: "Other"};
function typeCounts(W){
  const by = {}; Object.keys(W.counts).forEach(c => { const k = ICON_OF[c] || "Other"; by[k] = (by[k] || 0) + W.counts[c]; });
  return ["Exam", "Quiz", "Assignment", "Project", "Lab", "Reading", "Study", "Other"].filter(k => by[k]).map(k => `<span class="cr-ty" title="${by[k]} ${esc(k)} due"><b>${by[k]}</b>${typeIcon(k)}</span>`).join("");
}
function viewCrunch(){
  const m = modelNow(), today = todayISO();
  const head = `<div class="view-head cr-head"><h2>Crunch Forecast</h2></div>`;
  if (m.empty) return `<section class="cr" aria-label="Crunch Forecast">${head}<div class="empty cr-empty"><strong>Nothing Due Yet</strong>Add tasks with due dates to see which weeks ahead get heavy.<div style="margin-top:12px"><button class="btn primary" data-act="new-task">Add a Task</button></div></div></section>`;
  const hv = C.heaviest(m, 0);
  let call;
  if (hv && hv.levelIdx >= 2) call = `<div class="cr-call"><div class="cr-ct"><span class="cr-pill lv${hv.levelIdx}">${LV_WORD[hv.levelIdx]}</span> <b>Heaviest week: ${esc(rangeLabel(hv.start, hv.end))}, ${esc(awayText(today, hv.start))}</b><br><span class="mini">${esc(cap1(hv.headline || "Steady work"))} · about ${ratioText(hv.score)} your usual study time</span></div><button class="btn${hv.levelIdx >= 3 ? " primary" : ""}" data-act="cr-week" data-id="${hv.start}">See the Week</button></div>`;
  else call = `<div class="cr-call"><div class="cr-ct"><span class="cr-pill lv${hv ? hv.levelIdx : 0}">${hv ? LV_WORD[hv.levelIdx] : "Calm"}</span> <b>No heavy weeks ahead</b><br><span class="mini">${hv ? `Your busiest week is ${esc(rangeLabel(hv.start, hv.end))}${hv.reasons ? ": " + esc(hv.reasons) : ""}.` : "Nothing much is coming up."} Nice and manageable.</span></div></div>`;
  let est = "";
  if (m.noEstimate > 0) {
    let n = 0; try { n = SBEST.count(); } catch (e) {}
    est = `<p class="cr-note">${m.noEstimate >= m.tasks ? "No time estimates yet, so this uses typical hours for each kind of task. Treat it as a rough guide." : `${m.noEstimate} of ${m.tasks} tasks have no time estimate, so typical hours are used for them.`}${n ? ` <button type="button" class="link-btn" data-act="cr-est">Add Times</button>` : ""}</p>`;
  }
  const legend = `<div class="cr-legend" aria-label="Legend">${[0, 1, 2, 3, 4].map(i => `<span class="lg"><span class="cr-sw cr-d lv${i}" style="min-height:0;padding:0"></span>${LV_WORD[i]}</span>`).join("")}${["Exam", "Quiz", "Assignment", "Project", "Lab", "Reading", "Study", "Other"].map(k => `<span class="lg"><i class="mk-ic">${typeIcon(k)}</i> ${esc(k)}</span>`).join("")}<span class="lg">number = items due</span></div>`;
  const shownDays = new Set(); (ui.crAll ? m.weeks : m.weeks.filter(W => !W.past).slice(0, 6)).forEach(W => W.days.forEach(d => shownDays.add(d)));
  const focusDate = ui.crFocus && shownDays.has(ui.crFocus) && m.days.some(d => d.date === ui.crFocus && !d.past) ? ui.crFocus : today;
  const dow = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const upcoming = m.weeks.filter(W => !W.past), SHOW = 6;
  const shownWeeks = ui.crAll ? m.weeks : m.weeks.filter(W => !W.past).slice(0, SHOW);
  const hiddenWeeks = upcoming.length - shownWeeks.filter(W => !W.past).length;
  const rows = shownWeeks.map(W => {
    const ds = W.days.map(d => m.days.find(x => x.date === d));
    const wd = parse(W.start);
    const bar = Math.min(100, Math.round(W.score / 2 * 100));
    return `<div class="cr-row" role="row" aria-label="${esc(weekLabel(W))}">
      <button type="button" class="cr-wk" role="rowheader" data-act="cr-week" data-id="${W.start}" aria-label="${esc(weekLabel(W) + ". Open week details")}" ${W.past ? "disabled" : ""}><b>${esc(wd.toLocaleDateString(undefined, {month: "short", day: "numeric"}))}</b><span class="lvw">${W.past ? "past" : LV_WORD[W.levelIdx]}</span><span class="cr-bar lv${W.levelIdx}" aria-hidden="true"><i style="width:${W.past ? 0 : bar}%"></i></span></button>
      ${ds.map(D => cellHtml(D, {tab: D.date === focusDate})).join("")}
      <div class="cr-sum" role="gridcell">${W.past ? "" : typeCounts(W)}</div></div>`;
  }).join("");
  const help = `<details class="cr-help"><summary>How to Read This</summary><div class="cr-help-b"><p class="mini" id="crHint" style="margin:0">Each square is a day. Darker, hatched squares are heavier. Tap a day or a week for details. Arrow keys move around.</p>${legend}${est}</div></details>`;
  const more = hiddenWeeks > 0 ? `<button type="button" class="btn small cr-more" data-act="cr-all">Show ${hiddenWeeks} Later Week${hiddenWeeks === 1 ? "" : "s"}</button>` : ui.crAll && upcoming.length > SHOW ? `<button type="button" class="btn small cr-more" data-act="cr-all">Show Fewer Weeks</button>` : "";
  const grid = `<div class="cr-scroll"><div class="cr-grid" role="grid" aria-label="Workload by day, one row per week" aria-describedby="crHint">
      <div class="cr-dow" role="row"><span role="columnheader" aria-label="Week"></span>${dow.map(d => `<span role="columnheader">${d}</span>`).join("")}<span class="cr-sum" role="columnheader" style="text-align:center">Week</span></div>
      ${rows}</div></div>${more}`;
  try { return crunchR2(m, today, call, est, grid, help); } catch (e) { console.warn("crunch view", e); }
  return `<section class="cr" aria-label="Crunch Forecast">${head}${call}${grid}${help}</section>`;
}
/* Crunch R2: this week's load against your study time */
const CR_IC = ["<path d='M5 19c0-8 5-13 14-14 0 9-5 14-13 14z'/><path d='M5 19c3-5 6-8 10-10'/>", "<path d='M3 12h4l2-5 4 10 2-5h6'/>", "<circle cx='12' cy='12' r='8.5'/><path d='M12 7.5V12l3 2'/>",
  "<path d='M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2.5 1.5-4 2.5-5 .3 1.6 1 2.4 2 2.8C11 8.5 11 6 12 3z'/>", "<path d='M13 2.5L5 13.5h6l-1 8 8-11h-6z'/>"];
const crIcon = i => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${CR_IC[i] || CR_IC[0]}</svg>`;
function crunchR2(m, today, call, est, grid, help){
  const live = m.weeks.filter(W => !W.past); if (!live.length) throw new Error("no weeks");
  const tw = live[0], dayOf = d => m.days.find(x => x.date === d);
  const byCourse = W => { const out = {}; W.days.forEach(d => { const D = dayOf(d); if (!D || D.past) return; Object.values(D.items || {}).forEach(x => { const t = state.tasks[x.id], k = t && t.courseId && courseOf(t.courseId) ? t.courseId : ""; out[k] = (out[k] || 0) + x.total; }); }); return out; };
  const order = coursesArr().map(c => c.id).concat([""]);
  const col = k => k ? colorOf(k) : "#94A3B8";
  const lab = k => { if (!k) return "Other"; const c = courseOf(k), l = courseLabel(c); return coursesArr().filter(x => courseLabel(x) === l).length > 1 ? c.name : l; };
  const chartWeeks = ui.crAll ? live : live.slice(0, 6);
  const data = chartWeeks.map(W => ({W, by: byCourse(W)}));
  const caps = live.slice(0, 6).map(W => W.capacity).filter(x => x > 0).sort((a, b) => a - b), cap = caps.length ? caps[Math.floor(caps.length / 2)] : 0;
  const hiH = Math.max(1, ...data.map(x => Math.max(x.W.demand, x.W.capacity))) * 1.12, step = hiH <= 10 ? 2 : hiH <= 30 ? 5 : 10;
  const top = Math.ceil(hiH / step) * step;
  const pct = h => (h / top * 100).toFixed(2);
  const used = order.filter(k => data.some(x => (x.by[k] || 0) > 0.05));
  const twBy = byCourse(tw), over = tw.demand - tw.capacity;
  const thisWeek = `<section class="cr2-now lv${tw.levelIdx}" aria-label="This week">
      <div class="cr2-band"><span class="g2-kick">This Week · ${esc(rangeLabel(tw.start, tw.end))}</span></div>
      <div class="cr2-id"><span class="cr2-ic">${crIcon(tw.levelIdx)}</span><div><b class="cr2-lv">${LV_WORD[tw.levelIdx]}</b><span class="mini">${tw.capacity > 0 ? (tw.demand / tw.capacity).toFixed(1) + "× your study time" : "no study time set"}${tw.headline ? " · " + esc(tw.headline) : ""}</span></div></div>
      <div class="cr2-big"><b>${fmtHM(tw.demand) || "0h"}</b><span>of work, with <b>${fmtHM(tw.capacity) || "0h"}</b> of study time</span></div>
      <div class="cr2-meter"><i style="width:${Math.min(100, tw.capacity ? tw.demand / tw.capacity * 100 : 0).toFixed(0)}%"></i></div>
      <p class="mini cr2-over">${over > 0.25 ? `<b>${fmtHM(over)} over</b> your study time` : `${fmtHM(Math.max(0, -over)) || "No"} time to spare`}</p>
      <ul class="cr2-courses">${order.filter(k => (twBy[k] || 0) > 0.05).sort((a, b) => twBy[b] - twBy[a]).map(k => `<li style="--c:${esc(col(k))}"><span>${esc(lab(k))}</span><span class="cr2-cb"><i style="width:${(twBy[k] / Math.max(...Object.values(twBy)) * 100).toFixed(0)}%"></i></span><b>${fmtHM(twBy[k])}</b></li>`).join("")}</ul>
      <button type="button" class="btn primary cr2-go" data-act="cr-week" data-id="${tw.start}">See What's Driving It</button></section>`;
  const bars = data.map(({W, by}) => `<button type="button" class="cr2-col${W.start === tw.start ? " is-now" : ""}" data-act="cr-week" data-id="${W.start}" aria-label="${esc(`Week of ${fmtShort(W.start)}: ${fmtHM(W.demand) || "0h"} of work, ${LV_WORD[W.levelIdx]}. Open week details`)}">
      ${W.capacity > 0 ? `<i class="cr2-capm" style="bottom:calc(34px + (100% - 34px) * ${(Math.min(W.capacity, top) / top).toFixed(4)})" title="Study time ${fmtHM(W.capacity)}"></i>` : ""}<span class="cr2-stack${W.demand > W.capacity + 0.25 ? " is-over" : ""}" style="height:${pct(W.demand)}%"><b class="cr2-h">${W.demand >= 0.25 ? fmtHM(W.demand) : ""}</b>${used.map(k => (by[k] || 0) > 0.05 ? `<i style="height:${(by[k] / Math.max(W.demand, 0.01) * 100).toFixed(2)}%;background:${esc(col(k))}"></i>` : "").join("")}</span>
      <span class="cr2-x">${esc(fmtShort(W.start))}${W.start === tw.start ? `<em>This Week</em>` : ""}</span></button>`).join("");
  const ticks = []; for (let v = 0; v <= top + 0.01; v += step) ticks.push(v);
  const chart = `<section class="cr2-chart" aria-label="Hours of work by week">
      <div class="cr2-plot" style="--n:${data.length}">
        <div class="cr2-grid" aria-hidden="true">${ticks.map(v => `<span style="bottom:${pct(v)}%"><em>${Math.round(v)}h</em></span>`).join("")}</div>
        <div class="cr2-bars">${bars}</div></div>
      <div class="cr2-legend">${used.map(k => `<span><i style="background:${esc(col(k))}"></i>${esc(lab(k))}</span>`).join("")}<span><i class="cap"></i>Your study time that week</span></div></section>`;
  const maxD = Math.max(1, ...live.slice(1, 7).map(W => W.demand));
  const coming = live.slice(1, 6).map(W => { const by = byCourse(W); return `<li><button type="button" class="cr2-wk" data-act="cr-week" data-id="${W.start}"><b>${esc(rangeLabel(W.start, W.end))}</b>
      <span class="cr2-mini" aria-hidden="true"><span style="width:${(W.demand / maxD * 100).toFixed(0)}%">${used.map(k => (by[k] || 0) > 0.05 ? `<i style="flex:${by[k].toFixed(2)};background:${esc(col(k))}"></i>` : "").join("")}</span></span>
      <span class="cr2-wt"><b class="lv${W.levelIdx}">${LV_WORD[W.levelIdx]}</b> · ${W.demand >= 0.25 ? fmtHM(W.demand) : "nothing planned yet"}${W.headline ? " · " + esc(W.headline) : ""}</span></button>
      ${W.levelIdx >= 3 ? `<button type="button" class="btn small" data-act="cr-week" data-id="${W.start}">Ease This Week</button>` : ""}</li>`; }).join("");
  const toggle = `<div class="segb cr2-range" role="group" aria-label="Weeks shown"><button type="button" data-act="cr-all" aria-pressed="${!ui.crAll}"${ui.crAll ? "" : " disabled"}>Next 6 Weeks</button><button type="button" data-act="cr-all" aria-pressed="${!!ui.crAll}"${ui.crAll ? " disabled" : ""}>Whole Term</button></div>`;
  return `<section class="cr cr2" aria-label="Crunch Forecast"><div class="view-head cr-head"><h2>Crunch Forecast</h2>${toggle}</div>
    <div class="cr2-top">${thisWeek}${chart}</div>
    ${coming ? `<section class="c2-card2 cr2-coming"><h3 class="fsec">Coming Weeks<span class="spacer"></span><span class="mini">tap a week for details</span></h3><ul>${coming}</ul></section>` : ""}
    ${est}
    <details class="cr2-days"${ui.crDays ? " open" : ""}><summary>Day by Day</summary>${grid}</details>${help}</section>`;
}
document.addEventListener("toggle", e => { const d = e.target; if (d && d.classList && d.classList.contains("cr2-days")) ui.crDays = d.open; }, true);
VIEWS.crunch = viewCrunch;

/* Keyboard: arrows move over the grid */
document.addEventListener("keydown", e => {
  const c = e.target.closest && e.target.closest(".cr-d[data-act=cr-day]"); if (!c || e.altKey || e.ctrlKey || e.metaKey) return;
  const step = {ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7, PageUp: -28, PageDown: 28}[e.key];
  let to = null;
  if (step) to = C.add(c.dataset.id, step);
  else if (e.key === "Home" || e.key === "End") { const row = c.closest(".cr-row"), cells = [...row.querySelectorAll(".cr-d[data-act=cr-day]")]; const t = e.key === "Home" ? cells[0] : cells[cells.length - 1]; if (t) to = t.dataset.id; }
  else return;
  e.preventDefault();
  let el = null; const grid = c.closest(".cr-grid");
  for (let i = 0; i < 4 && !el && to; i++) { el = grid.querySelector(`.cr-d[data-id="${to}"]`); if (!el && step && Math.abs(step) < 7) break; if (!el && step) to = C.add(to, step); }
  if (!el || el === c) return;
  c.tabIndex = -1; el.tabIndex = 0; el.focus(); ui.crFocus = el.dataset.id;
  try { el.scrollIntoView({block: "nearest", inline: "nearest"}); } catch (err) {}
});

/* Detail sheet */
let SH = null;
function sheetMoves(ws){
  const inp = inputCur(), sug = C.suggest(inp, {weekStart: ws, max: 3});
  return {inp, sug};
}
function stripOf(model, dates, o){ return dates.map(d => { const D = model.days.find(x => x.date === d); return D ? cellHtml(D, {plain: true}) : ""; }).join(""); }
function weekBlock(W, today){
  const cls = `cr-d lv${W.levelIdx}${W.past ? " is-past" : ""}`;
  return `<span class="${cls}" role="img" aria-label="Week of ${esc(fmtShort(W.start))}: ${W.level}" style="min-height:44px"><span class="dn">${esc(fmtShort(W.start))}</span><span class="mk" style="font-size:.6rem;font-weight:800">${W.past ? "" : esc(LV_WORD[W.levelIdx])}</span></span>`;
}
function previewHtml(ws, moves){
  const inp = inputCur(), before = modelNow(), after = C.build(Object.assign({}, inp, {tasks: C.applyMoves(inp.tasks, moves)}));
  const bw = before.weeks.find(w => w.start === ws), aw = after.weeks.find(w => w.start === ws);
  const i0 = Math.max(0, before.weeks.findIndex(w => w.start === ws) - 2), near = before.weeks.slice(i0, i0 + 6).filter(w => !w.past);
  const ws2 = (model) => near.map(w => model.weeks.find(x => x.start === w.start)).filter(Boolean).map(w => weekBlock(w)).join("");
  return `<div class="cr-pv" aria-live="polite"><div><span class="lab">Week of ${esc(fmtShort(ws))}, now: ${LV_WORD[bw.levelIdx]} (${ratioText(bw.score)}), busiest day ${ratioText(bw.peak)}</span><div class="cr-strip" style="margin-top:4px">${stripOf(before, bw.days)}</div></div>
    <div><span class="lab">After pulling ${moves.length === 1 ? "it" : "these"} forward: ${LV_WORD[aw.levelIdx]} (${ratioText(aw.score)}), busiest day ${ratioText(aw.peak)}</span><div class="cr-strip" style="margin-top:4px">${stripOf(after, aw.days)}</div></div>
    <div><span class="lab">Nearby weeks, now</span><div class="cr-strip wks" style="--n:${near.length};margin-top:4px">${ws2(before)}</div></div>
    <div><span class="lab">Nearby weeks, after</span><div class="cr-strip wks" style="--n:${near.length};margin-top:4px">${ws2(after)}</div></div></div>`;
}
function moveText(m){
  const slots = (m.slots || []).map(s => parse(s.date).toLocaleDateString(undefined, {weekday: "short", month: "short", day: "numeric"})).join(", ");
  const h = m.slots && m.slots.length ? m.slots[0].hours : 0;
  return (m.mode === "start" ? `Start ${fmtShort(m.to)} (the school's due date stays)` : `Due ${fmtShort(m.from)} → ${fmtShort(m.to)}`) + (slots ? `. Work on it ${slots}${h ? `, about ${fmtHM(h)} each` : ""}` : "");
}
function itemHtml(it, ws, mv, today){
  const t = state.tasks[it.id]; if (!t) return "";
  const c = t.courseId && courseOf(t.courseId), dl = dayDiff(today, t.due);
  const prep = it.kind === "prep";
  const left = it.hours > 0 ? `about ${fmtHM(it.hours)} of work${it.est ? "" : " (typical estimate)"}` : "";
  const bits = [c ? courseLabel(c) : "", `due ${fmtDate(t.due)}${dl > 0 ? ` (${dl === 1 ? "tomorrow" : "in " + dl + " days"})` : dl === 0 ? " (today)" : " (overdue)"}`, left, hasWeight(t) ? `${Number(t.weight)}% of grade` : "", t.status === "doing" ? "in progress" : ""].filter(Boolean);
  const canStart = dl >= 0 && canDoNow(t);
  return `<li style="--c:${esc(colorOf(t.courseId))}"><div class="ttl"><button type="button" class="link-btn" data-act="edit-task" data-id="${esc(t.id)}">${esc(t.title)}</button><span class="cr-chip">${esc(typeName(it.cls))}</span>${prep ? `<span class="cr-chip">Prep</span>` : ""}${it.synced ? `<span class="cr-chip">School sync</span>` : ""}</div>
    <div class="mini">${esc(bits.join(" · "))}</div>
    ${mv ? `<div class="mini"><b>Suggested:</b> ${esc(moveText(mv))}.</div>` : ""}
    <div class="cr-acts">${mv ? `<button type="button" class="btn small primary" data-act="cr-move" data-id="${esc(t.id)}" data-ws="${ws}">Move Earlier</button><button type="button" class="btn small" data-act="cr-preview" data-id="${esc(t.id)}" data-ws="${ws}">Preview</button>` : ""}${canStart ? `<button type="button" class="btn small${mv ? "" : " primary"}" data-act="pomo-task" data-id="${esc(t.id)}">Start Now</button>` : ""}</div></li>`;
}
function showSheet(){
  if (!SH) return;
  const m = modelNow(), today = todayISO();
  const isDay = SH.kind === "day";
  const D = isDay ? m.days.find(d => d.date === SH.key) : null;
  const ws = isDay ? C.monday(SH.key) : SH.key;
  const W = m.weeks.find(w => w.start === ws);
  if (!W || (isDay && !D)) { if (dlg.open) dlg.close(); return; }
  const body0 = dlg.querySelector(".cr-sheet .sheet-body"), keep = body0 ? body0.scrollTop : 0;
  const lvIdx = isDay ? D.levelIdx : W.levelIdx, ratio = isDay ? D.ratio : W.score, reasons = isDay ? (D.due.length ? C.phrase(D.counts) + " due" : D.demand > 0.05 ? "Prep and study load, nothing due" : "Nothing due") : (W.reasons || "Nothing much due");
  const title = isDay ? dayWord(D.date) : `Week of ${rangeLabel(W.start, W.end)}`;
  const {inp, sug} = sheetMoves(ws);
  const byId = {}; sug.moves.forEach(x => { byId[x.id] = x; });
  const list = (isDay ? D.top : W.top).filter(x => state.tasks[x.id]);
  list.forEach(x => { if (!byId[x.id]) { try { const mv = C.moveFor(inp, ws, x.id); if (mv) byId[x.id] = mv; } catch (e) {} } });
  const order = list.slice().sort((a, b) => (byId[b.id] ? 1 : 0) - (byId[a.id] ? 1 : 0));
  let box = "";
  if (!W.past && sug.moves.length) {
    const pv = SH.pv && SH.pv.length ? SH.pv : null, n = sug.moves.length;
    const bI = C.LEVELS.indexOf(sug.before.level), aI = C.LEVELS.indexOf(sug.after.level);
    box = `<div class="cr-box cr3-box${SH.focus ? " focus" : ""}" id="crSug"><div class="cr3-bh"><h3>Ease This Week</h3><span class="cr3-chg"><span class="cr-pill lv${bI}">${esc(LV_WORD[bI])}</span><span aria-hidden="true">→</span><span class="cr-pill lv${aI}">${esc(LV_WORD[aI])}</span></span></div>
      <p class="mini" style="margin:0">${n === 1 ? "Start one task earlier" : `Start ${n} tasks earlier`}. Due dates from your school stay as they are.</p>
      <ul class="cr3-moves">${sug.moves.map(x => { const t = state.tasks[x.id]; return `<li style="--c:${esc(colorOf(t && t.courseId))}"><b>${esc(x.title)}</b><span class="mini">${esc(moveText(x))}</span></li>`; }).join("")}</ul>
      ${pv ? previewHtml(ws, pv) : ""}
      <div class="cr-acts">${pv ? `<button type="button" class="btn primary" data-act="cr-apply" data-ws="${ws}">Confirm${n > 1 ? ` ${n} Moves` : ""}</button><button type="button" class="btn" data-act="cr-cancel" data-ws="${ws}">Cancel</button>` : `<button type="button" class="btn primary" data-act="cr-preview" data-ws="${ws}" ${SH.focus ? "autofocus" : ""}>Preview the Change</button><button type="button" class="btn" data-act="cr-apply" data-ws="${ws}">Move ${n === 1 ? "It" : `All ${n}`} Now</button>`}</div></div>`;
  } else if (!W.past && W.levelIdx >= 2) box = `<div class="cr-box"><h3>Pulling Work Forward</h3><p class="mini" style="margin:0">Nothing here can move earlier in a way that helps. Exams and quizzes stay put, and blocked or nearly finished work isn't suggested. Starting the biggest item now still spreads the load.</p></div>`;
  const days7 = W.days.map(d => m.days.find(y => y.date === d)).filter(Boolean), dMax = Math.max(1, ...days7.map(x => Math.max(x.demand, x.capacity)));
  const strip = isDay ? "" : `<div class="cr3-days" role="group" aria-label="Days of this week">${days7.map(x => `<button type="button" class="cr3-day lv${x.levelIdx}${x.past ? " is-past" : ""}" data-act="cr-day" data-id="${x.date}" ${x.past ? "disabled" : ""} aria-label="${esc(`${dayWord(x.date)}: ${fmtHM(x.demand) || "nothing"} of work, ${LV_WORD[x.levelIdx]}`)}"><span class="cr3-bar"><i style="height:${Math.round(Math.min(1, x.demand / dMax) * 100)}%"></i><em style="bottom:${Math.round(Math.min(1, x.capacity / dMax) * 100)}%"></em></span><b>${esc(parse(x.date).toLocaleDateString(undefined, {weekday: "short"}))}</b><span>${x.demand >= 0.25 ? esc(fmtHM(x.demand)) : "–"}</span>${x.due.length ? `<span class="cr3-due">${x.due.length} due</span>` : ""}</button>`).join("")}</div>`;
  const dayEx = isDay ? `<p class="mini" style="margin:0">${D.capacity < (D.cap0 != null ? D.cap0 : dailyHours()) - 0.05 ? `Classes or events leave about ${fmtHM(D.capacity)} of study time. ` : ""}Load ${fmtHM(D.demand)} against ${fmtHM(D.capacity)} of study time. <button type="button" class="link-btn" data-act="cr-week" data-id="${ws}">See the Whole Week</button></p>` : `<p class="mini" style="margin:0">About ${fmtHM(W.demand)} of work and deadline pressure against ${fmtHM(W.capacity)} of study time. The busiest day is ${W.peakDay ? esc(dayWord(W.peakDay)) : "none"} at ${ratioText(W.peak)}.</p>`;
  const LV_COL = ["#4C9BE8", "#3FA866", "#D9A21B", "#E8833A", "#D3352A"], dem = isDay ? D.demand : W.demand, cap = isDay ? D.capacity : W.capacity;
  const html = `<form class="sheet cr-sheet cr3">${bandHead(title, crIcon(lvIdx), LV_COL[lvIdx] || "#4C9BE8", `${LV_WORD[lvIdx]} · ${esc(reasons)}`)}<div class="sheet-body">
    <div class="cr3-sum"><div><b>${fmtHM(dem) || "0h"}</b><span>of work</span></div><div><b>${fmtHM(cap) || "0h"}</b><span>of study time</span></div><div><b class="${dem > cap + 0.25 ? "over" : ""}">${cap > 0 ? (dem / cap).toFixed(1) + "×" : "–"}</b><span>${dem > cap + 0.25 ? fmtHM(dem - cap) + " over" : "fits"}</span></div></div>
    ${dayEx}${strip}${box}
    <h3 class="cr3-h">${isDay ? "On This Day" : "What's Driving This Week"}</h3>
    ${order.length ? `<ul class="cr-items">${order.map(x => itemHtml(x, ws, byId[x.id], today)).join("")}</ul>` : `<p class="mini" style="margin:0">Nothing due or building up here.</p>`}
    ${m.noEstimate ? `<p class="cr-note">Tasks without a time estimate use typical hours for their type.</p>` : ""}
    </div><div class="sheet-foot"><span class="spacer"></span><button type="button" class="btn primary" data-act="close">Done</button></div></form>`;
  openSheet(html);
  const b = dlg.querySelector(".cr-sheet .sheet-body"); if (b && keep) b.scrollTop = keep;
  if (SH.focus) { SH.focus = false; setTimeout(() => { const s = dlg.querySelector("#crSug"); if (s) { try { s.scrollIntoView({block: "nearest"}); } catch (e) {} } }, 30); }
}
function openWeek(ws, o){
  const m = modelNow();
  if (!m.weeks.some(w => w.start === ws)) return false;
  SH = {kind: "week", key: ws, pv: null, focus: !!(o && o.focus)};
  if (ui.tab !== "crunch" && !(o && o.stay)) { ui.tab = "crunch"; render(); }
  showSheet(); return true;
}
function openDay(d){ SH = {kind: "day", key: d, pv: null, focus: false}; showSheet(); }
dlg.addEventListener("close", () => { SH = null; });

/* Moving work */
function changeFor(mv){
  const t = state.tasks[mv.id]; if (!t) return null;
  const n = clone(t);
  if (mv.mode === "start") n.start = mv.to; else { n.due = mv.to; if (n.start && n.start > n.due) n.start = n.due; }
  return {kind: "task", id: t.id, after: n};
}
function applyMoves(moves){
  const ch = moves.map(changeFor).filter(Boolean); if (!ch.length) return;
  const one = moves.length === 1 ? moves[0] : null, t = one && state.tasks[one.id];
  const label = one ? (one.mode === "start" ? `“${t.title}” now starts ${fmtShort(one.to)}` : `Moved “${t.title}” to ${fmtShort(one.to)}`) : `Pulled ${ch.length} tasks forward`;
  if (dlg.open) dlg.close();
  applyChanges(ch, label);
  crunchHush(3);
}
hook("act", (act, el) => {
  const id = el.dataset.id;
  switch (act) {
    case "cr-day": ui.crFocus = id; openDay(id); return true;
    case "cr-week": openWeek(id, {stay: true}); return true;
    case "cr-preview": {
      if (!SH) return true;
      const ws = el.dataset.ws;
      const mv = id ? C.moveFor(inputCur(), ws, id) : null;
      const moves = id ? (mv ? [mv] : []) : C.suggest(inputCur(), {weekStart: ws, max: 3}).moves;
      if (!moves.length) { toast("No earlier date helps here"); return true; }
      SH.pv = moves; showSheet();
      const bx = dlg.querySelector("#crSug"); if (bx) { try { bx.scrollIntoView({block: "nearest"}); } catch (e) {} }
      return true;
    }
    case "cr-cancel": if (SH) { SH.pv = null; showSheet(); } return true;
    case "cr-move": { const mv = C.moveFor(inputCur(), el.dataset.ws, id); if (!mv) { toast("No earlier date helps here"); return true; } applyMoves([mv]); return true; }
    case "cr-apply": { const moves = SH && SH.pv && SH.pv.length ? SH.pv : C.suggest(inputCur(), {weekStart: el.dataset.ws, max: 3}).moves; applyMoves(moves); return true; }
    case "cr-open": {
      const ws = id || ""; if (dlg.open) dlg.close();
      ui.tab = "crunch"; render(); window.scrollTo(0, 0);
      if (ws) openWeek(ws, {focus: el.dataset.focus === "1"});
      return true;
    }
    case "cr-dismiss": { crunchHush(7); const o = store.get(); o.dis = Object.assign({}, o.dis); o.dis[id] = Date.now(); Object.keys(o.dis).forEach(k => { if (Date.now() - o.dis[k] > 90 * 864e5) delete o.dis[k]; }); store.set(o); scheduleRender(); toast("Hidden for that week", () => { const p = store.get(); if (p.dis) delete p.dis[id]; delete p.quietUntil; store.set(p); scheduleRender(); }); return true; }
    case "cr-all": ui.crAll = !ui.crAll; scheduleRender(); return true;
    case "cr-est": try { if (dlg.open) dlg.close(); SBEST.open(false); } catch (e) {} return true;
  }
  return false;
});

/* Today card, companion line, Suggestions tray */
const trayDismissed = ws => { try { return !!(AUTO.dis && AUTO.dis["cr:" + ws]); } catch (e) { return false; } };
const dismissedWeek = ws => !!(store.get().dis || {})[ws] || trayDismissed(ws);
// Waving one crunch week off (or acting on it) quiets the card and the companion for a week
const crunchQuiet = () => Date.now() < (store.get().quietUntil || 0);
const crunchHush = days => { const o = store.get(); o.quietUntil = Date.now() + days * DAY_MS; store.set(o); };
const trayOn = () => { try { return AUTO_ON && autoFeatOn("nudge") && !insSnoozed("crunch"); } catch (e) { return false; } };
function cardHtml(){
  try {
    const m = modelNow(), today = todayISO();
    const w = C.nextCrunch(m, today, {min: 3, maxDays: 42});
    if (!w || dismissedWeek(w.start) || crunchQuiet()) return "";
    if (trayOn()) { const ti = SBCRUNCH.trayItem(); if (ti && ti.tid === w.start) return ""; }
    const crunch = w.levelIdx >= 4;
    return `<div class="crunch-card lv${w.levelIdx}" role="region" aria-label="${crunch ? "Crunch" : "Heavy week"} ahead"><div class="cc-t"><b>${crunch ? "Crunch ahead" : "Heavy week ahead"}: ${esc(fmtShort(w.start))} to ${esc(fmtShort(w.end))}</b> (${esc(awayText(today, w.start))})<span class="mini">${esc(cap1(w.headline || w.reasons || ""))}</span></div>
      <button type="button" class="btn small" data-act="cr-open" data-id="${w.start}">See Forecast</button><button type="button" class="icon-btn sm" data-act="cr-dismiss" data-id="${w.start}" aria-label="Hide this for the week of ${esc(fmtShort(w.start))}">${CLOSE}</button></div>`;
  } catch (e) { console.warn("crunch card", e); return ""; }
}
// One line the companion may say, with a concrete first suggestion
function pickWeek(){
  const m = modelNow(), today = todayISO();
  return C.companionPick(m, today, {minDays: 14, maxDays: 35});
}
function lineFor(w){
  const inp = inputCur(), sug = C.suggest(inp, {weekStart: w.start, max: 2});
  const short = s => { s = String(s || "").replace(/\s+/g, " ").trim(); return s.length > 30 ? s.slice(0, 29).trimEnd() + "…" : s; };
  const W = modelNow().weeks.find(x => x.start === w.start), why = (W && W.headline) || "a lot of deadlines";
  const text = sug.moves.length ? `Week of ${fmtShort(w.start)} looks heavy: ${why}. Want to pull “${short(sug.moves[0].title)}” forward?` : `Week of ${fmtShort(w.start)} looks heavy: ${why}. Want to take a look?`;
  return {text, sug};
}
function quietNowClock(){
  try {
    const r = (state.settings && state.settings.reminders) || {};
    if (r.quiet === false) return false;
    const mins = x => { const [h, mm] = String(x).split(":").map(Number); return h * 60 + mm; };
    const a = mins(/^\d\d:\d\d$/.test(r.quietFrom) ? r.quietFrom : "22:00"), b = mins(/^\d\d:\d\d$/.test(r.quietTo) ? r.quietTo : "07:00"), d = new Date(), n = d.getHours() * 60 + d.getMinutes();
    return a === b ? false : a < b ? n >= a && n < b : n >= a || n < b;
  } catch (e) { return false; }
}
const DAY_MS = 864e5;
const SBCRUNCH = {
  cardHtml,
  openWeek,
  // The companion asks this about once every few minutes; null most of the time
  offer(){
    try {
      if (quietNowClock()) return null;
      const w = pickWeek(); if (!w) return null;
      const o = store.get(), c = o.comp || {};
      if (crunchQuiet() || dismissedWeek(w.start) || (c.weeks || {})[w.start]) return null;
      if (Date.now() - (c.last || 0) < 3 * DAY_MS) return null;
      if (c.day === todayISO()) return null;
      const L = lineFor(w);
      return {text: L.text, action: "crunch", week: w.start, yes: L.sug.moves.length ? "See Plan" : "See Week", local: true};
    } catch (e) { console.warn("crunch offer", e); return null; }
  },
  offered(ws){ const o = store.get(); o.comp = Object.assign({}, o.comp); o.comp.weeks = Object.assign({}, o.comp.weeks); o.comp.weeks[ws] = {at: Date.now()}; o.comp.last = Date.now(); o.comp.day = todayISO(); const ks = Object.keys(o.comp.weeks); if (ks.length > 30) ks.sort().slice(0, ks.length - 30).forEach(k => delete o.comp.weeks[k]); store.set(o); },
  dismiss(ws){ const o = store.get(); o.dis = Object.assign({}, o.dis); o.dis[ws] = Date.now(); o.comp = Object.assign({}, o.comp); o.comp.last = Date.now() + 2 * DAY_MS; store.set(o); },
  valid(ws){ try { const w = modelNow().weeks.find(x => x.start === ws); return !!w && !w.past && w.levelIdx >= 3; } catch (e) { return false; } },
  // For the Suggestions tray
  trayItem(){
    try {
      const m = modelNow(), today = todayISO();
      const w = (m.weeks || []).find(x => !x.past && x.levelIdx >= 4 && C.diff(today, x.start) >= 10 && C.diff(today, x.start) <= 42); if (!w) return null;
      const L = lineFor(w);
      return {id: "cr:" + w.start, kind: "crunch", tid: w.start, act: "cr-open", text: L.text.replace(/ Want to.*$/, "") + (L.sug.moves.length ? ` Pulling “${L.sug.moves[0].title.slice(0, 30)}” forward would help.` : ""), btn: "See the Week"};
    } catch (e) { return null; }
  },
  model: modelNow, input: inputCur, build: input => C.build(input)
};
window.SBCRUNCH = SBCRUNCH;

})();

