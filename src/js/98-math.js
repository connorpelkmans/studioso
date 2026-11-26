/* ===== module: 98-math.js: maths questions worked out exactly, with follow-ups ===== */
/* The chat sends every message here first. A maths question is answered by the app itself (never a guess from the web or
   the model): sums in symbols or words, percentages, discounts, tax and tips, fractions, powers and roots, statistics,
   unit conversions, speed and distance, linear and quadratic equations, geometry, lines through two points, primes, GCF
   and LCM, factorials and rounding. Each answer carries a small record (math) so a follow-up works from it:
   "divide that by 3", "as a percent", "what's the median?", "circumference?", "what about 200?", "in a week?",
   "now what if it's 3x instead?", "show your work", "how do I check that?", "why aren't those the same?".
   window.SBMATH = {solve(q), follow(q, prev), mathy(q)}. */
(function(){
  const R = v => Math.round(v * 1e10) / 1e10;
  const F = (v, d) => { if (!isFinite(v)) return String(v); const r = d != null ? Math.round(v * 10 ** d) / 10 ** d : R(v); return r.toLocaleString("en-US", {maximumFractionDigits: d != null ? d : 10}); };
  const F4 = v => Number.isInteger(R(v)) ? F(v) : F(v, 4).replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
  // a close fraction for a decimal (small denominators only): 0.5833333 -> 7/12
  const frac = v => { if (!isFinite(v) || Number.isInteger(R(v))) return null; for (let d = 2; d <= 1000; d++) { const n = Math.round(v * d); if (Math.abs(n / d - v) < 1e-9) { const g = gcd(n, d); return [n / g, d / g]; } } return null; };
  const fracStr = v => { const f = frac(v); return f ? `${f[0]}/${f[1]}` : null; };
  const nums = s => (String(s).replace(/(\d),(?=\d{3}\b)/g, "$1").match(/-?\d*\.?\d+/g) || []).map(Number);
  const low = s => String(s || "").toLowerCase().replace(/[’‘`´]/g, "'").replace(/[“”]/g, '"').replace(/(\d),(?=\d{3}\b)/g, "$1").replace(/\?+\s*$/, "").replace(/(\D)!+\s*$/, "$1").replace(/\?+\s*$/, "").replace(/(\D)\.\s*$/, "$1")
    .replace(/(?:\s+|^)(?:again|lol|lmao|haha|pls|please|plz|real quick|rn|thanks|thx|ty|tho|though|exactly)\s*$/g, "").replace(/(?:\s+|^)(?:again|lol|lmao|haha|pls|please|plz|real quick|rn|thanks|thx)\s*$/g, "").replace(/\?+\s*$/, "").trim();
  const LEAD = /^(?:(?:hey|ok|okay|so|um|uh|and|now|then|also|quick question|q|what about|how about)\b[,:]?\s*)*(?:(?:can|could) (?:you|u) (?:tell me |help me |please )?|please |pls |what(?:'s| is| are)|whats|wats|calculate|compute|work out|figure out|find|evaluate|how much is|how much's|tell me|give me|i need)?\s*/;

  // + - * / ^ ! and brackets, sqrt(), worked out here (no eval: the app's security policy blocks it, rightly)
  function calc(src){
    const t = String(src).replace(/\s+/g, ""); let i = 0;
    const num = () => { const m = /^\d+(\.\d+)?|^\.\d+/.exec(t.slice(i)); if (!m) throw 0; i += m[0].length; return Number(m[0]); };
    const fact = n => { if (n < 0 || n > 170 || !Number.isInteger(n)) throw 0; let r = 1; for (let k = 2; k <= n; k++) r *= k; return r; };
    const atom = () => {
      if (t[i] === "-") { i++; return -pow(); } if (t[i] === "+") { i++; return pow(); }
      if (t.startsWith("sqrt", i)) { i += 4; return Math.sqrt(atom()); } if (t.startsWith("cbrt", i)) { i += 4; return Math.cbrt(atom()); } if (t[i] === "√") { i++; return Math.sqrt(atom()); }
      if (t.startsWith("pi", i)) { i += 2; return Math.PI; } if (t[i] === "π") { i++; return Math.PI; }
      if (t[i] === "(") { i++; const v = sum(); if (t[i] !== ")") throw 0; i++; return v; }
      return num();
    };
    const post = () => { let v = atom(); while (t[i] === "!" || t[i] === "%" || t[i] === "²" || t[i] === "³") { const o = t[i++]; v = o === "!" ? fact(v) : o === "%" ? v / 100 : o === "²" ? v * v : v * v * v; } return v; };
    const pow = () => { const b = post(); if (t[i] === "^") { i++; return Math.pow(b, t[i] === "-" ? (i++, -pow()) : pow()); } return b; };
    // 2(3+4) and (1+2)(3+4): multiplying without a sign
    const prod = () => { let v = pow(); for (;;) { if (t[i] === "*" || t[i] === "/") { const o = t[i++], r = pow(); v = o === "*" ? v * r : v / r; } else if (t[i] === "(" || t[i] === "√" || t.startsWith("sqrt", i) || t.startsWith("pi", i) || t[i] === "π") v *= pow(); else return v; } };
    const sum = () => { let v = prod(); while (t[i] === "+" || t[i] === "-") { const o = t[i++], r = prod(); v = o === "+" ? v + r : v - r; } return v; };
    const v = sum(); if (i !== t.length) throw 0; return v;
  }
  // words to symbols: "12 times 13", "8 divided by 2", "2 to the power of 10", "3 to the 4th", "5 squared", "square root of 144"
  const ORD = {second: 2, third: 3, fourth: 4, fifth: 5, sixth: 6, seventh: 7, eighth: 8, ninth: 9, tenth: 10};
  const WORDN = {zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90, hundred: 100};
  function symbols(s){
    let e = " " + s + " ";
    e = e.replace(/\b(zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred)\b/g, w => WORDN[w]);
    e = e.replace(/\b(?:the\s+)?(?:square\s*root|sqrt|root)\s*(?:of\s*)?(\d*\.?\d+)/g, "sqrt($1)").replace(/\b(?:the\s+)?cube\s*root\s*(?:of\s*)?(\d*\.?\d+)/g, "cbrt($1)")
      .replace(/\bto\s+the\s+(?:power\s+of\s+)?(\d+)(?:st|nd|rd|th)?(?:\s+power)?\b/g, "^$1").replace(/\bto\s+the\s+(second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth)(?:\s+power)?\b/g, (x, w) => "^" + ORD[w])
      .replace(/\b(?:raised\s+)?to\s+the\s+power\s+of\b/g, "^").replace(/\bpower\s+of\b/g, "^").replace(/\bsquared\b/g, "^2").replace(/\bcubed\b/g, "^3")
      .replace(/\b(\d+)\s*factorial\b/g, "$1!").replace(/\bfactorial\s+(?:of\s+)?(\d+)/g, "$1!")
      .replace(/\b(?:multiplied\s+by|times|x)\b/g, "*").replace(/\b(?:divided\s+by|over)\b/g, "/").replace(/\bplus\b|\band\b(?=\s*[\d(])/g, "+").replace(/\bminus\b|\btake away\b/g, "-")
      .replace(/(\d)\s*[x×]\s*(?=[\d(])/g, "$1*").replace(/[×]/g, "*").replace(/[÷]/g, "/").replace(/[−–]/g, "-").replace(/\bpi\b/g, "pi");
    return e.trim();
  }
  const show = e => e.replace(/\s+/g, " ").replace(/\*/g, "×").replace(/sqrt\(([^)]*)\)/g, "√$1").replace(/cbrt\(([^)]*)\)/g, "∛$1").trim();
  const out = (answer, math) => ({answer, math});
  const NV = v => frac(v) && String(F(v)).length > 6 ? fracStr(v) : F(v);
  const eq = (left, v) => frac(v) && String(F(v)).length > 6 ? `${left} = ${fracStr(v)} (about ${F(v, 4)})` : `${left} = ${F(v)}`;

  // ---------- units ----------
  const U = {};
  const unit = (dim, f, ...names) => { const sing = names.find((n, i) => i && n.length > 2 && !/s$/.test(n) && !/ per |\//.test(n)) || names[0]; names.forEach(n => U[n] = {dim, f, name: names[0], sing}); };
  unit("len", 0.001, "mm", "millimeter", "millimeters", "millimetre", "millimetres"); unit("len", 0.01, "cm", "centimeter", "centimeters", "centimetre", "centimetres");
  unit("len", 1, "m", "meter", "meters", "metre", "metres"); unit("len", 1000, "km", "kilometer", "kilometers", "kilometre", "kilometres", "k", "kms");
  unit("len", 0.0254, "in", "inch", "inches"); unit("len", 0.3048, "ft", "foot", "feet"); unit("len", 0.9144, "yd", "yard", "yards"); unit("len", 1609.344, "mi", "mile", "miles");
  unit("mass", 1e-6, "mg", "milligram", "milligrams", "mgs"); unit("mass", 1e-9, "mcg", "microgram", "micrograms", "µg"); unit("mass", 0.001, "g", "gram", "grams", "gm", "gms");
  unit("mass", 1, "kg", "kilogram", "kilograms", "kilo", "kilos", "kgs"); unit("mass", 0.028349523125, "oz", "ounce", "ounces"); unit("mass", 0.45359237, "lb", "lbs", "pound", "pounds"); unit("mass", 6.35029318, "st", "stone", "stones");
  unit("vol", 0.001, "ml", "milliliter", "milliliters", "millilitre", "millilitres", "mls", "cc", "cm3"); unit("vol", 1, "l", "liter", "liters", "litre", "litres");
  unit("vol", 0.00492892159375, "tsp", "teaspoon", "teaspoons"); unit("vol", 0.01478676478125, "tbsp", "tablespoon", "tablespoons"); unit("vol", 0.0295735295625, "fl oz", "fluid ounce", "fluid ounces", "floz");
  unit("vol", 0.2365882365, "cup", "cups"); unit("vol", 0.473176473, "pint", "pints", "pt"); unit("vol", 0.946352946, "quart", "quarts", "qt"); unit("vol", 3.785411784, "gallon", "gallons", "gal");
  unit("time", 0.001, "ms", "millisecond", "milliseconds"); unit("time", 1, "s", "sec", "secs", "second", "seconds"); unit("time", 60, "min", "mins", "minute", "minutes");
  unit("time", 3600, "h", "hr", "hrs", "hour", "hours"); unit("time", 86400, "day", "days"); unit("time", 604800, "week", "weeks", "wk", "wks"); unit("time", 2629746, "month", "months"); unit("time", 31556952, "year", "years", "yr", "yrs");
  unit("area", 1, "m2", "square meter", "square meters", "sq m", "square metre", "square metres"); unit("area", 0.09290304, "ft2", "square foot", "square feet", "sq ft"); unit("area", 4046.8564224, "acre", "acres"); unit("area", 10000, "hectare", "hectares", "ha"); unit("area", 2589988.110336, "square mile", "square miles", "sq mi");
  unit("speed", 0.44704, "mph", "miles per hour", "mi/h"); unit("speed", 1 / 3.6, "km/h", "kph", "kmh", "kilometers per hour", "kilometres per hour", "km per hour"); unit("speed", 1, "m/s", "meters per second", "metres per second");
  unit("data", 1, "byte", "bytes"); unit("data", 0.125, "bit", "bits"); unit("data", 1e3, "kb", "kilobyte", "kilobytes"); unit("data", 1e6, "mb", "megabyte", "megabytes"); unit("data", 1e9, "gb", "gigabyte", "gigabytes"); unit("data", 1e12, "tb", "terabyte", "terabytes");
  const TEMP = {c: "C", "°c": "C", celsius: "C", centigrade: "C", f: "F", "°f": "F", fahrenheit: "F", k: "K", kelvin: "K", kelvins: "K", "degrees c": "C", "degrees f": "F", "degrees celsius": "C", "degrees fahrenheit": "F"};
  const UNAMES = Object.keys(U).concat(Object.keys(TEMP)).sort((a, b) => b.length - a.length).map(x => x.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&")).join("|");
  const UN = `(?:${UNAMES})`;
  const NICE = {len: {mm: "mm", cm: "cm", m: "m", km: "km", in: "inches", ft: "feet", yd: "yards", mi: "miles"}, mass: {mg: "mg", mcg: "mcg", g: "g", kg: "kg", oz: "oz", lb: "lb", st: "stone"}, vol: {ml: "mL", l: "L", tsp: "tsp", tbsp: "tbsp", "fl oz": "fl oz", cup: "cups", pint: "pints", quart: "quarts", gallon: "gallons"}, time: {ms: "milliseconds", s: "seconds", min: "minutes", h: "hours", day: "days", week: "weeks", month: "months", year: "years"}, speed: {mph: "mph", "km/h": "km/h", "m/s": "m/s"}, area: {m2: "m²", ft2: "ft²", ha: "hectares", "square mile": "square miles"}, data: {byte: "bytes", bit: "bits", kb: "KB", mb: "MB", gb: "GB", tb: "TB"}};
  const uname = u => (NICE[u.dim] && NICE[u.dim][u.name]) || (u.name.length > 2 && !/s$/.test(u.name) ? u.name + "s" : u.name);
  const tconv = (v, a, b) => { const c = a === "C" ? v : a === "F" ? (v - 32) * 5 / 9 : v - 273.15; return b === "C" ? c : b === "F" ? c * 9 / 5 + 32 : c + 273.15; };
  const TFORM = {CF: "°F = °C × 9/5 + 32", FC: "°C = (°F − 32) × 5/9", CK: "K = °C + 273.15", KC: "°C = K − 273.15", FK: "K = (°F − 32) × 5/9 + 273.15", KF: "°F = (K − 273.15) × 9/5 + 32"};
  function convert(v, from, to, how){
    from = from.trim(); to = to.trim();
    if (TEMP[from] && TEMP[to]) { const a = TEMP[from], b = TEMP[to]; if (a === b) return null; const r = tconv(v, a, b);
      return out(`${F(v)}${a === "K" ? " K" : "°" + a} = ${F(r, 2)}${b === "K" ? " K" : "°" + b}`, {kind: "unit", v, from, to, how, value: r, formula: TFORM[a + b]}); }
    const a = U[from], b = U[to]; if (!a || !b || a.dim !== b.dim || a === b) return null;
    const r = v * a.f / b.f;
    const txt = how === "many" ? `There ${r === 1 ? "is" : "are"} ${F4(r)} ${r === 1 ? b.sing : uname(b)} in ${v === 1 ? (/^[aeiou]/.test(a.sing) ? "an " : "a ") + a.sing : F(v) + " " + uname(a)}.` : `${F(v)} ${uname(a)} = ${F4(r)} ${uname(b)}`;
    return out(txt, {kind: "unit", v, from, to, how, value: r, factor: a.f / b.f});
  }
  function units(s){
    let m;
    // how many ml in 2.5 L / how many seconds in a day / how many feet are in a mile
    if ((m = new RegExp(`^how many (${UN}) (?:are |is )?(?:there )?in (?:(?:a|an|one)\\s+|(-?\\d*\\.?\\d+)\\s*)?(${UN})$`).exec(s))) return convert(m[2] ? Number(m[2]) : 1, m[3], m[1], "many");
    // convert 5 km to miles / 150 lbs to kg / 98.6 F in celsius / 5'10 to cm
    if ((m = /^(?:convert\s+)?(\d+)\s*(?:'|ft|feet|foot)\s*(\d+(?:\.\d+)?)\s*(?:"|in|inches)?\s+(?:to|in|into)\s+(cm|m|centimeters|meters|centimetres|metres)$/.exec(s))) return convert(Number(m[1]) * 12 + Number(m[2]), "in", m[3], "convert");
    if ((m = new RegExp(`^(?:convert\\s+|change\\s+)?(-?\\d*\\.?\\d+)\\s*(?:°\\s*|degrees?\\s+)?(${UN})\\s+(?:to|in|into|as|=|in to)\\s+(?:°\\s*|degrees?\\s+)?(${UN})$`).exec(s))) return convert(Number(m[1]), m[2], m[3], "convert");
    if ((m = new RegExp(`^(-?\\d*\\.?\\d+)\\s*(?:°\\s*|degrees?\\s+)?(${UN}) (?:is|equals|is how many|in) (?:how many\\s+)?(${UN})$`).exec(s))) return convert(Number(m[1]), m[2], m[3], "convert");
    if ((m = new RegExp(`^(${UN}) (?:are |is )?in (?:(?:a|an|one)\\s+|(-?\\d*\\.?\\d+)\\s*)(${UN})$`).exec(s))) return convert(m[2] ? Number(m[2]) : 1, m[3], m[1], "many");
    if ((m = new RegExp(`\\b(?:how (?:tall|long|far|heavy|much|big|hot|cold|warm)|what) (?:is|are|would be|'s) (-?\\d*\\.?\\d+)\\s*(?:°\\s*|degrees?\\s+)?(${UN}) (?:in|to|into) (?:°\\s*|degrees?\\s+)?(${UN})$`).exec(s))) return convert(Number(m[1]), m[2], m[3], "convert");
    return null;
  }

  // ---------- statistics ----------
  const STATW = /\b(mean|average|avg|median|mode|range|standard deviation|std ?dev|sd|variance|sum|total|minimum|maximum|smallest|largest|biggest|lowest|highest)\b/;
  function statOf(w, xs){
    const n = xs.length, sum = xs.reduce((a, b) => a + b, 0), mean = sum / n, srt = [...xs].sort((a, b) => a - b);
    const med = n % 2 ? srt[(n - 1) / 2] : (srt[n / 2 - 1] + srt[n / 2]) / 2;
    const L = xs.join(", ");
    if (/mean|average|avg/.test(w)) return [`The mean of ${L} is ${F4(mean)}`, mean, `Add them up: ${xs.join(" + ")} = ${F(sum)}. Then divide by how many there are (${n}): ${F(sum)} ÷ ${n} = ${F4(mean)}.`];
    if (/median/.test(w)) return [`The median of ${L} is ${F4(med)}`, med, `Put them in order: ${srt.join(", ")}. ${n % 2 ? `The middle one (number ${(n + 1) / 2} of ${n}) is ${F(med)}.` : `With ${n} numbers there are two in the middle, ${srt[n / 2 - 1]} and ${srt[n / 2]}, so the median is halfway between them: ${F4(med)}.`}`];
    if (/mode/.test(w)) { const c = {}; xs.forEach(x => c[x] = (c[x] || 0) + 1); const top = Math.max(...Object.values(c)); const ms = Object.keys(c).filter(k => c[k] === top).map(Number);
      if (top === 1) return [`${L} has no mode: every number appears once`, null, "The mode is the number that appears most often. Here each appears exactly once, so there isn't one."];
      return [`The mode of ${L} is ${ms.join(" and ")} (it appears ${top} times)`, ms.length === 1 ? ms[0] : null, `Count how often each number appears: ${Object.keys(c).map(k => `${k} appears ${c[k]}×`).join(", ")}. The most frequent is the mode.`]; }
    if (/range/.test(w)) return [`The range of ${L} is ${F(srt[n - 1] - srt[0])} (${srt[n - 1]} − ${srt[0]})`, srt[n - 1] - srt[0], `Largest minus smallest: ${srt[n - 1]} − ${srt[0]} = ${F(srt[n - 1] - srt[0])}.`];
    if (/standard deviation|std ?dev|\bsd\b|variance/.test(w)) {
      const ss = xs.reduce((a, x) => a + (x - mean) ** 2, 0), vp = ss / n, vs = n > 1 ? ss / (n - 1) : NaN;
      const how = `Mean = ${F4(mean)}. Squared distances from the mean add up to ${F4(ss)}. Population: divide by n (${n}) to get variance ${F4(vp)}, then take the square root. Sample: divide by n − 1 (${n - 1}) to get ${F4(vs)}, then the square root.`;
      if (/variance/.test(w)) return [`The variance of ${L} is ${F4(vp)} (population) or ${F4(vs)} (sample)`, vp, how];
      return [`The standard deviation of ${L} is ${F4(Math.sqrt(vp))} (population) or ${F4(Math.sqrt(vs))} (sample)`, Math.sqrt(vp), how];
    }
    if (/sum|total/.test(w)) return [`The sum of ${L} is ${F(sum)}`, sum, `${xs.join(" + ")} = ${F(sum)}.`];
    if (/min|smallest|lowest/.test(w)) return [`The smallest of ${L} is ${srt[0]}`, srt[0], `In order: ${srt.join(", ")}.`];
    if (/max|largest|biggest|highest/.test(w)) return [`The largest of ${L} is ${srt[n - 1]}`, srt[n - 1], `In order: ${srt.join(", ")}.`];
    return null;
  }
  function stats(s){
    const m = STATW.exec(s); if (!m) return null;
    const list = s.replace(/\(\s*\d+\s*,\s*\d+\s*\)/g, " "); const xs = nums(list.slice(m.index));
    // a list of numbers (at least 3, or 2 joined by a comma or "and"): "mean of 4, 8, 15", "average of 80 90 and 70"
    if (xs.length < 2 || !/\d\s*(,|and|\s)\s*-?\d/.test(list) || /\b(my|grade|grades|class|course|mark|marks|score in)\b/.test(s)) return null;
    const r = statOf(m[1], xs); if (!r) return null;
    return out(r[0] + ".", {kind: "stats", xs, stat: m[1], value: r[1], steps: r[2]});
  }

  // ---------- equations in one letter, up to x² ----------
  function poly(side, v){
    const t = side.replace(/\s+/g, "").replace(/²/g, "^2").replace(/\*/g, "").replace(/[−–]/g, "-");
    if (!new RegExp(`^[-+\\d.${v}^/()]+$`).test(t)) return null;
    const terms = []; let depth = 0, cur = "";
    for (const ch of t) { if ((ch === "+" || ch === "-") && depth === 0 && cur && !/[\^/(]$/.test(cur)) { terms.push(cur); cur = ch; } else { cur += ch; if (ch === "(") depth++; if (ch === ")") depth--; } }
    if (depth) return null; if (cur) terms.push(cur);
    const c = [0, 0, 0];
    for (const term of terms) {
      let m = /^([+-]?)(\d*\.?\d*)\((.+)\)(?:\/(\d*\.?\d+))?$/.exec(term);
      if (m) { const inner = poly(m[3], v); if (!inner) return null; let k = m[2] === "" || m[2] === "." ? 1 : Number(m[2]); if (m[1] === "-") k = -k; if (m[4]) k /= Number(m[4]); inner.forEach((x, i) => c[i] += k * x); continue; }
      m = new RegExp(`^([+-]?)(\\d*\\.?\\d*)(?:/(\\d*\\.?\\d+))?(${v}(?:\\^([12]))?)?(?:/(\\d*\\.?\\d+))?$`).exec(term);
      if (!m || (!m[2] && !m[4])) return null;
      let k = m[2] === "" || m[2] === "." ? 1 : Number(m[2]); if (m[3]) k /= Number(m[3]); if (m[6]) k /= Number(m[6]); if (m[1] === "-") k = -k;
      c[m[4] ? Number(m[5] || 1) : 0] += k;
    }
    return c;
  }
  const signed = (k, first) => k < 0 ? (first ? "−" : " − ") + F4(-k) : (first ? "" : " + ") + F4(k);
  const term = (k, p, v, first) => k === 0 ? "" : (k < 0 ? (first ? "−" : " − ") : (first ? "" : " + ")) + (Math.abs(k) === 1 && p ? "" : F4(Math.abs(k))) + (p === 2 ? v + "²" : p === 1 ? v : "");
  function equation(s0){
    const s = s0.replace(/^(?:(?:use (?:it|that|the (?:quadratic )?formula) on|solve|find|for|now|then|and|what about)\b[\s:,]*)+(?=.*=)/, "solve ");
    let m = /^(?:solve(?:\s+for\s+([a-z]))?\s*:?\s*|what(?:'s| is) ([a-z]) (?:if|when|in)\s+|find ([a-z]) (?:if|when|in)\s+|if\s+)?([-+\d.a-z^²\s*/()]+)=([-+\d.a-z^²\s*/()]+?)(?:,?\s*(?:what(?:'s| is)|find|solve for)\s+([a-z]))?$/.exec(s);
    if (!m) return null;
    const vars = (m[4] + m[5]).replace(/sqrt|pi/g, "").match(/[a-z]/g); if (!vars) return null;
    const v = m[1] || m[2] || m[3] || m[6] || vars[0]; if (new Set(vars).size !== 1 || vars[0] !== v) return null;
    const L = poly(m[4], v), Rr = poly(m[5], v); if (!L || !Rr) return null;
    const c = [L[0] - Rr[0], L[1] - Rr[1], L[2] - Rr[2]];
    const src = `${m[4].trim()} = ${m[5].trim()}`.replace(/\s+/g, " ").replace(/\^2/g, "²");
    if (c[2] === 0) {
      if (c[1] === 0) return out(c[0] === 0 ? `${src} is true for every ${v}.` : `${src} has no solution.`, {kind: "eq", src, v, c, sols: []});
      const x = -c[0] / c[1];
      const steps = [`Start with ${src}.`];
      if (L[2] === 0 && Rr[1] === 0 && L[1] !== 0) {
        if (L[0]) steps.push(`${L[0] > 0 ? "Subtract" : "Add"} ${F4(Math.abs(L[0]))} ${L[0] > 0 ? "from" : "to"} both sides: ${term(L[1], 1, v, true)} = ${F4(Rr[0] - L[0])}.`);
        if (L[1] !== 1) steps.push(`Divide both sides by ${F4(L[1])}: ${v} = ${F4(Rr[0] - L[0])} ÷ ${F4(L[1])} = ${F4(x)}.`);
      } else steps.push(`Move the ${v} terms to one side and the numbers to the other: ${term(c[1], 1, v, true)} = ${F4(-c[0])}.`, `Divide by ${F4(c[1])}: ${v} = ${F4(x)}.`);
      return out(`${v} = ${F4(x)}${fracStr(x) ? ` (${fracStr(x)})` : ""}`, {kind: "eq", src, v, c, sols: [x], value: x, steps: steps.join("\n")});
    }
    const [cc, b, a] = c, D = b * b - 4 * a * cc, std = `${term(a, 2, v, true)}${term(b, 1, v)}${cc ? signed(cc) : ""} = 0`;
    const steps = [`Written as a${v}² + b${v} + c = 0: ${std}, so a = ${F4(a)}, b = ${F4(b)}, c = ${F4(cc)}.`, `The discriminant b² − 4ac = ${F4(b * b)} − ${F4(4 * a * cc)} = ${F4(D)}.`];
    if (D < 0) { steps.push("It's negative, so there are no real solutions."); return out(`${std} has no real solutions (the discriminant is ${F4(D)}).`, {kind: "eq", src, v, c, sols: [], steps: steps.join("\n")}); }
    const r1 = (-b - Math.sqrt(D)) / (2 * a), r2 = (-b + Math.sqrt(D)) / (2 * a), sols = D === 0 ? [r1] : [r1, r2].sort((p, q) => p - q);
    steps.push(`${v} = (−b ± √${F4(D)}) / 2a = (${F4(-b)} ± ${F4(Math.sqrt(D))}) / ${F4(2 * a)}.`);
    if (sols.every(x => Number.isInteger(R(x))) && a === 1) steps.push(`It also factors: (${v}${signed(-sols[0])})(${v}${signed(-(sols[1] != null ? sols[1] : sols[0]))}) = 0.`);
    return out(D === 0 ? `${v} = ${F4(r1)} (one repeated solution)` : `${v} = ${F4(sols[0])} or ${v} = ${F4(sols[1])}`, {kind: "eq", src, v, c, sols, value: sols[0], steps: steps.join("\n")});
  }

  // ---------- geometry ----------
  const SHAPE = {
    circle: (d, w) => { const r = d.r != null ? d.r : d.d / 2; if (!(r > 0)) return null;
      if (/circumference|perimeter|around/.test(w)) return [`The circumference is 2πr = 2 × π × ${F4(r)} ≈ ${F(2 * Math.PI * r, 2)}`, 2 * Math.PI * r];
      if (/\barea\b/.test(w)) return [`The area is πr² = π × ${F4(r)}² ≈ ${F(Math.PI * r * r, 2)}`, Math.PI * r * r];
      if (/diameter/.test(w)) return [`The diameter is 2r = ${F4(2 * r)}`, 2 * r]; if (/radius/.test(w)) return [`The radius is ${F4(r)}`, r];
      return [`The area is πr² = π × ${F4(r)}² ≈ ${F(Math.PI * r * r, 2)}`, Math.PI * r * r]; },
    rect: (d, w) => { const {l, w: wd} = d; if (!(l > 0 && wd > 0)) return null;
      if (/perimeter|around/.test(w)) return [`The perimeter is 2 × (${F4(l)} + ${F4(wd)}) = ${F4(2 * (l + wd))}`, 2 * (l + wd)];
      if (/diagonal/.test(w)) return [`The diagonal is √(${F4(l)}² + ${F4(wd)}²) ≈ ${F(Math.hypot(l, wd), 2)}`, Math.hypot(l, wd)];
      return [`The area is ${F4(l)} × ${F4(wd)} = ${F4(l * wd)}`, l * wd]; },
    square: (d, w) => SHAPE.rect({l: d.s, w: d.s}, w),
    tri: (d, w) => { if (!(d.b > 0 && d.h > 0)) return null; return [`The area is ½ × base × height = ½ × ${F4(d.b)} × ${F4(d.h)} = ${F4(d.b * d.h / 2)}`, d.b * d.h / 2]; },
    right: (d, w) => { if (d.a > 0 && d.b > 0) { const h = Math.hypot(d.a, d.b);
        if (/area/.test(w)) return [`The area is ½ × ${F4(d.a)} × ${F4(d.b)} = ${F4(d.a * d.b / 2)}`, d.a * d.b / 2];
        return [`The hypotenuse is √(${F4(d.a)}² + ${F4(d.b)}²) = √${F4(d.a * d.a + d.b * d.b)} = ${F4(h)}`, h]; }
      if (d.c > 0 && d.a > 0 && d.c > d.a) { const o = Math.sqrt(d.c * d.c - d.a * d.a); return [`The other leg is √(${F4(d.c)}² − ${F4(d.a)}²) = √${F4(d.c * d.c - d.a * d.a)} = ${F4(o)}`, o]; }
      return null; },
    sphere: (d, w) => { const r = d.r != null ? d.r : d.d / 2; if (!(r > 0)) return null;
      if (/surface|area/.test(w)) return [`The surface area is 4πr² = 4 × π × ${F4(r)}² ≈ ${F(4 * Math.PI * r * r, 2)}`, 4 * Math.PI * r * r];
      return [`The volume is (4/3)πr³ = (4/3) × π × ${F4(r)}³ ≈ ${F(4 / 3 * Math.PI * r ** 3, 2)}`, 4 / 3 * Math.PI * r ** 3]; },
    cyl: (d, w) => { const r = d.r != null ? d.r : d.d / 2; if (!(r > 0 && d.h > 0)) return null;
      if (/surface|area/.test(w)) return [`The surface area is 2πr² + 2πrh ≈ ${F(2 * Math.PI * r * r + 2 * Math.PI * r * d.h, 2)}`, 2 * Math.PI * r * r + 2 * Math.PI * r * d.h];
      return [`The volume is πr²h = π × ${F4(r)}² × ${F4(d.h)} ≈ ${F(Math.PI * r * r * d.h, 2)}`, Math.PI * r * r * d.h]; },
    cube: (d, w) => { if (!(d.s > 0)) return null; if (/surface|area/.test(w)) return [`The surface area is 6 × ${F4(d.s)}² = ${F4(6 * d.s * d.s)}`, 6 * d.s * d.s]; return [`The volume is ${F4(d.s)}³ = ${F4(d.s ** 3)}`, d.s ** 3]; },
  };
  const val = (s, re) => { const m = re.exec(s); return m ? Number(m[1]) : null; };
  function geometry(s){
    const W = s; let shape = null, d = {};
    const r = val(s, /\b(?:radius|r)\s*(?:of|is|=|:)?\s*(\d*\.?\d+)/) ?? val(s, /(\d*\.?\d+)\s*(?:\w+\s+)?radius/), dia = val(s, /\b(?:diameter|d)\s*(?:of|is|=|:)?\s*(\d*\.?\d+)/) ?? val(s, /(\d*\.?\d+)\s*(?:\w+\s+)?diameter/);
    if (/\bhypotenuse\b|\bpythag/.test(s) || /\bright triangle\b/.test(s) || /\blegs?\b/.test(s) && /\btriangle|hypotenuse|legs (?:are|of)\b/.test(s)) {
      const xs = nums(s); const hyp = val(s, /hypotenuse\s*(?:of|is|=)?\s*(\d*\.?\d+)/);
      if (hyp != null && /\bleg\b|other side|missing side|other leg/.test(s)) { const o = xs.filter(x => x !== hyp); if (o.length) { shape = "right"; d = {c: hyp, a: o[0]}; } }
      else if (xs.length >= 2) { shape = "right"; d = {a: xs[0], b: xs[1]}; }
    }
    else if (/\bsphere|ball\b/.test(s) && (r != null || dia != null)) { shape = "sphere"; d = r != null ? {r} : {d: dia}; }
    else if (/\bcylinder\b/.test(s) && (r != null || dia != null)) { shape = "cyl"; d = Object.assign(r != null ? {r} : {d: dia}, {h: val(s, /height\s*(?:of|is|=)?\s*(\d*\.?\d+)/) ?? val(s, /(\d*\.?\d+)\s*(?:\w+\s+)?(?:tall|high)/)}); }
    else if (/\bcircle\b|\bcircumference\b/.test(s) && (r != null || dia != null)) { shape = "circle"; d = r != null ? {r} : {d: dia}; }
    else if (/\bcube\b/.test(s) && /\b(volume|surface)\b/.test(s)) { const x = nums(s); if (x.length === 1) { shape = "cube"; d = {s: x[0]}; } }
    else if (/\bsquare\b/.test(s) && !/\bsquare (?:root|feet|foot|meters?|metres?|miles?)\b/.test(s)) { const x = nums(s); if (x.length === 1 && /\b(area|perimeter|diagonal)\b/.test(s)) { shape = "square"; d = {s: x[0]}; } }
    else if (/\brectangle\b/.test(s) && /\b(area|perimeter|diagonal)\b/.test(s)) { const x = nums(s); if (x.length === 2) { shape = "rect"; d = {l: x[0], w: x[1]}; } }
    else if (/\btriangle\b/.test(s) && /\barea\b/.test(s)) { const b = val(s, /base\s*(?:of|is|=)?\s*(\d*\.?\d+)/), h = val(s, /height\s*(?:of|is|=)?\s*(\d*\.?\d+)/); const x = nums(s); if (b != null && h != null) { shape = "tri"; d = {b, h}; } else if (x.length === 2) { shape = "tri"; d = {b: x[0], h: x[1]}; } }
    else if (/\b(\d*\.?\d+)\s*(?:by|x|×)\s*(\d*\.?\d+)\b/.test(s) && /\b(area|perimeter)\b/.test(s)) { const x = nums(s); shape = "rect"; d = {l: x[0], w: x[1]}; }
    if (!shape) return null;
    const res = SHAPE[shape](d, W); if (!res) return null;
    return out(res[0] + ".", {kind: "geo", shape, d, value: res[1], ask: W});
  }

  // ---------- lines through two points ----------
  function points(s){
    const ps = [...s.matchAll(/\(\s*(-?\d*\.?\d+)\s*,\s*(-?\d*\.?\d+)\s*\)/g)].map(m => [Number(m[1]), Number(m[2])]); if (ps.length !== 2) return null;
    return lineAns(s, ps);
  }
  function lineAns(s, ps){
    const [[x1, y1], [x2, y2]] = ps, dx = x2 - x1, dy = y2 - y1, P = `(${x1}, ${y1}) and (${x2}, ${y2})`;
    const base = {kind: "line", ps};
    if (/\bmidpoint|middle\b/.test(s)) { const mx = (x1 + x2) / 2, my = (y1 + y2) / 2; return out(`The midpoint of ${P} is (${F4(mx)}, ${F4(my)}).`, Object.assign(base, {steps: `Average the x's and the y's: ((${x1} + ${x2}) / 2, (${y1} + ${y2}) / 2) = (${F4(mx)}, ${F4(my)}).`})); }
    if (/\bdistance|how far|length\b/.test(s)) { const dd = Math.hypot(dx, dy); return out(`The distance between ${P} is √(${F4(dx)}² + ${F4(dy)}²) = √${F4(dx * dx + dy * dy)} ≈ ${F4(dd)}.`, Object.assign(base, {value: dd})); }
    if (dx === 0) return out(`The line through ${P} is vertical (x = ${x1}), so its slope is undefined.`, base);
    const m = dy / dx, b = y1 - m * x1, mS = fracStr(m) || F4(m);
    if (/\b(equation|formula|y ?=|line)\b/.test(s) && !/\bslope\b/.test(s) || /\bequation\b/.test(s)) return out(`The line through ${P} is y = ${mS === "1" ? "" : mS === "-1" ? "−" : mS}x${b ? signed(b) : ""}.`, Object.assign(base, {value: m, steps: `Slope m = (${y2} − ${y1}) / (${x2} − ${x1}) = ${F4(dy)} / ${F4(dx)} = ${mS}. Then b = y − mx using (${x1}, ${y1}): ${y1} − ${mS} × ${x1} = ${F4(b)}. So y = ${mS}x${b ? signed(b) : ""}.`}));
    return out(`The slope between ${P} is (${y2} − ${y1}) / (${x2} − ${x1}) = ${F4(dy)} / ${F4(dx)} = ${mS}.`, Object.assign(base, {value: m, steps: `Slope is rise over run: change in y (${F4(dy)}) divided by change in x (${F4(dx)}).`}));
  }

  // ---------- percentages, money, rates ----------
  function percent(s){
    let m;
    const P = "(-?\\d*\\.?\\d+)\\s*(?:%|percent|per cent)", N = "\\$?\\s*(-?\\d*\\.?\\d+)";
    // 15% of 80
    if ((m = new RegExp(`^${P} of ${N}$`).exec(s))) { const v = Number(m[1]) / 100 * Number(m[2]); return out(`${F(Number(m[1]))}% of ${F(Number(m[2]))} = ${F(v)}`, {kind: "num", expr: `${m[1]}% of ${m[2]}`, value: v, steps: `${m[1]}% means ${m[1]} out of 100, so ${m[1]} ÷ 100 × ${m[2]} = ${F(v)}.`}); }
    // 12 is what percent of 80 / what percent of 80 is 12 / 12 out of 80 as a percent
    if ((m = new RegExp(`^(?:what|which) (?:percent|percentage|%) is ${N} (?:of|out of) ${N}$`).exec(s)) || (m = new RegExp(`^${N} (?:is )?(?:what|which) (?:percent|percentage|%) of ${N}$`).exec(s)) || (m = new RegExp(`^${N} (?:out of|of|/) ${N} (?:as a |in |as )?(?:percent|percentage|%)$`).exec(s)) || (m = new RegExp(`^(?:what|which) (?:percent|percentage|%) of ${N} is ${N}$`).exec(s)) && (m = [m[0], m[2], m[1]])) {
      const v = Number(m[1]) / Number(m[2]) * 100; return out(`${F(Number(m[1]))} is ${F(v, 2)}% of ${F(Number(m[2]))}`, {kind: "num", value: v, steps: `Divide the part by the whole and multiply by 100: ${m[1]} ÷ ${m[2]} × 100 = ${F(v, 2)}%.`});
    }
    // percent change / increase / decrease from 50 to 65
    if ((m = new RegExp(`^(?:the )?(?:percent(?:age)?|%) (change|increase|decrease|difference) (?:from|between) ${N} (?:to|and) ${N}$`).exec(s)) || (m = new RegExp(`^(?:by )?(?:what|how much) (?:percent|%) (?:is |did it |does it )?(?:go|change|increase|decrease)?\\s*(?:from )?${N} to ${N}$`).exec(s)) && (m = [m[0], "change", m[1], m[2]])) {
      const a = Number(m[2]), b = Number(m[3]); if (!a) return null; const v = (b - a) / a * 100;
      return out(`From ${F(a)} to ${F(b)} is ${v >= 0 ? "an increase" : "a decrease"} of ${F(Math.abs(v), 2)}%.`, {kind: "pctchg", a, b, value: v, steps: `Change ÷ starting value × 100: (${F(b)} − ${F(a)}) ÷ ${F(a)} × 100 = ${F(v, 2)}%.`});
    }
    // $40 with 25% off / 25% off 40 / 40 minus 25%
    // ("15% off a $48 jacket": the price may follow "a", "the", "my"...; and a price is a whole number of its own, never the "1" of
    // "15%", which made it "$1 with 5% off")
    if ((m = new RegExp(`(?:^|\\b)${P} off(?: of)?(?: (?:a|an|the|my|this|that))? ${N}`).exec(s)) || (m = new RegExp(`(?<![\\d.])${N}(?![\\d.])[^%\\d]{0,40}?${P} off|(?<![\\d.])${N} (?:minus|less|discounted by|with a discount of) ${P}`).exec(s)) && (m = m[1] != null ? [m[0], m[2], m[1]] : [m[0], m[4], m[3]])) {
      const p = Number(m[1]), price = Number(m[2]), v = price * (1 - p / 100);
      return out(`$${F(price, 2)} with ${F(p)}% off is $${F(v, 2)} (you save $${F(price - v, 2)}).`, {kind: "money", value: v, steps: `${F(p)}% of $${F(price, 2)} is $${F(price * p / 100, 2)}; $${F(price, 2)} − $${F(price * p / 100, 2)} = $${F(v, 2)}.`});
    }
    // 8% tax on 37.50 / 15% tip on $60 / increase 50 by 20%
    if ((m = new RegExp(`^${P} (tax|sales tax|tip|gratuity|markup|interest|vat|hst|gst) on ${N}$`).exec(s)) || (m = new RegExp(`^(?:a )?(tip|tax) of ${P} on ${N}$`).exec(s)) && (m = [m[0], m[2], m[1], m[3]])) {
      const p = Number(m[1]), base = Number(m[3]), add = base * p / 100;
      return out(`${F(p)}% ${m[2]} on $${F(base, 2)} is $${F(add, 2)}, so $${F(base + add, 2)} in total.`, {kind: "money", value: base + add, steps: `$${F(base, 2)} × ${F(p)}% = $${F(add, 2)}; $${F(base, 2)} + $${F(add, 2)} = $${F(base + add, 2)}.`});
    }
    if ((m = new RegExp(`^(increase|raise|decrease|reduce|lower) ${N} by ${P}$`).exec(s))) { const up = /increase|raise/.test(m[1]), a = Number(m[2]), p = Number(m[3]), v = a * (1 + (up ? 1 : -1) * p / 100);
      return out(`${F(a)} ${up ? "increased" : "decreased"} by ${F(p)}% is ${F(v)}.`, {kind: "num", value: v, steps: `${F(p)}% of ${F(a)} is ${F(a * p / 100)}; ${F(a)} ${up ? "+" : "−"} ${F(a * p / 100)} = ${F(v)}.`}); }
    // simple and compound interest: $1000 at 5% for 3 years
    if ((m = new RegExp(`^(?:(compound|simple) )?interest (?:on |for )?${N} at ${P}(?: a year| per year| annually| yearly)? for (\\d+) years?(?: compounded (?:annually|yearly))?$`).exec(s))) return interest(Number(m[2]), Number(m[3]) / 100, Number(m[4]), m[1] !== "simple");
    return null;
  }
  function rate(s){
    const sp = /(\d*\.?\d+)\s*(mph|miles per hour|km\/h|kph|kmh|kilometers per hour|kilometres per hour|m\/s|meters per second)/.exec(s);
    const tm = /(\d*\.?\d+)\s*(hours?|hrs?|h|minutes?|mins?)\b/.exec(s);
    const ds = /(\d*\.?\d+)\s*(miles?|mi|km|kilometers?|kilometres?|meters?|metres?)\b(?!\s*(?:per|an|a)\s+hour|\/h)/.exec(s);
    if (!/\b(how far|how long|distance|time|speed|how fast|take|travel|go|drive|walk|run|ride|average speed)\b/.test(s)) return null;
    const unitOf = u => /^mi|mph|miles/.test(u) ? "miles" : /^k/.test(u) ? "km" : "meters";
    const hrs = tm ? Number(tm[1]) / (/^m/.test(tm[2]) ? 60 : 1) : null;
    const dsA = [...s.matchAll(/(\d*\.?\d+)\s*(miles?|mi|km|kilometers?|kilometres?)\b(?!\s*(?:per|an|a)\s+hour|\/h)/g)], tmA = [...s.matchAll(/(\d*\.?\d+)\s*(hours?|hrs?|h|minutes?|mins?)\b/g)];
    if (!sp && dsA.length >= 2 && dsA.length === tmA.length) { const D = dsA.reduce((a, x) => a + Number(x[1]), 0), H = tmA.reduce((a, x) => a + Number(x[1]) / (/^m/.test(x[2]) ? 60 : 1), 0), u = unitOf(dsA[0][2]), v = D / H;
      return out(`Your average speed is ${F4(v)} ${u === "miles" ? "mph" : "km/h"}: ${F(D)} ${u} in ${F(H)} hours.`, {kind: "rate2", legs: dsA.map((x, i) => [Number(x[1]), Number(tmA[i][1]) / (/^m/.test(tmA[i][2]) ? 60 : 1)]), u, value: v, steps: `Average speed is total distance ÷ total time: ${dsA.map(x => x[1]).join(" + ")} = ${F(D)} ${u}, ${tmA.map(x => x[1]).join(" + ")} = ${F(H)} hours, ${F(D)} ÷ ${F(H)} = ${F4(v)}.`}); }
    if (sp && tm && (/how far|distance/.test(s) || !ds)) { const v = Number(sp[1]) * hrs, u = unitOf(sp[2]);
      return out(`At ${sp[1]} ${sp[2]} for ${F(hrs)} hour${hrs === 1 ? "" : "s"}, you'd go ${F4(v)} ${u}.`, {kind: "rate", speed: Number(sp[1]), sunit: sp[2], u, value: v, steps: `Distance = speed × time = ${sp[1]} × ${F(hrs)} = ${F4(v)} ${u}.`}); }
    if (sp && ds) { const t = Number(ds[1]) / Number(sp[1]), u = unitOf(sp[2]);
      return out(`${ds[1]} ${u} at ${sp[1]} ${sp[2]} takes ${hm(t)}.`, {kind: "rate", speed: Number(sp[1]), sunit: sp[2], u, value: t, steps: `Time = distance ÷ speed = ${ds[1]} ÷ ${sp[1]} = ${F4(t)} hours.`}); }
    if (ds && tm) { const v = Number(ds[1]) / hrs, u = unitOf(ds[2]);
      return out(`${ds[1]} ${u} in ${F(hrs)} hour${hrs === 1 ? "" : "s"} is an average speed of ${F4(v)} ${u === "miles" ? "mph" : u === "km" ? "km/h" : "m/h"}.`, {kind: "rate", speed: v, sunit: u === "miles" ? "mph" : "km/h", u, value: v, steps: `Speed = distance ÷ time = ${ds[1]} ÷ ${F(hrs)} = ${F4(v)}.`}); }
    return null;
  }
  const hm = t => { const h = Math.floor(t + 1e-9), mn = Math.round((t - h) * 60); return h && mn ? `${h} hour${h === 1 ? "" : "s"} ${mn} minute${mn === 1 ? "" : "s"} (${F4(t)} hours)` : h ? `${h} hour${h === 1 ? "" : "s"}` : `${mn} minute${mn === 1 ? "" : "s"}`; };

  // ---------- whole numbers and fractions ----------
  function numbers(s){
    let m;
    if ((m = /^is (\d+) (?:a )?prime(?: number)?$/.exec(s)) || (m = /^(?:is )?(\d+) (?:a )?prime(?: number)?$/.exec(s))) { const n = Number(m[1]); let f = 0; if (n > 1) for (let k = 2; k * k <= n; k++) if (n % k === 0) { f = k; break; }
      return out(n < 2 ? `No, ${n} isn't prime (primes start at 2).` : f ? `No, ${n} isn't prime: it's ${f} × ${n / f}.` : `Yes, ${n} is prime.`, {kind: "num", value: n}); }
    if ((m = /^(?:the )?(?:prime )?factors? of (\d+)$|^(?:prime )?factori[sz]e (\d+)$/.exec(s))) { let n = Number(m[1] || m[2]); const f = []; for (let k = 2; k * k <= n; k++) while (n % k === 0) { f.push(k); n /= k; } if (n > 1) f.push(n);
      return out(`${m[1] || m[2]} = ${f.join(" × ")}`, {kind: "num", value: Number(m[1] || m[2])}); }
    if ((m = /^(?:the )?(gcf|gcd|hcf|greatest common (?:factor|divisor)|highest common factor|lcm|least common multiple|lowest common multiple|lcd|least common denominator) (?:of )?([\d\s,and]+)$/.exec(s))) {
      const xs = nums(m[2]); if (xs.length < 2) return null; const g = xs.reduce(gcd), l = xs.reduce((a, b) => a * b / gcd(a, b));
      return /^(gcf|gcd|hcf|greatest|highest)/.test(m[1]) ? out(`The greatest common factor of ${xs.join(", ")} is ${g}.`, {kind: "num", value: g, xs}) : out(`The least common multiple of ${xs.join(", ")} is ${l}.`, {kind: "num", value: l, xs});
    }
    if ((m = /^(?:simplify|reduce) (?:the fraction )?(-?\d+)\s*\/\s*(\d+)$|^(-?\d+)\s*\/\s*(\d+) (?:simplified|in simplest form|in lowest terms|reduced)$/.exec(s))) {
      const a = Number(m[1] || m[3]), b = Number(m[2] || m[4]); if (!b) return null; const g = gcd(a, b);
      return out(g === 1 ? `${a}/${b} is already in simplest form.` : `${a}/${b} = ${a / g}/${b / g}`, {kind: "num", value: a / b, steps: `Divide the top and bottom by their greatest common factor, ${g}: ${a} ÷ ${g} = ${a / g}, ${b} ÷ ${g} = ${b / g}.`});
    }
    if ((m = /^(-?\d+)\s*\/\s*(\d+) (?:as|in|to|into) (?:a )?(decimal|percent|percentage|%)$|^(?:convert )?(-?\d+)\s*\/\s*(\d+) to (?:a )?(decimal|percent|percentage|%)$/.exec(s))) {
      const a = Number(m[1] || m[4]), b = Number(m[2] || m[5]), k = m[3] || m[6]; if (!b) return null; const v = a / b;
      return /dec/.test(k) ? out(`${a}/${b} = ${F(v)}`, {kind: "num", value: v, steps: `Divide the top by the bottom: ${a} ÷ ${b} = ${F(v)}.`}) : out(`${a}/${b} = ${F(v * 100)}%`, {kind: "num", value: v, steps: `${a} ÷ ${b} = ${F(v)}, × 100 = ${F(v * 100)}%.`});
    }
    if ((m = /^(-?\d*\.\d+) (?:as|to|in) (?:a )?(fraction|percent|percentage|%)$/.exec(s))) { const v = Number(m[1]);
      return /frac/.test(m[2]) ? (fracStr(v) ? out(`${m[1]} = ${fracStr(v)}`, {kind: "num", value: v}) : null) : out(`${m[1]} = ${F(v * 100)}%`, {kind: "num", value: v}); }
    if ((m = /^round (-?\d*\.?\d+) to (?:the nearest )?(\d+|one|two|three|whole number|tenth|hundredth|thousandth|ten|hundred|thousand)(?: decimal places?| dp| places?)?$/.exec(s))) {
      const v = Number(m[1]), w = m[2], dp = /^\d+$/.test(w) ? Number(w) : {one: 1, two: 2, three: 3, tenth: 1, hundredth: 2, thousandth: 3, "whole number": 0, ten: -1, hundred: -2, thousand: -3}[w];
      const r = Math.round(v * 10 ** dp) / 10 ** dp; return out(`${m[1]} rounded is ${F(r)}`, {kind: "num", value: r});
    }
    return null;
  }

  // ---------- plain arithmetic (any wording) ----------
  function arith(s){
    let e = s.replace(LEAD, "").replace(/\s*(=|equals)\s*$/, "").replace(/^(?:the )?(?:answer to|value of|result of)\s+/, "").trim();
    e = e.replace(/(\d)\s*%\s*of\s*(\d*\.?\d+)/g, "($1/100*$2)").replace(/(\d+\s*\/\s*\d+)\s+of\s+/g, "($1)*").replace(/\bhalf of\s+/g, "0.5*").replace(/\b(?:a )?quarter of\s+/g, "0.25*");
    const sym = symbols(e);
    if (!/^[-+*/^().\d\s!%√πa-z²³]+$/.test(sym) || /[a-z]/.test(sym.replace(/sqrt|cbrt|pi/g, ""))) return null;
    if (!/\d/.test(sym) || !(/[-+*/^!%²³]|sqrt|cbrt|√/.test(sym.replace(/^-/, "")))) return null;
    let v; try { v = calc(sym); } catch (x) { return null; } if (typeof v !== "number" || !isFinite(v)) return v === Infinity || v === -Infinity ? out("That divides by zero, which isn't defined.", {kind: "num"}) : null;
    const left = show(e.replace(/\(([\d.]+)\/100\*([\d.]+)\)/g, "$1% of $2").replace(/\((\d+\s*\/\s*\d+)\)\*/g, "$1 of ").replace(/\b0\.5\*/g, "half of ").replace(/\b0\.25\*/g, "a quarter of ")).replace(/\bx\b/g, "×");
    return out(eq(left, v), {kind: "num", expr: sym, value: v, shown: left});
  }

  // ---------- grades: a score as a percent, a weighted average ----------
  function grades(s){
    let m;
    if ((m = /(\d*\.?\d+)\s*(?:\/|out of)\s*(\d*\.?\d+)/.exec(s)) && /\b(percent|percentage|%|grade|score|mark)\b/.test(s) && !/\bof\b\s*\d/.test(s.slice(m.index + m[0].length)) && /\b(what|as a|in percent|percentage|is that|that is|convert)\b/.test(s) && !/\b(mark (?:it|them|both|as|that)|done|record|log|enter|save|put|add|set|update|finished|submitted)\b/.test(s)) {
      const got = Number(m[1]), of = Number(m[2]); if (!of) return null; const v = got / of * 100;
      return out(`${F(got)} out of ${F(of)} is ${F(v, 2)}%.`, {kind: "score", got, of, value: v, steps: `${F(got)} ÷ ${F(of)} = ${F(got / of, 4)}, × 100 = ${F(v, 2)}%.`});
    }
    if (/\b(weight|weighted|worth|counts? for|counts? as)\b/.test(s)) {
      const items = [...s.matchAll(/([a-z][a-z ]*?)\s*(?:is |of |=|:|got |scored )?\s*(\d*\.?\d+)\s*%?\s*(?:,\s*)?(?:worth|weighted|weight|at|@|counts? (?:for|as)|which is)\s*(\d*\.?\d+)\s*%/g)].map(x => ({name: x[1].replace(/^(?:weighted avg|weighted average|avg|average|and|my|the|i got|got|on|a|an)\b[:\s]*/g, "").replace(/^(?:and|my|the)\s+/g, "").trim(), score: Number(x[2]), w: Number(x[3])}));
      if (items.length >= 2) {
        const W = items.reduce((a, x) => a + x.w, 0), v = items.reduce((a, x) => a + x.score * x.w, 0) / W;
        return out(`Your weighted average is ${F(v, 2)}%.`, {kind: "wavg", items, value: v, steps: `Multiply each score by its weight and add: ${items.map(x => `${F(x.score)} × ${F(x.w)}%`).join(" + ")} = ${F(items.reduce((a, x) => a + x.score * x.w / 100, 0), 2)}${W !== 100 ? `, then divide by the total weight (${F(W)}%)` : ""}.`});
      }
    }
    return null;
  }

  // ---------- nursing dosage ----------
  const MASS = {mcg: 1e-6, µg: 1e-6, mg: 1e-3, g: 1, gram: 1, grams: 1, units: 1, unit: 1, meq: 1};
  function dosage(s){
    let m;
    // IV rate: 1000 mL over 8 hours
    if ((m = /(\d*\.?\d+)\s*(?:ml|cc)\b[^.]*?\b(?:over|in|for|across)\s*(\d*\.?\d+)\s*(hours?|hrs?|h|minutes?|mins?)\b/.exec(s))) {
      const ml = Number(m[1]), min = Number(m[2]) * (/^m/.test(m[3]) ? 1 : 60), rate = ml / min * 60, df = (/(\d+)\s*(?:gtt|drops?)\s*(?:\/|per)\s*ml/.exec(s) || [])[1];
      if (df) { const g = ml * Number(df) / min; return out(`${F(ml)} mL over ${hm(min / 60).replace(/ \(.*\)/, "")} with a drop factor of ${df} gtt/mL is ${F(g, 1)} gtt/min (round to ${Math.round(g)} gtt/min).`, {kind: "iv", ml, min, value: g, steps: `gtt/min = volume (mL) × drop factor ÷ time (min) = ${F(ml)} × ${df} ÷ ${F(min)} = ${F(g, 2)}.`}); }
      return out(`${F(ml)} mL over ${hm(min / 60).replace(/ \(.*\)/, "")} runs at ${F(rate, 1)} mL/hr.`, {kind: "iv", ml, min, value: rate, steps: `mL/hr = total volume ÷ hours = ${F(ml)} ÷ ${F(min / 60)} = ${F(rate, 2)} mL/hr.`});
    }
    // weight-based: 44 lb, 10 mg/kg
    if ((m = /(\d*\.?\d+)\s*(mcg|mg|g|units?|meq)\s*(?:\/|per)\s*kg(?:\s*(?:\/|per|a)\s*(day|dose|hr|hour|min))?/.exec(s))) {
      const w = /(\d*\.?\d+)\s*(lb|lbs|pounds?|kg|kgs|kilos?)\b(?!\s*(?:\/|per))/.exec(s.replace(m[0], " ")); if (!w) return null;
      const kg = /^(lb|lbs|pound)/.test(w[2]) ? Number(w[1]) / 2.2 : Number(w[1]), dose = kg * Number(m[1]);
      const nd = (/(?:divided|split)\s*(?:into\s*)?(?:(\d+)\s*doses|(?:every|q)\s*(\d+)\s*h)/.exec(s) || []);
      const per = nd[1] ? Number(nd[1]) : nd[2] ? 24 / Number(nd[2]) : null;
      const steps = `${/^(lb|lbs|pound)/.test(w[2]) ? `Weight in kg: ${F(Number(w[1]))} lb ÷ 2.2 = ${F(kg, 2)} kg. ` : ""}Dose = ${F(m[1])} ${m[2]}/kg × ${F(kg, 2)} kg = ${F(dose, 2)} ${m[2]}${m[3] ? "/" + m[3] : ""}.${per ? ` Divided into ${per} doses: ${F(dose / per, 2)} ${m[2]} each.` : ""}`;
      return out(`The dose is ${F(dose, 2)} ${m[2]}${m[3] ? " per " + m[3] : ""}${per ? `, so ${F(dose / per, 2)} ${m[2]} per dose (${per} doses)` : ""} (${F(kg, 2)} kg × ${F(m[1])} ${m[2]}/kg).`, {kind: "dose", value: dose, steps});
    }
    // desired over have: 250 mg ordered, tablets are 125 mg / order 500 mg, on hand 250 mg per 5 mL
    if (/\b(how many|how much|give|administer|tabs?|tablets?|caps?|capsules?|ml)\b/.test(s)) {
      const amts = [...s.matchAll(/(\d*\.?\d+)\s*(mcg|µg|mg|g|grams?|units?|meq)\b(?!\s*\/\s*kg)(?:\s*(?:\/|per|in|each)\s*(\d*\.?\d+)?\s*(ml|cc|tabs?|tablets?|caps?|capsules?))?/g)];
      if (amts.length === 2 && /\b(order|ordered|prescribed|dose|give|need|want|desired|have|on hand|available|supply|stock|tabs?|tablets?|caps?|capsules?|vial|per|\/)\b/.test(s)) {
        const D = amts[0], H = amts[1], toG = (n, u) => Number(n) * (MASS[u] || MASS[u.replace(/s$/, "")] || 1);
        if (/units?|meq/.test(D[2]) !== /units?|meq/.test(H[2])) return null;
        const q = H[3] ? Number(H[3]) : H[4] ? 1 : 1, liquid = /ml|cc/.test(H[4] || "") || /\bml\b/.test(s.slice(H.index)), form = liquid ? "mL" : /cap/.test(s) ? "capsules" : "tablets";
        const v = toG(D[1], D[2]) / toG(H[1], H[2]) * q;
        return out(`Give ${F(v, 2)} ${v === 1 && !liquid ? form.replace(/s$/, "") : form}.`, {kind: "dose", value: v, steps: `Desired ÷ have × quantity: ${F(D[1])} ${D[2]} ÷ ${F(H[1])} ${H[2]} × ${F(q)}${liquid ? " mL" : ""} = ${F(v, 2)} ${form}.${D[2] !== H[2] ? ` (Converted to the same unit first.)` : ""}`});
      }
    }
    return null;
  }

  // ---------- logs, factorials, scientific notation, other bases ----------
  function misc(s){
    let m;
    if ((m = /^(?:the )?log(?:arithm)?(?:\s*base\s*(\d*\.?\d+)|_?(\d+))?\s*(?:of\s*)?\(?(\d*\.?\d+)\)?$/.exec(s))) { const b = Number(m[1] || m[2] || 10), x = Number(m[3]), v = Math.log(x) / Math.log(b);
      return out(`log base ${F(b)} of ${F(x)} = ${F4(v)}`, {kind: "num", value: v, steps: `It asks: ${F(b)} to what power gives ${F(x)}? ${Number.isInteger(R(v)) ? `${F(b)}^${F(v)} = ${F(x)}, so it's ${F(v)}.` : `log(${F(x)}) ÷ log(${F(b)}) = ${F4(v)}.`}`}); }
    if ((m = /^(?:the )?(?:ln|natural log(?:arithm)?)\s*(?:of\s*)?\(?(?:e\s*\^\s*(-?\d*\.?\d+)|(\d*\.?\d+))\)?$/.exec(s))) { const v = m[1] != null ? Number(m[1]) : Math.log(Number(m[2]));
      return out(m[1] != null ? `ln(e^${m[1]}) = ${F(v)}` : `ln ${m[2]} = ${F4(v)}`, {kind: "num", value: v, steps: m[1] != null ? `ln is the log with base e, so ln(e^${m[1]}) just gives back the power: ${m[1]}.` : `ln is the log with base e (about 2.71828).`}); }
    if ((m = /^(-?\d*\.?\d+) (?:in|to|as|into) scientific notation$/.exec(s)) || (m = /^(?:write |convert |put )?(-?\d*\.?\d+) (?:in|to|into|as) (?:sci(?:entific)?|standard (?:index )?form)(?: notation)?$/.exec(s))) {
      const x = Number(m[1]); if (!x) return null; const e = Math.floor(Math.log10(Math.abs(x))), c = R(x / 10 ** e);
      return out(`${m[1]} = ${F(c)} × 10^${e}`, {kind: "num", value: x, steps: `Move the decimal point ${Math.abs(e)} place${Math.abs(e) === 1 ? "" : "s"} ${e < 0 ? "right" : "left"} to get a number between 1 and 10 (${F(c)}), so the power of 10 is ${e}.`}); }
    if ((m = /^(?:binary\s*|0b)([01]+) (?:to|in|into) (?:decimal|base 10|denary)$/.exec(s)) || (m = /^([01]+) (?:from )?(?:in )?binary (?:to|in|into) (?:decimal|base 10)$/.exec(s))) { const v = parseInt(m[1], 2);
      return out(`Binary ${m[1]} = ${v} in decimal.`, {kind: "num", value: v, steps: m[1].split("").reverse().map((d, i) => d === "1" ? `2^${i} = ${2 ** i}` : null).filter(Boolean).reverse().join(" + ") + ` = ${v}.`}); }
    if ((m = /^(?:convert )?(\d+) (?:to|in|into) (binary|hex|hexadecimal|octal|base 2|base 16|base 8)$/.exec(s))) { const b = /bin|base 2$/.test(m[2]) ? 2 : /oct|base 8/.test(m[2]) ? 8 : 16, v = Number(m[1]).toString(b).toUpperCase();
      return out(`${m[1]} in ${b === 2 ? "binary" : b === 8 ? "octal" : "hexadecimal"} is ${v}.`, {kind: "num", value: Number(m[1]), steps: `Keep dividing by ${b} and read the remainders from the bottom up.`}); }
    if ((m = /^(?:convert )?(?:hex(?:adecimal)?\s*|0x)([0-9a-f]+) (?:to|in|into) (?:decimal|base 10)$/.exec(s))) { const v = parseInt(m[1], 16); return out(`Hex ${m[1].toUpperCase()} = ${v} in decimal.`, {kind: "num", value: v}); }
    // 3 hrs 45 min in minutes
    if ((m = /^(\d*\.?\d+)\s*(?:h|hr|hrs|hours?)\s*(?:and\s*)?(\d*\.?\d+)\s*(?:m|min|mins|minutes?)\s+(?:in|to|into|as)\s+(minutes?|mins?|hours?|hrs?|seconds?|secs?)$/.exec(s))) {
      const mins = Number(m[1]) * 60 + Number(m[2]), v = /^h/.test(m[3]) ? mins / 60 : /^s/.test(m[3]) ? mins * 60 : mins, u = /^h/.test(m[3]) ? "hours" : /^s/.test(m[3]) ? "seconds" : "minutes";
      return out(`${m[1]} h ${m[2]} min = ${F4(v)} ${u}`, {kind: "num", value: v, steps: `${m[1]} × 60 + ${m[2]} = ${F(mins)} minutes${u !== "minutes" ? `, ${u === "hours" ? "÷ 60" : "× 60"} = ${F4(v)} ${u}` : ""}.`}); }
    // the z score
    if ((m = /\bz[- ]?scores?\b/.exec(s))) {
      const g = re => { const x = re.exec(s); return x ? Number(x[1]) : null; };
      const x = g(/\b(?:x|score|value|raw score)\s*(?:=|is|of)?\s*(-?\d*\.?\d+)/), mu = g(/\b(?:mean|μ|mu|average|avg)\s*(?:=|is|of)?\s*(-?\d*\.?\d+)/), sd = g(/\b(?:sd|σ|sigma|std|standard deviation|s)\s*(?:=|is|of)?\s*(\d*\.?\d+)/);
      if (x != null && mu != null && sd) { const z = (x - mu) / sd;
        return out(`z = (${F(x)} − ${F(mu)}) ÷ ${F(sd)} = ${F4(z)}`, {kind: "z", x, mu, sd, value: z, steps: `z = (x − mean) ÷ standard deviation = (${F(x)} − ${F(mu)}) ÷ ${F(sd)} = ${F4(z)}.`}); }
    }
    // the sum of interior angles; each angle of a regular one
    const PN = {triangle: 3, quadrilateral: 4, square: 4, rectangle: 4, pentagon: 5, hexagon: 6, heptagon: 7, septagon: 7, octagon: 8, nonagon: 9, decagon: 10, hendecagon: 11, dodecagon: 12};
    if ((m = /\b(?:interior )?angles?\b.*?\b(?:of|in) (?:a |an )?(?:regular )?(triangle|quadrilateral|square|rectangle|pentagon|hexagon|heptagon|septagon|octagon|nonagon|decagon|hendecagon|dodecagon|(\d+)[- ]?(?:sided|gon)\s*(?:shape|polygon|figure)?|polygon with (\d+) sides)\b/.exec(s)) && /\bangle/.test(s)) {
      const n = PN[m[1]] || Number(m[2] || m[3]); if (!(n >= 3)) return null; const sum = (n - 2) * 180;
      if (/\beach\b|\bone angle\b|\bregular\b.*\bangle\b|\bevery\b/.test(s) && !/\bsum\b/.test(s)) return out(`Each interior angle of a regular ${m[1]} is ${F4(sum / n)}°.`, {kind: "poly", n, name: m[1], value: sum / n, steps: `The angles add up to (n − 2) × 180 = (${n} − 2) × 180 = ${sum}°; in a regular one they're equal, so ${sum} ÷ ${n} = ${F4(sum / n)}°.`});
      return out(`The interior angles of a ${m[1]} add up to ${sum}°.`, {kind: "poly", n, name: m[1], value: sum, steps: `(n − 2) × 180 with n = ${n}: (${n} − 2) × 180 = ${sum}°.`});
    }
    // f(x) = 2x^2 - 3, f(3)
    if ((m = /\b([a-z])\(\s*([a-z])\s*\)\s*=\s*([-+\d.a-z^²\s*/()]+?)[,;.]?\s*(?:what(?:'s| is)|whats|find|evaluate|then|and|calculate)?\s*\1\(\s*(-?\d*\.?\d+)\s*\)$/.exec(s))) {
      const r = fval(m[3], m[2], Number(m[4])); if (r == null) return null;
      return out(`${m[1]}(${m[4]}) = ${F(r)}`, {kind: "func", name: m[1], v: m[2], expr: m[3].trim(), value: r, steps: `Put ${m[4]} in for ${m[2]}: ${m[3].trim().replace(new RegExp(m[2], "g"), `(${m[4]})`)} = ${F(r)}.`});
    }
    // derivatives and integrals of polynomials
    if ((m = /^(?:(?:the |find the |what(?:'s| is) the )?(derivative|integral|antiderivative)\s*(?:of\s*)?|(?:differentiate|integrate)\s+|d\/dx\s*)\(?(.+?)\)?(?:\s*dx)?$/.exec(s))) {
      const op = /integr|anti/.test(m[1] || "") || /^integrate/.test(s) ? "int" : "der", r = calculus(m[2], op); if (r) return r;
    }
    // simple and compound interest without the word interest: $1000 at 5% for 3 years
    if ((m = /^\$\s*(\d*\.?\d+) (?:invested )?at (\d*\.?\d+)\s*%(?: a year| per year| annually| yearly| interest)? for (\d+) years?(?:,? ?(compound(?:ed)?(?: yearly| annually)?|simple))?$/.exec(s))) return interest(Number(m[1]), Number(m[2]) / 100, Number(m[3]), !/simple/.test(m[4] || ""));
    // unit price: if 5 pencils cost $3.75 how much are 12
    if ((m = /(\d*\.?\d+)\s+([a-z]+?)s?\s+(?:cost|costs|are|is|for|=)\s*\$\s*(\d*\.?\d+)[^\d]*?(?:how much|what|cost)[^\d]*?(\d*\.?\d+)/.exec(s))) {
      const n = Number(m[1]), p = Number(m[3]), k = Number(m[4]); if (!n) return null; const v = p / n * k;
      return out(`${F(k)} would cost $${F(v, 2)} ($${F(p / n, 4).replace(/(\.\d\d\d*?)0+$/, "$1")} each).`, {kind: "money", value: v, steps: `One costs $${F(p, 2)} ÷ ${F(n)} = $${F(p / n, 4)}; ${F(k)} × $${F(p / n, 4)} = $${F(v, 2)}.`});
    }
    // more workers, less time: 3 workers paint a house in 12 days, how long for 4 workers
    if ((m = /(\d+)\s+([a-z]+)\b[^\d]*?\b(?:in|takes?|take)\s+(\d*\.?\d+)\s+(days?|hours?|weeks?|minutes?)\b[^\d]*?(\d+)\s+(?:\2|[a-z]+)/.exec(s)) && /\bhow long|how many (days|hours|weeks)\b/.test(s)) {
      const a = Number(m[1]), t = Number(m[3]), b = Number(m[5]); if (!b) return null; const v = a * t / b;
      return out(`${b} ${m[2]} would take ${F4(v)} ${m[4].replace(/s?$/, "s")}.`, {kind: "num", value: v, steps: `The total work is ${a} × ${F(t)} = ${F(a * t)} ${m[2].replace(/s$/, "")}-${m[4].replace(/s$/, "")}s; shared by ${b}: ${F(a * t)} ÷ ${b} = ${F4(v)}.`});
    }
    return null;
  }
  function interest(P0, p, n, comp){
    const v = comp ? P0 * (1 + p) ** n : P0 * (1 + p * n);
    return out(`${comp ? "Compounded yearly" : "Simple interest"}: $${F(P0, 2)} at ${F(p * 100)}% for ${n} year${n === 1 ? "" : "s"} grows to $${F(v, 2)} ($${F(v - P0, 2)} interest).`, {kind: "interest", P0, p, n, comp, value: v, steps: comp ? `A = P(1 + r)^t = ${F(P0, 2)} × ${F(1 + p)}^${n} = ${F(v, 2)}.` : `I = P × r × t = ${F(P0, 2)} × ${F(p)} × ${n} = ${F(v - P0, 2)}; ${F(P0, 2)} + ${F(v - P0, 2)} = ${F(v, 2)}.`});
  }
  function fval(expr, v, x){ try { return calc(expr.replace(/\s+/g, "").replace(/²/g, "^2").replace(new RegExp(`(\\d|\\))${v}`, "g"), "$1*" + v).replace(new RegExp(`${v}\\(`, "g"), v + "*(").replace(new RegExp(v, "g"), `(${x})`)); } catch (e) { return null; } }
  function pterms(src){
    const t = src.replace(/\s+/g, "").replace(/²/g, "^2").replace(/³/g, "^3").replace(/\*/g, "").replace(/[−–]/g, "-"); if (!/^[-+\d.x^/]+$/.test(t)) return null;
    const out0 = []; for (const term of t.match(/[+-]?[^+-]+(?:\^-?\d+)?/g) || []) { const m = /^([+-]?)(\d*\.?\d*)(?:\/(\d+))?(x(?:\^(-?\d+))?)?$/.exec(term); if (!m || (!m[2] && !m[4])) return null;
      let k = m[2] === "" ? 1 : Number(m[2]); if (m[3]) k /= Number(m[3]); if (m[1] === "-") k = -k; out0.push([k, m[4] ? Number(m[5] != null ? m[5] : 1) : 0]); }
    return out0;
  }
  const pstr = ts => { const s0 = ts.filter(([k]) => k !== 0).sort((a, b) => b[1] - a[1]).map(([k, p], i) => { const a = Math.abs(k), c = a === 1 && p !== 0 ? "" : NV(a); return (k < 0 ? (i ? " − " : "−") : (i ? " + " : "")) + c + (p === 0 ? "" : p === 1 ? "x" : `x^${p}`); }).join(""); return s0 || "0"; };
  function calculus(src, op){
    const ts = pterms(src); if (!ts) return null;
    if (op === "der") { const d = ts.map(([k, p]) => [k * p, p - 1]).filter(([k]) => k !== 0);
      return out(`The derivative of ${pstr(ts)} is ${pstr(d)}.`, {kind: "calc", op, value: null, steps: `Power rule: bring the power down and take one off it (the derivative of axⁿ is n·a·xⁿ⁻¹). ${ts.map(([k, p]) => `${pstr([[k, p]])} → ${pstr([[k * p, p - 1]])}`).join("; ")}.`}); }
    if (ts.some(([, p]) => p === -1)) return null;
    const I = ts.map(([k, p]) => [k / (p + 1), p + 1]);
    return out(`The integral of ${pstr(ts)} is ${pstr(I)} + C.`, {kind: "calc", op, value: null, steps: `Power rule for integrals: add one to the power and divide by the new power (∫axⁿ dx = a·xⁿ⁺¹ ÷ (n + 1)), then add C. ${ts.map(([k, p]) => `${pstr([[k, p]])} → ${pstr([[k / (p + 1), p + 1]])}`).join("; ")}.`});
  }

  // ---------- two equations, two letters ----------
  function system(s){
    const parts = s.replace(/^(?:solve|find|what are|what is|what's)\b\s*(?:for\s+[a-z](?:\s*and\s*[a-z])?\s*)?[:,]?\s*/, "").split(/\s*(?:,|;|\band\b|&)\s*/).filter(p => /=/.test(p)); if (parts.length !== 2) return null;
    const vars = [...new Set(parts.join(" ").match(/[a-z]/g) || [])].sort(); if (vars.length !== 2) return null;
    const side = t => { const c = [0, 0, 0]; const x = t.replace(/\s+/g, "").replace(/\*/g, ""); if (!new RegExp(`^[-+\\d.${vars.join("")}]+$`).test(x)) return null;
      for (const term of x.match(/[+-]?[^+-]+/g) || []) { const m = new RegExp(`^([+-]?)(\\d*\\.?\\d*)([${vars.join("")}])?$`).exec(term); if (!m || (!m[2] && !m[3])) return null; let k = m[2] === "" ? 1 : Number(m[2]); if (m[1] === "-") k = -k; c[m[3] ? vars.indexOf(m[3]) : 2] += k; } return c; };
    const eqs = parts.map(p => { const [l, r] = p.split("="); const a = side(l), b = side(r); return a && b ? [a[0] - b[0], a[1] - b[1], b[2] - a[2]] : null; }); if (eqs.some(e => !e)) return null;
    const [[a1, b1, c1], [a2, b2, c2]] = eqs, D = a1 * b2 - a2 * b1; const [X, Y] = vars;
    if (D === 0) return out("Those two equations don't have exactly one solution (the lines are parallel or the same).", {kind: "sys"});
    const x = (c1 * b2 - c2 * b1) / D, y = (a1 * c2 - a2 * c1) / D;
    const steps = b1 === b2 || b1 === -b2 ? `${b1 === -b2 ? "Add" : "Subtract"} the equations so ${Y} cancels: ${F4(b1 === -b2 ? a1 + a2 : a1 - a2)}${X} = ${F4(b1 === -b2 ? c1 + c2 : c1 - c2)}, so ${X} = ${F4(x)}. Put ${X} = ${F4(x)} into the first equation: ${F4(b1)}${Y} = ${F4(c1)} − ${F4(a1 * x)}, so ${Y} = ${F4(y)}.`
      : `Multiply the first equation by ${F4(b2)} and the second by ${F4(b1)}, then subtract so ${Y} cancels: ${F4(D)}${X} = ${F4(c1 * b2 - c2 * b1)}, so ${X} = ${F4(x)}. Put it back into the first equation to get ${Y} = ${F4(y)}.`;
    return out(`${X} = ${F4(x)} and ${Y} = ${F4(y)}`, {kind: "sys", value: x, steps: steps + ` Check: both equations hold with ${X} = ${F4(x)}, ${Y} = ${F4(y)}.`});
  }

  // ---------- probability and counting ----------
  const WN = s => s == null ? null : /^\d+$/.test(s) ? Number(s) : {once: 1, one: 1, twice: 2, two: 2, three: 3, thrice: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10}[s];
  const C = (n, k) => { if (k < 0 || k > n) return 0; let r = 1; for (let i = 1; i <= k; i++) r = r * (n - k + i) / i; return Math.round(r); };
  const fact = n => { let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; };
  const pf = v => `${fracStr(v) || F(v)}${frac(v) ? ` (${F(v * 100, 2)}%)` : ` (${F(v * 100, 2)}%)`}`;
  function chance(s){
    let m;
    // coins: flip a coin 3 times, all heads / exactly 2 heads / at least 1 tail
    if ((m = /\b(?:flip|toss)(?:ping)?\s*(?:a\s+)?(?:coin|coins)?\s*(\d+|two|three|four|five|six|seven|eight|nine|ten|twice|thrice)\s*(?:times|coins)?/.exec(s)) || (m = /(\d+|two|three|four|five|six|seven|eight|nine|ten)\s+coin\s*(?:flips|tosses)/.exec(s))) {
      const n = WN(m[1]); if (!n || n > 30) return null; return coin(s, n);
    }
    // dice: rolling a 6 twice in a row / at least one 6 in two rolls / sum of 7 with two dice
    if (/\b(roll|rolls|rolling|die|dice)\b/.test(s)) {
      if ((m = /\bsum (?:of )?(\d+)\b/.exec(s)) && /\b(two|2|pair of) dice\b/.test(s)) { const t = Number(m[1]); let k = 0; for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) if (a + b === t) k++;
        return out(`The chance of rolling a sum of ${t} with two dice is ${k}/36${k ? ` = ${pf(k / 36)}` : ""}.`, {kind: "prob", value: k / 36, steps: `There are 6 × 6 = 36 equally likely outcomes, and ${k} of them add up to ${t}.`}); }
      const face = (/\b(?:a|an|one|the number)?\s*(\d)\b(?!\s*(?:rolls?|times|dice))/.exec(s) || [])[1]; if (!face || face > 6 || face < 1) return null;
      const n = WN((/(\d+|two|three|four|five|six|ten|twice|thrice)\s*(?:rolls|times|dice)/.exec(s) || /\b(twice|thrice)\b/.exec(s) || [])[1]) || (/in a row/.test(s) ? 2 : 1);
      return dice(s, Number(face), n);
    }
    // arrangements and choices
    if ((m = /\b(?:arrange|order|line up|seat|permutations? of)\s+(\d+)\b/.exec(s)) && !/\b(choose|pick|select)\b/.test(s)) { const n = Number(m[1]); if (n > 20) return null;
      return out(`There are ${F(fact(n))} ways (${n}! = ${Array.from({length: n}, (_, i) => n - i).join(" × ")}).`, {kind: "num", value: fact(n), steps: `${n} choices for the first spot, ${n - 1} for the next, and so on: ${n}! = ${F(fact(n))}.`}); }
    if ((m = /\b(?:choose|pick|select|combinations? of|ways to (?:choose|pick|select))\s+(\d+)\s*(?:\w+\s+)?(?:of|from|out of)\s+(\d+)/.exec(s)) || (m = /\b(\d+)\s*(?:c|choose|ncr)\s*(\d+)\b/.exec(s)) && (m = [m[0], m[2], m[1]])) {
      const k = Number(m[1]), n = Number(m[2]), ordered = /\border (?:does )?matters?\b|\bpermutations?\b|\bnpr\b|\bin order\b/.test(s) && !/\b(doesn'?t|does not|not) matter/.test(s);
      const v = ordered ? fact(n) / fact(n - k) : C(n, k);
      return out(ordered ? `There are ${F(v)} ways to pick ${k} of ${n} when order matters (${n}P${k}).` : `There are ${F(v)} ways to choose ${k} of ${n} when order doesn't matter (${n}C${k}).`, {kind: "num", value: v, steps: ordered ? `${n}P${k} = ${n}! ÷ (${n} − ${k})! = ${F(v)}.` : `${n}C${k} = ${n}! ÷ (${k}! × ${n - k}!) = ${F(fact(n))} ÷ (${F(fact(k))} × ${F(fact(n - k))}) = ${F(v)}.`});
    }
    return null;
  }
  function coin(s, n){
    const side = /\btails?\b/.test(s) && !/\bheads?\b/.test(s) ? "tails" : "heads";
    let k, kind = "exactly";
    if (/\ball\b/.test(s)) k = n; else if (/\bno\b|\bnone\b|\bzero\b/.test(s)) k = 0;
    else { const m = /\b(exactly|at least|at most|more than|fewer than|less than)?\s*(\d+|one|two|three|four|five)\s+(?:heads?|tails?)\b/.exec(s); if (!m) return null; k = WN(m[2]); kind = m[1] || "exactly"; }
    const sum = f => { let t = 0; for (let i = 0; i <= n; i++) if (f(i)) t += C(n, i); return t; };
    const hits = kind === "at least" ? sum(i => i >= k) : kind === "at most" ? sum(i => i <= k) : kind === "more than" ? sum(i => i > k) : /fewer|less/.test(kind) ? sum(i => i < k) : C(n, k);
    const v = hits / 2 ** n, what = k === n && kind === "exactly" ? `all ${side}` : `${kind} ${k} ${side}`;
    return out(`The chance of ${what} in ${n} flips is ${hits}/${2 ** n}${fracStr(v) && fracStr(v) !== `${hits}/${2 ** n}` ? ` = ${fracStr(v)}` : ""} (${F(v * 100, 2)}%).`, {kind: "coin", n, side, value: v, steps: `There are 2^${n} = ${2 ** n} equally likely outcomes. ${kind === "exactly" ? `The number with exactly ${k} ${side} is ${n}C${k} = ${C(n, k)}` : `Adding up the outcomes that count gives ${hits}`}, so ${hits}/${2 ** n}.`});
  }
  function dice(s, f, n){
    if (/\bat least (?:one|1|once)\b/.test(s)) { const v = 1 - (5 / 6) ** n;
      return out(`The chance of at least one ${f} in ${n} roll${n === 1 ? "" : "s"} is ${pf(v)}.`, {kind: "dice", f, n, value: v, steps: `Easier the other way round: the chance of no ${f} in ${n} rolls is (5/6)^${n} = ${fracStr((5 / 6) ** n) || F((5 / 6) ** n, 4)}, so at least one is 1 − that = ${fracStr(v) || F(v, 4)}.`}); }
    const k = n; const v = (1 / 6) ** k;
    return out(`The chance of rolling a ${f} ${k === 1 ? "" : k === 2 ? "twice in a row" : k + " times in a row"} is ${pf(v)}.`.replace("  ", " "), {kind: "dice", f, n, value: v, steps: `Each roll has a 1/6 chance, and rolls are independent, so multiply: ${Array(k).fill("1/6").join(" × ")} = ${fracStr(v) || F(v, 6)}.`});
  }

  // ---------- physics with numbers ----------
  function physics(s){
    let m; const g = re => { const x = re.exec(s); return x ? Number(x[1]) : null; };
    const kg = g(/(\d*\.?\d+)\s*(?:kg|kilograms?)\b/), acc = g(/(\d*\.?\d+)\s*m\/s(?:\^2|²|2|\/s)/), vel = g(/(\d*\.?\d+)\s*m\/s\b(?!\s*(?:\^|²|2|\/s))/);
    if (kg != null && acc != null && /\b(force|newton|f\s*=|accel|push|pull|second law)\b/.test(s)) { const F0 = kg * acc; return out(`F = ma = ${F(kg)} kg × ${F(acc)} m/s² = ${F(F0)} N`, {kind: "phys", value: F0, steps: `Newton's second law: force = mass × acceleration.`}); }
    if (kg != null && vel != null && /\b(kinetic|ke|energy)\b/.test(s)) { const E = 0.5 * kg * vel * vel; return out(`KE = ½mv² = ½ × ${F(kg)} × ${F(vel)}² = ${F(E)} J`, {kind: "ke", kg, vel, value: E, steps: `Kinetic energy is half the mass times the speed squared: 0.5 × ${F(kg)} × ${F(vel * vel)} = ${F(E)} joules.`}); }
    if (kg != null && vel != null && /\bmomentum\b/.test(s)) { const p = kg * vel; return out(`p = mv = ${F(kg)} × ${F(vel)} = ${F(p)} kg·m/s`, {kind: "phys", value: p}); }
    const V = g(/(\d*\.?\d+)\s*(?:v|volts?)\b/), Rr = g(/(\d*\.?\d+)\s*(?:ohms?|Ω|ω)/), I = g(/(\d*\.?\d+)\s*(?:a|amps?|amperes?)\b/);
    if (V != null && Rr != null && I == null) return out(`I = V ÷ R = ${F(V)} V ÷ ${F(Rr)} Ω = ${F4(V / Rr)} A`, {kind: "phys", value: V / Rr, steps: "Ohm's law: V = IR, so the current I = V ÷ R."});
    if (I != null && Rr != null && V == null) return out(`V = IR = ${F(I)} A × ${F(Rr)} Ω = ${F4(I * Rr)} V`, {kind: "phys", value: I * Rr, steps: "Ohm's law: V = IR."});
    if (V != null && I != null && Rr == null && /\b(resistance|ohm|power|watts?)\b/.test(s)) return /\b(power|watts?)\b/.test(s) ? out(`P = VI = ${F(V)} V × ${F(I)} A = ${F4(V * I)} W`, {kind: "phys", value: V * I}) : out(`R = V ÷ I = ${F(V)} V ÷ ${F(I)} A = ${F4(V / I)} Ω`, {kind: "phys", value: V / I, steps: "Ohm's law: V = IR, so R = V ÷ I."});
    if ((m = /\bdensity\b/.exec(s))) { const mass = g(/(\d*\.?\d+)\s*(?:g|grams?)\b/), vol = g(/(\d*\.?\d+)\s*(?:ml|cm3|cm³|cc)\b/); if (mass != null && vol) return out(`Density = mass ÷ volume = ${F(mass)} g ÷ ${F(vol)} mL = ${F4(mass / vol)} g/mL`, {kind: "phys", value: mass / vol}); }
    return null;
  }

  // ---------- chemistry: elements, molar mass, balancing ----------
  const EL = "H,Hydrogen,1,1.008|He,Helium,2,4.0026|Li,Lithium,3,6.94|Be,Beryllium,4,9.0122|B,Boron,5,10.81|C,Carbon,6,12.011|N,Nitrogen,7,14.007|O,Oxygen,8,15.999|F,Fluorine,9,18.998|Ne,Neon,10,20.180|Na,Sodium,11,22.990|Mg,Magnesium,12,24.305|Al,Aluminum,13,26.982|Si,Silicon,14,28.085|P,Phosphorus,15,30.974|S,Sulfur,16,32.06|Cl,Chlorine,17,35.45|Ar,Argon,18,39.948|K,Potassium,19,39.098|Ca,Calcium,20,40.078|Sc,Scandium,21,44.956|Ti,Titanium,22,47.867|V,Vanadium,23,50.942|Cr,Chromium,24,51.996|Mn,Manganese,25,54.938|Fe,Iron,26,55.845|Co,Cobalt,27,58.933|Ni,Nickel,28,58.693|Cu,Copper,29,63.546|Zn,Zinc,30,65.38|Ga,Gallium,31,69.723|Ge,Germanium,32,72.630|As,Arsenic,33,74.922|Se,Selenium,34,78.971|Br,Bromine,35,79.904|Kr,Krypton,36,83.798|Rb,Rubidium,37,85.468|Sr,Strontium,38,87.62|Ag,Silver,47,107.87|Sn,Tin,50,118.71|I,Iodine,53,126.90|Xe,Xenon,54,131.29|Cs,Cesium,55,132.91|Ba,Barium,56,137.33|Pt,Platinum,78,195.08|Au,Gold,79,196.97|Hg,Mercury,80,200.59|Pb,Lead,82,207.2|Rn,Radon,86,222|Ra,Radium,88,226|U,Uranium,92,238.03"
    .split("|").map(x => { const [sym, name, z, mass] = x.split(","); return {sym, name, z: Number(z), mass: Number(mass)}; });
  const ELS = {}; EL.forEach(e => ELS[e.sym] = e);
  const LATIN = {Na: "natrium", K: "kalium", Fe: "ferrum", Cu: "cuprum", Ag: "argentum", Au: "aurum", Pb: "plumbum", Sn: "stannum", Hg: "hydrargyrum", Sb: "stibium", W: "wolfram"};
  const CMP = {water: "H2O", "table salt": "NaCl", salt: "NaCl", "sodium chloride": "NaCl", glucose: "C6H12O6", sucrose: "C12H22O11", "carbon dioxide": "CO2", "carbon monoxide": "CO", oxygen: "O2", "oxygen gas": "O2", nitrogen: "N2", hydrogen: "H2", ammonia: "NH3", methane: "CH4", "sulfuric acid": "H2SO4", "hydrochloric acid": "HCl", "nitric acid": "HNO3", "sodium bicarbonate": "NaHCO3", "baking soda": "NaHCO3", "calcium carbonate": "CaCO3", ethanol: "C2H5OH", "sodium hydroxide": "NaOH", "potassium chloride": "KCl", "calcium chloride": "CaCl2", "magnesium sulfate": "MgSO4", "hydrogen peroxide": "H2O2", ozone: "O3", "acetic acid": "CH3COOH", "potassium permanganate": "KMnO4"};
  function atoms(f){
    const st = [{}]; let i = 0; const t = String(f).replace(/\s+/g, "");
    while (i < t.length) {
      if (t[i] === "(" || t[i] === "[") { st.push({}); i++; continue; }
      if (t[i] === ")" || t[i] === "]") { i++; const n = /^\d+/.exec(t.slice(i)); const k = n ? Number(n[0]) : 1; if (n) i += n[0].length; const top = st.pop(); if (!st.length) return null; for (const e in top) st[st.length - 1][e] = (st[st.length - 1][e] || 0) + top[e] * k; continue; }
      const m = /^([A-Z][a-z]?)(\d*)/.exec(t.slice(i)); if (!m || !ELS[m[1]]) return null; i += m[0].length; const top = st[st.length - 1]; top[m[1]] = (top[m[1]] || 0) + (m[2] ? Number(m[2]) : 1);
    }
    return st.length === 1 && Object.keys(st[0]).length ? st[0] : null;
  }
  const findF = raw => { const lw = low(raw); const nm = Object.keys(CMP).sort((a, b) => b.length - a.length).find(k => new RegExp(`\\b${k}\\b`).test(lw)); if (nm) return [CMP[nm], nm];
    const m = String(raw).match(/\b(?:[A-Z][a-z]?\d*|\((?:[A-Z][a-z]?\d*)+\)\d*)+\b/g); const f = (m || []).filter(x => atoms(x) && (/\d/.test(x) || x.length > 1 || ELS[x])).sort((a, b) => b.length - a.length)[0]; return f ? [f, null] : null; };
  let RAWQ = "";
  function chem(s){
    let m;
    if ((m = /\b(atomic (?:number|mass|weight)|chemical symbol|symbol)\b(?: (?:of|for))? (?:the element )?([a-z]+)\b/.exec(s)) || (m = /\b([a-z]+)'?s? (atomic (?:number|mass|weight)|symbol)\b/.exec(s)) && (m = [m[0], m[2], m[1]])) {
      const e = EL.find(x => x.name.toLowerCase() === m[2] || x.name.toLowerCase().replace("aluminum", "aluminium") === m[2] || x.sym.toLowerCase() === m[2] && m[2].length > 1); if (!e) return null; return elem(e, m[1]);
    }
    if ((m = /\b(?:which|what) element (?:is|has) (?:the )?(?:atomic number|number)\s*(\d+)|\belement (?:number\s*)?(\d+)\b/.exec(s))) { const e = EL.find(x => x.z === Number(m[1] || m[2])); if (e) return elem(e, "name"); }
    if (/\bmolar mass|molecular (?:mass|weight)|formula (?:mass|weight)|grams? per mole|g\/mol\b/.test(s)) {
      const f = findF(RAWQ.replace(/molar|mass|of|what|is|the|molecular|weight|formula/gi, " ")); if (!f) return null; const a = atoms(f[0]); if (!a) return null; return molar(f[0], a);
    }
    if ((m = /\b(?:chemical )?formula (?:for|of) ([a-z ]+)$/.exec(s)) && CMP[m[1].trim()]) { const f = CMP[m[1].trim()]; return out(`The formula for ${m[1].trim()} is ${f}.`, Object.assign(molar(f, atoms(f)).math, {kind: "chemf"})); }
    if (/\bbalance\b/.test(s) && /->|→|=|⟶|yields|produces/.test(RAWQ)) return balance(RAWQ.replace(/^.*?balance\s*(?:the equation\s*)?:?\s*/i, ""));
    return null;
  }
  function elem(e, what){
    const how = /mass|weight/.test(what) ? `${e.name}'s atomic mass is ${e.mass} u (g/mol).` : /symbol/.test(what) ? `The chemical symbol for ${e.name.toLowerCase()} is ${e.sym}.` : /name/.test(what) ? `Element number ${e.z} is ${e.name.toLowerCase()} (${e.sym}).` : `${e.name}'s atomic number is ${e.z} (symbol ${e.sym}, atomic mass ${e.mass}).`;
    return out(how, {kind: "elem", what, sym: e.sym, value: e.z});
  }
  function molar(f, a){
    const parts = Object.keys(a).map(e => [e, a[e], ELS[e].mass]); const M = parts.reduce((t, [, n, w]) => t + n * w, 0);
    return out(`The molar mass of ${f} is ${F(M, 2)} g/mol.`, {kind: "molar", f, value: M, steps: `Add up the atomic masses: ${parts.map(([e, n, w]) => `${e}: ${n} × ${w} = ${F(n * w, 3)}`).join("; ")}. Total ${F(M, 3)} g/mol.`});
  }
  function balance(eqn){
    const [L, Rt] = eqn.split(/\s*(?:->|→|⟶|=|yields|produces)\s*/); if (!L || !Rt) return null;
    const sp = x => x.split(/\s+\+\s+|\s*\+\s*/).map(y => y.trim().replace(/^\d+\s*/, "")).filter(Boolean);
    const left = sp(L), right = sp(Rt), all = [...left, ...right], A = all.map(atoms); if (A.some(x => !x) || all.length > 5 || all.length < 2) return null;
    const els = [...new Set(A.flatMap(x => Object.keys(x)))];
    const c = Array(all.length).fill(1), max = all.length > 4 ? 8 : 12;
    const ok = () => els.every(e => { let t = 0; A.forEach((a, i) => t += (i < left.length ? 1 : -1) * (a[e] || 0) * c[i]); return t === 0; });
    const rec = i => { if (i === all.length) return ok(); for (let k = 1; k <= max; k++) { c[i] = k; if (rec(i + 1)) return true; } return false; };
    if (!rec(0)) return null;
    const sh = (arr, off) => arr.map((x, i) => (c[i + off] === 1 ? "" : c[i + off]) + x).join(" + ");
    return out(`Balanced: ${sh(left, 0)} → ${sh(right, left.length)}`, {kind: "chem", steps: `Count each element on both sides: ${els.map(e => { let l = 0, r = 0; A.forEach((a, i) => { if (i < left.length) l += (a[e] || 0) * c[i]; else r += (a[e] || 0) * c[i]; }); return `${e} ${l} = ${r}`; }).join(", ")}.`});
  }

  // ---------- well-known formulas, asked for by name ----------
  const FORMULAS = [
    [/\bquadratic formula\b/, "The quadratic formula: for ax² + bx + c = 0, x = (−b ± √(b² − 4ac)) / 2a."],
    [/\bpythagorean theorem|pythagoras'? theorem\b/, "The Pythagorean theorem: in a right triangle, a² + b² = c², where c is the hypotenuse (the side opposite the right angle)."],
    [/\bslope formula\b/, "Slope m = (y₂ − y₁) / (x₂ − x₁): the change in y divided by the change in x."],
    [/\bdistance formula\b/, "Distance between (x₁, y₁) and (x₂, y₂) = √((x₂ − x₁)² + (y₂ − y₁)²)."],
    [/\bmidpoint formula\b/, "Midpoint = ((x₁ + x₂)/2, (y₁ + y₂)/2)."],
    [/\b(?:formula for (?:the )?)?area of a circle(?: formula)?\b(?!.*\d)/, "Area of a circle = πr² (r is the radius)."],
    [/\b(?:formula for (?:the )?)?circumference(?: of a circle)?(?: formula)?\b(?!.*\d)/, "Circumference of a circle = 2πr (or πd, with d the diameter)."],
    [/\bohm'?s law\b(?!.*\d)/, "Ohm's law: V = IR (voltage = current × resistance), so I = V/R and R = V/I."],
    [/\b(?:kinetic energy) formula|formula for kinetic energy\b/, "Kinetic energy KE = ½mv² (m in kg, v in m/s, KE in joules)."],
    [/\bcompound interest formula|formula for compound interest\b/, "Compound interest: A = P(1 + r/n)^(nt), with P the starting amount, r the yearly rate, n the times compounded per year and t the years."],
    [/\bsimple interest formula|formula for simple interest\b/, "Simple interest: I = P × r × t (amount × yearly rate × years)."],
    [/\bz[- ]?score formula|formula for (?:a )?z[- ]?score\b/, "z = (x − μ) / σ: how many standard deviations x is from the mean."],
    [/\bpercent(?:age)? change formula|formula for percent(?:age)? change\b/, "Percent change = (new − old) ÷ old × 100."],
    [/\b(?:iv )?drip rate formula|formula for (?:iv )?drip rate|gtt\/min formula\b/, "Drip rate (gtt/min) = volume (mL) × drop factor (gtt/mL) ÷ time (minutes)."],
    [/\bdosage formula|formula for (?:drug )?dosage|desired over have\b/, "Dosage: (desired ÷ have) × quantity. For example, 500 mg ordered with 250 mg per 5 mL: 500 ÷ 250 × 5 = 10 mL."],
    [/\bbmi formula|formula for bmi|how (?:do you|to) calculate bmi\b/, "BMI = weight (kg) ÷ height (m)². In pounds and inches: 703 × lb ÷ in²."],
  ];
  function formulas(s){ for (const [re, a] of FORMULAS) if (re.test(s)) return out(a, {kind: "formula", name: (re.exec(s) || [""])[0]}); return null; }
  function bmi(s){
    let m = /\bbmi\b/.test(s) && (/(\d*\.?\d+)\s*(kg|lb|lbs|pounds?)\b/.exec(s)); if (!m) return null;
    const h = /(\d*\.?\d+)\s*(cm|m)\b/.exec(s) || /(\d+)\s*(?:'|ft|feet|foot)\s*(\d+(?:\.\d+)?)?\s*(?:"|in|inches)?/.exec(s); if (!h) return null;
    const kg = /^l|^p/.test(m[2]) ? Number(m[1]) * 0.45359237 : Number(m[1]), hm0 = h[2] === "cm" ? Number(h[1]) / 100 : h[2] === "m" ? Number(h[1]) : (Number(h[1]) * 12 + Number(h[2] || 0)) * 0.0254;
    const v = kg / hm0 / hm0, band = v < 18.5 ? "underweight" : v < 25 ? "healthy weight" : v < 30 ? "overweight" : "obese";
    return out(`BMI = ${F(kg, 1)} kg ÷ (${F(hm0, 2)} m)² = ${F(v, 1)} (the ${band} range).`, {kind: "num", value: v});
  }
  function factorQ(s){
    const m = /^(?:factor(?:i[sz]e)?|factorise|factorize)\s+(?:the expression\s+)?(.+?)$/.exec(s); if (!m) return null;
    const v = ((m[1].match(/[a-z]/) || [])[0]) || "x", c = poly(m[1], v); if (!c) return null; const [cc, b, a] = c; if (!a) {
      const g = gcd(b, cc); if (!b || !Number.isInteger(b) || !Number.isInteger(cc) || g <= 1) return null; return out(`${m[1]} = ${g}(${term(b / g, 1, v, true)}${signed(cc / g)})`, {kind: "factor", pattern: "common factor"}); }
    const D = b * b - 4 * a * cc; if (D < 0 || !Number.isInteger(Math.sqrt(D))) return out(`${m[1]} doesn't factor over whole numbers (its discriminant, ${F4(D)}, isn't a perfect square).`, {kind: "factor"});
    const r1 = (-b + Math.sqrt(D)) / (2 * a), r2 = (-b - Math.sqrt(D)) / (2 * a), fq = r => { const f = frac(r); return f ? [f[1], -f[0]] : [1, -r]; };
    const [p1, q1] = fq(r1), [p2, q2] = fq(r2), k = a / (p1 * p2);
    const bin = (p, q) => `(${p === 1 ? "" : p}${v}${signed(q)})`;
    const pattern = b === 0 && cc < 0 ? "difference of two squares" : D === 0 ? "perfect square" : null;
    const res = D === 0 ? `${k === 1 ? "" : F4(k)}${bin(p1, q1)}²` : `${k === 1 ? "" : F4(k)}${bin(p1, q1)}${bin(p2, q2)}`;
    return out(`${m[1].replace(/\^2/g, "²")} = ${res}`, {kind: "factor", pattern, steps: pattern === "difference of two squares" ? `It's a difference of two squares: a² − b² = (a − b)(a + b).` : `Find the roots (${F4(r2)} and ${F4(r1)}), then write it as a product of factors.`});
  }
  const SOLVERS = [formulas, chem, factorQ, numbers, dosage, grades, bmi, units, percent, rate, physics, points, chance, stats, geometry, misc, system, equation, arith];
  const NODIG = /^how many \w+|^\w+ (?:are )?in (?:a|an|one) \w+$|\binterior angles?\b|\bangles? (?:of|in) (?:a|an)\b|\b(formula|theorem|ohm'?s law|atomic (?:number|mass|weight)|symbol|molar mass|molecular (?:mass|weight)|balance|derivative|integral|differentiate|integrate|antiderivative|element|factor|factori[sz]e)\b/;
  function solve(q){
    if (NOTSUM.test(String(q || ""))) return null;
    const s = low(q).replace(LEAD, "").replace(/\s+/g, " ").trim(), full = low(q);
    if (!s || s.length > 200 || !/\d/.test(s) && !NODIG.test(s)) return null;
    RAWQ = String(q);
    if (/\b(due|remind me|deadline|schedule|reschedule|mark (?:it|them|both|as|that)|mark \w+(?: \w+)? (?:done|complete))\b/.test(s)) return null;
    for (const f of SOLVERS) { let r = null; try { r = f(s) || (s !== full ? f(full) : null); } catch (e) { r = null; } if (r) { r.math.q = String(q); return r; } }
    return null;
  }

  // ---------- follow-ups on the last maths answer ----------
  // A follow-up has to be about the last answer: "why did Hitler invade Poland" after a sum is a new question, not "show your work".
  // Words a maths follow-up uses; any other content word (not in the last question either) means the message is about something else.
  const FWORDS = new Set(("why how come what whats what's when where which who does did do done is isn't isnt are aren't arent was wasnt wasn't were it its it's that thats that's this those these them they the a an and or but so then now ok okay also again same instead "
    + "you your you're i i'm im me my we our can could would should will wont won't not no yes yeah really sure right wrong mean means meant get got getting give gave make made find found work worked working works out answer answers result results number numbers value values "
    + "show tell explain walk through break down step steps calculate calculated calculation calc check verify prove figure figured just about if with for from of to in into on at by per as than more less much many each every one two three half twice double triple quarter "
    + "plus minus times multiply multiplied multiplying divide divided dividing division add added adding subtract subtracted subtraction sum total difference product quotient remainder square squared cube cubed root sqrt power powers exponent percent percentage fraction decimal round rounded "
    + "average mean median mode range spread deviation variance sample population stats statistic statistics score scores grade grades points point need needed overall final exam test weight weighted "
    + "area perimeter circumference diameter radius volume surface diagonal hypotenuse side sides length width height base angle angles degree degrees triangle circle square rectangle shape line slope midpoint distance equation formula solve solution solutions solved term terms "
    + "inch inches foot feet yard yards mile miles meter meters metre metres centimeter centimeters kilometer kilometers gram grams kilogram kilograms pound pounds ounce ounces liter liters litre litres cup cups second seconds minute minutes hour hours day days week weeks month months year years "
    + "celsius fahrenheit kelvin speed fast faster rate time long far mass heavy energy mole moles molar drop drops dose dosage element symbol latin name called pattern rule type kind interest simple compound rolls roll dice coin heads tails least common factor factors multiple "
    + "order operations brackets parentheses left first next last other different differ equal bigger smaller larger lower higher up go goes going come comes came").split(/\s+/));
  function offTopic(raw, prev){
    const own = new Set(String(prev.q || "").toLowerCase().match(/[a-z']+/g) || []);
    // units ("gtt", "mL") and element names ("what about oxygen?") are maths words too
    const known = w => FWORDS.has(w) || own.has(w) || U[w] || TEMP[w] || /^(gtt|mcg|mg|ml|kg|lb|lbs|hr|hrs|min|mins|sec|secs|tab|tabs|tablets?|units?|mph|kph|km|cm|mm|ft)$/.test(w) || EL.some(e => e.name.toLowerCase() === w);
    const extra = (raw.match(/[a-z][a-z']*/g) || []).filter(w => w.length > 2 && !known(w));
    return extra.length >= 2 || (extra.length === 1 && !/\d/.test(raw) && !/\b(that|it|this|those|these|answer|result)\b/.test(raw));
  }
  const STEPS = /\b(show (?:me )?(?:your |the )?(?:work|working|steps|math|maths|calculation)|how did you (?:get|work|do|figure)|explain (?:that|it|the answer|how|your answer)|step by step|walk me through|break it down|how(?:'s| is| was) that (?:calculated|worked out)|show the steps|the steps|how\??$|why\??$)/;
  function follow(q, prev){
    if (!prev || !prev.kind) return null;
    const s = low(q).replace(/^(?:ok(?:ay)?|cool|thanks|thx|great|nice|and|so|now|then|also|what about|how about|and what about)\b[,!]?\s*/g, "").trim(), raw = low(q);
    const V = prev.value, ans = (a, math) => out(a, Object.assign({q: prev.q}, math));
    // (a follow-up opening, "what about oxygen?", "with a drop factor of 15...", still carries on from the last answer)
    if (offTopic(raw, prev) && !/^\s*(?:and|or|what about|how about|what if|with|then|so|now|ok|okay|also|same for)\b/.test(raw)) return solve(q);
    // a brand-new maths question stands on its own
    const WHY = /^\s*(?:wait\W*|hm+\W*|but\s+)?(why|how come)\b|\bwhy (?:not|isn'?t|wouldn'?t|is it|did)\b/.test(raw);
    // a bare new number ("what about 20%?", "and 300") changes the last question rather than standing alone
    const bare = /^\s*(?:and|or|what about|how about|what if|now|try|with)\b\s*-?\d*\.?\d+\s*(?:%|percent)?\s*$|^\s*-?\d*\.?\d+\s*(?:%|percent)\s*$/.test(raw.replace(/\?+\s*$/, ""));
    const fresh = WHY || bare ? null : solve(q); if (fresh) return fresh;
    if (WHY && prev.why) return ans(prev.why, prev);
    if (WHY && prev.kind === "rate2") { const sp = prev.legs.map(([d, h]) => d / h), avgS = sp.reduce((x, y) => x + y, 0) / sp.length, same = Math.abs(avgS - prev.value) < 1e-9;
      return ans(same ? `Here it is the same: you drove each speed (${sp.map(x => F4(x)).join(" and ")} mph) for the same time, so their average, ${F4(avgS)}, matches total distance ÷ total time (${F(prev.legs.reduce((x, l) => x + l[0], 0))} ÷ ${F(prev.legs.reduce((x, l) => x + l[1], 0))} = ${F4(prev.value)}). The two only differ when you spend different amounts of time at each speed, and then total distance ÷ total time is the right one.` : `Because you spent more time at the slower speed. Average speed is total distance ÷ total time (${F4(prev.value)}), and the plain average of the speeds (${F4(avgS)}) ignores how long each lasted.`, prev); }
    if (WHY && prev.kind === "num" && prev.expr && !/!/.test(prev.expr)) { const alt = nums(raw)[0], toks = String(prev.expr).replace(/\s+/g, "").match(/\d*\.?\d+|[-+*/^()]/g) || [];
      let lr = null; try { if (!/[()^]/.test(prev.expr)) { lr = Number(toks[0]); for (let i = 1; i + 1 < toks.length; i += 2) { const b = Number(toks[i + 1]); lr = toks[i] === "+" ? lr + b : toks[i] === "-" ? lr - b : toks[i] === "*" ? lr * b : lr / b; } } } catch (e) {}
      return ans(`${alt != null && lr != null && Math.abs(lr - alt) < 1e-9 ? `${F(alt)} is what you get working straight left to right, but maths has an order: brackets, then powers, then × and ÷, then + and −. ` : alt != null ? `It isn't ${F(alt)}. ` : ""}${workOut(prev.expr, V)}`, prev); }
    // follow-ups that need the last problem's own numbers
    { const n1 = (s.match(/-?\d*\.?\d+/) || [])[0], N1 = n1 != null ? Number(n1) : null;
      if (prev.kind === "score" && N1 != null && /\b(need|points?|get|for|to get|reach)\b/.test(s)) { const need = N1 / 100 * prev.of, more = need - prev.got;
        return ans(more <= 0 ? `You already have ${F(N1)}%: ${F(prev.got)}/${F(prev.of)} is ${F(prev.value, 2)}%.` : `For ${F(N1)}% you'd need ${F(need, 2)} out of ${F(prev.of)}, so ${F(Math.ceil(more - 1e-9))} more point${Math.ceil(more - 1e-9) === 1 ? "" : "s"}${Number.isInteger(R(need)) ? "" : ` (${F(need, 2)} exactly)`}.`, Object.assign({}, prev, {steps: `${F(N1)}% of ${F(prev.of)} = ${F(need, 2)}; ${F(need, 2)} − ${F(prev.got)} = ${F(more, 2)}.`})); }
      if (prev.kind === "wavg" && N1 != null && /\b(need|get|overall|final|to have|for)\b/.test(s)) {
        const it = prev.items.find(x => x.name && s.includes(x.name.split(" ").pop())) || prev.items.reduce((a, b) => b.w > a.w ? b : a), W = prev.items.reduce((a, x) => a + x.w, 0);
        const rest = prev.items.filter(x => x !== it).reduce((a, x) => a + x.score * x.w, 0), need = (N1 * W - rest) / it.w;
        return ans(need > 100 ? `You'd need ${F(need, 2)}% on the ${it.name || "that one"} to get ${F(N1)}% overall, which isn't possible without extra credit.` : `You'd need ${F(Math.max(0, need), 2)}% on the ${it.name || "that one"} to get ${F(N1)}% overall.`, Object.assign({}, prev, {steps: `${F(N1)} × ${F(W)}% = ${F(N1 * W / 100, 2)} needed in total; the others give ${F(rest / 100, 2)}; the rest (${F((N1 * W - rest) / 100, 2)}) ÷ ${F(it.w)}% = ${F(need, 2)}.`})); }
      if (prev.kind === "iv" && /\b(gtt|drops?|drop factor)\b/.test(s) && N1 != null) { const g = prev.ml * N1 / prev.min;
        return ans(`With a drop factor of ${F(N1)} gtt/mL that's ${F(g, 1)} gtt/min (round to ${Math.round(g)} gtt/min).`, Object.assign({}, prev, {value: g, steps: `gtt/min = ${F(prev.ml)} mL × ${F(N1)} gtt/mL ÷ ${F(prev.min)} min = ${F(g, 2)}.`})); }
      if (prev.kind === "interest" && /\b(simple|compound|compounded)\b/.test(s)) { const r = interest(prev.P0, prev.p, prev.n, !/\bsimple\b/.test(s)); return Object.assign(r, {math: Object.assign(r.math, {q: prev.q})}); }
      if (prev.kind === "num" && prev.xs && /\b(lcm|least common|lowest common|gcf|gcd|hcf|greatest common|highest common)\b/.test(s)) { const g = prev.xs.reduce(gcd), l = prev.xs.reduce((a, b) => a * b / gcd(a, b));
        return /\b(lcm|least|lowest)\b/.test(s) ? ans(`The least common multiple of ${prev.xs.join(", ")} is ${l}.`, Object.assign({}, prev, {value: l, steps: `LCM = product ÷ GCF = ${prev.xs.reduce((a, b) => a * b)} ÷ ${g} = ${l}${prev.xs.length > 2 ? " (taken a pair at a time)" : ""}.`})) : ans(`The greatest common factor of ${prev.xs.join(", ")} is ${g}.`, Object.assign({}, prev, {value: g})); }
      if (prev.kind === "z" && /\b(mean|means|tell|interpret|good|normal|percentile|so what)\b/.test(s)) { const z = prev.value, a = Math.abs(z);
        return ans(`A z score of ${F4(z)} means ${F(prev.x)} is ${F4(a)} standard deviation${a === 1 ? "" : "s"} ${z >= 0 ? "above" : "below"} the mean of ${F(prev.mu)}. ${a < 1 ? "That's well within the usual range." : a < 2 ? `That's ${z > 0 ? "above" : "below"} average but not unusual: about ${z > 0 ? "84 to 98" : "2 to 16"}% of values are below it in a normal curve.` : "That's unusual: fewer than about 2.5% of values are that far out on that side."}`, prev); }
      if (prev.kind === "poly" && /\b(each|one|every|single|regular)\b/.test(s) && /\b(angle|one|each)\b/.test(s)) { const sum = (prev.n - 2) * 180; return ans(`Each interior angle of a regular ${prev.name} is ${F4(sum / prev.n)}°.`, Object.assign({}, prev, {value: sum / prev.n, steps: `${sum}° ÷ ${prev.n} equal angles = ${F4(sum / prev.n)}°.`})); }
      if (prev.kind === "func") { const fm = new RegExp(`\\b${prev.name}\\(\\s*(-?\\d*\\.?\\d+)\\s*\\)`).exec(s) || (N1 != null && /\b(what about|and|if|for|at|now)\b|^-?\d/.test(raw) ? [null, n1] : null);
        if (fm) { const r = fval(prev.expr, prev.v, Number(fm[1])); if (r != null) return ans(`${prev.name}(${fm[1]}) = ${F(r)}`, Object.assign({}, prev, {value: r, steps: `Put ${fm[1]} in for ${prev.v}: ${prev.expr.replace(new RegExp(prev.v, "g"), `(${fm[1]})`)} = ${F(r)}.`})); } }
      if (prev.kind === "calc" && /x/.test(s) && !/\b(derivative|integral|differentiate|integrate)\b/.test(s)) { const r = calculus(s.replace(/^.*?(?=[-\d(x])/, ""), prev.op); if (r) return r; }
      if (prev.kind === "ke" && /\b(twice|double|half|triple|\d+ times) (as )?(fast|speed|quick|heavy|mass|the speed|the mass)\b|\b(twice|double|half|triple) the (speed|velocity|mass)\b/.test(s)) {
        const k = /half/.test(s) ? 0.5 : /triple/.test(s) ? 3 : /(\d+) times/.test(s) ? Number(/(\d+) times/.exec(s)[1]) : 2, sp = /fast|speed|quick|velocity/.test(s);
        const kg = sp ? prev.kg : prev.kg * k, v = sp ? prev.vel * k : prev.vel, E = 0.5 * kg * v * v;
        return ans(`KE = ½ × ${F(kg)} × ${F(v)}² = ${F(E)} J, ${sp ? `${F(k * k)} times as much: energy goes with the speed squared` : `${F(k)} times as much: energy goes up in step with the mass`}.`, {kind: "ke", kg, vel: v, value: E}); }
      if ((prev.kind === "molar" || prev.kind === "chemf") && /\b(moles?|mol|grams?|g)\b/.test(s) && N1 != null) { const M = prev.value;
        if (/\b(\d*\.?\d+)\s*(?:g|grams?)\b/.test(s) && /\bmoles?|mol\b/.test(s.replace(/(\d*\.?\d+)\s*(?:g|grams?)/, ""))) { const g = Number(/(\d*\.?\d+)\s*(?:g|grams?)\b/.exec(s)[1]), n = g / M; return ans(`${F(g)} g of ${prev.f} is ${F4(n)} mol.`, Object.assign({}, prev, {steps: `moles = mass ÷ molar mass = ${F(g)} ÷ ${F(M, 3)} = ${F4(n)}.`})); }
        if (/\b(\d*\.?\d+)\s*(?:moles?|mol)\b/.test(s)) { const n = Number(/(\d*\.?\d+)\s*(?:moles?|mol)\b/.exec(s)[1]), g = n * M; return ans(`${F(n)} mol of ${prev.f} is ${F(g, 2)} g.`, Object.assign({}, prev, {steps: `mass = moles × molar mass = ${F(n)} × ${F(M, 3)} = ${F(g, 2)} g.`})); } }
      if (prev.kind === "elem") { const e = EL.find(x => new RegExp(`\\b${x.name.toLowerCase()}\\b`).test(s)); if (e) return elem(e, prev.what);
        if (/\b(why|how come|where|from)\b/.test(s) && LATIN[prev.sym]) return ans(`${prev.sym} comes from its Latin name, ${LATIN[prev.sym]}. A few elements use Latin symbols like that: Na (natrium, sodium), K (kalium, potassium), Fe (ferrum, iron), Cu (cuprum, copper), Ag (argentum, silver), Au (aurum, gold), Pb (plumbum, lead).`, prev); }
      if (prev.kind === "coin" && /\b(heads?|tails?|all|none|no)\b/.test(s)) { const r = coin(s, prev.n); if (r) return r; }
      if (prev.kind === "dice" && /\b(at least|in a row|twice|times|rolls?)\b/.test(s)) { const nn = WN((/(\d+|two|three|four|five|six|ten|twice|thrice)\s*(?:rolls|times|dice)/.exec(s) || /\b(twice|thrice)\b/.exec(s) || [])[1]) || prev.n; const r = dice(s, prev.f, nn); if (r) return r; }
      if (prev.kind === "factor" && /\b(called|name|pattern|rule|type|kind)\b/.test(s)) return ans(prev.pattern ? `That's the ${prev.pattern} pattern${prev.pattern === "difference of two squares" ? ": a² − b² = (a − b)(a + b)" : prev.pattern === "perfect square" ? ": a² ± 2ab + b² = (a ± b)²" : ""}.` : "It's ordinary factoring: find two numbers that multiply to c and add to b.", prev);
      if (prev.kind === "num" && prev.expr && /!/.test(prev.expr) && /\b(why|how|really|mean)\b/.test(raw)) return ans(/(^|[^\d])0!/.test(prev.expr) ? "0! is 1 by definition: there's exactly one way to arrange nothing, and it keeps the rule n! = n × (n − 1)! working (1! = 1 × 0!, so 0! has to be 1)." : `n! multiplies every whole number from n down to 1: ${prev.expr.replace(/(\d+)!/, (x, n) => `${n}! = ${Array.from({length: Number(n)}, (_, i) => Number(n) - i).join(" × ")}`)}.`, prev);
    }
    // why the two percent changes differ
    if (prev.kind === "pctchg" && /\b(why|same|different|differ|not equal)\b/.test(raw)) return ans(`Because each percent is worked out from a different starting value. Going up from ${F(prev.b < prev.a ? prev.b : prev.a)}, the change is compared with ${F(prev.b < prev.a ? prev.b : prev.a)}; going down from ${F(prev.b < prev.a ? prev.a : prev.b)}, the same difference (${F(Math.abs(prev.b - prev.a))}) is compared with the bigger number, so it's a smaller percent.`, prev);
    if (prev.kind === "stats" && /\b(difference between (?:those|the) two|population (?:vs|or|and) sample|which one|why two|sample|population)\b/.test(raw)) return ans("Population standard deviation divides by n and describes exactly the numbers you have. Sample standard deviation divides by n − 1 and is used when your numbers are a sample from a bigger group: dividing by a slightly smaller number makes it a bit bigger, which corrects for a sample usually underestimating the spread. In class, use sample unless you're told the numbers are the whole population.", prev);
    if (prev.kind === "unit" && prev.formula && /\b(formula|equation|how|work|steps|why)\b/.test(raw)) return ans(`The formula is ${prev.formula}.`, prev);
    // show your work / how / why
    if (STEPS.test(raw) || /\b(check|verify|prove)\b/.test(raw)) {
      if (prev.kind === "eq" && /\b(check|verify|prove|sure|right)\b/.test(raw) && prev.sols.length) {
        const [c0, c1, c2] = prev.c, v = prev.v;
        return ans(`Put each answer back into the equation and see that both sides match:\n${prev.sols.map(x => `- ${v} = ${F4(x)}: ${c2 ? `${F4(c2)}(${F4(x)})² ` : ""}${c1 ? `${c2 ? (c1 < 0 ? "− " : "+ ") + F4(Math.abs(c1)) : F4(c1)}(${F4(x)}) ` : ""}${c0 < 0 ? "− " + F4(-c0) : "+ " + F4(c0)} = ${F4(c2 * x * x + c1 * x + c0)}, so it works.`).join("\n")}`, prev);
      }
      if (prev.steps) return ans(prev.steps, prev);
      if (prev.kind === "num" && prev.expr) return ans(workOut(prev.expr, V), prev);
      if (prev.kind === "geo") return ans(`Use the formula, then put the numbers in: ${SHAPE[prev.shape](prev.d, prev.ask)[0]}.`, prev);
      if (prev.kind === "unit") return ans(`Multiply by how many ${uname(U[prev.to] || {name: prev.to})} are in one ${(U[prev.from] || {name: prev.from}).name}: ${F(prev.v)} × ${F4(prev.factor)} = ${F4(prev.value)}.`, prev);
    }
    // as a fraction / decimal / percent
    if (V != null && /\b(as|in|to) (?:a )?(fraction|decimal|percent|percentage|%)\b|^(?:a )?(fraction|decimal|percent|percentage)\??$/.test(s)) {
      const k = (s.match(/fraction|decimal|percent|percentage|%/) || [])[0];
      if (k === "fraction") { const f = fracStr(V); return ans(f ? `${F(V)} = ${f}` : Number.isInteger(R(V)) ? `${F(V)} is a whole number (${F(V)}/1).` : `${F(V)} doesn't make a simple fraction.`, {kind: "num", value: V}); }
      if (k === "decimal") return ans(`${F(V)}`, {kind: "num", value: V});
      return ans(`${F(V)} = ${F(V * 100)}%`, {kind: "num", value: V * 100, expr: `${V}*100`});
    }
    if (prev.kind === "stats" && /\b(need|get|have)\b/.test(s) && /\b(average|mean|avg)\b/.test(s)) { const T = nums(s.replace(/\b\d+(?:st|nd|rd|th)\b/g, " ")).pop(); if (T != null) { const n = prev.xs.length + 1, sum = prev.xs.reduce((a, b) => a + b, 0), need = T * n - sum;
      return ans(`You'd need ${F(need, 2)} on the next one to average ${F(T)} over ${n}${need > 100 ? " (more than 100, so out of reach without extra credit)" : ""}.`, Object.assign({}, prev, {steps: `An average of ${F(T)} over ${n} means a total of ${F(T)} × ${n} = ${F(T * n)}. You have ${F(sum)} so far, so ${F(T * n)} − ${F(sum)} = ${F(need, 2)}.`})); } }
    // another statistic of the same list
    if (prev.kind === "stats") { const m = STATW.exec(s); if (m && nums(s).length < 2) { const r = statOf(m[1], prev.xs); if (r) return ans(r[0] + ".", {kind: "stats", xs: prev.xs, stat: m[1], value: r[1], steps: r[2]}); } }
    // another measure of the same shape: "circumference?", "and the volume?"
    if (prev.kind === "geo" && /\b(area|circumference|perimeter|diameter|radius|volume|surface|diagonal|hypotenuse)\b/.test(s) && !nums(s).length) { const r = SHAPE[prev.shape](prev.d, s); if (r) return ans(r[0] + ".", {kind: "geo", shape: prev.shape, d: prev.d, value: r[1], ask: s}); }
    // the line through the same two points: "what's the equation of that line?", "midpoint?", "distance?"
    if (prev.kind === "line" && /\b(equation|formula|line|midpoint|middle|distance|how far|slope|y ?=)\b/.test(s)) { const r = lineAns(s, prev.ps); if (r) return r; }
    // a rate with a new distance or time: "how long would 210 miles take?"
    if (prev.kind === "rate" && prev.speed) {
      const d = /(\d*\.?\d+)\s*(miles?|mi|km|kilometers?|kilometres?)\b/.exec(s), t = /(\d*\.?\d+)\s*(hours?|hrs?|minutes?|mins?)\b/.exec(s);
      if (d && !t) { const h = Number(d[1]) / prev.speed; return ans(`${d[1]} ${prev.u} at ${F(prev.speed)} ${prev.sunit} takes ${hm(h)}.`, Object.assign({}, prev, {value: h, steps: `Time = distance ÷ speed = ${d[1]} ÷ ${F(prev.speed)} = ${F4(h)} hours.`})); }
      if (t && !d) { const h = Number(t[1]) / (/^m/.test(t[2]) ? 60 : 1), v = prev.speed * h; return ans(`At ${F(prev.speed)} ${prev.sunit} for ${F(h)} hours, you'd go ${F4(v)} ${prev.u}.`, Object.assign({}, prev, {value: v, steps: `Distance = speed × time = ${F(prev.speed)} × ${F(h)} = ${F4(v)}.`})); }
    }
    // the same conversion in other units: "in a week?" (how many seconds in a day), "in kelvin?", "what about 200?"
    if (prev.kind === "unit") {
      const um = new RegExp(`(?:^|\\b(?:in|to|into)\\s+(?:a |an |one )?)(?:(-?\\d*\\.?\\d+)\\s*)?(?:°\\s*|degrees?\\s+)?(${UN})$`).exec(s);
      if (um && (U[um[2]] || TEMP[um[2]])) {
        const n0 = um[1] != null ? Number(um[1]) : null, same = (a, b) => (U[a] && U[b] && U[a].dim === U[b].dim) || (TEMP[a] && TEMP[b]);
        if (same(um[2], prev.from) || same(um[2], prev.to)) {
          if (prev.how === "many") { const r = /\bin\b/.test(s) || n0 != null ? convert(n0 != null ? n0 : 1, um[2], prev.to, "many") : convert(prev.v, prev.from, um[2], "many"); if (r) return Object.assign(r, {math: Object.assign(r.math, {q: prev.q})}); }
          const r = /\b(in|to|into)\b/.test(s) && n0 == null ? convert(prev.v, prev.from, um[2], "convert") : convert(n0 != null ? n0 : prev.v, um[2], prev.to, "convert"); if (r) return r;
        }
      }
    }
    // "now what if it's 3x instead": swap the matching term of the equation
    if (prev.kind === "eq") {
      const t = new RegExp(`(?:^|[^a-z])(\\d*\\.?\\d*)\\s*${prev.v}(\\^2|²)?(?![a-z])`).exec(s);
      if (t && /\b(instead|what if|if it'?s|change|make it|swap)\b/.test(raw)) {
        const pw = t[2] ? "(?:\\^2|²)" : "(?![\\^²])", nq = prev.src.replace(new RegExp(`\\d*\\.?\\d*${prev.v}${pw}`), t[1] + prev.v + (t[2] ? "^2" : ""));
        if (nq !== prev.src) { const r = equation(low(nq)); if (r) { r.math.q = nq; return r; } }
      }
    }
    // a new number in the same question: "what about 200?", "and 15% of 120?", "what if legs are 5 and 12", "from 65 back to 50?"
    const xs = nums(s.replace(/^\s*(?:and|what about|how about|what if)\b/, ""));
    if (prev.q && xs.length && !WHY && !/^\s*[-\d.,\s]+$/.test(raw) && !/\b(that|it|this|the answer|the result|split|share|ways|each|per|between|among|total|need|needed|get|times|plus|minus|add|subtract|double|half)\b/.test(raw) && (/^\s*(?:and|or|what about|how about|what if|now|ok|okay|so|then|with|for|if|try|same|redo|do)\b/.test(raw) || s.split(/\s+/).length <= 4)) {
      const old = nums(low(prev.q));
      if (old.length && xs.length <= old.length) {
        let k = 0; const pq = low(prev.q), np = /%|percent/.test(s), hasP = /\d\s*(?:%|percent)/.test(pq);
        // one new number into a percent question goes where it fits: "what about 200?" after "15% of 80" is 15% of 200; "what about 20%?" is 20% of 80
        let done = false; const nq = xs.length === 1 && hasP && old.length === 2 ? pq.replace(/-?\d*\.?\d+(\s*(?:%|percent))?/g, (x, p) => !done && !!p === np ? (done = true, String(xs[0]) + (p || "")) : x)
          : pq.replace(/-?\d*\.?\d+/g, x => k < xs.length ? String(xs[k++]) : x);
        const r = solve(nq); if (r && nq !== low(prev.q)) return r;
      }
    }
    // keep going from the last result: "divide that by 3", "now double it", "add 10", "what's that squared", "15% of that", "then 8% tax on that?"
    if (V != null && isFinite(V)) {
      const n0 = (s.match(/-?\d*\.?\d+/) || [])[0], N = n0 != null ? Number(n0) : null;
      const pct = /%|percent/.test(s) && N != null;
      const op = pct && /\b(tax|tip|markup|increase|more|add|plus|interest|on top)\b/.test(s) ? [`+ ${N}%`, V * (1 + N / 100), true, `${F(V)} + ${N}% of ${F(V)} = ${F(V)} + ${F(V * N / 100)}`]
        : pct && /\b(off|discount|less|decrease|minus|reduce|lower)\b/.test(s) ? [`− ${N}%`, V * (1 - N / 100), true, `${F(V)} − ${N}% of ${F(V)} = ${F(V)} − ${F(V * N / 100)}`]
        : pct ? [`× ${N}%`, V * N / 100, true]
        : /\b(divide|divided|split|share|shared|over|between|among|each)\b/.test(s) && N ? ["÷", V / N] : /\b(multiply|multiplied|times)\b/.test(s) && N != null ? ["×", V * N] : /\b(add|plus|more)\b/.test(s) && N != null ? ["+", V + N]
        : /\b(subtract|minus|take away|less)\b/.test(s) && N != null ? ["−", V - N] : /\b(double|twice)\b/.test(s) ? ["× 2", V * 2, true] : /\btriple\b/.test(s) ? ["× 3", V * 3, true] : /\b(half|halve)\b/.test(s) ? ["÷ 2", V / 2, true]
        : /\bsquare root\b|\bsqrt\b|\broot of\b/.test(s) ? ["√", Math.sqrt(V), true, `√${F(V)}`] : /\bsquared?\b/.test(s) ? ["²", V * V, true] : /\bcubed?\b/.test(s) ? ["³", V ** 3, true]
        : /\bto the (?:power of )?(\d+)/.test(s) ? ["^", V ** Number(/\bto the (?:power of )?(\d+)/.exec(s)[1]), true, `${F(V)}^${/\bto the (?:power of )?(\d+)/.exec(s)[1]}`] : /\bround\b/.test(s) ? ["rounded", Math.round(V), true, `${F(V)} rounded`]
        : /^[-+*/×÷x]\s*\d/.test(s) ? [s[0].replace(/[*x]/, "×").replace("/", "÷"), (() => { try { return calc(`(${V})${s.replace(/[x×]/g, "*").replace(/÷/g, "/")}`); } catch (e) { return null; } })()] : null;
      if (op && op[1] != null && isFinite(op[1]) && (/\b(that|it|this|the answer|the result|now|then|and)\b/.test(raw) || /^\s*(divide|multiply|add|subtract|double|triple|halve|half|square|cube|round|times|plus|minus|split|share|[-+*/×÷x]\s*\d)/.test(s) || pct)) {
        const shown = op[3] || (op[2] ? (/^[²³]$/.test(op[0]) ? `${NV(V)}${op[0]}` : `${NV(V)} ${op[0]}`) : `${NV(V)} ${op[0]} ${F(N)}`);
        const why = pct && /−/.test(op[0]) ? `Because the ${N}% is taken from ${F(V)} this time, not from the starting number, so ${F(V * N / 100)} comes off, more than was added. Going up a percent and then down the same percent always leaves you a little lower.` : pct && /\+/.test(op[0]) ? `Because the ${N}% is worked out from ${F(V)}, the new number, not the original.` : null;
        return out(eq(shown, op[1]), {kind: "num", value: op[1], expr: `${V}`, q: prev.q, why, steps: `${shown} = ${F(op[1])}.`});
      }
    }
    return null;
  }
  // show the working for a sum: brackets, powers, then × and ÷ left to right, then + and −, one step a line
  function workOut(expr, v){
    const steps = []; let e = String(expr).replace(/\s+/g, "");
    const fmt = x => show(x).replace(/\s+/g, " ");
    const once = re => { const m = re.exec(e); if (!m) return false; let r; try { r = calc(m[0]); } catch (x) { return false; } steps.push(`${fmt(m[0])} = ${F(r)}`); e = e.slice(0, m.index) + (r < 0 && m.index > 0 ? `(${R(r)})` : String(R(r))) + e.slice(m.index + m[0].length); return true; };
    for (let k = 0; k < 30; k++) {
      if (once(/\((?:-?\d*\.?\d+[-+*/^])+-?\d*\.?\d+\)/)) continue;
      if (/^\(-?\d*\.?\d+\)$/.test(e) || /^-?\d*\.?\d+$/.test(e)) break;
      e = e.replace(/\((-?\d*\.?\d+)\)/g, "$1");
      if (once(/(?:sqrt|cbrt)\(?-?\d*\.?\d+\)?|\d*\.?\d+\^-?\d*\.?\d+/)) continue;
      if (once(/-?\d*\.?\d+[*/]-?\d*\.?\d+/)) continue;
      if (once(/-?\d*\.?\d+[-+]-?\d*\.?\d+/)) continue;
      break;
    }
    if (steps.length < 2) return `${fmt(expr)} = ${F(v)}. Order of operations: brackets first, then powers and roots, then × and ÷ left to right, then + and − left to right.`;
    return `Step by step (brackets, then powers, then × and ÷ left to right, then + and −):\n${steps.map((x, i) => `${i + 1}. ${x}`).join("\n")}\nSo the answer is ${F(v)}.`;
  }
  // looks like maths but nothing here could work it out ("integrate x^2", "prove that..."): the AI works it, never the web
  // something to remember or a range of chapters is never a sum ("remember that Dr. Chen said the midterm covers chapters 1-6")
  const NOTSUM = /^\s*(?:can you |please |pls )?(?:remember|note that|make a note|keep in mind|fyi|just so you know|heads up|my (?:prof|professor|teacher|instructor)\b|(?:dr|prof|professor|mr|ms|mrs)\.?\s+\w+\s+(?:said|says|told))|\b(?:chapters?|ch|pages?|pp|units?|weeks?|lectures?|modules?|sections?|slides?|questions?|problems?|lessons?)\.?\s*\d+\s*(?:-|–|to|through|thru)\s*\d+/i;
  const mathy = q => { if (NOTSUM.test(String(q || ""))) return false; const s = low(q); return /\d\s*[-+*/^=×÷]\s*[\d(a-z]|\b(how many|how much|how long|total|altogether|in all|per|each|limit|probability|chance|odds|ratio|rate|solve|simplify|factor|derivative|differentiate|integrate|integral|equation|calculate|compute|square root|sqrt|percent|percentage|fraction|decimal|average|mean|median|mode|standard deviation|probability|hypotenuse|slope|area of|volume of|perimeter|circumference|convert|how many \w+ (are )?in)\b/.test(s) && /\d/.test(s); };

  window.SBMATH = {solve, follow, mathy, calc};
})();
