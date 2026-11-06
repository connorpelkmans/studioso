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
  /* ∫, d/dx and Σ take an expression and its variable unread (math.js "rawArgs"): f(x, x, a, b) */
  function rawFn(n, run){
    const f = (args, math, scope) => {
      if (args.length !== n || !args[1] || args[1].type !== "SymbolNode") throw new Error("Syntax");
      const body = args[0].compile(), v = args[1].name, sc = new Map();
      if (scope && typeof scope.keys === "function" && typeof scope.get === "function") { for (const k of scope.keys()) sc.set(k, scope.get(k)); }
      else if (scope) Object.keys(scope).forEach(k => sc.set(k, scope[k]));
      const at = x => { sc.set(v, x); const y = body.evaluate(sc); if (typeof y !== "number" || !isFinite(y)) throw new Error("Math"); return y; };
      const val = k => { const y = args[k].compile().evaluate(scope); if (typeof y !== "number" || Number.isNaN(y)) throw new Error("Math"); return y; };
      return run(at, val);
    };
    f.rawArgs = true; return f;
  }
  // Adaptive Simpson over 16 pieces; an end the function can't be evaluated at (1/√x at 0) is approached from inside
  // Tanh-sinh: crowds points toward the ends, so 1/√x from 0 to 1 comes out at 2
  function integralEnds(f, a, b){
    const c = (a + b) / 2, r = (b - a) / 2; let prev = null, calls = 0;
    for (let L = 0; L <= 10; L++) {
      const h = 1 / (1 << L); let sum = 0;
      for (let k = -Math.ceil(4.5 / h); k <= Math.ceil(4.5 / h); k++) {
        const t = k * h, u = Math.PI / 2 * Math.sinh(t), ch = Math.cosh(u), w = Math.PI / 2 * Math.cosh(t) / (ch * ch);
        const gap = r * Math.exp(-Math.abs(u)) / ch, x = t === 0 ? c : t > 0 ? b - gap : a + gap;
        if (x <= a || x >= b || !(w > 0)) continue;
        if (++calls > 400000) throw new Error("Math");
        let y; try { y = f(x); } catch (e) { if (w < 1e-15) continue; throw e; }
        sum += w * y;
      }
      const I = r * h * sum;
      if (prev != null && Math.abs(I - prev) <= 1e-11 * Math.max(1, Math.abs(I))) return Number(I.toPrecision(12));
      prev = I;
    }
    return Number(prev.toPrecision(9));
  }
  function integral(f, a, b){
    const bad = x => { try { return !isFinite(f(x)); } catch (e) { return true; } };
    if (bad(a) || bad(b)) return integralEnds(f, a, b);
    let calls = 0;
    const g = x => { if (++calls > 400000) throw new Error("Math"); try { return f(x); } catch (e) { if (x !== a && x !== b) throw e; const h = (b - a) * 1e-10; return f(x === a ? a + h : b - h); } };
    const simp = (a, b, fa, fm, fb) => (b - a) / 6 * (fa + 4 * fm + fb);
    const rec = (a, b, fa, fm, fb, whole, eps, depth) => {
      const m = (a + b) / 2, lm = (a + m) / 2, rm = (m + b) / 2, flm = g(lm), frm = g(rm);
      const left = simp(a, m, fa, flm, fm), right = simp(m, b, fm, frm, fb), d = left + right - whole;
      if (depth <= 0 || Math.abs(d) <= 15 * eps) return left + right + d / 15;
      return rec(a, m, fa, flm, fm, left, eps / 2, depth - 1) + rec(m, b, fm, frm, fb, right, eps / 2, depth - 1);
    };
    let t = 0; const N = 16, w = (b - a) / N;
    for (let i = 0; i < N; i++) { const x0 = a + i * w, x1 = i === N - 1 ? b : x0 + w, f0 = g(x0), f1 = g(x1), fm = g((x0 + x1) / 2); t += rec(x0, x1, f0, fm, f1, simp(x0, x1, f0, fm, f1), 1e-12, 40); }
    return Math.abs(t) < 1e-13 ? 0 : t;
  }
  // Five-point difference, refined once (Richardson)
  function derivative(f, a){
    const d = h => (-f(a + 2 * h) + 8 * f(a + h) - 8 * f(a - h) + f(a - 2 * h)) / (12 * h), h = 1e-3 * Math.max(1, Math.abs(a));
    const v = (16 * d(h / 2) - d(h)) / 15; return Math.abs(v) < 1e-10 ? 0 : Number(v.toPrecision(10));
  }
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
        _C: (n, r) => math.combinations(nr(n, r), r), _P: (n, r) => math.permutations(nr(n, r), r), _root: (n, x) => math.nthRoot(x, n),
        _int: rawFn(4, (at, val) => { let a = val(2), b = val(3); if (!isFinite(a) || !isFinite(b)) throw new Error("Math"); if (a === b) return 0; const sg = a < b ? 1 : -1; if (sg < 0) [a, b] = [b, a]; return sg * integral(at, a, b); }),
        _der: rawFn(3, (at, val) => derivative(at, val(2))),
        _sum: rawFn(4, (at, val) => { const a = val(2), b = val(3); if (!Number.isInteger(a) || !Number.isInteger(b) || b - a > 1e6) throw new Error("Math"); let t = 0; for (let k = a; k <= b; k++) t += at(k); return t; })
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
    // an unknown next to a letter, number or bracket multiplies (xy, x2, x(1+x)), which math.js would read as a name or a call
    let s = tokens.map((t, k) => (k && tokens[k - 1].v && /^[\w(.]/.test(t.m) ? "*" : "") + t.m).join("");
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

  /* Text to keys: what "select an equation on screen" types. The text is math.js-like: numbers, + - * / ^ ( ) ! %, the
     functions below, pi and e, single letters for unknowns, = for an equation and ; between the equations of a system.
     log(x) is base 10, log(x, b) base b, ln(x) natural; root(n, x); integrate(f, x, a, b), deriv(f, x, a), sum(f, n, a, b) */
  const VAR = l => ({d: l, m: l, v: true});
  const FNS = {sin: "sin", cos: "cos", tan: "tan", asin: "sin⁻¹", acos: "cos⁻¹", atan: "tan⁻¹", arcsin: "sin⁻¹", arccos: "cos⁻¹", arctan: "tan⁻¹",
    sinh: "sinh", cosh: "cosh", tanh: "tanh", asinh: "sinh⁻¹", acosh: "cosh⁻¹", atanh: "tanh⁻¹", sqrt: "√", cbrt: "∛", ln: "ln", abs: "Abs", log10: "log"};
  const FNT = {exp: T("e^(", "e^("), root: T("ʸ√(", "_root("), nCr: T("nCr(", "_C("), nPr: T("nPr(", "_P("), integrate: T("∫(", "_int("), deriv: T("d/d(", "_der("), sum: T("Σ(", "_sum(")};
  function fromText(src){
    const s = String(src == null ? "" : src).replace(/\s+/g, " ").trim(), out = [];
    const args = j => { let d = 0, n = 1; for (let k = j; k < s.length; k++) { const c = s[k]; if (c === "(") d++; else if (c === ")") { if (--d === 0) return n; } else if (c === "," && d === 1) n++; } return n; };
    const SYM = {"+": TOK.add, "-": TOK.sub, "*": TOK.mul, "/": TOK.div, "^": TOK.pow, "(": TOK.lp, ")": TOK.rp, "!": TOK.fact, "%": TOK.pct, ",": T(","), "=": T("="), ";": T(";")};
    for (let i = 0; i < s.length;) {
      const c = s[i]; if (c === " ") { i++; continue; }
      // squares and cubes show as ² and ³
      const pw = /^\^\s*(?:([23])|\(\s*([23])\s*\))(?![\d.])/.exec(s.slice(i));
      if (pw) { out.push((pw[1] || pw[2]) === "2" ? TOK.sq : TOK.cube); i += pw[0].length; continue; }
      const num = /^(?:\d+\.?\d*|\.\d+)/.exec(s.slice(i));
      if (num) { for (const ch of num[0]) out.push(ch === "." ? TOK.dot : TOK[ch]); i += num[0].length; continue; }
      const id = /^[A-Za-z]+/.exec(s.slice(i));
      if (id) {
        const w = id[0]; let j = i + w.length; while (s[j] === " ") j++;
        if (s[j] === "(" && (FNS[w] || FNT[w] || w === "log")) { out.push(w === "log" ? (args(j) > 1 ? T("log(", "log(") : FN("log")) : FNT[w] || FN(FNS[w])); i = j + 1; continue; }
        if (w === "pi") out.push(TOK.pi); else if (w === "e") out.push(TOK.e); else if (w === "Ans") out.push(TOK.ans);
        else for (const l of w) out.push(VAR(l));   // xy is x times y
        i += w.length; continue;
      }
      if (!SYM[c]) throw new Error("Syntax");
      out.push(SYM[c]); i++;
    }
    return out;
  }

  /* Working out what's typed: a number, or an equation solved for its unknown, or a system solved for its unknowns */
  const KNOWN = new Set(["pi", "e", "Ans", "M", "i", "Infinity"]);
  function freeVars(n, bound, out){
    if (n.type === "SymbolNode") { if (!KNOWN.has(n.name) && !bound.has(n.name)) out.add(n.name); return; }
    if (n.type === "FunctionNode" && /^_(int|der|sum)$/.test(n.fn && n.fn.name)) {
      const b2 = new Set(bound); if (n.args[1] && n.args[1].name) b2.add(n.args[1].name);
      if (n.args[0]) freeVars(n.args[0], b2, out); n.args.slice(2).forEach(a => freeVars(a, bound, out)); return;
    }
    if (n.type === "FunctionNode") { n.args.forEach(c => freeVars(c, bound, out)); return; }   // the function's own name isn't an unknown
    n.forEach(c => freeVars(c, bound, out));
  }
  const TRIGF = /^(sin|cos|tan|asin|acos|atan)$/;
  function trigOn(n, v){
    let hit = false;
    const walk = (x, inside) => { if (hit) return; if (x.type === "SymbolNode" && x.name === v && inside) { hit = true; return; } const t = inside || (x.type === "FunctionNode" && TRIGF.test(x.fn && x.fn.name)); (x.type === "FunctionNode" ? x.args : (() => { const k = []; x.forEach(c => k.push(c)); return k; })()).forEach(c => walk(c, t)); };
    walk(n, false); return hit;
  }
  const fmtN = x => { const r = Number(x.toPrecision(10)); if (Math.abs(r) >= 1e10 || (r !== 0 && Math.abs(r) < 1e-9)) return r.toExponential(6).replace(/\.?0+e/, "e").replace("-", "−"); return String(r).replace("-", "−"); };
  const tidy = r => { r = Number(r.toPrecision(12)); const k = Math.round(r); return Math.abs(r - k) < 1e-9 * Math.max(1, Math.abs(r)) ? k : r; };
  const say = m => Object.assign(new Error(m), {say: m});
  // Every real root of f: sign changes and touching zeros over a wide range (one turn for trig equations)
  function roots(f, period){
    const xs = [];
    if (period) for (let i = 0; i <= 3600; i++) xs.push(period * i / 3600);
    else { xs.push(0); for (let k = -9; k <= 7; k += 1 / 240) { const a = Math.pow(10, k); xs.push(a, -a); } xs.sort((a, b) => a - b); }
    const F = x => { try { const y = f(x); return typeof y === "number" && isFinite(y) ? y : NaN; } catch (e) { return NaN; } };
    const ys = xs.map(F), out = [];
    const ok = r => { const y = F(r); return !Number.isNaN(y) && Math.abs(y) <= 1e-7 * Math.max(1, Math.abs(r)); };
    for (let i = 0; i < xs.length; i++) {
      const y = ys[i]; if (Number.isNaN(y)) continue;
      if (y === 0) { out.push(xs[i]); continue; }
      const y2 = ys[i + 1];
      if (i + 1 < xs.length && !Number.isNaN(y2) && y2 !== 0 && (y < 0) !== (y2 < 0)) {
        let a = xs[i], b = xs[i + 1], fa = y;
        for (let k = 0; k < 200; k++) { const m = (a + b) / 2; if (m === a || m === b) break; const fm = F(m); if (Number.isNaN(fm)) break; if (fm === 0) { a = b = m; break; } if ((fm < 0) === (fa < 0)) { a = m; fa = fm; } else b = m; }
        const r = (a + b) / 2; if (ok(r)) out.push(r);
      } else if (i > 0 && i + 1 < xs.length && !Number.isNaN(ys[i - 1]) && !Number.isNaN(y2) && Math.abs(y) <= Math.abs(ys[i - 1]) && Math.abs(y) <= Math.abs(y2) && (y < 0) === (y2 < 0) && (y < 0) === (ys[i - 1] < 0)) {
        // a zero the curve only touches, like (x−2)² = 0
        let a = xs[i - 1], b = xs[i + 1]; const g = x => Math.abs(F(x)), R = (Math.sqrt(5) - 1) / 2;
        for (let k = 0; k < 200 && b - a > 1e-15 * Math.max(1, Math.abs(a)); k++) { const c = b - R * (b - a), d = a + R * (b - a); if (g(c) < g(d)) b = d; else a = c; }
        const r = (a + b) / 2; if (Math.abs(F(r)) <= 1e-9 * Math.max(1, Math.abs(r))) out.push(r);
      }
    }
    const uniq = []; out.map(tidy).sort((a, b) => a - b).forEach(r => { if (!uniq.length || Math.abs(r - uniq[uniq.length - 1]) > 1e-7 * Math.max(1, Math.abs(r))) uniq.push(r); });
    return period ? uniq.filter(r => r >= 0 && r < period - 1e-9 * period) : uniq;
  }
  // Newton's method for a system, from several starting points; each distinct answer is kept
  function newton(F, n){
    const sols = [], starts = [Array(n).fill(0), Array(n).fill(1), Array(n).fill(-1)];
    for (let k = 0; k < 24; k++) starts.push(Array.from({length: n}, (_, j) => Math.sin(k * 12.9898 + j * 78.233) * 10 * (1 + k % 4)));
    const solveLin = (A, b) => { const m = A.map((r, i) => r.concat([b[i]])); for (let c = 0; c < n; c++) { let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(m[r][c]) > Math.abs(m[p][c])) p = r; if (Math.abs(m[p][c]) < 1e-14) return null; [m[c], m[p]] = [m[p], m[c]]; for (let r = 0; r < n; r++) if (r !== c) { const f = m[r][c] / m[c][c]; for (let k = c; k <= n; k++) m[r][k] -= f * m[c][k]; } } return m.map((r, i) => r[n] / r[i]); };
    for (const s0 of starts) {
      let x = s0.slice(), good = false;
      for (let it = 0; it < 80; it++) {
        let fx; try { fx = F(x); } catch (e) { break; } if (fx.some(v => !isFinite(v))) break;
        if (Math.max(...fx.map(Math.abs)) < 1e-11) { good = true; break; }
        const J = []; for (let j = 0; j < n; j++) { const h = 1e-7 * Math.max(1, Math.abs(x[j])), x2 = x.slice(); x2[j] += h; let f2; try { f2 = F(x2); } catch (e) { f2 = null; } if (!f2) break; f2.forEach((v, i) => { (J[i] = J[i] || [])[j] = (v - fx[i]) / h; }); }
        if (J.length !== n) break;
        const dx = solveLin(J, fx.map(v => -v)); if (!dx) break;
        x = x.map((v, j) => v + dx[j]);
      }
      if (!good) continue;
      const r = x.map(tidy);
      if (!sols.some(s => s.every((v, j) => Math.abs(v - r[j]) <= 1e-7 * Math.max(1, Math.abs(v))))) sols.push(r);
      if (sols.length >= 4) break;
    }
    return sols;
  }
  // tokens → {v: a number (for Ans and S⇔D), txt: what the screen shows when it isn't just v}
  async function compute(tokens, scope){
    const math = await loadMath(), eqs = [[]];
    tokens.forEach(t => { if (t.m === ";") eqs.push([]); else eqs[eqs.length - 1].push(t); });
    const parts = eqs.filter(e => e.length).map(e => {
      const k = e.findIndex(t => t.m === "=");
      if (k >= 0 && e.slice(k + 1).some(t => t.m === "=")) throw new Error("Syntax");
      return k < 0 ? [toMath(e)] : [toMath(e.slice(0, k)), toMath(e.slice(k + 1))];
    });
    if (!parts.length || parts.some(p => p.some(x => !x))) throw new Error("Syntax");
    let nodes; try { nodes = parts.map(p => p.map(x => math.parse(x))); } catch (e) { throw new Error("Syntax"); }
    const free = new Set(); nodes.forEach(p => p.forEach(n => freeVars(n, new Set(), free)));
    const isEq = parts.some(p => p.length === 2), vars = [...free].sort();
    const base = new Map(Object.entries(scope || {}));
    const num = y => { if (y && typeof y === "object" && typeof y.toNumber === "function") y = y.toNumber(); if (typeof y !== "number" || !isFinite(y)) throw new Error("Math"); return y; };
    if (!vars.length && parts.length === 1 && !isEq) return {v: num(math.evaluate(parts[0][0], scope))};
    if (!vars.length) {   // 2 + 2 = 4: true or false
      const t = parts.every(p => p.length < 2 || Math.abs(num(p[0] && math.evaluate(p[0], scope)) - num(math.evaluate(p[1], scope))) <= 1e-9 * Math.max(1, Math.abs(num(math.evaluate(p[1], scope)))));
      return {v: null, txt: t ? "True" : "False"};
    }
    if (!isEq) throw say("Add = to solve");
    const code = nodes.map(p => p.map(n => n.compile()));
    const diff = (c, sc) => num(c[0].evaluate(sc)) - (c[1] ? num(c[1].evaluate(sc)) : 0);
    if (vars.length === 1 && parts.length === 1) {
      const v = vars[0], sc = new Map(base), trig = nodes[0].some(n => trigOn(n, v));
      const period = trig ? (C.angle === "deg" ? 360 : C.angle === "gra" ? 400 : 2 * Math.PI) : 0;
      const rs = roots(x => { sc.set(v, x); return diff(code[0], sc); }, period);
      if (!rs.length) throw say("No real solution");
      const shown = rs.slice(0, 8).map(fmtN).join(", ") + (rs.length > 8 ? ", …" : "");
      const range = trig ? (C.angle === "deg" ? " (0–360°)" : C.angle === "gra" ? " (0–400ᵍ)" : " (0–2π)") : "";
      return {v: rs[0], txt: `${v} = ${shown}${range}`, all: rs};
    }
    if (vars.length > parts.length) throw say(vars.length - parts.length === 1 && parts.length === 1 ? "Two unknowns: add an equation" : "More unknowns than equations");
    if (vars.length < parts.length || vars.length > 4) throw say("Can't solve this system");
    const sc = new Map(base);
    const sols = newton(x => { vars.forEach((v, j) => sc.set(v, x[j])); return code.map(c => diff(c, sc)); }, vars.length);
    if (!sols.length) throw say("No real solution");
    return {v: sols[0][0], txt: sols.map(s => vars.map((v, j) => `${v} = ${fmtN(s[j])}`).join(", ")).join("  or  "), all: sols};
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
  const S = {tokens: [], cur: 0, shift: false, hyp: false, done: false, result: null, err: "", txt: "", note: "", frac: false,
    ans: Number(saved.ans) || 0, mem: Number(saved.mem) || 0, hist: Array.isArray(saved.hist) ? saved.hist.slice(0, 30) : [], hi: -1};
  C.angle = ["deg", "rad", "gra"].includes(saved.angle) ? saved.angle : "deg";
  const save = () => lsSet(LS, {ans: S.ans, mem: S.mem, hist: S.hist.slice(0, 30), angle: C.angle});

  function insert(t){
    if (S.done) { S.done = false; S.err = ""; S.result = null; S.txt = ""; S.frac = false; }
    S.tokens.splice(S.cur, 0, t); S.cur++;
  }
  async function evaluate(){
    if (!S.tokens.length) return;
    S.txt = ""; S.note = "";
    try { await loadMath(); } catch (e) { S.err = "Couldn't load the calculator"; S.done = true; return; }
    let r; try { r = await compute(S.tokens, {Ans: S.ans, M: S.mem}); } catch (e) { S.err = e && e.say ? e.say : /Math|Cannot convert|complex|Infinity/i.test(String(e && e.message)) ? "Math ERROR" : "Syntax ERROR"; S.done = true; return; }
    let v = r.v;
    if (v != null) { try { show(v); } catch (e) { S.err = "Math ERROR"; S.done = true; return; } v = Number(v.toPrecision(15)); S.ans = v; }
    S.result = v; S.txt = r.txt || ""; S.err = ""; S.done = true; S.frac = false;
    S.hist.unshift({t: S.tokens.slice(), v, txt: S.txt || undefined}); S.hist = S.hist.slice(0, 30); S.hi = -1;
    save();
  }
  /* Typing a whole expression in at once (from "select an equation on screen"); false if it isn't one the calculator reads */
  function put(text, angle){
    let toks; try { toks = fromText(text); toMath(toks.filter(t => t.m !== "=" && t.m !== ";")); } catch (e) { return false; }
    if (!toks.length) return false;
    if (angle === "deg" || angle === "rad") { C.angle = angle; save(); }
    S.tokens = toks; S.cur = toks.length; S.done = false; S.result = null; S.err = ""; S.txt = ""; S.note = ""; S.frac = false; S.hi = -1;
    return true;
  }
  async function press(a){
    const shifted = S.shift;
    S.shift = false;
    if (a === "shift") { S.shift = !shifted; return; }
    if (a === "hyp") { S.hyp = !S.hyp; return; }
    if (a === "drg") { C.angle = C.angle === "deg" ? "rad" : C.angle === "rad" ? "gra" : "deg"; save(); return; }
    if (a === "ac") { S.tokens = []; S.cur = 0; S.done = false; S.result = null; S.err = ""; S.txt = ""; S.note = ""; S.frac = false; S.hyp = false; S.hi = -1; return; }
    if (a === "del") { if (S.done) { S.done = false; S.err = ""; S.result = null; S.cur = S.tokens.length; return; } if (S.cur > 0) { S.tokens.splice(S.cur - 1, 1); S.cur--; } return; }
    if (a === "left" || a === "right") {
      if (S.done) { S.done = false; S.err = ""; S.result = null; S.cur = a === "left" ? S.tokens.length : 0; return; }
      S.cur = Math.max(0, Math.min(S.tokens.length, S.cur + (a === "left" ? -1 : 1))); return;
    }
    if (a === "up" || a === "down") {
      if (!S.hist.length) return;
      S.hi = Math.max(0, Math.min(S.hist.length - 1, S.hi + (a === "up" ? 1 : -1)));
      const h = S.hist[S.hi]; S.tokens = h.t.slice(); S.cur = S.tokens.length; S.result = h.v; S.txt = h.txt || ""; S.done = true; S.err = ""; S.frac = false; return;
    }
    if (a === "sd") { if (S.done && S.result != null && !S.txt && asFraction(S.result)) S.frac = !S.frac; return; }
    if (a === "eq") { await evaluate(); return; }
    if (a === "mplus" || a === "mminus" || a === "mc") {
      if (a === "mc" || (shifted && a === "mr")) { S.mem = 0; save(); return; }
      if (!S.done && S.tokens.length) await evaluate();
      if (S.done && !S.err && S.result != null) { S.mem = Number((S.mem + (a === "mplus" ? S.result : -S.result)).toPrecision(15)); save(); }
      return;
    }
    if (a === "mr" && shifted) { S.mem = 0; save(); return; }
    S.note = "";
    if (S.done && !S.err && S.result != null && CARRY.has(a)) { S.done = false; S.result = null; S.txt = ""; S.tokens = [TOK.ans]; S.cur = 1; }
    else if (S.done) { S.done = false; S.err = ""; S.result = null; S.txt = ""; S.tokens = []; S.cur = 0; }
    const t = tokenFor(a); if (t) insert(t);
  }

  /* The window */
  let W = null;
  const keyHtml = ([l, a, sl, sa, cls]) => `<div class="cx-k ${cls || (/^[0-9.]$/.test(l) ? "k-num" : "k-fn")}">${sl ? `<span class="cx-s" aria-hidden="true">${esc(sl)}</span>` : `<span class="cx-s" aria-hidden="true"></span>`}<button type="button" data-cx="${a}"${sa ? ` data-cxs="${sa}"` : ""} aria-label="${esc(KEYNAME[a] || l)}${sl ? `, shift: ${esc(KEYNAME[sa] || sl)}` : ""}">${esc(l)}</button></div>`;
  const KEYNAME = {shift: "Shift", hyp: "Hyperbolic", drg: "Degrees, radians or gradians", left: "Move left", right: "Move right", sd: "Fraction or decimal", inv: "Reciprocal", fact: "Factorial", ncr: "Combinations", npr: "Permutations", sqrt: "Square root", cbrt: "Cube root", sq: "Squared", cube: "Cubed", pow: "Power", root: "Root", log: "Log", tenx: "10 to the power", ln: "Natural log", ex: "e to the power", sin: "Sine", asin: "Inverse sine", cos: "Cosine", acos: "Inverse cosine", tan: "Tangent", atan: "Inverse tangent", lp: "Open bracket", rp: "Close bracket", neg: "Negative", abs: "Absolute value", pi: "Pi", e: "e", pct: "Percent", mplus: "Memory add", mminus: "Memory subtract", mr: "Memory recall", mc: "Memory clear", del: "Delete", ac: "All clear", mul: "Times", div: "Divide", add: "Plus", sub: "Minus", dot: "Point", exp: "Times ten to the power", ans: "Answer", eq: "Equals"};
  function frame(){
    return `<div class="cx-body">
      <div class="cx-top" data-cx-drag><span class="cx-brand">STUDYBOARD <b>fx</b></span><span class="cx-solar" aria-hidden="true"><i></i><i></i><i></i><i></i></span><button type="button" class="cx-snip" data-cx="snip" aria-label="Select an equation on screen" title="Select an equation on screen"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M8.5 10.5h3M10 9v3M13 15.5h3M8.6 15.4l2.8-2.8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></button><button type="button" class="cx-x" data-cx="close" aria-label="Close calculator">${CLOSE}</button></div>
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
    let txt = ""; if (S.err) txt = S.err; else if (S.note) txt = S.note; else if (S.done && S.txt) txt = S.txt; else if (S.done && S.result != null) { try { txt = S.frac && asFraction(S.result) ? asFraction(S.result) : show(S.result).txt; } catch (e) { txt = "Math ERROR"; } } else if (!S.tokens.length) txt = "0";
    res.textContent = txt; res.classList.toggle("is-err", !!S.err); res.classList.toggle("is-dim", !!S.note || (!S.done && !!S.tokens.length));
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
    if (a === "snip") { if (window.SBCALCSNIP) SBCALCSNIP.start(); return; }
    if (a === "copy") { const r = W.querySelector(".cx-res").textContent; if (S.done && !S.err && S.txt) { try { await navigator.clipboard.writeText(S.txt.replace(/−/g, "-")); toast(`Copied ${r}`); } catch (e) {} return; } if (S.done && !S.err && S.result != null) { try { await navigator.clipboard.writeText(S.frac && asFraction(S.result) ? asFraction(S.result).replace("⁄", "/").replace("−", "-") : show(S.result).plain); toast(`Copied ${r}`); } catch (e) {} } return; }
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
    // clicking the display or the body (not a key) keeps the keyboard on the calculator
    W.tabIndex = -1;
    W.addEventListener("pointerdown", () => { if (!W.contains(document.activeElement)) W.focus({preventScroll: true}); });
    // dragging by the top strip (computers)
    const top = W.querySelector("[data-cx-drag]");
    top.addEventListener("pointerdown", e => {
      if (innerWidth < 640 || e.target.closest("button")) return;
      const r = W.getBoundingClientRect(), dx = e.clientX - r.left, dy = e.clientY - r.top; top.setPointerCapture(e.pointerId);
      const mv = ev => { W.style.left = Math.max(0, Math.min(innerWidth - r.width, ev.clientX - dx)) + "px"; W.style.top = Math.max(0, Math.min(innerHeight - 60, ev.clientY - dy)) + "px"; };
      const up = () => { top.removeEventListener("pointermove", mv); top.removeEventListener("pointerup", up); };
      top.addEventListener("pointermove", mv); top.addEventListener("pointerup", up);
    });
    // its size: drag the corner grip (or use the arrow keys on it) to make it smaller or bigger; double-click goes back to normal
    W.insertAdjacentHTML("beforeend", `<button type="button" class="cx-grip" aria-label="Resize calculator" title="Drag to resize. Double-click for normal size."><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M14 6L6 14M14 10.5L10.5 14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></button>`);
    const grip = W.querySelector(".cx-grip");
    grip.addEventListener("pointerdown", e => {
      if (innerWidth < 640) return;
      e.preventDefault(); e.stopPropagation(); grip.setPointerCapture(e.pointerId);
      const st = {x: e.clientX, y: e.clientY, k: K, w: W.offsetWidth, h: W.offsetHeight};
      const mv = ev => { const f = ((st.w + ev.clientX - st.x) / st.w + (st.h + ev.clientY - st.y) / st.h) / 2; setK(st.k * f, false); };
      const up = () => { grip.removeEventListener("pointermove", mv); grip.removeEventListener("pointerup", up); grip.removeEventListener("pointercancel", up); setK(K, true); };
      grip.addEventListener("pointermove", mv); grip.addEventListener("pointerup", up); grip.addEventListener("pointercancel", up);
    });
    grip.addEventListener("dblclick", () => setK(1, true));
    grip.addEventListener("keydown", e => {
      const d = {ArrowUp: 0.05, ArrowRight: 0.05, ArrowDown: -0.05, ArrowLeft: -0.05}[e.key];
      if (d) { e.preventDefault(); e.stopPropagation(); setK(K + d, true); } else if (e.key === "Home") { e.preventDefault(); setK(1, true); }
    });
    setK(K, false);
    let rz = 0; addEventListener("resize", () => { clearTimeout(rz); rz = setTimeout(() => { if (W && !W.hidden && innerWidth < 640) place(); else if (W && !W.hidden) { const r = W.getBoundingClientRect(); if (r.right > innerWidth || r.bottom > innerHeight) place(); } }, 100); });
    place(); paint();
    loadMath().catch(() => {});
    W.querySelector('[data-cx="eq"]').focus({preventScroll: true});
  }
  /* Size (computers): 60% to 120% of normal, kept on this device */
  const SIZE_LS = "studyboard:calcSize", K_MIN = 0.6, K_MAX = 1.2;
  let K = (() => { try { const v = Number(localStorage.getItem(SIZE_LS)); return v >= K_MIN && v <= K_MAX ? v : 1; } catch (e) { return 1; } })();
  function setK(k, keep){
    K = Math.round(Math.max(K_MIN, Math.min(K_MAX, Number(k) || 1)) * 100) / 100;
    if (!W) return;
    W.style.setProperty("--cx-k", K);
    const g = W.querySelector(".cx-grip"); if (g) g.setAttribute("aria-label", `Resize calculator (${Math.round(K * 100)}%). Arrow keys change the size.`);
    // the top-left corner stays put; if the bigger size would leave the screen, it moves back on
    if (innerWidth >= 640 && W.style.left) { const r = W.getBoundingClientRect(); if (r.right > innerWidth - 4) W.style.left = Math.max(4, innerWidth - 4 - r.width) + "px"; if (r.bottom > innerHeight - 4) W.style.top = Math.max(4, innerHeight - 4 - r.height) + "px"; }
    if (keep) { try { if (K === 1) localStorage.removeItem(SIZE_LS); else localStorage.setItem(SIZE_LS, String(K)); } catch (e) {} }
  }
  function skin(){ try { if (window.SBCALCSKIN) SBCALCSKIN.apply(W); } catch (e) { console.warn("calculator theme", e); } }
  function close(){ if (!W) return; W.hidden = true; const b = document.querySelector('[data-act="calc-open"]'); if (b && b.offsetParent) b.focus({preventScroll: true}); }
  const KEYMAP = {"+": "add", "-": "sub", "*": "mul", "x": "mul", "/": "div", "^": "pow", "(": "lp", ")": "rp", ".": "dot", ",": "dot", "%": "pct", "!": "fact", "Enter": "eq", "=": "eq", "Backspace": "del", "Delete": "ac",
    "ArrowLeft": "left", "ArrowRight": "right", "ArrowUp": "up", "ArrowDown": "down", "p": "pi", "s": "sin", "c": "cos", "t": "tan", "l": "ln", "g": "log", "r": "sqrt", "e": "e", "a": "ans", "E": "exp"};
  function onKey(e){
    if (e.target && e.target.closest && e.target.closest(".cx-grip")) return;
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
  // While the calculator is open, its keys go to it before any page shortcut (1 to 7 switch pages, 1 to 4 rate
  // flashcards, N adds a task...), wherever the focus is. Typing in a box elsewhere, or a dialog in front, still wins.
  const editable = t => !!t && t.nodeType === 1 && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
  const modalOpen = () => [...document.querySelectorAll("dialog[open]")].some(d => { try { return d.matches(":modal"); } catch (e) { return true; } });
  window.addEventListener("keydown", e => {
    if (!W || W.hidden || e.isComposing || document.querySelector(".cxs-veil")) return;   // selecting an equation on screen: Esc is the selector's
    const t = e.target, inside = !!(t && t.nodeType === 1 && W.contains(t));
    if (!inside) {
      if (editable(t) || modalOpen() || e.ctrlKey || e.metaKey || e.altKey) return;
      // keys that move around the page or press the focused button keep doing that
      if (/^(Escape|Tab| |ArrowLeft|ArrowRight|ArrowUp|ArrowDown)$/.test(e.key)) return;
      if (e.key === "Enter" && t && t.closest && t.closest("button,a,summary,[role=button]")) return;
    }
    onKey(e);
    if (e.defaultPrevented) {
      e.stopImmediatePropagation();
      if (!inside) W.focus({preventScroll: true});
    }
  }, true);

  hook("act", act0 => { if (act0 !== "calc-open") return false; if (W && !W.hidden) close(); else open(); return true; });
  hook("menu", () => `<button data-act="calc-open"><span>Calculator<span class="sub">A scientific calculator in its own window</span></span></button>`);
  window.SBCALC = {open, close, press: async a => { await press(a); paint(); }, state: () => ({tokens: S.tokens.map(t => t.d).join(""), result: S.result, txt: S.txt, err: S.err, mem: S.mem, angle: C.angle, frac: S.frac}), toMath, show,
    // "select an equation on screen" (99-calc-snip.js)
    put: (text, angle) => { if (!W) open(); const ok = put(text, angle); paint(); return ok; },
    note: t => { S.note = t || ""; paint(); },
    win: () => W, fromText, compute: (text, scope) => compute(fromText(text), scope || {Ans: 0, M: 0})};
})();
