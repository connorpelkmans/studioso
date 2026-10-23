/* ===== module: 98-photo.js ===== */
/* ===== Your Photo themes (1.11.0, Pro) =====
   A student turns their own photo into a full theme. The photo is resized (2400 px on the long side at most), saved
   as WebP (JPEG where WebP can't be made) in this device's IndexedDB ("studyboard-photos"), and, when signed in,
   uploaded through caps.assets so it follows them to their other devices. The small settings (name, focus point,
   blur, brightness, the photo's colour swatches and a tiny blurred placeholder) live in state.settings.photoThemes.
   Colours: a small k-means on a 96 px copy gives up to 6 swatches; the theme's light and dark colours, accent,
   buttons, sticky notes and flashcard kit are built from them in OKLCH and checked for contrast.
   Drawing: one fixed element (#photoArt) with one CSS background: a flat scrim and a flat dim layer over the
   pre-blurred photo (blurred once with a canvas, cached in IndexedDB). No per-frame work.
   Only the active photo theme is registered in SKINS and THEME_KIT, so the rest of the app treats it like any
   built-in theme. Switching to it never changes the note shape or pin.
   Looks (1.11.1): besides blur and brightness a photo theme can carry its own accent color (ac, a hex that wins over
   the photo swatches), a gradient (gr: linear or radial, 2 or 3 stops), a tint (tn), a vignette (vg) and glass cards
   (gl). The picked colors and the gradient style the THEME (accent, buttons, sidebar, and the tint of the page and
   card colors, see buildTheme()); they never paint over the photo, which stays as it was. Only the vignette is drawn
   on the #photoArt background (see stack()), so there's still no per-frame work. They ride along in state.settings.photoThemes. */
(() => {
  const MAX = 5, LONG = 2400, QUAL = 0.82, THUMB = 520, REND = 1600, PFX = "ph-";
  const REASON = "Make a theme from your own photo with Studyboard Pro";
  const PREV = "studyboard:photo:prev", GONE = "studyboard:photo:gone";
  const root = document.documentElement;
  const isPh = id => typeof id === "string" && id.indexOf(PFX) === 0 && id.length < 48;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const num = (v, d, a, b) => { v = Number(v); return isFinite(v) ? clamp(v, a, b) : d; };
  const HEX = /^#[0-9a-f]{6}$/i, TINY = /^data:image\/(webp|jpeg|png);base64,[A-Za-z0-9+/=]+$/;
  const blurFrac = lv => clamp(Number(lv) || 0, 0, 100) / 100 * 0.022;
  const P = () => (typeof PLAN !== "undefined" && PLAN) ? PLAN : null;
  const canUse = () => { const p = P(); return p ? !!p.isPro() : !STORE.paywall; };
  const paywall = () => { const p = P(); if (p && p.openSheet) p.openSheet(REASON); else shopUnlock("skin", "photo"); };
  const canSync = () => !!caps.assets && (inPreview() || (sbActive() && cloud.on));
  const canFetch = () => inPreview() || sbActive();

  /* Records (state.settings.photoThemes) */
  const BLENDS = [["normal", "Normal"], ["multiply", "Multiply"], ["screen", "Screen"], ["overlay", "Overlay"], ["soft-light", "Soft Light"], ["color", "Color"]];
  const hexOr = (h, d) => typeof h === "string" && HEX.test(h) ? h.toUpperCase() : d;
  // Gradient: m is off, over (on top of the photo) or only (instead of the photo)
  function cleanGr(g, sw){
    g = g && typeof g === "object" ? g : {};
    const d = [sw[0], sw[1] || sw[0], sw[2] || sw[1] || sw[0]].map(h => h.toUpperCase());
    let c = (Array.isArray(g.c) ? g.c : []).map((h, i) => hexOr(h, d[i])).slice(0, 3);
    if (c.length < 2) c = d.slice(0, 2);
    return {m: g.m === "on" || g.m === "over" || g.m === "only" ? "on" : "off", t: g.t === "radial" ? "radial" : "linear", a: Math.round(num(g.a, 135, 0, 360)), c, op: Math.round(num(g.op, 55, 5, 100))};
  }
  function cleanTn(t){
    t = t && typeof t === "object" ? t : {};
    return {c: hexOr(t.c, "#FF8A5C"), a: Math.round(num(t.a, 0, 0, 100)), b: BLENDS.some(x => x[0] === t.b) ? t.b : "normal"};
  }
  function clean(r){
    if (!r || !isPh(r.id)) return null;
    const sw = (Array.isArray(r.sw) ? r.sw : []).filter(h => typeof h === "string" && HEX.test(h)).slice(0, 8);
    if (!sw.length) return null;
    const wt = sw.map((_, i) => num((r.wt || [])[i], 1 / sw.length, 0, 1));
    const q = Array.isArray(r.q) && r.q.length === 7 ? r.q.map(v => num(v, 128, 0, 255)) : [40, 60, 95, 130, 170, 200, 215];
    return {id: r.id, name: String(r.name || "My Photo").slice(0, 40), fx: num(r.fx, 50, 0, 100), fy: num(r.fy, 50, 0, 100),
      blur: num(r.blur, 35, 0, 100), bright: num(r.bright, 0, -100, 100), ai: Number.isInteger(r.ai) && r.ai >= 0 && r.ai < sw.length ? r.ai : -1,
      ac: typeof r.ac === "string" && HEX.test(r.ac) ? r.ac.toUpperCase() : "", gr: cleanGr(r.gr, sw), tn: Object.assign(cleanTn(r.tn), {a: 0}), gl: num(r.gl, 0, 0, 100), vg: 0,
      sw, wt, q, tiny: typeof r.tiny === "string" && r.tiny.length < 4000 && TINY.test(r.tiny) ? r.tiny : "",
      asset: typeof r.asset === "string" && r.asset && r.asset.length < 300 ? r.asset : null, w: num(r.w, 1600, 1, 20000), h: num(r.h, 1000, 1, 20000), at: num(r.at, 0, 0, 9e15), ed: num(r.ed, 0, 0, 9e15),
      comps: Array.isArray(r.comps) ? r.comps.filter((x, i, a) => typeof x === "string" && /^[\w-]{1,60}$/.test(x) && a.indexOf(x) === i).slice(0, 3) : []};
  }
  const recs = () => { const a = state.settings && state.settings.photoThemes; return Array.isArray(a) ? a.map(clean).filter(Boolean).slice(0, 12) : []; };
  const recOf = id => recs().find(r => r.id === id) || null;
  const setRecs = list => { state.settings = Object.assign({}, state.settings, {photoThemes: list.map(clean).filter(Boolean)}); };
  function patchRec(id, patch){ const list = recs(); const i = list.findIndex(r => r.id === id); if (i < 0) return false; list[i] = Object.assign({}, list[i], patch); setRecs(list); return true; }

  /* Colour */
  const toLin = c => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  const toSrgb = x => 255 * (x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055);
  function rgb2lab(r, g, b){
    r = toLin(r); g = toLin(g); b = toLin(b);
    const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b), m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b), s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
    return [0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s, 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s];
  }
  function lab2rgb(L, A, B){
    const l = Math.pow(L + 0.3963377774 * A + 0.2158037573 * B, 3), m = Math.pow(L - 0.1055613458 * A - 0.0638541728 * B, 3), s = Math.pow(L - 0.0894841775 * A - 1.2914855480 * B, 3);
    return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s].map(toSrgbSigned);
  }
  function toSrgbSigned(x){ return x < 0 ? -toSrgb(-x) : toSrgb(x); }
  const inGamut = c => c.every(v => v >= -0.5 && v <= 255.5);
  const hex = c => "#" + c.map(v => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, "0")).join("").toUpperCase();
  const hex2rgb = h => [1, 3, 5].map(i => parseInt(h.substr(i, 2), 16));
  // OKLCH to hex; out-of-gamut colours keep their lightness and hue and lose chroma
  function lch(L, C, h){
    L = clamp(L, 0, 1); C = Math.max(0, C);
    const hr = h * Math.PI / 180, co = Math.cos(hr), si = Math.sin(hr);
    let c = lab2rgb(L, C * co, C * si);
    if (!inGamut(c)) { let lo = 0, hi = C; for (let i = 0; i < 20; i++) { const m = (lo + hi) / 2; if (inGamut(lab2rgb(L, m * co, m * si))) lo = m; else hi = m; } c = lab2rgb(L, lo * co, lo * si); }
    return hex(c);
  }
  function hex2lch(h){ const [L, A, B] = rgb2lab(...hex2rgb(h)); return {L, C: Math.hypot(A, B), h: (Math.atan2(B, A) * 180 / Math.PI + 360) % 360}; }
  const lumRgb = c => 0.2126 * toLin(clamp(c[0], 0, 255)) + 0.7152 * toLin(clamp(c[1], 0, 255)) + 0.0722 * toLin(clamp(c[2], 0, 255));
  const lum = h => typeof h === "number" ? h : lumRgb(hex2rgb(h));
  const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const rgba = (h, a) => { const c = hex2rgb(h); return `rgba(${c[0]},${c[1]},${c[2]},${Math.round(a * 1000) / 1000})`; };
  const flat = (h, a) => { const c = rgba(h, a); return `linear-gradient(${c},${c})`; };
  const hueDist = (a, b) => { const d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; };
  const mixHue = (a, b, t) => { let d = ((b - a + 540) % 360) - 180; return (a + d * t + 360) % 360; };
  // Walk the lightness until the colour reaches `min` contrast against every background
  function fit(L, C, h, bgs, min, dir){
    let x = lch(L, C, h);
    for (let i = 0; i < 90 && bgs.some(b => contrast(x, b) < min); i++) { L = clamp(L + dir * 0.01, 0, 1); x = lch(L, C, h); if (L <= 0 || L >= 1) break; }
    return {hex: x, L};
  }

  /* Looks: gradient, tint, vignette (extra layers of the one background) */
  const grCss = (g, alpha) => {
    const c = g.c.map(h => alpha >= 1 ? h : rgba(h, alpha)), st = c.map((x, i) => `${x} ${Math.round(i / (c.length - 1) * 100)}%`).join(",");
    return g.t === "radial" ? `radial-gradient(ellipse at 50% 38%,${st})` : `linear-gradient(${g.a}deg,${st})`;
  };
  // Layers above the photo (top first)
  function stack(rec, photoImg){
    const L = [], add = (i, b) => L.push({i, s: "100% 100%", p: "0 0", b: b || "normal"});
    if (rec.vg > 0) add(`radial-gradient(ellipse at 50% 45%,rgba(0,0,0,0) 45%,rgba(0,0,0,${(rec.vg / 100 * 0.6).toFixed(3)}) 100%)`);
    if (photoImg) L.push({i: photoImg, s: "cover", p: `${rec.fx}% ${rec.fy}%`, b: "normal"});
    return L;
  }
  const lay = (pre, L, key) => pre.concat(L.map(x => x[key]));
  // How light the photo looks once the vignette is on it (7 grey quantiles, like rec.q)
  function effQ(rec){
    let q = rec.q.slice();
    if (rec.vg > 0) q = q.map((v, i) => i <= 2 ? v * (1 - rec.vg / 100 * 0.45) : v);
    return q.map(v => clamp(Math.round(v), 0, 255));
  }

  /* Theme from a record */
  const overLum = (g, layers, paper, a) => { const Pc = hex2rgb(paper); let c = [g, g, g]; layers.forEach(([hx, al]) => { const k = hex2rgb(hx); c = c.map((v, i) => v * (1 - al) + k[i] * al); }); return lumRgb(c.map((v, i) => v * (1 - a) + Pc[i] * a)); };
  function scrimFor(q, layers, paper, ink, dark){
    const Li = lum(ink), at = (g, a) => overLum(g, layers, paper, a);
    const worst = dark ? q[5] : q[1], mid = q[3];
    for (let i = 0; i <= 85; i++) { const a = i / 100; if (contrast(Li, at(mid, a)) >= 4.5 && contrast(Li, at(worst, a)) >= 3) return a; }
    return 0.85;
  }
  function buildTheme(rec){
    const cl = rec.sw.map((h, i) => Object.assign(hex2lch(h), {w: rec.wt[i] || 0, i}));
    const dom = cl[0];
    const scored = cl.map(c => ({c, s: c.C * (0.35 + Math.sqrt(c.w)) * (c.L > 0.22 && c.L < 0.94 ? 1 : 0.4)})).sort((a, b) => b.s - a.s);
    const own = HEX.test(rec.ac) ? hex2lch(rec.ac) : null, q = effQ(rec);
    const acc = own || (rec.ai >= 0 && cl[rec.ai] ? cl[rec.ai] : scored[0].c);
    const neutral = acc.C < 0.03, picked = rec.ai >= 0 || !!own;
    const ha = neutral && !picked ? 255 : acc.h;
    const Cacc = own ? (neutral ? acc.C : clamp(acc.C * 1.05, 0.04, 0.2)) : neutral ? (picked ? 0.03 : 0.1) : clamp(acc.C * 1.15, 0.075, 0.16);
    const Ls = own ? clamp(acc.L, 0.42, 0.62) : 0.6, Ld = own ? clamp(acc.L, 0.62, 0.8) : 0.74;
    const sec = scored.map(x => x.c).find(c => c !== acc && c.C >= 0.035 && hueDist(c.h, ha) >= 25);
    const h2 = sec ? sec.h : (ha + 32) % 360;
    let hn = dom.C >= 0.02 ? dom.h : ha, cn = clamp(dom.C * 0.22, 0.004, 0.018);
    const gOn = rec.gr.m === "on", wash = (hx, a) => { const c = hex2lch(hx); if (c.C >= 0.02) hn = mixHue(hn, c.h, clamp(a, 0, 1)); cn += clamp(c.C, 0, 0.12) * 0.3 * clamp(a, 0, 1); };
    if (rec.tn.a > 0) wash(rec.tn.c, rec.tn.a / 100);
    if (gOn) { const gw = rec.gr.op / 100 * 0.8; wash(rec.gr.c[0], gw / 2); wash(rec.gr.c[rec.gr.c.length - 1], gw / 2); }
    const hs = dom.C >= 0.03 ? dom.h : ha, cs = clamp((dom.C >= 0.03 ? dom.C : Cacc) * 0.55, 0.02, 0.075);
    const warm = cl.filter(c => c.C > 0.05 && c.h > 55 && c.h < 115).sort((a, b) => b.w - a.w)[0], hm = warm ? warm.h : 95;

    const L0 = [lch(0.962, cn, hn), "", lch(0.995, cn * 0.35, hn), lch(0.245, clamp(cn * 1.6, 0.01, 0.035), hn), lch(0.49, clamp(cn * 1.3, 0.008, 0.03), hn), lch(0.885, cn * 1.3, hn), lch(0.935, cn * 1.5 + 0.004, hn), lch(0.978, cn * 0.5, hn)];
    const dl = dimLight(L0.concat(["#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000"]));
    const aL = fit(Ls, Cacc, ha, [dl[2], dl[0], dl[6], dl[7], "#FFFFFF"], 4.6, -1);
    const bL = fit(aL.L, Cacc, h2, ["#FFFFFF"], 4.6, -1).hex;
    const selL = fit(Math.min(aL.L, 0.5), Cacc * 0.9, ha, ["#FFFFFF"], 4.6, -1).hex;
    const spL = lch(0.33, cs, hs);
    const light = [L0[0], rgba(aL.hex, 0.1), L0[2], L0[3], L0[4], L0[5], L0[6], L0[7], aL.hex, lch(aL.L + 0.1, Cacc * 0.85, ha), "#FFFFFF", selL, spL, lch(0.9, 0.025, hs), lch(0.93, 0.11, hm)];
    const D = [lch(0.175, cn + 0.008, hn), "", lch(0.215, cn + 0.01, hn), lch(0.95, 0.012, hn), lch(0.75, 0.02, hn), lch(0.33, cn + 0.012, hn), lch(0.265, cn + 0.014, hn), lch(0.195, cn + 0.01, hn)];
    const aD = fit(Ld, Cacc * 0.95, ha, [D[2], D[0], D[6], D[7]], 4.6, 1);
    let inkD = lch(0.2, 0.04, ha); if (contrast(inkD, aD.hex) < 4.6) inkD = "#0B0D12";
    const bD = fit(aD.L, Cacc * 0.95, h2, [inkD, D[2]], 4.6, 1).hex;
    const selD = fit(0.45, Cacc * 0.7, ha, ["#FFFFFF"], 4.6, -1).hex;
    const spD = lch(0.15, cs * 0.8, hs);
    const dark = [D[0], rgba(aD.hex, 0.08), D[2], D[3], D[4], D[5], D[6], D[7], aD.hex, lch(aD.L + 0.07, Cacc * 0.8, ha), inkD, selD, spD, lch(0.84, 0.03, hs), lch(0.42, 0.07, hm)];

    const beta = rec.bright / 100;
    const dimL = beta < 0 ? ["#000000", -beta * 0.55] : ["#FFFFFF", beta * 0.6];
    const dimD = ["#000000", clamp(0.42 - beta * (beta > 0 ? 0.3 : 0.38), 0.08, 0.82)];
    const scL = scrimFor(q, [dimL], dl[0], L0[3], false), scD = scrimFor(q, [dimD], D[0], D[3], true);
    const ov = {l: `${flat(dl[0], scL)},${flat(dimL[0], dimL[1])}`, d: `${flat(D[0], scD)},${flat(dimD[0], dimD[1])}`};

    const kc0 = lch(0.985, clamp(Cacc * 0.12, 0.004, 0.014), ha), kc1 = lch(0.945, clamp(Cacc * 0.3, 0.012, 0.04), ha);
    const chroma = cl.filter(c => c.C >= 0.035);
    const pull = h => { const n = chroma.map(c => ({c, d: hueDist(c.h, h)})).filter(x => x.d < 70).sort((a, b) => a.d - b.d)[0]; return n ? mixHue(h, n.c.h, 0.35) : h; };
    const notes = [[0.93, 0.1, 95], [0.87, 0.075, 355], [0.885, 0.06, 245], [0.9, 0.075, 145], [0.885, 0.085, 65], [0.87, 0.07, 300]].map(([L, C, h]) => lch(L, C, pull(h)));
    if (chroma.length) { const t = chroma.slice().sort((a, b) => b.w - a.w)[0]; notes[0] = lch(0.915, clamp(t.C * 0.55, 0.045, 0.085), t.h); }
    const kit = {motif: "circle", card: [kc0, kc1], ink: lch(0.25, 0.03, ha), bd: lch(0.84, clamp(Cacc * 0.45, 0.02, 0.07), ha), mc: fit(0.6, Cacc, ha, [kc0, kc1], 3.2, -1).hex, r: 16, notes, fab: "20px", btn: "12px",
      get shape(){ const s = styleCfg().note; return NOTE_SHAPES.some(x => x.id === s) ? s : "classic"; },
      get pin(){ const p = styleCfg().pin; return PINS.some(x => x.id === p) ? p : "pin"; }};

    const gst = gOn ? rec.gr.c.map(hex2lch) : null;
    const gbtn = (dk) => gst && `linear-gradient(135deg,${gst.map(c => (dk ? fit(clamp(c.L, 0.62, 0.8), Math.max(c.C, 0.02), c.h, [inkD], 4.6, 1) : fit(clamp(c.L, 0.42, 0.6), Math.max(c.C, 0.02), c.h, ["#FFFFFF"], 4.6, -1)).hex).join(",")})`;
    const gspn = (dk) => gst && `linear-gradient(180deg,${gst.map(c => lch(dk ? Math.min(c.L, 0.22) : Math.min(c.L, 0.4), c.C, c.h)).join(",")})`;
    const img = stack(rec, rec.tiny ? `url(${rec.tiny})` : `linear-gradient(160deg,${rec.sw[0]},${rec.sw[1] || rec.sw[0]})`).map(x => x.i).join(",");
    const lg = (a, b) => `linear-gradient(180deg,${a},${b})`, lg2 = (a, b) => `linear-gradient(135deg,${a},${b})`;
    const skin = {id: rec.id, name: rec.name, tier: "pro", group: "photo", photo: true, desc: "Your own photo.", light, dark,
      glow: [`${ov.l},${img}`, `${ov.d},${img}`], spine: [gspn(false) || lg(lch(0.4, cs, hs), spL), gspn(true) || lg(lch(0.22, cs, hs), spD)], btn: [gbtn(false) || lg2(aL.hex, bL), gbtn(true) || lg2(aD.hex, bD)]};
    const read = (layers, paper, a, ink, dark) => ({mid: contrast(lum(ink), overLum(q[3], layers, paper, a)), worst: contrast(lum(ink), overLum(dark ? q[5] : q[1], layers, paper, a))});
    return {skin, kit, ov, scL, scD, accent: [aL.hex, aD.hex], read: {l: read([dimL], dl[0], scL, L0[3], false), d: read([dimD], D[0], scD, D[3], true)}};
  }
  const tcache = new Map();
  function themeOf(r){
    const sig = JSON.stringify([r.name, r.sw, r.wt, r.q, r.ai, r.ac, r.bright, r.gr, r.tn, r.vg, r.tiny.length]);
    const c = tcache.get(r.id); if (c && c.sig === sig) return c.t;
    const t = buildTheme(r); tcache.set(r.id, {sig, t}); return t;
  }
  const kitCss = k => `--tc-bg:linear-gradient(160deg,${k.card[0]},${k.card[1]});--tc-ink:${k.ink};--tc-bd:${k.bd};--tc-r:${k.r}px;--tc-mc:${k.mc};--fab-r:${k.fab};--btn-r:${k.btn}`;

  /* Only the active photo theme is in SKINS and THEME_KIT */
  let appliedSig = "";
  function register(){
    const id = styleCfg().skin, rec = isPh(id) ? recOf(id) : null;
    for (let i = SKINS.length - 1; i >= 0; i--) if (SKINS[i].photo && (!rec || SKINS[i].id !== id)) { delete THEME_KIT[SKINS[i].id]; SKINS.splice(i, 1); }
    if (!rec) { appliedSig = ""; return; }
    const t = themeOf(rec), i = SKINS.findIndex(s => s.id === id);
    if (i >= 0) SKINS[i] = t.skin; else SKINS.push(t.skin);
    THEME_KIT[id] = t.kit;
    appliedSig = JSON.stringify(rec);
  }
  const origApply = applySkin;
  applySkin = function(){ try { register(); } catch (e) { console.warn("photo theme", e); } return origApply.apply(this, arguments); };
  // Switching to a photo theme keeps the note shape and pin you see now
  const origSave = saveStyle;
  saveStyle = function(patch){
    try {
      if (patch && isPh(patch.skin) && patch.skin !== styleCfg().skin) {
        const cfg = styleCfg();
        if (!("note" in patch) && cfg.noteAuto === true) patch.note = noteShapeOf(null);
        if (!("pin" in patch) && cfg.pinAuto === true) patch.pin = notePinOf(null);
        if (!isPh(cfg.skin)) { try { localStorage.setItem(PREV, cfg.skin); } catch (e) {} }
      }
    } catch (e) { console.warn("photo theme", e); }
    return origSave.apply(this, arguments);
  };
  function prevSkin(){
    let p = ""; try { p = localStorage.getItem(PREV) || ""; } catch (e) {}
    return p && !isPh(p) && SKINS.some(s => s.id === p) && owns("skin", p) ? p : "classic";
  }

  /* Device storage */
  const DB = {p: null,
    open(){
      if (this.p) return this.p;
      this.p = new Promise((ok, no) => {
        try {
          const r = indexedDB.open("studyboard-photos", 1);
          r.onupgradeneeded = () => { const d = r.result; ["img", "render"].forEach(s => { if (!d.objectStoreNames.contains(s)) d.createObjectStore(s); }); };
          r.onsuccess = () => { const d = r.result; d.onversionchange = () => { try { d.close(); } catch (e) {} this.p = null; }; ok(d); }; r.onerror = () => no(r.error); r.onblocked = () => no(new Error("blocked"));
        } catch (e) { no(e); }
      }).catch(e => { this.p = null; throw e; });
      return this.p;
    },
    async tx(store, mode, fn){ const d = await this.open(); return new Promise((ok, no) => { const t = d.transaction(store, mode), req = fn(t.objectStore(store)); t.oncomplete = () => ok(req ? req.result : undefined); t.onerror = () => no(t.error); t.onabort = () => no(t.error); }); },
    get(s, k){ return this.tx(s, "readonly", st => st.get(k)); },
    put(s, k, v){ return this.tx(s, "readwrite", st => st.put(v, k)); },
    del(s, k){ return this.tx(s, "readwrite", st => st.delete(k)); },
    keys(s){ return this.tx(s, "readonly", st => st.getAllKeys()); }
  };
  const urls = new Map();
  const setUrl = (k, blob) => { const o = urls.get(k); if (o) URL.revokeObjectURL(o); const u = URL.createObjectURL(blob); urls.set(k, u); return u; };
  const dropUrls = id => [...urls.keys()].forEach(k => { if (k.split("|")[1] === id) { URL.revokeObjectURL(urls.get(k)); urls.delete(k); } });
  const have = new Set();

  /* Images */
  const mk = (w, h) => { const c = document.createElement("canvas"); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; };
  const dims = s => [s.naturalWidth || s.width || 0, s.naturalHeight || s.height || 0];
  function draw(src, long){
    const [w, h] = dims(src), k = Math.min(1, long / Math.max(w, h)), c = mk(w * k, h * k), x = c.getContext("2d");
    x.fillStyle = "#FFFFFF"; x.fillRect(0, 0, c.width, c.height);
    x.imageSmoothingEnabled = true; x.imageSmoothingQuality = "high"; x.drawImage(src, 0, 0, c.width, c.height);
    return c;
  }
  const toBlob = (c, type, q) => new Promise(ok => { try { c.toBlob(b => ok(b), type, q); } catch (e) { ok(null); } });
  async function encode(c, q){
    let b = await toBlob(c, "image/webp", q);
    if (!b || b.type !== "image/webp") b = await toBlob(c, "image/jpeg", Math.min(0.9, q + 0.04));
    return b;
  }
  async function decode(blob){
    if (window.createImageBitmap) {
      try { return await createImageBitmap(blob, {imageOrientation: "from-image"}); } catch (e) {}
      try { return await createImageBitmap(blob); } catch (e) {}
    }
    const url = URL.createObjectURL(blob), im = new Image();
    try { im.src = url; await (im.decode ? im.decode() : new Promise((ok, no) => { im.onload = ok; im.onerror = no; })); return draw(im, LONG); }
    finally { URL.revokeObjectURL(url); }
  }
  const FILTER_OK = (() => { try { return "filter" in CanvasRenderingContext2D.prototype; } catch (e) { return false; } })();
  let forceCheapBlur = false;
  // The background copy
  function blurred(src, level){
    const [w, h] = dims(src), k = Math.min(1, REND / Math.max(w, h)), W = Math.round(w * k), H = Math.round(h * k);
    const sigma = blurFrac(level) * Math.max(W, H), c = mk(W, H), x = c.getContext("2d");
    x.imageSmoothingEnabled = true; x.imageSmoothingQuality = "high";
    if (sigma < 0.6) { x.drawImage(src, 0, 0, W, H); return c; }
    const pad = Math.ceil(sigma * 2);
    if (FILTER_OK && !forceCheapBlur) { x.filter = `blur(${sigma.toFixed(1)}px)`; x.drawImage(src, -pad, -pad, W + 2 * pad, H + 2 * pad); x.filter = "none"; return c; }
    const f = Math.max(1.5, sigma / 1.1), s1 = mk(W / f, H / f), s2 = mk(W / Math.sqrt(f), H / Math.sqrt(f));
    [s1, s2].forEach(s => { const sx = s.getContext("2d"); sx.imageSmoothingEnabled = true; sx.imageSmoothingQuality = "high"; });
    s1.getContext("2d").drawImage(src, 0, 0, s1.width, s1.height);
    s2.getContext("2d").drawImage(s1, 0, 0, s2.width, s2.height);
    x.drawImage(s2, -pad / 2, -pad / 2, W + pad, H + pad);
    return c;
  }

  /* Colours from the photo */
  function rng(seed){ return () => { seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function kmeans(lab, n, k){
    const R = rng(1234), cen = [], d2 = new Float32Array(n).fill(Infinity), asg = new Int16Array(n);
    let first = Math.floor(n / 2); cen.push([lab[first * 3], lab[first * 3 + 1], lab[first * 3 + 2]]);
    const dist = (i, c) => { const a = lab[i * 3] - c[0], b = (lab[i * 3 + 1] - c[1]) * 1.4, e = (lab[i * 3 + 2] - c[2]) * 1.4; return a * a + b * b + e * e; };
    while (cen.length < k) {
      let sum = 0; for (let i = 0; i < n; i++) { d2[i] = Math.min(d2[i], dist(i, cen[cen.length - 1])); sum += d2[i]; }
      if (sum <= 1e-9) break;
      let t = R() * sum, i = 0; for (; i < n - 1; i++) { t -= d2[i]; if (t <= 0) break; }
      cen.push([lab[i * 3], lab[i * 3 + 1], lab[i * 3 + 2]]);
    }
    for (let it = 0; it < 12; it++) {
      const s = cen.map(() => [0, 0, 0, 0]);
      for (let i = 0; i < n; i++) { let bi = 0, bd = Infinity; for (let j = 0; j < cen.length; j++) { const d = dist(i, cen[j]); if (d < bd) { bd = d; bi = j; } } asg[i] = bi; const S = s[bi]; S[0] += lab[i * 3]; S[1] += lab[i * 3 + 1]; S[2] += lab[i * 3 + 2]; S[3]++; }
      s.forEach((S, j) => { if (S[3]) cen[j] = [S[0] / S[3], S[1] / S[3], S[2] / S[3]]; });
      if (it === 11) return cen.map((c, j) => ({c, w: s[j][3] / n})).filter(x => x.w > 0);
    }
    return [];
  }
  function analyse(src){
    const c = draw(src, 96), x = c.getContext("2d", {willReadFrequently: true}), d = x.getImageData(0, 0, c.width, c.height).data;
    const n = c.width * c.height, lab = new Float32Array(n * 3), gray = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const r = d[i * 4], g = d[i * 4 + 1], b = d[i * 4 + 2], L = rgb2lab(r, g, b);
      lab[i * 3] = L[0]; lab[i * 3 + 1] = L[1]; lab[i * 3 + 2] = L[2];
      gray[i] = toSrgb(lumRgb([r, g, b]));
    }
    let cl = kmeans(lab, n, 6).sort((a, b) => b.w - a.w);
    const out = [];
    cl.forEach(k => { const t = out.find(o => Math.hypot(o.c[0] - k.c[0], o.c[1] - k.c[1], o.c[2] - k.c[2]) < 0.045); if (t) { const w = t.w + k.w; t.c = t.c.map((v, i) => (v * t.w + k.c[i] * k.w) / w); t.w = w; } else out.push({c: k.c.slice(), w: k.w}); });
    out.sort((a, b) => b.w - a.w);
    return {sw: out.map(o => hex(lab2rgb(...o.c))), wt: out.map(o => Math.round(o.w * 1000) / 1000), gray, gw: c.width, gh: c.height};
  }
  function boxBlur(a, w, h, r){
    let src = Float32Array.from(a); const tmp = new Float32Array(a.length), ri = Math.max(1, Math.round(r));
    for (let pass = 0; pass < 3; pass++) {
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { let s = 0; for (let k = -ri; k <= ri; k++) s += src[y * w + clamp(x + k, 0, w - 1)]; tmp[y * w + x] = s / (2 * ri + 1); }
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { let s = 0; for (let k = -ri; k <= ri; k++) s += tmp[clamp(y + k, 0, h - 1) * w + x]; src[y * w + x] = s / (2 * ri + 1); }
    }
    return src;
  }
  // How light the (blurred) photo is
  function quant(A, level){
    const r = blurFrac(level) * Math.max(A.gw, A.gh), g = r >= 0.5 ? boxBlur(A.gray, A.gw, A.gh, r / 1.7) : A.gray;
    const s = Float32Array.from(g).sort(), at = p => Math.round(s[Math.min(s.length - 1, Math.floor(p * s.length))]);
    return [0.05, 0.1, 0.25, 0.5, 0.75, 0.9, 0.95].map(at);
  }
  function tinyOf(c){
    const t = draw(c, 28); let u = "";
    try { u = t.toDataURL("image/webp", 0.5); if (u.indexOf("data:image/webp") !== 0) u = t.toDataURL("image/jpeg", 0.5); } catch (e) { u = ""; }
    return u.length < 3500 && TINY.test(u) ? u : "";
  }
  async function prepare(src){
    const c = draw(src, LONG), blob = await encode(c, QUAL);
    if (!blob) throw new Error("encode");
    const thumb = await encode(draw(c, THUMB), 0.8);
    const A = analyse(c), tiny = tinyOf(c);
    try { if (src.close) src.close(); } catch (e) {}
    return {blob, thumb, w: c.width, h: c.height, A, tiny};
  }

  /* The background */
  const bgWork = new Map();
  function ensureBg(rec){
    const k = `bg|${rec.id}|${rec.blur}`;
    if (urls.has(k)) return Promise.resolve(urls.get(k));
    if (bgWork.has(k)) return bgWork.get(k);
    const job = (async () => {
      const it = await DB.get("img", rec.id).catch(() => null);
      if (!it || !it.blob) return "";
      have.add(rec.id);
      let blob = it.blob;
      if (blurFrac(rec.blur) * REND >= 0.6) {
        const rd = await DB.get("render", rec.id).catch(() => null);
        if (rd && rd.blur === rec.blur && rd.blob) blob = rd.blob;
        else {
          const src = await decode(it.blob), c = blurred(src, rec.blur);
          try { if (src.close) src.close(); } catch (e) {}
          const b = await encode(c, 0.8);
          if (b) { blob = b; DB.put("render", rec.id, {blur: rec.blur, blob: b}).catch(() => {}); }
        }
      }
      [...urls.keys()].forEach(x => { if (x.indexOf(`bg|${rec.id}|`) === 0 && x !== k) { URL.revokeObjectURL(urls.get(x)); urls.delete(x); } });
      return setUrl(k, blob);
    })().catch(e => { console.warn("photo theme background", e); return ""; }).finally(() => bgWork.delete(k));
    bgWork.set(k, job);
    return job;
  }
  function geo(){
    const nav = document.querySelector("nav.tabs"), r = nav && nav.getBoundingClientRect();
    const side = r && r.left < 4 && r.height > innerHeight * 0.6 ? Math.round(r.right) : 0;
    return {side, W: Math.max(1, innerWidth - side), H: Math.max(1, innerHeight)};
  }
  // Glass cards: how much of the card color stays
  const glassVars = gl => ({"--ph-gl": `${Math.round(100 - gl * 0.62)}%`, "--ph-glb": `${(gl * 0.16).toFixed(1)}px`, "--ph-gls": `${Math.round(94 - gl * 0.1)}%`, "--ph-glo": (0.94 - gl * 0.001).toFixed(3)});
  function teardown(){
    const el = document.getElementById("photoArt"); if (el) el.remove();
    root.classList.remove("ph-on", "ph-glass"); ["--ph-gl", "--ph-glb", "--ph-gls", "--ph-glo"].forEach(k => root.style.removeProperty(k));
  }
  function paint(){
    const id = root.dataset.skin, rec = isPh(id) ? recOf(id) : null;
    if (!rec || !SKINS.some(s => s.id === id)) { teardown(); return false; }
    const t = themeOf(rec), dk = isDarkNow(), g = geo();
    let el = document.getElementById("photoArt");
    if (!el) { el = document.createElement("div"); el.id = "photoArt"; el.setAttribute("aria-hidden", "true"); document.body.prepend(el); }
    const url = urls.get(`bg|${rec.id}|${rec.blur}`);
    if (!url) ensureBg(rec).then(u => { if (u && root.dataset.skin === rec.id) paint(); });
    const img = url ? `url("${url}")` : rec.tiny ? `url(${rec.tiny})` : "", L = stack(rec, img), pre = ["0 0", "0 0"];
    const bi = [dk ? t.ov.d : t.ov.l].concat(L.map(x => x.i)).join(",");
    el.style.left = g.side + "px"; el.style.width = g.W + "px"; el.style.height = g.H + "px";
    if (el.style.backgroundImage !== bi) el.style.backgroundImage = bi;
    el.style.backgroundPosition = lay(pre, L, "p").join(","); el.style.backgroundSize = lay(["100% 100%", "100% 100%"], L, "s").join(",");
    el.style.backgroundBlendMode = lay(["normal", "normal"], L, "b").join(",");
    el.dataset.state = url ? "photo" : "placeholder";
    root.classList.add("ph-on"); root.classList.toggle("ph-glass", rec.gl > 0);
    if (rec.gl > 0) Object.entries(glassVars(rec.gl)).forEach(([k, v]) => root.style.setProperty(k, v));
    else ["--ph-gl", "--ph-glb", "--ph-gls", "--ph-glo"].forEach(k => root.style.removeProperty(k));
    return true;
  }
  hook("skinart", () => paint());

  /* Style Shop previews */
  const thWork = new Set();
  function thumbUrl(id){
    const k = "th|" + id; if (urls.has(k)) return urls.get(k);
    if (!thWork.has(k)) { thWork.add(k); DB.get("img", id).then(it => { if (it && it.thumb) { have.add(id); setUrl(k, it.thumb); refreshThumbs(id); } }).catch(() => {}).finally(() => setTimeout(() => thWork.delete(k), 4000)); }
    return "";
  }
  function thumbStyle(rec, dark){
    const t = themeOf(rec), u = thumbUrl(rec.id), img = u ? `url(${u})` : rec.tiny ? `url(${rec.tiny})` : "", L = stack(rec, img);
    const b = Math.min(4, blurFrac(rec.blur) * 180);
    return `background-image:${[dark ? t.ov.d : t.ov.l].concat(L.map(x => x.i)).join(",")};background-position:${lay(["0 0", "0 0"], L, "p").join(",")};background-size:${lay(["100% 100%", "100% 100%"], L, "s").join(",")};background-blend-mode:${lay(["normal", "normal"], L, "b").join(",")}${b > 0.3 ? `;filter:blur(${b.toFixed(1)}px)` : ""}`;
  }
  function refreshThumbs(id){
    const rec = recOf(id); if (!rec) return;
    document.querySelectorAll(`[data-ph-th="${id}"]`).forEach(el => { el.setAttribute("style", thumbStyle(rec, el.dataset.dk === "1")); });
  }
  hook("thumb", (id, dark) => {
    if (!isPh(id)) return;
    const rec = recOf(id); if (!rec) return;
    return `<span class="sp-art ph-thumb" data-ph-th="${esc(id)}" data-dk="${dark ? 1 : 0}" style="${esc(thumbStyle(rec, !!dark))}"></span>`;
  });

  /* Style Shop: a "Your Photos" section at the top of Themes */
  const CHEV = `<svg class="ui-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>`;
  const PLUS = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="3"/><circle cx="9" cy="10" r="1.6"/><path d="M4 17l5-4.5 3.5 3 2.5-2 5 3.5"/><path d="M19 1.8v5M16.5 4.3h5"/></svg>`;
  const TRASH = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/></svg>`;
  function tileHtml(r, cfg, locked){
    const t = themeOf(r), on = cfg.skin === r.id && root.dataset.skin === r.id;
    const use = locked ? `<button type="button" class="btn small" data-act="ph-use" data-id="${esc(r.id)}">🔒 Unlock</button>`
      : on ? `<button type="button" class="btn small" disabled>In Use</button>` : `<button type="button" class="btn small primary" data-act="ph-use" data-id="${esc(r.id)}">Use</button>`;
    const where = r.asset ? "On all your devices" : canSync() && have.has(r.id) ? "Uploading to your account" : have.has(r.id) || !r.asset ? "Saved on this device" : "";
    return `<div class="shop-tile ph-tile${on ? " on" : ""}" data-ph="${esc(r.id)}"><div class="skin-pair">${skinPreview(t.skin, false)}${skinPreview(t.skin, true)}</div>
      <div class="shop-name"><b>${esc(r.name)}</b>${PRO_BADGE}</div><p class="mini">${esc(where)}</p>
      <div class="ph-acts">${use}<button type="button" class="btn small" data-act="ph-edit" data-id="${esc(r.id)}">Edit</button><button type="button" class="icon-btn ph-del" data-act="ph-del" data-id="${esc(r.id)}" aria-label="Delete ${esc(r.name)}" title="Delete">${TRASH}</button></div></div>`;
  }
  function sectionHtml(lazy){
    const list = recs(), cfg = styleCfg(), full = list.length >= MAX, locked = !canUse();
    const add = `<div class="shop-tile ph-add${full ? " full" : ""}${locked ? " locked" : ""}" data-act="ph-add" role="button" tabindex="0" aria-label="${full ? "Photo theme limit reached" : "Add a Photo"}">
      <span class="ph-add-ic" aria-hidden="true">${locked ? "🔒" : PLUS}</span><b>${full ? "5 Photo Themes Saved" : "Add a Photo"}</b>
      <span class="mini">${full ? "That's the most you can keep. Delete one to add another." : locked ? "Make a theme from your own photo with Studyboard Pro." : "Choose a photo, or drop one here. JPG, PNG, WebP or HEIC."}</span></div>`;
    const inner = `<p class="mini ph-intro">Turn a photo of your campus, your pet or a favorite place into a theme. Buttons, sticky notes and flashcards all pick up its colors.</p>
      <div class="shop-grid ph-grid">${add}${list.map(r => tileHtml(r, cfg, locked)).join("")}</div>
      <input type="file" id="phFile" class="sr" tabindex="-1" aria-hidden="true" accept="image/*,.heic,.heif">`;
    const title = `${PRO_BADGE} Pro · Your Photos`;
    if (!lazy) return `<div class="ph-sec"><h3 class="fsec shop-sec">${title}</h3>${inner}</div>`;
    return `<section class="ui-sec ph-sec" data-f="photos" data-key="themes:your-photos"><h3 class="fsec shop-sec"><button type="button" class="ui-sec-btn" aria-expanded="true"><span class="ui-sec-t">${title}</span><span class="ui-n">${list.length}</span>${CHEV}</button></h3><div class="ui-sec-b">${inner}</div></section>`;
  }
  function injectShop(keepPhotos){
    const body = dlg.querySelector(".sheet.shop .sheet-body"); if (!body || body.querySelector(".ph-sec")) return;
    const lazy = !!body.querySelector(".ui-shop-bar"), mode = body.querySelector(".shop-mode");
    const first = body.querySelector(lazy ? ".ui-sec" : "h3.shop-sec"), html = sectionHtml(lazy);
    if (mode) mode.insertAdjacentHTML("afterend", html); else if (first) first.insertAdjacentHTML("beforebegin", html); else body.insertAdjacentHTML("beforeend", html);
    const sec = body.querySelector(".ph-sec");
    if (lazy) {
      const chips = body.querySelector(".ui-chips");
      if (chips && !chips.querySelector('[data-ui-f="photos"]')) {
        const all = chips.querySelector('[data-ui-f="all"]'), b = `<button type="button" class="ui-chip" data-ui-f="photos" aria-pressed="false">Your Photos</button>`;
        if (all) all.insertAdjacentHTML("afterend", b); else chips.insertAdjacentHTML("afterbegin", b);
      }
      const on = chips && chips.querySelector('.ui-chip[aria-pressed="true"]'), f = on ? on.dataset.uiF : "all";
      if (keepPhotos && chips) { const c = chips.querySelector('[data-ui-f="photos"]'); if (c) c.click(); }
      else {
        if (f !== "all" && f !== "owned" && f !== "photos") sec.hidden = true;
        let st = null; try { st = window.SBUI && SBUI.shopState ? SBUI.shopState() : null; } catch (e) {}
        if (st && st.c && st.c["themes:your-photos"] === 0) { sec.classList.add("shut"); const b = sec.querySelector(".ui-sec-btn"); if (b) b.setAttribute("aria-expanded", "false"); }
      }
    }
    const inp = body.querySelector("#phFile");
    if (inp) inp.addEventListener("change", () => { const f = inp.files && inp.files[0]; inp.value = ""; if (f) addFile(f); });
    const tile = body.querySelector(".ph-add");
    if (tile) {
      tile.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); tile.click(); } });
      ["dragenter", "dragover"].forEach(ev => sec.addEventListener(ev, e => { if (![...(e.dataTransfer && e.dataTransfer.types || [])].includes("Files")) return; e.preventDefault(); tile.classList.add("over"); }));
      sec.addEventListener("dragleave", e => { if (!sec.contains(e.relatedTarget)) tile.classList.remove("over"); });
      sec.addEventListener("drop", e => { const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]; if (!f) return; e.preventDefault(); e.stopPropagation(); tile.classList.remove("over"); addFile(f); });
    }
  }
  const origShop = styleShop;
  styleShop = function(tab){
    const keep = !!(dlg.open && dlg.querySelector('.sheet.shop .ui-chip[data-ui-f="photos"][aria-pressed="true"]'));
    const r = origShop.apply(this, arguments);
    try { if (ui.shopTab === "themes") injectShop(keep && (tab || "themes") === "themes"); } catch (e) { console.warn("photo shop", e); }
    return r;
  };

  /* Adding a photo */
  function addClick(){
    if (!canUse()) { paywall(); return; }
    if (recs().length >= MAX) { toast("You can keep up to 5 photo themes. Delete one to add another."); return; }
    const inp = document.getElementById("phFile");
    if (inp) inp.click();
  }
  const nameFrom = fn => {
    let s = String(fn || "").replace(/\.[a-z0-9]{2,5}$/i, "").replace(/[_\-.]+/g, " ").replace(/\s+/g, " ").trim();
    if (!s || /^(img|dsc|dscn|pxl|photo|image|screenshot|screen shot|mvimg|p\d|\d)/i.test(s) || /\d{4,}/.test(s)) s = "My Photo";
    s = s.slice(0, 30).replace(/\b\w/g, c => c.toUpperCase());
    const names = new Set(recs().map(r => r.name)); let n = s, i = 2;
    while (names.has(n)) n = `${s} ${i++}`;
    return n;
  };
  let adding = false;
  async function addFile(file){
    if (adding || !file) return;
    if (!canUse()) { paywall(); return; }
    if (recs().length >= MAX) { toast("You can keep up to 5 photo themes. Delete one to add another."); return; }
    const heic = /hei[cf]/i.test((file.type || "") + " " + (file.name || ""));
    if (!/^image\//.test(file.type || "") && !/\.(heic|heif|jpe?g|png|webp|gif|avif|bmp)$/i.test(file.name || "")) { toast("That file isn't a photo. Choose a JPG, PNG, WebP or HEIC image."); return; }
    if (file.size > 80e6) { toast("That photo is too big to use. Try a smaller copy of it."); return; }
    adding = true;
    const tile = dlg.querySelector(".ph-add"); if (tile) tile.classList.add("busy");
    const lbl = tile && tile.querySelector("b"); if (lbl) lbl.textContent = "Opening Your Photo…";
    try {
      let src = null; try { src = await decode(file); } catch (e) { src = null; }
      if (!src || !dims(src)[0]) { toast(heic ? "This browser can't open HEIC photos. Save it as a JPG first, then try again." : "Couldn't open that photo. Try a JPG or PNG."); return; }
      const Pp = await prepare(src);
      editor({isNew: true, P: Pp, name: nameFrom(file.name)});
    } catch (e) { console.warn("photo theme", e); toast("Couldn't open that photo. Try a JPG or PNG."); }
    finally { adding = false; if (tile) tile.classList.remove("busy"); if (lbl && lbl.isConnected) lbl.textContent = "Add a Photo"; }
  }

  /* The editor */
  let E = null;
  const blurWord = v => v <= 0 ? "None" : v <= 20 ? "Light" : v <= 45 ? "Soft" : v <= 70 ? "Medium" : "Strong";
  const brightWord = v => v <= -60 ? "Much Darker" : v < -5 ? "Darker" : v <= 5 ? "Normal" : v < 60 ? "Brighter" : "Much Brighter";
  const MOCK_W = `<span class="ph-bg"></span><span class="ph-ov"></span><span class="ph-ui">
      <span class="ph-side"><i class="lg"></i><i class="on"></i><i></i><i></i><i></i><i></i></span>
      <span class="ph-main"><span class="ph-h">Today's Plan</span>
        <span class="ph-card"><span class="ph-row"><i class="ph-ck"></i><b>Midterm Exam</b><em>BSNC 1120</em></span><span class="ph-row"><i class="ph-ck"></i><b>Med Math Practice</b><em>Due Today</em></span><span class="ph-tl"><i></i></span><span class="ph-btn">Start Focus</span></span>
        <span class="ph-bottom"><span class="ph-note" style="--nc:var(--n0)">Quiz on Friday!</span><span class="ph-note r" style="--nc:var(--n2)">Ask about placement</span><span class="ph-fc"><small>Front</small>Mitochondria</span></span>
      </span></span>`;
  const MOCK_T = `<span class="ph-bg"></span><span class="ph-ov"></span><span class="ph-ui">
      <span class="ph-main"><span class="ph-h">Today</span>
        <span class="ph-card"><span class="ph-row"><i class="ph-ck"></i><b>Midterm Exam</b></span><span class="ph-row"><i class="ph-ck"></i><b>Med Math</b></span><span class="ph-btn">Focus</span></span>
        <span class="ph-note" style="--nc:var(--n0)">Quiz Friday!</span></span>
      <span class="ph-bar"><i class="on"></i><i></i><i></i><i></i><i></i></span></span>`;
  /* Accent suggestions from the photo's swatches */
  function suggest(d){
    const out = [];
    const add = (L, C, h) => { const x = lch(L, C, h); if (!out.some(o => hueDist(hex2lch(o).h, h) < 16 && Math.abs(hex2lch(o).L - L) < 0.12)) out.push(x); };
    const cl = d.sw.map((h, i) => Object.assign(hex2lch(h), {w: d.wt[i] || 0})).sort((a, b) => b.C * (0.4 + Math.sqrt(b.w)) - a.C * (0.4 + Math.sqrt(a.w)));
    cl.filter(c => c.C >= 0.03).forEach(c => add(clamp(c.L, 0.5, 0.7), clamp(c.C * 1.35, 0.1, 0.19), c.h));
    const lead = cl.find(c => c.C >= 0.03);
    if (lead) { add(0.62, 0.15, (lead.h + 180) % 360); add(0.64, 0.14, (lead.h + 35) % 360); }
    else [25, 145, 255, 330].forEach(h => add(0.62, 0.15, h));
    return out.slice(0, 8);
  }
  const GRADS = [["Sunset", ["#FFB36B", "#FF5E78", "#7B3FA0"]], ["Ocean", ["#43C6AC", "#2B7FD8", "#191654"]], ["Aurora", ["#3EF0B5", "#4C7DFF", "#B14CFF"]], ["Peach", ["#FFE0C2", "#FFB4A2"]],
    ["Forest", ["#A8E063", "#2E8B57", "#0B3B2E"]], ["Candy", ["#FF9ACB", "#C58BFF", "#74C8FF"]], ["Midnight", ["#2C3E75", "#141E3C", "#05070F"]], ["Slate", ["#E8ECF2", "#9AA7BD"]]];
  const gradStops = (d, i) => `<input type="color" data-ph-gc="${i}" value="${d.gr.c[i] || d.gr.c[d.gr.c.length - 1]}" aria-label="Gradient color ${i + 1}">`;
  const cpWord = d => (d.comps || []).length ? `${d.comps.length} of 3` : "Plain Colors";
  // The companion tiles are drawn the first time the section opens
  const cpImgs = {};
  const cpImg = id => cpImgs[id] || (cpImgs[id] = (() => {
    let svg = SBCOMP.rigSvg(id, {});
    const css = ".cp-svg .cp-p,.cp-svg .cp-headg,.cp-svg .cp-eye,.cp-svg .cp-page{transform-box:view-box}.cp-svg .cp-cheeks{opacity:.62}.cp-svg .cp-e-happy,.cp-svg .cp-e-sleepy,.cp-svg .cp-mouth>g,.cp-svg .cp-prop,.cp-svg .cp-zs{display:none}.cp-svg[data-e=happy] .cp-eye,.cp-svg[data-e=sleepy] .cp-eye{display:none}.cp-svg[data-e=happy] .cp-e-happy,.cp-svg[data-e=sleepy] .cp-e-sleepy{display:inline}.cp-svg[data-e=blink] .cp-eye{transform:scaleY(.1)}.cp-svg[data-m=neutral] .cp-m-neutral,.cp-svg[data-m=smile] .cp-m-smile,.cp-svg[data-m=open] .cp-m-open,.cp-svg[data-m=sleepy] .cp-m-sleepy{display:inline}";
    svg = svg.replace(/<svg([^>]*)>/, (m, at) => `<svg${/xmlns=/.test(at) ? "" : ' xmlns="http://www.w3.org/2000/svg"'}${at}><style>${css}</style>`);
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  })());
  let cpFill = null;
  function cpTiles(d){
    const all = SBCOMP.all(), tn = k => { const x = SKINS.find(s => s.id === k); return x ? x.name : k === "plain" ? "Plain Colors" : k; };
    const picked = d.comps || [], themes = [], by = {};
    all.forEach(c => { if (!by[c.theme]) { by[c.theme] = []; themes.push(c.theme); } by[c.theme].push(c); });
    cpFill = k => by[k].map(tile).join("");
    const tile = c => { const on = picked.includes(c.id);
      return `<button type="button" class="ph-cp${on ? " on" : ""}${c.owned ? "" : " locked"}" data-ph-cp="${esc(c.id)}" aria-pressed="${on}" title="${esc(c.name + (c.kind ? ", " + c.kind : ""))}"><span class="ph-cp-art" aria-hidden="true"><img alt="" width="56" height="56" decoding="async" loading="lazy" src="${cpImg(c.id)}"></span><span class="ph-cp-n">${c.owned ? "" : "🔒 "}${esc(c.name)}</span><span class="ph-cp-t">${esc(c.kind)}</span></button>`; };
    return `<div class="ph-cpmine" id="phCpMine">${cpMine(d)}</div>` + themes.map(k => `<details class="ph-cpg"${by[k].some(c => picked.includes(c.id)) ? " open" : ""}><summary>${esc(tn(k))} <span class="n">${by[k].length}</span></summary><div class="ph-cpgrid" data-k="${esc(k)}">${by[k].some(c => picked.includes(c.id)) ? by[k].map(tile).join("") : ""}</div></details>`).join("");
  }
  function cpMine(d){
    const byId = {}; SBCOMP.all().forEach(c => { byId[c.id] = c; });
    const chips = (d.comps || []).map(id => byId[id]).filter(Boolean).map(c => `<span class="chip">${esc(c.name)}</span>`).join("");
    return `<b>Your three:</b> ${chips || `<span class="hint">none picked yet</span>`}`;
  }
  function fxHtml(d){
    const sug = suggest(d).map(h => `<button type="button" class="ph-swb c" data-ph-sug="${h}" style="--c:${h}" aria-label="Use ${h} for buttons and accents" aria-pressed="false"></button>`).join("");
    const pre = [["From Your Photo", d.sw.slice(0, 3)]].concat(GRADS).map(([n, c], i) => `<button type="button" class="ph-pre" data-ph-gp="${i}" title="${esc(n)}" aria-label="${esc(n)} gradient" style="background:${grCss({t: "linear", a: 135, c}, 1)}"></button>`).join("");
    return `<div class="ph-fx">
      <details class="ph-grp" open><summary>Your Own Color <span class="hint" id="phAccV"></span></summary><div class="ph-grp-b">
        <div class="f"><span class="lh">Suggested for This Photo <span class="hint">livelier versions of its colors</span></span><div class="ph-sug" role="group" aria-label="Suggested colors">${sug}</div></div>
        <div class="f"><span class="lh">Pick Any Color <span class="hint">used for buttons, highlights and links</span></span>
          <div class="ph-own"><input type="color" id="phAcc" value="${d.ac || "#3D7FE0"}" aria-label="Pick a custom color"><input type="text" id="phAccHex" maxlength="7" spellcheck="false" autocomplete="off" placeholder="#RRGGBB" aria-label="Color as a hex code" value="${d.ac}"><button type="button" class="btn small" id="phAccClr">Use the Photo's Colors</button></div></div>
      </div></details>
      <details class="ph-grp"><summary>Gradient <span class="hint" id="phGV"></span></summary><div class="ph-grp-b">
        <div class="segb" role="group" aria-label="Use a gradient in the theme"><button type="button" data-ph-gm="off">Off</button><button type="button" data-ph-gm="on">Use in Theme</button></div>
        <span class="hint">Colors the buttons, sidebar and page tint. Your photo stays as it is.</span>
        <div class="ph-gbody" id="phGBody" style="display:grid;gap:12px">
          <div class="ph-gprev" id="phGPrev" aria-hidden="true"></div>
          <div class="f"><span class="lh">Presets</span><div class="ph-presets" role="group" aria-label="Gradient presets">${pre}</div></div>
          <div class="segb" role="group" aria-label="Gradient shape"><button type="button" data-ph-gt="linear">Linear</button><button type="button" data-ph-gt="radial">Radial</button></div>
          <div class="f" id="phGAWrap"><span class="lh">Angle <span class="hint" id="phGAV"></span></span><input type="range" id="phGA" min="0" max="360" step="5" value="${d.gr.a}"></div>
          <div class="f"><span class="lh">Colors <span class="hint">two or three</span></span><div class="ph-stops" id="phStops">${[0, 1, 2].map(i => gradStops(d, i)).join("")}<button type="button" class="btn small" id="phG3"></button></div></div>
          <div class="f" id="phGOWrap"><span class="lh">Strength <span class="hint" id="phGOV"></span></span><input type="range" id="phGO" min="5" max="100" step="5" value="${d.gr.op}"></div>
        </div>
      </div></details>
      <details class="ph-grp"><summary>Glass Cards <span class="hint" id="phLV"></span></summary><div class="ph-grp-b">
        <label class="f"><span class="lh">See-Through Cards <span class="hint">cards and lists let the background show through, softly frosted</span></span><input type="range" id="phGL" min="0" max="100" step="5" value="${d.gl}"></label>
        <div><button type="button" class="btn small" id="phFxReset">Reset All Looks</button></div>
      </div></details>
      ${window.SBCOMP && SBCOMP.all ? `<details class="ph-grp" id="phCpGrp"><summary>Companions <span class="hint" id="phCpV">${cpWord(d)}</span></summary><div class="ph-grp-b">
        <span class="hint">Pick up to three companions from any theme to live in this one. If you don't pick any, it uses the Plain Colors companions.</span>
        <div class="ph-cps" id="phCps" role="group" aria-label="Companions for this theme"></div>
      </div></details>` : ""}
    </div>`;
  }
  function editor(o){
    const d = o.rec ? Object.assign({}, o.rec) : {id: PFX + uid(), name: o.name || "My Photo", fx: 50, fy: 50, blur: 35, bright: 0, ai: -1, sw: o.P.A.sw, wt: o.P.A.wt, tiny: o.P.tiny, w: o.P.w, h: o.P.h, asset: null, at: 0};
    { const c0 = clean(Object.assign({}, d)); d.ac = c0.ac; d.gr = c0.gr; d.tn = c0.tn; d.gl = c0.gl; d.vg = c0.vg; d.comps = c0.comps.slice(); }
    const url = URL.createObjectURL(o.P.blob);
    E = {o, d, url, A: o.P.A, qc: {}, dark: isDarkNow(), raf: 0};
    const sw = d.sw.map((h, i) => `<button type="button" class="ph-swb c" data-ph-ai="${i}" style="--c:${h}" aria-label="Use this color for buttons and accents" aria-pressed="false"></button>`).join("");
    openSheet(`<form class="sheet ph-sheet">${head(o.isNew ? "New Photo Theme" : "Edit Photo Theme")}
      <div class="sheet-body">
        <div class="ph-stage" id="phStage"><div class="ph-frame ph-wide" role="img" aria-label="Preview on a computer">${MOCK_W}</div><div class="ph-frame ph-tall" role="img" aria-label="Preview on a phone">${MOCK_T}</div></div>
        <div class="ph-prevbar"><div class="segb" role="group" aria-label="Preview in"><button type="button" data-ph-mode="light">Light</button><button type="button" data-ph-mode="dark">Dark</button></div><span class="ph-read" id="phRead" role="status"></span></div>
        <div class="ph-ctl">
          <div class="ph-focus-wrap f"><span class="lh">Focus Point <span class="hint">drag to choose what stays in view</span></span>
            <div class="ph-focus" id="phFocus" style="aspect-ratio:${d.w} / ${d.h}"><img src="${url}" alt="" draggable="false"><span class="ph-crop wide"></span><span class="ph-crop tall"></span><span class="ph-dot" id="phDot" tabindex="0" role="slider" aria-label="Focus point, use the arrow keys to move it" aria-valuemin="0" aria-valuemax="100"></span></div>
            <p class="mini ph-legend"><span><i class="k wide"></i>Computer</span><span><i class="k tall"></i>Phone</span></p></div>
          <div class="ph-fields">
            <label class="f"><span class="lh">Name</span><input type="text" name="phName" id="phName" maxlength="30" required value="${esc(d.name)}" autocomplete="off"></label>
            <label class="f"><span class="lh">Blur <span class="hint" id="phBlurV"></span></span><input type="range" id="phBlur" min="0" max="100" step="5" value="${d.blur}"></label>
            <label class="f"><span class="lh">Brightness <span class="hint" id="phBrV"></span></span><input type="range" id="phBright" min="-100" max="100" step="5" value="${d.bright}"></label>
            <div class="f"><span class="lh">Colors From Your Photo <span class="hint">tap one to use it for buttons</span></span><div class="ph-sw" role="group" aria-label="Accent color"><button type="button" class="ph-swb auto" data-ph-ai="-1" aria-pressed="false">Auto</button>${sw}</div></div>
            <div class="ph-made" id="phMade" aria-hidden="true"><span class="mini">Your Theme</span><span class="ph-mk acc"></span><span class="ph-mk btn"></span>${[0, 1, 2, 3, 4, 5].map(i => `<span class="ph-mk nt" style="background:var(--n${i})"></span>`).join("")}<span class="ph-mk fc"></span></div>
          </div>
        </div>
        ${fxHtml(d)}
      </div>
      <div class="sheet-foot"><button type="button" class="btn" data-act="ph-back">Back</button><span class="spacer"></span><button type="button" class="btn primary" data-submit id="phSave">${o.isNew ? "Save and Use" : "Save Changes"}</button></div></form>`, () => { save(); return false; });
    const sheet = dlg.querySelector(".ph-sheet"); if (!sheet) return;
    const q = s => sheet.querySelector(s), queue = () => { if (!E.raf) E.raf = requestAnimationFrame(upd); };
    q("#phBlur").addEventListener("input", e => { d.blur = +e.target.value; queue(); });
    q("#phBright").addEventListener("input", e => { d.bright = +e.target.value; queue(); });
    q("#phName").addEventListener("input", e => { d.name = e.target.value; });
    const cpGrp = sheet.querySelector("#phCpGrp");
    if (cpGrp) {
      cpGrp.addEventListener("toggle", () => { const box = sheet.querySelector("#phCps"); if (cpGrp.open && box && !box.childElementCount) box.innerHTML = cpTiles(d); });
      cpGrp.addEventListener("toggle", e => { const g = e.target; if (!g.classList || !g.classList.contains("ph-cpg") || !g.open || !cpFill) return; const grid = g.querySelector(".ph-cpgrid"); if (grid && !grid.childElementCount) grid.innerHTML = cpFill(grid.dataset.k); }, true);
      cpGrp.addEventListener("click", e => {
        const b = e.target.closest && e.target.closest("[data-ph-cp]"); if (!b) return;
        if (b.classList.contains("locked")) { toast("That companion comes with Studyboard Pro."); return; }
        const id = b.dataset.phCp, cur = d.comps || (d.comps = []), i = cur.indexOf(id);
        if (i >= 0) cur.splice(i, 1);
        else if (cur.length >= 3) { toast("You can pick up to three companions. Tap one you picked to swap it out."); return; }
        else cur.push(id);
        cpGrp.querySelectorAll("[data-ph-cp]").forEach(x => { const on = cur.includes(x.dataset.phCp); x.classList.toggle("on", on); x.setAttribute("aria-pressed", String(on)); });
        const v = sheet.querySelector("#phCpV"); if (v) v.textContent = cpWord(d);
        const mine = sheet.querySelector("#phCpMine"); if (mine) mine.innerHTML = cpMine(d);
      });
    }
    sheet.querySelectorAll("[data-ph-mode]").forEach(b => b.addEventListener("click", () => { E.dark = b.dataset.phMode === "dark"; queue(); }));
    sheet.querySelectorAll("[data-ph-ai]").forEach(b => b.addEventListener("click", () => { d.ai = +b.dataset.phAi; d.ac = ""; queue(); }));
    sheet.querySelectorAll("[data-ph-sug]").forEach(b => b.addEventListener("click", () => { d.ac = b.dataset.phSug; queue(); }));
    q("#phAcc").addEventListener("input", e => { d.ac = e.target.value.toUpperCase(); queue(); });
    const hx = q("#phAccHex");
    hx.addEventListener("input", () => { let v = hx.value.trim(); if (v && v[0] !== "#") v = "#" + v; const ok = HEX.test(v); hx.setAttribute("aria-invalid", String(!!hx.value && !ok)); if (ok) { d.ac = v.toUpperCase(); queue(); } else if (!hx.value) { d.ac = ""; queue(); } });
    q("#phAccClr").addEventListener("click", () => { d.ac = ""; d.ai = -1; queue(); });
    sheet.querySelectorAll("[data-ph-gm]").forEach(b => b.addEventListener("click", () => { d.gr.m = b.dataset.phGm; queue(); }));
    sheet.querySelectorAll("[data-ph-gt]").forEach(b => b.addEventListener("click", () => { d.gr.t = b.dataset.phGt; queue(); }));
    sheet.querySelectorAll("[data-ph-gp]").forEach(b => b.addEventListener("click", () => {
      const c = (+b.dataset.phGp ? GRADS[+b.dataset.phGp - 1][1] : d.sw.slice(0, 3)).map(h => h.toUpperCase());
      d.gr.c = c.length < 2 ? [c[0], c[0]] : c.slice(0, 3); if (d.gr.m === "off") d.gr.m = "on"; queue();
    }));
    sheet.querySelectorAll("[data-ph-gc]").forEach(inp => inp.addEventListener("input", () => { const i = +inp.dataset.phGc; if (i < d.gr.c.length) { d.gr.c[i] = inp.value.toUpperCase(); queue(); } }));
    q("#phG3").addEventListener("click", () => { if (d.gr.c.length > 2) d.gr.c.length = 2; else d.gr.c.push(d.gr.c[1]); queue(); });
    q("#phGA").addEventListener("input", e => { d.gr.a = +e.target.value; queue(); });
    q("#phGO").addEventListener("input", e => { d.gr.op = +e.target.value; queue(); });
    q("#phGL").addEventListener("input", e => { d.gl = +e.target.value; queue(); });
    q("#phFxReset").addEventListener("click", () => { const z = clean({id: d.id, sw: d.sw, wt: d.wt}); d.ac = ""; d.ai = -1; d.gr = z.gr; d.tn = z.tn; d.gl = 0; d.vg = 0; queue(); });
    const fo = q("#phFocus"), dot = q("#phDot");
    let drag = false;
    const move = e => { const r = fo.getBoundingClientRect(); d.fx = Math.round(clamp((e.clientX - r.left) / r.width * 100, 0, 100)); d.fy = Math.round(clamp((e.clientY - r.top) / r.height * 100, 0, 100)); queue(); };
    fo.addEventListener("pointerdown", e => { e.preventDefault(); drag = true; try { fo.setPointerCapture(e.pointerId); } catch (x) {} move(e); dot.focus({preventScroll: true}); });
    fo.addEventListener("pointermove", e => { if (drag) move(e); });
    ["pointerup", "pointercancel", "lostpointercapture"].forEach(ev => fo.addEventListener(ev, () => { drag = false; }));
    dot.addEventListener("keydown", e => {
      const st = e.shiftKey ? 10 : 2, m = {ArrowLeft: [-st, 0], ArrowRight: [st, 0], ArrowUp: [0, -st], ArrowDown: [0, st]}[e.key];
      if (!m) return; e.preventDefault(); d.fx = clamp(d.fx + m[0], 0, 100); d.fy = clamp(d.fy + m[1], 0, 100); queue();
    });
    const onClose = () => { if (E && E.url === url) { cancelAnimationFrame(E.raf); } setTimeout(() => URL.revokeObjectURL(url), 1500); };
    dlg.addEventListener("close", onClose, {once: true});
    addEventListener("resize", queue);
    E.unresize = () => removeEventListener("resize", queue);
    upd();
  }
  function crop(fw, fh, iw, ih, fx, fy){
    const A = iw / ih, V = fw / fh;
    if (A > V) { const w = V / A; return {l: (1 - w) * fx / 100, t: 0, w, h: 1}; }
    const h = A / V; return {l: 0, t: (1 - h) * fy / 100, w: 1, h};
  }
  function upd(){
    if (!E) return; E.raf = 0;
    const sheet = dlg.querySelector(".ph-sheet"); if (!sheet) { if (E.unresize) E.unresize(); return; }
    const d = E.d;
    if (!E.qc[d.blur]) E.qc[d.blur] = quant(E.A, d.blur);
    d.q = E.qc[d.blur];
    const rec = clean(Object.assign({}, d, {name: d.name || "My Photo"})), t = buildTheme(rec), dk = E.dark;
    const stage = sheet.querySelector("#phStage");
    const gv = rec.gl > 0 ? glassVars(rec.gl) : {};
    const vars = `${skinVars(t.skin, dk)};${kitCss(t.kit)};${t.kit.notes.map((c, i) => `--n${i}:${c}`).join(";")}${Object.entries(gv).map(([k, v]) => `;${k}:${v}`).join("")}`;
    stage.setAttribute("style", vars); sheet.querySelector("#phMade").setAttribute("style", vars);
    stage.classList.toggle("dk", dk);
    stage.querySelectorAll(".ph-frame").forEach(fr => {
      const r = fr.getBoundingClientRect(), fw = r.width || 300, fh = r.height || 200;
      const k = Math.max(fw / d.w, fh / d.h), sig = blurFrac(d.blur) * Math.max(d.w, d.h) * k, pad = sig > 0.3 ? Math.ceil(sig * 2) : 0;
      const bg = fr.querySelector(".ph-bg"), L = stack(rec, `url("${E.url}")`);
      bg.style.cssText = `background-image:${L.map(x => x.i).join(",")};background-position:${L.map(x => x.p).join(",")};background-size:${L.map(x => x.s).join(",")};background-blend-mode:${L.map(x => x.b).join(",")};inset:${-pad}px;${pad ? `filter:blur(${sig.toFixed(1)}px)` : ""}`;
      fr.querySelector(".ph-ov").style.backgroundImage = dk ? t.ov.d : t.ov.l;
    });
    const fo = sheet.querySelector("#phFocus"), cw = fo.parentElement.clientWidth || 300, ratio = d.w / d.h, mh = innerWidth <= 640 ? 220 : 260;
    const fwid = Math.min(cw, mh * ratio); fo.style.width = fwid + "px"; fo.style.height = (fwid / ratio) + "px";
    [["wide", sheet.querySelector(".ph-wide")], ["tall", sheet.querySelector(".ph-tall")]].forEach(([k, fr]) => {
      const r = fr.getBoundingClientRect(), c = crop(r.width || 16, r.height || 10, d.w, d.h, d.fx, d.fy), el = fo.querySelector(".ph-crop." + k);
      el.style.cssText = `left:${c.l * 100}%;top:${c.t * 100}%;width:${c.w * 100}%;height:${c.h * 100}%`;
    });
    const dot = sheet.querySelector("#phDot");
    dot.style.left = d.fx + "%"; dot.style.top = d.fy + "%";
    dot.setAttribute("aria-valuenow", String(d.fx)); dot.setAttribute("aria-valuetext", `${d.fx}% across, ${d.fy}% down`);
    sheet.querySelector("#phBlurV").textContent = blurWord(d.blur);
    sheet.querySelector("#phBrV").textContent = brightWord(d.bright);
    sheet.querySelectorAll("[data-ph-mode]").forEach(b => b.setAttribute("aria-pressed", String((b.dataset.phMode === "dark") === dk)));
    sheet.querySelectorAll("[data-ph-ai]").forEach(b => b.setAttribute("aria-pressed", String(!d.ac && +b.dataset.phAi === d.ai)));
    sheet.querySelectorAll("[data-ph-sug]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.phSug === d.ac)));
    const setv = (el, v) => { if (el && el !== document.activeElement && el.value.toLowerCase() !== String(v).toLowerCase()) el.value = v; };
    setv(sheet.querySelector("#phAcc"), d.ac || t.accent[dk ? 1 : 0]);
    if (document.activeElement !== sheet.querySelector("#phAccHex")) { const hx = sheet.querySelector("#phAccHex"); hx.value = d.ac; hx.removeAttribute("aria-invalid"); }
    sheet.querySelector("#phAccV").textContent = d.ac ? d.ac : d.ai >= 0 ? "From a Photo Color" : "Automatic";
    const g = d.gr, one = id => sheet.querySelector(id);
    sheet.querySelectorAll("[data-ph-gm]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.phGm === g.m)));
    sheet.querySelectorAll("[data-ph-gt]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.phGt === g.t)));
    one("#phGBody").style.display = g.m === "off" ? "none" : "grid";
    one("#phGV").textContent = g.m === "off" ? "Off" : "In the Theme";
    one("#phGPrev").style.background = grCss(g, 1);
    sheet.querySelectorAll("[data-ph-gc]").forEach(inp => { const i = +inp.dataset.phGc; inp.hidden = i >= g.c.length; if (i < g.c.length) setv(inp, g.c[i]); });
    one("#phG3").textContent = g.c.length > 2 ? "Use Two Colors" : "Add a Third Color";
    one("#phGAWrap").hidden = g.t === "radial"; one("#phGAV").textContent = `${g.a}°`; setv(one("#phGA"), String(g.a));
    one("#phGOWrap").hidden = g.m !== "on"; one("#phGOV").textContent = `${g.op}%`; setv(one("#phGO"), String(g.op));
    setv(one("#phGL"), String(d.gl));
    one("#phLV").textContent = d.gl ? `${d.gl}%` : "Off";
    const a = dk ? t.scD : t.scL;
    sheet.querySelector("#phRead").innerHTML = `<i aria-hidden="true">✓</i> ${a < 0.04 ? "Text Is Easy to Read" : "Easy to Read, with a Soft Shade"}${!dk && t.scL >= 0.45 ? `<span class="ph-tip">Looks Best in Dark Mode</span>` : ""}`;
    sheet.querySelector("#phRead").dataset.scrim = a.toFixed(2);
    E.t = t;
  }
  async function save(){
    if (!E || E.saving) return;
    const d = E.d, btn = dlg.querySelector("#phSave");
    d.name = (String(d.name || "").trim() || "My Photo").slice(0, 30);
    if (!E.qc[d.blur]) E.qc[d.blur] = quant(E.A, d.blur);
    d.q = E.qc[d.blur]; d.ed = Date.now();
    const isNew = !!E.o.isNew;
    if (isNew && recs().length >= MAX) { toast("You can keep up to 5 photo themes. Delete one to add another."); return; }
    E.saving = true; if (btn) { btn.disabled = true; btn.textContent = "Saving…"; }
    try {
      if (isNew) { d.at = Date.now(); await DB.put("img", d.id, {blob: E.o.P.blob, thumb: E.o.P.thumb, w: d.w, h: d.h, at: d.at}); have.add(d.id); if (E.o.P.thumb) setUrl("th|" + d.id, E.o.P.thumb); }
      const rec = clean(d);
      const list = recs(), i = list.findIndex(r => r.id === rec.id);
      if (i >= 0) list[i] = Object.assign({}, list[i], rec, {asset: list[i].asset || rec.asset}); else list.push(rec);
      setRecs(list); tcache.delete(rec.id);
      if (styleCfg().skin === rec.id) { saveSettings(); applySkin(); } else { saveStyle({skin: rec.id}); applySkin(); }
      try { if (window.SBCOMP && SBCOMP.refresh) SBCOMP.refresh(); } catch (e) {}
      if (E.unresize) E.unresize();
      E = null;
      if (dlg.open) dlg.close();
      render();
      toast(isNew ? `${rec.name} is your theme now` : `Saved ${rec.name}`);
      if (isNew) upload(rec.id);
    } catch (e) {
      console.warn("photo theme save", e);
      toast("Couldn't save the photo on this device. Check that there's free storage space, then try again.");
      if (E) E.saving = false; if (btn) { btn.disabled = false; btn.textContent = isNew ? "Save and Use" : "Save Changes"; }
    }
  }
  async function edit(id){
    const rec = recOf(id); if (!rec) return;
    if (!canUse()) { paywall(); return; }
    const it = await DB.get("img", id).catch(() => null);
    if (!it || !it.blob) { toast(canFetch() && rec.asset ? "This photo is still downloading. Try again in a moment." : "This photo is on another device. Sign in there and here to sync it."); if (rec.asset) housekeeping(true); return; }
    let src = null; try { src = await decode(it.blob); } catch (e) {}
    if (!src) { toast("Couldn't open this photo. Try deleting it and adding it again."); return; }
    const A = analyse(src); try { if (src.close) src.close(); } catch (e) {}
    editor({isNew: false, rec, P: {blob: it.blob, thumb: it.thumb, w: rec.w, h: rec.h, A, tiny: rec.tiny}});
  }

  /* Use and delete */
  function use(id){
    if (!canUse()) { paywall(); return; }
    if (!recOf(id)) return;
    saveStyle({skin: id}); applySkin(); render(); styleShop();
  }
  function askDelete(id){
    const rec = recOf(id); if (!rec) return;
    confirmSheet("Delete Photo Theme?", `${rec.name} will be removed from Studyboard on all your devices. The original photo on your phone or computer isn't touched.`, "Delete", () => { remove(id); setTimeout(() => styleShop("themes"), 0); });
  }
  const goneList = () => { try { const a = JSON.parse(localStorage.getItem(GONE) || "[]"); return Array.isArray(a) ? a.filter(x => typeof x === "string") : []; } catch (e) { return []; } };
  const setGone = a => { try { localStorage.setItem(GONE, JSON.stringify(a.slice(-20))); } catch (e) {} };
  async function delAsset(asset){
    if (!asset || /^local:/.test(asset)) return;
    if (canSync()) { try { await caps.assets.delete(asset); setGone(goneList().filter(x => x !== asset)); return; } catch (e) {} }
    setGone(goneList().filter(x => x !== asset).concat([asset]));
  }
  async function purge(id){
    dropUrls(id); tcache.delete(id); have.delete(id);
    try { await DB.del("img", id); await DB.del("render", id); } catch (e) {}
  }
  function remove(id){
    const rec = recOf(id); if (!rec) return;
    setRecs(recs().filter(r => r.id !== id));
    state.settings.photoGone = (Array.isArray(state.settings.photoGone) ? state.settings.photoGone : []).filter(g => g && g.id !== id).concat([{id, at: Date.now()}]).slice(-20);
    if (styleCfg().skin === id) { saveStyle({skin: prevSkin()}); applySkin(); } else saveSettings();
    purge(id); delAsset(rec.asset);
    render(); toast(`Deleted ${rec.name}`);
  }

  /* Sync with your other devices */
  const upWork = new Set(), dlWork = new Set(), retryAt = new Map(), missingSince = new Map(), SEEN = "studyboard:photo:seen";
  let grace = 30000;
  const seen = new Set((() => { try { const a = JSON.parse(localStorage.getItem(SEEN) || "[]"); return Array.isArray(a) ? a.filter(isPh) : []; } catch (e) { return []; } })());
  const saveSeen = () => { try { localStorage.setItem(SEEN, JSON.stringify([...seen].slice(-30))); } catch (e) {} };
  async function upload(id){
    if (upWork.has(id) || !canSync() || (retryAt.get("u" + id) || 0) > Date.now()) return;
    const rec = recOf(id); if (!rec || rec.asset) return;
    upWork.add(id);
    try {
      const it = await DB.get("img", id); if (!it || !it.blob) return;
      const type = it.blob.type || "image/webp", ext = /webp/.test(type) ? "webp" : "jpg";
      const file = new File([it.blob], `photo-theme-${rec.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "photo"}.${ext}`, {type});
      const r = await caps.assets.upload(file, {type, folderId: "other"});
      const aid = r && r.id;
      if (!aid || /^local:/.test(aid)) return;
      if (!recOf(id)) { delAsset(aid); return; }
      patchRec(id, {asset: aid}); saveSettings();
      if (dlg.open && dlg.querySelector(".sheet.shop")) { const t = dlg.querySelector(`.ph-tile[data-ph="${id}"] .mini`); if (t) t.textContent = "On all your devices"; }
    } catch (e) { console.warn("photo theme upload", e); retryAt.set("u" + id, Date.now() + 60000); }
    finally { upWork.delete(id); }
  }
  async function download(rec){
    const id = rec.id;
    if (dlWork.has(id) || !canFetch() || (retryAt.get("d" + id) || 0) > Date.now()) return;
    dlWork.add(id);
    try {
      const bytes = await assetBytes(rec.asset);
      const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
      const webp = b.length > 12 && b[0] === 0x52 && b[1] === 0x49 && b[8] === 0x57 && b[9] === 0x45, png = b[0] === 0x89 && b[1] === 0x50;
      const blob = new Blob([b], {type: webp ? "image/webp" : png ? "image/png" : "image/jpeg"});
      const src = await decode(blob), thumb = await encode(draw(src, THUMB), 0.8), [w, h] = dims(src);
      try { if (src.close) src.close(); } catch (e) {}
      if (!recOf(id)) return;
      await DB.put("img", id, {blob, thumb, w, h, at: Date.now()});
      have.add(id);
      if (thumb) { setUrl("th|" + id, thumb); refreshThumbs(id); }
      if (root.dataset.skin === id) paint();
    } catch (e) { console.warn("photo theme download", e); retryAt.set("d" + id, Date.now() + 60000); }
    finally { dlWork.delete(id); }
  }
  let hkBusy = false, hkLast = 0, hkTimer = 0;
  async function housekeeping(now){
    if (hkBusy || (!now && Date.now() - hkLast < 4000)) return;
    hkBusy = true; hkLast = Date.now();
    try {
      const list = recs(), ids = new Set(list.map(r => r.id));
      const n0 = seen.size; list.forEach(r => { seen.add(r.id); missingSince.delete(r.id); }); if (seen.size !== n0) saveSeen();
      let keys = []; try { keys = await DB.keys("img"); } catch (e) { keys = null; }
      if (keys) { have.clear(); keys.forEach(k => have.add(k)); }
      for (const r of list) {
        if (!r.asset && have.has(r.id)) upload(r.id);
        else if (r.asset && keys && !have.has(r.id)) download(r);
      }
      if (canSync()) goneList().forEach(a => delAsset(a));
      if (keys) for (const k of keys) {
        if (ids.has(k)) continue;
        if (!missingSince.has(k)) missingSince.set(k, Date.now());
        let old = false; if (!seen.has(k)) { const it = await DB.get("img", k).catch(() => null); old = !it || Date.now() - (it.at || 0) > 864e5; }
        const tomb = ((state.settings && state.settings.photoGone) || []).some(g => g && g.id === k);
        if (tomb && ((seen.has(k) && Date.now() - missingSince.get(k) > grace) || old)) { purge(k); seen.delete(k); saveSeen(); }
      }
    } catch (e) { console.warn("photo theme sync", e); }
    hkBusy = false;
  }
  let missAt = 0, missTimer = 0;
  hook("render", () => {
    try {
      const id = styleCfg().skin;
      if (isPh(id)) {
        const rec = recOf(id);
        if (!rec) {
          if (!missAt) missAt = Date.now();
          if (!missTimer) missTimer = setTimeout(function chk(){
            missTimer = 0;
            const c = styleCfg();
            if (!isPh(c.skin) || recOf(c.skin)) { missAt = 0; return; }
            const left = grace - (Date.now() - missAt);
            if (left > 0) { missTimer = setTimeout(chk, left + 50); return; }
            missAt = 0; saveStyle({skin: prevSkin()}); applySkin(); scheduleRender();
          }, grace + 50);
        }
        else { missAt = 0; if (root.dataset.skin === id && JSON.stringify(rec) !== appliedSig) applySkin(); }
      } else missAt = 0;
    } catch (e) { console.warn("photo theme", e); }
    clearTimeout(hkTimer); hkTimer = setTimeout(() => housekeeping(false), 1500);
  });
  hook("boot", () => { setTimeout(() => housekeeping(true), 2500); });

  hook("act", (act, el) => {
    if (typeof act !== "string" || act.indexOf("ph-") !== 0) return false;
    const id = el && el.dataset ? el.dataset.id : "";
    if (act === "ph-add") { addClick(); return true; }
    if (act === "ph-use") { use(id); return true; }
    if (act === "ph-edit") { edit(id); return true; }
    if (act === "ph-del") { askDelete(id); return true; }
    if (act === "ph-back") { if (E && E.unresize) E.unresize(); E = null; styleShop("themes"); return true; }
    return false;
  });

  // For tests and support
  window.SBPHOTO = {recs, themeOf: id => { const r = recOf(id); return r ? themeOf(r) : null; }, contrast, housekeeping: () => housekeeping(true),
    keys: () => DB.keys("img"), editing: () => E && {d: Object.assign({}, E.d), scL: E.t && E.t.scL, scD: E.t && E.t.scD}, cheapBlur: v => { forceCheapBlur = !!v; }, grace: ms => { grace = ms; }, MAX};
})();
/* Style Shop, S2 "Category Rail" */
(() => {
  const prevShop = styleShop;
  const sv = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const IC = {
    themes: sv('<path d="M12 3a9 9 0 1 0 0 18c1.3 0 2-.9 2-2 0-.6-.3-1.1-.6-1.5-.3-.4-.5-.8-.5-1.3 0-1 .9-1.7 2-1.7H17a4 4 0 0 0 4-4C21 6.4 17 3 12 3z"/><circle cx="7.5" cy="11" r="1.2"/><circle cx="10" cy="7.2" r="1.2"/><circle cx="14.5" cy="7.2" r="1.2"/>'),
    collections: sv('<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>'),
    cards: sv('<rect x="3" y="6" width="14" height="12" rx="2"/><path d="M7 3h12a2 2 0 0 1 2 2v10"/>'),
    notes: sv('<path d="M5 3h14v11l-5 7H5z"/><path d="M14 21v-7h5"/>'),
    pins: sv('<path d="M9 3h6l-1 6 3 3v2H7v-2l3-3z"/><path d="M12 14v7"/>'),
    stickers: sv('<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>'),
    companions: sv('<path d="M12 21c-4.4 0-7-2.6-7-6.2C5 10.7 8 8 12 8s7 2.7 7 6.8C19 18.4 16.4 21 12 21z"/><path d="M12 8c0-2.5 1.5-4.5 4-5M12 8c-.5-2-2-3.3-4-3.5"/>')
  };
  const count = id => { try {
    if (id === "themes") return SKINS.length;
    if (id === "collections") return window.SBTP && SBTP.themes ? SBTP.themes().length : "";
    const tp = new Set(window.SBTP && SBTP.themes ? SBTP.themes() : []), shown = x => !x.theme || tp.has(x.theme);
    if (id === "cards") return CARD_STYLES.filter(c => c.id !== "theme" && shown(c)).length;
    if (id === "notes") return NOTE_SHAPES.length;
    if (id === "pins") return PINS.filter(shown).length;
    if (id === "stickers") return STICKER_PACKS.filter(shown).length + " packs";
    if (id === "companions") { const hid = window.SBThemes && !SBThemes.all() ? new Set(SBThemes.hidden()) : new Set(); return window.SBCOMP && SBCOMP.all ? SBCOMP.all().filter(c => !hid.has(c.theme)).length : ""; }
  } catch (e) {} return ""; };
  function railify(){
    const sheet = dlg.querySelector(".sheet.shop"); if (!sheet || sheet.querySelector(".shop-rail")) return;
    const body = sheet.querySelector(".sheet-body"), tabs = body && body.querySelector(".shop-tabs"), hd = sheet.querySelector(".sheet-head"); if (!tabs || !hd) return;
    const note = body.querySelector(".shop-note");
    hd.classList.add("shop-band");
    const h2 = hd.querySelector("h2"); if (h2 && !hd.querySelector(".shop-sub")) h2.insertAdjacentHTML("afterend", `<p class="shop-sub">${note ? `Everything is free while Studyboard is in early access · ${PRO_BADGE} items join Studyboard Pro later` : "Themes, flashcard styles, note shapes, pins, stickers and companions"}</p>`);
    if (note) note.remove();
    const rail = document.createElement("nav"); rail.className = "shop-rail"; rail.setAttribute("role", "tablist"); rail.setAttribute("aria-label", "Shop sections");
    tabs.querySelectorAll('[data-act="shop-tab"]').forEach(b => { const n = count(b.dataset.id), t = b.textContent.trim(); b.classList.add("sr-item"); b.innerHTML = `<i class="sr-ic">${IC[b.dataset.id] || IC.themes}</i><span class="sr-t">${esc(t)}</span>${n ? `<em class="sr-n">${esc(String(n))}</em>` : ""}`; rail.appendChild(b); });
    tabs.remove();
    const bar = body.querySelector(".ui-shop-bar"); if (bar && !bar.children.length) bar.remove();
    const wrap = document.createElement("div"); wrap.className = "shop-wrap"; body.before(wrap); wrap.append(rail, body);
    const on = rail.querySelector('[aria-selected="true"]'); if (on && on.scrollIntoView && matchMedia("(max-width:720px)").matches) on.scrollIntoView({inline: "center", block: "nearest"});
  }
  styleShop = function(){ const r = prevShop.apply(this, arguments); try { railify(); } catch (e) { console.warn("shop rail", e); } return r; };
})();


