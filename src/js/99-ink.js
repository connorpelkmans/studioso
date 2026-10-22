/* ===== module: 99-ink.js ===== */
/* Studyboard Pro: pen ink. Handwriting and drawing with Apple Pencil over a PDF's pages (in the reader) and on a note (a drawing page).
   Where: only in the iPad app for now. SBINK.available() is the one check (widen it there): the native iOS app (Capacitor, platform "ios")
   on an iPad (window.StudyboardDevice.idiom from the app shell, else StudyboardNative.device from native-bridge.js, else the user agent:
   "iPad", or iPadOS's desktop "Macintosh" with a touch screen). Tests turn it on with localStorage "studyboard:ink-test" = "1".
   Elsewhere ink that is already there is still shown (read only), so nothing looks lost on the website or a phone.
   Plan: Pro, like the reader. On a free plan the Draw button shows the Pro badge and opens the Pro sheet; drawings already made stay visible.
   Data (see normInk in the core): strokes [{id, t: "pen" | "hl", c: colour id, w: width in 1/10000 of the page width, d: points, at}] on
   f.ink (with p: page, a: the revision's asset id) or n.ink. Points are x, y as 0..1 of the page (so zoom and rotation never move them) and
   pressure, simplified, then packed as zigzag deltas in a 64-letter code (about 4 letters a point). Strokes never change: sync merges them by
   id, an erase is a removal. Sizes are capped (a file 4000 strokes / 600k letters, a note 2000 / 200k, all ink on this device 2.5M letters).
   Pencil: Pointer Events. pointerType "pen" draws with pressure and coalesced points; fingers scroll and zoom (palm rejection), unless
   Draw with Finger is on. Committed strokes are drawn once per page (highlighter on its own layer, under the ink); only the live stroke redraws. */
var SBINK = null;
(() => {
  const P = SBPRO; if (!P) return;
  const K_TEST = "studyboard:ink-test", K_TOOLS = "studyboard:ink-tools";
  const lsGet = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };

  /* ---------- Where the pen tools appear ---------- */
  const iPadUA = () => { const ua = navigator.userAgent || ""; return /iPad/.test(ua) || (/Macintosh/.test(ua) && (navigator.maxTouchPoints || 0) > 1); };
  function nativeIOS(){
    try {
      const C = window.Capacitor, N = window.StudyboardNative;
      if (!(C && typeof C.isNativePlatform === "function" && C.isNativePlatform())) return false;
      return ((N && N.platform) || (typeof C.getPlatform === "function" ? C.getPlatform() : "")) === "ios";
    } catch (e) { return false; }
  }
  function isIPad(){
    try {
      const D = window.StudyboardDevice, N = window.StudyboardNative;
      if (D && (D.idiom === "pad" || D.idiom === "phone")) return D.idiom === "pad";
      if (N && (N.device === "ipad" || N.device === "iphone")) return N.device === "ipad";
      return iPadUA();
    } catch (e) { return false; }
  }
  // THE switch for the pen tools. Only the iPad app today; widen it here (e.g. any touch screen with a stylus) when that's wanted.
  const available = () => lsGet(K_TEST) === "1" || (nativeIOS() && isIPad());
  const proWhy = why => { if (typeof PLAN !== "undefined" && PLAN) PLAN.openSheet(why); };
  const NOTE_WHY = "Drawing and handwriting in notes is part of Studyboard Pro: write with your Apple Pencil, and turn it into typed notes.";

  /* ---------- Colours, widths, tools ---------- */
  // Pen colours (ids are stored; the colour is looked up when drawing, so it can follow the theme). Pages are paper: PDFs are white, a
  // drawing sits on its note's colour in light and dark mode alike, so these dark-on-light shades stay readable everywhere.
  const PEN = [["ink", "Black", "#1F2328"], ["blue", "Blue", "#2457C5"], ["red", "Red", "#D0342C"], ["green", "Green", "#1E8A4C"], ["accent", "Theme Color", ""], ["orange", "Orange", "#D46A12"]];
  const HLC = [["yellow", "Yellow", "#FFD84D"], ["green", "Green", "#7DDB8A"], ["blue", "Blue", "#7CC4FF"], ["pink", "Pink", "#FF9EC4"]];
  const WID = {pen: [20, 35, 65], hl: [120, 200, 320]};
  const WNAME = ["Fine", "Medium", "Thick"];
  const AR = 4 / 3;   // a note's drawing page: height / width, like a sheet of paper
  const LIM = {file: [4000, 600000], note: [2000, 200000], all: 2.5e6};
  const accent = () => { try { const v = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim(); return /^(#[0-9a-f]{3,8}|rgba?\([\d\s.,%]+\))$/i.test(v) ? v : "#2F6FDB"; } catch (e) { return "#2F6FDB"; } };
  function colorOf(s){
    if (s.t === "hl") return (HLC.find(x => x[0] === s.c) || HLC[0])[2];
    if (s.c === "accent") return accent();
    return (PEN.find(x => x[0] === s.c) || PEN[0])[2];
  }
  const T = Object.assign({tool: "pen", pen: "ink", hl: "yellow", pw: 1, hw: 1, finger: false}, (() => { try { return JSON.parse(lsGet(K_TOOLS) || "{}") || {}; } catch (e) { return {}; } })());
  const saveTools = () => lsSet(K_TOOLS, JSON.stringify(T));
  const wf = p => 0.4 + 1.2 * Math.max(0, Math.min(1, p));   // pressure (0..1) to a width factor; 0.5 (a mouse, a finger) is 1

  /* ---------- Points: simplify, pack, unpack ---------- */
  const AL = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_", AIX = {};
  for (let i = 0; i < 64; i++) AIX[AL.charCodeAt(i)] = i;
  const c01 = v => Math.max(0, Math.min(1, v));
  // pts: [[x, y, p]] with x and y as 0..1 of the page, p the pressure 0..1
  function encode(pts){
    let s = "", px = 0, py = 0, pp = 0;
    const put = v => { v = v < 0 ? -v * 2 - 1 : v * 2; while (v >= 32) { s += AL[32 + (v % 32)]; v = Math.floor(v / 32); } s += AL[v]; };
    pts.forEach(([x, y, p]) => { const X = Math.round(c01(x) * 10000), Y = Math.round(c01(y) * 10000), Q = Math.round(c01(p) * 31); put(X - px); put(Y - py); put(Q - pp); px = X; py = Y; pp = Q; });
    return s;
  }
  function decode(d){
    const nums = []; let v = 0, mul = 1;
    for (let i = 0; i < d.length; i++) {
      const k = AIX[d.charCodeAt(i)]; if (k === undefined) return [];
      if (k >= 32) { v += (k - 32) * mul; mul *= 32; } else { v += k * mul; nums.push(v % 2 ? -(v + 1) / 2 : v / 2); v = 0; mul = 1; }
    }
    const out = []; let x = 0, y = 0, p = 0;
    for (let i = 0; i + 2 < nums.length; i += 3) { x += nums[i]; y += nums[i + 1]; p += nums[i + 2]; out.push([x / 10000, y / 10000, p / 31]); }
    return out;
  }
  // Ramer-Douglas-Peucker, on screen pixels (eps in px); pressure rides along
  function simplify(pts, eps){
    if (pts.length < 3) return pts.slice();
    const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1;
    const stack = [[0, pts.length - 1]];
    while (stack.length) {
      const [a, b] = stack.pop(); let best = 0, at = -1;
      const [ax, ay] = pts[a], [bx, by] = pts[b], dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy) || 1;
      for (let i = a + 1; i < b; i++) {
        const d = Math.abs(dy * pts[i][0] - dx * pts[i][1] + bx * ay - by * ax) / L + Math.abs(pts[i][2] - pts[a][2]) * 0.6;   // a big pressure change is kept too
        if (d > best) { best = d; at = i; }
      }
      if (at > 0 && best > eps) { keep[at] = 1; stack.push([a, at], [at, b]); }
    }
    return pts.filter((_, i) => keep[i]);
  }
  const CACHE = new Map();   // stroke id -> {d, pts, bb}
  function ptsOf(s){
    const c = CACHE.get(s.id); if (c && c.d === s.d) return c.pts;
    const pts = decode(s.d); let x0 = 1, y0 = 1, x1 = 0, y1 = 0;
    pts.forEach(([x, y]) => { if (x < x0) x0 = x; if (y < y0) y0 = y; if (x > x1) x1 = x; if (y > y1) y1 = y; });
    if (CACHE.size > 20000) CACHE.clear();
    CACHE.set(s.id, {d: s.d, pts, bb: [x0, y0, x1, y1]});
    return pts;
  }
  const bbOf = s => { ptsOf(s); return CACHE.get(s.id).bb; };

  /* ---------- Drawing strokes ---------- */
  // Quadratic curves through the midpoints; a pen stroke is drawn piece by piece so its width follows the pressure
  function penOn(ctx, pts, W, H, base, color){
    ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineCap = "round"; ctx.lineJoin = "round";
    const X = i => pts[i][0] * W, Y = i => pts[i][1] * H, n = pts.length;
    if (n === 1) { ctx.beginPath(); ctx.arc(X(0), Y(0), Math.max(0.6, base * wf(pts[0][2]) / 2), 0, Math.PI * 2); ctx.fill(); return; }
    for (let i = 1; i < n; i++) {
      const sx = i === 1 ? X(0) : (X(i - 1) + X(i)) / 2, sy = i === 1 ? Y(0) : (Y(i - 1) + Y(i)) / 2;
      const ex = i === n - 1 ? X(i) : (X(i) + X(i + 1)) / 2, ey = i === n - 1 ? Y(i) : (Y(i) + Y(i + 1)) / 2;
      ctx.lineWidth = Math.max(0.6, base * wf((pts[i - 1][2] + pts[i][2]) / 2));
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.quadraticCurveTo(X(i), Y(i), ex, ey); ctx.stroke();
    }
  }
  function hlOn(ctx, pts, W, H, base, color){
    ctx.strokeStyle = color; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.lineWidth = base;
    ctx.beginPath(); ctx.moveTo(pts[0][0] * W, pts[0][1] * H);
    if (pts.length === 1) ctx.lineTo(pts[0][0] * W + 0.1, pts[0][1] * H);
    for (let i = 1; i < pts.length; i++) {
      const mx = i === pts.length - 1 ? pts[i][0] * W : (pts[i][0] + pts[i + 1][0]) / 2 * W, my = i === pts.length - 1 ? pts[i][1] * H : (pts[i][1] + pts[i + 1][1]) / 2 * H;
      ctx.quadraticCurveTo(pts[i][0] * W, pts[i][1] * H, mx, my);
    }
    ctx.stroke();
  }
  function paintStroke(S, s){
    const pts = ptsOf(s); if (!pts.length) return;
    const ctx = S.ctx[s.t === "hl" ? 0 : 1], base = s.w / 10000 * S.W;
    (s.t === "hl" ? hlOn : penOn)(ctx, pts, S.W, S.H, base, colorOf(s));
  }
  // An SVG of a note's drawing (the board, the open note), cropped to what's drawn
  const SVGC = new Map();
  function svgOf(list){
    if (!list.length) return "";
    const key = list.length + ":" + list.map(s => s.id).join(",").slice(-400) + ":" + accent();
    const hit = SVGC.get(key); if (hit) return hit;
    const VW = 1000, VH = VW * AR; let x0 = 1, y0 = 1, x1 = 0, y1 = 0;
    list.forEach(s => { const b = bbOf(s), r = s.w / 10000 * 1.2; x0 = Math.min(x0, b[0] - r); y0 = Math.min(y0, b[1] - r / AR); x1 = Math.max(x1, b[2] + r); y1 = Math.max(y1, b[3] + r / AR); });
    x0 = Math.max(0, x0 - 0.02); y0 = Math.max(0, y0 - 0.02); x1 = Math.min(1, x1 + 0.02); y1 = Math.min(1, y1 + 0.02);
    if (y1 - y0 < 0.1) { const m = (y0 + y1) / 2; y0 = Math.max(0, m - 0.05); y1 = Math.min(1, y0 + 0.1); }
    const f = v => (Math.round(v * 10) / 10).toString();
    const dOf = pts => { const X = i => pts[i][0] * VW, Y = i => pts[i][1] * VH; let d = `M${f(X(0))} ${f(Y(0))}`; if (pts.length === 1) return d + "l0.1 0";
      for (let i = 1; i < pts.length; i++) { const last = i === pts.length - 1; d += `Q${f(X(i))} ${f(Y(i))} ${f(last ? X(i) : (X(i) + X(i + 1)) / 2)} ${f(last ? Y(i) : (Y(i) + Y(i + 1)) / 2)}`; } return d; };
    const path = (s, w) => { const pts = ptsOf(s); return pts.length ? `<path d="${dOf(pts)}" stroke="${esc(colorOf(s))}" stroke-width="${f(w)}"/>` : ""; };
    const hl = list.filter(s => s.t === "hl").map(s => path(s, s.w / 10)).join("");
    const pen = list.filter(s => s.t !== "hl").map(s => { const pts = ptsOf(s), avg = pts.reduce((a, p) => a + p[2], 0) / (pts.length || 1); return path(s, Math.max(0.8, s.w / 10 * wf(avg))); }).join("");
    const svg = `<svg class="ink-svg" viewBox="${f(x0 * VW)} ${f(y0 * VH)} ${f((x1 - x0) * VW)} ${f((y1 - y0) * VH)}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Drawing" focusable="false"><g fill="none" stroke-linecap="round" stroke-linejoin="round">${hl ? `<g class="ink-svg-hl">${hl}</g>` : ""}${pen}</g></svg>`;
    if (SVGC.size > 200) SVGC.clear();
    SVGC.set(key, svg);
    return svg;
  }

  /* ---------- Where strokes are kept ---------- */
  const inkOf = o => Array.isArray(o && o.ink) ? o.ink : [];
  const charsOf = list => list.reduce((n, s) => n + s.d.length + 40, 0);
  function usedAll(){
    let n = 0;
    Object.values(state.files || {}).forEach(f => { if (f && f.ink) n += charsOf(inkOf(f)); });
    Object.values(state.notes || {}).forEach(x => { if (x && x.ink) n += charsOf(inkOf(x)); });
    return n;
  }
  // Strokes waiting to be saved: added and removed ones, put on top of whatever the saved record holds (so a sync that lands meanwhile is kept)
  function makeStore(read, write){
    let added = new Map(), removed = new Set(), timer = 0;
    const list = () => {
      const base = read().filter(s => !removed.has(s.id)), ids = new Set(base.map(s => s.id));
      return added.size ? base.concat([...added.values()].filter(s => !ids.has(s.id))) : base;
    };
    const flush = () => { clearTimeout(timer); timer = 0; if (!added.size && !removed.size) return; const out = list(); added = new Map(); removed = new Set(); write(out); };
    const later = () => { clearTimeout(timer); timer = setTimeout(flush, 700); };
    return {
      list, flush, pending: () => added.size + removed.size > 0,
      add(ss){ ss.forEach(s => { removed.delete(s.id); added.set(s.id, s); }); later(); },
      remove(ids){ ids.forEach(id => { added.delete(id); removed.add(id); }); later(); }
    };
  }
  const liveText = id => { const t = $("#noteText"); return t && noteEditing === id ? t.value : null; };

  /* ---------- A session: the reader's pages, or a note's drawing page ---------- */
  let CUR = null;
  function endSession(){ if (!CUR) return; try { CUR.store.flush(); } catch (e) { console.warn("ink", e); } CUR = null; DRAW = null; }
  function pdfSession(){
    const R = P.reader && P.reader(); if (!R) return null;
    if (CUR && CUR.kind === "pdf" && CUR.fid === R.fid && CUR.rev === R.rev) return CUR;
    endSession();
    const fid = R.fid, rev = R.rev;
    const store = makeStore(() => inkOf(state.files[fid]), list => {
      const f = state.files[fid]; if (!f) return;
      const after = clone(f); if (list.length) after.ink = list; else delete after.ink;
      after.updated = Date.now();
      applyChanges([{kind: "file", id: fid, after}], null);
    });
    CUR = {kind: "pdf", fid, rev, store, undo: [], redo: [], active: false, surfaces: new Map(), lim: LIM.file,
      on: S => store.list().filter(s => s.a === rev && s.p === S.p), meta: S => ({p: S.p, a: rev}),
      mine: () => store.list().filter(s => s.a === rev)};
    return CUR;
  }
  function noteSession(id){
    endSession();
    const store = makeStore(() => inkOf(state.notes[id]), list => {
      const cur = state.notes[id]; if (!cur) return;
      const after = clone(cur); if (list.length) after.ink = list; else delete after.ink;
      const t = liveText(id); if (t != null) after.text = t;
      applyChanges([{kind: "note", id, after}], null);
    });
    CUR = {kind: "note", nid: id, store, undo: [], redo: [], active: true, surfaces: new Map(), lim: LIM.note, on: () => store.list(), meta: () => ({}), mine: () => store.list()};
    return CUR;
  }

  /* ---------- A surface: three canvases over one page (highlighter, ink, the live stroke) ---------- */
  function surface(host, p){
    if (!host.firstChild) host.innerHTML = `<canvas class="ink-cv ink-hlc"></canvas><canvas class="ink-cv ink-pen"></canvas><canvas class="ink-cv ink-live"></canvas>`;
    let S = host.__ink;
    if (!S) { const cv = [...host.querySelectorAll("canvas")]; S = host.__ink = {host, p, cv, ctx: cv.map(c => c.getContext("2d")), W: 0, H: 0, dpr: 1, sig: ""}; bind(S); }
    S.p = p;
    return S;
  }
  function size(S, W, H){
    W = Math.max(1, Math.round(W)); H = Math.max(1, Math.round(H));
    const dpr = Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(8e6 / (W * H)));
    if (S.W === W && S.H === H && S.dpr === dpr) return false;
    S.W = W; S.H = H; S.dpr = dpr;
    S.cv.forEach((c, i) => { c.width = Math.floor(W * dpr); c.height = Math.floor(H * dpr); c.style.width = W + "px"; c.style.height = H + "px"; S.ctx[i].setTransform(dpr, 0, 0, dpr, 0, 0); });
    S.sig = "";
    return true;
  }
  const sigOf = list => list.length + ":" + list.map(s => s.id).join(",");
  function redraw(S, force){
    if (!CUR || !S.W) return;
    const list = CUR.on(S), sig = sigOf(list);
    if (!force && sig === S.sig) return;
    S.sig = sig;
    S.ctx.forEach(c => { c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, c.canvas.width, c.canvas.height); c.restore(); });
    list.forEach(s => { if (s.t === "hl") paintStroke(S, s); });
    list.forEach(s => { if (s.t !== "hl") paintStroke(S, s); });
  }
  function refresh(){ if (CUR) CUR.surfaces.forEach(S => { if (S.host.isConnected) redraw(S); }); bar(); }

  /* ---------- The pen ---------- */
  let DRAW = null, penAt = 0;
  const clearLive = S => { const c = S.ctx[2]; c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, c.canvas.width, c.canvas.height); c.restore(); };
  function bind(S){
    const h = S.host;
    h.addEventListener("pointerdown", e => down(S, e));
    h.addEventListener("pointermove", e => move(S, e));
    h.addEventListener("pointerup", e => up(S, e));
    h.addEventListener("pointercancel", e => up(S, e));
    // Palm rejection: the Pencil never scrolls the page, and while it's writing (and just after) a resting palm doesn't either. Fingers scroll.
    const guard = e => {
      if (!CUR || !CUR.active) return;
      const stylus = [...(e.changedTouches || [])].some(t => t.touchType === "stylus");
      if (stylus || (DRAW && DRAW.pen) || Date.now() - penAt < 500 || T.finger) { if (e.cancelable) e.preventDefault(); }
    };
    h.addEventListener("touchstart", guard, {passive: false});
    h.addEventListener("touchmove", guard, {passive: false});
    h.addEventListener("click", e => { if (CUR && CUR.active) e.stopPropagation(); });   // a pen tap is not a tap on a highlight
    h.addEventListener("contextmenu", e => { if (CUR && CUR.active) e.preventDefault(); });
  }
  function down(S, e){
    if (!CUR || !CUR.active || DRAW) return;
    const pen = e.pointerType === "pen", touch = e.pointerType === "touch";
    if (touch && !T.finger) return;               // fingers scroll and zoom; the Pencil draws
    if (!touch && !pen && e.button > 0) return;
    e.preventDefault();
    try { S.host.setPointerCapture(e.pointerId); } catch (err) {}
    if (pen) penAt = Date.now();
    const r = S.host.getBoundingClientRect();
    DRAW = {S, id: e.pointerId, pen, pts: [], r, tool: T.tool, gone: [], k: r.width ? S.W / r.width : 1};
    const live = S.cv[2]; live.classList.toggle("hl", T.tool === "hl");
    addPt(e);
  }
  function addPt(e){
    const D = DRAW, S = D.S, x = (e.clientX - D.r.left) * D.k, y = (e.clientY - D.r.top) * D.k;
    if (D.tool === "erase") { eraseAt(x, y); return; }
    const p = D.pen ? (e.pressure > 0 ? e.pressure : 0.5) : 0.5, last = D.pts[D.pts.length - 1];
    if (last && Math.abs(last[0] - x) < 0.3 && Math.abs(last[1] - y) < 0.3) return;
    D.pts.push([x, y, p]);
    const ctx = S.ctx[2], n = D.pts.length;
    if (D.tool === "hl") {
      clearLive(S);
      hlOn(ctx, D.pts.map(q => [q[0] / S.W, q[1] / S.H]), S.W, S.H, WID.hl[T.hw] / 10000 * S.W, colorOf({t: "hl", c: T.hl}));
    } else if (n >= 2) {
      const base = WID.pen[T.pw] / 10000 * S.W, a = D.pts[n - 2], b = D.pts[n - 1], z = n >= 3 ? D.pts[n - 3] : null;
      ctx.strokeStyle = colorOf({t: "pen", c: T.pen}); ctx.lineCap = "round"; ctx.lineJoin = "round";
      ctx.lineWidth = Math.max(0.6, base * wf((a[2] + b[2]) / 2));
      ctx.beginPath();
      if (z) { ctx.moveTo((z[0] + a[0]) / 2, (z[1] + a[1]) / 2); ctx.quadraticCurveTo(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2); }
      else { ctx.moveTo(a[0], a[1]); ctx.lineTo((a[0] + b[0]) / 2, (a[1] + b[1]) / 2); }
      ctx.stroke();
    }
    if (n >= 1500) { const keep = DRAW; finish(); DRAW = Object.assign({}, keep, {pts: [D.pts[n - 1]]}); }   // a very long stroke is saved in parts
  }
  function move(S, e){
    if (!DRAW || DRAW.S !== S || e.pointerId !== DRAW.id) return;
    e.preventDefault();
    if (DRAW.pen) penAt = Date.now();
    const evs = typeof e.getCoalescedEvents === "function" ? e.getCoalescedEvents() : [];
    (evs && evs.length ? evs : [e]).forEach(addPt);
  }
  function up(S, e){
    if (!DRAW || DRAW.S !== S || e.pointerId !== DRAW.id) return;
    if (DRAW.pen) penAt = Date.now();
    try { S.host.releasePointerCapture(e.pointerId); } catch (err) {}
    finish(); DRAW = null;
  }
  function finish(){
    const D = DRAW; if (!D || !CUR) return;
    const S = D.S;
    if (D.tool === "erase") { if (D.gone.length) record({del: D.gone}); return; }
    clearLive(S);
    if (!D.pts.length) return;
    const pts = simplify(D.pts, 0.45).map(([x, y, p]) => [x / S.W, y / S.H, p]);
    const t = D.tool === "hl" ? "hl" : "pen";
    const s = Object.assign({id: uid(), t, c: t === "hl" ? T.hl : T.pen, w: t === "hl" ? WID.hl[T.hw] : WID.pen[T.pw], d: encode(pts), at: Date.now()}, CUR.meta(S));
    if (!roomFor(s)) return;
    CUR.store.add([s]);
    record({add: [s]});
    if (t === "pen") { paintStroke(S, s); S.sig = sigOf(CUR.on(S)); } else redraw(S, true);
  }
  function roomFor(s){
    const all = CUR.store.list(), here = charsOf(all);
    if (all.length >= CUR.lim[0] || here + s.d.length > CUR.lim[1]) { toast(CUR.kind === "pdf" ? "This file is full of ink. Erase some to keep writing." : "This drawing is full. Erase some to keep writing."); return false; }
    const saved = charsOf(inkOf(CUR.kind === "pdf" ? state.files[CUR.fid] : state.notes[CUR.nid]));
    if (usedAll() - saved + here + s.d.length > LIM.all) { toast("Your drawings are using all the room this device keeps for them. Erase some to keep writing."); return false; }
    return true;
  }
  function eraseAt(x, y){
    const D = DRAW, S = D.S, r = 10 * D.k;
    const hits = CUR.on(S).filter(s => {
      const b = bbOf(s), half = s.w / 10000 * S.W, pad = r + half;
      if (x < b[0] * S.W - pad || x > b[2] * S.W + pad || y < b[1] * S.H - pad || y > b[3] * S.H + pad) return false;
      const pts = ptsOf(s), lim = (r + half / 2) ** 2;
      if (pts.length === 1) return (pts[0][0] * S.W - x) ** 2 + (pts[0][1] * S.H - y) ** 2 <= lim;
      for (let i = 1; i < pts.length; i++) {
        const ax = pts[i - 1][0] * S.W, ay = pts[i - 1][1] * S.H, bx = pts[i][0] * S.W, by = pts[i][1] * S.H, dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy;
        const t = L ? Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / L)) : 0;
        if ((ax + t * dx - x) ** 2 + (ay + t * dy - y) ** 2 <= lim) return true;
      }
      return false;
    });
    if (!hits.length) return;
    D.gone.push(...hits);
    CUR.store.remove(hits.map(s => s.id));
    redraw(S);
  }

  /* ---------- Undo, redo, clear ---------- */
  function record(op){ CUR.undo.push(op); if (CUR.undo.length > 200) CUR.undo.shift(); CUR.redo = []; bar(); }
  function applyOp(op, back){
    const add = back ? op.del : op.add, del = back ? op.add : op.del;
    if (del && del.length) CUR.store.remove(del.map(s => s.id));
    if (add && add.length) CUR.store.add(add);
  }
  function undo(){ if (!CUR || !CUR.undo.length) return; const op = CUR.undo.pop(); applyOp(op, true); CUR.redo.push(op); refresh(); }
  function redo(){ if (!CUR || !CUR.redo.length) return; const op = CUR.redo.pop(); applyOp(op, false); CUR.undo.push(op); refresh(); }
  function clearTarget(){
    if (!CUR) return [];
    if (CUR.kind === "note") return CUR.store.list();
    const R = P.reader && P.reader(); const p = R ? R.cur : 1;
    return CUR.store.list().filter(s => s.a === CUR.rev && s.p === p);
  }
  // A small question inside the sheet (a new sheet would close the reader or the drawing)
  function ask(text, yes, fn){
    const host = dlg.querySelector(".ink-sheet, .pdr-sheet"); if (!host) return;
    const old = host.querySelector(".ink-ask"); if (old) old.remove();
    const el = document.createElement("div"); el.className = "ink-ask"; el.setAttribute("role", "alertdialog"); el.setAttribute("aria-label", text);
    el.innerHTML = `<div class="ink-ask-box"><p>${esc(text)}</p><div class="row-actions"><span class="spacer"></span><button type="button" class="btn small" data-ink-no>Cancel</button><button type="button" class="btn small primary ink-danger" data-ink-yes>${esc(yes)}</button></div></div>`;
    host.appendChild(el);
    el.addEventListener("click", e => { if (e.target.closest("[data-ink-yes]")) { el.remove(); fn(); } else if (e.target.closest("[data-ink-no]") || e.target === el) el.remove(); e.stopPropagation(); });
    const b = el.querySelector("[data-ink-no]"); if (b) b.focus();
  }
  function clearPage(){
    const list = clearTarget(); if (!list.length) { toast(CUR && CUR.kind === "pdf" ? "There's no ink on this page." : "There's nothing drawn yet."); return; }
    const R = CUR.kind === "pdf" && P.reader ? P.reader() : null;
    ask(CUR.kind === "pdf" ? `Clear all ink on page ${R ? R.cur : 1}? You can undo this.` : "Clear the whole drawing? You can undo this.", CUR.kind === "pdf" ? "Clear Page" : "Clear Drawing", () => {
      if (!CUR) return;
      CUR.store.remove(list.map(s => s.id)); record({del: list}); refresh();
    });
  }

  /* ---------- The tool bar ---------- */
  const ico = d => `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const IC = {
    pen: ico('<path d="M15.5 4.5l4 4L8 20H4v-4z"/><path d="M13 7l4 4"/>'),
    hl: ico('<path d="M9 15l-3 3v2h4l3-3"/><path d="M9 15l6-11 5 3-6 11z"/>'),
    erase: ico('<path d="M7 20h11"/><path d="M4.5 14.5l9-9a2 2 0 0 1 2.8 0l3.2 3.2a2 2 0 0 1 0 2.8L13 18H8.5z"/><path d="M9 10l5 5"/>'),
    undo: ico('<path d="M9 14L4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/>'),
    redo: ico('<path d="M15 14l5-5-5-5"/><path d="M20 9H9a5 5 0 0 0 0 10h3"/>'),
    clear: ico('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>'),
    hand: ico('<path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V12"/><path d="M11 11V4.5a1.5 1.5 0 0 1 3 0V12"/><path d="M14 11.5V6a1.5 1.5 0 0 1 3 0v8a6 6 0 0 1-6 6h-.5a6 6 0 0 1-4.6-2.2L4 15.5a1.5 1.5 0 0 1 2.3-1.9L8 15.5"/>')
  };
  function barHtml(){
    const tool = T.tool, hl = tool === "hl", cols = hl ? HLC : PEN, cur = hl ? T.hl : T.pen, wi = hl ? T.hw : T.pw;
    const tb = (k, name) => `<button type="button" class="icon-btn ink-t" data-act="ink-tool" data-id="${k}" aria-pressed="${tool === k}" aria-label="${name}" title="${name}">${IC[k]}</button>`;
    return `<span class="ink-g" role="group" aria-label="Tool">${tb("pen", "Pen")}${tb("hl", "Highlighter")}${tb("erase", "Eraser")}</span>
      ${tool === "erase" ? `<span class="mini ink-tip">Touch a stroke to erase it.</span>` : `<span class="ink-g" role="group" aria-label="Color">${cols.map(([k, name, hex]) => `<button type="button" class="ink-col" data-act="ink-color" data-id="${k}" style="--h:${esc(hex || accent())}" aria-pressed="${cur === k}" aria-label="${name}" title="${name}"></button>`).join("")}</span>
      <span class="ink-g" role="group" aria-label="Thickness">${[0, 1, 2].map(i => `<button type="button" class="icon-btn ink-w" data-act="ink-width" data-id="${i}" aria-pressed="${wi === i}" aria-label="${WNAME[i]}" title="${WNAME[i]}"><i style="--d:${hl ? 6 + i * 4 : 3 + i * 3}px"></i></button>`).join("")}</span>`}
      <span class="ink-g"><button type="button" class="icon-btn" data-act="ink-undo" aria-label="Undo" title="Undo"${CUR && CUR.undo.length ? "" : " disabled"}>${IC.undo}</button><button type="button" class="icon-btn" data-act="ink-redo" aria-label="Redo" title="Redo"${CUR && CUR.redo.length ? "" : " disabled"}>${IC.redo}</button><button type="button" class="icon-btn" data-act="ink-clear" aria-label="${CUR && CUR.kind === "note" ? "Clear Drawing" : "Clear Page"}" title="${CUR && CUR.kind === "note" ? "Clear Drawing" : "Clear Page"}">${IC.clear}</button></span>
      <button type="button" class="btn small ink-finger" data-act="ink-finger" aria-pressed="${!!T.finger}" title="Off: your Apple Pencil writes and fingers scroll. On: fingers write too.">${IC.hand}Draw with Finger</button>`;
  }
  function bar(){ const el = document.getElementById("inkBar"); if (el) el.innerHTML = barHtml(); syncTouch(); }
  // Draw with Finger off: fingers pan and zoom the page (the Pencil still draws). On: nothing scrolls under the pen layer.
  function syncTouch(){ const box = dlg.querySelector(".pdr-pages, .ink-stage"); if (box) box.classList.toggle("ink-fingers", !!T.finger); }

  /* ---------- In the PDF reader ---------- */
  const readerBtn = () => available() ? `<button type="button" class="btn small ink-mode" data-act="ink-mode" aria-pressed="false" id="inkModeBtn">${IC.pen}Pen</button>` : "";
  function readerPage(n, el){
    const R = P.reader && P.reader(); if (!R) return;
    const ses = pdfSession(); if (!ses) return;
    if (!ses.mine().length && !available()) return;   // nothing to show, and no pen here
    let host = el.querySelector(".ink-layer");
    if (!host) { host = document.createElement("div"); host.className = "ink-layer"; el.appendChild(host); }
    const S = surface(host, n);
    ses.surfaces.set(n, S);
    size(S, el.clientWidth || parseFloat(el.style.width) || 1, el.clientHeight || parseFloat(el.style.height) || 1);
    redraw(S);
  }
  function setMode(on){
    const ses = pdfSession(); if (!ses) return;
    ses.active = !!on && available();
    const box = $("#pdrPages"), btn = $("#inkModeBtn");
    if (box) box.classList.toggle("ink-on", ses.active);
    if (btn) btn.setAttribute("aria-pressed", String(ses.active));
    let el = document.getElementById("inkBar");
    if (ses.active && !el) { const b = dlg.querySelector(".pdr-bar"); if (b) { el = document.createElement("div"); el.id = "inkBar"; el.className = "ink-bar"; el.setAttribute("role", "toolbar"); el.setAttribute("aria-label", "Pen tools"); b.after(el); } }
    if (!ses.active && el) el.remove();
    if (ses.active) { try { window.getSelection().removeAllRanges(); } catch (e) {} const pop = dlg.querySelector(".pdr-pop"); if (pop) pop.remove(); }
    // pages drawn before any ink was there get their layer now
    const R = P.reader(); if (R && R.pages) R.pages.forEach(pg => { if (pg.done && !pg.el.querySelector(".ink-layer")) readerPage(pg.n, pg.el); });
    bar(); ses.store.flush();
  }
  function readerClose(){ if (CUR && CUR.kind === "pdf") endSession(); }

  /* ---------- On a note ---------- */
  const noteInk = n => inkOf(n);
  function noteThumb(n, editing){
    const list = noteInk(n); if (!list.length) return "";
    const svg = svgOf(list), canEdit = editing && available() && !P.locked();
    return canEdit ? `<button type="button" class="ink-thumb" data-act="ink-note" data-id="${esc(n.id)}" aria-label="Edit the drawing">${svg}</button>` : `<div class="ink-thumb">${svg}</div>`;
  }
  function openPad(id){
    const n = state.notes[id]; if (!n || !available()) return;
    if (P.locked()) { proWhy(NOTE_WHY); return; }
    const ses = noteSession(id);
    const ai = typeof photoNoteSheet === "function" && typeof aiReady === "function" && aiReady();
    openSheet(`<div class="sheet ink-sheet">${head(noteInk(n).length ? "Drawing" : "New Drawing")}
      <div id="inkBar" class="ink-bar" role="toolbar" aria-label="Pen tools"></div>
      <div class="ink-stage" id="inkStage"><div class="ink-paper" id="inkPaper" style="--nc:${noteColor(n.color)}"><div class="ink-layer" id="inkPad"></div></div></div>
      <div class="sheet-foot">${ai ? `<button type="button" class="btn ai-btn" data-act="ink-typed">${AI_ICON} Turn Into Typed Notes</button>` : ""}<span class="spacer"></span><button type="button" class="btn primary" data-act="close">Done</button></div>
    </div>`);
    const S = surface($("#inkPad"), 0); ses.surfaces.set(0, S);
    bar(); requestAnimationFrame(() => padLayout());
  }
  function padLayout(){
    if (!CUR || CUR.kind !== "note") return;
    const stage = $("#inkStage"), paper = $("#inkPaper"), S = CUR.surfaces.get(0); if (!stage || !paper || !S) return;
    const w = stage.clientWidth - 24, h = stage.clientHeight - 24;
    let W = Math.floor(h > 200 ? Math.min(w, h / AR) : w); W = Math.max(200, W);
    const H = Math.round(W * AR);
    paper.style.width = W + "px"; paper.style.height = H + "px";
    if (size(S, W, H)) redraw(S, true); else redraw(S);
  }
  // The drawing as a PNG on white, for the AI that reads photos of handwriting
  function pngOf(list){
    const W = 1200, H = Math.round(W * AR), cv = document.createElement("canvas"); cv.width = W; cv.height = H;
    const g = cv.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, W, H);
    const S = {W, H, ctx: [g, g]};
    g.save(); g.globalAlpha = 0.45; g.globalCompositeOperation = "multiply"; list.filter(s => s.t === "hl").forEach(s => paintStroke(S, s)); g.restore();
    list.filter(s => s.t !== "hl").forEach(s => paintStroke(S, s));
    return new Promise(res => cv.toBlob(b => res(b), "image/png"));
  }
  async function typed(){
    if (!CUR || CUR.kind !== "note") return;
    const list = CUR.store.list(); if (!list.length) { toast("Write something first."); return; }
    const blob = await pngOf(list); if (!blob) { toast("Couldn't read the drawing. Try again."); return; }
    const file = new File([blob], `Handwritten note ${new Date().toISOString().slice(0, 10)}.png`, {type: "image/png"});
    endSession();   // the drawing is saved on the note first; the typed notes become a new note
    dlg.close();
    setTimeout(() => photoNoteSheet(file), 0);
  }
  const baseExtra = P.noteExtra, baseBar = P.noteBar;
  P.noteExtra = n => noteThumb(n, true) + (baseExtra ? baseExtra(n) : "");
  P.noteBar = n => (baseBar ? baseBar(n) : "") + (available() ? `<div class="np-bar ink-nbar"><button type="button" class="btn small" data-act="ink-note" data-id="${esc(n.id)}">${IC.pen}${noteInk(n).length ? "Edit Drawing" : "Draw"}${P.locked() ? ` ${PRO_BADGE}` : ""}</button></div>` : "");

  /* ---------- Wiring ---------- */
  hook("act", (act, el, id) => {
    if (!/^ink-/.test(act)) return false;
    switch (act) {
      case "ink-mode": { const ses = pdfSession(); setMode(!(ses && ses.active)); break; }
      case "ink-note": openPad(id); break;
      case "ink-tool": T.tool = ["pen", "hl", "erase"].includes(id) ? id : "pen"; saveTools(); bar(); break;
      case "ink-color": if (T.tool === "hl") T.hl = id; else T.pen = id; saveTools(); bar(); break;
      case "ink-width": { const i = Math.max(0, Math.min(2, Number(id) || 0)); if (T.tool === "hl") T.hw = i; else T.pw = i; saveTools(); bar(); break; }
      case "ink-undo": undo(); break;
      case "ink-redo": redo(); break;
      case "ink-clear": clearPage(); break;
      case "ink-finger": T.finger = !T.finger; saveTools(); bar(); toast(T.finger ? "Your finger draws now." : "Your Apple Pencil draws, and your finger scrolls."); break;
      case "ink-typed": typed(); break;
      default: return false;
    }
    return true;
  });
  hook("changed", changes => {
    if (!CUR) return;
    if (changes.some(c => (CUR.kind === "pdf" && c.kind === "file" && c.id === CUR.fid) || (CUR.kind === "note" && c.kind === "note" && c.id === CUR.nid))) refresh();
  });
  dlg.addEventListener("close", () => { if (!dlg.open && CUR && CUR.kind === "note") endSession(); });
  const flushNow = () => { if (CUR) CUR.store.flush(); };
  window.addEventListener("pagehide", flushNow);
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") flushNow(); });
  let rz = 0; window.addEventListener("resize", () => { if (!CUR || CUR.kind !== "note") return; clearTimeout(rz); rz = setTimeout(padLayout, 120); });

  P.addFeature({id: "ink", name: "Pen and Handwriting", where: "In the iPad app: write on PDFs in the reader (Pen), and draw on a note (Draw)", icon: '<path d="M15.5 4.5l4 4L8 20H4v-4z"/><path d="M13 7l4 4"/>'});
  SBINK = window.SBINK = {available, readerBtn, readerPage, readerClose, noteThumb: n => noteThumb(n, false)};
  window.__sbInk = {T, encode, decode, simplify, svgOf, session: () => CUR, flush: flushNow, available, normInk, LIM};   // test handle

  const css = document.createElement("style");
  css.textContent = `
.ink-mode svg,.ink-finger svg,.ink-nbar svg{flex:none}
.ink-mode,.ink-finger{display:inline-flex;align-items:center;gap:6px}
.ink-mode[aria-pressed="true"]{background:var(--accent);border-color:var(--accent);color:var(--accent-ink,#fff)}
.ink-bar{display:flex;align-items:center;gap:8px 12px;flex-wrap:wrap;padding:6px 16px 8px;border-bottom:1px solid var(--line);background:var(--surface)}
.ink-g{display:inline-flex;align-items:center;gap:4px}
.ink-t[aria-pressed="true"],.ink-w[aria-pressed="true"]{background:color-mix(in srgb,var(--accent) 16%,var(--surface));color:var(--accent);box-shadow:inset 0 0 0 2px var(--accent)}
.ink-col{width:28px;height:28px;border-radius:50%;border:2px solid rgba(0,0,0,.18);background:var(--h);padding:0;cursor:pointer;box-shadow:inset 0 0 0 2px var(--surface)}
.ink-col[aria-pressed="true"]{outline:2px solid var(--ink);outline-offset:2px}
.ink-w i{display:block;width:var(--d);height:var(--d);border-radius:50%;background:currentColor}
.ink-finger[aria-pressed="true"]{background:color-mix(in srgb,var(--accent) 16%,var(--surface));border-color:var(--accent)}
.ink-tip{color:var(--muted)}
.ink-layer{position:absolute;inset:0;z-index:3;pointer-events:none;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}
.ink-cv{position:absolute;left:0;top:0;display:block}
.ink-hlc,.ink-live.hl{opacity:.45;mix-blend-mode:multiply}
.pdr-pages.ink-on .ink-layer{pointer-events:auto;touch-action:manipulation;cursor:crosshair}
.pdr-pages.ink-on.ink-fingers .ink-layer,.ink-stage.ink-fingers .ink-layer{touch-action:none}
.pdr-pages.ink-on .textLayer{pointer-events:none}
dialog:has(.ink-sheet){width:min(980px,calc(100% - 24px));height:min(94vh,1400px)}
.ink-sheet{height:100%;display:flex;flex-direction:column;position:relative}
.ink-stage{flex:1;min-height:0;overflow:auto;background:color-mix(in srgb,var(--ink) 8%,var(--soft));padding:12px;display:flex;align-items:flex-start;justify-content:center}
.ink-paper{position:relative;flex:none;background:var(--nc,#FFF8D6);border-radius:6px;box-shadow:0 1px 3px rgba(0,0,0,.18),0 6px 18px rgba(0,0,0,.08)}
.ink-stage .ink-layer{pointer-events:auto;touch-action:manipulation;cursor:crosshair}
.ink-thumb{display:block;width:100%;margin:6px 0 2px;padding:0;border:0;background:none;border-radius:6px;color:inherit;font:inherit}
button.ink-thumb{cursor:pointer;box-shadow:inset 0 0 0 1px rgba(42,36,24,.18)}
.ink-svg{display:block;width:100%;height:auto;max-height:260px}
.ink-svg-hl{opacity:.45;mix-blend-mode:multiply}
.ink-ask{position:absolute;inset:0;z-index:60;display:grid;place-items:center;background:rgba(0,0,0,.28);border-radius:inherit}
.ink-ask-box{background:var(--surface);color:var(--ink);border:1px solid var(--line);border-radius:14px;box-shadow:var(--shadow);padding:16px;max-width:min(360px,calc(100% - 32px));display:grid;gap:12px}
.ink-ask-box p{margin:0}
.ink-danger{background:var(--late);border-color:var(--late);color:#fff}
@media (max-width:760px){.ink-bar{gap:6px;padding:6px 10px}.ink-finger{font-size:.8rem}}
`;
  document.head.appendChild(css);
})();

