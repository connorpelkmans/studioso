/* ===== module: 20-scenes-maj-brazil.js ===== */
/* Around the World */
(() => {
  const lg = (a, b) => `linear-gradient(180deg,${a},${b})`, lg2 = (a, b) => `linear-gradient(135deg,${a},${b})`;
  const r1 = n => Math.round(n * 100) / 100;
  const circ = (x, y, r) => `M${r1(x - r)} ${r1(y)}a${r1(r)} ${r1(r)} 0 1 0 ${r1(2 * r)} 0a${r1(r)} ${r1(r)} 0 1 0 ${r1(-2 * r)} 0Z`;
  const NOTES = ["#FFF3B8", "#D9F0D8", "#D6E6FF", "#FFD9C8", "#EBD9FF"];
  // a monstera leaf
  const monstera = () => { const L = [], R = []; for (let i = 0; i <= 20; i++) { const t = i / 20, w = 10.4 * Math.pow(Math.sin(Math.PI * Math.pow(t, 0.7)), 0.85) * (1 - 0.12 * t), y = 10.6 - t * 21.2, cut = i > 3 && i < 18 && i % 4 === 1;
    L.push(`${r1(-w * (cut ? 0.22 : 1))} ${r1(y)}`); R.unshift(`${r1(w * (i > 3 && i < 18 && i % 4 === 3 ? 0.22 : 1))} ${r1(y)}`); } return `M${L.join("L")}L${R.join("L")}Z`; };
  Object.assign(FX_SHAPES, {
    brazilmonstera: {d: monstera(), detail: "M0 10.6L0 -9", dstroke: true},
    // Sugarloaf and Morro da Urca with the cable car's wire and a car on it
    brazilloaf: {d: "M-12 9C-12 4 -10 2 -8 1C-6 -1 -2 -1 -1 1L1 2C2 -4 3 -9 6 -10.4C9 -11 10 -6 10.6 -1C11 3 12 6 12.6 9Z", detail: "M-4 -1.6L5.4 -9.4 M1.2 -6.6V-4.6 M-0.4 -4.6H2.8V-2.6H-0.4Z", dstroke: true},
    // a toco toucan's head and its great orange beak
    braziltoucan: {d: "M-10 6C-12 -2 -8 -8 -2 -8C1 -8 3 -7 4 -6C8 -7 12 -6 12.6 -3C12.8 -1.6 12 -1 11 -1.4C8 -2 6 -1.6 4 -1C3 4 0 9 -4 10C-7 10.6 -9 9 -10 6Z", detail: circ(-1.6, -3.6, 2) + "M4 -6C8 -7 12 -6 12.6 -3C12.8 -1.6 12 -1 11 -1.4C8 -2 6 -1.6 4 -1Z", dfill: true},
    // a coconut with a straw and a little cocktail umbrella
    braziloco: {d: circ(0, 3, 8.4), detail: "M2 -4L6 -11 M-6 -6L1 -9.4L-3 -12Z", dstroke: true},
    // a piece of samba confetti
    brazilconf: {d: "M-5 -2.6H5V2.6H-5Z"}
  });

  // ---- finish moment sprites ----
  const mix = (a, b, t) => "#" + [1, 3, 5].map(i => { const u = parseInt(a.substr(i, 2), 16); return Math.round(u + (parseInt(b.substr(i, 2), 16) - u) * t).toString(16).padStart(2, "0"); }).join("");
  const oval = (g, x, y, rx, ry, r = 0) => { g.beginPath(); g.ellipse(x, y, rx, ry, r, 0, 6.3); };
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
  // a toco toucan: black with a cream bib, red under the tail, a blue eye ring and the great orange bill; it beats and glides
  const TOUCAN = {body: "#1A1A22", belly: "#14141A", wing: "#26262E", tip: "#121218", tail: "#1A1A22", under: "#E8302A", bib: "#FFF2C8", head: "#1A1A22", hr: 2.6, beak: [8.2, 3.4, 0.8, "#F7931E", "#1A1A22"], ring: "#5AB0F0", eye: "#101010", bill: true, wl: 0.88, chord: 1.1, line: "rgba(255,255,255,.22)", halo: "#FFE6A6", haloA: 0.28, glide: 0.035, bob: 1.1};
  // ---- end finish moment sprites ----
  MAJ_THEMES.push({
    skin: {id: "brazil", name: "Brazil", group: "world", desc: "Christ the Redeemer, a colourful favela and Sugarloaf over a golden beach.",
      light: ["#F5FAF5", "rgba(19,128,78,.10)", "#FFFFFF", "#163026", "#4C6A5C", "#D2E6D8", "#E4F2E8", "#FAFDFA", "#13804E", "#2FA06A", "#FFFFFF", "#0C5A36", "#11603E", "#CDEBD8", "#FFE3A0"],
      dark: ["#0E1534", "rgba(255,210,74,.08)", "#17204A", "#F2F2FA", "#B4B8D6", "#2C3870", "#222C5E", "#121A3E", "#FFD24A", "#FFE08A", "#0C1838", "#7A6232", "#0C1838", "#D6D4EE", "#6A5428"],
      glow: ["linear-gradient(180deg,#7CC6F0,#D4EEF8 45%,#FCE8C4)", "linear-gradient(180deg,#0C1838,#1E2C5E 45%,#6A3A5E)"],
      spine: [lg("#1E8A5A", "#11603E"), lg("#1E2C5E", "#0C1838")], btn: [lg2("#13804E", "#E8A21E"), lg2("#FFD24A", "#7FE0A0")]},
    kit: {motif: "brazilmonstera", card: ["#FBFEF9", "#E8F6EA"], ink: "#163026", bd: "#BFE0C8", mc: "#E8A21E", r: 16, notes: ["#FFE9A8"].concat(NOTES), shape: "rounded", pin: "starpin", fab: "999px", btn: "14px"},
    fx: {spawn: (W, H, d, n) => { // toucans cross the screen in long undulating swoops, beating then gliding, alternate ways (above and below the middle)
      const k = Math.min(4, n(4)); flock = Array.from({length: k}, (_, i) => { const y = [0.15, 0.64, 0.27, 0.76][i] + fxR(-0.03, 0.03), P = [[-0.14, y], [0.3, y - 0.07], [0.7, y + 0.07], [1.14, y - 0.03]]; return {P: i % 2 ? P.map(([x, yy]) => [1 - x, yy]) : P, t0: Math.floor(i * 20 + fxR(0, 8)), T: Math.round(fxR(200, 220)), fr: fxR(0.24, 0.28), ph: fxR(0, 6.3), size: fxR(23, 28)}; });
      return fxFall(W, H, n(40), "brazilconf", d ? ["#4ADE7A", "#FFD24A", "#5A9AF0", "#FF7AB4", "#FFA24A", "#B07AF0"] : ["#1FA34A", "#FFC81E", "#2A6FD6", "#FF5FA2", "#FF8A2A", "#9A4FD6"], {sway: 2, flip: true, smin: 9, smax: 12, vmin: 1.4, vmax: 2.6})
        .concat(fxBurst(W, H, n(10), "brazilmonstera", d ? ["#3A9A5A", "#5ABA6A"] : ["#2E8A3E", "#4EAA48"], [[0.08, 1.02], [0.92, 1.02]], {smin: 13, smax: 18}).map(p => Object.assign(p, {vx: p.vx * 0.7, vy: p.vy * 0.8, g: 0.15, term: fxR(1.6, 2.2), vr: fxR(-0.05, 0.05), life: 280})),
          fxTw(W, H, n(18), "sparkle", d ? ["#FFE6A6", "#FFFFFF"] : ["#FFC81E", "#FFFFFF"], {smin: 3, smax: 7, glow: d ? 10 : 6})); },
      len: 300, draw: flockDraw(TOUCAN, 292)},
    tag: "Christ the Redeemer on Corcovado above a dense hillside favela of bright little houses and the towers of downtown, Sugarloaf and its glass bondinho cable cars over the bay, and a golden beach with umbrellas, towels, a coconut kiosk, palms, the waving Brazilian flag and a toucan in the rainforest"
  });
})();
/* end of module 20-scenes-maj-brazil.js */


