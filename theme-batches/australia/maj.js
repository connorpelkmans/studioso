/* Around the World: australia (Sydney Harbour) */
(() => {
  const lg = (a, b) => `linear-gradient(180deg,${a},${b})`, lg2 = (a, b) => `linear-gradient(135deg,${a},${b})`;
  const r1 = n => Math.round(n * 100) / 100;
  const pts = a => "M" + a.map(p => `${r1(p[0])} ${r1(p[1])}`).join("L") + "Z";
  const circ = (x, y, r) => `M${r1(x - r)} ${r1(y)}a${r1(r)} ${r1(r)} 0 1 0 ${r1(2 * r)} 0a${r1(r)} ${r1(r)} 0 1 0 ${r1(-2 * r)} 0Z`;
  const ell = (x, y, rx, ry) => `M${r1(x - rx)} ${r1(y)}a${r1(rx)} ${r1(ry)} 0 1 0 ${r1(2 * rx)} 0a${r1(rx)} ${r1(ry)} 0 1 0 ${r1(-2 * rx)} 0Z`;
  // one shell sail: the back curve rising to the tip, the front edge dropping to the base
  const sail = (bx, w, h) => `M${r1(bx)} 9C${r1(bx + w * 0.02)} ${r1(9 - h * 0.62)} ${r1(bx + w * 0.42)} ${r1(9 - h)} ${r1(bx + w * 0.9)} ${r1(9 - h)}Q${r1(bx + w * 0.84)} ${r1(9 - h * 0.46)} ${r1(bx + w)} 9Z`;
  Object.assign(FX_SHAPES, {
    // the Opera House: three shells on the podium, with their ribs as the detail
    australiaopera: {d: sail(-2, 12, 17) + sail(-7.4, 9.6, 12.4) + sail(-11, 7.6, 8.4) + "M-12 9H11.6V11H-12Z",
      detail: "M8.8 -8Q4.6 0 4.6 9M0.6 -3.4Q-2 2 -2.2 9M-4.2 0.6Q-6 4 -6.6 9", dstroke: true},
    // a gum leaf: long, narrow and curved, with its midrib
    australiagum: {d: "M-1 11Q-3 4 -2.4 -2Q-1.4 -8 2.6 -12Q3.6 -6 3 0Q2.2 6 -1 11Z", detail: "M-1 11Q0 2 2.6 -12", dstroke: true},
    // a golden wattle puff: a ball of tiny round flowers
    australiawattle: {d: [[0, 0, 4.4], [-5, -3, 3], [5, -2.6, 3.2], [-4, 4.4, 3], [4.6, 4.2, 2.8], [0, -6.4, 2.8], [0, 6.6, 2.6]].map(c => circ(c[0], c[1], c[2])).join(""),
      detail: [[-1.4, -1.4], [1.6, 1], [-5.6, -3.6], [4.2, -3.2], [-3.6, 4], [0.4, -6.8]].map(c => circ(c[0], c[1], 0.8)).join(""), dfill: true},
    // a firework burst: a ring of rays round a bright centre
    australiaburst: {d: Array.from({length: 10}, (_, i) => { const a = i / 10 * Math.PI * 2, c = Math.cos(a), s = Math.sin(a); return pts([[c * 3 - s * 0.8, s * 3 + c * 0.8], [c * 11, s * 11], [c * 3 + s * 0.8, s * 3 - c * 0.8]]); }).join("") + circ(0, 0, 2.6)}
  });

  MAJ_THEMES.push({
    skin: {id: "australia", name: "Sydney Harbour", group: "world", desc: "The Opera House sails and the Harbour Bridge.",
      light: ["#F2F6F8", "rgba(30,94,150,.10)", "#FFFFFF", "#15283A", "#566876", "#D6E2EA", "#E6EEF2", "#FAFCFD", "#1F6AA6", "#3E8AC4", "#FFFFFF", "#123E66", "#1E4E7A", "#D4E6F4", "#FFE2A0"],
      dark: ["#0B1430", "rgba(255,196,110,.08)", "#141E44", "#F2F2FA", "#B6B8D6", "#2C3664", "#222C58", "#101938", "#F6C25E", "#F8D68C", "#121A3A", "#7A6230", "#101834", "#D2D6EE", "#6A5428"],
      glow: ["linear-gradient(180deg,#86C8F2,#D8EEF8 45%,#F8EAD0)", "linear-gradient(180deg,#0A1434,#1A2A5C 45%,#4A3A6E)"],
      spine: [lg("#24588A", "#163C62"), lg("#26305E", "#101834")], btn: [lg2("#1F6AA6", "#2E8AB0"), lg2("#F6C25E", "#F8D68C")]},
    kit: {motif: "australiaopera", card: ["#FBFDFE", "#E8F1F6"], ink: "#15283A", bd: "#C8DAE6", mc: "#1F6AA6", r: 16, notes: ["#FFF0B8", "#D6EAF8", "#FAD6CC", "#D9F0D8", "#EBD9FF", "#FFE0C4"], shape: "rounded", pin: "pin", fab: "999px", btn: "12px"},
    fx: {spawn: (W, H, d, n) => fxBurst(W, H, n(16), "australiaburst", d ? ["#FFD36A", "#FF6A5A", "#6AB8FF", "#FFFFFF"] : ["#F2B23A", "#E8503E", "#3E8AD8"], [[0.25, 0.3], [0.7, 0.24], [0.5, 0.42]], {smin: 9, smax: 15, g: 0.08, glow: d ? 12 : 4}).map(p => Object.assign(p, {vr: fxR(-0.05, 0.05)}))
      .concat(fxFall(W, H, n(16), "australiagum", d ? ["#4E7A6A", "#6A8E7E"] : ["#6E9A84", "#93B898", "#A8C4A0"], {sway: 1.6, smin: 9, smax: 13, vmin: 0.9, vmax: 1.7}),
        fxRise(W, H, n(12), "australiawattle", d ? ["#F6C84E", "#FFE08A"] : ["#F2C230", "#F6D45A"], {smin: 7, smax: 11, vmin: 1, vmax: 1.9, sway: 0.9, life: 260, glow: d ? 8 : 0}),
        fxTw(W, H, n(30), "sparkle", d ? ["#FFFFFF", "#FFE6A8", "#B8D8FF"] : ["#FFFFFF", "#FFE6A8"], {top: 0.8, smin: 3, smax: 7, glow: d ? 10 : 5}),
        fxRise(W, H, n(2), "australiaopera", d ? ["#E8E6FA"] : ["#FFFFFF"], {cx: [0.3, 0.7], smin: 20, smax: 24, vmin: 0.9, vmax: 1.2, sway: 0.3, life: 320, glow: d ? 14 : 4}).map(p => Object.assign(p, {vr: 0})))},
    tag: "Sydney Harbour from the shore: the Opera House sails and the Harbour Bridge, ferries and sailboats, a koala asleep in a gum tree"
  });
})();
