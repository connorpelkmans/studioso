/* ===== module: 99-pdf-edit.js ===== */
/* Studyboard Pro: edit a PDF's text in the reader (Edit), then download it or save it as a new version */
var SBPDE = null;
/*PDFEDIT-ENGINE-START*/
// The engine works on the PDF itself (with pdf-lib, passed in as L), so a saved file really has the new words:
// the old letters are taken out of the page's drawing instructions, and the new text is drawn in their place.
// Where that isn't possible (text inside a form object, an unusual font encoding), a cover box in the page's
// own background color hides the old text instead.
const PDE_FONTS = {h: ["Helvetica", "HelveticaBold", "HelveticaOblique", "HelveticaBoldOblique"], t: ["TimesRoman", "TimesRomanBold", "TimesRomanItalic", "TimesRomanBoldItalic"], c: ["Courier", "CourierBold", "CourierOblique", "CourierBoldOblique"]};
const pdeFontKey = e => PDE_FONTS[PDE_FONTS[e.f] ? e.f : "h"][(e.b ? 1 : 0) + (e.i ? 2 : 0)];
// The characters the PDF's built-in fonts can draw (Windows-1252)
const PDE_EXTRA = "€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ";
function pdeBadChars(s){
  const bad = new Set();
  for (const ch of String(s || "")) { const c = ch.codePointAt(0); if (ch === "\n" || (c >= 32 && c <= 126) || (c >= 160 && c <= 255) || PDE_EXTRA.includes(ch)) continue; bad.add(ch); }
  return [...bad];
}
// Typographic stand-ins the fonts can draw, so pasted text mostly just works
const pdeTidy = s => String(s || "").replace(/\r\n?/g, "\n").replace(/[‐‑‒−]/g, "-").replace(/[    - ]/g, " ").replace(/[​-‍﻿]/g, "").replace(/′/g, "'").replace(/″/g, '"').replace(/\t/g, "    ");

/* Reading a content stream */
function pdeLex(b){
  const n = b.length, ops = [];
  let i = 0, args = [], argStart = -1;
  const ws = c => c === 0 || c === 9 || c === 10 || c === 12 || c === 13 || c === 32;
  const delim = c => c === 40 || c === 41 || c === 60 || c === 62 || c === 91 || c === 93 || c === 123 || c === 125 || c === 47 || c === 37;
  const skip = () => { for (;;) { while (i < n && ws(b[i])) i++; if (i < n && b[i] === 37) { while (i < n && b[i] !== 10 && b[i] !== 13) i++; continue; } return; } };
  const word = () => { const s = i; while (i < n && !ws(b[i]) && !delim(b[i])) i++; let o = ""; for (let k = s; k < i; k++) o += String.fromCharCode(b[k]); return o; };
  function lit(){
    i++; let depth = 1; const out = [];
    while (i < n) {
      const c = b[i++];
      if (c === 92) {
        if (i >= n) break;
        const d = b[i++];
        if (d === 110) out.push(10); else if (d === 114) out.push(13); else if (d === 116) out.push(9); else if (d === 98) out.push(8); else if (d === 102) out.push(12);
        else if (d === 13) { if (b[i] === 10) i++; }
        else if (d === 10) { /* a line break after \ is no character */ }
        else if (d >= 48 && d <= 55) { let v = d - 48; for (let k = 0; k < 2 && b[i] >= 48 && b[i] <= 55; k++) v = v * 8 + b[i++] - 48; out.push(v & 255); }
        else out.push(d);
      } else if (c === 40) { depth++; out.push(c); }
      else if (c === 41) { if (--depth === 0) break; out.push(c); }
      else out.push(c);
    }
    return {t: "s", v: Uint8Array.from(out)};
  }
  function hex(){
    i++; const ds = [];
    while (i < n && b[i] !== 62) { const c = b[i++]; const v = c >= 48 && c <= 57 ? c - 48 : c >= 65 && c <= 70 ? c - 55 : c >= 97 && c <= 102 ? c - 87 : -1; if (v >= 0) ds.push(v); }
    i++; if (ds.length % 2) ds.push(0);
    const out = new Uint8Array(ds.length / 2); for (let k = 0; k < out.length; k++) out[k] = ds[k * 2] * 16 + ds[k * 2 + 1];
    return {t: "s", v: out};
  }
  function obj(){
    skip(); if (i >= n) return null;
    const c = b[i];
    if (c === 40) return lit();
    if (c === 60 && b[i + 1] === 60) {
      i += 2; const d = {t: "d", v: {}};
      for (;;) { skip(); if (i >= n) break; if (b[i] === 62 && b[i + 1] === 62) { i += 2; break; } const k = obj(); if (!k) { i++; continue; } const v = obj(); if (k.t === "n") d.v[k.v] = v; }
      return d;
    }
    if (c === 60) return hex();
    if (c === 91) { i++; const a = []; for (;;) { skip(); if (i >= n) break; if (b[i] === 93) { i++; break; } const v = obj(); if (v) a.push(v); else i++; } return {t: "a", v: a}; }
    if (c === 47) { i++; return {t: "n", v: word()}; }
    if (c === 41 || c === 62 || c === 93 || c === 123 || c === 125) { i++; return null; }
    const w = word();
    if (/^[+-]?(\d+\.?\d*|\.\d+)$/.test(w)) return {t: "#", v: parseFloat(w)};
    if (w === "true" || w === "false") return {t: "b", v: w === "true"};
    if (w === "null") return {t: "z"};
    return {t: "op", v: w};
  }
  while (i < n) {
    skip(); if (i >= n) break;
    const at = i, o = obj();
    if (!o) continue;
    if (o.t !== "op") { if (argStart < 0) argStart = at; args.push(o); continue; }
    if (o.v === "ID") {
      // inline image data: binary up to a whitespace-wrapped EI
      i++; let j = i;
      while (j + 1 < n && !(b[j] === 69 && b[j + 1] === 73 && ws(b[j - 1]) && (j + 2 >= n || ws(b[j + 2]) || delim(b[j + 2])))) j++;
      i = Math.min(n, j + 2);
      ops.push({op: "BI", args: [], s: argStart < 0 ? at : argStart, e: i}); args = []; argStart = -1; continue;
    }
    if (o.v === "BI") { if (argStart < 0) argStart = at; continue; }
    ops.push({op: o.v, args, s: argStart < 0 ? at : argStart, e: i});
    args = []; argStart = -1;
  }
  return ops;
}

/* What a font's codes are, how wide each one is, and which letters it can draw */
// Glyph names for fonts that rename their codes (/Differences), for the letters people type
const PDE_GLYPHS = {space: " ", exclam: "!", quotedbl: '"', numbersign: "#", dollar: "$", percent: "%", ampersand: "&", quotesingle: "'", quoteright: "’", quoteleft: "‘", parenleft: "(", parenright: ")", asterisk: "*", plus: "+", comma: ",", hyphen: "-", minus: "-", period: ".", slash: "/",
  zero: "0", one: "1", two: "2", three: "3", four: "4", five: "5", six: "6", seven: "7", eight: "8", nine: "9", colon: ":", semicolon: ";", less: "<", equal: "=", greater: ">", question: "?", at: "@", bracketleft: "[", backslash: "\\", bracketright: "]", underscore: "_", braceleft: "{", bar: "|", braceright: "}",
  quotedblleft: "“", quotedblright: "”", endash: "–", emdash: "—", bullet: "•", ellipsis: "…", eacute: "é", egrave: "è", aacute: "á", agrave: "à", ntilde: "ñ", oacute: "ó", uacute: "ú", iacute: "í", ccedilla: "ç", udieresis: "ü", odieresis: "ö", adieresis: "ä", degree: "°", copyright: "©", registered: "®"};
// Letters that stand in for each other when a font has one and not the other (the document's own punctuation wins)
const PDE_ALTS = {" ": ["\u00a0"], "'": ["\u2019", "\u02bc"], "\u2019": ["'"], "\u2018": ["'"], '"': ["\u201d", "\u201c"], "\u201c": ['"'], "\u201d": ['"'], "-": ["\u2010", "\u2011", "\u2212"], "\u2013": ["-"]};
function pdeCmap(bytes){
  // A ToUnicode map: code (as a number) to text
  const s = new TextDecoder("latin1").decode(bytes), map = new Map();
  const hexv = h => parseInt(h, 16), u16 = h => { let o = ""; for (let k = 0; k + 4 <= h.length; k += 4) o += String.fromCharCode(parseInt(h.slice(k, k + 4), 16)); return h.length % 4 && h.length === 2 ? String.fromCharCode(parseInt(h, 16)) : o; };
  let bytesPer = 1;
  const csr = /<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>\s*endcodespacerange/.exec(s) || /begincodespacerange\s*<([0-9a-fA-F]+)>/.exec(s); if (csr) bytesPer = Math.max(1, csr[1].length / 2);
  for (const blk of s.split("beginbfchar").slice(1)) { const body = blk.split("endbfchar")[0], re = /<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]*)>/g; let m; while ((m = re.exec(body))) map.set(hexv(m[1]), u16(m[2])); }
  for (const blk of s.split("beginbfrange").slice(1)) {
    const body = blk.split("endbfrange")[0], re = /<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>\s*(<([0-9a-fA-F]*)>|\[([^\]]*)\])/g; let m;
    while ((m = re.exec(body))) {
      const lo = hexv(m[1]), hi = Math.min(hexv(m[2]), lo + 65535);
      if (m[4] != null) { const base = m[4], last = parseInt(base.slice(-4) || "0", 16), head = u16(base.slice(0, -4)); for (let c = lo; c <= hi; c++) map.set(c, head + String.fromCharCode(last + c - lo)); }
      else { const list = (m[5].match(/<([0-9a-fA-F]*)>/g) || []).map(x => u16(x.slice(1, -1))); for (let c = lo; c <= hi && c - lo < list.length; c++) map.set(c, list[c - lo]); }
    }
  }
  return {map, bytesPer};
}
function pdeFont(L, doc, dict, res){
  const look = v => v instanceof L.PDFRef ? doc.context.lookup(v) : v;
  const num = v => { v = look(v); return v instanceof L.PDFNumber ? v.asNumber() : typeof v === "number" ? v : NaN; };
  const name = v => { v = look(v); return v instanceof L.PDFName ? v.decodeText() : ""; };
  const arr = v => { v = look(v); return v instanceof L.PDFArray ? v : null; };
  const out = {res: res || "", two: false, ok: true, w: () => 0.5, scale: 0.001, uni: null, sub: "", enc: () => null, base: "", serif: false, mono: false, bold: false, italic: false};
  if (!(dict instanceof L.PDFDict)) { out.ok = false; return out; }
  const sub = out.sub = name(dict.get(L.PDFName.of("Subtype")));
  // its name and style, for a look-alike when its letters run out
  {
    const ds0 = sub === "Type0" ? arr(dict.get(L.PDFName.of("DescendantFonts"))) : null, d0 = ds0 ? look(ds0.get(0)) : dict, fd0 = d0 instanceof L.PDFDict ? look(d0.get(L.PDFName.of("FontDescriptor"))) : null;
    const base = out.base = name(dict.get(L.PDFName.of("BaseFont"))).replace(/^[A-Z]{6}\+/, "");
    const flags = fd0 instanceof L.PDFDict ? num(fd0.get(L.PDFName.of("Flags"))) || 0 : 0, weight = fd0 instanceof L.PDFDict ? num(fd0.get(L.PDFName.of("FontWeight"))) : NaN, ang = fd0 instanceof L.PDFDict ? num(fd0.get(L.PDFName.of("ItalicAngle"))) : NaN;
    out.mono = /courier|mono|consol|menlo|typewriter/i.test(base) || !!(flags & 1);
    out.serif = !out.mono && !/sans|arial|helvetica|verdana|calibri|segoe|roboto|tahoma|gothic/i.test(base) && (!!(flags & 2) || /times|roman|serif|georgia|garamond|cambria|book|minion|palatino|baskerville|caslon/i.test(base));
    out.bold = /bold|black|heavy|semibold|demi/i.test(base) || weight >= 600 || !!(flags & (1 << 18));
    out.italic = /italic|oblique/i.test(base) || (Number.isFinite(ang) && ang !== 0) || !!(flags & 64);
  }
  const tu = look(dict.get(L.PDFName.of("ToUnicode")));
  if (tu instanceof L.PDFRawStream) { try { out.uni = pdeCmap(L.decodePDFRawStream(tu).decode()).map; } catch (e) {} }
  // text to codes, only when every letter has a code and a shape in this font
  const fromUni = (text, step) => {
    if (!out.uni) return null;
    if (!out.rev) { out.rev = new Map(); for (const [c, u] of out.uni) if (u && [...u].length === 1 && (!out.rev.has(u) || c < out.rev.get(u))) out.rev.set(u, c); }
    const codes = [];
    for (const ch of text) { let c = out.rev.get(ch); if (c == null) for (const alt of PDE_ALTS[ch] || []) { c = out.rev.get(alt); if (c != null) break; } if (c == null) return null; codes.push(c); }
    const b = new Uint8Array(codes.length * step); codes.forEach((c, k) => { if (step === 2) { b[k * 2] = c >> 8; b[k * 2 + 1] = c & 255; } else b[k] = c & 255; });
    return b;
  };
  if (sub === "Type0") {
    const enc = name(dict.get(L.PDFName.of("Encoding")));
    out.two = true; if (!/^Identity-[HV]$/.test(enc)) out.ok = false;
    const ds = arr(dict.get(L.PDFName.of("DescendantFonts"))), cid = ds && look(ds.get(0));
    const map = new Map(); let dw = 1000;
    if (cid instanceof L.PDFDict) {
      const d = num(cid.get(L.PDFName.of("DW"))); if (Number.isFinite(d)) dw = d;
      const W = arr(cid.get(L.PDFName.of("W")));
      if (W) for (let k = 0; k < W.size();) {
        const first = num(W.get(k)), next = look(W.get(k + 1));
        if (next instanceof L.PDFArray) { for (let j = 0; j < next.size(); j++) map.set(first + j, num(next.get(j))); k += 2; }
        else { const last = num(next), w = num(W.get(k + 2)); for (let c = first; c <= last && c - first < 65536; c++) map.set(c, w); k += 3; }
      }
    }
    out.w = c => (map.has(c) ? map.get(c) : dw) / 1000;
    out.enc = text => out.ok && enc === "Identity-H" ? fromUni(text, 2) : null;
    return out;
  }
  const fm = arr(dict.get(L.PDFName.of("FontMatrix")));
  const scale = sub === "Type3" && fm ? num(fm.get(0)) || 0.001 : 0.001;
  const first = num(dict.get(L.PDFName.of("FirstChar"))), W = arr(dict.get(L.PDFName.of("Widths")));
  const fd = look(dict.get(L.PDFName.of("FontDescriptor"))), miss = fd instanceof L.PDFDict ? num(fd.get(L.PDFName.of("MissingWidth"))) : NaN;
  const embedded = fd instanceof L.PDFDict && ["FontFile", "FontFile2", "FontFile3"].some(k => fd.get(L.PDFName.of(k)));
  const wAt = c => { const k = c - first, v = W && k >= 0 && k < W.size() ? num(W.get(k)) : NaN; return v; };
  if (W && Number.isFinite(first)) out.w = c => { const v = wAt(c); return (Number.isFinite(v) ? v : Number.isFinite(miss) ? miss : 500) * scale; };
  else {
    // One of the 14 standard fonts, with no widths in the file: use the font's own metrics
    const base = name(dict.get(L.PDFName.of("BaseFont"))).replace(/^[A-Z]{6}\+/, "");
    const std = {"Helvetica": "Helvetica", "Helvetica-Bold": "HelveticaBold", "Helvetica-Oblique": "HelveticaOblique", "Helvetica-BoldOblique": "HelveticaBoldOblique", "Times-Roman": "TimesRoman", "Times-Bold": "TimesRomanBold", "Times-Italic": "TimesRomanItalic", "Times-BoldItalic": "TimesRomanBoldItalic", "Courier": "Courier", "Courier-Bold": "CourierBold", "Courier-Oblique": "CourierOblique", "Courier-BoldOblique": "CourierBoldOblique", "Arial": "Helvetica", "Arial,Bold": "HelveticaBold", "TimesNewRoman": "TimesRoman", "CourierNew": "Courier"}[base];
    if (/^Courier/.test(base)) out.w = () => 0.6;
    else if (std) {
      try {
        const em = L.StandardFontEmbedder.for(L.StandardFonts[std]), cache = new Map();
        out.w = c => { if (cache.has(c)) return cache.get(c); let v = 0.5; try { v = em.widthOfTextAtSize(String.fromCharCode(c < 128 || c > 159 ? c : 32), 1000) / 1000; } catch (e) {} cache.set(c, v); return v; };
      } catch (e) {}
    }
  }
  if (sub === "Type3") return out;
  // a simple font: its ToUnicode map, or its encoding (with any renamed codes)
  const encObj = look(dict.get(L.PDFName.of("Encoding")));
  out.enc = text => {
    const viaMap = fromUni(text, 1); if (viaMap) return viaMap;
    if (out.uni) return null;
    const diff = new Map();
    if (encObj instanceof L.PDFDict) { const d = arr(encObj.get(L.PDFName.of("Differences"))); let c = 0; if (d) for (let k = 0; k < d.size(); k++) { const v = look(d.get(k)); if (v instanceof L.PDFNumber) c = v.asNumber(); else if (v instanceof L.PDFName) { const g = v.decodeText(); diff.set(c++, g.length === 1 ? g : PDE_GLYPHS[g] || ""); } } }
    const rev = new Map(); for (const [c, ch] of diff) if (ch && !rev.has(ch)) rev.set(ch, c);
    // the base encoding: WinAnsi (Windows-1252), or Standard (curly quotes where ' and ` are)
    const baseName = encObj instanceof L.PDFName ? encObj.decodeText() : encObj instanceof L.PDFDict ? name(encObj.get(L.PDFName.of("BaseEncoding"))) : "";
    const base = ch => {
      const k = ch.charCodeAt(0);
      if (baseName === "WinAnsiEncoding") { if ((k >= 32 && k <= 126) || (k >= 160 && k <= 255)) return k; const x = "€\u0081‚ƒ„…†‡ˆ‰Š‹Œ\u008dŽ\u008f\u0090‘’“”•–—˜™š›œ\u009džŸ".indexOf(ch); return x >= 0 ? 128 + x : null; }
      if (baseName === "MacRomanEncoding") return k >= 32 && k <= 126 ? k : null;
      // Standard encoding draws curly quotes at the places of ' and `
      if (ch === "’" || ch === "'") return 39; if (ch === "‘" || ch === "`") return 96;
      return k >= 32 && k <= 126 ? k : null;
    };
    const codes = [];
    for (const ch of text) {
      let c = rev.get(ch);
      if (c == null) { const k = base(ch); if (k != null && !diff.has(k)) c = k; }
      if (c == null) return null;
      // a cut-down embedded font only has shapes for the codes it was given a width for
      if (embedded && !(wAt(c) > 0)) return null;
      codes.push(c);
    }
    return Uint8Array.from(codes);
  };
  return out;
}

const pdeHexOf = rgb => "#" + rgb.map(v => Math.max(0, Math.min(255, Math.round(v * 255))).toString(16).padStart(2, "0")).join("");
/* Where each letter on a page is, and taking out the ones under an edit */
const pdeMul = (m, n) => [m[0] * n[0] + m[1] * n[2], m[0] * n[1] + m[1] * n[3], m[2] * n[0] + m[3] * n[2], m[2] * n[1] + m[3] * n[3], m[4] * n[0] + m[5] * n[2] + n[4], m[4] * n[1] + m[5] * n[3] + n[5]];
const pdeApply = (m, x, y) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
// The area an edit replaces, in the page's own units: from o, along r degrees, w wide, y0 to y1 above the baseline
const pdeLocal = (rg, x, y) => { const a = rg.r * Math.PI / 180, dx = x - rg.o[0], dy = y - rg.o[1]; return [dx * Math.cos(a) + dy * Math.sin(a), -dx * Math.sin(a) + dy * Math.cos(a)]; };
function pdeInside(rg, x, y){ const [lx, ly] = pdeLocal(rg, x, y), tol = rg.tol || 0; return lx >= -tol && lx <= rg.w + tol && ly >= rg.y0 && ly <= rg.y1; }
const pdeFmt = v => { const s = (Math.round(v * 10000) / 10000).toString(); return s === "-0" ? "0" : s; };
const pdeHex = u8 => "<" + Array.from(u8, c => (c < 16 ? "0" : "") + c.toString(16)).join("") + ">";
// Takes the letters whose middle is inside a region out of the page's text, keeping every other letter exactly where it was.
// Returns the new content, how many letters each region lost, and for each region the font, size and position its first letter had.
function pdeStrip(bytes, regions, fontOf, dry){
  const ops = pdeLex(bytes), hits = regions.map(() => 0), info = regions.map(() => null), swaps = [];
  let gs = {ctm: [1, 0, 0, 1, 0, 0], Tc: 0, Tw: 0, Th: 1, TL: 0, Ts: 0, font: null, fs: 0, fill: "#000000"};
  const stack = []; let tm = [1, 0, 0, 1, 0, 0], tlm = tm, depth = 0, minDepth = 0;
  const nums = o => o.args.map(a => a && a.t === "#" ? a.v : NaN);
  function show(op, items){
    // items: strings (as bytes) and numbers, as in TJ
    const f = gs.font, fs = gs.fs, th = gs.Th;
    if (!f) { for (const it of items) if (typeof it === "number") tm = pdeMul([1, 0, 0, 1, -it / 1000 * fs * th, 0], tm); return; }
    const out = []; let changed = false, gap = 0;
    for (const it of items) {
      if (typeof it === "number") { if (gap) { out.push(gap); gap = 0; } out.push(it); tm = pdeMul([1, 0, 0, 1, -it / 1000 * fs * th, 0], tm); continue; }
      const step = f.two ? 2 : 1, keep = [];
      for (let k = 0; k + step <= it.length; k += step) {
        const code = step === 2 ? it[k] * 256 + it[k + 1] : it[k], w0 = f.w(code), space = step === 1 && code === 32;
        const adv = (w0 * fs + gs.Tc + (space ? gs.Tw : 0)) * th;
        const m = pdeMul(tm, gs.ctm), [px, py] = pdeApply(m, w0 * fs * th / 2, gs.Ts + fs * 0.32);
        let hit = -1;
        if (f.ok && fs && th) for (let r = 0; r < regions.length; r++) if (pdeInside(regions[r], px, py)) { hit = r; break; }
        if (hit >= 0) {
          const [lx] = pdeLocal(regions[hit], ...pdeApply(m, 0, 0)), I = info[hit];
          if (!I || lx < I.lx) info[hit] = {lx, font: f, fs, th, tc: gs.Tc, ts: gs.Ts, m: m.slice(), fill: gs.fill, nat: I ? I.nat : 0, spaces: I ? I.spaces : 0, n: I ? I.n : 0};
          const J = info[hit], blank = space || !!(f.uni && /^\s*$/.test(f.uni.get(code) || "x")); J.nat += (w0 * fs + gs.Tc) * th; J.n++; if (blank) J.spaces++;
          if (!blank) hits[hit]++;
          if (keep.length) { out.push(Uint8Array.from(keep)); keep.length = 0; }
          gap -= adv * 1000 / (fs * th); changed = true;
        } else {
          if (gap) { if (keep.length) { out.push(Uint8Array.from(keep)); keep.length = 0; } out.push(gap); gap = 0; }
          for (let j = 0; j < step; j++) keep.push(it[k + j]);
        }
        tm = pdeMul([1, 0, 0, 1, adv, 0], tm);
      }
      if (keep.length) out.push(Uint8Array.from(keep));
    }
    if (gap) out.push(gap);
    if (!changed || dry) return;
    const arr = "[" + out.map(x => typeof x === "number" ? pdeFmt(x) : pdeHex(x)).join(" ") + "] TJ";
    swaps.push({s: op.s, e: op.e, text: op.op === "'" ? "T* " + arr : op.op === '"' ? `${pdeFmt(nums(op)[0])} Tw ${pdeFmt(nums(op)[1])} Tc T* ${arr}` : arr});
  }
  for (const o of ops) {
    const a = nums(o);
    switch (o.op) {
      case "q": stack.push(Object.assign({}, gs)); depth++; break;
      case "Q": if (stack.length) gs = stack.pop(); depth--; minDepth = Math.min(minDepth, depth); break;
      case "cm": if (a.length === 6 && a.every(Number.isFinite)) gs.ctm = pdeMul(a, gs.ctm); break;
      // the fill colour text is drawn in (gray, RGB or CMYK; other colour spaces read as their numbers allow)
      case "g": if (Number.isFinite(a[0])) gs.fill = pdeHexOf([a[0], a[0], a[0]]); break;
      case "rg": if (a.length === 3 && a.every(Number.isFinite)) gs.fill = pdeHexOf(a); break;
      case "k": if (a.length === 4 && a.every(Number.isFinite)) gs.fill = pdeHexOf([0, 1, 2].map(i => (1 - a[i]) * (1 - a[3]))); break;
      case "sc": case "scn": { const v = a.filter(Number.isFinite); if (v.length === 1) gs.fill = pdeHexOf([v[0], v[0], v[0]]); else if (v.length === 3) gs.fill = pdeHexOf(v); else if (v.length === 4) gs.fill = pdeHexOf([0, 1, 2].map(i => (1 - v[i]) * (1 - v[3]))); break; }
      case "BT": tm = tlm = [1, 0, 0, 1, 0, 0]; break;
      case "Tf": { const nm = o.args[0] && o.args[0].t === "n" ? o.args[0].v : ""; gs.font = fontOf(nm); gs.fs = Number.isFinite(a[1]) ? a[1] : 0; break; }
      case "Tc": if (Number.isFinite(a[0])) gs.Tc = a[0]; break;
      case "Tw": if (Number.isFinite(a[0])) gs.Tw = a[0]; break;
      case "Tz": if (Number.isFinite(a[0])) gs.Th = a[0] / 100; break;
      case "TL": if (Number.isFinite(a[0])) gs.TL = a[0]; break;
      case "Ts": if (Number.isFinite(a[0])) gs.Ts = a[0]; break;
      case "Td": if (a.length === 2) tm = tlm = pdeMul([1, 0, 0, 1, a[0], a[1]], tlm); break;
      case "TD": if (a.length === 2) { gs.TL = -a[1]; tm = tlm = pdeMul([1, 0, 0, 1, a[0], a[1]], tlm); } break;
      case "Tm": if (a.length === 6 && a.every(Number.isFinite)) tm = tlm = a.slice(); break;
      case "T*": tm = tlm = pdeMul([1, 0, 0, 1, 0, -gs.TL], tlm); break;
      case "Tj": if (o.args[0] && o.args[0].t === "s") show(o, [o.args[0].v]); break;
      case "'": tm = tlm = pdeMul([1, 0, 0, 1, 0, -gs.TL], tlm); if (o.args[0] && o.args[0].t === "s") show(o, [o.args[0].v]); break;
      case '"': if (Number.isFinite(a[0])) gs.Tw = a[0]; if (Number.isFinite(a[1])) gs.Tc = a[1]; tm = tlm = pdeMul([1, 0, 0, 1, 0, -gs.TL], tlm); if (o.args[2] && o.args[2].t === "s") show(o, [o.args[2].v]); break;
      case "TJ": if (o.args[0] && o.args[0].t === "a") show(o, o.args[0].v.map(x => x.t === "#" ? x.v : x.t === "s" ? x.v : null).filter(x => x != null)); break;
    }
  }
  let out = bytes;
  if (swaps.length) {
    const enc = new TextEncoder(), parts = []; let at = 0;
    for (const s of swaps) { parts.push(bytes.subarray(at, s.s), enc.encode(s.text)); at = s.e; }
    parts.push(bytes.subarray(at));
    out = concatU8(parts);
  }
  return {bytes: out, hits, info, open: Math.max(0, depth - minDepth), under: -minDepth};
}

/* A page's content and fonts */
function pdePage(L, doc, n){
  const page = doc.getPages()[n - 1]; if (!page) return null;
  const node = page.node, look = v => v instanceof L.PDFRef ? doc.context.lookup(v) : v;
  const raw = look(node.get(L.PDFName.of("Contents"))), chunks = [];
  const one = s => { s = look(s); if (s instanceof L.PDFRawStream) chunks.push(L.decodePDFRawStream(s).decode()); else if (s instanceof L.PDFStream && s.getContents) chunks.push(s.getContents()); };
  if (raw instanceof L.PDFArray) for (let k = 0; k < raw.size(); k++) one(raw.get(k)); else if (raw) one(raw);
  const nl = new Uint8Array([10]), content = concatU8(chunks.flatMap(c => [c, nl]));
  let res = look(node.get(L.PDFName.of("Resources")));
  if (!(res instanceof L.PDFDict) && node.getInheritableAttribute) res = look(node.getInheritableAttribute(L.PDFName.of("Resources")));
  const fontDict = res instanceof L.PDFDict ? look(res.get(L.PDFName.of("Font"))) : null, seen = {};
  const fontOf = nm => { if (nm in seen) return seen[nm]; const d = fontDict instanceof L.PDFDict ? look(fontDict.get(L.PDFName.of(nm))) : null; return (seen[nm] = pdeFont(L, doc, d, nm)); };
  return {page, node, content, fontOf};
}
const pdeRgb = (L, hex) => { const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || "")); const v = m ? parseInt(m[1], 16) : 0; return L.rgb((v >> 16 & 255) / 255, (v >> 8 & 255) / 255, (v & 255) / 255); };
const pdeRgbOp = hex => { const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || "")); const v = m ? parseInt(m[1], 16) : 0; return [(v >> 16 & 255) / 255, (v >> 8 & 255) / 255, (v & 255) / 255].map(pdeFmt).join(" "); };
const pdeCount = s => String(s || "").replace(/\s+/g, "").length;
// A region for each edit that replaces something on the page (text edits and white-outs)
const pdeRegion = e => e.k === "w" ? {o: e.o, r: e.r || 0, w: e.w, y0: 0, y1: e.h, tol: 0} : {o: e.o, r: e.r || 0, w: e.w, y0: e.y0, y1: e.y1, tol: Math.min(1, e.fs * 0.05)};
// a paragraph replaces each of its lines
const pdeRegions = e => e.k === "p" ? (e.lines || []).map(l => ({o: l.o, r: e.r || 0, w: l.w, y0: l.y0, y1: l.y1, tol: Math.min(1, e.fs * 0.05)})) : [pdeRegion(e)];
// Whether an edit can be written in the font the PDF already used there (the same look), and the codes for it
function pdeKeepable(e, I){
  if (e.k !== "t" || e.keep === false || !I || !I.font || !I.font.ok || I.font.sub === "Type3" || !e.t || e.t.includes("\n")) return null;
  const codes = I.font.enc(e.t); return codes && codes.length ? codes : null;
}
// What the editor needs to know before saving: for each text edit on a page, whether it keeps the PDF's own font
function pdeProbe(L, doc, n, edits){
  const pg = pdePage(L, doc, n); if (!pg) return edits.map(() => null);
  const regs = edits.map(e => pdeRegions(e)[0] || pdeRegion(e));
  try {
    const r = pdeStrip(pg.content, regs, pg.fontOf, true);
    return edits.map((e, k) => { const I = r.info[k], f = I && I.font; return {keep: !!pdeKeepable(e, I), font: f ? f.res : "", hits: r.hits[k], base: f ? f.base : "", serif: !!(f && f.serif), mono: !!(f && f.mono), bold: !!(f && f.bold), italic: !!(f && f.italic), fill: I ? I.fill : "", I}; });
  }
  catch (err) { return edits.map(() => null); }
}

/* Fonts people add: what their licence lets a PDF do with them (the font's own embedding setting, OS/2 fsType) */
function pdeFontRights(fk){
  const t = fk && fk["OS/2"] && fk["OS/2"].fsType;
  if (!t || typeof t !== "object") return {ok: true, subset: true, why: ""};
  if (t.bitmapOnly) return {ok: false, why: "This font's licence only allows its bitmaps to be embedded, so it can't be put in a PDF as text."};
  if (t.noEmbedding && !t.viewOnly && !t.editable) return {ok: false, why: "This font's licence doesn't allow putting it in a PDF (its embedding setting is “Restricted”). Pick another font."};
  return {ok: true, subset: !t.noSubsetting, why: t.viewOnly && !t.editable ? "This font's licence allows it in PDFs for viewing and printing only." : ""};
}

/* Paragraphs: words into lines no wider than the paragraph (measure gives a string's width, in page units) */
function pdeWrap(text, width, measure){
  const out = [];
  String(text || "").split("\n").forEach(par => {
    const words = par.split(/ +/).filter(w => w.length); let line = "";
    if (!words.length) { out.push({t: "", end: true}); return; }
    const push = (t, end) => out.push({t, end});
    for (let w of words) {
      const tryLine = line ? line + " " + w : w;
      if (measure(tryLine) <= width + 0.01) { line = tryLine; continue; }
      if (line) { push(line, false); line = ""; }
      // a word wider than the paragraph is split across lines
      while (measure(w) > width && w.length > 1) { let k = w.length - 1; while (k > 1 && measure(w.slice(0, k)) > width) k--; push(w.slice(0, k), false); w = w.slice(k); }
      line = w;
    }
    push(line, true);
  });
  return out;
}
// How big the PDF's text really is on the page: its font size times the text matrix's scale (many PDFs use size 1, scaled)
const pdeKx = I => Math.hypot(I.m[0], I.m[1]) || 1;
const pdeSizeOf = I => I.fs * (Math.hypot(I.m[2], I.m[3]) || 1);
// The PDF's own font, measured in page units as it would be drawn (NaN for text with a letter it doesn't have)
function pdeMeasureIn(I){
  if (!I || !I.font || !I.font.ok) return null;
  const f = I.font, step = f.two ? 2 : 1, kx = pdeKx(I);
  return s => { const codes = f.enc(s); if (!codes) return NaN; let w = 0; for (let j = 0; j + step <= codes.length; j += step) w += (f.w(step === 2 ? codes[j] * 256 + codes[j + 1] : codes[j]) * I.fs + I.tc) * I.th; return w * kx; };
}

/* Marks and shapes, as drawing instructions in page units */
function pdeShapeOps(e){
  const c = pdeRgbOp(e.c || "#c0262d"), lw = pdeFmt(Math.max(0.3, e.lw || 2)), F = pdeFmt;
  if (e.sh === "line" || e.sh === "arrow") {
    const [x1, y1, x2, y2] = e.pts || [0, 0, 0, 0];
    let s = `q ${c} RG ${c} rg ${lw} w 1 J 1 j ${F(x1)} ${F(y1)} m ${F(x2)} ${F(y2)} l S`;
    if (e.sh === "arrow") {
      const a = Math.atan2(y2 - y1, x2 - x1), L = Math.max(6, (e.lw || 2) * 4), sp = 0.45;
      const p1 = [x2 - L * Math.cos(a - sp), y2 - L * Math.sin(a - sp)], p2 = [x2 - L * Math.cos(a + sp), y2 - L * Math.sin(a + sp)];
      s += ` ${F(x2)} ${F(y2)} m ${F(p1[0])} ${F(p1[1])} l ${F(p2[0])} ${F(p2[1])} l h f`;
    }
    return s + " Q\n";
  }
  const a = (e.r || 0) * Math.PI / 180, w = e.w || 10, h = e.h || 10;
  let s = `q ${F(Math.cos(a))} ${F(Math.sin(a))} ${F(-Math.sin(a))} ${F(Math.cos(a))} ${F(e.o[0])} ${F(e.o[1])} cm ${c} RG ${c} rg ${lw} w 1 J 1 j `;
  if (e.sh === "rect") s += `0 0 ${F(w)} ${F(h)} re S`;
  else if (e.sh === "ellipse") {
    const k = 0.5523, rx = w / 2, ry = h / 2, cx = rx, cy = ry;
    s += `${F(cx + rx)} ${F(cy)} m ${F(cx + rx)} ${F(cy + ry * k)} ${F(cx + rx * k)} ${F(cy + ry)} ${F(cx)} ${F(cy + ry)} c ${F(cx - rx * k)} ${F(cy + ry)} ${F(cx - rx)} ${F(cy + ry * k)} ${F(cx - rx)} ${F(cy)} c `
      + `${F(cx - rx)} ${F(cy - ry * k)} ${F(cx - rx * k)} ${F(cy - ry)} ${F(cx)} ${F(cy - ry)} c ${F(cx + rx * k)} ${F(cy - ry)} ${F(cx + rx)} ${F(cy - ry * k)} ${F(cx + rx)} ${F(cy)} c S`;
  }
  else if (e.sh === "check") s += `${F(w * 0.08)} ${F(h * 0.5)} m ${F(w * 0.38)} ${F(h * 0.15)} l ${F(w * 0.95)} ${F(h * 0.9)} l S`;
  else if (e.sh === "cross") s += `${F(w * 0.12)} ${F(h * 0.12)} m ${F(w * 0.88)} ${F(h * 0.88)} l ${F(w * 0.12)} ${F(h * 0.88)} m ${F(w * 0.88)} ${F(h * 0.12)} l S`;
  else if (e.sh === "dot") s += `${F(w / 2)} ${F(h / 2)} m ${F(w / 2 + 0.01)} ${F(h / 2)} l S`;
  return s + " Q\n";
}

/* Highlights and handwriting as standard PDF annotations, so any PDF app shows them */
function pdeAnnot(L, doc, page, a){
  const ctx = doc.context, F = pdeFmt, rgb = (() => { const m = /^#?([0-9a-f]{6})$/i.exec(a.c || ""); const v = m ? parseInt(m[1], 16) : 0xffd84d; return [(v >> 16 & 255) / 255, (v >> 8 & 255) / 255, (v & 255) / 255]; })();
  const pts = a.k === "hl" ? a.quads.flat() : a.paths.flat().flat(), pad = a.k === "ink" ? (a.w || 1) : 0;
  const xs = pts.filter((_, i) => i % 2 === 0), ys = pts.filter((_, i) => i % 2 === 1); if (!xs.length) return;
  const box = [Math.min(...xs) - pad, Math.min(...ys) - pad, Math.max(...xs) + pad, Math.max(...ys) + pad];
  let ops = `/G0 gs ${rgb.map(F).join(" ")} ${a.k === "hl" ? "rg" : "RG"} `;
  if (a.k === "hl") a.quads.forEach(q => { ops += `${F(q[0])} ${F(q[1])} m ${F(q[2])} ${F(q[3])} l ${F(q[6])} ${F(q[7])} l ${F(q[4])} ${F(q[5])} l h f `; });
  else { ops += `${F(a.w || 1)} w 1 J 1 j `; a.paths.forEach(path => { path.forEach((p, i) => { ops += `${F(p[0])} ${F(p[1])} ${i ? "l" : "m"} `; }); if (path.length === 1) ops += `${F(path[0][0] + 0.01)} ${F(path[0][1])} l `; ops += "S "; }); }
  const op = a.k === "hl" ? 0.45 : a.op != null ? a.op : 1;
  const ap = ctx.register(ctx.flateStream(enc8(ops), {Type: "XObject", Subtype: "Form", BBox: box, Resources: {ExtGState: {G0: {Type: "ExtGState", CA: op, ca: op, BM: a.k === "hl" || op < 1 ? "Multiply" : "Normal"}}}}));
  const dict = {Type: "Annot", Subtype: a.k === "hl" ? "Highlight" : "Ink", Rect: box, C: rgb, CA: op, F: 4, M: L.PDFString.fromDate(new Date()), AP: {N: ap}, NM: L.PDFHexString.fromText("sb-" + (a.id || Math.random().toString(36).slice(2)))};
  if (a.k === "hl") dict.QuadPoints = a.quads.flat(); else { dict.InkList = a.paths.map(path => path.flat()); dict.BS = {W: a.w || 1}; }
  if (a.t) dict.Contents = L.PDFHexString.fromText(String(a.t).slice(0, 2000));
  page.node.addAnnot(ctx.register(ctx.obj(dict)));
}
// A PDF someone signed digitally (a filled signature field): changing it breaks that signature
function pdeSigned(L, doc){
  try { return doc.getForm().getFields().filter(f => f instanceof L.PDFSignature && f.acroField.dict.get(L.PDFName.of("V"))).length; } catch (e) { return 0; }
}
// Every change is marked as made with Studyboard: the file says it was edited, and when
function pdeStamp(doc){ try { doc.setProducer("Studyboard (pdf-lib)"); doc.setModificationDate(new Date()); } catch (e) {} }

/* Writing the edited PDF
   opts: fontkit (to embed fonts people add), fonts {id: bytes}, images {id: {bytes, type}}, annots [highlights and handwriting] */
async function pdeBake(L, bytes, edits, opts){
  opts = opts || {};
  const doc = await L.PDFDocument.load(bytes, {updateMetadata: false, ignoreEncryption: true});
  // an encrypted file's content can't be rewritten without its key: refuse, rather than write a broken file
  if (doc.isEncrypted) { const err = new Error("This PDF is locked (encrypted), so it can't be edited here."); err.code = "locked"; throw err; }
  if (opts.fontkit) doc.registerFontkit(opts.fontkit);
  const pages = doc.getPages(), std = {}, custom = {};
  const report = {removed: 0, covered: 0, kept: 0, swapped: 0, missingFonts: 0, missingImages: 0, fields: 0, fieldsSkipped: 0, annots: 0, signed: pdeSigned(L, doc)};
  const stdFont = async k => std[k] || (std[k] = await doc.embedFont(L.StandardFonts[k]));
  async function fontFor(e){
    if (e.ff && opts.fontkit && opts.fonts && opts.fonts[e.ff]) {
      if (!custom[e.ff]) {
        let sub = true; try { const r = pdeFontRights(opts.fontkit.create(opts.fonts[e.ff])); if (!r.ok) throw new Error(r.why); sub = r.subset; } catch (err) { custom[e.ff] = null; report.missingFonts++; }
        if (custom[e.ff] !== null) custom[e.ff] = await doc.embedFont(opts.fonts[e.ff], {subset: sub});
      }
      if (custom[e.ff]) return custom[e.ff];
    } else if (e.ff) report.missingFonts++;
    return stdFont(pdeFontKey(e));
  }
  // letters a font can't draw become ?, rather than stopping the save
  const drawable = (f, s) => { const cs = f.getCharacterSet ? new Set(f.getCharacterSet()) : null; return [...pdeTidy(s)].map(ch => cs ? (cs.has(ch.codePointAt(0)) || ch === " " ? ch : "?") : pdeBadChars(ch).length ? "?" : ch).join(""); };
  const byPage = new Map();
  for (const e of edits) { if (e.k === "f" || !(e.p >= 1 && e.p <= pages.length)) continue; if (!byPage.has(e.p)) byPage.set(e.p, []); byPage.get(e.p).push(e); }
  for (const [p, list] of byPage) {
    const pg = pdePage(L, doc, p), page = pg.page, node = pg.node;
    let content = pg.content;
    // every area something replaces: text lines, paragraphs (one per line) and white-outs
    const repl = list.filter(e => e.k === "t" || e.k === "w" || e.k === "p"), regions = [], owner = [];
    repl.forEach((e, k) => pdeRegions(e).forEach(rg => { regions.push(rg); owner.push(k); }));
    let hits = regions.map(() => 0), info = regions.map(() => null), wrapQ = ["q\n", "\nQ\n"];
    if (regions.length && content.length) {
      try { const r = pdeStrip(content, regions, pg.fontOf); content = r.bytes; hits = r.hits; info = r.info; wrapQ = ["q\n".repeat(1 + r.under), "\n" + "Q\n".repeat(r.open) + "Q\n"]; }
      catch (err) { /* left as it was: covered below */ }
    }
    content = concatU8([enc8(wrapQ[0]), content, enc8(wrapQ[1])]);
    // after the page: covers (white-outs, and text that couldn't be taken out), shapes, then text in the PDF's own fonts
    let over = "";
    const cover = (rg, bg, pad) => { const a = rg.r * Math.PI / 180; over += `q ${pdeRgbOp(bg || "#ffffff")} rg ${pdeFmt(Math.cos(a))} ${pdeFmt(Math.sin(a))} ${pdeFmt(-Math.sin(a))} ${pdeFmt(Math.cos(a))} ${pdeFmt(rg.o[0])} ${pdeFmt(rg.o[1])} cm ${pdeFmt(-pad)} ${pdeFmt(rg.y0)} ${pdeFmt(rg.w + pad * 2)} ${pdeFmt(rg.y1 - rg.y0)} re f Q\n`; };
    regions.forEach((rg, j) => {
      const e = repl[owner[j]]; report.removed += hits[j];
      const need = e.k === "w" ? 1 : e.k === "p" ? pdeCount((e.lines[regions.slice(0, j + 1).filter((_, i) => owner[i] === owner[j]).length - 1] || {}).old) : pdeCount(e.old);
      if (e.k === "w" || hits[j] < need) { if (e.k !== "w") report.covered++; cover(rg, e.bg, e.k === "w" ? 0 : e.fs * 0.06); }
    });
    list.forEach(e => { if (e.k === "s") over += pdeShapeOps(e); });
    const infoOf = k => { const j = owner.indexOf(k); return j >= 0 ? info[j] : null; };
    const later = [];
    // a run of codes in the PDF's own font, as TJ, spreading the spaces by extra
    const tj = (f, codes, extra, I) => {
      const step = f.two ? 2 : 1; if (!extra) return pdeHex(codes);
      const parts = []; let run = [];
      for (let j = 0; j + step <= codes.length; j += step) {
        const c = step === 2 ? codes[j] * 256 + codes[j + 1] : codes[j]; for (let t = 0; t < step; t++) run.push(codes[j + t]);
        if ((step === 1 && c === 32) || (f.uni && f.uni.get(c) === " ")) { parts.push(pdeHex(Uint8Array.from(run)), pdeFmt(-extra / pdeKx(I) * 1000 / (I.fs * I.th))); run = []; }
      }
      if (run.length) parts.push(pdeHex(Uint8Array.from(run)));
      return parts.join(" ");
    };
    const spacesIn = (f, codes) => { const step = f.two ? 2 : 1; let n = 0; for (let j = 0; j + step <= codes.length; j += step) { const c = step === 2 ? codes[j] * 256 + codes[j + 1] : codes[j]; if ((step === 1 && c === 32) || (f.uni && f.uni.get(c) === " ")) n++; } return n; };
    repl.forEach((e, k) => {
      if (e.k === "w" || !e.t) return;
      const I = infoOf(k), color = e.c || (I && I.fill) || "#000000";
      if (e.k === "t") {
        const codes = !e.ff && pdeKeepable(e, I);
        if (!codes) { later.push(Object.assign({}, e, {c: color})); return; }
        // the same font, size and slant as the letters it replaces, starting where they started
        const f = I.font, nat = pdeMeasureIn(I)(e.t), spaces = spacesIn(f, codes);
        // a justified line (wider than its letters) stays as wide, by spreading the spaces
        const oldNat = I.nat * pdeKx(I), justified = I.spaces > 0 && e.w - oldNat > Math.max(0.5, e.w * 0.015);
        let extra = 0; if (justified && spaces && nat < e.w) { extra = (e.w - nat) / spaces; if (extra > pdeSizeOf(I) * 0.8) extra = 0; }
        over += `q BT /${f.res} ${pdeFmt(I.fs)} Tf ${pdeFmt(I.th * 100)} Tz ${pdeFmt(I.tc)} Tc 0 Tw ${pdeFmt(I.ts)} Ts 0 Tr ${pdeRgbOp(color)} rg ${I.m.map(pdeFmt).join(" ")} Tm [${tj(f, codes, extra, I)}] TJ ET Q\n`;
        report.kept++;
        return;
      }
      // a paragraph: wrapped to its width, in the PDF's font when it has every letter, line by line
      const meas = !e.ff && e.keep !== false && I && Math.abs(pdeSizeOf(I) - e.fs) < Math.max(0.05, e.fs * 0.01) ? pdeMeasureIn(I) : null;
      const lines = meas ? pdeWrap(e.t, e.W, meas) : null;
      if (!lines || lines.some(l => l.t && !Number.isFinite(meas(l.t)))) { later.push(Object.assign({}, e, {c: color})); return; }
      const f = I.font, a = (e.r || 0) * Math.PI / 180;
      lines.forEach((l, j) => {
        if (!l.t) return;
        const codes = f.enc(l.t), x = e.o[0] + j * e.lh * Math.sin(a), y = e.o[1] - j * e.lh * Math.cos(a);
        const spaces = spacesIn(f, codes), extra = e.al === "j" && !l.end && spaces ? (e.W - meas(l.t)) / spaces : 0;
        const m = I.m.slice(0, 4).concat([x, y]);
        over += `q BT /${f.res} ${pdeFmt(I.fs)} Tf ${pdeFmt(I.th * 100)} Tz ${pdeFmt(I.tc)} Tc 0 Tw ${pdeFmt(I.ts)} Ts 0 Tr ${pdeRgbOp(color)} rg ${m.map(pdeFmt).join(" ")} Tm [${tj(f, codes, extra, I)}] TJ ET Q\n`;
      });
      report.kept++;
    });
    list.forEach(e => { if (e.k === "n" && e.t) later.push(e); });
    const overRef = doc.context.register(doc.context.flateStream(enc8(over)));
    node.set(L.PDFName.of("Contents"), doc.context.obj([doc.context.register(doc.context.flateStream(content)), overRef]));
    // images and signatures
    for (const e of list) {
      if (e.k !== "i") continue;
      const im = opts.images && opts.images[e.img]; if (!im) { report.missingImages++; continue; }
      const pic = im.type === "jpg" ? await doc.embedJpg(im.bytes) : await doc.embedPng(im.bytes);
      page.drawImage(pic, {x: e.o[0], y: e.o[1], width: e.w, height: e.h, rotate: L.degrees(e.r || 0), opacity: e.op != null ? e.op : 1});
    }
    // the rest in a standard font or a font someone added (new text, and letters the PDF's font doesn't have)
    for (const e of later) {
      const f = await fontFor(e), a = (e.r || 0) * Math.PI / 180;
      if (e.k === "t" || e.k === "p") report.swapped++;
      const color = pdeRgb(L, e.c || "#000000"), meas = s => f.widthOfTextAtSize(drawable(f, s), e.fs);
      const lines = e.k === "p" ? pdeWrap(e.t, e.W, meas) : pdeTidy(e.t).split("\n").map(t => ({t, end: true}));
      const lh = e.k === "p" ? e.lh : e.fs * 1.2;
      lines.forEach((l, j) => {
        const line = drawable(f, l.t); if (!line) return;
        const x = e.o[0] + j * lh * Math.sin(a), y = e.o[1] - j * lh * Math.cos(a);
        const words = line.split(" "), spaces = words.length - 1;
        if (e.k === "p" && e.al === "j" && !l.end && spaces) {
          // justified: word by word, the gaps shared out
          const gap = (e.W - meas(words.join(""))) / spaces; let off = 0;
          words.forEach(w => { if (w) page.drawText(w, {x: x + off * Math.cos(a), y: y + off * Math.sin(a), size: e.fs, font: f, color, rotate: L.degrees(e.r || 0)}); off += meas(w) + gap; });
        } else page.drawText(line, {x, y, size: e.fs, font: f, color, rotate: L.degrees(e.r || 0)});
      });
    }
  }
  // form fields: what was typed, ticked or picked
  const fields = edits.filter(e => e.k === "f" && e.name);
  if (fields.length) {
    let form = null; try { form = doc.getForm(); } catch (e) { report.fieldsSkipped += fields.length; }
    if (form) {
      for (const e of fields) {
        try {
          const fld = form.getField(e.name);
          if (fld instanceof L.PDFTextField) {
            const max = fld.getMaxLength(); fld.setText(max ? String(e.v || "").slice(0, max) : String(e.v || ""));
            if (fld.isMultiline() || e.fsz) try { fld.setFontSize(e.fsz || 10); } catch (err) {}
          }
          else if (fld instanceof L.PDFCheckBox) { if (e.v === true || (e.v && e.v !== "Off")) fld.check(); else fld.uncheck(); }
          else if (fld instanceof L.PDFRadioGroup) { if (e.v) fld.select(String(e.v)); else fld.clear(); }
          else if (fld instanceof L.PDFDropdown || fld instanceof L.PDFOptionList) { if (e.v) fld.select(String(e.v)); else fld.clear(); }
          else { report.fieldsSkipped++; continue; }
          report.fields++;
        } catch (err) { report.fieldsSkipped++; }
      }
      // field pictures in Helvetica; when a value has letters it can't draw, PDF apps are asked to draw them instead
      try { form.updateFieldAppearances(); } catch (err) { try { form.acroForm.dict.set(L.PDFName.of("NeedAppearances"), L.PDFBool.True); } catch (e2) {} }
    }
  }
  for (const a of opts.annots || []) { const page = pages[a.p - 1]; if (page) { try { pdeAnnot(L, doc, page, a); report.annots++; } catch (err) {} } }
  pdeStamp(doc);
  const out = await doc.save({useObjectStreams: false});
  return {bytes: out, report};
}

/* Pages: a new order (from this PDF and others), turned, left out, or blank ones added
   plan: [{s: 0 for this PDF or the number of an added PDF, p: its page (1 based), rot: degrees to turn}, or {blank: [width, height]}] */
async function pdeReorg(L, bytes, plan, others){
  const doc = await L.PDFDocument.load(bytes, {updateMetadata: false, ignoreEncryption: true});
  if (doc.isEncrypted) { const err = new Error("This PDF is locked (encrypted), so its pages can't be changed here."); err.code = "locked"; throw err; }
  const own = doc.getPages(), extra = [];
  for (const b of others || []) { const d = await L.PDFDocument.load(b, {ignoreEncryption: true}); if (d.isEncrypted) { const err = new Error("One of the added PDFs is locked (encrypted)."); err.code = "locked"; throw err; } extra.push(d); }
  const copies = new Map();
  for (let k = 0; k < extra.length; k++) { const want = [...new Set(plan.filter(x => x.s === k + 1).map(x => x.p - 1))]; const got = want.length ? await doc.copyPages(extra[k], want) : []; want.forEach((i, j) => copies.set((k + 1) + ":" + i, got[j])); }
  const used = new Set(), next = [];
  for (const x of plan) {
    let pg;
    if (x.blank) pg = doc.addPage(x.blank);
    else if (!x.s) { pg = own[x.p - 1]; if (!pg) continue; if (used.has(pg)) pg = (await doc.copyPages(doc, [x.p - 1]))[0]; used.add(pg); }
    else pg = copies.get(x.s + ":" + (x.p - 1));
    if (!pg) continue;
    if (x.rot) pg.setRotation(L.degrees(((pg.getRotation().angle + x.rot) % 360 + 360) % 360));
    next.push(pg);
  }
  if (!next.length) throw new Error("A PDF needs at least one page.");
  while (doc.getPageCount()) doc.removePage(0);
  next.forEach(pg => doc.addPage(pg));
  pdeStamp(doc);
  return doc.save({useObjectStreams: false});
}
const enc8 = s => new TextEncoder().encode(s);
function concatU8(list){ const out = new Uint8Array(list.reduce((t, x) => t + x.length, 0)); let p = 0; for (const x of list) { out.set(x, p); p += x.length; } return out; }
/*PDFEDIT-ENGINE-END*/
(() => {
  const P = typeof SBPRO !== "undefined" ? SBPRO : null; if (!P) return;
  const MAX_EDITS = 200, MAX_TEXT = 2000;
  const PDFLIB_URL = "vendor/pdflib/pdf-lib.min.js", FONTKIT_URL = "vendor/pdflib/fontkit.umd.min.js";
  const ico = d => `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const IC = {
    edit: '<path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17v3z"/><path d="M14 7l3 3"/>',
    text: '<path d="M5 6V5h14v1M12 5v14M9 19h6"/>', add: '<path d="M4 7V5h10v2M9 5v12M7 17h4"/><path d="M18 13v6M15 16h6"/>',
    white: '<rect x="4" y="6" width="16" height="12" rx="1.5"/><path d="M4 14l5-4 4 3 3-2 4 3"/>', trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    down: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>', save: '<path d="M5 4h11l3 3v13H5z"/><path d="M8 4v5h7V4M8 20v-6h8v6"/>',
    mark: '<path d="M4 12l5 5L20 6"/>', image: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="1.8"/><path d="M21 16l-5-5-8 8"/>',
    sign: '<path d="M3 17c3-1 4-8 6-8s0 7 2 7 3-4 4-4 1 3 3 3 3-1 3-1"/><path d="M3 21h18"/>', find: '<circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5 5"/>',
    pages: '<rect x="4" y="3" width="11" height="14" rx="1.5"/><path d="M9 21h9a2 2 0 0 0 2-2V8"/>', para: '<path d="M10 4v16M16 4v16M18 4H9.5a4 4 0 0 0 0 8H10"/>',
    rotL: '<path d="M3 4v6h6"/><path d="M4.5 15a8 8 0 1 0 2-8.5L3 10"/>', rotR: '<path d="M21 4v6h-6"/><path d="M19.5 15a8 8 0 1 1-2-8.5L21 10"/>',
    left: '<path d="M15 6l-6 6 6 6"/>', right: '<path d="M9 6l6 6-6 6"/>', plus: '<path d="M12 5v14M5 12h14"/>', x: '<path d="M6 6l12 12M18 6L6 18"/>'};
  const COLORS = [["#000000", "Black"], ["#1f3a93", "Dark blue"], ["#c0262d", "Red"], ["#1d7a3a", "Green"]];
  const SHAPES = [["check", "Checkmark", '<path d="M4 12l5 5L20 6"/>'], ["cross", "Cross", '<path d="M6 6l12 12M18 6L6 18"/>'], ["rect", "Box", '<rect x="4" y="6" width="16" height="12"/>'],
    ["ellipse", "Circle", '<ellipse cx="12" cy="12" rx="8.5" ry="6.5"/>'], ["line", "Line", '<path d="M4 20L20 4"/>'], ["arrow", "Arrow", '<path d="M4 20L20 4M11 4h9v9"/>'], ["dot", "Dot", '<circle cx="12" cy="12" r="3" fill="currentColor"/>']];
  const WIDTHS = [[1, "Thin"], [2, "Medium"], [3.5, "Thick"]];
  const FAM_CSS = {h: '"Helvetica Neue",Helvetica,Arial,"Liberation Sans",sans-serif', t: '"Times New Roman",Times,"Liberation Serif",serif', c: '"Courier New",Courier,"Liberation Mono",monospace'};
  const HL_HEX = {yellow: "#ffd84d", green: "#7ddb8a", blue: "#7cc4ff", pink: "#ff9ec4"};
  const lsGet = k => { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch (e) { return null; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };

  let E = null; // the editing session: the file, its version, the tool, the edit picked, and each page's text
  const fileOf = () => E && state.files[E.fid];
  const editsOf = f => (Array.isArray(f && f.pe) ? f.pe : []).filter(e => e && e.id && e.p >= 1);
  const mine = () => E ? editsOf(fileOf()).filter(e => e.a === E.rev) : [];
  const R = () => P.reader && P.reader();
  function session(){
    const r = R(); if (!r) return null;
    if (E && E.fid === r.fid && E.rev === r.rev) return E;
    E = {fid: r.fid, rev: r.rev, on: false, tool: "text", shape: "check", sc: "#000000", sw: 2, sel: null, ed: null, pages: new Map(), text: new Map(), anns: new Map(), probe: new Map(), lib: null, drag: null, place: null, find: {q: "", r: "", mc: false, ww: false, at: -1}};
    return E;
  }

  /* pdf-lib and fontkit, loaded the first time someone edits or adds a font */
  const scripts = {};
  function loadScript(url, name, msg){
    if (window[name]) return Promise.resolve(window[name]);
    if (!scripts[url]) scripts[url] = new Promise((res, rej) => {
      const s = document.createElement("script"); s.src = url; s.async = true;
      s.onload = () => window[name] ? res(window[name]) : rej(new Error(msg));
      s.onerror = () => { scripts[url] = null; rej(new Error(msg)); };
      document.head.appendChild(s);
    });
    return scripts[url];
  }
  const loadLib = () => loadScript(PDFLIB_URL, "PDFLib", "Couldn't load the PDF editor. Check your connection and try again.");
  const loadFontkit = () => loadScript(FONTKIT_URL, "fontkit", "Couldn't load the font reader. Check your connection and try again.");
  // The open file as pdf-lib sees it, to check which letters each of its fonts has
  function libDoc(){
    const S = E; if (!S) return Promise.reject(new Error("closed"));
    if (!S.lib) S.lib = (async () => { const L = await loadLib(), bytes = await P.readerBytes(); const v = {L, doc: await L.PDFDocument.load(bytes, {updateMetadata: false, ignoreEncryption: true})}; S.libv = v; return v; })();
    S.lib.catch(() => { if (S) S.lib = null; });
    return S.lib;
  }
  const probeKey = e => e.id + ":" + e.t + ":" + (e.keep === false ? 0 : 1) + ":" + (e.ff || "") + ":" + e.fs;
  async function probe(list){
    const S = E; list = list.filter(e => e.k === "t" || e.k === "p"); if (!S || !list.length) return;
    try {
      const {L, doc} = await libDoc(); if (E !== S) return;
      const byP = new Map(); list.forEach(e => { if (!byP.has(e.p)) byP.set(e.p, []); byP.get(e.p).push(e); });
      for (const [p, es] of byP) pdeProbe(L, doc, p, es).forEach((r, k) => { if (r && es[k].k === "p") r.keep = paraKeep(es[k], r); S.probe.set(probeKey(es[k]), r); });
      repaint(); bar();
    } catch (err) { /* checked again when saving */ }
  }
  const probeOf = e => E && E.probe.get(probeKey(e));
  // A paragraph keeps the PDF's font when it has every letter and the size is unchanged
  function paraKeep(e, r){
    if (e.ff || e.keep === false || !r || !r.I) return false;
    const m = pdeMeasureIn(r.I); if (!m) return false;
    return Math.abs(pdeSizeOf(r.I) - e.fs) < Math.max(0.05, e.fs * 0.01) && String(e.t || "").split(/\s+/).filter(Boolean).every(w => Number.isFinite(m(w)));
  }

  /* Fonts people add (kept on this device only: never uploaded or synced, so Studyboard never passes fonts around) */
  const K_FONTS = "studyboard:pdeFonts", FK = new Map(), FACES = new Map();
  const myFonts = () => (lsGet(K_FONTS) || []).filter(f => f && /^[a-f0-9]{16}$/.test(f.id));
  async function fontBytes(id){ try { const b = await idbGet("pdefont:" + id); return b ? new Uint8Array(await (b instanceof Blob ? b.arrayBuffer() : b)) : null; } catch (e) { return null; } }
  async function fontReady(id){
    if (FACES.has(id)) return FACES.get(id);
    const p = (async () => {
      const bytes = await fontBytes(id); if (!bytes) return false;
      try { const fk = await loadFontkit(); let f = fk.create(bytes); if (f.fonts) f = f.fonts[0]; FK.set(id, f); } catch (e) {}
      try { const face = new FontFace("pdeF-" + id, bytes); await face.load(); document.fonts.add(face); } catch (e) {}
      return true;
    })();
    FACES.set(id, p); return p;
  }
  const hashOf = async bytes => [...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))].slice(0, 8).map(b => b.toString(16).padStart(2, "0")).join("");
  async function addFont(bytes){
    const fk = await loadFontkit(); let font;
    try { font = fk.create(bytes); if (font.fonts) font = font.fonts[0]; if (!font || !font.unitsPerEm) throw new Error("x"); }
    catch (e) { await askBox({title: "That Isn't a Font File", text: "Use a .ttf, .otf, .woff or .woff2 font file.", yes: "OK", no: "Close"}); return null; }
    // the font's own licence setting decides whether it may go into a PDF
    const rights = pdeFontRights(font);
    if (!rights.ok) { await askBox({title: "This Font Can't Be Used in PDFs", text: rights.why, yes: "OK", no: "Close"}); return null; }
    const id = await hashOf(bytes), list = myFonts().filter(f => f.id !== id), name = String(font.fullName || font.familyName || "Font").slice(0, 60);
    if (!(await idbSet("pdefont:" + id, new Blob([bytes])))) { toast("Couldn't keep that font on this device."); return null; }
    list.unshift({id, name, view: rights.why ? 1 : 0, at: Date.now()}); lsSet(K_FONTS, list.slice(0, 30));
    FACES.delete(id); await fontReady(id); if (E) bar();
    toast(rights.why ? `Added ${name}. ${rights.why}` : `Added ${name}`);
    return id;
  }
  async function removeFont(id){ lsSet(K_FONTS, myFonts().filter(f => f.id !== id)); try { await idbDel("pdefont:" + id); } catch (e) {} FACES.delete(id); FK.delete(id); }
  const fontName = id => (myFonts().find(f => f.id === id) || {}).name || "";
  // Letters a text can't be saved with, for the font it will be drawn in
  function badFor(e, t){
    if (e.ff) { const f = FK.get(e.ff); if (f) return [...new Set([...t].filter(ch => ch !== "\n" && ch !== " " && !f.hasGlyphForCodePoint(ch.codePointAt(0))))]; return []; }
    if (E && E.libv && (e.k === "t" || e.k === "p") && e.keep !== false) { try { const r = pdeProbe(E.libv.L, E.libv.doc, e.p, [Object.assign({}, e, {t})])[0]; if (r && (e.k === "t" ? r.keep : paraKeep(Object.assign({}, e, {t}), r))) return []; } catch (err) {} }
    return pdeBadChars(t);
  }

  /* Pictures (images and signatures), kept on this device until they're saved into the PDF */
  const IMGS = new Map();
  async function imgData(id){ try { const v = await idbGet("pdeimg:" + id); return v && v.bytes ? v : null; } catch (e) { return null; } }
  function imgUrl(id){
    if (IMGS.has(id)) return IMGS.get(id);
    IMGS.set(id, null);
    imgData(id).then(v => { if (!v) return; IMGS.set(id, URL.createObjectURL(new Blob([v.bytes], {type: v.type === "jpg" ? "image/jpeg" : "image/png"}))); repaint(); });
    return null;
  }
  async function keepImage(canvas, jpg){
    const blob = await new Promise(res => canvas.toBlob(res, jpg ? "image/jpeg" : "image/png", 0.9)); if (!blob) throw new Error("image");
    const bytes = new Uint8Array(await blob.arrayBuffer()), id = await hashOf(bytes);
    if (!(await idbSet("pdeimg:" + id, {bytes, type: jpg ? "jpg" : "png", w: canvas.width, h: canvas.height}))) throw new Error("store");
    return {id, w: canvas.width, h: canvas.height};
  }
  // a picture from a file: at most 2000 pixels across, PNG when it has see-through parts, otherwise JPEG
  async function imageFromFile(file, opts){
    opts = opts || {};
    let bmp; try { bmp = await createImageBitmap(file, {imageOrientation: "from-image"}); } catch (e) { throw new Error("That file isn't a picture Studyboard can read. Use a PNG or JPEG."); }
    const k = Math.min(1, 2000 / Math.max(bmp.width, bmp.height)), cv = document.createElement("canvas");
    cv.width = Math.max(1, Math.round(bmp.width * k)); cv.height = Math.max(1, Math.round(bmp.height * k));
    const ctx = cv.getContext("2d", {willReadFrequently: true}); ctx.drawImage(bmp, 0, 0, cv.width, cv.height);
    let alpha = /png|gif|webp/i.test(file.type);
    if (opts.clearWhite) { clearWhite(cv); alpha = true; }
    return keepImage(opts.trim ? trimmed(cv) : cv, !alpha);
  }
  // for a photo of a signature: paper-white becomes see-through
  function clearWhite(cv){
    const ctx = cv.getContext("2d", {willReadFrequently: true}), d = ctx.getImageData(0, 0, cv.width, cv.height), a = d.data;
    for (let i = 0; i < a.length; i += 4) { const l = (a[i] + a[i + 1] + a[i + 2]) / 3; if (l > 200) a[i + 3] = 0; else if (l > 150) a[i + 3] = Math.round(a[i + 3] * (200 - l) / 50); }
    ctx.putImageData(d, 0, 0);
  }
  function trimmed(cv){
    const ctx = cv.getContext("2d", {willReadFrequently: true}), d = ctx.getImageData(0, 0, cv.width, cv.height).data;
    let x0 = cv.width, y0 = cv.height, x1 = -1, y1 = -1;
    for (let y = 0; y < cv.height; y++) for (let x = 0; x < cv.width; x++) if (d[(y * cv.width + x) * 4 + 3] > 8) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    if (x1 < 0) return cv;
    const pad = 6, out = document.createElement("canvas"); out.width = x1 - x0 + 1 + pad * 2; out.height = y1 - y0 + 1 + pad * 2;
    out.getContext("2d").drawImage(cv, x0, y0, x1 - x0 + 1, y1 - y0 + 1, pad, pad, x1 - x0 + 1, y1 - y0 + 1);
    return out;
  }
  const K_SIGS = "studyboard:pdeSigs";
  const mySigs = () => (lsGet(K_SIGS) || []).filter(s => s && /^[a-f0-9]{16}$/.test(s.id));

  /* Text on each page, with where it sits (in the PDF's own units) */
  async function pageObj(n){ const pg = E && E.pages.get(n); if (pg) return pg.page; const r = R(); return r && r.doc ? r.doc.getPage(n) : null; }
  async function pageInfo(n){
    const S = E; if (!S) return [];
    if (!S.text.has(n)) S.text.set(n, (async () => {
      const page = await pageObj(n); if (!page) return [];
      const tc = await page.getTextContent();
      return tc.items.filter(it => typeof it.str === "string" && it.str.trim() && Array.isArray(it.transform) && it.width > 0).map(it => {
        const tx = it.transform, fs = Math.hypot(tx[2], tx[3]) || Math.abs(tx[3]) || 10, st = tc.styles[it.fontName] || {};
        let obj = null; try { obj = page.commonObjs.has(it.fontName) ? page.commonObjs.get(it.fontName) : null; } catch (e) {}
        const name = String((obj && obj.name) || "").replace(/^[A-Z]{6}\+/, ""), fam = String(st.fontFamily || "");
        const mono = /courier|mono|consol|menlo/i.test(name) || fam === "monospace", serif = !mono && (fam === "serif" || /times|roman|serif|georgia|garamond|cambria|book|minion|palatino|baskerville/i.test(name)) && !/sans/i.test(name);
        const asc = Number.isFinite(st.ascent) && st.ascent > 0.5 ? Math.min(1.05, st.ascent) : 0.9, desc = Number.isFinite(st.descent) && st.descent < 0 ? Math.max(-0.35, st.descent) : -0.22;
        return {str: it.str, o: [tx[4], tx[5]], r: Math.round(Math.atan2(tx[1], tx[0]) * 180 / Math.PI * 100) / 100, w: it.width, fs, y0: desc * fs, y1: asc * fs, fn: it.fontName,
          f: mono ? "c" : serif ? "t" : "h", b: /bold|black|heavy|semibold|demi/i.test(name) || !!(obj && obj.bold) ? 1 : 0, i: /italic|oblique/i.test(name) || !!(obj && obj.italic) ? 1 : 0,
          cf: cssName(name, mono ? "c" : serif ? "t" : "h")};
      });
    })());
    try { return await S.text.get(n); } catch (e) { return []; }
  }
  // a font's name as CSS, with a look-alike after it ("TimesNewRomanPS-BoldMT" is "Times New Roman")
  const cssName = (base, f) => { const nm = String(base || "").split(/[-,+]/)[0].replace(/(PSMT|PS|MT)$/, "").replace(/([a-z])([A-Z])/g, "$1 $2").trim(); return (nm && /^[\w ]{2,40}$/.test(nm) ? `"${nm}",` : "") + (FAM_CSS[f] || FAM_CSS.h); };
  // A text edit for a line of the PDF, with the PDF's own font facts and colour when pdf-lib has the file open
  function lineEdit(n, it, col){
    const e = {id: uid(), a: E.rev, p: n, k: "t", o: it.o, r: it.r, w: it.w, y0: it.y0, y1: it.y1, fs: Math.round(it.fs * 100) / 100, s0: Math.round(it.fs * 100) / 100, f: it.f, b: it.b, i: it.i, c: (col && col.c) || "#000000", bg: (col && col.bg) || "#ffffff", old: it.str, t: it.str, cf: it.cf};
    if (E.libv) { try { const pr = pdeProbe(E.libv.L, E.libv.doc, n, [e])[0]; if (pr && pr.base) { e.f = pr.mono ? "c" : pr.serif ? "t" : "h"; e.b = pr.bold ? 1 : 0; e.i = pr.italic ? 1 : 0; e.cf = cssName(pr.base, e.f); } if (pr && pr.fill && pr.hits) e.c = pr.fill; } catch (err) {} }
    return e;
  }
  // Page units to screen pixels on a drawn page, and back
  const toVp = (pg, x, y) => pg.vp.convertToViewportPoint(x, y);
  const toPdf = (pg, x, y) => pg.vp.convertToPdfPoint(x, y);
  function frame(pg, o, r){
    const a = r * Math.PI / 180, [x0, y0] = toVp(pg, o[0], o[1]), [x1, y1] = toVp(pg, o[0] + Math.cos(a), o[1] + Math.sin(a));
    return {x: x0, y: y0, rot: Math.atan2(y1 - y0, x1 - x0), s: Math.hypot(x1 - x0, y1 - y0)};
  }
  // the page-unit angle that looks level on screen (for things placed on a turned page)
  const level = (pg, x, y) => Math.round(-frame(pg, [x, y], 0).rot * 180 / Math.PI * 100) / 100;
  // where the baseline sits in a line of a font, as a share of the font size (measured once per font)
  const BASE = new Map();
  function baseOf(css, lh){
    const k = css + "|" + lh; if (BASE.has(k)) return BASE.get(k);
    const box = document.createElement("div"); box.style.cssText = `position:absolute;visibility:hidden;left:-9999px;top:0;font:100px/${lh} ${css};white-space:nowrap`;
    box.innerHTML = 'Hg<span style="display:inline-block;width:1px;height:0;vertical-align:baseline"></span>';
    document.body.appendChild(box); const v = box.lastChild.offsetTop / 100; box.remove();
    const out = v > 0.3 && v < 1.6 ? v : 0.85 * lh; BASE.set(k, out); return out;
  }
  function cssFor(e){
    if (e.ff) { fontReady(e.ff); return `"pdeF-${e.ff}",` + (FAM_CSS[e.f] || FAM_CSS.h); }
    const pr = (e.k === "t" || e.k === "p") && e.keep !== false ? probeOf(e) : null;
    return pr && pr.keep && e.cf ? e.cf : FAM_CSS[e.f] || FAM_CSS.h;
  }
  // How wide a string is, in page units, in the font a paragraph will be saved in (null until the libraries are loaded)
  function measurer(e){
    if (e.ff) { const f = FK.get(e.ff); return f ? s => f.layout(s).advanceWidth / f.unitsPerEm * e.fs : null; }
    const pr = e.keep !== false ? probeOf(e) : null;
    if (pr && pr.keep && pr.I) return pdeMeasureIn(pr.I);
    const L = window.PDFLib; if (!L) return null;
    try { const em = L.StandardFontEmbedder.for(L.StandardFonts[pdeFontKey(e)]); return s => { try { return em.widthOfTextAtSize([...s].map(ch => pdeBadChars(ch).length ? "?" : ch).join(""), e.fs); } catch (err) { return s.length * e.fs * 0.5; } }; } catch (err) { return null; }
  }

  /* Colors from the drawn page: the background around some text, and the text's own color */
  function sample(pg, box){
    const cv = pg && pg.el.querySelector(".pdr-cv"); if (!cv) return {bg: "#ffffff", c: "#000000"};
    try {
      const k = cv.width / (parseFloat(cv.style.width) || cv.width), ctx = cv.getContext("2d", {willReadFrequently: true});
      const x = Math.max(0, Math.floor((box.x - 3) * k)), y = Math.max(0, Math.floor((box.y - 3) * k)), w = Math.min(cv.width - x, Math.ceil((box.w + 6) * k)), h = Math.min(cv.height - y, Math.ceil((box.h + 6) * k));
      if (w < 2 || h < 2) return {bg: "#ffffff", c: "#000000"};
      const d = ctx.getImageData(x, y, w, h).data, ring = new Map(), inner = [];
      const q = (r, g, b) => (r >> 4) << 8 | (g >> 4) << 4 | (b >> 4);
      const edge = Math.max(1, Math.round(2 * k));
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
        const o = (j * w + i) * 4, r = d[o], g = d[o + 1], b = d[o + 2];
        if (i < edge || j < edge || i >= w - edge || j >= h - edge) { const key = q(r, g, b), v = ring.get(key) || [0, 0, 0, 0]; v[0]++; v[1] += r; v[2] += g; v[3] += b; ring.set(key, v); }
        else inner.push(r, g, b);
      }
      let best = null; for (const v of ring.values()) if (!best || v[0] > best[0]) best = v;
      const bg = best ? [best[1] / best[0], best[2] / best[0], best[3] / best[0]] : [255, 255, 255];
      const far = new Map(); let far0 = null;
      for (let i = 0; i < inner.length; i += 3) {
        const dd = Math.hypot(inner[i] - bg[0], inner[i + 1] - bg[1], inner[i + 2] - bg[2]); if (dd < 90) continue;
        const key = q(inner[i], inner[i + 1], inner[i + 2]), v = far.get(key) || [0, 0, 0, 0, 0]; v[0]++; v[1] += inner[i]; v[2] += inner[i + 1]; v[3] += inner[i + 2]; v[4] = Math.max(v[4], dd); far.set(key, v);
      }
      for (const v of far.values()) if (!far0 || v[0] * v[4] > far0[0] * far0[4]) far0 = v;
      const hex = a => "#" + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
      return {bg: hex(bg), c: far0 ? hex([far0[1] / far0[0], far0[2] / far0[0], far0[3] / far0[0]]) : "#000000"};
    } catch (e) { return {bg: "#ffffff", c: "#000000"}; }
  }
  function vpBox(pg, rg){
    const a = rg.r * Math.PI / 180, pts = [[0, rg.y0], [rg.w, rg.y0], [0, rg.y1], [rg.w, rg.y1]].map(([lx, ly]) => toVp(pg, rg.o[0] + lx * Math.cos(a) - ly * Math.sin(a), rg.o[1] + lx * Math.sin(a) + ly * Math.cos(a)));
    const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]); return {x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys)};
  }

  /* Drawing the edits on a page */
  function layerOf(n){
    const pg = E && E.pages.get(n); if (!pg || !pg.el.isConnected) return null;
    let L = pg.el.querySelector(".pde-layer");
    if (!L) { L = document.createElement("div"); L.className = "pde-layer"; L.dataset.p = n; pg.el.appendChild(L); }
    return L;
  }
  const px = v => v.toFixed(2) + "px";
  const boxKinds = new Set(["w", "i", "s"]);
  const isBox = e => e.k === "w" || e.k === "i" || (e.k === "s" && e.sh !== "line" && e.sh !== "arrow");
  function editHtml(pg, e, editing){
    const sel = E.sel === e.id, cls = `pde-e k-${e.k}${e.k === "s" ? " sh-" + e.sh : ""}${sel ? " sel" : ""}${editing ? " editing" : ""}`;
    if (e.k === "s" && (e.sh === "line" || e.sh === "arrow")) {
      // a line or arrow: drawn over the whole page, in screen pixels
      const [x1, y1] = toVp(pg, e.pts[0], e.pts[1]), [x2, y2] = toVp(pg, e.pts[2], e.pts[3]), s = pg.vp.scale, lw = Math.max(0.6, (e.lw || 2) * s);
      const a = Math.atan2(y2 - y1, x2 - x1), L = Math.max(6, (e.lw || 2) * 4) * s, sp = 0.45;
      const head = e.sh === "arrow" ? `<path d="M${x2} ${y2}L${x2 - L * Math.cos(a - sp)} ${y2 - L * Math.sin(a - sp)}L${x2 - L * Math.cos(a + sp)} ${y2 - L * Math.sin(a + sp)}Z" fill="${esc(e.c)}" stroke="none"/>` : "";
      return `<svg class="${cls} pde-ln" data-e="${esc(e.id)}" width="100%" height="100%"><path class="pde-hit" d="M${x1} ${y1}L${x2} ${y2}"/><path d="M${x1} ${y1}L${x2} ${y2}" stroke="${esc(e.c)}" stroke-width="${lw}" stroke-linecap="round" fill="none"/>${head}${sel ? `<circle class="pde-end" data-end="1" cx="${x1}" cy="${y1}" r="7"/><circle class="pde-end" data-end="2" cx="${x2}" cy="${y2}" r="7"/>` : ""}</svg>`;
    }
    const f = frame(pg, e.o, e.r || 0), s = f.s;
    const pos = `left:${px(f.x)};top:${px(f.y)};transform:rotate(${f.rot.toFixed(5)}rad)`;
    const handle = sel && boxKinds.has(e.k) ? `<i class="pde-grip" data-size="1" style="left:${px(e.w * s)};top:0" aria-hidden="true"></i>` : "";
    if (e.k === "w") return `<div class="${cls}" data-e="${esc(e.id)}" style="${pos}"><i class="pde-cover" style="left:0;top:${px(-e.h * s)};width:${px(e.w * s)};height:${px(e.h * s)};background:${esc(e.bg || "#fff")}"></i>${handle}</div>`;
    if (e.k === "i") {
      const url = imgUrl(e.img);
      return `<div class="${cls}" data-e="${esc(e.id)}" style="${pos}"><i class="pde-pic" style="left:0;top:${px(-e.h * s)};width:${px(e.w * s)};height:${px(e.h * s)}">${url ? `<img src="${esc(url)}" alt="" draggable="false">` : `<span class="mini">Picture on another device</span>`}</i>${handle}</div>`;
    }
    if (e.k === "s") {
      const w = e.w * s, h = e.h * s, lw = Math.max(0.6, (e.lw || 2) * s), c = esc(e.c || "#000");
      const shape = {check: `<path d="M${w * 0.08} ${h * 0.5}L${w * 0.38} ${h * 0.85}L${w * 0.95} ${h * 0.1}"/>`, cross: `<path d="M${w * 0.12} ${h * 0.12}L${w * 0.88} ${h * 0.88}M${w * 0.88} ${h * 0.12}L${w * 0.12} ${h * 0.88}"/>`,
        rect: `<rect x="0" y="0" width="${w}" height="${h}"/>`, ellipse: `<ellipse cx="${w / 2}" cy="${h / 2}" rx="${w / 2}" ry="${h / 2}"/>`, dot: `<circle cx="${w / 2}" cy="${h / 2}" r="${lw / 2}" fill="${c}"/>`}[e.sh] || "";
      return `<div class="${cls}" data-e="${esc(e.id)}" style="${pos}"><svg class="pde-shape" style="left:0;top:${px(-h)}" width="${w}" height="${h}" overflow="visible"><g fill="none" stroke="${c}" stroke-width="${lw}" stroke-linecap="round" stroke-linejoin="round"><rect class="pde-hit" x="0" y="0" width="${w}" height="${h}"/>${shape}</g></svg>${handle}</div>`;
    }
    const css = cssFor(e), pad = e.fs * 0.06, font = `${e.i ? "italic " : ""}${e.b ? 700 : 400} ${px(e.fs * s)}`;
    const ce = editing ? ` contenteditable="plaintext-only" spellcheck="true" role="textbox" aria-label="${e.k === "t" ? "Edit text" : e.k === "p" ? "Edit paragraph" : "New text"}"${e.k !== "t" ? ' aria-multiline="true"' : ""}` : "";
    const color = esc(e.c || "#000");
    if (e.k === "p") {
      const lhp = e.lh * s, top = -((lhp - e.fs * s) / 2 + baseOf(css, 1) * e.fs * s);
      const covers = (e.lines || []).map(l => { const lf = frame(pg, l.o, e.r || 0); return `<i class="pde-cover" style="left:${px(lf.x - f.x - pad * s)};top:${px(lf.y - f.y - l.y1 * s)};width:${px((l.w + pad * 2) * s)};height:${px((l.y1 - l.y0) * s)};background:${esc(e.bg || "#fff")}"></i>`; }).join("");
      let body;
      if (editing) body = `<div class="pde-t pde-pt"${ce} style="top:${px(top)};width:${px(e.W * s)};font:${font}/${px(lhp)} ${esc(css)};color:${color};text-align:${e.al === "j" ? "justify" : "left"}">${esc(e.t || "")}</div>`;
      else {
        // the lines as they'll be saved (the same breaks), or the browser's wrapping until the fonts are measured
        const m = measurer(e), lines = m ? pdeWrap(e.t, e.W, m) : null;
        body = lines ? `<div class="pde-t pde-pt" style="top:${px(top)};width:${px(e.W * s)};font:${font}/${px(lhp)} ${esc(css)};color:${color}">${lines.map(l => `<div class="pde-pl${e.al === "j" && !l.end ? " j" : ""}">${esc(l.t) || "&nbsp;"}</div>`).join("")}</div>`
          : `<div class="pde-t pde-pt" style="top:${px(top)};width:${px(e.W * s)};font:${font}/${px(lhp)} ${esc(css)};color:${color};text-align:${e.al === "j" ? "justify" : "left"}">${esc(e.t || "")}</div>`;
      }
      return `<div class="${cls}" data-e="${esc(e.id)}" style="${pos}">${covers}${body}</div>`;
    }
    const lh = e.k === "n" ? 1.2 : 1, b = baseOf(css, lh) * e.fs * s;
    const cover = e.k === "t" ? `<i class="pde-cover" style="left:${px(-pad * s)};top:${px(-e.y1 * s)};width:${px((e.w + pad * 2) * s)};height:${px((e.y1 - e.y0) * s)};background:${esc(e.bg || "#fff")}"></i>` : "";
    const txt = `<span class="pde-t"${ce} style="top:${px(-b)};font:${font}/${lh} ${esc(css)};color:${color}">${esc(e.t || "")}</span>`;
    return `<div class="${cls}" data-e="${esc(e.id)}" style="${pos}">${cover}${txt}</div>`;
  }
  function paint(n){
    if (!E) return;
    const pg = E.pages.get(n), L = layerOf(n); if (!pg || !L) return;
    const ed = E.ed && E.ed.e.p === n ? E.ed : null;
    // what's being typed survives a redraw: its words, focus and caret
    const prev = ed && ed.el && ed.el.isConnected ? ed.el : null, had = !!prev && document.activeElement === prev; let caret = null;
    if (prev) ed.e.t = textOf(prev);
    if (had) { try { const s = getSelection(); if (s.rangeCount) { const r = s.getRangeAt(0), pre = document.createRange(); pre.selectNodeContents(prev); pre.setEnd(r.startContainer, r.startOffset); const a = pre.toString().length; pre.setEnd(r.endContainer, r.endOffset); caret = [a, pre.toString().length]; } } catch (e) {} }
    const list = mine().filter(e => e.p === n && e.k !== "f" && !(ed && ed.e.id === e.id));
    L.innerHTML = list.map(e => editHtml(pg, e, false)).join("") + (ed ? editHtml(pg, ed.e, true) : "") + '<i class="pde-hover" hidden></i><i class="pde-band" hidden></i><svg class="pde-lnprev" width="100%" height="100%" hidden><path/></svg>';
    if (ed) {
      const t = L.querySelector(".pde-e.editing .pde-t");
      if (t) { ed.el = t; wireEditor(t); if (had) { t.focus({preventScroll: true}); if (caret) setCaret(t, caret[0], caret[1]); } }
    }
  }
  const repaint = () => { if (E) for (const n of E.pages.keys()) paint(n); };

  /* Fillable forms: the PDF's own fields, typed into on the page (in reading and editing alike) */
  async function annsOf(page){
    if (!E) return [];
    if (!E.anns.has(page)) E.anns.set(page, page.getAnnotations({intent: "display"}).then(list => list.filter(a => a.subtype === "Widget" && !a.hidden && !a.readOnly && a.fieldName &&
      (a.fieldType === "Tx" || a.fieldType === "Ch" || (a.fieldType === "Btn" && (a.checkBox || a.radioButton))))).catch(() => []));
    return E.anns.get(page);
  }
  const fieldEdit = name => mine().find(e => e.k === "f" && e.name === name);
  function fieldValue(a){
    const ed = fieldEdit(a.fieldName); if (ed) return ed.v;
    if (a.checkBox) return !!a.fieldValue && a.fieldValue !== "Off";
    if (a.fieldType === "Ch") return Array.isArray(a.fieldValue) ? a.fieldValue[0] || "" : a.fieldValue || "";
    return a.fieldValue == null ? "" : a.fieldValue;
  }
  async function paintForm(n){
    const pg = E && E.pages.get(n); if (!pg) return;
    const anns = await annsOf(pg.page); if (!E || !pg.el.isConnected) return;
    let F = pg.el.querySelector(".pde-form");
    if (!anns.length) { if (F) F.remove(); return; }
    if (!F) { F = document.createElement("div"); F.className = "pde-form"; pg.el.appendChild(F); }
    if (F.contains(document.activeElement)) return;   // not while someone is typing in it
    F.innerHTML = anns.map(a => {
      const [x0, y0] = toVp(pg, a.rect[0], a.rect[1]), [x1, y1] = toVp(pg, a.rect[2], a.rect[3]), x = Math.min(x0, x1), y = Math.min(y0, y1), w = Math.abs(x1 - x0), h = Math.abs(y1 - y0);
      const v = fieldValue(a), da0 = a.defaultAppearanceData && a.defaultAppearanceData.fontSize, da = da0 > 0 && da0 <= 24 ? da0 : 0;
      const fsz = (da || (a.multiLine ? 11 : Math.min(h / pg.vp.scale * 0.62, 14))) * pg.vp.scale;
      const st = `left:${px(x)};top:${px(y)};width:${px(w)};height:${px(h)};font-size:${px(Math.max(8, fsz))}`, nm = esc(a.fieldName), lab = esc(a.alternativeText || a.fieldName);
      if (a.checkBox) return `<input type="checkbox" class="pde-field" data-f="${nm}" data-p="${n}" style="${st}" aria-label="${lab}"${v === true || (v && v !== "Off") ? " checked" : ""}>`;
      if (a.radioButton) return `<input type="radio" class="pde-field" name="pdeR-${nm}" data-f="${nm}" data-p="${n}" data-v="${esc(a.buttonValue)}" style="${st}" aria-label="${lab}: ${esc(a.buttonValue)}"${v === a.buttonValue ? " checked" : ""}>`;
      if (a.fieldType === "Ch") return `<select class="pde-field" data-f="${nm}" data-p="${n}" style="${st}" aria-label="${lab}"><option value=""></option>${(a.options || []).map(o => `<option value="${esc(o.exportValue)}"${o.exportValue === v ? " selected" : ""}>${esc(o.displayValue)}</option>`).join("")}</select>`;
      if (a.multiLine) return `<textarea class="pde-field" data-f="${nm}" data-p="${n}" data-s="${da || 0}" style="${st}" aria-label="${lab}"${a.maxLen ? ` maxlength="${a.maxLen}"` : ""}>${esc(v)}</textarea>`;
      return `<input type="text" class="pde-field" data-f="${nm}" data-p="${n}" data-s="${da || 0}" style="${st}" aria-label="${lab}" value="${esc(v)}"${a.maxLen ? ` maxlength="${a.maxLen}"` : ""}>`;
    }).join("");
  }
  async function setField(name, v, p, fsz){
    const pg = E && E.pages.get(p), anns = pg ? await annsOf(pg.page) : [], a = anns.find(x => x.fieldName === name);
    const orig = a ? (a.checkBox ? !!a.fieldValue && a.fieldValue !== "Off" : a.fieldType === "Ch" ? (Array.isArray(a.fieldValue) ? a.fieldValue[0] || "" : a.fieldValue || "") : a.fieldValue == null ? "" : a.fieldValue) : "";
    const list = mine().filter(e => !(e.k === "f" && e.name === name));
    if (v !== orig) list.push({id: uid(), a: E.rev, p, k: "f", name, v, fsz: fsz || 0, at: Date.now()});
    else if (list.length === mine().length) return;
    save(list, null);
    for (const n of E.pages.keys()) if (n !== p) paintForm(n);
  }
  document.addEventListener("change", ev => {
    const t = ev.target; if (!E || !t.classList || !t.classList.contains("pde-field")) return;
    const name = t.dataset.f, p = Number(t.dataset.p);
    const v = t.type === "checkbox" ? t.checked : t.type === "radio" ? t.dataset.v : t.value;
    setField(name, v, p, Number(t.dataset.s) || 0);
  });

  /* Editing text in place */
  function startEdit(e, at){
    if (!E) return;
    if (E.ed) commit();
    E.ed = {e: Object.assign({}, e), was: mine().some(x => x.id === e.id) ? e.t : null};
    E.sel = e.id; paint(e.p); bar();
    const t = E.ed && E.ed.el; if (!t) return;
    t.focus({preventScroll: true});
    try {
      const sel = getSelection(), r = at && document.caretRangeFromPoint ? document.caretRangeFromPoint(at.x, at.y) : null;
      if (r && t.contains(r.startContainer)) { sel.removeAllRanges(); sel.addRange(r); }
      else { const rr = document.createRange(); rr.selectNodeContents(t); if (e.k !== "t" && !e.t) rr.collapse(false); sel.removeAllRanges(); sel.addRange(rr); }
    } catch (err) {}
  }
  function wireEditor(t){
    if (t.__pde) return; t.__pde = 1;
    if (t.contentEditable !== "plaintext-only") t.contentEditable = "true";
    t.addEventListener("paste", ev => { ev.preventDefault(); const s = pdeTidy((ev.clipboardData || window.clipboardData).getData("text")); document.execCommand("insertText", false, E && E.ed && E.ed.e.k === "t" ? s.replace(/\n+/g, " ") : s); });
    t.addEventListener("keydown", ev => {
      if (ev.key === "Escape") { ev.preventDefault(); ev.stopPropagation(); cancel(); return; }
      if (ev.key === "Enter" && (E.ed.e.k === "t" || ev.ctrlKey || ev.metaKey)) { ev.preventDefault(); commit(); return; }
      if (ev.key === "Tab") { ev.preventDefault(); commit(); }
    });
    t.addEventListener("input", () => { if (!E || !E.ed) return; const m = $("#pdeMsg"), bad = badFor(E.ed.e, pdeTidy(textOf(t))); if (m) { m.textContent = bad.length ? `${bad.slice(0, 4).join(" ")} can't be saved in this font. ${E.ed.e.ff ? "Pick a font that has those letters." : "Add a font that has them (Font, then Add a Font)."}` : ""; m.classList.toggle("bad", !!bad.length); } t.classList.toggle("bad", !!bad.length); });
    t.addEventListener("blur", () => setTimeout(() => { if (E && E.ed && E.ed.el === t && !(document.activeElement && document.activeElement.closest && document.activeElement.closest(".pde-bar,.pde-e.editing,.pde-pop,.ask-dlg"))) commit(); }, 120));
  }
  function setCaret(t, a, b){
    try {
      const tn = t.firstChild || t.appendChild(document.createTextNode("")), len = tn.textContent.length, r = document.createRange();
      r.setStart(tn, Math.min(a, len)); r.setEnd(tn, Math.min(b, len)); const s = getSelection(); s.removeAllRanges(); s.addRange(r);
    } catch (e) {}
  }
  const textOf = t => (t.innerText != null ? t.innerText : t.textContent).replace(/\n$/, "");
  function cancel(){ if (!E || !E.ed) return; const p = E.ed.e.p; E.ed = null; paint(p); bar(); }
  function commit(){
    if (!E || !E.ed) return;
    const ed = E.ed, e = ed.e, raw = ed.el ? textOf(ed.el) : e.t;
    let t = pdeTidy(raw).slice(0, MAX_TEXT); if (e.k === "t") t = t.replace(/\n+/g, " ");
    const bad = badFor(e, t);
    if (bad.length) { toast(`${bad.slice(0, 3).join(" ")} can't be saved in this font. Try another font.`); if (ed.el) ed.el.focus(); return; }
    E.ed = null;
    const list = mine(), exists = list.some(x => x.id === e.id);
    if (e.k === "n" && !t.trim()) { if (exists) save(list.filter(x => x.id !== e.id), "Text box removed"); else paint(e.p); bar(); return; }
    if (e.k === "t" && !exists && t === e.old) { E.sel = null; paint(e.p); bar(); return; }
    if (exists && t === ed.was && !ed.dirty) { paint(e.p); bar(); return; }
    const next = Object.assign({}, e, {t, at: Date.now()});
    if (!exists && list.length >= MAX_EDITS) { toast(`A file can hold ${MAX_EDITS} edits. Save a new version to keep going.`); paint(e.p); return; }
    save(exists ? list.map(x => x.id === e.id ? next : x) : list.concat([next]), e.k === "t" ? (t ? "Text changed" : "Text removed") : e.k === "p" ? "Paragraph changed" : "Text added");
    E.sel = e.id; probe([next]); bar();
  }
  function save(list, label){
    const f = fileOf(); if (!f) return;
    const others = editsOf(f).filter(e => e.a !== E.rev), all = others.concat(list), after = clone(f);
    if (all.length) after.pe = all; else delete after.pe;
    after.updated = Date.now();
    applyChanges([{kind: "file", id: f.id, after}], label === undefined ? null : label);
    repaint(); bar();
  }
  const selected = () => E && E.sel ? (E.ed && E.ed.e.id === E.sel ? E.ed.e : mine().find(e => e.id === E.sel)) : null;
  function restyle(patch, label){
    const e = selected(); if (!e) return;
    if ((e.k === "t" || e.k === "p") && ("f" in patch || "b" in patch || "i" in patch || "fs" in patch || "ff" in patch) && !("keep" in patch)) patch.keep = false;
    if (E.ed && E.ed.e.id === e.id) {
      const el0 = E.ed.el; if (el0) E.ed.e.t = textOf(el0);
      Object.assign(E.ed.e, patch); E.ed.dirty = true; paint(e.p);
      const el = E.ed.el; if (el && document.activeElement !== el) { el.focus({preventScroll: true}); setCaret(el, textOf(el).length, textOf(el).length); }
      bar(); probe([E.ed.e]); return;
    }
    const next = Object.assign({}, e, patch);
    save(mine().map(x => x.id === e.id ? next : x), label || (e.k === "s" ? "Mark changed" : "Text style changed")); probe([next]);
  }
  function remove(id){
    const e = mine().find(x => x.id === id);
    if (E.ed && E.ed.e.id === id) { cancel(); if (!e) return; }
    if (!e) return;
    E.sel = null; save(mine().filter(x => x.id !== id), {t: "Edit undone: the original text is back", p: "Edit undone: the original paragraph is back", w: "White-out removed", n: "Text box removed", s: "Mark removed", i: e.sig ? "Signature removed" : "Picture removed"}[e.k] || "Removed");
  }

  /* Paragraphs: the lines around a line that belong with it (same size and font, evenly spaced, left edges lined up) */
  async function paragraphAt(n, o){
    const items = (await pageInfo(n)).filter(it => Math.abs(it.r) < 0.5);
    const lines = [];
    items.slice().sort((a, b) => b.o[1] - a.o[1] || a.o[0] - b.o[0]).forEach(it => {
      const ln = lines.find(l => Math.abs(l.o[1] - it.o[1]) < it.fs * 0.3 && Math.abs(l.fs - it.fs) < it.fs * 0.08);
      if (ln) { ln.items.push(it); ln.x0 = Math.min(ln.x0, it.o[0]); ln.x1 = Math.max(ln.x1, it.o[0] + it.w); }
      else lines.push({o: it.o.slice(), fs: it.fs, fn: it.fn, items: [it], x0: it.o[0], x1: it.o[0] + it.w});
    });
    lines.forEach(l => { l.items.sort((a, b) => a.o[0] - b.o[0]); l.o = [l.x0, l.o[1]]; l.w = l.x1 - l.x0; l.str = l.items.map(i => i.str).join(" ").replace(/\s+/g, " ").trim(); l.y0 = Math.min(...l.items.map(i => i.y0)); l.y1 = Math.max(...l.items.map(i => i.y1)); });
    lines.sort((a, b) => b.o[1] - a.o[1]);
    let k = lines.findIndex(l => Math.abs(l.o[1] - o[1]) < l.fs * 0.3 && o[0] >= l.x0 - l.fs && o[0] <= l.x1 + l.fs); if (k < 0) return null;
    const like = (a, b) => Math.abs(a.fs - b.fs) < a.fs * 0.06 && a.fn === b.fn;
    let lo = k, hi = k, gap = 0;
    const fits = (a, b, first) => { const g = a.o[1] - b.o[1]; if (!like(a, b) || g < a.fs * 0.95 || g > a.fs * 2.3) return false; if (gap && Math.abs(g - gap) > gap * 0.15) return false; return Math.abs(a.x0 - b.x0) < a.fs * (first ? 3 : 0.6) && (gap = gap || g, true); };
    while (lo > 0 && fits(lines[lo - 1], lines[lo], lo - 1 === 0 || true)) lo--;
    while (hi < lines.length - 1 && fits(lines[hi], lines[hi + 1], false)) hi++;
    const par = lines.slice(lo, hi + 1); if (par.length < 2) return null;
    const W = Math.max(...par.map(l => l.w)), lh = par.length > 1 ? (par[0].o[1] - par[par.length - 1].o[1]) / (par.length - 1) : par[0].fs * 1.2;
    const justified = par.slice(0, -1).every(l => l.w > W * 0.975) && par.length > 1;
    let t = ""; par.forEach((l, i) => { if (!i) t = l.str; else if (/[a-z]-$/.test(t) && /^[a-z]/.test(l.str)) t = t.slice(0, -1) + l.str; else t += " " + l.str; });
    return {lines: par.map(l => ({o: l.o, w: l.w, y0: l.y0, y1: l.y1, old: l.str})), W, lh, al: justified ? "j" : "l", t, first: par[0]};
  }
  async function toParagraph(e){
    if (!e || e.k !== "t" || Math.abs(e.r || 0) > 0.5) return;
    const par = await paragraphAt(e.p, e.o); if (!par) { toast("This line isn't part of a paragraph."); return; }
    const was = textOf(E.ed && E.ed.e.id === e.id && E.ed.el ? E.ed.el : document.createElement("i")) || e.t;
    if (E.ed) { E.ed = null; }
    // the line's own change carries into the paragraph
    const idx = par.lines.findIndex(l => Math.abs(l.o[1] - e.o[1]) < e.fs * 0.3);
    let t = par.t; if (idx >= 0 && was && was !== par.lines[idx].old) t = t.replace(par.lines[idx].old, was);
    const first = par.first.items[0];
    const p = {id: uid(), a: E.rev, p: e.p, k: "p", o: par.lines[0].o, r: 0, lines: par.lines, W: par.W, lh: Math.round(par.lh * 100) / 100, al: par.al, fs: Math.round(first.fs * 100) / 100, s0: Math.round(first.fs * 100) / 100,
      f: e.f, b: e.b, i: e.i, c: e.c, bg: e.bg, cf: e.cf, old: par.t, t};
    const list = mine().filter(x => !(x.k === "t" && x.p === e.p && par.lines.some(l => Math.abs(l.o[1] - x.o[1]) < x.fs * 0.3 && x.o[0] >= l.o[0] - 1 && x.o[0] <= l.o[0] + l.w + 1)));
    save(list, null);
    startEdit(p); probe([p]);
  }

  /* Pointing at the page */
  async function itemAt(pg, x, y){
    const items = await pageInfo(pg.n), [px0, py0] = toPdf(pg, x, y);
    let best = null;
    for (const it of items) if (pdeInside(Object.assign({tol: it.fs * 0.15}, it), px0, py0)) { const area = it.w * (it.y1 - it.y0); if (!best || area < best.area) best = {it, area}; }
    return best && best.it;
  }
  // the line of text closest to a point (in page units), for a new text box's size and font
  async function nearest(pg, x, y){
    const items = await pageInfo(pg.n); let best = null;
    for (const it of items) { const d = Math.hypot(Math.max(0, it.o[0] - x, x - (it.o[0] + it.w)), y - (it.o[1] + it.fs * 0.35)); if (d < 150 && (!best || d < best.d)) best = {it, d}; }
    return best && best.it;
  }
  const local = (pg, ev) => { const b = pg.el.getBoundingClientRect(); return {x: (ev.clientX - b.left) * (pg.el.offsetWidth / b.width || 1), y: (ev.clientY - b.top) * (pg.el.offsetHeight / b.height || 1)}; };
  const pageOfEv = ev => { const el = ev.target.closest && ev.target.closest(".pdr-page"); return el && E ? E.pages.get(Number(el.dataset.p)) : null; };
  function showHover(pg, it){
    const L = layerOf(pg.n), h = L && L.querySelector(".pde-hover"); if (!h) return;
    if (!it) { h.hidden = true; return; }
    const b = vpBox(pg, Object.assign({}, it, {w: it.w + it.fs * 0.12, o: [it.o[0] - it.fs * 0.06 * Math.cos(it.r * Math.PI / 180), it.o[1] - it.fs * 0.06 * Math.sin(it.r * Math.PI / 180)]}));
    h.hidden = false; h.style.cssText = `left:${b.x}px;top:${b.y}px;width:${b.w}px;height:${b.h}px`;
  }
  let hoverT = 0;
  document.addEventListener("pointermove", ev => {
    if (!E || !E.on || E.drag) return;
    const pg = pageOfEv(ev); if (!pg) return;
    if (E.tool !== "text" || ev.target.closest(".pde-e,.pde-field")) { showHover(pg, null); return; }
    const at = local(pg, ev), my = ++hoverT;
    itemAt(pg, at.x, at.y).then(it => { if (my === hoverT && E) { showHover(pg, it); pg.el.classList.toggle("pde-over", !!it); } });
  });
  // the picked thing's corner, in page units (for resizing), and the axes along it
  const axes = r => { const a = (r || 0) * Math.PI / 180; return {ux: [Math.cos(a), Math.sin(a)], uy: [-Math.sin(a), Math.cos(a)]}; };
  document.addEventListener("pointerdown", ev => {
    if (!E || !E.on || ev.button > 0) return;
    const pg = pageOfEv(ev); if (!pg || ev.target.closest(".pde-e.editing,.pde-field")) return;
    const hitEl = ev.target.closest(".pde-e"), at = local(pg, ev);
    if (hitEl && hitEl.dataset.e === E.sel) {
      const e = mine().find(x => x.id === E.sel);
      if (e && ev.target.closest(".pde-grip") && isBox(e)) { ev.preventDefault(); E.drag = {kind: "size", pg, e, start: at}; return; }
      if (e && ev.target.closest(".pde-end")) { ev.preventDefault(); E.drag = {kind: "end", pg, e, end: Number(ev.target.closest(".pde-end").dataset.end), start: at}; return; }
      // dragging what's picked moves it (text boxes, white-outs, marks and pictures)
      if (e && (e.k === "n" || e.k === "w" || e.k === "s" || e.k === "i")) { ev.preventDefault(); E.drag = {kind: "move", pg, e, start: at, el: hitEl, moved: false}; return; }
    }
    if (hitEl || E.locked) return;
    if (E.tool === "white" || (E.tool === "mark" && ["rect", "ellipse", "line", "arrow"].includes(E.shape))) { ev.preventDefault(); E.drag = {kind: "band", pg, start: at, cur: at, shape: E.tool === "mark" ? E.shape : ""}; }
  });
  document.addEventListener("pointermove", ev => {
    const d = E && E.drag; if (!d) return;
    const at = local(d.pg, ev), L = layerOf(d.pg.n); if (!L) return;
    if (d.kind === "band") {
      d.cur = at;
      if (d.shape === "line" || d.shape === "arrow") { const s = L.querySelector(".pde-lnprev"); s.hidden = false; s.firstChild.setAttribute("d", `M${d.start.x} ${d.start.y}L${at.x} ${at.y}`); return; }
      const b = L.querySelector(".pde-band"); b.hidden = false; b.classList.toggle("round", d.shape === "ellipse");
      b.style.cssText = `left:${Math.min(at.x, d.start.x)}px;top:${Math.min(at.y, d.start.y)}px;width:${Math.abs(at.x - d.start.x)}px;height:${Math.abs(at.y - d.start.y)}px`;
      return;
    }
    const dx = at.x - d.start.x, dy = at.y - d.start.y; if (Math.hypot(dx, dy) > 3) d.moved = true;
    if (d.kind === "move") { const el = L.querySelector(`[data-e="${CSS.escape(d.e.id)}"]`); if (el) el.style.translate = `${dx}px ${dy}px`; return; }
    // resizing or moving a line's end: shown live by drawing the changed copy
    const next = resized(d, at); if (!next) return;
    const el = L.querySelector(`[data-e="${CSS.escape(d.e.id)}"]`);
    if (el) { const w = document.createElement("div"); w.innerHTML = editHtml(d.pg, next, false); el.replaceWith(w.firstChild); }
    d.next = next;
  });
  function resized(d, at){
    const e = d.e, [x, y] = toPdf(d.pg, at.x, at.y);
    if (d.kind === "end") { const pts = e.pts.slice(); pts[(d.end - 1) * 2] = x; pts[(d.end - 1) * 2 + 1] = y; return Object.assign({}, e, {pts}); }
    // the top-left corner stays put; the size follows the pointer (pictures keep their shape)
    const {ux, uy} = axes(e.r), tl = [e.o[0] + uy[0] * e.h, e.o[1] + uy[1] * e.h], v = [x - tl[0], y - tl[1]];
    let w = Math.max(4, v[0] * ux[0] + v[1] * ux[1]), h = Math.max(4, -(v[0] * uy[0] + v[1] * uy[1]));
    if (e.k === "i" || e.sh === "check" || e.sh === "cross" || e.sh === "dot") h = w * e.h / e.w;
    return Object.assign({}, e, {w, h, o: [tl[0] - uy[0] * h, tl[1] - uy[1] * h]});
  }
  document.addEventListener("pointerup", ev => {
    const d = E && E.drag; if (!d) return; E.drag = null;
    const at = local(d.pg, ev), L = layerOf(d.pg.n);
    if (d.kind === "band") {
      if (L) { L.querySelector(".pde-band").hidden = true; L.querySelector(".pde-lnprev").hidden = true; }
      const list = mine(); if (list.length >= MAX_EDITS) { toast(`A file can hold ${MAX_EDITS} edits.`); return; }
      if (d.shape === "line" || d.shape === "arrow") {
        if (Math.hypot(at.x - d.start.x, at.y - d.start.y) < 6) return;
        const [ax, ay] = toPdf(d.pg, d.start.x, d.start.y), [bx, by] = toPdf(d.pg, at.x, at.y);
        const e = {id: uid(), a: E.rev, p: d.pg.n, k: "s", sh: d.shape, pts: [ax, ay, bx, by], o: [ax, ay], c: E.sc, lw: E.sw, at: Date.now()};
        E.sel = e.id; save(list.concat([e]), d.shape === "arrow" ? "Arrow added" : "Line added"); E.justMade = Date.now(); return;
      }
      const x0 = Math.min(at.x, d.start.x), y0 = Math.min(at.y, d.start.y), x1 = Math.max(at.x, d.start.x), y1 = Math.max(at.y, d.start.y);
      if (x1 - x0 < 4 || y1 - y0 < 4) return;
      // bottom-left, bottom-right and top-left corners, in page units (a rotated page turns them)
      const [ax, ay] = toPdf(d.pg, x0, y1), [bx, by] = toPdf(d.pg, x1, y1), [cx, cy] = toPdf(d.pg, x0, y0);
      const r = Math.round(Math.atan2(by - ay, bx - ax) * 180 / Math.PI * 100) / 100, w = Math.hypot(bx - ax, by - ay), h = Math.hypot(cx - ax, cy - ay);
      const e = d.shape ? {id: uid(), a: E.rev, p: d.pg.n, k: "s", sh: d.shape, o: [ax, ay], r, w, h, c: E.sc, lw: E.sw, at: Date.now()}
        : {id: uid(), a: E.rev, p: d.pg.n, k: "w", o: [ax, ay], r, w, h, bg: sample(d.pg, {x: x0, y: y0, w: x1 - x0, h: y1 - y0}).bg, at: Date.now()};
      E.sel = e.id; save(list.concat([e]), d.shape ? (d.shape === "rect" ? "Box added" : "Circle added") : "White-out added"); E.justMade = Date.now();
      return;
    }
    if (d.kind === "move") {
      const el = L && L.querySelector(`[data-e="${CSS.escape(d.e.id)}"]`); if (el) el.style.translate = "";
      if (!d.moved) return;
      const [ox, oy] = toVp(d.pg, d.e.o[0], d.e.o[1]), [nx, ny] = toPdf(d.pg, ox + at.x - d.start.x, oy + at.y - d.start.y), dx = nx - d.e.o[0], dy = ny - d.e.o[1];
      const moved = Object.assign({}, d.e, {o: [nx, ny]}); if (d.e.pts) moved.pts = [d.e.pts[0] + dx, d.e.pts[1] + dy, d.e.pts[2] + dx, d.e.pts[3] + dy];
      save(mine().map(x => x.id === d.e.id ? moved : x), {w: "White-out moved", n: "Text box moved", s: "Mark moved", i: "Picture moved"}[d.e.k]);
      E.justMade = Date.now(); return;
    }
    if (d.next) { save(mine().map(x => x.id === d.e.id ? d.next : x), "Size changed"); E.justMade = Date.now(); }
  });
  // a click picks an edit, starts changing the text under it, adds a text box, a mark or a picture
  document.addEventListener("click", async ev => {
    if (!E || !E.on || (E.justMade && Date.now() - E.justMade < 250)) return;
    const pg = pageOfEv(ev); if (!pg || ev.target.closest(".pde-field")) return;
    ev.stopPropagation();
    if (E.locked) { toast("This PDF is locked (encrypted), so it can't be edited here."); return; }
    if (ev.target.closest(".pde-e.editing")) return;
    const hitEl = ev.target.closest(".pde-e"), at = local(pg, ev);
    if (hitEl && !E.place) {
      const e = mine().find(x => x.id === hitEl.dataset.e); if (!e) return;
      if (e.k === "w" || e.k === "s" || e.k === "i") { if (E.ed) commit(); E.sel = e.id; repaint(); bar(); return; }
      if (E.sel === e.id || ev.detail > 1) startEdit(e, {x: ev.clientX, y: ev.clientY});
      else { if (E.ed) commit(); E.sel = e.id; repaint(); bar(); }
      return;
    }
    if (E.ed) { commit(); if (E && E.ed) return; }
    const [x, y] = toPdf(pg, at.x, at.y), r = level(pg, x, y);
    if (E.place) {
      // a picture or signature goes where you click, its top-left corner there
      const pl = E.place, s = pg.vp.scale, w = pl.sig ? 150 : Math.min(pl.w * 0.75, pg.vp.width / s * 0.6), h = w * pl.h / pl.w;
      const [bx, by] = toPdf(pg, at.x, at.y + h * s);
      const e = {id: uid(), a: E.rev, p: pg.n, k: "i", img: pl.id, o: [bx, by], r, w, h, at: Date.now()}; if (pl.sig) e.sig = 1;
      E.place = null; E.tool = "text"; E.sel = e.id; save(mine().concat([e]), pl.sig ? "Signature added" : "Picture added"); E.justMade = Date.now(); return;
    }
    if (E.tool === "white" || (E.tool === "mark" && !["check", "cross", "dot"].includes(E.shape))) { if (E.sel) { E.sel = null; repaint(); bar(); } return; }
    if (E.tool === "mark") {
      const near = await nearest(pg, x, y), z = E.shape === "dot" ? Math.max(4, E.sw * 3) : near ? Math.max(8, near.fs * 1.1) : 14, s = pg.vp.scale;
      const [bx, by] = toPdf(pg, at.x - z * s / 2, at.y + z * s / 2);
      const e = {id: uid(), a: E.rev, p: pg.n, k: "s", sh: E.shape, o: [bx, by], r, w: z, h: z, c: E.sc, lw: E.shape === "dot" ? z : E.sw, at: Date.now()};
      E.sel = e.id; save(mine().concat([e]), E.shape === "check" ? "Checkmark added" : E.shape === "cross" ? "Cross added" : "Dot added"); return;
    }
    if (E.tool === "add") {
      const near = await nearest(pg, x, y), fs = near ? Math.round(near.fs * 10) / 10 : 12;
      const [bx, by] = toPdf(pg, at.x, at.y + fs * pg.vp.scale * 0.35);
      startEdit({id: uid(), a: E.rev, p: pg.n, k: "n", o: [bx, by], r, fs, f: near ? near.f : "h", b: 0, i: 0, c: "#000000", t: ""});
      return;
    }
    const it = await itemAt(pg, at.x, at.y);
    if (!it) { if (E.sel) { E.sel = null; repaint(); bar(); } else hint(); return; }
    startEdit(lineEdit(pg.n, it, sample(pg, vpBox(pg, it))), {x: ev.clientX, y: ev.clientY});
    probe([E.ed.e]);
  }, true);
  let hinted = 0;
  const hint = () => { if (Date.now() - hinted < 4000) return; hinted = Date.now(); toast("Click a line of text to change it, or pick another tool"); };
  // Delete removes the picked edit; Escape lets go of it; Ctrl+Z undoes (the app's own Ctrl+Z is off while a sheet is open)
  document.addEventListener("keydown", ev => {
    if (!E || !E.on || E.ed) return;
    const t = ev.target; if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    if ((ev.ctrlKey || ev.metaKey) && !ev.shiftKey && !ev.altKey && String(ev.key).toLowerCase() === "z") { ev.preventDefault(); ev.stopPropagation(); undoLast(); return; }
    if ((ev.key === "Delete" || ev.key === "Backspace") && E.sel) { ev.preventDefault(); remove(E.sel); }
    else if (ev.key === "Escape" && (E.sel || E.place || E.panel)) { ev.preventDefault(); ev.stopPropagation(); if (E.panel) closePanel(); else { E.sel = null; E.place = null; repaint(); bar(); } }
    else if (ev.key === "Enter" && E.sel) { const e = mine().find(x => x.id === E.sel); if (e && (e.k === "t" || e.k === "n" || e.k === "p")) { ev.preventDefault(); startEdit(e); } }
    // arrow keys nudge what's picked
    else if (/^Arrow/.test(ev.key) && E.sel) {
      const e = mine().find(x => x.id === E.sel), pg = e && E.pages.get(e.p); if (!e || !pg || !(e.k === "n" || e.k === "w" || e.k === "s" || e.k === "i")) return;
      ev.preventDefault(); const st = ev.shiftKey ? 10 : 1, dx = {ArrowLeft: -st, ArrowRight: st}[ev.key] || 0, dy = {ArrowUp: -st, ArrowDown: st}[ev.key] || 0;
      const [ox, oy] = toVp(pg, e.o[0], e.o[1]), [nx, ny] = toPdf(pg, ox + dx, oy + dy), mx = nx - e.o[0], my = ny - e.o[1];
      const moved = Object.assign({}, e, {o: [nx, ny]}); if (e.pts) moved.pts = [e.pts[0] + mx, e.pts[1] + my, e.pts[2] + mx, e.pts[3] + my];
      save(mine().map(x => x.id === e.id ? moved : x), null);
    }
  }, true);
  dlg.addEventListener("cancel", ev => { if (E && E.on && (E.ed || E.sel || E.place || E.panel)) ev.preventDefault(); });

  /* Find and replace, across every page */
  function findRe(){
    const q = E.find.q; if (!q) return null;
    const src = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    try { return new RegExp(E.find.ww ? `(?<![\\p{L}\\p{N}])${src}(?![\\p{L}\\p{N}])` : src, E.find.mc ? "gu" : "giu"); } catch (e) { return null; }
  }
  // every line on every page that has the words (or an edit's text that has them)
  async function findAll(){
    const re = findRe(), r = R(); if (!re || !r || !r.doc) return [];
    const out = [], list = mine();
    for (let n = 1; n <= r.doc.numPages; n++) {
      const items = await pageInfo(n);
      for (const it of items) {
        const t = list.find(e => e.k === "t" && e.p === n && Math.abs(e.o[0] - it.o[0]) < 0.5 && Math.abs(e.o[1] - it.o[1]) < 0.5);
        const p = list.find(e => e.k === "p" && e.p === n && e.lines.some(l => Math.abs(l.o[1] - it.o[1]) < it.fs * 0.3 && it.o[0] >= l.o[0] - 1 && it.o[0] <= l.o[0] + l.w + 1));
        if (p) continue;
        const text = t ? t.t : it.str; re.lastIndex = 0; const hits = (text.match(re) || []).length;
        if (hits) out.push({n, it, t, hits});
      }
      list.filter(e => e.p === n && (e.k === "p" || e.k === "n")).forEach(e => { re.lastIndex = 0; const hits = (e.t.match(re) || []).length; if (hits) out.push({n, edit: e, hits}); });
    }
    return out;
  }
  let findT = 0;
  async function findCount(){
    const my = ++findT, all = await findAll(); if (my !== findT || !E) return;
    E.find.all = all; const n = all.reduce((s, m) => s + m.hits, 0);
    const el = $("#pdeFindN"); if (el) el.textContent = E.find.q ? (n ? `${n} match${n === 1 ? "" : "es"} on ${new Set(all.map(m => m.n)).size} page${new Set(all.map(m => m.n)).size === 1 ? "" : "s"}` : "No matches") : "";
    const go = dlg.querySelector('[data-act="pde-find-all"]'); if (go) go.disabled = !n;
  }
  async function findStep(dir){
    const all = E.find.all || []; if (!all.length) return;
    E.find.at = (E.find.at + dir + all.length) % all.length;
    const m = all[E.find.at]; if (P.readerGo) P.readerGo(m.n);
    setTimeout(() => { const pg = E && E.pages.get(m.n); if (pg && m.it) showHover(pg, m.it); }, 350);
  }
  async function replaceAll(){
    const re = findRe(); if (!re) return;
    const all = await findAll(); if (!all.length) return;
    let list = mine(), n = 0;
    if (!(await libDoc().catch(() => null))) return;
    for (const m of all) {
      const fix = s => { re.lastIndex = 0; return s.replace(re, E.find.r); };
      if (m.edit) { list = list.map(x => x.id === m.edit.id ? Object.assign({}, x, {t: fix(x.t)}) : x); n += m.hits; continue; }
      if (m.t) { list = list.map(x => x.id === m.t.id ? Object.assign({}, x, {t: fix(x.t)}) : x); n += m.hits; continue; }
      if (list.length >= MAX_EDITS) break;
      const pg = E.pages.get(m.n), e = lineEdit(m.n, m.it, pg ? sample(pg, vpBox(pg, m.it)) : null); e.t = fix(m.it.str);
      const bad = badFor(e, e.t); if (bad.length) continue;
      list.push(e); n += m.hits;
    }
    save(list, `Replaced ${n} match${n === 1 ? "" : "es"}`); probe(list); findCount();
  }

  /* Panels over the pages (fonts, signatures, pages) */
  function panel(html, cls){
    const main = dlg.querySelector(".pdr-main"); if (!main) return null;
    closePanel();
    const el = document.createElement("div"); el.className = "pde-panel " + (cls || ""); el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true"); el.innerHTML = html;
    main.appendChild(el); E.panel = el;
    setTimeout(() => { const f = el.querySelector("[autofocus],input,button"); if (f) f.focus(); }, 30);
    return el;
  }
  function closePanel(){ if (E && E.panel) { E.panel.remove(); E.panel = null; } }
  const panelHead = (title, sub) => `<div class="pde-ph"><div><h3>${esc(title)}</h3>${sub ? `<p class="mini">${sub}</p>` : ""}</div><button type="button" class="icon-btn" data-act="pde-panel-close" aria-label="Close">${ico(IC.x)}</button></div>`;

  // Fonts: a file, or (Chrome and Edge on a computer) one installed on this computer
  function fontsPanel(){
    const list = myFonts(), local = typeof window.queryLocalFonts === "function";
    panel(`${panelHead("Your Fonts", "Fonts you add stay on this device. Only use fonts you're allowed to use: a font whose licence doesn't allow embedding can't be added.")}
      <div class="pde-pb">
        <div class="row-actions"><label class="btn small">${ico(IC.plus)}Add a Font File<input type="file" id="pdeFontFile" accept=".ttf,.otf,.woff,.woff2,font/ttf,font/otf,font/woff,font/woff2" class="sr"></label>
          ${local ? `<button type="button" class="btn small" data-act="pde-font-local">Fonts on This Computer…</button>` : ""}</div>
        <div id="pdeLocalFonts"></div>
        ${list.length ? `<ul class="pde-fonts">${list.map(f => `<li><span style="font-family:'pdeF-${f.id}',sans-serif">${esc(f.name)}</span>${f.view ? `<span class="mini">Viewing and printing only</span>` : ""}<span class="spacer"></span><button type="button" class="btn small" data-act="pde-font-use" data-id="${f.id}"${selected() && selected().k !== "s" && selected().k !== "w" && selected().k !== "i" ? "" : " disabled"}>Use</button><button type="button" class="icon-btn" data-act="pde-font-rm" data-id="${f.id}" aria-label="Remove ${esc(f.name)}">${ico(IC.trash)}</button></li>`).join("")}</ul>`
          : `<p class="mini">No fonts yet. Add a .ttf, .otf, .woff or .woff2 file.</p>`}
      </div>`, "fonts");
    list.forEach(f => fontReady(f.id));
  }
  async function localFonts(){
    let all; try { all = await window.queryLocalFonts(); } catch (e) { toast("Studyboard wasn't allowed to see this computer's fonts."); return; }
    const box = $("#pdeLocalFonts"); if (!box) return;
    E.localFonts = all;
    box.innerHTML = `<label class="f"><span class="lh">Search this computer's fonts</span><input type="search" id="pdeLocalQ" placeholder="Font name" autocomplete="off"></label><ul class="pde-fonts pde-local" id="pdeLocalList"></ul>`;
    const draw = q => { const re = new RegExp(String(q || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"); $("#pdeLocalList").innerHTML = all.filter(f => re.test(f.fullName)).slice(0, 80).map(f => `<li><span>${esc(f.fullName)}</span><span class="spacer"></span><button type="button" class="btn small" data-act="pde-font-pick" data-id="${all.indexOf(f)}">Add</button></li>`).join("") || `<li class="mini">No fonts match.</li>`; };
    draw(""); $("#pdeLocalQ").addEventListener("input", ev => draw(ev.target.value));
  }

  // Signatures: drawn, typed or a photo
  function signPanel(){
    const sigs = mySigs();
    panel(`${panelHead("Add a Signature", "This places a picture of your signature on the page. It isn't a certified digital signature.")}
      <div class="pde-pb">
        <div class="pde-tabs" role="tablist">${["Draw", "Type", "Photo"].concat(sigs.length ? ["Saved"] : []).map((t, i) => `<button type="button" role="tab" class="pde-tab" data-act="pde-sig-tab" data-id="${t}" aria-selected="${i === 0}">${t}</button>`).join("")}</div>
        <div class="pde-sigbox" id="pdeSigBox"></div>
        <label class="pde-chk"><input type="checkbox" id="pdeSigKeep" checked> Keep this signature on this device for next time</label>
      </div>
      <div class="pde-pf"><span class="spacer"></span><button type="button" class="btn" data-act="pde-panel-close">Cancel</button><button type="button" class="btn primary" data-act="pde-sig-use">Place Signature</button></div>`, "sign");
    sigTab("Draw");
  }
  let SIG = null;
  function sigTab(t){
    const box = $("#pdeSigBox"); if (!box) return;
    dlg.querySelectorAll(".pde-tab").forEach(b => b.setAttribute("aria-selected", String(b.dataset.id === t)));
    SIG = {tab: t, color: (SIG && SIG.color) || "#14204a"};
    const cols = `<span class="pde-cols">${[["#14204a", "Dark blue"], ["#000000", "Black"]].map(([c, n]) => `<button type="button" class="pde-col" data-act="pde-sig-color" data-id="${c}" style="--c:${c}" aria-label="${n}" aria-pressed="${SIG.color === c}"></button>`).join("")}</span>`;
    if (t === "Draw") {
      box.innerHTML = `<canvas class="pde-pad" id="pdeSigPad" width="1200" height="400" aria-label="Draw your signature here"></canvas><div class="row-actions">${cols}<span class="spacer"></span><button type="button" class="btn small" data-act="pde-sig-clear">Clear</button></div>`;
      const cv = $("#pdeSigPad"), ctx = cv.getContext("2d"); let last = null; SIG.drawn = false;
      const pt = ev => { const b = cv.getBoundingClientRect(); return [(ev.clientX - b.left) * cv.width / b.width, (ev.clientY - b.top) * cv.height / b.height]; };
      cv.addEventListener("pointerdown", ev => { cv.setPointerCapture(ev.pointerId); last = pt(ev); ctx.beginPath(); ctx.arc(last[0], last[1], 2.5, 0, 7); ctx.fillStyle = SIG.color; ctx.fill(); SIG.drawn = true; });
      cv.addEventListener("pointermove", ev => { if (!last) return; const p = pt(ev); ctx.strokeStyle = SIG.color; ctx.lineWidth = 5 * (ev.pressure && ev.pointerType === "pen" ? 0.6 + ev.pressure : 1); ctx.lineCap = ctx.lineJoin = "round"; ctx.beginPath(); ctx.moveTo(last[0], last[1]); ctx.quadraticCurveTo(last[0], last[1], (last[0] + p[0]) / 2, (last[1] + p[1]) / 2); ctx.lineTo(p[0], p[1]); ctx.stroke(); last = p; });
      const end = () => { last = null; }; cv.addEventListener("pointerup", end); cv.addEventListener("pointercancel", end);
    } else if (t === "Type") {
      const styles = [["Caveat", "Caveat"], ["Kalam", "Kalam"], ["Patrick Hand", "Patrick Hand"], ["Gochi Hand", "Gochi Hand"]];
      SIG.font = SIG.font || "Caveat";
      box.innerHTML = `<label class="f"><span class="lh">Your name</span><input type="text" id="pdeSigName" maxlength="60" autocomplete="name" value="${esc((SIG && SIG.name) || "")}"></label>
        <div class="pde-sigstyles">${styles.map(([f, n]) => `<button type="button" class="pde-sigstyle" data-act="pde-sig-font" data-id="${f}" aria-pressed="${SIG.font === f}" style="font-family:'${f}',cursive">${esc(n)}</button>`).join("")}</div>
        <div class="row-actions">${cols}</div>`;
      $("#pdeSigName").addEventListener("input", ev => { SIG.name = ev.target.value; dlg.querySelectorAll(".pde-sigstyle").forEach(b => { b.textContent = ev.target.value || b.dataset.id; }); });
    } else if (t === "Photo") {
      box.innerHTML = `<p class="mini">A clear photo or scan of your signature on white paper works best.</p><label class="btn small">${ico(IC.image)}Choose a Picture<input type="file" id="pdeSigFile" accept="image/png,image/jpeg,image/webp" class="sr"></label>
        <label class="pde-chk"><input type="checkbox" id="pdeSigClear" checked> Make the white paper see-through</label><p class="mini" id="pdeSigFileName"></p>`;
      $("#pdeSigFile").addEventListener("change", ev => { SIG.file = ev.target.files && ev.target.files[0]; $("#pdeSigFileName").textContent = SIG.file ? SIG.file.name : ""; });
    } else {
      box.innerHTML = `<ul class="pde-sigs">${mySigs().map(s => `<li><button type="button" class="pde-sigpick" data-act="pde-sig-pick" data-id="${s.id}" aria-label="Use this signature"><img alt="" data-sig="${s.id}"></button><button type="button" class="icon-btn" data-act="pde-sig-rm" data-id="${s.id}" aria-label="Forget this signature">${ico(IC.trash)}</button></li>`).join("")}</ul>`;
      box.querySelectorAll("img[data-sig]").forEach(img => imgData(img.dataset.sig).then(v => { if (v) img.src = URL.createObjectURL(new Blob([v.bytes], {type: "image/png"})); }));
    }
  }
  async function sigUse(){
    let pic = null;
    try {
      if (SIG.tab === "Draw") { if (!SIG.drawn) { toast("Draw your signature first"); return; } pic = await keepImage(trimmed($("#pdeSigPad")), false); }
      else if (SIG.tab === "Type") {
        const name = String(SIG.name || "").trim(); if (!name) { toast("Type your name first"); return; }
        try { await document.fonts.load(`120px "${SIG.font}"`); } catch (e) {}
        const cv = document.createElement("canvas"), ctx = cv.getContext("2d"); ctx.font = `120px "${SIG.font}",cursive`;
        cv.width = Math.ceil(ctx.measureText(name).width + 40); cv.height = 200; const c2 = cv.getContext("2d"); c2.font = `120px "${SIG.font}",cursive`; c2.fillStyle = SIG.color; c2.textBaseline = "middle"; c2.fillText(name, 20, 100);
        pic = await keepImage(trimmed(cv), false);
      } else if (SIG.tab === "Photo") { if (!SIG.file) { toast("Choose a picture first"); return; } pic = await imageFromFile(SIG.file, {clearWhite: $("#pdeSigClear").checked, trim: true}); }
    } catch (err) { toast((err && err.message) || "Couldn't use that signature."); return; }
    if (!pic) return;
    if ($("#pdeSigKeep") && $("#pdeSigKeep").checked) lsSet(K_SIGS, [{id: pic.id, w: pic.w, h: pic.h, at: Date.now()}].concat(mySigs().filter(s => s.id !== pic.id)).slice(0, 4));
    placeNext(Object.assign({sig: true}, pic));
  }
  function placeNext(pic){ closePanel(); E.place = pic; E.sel = null; repaint(); bar(); toast(pic.sig ? "Click where your signature goes" : "Click where the picture goes"); }

  // Pages: turn, take out, move, add blank pages and pages from other PDFs, take some pages out as their own PDF
  function pagesPanel(){
    const r = R(); if (!r || !r.doc) return;
    E.pp = {plan: Array.from({length: r.doc.numPages}, (_, i) => ({s: 0, p: i + 1, rot: 0, key: "0:" + (i + 1)})), docs: [], pick: new Set()};
    // a blank page is the size of this PDF's first page
    r.doc.getPage(1).then(pg => { const v = pg.view; if (E && E.pp) E.pp.size = [Math.abs(v[2] - v[0]) || 612, Math.abs(v[3] - v[1]) || 792]; }).catch(() => {});
    panel(`${panelHead("Pages", "Turn, move or take out pages, add blank pages or pages from another PDF, then Apply. Select pages to save them as their own PDF.")}
      <div class="pde-pb"><div class="pde-grid" id="pdeGrid"></div></div>
      <div class="pde-pf"><label class="btn small">${ico(IC.plus)}Add Pages From a PDF<input type="file" id="pdePagesFile" accept="application/pdf,.pdf" class="sr"></label>
        ${otherPdfs().length ? `<select id="pdePagesFrom" aria-label="Add pages from a PDF in Studyboard"><option value="">Or add from your files…</option>${otherPdfs().map(f => `<option value="${esc(f.id)}">${esc(f.name)}</option>`).join("")}</select>` : ""}
        <span class="spacer"></span><button type="button" class="btn small" data-act="pde-pages-extract" disabled>Save Selected as a PDF</button><button type="button" class="btn" data-act="pde-panel-close">Cancel</button><button type="button" class="btn primary" data-act="pde-pages-apply">Apply</button></div>`, "pages");
    drawGrid();
  }
  const otherPdfs = () => Object.values(state.files || {}).filter(f => f && f.id !== E.fid && f.kind === "file" && f.revs && f.revs.length && /\.pdf$/i.test(curRev(f).name || f.name)).slice(0, 200);
  const thumbs = new Map();
  async function thumbOf(src, p){
    const key = src + ":" + p; if (thumbs.has(key)) return thumbs.get(key);
    const pr = (async () => {
      const d = src === 0 ? R().doc : E.pp.docs[src - 1].doc, page = await d.getPage(p), vp0 = page.getViewport({scale: 1}), vp = page.getViewport({scale: 150 / Math.max(vp0.width, vp0.height)});
      const cv = document.createElement("canvas"); cv.width = Math.round(vp.width); cv.height = Math.round(vp.height);
      await page.render({canvasContext: cv.getContext("2d"), viewport: vp}).promise; return cv.toDataURL("image/png");
    })();
    thumbs.set(key, pr); return pr;
  }
  function drawGrid(){
    const g = $("#pdeGrid"); if (!g || !E.pp) return;
    const pl = E.pp.plan;
    g.innerHTML = pl.map((x, i) => `<div class="pde-card${E.pp.pick.has(x.key) ? " picked" : ""}" data-i="${i}">
      <label class="pde-thumb"><input type="checkbox" class="sr" data-pick="${esc(x.key)}"${E.pp.pick.has(x.key) ? " checked" : ""} aria-label="Select page ${i + 1}">${x.blank ? `<span class="pde-blank"></span>` : `<img alt="" data-src="${x.s}" data-p="${x.p}" style="transform:rotate(${x.rot}deg)">`}</label>
      <span class="mini">${i + 1}${x.blank ? " · Blank" : x.s ? ` · ${esc(E.pp.docs[x.s - 1].name)} p.${x.p}` : x.p !== i + 1 ? ` · was ${x.p}` : ""}</span>
      <span class="pde-cardbar"><button type="button" class="icon-btn" data-act="pde-pg" data-id="L:${i}" aria-label="Move page ${i + 1} earlier"${i ? "" : " disabled"}>${ico(IC.left)}</button><button type="button" class="icon-btn" data-act="pde-pg" data-id="l:${i}" aria-label="Turn page ${i + 1} left">${ico(IC.rotL)}</button><button type="button" class="icon-btn" data-act="pde-pg" data-id="r:${i}" aria-label="Turn page ${i + 1} right">${ico(IC.rotR)}</button><button type="button" class="icon-btn" data-act="pde-pg" data-id="b:${i}" aria-label="Add a blank page after page ${i + 1}">${ico(IC.plus)}</button><button type="button" class="icon-btn" data-act="pde-pg" data-id="x:${i}" aria-label="Take out page ${i + 1}"${pl.length > 1 ? "" : " disabled"}>${ico(IC.trash)}</button><button type="button" class="icon-btn" data-act="pde-pg" data-id="R:${i}" aria-label="Move page ${i + 1} later"${i < pl.length - 1 ? "" : " disabled"}>${ico(IC.right)}</button></span></div>`).join("");
    g.querySelectorAll("img[data-src]").forEach(img => thumbOf(Number(img.dataset.src), Number(img.dataset.p)).then(u => { img.src = u; }).catch(() => {}));
    const ex = dlg.querySelector('[data-act="pde-pages-extract"]'); if (ex) ex.disabled = !E.pp.pick.size;
  }
  // another PDF's bytes: the copy kept on this device for reading, or the stored file
  async function pdfBytesOf(id){
    try { const b = await idbGet("pdf:" + id); if (b) { const u8 = new Uint8Array(await (b instanceof Blob ? b.arrayBuffer() : b)); if (u8.length) return u8; } } catch (e) {}
    return assetBytes(id);
  }
  async function addPdfToPages(bytes, name){
    try {
      await loadPdfJs(); const d = await window.pdfjsLib.getDocument({data: bytes.slice(), ...PDF_OPTS}).promise;
      E.pp.docs.push({name: String(name || "PDF").replace(/\.pdf$/i, "").slice(0, 40), bytes, doc: d}); const s = E.pp.docs.length;
      for (let p = 1; p <= d.numPages && E.pp.plan.length < 500; p++) E.pp.plan.push({s, p, rot: 0, key: s + ":" + p});
      drawGrid(); toast(`Added ${d.numPages} page${d.numPages === 1 ? "" : "s"}`);
    } catch (e) { toast("Couldn't read that PDF."); }
  }
  // Everything waiting (edits and form answers) goes into the file first; the pages are then rearranged from that
  async function baseBytes(withMarks){
    const L = await loadLib(), bytes = await P.readerBytes(), list = mine();
    if (!list.length && !withMarks) return bytes;
    const opts = await bakeOpts(list, withMarks);
    return (await pdeBake(L, bytes, list.map(e => Object.assign({}, e)), opts)).bytes;
  }
  async function pagesApply(){
    if (!(await signedOk())) return;
    const plan = E.pp.plan.map(x => x.blank ? {blank: x.blank} : {s: x.s, p: x.p, rot: x.rot});
    if (plan.every((x, i) => !x.blank && !x.s && x.p === i + 1 && !x.rot) && E.pp.plan.length === R().doc.numPages) { closePanel(); toast("No page changes to apply"); return; }
    busy = true;
    try {
      toast("Changing the pages…");
      const L = await loadLib(), base = await baseBytes(false), out = await pdeReorg(L, base, plan, E.pp.docs.map(d => d.bytes));
      // where each of this PDF's pages went, so highlights and handwriting can follow
      const map = new Map(); E.pp.plan.forEach((x, i) => { if (!x.s && !x.blank && !map.has(x.p)) map.set(x.p, {p: i + 1, rot: x.rot}); });
      closePanel();
      await storeVersion(out, {map, label: "pages changed", fallbackName: editedName(curRev(fileOf()).name || fileOf().name)});
    } catch (err) { toast((err && err.message) || "Couldn't change the pages."); }
    finally { busy = false; if (E) bar(); }
  }
  async function pagesExtract(){
    const sel = E.pp.plan.filter(x => E.pp.pick.has(x.key)); if (!sel.length) return;
    try {
      const L = await loadLib(), base = await baseBytes(false);
      const out = await pdeReorg(L, base, sel.map(x => x.blank ? {blank: x.blank} : {s: x.s, p: x.p, rot: x.rot}), E.pp.docs.map(d => d.bytes));
      const f = fileOf(), nums = sel.filter(x => !x.s && !x.blank).map(x => x.p), name = (curRev(f).name || f.name).replace(/\.pdf$/i, "") + (nums.length ? ` (page${nums.length === 1 ? "" : "s"} ${nums.join(", ")})` : " (pages)") + ".pdf";
      const assets = await getAssets().catch(() => null);
      const where = assets ? await askBox({title: "Save the Selected Pages", text: `${sel.length} page${sel.length === 1 ? "" : "s"} as a new PDF, “${name}”.`, yes: "Add to My Files", no: "Download Instead"}) : false;
      if (where) {
        const up = await assets.upload(new File([out], name, {type: "application/pdf"}), {type: "application/pdf", courseId: f.courseId, folderId: f.folderId});
        try { await idbSet("pdf:" + up.id, new Blob([out], {type: "application/pdf"})); } catch (e) {}
        const nf = normFile({id: uid(), name, courseId: f.courseId || "", folderId: f.folderId || "other", kind: "file", revs: [Object.assign({assetId: up.id, size: up.sizeBytes || out.length, type: "application/pdf", at: Date.now(), name}, up.localRel ? {localRel: up.localRel} : {})], created: Date.now()});
        applyChanges([{kind: "file", id: nf.id, after: nf}], `${name} added to your files`);
      } else await deliver(out, name);
      E.pp.pick.clear(); drawGrid();
    } catch (err) { toast((err && err.message) || "Couldn't save those pages."); }
  }

  /* The edit bar */
  function barHtml(){
    const e = selected(), n = mine().length, pr = e && (e.k === "t" || e.k === "p") ? probeOf(e) : null, txt = e && (e.k === "t" || e.k === "n" || e.k === "p");
    const fam = e ? (e.ff ? "ff:" + e.ff : (e.k === "t" || e.k === "p") && e.keep !== false ? "o" : e.f || "h") : "";
    const tool = (k, label, icon, extra) => `<button type="button" class="btn small pde-tool" data-act="pde-tool" data-id="${k}" aria-pressed="${E.tool === k && !E.place}" title="${label}"${extra || ""}>${ico(icon)}<span class="pde-lbl">${label}</span></button>`;
    const fonts = myFonts(), markish = E.tool === "mark" || (e && e.k === "s");
    const msg = E.locked ? "This PDF is locked (encrypted), so it can't be edited here."
      : E.place ? (E.place.sig ? "Click where your signature goes" : "Click where the picture goes")
      : E.signed ? "This PDF has a digital signature. Saving changes will make it show as no longer valid."
      : e && e.ff && !FK.get(e.ff) && !myFonts().some(f => f.id === e.ff) ? "This font is on another device. Until it's added here, a similar font is used."
      : e && (e.k === "t" || e.k === "p") && pr ? (pr.keep ? "Same font as the PDF" : "A similar font: this PDF's font doesn't have every letter here")
      : e && e.k === "i" && e.sig ? "A picture of your signature (not a certified digital signature)"
      : !n ? "Click any text to change it" : "";
    const marks = markish ? `<span class="pde-marks" role="group" aria-label="Marks">${SHAPES.map(([k, name, d]) => `<button type="button" class="icon-btn pde-shape-btn" data-act="pde-shape" data-id="${k}" aria-label="${name}" title="${name}" aria-pressed="${E.tool === "mark" && E.shape === k}">${ico(d)}</button>`).join("")}</span>
      <span class="pde-cols">${COLORS.map(([hex, name]) => `<button type="button" class="pde-col" data-act="pde-scolor" data-id="${hex}" style="--c:${hex}" aria-label="${name}" aria-pressed="${((e && e.k === "s" ? e.c : E.sc) || "").toLowerCase() === hex}"></button>`).join("")}</span>
      <select id="pdeSw" aria-label="Line width">${WIDTHS.map(([w, name]) => `<option value="${w}"${(e && e.k === "s" ? e.lw : E.sw) === w ? " selected" : ""}>${name}</option>`).join("")}</select>` : "";
    const find = E.tool === "find" ? `<span class="pde-find" role="search"><input type="search" id="pdeFindQ" placeholder="Find" aria-label="Find" value="${esc(E.find.q)}" autocomplete="off"><input type="text" id="pdeFindR" placeholder="Replace with" aria-label="Replace with" value="${esc(E.find.r)}" autocomplete="off">
      <label class="pde-chk"><input type="checkbox" id="pdeFindMc"${E.find.mc ? " checked" : ""}> Match case</label><label class="pde-chk"><input type="checkbox" id="pdeFindWw"${E.find.ww ? " checked" : ""}> Whole words</label>
      <button type="button" class="icon-btn" data-act="pde-find-step" data-id="-1" aria-label="Previous match">${ico(IC.left)}</button><button type="button" class="icon-btn" data-act="pde-find-step" data-id="1" aria-label="Next match">${ico(IC.right)}</button>
      <span class="mini" id="pdeFindN" aria-live="polite"></span><button type="button" class="btn small" data-act="pde-find-all" disabled>Replace All</button></span>` : "";
    return `<span class="pde-tools" role="group" aria-label="Edit tools">${tool("text", "Edit Text", IC.text)}${tool("add", "Add Text", IC.add)}${tool("white", "White-Out", IC.white)}${tool("mark", "Marks", IC.mark)}<label class="btn small pde-tool" aria-pressed="false" title="Picture">${ico(IC.image)}<span class="pde-lbl">Picture</span><input type="file" id="pdeImgFile" accept="image/png,image/jpeg,image/webp,image/gif" class="sr"></label>${tool("sign", "Sign", IC.sign)}${tool("find", "Find", IC.find)}${tool("pages", "Pages", IC.pages)}</span>
      <span class="spacer"></span>
      <span class="pde-save"><button type="button" class="btn small" data-act="pde-dl" title="Download PDF"${n || hasMarks() ? "" : " disabled"}>${ico(IC.down)}<span class="pde-lbl">Download PDF</span></button><button type="button" class="btn small primary" data-act="pde-save"${n ? "" : " disabled"}>${ico(IC.save)}Save${n ? ` ${n} Edit${n === 1 ? "" : "s"}` : ""}</button></span>
      <div class="pde-sub">
      <span class="pde-fmt" role="group" aria-label="Text style"${txt ? "" : " hidden"}>
        <select id="pdeFam" aria-label="Font">${e && (e.k === "t" || e.k === "p") ? `<option value="o"${fam === "o" ? " selected" : ""}>Original Font</option>` : ""}<option value="h"${fam === "h" ? " selected" : ""}>Sans</option><option value="t"${fam === "t" ? " selected" : ""}>Serif</option><option value="c"${fam === "c" ? " selected" : ""}>Mono</option>
          ${fonts.length || (e && e.ff) ? `<optgroup label="Your fonts">${fonts.map(f => `<option value="ff:${f.id}"${fam === "ff:" + f.id ? " selected" : ""}>${esc(f.name)}</option>`).join("")}${e && e.ff && !fonts.some(f => f.id === e.ff) ? `<option value="ff:${esc(e.ff)}" selected>${esc(e.fn || "Font on another device")}</option>` : ""}</optgroup>` : ""}<option value="+">Add a Font…</option></select>
        <span class="pde-size"><button type="button" class="icon-btn" data-act="pde-size" data-id="-1" aria-label="Smaller text">${ico('<path d="M5 12h14"/>')}</button><input id="pdeSize" type="text" inputmode="decimal" value="${e && e.fs ? Math.round(e.fs * 10) / 10 : ""}" aria-label="Text size in points"><button type="button" class="icon-btn" data-act="pde-size" data-id="1" aria-label="Bigger text">${ico(IC.plus)}</button></span>
        <button type="button" class="icon-btn pde-b" data-act="pde-b" aria-pressed="${!!(e && e.b)}" aria-label="Bold"><b>B</b></button><button type="button" class="icon-btn pde-i" data-act="pde-i" aria-pressed="${!!(e && e.i)}" aria-label="Italic"><i>I</i></button>
        <span class="pde-cols">${COLORS.map(([hex, name]) => `<button type="button" class="pde-col" data-act="pde-color" data-id="${hex}" style="--c:${hex}" aria-label="${name}" aria-pressed="${!!(e && (e.c || "").toLowerCase() === hex)}"></button>`).join("")}<label class="pde-col pde-any" style="--c:${esc((e && e.c) || "#000000")}" title="Any color"><span class="sr">Any color</span><input type="color" id="pdeColor" value="${esc((e && /^#[0-9a-f]{6}$/i.test(e.c || "") && e.c) || "#000000")}"></label></span>
        ${e && e.k === "t" && Math.abs(e.r || 0) < 0.5 ? `<button type="button" class="btn small" data-act="pde-para" title="Edit the whole paragraph, re-wrapping its lines">${ico(IC.para)}Edit Paragraph</button>` : ""}
        ${e && e.k === "p" ? `<span class="pde-al" role="group" aria-label="Alignment"><button type="button" class="btn small" data-act="pde-al" data-id="l" aria-pressed="${e.al !== "j"}">Left</button><button type="button" class="btn small" data-act="pde-al" data-id="j" aria-pressed="${e.al === "j"}">Justified</button></span>` : ""}
      </span>${marks}${find}
      ${e ? `<button type="button" class="icon-btn pde-del" data-act="pde-del" aria-label="${e.k === "t" || e.k === "p" ? "Undo this edit" : "Remove"}" title="${e.k === "t" || e.k === "p" ? "Put the original text back" : "Remove"}">${ico(IC.trash)}</button>` : ""}
      <span class="mini pde-note${E.signed && !e ? " warn" : ""}" id="pdeMsg" aria-live="polite">${esc(msg)}</span></div>`;
  }
  function bar(){
    const sheet = dlg.querySelector(".pdr-sheet"); if (!sheet || !E) return;
    let b = sheet.querySelector(".pde-bar");
    const btn = $("#pdeBtn"); if (btn) { btn.setAttribute("aria-pressed", String(E.on)); const c = btn.querySelector("b"); const n = mine().length; if (c) { c.textContent = n ? String(n) : ""; c.hidden = !n; } }
    const pages = $("#pdrPages"); if (pages) { pages.classList.toggle("pde-on", E.on); pages.dataset.pdeTool = E.place ? "place" : E.tool; }
    if (!E.on) { if (b) b.remove(); return; }
    const ae = document.activeElement, focusId = ae && b && b.contains(ae) ? ae.id || ae.dataset.act + (ae.dataset.id || "") : "", caret = ae && ae.id && /^pdeFind/.test(ae.id) ? ae.selectionStart : null;
    if (!b) { b = document.createElement("div"); b.className = "pde-bar"; b.setAttribute("role", "toolbar"); b.setAttribute("aria-label", "Edit PDF"); sheet.querySelector(".pdr-bar").after(b); }
    b.innerHTML = barHtml();
    if (focusId) { const el = b.querySelector("#" + focusId) || [...b.querySelectorAll("[data-act]")].find(x => x.dataset.act + (x.dataset.id || "") === focusId); if (el) { el.focus(); if (caret != null && el.setSelectionRange) try { el.setSelectionRange(caret, caret); } catch (e) {} } }
    if (E.tool === "find") findCount();
  }
  document.addEventListener("input", ev => {
    if (!E || !E.on || !ev.target.closest || !ev.target.closest(".pde-bar")) return;
    const id = ev.target.id;
    if (id === "pdeFindQ") { E.find.q = ev.target.value; E.find.at = -1; findCount(); }
    else if (id === "pdeFindR") E.find.r = ev.target.value;
  });
  document.addEventListener("change", async ev => {
    if (!E || !E.on || !ev.target.closest) return;
    const id = ev.target.id;
    if (id === "pdeImgFile") { const f = ev.target.files && ev.target.files[0]; ev.target.value = ""; if (!f) return; try { placeNext(await imageFromFile(f)); } catch (err) { toast(err.message); } return; }
    if (id === "pdeFontFile") { const f = ev.target.files && ev.target.files[0]; ev.target.value = ""; if (!f) return; const fid = await addFont(new Uint8Array(await f.arrayBuffer())); if (fid) { useFont(fid); fontsPanel(); } return; }
    if (id === "pdePagesFile") { const f = ev.target.files && ev.target.files[0]; ev.target.value = ""; if (f) addPdfToPages(new Uint8Array(await f.arrayBuffer()), f.name); return; }
    if (id === "pdePagesFrom") { const f = state.files[ev.target.value]; ev.target.value = ""; if (!f) return; try { addPdfToPages(await pdfBytesOf(curRev(f).assetId), f.name); } catch (err) { toast("Couldn't open that file here."); } return; }
    if (ev.target.dataset && ev.target.dataset.pick != null) { const k = ev.target.dataset.pick; if (ev.target.checked) E.pp.pick.add(k); else E.pp.pick.delete(k); drawGrid(); return; }
    if (!ev.target.closest(".pde-bar")) return;
    if (id === "pdeFindMc") { E.find.mc = ev.target.checked; findCount(); return; }
    if (id === "pdeFindWw") { E.find.ww = ev.target.checked; findCount(); return; }
    if (id === "pdeSw") { const w = Number(ev.target.value) || 2; E.sw = w; const e = selected(); if (e && e.k === "s") restyle({lw: e.sh === "dot" ? e.lw : w}); return; }
    const e = selected(); if (!e) return;
    if (id === "pdeFam") {
      const v = ev.target.value; if (!v) { bar(); return; }
      if (v === "+") { bar(); fontsPanel(); return; }
      if (v.startsWith("ff:")) { useFont(v.slice(3)); return; }
      restyle(v === "o" ? {keep: true, ff: "", fn: "", f: e.f, fs: e.s0 || e.fs, b: e.b, i: e.i} : {f: v, ff: "", fn: ""});
    }
    else if (id === "pdeSize") { const v = parseFloat(ev.target.value); if (v >= 2 && v <= 400) restyle({fs: Math.round(v * 10) / 10}); else bar(); }
    else if (id === "pdeColor") restyle({c: ev.target.value.toLowerCase()}, "Text color changed");
  });
  async function useFont(id){ const e = selected(); if (!e || !(e.k === "t" || e.k === "n" || e.k === "p")) { toast("Pick some text first, then its font"); return; } await fontReady(id); restyle({ff: id, fn: fontName(id)}); }
  // keeps a click on the bar from ending the text being typed
  document.addEventListener("pointerdown", ev => { if (E && E.ed && ev.target.closest && ev.target.closest(".pde-bar") && !ev.target.closest("select,input,label")) ev.preventDefault(); }, true);

  /* Saving */
  const hasMarks = () => { const f = fileOf(); return !!f && ((f.hl || []).some(h => h && h.a === E.rev) || (f.ink || []).some(s => s && s.a === E.rev && s.p)); };
  // what the writer needs besides the edits: fonts and pictures from this device, and (for downloads) highlights and handwriting
  async function bakeOpts(list, withMarks){
    const opts = {fonts: {}, images: {}, annots: []};
    const ffs = [...new Set(list.map(e => e.ff).filter(Boolean))];
    if (ffs.length) { opts.fontkit = await loadFontkit(); for (const id of ffs) { const b = await fontBytes(id); if (b) opts.fonts[id] = b; } }
    for (const id of [...new Set(list.filter(e => e.k === "i").map(e => e.img))]) { const v = await imgData(id); if (v) opts.images[id] = {bytes: v.bytes, type: v.type}; }
    if (withMarks) opts.annots = await marksOf();
    return opts;
  }
  // highlights and handwriting, turned from page shares into the PDF's own units
  async function marksOf(){
    const f = fileOf(), r = R(); if (!f || !r || !r.doc) return [];
    const out = [], vps = new Map();
    const vpOf = async n => { if (!vps.has(n)) vps.set(n, (await r.doc.getPage(n)).getViewport({scale: 1})); return vps.get(n); };
    for (const h of (f.hl || []).filter(h => h && h.a === E.rev && Array.isArray(h.r))) {
      const vp = await vpOf(h.p), pt = (x, y) => vp.convertToPdfPoint(x * vp.width, y * vp.height);
      out.push({p: h.p, k: "hl", id: h.id, c: HL_HEX[h.c] || HL_HEX.yellow, t: h.t, quads: h.r.map(([x, y, w, hh]) => [...pt(x, y), ...pt(x + w, y), ...pt(x, y + hh), ...pt(x + w, y + hh)])});
    }
    const strokes = window.SBINK && SBINK.exportStrokes ? SBINK.exportStrokes(f, E.rev) : [];
    for (const s of strokes) {
      const vp = await vpOf(s.p), pt = ([x, y]) => vp.convertToPdfPoint(x * vp.width, y * vp.height);
      out.push({p: s.p, k: "ink", id: s.id, c: s.c, w: Math.max(0.4, s.wf * vp.width), op: s.hl ? 0.45 : 1, paths: [s.pts.map(pt)]});
    }
    return out;
  }
  async function bake(withMarks){
    const f = fileOf(), list = mine(); if (!f || (!list.length && !withMarks)) return null;
    const L = await loadLib(), bytes = await P.readerBytes();
    return pdeBake(L, bytes, list.map(e => Object.assign({}, e)), await bakeOpts(list, withMarks));
  }
  const editedName = name => name.replace(/(\.pdf)?$/i, "").replace(/\s*\(edited\)$/i, "") + " (edited).pdf";
  async function deliver(bytes, name){
    if (inPreview()) { const dl = caps.downloads || await useCap("downloads"); if (!dl) { toast("Downloads aren't available here"); return; } await dl.save({filename: name, data: bytes}); }
    else saveBlob(name, bytes, "application/pdf");
    toast(`Saved ${name}`);
  }
  // a digitally signed PDF: say so before changing it
  async function signedOk(){ return !E.signed || await askBox({title: "This PDF Is Digitally Signed", text: "Changing it will make its digital signature show as no longer valid in PDF apps. Keep the original if you need the signature to stay valid.", yes: "Change It Anyway", no: "Cancel"}); }
  const missingNote = rp => [rp.missingFonts ? "a font that isn't on this device was replaced by a similar one" : "", rp.missingImages ? "a picture that isn't on this device was left out" : "", rp.fieldsSkipped ? `${rp.fieldsSkipped} form field${rp.fieldsSkipped === 1 ? "" : "s"} couldn't be filled in` : ""].filter(Boolean).join("; ");
  let busy = false;
  async function download(){
    if (busy || !E) return; if (E.ed) commit();
    let marks = false;
    if (hasMarks()) {
      const ask = await askBox({title: "Download PDF", text: "Include your highlights and handwriting? They're added as standard PDF markup, so any PDF app shows them.", yes: "Include Them", no: "Leave Them Out"});
      marks = !!ask;
    }
    if (!mine().length && !marks) return;
    if (!(await signedOk())) return;
    busy = true; bar();
    const f = fileOf();
    try {
      toast("Making the PDF…");
      const r = await bake(marks); if (!r) return;
      await deliver(r.bytes, editedName(curRev(f).name || f.name));
      const note = missingNote(r.report); if (note) setTimeout(() => toast("Note: " + note + "."), 1800);
    } catch (err) { if (!(err && err.code === "declined")) toast((err && /load|locked/.test(err.message || "") && err.message) || "Couldn't make the edited PDF. Try again."); }
    finally { busy = false; if (E) bar(); }
  }
  async function saveVersion(){
    if (busy || !E) return; if (E.ed) commit();
    if (!(await signedOk())) return;
    busy = true;
    try {
      toast("Saving the edited PDF…");
      const r = await bake(false); if (!r) return;
      await storeVersion(r.bytes, {label: "saved with your edits", fallbackName: editedName(curRev(fileOf()).name || fileOf().name), report: r.report});
    } catch (err) { toast((err && /load|locked/.test(err.message || "") && err.message) || "Couldn't save the edited PDF. Your edits are still here."); }
    finally { busy = false; if (E) bar(); }
  }
  // A new version of the file: highlights and handwriting come along (to where their pages went); the edits are now in the file
  async function storeVersion(bytes, o){
    const S = E, f0 = fileOf(), page = (R() || {}).cur || 1;
    const assets = await getAssets().catch(() => null);
    if (!assets) { await deliver(bytes, o.fallbackName); toast("This device can't store files here, so the PDF was downloaded instead."); return; }
    const name = (curRev(f0).name || f0.name).replace(/\s*\(edited\)(?=\.pdf$)/i, "");
    let up;
    try { up = await assets.upload(new File([bytes], name, {type: "application/pdf"}), {type: "application/pdf", courseId: f0.courseId, folderId: f0.folderId}); }
    catch (err) { toast(err && err.code === "too_large" ? "The PDF is too large to store. It was downloaded instead." : err && err.code === "quota_or_state" ? "File storage is full. The PDF was downloaded instead." : "Couldn't store the PDF. It was downloaded instead."); await deliver(bytes, o.fallbackName); return; }
    try { if (bytes.length < 60e6) await idbSet("pdf:" + up.id, new Blob([bytes], {type: "application/pdf"})); } catch (e) {}
    const cur = state.files[S.fid]; if (!cur) return;
    const n = clone(cur), old = S.rev, map = o.map;
    n.revs = n.revs.concat(Object.assign({assetId: up.id, size: up.sizeBytes || bytes.length, type: "application/pdf", at: Date.now(), name}, up.localRel ? {localRel: up.localRel} : {}));
    const turn = (x, y, rot) => rot === 90 ? [1 - y, x] : rot === 180 ? [1 - x, 1 - y] : rot === 270 ? [y, 1 - x] : [x, y];
    const where = p => map ? map.get(p) : {p, rot: 0};
    if (Array.isArray(n.hl)) n.hl = n.hl.map(h => {
      if (!h || h.a !== old) return h; const to = where(h.p); if (!to) return h;
      const rot = ((to.rot % 360) + 360) % 360;
      return Object.assign({}, h, {a: up.id, p: to.p, r: rot ? h.r.map(([x, y, w, hh]) => { const a = turn(x, y, rot), b = turn(x + w, y + hh, rot); return [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1])]; }) : h.r});
    });
    if (Array.isArray(n.ink)) n.ink = n.ink.map(s => {
      if (!s || s.a !== old || !s.p) return s; const to = where(s.p); if (!to) return s;
      const rot = ((to.rot % 360) + 360) % 360, I = window.__sbInk;
      if (rot && !(I && I.decode && I.encode)) return s;
      return Object.assign({}, s, {a: up.id, p: to.p}, rot ? {d: I.encode(I.decode(s.d).map(([x, y, pr]) => turn(x, y, rot).concat([pr])))} : {});
    });
    const rest = editsOf(n).filter(e => e.a !== old); if (rest.length) n.pe = rest; else delete n.pe;
    n.updated = Date.now();
    applyChanges([{kind: "file", id: S.fid, after: n}], `${n.name}: Rev ${revLetter(n.revs.length - 1)} ${o.label}`);
    const note = o.report && missingNote(o.report); if (note) setTimeout(() => toast("Note: " + note + "."), 1800);
    E = null;
    if (P.openReader) { if (dlg.open) dlg.close(); setTimeout(() => P.openReader(S.fid, map && map.get(page) ? map.get(page).p : page), 0); }
  }

  /* Turning Edit on and off */
  function setOn(on){
    const S = session(); if (!S) return;
    if (!on && S.ed) commit();
    S.on = !!on; if (!on) { S.sel = null; S.place = null; closePanel(); }
    if (on) {
      const ink = $("#inkModeBtn"); if (ink && ink.getAttribute("aria-pressed") === "true") ink.click();
      try { getSelection().removeAllRanges(); } catch (e) {}
      const pop = dlg.querySelector(".pdr-pop"); if (pop) pop.remove();
      libDoc().then(v => { if (E !== S) return; if (v.doc.isEncrypted) { S.locked = true; bar(); return; } S.signed = pdeSigned(v.L, v.doc); probe(mine()); bar(); }).catch(err => toast(err.message));
      mine().forEach(e => { if (e.ff) fontReady(e.ff).then(() => repaint()); });
    }
    repaint(); bar();
  }
  hook("act", (act, el, id) => {
    if (!act.startsWith("pde-")) return false;
    const S = session(); if (!S) return true;
    switch (act) {
      case "pde-mode": setOn(!S.on); break;
      case "pde-tool":
        if (S.ed) commit(); S.place = null;
        if (id === "sign") { signPanel(); break; }
        if (id === "pages") { pagesPanel(); break; }
        S.tool = S.tool === id && id === "find" ? "text" : id; S.sel = null; repaint(); bar();
        if (S.tool === "find") setTimeout(() => { const q = $("#pdeFindQ"); if (q) q.focus(); }, 30);
        break;
      case "pde-size": { const e = selected(); if (e) restyle({fs: Math.max(2, Math.round((e.fs + (Number(id) || 1) * (e.fs >= 20 ? 2 : 0.5)) * 10) / 10)}); break; }
      case "pde-b": { const e = selected(); if (e) restyle({b: e.b ? 0 : 1}); break; }
      case "pde-i": { const e = selected(); if (e) restyle({i: e.i ? 0 : 1}); break; }
      case "pde-color": restyle({c: id}, "Text color changed"); break;
      // picks the kind of mark to make next
      case "pde-shape": S.shape = id; S.tool = "mark"; S.sel = null; repaint(); bar(); break;
      case "pde-scolor": { S.sc = id; const e = selected(); if (e && e.k === "s") restyle({c: id}); else bar(); break; }
      case "pde-al": restyle({al: id}, "Paragraph alignment changed"); break;
      case "pde-para": toParagraph(selected()); break;
      case "pde-del": if (S.sel) remove(S.sel); break;
      case "pde-dl": download(); break;
      case "pde-save": saveVersion(); break;
      case "pde-panel-close": closePanel(); break;
      case "pde-font-local": localFonts(); break;
      case "pde-font-pick": { const f = S.localFonts && S.localFonts[Number(id)]; if (f) f.blob().then(b => b.arrayBuffer()).then(buf => addFont(new Uint8Array(buf))).then(fid => { if (fid) { useFont(fid); fontsPanel(); } }); break; }
      case "pde-font-use": useFont(id).then(closePanel); break;
      case "pde-font-rm": removeFont(id).then(fontsPanel); break;
      case "pde-sig-tab": sigTab(id); break;
      case "pde-sig-color": SIG.color = id; dlg.querySelectorAll('[data-act="pde-sig-color"]').forEach(b => b.setAttribute("aria-pressed", String(b.dataset.id === id))); break;
      case "pde-sig-font": SIG.font = id; dlg.querySelectorAll(".pde-sigstyle").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.id === id))); break;
      case "pde-sig-clear": { const cv = $("#pdeSigPad"); if (cv) { cv.getContext("2d").clearRect(0, 0, cv.width, cv.height); SIG.drawn = false; } break; }
      case "pde-sig-use": sigUse(); break;
      case "pde-sig-pick": { const s = mySigs().find(x => x.id === id); if (s) placeNext(Object.assign({sig: true}, s)); break; }
      case "pde-sig-rm": lsSet(K_SIGS, mySigs().filter(x => x.id !== id)); idbDel("pdeimg:" + id).catch(() => {}); sigTab(mySigs().length ? "Saved" : "Draw"); break;
      case "pde-find-step": findStep(Number(id) || 1); break;
      case "pde-find-all": replaceAll(); break;
      case "pde-pg": {
        const [k, i0] = String(id).split(":"), i = Number(i0), pl = S.pp.plan;
        if (k === "L" && i > 0) [pl[i - 1], pl[i]] = [pl[i], pl[i - 1]];
        else if (k === "R" && i < pl.length - 1) [pl[i + 1], pl[i]] = [pl[i], pl[i + 1]];
        else if (k === "l" || k === "r") pl[i].rot = ((pl[i].rot + (k === "r" ? 90 : -90)) % 360 + 360) % 360;
        else if (k === "x" && pl.length > 1) { S.pp.pick.delete(pl[i].key); pl.splice(i, 1); }
        else if (k === "b") pl.splice(i + 1, 0, {blank: S.pp.size || [612, 792], rot: 0, key: "b:" + uid()});
        drawGrid(); break;
      }
      case "pde-pages-apply": pagesApply(); break;
      case "pde-pages-extract": pagesExtract(); break;
    }
    return true;
  });
  hook("changed", changes => { if (E && changes.some(c => c.kind === "file" && c.id === E.fid)) { if (E.sel && !mine().some(e => e.id === E.sel) && !(E.ed && E.ed.e.id === E.sel)) E.sel = null; repaint(); for (const n of E.pages.keys()) paintForm(n); bar(); } });

  SBPDE = window.SBPDE = {
    readerBtn: () => `<button type="button" class="btn small pde-mode" data-act="pde-mode" aria-pressed="false" id="pdeBtn">${ico(IC.edit)}Edit<b class="pdr-badge" hidden></b></button>`,
    // how to draw a page: with fillable fields, the fields are typed into on the page, so the picture leaves them out
    async renderOpts(page){ const S = session(); if (!S || !window.pdfjsLib) return {}; const anns = await annsOf(page); return anns.length ? {annotationMode: window.pdfjsLib.AnnotationMode.ENABLE_FORMS} : {}; },
    // a page was drawn: keep its text positions, and draw the edits and fields on it
    readerPage(n, el, page, vp){
      const S = session(); if (!S) return;
      const old = S.pages.get(n);
      if (old && S.ed && S.ed.e.p === n && old.vp.scale !== vp.scale) commit();
      S.pages.set(n, {n, el, page, vp});
      paint(n); paintForm(n);
      if (n === 1 || !S.barDone) { S.barDone = true; bar(); }
    },
    readerClose(){ if (E && E.ed) commit(); E = null; },
    active: () => !!(E && E.on),
    count: () => mine().length
  };
  Object.assign(window.__sbProStudy || {}, {pde: () => E, pdeEngine: {pdeBake, pdeProbe, pdeStrip, pdeLex, pdeBadChars, pdeReorg, pdeWrap, pdeFontRights}, caps, pdeFonts: {add: addFont, list: myFonts}});

  const css = document.createElement("style");
  css.textContent = `
.pde-mode{display:inline-flex;align-items:center;gap:6px}
.pde-mode[aria-pressed="true"]{background:var(--accent);border-color:var(--accent);color:var(--accent-ink,#fff)}
.pde-mode[aria-pressed="true"] .pdr-badge{background:var(--surface);color:var(--accent)}
.pde-bar{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:8px 16px;border-bottom:1px solid var(--line);background:color-mix(in srgb,var(--accent) 6%,var(--surface))}
.pde-bar svg{flex:none}
.pde-tools,.pde-fmt,.pde-size,.pde-cols,.pde-save{display:inline-flex;align-items:center;gap:4px}
.pde-fmt[hidden]{display:none}
.pde-tool{display:inline-flex;align-items:center;gap:6px}
.pde-tool[aria-pressed="true"]{background:var(--ink);border-color:var(--ink);color:var(--surface)}
.pde-fmt select{padding:5px 6px;min-height:32px}
.pde-size input{width:3.2em;text-align:center;padding:5px 2px}
.pde-b,.pde-i{font-size:1rem}
.pde-b[aria-pressed="true"],.pde-i[aria-pressed="true"]{background:color-mix(in srgb,var(--accent) 16%,var(--surface));border-color:var(--accent);color:var(--accent)}
.pde-col{width:24px;height:24px;border-radius:50%;border:2px solid rgba(0,0,0,.18);background:var(--c);padding:0;cursor:pointer;box-shadow:inset 0 0 0 2px var(--surface);position:relative;display:inline-block}
.pde-col[aria-pressed="true"]{outline:2px solid var(--ink);outline-offset:2px}
.pde-any{background:conic-gradient(#e53935,#fdd835,#43a047,#1e88e5,#8e24aa,#e53935)}
.pde-any input{position:absolute;inset:0;opacity:0;cursor:pointer;width:100%;height:100%;padding:0;border:0}
.pde-save .btn{display:inline-flex;align-items:center;gap:6px}
.pde-note{max-width:26em}
.pde-note.bad{color:var(--late,#c0262d)}
.pde-layer{position:absolute;inset:0;z-index:4;pointer-events:none;overflow:hidden}
.pde-on .pde-layer{pointer-events:auto}
.pde-on .textLayer{pointer-events:none}
.pde-on .ink-layer{pointer-events:none}
.pde-on[data-pde-tool="text"] .pde-layer{cursor:default}
.pde-on[data-pde-tool="text"] .pdr-page.pde-over .pde-layer{cursor:text}
.pde-on[data-pde-tool="add"] .pde-layer{cursor:crosshair}
.pde-on[data-pde-tool="white"] .pde-layer{cursor:crosshair;touch-action:none}
.pde-on .pde-e.sel.k-n,.pde-on .pde-e.sel.k-w{touch-action:none}
.pde-e{position:absolute;transform-origin:0 0;width:0;height:0}
.pde-cover{position:absolute;display:block}
.pde-t{position:absolute;left:0;white-space:pre;display:block;min-width:4px;outline:0;caret-color:var(--accent,#2563eb)}
.pde-on .pde-e:not(.editing){cursor:pointer}
.pde-on .pde-e.k-n.sel:not(.editing),.pde-on .pde-e.k-w.sel{cursor:move}
.pde-on .pde-e.k-t:not(.editing) .pde-t,.pde-on .pde-e.k-n:not(.editing) .pde-t{text-decoration:underline dotted color-mix(in srgb,var(--accent) 60%,transparent);text-underline-offset:3px}
.pde-on .pde-e.sel .pde-t,.pde-on .pde-e.k-w.sel .pde-cover,.pde-e.editing .pde-t{outline:2px solid var(--accent,#2563eb);outline-offset:2px;border-radius:2px}
.pde-on .pde-e.k-w .pde-cover{box-shadow:0 0 0 1px color-mix(in srgb,var(--accent) 45%,transparent)}
.pde-e.editing .pde-t{background:color-mix(in srgb,var(--accent) 7%,transparent)}
.pde-t.bad{outline-color:var(--late,#c0262d)!important}
.pde-hover{position:absolute;display:block;pointer-events:none;border:1.5px solid color-mix(in srgb,var(--accent) 70%,transparent);background:color-mix(in srgb,var(--accent) 8%,transparent);border-radius:3px}
.pde-band{position:absolute;display:block;pointer-events:none;border:1.5px dashed var(--accent);background:rgba(255,255,255,.6)}
.pde-hover[hidden],.pde-band[hidden]{display:none}
.pde-fmt{flex-wrap:wrap}
.pde-fmt select{min-width:8.5em}
.pde-sub{display:flex;align-items:center;gap:8px;flex-wrap:wrap;flex-basis:100%}
.pde-bar select{width:auto;max-width:14em;flex:none}
.pde-sub:not(:has(> :not([hidden]):not(.pde-note:empty))){display:none}
.pde-tools{flex-wrap:wrap}
.pde-tools label.pde-tool{cursor:pointer}
.pde-marks,.pde-al,.pde-find{display:inline-flex;align-items:center;gap:4px;flex-wrap:wrap}
.pde-shape-btn[aria-pressed="true"],.pde-al .btn[aria-pressed="true"]{background:color-mix(in srgb,var(--accent) 16%,var(--surface));border-color:var(--accent);color:var(--accent)}
.pde-find input[type=search],.pde-find input[type=text]{width:11em;padding:5px 8px}
.pde-chk{display:inline-flex;align-items:center;gap:6px;font-size:.88rem}
.pde-note.warn{color:var(--late,#c0262d);font-weight:600}
.pde-on[data-pde-tool="mark"] .pde-layer{cursor:crosshair;touch-action:none}
.pde-on[data-pde-tool="place"] .pde-layer{cursor:copy}
.pde-on .pde-e.sel.k-s,.pde-on .pde-e.sel.k-i{touch-action:none}
.pde-pic{position:absolute;display:block}
.pde-pic img{display:block;width:100%;height:100%;user-select:none;-webkit-user-drag:none}
.pde-pic .mini{display:grid;place-items:center;width:100%;height:100%;border:1px dashed var(--line);background:color-mix(in srgb,var(--soft) 70%,transparent)}
.pde-shape{position:absolute;display:block}
.pde-shape .pde-hit{fill:transparent;stroke:none;pointer-events:none}
.pde-on .pde-shape .pde-hit{pointer-events:all}
.pde-ln{position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none}
.pde-ln .pde-hit{stroke:transparent;stroke-width:16;fill:none;pointer-events:none}
.pde-on .pde-ln .pde-hit{pointer-events:stroke;cursor:pointer}
.pde-on .pde-ln.sel .pde-hit{cursor:move;stroke:color-mix(in srgb,var(--accent) 22%,transparent)}
.pde-end{fill:var(--surface);stroke:var(--accent,#2563eb);stroke-width:2;pointer-events:all;cursor:grab}
.pde-on .pde-e.k-s.sel .pde-shape,.pde-on .pde-e.k-i.sel .pde-pic{outline:2px solid var(--accent,#2563eb);outline-offset:3px}
.pde-grip{position:absolute;display:block;width:14px;height:14px;margin:-7px 0 0 -7px;border-radius:3px;background:var(--surface);border:2px solid var(--accent,#2563eb);cursor:nwse-resize;z-index:2;touch-action:none}
.pde-pt{position:absolute;left:0;white-space:pre-wrap;overflow-wrap:break-word;min-height:1em}
.pde-pl{white-space:pre}
.pde-pl.j{text-align:justify;text-align-last:justify;white-space:normal}
.pde-on .pde-e.k-p:not(.editing) .pde-pt{text-decoration:underline dotted color-mix(in srgb,var(--accent) 60%,transparent);text-underline-offset:3px}
.pde-band.round{border-radius:50%}
.pde-lnprev{position:absolute;inset:0;pointer-events:none;overflow:visible}
.pde-lnprev[hidden]{display:none}
.pde-lnprev path{stroke:var(--accent,#2563eb);stroke-width:2;stroke-dasharray:5 4;fill:none}
.pde-form{position:absolute;inset:0;z-index:5;pointer-events:none}
.pdr-page .pde-form .pde-field{position:absolute;box-sizing:border-box;margin:0;padding:0 3px;border:0;border-radius:2px;background:rgba(204,215,255,.45);color:#000;font-family:Helvetica,Arial,sans-serif;font-weight:400;pointer-events:auto;line-height:1.15;min-height:0;max-width:none;box-shadow:none;-webkit-appearance:none;appearance:none}
.pdr-page .pde-form textarea.pde-field{resize:none;padding:2px 3px}
.pdr-page .pde-form select.pde-field{padding:0 2px;-webkit-appearance:menulist;appearance:menulist}
.pdr-page .pde-form .pde-field[type=checkbox],.pdr-page .pde-form .pde-field[type=radio]{-webkit-appearance:auto;appearance:auto;accent-color:#1f3a93;padding:0;cursor:pointer;background:none}
.pdr-page .pde-form .pde-field:focus{outline:2px solid var(--accent,#2563eb);background:rgba(204,215,255,.7)}
.pde-panel{position:absolute;inset:0;z-index:50;background:color-mix(in srgb,var(--surface) 97%,transparent);display:flex;flex-direction:column;min-height:0}
.pde-ph{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding:14px 18px 8px;border-bottom:1px solid var(--line)}
.pde-ph h3{margin:0;font:600 1.05rem var(--display)}
.pde-ph p{margin:4px 0 0;max-width:46em}
.pde-pb{flex:1;min-height:0;overflow:auto;padding:14px 18px;display:grid;gap:12px;align-content:start}
.pde-pf{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:10px 18px;border-top:1px solid var(--line)}
.pde-pf .spacer{flex:1}
.pde-panel.sign,.pde-panel.fonts{inset:auto 0 auto 0;top:0;max-height:100%;box-shadow:0 10px 30px rgba(0,0,0,.18)}
.pde-fonts{list-style:none;margin:0;padding:0;display:grid;gap:6px}
.pde-fonts li{display:flex;align-items:center;gap:10px;padding:6px 10px;border:1px solid var(--line);border-radius:10px;background:var(--surface)}
.pde-fonts li > span:first-child{font-size:1.15rem}
.pde-local{max-height:260px;overflow:auto}
.pde-tabs{display:inline-flex;gap:4px;border-bottom:1px solid var(--line)}
.pde-tab{border:0;background:none;padding:8px 12px;font:600 .92rem var(--body);color:var(--muted);cursor:pointer;border-bottom:3px solid transparent}
.pde-tab[aria-selected="true"]{color:var(--ink);border-bottom-color:var(--accent)}
.pde-sigbox{display:grid;gap:10px}
.pde-pad{width:100%;max-width:520px;aspect-ratio:3/1;height:auto;border:1.5px dashed var(--line);border-radius:12px;background:#fff;touch-action:none;cursor:crosshair}
.pde-sigstyles{display:flex;flex-wrap:wrap;gap:8px}
.pde-sigstyle{min-width:140px;padding:8px 14px;border:1px solid var(--line);border-radius:12px;background:#fff;color:#14204a;font-size:1.7rem;cursor:pointer}
.pde-sigstyle[aria-pressed="true"]{outline:2px solid var(--accent);outline-offset:2px}
.pde-sigs{list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;gap:10px}
.pde-sigs li{display:flex;align-items:center;gap:4px}
.pde-sigpick{border:1px solid var(--line);border-radius:10px;background:#fff;padding:8px;cursor:pointer}
.pde-sigpick img{display:block;max-height:60px;max-width:220px}
.pde-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:14px}
.pde-card{display:grid;gap:4px;justify-items:center;padding:8px;border:1px solid var(--line);border-radius:12px;background:var(--surface)}
.pde-card.picked{outline:3px solid var(--accent);outline-offset:-1px}
.pde-thumb{display:grid;place-items:center;width:150px;height:150px;cursor:pointer}
.pde-thumb img{max-width:130px;max-height:130px;box-shadow:0 1px 4px rgba(0,0,0,.25);background:#fff;transition:transform .15s}
.pde-blank{display:block;width:100px;height:130px;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,.25)}
.pde-cardbar{display:flex;flex-wrap:wrap;justify-content:center;gap:2px}
.pde-cardbar .icon-btn{width:30px;height:30px}
.pde-pf select{max-width:16em}
@media (max-width:760px){ .pde-grid{grid-template-columns:repeat(auto-fill,minmax(130px,1fr))} .pde-thumb{width:120px;height:130px} .pde-find input[type=search],.pde-find input[type=text]{width:9em} }
@media (max-width:760px){
  .pde-bar{padding:6px 10px;gap:6px}
  .pde-tool{padding-inline:8px}
  .pde-tools{flex-wrap:nowrap;gap:2px}
  .pde-tools .pde-tool{padding:6px 8px;min-width:40px;justify-content:center}
  .pde-tools .pde-lbl,.pde-save [data-act="pde-dl"] .pde-lbl{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
  .pde-fmt{flex-basis:100%;gap:6px}
  .pde-fmt select{flex:1 1 8em}
  .pde-cols{gap:6px}
  .pde-note{order:9;flex-basis:100%}
  .pde-save{margin-left:auto}
}
@media (forced-colors:active){ .pde-hover,.pde-band{border-color:Highlight} }
`;
  document.head.appendChild(css);
})();
