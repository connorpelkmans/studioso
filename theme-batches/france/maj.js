/* Around the World: france (Paris) */
(() => {
  const lg = (a, b) => `linear-gradient(180deg,${a},${b})`, lg2 = (a, b) => `linear-gradient(135deg,${a},${b})`;
  const r1 = n => Math.round(n * 100) / 100;
  const pts = a => "M" + a.map(p => `${r1(p[0])} ${r1(p[1])}`).join("L") + "Z";
  const circ = (x, y, r) => `M${r1(x - r)} ${r1(y)}a${r1(r)} ${r1(r)} 0 1 0 ${r1(2 * r)} 0a${r1(r)} ${r1(r)} 0 1 0 ${r1(-2 * r)} 0Z`;
  const ell = (x, y, rx, ry) => `M${r1(x - rx)} ${r1(y)}a${r1(rx)} ${r1(ry)} 0 1 0 ${r1(2 * rx)} 0a${r1(rx)} ${r1(ry)} 0 1 0 ${r1(-2 * rx)} 0Z`;
  Object.assign(FX_SHAPES, {
    // the tower: legs, the arch, two platforms and the mast, with its lattice as the detail
    franceeiffel: {d: "M-9.4 11L-5.6 3.6L-6.6 3.6L-6.6 2.2L-3.6 2.2L-2.4 -2.6L-3.4 -2.6L-3.4 -3.8L-1.6 -3.8L-0.7 -9.6L-0.4 -12.4L0.4 -12.4L0.7 -9.6L1.6 -3.8L3.4 -3.8L3.4 -2.6L2.4 -2.6L3.6 2.2L6.6 2.2L6.6 3.6L5.6 3.6L9.4 11L6.6 11Q5 6.8 0 6Q-5 6.8 -6.6 11Z",
      detail: "M-4.6 3.6L-2.2 -2.6M4.6 3.6L2.2 -2.6M-1.4 -3.8L1.2 -9M1.4 -3.8L-1.2 -9M-7.4 9L-4 3.6M7.4 9L4 3.6", dstroke: true},
    francecroissant: {d: "M-11 3Q-12 -1 -8 -3Q-4 -7 0 -7Q4 -7 8 -3Q12 -1 11 3Q8 1 6 2Q3 -1 0 -1Q-3 -1 -6 2Q-8 1 -11 3Z",
      detail: "M-6 2Q-5 -3 -3 -5M0 -1V-7M6 2Q5 -3 3 -5", dstroke: true},
    francemacaron: {d: ell(0, -4, 9.4, 4.4) + ell(0, 4, 9.4, 4.4) + "M-9 -1.4H9V1.4H-9Z", detail: "M-8.6 0Q-6 1.6 -3.6 0Q-1.2 1.6 1.2 0Q3.6 1.6 6 0Q7.6 1.2 8.6 0", dstroke: true},
    francechestnut: {d: [0, 1, 2, 3, 4].map(i => { const a = -Math.PI / 2 + (i - 2) * 0.62, L = 10 - Math.abs(i - 2) * 1.6, cx = Math.cos(a) * L * 0.55, cy = 4 + Math.sin(a) * L * 0.55, c = Math.cos(a), s = Math.sin(a), rx = L * 0.52, ry = L * 0.2;
        return pts(Array.from({length: 14}, (_, k) => { const t = k / 14 * Math.PI * 2; return [cx + rx * Math.cos(t) * c - ry * Math.sin(t) * s, cy + rx * Math.cos(t) * s + ry * Math.sin(t) * c]; })); }).join(""),
      detail: "M0 4L0 11", dstroke: true},
    francelamp: {d: "M-1 11V-2H1V11Z M-4.6 -2L-5.4 -9H5.4L4.6 -2Z M-6 -9L0 -13.4L6 -9Z", detail: circ(0, -5.6, 2.2), dfill: true}
  });

  MAJ_THEMES.push({
    skin: {id: "france", name: "Paris", group: "world", desc: "The Eiffel Tower over the Seine and the rooftops.",
      light: ["#F5F1EA", "rgba(46,62,102,.10)", "#FFFFFF", "#1F2A3C", "#5E6676", "#E4DDD2", "#EFE9E0", "#FCFAF6", "#B8403A", "#CC6A5A", "#FFFFFF", "#7A2420", "#2E3E66", "#D6DFEE", "#FFE3A0"],
      dark: ["#10142E", "rgba(242,196,106,.08)", "#191E40", "#F4F0FA", "#B8B4D4", "#2E3462", "#242A56", "#151A38", "#F2C46A", "#F6D892", "#161A3A", "#7A6232", "#141834", "#D6D4EE", "#6A5428"],
      glow: ["linear-gradient(180deg,#B9D6EE,#E9F1F6 45%,#F6E4D6)", "linear-gradient(180deg,#121A36,#263258 45%,#5A4468)"],
      spine: [lg("#3A4E7A", "#24345A"), lg("#2A3060", "#141834")], btn: [lg2("#B8403A", "#D9704E"), lg2("#F2C46A", "#F6D892")]},
    kit: {motif: "franceeiffel", card: ["#FFFCF6", "#F1EADF"], ink: "#1F2A3C", bd: "#E2D6C2", mc: "#B8403A", r: 14, notes: ["#F9D6DE", "#FFF1B8", "#D8EDD2", "#D6E4FA", "#EADCF8", "#FFE0C4"], shape: "folded", pin: "pin", fab: "999px", btn: "12px"},
    fx: {spawn: (W, H, d, n) => fxTw(W, H, n(46), "sparkle", d ? ["#FFFFFF", "#FFF4D0", "#FFE3A8"] : ["#F2C46A", "#FFFFFF", "#F6D892"], {top: 0.9, smin: 3, smax: 7, glow: d ? 12 : 6})
      .concat(fxRise(W, H, n(10), "francemacaron", d ? ["#F2A8C0", "#B8E0C4", "#C8B8F0", "#F6D892"] : ["#F4A6B8", "#A8D8B8", "#C4B4EC", "#F6D27A"], {smin: 11, smax: 15, vmin: 1, vmax: 1.8, sway: 0.7, life: 300}),
        fxFall(W, H, n(16), "francechestnut", d ? ["#4E8A5A", "#6A9A4E"] : ["#5E9A4E", "#7AAA5C", "#D9A040"], {sway: 1.5, smin: 8, smax: 12, vmin: 0.9, vmax: 1.7}),
        fxBurst(W, H, n(10), "francecroissant", ["#E8A84A", "#D8923A", "#F0BC5E"], [[0.2, 1.02], [0.8, 1.02]], {smin: 11, smax: 15}).map(p => Object.assign(p, {vr: fxR(-0.06, 0.06)})),
        fxRise(W, H, n(2), "franceeiffel", d ? ["#F6D892"] : ["#86705E"], {cx: [0.35, 0.65], smin: 20, smax: 24, vmin: 0.9, vmax: 1.2, sway: 0.3, life: 320, glow: d ? 16 : 0}).map(p => Object.assign(p, {vr: 0})))},
    tag: "The Eiffel Tower over the Seine and the rooftops, with a stone bridge, booksellers' stalls and a cafe on the quay"
  });
})();
