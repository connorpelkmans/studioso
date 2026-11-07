/* ===== module: 20-scenes-maj-canada.js ===== */
/* Around the World, batch canada */
(() => {
  const lg = (a, b) => `linear-gradient(180deg,${a},${b})`, lg2 = (a, b) => `linear-gradient(135deg,${a},${b})`;
  const r1 = n => Math.round(n * 100) / 100;
  const pts = a => "M" + a.map(p => `${r1(p[0])} ${r1(p[1])}`).join("L") + "Z";
  const NOTES = ["#FFF3B8", "#D9F0D8", "#D6E6FF", "#FFD9C8", "#EBD9FF"];
  const LEAF = [[0, -1], [0.14, -0.6], [0.4, -0.76], [0.32, -0.36], [0.82, -0.5], [0.64, -0.16], [0.94, 0.02], [0.5, 0.2], [0.56, 0.46], [0.12, 0.3], [0.05, 0.78], [-0.05, 0.78], [-0.12, 0.3], [-0.56, 0.46], [-0.5, 0.2], [-0.94, 0.02], [-0.64, -0.16], [-0.82, -0.5], [-0.32, -0.36], [-0.4, -0.76], [-0.14, -0.6]];
  Object.assign(FX_SHAPES, {
    canadaleaf: {d: pts(LEAF.map(p => [p[0] * 11.5, p[1] * 11.5 - 1])), detail: "M0 7.6L0 -9M0 1L6.4 -4M0 1L-6.4 -4M0 3L5 3.6M0 3L-5 3.6", dstroke: true},
    canadaspruce: {d: "M0 -11.5L3 -6.5L1.6 -6.4L5.4 -1.4L3.4 -1.2L8 4.6L1.4 4.6V11H-1.4V4.6L-8 4.6L-3.4 -1.2L-5.4 -1.4L-1.6 -6.4L-3 -6.5Z"},
    canadacanoe: {d: "M-11.5 -3.6Q-9 0 -6 0.4H6Q9 0 11.5 -3.6Q10.4 3.6 4 4.4H-4Q-10.4 3.6 -11.5 -3.6Z M5.6 -10.4L6.8 -10.2L3.4 2.2L2.2 2Z", detail: "M-8 0.6H8", dstroke: true},
    canadamtn: {d: "M-11.5 8.5L-5.4 -2.4L-3.2 0.2L1.2 -8.6L6.2 0.6L8 -1.6L11.5 8.5Z", detail: "M1.2 -8.6L3.6 -3.8L2 -4.6L0.6 -3L-0.8 -4.8Z", dfill: true}
  });

  // ---- finish moment sprites ----
  const mix = (a, b, t) => "#" + [1, 3, 5].map(i => { const u = parseInt(a.substr(i, 2), 16); return Math.round(u + (parseInt(b.substr(i, 2), 16) - u) * t).toString(16).padStart(2, "0"); }).join("");
  const oval = (g, x, y, rx, ry, r = 0) => { g.beginPath(); g.ellipse(x, y, rx, ry, r, 0, 6.3); };
  const sheen = (g, a = 0.32, b = 0.22) => { g.save(); g.globalCompositeOperation = "source-atop"; const gr = g.createLinearGradient(-8, -10, 8, 10); gr.addColorStop(0, `rgba(255,255,255,${a})`); gr.addColorStop(0.45, "rgba(255,255,255,0)"); gr.addColorStop(1, `rgba(0,0,0,${b})`); g.fillStyle = gr; g.fillRect(-13, -13, 26, 26); g.restore(); };
  // a Canada goose in flight, side view, drawn live every frame in body lengths (BL), head toward +x: long black neck
  // stretched forward, black head with a white chinstrap, brown-grey body, pale belly, white under the tail, and long
  // wings (span about 2.2 BL) beating through a big smooth stroke, the hand bending back at the wrist on the upstroke.
  // We look from slightly below, so the near wing drops and the far wing lifts when they are level, and both read.
  const GZ = {body: "#7E6E60", back: "#6A5C50", belly: "#DCD3C6", wing: "#76685C", hand: "#4A3F36", farW: "#5E5248", farH: "#3A322C", black: "#17161A"};
  const gooseDraw = (g, w, ph, dk) => { const dw = Math.cos(ph), up = 0.12 + 0.92 * w, hand = up - 0.32 * (0.5 + 0.5 * dw), rim = dk ? "rgba(226,230,244,.55)" : "rgba(30,24,20,.35)";
    const wingP = (k, sx) => { const P = (x, y, z) => [x, -y + k * z], a1 = 0.5, a2 = 0.74, S = [0.2 + sx, -0.12], Wr = [S[0] - 0.04 + P(0, Math.sin(up) * a1, Math.cos(up) * a1)[0], S[1] + P(0, Math.sin(up) * a1, Math.cos(up) * a1)[1]],
        hv = P(-0.2, Math.sin(hand) * a2, Math.cos(hand) * a2), T = [Wr[0] + hv[0], Wr[1] + hv[1]], Wb = [Wr[0] - 0.42, Wr[1] + 0.05], Sr = [S[0] - 0.46, S[1] + 0.05], Tb = [T[0] - 0.1, T[1] + 0.06];
      return {S, Wr, T, Wb, Sr, Tb}; };
    const wing = (k, sx, cw, ch) => { const {S, Wr, T, Wb, Sr, Tb} = wingP(k, sx); g.fillStyle = cw; g.beginPath(); g.moveTo(S[0], S[1]); g.quadraticCurveTo((S[0] + Wr[0]) / 2 + 0.03, (S[1] + Wr[1]) / 2, Wr[0], Wr[1]); g.lineTo(T[0], T[1]); g.lineTo(Tb[0], Tb[1]);
      g.quadraticCurveTo((Wb[0] + Tb[0]) / 2 - 0.04, (Wb[1] + Tb[1]) / 2 + 0.02, Wb[0], Wb[1]); g.quadraticCurveTo((Wb[0] + Sr[0]) / 2, (Wb[1] + Sr[1]) / 2 + 0.05, Sr[0], Sr[1]); g.closePath(); g.fill(); g.strokeStyle = rim; g.lineWidth = 0.018; g.stroke();
      g.fillStyle = ch; g.beginPath(); g.moveTo(Wr[0], Wr[1]); g.lineTo(T[0], T[1]); g.lineTo(Tb[0], Tb[1]); g.quadraticCurveTo((Wb[0] + Tb[0]) / 2 - 0.04, (Wb[1] + Tb[1]) / 2 + 0.02, Wb[0], Wb[1]); g.closePath(); g.fill(); };
    wing(-0.24, 0.08, GZ.farW, GZ.farH);
    // tail, body, pale belly and white undertail
    g.fillStyle = GZ.black; g.beginPath(); g.moveTo(-0.42, -0.08); g.lineTo(-0.66, -0.06); g.lineTo(-0.64, 0.05); g.lineTo(-0.42, 0.06); g.closePath(); g.fill();
    const bp = new Path2D(); bp.ellipse(0, 0, 0.5, 0.165, -0.03, 0, 6.3); g.fillStyle = GZ.body; g.fill(bp); g.save(); g.clip(bp); g.fillStyle = GZ.back; g.fillRect(-0.6, -0.3, 1.2, 0.17); g.fillStyle = GZ.belly; g.beginPath(); g.ellipse(0.02, 0.15, 0.46, 0.11, 0, 0, 6.3); g.fill();
    g.fillStyle = "#FFFFFF"; g.beginPath(); g.ellipse(-0.42, 0.06, 0.13, 0.09, 0.2, 0, 6.3); g.fill(); g.restore(); g.strokeStyle = rim; g.lineWidth = 0.018; g.stroke(bp);
    // the long black neck and head with its white chinstrap
    g.lineCap = "round"; if (dk) { g.strokeStyle = "rgba(226,230,244,.5)"; g.lineWidth = 0.15; g.beginPath(); g.moveTo(0.38, -0.04); g.quadraticCurveTo(0.7, -0.1, 0.94, -0.1); g.stroke(); }
    g.strokeStyle = GZ.black; g.lineWidth = 0.11; g.beginPath(); g.moveTo(0.36, -0.03); g.quadraticCurveTo(0.7, -0.1, 0.94, -0.1); g.stroke(); g.fillStyle = GZ.black; g.beginPath(); g.ellipse(0.99, -0.1, 0.115, 0.08, 0.05, 0, 6.3); g.fill(); if (dk) { g.strokeStyle = "rgba(226,230,244,.5)"; g.lineWidth = 0.02; g.stroke(); }
    g.beginPath(); g.moveTo(1.06, -0.125); g.lineTo(1.2, -0.095); g.lineTo(1.06, -0.065); g.closePath(); g.fill(); g.fillStyle = "#FFFFFF"; g.beginPath(); g.ellipse(0.96, -0.07, 0.07, 0.042, 0.45, 0, 6.3); g.fill();
    g.fillStyle = dk ? "#C8C0B4" : "#B8AC9C"; g.beginPath(); g.ellipse(0.4, 0.02, 0.07, 0.08, 0, 0, 6.3); g.fill();
    wing(0.24, 0, GZ.wing, GZ.hand); };
  // each V glides on a gentle wave, every bird drifts a little in its slot, faces its heading and beats slightly out of phase
  let flock = [];
  const flockDraw = () => (g, f, W, H, d) => { const sc = 1.6 * Math.max(0.8, Math.min(1.6, Math.sqrt(W * H) / 900));
    for (const b of flock) { const t = f - b.t0; if (t < 0 || t > b.life) continue; const a = fxEase(t / 20) * fxEase((b.life - t) / 40); if (a <= 0.01) continue;
      const pos = u => [b.x + b.vx * u + 3 * Math.sin(u * 0.021 + b.ph) * sc, b.y + b.amp * Math.sin(u * 0.011 + b.wph) - b.climb * u + 3.5 * Math.sin(u * 0.027 + b.ph * 1.7) * sc],
        [x, y] = pos(t), [x1, y1] = pos(t + 1), [x0, y0] = pos(t - 1), hx = x1 - x0, hy = y1 - y0, L = hx < 0;
      const ph = t * b.fr + b.ph, w = Math.sin(ph + 0.3 * Math.sin(ph)), s = b.size * sc;
      g.globalAlpha = a; g.save(); g.translate(x, y + w * 0.05 * s); g.rotate(L ? Math.atan2(-hy, -hx) : Math.atan2(hy, hx)); g.scale(L ? -s : s, s); gooseDraw(g, w, ph, d); g.restore(); }
    g.globalAlpha = 1; };
  // a sugar maple leaf, warming from the stem toward its points, with fine veins
  FX_SHAPES.canadamaple = {d: FX_SHAPES.canadaleaf.d, paint: (g, c) => { const p = new Path2D(FX_SHAPES.canadaleaf.d), gr = g.createLinearGradient(0, 9, 0, -12); gr.addColorStop(0, mix(c, "#F6C440", 0.45)); gr.addColorStop(0.6, c); gr.addColorStop(1, mix(c, "#7A1A10", 0.25)); g.fillStyle = gr; g.fill(p); sheen(g, 0.26, 0.2);
    g.strokeStyle = mix(c, "#5A1008", 0.45); g.globalAlpha = 0.55; g.lineWidth = 0.4; g.stroke(new Path2D("M0 7.6L0 -9M0 1L6.4 -4M0 1L-6.4 -4M0 3L5 3.6M0 3L-5 3.6M0 -3L2.6 -7M0 -3L-2.6 -7")); g.globalAlpha = 1; g.strokeStyle = mix(c, "#4A2A10", 0.5); g.lineWidth = 0.7; g.beginPath(); g.moveTo(0, 7.6); g.lineTo(0.4, 11.4); g.stroke(); }};
  // ---- end finish moment sprites ----
  MAJ_THEMES.push({
    skin: {id: "canada", name: "Canada", group: "world", desc: "A turquoise lake below the Rocky Mountains.",
      light: ["#EEF6F5", "rgba(184,58,44,.10)", "#FFFFFF", "#17303A", "#4E6670", "#D2E3E2", "#E2EEED", "#F7FBFA", "#B83A2C", "#CF6252", "#FFFFFF", "#7A2218", "#134C56", "#CDEDEA", "#FFE2A8"],
      dark: ["#0B1428", "rgba(94,212,208,.08)", "#13203A", "#EEF4FA", "#A9BBD0", "#263A5A", "#1C2D4C", "#0F1A32", "#5ED4D0", "#8FE6DC", "#0E1E30", "#2A7A80", "#0A1430", "#C4E2EC", "#6A4A2A"],
      glow: ["linear-gradient(180deg,#9CCDF0,#DCEEF8 45%,#EFF3E6)", "linear-gradient(180deg,#0A1430,#172A50 45%,#2C4A5E)"],
      spine: [lg("#1E7480", "#134C56"), lg("#172A50", "#0A1430")], btn: [lg2("#B83A2C", "#D9662A"), lg2("#5ED4D0", "#8FE6DC")]},
    kit: {motif: "canadaleaf", card: ["#FBFDFC", "#E3F2F0"], ink: "#17303A", bd: "#B8DAD6", mc: "#C8392B", r: 12, notes: ["#FBD8C8", "#CDEDEA"].concat(NOTES), shape: "folded", pin: "tape", fab: "18px 18px 6px 18px", btn: "12px"},
    fx: {spawn: (W, H, d, n) => { const sc = 1.6 * Math.max(0.8, Math.min(1.6, Math.sqrt(W * H) / 900)), gap = 46 * sc, vee = (k, x0, y0, dir, t0, v) => { const wph = fxR(0, 6.3); return Array.from({length: k}, (_, i) => { const j = Math.ceil(i / 2), side = i % 2 ? 1 : -1;
        return {x: x0 - dir * j * gap, y: y0 + side * j * gap * 0.5, vx: dir * v, amp: H * 0.025, wph, climb: 0.05, t0: t0 + j * 2, life: 330, fr: 0.17, ph: j * 0.7 + fxR(0, 0.5), size: fxR(17, 19.5)}; }); };
      flock = vee(Math.min(9, n(7)), -40, H * 0.3, 1, 0, W / 240).concat(vee(Math.min(7, n(5)), W + 40, H * 0.15, -1, 36, W / 270));
      return fxFall(W, H, n(42), "canadamaple", d ? ["#E0503A", "#F08A3A", "#F2B04A", "#C83A2E"] : ["#D6382A", "#EE8C2A", "#F2B23E", "#B82E22"], {sway: 1.5, flip: true, smin: 11, smax: 16, vmin: 0.9, vmax: 1.5, spread: 70, life: 320})
          .map(p => Object.assign(p, {vx: fxR(0.3, 1) * p.z, g: 0.004 * p.z, term: 1.6 * p.z, swf: fxR(0.022, 0.036)}))
        .concat(fxTw(W, H, n(12), "sparkle", d ? ["#7CF0C0", "#FFFFFF"] : ["#FFFFFF", "#F2B23E"], {smin: 3, smax: 6, top: 0.6, glow: d ? 12 : 6})); },
      len: 300, draw: flockDraw()},
    tag: "A turquoise glacier lake below a jagged wall of snowy Rocky Mountain peaks, with red canoes at the dock, a log cabin and maples in autumn color"
  });
})();
/* end of module 20-scenes-maj-canada.js */


