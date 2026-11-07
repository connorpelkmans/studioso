/* ===== module: 20-scenes-maj-greece.js ===== */
/* Around the World */
(() => {
  const lg = (a, b) => `linear-gradient(180deg,${a},${b})`, lg2 = (a, b) => `linear-gradient(135deg,${a},${b})`;
  const r1 = n => Math.round(n * 100) / 100;
  const pts = a => "M" + a.map(p => `${r1(p[0])} ${r1(p[1])}`).join("L") + "Z";
  const circ = (x, y, r) => `M${r1(x - r)} ${r1(y)}a${r1(r)} ${r1(r)} 0 1 0 ${r1(2 * r)} 0a${r1(r)} ${r1(r)} 0 1 0 ${r1(-2 * r)} 0Z`;
  // an ellipse turned by ang degrees, as a polygon
  const rell = (x, y, rx, ry, ang) => { const a = ang * Math.PI / 180, c = Math.cos(a), s = Math.sin(a); return pts(Array.from({length: 20}, (_, i) => { const t = i / 20 * Math.PI * 2, px = rx * Math.cos(t), py = ry * Math.sin(t); return [x + px * c - py * s, y + px * s + py * c]; })); };
  const half = (cx, by, r, k) => pts(Array.from({length: 17}, (_, i) => { const a = Math.PI + i / 16 * Math.PI; return [cx + Math.cos(a) * r, by + Math.sin(a) * r * k]; }));
  Object.assign(FX_SHAPES, {
    // a white dove in flight, wings raised
    greecedove: {d: "M-10.5 2.4C-6.5 0.4 -2 0.2 2 1.2L6 -0.8C8 -1.8 10.2 -1.4 11.2 0.2L8.4 1.4C7.2 3.6 4 5.2 0 5.2C-4.4 5.2 -8.2 4.2 -10.5 2.4Z M-3.4 1.4C-6 -3.6 -4 -9 2.6 -11.4C1.6 -6.4 1.8 -2.4 3 1.2Z M-10.5 2.4L-12 -1.6L-8.6 1.2Z", detail: circ(8.4, -0.2, 0.7), dfill: true},
    // a sprig of bougainvillea
    greecebloom: {d: [-90, 30, 150].map(a => rell(Math.cos(a * Math.PI / 180) * 4.6, Math.sin(a * Math.PI / 180) * 4.6, 5, 3.6, a)).join(""), detail: circ(0, 0, 1.6) + circ(1.2, 1.4, 0.9), dfill: true},
    // a blue dome on its drum
    greecedome: {d: half(0, 4, 8.6, 1.02) + "M-9.4 4H9.4V9.6H-9.4Z M-0.7 -10.6H0.7V-4.2H-0.7Z M-2.6 -8.8H2.6V-7.6H-2.6Z", detail: "M-5.6 9V6.6M0 9V6.6M5.6 9V6.6", dstroke: true}
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
  // a white dove: soft grey-tipped wings, a pink beak
  const DOVE = {body: "#FFFFFF", belly: "#E6EAF2", wing: "#FAFBFD", tip: "#C9D2E0", tipLen: 0.34, tail: "#F2F4F8", beak: [2, 1, 0.3, "#D8A0A0"], hr: 2.2, wl: 1.05, line: "rgba(70,90,130,.42)", halo: "#FFFFFF", bob: 0.8};
  // bougainvillea: three papery magenta bracts around tiny cream flowers
  FX_SHAPES.greecebvg = {d: FX_SHAPES.greecebloom.d, paint: (g, c) => { for (let i = 0; i < 3; i++) { g.save(); g.rotate(i * 2.094 - 1.571); const gr = g.createLinearGradient(0, 0, 10, 0); gr.addColorStop(0, mix(c, "#FFFFFF", 0.3)); gr.addColorStop(1, c); g.fillStyle = gr;
      g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(2, -5.4, 8.6, -5.4, 10, 0); g.bezierCurveTo(8.6, 5.4, 2, 5.4, 0, 0); g.fill(); g.strokeStyle = mix(c, "#000000", 0.25); g.globalAlpha = 0.5; g.lineWidth = 0.35; g.beginPath(); g.moveTo(1, 0); g.lineTo(8.6, 0); g.moveTo(4.4, 0); g.lineTo(6.4, -2.2); g.moveTo(4.4, 0); g.lineTo(6.4, 2.2); g.stroke(); g.restore(); }
    g.fillStyle = "#FFF4D6"; [[0, -1.2], [1.1, 0.6], [-1.1, 0.6]].forEach(([x, y]) => { oval(g, x, y, 0.9, 0.9); g.fill(); }); }};
  // ---- end finish moment sprites ----
  MAJ_THEMES.push({
    skin: {id: "greece", name: "Greece", group: "world", desc: "White cave houses and blue domes on the caldera cliff above the Aegean.",
      light: ["#F1F6FB", "rgba(31,92,170,.10)", "#FFFFFF", "#13253D", "#4C5F77", "#D5E1EE", "#E5EEF7", "#F8FBFE", "#1F5CAA", "#3D7CC6", "#FFFFFF", "#163F7A", "#1B4E92", "#D0E0F4", "#FFE3A0"],
      dark: ["#0C1430", "rgba(242,184,102,.08)", "#141E42", "#EEF2FC", "#AEB8D6", "#2B3868", "#1F2A56", "#111A3A", "#F2B866", "#F6D08E", "#141C3A", "#7A5A34", "#121A3C", "#D4DAF0", "#6A5428"],
      glow: ["linear-gradient(180deg,#8EC9F0,#D8EEFA 45%,#FFF2DC)", "linear-gradient(180deg,#0E1838,#1D2A5A 45%,#6A3E62)"],
      spine: [lg("#2A64AE", "#173F7A"), lg("#1D2A5A", "#0E1838")], btn: [lg2("#1F5CAA", "#3B86C9"), lg2("#F2B866", "#F6D08E")]},
    kit: {motif: "greecedome", card: ["#FAFCFF", "#E4EEF8"], ink: "#13253D", bd: "#BCD2EA", mc: "#2F6DB8", r: 14, notes: ["#D6E6F8", "#FFF3B8", "#D9F0D8", "#FBD3E6", "#FFD9C8", "#EBD9FF"], shape: "rounded", pin: "pin", fab: "999px", btn: "12px"},
    fx: {spawn: (W, H, d, n) => { // doves lift off from the foot of the screen and fan out to both sides in smooth climbing arcs
      flock = Array.from({length: Math.min(11, n(11))}, (_, i) => { const s = i % 2 ? 1 : -1, x0 = 0.5 + s * fxR(0.02, 0.22), r = fxR(-0.1, 0.1); return {P: [[x0, 1.1], [x0 + s * 0.06, 0.72 + r], [x0 + s * 0.32, 0.36 + r], [0.5 + s * fxR(0.85, 1.05), fxR(-0.12, 0.2)]], t0: Math.floor(i * 9 + fxR(0, 8)), T: Math.round(fxR(195, 225)), fr: fxR(0.24, 0.28), ph: fxR(0, 6.3), size: fxR(18, 24)}; });
      return fxFall(W, H, n(40), "greecebvg", d ? ["#E0559E", "#C84A8E", "#F08CC0"] : ["#D42A84", "#E255A2", "#C21C74"], {sway: 1.8, flip: true, smin: 9, smax: 13, vmin: 1, vmax: 1.8})
        .concat(fxTw(W, H, n(20), "sparkle", d ? ["#FFE3A8", "#FFFFFF"] : ["#F2B53A", "#FFFFFF"], {smin: 3, smax: 6, glow: d ? 10 : 6})); },
      len: 300, draw: flockDraw(DOVE, 292)},
    tag: "Oia's white cave houses and blue domes stacked along the caldera cliff, a windmill on the rim, a mule path zig-zagging down to the harbour, bougainvillea and the famous sunset over the deep blue Aegean"
  });
})();
/* end of module 20-scenes-maj-greece.js */


