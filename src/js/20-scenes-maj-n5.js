/* ===== module: 20-scenes-maj-n5.js ===== */
/* New Theme Ideas, batch n5 */
(() => {
  const lg = (a, b) => `linear-gradient(180deg,${a},${b})`, lg2 = (a, b) => `linear-gradient(135deg,${a},${b})`;
  const r1 = n => Math.round(n * 100) / 100;
  const pts = a => "M" + a.map(p => `${r1(p[0])} ${r1(p[1])}`).join("L") + "Z";
  const circ = (x, y, r) => `M${r1(x - r)} ${r1(y)}a${r1(r)} ${r1(r)} 0 1 0 ${r1(2 * r)} 0a${r1(r)} ${r1(r)} 0 1 0 ${r1(-2 * r)} 0Z`;
  const NOTES = ["#FFF3B8", "#D9F0D8", "#D6E6FF", "#FFD9C8", "#EBD9FF"];
  Object.assign(FX_SHAPES, {
    // a little waving rainbow flag on a pole
    n5flag: {d: "M-9 -10.5H-7.4V11H-9Z M-7.4 -10C-3 -12 1 -7.6 9.6 -9.6V3.6C1 5.6 -3 1.2 -7.4 3.2Z", detail: "M-7.4 -7.7C-3 -9.7 1 -5.3 9.6 -7.3M-7.4 -5.4C-3 -7.4 1 -3 9.6 -5M-7.4 -3.1C-3 -5.1 1 -0.7 9.6 -2.7M-7.4 -0.8C-3 -2.8 1 1.6 9.6 -0.4", dstroke: true},
    n5heart: {d: "M0 9.6C-6 5 -10.4 1.4 -10.4 -3.4C-10.4 -7 -7.6 -9.4 -4.8 -9.4C-2.6 -9.4 -0.9 -8.2 0 -6.4C0.9 -8.2 2.6 -9.4 4.8 -9.4C7.6 -9.4 10.4 -7 10.4 -3.4C10.4 1.4 6 5 0 9.6Z", detail: "M-6 -5.6Q-7.4 -3 -5.8 -0.6", dstroke: true},
    n5rect: {d: "M-5 -2.6H5V2.6H-5Z"},
    n5streamer: {d: "M-10 -9C-4 -10 -6 -3 0 -4C6 -5 4 2 10 1L10 4C4 5 6 -2 0 -1C-6 0 -4 -7 -10 -6Z"}
  });
  const rainbow = d => d ? ["#FF6B76", "#FFAE5A", "#FFE066", "#72D67A", "#62A8F2", "#B07CF0"] : ["#E8505B", "#F59E42", "#F7D046", "#5DBB63", "#4A90D9", "#8E5CC7"];
  // confetti thrown up from the two bottom corners, fluttering down
  const cannon = (W, H, n, cols, shape = "n5rect", o = {}) => fxBurst(W, H, n, shape, cols, [[0.04, 1.02], [0.96, 1.02]], Object.assign({smin: 6, smax: 9, g: 0.16}, o)).map(p => Object.assign(p, {vx: p.vx * 1.6 + (p.x < W / 2 ? 2.4 : -2.4), vy: p.vy * 1.15, sway: 1.4, swf: fxR(0.05, 0.1), flip: true, life: 300}));

  MAJ_THEMES.push({
    skin: {id: "pride", name: "Pride Parade", group: "ideas", desc: "A rainbow street hung with flags and bunting, ready for the parade.",
      light: ["#FBF3FA", "rgba(184,64,122,.10)", "#FFFFFF", "#2A1E3A", "#6A5A7A", "#EEDDEB", "#F5EAF3", "#FDF9FC", "#B8407A", "#7A4AB8", "#FFFFFF", "#7A2452", "#4E2E72", "#F2D6E8", "#FFE7A0"],
      dark: ["#1A1532", "rgba(255,143,200,.08)", "#241C42", "#F8F0FF", "#C2B2D8", "#3E3262", "#2F2652", "#1E183A", "#FF8FC8", "#C6A0FF", "#1E1A3E", "#8A4A7A", "#14102C", "#E2D2F2", "#6A4A3A"],
      glow: ["linear-gradient(180deg,#BDE3F7,#FDF0F5 58%,#FFE9C2)", "linear-gradient(180deg,#1E1A3E,#3A2560 52%,#6A2E6A)"],
      spine: [lg("#7A4A9E", "#4E2E72"), lg("#3A2560", "#1E1A3E")], btn: [lg2("#B8407A", "#7A4AB8"), lg2("#FF8FC8", "#C6A0FF")]},
    kit: {motif: "n5heart", card: ["#FFFBFE", "#F6E8F2"], ink: "#2A1E3A", bd: "#EBCDE2", mc: "#B8407A", r: 18, notes: ["#F6D8EA"].concat(NOTES), shape: "rounded", pin: "heartpin", fab: "999px", btn: "999px"},
    fx: {spawn: (W, H, d, n) => cannon(W, H, n(90), rainbow(d).concat(["#FFFFFF"]))
      .concat(fxRise(W, H, n(9), "n5flag", rainbow(d), {smin: 14, smax: 20, vmin: 1.2, vmax: 2.2, sway: 0.9, life: 300, glow: d ? 8 : 0}).map(p => Object.assign(p, {rot: fxR(-0.2, 0.2)})),
        fxRise(W, H, n(12), "n5heart", rainbow(d), {smin: 9, smax: 15, vmin: 1, vmax: 2, sway: 1.1, life: 300, glow: d ? 10 : 0}),
        fxTw(W, H, n(30), "sparkle", d ? ["#FFFFFF", "#FFB3E6", "#FFE066"] : ["#F2B53A", "#FF8FC8", "#8E5CC7"], {smin: 3, smax: 7, glow: d ? 10 : 4}))},
    tag: "A street of pastel townhouses hung with rainbow flags and bunting, a rainbow crosswalk and a corgi in a rainbow bandana"
  });

  Object.assign(FX_SHAPES, {
    n5cap: {d: "M0 -8.6L11.6 -3.4L0 1.8L-11.6 -3.4Z M-7 -0.4V4.6Q0 8.6 7 4.6V-0.4L0 2.8Z", detail: "M0 -3.4L8.6 -1V6.4M7.4 6.4H9.8L10.4 10H6.8Z", dstroke: true},
    n5scroll: {d: "M-8.6 -7H8.6V7H-8.6Z", detail: "M-8.6 -7A2.4 7 0 0 0 -8.6 7M8.6 -7A2.4 7 0 0 1 8.6 7M-4.6 -2.4H4.6M-4.6 0.6H4.6M-3 3.6H3", dstroke: true},
    n5star: {d: "M0 -10.6L3 -3.4L10.6 -3L4.8 2L6.6 9.8L0 5.6L-6.6 9.8L-4.8 2L-10.6 -3L-3 -3.4Z"}
  });
  MAJ_THEMES.push({
    skin: {id: "graduation", name: "Graduation Day", group: "ideas", desc: "A grand campus quad with a clock-tower hall, brick colleges and the whole class out on the lawn.",
      light: ["#F1F6FA", "rgba(46,74,138,.10)", "#FFFFFF", "#16213A", "#566078", "#D8E2EE", "#E6EDF5", "#F9FBFD", "#2E4A8A", "#C9962A", "#FFFFFF", "#1E3366", "#1E3366", "#D6E2F4", "#FFE3A0"],
      dark: ["#101830", "rgba(242,200,90,.08)", "#18223E", "#EEF2FC", "#A8B4D4", "#2C3A62", "#222E52", "#141C36", "#F2C85A", "#F6DA8A", "#141E3A", "#7A6430", "#0C1428", "#D6DEF2", "#6A5420"],
      glow: ["linear-gradient(180deg,#B9DAF3,#EAF3FA 56%,#D9E8C2)", "linear-gradient(180deg,#141E3A,#22305A 50%,#4A4A6E)"],
      spine: [lg("#2E4A8A", "#1E3366"), lg("#22305A", "#141E3A")], btn: [lg2("#2E4A8A", "#4A6AB0"), lg2("#F2C85A", "#F6DA8A")]},
    kit: {motif: "n5cap", card: ["#FAFCFE", "#E6EDF6"], ink: "#16213A", bd: "#C8D4E8", mc: "#2E4A8A", r: 12, notes: ["#DCE4F2"].concat(NOTES), shape: "classic", pin: "gold", fab: "14px", btn: "10px"},
    fx: {spawn: (W, H, d, n) => fxBurst(W, H, n(34), "n5cap", d ? ["#3A4E8E", "#2E3E7A", "#4A5E9E"] : ["#2E4A8A", "#1E3366", "#3A5A9E"], [[0.2, 1.02], [0.5, 1.04], [0.8, 1.02]], {smin: 13, smax: 19, g: 0.22}).map(p => Object.assign(p, {vr: fxR(-0.25, 0.25), life: 260}))
      .concat(cannon(W, H, n(60), d ? ["#F2C85A", "#FFFFFF", "#7FB8F0"] : ["#F2B83A", "#FFFFFF", "#2E4A8A", "#7FB8F0"]),
        fxRise(W, H, n(4), "n5scroll", d ? ["#F6E6C0"] : ["#E8D2A0"], {cx: [0.2, 0.8], smin: 15, smax: 19, vmin: 1, vmax: 1.6, sway: 0.6, life: 300, glow: d ? 8 : 0}),
        fxTw(W, H, n(30), "n5star", d ? ["#F2C85A", "#FFFFFF"] : ["#F2B83A", "#2E4A8A"], {smin: 3, smax: 7, glow: d ? 10 : 3}))},
    tag: "A grand campus quad: a columned clock-tower hall with grand steps, brick colleges down both sides, spires beyond, a gate, banners and bunting, and a class of graduates who fling their caps into the sky"
  });

  Object.assign(FX_SHAPES, {
    n5gift: {d: "M-9 -2.6H9V10H-9Z M-10.4 -7H10.4V-2.6H-10.4Z", detail: "M0 -7V10M-9 3.4H9M0 -7C-2 -11.6 -7.4 -11 -5.6 -7.6M0 -7C2 -11.6 7.4 -11 5.6 -7.6", dstroke: true},
    n5ballo: {d: "M0 -11C5.4 -11 8.2 -7 8.2 -3C8.2 2.4 3.4 5.6 0.8 6.8L1.8 8.6H-1.8L-0.8 6.8C-3.4 5.6 -8.2 2.4 -8.2 -3C-8.2 -7 -5.4 -11 0 -11Z", detail: "M-4 -6.6Q-5.4 -4 -4.6 -1.6M0 8.6Q-1.6 10.4 0.6 12", dstroke: true},
    n5hat: {d: "M0 -11L7.6 8.4Q0 10.8 -7.6 8.4Z", detail: "M-2.6 -4.4L3 -2.4M-4.6 1.6L5.2 4.6", dstroke: true}
  });
  MAJ_THEMES.push({
    skin: {id: "birthday", name: "Birthday Bash", group: "ideas", desc: "A living room decorated for a party: balloons, streamers, gifts and a pinata.",
      light: ["#FFF5F8", "rgba(194,64,122,.10)", "#FFFFFF", "#3A1E30", "#7A5A6A", "#F2DCE4", "#F8E8EE", "#FFFAFC", "#C2407A", "#8A5AD0", "#FFFFFF", "#7A2452", "#8A3466", "#F6D6E4", "#FFE7A0"],
      dark: ["#1C1430", "rgba(255,143,200,.08)", "#261C40", "#FCEFFA", "#CDB4D8", "#3E2E5E", "#30244E", "#201836", "#FF8FC8", "#FFD86B", "#20183A", "#8A4A7A", "#140E26", "#E6D2F2", "#6A4A3A"],
      glow: ["linear-gradient(180deg,#FFD9E4,#FFF3DA 58%,#D8F0F6)", "linear-gradient(180deg,#20183A,#3A2458 55%,#6A3A6E)"],
      spine: [lg("#C2508A", "#8A3466"), lg("#4A2A62", "#20183A")], btn: [lg2("#C2407A", "#8A5AD0"), lg2("#FF8FC8", "#FFD86B")]},
    kit: {motif: "n5ballo", card: ["#FFFBFD", "#FBE6EF"], ink: "#3A1E30", bd: "#F2C8DA", mc: "#C2407A", r: 20, notes: ["#FBD6E4"].concat(NOTES), shape: "scallop", pin: "washi2", fab: "999px", btn: "999px"},
    fx: {spawn: (W, H, d, n) => cannon(W, H, n(80), d ? ["#FF7FA8", "#7FE0C8", "#FFD86B", "#C6A0FF", "#7FC8FF", "#FFFFFF"] : ["#FF8FB8", "#7FD8C0", "#FFD45A", "#B58CF2", "#7FC8F0", "#FF9F7A"])
      .concat(fxRise(W, H, n(14), "n5ballo", d ? ["#FF7FA8", "#7FE0C8", "#FFD86B", "#C6A0FF", "#7FC8FF"] : ["#FF8FB8", "#7FD8C0", "#FFD45A", "#B58CF2", "#7FC8F0"], {smin: 14, smax: 22, vmin: 1.2, vmax: 2.4, sway: 1, life: 300, glow: d ? 8 : 0}).map(p => Object.assign(p, {rot: fxR(-0.15, 0.15)})),
        fxBurst(W, H, n(10), "n5gift", d ? ["#C6A0FF", "#7FC8FF", "#FF7FA8"] : ["#B58CF2", "#7FC8F0", "#FF8FB8"], [[0.3, 1.02], [0.7, 1.02]], {smin: 12, smax: 16}).map(p => Object.assign(p, {vr: fxR(-0.08, 0.08)})),
        fxBurst(W, H, n(8), "n5hat", d ? ["#FFD86B", "#FF7FA8", "#7FE0C8"] : ["#FFD45A", "#FF8FB8", "#7FD8C0"], [[0.5, 1.04]], {smin: 12, smax: 16}),
        fxTw(W, H, n(26), "sparkle", d ? ["#FFFFFF", "#FFD86B", "#FFB3E6"] : ["#F2B53A", "#FF8FB8", "#B58CF2"], {smin: 3, smax: 7, glow: d ? 10 : 4}))},
    tag: "A living room decorated for a party, with a birthday cake, a pile of gifts, a turning llama pinata and a cat in a party hat"
  });

  Object.assign(FX_SHAPES, {
    n5crys: {d: "M-3.2 10.6L-4.4 -4.6L0 -11.4L4.4 -4.6L3.2 10.6Z M-4 10.6L-9.4 0.4L-8.6 -4L-5.4 -0.6L-4.6 10.6Z M4 10.6L9.4 1.4L8.8 -2.6L5.6 0.2L4.6 10.6Z", detail: "M0 -11.4V10.6M-4.4 -4.6L0 -2.4L4.4 -4.6", dstroke: true},
    n5gem: {d: "M-10 -3L-5.4 -9H5.4L10 -3L0 10Z", detail: "M-10 -3H10M-5.4 -9L-2.6 -3L0 10M5.4 -9L2.6 -3L0 10M-2.6 -3L0 -9L2.6 -3", dstroke: true},
    n5rock: {d: "M-9.6 4.6L-7.4 -4.2L-1.6 -8.6L5.4 -7L9.8 -1L8.4 6.4L1 9L-6 8.4Z", detail: "M-6 -2.6Q-1 -4 2 -0.6M-3.4 4Q1 2.4 5.6 4.6", dstroke: true}
  });
  MAJ_THEMES.push({
    skin: {id: "geology", name: "Crystal Cave", group: "ideas", desc: "A cave with layered rock walls, still pools and glowing crystals.",
      light: ["#F3F1F8", "rgba(122,62,200,.10)", "#FFFFFF", "#241A36", "#655878", "#E0DAEA", "#ECE7F3", "#FAF9FC", "#7A3EC8", "#3E9AB0", "#FFFFFF", "#4E2A86", "#463466", "#E2D8F4", "#FFE3B0"],
      dark: ["#0E0B1E", "rgba(194,154,255,.08)", "#181230", "#F2ECFF", "#B8AAD6", "#2E2450", "#241C42", "#150F2A", "#C29AFF", "#7AE8F0", "#120E24", "#6A4A9A", "#0A0818", "#DCCFF4", "#3A6A70"],
      glow: ["linear-gradient(180deg,#CBD7EA,#E8ECF4 55%,#D7CDE6)", "linear-gradient(180deg,#120E24,#22183E 50%,#3E2A62)"],
      spine: [lg("#6A5490", "#463466"), lg("#2A1E4A", "#120E24")], btn: [lg2("#7A3EC8", "#3E9AB0"), lg2("#C29AFF", "#7AE8F0")]},
    kit: {motif: "n5crys", card: ["#FAF8FD", "#ECE6F5"], ink: "#241A36", bd: "#D6CAEA", mc: "#7A3EC8", r: 10, notes: ["#E4DAF4"].concat(NOTES), shape: "torn", pin: "gold", fab: "16px", btn: "10px"},
    fx: {spawn: (W, H, d, n) => fxBurst(W, H, n(30), "n5crys", d ? ["#C29AFF", "#7AE8F0", "#FF9AD8"] : ["#9A62D8", "#3EB4C0", "#E07AAE"], [[0.5, 1.04], [0.2, 1.02], [0.8, 1.02]], {smin: 10, smax: 16, glow: d ? 12 : 4})
      .concat(fxRise(W, H, n(12), "n5gem", d ? ["#E2C8FF", "#C8FAFF", "#FFD8EE"] : ["#B58CF2", "#5CCFD8", "#F28AC0"], {smin: 10, smax: 15, vmin: 1, vmax: 2, sway: 0.8, life: 300, glow: d ? 12 : 3}).map(p => Object.assign(p, {vr: fxR(-0.02, 0.02)})),
        fxFall(W, H, n(14), "n5rock", d ? ["#5A4A6E", "#6A5A80"] : ["#9584AA", "#7E6C94"], {smin: 6, smax: 10, vmin: 1.6, vmax: 2.6}),
        fxTw(W, H, n(40), "sparkle", d ? ["#FFFFFF", "#E2C8FF", "#C8FAFF"] : ["#B58CF2", "#5CCFD8", "#F2B53A"], {smin: 3, smax: 7, glow: d ? 12 : 4}))},
    tag: "A crystal cave with layered rock walls, still pools, dripping stalactites, a sleepy bat and a geode waiting to crack open"
  });
})();
/* end of module 20-scenes-maj-n5.js */






