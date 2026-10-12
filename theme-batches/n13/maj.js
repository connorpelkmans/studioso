/* New theme ideas, batch n13: maples (Maple Ravine), aspens (Aspen Gold).
   Registered like the Study Fields themes (MAJ_THEMES), but in the Style Shop's "New Theme Ideas" group. */
(() => {
  const lg = (a, b) => `linear-gradient(180deg,${a},${b})`, lg2 = (a, b) => `linear-gradient(135deg,${a},${b})`;
  const r1 = n => Math.round(n * 100) / 100;
  const circ = (x, y, r) => `M${r1(x - r)} ${r1(y)}a${r1(r)} ${r1(r)} 0 1 0 ${r1(2 * r)} 0a${r1(r)} ${r1(r)} 0 1 0 ${r1(-2 * r)} 0Z`;
  // a Japanese maple leaf: seven slender pointed lobes and a short stem (in the -12..12 box)
  const mapleD = (() => { let d = ""; const n = 7, sp = 2.25, st = sp * 2 / (n - 1), R = 11;
    for (let i = 0; i < n; i++) { const u = i / (n - 1) * 2 - 1, a = -Math.PI / 2 + u * sp, L = R * (1 - 0.34 * u * u), w = st * 0.36, P = (rr, aa) => r1(Math.cos(aa) * rr) + " " + r1(Math.sin(aa) * rr - 1.5);
      if (i > 0) d += "L" + P(R * 0.3, a - st / 2); d += (i ? "L" : "M") + P(L * 0.58, a - w) + "L" + P(L, a) + "L" + P(L * 0.58, a + w); }
    return d + "L1.1 1L0.5 10.5L-0.5 10.5L-0.7 1Z"; })();
  const NOTES = ["#FFF3B8", "#D9F0D8", "#D6E6FF", "#FFD9C8", "#EBD9FF"];
  Object.assign(FX_SHAPES, {
    n13maple: {d: mapleD, detail: "M0 9V-1.5M0 0L-6 -5M0 0L6 -5M0 -1L0 -9", dstroke: true},
    n13aspen: {d: "M0 -10C6.8 -10 9.6 -4.6 9.6 -0.6C9.6 5 5 8.4 0 8.4C-5 8.4 -9.6 5 -9.6 -0.6C-9.6 -4.6 -6.8 -10 0 -10Z M-0.7 8H0.7V11.6H-0.7Z", detail: "M0 7.6V-7M0 1L-4.4 -2.6M0 1L4.4 -2.6M0 -3L-3 -5.6M0 -3L3 -5.6", dstroke: true},
    n13wisp: {d: "M-11 2C-6 -4 2 -5 11 -1C5 0 -2 2 -6 6C-7.6 4.6 -9.4 3.4 -11 2Z"}
  });

  MAJ_THEMES.push({
    skin: {id: "maples", name: "Maple Ravine", group: "ideas", desc: "A mountain ravine in autumn, red maples over mossy stones and little falls.",
      light: ["#F8F1E8", "rgba(190,60,40,.10)", "#FFFFFF", "#2E1E18", "#6E5A50", "#EAD8C8", "#F2E6DA", "#FDF9F4", "#B8382A", "#CC5E48", "#FFFFFF", "#6E1E14", "#5A2A22", "#F2D6C6", "#FFE0A8"],
      dark: ["#110E1E", "rgba(240,120,90,.08)", "#1C1628", "#F4ECF0", "#BCAEB8", "#352A3E", "#281F34", "#18122A", "#F08A6A", "#F5A88E", "#1C1018", "#8A3A30", "#140E20", "#E8CCD4", "#6A3A2A"],
      glow: ["linear-gradient(180deg,#B4D2E8,#F4DCBE 50%,#C8502E)", "linear-gradient(180deg,#070B22,#222C58 55%,#3E0E18)"],
      spine: [lg("#8A3424", "#5A2018"), lg("#2A1A2E", "#140E20")], btn: [lg2("#B8382A", "#D2602E"), lg2("#F08A6A", "#F6B07A")]},
    kit: {motif: "n13maple", card: ["#FDF8F2", "#F4E4D4"], ink: "#2E1E18", bd: "#E6C8B0", mc: "#C8382A", r: 14, notes: ["#F8D8C8"].concat(NOTES), shape: "torn", pin: "washi2", fab: "999px", btn: "12px"},
    fx: {spawn: (W, H, d, n) => fxFall(W, H, n(60), "n13maple", d ? ["#C8384A", "#E0604A", "#A8243A", "#E89A5A"] : ["#C8282A", "#E2502C", "#F08A32", "#F4B840"], {sway: 2.2, flip: true, smin: 9, smax: 15, vmin: 0.9, vmax: 1.8}).map(p => Object.assign(p, {vx: fxR(0.5, 1.6), vr: fxR(-0.06, 0.06)}))
      .concat(fxBurst(W, H, n(18), "n13maple", d ? ["#E0604A", "#F08A6A"] : ["#E2502C", "#F4B840"], [[0.15, 1.02], [0.85, 1.02]], {smin: 11, smax: 16}).map(p => Object.assign(p, {vr: fxR(-0.08, 0.08)})),
        fxTw(W, H, n(20), "sparkle", d ? ["#FFE8C8", "#FFFFFF"] : ["#F6B83A", "#FFE07A"], {smin: 3, smax: 6, glow: d ? 10 : 4}))},
    tag: "A Japanese mountain ravine in autumn, with crimson, orange and gold maples over mossy boulders, a clear stream of little falls and stone steps beside it; a full moon behind red silhouettes at night"
  });
  MAJ_THEMES.push({
    skin: {id: "aspens", name: "Aspen Gold", group: "ideas", desc: "A mountain grove of white aspens, their golden leaves shimmering.",
      light: ["#FAF5E6", "rgba(200,150,30,.10)", "#FFFFFF", "#26261A", "#62604C", "#ECE2C4", "#F4EDD8", "#FDFBF4", "#B07A12", "#C8962E", "#FFFFFF", "#6A4608", "#2E4A6A", "#F2E4B8", "#FFE08A"],
      dark: ["#0C1022", "rgba(240,200,110,.08)", "#141A30", "#F2F0E6", "#B4B4C2", "#2A3048", "#20263C", "#111628", "#F2C25A", "#F6D486", "#16140E", "#8A6A2A", "#0C1226", "#DCD8C4", "#5A4A1A"],
      glow: ["linear-gradient(180deg,#4A90D6,#A8CCEA 45%,#E8B83A)", "linear-gradient(180deg,#060A20,#1A2450 55%,#4A3E1E)"],
      spine: [lg("#3A5E86", "#24405E"), lg("#1A2244", "#0C1226")], btn: [lg2("#B07A12", "#D2A02A"), lg2("#F2C25A", "#F8DC8A")]},
    kit: {motif: "n13aspen", card: ["#FFFCF2", "#F6EBCB"], ink: "#26261A", bd: "#E6D29A", mc: "#E0A82A", r: 16, notes: ["#F6E6B0"].concat(NOTES), shape: "rounded", pin: "tape", fab: "999px", btn: "14px"},
    fx: {spawn: (W, H, d, n) => fxFall(W, H, n(64), "n13aspen", d ? ["#F2C25A", "#F8DC8A", "#E0E4F0", "#D8A83A"] : ["#F2B81E", "#F8D040", "#E8A010", "#FCE070"], {sway: 2.6, flip: true, smin: 7, smax: 12, vmin: 1, vmax: 2}).map(p => Object.assign(p, {vx: fxR(0.8, 2), vr: fxR(-0.08, 0.08)}))
      .concat(fxBurst(W, H, n(16), "n13aspen", d ? ["#F8DC8A", "#FFFFFF"] : ["#F8D040", "#FFF2B0"], [[0.2, 1.02], [0.8, 1.02], [0.5, 1.04]], {smin: 10, smax: 14}),
        fxTw(W, H, n(30), "sparkle", d ? ["#FFF2C8", "#FFFFFF"] : ["#FFE07A", "#FFF6C8"], {smin: 3, smax: 6, glow: d ? 12 : 6}))},
    tag: "A Rocky Mountain hillside grove of slender white aspens with black eye marks and shimmering golden leaves, dark spruces, golden grass and a blue ridge beyond; moonlit trunks under the stars at night"
  });
})();
