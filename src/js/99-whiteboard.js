/* ===== module: 99-whiteboard.js ===== */
/* Whiteboard: the second view in Notes (Notes | Whiteboard) */
var SBWB = null;
(() => {
  const BW = 4800, BH = 3200, Q = 4, ZMIN = 0.05, ZMAX = 4;
  const LIM = {strokes: 6000, chars: 700000, items: 300};
  const K_VIEW = "studyboard:notesView", K_CUR = "studyboard:wbCur", K_TOOLS = "studyboard:wbTools", K_CAM = "studyboard:wbCam";
  const lsGet = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };
  const phone = () => innerWidth < 640;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const MARKER = '"Permanent Marker","Comic Sans MS",cursive';
  // Writing styles for typed text (vendor/fonts.css)
  const FONTS = [["neat", "Neat", "'Patrick Hand'"], ["marker", "Marker", "'Permanent Marker'"], ["quick", "Quick Notes", "'Caveat'"], ["hand", "Handwritten", "'Kalam'"], ["fun", "Playful", "'Gochi Hand'"]];
  // text saved with no style is the older Marker
  const famOf = ff => (FONTS.find(x => x[0] === ff) || FONTS.find(x => x[0] === "marker"))[2] + ",'Comic Sans MS',cursive";

  /* Markers, sizes, shapes, templates */
  const PEN = [["ink", "Black", "#22262D"], ["blue", "Blue", "#1D5BD6"], ["red", "Red", "#D8372A"], ["green", "Green", "#178A4A"], ["orange", "Orange", "#E57A10"], ["purple", "Purple", "#7A3CC8"]];
  const HLC = [["yellow", "Yellow", "#FFE24A"], ["green", "Green", "#7FE39A"], ["blue", "Blue", "#86C8FF"], ["pink", "Pink", "#FF9FC8"]];
  const PW = [4, 7, 12, 20], HW = [24, 40, 60], EW = [14, 30, 64], TS = [30, 46, 70, 108];
  const PWN = ["Fine", "Medium", "Bold", "Extra Bold"], HWN = ["Thin", "Medium", "Wide"], EWN = ["Small", "Medium", "Large"], EH = [0.3, 0.65, 1], EHN = ["Soft", "Medium", "Hard"], TSN = ["Small", "Medium", "Large", "Huge"];
  // Dark mode: the board turns dark
  const PEN_D = {ink: "#F1F3F6", blue: "#7FB0FF", red: "#FF7B6E", green: "#63D995", orange: "#FFB35A", purple: "#C7A2FF"};
  const isDark = () => { try { return typeof isDarkNow === "function" ? !!isDarkNow() : document.documentElement.getAttribute("data-theme") === "dark"; } catch (e) { return false; } };
  // The board's own colour
  const boardPref = () => { const v = (state.settings || {}).wbTheme; return v === "light" || v === "dark" ? v : "auto"; };
  const boardDark = () => boardPref() === "dark" || (boardPref() === "auto" && isDark());
  let DK = boardDark();
  // Any colour (the rainbow marker, Pro)
  const HEXL = "0123456789abcdef";
  const codeOf = hex => "h" + String(hex).replace("#", "").toLowerCase().split("").map(ch => String.fromCharCode(97 + HEXL.indexOf(ch))).join("");
  const hexOf = c => /^h[a-p]{6}$/.test(c || "") ? "#" + c.slice(1).split("").map(ch => HEXL[ch.charCodeAt(0) - 97]).join("") : "";
  // on the dark board a very dark custom colour is shown lighter, so it can be seen
  const forDark = hex => { const n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255, l = (0.299 * r + 0.587 * g + 0.114 * b) / 255; if (l >= 0.35) return hex; const k = 0.55; return "#" + [r, g, b].map(v => Math.round(v + (255 - v) * k).toString(16).padStart(2, "0")).join(""); };
  const penHex = (c, light) => { const h = hexOf(c); if (h) return !light && DK ? forDark(h) : h; return !light && DK ? (PEN_D[c] || PEN_D.ink) : (PEN.find(x => x[0] === c) || PEN[0])[2]; };
  const proLocked = () => { try { return !!(window.SBPRO && SBPRO.locked()); } catch (e) { return true; } };
  const hlHex = c => (HLC.find(x => x[0] === c) || HLC[0])[2];
  const colOf = (s, light) => s.t === "hl" ? hlHex(s.c) : penHex(s.c, light);
  const SV = p => `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
  const IC = {
    select: SV('<path d="M6 3.5l12.5 7.2-5.6 1.4-2.6 5.4z"/><path d="M13 12.2l4.5 6.3"/>'),
    pen: SV('<path d="M4 20l1.4-4.8L16.2 4.4a2.1 2.1 0 0 1 3 3L8.4 18.2z"/><path d="M14.2 6.4l3 3"/>'),
    hl: SV('<path d="M15 3l6 6-7 7-6-6z"/><path d="M8 10l-1 4 3 3 4-1"/><path d="M7 14l-2.2 2.7 2.5 2.5 2.7-2.2"/>'),
    eraser: SV('<path d="M9 20h11"/><path d="M5.6 15.6l8.8-8.8a2 2 0 0 1 2.8 0l2 2a2 2 0 0 1 0 2.8L12.4 19.4H9z"/><path d="M9.5 11.7l4.8 4.8"/>'),
    shape: SV('<rect x="3.5" y="10.5" width="9" height="9" rx="1.2"/><circle cx="16.2" cy="8" r="4.5"/>'),
    text: SV('<path d="M5 7V4.5h14V7"/><path d="M12 4.5v15"/><path d="M9 19.5h6"/>'),
    hand: SV('<path d="M8 13V6a1.5 1.5 0 0 1 3 0v5"/><path d="M11 10.5V4.5a1.5 1.5 0 0 1 3 0v6"/><path d="M14 10.5V6a1.5 1.5 0 0 1 3 0v6"/><path d="M17 9.5a1.5 1.5 0 0 1 3 0v3.5a7 7 0 0 1-7 7h-1a7 7 0 0 1-5.6-2.8L3.8 14a1.5 1.5 0 0 1 2.4-1.8L8 14.5"/>'),
    undo: SV('<path d="M9 14L4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>'),
    redo: SV('<path d="M15 14l5-5-5-5"/><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13"/>'),
    trash: SV('<path d="M4 7h16"/><path d="M10 11v6M14 11v6"/><path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12"/><path d="M9 7V4h6v3"/>'),
    copy: SV('<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>'),
    fit: SV('<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>')
  };
  const CHEV = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';
  const SHAPES = [["line", "Line", '<path d="M5 19L19 5"/>'], ["arrow", "Arrow", '<path d="M5 19L19 5"/><path d="M10 5h9v9"/>'], ["double", "Double Arrow", '<path d="M5 19L19 5"/><path d="M12.5 5H19v6.5"/><path d="M11.5 19H5v-6.5"/>'],
    ["rect", "Rectangle", '<rect x="4" y="6" width="16" height="12" rx="1"/>'], ["ellipse", "Circle", '<ellipse cx="12" cy="12" rx="8.5" ry="6.5"/>'], ["triangle", "Triangle", '<path d="M12 4.5l8.5 15h-17z"/>'], ["diamond", "Diamond", '<path d="M12 3.5l8.5 8.5-8.5 8.5L3.5 12z"/>']];
  const TOOLS = [["select", "Select", "V"], ["pen", "Marker", "P"], ["hl", "Highlighter", "H"], ["eraser", "Eraser", "E"], ["shape", "Shapes", "S"], ["text", "Text", "T"], ["hand", "Move Around", "Space"]];
  const TPL = [["blank", "Blank"], ["grid", "Grid"], ["dots", "Dots"], ["lines", "Lines"], ["cornell", "Cornell Notes"], ["concept", "Concept Map"], ["week", "Week Plan"], ["kanban", "To Do, Doing, Done"], ["venn", "Venn Diagram"], ["timeline", "Timeline"]];
  const tplName = id => (TPL.find(t => t[0] === id) || TPL[0])[1];

  const T = Object.assign({font: "neat", tool: "pen", pen: "ink", hl: "yellow", pw: 1, hw: 1, ew: 1, erase: "part", shape: "rect", ts: 1}, (() => { try { return JSON.parse(lsGet(K_TOOLS) || "{}") || {}; } catch (e) { return {}; } })());
  (() => {
    if (!TOOLS.some(t => t[0] === T.tool)) T.tool = "pen";
    if (!FONTS.some(f => f[0] === T.font) || !T.fv) { T.font = FONTS.some(f => f[0] === T.font) && T.fv ? T.font : "neat"; T.fv = 1; }
    if (!PEN.some(p => p[0] === T.pen) && !hexOf(T.pen)) T.pen = "ink";
    if (!/^#[0-9a-f]{6}$/.test(T.custom || "")) T.custom = "#e83e8c";
    if (!HLC.some(p => p[0] === T.hl)) T.hl = "yellow";
    if (!SHAPES.some(s => s[0] === T.shape)) T.shape = "rect";
    T.erase = T.erase === "whole" ? "whole" : "part";
    T.eh = [0, 1, 2].includes(T.eh) ? T.eh : 2;
    [["pw", PW], ["hw", HW], ["ew", EW], ["ts", TS]].forEach(([k, a]) => { T[k] = clamp(Math.round(Number(T[k]) || 0), 0, a.length - 1); });
  })();
  const saveT = () => lsSet(K_TOOLS, JSON.stringify(T));

  /* Points: pack and unpack */
  const AL = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_", AIX = {};
  for (let i = 0; i < 64; i++) AIX[AL.charCodeAt(i)] = i;
  function enc(pts){
    if (pts.length === 1) pts = [pts[0], pts[0]];
    let s = "", px = 0, py = 0;
    const put = v => { v = v < 0 ? -v * 2 - 1 : v * 2; while (v >= 32) { s += AL[32 + (v % 32)]; v = Math.floor(v / 32); } s += AL[v]; };
    pts.forEach(([x, y]) => { const X = Math.round(clamp(x, 0, BW) * Q), Y = Math.round(clamp(y, 0, BH) * Q); put(X - px); put(Y - py); px = X; py = Y; });
    return s.length >= 3 ? s : s + "AA";
  }
  function dec(d){
    const nums = []; let v = 0, mul = 1;
    for (let i = 0; i < d.length; i++) {
      const k = AIX[d.charCodeAt(i)]; if (k === undefined) return [];
      if (k >= 32) { v += (k - 32) * mul; mul *= 32; } else { v += k * mul; nums.push(v & 1 ? -(v + 1) / 2 : v / 2); v = 0; mul = 1; }
    }
    const pts = []; let x = 0, y = 0;
    for (let i = 0; i + 1 < nums.length; i += 2) { x += nums[i]; y += nums[i + 1]; pts.push([x / Q, y / Q]); }
    return pts;
  }
  // Ramer-Douglas-Peucker
  function simplify(pts, eps){
    if (pts.length < 3) return pts.slice();
    const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1;
    const st = [[0, pts.length - 1]];
    while (st.length) {
      const [a, b] = st.pop(); let md = 0, mi = -1;
      for (let i = a + 1; i < b; i++) { const d = segDist(pts[i], pts[a], pts[b]); if (d > md) { md = d; mi = i; } }
      if (md > eps && mi > 0) { keep[mi] = 1; st.push([a, mi], [mi, b]); }
    }
    return pts.filter((p, i) => keep[i]);
  }
  function segDist(p, a, b){
    const dx = b[0] - a[0], dy = b[1] - a[1], l = dx * dx + dy * dy;
    let t = l ? ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l : 0; t = clamp(t, 0, 1);
    return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy);
  }
  const nearLine = (pts, p, r) => pts.length === 1 ? Math.hypot(pts[0][0] - p[0], pts[0][1] - p[1]) <= r : pts.some((q, i) => i > 0 && segDist(p, pts[i - 1], q) <= r);
  function densify(pts, step){
    const out = [pts[0]];
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i], n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / step);
      for (let k = 1; k <= n; k++) out.push([a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n]);
    }
    return out;
  }
  // The parts of a line that are on the board (a shape half off the edge keeps the half on it)
  function inBoard(pts){
    const ok = p => p[0] >= 0 && p[0] <= BW && p[1] >= 0 && p[1] <= BH;
    if (pts.every(ok)) return [pts];
    const runs = []; let run = [];
    densify(pts, 6).forEach(p => { if (ok(p)) run.push(p); else { if (run.length) runs.push(run); run = []; } });
    if (run.length) runs.push(run);
    return runs.map(r => r.length > 2 ? simplify(r, 0.4) : r);
  }
  // A finished hand-drawn line
  function chaikin(p, n){
    for (let k = 0; k < n; k++) {
      if (p.length < 3) return p;
      const o = [p[0]];
      for (let i = 0; i < p.length - 1; i++) { const a = p[i], b = p[i + 1]; o.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25], [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]); }
      o.push(p[p.length - 1]); p = o;
    }
    return p;
  }
  // Corners stay sharp
  function smoothStroke(pts, ptype){
    const eps = (ptype === "pen" ? 0.45 : ptype === "touch" ? 1 : 1.3) / cam.z;
    const p = simplify(pts.filter((q, i) => i === 0 || q[0] !== pts[i - 1][0] || q[1] !== pts[i - 1][1]), eps);
    if (p.length < 3) return p;
    const cut = [0];
    for (let i = 1; i < p.length - 1; i++) {
      const a = Math.atan2(p[i][1] - p[i - 1][1], p[i][0] - p[i - 1][0]), b = Math.atan2(p[i + 1][1] - p[i][1], p[i + 1][0] - p[i][0]);
      let t = Math.abs(b - a); if (t > Math.PI) t = 2 * Math.PI - t;
      if (t > 1.1) cut.push(i);
    }
    cut.push(p.length - 1);
    let out = [];
    for (let k = 0; k < cut.length - 1; k++) { const seg = chaikin(p.slice(cut[k], cut[k + 1] + 1), 3); out = out.concat(k ? seg.slice(1) : seg); }
    return simplify(out, 0.12 / cam.z);
  }
  const bbOf = pts => pts.reduce((b, p) => [Math.min(b[0], p[0]), Math.min(b[1], p[1]), Math.max(b[2], p[0]), Math.max(b[3], p[1])], [Infinity, Infinity, -Infinity, -Infinity]);
  const bbHit = (a, b) => a[0] <= b[2] && a[2] >= b[0] && a[1] <= b[3] && a[3] >= b[1];
  const bbJoin = (a, b) => !a ? b : !b ? a : [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[2], b[2]), Math.max(a[3], b[3])];

  /* Shapes: drawn with the Shapes tool, or a hand-drawn one held still at the end */
  function shapePts(kind, a, b, even, wpx){
    let [x0, y0] = a, [x1, y1] = b;
    const lineish = kind === "line" || kind === "arrow" || kind === "double";
    if (even) {
      if (lineish) { const L = Math.hypot(x1 - x0, y1 - y0), an = Math.round(Math.atan2(y1 - y0, x1 - x0) / (Math.PI / 12)) * (Math.PI / 12); x1 = x0 + Math.cos(an) * L; y1 = y0 + Math.sin(an) * L; }
      else { const d = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)); x1 = x0 + Math.sign(x1 - x0 || 1) * d; y1 = y0 + Math.sign(y1 - y0 || 1) * d; }
    }
    const A = [x0, y0], B = [x1, y1], mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
    const head = (from, to) => {
      const L = Math.hypot(to[0] - from[0], to[1] - from[1]) || 1, h = clamp(L * 0.28, 16, 70) + (wpx || 0) * 1.2, an = Math.atan2(to[1] - from[1], to[0] - from[0]);
      return [[to[0] - h * Math.cos(an - 0.5), to[1] - h * Math.sin(an - 0.5)], [to[0] - h * Math.cos(an + 0.5), to[1] - h * Math.sin(an + 0.5)]];
    };
    if (kind === "line") return [A, B];
    if (kind === "arrow") { const [h1, h2] = head(A, B); return [A, B, h1, B, h2]; }
    if (kind === "double") { const [h1, h2] = head(A, B), [h3, h4] = head(B, A); return [h3, A, h4, A, B, h1, B, h2]; }
    if (kind === "rect") return [[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]];
    if (kind === "triangle") return [[mx, y0], [x1, y1], [x0, y1], [mx, y0]];
    if (kind === "diamond") return [[mx, y0], [x1, my], [mx, y1], [x0, my], [mx, y0]];
    return ellipsePts(mx, my, Math.abs(x1 - x0) / 2, Math.abs(y1 - y0) / 2);
  }
  function ellipsePts(cx, cy, rx, ry){ const out = []; for (let i = 0; i <= 64; i++) { const a = i / 64 * Math.PI * 2; out.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); } return out; }
  // A hand-drawn stroke held still at its end
  function recognize(pts){
    if (pts.length < 4) return null;
    const bb = bbOf(pts), dw = bb[2] - bb[0], dh = bb[3] - bb[1], diag = Math.hypot(dw, dh); if (diag < 24) return null;
    const A = pts[0], Z = pts[pts.length - 1], chord = Math.hypot(Z[0] - A[0], Z[1] - A[1]);
    if (chord > diag * 0.75 && pts.every(p => segDist(p, A, Z) < diag * 0.07)) {
      let an = Math.atan2(Z[1] - A[1], Z[0] - A[0]); const snap = Math.round(an / (Math.PI / 4)) * (Math.PI / 4);
      if (Math.abs(an - snap) < 0.09) an = snap;
      return [A, [A[0] + Math.cos(an) * chord, A[1] + Math.sin(an) * chord]];
    }
    if (chord > diag * 0.3) return null;
    let poly = simplify(pts.concat([A]), diag * 0.085); poly = poly.slice(0, -1);
    for (let again = true; again && poly.length > 2;) {
      again = false;
      for (let i = 0; i < poly.length; i++) {
        const p = poly[(i + poly.length - 1) % poly.length], c = poly[i], n = poly[(i + 1) % poly.length];
        const a1 = Math.atan2(c[1] - p[1], c[0] - p[0]), a2 = Math.atan2(n[1] - c[1], n[0] - c[0]);
        let t = Math.abs(a2 - a1); if (t > Math.PI) t = 2 * Math.PI - t;
        if (t < 0.45) { poly.splice(i, 1); again = true; break; }
      }
    }
    const cx = (bb[0] + bb[2]) / 2, cy = (bb[1] + bb[3]) / 2, rx = dw / 2 || 1, ry = dh / 2 || 1;
    const eErr = pts.reduce((s, p) => s + Math.abs(Math.hypot((p[0] - cx) / rx, (p[1] - cy) / ry) - 1), 0) / pts.length;
    if (poly.length === 3 && eErr > 0.09) return poly.concat([poly[0]]);
    if (poly.length === 4 && eErr > 0.08) {
      const square = poly.every((p, i) => { const n = poly[(i + 1) % 4]; const a = Math.abs(Math.atan2(n[1] - p[1], n[0] - p[0])) % (Math.PI / 2); return a < 0.2 || a > Math.PI / 2 - 0.2; });
      return square ? [[bb[0], bb[1]], [bb[2], bb[1]], [bb[2], bb[3]], [bb[0], bb[3]], [bb[0], bb[1]]] : poly.concat([poly[0]]);
    }
    if (eErr < 0.16) { const r = Math.abs(rx - ry) / Math.max(rx, ry) < 0.12 ? (rx + ry) / 2 : 0; return ellipsePts(cx, cy, r || rx, r || ry); }
    return null;
  }

  /* Templates: faint guides under the ink (never erased) */
  const PAL_L = {guide: "#C3CCD7", faint: "#E0E5EB", label: "#9BA5B2", dot: "#CDD4DC", margin: "#F0BBB5"}, PAL_D = {guide: "#4E5967", faint: "#333C47", label: "#7F8B99", dot: "#3E4855", margin: "#6B3E3A"};
  const GUIDE = "@guide", FAINT = "@faint";
  const pc = (c, pal) => c && c[0] === "@" ? pal[c.slice(1)] : c;
  // A template is laid out to fit the board's page
  function pageRect(pa){
    if (!(pa > 0)) return [0, 0, BW, BH];
    return pa >= BW / BH ? [0, 0, BW, Math.round(BW / pa)] : [0, 0, Math.round(BH * pa), BH];
  }
  function tplOps(id, pa){
    const R = pageRect(pa), sx = R[2] / BW, sy = R[3] / BH, k = Math.max(0.55, Math.min(sx, sy));
    if (id === "lines" || (sx === 1 && sy === 1)) return tplRaw(id);
    return tplRaw(id).map(op => op.k === "l" ? Object.assign({}, op, {x1: op.x1 * sx, y1: op.y1 * sy, x2: op.x2 * sx, y2: op.y2 * sy})
      : op.k === "e" ? Object.assign({}, op, {cx: op.cx * sx, cy: op.cy * sy, rx: op.rx * sx, ry: op.ry * sy})
      : op.k === "t" ? Object.assign({}, op, {x: op.x * sx, y: op.y * sy, f: Math.round(op.f * k)}) : op);
  }
  function tplRaw(id){
    const o = [], L = (x1, y1, x2, y2, c, w, dash) => o.push({k: "l", x1, y1, x2, y2, c: c || GUIDE, w: w || 6, dash}), E = (cx, cy, rx, ry, c, w, dash) => o.push({k: "e", cx, cy, rx, ry, c: c || GUIDE, w: w || 6, dash});
    const X = (x, y, s, f, a) => o.push({k: "t", x, y: y + 30, s, f: Math.round((f || 60) * 1.8), a: a || "start"});
    if (id === "grid") o.push({k: "grid", s: 80});
    else if (id === "dots") o.push({k: "dots", s: 80});
    else if (id === "lines") { for (let y = 240; y < BH; y += 96) L(0, y, BW, y, FAINT, 3); L(300, 0, 300, BH, "@margin", 4); }
    // Cornell: a slim title band, a cue column about 30% wide, and a summary strip about a sixth of the page
    else if (id === "cornell") { const T = 280, S = BH - 540; L(0, T, BW, T); L(1440, T, 1440, S); L(0, S, BW, S); X(260, 160, "Title and Date"); X(90, T + 110, "Questions and Key Words", 52); X(1540, T + 110, "Notes", 52); X(90, S + 110, "Summary", 52); }
    else if (id === "concept") {
      const cx = BW / 2, cy = BH / 2; E(cx, cy, 440, 250, GUIDE, 7); X(cx, cy + 22, "Main Idea", 70, "middle");
      for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + i * Math.PI / 3, px = cx + Math.cos(a) * 1450, py = cy + Math.sin(a) * 1000; L(cx + Math.cos(a) * 470, cy + Math.sin(a) * 280, px - Math.cos(a) * 330, py - Math.sin(a) * 200, GUIDE, 5, 26); E(px, py, 330, 190, GUIDE, 5, 26); }
    }
    else if (id === "week") { const d = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"], cw = BW / 7; L(0, 330, BW, 330); L(0, 470, BW, 470, FAINT, 4); X(90, 230, "Week of"); d.forEach((n, i) => { if (i) L(i * cw, 330, i * cw, BH); X(i * cw + cw / 2, 430, n, 56, "middle"); }); }
    else if (id === "kanban") { const c = ["To Do", "Doing", "Done"], cw = BW / 3; L(0, 260, BW, 260, FAINT, 4); c.forEach((n, i) => { if (i) L(i * cw, 60, i * cw, BH - 60); X(i * cw + cw / 2, 190, n, 76, "middle"); }); }
    else if (id === "venn") { E(1950, 1650, 1000, 1000, GUIDE, 7); E(2850, 1650, 1000, 1000, GUIDE, 7); X(1400, 560, "A", 80, "middle"); X(3400, 560, "B", 80, "middle"); X(2400, 1680, "Both", 60, "middle"); }
    else if (id === "timeline") { L(260, 1600, 4540, 1600, GUIDE, 9); L(4540, 1600, 4460, 1550, GUIDE, 9); L(4540, 1600, 4460, 1650, GUIDE, 9); for (let x = 500; x <= 4300; x += 475) L(x, 1550, x, 1650, GUIDE, 7); X(260, 1500, "Start", 56); X(4540, 1500, "End", 56, "end"); }
    return o;
  }
  let tplSeq = 0;
  function tplSvg(id, thumb, pa, pal){
    pal = pal || PAL_L;
    const ops = tplOps(id, thumb ? 0 : pa), sfx = "wbp" + (++tplSeq), k = thumb ? 3 : 1, parts = [];
    let defs = "";
    ops.forEach(op => {
      if (op.k === "grid" || op.k === "dots") {
        const s = op.s * (thumb ? 2 : 1);
        defs += `<pattern id="${sfx}" width="${s}" height="${s}" patternUnits="userSpaceOnUse">${op.k === "grid" ? `<path d="M${s} 0V${s}H0" fill="none" stroke="${pal.faint}" stroke-width="${2 * k}"/>` : `<circle cx="${s / 2}" cy="${s / 2}" r="${4 * k}" fill="${pal.dot}"/>`}</pattern>`;
        parts.push(`<rect width="${BW}" height="${BH}" fill="url(#${sfx})"/>`);
      } else if (op.k === "l") parts.push(`<line x1="${op.x1}" y1="${op.y1}" x2="${op.x2}" y2="${op.y2}" stroke="${pc(op.c, pal)}" stroke-width="${op.w * k}" stroke-linecap="round"${op.dash ? ` stroke-dasharray="${op.dash} ${op.dash}"` : ""}/>`);
      else if (op.k === "e") parts.push(`<ellipse cx="${op.cx}" cy="${op.cy}" rx="${op.rx}" ry="${op.ry}" fill="none" stroke="${pc(op.c, pal)}" stroke-width="${op.w * k}"${op.dash ? ` stroke-dasharray="${op.dash} ${op.dash}"` : ""}/>`);
      else if (op.k === "t" && !thumb) parts.push(`<text x="${op.x}" y="${op.y}" font-size="${op.f}" text-anchor="${op.a}" fill="${pal.label}" font-family='${MARKER}'>${esc(op.s)}</text>`);
    });
    return `<svg class="wb-tpl" viewBox="0 0 ${BW} ${BH}" preserveAspectRatio="${thumb ? "xMidYMid slice" : "none"}" aria-hidden="true">${defs ? `<defs>${defs}</defs>` : ""}${parts.join("")}</svg>`;
  }
  function tplPaint(c, id, area, pa, dark){
    const pal = dark ? PAL_D : PAL_L;
    tplOps(id, pa).forEach(op => {
      c.save(); c.lineCap = "round";
      if (op.k === "grid" || op.k === "dots") {
        const s = op.s, x0 = Math.floor(area[0] / s) * s, y0 = Math.floor(area[1] / s) * s;
        if (op.k === "grid") { c.strokeStyle = pal.faint; c.lineWidth = 2; c.beginPath(); for (let x = x0; x <= area[2]; x += s) { c.moveTo(x, area[1]); c.lineTo(x, area[3]); } for (let y = y0; y <= area[3]; y += s) { c.moveTo(area[0], y); c.lineTo(area[2], y); } c.stroke(); }
        else { c.fillStyle = pal.dot; for (let x = x0 + s / 2; x <= area[2]; x += s) for (let y = y0 + s / 2; y <= area[3]; y += s) { c.beginPath(); c.arc(x, y, 4, 0, Math.PI * 2); c.fill(); } }
      } else if (op.k === "l" || op.k === "e") {
        c.strokeStyle = pc(op.c, pal); c.lineWidth = op.w; if (op.dash) c.setLineDash([op.dash, op.dash]);
        c.beginPath(); if (op.k === "l") { c.moveTo(op.x1, op.y1); c.lineTo(op.x2, op.y2); } else c.ellipse(op.cx, op.cy, op.rx, op.ry, 0, 0, Math.PI * 2); c.stroke();
      } else if (op.k === "t") { c.fillStyle = pal.label; c.font = `${op.f}px ${MARKER}`; c.textAlign = op.a === "middle" ? "center" : op.a; c.fillText(op.s, op.x, op.y); }
      c.restore();
    });
  }

  /* Boards */
  const isBoard = n => !!(n && n.wb && !n.archived);
  const boards = () => Object.values(state.notes || {}).filter(isBoard).sort((a, b) => (b.updated || b.created || 0) - (a.updated || a.created || 0));
  const boardName = n => String((n && n.text) || "").split("\n")[0].trim() || "Untitled Whiteboard";
  ui.notesView = ui.notesView || (lsGet(K_VIEW) === "wb" ? "wb" : "board");
  const on = () => ui.notesView === "wb";
  function setView(v){ ui.notesView = v === "wb" ? "wb" : "board"; lsSet(K_VIEW, ui.notesView); }
  function curId(){
    const ok = id => id && isBoard(state.notes[id]);
    if (ok(ui.wbCur)) return ui.wbCur;
    const s = lsGet(K_CUR); if (ok(s)) return (ui.wbCur = s);
    const b = boards()[0]; return (ui.wbCur = b ? b.id : "");
  }
  function create(name, tpl, courseId, extra){
    const now = Date.now();
    const n = Object.assign({id: uid(), text: name || "Untitled Whiteboard", wb: {v: 1, tpl: TPL.some(t => t[0] === tpl) ? tpl : "blank", pa: pageAspect()}, courseId: courseId || "", board: "", created: now, updated: now}, extra || {});
    applyChanges([{kind: "note", id: n.id, after: n}], "");
    ui.wbCur = n.id; lsSet(K_CUR, n.id); setView("wb");
    return n.id;
  }
  // Someone who has made a whiteboard before
  // The shape of the board's frame (or what it will be, before it's on the page)
  function pageAspect(){
    let w = fw, h = fh;
    if (!(w > 0 && h > 0)) { w = Math.min(innerWidth, 1700) - (phone() ? 44 : 320); h = innerHeight - (phone() ? 330 : 290); }
    return Math.round(clamp(w / Math.max(1, h), 0.3, 4) * 1000) / 1000;
  }
  const nextName = () => { const used = new Set(boards().map(boardName)); for (let i = boards().length + 1; ; i++) if (!used.has("Whiteboard " + i)) return "Whiteboard " + i; };

  /* The open board */
  let B = null;
  const GEO = new Map();
  const noteOf = () => B && state.notes[B.id];
  function merged(base, pend){
    if (!pend.size) return base;
    const ids = new Set(), out = [];
    base.forEach(x => { ids.add(x.id); const v = pend.has(x.id) ? pend.get(x.id) : x; if (v) out.push(v); });
    pend.forEach((v, id) => { if (v && !ids.has(id)) out.push(v); });
    return out;
  }
  const strokes = () => { const n = noteOf(); return B ? merged((n && n.wbInk) || [], B.pS) : []; };
  const items = () => { const n = noteOf(); return B ? merged((n && n.wbItems) || [], B.pI) : []; };
  const getS = id => B.pS.has(id) ? B.pS.get(id) : (((noteOf() || {}).wbInk || []).find(s => s.id === id) || null);
  const getI = id => B.pI.has(id) ? B.pI.get(id) : (((noteOf() || {}).wbItems || []).find(s => s.id === id) || null);
  function geo(s){
    let g = GEO.get(s.id); if (g && g.d === s.d) return g;
    const pts = dec(s.d), path = new Path2D();
    pts.forEach((p, i) => i ? path.lineTo(p[0], p[1]) : path.moveTo(p[0], p[1]));
    if (pts.length && pts.every(p => p[0] === pts[0][0] && p[1] === pts[0][1])) path.lineTo(pts[0][0] + 0.01, pts[0][1]);
    const r = s.w / 20, b = pts.length ? bbOf(pts) : [0, 0, 0, 0];
    g = {d: s.d, pts, path, bb: [b[0] - r, b[1] - r, b[2] + r, b[3] + r]};
    GEO.set(s.id, g); return g;
  }
  // Typed text: measured with the marker font (cached)
  const MC = document.createElement("canvas").getContext("2d"), MEAS = new Map();
  function measure(s, f, ff){
    const k = f + "|" + (ff || "") + "|" + s; let m = MEAS.get(k); if (m) return m;
    MC.font = `${f}px ${famOf(ff)}`; const lines = String(s).split("\n");
    m = {w: Math.max(f * 0.3, ...lines.map(l => MC.measureText(l).width)), h: lines.length * f * 1.3};
    if (MEAS.size > 600) MEAS.clear(); MEAS.set(k, m); return m;
  }
  const itemBB = it => { if (it.k === "t") { const m = measure(it.s, it.f, it.ff); return [it.x, it.y, it.x + m.w, it.y + m.h]; } return [it.x, it.y, it.x + (it.w || 0), it.y + (it.h || 0)]; };

  function flush(){
    if (!B) return; clearTimeout(B.timer); B.timer = 0;
    if (!B.pS.size && !B.pI.size) return;
    const n = noteOf(); if (!n) { B.pS = new Map(); B.pI = new Map(); return; }
    const ink = strokes(), its = items();
    B.pS = new Map(); B.pI = new Map();
    const after = clone(n);
    if (ink.length) after.wbInk = ink; else delete after.wbInk;
    if (its.length) after.wbItems = its; else delete after.wbItems;
    after.updated = Date.now();
    applyChanges([{kind: "note", id: n.id, after}], null);
    fire("wb-saved", n.id);
  }
  function later(){ if (!B) return; clearTimeout(B.timer); B.timer = setTimeout(() => { if (D || ED) later(); else flush(); }, 900); }
  // Every change goes through set() inside opBegin/opEnd, which also makes one undo step of it
  let OP = null;
  const opBegin = () => { OP = OP || new Map(); };
  function set(t, id, v){
    const k = t + id;
    if (OP && !OP.has(k)) OP.set(k, {t, id, before: (t === "s" ? getS(id) : getI(id)) || null});
    (t === "s" ? B.pS : B.pI).set(id, v);
    if (OP) OP.get(k).after = v;
    if (LIVE) LIVE(t, id, v);
  }
  function opEnd(){
    if (!OP) return; const ch = [...OP.values()].filter(c => JSON.stringify(c.before) !== JSON.stringify(c.after)); OP = null;
    if (ch.length) { B.undo.push(ch); if (B.undo.length > 120) B.undo.shift(); B.redo = []; }
    later(); itemsDraw(); dirty(); trayState();
  }
  function replay(ch, which){ ch.forEach(c => set(c.t, c.id, c[which])); SEL = null; later(); itemsDraw(); dirty(); trayState(); }
  function undo(){ if (!B || !B.undo.length) return; endText(); const ch = B.undo.pop(); B.redo.push(ch); replay(ch, "before"); }
  function redo(){ if (!B || !B.redo.length) return; endText(); const ch = B.redo.pop(); B.undo.push(ch); replay(ch, "after"); }
  let LIVE = null;

  function fullWhy(){
    const ss = strokes(), chars = ss.reduce((n, s) => n + s.d.length + 40, 0);
    return ss.length >= LIM.strokes || chars >= LIM.chars ? "This board is full. Erase some drawing, or start a new board." : "";
  }
  let fullShown = 0;
  function addStroke(t, c, w, pts){
    const why = fullWhy(); if (why) { if (Date.now() - fullShown > 4000) { fullShown = Date.now(); toast(why); } return null; }
    const s = {id: uid(), t, c, w: clamp(Math.round(w), 1, 600), d: enc(pts), at: Date.now()};
    opBegin(); set("s", s.id, s); opEnd(); return s;
  }

  // Sizes are what you see
  const penW = () => clamp(PW[T.pw] / cam.z, 0.5, 60), hlW = () => clamp(HW[T.hw] / cam.z, 2, 60), textF = () => Math.round(clamp(TS[T.ts] / cam.z, 10, 400));

  /* Camera */
  let cam = {x: 40, y: 40, z: 1}, fw = 0, fh = 0, dpr = 1;
  function camLoad(id){
    try { const c = (JSON.parse(lsGet(K_CAM) || "{}") || {})[id]; if (Array.isArray(c) && c.every(Number.isFinite)) return {x: c[0], y: c[1], z: clamp(c[2], ZMIN, ZMAX)}; } catch (e) {}
    return null;
  }
  let camT = 0;
  function camSave(){
    clearTimeout(camT);
    camT = setTimeout(() => { if (!B) return; let m = {}; try { m = JSON.parse(lsGet(K_CAM) || "{}") || {}; } catch (e) {} delete m[B.id]; m[B.id] = [Math.round(cam.x), Math.round(cam.y), Math.round(cam.z * 1000) / 1000]; const ks = Object.keys(m); ks.slice(0, Math.max(0, ks.length - 40)).forEach(k => delete m[k]); lsSet(K_CAM, JSON.stringify(m)); }, 300);
  }
  // The white board always fills the frame to its edges
  const zMin = () => fw > 0 && fh > 0 ? Math.max(ZMIN, fw / BW, fh / BH) : ZMIN;
  // A layout template (Cornell Notes, Week Plan...) is one fixed page
  const FREE = ["blank", "grid", "dots", "lines"];
  const fixedPage = () => { const n = noteOf(); return !!(n && n.wb && n.wb.tpl && !FREE.includes(n.wb.tpl)); };
  // On phones the page is too small to use at its fit size, so it zooms and moves, kept inside the page
  // (a phone turned sideways is wider than that, but it is still a small touch screen you pinch to zoom)
  const PHONE = () => !!(window.matchMedia && matchMedia("(max-width:639px), (hover:none) and (pointer:coarse) and (max-height:639px)").matches);
  function clampCam(){
    const fx = fixedPage(), ph = fx && PHONE(); if (STAGE) STAGE.classList.toggle("wb-fixed", fx && !ph);
    if (fx && fw > 0 && fh > 0) {
      const R = pageRect(noteOf().wb.pa), fit = Math.min(fw / R[2], fh / R[3]);
      if (!ph) { cam.z = Math.max(zMin(), fit); cam.x = 0; cam.y = 0; return; }
      // the page plus anything drawn or placed past its edges, all reachable
      const bb = contentBB(), E = [0, 0, R[2], R[3]];
      if (bb) { E[0] = clamp(Math.min(0, bb[0]), 0, BW); E[1] = clamp(Math.min(0, bb[1]), 0, BH); E[2] = clamp(Math.max(R[2], bb[2]), 0, BW); E[3] = clamp(Math.max(R[3], bb[3]), 0, BH); }
      const ew = E[2] - E[0], eh = E[3] - E[1];
      // zoom out as far as all of it, centred when it's smaller than the frame
      cam.z = clamp(cam.z, Math.max(ZMIN, Math.min(fw / ew, fh / eh)), ZMAX);
      const pw = ew * cam.z, phh = eh * cam.z;
      cam.x = pw <= fw ? Math.round((fw - pw) / 2 - E[0] * cam.z) : clamp(cam.x, fw - E[2] * cam.z, -E[0] * cam.z);
      cam.y = phh <= fh ? Math.round((fh - phh) / 2 - E[1] * cam.z) : clamp(cam.y, fh - E[3] * cam.z, -E[1] * cam.z);
      return;
    }
    cam.z = clamp(cam.z, zMin(), ZMAX);
    if (!(fw > 0 && fh > 0)) return;
    cam.x = clamp(cam.x, fw - BW * cam.z, 0); cam.y = clamp(cam.y, fh - BH * cam.z, 0);
  }
  function zoomAt(z, sx, sy){
    if (sx == null) { sx = fw / 2; sy = fh / 2; }
    const wx = (sx - cam.x) / cam.z, wy = (sy - cam.y) / cam.z;
    cam.z = clamp(z, ZMIN, ZMAX); cam.x = sx - wx * cam.z; cam.y = sy - wy * cam.z;
    clampCam(); dirty(); camSave();
  }
  // The − and + buttons move along an even ladder (10% steps to 100%, then 25%, then 50%), and glide to the new zoom
  const STEPS = [0.05, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1, 1.25, 1.5, 1.75, 2, 2.5, 3, 3.5, 4];
  let zoomRaf = 0, zoomTarget = 0;
  function zoomGlide(z){
    cancelAnimationFrame(zoomRaf);
    const reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { zoomAt(z); return; }
    zoomTarget = z;
    const z0 = cam.z, t0 = performance.now(), ms = 200, ease = k => 1 - Math.pow(1 - k, 3);
    const step = now => { const k = Math.min(1, (now - t0) / ms); zoomAt(z0 * Math.pow(z / z0, ease(k))); if (k < 1) zoomRaf = requestAnimationFrame(step); else zoomTarget = 0; };
    zoomRaf = requestAnimationFrame(step);
  }
  const zoomStep = d => {
    const z = zoomTarget || cam.z, lo = zMin();
    const next = d > 0 ? (STEPS.find(s => s > z + 0.004) || ZMAX) : ([...STEPS].reverse().find(s => s < z - 0.004) || lo);
    zoomGlide(Math.max(next, d < 0 ? Math.min(lo, z) : next));
  };
  function contentBB(){
    let bb = null;
    strokes().forEach(s => { bb = bbJoin(bb, geo(s).bb); });
    items().forEach(it => { bb = bbJoin(bb, itemBB(it)); });
    return bb;
  }
  function fit(whole){
    const n = noteOf(), tpl = n && n.wb && n.wb.tpl !== "blank";
    let bb = whole ? null : contentBB(); if (!bb || tpl) bb = [0, 0, BW, BH];
    const M = whole ? 0 : phone() ? 10 : 40, w = Math.max(200, bb[2] - bb[0]), h = Math.max(150, bb[3] - bb[1]);
    cam.z = clamp(Math.min((fw - M * 2) / w, (fh - M * 2) / h), zMin(), 2);
    cam.x = (fw - w * cam.z) / 2 - bb[0] * cam.z; cam.y = (fh - h * cam.z) / 2 - bb[1] * cam.z;
    if (whole) { cam.x = 0; cam.y = 0; }
    clampCam(); dirty(); camSave();
  }

  /* The stage (made once, moved into each render) */
  let STAGE = null, frame, back, front, texts, cvH, cvI, cvL, tray, selbar, zoomEl;
  function build(){
    if (STAGE) return;
    // sm-skip: the board is put back into the page after every save, and must never fade in (it blinked out while drawing)
    STAGE = document.createElement("div"); STAGE.className = "wb-stage sm-skip";
    STAGE.innerHTML = `<div class="wb-frame" tabindex="0" role="application" aria-roledescription="whiteboard" aria-label="Whiteboard. Draw with the mouse, a finger or a pen. Tools are next to the board.">
        <div class="wb-world wb-back"><div class="wb-tplbox"></div><div class="wb-imgs"></div></div>
        <canvas class="wb-cv wb-hl"></canvas><canvas class="wb-cv wb-ink"></canvas>
        <div class="wb-world wb-front"><div class="wb-texts"></div></div>
        <canvas class="wb-cv wb-live"></canvas>
        <div class="wb-selbar" hidden></div>
        ${boardMaxBtn("wb-max")}
        <div class="wb-zoom" role="group" aria-label="Zoom"><button type="button" data-wb="zoom-out" aria-label="Zoom out">−</button><button type="button" class="wbz-pct" data-wb="zoom-reset" aria-label="Zoom to 100%">100%</button><button type="button" data-wb="zoom-in" aria-label="Zoom in">+</button><button type="button" class="wbz-theme" data-wb="theme" aria-label="Dark board" title="Dark Board"></button><button type="button" data-wb="fit" aria-label="Fit the drawing on screen" title="Fit to Screen">${IC.fit}</button></div>
      </div>
      <div class="wb-tray" role="toolbar" aria-label="Whiteboard tools"></div>`;
    frame = STAGE.querySelector(".wb-frame"); back = STAGE.querySelector(".wb-back"); front = STAGE.querySelector(".wb-front"); texts = STAGE.querySelector(".wb-texts");
    cvH = STAGE.querySelector(".wb-hl"); cvI = STAGE.querySelector(".wb-ink"); cvL = STAGE.querySelector(".wb-live");
    tray = STAGE.querySelector(".wb-tray"); STAGE.classList.toggle("wb-dk", DK); setTimeout(themeBtn, 0); selbar = STAGE.querySelector(".wb-selbar"); zoomEl = STAGE.querySelector(".wbz-pct");
    trayDraw(); bindPointer(); bindKeys();
    STAGE.addEventListener("click", onStageClick);
    if (window.ResizeObserver) new ResizeObserver(() => resize()).observe(frame);
    if (document.fonts && document.fonts.load) Promise.all(FONTS.map(f => document.fonts.load(`40px ${f[2]}`))).then(() => { MEAS.clear(); itemsDraw(true); dirty(); }).catch(() => {});
  }
  // The drawing surfaces only ever grow: a smaller board draws into the top-left of them (the frame clips the rest), so a
  // size change never throws away and rebuilds three screen-sized canvases (rebuilding them over and over could run a phone
  // out of memory and make iOS restart the app)
  let cvW = 0, cvHt = 0, cvR = 0;
  function resize(){
    if (!frame || !frame.isConnected) return;
    // typing on a touch screen: the keyboard shrinks the app, but the board keeps its size and view (no refit, no jump);
    // the text box is lifted clear of the keyboard instead (keepTaVisible)
    if (TOUCH() && (ED || kbUp()) && fw > 0) return;
    const w = frame.clientWidth, h = frame.clientHeight, r = Math.min(2, window.devicePixelRatio || 1);
    if (w === fw && h === fh && r === dpr) return;
    fw = w; fh = h; dpr = r;
    const grow = cvH.width === 0 || r !== cvR || w > cvW || h > cvHt || w < cvW * 0.6;
    if (grow) {
      cvW = w < cvW * 0.6 || r !== cvR ? w : Math.max(cvW, w); cvHt = r !== cvR ? h : Math.max(cvHt, h); cvR = r;
      [cvH, cvI, cvL].forEach(c => { c.width = Math.max(1, Math.round(cvW * r)); c.height = Math.max(1, Math.round(cvHt * r)); c.style.width = cvW + "px"; c.style.height = cvHt + "px"; });
    }
    clampCam();
    if (raf) { cancelAnimationFrame(raf); raf = 0; }
    all = true; paint();
  }
  // The board's height comes from the screen's full height for this width (not whatever the height is this instant, which
  // twitches with the keyboard and toolbars), and only changes when that, the board's top or the tab bar really change
  let scrFull = 0, scrW = 0;
  function sizeHost(host){
    if (boardMaxOn()) { host.style.height = ""; return; }
    if (innerWidth !== scrW) { scrW = innerWidth; scrFull = 0; }
    if (!document.documentElement.classList.contains("kb-open")) scrFull = Math.max(scrFull, innerHeight);
    const IH = scrFull || innerHeight;
    // where the board starts is measured once per board and screen width: the header shrinking as the page scrolls would
    // otherwise move it, resize it, change the scroll, and so on, back and forth
    const key = innerWidth + "|" + (ui.wbCur || "");
    if (host._topKey !== key) { host._topKey = key; host._top = host.getBoundingClientRect().top + window.scrollY; }
    const top = host._top, nav = document.querySelector("nav.tabs");
    const navH = phone() && nav ? Math.round(nav.getBoundingClientRect().height) : 0;
    const want = Math.max(phone() ? 420 : 460, Math.round(IH - Math.min(top, IH * 0.45) - navH - (phone() ? 18 : 16)));
    const now = parseFloat(host.style.height) || 0;
    if (Math.abs(want - now) > 2) host.style.height = want + "px";
  }

  /* Painting */
  let raf = 0, all = true;
  function dirty(onlyLive){ if (!onlyLive) all = true; if (!raf) raf = requestAnimationFrame(paint); }
  const viewBB = () => [-cam.x / cam.z, -cam.y / cam.z, (fw - cam.x) / cam.z, (fh - cam.y) / cam.z];
  const worldTf = c => c.setTransform(cam.z * dpr, 0, 0, cam.z * dpr, cam.x * dpr, cam.y * dpr);
  function paint(){
    raf = 0; if (!STAGE || !STAGE.isConnected || !B) return;
    const tf = `translate(${cam.x}px,${cam.y}px) scale(${cam.z})`; back.style.transform = tf; front.style.transform = tf; STAGE.style.setProperty("--wb-inv", String(1 / cam.z));
    if (all) { all = false; paintInk(); }
    paintLive(); selbarPlace();
    if (zoomEl) { zoomEl.textContent = Math.round(cam.z * 100) + "%"; const t = PHONE() ? "Fit to screen" : "Zoom to 100%"; if (zoomEl.getAttribute("aria-label") !== t) { zoomEl.setAttribute("aria-label", t); zoomEl.title = PHONE() ? "Fit to Screen" : ""; } }
  }
  const SELHIDE = () => SEL && SEL.drag ? SEL.ids : null;
  // A stroke, with the spots the eraser rubbed
  let TMP = null;
  function strokePaint(c, s, color){
    const g = geo(s); c.strokeStyle = color; c.lineWidth = s.w / 10;
    if (!s.x || !s.x.length) { c.stroke(g.path); return; }
    const m = c.getTransform(), pad = s.w / 20 + 2, bb = g.bb, cw = c.canvas.width, chh = c.canvas.height;
    const X0 = Math.max(0, Math.floor((bb[0] - pad) * m.a + m.e)), Y0 = Math.max(0, Math.floor((bb[1] - pad) * m.d + m.f)), X1 = Math.min(cw, Math.ceil((bb[2] + pad) * m.a + m.e)), Y1 = Math.min(chh, Math.ceil((bb[3] + pad) * m.d + m.f));
    if (X1 <= X0 || Y1 <= Y0) return;
    const t = TMP || (TMP = document.createElement("canvas")); t.width = X1 - X0; t.height = Y1 - Y0;
    const tx = t.getContext("2d"); tx.setTransform(m.a, 0, 0, m.d, m.e - X0, m.f - Y0); tx.lineCap = "round"; tx.lineJoin = "round"; tx.strokeStyle = color; tx.lineWidth = s.w / 10; tx.stroke(g.path);
    tx.globalCompositeOperation = "destination-out";
    for (const e of s.x) { const [cx, cy, r, h] = e;
      if (h >= 0.99) tx.fillStyle = "#000";
      else { const gr = tx.createRadialGradient(cx, cy, 0, cx, cy, r); gr.addColorStop(0, `rgba(0,0,0,${Math.min(0.95, 0.2 + 0.9 * h).toFixed(2)})`); gr.addColorStop(1, "rgba(0,0,0,0)"); tx.fillStyle = gr; }
      tx.beginPath(); tx.arc(cx, cy, r, 0, Math.PI * 2); tx.fill(); }
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.drawImage(t, X0, Y0); c.restore();
  }
  function paintInk(){
    const v = viewBB(), hide = SELHIDE();
    const ch = cvH.getContext("2d"), ci = cvI.getContext("2d");
    [ch, ci].forEach(c => { c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, cvH.width, cvH.height); worldTf(c); c.lineCap = "round"; c.lineJoin = "round"; });
    for (const s of strokes()) {
      if (hide && hide.has("s" + s.id)) continue;
      const g = geo(s); if (!bbHit(g.bb, v)) continue;
      strokePaint(s.t === "hl" ? ch : ci, s, colOf(s));
    }
  }
  function strokeLine(c, pts, curve){
    c.beginPath(); c.moveTo(pts[0][0], pts[0][1]);
    if (pts.length === 1) c.lineTo(pts[0][0] + 0.01, pts[0][1]);
    else if (curve && pts.length > 2) { for (let i = 1; i < pts.length - 1; i++) c.quadraticCurveTo(pts[i][0], pts[i][1], (pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2); c.lineTo(pts[pts.length - 1][0], pts[pts.length - 1][1]); }
    else pts.forEach((p, i) => { if (i) c.lineTo(p[0], p[1]); });
    c.stroke();
  }
  function paintLive(){
    const c = cvL.getContext("2d"); c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, cvL.width, cvL.height); worldTf(c); c.lineCap = "round"; c.lineJoin = "round";
    if (D && (D.kind === "pen" || D.kind === "hl" || D.kind === "shape")) {
      const hl = D.kind === "hl";
      c.globalAlpha = hl ? 0.5 : 1; c.strokeStyle = hl ? hlHex(T.hl) : penHex(T.pen); c.lineWidth = hl ? hlW() : penW();
      strokeLine(c, D.kind === "shape" ? shapePts(T.shape, D.a, D.b, D.even, penW()) : D.pts, D.kind !== "shape" && !D.snapped); c.globalAlpha = 1;
    }
    if (SEL) {
      const m = selM();
      if (SEL.drag) {
        c.save(); c.transform(m.k, 0, 0, m.k, m.e, m.f);
        strokes().forEach(s => { if (!SEL.ids.has("s" + s.id)) return; c.globalAlpha = s.t === "hl" ? 0.5 : 1; strokePaint(c, s, colOf(s)); });
        c.restore(); c.globalAlpha = 1;
      }
      const b = selBox(); if (b) {
        c.setLineDash([6 / cam.z, 5 / cam.z]); c.strokeStyle = "#2F6FDB"; c.lineWidth = 1.6 / cam.z; c.strokeRect(b[0], b[1], b[2] - b[0], b[3] - b[1]); c.setLineDash([]);
        const hs = 12 / cam.z; c.fillStyle = "#fff"; c.fillRect(b[2] - hs / 2, b[3] - hs / 2, hs, hs); c.strokeRect(b[2] - hs / 2, b[3] - hs / 2, hs, hs);
      }
    }
    if (D && D.kind === "marq") { const b = [Math.min(D.a[0], D.b[0]), Math.min(D.a[1], D.b[1]), Math.max(D.a[0], D.b[0]), Math.max(D.a[1], D.b[1])]; c.fillStyle = "rgba(47,111,219,.08)"; c.fillRect(b[0], b[1], b[2] - b[0], b[3] - b[1]); c.setLineDash([6 / cam.z, 5 / cam.z]); c.strokeStyle = "#2F6FDB"; c.lineWidth = 1.4 / cam.z; c.strokeRect(b[0], b[1], b[2] - b[0], b[3] - b[1]); c.setLineDash([]); }
    if (HOV && T.tool === "eraser") { c.beginPath(); c.arc(HOV[0], HOV[1], EW[T.ew] / 2 / cam.z, 0, Math.PI * 2); c.fillStyle = "rgba(255,255,255,.55)"; c.fill(); c.strokeStyle = "rgba(30,40,55,.55)"; c.lineWidth = 1.4 / cam.z; c.stroke(); }
  }

  /* Text and picture items */
  let itemsSig = "";
  function itemsDraw(force){
    if (!texts || !B) return;
    const list = items(), m = SEL && SEL.drag ? selM() : null, editing = ED ? ED.it.id : "";
    const sig = JSON.stringify([list, m, editing, SEL && SEL.drag ? [...SEL.ids] : 0, DK]);
    if (!force && sig === itemsSig) return; itemsSig = sig;
    const xf = it => m && SEL.ids.has("i" + it.id) ? {x: it.x * m.k + m.e, y: it.y * m.k + m.f, f: it.f * m.k, w: (it.w || 0) * m.k, h: (it.h || 0) * m.k} : it;
    texts.innerHTML = list.filter(it => it.k === "t" && it.id !== editing).map(it => { const p = xf(it); return `<div class="wb-t" data-id="${esc(it.id)}" style="left:${+p.x}px;top:${+p.y}px;font-size:${+p.f}px;font-family:${famOf(it.ff)};color:${penHex(it.c)}">${esc(it.s)}</div>`; }).join("");
    fire("wb-items", {host: STAGE.querySelector(".wb-imgs"), list: list.filter(it => it.k === "i"), xf, editing});
  }
  let ED = null;
  // Typing low on a touch screen: the keyboard would cover the text box, and iOS would slide the whole page up to reach it.
  // Instead the board's layers rise just enough to show the box above the keyboard (the page and toolbars stay put) and
  // settle back when the keyboard goes. Taps are mapped through the lift (see local()).
  let LIFT = 0;
  const TOUCH = () => !!(window.matchMedia && matchMedia("(pointer:coarse)").matches);
  function setLift(px){ px = Math.max(0, Math.round(px)); if (px === LIFT) return; LIFT = px; if (frame) frame.style.setProperty("--lift", px + "px"); }
  const kbUp = () => document.documentElement.classList.contains("kb-open");
  // The keyboard's height, learned each time it opens (a fair guess before the first time), so the board can rise to meet it
  // as it comes up rather than after
  let kbGuess = 0, scrH = 0;
  function kbLearn(){
    if (innerWidth !== (kbLearn.w || 0)) { kbLearn.w = innerWidth; scrH = 0; }
    const vv = window.visualViewport, vis = vv ? vv.height : innerHeight;
    if (!kbUp()) scrH = Math.max(scrH, innerHeight, vis);
    else if (scrH) { const k = scrH - vis; if (k > 150 && k < scrH * 0.7) kbGuess = k; }
  }
  function keepTaVisible(predict){
    if (!ED || !frame || !TOUCH()) return;
    if (ED.sy != null && Math.abs(scrollY - ED.sy) > 1) window.scrollTo(0, ED.sy);
    kbLearn();
    const vv = window.visualViewport, f = frame.getBoundingClientRect(), r = ED.ta.getBoundingClientRect();
    // where the box would be with no lift (the lift may be mid-glide, so read its current value)
    const now = -(parseFloat((getComputedStyle(front).translate || "").split(" ")[1]) || 0), top0 = r.top + now, bot0 = r.bottom + now;
    const visBottom = vv ? vv.offsetTop + vv.height : innerHeight;
    const coming = predict && !kbUp() ? (kbGuess || Math.round((scrH || innerHeight) * 0.42)) : 0;
    const bottom = Math.min(f.bottom, visBottom - coming) - 14;
    const want = Math.max(0, Math.min(bot0 - bottom, top0 - f.top - 10));
    if (want > LIFT + 1 || (want < LIFT - 1 && bot0 - LIFT < bottom - 40)) setLift(want);
  }
  let settleT = 0;
  function liftCheck(){
    kbLearn(); if (ED) keepTaVisible(); else if (LIFT && !kbUp()) setLift(0);
    // keyboard gone: one size check, in case the screen really changed size while the board held still
    if (!ED && !kbUp()) { clearTimeout(settleT); settleT = setTimeout(() => { const h = document.getElementById("wbHost"); if (h && STAGE && h.contains(STAGE) && !ED && !kbUp()) { sizeHost(h); resize(); } }, 350); }
  }
  if (window.visualViewport) { visualViewport.addEventListener("resize", liftCheck); visualViewport.addEventListener("scroll", liftCheck); }
  addEventListener("resize", liftCheck);
  addEventListener("scroll", () => { if (ED && TOUCH() && ED.sy != null && Math.abs(scrollY - ED.sy) > 1) window.scrollTo(0, ED.sy); }, {passive: true});
  new MutationObserver(liftCheck).observe(document.documentElement, {attributes: true, attributeFilter: ["class"]});
  function editText(it, isNew, selectAll){
    endText();
    const ta = document.createElement("textarea"); ta.className = "wb-ta"; ta.id = "wbTa";   // an id lets a page redraw (the keyboard resizing the app) put the cursor back here ta.setAttribute("aria-label", "Text on the whiteboard"); ta.rows = 1;
    ta.value = it.s || ""; Object.assign(ta.style, {left: it.x + "px", top: it.y + "px", fontSize: it.f + "px", color: penHex(it.c), fontFamily: famOf(it.ff)});
    front.appendChild(ta); ED = {it, ta, isNew, sy: scrollY}; itemsDraw(); fitTa(); trayDraw();
    keepTaVisible(true);   // rise now, together with the keyboard, so iOS has nothing to scroll into view
    ta.addEventListener("input", () => { fitTa(); keepTaVisible(); });
    [120, 450, 800].forEach(ms => setTimeout(() => { if (ED && ED.ta === ta) keepTaVisible(); }, ms));
    ta.addEventListener("pointerdown", e => e.stopPropagation());
    ta.addEventListener("keydown", e => { e.stopPropagation(); if (e.key === "Escape" || (e.key === "Enter" && (e.ctrlKey || e.metaKey))) { e.preventDefault(); endText(); frame.focus({preventScroll: true}); } });
    ta.addEventListener("blur", () => setTimeout(() => { if (ED && ED.ta === ta && document.activeElement !== ta) endText(); }, 0));
    setTimeout(() => { try { ta.focus({preventScroll: true}); const l = ta.value.length; ta.setSelectionRange(selectAll ? 0 : l, l); } catch (e) {} }, 0);
  }
  function fitTa(){ if (!ED) return; const m = measure(ED.ta.value || " ", ED.it.f, ED.it.ff); ED.ta.style.width = Math.ceil(m.w + ED.it.f * 0.8) + "px"; ED.ta.style.height = Math.ceil(m.h + ED.it.f * 0.2) + "px"; }
  function endText(){
    if (!ED) return; const {it, ta} = ED; ED = null;
    const s = ta.value.replace(/\s+$/, "").slice(0, 2000); ta.remove();
    opBegin();
    if (!s.trim()) { if (getI(it.id)) set("i", it.id, null); }
    else if (s !== it.s || !getI(it.id)) set("i", it.id, Object.assign({}, it, {s, at: Date.now()}));
    opEnd(); itemsDraw(true); trayDraw();
    if (s.trim() && T.tool === "text" && getI(it.id)) select(new Set(["i" + it.id]));
    setTimeout(liftCheck, 350);   // typing somewhere else next keeps the lift; otherwise it settles once the keyboard goes
  }
  const hitItem = (p, kind) => { const r = 6 / cam.z, l = items(); for (let i = l.length - 1; i >= 0; i--) { const it = l[i]; if (kind && it.k !== kind) continue; const b = itemBB(it); if (p[0] >= b[0] - r && p[0] <= b[2] + r && p[1] >= b[1] - r && p[1] <= b[3] + r) return it; } return null; };
  function hitStroke(p){ const l = strokes(); for (let i = l.length - 1; i >= 0; i--) { const s = l[i], g = geo(s), r = Math.max(s.w / 20, 8 / cam.z); if (p[0] < g.bb[0] - r || p[0] > g.bb[2] + r || p[1] < g.bb[1] - r || p[1] > g.bb[3] + r) continue; if (nearLine(g.pts, p, r)) return s; } return null; }

  /* Selection: move, resize, recolour, copy, delete */
  let SEL = null;
  const selM = () => ({k: SEL.k, e: SEL.ax * (1 - SEL.k) + SEL.dx, f: SEL.ay * (1 - SEL.k) + SEL.dy});
  function selBox(){
    if (!SEL) return null; let bb = null;
    strokes().forEach(s => { if (SEL.ids.has("s" + s.id)) bb = bbJoin(bb, geo(s).bb); });
    items().forEach(it => { if (SEL.ids.has("i" + it.id)) bb = bbJoin(bb, itemBB(it)); });
    if (!bb) return null;
    const m = selM(); return [bb[0] * m.k + m.e, bb[1] * m.k + m.f, bb[2] * m.k + m.e, bb[3] * m.k + m.f];
  }
  function select(ids){
    SEL = ids && ids.size ? {ids, k: 1, dx: 0, dy: 0, ax: 0, ay: 0, drag: false} : null;
    selbarDraw(); dirty(true); trayDraw();
  }
  function selectIn(b){
    const ids = new Set();
    strokes().forEach(s => { const g = geo(s); if (bbHit(g.bb, b) && g.pts.some(p => p[0] >= b[0] && p[0] <= b[2] && p[1] >= b[1] && p[1] <= b[3])) ids.add("s" + s.id); });
    items().forEach(it => { if (bbHit(itemBB(it), b)) ids.add("i" + it.id); });
    select(ids);
  }
  function selCommit(){
    if (!SEL) return; const m = selM(); if (m.k === 1 && !SEL.dx && !SEL.dy) { SEL.drag = false; return; }
    const tp = p => [p[0] * m.k + m.e, p[1] * m.k + m.f];
    opBegin();
    strokes().forEach(s => { if (!SEL.ids.has("s" + s.id)) return; set("s", s.id, Object.assign({}, s, {d: enc(geo(s).pts.map(tp)), w: clamp(Math.round(s.w * m.k), 1, 600)}, s.x ? {x: s.x.map(e => { const q = tp(e); return [q[0], q[1], e[2] * m.k, e[3]]; })} : {})); });
    items().forEach(it => { if (!SEL.ids.has("i" + it.id)) return; const p = tp([it.x, it.y]), o = Object.assign({}, it, {x: Math.round(p[0]), y: Math.round(p[1])}); if (it.k === "t") o.f = clamp(Math.round(it.f * m.k), 10, 400); else { o.w = Math.round(it.w * m.k); o.h = Math.round(it.h * m.k); } set("i", it.id, o); });
    SEL.k = 1; SEL.dx = SEL.dy = 0; SEL.drag = false;
    opEnd();
  }
  function selDelete(){ if (!SEL) return; opBegin(); SEL.ids.forEach(k => set(k[0], k.slice(1), null)); SEL = null; opEnd(); selbarDraw(); }
  function selCopy(){
    if (!SEL) return; const ids = new Set(), off = 40;
    const tp = p => [p[0] + off, p[1] + off];
    opBegin();
    strokes().forEach(s => { if (!SEL.ids.has("s" + s.id)) return; const n = Object.assign({}, s, {id: uid(), d: enc(geo(s).pts.map(tp)), at: Date.now()}, s.x ? {x: s.x.map(e => [e[0] + off, e[1] + off, e[2], e[3]])} : {}); set("s", n.id, n); ids.add("s" + n.id); });
    items().forEach(it => { if (!SEL.ids.has("i" + it.id)) return; const n = Object.assign({}, it, {id: uid(), x: it.x + off, y: it.y + off, at: Date.now()}); set("i", n.id, n); ids.add("i" + n.id); });
    opEnd(); select(ids);
  }
  // c: a marker colour, or "orig" (a picture drawn in marker goes back to its own colours)
  function selColor(c){
    if (!SEL) return; opBegin();
    if (c !== "orig") strokes().forEach(s => { if (SEL.ids.has("s" + s.id) && s.t === "pen" && s.c !== c) set("s", s.id, Object.assign({}, s, {c})); });
    items().forEach(it => {
      if (!SEL.ids.has("i" + it.id)) return;
      if (it.k === "t" && c !== "orig" && it.c !== c) set("i", it.id, Object.assign({}, it, {c}));
      if (it.k === "i" && it.r && (it.tint || "orig") !== c) { const o = Object.assign({}, it); if (c === "orig") delete o.tint; else o.tint = c; set("i", it.id, o); }
    });
    opEnd(); selbarDraw();
  }
  function selbarDraw(){
    if (!selbar) return;
    if (!SEL) { selbar.hidden = true; return; }
    const one = SEL.ids.size === 1 ? [...SEL.ids][0] : "", it = one[0] === "i" ? getI(one.slice(1)) : null;
    const sel = [...SEL.ids], pics = sel.filter(k => k[0] === "i").map(k => getI(k.slice(1))).filter(x => x && x.k === "i");
    const colorable = sel.some(k => k[0] === "s") || sel.some(k => { const x = k[0] === "i" && getI(k.slice(1)); return x && (x.k === "t" || x.r); });
    const drawn = pics.some(x => x.r), cur = it && it.k === "i" ? (it.tint || "orig") : it && it.k === "t" ? it.c : "";
    const dots = !colorable ? "" : (drawn ? `<button type="button" class="wb-dot wb-dot-orig" data-wb="sel-color" data-id="orig" aria-label="Original colors" title="Original Colors" aria-pressed="${cur === "orig"}"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="4.5" width="17" height="15" rx="2"/><circle cx="9" cy="10" r="1.7"/><path d="M20.5 16l-5-5-8.5 8.5"/></svg></button>` : "")
      + PEN.map(p => `<button type="button" class="wb-dot" data-wb="sel-color" data-id="${p[0]}" style="--mk:${p[2]}" aria-label="${drawn ? "All in " : "Make it "}${esc(p[1].toLowerCase())}" title="${esc(p[1])}" aria-pressed="${cur === p[0]}"></button>`).join("")
      + `<button type="button" class="wb-dot wb-dot-any" data-wb="sel-any" aria-label="Any color${proLocked() ? " (Studyboard Pro)" : ""}" title="Any Color${proLocked() ? " (Pro)" : ""}" aria-pressed="${!!hexOf(cur)}"${hexOf(cur) ? ` style="--mk:${hexOf(cur)}"` : ""}></button>` + `<span class="wb-sep"></span>`;
    const nb = document.createElement("div"); nb.innerHTML = `${dots}${it && it.k === "t" ? `<button type="button" data-wb="sel-edit">Edit Text</button>` : ""}<button type="button" data-wb="sel-copy" aria-label="Duplicate" title="Duplicate (Ctrl+D)">${IC.copy}</button><button type="button" data-wb="sel-del" aria-label="Delete" title="Delete">${IC.trash}</button>`;
    fire("wb-selbar", {bar: nb, ids: SEL.ids, it});
    if (nb.innerHTML !== selbar.innerHTML) { selbar.replaceChildren(...nb.childNodes); }
    selbar.hidden = false; selbarPlace();
  }
  function selbarPlace(){
    if (!selbar || selbar.hidden || !SEL) return;
    const b = selBox(); if (!b) { selbar.hidden = true; return; }
    const w = selbar.offsetWidth, h = selbar.offsetHeight, sx = (b[0] + b[2]) / 2 * cam.z + cam.x, top = b[1] * cam.z + cam.y - h - 12, bot = b[3] * cam.z + cam.y + 14;
    selbar.style.left = clamp(sx - w / 2, 6, Math.max(6, fw - w - 6)) + "px";
    selbar.style.top = (top > 6 ? top : Math.min(bot, fh - h - 6)) + "px";
    selbar.classList.toggle("dragging", !!SEL.drag);
  }

  /* Pointer: draw, erase, shapes, text, select; two fingers */
  let D = null, GEST = null, HOV = null, penSeen = false, spaceDown = false;
  const PTR = new Map();
  const local = e => { const r = frame.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top + LIFT]; };
  const toW = s => [(s[0] - cam.x) / cam.z, (s[1] - cam.y) / cam.z];
  function cancelDraw(){ if (!D) return; clearTimeout(D.snapT); clearTimeout(D.grabT); if (D.kind === "erase") opEnd(); if (D.kind === "move" || D.kind === "scale") { SEL.k = 1; SEL.dx = SEL.dy = 0; SEL.drag = false; itemsDraw(); } D = null; dirty(); }
  function touchPts(){ return [...PTR.values()].filter(p => p.type === "touch"); }
  function gestStart(){
    const [a, b] = touchPts(); const r = frame.getBoundingClientRect();
    GEST = {d0: Math.hypot(a.x - b.x, a.y - b.y) || 1, m0: [(a.x + b.x) / 2 - r.left, (a.y + b.y) / 2 - r.top], c0: Object.assign({}, cam)};
  }
  function gestMove(){
    const t = touchPts(); if (t.length < 2) return; const [a, b] = t, r = frame.getBoundingClientRect();
    const d = Math.hypot(a.x - b.x, a.y - b.y) || 1, m = [(a.x + b.x) / 2 - r.left, (a.y + b.y) / 2 - r.top], c0 = GEST.c0;
    const wx = (GEST.m0[0] - c0.x) / c0.z, wy = (GEST.m0[1] - c0.y) / c0.z;
    cam.z = clamp(c0.z * d / GEST.d0, ZMIN, ZMAX); cam.x = m[0] - wx * cam.z; cam.y = m[1] - wy * cam.z; clampCam(); dirty(); camSave();
  }
  // A rotation can drop a finger's lift (iOS), leaving a pinch stuck on and the page offset under full screen
  function afterRotate(){
    PTR.clear(); GEST = null; cancelDraw(); if (frame) frame.classList.remove("panning");
    if (document.documentElement.classList.contains("board-max")) {
      const fix = () => { try { window.scrollTo(0, 0); document.documentElement.scrollTop = 0; document.body.scrollTop = 0; } catch (e) {}
        const h = STAGE && STAGE.closest(".wb-host"); if (h) { h.style.transform = "translateZ(0)"; void h.offsetHeight; h.style.transform = ""; } };
      fix(); requestAnimationFrame(fix); setTimeout(fix, 350);
    }
  }
  let rotW = innerWidth;
  addEventListener("orientationchange", afterRotate);
  addEventListener("resize", () => { if (innerWidth !== rotW) { rotW = innerWidth; afterRotate(); } });
  function bindPointer(){
    frame.addEventListener("contextmenu", e => e.preventDefault());
    frame.addEventListener("pointerdown", e => {
      if (e.target.closest(".wb-zoom,.wb-selbar,.wb-ta,.wb-max")) return;
      if (ED) endText();
      frame.focus({preventScroll: true});
      PTR.set(e.pointerId, {x: e.clientX, y: e.clientY, type: e.pointerType});
      try { frame.setPointerCapture(e.pointerId); } catch (x) {}
      if (e.pointerType === "pen") penSeen = true;
      if (e.pointerType === "touch" && e.isPrimary) [...PTR.keys()].forEach(id => { if (id !== e.pointerId && PTR.get(id).type === "touch") PTR.delete(id); });
      if (e.pointerType === "touch" && touchPts().length >= 2) { cancelDraw(); gestStart(); return; }
      if (GEST || D) return;
      e.preventDefault();
      const s = local(e), w = toW(s);
      if (e.button === 1 || spaceDown || T.tool === "hand" || (e.pointerType === "touch" && penSeen)) { D = {kind: "pan", id: e.pointerId, s, c: Object.assign({}, cam)}; frame.classList.add("panning"); return; }
      if (e.pointerType === "mouse" && e.button !== 0) return;
      begin(e, s, w);
    });
    frame.addEventListener("pointermove", e => {
      const P = PTR.get(e.pointerId); if (P) { P.x = e.clientX; P.y = e.clientY; }
      if (GEST) { gestMove(); return; }
      const s = local(e);
      if (!D) { if (e.pointerType !== "touch") { HOV = toW(s); if (T.tool === "eraser") dirty(true); } return; }
      if (D.id !== e.pointerId) return;
      HOV = toW(s);
      drag(e, s);
      if (D && D.kind === "erase") dirty(true);
    });
    const up = e => {
      PTR.delete(e.pointerId);
      if (GEST) { if (touchPts().length < 2) GEST = null; return; }
      if (!D || D.id !== e.pointerId) return;
      if (e.type === "pointercancel") cancelDraw(); else finish(e, local(e));
    };
    frame.addEventListener("pointerup", up); frame.addEventListener("pointercancel", up);
    frame.addEventListener("pointerleave", e => { if (e.pointerType !== "touch" && !D) { HOV = null; dirty(true); } });
    frame.addEventListener("dblclick", e => {
      if (e.target.closest && e.target.closest(".wb-ta")) return;
      const it = hitItem(toW(local(e)), "t"); if (!it || !(T.tool === "select" || T.tool === "text")) return;
      if (ED && ED.it.id === it.id) return;
      select(null); editText(it, false, true);
    });
    frame.addEventListener("wheel", e => {
      e.preventDefault();
      const s = local(e), k = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? fh : 1;
      if (e.ctrlKey || e.metaKey) zoomAt(cam.z * Math.exp(-clamp(e.deltaY * k, -80, 80) * 0.01), s[0], s[1]);
      else { const dx = e.shiftKey && !e.deltaX ? e.deltaY : e.deltaX, dy = e.shiftKey && !e.deltaX ? 0 : e.deltaY; cam.x -= dx * k; cam.y -= dy * k; clampCam(); dirty(); camSave(); }
    }, {passive: false});
    let g0 = 1;
    frame.addEventListener("gesturestart", e => { e.preventDefault(); g0 = cam.z; });
    frame.addEventListener("gesturechange", e => { e.preventDefault(); const s = local(e); zoomAt(g0 * e.scale, s[0], s[1]); });
  }
  // Moving things without switching to Select
  function grabAt(w){ const it = hitItem(w); if (it) return "i" + it.id; const st = hitStroke(w); return st ? "s" + st.id : ""; }
  function armGrab(e, s, w){
    const k = grabAt(w); if (!k) return;
    const d = D; d.s0 = s;
    d.grabT = setTimeout(() => {
      if (D !== d) return;
      clearTimeout(d.snapT); D = {kind: "move", id: d.id, a: w, s, held: true};
      select(new Set([k])); SEL.drag = true; itemsDraw(); dirty();
      try { navigator.vibrate && navigator.vibrate(10); } catch (x) {}
    }, 450);
  }
  function begin(e, s, w){
    const t = T.tool;
    if (t !== "select" && t !== "eraser" && SEL) {
      const b = selBox(), hs = 14 / cam.z;
      if (b && Math.abs(w[0] - b[2]) < hs && Math.abs(w[1] - b[3]) < hs) { D = {kind: "scale", id: e.pointerId, b}; SEL.ax = b[0]; SEL.ay = b[1]; return; }
      if (b && w[0] >= b[0] - 6 / cam.z && w[0] <= b[2] + 6 / cam.z && w[1] >= b[1] - 6 / cam.z && w[1] <= b[3] + 6 / cam.z) { const one = SEL.ids.size === 1 ? [...SEL.ids][0] : ""; D = {kind: "move", id: e.pointerId, a: w, s, tap: t === "text" && one[0] === "i" ? one.slice(1) : ""}; return; }
      select(null);
    }
    if (t === "pen" || t === "hl") { D = {kind: t, id: e.pointerId, pts: [w], sm: w, raw: w, ptype: e.pointerType, t0: Date.now(), anchor: s}; armSnap(); armGrab(e, s, w); dirty(true); return; }
    if (t === "eraser") { opBegin(); HOV = w; D = {kind: "erase", id: e.pointerId, last: w}; eraseAt(w); dirty(true); return; }
    if (t === "shape") { D = {kind: "shape", id: e.pointerId, a: w, b: w, even: e.shiftKey}; armGrab(e, s, w); return; }
    if (t === "text") {
      const it = hitItem(w, "t");
      if (it) { select(new Set(["i" + it.id])); D = {kind: "move", id: e.pointerId, a: w, s}; return; }
      const f = textF(); editText(Object.assign({id: uid(), k: "t", x: Math.round(w[0]), y: Math.round(w[1] - f * 0.65), s: "", c: T.pen, f, at: Date.now(), ff: T.font}), true); return;
    }
    if (t === "select") {
      const b = selBox(), hs = 14 / cam.z;
      if (b && Math.abs(w[0] - b[2]) < hs && Math.abs(w[1] - b[3]) < hs) { D = {kind: "scale", id: e.pointerId, b}; SEL.ax = b[0]; SEL.ay = b[1]; return; }
      if (b && w[0] >= b[0] - 6 / cam.z && w[0] <= b[2] + 6 / cam.z && w[1] >= b[1] - 6 / cam.z && w[1] <= b[3] + 6 / cam.z) { D = {kind: "move", id: e.pointerId, a: w, s}; return; }
      const it = hitItem(w), st = it ? null : hitStroke(w);
      if (it || st) { select(new Set([it ? "i" + it.id : "s" + st.id])); D = {kind: "move", id: e.pointerId, a: w, s}; return; }
      select(null); D = {kind: "marq", id: e.pointerId, a: w, b: w};
    }
  }
  // Hold still for a moment at the end of a stroke
  function armSnap(){ clearTimeout(D.snapT); const d = D; d.snapT = setTimeout(() => { if (D !== d || d.snapped || d.pts.length < 4) return; const r = recognize(d.pts); if (r) { d.pts = r; d.snapped = true; try { navigator.vibrate && navigator.vibrate(8); } catch (e) {} dirty(true); } }, 600); }
  function drag(e, s){
    const w = toW(s);
    if (D.kind === "pan") { cam.x = D.c.x + s[0] - D.s[0]; cam.y = D.c.y + s[1] - D.s[1]; clampCam(); dirty(); return; }
    if (D.grabT && Math.hypot(s[0] - D.s0[0], s[1] - D.s0[1]) > 5) { clearTimeout(D.grabT); D.grabT = 0; }
    if (D.kind === "pen" || D.kind === "hl") {
      if (D.snapped) return;
      const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e], r = frame.getBoundingClientRect(), min = 0.7 / cam.z;
      (evs.length ? evs : [e]).forEach(ev => { const p = toW([ev.clientX - r.left, ev.clientY - r.top]), l = D.pts[D.pts.length - 1]; D.raw = p; if (Math.hypot(p[0] - l[0], p[1] - l[1]) >= min) D.pts.push(p); });
      if (Math.hypot(s[0] - D.anchor[0], s[1] - D.anchor[1]) > 5) { D.anchor = s; armSnap(); }
      dirty(true); return;
    }
    if (D.kind === "erase") { const step = EW[T.ew] / 4 / cam.z, a = D.last, n = Math.max(1, Math.ceil(Math.hypot(w[0] - a[0], w[1] - a[1]) / step)); for (let i = 1; i <= n; i++) eraseAt([a[0] + (w[0] - a[0]) * i / n, a[1] + (w[1] - a[1]) * i / n]); D.last = w; return; }
    if (D.kind === "shape") { D.b = w; D.even = e.shiftKey; dirty(true); return; }
    if (D.kind === "marq") { D.b = w; dirty(true); return; }
    if (D.kind === "move") { if (!SEL.drag && Math.hypot(s[0] - D.s[0], s[1] - D.s[1]) < 3) return; SEL.drag = true; SEL.dx = w[0] - D.a[0]; SEL.dy = w[1] - D.a[1]; itemsDraw(); dirty(); return; }
    if (D.kind === "scale") { const b = D.b; SEL.drag = true; SEL.k = clamp(Math.max((w[0] - b[0]) / Math.max(1, b[2] - b[0]), (w[1] - b[1]) / Math.max(1, b[3] - b[1])), 0.1, 12); itemsDraw(); dirty(); }
  }
  function finish(e, s){
    const d = D; D = null; clearTimeout(d.snapT); clearTimeout(d.grabT); frame.classList.remove("panning");
    if (d.kind === "move" && d.tap && !SEL.drag) { const it = getI(d.tap); select(null); if (it) editText(it); dirty(); return; }
    if (d.kind === "pen" || d.kind === "hl") {
      const pts = d.snapped ? d.pts : smoothStroke(d.pts.concat([d.raw]), d.ptype);
      inBoard(pts).forEach(run => { if (d.kind === "pen") addStroke("pen", T.pen, penW() * 10, run); else addStroke("hl", T.hl, hlW() * 10, run); });
    } else if (d.kind === "shape") {
      if (Math.hypot(d.b[0] - d.a[0], d.b[1] - d.a[1]) * cam.z >= 4) inBoard(shapePts(T.shape, d.a, d.b, e.shiftKey, penW())).forEach(run => addStroke("pen", T.pen, penW() * 10, run));
    } else if (d.kind === "erase") opEnd();
    else if (d.kind === "marq") { const b = [Math.min(d.a[0], d.b[0]), Math.min(d.a[1], d.b[1]), Math.max(d.a[0], d.b[0]), Math.max(d.a[1], d.b[1])]; if ((b[2] - b[0]) * cam.z > 3 || (b[3] - b[1]) * cam.z > 3) selectIn(b); }
    else if (d.kind === "move" || d.kind === "scale") { selCommit(); itemsDraw(); selbarDraw(); }
    else if (d.kind === "pan") camSave();
    dirty();
  }
  // The eraser: Erase Parts cuts the stroke where it passes and keeps the rest
  function eraseAt(w){
    const r = EW[T.ew] / 2 / cam.z, eb = [w[0] - r, w[1] - r, w[0] + r, w[1] + r];
    let hit = false;
    strokes().forEach(s => {
      const g = geo(s); if (!bbHit(g.bb, eb)) return;
      const pad = r + s.w / 20;
      if (T.erase === "whole") { if (nearLine(g.pts, w, pad)) { set("s", s.id, null); hit = true; } return; }
      if (!nearLine(g.pts, w, pad)) return;
      const h = EH[T.eh], dot = [Math.round(w[0] * 10) / 10, Math.round(w[1] * 10) / 10, Math.round(r * 10) / 10, h];
      if (h < 0.99) {
        const xs = s.x || [], seen = D && D.kind === "erase" ? (D.soft || (D.soft = new Map())) : null, last = seen ? seen.get(s.id) : xs[xs.length - 1];
        if (last && Math.hypot(last[0] - dot[0], last[1] - dot[1]) < r * 0.95) return;
        if (seen) seen.set(s.id, dot);
        set("s", s.id, Object.assign({}, s, {x: xs.concat([dot]).slice(-300)})); hit = true; return;
      }
      const reach = Math.max(0, r - s.w / 20), dense = densify(g.pts, Math.max(0.8, Math.min(r, s.w / 10) / 3)), out = dense.map(p => Math.hypot(p[0] - w[0], p[1] - w[1]) > reach);
      set("s", s.id, null); hit = true;
      let run = [];
      const push = () => {
        if (run.length >= 2) {
          const pts = simplify(run, 0.3), pb = pts.reduce((b, p) => [Math.min(b[0], p[0]), Math.min(b[1], p[1]), Math.max(b[2], p[0]), Math.max(b[3], p[1])], [Infinity, Infinity, -Infinity, -Infinity]), hw = s.w / 20;
          const near = e => e[0] + e[2] > pb[0] - hw && e[0] - e[2] < pb[2] + hw && e[1] + e[2] > pb[1] - hw && e[1] - e[2] < pb[3] + hw;
          const xs = (s.x || []).concat([dot]).filter(near).slice(-300);
          const gone = p => xs.some(e => e[3] >= 0.99 && Math.hypot(p[0] - e[0], p[1] - e[1]) < e[2]);
          if (!densify(pts, Math.max(0.8, r / 4)).every(gone)) { const nid = uid(); set("s", nid, Object.assign({id: nid, t: s.t, c: s.c, w: s.w, d: enc(pts), at: s.at}, xs.length ? {x: xs} : {})); }
        }
        run = []; };
      dense.forEach((p, i) => { if (out[i]) run.push(p); else push(); }); push();
    });
    items().forEach(it => { if ((it.k === "t" && eraseText(it, w, r)) || (it.k === "i" && erasePicture(it, w, r))) hit = true; });
    if (hit) { itemsDraw(); dirty(); }
  }

  // Typed text under the eraser
  function erasePicture(it, w, r){
    if (!(it.w > 0 && it.h > 0)) return false;
    const dx = Math.max(it.x - w[0], 0, w[0] - (it.x + it.w)), dy = Math.max(it.y - w[1], 0, w[1] - (it.y + it.h));
    if (Math.hypot(dx, dy) > r) return false;
    if (T.erase === "whole") { set("i", it.id, null); return true; }
    const er = Array.isArray(it.er) ? it.er : [], c = [Math.round((w[0] - it.x) / it.w * 1000), Math.round((w[1] - it.y) / it.h * 1000), Math.max(1, Math.round(r / it.w * 1000))];
    const last = er[er.length - 1];
    if (last && Math.hypot(last[0] - c[0], (last[1] - c[1]) * it.h / it.w) < c[2] * 0.35 && last[2] === c[2]) return false;
    if (er.length >= 800) { if (Date.now() - fullShown > 4000) { fullShown = Date.now(); toast("That picture can't take more erasing. Undo some, or delete it and add it again."); } return false; }
    set("i", it.id, Object.assign({}, it, {er: er.concat([c])}));
    return true;
  }
  function eraseText(it, w, r){
    const b = itemBB(it), dx = Math.max(b[0] - w[0], 0, w[0] - b[2]), dy = Math.max(b[1] - w[1], 0, w[1] - b[3]);
    if (Math.hypot(dx, dy) > r) return false;
    if (T.erase === "whole") { set("i", it.id, null); return true; }
    MC.font = `${it.f}px ${famOf(it.ff)}`;
    const lh = it.f * 1.3, lines = String(it.s).split("\n"), out = [];
    let block = [], blockStart = 0, changed = false;
    const flush = () => { if (block.length && block.join("").trim()) out.push({x: it.x, y: it.y + blockStart * lh, s: block.join("\n").replace(/\s+$/, "")}); block = []; };
    lines.forEach((ln, li) => {
      const y0 = it.y + li * lh, y1 = y0 + lh, pre = k => MC.measureText(ln.slice(0, k)).width;
      const gone = [];
      if (w[1] + r > y0 && w[1] - r < y1) for (let k = 0; k < ln.length; k++) {
        if (ln[k] === " ") continue;
        const x0 = it.x + pre(k), x1 = it.x + pre(k + 1), ddx = Math.max(x0 - w[0], 0, w[0] - x1), ddy = Math.max(y0 + lh * 0.12 - w[1], 0, w[1] - (y1 - lh * 0.12));
        if (Math.hypot(ddx, ddy) <= r) gone.push(k);
      }
      if (!gone.length) { if (!block.length) blockStart = li; block.push(ln); return; }
      changed = true; flush();
      let start = 0;
      const piece = (a, z) => { let t = ln.slice(a, z), lead = t.length - t.replace(/^\s+/, "").length; t = t.trim(); if (t) out.push({x: it.x + pre(a + lead), y: y0, s: t}); };
      gone.forEach(k => { piece(start, k); start = k + 1; }); piece(start, ln.length);
    });
    if (!changed) return false;
    flush();
    set("i", it.id, null);
    out.forEach(p => { const id = uid(); set("i", id, Object.assign({}, it, {id, x: Math.round(p.x), y: Math.round(p.y), s: p.s})); });
    return true;
  }

  /* Keys (while the board has focus) */
  function bindKeys(){
    frame.addEventListener("keydown", e => {
      if (e.target !== frame && !(e.target.closest && e.target.closest(".wb-selbar,.wb-zoom"))) return;
      const k = e.key.toLowerCase(), mod = e.ctrlKey || e.metaKey;
      if (e.target !== frame && !mod && !["delete", "backspace", "escape"].includes(k)) return;
      let done = true;
      if (mod && k === "z") e.shiftKey ? redo() : undo();
      else if (mod && k === "y") redo();
      else if (mod && k === "a") { setTool("select"); selectIn([-1, -1, BW + 1, BH + 1]); }
      else if (mod && k === "d") selCopy();
      else if ((k === "delete" || k === "backspace") && SEL) selDelete();
      else if (k === "escape") { if (SEL) select(null); else done = false; }
      else if (k === " ") { spaceDown = true; frame.classList.add("pan-ready"); }
      else if (!mod && !e.altKey && (k === "+" || k === "=")) zoomStep(1);
      else if (!mod && !e.altKey && k === "-") zoomStep(-1);
      else if (!mod && !e.altKey && k === "0") zoomAt(1);
      else if (!mod && !e.altKey && TOOLS.some(t => t[2].toLowerCase() === k)) setTool(TOOLS.find(t => t[2].toLowerCase() === k)[0]);
      else done = false;
      if (done) { e.preventDefault(); e.stopPropagation(); }
    });
    frame.addEventListener("keyup", e => { if (e.key === " ") { spaceDown = false; frame.classList.remove("pan-ready"); } });
    frame.addEventListener("blur", () => { spaceDown = false; frame.classList.remove("pan-ready"); });
  }

  /* The marker tray (tools under the board) */
  function setTool(t){ fontMenu(false); if (ED && t !== "text") endText(); if (t !== "select" && SEL) select(null); T.tool = t; saveT(); trayDraw(); dirty(true); }
  function trayDraw(){
    if (!tray) return;
    // Editing or selecting text shows the text options, so size and writing style apply to it
    const t0 = T.tool, onlyText = !!SEL && [...SEL.ids].every(k => { const it = k[0] === "i" && getI(k.slice(1)); return it && it.k === "t"; });
    const t = ED || onlyText ? "text" : t0, b = (wb, id, label, inner, pressed, extra) => `<button type="button" data-wb="${wb}" data-id="${esc(id)}" aria-label="${esc(label)}" title="${esc(label)}" aria-pressed="${pressed}"${extra || ""}>${inner}</button>`;
    const markers = (list, cur, wb) => `<div class="wb-markers" role="group" aria-label="Colors">${list.map(p => `<button type="button" class="wb-mk${p[0] === cur ? " on" : ""}" data-wb="${wb}" data-id="${p[0]}" style="--mk:${p[2]}" aria-label="${esc(p[1])}" title="${esc(p[1])}" aria-pressed="${p[0] === cur}"><span class="wb-cap"></span><span class="wb-body"></span></button>`).join("")}</div>`;
    const sizes = (arr, names, cur, wb, max) => `<div class="wb-sizes" role="group" aria-label="Size">${arr.map((v, i) => b(wb, i, names[i], `<span class="wb-sz" style="--s:${Math.round(4 + (v / max) * 14)}px"></span>`, i === cur, ` class="${i === cur ? "on" : ""}"`)).join("")}</div>`;
    let opts = "";
    if (t === "pen" || t === "shape" || t === "text") {
      const any = !!hexOf(T.pen), lk = proLocked();
      opts = markers(PEN, T.pen, "pen").replace(/<\/div>$/, `<button type="button" class="wb-mk wb-mk-any${any ? " on" : ""}" data-wb="pen-any" style="--mk:${any ? hexOf(T.pen) : T.custom}" aria-label="Any color${lk ? " (Studyboard Pro)" : ""}" title="Any Color${lk ? " (Pro)" : ""}" aria-pressed="${any}"><span class="wb-cap"></span><span class="wb-body"><span class="wb-dot-in"></span></span>${lk ? '<span class="wb-pro">PRO</span>' : ""}</button></div>`);
    }
    if (t === "hl") opts = markers(HLC, T.hl, "hl");
    if (t === "pen") opts += sizes(PW, PWN, T.pw, "pw", 20);
    if (t === "hl") opts += sizes(HW, HWN, T.hw, "hw", 60);
    if (t === "shape") opts += `<div class="wb-shapes" role="group" aria-label="Shape">${SHAPES.map(s => b("shape", s[0], s[1], SV(s[2]), s[0] === T.shape, ` class="${s[0] === T.shape ? "on" : ""}"`)).join("")}</div>` + sizes(PW, PWN, T.pw, "pw", 20);
    if (t === "text") opts += `<button type="button" class="wb-fontpick wb-sizepick" data-wb="dd-menu" data-id="size" aria-haspopup="listbox" aria-expanded="false" aria-label="Text size: ${esc(TSN[T.ts])}" title="Text size"><span class="wb-fp-name"><span class="wb-fp-a" aria-hidden="true">A</span>${esc(TSN[T.ts])}</span>${CHEV}</button>`;
    if (t === "text") { const cf = FONTS.find(f => f[0] === T.font) || FONTS[0]; opts += `<button type="button" class="wb-fontpick" data-wb="dd-menu" data-id="font" aria-haspopup="listbox" aria-expanded="false" aria-label="Writing style: ${esc(cf[1])}" title="Writing style"><span class="wb-fp-name" style="font-family:${famOf(cf[0])}">${esc(cf[1])}</span>${CHEV}</button>`; }
    if (t === "eraser") opts = sizes(EW, EWN, T.ew, "ew", 64) + `<div class="wb-seg" role="group" aria-label="What the eraser takes">${b("erase", "part", "Erase Parts", "Parts", T.erase === "part")}${b("erase", "whole", "Whole Strokes", "Whole Strokes", T.erase === "whole")}</div>`
      + (T.erase === "part" ? `<div class="wb-seg" role="group" aria-label="Eraser hardness">${EHN.map((nm, i) => b("eh", i, nm + " eraser", nm, T.eh === i)).join("")}</div>` : "");
    if (t === "select") opts = `${b("sel-all", "", "Select Everything", "Select All", false, ' class="wb-txt"')}`;
    const tn = (TOOLS.find(x => x[0] === t) || [0, "Tools"])[1];
    // the head only shows on the side panel (wide screens)
    tray.innerHTML = `<div class="wb-tray-head" aria-hidden="true">${esc(tn)}</div><div class="wb-tools" role="group" aria-label="Tools">${TOOLS.map(x => b("tool", x[0], x[1] + " (" + x[2] + ")", IC[x[0]], x[0] === t0, ` class="wb-tool${x[0] === t0 ? " on" : ""}"`)).join("")}${fire("wb-tools").filter(Boolean).join("")}</div>
      <div class="wb-hist" role="group" aria-label="Undo and redo">${b("undo", "", "Undo (Ctrl+Z)", IC.undo, false, ' class="wb-u"')}${b("redo", "", "Redo (Ctrl+Shift+Z)", IC.redo, false, ' class="wb-r"')}</div>
      <div class="wb-opts">${opts}</div>`;
    frame.dataset.tool = t0;
    trayState();
  }
  // A writing style
  let FM = null;
  // kind: "font" (writing style) or "size" (text size)
  function fontMenu(open, kind){
    const wasKind = FM && FM.dataset.kind;
    tray && tray.querySelectorAll(".wb-fontpick").forEach(b => b.setAttribute("aria-expanded", "false"));
    if (FM) { FM.remove(); FM = null; }
    if (open === false || (open === undefined && wasKind === kind)) return;
    const btn = tray && tray.querySelector(`.wb-fontpick[data-id="${kind}"]`); if (!btn) return;
    FM = document.createElement("div"); FM.className = "wb-fontmenu"; FM.dataset.kind = kind; FM.setAttribute("role", "listbox"); FM.setAttribute("aria-label", kind === "size" ? "Text size" : "Writing style");
    FM.innerHTML = kind === "size"
      ? TSN.map((nm, i) => `<button type="button" role="option" class="wb-fm-opt wb-fm-size${i === T.ts ? " on" : ""}" aria-selected="${i === T.ts}" data-wb="tsize" data-id="${i}"><span style="font-size:${[15, 19, 24, 30][i]}px;font-family:${famOf(T.font)}">Aa</span>${esc(nm)}</button>`).join("")
      : FONTS.map(f => `<button type="button" role="option" class="wb-fm-opt${f[0] === T.font ? " on" : ""}" aria-selected="${f[0] === T.font}" data-wb="font" data-id="${f[0]}" style="font-family:${famOf(f[0])}">${esc(f[1])}</button>`).join("");
    STAGE.appendChild(FM);
    const r = btn.getBoundingClientRect(), sr = STAGE.getBoundingClientRect();
    FM.style.left = Math.max(6, Math.min(r.left - sr.left, sr.width - FM.offsetWidth - 6)) + "px";
    FM.style.top = (r.bottom - sr.top + 6) + "px";
    btn.setAttribute("aria-expanded", "true");
    const cur = FM.querySelector(".on") || FM.firstChild; if (cur) cur.focus({preventScroll: true});
  }
  document.addEventListener("pointerdown", e => { if (FM && !(e.target.closest && e.target.closest(".wb-fontmenu,.wb-fontpick"))) fontMenu(false); }, true);
  document.addEventListener("keydown", e => {
    if (!FM) return;
    const opts = [...FM.querySelectorAll(".wb-fm-opt")], i = opts.indexOf(document.activeElement);
    if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); const k = FM.dataset.kind; fontMenu(false); const b = tray.querySelector(`.wb-fontpick[data-id="${k}"]`); if (b) b.focus(); }
    else if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); const n = opts[(i + (e.key === "ArrowDown" ? 1 : -1) + opts.length) % opts.length]; if (n) n.focus(); }
  }, true);
  // A text size: for new text, and for the text being typed or selected
  function setSize(i){
    T.ts = clamp(i, 0, TS.length - 1); saveT(); trayDraw();
    const f = textF();
    if (ED) { ED.it = Object.assign({}, ED.it, {f}); ED.ta.style.fontSize = f + "px"; fitTa(); return; }
    if (SEL) { const ts = items().filter(it => it.k === "t" && SEL.ids.has("i" + it.id) && it.f !== f); if (ts.length) { opBegin(); ts.forEach(it => set("i", it.id, Object.assign({}, it, {f}))); opEnd(); selbarDraw(); } }
  }
  function setFont(ff){
    if (!FONTS.some(f => f[0] === ff)) return;
    T.font = ff; saveT(); trayDraw();
    const v = it => Object.assign({}, it, {ff});
    if (ED) { ED.it = v(ED.it); ED.ta.style.fontFamily = famOf(ff); fitTa(); return; }
    if (SEL) { const ts = items().filter(it => it.k === "t" && SEL.ids.has("i" + it.id) && (it.ff || "marker") !== ff); if (ts.length) { opBegin(); ts.forEach(it => set("i", it.id, v(it))); opEnd(); selbarDraw(); } }
  }
  // The rainbow marker (Pro)
  let CP = null;
  const hsv2hex = (h, s, v) => { const f = n => { const k = (n + h / 60) % 6; return v - v * s * Math.max(0, Math.min(k, 4 - k, 1)); }; return "#" + [f(5), f(3), f(1)].map(x => Math.round(x * 255).toString(16).padStart(2, "0")).join(""); };
  const hex2hsv = hex => { const n = parseInt(hex.slice(1), 16), r = (n >> 16) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
    let h = 0; if (d) h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h = (h * 60 + 360) % 360; return [h, mx ? d / mx : 0, mx]; };
  const SWATCH = ["#ff3b30", "#ff9500", "#ffcc00", "#34c759", "#00c7be", "#30b0c7", "#007aff", "#5856d6", "#af52de", "#ff2d55", "#a2845e", "#8e8e93", "#e83e8c", "#20c997", "#6f42c1", "#fd7e14"];
  function closePicker(apply){ if (!CP) return; const c = CP; CP = null; if (apply !== false && !c.live && c.hex !== c.start) c.done(c.hex); c.el.remove(); }
  function pickAny(btn, done, live, opt){
    if (proLocked()) { if (typeof PLAN !== "undefined" && PLAN) PLAN.openSheet("Drawing in any color is part of Studyboard Pro: the rainbow marker opens a full color picker for markers, shapes and text."); return; }
    if (CP) { const same = CP.btn === btn; closePicker(); if (same) return; }
    const start = (opt && opt.start) || T.custom || "#e83e8c"; let [h, sa, va] = hex2hsv(start);
    const el = document.createElement("div"); el.className = "wb-cpick"; el.setAttribute("role", "dialog"); el.setAttribute("aria-label", "Pick a color");
    const recent = (T.recent || []).filter(x => /^#[0-9a-f]{6}$/.test(x));
    el.innerHTML = `<div class="wb-cp-sv" tabindex="0" aria-label="Shade (arrow keys change it)"><span class="wb-cp-k"></span></div>
      <input type="range" class="wb-cp-hue" min="0" max="359" step="1" aria-label="Hue">
      <div class="wb-cp-row"><span class="wb-cp-now" aria-hidden="true"></span><label class="wb-cp-hexl"><span>#</span><input class="wb-cp-hex" maxlength="7" spellcheck="false" autocomplete="off" aria-label="Hex color"></label><button type="button" class="btn small primary wb-cp-done">Done</button></div>
      <div class="wb-cp-sw" role="group" aria-label="Colors">${SWATCH.map(c => `<button type="button" class="wb-cp-s" data-c="${c}" style="--c:${c}" aria-label="${c}"></button>`).join("")}</div>
      ${recent.length ? `<div class="wb-cp-lbl">Recent</div><div class="wb-cp-sw" role="group" aria-label="Recent colors">${recent.map(c => `<button type="button" class="wb-cp-s" data-c="${c}" style="--c:${c}" aria-label="${c}"></button>`).join("")}</div>` : ""}`;
    STAGE.appendChild(el);
    CP = {el, btn, done, live, start, hex: start};
    const sv = el.querySelector(".wb-cp-sv"), k = el.querySelector(".wb-cp-k"), hue = el.querySelector(".wb-cp-hue"), hexIn = el.querySelector(".wb-cp-hex"), now = el.querySelector(".wb-cp-now");
    const show = (fromHex, init) => {
      const hex = hsv2hex(h, sa, va); CP.hex = hex;
      sv.style.backgroundColor = `hsl(${h},100%,50%)`; k.style.left = sa * 100 + "%"; k.style.top = (1 - va) * 100 + "%"; k.style.background = hex;
      hue.value = Math.round(h); now.style.background = hex; if (!fromHex) hexIn.value = hex.slice(1);
      if (live && !(init && opt && opt.quiet)) done(hex);
    };
    show(false, true);
    const svAt = e => { const r = sv.getBoundingClientRect(); sa = clamp((e.clientX - r.left) / r.width, 0, 1); va = clamp(1 - (e.clientY - r.top) / r.height, 0, 1); show(); };
    sv.addEventListener("pointerdown", e => { e.preventDefault(); sv.setPointerCapture(e.pointerId); svAt(e); const mv = ev => svAt(ev), up = () => { sv.removeEventListener("pointermove", mv); sv.removeEventListener("pointerup", up); }; sv.addEventListener("pointermove", mv); sv.addEventListener("pointerup", up); });
    sv.addEventListener("keydown", e => { const d = e.shiftKey ? 0.1 : 0.02; if (e.key === "ArrowLeft") sa = clamp(sa - d, 0, 1); else if (e.key === "ArrowRight") sa = clamp(sa + d, 0, 1); else if (e.key === "ArrowUp") va = clamp(va + d, 0, 1); else if (e.key === "ArrowDown") va = clamp(va - d, 0, 1); else return; e.preventDefault(); show(); });
    hue.addEventListener("input", () => { h = Number(hue.value) || 0; show(); });
    hexIn.addEventListener("input", () => { const v = hexIn.value.replace(/[^0-9a-f]/gi, "").toLowerCase(); if (v.length === 6) { [h, sa, va] = hex2hsv("#" + v); show(true); } });
    hexIn.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); finish(); } });
    el.addEventListener("click", e => { const b = e.target.closest(".wb-cp-s"); if (b) { [h, sa, va] = hex2hsv(b.dataset.c); show(); } if (e.target.closest(".wb-cp-done")) finish(); });
    el.addEventListener("pointerdown", e => e.stopPropagation());
    el.addEventListener("keydown", e => { e.stopPropagation(); if (e.key === "Escape") { e.preventDefault(); finish(); } });
    const finish = () => { const hex = CP && CP.hex; if (hex) { T.custom = hex; T.recent = [hex].concat((T.recent || []).filter(x => x !== hex)).slice(0, 8); saveT(); } closePicker(); if (btn && btn.isConnected) btn.focus({preventScroll: true}); };
    CP.finish = finish;
    const r = btn.getBoundingClientRect(), sr = STAGE.getBoundingClientRect(), w = el.offsetWidth, hh = el.offsetHeight;
    el.style.left = clamp(r.left + r.width / 2 - w / 2 - sr.left, 6, Math.max(6, sr.width - w - 6)) + "px";
    el.style.top = (r.bottom - sr.top + hh + 8 <= sr.height ? r.bottom - sr.top + 8 : Math.max(6, r.top - sr.top - hh - 8)) + "px";
    setTimeout(() => sv.focus({preventScroll: true}), 0);
  }
  document.addEventListener("pointerdown", e => { if (CP && !(e.target.closest && e.target.closest(".wb-cpick")) && e.target !== CP.btn && !(CP.btn && CP.btn.contains(e.target))) CP.finish(); }, true);
  function trayState(){ if (!tray) return; const u = tray.querySelector(".wb-u"), r = tray.querySelector(".wb-r"); if (u) u.disabled = !(B && B.undo.length); if (r) r.disabled = !(B && B.redo.length); }
  function onStageClick(e){
    const el = e.target.closest("[data-wb]"); if (!el || !STAGE.contains(el)) return;
    const a = el.dataset.wb, id = el.dataset.id;
    switch (a) {
      case "tool": setTool(id); break;
      case "pen": T.pen = id; saveT(); trayDraw(); break;
      case "pen-any": pickAny(el, hex => { T.custom = hex; T.pen = codeOf(hex); saveT(); const m = tray.querySelector(".wb-mk-any"); if (m) { m.style.setProperty("--mk", hex); tray.querySelectorAll(".wb-mk").forEach(x => { x.classList.toggle("on", x === m); x.setAttribute("aria-pressed", String(x === m)); }); } }, true); return;
      case "sel-any": { const base = B ? B.undo.length : 0, one = SEL && SEL.ids.size === 1 ? [...SEL.ids][0] : "", cur = one ? (one[0] === "s" ? (getS(one.slice(1)) || {}).c : (getI(one.slice(1)) || {}).c || (getI(one.slice(1)) || {}).tint) : "";
        pickAny(el, hex => { selColor(codeOf(hex)); if (!B) return; while (B.undo.length > base + 1) { const last = B.undo.pop(), prev = B.undo[B.undo.length - 1]; last.forEach(c => { const p = prev.find(x => x.t === c.t && x.id === c.id); if (p) p.after = c.after; else prev.push(c); }); } }, true, {start: hexOf(cur) || "", quiet: true}); return; }
      case "hl": T.hl = id; saveT(); trayDraw(); break;
      case "pw": case "hw": case "ew": case "ts": T[a] = Number(id) || 0; saveT(); trayDraw(); break;
      case "font": fontMenu(false); setFont(id); break;
      case "tsize": fontMenu(false); setSize(Number(id) || 0); break;
      case "dd-menu": fontMenu(undefined, id); break;
      case "shape": T.shape = id; saveT(); trayDraw(); break;
      case "erase": T.erase = id === "whole" ? "whole" : "part"; saveT(); trayDraw(); break;
      case "eh": T.eh = clamp(Number(id) || 0, 0, 2); saveT(); trayDraw(); break;
      case "undo": undo(); break;
      case "redo": redo(); break;
      case "sel-all": selectIn([-1, -1, BW + 1, BH + 1]); break;
      case "sel-del": selDelete(); break;
      case "sel-copy": selCopy(); break;
      case "sel-color": selColor(id); break;
      case "sel-edit": { const k = [...SEL.ids][0], it = getI(k.slice(1)); select(null); if (it) editText(it); break; }
      case "zoom-in": zoomStep(1); break;
      case "zoom-out": zoomStep(-1); break;
      // phones pinch to zoom, so the % fits the board to the screen instead
      case "zoom-reset": if (PHONE()) { if (fixedPage()) zoomAt(ZMIN); else fit(); } else zoomAt(1); break;
      case "fit": fit(); break;
      case "theme": setBoardTheme(DK ? "light" : "dark"); themeBtn(); break;
      default: fire("wb-act", a, el, id); return;
    }
    if (!/^sel-|^zoom|^fit/.test(a) || a === "sel-all") frame.focus({preventScroll: true});
  }

  /* Open a board, put the stage on the page */
  function openBoard(id){
    endText(); flush();
    B = {id, pS: new Map(), pI: new Map(), undo: [], redo: [], ref: null, timer: 0};
    GEO.clear(); SEL = null; D = null; GEST = null; const c = camLoad(id); cam = c || {x: 40, y: 40, z: 0.3}; B.fitNext = !c; itemsSig = "";
    ui.wbCur = id; lsSet(K_CUR, id); selbarDraw(); trayState();
    fire("wb-open", id);
  }
  function mount(){
    const host = document.getElementById("wbHost"); if (!host) return;
    const id = curId(); if (!id) return;
    build(); themeCheck();
    if (!B || B.id !== id) openBoard(id);
    const typing = ED && document.activeElement === ED.ta;
    const mb = STAGE.querySelector(".wb-max"); if (mb) mb.outerHTML = boardMaxBtn("wb-max");
    if (STAGE.parentNode !== host) host.appendChild(STAGE);
    sizeHost(host); resize(); trayDraw();
    if (B.fitNext && fw > 0) { B.fitNext = false; fit(true); }
    if (typing) try { ED.ta.focus({preventScroll: true}); } catch (e) {}
    const n = state.notes[id];
    if (n !== B.ref) {
      const tpl = (n.wb && n.wb.tpl) || "blank", box = STAGE.querySelector(".wb-tplbox");
      const key = tpl + "|" + ((n.wb && n.wb.pa) || "") + "|" + (DK ? "d" : "l");
      if (box.dataset.tpl !== key) { box.innerHTML = tplSvg(tpl, false, n.wb && n.wb.pa, DK ? PAL_D : PAL_L); box.dataset.tpl = key; }
      B.ref = n; itemsDraw(); if (SEL) selbarDraw();
    }
    dirty();
    const pick = document.querySelector("[data-wb-pick]");
    if (pick) pick.addEventListener("change", () => { const v = pick.value; if (v === "__new") { pick.value = id; newSheet(); return; } if (state.notes[v]) { ui.wbCur = v; render(); } });
  }
  hook("render", tab => {
    if (tab === "notes" && on()) {
      mount();
    } else if (B) { endText(); flush(); }
  });
  window.addEventListener("pagehide", () => { endText(); flush(); });
  const SUN = '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4"/></svg>';
  const MOON = '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/></svg>';
  function themeBtn(){ const b = STAGE && STAGE.querySelector(".wbz-theme"); if (!b) return; b.innerHTML = DK ? SUN : MOON; const t = DK ? "Light Board" : "Dark Board"; b.title = t; b.setAttribute("aria-label", t); }
  function setBoardTheme(v){ state.settings = Object.assign({}, state.settings, {wbTheme: v === "light" || v === "dark" ? v : "auto"}); saveSettings(); themeCheck(); }
  const themeCheck = () => { const d = boardDark(); if (d !== DK) setTimeout(() => fire("wb-theme", d), 0); if (STAGE) { STAGE.classList.toggle("wb-dk", d); themeBtn(); } if (d === DK) return; DK = d; if (STAGE) { const box = STAGE.querySelector(".wb-tplbox"); if (box) box.dataset.tpl = ""; if (B) B.ref = null; } itemsSig = ""; itemsDraw(true); dirty(); if (ui.tab === "notes" && on()) mount(); };
  try { new MutationObserver(themeCheck).observe(document.documentElement, {attributes: true, attributeFilter: ["data-theme", "class"]}); } catch (e) {}
  try { matchMedia("(prefers-color-scheme: dark)").addEventListener("change", themeCheck); } catch (e) {}
  document.addEventListener("visibilitychange", () => { if (document.hidden) { endText(); flush(); } });
  window.addEventListener("resize", () => { const h = document.getElementById("wbHost"); if (h && STAGE && h.contains(STAGE)) { if ((ED || kbUp()) && TOUCH()) return; sizeHost(h); resize(); } });

  /* The page */
  function picker(list, cur){
    return `<label class="wb-pick"><select data-wb-pick aria-label="Whiteboard">${list.map(b => { const bc = courseOf(b.courseId); return `<option value="${esc(b.id)}"${b.id === cur ? " selected" : ""}>${esc(boardName(b))}${bc ? " · " + esc(bc.code || bc.name) : ""}</option>`; }).join("")}<option value="__new">+ New Whiteboard…</option></select></label>`;
  }
  function tiles(name, cur, asButtons, noBlank){
    return TPL.filter(t => !noBlank || t[0] !== "blank").map(([id, label]) => asButtons
      ? `<button type="button" class="wb-tile" data-act="wb-quick" data-id="${id}"><span class="wb-tpv">${tplSvg(id, true)}</span><span class="wb-tl">${esc(label)}</span></button>`
      : `<label class="wb-tile"><input type="radio" name="${name}" value="${id}"${id === cur ? " checked" : ""}><span class="wb-tpv">${tplSvg(id, true)}</span><span class="wb-tl">${esc(label)}</span></label>`).join("");
  }
  function view(){
    const list = boards(), cur = curId();
    const extra = fire("wb-head", cur).filter(Boolean).join("");
    const DOTS = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><circle cx="5.5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="18.5" cy="12" r="1.8"/></svg>';
    const tab = b => { const bc = courseOf(b.courseId), on = b.id === cur; return `<button type="button" role="tab" class="nb-tab${on ? " on" : ""}" aria-selected="${on}" data-act="wb-go" data-id="${esc(b.id)}" style="--c:${esc(bc ? bc.color : "var(--muted)")}"><span class="sd"></span><span class="nb-tn">${esc(boardName(b))}</span></button>${on ? `<button type="button" class="icon-btn sm" data-act="wb-opts" aria-label="Board options" title="Board options">${DOTS}</button>` : ""}`; };
    const strip = list.length ? `<div class="nb-boards wb-boards" role="tablist" aria-label="Whiteboards">${list.map(tab).join("")}</div>` : "";
    const headHtml = `<div class="tl-controls f-title wb-head"><h2>Whiteboard</h2>${list.length ? `${picker(list, cur)}<button class="btn small" data-act="wb-all">All Boards</button>${extra}<button class="btn small" data-act="wb-export">Export</button><button class="btn small wb-optbtn" data-act="wb-opts" aria-label="Board options" title="Board options"><svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><circle cx="5.5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="18.5" cy="12" r="1.8"/></svg></button>` : ""}</div>${strip}`;
    if (!list.length) return headHtml + `<div class="wb-empty"><div class="wb-empty-in"><h3>Start a Whiteboard</h3><p>Sketch, write and plan with markers on a big board you can zoom around.</p>
      <button type="button" class="wb-blank-go" data-act="wb-quick" data-id="blank"><span class="wb-tpv"></span><span><b>Blank Board</b><span class="mini">Start from a clean white board</span></span></button>
      <h4 class="wb-or">Or Start From a Template</h4><div class="wb-tiles">${tiles("", "", true, true)}</div></div></div>`;
    return headHtml + `<div class="wb-host" id="wbHost"></div>`;
  }

  /* Sheets: new board, options, all boards, export */
  const courseOpts = cur => `<option value="">No course</option>${coursesArr().map(c => `<option value="${esc(c.id)}"${c.id === cur ? " selected" : ""}>${esc(courseLabel(c))}</option>`).join("")}`;
  function newSheet(tpl){
    openSheet(`<form class="sheet wb-sheet">${head("New Whiteboard")}<div class="sheet-body">
      <label class="f"><span class="lh">Name ${REQ}</span><input type="text" name="name" required maxlength="60" value="${esc(nextName())}"></label>
      <fieldset class="wb-tplset"><legend>Start With</legend>
        <div class="segb wb-start" role="radiogroup" aria-label="Start with"><label><input type="radio" name="start" value="blank"${!tpl || tpl === "blank" ? " checked" : ""}> Blank Board</label><label><input type="radio" name="start" value="tpl"${tpl && tpl !== "blank" ? " checked" : ""}> A Template</label></div>
        <div class="wb-tiles wb-tpl-pick"${!tpl || tpl === "blank" ? " hidden" : ""}>${tiles("tpl", tpl && tpl !== "blank" ? tpl : "grid", false, true)}</div></fieldset>
      <label class="f">Course<select name="courseId">${courseOpts("")}</select></label></div>
      <div class="sheet-foot"><span class="spacer"></span><button type="button" class="btn" data-act="close">Cancel</button><button type="submit" class="btn primary" data-submit>Create Whiteboard</button></div></form>`, fd => {
      const name = String(fd.get("name") || "").replace(/\s+/g, " ").trim().slice(0, 60); if (!name) return false;
      create(name, fd.get("start") === "tpl" ? String(fd.get("tpl") || "blank") : "blank", String(fd.get("courseId") || "")); render();
    });
    dlg.querySelectorAll('input[name="start"]').forEach(r => r.addEventListener("change", () => { const pick = dlg.querySelector(".wb-tpl-pick"); if (pick) pick.hidden = dlg.querySelector('input[name="start"]:checked').value !== "tpl"; }));
    setTimeout(() => { const i = dlg.querySelector('input[name="name"]'); if (i) { i.focus(); i.select(); } }, 30);
  }
  function optsSheet(){
    const id = curId(), n = state.notes[id]; if (!n) return;
    openSheet(`<form class="sheet wb-sheet">${head("Board Options")}<div class="sheet-body">
      <div class="wb-opt-acts" role="group" aria-label="Board actions">${fire("wb-opt-acts", id).filter(Boolean).join("")}<button type="button" class="btn" data-wbo="dup" title="Make a copy of this board">Duplicate</button><button type="button" class="btn" data-wbo="clear" title="Clear everything off the board">Clear</button></div>
      <label class="f"><span class="lh">Name ${REQ}</span><input type="text" name="name" required maxlength="60" value="${esc(boardName(n))}"></label>
      <label class="f">Course<select name="courseId">${courseOpts(n.courseId)}</select></label>
      <fieldset class="wb-tplset"><legend>Template</legend><div class="wb-tiles">${tiles("tpl", n.wb.tpl)}</div></fieldset>
      </div>
      <div class="sheet-foot"><button type="button" class="btn danger" data-wbo="del">Delete</button><span class="spacer"></span><button type="button" class="btn" data-act="close">Cancel</button><button type="submit" class="btn primary" data-submit>Save</button></div></form>`, fd => {
      const name = String(fd.get("name") || "").replace(/\s+/g, " ").trim().slice(0, 60); if (!name) return false;
      const cur = state.notes[id]; if (!cur) return;
      flush();
      const after = Object.assign(clone(state.notes[id]), {text: name, courseId: String(fd.get("courseId") || ""), updated: Date.now()});
      const nt = String(fd.get("tpl") || "blank");
      after.wb = Object.assign({}, after.wb, {tpl: nt}, nt !== (cur.wb && cur.wb.tpl) ? {pa: pageAspect()} : {});
      applyChanges([{kind: "note", id, after}], "Board saved");
    });
    const box = STAGE && STAGE.querySelector(".wb-tplbox"), pa = (n.wb && n.wb.pa) || pageAspect();
    dlg.querySelectorAll('input[name="tpl"]').forEach(r => r.addEventListener("change", () => { if (box && r.checked) { box.innerHTML = tplSvg(r.value, false, r.value === (n.wb && n.wb.tpl) ? pa : pageAspect(), DK ? PAL_D : PAL_L); box.dataset.tpl = "preview"; } }));
    dlg.addEventListener("close", () => { if (box && box.dataset.tpl === "preview") { box.dataset.tpl = ""; if (B) B.ref = null; mount(); } }, {once: true});
    dlg.querySelectorAll("[data-wbo]").forEach(b => b.addEventListener("click", () => {
      const a = b.dataset.wbo, cur = state.notes[id]; if (!cur) return;
      if (a === "dup") { flush(); const src = clone(state.notes[id]); delete src.id; const nid = create(boardName(src) + " (Copy)", src.wb.tpl, src.courseId, {wbInk: src.wbInk, wbItems: src.wbItems, wb: Object.assign({}, src.wb, {g: undefined})}); dlg.close(); ui.wbCur = nid; render(); toast("Copy made"); }
      if (a === "clear") { dlg.close(); clearBoard(); }
      if (a === "del") { dlg.close(); confirmSheet("Delete Whiteboard?", `“${boardName(cur)}” goes to Recently Deleted, where you can bring it back for 30 days.`, "Delete", () => { endText(); flush(); B = null; ui.wbCur = ""; applyChanges([{kind: "note", id, after: null}], "Whiteboard deleted"); }); }
    }));
  }
  function clearBoard(){
    if (!B || (!strokes().length && !items().length)) { toast("The board is already empty"); return; }
    endText(); opBegin(); strokes().forEach(s => set("s", s.id, null)); items().forEach(it => set("i", it.id, null)); SEL = null; opEnd(); selbarDraw();
    toast("Board cleared", () => undo());
  }
  const THUMB = new Map();
  function allSheet(){
    openSheet(`<div class="sheet wb-all-sheet">${head("All Whiteboards")}<div class="sheet-body"><input type="search" id="wbQ" placeholder="Search boards" aria-label="Search boards" data-noenter><div class="wb-grid" id="wbGrid"></div></div></div>`);
    const q = $("#wbQ"), grid = $("#wbGrid");
    const draw = () => {
      const k = q.value.trim().toLowerCase();
      const list = boards().filter(b => { const c = courseOf(b.courseId); return !k || [boardName(b), c && c.name, c && c.code].join(" ").toLowerCase().includes(k); });
      grid.innerHTML = list.map(b => { const c = courseOf(b.courseId); return `<button type="button" class="wb-card${b.id === curId() ? " on" : ""}" data-wbopen="${esc(b.id)}"><span class="wb-thumb" data-thumb="${esc(b.id)}"></span><span class="wb-cn">${esc(boardName(b))}</span><span class="wb-cm">${c ? `<span class="dot" style="background:${esc(c.color)}"></span>${esc(c.code || c.name)} · ` : ""}${esc(new Date(b.updated || b.created || Date.now()).toLocaleDateString(undefined, {month: "short", day: "numeric"}))}</span></button>`; }).join("")
        + `<button type="button" class="wb-card wb-card-new" data-wbnew><span class="wb-thumb"><span>+</span></span><span class="wb-cn">New Whiteboard</span></button>`;
      grid.querySelectorAll("[data-thumb]").forEach(async el => {
        const n = state.notes[el.dataset.thumb]; if (!n) return;
        const key = n.id + ":" + (n.updated || 0); let url = THUMB.get(key);
        if (!url) { try { const cv = await renderBoard(n, {max: 360, full: true}); url = cv.toDataURL("image/png"); THUMB.set(key, url); } catch (e) { return; } }
        el.innerHTML = `<img src="${esc(url)}" alt="">`;
      });
    };
    q.addEventListener("input", draw); draw();
    grid.addEventListener("click", e => {
      const o = e.target.closest("[data-wbopen]"); if (o) { ui.wbCur = o.dataset.wbopen; dlg.close(); render(); return; }
      if (e.target.closest("[data-wbnew]")) newSheet();
    });
  }

  /* A board as a picture */
  async function renderBoard(n, o){
    o = o || {};
    try { if (document.fonts && document.fonts.load) await Promise.all(FONTS.map(f => document.fonts.load(`40px ${f[2]}`))); } catch (e) {}
    const ink = (B && n.id === B.id) ? strokes() : (n.wbInk || []), tpl = (n.wb && n.wb.tpl) || "blank";
    // o.noPics: only what the student drew or wrote (pictures, and marker redraws of pictures, are left out)
    const its = ((B && n.id === B.id) ? items() : (n.wbItems || [])).filter(it => !(o.noPics && it.k === "i"));
    let bb = null; ink.forEach(s => { bb = bbJoin(bb, geo(s).bb); }); its.forEach(it => { bb = bbJoin(bb, itemBB(it)); });
    if (tpl !== "blank" && !o.full) { const R = pageRect(n.wb && n.wb.pa); bb = bbJoin(bb && [Math.max(0, bb[0] - 60), Math.max(0, bb[1] - 60), Math.min(BW, bb[2] + 60), Math.min(BH, bb[3] + 60)], [R[0], R[1], R[2], R[3]]); }
    else if (!bb || tpl !== "blank" || o.full) bb = tpl !== "blank" || !bb ? [0, 0, BW, BH] : (o.full ? [Math.max(0, bb[0] - 200), Math.max(0, bb[1] - 200), Math.min(BW, Math.max(bb[2] + 200, bb[0] + 900)), Math.min(BH, Math.max(bb[3] + 200, bb[1] + 600))] : bb);
    else bb = [Math.max(0, bb[0] - 60), Math.max(0, bb[1] - 60), Math.min(BW, bb[2] + 60), Math.min(BH, bb[3] + 60)];
    if (o.area) bb = o.area;
    const w = Math.max(1, bb[2] - bb[0]), h = Math.max(1, bb[3] - bb[1]), side = Math.max(w, h);
    const s = Math.min(o.max ? o.max / side : 2, 4096 / side, o.scale || 99);
    const W = Math.max(1, Math.round(w * s)), H = Math.max(1, Math.round(h * s));
    const mk = () => { const c = document.createElement("canvas"); c.width = W; c.height = H; const x = c.getContext("2d"); x.setTransform(s, 0, 0, s, -bb[0] * s, -bb[1] * s); x.lineCap = "round"; x.lineJoin = "round"; return [c, x]; };
    const [main, cm] = mk(), [hl, chh] = mk(), [pen, cp] = mk();
    const dk = !!o.dark;
    cm.fillStyle = dk ? "#1C232C" : "#FDFEFE"; cm.fillRect(bb[0], bb[1], w, h);
    tplPaint(cm, tpl, bb, n.wb && n.wb.pa, dk);
    await Promise.all(fire("wb-paint-items", {ctx: cm, list: its.filter(it => it.k === "i"), area: bb, dark: dk}));
    const DK0 = DK; DK = dk;
    try {
    ink.forEach(st => strokePaint(st.t === "hl" ? chh : cp, st, colOf(st, !dk)));
    its.forEach(it => { if (it.k !== "t") return; cp.fillStyle = penHex(it.c, !dk); cp.font = `${it.f}px ${famOf(it.ff)}`; cp.textBaseline = "top"; String(it.s).split("\n").forEach((l, i) => cp.fillText(l, it.x, it.y + i * it.f * 1.3 + it.f * 0.15)); });
    } finally { DK = DK0; }
    cm.setTransform(1, 0, 0, 1, 0, 0);
    cm.save(); cm.globalAlpha = dk ? 0.42 : 0.5; cm.globalCompositeOperation = dk ? "screen" : "multiply"; cm.drawImage(hl, 0, 0); cm.restore();
    cm.drawImage(pen, 0, 0);
    return main;
  }
  const fileName = n => boardName(n).replace(/[\\/:*?"<>|]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 60) || "Whiteboard";
  async function exportPng(n){
    flush(); const cv = await renderBoard(state.notes[n.id] || n);
    cv.toBlob(b => { if (b) { saveBlob(fileName(n) + ".png", b, "image/png"); toast("Saved " + fileName(n) + ".png"); } else toast("Couldn't make the picture. Try again."); }, "image/png");
  }
  async function exportPdf(n, mode){
    flush();
    const P = window.SBPRO; if (!(P && P.printRaw)) { toast("Printing isn't available here."); return; }
    const cv = await renderBoard(state.notes[n.id] || n, {max: 3000}), url = cv.toDataURL("image/jpeg", 0.92), c = courseOf(n.courseId);
    P.printRaw(`<div class="pp-page wb-pp"><div class="pp-head"><div><h1>${esc(boardName(n))}</h1><p>${c ? esc(courseLabel(c)) + " · " : ""}${esc(new Date().toLocaleDateString(undefined, {month: "long", day: "numeric", year: "numeric"}))}</p></div></div><img class="wb-pimg" src="${esc(url)}" alt="${esc(boardName(n))}"></div>`, null, true, {mode, name: fileName(n)});
  }
  function exportSheet(){
    const n = state.notes[curId()]; if (!n) return;
    openSheet(`<div class="sheet wb-sheet">${head("Export Whiteboard")}<div class="sheet-body"><p class="mini" style="margin:0">Everything on “${esc(boardName(n))}”, on a white background.</p>
      <div class="wb-exp"><button type="button" class="btn" data-wbx="png">Save as Picture (PNG)</button><button type="button" class="btn" data-wbx="pdf">Save as PDF</button><button type="button" class="btn" data-wbx="print">Print</button>${fire("wb-export-acts", n.id).filter(Boolean).join("")}</div></div></div>`);
    dlg.querySelectorAll("[data-wbx]").forEach(b => b.addEventListener("click", () => { const a = b.dataset.wbx; dlg.close(); if (a === "png") exportPng(n); else exportPdf(n, a === "pdf" ? "save" : "print"); }));
  }

  hook("act", (act, el, id) => {
    switch (act) {
      case "nv-view": endText(); flush(); setView(id); render(); window.scrollTo(0, 0); return true;
      case "wb-new": newSheet(); return true;
      case "wb-quick": create(nextName(), id || "blank", ""); render(); return true;
      case "wb-all": allSheet(); return true;
      case "wb-go": if (id && state.notes[id]) { ui.wbCur = id; render(); } return true;
      case "wb-opts": optsSheet(); return true;
      case "wb-export": exportSheet(); return true;
      case "wb-open": if (id && state.notes[id] && state.notes[id].wb) { setView("wb"); ui.wbCur = id; if (ui.tab !== "notes") ui.tab = "notes"; render(); } return true;
    }
    return false;
  });

  SBWB = window.SBWB = {view, on, setView, boards, boardName, curId, create, flush, renderBoard, dark: () => boardDark(), open: id => { setView("wb"); ui.wbCur = id; ui.tab = "notes"; render(); },
    board: () => B && {id: B.id, strokes: strokes(), items: items()},
    // for the Pro pictures and live group modules
    set: (t, id, v) => { if (!B) return; opBegin(); set(t, id, v); opEnd(); }, change: fn => { if (!B) return; opBegin(); try { fn(set); } finally { opEnd(); } },
    remote: () => { if (!B) return; B.ref = null; GEO.clear(); itemsDraw(true); dirty(); },
    // changes from someone else (a live group board)
    applyRemote: (id, ch) => {
      if (!B || B.id !== id) return false;
      ch.forEach(c => { (c.t === "s" ? B.pS : B.pI).set(c.id, c.v || null); if (SEL && !c.v) SEL.ids.delete(c.t + c.id); });
      if (SEL && !SEL.ids.size) SEL = null;
      if (ED && ch.some(c => c.t === "i" && c.id === ED.it.id && !c.v)) { ED.ta.remove(); ED = null; }
      later(); itemsDraw(); dirty(); selbarDraw(); return true;
    },
    onLive: fn => { LIVE = fn; }, cam: () => Object.assign({}, cam), toWorld: (cx, cy) => { const r = frame.getBoundingClientRect(); return toW([cx - r.left, cy - r.top]); },
    select: ids => select(new Set(ids)), undo, redo, penHex,
    // handwriting to text
    selInk: () => {
      if (!SEL || [...SEL.ids].some(k => k[0] !== "s")) return null;
      const ss = strokes().filter(s => SEL.ids.has("s" + s.id)); if (!ss.length) return null;
      let bb = null; ss.forEach(s => { bb = bbJoin(bb, geo(s).bb); });
      const pad = 24, w0 = bb[2] - bb[0] + pad * 2, h0 = bb[3] - bb[1] + pad * 2, k = Math.min(2, 1000 / Math.max(w0, h0));
      const c = document.createElement("canvas"); c.width = Math.max(32, Math.round(w0 * k)); c.height = Math.max(32, Math.round(h0 * k));
      const x = c.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height); x.setTransform(k, 0, 0, k, (pad - bb[0]) * k, (pad - bb[1]) * k); x.lineCap = x.lineJoin = "round";
      const cnt = {}; ss.forEach(s => { strokePaint(x, Object.assign({}, s, {w: Math.max(s.w, 30 / k)}), s.t === "hl" ? hlHex(s.c) : penHex(s.c, true)); if (s.t !== "hl") cnt[s.c] = (cnt[s.c] || 0) + 1; });
      return {canvas: c, bb, c: Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a])[0] || "ink"};
    },
    inkToText: (text, info) => {
      if (!SEL || !info) return null;
      const lines = String(text).split("\n"), bh = info.bb[3] - info.bb[1];
      const f = clamp(Math.round(bh / Math.max(1, lines.length) / 1.15), 14, 400);
      const it = {id: uid(), k: "t", x: Math.round(info.bb[0]), y: Math.round(info.bb[1]), s: String(text), c: PEN.some(q => q[0] === info.c) || hexOf(info.c) ? info.c : "ink", f, ff: T.font, at: Date.now()};
      opBegin(); SEL.ids.forEach(k => set(k[0], k.slice(1), null)); set("i", it.id, it); opEnd();
      select(new Set(["i" + it.id])); return it.id;
    }, refreshItems: () => itemsDraw(true), tray: () => trayDraw(), setTool, tool: () => T.tool, size: {w: BW, h: BH},
    stage: () => STAGE, itemBB, getI, tplName, TPL};

  const css = document.createElement("style");
  css.textContent = `
.nv-tabs{max-width:420px}
.wb-head{flex-wrap:wrap;gap:8px}
.wb-pick{display:inline-flex;max-width:min(320px,100%);min-width:0}
.wb-pick select{font:600 .92rem var(--display);height:34px;max-width:100%;border-radius:999px;border:1px solid var(--line);background:var(--surface);color:var(--ink);padding:0 12px;cursor:pointer}
.wb-host{position:relative;min-height:420px;margin-top:4px}
.wb-stage{position:absolute;inset:0;display:flex;flex-direction:column;gap:8px;padding:10px 10px 8px;border-radius:18px;background:linear-gradient(180deg,#EEF1F4,#D4DAE1 60%,#C5CCD4);box-shadow:inset 0 1px 0 #fff,inset 0 -1px 0 rgba(0,0,0,.08),0 8px 24px rgba(20,30,45,.16)}
.wb-stage.wb-dk{background:linear-gradient(180deg,#5B636E,#3E454E 60%,#353B43);box-shadow:inset 0 1px 0 rgba(255,255,255,.18),0 8px 24px rgba(0,0,0,.4)}
.wb-frame{position:relative;flex:1;min-height:0;overflow:hidden;border-radius:10px;background:#FDFEFE;touch-action:none;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;outline:none;cursor:crosshair}
.wb-frame::after{content:"";position:absolute;inset:0;border-radius:inherit;box-shadow:inset 0 0 0 1px rgba(0,0,0,.12),inset 0 2px 8px rgba(0,0,0,.12);pointer-events:none;z-index:2}
.wb-frame:focus-visible{box-shadow:0 0 0 3px color-mix(in srgb,var(--accent) 55%,transparent)}
.wb-frame[data-tool=select]{cursor:default}.wb-frame[data-tool=text]{cursor:text}.wb-frame[data-tool=hand],.wb-frame.pan-ready{cursor:grab}.wb-frame.panning{cursor:grabbing}.wb-frame[data-tool=eraser]{cursor:none}
.wb-world{position:absolute;left:0;top:0;width:${BW}px;height:${BH}px;transform-origin:0 0;pointer-events:none}
.wb-back{background:#FDFEFE;background-image:linear-gradient(115deg,rgba(255,255,255,0) 30%,rgba(255,255,255,.75) 46%,rgba(255,255,255,0) 60%),linear-gradient(180deg,#FFFFFF,#F4F7F9)}
.wb-tplbox,.wb-tpl{position:absolute;inset:0;width:100%;height:100%}
.wb-imgs{position:absolute;inset:0}
.wb-cv{position:absolute;left:0;top:0;pointer-events:none}
.wb-frame :is(.wb-world,.wb-cv){translate:0 calc(-1 * var(--lift,0px));transition:translate .34s cubic-bezier(.32,.72,0,1)}
@media (prefers-reduced-motion:reduce){.wb-frame :is(.wb-world,.wb-cv){transition:none}}
.wb-hl{opacity:.5;mix-blend-mode:multiply}
.wb-t{position:absolute;white-space:pre;line-height:1.3;font-family:${MARKER};margin:0;padding:0;}
.wb-ta{position:absolute;pointer-events:auto;font-family:${MARKER};line-height:1.3;white-space:pre;overflow:hidden;resize:none;border:0;margin:0;padding:0;background:rgba(47,111,219,.05);outline:2px dashed rgba(47,111,219,.6);outline-offset:6px;border-radius:2px;caret-color:#2F6FDB;min-width:20px}
.wb-zoom{position:absolute;top:8px;right:8px;z-index:3;display:flex;align-items:center;gap:2px;padding:3px;border-radius:999px;background:rgba(255,255,255,.9);border:1px solid rgba(0,0,0,.1);box-shadow:0 2px 8px rgba(20,30,45,.16)}
.wb-zoom button{border:0;background:none;color:#22262D;font:700 .82rem var(--display);min-width:30px;height:30px;padding:0 6px;border-radius:999px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;font-variant-numeric:tabular-nums}
.wb-zoom button:hover{background:rgba(0,0,0,.06)}
.wb-zoom svg{width:17px;height:17px}
.wb-fixed .wb-zoom [data-wb^="zoom"],.wb-fixed .wb-zoom [data-wb="fit"],.wb-fixed .wb-tray [data-wb="tool"][data-id="hand"]{display:none}
.wb-selbar{position:absolute;z-index:4;width:max-content;max-width:calc(100% - 12px);overflow-x:auto;scrollbar-width:none;display:flex;align-items:center;gap:3px;padding:4px;border-radius:12px;background:#fff;border:1px solid rgba(0,0,0,.12);box-shadow:0 6px 18px rgba(20,30,45,.2);color:#22262D}
.wb-selbar.dragging{opacity:0;pointer-events:none}
.wb-selbar::-webkit-scrollbar{display:none}
.wb-selbar > *{flex:none;white-space:nowrap}
.wb-selbar button{border:0;background:none;color:inherit;height:32px;min-width:32px;padding:0 8px;border-radius:8px;cursor:pointer;font:600 .85rem var(--display);display:inline-flex;align-items:center;justify-content:center;gap:4px}
.wb-selbar button:hover{background:rgba(0,0,0,.06)}
.wb-selbar .wb-dot{min-width:0;width:22px;height:22px;padding:0;border-radius:50%;background:var(--mk);box-shadow:inset 0 0 0 2px rgba(255,255,255,.6)}
.wb-selbar .wb-dot-any{background:conic-gradient(#FF3B30,#FF9500,#FFCC00,#34C759,#00C7BE,#007AFF,#AF52DE,#FF2D55,#FF3B30);position:relative}
.wb-selbar .wb-dot-any[style]::after{content:"";position:absolute;inset:6px;border-radius:50%;background:var(--mk);box-shadow:0 0 0 1.5px #fff}
.wb-cpick{position:absolute;z-index:9;width:236px;padding:12px;border-radius:14px;background:#fff;border:1px solid rgba(0,0,0,.12);box-shadow:0 12px 32px rgba(20,30,45,.25);display:flex;flex-direction:column;gap:10px;color:#22262D}
.wb-cp-sv{position:relative;height:140px;border-radius:10px;background-image:linear-gradient(to top,#000,transparent),linear-gradient(to right,#fff,rgba(255,255,255,0));cursor:crosshair;touch-action:none;outline:none}
.wb-cp-sv:focus-visible{box-shadow:0 0 0 2px var(--accent)}
.wb-cp-k{position:absolute;width:16px;height:16px;margin:-8px 0 0 -8px;border-radius:50%;border:2.5px solid #fff;box-shadow:0 0 0 1px rgba(0,0,0,.3),0 2px 4px rgba(0,0,0,.3);pointer-events:none}
.wb-cp-hue{-webkit-appearance:none;appearance:none;width:100%;height:14px;border-radius:999px;margin:0;background:linear-gradient(90deg,#f00,#ff0 17%,#0f0 33%,#0ff 50%,#00f 67%,#f0f 83%,#f00);outline:none;cursor:pointer}
.wb-cp-hue::-webkit-slider-thumb{-webkit-appearance:none;width:18px;height:18px;border-radius:50%;background:#fff;border:0;box-shadow:0 0 0 1px rgba(0,0,0,.25),0 2px 4px rgba(0,0,0,.3)}
.wb-cp-hue::-moz-range-thumb{width:18px;height:18px;border-radius:50%;background:#fff;border:0;box-shadow:0 0 0 1px rgba(0,0,0,.25),0 2px 4px rgba(0,0,0,.3)}
.wb-cp-hue:focus-visible{box-shadow:0 0 0 2px var(--accent)}
.wb-cp-row{display:flex;align-items:center;gap:8px}
.wb-cp-now{width:30px;height:30px;border-radius:50%;flex:none;box-shadow:inset 0 0 0 1px rgba(0,0,0,.15)}
.wb-cp-hexl{flex:1;min-width:0;display:flex;align-items:center;gap:2px;height:32px;padding:0 8px;border:1px solid rgba(0,0,0,.15);border-radius:8px;background:#F6F8FA;font:600 .9rem ui-monospace,monospace;color:#5A6474}
.wb-cp-hexl:focus-within{border-color:var(--accent)}
.wb-cp-hex{border:0;background:none;outline:none;width:100%;min-width:0;font:inherit;color:#22262D;text-transform:lowercase;padding:0}
.wb-cp-lbl{font:700 .72rem var(--display);text-transform:uppercase;letter-spacing:.05em;color:#7A8494;margin-bottom:-4px}
.wb-cp-sw{display:grid;grid-template-columns:repeat(8,1fr);gap:6px}
.wb-cp-s{width:100%;aspect-ratio:1;border:0;border-radius:50%;background:var(--c);cursor:pointer;box-shadow:inset 0 0 0 1px rgba(0,0,0,.12);padding:0}
.wb-cp-s:hover,.wb-cp-s:focus-visible{transform:scale(1.12);outline:none;box-shadow:0 0 0 2px #fff,0 0 0 4px var(--accent)}
.wb-dk .wb-cpick{background:#2A2F36;color:#EEF1F4;border-color:rgba(255,255,255,.14)}
.wb-dk .wb-cp-hexl{background:#1F242A;border-color:rgba(255,255,255,.14);color:#AEB7C2}
.wb-dk .wb-cp-hex{color:#EEF1F4}
.wb-selbar .wb-dot-orig{background:#F1F3F6;color:#4A5563;display:inline-flex;align-items:center;justify-content:center;box-shadow:inset 0 0 0 1.5px rgba(0,0,0,.18)}
.wb-dk .wb-selbar .wb-dot-orig{background:#3A414B;color:#DDE3EA;box-shadow:inset 0 0 0 1.5px rgba(255,255,255,.2)}
.wb-selbar .wb-dot:hover,.wb-selbar .wb-dot:active{background:var(--mk)}
.wb-selbar .wb-dot-any:hover,.wb-selbar .wb-dot-any:active{background:conic-gradient(#FF3B30,#FF9500,#FFCC00,#34C759,#00C7BE,#007AFF,#AF52DE,#FF2D55,#FF3B30)}
.wb-selbar .wb-dot-orig:hover,.wb-selbar .wb-dot-orig:active{background:#F1F3F6}
.wb-dk .wb-selbar .wb-dot-orig:hover,.wb-dk .wb-selbar .wb-dot-orig:active{background:#3A414B}
.wb-selbar .wb-dot[aria-pressed=true]{box-shadow:0 0 0 2px #fff,0 0 0 4px var(--accent)}
.wb-sep{width:1px;height:22px;background:rgba(0,0,0,.12);margin:0 3px}
.wb-tray{display:flex;align-items:center;gap:10px;flex-wrap:nowrap;height:60px;box-sizing:border-box;flex:none;padding:6px 8px;border-radius:10px;background:linear-gradient(180deg,#F7F8FA,#DCE1E7);box-shadow:inset 0 1px 0 #fff,inset 0 -2px 0 rgba(0,0,0,.06),0 1px 2px rgba(0,0,0,.12);color:#22262D}
.wb-dk .wb-tray{background:linear-gradient(180deg,#4A515B,#3A4048);box-shadow:inset 0 1px 0 rgba(255,255,255,.12);color:#EEF1F4}
.wb-tray button{font:inherit;color:inherit}
.wb-tools,.wb-hist,.wb-sizes,.wb-shapes,.wb-markers{display:flex;align-items:center;gap:2px}
/* markers stand on a fixed line with room above for the one in use to lift: their bottoms never move, so the tray never cuts them off */
.wb-markers{align-items:flex-end;height:48px;padding:7px 0 1px;box-sizing:border-box;align-self:center}
.wb-tools{padding-right:8px;border-right:1px solid rgba(0,0,0,.12)}
.wb-opts{display:flex;align-items:center;gap:12px;flex:1;min-width:0;flex-wrap:nowrap;overflow-x:auto;scrollbar-width:none;min-height:46px}
.wb-opts::-webkit-scrollbar{display:none}
.wb-opts>*{flex:none}
.wb-hist{padding-right:8px;border-right:1px solid rgba(0,0,0,.12)}
.wb-dk .wb-hist,.wb-dk .wb-tools{border-right-color:rgba(255,255,255,.14)}
/* Markers, uncapped: the chisel tip shows the ink, a band of it on the barrel; the one in use stands up taller */
.wb-mk{position:relative;border:0;background:none;width:28px;height:40px;padding:0;cursor:pointer;flex:none;transition:transform .14s;transform:none}
.wb-mk .wb-cap{position:absolute;left:9px;top:1px;width:10px;height:11px;background:var(--mk);clip-path:polygon(0 100%,0 38%,100% 0,100% 100%);border-radius:1px}
.wb-mk .wb-body{position:absolute;left:3px;right:3px;top:14px;bottom:0;border-radius:5px 5px 7px 7px;background:linear-gradient(90deg,#E9ECEF,#fff 40%,#D7DCE1);box-shadow:0 1px 2px rgba(0,0,0,.25)}
.wb-mk .wb-body::before{content:"";position:absolute;left:3px;right:3px;top:-5px;height:6px;border-radius:2px 2px 0 0;background:#3A3F47}
.wb-mk .wb-body::after{content:"";position:absolute;left:0;right:0;top:7px;height:8px;background:var(--mk)}
.wb-mk.on{transform:translateY(-6px)}
.wb-mk.on .wb-body{box-shadow:0 5px 9px rgba(0,0,0,.28)}
.wb-mk:hover:not(.on){transform:translateY(-2px)}
.wb-mk:focus-visible{outline:2px solid var(--accent);outline-offset:2px;border-radius:6px}
.wb-mk-any{margin-right:8px}
.wb-mk.wb-mk-any .wb-cap,.wb-mk.wb-mk-any .wb-body::after{background:linear-gradient(135deg,#FF5E62 0%,#FF9966 18%,#FFD86F 34%,#7EE8A1 50%,#4FC3F7 66%,#7C83FD 82%,#C77DFF 100%)}
.wb-mk.wb-mk-any.on .wb-dot-in{position:absolute;left:50%;bottom:6px;width:8px;height:8px;margin-left:-4px;border-radius:50%;background:var(--mk);box-shadow:0 0 0 1.5px #fff,0 0 0 2.5px rgba(0,0,0,.15)}
.wb-mk.wb-mk-any .wb-pro{position:absolute;right:-10px;top:auto;bottom:1px;height:auto;z-index:1;font:800 8px/1 var(--display);background:linear-gradient(135deg,#F5B83D,#E8833A);color:#fff;border-radius:5px;padding:2px 3px}
.wb-tool,.wb-hist button,.wb-sizes button,.wb-shapes button{border:0;background:none;width:38px;height:38px;border-radius:10px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;flex:none}
.wb-tool:hover,.wb-hist button:hover:not(:disabled),.wb-sizes button:hover,.wb-shapes button:hover{background:rgba(0,0,0,.06)}
.wb-tool.on,.wb-sizes button.on,.wb-shapes button.on{background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.18),inset 0 0 0 1.5px var(--accent);color:var(--accent)}
.wb-dk .wb-tool.on,.wb-dk .wb-sizes button.on,.wb-dk .wb-shapes button.on{background:#2A2F36}
.wb-hist button:disabled{opacity:.35;cursor:default}
.wb-sz{display:block;width:var(--s);height:var(--s);border-radius:50%;background:currentColor}
.wb-tsz span{font-family:${MARKER};line-height:1}
.wb-fontpick{display:inline-flex;align-items:center;gap:8px;height:36px;padding:0 10px 0 12px;border:1px solid rgba(0,0,0,.15);border-radius:10px;background:#fff;color:#22262D;cursor:pointer;min-width:150px;justify-content:space-between;box-shadow:0 1px 2px rgba(0,0,0,.08)}
.wb-fontpick[aria-expanded=true]{border-color:var(--accent);box-shadow:0 0 0 2px color-mix(in srgb,var(--accent) 25%,transparent)}
.wb-fp-name{font-size:1.15rem;line-height:1;white-space:nowrap;display:inline-flex;align-items:center;gap:6px}
.wb-sizepick{min-width:118px}
.wb-sizepick .wb-fp-name{font:600 .92rem var(--display)}
.wb-fp-a{font-family:${MARKER};font-size:1.05rem}
.wb-fm-size{display:flex;align-items:center;gap:12px;font:600 .95rem var(--display)!important}
.wb-fm-size span{width:36px;text-align:center}
.wb-fontmenu{position:absolute;z-index:8;display:flex;flex-direction:column;min-width:190px;padding:5px;border-radius:12px;background:#fff;border:1px solid rgba(0,0,0,.12);box-shadow:0 10px 28px rgba(20,30,45,.22)}
.wb-fm-opt{border:0;background:none;text-align:left;padding:9px 12px;border-radius:8px;font-size:1.3rem;line-height:1.1;color:#22262D;cursor:pointer;white-space:nowrap}
.wb-fm-opt:hover,.wb-fm-opt:focus-visible{background:rgba(0,0,0,.06);outline:none}
.wb-fm-opt.on{background:color-mix(in srgb,var(--accent) 12%,transparent);color:var(--accent)}
.wb-dk .wb-fontpick,.wb-dk .wb-fontmenu{background:#2A2F36;color:#EEF1F4;border-color:rgba(255,255,255,.14)}
.wb-dk .wb-fm-opt{color:#EEF1F4}
.wb-dk .wb-fm-opt:hover,.wb-dk .wb-fm-opt:focus-visible{background:rgba(255,255,255,.08)}
.wb-fonts{display:flex;align-items:center;gap:4px}
.wb-font{border:1px solid rgba(0,0,0,.14);background:#fff;color:#22262D;width:40px;height:34px;padding:0;border-radius:9px;cursor:pointer;font-size:1.15rem;line-height:1;white-space:nowrap}
.wb-font.on{border-color:var(--accent);box-shadow:inset 0 0 0 1px var(--accent);color:var(--accent)}
.wb-dk .wb-font{background:#2A2F36;color:#EEF1F4;border-color:rgba(255,255,255,.14)}
.wb-tray{order:-1}
/* wide screens: the tools stand in a panel on the right of the board, like the sticker envelope on Notes */
.wb-tray-head{display:none}
@media (min-width:640px){
  .wb-stage{flex-direction:row}
  .wb-tray{order:1;width:190px;height:auto;display:grid;grid-template-columns:minmax(0,1fr) auto;align-content:start;align-items:stretch;gap:10px 0;padding:0 0 12px;border-radius:14px;overflow:hidden auto;scrollbar-width:thin}
  .wb-tray>*{grid-column:1/-1}
  /* the head names the tool in use, with undo and redo beside it */
  .wb-tray-head,.wb-tray>.wb-hist{grid-row:1;background:linear-gradient(180deg,#E3E8EE,#CDD4DC);box-shadow:inset 0 -1px 0 rgba(0,0,0,.1)}
  .wb-tray-head{grid-column:1;display:flex;align-items:center;min-width:0;padding:0 4px 0 12px;font:800 .95rem var(--display);letter-spacing:.02em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .wb-tray>.wb-hist{grid-column:2;padding:4px 6px 4px 0;border-right:0;gap:0}
  .wb-dk .wb-tray-head,.wb-dk .wb-tray>.wb-hist{background:linear-gradient(180deg,#535B66,#454C56);box-shadow:inset 0 -1px 0 rgba(255,255,255,.1)}
  .wb-tools{display:grid;grid-template-columns:repeat(4,38px);justify-content:space-between;gap:4px 0;margin:0 10px;padding:0 0 10px;border-right:0;border-bottom:1px solid rgba(0,0,0,.12)}
  .wb-dk .wb-tools{border-bottom-color:rgba(255,255,255,.14)}
  .wb-opts{flex-direction:column;align-items:stretch;gap:12px;flex:none;overflow:visible;min-height:0;padding:0 10px}
  .wb-opts>[role=group]{flex-wrap:wrap}
  /* each set of options gets a small label, as the sticker envelope does */
  .wb-opts>[role=group]:not(.wb-seg)::before{content:attr(aria-label);flex:0 0 100%;font:700 .7rem var(--display);text-transform:uppercase;letter-spacing:.05em;opacity:.6;margin-bottom:6px}
  .wb-markers{height:auto;padding:0;gap:10px 0;align-items:flex-end;justify-content:space-between}
  .wb-markers::before{margin-bottom:2px!important}
  .wb-mk{width:24px}
  .wb-mk .wb-cap{left:7px}
  .wb-mk .wb-body{left:2px;right:2px}
  .wb-mk-any{margin-right:0}
  .wb-mk.wb-mk-any .wb-pro{right:-5px}
  .wb-sizes,.wb-shapes{justify-content:flex-start;gap:4px 2px}
  .wb-opts>.wb-seg{flex-wrap:nowrap}
  .wb-opts .wb-seg button{flex:1 1 auto;min-width:0;padding:0 6px;font-size:.8rem}
  .wb-fontpick{width:100%;min-width:0}
  .wb-opts .wb-txt{width:100%;height:36px}
}
@media (min-width:640px){.tl-controls.wb-head>.wb-pick,.tl-controls.wb-head>.wb-optbtn{display:none}}
@media (max-width:639px){#view>.wb-boards{display:none}}
.wb-seg{flex:none;display:flex;gap:3px;padding:3px;border-radius:10px;background:rgba(0,0,0,.07);border:1px solid rgba(0,0,0,.1)}
.wb-seg button{border:0;background:none;color:#4A5563;font:600 .85rem var(--display);height:30px;padding:0 12px;border-radius:7px;cursor:pointer;white-space:nowrap}
.wb-seg button[aria-pressed=true]{background:#fff;color:#22262D;box-shadow:0 1px 3px rgba(0,0,0,.18)}
.wb-dk .wb-seg{background:rgba(255,255,255,.06);border-color:rgba(255,255,255,.12)}
.wb-dk .wb-seg button{color:#AEB7C2}
.wb-dk .wb-seg button[aria-pressed=true]{background:#3A414B;color:#F1F3F6}
.wb-tip{font-size:.85rem;opacity:.75}
.wb-txt{border:1px solid rgba(0,0,0,.15)!important;background:#fff!important;border-radius:8px;height:32px;padding:0 10px;cursor:pointer;font-weight:600!important}
.wb-dk .wb-txt{background:#2A2F36!important}
.wb-empty{border-radius:18px;padding:12px;background:linear-gradient(180deg,#EEF1F4,#D4DAE1);box-shadow:0 8px 24px rgba(20,30,45,.14);margin-top:4px}
.wb-empty-in{border-radius:10px;background:linear-gradient(115deg,rgba(255,255,255,0) 30%,rgba(255,255,255,.8) 46%,rgba(255,255,255,0) 60%),#FBFCFD;padding:28px 24px;color:#22262D;box-shadow:inset 0 0 0 1px rgba(0,0,0,.08)}
.wb-empty-in h3{font-family:${MARKER};font-weight:400;font-size:2rem;margin:0 0 6px;color:#1D5BD6}
.wb-empty-in p{margin:0 0 16px;color:#4A576E}
.wb-tiles{display:grid;grid-template-columns:repeat(auto-fill,minmax(128px,1fr));gap:10px}
.wb-tile{display:flex;flex-direction:column;gap:6px;border:1px solid var(--line);background:var(--surface);border-radius:12px;padding:7px;cursor:pointer;font:600 .85rem var(--display);color:var(--ink);text-align:left;position:relative}
.wb-empty .wb-tile{background:#fff;color:#22262D;border-color:rgba(0,0,0,.1)}
.wb-tile:hover{border-color:var(--accent)}
.wb-tile input{position:absolute;opacity:0;pointer-events:none}
.wb-tile:has(input:checked){border:2px solid var(--accent);padding:6px;background:color-mix(in srgb,var(--accent) 7%,var(--surface))}
.wb-tile:has(input:focus-visible){outline:2px solid var(--accent);outline-offset:2px}
.wb-tpv{display:block;position:relative;aspect-ratio:3/2;border-radius:8px;background:#FDFEFE;box-shadow:inset 0 0 0 1px rgba(0,0,0,.1);overflow:hidden}
.wb-tplset{border:0;padding:0;margin:0}
.wb-tplset legend{font-weight:600;margin-bottom:8px;padding:0}
.wb-start{display:flex;margin-bottom:10px}
.wb-start label{flex:1;padding:8px 10px;border-radius:999px;display:flex;align-items:center;justify-content:center;gap:6px;cursor:pointer;font-weight:600}
.wb-start label:has(input:checked){background:var(--sel,var(--surface));color:var(--sel-ink,var(--accent));box-shadow:none}
.wb-start input{position:absolute;opacity:0;pointer-events:none}
.wb-start label:has(input:focus-visible){outline:2px solid var(--accent);outline-offset:1px}
.wb-tpl-pick[hidden]{display:none}
.wb-blank-go{display:flex;align-items:center;gap:14px;width:100%;max-width:420px;border:2px solid #1D5BD6;background:#fff;color:#22262D;border-radius:14px;padding:10px;cursor:pointer;text-align:left;font:inherit}
.wb-blank-go .wb-tpv{width:96px;flex:none}
.wb-blank-go b{display:block;font:700 1.05rem var(--display)}
.wb-blank-go .mini{color:#4A576E}
.wb-blank-go:hover{background:#F3F7FF}
.wb-or{margin:20px 0 10px;font:700 .95rem var(--display);color:#4A576E}
.wb-opt-acts,.wb-exp{display:flex;flex-wrap:wrap;gap:8px}
.wb-opt-acts{gap:6px;padding-bottom:12px;margin-bottom:2px;border-bottom:1px solid var(--line);flex-wrap:nowrap!important;flex:none}
.wb-opt-acts .btn{flex:1 1 auto;min-width:0;min-height:34px;padding:5px 12px;font-size:.84rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
@media (max-width:480px){.wb-opt-acts{gap:4px}.wb-opt-acts .btn{padding:5px 6px!important;font-size:.76rem!important;min-height:34px!important}}
.wb-exp .btn{flex:1 1 180px}
.wb-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:12px;margin-top:12px}
.wb-card{display:flex;flex-direction:column;gap:4px;text-align:left;border:1px solid var(--line);background:var(--surface);border-radius:12px;padding:8px;cursor:pointer;font:inherit;color:var(--ink)}
.wb-card:hover,.wb-card.on{border-color:var(--accent)}
.wb-thumb{display:flex;align-items:center;justify-content:center;aspect-ratio:3/2;border-radius:8px;background:#FDFEFE;box-shadow:inset 0 0 0 1px rgba(0,0,0,.1);overflow:hidden;color:#9BA5B2;font-size:2rem}
.wb-thumb img{width:100%;height:100%;object-fit:contain;display:block}
.wb-cn{font:600 .92rem var(--display)}
.wb-cm{font-size:.8rem;color:var(--muted);display:flex;align-items:center;gap:5px}
.wb-cm .dot{width:8px;height:8px;border-radius:50%;display:inline-block}
.wb-dk .wb-frame{background:#161B22}
.wb-dk .wb-back{background:#1C232C;background-image:linear-gradient(115deg,rgba(255,255,255,0) 30%,rgba(255,255,255,.035) 46%,rgba(255,255,255,0) 60%),linear-gradient(180deg,#212932,#1A2028)}
.wb-dk .wb-hl{mix-blend-mode:screen;opacity:.42}
.wb-dk .wb-zoom,.wb-dk .wb-selbar{background:rgba(38,45,54,.95);border-color:rgba(255,255,255,.1);color:#E6EAEE}
.wb-dk .wb-zoom button{color:#E6EAEE}
.wb-dk .wb-zoom button:hover,.wb-dk .wb-selbar button:hover{background:rgba(255,255,255,.08)}
.wb-dk .wb-sep{background:rgba(255,255,255,.14)}
.wb-dk .wb-ta{background:rgba(127,176,255,.08);outline-color:rgba(127,176,255,.6);caret-color:#7FB0FF}
html[data-theme=dark] .wb-empty{background:linear-gradient(180deg,#5B636E,#3E454E 60%,#353B43)}
html[data-theme=dark] .wb-empty-in{background:linear-gradient(115deg,rgba(255,255,255,0) 30%,rgba(255,255,255,.04) 46%,rgba(255,255,255,0) 60%),#1C232C;color:#E6EAEE;box-shadow:inset 0 0 0 1px rgba(255,255,255,.08)}
html[data-theme=dark] .wb-empty-in h3{color:#7FB0FF}
html[data-theme=dark] .wb-empty-in p,html[data-theme=dark] .wb-or,html[data-theme=dark] .wb-blank-go .mini{color:#AEB7C2}
html[data-theme=dark] .wb-empty .wb-tile,html[data-theme=dark] .wb-blank-go{background:#262E38;color:#E6EAEE;border-color:rgba(255,255,255,.1)}
html[data-theme=dark] .wb-blank-go{border-color:#7FB0FF}
html[data-theme=dark] .wb-blank-go:hover{background:#2C3642}
html[data-theme=dark] .wb-tpv{background:#1C232C;box-shadow:inset 0 0 0 1px rgba(255,255,255,.1)}
html[data-theme=dark] .wb-tpv svg{filter:invert(1) hue-rotate(180deg) brightness(1.25) contrast(1.2)}
.wb-pp .wb-pimg{width:100%;height:auto;border:1px solid #C6CEDB;border-radius:6px}
@media (max-width:639px){
  .wb-stage{padding:6px 6px 5px;border-radius:14px;gap:6px}
  .wb-tray{gap:2px 6px;padding:4px 5px;flex-wrap:wrap;height:96px;align-content:flex-start}
  .wb-tools{flex:1;justify-content:space-between;border-right:1px solid rgba(0,0,0,.12);padding-right:4px}
  .wb-hist{margin-left:0}
  .wb-opts{order:3;flex:1 0 100%;flex-wrap:nowrap;overflow-x:auto;scrollbar-width:none;gap:10px;padding:2px 2px 0;min-height:44px}
  .wb-opts::-webkit-scrollbar{display:none}
  .wb-opts>*{flex:none}
  .wb-opts{padding-right:24px;-webkit-mask-image:linear-gradient(90deg,#000 calc(100% - 28px),transparent);mask-image:linear-gradient(90deg,#000 calc(100% - 28px),transparent)}
  .wb-tools,.wb-hist{gap:0}
  .wb-tools{flex:1 0 100%;border-right:0;padding-right:0}
  .wb-hist{order:2;padding-right:6px}
  .wb-opts{flex:1 1 0}
  .wb-tool{flex:1 1 0;width:auto;min-width:0;max-width:46px;height:40px}
  .wb-hist button{width:40px;height:40px}
  .wb-tool svg,.wb-hist svg{width:20px;height:20px}
  .wb-sizes button,.wb-shapes button{width:40px;height:40px}
  .tl-controls.wb-head>.btn.small{white-space:nowrap}
  .wb-tip{display:none}
  .wb-zoom{top:6px;right:6px}
  /* phones: one small pill in the corner, zoom %, light/dark and full screen */
  .wb-stage .wb-zoom{left:auto;right:6px;top:6px;gap:0;padding:1px 32px 1px 1px;background:rgba(255,255,255,.82);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);box-shadow:0 1px 6px rgba(20,30,45,.14)}
  .wb-dk.wb-stage .wb-zoom{background:rgba(38,45,54,.82)}
  .wb-stage .wb-zoom :is([data-wb="zoom-out"],[data-wb="zoom-in"],[data-wb="fit"]){display:none}
  .wb-stage .wb-zoom button{height:28px;min-width:28px;padding:0 7px;font-size:.74rem}
  .wb-stage .wb-zoom svg{width:15px;height:15px}
  .wb-stage .wb-max{top:7px;right:7px;width:30px;height:30px;background:none!important;border-color:transparent!important;box-shadow:none!important;z-index:4}
  .wb-stage .wb-max svg{width:14px;height:14px}
  /* phones: the board picker with its options (⋯) on one row, then All Boards, Export and Notes and Cards evenly on the next */
  .tl-controls.wb-head{display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,.85fr) minmax(0,1.45fr) 42px;gap:6px!important;align-items:center}
  .tl-controls.wb-head>*{margin:0!important;min-width:0;max-width:none!important;width:auto!important;flex:none!important}
  .tl-controls.wb-head>h2{grid-column:1/-1;order:0}
  .tl-controls.wb-head>.wb-pick{grid-column:1/4;order:1}
  .wb-pick select{width:100%;height:40px}
  .tl-controls.wb-head>.wb-optbtn{grid-column:4;order:2;width:42px!important;height:40px;min-height:40px;padding:0!important;display:inline-flex;align-items:center;justify-content:center}
  .tl-controls.wb-head>.btn.small{height:40px;min-height:40px;padding-left:4px!important;padding-right:4px!important;justify-content:center;overflow:hidden;text-overflow:ellipsis;font-size:.8rem!important;letter-spacing:-.01em}
  .tl-controls.wb-head>[data-act="wb-all"]{grid-column:1;order:3}
  .tl-controls.wb-head>[data-act="wb-export"]{grid-column:2;order:4}
  .tl-controls.wb-head>[data-act="wb-ai"]{grid-column:3/5;order:5;gap:5px}
  .tl-controls.wb-head>[data-act="wb-ai"]{gap:4px!important}
  .tl-controls.wb-head>[data-act="wb-ai"] img,.tl-controls.wb-head>[data-act="wb-ai"] svg,.tl-controls.wb-head>[data-act="wb-ai"] .ai-ic{width:18px!important;height:18px!important;flex:none}
  .tl-controls.wb-head>.wb-livechip{grid-column:1/-1;order:6;justify-content:center}
  .wb-hint{display:none}
  .wb-tiles{grid-template-columns:repeat(2,minmax(0,1fr))}
}
`;
  document.head.appendChild(css);
})();

