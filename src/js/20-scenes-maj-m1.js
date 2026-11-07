/* ===== module: 20-scenes-maj-m1.js ===== */
/* Study Fields themes, batch m1 */
(() => {
  const lg = (a, b) => `linear-gradient(180deg,${a},${b})`, lg2 = (a, b) => `linear-gradient(135deg,${a},${b})`;
  const NOTES = ["#FFF3B8", "#D9F0D8", "#D6E6FF", "#FFD9C8", "#EBD9FF"];
  const c = (x, y, r) => `M${x - r} ${y}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;
  // paints a round thought bubble with a trail of dots and a small icon inside
  const psTh = (g, col, dk, icon, ic) => { const b = new Path2D(c(-1, -1, 8.4) + c(-8, 8.4, 1.8) + c(-10.4, 11, 1.1)); g.fillStyle = col; g.fill(b); g.strokeStyle = dk ? "rgba(230,215,255,.85)" : "#A68AD6"; g.lineWidth = 1.1; g.stroke(b);
    g.fillStyle = dk ? "rgba(255,255,255,.18)" : "rgba(166,138,214,.14)"; g.beginPath(); g.ellipse(2.4, 3.2, 4.4, 2.4, -0.5, 0, 7); g.fill(); g.save(); g.translate(-1, -1.4); g.fillStyle = dk && ic === "#9A6CC0" ? "#C9B0FF" : ic; g.fill(new Path2D(icon)); g.restore(); };

  /* Market District (Business) */
  MAJ_THEMES.push({
    skin: {id: "business", name: "Market District", desc: "Glass towers, a stock ticker and a rising chart line.",
      light: ["#EEF2F6", "rgba(35,136,90,.10)", "#FFFFFF", "#16243A", "#56657A", "#D5DDE6", "#E5EBF1", "#F7F9FB", "#23885A", "#4FA77C", "#FFFFFF", "#155C3C", "#26405F", "#CFE0F0", "#FFE3A0"],
      dark: ["#0F1129", "rgba(124,240,168,.07)", "#181A38", "#F1F0FA", "#B0AECB", "#2C2E58", "#22244A", "#13152F", "#7CF0A8", "#9CF5BF", "#0E1A20", "#3E7A5A", "#121430", "#D2D0F0", "#4A6A3A"],
      glow: ["linear-gradient(180deg,#86C3F2,#BCCBF4 28%,#F7C6DC 58%,#FFC28C)", "linear-gradient(180deg,#120E36,#271B58 34%,#4F2A70 64%,#C85E7E)"],
      spine: [lg("#3D5E86", "#26405F"), lg("#25285A", "#121430")], btn: [lg2("#23885A", "#2E9E6A"), lg2("#7CF0A8", "#9CF5BF")]},
    kit: {motif: "bizchart", card: ["#F6F9FC", "#E2EAF2"], ink: "#16243A", bd: "#BCCCDD", mc: "#2E9E6A", r: 10, notes: ["#D6EEDF"].concat(NOTES), shape: "gridnote", pin: "binder", fab: "12px", btn: "10px"},
    shapes: {
      bizchart: {d: "M-10 3H-5.6V10H-10Z M-3 -0.6H1.4V10H-3Z M4 -4H8.4V10H4Z M2.4 -11.2H10.4V-3.2L7.6 -6L1.8 -0.2L-0.6 -2.6L5.2 -8.4Z"},
      bizarrow: {d: "M0 -10.5L8.6 -1.2H3.4V10H-3.4V-1.2H-8.6Z"},
      // gold coin with a rim and a dollar sign
      bizcoin: {d: c(0, 0, 9.6), paint: (g, col, dk) => { g.fillStyle = fxShade(col, 0.86); g.beginPath(); g.arc(0, 0, 9.6, 0, 7); g.fill(); g.fillStyle = col; g.beginPath(); g.arc(-0.4, -0.4, 8, 0, 7); g.fill();
        g.strokeStyle = fxShade(col, 0.8); g.lineWidth = 0.9; g.beginPath(); g.arc(-0.4, -0.4, 6.2, 0, 7); g.stroke(); g.fillStyle = fxShade(col, 0.68); g.font = "bold 10px sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("$", -0.4, 0.2);
        g.fillStyle = "rgba(255,255,255,.55)"; g.beginPath(); g.ellipse(-3.6, -4.2, 2.4, 1.2, -0.7, 0, 7); g.fill(); }}
    },
    // a candlestick chart builds up across the page, a gold trend line races over it, and coins pay out at the top
    fx: {spawn: (W, H, d, n) => { const ex = W * 0.9, ey = H * 0.9 - H * 0.5 * 0.96;
      return fxBurst(W, H, n(30), "bizcoin", d ? ["#FFD27A", "#F6C453", "#FFE3A8"] : ["#E8B030", "#F2C24A", "#D9A228"], [[ex / W, ey / H]], {smin: 10, smax: 14, g: 0.16, flip: true}).map(p => Object.assign(p, {vx: p.vx * 0.9 - 2, vy: p.vy * 0.9 - 3, delay: 84 + Math.floor(fxR(0, 16)), life: 170, term: 3.4}))
        .concat(fxTw(W, H, n(16), "sparkle", d ? ["#FFE3A8", "#FFFFFF", "#9CF5BF"] : ["#F2B53A", "#FFD86B", "#4FBF84"], {smin: 3, smax: 7, top: 0.6, glow: d ? 10 : 4}).map(p => Object.assign(p, {delay: 70 + Math.floor(fxR(0, 80))}))); },
      draw: (g, f, W, H, d) => {
        const a = fxEase(f / 10) * (1 - fxEase((f - 175) / 60)); if (a <= 0.01) return;
        const V = [0.06, 0.15, 0.1, 0.24, 0.34, 0.28, 0.46, 0.58, 0.54, 0.74, 0.96], N = V.length, x0 = W * 0.08, dx = (W * 0.9 - x0) / (N - 1), cw = Math.max(7, Math.min(28, dx * 0.5)), yb = H * 0.9, Y = v => yb - H * 0.5 * v;
        const up = d ? "#7CF0A8" : "#23885A", dn = d ? "#FF8A9A" : "#D24D4A";
        g.lineCap = g.lineJoin = "round"; g.strokeStyle = d ? "rgba(210,208,240,.16)" : "rgba(38,64,95,.12)"; g.lineWidth = 1; g.setLineDash([6, 6]); g.globalAlpha = a;
        [0.25, 0.5, 0.75, 1].forEach(v => { g.beginPath(); g.moveTo(x0 - cw, Y(v)); g.lineTo(W * 0.9 + cw, Y(v)); g.stroke(); }); g.setLineDash([]);
        for (let i = 0; i < N; i++) { const t = (f - 4 - i * 6) / 16; if (t <= 0) break; const e = 1 - Math.pow(1 - Math.min(1, t), 3), o = i ? V[i - 1] : 0.02, cl = V[i], x = x0 + i * dx, yo = Y(o), yc = yo + (Y(cl) - yo) * e, col = cl >= o ? up : dn;
          g.globalAlpha = a * Math.min(1, t * 2) * 0.9; g.strokeStyle = col; g.lineWidth = 1.6; g.beginPath(); g.moveTo(x, Y(Math.max(o, cl) + 0.05 * e)); g.lineTo(x, Y(Math.min(o, cl) - 0.04 * e)); g.stroke();
          g.fillStyle = col; g.fillRect(x - cw / 2, Math.min(yo, yc), cw, Math.max(2, Math.abs(yc - yo))); }
        const p = Math.max(0, Math.min(1, (f - 14) / 72)), q = 1 - Math.pow(1 - p, 2), L = q * (N - 1), k = Math.floor(L); if (p <= 0) return;
        g.globalAlpha = a; g.shadowBlur = 12; g.shadowColor = d ? "#FFD27A" : "#F2B53A"; g.strokeStyle = d ? "#FFE3A8" : "#E39A12"; g.lineWidth = 3.2;
        g.beginPath(); g.moveTo(x0, Y(V[0])); for (let i = 1; i <= k; i++) g.lineTo(x0 + i * dx, Y(V[i]));
        const hx = x0 + L * dx, hy = Y(V[k] + (V[Math.min(N - 1, k + 1)] - V[k]) * (L - k)); g.lineTo(hx, hy); g.stroke();
        g.shadowBlur = 16; g.fillStyle = "#FFFFFF"; g.beginPath(); g.arc(hx, hy, 4.5 + 3 * fxEase((f - 80) / 10) * (1 - fxEase((f - 100) / 30)), 0, 7); g.fill();
        // a soft ring when the line hits the top
        const t2 = f - 86; if (t2 > 0 && t2 < 50) { g.shadowBlur = 0; g.globalAlpha = a * 0.5 * (1 - t2 / 50); g.strokeStyle = d ? "#FFE3A8" : "#E39A12"; g.lineWidth = 2; g.beginPath(); g.arc(hx, hy, 6 + t2 * 1.4, 0, 7); g.stroke(); } }},
    tag: "An evening financial district with glass towers, a scrolling stock ticker and a glowing chart line"
  });

  /* Night Shift (Nursing) */
  MAJ_THEMES.push({
    skin: {id: "nursing", name: "Night Shift", desc: "A cozy nurses' station by a window over the city.",
      light: ["#F1F6F4", "rgba(46,140,120,.10)", "#FFFFFF", "#163130", "#55706C", "#D4E3DF", "#E4EFEC", "#F8FBFA", "#2E8C78", "#5BA898", "#FFFFFF", "#1E5E50", "#24524C", "#CDEBE4", "#FFD9C8"],
      dark: ["#10142A", "rgba(125,224,190,.07)", "#191E36", "#EEF2F8", "#A9B2C8", "#2B3150", "#222842", "#141831", "#7DE0BE", "#A6EED4", "#0E1E1C", "#3D6E64", "#0E1226", "#CFE8E2", "#6A4A3A"],
      glow: ["linear-gradient(180deg,#9FC0E4,#D9D6EA 40%,#F8D2BE 70%,#F6B595)", "linear-gradient(180deg,#0E1430,#1E2552 45%,#2F2F62)"],
      spine: [lg("#3B7A72", "#24524C"), lg("#1E2546", "#0E1226")], btn: [lg2("#2E8C78", "#3FA08A"), lg2("#7DE0BE", "#A6EED4")]},
    kit: {motif: "pulseheart", card: ["#F6FBFA", "#E0F0EC"], ink: "#163130", bd: "#A9D8CC", mc: "#E8708C", r: 18, notes: ["#FFDCE4"].concat(NOTES), shape: "rounded", pin: "clip", fab: "999px", btn: "14px"},
    shapes: {
      pulseheart: {d: "M0 9C-8 3.4 -10.4 -1.6 -9.2 -5.2C-8 -9 -2.4 -9.6 0 -5C2.4 -9.6 8 -9 9.2 -5.2C10.4 -1.6 8 3.4 0 9Z", detail: "M-8.4 -0.6H-4.4L-2.6 -4.2L0.4 3L2.4 -0.6H8.4", dstroke: true},
      nscross: {d: "M-2.8 -9.4H2.8V-2.8H9.4V2.8H2.8V9.4H-2.8V2.8H-9.4V-2.8H-2.8Z"}
    },
    // a monitor trace sweeps across; every heartbeat it draws sends up a heart, and soft plus signs twinkle
    fx: {spawn: (W, H, d, n) => { const beat = Math.max(110, W / 4.2), P = [];
      for (let k = 0; (k + 0.8) * beat < W; k++) { const x = (k + 0.8) * beat, t = Math.round(x / W * 120);
        for (let j = 0; j < 3; j++) P.push({shape: j ? "heart" : "pulseheart", c: j ? fxPick(d ? ["#FF9DB4", "#FFC2D0"] : ["#E8708C", "#F29AAE"]) : d ? "#A6EED4" : "#2E8C78", x: x + fxR(-8, 8), y: H * 0.8 - Math.min(52, H * 0.07), vx: j ? (j === 1 ? -1 : 1) * fxR(0.4, 0.9) : 0, vy: -fxR(1.4, 2.2) * (j ? 0.85 : 1), g: 0, drag: 0.995, size: j ? fxR(8, 11) : fxR(13, 16), rot: 0, vr: 0, sway: j ? 0.7 : 0.4, swf: fxR(0.03, 0.05), life: 190, delay: t + j * 4, glow: d ? 10 : 0}); }
      return P.concat(fxRise(W, H, n(10), "heart", d ? ["#FF9DB4", "#F6B3C4", "#FFD0DA"] : ["#E8708C", "#F29AAE", "#F7B6C4"], {smin: 7, smax: 11, vmin: 1, vmax: 1.8, sway: 1, life: 240, spread: 90, glow: d ? 8 : 0}),
        fxTw(W, H, n(14), "nscross", d ? ["#A6EED4", "#FFFFFF"] : ["#5BA898", "#7CCFB6"], {smin: 4, smax: 7, top: 0.7, glow: d ? 8 : 0}),
        fxTw(W, H, n(10), "sparkle", d ? ["#FFFFFF", "#FFD0DA"] : ["#F2B53A", "#F29AAE"], {smin: 3, smax: 6, top: 0.7, glow: d ? 10 : 4})); },
      draw: (g, f, W, H, d) => {
        const a = fxEase(f / 8) * (1 - fxEase((f - 165) / 60)); if (a <= 0.01) return;
        const y0 = H * 0.8, beat = Math.max(110, W / 4.2), amp = Math.min(52, H * 0.07), xe = W * Math.min(1, f / 120);
        const Y = x => { const u = (x / beat + 0.4) % 1; return u > 0.04 && u < 0.12 ? y0 - amp * 0.16 * Math.sin((u - 0.04) / 0.08 * Math.PI) : u >= 0.17 && u < 0.19 ? y0 + amp * 0.2 * (u - 0.17) / 0.02 : u >= 0.19 && u < 0.2 ? y0 + amp * 0.2 - amp * 1.2 * (u - 0.19) / 0.01 : u >= 0.2 && u < 0.22 ? y0 - amp + amp * 1.35 * (u - 0.2) / 0.02 : u >= 0.22 && u < 0.24 ? y0 + amp * 0.35 * (1 - (u - 0.22) / 0.02) : u > 0.32 && u < 0.46 ? y0 - amp * 0.24 * Math.sin((u - 0.32) / 0.14 * Math.PI) : y0; };
        const col = d ? "#A6EED4" : "#2E8C78";
        g.lineJoin = g.lineCap = "round"; g.strokeStyle = col; g.shadowColor = d ? "#7DE0BE" : "#5BA898";
        // the older part of the trace is dimmer, the fresh part near the head is bright
        const seg = (xa, xb, al, lw, sb) => { if (xb <= xa) return; g.globalAlpha = a * al; g.lineWidth = lw; g.shadowBlur = sb; g.beginPath(); g.moveTo(xa, Y(xa)); for (let x = xa + 2; x <= xb; x += 2) g.lineTo(x, Y(x)); g.lineTo(xb, Y(xb)); g.stroke(); };
        const tail = W * 0.28; seg(0, xe - tail, 0.4, 2.2, 0); seg(Math.max(0, xe - tail - 2), xe, 0.95, 2.8, 12);
        for (let k = 0; (k + 0.8) * beat < W; k++) { const x = (k + 0.8) * beat, t = f - x / W * 120; if (t < 0 || t > 46) continue; g.shadowBlur = 0; g.globalAlpha = a * 0.45 * (1 - t / 46); g.lineWidth = 2; g.beginPath(); g.arc(x, y0 - amp, 6 + t * 1.3, 0, 7); g.stroke(); }
        if (f < 128) { g.shadowBlur = 16; g.globalAlpha = a * (1 - fxEase((f - 110) / 16)); g.fillStyle = "#FFFFFF"; g.beginPath(); g.arc(xe, Y(xe), 4.5, 0, 7); g.fill(); } }},
    tag: "A cozy nurses' station by a big window, with a desk lamp, a warm mug and a glowing heartbeat line"
  });

  /* Mind Garden (Psychology) */
  MAJ_THEMES.push({
    skin: {id: "psych", name: "Mind Garden", desc: "A dreamy pastel garden of hedges, thought bubbles and butterflies.",
      light: ["#F5F2FA", "rgba(122,92,184,.10)", "#FFFFFF", "#251C3A", "#625A76", "#E1DAEC", "#ECE6F5", "#FBF9FD", "#7A5CB8", "#9A80CC", "#FFFFFF", "#523A85", "#463872", "#E2D8F6", "#FFE3B0"],
      dark: ["#141030", "rgba(255,192,138,.07)", "#1E1940", "#F4F0FB", "#BBB0D4", "#352E5C", "#29224E", "#181337", "#FFC08A", "#FFD6AE", "#221838", "#8A6A5A", "#120E2C", "#DCD0F2", "#6A4A3A"],
      glow: ["linear-gradient(180deg,#B4B4F4,#D6C4F6 30%,#F8C8E6 60%,#BDEAC8)", "linear-gradient(180deg,#191540,#3A2D68 45%,#7A4F86 75%,#B8708A)"],
      spine: [lg("#6A58A0", "#463872"), lg("#2E2560", "#141030")], btn: [lg2("#7A5CB8", "#9A6CC0"), lg2("#FFC08A", "#FFD6AE")]},
    kit: {motif: "thought", card: ["#FBF8FF", "#ECE4F8"], ink: "#251C3A", bd: "#D6C8EE", mc: "#9A6CC0", r: 22, notes: ["#E8DCF8"].concat(NOTES), shape: "cloud", pin: "pin", fab: "999px", btn: "999px"},
    shapes: {
      thought: {d: c(-4, -3, 5) + c(2, -5, 5.6) + c(6.4, 0, 4.4) + c(0, 1.6, 5) + c(-7.4, 7.6, 2) + c(-10, 10.6, 1.2)},
      idea: {d: "M0 -10.4C5 -10.4 7.4 -6.6 7.4 -3.4C7.4 0 5 2 3.6 4V5.6H-3.6V4C-5 2 -7.4 0 -7.4 -3.4C-7.4 -6.6 -5 -10.4 0 -10.4Z M-3.4 6.8H3.4V8.2H-3.4Z M-2.4 9.2H2.4V10.6H-2.4Z", detail: "M-1.6 3.6V-1.2L0 0.4L1.6 -1.2V3.6", dstroke: true},
      // thought bubbles with a small idea inside: a lightbulb, a heart or a star
      psth1: {d: c(-1, -1, 8.4) + c(-8, 8.4, 1.8) + c(-10.4, 11, 1.1), paint: (g, col, dk) => psTh(g, col, dk, "M0 -6.4C2.8 -6.4 4 -4.2 4 -2.4C4 -0.4 2.6 0.6 2 1.8V2.8H-2V1.8C-2.6 0.6 -4 -0.4 -4 -2.4C-4 -4.2 -2.8 -6.4 0 -6.4Z M-1.8 3.6H1.8V4.6H-1.8Z", "#F6B830")},
      psth2: {d: c(-1, -1, 8.4) + c(-8, 8.4, 1.8) + c(-10.4, 11, 1.1), paint: (g, col, dk) => psTh(g, col, dk, "M0 4.6C-4.4 1.6 -5.6 -1.2 -5 -3.2C-4.3 -5.3 -1.3 -5.6 0 -3C1.3 -5.6 4.3 -5.3 5 -3.2C5.6 -1.2 4.4 1.6 0 4.6Z", "#EE6F9A")},
      psth3: {d: c(-1, -1, 8.4) + c(-8, 8.4, 1.8) + c(-10.4, 11, 1.1), paint: (g, col, dk) => psTh(g, col, dk, "M0 -6L1.5 -2.2L5.6 -2L2.4 0.6L3.5 4.6L0 2.3L-3.5 4.6L-2.4 0.6L-5.6 -2L-1.5 -2.2Z", "#9A6CC0")},
      inkfly: {d: "M0.4 -1C2.4 -8.6 10.2 -10.4 10.6 -5C10.8 -2.4 8 -1.4 9.4 1.4C11.2 5 6.6 9.6 3.4 6.6C1.8 5.2 1 3 0.4 1Z M-0.4 -1C-2.4 -8.6 -10.2 -10.4 -10.6 -5C-10.8 -2.4 -8 -1.4 -9.4 1.4C-11.2 5 -6.6 9.6 -3.4 6.6C-1.8 5.2 -1 3 -0.4 1Z",
        detail: "M3.4 -5.2a1.7 2.3 0 1 0 3.4 0a1.7 2.3 0 1 0 -3.4 0Z M-6.8 -5.2a1.7 2.3 0 1 0 3.4 0a1.7 2.3 0 1 0 -3.4 0Z M4 3.4a1.3 1.3 0 1 0 2.6 0a1.3 1.3 0 1 0 -2.6 0Z M-6.6 3.4a1.3 1.3 0 1 0 2.6 0a1.3 1.3 0 1 0 -2.6 0Z M-0.7 -4H0.7V6H-0.7Z", dfill: true,
        // inkblot butterfly: soft wings with a paler inner blot, mirror spots and a dark body
        paint: (g, col, dk) => { const W1 = new Path2D("M0.4 -1C2.4 -8.6 10.2 -10.4 10.6 -5C10.8 -2.4 8 -1.4 9.4 1.4C11.2 5 6.6 9.6 3.4 6.6C1.8 5.2 1 3 0.4 1Z M-0.4 -1C-2.4 -8.6 -10.2 -10.4 -10.6 -5C-10.8 -2.4 -8 -1.4 -9.4 1.4C-11.2 5 -6.6 9.6 -3.4 6.6C-1.8 5.2 -1 3 -0.4 1Z");
          g.fillStyle = col; g.fill(W1); g.save(); g.clip(W1); g.fillStyle = "rgba(255,255,255,.34)"; [[5.6, -4.6, 3.2, 2.4], [-5.6, -4.6, 3.2, 2.4], [5, 3.4, 2.2, 1.8], [-5, 3.4, 2.2, 1.8]].forEach(([x, y, rx, ry]) => { g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, 7); g.fill(); });
          g.fillStyle = fxShade(col, 0.55); [[8.4, -6.6, 1.3], [-8.4, -6.6, 1.3], [7.4, 4.6, 1], [-7.4, 4.6, 1]].forEach(([x, y, r]) => { g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }); g.restore();
          g.fillStyle = dk ? "#2A2240" : "#3A2E52"; g.beginPath(); g.ellipse(0, 1, 1, 5.2, 0, 0, 7); g.fill(); g.strokeStyle = g.fillStyle; g.lineWidth = 0.7; g.beginPath(); g.moveTo(-0.4, -4); g.quadraticCurveTo(-1.6, -7, -3, -7.6); g.moveTo(0.4, -4); g.quadraticCurveTo(1.6, -7, 3, -7.6); g.stroke(); }}
    },
    // thought bubbles drift up from below, each with a little idea inside; where a bubble fades, an inkblot butterfly takes off
    fx: {spawn: (W, H, d, n) => { const P = [], wing = d ? ["#F6A8D0", "#C9B0FF", "#FFC890", "#9FD0FF"] : ["#9A6CC0", "#E0729E", "#5E86D0", "#E89A3A"];
      for (let i = 0, N = n(9); i < N; i++) { const x = W * (0.08 + 0.84 * (i + fxR(0.2, 0.8)) / N), v = fxR(1.6, 2.4), L = Math.round(fxR(90, 130)), dl = Math.floor(fxR(0, 50)), ye = H + 20 - v * L;
        P.push({shape: fxPick(["psth1", "psth2", "psth3"]), c: d ? fxPick(["#3A2F66", "#4A2F5E"]) : "#FFFFFF", x, y: H + 20, vx: 0, vy: -v, g: 0, size: fxR(17, 22), rot: fxR(-0.1, 0.1), vr: 0, sway: 0.5, swf: 0.04, ph0: 0, life: L, delay: dl, glow: d ? 10 : 0});
        P.push({shape: "inkfly", c: fxPick(wing), x, y: ye, vx: fxR(-1, 1), vy: -fxR(1.4, 2.2), g: 0, size: fxR(12, 16), rot: 0, vr: 0, sway: 1.8, swf: fxR(0.04, 0.07), rock: 0.25, flap: fxR(0.25, 0.38), life: 180, delay: dl + L - 26});
        for (let k = 0; k < 3; k++) P.push({shape: "sparkle", c: d ? "#FFE3B0" : "#F2B53A", x: x + fxR(-26, 26), y: ye + fxR(-22, 22), vx: 0, vy: -0.3, g: 0, size: fxR(4, 7), rot: 0, vr: 0.02, sway: 0, life: 50, delay: dl + L - 30 + k * 5, tw: true, glint: true, glow: d ? 10 : 4}); }
      return P.concat(fxTw(W, H, n(16), "sparkle", d ? ["#FFFFFF", "#FFD6AE"] : ["#F2B53A", "#C9A0E8"], {smin: 3, smax: 6, glow: d ? 10 : 4})); }},
    tag: "A dreamy pastel garden with rounded hedges, a still pond, drifting thought bubbles and inkblot butterflies"
  });

  /* Cell Garden (Biology) */
  MAJ_THEMES.push({
    skin: {id: "biology", name: "Cell Garden", desc: "A microscope view of drifting cells and tiny swimmers.",
      light: ["#F6F3EC", "rgba(58,138,114,.10)", "#FFFEFB", "#1E2A26", "#5E6A64", "#E3DED2", "#EEEAE0", "#FBFAF6", "#3A8A72", "#62A690", "#FFFFFF", "#285E4E", "#2E4A44", "#D8ECE4", "#FFE3B8"],
      dark: ["#070D1E", "rgba(92,242,196,.07)", "#0F1830", "#E8F4F8", "#9CB0C4", "#1E2C4A", "#16223E", "#0B1326", "#5CF2C4", "#8AF7D8", "#06141A", "#2C7A68", "#050A18", "#BDE6F0", "#2A5A66"],
      glow: ["radial-gradient(75% 75% at 50% 48%,#FFFEF6,#FEF2EE 50%,#E4D0E6)", "radial-gradient(75% 75% at 50% 48%,#1E2E72,#141E52 55%,#070A20)"],
      spine: [lg("#4A7068", "#2E4A44"), lg("#102044", "#050A18")], btn: [lg2("#3A8A72", "#4AA088"), lg2("#5CF2C4", "#8AF7D8")]},
    kit: {motif: "cell", card: ["#FDFBF6", "#EAF2EC"], ink: "#1E2A26", bd: "#BFDCCD", mc: "#3A8A72", r: 20, notes: ["#DDF0E4"].concat(NOTES), shape: "circle", pin: "magnet", fab: "999px", btn: "12px"},
    shapes: {
      cell: {d: c(0, 0, 10), detail: c(2, -1.6, 3.8) + c(-4.6, 3.6, 1.4) + c(-3, -5, 1.1), dfill: true},
      helix: {d: "M-5 -11C5 -6.5 5 -5.5 0 0C-5 5.5 -5 6.5 5 11M5 -11C-5 -6.5 -5 -5.5 0 0C5 5.5 5 6.5 -5 11M-3.2 -8.4H3.2M-3.2 8.4H3.2M-2.6 -3.4H2.6M-2.6 3.4H2.6", stroke: true, lw: 1.8},
      diatom: {d: "M-10.6 0C-6.4 -4.6 6.4 -4.6 10.6 0C6.4 4.6 -6.4 4.6 -10.6 0Z", detail: "M-6.6 -2.4V2.4M-3.4 -3.2V3.2M0 -3.4V3.4M3.4 -3.2V3.2M6.6 -2.4V2.4", dstroke: true},
      // a slipper-shaped swimmer facing +x, fringed with cilia, with a whip tail behind
      bioswim: {d: "M10.4 0C10.4 -3.6 6 -5 1 -4.8C-4 -4.6 -8 -3.2 -8 0C-8 3.2 -4 4.6 1 4.8C6 5 10.4 3.6 10.4 0Z",
        paint: (g, col, dk) => { const b = new Path2D("M10.4 0C10.4 -3.6 6 -5 1 -4.8C-4 -4.6 -8 -3.2 -8 0C-8 3.2 -4 4.6 1 4.8C6 5 10.4 3.6 10.4 0Z");
          g.strokeStyle = col; g.lineWidth = 0.6; g.globalAlpha = 0.7; for (let i = 0; i < 18; i++) { const t = i / 18 * Math.PI * 2, x = Math.cos(t), y = Math.sin(t); g.beginPath(); g.moveTo(1.2 + 9.2 * x, 4.9 * y); g.lineTo(1.2 + 10.8 * x, 6.4 * y); g.stroke(); }
          g.globalAlpha = 1; g.lineWidth = 1; g.beginPath(); g.moveTo(-8, 0); g.bezierCurveTo(-9.6, -2.4, -10.6, 2.4, -12, 0); g.stroke();
          g.globalAlpha = 0.5; g.fillStyle = col; g.fill(b); g.globalAlpha = 1; g.lineWidth = 1.2; g.stroke(b);
          g.fillStyle = fxShade(col, 0.7); g.beginPath(); g.ellipse(1.6, 0.4, 2.6, 1.8, 0.2, 0, 7); g.fill(); g.fillStyle = "rgba(255,255,255,.6)"; [[-4, -1.6], [5.8, -1.4], [-2, 2.2]].forEach(([x, y]) => { g.beginPath(); g.arc(x, y, 0.9, 0, 7); g.fill(); }); }}
    },
    // under the microscope: cells swell, pinch in the middle and split in two, while little ciliates swim past
    fx: {spawn: (W, H, d, n) => { const P = [];
      for (let i = 0, N = n(9); i < N; i++) { const lr = i % 2 === 0, sp = fxR(1.3, 2.3);
        P.push({shape: "bioswim", c: fxPick(d ? ["#8AF7D8", "#8AD8FF", "#FFB0DA"] : ["#3A8A72", "#4A86B8", "#C0608A"]), x: lr ? fxR(-60, -20) : W + fxR(20, 60), y: fxR(H * 0.2, H * 0.95), vx: (lr ? 1 : -1) * sp, vy: fxR(-0.5, 0.5), g: 0, size: fxR(12, 16), face: true, wig: 0.12, rot: 0, vr: 0, sway: 0.5, swf: 0.04, life: 230, delay: Math.floor(fxR(0, 90)), glow: d ? 8 : 0}); }
      return P.concat(fxRise(W, H, n(6), "diatom", d ? ["#FFD36A", "#FFE6A0"] : ["#C9962A", "#B88A3A"], {smin: 9, smax: 13, vmin: 0.6, vmax: 1.2, sway: 0.8, life: 280, glow: d ? 8 : 0}).map(p => Object.assign(p, {rot: fxR(0, 6.3), vr: fxR(-0.015, 0.015)})),
        fxRise(W, H, n(26), "bubble", d ? ["#BDE6F0", "#8AF7D8"] : ["#8FB8C8", "#9AC8B0"], {smin: 2.5, smax: 5, vmin: 0.8, vmax: 1.8, sway: 0.6, alpha: 0.8})); },
      draw: (g, f, W, H, d) => {
        const a = fxEase(f / 14) * (1 - fxEase((f - 180) / 60)); if (a <= 0.01) return;
        const ph = W < H, R0 = Math.min(W, H) * (ph ? 0.1 : 0.075), C = ph ? [[0.26, 0.42, 0, 0.5], [0.72, 0.6, 14, -0.4], [0.32, 0.8, 26, 1.2], [0.76, 0.86, 8, 0.2]] : [[0.16, 0.5, 0, 0.5], [0.84, 0.44, 14, -0.4], [0.36, 0.78, 26, 1.2], [0.66, 0.8, 8, 0.2], [0.08, 0.86, 34, -1]];
        const cols = d ? ["#5CF2C4", "#FF7AC6", "#8AD8FF"] : ["#4FA86E", "#D9708F", "#4E92C4"];
        C.forEach(([cx, cy, t0, ang], i) => { const t = f - t0; if (t <= 0) return; const col = cols[i % 3], grow = 1 - Math.pow(1 - Math.min(1, t / 30), 3), e = fxEase((t - 40) / 70), R = R0 * (0.5 + 0.5 * grow) * (1 - 0.22 * e), s = R0 * (0.95 * e + 0.55 * fxEase((t - 105) / 90)), ux = Math.cos(ang), uy = Math.sin(ang), X = cx * W + ux * Math.sin(t / 50) * 4, Y = cy * H + uy * Math.cos(t / 60) * 4;
          // one outline around both halves while they pinch apart (the waist closes completely, then the two cells drift apart)
          const body = new Path2D(); body.arc(X - ux * s, Y - uy * s, R, 0, 7); body.moveTo(X + ux * s + R, Y + uy * s); body.arc(X + ux * s, Y + uy * s, R, 0, 7); const waist = R * 0.8 * (1 - e) * (1 - e); if (s > 1 && waist > 0.6) { body.moveTo(X + R * 0.8, Y); body.ellipse(X, Y, Math.min(s, R), waist, ang, 0, 7); }
          g.globalAlpha = a * 0.85; g.strokeStyle = col; g.lineWidth = 5; g.stroke(body); g.globalCompositeOperation = "destination-out"; g.fill(body); g.globalCompositeOperation = "source-over";
          g.globalAlpha = a * (d ? 0.22 : 0.18); g.fillStyle = col; g.fill(body);
          g.globalAlpha = a * 0.75; g.fillStyle = fxShade(col.length === 7 ? col : "#888888", 0.8); const k = 0.85 * s, nr = R * (0.32 - 0.08 * Math.sin(Math.PI * e));
          [-1, 1].forEach(sg => { g.beginPath(); g.arc(X + sg * ux * k, Y + sg * uy * k, nr, 0, 7); g.fill(); });
          g.globalAlpha = a * 0.6; g.fillStyle = "#FFFFFF"; [[-0.5, -0.4], [0.45, 0.35]].forEach(([u, v]) => { g.beginPath(); g.arc(X + ux * s * Math.sign(u) + R * u * 0.6, Y + uy * s * Math.sign(u) + R * v * 0.7, R * 0.07, 0, 7); g.fill(); }); }); }},
    tag: "A microscope view of drifting cells, diatoms and little swimmers around a faint DNA ribbon"
  });
})();

