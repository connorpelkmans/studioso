/* Study Fields themes, batch n6: film, culinary, marinebio, vet, aerospace (Style Shop group "New Theme Ideas") */
(() => {
  const lg = (a, b) => `linear-gradient(180deg,${a},${b})`, lg2 = (a, b) => `linear-gradient(135deg,${a},${b})`;
  const r1 = n => Math.round(n * 100) / 100;
  const circ = (x, y, r) => `M${r1(x - r)} ${r1(y)}a${r1(r)} ${r1(r)} 0 1 0 ${r1(2 * r)} 0a${r1(r)} ${r1(r)} 0 1 0 ${r1(-2 * r)} 0Z`;
  const hole = (x, y, r) => `M${r1(x - r)} ${r1(y)}a${r1(r)} ${r1(r)} 0 1 1 ${r1(2 * r)} 0a${r1(r)} ${r1(r)} 0 1 1 ${r1(-2 * r)} 0Z`;   // the other way round: cuts a hole
  Object.assign(FX_SHAPES, {
    n6clap: {d: "M-10 -3H10V10H-10Z M-10.6 -4.6L9.4 -9.8L10.4 -6.2L-9.6 -1Z", detail: "M-6.4 -7.9L-4 -2.9M-1 -9.3L1.4 -4.3M4.4 -10.7L6.8 -5.7M-10 3H10", dstroke: true},
    n6reel: {d: circ(0, 0, 10.5) + hole(0, -5, 2.8) + hole(4.3, 2.5, 2.8) + hole(-4.3, 2.5, 2.8) + hole(0, 0, 1.2)},
    n6corn: {d: "M-4 2C-8 1 -8.6 -4.6 -4.4 -5.4C-4 -9.4 1.6 -10 2.6 -6.4C6.6 -7.6 9 -2.4 6 0C8.4 3 5.4 7.2 2 5.6C0.6 9 -4.6 8.4 -4.6 4.6C-7.6 4.4 -7.6 2 -4 2Z", detail: "M-1.6 -2.4Q0 -1 1.8 -2.6M-2.6 1.6Q-0.6 3 1 1.6", dstroke: true},
    n6toque: {d: "M-7 3C-11.6 2.4 -12.4 -5.6 -7.4 -6.6C-7.6 -11.6 -1.6 -12.6 0 -9C1.6 -12.6 7.6 -11.6 7.4 -6.6C12.4 -5.6 11.6 2.4 7 3V10H-7Z", detail: "M-7 5.6H7M-3 3V-2M3 3V-2", dstroke: true},
    n6tomato: {d: "M0 -5C6 -5 9 -1 9 3C9 8 5 10 0 10C-5 10 -9 8 -9 3C-9 -1 -6 -5 0 -5Z M0 -4L-4 -9L-1 -6L0 -10L1 -6L4 -9Z", detail: "M-5 1Q-4 -1 -2 -1.6", dstroke: true},
    n6egg: {d: "M-9 1C-11 -5 -5 -9.6 0 -8.4C5 -10.6 11 -6 9.6 0C11 6 5 9.6 0 8.4C-5 10.4 -11 6.6 -9 1Z", detail: "M-3.8 0A3.8 3.8 0 1 0 3.8 0A3.8 3.8 0 1 0 -3.8 0", dfill: true},
    n6whisk: {d: "M0 11V3M0 3C-6 -2 -5 -10 0 -11C5 -10 6 -2 0 3M0 3C-2.6 -2 -2.4 -9 0 -11C2.4 -9 2.6 -2 0 3", stroke: true, lw: 1.5},
    n6fish: {d: "M-11 0L-15 -5.4L-14 0L-15 5.4Z M-9 0C-6 -6.4 4 -7.4 9.4 -1.6C10.4 -0.6 10.4 0.6 9.4 1.6C4 7.4 -6 6.4 -9 0Z", detail: "M5.4 -1.6A1.4 1.4 0 1 0 5.41 -1.6", dfill: true},
    n6dolphin: {d: "M-11 1C-6 -5 2 -6 7 -4C9 -6 9 -9 7 -10C10 -9 11 -6 10.4 -3C12 -2 13.6 -1 14.6 0.4C13 1.4 11 1.6 9 2C3 6 -4 5 -9 3L-13 6.6L-12.6 2L-15.4 -1.6L-11 1Z", detail: "M6.4 -1.4A1 1 0 1 0 6.41 -1.4", dfill: true},
    n6bone: {d: "M-6 -2.2H6A3.4 3.4 0 1 1 9 -5.6A3.4 3.4 0 1 1 9 5.6A3.4 3.4 0 1 1 6 2.2H-6A3.4 3.4 0 1 1 -9 5.6A3.4 3.4 0 1 1 -9 -5.6A3.4 3.4 0 1 1 -6 -2.2Z"},
    n6plaster: {d: "M-11 -4.6H11V4.6H-11Z", detail: "M-3.4 -4.6V4.6M3.4 -4.6V4.6M-1.6 -1.4H-0.4M0.6 1.4H1.6M-1.6 1.4H-0.4M0.6 -1.4H1.6", dstroke: true},
    n6sat: {d: "M-2.6 -3.4H2.6V3.4H-2.6Z M-11.6 -2.6H-4.4V2.6H-11.6Z M4.4 -2.6H11.6V2.6H4.4Z M-0.8 -3.4V-7.6H0.8V-3.4Z" + circ(0, -8.6, 1.8), detail: "M-9.2 -2.6V2.6M-6.8 -2.6V2.6M6.8 -2.6V2.6M9.2 -2.6V2.6", dstroke: true},
    n6ticket: {d: "M-11 -6H11V-2.4A2.4 2.4 0 0 0 11 2.4V6H-11V2.4A2.4 2.4 0 0 0 -11 -2.4Z", detail: "M-5 -6V6", dstroke: true}
  });

  MAJ_THEMES.push({
    skin: {id: "film", name: "Movie Palace", group: "ideas", desc: "An old picture palace with red velvet seats, a marquee and a projector beam.",
      light: ["#F8F0E8", "rgba(168,48,62,.10)", "#FFFFFF", "#2E1418", "#74585A", "#EBD9CF", "#F4E6DC", "#FCF8F4", "#A8303E", "#C8564A", "#FFFFFF", "#6E1C28", "#5A1E2E", "#F2DCD0", "#FFE3A3"],
      dark: ["#170E16", "rgba(242,196,106,.08)", "#22141E", "#F8EEEE", "#C2A8B0", "#3A2432", "#2C1A26", "#1C1019", "#F2C46A", "#F6D592", "#2A1220", "#7A5A30", "#1A0E16", "#E8D2D8", "#6A4A26"],
      glow: ["linear-gradient(180deg,#E7D3C3,#F4E7DC 45%,#D7B6A0)", "linear-gradient(180deg,#160F1E,#2A1A2E 50%,#5A1E2E)"],
      spine: [lg("#7A2434", "#5A1E2E"), lg("#3A1A2A", "#1A0E16")], btn: [lg2("#A8303E", "#C0503A"), lg2("#F2C46A", "#F6D592")]},
    kit: {motif: "n6reel", card: ["#FCF7F2", "#F1E2D8"], ink: "#2E1418", bd: "#E2C6B8", mc: "#A8303E", r: 12, notes: ["#F6DCD2", "#FFF3B8", "#D9F0D8", "#D6E6FF", "#FFD9C8", "#EBD9FF"], shape: "classic", pin: "gold", fab: "999px", btn: "10px"},
    fx: {spawn: (W, H, d, n) => fxBurst(W, H, n(46), "n6corn", d ? ["#FFF1C2", "#FBE39A", "#FFFFFF"] : ["#FFE9A8", "#FFF6D6", "#F6D27A"], [[0.15, 1.02], [0.85, 1.02], [0.5, 1.04]], {smin: 8, smax: 12, glow: d ? 6 : 0})
      .concat(fxFall(W, H, n(10), "n6ticket", d ? ["#F2C46A", "#E86A7A"] : ["#C8323F", "#E0A040"], {sway: 1.6, flip: true, smin: 12, smax: 16, vmin: 1.2, vmax: 2.2}),
        fxRise(W, H, n(5), "n6reel", d ? ["#C9CFDD", "#F2C46A"] : ["#5A6278", "#8E2A36"], {smin: 14, smax: 19, vmin: 1.1, vmax: 1.8, sway: 0.5, life: 300}).map(p => Object.assign(p, {vr: 0.05})),
        fxTw(W, H, n(36), "star", d ? ["#FFE7B0", "#FFFFFF", "#F2C46A"] : ["#F2B53A", "#FFD86B", "#E05A6A"], {smin: 3, smax: 7, glow: d ? 10 : 4}))},
    tag: "An old picture palace: red velvet seats, gathered curtains, a marquee of chasing bulbs and a projector beam full of dust"
  });
  MAJ_THEMES.push({
    skin: {id: "culinary", name: "Test Kitchen", group: "ideas", desc: "A bright professional kitchen with copper pots, an herb window box and order tickets on the pass.",
      light: ["#F6F8F2", "rgba(62,122,90,.10)", "#FFFFFF", "#2A2018", "#6E6052", "#E2E6DA", "#EEF2E8", "#FBFCF8", "#C8603A", "#D97B45", "#FFFFFF", "#7A3418", "#285A40", "#E6F0E8", "#FFE7A0"],
      dark: ["#16141A", "rgba(242,163,90,.08)", "#211E24", "#F4EEE6", "#B8ACA0", "#36303A", "#2A2530", "#1A171E", "#F2A35A", "#F6C27A", "#241A14", "#7A5230", "#141218", "#E8DED4", "#6A4A26"],
      glow: ["linear-gradient(180deg,#F2E3CF,#FBF4EA 50%,#DCE8D2)", "linear-gradient(180deg,#1C1A22,#2E2830 50%,#5A3E34)"],
      spine: [lg("#3E7A5A", "#285A40"), lg("#2A2830", "#141218")], btn: [lg2("#C8603A", "#D97B45"), lg2("#F2A35A", "#F6C27A")]},
    kit: {motif: "n6toque", card: ["#FBFCF8", "#ECF2E6"], ink: "#2A2018", bd: "#D2DEC8", mc: "#C8603A", r: 14, notes: ["#E2EED8", "#FFF3B8", "#FFE0CC", "#D6E6FF", "#FFD9C8", "#EBD9FF"], shape: "lined", pin: "magnet", fab: "16px", btn: "12px"},
    fx: {spawn: (W, H, d, n) => fxBurst(W, H, n(40), "leaf", d ? ["#7FCB6A", "#5DA84E", "#A8DC8E"] : ["#4E9E4A", "#6CC05A", "#3E8A3A"], [[0.15, 1.02], [0.85, 1.02], [0.5, 1.04]], {smin: 7, smax: 11, flip: true})
      .concat(fxFall(W, H, n(10), "n6whisk", d ? ["#F2A35A", "#D8DEE6"] : ["#C8603A", "#8E99A6"], {sway: 1.4, smin: 13, smax: 17, vmin: 1.1, vmax: 1.9}),
        fxRise(W, H, n(4), "n6toque", d ? ["#F4EEE6"] : ["#FFFFFF"], {smin: 16, smax: 20, vmin: 1, vmax: 1.6, sway: 0.6, life: 300, glow: d ? 6 : 3}).map(p => Object.assign(p, {rot: fxR(-0.2, 0.2)})),
        fxBurst(W, H, n(18), "n6tomato", d ? ["#F06A5A", "#F2A35A"] : ["#E2463A", "#F2A33A"], [[0.2, 1.02], [0.8, 1.02]], {smin: 8, smax: 11}),
        fxTw(W, H, n(30), "sparkle", d ? ["#FFE7B0", "#FFFFFF", "#F2A35A"] : ["#F2B53A", "#FFD86B", "#E07A4A"], {smin: 3, smax: 7, glow: d ? 10 : 4}))},
    tag: "A bright test kitchen: copper pots on the rack, herbs in the window box, order tickets on the pass and pots simmering on the range"
  });

  MAJ_THEMES.push({
    skin: {id: "marinebio", name: "Kelp Forest", group: "ideas", desc: "An underwater kelp forest with sunbeams, an otter and a little research submarine.",
      light: ["#EEF8F6", "rgba(46,138,134,.10)", "#FFFFFF", "#0E2E30", "#4C6A6A", "#CFE6E2", "#E0F2EE", "#F6FCFB", "#1F8A86", "#3AA6A0", "#FFFFFF", "#145E5A", "#1A5E5E", "#D8F2EE", "#FFE7A0"],
      dark: ["#071A20", "rgba(242,194,48,.07)", "#0D2830", "#E6F6F4", "#9CC0BE", "#1C4048", "#14343C", "#0A2026", "#F2C230", "#F6D86A", "#0A2028", "#7A6A20", "#06161C", "#CFEAE6", "#5A4A1A"],
      glow: ["linear-gradient(180deg,#C8EBDD,#8FD0C2 40%,#5FB6B0)", "linear-gradient(180deg,#1E4E52,#0E3440 40%,#08202A)"],
      spine: [lg("#2E8A86", "#1A5E5E"), lg("#0E3440", "#06161C")], btn: [lg2("#1F8A86", "#3AA6A0"), lg2("#F2C230", "#F6D86A")]},
    kit: {motif: "n6fish", card: ["#F4FBFA", "#DDF0EC"], ink: "#0E2E30", bd: "#A8D6CE", mc: "#1F8A86", r: 20, notes: ["#D6F0EA", "#FFF3B8", "#FFE0CC", "#D6E6FF", "#FFD9C8", "#EBD9FF"], shape: "scallop", pin: "magnet", fab: "999px", btn: "999px"},
    fx: {spawn: (W, H, d, n) => fxRise(W, H, n(60), "bubble", d ? ["#9EE6EE", "#E2F8FA", "#6FD6E0"] : ["#FFFFFF", "#D6F4F2", "#9EDCD6"], {smin: 5, smax: 14, sway: 1.2})
      .concat(Array.from({length: n(10)}, (_, i) => { const lr = i % 2 === 0, sp = fxR(2.6, 4.2); return {shape: i % 3 ? "n6fish" : "n6dolphin", c: fxPick(i % 3 ? (d ? ["#F2A35A", "#F6D86A"] : ["#FF8A3A", "#F2B624"]) : (d ? ["#9EC6E8"] : ["#6E9AC0"])), x: lr ? fxR(-80, -20) : W + fxR(20, 80), y: fxR(H * 0.2, H * 0.85), vx: (lr ? 1 : -1) * sp, vy: fxR(-0.3, 0.3), g: 0, size: fxR(13, 19), rot: lr ? 0 : Math.PI, flip: false, vr: 0, sway: 1.4, swf: fxR(0.05, 0.09), life: 300, delay: Math.floor(fxR(0, 70))}; }),
        fxBurst(W, H, n(14), "starfish", d ? ["#F07A5A", "#F2A35A"] : ["#F07A5A", "#FF9A6A", "#F2B624"], [[0.15, 1.02], [0.85, 1.02]], {smin: 9, smax: 13}),
        fxBurst(W, H, n(10), "shell", d ? ["#FFE4D0", "#F7C6D8"] : ["#FFE4D0", "#F7B6C8"], [[0.5, 1.04]], {smin: 9, smax: 12}),
        fxTw(W, H, n(26), "sparkle", d ? ["#C8FFF4", "#FFFFFF", "#F6D86A"] : ["#FFFFFF", "#F2D24A", "#8FE0D8"], {smin: 3, smax: 7, glow: d ? 10 : 4}))},
    tag: "Under the sea in a kelp forest: sunbeams, swaying golden kelp, an otter napping on the surface and a little yellow research sub"
  });

  MAJ_THEMES.push({
    skin: {id: "vet", name: "Vet Clinic", group: "ideas", desc: "A friendly animal clinic with kennels, an exam table and a jar of treats.",
      light: ["#F1F8F7", "rgba(62,154,138,.10)", "#FFFFFF", "#1A2A30", "#56686E", "#D6E6E4", "#E4F1EF", "#F8FCFB", "#E0705A", "#F08A6A", "#FFFFFF", "#8A3424", "#26705E", "#DCF2EC", "#FFE7A0"],
      dark: ["#111A2C", "rgba(124,220,200,.08)", "#1A2438", "#EEF2F8", "#A8B4C8", "#2E3A52", "#232E46", "#151E32", "#7CDCC8", "#A6EAD8", "#0E1E22", "#3A6A62", "#121A2C", "#D2E6E6", "#3A5A50"],
      glow: ["linear-gradient(180deg,#CFE6F0,#F2F7F6 50%,#E2EED8)", "linear-gradient(180deg,#16223A,#243250 50%,#3E4A5E)"],
      spine: [lg("#3E9A8A", "#26705E"), lg("#243250", "#121A2C")], btn: [lg2("#E0705A", "#F08A6A"), lg2("#7CDCC8", "#A6EAD8")]},
    kit: {motif: "paw", card: ["#F8FCFB", "#E4F1EF"], ink: "#1A2A30", bd: "#BFDCD6", mc: "#E0705A", r: 16, notes: ["#DCEFEA", "#FFF3B8", "#FFE0CC", "#D6E6FF", "#FFD9C8", "#EBD9FF"], shape: "rounded", pin: "heartpin", fab: "999px", btn: "12px"},
    fx: {spawn: (W, H, d, n) => fxBurst(W, H, n(30), "paw", d ? ["#7CDCC8", "#FF9AB0", "#F6CE4A"] : ["#3E9A8A", "#F07A8A", "#F2B63A"], [[0.15, 1.02], [0.85, 1.02], [0.5, 1.04]], {smin: 8, smax: 12})
      .concat(fxBurst(W, H, n(16), "n6bone", d ? ["#F6E2C4", "#E8C49A"] : ["#E0A866", "#F2C48A"], [[0.3, 1.02], [0.7, 1.02]], {smin: 10, smax: 14}),
        fxRise(W, H, n(16), "heart", d ? ["#FF9AB0", "#FFC2D0"] : ["#FF6F91", "#FF9AB0"], {smin: 9, smax: 14, vmin: 1.2, vmax: 2.2, sway: 0.9, life: 260, glow: d ? 8 : 0}),
        fxFall(W, H, n(8), "n6plaster", d ? ["#F2D2B8", "#C8E6F6"] : ["#F6CBA6", "#BFE0F6"], {sway: 1.4, smin: 12, smax: 15, vmin: 1, vmax: 1.8}),
        fxTw(W, H, n(28), "star", d ? ["#FFE7B0", "#FFFFFF", "#7CDCC8"] : ["#F2B53A", "#FFD86B", "#F07A8A"], {smin: 3, smax: 7, glow: d ? 10 : 4}))},
    tag: "A friendly vet clinic: puppies wagging in their kennels, a kitten with a toy, the X-ray light box and the treat jar"
  });

  MAJ_THEMES.push({
    skin: {id: "aerospace", name: "Launch Pad", group: "ideas", desc: "A rocket on its pad by the coast, with the gantry, a control tower and a windsock.",
      light: ["#F0F5FB", "rgba(47,94,158,.10)", "#FFFFFF", "#16233A", "#566478", "#D8E2EE", "#E6EEF7", "#F8FAFD", "#D8453E", "#E86A3E", "#FFFFFF", "#7A2420", "#1E3E6E", "#D6E2F4", "#FFE7A0"],
      dark: ["#0B1028", "rgba(255,182,72,.08)", "#141A38", "#EEF0FA", "#A8B0CE", "#262E56", "#1C2448", "#10163A", "#FFB648", "#FFD27A", "#141A38", "#7A5A2A", "#0B1230", "#D2D8F0", "#5A4420"],
      glow: ["linear-gradient(180deg,#9CC9EE,#D7EAF8 50%,#F2E1C8)", "linear-gradient(180deg,#0B1230,#18204A 50%,#3A3A6A)"],
      spine: [lg("#2F5E9E", "#1E3E6E"), lg("#18204A", "#0B1230")], btn: [lg2("#D8453E", "#E86A3E"), lg2("#FFB648", "#FFD27A")]},
    kit: {motif: "rocket", card: ["#F8FAFD", "#E4ECF6"], ink: "#16233A", bd: "#C4D2E6", mc: "#D8453E", r: 14, notes: ["#DCE6F4", "#FFF3B8", "#FFE0CC", "#D9F0D8", "#FFD9C8", "#EBD9FF"], shape: "gridnote", pin: "starpin", fab: "24px 24px 24px 8px", btn: "12px"},
    fx: {spawn: (W, H, d, n) => fxRise(W, H, n(7), "rocket", d ? ["#FFFFFF", "#FFB648", "#FF8A7A"] : ["#E8453E", "#2F5E9E", "#F2A23A"], {smin: 14, smax: 19, vmin: 2.6, vmax: 3.8, sway: 0.3, life: 240, glow: d ? 12 : 4})
      .concat(fxRise(W, H, n(30), "puff", d ? ["rgba(220,226,255,.55)"] : ["rgba(255,255,255,.9)"], {cx: [0.1, 0.9], smin: 8, smax: 16, vmin: 0.6, vmax: 1.2, sway: 1, grow: 0.03, life: 200}),
        Array.from({length: n(5)}, (_, i) => { const lr = i % 2 === 0, sp = fxR(3.4, 5), a = -fxR(0.1, 0.35); return {shape: "plane", c: fxPick(d ? ["#FFFFFF", "#FFD27A"] : ["#2F5E9E", "#E8453E", "#F2A23A"]), x: lr ? fxR(-60, -10) : W + fxR(10, 60), y: fxR(H * 0.35, H * 0.85), vx: (lr ? 1 : -1) * Math.cos(a) * sp, vy: Math.sin(a) * sp, g: 0, size: fxR(14, 19), rot: lr ? a : Math.PI - a, vr: 0, sway: 0, life: 260, delay: Math.floor(fxR(0, 80))}; }),
        fxRise(W, H, n(4), "n6sat", d ? ["#C8D2F0", "#FFD27A"] : ["#5A6A8A", "#2F5E9E"], {smin: 14, smax: 18, vmin: 1, vmax: 1.6, sway: 0.5, life: 300}).map(p => Object.assign(p, {vr: 0.02})),
        fxTw(W, H, n(34), "star", d ? ["#FFFFFF", "#FFE7B0", "#BFD0FF"] : ["#F2B53A", "#FFD86B", "#E8453E"], {smin: 3, smax: 7, glow: d ? 10 : 3}))},
    tag: "A rocket on its pad by the sea: vapor curling off it, the gantry beacon blinking, planes leaving contrails and searchlights at night"
  });
})();
