/* ===== module: 92-cushion.js ===== */
/* Time Cushion: one number for "ahead or behind". Today's Plan already works out, for every deadline, the study time you have
   until then (A, scaled by planning accuracy) and all the work due by then (L). The cushion is A - L at the tightest deadline
   in the next 14 days. A pill next to Time Today shows it; tapping it opens a sheet with every deadline and a fix or two. */
var SBCUSH = (() => {
/*CUSH-START*/
const CUSH = (() => {
  // Colours: green when everything fits, yellow when short by up to an hour, red when more than an hour short.
  // The hour is judged on the rounded figure the pill shows, so "1h short" is always yellow and "1h 15m short" red.
  const WINDOW = 14, TIGHT = 60;
  // to the nearest 5 minutes, so "have - need" always equals the cushion shown
  const m5 = h => Math.round((Number(h) || 0) * 12) * 5;
  /* o.rows: [{id, title, due, dl, R, L, A, noEst}] in due order: R work left on it, L all work due up to and including it,
     A study time until it is due (hours). o.overdue: hours of late work still to do (already inside L).
     o.roomToday: hours more Time Today would really add. o.offDays: [{date, i, h}] days off in the next two weeks.
     Returns {state: spare (fits) | tight (up to 1h short) | short (over 1h short) | none, mins, by, dl, groups, tight, noEst, overdueM, fixes} */
  function calc(o){
    o = o || {};
    const rows = (o.rows || []).filter(r => r && r.dl >= 0 && r.dl <= WINDOW && r.R > 0);
    const res = {state: "none", mins: 0, by: "", dl: -1, groups: [], tight: -1, noEst: 0, overdueM: m5(o.overdue), fixes: []};
    if (!rows.length) return res;
    const byDay = {};
    rows.forEach(r => {
      const needM = m5(r.L), haveM = m5(r.A), c = haveM - needM;
      let g = byDay[r.due];
      if (!g) { g = byDay[r.due] = {due: r.due, dl: r.dl, ids: [], titles: [], needM, haveM, mins: c, big: null}; res.groups.push(g); }
      g.ids.push(r.id); g.titles.push(r.title || "");
      // the day's figure is its tightest due time (the last thing due that day, or an early due time)
      if (c < g.mins) { g.needM = needM; g.haveM = haveM; g.mins = c; }
      if (r.R >= 2 && (!g.big || r.R > g.big.R)) g.big = {id: r.id, title: r.title || "", R: r.R};
      if (r.noEst) res.noEst++;
    });
    res.groups.sort((a, b) => a.dl - b.dl || (a.due < b.due ? -1 : 1));
    res.groups.forEach((g, i) => { if (res.tight < 0 || g.mins < res.groups[res.tight].mins) res.tight = i; });
    const T = res.groups[res.tight];
    res.mins = T.mins; res.by = T.due; res.dl = T.dl;
    const over = -T.mins, shown = over < 30 ? Math.round(over / 5) * 5 : Math.round(over / 15) * 15;
    res.state = T.mins >= 0 ? "spare" : shown > TIGHT ? "short" : "tight";
    if (res.state === "spare") return res;
    // Fixes: more time before the tightest deadline (today first, else a day off before it), then starting big work earlier
    const gap = -T.mins, want = Math.max(30, Math.ceil(gap / 30) * 30);
    const room = Math.floor(Math.max(0, Number(o.roomToday) || 0) * 60 / 30) * 30;
    if (room >= 30) res.fixes.push({kind: "today", mins: Math.min(want, room), all: room >= want});
    const off = (o.offDays || []).filter(d => d && d.i >= 0 && d.i < T.dl && d.h > 0).sort((a, b) => a.i - b.i)[0];
    if (off) res.fixes.push({kind: "dayoff", date: off.date, mins: m5(off.h)});
    let big = null; res.groups.slice(0, res.tight + 1).forEach(g => { if (g.big && (!big || g.big.R > big.R)) big = Object.assign({due: g.due}, g.big); });
    if (big && res.fixes.length < 2) res.fixes.push({kind: "earlier", id: big.id, title: big.title, due: big.due, mins: m5(big.R)});
    return res;
  }
  return {calc, m5, WINDOW, TIGHT};
})();
/*CUSH-END*/

/* From Today's Plan's own numbers (computeFocusNow calls this) */
function fromPlan(p){
  const rows = []; let overdue = 0;
  (p.byDue || []).forEach(t => {
    const x = p.info[t.id]; if (!x || x.dead) return;
    if (x.past) { overdue += x.R || 0; return; }
    if (x.dl > CUSH.WINDOW) return;
    const own = !!state.tasks[t.id];
    rows.push({id: t.id, title: t.title || "", due: t.due, dl: x.dl, R: x.R, L: x.L, A: x.A, noEst: own && !!(window.SBEST && SBEST.needs(t))});
  });
  const today = p.today, offToday = dayIsOff(today);
  // the free time left today around classes, shifts and events (also when Availability isn't set up: the strip shows the same)
  const avTot = p.av && p.av.res && isNum(p.av.res.total) ? (p.av.res.total || 0) / 60 : Infinity;
  const roomToday = offToday ? 0 : Math.max(0, Math.min(p.leftH, avTot, 16 - p.doneToday) - p.th);
  const offDays = [];
  for (let i = 0; i <= CUSH.WINDOW; i++) { const d = addDays(today, i); if (dayIsOff(d)) offDays.push({date: d, i, h: p.dh}); }
  const r = CUSH.calc({rows, overdue, roomToday, offDays});
  r.offToday = offToday;
  return r;
}

/* Words */
// to 5 minutes under half an hour, else to 15 minutes like the rest of Today's Plan (so it reads the same as Heads Up)
const fm = m => { const a = Math.abs(Number(m) || 0); return fmtMins(a < 30 ? Math.round(a / 5) * 5 : Math.round(a / 15) * 15) || "0m"; };
const byWord = (d, dl) => dl === 0 ? tr("cush.byToday", "today") : dl === 1 ? tr("cush.byTomorrow", "by tomorrow") : dl < 7 ? tr("cush.byDay", "by {day}", {day: parse(d).toLocaleDateString(undefined, {weekday: "short"})}) : tr("cush.byDay", "by {day}", {day: fmtShort(d)});
function pillText(c){
  if (c.state === "spare") return Math.round(c.mins) >= 5 ? tr("cush.spare", "{time} to spare", {time: fm(c.mins)}) : tr("cush.fits", "Just fits {by}", {by: byWord(c.by, c.dl)});
  // yellow and red both say how far short; a few minutes short still reads as at least 5m
  return tr("cush.short", "{time} short {by}", {time: fm(Math.min(c.mins, -5)), by: byWord(c.by, c.dl)});
}
const dayIn = (d, dl) => dl === 0 ? tr("cush.inToday", "the end of today") : dl === 1 ? tr("cush.inTomorrow", "tomorrow") : fmtDate(d);
const dayName = (d, dl) => dl === 0 ? tr("cush.today", "Today") : dl === 1 ? tr("cush.tomorrow", "Tomorrow") : fmtDate(d);
const rowCush = m => m < 0 ? tr("cush.rowShort", "{time} short", {time: fm(m)}) : tr("cush.rowSpare", "{time} spare", {time: fm(m)});
const ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3h12M6 21h12M7 3c0 3.2 1.2 5.3 2.9 6.8.9.8 1.5 1.4 1.5 2.2s-.6 1.4-1.5 2.2C8.2 15.7 7 17.8 7 21M17 3c0 3.2-1.2 5.3-2.9 6.8-.9.8-1.5 1.4-1.5 2.2s.6 1.4 1.5 2.2c1.7 1.5 2.9 3.6 2.9 6.8"/></svg>';
const COLOR = {spare: "#1E9E74", tight: "#D9A21B", short: "#D3352A"};

const cur = () => { try { const F = computeFocus(); return F && F.cushion; } catch (e) { return null; } };
function pillHtml(c){
  return `<button type="button" class="cush-pill cush-${c.state}" data-act="cush-open" aria-haspopup="dialog" aria-label="${esc(tr("cush.aria", "Time cushion: {what}. Show details", {what: pillText(c)}))}"><i class="cush-dot" aria-hidden="true"></i><span>${esc(pillText(c))}</span></button>`;
}
// Next to each Time Today control on the page (the plan's header, the bar above it, the Planned Today tile)
hook("render", tab => {
  if (tab !== "board") return;
  document.querySelectorAll(".cush-pill").forEach(e => e.remove());
  const c = cur(); if (!c || c.state === "none" || c.offToday) return;
  const html = pillHtml(c);
  document.querySelectorAll(".bv-hours > .hours-ctl").forEach(h => h.insertAdjacentHTML("beforebegin", html));
  // on a phone it goes in the Time Today row, or on its own line under it when the row has no room for it
  document.querySelectorAll(".plan .fh-ctl > .hours-ctl").forEach(h => {
    const lb = h.querySelector(".mini"); if (!lb) return;
    lb.insertAdjacentHTML("afterend", html);
    const p = lb.nextElementSibling;
    if (!h.offsetWidth) return;
    const g = document.createRange(); g.selectNodeContents(lb);
    const btn = h.querySelector('[data-act="today-h"]'), pr = p.getBoundingClientRect();
    if (h.scrollWidth > h.clientWidth + 1 || g.getClientRects().length > 1 || (btn && pr.right > btn.getBoundingClientRect().left + 1) || pr.height > 34) { p.classList.add("cush-below"); h.after(p); }
  });
  document.querySelectorAll(".plan .pt-hours").forEach(h => h.insertAdjacentHTML("beforeend", html));
});

/* The sheet */
function body(c){
  const T = c.groups[c.tight], when = dayIn(T.due, T.dl);
  const big = c.state === "spare" ? tr("cush.sumSpare", "to spare at your tightest point, {day}", {day: when})
    : tr("cush.sumShort", "short for what's due by {day}", {day: when});
  const rows = c.groups.map((g, i) => {
    const what = g.titles.length > 1 ? tr("cush.andMore", "{title} and {n} more", {title: g.titles[0], n: g.titles.length - 1}) : g.titles[0];
    const tight = i === c.tight;
    return `<li class="cush-row${tight ? " is-tight cush-" + c.state : ""}${g.mins < 0 ? " is-short" : ""}"><div class="cush-when"><b>${esc(dayName(g.due, g.dl))}${tight ? ` <span class="cush-tag">${esc(tr("cush.tightest", "Tightest"))}</span>` : ""}</b><span class="mini">${esc(what)}</span></div>
      <dl class="cush-nums"><div><dt>${esc(tr("cush.work", "Work due"))}</dt><dd>${esc(fm(g.needM))}</dd></div><div><dt>${esc(tr("cush.time", "Study time"))}</dt><dd>${esc(fm(g.haveM))}</dd></div><div class="cush-c"><dt>${esc(tr("cush.cushion", "Cushion"))}</dt><dd>${esc(rowCush(g.mins))}</dd></div></dl></li>`;
  }).join("");
  const fixes = c.fixes.map(f => {
    if (f.kind === "today") return `<li><span>${esc(f.all ? tr("cush.fixToday", "{time} more study time today covers it.", {time: fm(f.mins)}) : tr("cush.fixTodaySome", "Today has room for {time} more study time, which covers part of it.", {time: fm(f.mins)}))}</span><button type="button" class="btn small primary" data-act="cush-add" data-id="${f.mins}">${esc(tr("cush.add", "Add {time} Today", {time: fm(f.mins)}))}</button></li>`;
    if (f.kind === "dayoff") return `<li><span>${esc(tr("cush.fixOff", "{day} is a day off. Studying then adds about {time}.", {day: fmtDate(f.date), time: fm(f.mins)}))}</span><button type="button" class="btn small" data-act="cush-off" data-id="${esc(f.date)}">${esc(tr("cush.study", "Study {day}", {day: parse(f.date).toLocaleDateString(undefined, {weekday: "long"})}))}</button></li>`;
    if (f.kind === "earlier") return `<li><span>${esc(tr("cush.fixEarlier", "“{title}” is about {time} of work. Starting big work earlier spreads it over more days.", {title: f.title, time: fm(f.mins)}))}</span><button type="button" class="btn small" data-act="cush-earlier" data-id="${esc(f.due)}">${esc(tr("cush.earlier", "Start Earlier"))}</button></li>`;
    return "";
  }).join("");
  const notes = [];
  if (c.noEst) notes.push(`<p class="cush-note">${esc(trn("cush.noEst", c.noEst, "{n} task has no time estimate, so a typical time is counted for it.|{n} tasks have no time estimate, so a typical time is counted for them."))} <button type="button" class="link-btn" data-act="est-open">${esc(tr("cush.checkEst", "Check Estimates"))}</button></p>`);
  if (c.overdueM >= 5) notes.push(`<p class="cush-note">${esc(tr("cush.overdue", "Includes {time} of overdue work.", {time: fm(c.overdueM)}))}</p>`);
  // planning accuracy: the study time and the work are both scaled by how long your work really takes, once there's history
  const A = accOf(), on = !!(A && A.on && A.on()), g = on && A.global ? A.global() : null, learnt = on && (A.capScale() !== 1 || !!(g && g.level && g.level !== "none"));
  const acc = learnt ? tr("cush.acc", "Based on how long your work really takes.") : on ? tr("cush.accSoon", "It gets more exact as you time your work.") : "";
  return `<div class="cush-sum cush-${c.state}"><b>${esc(fm(c.mins))}</b><span>${esc(big)}</span></div>
    <p class="mini cush-lede">${esc(tr("cush.lede", "Each deadline in the next 2 weeks, with all the work due by then and the study time you have until then."))}${acc ? " " + esc(acc) : ""}</p>
    ${fixes ? `<div class="cush-fix"><h3>${esc(tr("cush.fixH", "Ways to Make Room"))}</h3><ul>${fixes}</ul></div>` : ""}
    <ol class="cush-list" aria-label="${esc(tr("cush.listLbl", "Deadlines in the next 2 weeks"))}">${rows}</ol>
    ${notes.join("")}`;
}
function open(){
  const c = cur(); if (!c || c.state === "none") return;
  openSheet(`<div class="sheet cush-sheet">${bandHead(tr("cush.title", "Time Cushion"), ICON, COLOR[c.state], esc(tr("cush.sub", "Ahead or behind, over the next 2 weeks")))}<div class="sheet-body cush-body">${body(c)}</div>
    <div class="sheet-foot"><span class="spacer"></span><button type="button" class="btn primary" data-act="close">${esc(tr("cush.done", "Done"))}</button></div></div>`);
}
// after a fix: the plan is worked out again, and the open sheet shows the new numbers
function redraw(){
  render();
  if (!dlg.open || !dlg.querySelector(".cush-sheet")) return;
  const c = cur();
  if (!c || c.state === "none") { dlg.close(); return; }
  open();
}
hook("act", (a, el) => {
  if (!a || a.slice(0, 5) !== "cush-") return false;
  const id = el && el.dataset ? el.dataset.id : "";
  if (a === "cush-open") open();
  else if (a === "cush-add") {
    const prev = todayHours(), add = Math.max(0, Number(id) || 0) / 60;
    setTodayHours(Math.min(16, prev + add)); focusStale(); redraw();
    toast(tr("cush.added", "Added {time} to Time Today", {time: fm(add * 60)}), () => { setTodayHours(prev); focusStale(); redraw(); });
  }
  else if (a === "cush-off") {
    const was = Object.assign({}, (state.settings && state.settings.daysOff) || {}), cur2 = Object.assign({}, was); delete cur2[id];
    const set = v => { state.settings = Object.assign({}, state.settings, {daysOff: v}); saveSettings(); focusStale(); redraw(); };
    set(cur2);
    toast(tr("cush.studyDay", "{day} is a study day again", {day: fmtDate(id)}), () => set(was));
  }
  else if (a === "cush-earlier") {
    if (dlg.open) dlg.close();
    const ws = addDays(id, -((parse(id).getDay() + 6) % 7));
    setTimeout(() => { try { if (!(window.SBCRUNCH && SBCRUNCH.openWeek(ws, {focus: true, stay: true}))) toast(tr("cush.noCrunch", "Nothing can usefully move earlier right now")); } catch (e) { console.warn(e); } }, 30);
  }
  return true;
});

return {calc: CUSH.calc, fromPlan, pillText, open, now: cur};
})();
window.SBCUSH = SBCUSH;
