/* Around the World: netherlands (Netherlands) */
(() => {
  const lg = (a, b) => `linear-gradient(180deg,${a},${b})`, lg2 = (a, b) => `linear-gradient(135deg,${a},${b})`;
  const r1 = n => Math.round(n * 100) / 100;
  const circ = (x, y, r) => `M${r1(x - r)} ${r1(y)}a${r1(r)} ${r1(r)} 0 1 0 ${r1(2 * r)} 0a${r1(r)} ${r1(r)} 0 1 0 ${r1(-2 * r)} 0Z`;
  const pts = a => "M" + a.map(p => `${r1(p[0])} ${r1(p[1])}`).join("L") + "Z";
  // four lattice sails around a hub, at angle a
  const sails = a => [0, 1, 2, 3].map(k => { const t = a + k * Math.PI / 2, c = Math.cos(t), s = Math.sin(t), P = (r, n) => [c * r - s * n, s * r + c * n]; return pts([P(1.2, -0.5), P(9.6, -0.5), P(9.6, 3), P(2.4, 3)]); }).join("");
  Object.assign(FX_SHAPES, {
    netherlandstulip: {d: "M-5 -2C-5.6 -6 -4.4 -9 -3.2 -10L-1.6 -6.4L0 -10.6L1.6 -6.4L3.2 -10C4.4 -9 5.6 -6 5 -2C4.4 2 2 3 0 3C-2 3 -4.4 2 -5 -2Z M-0.6 3H0.6V11H-0.6Z", detail: "M0 8Q-4 4 -7 5Q-4 9 0 9.4M0 7Q3.6 3.4 6.6 4.4Q4 8 0 8.6", dfill: true},
    netherlandsmill: {d: pts([[-3, 10], [3, 10], [1.8, -2], [-1.8, -2]]) + pts([[-2.2, -2], [2.2, -2], [1.4, -4.4], [-1.4, -4.4]]) + sails(0.45), detail: circ(0, -3.4, 1) + "M-1 10V6.6H1V10Z", dfill: true},
    netherlandsgoose: {d: "M-10 1Q-4 -1 1 0Q4 -4 7 -5Q9 -5.6 10 -4.6L8 -3.6Q6 -2.6 4.6 1Q3 4 -2 4Q-7 4 -10 1Z M-4 0Q-1 -9 3 -10Q1 -5 0 0Z"},
    netherlandsclog: {d: "M-10 2Q-10 -3 -6 -4L-2 -4Q0 -7 4 -7Q9 -7 10 -1Q10.6 4 6 5L-6 5Q-10 5 -10 2Z", detail: "M-3 -3.4Q0 -1.6 3 -5.6M5 -2Q7 -3 8 -1", dstroke: true},
    netherlandswafel: {d: circ(0, 0, 10), detail: "M-7 -4L4 7M-4 -7L7 4M-7 4L4 -7M-4 7L7 -4M-9 0L0 9M0 -9L9 0M-9 0L0 -9M0 9L9 0", dstroke: true}
  });
  MAJ_THEMES.push({
    skin: {id: "netherlands", name: "Netherlands", group: "world", desc: "Windmills and striped tulip fields by a canal.",
      light: ["#F3F7FB", "rgba(47,94,158,.08)", "#FFFFFF", "#1C2A3E", "#56667E", "#D6E1EE", "#E8EFF7", "#FAFCFE", "#2F5E9E", "#D2691E", "#FFFFFF", "#1E3E70", "#24477E", "#DCE6F4", "#FFE3A0"],
      dark: ["#0E1530", "rgba(242,168,90,.07)", "#172042", "#EEF2FA", "#AAB4D0", "#2C3866", "#222C56", "#131A38", "#F2A85A", "#FFD08A", "#1A1430", "#7A5A30", "#161E40", "#D6DCEE", "#6A5428"],
      glow: ["linear-gradient(180deg,#A9CDEE,#E4EFF8 45%,#F3F0DA)", "linear-gradient(180deg,#101A38,#23305A 45%,#4A4A72)"],
      spine: [lg("#2F5E9E", "#1E3E70"), lg("#23305A", "#101A38")], btn: [lg2("#C2561C", "#D27A26"), lg2("#F2A85A", "#FFD08A")]},
    kit: {motif: "netherlandstulip", card: ["#F7FAFE", "#E4ECF6"], ink: "#1C2A3E", bd: "#C6D6EA", mc: "#2F5E9E", r: 14, notes: ["#DCE6F4", "#FFF3B8", "#FFD6DE", "#D9F0D8", "#FFE0C2", "#EBD9FF"], shape: "folded", pin: "magnet", fab: "16px 16px 16px 4px", btn: "12px"},
    fx: {spawn: (W, H, d, n) => fxBurst(W, H, n(36), "netherlandstulip", d ? ["#E8506A", "#F2C84A", "#F49AC0", "#F59A4A", "#A47AE0"] : ["#E3343C", "#F7C925", "#F38AB2", "#F5862A", "#8E58C6"], [[0.12, 1.02], [0.88, 1.02], [0.5, 1.04]], {smin: 9, smax: 14})
      .concat(fxFall(W, H, n(40), "petal", d ? ["#F4A0B8", "#FFD86A", "#F59A4A"] : ["#F38AB2", "#F7C925", "#E3343C", "#F5862A"], {sway: 1.6, flip: true, smin: 5, smax: 8}),
        fxRise(W, H, n(3), "netherlandsmill", d ? ["#CFD8F0"] : ["#2F5E9E"], {cx: [0.2, 0.8], smin: 14, smax: 18, vmin: 0.9, vmax: 1.3, sway: 0.4, life: 300}).map(p => Object.assign(p, {vr: 0.04})),
        fxTw(W, H, n(22), "sparkle", d ? ["#FFE3A8", "#FFFFFF"] : ["#F2B53A", "#FFD86B"], {smin: 3, smax: 6, glow: d ? 10 : 4}))},
    tag: "A flat Dutch polder under a big sky, with windmills turning by a canal, striped tulip fields and gabled canal houses"
  });
})();
