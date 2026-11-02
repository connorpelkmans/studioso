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
  let gs = {ctm: [1, 0, 0, 1, 0, 0], Tc: 0, Tw: 0, Th: 1, TL: 0, Ts: 0, font: null, fs: 0};
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
          if (!I || lx < I.lx) info[hit] = {lx, font: f, fs, th, tc: gs.Tc, ts: gs.Ts, m: m.slice(), nat: I ? I.nat : 0, spaces: I ? I.spaces : 0, n: I ? I.n : 0};
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
// Whether an edit can be written in the font the PDF already used there (the same look), and the codes for it
function pdeKeepable(e, I){
  if (e.k !== "t" || e.keep === false || !I || !I.font || !I.font.ok || I.font.sub === "Type3" || !e.t || e.t.includes("\n")) return null;
  const codes = I.font.enc(e.t); return codes && codes.length ? codes : null;
}
// What the editor needs to know before saving: for each text edit on a page, whether it keeps the PDF's own font
function pdeProbe(L, doc, n, edits){
  const pg = pdePage(L, doc, n); if (!pg) return edits.map(() => null);
  const regs = edits.map(pdeRegion);
  try {
    const r = pdeStrip(pg.content, regs, pg.fontOf, true);
    return edits.map((e, k) => { const f = r.info[k] && r.info[k].font; return {keep: !!pdeKeepable(e, r.info[k]), font: f ? f.res : "", hits: r.hits[k], base: f ? f.base : "", serif: !!(f && f.serif), mono: !!(f && f.mono), bold: !!(f && f.bold), italic: !!(f && f.italic)}; });
  }
  catch (err) { return edits.map(() => null); }
}

/* Writing the edited PDF */
async function pdeBake(L, bytes, edits){
  const doc = await L.PDFDocument.load(bytes, {updateMetadata: false, ignoreEncryption: true});
  // an encrypted file's content can't be rewritten without its key: refuse, rather than write a broken file
  if (doc.isEncrypted) { const err = new Error("This PDF is locked (encrypted), so it can't be edited here."); err.code = "locked"; throw err; }
  const pages = doc.getPages(), fonts = {};
  const font = async k => fonts[k] || (fonts[k] = await doc.embedFont(L.StandardFonts[k]));
  const byPage = new Map();
  for (const e of edits) { if (!(e.p >= 1 && e.p <= pages.length)) continue; if (!byPage.has(e.p)) byPage.set(e.p, []); byPage.get(e.p).push(e); }
  const report = {removed: 0, covered: 0, kept: 0, swapped: 0};
  for (const [p, list] of byPage) {
    const pg = pdePage(L, doc, p), page = pg.page, node = pg.node;
    let content = pg.content;
    const repl = list.filter(e => e.k === "t" || e.k === "w"), regions = repl.map(pdeRegion);
    let hits = regions.map(() => 0), info = regions.map(() => null), wrapQ = ["q\n", "\nQ\n"];
    if (regions.length && content.length) {
      try { const r = pdeStrip(content, regions, pg.fontOf); content = r.bytes; hits = r.hits; info = r.info; wrapQ = ["q\n".repeat(1 + r.under), "\n" + "Q\n".repeat(r.open) + "Q\n"]; }
      catch (err) { /* left as it was: covered below */ }
    }
    content = concatU8([enc8(wrapQ[0]), content, enc8(wrapQ[1])]);
    // after the page: covers (white-outs, and text that couldn't be taken out), then the new words in the PDF's own fonts
    let over = "";
    repl.forEach((e, k) => {
      const need = e.k === "w" ? 1 : pdeCount(e.old);
      report.removed += hits[k];
      if (e.k === "w" || hits[k] < need) {
        if (e.k !== "w") report.covered++;
        const rg = regions[k], a = rg.r * Math.PI / 180, pad = e.k === "w" ? 0 : e.fs * 0.06;
        over += `q ${pdeRgbOp(e.bg || "#ffffff")} rg ${pdeFmt(Math.cos(a))} ${pdeFmt(Math.sin(a))} ${pdeFmt(-Math.sin(a))} ${pdeFmt(Math.cos(a))} ${pdeFmt(rg.o[0])} ${pdeFmt(rg.o[1])} cm ${pdeFmt(-pad)} ${pdeFmt(rg.y0)} ${pdeFmt(rg.w + pad * 2)} ${pdeFmt(rg.y1 - rg.y0)} re f Q\n`;
      }
    });
    const later = [];
    repl.forEach((e, k) => {
      if (e.k !== "t" || !e.t) return;
      const I = info[k], codes = pdeKeepable(e, I);
      if (!codes) { later.push(e); return; }
      // the same font, size and slant as the letters it replaces, starting where they started
      const f = I.font, step = f.two ? 2 : 1;
      let nat = 0, spaces = 0; const parts = [];
      for (let j = 0; j + step <= codes.length; j += step) { const c = step === 2 ? codes[j] * 256 + codes[j + 1] : codes[j]; nat += (f.w(c) * I.fs + I.tc) * I.th; if ((step === 1 && c === 32) || (f.uni && f.uni.get(c) === " ")) spaces++; }
      // a justified line (wider than its letters) stays as wide, by spreading the spaces
      const oldNat = I.nat, justified = I.spaces > 0 && e.w - oldNat > Math.max(0.5, e.w * 0.015);
      let extra = 0; if (justified && spaces && nat < e.w) { extra = (e.w - nat) / spaces; if (extra > I.fs * 0.8) extra = 0; }
      if (extra) {
        let run = [];
        for (let j = 0; j + step <= codes.length; j += step) {
          const c = step === 2 ? codes[j] * 256 + codes[j + 1] : codes[j]; for (let t = 0; t < step; t++) run.push(codes[j + t]);
          if ((step === 1 && c === 32) || (f.uni && f.uni.get(c) === " ")) { parts.push(pdeHex(Uint8Array.from(run)), pdeFmt(-extra * 1000 / (I.fs * I.th))); run = []; }
        }
        if (run.length) parts.push(pdeHex(Uint8Array.from(run)));
      } else parts.push(pdeHex(codes));
      const m = I.m;
      over += `q BT /${f.res} ${pdeFmt(I.fs)} Tf ${pdeFmt(I.th * 100)} Tz ${pdeFmt(I.tc)} Tc 0 Tw ${pdeFmt(I.ts)} Ts 0 Tr ${pdeRgbOp(e.c || "#000000")} rg ${m.map(pdeFmt).join(" ")} Tm [${parts.join(" ")}] TJ ET Q\n`;
      report.kept++;
    });
    list.forEach(e => { if (e.k === "n" && e.t) later.push(e); });
    const overRef = doc.context.register(doc.context.flateStream(enc8(over)));
    node.set(L.PDFName.of("Contents"), doc.context.obj([doc.context.register(doc.context.flateStream(content)), overRef]));
    // the rest in a standard font (new text boxes, and letters the PDF's font doesn't have)
    for (const e of later) {
      const f = await font(pdeFontKey(e)), a = (e.r || 0) * Math.PI / 180, lh = e.fs * 1.2;
      if (e.k === "t") report.swapped++;
      pdeTidy(e.t).split("\n").forEach((line, j) => {
        line = [...line].map(ch => pdeBadChars(ch).length ? "?" : ch).join("");
        if (!line) return;
        const x = e.o[0] + j * lh * Math.sin(a), y = e.o[1] - j * lh * Math.cos(a);
        page.drawText(line, {x, y, size: e.fs, font: f, color: pdeRgb(L, e.c || "#000000"), rotate: L.degrees(e.r || 0)});
      });
    }
  }
  const out = await doc.save({useObjectStreams: false});
  return {bytes: out, report};
}
const enc8 = s => new TextEncoder().encode(s);
function concatU8(list){ const out = new Uint8Array(list.reduce((t, x) => t + x.length, 0)); let p = 0; for (const x of list) { out.set(x, p); p += x.length; } return out; }
/*PDFEDIT-ENGINE-END*/
(() => {
  const P = typeof SBPRO !== "undefined" ? SBPRO : null; if (!P) return;
  const MAX_EDITS = 200, MAX_TEXT = 2000;
  const PDFLIB_URL = "vendor/pdflib/pdf-lib.min.js";
  const ico = d => `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const IC = {
    edit: '<path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17v3z"/><path d="M14 7l3 3"/>',
    text: '<path d="M5 6V5h14v1M12 5v14M9 19h6"/>', add: '<path d="M4 7V5h10v2M9 5v12M7 17h4"/><path d="M18 13v6M15 16h6"/>',
    white: '<rect x="4" y="6" width="16" height="12" rx="1.5"/><path d="M4 14l5-4 4 3 3-2 4 3"/>', trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    down: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>', save: '<path d="M5 4h11l3 3v13H5z"/><path d="M8 4v5h7V4M8 20v-6h8v6"/>'};
  const COLORS = [["#000000", "Black"], ["#1f3a93", "Dark blue"], ["#c0262d", "Red"], ["#1d7a3a", "Green"]];
  const FAM_CSS = {h: '"Helvetica Neue",Helvetica,Arial,"Liberation Sans",sans-serif', t: '"Times New Roman",Times,"Liberation Serif",serif', c: '"Courier New",Courier,"Liberation Mono",monospace'};

  let E = null; // the editing session: the file, its version, the tool, the edit picked, and each page's text
  const fileOf = () => E && state.files[E.fid];
  const editsOf = f => (Array.isArray(f && f.pe) ? f.pe : []).filter(e => e && e.id && e.p >= 1);
  const mine = () => E ? editsOf(fileOf()).filter(e => e.a === E.rev) : [];
  const R = () => P.reader && P.reader();
  function session(){
    const r = R(); if (!r) return null;
    if (E && E.fid === r.fid && E.rev === r.rev) return E;
    E = {fid: r.fid, rev: r.rev, on: false, tool: "text", sel: null, ed: null, pages: new Map(), probe: new Map(), lib: null, drag: null};
    return E;
  }

  /* pdf-lib, loaded the first time someone edits */
  let libReady = null;
  function loadLib(){
    if (window.PDFLib) return Promise.resolve(window.PDFLib);
    if (!libReady) libReady = new Promise((res, rej) => {
      const s = document.createElement("script"); s.src = PDFLIB_URL; s.async = true;
      s.onload = () => window.PDFLib ? res(window.PDFLib) : rej(new Error("pdf-lib didn't load"));
      s.onerror = () => { libReady = null; rej(new Error("Couldn't load the PDF editor. Check your connection and try again.")); };
      document.head.appendChild(s);
    });
    return libReady;
  }
  // The open file as pdf-lib sees it, to check which letters each of its fonts has
  function libDoc(){
    const S = E; if (!S) return Promise.reject(new Error("closed"));
    if (!S.lib) S.lib = (async () => { const L = await loadLib(), bytes = await P.readerBytes(); const v = {L, doc: await L.PDFDocument.load(bytes, {updateMetadata: false, ignoreEncryption: true})}; S.libv = v; return v; })();
    S.lib.catch(() => { if (S) S.lib = null; });
    return S.lib;
  }
  async function probe(list){
    const S = E; if (!S || !list.length) return;
    try {
      const {L, doc} = await libDoc(); if (E !== S) return;
      const byP = new Map(); list.forEach(e => { if (e.k === "t") { if (!byP.has(e.p)) byP.set(e.p, []); byP.get(e.p).push(e); } });
      for (const [p, es] of byP) pdeProbe(L, doc, p, es).forEach((r, k) => S.probe.set(es[k].id + ":" + es[k].t + ":" + (es[k].keep === false ? 0 : 1), r));
      repaint(); bar();
    } catch (err) { /* checked again when saving */ }
  }
  const probeOf = e => E && E.probe.get(e.id + ":" + e.t + ":" + (e.keep === false ? 0 : 1));

  /* Text on each page, with where it sits (in the PDF's own units) */
  async function pageInfo(n){
    const S = E, pg = S && S.pages.get(n); if (!pg) return null;
    if (!pg.items) pg.items = (async () => {
      const tc = await pg.page.getTextContent();
      return tc.items.filter(it => typeof it.str === "string" && it.str.trim() && Array.isArray(it.transform) && it.width > 0).map(it => {
        const tx = it.transform, fs = Math.hypot(tx[2], tx[3]) || Math.abs(tx[3]) || 10, st = tc.styles[it.fontName] || {};
        let obj = null; try { obj = pg.page.commonObjs.has(it.fontName) ? pg.page.commonObjs.get(it.fontName) : null; } catch (e) {}
        const name = String((obj && obj.name) || "").replace(/^[A-Z]{6}\+/, ""), fam = String(st.fontFamily || "");
        const mono = /courier|mono|consol|menlo/i.test(name) || fam === "monospace", serif = !mono && (fam === "serif" || /times|roman|serif|georgia|garamond|cambria|book|minion|palatino|baskerville/i.test(name)) && !/sans/i.test(name);
        const asc = Number.isFinite(st.ascent) && st.ascent > 0.5 ? Math.min(1.05, st.ascent) : 0.9, desc = Number.isFinite(st.descent) && st.descent < 0 ? Math.max(-0.35, st.descent) : -0.22;
        return {str: it.str, o: [tx[4], tx[5]], r: Math.round(Math.atan2(tx[1], tx[0]) * 180 / Math.PI * 100) / 100, w: it.width, fs, y0: desc * fs, y1: asc * fs,
          f: mono ? "c" : serif ? "t" : "h", b: /bold|black|heavy|semibold|demi/i.test(name) || !!(obj && obj.bold) ? 1 : 0, i: /italic|oblique/i.test(name) || !!(obj && obj.italic) ? 1 : 0,
          cf: cssName(name, mono ? "c" : serif ? "t" : "h")};
      });
    })();
    try { return await pg.items; } catch (e) { return []; }
  }
  // a font's name as CSS, with a look-alike after it ("TimesNewRomanPS-BoldMT" is "Times New Roman")
  const cssName = (base, f) => { const nm = String(base || "").split(/[-,+]/)[0].replace(/(PSMT|PS|MT)$/, "").replace(/([a-z])([A-Z])/g, "$1 $2").trim(); return (nm && /^[\w ]{2,40}$/.test(nm) ? `"${nm}",` : "") + (FAM_CSS[f] || FAM_CSS.h); };
  // Page units to screen pixels on a drawn page, and back
  const toVp = (pg, x, y) => pg.vp.convertToViewportPoint(x, y);
  const toPdf = (pg, x, y) => pg.vp.convertToPdfPoint(x, y);
  function frame(pg, o, r){
    const a = r * Math.PI / 180, [x0, y0] = toVp(pg, o[0], o[1]), [x1, y1] = toVp(pg, o[0] + Math.cos(a), o[1] + Math.sin(a));
    return {x: x0, y: y0, rot: Math.atan2(y1 - y0, x1 - x0), s: Math.hypot(x1 - x0, y1 - y0)};
  }
  // where the baseline sits in a line of a font, as a share of the font size (measured once per font)
  const BASE = new Map();
  function baseOf(css, lh){
    const k = css + "|" + lh; if (BASE.has(k)) return BASE.get(k);
    const box = document.createElement("div"); box.style.cssText = `position:absolute;visibility:hidden;left:-9999px;top:0;font:100px/${lh} ${css};white-space:nowrap`;
    box.innerHTML = 'Hg<span style="display:inline-block;width:1px;height:0;vertical-align:baseline"></span>';
    document.body.appendChild(box); const v = box.lastChild.offsetTop / 100; box.remove();
    const out = v > 0.3 && v < 1.6 ? v : 0.85 * lh; BASE.set(k, out); return out;
  }
  const cssFor = e => { const pr = e.k === "t" && e.keep !== false ? probeOf(e) : null; return pr && pr.keep && e.cf ? e.cf : FAM_CSS[e.f] || FAM_CSS.h; };

  /* Colors from the drawn page: the background around some text, and the text's own color */
  function sample(pg, box){
    const cv = pg.el.querySelector(".pdr-cv"); if (!cv) return {bg: "#ffffff", c: "#000000"};
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
  function editHtml(pg, e, editing){
    const f = frame(pg, e.o, e.r || 0), s = f.s, cls = `pde-e k-${e.k}${E.sel === e.id ? " sel" : ""}${editing ? " editing" : ""}`;
    const pos = `left:${f.x.toFixed(2)}px;top:${f.y.toFixed(2)}px;transform:rotate(${f.rot.toFixed(5)}rad)`;
    if (e.k === "w") return `<div class="${cls}" data-e="${esc(e.id)}" style="${pos}"><i class="pde-cover" style="left:0;top:${(-e.h * s).toFixed(2)}px;width:${(e.w * s).toFixed(2)}px;height:${(e.h * s).toFixed(2)}px;background:${esc(e.bg || "#fff")}"></i></div>`;
    const css = cssFor(e), lh = e.k === "n" ? 1.2 : 1, b = baseOf(css, lh) * e.fs * s, pad = e.fs * 0.06;
    const cover = e.k === "t" ? `<i class="pde-cover" style="left:${(-pad * s).toFixed(2)}px;top:${(-e.y1 * s).toFixed(2)}px;width:${((e.w + pad * 2) * s).toFixed(2)}px;height:${((e.y1 - e.y0) * s).toFixed(2)}px;background:${esc(e.bg || "#fff")}"></i>` : "";
    const txt = `<span class="pde-t"${editing ? ` contenteditable="${"plaintext-only"}" spellcheck="true" role="textbox" aria-label="${e.k === "t" ? "Edit text" : "New text"}"${e.k === "n" ? ' aria-multiline="true"' : ""}` : ""} style="top:${(-b).toFixed(2)}px;font:${e.i ? "italic " : ""}${e.b ? 700 : 400} ${(e.fs * s).toFixed(2)}px/${lh} ${esc(css)};color:${esc(e.c || "#000")}">${esc(e.t || "")}</span>`;
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
    const list = mine().filter(e => e.p === n && !(ed && ed.e.id === e.id));
    L.innerHTML = list.map(e => editHtml(pg, e, false)).join("") + (ed ? editHtml(pg, ed.e, true) : "") + '<i class="pde-hover" hidden></i><i class="pde-band" hidden></i>';
    if (ed) {
      const t = L.querySelector(".pde-e.editing .pde-t");
      if (t) { ed.el = t; wireEditor(t); if (had) { t.focus({preventScroll: true}); if (caret) setCaret(t, caret[0], caret[1]); } }
    }
  }
  const repaint = () => { if (E) for (const n of E.pages.keys()) paint(n); };

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
      else { const rr = document.createRange(); rr.selectNodeContents(t); if (e.k === "n" && !e.t) rr.collapse(false); sel.removeAllRanges(); sel.addRange(rr); }
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
    t.addEventListener("input", () => { const m = $("#pdeMsg"), bad = pdeBadChars(pdeTidy(textOf(t))); if (m) { m.textContent = bad.length ? `${bad.slice(0, 4).join(" ")} can't be saved in a PDF here. Use letters from English and Western European languages.` : ""; m.classList.toggle("bad", !!bad.length); } t.classList.toggle("bad", !!bad.length); });
    t.addEventListener("blur", () => setTimeout(() => { if (E && E.ed && E.ed.el === t && !(document.activeElement && document.activeElement.closest && document.activeElement.closest(".pde-bar,.pde-e.editing"))) commit(); }, 120));
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
    const bad = pdeBadChars(t);
    if (bad.length) { toast(`${bad.slice(0, 3).join(" ")} can't be saved in this PDF. Try other letters.`); if (ed.el) ed.el.focus(); return; }
    E.ed = null;
    const list = mine(), exists = list.some(x => x.id === e.id);
    if (e.k === "n" && !t.trim()) { if (exists) save(list.filter(x => x.id !== e.id), "Text box removed"); else paint(e.p); bar(); return; }
    if (e.k === "t" && !exists && t === e.old) { E.sel = null; paint(e.p); bar(); return; }
    if (exists && t === ed.was) { paint(e.p); bar(); return; }
    const next = Object.assign({}, e, {t, at: Date.now()});
    if (!exists && list.length >= MAX_EDITS) { toast(`A file can hold ${MAX_EDITS} edits. Save a new version to keep going.`); paint(e.p); return; }
    save(exists ? list.map(x => x.id === e.id ? next : x) : list.concat([next]), e.k === "t" ? (t ? "Text changed" : "Text removed") : "Text added");
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
    if (e.k === "t" && ("f" in patch || "b" in patch || "i" in patch || "fs" in patch) && !("keep" in patch)) patch.keep = false;
    if (E.ed && E.ed.e.id === e.id) {
      const el0 = E.ed.el; if (el0) E.ed.e.t = textOf(el0);
      Object.assign(E.ed.e, patch); paint(e.p);
      const el = E.ed.el; if (el && document.activeElement !== el) { el.focus({preventScroll: true}); setCaret(el, textOf(el).length, textOf(el).length); }
      bar(); probe([E.ed.e]); return;
    }
    const next = Object.assign({}, e, patch);
    save(mine().map(x => x.id === e.id ? next : x), label || "Text style changed"); probe([next]);
  }
  function remove(id){
    const e = mine().find(x => x.id === id);
    if (E.ed && E.ed.e.id === id) { cancel(); if (!e) return; }
    if (!e) return;
    E.sel = null; save(mine().filter(x => x.id !== id), e.k === "t" ? "Edit undone: the original text is back" : e.k === "w" ? "White-out removed" : "Text box removed");
  }

  /* Pointing at the page */
  async function itemAt(pg, x, y){
    const items = await pageInfo(pg.n), [px, py] = toPdf(pg, x, y);
    let best = null;
    for (const it of items) if (pdeInside(Object.assign({tol: it.fs * 0.15}, it), px, py)) { const area = it.w * (it.y1 - it.y0); if (!best || area < best.area) best = {it, area}; }
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
    if (E.tool !== "text" || ev.target.closest(".pde-e")) { showHover(pg, null); return; }
    const at = local(pg, ev), my = ++hoverT;
    itemAt(pg, at.x, at.y).then(it => { if (my === hoverT && E) { showHover(pg, it); pg.el.classList.toggle("pde-over", !!it); } });
  });
  document.addEventListener("pointerdown", ev => {
    if (!E || !E.on || ev.button > 0) return;
    const pg = pageOfEv(ev); if (!pg || ev.target.closest(".pde-e.editing")) return;
    const hitEl = ev.target.closest(".pde-e");
    // dragging a text box or white-out that's already picked moves it
    if (hitEl && hitEl.dataset.e === E.sel) {
      const e = mine().find(x => x.id === E.sel);
      if (e && (e.k === "n" || e.k === "w")) { ev.preventDefault(); E.drag = {kind: "move", pg, e, start: local(pg, ev), el: hitEl, moved: false}; hitEl.setPointerCapture && hitEl.setPointerCapture(ev.pointerId); return; }
    }
    if (E.tool === "white" && !hitEl && !E.locked) { ev.preventDefault(); const a = local(pg, ev); E.drag = {kind: "band", pg, start: a, cur: a}; return; }
  });
  document.addEventListener("pointermove", ev => {
    const d = E && E.drag; if (!d) return;
    const at = local(d.pg, ev);
    if (d.kind === "band") {
      d.cur = at; const L = layerOf(d.pg.n), b = L && L.querySelector(".pde-band"); if (!b) return;
      b.hidden = false; b.style.cssText = `left:${Math.min(at.x, d.start.x)}px;top:${Math.min(at.y, d.start.y)}px;width:${Math.abs(at.x - d.start.x)}px;height:${Math.abs(at.y - d.start.y)}px`;
    } else {
      const dx = at.x - d.start.x, dy = at.y - d.start.y; if (Math.hypot(dx, dy) > 3) d.moved = true;
      d.el.style.translate = `${dx}px ${dy}px`;
    }
  });
  document.addEventListener("pointerup", ev => {
    const d = E && E.drag; if (!d) return; E.drag = null;
    const at = local(d.pg, ev);
    if (d.kind === "band") {
      const L = layerOf(d.pg.n), b = L && L.querySelector(".pde-band"); if (b) b.hidden = true;
      const x0 = Math.min(at.x, d.start.x), y0 = Math.min(at.y, d.start.y), x1 = Math.max(at.x, d.start.x), y1 = Math.max(at.y, d.start.y);
      if (x1 - x0 < 4 || y1 - y0 < 4) return;
      // bottom-left, bottom-right and top-left corners, in page units (a rotated page turns them)
      const [ax, ay] = toPdf(d.pg, x0, y1), [bx, by] = toPdf(d.pg, x1, y1), [cx, cy] = toPdf(d.pg, x0, y0);
      const r = Math.round(Math.atan2(by - ay, bx - ax) * 180 / Math.PI * 100) / 100, w = Math.hypot(bx - ax, by - ay), h = Math.hypot(cx - ax, cy - ay);
      const col = sample(d.pg, {x: x0, y: y0, w: x1 - x0, h: y1 - y0});
      const list = mine(); if (list.length >= MAX_EDITS) { toast(`A file can hold ${MAX_EDITS} edits.`); return; }
      const e = {id: uid(), a: E.rev, p: d.pg.n, k: "w", o: [ax, ay], r, w, h, bg: col.bg, at: Date.now()};
      E.sel = e.id; save(list.concat([e]), "White-out added");
      E.justMade = Date.now();
      return;
    }
    d.el.style.translate = "";
    if (!d.moved) return;
    const [ox, oy] = toVp(d.pg, d.e.o[0], d.e.o[1]), [nx, ny] = toPdf(d.pg, ox + at.x - d.start.x, oy + at.y - d.start.y);
    save(mine().map(x => x.id === d.e.id ? Object.assign({}, x, {o: [nx, ny]}) : x), d.e.k === "w" ? "White-out moved" : "Text box moved");
    E.justMade = Date.now();
  });
  // a click picks an edit, starts changing the text under it, or adds a text box
  document.addEventListener("click", async ev => {
    if (!E || !E.on || (E.justMade && Date.now() - E.justMade < 250)) return;
    const pg = pageOfEv(ev); if (!pg) { return; }
    ev.stopPropagation();
    if (E.locked) { toast("This PDF is locked (encrypted), so it can't be edited here."); return; }
    if (ev.target.closest(".pde-e.editing")) return;
    const hitEl = ev.target.closest(".pde-e"), at = local(pg, ev);
    if (hitEl) {
      const e = mine().find(x => x.id === hitEl.dataset.e); if (!e) return;
      if (e.k === "w") { if (E.ed) commit(); E.sel = e.id; repaint(); bar(); return; }
      if (E.sel === e.id || ev.detail > 1) startEdit(e, {x: ev.clientX, y: ev.clientY});
      else { if (E.ed) commit(); E.sel = e.id; repaint(); bar(); }
      return;
    }
    if (E.ed) { commit(); if (E && E.ed) return; }
    if (E.tool === "white") { if (E.sel) { E.sel = null; repaint(); bar(); } return; }
    if (E.tool === "add") {
      const [x, y] = toPdf(pg, at.x, at.y), near = await nearest(pg, x, y), fs = near ? Math.round(near.fs * 10) / 10 : 12;
      const f0 = frame(pg, [x, y], 0), r = Math.round(-f0.rot * 180 / Math.PI * 100) / 100;
      const [bx, by] = toPdf(pg, at.x, at.y + fs * pg.vp.scale * 0.35);
      startEdit({id: uid(), a: E.rev, p: pg.n, k: "n", o: [bx, by], r, fs, f: near ? near.f : "h", b: 0, i: 0, c: "#000000", t: ""});
      return;
    }
    const it = await itemAt(pg, at.x, at.y);
    if (!it) { if (E.sel) { E.sel = null; repaint(); bar(); } else hint(); return; }
    const col = sample(pg, vpBox(pg, it));
    const e = {id: uid(), a: E.rev, p: pg.n, k: "t", o: it.o, r: it.r, w: it.w, y0: it.y0, y1: it.y1, fs: Math.round(it.fs * 100) / 100, s0: Math.round(it.fs * 100) / 100, f: it.f, b: it.b, i: it.i, c: col.c, bg: col.bg, old: it.str, t: it.str, cf: it.cf};
    // the PDF's own font name and style, when pdf-lib has the file open already
    if (E.libv) { try { const pr = pdeProbe(E.libv.L, E.libv.doc, pg.n, [e])[0]; if (pr && pr.base) { e.f = pr.mono ? "c" : pr.serif ? "t" : "h"; e.b = pr.bold ? 1 : 0; e.i = pr.italic ? 1 : 0; e.cf = cssName(pr.base, e.f); } } catch (err) {} }
    startEdit(e, {x: ev.clientX, y: ev.clientY});
    probe([E.ed.e]);
  }, true);
  let hinted = 0;
  const hint = () => { if (Date.now() - hinted < 4000) return; hinted = Date.now(); toast("Click a line of text to change it, or pick Add Text or White-Out"); };
  // Delete removes the picked edit; Escape lets go of it; Ctrl+Z undoes (the app's own Ctrl+Z is off while a sheet is open)
  document.addEventListener("keydown", ev => {
    if (!E || !E.on || E.ed) return;
    const t = ev.target; if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    if ((ev.ctrlKey || ev.metaKey) && !ev.shiftKey && !ev.altKey && String(ev.key).toLowerCase() === "z") { ev.preventDefault(); ev.stopPropagation(); undoLast(); return; }
    if ((ev.key === "Delete" || ev.key === "Backspace") && E.sel) { ev.preventDefault(); remove(E.sel); }
    else if (ev.key === "Escape" && E.sel) { ev.preventDefault(); ev.stopPropagation(); E.sel = null; repaint(); bar(); }
    else if (ev.key === "Enter" && E.sel) { const e = mine().find(x => x.id === E.sel); if (e && e.k !== "w") { ev.preventDefault(); startEdit(e); } }
  }, true);
  dlg.addEventListener("cancel", ev => { if (E && E.on && (E.ed || E.sel)) ev.preventDefault(); });

  /* The edit bar */
  function barHtml(){
    const e = selected(), n = mine().length, pr = e && e.k === "t" ? probeOf(e) : null, txt = e && e.k !== "w";
    const fam = e ? (e.k === "t" && e.keep !== false ? "o" : e.f || "h") : "";
    const tool = (k, label, icon) => `<button type="button" class="btn small pde-tool" data-act="pde-tool" data-id="${k}" aria-pressed="${E.tool === k}">${ico(icon)}${label}</button>`;
    return `<span class="pde-tools" role="group" aria-label="Edit tools">${tool("text", "Edit Text", IC.text)}${tool("add", "Add Text", IC.add)}${tool("white", "White-Out", IC.white)}</span>
      <span class="pde-fmt" role="group" aria-label="Text style"${txt ? "" : " hidden"}>
        <select id="pdeFam" aria-label="Font">${e && e.k === "t" ? `<option value="o"${fam === "o" ? " selected" : ""}>Original Font</option>` : ""}<option value="h"${fam === "h" ? " selected" : ""}>Sans</option><option value="t"${fam === "t" ? " selected" : ""}>Serif</option><option value="c"${fam === "c" ? " selected" : ""}>Mono</option></select>
        <span class="pde-size"><button type="button" class="icon-btn" data-act="pde-size" data-id="-1" aria-label="Smaller text">${ico('<path d="M5 12h14"/>')}</button><input id="pdeSize" type="text" inputmode="decimal" value="${e && e.fs ? Math.round(e.fs * 10) / 10 : ""}" aria-label="Text size in points"><button type="button" class="icon-btn" data-act="pde-size" data-id="1" aria-label="Bigger text">${ico('<path d="M12 5v14M5 12h14"/>')}</button></span>
        <button type="button" class="icon-btn pde-b" data-act="pde-b" aria-pressed="${!!(e && e.b)}" aria-label="Bold"><b>B</b></button><button type="button" class="icon-btn pde-i" data-act="pde-i" aria-pressed="${!!(e && e.i)}" aria-label="Italic"><i>I</i></button>
        <span class="pde-cols">${COLORS.map(([hex, name]) => `<button type="button" class="pde-col" data-act="pde-color" data-id="${hex}" style="--c:${hex}" aria-label="${name}" aria-pressed="${!!(e && (e.c || "").toLowerCase() === hex)}"></button>`).join("")}<label class="pde-col pde-any" style="--c:${esc((e && e.c) || "#000000")}" title="Any color"><span class="sr">Any color</span><input type="color" id="pdeColor" value="${esc((e && /^#[0-9a-f]{6}$/i.test(e.c || "") && e.c) || "#000000")}"></label></span></span>
      ${e ? `<button type="button" class="icon-btn pde-del" data-act="pde-del" aria-label="${e.k === "t" ? "Undo this edit" : "Remove"}" title="${e.k === "t" ? "Put the original text back" : "Remove"}">${ico(IC.trash)}</button>` : ""}
      <span class="spacer"></span>
      <span class="mini pde-note" id="pdeMsg" aria-live="polite">${E.locked ? "This PDF is locked (encrypted), so it can't be edited here." : e && e.k === "t" && pr ? (pr.keep ? "Same font as the PDF" : "A similar font: this PDF's font doesn't have every letter here") : !n ? "Click any text to change it" : ""}</span>
      <span class="pde-save"><button type="button" class="btn small" data-act="pde-dl"${n ? "" : " disabled"}>${ico(IC.down)}Download PDF</button><button type="button" class="btn small primary" data-act="pde-save"${n ? "" : " disabled"}>${ico(IC.save)}Save${n ? ` ${n} Edit${n === 1 ? "" : "s"}` : ""}</button></span>`;
  }
  function bar(){
    const sheet = dlg.querySelector(".pdr-sheet"); if (!sheet || !E) return;
    let b = sheet.querySelector(".pde-bar");
    const btn = $("#pdeBtn"); if (btn) { btn.setAttribute("aria-pressed", String(E.on)); const c = btn.querySelector("b"); const n = mine().length; if (c) { c.textContent = n ? String(n) : ""; c.hidden = !n; } }
    const pages = $("#pdrPages"); if (pages) { pages.classList.toggle("pde-on", E.on); pages.dataset.pdeTool = E.tool; }
    if (!E.on) { if (b) b.remove(); return; }
    const focusId = document.activeElement && b && b.contains(document.activeElement) ? document.activeElement.id || document.activeElement.dataset.act + (document.activeElement.dataset.id || "") : "";
    if (!b) { b = document.createElement("div"); b.className = "pde-bar"; b.setAttribute("role", "toolbar"); b.setAttribute("aria-label", "Edit PDF"); sheet.querySelector(".pdr-bar").after(b); }
    b.innerHTML = barHtml();
    if (focusId) { const el = b.querySelector("#" + focusId) || [...b.querySelectorAll("[data-act]")].find(x => x.dataset.act + (x.dataset.id || "") === focusId); if (el) el.focus(); }
  }
  document.addEventListener("change", ev => {
    if (!E || !E.on || !ev.target.closest || !ev.target.closest(".pde-bar")) return;
    const id = ev.target.id, e = selected(); if (!e) return;
    if (id === "pdeFam") { const v = ev.target.value; restyle(v === "o" ? {keep: true, f: e.f, fs: e.s0 || e.fs, b: e.b, i: e.i} : {f: v}); }
    else if (id === "pdeSize") { const v = parseFloat(ev.target.value); if (v >= 2 && v <= 400) restyle({fs: Math.round(v * 10) / 10}); else bar(); }
    else if (id === "pdeColor") restyle({c: ev.target.value.toLowerCase()}, "Text color changed");
  });
  // keeps a click on the bar from ending the text being typed
  document.addEventListener("pointerdown", ev => { if (E && E.ed && ev.target.closest && ev.target.closest(".pde-bar") && !ev.target.closest("select,input")) ev.preventDefault(); }, true);

  /* Saving */
  async function bake(){
    const f = fileOf(), list = mine(); if (!f || !list.length) return null;
    const L = await loadLib(), bytes = await P.readerBytes();
    return pdeBake(L, bytes, list.map(e => Object.assign({}, e)));
  }
  const editedName = name => name.replace(/(\.pdf)?$/i, "") .replace(/\s*\(edited\)$/i, "") + " (edited).pdf";
  let busy = false;
  async function download(){
    if (busy || !E) return; if (E.ed) commit(); busy = true; bar();
    const f = fileOf();
    try {
      toast("Making the PDF…");
      const r = await bake(); if (!r) return;
      const name = editedName(curRev(f).name || f.name);
      if (inPreview()) { const dl = caps.downloads || await useCap("downloads"); if (!dl) { toast("Downloads aren't available here"); return; } await dl.save({filename: name, data: r.bytes}); }
      else saveBlob(name, r.bytes, "application/pdf");
      toast(`Saved ${name}`);
    } catch (err) { if (!(err && err.code === "declined")) toast((err && /load/.test(err.message || "") && err.message) || "Couldn't make the edited PDF. Try again."); }
    finally { busy = false; bar(); }
  }
  async function saveVersion(){
    if (busy || !E) return; if (E.ed) commit(); busy = true;
    const S = E, f0 = fileOf(), page = (R() || {}).cur || 1;
    try {
      toast("Saving the edited PDF…");
      const r = await bake(); if (!r || E !== S) return;
      const assets = await getAssets(); if (!assets) { toast("This device can't store files here. Use Download PDF instead."); return; }
      const name = editedName(curRev(f0).name || f0.name).replace(/ \(edited\)\.pdf$/, ".pdf");
      const up = await assets.upload(new File([r.bytes], name, {type: "application/pdf"}), {type: "application/pdf", courseId: f0.courseId, folderId: f0.folderId});
      try { if (r.bytes.length < 60e6) await idbSet("pdf:" + up.id, new Blob([r.bytes], {type: "application/pdf"})); } catch (e) {}
      const cur = state.files[S.fid]; if (!cur) return;
      const n = clone(cur), old = S.rev;
      n.revs = n.revs.concat(Object.assign({assetId: up.id, size: up.sizeBytes || r.bytes.length, type: "application/pdf", at: Date.now(), name}, up.localRel ? {localRel: up.localRel} : {}));
      // highlights and handwriting come along to the new version (the pages are the same); the edits are now in the file itself
      if (Array.isArray(n.hl)) n.hl = n.hl.map(h => h && h.a === old ? Object.assign({}, h, {a: up.id}) : h);
      if (Array.isArray(n.ink)) n.ink = n.ink.map(s => s && s.a === old ? Object.assign({}, s, {a: up.id}) : s);
      const rest = editsOf(n).filter(e => e.a !== old); if (rest.length) n.pe = rest; else delete n.pe;
      n.updated = Date.now();
      applyChanges([{kind: "file", id: S.fid, after: n}], `${n.name}: Rev ${revLetter(n.revs.length - 1)} saved with your edits`);
      E = null;
      if (P.openReader) { if (dlg.open) dlg.close(); setTimeout(() => P.openReader(S.fid, page), 0); }
    } catch (err) {
      toast(err && err.code === "too_large" ? "The edited file is too large to store. Use Download PDF instead." : err && err.code === "quota_or_state" ? "File storage is full. Use Download PDF instead." : (err && /load/.test(err.message || "") && err.message) || "Couldn't save the edited PDF. Your edits are still here.");
    } finally { busy = false; if (E) bar(); }
  }

  /* Turning Edit on and off */
  function setOn(on){
    const S = session(); if (!S) return;
    if (!on && S.ed) commit();
    S.on = !!on; if (!on) S.sel = null;
    if (on) {
      const ink = $("#inkModeBtn"); if (ink && ink.getAttribute("aria-pressed") === "true") ink.click();
      try { getSelection().removeAllRanges(); } catch (e) {}
      const pop = dlg.querySelector(".pdr-pop"); if (pop) pop.remove();
      libDoc().then(v => { if (E === S && v.doc.isEncrypted) { S.locked = true; bar(); } else probe(mine()); }).catch(err => toast(err.message));
    }
    repaint(); bar();
  }
  hook("act", (act, el, id) => {
    if (!act.startsWith("pde-")) return false;
    const S = session(); if (!S) return true;
    switch (act) {
      case "pde-mode": setOn(!S.on); break;
      case "pde-tool": if (S.ed) commit(); S.tool = id; S.sel = null; repaint(); bar(); break;
      case "pde-size": { const e = selected(); if (e) restyle({fs: Math.max(2, Math.round((e.fs + (Number(id) || 1) * (e.fs >= 20 ? 2 : 0.5)) * 10) / 10)}); break; }
      case "pde-b": { const e = selected(); if (e) restyle({b: e.b ? 0 : 1}); break; }
      case "pde-i": { const e = selected(); if (e) restyle({i: e.i ? 0 : 1}); break; }
      case "pde-color": restyle({c: id}, "Text color changed"); break;
      case "pde-del": if (S.sel) remove(S.sel); break;
      case "pde-dl": download(); break;
      case "pde-save": saveVersion(); break;
    }
    return true;
  });
  hook("changed", changes => { if (E && changes.some(c => c.kind === "file" && c.id === E.fid)) { if (E.sel && !mine().some(e => e.id === E.sel) && !(E.ed && E.ed.e.id === E.sel)) E.sel = null; repaint(); bar(); } });

  SBPDE = window.SBPDE = {
    readerBtn: () => `<button type="button" class="btn small pde-mode" data-act="pde-mode" aria-pressed="false" id="pdeBtn">${ico(IC.edit)}Edit<b class="pdr-badge" hidden></b></button>`,
    // a page was drawn: keep its text positions, and draw the edits on it
    readerPage(n, el, page, vp){
      const S = session(); if (!S) return;
      const old = S.pages.get(n);
      if (old && S.ed && S.ed.e.p === n && old.vp.scale !== vp.scale) commit();
      S.pages.set(n, {n, el, page, vp, items: old && old.page === page ? old.items : null});
      paint(n);
      if (n === 1 || !S.barDone) { S.barDone = true; bar(); }
    },
    readerDrop(n){ if (E) { const pg = E.pages.get(n); if (pg) pg.el.querySelectorAll(".pde-layer").forEach(x => x.remove()); } },
    readerClose(){ if (E && E.ed) commit(); E = null; },
    active: () => !!(E && E.on),
    count: () => mine().length
  };
  Object.assign(window.__sbProStudy || {}, {pde: () => E, pdeEngine: {pdeBake, pdeProbe, pdeStrip, pdeLex, pdeBadChars}, caps});

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
@media (max-width:760px){
  .pde-bar{padding:6px 10px;gap:6px}
  .pde-tool{padding-inline:8px}
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
