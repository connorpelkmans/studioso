/* ===== module: 20-scenes.js ===== */
/* ===== Full-scene themes (1.11.0) =====
   Every artwork theme now paints a full scene (SVG layers from the scene library in 20-scenes-lib.js) with two
   animation canvases: A under the crisp front layer 'near', B on top of everything. A theme with an engine gets a
   living loop at the Balanced feel and its own "task finished" moment; a theme without one shows the still scene.
   Uses the app hooks: skinart (draw the background), celebrate (finish moment), thumb (Style Shop previews). */
(() => {
  const L = SCN20;
  const F_BAL = {s: 1, a: 1}, F_GENTLE = {s: 0.7, a: 0.7};
  // Pixel density
  const DPR_MAX = 1.5, DPR_BIG = 1.25, BIG_AREA = 1.5e6, FRAME_MS = 31;

  /* The nine new scene themes */
  const SCENE_ALIAS = {lavenderfields: "lavender"};
  const sceneOf = id => SCENE_ALIAS[id] || id;
  const lg = (a, b) => `linear-gradient(180deg,${a},${b})`, lg2 = (a, b) => `linear-gradient(135deg,${a},${b})`;
  const NEW_SKINS = [
    {id: "balloons", name: "Balloon Festival", desc: "Hot-air balloons drifting over soft green hills.",
      light: ["#EEF5FA", "rgba(47,110,158,.10)", "#FFFFFF", "#1B2B3A", "#566878", "#D5E2EC", "#E6EFF6", "#F7FAFC", "#B8483A", "#D06A55", "#FFFFFF", "#7A2E24", "#1E4A73", "#CFE2F2", "#FFE3A3"],
      dark: ["#141231", "rgba(242,162,92,.08)", "#1D1A3A", "#F3EEFA", "#B5ABCB", "#332E57", "#262249", "#18152F", "#F2A25C", "#F7C27A", "#1D1733", "#8A5A3A", "#16132F", "#D8CDEF", "#6A4A2A"],
      glow: ["linear-gradient(180deg,#9FD2EE,#CDE8F4 45%,#FBE6D4)", "linear-gradient(180deg,#151B42,#35306A 42%,#9A5C84 78%,#E89878)"],
      spine: [lg("#2F6E9E", "#1E4A73"), lg("#2A2556", "#16132F")], btn: [lg2("#B8483A", "#C9692E"), lg2("#F2A25C", "#F7C27A")]},
    {id: "koi", name: "Koi Pond", desc: "Koi gliding under lily pads in a calm green pond.",
      light: ["#EAF5F2", "rgba(31,111,106,.10)", "#FFFFFF", "#10302E", "#4C6966", "#CDE3DF", "#DFEFEC", "#F6FBFA", "#B8521E", "#CC7447", "#FFFFFF", "#6E3212", "#124744", "#C6E6E1", "#FFE2B0"],
      dark: ["#0A2026", "rgba(243,165,90,.08)", "#0F2C33", "#E6F4F1", "#9DBDB8", "#1D444B", "#15373E", "#0C252B", "#F3A55A", "#F7C27A", "#10262B", "#7F5530", "#0A2126", "#A9D6CF", "#6A4A26"],
      glow: ["radial-gradient(120% 90% at 50% 40%,#D3EDE8,#B1DBD3 55%,#8CC4BD)", "radial-gradient(120% 90% at 50% 40%,#17434C,#0F2F37 60%,#0A2027)"],
      spine: [lg("#1F6F6A", "#124744"), lg("#123A40", "#0A2126")], btn: [lg2("#B8521E", "#C9701E"), lg2("#F3A55A", "#F7C27A")]},
    {id: "rain", name: "Rainy Window", desc: "Raindrops sliding down a window on a cozy gray day.",
      light: ["#EDF0F3", "rgba(47,107,166,.10)", "#FFFFFF", "#1C2633", "#55616E", "#D4DBE2", "#E4E9EE", "#F7F9FA", "#2F6BA6", "#5288BD", "#FFFFFF", "#1F4A75", "#2E3A4C", "#CBD5E0", "#FFE9A8"],
      dark: ["#10141E", "rgba(242,181,107,.08)", "#181E2B", "#EEF1F7", "#A9B2C4", "#2A3244", "#202838", "#131824", "#F2B56B", "#F7CF8E", "#1A1A24", "#7D6038", "#0E131E", "#C3CCDC", "#5E4A26"],
      glow: ["linear-gradient(180deg,#C8D2DC,#B6C3CE 60%,#A8B5BF)", "linear-gradient(180deg,#131A2A,#1B2338 60%,#252C40)"],
      spine: [lg("#4A5A70", "#2E3A4C"), lg("#1C2436", "#0E131E")], btn: [lg2("#2F6BA6", "#3F80BD"), lg2("#F2B56B", "#F7CF8E")]},
    {id: "alpine", name: "Alpine Lake", desc: "Snowy peaks and pines mirrored in a still mountain lake.",
      light: ["#EEF4F8", "rgba(35,110,150,.10)", "#FFFFFF", "#152B3A", "#4F6574", "#D2DFE8", "#E2ECF2", "#F7FAFC", "#236E96", "#4A8DB0", "#FFFFFF", "#174A66", "#1C3D54", "#CBE0EE", "#FFE9A8"],
      dark: ["#0E1528", "rgba(156,194,240,.08)", "#172038", "#EDF1FA", "#A9B6D0", "#28334F", "#1E2842", "#121A30", "#9CC2F0", "#C3DAF7", "#0F1830", "#4A6690", "#0C1426", "#C3D2EC", "#4A5A2A"],
      glow: ["linear-gradient(180deg,#96C0E2,#D5E6F0 45%,#7FA6BD)", "linear-gradient(180deg,#0E1532,#27315A 45%,#1A2544)"],
      spine: [lg("#2F5F7D", "#1C3D54"), lg("#1C2A48", "#0C1426")], btn: [lg2("#236E96", "#2F86A8"), lg2("#9CC2F0", "#C3DAF7")]},
    {id: "dunes", name: "Desert Dunes", desc: "Soft sand dunes under a warm sky, and starry nights.",
      light: ["#FAF1E6", "rgba(168,80,42,.10)", "#FFFCF7", "#3A2416", "#7A5E4C", "#EEDCC8", "#F6E8D8", "#FFFBF6", "#A8502A", "#C0744E", "#FFFFFF", "#6E3218", "#8A4527", "#F6DCC6", "#FFE0A0"],
      dark: ["#130F2A", "rgba(231,183,119,.08)", "#1C1737", "#F4EEF9", "#B7AACD", "#322A55", "#251F46", "#17122F", "#E7B777", "#F2D09A", "#1B1433", "#7E6238", "#15102E", "#D9CCEE", "#6A5024"],
      glow: ["linear-gradient(180deg,#F5D7B6,#F9E6CC 45%,#F4CDA4)", "linear-gradient(180deg,#0D1131,#231F52 45%,#56396C)"],
      spine: [lg("#B9683A", "#8A4527"), lg("#2B2358", "#15102E")], btn: [lg2("#A8502A", "#BE6A2E"), lg2("#E7B777", "#F2D09A")]},
    {id: "jelly", name: "Jellyfish Drift", desc: "Glowing jellyfish drifting through sunlit water.",
      light: ["#EAF5F8", "rgba(29,110,140,.10)", "#FFFFFF", "#12303E", "#4C6874", "#CFE3EA", "#DFEEF3", "#F6FBFC", "#B63C7A", "#C9679A", "#FFFFFF", "#7A2452", "#134A66", "#C4E4EF", "#FFE9A8"],
      dark: ["#06111F", "rgba(111,243,255,.07)", "#0C1B2D", "#E8F7FC", "#9CB8C8", "#1B3148", "#13253A", "#091626", "#6FF3FF", "#9FF7FF", "#07131F", "#2A7F8C", "#050E1C", "#A6DCEB", "#2A5A66"],
      glow: ["linear-gradient(180deg,#BDE8EE,#79C6D2 32%,#3A8BAE 72%,#22628A)", "linear-gradient(180deg,#0C2036,#081628 45%,#040B18)"],
      spine: [lg("#1D6E8C", "#134A66"), lg("#0B2238", "#050E1C")], btn: [lg2("#B63C7A", "#8A4CC8"), lg2("#6FF3FF", "#B89CFF")]},
    {id: "bamboo", name: "Bamboo Grove", desc: "Tall bamboo stalks in soft green light.",
      light: ["#EFF4E8", "rgba(63,122,46,.10)", "#FFFFFD", "#1C2E16", "#566B4E", "#D6E2CB", "#E5EEDC", "#F9FBF6", "#3F7A2E", "#62975A", "#FFFFFF", "#2A5520", "#335527", "#D2E6C6", "#FFE9A0"],
      dark: ["#0D1A13", "rgba(240,207,122,.07)", "#15261D", "#EAF4EC", "#A7C0AE", "#27402F", "#1D3325", "#111F17", "#F0CF7A", "#F6DF9E", "#14241A", "#6E6232", "#0C1C14", "#BCD8C2", "#5A5024"],
      glow: ["linear-gradient(180deg,#E8F1DD,#D3E6C8 50%,#C1D8B2)", "linear-gradient(180deg,#0E1F1A,#132B23 55%,#1A362C)"],
      spine: [lg("#4E7A3E", "#335527"), lg("#1A3326", "#0C1C14")], btn: [lg2("#3F7A2E", "#58902E"), lg2("#F0CF7A", "#F6DF9E")]},
    {id: "lavenderfields", name: "Lavender Fields", desc: "Rows of lavender rolling toward a farmhouse on the hill.",
      light: ["#F4F0F8", "rgba(106,75,176,.10)", "#FFFFFF", "#231A36", "#5F5670", "#E0D8EC", "#ECE6F4", "#FAF8FC", "#6A4BB0", "#8C73C6", "#FFFFFF", "#45307A", "#473673", "#DCD0F0", "#FFE9A8"],
      dark: ["#16102A", "rgba(242,169,138,.08)", "#20183A", "#F5F0FB", "#BDB0D2", "#382C58", "#2A2148", "#1A1432", "#F2A98A", "#F6C7A6", "#241836", "#8A5A50", "#1E1538", "#D8CCF0", "#6A4A3A"],
      glow: ["linear-gradient(180deg,#B5D3EC,#E4E3F1 45%,#FAE6D4 62%,#8E73BE)", "linear-gradient(180deg,#1C1C48,#4F3A74 40%,#DE8C7A 62%,#2D1F4D)"],
      spine: [lg("#6B559E", "#473673"), lg("#3A2A60", "#1E1538")], btn: [lg2("#6A4BB0", "#8A5BC0"), lg2("#F2A98A", "#F6C7A6")]},
    {id: "rooftops", name: "City Rooftops", desc: "Brick rooftops and water towers, with warm windows at night.",
      light: ["#F2EFF3", "rgba(91,85,117,.10)", "#FFFFFF", "#221E30", "#5F5A6E", "#DEDAE4", "#EAE7EE", "#FAF9FB", "#B8502E", "#CB7454", "#FFFFFF", "#6E2E1A", "#3B3752", "#D8D2E6", "#FFE3A0"],
      dark: ["#110F24", "rgba(255,210,127,.07)", "#1A1733", "#F3F0FA", "#B3ADC9", "#2F2B4C", "#24203F", "#15132B", "#FFD27F", "#FFE3A8", "#1A1628", "#8A7038", "#100E22", "#D0CAE6", "#6A5A26"],
      glow: ["linear-gradient(180deg,#BBD2E8,#E6DCE6 60%,#F6D6C4)", "linear-gradient(180deg,#0E1230,#26244A 55%,#4A3457)"],
      spine: [lg("#5B5575", "#3B3752"), lg("#211E3E", "#100E22")], btn: [lg2("#B8502E", "#C96A2E"), lg2("#FFD27F", "#FFE3A8")]}
  ];
  const NOTES = ["#FFF3B8", "#D9F0D8", "#D6E6FF", "#FFD9C8", "#EBD9FF"];
  const NEW_KITS = {
    balloons: {motif: "balloon", card: ["#F6FAFD", "#E3EEF6"], ink: "#1B2B3A", bd: "#BCD4E6", mc: "#E3735F", r: 18, notes: ["#FAD9CF"].concat(NOTES), shape: "cloud", pin: "washi2", fab: "999px", btn: "999px"},
    koi: {motif: "fish", card: ["#F3FAF8", "#DCEFEA"], ink: "#10302E", bd: "#A9D3CB", mc: "#F08A4B", r: 20, notes: ["#CDE9E3"].concat(NOTES), shape: "circle", pin: "magnet", fab: "999px", btn: "14px"},
    rain: {motif: "drop", card: ["#F7F9FB", "#E3E9EF"], ink: "#1C2633", bd: "#C3CED9", mc: "#3F80BD", r: 10, notes: ["#D6DEE8"].concat(NOTES), shape: "lined", pin: "clip", fab: "16px", btn: "10px"},
    alpine: {motif: "mountain", card: ["#F7FAFD", "#E1ECF4"], ink: "#152B3A", bd: "#B9D0E0", mc: "#2F86A8", r: 14, notes: ["#D2E3EF"].concat(NOTES), shape: "torn", pin: "tape", fab: "18px 18px 6px 18px", btn: "12px"},
    dunes: {motif: "sun", card: ["#FFFAF3", "#F6E6D2"], ink: "#3A2416", bd: "#E8C8A6", mc: "#BE6A2E", r: 12, notes: ["#F4DCC2"].concat(NOTES), shape: "folded", pin: "corners", fab: "22px 6px 22px 6px", btn: "10px"},
    jelly: {motif: "jelly", card: ["#F5FBFD", "#DDF0F6"], ink: "#12303E", bd: "#A8D6E6", mc: "#B63C7A", r: 22, notes: ["#F2D6E6"].concat(NOTES), shape: "scallop", pin: "pin", fab: "999px", btn: "999px"},
    bamboo: {motif: "leaf", card: ["#F9FCF5", "#E5EFDB"], ink: "#1C2E16", bd: "#BFD6AE", mc: "#58902E", r: 8, notes: ["#DCE9CF"].concat(NOTES), shape: "classic", pin: "tape", fab: "10px 22px 10px 22px", btn: "8px"},
    lavenderfields: {motif: "sprig", card: ["#FBF9FE", "#ECE5F6"], ink: "#231A36", bd: "#D4C8EA", mc: "#8A5BC0", r: 18, notes: ["#E3D8F3"].concat(NOTES), shape: "rounded", pin: "gold", fab: "24px 24px 24px 6px", btn: "14px"},
    rooftops: {motif: "moon", card: ["#FAF9FB", "#E9E6EF"], ink: "#221E30", bd: "#D2CCDF", mc: "#B8502E", r: 8, notes: ["#EED6CC"].concat(NOTES), shape: "gridnote", pin: "binder", fab: "12px", btn: "8px"}
  };
  // Motif shapes for the new kits' flashcards (same -12..12 box as the other FX_SHAPES)
  Object.assign(FX_SHAPES, {
    balloon: {d: "M0 -10.5C5.6 -10.5 8.2 -6.4 8.2 -2.8C8.2 1.8 3.6 5.4 1.3 7H-1.3C-3.6 5.4 -8.2 1.8 -8.2 -2.8C-8.2 -6.4 -5.6 -10.5 0 -10.5Z M-2.2 8.4H2.2V11.2H-2.2Z", detail: "M0 -10.2C-3.4 -6 -3.4 2 -1 6.8M0 -10.2C3.4 -6 3.4 2 1 6.8", dstroke: true},
    umbrella: {d: "M-11 1C-10 -7 -4 -10 0 -10C4 -10 10 -7 11 1C9 -0.6 7 -0.6 5.5 1C4 -0.6 1.6 -0.6 0 1C-1.6 -0.6 -4 -0.6 -5.5 1C-7 -0.6 -9 -0.6 -11 1Z M-0.7 0.4H0.7V7.6A2.3 2.3 0 0 1 -3.9 7.6H-2.5A0.9 0.9 0 0 0 -0.7 7.6Z"},
    bleaf: {d: "M-11 0C-6 -2.8 4 -3 11 0C4 3 -6 2.8 -11 0Z", detail: "M-9 0L9 0", dstroke: true},
    plane: {d: "M11 -1.2L-10 -8.4L-4.6 -0.4L-10 7.2Z M-4.6 -0.4L-6.4 3.6L0.6 -0.8Z"},
    mountain: {d: "M-11.5 8.5L-3.2 -6.8L0.8 -0.6L4.2 -4.6L11.5 8.5Z"},
    sun: {d: "M-4.8 0a4.8 4.8 0 1 0 9.6 0a4.8 4.8 0 1 0 -9.6 0Z M-1 -11H1V-7.6H-1Z M-1 7.6H1V11H-1Z M-11 -1H-7.6V1H-11Z M7.6 -1H11V1H7.6Z"},
    jelly: {d: "M-8 0.4C-8 -5.8 -4.2 -9 0 -9C4.2 -9 8 -5.8 8 0.4C5 1.8 -5 1.8 -8 0.4Z M-5.6 2L-4.4 2C-4.8 5 -3.6 7.4 -4.4 10.6L-5.4 10.4C-4.8 7.6 -6 5 -5.6 2Z M-1.2 2.4H0.2C-0.2 5.6 1 8 0.2 11.2L-0.8 11C-0.2 8.2 -1.6 5.6 -1.2 2.4Z M3.8 2.2H5C4.6 5.2 5.8 7.6 5 10.8L4 10.6C4.6 7.8 3.4 5.2 3.8 2.2Z"},
    sprig: {d: "M-0.6 -3H0.6V11H-0.6Z M-1.6 -10.6a1.6 1.8 0 1 0 3.2 0a1.6 1.8 0 1 0 -3.2 0Z M-4 -7a1.9 2.1 0 1 0 3.8 0a1.9 2.1 0 1 0 -3.8 0Z M0.2 -7a1.9 2.1 0 1 0 3.8 0a1.9 2.1 0 1 0 -3.8 0Z M-4.2 -2.8a2 2.2 0 1 0 4 0a2 2.2 0 1 0 -4 0Z M0.2 -2.8a2 2.2 0 1 0 4 0a2 2.2 0 1 0 -4 0Z"},
    moon: {d: "M3 -9.6A9.6 9.6 0 1 0 9.6 3A7.4 7.4 0 1 1 3 -9.6Z"}
  });
  /* Task pop-ups for the nine new themes, in the same style as the others */
  const koiSwim = (W, H, n, cols, d) => Array.from({length: n}, (_, i) => { const left = i % 2 === 0, sp = fxR(2.2, 3.6), vx = (left ? 1 : -1) * sp, vy = -fxR(0.15, 0.8);
    return {shape: "fish", c: fxPick(cols), x: left ? fxR(-70, -20) : W + fxR(20, 70), y: fxR(H * 0.3, H * 0.95), vx, vy, g: 0, size: fxR(14, 22), rot: Math.atan2(vy, vx), vr: 0, sway: 0, life: 280, delay: Math.floor(fxR(0, 60)), glow: d ? 8 : 0}; });
  const sandGust = (W, H, n, cols) => Array.from({length: n}, () => ({shape: "circle", c: fxPick(cols), x: fxR(-W * 0.45, -10), y: fxR(H * 0.2, H), vx: fxR(5, 9), vy: fxR(-0.7, 0.2), g: 0, size: fxR(1.6, 3.4), rot: 0, vr: 0, sway: 0.9, swf: fxR(0.05, 0.1), life: 220, delay: Math.floor(fxR(0, 80)), alpha: 0.9}));
  const paperPlanes = (W, H, n, cols) => Array.from({length: n}, () => { const sp = fxR(3.2, 5), a = -fxR(0.18, 0.5), vx = Math.cos(a) * sp, vy = Math.sin(a) * sp;
    return {shape: "plane", c: fxPick(cols), x: fxR(-60, W * 0.55), y: fxR(H * 0.7, H + 60), vx, vy, g: 0, size: fxR(12, 18), rot: a, vr: 0, sway: 0, life: 240, delay: Math.floor(fxR(0, 90))}; });
  Object.assign(THEME_FX, {
    balloons: {spawn: (W, H, d, n) => fxRise(W, H, n(22), "balloon", d ? ["#E0806C", "#F0B85A", "#5BB5B5", "#E89A8A"] : ["#E3735F", "#EDB64C", "#4FA7A8", "#F29E8E"], {smin: 12, smax: 22, vmin: 1.2, vmax: 2.4, sway: 1, life: 300, glow: d ? 10 : 0}).map(p => Object.assign(p, {rot: fxR(-0.12, 0.12)}))
      .concat(fxTw(W, H, n(24), "sparkle", d ? ["#FFE3A8", "#FFFFFF"] : ["#F2B53A", "#FFD86B"], {smin: 3, smax: 6, glow: d ? 10 : 4}))},
    koi: {spawn: (W, H, d, n) => koiSwim(W, H, n(12), d ? ["#F0915A", "#F4E6D6", "#E8703A"] : ["#F08A4B", "#F2DCC6", "#E0533A"], d)
      .concat(fxTw(W, H, n(14), "ring", d ? ["#A9D6CF", "#E6F4F1"] : ["#FFFFFF", "#6FB5AC"], {smin: 6, smax: 10, grow: 0.35, alpha: 0.8}), fxBurst(W, H, n(20), "petal", ["#F7B6CC", "#FFFFFF", "#F28BB0"], [[0.2, 1.02], [0.8, 1.02]], {smin: 6, smax: 9, flip: true}))},
    rain: {spawn: (W, H, d, n) => fxFall(W, H, n(90), "drop", d ? ["#9CB8E0", "#C8D8F0"] : ["#5A8FC8", "#8FB4DE", "#3F80BD"], {vmin: 7, vmax: 11, sway: 0, smin: 4, smax: 7, glow: d ? 6 : 0}).map(p => Object.assign(p, {rot: 0, vr: 0, vx: 0.4, g: 0.05, life: 170, delay: Math.floor(fxR(0, 120))}))
      .concat(fxFall(W, H, n(7), "umbrella", ["#E0533A", "#F2B53A", "#3F80BD", "#4FA7A8", "#D96A9A"], {vmin: 0.9, vmax: 1.5, sway: 1.6, smin: 16, smax: 24}).map(p => Object.assign(p, {rot: fxR(-0.3, 0.3), vr: fxR(-0.01, 0.01)})))},
    alpine: {spawn: (W, H, d, n) => fxBurst(W, H, n(40), "flower", d ? ["#F4F1E8", "#9CC2F0", "#F9E6A0", "#C3B0F0"] : ["#6F9AE0", "#9CC2F0", "#F2C24A", "#A884F0", "#FFFFFF"], [[0.15, 1.02], [0.85, 1.02], [0.5, 1.04]], {smin: 7, smax: 11})
      .concat(fxFall(W, H, n(40), "snow", d ? ["#FFFFFF", "#DCE9FF"] : ["#9DBBEF", "#6F9AE0"], {vmin: 0.8, vmax: 1.6, sway: 1.2, smin: 5, smax: 9, glow: d ? 6 : 0}))},
    dunes: {spawn: (W, H, d, n) => sandGust(W, H, n(110), d ? ["#E7B777", "#F2D09A", "#B98C5E"] : ["#D9A066", "#E8B97A", "#C47F45"])
      .concat(fxTw(W, H, n(26), "sparkle", d ? ["#FFE7B8", "#FFFFFF"] : ["#F2B53A", "#FFD86B"], {smin: 3, smax: 7, top: 0.6, glow: d ? 10 : 4}), d ? fxStreaks(W, H, n(4), ["#FFE7B8", "#FFFFFF"]) : [])},
    jelly: {spawn: (W, H, d, n) => fxRise(W, H, n(18), "jelly", d ? ["#6FF3FF", "#B89CFF", "#FF9CD8"] : ["#E07AB0", "#A884F0", "#4FB0CC"], {smin: 12, smax: 20, vmin: 0.9, vmax: 1.8, sway: 1.2, glow: d ? 16 : 6, life: 320})
      .concat(fxRise(W, H, n(40), "bubble", d ? ["#9FF7FF", "#E8F7FC"] : ["#FFFFFF", "#7CC9D6"], {smin: 3, smax: 7, sway: 1, vmin: 1.6, vmax: 3}))},
    bamboo: {spawn: (W, H, d, n) => fxFall(W, H, n(70), "bleaf", d ? ["#6FAF5A", "#9CCB8C", "#4E8A3E"] : ["#3F7A2E", "#58902E", "#8CC152", "#2F6A24"], {sway: 2, flip: true, smin: 9, smax: 14}).map(p => Object.assign(p, {vx: fxR(0.6, 1.6)}))
      .concat(fxTw(W, H, n(24), "circle", d ? ["#F0CF7A", "#F6DF9E"] : ["#F2E7A0", "#E4F0B8"], {smin: 2, smax: 4, glow: 10, vy: -0.3}))},
    lavenderfields: {spawn: (W, H, d, n) => fxBurst(W, H, n(40), "sprig", d ? ["#B9A2FF", "#D8CCF0", "#9A7BE0"] : ["#8A5BC0", "#A884F0", "#6A4BB0"], [[0.15, 1.02], [0.85, 1.02], [0.5, 1.04]], {smin: 9, smax: 13, flip: true})
      .concat(fxFlutter(W, H, n(8), d ? ["#F6C7A6", "#FFFFFF", "#D8CCF0"] : ["#F2C84A", "#C9A0E8", "#8FC7F2"]), fxFall(W, H, n(40), "circle", d ? ["#C3B0F0", "#9A7BE0"] : ["#8A5BC0", "#B9A2E8"], {smin: 1.5, smax: 3, sway: 1.4, vmin: 0.8, vmax: 1.6}))},
    rooftops: {spawn: (W, H, d, n) => paperPlanes(W, H, n(9), d ? ["#FFFFFF", "#FFE3A8", "#D0CAE6"] : ["#B8502E", "#5B5575", "#3F80BD", "#E0A030"])
      .concat(fxTw(W, H, n(36), d ? "pixel" : "sparkle", d ? ["#FFD27F", "#FFE3A8"] : ["#F2B53A", "#FFD86B"], {smin: 2.5, smax: 5, glow: d ? 10 : 4}))}
  });

  // New scene summaries for the Style Shop (the 37 redrawn themes)
  const TAGS = {"ocean": "Gentle swells roll from a lighthouse island all the way to your feet", "summer": "A sunny beach seen from above, with turquoise water and two soft foam lines", "sunset": "A golden hour beach with the sun sinking into the sea and seashells on the sand", "galaxy": "A dreamy Milky Way with a ringed planet and soft twinkling starlight", "arctic": "Aurora ribbons over snowy peaks, a still lake and a cozy cabin", "winter": "A snowy valley with a cozy cabin, a frozen pond and a friendly snowman", "spring": "Rainbow tulip fields rolling toward a windmill, with butterflies resting on the flowers", "autumn": "A quiet park path through golden trees with maple and oak leaves drifting down", "sakura": "A cherry blossom branch over a calm lake below a snowy mountain", "forest": "Layer after layer of misty pine hills fading into the distance", "lemonade": "A sunny lemon grove with a striped lemonade stand", "mint": "Dreamy mint ice cream hills with fresh mint sprigs", "candy": "Pastel candy hills with lollipop trees and a candy path", "cafe": "A café window counter with steaming cups and coffee beans", "baking": "A sweet bakery with shelves of bread and a pastry case", "bokeh": "An evening meadow seen through a dreamy camera lens, with soft circles of colored light", "neon": "A quiet shop street at dusk, lit by glowing blue and magenta neon signs", "arcade": "The classic retro sunset: a striped sun sinking behind purple mountains over a glowing grid", "xmas": "A snowy village square with a glowing Christmas tree, strings of colored bulbs and a snowman", "newyear": "Colorful fireworks bursting over a quiet city skyline by the river", "cats": "A sunny cat room where an orange tabby bats a ball of yarn across the rug", "music": "A lavender music room with a piano, a guitar and a staff of notes flowing across the floor", "reading": "A book-lined nook with a window seat, an arc lamp and a stack of books with a ribbon bookmark", "knitting": "A sage green knitting corner with yarn cubbies, an armchair and two yarn balls with needles", "painting": "A sunny painter's studio with an easel, a paint palette and art on the walls", "gardening": "A bright greenhouse full of well-kept plants", "photography": "A golden-hour park path with photo prints on a string line", "gaming": "A soft, rounded game world with coins, a star power-up and a heart HUD", "valentines": "Heart balloons drifting up over a rolling rose garden", "easter": "An egg hunt in a spring meadow full of tulips", "stpatricks": "A pastel rainbow and tumbling shamrocks over green hills", "july4": "Fireworks over a lakeside town with a waving flag ribbon", "halloween": "Three jack-o'-lanterns with glowing faces on a moonlit hill", "thanksgiving": "A warm harvest field with a friendly turkey and an overflowing cornucopia", "hanukkah": "A menorah glowing in a snowy window, with a dreidel, gelt and a garland of stars", "diwali": "A rooftop terrace glowing with diyas, brass lanterns and a bright rangoli", "lunarnewyear": "Red lanterns over a misty lake with a plum blossom branch"};
  SKINS.forEach(s => { if (TAGS[s.id] && L.SCENES[s.id]) s.desc = TAGS[s.id] + "."; });
  NEW_SKINS.forEach(s => { if (L.SCENES[sceneOf(s.id)] && !SKINS.some(x => x.id === s.id)) { SKINS.push(Object.assign({tier: "pro", group: "newscenes"}, s)); THEME_KIT[s.id] = NEW_KITS[s.id]; } });

  const isScene = id => { if (!id || id === "terraces") return false; const s = SKINS.find(x => x.id === id); return !!(s && s.light && !s.plain && L.SCENES[sceneOf(id)]); };

  /* Style Shop: a "New Scenes" section above the other Pro scenes */
  const origShop = styleShop;
  styleShop = function (tab) {
    const r = origShop.apply(this, arguments);
    try {
      if (ui.shopTab !== "themes") return r;
      const body = dlg.querySelector(".sheet.shop .sheet-body"); if (!body) return r;
      const mode = body.querySelector(".shop-mode"); if (mode && !mode.querySelector(".sc-moment")) mode.insertAdjacentHTML("beforeend", momentBtn());
    } catch (e) { console.warn("scenes shop", e); }
    return r;
  };

  /* Conditions */
  const MO = () => window.SBMotion || null;
  const liveOK = () => styleCfg().motion !== false && (!MO() || MO().live());

  /* The scene on screen */
  let cur = null, raf = 0, rafT = 0, last = 0, T = 0, finUntil = 0, rebuildTimer = 0;
  const stopLoop = () => { cancelAnimationFrame(raf); clearTimeout(rafT); raf = 0; rafT = 0; };
  // Sleep between frames
  let cost2 = 0, hold60 = 0;
  const gapNow = () => (performance.now() < hold60 ? 14 : (MO() ? MO().frameMs() : FRAME_MS));
  const nextFrame = () => { const gap = gapNow(), wait = last ? gap - (performance.now() - last) + 1 : 0; if (gap > 45 && wait > 4) { rafT = setTimeout(() => { rafT = 0; if (raf === -1) raf = requestAnimationFrame(tick); }, wait); return -1; } return requestAnimationFrame(tick); };
  const broken = new Set();

  function geometry(){
    const nav = document.querySelector("nav.tabs"), r = nav && nav.getBoundingClientRect();
    const side = r && r.left < 4 && r.height > innerHeight * 0.6 ? Math.round(r.right) : 0;
    const floating = r && r.left >= 4 && r.right <= innerWidth - 4;
    const foot = r && !side && !floating && r.top > innerHeight * 0.6 ? Math.max(0, Math.round(innerHeight - r.top - 4)) : 0;
    const W = Math.max(1, innerWidth - side), H = Math.max(1, innerHeight - foot), desk = W / H >= 0.9;
    const k = Math.max(0.8, Math.min(3, desk ? Math.min(W / 1200, H / 800) : Math.min(W / 390, H / 760)));
    return {side, foot, W, H, desk, k, bw: Math.round(W / k), bh: Math.round(H / k)};
  }
  const sigOf = (id, dk, g) => [id, dk, g.side, g.foot, g.W, g.H].join("|");

  let blurN = 0;
  function layerHtml(Ly, pad, v, k){
    let inner = "";
    "abcdefghijklmnop".split("").forEach(key => { if (Ly[key].d) inner += `<path d="${Ly[key].d}" fill="${Ly[key].c}"/>`; });
    ["s", "t"].forEach(key => { if (Ly[key].d) inner += `<path d="${Ly[key].d}" fill="none" stroke="${Ly[key].c}" stroke-width="${Ly[key].w}" stroke-linecap="round" stroke-linejoin="round"/>`; });
    if (!inner) return "";
    const box = pad ? `left:${-40 * k}px;top:${-40 * k}px;width:${v.pw * k}px;height:${v.phh * k}px` : `left:0;top:0;width:${v.bw * k}px;height:${v.bh * k}px`;
    if (!Ly.blur) return `<svg class="sc-l" viewBox="${pad ? v.vbPad : v.vb}" preserveAspectRatio="none" style="${box}">${inner}</svg>`;
    const fid = "scb" + (++blurN);
    return `<svg class="sc-l" viewBox="${pad ? v.vbPad : v.vb}" preserveAspectRatio="none" style="${box}"><defs><filter id="${fid}" x="-5%" y="-5%" width="110%" height="110%" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="${Ly.blur.toFixed(2)}"/></filter></defs><g filter="url(#${fid})">${inner}</g></svg>`;
  }

  function makeScene(id, dk, g){
    if (!L.ready()) return null;
    const sc = sceneOf(id), wantEng = !!L.ENGINES[sc] && !broken.has(sc);
    let A = null, v = null, eng = null;
    if (wantEng) {
      try { A = {}; L.setAnim(A); v = L.buildSceneAt(sc, dk, g.bw, g.bh, g.desk); L.setAnim(null); eng = L.ENGINES[sc](A, v, dk); }
      catch (e) { L.setAnim(null); console.warn("scene engine " + sc, e); broken.add(sc); v = null; eng = null; }
    }
    if (!v) { try { L.setAnim(null); v = L.buildSceneAt(sc, dk, g.bw, g.bh, g.desk); } catch (e) { console.warn("scene " + sc, e); return null; } }
    return {v, eng, sc};
  }

  function build(id){
    clearTimeout(rebuildTimer);
    const dk = isDarkNow(), g = geometry(), made = makeScene(id, dk, g);
    if (!made) return false;
    const {v, eng, sc} = made, k = g.k;
    let el = document.getElementById("sceneArt");
    if (!el) { el = document.createElement("div"); el.id = "sceneArt"; el.setAttribute("aria-hidden", "true"); document.body.prepend(el); }
    el.style.cssText = `left:${g.side}px;top:0;width:${g.W}px;height:${g.H}px;background:${v.sky}`;
    const band = v.band.h ? `<div class="sc-band" style="top:${v.band.top * k}px;height:${v.band.h * k}px;background:${v.band.bg}"></div>` : "";
    el.innerHTML = band + layerHtml(v.far, true, v, k) + layerHtml(v.refl, true, v, k) + layerHtml(v.mid, true, v, k)
      + (eng ? `<canvas class="sc-cv sc-a"></canvas>` : "") + layerHtml(v.near, false, v, k) + (eng && eng.stat ? `<canvas class="sc-cv sc-s"></canvas>` : "") + (eng ? `<canvas class="sc-cv sc-b"></canvas>` : "");
    const dpr = Math.min(g.W * g.H > BIG_AREA ? DPR_BIG : DPR_MAX, eng && eng.maxDpr || 9, window.devicePixelRatio || 1) * (MO() ? MO().dprScale() : 1), s = k * dpr;
    const cvs = eng ? [el.querySelector(".sc-a"), el.querySelector(".sc-b")] : [];
    cvs.forEach(c => { c.width = Math.round(g.W * dpr); c.height = Math.round(g.H * dpr); c.style.width = g.W + "px"; c.style.height = g.H + "px"; });
    const sCv = eng && eng.stat ? el.querySelector(".sc-s") : null;
    if (sCv) { sCv.width = eng.stat.width; sCv.height = eng.stat.height; sCv.style.width = g.W + "px"; sCv.style.height = g.H + "px"; sCv.getContext("2d").drawImage(eng.stat, 0, 0); eng.hosted = true; }
    stopLoop(); last = 0; T = 0; if (MO() && MO().warm) MO().warm(4000);
    document.documentElement.classList.add("sc-on");
    cur = {id, sc, dk, sig: sigOf(id, dk, g), g, v, eng, s, el, dprK: MO() ? MO().dprScale() : 1, ctx: cvs.map(c => c.getContext("2d"))};
    if (eng) { safe(() => { eng.step(1 / 30, 0, feel()); T = 1 / 30; drawFrame(); }); }
    syncRun();
    return true;
  }

  function teardown(){
    clearTimeout(rebuildTimer); stopLoop(); cur = null;
    document.documentElement.classList.remove("sc-on");
    const el = document.getElementById("sceneArt"); if (el) el.remove();
  }

  const feel = () => F_BAL;
  function drawFrame(){
    const c = cur; if (!c || !c.eng) return;
    if (c.drawn && c.eng.idle && c.eng.idle(T)) return;
    const uses = typeof c.eng.uses === "string" ? c.eng.uses : "ab";
    c.ctx.forEach((x, i) => { if (uses.indexOf(i ? "b" : "a") < 0) return; x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, x.canvas.width, x.canvas.height); x.setTransform(c.s, 0, 0, c.s, 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = "source-over"; });
    c.eng.draw(c.ctx[0], c.ctx[1], T, feel()); c.drawn = true;
  }
  // An engine that throws is dropped and the theme is redrawn as a still scene
  function safe(fn){
    try { fn(); return true; }
    catch (e) { console.warn("scene engine " + (cur && cur.sc), e); if (cur) { broken.add(cur.sc); const id = cur.id; cur = null; build(id); } return false; }
  }

  function tick(ts){
    raf = 0;
    const c = cur; if (!c || !c.eng || document.hidden) return;
    const finishing = performance.now() < finUntil;
    if ((!liveOK() || popup) && !finishing) { last = 0; return; }
    if (last && ts - last < gapNow()) { raf = nextFrame(); return; }
    const dt = last ? Math.min(0.1, (ts - last) / 1000) : 1 / 30; last = ts; T += dt;
    const t0 = performance.now();
    safe(() => { c.eng.step(dt, T, feel()); drawFrame(); });
    { const cost = performance.now() - t0; cost2 = cost2 * 0.9 + cost * 0.1;
      // A scene that can't be drawn inside a 120 Hz frame (8 ms) with room to spare holds at 60 for a while, then tries 120 again
      if (cost2 > 5 && ts > hold60) hold60 = ts + 15000; }
    if (!raf && cur === c) raf = nextFrame();
  }
  function syncRun(){
    if (!cur || !cur.eng || raf || document.hidden) return;
    if ((liveOK() && !popup) || performance.now() < finUntil) { last = 0; raf = requestAnimationFrame(tick); }
  }
  // While a task pop-up plays in front of the page, the scene's loop rests
  let popup = false;
  const origPause = ambientPause;
  ambientPause = function (on) { origPause.apply(this, arguments); popup = !!on; if (!on) syncRun(); };
  document.addEventListener("visibilitychange", () => { if (document.hidden) { stopLoop(); } else syncRun(); });
  // The Animations governor changed something (mode, power, focus, idle, quality step)
  window.addEventListener("sb-motion", () => {
    stopLoop(); last = 0;
    if (cur && cur.eng && MO() && cur.dprK !== MO().dprScale()) { build(cur.id); return; }
    syncRun();
  });

  /* Hooks */
  hook("skinart", () => {
    const id = document.documentElement.dataset.skin;
    if (!isScene(id)) { teardown(); return false; }
    if (!L.ready()) { L.load().then(ok => { if (ok && document.documentElement.dataset.skin === id) renderSkinArt(); }); teardown(); return false; }
    const dk = isDarkNow(), g = geometry(), sig = sigOf(id, dk, g);
    if (!cur || cur.id !== id) return build(id) || (teardown(), false);
    if (cur.sig !== sig) {
      clearTimeout(rebuildTimer);
      rebuildTimer = setTimeout(() => { if (cur && cur.id === id) build(id); }, dk !== cur.dk ? 60 : 220);
      cur.el.style.left = g.side + "px";
    }
    stopLoop(); syncRun();
    return true;
  });

  /* Scene moments Finishing a task plays the theme's pop-up in front of the page */
  const hasMoment = () => !!(cur && cur.eng && cur.id === document.documentElement.dataset.skin);
  function sceneMoment(byUser){
    if (!hasMoment() || document.hidden || (MO() && MO().level() === "static")) return false;
    const cfg = styleCfg();
    if (!byUser && (cfg.celebrate === false || cfg.motion === false)) return false;
    if (!safe(() => cur.eng.finish(T))) return false;
    finUntil = Math.max(finUntil, performance.now() + 6000);
    stopLoop(); syncRun();
    return true;
  }
  const later = (ms, byUser) => setTimeout(() => sceneMoment(byUser), ms);

  // A Focus session ends
  const origPomoFinish = pomoFinish;
  pomoFinish = function (missed) {
    const focusEnded = pomo.running && pomo.mode === "focus" && !missed;
    const r = origPomoFinish.apply(this, arguments);
    if (focusEnded) {
      const ad = document.getElementById("alarmDlg");
      if (ad && ad.open) ad.addEventListener("close", () => later(300), {once: true}); else later(400);
    }
    return r;
  };
  // A flashcard study session or a quiz round ends
  const origRate = rateCard;
  rateCard = function () {
    const f = ui.fc, r = origRate.apply(this, arguments);
    if (f && f.mode === "study" && !f.q[f.i] && !f.sceneDone) { f.sceneDone = true; later(700); }
    return r;
  };
  const origQuiz = finishQuiz;
  finishQuiz = function () { const r = origQuiz.apply(this, arguments); later(700); return r; };
  const origAiFinish = aiFinish;
  aiFinish = function () { const r = origAiFinish.apply(this, arguments); later(700); return r; };
  // The last task on Today's Plan is done
  hook("changed", changes => {
    const F = FOCUS; if (!F || !hasMoment()) return;
    const done = changes.filter(c => c.kind === "task" && c.after && c.after.status === "done" && F.info[c.id]);
    if (!done.length) return;
    const planned = F.ranked.filter(x => x.alloc > 0).map(x => x.t.id);
    if (!planned.length || !done.some(c => planned.includes(c.id))) return;
    if (planned.every(id => state.tasks[id] && state.tasks[id].status === "done")) later(2600);
  });
  // On purpose: Style Shop (Themes tab) and Settings (which also makes it a Search action)
  const momentBtn = () => hasMoment() ? `<button type="button" class="btn small sc-moment" data-act="scene-moment">Play Scene Moment</button>` : "";
  hook("menu", () => hasMoment() ? `<button data-act="scene-moment"><span>Play Scene Moment<span class="sub">Watch your theme's scene do its little celebration</span></span></button>` : "");
  hook("act", act => {
    if (act !== "scene-moment") return false;
    if (dlg.open) dlg.close();
    setTimeout(() => { if (!sceneMoment(true) && !document.hidden) toast(hasMoment() ? "Turn on animations to see the scene moment." : "This theme doesn't have a scene moment."); }, 250);
    return true;
  });

  // Pointer positions for engines that react to them
  let lastPtr = 0;
  document.addEventListener("pointermove", e => {
    const c = cur; if (!c || !c.eng || !c.eng.pointer || e.pointerType === "touch" || !raf) return;
    if (e.timeStamp - lastPtr < 30) return; lastPtr = e.timeStamp;
    const x = (e.clientX - c.g.side) / c.g.k, y = e.clientY / c.g.k;
    safe(() => c.eng.pointer(x >= 0 && y >= 0 && x <= c.v.bw && y <= c.v.bh ? {x, y} : null));
  }, {passive: true});
  document.documentElement.addEventListener("pointerleave", () => { const c = cur; if (c && c.eng && c.eng.pointer) safe(() => c.eng.pointer(null)); });

  /* Style Shop previews */
  const TH_W = 640, TH_H = 400, thumbs = new Map();
  function splitTop(s){ const out = []; let d = 0, st = 0; for (let i = 0; i < s.length; i++) { const ch = s[i]; if (ch === "(") d++; else if (ch === ")") d--; else if (ch === "," && !d) { out.push(s.slice(st, i).trim()); st = i + 1; } } out.push(s.slice(st).trim()); return out; }
  // CSS gradient (as the scenes write them) -> SVG defs + rect
  function cssToSvg(css, x, y, w, h, uidp){
    let defs = "", rects = "";
    splitTop(css).reverse().forEach((layer, li) => {
      const m = /^(linear|radial)-gradient\(([\s\S]*)\)$/.exec(layer);
      if (!m) { rects += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${layer}"/>`; return; }
      const args = splitTop(m[2]), id = uidp + li;
      let head = null;
      if (m[1] === "linear" && /deg$/.test(args[0])) head = args.shift();
      if (m[1] === "radial" && /^[\d.]+%|at /.test(args[0]) && !/^#|^rgb/.test(args[0])) head = args.shift();
      const stops = args.map(a => { const mm = /^(.*?)\s+([\d.]+)%$/.exec(a); return mm ? {c: mm[1], o: +mm[2] / 100} : {c: a, o: null}; });
      stops.forEach((s, i) => { if (s.o == null) s.o = i === 0 ? 0 : i === stops.length - 1 ? 1 : null; });
      for (let i = 1; i < stops.length - 1; i++) if (stops[i].o == null) { let j = i; while (stops[j].o == null) j++; const a = stops[i - 1].o, b = stops[j].o; for (let q = i; q < j; q++) stops[q].o = a + (b - a) * (q - i + 1) / (j - i + 1); }
      const st = stops.map(s => `<stop offset="${s.o}" stop-color="${s.c}"/>`).join("");
      if (m[1] === "linear") {
        const a = (head ? parseFloat(head) : 180) * Math.PI / 180, dx = Math.sin(a), dy = -Math.cos(a), len = Math.abs(w * dx) + Math.abs(h * dy), cx = x + w / 2, cy = y + h / 2;
        defs += `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${cx - dx * len / 2}" y1="${cy - dy * len / 2}" x2="${cx + dx * len / 2}" y2="${cy + dy * len / 2}">${st}</linearGradient>`;
      } else {
        const p = /([\d.]+)%\s+([\d.]+)%(?:\s+at\s+([\d.]+)%\s+([\d.]+)%)?/.exec(head || "") || [];
        const rx = w * (p[1] ? +p[1] / 100 : 0.71), ry = h * (p[2] ? +p[2] / 100 : 0.71), cx = x + w * (p[3] ? +p[3] / 100 : 0.5), cy = y + h * (p[4] ? +p[4] / 100 : 0.5);
        defs += `<radialGradient id="${id}" gradientUnits="userSpaceOnUse" cx="${cx}" cy="${cy}" r="${rx}" gradientTransform="translate(${cx} ${cy}) scale(1 ${ry / rx}) translate(${-cx} ${-cy})">${st}</radialGradient>`;
      }
      rects += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#${id})"/>`;
    });
    return {defs, rects};
  }
  function thumbSvg(id, dark){
    L.setAnim(null);
    const v = L.buildSceneAt(sceneOf(id), dark, TH_W, TH_H, true);
    const sky = cssToSvg(v.sky, 0, 0, TH_W, TH_H, "g"), band = v.band.h ? cssToSvg(v.band.bg, 0, v.band.top, TH_W, v.band.h, "b") : {defs: "", rects: ""};
    let defs = sky.defs + band.defs, body = sky.rects + band.rects;
    ["far", "refl", "mid", "near"].forEach(n => {
      const Ly = v[n]; let inner = "";
      "abcdefghijklmnop".split("").forEach(key => { if (Ly[key].d) inner += `<path d="${Ly[key].d}" fill="${Ly[key].c}"/>`; });
      ["s", "t"].forEach(key => { if (Ly[key].d) inner += `<path d="${Ly[key].d}" fill="none" stroke="${Ly[key].c}" stroke-width="${Ly[key].w}" stroke-linecap="round" stroke-linejoin="round"/>`; });
      if (!inner) return;
      if (Ly.blur) { defs += `<filter id="f${n}" filterUnits="userSpaceOnUse" x="-60" y="-60" width="${TH_W + 120}" height="${TH_H + 120}"><feGaussianBlur stdDeviation="${Ly.blur / 2}"/></filter>`; body += `<g filter="url(#f${n})">${inner}</g>`; }
      else body += inner;
    });
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${TH_W} ${TH_H}" preserveAspectRatio="xMidYMid slice"><defs>${defs}</defs>${body}</svg>`;
  }
  function thumbUrl(id, dark){
    const key = id + (dark ? ":d" : ":l");
    if (!thumbs.has(key)) {
      const svg = thumbSvg(id, dark);
      let url; try { url = URL.createObjectURL(new Blob([svg], {type: "image/svg+xml"})); } catch (e) { url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg); }
      thumbs.set(key, url);
    }
    return thumbs.get(key);
  }
  // Style Shop previews before the library is here
  function fillThumbs(){
    document.querySelectorAll("img[data-scn-thumb]").forEach(im => {
      const [id, dk] = im.dataset.scnThumb.split("|"); im.removeAttribute("data-scn-thumb");
      try { im.src = thumbUrl(id, dk === "1"); } catch (e) { console.warn("scene thumb " + id, e); }
    });
  }
  hook("thumb", (id, dark) => {
    if (!isScene(id)) return;
    if (!L.ready()) { L.load().then(ok => { if (ok) fillThumbs(); }); return `<span class="sp-art sc-thumb"><img alt="" decoding="async" data-scn-thumb="${esc(id)}|${dark ? 1 : 0}"></span>`; }
    try { return `<span class="sp-art sc-thumb"><img alt="" decoding="async" src="${thumbUrl(id, !!dark)}"></span>`; }
    catch (e) { console.warn("scene thumb " + id, e); return; }
  });
})();



