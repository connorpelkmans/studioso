// Unit tests for the calculator's arithmetic (the block between /*CALC-START*/ and /*CALC-END*/ in 99-calculator.js):
// keys -> a math.js expression -> the answer, with the vendored math.js. The window and keyboard are in calculator.e2e.js
"use strict";
const assert = require("assert"), fs = require("fs"), path = require("path");
const src = fs.readFileSync(path.join(__dirname, "../src/js/99-calculator.js"), "utf8");
const i = src.indexOf("/*CALC-START*/"), j = src.indexOf("/*CALC-END*/"); assert(i >= 0 && j > i, "markers");
const math = require("../vendor/mathjs-15.1.1/math.js");
const S = {hyp: false};
const K = new Function("window", "loadScript", "S", src.slice(i, j) + ";return {loadMath, toMath, tokenFor, C};")({math}, null, S);
let n = 0;
(async () => {
  const M = await K.loadMath();
  const run = keys => { let e; try { e = K.toMath(keys.split(" ").map(k => K.tokenFor(k))); } catch (x) { return "Syntax ERROR"; } try { const v = M.evaluate(e, {Ans: 7, M: 0}); return typeof v === "number" && isFinite(v) ? Number(v.toPrecision(10)) : "Math ERROR"; } catch (x) { return /Math|Cannot convert|complex|Infinity/i.test(x.message) ? "Math ERROR" : "Syntax ERROR"; } };   // as evaluate() in 99-calculator.js
  const eq = (keys, want, what) => { n++; assert.deepStrictEqual(run(keys), want, `${what || keys}: got ${run(keys)}`); };
  eq("5 ncr 2", 10, "5 nCr 2");
  eq("5 npr 2", 20, "5 nPr 2");
  eq("3 sq ncr 2", 36, "3² nCr 2");
  eq("3 cube ncr 2", 351, "3³ nCr 2");
  eq("2 inv ncr 1", "Math ERROR", "2⁻¹ nCr 1 (0.5 nCr 1)");
  eq("5 fact ncr 2", 7140, "5! nCr 2");
  eq("3 fact npr 2", 30, "3! nPr 2");
  eq("sqrt 4 rp ncr 2", 1, "√4) nCr 2");
  eq("sqrt 1 6 rp ncr 2", 6, "√16) nCr 2");
  eq("lp 1 add 3 rp ncr 2", 6, "(1+3) nCr 2");
  eq("2 pow 3 ncr 2", 28, "2^3 nCr 2");
  eq("1 0 ncr 3 add 2", 122, "10 nCr 3 + 2");
  eq("2 mul 5 ncr 2", 20, "2 × 5 nCr 2");
  eq("5 ncr 2 sq", 5, "5 nCr 2² (the x² is the 2's)");
  eq("5 ncr 2 ncr 2", 45, "nCr twice, left to right");
  eq("5 ncr lp 1 add 2", 10, "an open bracket after nCr");
  eq("2 root 9", 3, "2 ˣ√ 9");
  eq("2 sq root 1 6", 2, "2² ˣ√ 16");
  eq("ans ncr 2", 21, "Ans nCr 2");
  eq("pi lp 2 rp", Number((2 * Math.PI).toPrecision(10)), "π(2)");
  eq("pi 2", Number((2 * Math.PI).toPrecision(10)), "π2");
  eq("2 pi", Number((2 * Math.PI).toPrecision(10)), "2π");
  eq("0 dot 5 fact", "Math ERROR", "0.5!");
  eq("5 ncr 7", "Math ERROR", "5 nCr 7");
  eq("1 7 1 fact", "Math ERROR", "171! is too big");
  eq("4 fact fact", Number(M.factorial(24).toPrecision(10)), "4!!");
  eq("2 mul mul 3", "Syntax ERROR", "2 × × 3");
  eq("ncr 2", "Syntax ERROR", "nCr with nothing before it");
})().then(() => console.log(`calculator-math.test: ${n} checks passed`)).catch(e => { console.error(e); process.exit(1); });
