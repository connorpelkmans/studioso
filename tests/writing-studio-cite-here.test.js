// Writing Studio, My Doc's Cite Here: the citation's form and place. In the middle of a sentence the authors are part of it ("Ray (2004)",
// MLA "Ray"); at the end of a sentence (next to its full stop, in its last word, at a paragraph's end) or right after a quotation it's the
// one in brackets ("(Ray, 2004)") before the full stop, after the closing quote mark; a full stop inside the quote moves after the citation.
const assert = require("assert");
const s = require("../scripts/app-files").source();
let n = 0; const ok = (c, m) => { n++; assert(c, m); };
const between = (a, b) => { const i = s.indexOf(a), j = s.indexOf(b, i); assert(i >= 0 && j > i, "marker " + a); return s.slice(i + a.length, j); };
const C = new Function(between("/*CITE-START*/", "/*CITE-END*/") + ";return CITE;")();

[["(Lingam et al., 2024)", "Lingam et al. (2024)"], ["(Smith & Lee, 2021)", "Smith and Lee (2021)"], ["(Ray 2004)", "Ray (2004)"], ["(Smith, 2021, p. 4)", "Smith (2021, p. 4)"], ["(Ray, n.d.)", "Ray (n.d.)"], ["(Ray 233)", "Ray"], ["(Ray)", "Ray"], ["[1]", "[1]"]]
  .forEach(([p, w]) => ok(C.narrOf(p) === w, `in a sentence, ${p} is ${w} (${C.narrOf(p)})`));

const o = {paren: "(Ray, 2004)", narr: "Ray (2004)"};
const T = "The paper by provides estimates. Stress makes it worse. He wrote “minds heal bodies.” Then more “it matters” for us\nLast line no stop";
const put = at => { const r = C.citePlace(T, at, o); return [r.kind, C.applyEdits(T, [r.edit]).text]; };
const has = (at, kind, frag, m) => { const [k, out] = put(at); ok(k === kind && out.includes(frag), `${m}: ${k} ${JSON.stringify(out.slice(0, 140))}`); };
has(T.indexOf("provides"), "mid", "The paper by Ray (2004) provides estimates.", "the middle of a sentence: the authors in it, before the word");
has(T.indexOf("provides") + 3, "mid", "The paper by Ray (2004) provides estimates.", "inside a word: before that word");
has(T.indexOf("estimates.") + 9, "end", "provides estimates (Ray, 2004). Stress", "just before the full stop: in brackets, before it");
has(T.indexOf("estimates") + 4, "end", "provides estimates (Ray, 2004). Stress", "in the sentence's last word: the same");
has(T.indexOf("estimates.") + 10, "end", "provides estimates (Ray, 2004). Stress", "just after the full stop: before it");
has(T.indexOf("bodies.”") + 8, "end", "“minds heal bodies” (Ray, 2004). Then", "a full stop inside the quote moves after the citation");
has(T.indexOf("matters”") + 7, "end", "“it matters” (Ray, 2004) for us", "right after a quotation in the middle of a sentence: after the quote mark");
has(T.indexOf("for us") + 6, "end", "for us (Ray, 2004)\nLast", "the end of a paragraph without a full stop");
has(T.length, "end", "no stop (Ray, 2004)", "the end of the text");
ok(C.citePlace(T, 0, o).edit.to === "Ray (2004) ", "the very start: the authors, then a space");
const num = C.citePlace("It works. Done.", 8, {paren: "[3]", narr: "[3]"});
ok(C.applyEdits("It works. Done.", [num.edit]).text === "It works [3]. Done.", "a numbered style: [3] before the full stop");
console.log(`writing-studio-cite-here: ${n} checks passed`);
