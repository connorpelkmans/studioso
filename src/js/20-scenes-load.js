/* ===== module: 20-scenes-load.js ===== */
/* The scene library (src/js/20-scenes-lib.js, about 3 MB of drawing code) is its own file */
const SCN20 = (() => {
  const LZ = window.SB_LAZY || {}, url = LZ.scenes || "bundle/scenes.js";
  const lib = () => (typeof SCN20_LIB !== "undefined" && SCN20_LIB) || null;
  const SCENES = {}, ENGINES = {};
  String(LZ.sceneIds || "").split(" ").forEach(id => { if (id) SCENES[id] = true; });
  let synced = false, wait = null;
  const sync = () => { const L = lib(); if (L && !synced) { synced = true; Object.assign(SCENES, L.SCENES); Object.assign(ENGINES, L.ENGINES); } return L; };
  const need = () => { const L = sync(); if (!L) throw new Error("the scene library isn't loaded yet"); return L; };
  // Loads the library once; resolves true when it's here, false if it couldn't load
  function load(){
    if (sync()) return Promise.resolve(true);
    if (!wait) wait = new Promise(res => {
      const s = document.createElement("script"); s.src = url;
      s.onload = () => res(!!sync());
      s.onerror = () => { s.remove(); wait = null; res(false); };
      document.head.appendChild(s);
    });
    return wait;
  }
  return {SCENES, ENGINES, ready: () => !!sync(), load,
    buildScene: function () { return need().buildScene.apply(null, arguments); },
    buildSceneAt: function () { return need().buildSceneAt.apply(null, arguments); },
    setAnim: a => { const L = sync(); if (L) L.setAnim(a); },
    get UIC(){ return need().UIC; }};
})();
