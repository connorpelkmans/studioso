/* ===== module: 98-0stats.js ===== */
/* Shared study stats for companions, the scrapbook and study rooms.
   Focus minutes are kept per day in state.settings.focusDays ({"2026-09-29": 50}), so every device agrees.
   Declared at top level (no wrapper) so later modules can use SBSTATS. */
var SBSTATS = (() => {
  const days = () => (state.settings && state.settings.focusDays) || {};
  function addFocus(minutes, source){
    const m = Math.round(Number(minutes) || 0); if (m <= 0) return;
    const d = todayISO(), cur = Object.assign({}, days());
    cur[d] = (Number(cur[d]) || 0) + m;
    // keep about two years
    const keys = Object.keys(cur).sort(); if (keys.length > 800) keys.slice(0, keys.length - 800).forEach(k => delete cur[k]);
    state.settings = Object.assign({}, state.settings, {focusDays: cur});
    saveSettings();
    fire("stats-focus", {minutes: m, source: source || "timer", day: d});
  }
  // Minutes between two dates (YYYY-MM-DD, inclusive). Days before this log existed fall back to the tasks' own focus minutes.
  function focusMinutes(from, to){
    let n = 0; Object.entries(days()).forEach(([d, m]) => { if ((!from || d >= from) && (!to || d <= to)) n += Number(m) || 0; });
    return n;
  }
  function totalFocusMinutes(){
    const logged = focusMinutes();
    const fromTasks = allTasks().reduce((s, t) => s + (Number(t.focusMin) || 0), 0);
    return Math.max(logged, fromTasks);
  }
  hook("focus", e => { if (e && e.type === "end" && e.mode === "focus" && e.minutes) addFocus(e.minutes, "timer"); });
  return {addFocus, focusMinutes, totalFocusMinutes, focusDays: () => Object.assign({}, days())};
})();


