/* ===== module: 20-scenes-maj-m2.js ===== */
/* Study Fields themes, batch m2 */
(() => {
  const lg = (a, b) => `linear-gradient(180deg,${a},${b})`, lg2 = (a, b) => `linear-gradient(135deg,${a},${b})`;
  const NOTES = ["#FFF3B8", "#D9F0D8", "#D6E6FF", "#FFD9C8", "#EBD9FF"];
  // gear outline in the -12..12 box
  const gearD = (() => { let d = ""; const N = 8, R = 10.6, r = 8.2; for (let i = 0; i < N; i++) { const a = i / N * Math.PI * 2, w = Math.PI / N; [[a - w * 0.42, r], [a - w * 0.26, R], [a + w * 0.26, R], [a + w * 0.42, r], [a + w * 0.58, r]].forEach(([b, rr], k) => { d += (i === 0 && k === 0 ? "M" : "L") + (Math.round(rr * Math.cos(b) * 100) / 100) + " " + (Math.round(rr * Math.sin(b) * 100) / 100); }); } return d + "Z M3.4 0a3.4 3.4 0 1 0 -6.8 0a3.4 3.4 0 1 0 6.8 0Z"; })();
  const csT = []; // circuit traces for the Code Night animation, rebuilt by each spawn
  // gear outline with nt teeth, pitch radius nt*k/2, a hub hole and round cut-outs (cached by size)
  const enG = new Map(), enGear = (nt, k) => { const key = nt + "|" + Math.round(k * 100); let p = enG.get(key); if (p) return p; p = new Path2D(); const R = nt * k / 2, ad = k * 0.9;
    for (let i = 0; i < nt; i++) { const a = i / nt * Math.PI * 2, w = Math.PI / nt; [[a - w * 0.5, R - ad], [a - w * 0.3, R + ad], [a + w * 0.3, R + ad], [a + w * 0.5, R - ad]].forEach(([b, r], j) => { const x = r * Math.cos(b), y = r * Math.sin(b); i || j ? p.lineTo(x, y) : p.moveTo(x, y); }); } p.closePath();
    const hr = Math.max(k * 1.4, R * 0.16); p.moveTo(hr, 0); p.arc(0, 0, hr, 0, 7); const m = nt > 11 ? 5 : 0; for (let i = 0; i < m; i++) { const b = i / m * Math.PI * 2, r = R * 0.52, cr = R * 0.2; p.moveTo(r * Math.cos(b) + cr, r * Math.sin(b)); p.arc(r * Math.cos(b), r * Math.sin(b), cr, 0, 7); }
    enG.set(key, p); return p; };
  const cmR = (g, col, icon) => { g.fillStyle = col; g.beginPath(); g.arc(0, 0, 9.4, 0, 7); g.fill(); g.fillStyle = "rgba(255,255,255,.22)"; g.beginPath(); g.ellipse(-2.6, -4.6, 4.6, 2.6, -0.4, 0, 7); g.fill(); g.fillStyle = "#FFFFFF"; g.fill(new Path2D(icon)); };
  const hexD = (R, r) => { let d = ""; for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3 + Math.PI / 6; d += (i ? "L" : "M") + (Math.round(R * Math.cos(a) * 100) / 100) + " " + (Math.round(R * Math.sin(a) * 100) / 100); } return d + `Z M${r} 0a${r} ${r} 0 1 0 ${-2 * r} 0a${r} ${r} 0 1 0 ${2 * r} 0Z`; };

  /* Code Night */
  MAJ_THEMES.push({
    skin: {id: "compsci", name: "Code Night", desc: "A glowing circuit-board city with data pulses.",
      light: ["#EAF6F1", "rgba(31,138,110,.10)", "#FFFFFF", "#12302A", "#4D6B63", "#CFE6DD", "#E0F0E9", "#F6FBF9", "#1B7F66", "#4FA58C", "#FFFFFF", "#145C49", "#1D5E4D", "#C9EDE2", "#FFE7A0"],
      dark: ["#081A22", "rgba(95,230,210,.08)", "#0F2630", "#E3F6F3", "#9CC2BC", "#1E3C48", "#16303B", "#0B1F28", "#5FE6D2", "#9AF0E2", "#062027", "#2B7C74", "#081B24", "#BFEDE6", "#5A4A22"],
      glow: ["radial-gradient(120% 95% at 50% 55%,#E4F5EE,#D2EEE2 60%,#BFE3D4)", "radial-gradient(120% 95% at 50% 55%,#12303F,#0C2230 55%,#081822)"],
      spine: [lg("#2F8A72", "#1D5E4D"), lg("#123544", "#081B24")], btn: [lg2("#1B7F66", "#25967A"), lg2("#5FE6D2", "#9AF0E2")]},
    kit: {motif: "cs_code", card: ["#F5FBF8", "#DFF1E9"], ink: "#12302A", bd: "#A9D8C6", mc: "#1F8A6E", r: 8, notes: ["#D4EEE4"].concat(NOTES), shape: "gridnote", pin: "binder", fab: "10px", btn: "8px"},
    shapes: {
      cs_code: {d: "M-4.6 -6.4L-10.4 0L-4.6 6.4M4.6 -6.4L10.4 0L4.6 6.4M1.8 -8.6L-1.8 8.6", stroke: true, lw: 2.2},
      cs_brace: {d: "M-3.4 -9.4Q-6.6 -9.4 -6.6 -6.2V-2.6Q-6.6 0 -9.4 0Q-6.6 0 -6.6 2.6V6.2Q-6.6 9.4 -3.4 9.4M3.4 -9.4Q6.6 -9.4 6.6 -6.2V-2.6Q6.6 0 9.4 0Q6.6 0 6.6 2.6V6.2Q6.6 9.4 3.4 9.4", stroke: true, lw: 2.2},
      cs_pheart: {d: "M-6 -10H-2V-6H-6ZM2 -10H6V-6H2ZM-10 -6H-6V-2H-10ZM-6 -6H-2V-2H-6ZM-2 -6H2V-2H-2ZM2 -6H6V-2H2ZM6 -6H10V-2H6ZM-10 -2H-6V2H-10ZM-6 -2H-2V2H-6ZM-2 -2H2V2H-2ZM2 -2H6V2H2ZM6 -2H10V2H6ZM-6 2H-2V6H-6ZM-2 2H2V6H-2ZM2 2H6V6H2ZM-2 6H2V10H-2Z"},
      cs_chip: {d: "M-6.5 -6.5H6.5V6.5H-6.5Z M-4.5 -10H-2.5V-6.5H-4.5Z M-1 -10H1V-6.5H-1Z M2.5 -10H4.5V-6.5H2.5Z M-4.5 6.5H-2.5V10H-4.5Z M-1 6.5H1V10H-1Z M2.5 6.5H4.5V10H2.5Z M-10 -4.5H-6.5V-2.5H-10Z M-10 -1H-6.5V1H-10Z M-10 2.5H-6.5V4.5H-10Z M6.5 -4.5H10V-2.5H6.5Z M6.5 -1H10V1H6.5Z M6.5 2.5H10V4.5H6.5Z", detail: "M-3 -3H3V3H-3Z", dfill: true}
    },
    // circuit traces grow up from the bottom edge with a bright data pulse at each tip; when a pulse reaches its pad, the pad lights and pixel hearts pop out
    fx: {spawn: (W, H, d, n) => { const K = W < H ? 5 : 8, T = []; csT.length = 0;
      for (let i = 0; i < K; i++) { let x = W * (0.06 + 0.88 * (i + fxR(0.25, 0.75)) / K), y = H + 6; const pts = [[x, y]], top = H * fxR(0.28, 0.62);
        while (y > top) { y = Math.max(top, y - H * fxR(0.08, 0.16)); pts.push([x, y]); if (y <= top) break; const j = fxPick([-1, 1]) * W * fxR(0.025, 0.06); x = Math.min(W * 0.97, Math.max(W * 0.03, x + j)); y -= Math.abs(j) * 0.9; pts.push([x, y]); }
        let L = 0; const cum = [0]; for (let k = 1; k < pts.length; k++) { L += Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]); cum.push(L); }
        T.push({pts, cum, L, t0: Math.floor(i * 7 + fxR(0, 10)), dur: Math.floor(fxR(58, 76))}); }
      csT.push(...T);
      const P = []; T.forEach(t => { const [x, y] = t.pts[t.pts.length - 1], t1 = t.t0 + t.dur;
        for (let j = 0; j < 2; j++) P.push({shape: j ? "cs_pheart" : fxPick(["cs_code", "cs_brace", "cs_pheart"]), c: j ? fxPick(["#FF6FA8", "#FF8FC0", "#B89CFF"]) : fxPick(d ? ["#8FF5E6", "#FFD08A"] : ["#1F8A6E", "#3D9AC2"]), x, y: y - 6, vx: fxR(-0.9, 0.9), vy: -fxR(1.2, 2), g: 0, drag: 0.996, size: fxR(10, 14), rot: 0, vr: 0, sway: 0.6, swf: fxR(0.03, 0.05), life: 170, delay: t1 + j * 8, glow: d ? 10 : 0}); });
      return P.concat(fxTw(W, H, n(16), "sparkle", d ? ["#C9F7F0", "#FFFFFF"] : ["#2FA88A", "#F2B53A"], {smin: 3, smax: 6, glow: d ? 10 : 3}).map(p => Object.assign(p, {delay: 40 + Math.floor(fxR(0, 110))}))); },
      draw: (g, f, W, H, d) => {
        const a = 1 - fxEase((f - 175) / 60); if (a <= 0.01) return;
        const line = d ? "#5FE6D2" : "#1F8A6E", hot = d ? "#E8FFFB" : "#FFFFFF", glo = d ? "#5FE6D2" : "#2FA88A";
        g.lineCap = g.lineJoin = "round";
        csT.forEach(t => { const p = fxEase((f - t.t0) / t.dur); if (p <= 0) return; const D = p * t.L; let k = 1; while (k < t.pts.length - 1 && t.cum[k] < D) k++;
          const [ax, ay] = t.pts[k - 1], [bx, by] = t.pts[k], u = Math.min(1, (D - t.cum[k - 1]) / Math.max(1, t.cum[k] - t.cum[k - 1])), hx = ax + (bx - ax) * u, hy = ay + (by - ay) * u;
          g.globalAlpha = a * (d ? 0.7 : 0.6); g.strokeStyle = line; g.lineWidth = 2.4; g.shadowBlur = d ? 8 : 0; g.shadowColor = glo; g.beginPath(); g.moveTo(t.pts[0][0], t.pts[0][1]); for (let j = 1; j < k; j++) g.lineTo(t.pts[j][0], t.pts[j][1]); g.lineTo(hx, hy); g.stroke();
          // little via dots at each corner the trace has passed
          g.shadowBlur = 0; g.fillStyle = line; for (let j = 1; j < k; j++) { g.beginPath(); g.arc(t.pts[j][0], t.pts[j][1], 2.6, 0, 7); g.fill(); }
          const done = fxEase((f - t.t0 - t.dur) / 12), [ex, ey] = t.pts[t.pts.length - 1];
          if (p < 1) { g.globalAlpha = a; g.shadowBlur = 14; g.shadowColor = glo; g.fillStyle = hot; g.beginPath(); g.arc(hx, hy, 4, 0, 7); g.fill(); }
          if (done > 0) { const r = 7 + 2 * Math.sin((f - t.t0 - t.dur) / 9) * (1 - done * 0.5); g.globalAlpha = a; g.shadowBlur = 16 * done; g.shadowColor = glo; g.fillStyle = line; g.beginPath(); g.arc(ex, ey, r * done, 0, 7); g.fill(); g.shadowBlur = 0; g.fillStyle = hot; g.beginPath(); g.arc(ex, ey, r * done * 0.42, 0, 7); g.fill();
            const t2 = f - t.t0 - t.dur; if (t2 < 40) { g.globalAlpha = a * 0.5 * (1 - t2 / 40); g.strokeStyle = line; g.lineWidth = 2; g.beginPath(); g.arc(ex, ey, r + t2 * 0.9, 0, 7); g.stroke(); } }
          // a second data packet runs up the finished trace
          const q = (f - t.t0 - t.dur - 20) / 50; if (q > 0 && q < 1) { const D2 = q * t.L; let m = 1; while (m < t.pts.length - 1 && t.cum[m] < D2) m++; const [cx, cy] = t.pts[m - 1], [dx, dy] = t.pts[m], v = Math.min(1, (D2 - t.cum[m - 1]) / Math.max(1, t.cum[m] - t.cum[m - 1]));
            g.globalAlpha = a * Math.sin(q * Math.PI); g.shadowBlur = 12; g.shadowColor = glo; g.fillStyle = hot; g.beginPath(); g.arc(cx + (dx - cx) * v, cy + (dy - cy) * v, 3.2, 0, 7); g.fill(); } }); }},
    tag: "A glowing circuit-board city where data pulses race along the traces and code brackets float"
  });

  /* Gear Works */
  MAJ_THEMES.push({
    skin: {id: "engineering", name: "Gear Works", desc: "A warm workshop wall with turning gears.",
      light: ["#F6F0E8", "rgba(176,94,40,.10)", "#FFFFFF", "#2A2018", "#6E5E50", "#E8DCCD", "#F1E8DD", "#FCF9F5", "#AE5A24", "#C47C4E", "#FFFFFF", "#6E3614", "#26405F", "#F3DCC8", "#FFE3A0"],
      dark: ["#16120F", "rgba(242,166,90,.08)", "#211B16", "#F6EEE6", "#BEAE9E", "#3A3028", "#2C241D", "#1A1511", "#F2A65A", "#F6C08A", "#2A1606", "#8A5A30", "#0E1420", "#F4DCC4", "#6A4A22"],
      glow: ["linear-gradient(180deg,#EADBC6,#E2CFB6 60%,#D7BF9F)", "linear-gradient(180deg,#2A2018,#211912 60%,#18120D)"],
      spine: [lg("#3E5F86", "#26405F"), lg("#1E2A3C", "#0E1420")], btn: [lg2("#AE5A24", "#C9782E"), lg2("#F2A65A", "#F6C08A")]},
    kit: {motif: "en_gear", card: ["#FCF8F3", "#F0E4D6"], ink: "#2A2018", bd: "#E0C9AE", mc: "#C9782E", r: 10, notes: ["#DCE6F2"].concat(NOTES), shape: "folded", pin: "pin", fab: "14px", btn: "10px"},
    shapes: {
      en_gear: {d: gearD},
      en_duck: {d: "M-7 2C-9 -2 -6 -5 -2 -4C-3 -9 3 -11 5 -7C6 -6 6 -4 5 -3L9 -3C9 -1 7 0 5 0C8 2 8 7 3 8H-4C-8 8 -10 5 -7 2Z", detail: "M2.2 -6.4a0.9 0.9 0 1 0 0.1 0Z", dfill: true},
      en_nut: {d: hexD(9.6, 4)},
      en_bolt: {d: "M-5.5 -10H5.5V-5.5H-5.5Z M-2.4 -5.5H2.4V10H-2.4Z", detail: "M-2.4 -2.5L2.4 -1M-2.4 0.8L2.4 2.3M-2.4 4.1L2.4 5.6M-2.4 7.4L2.4 8.9", dstroke: true}
    },
    // two gear trains roll in from opposite corners and turn in mesh; a few nuts and bolts are tossed up and brass glints twinkle
    fx: {spawn: (W, H, d, n) => fxBurst(W, H, n(10), "en_nut", d ? ["#B8C2CC", "#E8EEF2"] : ["#7E8B96", "#A3AEB8"], [[0.35, 1.02], [0.65, 1.02]], {smin: 8, smax: 11}).map(p => Object.assign(p, {delay: 20 + Math.floor(fxR(0, 30))}))
      .concat(fxBurst(W, H, n(6), "en_bolt", d ? ["#C8D0D8"] : ["#7E8B96", "#A3AEB8"], [[0.4, 1.02], [0.6, 1.02]], {smin: 10, smax: 13}).map(p => Object.assign(p, {delay: 24 + Math.floor(fxR(0, 30))})),
        fxTw(W, H, n(18), "sparkle", d ? ["#FFE0A8", "#FFFFFF"] : ["#E8A21C", "#F2C24A"], {smin: 3, smax: 7, glow: d ? 10 : 4})),
      draw: (g, f, W, H, d) => {
        const a = 1 - fxEase((f - 180) / 60); if (a <= 0.01) return;
        const k = Math.min(W, H) * 0.0125, cols = d ? ["#E89A4E", "#E8C27A", "#C98A52"] : ["#C9782E", "#D9A441", "#A8703A"];
        const spin = 0.035 * (f - 60 * (1 - Math.exp(-f / 60))), sl = 1 - fxEase(f / 46);
        // each train: corner, direction into the screen, and gears as [teeth, angle from the previous gear]
        [[0, H, 1, -1, [[22, 0], [12, -0.5], [16, -1.25], [10, 0.1]]], [W, 0, -1, 1, [[22, 0], [12, 2.64], [16, 1.9], [10, 3.24]]]].forEach(([cx, cy, sx, sy, gs], ti) => {
          let px = cx + sx * k * 8 - sx * sl * k * 40, py = cy + sy * k * 8 - sy * sl * k * 40, th = (ti ? -1 : 1) * spin, pn = 0;
          gs.forEach(([nt, ang], i) => { let x = px, y = py; if (i) { const dist = (pn + nt) * k * 0.5; x = px + Math.cos(ang) * dist; y = py + Math.sin(ang) * dist; th = ang + Math.PI + Math.PI / nt - (th - ang) * pn / nt; }
            g.save(); g.translate(x, y); g.rotate(th); g.globalAlpha = a; g.fillStyle = cols[(i + ti) % 3]; g.shadowBlur = d ? 10 : 6; g.shadowColor = d ? "rgba(0,0,0,.5)" : "rgba(90,50,10,.25)"; g.fill(enGear(nt, k), "evenodd"); g.restore(); px = x; py = y; pn = nt; }); }); }},
    tag: "A warm workshop wall with blueprints, turning brass gears and a truss bridge out the window"
  });

  /* Sunny Classroom */
  MAJ_THEMES.push({
    skin: {id: "education", name: "Sunny Classroom", desc: "A bright classroom with a chalkboard.",
      light: ["#F7F3EA", "rgba(47,107,79,.10)", "#FFFFFF", "#22261E", "#626A5A", "#E4E3D6", "#EEECE2", "#FCFBF7", "#C2463A", "#D06E62", "#FFFFFF", "#7A2A22", "#2F5E47", "#F2D8D2", "#FFE38A"],
      dark: ["#13161A", "rgba(255,183,110,.08)", "#1C2026", "#F4F0E8", "#B6B0A4", "#323840", "#262B31", "#171A1F", "#FFB36E", "#FFCB98", "#2A1606", "#8A6038", "#0E1A14", "#F2E2CC", "#6A5424"],
      glow: ["linear-gradient(180deg,#F3E7CF,#EADBBE 60%,#DCC7A2)", "linear-gradient(180deg,#22242E,#1B1D25 60%,#15161C)"],
      spine: [lg("#2F6B4F", "#1F4A36"), lg("#1B3328", "#0E1A14")], btn: [lg2("#C2463A", "#D9663A"), lg2("#FFB36E", "#FFCB98")]},
    kit: {motif: "ed_apple", card: ["#FFFDF7", "#F4EEDD"], ink: "#22261E", bd: "#E3D9BE", mc: "#C2463A", r: 12, notes: ["#F6E7B4"].concat(NOTES), shape: "lined", pin: "tape", fab: "16px", btn: "12px"},
    shapes: {
      ed_apple: {d: "M0 -5.2C2.6 -7.4 8.4 -7.2 9 -1.4C9.6 4.6 5.4 9.8 2.4 9.8C1.4 9.8 0.8 9.2 0 9.2C-0.8 9.2 -1.4 9.8 -2.4 9.8C-5.4 9.8 -9.6 4.6 -9 -1.4C-8.4 -7.2 -2.6 -7.4 0 -5.2Z M-0.6 -5.6C-0.8 -8 0 -9.6 1.2 -10.6L2 -9.8C1 -8.8 0.6 -7.4 0.8 -5.6Z M1.6 -8.4C3 -10.6 6.4 -10.8 7.6 -9.8C6.4 -7.6 3.4 -7.2 1.6 -8.4Z", detail: "M-5.2 -2.6Q-5.8 0.6 -4 3.2", dstroke: true},
      ed_aplus: {d: "M-11 8L-6.4 -8L-1.8 8M-9.4 2.6H-3.4M4.6 -4.4V7.4M-1.2 1.5H10.4", stroke: true, lw: 2.4},
      ed_pencil: {d: "M-10.6 3.2L5.2 3.2L10.8 0L5.2 -3.2L-10.6 -3.2Z", detail: "M5.2 -3.2L5.2 3.2M-7.6 -3.2V3.2M8.6 -1.2L10.8 0L8.6 1.2Z", dstroke: true},
      // gold star sticker with a white die-cut edge and a little smile
      ed_star: {d: "M0 -11.4L3.4 -4.4L11 -3.4L5.4 1.8L6.8 9.4L0 5.8L-6.8 9.4L-5.4 1.8L-11 -3.4L-3.4 -4.4Z", paint: (g, col, dk) => { const s = new Path2D("M0 -9.4L2.7 -3.6L9 -2.8L4.4 1.5L5.6 7.8L0 4.8L-5.6 7.8L-4.4 1.5L-9 -2.8L-2.7 -3.6Z");
        g.lineJoin = "round"; g.strokeStyle = "#FFFFFF"; g.lineWidth = 3.4; g.stroke(s); g.fillStyle = "#FFFFFF"; g.fill(s); g.fillStyle = col; g.fill(s); g.save(); g.clip(s); g.fillStyle = "rgba(255,255,255,.35)"; g.fillRect(-10, -10, 20, 7); g.restore();
        g.fillStyle = fxShade(col, 0.45); g.beginPath(); g.arc(-1.8, -0.4, 0.8, 0, 7); g.arc(1.8, -0.4, 0.8, 0, 7); g.fill(); g.strokeStyle = g.fillStyle; g.lineWidth = 0.8; g.lineCap = "round"; g.beginPath(); g.arc(0, 0.8, 1.8, 0.4, 2.7); g.stroke(); }},
      ed_apple2: {d: "M0 -5.2C2.6 -7.4 8.4 -7.2 9 -1.4C9.6 4.6 5.4 9.8 2.4 9.8C1.4 9.8 0.8 9.2 0 9.2C-0.8 9.2 -1.4 9.8 -2.4 9.8C-5.4 9.8 -9.6 4.6 -9 -1.4C-8.4 -7.2 -2.6 -7.4 0 -5.2Z", paint: (g, col, dk) => {
        g.fillStyle = col; g.fill(new Path2D("M0 -5.2C2.6 -7.4 8.4 -7.2 9 -1.4C9.6 4.6 5.4 9.8 2.4 9.8C1.4 9.8 0.8 9.2 0 9.2C-0.8 9.2 -1.4 9.8 -2.4 9.8C-5.4 9.8 -9.6 4.6 -9 -1.4C-8.4 -7.2 -2.6 -7.4 0 -5.2Z")); g.fillStyle = "rgba(255,255,255,.4)"; g.beginPath(); g.ellipse(-4.6, -1.6, 1.6, 3, 0.3, 0, 7); g.fill();
        g.fillStyle = "#7A4A26"; g.fill(new Path2D("M-0.6 -5.6C-0.8 -8 0 -9.6 1.2 -10.6L2 -9.8C1 -8.8 0.6 -7.4 0.8 -5.6Z")); g.fillStyle = "#6FB04A"; g.fill(new Path2D("M1.6 -8.4C3 -10.6 6.4 -10.8 7.6 -9.8C6.4 -7.6 3.4 -7.2 1.6 -8.4Z")); }}
    },

    // the teacher's red pen writes a big A+ and rings it; gold star stickers and a few apples pop up from the desk
    fx: {spawn: (W, H, d, n) => fxBurst(W, H, n(30), "ed_star", d ? ["#FFD24A", "#FFC23A", "#FFE07A"] : ["#F6B820", "#FFC93A", "#F2A81C"], [[0.12, 1.02], [0.88, 1.02]], {smin: 11, smax: 15, flip: true, g: 0.26}).map(p => Object.assign(p, {delay: 50 + Math.floor(fxR(0, 14)), term: fxR(2, 3), fsw: 1.2}))
      .concat(fxBurst(W, H, n(6), "ed_apple2", ["#D9473A", "#E8604A", "#C83A30"], [[0.3, 1.02], [0.7, 1.02]], {smin: 12, smax: 15}).map(p => Object.assign(p, {delay: 56 + Math.floor(fxR(0, 10)), vr: fxR(-0.08, 0.08)})),
        fxTw(W, H, n(16), "sparkle", d ? ["#FFE9A8", "#FFFFFF"] : ["#F2B53A", "#FFD86B"], {smin: 3, smax: 7, glow: d ? 10 : 4}).map(p => Object.assign(p, {delay: 40 + Math.floor(fxR(0, 110))}))),
      draw: (g, f, W, H, d) => {
        const a = 1 - fxEase((f - 180) / 60); if (a <= 0.01) return;
        const s = Math.min(W * 0.5, H * 0.34, 300) / 120, ox = W / 2 - 60 * s, oy = H * (W < H ? 0.68 : 0.62) - 30 * s;
        // strokes in a 120 x 60 box: A, its bar, the plus, then a loose ring around everything
        const ring = []; for (let i = 0; i <= 40; i++) { const t = -2.2 + i / 40 * 6.9; ring.push([60 + Math.cos(t) * (74 + i * 0.25), 30 + Math.sin(t) * 46]); }
        const S = [[[4, 60], [26, 0], [48, 60]], [[13, 38], [39, 38]], [[64, 30], [100, 29]], [[82, 12], [82, 48]], ring], D = [22, 8, 9, 9, 34];
        g.lineCap = g.lineJoin = "round"; g.strokeStyle = d ? "#FF8A7A" : "#D23A32"; g.globalAlpha = a; g.shadowBlur = d ? 8 : 0; g.shadowColor = g.strokeStyle;
        let t0 = 6; S.forEach((pts, i) => { const p = Math.min(1, Math.max(0, (f - t0) / D[i])); t0 += D[i] + 3; if (p <= 0) return; let L = 0; const seg = []; for (let j = 1; j < pts.length; j++) { const l = Math.hypot(pts[j][0] - pts[j - 1][0], pts[j][1] - pts[j - 1][1]); seg.push(l); L += l; }
          let left = p * L; g.lineWidth = (i === 4 ? 3.2 : 5.5) * s; g.beginPath(); g.moveTo(ox + pts[0][0] * s, oy + pts[0][1] * s);
          for (let j = 1; j < pts.length && left > 0; j++) { const u = Math.min(1, left / seg[j - 1]); g.lineTo(ox + (pts[j - 1][0] + (pts[j][0] - pts[j - 1][0]) * u) * s, oy + (pts[j - 1][1] + (pts[j][1] - pts[j - 1][1]) * u) * s); left -= seg[j - 1]; } g.stroke(); }); }},
    tag: "A sunny classroom with chalk doodles, paper chains, an apple on the desk and trees outside"
  });

  /* On Air */
  MAJ_THEMES.push({
    skin: {id: "comms", name: "On Air", desc: "A cozy radio studio with a glowing ON AIR sign.",
      light: ["#F4F1F4", "rgba(194,58,74,.10)", "#FFFFFF", "#24202E", "#665E70", "#E2DCE4", "#ECE7EE", "#FBF9FB", "#C23A4A", "#D06A76", "#FFFFFF", "#7A1F2C", "#3A3152", "#F2D3D8", "#FFE3A0"],
      dark: ["#120F1A", "rgba(255,122,134,.08)", "#1C1826", "#F4EEF6", "#B4AAC2", "#332C42", "#282233", "#16121E", "#FF7A86", "#FF9EA8", "#2A0A10", "#8A3A48", "#0B0912", "#F6D2D8", "#6A3A3E"],
      glow: ["linear-gradient(180deg,#E9E2EC,#E1D8E4 60%,#D4C9D8)", "linear-gradient(180deg,#1E1A2A,#18141F 60%,#120F18)"],
      spine: [lg("#3A3152", "#241E36"), lg("#1C1728", "#0B0912")], btn: [lg2("#C23A4A", "#D8604A"), lg2("#FF7A86", "#FFA98A")]},
    kit: {motif: "cm_mic", card: ["#FBF9FB", "#EEE6EF"], ink: "#24202E", bd: "#DCCFDE", mc: "#C23A4A", r: 16, notes: ["#EED8DC"].concat(NOTES), shape: "rounded", pin: "magnet", fab: "999px", btn: "999px"},
    shapes: {
      cm_mic: {d: "M-4.6 -6.4A4.6 4.6 0 0 1 4.6 -6.4V0.6A4.6 4.6 0 0 1 -4.6 0.6Z M-7.6 -0.4H-6.2A6.2 6.2 0 0 0 6.2 -0.4H7.6A7.6 7.6 0 0 1 0.7 7.2V9H3.6V10.6H-3.6V9H-0.7V7.2A7.6 7.6 0 0 1 -7.6 -0.4Z", detail: "M-4.6 -4.6H4.6M-4.6 -2.2H4.6", dstroke: true},
      cm_wave: {d: "M-11 0C-9 -6 -7 -6 -5.5 0S-2 6 0 0S3.5 -6 5.5 0S9 6 11 0", stroke: true, lw: 2},
      cm_bubble: {d: "M-10 -7A3 3 0 0 1 -7 -10H7A3 3 0 0 1 10 -7V2A3 3 0 0 1 7 5H-2L-7 10L-5.5 5H-7A3 3 0 0 1 -10 2Z", detail: "M0 2.6C-4.6 -0.6 -4.4 -4.8 -2 -5.4C-1 -5.6 -0.3 -5 0 -4.2C0.3 -5 1 -5.6 2 -5.4C4.4 -4.8 4.6 -0.6 0 2.6Z", dfill: true},
      cm_bars: {d: "M-9 2H-6V10H-9Z M-4.5 -4H-1.5V10H-4.5Z M0 -9H3V10H0Z M4.5 -2H7.5V10H4.5Z"},
      // live reactions: a colored disc with a white icon
      cm_rh: {d: "M-9.4 0a9.4 9.4 0 1 0 18.8 0a9.4 9.4 0 1 0 -18.8 0Z", paint: (g, col) => cmR(g, col, "M0 5.6C-5.2 2.2 -6.6 -1 -5.8 -3.2C-5 -5.6 -1.6 -6 0 -3.2C1.6 -6 5 -5.6 5.8 -3.2C6.6 -1 5.2 2.2 0 5.6Z")},
      cm_rl: {d: "M-9.4 0a9.4 9.4 0 1 0 18.8 0a9.4 9.4 0 1 0 -18.8 0Z", paint: (g, col) => cmR(g, col, "M-5.6 -0.6H-3V5.8H-5.6Z M-2 -0.8L0.8 -5.8C1.3 -6.6 2.9 -6.3 2.9 -5L2.5 -2H5.4C6.4 -2 7 -1.2 6.8 -0.2L5.8 4.6C5.6 5.4 5 5.8 4.2 5.8H-2Z")},
      cm_rs: {d: "M-9.4 0a9.4 9.4 0 1 0 18.8 0a9.4 9.4 0 1 0 -18.8 0Z", paint: (g, col) => cmR(g, col, "M0 -6.4L1.8 -2.2L6.2 -1.9L2.8 1L3.9 5.4L0 3L-3.9 5.4L-2.8 1L-6.2 -1.9L-1.8 -2.2Z")},
      cm_rn: {d: "M-9.4 0a9.4 9.4 0 1 0 18.8 0a9.4 9.4 0 1 0 -18.8 0Z", paint: (g, col) => cmR(g, col, "M-4.2 4.4C-4.2 3 -2.8 2 -1.2 2C-0.6 2 -0.2 2.1 0.2 2.3V-5.4L5.4 -6.6V2.8C5.4 4.2 4 5.2 2.4 5.2C0.8 5.2 0.2 4.2 0.4 3.4C0.4 2.4 1.6 1.6 3 1.6C3.4 1.6 3.8 1.7 4.1 1.8V-3.2L1.5 -2.6V4.4C1.5 5.8 0.1 6.8 -1.5 6.8C-3.1 6.8 -4.2 5.8 -4.2 4.4Z")}
    },

    // a stream of live reactions (hearts, likes, stars, notes) floats up the side like a broadcast going viral, while signal rings pulse out from the mic
    fx: {spawn: (W, H, d, n) => { const cols = {cm_rh: d ? "#FF6F9A" : "#F0466E", cm_rl: d ? "#4FA6FF" : "#2F7FE0", cm_rs: d ? "#FFB43A" : "#F29A18", cm_rn: d ? "#A884FF" : "#7A56E0"}, P = [];
      for (let i = 0, N = n(34); i < N; i++) { const right = i % 3 !== 0, sh = fxPick(["cm_rh", "cm_rh", "cm_rl", "cm_rs", "cm_rn"]);
        P.push({shape: sh, c: cols[sh], x: (right ? fxR(0.8, 0.92) : fxR(0.08, 0.2)) * W, y: H + fxR(10, 30), vx: (right ? -1 : 1) * fxR(0, 0.5), vy: -fxR(2, 3.2), g: 0, drag: 0.997, size: fxR(11, 15), rot: fxR(-0.2, 0.2), vr: 0, sway: fxR(1.2, 2.2), swf: fxR(0.03, 0.05), life: Math.floor(fxR(150, 200)), delay: Math.floor(i / N * 130 + fxR(0, 10)), glow: d ? 8 : 0, grow: 0.01}); }
      return P.concat(fxTw(W, H, n(14), "sparkle", d ? ["#FFD08A", "#FFFFFF"] : ["#F2B53A", "#FFD86B"], {smin: 3, smax: 6, glow: d ? 10 : 4})); },
      draw: (g, f, W, H, d) => { const out = 1 - fxEase((f - 150) / 50); if (out <= 0.01) return; g.lineCap = "round"; g.strokeStyle = d ? "#FF9EA8" : "#C23A4A"; g.lineWidth = 3;
        for (let t0 = 0; t0 < 140; t0 += 26) { const t = f - t0; if (t < 0 || t > 110) continue; const r = 30 + t * Math.max(W, H) / 170, al = fxEase(t / 8) * (1 - t / 110); g.globalAlpha = out * al * (d ? 0.5 : 0.4);
          [-1, 1].forEach(s => { g.beginPath(); g.arc(W / 2, H + 10, r, s < 0 ? Math.PI * 1.08 : Math.PI * 1.62, s < 0 ? Math.PI * 1.38 : Math.PI * 1.92); g.stroke(); }); } }},
    tag: "A cozy radio studio with a glowing ON AIR sign, a big microphone and the city skyline outside"
  });
})();

