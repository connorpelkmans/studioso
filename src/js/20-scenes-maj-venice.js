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
  birdShapes("venicepg", {body: "#8E96A8", belly: "#B8BECC", wing: "#A6ADBC", tip: "#4A505E", bars: "#4E5464", tail: "#6A7284", head: "#7A8296", bib: "#6E9C92", beak: [1.8, 0.9, 0.3, "#3A3438"], eye: "#E07A2A", hr: 2.1, line: "rgba(40,44,60,.4)"});
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
    fx: {spawn: (W, H, d, n) => { flock = Array.from({length: n(12)}, (_, i) => { const s = i % 2 ? 1 : -1; return {x: fxR(0.15, 0.85) * W, y: H + fxR(10, 50), vx: s * Math.min(3.4, W / fxR(200, 380)), vy: -fxR(2.4, 3.4), ay: 0.009, t0: Math.floor(fxR(0, 60)), life: 240, fr: fxR(0.32, 0.4), ph: fxR(0, 6.3), size: fxR(17, 23), c: "#8E96A8"}; });
      return fxFall(W, H, n(16), "venicefthr", d ? ["#D6D8E8", "#B8BCD0"] : ["#C4C9D4", "#A8AEBC", "#E0E3EA"], {sway: 1.6, smin: 9, smax: 13, vmin: 0.6, vmax: 1.1, rock: 0.7}).map(p => Object.assign(p, {delay: p.delay + 30}))
        .concat(fxTw(W, H, n(30), "sparkle", d ? ["#FFFFFF", "#FFF0C8", "#FFE0A0"] : ["#E2B048", "#F2C46A", "#FFFFFF"], {top: 0.9, smin: 3, smax: 7, glow: d ? 12 : 6})); },
      draw: flockDraw("venicepg")},
    tag: "Straight across a Venetian canal: faded palazzos with Gothic windows, a bridge over a side canal, gondolas gliding by, the campanile and an Italian flag"
  });
})();
/* end of module 20-scenes-maj-venice.js */


