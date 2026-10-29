/* ===== module: 99-exam-sheet.js ===== */
/* Formula and Diagram Sheet (Pro, no AI): for one exam, every formula, definition and picture card linked to it (through its Exam Prep
   topics' linked decks and notes, plus the lecture cards Exam Prep pulls in by lecture date) on one dense printable cheat sheet, grouped by
   topic. It prints through Print and PDF (a fifth page there, "Formula and Diagram Sheet") and opens from the exam's Prep Plan.
   Nothing is saved: the sheet is built from what is linked, every time. The pure part (detecting formulas and definitions, dedupe) is
   between EXAMSHEET-START and EXAMSHEET-END and is unit tested in tests/exam-sheet.test.js. */
(() => {
/*EXAMSHEET-START*/
const EXAMSHEET = (() => {
  const str = v => String(v == null ? "" : v);
  const flat = s => str(s).replace(/ /g, " ").replace(/[ \t]+/g, " ").trim();
  const h = s => str(s).replace(/[&<>"']/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"})[c]);
  const BULLET = /^\s*(?:[-*•▪●‣◦·–—>]|\d{1,3}[.)]|[a-z][.)]|\[[ xX]\])\s+(?=\S)/;
  const unMd = s => flat(str(s).replace(BULLET, "").replace(/\*\*([^*]+)\*\*/g, "$1").replace(/__([^_]+)__/g, "$1").replace(/`([^`]+)`/g, "$1").replace(/^#{1,6}\s+/, ""));

  /* formulas */
  const TEX_DELIM = /\$[^$\n]{1,200}\$|\\\(.{1,200}?\\\)|\\\[.{1,200}?\\\]/;
  const TEX_CMD = /\\(?:d?frac|sqrt|sum|int|oint|prod|lim|alpha|beta|gamma|delta|Delta|theta|lambda|mu|pi|sigma|Sigma|omega|Omega|rho|phi|epsilon|varepsilon|eta|tau|cdot|times|div|pm|mp|leq?|geq?|neq|approx|propto|infty|partial|nabla|vec|hat|bar|overline|log|ln|sin|cos|tan|exp|rightarrow|Rightarrow|to|left|right|mathrm|text)(?![A-Za-z])/;
  const DATEISH = /\b\d{1,2}:\d{2}\b|\b\d{1,2}\s*(?:am|pm)\b|\b(?:mon|tues?|wed(?:nes)?|thu(?:rs)?|fri|sat(?:ur)?|sun)(?:day)?s?\b|\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+\d/i;
  const FN = new Set("sin cos tan sec csc cot log ln exp sqrt lim max min mod abs det arcsin arccos arctan sinh cosh tanh".split(" "));
  const OPS = /[+*/^×·÷√∑∫∆ΔΣΩΦΨΓΛΘΠ²³⁴⁻¹½¼πθλμσωρφεη∞∂∇−±_]|\s-\s|\(\s*[A-Za-z0-9]/;
  const CHEM = /(?:[A-Z][a-z]?\d*){1,6}\s*(?:\+\s*(?:\d*(?:[A-Z][a-z]?\d*){1,6})\s*)*(?:→|->|⇌|<->)\s*\d*(?:[A-Z][a-z]?\d*){1,6}/;
  const longWords = s => str(s).split(/[^A-Za-z]+/).filter(w => w.length >= 4 && !FN.has(w.toLowerCase()));
  const wordsIn = s => str(s).split(/[^A-Za-z']+/).filter(w => w.replace(/'/g, "").length >= 2);
  // One line is a formula: LaTeX, a short equation with math on its right, or a chemical equation. Ordinary sentences with "=" are not.
  function isFormula(s){
    s = flat(s); if (!s || s.length > 160 || /https?:|www\./i.test(s)) return false;
    if (TEX_DELIM.test(s) || TEX_CMD.test(s)) return true;
    if (CHEM.test(s) && /\d|\+/.test(s) && longWords(s).length <= 2) return true;
    const m = /^(.{1,48}?)\s*(=|≈|≤|≥|≠|∝)\s*(.+)$/.exec(s); if (!m) return false;
    const lhs = m[1].trim(), rhs = m[3].trim();
    if (!lhs || !rhs || /^[=>]/.test(rhs) || /[<>!]$/.test(lhs)) return false;
    if (wordsIn(lhs).length > 4 || DATEISH.test(s)) return false;
    const lw = longWords(rhs);
    if (lw.length > 3 || (/[.!?]$/.test(rhs) && lw.length >= 2)) return false;
    if (/^[\d.,\s%$€£]+$/.test(rhs)) return false;
    if (/=/.test(rhs) && !/[A-Za-zα-ω]/.test(rhs.replace(/\b[A-Za-z]{1,3}\s*$/, ""))) return false;
    const compact = /^[A-Za-zα-ωΑ-Ω]{1,3}[²³]?$/.test(rhs) && /^[A-Za-zα-ωΑ-ΩΔ]/.test(lhs) && lhs.replace(/\s/g, "").length <= 4;
    return OPS.test(rhs) || compact;
  }
  const LEAD = /^(?:what\s+is\s+(?:the\s+)?(?:formula|equation|expression)\s+(?:for|of)\s+|(?:the\s+)?(?:formula|equation)\s+(?:for|of)\s+|formula:\s*|equation:\s*)/i;
  const tidyLabel = s => flat(str(s).replace(LEAD, "").replace(/[?:.\s]+$/, "")).slice(0, 90);
  // A formula in a piece of text (a card side or a note line): {expr, label}
  function formulaIn(text){
    const lines = str(text).split(/\r?\n/).map(unMd).filter(Boolean);
    for (const l of lines) {
      const m = /^([^:=$\\]{2,60}?)(?::\s+|\s+[–—]\s+)(.+)$/.exec(l);
      if (m && LABEL.test(flat(m[1]))) continue;
      if (m && isFormula(m[2]) && !isFormula(m[1])) return {expr: flat(m[2]), label: tidyLabel(m[1])};
      if (isFormula(l)) return {expr: l, label: ""};
    }
    return null;
  }
  const exprKey = e => flat(e).replace(/^\$+|\$+$/g, "").replace(/\\[()[\]]/g, "").replace(/\\[,;!]/g, "").replace(/[\s{}]/g, "").replace(/[.;,]+$/, "").replace(/−/g, "-").replace(/\*\*/g, "^").replace(/[·*×]/g, "").replace(/²/g, "^2").replace(/³/g, "^3");

  /* LaTeX-ish to readable HTML (the app has no math renderer) */
  const SYM = {alpha: "α", beta: "β", gamma: "γ", delta: "δ", Delta: "Δ", epsilon: "ε", varepsilon: "ε", eta: "η", theta: "θ", lambda: "λ", mu: "μ", pi: "π", rho: "ρ", sigma: "σ", Sigma: "Σ", tau: "τ", phi: "φ", omega: "ω", Omega: "Ω",
    cdot: "·", times: "×", div: "÷", pm: "±", mp: "∓", le: "≤", leq: "≤", ge: "≥", geq: "≥", neq: "≠", approx: "≈", propto: "∝", infty: "∞", partial: "∂", nabla: "∇", rightarrow: "→", Rightarrow: "⇒", to: "→", sum: "∑", int: "∫", oint: "∮", prod: "∏",
    sin: "sin", cos: "cos", tan: "tan", log: "log", ln: "ln", exp: "exp", lim: "lim", left: "", right: ""};
  function pretty(expr){
    let s = flat(expr).replace(/^\$\$?|\$\$?$/g, "").replace(/\$/g, "").replace(/\\\(|\\\)|\\\[|\\\]/g, "");
    s = s.replace(/\\(?:text|mathrm|mathbf|mathit|operatorname)\{([^{}]*)\}/g, "$1").replace(/\\[,;!:]/g, " ").replace(/\\ /g, " ");
    for (let i = 0; i < 3; i++) s = s.replace(/\\d?frac\{([^{}]*)\}\{([^{}]*)\}/g, (m, a, b) => `${/^\w+$/.test(a) ? a : "(" + a + ")"}/${/^\w+$/.test(b) ? b : "(" + b + ")"}`);
    s = s.replace(/\\sqrt\{([^{}]*)\}/g, "√($1)").replace(/\\sqrt\s*(\w)/g, "√$1");
    s = s.replace(/\\vec\{([^{}]*)\}/g, "$1⃗").replace(/\\(?:bar|overline)\{([^{}]*)\}/g, "$1̄").replace(/\\hat\{([^{}]*)\}/g, "$1̂");
    s = s.replace(/\\([A-Za-z]+)/g, (m, w) => SYM[w] != null ? SYM[w] : w);
    // escape, then raise and lower
    let o = h(s);
    o = o.replace(/\^\{([^{}]{1,16})\}/g, "<sup>$1</sup>").replace(/\^(-?[A-Za-z0-9α-ω]+)/g, "<sup>$1</sup>").replace(/\*\*(-?[A-Za-z0-9]+)/g, "<sup>$1</sup>");
    o = o.replace(/_\{([^{}]{1,16})\}/g, "<sub>$1</sub>").replace(/_([A-Za-z0-9α-ω]{1,3})/g, "<sub>$1</sub>");
    return o.replace(/[{}]/g, "").replace(/\s+/g, " ").trim();
  }

  /* definitions */
  // admin lines ("Due: Friday", "Room: 4B", "Chapter 3: Cells") are not definitions
  const LABEL = /^(?:due|date|dates|when|where|who|room|location|deadline|deadlines|todo|to do|note|notes|reminder|reminders|email|phone|page|pages|slides?|instructor|professor|prof|ta|tutor|homework|hw|quiz|exam|test|midterm|final|reading|readings|read|assignment|link|url|grades?|worth|examples?|e\.?g|ex|tips?|hint|q|a|question|answer|summary|remember|important|warning|see|ref|sources?|subject|fyi|update|agenda|contact|website|bring|materials|ps|nb|key points?|objectives?|topics?|section|part|step|class|speaker|teacher|time|times)$|^(?:due|office hours|exam|midterm|final exam|quiz|lecture|chapter|ch\.?|week|unit|module|page|pages|homework|hw|assignment|reading list|room|deadline|instructor|professor|prof|email|phone|contact|note|notes|reminder|todo|example|e\.?g)\b/i;
  const VERBY = /\b(?:is|are|was|were|has|have|had|will|must|should|can|do|does|did|because|which|that|i|we|you|my|our)\b/i;
  const QWORD = /^(?:why|how|which|when|where|who|whom|list|name|explain|describe|compare|contrast|give|state|calculate|find|solve|true or false|t\/f)\b/i;
  function termOK(term){
    const w = term.split(/\s+/).filter(Boolean);
    if (!w.length || w.length > 5 || term.length < 2 || term.length > 48) return false;
    if (!/^[A-Za-zÀ-ɏα-ωΑ-Ω]/.test(term) || /[.!?;=$\\]|_{3,}|https?:/i.test(term) || /\d{1,2}:\d{2}/.test(term)) return false;
    if (LABEL.test(term) || QWORD.test(term)) return false;
    if (w.length >= 3 && VERBY.test(term)) return false;
    return true;
  }
  function defOK(def){
    const w = wordsIn(def);
    if (w.length < 3 || def.length > 320 || /^https?:/i.test(def)) return false;
    if (DATEISH.test(def) && w.length < 6) return false;
    if (/_{3,}/.test(def)) return false;
    return true;
  }
  // "Term: definition", "Term — definition", "Term - definition" on one note line
  function defLine(line){
    const l = unMd(line); if (!l || l.length > 360) return null;
    const m = /^(.{2,50}?)(?:\s*:\s+|\s+[–—]\s+|\s+-\s+)(.+)$/.exec(l); if (!m) return null;
    const term = flat(m[1]).replace(/^["“]|["”]$/g, ""), def = flat(m[2]).replace(/\s*[;,]$/, "");
    if (!termOK(term) || !defOK(def) || isFormula(def) || isFormula(term)) return null;
    if (term.toLowerCase() === def.toLowerCase()) return null;
    return {term, def};
  }
  // A card that is a term on the front and its meaning on the back
  function defCard(front, back){
    let f = flat(front), b = flat(back);
    if (!f || !b || /\n/.test(str(front).trim()) || f.length > 70) return null;
    f = f.replace(/^(?:what\s+(?:is|are)\s+(?:an?\s+|the\s+)?|define\s+(?:an?\s+|the\s+)?|definition\s+of\s+(?:an?\s+|the\s+)?|meaning\s+of\s+)/i, "").replace(/^what\s+does\s+(.+?)\s+mean\??$/i, "$1").replace(/[?:]\s*$/, "").trim();
    if (!termOK(f) || !defOK(b) || isFormula(b) || isFormula(f)) return null;
    return {term: f.charAt(0).toUpperCase() + f.slice(1), def: b.replace(/\s*\n\s*/g, " ").slice(0, 320)};
  }
  const termKey = t => flat(t).toLowerCase().replace(/^(?:an?|the)\s+/, "").replace(/[^a-z0-9α-ω]+/g, " ").trim();

  /* picture cards: one entry per picture, its labels numbered by mask */
  const masksOf = im => im && Array.isArray(im.m) ? im.m : [];
  const okBox = b => Array.isArray(b) && b.length >= 4 && b.slice(0, 4).every(v => typeof v === "number" && isFinite(v));
  const setOf = c => c && c.img ? (c.img.s ? "s:" + c.img.s : "k:" + c.img.k + "|" + JSON.stringify(masksOf(c.img).map(b => Array.isArray(b) ? b.slice(0, 4) : b))) : "";
  const idxOf = c => { const im = c.img || {}, n = masksOf(im).length, g = Array.isArray(im.g) ? im.g.map(Number).filter(j => Number.isInteger(j) && j >= 0 && j < n) : []; return g.length ? [...new Set(g)] : [Math.max(0, Number(im.i) || 0)]; };
  function pictures(cards){
    const by = new Map();
    (cards || []).forEach(c => { if (!c || !c.img || !c.img.k || c.draft) return; const k = setOf(c); if (!by.has(k)) by.set(k, []); by.get(k).push(c); });
    return [...by.entries()].map(([key, cs]) => {
      const im = cs[0].img, m = masksOf(im), lab = [];
      cs.forEach(c => idxOf(c).forEach(j => { if (lab[j] == null && flat(c.back)) lab[j] = flat(c.back).slice(0, 80); }));
      const labels = [], seen = new Set();
      m.forEach((b, j) => { if (!okBox(b) || lab[j] == null) return; const t = lab[j], k = t.toLowerCase(); const first = !seen.has(k); seen.add(k); labels.push({n: 0, j, text: t, x: b[0] + b[2] / 2, y: b[1] + b[3] / 2, first}); });
      let n = 0; const num = {}; labels.forEach(l => { const k = l.text.toLowerCase(); if (!num[k]) num[k] = ++n; l.n = num[k]; });
      return {key, img: im.k, w: im.w || 4, h: im.h || 3, title: flat(im.src || "").slice(0, 80), labels, ids: cs.map(c => c.id)};
    }).filter(p => p.labels.length || p.img);
  }

  /* everything, grouped: sections = [{name, cards: [{...card, deckId}], notes: [{id, title, text}]}] */
  function collect(sections){
    const fKeys = new Set(), dKeys = new Set(), pKeys = new Set(), out = [];
    (sections || []).forEach(sec => {
      const S = {name: flat(sec.name) || "Other", formulas: [], defs: [], pictures: []};
      const addF = (f, src) => { if (!f) return; const k = exprKey(f.expr); if (!k || fKeys.has(k)) return; fKeys.add(k); S.formulas.push({expr: f.expr, label: f.label, src}); };
      const addD = (d, src) => { if (!d) return; const k = termKey(d.term); if (!k || dKeys.has(k)) return; dKeys.add(k); S.defs.push({term: d.term, def: d.def, src}); };
      (sec.cards || []).forEach(c => {
        if (!c || c.draft || c.img) return;
        const src = {k: "card", id: c.id, deckId: c.deckId || ""};
        const fb = formulaIn(c.back), ff = fb ? null : formulaIn(c.front);
        if (fb) addF({expr: fb.expr, label: fb.label || (formulaIn(c.front) ? "" : tidyLabel(c.front))}, src);
        else if (ff) addF({expr: ff.expr, label: ff.label || (flat(c.back).length <= 90 ? tidyLabel(c.back) : "")}, src);
        else addD(defCard(c.front, c.back), src);
      });
      pictures((sec.cards || []).filter(c => c && c.img)).forEach(p => { if (pKeys.has(p.key)) return; pKeys.add(p.key); S.pictures.push(p); });
      (sec.notes || []).forEach(n => {
        const src = {k: "note", id: n.id};
        str(n.text).split(/\r?\n/).forEach(line => {
          const l = unMd(line); if (!l) return;
          const f = formulaIn(l); if (f) { addF(f, src); return; }
          addD(defLine(l), src);
        });
      });
      if (S.formulas.length || S.defs.length || S.pictures.length) out.push(S);
    });
    const n = k => out.reduce((a, s) => a + s[k].length, 0);
    return {sections: out, counts: {formulas: n("formulas"), defs: n("defs"), pictures: n("pictures")}};
  }
  return {isFormula, formulaIn, pretty, defLine, defCard, pictures, collect, exprKey, termKey, h};
})();
/*EXAMSHEET-END*/

/* the app side */
const locked = () => { try { return !!(window.SBPRO && SBPRO.locked()); } catch (e) { return false; } };
const WHY = "The Formula and Diagram Sheet is part of Studyboard Pro: every formula, definition and diagram for an exam on one printable page.";
const topicsOf = ex => { const p = ex && ex.prep && typeof ex.prep === "object" ? ex.prep : {}; return Array.isArray(p.topics) && p.topics.length ? p.topics : (ex && ex.planTopics || []).map(t => ({name: t.name, links: []})); };
const noteName = n => { try { return SBPREP.EXAMPREP.headingsOf(n.text)[0] || ""; } catch (e) { return ""; } } ;
// What is linked to each topic, and the lecture cards Exam Prep pulls in by date that no topic has yet
function sectionsFor(ex){
  const out = [], used = new Set();
  topicsOf(ex).forEach(t => {
    const sec = {name: t.name, cards: [], notes: []};
    (t.links || []).forEach(l => {
      if (l.k === "deck") { const d = state.decks[l.id]; if (!d) return; const only = l.cardIds && l.cardIds.length ? new Set(l.cardIds) : null; d.cards.forEach(c => { if (!c.draft && (!only || only.has(c.id))) { sec.cards.push(Object.assign({}, c, {deckId: d.id})); used.add(d.id + "|" + c.id); } }); }
      else if (l.k === "note") { const n = state.notes[l.id]; if (n && !n.archived) sec.notes.push({id: n.id, title: noteName(n), text: n.text}); }
    });
    out.push(sec);
  });
  try {
    if (window.SBLC && ex.courseId && ex.due) SBLC.gather(ex).groups.forEach(g => {
      const sec = {name: g.name || "From your lectures", cards: [], notes: []};
      Object.keys(g.decks).forEach(did => { const d = state.decks[did]; if (!d) return; const ids = new Set(g.decks[did]); d.cards.forEach(c => { if (ids.has(c.id) && !c.draft && !used.has(did + "|" + c.id)) sec.cards.push(Object.assign({}, c, {deckId: did})); }); });
      if (g.noteId && state.notes[g.noteId] && !topicsOf(ex).some(t => (t.links || []).some(l => l.k === "note" && l.id === g.noteId))) { const n = state.notes[g.noteId]; sec.notes.push({id: n.id, title: noteName(n), text: n.text}); }
      if (sec.cards.length || sec.notes.length) out.push(sec);
    });
  } catch (e) { console.warn("exam sheet: lectures", e); }
  return out;
}
const linked = ex => topicsOf(ex).some(t => (t.links || []).some(l => (l.k === "deck" && state.decks[l.id]) || (l.k === "note" && state.notes[l.id])));
const modelOf = ex => EXAMSHEET.collect(sectionsFor(ex));
// Upcoming exams with topics (the ones a sheet can be made for)
const exams = () => tasksArr().filter(t => MILESTONE(t.type) && t.status !== "done" && t.due && t.due >= todayISO() && topicsOf(t).length).sort((a, b) => a.due < b.due ? -1 : a.due > b.due ? 1 : 0);

/* pictures: loaded once per session as object URLs (same store as the picture cards) */
const URLS = new Map();
async function blobOf(key){
  let b = null; try { b = await idbGet("cimg:" + key); } catch (e) { b = null; }
  if (b) return b;
  if (key.startsWith("a:")) { const bytes = await assetBytes(key.slice(2)); return new Blob([bytes], {type: "image/jpeg"}); }
  return null;
}
function load(key){
  if (URLS.has(key)) return Promise.resolve(URLS.get(key));
  const p = blobOf(key).then(b => b ? URL.createObjectURL(b) : "x").catch(() => "x").then(u => { URLS.set(key, u); return u; });
  URLS.set(key, p); return p;
}
const urlNow = key => { const u = URLS.get(key); return typeof u === "string" ? u : ""; };
let redrawT = 0;
const redraw = () => { clearTimeout(redrawT); redrawT = setTimeout(() => { try { if (window.SBPRO && SBPRO.redrawPrint) SBPRO.redrawPrint(); } catch (e) {} }, 30); };
function preload(model, ms){
  const keys = []; model.sections.forEach(s => s.pictures.forEach(p => { if (p.img && !URLS.has(p.img)) keys.push(p.img); }));
  if (!keys.length) return Promise.resolve();
  return Promise.race([Promise.all(keys.map(load)).then(redraw), new Promise(r => setTimeout(r, ms || 1500))]);
}

/* the page */
const H = EXAMSHEET.h;
function picHtml(p){
  const u = urlNow(p.img); if (!URLS.has(p.img)) load(p.img).then(redraw);
  const ar = Math.max(0.3, Math.min(4, p.w / p.h)).toFixed(3);
  const marks = p.labels.filter(l => l.first).map(l => `<i class="xs-n" style="left:${(Math.max(0, Math.min(1, l.x)) * 100).toFixed(2)}%;top:${(Math.max(0, Math.min(1, l.y)) * 100).toFixed(2)}%">${l.n}</i>`).join("");
  const legend = p.labels.filter(l => l.first).map(l => `<li><b>${l.n}</b> ${H(l.text)}</li>`).join("");
  return `<div class="xs-pic-w">${p.title ? `<div class="xs-pt">${H(p.title)}</div>` : ""}<div class="xs-pic" style="aspect-ratio:${ar}">${u && u !== "x" ? `<img src="${H(u)}" alt="${H(p.title || "Diagram")}">` : `<span class="xs-wait">${u === "x" ? "Picture not on this device" : "Loading picture…"}</span>`}${marks}</div>${legend ? `<ol class="xs-leg">${legend}</ol>` : ""}</div>`;
}
function html(exId, o){
  o = o || {};
  const ex = state.tasks[exId];
  if (!ex) return `<div class="pp-page xs-page"><p>Choose an exam with topics. Open an exam and choose Plan My Prep to add them.</p></div>`;
  const want = {f: o.xsF !== false, d: o.xsD !== false, p: o.xsI !== false}, M = modelOf(ex), c = courseOf(ex.courseId);
  const secs = M.sections.map(s => {
    const f = want.f ? s.formulas : [], d = want.d ? s.defs : [], p = want.p ? s.pictures : [];
    if (!f.length && !d.length && !p.length) return "";
    return `<section class="xs-sec"><h2>${H(s.name)}</h2>
      ${f.length ? `<div class="xs-k">Formulas</div>${f.map(x => `<div class="xs-f"><span class="xs-x">${EXAMSHEET.pretty(x.expr)}</span>${x.label ? ` <span class="xs-l">${H(x.label)}</span>` : ""}</div>`).join("")}` : ""}
      ${d.length ? `<div class="xs-k">Definitions</div>${d.map(x => `<div class="xs-d"><b>${H(x.term)}</b> ${H(x.def)}</div>`).join("")}` : ""}
      ${p.length ? `<div class="xs-k">Diagrams</div>${p.map(picHtml).join("")}` : ""}</section>`;
  }).join("");
  const total = (want.f ? M.counts.formulas : 0) + (want.d ? M.counts.defs : 0) + (want.p ? M.counts.pictures : 0);
  const sub = [parse(ex.due).toLocaleDateString(undefined, {weekday: "short", month: "short", day: "numeric"}) + (ex.time ? " · " + fmtTime(ex.time) : ""), c ? courseLabel(c) : "",
    [want.f && M.counts.formulas ? `${M.counts.formulas} formula${M.counts.formulas === 1 ? "" : "s"}` : "", want.d && M.counts.defs ? `${M.counts.defs} definition${M.counts.defs === 1 ? "" : "s"}` : "", want.p && M.counts.pictures ? `${M.counts.pictures} diagram${M.counts.pictures === 1 ? "" : "s"}` : ""].filter(Boolean).join(", ")].filter(Boolean).join(" · ");
  const empty = !topicsOf(ex).length ? "This exam has no topics yet. Open it, choose Plan My Prep and add the topics it covers."
    : !linked(ex) && !M.sections.length ? "Nothing is linked to this exam's topics yet. In its Prep Plan, choose Edit Topics and link the decks and notes for each topic."
    : "No formulas, definitions or picture cards were found in the decks and notes linked to this exam. Cards like “Newton's second law / F = ma” or “Osmosis / Movement of water across a membrane”, note lines like “Term: meaning”, and picture cards all go on the sheet.";
  return `<div class="pp-page xs-page"><div class="xs-head"><h1>${H(ex.title)}: Formula and Diagram Sheet</h1><p>${H(sub)}</p><p class="xs-src">Made from your own decks and notes. Check anything you'll rely on.</p></div>
    ${total ? `<div class="xs-cols">${secs}</div>` : `<p class="xs-empty">${H(empty)}</p>`}</div>`;
}

/* Print and PDF: the exam picker and what to include */
function printControls(PR){
  const list = exams();
  ["xsF", "xsD", "xsI"].forEach(k => { if (PR.opts[k] === undefined) PR.opts[k] = true; });
  if (!list.some(t => t.id === PR.exam)) PR.exam = list[0] ? list[0].id : "";
  const ex = state.tasks[PR.exam]; if (ex) preload(modelOf(ex));
  const chk = (k, l) => `<label class="mi-check"><input type="checkbox" data-pr-opt="${k}"${PR.opts[k] ? " checked" : ""}> ${l}</label>`;
  return list.length ? `<label class="f">Exam<select data-pr-exam>${list.map(t => `<option value="${H(t.id)}"${PR.exam === t.id ? " selected" : ""}>${H(t.title)} · ${H(fmtShort(t.due))}</option>`).join("")}</select></label>
    <div class="pr-opts xs-opts">${chk("xsF", "Formulas")}${chk("xsD", "Definitions")}${chk("xsI", "Diagrams")}</div><p class="mini" style="margin:0">Small type in three columns, grouped by topic. Untick a kind to fit fewer pages.</p>`
    : `<p class="mini" style="margin:0">No upcoming exam has topics yet. Open an exam and choose Plan My Prep to add them.</p>`;
}
// From the exam's Prep Plan
async function open(exId){
  if (locked()) { if (dlg.open) dlg.close(); if (typeof PLAN !== "undefined" && PLAN) PLAN.openSheet(WHY); return; }
  const ex = state.tasks[exId]; if (!ex) return;
  await preload(modelOf(ex), 1200);
  SBPRO.openPrint("sheet", exId);
}
function btn(ex){
  if (!ex || ex.status === "done" || !ex.due || ex.due < todayISO() || !linked(ex)) return "";
  return `<button type="button" class="link-btn xs-go" data-act="xs-open" data-id="${H(ex.id)}">Formula and Diagram Sheet${locked() ? " " + PRO_BADGE : ""}</button>`;
}
// On hold: hidden everywhere in the app (Prep Plan link, Print and PDF layout, Pro features list). Tests switch it on with window.__SB_XS.
if (!(window.__SB_TEST && window.__SB_XS)) return;
hook("act", (act, el, id) => {
  if (act === "xs-open") { open(id); return true; }
  return false;
});
if (window.SBPRO) SBPRO.addFeature({id: "examsheet", name: "Formula and Diagram Sheet", where: "In an exam's Prep Plan, and Print and PDF: every formula, definition and diagram linked to the exam on one printable sheet", icon: '<path d="M5 3h10l4 4v14H5z"/><path d="M8 9h3M9.5 7.5v3M13 9h3M8 14l3 3M11 14l-3 3M13 15.5h3"/>'});
window.SBEXAMSHEET = {html, printControls, open, btn, exams, model: id => state.tasks[id] ? modelOf(state.tasks[id]) : null, EXAMSHEET};

const css = document.createElement("style");
css.textContent = `
.xs-go{display:inline-block;text-align:left;font-size:.86rem;margin:0 0 8px}
.pp-page.xs-page{display:block;font-size:9.5px;line-height:1.28;padding:26px 30px}
.xs-head{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:baseline;gap:4px 12px;border-bottom:1.5px solid #0F1F3D;padding-bottom:4px;margin-bottom:6px}
.xs-page .xs-head h1{font:700 15px/1.15 Lexend,system-ui,sans-serif;margin:0}
.xs-head p{margin:0;color:#4A576E;font-size:9.5px}
.xs-cols{column-count:3;column-gap:14px;column-rule:1px solid #C6CEDB;column-fill:balance}
.xs-sec{margin:0 0 6px}
.xs-page .xs-sec h2{font:600 10.5px/1.2 Lexend,system-ui,sans-serif;margin:0 0 2px;padding:2px 4px;background:#EEF2F8;border-left:3px solid #0F1F3D;break-after:avoid}
.xs-k{font-weight:700;font-size:7.5px;letter-spacing:.06em;text-transform:uppercase;color:#4A576E;margin:3px 0 1px;break-after:avoid}
.xs-f,.xs-d{break-inside:avoid;margin:0 0 2px;overflow-wrap:anywhere}
.xs-x{font-family:"Cambria Math","STIX Two Math",Cambria,"Times New Roman",serif;font-size:10.5px}
.xs-x sup,.xs-x sub{font-size:.72em;line-height:0}
.xs-l{color:#4A576E}
.xs-d b{font-weight:700}
.xs-d b::after{content:":"}
.xs-pic-w{break-inside:avoid;margin:2px 0 5px}
.xs-pt{font-weight:600;margin-bottom:1px}
.xs-pic{position:relative;width:100%;max-height:220px;border:1px solid #C6CEDB;border-radius:4px;overflow:hidden;background:#fff}
.xs-pic img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain}
.xs-wait{position:absolute;inset:0;display:grid;place-items:center;color:#4A576E;font-size:8.5px}
.xs-n{position:absolute;transform:translate(-50%,-50%);min-width:13px;height:13px;padding:0 2px;border-radius:7px;background:#0F1F3D;color:#fff;font:700 8px/13px system-ui,sans-serif;text-align:center;font-style:normal;box-shadow:0 0 0 1.5px #fff}
.xs-leg{list-style:none;margin:2px 0 0;padding:0;display:flex;flex-wrap:wrap;gap:1px 8px;font-size:8.5px}
.xs-leg b{display:inline-block;min-width:12px;height:12px;border-radius:6px;background:#0F1F3D;color:#fff;font-size:7.5px;line-height:12px;text-align:center;margin-right:2px}
.xs-empty{font-size:12px;max-width:560px}
.xs-head .xs-src{flex-basis:100%;font-size:8px}
.pr-scale .pp-page.xs-page{min-height:1000px}
@media print{#sbPrint .pp-page.xs-page{min-height:0;padding:0}}
`;
document.head.appendChild(css);
})();
