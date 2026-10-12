/* Around the World: peru (Machu Picchu) */
(() => {
  const lg = (a, b) => `linear-gradient(180deg,${a},${b})`, lg2 = (a, b) => `linear-gradient(135deg,${a},${b})`;
  const r1 = n => Math.round(n * 100) / 100;
  const circ = (x, y, r) => `M${r1(x - r)} ${r1(y)}a${r1(r)} ${r1(r)} 0 1 0 ${r1(2 * r)} 0a${r1(r)} ${r1(r)} 0 1 0 ${r1(-2 * r)} 0Z`;
  const ell = (x, y, rx, ry) => `M${r1(x - rx)} ${r1(y)}a${r1(rx)} ${r1(ry)} 0 1 0 ${r1(2 * rx)} 0a${r1(rx)} ${r1(ry)} 0 1 0 ${r1(-2 * rx)} 0Z`;
  const pts = a => "M" + a.map(p => `${r1(p[0])} ${r1(p[1])}`).join("L") + "Z";
  const star = (cx, cy, R, r, n) => pts(Array.from({length: n * 2}, (_, i) => { const a = -Math.PI / 2 + i * Math.PI / n, q = i % 2 ? r : R; return [cx + q * Math.cos(a), cy + q * Math.sin(a)]; }));
  Object.assign(FX_SHAPES, {
    // a llama's head and long neck in profile, banana ears up
    peruLlama: {d: "M-5 12V-1.6C-5 -5.4 -3 -7.6 0.4 -7.8L5.2 -7.8C8.6 -7.8 10.4 -5.6 10 -3.2C9.6 -1 7.8 -0.4 5.6 -0.4H2.4V12Z" + ell(-1.6, -10.4, 1.5, 3.8) + ell(1.8, -10.6, 1.5, 3.8), detail: circ(3.4, -4.8, 1) + circ(9.2, -3.4, 0.6), dfill: true},
    // a soaring condor seen from below: long fingered wings, a fanned tail and the white ruff
    peruCondor: {d: "M0 -2.4C-4 -3.6 -8 -3.4 -12.4 -1.2L-10.6 -0.2L-12.6 0.8L-9.8 1L-11 2.4L-7.6 1.8L-3.2 2.6L-1.6 6L0 5.2L1.6 6L3.2 2.6L7.6 1.8L11 2.4L9.8 1L12.6 0.8L10.6 -0.2L12.4 -1.2C8 -3.4 4 -3.6 0 -2.4Z" + circ(0, -3.6, 1.5), detail: "M-9.6 0.4Q-5.6 -0.6 -2 0.9M9.6 0.4Q5.6 -0.6 2 0.9M-1.4 -2.2Q0 -1.2 1.4 -2.2", dstroke: true},
    // a kantu blossom: a slim magenta trumpet that flares at the mouth
    peruKantu: {d: "M-1.3 -10.5H1.3L2.8 3.4Q3.6 4.6 4.6 5.6Q5.6 7.6 3 8.2Q0 8.8 -3 8.2Q-5.6 7.6 -4.6 5.6Q-3.6 4.6 -2.8 3.4Z" + ell(0, -11.2, 2.2, 1.2), detail: "M0 7V11.4M-1.5 7.2L-2.4 11M1.5 7.2L2.4 11", dstroke: true},
    // the sun rising through the Sun Gate: a disc with twelve rays
    peruSun: {d: star(0, 0, 11.6, 6.6, 12) + circ(0, 0, 6.4), detail: circ(0, 0, 3.8), dstroke: true},
    // a stone window, trapezoid in the Inca way
    peruWindow: {d: "M-9 10.5L-6.4 -10.5H6.4L9 10.5Z", detail: "M-4.6 7L-3 -6.6H3L4.6 7Z", dfill: true}
  });

  MAJ_THEMES.push({
    skin: {id: "peru", name: "Machu Picchu", group: "world", desc: "Stone terraces high in the clouds of the Andes.",
      light: ["#F1F6EC", "rgba(47,122,74,.10)", "#FFFFFF", "#1E2E24", "#566A5A", "#D6E3CF", "#E6EFE0", "#FBFDF8", "#2F7A4A", "#C2456A", "#FFFFFF", "#1F5A36", "#24533A", "#E2F0DE", "#FFE3A0"],
      dark: ["#0C1428", "rgba(138,219,166,.07)", "#151F3C", "#EEF4F0", "#AEBFC2", "#26345E", "#1E2A50", "#111A34", "#8ADBA6", "#F2A8C2", "#0E1A28", "#3E7A5C", "#0E1630", "#D4E4E0", "#6A5428"],
      glow: ["linear-gradient(180deg,#A6D2EE,#E2F0F2 45%,#EEF2DC)", "linear-gradient(180deg,#0A1430,#1A2650 45%,#3A3A6A)"],
      spine: [lg("#3A7A52", "#24533A"), lg("#1E2C58", "#0E1630")], btn: [lg2("#2F7A4A", "#4A9A5A"), lg2("#8ADBA6", "#F2C46A")]},
    kit: {motif: "peruLlama", card: ["#FBFDF6", "#E8F2DE"], ink: "#1E2E24", bd: "#CFE0C4", mc: "#2F7A4A", r: 16, notes: ["#E2F2D2", "#FFF3B8", "#FFD9E4", "#D6E6FF", "#FFE2C6", "#E8DCFF"], shape: "folded", pin: "corners", fab: "999px", btn: "12px"},
    fx: {spawn: (W, H, d, n) => fxFall(W, H, n(30), "peruKantu", d ? ["#F06A96", "#D84A7E", "#FF8AB0"] : ["#E23A6E", "#C42A5A", "#F05A8A"], {sway: 1.5, smin: 7, smax: 11, vmin: 0.9, vmax: 1.9, glow: d ? 6 : 0})
      .concat(fxBurst(W, H, n(10), "peruLlama", d ? ["#ECE4F4", "#C9A27E", "#B8B0D0"] : ["#F4EAD6", "#B07848", "#E2D2B4"], [[0.2, 1.02], [0.8, 1.02]], {smin: 14, smax: 19}).map(p => Object.assign(p, {vr: fxR(-0.05, 0.05)})),
        fxRise(W, H, n(6), "peruSun", d ? ["#F6D27A", "#FFE3A0"] : ["#F2B53A", "#E8A02A"], {cx: [0.15, 0.85], smin: 10, smax: 15, vmin: 1, vmax: 1.8, sway: 0.6, life: 260, glow: d ? 14 : 6}),
        [0, 1].map(i => ({shape: "peruCondor", c: d ? "#1A1828" : "#2A2630", x: -40 - i * 70, y: H * (0.22 + i * 0.1), vx: (W + 160) / 230, vy: -0.05, g: 0, size: 26 - i * 6, rot: 0, vr: 0, sway: 0.5, swf: 0.03, life: 290, delay: 8 + i * 30})),
        fxTw(W, H, n(22), "sparkle", d ? ["#FFE3A8", "#FFFFFF"] : ["#F2B53A", "#FFD86B"], {smin: 3, smax: 6, glow: d ? 10 : 4}))},
    tag: "The Inca citadel of Machu Picchu among cloud-wrapped Andes peaks, with llamas grazing its green terraces"
  });
})();
