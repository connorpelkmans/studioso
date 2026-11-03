/* ===== module: 01-office.js: Word, PowerPoint and Excel files shown as pages (no outside library) ===== */
// OFFICE.render(bytes, name, opts) reads a .docx, .pptx, .xlsx or .csv file and returns fixed-size pages of
// selectable HTML. Everything that comes from the file is escaped; style values are built here from checked
// numbers, six-digit colours and allowlisted or cleaned font names. Parsing makes plain strings (no DOM);
// only Word pages are measured in the document to split them into pages.
const OFFICE = (() => {
  const EMU = 9525, TW = 15;                       // EMU per px, twips per px
  const XML_MAX = 48 * 1024 * 1024, NODE_MAX = 3000000, BUDGET = 160 * 1024 * 1024;
  const MAX_PAGES = 500, MAX_SHAPES = 400, MAX_BLOCKS = 40000, MAX_HTML = 40 * 1024 * 1024, MAX_TEXT = 3000000;
  const XL_ROWS = 2000, XL_COLS = 60, XL_CELLS = 300000, MAX_IMGS = 600;
  const err = (code, message) => Object.assign(new Error(message), {code, office: true});
  const num = (v, d) => { const n = Number(v); return v != null && v !== "" && Number.isFinite(n) ? n : (d === undefined ? 0 : d); };
  const clamp = (n, a, b) => Math.min(b, Math.max(a, Number.isFinite(n) ? n : a));
  const R = n => Math.round(clamp(n, -1e6, 1e6) * 100) / 100;
  const qa = s => String(s).replace(/[&<>"]/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"}[c]));
  const hex6 = v => typeof v === "string" && /^[0-9A-Fa-f]{6}$/.test(v) ? v.toUpperCase() : null;
  const put = (dst, src) => { if (src) for (const k in src) if (src[k] !== undefined) dst[k] = src[k]; return dst; };

  /* ---------- what kind of file ---------- */
  const EXT = {docx: "docx", docm: "docx", dotx: "docx", dotm: "docx", pptx: "pptx", pptm: "pptx", potx: "pptx", potm: "pptx", ppsx: "pptx", ppsm: "pptx",
    xlsx: "xlsx", xlsm: "xlsx", xltx: "xlsx", xltm: "xlsx", csv: "csv", tsv: "csv",
    doc: "legacy", dot: "legacy", ppt: "legacy", pps: "legacy", pot: "legacy", xls: "legacy", xlt: "legacy", xlsb: "legacy", odt: "legacy", odp: "legacy", ods: "legacy",
    pages: "legacy", key: "legacy", numbers: "legacy", rtf: "legacy", wps: "legacy", wpd: "legacy"};
  function kindOf(name, type){
    const ext = (String(name || "").toLowerCase().match(/\.([a-z0-9]{1,8})$/) || [])[1];
    if (ext && EXT[ext]) return EXT[ext];
    const t = String(type || "").toLowerCase().split(";")[0].trim();
    if (!t) return "";
    if (t.includes("officedocument.wordprocessingml") || t.includes("ms-word.document.macroenabled") || t.includes("ms-word.template")) return "docx";
    if (t.includes("officedocument.presentationml") || t.includes("ms-powerpoint.presentation.macroenabled") || t.includes("ms-powerpoint.slideshow")) return "pptx";
    if (t.includes("officedocument.spreadsheetml") || t.includes("ms-excel.sheet.macroenabled") || t.includes("ms-excel.template")) return "xlsx";
    if (/^(text\/csv|text\/comma-separated-values|application\/csv|text\/tab-separated-values|text\/x-csv)$/.test(t)) return "csv";
    if (/^(application\/(msword|vnd\.ms-word|vnd\.ms-powerpoint|vnd\.ms-excel|mspowerpoint|powerpoint|excel|x-msexcel|rtf|x-rtf|vnd\.wordperfect)|text\/rtf)$/.test(t) || t.startsWith("application/vnd.oasis.opendocument.") || t.startsWith("application/vnd.apple.") || t.startsWith("application/x-iwork")) return "legacy";
    return "";
  }

  /* ---------- a small XML reader (no entities beyond the five standard ones, no DTDs) ---------- */
  const NS = {
    "http://schemas.openxmlformats.org/wordprocessingml/2006/main": "w", "http://purl.oclc.org/ooxml/wordprocessingml/main": "w",
    "http://schemas.openxmlformats.org/drawingml/2006/main": "a", "http://purl.oclc.org/ooxml/drawingml/main": "a",
    "http://schemas.openxmlformats.org/presentationml/2006/main": "p", "http://purl.oclc.org/ooxml/presentationml/main": "p",
    "http://schemas.openxmlformats.org/officeDocument/2006/relationships": "r", "http://purl.oclc.org/ooxml/officeDocument/relationships": "r",
    "http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing": "wp", "http://purl.oclc.org/ooxml/drawingml/wordprocessingDrawing": "wp",
    "http://schemas.openxmlformats.org/drawingml/2006/picture": "pic", "http://purl.oclc.org/ooxml/drawingml/picture": "pic",
    "http://schemas.openxmlformats.org/spreadsheetml/2006/main": "", "http://purl.oclc.org/ooxml/spreadsheetml/main": "",
    "http://schemas.openxmlformats.org/package/2006/relationships": "", "http://schemas.openxmlformats.org/package/2006/content-types": "",
    "http://schemas.openxmlformats.org/markup-compatibility/2006": "mc", "http://schemas.microsoft.com/office/drawing/2008/diagram": "dsp",
    "http://schemas.openxmlformats.org/drawingml/2006/diagram": "dgm", "urn:schemas-microsoft-com:vml": "v",
    "http://schemas.microsoft.com/office/word/2010/wordprocessingShape": "wps", "http://schemas.openxmlformats.org/officeDocument/2006/math": "m",
  };
  const CTRL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]/g;
  const ENT = {lt: "<", gt: ">", amp: "&", quot: '"', apos: "'"};
  const decode = s => (s.indexOf("&") < 0 ? s : s.replace(/&(#x[0-9a-fA-F]{1,6}|#\d{1,7}|[A-Za-z][A-Za-z0-9]{0,30});/g, (m, e) => {
    if (e[0] !== "#") return ENT[e] !== undefined ? ENT[e] : "";
    const c = e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : Number(e.slice(1));
    return c > 0 && c <= 0x10FFFF && !(c >= 0xD800 && c <= 0xDFFF) ? String.fromCodePoint(c) : "";
  })).replace(CTRL, "");
  const KEEPWS = /(^|:)(t|v|instrText|delText)$/;
  const TAG = /<(\/?)([A-Za-z_][\w.:-]*)((?:\s+[A-Za-z_][\w.:-]*\s*=\s*(?:"[^"]*"|'[^']*'))*)\s*(\/?)>/y;
  const ATTR = /([A-Za-z_][\w.:-]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
  function parseXml(src, remap){
    src = String(src || "");
    if (src.length > XML_MAX) throw err("big", "Part of this file is far bigger than a normal document.");
    const root = {n: "#root", a: {}, c: []}, stack = [root], L = src.length;
    let cur = root, i = 0, rn = null, count = 0;
    while (i < L) {
      const lt = src.indexOf("<", i), end = lt < 0 ? L : lt;
      if (end > i && cur !== root) { const raw = src.slice(i, end); if (KEEPWS.test(cur.n) || /\S/.test(raw)) cur.c.push(decode(raw)); }
      if (lt < 0) break;
      const c1 = src.charCodeAt(lt + 1);
      if (c1 === 33) { // <!
        if (src.startsWith("<!--", lt)) { const e = src.indexOf("-->", lt + 4); i = e < 0 ? L : e + 3; continue; }
        if (src.startsWith("<![CDATA[", lt)) { const e = src.indexOf("]]>", lt + 9); if (cur !== root) cur.c.push(src.slice(lt + 9, e < 0 ? L : e).replace(CTRL, "")); i = e < 0 ? L : e + 3; continue; }
        const g = src.indexOf(">", lt), b = src.indexOf("[", lt);
        if (b >= 0 && (g < 0 || b < g)) { const e = src.indexOf("]>", b); i = e < 0 ? L : e + 2; } else i = g < 0 ? L : g + 1;
        continue;
      }
      if (c1 === 63) { const e = src.indexOf("?>", lt + 2); i = e < 0 ? L : e + 2; continue; }
      TAG.lastIndex = lt;
      const m = TAG.exec(src);
      if (!m) { i = lt + 1; continue; }
      i = TAG.lastIndex;
      if (m[1]) {
        const name = rn ? rn(m[2]) : m[2];
        for (let k = stack.length - 1; k > 0; k--) if (stack[k].n === name) { stack.length = k; cur = stack[k - 1]; break; }
        continue;
      }
      if (++count > NODE_MAX) throw err("big", "This file is far bigger than a normal document.");
      const a = {};
      if (m[3]) { ATTR.lastIndex = 0; let x; while ((x = ATTR.exec(m[3]))) a[x[1]] = decode(x[2] !== undefined ? x[2] : x[3]); }
      if (!rn) rn = renamer(a, remap);
      const el = {n: rn(m[2]), a, c: []};
      if (rn.on) for (const k of Object.keys(a)) if (k.indexOf(":") > 0 && !k.startsWith("xmlns")) { const k2 = rn(k); if (k2 !== k) { a[k2] = a[k]; delete a[k]; } }
      cur.c.push(el);
      if (!m[4]) { stack.push(el); cur = el; }
    }
    return root.c.find(x => typeof x === "object") || null;
  }
  // Maps the file's namespace prefixes to the usual ones (w:, a:, p:, r: ...)
  function renamer(a, remap){
    const map = {}; let on = false;
    for (const k in a) if (k === "xmlns" || k.startsWith("xmlns:")) {
      const pre = k === "xmlns" ? "" : k.slice(6); let c = NS[a[k]];
      if (c === undefined) continue;
      if (remap && remap[c] !== undefined) c = remap[c];
      map[pre] = c; if (pre !== c) on = true;
    }
    const f = !on ? n => n : n => {
      const i = n.indexOf(":"), pre = i < 0 ? "" : n.slice(0, i);
      if (!(pre in map) || map[pre] === pre) return n;
      const loc = i < 0 ? n : n.slice(i + 1);
      return map[pre] ? map[pre] + ":" + loc : loc;
    };
    f.on = on; return f;
  }
  const isEl = x => x !== null && typeof x === "object";
  const kid = (e, n) => { if (!e) return null; for (const c of e.c) if (c.n === n) return c; return null; };
  const kids = (e, n) => e ? e.c.filter(c => c.n === n) : [];
  const path = (e, ...ns) => { for (const n of ns) { e = kid(e, n); if (!e) return null; } return e; };
  const at = (e, n) => e && e.a[n] !== undefined ? e.a[n] : null;
  const ln = n => n.slice(n.indexOf(":") + 1);
  function find(e, n){ if (!e) return null; for (const c of e.c) if (isEl(c)) { if (c.n === n) return c; const r = find(c, n); if (r) return r; } return null; }
  function findAll(e, n, out){ out = out || []; if (e) for (const c of e.c) if (isEl(c)) { if (c.n === n) out.push(c); else findAll(c, n, out); } return out; }
  function textOf(e){ if (!e) return ""; let s = ""; for (const c of e.c) s += typeof c === "string" ? c : textOf(c); return s; }
  // Children, with markup-compatibility blocks opened (their first choice, else the fallback)
  function flat(e){
    const out = [];
    if (e) for (const c of e.c) {
      if (!isEl(c)) continue;
      if (c.n === "mc:AlternateContent") out.push(...flat(kid(c, "mc:Choice") || kid(c, "mc:Fallback")));
      else out.push(c);
    }
    return out;
  }
  const on = (e, attr) => !e ? undefined : !/^(0|false|off|none)$/i.test(at(e, attr) == null ? "1" : at(e, attr));

  /* ---------- the zip, read a part at a time within a total budget ---------- */
  async function openZip(u8){
    if (u8.byteLength > ZIP_MAX_IN) throw err("big", "That file is too big to show here. Export it as a PDF instead.");
    const blob = new Blob([u8]), names = [];
    try { await unzipBytes(blob, n => { if (names.length < 5000) names.push(n); return false; }); }
    catch (e) { throw err("bad", "This file looks damaged, so Studyboard can't show it."); }
    const has = new Set(names), raw = new Map(), parsed = new Map();
    let left = BUDGET;
    const z = {
      names, has: n => has.has(n),
      async bytes(n){
        if (!n || !has.has(n)) return null;
        if (raw.has(n)) return raw.get(n);
        if (left <= 0) throw err("big", "This file unpacks to far more than a normal document.");
        let out = null;
        try { out = (await unzipBytes(blob, x => x === n, {max: Math.min(ZIP_MAX_OUT, left)}))[n] || null; }
        catch (e) { throw err("big", "This file unpacks to far more than a normal document."); }
        if (out) left -= out.length;
        return out;
      },
      async keep(n){ const b = await z.bytes(n); raw.set(n, b); return b; },
      async text(n){
        const b = await z.bytes(n); if (!b) return null;
        if (b[0] === 0xFF && b[1] === 0xFE) return new TextDecoder("utf-16le").decode(b);
        if (b[0] === 0xFE && b[1] === 0xFF) return new TextDecoder("utf-16be").decode(b);
        return new TextDecoder().decode(b);
      },
      async xml(n, remap){
        const key = n + (remap ? "|" + JSON.stringify(remap) : "");
        if (parsed.has(key)) return parsed.get(key);
        const t = await z.text(n), x = t == null ? null : parseXml(t, remap);
        parsed.set(key, x); return x;
      },
    };
    return z;
  }
  const normPath = p => { const out = []; for (const s of p.split("/")) { if (s === "..") out.pop(); else if (s && s !== ".") out.push(s); } return out.join("/"); };
  async function relsOf(z, part){
    const dir = part.replace(/[^/]*$/, ""), x = await z.xml(dir + "_rels/" + part.slice(dir.length) + ".rels"), out = {};
    if (x) for (const r of kids(x, "Relationship")) {
      const id = at(r, "Id"); if (!id) continue;
      const ext = at(r, "TargetMode") === "External"; let t = at(r, "Target") || "";
      if (!ext) { try { t = decodeURIComponent(t); } catch (e) {} t = normPath(t.startsWith("/") ? t : dir + t); }
      out[id] = {type: at(r, "Type") || "", ext, target: t};
    }
    return out;
  }
  const relType = (rels, t) => Object.values(rels).find(r => !r.ext && r.type.endsWith("/" + t));
  async function mainPart(z, def){
    const r = await relsOf(z, ""), m = relType(r, "officeDocument");
    return m && z.has(m.target) ? m.target : def;
  }

  /* ---------- pictures ---------- */
  function sniff(b){
    if (!b || b.length < 12) return null;
    if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4E && b[3] === 0x47) return "image/png";
    if (b[0] === 0xFF && b[1] === 0xD8 && b[2] === 0xFF) return "image/jpeg";
    if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38) return "image/gif";
    if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return "image/webp";
    if (b[0] === 0x42 && b[1] === 0x4D) return "image/bmp";
    return null;
  }
  function newCtx(textOnly){ return {textOnly: !!textOnly, warnings: [], imgs: [], urls: [], byPath: new Map(), warned: new Set()}; }
  const warn = (ctx, m) => { if (!ctx.warned.has(m)) { ctx.warned.add(m); ctx.warnings.push(m); } };
  // A stand-in for a picture; filled in by fillImgs() once the bytes are read. path null → a "Picture" box.
  function imgTok(ctx, p, style, alt, label){
    if (ctx.textOnly) return "";
    if (ctx.imgs.length >= MAX_IMGS) { warn(ctx, "Only the first " + MAX_IMGS + " pictures are shown."); p = null; }
    ctx.imgs.push({p, style, alt: String(alt || "").slice(0, 300), label: label || "Picture"});
    return "\u0001" + (ctx.imgs.length - 1) + "\u0001";
  }
  function b64(u8){ let s = ""; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s); }
  async function loadImgs(z, ctx){
    for (const im of ctx.imgs) {
      if (!im.p || ctx.byPath.has(im.p)) continue;
      let url = null;
      try {
        const b = await z.bytes(im.p), mime = sniff(b);
        if (mime) {
          if (typeof URL !== "undefined" && URL.createObjectURL) url = URL.createObjectURL(new Blob([b], {type: mime}));
          else if (b.length < 4e6) url = "data:" + mime + ";base64," + b64(b);
          if (url && url.startsWith("blob:")) ctx.urls.push(url);
        } else if (b) warn(ctx, "Some pictures are in a format Studyboard can't show (like EMF or TIFF).");
      } catch (e) { if (e && e.code === "big") warn(ctx, "Some pictures were too big to show."); }
      ctx.byPath.set(im.p, url);
    }
  }
  function fillImgs(html, ctx){
    if (html.indexOf("\u0001") < 0) return html;
    return html.replace(/\u0001(\d+)\u0001/g, (m, i) => {
      const im = ctx.imgs[Number(i)]; if (!im) return "";
      const url = im.p ? ctx.byPath.get(im.p) : null;
      if (url && /^(blob:|data:image\/(png|jpeg|gif|webp|bmp);base64,)/.test(url)) return `<img class="ofc-img" src="${esc(url)}" alt="${esc(im.alt)}" draggable="false" style="${qa(im.style)}">`;
      return `<span class="ofc-pic" role="img" aria-label="${esc(im.alt || im.label)}" style="${qa(im.style)}"><span>${esc(im.label)}</span></span>`;
    });
  }

  /* ---------- fonts and colours ---------- */
  const SANS = "Arial,'Helvetica Neue',Helvetica,sans-serif";
  const FONTS = {
    calibri: "Calibri,Carlito,'Segoe UI'," + SANS, "calibri light": "'Calibri Light',Calibri,Carlito,'Segoe UI Light','Segoe UI'," + SANS,
    aptos: "Aptos,'Segoe UI',Calibri,Carlito," + SANS, "aptos display": "'Aptos Display',Aptos,'Segoe UI',Calibri,Carlito," + SANS, "aptos narrow": "'Aptos Narrow',Aptos,'Arial Narrow'," + SANS,
    arial: "Arial,'Liberation Sans',Arimo,Helvetica,sans-serif", "arial narrow": "'Arial Narrow','Liberation Sans Narrow',Arial,sans-serif", "arial black": "'Arial Black',Arial,sans-serif",
    helvetica: "Helvetica,'Helvetica Neue',Arial,sans-serif", "helvetica neue": "'Helvetica Neue',Helvetica,Arial,sans-serif",
    "segoe ui": "'Segoe UI',system-ui," + SANS, "segoe ui light": "'Segoe UI Light','Segoe UI',system-ui," + SANS, verdana: "Verdana,'DejaVu Sans',sans-serif", tahoma: "Tahoma,Verdana,'DejaVu Sans',sans-serif",
    "trebuchet ms": "'Trebuchet MS',Tahoma,sans-serif", "century gothic": "'Century Gothic',Futura,'Avenir Next',Avenir," + SANS, "gill sans mt": "'Gill Sans MT','Gill Sans',Calibri," + SANS, "gill sans": "'Gill Sans','Gill Sans MT',Calibri," + SANS,
    "franklin gothic book": "'Franklin Gothic Book','Franklin Gothic',Arial,sans-serif", "franklin gothic medium": "'Franklin Gothic Medium','Franklin Gothic',Arial,sans-serif",
    "open sans": "'Open Sans','Segoe UI'," + SANS, roboto: "Roboto,'Segoe UI'," + SANS, lato: "Lato,'Segoe UI'," + SANS, montserrat: "Montserrat,'Segoe UI'," + SANS, "source sans pro": "'Source Sans Pro','Segoe UI'," + SANS,
    "comic sans ms": "'Comic Sans MS','Comic Neue',cursive", impact: "Impact,'Arial Black',sans-serif",
    "times new roman": "'Times New Roman','Liberation Serif',Tinos,Times,serif", times: "Times,'Times New Roman',serif", cambria: "Cambria,Caladea,Georgia,serif",
    georgia: "Georgia,'Times New Roman',serif", garamond: "Garamond,'EB Garamond',Georgia,serif", "book antiqua": "'Book Antiqua',Palatino,'Palatino Linotype',Georgia,serif",
    "palatino linotype": "'Palatino Linotype',Palatino,'Book Antiqua',Georgia,serif", palatino: "Palatino,'Palatino Linotype',Georgia,serif", constantia: "Constantia,Georgia,serif",
    "courier new": "'Courier New','Liberation Mono',Cousine,Courier,monospace", courier: "Courier,'Courier New',monospace", consolas: "Consolas,Menlo,Monaco,'Courier New',monospace",
    "lucida console": "'Lucida Console',Menlo,Consolas,monospace",
  };
  function fontCss(name){
    const n = String(name || "").trim(), k = n.toLowerCase();
    if (!n) return null;
    if (FONTS[k]) return FONTS[k];
    if (!/^[A-Za-z0-9 -]{1,40}$/.test(n) || /^(symbol|wingdings.*|webdings|marlett)$/i.test(n)) return null;
    const gen = /mono|courier|consol|code/i.test(n) ? "monospace" : /sans/i.test(n) ? "sans-serif" : /times|georgia|garamond|cambria|serif|book|palatino|roman|minion|baskerville|bodoni|didot|caslon|century schoolbook/i.test(n) ? "serif" : "sans-serif";
    return `'${n}',${gen}`;
  }
  const rgbOf = h => [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  const hexOf = rgb => rgb.map(v => clamp(Math.round(v), 0, 255).toString(16).padStart(2, "0")).join("").toUpperCase();
  function toHsl([r, g, b]){
    r /= 255; g /= 255; b /= 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2; let h = 0, s = 0;
    if (mx !== mn) { const d = mx - mn; s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn); h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h /= 6; }
    return [h, s, l];
  }
  function fromHsl([h, s, l]){
    if (!s) return [l * 255, l * 255, l * 255];
    const q = l < .5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
    const f = t => { t = (t + 1) % 1; return 255 * (t < 1 / 6 ? p + (q - p) * 6 * t : t < .5 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p); };
    return [f(h + 1 / 3), f(h), f(h - 1 / 3)];
  }
  const lumTint = (hex, tint) => { const hsl = toHsl(rgbOf(hex)); hsl[2] = tint < 0 ? hsl[2] * (1 + tint) : hsl[2] * (1 - tint) + tint; return hexOf(fromHsl(hsl)); };
  const css = c => !c ? null : c.a >= 0.999 ? "#" + c.hex : `rgba(${rgbOf(c.hex).join(",")},${R(c.a)})`;
  const DEF_THEME = {dk1: "000000", lt1: "FFFFFF", dk2: "44546A", lt2: "E7E6E6", accent1: "4472C4", accent2: "ED7D31", accent3: "A5A5A5", accent4: "FFC000", accent5: "5B9BD5", accent6: "70AD47", hlink: "0563C1", folHlink: "954F72"};
  const PRST = {black: "000000", white: "FFFFFF", red: "FF0000", green: "008000", blue: "0000FF", yellow: "FFFF00", gray: "808080", grey: "808080", orange: "FFA500", purple: "800080", navy: "000080", darkBlue: "00008B", darkRed: "8B0000", darkGreen: "006400", lightGray: "D3D3D3", silver: "C0C0C0", cyan: "00FFFF", magenta: "FF00FF"};
  function readTheme(x){
    const th = {colors: Object.assign({}, DEF_THEME), major: "Calibri Light", minor: "Calibri", map: {bg1: "lt1", tx1: "dk1", bg2: "lt2", tx2: "dk2"}};
    const els = kid(x, "a:themeElements"), cs = kid(els, "a:clrScheme");
    if (cs) for (const c of cs.c) if (isEl(c)) {
      const v = kid(c, "a:srgbClr") ? hex6(at(kid(c, "a:srgbClr"), "val")) : kid(c, "a:sysClr") ? hex6(at(kid(c, "a:sysClr"), "lastClr")) : null;
      if (v) th.colors[ln(c.n)] = v;
    }
    const fs = kid(els, "a:fontScheme"), maj = at(path(fs, "a:majorFont", "a:latin"), "typeface"), min = at(path(fs, "a:minorFont", "a:latin"), "typeface");
    if (maj) th.major = maj; if (min) th.minor = min;
    return th;
  }
  const scheme = (th, v) => th.colors[th.map[v] || v] || null;
  // A DrawingML colour inside e (solidFill and the like) → {hex, a}
  function dmlColor(e, th, ph){
    if (!e) return null;
    for (const c of e.c) {
      if (!isEl(c)) continue;
      let base = null;
      if (c.n === "a:srgbClr") base = hex6(at(c, "val"));
      else if (c.n === "a:schemeClr") base = at(c, "val") === "phClr" ? (ph ? ph.hex : null) : scheme(th, at(c, "val"));
      else if (c.n === "a:sysClr") base = hex6(at(c, "lastClr")) || (at(c, "val") === "window" ? "FFFFFF" : "000000");
      else if (c.n === "a:prstClr") base = PRST[at(c, "val")] || null;
      else if (c.n === "a:scrgbClr") base = hexOf(["r", "g", "b"].map(k => clamp(num(at(c, k)) / 100000, 0, 1) * 255));
      else continue;
      if (!base) return null;
      let hsl = null, rgb = rgbOf(base), a = 1;
      for (const m of c.c) {
        if (!isEl(m)) continue;
        const v = num(at(m, "val")) / 100000;
        if (m.n === "a:alpha") a = clamp(v, 0, 1);
        else if (m.n === "a:lumMod" || m.n === "a:lumOff") { hsl = toHsl(rgb); hsl[2] = clamp(m.n === "a:lumMod" ? hsl[2] * v : hsl[2] + v, 0, 1); rgb = fromHsl(hsl); }
        else if (m.n === "a:tint") rgb = rgb.map(x => x + (255 - x) * (1 - clamp(v, 0, 1)));
        else if (m.n === "a:shade") rgb = rgb.map(x => x * clamp(v, 0, 1));
        else if (m.n === "a:satMod") { hsl = toHsl(rgb); hsl[1] = clamp(hsl[1] * v, 0, 1); rgb = fromHsl(hsl); }
      }
      return {hex: hexOf(rgb), a};
    }
    return null;
  }

  /* ---------- numbers for lists ---------- */
  function roman(n){ let s = ""; const v = [[1000, "m"], [900, "cm"], [500, "d"], [400, "cd"], [100, "c"], [90, "xc"], [50, "l"], [40, "xl"], [10, "x"], [9, "ix"], [5, "v"], [4, "iv"], [1, "i"]]; n = clamp(n, 1, 3999); for (const [k, r] of v) while (n >= k) { s += r; n -= k; } return s; }
  function letters(n){ n = clamp(n, 1, 18278); let s = ""; while (n > 0) { n--; s = String.fromCharCode(97 + n % 26) + s; n = Math.floor(n / 26); } return s; }
  function fmtCount(n, f){
    f = String(f || "decimal");
    if (/^lowerLetter|alphaLc/.test(f)) return letters(n);
    if (/^upperLetter|alphaUc/.test(f)) return letters(n).toUpperCase();
    if (/^lowerRoman|romanLc/.test(f)) return roman(n);
    if (/^upperRoman|romanUc/.test(f)) return roman(n).toUpperCase();
    if (f === "decimalZero") return String(n).padStart(2, "0");
    if (f === "none") return "";
    if (f === "ordinal") return n + (n % 100 > 10 && n % 100 < 14 ? "th" : ["th", "st", "nd", "rd"][n % 10] || "th");
    return String(n);
  }
  const SYMCH = {0xB7: "•", 0xA7: "▪", 0xD8: "➢", 0xFC: "✓", 0x76: "❖", 0x71: "❑", 0x6E: "■", 0x6C: "●", 0xA8: "◆", 0x77: "◆", 0xE0: "➔", 0xE8: "➔", 0x9F: "•", 0x2D: "–"};
  function bulletChar(t, font, lvl){
    t = String(t || "");
    const c = t.codePointAt(0), sym = /symbol|wingdings|webdings/i.test(font || "");
    if (!t) return "•";
    if (c >= 0xF000 && c <= 0xF0FF) return SYMCH[c - 0xF000] || "•";
    if (sym) return SYMCH[c] || ["•", "◦", "▪"][lvl % 3];
    if (t === "o" && /courier/i.test(font || "")) return "◦";
    return t.slice(0, 4);
  }

  /* ================= Word ================= */
  const twpx = v => num(v) / TW;
  const HL = {yellow: "FFFF00", green: "00FF00", cyan: "00FFFF", magenta: "FF00FF", blue: "0000FF", red: "FF0000", darkBlue: "000080", darkCyan: "008080", darkGreen: "008000", darkMagenta: "800080", darkRed: "800000", darkYellow: "808000", darkGray: "808080", lightGray: "C0C0C0", black: "000000", white: "FFFFFF"};
  function wFont(e, theme){
    if (!e) return undefined;
    const t = at(e, "w:asciiTheme") || at(e, "w:hAnsiTheme");
    if (t && theme) return /^major/.test(t) ? theme.major : theme.minor;
    return at(e, "w:ascii") || at(e, "w:hAnsi") || at(e, "w:cs") || undefined;
  }
  function wR(e, theme){
    const o = {};
    if (!e) return o;
    for (const c of e.c) {
      if (!isEl(c)) continue;
      switch (c.n) {
        case "w:b": o.b = on(c, "w:val"); break;
        case "w:i": o.i = on(c, "w:val"); break;
        case "w:strike": case "w:dstrike": o.s = on(c, "w:val"); break;
        case "w:caps": o.caps = on(c, "w:val"); break;
        case "w:smallCaps": o.sc = on(c, "w:val"); break;
        case "w:vanish": o.hide = on(c, "w:val"); break;
        case "w:u": o.u = !/^none$/i.test(at(c, "w:val") || "single"); break;
        case "w:sz": { const v = num(at(c, "w:val"), NaN); if (v >= 2 && v <= 3276) o.sz = clamp(v / 2, 1, 400); break; }
        case "w:color": { const v = hex6(at(c, "w:val")); o.color = v || (at(c, "w:val") === "auto" ? null : undefined); break; }
        case "w:highlight": o.hl = HL[at(c, "w:val")] || null; break;
        case "w:shd": { const v = hex6(at(c, "w:fill")); if (v) o.shd = v; break; }
        case "w:vertAlign": { const v = at(c, "w:val"); o.va = v === "superscript" ? "sup" : v === "subscript" ? "sub" : null; break; }
        case "w:rFonts": { const f = wFont(c, theme); if (f) o.font = f; break; }
        case "w:rStyle": o.rStyle = at(c, "w:val"); break;
      }
    }
    return o;
  }
  function wBorder(e){
    if (!e) return undefined;
    const v = at(e, "w:val") || "single";
    if (/^(nil|none)$/.test(v)) return "none";
    const st = /double/i.test(v) ? "double" : /dash/i.test(v) ? "dashed" : /dot/i.test(v) ? "dotted" : "solid";
    const w = clamp(num(at(e, "w:sz"), 4) / 8 * 4 / 3, .75, 8);
    return `${R(st === "double" ? Math.max(w, 3) : w)}px ${st} #${hex6(at(e, "w:color")) || "000000"}`;
  }
  function wBorders(e){
    if (!e) return undefined;
    const g = n => wBorder(kid(e, "w:" + n));
    return {top: g("top"), left: g("left") || g("start"), bottom: g("bottom"), right: g("right") || g("end"), insideH: g("insideH"), insideV: g("insideV")};
  }
  function wP(e){
    const o = {};
    if (!e) return o;
    for (const c of e.c) {
      if (!isEl(c)) continue;
      switch (c.n) {
        case "w:pStyle": o.style = at(c, "w:val"); break;
        case "w:jc": { const v = at(c, "w:val"); o.jc = /^(center)$/.test(v) ? "center" : /^(right|end)$/.test(v) ? "right" : /^(both|distribute|lowKashida|mediumKashida|highKashida|thaiDistribute)$/.test(v) ? "justify" : "left"; break; }
        case "w:ind": {
          const l = at(c, "w:left") ?? at(c, "w:start"), r = at(c, "w:right") ?? at(c, "w:end");
          if (l != null) o.indL = twpx(l); if (r != null) o.indR = twpx(r);
          if (at(c, "w:hanging") != null) o.indF = -twpx(at(c, "w:hanging")); else if (at(c, "w:firstLine") != null) o.indF = twpx(at(c, "w:firstLine"));
          break;
        }
        case "w:spacing":
          if (at(c, "w:before") != null) o.spB = twpx(at(c, "w:before"));
          if (at(c, "w:after") != null) o.spA = twpx(at(c, "w:after"));
          if (on(c, "w:beforeAutospacing") && at(c, "w:beforeAutospacing") != null) o.spB = 18.67;
          if (on(c, "w:afterAutospacing") && at(c, "w:afterAutospacing") != null) o.spA = 18.67;
          if (at(c, "w:line") != null) { o.line = num(at(c, "w:line"), 240); o.rule = at(c, "w:lineRule") || "auto"; }
          break;
        case "w:outlineLvl": o.outline = num(at(c, "w:val"), 9); break;
        case "w:numPr": { const id = at(kid(c, "w:numId"), "w:val"), lv = at(kid(c, "w:ilvl"), "w:val"); if (id != null) o.numId = id; if (lv != null) o.ilvl = clamp(num(lv), 0, 8); break; }
        case "w:keepNext": o.kn = on(c, "w:val"); break;
        case "w:pageBreakBefore": o.pbb = on(c, "w:val"); break;
        case "w:contextualSpacing": o.cs = on(c, "w:val"); break;
        case "w:shd": { const v = hex6(at(c, "w:fill")); if (v) o.shd = v; break; }
        case "w:pBdr": o.bdr = wBorders(c); break;
      }
    }
    return o;
  }
  function wTblPr(e){
    const o = {};
    if (!e) return o;
    const b = kid(e, "w:tblBorders"); if (b) o.borders = wBorders(b);
    const m = kid(e, "w:tblCellMar");
    if (m) { const l = kid(m, "w:left") || kid(m, "w:start"), r = kid(m, "w:right") || kid(m, "w:end"), t = kid(m, "w:top"), bo = kid(m, "w:bottom"); if (l) o.mL = twpx(at(l, "w:w")); if (r) o.mR = twpx(at(r, "w:w")); if (t) o.mT = twpx(at(t, "w:w")); if (bo) o.mB = twpx(at(bo, "w:w")); }
    const w = kid(e, "w:tblW"); if (w) o.w = {type: at(w, "w:type") || "dxa", v: at(w, "w:w")};
    const jc = at(kid(e, "w:jc"), "w:val"); if (jc) o.jc = jc;
    const ind = kid(e, "w:tblInd"); if (ind) o.ind = twpx(at(ind, "w:w"));
    const sh = hex6(at(kid(e, "w:shd"), "w:fill")); if (sh) o.shd = sh;
    return o;
  }
  function wStyles(sx, theme){
    const S = {pDef: {}, rDef: {}, st: {}, memo: {}, defPara: null, defTable: null, none: !sx};
    if (!sx) return S;
    const dd = kid(sx, "w:docDefaults");
    S.rDef = wR(path(dd, "w:rPrDefault", "w:rPr"), theme); S.pDef = wP(path(dd, "w:pPrDefault", "w:pPr"));
    for (const s of kids(sx, "w:style")) {
      const id = at(s, "w:styleId"); if (!id) continue;
      const type = at(s, "w:type") || "paragraph", def = on(s, "w:default") && at(s, "w:default") != null;
      S.st[id] = {type, name: String(at(kid(s, "w:name"), "w:val") || "").toLowerCase(), based: at(kid(s, "w:basedOn"), "w:val"), p: wP(kid(s, "w:pPr")), r: wR(kid(s, "w:rPr"), theme), t: wTblPr(kid(s, "w:tblPr"))};
      if (def && type === "paragraph") S.defPara = id;
      if (def && type === "table") S.defTable = id;
    }
    return S;
  }
  function chain(S, id){
    if (!id) return {p: {}, r: {}, t: {}, name: ""};
    if (S.memo[id]) return S.memo[id];
    const list = [], seen = new Set();
    for (let c = id; c && S.st[c] && !seen.has(c) && list.length < 20; c = S.st[c].based) { seen.add(c); list.unshift(S.st[c]); }
    const out = {p: {}, r: {}, t: {}, name: S.st[id] ? S.st[id].name : String(id).toLowerCase()};
    for (const s of list) { put(out.p, s.p); put(out.r, s.r); const b = out.t.borders; put(out.t, s.t); if (b && s.t.borders) out.t.borders = put(Object.assign({}, b), s.t.borders); }
    return (S.memo[id] = out);
  }
  function wNumbering(nx){
    const N = {abs: {}, nums: {}, cnt: {}};
    if (!nx) return N;
    for (const a of kids(nx, "w:abstractNum")) {
      const lv = {};
      for (const l of kids(a, "w:lvl")) lv[clamp(num(at(l, "w:ilvl")), 0, 8)] = {fmt: at(kid(l, "w:numFmt"), "w:val") || "decimal", text: at(kid(l, "w:lvlText"), "w:val") ?? "", start: num(at(kid(l, "w:start"), "w:val"), 1), p: wP(kid(l, "w:pPr")), r: wR(kid(l, "w:rPr"))};
      N.abs[at(a, "w:abstractNumId")] = lv;
    }
    for (const n of kids(nx, "w:num")) {
      const ov = {};
      for (const o of kids(n, "w:lvlOverride")) { const s = at(kid(o, "w:startOverride"), "w:val"); if (s != null) ov[num(at(o, "w:ilvl"))] = num(s, 1); }
      N.nums[at(n, "w:numId")] = {lv: N.abs[at(kid(n, "w:abstractNumId"), "w:val")] || {}, ov};
    }
    return N;
  }
  function listLevel(N, id, ilvl){
    const nm = N.nums[id]; if (!nm || id === "0") return null;
    const lv = nm.lv[ilvl]; if (!lv) return null;
    const start = k => nm.ov[k] != null ? nm.ov[k] : (nm.lv[k] ? nm.lv[k].start : 1);
    const c = N.cnt[id] || (N.cnt[id] = []);
    c[ilvl] = c[ilvl] == null ? start(ilvl) : c[ilvl] + 1;
    for (let k = ilvl + 1; k < 9; k++) c[k] = null;
    let text;
    if (lv.fmt === "bullet") text = bulletChar(lv.text, lv.r.font, ilvl);
    else text = String(lv.text).replace(/%([1-9])/g, (m, d) => { const k = Number(d) - 1, l2 = nm.lv[k]; return fmtCount(c[k] == null ? start(k) : c[k], k === ilvl || !(l2 && l2.fmt) ? lv.fmt : l2.fmt); });
    return {text, lv};
  }
  function runCss(r, base){
    const s = [];
    if (r.font && r.font !== base.font) { const f = fontCss(r.font); if (f) s.push("font-family:" + f); }
    let sz = r.sz || 11;
    if (r.va) sz *= .65;
    if (sz !== (base.sz || 11)) s.push(`font-size:${R(sz * 4 / 3)}px`);
    if (r.va) s.push("vertical-align:" + (r.va === "sup" ? "super" : "sub"));
    if (r.b) s.push("font-weight:700");
    if (r.i) s.push("font-style:italic");
    const d = [r.u && "underline", r.s && "line-through"].filter(Boolean); if (d.length) s.push("text-decoration:" + d.join(" "));
    if (r.color) s.push("color:#" + r.color);
    if (r.hl) s.push("background-color:#" + r.hl); else if (r.shd) s.push("background-color:#" + r.shd);
    if (r.caps) s.push("text-transform:uppercase"); else if (r.sc) s.push("font-variant:small-caps");
    return s.join(";");
  }
  // One paragraph's inline content
  class Inl {
    constructor(){ this.h = ""; this.t = ""; this.css = ""; this.buf = ""; this.any = false; this.links = 0; this.fld = []; this.parts = []; }
    hidden(){ return this.fld.some(f => !f.res); }
    add(text, c){ if (!text || this.hidden()) return; if (c !== this.css) this.flushRun(); this.css = c; this.buf += text; this.t += text; this.any = true; }
    flushRun(){ if (this.buf) this.h += this.css ? `<span style="${qa(this.css)}">${esc(this.buf)}</span>` : esc(this.buf); this.buf = ""; this.css = ""; }
    raw(html, text, inv){ if (this.hidden()) return; this.flushRun(); this.h += html; if (text) this.t += text; if (!inv) this.any = true; }
    open(url){ if (this.links || !url) return false; this.raw(`<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">`, "", true); this.links++; return true; }
    close(){ if (this.links) { this.raw("</a>", "", true); this.links--; } }
    end(){ this.flushRun(); while (this.links) { this.h += "</a>"; this.links--; } }
    pageBreak(){ const l = this.links; this.end(); this.parts.push({h: this.h, t: this.t, any: this.any}); this.h = ""; this.t = ""; this.any = false; this.links = 0; return l; }
  }
  function wInline(node, env, st, base, P){
    for (const e of flat(node)) {
      switch (e.n) {
        case "w:r": wRun(e, env, st, base); break;
        case "w:hyperlink": {
          const rel = env.rels[at(e, "r:id")], url = rel && rel.ext ? safeUrl(rel.target) : null;
          const opened = url ? st.open(url) : false;
          wInline(e, env, st, base, P);
          if (opened) st.close();
          break;
        }
        case "w:fldSimple": {
          const m = /^\s*HYPERLINK\s+"([^"]+)"/i.exec(at(e, "w:instr") || ""), url = m ? safeUrl(m[1]) : null;
          const opened = url ? st.open(url) : false; wInline(e, env, st, base, P); if (opened) st.close(); break;
        }
        case "w:sdt": wInline(kid(e, "w:sdtContent"), env, st, base, P); break;
        case "w:ins": case "w:smartTag": case "w:customXml": case "w:dir": case "w:bdo": case "w:moveTo": wInline(e, env, st, base, P); break;
        case "m:oMath": case "m:oMathPara": { const t = findAll(e, "m:t").map(textOf).join(""); st.add(t, runCss(put(Object.assign({}, base), {i: true, font: "Cambria Math"}), st.cmp)); break; }
      }
    }
  }
  const SYMFONT = /symbol|wingdings|webdings/i;
  function wRun(r, env, st, base){
    const own = wR(kid(r, "w:rPr"), env.theme), cs = own.rStyle ? chain(env.S, own.rStyle).r : null;
    const rp = put(put(Object.assign({}, base), cs), own);
    if (rp.hide) return;
    const c = runCss(rp, st.cmp);
    for (const e of r.c) {
      if (!isEl(e)) continue;
      switch (e.n) {
        case "w:t": st.add(textOf(e), c); break;
        case "w:tab": case "w:ptab": st.add("\t", c); break;
        case "w:br": case "w:cr":
          if (at(e, "w:type") === "page") st.pageBreak();
          else if (at(e, "w:type") !== "column") st.raw("<br>", "\n");
          break;
        case "w:noBreakHyphen": st.add("‑", c); break;
        case "w:softHyphen": st.add("­", c); break;
        case "w:sym": { const code = parseInt(at(e, "w:char") || "", 16); if (code > 0) st.add(SYMFONT.test(at(e, "w:font") || "") || (code >= 0xF000 && code <= 0xF0FF) ? (SYMCH[code & 0xFF] || "•") : String.fromCodePoint(clamp(code, 32, 0x10FFFF)), c); break; }
        case "w:drawing": st.raw(wDrawing(e, env), ""); break;
        case "w:pict": case "w:object": st.raw(wVml(e, env), ""); break;
        case "w:fldChar": {
          const t = at(e, "w:fldCharType");
          if (t === "begin") { if (st.fld.length < 20) st.fld.push({instr: "", res: false, link: false}); }
          else if (t === "separate") {
            const f = st.fld[st.fld.length - 1];
            if (f && !f.res) { f.res = true; const m = /^\s*HYPERLINK\s+"([^"]+)"/i.exec(f.instr), url = m ? safeUrl(m[1]) : null; if (url) f.link = st.open(url); }
          } else if (t === "end") { const f = st.fld.pop(); if (f && f.link) st.close(); }
          break;
        }
        case "w:instrText": { const f = st.fld[st.fld.length - 1]; if (f && !f.res && f.instr.length < 2000) f.instr += textOf(e); break; }
        case "w:footnoteReference": case "w:endnoteReference": {
          const kind = e.n === "w:footnoteReference" ? "fn" : "en", id = at(e, "w:id");
          env.notes.push({kind, id}); const n = env.notes.length;
          st.raw(`<sup class="ofc-fn">${n}</sup>`, "[" + n + "]"); break;
        }
        case "w:footnoteRef": case "w:endnoteRef": if (env.noteNo) st.raw(`<sup class="ofc-fn">${env.noteNo}</sup>`, env.noteNo + " "); break;
        case "w:lastRenderedPageBreak": break;
      }
    }
  }
  function wDrawing(d, env){
    const holder = kid(d, "wp:inline") || kid(d, "wp:anchor"); if (!holder) return "";
    const ext = kid(holder, "wp:extent"), w = clamp(num(at(ext, "cx")) / EMU, 1, 4000), h = clamp(num(at(ext, "cy")) / EMU, 1, 4000);
    const alt = at(kid(holder, "wp:docPr"), "descr") || at(kid(holder, "wp:docPr"), "title") || "";
    let fl = "";
    if (holder.n === "wp:anchor") {
      const al = textOf(path(holder, "wp:positionH", "wp:align"));
      const sq = kid(holder, "wp:wrapSquare") || kid(holder, "wp:wrapTight") || kid(holder, "wp:wrapThrough");
      if (sq && (al === "right" || al === "left")) fl = `float:${al};margin:${al === "right" ? "0 0 6px 12px" : "0 12px 6px 0"};`;
      else if (kid(holder, "wp:wrapTopAndBottom") || al === "center") fl = "display:block;margin:4px " + (al === "center" ? "auto" : al === "right" ? "0 4px auto" : "0") + ";";
    }
    const gd = path(holder, "a:graphic", "a:graphicData");
    const blip = find(gd, "a:blip");
    const box = `${fl}width:${R(w)}px;aspect-ratio:${R(w)}/${R(h)};height:auto`;
    if (blip) {
      const rel = env.rels[at(blip, "r:embed")];
      return imgTok(env.ctx, rel && !rel.ext ? rel.target : null, box, alt);
    }
    const tb = find(gd, "w:txbxContent");
    if (tb && env.depth < 3) {
      const inner = wBlocks(tb, Object.assign({}, env, {depth: env.depth + 1}), []);
      env.tbText.push(inner.map(b => b.text).join("\n"));
      return `<span class="ofc-tb" style="${fl}width:${R(w)}px;min-height:${R(h)}px">${inner.map(blockHtml).join("")}</span>`;
    }
    const label = /chart/.test(at(gd, "uri") || "") ? "Chart" : "Picture";
    return imgTok(env.ctx, null, box, alt, label);
  }
  function wVml(e, env){
    const im = find(e, "v:imagedata"), shape = find(e, "v:shape") || find(e, "v:rect");
    const style = at(shape, "style") || "", dim = k => { const m = new RegExp("(?:^|;)\\s*" + k + "\\s*:\\s*([\\d.]+)(pt|px|in|cm|mm)?", "i").exec(style); if (!m) return 0; const v = Number(m[1]), u = (m[2] || "px").toLowerCase(); return v * ({pt: 4 / 3, px: 1, in: 96, cm: 37.8, mm: 3.78}[u]); };
    const w = clamp(dim("width") || 96, 1, 4000), h = clamp(dim("height") || 96, 1, 4000), box = `width:${R(w)}px;aspect-ratio:${R(w)}/${R(h)};height:auto`;
    if (im) { const rel = env.rels[at(im, "r:id")]; return imgTok(env.ctx, rel && !rel.ext ? rel.target : null, box, at(im, "o:title") || ""); }
    const tb = find(e, "w:txbxContent");
    if (tb && env.depth < 3) { const inner = wBlocks(tb, Object.assign({}, env, {depth: env.depth + 1}), []); env.tbText.push(inner.map(b => b.text).join("\n")); return `<span class="ofc-tb" style="width:${R(w)}px">${inner.map(blockHtml).join("")}</span>`; }
    return e.n === "w:object" ? imgTok(env.ctx, null, box, "", "Object") : "";
  }
  function headingOf(ch, P, sid){
    const nm = ch.name || "";
    if (nm === "title" || /^title$/i.test(sid || "")) return "t";
    let m = /^heading\s?([1-9])$/.exec(nm) || /^heading\s?([1-9])$/i.exec(sid || "");
    if (m) return Math.min(6, Number(m[1]));
    if (P.outline != null && P.outline < 6) return P.outline + 1;
    return 0;
  }
  function wPara(p, env, out){
    const S = env.S, ppr = kid(p, "w:pPr"), dp = wP(ppr);
    const sid = dp.style || S.defPara, ch = chain(S, sid);
    const numId = dp.numId != null ? dp.numId : ch.p.numId, ilvl = dp.ilvl != null ? dp.ilvl : (ch.p.ilvl || 0);
    const li = numId != null ? listLevel(env.N, numId, ilvl) : null;
    const P = put(put(put(put({}, S.pDef), env.tblP), ch.p), li ? li.lv.p : null); put(P, dp);
    const base = put(put(put({}, S.rDef), env.tblR), ch.r);
    const mark = wR(kid(ppr, "w:rPr"), env.theme), msz = mark.sz || base.sz;
    const st = new Inl();
    st.cmp = {font: base.font, sz: msz};
    if (li && li.text) {
      const mr = put(put(Object.assign({}, base), li.lv.r), {u: false, hide: false});
      const hang = P.indF < 0 ? -P.indF : 0;
      st.raw(`<span class="ofc-li" style="${qa(runCss(mr, st.cmp) + (hang ? `;min-width:${R(hang)}px` : ""))}">${esc(li.text)}${hang ? "" : " "}</span>`, li.text + " ", true);
    }
    wInline(p, env, st, base, P);
    st.pageBreak();
    const pre = st.parts, parts = pre.filter((x, i) => i === 0 || x.any);
    const hl = headingOf(ch, P, sid);
    const pcss = [];
    if (P.jc && P.jc !== "left") pcss.push("text-align:" + P.jc);
    const L = num(P.indL), Rr = num(P.indR), F = num(P.indF);
    if (L > 0) pcss.push(`padding-left:${R(L)}px`); else if (L < 0) pcss.push(`margin-left:${R(L)}px`);
    if (Rr > 0) pcss.push(`padding-right:${R(Rr)}px`); else if (Rr < 0) pcss.push(`margin-right:${R(Rr)}px`);
    if (F) pcss.push(`text-indent:${R(F)}px`);
    if (P.line) pcss.push(P.rule === "exact" || P.rule === "atLeast" ? `line-height:${R(clamp(P.line / TW, 4, 400))}px` : `line-height:${R(clamp(P.line / 240, .5, 5) * 1.17)}`);
    if (base.font && base.font !== env.base.font) { const f = fontCss(base.font); if (f) pcss.push("font-family:" + f); }
    if (msz && msz !== env.base.sz) pcss.push(`font-size:${R(msz * 4 / 3)}px`);
    if (P.shd) pcss.push("background-color:#" + P.shd);
    if (P.bdr) for (const k of ["top", "left", "bottom", "right"]) if (P.bdr[k] && P.bdr[k] !== "none") pcss.push(`border-${k}:${P.bdr[k]}`);
    const prev = env.prevP;
    let spB = num(P.spB), spA = num(P.spA);
    if (P.cs && prev && prev.cs && prev.sid === sid) { spB = 0; prev.padB = 0; }
    const tag = hl === "t" ? "h1" : hl ? "h" + hl : "div", cls = "ofc-p" + (hl === "t" ? " ofc-title" : hl ? " ofc-h" : "") + (hl && S.none ? " ofc-hd" + (hl === "t" ? 0 : hl) : "");
    if (P.pbb) out.push({pb: true});
    parts.forEach((x, i) => {
      if (i) out.push({pb: true});
      const b = {t: "p", tag, cls, css: pcss.join(";"), padT: i ? 0 : spB, padB: i === parts.length - 1 ? spA : 0, inner: x.any ? x.h : "<br>", text: x.t, kn: !!P.kn && !!x.t.trim(), sid, cs: !!P.cs, hl};
      out.push(b);
    });
    env.prevP = out[out.length - 1];
    if (pre.length > 1 && !pre[pre.length - 1].any) out.push({pb: true});
  }
  function blockHtml(b){
    if (b.t === "tbl") return b.open + b.rows.join("") + b.close;
    if (b.t === "raw") return b.html;
    const pad = (b.padT ? `padding-top:${R(b.padT)}px;` : "") + (b.padB ? `padding-bottom:${R(b.padB)}px;` : "");
    const st = pad + b.css;
    return `<${b.tag} class="${b.cls}"${st ? ` style="${qa(st)}"` : ""}>${b.inner}</${b.tag}>`;
  }
  function wTable(tbl, env){
    const tp = kid(tbl, "w:tblPr"), sid = at(kid(tp, "w:tblStyle"), "w:val") || env.S.defTable, ch = chain(env.S, sid), own = wTblPr(tp);
    const T = put(Object.assign({}, ch.t), own);
    let bd = put(put({}, ch.t.borders), own.borders);
    if (!Object.keys(bd).length && /grid/i.test(sid || "") && env.S.none) bd = {top: "1px solid #000", left: "1px solid #000", bottom: "1px solid #000", right: "1px solid #000", insideH: "1px solid #000", insideV: "1px solid #000"};
    const grid = kids(kid(tbl, "w:tblGrid"), "w:gridCol").map(g => clamp(twpx(at(g, "w:w")), 2, 3000));
    const rowsX = [];
    const walkRows = e => { for (const c of flat(e)) { if (c.n === "w:tr") rowsX.push(c); else if (c.n === "w:sdt") walkRows(kid(c, "w:sdtContent")); else if (c.n === "w:customXml" || c.n === "w:ins") walkRows(c); } };
    walkRows(tbl);
    const rows = rowsX.slice(0, 5000).map(tr => {
      const trPr = kid(tr, "w:trPr"); let col = num(at(kid(trPr, "w:gridBefore"), "w:val"));
      const cells = [];
      const walkCells = e => { for (const c of flat(e)) { if (c.n === "w:tc") { const pr = kid(c, "w:tcPr"), span = clamp(num(at(kid(pr, "w:gridSpan"), "w:val"), 1), 1, 63), vmE = kid(pr, "w:vMerge"); cells.push({col, span, vm: vmE ? (at(vmE, "w:val") === "restart" ? "r" : "c") : "", pr, el: c}); col += span; } else if (c.n === "w:sdt") walkCells(kid(c, "w:sdtContent")); else if (c.n === "w:customXml") walkCells(c); } };
      walkCells(tr);
      const hEl = kid(trPr, "w:trHeight");
      return {cells, hdr: !!kid(trPr, "w:tblHeader") && on(kid(trPr, "w:tblHeader"), "w:val"), h: hEl ? clamp(twpx(at(hEl, "w:val")), 0, 2000) : 0, exact: at(hEl, "w:hRule") === "exact"};
    });
    if (rowsX.length > 5000) warn(env.ctx, "A very long table was cut short.");
    const ncol = Math.max(grid.length, ...rows.map(r => r.cells.reduce((m, c) => Math.max(m, c.col + c.span), 0)), 1);
    while (grid.length < ncol) grid.push(grid.length ? grid[grid.length - 1] : 96);
    let tw = grid.reduce((a, b) => a + b, 0);
    if (T.w && T.w.type === "pct") { const v = String(T.w.v || ""); const f = v.endsWith("%") ? num(v.slice(0, -1)) / 100 : num(v) / 5000; if (f > 0) tw = env.cw * clamp(f, .05, 1.5); }
    else if (T.w && T.w.type === "dxa" && num(T.w.v) > 0 && !grid.length) tw = twpx(T.w.v);
    tw = clamp(tw, 20, env.cw * 1.6);
    const scale = tw / (grid.reduce((a, b) => a + b, 0) || tw);
    const mL = T.mL != null ? T.mL : 7.2, mR = T.mR != null ? T.mR : 7.2, mT = T.mT || 0, mB = T.mB || 0;
    const tEnv = Object.assign({}, env, {tblP: put(Object.assign({}, env.tblP), ch.p), tblR: put(Object.assign({}, env.tblR), ch.r), cw: tw, depth: env.depth + 1, prevP: null});
    const text = [], out = [];
    rows.forEach((row, ri) => {
      let h = "", tx = [];
      for (const c of row.cells) {
        if (c.vm === "c") continue;
        let rs = 1;
        if (c.vm === "r") for (let k = ri + 1; k < rows.length; k++) { if (rows[k].cells.some(x => x.col === c.col && x.vm === "c")) rs++; else break; }
        const pr = c.pr, s = [];
        const tcb = kid(pr, "w:tcBorders");
        const edge = (side, a, b) => { const ownB = wBorder(kid(tcb, "w:" + a) || (b ? kid(tcb, "w:" + b) : null)); return ownB !== undefined ? ownB : bd[side]; };
        const top = edge(ri === 0 ? "top" : "insideH", "top"), bot = edge(ri + rs >= rows.length ? "bottom" : "insideH", "bottom");
        const lef = edge(c.col === 0 ? "left" : "insideV", "left", "start"), rig = edge(c.col + c.span >= ncol ? "right" : "insideV", "right", "end");
        [["top", top], ["bottom", bot], ["left", lef], ["right", rig]].forEach(([k, v]) => { if (v && v !== "none") s.push(`border-${k}:${v}`); });
        const fill = hex6(at(kid(pr, "w:shd"), "w:fill")) || T.shd; if (fill) s.push("background-color:#" + fill);
        const va = at(kid(pr, "w:vAlign"), "w:val"); if (va === "center" || va === "bottom") s.push("vertical-align:" + (va === "center" ? "middle" : "bottom"));
        s.push(`padding:${R(mT)}px ${R(mR)}px ${R(mB)}px ${R(mL)}px`);
        const inner = c.el && env.depth < 4 ? wBlocks(c.el, Object.assign({}, tEnv, {cw: grid.slice(c.col, c.col + c.span).reduce((a, b) => a + b, 0) * scale}), []) : [];
        tx.push(inner.map(b => b.text).join(" ").replace(/\s+/g, " ").trim());
        h += `<td${c.span > 1 ? ` colspan="${c.span}"` : ""}${rs > 1 ? ` rowspan="${rs}"` : ""} style="${qa(s.join(";"))}">${inner.map(blockHtml).join("")}</td>`;
      }
      out.push(`<tr${row.h ? ` style="height:${R(row.h)}px"` : ""}>${h}</tr>`);
      text.push(tx.join("\t"));
    });
    let hdr = 0; while (hdr < rows.length && rows[hdr].hdr) hdr++;
    const ml = T.jc === "center" ? "margin-left:auto;margin-right:auto" : T.jc === "right" || T.jc === "end" ? "margin-left:auto" : T.ind ? `margin-left:${R(clamp(T.ind, -200, 600))}px` : "";
    const open = `<div class="ofc-tw"><table class="ofc-tbl" style="width:${R(tw)}px${ml ? ";" + ml : ""}"><colgroup>${grid.map(g => `<col style="width:${R(g * scale)}px">`).join("")}</colgroup><tbody>`;
    return {t: "tbl", open, close: "</tbody></table></div>", rows: out, hdr: hdr < rows.length ? hdr : 0, text: text.join("\n")};
  }
  function wBlocks(container, env, out){
    for (const e of flat(container)) {
      if (env.count.n >= MAX_BLOCKS) { warn(env.ctx, "This document is very long, so only the first part is shown."); return out; }
      switch (e.n) {
        case "w:p": {
          env.count.n++;
          wPara(e, env, out);
          const sp = path(e, "w:pPr", "w:sectPr");
          if (sp && env.depth === 0 && at(kid(sp, "w:type"), "w:val") !== "continuous") out.push({pb: true, sect: true});
          break;
        }
        case "w:tbl": env.count.n++; if (env.depth < 4) { out.push(wTable(e, env)); env.prevP = null; } break;
        case "w:sdt": wBlocks(kid(e, "w:sdtContent"), env, out); break;
        case "w:customXml": case "w:ins": case "w:moveTo": wBlocks(e, env, out); break;
      }
    }
    return out;
  }
  async function docxModel(z, ctx){
    const main = await mainPart(z, "word/document.xml"), doc = await z.xml(main);
    const body = kid(doc, "w:body");
    if (!body) throw err("bad", "This Word file looks damaged, so Studyboard can't show it.");
    const rels = await relsOf(z, main), rel = t => relType(rels, t);
    const thx = rel("theme") ? await z.xml(rel("theme").target) : null, theme = thx ? readTheme(thx) : null;
    const S = wStyles(rel("styles") ? await z.xml(rel("styles").target) : null, theme);
    const N = wNumbering(rel("numbering") ? await z.xml(rel("numbering").target) : null);
    const sect = kid(body, "w:sectPr"), pg = kid(sect, "w:pgSz"), mar = kid(sect, "w:pgMar");
    let W = clamp(pg ? twpx(at(pg, "w:w")) : 816, 200, 4000), H = clamp(pg ? twpx(at(pg, "w:h")) : 1056, 200, 6000);
    if (!(W > 0) || !(H > 0)) { W = 816; H = 1056; }
    const m = k => clamp(mar && at(mar, "w:" + k) != null ? Math.abs(twpx(at(mar, "w:" + k))) : 96, 0, (k === "left" || k === "right" ? W : H) / 3);
    const page = {W, H, mt: m("top"), mb: m("bottom"), ml: m("left"), mr: m("right")};
    const base = {font: S.rDef.font || (theme && theme.minor) || "Calibri", sz: S.rDef.sz || (S.none ? 11 : 10)};
    if (!S.rDef.font) S.rDef.font = base.font;
    if (!S.rDef.sz) S.rDef.sz = base.sz;
    const bg = hex6(at(kid(doc, "w:background"), "w:color"));
    const env = {S, N, theme, rels, ctx, base, tblP: null, tblR: null, cw: W - page.ml - page.mr, depth: 0, notes: [], tbText: [], count: {n: 0}, prevP: null};
    const blocks = wBlocks(body, env, []);
    // Footnotes and endnotes, gathered at the end
    if (env.notes.length) {
      const fx = rel("footnotes") ? await z.xml(rel("footnotes").target) : null, ex = rel("endnotes") ? await z.xml(rel("endnotes").target) : null;
      const byId = (x, n) => { const o = {}; for (const f of kids(x, n)) o[at(f, "w:id")] = f; return o; };
      const F = byId(fx, "w:footnote"), E = byId(ex, "w:endnote");
      const notes = env.notes.slice(0, 2000);
      env.notes = [];
      blocks.push({t: "raw", html: '<div class="ofc-p ofc-fnsep" style="padding-top:18px"></div>', text: ""});
      notes.forEach((n, i) => {
        const el = (n.kind === "fn" ? F : E)[n.id]; if (!el) return;
        const sub = wBlocks(el, Object.assign({}, env, {noteNo: i + 1, depth: 1, base}), []);
        sub.forEach(b => { if (b.t === "p") b.cls += " ofc-note"; });
        blocks.push(...sub.filter(b => !b.pb));
      });
    }
    let text = blocks.filter(b => !b.pb).map(b => b.text).join("\n");
    if (env.tbText.length) text += "\n" + env.tbText.join("\n");
    const baseCss = `font-family:${fontCss(base.font) || FONTS.calibri};font-size:${R(base.sz * 4 / 3)}px` + (bg ? ";background:#" + bg : "");
    return {kind: "docx", page, blocks, baseCss, text: text.replace(/\n{3,}/g, "\n\n").trim()};
  }

  // Splits the document into pages by measuring each block at the page's text width
  function docxLayout(M, ctx){
    const {W, H, mt, mb, ml, mr} = M.page, CW = Math.max(40, W - ml - mr), CH = Math.max(40, H - mt - mb);
    const host = document.createElement("div");
    host.className = "ofc-page ofc-docx ofc-measure";
    host.setAttribute("aria-hidden", "true");
    host.style.cssText = `${M.baseCss};position:fixed;left:-40000px;top:0;width:${CW}px;height:auto;visibility:hidden;pointer-events:none;contain:none`;
    document.body.appendChild(host);
    const pages = []; let cur = [], used = 0, size = 0, stop = false, lastPb = true;
    const flush = () => {
      if (stop) return;
      if (pages.length >= MAX_PAGES || size > MAX_HTML) { stop = true; warn(ctx, `Only the first ${pages.length} pages are shown.`); return; }
      const html = cur.map(x => x.html).join("");
      size += html.length;
      pages.push(html); cur = []; used = 0;
    };
    const measure = html => { host.innerHTML = html; const el = host.firstElementChild; return {el, h: el ? el.getBoundingClientRect().height : 0}; };
    // a paragraph, cut at the first line that doesn't fit in room px → [head, tail] HTML
    const split = (el, room) => {
      const top = el.getBoundingClientRect().top, limit = top + room - 1;
      const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), nodes = [], starts = [];
      let total = 0;
      while (tw.nextNode()) { const n = tw.currentNode; if (n.parentElement && n.parentElement.closest(".ofc-li")) continue; nodes.push(n); starts.push(total); total += n.data.length; }
      if (total < 2) return null;
      const rg = document.createRange();
      const loc = k => { let lo = 0, hi = nodes.length - 1; while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (starts[mid] <= k) lo = mid; else hi = mid - 1; } return [nodes[lo], k - starts[lo]]; };
      const bottom = k => { const [n, o] = loc(k); if (o >= n.data.length) return -Infinity; rg.setStart(n, o); rg.setEnd(n, o + 1); const rs = rg.getClientRects(); const r = rs.length ? rs[rs.length - 1] : rg.getBoundingClientRect(); return r.height ? r.bottom : -Infinity; };
      if (bottom(0) > limit) return null;
      let lo = 0, hi = total - 1;
      if (bottom(hi) <= limit) return null;
      while (lo < hi) { const mid = (lo + hi) >> 1; if (bottom(mid) > limit) hi = mid; else lo = mid + 1; }
      if (lo <= 0 || lo >= total) return null;
      const [n, o] = loc(lo);
      rg.setStart(n, o); rg.setEnd(el, el.childNodes.length);
      const frag = rg.extractContents(), tail = el.cloneNode(false);
      tail.appendChild(frag);
      el.style.paddingBottom = "0px"; tail.style.paddingTop = "0px"; tail.style.textIndent = "0px";
      return [el.outerHTML, tail.outerHTML];
    };
    try {
      for (const b of M.blocks) {
        if (stop) break;
        if (b.pb) { if (!lastPb || cur.length) flush(); lastPb = true; continue; }
        lastPb = false;
        if (b.t === "tbl") {
          const {el, h} = measure(blockHtml(b));
          if (used + h <= CH + .5) { cur.push({html: blockHtml(b), h}); used += h; continue; }
          const trs = el ? Array.from(el.querySelector("table").rows) : [], rh = trs.map(r => r.getBoundingClientRect().height);
          const over = Math.max(0, h - rh.reduce((a, c) => a + c, 0)), hh = rh.slice(0, b.hdr).reduce((a, c) => a + c, 0);
          let i = 0;
          while (i < b.rows.length && !stop) {
            const head = i > 0 && b.hdr ? b.rows.slice(0, b.hdr) : [], extra = i > 0 && b.hdr ? hh : 0;
            let j = i, sum = 0;
            while (j < b.rows.length && used + over + extra + sum + rh[j] <= CH + .5) { sum += rh[j]; j++; }
            if (j === i) { if (cur.length) { flush(); continue; } sum = rh[j]; j++; }
            cur.push({html: b.open + head.join("") + b.rows.slice(i, j).join("") + b.close, h: over + extra + sum});
            used += over + extra + sum; i = j;
            if (i < b.rows.length) flush();
          }
          continue;
        }
        let html = blockHtml(b), guard = 0;
        while (html && !stop && guard++ < 200) {
          const {el, h} = measure(html);
          if (used + h <= CH + .5) { cur.push({html, h, kn: b.kn}); used += h; html = ""; break; }
          const room = CH - used;
          const parts = b.t === "p" && room > 24 && el ? split(el, room) : null;
          if (parts) { cur.push({html: parts[0], h: room}); flush(); html = parts[1]; continue; }
          if (!cur.length) { cur.push({html, h}); used += h; html = ""; break; }
          // keep a heading with the paragraph after it
          const carry = [];
          while (cur.length > 1 && cur[cur.length - 1].kn && carry.length < 3) carry.unshift(cur.pop());
          flush();
          for (const c of carry) { cur.push(c); used += c.h; }
        }
      }
      if (cur.length || !pages.length) flush();
    } finally { host.remove(); }
    const pageCss = `width:${R(W)}px;height:${R(H)}px;${M.baseCss}`;
    return pages.map((h, i) => ({w: R(W), h: R(H), label: "Page " + (i + 1),
      html: `<div class="ofc-page ofc-docx" style="${qa(pageCss)}"><div class="ofc-body" style="left:${R(ml)}px;top:${R(mt)}px;width:${R(CW)}px">${fillImgs(h, ctx)}</div></div>`}));
  }

  /* ================= PowerPoint ================= */
  const emu = v => num(v) / EMU;
  function aRun(e, th){
    const o = {};
    if (!e) return o;
    const v = k => at(e, k);
    if (v("sz") != null) o.sz = clamp(num(v("sz"), 1800), 100, 400000);
    if (v("b") != null) o.b = on(e, "b");
    if (v("i") != null) o.i = on(e, "i");
    if (v("u") != null) o.u = v("u") !== "none";
    if (v("strike") != null) o.s = v("strike") !== "noStrike";
    if (v("baseline") != null) o.base = num(v("baseline"));
    if (v("cap") != null) o.cap = v("cap");
    const f = kid(e, "a:solidFill") || (kid(e, "a:gradFill") && path(e, "a:gradFill", "a:gsLst", "a:gs"));
    if (f) { const c = dmlColor(f, th); if (c) o.color = css(c); }
    if (kid(e, "a:noFill")) o.color = "transparent";
    const hl = dmlColor(kid(e, "a:highlight"), th); if (hl) o.hl = css(hl);
    const lat = at(kid(e, "a:latin"), "typeface"); if (lat) o.font = lat;
    const link = at(kid(e, "a:hlinkClick"), "r:id"); if (link) o.link = link;
    return o;
  }
  function aPara(e, th){
    const o = {};
    if (!e) return o;
    const v = k => at(e, k);
    if (v("algn")) o.algn = {ctr: "center", r: "right", just: "justify", dist: "justify", justLow: "justify"}[v("algn")] || "left";
    if (v("marL") != null) o.marL = emu(v("marL"));
    if (v("indent") != null) o.ind = emu(v("indent"));
    const sp = (n, k) => { const x = kid(e, n); if (!x) return; const pc = at(kid(x, "a:spcPct"), "val"), pt = at(kid(x, "a:spcPts"), "val"); if (pc != null) o[k] = {pct: num(pc) / 100000}; else if (pt != null) o[k] = {pt: num(pt) / 100}; };
    sp("a:lnSpc", "ln"); sp("a:spcBef", "bef"); sp("a:spcAft", "aft");
    if (kid(e, "a:buNone")) o.bu = {t: "none"};
    else if (kid(e, "a:buChar")) o.bu = {t: "char", c: at(kid(e, "a:buChar"), "char") || "•"};
    else if (kid(e, "a:buAutoNum")) o.bu = {t: "auto", type: at(kid(e, "a:buAutoNum"), "type") || "arabicPeriod", start: num(at(kid(e, "a:buAutoNum"), "startAt"), 1)};
    else if (kid(e, "a:buBlip")) o.bu = {t: "char", c: "•"};
    if (kid(e, "a:buFont")) o.buFont = at(kid(e, "a:buFont"), "typeface");
    const bc = dmlColor(kid(e, "a:buClr"), th); if (bc) o.buClr = css(bc);
    if (kid(e, "a:buSzPct")) o.buSz = clamp(num(at(kid(e, "a:buSzPct"), "val"), 100000) / 100000, .25, 4);
    const d = kid(e, "a:defRPr"); if (d) o.r = aRun(d, th);
    return o;
  }
  const mergeP = (dst, src) => { if (!src) return dst; const r = dst.r; put(dst, src); if (src.r) dst.r = put(Object.assign({}, r), src.r); else if (r) dst.r = r; return dst; };
  const lvlEl = (lst, l) => kid(lst, `a:lvl${l + 1}pPr`);
  const themeFont = (f, th) => !f ? null : /^\+mj/.test(f) ? th.major : /^\+mn/.test(f) ? th.minor : f;
  function autoNum(n, type){
    const m = /^(alphaLc|alphaUc|romanLc|romanUc|arabic|circleNumDbPlain|circleNumWdBlackPlain)(.*)$/.exec(type || "") || [0, "arabic", "Period"];
    const s = fmtCount(n, m[1] === "arabic" || /^circle/.test(m[1]) ? "decimal" : m[1]);
    const t = m[2] || "Period";
    return t === "ParenR" ? s + ")" : t === "ParenBoth" ? "(" + s + ")" : t === "Plain" || t === "" ? s : t === "Minus" ? "- " + s : s + ".";
  }
  // A text body → HTML; T: {lists, bodyPrs, th, rels, ctx, color, out[], defSz, inset}
  function pText(tx, T){
    if (!tx) return "";
    const bp = {anchor: "t", scale: 1, lnRed: 0};
    for (const b of [...T.bodyPrs, kid(tx, "a:bodyPr")]) {
      if (!b) continue;
      for (const k of ["anchor", "lIns", "tIns", "rIns", "bIns", "wrap", "vert"]) if (at(b, k) != null) bp[k] = at(b, k);
      const na = kid(b, "a:normAutofit");
      if (na) { bp.scale = clamp(num(at(na, "fontScale"), 100000) / 100000, .1, 1); bp.lnRed = clamp(num(at(na, "lnSpcReduction")) / 100000, 0, .9); }
      else if (kid(b, "a:noAutofit") || kid(b, "a:spAutoFit")) { bp.scale = 1; bp.lnRed = 0; }
    }
    const lists = [...T.lists, kid(tx, "a:lstStyle")], th = T.th;
    const cnt = [];
    let html = "";
    for (const p of kids(tx, "a:p")) {
      const ppr = kid(p, "a:pPr"), lvl = clamp(num(at(ppr, "lvl")), 0, 8), P = {};
      for (const l of lists) if (l) mergeP(P, aPara(lvlEl(l, lvl), th));
      mergeP(P, aPara(ppr, th));
      const baseR = put(put({}, P.r), T.color ? {color: T.color} : null);
      let inner = "", text = "", firstSz = 0;
      for (const r of flat(p)) {
        if (r.n === "a:r" || r.n === "a:fld") {
          const rp = put(Object.assign({}, baseR), aRun(kid(r, "a:rPr"), th)), t = textOf(kid(r, "a:t"));
          if (!t) continue;
          const sz = (rp.sz || T.defSz || 1800) / 100 * bp.scale; if (!firstSz) firstSz = sz;
          inner += pRun(t, rp, sz, T); text += t;
        } else if (r.n === "a:br") { inner += "<br>"; text += "\n"; }
      }
      const endSz = (num(at(kid(p, "a:endParaRPr"), "sz"), 0) || (P.r && P.r.sz) || T.defSz || 1800) / 100 * bp.scale;
      if (!firstSz) firstSz = endSz;
      let marker = "";
      const has = text.trim().length > 0;
      if (P.bu && P.bu.t === "auto" && has) {
        cnt[lvl] = (cnt[lvl] == null ? P.bu.start - 1 : cnt[lvl]) + 1; cnt.length = lvl + 1;
        marker = autoNum(cnt[lvl], P.bu.type);
      } else {
        if (has) { cnt[lvl] = null; cnt.length = lvl + 1; }
        if (P.bu && P.bu.t === "char" && has) marker = bulletChar(P.bu.c, P.buFont, lvl);
      }
      const s = [];
      if (P.algn && P.algn !== "left") s.push("text-align:" + P.algn);
      const marL = clamp(num(P.marL), -2000, 4000), ind = clamp(num(P.ind), -2000, 2000);
      if (marL) s.push(`padding-left:${R(Math.max(0, marL))}px`);
      if (ind) s.push(`text-indent:${R(ind)}px`);
      const ln = P.ln;
      if (ln && ln.pct != null) s.push(`line-height:${R(clamp(ln.pct * (1 - bp.lnRed), .3, 5) * 1.2)}`);
      else if (ln && ln.pt != null) s.push(`line-height:${R(clamp(ln.pt * 4 / 3 * bp.scale, 2, 800))}px`);
      else if (bp.lnRed) s.push(`line-height:${R(1.2 * (1 - bp.lnRed))}`);
      const spc = x => !x ? 0 : x.pt != null ? x.pt * 4 / 3 * bp.scale : x.pct * firstSz * 4 / 3 * 1.2;
      const bef = spc(P.bef), aft = spc(P.aft);
      if (bef) s.push(`padding-top:${R(clamp(bef, 0, 600))}px`);
      if (aft) s.push(`padding-bottom:${R(clamp(aft, 0, 600))}px`);
      s.push(`font-size:${R(endSz * 4 / 3)}px`);
      let mk = "";
      if (marker) {
        const mc = [`font-size:${R(firstSz * 4 / 3 * (P.buSz || 1))}px`];
        const col = P.buClr || baseR.color; if (col) mc.push("color:" + col);
        if (P.bu.t === "auto") { const f = fontCss(themeFont(baseR.font, th)); if (f) mc.push("font-family:" + f); }
        if (ind < 0) mc.push(`min-width:${R(-ind)}px`);
        mk = `<span class="ofc-li" style="${qa(mc.join(";"))}">${esc(marker)}${ind < 0 ? "" : " "}</span>`;
      }
      html += `<div class="ofc-p" style="${qa(s.join(";"))}">${mk}${inner || "<br>"}</div>`;
      if (T.out) T.out.push((marker ? marker + " " : "") + text);
    }
    const ins = (k, d) => R(clamp(emu(bp[k] != null ? bp[k] : d), 0, 2000));
    const just = bp.anchor === "ctr" ? "center" : bp.anchor === "b" ? "flex-end" : "flex-start";
    const extra = (bp.wrap === "none" ? ";white-space:pre" : "") + (/^(vert|eaVert|wordArtVert|mongolianVert)$/.test(bp.vert || "") ? ";writing-mode:vertical-rl" : bp.vert === "vert270" ? ";writing-mode:vertical-rl;transform:rotate(180deg)" : "");
    return `<div class="ofc-tx" style="padding:${ins("tIns", 45720)}px ${ins("rIns", 91440)}px ${ins("bIns", 45720)}px ${ins("lIns", 91440)}px;justify-content:${just}${extra}">${html}</div>`;
  }
  function pRun(t, rp, sz, T){
    const s = [`font-size:${R(clamp(sz, 1, 4000) * 4 / 3 * (rp.base ? .7 : 1))}px`];
    const f = fontCss(themeFont(rp.font, T.th)); if (f) s.push("font-family:" + f);
    if (rp.b) s.push("font-weight:700");
    if (rp.i) s.push("font-style:italic");
    const d = [rp.u && "underline", rp.s && "line-through"].filter(Boolean); if (d.length) s.push("text-decoration:" + d.join(" "));
    if (rp.base) s.push("vertical-align:" + (rp.base > 0 ? "super" : "sub"));
    if (rp.cap === "all") s.push("text-transform:uppercase"); else if (rp.cap === "small") s.push("font-variant:small-caps");
    if (rp.hl) s.push("background-color:" + rp.hl);
    const rel = rp.link ? T.rels[rp.link] : null, url = rel && rel.ext ? safeUrl(rel.target) : null;
    if (url) s.push("color:" + (rp.color && rp.color !== T.color ? rp.color : "#" + (scheme(T.th, "hlink") || "0563C1")));
    else if (rp.color) s.push("color:" + rp.color);
    const span = `<span style="${qa(s.join(";"))}">${esc(t)}</span>`;
    return url ? `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${span}</a>` : span;
  }
  // Fill of an spPr-like element → {bg: css background} | {none:1} | {img: path} | null
  function pFill(e, th, env, ph){
    if (!e) return null;
    for (const c of e.c) {
      if (!isEl(c)) continue;
      if (c.n === "a:noFill") return {none: 1};
      if (c.n === "a:solidFill") { const k = dmlColor(c, th, ph); return k ? {bg: css(k), solid: k} : null; }
      if (c.n === "a:gradFill") {
        const gs = kids(kid(c, "a:gsLst"), "a:gs").map(g => ({pos: clamp(num(at(g, "pos")) / 1000, 0, 100), c: dmlColor(g, th, ph)})).filter(g => g.c).sort((a, b) => a.pos - b.pos);
        if (!gs.length) return null;
        if (gs.length === 1) return {bg: css(gs[0].c), solid: gs[0].c};
        const lin = kid(c, "a:lin"), ang = lin ? num(at(lin, "ang")) / 60000 : 90;
        const stops = gs.slice(0, 10).map(g => `${css(g.c)} ${R(g.pos)}%`).join(",");
        return {bg: kid(c, "a:path") ? `radial-gradient(circle,${stops})` : `linear-gradient(${R(ang + 90)}deg,${stops})`, solid: gs[0].c};
      }
      if (c.n === "a:blipFill") { const b = kid(c, "a:blip"), rel = env && b ? env.rels[at(b, "r:embed")] : null; return {img: rel && !rel.ext ? rel.target : null}; }
      if (c.n === "a:pattFill") { const k = dmlColor(kid(c, "a:fgClr"), th, ph); return k ? {bg: css(k), solid: k} : null; }
      if (c.n === "a:grpFill") return env && env.grpFill ? env.grpFill : null;
    }
    return null;
  }
  function pLine(spPr, th, ph){
    const l = kid(spPr, "a:ln");
    if (!l) return null;
    if (kid(l, "a:noFill")) return {none: 1};
    const c = dmlColor(kid(l, "a:solidFill"), th, ph) || dmlColor(path(l, "a:gradFill", "a:gsLst", "a:gs"), th, ph);
    const w = at(l, "w") != null ? clamp(emu(at(l, "w")), .5, 60) : null;
    const dash = at(kid(l, "a:prstDash"), "val");
    if (!c && w == null) return null;
    return {c: c ? css(c) : null, w, dash: dash && dash !== "solid" ? (/dot/i.test(dash) && !/dash/i.test(dash) ? "dotted" : "dashed") : null};
  }
  const PATHS = {
    triangle: (w, h) => `M${w / 2} 0L${w} ${h}L0 ${h}Z`, rtTriangle: (w, h) => `M0 0L${w} ${h}L0 ${h}Z`, diamond: (w, h) => `M${w / 2} 0L${w} ${h / 2}L${w / 2} ${h}L0 ${h / 2}Z`,
    parallelogram: (w, h) => `M${w * .25} 0L${w} 0L${w * .75} ${h}L0 ${h}Z`, trapezoid: (w, h) => `M${w * .25} 0L${w * .75} 0L${w} ${h}L0 ${h}Z`,
    pentagon: (w, h) => `M${w / 2} 0L${w} ${h * .38}L${w * .81} ${h}L${w * .19} ${h}L0 ${h * .38}Z`, hexagon: (w, h) => `M${w * .25} 0L${w * .75} 0L${w} ${h / 2}L${w * .75} ${h}L${w * .25} ${h}L0 ${h / 2}Z`,
    octagon: (w, h) => `M${w * .29} 0L${w * .71} 0L${w} ${h * .29}L${w} ${h * .71}L${w * .71} ${h}L${w * .29} ${h}L0 ${h * .71}L0 ${h * .29}Z`,
    homePlate: (w, h) => `M0 0L${w - Math.min(w, h) / 2} 0L${w} ${h / 2}L${w - Math.min(w, h) / 2} ${h}L0 ${h}Z`, chevron: (w, h) => { const k = Math.min(w, h) / 2; return `M0 0L${w - k} 0L${w} ${h / 2}L${w - k} ${h}L0 ${h}L${k} ${h / 2}Z`; },
    rightArrow: (w, h) => { const k = Math.min(w, h) / 2; return `M0 ${h * .25}L${w - k} ${h * .25}L${w - k} 0L${w} ${h / 2}L${w - k} ${h}L${w - k} ${h * .75}L0 ${h * .75}Z`; },
    leftArrow: (w, h) => { const k = Math.min(w, h) / 2; return `M${w} ${h * .25}L${k} ${h * .25}L${k} 0L0 ${h / 2}L${k} ${h}L${k} ${h * .75}L${w} ${h * .75}Z`; },
    upArrow: (w, h) => { const k = Math.min(w, h) / 2; return `M${w * .25} ${h}L${w * .25} ${k}L0 ${k}L${w / 2} 0L${w} ${k}L${w * .75} ${k}L${w * .75} ${h}Z`; },
    downArrow: (w, h) => { const k = Math.min(w, h) / 2; return `M${w * .25} 0L${w * .25} ${h - k}L0 ${h - k}L${w / 2} ${h}L${w} ${h - k}L${w * .75} ${h - k}L${w * .75} 0Z`; },
    star5: (w, h) => { let d = ""; for (let i = 0; i < 10; i++) { const r = i % 2 ? .38 : .5, a = -Math.PI / 2 + i * Math.PI / 5; d += (i ? "L" : "M") + R(w / 2 + Math.cos(a) * w * r) + " " + R(h / 2 + Math.sin(a) * h * r * 1.05 + h * .03); } return d + "Z"; },
    plus: (w, h) => { const a = w * .25, b = h * .25; return `M${a} 0L${w - a} 0L${w - a} ${b}L${w} ${b}L${w} ${h - b}L${w - a} ${h - b}L${w - a} ${h}L${a} ${h}L${a} ${h - b}L0 ${h - b}L0 ${b}L${a} ${b}Z`; },
  };
  PATHS.flowChartDecision = PATHS.diamond; PATHS.flowChartInputOutput = PATHS.parallelogram; PATHS.mathPlus = PATHS.plus; PATHS.flowChartExtract = PATHS.triangle;
  const LINES = /^(line|straightConnector1|bentConnector[2-5]|curvedConnector[2-5])$/;
  // One shape → HTML
  function pShape(e, env, xf){
    if (env.count.n++ >= MAX_SHAPES) { warn(env.ctx, "Some slides have too many shapes, so only the first " + MAX_SHAPES + " are shown."); return ""; }
    const th = env.th, nm = ln(e.n);
    if (nm === "grpSp") {
      const gp = kid(e, "p:grpSpPr"), x = kid(gp, "a:xfrm");
      if (!x || env.gdepth > 8) return "";
      const off = kid(x, "a:off"), ext = kid(x, "a:ext"), co = kid(x, "a:chOff"), ce = kid(x, "a:chExt");
      const sx = num(at(ce, "cx")) ? num(at(ext, "cx")) / num(at(ce, "cx")) : 1, sy = num(at(ce, "cy")) ? num(at(ext, "cy")) / num(at(ce, "cy")) : 1;
      const nx = {ax: xf.ax * sx, bx: xf.ax * (num(at(off, "x")) - num(at(co, "x")) * sx) + xf.bx, ay: xf.ay * sy, by: xf.ay * (num(at(off, "y")) - num(at(co, "y")) * sy) + xf.by};
      const gf = pFill(gp, th, env);
      const sub = Object.assign({}, env, {gdepth: (env.gdepth || 0) + 1, grpFill: gf && !gf.none ? gf : env.grpFill});
      return flat(e).map(c => /^(sp|pic|grpSp|graphicFrame|cxnSp)$/.test(ln(c.n)) ? pShape(c, sub, nx) : "").join("");
    }
    const nv = kid(e, "p:nvSpPr") || kid(e, "p:nvPicPr") || kid(e, "p:nvGraphicFramePr") || kid(e, "p:nvCxnSpPr") || kid(e, "p:nvGrpSpPr");
    const ph = path(nv, "p:nvPr", "p:ph");
    if (ph && env.layer !== "slide") return "";
    const inh = ph ? env.findPh(ph) : [];
    const spPr = kid(e, "p:spPr");
    let x = nm === "graphicFrame" ? kid(e, "p:xfrm") : kid(spPr, "a:xfrm"), useXf = xf;
    if (!x || !kid(x, "a:off")) { for (const i of inh) { const ix = kid(i.spPr, "a:xfrm"); if (ix && kid(ix, "a:off")) { x = ix; useXf = env.baseXf; break; } } }
    if (!x) return "";
    const off = kid(x, "a:off"), ext = kid(x, "a:ext");
    const bx = R(useXf.ax * num(at(off, "x")) + useXf.bx), by = R(useXf.ay * num(at(off, "y")) + useXf.by);
    const bw = R(clamp(useXf.ax * num(at(ext, "cx")), 0, 40000)), bh = R(clamp(useXf.ay * num(at(ext, "cy")), 0, 40000));
    const rot = num(at(x, "rot")) / 60000, fh = at(x, "flipH") === "1", fv = at(x, "flipV") === "1";
    const pos = `left:${bx}px;top:${by}px;width:${bw}px;height:${bh}px` + (rot ? `;transform:rotate(${R(rot)}deg)` : "");
    const alt = at(kid(nv, "p:cNvPr"), "descr") || "";
    if (nm === "pic") {
      const bf = kid(e, "p:blipFill"), b = kid(bf, "a:blip"), rel = b ? env.rels[at(b, "r:embed")] : null, sr = kid(bf, "a:srcRect");
      if (!b) return "";
      let ist = "position:absolute;left:0;top:0;width:100%;height:100%";
      if (sr) {
        const l = num(at(sr, "l")) / 1e5, t = num(at(sr, "t")) / 1e5, r = num(at(sr, "r")) / 1e5, bb = num(at(sr, "b")) / 1e5;
        const iw = bw / clamp(1 - l - r, .02, 50), ih = bh / clamp(1 - t - bb, .02, 50);
        ist = `position:absolute;left:${R(-l * iw)}px;top:${R(-t * ih)}px;width:${R(iw)}px;height:${R(ih)}px;max-width:none`;
      }
      const geom = at(kid(spPr, "a:prstGeom"), "prst");
      const rad = geom === "ellipse" ? ";border-radius:50%" : geom === "roundRect" ? ";border-radius:8%" : "";
      const flip = fh || fv ? `;transform:scale(${fh ? -1 : 1},${fv ? -1 : 1})` : "";
      env.out.picture = true;
      return `<div class="ofc-sp ofc-clip" style="${qa(pos + rad)}">${imgTok(env.ctx, rel && !rel.ext ? rel.target : null, ist + flip, alt)}</div>`;
    }
    if (nm === "graphicFrame") {
      const gd = path(e, "a:graphic", "a:graphicData"), uri = at(gd, "uri") || "";
      if (kid(gd, "a:tbl")) return `<div class="ofc-sp" style="${qa(pos)}">${pTable(kid(gd, "a:tbl"), env, bw)}</div>`;
      if (/diagram/.test(uri) && env.diagram) { const d = env.diagram(gd, {ax: 1 / EMU, bx: bx, ay: 1 / EMU, by: by}); if (d) return d; }
      const label = /chart/.test(uri) ? "Chart" : /diagram/.test(uri) ? "Diagram" : "Object";
      return `<div class="ofc-sp" style="${qa(pos)}">${imgTok(env.ctx, null, "width:100%;height:100%", alt, label)}</div>`;
    }
    // sp / cxnSp
    const style = kid(e, "p:style");
    const refColor = n => { const r = kid(style, "a:" + n); return r && num(at(r, "idx")) > 0 ? dmlColor(r, th) : null; };
    let fill = pFill(spPr, th, env);
    for (const i of inh) if (!fill) fill = pFill(i.spPr, th, env);
    if (!fill) { const c = refColor("fillRef"); if (c) fill = {bg: css(c), solid: c}; }
    let line = pLine(spPr, th);
    for (const i of inh) if (!line) line = pLine(i.spPr, th);
    const lref = refColor("lnRef");
    if (!line && lref) line = {c: css(lref), w: clamp(num(at(kid(style, "a:lnRef"), "idx")), 1, 3) * 1.33};
    else if (line && !line.none && !line.c) line.c = lref ? css(lref) : "#000";
    if (line && !line.none && line.w == null) line.w = 1.33;
    const prst = at(kid(spPr, "a:prstGeom"), "prst") || (inh.map(i => at(kid(i.spPr, "a:prstGeom"), "prst")).find(Boolean)) || "rect";
    let geo = "";
    const hasFill = fill && !fill.none, hasLine = line && !line.none;
    if (LINES.test(prst) || nm === "cxnSp") {
      if (hasLine) {
        const x1 = fh ? bw : 0, x2 = fh ? 0 : bw, y1 = fv ? bh : 0, y2 = fv ? 0 : bh;
        geo = `<svg class="ofc-geo" style="width:${R(Math.max(bw, 1))}px;height:${R(Math.max(bh, 1))}px;overflow:visible" viewBox="0 0 ${R(Math.max(bw, 1))} ${R(Math.max(bh, 1))}"><line x1="${R(x1)}" y1="${R(y1)}" x2="${R(x2)}" y2="${R(y2)}" style="stroke:${qa(line.c)};stroke-width:${R(line.w)}px${line.dash ? `;stroke-dasharray:${line.dash === "dotted" ? R(line.w) + " " + R(line.w * 2) : R(line.w * 4) + " " + R(line.w * 3)}` : ""}"/></svg>`;
      }
    } else if (PATHS[prst] && (hasFill || hasLine)) {
      const d = PATHS[prst](Math.max(bw, 1), Math.max(bh, 1)).replace(/-?\d+\.\d{3,}/g, m => String(R(Number(m))));
      const fc = hasFill ? (fill.solid ? css(fill.solid) : "#ccc") : "none";
      geo = `<svg class="ofc-geo" style="width:${R(Math.max(bw, 1))}px;height:${R(Math.max(bh, 1))}px;overflow:visible${fh || fv ? `;transform:scale(${fh ? -1 : 1},${fv ? -1 : 1})` : ""}" viewBox="0 0 ${R(Math.max(bw, 1))} ${R(Math.max(bh, 1))}"><path d="${d}" style="fill:${qa(fc)};stroke:${hasLine ? qa(line.c) : "none"};stroke-width:${hasLine ? R(line.w) : 0}px"/></svg>`;
    } else if (hasFill || hasLine) {
      const s = [];
      if (hasFill && fill.bg) s.push("background:" + fill.bg);
      if (hasLine) s.push(`border:${R(line.w)}px ${line.dash || "solid"} ${line.c}`);
      if (prst === "ellipse" || prst === "flowChartConnector") s.push("border-radius:50%");
      else if (prst === "roundRect" || prst === "flowChartAlternateProcess") s.push(`border-radius:${R(Math.min(bw, bh) * .1667)}px`);
      geo = `<div class="ofc-geo" style="${qa(s.join(";"))}">${hasFill && fill.img !== undefined ? imgTok(env.ctx, fill.img, "position:absolute;inset:0;width:100%;height:100%", "") : ""}</div>`;
    }
    if (hasFill && fill.img !== undefined && !geo) geo = `<div class="ofc-geo">${imgTok(env.ctx, fill.img, "position:absolute;inset:0;width:100%;height:100%", "")}</div>`;
    let txt = "";
    const tx = kid(e, "p:txBody");
    if (tx) {
      const type = ph ? (at(ph, "type") || "body") : "";
      const isTitle = /^(title|ctrTitle)$/.test(type);
      const mst = env.master, lists = [];
      if (ph) lists.push(isTitle ? mst.tx.title : /^(dt|ftr|sldNum)$/.test(type) ? mst.tx.other : mst.tx.body);
      else lists.push(env.defText);
      for (let k = inh.length - 1; k >= 0; k--) lists.push(kid(inh[k].txBody, "a:lstStyle"));
      const fref = kid(style, "a:fontRef"), fc = fref ? dmlColor(fref, th) : null;
      txt = pText(tx, {lists, bodyPrs: inh.slice().reverse().map(i => kid(i.txBody, "a:bodyPr")), th, rels: env.rels, ctx: env.ctx, color: fc ? css(fc) : null, out: env.text, defSz: 1800});
    }
    if (!geo && !txt) return "";
    return `<div class="ofc-sp" style="${qa(pos)}">${geo}${txt}</div>`;
  }
  function pTable(tbl, env, bw){
    const th = env.th, grid = kids(kid(tbl, "a:tblGrid"), "a:gridCol").map(g => clamp(emu(at(g, "w")), 1, 4000));
    const tp = kid(tbl, "a:tblPr"), styled = true, firstRow = at(tp, "firstRow") === "1", band = at(tp, "bandRow") === "1";
    const acc = scheme(th, "accent1") || "4472C4";
    let rows = "", ri = 0;
    const trs = kids(tbl, "a:tr").slice(0, 300);
    for (const tr of trs) {
      let h = "";
      for (const tc of kids(tr, "a:tc")) {
        if (at(tc, "hMerge") === "1" || at(tc, "vMerge") === "1") continue;
        const pr = kid(tc, "a:tcPr"), s = [];
        const hdr = firstRow && ri === 0;
        let f = pFill(pr, th, env);
        if (!f && styled) f = {bg: "#" + (hdr ? acc : band ? lumTint(acc, (ri - (firstRow ? 1 : 0)) % 2 ? .8 : .9) : "FFFFFF")};
        if (f && f.bg) s.push("background:" + f.bg);
        for (const [k, n] of [["left", "a:lnL"], ["right", "a:lnR"], ["top", "a:lnT"], ["bottom", "a:lnB"]]) {
          const l = kid(pr, n);
          if (l && !kid(l, "a:noFill")) { const c = dmlColor(kid(l, "a:solidFill"), th); if (c) s.push(`border-${k}:${R(clamp(emu(at(l, "w") || 12700), .5, 20))}px solid ${css(c)}`); }
          else if (!l && styled) s.push(`border-${k}:1px solid #fff`);
        }
        const m = (k, d) => R(clamp(emu(at(pr, k) != null ? at(pr, k) : d), 0, 500));
        s.push(`padding:${m("marT", 45720)}px ${m("marR", 91440)}px ${m("marB", 45720)}px ${m("marL", 91440)}px`);
        const an = at(pr, "anchor"); s.push("vertical-align:" + (an === "ctr" ? "middle" : an === "b" ? "bottom" : "top"));
        const out = [];
        const t = pText(kid(tc, "a:txBody"), {lists: [env.defText], bodyPrs: [], th, rels: env.rels, ctx: env.ctx, color: hdr && styled ? "#FFFFFF" : null, out, defSz: 1800});
        env.cells.push(out.join(" "));
        const gs = clamp(num(at(tc, "gridSpan"), 1), 1, 60), rs = clamp(num(at(tc, "rowSpan"), 1), 1, 300);
        h += `<td${gs > 1 ? ` colspan="${gs}"` : ""}${rs > 1 ? ` rowspan="${rs}"` : ""} style="${qa(s.join(";"))}"${hdr ? ' class="ofc-th"' : ""}>${t.replace(/^<div class="ofc-tx" style="[^"]*">/, '<div class="ofc-tc">')}</td>`;
      }
      rows += `<tr style="height:${R(clamp(emu(at(tr, "h")), 0, 4000))}px">${h}</tr>`;
      env.cells.push("\n");
      ri++;
    }
    const tw = grid.reduce((a, b) => a + b, 0) || bw;
    return `<table class="ofc-ptbl" style="width:${R(tw)}px"><colgroup>${grid.map(g => `<col style="width:${R(g)}px">`).join("")}</colgroup><tbody>${rows}</tbody></table>`;
  }
  async function pptxModel(z, ctx){
    const main = await mainPart(z, "ppt/presentation.xml"), pres = await z.xml(main);
    if (!pres) throw err("bad", "This PowerPoint file looks damaged, so Studyboard can't show it.");
    const prel = await relsOf(z, main), sz = kid(pres, "p:sldSz");
    const W = R(clamp(sz ? emu(at(sz, "cx")) : 960, 100, 6000)), H = R(clamp(sz ? emu(at(sz, "cy")) : 540, 100, 6000));
    const defText = kid(pres, "p:defaultTextStyle");
    let list = kids(kid(pres, "p:sldIdLst"), "p:sldId").map(s => prel[at(s, "r:id")]).filter(r => r && !r.ext && z.has(r.target)).map(r => r.target);
    if (list.length > MAX_PAGES) { warn(ctx, `Only the first ${MAX_PAGES} slides are shown.`); list = list.slice(0, MAX_PAGES); }
    const parts = new Map();
    const phIndex = sp => {
      const out = [];
      for (const e of findAll(kid(kid(sp, "p:cSld"), "p:spTree"), "p:sp").concat(findAll(kid(kid(sp, "p:cSld"), "p:spTree"), "p:pic"))) {
        const ph = path(kid(e, "p:nvSpPr") || kid(e, "p:nvPicPr"), "p:nvPr", "p:ph"); if (!ph) continue;
        out.push({type: at(ph, "type") || "body", idx: at(ph, "idx"), spPr: kid(e, "p:spPr"), txBody: kid(e, "p:txBody")});
      }
      return out;
    };
    const loadPart = async (p, kind) => {
      if (parts.has(p)) return parts.get(p);
      const x = await z.xml(p), rels = await relsOf(z, p), o = {x, rels, ph: phIndex(x), path: p};
      parts.set(p, o);
      if (kind === "master") {
        const t = relType(rels, "theme"), th = readTheme(t ? await z.xml(t.target) : null), cm = kid(x, "p:clrMap");
        if (cm) for (const k in cm.a) if (/^[a-z]+\d?$/i.test(k) && DEF_THEME[cm.a[k]] !== undefined) th.map[k] = cm.a[k];
        o.th = th;
        const ts = kid(x, "p:txStyles");
        o.tx = {title: kid(ts, "p:titleStyle"), body: kid(ts, "p:bodyStyle"), other: kid(ts, "p:otherStyle")};
      } else if (kind === "layout") {
        const m = relType(rels, "slideMaster");
        o.master = m ? await loadPart(m.target, "master") : null;
      }
      return o;
    };
    const normType = t => /^(title|ctrTitle)$/.test(t) ? "title" : /^(dt|ftr|sldNum|hdr)$/.test(t) ? t : "body";
    const bgOf = (x, th, env) => {
      const bg = kid(kid(x, "p:cSld"), "p:bg"); if (!bg) return null;
      const pr = kid(bg, "p:bgPr");
      if (pr) return pFill(pr, th, env);
      const ref = kid(bg, "p:bgRef"); if (ref) { const c = dmlColor(ref, th); return c ? {bg: css(c)} : null; }
      return null;
    };
    const pages = [], texts = [];
    let n = 0;
    for (const sp of list) {
      n++;
      const x = await z.xml(sp); if (!x) continue;
      const rels = await relsOf(z, sp), lr = relType(rels, "slideLayout");
      const layout = lr ? await loadPart(lr.target, "layout") : null, master = layout && layout.master ? layout.master : {th: readTheme(null), tx: {}, ph: [], x: null, rels: {}};
      const th = master.th;
      const findPh = ph => {
        const type = at(ph, "type") || "body", idx = at(ph, "idx"), out = [];
        const L = layout ? layout.ph : [];
        const lp = (idx != null && L.find(p => p.idx === idx)) || L.find(p => p.type === type) || L.find(p => normType(p.type) === normType(type) && normType(type) !== "body") || (idx == null ? L.find(p => normType(p.type) === normType(type)) : null);
        if (lp) out.push(lp);
        const mt = normType(lp ? lp.type : type), mp = master.ph.find(p => normType(p.type) === mt);
        if (mp) out.push(mp);
        return out;
      };
      const text = [], cells = [];
      const baseXf = {ax: 1 / EMU, bx: 0, ay: 1 / EMU, by: 0};
      const mkEnv = (part, layer) => ({th, rels: part.rels, ctx, findPh, master, defText, layer, count: {n: 0}, text: layer === "slide" ? text : null, cells, baseXf, out: {}, diagram: null});
      const draw = (part, layer) => {
        const env = mkEnv(part, layer), tree = kid(kid(part.x, "p:cSld"), "p:spTree");
        if (layer === "slide") {
          env.diagram = (gd, xf) => diagrams.get(gd) ? diagrams.get(gd)(env, xf) : "";
        }
        env.count = counter;
        return flat(tree).map(c => /^(sp|pic|grpSp|graphicFrame|cxnSp)$/.test(ln(c.n)) ? pShape(c, env, baseXf) : "").join("");
      };
      const counter = {n: 0};
      // SmartArt: its saved drawing
      const diagrams = new Map();
      for (const gd of findAll(kid(kid(x, "p:cSld"), "p:spTree"), "a:graphicData")) {
        if (!/diagram/.test(at(gd, "uri") || "")) continue;
        const dm = rels[at(kid(gd, "dgm:relIds"), "r:dm")];
        if (!dm || dm.ext) continue;
        const data = await z.xml(dm.target), ext = find(data, "dsp:dataModelExt"), dr = ext ? rels[at(ext, "relId")] : null;
        if (!dr || dr.ext) continue;
        const dx = await z.xml(dr.target, {dsp: "p"}), drels = await relsOf(z, dr.target);
        if (!dx) continue;
        diagrams.set(gd, (env, xf) => {
          const tree = find(dx, "p:spTree"); if (!tree) return "";
          const de = Object.assign({}, env, {rels: drels, layer: "diagram"});
          return flat(tree).map(c => /^(sp|pic|grpSp|cxnSp)$/.test(ln(c.n)) ? pShape(c, de, xf) : "").join("");
        });
      }
      const showM = p => !p || !p.x || at(p.x, "showMasterSp") !== "0";
      let body = "";
      if (master.x && showM(layout) && at(x, "showMasterSp") !== "0") body += draw(master, "master");
      if (layout && layout.x && at(x, "showMasterSp") !== "0") body += draw(layout, "layout");
      body += draw({x, rels}, "slide");
      const bgEnv = p => ({rels: p.rels});
      const bg = bgOf(x, th, bgEnv({rels})) || (layout && bgOf(layout.x, th, bgEnv(layout))) || (master.x && bgOf(master.x, th, bgEnv(master))) || {bg: "#" + (scheme(th, "bg1") || "FFFFFF")};
      let bgHtml = "", bgCss = "background:#fff";
      if (bg.img !== undefined) bgHtml = imgTok(ctx, bg.img, "position:absolute;left:0;top:0;width:100%;height:100%;object-fit:fill", "");
      else if (bg.bg) bgCss = "background:" + bg.bg;
      // speaker notes
      let notes = "";
      const nr = relType(rels, "notesSlide");
      if (nr) {
        const nx = await z.xml(nr.target);
        for (const s of findAll(nx, "p:sp")) {
          const ph = path(kid(s, "p:nvSpPr"), "p:nvPr", "p:ph");
          if (ph && at(ph, "type") === "body") notes += kids(kid(s, "p:txBody"), "a:p").map(p => findAll(p, "a:t").map(textOf).join("")).join("\n");
        }
        notes = notes.trim();
      }
      const hidden = at(x, "show") === "0";
      const tabText = cells.join("\t").replace(/\t\n\t?/g, "\n").trim();
      texts.push(`Slide ${n}:\n` + text.filter(t => t.trim()).join("\n") + (tabText ? "\n" + tabText : "") + (notes ? "\nSpeaker notes: " + notes : ""));
      pages.push({w: W, h: H, label: "Slide " + n + (hidden ? " (hidden)" : ""), notes,
        html: `<div class="ofc-page ofc-pptx" style="${qa(`width:${W}px;height:${H}px;${bgCss}`)}">${bgHtml}${body}</div>`});
    }
    if (!pages.length) pages.push({w: W, h: H, label: "Slide 1", notes: "", html: `<div class="ofc-page ofc-pptx" style="width:${W}px;height:${H}px;background:#fff"></div>`});
    return {kind: "pptx", pages, text: texts.join("\n\n")};
  }

  /* ================= Excel and CSV ================= */
  const BUILTIN = {0: "General", 1: "0", 2: "0.00", 3: "#,##0", 4: "#,##0.00", 5: '"$"#,##0_);("$"#,##0)', 6: '"$"#,##0_);[Red]("$"#,##0)', 7: '"$"#,##0.00_);("$"#,##0.00)', 8: '"$"#,##0.00_);[Red]("$"#,##0.00)',
    9: "0%", 10: "0.00%", 11: "0.00E+00", 12: "General", 13: "General", 14: "m/d/yyyy", 15: "d-mmm-yy", 16: "d-mmm", 17: "mmm-yy", 18: "h:mm AM/PM", 19: "h:mm:ss AM/PM", 20: "h:mm", 21: "h:mm:ss", 22: "m/d/yyyy h:mm",
    37: "#,##0 ;(#,##0)", 38: "#,##0 ;[Red](#,##0)", 39: "#,##0.00;(#,##0.00)", 40: "#,##0.00;[Red](#,##0.00)", 41: '_(* #,##0_);_(* \\(#,##0\\);_(* "-"_);_(@_)', 42: '_("$"* #,##0_);_("$"* \\(#,##0\\);_("$"* "-"_);_(@_)',
    43: '_(* #,##0.00_);_(* \\(#,##0.00\\);_(* "-"??_);_(@_)', 44: '_("$"* #,##0.00_);_("$"* \\(#,##0.00\\);_("$"* "-"??_);_(@_)', 45: "mm:ss", 46: "[h]:mm:ss", 47: "mm:ss.0", 48: "##0.0E+0", 49: "@"};
  const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  function general(v){
    if (!Number.isFinite(v)) return String(v);
    if (v === 0) return "0";
    const a = Math.abs(v);
    if (a >= 1e11 || a < 1e-9) return v.toExponential(5).replace(/\.?0+e/, "e").replace("e", "E").replace(/E([+-])(\d)$/, "E$10$2");
    const intLen = Math.floor(Math.log10(a)) + 1;
    return String(Number(v.toFixed(clamp(10 - Math.max(intLen, 0), 0, 10))));
  }
  function splitSec(code){
    const out = []; let cur = "", q = false;
    for (let i = 0; i < code.length; i++) {
      const ch = code[i];
      if (ch === '"') q = !q;
      if (ch === "\\" && !q) { cur += ch + (code[i + 1] || ""); i++; continue; }
      if (ch === ";" && !q) { out.push(cur); cur = ""; continue; }
      cur += ch;
    }
    out.push(cur); return out;
  }
  const isDateFmt = s => { const t = s.replace(/"[^"]*"/g, "").replace(/\\./g, "").replace(/\[(?!h+\]|m+\]|s+\])[^\]]*\]/gi, ""); return /[ydhs]/i.test(t) || (/m/i.test(t) && !/[#0?]/.test(t)); };
  function serialDate(v, d1904){
    let days = v + (d1904 ? 1462 : 0);
    if (!d1904 && days < 61) days += 1;
    const ms = Math.round((days - 25569) * 864e5);
    return new Date(ms);
  }
  function fmtDate(v, sec, d1904){
    if (!(v > -1e7 && v < 3e6)) return general(v);
    const d = serialDate(v, d1904);
    if (isNaN(d)) return general(v);
    const toks = sec.match(/\[h+\]|\[m+\]|\[s+\]|yyyy|yyy|yy|y|mmmmm|mmmm|mmm|mm|m|dddd|ddd|dd|d|hh|h|ss|s|AM\/PM|am\/pm|A\/P|a\/p|\.0+|"[^"]*"|\\.|_.|\*.|[[\]]|./gi) || [];
    const ampm = toks.some(t => /^(AM\/PM|A\/P)$/i.test(t));
    const isTime = (i, dir) => { for (let k = i + dir; k >= 0 && k < toks.length; k += dir) { const t = toks[k].toLowerCase(); if (/^(h+|\[h+\])$/.test(t)) return dir < 0; if (/^(s+|\[s+\])$/.test(t)) return dir > 0; if (/^[ydm]/.test(t)) return false; } return false; };
    let H = d.getUTCHours(), out = "";
    const p2 = n => String(n).padStart(2, "0");
    toks.forEach((t0, i) => {
      const t = t0.toLowerCase();
      if (t === "yyyy" || t === "yyy") out += d.getUTCFullYear();
      else if (t === "yy" || t === "y") out += p2(d.getUTCFullYear() % 100);
      else if (t === "mmmmm") out += MONTHS[d.getUTCMonth()][0];
      else if (t === "mmmm") out += MONTHS[d.getUTCMonth()];
      else if (t === "mmm") out += MONTHS[d.getUTCMonth()].slice(0, 3);
      else if (t === "mm" || t === "m") { const min = isTime(i, -1) || isTime(i, 1); const val = min ? d.getUTCMinutes() : d.getUTCMonth() + 1; out += t === "mm" ? p2(val) : val; }
      else if (t === "dddd") out += DAYS[d.getUTCDay()];
      else if (t === "ddd") out += DAYS[d.getUTCDay()].slice(0, 3);
      else if (t === "dd") out += p2(d.getUTCDate());
      else if (t === "d") out += d.getUTCDate();
      else if (t === "hh" || t === "h") { let h = H; if (ampm) h = h % 12 || 12; out += t === "hh" ? p2(h) : h; }
      else if (t === "ss" || t === "s") out += t === "ss" ? p2(d.getUTCSeconds()) : d.getUTCSeconds();
      else if (/^\[h+\]$/.test(t)) out += Math.floor(v * 24);
      else if (/^\[m+\]$/.test(t)) out += Math.floor(v * 1440);
      else if (/^\[s+\]$/.test(t)) out += Math.floor(v * 86400);
      else if (t === "am/pm") out += H < 12 ? "AM" : "PM";
      else if (t === "a/p") out += H < 12 ? "A" : "P";
      else if (t[0] === ".") out += "." + String(d.getUTCMilliseconds()).padStart(3, "0").slice(0, t.length - 1);
      else if (t[0] === '"') out += t0.slice(1, -1);
      else if (t[0] === "\\") out += t0[1];
      else if (t[0] === "_") out += " ";
      else if (t[0] === "*" || t === "[" || t === "]") { /* fill / brackets */ }
      else out += t0;
    });
    return out;
  }
  const literal = s => s.replace(/"([^"]*)"|\\(.)|_.|\*.|\[[^\]]*\]/g, (m, q, e) => q !== undefined ? q : e !== undefined ? e : m[0] === "_" ? " " : "");
  function fmtNum(v, sec){
    let s = sec.replace(/\[\$([^\]-]*)(-[^\]]*)?\]/g, (m, sym) => sym ? `"${sym}"` : "").replace(/\[(Red|Black|Blue|Green|White|Yellow|Magenta|Cyan|Color\s*\d+)\]/gi, "").replace(/\[[<>=][^\]]*\]/g, "");
    // find the number part outside quotes
    let first = -1, last = -1, q = false;
    for (let i = 0; i < s.length; i++) {
      const c = s[i];
      if (c === '"') { q = !q; continue; }
      if (q) continue;
      if (c === "\\" || c === "_" || c === "*") { i++; continue; }
      if (/[0#?]/.test(c) || (c === "." && /[0#?]/.test(s[i + 1] || "")) || (c === "," && first >= 0)) { if (first < 0) first = i; last = i; }
      else if (/[eE]/.test(c) && first >= 0 && /[+-]/.test(s[i + 1] || "")) { last = i + 1; while (/[0#]/.test(s[last + 1] || "")) last++; i = last; }
    }
    if (first < 0) return literal(s).trim() ? literal(s) : general(v);
    const pre = s.slice(0, first), pat = s.slice(first, last + 1), post = s.slice(last + 1);
    const pct = (literal(pre + post).match(/%/g) || []).length;
    v *= Math.pow(100, pct);
    let out;
    const em = /^([0#?.,]*)[eE]([+-])([0#]+)$/.exec(pat);
    if (em) {
      const dec = (em[1].split(".")[1] || "").length;
      const [m, e] = Math.abs(v).toExponential(dec).split("e"); const en = Number(e);
      out = m + "E" + (en < 0 ? "-" : "+") + String(Math.abs(en)).padStart(em[3].length, "0");
    } else {
      let ip = pat, dp = "";
      const dot = pat.indexOf(".");
      if (dot >= 0) { ip = pat.slice(0, dot); dp = pat.slice(dot + 1).replace(/,/g, ""); }
      let scale = 0; while (ip.endsWith(",")) { scale++; ip = ip.slice(0, -1); }
      v /= Math.pow(1000, scale);
      const group = ip.includes(","), minInt = (ip.match(/0/g) || []).length, decMax = (dp.match(/[0#?]/g) || []).length, decMin = (dp.match(/0/g) || []).length;
      let str = Math.abs(v).toFixed(decMax);
      let [i, f = ""] = str.split(".");
      while (f.length > decMin && f.endsWith("0")) f = f.slice(0, -1);
      if (i === "0" && minInt === 0) i = "";
      i = i.padStart(minInt, "0");
      const qInt = (ip.match(/\?/g) || []).length; if (qInt) i = i.padStart(minInt + qInt, " ");
      if (group) i = i.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      out = i + (dot >= 0 && (f || decMin) ? "." + f : dot >= 0 && pat.endsWith(".") ? "." : "");
    }
    return literal(pre) + out + literal(post);
  }
  function fmtCell(v, code, d1904){
    code = code == null ? "General" : String(code);
    if (/^general$/i.test(code.trim()) || !code.trim()) return general(v);
    const secs = splitSec(code);
    let sec = secs[0], neg = false;
    if (v < 0 && secs.length > 1 && secs[1].trim()) { sec = secs[1]; v = -v; }
    else if (v < 0) neg = true;
    else if (v === 0 && secs.length > 2 && secs[2] !== undefined && secs[2].trim()) sec = secs[2];
    if (/^general$/i.test(sec.replace(/\[[^\]]*\]/g, "").trim())) return (neg ? "-" : "") + general(Math.abs(v));
    if (isDateFmt(sec)) return fmtDate(neg ? -v : v, sec, d1904);
    const s = fmtNum(neg ? -v : v, sec);
    return neg && /\d/.test(s) ? "-" + s : s;
  }
  const colName = i => { let s = ""; i++; while (i > 0) { const m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); } return s; };
  const refRC = ref => { const m = /^\$?([A-Z]{1,3})\$?(\d{1,7})$/i.exec(ref || ""); if (!m) return null; let c = 0; for (const ch of m[1].toUpperCase()) c = c * 26 + ch.charCodeAt(0) - 64; return {r: Number(m[2]) - 1, c: c - 1}; };
  const INDEXED = "000000 FFFFFF FF0000 00FF00 0000FF FFFF00 FF00FF 00FFFF 000000 FFFFFF FF0000 00FF00 0000FF FFFF00 FF00FF 00FFFF 800000 008000 000080 808000 800080 008080 C0C0C0 808080 9999FF 993366 FFFFCC CCFFFF 660066 FF8080 0066CC CCCCFF 000080 FF00FF FFFF00 00FFFF 800080 800000 008080 0000FF 00CCFF CCFFFF CCFFCC FFFF99 99CCFF FF99CC CC99FF FFCC99 3366FF 33CCCC 99CC00 FFCC00 FF9900 FF6600 666699 969696 003366 339966 003300 333300 993300 993366 333399 333333".split(" ");
  const XL_THEME = ["lt1", "dk1", "lt2", "dk2", "accent1", "accent2", "accent3", "accent4", "accent5", "accent6", "hlink", "folHlink"];
  function xlColor(e, th){
    if (!e) return null;
    let h = null;
    const rgb = at(e, "rgb");
    if (rgb) h = hex6(rgb.length === 8 ? rgb.slice(2) : rgb);
    else if (at(e, "theme") != null) h = (th || DEF_THEME)[XL_THEME[num(at(e, "theme"))]] || null;
    else if (at(e, "indexed") != null) { const i = num(at(e, "indexed")); h = INDEXED[i] || (i === 64 ? "000000" : null); }
    if (h && at(e, "tint") != null) h = lumTint(h, clamp(num(at(e, "tint")), -1, 1));
    return h;
  }
  function xlStyles(sx, th){
    const S = {fmts: {}, xf: [], fonts: [], fills: [], borders: []};
    if (!sx) return S;
    for (const f of kids(kid(sx, "numFmts"), "numFmt")) S.fmts[at(f, "numFmtId")] = at(f, "formatCode") || "General";
    S.fonts = kids(kid(sx, "fonts"), "font").map(f => ({b: on(kid(f, "b"), "val"), i: on(kid(f, "i"), "val"), u: kid(f, "u") ? at(kid(f, "u"), "val") !== "none" : false, s: on(kid(f, "strike"), "val"), sz: num(at(kid(f, "sz"), "val"), 11), color: xlColor(kid(f, "color"), th), name: at(kid(f, "name"), "val")}));
    S.fills = kids(kid(sx, "fills"), "fill").map(f => { const p = kid(f, "patternFill"); if (!p || !at(p, "patternType") || at(p, "patternType") === "none") { const g = kid(f, "gradientFill"); return g ? xlColor(kid(kid(g, "stop"), "color"), th) : null; } return xlColor(kid(p, "fgColor"), th) || (at(p, "patternType") === "solid" ? null : xlColor(kid(p, "bgColor"), th)); });
    S.borders = kids(kid(sx, "borders"), "border").map(b => { const o = {}; for (const k of ["left", "right", "top", "bottom"]) { const e = kid(b, k), st = at(e, "style"); if (st && st !== "none") o[k] = `${/medium|thick/.test(st) ? (st === "thick" ? 3 : 2) : 1}px ${/dash/.test(st) ? "dashed" : /dot|hair/.test(st) ? "dotted" : st === "double" ? "double" : "solid"} #${xlColor(kid(e, "color"), th) || "000000"}`; } return o; });
    S.xf = kids(kid(sx, "cellXfs"), "xf").map(x => { const al = kid(x, "alignment"); return {fmt: at(x, "numFmtId") || "0", font: num(at(x, "fontId")), fill: num(at(x, "fillId")), border: num(at(x, "borderId")), h: at(al, "horizontal"), v: at(al, "vertical"), wrap: on(kid(x, "alignment"), "wrapText") && at(al, "wrapText") != null, indent: num(at(al, "indent"))}; });
    return S;
  }
  const cellText = s => decode(s.replace(/<(?:\w+:)?rPh\b[\s\S]*?<\/(?:\w+:)?rPh>/g, "").replace(/<[^>]*>/g, ""));
  // One sheet's cells, read straight from the XML (sheets can be huge)
  function xlSheet(src, ss, S, th, d1904, ctx, budget){
    const sdS = src.search(/<(?:\w+:)?sheetData\b/), sdE = src.search(/<\/(?:\w+:)?sheetData>/);
    const head = parseXml(sdS >= 0 ? src.slice(0, sdS) + (sdE > sdS ? src.slice(sdE + src.slice(sdE).indexOf(">") + 1) : "") : src);
    const data = sdS >= 0 ? src.slice(sdS, sdE > sdS ? sdE : src.length) : "";
    const cells = new Map(), rowH = {}, rowHide = {};
    let maxR = -1, maxC = -1, truncR = false, truncC = false, r = -1;
    const ROW = /<(?:\w+:)?row\b([^>]*?)(\/?)>([\s\S]*?)(?=<(?:\w+:)?row\b|$)/g, CELL = /<(?:\w+:)?c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/(?:\w+:)?c>)/g;
    const attrs = s => { const o = {}; ATTR.lastIndex = 0; let x; while ((x = ATTR.exec(s))) o[x[1]] = x[2] !== undefined ? x[2] : x[3]; return o; };
    let m;
    while ((m = ROW.exec(data))) {
      const ra = attrs(m[1]);
      r = ra.r ? num(ra.r) - 1 : r + 1;
      if (r >= XL_ROWS || r < 0) { if (r >= XL_ROWS) truncR = true; break; }
      if (ra.ht && ra.customHeight !== "0") rowH[r] = clamp(num(ra.ht) * 4 / 3, 2, 800);
      if (ra.hidden === "1" || ra.hidden === "true") rowHide[r] = true;
      if (m[2]) continue;
      let c = -1, cm;
      CELL.lastIndex = 0;
      const body = m[3];
      while ((cm = CELL.exec(body))) {
        const ca = attrs(cm[1]), rc = ca.r ? refRC(ca.r) : null;
        c = rc ? rc.c : c + 1;
        if (c >= XL_COLS) { truncC = true; continue; }
        const inner = cm[2] || "", t = ca.t || "n", xf = S.xf[num(ca.s)] || null;
        const vm = /<(?:\w+:)?v>([\s\S]*?)<\/(?:\w+:)?v>/.exec(inner), v = vm ? decode(vm[1]) : null;
        let text = "", kind = "s";
        if (t === "s") text = v != null ? (ss[num(v)] || "") : "";
        else if (t === "inlineStr") { const im = /<(?:\w+:)?is>([\s\S]*?)<\/(?:\w+:)?is>/.exec(inner); text = im ? cellText(im[1]) : ""; }
        else if (t === "str" || t === "e") { text = v || ""; kind = t === "e" ? "e" : "s"; }
        else if (t === "b") { text = v === "1" ? "TRUE" : "FALSE"; kind = "b"; }
        else if (t === "d") { text = v || ""; kind = "n"; }
        else if (v != null && v !== "") { const n = Number(v); if (Number.isFinite(n)) { const code = xf ? (S.fmts[xf.fmt] || BUILTIN[xf.fmt] || "General") : "General"; text = fmtCell(n, code, d1904); kind = "n"; } else text = v; }
        const fill = xf ? S.fills[xf.fill] : null, bdr = xf ? S.borders[xf.border] : null;
        if (!text && !fill && !(bdr && Object.keys(bdr).length)) continue;
        if (budget.n++ >= XL_CELLS) { warn(ctx, "This workbook is very large, so only part of it is shown."); break; }
        cells.set(r * 1000 + c, {text: text.replace(CTRL, ""), kind, xf});
        if (text || fill) { if (r > maxR) maxR = r; if (c > maxC) maxC = c; }
      }
    }
    if (truncR || truncC) warn(ctx, `Big sheets show only the first ${XL_ROWS.toLocaleString("en-US")} rows and ${XL_COLS} columns.`);
    const merges = kids(kid(head, "mergeCells"), "mergeCell").slice(0, 20000).map(mc => { const [a, b] = String(at(mc, "ref") || "").split(":").map(refRC); return a && b ? {r: a.r, c: a.c, r2: Math.min(b.r, XL_ROWS - 1), c2: Math.min(b.c, XL_COLS - 1)} : null; }).filter(x => x && x.r < XL_ROWS && x.c < XL_COLS);
    for (const mg of merges) { if (cells.has(mg.r * 1000 + mg.c)) { maxR = Math.max(maxR, mg.r2); maxC = Math.max(maxC, mg.c2); } }
    const fp = kid(head, "sheetFormatPr");
    const defW = at(fp, "defaultColWidth") != null ? num(at(fp, "defaultColWidth")) * 7 + 5 : at(fp, "baseColWidth") != null ? Math.round(num(at(fp, "baseColWidth"), 8) * 7 + 12) : 64;
    const defH = at(fp, "defaultRowHeight") != null ? clamp(num(at(fp, "defaultRowHeight"), 15) * 4 / 3, 8, 400) : 20;
    const colW = [], colHide = {};
    for (const c of kids(kid(head, "cols"), "col")) {
      const a = clamp(num(at(c, "min"), 1), 1, 16384) - 1, b = Math.min(clamp(num(at(c, "max"), 1), 1, 16384) - 1, XL_COLS - 1);
      for (let k = a; k <= b; k++) { if (at(c, "width") != null) colW[k] = clamp(Math.round(num(at(c, "width")) * 7 + 5), 0, 2000); if (on(c, "hidden") && at(c, "hidden") != null) colHide[k] = true; }
    }
    const grid = at(path(head, "sheetViews", "sheetView"), "showGridLines") !== "0";
    return {cells, maxR, maxC, merges, defW: clamp(defW, 8, 600), defH, colW, colHide, rowH, rowHide, grid};
  }
  // A grid (sheet or CSV) → page HTML and size
  function gridPage(G, S, label){
    const nR = G.maxR + 1, nC = G.maxC + 1;
    if (nR <= 0 || nC <= 0) return {w: 600, h: 400, label, html: `<div class="ofc-page ofc-xlsx" style="width:600px;height:400px"><p class="ofc-empty">This sheet is empty.</p></div>`};
    const cw = [], rh = [];
    for (let c = 0; c < nC; c++) cw.push(G.colHide[c] ? 0 : (G.colW[c] != null ? G.colW[c] : G.defW));
    for (let r = 0; r < nR; r++) rh.push(G.rowHide[r] ? 0 : (G.rowH[r] != null ? G.rowH[r] : G.defH));
    const span = new Map(), covered = new Set();
    for (const mg of G.merges) {
      if (mg.r >= nR || mg.c >= nC) continue;
      const r2 = Math.min(mg.r2, nR - 1), c2 = Math.min(mg.c2, nC - 1);
      span.set(mg.r * 1000 + mg.c, {rs: r2 - mg.r + 1, cs: c2 - mg.c + 1});
      for (let r = mg.r; r <= r2; r++) for (let c = mg.c; c <= c2; c++) if (r !== mg.r || c !== mg.c) covered.add(r * 1000 + c);
    }
    const RH = 40, HH = 20;
    let html = `<table class="ofc-xt${G.grid ? "" : " ofc-nogrid"}" style="width:${R(RH + cw.reduce((a, b) => a + b, 0))}px"><colgroup><col style="width:${RH}px">${cw.map(w => `<col style="width:${R(w)}px">`).join("")}</colgroup>`;
    html += `<thead><tr style="height:${HH}px"><th class="ofc-xc"></th>${cw.map((w, c) => w ? `<th>${colName(c)}</th>` : '<th class="ofc-x0"></th>').join("")}</tr></thead><tbody>`;
    const text = [];
    for (let r = 0; r < nR; r++) {
      if (!rh[r]) continue;
      let row = `<tr style="height:${R(rh[r])}px"><th>${r + 1}</th>`;
      const tx = [];
      for (let c = 0; c < nC; c++) {
        const k = r * 1000 + c;
        if (covered.has(k)) continue;
        const cell = G.cells.get(k), sp = span.get(k), s = [];
        tx.push(cell ? cell.text : "");
        if (!cw[c] && !sp) { row += `<td class="ofc-x0"></td>`; continue; }
        const xf = cell && cell.xf, font = xf && S ? S.fonts[xf.font] : null;
        if (font) {
          if (font.b) s.push("font-weight:700"); if (font.i) s.push("font-style:italic");
          const d = [font.u && "underline", font.s && "line-through"].filter(Boolean); if (d.length) s.push("text-decoration:" + d.join(" "));
          if (font.color && font.color !== "000000") s.push("color:#" + font.color);
          if (font.sz && font.sz !== 11) s.push(`font-size:${R(clamp(font.sz, 4, 96) * 4 / 3)}px`);
          if (font.name && !/^(calibri|aptos narrow)$/i.test(font.name)) { const f = fontCss(font.name); if (f) s.push("font-family:" + f); }
        }
        const fill = xf && S ? S.fills[xf.fill] : null; if (fill) s.push("background-color:#" + fill);
        const bd = xf && S ? S.borders[xf.border] : null; if (bd) for (const kk in bd) s.push(`border-${kk}:${bd[kk]}`);
        const h = xf && xf.h, kind = cell ? cell.kind : "s";
        const align = h === "center" || h === "centerContinuous" ? "center" : h === "right" ? "right" : h === "left" ? "left" : h === "justify" ? "justify" : kind === "n" ? "right" : kind === "b" || kind === "e" ? "center" : "";
        if (align) s.push("text-align:" + align);
        if (xf && xf.v) s.push("vertical-align:" + (xf.v === "center" ? "middle" : xf.v === "top" ? "top" : "bottom"));
        if (xf && xf.indent) s.push(`padding-left:${R(3 + clamp(xf.indent, 0, 30) * 9)}px`);
        if (xf && xf.wrap) s.push("white-space:pre-wrap");
        else if (cell && cell.text && kind === "s" && !G.cells.has(k + 1) && !sp) s.push("overflow:visible");
        row += `<td${sp && sp.cs > 1 ? ` colspan="${sp.cs}"` : ""}${sp && sp.rs > 1 ? ` rowspan="${sp.rs}"` : ""}${s.length ? ` style="${qa(s.join(";"))}"` : ""}>${cell ? esc(cell.text) : ""}</td>`;
      }
      html += row + "</tr>";
      while (tx.length && !tx[tx.length - 1]) tx.pop();
      text.push(tx.join("\t"));
    }
    html += "</tbody></table>";
    const w = Math.max(600, RH + cw.reduce((a, b) => a + b, 0) + 2), h = Math.max(400, HH + rh.reduce((a, b) => a + b, 0) + 2);
    while (text.length && !text[text.length - 1]) text.pop();
    return {w: R(w), h: R(h), label, html: `<div class="ofc-page ofc-xlsx" style="width:${R(w)}px;height:${R(h)}px">${html}</div>`, text: text.join("\n")};
  }
  async function xlsxModel(z, ctx){
    const main = await mainPart(z, "xl/workbook.xml"), wb = await z.xml(main);
    if (!wb) throw err("bad", "This Excel file looks damaged, so Studyboard can't show it.");
    const rels = await relsOf(z, main), rel = t => relType(rels, t);
    const d1904 = on(kid(wb, "workbookPr"), "date1904") && at(kid(wb, "workbookPr"), "date1904") != null;
    const thx = rel("theme") ? await z.xml(rel("theme").target) : null, th = thx ? readTheme(thx).colors : null;
    const S = xlStyles(rel("styles") ? await z.xml(rel("styles").target) : null, th);
    const ssx = rel("sharedStrings") ? await z.text(rel("sharedStrings").target) : null, ss = [];
    if (ssx) { const re = /<(?:\w+:)?si>([\s\S]*?)<\/(?:\w+:)?si>|<(?:\w+:)?si\/>/g; let m; while ((m = re.exec(ssx)) && ss.length < 2000000) ss.push(m[1] ? cellText(m[1]) : ""); }
    let sheets = kids(kid(wb, "sheets"), "sheet").map(s => ({name: at(s, "name") || "Sheet", hidden: /hidden/i.test(at(s, "state") || ""), rel: rels[at(s, "r:id")]})).filter(s => s.rel && !s.rel.ext && z.has(s.rel.target));
    if (sheets.some(s => !s.hidden)) { if (sheets.some(s => s.hidden)) warn(ctx, "Hidden sheets aren't shown."); sheets = sheets.filter(s => !s.hidden); }
    if (sheets.length > MAX_PAGES) { sheets = sheets.slice(0, MAX_PAGES); warn(ctx, "Only the first " + MAX_PAGES + " sheets are shown."); }
    const pages = [], texts = [], budget = {n: 0};
    for (const s of sheets) {
      if (/\/chartsheet/.test(s.rel.type)) { pages.push({w: 600, h: 400, label: "Sheet: " + s.name, html: `<div class="ofc-page ofc-xlsx" style="width:600px;height:400px">${imgTok(ctx, null, "position:absolute;left:24px;top:24px;width:552px;height:352px", s.name, "Chart")}</div>`}); texts.push("Sheet: " + s.name); continue; }
      const src = await z.text(s.rel.target); if (src == null) continue;
      const sr = await relsOf(z, s.rel.target);
      if (Object.values(sr).some(r => /\/(drawing|image)$/.test(r.type))) warn(ctx, "Charts and pictures inside spreadsheets aren't shown.");
      const G = xlSheet(src, ss, S, th, d1904, ctx, budget);
      const pg = gridPage(G, S, "Sheet: " + s.name);
      texts.push("Sheet: " + s.name + (pg.text ? "\n" + pg.text : ""));
      delete pg.text;
      pages.push(pg);
    }
    if (!pages.length) pages.push(gridPage({maxR: -1, maxC: -1}, S, "Sheet: Sheet1"));
    return {kind: "xlsx", pages, text: texts.join("\n\n")};
  }
  function decodeText(u8){
    if (u8[0] === 0xFF && u8[1] === 0xFE) return new TextDecoder("utf-16le").decode(u8);
    if (u8[0] === 0xFE && u8[1] === 0xFF) return new TextDecoder("utf-16be").decode(u8);
    try { return new TextDecoder("utf-8", {fatal: true}).decode(u8); } catch (e) { return new TextDecoder("windows-1252").decode(u8); }
  }
  function parseCsv(src, ctx){
    src = src.replace(/^﻿/, "").replace(CTRL, "");
    const sample = src.slice(0, 20000).split(/\r\n|\n|\r/).slice(0, 20).filter(l => l.trim());
    let delim = ",", best = -1;
    for (const d of [",", ";", "\t", "|"]) {
      const counts = sample.map(l => { let n = 0, q = false; for (const ch of l) { if (ch === '"') q = !q; else if (ch === d && !q) n++; } return n; });
      if (!counts.length || !counts[0]) continue;
      const same = counts.filter(n => n === counts[0]).length, score = same * 100 + counts[0];
      if (score > best) { best = score; delim = d; }
    }
    const rows = []; let row = [], f = "", q = false, i = 0, truncC = false;
    const L = src.length;
    const endF = () => { if (row.length < XL_COLS) row.push(f); else truncC = true; f = ""; };
    while (i < L) {
      const ch = src[i];
      if (q) { if (ch === '"') { if (src[i + 1] === '"') { f += '"'; i += 2; continue; } q = false; i++; continue; } f += ch; i++; continue; }
      if (ch === '"' && f === "") { q = true; i++; continue; }
      if (ch === delim) { endF(); i++; continue; }
      if (ch === "\n" || ch === "\r") { endF(); rows.push(row); row = []; if (ch === "\r" && src[i + 1] === "\n") i++; i++; if (rows.length >= XL_ROWS) break; continue; }
      f += ch; i++;
    }
    if (rows.length < XL_ROWS && (f || row.length)) { endF(); rows.push(row); }
    if (i < L || truncC) warn(ctx, `Big files show only the first ${XL_ROWS.toLocaleString("en-US")} rows and ${XL_COLS} columns.`);
    return rows;
  }
  function csvModel(u8, ctx){
    if (u8.byteLength > ZIP_MAX_IN) throw err("big", "That file is too big to show here.");
    const rows = parseCsv(decodeText(u8), ctx), cells = new Map();
    let maxC = -1;
    const isNum = s => /^\s*[-+]?(\$|€|£)?\s?(\d{1,3}(,\d{3})+|\d+)?(\.\d+)?%?\s*$/.test(s) && /\d/.test(s);
    rows.forEach((r, ri) => r.forEach((t, ci) => { if (t !== "") { cells.set(ri * 1000 + ci, {text: t, kind: isNum(t) ? "n" : "s", xf: null}); if (ci > maxC) maxC = ci; } }));
    const G = {cells, maxR: rows.length - 1, maxC, merges: [], defW: 64, defH: 20, colW: [], colHide: {}, rowH: {}, rowHide: {}, grid: true};
    // wider columns for long values (up to 320px)
    for (let c = 0; c <= maxC; c++) { let m = 0; for (let r = 0; r < Math.min(rows.length, 200); r++) m = Math.max(m, (rows[r][c] || "").length); G.colW[c] = clamp(Math.round(m * 7 + 10), 48, 320); }
    while (G.maxR >= 0 && !(rows[G.maxR] || []).some(x => x !== "")) G.maxR--;
    const pg = gridPage(G, null, "Table");
    const text = pg.text; delete pg.text;
    return {kind: "csv", pages: [pg], text};
  }
  // Measures each sheet's table; page = natural size (at least 600×400)
  function gridLayout(pages){
    if (typeof document === "undefined" || !document.body) return pages;
    const host = document.createElement("div");
    host.style.cssText = "position:fixed;left:-40000px;top:0;visibility:hidden;pointer-events:none";
    document.body.appendChild(host);
    try {
      for (const p of pages) {
        host.innerHTML = p.html;
        const pg = host.firstElementChild, t = pg && pg.querySelector("table");
        if (!t) continue;
        pg.style.width = "auto"; pg.style.height = "auto"; pg.style.display = "inline-block";
        const r = t.getBoundingClientRect(), w = R(Math.max(600, Math.ceil(r.width) + 2)), h = R(Math.max(400, Math.ceil(r.height) + 2));
        if (w !== p.w || h !== p.h) { p.w = w; p.h = h; p.html = p.html.replace(/^<div class="ofc-page ofc-xlsx" style="width:[\d.]+px;height:[\d.]+px">/, `<div class="ofc-page ofc-xlsx" style="width:${w}px;height:${h}px">`); }
      }
    } finally { host.remove(); }
    return pages;
  }

  /* ================= the API ================= */
  const toU8 = b => b instanceof Uint8Array ? b : b instanceof ArrayBuffer ? new Uint8Array(b) : ArrayBuffer.isView(b) ? new Uint8Array(b.buffer, b.byteOffset, b.byteLength) : new Uint8Array(0);
  const LEGACY_MSG = {doc: "an older Word file (.doc)", xls: "an older Excel file (.xls)", ppt: "an older PowerPoint file (.ppt)", xlsb: "an Excel binary workbook (.xlsb)", odt: "an OpenDocument file", odp: "an OpenDocument file", ods: "an OpenDocument file", pages: "a Pages file", key: "a Keynote file", numbers: "a Numbers file", rtf: "a Rich Text file"};
  function legacyErr(name){
    const ext = (String(name || "").toLowerCase().match(/\.([a-z0-9]+)$/) || [])[1] || "";
    const what = LEGACY_MSG[ext] || (ext ? "a ." + ext + " file" : "this kind of file");
    const to = /^(ppt|pps|pot|odp|key)$/.test(ext) ? ".pptx" : /^(xls|xlt|xlsb|ods|numbers)$/.test(ext) ? ".xlsx" : ".docx";
    return err("legacy", `Studyboard can't show ${what} here. Save it as ${to} or PDF and upload it again.`);
  }
  async function open(bytes, name, type){
    const u8 = toU8(bytes);
    let kind = kindOf(name, type);
    const zip = u8[0] === 0x50 && u8[1] === 0x4B, ole = u8[0] === 0xD0 && u8[1] === 0xCF && u8[2] === 0x11 && u8[3] === 0xE0;
    if (ole && (kind === "docx" || kind === "pptx" || kind === "xlsx")) throw err("locked", "This file is password-protected. Remove the password in Office, then upload it again.");
    if (kind === "csv") return {kind, u8};
    if (!zip) {
      if (kind === "legacy") throw legacyErr(name);
      if (kind) throw err("bad", "This file looks damaged, so Studyboard can't show it.");
      throw err("unsupported", "Studyboard can't show this kind of file.");
    }
    const z = await openZip(u8);
    if (!kind || kind === "legacy") {
      const k = z.has("word/document.xml") ? "docx" : z.has("ppt/presentation.xml") ? "pptx" : z.has("xl/workbook.xml") ? "xlsx" : "";
      if (!k) { if (kind === "legacy") throw legacyErr(name); throw err("unsupported", "Studyboard can't show this kind of file."); }
      kind = k;
    }
    return {kind, z};
  }
  async function model(o, ctx){
    if (o.kind === "csv") return csvModel(o.u8, ctx);
    if (o.kind === "docx") return docxModel(o.z, ctx);
    if (o.kind === "pptx") return pptxModel(o.z, ctx);
    return xlsxModel(o.z, ctx);
  }
  const live = new WeakMap();
  async function render(bytes, name, opts){
    opts = opts || {};
    const ctx = newCtx(false), o = await open(bytes, name, opts.type);
    try {
      const M = await model(o, ctx);
      if (o.z) await loadImgs(o.z, ctx);
      let pages;
      if (M.kind === "docx") pages = docxLayout(M, ctx);
      else {
        pages = M.pages.map(p => Object.assign(p, {html: fillImgs(p.html, ctx)}));
        if (M.kind === "xlsx" || M.kind === "csv") pages = gridLayout(pages);
      }
      const text = M.text.length > MAX_TEXT ? M.text.slice(0, MAX_TEXT) : M.text;
      const res = {kind: M.kind, pages, text, warnings: ctx.warnings.slice()};
      live.set(res, ctx.urls);
      return res;
    } catch (e) {
      ctx.urls.forEach(u => { try { URL.revokeObjectURL(u); } catch (x) {} });
      throw e;
    }
  }
  async function text(bytes, name, opts){
    const ctx = newCtx(true), o = await open(bytes, name, opts && opts.type), M = await model(o, ctx);
    return M.text.length > MAX_TEXT ? M.text.slice(0, MAX_TEXT) : M.text;
  }
  function release(res){
    const urls = res && live.get(res);
    if (!urls) return;
    urls.forEach(u => { try { URL.revokeObjectURL(u); } catch (e) {} });
    live.delete(res);
  }
  return {kindOf, render, text, release, _: {parseXml, fmtCell, fmtDate, general, parseCsv, colName, kindOf, fontCss, sniff}};
})();
window.SBOFFICE = OFFICE;
