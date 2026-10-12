/* Around the World: thailand (Thailand) */
(() => {
  const lg = (a, b) => `linear-gradient(180deg,${a},${b})`, lg2 = (a, b) => `linear-gradient(135deg,${a},${b})`;
  const r1 = n => Math.round(n * 100) / 100;
  const pts = a => "M" + a.map(p => `${r1(p[0])} ${r1(p[1])}`).join("L") + "Z";
  const circ = (x, y, r) => `M${r1(x - r)} ${r1(y)}a${r1(r)} ${r1(r)} 0 1 0 ${r1(2 * r)} 0a${r1(r)} ${r1(r)} 0 1 0 ${r1(-2 * r)} 0Z`;
  // a petal as a pointed ellipse from (0,0) out to length L at angle a (radians), width w
  const petal = (cx, cy, a, L, w) => { const c = Math.cos(a), s = Math.sin(a), P = (u, v) => `${r1(cx + c * u - s * v)} ${r1(cy + s * u + c * v)}`; return `M${P(0, 0)}Q${P(L * 0.45, -w)} ${P(L, 0)}Q${P(L * 0.45, w)} ${P(0, 0)}Z`; };
  Object.assign(FX_SHAPES, {
    // frangipani: five overlapping petals around a golden centre
    thailandfrang: {d: [0, 1, 2, 3, 4].map(i => petal(0, 0, i / 5 * Math.PI * 2 - Math.PI / 2, 10.6, 4.6)).join(""), detail: circ(0, 0, 2.6), dfill: true},
    // a lotus in bloom, seen from the side
    thailandlotus: {d: petal(0, 7, -Math.PI / 2, 17, 5.2) + petal(-1, 7, -Math.PI / 2 - 0.55, 14, 4.6) + petal(1, 7, -Math.PI / 2 + 0.55, 14, 4.6) + petal(-2, 7.6, -Math.PI + 0.35, 11, 3.8) + petal(2, 7.6, -0.35, 11, 3.8), detail: "M-9 9.6Q0 12.4 9 9.6", dstroke: true},
    // a candle krathong: a round leaf float, petals and a candle with its flame
    thailandkrathong: {d: "M-11 4H11Q11 9 0 9Q-11 9 -11 4Z M-10 4L-8 -1L-6 4Z M-6 4L-4 -2L-2 4Z M2 4L4 -2L6 4Z M6 4L8 -1L10 4Z M-1.3 4V-4H1.3V4Z M0 -11.4C1.8 -8.8 1.8 -6.6 0 -5.2C-1.8 -6.6 -1.8 -8.8 0 -11.4Z", detail: circ(-4, 1.6, 1.6) + circ(4, 1.6, 1.6) + circ(0, 2.4, 1.6), dfill: true},
    // a golden chedi: stepped base, bell, ring stack and spire
    thailandchedi: {d: "M-10 11H10V9H8V7H-8V9H-10Z M-7 7C-7 1 -5 -2 -2.4 -3.6H2.4C5 -2 7 1 7 7Z M-2.4 -3.6V-5.4H2.4V-3.6Z M-2 -5.4L-0.4 -12H0.4L2 -5.4Z", detail: "M-6.6 3.4H6.6M-1.6 -7.4H1.6M-1.2 -9.4H1.2", dstroke: true}
  });
  MAJ_THEMES.push({
    skin: {id: "thailand", name: "Thailand", group: "world", desc: "Limestone islands, longtail boats and a golden temple.",
      light: ["#F2FAF7", "rgba(14,116,112,.10)", "#FFFFFF", "#10302E", "#4A6864", "#D0E6E0", "#E2F2EE", "#F8FCFB", "#0E7470", "#3A928C", "#FFFFFF", "#0A4A48", "#0E5A58", "#C8EAE2", "#FFE3A0"],
      dark: ["#0C1530", "rgba(242,196,90,.08)", "#141F42", "#F2F2FA", "#B2B6D4", "#2A3766", "#202C58", "#111A3A", "#F2C45A", "#F6D892", "#0E1838", "#7A6232", "#0E1838", "#D6D4EE", "#6A5428"],
      glow: ["linear-gradient(180deg,#8ED4EE,#D6F2F2 45%,#F6EED2)", "linear-gradient(180deg,#0C1A36,#1C2E58 45%,#4A3A6A)"],
      spine: [lg("#16807A", "#0E5A58"), lg("#1E2E5E", "#0E1838")], btn: [lg2("#0E7470", "#C88A1E"), lg2("#F2C45A", "#F6D892")]},
    kit: {motif: "thailandlotus", card: ["#F8FDFB", "#E2F4EE"], ink: "#10302E", bd: "#B6DDD4", mc: "#E0508A", r: 16, notes: ["#FBE0EA", "#FFF3B8", "#D9F0D8", "#D6E6FF", "#FFD9C8", "#EBD9FF"], shape: "scallop", pin: "gold", fab: "999px", btn: "14px"},
    fx: {spawn: (W, H, d, n) => fxBurst(W, H, n(26), "thailandlotus", d ? ["#FF9AC8", "#FFD0E2", "#F27AAE"] : ["#F06A9E", "#F48AB4", "#E0508A"], [[0.15, 1.02], [0.85, 1.02], [0.5, 1.04]], {smin: 10, smax: 15, glow: d ? 10 : 0})
      .concat(fxFall(W, H, n(36), "thailandfrang", d ? ["#FFF6E8", "#FFC8DE", "#FFE6A0"] : ["#FFFFFF", "#FFD6E6", "#FFF2C0"], {sway: 1.6, smin: 8, smax: 12, vmin: 0.9, vmax: 1.7, glow: d ? 6 : 0}).map(p => Object.assign(p, {vr: fxR(-0.04, 0.04)})),
        fxRise(W, H, n(8), "thailandkrathong", d ? ["#FFC24A", "#FFB070"] : ["#3E9A4A", "#E8962E"], {smin: 14, smax: 19, vmin: 0.8, vmax: 1.4, sway: 0.5, life: 320, glow: d ? 16 : 4}).map(p => Object.assign(p, {vr: 0})),
        fxRise(W, H, n(2), "thailandchedi", d ? ["#F2C45A"] : ["#E2A42A"], {cx: [0.3, 0.7], smin: 20, smax: 24, vmin: 0.9, vmax: 1.2, sway: 0.3, life: 320, glow: d ? 16 : 8}).map(p => Object.assign(p, {vr: 0})),
        fxTw(W, H, n(26), "sparkle", d ? ["#FFE3A8", "#FFFFFF", "#9AE8FF"] : ["#F2B53A", "#FFD86B"], {smin: 3, smax: 6, glow: d ? 10 : 4}))},
    tag: "A tropical bay of jungle-topped limestone islands, longtail boats on a white beach and a golden temple on the headland"
  });
})();
