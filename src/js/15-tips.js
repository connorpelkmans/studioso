/* ===== module: 15-tips.js ===== */
/* Page tips: the "how to use this page" lines */
(() => {
  const SEASON_DAYS = 14;
  const use = () => (state.settings && state.settings.useDays) || {n: 0, last: ""};
  const mode = () => (state.settings && state.settings.tips) || "auto";
  function tick(){
    const d = todayISO(), u = use();
    if (u.last === d) return;
    state.settings = Object.assign({}, state.settings, {useDays: {n: Math.min(9999, (Number(u.n) || 0) + 1), last: d}});
    try { saveSettings(); } catch (e) {}
  }
  const seasoned = () => mode() !== "always" && (Number(use().n) || 0) >= SEASON_DAYS;
  const apply = () => document.documentElement.classList.toggle("tips-off", seasoned());
  hook("boot", () => { tick(); apply(); });
  hook("render", apply);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) { tick(); apply(); } });
  hook("menu", () => {
    const n = Number(use().n) || 0, on = mode() === "always";
    const sub = on ? "Always showing how-to tips on each page." : n >= SEASON_DAYS ? "Hidden now that you know your way around. Turn on to see them again." : `Showing for your first ${SEASON_DAYS} days (${Math.max(0, SEASON_DAYS - n)} to go), then they tidy away.`;
    return `<div class="cap-row" data-group="appearance"><span style="flex:1;font-weight:600">Always Show Page Tips<span class="sub">${esc(sub)}</span></span><label class="anim-tog"><input type="checkbox" data-act="tips-set" ${on ? "checked" : ""}> On</label></div>`;
  });
  hook("act", (a, el) => {
    if (a !== "tips-set") return false;
    state.settings = Object.assign({}, state.settings, {tips: el.checked ? "always" : "auto"});
    saveSettings(); apply(); scheduleRender();
    return true;
  });
  window.SBTIPS = {seasoned, use: () => Object.assign({}, use()), days: SEASON_DAYS};
})();


