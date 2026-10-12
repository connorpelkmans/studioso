/* New theme ideas, batch n7: canyon (Slot Canyon), saltflats (Mirror Flats).
   Registered like the Study Fields themes (MAJ_THEMES), but in the Style Shop's "New Theme Ideas" group. */
(() => {
  const lg = (a, b) => `linear-gradient(180deg,${a},${b})`, lg2 = (a, b) => `linear-gradient(135deg,${a},${b})`;
  const r1 = n => Math.round(n * 100) / 100;
  const circ = (x, y, r) => `M${r1(x - r)} ${r1(y)}a${r1(r)} ${r1(r)} 0 1 0 ${r1(2 * r)} 0a${r1(r)} ${r1(r)} 0 1 0 ${r1(-2 * r)} 0Z`;
  const hex = (r, rot) => { let d = ""; for (let i = 0; i < 6; i++) { const a = rot + i * Math.PI / 3; d += (i ? "L" : "M") + r1(r * Math.cos(a)) + " " + r1(r * Math.sin(a)); } return d + "Z"; };
  const NOTES = ["#FFF3B8", "#D9F0D8", "#D6E6FF", "#FFD9C8", "#EBD9FF"];
  Object.assign(FX_SHAPES, {
    // a striped sandstone pebble
    n7strata: {d: "M-10.5 2C-11 -6 -4 -9.5 2 -9.5C8 -9.5 11 -5 10.5 1C10 7 5 9.5 -1 9.5C-7 9.5 -10.2 7 -10.5 2Z", detail: "M-10 -1.5C-4 -4 4 -5 10.4 -2.5M-10 4C-3 1.5 5 1 10 4.5", dstroke: true},
    // a four-petal desert primrose
    n7prim: {d: [0, 90, 180, 270].map(a => { const t = (a + 45) * Math.PI / 180; return circ(5 * Math.cos(t), 5 * Math.sin(t), 5.4); }).join(""), detail: circ(0, 0, 2.4), dfill: true},
    // a hexagon of salt crust
    n7salt: {d: hex(10.5, 0), detail: hex(6.4, 0), dstroke: true},
    // a little puffy cloud
    n7cloud: {d: "M-10.5 5C-12.5 5 -12.5 0 -9 -0.5C-9 -5 -4 -7 -1 -4.5C1 -9 8.5 -8 8.6 -2.5C12 -2.4 12.4 5 9 5Z"}
  });
  // soft rings spreading over the lower half of the page, like ripples on still water (frames f)
  const rings = (g, f, W, H, d) => { if (f > 230) return; [0, 34, 68].forEach((o, i) => { const k = (f - o) / 160; if (k <= 0 || k >= 1) return; g.save(); g.globalAlpha = (1 - k) * (d ? 0.4 : 0.55); g.strokeStyle = d ? "#C8C0FF" : "#FFFFFF"; g.lineWidth = 2.4 - i * 0.5;
    g.beginPath(); g.ellipse(W * 0.5, H * 0.86, Math.max(1, k * W * 0.55), Math.max(1, k * H * 0.1), 0, 0, 7); g.stroke(); g.restore(); }); };

  MAJ_THEMES.push({
    skin: {id: "canyon", name: "Slot Canyon", group: "ideas", desc: "A narrow, winding sandstone slot with sunbeams falling from a crack of sky.",
      light: ["#FBF1E8", "rgba(174,76,58,.10)", "#FFFCF8", "#3A1C1E", "#7A5A54", "#EED6C8", "#F6E4D8", "#FFF9F4", "#B0463A", "#C86A4E", "#FFFFFF", "#7A2A24", "#7E3448", "#F6DCCB", "#FFE0B0"],
      dark: ["#120E24", "rgba(255,180,108,.08)", "#1C1634", "#F6ECF2", "#BFAFC8", "#33284E", "#2A2142", "#171230", "#FFB46C", "#FFCB90", "#1C1426", "#8A5A3A", "#16112C", "#E6D6EA", "#6A4A2A"],
      glow: ["linear-gradient(180deg,#B8DDF2,#FFE6B8 50%,#F2A870)", "linear-gradient(180deg,#0E1436,#2A2252 55%,#4A3060)"],
      spine: [lg("#8A3A4E", "#5E2440"), lg("#2E2450", "#16112C")], btn: [lg2("#B0463A", "#CC6A3A"), lg2("#FFB46C", "#FFD49A")]},
    kit: {motif: "n7strata", card: ["#FFF8F2", "#F6E2D2"], ink: "#3A1C1E", bd: "#EAC6B2", mc: "#C8603E", r: 18, notes: ["#F6DCCC"].concat(NOTES), shape: "torn", pin: "pin", fab: "22px 22px 22px 8px", btn: "12px"},
    fx: {spawn: (W, H, d, n) => fxRise(W, H, n(46), "circle", d ? ["#C8D0FF", "#FFFFFF", "#E8D8FF"] : ["#FFD27A", "#FFE6A8", "#F6B060"], {smin: 1.6, smax: 3.6, vmin: 0.6, vmax: 1.4, sway: 1.6, life: 240, glow: 10, cx: [0.3, 0.7]})
      .concat(fxBurst(W, H, n(22), "n7prim", d ? ["#FFFFFF", "#F2E8FF", "#FFE9A8"] : ["#FFF2A8", "#FFFFFF", "#FFB38A", "#F7D24A"], [[0.2, 1.02], [0.8, 1.02], [0.5, 1.04]], {smin: 9, smax: 13}).map(p => Object.assign(p, {vr: fxR(-0.05, 0.05)})),
        fxBurst(W, H, n(10), "n7strata", d ? ["#8A6AB0", "#B28AC0"] : ["#D2703E", "#B84A3A", "#E8925A"], [[0.1, 1.02], [0.9, 1.02]], {smin: 10, smax: 14}).map(p => Object.assign(p, {vr: fxR(-0.06, 0.06)})),
        fxTw(W, H, n(24), "sparkle", d ? ["#DCE2FF", "#FFFFFF"] : ["#FFC85A", "#FFE8A0"], {smin: 3, smax: 6, glow: d ? 12 : 5}))},
    tag: "A winding slot of flowing striped sandstone, with sunbeams full of floating dust, a trickle of sand from a ledge and a strip of Milky Way at night"
  });
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
