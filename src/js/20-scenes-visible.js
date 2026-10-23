/* ===== module: 20-scenes-visible.js ===== */
/* Which themes show in the app */
const HIDDEN_THEMES = [
  "france", "thailand", "venice",
  "balloons", "rain", "alpine", "dunes", "rooftops",
  "business", "psych", "comms", "civics", "writing", "concert", "track", "math", "observatory", "ruins", "valley",
  "cats", "knitting", "painting", "gardening",
  "onsen", "tidepool", "savanna", "pride", "graduation", "birthday", "mushrooms", "sunflowers", "ramen"
];
const THEME_REGROUP = {
  volcano: "newscenes", rainforest: "newscenes", geology: "newscenes", nighttrain: "newscenes", campfire: "newscenes",
  greenhouse: "newscenes", marinebio: "newscenes", aquarium: "newscenes",
  pottery: "hobby", film: "hobby", culinary: "hobby",
  diadelosmuertos: "holiday", holi: "holiday", ramadan: "holiday", midautumn: "holiday", xmas: "holiday"
};
(() => {
  Object.entries(THEME_REGROUP).forEach(([id, g]) => { const s = SKINS.find(x => x.id === id); if (s) s.group = g; });
  const KEY = "studyboard:theme-access", hidden = new Set(HIDDEN_THEMES), stash = [];
  const order = new Map(SKINS.map((s, i) => [s.id, i]));
  let all = false, uid = null, checkedAt = 0, fake = null;
  const client = () => fake ? fake.sb : sb, user = () => fake ? fake.user : sbUser;
  function show(on){
    all = !!on;
    if (all) {
      stash.splice(0).forEach(s => { if (!SKINS.some(x => x.id === s.id)) SKINS.push(s); });
      const rank = (s, i) => order.has(s.id) ? order.get(s.id) : 1e6 + i, ranked = SKINS.map((s, i) => [rank(s, i), s]).sort((a, b) => a[0] - b[0]);
      ranked.forEach(([, s], i) => { SKINS[i] = s; });
    } else {
      for (let i = SKINS.length - 1; i >= 0; i--) if (hidden.has(SKINS[i].id)) stash.unshift(SKINS.splice(i, 1)[0]);
    }
  }
  const saved = () => { try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) { return null; } };
  const save = v => { try { if (v) localStorage.setItem(KEY, JSON.stringify(v)); else localStorage.removeItem(KEY); } catch (e) {} };
  show(!!(saved() && saved().on));
  function changed(on){
    if (on === all) return;
    show(on);
    try { applySkin(); } catch (e) {}
    try { scheduleRender(); } catch (e) {}
  }
  async function check(){
    const c = client(), u = user();
    if (!c || !u) return;
    const id = u.id; checkedAt = Date.now();
    try {
      const {data, error} = await c.from("studyboard_theme_access").select("all_themes").eq("user_id", id).maybeSingle();
      if (error || !user() || user().id !== id) return;
      const on = !!(data && data.all_themes);
      save(on ? {uid: id, on: true} : null);
      changed(on);
    } catch (e) {}
  }
  hook("render", () => {
    const id = user() ? user().id : null;
    if (id === uid) return;
    const was = uid; uid = id;
    if (id) { const s = saved(); if (s && s.uid && s.uid !== id) { save(null); changed(false); } check(); }
    else if (was) { save(null); changed(false); }
  });
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible" && uid && Date.now() - checkedAt > 10 * 60e3) check(); });
  window.SBThemes = {hidden: () => HIDDEN_THEMES.slice(), all: () => all, check};
  if (window.__SB_TEST) window.SBThemes.fake = (c, u) => { fake = {sb: c, user: u}; scheduleRender(); };
})();


