/* New theme ideas, batch n7: saltflats (Mirror Flats).
   Registered like the Study Fields themes (MAJ_THEMES), but in the Style Shop's "New Theme Ideas" group. */
(() => {
  const lg = (a, b) => `linear-gradient(180deg,${a},${b})`, lg2 = (a, b) => `linear-gradient(135deg,${a},${b})`;
  const r1 = n => Math.round(n * 100) / 100;
  const hex = (r, rot) => { let d = ""; for (let i = 0; i < 6; i++) { const a = rot + i * Math.PI / 3; d += (i ? "L" : "M") + r1(r * Math.cos(a)) + " " + r1(r * Math.sin(a)); } return d + "Z"; };
  const NOTES = ["#FFF3B8", "#D9F0D8", "#D6E6FF", "#FFD9C8", "#EBD9FF"];
  Object.assign(FX_SHAPES, {
    // a hexagon of salt crust
    n7salt: {d: hex(10.5, 0), detail: hex(6.4, 0), dstroke: true},
    // a little puffy cloud
    n7cloud: {d: "M-10.5 5C-12.5 5 -12.5 0 -9 -0.5C-9 -5 -4 -7 -1 -4.5C1 -9 8.5 -8 8.6 -2.5C12 -2.4 12.4 5 9 5Z"}
  });
  // soft rings spreading over the lower half of the page, like ripples on still water (frames f)
  const rings = (g, f, W, H, d) => { if (f > 230) return; [0, 34, 68].forEach((o, i) => { const k = (f - o) / 160; if (k <= 0 || k >= 1) return; g.save(); g.globalAlpha = (1 - k) * (d ? 0.4 : 0.55); g.strokeStyle = d ? "#C8C0FF" : "#FFFFFF"; g.lineWidth = 2.4 - i * 0.5;
    g.beginPath(); g.ellipse(W * 0.5, H * 0.86, Math.max(1, k * W * 0.55), Math.max(1, k * H * 0.1), 0, 0, 7); g.stroke(); g.restore(); }); };

  MAJ_THEMES.push({
    skin: {id: "saltflats", name: "Mirror Flats", group: "ideas", desc: "A white salt flat under a thin sheet of water that mirrors the whole sky.",
      light: ["#F6F2F8", "rgba(150,120,190,.10)", "#FFFFFF", "#2A2440", "#6A6284", "#E2DAEC", "#EEE8F4", "#FBF9FD", "#7650B0", "#9A78CC", "#FFFFFF", "#4A2E80", "#4E4280", "#E4DEF2", "#FFE3C8"],
      dark: ["#0C0E24", "rgba(200,190,255,.07)", "#151834", "#EEEAFB", "#ACA6CC", "#2A2C52", "#222448", "#11132C", "#B8A6FF", "#D0C2FF", "#14102E", "#5A4A9A", "#0E1030", "#DCD6F4", "#3E3A70"],
      glow: ["linear-gradient(180deg,#A9BCE4,#F6CCD2 50%,#FFE6C8)", "linear-gradient(180deg,#0B1030,#2A2B60 55%,#4E4478)"],
      spine: [lg("#6A5A9E", "#4A3E7A"), lg("#1E2050", "#0E1030")], btn: [lg2("#7650B0", "#C0628E"), lg2("#B8A6FF", "#F2B8D8")]},
    kit: {motif: "n7salt", card: ["#FCFAFE", "#ECE6F4"], ink: "#2A2440", bd: "#D6CCE6", mc: "#9A78CC", r: 20, notes: ["#EDE6F6"].concat(NOTES), shape: "rounded", pin: "magnet", fab: "999px", btn: "999px"},
    fx: {spawn: (W, H, d, n) => fxBurst(W, H, n(26), "n7salt", d ? ["#DCD6FF", "#FFFFFF", "#B8B0F0"] : ["#FFFFFF", "#F2E8F4", "#E8DCF2"], [[0.2, 1.02], [0.8, 1.02], [0.5, 1.04]], {smin: 8, smax: 13}).map(p => Object.assign(p, {vr: fxR(-0.04, 0.04)}))
      .concat(d ? fxStreaks(W, H, n(9), ["#FFFFFF", "#D8D0FF", "#FFE0F0"]) : fxRise(W, H, n(10), "n7cloud", ["#FFFFFF", "#FFE6EC", "#FFEFDC"], {smin: 14, smax: 22, vmin: 0.6, vmax: 1.1, sway: 0.6, life: 260, alpha: 0.9}),
        fxTw(W, H, n(36), "sparkle", d ? ["#FFFFFF", "#D8D0FF", "#FFE6F2"] : ["#F6B8C8", "#B8A0E8", "#FFD8A8"], {smin: 3, smax: 7, glow: d ? 12 : 4})),
      draw: (g, f, W, H, d) => rings(g, f, W, H, d)},
    tag: "A white salt flat under a sheet of water that mirrors a pastel sunset and its big clouds, with hexagonal salt crust and a mirrored starry sky at night"
  });
})();
