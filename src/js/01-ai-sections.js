/* ===== module: 01-ai-sections.js: the study set pipeline's first half (no AI): material → sections → a plan ===== */
/* Why: an AI handed a whole 40-page PDF and asked for 40 cards skims, repeats itself and skips the back half. Given one short
   section at a time, with "make 3 cards from this", even a small model writes good cards, and every part of the material is covered.
   So the material is read on the device first (01-ai.js: PDF lines and font sizes, slides, Word headings, pasted notes), split
   here into sections by heading, and each section gets its share of the cards. aiMakeStudySet (01-ai.js) then asks the AI one
   section at a time, checks every card with the existing quality gates, and retries a section that came back thin.
   Everything between SECTIONS-START and SECTIONS-END is pure (strings and arrays only) and is unit-tested in
   tests/ai-sections.test.js. */
/*SECTIONS-START*/
const SBSECT = (() => {
  const WORD = /[\p{L}\p{N}][\p{L}\p{N}'’.-]*/gu;
  const words = s => (String(s || "").match(WORD) || []).length;
  // Sizes, in words. A "small" engine (an on-device model) gets shorter sections and fewer cards per request.
  const SIZES = {cloud: {min: 90, max: 650, maxSections: 14, perSection: 8, onlyOver: 900}, small: {min: 60, max: 280, maxSections: 24, perSection: 5, onlyOver: 0}};
  // Material with nothing to study in it: skipped (folded into nothing) when its title says so
  const FLUFF = /^(references?|bibliography|works cited|citations|sources|acknowledg(e)?ments?|(table of )?contents|agenda|outline|questions\??|any questions\??|thank(s| you)\b.*|the end|appendix [a-z]?\s*:?\s*(raw )?data|about the (author|instructor)|copyright.*|disclosures?)$/i;
  // A line that is a heading, and its level (1 is the top). Each rule is conservative: a sentence is never a heading.
  function headingOf(line, next){
    const t = String(line || "").trim(); if (!t || t.length > 90) return null;
    let m;
    if ((m = /^(#{1,6})\s+(.+)$/.exec(t))) return {level: m[1].length, title: m[2].trim()};
    if ((m = /^slide\s+(\d+)\s*:?\s*$/i.exec(t))) return {level: 1, title: "", slide: Number(m[1])};
    if ((m = /^(chapter|unit|module|lecture|lesson|part|topic|week|section)\s+([\w.-]{1,6})\b\s*[:.\-–—]?\s*(.*)$/i.exec(t)) && words(t) <= 12) return {level: 1, title: t};
    const w = words(t), endsLikeSentence = /[.!?;,]$/.test(t) && !/\b(etc|vs|e\.g|i\.e)\.$/i.test(t);
    if (endsLikeSentence || w === 0 || w > 10) return null;
    // a long line follows (a heading introduces something)
    const intro = next == null || words(next) >= 6 || /^\s*([-•*▪●◦–]|\d+[.)])\s/.test(next);
    if ((m = /^(\d+(?:\.\d+){0,3})[.)]?\s+(\D.{1,80})$/.exec(t)) && intro && !/[a-z]$/.test(m[1]) && /^[A-Z]/.test(m[2])) return {level: Math.min(3, m[1].split(".").length), title: t};
    if (/^[A-Z][A-Z0-9 &/,'’()-]{2,}$/.test(t) && /[A-Z]{3}/.test(t) && w >= 1 && w <= 8 && intro) return {level: 2, title: t.replace(/\s+/g, " ")};
    if (/:$/.test(t) && w <= 7 && intro) return {level: 3, title: t.replace(/:$/, "")};
    // Title Case, short, followed by a paragraph
    const caps = t.split(/\s+/).filter(x => /^[\p{Lu}\p{N}]/u.test(x)).length, small = t.split(/\s+/).filter(x => /^(a|an|the|of|and|or|in|on|to|for|with|vs\.?|by|at|from|as)$/i.test(x)).length;
    if (w >= 1 && w <= 8 && /^[\p{Lu}\p{N}]/u.test(t) && caps + small >= t.split(/\s+/).length && next != null && words(next) >= 10) return {level: 3, title: t};
    return null;
  }
  // Lines → blocks {title, path:[...], lines:[...]} at every heading
  function blocksFromLines(lines, opts){
    opts = opts || {};
    const out = [], path = [];
    let cur = {title: opts.title || "", path: opts.title ? [opts.title] : [], lines: []};
    const push = () => { if (cur.lines.some(l => l.trim()) || cur.title) out.push(cur); };
    lines.forEach((raw, i) => {
      const line = String(raw == null ? "" : raw).replace(/\s+$/, "");
      const next = lines.slice(i + 1).find(x => String(x || "").trim());
      const h = opts.headingAt ? opts.headingAt(i, line, next) : headingOf(line, next);
      if (h) {
        push();
        if (h.slide != null) { const title = String(next || "").trim().slice(0, 90); path.length = 0; cur = {title: title || "Slide " + h.slide, path: [title || "Slide " + h.slide], lines: [], slide: h.slide, skipFirst: !!title}; return; }
        path.length = Math.min(path.length, h.level - 1); path[h.level - 1] = h.title;
        cur = {title: h.title, path: path.filter(Boolean).slice(), lines: []};
        return;
      }
      if (cur.skipFirst && line.trim()) { cur.skipFirst = false; return; }
      cur.lines.push(line);
    });
    push();
    return out.map(b => ({title: b.title, path: b.path.length ? b.path : (b.title ? [b.title] : []), text: b.lines.join("\n").replace(/\n{3,}/g, "\n\n").trim(), slide: b.slide}));
  }
  // A PDF's pages, read on the device: [{n, lines: [{text, size}]}]. Headings are lines clearly bigger than the body text.
  function blocksFromPdf(pages, opts){
    const sizes = []; pages.forEach(p => p.lines.forEach(l => { const w = words(l.text); for (let i = 0; i < Math.min(w, 30); i++) sizes.push(l.size || 0); }));
    sizes.sort((a, b) => a - b);
    const body = sizes.length ? sizes[Math.floor(sizes.length / 2)] : 0;
    const lines = [], marks = [];
    pages.forEach(p => p.lines.forEach((l, k) => {
      const t = String(l.text || "").trim(); if (!t) return;
      // running headers and footers: page numbers, and the same short line on many pages
      if (/^(page\s*)?\d{1,4}(\s*(of|\/)\s*\d{1,4})?$/i.test(t)) return;
      lines.push(t); marks.push({big: body > 0 && l.size >= body * 1.25 && words(t) <= 14 && !/[.;,]$/.test(t), size: Math.round((l.size || 0) * 2) / 2, first: k === 0, page: p.n});
    }));
    // outline levels: the biggest heading size is level 1, the next level 2, and so on
    const hs = [...new Set(marks.filter(m => m.big).map(m => m.size))].sort((a, b) => b - a);
    marks.forEach(m => { m.lvl = Math.min(3, hs.indexOf(m.size) + 1 || 3); });
    const seen = {}; lines.forEach(t => { if (t.length <= 60) seen[t] = (seen[t] || 0) + 1; });
    const rep = new Set(Object.keys(seen).filter(t => seen[t] >= Math.max(3, pages.length * 0.5)));
    const keep = lines.map((t, i) => rep.has(t) ? null : i).filter(i => i != null);
    const L = keep.map(i => lines[i]), M = keep.map(i => marks[i]);
    return blocksFromLines(L, Object.assign({}, opts, {headingAt: (i, line, next) => M[i] && M[i].big ? {level: M[i].lvl, title: line} : headingOf(line, next)}));
  }
  // Blocks → sections of a useful size: tiny ones join their neighbour, long ones split at paragraphs; fluff is left out
  function sections(blocks, kind){
    const S = SIZES[kind] || SIZES.cloud;
    let list = blocks.filter(b => !FLUFF.test(String(b.title || "").replace(/^[\d.\s]+/, "").trim()) && words(b.text) >= 3)
      .map(b => ({title: b.title, path: b.path, text: b.text, words: words(b.text)}));
    // split the long ones at blank lines, then at sentences
    const out = [];
    list.forEach(b => {
      if (b.words <= S.max) { out.push(b); return; }
      const paras = b.text.split(/\n\s*\n|\n(?=\s*[-•*▪●◦–]\s)/).filter(x => x.trim());
      const units = paras.flatMap(p => words(p) > S.max ? p.split(/(?<=[.!?])\s+(?=[A-Z0-9“"(])/) : [p]);
      let cur = [], n = 0, part = 1;
      const flush = () => { if (!cur.length) return; out.push({title: b.title + (part > 1 ? ` (part ${part})` : ""), path: b.path, text: cur.join("\n\n"), words: n}); part++; cur = []; n = 0; };
      units.forEach(u => { const w = words(u); if (n && n + w > S.max) flush(); cur.push(u.trim()); n += w; });
      flush();
    });
    // tiny ones join the next (or the previous, at the end)
    const merged = [];
    out.forEach(s => {
      const last = merged[merged.length - 1];
      if (last && (last.words < S.min || s.words < S.min / 2) && last.words + s.words <= S.max) {
        last.text = last.text + "\n\n" + (s.title && s.title !== last.title ? s.title + "\n" : "") + s.text; last.words += s.words + words(s.title);
        if (s.title && s.title !== last.title && last.title.length < 70) last.title = last.title ? last.title + " · " + s.title : s.title;
      } else merged.push(Object.assign({}, s));
    });
    // at most maxSections: the two smallest neighbours join until it fits
    while (merged.length > S.maxSections) {
      let k = 0, best = Infinity;
      for (let i = 0; i < merged.length - 1; i++) { const w = merged[i].words + merged[i + 1].words; if (w < best) { best = w; k = i; } }
      const a = merged[k], b = merged[k + 1];
      merged.splice(k, 2, {title: a.title && b.title && a.title !== b.title ? `${a.title} · ${b.title}`.slice(0, 120) : (a.title || b.title), path: a.path, text: a.text + "\n\n" + (b.title ? b.title + "\n" : "") + b.text, words: a.words + b.words});
    }
    return merged.filter(s => s.words >= 15);
  }
  // How much there is to learn in a section: its length, plus definitions, lists and numbers
  function weight(s){
    const t = s.text, defs = (t.match(/\b(is|are|means|refers to|defined as|called|known as)\b|:\s|\s[–—-]\s/gi) || []).length,
      items = (t.match(/^\s*([-•*▪●◦–]|\d+[.)])\s/gm) || []).length, nums = Math.min(10, (t.match(/\d/g) || []).length / 4);
    return Math.pow(Math.max(1, s.words), 0.8) * (1 + Math.min(1.5, (defs + items) / Math.max(4, s.words / 25) * 0.6) + nums * 0.02);
  }
  // Share `total` items across sections by weight (largest remainder). total 0 means "as many as the material supports":
  // about one card per 45 words, at most perSection each. A section always gets at least one when there's room.
  function plan(secs, total, kind){
    const S = SIZES[kind] || SIZES.cloud;
    if (!secs.length) return [];
    const auto = !total, want = auto ? Math.max(secs.length, Math.min(60, Math.round(secs.reduce((n, s) => n + s.words, 0) / 45))) : total;
    const w = secs.map(weight), W = w.reduce((a, b) => a + b, 0) || 1;
    const raw = w.map(x => want * x / W);
    const got = raw.map(x => Math.min(S.perSection, Math.floor(x)));
    let left = Math.max(0, want - got.reduce((a, b) => a + b, 0));
    const order = raw.map((x, i) => i).sort((a, b) => (raw[b] - Math.floor(raw[b])) - (raw[a] - Math.floor(raw[a])));
    // first, every empty section gets one while there are items to give; then the largest remainders
    for (const i of order) { if (!left) break; if (got[i] === 0) { got[i] = 1; left--; } }
    for (let pass = 0; left && pass < 4; pass++) for (const i of order) { if (!left) break; if (got[i] < S.perSection) { got[i]++; left--; } }
    return secs.map((s, i) => ({section: s, count: got[i]})).filter(x => x.count > 0);
  }
  // Worth splitting? Long material always (it's where a single request skims); anything for a small engine
  const worth = (secs, totalWords, kind) => { const S = SIZES[kind] || SIZES.cloud; return secs.length >= 2 && totalWords >= S.onlyOver; };
  // The text a section is shown with: where it sits in the material, then the section
  const label = s => (s.path && s.path.length ? s.path : [s.title]).filter(Boolean).join(" › ").slice(0, 160);
  // One go at material of several sources: [{name, text?, pdf?}] → sections, in order
  function fromSources(list, kind){
    const blocks = [];
    list.forEach(src => {
      const name = String(src.name || "").replace(/\.[a-z0-9]{2,5}$/i, "");
      const got = src.pdf ? blocksFromPdf(src.pdf, {title: name}) : blocksFromLines(String(src.text || "").replace(/^Source file: [^\n]*\n+/, "").replace(/^Pasted notes:\n+/, "").split(/\r?\n/), {title: list.length > 1 ? name : ""});
      got.forEach(b => blocks.push(b));
    });
    return sections(blocks, kind);
  }
  return {words, headingOf, blocksFromLines, blocksFromPdf, sections, weight, plan, worth, label, fromSources, SIZES, FLUFF};
})();
/*SECTIONS-END*/
window.SBSECT = SBSECT;
