/* ===== module: 20-scenes-maj-greece.js ===== */
/* Around the World */
(() => {
  const lg = (a, b) => `linear-gradient(180deg,${a},${b})`, lg2 = (a, b) => `linear-gradient(135deg,${a},${b})`;
  const r1 = n => Math.round(n * 100) / 100;
  const pts = a => "M" + a.map(p => `${r1(p[0])} ${r1(p[1])}`).join("L") + "Z";
  const circ = (x, y, r) => `M${r1(x - r)} ${r1(y)}a${r1(r)} ${r1(r)} 0 1 0 ${r1(2 * r)} 0a${r1(r)} ${r1(r)} 0 1 0 ${r1(-2 * r)} 0Z`;
  // an ellipse turned by ang degrees, as a polygon
  const rell = (x, y, rx, ry, ang) => { const a = ang * Math.PI / 180, c = Math.cos(a), s = Math.sin(a); return pts(Array.from({length: 20}, (_, i) => { const t = i / 20 * Math.PI * 2, px = rx * Math.cos(t), py = ry * Math.sin(t); return [x + px * c - py * s, y + px * s + py * c]; })); };
  const half = (cx, by, r, k) => pts(Array.from({length: 17}, (_, i) => { const a = Math.PI + i / 16 * Math.PI; return [cx + Math.cos(a) * r, by + Math.sin(a) * r * k]; }));
  Object.assign(FX_SHAPES, {
    // a white dove in flight, wings raised
    greecedove: {d: "M-10.5 2.4C-6.5 0.4 -2 0.2 2 1.2L6 -0.8C8 -1.8 10.2 -1.4 11.2 0.2L8.4 1.4C7.2 3.6 4 5.2 0 5.2C-4.4 5.2 -8.2 4.2 -10.5 2.4Z M-3.4 1.4C-6 -3.6 -4 -9 2.6 -11.4C1.6 -6.4 1.8 -2.4 3 1.2Z M-10.5 2.4L-12 -1.6L-8.6 1.2Z", detail: circ(8.4, -0.2, 0.7), dfill: true},
    // a sprig of bougainvillea
    greecebloom: {d: [-90, 30, 150].map(a => rell(Math.cos(a * Math.PI / 180) * 4.6, Math.sin(a * Math.PI / 180) * 4.6, 5, 3.6, a)).join(""), detail: circ(0, 0, 1.6) + circ(1.2, 1.4, 0.9), dfill: true},
    // a blue dome on its drum
    greecedome: {d: half(0, 4, 8.6, 1.02) + "M-9.4 4H9.4V9.6H-9.4Z M-0.7 -10.6H0.7V-4.2H-0.7Z M-2.6 -8.8H2.6V-7.6H-2.6Z", detail: "M-5.6 9V6.6M0 9V6.6M5.6 9V6.6", dstroke: true}
  });

  MAJ_THEMES.push({
    skin: {id: "greece", name: "Greece", group: "world", desc: "White cave houses and blue domes on the caldera cliff above the Aegean.",
      light: ["#F1F6FB", "rgba(31,92,170,.10)", "#FFFFFF", "#13253D", "#4C5F77", "#D5E1EE", "#E5EEF7", "#F8FBFE", "#1F5CAA", "#3D7CC6", "#FFFFFF", "#163F7A", "#1B4E92", "#D0E0F4", "#FFE3A0"],
      dark: ["#0C1430", "rgba(242,184,102,.08)", "#141E42", "#EEF2FC", "#AEB8D6", "#2B3868", "#1F2A56", "#111A3A", "#F2B866", "#F6D08E", "#141C3A", "#7A5A34", "#121A3C", "#D4DAF0", "#6A5428"],
      glow: ["linear-gradient(180deg,#8EC9F0,#D8EEFA 45%,#FFF2DC)", "linear-gradient(180deg,#0E1838,#1D2A5A 45%,#6A3E62)"],
      spine: [lg("#2A64AE", "#173F7A"), lg("#1D2A5A", "#0E1838")], btn: [lg2("#1F5CAA", "#3B86C9"), lg2("#F2B866", "#F6D08E")]},
    kit: {motif: "greecedome", card: ["#FAFCFF", "#E4EEF8"], ink: "#13253D", bd: "#BCD2EA", mc: "#2F6DB8", r: 14, notes: ["#D6E6F8", "#FFF3B8", "#D9F0D8", "#FBD3E6", "#FFD9C8", "#EBD9FF"], shape: "rounded", pin: "pin", fab: "999px", btn: "12px"},
    fx: {spawn: (W, H, d, n) => fxRise(W, H, n(12), "greecedove", d ? ["#F4F2FF", "#DCDAF4"] : ["#FFFFFF", "#E2ECF8", "#CCDCEE"], {smin: 13, smax: 19, vmin: 1.6, vmax: 2.8, sway: 1.4, life: 240, glow: d ? 10 : 0}).map(p => Object.assign(p, {vx: fxR(-1.3, -0.3)}))
      .concat(fxFall(W, H, n(56), "greecebloom", d ? ["#E0559E", "#C84A8E", "#F08CC0"] : ["#DA338A", "#E85AA6", "#F49AC8"], {sway: 1.8, flip: true, smin: 6, smax: 10, vmin: 1, vmax: 2}),
        fxBurst(W, H, n(10), "greecedome", d ? ["#5A7AD0", "#3E5CB0"] : ["#2D6AC0", "#3B7CC9"], [[0.2, 1.02], [0.8, 1.02]], {smin: 11, smax: 15}).map(p => Object.assign(p, {vr: fxR(-0.05, 0.05)})),
        fxTw(W, H, n(24), "sparkle", d ? ["#FFE3A8", "#FFFFFF"] : ["#F2B53A", "#FFD86B"], {smin: 3, smax: 6, glow: d ? 10 : 4}))},
    tag: "Oia's white cave houses and blue domes stacked along the caldera cliff, a windmill on the rim, a mule path zig-zagging down to the harbour, bougainvillea and the famous sunset over the deep blue Aegean"
  });
})();
/* end of module 20-scenes-maj-greece.js */


