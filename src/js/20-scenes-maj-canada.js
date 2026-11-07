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
  // a bird in profile, head toward +x, painted with its wings at angle th (three poses make a flap)
  const BIRD = "M-11 -1.4L-5 -0.4C-3 -2.6 3 -2.6 5.6 -1.4A2.4 2.4 0 1 1 7 1C4 3.8 -3 4 -4.6 2L-11.2 2.2Z";
  const bird = (sp, th) => (g, c) => { const ln = sp.line || "rgba(40,50,70,.35)", body = sp.body || c, wp = new Path2D("M0.6 -1.2C-3 -2.6 -7.4 -2.4 -10.4 0C-7.4 1.2 -3 1.8 0.6 1.4Z"); g.scale(sp.k || 1, sp.k || 1); g.translate(sp.ox || 0, 0); g.lineCap = "round"; g.lineWidth = 0.3;
    const wing = (x, y, a, col, tip) => { g.save(); g.translate(x, y); g.rotate(a); g.fillStyle = col; g.fill(wp); g.save(); g.clip(wp); g.fillStyle = tip; g.fillRect(-11, -3, 4.4, 6); if (sp.bars) { g.fillStyle = sp.bars; g.fillRect(-5.4, -3, 0.9, 6); g.fillRect(-3.8, -3, 0.9, 6); } g.restore(); g.strokeStyle = ln; g.stroke(wp); g.restore(); };
    wing(1.4, -1.8, th + 0.25, mix(sp.wing || body, "#000000", 0.2), mix(sp.tip || sp.wing || body, "#000000", 0.2));
    g.fillStyle = sp.tail || body; g.beginPath(); g.moveTo(-5, -0.6); g.lineTo(-11, -1.6); g.lineTo(-11.2, 2.2); g.lineTo(-4.6, 2.2); g.closePath(); g.fill(); g.strokeStyle = ln; g.stroke(); if (sp.under) { g.fillStyle = sp.under; g.beginPath(); g.moveTo(-4.6, 1.2); g.lineTo(-7.4, 1.8); g.lineTo(-4.4, 2.8); g.fill(); }
    const bp = new Path2D(); bp.ellipse(-0.6, 0.6, 6.4, 3.1, -0.06, 0, 6.3); g.fillStyle = body; g.fill(bp); g.save(); g.clip(bp); g.fillStyle = sp.belly || body; g.fillRect(-8, 1.5, 16, 3); if (sp.bib) { g.fillStyle = sp.bib; oval(g, 5, 0.4, 2.8, 2.8); g.fill(); } g.restore(); g.strokeStyle = ln; g.stroke(bp);
    const nl = sp.neck || 0, hr = sp.hr || 2.3, hx = 4.8 + nl * 0.75, hy = -1.6 - nl * 0.6;
    if (nl) { g.strokeStyle = sp.head; g.lineWidth = 2.3; g.beginPath(); g.moveTo(3.4, -0.2); g.quadraticCurveTo(hx - 0.6, -0.4, hx, hy); g.stroke(); g.lineWidth = 0.3; }
    const [bl, bh, bc, bcol, btip] = sp.beak, bx = hx + hr * 0.7, bk = new Path2D(`M${bx - 0.6} ${hy - bh * 0.5}Q${bx + bl * 0.6} ${hy - bh * 0.5 + bc * 0.3} ${bx + bl} ${hy + bc}Q${bx + bl * 0.45} ${hy + bh * 0.5 + bc * 0.6} ${bx - 0.6} ${hy + bh * 0.5}Z`);
    g.fillStyle = bcol; g.fill(bk); if (btip) { g.save(); g.clip(bk); g.fillStyle = btip; g.fillRect(bx + bl * 0.74, hy - 6, 8, 12); g.restore(); } if (sp.bill) { g.fillStyle = "rgba(255,255,255,.35)"; g.save(); g.clip(bk); g.fillRect(bx - 1, hy - bh, bl + 2, bh * 0.45); g.restore(); }
    g.fillStyle = sp.head || body; oval(g, hx, hy, hr, hr * 0.92); g.fill(); g.strokeStyle = ln; g.stroke(); if (sp.cheek) { g.fillStyle = sp.cheek; oval(g, hx - 0.3, hy + 0.7, hr * 0.55, hr * 0.38, 0.4); g.fill(); }
    if (sp.ring) { g.fillStyle = sp.ring; oval(g, hx + hr * 0.3, hy - hr * 0.2, 0.95, 0.95); g.fill(); } g.fillStyle = sp.eye || "#1A1A22"; oval(g, hx + hr * 0.3, hy - hr * 0.2, 0.5, 0.5); g.fill();
    sheen(g, 0.24, 0.16); wing(0.4, -1.2, th, sp.wing || body, sp.tip || sp.wing || body); };
  const birdShapes = (name, sp) => [1.25, 0.3, -0.75].forEach((th, i) => { FX_SHAPES[name + i] = {d: BIRD, paint: bird(sp, th)}; });
  // a flock drawn by hand so the wings can really flap: each bird is {x, y, vx, vy, ay, t0, life, fr, ph, size, c}
  let flock = [];
  const flockDraw = base => (g, f, W, H, d) => { const sc = 1.6 * Math.max(0.8, Math.min(1.6, Math.sqrt(W * H) / 900));
    flock.forEach(b => { const t = f - b.t0; if (t < 0 || t > b.life) return; const a = fxEase(t / 12) * fxEase((b.life - t) / 40); if (a <= 0.01) return;
      const w = Math.sin(t * b.fr + b.ph), vy = b.vy + b.ay * t, x = b.x + b.vx * t, y = b.y + b.vy * t + b.ay * t * t / 2 + w * (b.bob || 0.6) * sc, spr = fxSprite(base + (w > 0.4 ? 0 : w < -0.4 ? 2 : 1), b.c, b.glow || 0, d), s = b.size * sc / 10, h = spr._half * s, L = b.vx < 0;
      g.globalAlpha = a * (b.alpha || 1); g.save(); g.translate(x, y); g.rotate(L ? Math.atan2(-vy, -b.vx) : Math.atan2(vy, b.vx)); g.scale(L ? -1 : 1, 1); g.drawImage(spr, -h, -h, 2 * h, 2 * h); g.restore(); }); g.globalAlpha = 1; };
  birdShapes("canadagoose", {body: "#8C7E70", belly: "#E4DCD2", wing: "#7A6E62", tip: "#3A322C", tail: "#1E1C1E", head: "#1E1C1E", neck: 4.4, hr: 1.8, cheek: "#FFFFFF", beak: [2.2, 1, 0.3, "#1E1C1E"], k: 0.8, ox: -1.4, line: "rgba(40,30,24,.45)"});
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
    fx: {spawn: (W, H, d, n) => { const sc = 1.6 * Math.max(0.8, Math.min(1.6, Math.sqrt(W * H) / 900)), gap = 30 * sc, vee = (k, x0, y0, dir, t0) => Array.from({length: k}, (_, i) => { const j = Math.ceil(i / 2), side = i % 2 ? 1 : -1;
        return {x: x0 - dir * j * gap, y: y0 + side * j * gap * 0.5, vx: dir * W / 230, vy: -0.25, ay: 0, t0: t0 + j * 2, life: 320, fr: 0.22, ph: j * 0.9 + fxR(0, 0.4), size: fxR(17, 19), c: d ? "#E8E4F0" : "#8C7E70", glow: d ? 6 : 0}; });
      flock = vee(Math.min(9, n(7)), -40, H * 0.32, 1, 0).concat(vee(Math.min(7, n(5)), W + 40, H * 0.16, -1, 40));
      return fxFall(W, H, n(46), "canadamaple", d ? ["#E0503A", "#F08A3A", "#F2B04A", "#C83A2E"] : ["#D6382A", "#EE8C2A", "#F2B23E", "#B82E22"], {sway: 2.2, flip: true, smin: 11, smax: 16, vmin: 1, vmax: 2}).map(p => Object.assign(p, {vx: fxR(0.4, 1.4)}))
        .concat(fxTw(W, H, n(14), "sparkle", d ? ["#7CF0C0", "#FFFFFF"] : ["#FFFFFF", "#F2B23E"], {smin: 3, smax: 6, top: 0.6, glow: d ? 12 : 6})); },
      len: 300, draw: flockDraw("canadagoose")},
    tag: "A turquoise glacier lake below a jagged wall of snowy Rocky Mountain peaks, with red canoes at the dock, a log cabin and maples in autumn color"
  });
})();
/* end of module 20-scenes-maj-canada.js */


