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
  // Each page's tips also tidy away once you've used that page on a few days (kept on this device)
  const PAGE_DAYS = 5, PAGE_LS = "studyboard:tipPages";
  const pages = () => { try { return JSON.parse(localStorage.getItem(PAGE_LS) || "{}") || {}; } catch (e) { return {}; } };
  function tickPage(tab){
    if (!tab) return;
    const m = pages(), d = todayISO(), p = m[tab] || {n: 0, last: ""};
    if (p.last === d) return;
    m[tab] = {n: Math.min(999, (Number(p.n) || 0) + 1), last: d};
    try { localStorage.setItem(PAGE_LS, JSON.stringify(m)); } catch (e) {}
  }
  const pageSeasoned = tab => mode() !== "always" && !!tab && (Number((pages()[tab] || {}).n) || 0) > PAGE_DAYS;
  const seasoned = () => mode() !== "always" && (Number(use().n) || 0) >= SEASON_DAYS;
  const apply = () => { const tab = typeof ui !== "undefined" ? ui.tab : ""; tickPage(tab); document.documentElement.classList.toggle("tips-off", seasoned() || pageSeasoned(tab)); };
  hook("boot", () => { tick(); apply(); });
  hook("render", apply);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) { tick(); apply(); } });
  hook("menu", () => {
    const n = Number(use().n) || 0, on = mode() === "always";
    const sub = on ? "Always showing how-to tips on each page." : n >= SEASON_DAYS ? "Hidden now that you know your way around. Turn on to see them again." : `Each page's tips show for the first ${PAGE_DAYS} days you use it (and at most your first ${SEASON_DAYS} days), then they tidy away.`;
    return `<div class="cap-row" data-group="appearance"><span style="flex:1;font-weight:600">Always Show Page Tips<span class="sub">${esc(sub)}</span></span><label class="anim-tog"><input type="checkbox" data-act="tips-set" ${on ? "checked" : ""}> On</label></div>`;
  });
  hook("act", (a, el) => {
    if (a !== "tips-set") return false;
    state.settings = Object.assign({}, state.settings, {tips: el.checked ? "always" : "auto"});
    saveSettings(); apply(); scheduleRender();
    return true;
  });
  window.SBTIPS = {seasoned, pageSeasoned, use: () => Object.assign({}, use()), days: SEASON_DAYS};
})();


