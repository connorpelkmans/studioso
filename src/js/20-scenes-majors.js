/* ===== module: 20-scenes-majors.js ===== */
/* Studyboard 1.12 */
(() => {
  const L = SCN20;
  MAJ_THEMES.forEach(m => {
    try {
      if (!m || !m.skin || !m.skin.id || !L.SCENES[m.skin.id] || SKINS.some(x => x.id === m.skin.id)) return;
      const id = m.skin.id;
      if (m.shapes) Object.assign(FX_SHAPES, m.shapes);
      if (m.fx) THEME_FX[id] = m.fx;
      SKINS.push(Object.assign({tier: "pro", group: "majors"}, m.skin, m.tag ? {desc: String(m.tag).replace(/\.?$/, ".")} : {}));
      if (m.kit) THEME_KIT[id] = m.kit;
    } catch (e) { console.warn("study fields theme", m && m.skin && m.skin.id, e); }
  });
})();


