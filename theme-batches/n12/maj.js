/* New theme ideas, batch n12: wisteria (Wisteria Walk), bluebells (Bluebell Wood).
   Registered like the Study Fields themes (MAJ_THEMES), but in the Style Shop's "New Theme Ideas" group. */
(() => {
  const lg = (a, b) => `linear-gradient(180deg,${a},${b})`, lg2 = (a, b) => `linear-gradient(135deg,${a},${b})`;
  const r1 = n => Math.round(n * 100) / 100;
  const NOTES = ["#FFF3B8", "#D9F0D8", "#D6E6FF", "#FFD9C8", "#EBD9FF"];
  // a drooping raceme of florets (rows narrowing to a tip)
  const raceme = (() => { let d = ""; [[0, -9, 4.2], [-3.2, -5.6, 3.4], [3.2, -5.6, 3.4], [-2.4, -1.6, 3], [2.4, -1.6, 3], [0, 2.2, 2.6], [-1.4, 5.4, 2.1], [1.2, 7.8, 1.7], [0, 10.4, 1.3]].forEach(([x, y, r]) => { d += `M${r1(x - r)} ${y}a${r} ${r * 0.82} 0 1 0 ${r1(2 * r)} 0a${r} ${r * 0.82} 0 1 0 ${r1(-2 * r)} 0Z`; }); return d; })();
  // a nodding bluebell: a narrow bell with flared, curled-back tips
  const bell = "M-4.6 -8C-5.2 -3 -5.6 2 -7.4 5.6C-6 6.6 -4.6 5.4 -3.6 6.4C-2.4 7.6 -1 6 0 7.2C1 6 2.4 7.6 3.6 6.4C4.6 5.4 6 6.6 7.4 5.6C5.6 2 5.2 -3 4.6 -8C2.6 -10.4 -2.6 -10.4 -4.6 -8Z";
  Object.assign(FX_SHAPES, {
    n12raceme: {d: raceme},
    n12floret: {d: "M-6 1C-7 -4 -3 -7 0 -5C3 -7 7 -4 6 1C5 5 2 6.5 0 6.5C-2 6.5 -5 5 -6 1Z", detail: "M-2.6 2.6Q0 5 2.6 2.6", dstroke: true},
    n12leaflet: {d: "M-10 0Q-2 -6 10 0Q-2 6 -10 0Z", detail: "M-9 0H8", dstroke: true},
    n12bell: {d: bell, detail: "M-2 -7.4Q-2.6 0 -3.4 5", dstroke: true},
    n12beech: {d: "M0 -11C5 -9 8 -4 7.6 1C7.2 6 3.6 9.6 0 11C-3.6 9.6 -7.2 6 -7.6 1C-8 -4 -5 -9 0 -11Z", detail: "M0 -10V10M0 -5L5 -7.4M0 -1L6 -3M0 3L5.4 1.4M0 -5L-5 -7.4M0 -1L-6 -3M0 3L-5.4 1.4", dstroke: true}
  });

  MAJ_THEMES.push({
    skin: {id: "wisteria", name: "Wisteria Walk", group: "ideas", desc: "A flowering wisteria tunnel over a mossy path to a still pond.",
      light: ["#F4F1F8", "rgba(122,90,184,.10)", "#FFFFFF", "#2A2238", "#625A72", "#DED6EA", "#EBE4F3", "#FBF9FD", "#7A52B8", "#9472CA", "#FFFFFF", "#3E2470", "#4C6E46", "#E2D6F2", "#FFE3EE"],
      dark: ["#120E26", "rgba(200,180,255,.08)", "#1C1738", "#F0ECFA", "#B4AACC", "#2E2752", "#241E44", "#16122E", "#C2A8FF", "#D6C4FF", "#1A1430", "#6A50B0", "#141030", "#D4C8F0", "#4E3A7A"],
      glow: ["linear-gradient(180deg,#D2E4F3,#E4D6F2 50%,#86AE6A)", "linear-gradient(180deg,#0E0A24,#2E2260 55%,#1A1838)"],
      spine: [lg("#5E4A8E", "#3E2E66"), lg("#241C48", "#120E26")], btn: [lg2("#7A52B8", "#9A6ED0"), lg2("#C2A8FF", "#E0CCFF")]},
    kit: {motif: "n12raceme", card: ["#FBF9FD", "#EEE6F6"], ink: "#2A2238", bd: "#D6C8EA", mc: "#8A62C8", r: 18, notes: ["#EBDDF8"].concat(NOTES), shape: "scallop", pin: "washi2", fab: "999px", btn: "14px"},
    fx: {spawn: (W, H, d, n) => fxBurst(W, H, n(20), "n12raceme", d ? ["#C8BEF2", "#E8E4FA", "#A898E0"] : ["#A486D8", "#C8B4EC", "#FBF8F2"], [[0.15, 1.02], [0.85, 1.02], [0.5, 1.04]], {smin: 12, smax: 17}).map(p => Object.assign(p, {vr: fxR(-0.05, 0.05)}))
      .concat(fxFall(W, H, n(54), "n12floret", d ? ["#C8BEF2", "#E8E4FA", "#B4A6EA"] : ["#B49AE2", "#D2C2F0", "#FFFFFF", "#9A7AD2"], {sway: 2, flip: true, smin: 6, smax: 10, vmin: 0.8, vmax: 1.6}),
        fxBurst(W, H, n(12), "n12leaflet", d ? ["#3A4470", "#4A5888"] : ["#7CAE5A", "#9CC66A"], [[0.1, 1.02], [0.9, 1.02]], {smin: 9, smax: 13}).map(p => Object.assign(p, {vr: fxR(-0.06, 0.06)})),
        fxTw(W, H, n(22), "sparkle", d ? ["#F0E8FF", "#FFFFFF"] : ["#FFE8A8", "#FFF6D8"], {smin: 3, smax: 6, glow: d ? 12 : 4}))},
    tag: "A long flowering wisteria tunnel arching over a mossy stone path to a little arched footbridge on a still pond, hung with lavender and white blossoms; glowing pale under the moon at night"
  });
  MAJ_THEMES.push({
    skin: {id: "bluebells", name: "Bluebell Wood", group: "ideas", desc: "A spring beech wood carpeted in bluebells.",
      light: ["#F1F4F8", "rgba(92,96,200,.10)", "#FFFFFF", "#1E2434", "#58607A", "#D6DCEA", "#E4E9F3", "#F9FAFD", "#4E56B8", "#6E76CC", "#FFFFFF", "#26286E", "#4E7A34", "#DDE2F6", "#E8F4C8"],
      dark: ["#0C1226", "rgba(140,160,255,.08)", "#141C36", "#EDF0FA", "#AAB4CE", "#26304E", "#1C2542", "#10172E", "#9AA8FF", "#B8C4FF", "#10142A", "#4A58B0", "#0E1630", "#C8D2F0", "#2E3E6A"],
      glow: ["linear-gradient(180deg,#E2F0C4,#B8C8EE 55%,#7A7ED8)", "linear-gradient(180deg,#0A1230,#1E2C5E 55%,#2A2E6A)"],
      spine: [lg("#4E6A3A", "#33492A"), lg("#1A2448", "#0C1226")], btn: [lg2("#4E56B8", "#6A62CC"), lg2("#9AA8FF", "#BCC0FF")]},
    kit: {motif: "n12bell", card: ["#F9FAFD", "#E6EAF6"], ink: "#1E2434", bd: "#C8D0EA", mc: "#5A5EC8", r: 16, notes: ["#DCE0FA"].concat(NOTES), shape: "torn", pin: "pin", fab: "999px", btn: "999px"},
    fx: {spawn: (W, H, d, n) => fxBurst(W, H, n(26), "n12bell", d ? ["#8A96F0", "#A8B0FF", "#C0C4FF"] : ["#5A5EC8", "#7470D8", "#8A7EE0"], [[0.15, 1.02], [0.85, 1.02], [0.5, 1.04]], {smin: 9, smax: 14}).map(p => Object.assign(p, {vr: fxR(-0.06, 0.06)}))
      .concat(fxFall(W, H, n(40), "n12beech", d ? ["#3E5A4A", "#5A7A5E"] : ["#A8D45A", "#C2E27A", "#8CC04A"], {sway: 2.2, flip: true, smin: 8, smax: 12, vmin: 0.8, vmax: 1.5}),
        fxRise(W, H, n(30), "circle", d ? ["#C8D0FF", "#FFFFFF"] : ["#FFF6C8", "#FFFFFF"], {smin: 1.6, smax: 3.4, vmin: 0.5, vmax: 1.2, sway: 1.4, life: 220, glow: d ? 10 : 6}),
        fxTw(W, H, n(20), "sparkle", d ? ["#E0E6FF", "#FFFFFF"] : ["#FFE89A", "#FFF6D0"], {smin: 3, smax: 6, glow: d ? 12 : 4}))},
    tag: "An English beech wood in spring, with smooth silver trunks, a fresh lime-green canopy and a carpet of bluebells rolling away in a violet haze along a winding path; misty and starlit at blue hour"
  });
})();
