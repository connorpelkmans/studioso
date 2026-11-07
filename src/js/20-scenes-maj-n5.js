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

  /* ---- completion animations ---- */
  const ease = t => t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t);
  const fillP = (g, c, d) => { g.fillStyle = c; g.fill(new Path2D(d)); };
  const sheen = (g, dk, k = 1) => { g.save(); g.globalCompositeOperation = "source-atop"; const gr = g.createLinearGradient(-7, -10, 7, 10); gr.addColorStop(0, `rgba(255,255,255,${0.34 * k})`); gr.addColorStop(0.45, "rgba(255,255,255,0)"); gr.addColorStop(1, `rgba(0,0,0,${dk ? 0.26 : 0.2})`); g.fillStyle = gr; g.fillRect(-13, -13, 26, 26); g.restore(); };
  const HEART = "M0 9.6C-6 5 -10.4 1.4 -10.4 -3.4C-10.4 -7 -7.6 -9.4 -4.8 -9.4C-2.6 -9.4 -0.9 -8.2 0 -6.4C0.9 -8.2 2.6 -9.4 4.8 -9.4C7.6 -9.4 10.4 -7 10.4 -3.4C10.4 1.4 6 5 0 9.6Z";
  const BAL = "M0 -11C5.6 -11 8.4 -6.8 8.4 -2.6C8.4 2.8 3.6 6 0.8 7H-0.8C-3.6 6 -8.4 2.8 -8.4 -2.6C-8.4 -6.8 -5.6 -11 0 -11Z";
  Object.assign(FX_SHAPES, {
    // a glossy heart with a soft shine
    n5heartP: {d: HEART, paint: (g, c, dk) => { fillP(g, c, HEART); sheen(g, dk, 1.1); g.fillStyle = "rgba(255,255,255,.6)"; g.beginPath(); g.ellipse(-5, -5, 2.2, 1.3, -0.6, 0, 6.3); g.fill(); }},
    // a mortarboard: a flat board seen a little from above, the cap under it, a gold tassel
    n5capP: {d: "M0 -8.6L11.6 -3.4L0 1.8L-11.6 -3.4Z M-7 -0.4V4.6Q0 8.6 7 4.6V-0.4L0 2.8Z", paint: (g, c, dk) => { fillP(g, fxShade(c, 0.8), "M-7 -1.4V4.6Q0 8.6 7 4.6V-1.4L0 2Z"); fillP(g, c, "M0 -8.6L11.6 -3.4L0 1.8L-11.6 -3.4Z"); sheen(g, dk, 1.2); if (dk) { g.strokeStyle = "rgba(210,220,255,.55)"; g.lineWidth = 0.7; g.stroke(new Path2D("M0 -8.6L11.6 -3.4L0 1.8L-11.6 -3.4Z M-7 -0.4V4.6Q0 8.6 7 4.6V-0.4")); }
      g.strokeStyle = "#F2C23A"; g.lineWidth = 0.9; g.lineCap = "round"; g.beginPath(); g.moveTo(0, -3.4); g.lineTo(8.6, -1.2); g.lineTo(8.6, 5.4); g.stroke(); fillP(g, "#F2C23A", "M7.4 5.2H9.8L10.6 10H6.6Z M-1.2 -3.4A1.2 0.7 0 1 0 1.2 -3.4A1.2 0.7 0 1 0 -1.2 -3.4Z"); }},
    // a rolled diploma tied with a red ribbon
    n5dip: {d: "M-10 -3.4H10V3.4H-10Z", paint: (g, c, dk) => { const gr = g.createLinearGradient(0, -3.6, 0, 3.6); gr.addColorStop(0, "#FFF8E6"); gr.addColorStop(0.5, c); gr.addColorStop(1, "#C8B07A"); g.fillStyle = gr; g.fillRect(-10, -3.4, 20, 6.8); g.fillStyle = "#E8D8B0"; g.beginPath(); g.ellipse(10, 0, 1.2, 3.4, 0, 0, 6.3); g.fill(); g.strokeStyle = "#B8985A"; g.lineWidth = 0.4; g.beginPath(); g.arc(10, 0, 1.6, 0, 6.3); g.stroke();
      g.fillStyle = "#D8283A"; g.fillRect(-1.2, -3.6, 2.4, 7.2); fillP(g, "#D8283A", "M0 2L-2.6 7.4L-0.6 6.6L0 8.4Z M0 2L2.6 7.4L0.6 6.6L0 8.4Z"); }},
    // a shiny party balloon with its knot and a curly string
    n5ballP: {d: BAL + "M-0.8 7H0.8L1.6 9H-1.6Z", paint: (g, c, dk) => { g.strokeStyle = dk ? "rgba(230,220,255,.7)" : "rgba(90,80,100,.6)"; g.lineWidth = 0.5; g.beginPath(); g.moveTo(0, 8.6); g.bezierCurveTo(-2, 10, 2, 11, -0.6, 13); g.stroke(); fillP(g, fxShade(c, 0.8), "M-0.8 6.6H0.8L1.8 8.8H-1.8Z");
      const gr = g.createRadialGradient(-3, -5, 0, 0, -2, 11); gr.addColorStop(0, fxShade(c, 1.25)); gr.addColorStop(0.6, c); gr.addColorStop(1, fxShade(c, 0.72)); g.fillStyle = gr; g.fill(new Path2D(BAL)); g.fillStyle = "rgba(255,255,255,.75)"; g.beginPath(); g.ellipse(-3.6, -6, 1.4, 2.6, 0.5, 0, 6.3); g.fill(); }},
    // a curly paper streamer
    n5curl: {d: "M-10 0C-8 -4 -5 -4 -4 0C-3 4 0 4 1 0C2 -4 5 -4 6 0C7 4 9.6 3.6 10.6 1", stroke: true, lw: 2}
  });

  // Pride: a big rainbow ribbon waves across the screen, glossy hearts float up and a little confetti flies
  const prideDraw = (g, f, W, H, dk) => { const cols = rainbow(dk), sw = Math.max(7, Math.min(18, Math.min(W, H) * 0.024)), x1 = ease(f / 75) * (W + 60), x0 = ease((f - 165) / 80) * (W + 60), yAt = x => H * 0.62 - (x / W) * H * 0.3 + Math.sin(x / W * Math.PI * 1.6 - f * 0.06) * H * 0.07;
    if (x1 - x0 < 2) return; g.lineWidth = sw + 1; g.lineCap = "butt"; g.lineJoin = "round"; g.globalAlpha = dk ? 0.85 : 0.9;
    cols.forEach((c, k) => { const o = (k - 2.5) * sw; g.strokeStyle = c; g.beginPath(); for (let x = x0 - 30; x <= x1; x += 14) { const xx = Math.min(x, x1); x === x0 - 30 ? g.moveTo(xx, yAt(xx) + o) : g.lineTo(xx, yAt(xx) + o); } g.stroke(); });
    g.globalAlpha = dk ? 0.18 : 0.25; g.strokeStyle = "#FFFFFF"; g.lineWidth = sw * 0.8; g.beginPath(); for (let x = x0 - 30; x <= x1; x += 14) { const xx = Math.min(x, x1), sh = Math.max(0, Math.sin(xx / W * Math.PI * 1.6 - f * 0.06 + 1.2)); x === x0 - 30 ? g.moveTo(xx, yAt(xx) - 2.4 * sw + sh) : g.lineTo(xx, yAt(xx) - 2.4 * sw + sh); } g.stroke(); g.globalAlpha = 1; };

  // Geology: crystal clusters grow up out of the bottom edge, facet by facet, then glint
  let GEO = null;
  const geoDraw = (g, f, W, H, dk) => { if (!GEO) return; GEO.forEach(cl => cl.pr.forEach(p => { const q = ease((f - p.d) / 60); if (q <= 0) return; const L = p.L * q, w = p.w * (0.5 + 0.5 * q);
      g.save(); g.translate(p.x, H + 4); g.rotate(p.a); g.fillStyle = p.c; g.beginPath(); g.moveTo(-w / 2, 0); g.lineTo(-w / 2, -L + w * 0.6); g.lineTo(0, -L); g.lineTo(w / 2, -L + w * 0.6); g.lineTo(w / 2, 0); g.fill();
      g.fillStyle = "rgba(0,0,0,.22)"; g.beginPath(); g.moveTo(w * 0.1, 0); g.lineTo(w * 0.1, -L + w * 0.66); g.lineTo(0, -L); g.lineTo(w / 2, -L + w * 0.6); g.lineTo(w / 2, 0); g.fill();
      g.fillStyle = "rgba(255,255,255,.4)"; g.beginPath(); g.moveTo(-w / 2, -L + w * 0.6); g.lineTo(0, -L); g.lineTo(w * 0.1, -L + w * 0.66); g.lineTo(-w * 0.3, -L + w * 0.62); g.fill(); g.fillRect(-w * 0.36, -L + w * 0.8, w * 0.1, L * 0.6); g.restore(); })); };

  const FX = {
    pride: {spawn: (W, H, d, n) => fxRise(W, H, n(18), "n5heartP", rainbow(d), {smin: 11, smax: 16, vmin: 1, vmax: 2, sway: 1.1, life: 300, glow: d ? 8 : 0, spread: 110}).map(p => Object.assign(p, {rock: 0.15, delay: p.delay + 20}))
        .concat(cannon(W, H, n(46), rainbow(d).concat(["#FFFFFF"])).map(p => Object.assign(p, {delay: p.delay + 10})),
          fxTw(W, H, n(16), "sparkle", d ? ["#FFFFFF", "#FFB3E6", "#FFE066"] : ["#F2B53A", "#FF8FC8", "#8E5CC7"], {smin: 4, smax: 8, glow: d ? 10 : 4, spread: 160})),
      draw: prideDraw},
    graduation: {spawn: (W, H, d, n) => fxBurst(W, H, n(28), "n5capP", d ? ["#4E5E9E", "#5A6AB0", "#46549A"] : ["#1E2E5A", "#26386A", "#18264E"], [[0.2, 1.02], [0.5, 1.04], [0.8, 1.02]], {smin: 16, smax: 22, g: 0.24}).map(p => Object.assign(p, {vr: fxR(-0.18, 0.18), life: 270, term: 3.4, fsw: 0.8}))
        .concat(cannon(W, H, n(50), d ? ["#F2C85A", "#FFFFFF", "#7FB8F0"] : ["#F2B83A", "#E8A020", "#2E4A8A", "#7FB8F0"]).map(p => Object.assign(p, {delay: p.delay + 14})),
          fxRise(W, H, n(5), "n5dip", ["#F6E8C8"], {cx: [0.15, 0.85], smin: 19, smax: 24, vmin: 1, vmax: 1.6, sway: 0.6, life: 300, spread: 80}).map(p => Object.assign(p, {rot: fxR(-0.4, 0.4), rock: 0.12})),
          fxTw(W, H, n(24), "n5star", d ? ["#F2C85A", "#FFFFFF"] : ["#F2B83A", "#E8A020"], {smin: 5, smax: 9, glow: d ? 10 : 3, spread: 160}))},
    birthday: {spawn: (W, H, d, n) => { const pal = d ? ["#FF7FA8", "#7FE0C8", "#FFD86B", "#C6A0FF", "#7FC8FF"] : ["#F2689A", "#3EC8A8", "#F7C23A", "#A07AF0", "#4AA8F0"];
        return fxRise(W, H, n(16), "n5ballP", pal, {smin: 18, smax: 26, vmin: 1.2, vmax: 2.3, sway: 0.9, life: 320, spread: 70}).map(p => Object.assign(p, {rock: 0.12, swf: 0.03}))
          .concat(cannon(W, H, n(60), pal.concat(["#FFFFFF"])), cannon(W, H, n(14), pal, "n5curl", {smin: 9, smax: 12}),
            fxTw(W, H, n(20), "sparkle", d ? ["#FFFFFF", "#FFD86B", "#FFB3E6"] : ["#F2B53A", "#F2689A", "#A07AF0"], {smin: 4, smax: 8, glow: d ? 10 : 4, spread: 160}));
      }},
    geology: {spawn: (W, H, d, n) => { const u = Math.min(W, H) / 100, k = Math.max(2, Math.min(5, Math.round(W / 240))), cs = d ? [["#B88AFF", "#9A6AE8", "#D2B4FF"], ["#6FE0E8", "#4AC0D0", "#A8F4F8"], ["#FF8AC8", "#E86AA8", "#FFB8DE"]] : [["#9A62D8", "#7E48C0", "#B88AE8"], ["#2EA8B8", "#1E8C9E", "#5CC8D4"], ["#D8609E", "#C04A88", "#EA8ABA"]];
        GEO = Array.from({length: k}, (_, i) => { const cx = (i + 0.5 + fxR(-0.2, 0.2)) / k * W, pal = cs[i % cs.length], m = 5 + Math.floor(fxR(0, 3)), d0 = i * 14;
          return {pr: Array.from({length: m}, (_, j) => { const t = (j / (m - 1) - 0.5) * 2, L = u * fxR(19, 31) * (1 - Math.abs(t) * 0.45); return {x: cx + t * u * 7, a: t * 0.55 + fxR(-0.08, 0.08), L, w: L * fxR(0.24, 0.32), c: pal[j % 3], d: d0 + Math.abs(t) * 18 + fxR(0, 8)}; }).sort((a, b) => b.L - a.L)}; });
        const tips = GEO.flatMap(cl => cl.pr.map(p => ({x: p.x + Math.sin(p.a) * p.L, y: H + 4 - Math.cos(p.a) * p.L, d: p.d + 60})));
        return tips.map(t => ({shape: "sparkle", c: d ? "#FFFFFF" : "#FFFFFF", x: t.x, y: t.y, vx: 0, vy: 0, g: 0, size: fxR(8, 12), rot: 0, vr: 0.03, sway: 0, life: 70, delay: Math.floor(t.d + fxR(0, 50)), tw: true, glint: true, glow: 12}))
          .concat(fxTw(W, H, n(26), "sparkle", d ? ["#E2C8FF", "#C8FAFF", "#FFFFFF"] : ["#B58CF2", "#5CCFD8", "#F28AC0"], {smin: 4, smax: 8, glow: d ? 12 : 4, spread: 170}),
            fxFall(W, H, n(10), "n5gem", d ? ["#E2C8FF", "#C8FAFF", "#FFD8EE"] : ["#B58CF2", "#5CCFD8", "#F28AC0"], {smin: 9, smax: 13, vmin: 1.2, vmax: 2, flip: true, spread: 80, glow: d ? 8 : 0}));
      }, draw: geoDraw}
  };
  /* ---- end of completion animations ---- */

  MAJ_THEMES.push({
    skin: {id: "pride", name: "Pride Parade", group: "ideas", desc: "A rainbow street hung with flags and bunting, ready for the parade.",
      light: ["#FBF3FA", "rgba(184,64,122,.10)", "#FFFFFF", "#2A1E3A", "#6A5A7A", "#EEDDEB", "#F5EAF3", "#FDF9FC", "#B8407A", "#7A4AB8", "#FFFFFF", "#7A2452", "#4E2E72", "#F2D6E8", "#FFE7A0"],
      dark: ["#1A1532", "rgba(255,143,200,.08)", "#241C42", "#F8F0FF", "#C2B2D8", "#3E3262", "#2F2652", "#1E183A", "#FF8FC8", "#C6A0FF", "#1E1A3E", "#8A4A7A", "#14102C", "#E2D2F2", "#6A4A3A"],
      glow: ["linear-gradient(180deg,#BDE3F7,#FDF0F5 58%,#FFE9C2)", "linear-gradient(180deg,#1E1A3E,#3A2560 52%,#6A2E6A)"],
      spine: [lg("#7A4A9E", "#4E2E72"), lg("#3A2560", "#1E1A3E")], btn: [lg2("#B8407A", "#7A4AB8"), lg2("#FF8FC8", "#C6A0FF")]},
    kit: {motif: "n5heart", card: ["#FFFBFE", "#F6E8F2"], ink: "#2A1E3A", bd: "#EBCDE2", mc: "#B8407A", r: 18, notes: ["#F6D8EA"].concat(NOTES), shape: "rounded", pin: "heartpin", fab: "999px", btn: "999px"},
    fx: FX.pride,
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
    fx: FX.graduation,
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
    fx: FX.birthday,
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
    fx: FX.geology,
    tag: "A crystal cave with layered rock walls, still pools, dripping stalactites, a sleepy bat and a geode waiting to crack open"
  });
})();
/* end of module 20-scenes-maj-n5.js */






