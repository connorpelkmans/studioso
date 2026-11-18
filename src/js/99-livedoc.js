/*LIVEDOC-START*/
/* A Google Doc or a Word file linked to a paper in Writing Studio: its text, and Writing Studio's fixes made in the document itself.
   Writing Studio checks a tidy copy of the text (CITE.capDraft: no spaces before line ends, at most one blank line, trimmed), so
   norm() keeps where each of its characters is in the document's own text, and edits to the tidy copy are moved onto the document's.
   Google Docs: the text comes from the document's paragraphs (tables too), with where each run starts; a fix is a batchUpdate of
   deleteContentRange and insertText, made from the end so earlier places stay right, and only on the version that was read.
   Word (.docx): word/document.xml's paragraphs; a fix changes the text in its runs where it is, so formatting, links and pictures
   stay, and a new line is a new paragraph like the one it's in. Pure: the XML document is passed in, so tests can use any DOM. */
const LIVEDOC = (() => {
  // the tidy text, and for each of its characters (and its end) where it is in the raw text
  function norm(rawIn){
    const raw = String(rawIn || "");
    let ch = [], ix = [];
    for (let i = 0; i < raw.length; i++) { if (raw[i] === "\r") { if (raw[i + 1] !== "\n") { ch.push("\n"); ix.push(i); } continue; } ch.push(raw[i]); ix.push(i); }
    const pass = (re, keepOf) => {
      const s = ch.join(""), drop = new Uint8Array(ch.length); let m; re.lastIndex = 0;
      while ((m = re.exec(s))) { const k = keepOf(m); for (let j = m.index; j < m.index + m[0].length; j++) if (j < m.index + k[0] || j >= m.index + k[1]) drop[j] = 1; if (!m[0].length) re.lastIndex++; }
      const c2 = [], i2 = []; ch.forEach((c, j) => { if (!drop[j]) { c2.push(c); i2.push(ix[j]); } }); ch = c2; ix = i2;
    };
    pass(/[ \t]+\n/g, m => [m[0].length - 1, m[0].length]);
    pass(/\n{3,}/g, () => [0, 2]);
    pass(/^\s+/g, () => [0, 0]);
    pass(/\s+$/g, () => [0, 0]);
    const text = ch.join(""), map = ix.slice(); map.push(ix.length ? ix[ix.length - 1] + 1 : 0);
    return {text, map};
  }
  // edits to the tidy text (in the order they're made: from the end) as edits to the raw text
  function toRaw(raw, N, plan){
    return plan.map(e => {
      const s = e.len ? N.map[e.at] : N.map[e.at], end = e.len ? N.map[e.at + e.len - 1] + 1 : s;
      return {at: s, len: end - s, from: raw.slice(s, end), to: e.to};
    });
  }

  /* Google Docs: the text of documents.get's body, and where each part of it is in the document */
  function gText(doc){
    const segs = []; let text = "";
    const walk = content => (content || []).forEach(el => {
      if (el.paragraph) (el.paragraph.elements || []).forEach(pe => {
        const tr = pe.textRun; if (!tr || typeof tr.content !== "string" || typeof pe.startIndex !== "number") return;
        const c = tr.content.replace(/\u000b/g, "\n");
        segs.push({t: text.length, i: pe.startIndex, n: c.length}); text += c;
      });
      else if (el.table) (el.table.tableRows || []).forEach(r => (r.tableCells || []).forEach(c => walk(c.content)));
      else if (el.tableOfContents) walk(el.tableOfContents.content);
    });
    walk(doc && doc.body && doc.body.content);
    // the document's last paragraph mark can't be edited: it isn't part of the text, but stays a place to put things before
    const raw = text.replace(/\n$/, "");
    return {raw, segs};
  }
  // the document index of the character at a place in the text (or, for the end of a range, just after the one before it)
  function gIndex(segs, off, isEnd){
    if (isEnd) { const p = off - 1; const s = segs.find(x => p >= x.t && p < x.t + x.n); return s ? s.i + (p - s.t) + 1 : null; }
    const s = segs.find(x => off >= x.t && off < x.t + x.n); return s ? s.i + (off - s.t) : null;
  }
  // batchUpdate requests for raw edits (already in the order to make them: from the end)
  function gRequests(G, rawPlan){
    const req = [];
    for (const e of rawPlan) {
      const s = gIndex(G.segs, e.at, false); if (s == null) return null;
      if (e.len) { const end = gIndex(G.segs, e.at + e.len, true); if (end == null || end <= s) return null; req.push({deleteContentRange: {range: {startIndex: s, endIndex: end}}}); }
      if (e.to) req.push({insertText: {location: {index: s}, text: e.to}});
    }
    return req;
  }

  /* Word: word/document.xml */
  const W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
  const ln = n => n && (n.localName || String(n.nodeName || "").replace(/^.*:/, ""));
  const isW = (n, name) => n && n.nodeType === 1 && n.namespaceURI === W && ln(n) === name;
  const inside = (n, name, stop) => { for (let p = n.parentNode; p && p !== stop; p = p.parentNode) if (isW(p, name)) return true; return false; };
  // the body's paragraphs in reading order (tables too; not text boxes, which sit inside another paragraph)
  function wParas(doc){
    const body = doc.getElementsByTagNameNS(W, "body")[0]; if (!body) return [];
    return Array.from(body.getElementsByTagNameNS(W, "p")).filter(p => !inside(p, "p", body));
  }
  // the text, and what each part of it is: a w:t (editable), a tab or line break in a run (one character), a paragraph's end
  function wIndex(doc){
    const segs = []; let text = "";
    wParas(doc).forEach(p => {
      const walk = n => { for (let c = n.firstChild; c; c = c.nextSibling) {
        if (c.nodeType !== 1) continue;
        if (isW(c, "pPr") || isW(c, "rPr") || isW(c, "del") || isW(c, "moveFrom") || isW(c, "txbxContent") || isW(c, "drawing") || isW(c, "pict") || isW(c, "object")) continue;
        if (isW(c, "t")) { const v = c.textContent || ""; segs.push({k: "t", node: c, p, t: text.length, n: v.length}); text += v; continue; }
        if ((isW(c, "tab") || isW(c, "br") || isW(c, "cr")) && isW(c.parentNode, "r")) { const v = isW(c, "tab") ? "\t" : "\n"; segs.push({k: "x", node: c, p, t: text.length, n: 1}); text += v; continue; }
        walk(c);
      } };
      walk(p); segs.push({k: "p", node: p, p, t: text.length, n: 1}); text += "\n";
    });
    return {raw: text.replace(/\n$/, ""), segs};
  }
  const runOf = n => { for (let p = n; p; p = p.parentNode) if (isW(p, "r")) return p; return null; };
  const setT = (t, v) => { while (t.firstChild) t.removeChild(t.firstChild); t.appendChild(t.ownerDocument.createTextNode(v)); t.setAttribute("xml:space", "preserve"); };
  const propOf = el => { for (let c = el.firstChild; c; c = c.nextSibling) if (c.nodeType === 1 && /Pr$/.test(ln(c))) return c; return null; };
  function newRun(doc, rPr){ const r = doc.createElementNS(W, "w:r"); if (rPr) r.appendChild(rPr.cloneNode(true)); const t = doc.createElementNS(W, "w:t"); setT(t, ""); r.appendChild(t); return {r, t}; }
  // a paragraph like p (its paragraph settings), empty
  function likePara(p){ const q = p.cloneNode(false), pr = propOf(p); if (pr && isW(pr, "pPr")) q.appendChild(pr.cloneNode(true)); return q; }
  // splits p after node x (one of its descendants): everything after it goes to a new paragraph like p, after p
  function splitAfter(x, p){
    let cur = x, carry = null;
    while (cur.parentNode !== p) {
      const par = cur.parentNode, cl = par.cloneNode(false), pr = propOf(par); if (pr && pr !== cur) cl.appendChild(pr.cloneNode(true));
      if (carry) cl.appendChild(carry);
      while (cur.nextSibling) cl.appendChild(cur.nextSibling);
      carry = cl; cur = par;
    }
    const q = likePara(p); if (carry) q.appendChild(carry);
    while (cur.nextSibling) q.appendChild(cur.nextSibling);
    p.parentNode.insertBefore(q, p.nextSibling);
    return q;
  }
  // the run settings to give new text at a place: the run just before it in its paragraph, or just after
  function rPrNear(I, at){
    const p = segAt(I, at) || segAt(I, at - 1); if (!p) return null;
    const near = I.segs.filter(s => s.p === p.p && s.k !== "p").sort((a, b) => Math.abs(a.t - at) - Math.abs(b.t - at))[0];
    const r = near && runOf(near.node); const pr = r && propOf(r); return pr && isW(pr, "rPr") ? pr : null;
  }
  const segAt = (I, off) => I.segs.find(s => off >= s.t && off < s.t + s.n) || null;
  function wDelete(doc, a, b){
    const I = wIndex(doc);
    I.segs.filter(s => s.t < b && s.t + s.n > a).sort((x, y) => y.t - x.t).forEach(s => {
      if (s.k === "t") { const v = s.node.textContent || "", i = Math.max(0, a - s.t), j = Math.min(s.n, b - s.t); setT(s.node, v.slice(0, i) + v.slice(j)); }
      else if (s.k === "x") s.node.parentNode.removeChild(s.node);
      else { // a paragraph's end: the next paragraph joins this one
        const all = wParas(doc), q = all[all.indexOf(s.p) + 1]; if (!q) return;
        for (let c = q.firstChild; c;) { const nx = c.nextSibling; if (!isW(c, "pPr")) s.p.appendChild(c); c = nx; }
        q.parentNode.removeChild(q);
      }
    });
  }
  // text with no new lines, at a place
  function wInsertPlain(doc, at, str, rPr){
    if (!str) return;
    const I = wIndex(doc), prev = segAt(I, at - 1), here = segAt(I, at);
    if (prev && prev.k === "t" && (!here || here.p === prev.p)) { const v = prev.node.textContent || "", k = at - prev.t; setT(prev.node, v.slice(0, k) + str + v.slice(k)); return; }
    if (here && here.k === "t") { const v = here.node.textContent || "", k = at - here.t; setT(here.node, v.slice(0, k) + str + v.slice(k)); return; }
    const p = (here || prev || {}).p; if (!p) return;
    const nr = newRun(doc, rPr || rPrNear(I, at)); setT(nr.t, str);
    if (here && here.k === "x") { const r = runOf(here.node); r.parentNode.insertBefore(nr.r, r); }
    else if (here && here.k === "p") p.appendChild(nr.r);
    else { const r = runOf(prev.node); r.parentNode.insertBefore(nr.r, r.nextSibling); }
  }
  // a new paragraph at a place (the text after it moves to the new paragraph)
  function wBreak(doc, at){
    const I = wIndex(doc), prev = segAt(I, at - 1), here = segAt(I, at);
    if (!here) return;
    if (!prev || prev.k === "p") { here.p.parentNode.insertBefore(likePara(here.p), here.p); return; }
    if (prev.k === "t" && here.node === prev.node) {
      const v = prev.node.textContent || "", k = at - prev.t, t2 = prev.node.cloneNode(false);
      setT(prev.node, v.slice(0, k)); setT(t2, v.slice(k)); prev.node.parentNode.insertBefore(t2, prev.node.nextSibling);
    }
    splitAfter(prev.node, prev.p);
  }
  // one raw edit, in place
  function wEdit(doc, e){
    const I = wIndex(doc), rPr = rPrNear(I, e.at);
    if (e.len) wDelete(doc, e.at, e.at + e.len);
    const lines = String(e.to || "").split("\n"); let at = e.at;
    lines.forEach((line, i) => { if (i) { wBreak(doc, at); at += 1; } wInsertPlain(doc, at, line, rPr); at += line.length; });
  }
  function wApply(doc, rawPlan){ rawPlan.forEach(e => wEdit(doc, e)); return wIndex(doc).raw; }

  /* How the document looks, so Writing Studio's page of it can look the same: for each paragraph (at: where it starts in the raw text) its
     alignment, indents (px), line spacing (a multiple of single), space above (px) and kind (title, heading 1–6), and its runs of text (at, n)
     with their font, size (pt), bold, italic and underline; base: the document's own font and size. A Google Doc's paragraphs take their named
     style's settings (Normal text, Title, Heading 1…) under their own; a Word file's, its style's (and the style it's based on) and the
     document's defaults. */
  const PT = 4 / 3;
  const ALIGN = {START: "left", CENTER: "center", END: "right", JUSTIFIED: "justify", left: "left", start: "left", center: "center", right: "right", end: "right", both: "justify", distribute: "justify"};
  const KIND = {TITLE: "title", SUBTITLE: "subtitle", HEADING_1: "h1", HEADING_2: "h2", HEADING_3: "h3", HEADING_4: "h4", HEADING_5: "h5", HEADING_6: "h6"};
  function gLayout(doc){
    const named = {}; ((doc && doc.namedStyles && doc.namedStyles.styles) || []).forEach(x => { named[x.namedStyleType] = x; });
    const N = named.NORMAL_TEXT || {}, mag = v => v && typeof v.magnitude === "number" ? v.magnitude : null;
    const tsOf = (base, ts) => { const t = Object.assign({}, base || {}, ts || {}); return {font: (t.weightedFontFamily && t.weightedFontFamily.fontFamily) || "", size: mag(t.fontSize) || 0, b: !!t.bold, i: !!t.italic, u: !!t.underline}; };
    const paras = []; let text = 0;
    const walk = content => (content || []).forEach(el => {
      if (el.paragraph) {
        const P = el.paragraph, ps0 = P.paragraphStyle || {}, st = named[ps0.namedStyleType] || N, ps = Object.assign({}, N.paragraphStyle || {}, st.paragraphStyle || {}, ps0);
        const par = {at: text, align: ALIGN[ps.alignment] || "left", first: (mag(ps.indentFirstLine) || 0) * PT, left: (mag(ps.indentStart) || 0) * PT, hang: 0, line: ps.lineSpacing ? ps.lineSpacing / 100 : 1.15, above: (mag(ps.spaceAbove) || 0) * PT, kind: KIND[ps0.namedStyleType] || "", runs: []};
        par.first -= par.left; if (par.first < 0) { par.hang = -par.first; par.first = 0; }
        (P.elements || []).forEach(pe => { const tr = pe.textRun; if (!tr || typeof tr.content !== "string") return; const c = tr.content; const ts = tsOf(Object.assign({}, N.textStyle || {}, st.textStyle || {}), tr.textStyle); par.runs.push(Object.assign({at: text, n: c.length}, ts)); text += c.length; });
        paras.push(par);
      }
      else if (el.table) (el.table.tableRows || []).forEach(r => (r.tableCells || []).forEach(c => walk(c.content)));
      else if (el.tableOfContents) walk(el.tableOfContents.content);
    });
    walk(doc && doc.body && doc.body.content);
    const base = tsOf(N.textStyle, null);
    return {paras, base: {font: base.font || "Arial", size: base.size || 11}};
  }
  // Word: document.xml's paragraphs and runs, with styles.xml's styles and defaults (when the file has them)
  function wLayout(doc, styles){
    const one = (el, name) => { if (!el) return null; for (let c = el.firstChild; c; c = c.nextSibling) if (isW(c, name)) return c; return null; };
    const val = (el, a) => el ? el.getAttributeNS(W, a) || el.getAttribute("w:" + a) || "" : "";
    const on = el => !!el && !/^(0|false|off|none)$/i.test(val(el, "val"));
    const rp = (rPr, into) => { if (!rPr) return into; const o = Object.assign({}, into); const f = one(rPr, "rFonts"); if (f && (val(f, "ascii") || val(f, "hAnsi"))) o.font = val(f, "ascii") || val(f, "hAnsi"); const z = one(rPr, "sz"); if (z && +val(z, "val")) o.size = +val(z, "val") / 2; ["b", "i"].forEach(k => { const e = one(rPr, k); if (e) o[k] = on(e); }); const u = one(rPr, "u"); if (u) o.u = on(u); return o; };
    const pp = (pPr, into) => { if (!pPr) return into; const o = Object.assign({}, into); const j = one(pPr, "jc"); if (j) o.align = ALIGN[val(j, "val")] || o.align; const ind = one(pPr, "ind"); if (ind) { const tw = a => (+val(ind, a) || 0) / 20 * PT; if (val(ind, "left") || val(ind, "start")) o.left = tw(val(ind, "left") ? "left" : "start"); if (val(ind, "firstLine")) { o.first = tw("firstLine"); o.hang = 0; } if (val(ind, "hanging")) { o.hang = tw("hanging"); o.first = 0; } } const sp = one(pPr, "spacing"); if (sp) { if (+val(sp, "line") && (!val(sp, "lineRule") || val(sp, "lineRule") === "auto")) o.line = +val(sp, "line") / 240; if (val(sp, "before")) o.above = (+val(sp, "before") || 0) / 20 * PT; } return o; };
    // the styles: defaults, then each style (with the one it's based on)
    let dR = {font: "", size: 0, b: false, i: false, u: false}, dP = {align: "left", first: 0, hang: 0, left: 0, line: 1.08, above: 0};
    const S = {};
    if (styles) {
      const dd = styles.getElementsByTagNameNS(W, "docDefaults")[0];
      if (dd) { const r0 = dd.getElementsByTagNameNS(W, "rPr")[0], p0 = dd.getElementsByTagNameNS(W, "pPr")[0]; dR = rp(r0, dR); dP = pp(p0, dP); }
      Array.from(styles.getElementsByTagNameNS(W, "style")).forEach(st => { const id = val(st, "styleId"), nm = val(one(st, "name"), "val"), bo = val(one(st, "basedOn"), "val"); S[id] = {nm, bo, r: one(st, "rPr"), p: one(st, "pPr")}; });
    }
    const chain = id => { const out = []; for (let k = 0, x = S[id]; x && k < 6; k++, x = S[x.bo]) out.unshift(x); return out; };
    const kindOf = id => { const nm = String((S[id] || {}).nm || id || "").toLowerCase(); return nm === "title" ? "title" : nm === "subtitle" ? "subtitle" : (/^heading\s?([1-6])$/.exec(nm) || [])[1] ? "h" + /^heading\s?([1-6])$/.exec(nm)[1] : ""; };
    const I = wIndex(doc), byP = new Map();
    I.segs.forEach(sg => {
      if (!byP.has(sg.p)) {
        const pPr = one(sg.p, "pPr"), sid = val(one(pPr, "pStyle"), "val"), ch = chain(sid);
        let P = Object.assign({}, dP), R = Object.assign({}, dR); ch.forEach(x => { P = pp(x.p, P); R = rp(x.r, R); }); P = pp(pPr, P);
        const kind = kindOf(sid);
        if (!ch.length && /^(title|heading)/i.test(sid)) { R.b = true; R.size = R.size || 0; }
        byP.set(sg.p, Object.assign({at: sg.t, kind, runs: [], R}, P));
      }
      const par = byP.get(sg.p);
      if (sg.k === "p") return;
      const r = sg.node.parentNode && isW(sg.node.parentNode, "r") ? sg.node.parentNode : null, st = rp(r ? one(r, "rPr") : null, par.R);
      par.runs.push(Object.assign({at: sg.t, n: sg.n}, {font: st.font, size: st.size, b: !!st.b, i: !!st.i, u: !!st.u}));
    });
    const paras = [...byP.values()].map(p => { const o = Object.assign({}, p); delete o.R; return o; });
    return {paras, base: {font: dR.font || "Calibri", size: dR.size || 11}};
  }
  return {norm, toRaw, gText, gRequests, wIndex, wApply, W, gLayout, wLayout};
})();
/*LIVEDOC-END*/
