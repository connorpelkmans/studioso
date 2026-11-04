/* ===== module: 99-calculator.js: a scientific calculator in a floating window ===== */
/* Opened from the calculator button (the sidebar, the top bar, the ⋯ menu, Search). It works like a handheld scientific
   calculator: you type a whole expression (with a cursor you can move, DEL and AC), = shows the result under it, and the
   next key carries on from Ans the way a real one does. SHIFT gives each key its second function (printed above it), HYP the
   hyperbolic ones, DRG switches degrees, radians and gradians, S⇔D shows a result as a fraction, M+ M− MR MC are the memory,
   and ↑ ↓ (or the arrows on a keyboard) bring back earlier calculations.
   The arithmetic is done by math.js (Apache 2.0, vendor/mathjs-15.1.1), loaded the first time the calculator opens; this file
   only turns the keys into a math.js expression and shows the answer the way a calculator would (10 significant digits,
   ×10ⁿ for very large and small numbers, Math ERROR and Syntax ERROR). Ans, memory and the last 30 calculations stay on this
   device (localStorage). The window opens in the middle of the screen. */
(() => {
  const MATHJS = "vendor/mathjs-15.1.1/math.js", MATHJS_SRI = "sha384-t7oR8uLVricQrZFFrsUy4VYOTXTDUfbsOgeMFFidEt/LU0woW6jhK4HtagwmEPrM";
  const LS = "studyboard:calc";
  const lsGet = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k) || "null"); return v == null ? d : v; } catch (e) { return d; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };

  /*CALC-START*/
  /* math.js, set up once: degrees, radians or gradians for the trig functions, and exact zeros where a real calculator shows them */
  let M = null, loading = null;
  const C = {angle: "deg"};
  function loadMath(){
    if (M) return Promise.resolve(M);
    if (!loading) loading = (async () => {
      if (!window.math) await loadScript(MATHJS, MATHJS_SRI);
      const m = window.math; if (!m || !m.create) throw new Error("no math.js");
      const math = m.create(m.all, {number: "number", precision: 64});
      const toRad = x => C.angle === "deg" ? x * Math.PI / 180 : C.angle === "gra" ? x * Math.PI / 200 : x;
      const fromRad = x => C.angle === "deg" ? x * 180 / Math.PI : C.angle === "gra" ? x * 200 / Math.PI : x;
      const turn = C2 => C.angle === "deg" ? 180 : C.angle === "gra" ? 200 : null;
      const clean = v => Math.abs(v) < 1e-15 ? 0 : Math.round(v * 1e15) / 1e15;
      const num = (x, f) => { if (typeof x !== "number") throw new Error("Math"); return f(x); };
      const inv = f => x => num(x, v => { if (v < -1 || v > 1) throw new Error("Math"); return fromRad(f(v)); });
      const fact0 = math.factorial, nr = (n, r) => { if (![n, r].every(v => typeof v === "number" && Number.isInteger(v) && v >= 0) || r > n) throw new Error("Math"); return n; };
      math.import({
        factorial: x => num(x, v => { if (v < 0 || !Number.isInteger(v)) throw new Error("Math"); return fact0(v); }),   // 0.5! is Math ERROR, as on a calculator
        sin: x => num(x, v => { const h = turn(); if (h && v % h === 0) return 0; return clean(Math.sin(toRad(v))); }),
        cos: x => num(x, v => { const h = turn(); if (h && (v - h / 2) % h === 0) return 0; return clean(Math.cos(toRad(v))); }),
        tan: x => num(x, v => { const h = turn(); if (h && v % h === 0) return 0; if (h && (v - h / 2) % h === 0) throw new Error("Math"); const c = Math.cos(toRad(v)); if (Math.abs(c) < 1e-15) throw new Error("Math"); return clean(Math.tan(toRad(v))); }),
        asin: inv(Math.asin), acos: inv(Math.acos),
        atan: x => num(x, v => fromRad(Math.atan(v))),
        _C: (n, r) => math.combinations(nr(n, r), r), _P: (n, r) => math.permutations(nr(n, r), r), _root: (n, x) => math.nthRoot(x, n)
      }, {override: true});
      M = math; return M;
    })().catch(e => { loading = null; throw e; });
    return loading;
  }

  /* Keys. Each key types a token {d: what the screen shows, m: what math.js reads}; f: the operand-taking infix keys */
  const T = (d, m) => ({d, m: m == null ? d : m});
  const FN = name => T(name + "(", ({sin: "sin(", cos: "cos(", tan: "tan(", "sin⁻¹": "asin(", "cos⁻¹": "acos(", "tan⁻¹": "atan(", sinh: "sinh(", cosh: "cosh(", tanh: "tanh(", "sinh⁻¹": "asinh(", "cosh⁻¹": "acosh(", "tanh⁻¹": "atanh(",
    log: "log10(", ln: "log(", "√": "sqrt(", "∛": "cbrt(", Abs: "abs("})[name]);
  // [label, action, shift label, shift action, class]
  const FKEYS = [
    ["SHIFT", "shift", "", "", "k-shift"], ["HYP", "hyp", "", "", "k-mode"], ["DRG", "drg", "", "", "k-mode"], ["◀", "left", "", "", "k-nav"], ["▶", "right", "", "", "k-nav"], ["S⇔D", "sd", "", "", "k-mode"],
    ["x⁻¹", "inv", "x!", "fact"], ["nCr", "ncr", "nPr", "npr"], ["√", "sqrt", "∛", "cbrt"], ["x²", "sq", "x³", "cube"], ["xʸ", "pow", "ʸ√x", "root"], ["log", "log", "10ˣ", "tenx"],
    ["ln", "ln", "eˣ", "ex"], ["sin", "sin", "sin⁻¹", "asin"], ["cos", "cos", "cos⁻¹", "acos"], ["tan", "tan", "tan⁻¹", "atan"], ["(", "lp", "", ""], [")", "rp", "", ""],
    ["(−)", "neg", "", ""], ["Abs", "abs", "", ""], ["π", "pi", "e", "e"], ["%", "pct", "", ""], ["M+", "mplus", "M−", "mminus"], ["MR", "mr", "MC", "mc"]];
  const NKEYS = [
    ["7", "7"], ["8", "8"], ["9", "9"], ["DEL", "del", "", "", "k-del"], ["AC", "ac", "", "", "k-ac"],
    ["4", "4"], ["5", "5"], ["6", "6"], ["×", "mul", "", "", "k-op"], ["÷", "div", "", "", "k-op"],
    ["1", "1"], ["2", "2"], ["3", "3"], ["+", "add", "", "", "k-op"], ["−", "sub", "", "", "k-op"],
    ["0", "0"], [".", "dot"], ["×10ˣ", "exp", "", "", "k-op"], ["Ans", "ans", "", "", "k-op"], ["=", "eq", "", "", "k-eq"]];
  // keys that carry on from the last answer when pressed right after =
  const CARRY = new Set(["add", "sub", "mul", "div", "pow", "sq", "cube", "inv", "fact", "pct", "ncr", "npr", "root"]);
  const TOK = {
    "0": T("0"), "1": T("1"), "2": T("2"), "3": T("3"), "4": T("4"), "5": T("5"), "6": T("6"), "7": T("7"), "8": T("8"), "9": T("9"), dot: T("."),
    add: T("+"), sub: T("−", "-"), mul: T("×", "*"), div: T("÷", "/"), neg: T("−", "-"), pow: T("^", "^"), sq: T("²", "^2"), cube: T("³", "^3"), inv: T("⁻¹", "^(-1)"), fact: T("!"),
    lp: T("("), rp: T(")"), pi: T("π", "pi"), e: T("e", "(e)"), pct: T("%"), ans: T("Ans", "(Ans)"), mr: T("M", "(M)"), exp: T("ᴇ", "ᴇ"),
    ncr: T("C", "⒞"), npr: T("P", "⒫"), root: T("ˣ√", "⒭"),
    sqrt: FN("√"), cbrt: FN("∛"), log: FN("log"), ln: FN("ln"), abs: FN("Abs"), tenx: T("10^(", "10^("), ex: T("e^(", "e^(")
  };
  const TRIG = {sin: 1, cos: 1, tan: 1, asin: 1, acos: 1, atan: 1};
  function tokenFor(a){
    if (TRIG[a]) { const inverse = a[0] === "a", base = inverse ? a.slice(1) : a, nm = base + (S.hyp ? "h" : "") + (inverse ? "⁻¹" : ""); return FN(nm); }
    return TOK[a] || null;
  }

  /* Turning tokens into a math.js expression: nCr, nPr and ˣ√ take the operands either side of them. As on a handheld, an
     operand is a number, constant, bracket or function call together with what binds tighter than nCr: x², x³, x⁻¹, x! and powers */
  function atomEnd(s, i){
    const num = /^(?:\d+\.?\d*|\.\d+)(?:e-?\d+)?/.exec(s.slice(i)); if (num) return i + num[0].length;
    const nm = /^[A-Za-z_]\w*/.exec(s.slice(i)); if (nm) i += nm[0].length;
    if (s[i] !== "(") return nm ? i : -1;
    for (let d = 0; i < s.length; i++) { if (s[i] === "(") d++; else if (s[i] === ")" && --d === 0) return i + 1; }
    return s.length;   // a bracket left open runs to the end (it's closed at =)
  }
  function opndEnd(s, i){
    let j = atomEnd(s, i); if (j < 0) return -1;
    for (;;) {
      if (s[j] === "!") { j++; continue; }
      if (s[j] === "^") { const k = atomEnd(s, j + (s[j + 1] === "-" ? 2 : 1)); if (k < 0) return -1; j = k; continue; }
      return j;
    }
  }
  function toMath(tokens){
    let s = tokens.map(t => t.m).join("");
    // ×10ˣ: 2ᴇ-3 is one number, 2×10⁻³
    s = s.replace(/(\d*\.?\d+)ᴇ(-?\d+)/g, "($1e$2)").replace(/ᴇ/g, "*10^");
    // π next to a number or bracket multiplies (π2, π(2), 2π3), as math.js would otherwise read pi(2) as a call
    s = s.replace(/pi(?=[\d.(A-Za-z_])/g, "pi*");
    for (let n = 0, k; n < 40 && (k = s.search(/[⒞⒫⒭]/)) >= 0; n++) {
      let a = -1; for (let p = 0; p < k && a < 0; p++) if ((p === 0 || !/[\w.]/.test(s[p - 1])) && opndEnd(s, p) === k) a = p;
      const b = opndEnd(s, k + 1); if (a < 0 || b < 0) throw new Error("Syntax");
      s = s.slice(0, a) + `${({"⒞": "_C", "⒫": "_P", "⒭": "_root"})[s[k]]}(${s.slice(a, k)},${s.slice(k + 1, b)})` + s.slice(b);
    }
    if (/[⒞⒫⒭]/.test(s)) throw new Error("Syntax");
    // close any brackets left open, like a real calculator does at =
    const open = (s.match(/\(/g) || []).length - (s.match(/\)/g) || []).length;
    if (open < 0) throw new Error("Syntax");
    return s + ")".repeat(open);
  }
  /*CALC-END*/

  /* Showing a number like a calculator: 10 significant digits, ×10ⁿ outside 10⁻⁹…10¹⁰ */
  const SUP = {"-": "⁻", "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹"};
  function show(v){
    if (typeof v !== "number" || !isFinite(v)) throw new Error("Math");
    if (Object.is(v, -0) || v === 0) return {txt: "0", plain: "0"};
    const r = Number(v.toPrecision(10)), a = Math.abs(r);
    if (a >= 1e10 || a < 1e-9) {
      const [mant, ex] = r.toExponential(9).split("e"), mt = mant.replace(/\.?0+$/, ""), e = String(Number(ex));
      return {txt: `${mt}×10${e.split("").map(c => SUP[c]).join("")}`, plain: `${mt}e${e}`, sci: {mt, e}};
    }
    const p = String(r);
    return {txt: p.replace("-", "−"), plain: p};
  }
  function asFraction(v){
    if (!M || typeof v !== "number" || !isFinite(v) || Number.isInteger(v)) return "";
    try { const f = M.fraction(v); if (Number(f.d) > 10000 || Math.abs(Number(f.n) / Number(f.d) * Number(f.s) - v) > 1e-10 * Math.max(1, Math.abs(v))) return "";
      const n = Number(f.n), d = Number(f.d), neg = Number(f.s) < 0;
      return `${neg ? "−" : ""}${n}⁄${d}`; } catch (e) { return ""; }
  }

  /* State */
  const saved = lsGet(LS, {});
  const S = {tokens: [], cur: 0, shift: false, hyp: false, done: false, result: null, err: "", frac: false,
    ans: Number(saved.ans) || 0, mem: Number(saved.mem) || 0, hist: Array.isArray(saved.hist) ? saved.hist.slice(0, 30) : [], hi: -1};
  C.angle = ["deg", "rad", "gra"].includes(saved.angle) ? saved.angle : "deg";
  const save = () => lsSet(LS, {ans: S.ans, mem: S.mem, hist: S.hist.slice(0, 30), angle: C.angle});

  function insert(t){
    if (S.done) { S.done = false; S.err = ""; S.result = null; S.frac = false; }
    S.tokens.splice(S.cur, 0, t); S.cur++;
  }
  async function evaluate(){
    if (!S.tokens.length) return;
    let expr; try { expr = toMath(S.tokens); } catch (e) { S.err = "Syntax ERROR"; S.done = true; return; }
    try { await loadMath(); } catch (e) { S.err = "Couldn't load the calculator"; S.done = true; return; }
    let v; try { v = M.evaluate(expr, {Ans: S.ans, M: S.mem}); } catch (e) { S.err = /Math|Cannot convert|complex|Infinity/i.test(String(e && e.message)) ? "Math ERROR" : "Syntax ERROR"; S.done = true; return; }
    if (v && typeof v === "object" && typeof v.toNumber === "function") { try { v = v.toNumber(); } catch (e) {} }
    try { show(v); } catch (e) { S.err = "Math ERROR"; S.done = true; return; }
    v = Number(v.toPrecision(15));
    S.result = v; S.ans = v; S.err = ""; S.done = true; S.frac = false;
    S.hist.unshift({t: S.tokens.slice(), v}); S.hist = S.hist.slice(0, 30); S.hi = -1;
    save();
  }
  async function press(a){
    const shifted = S.shift;
    S.shift = false;
    if (a === "shift") { S.shift = !shifted; return; }
    if (a === "hyp") { S.hyp = !S.hyp; return; }
    if (a === "drg") { C.angle = C.angle === "deg" ? "rad" : C.angle === "rad" ? "gra" : "deg"; save(); return; }
    if (a === "ac") { S.tokens = []; S.cur = 0; S.done = false; S.result = null; S.err = ""; S.frac = false; S.hyp = false; S.hi = -1; return; }
    if (a === "del") { if (S.done) { S.done = false; S.err = ""; S.result = null; S.cur = S.tokens.length; return; } if (S.cur > 0) { S.tokens.splice(S.cur - 1, 1); S.cur--; } return; }
    if (a === "left" || a === "right") {
      if (S.done) { S.done = false; S.err = ""; S.result = null; S.cur = a === "left" ? S.tokens.length : 0; return; }
      S.cur = Math.max(0, Math.min(S.tokens.length, S.cur + (a === "left" ? -1 : 1))); return;
    }
    if (a === "up" || a === "down") {
      if (!S.hist.length) return;
      S.hi = Math.max(0, Math.min(S.hist.length - 1, S.hi + (a === "up" ? 1 : -1)));
      const h = S.hist[S.hi]; S.tokens = h.t.slice(); S.cur = S.tokens.length; S.result = h.v; S.done = true; S.err = ""; S.frac = false; return;
    }
    if (a === "sd") { if (S.done && S.result != null && asFraction(S.result)) S.frac = !S.frac; return; }
    if (a === "eq") { await evaluate(); return; }
    if (a === "mplus" || a === "mminus" || a === "mc") {
      if (a === "mc" || (shifted && a === "mr")) { S.mem = 0; save(); return; }
      if (!S.done && S.tokens.length) await evaluate();
      if (S.done && !S.err && S.result != null) { S.mem = Number((S.mem + (a === "mplus" ? S.result : -S.result)).toPrecision(15)); save(); }
      return;
    }
    if (a === "mr" && shifted) { S.mem = 0; save(); return; }
    if (S.done && !S.err && CARRY.has(a)) { S.done = false; S.result = null; S.tokens = [TOK.ans]; S.cur = 1; }
    else if (S.done) { S.done = false; S.err = ""; S.result = null; S.tokens = []; S.cur = 0; }
    const t = tokenFor(a); if (t) insert(t);
  }

  /* The window */
  let W = null;
  const keyHtml = ([l, a, sl, sa, cls]) => `<div class="cx-k ${cls || (/^[0-9.]$/.test(l) ? "k-num" : "k-fn")}">${sl ? `<span class="cx-s" aria-hidden="true">${esc(sl)}</span>` : `<span class="cx-s" aria-hidden="true"></span>`}<button type="button" data-cx="${a}"${sa ? ` data-cxs="${sa}"` : ""} aria-label="${esc(KEYNAME[a] || l)}${sl ? `, shift: ${esc(KEYNAME[sa] || sl)}` : ""}">${esc(l)}</button></div>`;
  const KEYNAME = {shift: "Shift", hyp: "Hyperbolic", drg: "Degrees, radians or gradians", left: "Move left", right: "Move right", sd: "Fraction or decimal", inv: "Reciprocal", fact: "Factorial", ncr: "Combinations", npr: "Permutations", sqrt: "Square root", cbrt: "Cube root", sq: "Squared", cube: "Cubed", pow: "Power", root: "Root", log: "Log", tenx: "10 to the power", ln: "Natural log", ex: "e to the power", sin: "Sine", asin: "Inverse sine", cos: "Cosine", acos: "Inverse cosine", tan: "Tangent", atan: "Inverse tangent", lp: "Open bracket", rp: "Close bracket", neg: "Negative", abs: "Absolute value", pi: "Pi", e: "e", pct: "Percent", mplus: "Memory add", mminus: "Memory subtract", mr: "Memory recall", mc: "Memory clear", del: "Delete", ac: "All clear", mul: "Times", div: "Divide", add: "Plus", sub: "Minus", dot: "Point", exp: "Times ten to the power", ans: "Answer", eq: "Equals"};
  function frame(){
    return `<div class="cx-body">
      <div class="cx-top" data-cx-drag><span class="cx-brand">STUDYBOARD <b>fx</b></span><span class="cx-solar" aria-hidden="true"><i></i><i></i><i></i><i></i></span><button type="button" class="cx-x" data-cx="close" aria-label="Close calculator">${CLOSE}</button></div>
      <div class="cx-lcd" role="group" aria-label="Display">
        <div class="cx-ind" aria-hidden="true"><span data-i="shift">S</span><span data-i="hyp">HYP</span><span data-i="m">M</span><span class="cx-sp"></span><span data-i="ang"></span></div>
        <div class="cx-expr" aria-label="Expression"></div>
        <button type="button" class="cx-res" data-cx="copy" aria-live="polite" title="Copy the answer"></button>
      </div>
      <div class="cx-keys cx-f">${FKEYS.map(keyHtml).join("")}</div>
      <div class="cx-keys cx-n">${NKEYS.map(keyHtml).join("")}</div>
    </div>`;
  }
  function paint(){
    if (!W) return;
    W.classList.toggle("is-shift", S.shift); W.classList.toggle("is-hyp", S.hyp);
    const ind = k => W.querySelector(`[data-i="${k}"]`);
    ind("shift").classList.toggle("on", S.shift); ind("hyp").classList.toggle("on", S.hyp); ind("m").classList.toggle("on", S.mem !== 0);
    ind("ang").textContent = {deg: "DEG", rad: "RAD", gra: "GRA"}[C.angle];
    const ex = W.querySelector(".cx-expr"), caret = !S.done ? S.cur : -1;
    ex.innerHTML = S.tokens.map((t, i) => `${i === caret ? `<i class="cx-caret"></i>` : ""}<span>${esc(t.d)}</span>`).join("") + (caret === S.tokens.length ? `<i class="cx-caret"></i>` : "");
    const c = ex.querySelector(".cx-caret"); if (c) { const L = c.offsetLeft; if (L - ex.scrollLeft > ex.clientWidth - 12) ex.scrollLeft = L - ex.clientWidth + 24; else if (L < ex.scrollLeft + 8) ex.scrollLeft = Math.max(0, L - 24); } else ex.scrollLeft = 0;
    const res = W.querySelector(".cx-res");
    let txt = ""; if (S.err) txt = S.err; else if (S.done && S.result != null) { try { txt = S.frac && asFraction(S.result) ? asFraction(S.result) : show(S.result).txt; } catch (e) { txt = "Math ERROR"; } } else if (!S.tokens.length) txt = "0";
    res.textContent = txt; res.classList.toggle("is-err", !!S.err); res.classList.toggle("is-dim", !S.done && !!S.tokens.length);
    res.classList.toggle("is-long", txt.length > 13);
    // the second functions print over the keys while SHIFT is on
    W.querySelectorAll("[data-cxs]").forEach(b => b.classList.toggle("is-alt", S.shift));
    W.querySelectorAll('[data-cx="sin"],[data-cx="cos"],[data-cx="tan"]').forEach(b => { b.textContent = b.dataset.cx + (S.hyp ? "h" : ""); });
  }
  function place(){
    if (!W) return;
    if (innerWidth < 640) { W.style.left = W.style.top = ""; return; }
    // opens in the middle of the screen; it can be dragged anywhere while it's open
    const w = W.offsetWidth || 344, h = W.offsetHeight || 600;
    const x = Math.max(8, Math.round((innerWidth - w) / 2)), y = Math.max(8, Math.round((innerHeight - h) / 2));
    W.style.left = x + "px"; W.style.top = y + "px";
  }
  async function act(a, alt){
    if (a === "close") { close(); return; }
    if (a === "copy") { const r = W.querySelector(".cx-res").textContent; if (S.done && !S.err && S.result != null) { try { await navigator.clipboard.writeText(S.frac && asFraction(S.result) ? asFraction(S.result).replace("⁄", "/").replace("−", "-") : show(S.result).plain); toast(`Copied ${r}`); } catch (e) {} } return; }
    await press(S.shift && alt ? alt : a);
    paint();
  }
  function open(){
    if (W) { W.hidden = false; skin(); place(); W.querySelector('[data-cx="eq"]').focus({preventScroll: true}); return; }
    W = document.createElement("div"); W.className = "cx"; W.id = "calc"; W.setAttribute("role", "dialog"); W.setAttribute("aria-label", "Calculator");
    W.innerHTML = frame(); document.body.appendChild(W); skin();
    // the calculator wears the theme that's on, and changes with it (99-calculator-skins.js)
    new MutationObserver(() => { if (W && !W.hidden) skin(); }).observe(document.documentElement, {attributes: true, attributeFilter: ["data-skin"]});
    W.addEventListener("click", e => { const b = e.target.closest("[data-cx]"); if (!b) return; e.preventDefault(); act(b.dataset.cx, b.dataset.cxs); });
    W.addEventListener("keydown", onKey);
    // dragging by the top strip (computers)
    const top = W.querySelector("[data-cx-drag]");
    top.addEventListener("pointerdown", e => {
      if (innerWidth < 640 || e.target.closest("button")) return;
      const r = W.getBoundingClientRect(), dx = e.clientX - r.left, dy = e.clientY - r.top; top.setPointerCapture(e.pointerId);
      const mv = ev => { W.style.left = Math.max(0, Math.min(innerWidth - r.width, ev.clientX - dx)) + "px"; W.style.top = Math.max(0, Math.min(innerHeight - 60, ev.clientY - dy)) + "px"; };
      const up = () => { top.removeEventListener("pointermove", mv); top.removeEventListener("pointerup", up); };
      top.addEventListener("pointermove", mv); top.addEventListener("pointerup", up);
    });
    let rz = 0; addEventListener("resize", () => { clearTimeout(rz); rz = setTimeout(() => { if (W && !W.hidden && innerWidth < 640) place(); else if (W && !W.hidden) { const r = W.getBoundingClientRect(); if (r.right > innerWidth || r.bottom > innerHeight) place(); } }, 100); });
    place(); paint();
    loadMath().catch(() => {});
    W.querySelector('[data-cx="eq"]').focus({preventScroll: true});
  }
  function skin(){ try { if (window.SBCALCSKIN) SBCALCSKIN.apply(W); } catch (e) { console.warn("calculator theme", e); } }
  function close(){ if (!W) return; W.hidden = true; const b = document.querySelector('[data-act="calc-open"]'); if (b && b.offsetParent) b.focus({preventScroll: true}); }
  const KEYMAP = {"+": "add", "-": "sub", "*": "mul", "x": "mul", "/": "div", "^": "pow", "(": "lp", ")": "rp", ".": "dot", ",": "dot", "%": "pct", "!": "fact", "Enter": "eq", "=": "eq", "Backspace": "del", "Delete": "ac",
    "ArrowLeft": "left", "ArrowRight": "right", "ArrowUp": "up", "ArrowDown": "down", "p": "pi", "s": "sin", "c": "cos", "t": "tan", "l": "ln", "g": "log", "r": "sqrt", "e": "e", "a": "ans", "E": "exp"};
  function onKey(e){
    if (e.ctrlKey || e.metaKey || e.altKey) { if ((e.ctrlKey || e.metaKey) && e.key === "c" && S.done) { e.preventDefault(); act("copy"); } return; }
    if (e.key === "Escape") { e.preventDefault(); if (S.tokens.length || S.done) act("ac"); else close(); return; }
    if (e.key === "Tab" || e.key === " ") return;
    // Enter on a focused key presses that key; Enter elsewhere is =
    if (e.key === "Enter" && e.target.closest && e.target.closest("[data-cx]") && e.target.dataset.cx !== "eq") return;
    const a = /^[0-9]$/.test(e.key) ? e.key : KEYMAP[e.key]; if (!a) return;
    e.preventDefault();
    const b = W.querySelector(`[data-cx="${a}"]`); if (b) { b.classList.add("is-down"); setTimeout(() => b.classList.remove("is-down"), 110); }
    act(a);
  }

  hook("act", act0 => { if (act0 !== "calc-open") return false; if (W && !W.hidden) close(); else open(); return true; });
  hook("menu", () => `<button data-act="calc-open"><span>Calculator<span class="sub">A scientific calculator in its own window</span></span></button>`);
  window.SBCALC = {open, close, press: async a => { await press(a); paint(); }, state: () => ({tokens: S.tokens.map(t => t.d).join(""), result: S.result, err: S.err, mem: S.mem, angle: C.angle, frac: S.frac}), toMath, show};
})();
