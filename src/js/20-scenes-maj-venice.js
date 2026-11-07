/* ===== module: 20-scenes-maj-venice.js ===== */
/* Around the World */
(() => {
  const lg = (a, b) => `linear-gradient(180deg,${a},${b})`, lg2 = (a, b) => `linear-gradient(135deg,${a},${b})`;
  const r1 = n => Math.round(n * 100) / 100;
  const pts = a => "M" + a.map(p => `${r1(p[0])} ${r1(p[1])}`).join("L") + "Z";
  const ell = (x, y, rx, ry) => `M${r1(x - rx)} ${r1(y)}a${r1(rx)} ${r1(ry)} 0 1 0 ${r1(2 * rx)} 0a${r1(rx)} ${r1(ry)} 0 1 0 ${r1(-2 * rx)} 0Z`;
  Object.assign(FX_SHAPES, {
    // a gondola in profile
    venicegondola: {d: "M-12.6 -3.6Q-12.8 -1.4 -11.4 0.6Q-6 3.6 4 3.2Q9 2.8 10.6 -0.6L11.4 -4.6L12.6 -5L12.4 -6.6L10.6 -6.2L10 -2.2Q9 -0.2 6.6 0.2Q-1 1.2 -8.6 -0.4Q-11 -1.2 -11.6 -3.6Z",
      detail: "M10.8 -5.4H12.4M11 -4.4H12.2M11.1 -3.4H12M-4 0.6Q0 1.2 4 0.8", dstroke: true},
    // a carnival half-mask, the eyes cut out, a curl at each side
    venicemask: {d: "M-11 -2.6Q-11.6 -7 -6.4 -6.4Q-2.4 -5.8 0 -3.6Q2.4 -5.8 6.4 -6.4Q11.6 -7 11 -2.6Q10.6 2.8 6 3.6Q2.4 4.2 0 1.4Q-2.4 4.2 -6 3.6Q-10.6 2.8 -11 -2.6Z" + ell(-5.2, -1.6, 2.6, 1.6) + ell(5.2, -1.6, 2.6, 1.6),
      detail: "M-11 -2.6Q-13 -6 -10.6 -8.6M11 -2.6Q13 -6 10.6 -8.6M-1.6 -4.6Q0 -6.4 1.6 -4.6", dstroke: true},
    // a pigeon in flight (its flap squeezes it sideways, like wingbeats)
    venicepigeon: {d: ell(0, 1, 5, 2.8) + ell(5.4, -0.6, 2.2, 2) + pts([[-4.6, 0], [-10.6, -1.4], [-10.4, 2.4], [-4, 2.6]]) + pts([[-1.6, -0.6], [-7, -9.4], [-2.6, -8.6], [2.4, -0.8]]) + pts([[7.2, -0.8], [9.4, -0.2], [7.2, 0.4]]),
      detail: "M-4.6 -5L-0.6 -1.6M-2.6 -7L0.6 -2.2", dstroke: true},
    // a feather drifting down
    venicefeather: {d: "M0 -10Q5 -6 4.4 1Q3.6 6 0.6 9.4L-0.6 9.4Q-3.6 6 -4.4 1Q-5 -6 0 -10Z", detail: "M0 -8.6V11M0 -4L3 -6M0 0L3.4 -2M0 4L2.8 2.2M0 -2L-3 -4M0 2L-3.2 0", dstroke: true},
    // a little pennant
    veniceflag: {d: "M-6 -4H6Q7 0 6 4H-6Q-5 0 -6 -4Z"},
    // a stone Gothic window, its ogee point on top
    venicearch: {d: "M-5 10V-1Q-5 -5 -2.6 -7.4Q-0.8 -9 0 -11Q0.8 -9 2.6 -7.4Q5 -5 5 -1V10Z", detail: "M-3 9V-0.6Q-3 -3.8 -1.2 -5.8Q-0.4 -6.8 0 -8Q0.4 -6.8 1.2 -5.8Q3 -3.8 3 -0.6V9Z", dfill: true}
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
  // a Venetian rock pigeon: blue-grey with dark wingtips, a green-violet sheen at the neck and an orange eye
  const PIGEON = {body: "#8E96A8", belly: "#AEB4C2", wing: "#A6ADBC", tip: "#4A505E", tipLen: 0.36, tail: "#6A7284", head: "#7A8296", bib: "#6E9C92", beak: [1.8, 0.9, 0.3, "#3A3438"], eye: "#E07A2A", hr: 2.1, wl: 0.95, line: "rgba(40,44,60,.4)", halo: "#E8ECF6", bob: 0.9};
  // a soft grey feather with its quill
  FX_SHAPES.venicefthr = {d: FX_SHAPES.venicefeather.d, paint: (g, c) => { const p = new Path2D("M0 -10Q5 -6 4.4 1Q3.6 6 0.6 9.4L-0.6 9.4Q-3.6 6 -4.4 1Q-5 -6 0 -10Z"), gr = g.createLinearGradient(-4, 0, 4, 0); gr.addColorStop(0, mix(c, "#FFFFFF", 0.4)); gr.addColorStop(0.5, c); gr.addColorStop(1, mix(c, "#000000", 0.15)); g.fillStyle = gr; g.fill(p);
    g.strokeStyle = "rgba(255,255,255,.55)"; g.lineWidth = 0.3; g.beginPath(); for (let y = -7; y < 7; y += 1.6) { g.moveTo(0, y); g.lineTo(3.6, y - 2); g.moveTo(0, y + 0.8); g.lineTo(-3.6, y - 1.2); } g.stroke(); g.strokeStyle = mix(c, "#000000", 0.35); g.lineWidth = 0.5; g.beginPath(); g.moveTo(0, -8.8); g.lineTo(0, 11.4); g.stroke(); }};
  // ---- end finish moment sprites ----
  MAJ_THEMES.push({
    skin: {id: "venice", name: "Venice", group: "world", desc: "Gondolas glide past old palazzos under an Italian flag.",
      light: ["#F6F0E6", "rgba(46,110,104,.10)", "#FFFFFF", "#22302F", "#5C6866", "#E6DCCD", "#F0E8DC", "#FCF9F4", "#A84A32", "#C26A4C", "#FFFFFF", "#6A2A1C", "#2C5E5A", "#D2E8E4", "#FFE2A6"],
      dark: ["#0E1432", "rgba(242,200,120,.08)", "#181E42", "#F4F0FA", "#B8B4D6", "#2E3464", "#242A58", "#151A3A", "#F2C878", "#F6DA9E", "#161A3A", "#7A6232", "#121834", "#D6D4EE", "#6A5428"],
      glow: ["linear-gradient(180deg,#A8D2EE,#F2ECDD 50%,#F6D3B0)", "linear-gradient(180deg,#0E1636,#22285A 50%,#5A3A62)"],
      spine: [lg("#357A74", "#22504C"), lg("#262C60", "#121834")], btn: [lg2("#A84A32", "#C9784C"), lg2("#F2C878", "#F6DA9E")]},
    kit: {motif: "venicegondola", card: ["#FFFCF6", "#F2E9DC"], ink: "#22302F", bd: "#E4D4BE", mc: "#A84A32", r: 14, notes: ["#F7D8CC", "#FFF1B8", "#D4ECE6", "#D6E4FA", "#EADCF8", "#FFE0C4"], shape: "scallop", pin: "gold", fab: "999px", btn: "12px"},
    fx: {spawn: (W, H, d, n) => { // pigeons burst up off the piazza, each climbing away on its own curve, quick wingbeats
      flock = Array.from({length: Math.min(12, n(12))}, (_, i) => { const s = i % 2 ? 1 : -1, x0 = fxR(0.1, 0.9), r = fxR(-0.1, 0.1); return {P: [[x0, 1.08], [x0 + s * 0.04, 0.7 + r], [x0 + s * 0.3, 0.4 + r], [x0 + s * fxR(0.85, 1.1), fxR(-0.25, 0.1)]], t0: Math.floor(i * 8 + fxR(0, 16)), T: Math.round(fxR(170, 210)), fr: fxR(0.34, 0.4), ph: fxR(0, 6.3), size: fxR(16, 21)}; });
      return fxFall(W, H, n(16), "venicefthr", d ? ["#D6D8E8", "#B8BCD0"] : ["#C4C9D4", "#A8AEBC", "#E0E3EA"], {sway: 1.6, smin: 9, smax: 13, vmin: 0.6, vmax: 1.1, rock: 0.7}).map(p => Object.assign(p, {delay: p.delay + 30}))
        .concat(fxTw(W, H, n(30), "sparkle", d ? ["#FFFFFF", "#FFF0C8", "#FFE0A0"] : ["#E2B048", "#F2C46A", "#FFFFFF"], {top: 0.9, smin: 3, smax: 7, glow: d ? 12 : 6})); },
      len: 300, draw: flockDraw(PIGEON, 292)},
    tag: "Straight across a Venetian canal: faded palazzos with Gothic windows, a bridge over a side canal, gondolas gliding by, the campanile and an Italian flag"
  });
})();
/* end of module 20-scenes-maj-venice.js */


