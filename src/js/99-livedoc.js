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

  return {norm, toRaw, gText, gRequests, wIndex, wApply, W};
})();
/*LIVEDOC-END*/
