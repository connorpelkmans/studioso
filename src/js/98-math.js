/* Maths in the chat (the Companion tab): worked out in code wherever it can be, exactly, with the reasoning left to the AI only when it
   has to be. A small model on a laptop gets arithmetic wrong and sends "150 lbs to kg" off to Wikipedia; here:
     solve      sums in symbols or words (sqrt, powers, factorials, logs, fractions kept exact), percentages, unit conversions,
                averages and spread, one equation in x (straight-line or quadratic): exact, no AI
     follow-ups "what about 200?", "and in 0.75 L?", "what's the median?", "yards?" carry on from the last sum (its units or numbers)
     ask        anything else that's maths (word problems, dosage, calculus, "why", "show the steps"): the AI writes the working, with
                every calculation as [[expression]], and the app puts in each value, so the numbers are exact whatever the model
   Used on every engine; E4B reads the short instructions, the smaller models get worked examples. */
window.SBMATH = (() => {
  const low = s => String(s == null ? "" : s).toLowerCase();
  const fmt = v => { if (!isFinite(v)) return String(v); const a = Math.abs(v); if (a !== 0 && (a < 1e-4 || a >= 1e12)) return v.toExponential(4).replace(/\.?0+e/, "e").replace("e+", " × 10^").replace("e-", " × 10^-");
    const r = Math.round(v * 1e6) / 1e6; return r.toLocaleString("en-US", {maximumFractionDigits: 6}); };
  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
  const fact = n => { if (n < 0 || n !== Math.floor(n) || n > 170) throw 0; let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; };

  /* ---------- an expression: + - * / ^ ( ) ! sqrt cbrt ln log log10 abs, pi and e, with x when given ---------- */
  function evaluate(src, x){
    const t = String(src).replace(/\s+/g, "").replace(/π/g, "pi").replace(/×/g, "*").replace(/÷/g, "/").replace(/[−–]/g, "-").replace(/\*\*/g, "^");
    let i = 0;
    const peek = () => t[i];
    const num = () => { const m = /^\d+(\.\d+)?|^\.\d+/.exec(t.slice(i)); if (!m) throw 0; i += m[0].length; return Number(m[0]); };
    const FN = {sqrt: Math.sqrt, cbrt: Math.cbrt, ln: Math.log, log10: Math.log10, log: Math.log10, abs: Math.abs, sin: Math.sin, cos: Math.cos, tan: Math.tan, exp: Math.exp};
    const atom = () => {
      if (peek() === "-") { i++; return -pow(); } if (peek() === "+") { i++; return pow(); }
      if (peek() === "(") { i++; const v = sum(); if (peek() !== ")") throw 0; i++; return v; }
      const w = /^(log10|sqrt|cbrt|ln|log|abs|sin|cos|tan|exp|pi|e|x)/i.exec(t.slice(i));
      if (w) { const k = w[0].toLowerCase();
        if (FN[k]) { i += k.length; const a = pow(); return FN[k](a); }
        if (k === "pi") { i += 2; return Math.PI; } if (k === "e") { i += 1; return Math.E; }
        if (k === "x" && x != null) { i += 1; return x; } throw 0; }
      return num();
    };
    const post = () => { let v = atom(); while (peek() === "!") { i++; v = fact(v); } return v; };
    const pow = () => { const b = post(); if (peek() === "^") { i++; return Math.pow(b, pow()); } return b; };
    // implicit multiplication, looser than powers: 2x, 3(x-2), (x+1)(x-1), 2pi, 2x^2
    const prod = () => { let v = pow();
      for (;;) { if (peek() === "*" || peek() === "/") { const o = t[i++], r = pow(); v = o === "*" ? v * r : v / r; }
        else if (i < t.length && /[\d(.a-z]/i.test(peek())) v *= pow();
        else return v; } };
    const sum = () => { let v = prod(); while (peek() === "+" || peek() === "-") { const o = t[i++], r = prod(); v = o === "+" ? v + r : v - r; } return v; };
    const v = sum(); if (i !== t.length) throw 0; return v;
  }
  // exact fractions for + - * / of whole numbers ("1/3 + 1/4" is 7/12)
  function fraction(src){
    const t = String(src).replace(/\s+/g, "").replace(/×/g, "*").replace(/÷/g, "/"); if (!/^[-+*/()\d]+$/.test(t) || !/\//.test(t)) return null;
    let i = 0; const F = (n, d) => { if (!d) throw 0; const g = gcd(n, d) || 1; return d < 0 ? [-n / g, -d / g] : [n / g, d / g]; };
    const atom = () => { if (t[i] === "-") { i++; const a = atom(); return [-a[0], a[1]]; } if (t[i] === "(") { i++; const v = sum(); if (t[i] !== ")") throw 0; i++; return v; } const m = /^\d+/.exec(t.slice(i)); if (!m) throw 0; i += m[0].length; return [Number(m[0]), 1]; };
    const prod = () => { let v = atom(); while (t[i] === "*" || t[i] === "/") { const o = t[i++], r = atom(); v = o === "*" ? F(v[0] * r[0], v[1] * r[1]) : F(v[0] * r[1], v[1] * r[0]); } return v; };
    const sum = () => { let v = prod(); while (t[i] === "+" || t[i] === "-") { const o = t[i++], r = prod(); v = F(v[0] * r[1] + (o === "+" ? 1 : -1) * r[0] * v[1], v[1] * r[1]); } return v; };
    try { const v = sum(); return i === t.length ? v : null; } catch (e) { return null; }
  }

  /* ---------- the words people use for sums ---------- */
  const NUMW = {zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, twenty: 20, hundred: 100, thousand: 1000};
  function words2expr(q){
    let s = " " + low(q).replace(/[’‘]/g, "'").replace(/,(?=\d{3}\b)/g, "").replace(/^\s*(?:(?:and|so|ok(?:ay)?|now|then|but|wait|what about|how about|and what about)[,\s]+)+/, "") + " ";
    s = s.replace(/\b(what'?s|whats|wats|what is|what are|calculate|compute|evaluate|work out|how much is|tell me|give me|find|solve|equals?|again|lol|pls|please|real quick|quickly|the answer to|the value of)\b/g, " ");
    s = s.replace(/\b(zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|twenty|hundred|thousand)\b/g, w => NUMW[w]);
    s = s.replace(/\bsquare root of\b|\bsqrt of\b|\broot of\b/g, " sqrt ").replace(/\bcube root of\b/g, " cbrt ")
      .replace(/\blog base 10 of\b|\blog of\b|\blog10 of\b/g, " log10 ").replace(/\bnatural log of\b|\bln of\b/g, " ln ")
      .replace(/(\d+(?:\.\d+)?)\s*(?:squared)\b/g, "$1^2").replace(/(\d+(?:\.\d+)?)\s*(?:cubed)\b/g, "$1^3")
      .replace(/(\d+(?:\.\d+)?)\s*to the (\d+)(?:st|nd|rd|th)?(?: power)?\b/g, "$1^$2").replace(/(\d+(?:\.\d+)?)\s*to the power of\s*(-?\d+)/g, "$1^$2").replace(/\bto the power\b/g, "^")
      .replace(/(\d+\s*\/\s*\d+)\s+of\s+(?=[\d(])/g, "($1) * ").replace(/\b(\d+)\s*factorial\b/g, "$1!").replace(/\bfactorial of (\d+)/g, "$1!")
      .replace(/\btimes\b|\bmultiplied by\b/g, "*").replace(/\bdivided by\b|\bover\b(?=\s*\d)/g, "/").replace(/\bplus\b|\badded to\b/g, "+").replace(/\bminus\b|\btake away\b/g, "-");
    s = s.replace(/(\d)\s*x\s*(?=[\d(-])/g, "$1*").replace(/\)\s*x\s*(?=[\d(])/g, ")*");
    return s.replace(/(?<!\d)[=?!]+\s*$/, "").replace(/[=?]+\s*$/, "").replace(/\s+/g, " ").trim();
  }
  function arithmetic(q){
    const e = words2expr(q);
    if (!e || !/\d/.test(e) || /[a-wyz]{2,}/.test(e.replace(/\b(sqrt|cbrt|ln|log10|log|abs|pi|e)\b/g, "")) || /\bx\b/.test(e)) return null;
    if (!/[-+*/^!]|\b(sqrt|cbrt|ln|log10|log)\b/.test(e.replace(/^-/, ""))) return null;
    if (!/^[-+*/^!().\d\s]*(?:(sqrt|cbrt|ln|log10|log|abs|pi|e)[-+*/^!().\d\s]*)*$/.test(e)) return null;
    let v; try { v = evaluate(e); } catch (x) { return null; } if (typeof v !== "number" || !isFinite(v)) return null;
    const shown = e.replace(/\*/g, " × ").replace(/\//g, " / ").replace(/\s+/g, " ").replace(/\s*\^\s*/g, "^").replace(/sqrt\s*/g, "√").replace(/\(\s+/g, "(").replace(/\s+\)/g, ")").trim();
    const fr = fraction(e), frac = fr && fr[1] !== 1 ? `${fr[0]}/${fr[1]}` : "";
    return {answer: frac ? `${shown} = ${frac}, about ${fmt(v)}` : `${shown} = ${fmt(v)}`, value: v, expr: e};
  }

  /* ---------- units ---------- */
  const U = {};
  const unit = (dim, f, names) => names.split("|").forEach(n => { U[n] = {dim, f, name: names.split("|")[0]}; });
  unit("len", 0.001, "mm|millimeter|millimeters|millimetre|millimetres"); unit("len", 0.01, "cm|centimeter|centimeters|centimetre|centimetres"); unit("len", 1, "m|meter|meters|metre|metres");
  unit("len", 1000, "km|kilometer|kilometers|kilometre|kilometres|k"); unit("len", 0.0254, "in|inch|inches"); unit("len", 0.3048, "ft|foot|feet"); unit("len", 0.9144, "yd|yard|yards"); unit("len", 1609.344, "mi|mile|miles");
  unit("mass", 1e-6, "mcg|microgram|micrograms|µg|ug"); unit("mass", 0.001, "mg|milligram|milligrams"); unit("mass", 1, "g|gram|grams|gm"); unit("mass", 1000, "kg|kilogram|kilograms|kilo|kilos");
  unit("mass", 28.349523125, "oz|ounce|ounces"); unit("mass", 453.59237, "lb|lbs|pound|pounds"); unit("mass", 6350.29318, "stone|stones|st");
  unit("vol", 1, "ml|milliliter|milliliters|millilitre|millilitres|cc"); unit("vol", 1000, "l|liter|liters|litre|litres"); unit("vol", 4.92892159375, "tsp|teaspoon|teaspoons");
  unit("vol", 14.78676478125, "tbsp|tablespoon|tablespoons"); unit("vol", 29.5735295625, "fl oz|fluid ounce|fluid ounces"); unit("vol", 236.5882365, "cup|cups"); unit("vol", 473.176473, "pint|pints|pt");
  unit("vol", 946.352946, "quart|quarts|qt"); unit("vol", 3785.411784, "gallon|gallons|gal");
  unit("time", 1, "s|sec|secs|second|seconds"); unit("time", 60, "min|mins|minute|minutes"); unit("time", 3600, "h|hr|hrs|hour|hours"); unit("time", 86400, "day|days"); unit("time", 604800, "week|weeks|wk|wks");
  unit("time", 31536000, "year|years|yr|yrs");
  unit("speed", 0.44704, "mph|miles per hour|mi/h"); unit("speed", 1 / 3.6, "km/h|kph|kmh|km per hour|kilometers per hour|kilometres per hour"); unit("speed", 1, "m/s|meters per second|metres per second");
  unit("temp", 0, "c|°c|celsius|centigrade|degrees c|degrees celsius"); unit("temp", 0, "f|°f|fahrenheit|degrees f|degrees fahrenheit"); unit("temp", 0, "k|kelvin");
  const UN = Object.keys(U).sort((a, b) => b.length - a.length).map(n => n.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&")).join("|");
  const tempName = u => /^(c|°c|celsius|centigrade|degrees c|degrees celsius)$/.test(u) ? "C" : /^(f|°f|fahrenheit|degrees f|degrees fahrenheit)$/.test(u) ? "F" : "K";
  function convert(n, a, b){
    const A = U[a], B = U[b]; if (!A || !B || A.dim !== B.dim) return null;
    if (A.dim === "temp") { const x = tempName(a), y = tempName(b); const c = x === "C" ? n : x === "F" ? (n - 32) * 5 / 9 : n - 273.15; return y === "C" ? c : y === "F" ? c * 9 / 5 + 32 : c + 273.15; }
    return n * A.f / B.f;
  }
  const SHOWN = {mi: ["mile", "miles"], ft: ["foot", "feet"], yd: ["yard", "yards"], in: ["inch", "inches"], s: ["second", "seconds"], min: ["minute", "minutes"], h: ["hour", "hours"], day: ["day", "days"], week: ["week", "weeks"], year: ["year", "years"],
    cup: ["cup", "cups"], pint: ["pint", "pints"], quart: ["quart", "quarts"], gallon: ["gallon", "gallons"], l: ["L", "L"], ml: ["mL", "mL"]};
  const label = (u, n) => { const A = U[u]; if (!A) return u; if (A.dim === "temp") return "°" + tempName(u); const nm = A.name === "k" ? "km" : A.name, sh = SHOWN[nm]; return sh ? sh[n === 1 ? 0 : 1] : nm; };
  const fmt4 = v => Math.abs(v) >= 1e-3 && Math.abs(v) < 1e12 ? (Math.round(v * 1e4) / 1e4).toLocaleString("en-US", {maximumFractionDigits: 4}) : fmt(v);
  const fixU = u => { u = low(u).replace(/\.$/, "").trim(); return U[u] ? (U[u].name === "k" ? "km" : u) : U[u.replace(/s$/, "")] ? u.replace(/s$/, "") : null; };
  const TEMPF = {"C->F": "°F = °C × 9/5 + 32", "F->C": "°C = (°F − 32) × 5/9", "C->K": "K = °C + 273.15", "K->C": "°C = K − 273.15", "F->K": "K = (°F − 32) × 5/9 + 273.15", "K->F": "°F = (K − 273.15) × 9/5 + 32"};
  function convAnswer(n, a, b, howMany){
    const v = convert(n, a, b); if (v == null || !isFinite(v)) return null;
    const A = U[a], k = A.f / U[b].f, how = A.dim === "temp" ? `using ${TEMPF[tempName(a) + "->" + tempName(b)]}` : `1 ${label(a, 1)} = ${fmt4(k)} ${label(b, k)}`;
    return {answer: n === 1 && A.dim !== "temp" ? `There ${v === 1 ? "is" : "are"} ${fmt4(v)} ${label(b, v)} in 1 ${label(a, 1)}.` : `${fmt4(n)} ${label(a, n)} = ${fmt4(v)} ${label(b, v)} (${how}).`, value: v, conv: {n, a, b, howMany: !!howMany}};
  }
  const UNIT_RE = new RegExp(`(-?\\d[\\d,]*\\.?\\d*|\\.\\d+)\\s*(${UN})\\.?\\s+(?:to|in|into|as|=|in terms of|converted to)\\s+(?:a\\s+|an\\s+)?(${UN})\\b`, "i");
  const HOWMANY_RE = new RegExp(`\\bhow many\\s+(${UN})\\s+(?:are\\s+(?:there\\s+)?)?(?:in|per|make|makes|are in|is in)\\s+(?:a|an|one|(-?\\d[\\d,]*\\.?\\d*))?\\s*(${UN})\\b`, "i");
  function units(q){
    const s = low(q).replace(/[’‘]/g, "'").replace(/(\d),(?=\d{3}\b)/g, "$1").replace(/\bdegrees?\s+/g, "degrees ").replace(/(\d)\s*°\s*([cf])\b/g, "$1 $2");
    const fix = fixU;
    // "3 hrs 45 min in minutes": both parts
    const two = new RegExp(`(\\d+(?:\\.\\d+)?)\\s*(${UN})\\.?\\s+(?:and\\s+)?(\\d+(?:\\.\\d+)?)\\s*(${UN})\\.?\\s+(?:to|in|into|as)\\s+(${UN})\\b`, "i").exec(s);
    if (two) { const a1 = fix(two[2]), a2 = fix(two[4]), b = fix(two[5]);
      if (a1 && a2 && b && U[a1].dim === U[b].dim && U[a2].dim === U[b].dim && U[b].dim !== "temp") { const x1 = convert(Number(two[1]), a1, b), x2 = convert(Number(two[3]), a2, b), v = x1 + x2;
        return {answer: `${two[1]} ${label(a1, Number(two[1]))} ${two[3]} ${label(a2, Number(two[3]))} = ${fmt4(v)} ${label(b, v)} (${fmt4(x1)} + ${fmt4(x2)}).`, value: v}; } }
    let m = UNIT_RE.exec(s.replace(/\bdegrees (c|f|celsius|fahrenheit)\b/g, "$1"));
    if (m) { const a = fix(m[2]), b = fix(m[3]); if (a && b && U[a].dim === U[b].dim && a !== b) return convAnswer(Number(m[1]), a, b); }
    m = HOWMANY_RE.exec(s);
    if (m) { const b = fix(m[1]), a = fix(m[3]); if (a && b && U[a].dim === U[b].dim) return convAnswer(m[2] ? Number(m[2]) : 1, a, b, true); }
    return null;
  }

  /* ---------- a list of numbers: average, median, mode, range, spread ---------- */
  const STAT = /\b(mean|average|avg|median|mode|range|standard deviation|std ?dev|sd|variance|sum|total)\b/;
  function stats(q, list){
    const s = low(q), which = (s.match(STAT) || [])[1]; if (!which) return null;
    // only a plain list ("mean of 4, 8, 15", "median: 7 3 9"), or the last list asked about again ("what's the median?");
    // "weighted avg", "z score ... mean 70", "avg speed if I drive..." and "what do I need for a 90 average" are word problems
    if (/\b(weighted|z ?-?score|speed|need|to get|would|if|worth|per|percentile|grade|grades|marks?|why|how come|isn'?t|not)\b/.test(s)) return null;
    let xs = null;
    const lm = new RegExp(`\\b${which.replace(/ /g, "\\s+")}\\b\\s*(?:of|for|is|:|=)?\\s*(?:the\\s+)?(?:numbers?|data|values|set|list)?\\s*(?:of\\s+)?:?\\s*((?:-?\\d+(?:\\.\\d+)?[\\s,;]*(?:and\\s+)?){3,})\\s*[?.!]*$`).exec(s.replace(/(\d),(?=\d{3}\b)/g, "$1"));
    if (lm) { xs = (lm[1].match(/-?\d+(?:\.\d+)?/g) || []).map(Number); if (xs.length < 3) xs = null; }
    else if (list && !/\d/.test(s) && s.split(/\s+/).length <= 8) xs = list;
    if (!xs || xs.length < 2) return null;
    const n = xs.length, sum = xs.reduce((a, b) => a + b, 0), mean = sum / n, sorted = xs.slice().sort((a, b) => a - b);
    const med = n % 2 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
    const cnt = new Map(); xs.forEach(v => cnt.set(v, (cnt.get(v) || 0) + 1)); const top = Math.max(...cnt.values()), modes = [...cnt].filter(([, c]) => c === top).map(([v]) => v);
    const pv = xs.reduce((a, v) => a + (v - mean) ** 2, 0) / n, sv = n > 1 ? xs.reduce((a, v) => a + (v - mean) ** 2, 0) / (n - 1) : 0;
    const L = sorted.map(fmt).join(", ");
    let a;
    if (/mean|average|avg/.test(which)) a = `The mean is ${fmt(mean)}: the numbers add up to ${fmt(sum)}, and ${fmt(sum)} ÷ ${n} = ${fmt(mean)}.`;
    else if (which === "median") a = `The median is ${fmt(med)}. In order: ${L}; ${n % 2 ? `the middle one is ${fmt(med)}` : `the middle two are ${fmt(sorted[n / 2 - 1])} and ${fmt(sorted[n / 2])}, and halfway between them is ${fmt(med)}`}.`;
    else if (which === "mode") a = top === 1 ? `There's no mode: every number appears once.` : `The mode is ${modes.map(fmt).join(" and ")} (it appears ${top} times).`;
    else if (which === "range") a = `The range is ${fmt(sorted[n - 1] - sorted[0])}: the largest, ${fmt(sorted[n - 1])}, minus the smallest, ${fmt(sorted[0])}.`;
    else if (/standard|std|sd/.test(which)) a = `The standard deviation is ${fmt(Math.sqrt(pv))} treating these as the whole population (σ), or ${fmt(Math.sqrt(sv))} as a sample (s, dividing by n − 1 = ${n - 1}). The mean is ${fmt(mean)}.`;
    else if (which === "variance") a = `The variance is ${fmt(pv)} for the whole population (σ²), or ${fmt(sv)} as a sample (s²). The mean is ${fmt(mean)}.`;
    else a = `They add up to ${fmt(sum)}.`;
    return {answer: a, list: xs};
  }

  /* ---------- percentages said in words ---------- */
  function percent(q, M){
    const s = low(q).replace(/(\d),(?=\d{3}\b)/g, "$1").replace(/\$/g, "").replace(/[?!]+\s*$/, ""), k = M || {}, prev = typeof k.value === "number" && isFinite(k.value) ? k.value : null;
    const money = v => (Math.round(v * 100) / 100).toFixed(2).replace(/\.00$/, "");
    let m;
    // the last answer carried on: "now decrease that by 15%", "then 8% tax on that?", "split the total 3 ways", "as a percent?"
    if (prev != null) {
      if ((m = /\b(increase|decrease|raise|reduce|lower|add|take|knock)\s*(?:that|it|this|the (?:total|result|answer|price))\s*(?:by|off)?\s*([\d.]+)\s*(?:%|percent)/.exec(s))) { const p = Number(m[2]), up = /increase|raise|add/.test(m[1]), v = prev * (1 + (up ? 1 : -1) * p / 100);
        return {answer: `${fmt(prev)} ${up ? "increased" : "decreased"} by ${fmt(p)}% = ${fmt(prev)} × ${fmt(1 + (up ? 1 : -1) * p / 100)} = ${fmt(v)}`, value: v}; }
      if ((m = /([\d.]+)\s*(?:%|percent)\s*(tax|tip|gratuity|vat|markup|off|discount)\s*(?:on|to|of|from|off)?\s*(?:that|it|this|the (?:total|price|bill))?\s*$/.exec(s)) && !/\d+\s*(?:dollars|bucks)\b|\bon\s+\d/.test(s.replace(m[0], ""))) { const p = Number(m[1]), off = /off|discount/.test(m[2]), v = prev * (1 + (off ? -1 : 1) * p / 100);
        return {answer: `With ${fmt(p)}% ${m[2]} ${off ? "off" : "added"}: $${money(prev)} × ${fmt(1 + (off ? -1 : 1) * p / 100)} = $${money(v)}.`, value: v}; }
      if ((m = /\bsplit\b[^\d]*?(\d+|two|three|four|five|six)\s*(?:ways|people|of us|friends)?/.exec(s))) { const n = NUMW[m[1]] || Number(m[1]); if (n > 0) return {answer: `$${money(prev)} ÷ ${n} = $${money(prev / n)} each.`, value: prev / n}; }
      if (/^\s*(?:and\s+|so\s+|now\s+)?(?:what(?:'s| is) (?:that|it) )?(?:as an? |in |to )?(percent(?:age)?|%)\s*$/.test(s)) return {answer: `${fmt(prev)} = ${fmt(prev * 100)}%`, value: prev * 100};
      if (/^\s*(?:and\s+|so\s+|now\s+)?(?:as an? |in |to )?decimal\s*$/.test(s)) return {answer: `${fmt(prev)}% = ${fmt(prev / 100)}`, value: prev / 100};
    }
    // "and from 65 back to 50?" after a percent change; "and 27 of 72?" after "what percent is 18 of 72"
    if (k.pchange && (m = /([\d.]+)\s*(?:back\s*)?(?:to|and)\s*([\d.]+)/.exec(s))) { const a = Number(m[1]), b = Number(m[2]), v = (b - a) / a * 100;
      return {answer: `From ${fmt(a)} to ${fmt(b)} is a ${fmt(Math.abs(v))}% ${v >= 0 ? "increase" : "decrease"}: (${fmt(b)} − ${fmt(a)}) ÷ ${fmt(a)} × 100 = ${fmt(v)}%.`, value: v, pchange: true}; }
    if (k.pctOf && (m = /^\s*(?:and\s+|what about\s+)?([\d.]+)\s*(?:of|out of|\/)\s*([\d.]+)\s*$/.exec(s))) { const v = Number(m[1]) / Number(m[2]) * 100; return {answer: `${fmt(Number(m[1]))} out of ${fmt(Number(m[2]))} is ${fmt(v)}% (${fmt(Number(m[1]))} ÷ ${fmt(Number(m[2]))} × 100).`, value: v, pctOf: true}; }
    // a price with a discount, a bill with a tip or tax
    if ((m = /\b([\d.]+)\b[^%]*?\b(?:and|with|at|is|,)?\s*([\d.]+)\s*%\s*(off|discount)/.exec(s)) && !/%\s*of\b/.test(s)) { const P = Number(m[1]), p = Number(m[2]), v = P * (1 - p / 100);
      return {answer: `The price is $${money(v)}: ${fmt(p)}% off $${money(P)} is $${money(P * p / 100)} off, so you pay ${fmt(100 - p)}% (${money(P)} × ${fmt(1 - p / 100)}).`, value: v}; }
    if ((m = /([\d.]+)\s*%\s*(tip|tax|gratuity|vat|markup)\s*(?:on|for|to|of)\s*(?:a\s+)?([\d.]+)/.exec(s))) { const p = Number(m[1]), P = Number(m[3]), t = P * p / 100;
      return {answer: `The ${m[2]} is $${money(t)} (${fmt(p)}% of $${money(P)}), so the total is $${money(P + t)}.`, value: P + t}; }
    if ((m = /(-?[\d.]+)\s*(?:%|percent)\s*of\s*(-?[\d.]+)/.exec(s))) { const v = Number(m[1]) / 100 * Number(m[2]); return {answer: `${fmt(Number(m[1]))}% of ${fmt(Number(m[2]))} = ${fmt(v)}`, value: v}; }
    if ((m = /\bwhat (?:percent(?:age)?|%) (?:is|of)\s*([\d.]+)\s*(?:is\s+)?(?:of|out of)\s*([\d.]+)/.exec(s)) || (m = /([\d.]+)\s*is what (?:percent|%)\s*of\s*([\d.]+)/.exec(s)) || (m = /\b([\d.]+)\s*(?:\/|out of)\s*([\d.]+)\b[^?]*\b(?:what )?(?:percent|%)/.exec(s)))
      { const v = Number(m[1]) / Number(m[2]) * 100; return {answer: `${fmt(Number(m[1]))} out of ${fmt(Number(m[2]))} is ${fmt(v)}% (${fmt(Number(m[1]))} ÷ ${fmt(Number(m[2]))} × 100).`, value: v, pctOf: true}; }
    if ((m = /percent(?:age)? (?:change|increase|decrease|difference) (?:from\s*)?([\d.]+)\s*(?:to|and)\s*([\d.]+)/.exec(s))) { const a = Number(m[1]), b = Number(m[2]), v = (b - a) / a * 100;
      return {answer: `From ${fmt(a)} to ${fmt(b)} is a ${fmt(Math.abs(v))}% ${v >= 0 ? "increase" : "decrease"}: (${fmt(b)} − ${fmt(a)}) ÷ ${fmt(a)} × 100 = ${fmt(v)}%.`, value: v, pchange: true}; }
    if ((m = /\b(increase|decrease|raise|reduce|lower)\s*([\d.]+)\s*by\s*([\d.]+)\s*(?:%|percent)/.exec(s))) { const a = Number(m[2]), p = Number(m[3]), up = /increase|raise/.test(m[1]), v = a * (1 + (up ? 1 : -1) * p / 100);
      return {answer: `${fmt(a)} ${up ? "increased" : "decreased"} by ${fmt(p)}% = ${fmt(a)} × ${fmt(1 + (up ? 1 : -1) * p / 100)} = ${fmt(v)}`, value: v}; }
    if ((m = /\b([\d.]+)\s*(?:\/|over)\s*([\d.]+)\s*(?:as an? |in )?(decimal|percent(?:age)?|%)/.exec(s))) { const v = Number(m[1]) / Number(m[2]);
      return /dec/.test(m[3]) ? {answer: `${m[1]}/${m[2]} = ${fmt(v)}`, value: v} : {answer: `${m[1]}/${m[2]} = ${fmt(v * 100)}%`, value: v * 100}; }
    return null;
  }

  /* ---------- one equation in x ---------- */
  function equation(q){
    // the equation itself, wherever it is in the words ("use it on x^2 + 2x - 8 = 0", "solve for x: 3x = 12")
    const eq = (low(q).replace(/[?.!]+\s*$/, "").match(/[-+*/^().\dx\s]*x[-+*/^().\dx\s]*=[-+*/^().\dx\s]+|[-+*/^().\dx\s]+=[-+*/^().\dx\s]*x[-+*/^().\dx\s]*/) || [])[0];
    const s = String(eq || "").trim();
    // "x = 85" is a value given (a z-score, a word problem), not an equation to solve
    if (/^x\s*=\s*-?[\d.]+$/.test(s) || /\b(mean|sd|standard deviation|z ?-?score|probability)\b/.test(low(q))) return null;
    if (!/\bx\b|\dx|x\^|x\)|\(x|x\//.test(s) || (s.match(/=/g) || []).length !== 1 || /\by\b/.test(s) || /[a-wyz]{2,}/.test(s)) return null;
    const [l, r] = s.split("="), f = x => evaluate(l, x) - evaluate(r, x);
    let f0, f1, f2, fm; try { f0 = f(0); f1 = f(1); f2 = f(2); fm = f(-1); } catch (e) { return null; }
    if (![f0, f1, f2, fm].every(isFinite)) return null;
    const a = (f1 + fm - 2 * f0) / 2, b = (f1 - fm) / 2, c = f0, cube = f(3) - (9 * a + 3 * b + c);
    if (Math.abs(cube) > 1e-9) return null;
    const show = s.replace(/\s*=\s*/, " = ");
    if (Math.abs(a) < 1e-12) { if (Math.abs(b) < 1e-12) return {answer: Math.abs(c) < 1e-12 ? `Every x works: both sides are always equal.` : `No x works: the sides can never be equal.`}; const x = -c / b, fr = fraction(`${-c}/${b}`);
      return {answer: `x = ${Number.isInteger(x) ? x : fr && Number.isInteger(-c) && Number.isInteger(b) ? `${fr[0]}/${fr[1]}, about ${fmt(x)}` : fmt(x)} (from ${show}).`, value: x}; }
    const D = b * b - 4 * a * c;
    if (D < -1e-12) return {answer: `${show} has no real solutions (the discriminant b² − 4ac = ${fmt(D)} is negative).`};
    const r1 = (-b + Math.sqrt(Math.max(0, D))) / (2 * a), r2 = (-b - Math.sqrt(Math.max(0, D))) / (2 * a), lo = Math.min(r1, r2), hi = Math.max(r1, r2);
    return {answer: Math.abs(D) < 1e-12 ? `x = ${fmt(r1)} (one repeated solution of ${show}).` : `x = ${fmt(lo)} or x = ${fmt(hi)} (the solutions of ${show}).`};
  }

  /* ---------- the rest that has one right method: shapes, number facts, counting, interest, lines, f(x), limits ---------- */
  const NGON = {triangle: 3, quadrilateral: 4, square: 4, rectangle: 4, pentagon: 5, hexagon: 6, heptagon: 7, septagon: 7, octagon: 8, nonagon: 9, decagon: 10, dodecagon: 12};
  const nums = s => (String(s).replace(/(\d),(?=\d{3}\b)/g, "$1").match(/-?\d+(?:\.\d+)?/g) || []).map(Number);
  const isPrime = n => { if (n < 2 || n !== Math.floor(n)) return false; for (let i = 2; i * i <= n; i++) if (n % i === 0) return false; return true; };
  const smallestFactor = n => { for (let i = 2; i * i <= n; i++) if (n % i === 0) return i; return n; };
  const choose = (n, k) => { let r = 1; for (let i = 1; i <= k; i++) r = r * (n - k + i) / i; return Math.round(r); };
  const sci = v => { if (!v) return "0"; const e = Math.floor(Math.log10(Math.abs(v))), m = Math.round(v / Math.pow(10, e) * 1e6) / 1e6; return `${m} × 10^${e}`; };
  function shapes(q, M){
    const s = low(q).replace(/(\d),(?=\d{3}\b)/g, "$1"), N = nums(s), k = M || {};
    let m;
    // right triangles
    if (/\bhypotenuse\b|\bpythag/.test(s) || (k.legs && /\blegs?\b/.test(s))) { if (N.length >= 2) { const [a, b] = N, c = Math.sqrt(a * a + b * b); return {answer: `The hypotenuse is ${fmt(c)}: √(${fmt(a)}² + ${fmt(b)}²) = √(${fmt(a * a)} + ${fmt(b * b)}) = √${fmt(a * a + b * b)} = ${fmt(c)}.`, value: c, legs: true}; } }
    // circles: radius or diameter, then area or circumference
    const circ = /\bcircle\b|\bradius\b|\bdiameter\b/.test(s) || (k.r != null && /\b(area|circumference|perimeter|diameter)\b/.test(s));
    if (circ) { let r = (m = /\bradius(?: of| is| =)?\s*(\d+(?:\.\d+)?)/.exec(s) || /(\d+(?:\.\d+)?)\s*(?:cm|m|in|ft|units?)?\s*radius/.exec(s)) ? Number(m[1]) : (m = /\bdiameter(?: of| is| =)?\s*(\d+(?:\.\d+)?)/.exec(s)) ? Number(m[1]) / 2 : N.length === 1 ? N[0] : k.r;
      if (r != null && isFinite(r)) { if (/\bcircumference|perimeter\b/.test(s)) { const v = 2 * Math.PI * r; return {answer: `The circumference is ${fmt(2 * r)}π, about ${fmt4(v)}: C = 2πr = 2 × π × ${fmt(r)}.`, value: v, r}; }
        if (/\barea\b/.test(s)) { const v = Math.PI * r * r; return {answer: `The area is ${fmt(r * r)}π, about ${fmt4(v)} square units: A = πr² = π × ${fmt(r)}².`, value: v, r}; } } }
    // cubes, boxes, rectangles, triangles
    if (/\bcube\b/.test(s) || (k.cube != null && /\b(volume|surface|area)\b/.test(s))) { const a = N.length ? N[0] : k.cube; if (a != null) {
      if (/\bsurface\b/.test(s)) return {answer: `The surface area is ${fmt(6 * a * a)} square units: 6 faces × ${fmt(a)}² = 6 × ${fmt(a * a)}.`, value: 6 * a * a, cube: a};
      if (/\bvolume\b/.test(s)) return {answer: `The volume is ${fmt(a ** 3)} cubic units: ${fmt(a)}³ = ${fmt(a)} × ${fmt(a)} × ${fmt(a)}.`, value: a ** 3, cube: a}; } }
    if (/\btriangle\b/.test(s) && /\barea\b/.test(s) && (m = /base\s*(?:of|=|is)?\s*(\d+(?:\.\d+)?)/.exec(s)) && /height|altitude/.test(s)) { const h = Number((/(?:height|altitude)\s*(?:of|=|is)?\s*(\d+(?:\.\d+)?)/.exec(s) || [])[1]), b = Number(m[1]);
      if (isFinite(h)) return {answer: `The area is ${fmt(b * h / 2)} square units: ½ × base × height = ½ × ${fmt(b)} × ${fmt(h)}.`, value: b * h / 2}; }
    if (/\b(rectangle|rectangular)\b/.test(s) && N.length >= 2) { const [a, b] = N;
      if (/\bperimeter\b/.test(s)) return {answer: `The perimeter is ${fmt(2 * (a + b))}: 2 × (${fmt(a)} + ${fmt(b)}).`, value: 2 * (a + b)};
      if (/\barea\b/.test(s)) return {answer: `The area is ${fmt(a * b)} square units: ${fmt(a)} × ${fmt(b)}.`, value: a * b}; }
    // the angles of a polygon
    { const nm = Object.keys(NGON).find(x => new RegExp(`\\b${x}s?\\b`).test(s)), n = nm ? NGON[nm] : (m = /\b(\d+)[- ]?(?:sided|sides|gon)\b/.exec(s)) ? Number(m[1]) : (k.ngon && /\b(each|one|regular|angle)\b/.test(s) ? k.ngon : 0);
      if (n >= 3 && /\bangles?\b/.test(s)) { const sum = (n - 2) * 180, name = nm || `${n}-sided shape`;
        if (/\b(each|one|regular|every)\b/.test(s) && !/\bsum\b/.test(s)) return {answer: `Each interior angle of a regular ${name} is ${fmt(sum / n)}°: the angles add up to (${n} − 2) × 180 = ${sum}°, shared equally by ${n} angles.`, value: sum / n, ngon: n};
        if (/\bexterior\b/.test(s)) return {answer: `The exterior angles of any convex polygon add up to 360°${n ? `, so each one of a regular ${name} is ${fmt(360 / n)}°` : ""}.`, value: 360 / n, ngon: n};
        return {answer: `The interior angles of a ${name} add up to ${sum}°: (n − 2) × 180 = (${n} − 2) × 180.`, value: sum, ngon: n}; } }
    return null;
  }
  function numberFacts(q, M){
    const s = low(q).replace(/(\d),(?=\d{3}\b)/g, "$1").replace(/[?!]+\s*$/, ""), N = nums(s), k = M || {};
    let m;
    // highest common factor and lowest common multiple (the same two numbers again: "LCM?")
    if (/\b(gcf|gcd|hcf|greatest common|highest common)\b/.test(s) || (/\b(lcm|least common|lowest common)\b/.test(s))) { const xs = N.length >= 2 ? N : k.pair; if (xs && xs.length >= 2 && xs.every(x => x === Math.floor(x) && x > 0)) {
      const g = xs.reduce(gcd), l = xs.reduce((a, b) => a * b / gcd(a, b));
      return /\b(lcm|least common|lowest common)\b/.test(s) ? {answer: `The LCM of ${xs.join(" and ")} is ${l}${xs.length === 2 ? `: ${xs[0]} × ${xs[1]} ÷ GCF ${gcd(xs[0], xs[1])} = ${l}` : ""}.`, value: l, pair: xs} : {answer: `The GCF of ${xs.join(" and ")} is ${g}.`, value: g, pair: xs}; } }
    // prime or not ("what about 97?" after one)
    if (/\bprimes?\b/.test(s) || (k.prime && N.length === 1)) { if (N.length === 1 && N[0] === Math.floor(N[0]) && /\bprime factori[sz]ation\b/.test(s)) { let n = N[0]; const f = []; while (n > 1) { const p = smallestFactor(n); f.push(p); n /= p; } return {answer: `${N[0]} = ${f.join(" × ")}.`}; }
      if (N.length === 1 && N[0] === Math.floor(N[0])) { const n = N[0]; if (isPrime(n)) return {answer: `Yes, ${n} is prime: nothing but 1 and ${n} divides it.`, prime: true}; const p = smallestFactor(n); return {answer: n < 2 ? `No, ${n} isn't prime (primes start at 2).` : `No, ${n} isn't prime: ${n} = ${p} × ${n / p}.`, prime: true}; } }
    // a fraction in lowest terms
    if ((m = /\b(?:simplify|reduce|lowest terms(?: of)?)\s*(\d+)\s*\/\s*(\d+)/.exec(s) || /(\d+)\s*\/\s*(\d+)\s*(?:in|to)\s*(?:its\s*)?(?:lowest|simplest)\s*(?:terms|form)/.exec(s))) { const a = Number(m[1]), b = Number(m[2]), g = gcd(a, b);
      return {answer: g > 1 ? `${a}/${b} = ${a / g}/${b / g} (divide the top and bottom by ${g}).` : `${a}/${b} is already in lowest terms.`, value: a / b}; }
    // scientific notation, and rounding
    if (/\bscientific notation\b|\bstandard form\b/.test(s) || (k.sci && N.length === 1)) { if (N.length === 1) { const v = N[0]; return {answer: `${fmt(v)} = ${sci(v)}.`, value: v, sci: true}; } }
    if ((m = /\bround\s*(-?\d+(?:\.\d+)?)\s*to\s*(?:the\s*nearest\s*)?(\d+|one|two|three|four|a)?\s*(decimal places?|dp|d\.p\.|places?|tenths?|hundredths?|thousandths?|whole number|integer)/.exec(s))) { const v = Number(m[1]), w = m[3];
      const d = /tenth/.test(w) ? 1 : /hundredth/.test(w) ? 2 : /thousandth/.test(w) ? 3 : /whole|integer/.test(w) ? 0 : ({one: 1, a: 1, two: 2, three: 3, four: 4}[m[2]] || Number(m[2]) || 0);
      const r = Math.round(v * 10 ** d) / 10 ** d; return {answer: `${m[1]} rounded to ${d ? d + " decimal place" + (d > 1 ? "s" : "") : "a whole number"} is ${r.toFixed(d)}.`, value: r}; }
    // counting: arrangements and choices
    if ((m = /\b(?:arrange|order|line up|permutations? of|ways to arrange|ways can i arrange)\D*(\d+)/.exec(s)) && !/\bchoose|pick|select|order doesn'?t matter\b/.test(s)) { const n = Number(m[1]); if (n <= 20) return {answer: `${fact(n)} ways: ${n}! = ${Array.from({length: n}, (_, i) => n - i).join(" × ")} = ${fact(n)}.`, value: fact(n)}; }
    if (/\b(choose|pick|select|combinations?|order doesn'?t matter)\b/.test(s) && N.length >= 2) { const [x, y] = N, n = Math.max(x, y), r = Math.min(x, y); const ordered = /\border (?:does )?matters?\b/.test(s) && !/doesn'?t/.test(s);
      if (n <= 60) return ordered ? {answer: `${fmt(fact(n) / fact(n - r))} ways (order matters): ${n}! ÷ (${n} − ${r})!.`} : {answer: `${choose(n, r)} ways: ${n} choose ${r} = ${n}! ÷ (${r}! × ${n - r}!) = ${choose(n, r)}.`, value: choose(n, r)}; }
    // money: compound and simple interest
    if (/\binterest\b/.test(s) && (m = /\$?\s*(\d+(?:\.\d+)?)\s*(?:dollars)?\s*(?:at|with)\s*(\d+(?:\.\d+)?)\s*%[^\d]*(\d+(?:\.\d+)?)\s*years?/.exec(s) || (k.money && /\b(simple|compound)\b/.test(s) ? [0, ...k.money] : null))) {
      const P = Number(m[1]), r = Number(m[2]) / 100, n = Number(m[3]);
      if (/\bsimple\b/.test(s)) { const I = P * r * n; return {answer: `Simple interest: $${fmt(I)} (${fmt(P)} × ${fmt(r)} × ${fmt(n)}), so $${fmt(P + I)} in all after ${fmt(n)} years.`, value: P + I, money: [P, r * 100, n]}; }
      const t = /\bmonthly\b/.test(s) ? 12 : /\bquarterly\b/.test(s) ? 4 : /\bdaily\b/.test(s) ? 365 : 1, A = P * Math.pow(1 + r / t, t * n);
      return {answer: `After ${fmt(n)} years you'd have $${(Math.round(A * 100) / 100).toFixed(2)}, so $${(Math.round((A - P) * 100) / 100).toFixed(2)} of interest: A = P(1 + r${t > 1 ? "/" + t : ""})^${t > 1 ? t + "×" : ""}${fmt(n)} = ${fmt(P)} × ${fmt(1 + r / t)}^${fmt(t * n)}.`, value: A, money: [P, r * 100, n]}; }
    // a line through two points: its slope, then its equation
    { const pts = [...s.matchAll(/\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\)/g)].map(x => [Number(x[1]), Number(x[2])]), P = pts.length >= 2 ? pts : k.pts;
      if (P && P.length >= 2 && /\b(slope|gradient|line|equation|rise|y ?=)\b/.test(s)) { const [[x1, y1], [x2, y2]] = P;
        if (x1 === x2) return {answer: `That's a vertical line, x = ${fmt(x1)}: its slope is undefined.`, pts: P};
        const sl = (y2 - y1) / (x2 - x1), b = y1 - sl * x1, eq = `y = ${sl === 1 ? "" : sl === -1 ? "-" : fmt(sl)}x${b ? (b > 0 ? " + " : " − ") + fmt(Math.abs(b)) : ""}`;
        if (/\b(equation|y ?=|line through)\b/.test(s)) return {answer: `${eq}: the slope is ${fmt(sl)}, and putting (${fmt(x1)}, ${fmt(y1)}) in gives b = ${fmt(y1)} − ${fmt(sl)} × ${fmt(x1)} = ${fmt(b)}.`, value: sl, pts: P};
        return {answer: `The slope is ${fmt(sl)}: (${fmt(y2)} − ${fmt(y1)}) ÷ (${fmt(x2)} − ${fmt(x1)}) = ${fmt(y2 - y1)} ÷ ${fmt(x2 - x1)}.`, value: sl, pts: P}; } }
    // a z-score: how many standard deviations from the mean
    if (/\bz ?-?scores?\b/.test(s)) { const xv = (/\bx\s*(?:=|is|of)?\s*(-?\d+(?:\.\d+)?)/.exec(s) || /\b(?:score|value)\s*(?:of|=|is)?\s*(-?\d+(?:\.\d+)?)/.exec(s) || [])[1], mu = (/\b(?:mean|average|μ|mu)\s*(?:=|is|of)?\s*(-?\d+(?:\.\d+)?)/.exec(s) || [])[1], sd = (/\b(?:sd|s\.d\.|standard deviation|std|σ|sigma)\s*(?:=|is|of)?\s*(\d+(?:\.\d+)?)/.exec(s) || [])[1];
      if (xv != null && mu != null && sd != null && Number(sd)) { const z = (Number(xv) - Number(mu)) / Number(sd); return {answer: `z = ${fmt(z)}: (${xv} − ${mu}) ÷ ${sd}. That's ${fmt(Math.abs(z))} standard deviation${Math.abs(z) === 1 ? "" : "s"} ${z >= 0 ? "above" : "below"} the mean.`, value: z}; } }
    // f(x) = ... then f(3), f(-3)
    { const def = /\bf\s*\(\s*x\s*\)\s*=\s*([^,;?]+?)(?=\s*(?:,|;|\bwhat|\bwhats|\bfind|\band\b|$))/.exec(s), fx = def ? def[1].trim() : k.fx, at = /\bf\s*\(\s*(-?\d+(?:\.\d+)?)\s*\)/.exec(s);
      if (fx && at) { try { const x = Number(at[1]), v = evaluate(fx, x); if (isFinite(v)) return {answer: `f(${fmt(x)}) = ${fmt(v)}: put ${fmt(x)} in for x in ${fx}.`, value: v, fx}; } catch (e) {} } }
    // a limit, worked out from both sides
    if ((m = /\blimit (?:of\s*)?(.+?)\s*as\s*x\s*(?:->|→|approaches|goes to|tends to)\s*(-?\d+(?:\.\d+)?)/.exec(s))) { try { const f = m[1].replace(/\s+/g, ""), a = Number(m[2]), h = 1e-6, L1 = evaluate(f, a - h), L2 = evaluate(f, a + h);
      if (isFinite(L1) && isFinite(L2) && Math.abs(L1 - L2) < 1e-3) { const L = Math.round((L1 + L2) / 2 * 1e4) / 1e4; let direct = NaN; try { direct = evaluate(f, a); } catch (e) {}
        return {answer: `The limit is ${fmt(L)}.${!isFinite(direct) ? ` Putting x = ${fmt(a)} straight in gives 0/0, so simplify first (factor and cancel), then put x = ${fmt(a)} in.` : ""}`, value: L}; } } catch (e) {} }
    return null;
  }

  /* ---------- is it maths? ---------- */
  const KEYW = /\b(solve|simplify|factori[sz]e|factor|expand|sqrt|square root|cube root|squared|cubed|factorial|log|ln|logarithm|derivative|differentiate|integral|integrate|antiderivative|limit|slope|gradient|hypotenuse|pythag\w*|circumference|area of|volume of|surface area|perimeter|interior angles?|exterior angles?|mean of|median|mode of|range of|average of|avg|standard deviation|std dev|variance|z ?-?score|probability|chance of|odds of|permutations?|combinations?|how many ways|gcf|gcd|hcf|lcm|greatest common|least common|lowest common|prime|scientific notation|decimal places?|significant figures|sig figs|round(ed)? \d|as a (decimal|percent|fraction)|percent(age)? (change|increase|decrease|of)|what percent|% (of|off|tip|tax)|interest|compound|f\(x\)|quadratic|equation of|weighted|drip rate|gtt|mg\/kg|ml\/hr|ml\/h|flow rate|dosage|dose|tablets?|tabs)\b/i;
  const OPS = /\d\s*([-+*/x×÷^%!]|\bto the\b|\btimes\b|\bdivided by\b|\bplus\b|\bminus\b|\bover\b|\bcubed\b|\bsquared\b)\s*\(?-?\d?/i;
  const UNITQ = new RegExp(`\\d\\s*(${UN})\\.?\\s+(to|in|into|as)\\s+(${UN})\\b|\\bhow many\\s+(${UN})\\s+(are\\s+)?(in|per)\\b|\\bconvert\\b`, "i");
  // word problems: numbers and a "how much / how far / how long / what's the price"
  const WORDP = /\b(how (far|long|much|many|fast)|what('?s| is) the (price|cost|total|speed|rate|answer)|per (hour|day|minute)|mph|km\/h|cost|costs|\$\d|each|split|tip|tax|discount|off)\b/i;
  const MINE = /\b(my|i'?m|i have|i've)\b[^?]*\b(tasks?|due|deadlines?|assignments?|grades?|gpa|marks?|courses?|classes?|exams?|schedule|calendar|notes?|decks?|cards?)\b|\b(due|deadline|overdue)\b/i;
  function isMath(q){
    const s = String(q || "");
    if (s.length > 300) return false;
    if (HOWMANY_RE.test(low(s))) return true;
    if (!/\d|\b(sqrt|derivative|integral|quadratic formula|prime|factorial|limit|interior angles?|exterior angles?|pythagorean theorem|area of a|volume of a)\b/i.test(s)) return false;
    if (MINE.test(s) && !/\b(what percent|percent of|\d\s*[-+*/x×÷^]\s*\d|weighted)\b/i.test(s)) return false;
    return OPS.test(s) || KEYW.test(s) || UNITQ.test(s) || (/\d/.test(s) && WORDP.test(s) && (s.match(/\d+(\.\d+)?/g) || []).length >= 2);
  }
  // a short follow-up to the last sum: "what about 200?", "and in 0.75 L?", "why?", "show the steps", "yards?", "in a week?"
  const FOLLOW = /^\s*(and|so|ok(ay)?|now|then|what about|how about|but|wait|what if|why|how|show|explain|in|as|with|using|use|is|whats|what'?s|what does|what do|does|do|can you|could you|check|prove|same|again|round|simplify|lcm|gcf|yards?|feet|inches|cm|mm|meters?|grams?|kg|mg|mcg|ml|liters?|cups?|quarts?|pints?|gallons?|seconds?|minutes?|hours?|days?|weeks?|percent|%|median|mode|range|mean|average|variance|standard|circumference|area|volume|perimeter|surface|derivative|integral|f\(|the (median|mode|range|mean|equation|formula|steps|answer|difference|integral|derivative)|split|tax|tip|that|it|this|\d|-\d)\b/i;
  function isFollow(q, last){
    if (!last || !last.math) return false;
    const s = String(q || "").trim(); if (!s || s.split(/\s+/).length > 16) return false;
    if (/^\s*(thanks|thank you|thx|ty|ok(ay)?\s*(thanks|cool|got it)?|cool|nice|great|got it|perfect|awesome|bye|lol)\s*[.!]*$/i.test(s)) return false;
    if (/^\s*(add|create|delete|remove|move|mark|start|stop|open|go to|take me|remind|schedule|rename)\b/i.test(s)) return false;
    // their planner, the app, or a subject ("what does my most recent announcement say", "what's due friday", "what is osmosis")
    if (!/\d/.test(s) && (/\b(announcements?|due|deadlines?|tasks?|decks?|cards?|notes?|grades?|marks?|class(es)?|courses?|themes?|exams?|quiz(zes)?|essay|lab|homework|schedule|calendar|timer|board|my)\b/i.test(s) || (/^\s*(what|who|where|when)\s+(is|are|was|were)\s+(?!that\b|it\b|this\b|the (answer|formula|difference|median|mode|range|mean|integral|derivative|slope|equation)\b)/i.test(s)))) return false;
    return FOLLOW.test(s) || /\?\s*$/.test(s) || /\d/.test(s) || /\b(need|would|if|instead|overall|each|total|steps?|formula|check)\b/i.test(s);
  }

  // what the last sum was about, for a follow-up worked out in code
  function carry(q, last){
    const M = last && last.math; if (!M) return null;
    const s = low(q).replace(/[?!.]+$/, "").trim();
    // the same conversion with a new amount, a new unit, or both: "what about 10k?", "and in 0.75 L?", "what about 200?", "yards?", "in a week?"
    if (M.conv) { const {n, a, b, howMany} = M.conv;
      // "and mL in a tbsp?", "how many mcg in a mg": a new pair of units
      const pair = new RegExp(`^(?:and\\s+|what about\\s+|how about\\s+|so\\s+)?(?:how many\\s+)?(${UN})\\s+(?:are\\s+)?(?:in|per)\\s+(?:a\\s+|an\\s+|one\\s+|(\\d+(?:\\.\\d+)?)\\s*)?(${UN})$`, "i").exec(s);
      if (pair) { const to = fixU(pair[1]), fr = fixU(pair[3]); if (to && fr && U[to].dim === U[fr].dim) return convAnswer(pair[2] ? Number(pair[2]) : 1, fr, to, true); }
      // "yards?" (the answer in another unit), "in a week?" (the same question for another unit)
      const only = new RegExp(`^(?:and\\s+|what about\\s+|how about\\s+|so\\s+)?(in\\s+|per\\s+|to\\s+|into\\s+)?(?:a\\s+|an\\s+|one\\s+)?(${UN})\\s*$`, "i").exec(s);
      if (only) { const u = fixU(only[2]); if (u && U[u].dim === U[a].dim) return howMany && /^(in|per)/.test(only[1] || "") ? convAnswer(1, u, b, true) : convAnswer(n, a, u, howMany); }
      // "what about 10k?", "and in 0.75 L?", "what about 200?"
      const nm = /(-?\d[\d,]*\.?\d*)\s*(k\b|[a-z/°]+(?: [a-z]+)?)?/.exec(s.replace(/,(?=\d{3})/g, ""));
      if (nm) { let k = Number(nm[1]), u = nm[2] ? nm[2].trim() : "";
        if (u === "k") { if (U[a].name === "km") u = "km"; else { u = ""; k *= 1000; } }
        const uu = fixU(u) || fixU(u.split(" ")[0]) || "";
        if (uu && U[uu].dim === U[a].dim) return convAnswer(k, uu, uu === b ? a : b, howMany);
        if (!uu) return convAnswer(k, a, b, howMany); }
      if (/\b(formula|how|why|steps|work)\b/.test(s) && U[a].dim === "temp") { const f = TEMPF[tempName(a) + "->" + tempName(b)]; return {answer: `${f}. So ${fmt(n)}° ${tempName(a)} → ${fmt(convert(n, a, b))}° ${tempName(b)}.`}; }
    }
    // the same numbers, another measure: "what's the median?", "and the range?"
    if (M.list && STAT.test(s)) return stats(s, M.list);
    return null;
  }

  function solve(q, last){
    const t = String(q || "").trim(), M = last && last.math && isFollow(t, last) ? last.math : null;
    if (M) { const c = carry(t, last); if (c) return c; }
    return units(t) || percent(t, M) || stats(t) || numberFacts(t, M) || shapes(t, M) || equation(t) || arithmetic(t) || null;
  }

  /* ---------- the AI for the rest: it writes the working, the app does the arithmetic ---------- */
  const SYS = `You are a careful maths tutor inside a student's study app. Answer the student's maths question.
Never work out a number in your head: write EVERY calculation as an expression inside double square brackets, like [[40*0.75]] or [[(98.6-32)*5/9]], and the app replaces it with its exact value. Inside the brackets use only numbers, + - * / ^ ( ), sqrt(), ln(), log10(), pi and n! (no units, no words, no x). Use ( ) inside, never [ ]. Write each calculation once: "180 ÷ 4 = [[180/4]]", never "[[180/4]] = [[180/4]]".
First work out exactly what is being asked and which numbers you're given, then set up the calculation from those.
Start with the answer in one sentence. Then give short numbered steps when there's working to show, or when they ask for steps, the formula, why or how. Keep it short and clear; no markdown headings.
For algebra or calculus (derivatives, integrals, factoring, limits, equations of lines), write the result in plain text like 3x^2 + 2, and still put any number you work out in brackets.
If the last exchange is given, the question may follow on from it ("what about 200?", "why?", "show the steps", "then 8% tax on that?"): use its numbers.
If it isn't a maths question or can't be answered from what's given, say so in one sentence.`;
  const SYS_SMALL = `
Examples:
Q: if a shirt is $40 and 25% off whats the price
A: The price is $[[40*(1-0.25)]].
1. 25% off means you pay 75%: 40 × 0.75 = [[40*0.75]].
Q: (after "a shirt is $40 and 25% off" = $30) then 8% tax on that?
A: With 8% tax it's $[[30*1.08]].
1. Tax adds 8%: 30 × 1.08 = [[30*1.08]].
Q: kid weighs 44 lb, dose is 10 mg/kg, how much
A: The dose is [[44/2.2046*10]] mg.
1. Pounds to kilograms: 44 ÷ 2.2046 = [[44/2.2046]] kg.
2. Times the dose: [[44/2.2046]] × 10 = [[44/2.2046*10]] mg.
Q: derivative of x^3
A: The derivative of x^3 is 3x^2 (power rule: bring the 3 down, take 1 off the power).
Q: (after "solve 2x+3=11" = x = 4) show the steps
A: x = 4.
1. Subtract 3 from both sides: 2x = [[11-3]].
2. Divide both sides by 2: x = [[8/2]].`;
  const MSCHEMA = {type: "OBJECT", properties: {answer: {type: "STRING", description: "The full reply, with every calculation as [[expression]]"}}, required: ["answer"]};
  // each [[expression]] becomes its value (a model that nests brackets, "[[1/6]*[1/6]]" or "[[120+60]/2]]", means parentheses)
  const fill = a => {
    let bad = 0, out = "", s = String(a || ""), i = 0;
    const calc = (e, money) => { try { const v = evaluate(e.replace(/,(?=\d{3})/g, "").replace(/\$/g, "")); if (!isFinite(v)) throw 0; return money ? (Math.round(v * 100) / 100).toLocaleString("en-US", {minimumFractionDigits: 2, maximumFractionDigits: 2}) : fmt(v); } catch (x) { bad++; return e.replace(/[()]/g, ""); } };
    // from each "[[" to where its brackets balance, every [ ] read as ( )
    while (i < s.length) {
      const j = s.indexOf("[[", i); if (j < 0) { out += s.slice(i); break; }
      out += s.slice(i, j); let d = 0, k = j;
      for (; k < s.length; k++) { if (s[k] === "[") d++; else if (s[k] === "]") { d--; if (!d) break; } }
      const body = s.slice(j, Math.min(k + 1, s.length)).replace(/\[/g, "(").replace(/\]/g, ")") + ")".repeat(Math.max(0, d));
      out += calc(body, /\$\s*$/.test(out)); i = k + 1; while (s[i] === "]") i++;
    }
    // "3 = 3 = 3", "90 = 90 miles": a value said twice once filled in
    out = out.replace(/(-?\$?[\d,]*\.?\d+)(?:\s*=\s*\1)+(?!\d|\.\d)/g, "$1").replace(/(\d)\$(?=[\s.,]|$)/g, "$1").replace(/\$\s+(?=\d)/g, "$");
    return {text: out, bad};
  };
  async function ask(q, last, o){
    o = o || {};
    const small = typeof DEVAI !== "undefined" && typeof aiOnDevice === "function" && aiOnDevice() && DEVAI.kind !== "litert";
    const prev = last && last.q ? `The last exchange: the student asked "${String(last.q).slice(0, 200)}" and you answered "${String(last.answer || "").replace(/\s+/g, " ").slice(0, 400)}".\n\n` : "";
    const hint = o.hint ? `Worked out exactly by the app (use these numbers): ${o.hint}\n\n` : "";
    const r = await aiCall({task: "chat", maxTokens: 600, temperature: 0, schema: MSCHEMA, system: SYS + (small ? SYS_SMALL : ""), onPartial: o.onPartial, parts: [{text: `${prev}${hint}The question: ${q}`}]});
    const d = (r && r.data) || {}; if (!d.answer || String(d.answer).trim().length < 2) return null;
    return fill(d.answer).text.trim();
  }
  return {solve, isMath, isFollow, ask, fill, evaluate, fraction, units, percent, stats, equation, arithmetic, convert};
})();
