/* ===== module: 99-heatmap.js ===== */
/* Study Heatmap (free): a year of days, coloured in 5 steps by how much the student studied each day, with the current and longest
   run of study days and the total this term. Shown in Insights (next to the Focus Garden) and, for one course, on its course page.
   Built only from history already kept on this device; nothing new is tracked:
   - focus minutes: SBSTATS (state.settings.focusDays, timer, rooms and logged time), Insights' focus log (state.settings.focusLog,
     which knows the course) and each task's time log (workLog, or its "Focus session: 25m" / "Logged time: 25m" history lines).
     The sources overlap, so a day takes the largest of them, never the sum.
   - cards reviewed: state.settings.fcDays (a count per day, or just the days) and each card's last review day (card.last).
   - tasks finished: task.doneAt (not tasks that were created already done).
   Study minutes = focus minutes + 1/2 minute per card reviewed + 10 minutes per task finished.
   A study day follows the Gentle Streak's rules (99-review-streaks.js): a task finished, 5+ focus minutes, a card reviewed or a
   checklist step. Runs follow its rest rules too: chosen weekdays off, marked rest days and up to 2 free rest days a week never
   break a run (they don't add to it either).
   The pure logic sits between the HM-START and HM-END markers so tests/heatmap.test.js can run it in Node under several time zones. */
var SBHEAT = (() => {
/*HM-START*/
const HM = (() => {
  const p2 = n => String(n).padStart(2, "0");
  const isDay = s => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
  const dn = s => Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10)) / 864e5;
  const fromDn = n => { const d = new Date(n * 864e5); return d.getUTCFullYear() + "-" + p2(d.getUTCMonth() + 1) + "-" + p2(d.getUTCDate()); };
  const add = (s, n) => fromDn(dn(s) + n);
  const diff = (a, b) => dn(b) - dn(a);
  const wday = s => new Date(dn(s) * 864e5).getUTCDay();
  const monday = s => add(s, -((wday(s) + 6) % 7));
  // the local calendar day of an instant (how the app stamps doneAt and history lines)
  const dayOf = ms => { const d = new Date(Number(ms)); return Number(ms) > 0 && isFinite(d.getTime()) ? d.getFullYear() + "-" + p2(d.getMonth() + 1) + "-" + p2(d.getDate()) : ""; };
  const CARD_MIN = 0.5, TASK_MIN = 10, FOCUS_MIN = 5, MAXBACK = 800;
  // the colour steps: none, under 30 minutes, 30 to 59, 1 to 2 hours, 2 hours or more
  const STEPS = [30, 60, 120];
  const TIME_RX = /^(Focus session|Logged time):? (\d+)m/;
  const CHK_RX = /^Checklist: (\d+)\/(\d+) → (\d+)\/(\d+)/;
  const bornDone = t => !!(t.created && t.doneAt && t.doneAt - t.created < 60000);
  const num = v => { const n = Number(v); return isFinite(n) && n > 0 ? n : 0; };

  // A task's time, day by day: its workLog, or for older tasks its history lines (as 01-next-up.js reads them)
  function workOf(t){
    if (Array.isArray(t.workLog)) return t.workLog.filter(e => e && num(e.m) && isDay(e.d)).map(e => ({d: e.d, m: num(e.m)}));
    return (Array.isArray(t.history) ? t.history : []).map(h => { const m = h && typeof h.text === "string" ? TIME_RX.exec(h.text) : null; return m && num(h.at) ? {d: dayOf(h.at), m: Number(m[2])} : null; }).filter(x => x && x.d && x.m > 0);
  }
  /* src: {today, from (optional), courseId (optional: that course only), tasks, focusDays {day: minutes}, focusLog [{d, m, c}],
     fcDays ({day: count} or [day]), cards [{last}], gentleLog {day: 1}}
     returns {day: {focus, cards, tasks, steps, min, study}} for days with anything in them */
  function series(src){
    src = src || {};
    const today = src.today, from = isDay(src.from) ? src.from : add(today, -MAXBACK), cid = src.courseId || "";
    const inR = d => isDay(d) && d >= from && d <= today;
    const sum = (map, d, n) => { if (inR(d) && n > 0) map[d] = (map[d] || 0) + n; };
    const fTask = {}, fLog = {}, fStats = {}, cDays = {}, cCards = {}, done = {}, steps = {}, marked = {};
    (src.tasks || []).forEach(t => {
      if (!t || typeof t !== "object" || (cid && t.courseId !== cid)) return;
      workOf(t).forEach(e => sum(fTask, e.d, e.m));
      if (t.status === "done" && num(t.doneAt) && !bornDone(t)) sum(done, dayOf(t.doneAt), 1);
      (Array.isArray(t.history) ? t.history : []).forEach(h => { const m = h && typeof h.text === "string" ? CHK_RX.exec(h.text) : null; if (m && Number(m[3]) > Number(m[1])) sum(steps, dayOf(h.at), 1); });
    });
    (Array.isArray(src.focusLog) ? src.focusLog : []).forEach(x => { if (x && (!cid || x.c === cid)) sum(fLog, x.d, num(x.m)); });
    if (!cid) {
      const fd = src.focusDays && typeof src.focusDays === "object" ? src.focusDays : {};
      Object.keys(fd).forEach(d => sum(fStats, d, num(fd[d])));
      // fcDays is a count per day (Insights) or a list of days (the review hero); either way a listed day had at least one card
      const fc = src.fcDays;
      if (Array.isArray(fc)) fc.forEach(d => { if (inR(d)) cDays[d] = Math.max(cDays[d] || 0, 1); });
      else if (fc && typeof fc === "object") Object.keys(fc).forEach(k => { if (isDay(k)) { if (inR(k)) cDays[k] = Math.max(cDays[k] || 0, num(fc[k]) || 1); } else if (inR(fc[k])) cDays[fc[k]] = Math.max(cDays[fc[k]] || 0, 1); });
      const gl = src.gentleLog && typeof src.gentleLog === "object" ? src.gentleLog : {};
      Object.keys(gl).forEach(d => { if (gl[d] && inR(d)) marked[d] = 1; });
    }
    (src.cards || []).forEach(c => { if (c && !c.draft) sum(cCards, c.last, 1); });
    const out = {}, days = new Set([fTask, fLog, fStats, cDays, cCards, done, steps, marked].flatMap(Object.keys));
    days.forEach(d => {
      const focus = Math.round(Math.max(fTask[d] || 0, fLog[d] || 0, fStats[d] || 0)), cards = Math.max(cDays[d] || 0, cCards[d] || 0), tasks = done[d] || 0, st = steps[d] || 0;
      const min = focus + cards * CARD_MIN + tasks * TASK_MIN;
      const study = focus >= FOCUS_MIN || cards > 0 || tasks > 0 || st > 0 || !!marked[d];
      if (min > 0 || study) out[d] = {focus, cards, tasks, steps: st, min: Math.round(min * 10) / 10, study};
    });
    return out;
  }
  const level = v => !v || !v.study ? 0 : v.min >= STEPS[2] ? 4 : v.min >= STEPS[1] ? 3 : v.min >= STEPS[0] ? 2 : 1;

  /* Runs of study days, with the Gentle Streak's rest rules: cfg {rpw (free rest days a week, default 2), wd (weekdays always off), rests {day: 1}} */
  const normCfg = c => {
    c = c && typeof c === "object" ? c : {};
    const r = c.rpw === "" || c.rpw == null ? 2 : Math.round(Number(c.rpw));
    const wd = Array.isArray(c.wd) ? [...new Set(c.wd.map(Number).filter(n => Number.isInteger(n) && n >= 0 && n <= 6))].slice(0, 6) : [];
    const rests = {}; if (c.rests && typeof c.rests === "object") Object.keys(c.rests).forEach(d => { if (isDay(d) && c.rests[d]) rests[d] = 1; });
    return {rpw: isFinite(r) ? Math.max(0, Math.min(2, r)) : 2, wd, rests};
  };
  function runs(S, today, cfg){
    cfg = normCfg(cfg);
    const keys = Object.keys(S || {}).filter(d => S[d] && S[d].study && d <= today).sort();
    const res = {current: 0, longest: 0, studyDays: keys.length};
    if (!keys.length) return res;
    let cur = 0; const used = {};
    for (let d = keys[0]; d <= today; d = add(d, 1)) {
      if (S[d] && S[d].study) { cur++; if (cur > res.longest) res.longest = cur; }
      else if (d === today || cfg.rests[d] || cfg.wd.indexOf(wday(d)) >= 0) continue;
      else { const w = monday(d); if ((used[w] || 0) < cfg.rpw) used[w] = (used[w] || 0) + 1; else cur = 0; }
    }
    res.current = cur;
    return res;
  }
  function total(S, from, to){
    let min = 0, days = 0;
    Object.keys(S || {}).forEach(d => { if (d >= from && d <= to) { min += S[d].min; if (S[d].study) days++; } });
    return {min: Math.round(min), days};
  }
  /* The grid: `weeks` columns ending with the week of today, each starting on firstDay (0 Sunday ... 6 Saturday) */
  function layout(today, weeks, firstDay){
    const fd = Number.isInteger(firstDay) && firstDay >= 0 && firstDay <= 6 ? firstDay : 1, n = Math.max(1, weeks | 0);
    const start = add(add(today, -((wday(today) - fd + 7) % 7)), -7 * (n - 1)), cols = [], months = [];
    for (let w = 0; w < n; w++) {
      const col = [];
      for (let r = 0; r < 7; r++) { const d = add(start, w * 7 + r); col.push({d, future: d > today, today: d === today}); }
      cols.push(col);
      // a month's label goes over the first week that has its 1st in it (or over the first week shown)
      const first = col.find(x => x.d.slice(8) === "01");
      if (first && !first.future) months.push({col: w, ym: first.d.slice(0, 7)});
      else if (w === 0) months.push({col: 0, ym: col[0].d.slice(0, 7)});
    }
    // the first label is dropped when the next one would crowd it
    if (months.length > 1 && months[0].col === 0 && months[1].col < 3) months.shift();
    return {start, end: today, cols, months, firstDay: fd, rows: [0, 1, 2, 3, 4, 5, 6].map(i => (fd + i) % 7)};
  }
  // The screen reader summary: one row a month, oldest first
  function months(S, from, to){
    const out = {};
    for (let d = from.slice(0, 7) + "-01"; d <= to; d = add(d, 32).slice(0, 7) + "-01") out[d.slice(0, 7)] = {ym: d.slice(0, 7), days: 0, min: 0, focus: 0, cards: 0, tasks: 0};
    Object.keys(S || {}).forEach(d => {
      if (d < from || d > to) return;
      const m = out[d.slice(0, 7)], v = S[d]; if (!m) return;
      if (v.study) m.days++; m.min += v.min; m.focus += v.focus; m.cards += v.cards; m.tasks += v.tasks;
    });
    return Object.values(out).map(m => Object.assign(m, {min: Math.round(m.min)}));
  }
  /* The locale's first day of the week (0 Sunday ... 6 Saturday), from Intl where it knows, else by region */
  const SUN = "US CA MX BR JP IL PH KR TW HK ZA IN PE CO VE GT HN SV NI PA DO PR SA ZW KE ET BZ AG BS BT KH LA MO MM NP PK BD TH UM VI WS YE".split(" ");
  const SAT = "AF BH DZ EG IQ IR JO KW LY OM QA SD SY".split(" ");
  function firstDayOf(loc){
    try {
      const L = new Intl.Locale(loc), wi = typeof L.getWeekInfo === "function" ? L.getWeekInfo() : L.weekInfo;
      if (wi && wi.firstDay >= 1 && wi.firstDay <= 7) return wi.firstDay % 7;
    } catch (e) {}
    const parts = String(loc || "").split(/[-_]/), region = (parts.slice(1).find(p => /^[A-Za-z]{2}$/.test(p)) || "").toUpperCase();
    if (!region) return /^(en|ja|zh|ko|he|pt|hi|th)$/i.test(parts[0]) ? 0 : parts[0].toLowerCase() === "ar" ? 6 : 1;
    return SUN.includes(region) ? 0 : SAT.includes(region) ? 6 : 1;
  }
  return {isDay, add, diff, wday, monday, dayOf, series, level, normCfg, runs, total, layout, months, firstDayOf, workOf, CARD_MIN, TASK_MIN, FOCUS_MIN, STEPS};
})();
/*HM-END*/

  /* ---------- From the planner ---------- */
  const S = () => state.settings || {};
  const firstDay = () => { try { return HM.firstDayOf((window.SBI18N && SBI18N.dates) || navigator.language || "en-US"); } catch (e) { return 1; } };
  function source(cid){
    let fd = {}; try { fd = typeof SBSTATS !== "undefined" ? SBSTATS.focusDays() : {}; } catch (e) {}
    const decks = Object.values(state.decks || {}).filter(d => d && (!cid || d.courseId === cid));
    return {today: todayISO(), courseId: cid || "", tasks: allTasks(), focusDays: fd, focusLog: S().focusLog, fcDays: S().fcDays,
      cards: decks.flatMap(d => Array.isArray(d.cards) ? d.cards : []), gentleLog: (S().gentle || {}).log};
  }
  let MEMO = {};
  function data(cid){
    const k = [state.updated || 0, todayISO(), cid || ""].join("|");
    if (MEMO[cid || ""] && MEMO[cid || ""].k === k) return MEMO[cid || ""].v;
    const v = HM.series(source(cid));
    MEMO[cid || ""] = {k, v};
    return v;
  }
  function term(){
    try { const r = SBPRO && SBPRO.termRange(); if (r && HM.isDay(r.from)) return r; } catch (e) {}
    const t = todayISO(), m = +t.slice(5, 7), y = t.slice(0, 4);
    return {from: m >= 9 ? `${y}-09-01` : m >= 5 ? `${y}-05-01` : `${y}-01-01`, to: t};
  }

  /* ---------- Words ---------- */
  const fmtN = n => (window.SBI18N ? SBI18N.fmtN(n) : String(n));
  const dt = (d, o) => { const x = parse(d); return window.SBI18N ? SBI18N.fmtD(x, o) : x.toLocaleDateString(undefined, o); };
  const hm = m => { m = Math.max(0, Math.round(Number(m) || 0)); const h = Math.floor(m / 60), r = m % 60; return h ? (r ? `${h}h ${r}m` : `${h}h`) : `${r}m`; };
  const pl = (n, one, many) => `${fmtN(n)} ${n === 1 ? one : many}`;
  const RANGE = ["No study", "Under 30 minutes", "30 to 59 minutes", "1 to 2 hours", "2 hours or more"];
  const FORMULA = "Study minutes = focus time + ½ minute per card reviewed + 10 minutes per task finished.";
  // What a day's square says (the tooltip, and what a screen reader hears)
  function dayText(d, v, today){
    const when = dt(d, {weekday: "short", month: "short", day: "numeric", year: d.slice(0, 4) === today.slice(0, 4) ? undefined : "numeric"}) + (d === today ? " (today)" : "");
    if (!v) return {when, main: d === today ? "Nothing yet today" : "No study", parts: ""};
    const parts = [];
    if (v.focus) parts.push(`${hm(v.focus)} focus`);
    if (v.cards) parts.push(`${pl(v.cards, "card", "cards")} (${hm(v.cards * HM.CARD_MIN)})`);
    if (v.tasks) parts.push(`${pl(v.tasks, "task", "tasks")} done (${hm(v.tasks * HM.TASK_MIN)})`);
    if (!parts.length && v.steps) parts.push(pl(v.steps, "checklist step", "checklist steps"));
    if (!parts.length && v.study) parts.push("a study day");
    const main = v.study ? (v.min >= 1 ? `${hm(v.min)} of study` : "A study day") : `${hm(v.min)} of focus, under the 5 minutes a study day needs`;
    return {when, main, parts: v.study ? parts.join(" + ") : ""};
  }

  /* ---------- Drawing ---------- */
  const WD_ABBR = i => dt(HM.add("2023-01-01", i), {weekday: "short"});  // 2023-01-01 was a Sunday
  function gridHtml(V, key, weeks, label){
    const today = todayISO(), L = HM.layout(today, weeks, firstDay());
    const cells = [], rows = L.rows;
    L.cols.forEach((col, c) => col.forEach((x, r) => {
      if (x.future) return;
      const v = V[x.d], lv = HM.level(v);
      cells.push(`<span class="hm-c${x.today ? " hm-today" : ""}" data-l="${lv}" data-d="${x.d}"${v ? ` data-v="${v.focus},${v.cards},${v.tasks},${v.steps},${v.min},${v.study ? 1 : 0}"` : ""} style="grid-column:${c + 2};grid-row:${r + 2}"></span>`);
    }));
    const mon = L.months.map(m => `<span class="hm-m" style="grid-column:${m.col + 2} / span 4">${esc(dt(m.ym + "-15", {month: "short"}))}</span>`).join("");
    // every row gets a label cell (text on every other one) so the sticky column hides the days scrolled under it
    const wds = `<span class="hm-wd hm-corner" style="grid-row:1"></span>` + rows.map((wd, r) => `<span class="hm-wd" style="grid-row:${r + 2}">${r % 2 ? esc(WD_ABBR(wd)) : ""}</span>`).join("");
    const first = L.cols[0][0].d;
    return `<div class="hm-scroll"><div class="hm-grid" id="hm-${esc(key)}" data-hm="${esc(key)}" tabindex="0" role="application" aria-roledescription="heatmap"
      aria-label="${esc(`${label}, ${dt(first, {month: "long", year: "numeric"})} to today. Use the arrow keys to move between days.`)}" style="--hm-cols:${weeks}">${mon}${wds}${cells.join("")}</div></div>`;
  }
  const legendHtml = () => `<div class="hm-legend" aria-hidden="true"><span>Less</span>${[0, 1, 2, 3, 4].map(l => `<i class="hm-c" data-l="${l}" title="${esc(RANGE[l])}"></i>`).join("")}<span>More</span></div>`;
  function tableHtml(V, from, to, caption){
    const rows = HM.months(V, from, to);
    return `<table class="sr"><caption>${esc(caption)}</caption><thead><tr><th scope="col">Month</th><th scope="col">Study days</th><th scope="col">Study time</th><th scope="col">Focus</th><th scope="col">Cards reviewed</th><th scope="col">Tasks finished</th></tr></thead><tbody>${rows.map(m => `<tr><th scope="row">${esc(dt(m.ym + "-15", {month: "long", year: "numeric"}))}</th><td>${fmtN(m.days)}</td><td>${esc(hm(m.min))}</td><td>${esc(hm(m.focus))}</td><td>${fmtN(m.cards)}</td><td>${fmtN(m.tasks)}</td></tr>`).join("")}</tbody></table>`;
  }
  const hasAny = V => Object.keys(V).some(d => V[d].study);
  const tipHtml = () => `<div class="hm-tip" aria-hidden="true" hidden></div><p class="sr hm-live" role="status" aria-live="polite"></p>`;

  // Insights: the whole year, with runs and the term total (free, no Pro badge)
  function insightsHtml(){
    let V; try { V = data(""); } catch (e) { console.warn("heatmap", e); return ""; }
    if (!hasAny(V)) return "";
    const today = todayISO(), R = HM.runs(V, today, S().gentle), T = term(), tot = HM.total(V, T.from, T.to), cfg = HM.normCfg(S().gentle);
    const stat = (big, small) => `<div class="hm-stat"><b>${esc(big)}</b><span>${esc(small)}</span></div>`;
    const rest = cfg.rpw ? ` Rest days (up to ${cfg.rpw} a week) don't break a run.` : "";
    return `<section class="pro-card hm-card" aria-labelledby="hm-h-all"><div class="hm-head"><h3 id="hm-h-all">Study Heatmap</h3><span class="hm-sum">${esc(`${pl(HM.total(V, HM.add(today, -364), today).days, "study day", "study days")} in the last year · ${fmtN(tot.days)} this term`)}</span></div>
      <div class="hm-stats">${stat(pl(R.current, "day", "days"), "Current run")}${stat(pl(R.longest, "day", "days"), "Longest run")}${stat(hm(tot.min), "This term")}</div>
      <div class="hm-wrap">${gridHtml(V, "all", 53, "Study heatmap")}${tipHtml()}</div>
      <div class="hm-foot">${legendHtml()}<span class="hm-steps mini" aria-hidden="true">Steps: none · under 30 min · 30 min+ · 1 h+ · 2 h+</span></div>
      <p class="mini hm-how">${esc(FORMULA + rest)}</p>
      ${tableHtml(V, HM.add(today, -364), today, "Study by month, the last 12 months")}</section>`;
  }
  // A course page: that course only, the last 6 months; nothing at all until the course has some study
  function courseHtml(c){
    if (!c || !c.id) return "";
    let V; try { V = data(c.id); } catch (e) { console.warn("heatmap", e); return ""; }
    if (!hasAny(V)) return "";
    const today = todayISO(), from = HM.add(today, -181), tot = HM.total(V, from, today), R = HM.runs(V, today, S().gentle);
    const title = `<h2 class="sec c2-bh">${typeof c2Ic === "function" ? c2Ic('<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>') : ""}<span class="t">Study Days</span><span class="n">${esc(hm(tot.min))}</span></h2>`;
    return `<section class="c2-card2 c2-box hm-card hm-course">${title}
      <p class="mini hm-line">${esc(`${pl(tot.days, "study day", "study days")} in the last 6 months${R.current >= 2 ? ` · ${fmtN(R.current)} in a row` : ""}.`)}</p>
      <div class="hm-wrap">${gridHtml(V, "c-" + c.id, 26, `${courseLabel(c)} study heatmap`)}${tipHtml()}</div>
      <div class="hm-foot">${legendHtml()}</div>
      <p class="mini hm-how">${esc(FORMULA)}</p>
      ${tableHtml(V, from, today, `${courseLabel(c)}: study by month, the last 6 months`)}</section>`;
  }

  /* ---------- The tooltip and the keyboard ---------- */
  const SEL = {};  // the chosen day for each grid, so a redraw keeps it
  const cellOf = (g, d) => g.querySelector(`.hm-c[data-d="${d}"]`);
  function valOf(cell){
    const a = (cell.dataset.v || "").split(",").map(Number);
    return cell.dataset.v ? {focus: a[0], cards: a[1], tasks: a[2], steps: a[3], min: a[4], study: !!a[5]} : null;
  }
  function show(g, cell, announce){
    if (!g || !cell) return;
    const wrap = g.closest(".hm-wrap"), tip = wrap && wrap.querySelector(".hm-tip"), live = wrap && wrap.querySelector(".hm-live"); if (!tip) return;
    g.querySelectorAll(".hm-on").forEach(x => x.classList.remove("hm-on"));
    cell.classList.add("hm-on"); SEL[g.dataset.hm] = cell.dataset.d;
    const t = dayText(cell.dataset.d, valOf(cell), todayISO());
    tip.innerHTML = `<b>${esc(t.when)}</b><span>${esc(t.main)}</span>${t.parts ? `<span class="hm-parts">${esc(t.parts)}</span>` : ""}`;
    tip.hidden = false;
    // keep the day in view inside its own scroller (never the page)
    const sc = g.parentElement, cr = cell.getBoundingClientRect(), sr = sc.getBoundingClientRect();
    if (cr.left < sr.left + 28) sc.scrollLeft -= sr.left + 28 - cr.left; else if (cr.right > sr.right - 4) sc.scrollLeft += cr.right - sr.right + 4;
    // measured at the left edge, where it has the whole width, so moving it doesn't rewrap it
    tip.style.left = "0px"; tip.style.top = "0px";
    const wr = wrap.getBoundingClientRect(), c2 = cell.getBoundingClientRect(), tw = tip.offsetWidth, th = tip.offsetHeight;
    const x = Math.max(0, Math.min(wr.width - tw, c2.left - wr.left + c2.width / 2 - tw / 2));
    // above the day (it may cover the card's stats), else below it
    const card = wrap.closest(".hm-card") || wrap, top = card.getBoundingClientRect().top - wr.top + 4;
    let y = c2.top - wr.top - th - 6; if (y < top) y = c2.bottom - wr.top + 6;
    tip.style.left = x + "px"; tip.style.top = y + "px";
    if (announce && live) live.textContent = [t.when, t.main, t.parts].filter(Boolean).join(". ");
  }
  function hide(g){
    const wrap = g && g.closest(".hm-wrap"), tip = wrap && wrap.querySelector(".hm-tip");
    if (tip) tip.hidden = true;
    if (g) g.querySelectorAll(".hm-on").forEach(x => x.classList.remove("hm-on"));
  }
  document.addEventListener("keydown", e => {
    const g = e.target && e.target.classList && e.target.classList.contains("hm-grid") ? e.target : null; if (!g) return;
    const today = todayISO(), cur = SEL[g.dataset.hm] && cellOf(g, SEL[g.dataset.hm]) ? SEL[g.dataset.hm] : today;
    const first = (g.querySelector(".hm-c") || {dataset: {}}).dataset.d;
    const step = {ArrowLeft: -7, ArrowRight: 7, ArrowUp: -1, ArrowDown: 1}[e.key];
    let next = null;
    if (step) next = HM.add(cur, step);
    else if (e.key === "Home") next = e.ctrlKey ? first : HM.add(cur, -((HM.wday(cur) - firstDay() + 7) % 7));
    else if (e.key === "End") next = e.ctrlKey ? today : (d => d > today ? today : d)(HM.add(cur, 6 - ((HM.wday(cur) - firstDay() + 7) % 7)));
    else if (e.key === "PageUp") next = HM.add(cur, -28);
    else if (e.key === "PageDown") next = HM.add(cur, 28);
    else if (e.key === "Escape") { if (!g.closest(".hm-wrap").querySelector(".hm-tip").hidden) { hide(g); e.preventDefault(); e.stopPropagation(); } return; }
    else return;
    e.preventDefault();
    if (next > today) next = today;
    if (first && next < first) next = first;
    show(g, cellOf(g, next), true);
  }, true);
  document.addEventListener("focusin", e => {
    const g = e.target && e.target.classList && e.target.classList.contains("hm-grid") ? e.target : null; if (!g) return;
    const d = SEL[g.dataset.hm], cell = (d && cellOf(g, d)) || cellOf(g, todayISO()) || g.querySelector(".hm-c:last-of-type");
    show(g, cell, true);
  });
  document.addEventListener("focusout", e => { const g = e.target && e.target.classList && e.target.classList.contains("hm-grid") ? e.target : null; if (g && !g.contains(e.relatedTarget)) hide(g); });
  document.addEventListener("pointerover", e => {
    if (e.pointerType !== "mouse") return;
    const cell = e.target && e.target.closest && e.target.closest(".hm-grid .hm-c"); if (!cell) return;
    show(cell.closest(".hm-grid"), cell, false);
  });
  document.addEventListener("pointerout", e => {
    if (e.pointerType !== "mouse") return;
    const g = e.target && e.target.closest && e.target.closest(".hm-grid"); if (!g || g.contains(e.relatedTarget) || document.activeElement === g) return;
    hide(g);
  });
  // a tap (or click) picks the day and keeps its tooltip up
  document.addEventListener("click", e => {
    const cell = e.target && e.target.closest && e.target.closest(".hm-grid .hm-c"); if (!cell) return;
    const g = cell.closest(".hm-grid");
    SEL[g.dataset.hm] = cell.dataset.d;
    if (document.activeElement !== g) { try { g.focus({preventScroll: true}); } catch (err) { g.focus(); } }
    show(g, cell, true);
  });
  // Each grid starts scrolled to today (the right end), inside its card
  function mount(root){
    (root || document).querySelectorAll(".hm-scroll:not([data-on])").forEach(sc => { sc.dataset.on = "1"; sc.scrollLeft = sc.scrollWidth; });
  }
  hook("render", () => { try { mount(document.getElementById("view")); } catch (e) {} });
  window.addEventListener("resize", () => { document.querySelectorAll(".hm-tip:not([hidden])").forEach(t => { t.hidden = true; }); });

  return {HM, insightsHtml, courseHtml, mount, data, dayText};
})();
