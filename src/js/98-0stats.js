/* ===== module: 98-0stats.js ===== */
/* Shared study stats for companions, the scrapbook and study rooms */
var SBSTATS = (() => {
  const days = () => (state.settings && state.settings.focusDays) || {};
  const sess = () => (state.settings && state.settings.focusSess) || {};
  const bump = (map, d, n) => { const cur = Object.assign({}, map); cur[d] = (Number(cur[d]) || 0) + n; const keys = Object.keys(cur).sort(); if (keys.length > 800) keys.slice(0, keys.length - 800).forEach(k => delete cur[k]); return cur; };
  const sum = (map, from, to) => { let n = 0; Object.entries(map).forEach(([d, m]) => { if ((!from || d >= from) && (!to || d <= to)) n += Number(m) || 0; }); return n; };
  function addFocus(minutes, source, session){
    const m = Math.round(Number(minutes) || 0); if (m <= 0) return;
    const d = todayISO(), patch = {focusDays: bump(days(), d, m)};
    if (session) patch.focusSess = bump(sess(), d, 1);
    state.settings = Object.assign({}, state.settings, patch);
    saveSettings();
    fire("stats-focus", {minutes: m, source: source || "timer", day: d});
  }
  // Minutes between two dates (YYYY-MM-DD, inclusive)
  const focusMinutes = (from, to) => sum(days(), from, to);
  // Finished focus timer sessions between two dates
  const focusSessions = (from, to) => sum(sess(), from, to);
  function totalFocusMinutes(){
    const logged = focusMinutes();
    const fromTasks = allTasks().reduce((s, t) => s + (Number(t.focusMin) || 0), 0);
    return Math.max(logged, fromTasks);
  }
  hook("focus", e => { if (e && e.type === "end" && e.mode === "focus" && e.minutes) addFocus(e.minutes, "timer", true); });
  return {addFocus, focusMinutes, focusSessions, totalFocusMinutes, focusDays: () => Object.assign({}, days())};
})();


