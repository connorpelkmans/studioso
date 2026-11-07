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
  // color helpers for the painted sprites below
  const hx3 = c => { const v = parseInt(c.slice(1), 16); return [v >> 16 & 255, v >> 8 & 255, v & 255]; };
  const mix = (a, b, t) => { const A = hx3(a), B = hx3(b); return "#" + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, "0")).join(""); };
  const P2 = s => new Path2D(s);
  const ellP = (g, x, y, rx, ry, r = 0) => { g.beginPath(); g.ellipse(x, y, rx, ry, r, 0, 6.3); };
  // soft light from the top left on whatever was just painted
  const sheen = (g, a = 0.32, b = 0.22) => { g.save(); g.globalCompositeOperation = "source-atop"; const gr = g.createLinearGradient(-8, -10, 8, 10); gr.addColorStop(0, `rgba(255,255,255,${a})`); gr.addColorStop(0.45, "rgba(255,255,255,0)"); gr.addColorStop(1, `rgba(0,0,0,${b})`); g.fillStyle = gr; g.fillRect(-13, -13, 26, 26); g.restore(); };
  // koi seen from above, head toward +x; the color picks the variety
  const KOI_BODY = "M10.8 0C10.6 -2.4 7.8 -3.7 4 -3.7C-0.8 -3.7 -4.6 -2.1 -7.2 -0.8L-7.6 0L-7.2 0.8C-4.6 2.1 -0.8 3.7 4 3.7C7.8 3.7 10.6 2.4 10.8 0Z";
  const KOI_TAIL = "M-6.6 0C-8.4 -1.2 -10.2 -4.6 -12 -5.6C-11.4 -2.8 -10.9 -1.1 -10.3 0C-10.9 1.1 -11.4 2.8 -12 5.6C-10.2 4.6 -8.4 1.2 -6.6 0Z";
  const KOI_FINS = "M5.2 -3.4C4 -6.6 1.4 -8.4 -0.8 -8.2C0.6 -6.4 1.6 -4.6 2.2 -3.6Z M5.2 3.4C4 6.6 1.4 8.4 -0.8 8.2C0.6 6.4 1.6 4.6 2.2 3.6Z M-1.8 -2.7C-3 -4.6 -4.6 -5.4 -5.8 -5.2C-4.8 -4.2 -4.1 -3.2 -3.8 -2.2Z M-1.8 2.7C-3 4.6 -4.6 5.4 -5.8 5.2C-4.8 4.2 -4.1 3.2 -3.8 2.2Z";
  const KOI = {
    "#F7F3EC": {base: "#FBF8F2", fin: "#FFFFFF", spots: [["#E2432C", 5.4, 0, 3.1, 2.8], ["#E2432C", 0, 0.5, 2.9, 2.7], ["#D93A26", -4.4, -0.4, 2, 1.8]]}, // kohaku
    "#F3EEE6": {base: "#FBF8F3", fin: "#FFFFFF", spots: [["#E04A2E", 4.6, -0.3, 2.8, 2.6], ["#E04A2E", -1.6, 0.4, 2.6, 2.4], ["#1E1A20", 1.2, -2, 1, 0.8], ["#1E1A20", -4.4, 1.2, 0.9, 0.7], ["#1E1A20", 3, 2.2, 0.8, 0.6]]}, // sanke
    "#2A2630": {base: "#25212A", fin: "#EFE8E0", spots: [["#E04A2E", 5.6, 0.2, 2.6, 2.6], ["#E04A2E", -0.4, -0.8, 2.6, 2], ["#F6F2EC", 2, 1.8, 1.8, 1.2], ["#F6F2EC", -4.6, 0.4, 1.4, 1]]}, // showa
    "#EFB23A": {base: "#F2B53E", fin: "#F6CF72", spots: [["#FFE7A0", 4.6, -1.2, 3.6, 1.2]]}, // ogon
    "#FAF7F2": {base: "#FCFAF6", fin: "#FFFFFF", spots: [["#E2432C", 6.6, 0, 1.9, 1.9]]}, // tancho
    "#EE7A34": {base: "#F07E36", fin: "#F6A066", spots: [["#FFF4E8", 6.4, 0, 2.6, 2.6], ["#FFB27A", -1, -1, 3, 1]]} // orange
  };
  const KOI_C = Object.keys(KOI);
  const paintKoi = (g, c) => { const k = KOI[c] || {base: c, fin: mix(c, "#FFFFFF", 0.4), spots: []}, body = P2(KOI_BODY);
    g.save(); g.globalAlpha = 0.72; g.fillStyle = k.fin; g.fill(P2(KOI_FINS)); g.fill(P2(KOI_TAIL)); g.globalAlpha = 0.35; g.strokeStyle = mix(k.base === "#25212A" ? "#888088" : k.base, "#000000", 0.35); g.lineWidth = 0.25;
    g.beginPath(); for (let i = -2; i <= 2; i++) { g.moveTo(-7.4, 0); g.lineTo(-11.4, i * 2.2); g.moveTo(3.2, -3.8); g.lineTo(0.4 - i * 0.6, -7.4); g.moveTo(3.2, 3.8); g.lineTo(0.4 - i * 0.6, 7.4); } g.stroke(); g.restore();
    g.save(); g.fillStyle = k.base; g.fill(body); g.clip(body); k.spots.forEach(([col, x, y, rx, ry]) => { g.fillStyle = col; ellP(g, x, y, rx, ry, 0.3); g.fill(); });
    const gr = g.createLinearGradient(0, -4.2, 0, 4.2); gr.addColorStop(0, "rgba(0,0,0,.22)"); gr.addColorStop(0.32, "rgba(255,255,255,.18)"); gr.addColorStop(0.5, "rgba(255,255,255,0)"); gr.addColorStop(1, "rgba(0,0,0,.26)"); g.fillStyle = gr; g.fillRect(-12, -5, 24, 10);
    g.fillStyle = "rgba(255,255,255,.28)"; ellP(g, 1, -0.6, 6, 0.5); g.fill(); g.restore();
    g.strokeStyle = "rgba(20,40,40,.25)"; g.lineWidth = 0.3; g.stroke(body);
    g.fillStyle = "#16141A"; ellP(g, 8.2, -2.3, 0.55, 0.5); g.fill(); ellP(g, 8.2, 2.3, 0.55, 0.5); g.fill(); };
  // a hot air balloon: striped gores, a trim band, ropes and a wicker basket
  const ENV = "M0 -11.4C6.4 -11.4 9 -6.8 9 -3C9 1.2 4.6 4.4 2.6 6.2L-2.6 6.2C-4.6 4.4 -9 1.2 -9 -3C-9 -6.8 -6.4 -11.4 0 -11.4Z";
  const paintHotair = (g, c) => { const env = P2(ENV), lt = mix(c, "#FFFFFF", 0.62);
    g.save(); g.fillStyle = c; g.fill(env); g.clip(env); [[0.74, lt], [0.46, c], [0.18, lt]].forEach(([k, col]) => { g.fillStyle = col; ellP(g, 0, -2.4, 9 * k, 10.2); g.fill(); });
    g.fillStyle = fxShade(c, 0.72); g.fillRect(-10, 2.2, 20, 1.3); g.restore(); sheen(g, 0.36, 0.24);
    g.fillStyle = fxShade(c, 0.6); g.beginPath(); g.moveTo(-2.6, 6.1); g.lineTo(2.6, 6.1); g.lineTo(1.7, 7.6); g.lineTo(-1.7, 7.6); g.fill();
    g.strokeStyle = "#5A4636"; g.lineWidth = 0.35; g.beginPath(); g.moveTo(-1.6, 7.6); g.lineTo(-1.9, 9.2); g.moveTo(1.6, 7.6); g.lineTo(1.9, 9.2); g.stroke();
    g.fillStyle = "#A0703F"; g.fillRect(-2.2, 9.1, 4.4, 2.6); g.fillStyle = "#7A5230"; g.fillRect(-2.2, 9.1, 4.4, 0.6); g.fillRect(-2.2, 10.6, 4.4, 0.35); };
  // a paraglider seen from the front: an arched wing of cells, lines down to the pilot
  const WING = "M-11.4 -3.4Q0 -15.6 11.4 -3.4L10 -2.2Q0 -12.4 -10 -2.2Z";
  const paintGlider = (g, c, d) => { const w = P2(WING), lt = mix(c, "#FFFFFF", 0.7), pc = d ? "#E4E0F2" : "#2E2A36";
    g.strokeStyle = d ? "rgba(225,228,245,.55)" : "rgba(60,64,80,.6)"; g.lineWidth = 0.22; g.beginPath(); [-10.6, -6.4, -2.2, 2.2, 6.4, 10.6].forEach(x => { g.moveTo(x, -2.8 - (11 - Math.abs(x)) * 0.5); g.lineTo(0, 6.4); }); g.stroke();
    g.save(); g.fillStyle = c; g.fill(w); g.clip(w); for (let i = 0; i < 7; i++) if (i % 2) { g.fillStyle = lt; g.fillRect(-11.4 + i * 3.26, -13, 3.26, 12); } g.fillStyle = fxShade(c, 0.66); g.fillRect(-12, -13, 2.4, 12); g.fillRect(9.6, -13, 2.4, 12); g.restore(); sheen(g, 0.3, 0.2);
    g.fillStyle = pc; ellP(g, 0, 6.8, 1.1, 1.1); g.fill(); g.fillStyle = fxShade(c, 0.75); g.beginPath(); g.moveTo(-1.4, 7.8); g.lineTo(1.4, 7.8); g.lineTo(1.1, 10.4); g.lineTo(-1.1, 10.4); g.fill(); g.fillStyle = pc; g.fillRect(-1, 10.3, 0.7, 1.5); g.fillRect(0.3, 10.3, 0.7, 1.5); };
  // edelweiss: felted white star petals around a cluster of little yellow heads
  const paintEdel = (g, c, d) => { const rim = d ? "rgba(150,170,150,.8)" : "#9AAE96"; g.lineWidth = 0.45; g.strokeStyle = rim;
    for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283 + (i % 2) * 0.12, L = i % 2 ? 9.6 : 11; g.save(); g.rotate(a); g.beginPath(); g.moveTo(1.6, -1.6); g.quadraticCurveTo(L * 0.55, -3.4, L, 0); g.quadraticCurveTo(L * 0.55, 3.4, 1.6, 1.6); g.closePath(); g.fillStyle = c; g.fill(); g.stroke(); g.fillStyle = "rgba(150,175,140,.35)"; ellP(g, L - 1.6, 0, 1.6, 0.9); g.fill(); g.restore(); }
    g.fillStyle = "#E8B83A"; ellP(g, 0, 0, 3, 3); g.fill(); g.fillStyle = "#F8DC6A"; [[-1, -1], [1.1, -0.8], [0, 1.2], [-1.4, 0.8], [1.3, 1]].forEach(([x, y]) => { ellP(g, x, y, 0.85, 0.85); g.fill(); }); };
  // a rain streak pointing toward +x: fades in from the tail to a bright little bead
  const paintRain = (g, c) => { const gr = g.createLinearGradient(-12, 0, 10, 0); gr.addColorStop(0, mix(c, "#FFFFFF", 0.2) + "00"); gr.addColorStop(1, c); g.strokeStyle = gr; g.lineCap = "round"; g.lineWidth = 1.5; g.beginPath(); g.moveTo(-12, 0); g.lineTo(9, 0); g.stroke(); g.fillStyle = c; ellP(g, 9.6, 0, 1.7, 1.25); g.fill(); g.fillStyle = "rgba(255,255,255,.6)"; ellP(g, 9.9, -0.45, 0.6, 0.4); g.fill(); };
  // a jellyfish: glassy scalloped bell, frilly arms and trailing tentacles
  const BELL = "M-8 1C-8.4 -5.6 -4.6 -9.6 0 -9.6C4.6 -9.6 8.4 -5.6 8 1Q6 2.6 4 1.4Q2 2.8 0 1.4Q-2 2.8 -4 1.4Q-6 2.6 -8 1Z";
  const paintJelly = (g, c, d) => { const bell = P2(BELL), lt = mix(c, "#FFFFFF", 0.55);
    g.lineCap = "round"; g.strokeStyle = c; g.globalAlpha = 0.55; g.lineWidth = 0.45; g.beginPath(); [-6.6, -3.4, 3.4, 6.6].forEach((x, i) => { g.moveTo(x, 1.6); g.bezierCurveTo(x + 1.6, 4.4, x - 1.6, 7.6, x + (i % 2 ? 0.8 : -0.8), 11.6); }); g.stroke();
    g.globalAlpha = 0.7; g.fillStyle = lt; [-1.4, 1.4].forEach(x => { g.beginPath(); g.moveTo(x - 1, 1.6); g.bezierCurveTo(x - 2.6, 4.4, x + 1.4, 6.4, x - 0.6, 10); g.bezierCurveTo(x + 2.2, 7.2, x - 0.6, 4.6, x + 1, 1.6); g.fill(); });
    g.globalAlpha = d ? 0.86 : 0.92; const gr = g.createRadialGradient(-2, -5.6, 0.5, 0, -3, 10.4); gr.addColorStop(0, lt); gr.addColorStop(0.6, c); gr.addColorStop(1, fxShade(c, 0.8)); g.fillStyle = gr; g.fill(bell);
    g.globalAlpha = 0.32; g.fillStyle = "#FFFFFF"; for (let i = 0; i < 4; i++) { g.save(); g.translate(0, -3.4); g.rotate(i * 1.571 + 0.785); g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(2.4, -1.4, 2.8, 0); g.quadraticCurveTo(2.4, 1.4, 0, 0); g.fill(); g.restore(); }
    g.globalAlpha = 0.7; g.beginPath(); g.ellipse(-3.2, -6, 2.6, 1.4, -0.7, 3.4, 5); g.lineWidth = 0.9; g.stroke(); g.globalAlpha = 1; };
  // a bamboo leaf: long and narrow, two-tone across its midrib
  const BLEAF = "M-11.6 0.4C-7 -2.8 3 -3.4 11.6 0C3 2.6 -7 2.6 -11.6 0.4Z";
  const paintBleaf = (g, c) => { const p = P2(BLEAF); g.save(); g.fillStyle = c; g.fill(p); g.clip(p); g.fillStyle = fxShade(c, 0.8); g.fillRect(-12, 0.2, 24, 4); g.restore(); sheen(g, 0.28, 0.18);
    g.strokeStyle = mix(c, "#FFFFFF", 0.45); g.lineWidth = 0.4; g.beginPath(); g.moveTo(-10.4, 0.4); g.quadraticCurveTo(0, 0.1, 10.4, 0); g.stroke(); g.strokeStyle = fxShade(c, 0.6); g.lineWidth = 0.6; g.beginPath(); g.moveTo(-11.6, 0.4); g.lineTo(-12.4, 1.2); g.stroke(); };
  // a honeybee in profile, head toward +x, wings on its back
  const paintBee = (g, c) => { g.fillStyle = "#2A2220"; g.beginPath(); g.moveTo(-6.6, 0.2); g.lineTo(-9, 0.6); g.lineTo(-6.6, 1.2); g.fill();
    const ab = P2("M-7 0.6C-7 -3.4 -3 -4.4 0 -4.2C2.4 -4 3.4 -2.4 3.4 0.4C3.4 3 2 4.4 -1 4.4C-4.4 4.4 -7 3.6 -7 0.6Z"); g.save(); g.fillStyle = c; g.fill(ab); g.clip(ab); g.fillStyle = "#2A2220"; [-5.2, -2.4, 0.4].forEach(x => g.fillRect(x, -5, 1.5, 10)); g.restore(); sheen(g, 0.34, 0.22);
    g.fillStyle = "#3A302A"; ellP(g, 5, 0.2, 2.4, 2.6); g.fill(); g.fillStyle = "#FFFFFF"; ellP(g, 5.9, -0.6, 0.55, 0.55); g.fill();
    g.strokeStyle = "#2A2220"; g.lineWidth = 0.45; g.lineCap = "round"; g.beginPath(); g.moveTo(6.2, -1.8); g.quadraticCurveTo(7.6, -4.4, 9.4, -4.6); g.stroke();
    g.fillStyle = "rgba(235,245,255,.78)"; g.strokeStyle = "rgba(90,110,140,.55)"; g.lineWidth = 0.3; ellP(g, -1.4, -6.6, 4.6, 2.3, -0.35); g.fill(); g.stroke(); ellP(g, 1.2, -5.6, 3.2, 1.7, -0.6); g.fill(); g.stroke(); };
  // a lavender sprig: a slim stem and pairs of buds that shade toward the top
  const paintLav = (g, c) => { g.strokeStyle = "#6E9A54"; g.lineWidth = 0.8; g.lineCap = "round"; g.beginPath(); g.moveTo(0.6, 11.6); g.quadraticCurveTo(-0.6, 4, 0, -10); g.stroke();
    for (let i = 0; i < 7; i++) { const y = -10.2 + i * 2.1, w = 1.2 + i * 0.12; [-1, 1].forEach(s => { g.fillStyle = (i + (s > 0)) % 2 ? c : fxShade(c, 0.78); ellP(g, s * w, y, 1.35, 1.75, s * 0.35); g.fill(); }); }
    g.fillStyle = "rgba(255,255,255,.35)"; for (let i = 0; i < 7; i++) { ellP(g, -1.5 - i * 0.12, -10.6 + i * 2.1, 0.45, 0.6); g.fill(); } };
  // a folded paper plane, nose toward +x
  const paintPlane = (g, c) => { const sh = fxShade(c, 0.78), dk = fxShade(c, 0.6), poly = (pts, col) => { g.fillStyle = col; g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.fill(); };
    poly([[11, -1.2], [-10, 7.2], [-4.6, -0.4]], sh); poly([[-4.6, -0.4], [-6.4, 3.6], [0.6, -0.8]], dk); poly([[11, -1.2], [-10, -8.4], [-4.6, -0.4]], c); sheen(g, 0.3, 0.16);
    g.strokeStyle = "rgba(255,255,255,.55)"; g.lineWidth = 0.35; g.beginPath(); g.moveTo(10.4, -1.3); g.lineTo(-7.6, -5.6); g.stroke(); g.strokeStyle = "rgba(0,0,0,.18)"; g.beginPath(); g.moveTo(11, -1.2); g.lineTo(-4.6, -0.4); g.stroke(); };
  // a lily pad, sometimes with a pink water lily on it
  const paintPad = flower => (g, c) => { const p = P2("M0 0L10.54 -2.36A10.8 10.8 0 1 0 10.54 2.36Z"); g.save(); g.fillStyle = c; g.fill(p); g.clip(p);
    g.strokeStyle = mix(c, "#FFFFFF", 0.3); g.lineWidth = 0.4; g.beginPath(); for (let i = 1; i < 10; i++) { const a = 0.3 + i / 10 * 5.7; g.moveTo(0, 0); g.lineTo(Math.cos(a) * 10, Math.sin(a) * 10); } g.stroke();
    g.strokeStyle = fxShade(c, 0.7); g.lineWidth = 1.2; g.beginPath(); g.arc(0, 0, 10.6, 0.25, 6.05); g.stroke(); g.restore(); sheen(g, 0.24, 0.2);
    if (!flower) return; for (let r = 0; r < 2; r++) for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283 + r * 0.4, L = r ? 4.4 : 6.6; g.save(); g.translate(-2, 0); g.rotate(a); g.fillStyle = r ? "#FFD8E6" : "#F4A2C2"; g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(L * 0.5, -2.2, L, 0); g.quadraticCurveTo(L * 0.5, 2.2, 0, 0); g.fill(); g.restore(); }
    g.fillStyle = "#F6C94A"; ellP(g, -2, 0, 1.4, 1.4); g.fill(); };
  // a slim dash of blown sand
  Object.assign(FX_SHAPES, {
    koifish: {d: KOI_BODY + KOI_TAIL + KOI_FINS, paint: paintKoi},
    lilypad: {d: "M0 0L10.54 -2.36A10.8 10.8 0 1 0 10.54 2.36Z", paint: paintPad(false)},
    lilylotus: {d: "M0 0L10.54 -2.36A10.8 10.8 0 1 0 10.54 2.36Z", paint: paintPad(true)},
    hotair: {d: ENV + "M-2.2 9.1H2.2V11.7H-2.2Z", paint: paintHotair},
    paraglider: {d: WING + "M-1.4 7.8H1.4L1.1 10.4H-1.1Z", paint: paintGlider},
    edelweiss: {d: [0, 1, 2, 3, 4, 5, 6, 7].map(i => { const a = i / 8 * 6.283, c = Math.cos(a), s = Math.sin(a); return `M0 0L${(c * 10 - s * 2).toFixed(2)} ${(s * 10 + c * 2).toFixed(2)}L${(c * 10 + s * 2).toFixed(2)} ${(s * 10 - c * 2).toFixed(2)}Z`; }).join(""), paint: paintEdel},
    rainline: {d: "M-12 -0.7H9.6A1.7 1.7 0 0 1 9.6 0.7H-12Z", paint: paintRain},
    sandgrain: {d: "M-7 0Q-1 -2.2 7 -0.5Q8.2 0 7 0.5Q-1 2.2 -7 0Z"},
    jellyfish: {d: BELL, paint: paintJelly},
    bambooleaf: {d: BLEAF, paint: paintBleaf},
    honeybee: {d: "M-7 0.6C-7 -3.4 -3 -4.4 0 -4.2C2.4 -4 3.4 -2.4 3.4 0.4C3.4 3 2 4.4 -1 4.4C-4.4 4.4 -7 3.6 -7 0.6Z", paint: paintBee},
    lavsprig: {d: "M-0.4 -11H0.4V11.6H-0.4Z", paint: paintLav},
    paperplane: {d: "M11 -1.2L-10 -8.4L-4.6 -0.4L-10 7.2Z", paint: paintPlane}
  });
  // koi glide in slow arcs across the pond, facing where they swim, with ripples spreading on the surface
  let koiRip = [], rainSplash = [];
  const koiSwim = (W, H, n) => Array.from({length: n}, (_, i) => { const left = i % 2 === 0, z = fxR(0.72, 1.12), sp = fxR(1.6, 2.6) * z, vy = fxR(-0.6, 0.6);
    return {shape: "koifish", c: KOI_C[i % KOI_C.length], x: left ? fxR(-80, W * 0.35) : fxR(W * 0.65, W + 80), y: fxR(H * 0.12, H * 0.92), vx: (left ? 1 : -1) * sp, vy, g: -Math.sign(vy) * fxR(0.002, 0.006), z, face: true, wig: fxR(0.09, 0.14),
      size: fxR(18, 25) * z, sway: 0, life: fxR(230, 270), delay: Math.floor(fxR(0, 40)), alpha: 0.72 + 0.28 * Math.min(1, z)}; });
  const lilies = (W, H, n, d) => Array.from({length: n}, (_, i) => { const left = i % 2 === 0;
    return {shape: i % 3 === 1 ? "lilylotus" : "lilypad", c: fxPick(d ? ["#3F7E4C", "#4A8A50"] : ["#5DA05A", "#6FAE60", "#4E9452"]), x: left ? fxR(0.03, 0.22) * W : fxR(0.78, 0.97) * W, y: fxR(0.12, 0.92) * H, vx: fxR(-0.12, 0.12), vy: fxR(-0.08, 0.08), g: 0, z: 2,
      size: fxR(14, 20), rot: fxR(0, 6.3), vr: fxR(-0.003, 0.003), sway: 0, tw: true, life: 250, delay: Math.floor(fxR(0, 20))}; });
  const koiRipples = (g, f, W, H, d) => { const m = Math.min(W, H); g.lineWidth = Math.max(1.2, m / 400); koiRip.forEach(r => { const a = (f - r.t0) / 100; if (a <= 0 || a >= 1) return;
    for (let j = 0; j < 3; j++) { const rr = r.r * (a - j * 0.16); if (rr <= 2) continue; g.strokeStyle = d ? `rgba(200,240,232,${(1 - a) * 0.4 * (1 - j * 0.28)})` : `rgba(40,120,112,${(1 - a) * 0.34 * (1 - j * 0.28)})`; g.beginPath(); g.ellipse(r.x, r.y, rr, rr * 0.82, 0, 0, 6.3); g.stroke(); } }); };
  // the shower: slanted streaks, little splash rings along the bottom, then a rainbow
  const rainFall = (W, H, n, cols) => Array.from({length: n}, () => { const z = fxR(0.6, 1.12), sp = fxR(10, 14) * z;
    return {shape: "rainline", c: fxPick(cols), x: fxR(-W * 0.2, W), y: fxR(-H * 0.5, -20), vx: sp * 0.22, vy: sp, g: 0, z, face: true, size: fxR(11, 15) * z, sway: 0, life: 160, delay: Math.floor(fxR(0, 100)), alpha: 0.6 + 0.4 * Math.min(1, z)}; });
  const RAINBOW = ["#EE5F5B", "#F4A04A", "#F3D35A", "#6CC27A", "#57A6E4", "#9479DE"];
  const rainDraw = (g, f, W, H, d) => { const m = Math.min(W, H);
    g.lineWidth = Math.max(1, m / 500); rainSplash.forEach(s => { const a = (f - s.t0) / 28; if (a <= 0 || a >= 1) return; const rr = s.r * (0.25 + a); g.strokeStyle = d ? `rgba(200,220,250,${(1 - a) * 0.6})` : `rgba(60,110,170,${(1 - a) * 0.5})`; g.beginPath(); g.ellipse(s.x, s.y, rr, rr * 0.3, 0, 0, 6.3); g.stroke(); });
    const k = fxEase((f - 95) / 60), sw = fxEase((f - 95) / 80); if (k <= 0) return; const R = Math.max(W, H) * 0.5, bw = R * 0.042, cx = W / 2, cy = H * 1.04;
    g.globalAlpha = k * (d ? 0.42 : 0.58); g.lineWidth = bw + 0.5; RAINBOW.forEach((col, i) => { g.strokeStyle = col; g.beginPath(); g.arc(cx, cy, R - i * bw, Math.PI, Math.PI + Math.PI * sw); g.stroke(); }); };
  // blown sand: grains streak along with the wind, and soft ribbons of sand sweep off the dune crests
  const sandGust = (W, H, n, cols) => Array.from({length: n}, () => { const z = fxR(0.6, 1.15); return {shape: "sandgrain", c: fxPick(cols), x: fxR(-W * 0.5, -10), y: fxR(H * 0.18, H * 1.02), vx: fxR(6, 10) * z, vy: fxR(-0.9, 0.2), g: 0.004, z, face: true,
    size: fxR(7, 11) * z, sway: 0, life: 230, delay: Math.floor(fxR(0, 120)), alpha: 0.65 + 0.35 * Math.min(1, z)}; });
  const sandRibbons = (g, f, W, H, d) => { const sp = W * 1.9 / 170, L = W * 0.55; g.lineCap = "round";
    for (let i = 0; i < 7; i++) { const t0 = i * 17, head = -W * 0.2 + (f - t0) * sp, tail = head - L; if (head < 0 || tail > W) continue; const y0 = H * (0.26 + ((i * 0.37) % 1) * 0.68), ph = i * 1.9, a = d ? 0.5 : 0.55;
      const gr = g.createLinearGradient(tail, 0, head, 0), col = d ? "255,224,168" : "176,108,52"; gr.addColorStop(0, `rgba(${col},0)`); gr.addColorStop(0.7, `rgba(${col},${a})`); gr.addColorStop(1, `rgba(${col},0)`);
      g.strokeStyle = gr; const lw = Math.max(1.6, Math.min(W, H) / 260); for (let k = 0; k < 3; k++) { g.lineWidth = lw * (k === 1 ? 2.2 : 1); g.globalAlpha = k === 1 ? 1 : 0.7; g.beginPath();
      for (let x = Math.max(-20, tail), s = 0; x <= Math.min(W + 20, head) + 16; x += 16, s++) { const y = y0 + (k - 1) * lw * 4 * (1 + Math.sin(x / 90 + k)) + Math.sin(x / (W * 0.16) + ph) * H * 0.035 - (x - tail) / L * H * 0.03; s ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); } } };
  // sunlight slanting down through the bamboo
  const bambooBeams = (g, f, W, H, d) => { const k = fxEase(f / 60) * (1 - fxEase((f - 170) / 80)); if (k <= 0) return;
    const T = g.getTransform(), col = d ? "246,226,150" : "255,252,222", a = d ? 0.15 : 0.5; [[0.12, 0.14], [0.42, 0.09], [0.7, 0.16]].forEach(([x0, w], i) => { const ww = W * w, gr = g.createLinearGradient(0, 0, ww, 0);
      gr.addColorStop(0, `rgba(${col},0)`); gr.addColorStop(0.5, `rgba(${col},${a})`); gr.addColorStop(1, `rgba(${col},0)`);
      g.setTransform(T); g.transform(1, 0, 0.5, 1, 0, 0); g.translate(W * x0 + Math.sin(f / 70 + i * 2) * W * 0.012, 0); g.globalAlpha = k * (1 - i * 0.15); g.fillStyle = gr; g.fillRect(0, 0, ww, H); }); };
  // bees zig across the lavender, facing their flight
  const bees = (W, H, n) => Array.from({length: n}, (_, i) => { const left = i % 2 === 0, vy = fxR(-0.7, 0.5);
    return {shape: "honeybee", c: "#F2B92E", x: left ? fxR(-50, -10) : W + fxR(10, 50), y: fxR(H * 0.25, H * 0.85), vx: (left ? 1 : -1) * fxR(2.2, 3.4) * Math.max(0.6, Math.min(1, W / 900)), vy, g: -Math.sign(vy) * fxR(0.006, 0.014), face: true, wig: 0.16, size: fxR(11, 14), sway: 0, life: 260, delay: Math.floor(fxR(0, 90))}; });
  // paper planes glide up and over in long arcs, facing their flight
  const paperPlanes = (W, H, n, cols) => Array.from({length: n}, (_, i) => { const lr = i % 3 !== 2, z = fxR(0.75, 1.1), sp = fxR(3.4, 4.8) * z * Math.max(0.6, Math.min(1, W / 900)), a = -fxR(0.25, 0.6);
    return {shape: "paperplane", c: fxPick(cols), x: lr ? fxR(-60, W * 0.3) : fxR(W * 0.7, W + 60), y: fxR(H * 0.6, H + 40), vx: (lr ? 1 : -1) * Math.cos(a) * sp, vy: Math.sin(a) * sp, g: 0.012 * z, z, face: true, wig: 0.03, size: fxR(14, 20) * z, sway: 0, life: 250, delay: Math.floor(fxR(0, 80))}; });
  Object.assign(THEME_FX, {
    balloons: {spawn: (W, H, d, n) => fxRise(W, H, n(16), "hotair", d ? ["#E8806C", "#F0B85A", "#5BBDBD", "#9A8AE0", "#EE9AB0"] : ["#E3735F", "#EDB64C", "#3F9FA2", "#8A76D6", "#E98AA2"], {smin: 15, smax: 26, vmin: 0.9, vmax: 1.9, sway: 0.7, rock: 0.07, life: 300, glow: d ? 8 : 0})
      .concat(fxTw(W, H, n(22), "sparkle", d ? ["#FFE3A8", "#FFFFFF"] : ["#F2B53A", "#FFFFFF"], {smin: 3, smax: 6, glow: d ? 10 : 6}))},
    koi: {spawn: (W, H, d, n) => { const m = Math.min(W, H); koiRip = Array.from({length: 7}, (_, i) => ({x: fxR(0.12, 0.88) * W, y: fxR(0.15, 0.88) * H, t0: 8 + i * 22 + fxR(0, 10), r: fxR(0.09, 0.15) * m}));
      return koiSwim(W, H, n(10)).concat(lilies(W, H, n(5), d), fxTw(W, H, n(16), "sparkle", d ? ["#E6F4F1", "#FFFFFF"] : ["#FFFFFF", "#BFE6DE"], {smin: 3, smax: 6, glow: d ? 8 : 6})); },
      draw: koiRipples},
    rain: {spawn: (W, H, d, n) => { rainSplash = Array.from({length: 46}, () => ({x: fxR(0, W), y: H * fxR(0.82, 0.99), t0: fxR(30, 150), r: fxR(10, 20) * Math.max(0.8, Math.min(W, H) / 600)}));
      return rainFall(W, H, n(120), d ? ["#B4CCF0", "#D6E4F8", "#9CB8E0"] : ["#4F86C0", "#6A9AD2", "#3A6FA8"]).concat(fxTw(W, H, n(12), "sparkle", d ? ["#FFFFFF", "#FFE7B0"] : ["#FFFFFF", "#F6D27A"], {top: 0.6, smin: 3, smax: 6, spread: 60, glow: 8}).map(p => Object.assign(p, {delay: p.delay + 120}))); },
      draw: rainDraw},
    alpine: {spawn: (W, H, d, n) => Array.from({length: n(7)}, (_, i) => { const left = i % 2 === 0, z = fxR(0.7, 1.1);
        return {shape: "paraglider", c: fxPick(d ? ["#F07A6A", "#F2C45A", "#6FC2F0", "#B49CF4", "#5ED6B0"] : ["#E2533E", "#F2A830", "#2F86C8", "#8A5BD0", "#20A688"]), x: left ? fxR(-40, W * 0.45) : fxR(W * 0.55, W + 40), y: fxR(H * 0.08, H * 0.5), vx: (left ? 1 : -1) * fxR(0.8, 1.5) * z, vy: fxR(0.15, 0.4) * z, g: 0, z,
          size: fxR(26, 36) * z, sway: 0.5, swf: 0.02, rock: 0.08, life: 280, delay: Math.floor(fxR(0, 50)), alpha: 0.7 + 0.3 * Math.min(1, z)}; })
      .concat(fxFall(W, H, n(26), "edelweiss", d ? ["#F4F1E8", "#FFFFFF"] : ["#FFFFFF", "#FAF8F0"], {vmin: 0.8, vmax: 1.5, sway: 1.3, smin: 9, smax: 13, rock: 0.5}), fxTw(W, H, n(16), "sparkle", d ? ["#FFFFFF", "#DCE9FF"] : ["#FFFFFF", "#9CC2F0"], {top: 0.7, smin: 3, smax: 6, glow: 8}))},
    dunes: {spawn: (W, H, d, n) => sandGust(W, H, n(100), d ? ["#F2D09A", "#FFE7B8", "#E7B777"] : ["#B9783E", "#A8642E", "#CF9256"])
      .concat(fxTw(W, H, n(20), "sparkle", d ? ["#FFE7B8", "#FFFFFF"] : ["#FFFFFF", "#F2B53A"], {smin: 3, smax: 7, top: 0.7, glow: d ? 10 : 6})), draw: sandRibbons},
    jelly: {len: 300, spawn: (W, H, d, n) => fxRise(W, H, n(14), "jellyfish", d ? ["#6FE6F8", "#B89CFF", "#FF9CD8"] : ["#E07AB0", "#9C7CEA", "#3FA6C6"], {smin: 20, smax: 30, vmin: 1.3, vmax: 2.3, sway: 1, rock: 0.1, glow: d ? 14 : 0, life: 300})
      .concat(fxRise(W, H, n(36), "bubble", d ? ["#9FF7FF", "#E8F7FC"] : ["#FFFFFF", "#BFE6F0"], {smin: 3, smax: 7, sway: 1, vmin: 1.6, vmax: 3}))},
    bamboo: {spawn: (W, H, d, n) => fxFall(W, H, n(46), "bambooleaf", d ? ["#7CBF62", "#9CCB8C", "#5E9E4A"] : ["#4E8A34", "#64A23A", "#8CC152", "#3E7A2A"], {sway: 2, flip: true, smin: 12, smax: 18}).map(p => Object.assign(p, {vx: fxR(0.8, 2), x: p.x - W * 0.2}))
      .concat(fxTw(W, H, n(20), "circle", d ? ["#F0CF7A", "#F6DF9E"] : ["#FFF6C8", "#F2E7A0"], {smin: 2.4, smax: 4.4, glow: 12, vy: -0.3})), draw: bambooBeams},
    lavenderfields: {spawn: (W, H, d, n) => bees(W, H, n(8))
      .concat(fxBurst(W, H, n(28), "lavsprig", d ? ["#B9A2FF", "#C8B4F4", "#9A7BE0"] : ["#8A5BC0", "#9E74D6", "#7048B0"], [[0.12, 1.02], [0.88, 1.02], [0.5, 1.04]], {smin: 15, smax: 20, flip: true}).map(p => Object.assign(p, {vx: p.vx * 0.8, vy: p.vy * 0.8, g: 0.15, term: fxR(1.3, 1.9), fsw: fxR(0.8, 1.4), life: 280})),
        fxFlutter(W, H, n(4), d ? ["#F6C7A6", "#FFFFFF", "#D8CCF0"] : ["#F2C84A", "#C9A0E8", "#8FC7F2"]))},
    rooftops: {spawn: (W, H, d, n) => paperPlanes(W, H, n(9), d ? ["#FFFFFF", "#FFE9BC", "#DCD6F0"] : ["#FFFFFF", "#F6E6D0", "#E0E8F6"])
      .concat(fxTw(W, H, n(30), d ? "pixel" : "sparkle", d ? ["#FFD27F", "#FFE3A8"] : ["#F2B53A", "#FFD86B"], {smin: 2.5, smax: 5, glow: d ? 10 : 4}))}
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

  // The screen's full height for this width: the keyboard shrinking the app (or a toolbar showing) never redraws or squashes
  // the scene; the keyboard just covers its lower part
  let fullW = 0, fullH = 0;
  function screenH(){
    if (innerWidth !== fullW) { fullW = innerWidth; fullH = innerHeight; }
    else if (!document.documentElement.classList.contains("kb-open")) fullH = Math.max(fullH, innerHeight);
    document.documentElement.style.setProperty("--sb-full-h", fullH + "px");
    return fullH;
  }
  function geometry(){
    const nav = document.querySelector("nav.tabs"), r = nav && nav.getBoundingClientRect(), IH = screenH();
    const side = r && r.left < 4 && r.height > IH * 0.6 ? Math.round(r.right) : 0;
    const floating = r && r.left >= 4 && r.right <= innerWidth - 4;
    const foot = r && !side && !floating && r.top > IH * 0.6 ? Math.max(0, Math.round(innerHeight - r.top - 4)) : 0;
    const W = Math.max(1, innerWidth - side), H = Math.max(1, IH - foot), desk = W / H >= 0.9;
    const k = Math.max(0.8, Math.min(3, desk ? Math.min(W / 1200, H / 800) : Math.min(W / 390, H / 760)));
    return {side, foot, W, H, desk, k, bw: Math.round(W / k), bh: Math.round(H / k)};
  }
  const sigOf = (id, dk, g) => [id, dk, g.side, g.foot, g.W, g.H].join("|");

  let blurN = 0;
  function layerHtml(Ly, pad, v, k){
    let inner = "";
    "abcdefghijklmnopABCDEFGHIJKLMNOP".split("").forEach(key => { if (Ly[key] && Ly[key].d) inner += `<path d="${Ly[key].d}" fill="${Ly[key].c}"/>`; });
    ["s", "t"].forEach(key => { if (Ly[key].d) inner += `<path d="${Ly[key].d}" fill="none" stroke="${Ly[key].c}" stroke-width="${Ly[key].w}" stroke-linecap="round" stroke-linejoin="round"/>`; });
    if (!inner) return "";
    const box = pad ? `left:${-40 * k}px;top:${-40 * k}px;width:${v.pw * k}px;height:${v.phh * k}px` : `left:0;top:0;width:${v.bw * k}px;height:${v.bh * k}px`;
    if (!Ly.blur) return `<svg class="sc-l" viewBox="${pad ? v.vbPad : v.vb}" preserveAspectRatio="none" style="${box}">${inner}</svg>`;
    // the blur covers the whole scene, not just what the layer holds: a layer with one soft glow on it (Northern Lights' sun in
    // light mode) had its blur cut off in a square around it
    const fid = "scb" + (++blurN);
    return `<svg class="sc-l" viewBox="${pad ? v.vbPad : v.vb}" preserveAspectRatio="none" style="${box}"><defs><filter id="${fid}" filterUnits="userSpaceOnUse" x="-10%" y="-10%" width="120%" height="120%" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="${Ly.blur.toFixed(2)}"/></filter></defs><g filter="url(#${fid})">${inner}</g></svg>`;
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
    const planned = F.ranked.filter(x => x.alloc > 0 && !x.t.xs).map(x => x.t.id);
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
  function thumbSvg(id, dark, W, H){
    const TH_W = W || 640, TH_H = H || 400;
    L.setAnim(null);
    const v = L.buildSceneAt(sceneOf(id), dark, TH_W, TH_H, true);
    const sky = cssToSvg(v.sky, 0, 0, TH_W, TH_H, "g"), band = v.band.h ? cssToSvg(v.band.bg, 0, v.band.top, TH_W, v.band.h, "b") : {defs: "", rects: ""};
    let defs = sky.defs + band.defs, body = sky.rects + band.rects;
    ["far", "refl", "mid", "near"].forEach(n => {
      const Ly = v[n]; let inner = "";
      "abcdefghijklmnopABCDEFGHIJKLMNOP".split("").forEach(key => { if (Ly[key] && Ly[key].d) inner += `<path d="${Ly[key].d}" fill="${Ly[key].c}"/>`; });
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
  // A theme's scene as a picture of any size (the calculator's faceplate, 99-calculator.js); null when it has none
  window.SBSCENE = {has: isScene, load: () => L.ready() ? Promise.resolve(true) : L.load(), svg: (id, dark, w, h) => isScene(id) && L.ready() ? thumbSvg(id, !!dark, w, h) : null};
  hook("thumb", (id, dark) => {
    if (!isScene(id)) return;
    if (!L.ready()) { L.load().then(ok => { if (ok) fillThumbs(); }); return `<span class="sp-art sc-thumb"><img alt="" decoding="async" data-scn-thumb="${esc(id)}|${dark ? 1 : 0}"></span>`; }
    try { return `<span class="sp-art sc-thumb"><img alt="" decoding="async" src="${thumbUrl(id, !!dark)}"></span>`; }
    catch (e) { console.warn("scene thumb " + id, e); return; }
  });
})();



