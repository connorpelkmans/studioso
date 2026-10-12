/* New theme ideas, batch n16: saguaro (Saguaro Sunset).
   Registered like the Study Fields themes (MAJ_THEMES), but in the Style Shop's "New Theme Ideas" group. */
(() => {
  const lg = (a, b) => `linear-gradient(180deg,${a},${b})`, lg2 = (a, b) => `linear-gradient(135deg,${a},${b})`;
  const r1 = n => Math.round(n * 100) / 100;
  const circ = (x, y, r) => `M${r1(x - r)} ${r1(y)}a${r1(r)} ${r1(r)} 0 1 0 ${r1(2 * r)} 0a${r1(r)} ${r1(r)} 0 1 0 ${r1(-2 * r)} 0Z`;
  const NOTES = ["#FFF3B8", "#D9F0D8", "#D6E6FF", "#FFD9C8", "#EBD9FF"];
  // a saguaro silhouette: a column with two J-shaped arms
  const cactus = "M-2.6 11V-8.4A2.6 2.6 0 0 1 2.6 -8.4V11ZM-2.4 2.4H-5.4A2.8 2.8 0 0 1 -8.2 -0.4V-4.6A1.8 1.8 0 0 1 -4.6 -4.6V-1.2H-2.4ZM2.4 -0.4H5A2.4 2.4 0 0 0 7.4 -2.8V-6.4A1.7 1.7 0 0 0 4 -6.4V-3.4H2.4Z";
  const petals = n => Array.from({length: n}, (_, i) => { const a = i * 2 * Math.PI / n, x = r1(Math.cos(a) * 5.6), y = r1(Math.sin(a) * 5.6); return `M${x} ${y}m-3.8 0a3.8 3.8 0 1 0 7.6 0a3.8 3.8 0 1 0 -7.6 0Z`; }).join("");
  Object.assign(FX_SHAPES, {
    n16cactus: {d: cactus},
    n16bloom: {d: petals(8), detail: circ(0, 0, 3.2), dfill: true},
  });

  MAJ_THEMES.push({
    skin: {id: "saguaro", name: "Saguaro Sunset", group: "ideas", desc: "Sonoran desert saguaros under a blazing orange-pink sky.",
      light: ["#FBF1EC", "rgba(200,70,80,.10)", "#FFFFFF", "#3A1E28", "#7A5A62", "#EED6CE", "#F6E4DC", "#FFFAF7", "#C8463A", "#DA6A4A", "#FFFFFF", "#7A2418", "#4E3268", "#F6D4C8", "#FFE0A8"],
      dark: ["#0A0A1E", "rgba(255,200,170,.08)", "#141632", "#F2EEF8", "#B4AECA", "#2A2A4C", "#1C1C3C", "#0E0E26", "#F4A07A", "#F7BC96", "#1A0E18", "#8A4A3A", "#0A0A1E", "#D8D2EA", "#5A3A4A"],
      glow: ["linear-gradient(180deg,#8A4A98,#F87C60 50%,#B4604E)", "linear-gradient(180deg,#04061A,#4A3266 55%,#221C34)"],
      spine: [lg("#6A3A6E", "#3E2448"), lg("#1E1E4A", "#0A0A22")], btn: [lg2("#C8463A", "#E8784A"), lg2("#F4A07A", "#F7C496")]},
    kit: {motif: "n16cactus", card: ["#FFF8F2", "#F8E2D6"], ink: "#3A1E28", bd: "#EAC8B8", mc: "#4E7A44", r: 14, notes: ["#FFE0C8"].concat(NOTES), shape: "torn", pin: "tape", fab: "999px", btn: "12px"},
    fx: {spawn: (W, H, d, n) => fxBurst(W, H, n(24), "n16bloom", d ? ["#F2F0FF", "#E4E0F8"] : ["#FFFFFF", "#FFF6E0"], [[0.15, 1.02], [0.85, 1.02], [0.5, 1.04]], {smin: 10, smax: 15}).map(p => Object.assign(p, {vr: fxR(-0.06, 0.06)}))
      .concat(fxBurst(W, H, n(14), "n16cactus", d ? ["#5A8A6A", "#7AA27E"] : ["#4E7A44", "#6A9A52"], [[0.25, 1.02], [0.75, 1.02]], {smin: 12, smax: 16}),
        fxFall(W, H, n(40), "petal", d ? ["#F4A07A", "#E8D8F8", "#C8B0E8"] : ["#F87C60", "#FFB25A", "#D4588A"], {sway: 2, flip: true, smin: 6, smax: 10, vmin: 0.9, vmax: 1.7}),
        fxTw(W, H, n(24), "sparkle", d ? ["#FFF0D8", "#FFFFFF"] : ["#FFD06A", "#FFE6A0"], {smin: 3, smax: 6, glow: d ? 10 : 4}))},
    tag: "The Sonoran desert at sunset: tall many-armed saguaros, ocotillo, prickly pear and brittlebush in bloom, red rocks and purple ranges under a blazing orange-pink sky; a starry desert night with a moonrise"
  });
})();
