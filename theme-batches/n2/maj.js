/* New theme ideas, batch n2: mushrooms (Mushroom Hollow), sunflowers (Sunflower Field), cloudkingdom (Cloud Kingdom), nighttrain (Night Train), ramen (Ramen Shop) */
(() => {
  const lg = (a, b) => `linear-gradient(180deg,${a},${b})`, lg2 = (a, b) => `linear-gradient(135deg,${a},${b})`;
  const r1 = n => Math.round(n * 100) / 100;
  const circ = (x, y, r) => `M${r1(x - r)} ${r1(y)}a${r1(r)} ${r1(r)} 0 1 0 ${r1(2 * r)} 0a${r1(r)} ${r1(r)} 0 1 0 ${r1(-2 * r)} 0Z`;
  const pts = a => "M" + a.map(p => `${r1(p[0])} ${r1(p[1])}`).join("L") + "Z";
  const petals = (n, R, w, rr) => Array.from({length: n}, (_, i) => { const a = i / n * Math.PI * 2, c = Math.cos(a), s = Math.sin(a), q = [[rr, -w], [R * 0.7, -w * 1.1], [R, 0], [R * 0.7, w * 1.1], [rr, w]]; return pts(q.map(p => [p[0] * c - p[1] * s, p[0] * s + p[1] * c])); }).join("");
  Object.assign(FX_SHAPES, {
    n2shroom: {d: "M-10.5 -1.5C-10.5 -8.5 -5.5 -11 0 -11C5.5 -11 10.5 -8.5 10.5 -1.5C10.5 0.2 9 0.6 7 0.6H-7C-9 0.6 -10.5 0.2 -10.5 -1.5Z M-3.2 0.6H3.2L3.8 9.4C3.8 10.6 2.4 11 0 11C-2.4 11 -3.8 10.6 -3.8 9.4Z", detail: circ(-5, -4.5, 1.7) + circ(1, -7.6, 2) + circ(5.6, -3.2, 1.4) + circ(-1.4, -2.8, 1), dfill: true},
    n2spore: {d: circ(0, 0, 4.5) + circ(-6, 5, 2.2) + circ(6.5, -4, 2) + circ(4, 7, 1.4)},
    n2sunfl: {d: petals(12, 10.5, 2.4, 3) + circ(0, 0, 4.6), detail: circ(0, 0, 4.4), dfill: true},
    n2petal: {d: "M0 -10C3.6 -6 3.6 4 0 10C-3.6 4 -3.6 -6 0 -10Z", detail: "M0 -7V7", dstroke: true},
    n2cloud: {d: "M-10.5 5C-13 5 -13 0 -9.5 -0.5C-10 -5 -4.5 -7.5 -1.5 -4.5C0 -9 7.5 -8.5 7.5 -3C11.5 -3.5 12.5 3.5 9 5Z"},
    n2kite: {d: "M0 -11L7.5 -1L0 6L-7.5 -1Z M-0.5 6L0.5 6L1.5 11L-1.5 11Z", detail: "M0 -11V6M-7.5 -1H7.5", dstroke: true},
    n2ticket: {d: "M-11 -6H11V-2.2A2.2 2.2 0 0 0 11 2.2V6H-11V2.2A2.2 2.2 0 0 0 -11 -2.2Z", detail: circ(-5.5, 0, 1.4) + circ(0, 0, 1.4) + circ(5.5, 0, 1.4), dfill: true},
    n2steam: {d: "M-3 10C-8 4 2 0 -2 -4C-5 -7 -1 -10 1 -11C0 -8 4 -6 3 -2C1.5 3 -5 5 0.5 10Z"},
    n2naruto: {d: "M-10 0C-10 -6.5 -5 -10 0 -10C5 -10 10 -6.5 10 0C10 6.5 5 10 0 10C-5 10 -10 6.5 -10 0Z", detail: "M0 0C1 -1.5 3 -0.5 2.6 1.2C2 3.6 -1.6 3.8 -3 1.6C-4.8 -1.2 -2.4 -5 1.2 -4.8C5 -4.6 6.6 -0.6 5.6 2.6", dstroke: true},
    n2egg: {d: "M0 -10.5C6 -10.5 9.5 -4 9.5 1.5C9.5 7 5.5 10.5 0 10.5C-5.5 10.5 -9.5 7 -9.5 1.5C-9.5 -4 -6 -10.5 0 -10.5Z", detail: circ(0, 2, 5), dfill: true}
  });
  // drifting up from the bottom, with a gentle sway
  const drift = (W, H, n, shape, cols, o) => fxRise(W, H, n, shape, cols, o);

  MAJ_THEMES.push({
    skin: {id: "mushrooms", name: "Mushroom Hollow", group: "ideas", desc: "A mossy glade full of toadstools, ferns and drifting spores.",
      light: ["#F4F1E6", "rgba(184,67,47,.10)", "#FFFFFF", "#2A2418", "#6E6450", "#E3DCC8", "#EEE8D6", "#FBF9F2", "#B8432F", "#D2643C", "#FFFFFF", "#5A4430", "#4A3C28", "#E8DCC0", "#FFE7A0"],
      dark: ["#121A2E", "rgba(111,224,236,.08)", "#1A2440", "#ECF4FA", "#A6B6CC", "#2C3A58", "#222E4A", "#151E36", "#6FE0EC", "#9CC4FF", "#0E1A2A", "#2E5A78", "#0E1424", "#CFE6F0", "#2A5A68"],
      glow: ["linear-gradient(180deg,#CFE3C5,#EEF3DE 60%,#F2E6D8)", "linear-gradient(180deg,#141A2E,#22304A 60%,#3A3058)"],
      spine: [lg("#6E5A3E", "#4A3C28"), lg("#22304A", "#0E1424")], btn: [lg2("#B8432F", "#D2643C"), lg2("#6FE0EC", "#9CC4FF")]},
    kit: {motif: "n2shroom", card: ["#FBF8EE", "#EFE8D4"], ink: "#2A2418", bd: "#DCCFB0", mc: "#C8503A", r: 18, notes: ["#F6E3C8", "#FFF3B8", "#D9F0D8", "#FFD9D2", "#E6F0C8", "#EBD9FF"], shape: "scallop", pin: "pin", fab: "999px", btn: "999px"},
    fx: {spawn: (W, H, d, n) => fxBurst(W, H, n(26), "n2shroom", d ? ["#5FD6E8", "#7FA6FF", "#6FE8C0"] : ["#E45A48", "#F07A5A", "#C98B5A"], [[0.15, 1.02], [0.85, 1.02], [0.5, 1.04]], {smin: 10, smax: 15, glow: d ? 12 : 0}).map(p => Object.assign(p, {vr: fxR(-0.08, 0.08), rot: fxR(-0.3, 0.3)}))
      .concat(drift(W, H, n(40), "circle", d ? ["#9CFFE8", "#B8D8FF", "#E8FFFF"] : ["#F6DA7A", "#FFF2C0", "#E8C860"], {smin: 1.6, smax: 3.4, vmin: 0.6, vmax: 1.4, sway: 1.4, life: 300, glow: d ? 12 : 6}),
        fxFall(W, H, n(18), "leaf", d ? ["#3A8A74", "#2A6A5E"] : ["#7FB466", "#A2CF7C", "#5E9A4E"], {sway: 1.8, flip: true, smin: 8, smax: 12, vmin: 1, vmax: 1.8}),
        fxTw(W, H, n(30), "sparkle", d ? ["#B8F6FF", "#FFFFFF", "#C8FFE8"] : ["#F2B53A", "#FF8F7A", "#FFD86B"], {smin: 3, smax: 7, glow: d ? 10 : 4}))},
    tag: "A mossy glade of breathing toadstools, uncurling ferns and a fairy ring that plays like a xylophone"
  });
  MAJ_THEMES.push({
    skin: {id: "sunflowers", name: "Sunflower Field", group: "ideas", desc: "Rows of tall sunflowers rolling toward a red barn.",
      light: ["#FBF7E8", "rgba(194,86,26,.10)", "#FFFFFF", "#2A2410", "#6A6248", "#EAE2C2", "#F3EDD4", "#FDFBF2", "#C2561A", "#E08A1A", "#FFFFFF", "#4A5A22", "#33531C", "#E2EBC8", "#FFE27A"],
      dark: ["#161838", "rgba(246,200,74,.08)", "#1E2148", "#F6F2E4", "#BAB4CC", "#30335E", "#262A54", "#191C40", "#F6C84A", "#FFE08A", "#1E1A0A", "#6A5A2A", "#10122C", "#E6E0C8", "#5A4A1A"],
      glow: ["linear-gradient(180deg,#9ED0F0,#D6ECF8 60%,#F8E7A6)", "linear-gradient(180deg,#1B2246,#2F2F5E 60%,#4C3E5A)"],
      spine: [lg("#4E7A2E", "#33531C"), lg("#2F2F5E", "#10122C")], btn: [lg2("#C2561A", "#E08A1A"), lg2("#F6C84A", "#FFE08A")]},
    kit: {motif: "n2sunfl", card: ["#FFFBEA", "#F6EBC4"], ink: "#2A2410", bd: "#EAD48A", mc: "#E0A21A", r: 16, notes: ["#FFF0B0", "#FFE0B8", "#E2F0C0", "#D6E6FF", "#FFD9C8", "#F2E2FF"], shape: "rounded", pin: "tape", fab: "999px", btn: "12px"},
    fx: {spawn: (W, H, d, n) => fxBurst(W, H, n(46), "n2petal", d ? ["#F2D27A", "#E6B84A", "#FFE6A0"] : ["#FFD23F", "#FFC21F", "#F5A51A", "#FFE680"], [[0.15, 1.02], [0.85, 1.02], [0.5, 1.04]], {smin: 8, smax: 12, glow: d ? 8 : 0}).map(p => Object.assign(p, {flip: true, vr: fxR(-0.12, 0.12)}))
      .concat(fxRise(W, H, n(8), "n2sunfl", d ? ["#F2C84A", "#FFE08A"] : ["#FFC21F", "#F5A51A"], {smin: 13, smax: 18, vmin: 1, vmax: 1.8, sway: 0.7, life: 300, glow: d ? 10 : 0}).map(p => Object.assign(p, {vr: fxR(-0.02, 0.02)})),
        fxFlutter(W, H, n(6), d ? ["#FFE38A", "#B8F0FF"] : ["#FF9F43", "#FFD45A", "#8FD8FF"]),
        fxTw(W, H, n(30), "sparkle", d ? ["#FFF4C2", "#FFFFFF", "#F6C84A"] : ["#F2B53A", "#FFD86B", "#FF9F43"], {smin: 3, smax: 7, glow: d ? 10 : 4}))},
    tag: "Sunflowers that follow the sun across the sky toward a red barn, with bees, hay bales and a dirt road"
  });
  MAJ_THEMES.push({
    skin: {id: "cloudkingdom", name: "Cloud Kingdom", group: "ideas", desc: "Floating grassy islands above a sea of clouds.",
      light: ["#F2F6FD", "rgba(74,98,208,.10)", "#FFFFFF", "#1E2A48", "#5A6888", "#DCE4F4", "#E8EEFA", "#FAFCFF", "#4A62D0", "#8A6AE0", "#FFFFFF", "#2E4290", "#3E58A0", "#D8E2FA", "#FFE7B8"],
      dark: ["#1A1C46", "rgba(255,184,216,.08)", "#24265A", "#F2EEFA", "#B8B0D8", "#363A74", "#2C2E66", "#1E2050", "#FFB8D8", "#C8B0FF", "#2A1A3A", "#6A4A8A", "#141638", "#E2DCF6", "#5A3A6A"],
      glow: ["linear-gradient(180deg,#A9CDF5,#DCEBFB 60%,#FFF4F0)", "linear-gradient(180deg,#1C1F4A,#3A3474 60%,#7E5C9E)"],
      spine: [lg("#5B78C8", "#3E58A0"), lg("#3A3474", "#141638")], btn: [lg2("#4A62D0", "#8A6AE0"), lg2("#FFB8D8", "#C8B0FF")]},
    kit: {motif: "n2cloud", card: ["#F8FBFF", "#E6EEFC"], ink: "#1E2A48", bd: "#C8D6F4", mc: "#6A82E0", r: 22, notes: ["#E2ECFF", "#FFF3B8", "#D9F0D8", "#FFE0EC", "#FFE6CC", "#EBD9FF"], shape: "cloud", pin: "pin", fab: "999px", btn: "999px"},
    fx: {spawn: (W, H, d, n) => fxRise(W, H, n(14), "n2cloud", d ? ["#B8B0E8", "#E2DCF6", "#9A8CD0"] : ["#FFFFFF", "#EAF2FF", "#F6EEFF"], {smin: 16, smax: 26, vmin: 0.8, vmax: 1.5, sway: 0.6, life: 320, glow: d ? 6 : 8}).map(p => Object.assign(p, {rot: 0, vr: 0}))
      .concat(fxRise(W, H, n(6), "n2kite", d ? ["#FFB8D8", "#FFE38A", "#9AD8FF"] : ["#FF8FA8", "#FFD86B", "#5AB8F0", "#9BE07A"], {smin: 14, smax: 19, vmin: 1.6, vmax: 2.6, sway: 1.4, life: 260, glow: d ? 10 : 0}).map(p => Object.assign(p, {rot: fxR(-0.3, 0.3), vr: fxR(-0.01, 0.01)})),
        fxBurst(W, H, n(30), "star", d ? ["#FF9AB0", "#FFE69A", "#A8F0A0", "#9AD8FF", "#D8B0FF"] : ["#FF6F7F", "#FFD84A", "#6FCF6A", "#5AB8F0", "#B07AE8"], [[0.15, 1.02], [0.85, 1.02]], {smin: 6, smax: 10, glow: d ? 10 : 0}),
        fxTw(W, H, n(30), "sparkle", d ? ["#FFFFFF", "#FFE7B0", "#C9D4FF"] : ["#8AB4F8", "#FFD86B", "#FFB3D9"], {smin: 3, smax: 7, glow: d ? 10 : 4}))},
    tag: "Floating islands with waterfalls over a rolling sea of clouds, kites on the wind and a rainbow bridge"
  });
  MAJ_THEMES.push({
    skin: {id: "nighttrain", name: "Night Train", group: "ideas", desc: "A cozy sleeper compartment with hills and towns sliding past the window.",
      light: ["#F8F2E8", "rgba(184,72,76,.10)", "#FFFFFF", "#2E2018", "#6E5E50", "#E8DCCB", "#F1E8DA", "#FCF9F4", "#B8484C", "#D06A4A", "#FFFFFF", "#5A3A2A", "#55331F", "#EAD8C4", "#FFE2A8"],
      dark: ["#1C1628", "rgba(255,194,122,.08)", "#261E34", "#F4EEF8", "#BDB0CC", "#3A2E48", "#30263E", "#211A2E", "#FFC27A", "#FFD9A0", "#2A1A0A", "#6A4A3A", "#140F1C", "#E6DCEC", "#5A3E22"],
      glow: ["linear-gradient(180deg,#B9D7EA,#EAF2EE 60%,#E7D2B8)", "linear-gradient(180deg,#141C33,#25304E 60%,#5B4A6A)"],
      spine: [lg("#7A4C30", "#55331F"), lg("#3A2C46", "#140F1C")], btn: [lg2("#B8484C", "#D06A4A"), lg2("#FFC27A", "#FFD9A0")]},
    kit: {motif: "n2ticket", card: ["#FCF7EE", "#F0E4D0"], ink: "#2E2018", bd: "#DCC8A8", mc: "#B8484C", r: 10, notes: ["#F6E6CC", "#FFF3B8", "#D9F0D8", "#D6E6FF", "#FFD9C8", "#EBD9FF"], shape: "classic", pin: "gold", fab: "14px", btn: "10px"},
    fx: {spawn: (W, H, d, n) => fxRise(W, H, n(18), "puff", d ? ["rgba(230,220,250,.7)", "rgba(200,190,230,.6)"] : ["rgba(255,255,255,.85)", "rgba(240,236,232,.8)"], {smin: 10, smax: 18, vmin: 1.2, vmax: 2.2, sway: 1, grow: 0.12, life: 220, cx: [0.05, 0.4]})
      .concat(fxBurst(W, H, n(16), "n2ticket", d ? ["#FFC27A", "#FFD9A0", "#E8B0C8"] : ["#E8706A", "#F2B84A", "#7FB8D8"], [[0.15, 1.02], [0.85, 1.02]], {smin: 11, smax: 15}).map(p => Object.assign(p, {vr: fxR(-0.1, 0.1)})),
        fxFall(W, H, n(20), "star", d ? ["#FFE7B0", "#FFFFFF", "#FFC27A"] : ["#F2B84A", "#E8706A", "#7FB8D8"], {sway: 1.2, smin: 5, smax: 9, vmin: 1, vmax: 2, glow: d ? 10 : 0}),
        fxTw(W, H, n(26), "sparkle", d ? ["#FFE7B0", "#FFFFFF", "#FFC27A"] : ["#F2B53A", "#FFD86B", "#E8706A"], {smin: 3, smax: 7, glow: d ? 10 : 4}))},
    tag: "A sleeper compartment with tea on the table, a swaying lamp and the countryside rushing past the window"
  });
  MAJ_THEMES.push({
    skin: {id: "ramen", name: "Ramen Shop", group: "ideas", desc: "A late-night ramen counter with noren curtains and rain on the window.",
      light: ["#FBF3EA", "rgba(200,52,58,.10)", "#FFFFFF", "#2E1E16", "#6E5A4E", "#EDDCCC", "#F4E8DC", "#FDF9F4", "#C8343A", "#E0603A", "#FFFFFF", "#6A2A22", "#5E241C", "#F0D6C8", "#FFE2A0"],
      dark: ["#1E1620", "rgba(255,138,122,.08)", "#2A1E28", "#F8EEF0", "#C8B0B8", "#3E2C38", "#342630", "#241A24", "#FF8A7A", "#FFB08A", "#2A0E0A", "#6A3A3A", "#160F16", "#ECDCE0", "#5E2E22"],
      glow: ["linear-gradient(180deg,#F1DCC3,#F8EBDA 60%,#E7C9A8)", "linear-gradient(180deg,#1E1A2A,#3B2734 60%,#7A3E3A)"],
      spine: [lg("#8A3A2E", "#5E241C"), lg("#3B2734", "#160F16")], btn: [lg2("#C8343A", "#E0603A"), lg2("#FF8A7A", "#FFB08A")]},
    kit: {motif: "n2naruto", card: ["#FFFAF2", "#F4E6D4"], ink: "#2E1E16", bd: "#E6CBB0", mc: "#D2464E", r: 14, notes: ["#FFE8C8", "#FFF3B8", "#E2F0D0", "#FFD9D8", "#F2E2FF", "#D6E6FF"], shape: "folded", pin: "pin", fab: "16px", btn: "12px"},
    fx: {spawn: (W, H, d, n) => fxRise(W, H, n(16), "n2steam", d ? ["rgba(255,240,250,.7)", "rgba(230,220,240,.6)"] : ["rgba(255,255,255,.9)", "rgba(250,240,230,.85)"], {smin: 12, smax: 20, vmin: 1, vmax: 2, sway: 1.4, life: 220, cx: [0.2, 0.8]}).map(p => Object.assign(p, {rot: 0}))
      .concat(fxBurst(W, H, n(16), "n2naruto", ["#FFFFFF", "#FFF2F6"], [[0.15, 1.02], [0.85, 1.02], [0.5, 1.04]], {smin: 10, smax: 14}).map(p => Object.assign(p, {vr: fxR(-0.15, 0.15)})),
        fxBurst(W, H, n(10), "n2egg", ["#FFFFFF"], [[0.3, 1.02], [0.7, 1.02]], {smin: 10, smax: 13}),
        fxFall(W, H, n(16), "leaf", d ? ["#7ACB5A", "#5AA84A"] : ["#7ACB5A", "#9ADB6A"], {sway: 1.4, smin: 5, smax: 8, vmin: 1, vmax: 2}),
        fxTw(W, H, n(26), "sparkle", d ? ["#FFE7B0", "#FFFFFF", "#FF8A7A"] : ["#F2B53A", "#FFD86B", "#E8505E"], {smin: 3, smax: 7, glow: d ? 10 : 4}))},
    tag: "A cozy ramen counter on a rainy night, with a cheerful chef, a simmering pot, noren curtains and a lucky cat"
  });
})();
