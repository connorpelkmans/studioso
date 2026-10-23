/* ===== module: 20-scenes-majors.js ===== */
/* Studyboard 1.12: Study Fields themes (one for each of 20 popular university majors). Pro, "majors" group.
   The batch files 20-scenes-maj-m*.js push {skin, kit, shapes, fx, tag} into MAJ_THEMES; this registers them the same
   way 20-scenes.js registers the new scenes: skin (light, dark, glow, spine, buttons), theme kit (flashcards, notes,
   pins), motif shapes for the pop-ups, the task pop-up itself and the Style Shop summary. The scene art and its living
   engine live in the scene library (20-scenes-lib.js, files scenes_m*.js and engines_m*.js). */
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


