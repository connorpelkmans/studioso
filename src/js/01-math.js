/* ===== module: 01-math.js: math, chemistry and light formatting in notes, cards, quizzes, whiteboards and the reader ===== */
/* Text keeps plain marks, so it syncs, searches, exports and shares as it is:
     $x^2$ or \(x^2\) inline, $$...$$ or \[...\] on a line of its own, \ce{H2O} (or $\ce{...}$) for chemistry,
     **bold**, *italic*, ~~struck~~, ==highlighted== and `code`.
   They're drawn wherever that text is shown (RT_SCOPES below). Math is drawn by KaTeX, loaded the first time it's needed.
   Fields that take text (RT_EDIT) get a small toolbar while they have focus, with an equation editor. */
const KATEX_DIR = "vendor/katex-0.18.11/";
const KATEX_SRI = "sha384-vaygNa7Kw+54Zb42f7K+4bfhZp4vWSHPJMKwd7nVmlgSvRADUrCRRdCpc1/CJwO+";
const MHCHEM_SRI = "sha384-fB8BH//9nBzROkMUsu/Dr35jWHIbnKesUo9rW0hfEgw8mZGnkAyBAjKX9F98OVuo";
const MATH_MAX = 3000;
let katexReady = null, katexOk = false;
function loadKatex(){
  if (katexOk) return Promise.resolve();
  if (!katexReady) katexReady = (async () => {
    if (!document.querySelector("link[data-katex]")) { const l = document.createElement("link"); l.rel = "stylesheet"; l.href = KATEX_DIR + "katex.min.css"; l.dataset.katex = "1"; document.head.appendChild(l); }
    if (!window.katex) await loadScript(KATEX_DIR + "katex.min.js", KATEX_SRI);
    if (!window.katex) throw new Error("no katex");
    try { await loadScript(KATEX_DIR + "contrib/mhchem.min.js", MHCHEM_SRI); } catch (e) {}
    katexOk = true;
  })().catch(e => { katexReady = null; throw e; });
  return katexReady;
}
// The end of a {...} group that starts at i (s[i] is "{"), or -1
function braceEnd(s, i){
  if (s[i] !== "{") return -1;
  for (let d = 0, j = i; j < s.length && j - i < MATH_MAX; j++) {
    if (s[j] === "\\") { j++; continue; }
    if (s[j] === "{") d++;
    else if (s[j] === "}" && --d === 0) return j;
  }
  return -1;
}
// Text as plain runs and math: [{m: false, s, a, b}, {m: true, s: tex, d: on its own line, a, b}] (a and b: where it is in the text)
// A single $ opens math only before a non-space and closes after one, not before a digit, so "$5 and $10" stays text
function mathSplit(s){
  s = String(s == null ? "" : s);
  const out = []; let buf = "", from = 0, i = 0;
  const push = (tex, d, end) => { if (buf) out.push({m: false, s: buf, a: from, b: i}); buf = ""; out.push({m: true, s: tex, d, a: i, b: end}); i = from = end; };
  while (i < s.length) {
    const c = s[i], n = s[i + 1];
    if (c === "\\" && n === "$") { if (!buf) from = i; buf += "$"; i += 2; continue; }
    if (c === "\\" && (n === "(" || n === "[")) {
      const j = s.indexOf(n === "(" ? "\\)" : "\\]", i + 2);
      if (j > i + 2 && j - i < MATH_MAX && s.slice(i + 2, j).trim()) { push(s.slice(i + 2, j).trim(), n === "[", j + 2); continue; }
    }
    if (c === "\\" && s.startsWith("\\ce{", i)) {
      const j = braceEnd(s, i + 3);
      if (j > 0) { push(s.slice(i, j + 1), false, j + 1); continue; }
    }
    if (c === "$" && n === "$") {
      const j = s.indexOf("$$", i + 2);
      if (j > i + 2 && j - i < MATH_MAX && s.slice(i + 2, j).trim()) { push(s.slice(i + 2, j).trim(), true, j + 2); continue; }
      if (!buf) from = i; buf += "$$"; i += 2; continue;
    }
    if (c === "$" && n && !/\s/.test(n)) {
      let j = i + 1, end = -1;
      while (j < s.length && j - i < MATH_MAX) {
        const x = s[j];
        if (x === "\\") { j += 2; continue; }
        if (x === "\n") break;
        if (x === "$") { if (!/\s/.test(s[j - 1]) && !/\d/.test(s[j + 1] || "")) end = j; break; }
        j++;
      }
      if (end > i + 1) { push(s.slice(i + 1, end), false, end + 1); continue; }
    }
    if (!buf) from = i;
    buf += c; i++;
  }
  if (buf) out.push({m: false, s: buf, a: from, b: s.length});
  return out;
}
const hasMath = s => mathSplit(s).some(t => t.m);
// Light formatting inside a plain run. A mark only counts at a word's edge, so 2*3*4, a==b and snake_case stay as they are
const FMT_RE = /(^|[\s([{"'“‘—–/-])(\*\*|~~|==|\*|`)(?=\S)([^\n]*?[^\s\\])\2(?=$|[\s)\]}.,;:!?"'”’—–/-])/g;
const FMT_TAG = {"**": "strong", "*": "em", "~~": "s", "==": "mark", "`": "code"};
function fmtFrag(s, depth){
  const frag = document.createDocumentFragment(); let last = 0, m, any = false;
  const re = new RegExp(FMT_RE.source, "g");
  while ((m = re.exec(s))) {
    const start = m.index + m[1].length;
    if (start > last) frag.appendChild(document.createTextNode(s.slice(last, start)));
    const el = document.createElement(FMT_TAG[m[2]]);
    if (m[2] === "==") el.className = "rt-mark";
    if (m[2] !== "`" && depth < 2) { const inner = fmtFrag(m[3], depth + 1); el.appendChild(inner || document.createTextNode(m[3])); }
    else el.textContent = m[3];
    frag.appendChild(el); last = re.lastIndex; any = true;
  }
  if (!any) return null;
  if (last < s.length) frag.appendChild(document.createTextNode(s.slice(last)));
  return frag;
}
// A math placeholder; drawn by KaTeX as soon as it's loaded (until then it shows the typed text)
function mathEl(tex, d, raw){
  const el = document.createElement("span");
  el.className = "mth" + (d ? " mth-d" : ""); el.dataset.tex = tex; if (d) el.dataset.d = "1";
  el.textContent = raw;
  drawMath(el);
  return el;
}
// The same placeholder as HTML, for code that builds HTML strings
// fallback: HTML to show until (or if) KaTeX can't load, instead of the typed text
const mathHtml = (tex, d, fallback) => `<span class="mth${d ? " mth-d" : ""}${fallback ? " mth-fb" : ""}" data-tex="${esc(tex)}"${d ? ' data-d="1"' : ""}>${fallback || esc(d ? "$$" + tex + "$$" : "$" + tex + "$")}</span>`;
const KX_CACHE = new Map();
function drawMath(el){
  if (!katexOk) { loadKatex().then(() => mathPending(document)).catch(() => {}); return; }
  const tex = el.dataset.tex || "", d = el.dataset.d === "1", key = (d ? "D" : "I") + tex;
  let html = KX_CACHE.get(key);
  if (html == null) {
    try { html = window.katex.renderToString(tex, {displayMode: d, throwOnError: false, trust: false, strict: "ignore", maxSize: 40, maxExpand: 400, output: "htmlAndMathml"}); }
    catch (e) { html = ""; }
    if (KX_CACHE.size > 800) KX_CACHE.clear();
    KX_CACHE.set(key, html);
  }
  if (!html) { el.classList.add("mth-bad"); return; }
  el.innerHTML = html; el.classList.add("mth-ok");
  mathFit(el);
}
// A formula wider than its sticky note shrinks to fit (down to 60%) instead of being cut off at the edge
function mathFit(el){
  const box = el.closest(".note-body"); if (!box) return;
  el.style.fontSize = "";
  const cs = getComputedStyle(box), room = box.clientWidth - (parseFloat(cs.paddingLeft) || 0) - (parseFloat(cs.paddingRight) || 0), w = el.offsetWidth;
  if (room > 0 && w > room) el.style.fontSize = Math.max(0.6, Math.floor(room / w * 100) / 100) + "em";
}
function mathPending(root){ (root || document).querySelectorAll(".mth:not(.mth-ok):not(.mth-bad)").forEach(drawMath); }
// Plain text to a fragment with math and formatting, or null when there's nothing to draw
function richFrag(s){
  const parts = mathSplit(s);
  if (parts.length === 1 && !parts[0].m) return fmtFrag(s, 0);
  const frag = document.createDocumentFragment();
  parts.forEach(p => {
    if (p.m) frag.appendChild(mathEl(p.s, p.d, s.slice(p.a, p.b)));
    else frag.appendChild(fmtFrag(p.s, 0) || document.createTextNode(p.s));
  });
  return frag;
}
const RT_SKIP = "textarea,input,select,script,style,code,pre,.katex,.mth,[contenteditable],.rt-raw";
const RT_HINT = /[$\\*~=`]/;
function richNode(el){
  if (!el || el.nodeType !== 1 || !RT_HINT.test(el.textContent)) return;
  const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {acceptNode: n => RT_HINT.test(n.data) && !(n.parentElement && n.parentElement.closest(RT_SKIP)) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT});
  const list = []; while (tw.nextNode()) list.push(tw.currentNode);
  list.forEach(n => { const f = richFrag(n.data); if (f && n.parentNode) n.parentNode.replaceChild(f, n); });
}
// Where text is shown with its math and formatting: notes, card faces and lists, quizzes, whiteboard text, the reader's
// comments, picture card answers, Match tiles, and anything marked class="rt"
const RT_SCOPES = [".note-body", ".face-text", ".fc-front", ".fc-back", ".q-prompt", ".q-card .mc", ".q-card .tf-pair", ".q-card .written", ".miss-list",
  "button.opt", ".opt-note", ".q-card .rationale", ".q-card .ans", ".q-card .ai-fb", ".ci-ans", ".mt-tx", ".wb-t", ".pdr-lc", ".ar-cards", ".face-hint", ".sx-t", ".sx-s", ".rt", "[data-rt]"];
let rtQueued = false;
function rtRun(){
  rtQueued = false;
  document.querySelectorAll(RT_SCOPES.join(",")).forEach(el => {
    const t = el.textContent;
    if (el.__rt === t) return;
    richNode(el); el.__rt = el.textContent;
    if (el.classList.contains("note-body")) el.querySelectorAll(".mth.mth-ok").forEach(mathFit);
  });
  if (katexOk) mathPending(document);
}
const rtSoon = () => { if (!rtQueued) { rtQueued = true; requestAnimationFrame(rtRun); } };
if (typeof MutationObserver === "function") new MutationObserver(rtSoon).observe(document.documentElement, {childList: true, subtree: true, characterData: true});
rtSoon();
// Math read aloud and in plain-text places: "$\frac{a}{b}$" becomes "a over b"
const SPEAK = {alpha: "alpha", beta: "beta", gamma: "gamma", delta: "delta", Delta: "delta", theta: "theta", lambda: "lambda", mu: "mu", pi: "pi", sigma: "sigma", Sigma: "sum", omega: "omega", Omega: "omega", phi: "phi", rho: "rho", epsilon: "epsilon",
  times: "times", cdot: "times", div: "divided by", pm: "plus or minus", le: "at most", leq: "at most", ge: "at least", geq: "at least", ne: "is not", neq: "is not", approx: "is about", infty: "infinity", to: "to", rightarrow: "gives", int: "the integral of", sum: "the sum of", sqrt: "the square root of", partial: "partial"};
function mathSpeech(s){
  return mathSplit(s).map(p => {
    if (!p.m) return p.s.replace(/\*\*|~~|==|`/g, "");
    let t = p.s.replace(/\\ce\{([^{}]*)\}/g, "$1").replace(/->/g, " gives ").replace(/<=>/g, " in equilibrium with ");
    for (let k = 0; k < 3; k++) t = t.replace(/\\[dt]?frac\{([^{}]*)\}\{([^{}]*)\}/g, " $1 over $2 ").replace(/\\sqrt\{([^{}]*)\}/g, " the square root of $1 ");
    t = t.replace(/\^\{?2\}?/g, " squared ").replace(/\^\{?3\}?/g, " cubed ").replace(/\^\{([^{}]*)\}/g, " to the power $1 ").replace(/\^(\w)/g, " to the power $1 ").replace(/_\{([^{}]*)\}/g, " sub $1 ").replace(/_(\w)/g, " sub $1 ");
    t = t.replace(/\\([A-Za-z]+)/g, (m, w) => SPEAK[w] != null ? " " + SPEAK[w] + " " : " " + w + " ").replace(/[{}\\&]/g, " ").replace(/=/g, " equals ").replace(/\+/g, " plus ").replace(/(\s)-(\s)/g, " minus ");
    return t.replace(/\s+/g, " ").trim();
  }).join("").replace(/\s+/g, " ");
}

// Math as plain characters, for places that can only draw text (a whiteboard saved as a picture): "$x^2 \cdot \frac{a}{b}$" is "x² · (a)/(b)"
const SUPS = {"0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹", "+": "⁺", "-": "⁻", "n": "ⁿ", "i": "ⁱ", "(": "⁽", ")": "⁾"};
const SUBS = {"0": "₀", "1": "₁", "2": "₂", "3": "₃", "4": "₄", "5": "₅", "6": "₆", "7": "₇", "8": "₈", "9": "₉", "+": "₊", "-": "₋", "(": "₍", ")": "₎"};
const PLAIN = {alpha: "α", beta: "β", gamma: "γ", delta: "δ", epsilon: "ε", zeta: "ζ", eta: "η", theta: "θ", iota: "ι", kappa: "κ", lambda: "λ", mu: "μ", nu: "ν", xi: "ξ", pi: "π", rho: "ρ", sigma: "σ", tau: "τ", phi: "φ", chi: "χ", psi: "ψ", omega: "ω",
  Gamma: "Γ", Delta: "Δ", Theta: "Θ", Lambda: "Λ", Pi: "Π", Sigma: "Σ", Phi: "Φ", Psi: "Ψ", Omega: "Ω", cdot: "·", times: "×", div: "÷", pm: "±", mp: "∓", le: "≤", leq: "≤", ge: "≥", geq: "≥", ne: "≠", neq: "≠", approx: "≈", equiv: "≡", sim: "∼", propto: "∝",
  infty: "∞", partial: "∂", nabla: "∇", int: "∫", oint: "∮", sum: "Σ", prod: "Π", to: "→", rightarrow: "→", Rightarrow: "⇒", Leftrightarrow: "⇔", leftrightarrow: "↔", in: "∈", notin: "∉", subseteq: "⊆", cup: "∪", cap: "∩", emptyset: "∅", forall: "∀", exists: "∃",
  neg: "¬", land: "∧", lor: "∨", therefore: "∴", angle: "∠", perp: "⊥", parallel: "∥", triangle: "△", circ: "°", degree: "°", ldots: "…", cdots: "⋯", sin: "sin", cos: "cos", tan: "tan", log: "log", ln: "ln", lim: "lim", exp: "exp", left: "", right: "", quad: " ", qquad: "  "};
const raise = (s, map) => [...s].every(c => map[c]) ? [...s].map(c => map[c]).join("") : null;
function mathPlain(s){
  return mathSplit(s).map(p => {
    if (!p.m) return p.s.replace(/\*\*|~~|==|`/g, "");
    let t = p.s;
    // Chemistry: \ce{SO4^{2-}} is SO₄²⁻ (the braces inside are matched, so nested ones work)
    for (let i = t.indexOf("\\ce{"), guard = 0; i >= 0 && guard < 50; i = t.indexOf("\\ce{"), guard++) {
      const j = braceEnd(t, i + 3); if (j < 0) break;
      const c = t.slice(i + 4, j).replace(/\^\{?([0-9]*[+-])\}?/g, (q, x) => raise(x, SUPS) || q).replace(/([A-Za-z)\]])(\d+)/g, (q, a, d) => a + raise(d, SUBS)).replace(/<=>/g, "⇌").replace(/->/g, "→");
      t = t.slice(0, i) + c + t.slice(j + 1);
    }
    for (let k = 0; k < 3; k++) t = t.replace(/\\[dt]?frac\{([^{}]*)\}\{([^{}]*)\}/g, (m, a, b) => `${a.length > 1 ? "(" + a + ")" : a}/${b.length > 1 ? "(" + b + ")" : b}`).replace(/\\sqrt\{([^{}]*)\}/g, (m, a) => "√" + (a.length > 1 ? "(" + a + ")" : a));
    t = t.replace(/\\(?:text|mathrm|mathbf|mathit|operatorname)\{([^{}]*)\}/g, "$1").replace(/\\[,;!: ]/g, " ");
    t = t.replace(/\^\{([^{}]*)\}|\^(\S)/g, (m, a, b) => raise(a != null ? a : b, SUPS) || "^" + (a != null ? "(" + a + ")" : b));
    t = t.replace(/_\{([^{}]*)\}|_(\S)/g, (m, a, b) => raise(a != null ? a : b, SUBS) || "_" + (a != null ? "(" + a + ")" : b));
    return t.replace(/\\([A-Za-z]+)/g, (m, w) => PLAIN[w] != null ? PLAIN[w] : w).replace(/[{}]/g, "").replace(/\s+/g, " ").trim();
  }).join("");
}

/* Writing: a toolbar on fields that take formatted text, and an equation editor */
const RT_EDIT = ["#noteText", "textarea[name=front]", "textarea[name=back]", "#fcFront", "#fcBack", "#bkText", "[data-qm=stem]", "[data-qm=rationale]", "input[data-qm=opt]", "input[data-qm=answer]",
  "[data-nc-f]", "[data-nc-b]", "[data-lc-f]", "[data-lc-b]", "#pdrFront", "#pdrBack", "#pdrCm", ".wb-ta", "[data-rich]"].join(",");
const RB = {bar: null, eq: null, field: null, sel: null, tok: null, hideT: 0};
const RB_ICON = d => `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const MOD = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent || "") ? "⌘" : "Ctrl+";
// The equation editor's shortcut: Alt+= (as in Word), but Control+= on a Mac, where Option+= types ≠ (Word for Mac's own)
const EQ_KEY = MOD === "⌘" ? "⌃=" : "Alt+=";
const eqKey = e => e.code === "Equal" && !e.shiftKey && !e.metaKey && (MOD === "⌘" ? e.ctrlKey && !e.altKey : e.altKey && !e.ctrlKey);
function rbBarEl(){
  if (RB.bar) return RB.bar;
  const b = document.createElement("div");
  b.className = "rb-bar"; b.setAttribute("role", "toolbar"); b.setAttribute("aria-label", "Formatting"); b.hidden = true;
  const btn = (k, label, title, inner) => `<button type="button" class="rb-b rb-k-${k}" data-rb="${k}" aria-label="${esc(label)}" title="${esc(title)}">${inner}</button>`;
  b.innerHTML = btn("b", "Bold", `Bold (${MOD}B)`, "<b>B</b>") + btn("i", "Italic", `Italic (${MOD}I)`, "<i>I</i>") + btn("s", "Strikethrough", "Strikethrough", "<s>S</s>")
    + btn("hl", "Highlight", "Highlight", '<span class="rb-hl">H</span>') + `<span class="rb-sep" aria-hidden="true"></span>`
    + btn("sup", "Superscript", "Superscript, like x²", "x²") + btn("sub", "Subscript", "Subscript, like H₂O", "x₂")
    + btn("eq", "Equation", `Equation, math or chemistry (${EQ_KEY})`, RB_ICON('<path d="M18 5H7l5 7-5 7h11"/>') + "<span>Equation</span>");
  // Pressing a button keeps the text box focused, and its selection
  b.addEventListener("pointerdown", e => { if (e.target.closest("button")) e.preventDefault(); });
  b.addEventListener("mousedown", e => { if (e.target.closest("button")) e.preventDefault(); });
  b.addEventListener("click", e => { const x = e.target.closest("[data-rb]"); if (!x) return; e.preventDefault(); e.stopPropagation(); rbDo(x.dataset.rb); });
  RB.bar = b; return b;
}
const rbRoot = f => (f && f.closest && f.closest("dialog")) || document.body;
// Fixed position, measured against whatever contains it (a sheet that's sliding in has a transform)
function rbPlace(el, f, below){
  const root = rbRoot(f); if (el.parentNode !== root) root.appendChild(el);
  const r = f.getBoundingClientRect(), cs = root === document.body ? null : getComputedStyle(root);
  const off = cs && cs.transform && cs.transform !== "none" ? root.getBoundingClientRect() : {left: 0, top: 0};
  const vw = window.innerWidth, w = el.offsetWidth, h = el.offsetHeight, vv = window.visualViewport;
  const vTop = vv ? vv.offsetTop : 0, vH = vv ? vv.height : window.innerHeight;
  let top = below ? r.bottom + 6 : r.top - h - 6;
  if (!below && top < vTop + 6) top = r.bottom + 6;
  if (top + h > vTop + vH - 4) top = Math.max(vTop + 6, vTop + vH - h - 4);
  // The toolbar sits at the field's right edge, clear of its label on the left; the equation box below starts at its left
  const left = Math.max(6, Math.min(vw - w - 6, below ? r.left : r.right - w));
  el.style.left = (left - off.left) + "px"; el.style.top = (top - off.top) + "px";
}
function rbShow(f){
  clearTimeout(RB.hideT);
  RB.field = f; const b = rbBarEl();
  b.querySelector('[data-rb="eq"]').hidden = f.tagName === "INPUT" && f.type !== "text";
  b.hidden = false; rbPlace(b, f); rbFollow();
}
// A sheet that's still sliding in moves the field: the toolbar follows it for a moment
let rbFollowT = 0;
function rbFollow(){ const t0 = performance.now(); cancelAnimationFrame(rbFollowT); const step = () => { rbMove(); if (performance.now() - t0 < 900) rbFollowT = requestAnimationFrame(step); }; rbFollowT = requestAnimationFrame(step); }
function rbHide(){ if (RB.bar) RB.bar.hidden = true; }
const rbFieldOf = () => { const f = RB.field; if (f && f.isConnected) return f; if (f && f.id) { const g = document.getElementById(f.id); if (g) return RB.field = g; } return null; };
function rbInput(f){ f.dispatchEvent(new Event("input", {bubbles: true})); }
// Wrap the selection in marks (or take them off again); with nothing selected the marks go around a placeholder
function rbWrap(f, a, z, ph){
  const s = f.selectionStart, e = f.selectionEnd, v = f.value, sel = v.slice(s, e);
  if (sel && v.slice(s - a.length, s) === a && v.slice(e, e + z.length) === z) { f.setRangeText(sel, s - a.length, e + z.length, "select"); rbInput(f); return; }
  if (sel.length > a.length + z.length && sel.startsWith(a) && sel.endsWith(z)) { f.setRangeText(sel.slice(a.length, sel.length - z.length), s, e, "select"); rbInput(f); return; }
  // Marks hug the words: spaces at the ends of the selection stay outside
  const lead = (sel.match(/^\s*/) || [""])[0], trail = sel.trim() ? (sel.match(/\s*$/) || [""])[0] : "", core = sel.trim() || ph;
  f.setRangeText(lead + a + core + z + trail, s, e, "end");
  const at = s + lead.length + a.length; f.setSelectionRange(at, at + core.length);
  rbInput(f);
}
function rbDo(k){
  const f = rbFieldOf(); if (!f) return;
  f.focus({preventScroll: true});
  if (k === "b") rbWrap(f, "**", "**", "bold");
  else if (k === "i") rbWrap(f, "*", "*", "italic");
  else if (k === "s") rbWrap(f, "~~", "~~", "struck");
  else if (k === "hl") rbWrap(f, "==", "==", "highlighted");
  else if (k === "sup" || k === "sub") {
    const s = f.selectionStart, e = f.selectionEnd, sel = f.value.slice(s, e).trim(), t = sel ? (/\s/.test(sel) || /[A-Za-z]{3}/.test(sel) ? `\\text{${sel}}` : sel) : "2";
    const ins = `$${k === "sup" ? "^" : "_"}{${t}}$`;
    f.setRangeText(ins, s, e, "end"); if (!sel) f.setSelectionRange(s + 3, s + 4); rbInput(f);
  } else if (k === "eq") eqOpen(f);
}
document.addEventListener("focusin", e => {
  const t = e.target;
  if (t && t.matches && t.matches(RT_EDIT) && !t.readOnly && !t.disabled) { rbShow(t); return; }
  if (t && t.closest && t.closest(".rb-eq,.rb-bar")) return;
  if (!RB.eq) rbHide();
});
document.addEventListener("focusout", e => {
  if (!RB.field || e.target !== RB.field) return;
  clearTimeout(RB.hideT);
  RB.hideT = setTimeout(() => { const a = document.activeElement; if (RB.eq || (a && a.closest && a.closest(".rb-bar,.rb-eq")) || a === RB.field) return; rbHide(); }, 120);
});
const rbMove = () => { if (RB.bar && !RB.bar.hidden && RB.field) { if (!RB.field.isConnected) { rbHide(); return; } rbPlace(RB.bar, RB.field); } if (RB.eq && RB.field && RB.field.isConnected) rbPlace(RB.eq, RB.field, true); };
window.addEventListener("resize", rbMove);
document.addEventListener("scroll", rbMove, true);
document.addEventListener("animationend", rbMove, true);
document.addEventListener("transitionend", rbMove, true);
if (window.visualViewport) window.visualViewport.addEventListener("resize", rbMove);
document.addEventListener("input", e => { if (RB.field && e.target === RB.field) requestAnimationFrame(rbMove); });
document.addEventListener("keydown", e => {
  const t = e.target; if (!t || !t.matches || !t.matches(RT_EDIT)) return;
  const mod = e.ctrlKey || e.metaKey;
  if (mod && !e.shiftKey && !e.altKey && (e.key === "b" || e.key === "B" || e.key === "i" || e.key === "I")) { e.preventDefault(); e.stopPropagation(); RB.field = t; rbDo(e.key.toLowerCase()); }
  else if (eqKey(e)) { e.preventDefault(); e.stopPropagation(); RB.field = t; rbDo("eq"); }
}, true);

/* The equation editor */
const SQ = "\\square";
const EQ_SETS = [
  ["Basics", [["\\frac{#}{}", "Fraction"], ["#^{}", "Power"], ["#_{}", "Subscript"], ["\\sqrt{#}", "Square root"], ["\\sqrt[n]{#}", "Root"], ["\\pm", "Plus or minus"], ["\\times", "Times"], ["\\div", "Divided by"], ["\\cdot", "Dot"],
    ["\\le", "At most"], ["\\ge", "At least"], ["\\ne", "Not equal"], ["\\approx", "About"], ["\\infty", "Infinity"], ["\\left(#\\right)", "Brackets that grow"], ["\\lvert #\\rvert", "Absolute value"], ["#^\\circ", "Degrees"], ["\\%", "Percent"], ["\\overline{#}", "Bar"], ["\\text{#}", "Words"]]],
  ["Calculus", [["\\int #\\,dx", "Integral"], ["\\int_{a}^{b} #\\,dx", "Definite integral"], ["\\sum_{i=1}^{n} #", "Sum"], ["\\prod_{i=1}^{n} #", "Product"], ["\\lim_{x \\to \\infty} #", "Limit"], ["\\frac{d}{dx}#", "Derivative"],
    ["\\frac{\\partial #}{\\partial x}", "Partial derivative"], ["f'(x)", "f prime"], ["\\nabla", "Nabla"], ["\\vec{#}", "Vector"], ["\\hat{#}", "Hat"], ["\\dot{#}", "Dot"], ["\\Delta", "Delta"], ["\\log_{#}", "Log"], ["\\ln", "ln"], ["\\sin", "sin"], ["\\cos", "cos"], ["\\tan", "tan"], ["e^{#}", "e to the"], ["\\oint", "Loop integral"]]],
  ["Greek", "alpha beta gamma delta epsilon zeta eta theta iota kappa lambda mu nu xi pi rho sigma tau phi chi psi omega Gamma Delta Theta Lambda Pi Sigma Phi Psi Omega".split(" ").map(g => ["\\" + g, g])],
  ["Symbols", [["\\to", "Arrow"], ["\\Rightarrow", "Implies"], ["\\Leftrightarrow", "If and only if"], ["\\leftrightarrow", "Both ways"], ["\\propto", "Proportional"], ["\\in", "In"], ["\\notin", "Not in"], ["\\subseteq", "Subset"], ["\\cup", "Union"], ["\\cap", "Intersection"],
    ["\\emptyset", "Empty set"], ["\\forall", "For all"], ["\\exists", "There is"], ["\\neg", "Not"], ["\\land", "And"], ["\\lor", "Or"], ["\\therefore", "Therefore"], ["\\angle", "Angle"], ["\\perp", "Perpendicular"], ["\\parallel", "Parallel"], ["\\triangle", "Triangle"], ["\\mathbb{R}", "Real numbers"], ["\\equiv", "Equivalent"], ["\\sim", "Similar"]]],
  ["Chemistry", [["\\ce{H2O}", "Formula"], ["\\ce{# -> }", "Reaction"], ["\\ce{# <=> }", "Equilibrium"], ["\\ce{->[\\Delta]}", "Heat"], ["\\ce{Fe^{3+}}", "Ion"], ["\\ce{SO4^{2-}}", "Polyatomic ion"], ["\\ce{NaCl(aq)}", "State"], ["\\ce{^{14}_{6}C}", "Isotope"],
    ["\\ce{C=C}", "Double bond"], ["\\ce{->[cat]}", "Over the arrow"], ["\\ce{# ^}", "Gas"], ["\\ce{# v}", "Precipitate"], ["\\ce{CH3-OH}", "Bonds"], ["\\Delta H", "Enthalpy"], ["\\mathrm{pH}", "pH"], ["K_{eq}", "K eq"], ["[\\ce{H+}]", "Concentration"]]],
  ["Matrices", [["\\begin{pmatrix} # & \\\\ & \\end{pmatrix}", "Matrix"], ["\\begin{bmatrix} # & \\\\ & \\end{bmatrix}", "Square brackets"], ["\\begin{vmatrix} # & \\\\ & \\end{vmatrix}", "Determinant"], ["\\begin{pmatrix} # \\\\ \\\\ \\end{pmatrix}", "Column vector"],
    ["\\begin{cases} # & \\text{if } \\\\ & \\text{otherwise} \\end{cases}", "Cases"], ["\\begin{aligned} # &= \\\\ &= \\end{aligned}", "Steps lined up"], ["\\binom{n}{k}", "Choose"], ["A^{-1}", "Inverse"], ["A^{T}", "Transpose"]]]];
let eqTab = 0;
function eqPal(){
  const set = EQ_SETS[eqTab][1];
  return set.map(([t, name], i) => `<button type="button" class="rb-pk" data-eqk="${i}" title="${esc(name)}" aria-label="${esc(name)}">${katexOk ? eqLabel(t) : esc(t.replace(/#/g, "").slice(0, 14))}</button>`).join("");
}
function eqLabel(t){
  // inside \text{} a box can't be drawn (it would show as red code), so words get a word
  const chem = /\\ce\{/.test(t), x = t.replace(/\\text\{#\}/g, "\\text{abc}").replace(/#/g, chem ? "A" : SQ).replace(/\{\}/g, chem ? "{B}" : `{${SQ}}`);
  try { return window.katex.renderToString(x, {throwOnError: false, strict: "ignore", output: "html"}); } catch (e) { return esc(t); }
}
// opts.done(tex): the formula goes to that function instead of into a text field (f is then only where the editor opens)
function eqOpen(f, opts){
  opts = opts || {};
  const cb = typeof opts.done === "function" ? opts.done : null;
  const v = cb ? "" : f.value, s = cb ? 0 : f.selectionStart, e = cb ? 0 : f.selectionEnd;
  // The caret in a formula already written edits that formula
  const tok = cb ? null : mathSplit(v).find(p => p.m && s >= p.a && e <= p.b && !(s === p.b && e === p.b));
  RB.field = f; RB.sel = [s, e]; RB.tok = tok || null; RB.cb = cb;
  const one = cb || f.tagName === "INPUT";
  const sel = cb ? String(opts.init || "") : tok ? tok.s : v.slice(s, e);
  if (RB.eq) RB.eq.remove();
  const el = document.createElement("div");
  el.className = "rb-eq"; el.setAttribute("role", "dialog"); el.setAttribute("aria-label", "Equation");
  el.innerHTML = `<div class="rb-eq-tabs" role="tablist">${EQ_SETS.map((x, i) => `<button type="button" role="tab" data-eqt="${i}" aria-selected="${i === eqTab}">${esc(x[0])}</button>`).join("")}</div>
    <div class="rb-eq-pal" role="group" aria-label="${esc(EQ_SETS[eqTab][0])}">${eqPal()}</div>
    <label class="rb-eq-l"><span class="mini">Type it in LaTeX, or tap the buttons above. <code>\\ce{...}</code> is for chemistry.</span><textarea class="rb-eq-in" rows="2" spellcheck="false" autocapitalize="off" autocomplete="off" placeholder="e.g. \\frac{a}{b} or \\ce{2H2 + O2 -> 2H2O}">${esc(sel)}</textarea></label>
    <div class="rb-eq-prev" aria-live="polite"></div>
    <div class="rb-eq-foot">${one ? "" : `<label class="mi-check"><input type="checkbox" class="rb-eq-d"${tok && tok.d ? " checked" : ""}> On its own line</label>`}<span class="spacer"></span><button type="button" class="btn small" data-eqa="cancel">Cancel</button><button type="button" class="btn small primary" data-eqa="ok">${cb ? esc(opts.label || "Done") : tok ? "Update" : "Insert"}</button></div>`;
  RB.eq = el; rbHide();
  rbPlace(el, f, true);
  const inp = el.querySelector(".rb-eq-in");
  const prev = () => { const p = el.querySelector(".rb-eq-prev"), t = inp.value.trim(); if (!p) return; if (!t) { p.innerHTML = `<span class="mini">The preview shows here.</span>`; return; } if (!katexOk) { p.textContent = "Loading the preview…"; return; }
    try { p.innerHTML = window.katex.renderToString(t, {displayMode: true, throwOnError: true, trust: false, strict: "ignore", maxSize: 40, maxExpand: 400}); p.classList.remove("bad"); }
    catch (er) { p.textContent = "Not quite right yet: " + String((er && er.message) || "").replace(/^KaTeX parse error:\s*/, "").slice(0, 140); p.classList.add("bad"); } };
  inp.addEventListener("input", prev);
  inp.addEventListener("keydown", ev => {
    if (ev.isComposing || ev.keyCode === 229) return;   // typing with an IME: Enter picks the characters
    if (ev.key === "Enter" && !ev.shiftKey) { ev.preventDefault(); eqDone(true); }
    else if (ev.key === "Escape") { ev.preventDefault(); ev.stopPropagation(); eqDone(false); }
  });
  el.addEventListener("click", ev => {
    const t = ev.target.closest("[data-eqt],[data-eqk],[data-eqa]"); if (!t) return;
    ev.preventDefault(); ev.stopPropagation();
    if (t.dataset.eqa) { eqDone(t.dataset.eqa === "ok"); return; }
    if (t.dataset.eqt) { eqTab = Number(t.dataset.eqt); el.querySelectorAll("[data-eqt]").forEach(x => x.setAttribute("aria-selected", String(x === t))); const pal = el.querySelector(".rb-eq-pal"); pal.innerHTML = eqPal(); pal.setAttribute("aria-label", EQ_SETS[eqTab][0]); return; }
    // A button's template goes in at the caret, around what's selected; the caret lands where # was
    const tpl = EQ_SETS[eqTab][1][Number(t.dataset.eqk)][0], a = inp.selectionStart, b = inp.selectionEnd, picked = inp.value.slice(a, b);
    const k = tpl.indexOf("#"), body = tpl.replace("#", picked);
    inp.setRangeText(body, a, b, "end");
    const at = k >= 0 ? a + k + picked.length : a + body.length;
    inp.focus(); inp.setSelectionRange(at, at); prev();
  });
  el.addEventListener("pointerdown", ev => ev.stopPropagation());
  loadKatex().then(() => { if (RB.eq !== el) return; el.querySelector(".rb-eq-pal").innerHTML = eqPal(); prev(); }).catch(() => { const p = el.querySelector(".rb-eq-prev"); if (p) p.textContent = "The preview couldn't load. What you type is kept and shows once it can."; });
  prev();
  setTimeout(() => { inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length); rbPlace(el, f, true); }, 0);
}
function eqDone(ok){
  const el = RB.eq; if (!el) return;
  const t = el.querySelector(".rb-eq-in").value.trim(), d = !!(el.querySelector(".rb-eq-d") || {}).checked;
  RB.eq = null; el.remove();
  if (RB.cb) { const cb = RB.cb; RB.cb = null; if (ok && t) cb(t); return; }
  const f = rbFieldOf(); if (!f) return;
  f.focus({preventScroll: true});
  if (ok && t) {
    const [s, e] = RB.tok ? [RB.tok.a, RB.tok.b] : RB.sel;
    const v = f.value, ins = d ? `$$${t}$$` : `$${t}$`;
    // A formula on its own line gets line breaks around it
    const pre = d && s > 0 && v[s - 1] !== "\n" ? "\n" : "", post = d && e < v.length && v[e] !== "\n" ? "\n" : "";
    f.setRangeText(pre + ins + post, s, e, "end");
    rbInput(f);
  } else if (RB.sel) f.setSelectionRange(RB.sel[0], RB.sel[1]);
  RB.tok = null;
  rbShow(f);
}
// The equation editor on its own, opened next to el; done(tex) gets the formula
const mathAsk = (el, init, done, label) => eqOpen(el, {init, done, label});
/* A formula as a picture (for the PDF editor, which can only write the PDF's own fonts): KaTeX's drawing inside an SVG, with
   its fonts embedded, painted onto a canvas. Some browsers refuse to paint an SVG like that; then this throws. */
let kxFontCss = null;
async function katexFontCss(){
  if (kxFontCss) return kxFontCss;
  const css = await (await fetch(KATEX_DIR + "katex.min.css")).text(), map = {};
  const urls = [...new Set([...css.matchAll(/url\((fonts\/[^)]+\.woff2)\)/g)].map(m => m[1]))];
  await Promise.all(urls.map(async u => { try { const r = await fetch(KATEX_DIR + u); if (r.ok) map[u] = "data:font/woff2;base64," + bytesToB64(new Uint8Array(await r.arrayBuffer())); } catch (e) {} }));
  kxFontCss = css.replace(/url\((fonts\/[^)]+\.woff2)\)/g, (m, u) => map[u] ? `url(${map[u]})` : m);
  return kxFontCss;
}
async function mathImage(tex, color){
  await loadKatex();
  const css = await katexFontCss(), PX = 32, K = 3;
  const host = document.createElement("div");
  host.style.cssText = `position:fixed;left:-10000px;top:0;display:inline-block;white-space:nowrap;padding:4px;font-size:${PX}px;line-height:1.25;color:${/^#[0-9a-f]{6}$/i.test(color || "") ? color : "#000000"};background:transparent`;
  host.innerHTML = window.katex.renderToString("\\displaystyle " + tex, {throwOnError: true, trust: false, strict: "ignore", output: "html", maxSize: 40, maxExpand: 400});
  document.body.appendChild(host);
  try { if (document.fonts && document.fonts.ready) await document.fonts.ready; } catch (e) {}
  const r = host.getBoundingClientRect(), w = Math.max(1, Math.ceil(r.width)), h = Math.max(1, Math.ceil(r.height));
  host.style.position = "static"; host.style.left = "";
  const xhtml = new XMLSerializer().serializeToString(host); host.remove();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><foreignObject x="0" y="0" width="${w}" height="${h}"><div xmlns="http://www.w3.org/1999/xhtml"><style>${css}</style>${xhtml}</div></foreignObject></svg>`;
  const img = new Image(); img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  await img.decode();
  const cv = document.createElement("canvas"); cv.width = w * K; cv.height = h * K;
  const ctx = cv.getContext("2d"); ctx.scale(K, K); ctx.drawImage(img, 0, 0, w, h);
  ctx.getImageData(0, 0, 1, 1);
  return {canvas: cv, w, h, px: PX};
}
if (typeof dlg !== "undefined" && dlg) dlg.addEventListener("cancel", e => { if (RB.eq) { e.preventDefault(); eqDone(false); } });
document.addEventListener("pointerdown", e => { if (RB.eq && !e.target.closest(".rb-eq,.rb-bar") && e.target !== RB.field) eqDone(false); }, true);
window.__sbMath = {mathSplit, richFrag, mathSpeech, mathPlain, mathImage, mathAsk, loadKatex, hasMath, ready: () => katexOk, state: () => state, ui, render, applyChanges, clone, quiz: (d, q) => startAiQuiz(d, q)};
