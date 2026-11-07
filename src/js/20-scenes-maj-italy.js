/* ===== module: 20-scenes-maj-italy.js ===== */
/* Around the World */
(() => {
  const lg = (a, b) => `linear-gradient(180deg,${a},${b})`, lg2 = (a, b) => `linear-gradient(135deg,${a},${b})`;
  const r1 = n => Math.round(n * 100) / 100;
  const circ = (x, y, r) => `M${r1(x - r)} ${r1(y)}a${r1(r)} ${r1(r)} 0 1 0 ${r1(2 * r)} 0a${r1(r)} ${r1(r)} 0 1 0 ${r1(-2 * r)} 0Z`;
  const ell = (x, y, rx, ry) => `M${r1(x - rx)} ${r1(y)}a${r1(rx)} ${r1(ry)} 0 1 0 ${r1(2 * rx)} 0a${r1(rx)} ${r1(ry)} 0 1 0 ${r1(-2 * rx)} 0Z`;
  const NOTES = ["#FFF3B8", "#D9F0D8", "#D6E6FF", "#FFD9C8", "#EBD9FF"];
  Object.assign(FX_SHAPES, {
    // an Amalfi lemon
    italylemon: {d: "M-10 1C-10 -4 -5 -7.4 0 -7.4C5 -7.4 10 -4 10 1C10 5 5 7.4 0 7.4C-5 7.4 -10 5 -10 1Z M-10 1L-12 0.2L-10.4 -0.6Z M10 1L12 0.2L10.4 -0.6Z M1 -7.2C3 -11 7 -12 10 -11C8 -8 4 -7 1 -7.2Z", detail: "M-5 -3.4Q-2 -5.4 2 -5", dstroke: true},
    // lemon blossom
    italyblossom: {d: [0, 1, 2, 3, 4].map(i => { const a = -Math.PI / 2 + i / 5 * Math.PI * 2; return circ(Math.cos(a) * 5.4, Math.sin(a) * 5.4, 4.6); }).join("") + circ(0, 0, 4), detail: circ(0, 0, 2.2), dfill: true},
    // a striped beach umbrella
    italyumb: {d: "M-11 -1C-10 -8 -4 -10.5 0 -10.5C4 -10.5 10 -8 11 -1Z M-0.8 -1H0.8V10H-0.8Z", detail: "M0 -10.5L-6 -1M0 -10.5L6 -1M0 -10.5V-1", dstroke: true},
    // a little sailboat
    italysail: {d: "M0.6 -11L9 4H0.6Z M-1 -8L-8.6 4H-1Z M-11 5.6H11L7.6 10.4H-7.6Z"},
    // a majolica tile
    italytile: {d: "M-9 -9H9V9H-9Z", detail: "M0 -7L2 -2L7 0L2 2L0 7L-2 2L-7 0L-2 -2Z" + circ(0, 0, 1.4), dfill: true}
  });

  // ---- finish moment sprites ----
  const mix = (a, b, t) => "#" + [1, 3, 5].map(i => { const u = parseInt(a.substr(i, 2), 16); return Math.round(u + (parseInt(b.substr(i, 2), 16) - u) * t).toString(16).padStart(2, "0"); }).join("");
  const oval = (g, x, y, rx, ry, r = 0) => { g.beginPath(); g.ellipse(x, y, rx, ry, r, 0, 6.3); };
  const sheen = (g, a = 0.32, b = 0.22) => { g.save(); g.globalCompositeOperation = "source-atop"; const gr = g.createLinearGradient(-8, -10, 8, 10); gr.addColorStop(0, `rgba(255,255,255,${a})`); gr.addColorStop(0.45, "rgba(255,255,255,0)"); gr.addColorStop(1, `rgba(0,0,0,${b})`); g.fillStyle = gr; g.fillRect(-13, -13, 26, 26); g.restore(); };
  const LEMON = "M-9.6 2C-9.6 -3 -4.8 -6.4 0 -6.4C4.8 -6.4 9.6 -3 9.6 2C9.6 5.6 4.8 7.6 0 7.6C-4.8 7.6 -9.6 5.6 -9.6 2Z M-9.6 2L-11.6 1.2L-9.8 0.4Z M9.6 2L11.6 1.2L9.8 0.4Z";
  Object.assign(FX_SHAPES, {
    // an Amalfi lemon with its glossy leaf
    italylem: {d: LEMON + "M0.6 -6C2 -10.4 6.4 -12 10.4 -10.6C8.6 -7 4.4 -5.6 0.6 -6Z", paint: (g, c) => { const p = new Path2D(LEMON), gr = g.createRadialGradient(-3, -2, 1, 0, 1, 11); gr.addColorStop(0, mix(c, "#FFFFFF", 0.45)); gr.addColorStop(0.6, c); gr.addColorStop(1, mix(c, "#B07800", 0.4)); g.fillStyle = gr; g.fill(p);
      g.save(); g.clip(p); g.fillStyle = "rgba(170,120,0,.18)"; for (let i = 0; i < 26; i++) { oval(g, Math.sin(i * 7.3) * 8, 1 + Math.cos(i * 3.1) * 5.4, 0.35, 0.35); g.fill(); } g.restore(); g.fillStyle = "rgba(255,255,255,.55)"; oval(g, -4, -2.8, 2.6, 1.1, -0.4); g.fill();
      const lf = new Path2D("M0.6 -6C2 -10.4 6.4 -12 10.4 -10.6C8.6 -7 4.4 -5.6 0.6 -6Z"); g.fillStyle = "#3E8A3A"; g.fill(lf); g.fillStyle = "#5EA84A"; g.save(); g.clip(lf); g.fillRect(-1, -13, 13, 4.6); g.restore(); g.strokeStyle = "rgba(220,240,200,.6)"; g.lineWidth = 0.35; g.beginPath(); g.moveTo(1, -6.2); g.quadraticCurveTo(5, -9.4, 10, -10.5); g.stroke(); }},
    // a lemon blossom: five white petals around golden stamens
    italyflower: {d: [0, 1, 2, 3, 4].map(i => { const a = -Math.PI / 2 + i / 5 * Math.PI * 2; return circ(Math.cos(a) * 5.4, Math.sin(a) * 5.4, 4.6); }).join(""), paint: (g, c, d) => { for (let i = 0; i < 5; i++) { g.save(); g.rotate(i / 5 * 6.283); g.fillStyle = c; g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(-4.6, -3, -3.4, -10.4, 0, -10.6); g.bezierCurveTo(3.4, -10.4, 4.6, -3, 0, 0); g.fill(); g.strokeStyle = d ? "rgba(200,200,230,.5)" : "rgba(190,170,150,.6)"; g.lineWidth = 0.35; g.stroke(); g.restore(); }
      sheen(g, 0.2, 0.18); g.strokeStyle = "#E8B83A"; g.lineWidth = 0.4; g.beginPath(); for (let i = 0; i < 9; i++) { const a = i * 0.7; g.moveTo(0, 0); g.lineTo(Math.cos(a) * 3.2, Math.sin(a) * 3.2); } g.stroke(); g.fillStyle = "#F2C53A"; for (let i = 0; i < 9; i++) { const a = i * 0.7; oval(g, Math.cos(a) * 3.3, Math.sin(a) * 3.3, 0.5, 0.5); g.fill(); } g.fillStyle = "#9CC24A"; oval(g, 0, 0, 1.2, 1.2); g.fill(); }}
  });

  // a pizza toss: a disc of dough spins up from the bottom, stretching as it twirls (an ellipse turning in 3D, shedding
  // flour), lands, then gets sauce, mozzarella, basil and a drizzle of oil and bakes into a blistered, steaming margherita.
  const ez = t => t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t), lerpC = (a, b, t) => mix(a, b, Math.max(0, Math.min(1, t))), IMG = {};
  const puffImg = rgb => IMG[rgb] || (IMG[rgb] = (() => { const c = document.createElement("canvas"); c.width = c.height = 48; const p = c.getContext("2d"), gr = p.createRadialGradient(24, 24, 0, 24, 24, 24);
    gr.addColorStop(0, `rgba(${rgb},1)`); gr.addColorStop(0.5, `rgba(${rgb},.5)`); gr.addColorStop(1, `rgba(${rgb},0)`); p.fillStyle = gr; p.fillRect(0, 0, 48, 48); return c; })());
  const TOSS = 96, LAND = TOSS + 4;
  let PZ = null;
  const pzBuild = (W, H) => { const ph = W < H, R = Math.min(W * (ph ? 0.22 : 0.21), H * 0.145), cx = W / 2, cy = (ph ? H * 0.635 : H * 0.565) + R * 1.06; let sd = 5; const rnd = () => (sd = sd * 16807 % 2147483647) / 2147483647, pol = (r, a) => [Math.cos(a) * r, Math.sin(a) * r];
    const y0 = H + R * 0.9, yp = H * (ph ? 0.46 : 0.4), q = Math.sqrt((cy - yp) / (y0 - yp)), tp = TOSS / (1 + q), k = (y0 - yp) / (tp * tp);
    const cheese = Array.from({length: 7}, (_, i) => { const a = i * 0.898 * 1 + rnd() * 0.5, r = i ? 0.3 + rnd() * 0.32 : 0.04; return {p: pol(r, a), r: 0.13 + rnd() * 0.05, t: 134 + i * 5 + rnd() * 3, n: Array.from({length: 10}, () => 0.82 + rnd() * 0.3), sp: [pol(rnd() * 0.5, rnd() * 6.3), pol(rnd() * 0.6, rnd() * 6.3)]}; });
    const basil = Array.from({length: 5}, (_, i) => { const a = i * 1.2566 + 0.6 + rnd() * 0.4, r = 0.26 + rnd() * 0.3; return {p: pol(r, a), rot: a + 1.2 + rnd(), sz: 0.13 + rnd() * 0.04, t: 164 + i * 6}; });
    const spots = Array.from({length: 26}, () => { const a = rnd() * 6.3, r = 0.88 + rnd() * 0.09; return {p: pol(r, a), r: 0.012 + rnd() * 0.028, a}; });
    const flour = Array.from({length: 22}, (_, i) => ({p: pol(Math.sqrt(rnd()) * 0.8, rnd() * 6.3), r: i < 4 ? 0.12 + rnd() * 0.08 : 0.015 + rnd() * 0.03}));
    // flour dust: shed from the rim while it flies, a puff at the launch and a ring when it lands
    const dust = Array.from({length: 40}, (_, i) => ({t: 8 + i * 2.2, th: rnd() * 6.3, v: 0.3 + rnd() * 0.6, life: 40 + rnd() * 30, r: 3 + rnd() * 5})).concat(
      Array.from({length: 16}, (_, i) => ({t: LAND, th: i * 0.393 + rnd() * 0.3, v: 0.9 + rnd() * 0.9, life: 50 + rnd() * 30, r: 5 + rnd() * 7, ring: true})));
    return {R, cx, cy, ph, y: u => u <= TOSS ? yp + k * (u - tp) * (u - tp) : cy, cheese, basil, spots, flour, dust}; };
  // where the disc is and how it is turned at frame f
  const pzPose = f => { const u = f - 4, e = ez((u - TOSS * 0.5) / (TOSS * 0.5)), fl = Math.max(0, Math.min(u, TOSS)), v = u - TOSS, sq = v > 0 ? 0.07 * Math.sin(Math.min(1, v / 16) * Math.PI) : 0, th = (1 - e) * (1.2 + 0.46 * Math.sin(fl * 0.11));
    return {x: PZ.cx, y: PZ.y(Math.max(0, u)), s: 0.52 + 0.48 * ez(fl / (TOSS * 0.85)), cs: Math.max(0.07, Math.cos(th)) - sq, sn: Math.sin(th), rx: 1 + sq * 0.5, ang: 0.3 * Math.sin(fl * 0.06) * (1 - e), spin: 0.34 * fl - 0.1 * fl * fl / TOSS}; };
  const pzDraw = (g, f, W, H, d) => { if (!PZ || f < 2) return; const {R, cx, cy} = PZ, P = pzPose(f), bake = ez((f - 150) / 60), rr = R * P.s;
    // a soft shadow (a warm glow at night) where the pizza will land, darker as it comes down
    const near = ez((f - 4 - TOSS * 0.45) / (TOSS * 0.55)), sa = (d ? 0.14 : 0.16) * near;
    if (sa > 0.005) { g.save(); g.translate(cx, cy + R * 0.1); g.scale(1, 0.82); const gr = g.createRadialGradient(0, 0, 0, 0, 0, R * 1.08); const c = d ? "255,170,90" : "90,60,30"; gr.addColorStop(0, `rgba(${c},${sa})`); gr.addColorStop(0.7, `rgba(${c},${sa * 0.6})`); gr.addColorStop(1, `rgba(${c},0)`); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, R * 1.08, 0, 6.3); g.fill(); g.restore(); }
    g.save(); g.translate(P.x, P.y); g.rotate(P.ang);
    // the edge of the dough, seen when it is tilted
    const th = rr * 0.09 * Math.abs(P.sn) + rr * 0.025; g.fillStyle = lerpC("#D9B47A", "#B87434", bake); g.beginPath(); g.ellipse(0, th, rr * P.rx, rr * P.cs, 0, 0, 6.3); g.fill();
    g.scale(rr * P.rx, rr * P.cs); const crust = lerpC("#EED39C", "#DE9C4E", bake); g.fillStyle = crust; g.beginPath(); g.arc(0, 0, 1, 0, 6.3); g.fill();
    const gi = g.createRadialGradient(-0.2, -0.25, 0, 0, 0, 0.9); gi.addColorStop(0, "#FAEBCB"); gi.addColorStop(1, lerpC("#F0D6A4", "#E8C084", bake)); g.fillStyle = gi; g.beginPath(); g.arc(0, 0, 0.86, 0, 6.3); g.fill();
    g.save(); g.rotate(P.spin);
    // flour on the dough turns with it; it fades as the sauce goes on
    const fa = 1 - ez((f - 106) / 30); if (fa > 0) { for (const q of PZ.flour) { g.fillStyle = `rgba(255,255,255,${(q.r > 0.1 ? 0.28 : 0.7) * fa})`; g.beginPath(); g.arc(q.p[0], q.p[1], q.r, 0, 6.3); g.fill(); } }
    // the rim: blistered, with leopard spots once baked
    g.strokeStyle = lerpC("#E2BE84", "#C98238", bake); g.lineWidth = 0.035; g.beginPath(); g.arc(0, 0, 0.86, 0, 6.3); g.stroke();
    if (bake > 0) { for (const q of PZ.spots) { g.fillStyle = `rgba(${q.r > 0.03 ? "92,46,20" : "70,34,16"},${0.75 * ez((f - 150 - q.a * 6) / 30)})`; g.beginPath(); g.ellipse(q.p[0], q.p[1], q.r * 1.4, q.r, q.a, 0, 6.3); g.fill(); } }
    g.restore();
    if (f > LAND + 6) { const sp = ez((f - LAND - 8) / 30), rs = 0.79 * (0.15 + 0.85 * sp);
      // tomato sauce spreading in a swirl from the middle
      g.save(); g.rotate(-(1 - sp) * 2.4); g.beginPath(); for (let i = 0; i <= 48; i++) { const a = i / 48 * 6.283, r = rs * (1 + 0.035 * Math.sin(5 * a + 1) + 0.025 * Math.sin(11 * a + 2)); i ? g.lineTo(Math.cos(a) * r, Math.sin(a) * r) : g.moveTo(r, 0); } g.closePath();
      const gs = g.createRadialGradient(-0.15, -0.2, 0, 0, 0, rs); gs.addColorStop(0, lerpC("#E8553A", "#D84428", bake)); gs.addColorStop(1, lerpC("#C2361F", "#A82C18", bake)); g.fillStyle = gs; g.fill();
      if (sp < 1) { g.strokeStyle = `rgba(255,150,120,${0.35 * (1 - sp)})`; g.lineWidth = 0.025; g.beginPath(); for (let i = 0; i < 40; i++) { const u = i / 40, a = u * 9, r = rs * u * 0.9; i ? g.lineTo(Math.cos(a) * r, Math.sin(a) * r) : g.moveTo(0, 0); } g.stroke(); } g.restore();
      // mozzarella drops on and melts
      for (const b of PZ.cheese) { const k = ez((f - b.t) / 11); if (k <= 0) continue; const m = (1.5 - 0.5 * k) * (1 + 0.16 * ez((f - b.t - 8) / 40)), r = b.r * m; g.globalAlpha = k; g.save(); g.translate(b.p[0], b.p[1] - (1 - k) * 0.25);
        const pt = i => { const v = b.n[i % 10], a = i / 10 * 6.283; return [Math.cos(a) * r * v, Math.sin(a) * r * v]; }; g.beginPath(); for (let i = 0; i <= 10; i++) { const [x0, y0] = pt(i), [x1, y1] = pt(i + 1), mx = (x0 + x1) / 2, my = (y0 + y1) / 2; i ? g.quadraticCurveTo(x0, y0, mx, my) : g.moveTo(mx, my); } g.closePath(); g.fillStyle = "#FFF9EC"; g.fill(); g.strokeStyle = "rgba(226,196,140,.9)"; g.lineWidth = 0.014; g.stroke();
        g.fillStyle = "rgba(255,255,255,.8)"; g.beginPath(); g.ellipse(-r * 0.3, -r * 0.3, r * 0.3, r * 0.18, -0.5, 0, 6.3); g.fill();
        if (bake > 0) { g.fillStyle = `rgba(212,150,64,${0.55 * bake})`; for (const q of b.sp) { g.beginPath(); g.arc(q[0] * r, q[1] * r, r * 0.16, 0, 6.3); g.fill(); } } g.restore(); }
      g.globalAlpha = 1;
      // basil leaves flutter down and settle
      for (const b of PZ.basil) { const k = ez((f - b.t) / 14); if (k <= 0) continue; const z = b.sz * (1.4 - 0.4 * k); g.globalAlpha = k; g.save(); g.translate(b.p[0], b.p[1] - (1 - k) * 0.3); g.rotate(b.rot + (1 - k) * 1.6); g.scale(z * (0.3 + 0.7 * Math.abs(Math.cos((1 - k) * 3))), z);
        const lf = new Path2D("M0 -1C0.62 -0.62 0.6 0.5 0 1C-0.6 0.5 -0.62 -0.62 0 -1Z"); g.fillStyle = "#2E8A3A"; g.fill(lf); g.save(); g.clip(lf); g.fillStyle = "#45A84E"; g.fillRect(-1, -1, 1, 2); g.restore();
        g.strokeStyle = "rgba(190,230,170,.75)"; g.lineWidth = 0.07; g.beginPath(); g.moveTo(0, 0.95); g.lineTo(0, -0.8); g.stroke(); g.fillStyle = "rgba(255,255,255,.3)"; g.beginPath(); g.ellipse(-0.22, -0.3, 0.12, 0.35, 0.2, 0, 6.3); g.fill(); g.restore(); }
      g.globalAlpha = 1;
      // a drizzle of olive oil
      const op = ez((f - 192) / 22); if (op > 0) { const m = Math.max(2, Math.round(op * 70)); g.lineCap = g.lineJoin = "round"; [["rgba(236,180,40,.42)", 0.024], ["rgba(255,250,215,.5)", 0.008]].forEach(([c, w]) => { g.strokeStyle = c; g.lineWidth = w; g.beginPath();
        for (let i = 0; i < m; i++) { const u = i / 70, a = u * 7 + 0.4 + 0.25 * Math.sin(u * 17), r = 0.1 + 0.55 * u + 0.05 * Math.sin(u * 29); i ? g.lineTo(Math.cos(a) * r, Math.sin(a) * r) : g.moveTo(Math.cos(a) * r, Math.sin(a) * r); } g.stroke(); }); }
    }
    g.restore();
    // flour dust off the rim, a puff at the launch and a ring when it lands
    const pf = puffImg(d ? "255,252,244" : "255,255,255");
    for (const q of PZ.dust) { const a = f - q.t; if (a < 0 || a > q.life) continue; const Q = q.ring ? pzPose(LAND) : pzPose(q.t), ox = Math.cos(q.th) * R * Q.s * Q.rx, oy = Math.sin(q.th) * R * Q.s * Q.cs, mv = q.v * (a - a * a / (2.4 * q.life)) * (q.ring ? 1.4 : 1);
      const x = Q.x + ox + Math.cos(q.th) * mv, y = Q.y + oy + (q.ring ? Math.sin(q.th) * mv * 0.35 - a * 0.12 : Math.sin(q.th) * mv * 0.5 + a * 0.25), r = q.r * (1 + a / q.life) * R / 150;
      g.globalAlpha = Math.sin(Math.PI * a / q.life) * (d ? 0.5 : 0.85); g.drawImage(pf, x - r, y - r, 2 * r, 2 * r); }
    g.globalAlpha = 1; };
  // steam curls off the baked pizza
  const pzOver = (g, f, W, H, d) => { if (!PZ) return; const st = ez((f - 196) / 40); if (st <= 0) return; const {R, cx, cy} = PZ, pf = puffImg(d ? "255,250,242" : "255,255,255");
    g.save(); if (d) g.globalCompositeOperation = "lighter";
    [[-0.35, 0, 1], [0.05, 2.1, 1.2], [0.4, 4.2, 0.9]].forEach(([x0, ph, k]) => { const top = R * (0.6 + 1.1 * st) * k, base = cy - R * 0.1;
      for (let i = 0; i <= 22; i++) { const u = i / 22, y = base - top * u, x = cx + R * x0 + R * (0.05 + 0.12 * u) * Math.sin(u * 6 + ph - f * 0.05), r = R * (0.07 + 0.16 * u);
        g.globalAlpha = st * Math.sin(Math.PI * Math.min(1, u * 1.05)) * (d ? 0.06 : 0.22); g.drawImage(pf, x - r, y - r, 2 * r, 2 * r); } });
    g.restore(); };
  // ---- end finish moment sprites ----
  MAJ_THEMES.push({
    skin: {id: "italy", name: "Italy", group: "world", desc: "A pastel cliff town tumbling down to a turquoise cove.",
      light: ["#F3F8FA", "rgba(38,138,176,.10)", "#FFFFFF", "#1E2C38", "#56656F", "#D6E6EC", "#E6F0F3", "#FAFCFD", "#C4522F", "#D7744F", "#FFFFFF", "#7A2E18", "#1E5778", "#D2EAF2", "#FFE6A0"],
      dark: ["#0F1630", "rgba(246,200,74,.08)", "#18203E", "#F2F2FA", "#B6B8D2", "#2C3460", "#232A52", "#141A36", "#F6C84A", "#FADB86", "#1A2040", "#7A6A32", "#101C3A", "#D4D6EE", "#6A5A2A"],
      glow: ["linear-gradient(180deg,#9FD3F0,#DDF0F7 45%,#FCEBD0)", "linear-gradient(180deg,#101C3A,#22305A 45%,#5A3C5E)"],
      spine: [lg("#2C7FA8", "#1E5778"), lg("#22305A", "#101C3A")], btn: [lg2("#C4522F", "#E39A2E"), lg2("#F6C84A", "#FFE08A")]},
    kit: {motif: "italylemon", card: ["#FFFDF6", "#EAF5F7"], ink: "#1E2C38", bd: "#BFDDE6", mc: "#E8B820", r: 16, notes: ["#FFF0A8", "#FBD8D2"].concat(NOTES), shape: "rounded", pin: "washi2", fab: "999px", btn: "14px"},
    fx: {len: 330, spawn: (W, H, d, n) => { PZ = pzBuild(W, H); return []; }, draw: pzDraw, over: pzOver},
    tag: "A Positano-style town of pastel houses stacked down limestone cliffs to a turquoise cove, with a majolica dome, lemon terraces, striped umbrellas and the Italian flag waving on the terrace"
  });
})();
/* end of module 20-scenes-maj-italy.js */


