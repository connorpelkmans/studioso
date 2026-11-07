/* ===== module: 20-scenes-maj-egypt.js ===== */
/* Around the World */
(() => {
  const lg = (a, b) => `linear-gradient(180deg,${a},${b})`, lg2 = (a, b) => `linear-gradient(135deg,${a},${b})`;
  const r1 = n => Math.round(n * 100) / 100;
  const pts = a => "M" + a.map(p => `${r1(p[0])} ${r1(p[1])}`).join("L") + "Z";
  const circ = (x, y, r) => `M${r1(x - r)} ${r1(y)}a${r1(r)} ${r1(r)} 0 1 0 ${r1(2 * r)} 0a${r1(r)} ${r1(r)} 0 1 0 ${r1(-2 * r)} 0Z`;
  const ell = (x, y, rx, ry) => `M${r1(x - rx)} ${r1(y)}a${r1(rx)} ${r1(ry)} 0 1 0 ${r1(2 * rx)} 0a${r1(rx)} ${r1(ry)} 0 1 0 ${r1(-2 * rx)} 0Z`;
  const NOTES = ["#FFF3B8", "#D9F0D8", "#D6E6FF", "#FFD9C8", "#EBD9FF"];
  Object.assign(FX_SHAPES, {
    // the Great Pyramid with its courses
    egyptpyr: {d: "M0 -10L11.5 8.6H-11.5Z", detail: "M-3.8 -3.8H3.8M-6.3 0.3H6.3M-8.8 4.4H8.8M0 -10L2.4 8.6", dstroke: true},
    // a blue lotus flower opening on its pad
    egyptlotus: {d: "M0 6C-2.2 2 -2.2 -4 0 -10C2.2 -4 2.2 2 0 6Z M-0.4 6C-4.6 4.6 -8.4 -0.6 -8.6 -6.4C-4.4 -4.4 -1.4 -0.4 -0.4 6Z M0.4 6C4.6 4.6 8.4 -0.6 8.6 -6.4C4.4 -4.4 1.4 -0.4 0.4 6Z M-10 7.4Q0 3.6 10 7.4Q0 10.6 -10 7.4Z", detail: "M0 4V-6M-1.6 4.6Q-5 1 -6.4 -3.6M1.6 4.6Q5 1 6.4 -3.6", dstroke: true},
    // an ibis in flight
    egyptibis: {d: "M-9 1C-6 -1.4 2 -1.6 4.6 -0.6L8.4 -1.8Q10.8 -2.2 11.8 0.8L11.2 1.2Q10.2 -0.4 8.6 -0.2L5 1.6C1.6 3 -4.6 3 -9 1Z M-3.4 -0.6L-6.6 -10L-1.6 -9.2L2.4 -0.8Z M-11.6 1.6L-8 0.6L-7.6 2.2Z"},
    // a scarab beetle seen from above
    egyptscarab: {d: ell(0, 2, 6.4, 7.6) + ell(0, -6.8, 3.8, 2.6) + "M-2.4 -9.4L-4 -11.6L-1.4 -9.8Z M2.4 -9.4L4 -11.6L1.4 -9.8Z M-6 -1L-10 -3.4L-9.6 -2L-6 0.4Z M6 -1L10 -3.4L9.6 -2L6 0.4Z M-6 3.6L-10.4 3.4L-10 4.6L-5.8 5Z M6 3.6L10.4 3.4L10 4.6L5.8 5Z M-4.6 7.4L-8 10.6L-6.8 11L-3.6 8.6Z M4.6 7.4L8 10.6L6.8 11L3.6 8.6Z", detail: "M0 -4.4V9.4M-5.6 -2.4Q0 -5.2 5.6 -2.4", dstroke: true},
    // a papyrus umbel
    egyptpapy: {d: "M0 11V-1" + [0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => { const a = -Math.PI * (0.04 + 0.92 * i / 8), c = Math.cos(a), s = Math.sin(a); return `M0 -1Q${r1(c * 5)} ${r1(-1 + s * 6)} ${r1(c * 9.6)} ${r1(-1 + s * 9.6 + 3 * c * c)}`; }).join(""), stroke: true, lw: 1.3},
    // a felucca's lateen sail on its hull
    egyptsail: {d: "M5.4 6.4L-6.6 -11.4Q-1.6 -2.6 -5 5.2Q0.4 4.4 5.4 6.4Z M-9.6 7.2H9.6L7.6 10.4H-7.6Z", detail: "M5.6 6.6L-7.4 -12.4M0.6 6L-0.4 -8.6", dstroke: true},
    // the low sun with short rays
    egyptsun: {d: circ(0, 0, 5.6) + [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => { const a = i / 10 * Math.PI * 2, c = Math.cos(a), s = Math.sin(a); return pts([[c * 7 - s * 1.2, s * 7 + c * 1.2], [c * 11, s * 11], [c * 7 + s * 1.2, s * 7 - c * 1.2]]); }).join(""), detail: circ(0, 0, 3.4), dfill: true}
  });

  // ---- finish moment sprites ----
  const mix = (a, b, t) => "#" + [1, 3, 5].map(i => { const u = parseInt(a.substr(i, 2), 16); return Math.round(u + (parseInt(b.substr(i, 2), 16) - u) * t).toString(16).padStart(2, "0"); }).join("");
  const oval = (g, x, y, rx, ry, r = 0) => { g.beginPath(); g.ellipse(x, y, rx, ry, r, 0, 6.3); };
  const sheen = (g, a = 0.32, b = 0.22) => { g.save(); g.globalCompositeOperation = "source-atop"; const gr = g.createLinearGradient(-8, -10, 8, 10); gr.addColorStop(0, `rgba(255,255,255,${a})`); gr.addColorStop(0.45, "rgba(255,255,255,0)"); gr.addColorStop(1, `rgba(0,0,0,${b})`); g.fillStyle = gr; g.fillRect(-13, -13, 26, 26); g.restore(); };
  // a bird drawn fresh every frame, so its wings really beat: head toward +x, ph = wingbeat phase, amp = how far the wings swing.
  // Each wing has an arm and a hand; the hand trails the arm a little, so the stroke curls like a real wing instead of hinging.
  const flyBird = (g, sp, ph, amp) => { const ln = sp.line || "rgba(40,50,70,.35)", body = sp.body, a1 = Math.sin(ph) * amp + (sp.lift || 0.1), a2 = Math.sin(ph - 0.75) * amp + (sp.lift || 0.1), wl = sp.wl || 1; g.lineCap = g.lineJoin = "round"; g.lineWidth = 0.35;
    // each wing turns about the body: up and down on screen, toward or away from us (seen a little from below), swept back toward the tail
    const wing = (sx, sy, z, col, tip) => { const t1 = 1.1 * a1, t2 = 1.25 * a2, L1 = 5 * wl, L2 = 7.4 * wl * (1 - 0.2 * Math.max(0, Math.cos(ph)) * amp), c0 = 6.4 * (sp.chord || 1), c1 = 5 * (sp.chord || 1),
        ex = sx - L1 * 0.22, ey = sy + L1 * (-Math.sin(t1) + z * 0.38 * Math.cos(t1)), tx = ex - L2 * (0.56 - 0.14 * Math.cos(t2)), ty = ey + L2 * (-Math.sin(t2) + z * 0.38 * Math.cos(t2)), q = (u, v) => (u + v) / 2;
      const p = new Path2D(); p.moveTo(sx + 0.6, sy); p.quadraticCurveTo(ex + 0.6, ey, q(ex, tx) + 0.3, q(ey, ty)); p.quadraticCurveTo(tx + 0.4, ty, tx - 0.8, ty + 0.1 * (ty - ey)); p.quadraticCurveTo(tx - 2.2, q(ty, ey), ex - c1, ey + 0.5); p.quadraticCurveTo(ex - c0 * 1.05, q(ey, sy) + 0.6, sx - c0, sy + 0.6); p.closePath();
      g.fillStyle = col; g.fill(p); g.save(); g.clip(p); if (sp.tipLen) { g.fillStyle = tip; g.beginPath(); g.arc(tx - 0.6, ty, L2 * sp.tipLen, 0, 6.3); g.fill(); }
      g.strokeStyle = "rgba(0,0,0,.14)"; g.beginPath(); for (let i = 1; i < 4; i++) { const u = i / 4; g.moveTo(ex - c1 * u, ey + 0.5); g.lineTo(tx - 0.6 - 1.2 * u, ty + 0.4); } g.moveTo(ex - 0.3, ey + 0.2); g.quadraticCurveTo(q(ex, sx) - c0 * 0.4, q(ey, sy) + 0.4, sx - c0 * 0.9, sy + 0.4); g.stroke(); g.restore(); g.strokeStyle = ln; g.stroke(p); };
    wing(0.6, -1.4, -1, mix(sp.wing || body, "#000000", 0.13), mix(sp.tip || sp.wing || body, "#000000", 0.12));
    if (sp.legs) { g.strokeStyle = sp.legs; g.lineWidth = 0.7; g.beginPath(); g.moveTo(-3, 2.2); g.lineTo(-12.6, 2.6); g.stroke(); g.lineWidth = 0.35; }
    const tl = sp.tailL || 1; g.fillStyle = sp.tail || body; g.beginPath(); g.moveTo(-4.6, -0.8); g.lineTo(-10.4 * tl, -2); g.quadraticCurveTo(-11.8 * tl, 0.3, -10.4 * tl, 2.6); g.lineTo(-4.4, 2.2); g.closePath(); g.fill(); g.strokeStyle = ln; g.stroke();
    if (sp.under) { g.fillStyle = sp.under; g.beginPath(); g.moveTo(-4.4, 1); g.lineTo(-7.6, 1.8); g.lineTo(-4.2, 3); g.fill(); }
    const bp = new Path2D(); bp.ellipse(-0.6, 0.6, 6.4, 3.1, -0.06, 0, 6.3); const gr = g.createLinearGradient(0, -2.6, 0, 3.8); gr.addColorStop(0, mix(body, "#FFFFFF", 0.18)); gr.addColorStop(0.55, body); gr.addColorStop(1, sp.belly || mix(body, "#000000", 0.14)); g.fillStyle = gr; g.fill(bp);
    if (sp.bib) { g.save(); g.clip(bp); g.fillStyle = sp.bib; oval(g, 5, 0.6, 2.8, 2.8); g.fill(); g.restore(); } g.strokeStyle = ln; g.stroke(bp);
    const nl = sp.neck || 0, hr = sp.hr || 2.3, hx = 4.8 + nl, hy = -1.4 - nl * 0.25;
    if (nl) { g.strokeStyle = sp.nk || sp.head; g.lineWidth = hr * 0.95; g.beginPath(); g.moveTo(3.2, -0.2); g.quadraticCurveTo(hx - nl * 0.5, hy + 0.3, hx, hy); g.stroke(); g.lineWidth = 0.35; }
    const [bl, bh, bc, bcol, btip] = sp.beak, bx = hx + hr * 0.7, bk = new Path2D(`M${bx - 0.6} ${hy - bh * 0.5}Q${bx + bl * 0.6} ${hy - bh * 0.5 + bc * 0.3} ${bx + bl} ${hy + bc}Q${bx + bl * 0.45} ${hy + bh * 0.5 + bc * 0.6} ${bx - 0.6} ${hy + bh * 0.5}Z`);
    g.fillStyle = bcol; g.fill(bk); if (btip) { g.save(); g.clip(bk); g.fillStyle = btip; g.fillRect(bx + bl * 0.74, hy - 6, 8, 12); g.restore(); } if (sp.bill) { g.save(); g.clip(bk); g.fillStyle = "rgba(255,255,255,.35)"; g.fillRect(bx - 1, hy - bh, bl + 2, bh * 0.45); g.restore(); }
    g.fillStyle = sp.head || body; oval(g, hx, hy, hr, hr * 0.92); g.fill(); g.strokeStyle = ln; g.stroke(); if (sp.cheek) { g.fillStyle = sp.cheek; oval(g, hx - 0.3, hy + 0.7, hr * 0.55, hr * 0.38, 0.4); g.fill(); }
    if (sp.ring) { g.fillStyle = sp.ring; oval(g, hx + hr * 0.3, hy - hr * 0.2, 0.95, 0.95); g.fill(); } g.fillStyle = sp.eye || "#1A1A22"; oval(g, hx + hr * 0.3, hy - hr * 0.2, 0.5, 0.5); g.fill();
    wing(1.4, -0.9, 1, sp.wing || body, sp.tip || sp.wing || body); };
  // the flock: each bird flies a smooth cubic curve (points in screen shares) over T frames, with an eased fade at both ends.
  // Heading follows the curve (tilt capped), the body rises a touch on each downstroke, and gliders mix beats with glides.
  let flock = [];
  const flockDraw = (sp, end = 262) => (g, f, W, H, d) => { const sc = 1.6 * Math.max(0.8, Math.min(1.6, Math.sqrt(W * H) / 900)), halo = d && sp.halo ? fxSprite("puffsoft", sp.halo, 0, d) : null;
    const at = (b, t) => { const u = Math.max(0, Math.min(1, t / b.T)), v = 1 - u, [p0, p1, p2, p3] = b.P, k0 = v * v * v, k1 = 3 * v * v * u, k2 = 3 * v * u * u, k3 = u * u * u, w = Math.sin(t * 0.021 + b.ph);
      return [W * (k0 * p0[0] + k1 * p1[0] + k2 * p2[0] + k3 * p3[0]), H * (k0 * p0[1] + k1 * p1[1] + k2 * p2[1] + k3 * p3[1]) + w * H * 0.008]; };
    flock.forEach(b => { const t = f - b.t0; if (t < 0 || t > b.T) return; const a = fxEase(t / 16) * fxEase((b.T - t) / 30) * fxEase((end - f) / 50); if (a <= 0.01) return;
      const [x, y] = at(b, t), [x1, y1] = at(b, t + 2), L = x1 < x, s = b.size * sc / 10, ang = Math.max(-0.55, Math.min(0.55, Math.atan2(y1 - y, Math.abs(x1 - x) + 0.001)));
      const amp = sp.glide ? 0.2 + 0.8 * Math.pow(0.5 + 0.5 * Math.sin(t * sp.glide + b.ph), 1.5) : 1, ph = t * b.fr + b.ph, bob = Math.sin(ph) * amp * (sp.bob || 0.8);
      g.save(); g.translate(x, y + bob * s); g.rotate(L ? -ang : ang); g.scale(L ? -s : s, s); g.globalAlpha = a * (b.alpha || 1);
      if (halo) { g.globalAlpha = a * (sp.haloA || 0.12); g.drawImage(halo, -halo._half * 1.5, -halo._half * 1.1, halo._half * 3, halo._half * 2.2); g.globalAlpha = a * (b.alpha || 1); }
      flyBird(g, sp, ph, amp * (sp.amp || 1)); g.restore(); }); g.globalAlpha = 1; };
  const IBIS = {body: "#FFFFFF", belly: "#E8E2D8", wing: "#FBF9F4", tip: "#1E1A1C", tipLen: 0.42, tail: "#2A2426", tailL: 0.9, head: "#1E1A1C", neck: 3.2, hr: 1.6, beak: [6.6, 0.9, 2.6, "#2A2224"], legs: "#3A3032", wl: 1.25, line: "rgba(70,56,40,.4)", halo: "#FFE6B0", bob: 0.7};
  // a blue water lily opening above its pad
  FX_SHAPES.egyptlily = {d: FX_SHAPES.egyptlotus.d, paint: (g, c) => { g.fillStyle = "#4E9A5A"; g.beginPath(); g.moveTo(-10, 7.4); g.quadraticCurveTo(0, 3.6, 10, 7.4); g.quadraticCurveTo(0, 10.6, -10, 7.4); g.fill();
    [[-1.05, 9.6, 0.82], [1.05, 9.6, 0.82], [-0.55, 12.6, 1], [0.55, 12.6, 1], [0, 15, 1.08]].forEach(([a, L, k]) => { g.save(); g.translate(0, 6); g.rotate(a); const gr = g.createLinearGradient(0, 0, 0, -L); gr.addColorStop(0, "#F6E2A0"); gr.addColorStop(0.35, mix(c, "#FFFFFF", 0.35)); gr.addColorStop(1, mix(c, "#000000", 0.12 * (2 - k)));
      g.fillStyle = gr; g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(-3, -L * 0.35, -1.8, -L * 0.8, 0, -L); g.bezierCurveTo(1.8, -L * 0.8, 3, -L * 0.35, 0, 0); g.fill(); g.strokeStyle = "rgba(255,255,255,.4)"; g.lineWidth = 0.3; g.beginPath(); g.moveTo(0, -1); g.lineTo(0, -L * 0.8); g.stroke(); g.restore(); });
    g.fillStyle = "#F2C24A"; oval(g, 0, 5.2, 2, 1); g.fill(); }};
  const ibisDraw = flockDraw(IBIS, 292);
  // the sun disc of Ra swells up out of the haze with slow-turning rays behind it, and the ibis fly across in front
  const sunDraw = (g, f, W, H, d) => { const a = fxEase(f / 45) * fxOut(f, 200, 285); if (a <= 0) return; const ph = W < H, R = Math.min(W, H) * (ph ? 0.12 : 0.095), cx = W * (ph ? 0.64 : 0.66), cy = H * (ph ? 0.22 : 0.25) + (1 - fxEase(f / 140)) * H * 0.05;
    g.globalCompositeOperation = d ? "lighter" : "source-over"; let gr = g.createRadialGradient(cx, cy, R * 0.6, cx, cy, R * 3.4); gr.addColorStop(0, d ? "rgba(255,200,110,.32)" : "rgba(255,214,140,.55)"); gr.addColorStop(1, "rgba(255,200,120,0)");
    g.globalAlpha = a; g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, R * 3.4, 0, 6.3); g.fill();
    gr = g.createRadialGradient(cx, cy, R, cx, cy, R * 2.9); gr.addColorStop(0, d ? "rgba(255,214,140,.22)" : "rgba(255,190,90,.24)"); gr.addColorStop(1, "rgba(255,200,120,0)"); g.fillStyle = gr; g.beginPath();
    for (let i = 0; i < 16; i++) { const t = i / 16 * 6.283 + f * 0.0025, w = i % 2 ? 0.05 : 0.085, L = R * (i % 2 ? 2.3 : 2.9); g.moveTo(cx + Math.cos(t - w) * R, cy + Math.sin(t - w) * R); g.lineTo(cx + Math.cos(t) * L, cy + Math.sin(t) * L); g.lineTo(cx + Math.cos(t + w) * R, cy + Math.sin(t + w) * R); } g.fill();
    gr = g.createRadialGradient(cx - R * 0.25, cy - R * 0.3, 0, cx, cy, R); gr.addColorStop(0, "#FFF8DC"); gr.addColorStop(0.6, d ? "#FFD98A" : "#FFD27A"); gr.addColorStop(1, d ? "#F2B85A" : "#F4B04E");
    g.globalAlpha = a * (d ? 0.62 : 0.8); g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, R * (0.9 + 0.1 * fxEase(f / 60)), 0, 6.3); g.fill(); g.globalCompositeOperation = "source-over"; g.globalAlpha = 1; };
  // ---- end finish moment sprites ----
  MAJ_THEMES.push({
    skin: {id: "egypt", name: "Egypt", group: "world", desc: "The pyramids at golden hour above the Nile.",
      light: ["#FBF5EA", "rgba(176,100,28,.10)", "#FFFFFF", "#2A2216", "#6E604C", "#ECDDC4", "#F5EBDA", "#FDFAF4", "#B0641C", "#C98A3E", "#FFFFFF", "#7A4214", "#1D3D6A", "#E6EEF8", "#FFE3A0"],
      dark: ["#0E1230", "rgba(242,196,98,.08)", "#171B40", "#F6F0E2", "#BDB4CF", "#2C3062", "#22275A", "#131736", "#F2C462", "#F7DC94", "#1A1838", "#7A6232", "#14163A", "#D8D4EE", "#6A5428"],
      glow: ["linear-gradient(180deg,#9CCBEA,#F4E6C6 45%,#F6C98A)", "linear-gradient(180deg,#0C1232,#1E2050 45%,#4E3260)"],
      spine: [lg("#2F5E96", "#1D3D6A"), lg("#2A2E66", "#14163A")], btn: [lg2("#B0641C", "#D9962E"), lg2("#F2C462", "#F7DC94")]},
    kit: {motif: "egyptpyr", card: ["#FFFAF0", "#F6E6CC"], ink: "#2A2216", bd: "#E8D0A8", mc: "#B0641C", r: 12, notes: ["#F6E2BC", "#FFF3B8", "#D9F0D8", "#D6E6FF", "#FFD9C8", "#EBD9FF"], shape: "folded", pin: "gold", fab: "999px", btn: "12px"},
    fx: {spawn: (W, H, d, n) => { const k = Math.max(3, Math.min(9, n(9) | 1)), sc = 1.6 * Math.max(0.8, Math.min(1.6, Math.sqrt(W * H) / 900)), gap = 52 * sc, rm = (k - 1) / 2, dep = rm * gap / W, y0 = fxR(0.3, 0.36);
        // a V of ibis: the leader flies a long gentle curve over the sun, the others hold their places behind it
        flock = Array.from({length: k}, (_, i) => { const r = Math.ceil(i / 2), sd = i % 2 ? -1 : 1, ox = -r * gap / W, oy = sd * r * gap * 0.42 / H + (sd < 0 ? -0.004 : 0);
          return {P: [[-0.1 + ox, y0 + oy], [0.3 + ox, y0 - 0.1 + oy], [0.6 + ox, y0 - 0.1 + oy], [1.12 + dep + ox, y0 - 0.16 + oy]], t0: 6, T: 250, fr: fxR(0.16, 0.18), ph: i * 0.9 + fxR(0, 0.6), size: 21 - r * 0.6, alpha: 1}; });
      return fxTw(W, H, n(34), "sparkle", d ? ["#FFE3A8", "#FFFFFF", "#F2C462"] : ["#E0A040", "#F2B53A", "#FFFFFF"], {smin: 3, smax: 7, glow: d ? 10 : 6, spread: 150}).map(p => Object.assign(p, {y: H * fxR(0.45, 0.98)}))
        .concat(fxRise(W, H, n(16), "circle", d ? ["#FFE3A8", "#F7DC94"] : ["#E8A848", "#F2C46A"], {smin: 1.6, smax: 3, vmin: 0.4, vmax: 0.9, sway: 0.7, life: 220, spread: 90, glow: d ? 8 : 4, alpha: 0.8})); },
      len: 300, draw: (g, f, W, H, d) => { sunDraw(g, f, W, H, d); ibisDraw(g, f, W, H, d); }},
    tag: "The pyramids of Giza and the Sphinx at golden hour, above the Nile with its palms, papyrus and a white-sailed felucca"
  });
})();
/* end of module 20-scenes-maj-egypt.js */


