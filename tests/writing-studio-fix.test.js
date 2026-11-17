// Writing Studio auto-fix: each fix changes exactly the text it names and nothing else, the issue is gone when the draft is checked again,
// several fixes at once land in the right order, a fix whose text has changed since the check isn't applied, and Add to References puts
// sources into the draft's list (or makes one) in alphabetical order without doubling one that's already there.
const assert = require("assert");
const s = require("../scripts/app-files").source();
let n = 0; const ok = (c, m) => { n++; assert(c, m); };
const between = (a, b) => { const i = s.indexOf(a), j = s.indexOf(b, i); assert(i >= 0 && j > i, "marker " + a); return s.slice(i + a.length, j); };
const CITE = new Function(between("/*CITE-START*/", "/*CITE-END*/") + ";return CITE;")();

const src = [CITE.clean({id: "a", type: "article-journal", title: "Parks and heat", author: [{family: "Smith", given: "J"}], issued: {"date-parts": [[2021]]}}),
  CITE.clean({id: "b", type: "book", title: "Urban trees", author: [{family: "Lee", given: "K"}, {family: "Ng", given: "M"}], issued: {"date-parts": [[2019]]}}),
  CITE.clean({id: "c", type: "webpage", title: "Heat and health", author: [{literal: "World Health Organization"}], issued: {"date-parts": [[2023]]}})];
// the style's own entries (what citeproc gives the app), in its order
const refs = {b: "Lee, K., & Ng, M. (2019). Urban trees.", a: "Smith, J. (2021). Parks and heat.", c: "World Health Organization. (2023). Heat and health."};
const APA = {style: "apa", kind: "author-date", label: "APA", refs};
const chk = (d, o) => CITE.check(d, src, Object.assign({}, APA, o || {}));
const fixOne = (d, re, o) => { const r = chk(d, o), x = r.issues.find(i => re.test(i.t)); assert(x, "issue " + re + " in: " + r.issues.map(i => i.t).join(" | ")); assert(x.edits && x.edits.length, "no fix for " + x.t); return CITE.applyEdits(d, x.edits); };
const has = (d, re, o) => chk(d, o).issues.some(i => re.test(i.t));
// everything outside the changed places is untouched
const sameOutside = (a, b, from, to) => b.startsWith(a.slice(0, from)) && b.endsWith(a.slice(a.length - (a.length - to)));

/* One citation's format */
{ const d = "Parks are cooler (Smith 2021). Lee and Ng (2019) agree.\n\nReferences\nLee, K., & Ng, M. (2019). Urban trees.\nSmith, J. (2021). Parks and heat.";
  const r = fixOne(d, /In APA, write \(Smith, 2021\)/);
  ok(r.n === 1 && r.text === d.replace("(Smith 2021)", "(Smith, 2021)"), "a citation's format: (Smith 2021) becomes (Smith, 2021), nothing else changes");
  ok(!has(r.text, /write \(Smith, 2021\)/), "and checking again, it's gone"); }

/* A group of the same slip: every one of them */
{ const d = "One (Smith 2021). Two (Lee & Ng 2019). Three (World Health Organization 2023).\n\nReferences\nLee, K., & Ng, M. (2019). Urban trees.\nSmith, J. (2021). Parks and heat.\nWorld Health Organization. (2023). Heat and health.";
  const x = chk(d).issues.find(i => /3 citations/.test(i.t)); ok(x && x.edits.length === 3, "a group of three slips has three fixes: " + (x && x.t));
  const r = CITE.applyEdits(d, x.edits);
  ok(r.text === d.replace("(Smith 2021)", "(Smith, 2021)").replace("(Lee & Ng 2019)", "(Lee & Ng, 2019)").replace("(World Health Organization 2023)", "(World Health Organization, 2023)"), "all three fixed in their places: " + r.text.split("\n")[0]);
  ok(!chk(r.text).issues.some(i => i.k === "err"), "nothing left to fix: " + chk(r.text).issues.filter(i => i.k === "err").map(i => i.t).join(" | ")); }

/* A year that isn't the source's */
{ const d = "Parks are cooler (Smith, 2019).\n\nReferences\nSmith, J. (2021). Parks and heat.";
  const r = fixOne(d, /year doesn't match/);
  ok(r.text === d.replace("(Smith, 2019)", "(Smith, 2021)"), "the year becomes the source's: " + r.text.split("\n")[0]);
  ok(!has(r.text, /year doesn't match/), "and the mismatch is gone"); }

/* The list's heading */
{ const d = "Parks are cooler (Smith 21).\n\nBibliography\nSmith, John. \"Parks and heat.\" 2021.";
  const r = fixOne(d, /the list is called Works Cited/, {style: "modern-language-association", kind: "author", label: "MLA"});
  ok(r.text === d.replace("Bibliography", "Works Cited"), "Bibliography becomes Works Cited in MLA"); }

/* A cited source missing from the list: its entry, in alphabetical order */
{ const d = "Parks are cooler (Smith, 2021). Trees help (Lee & Ng, 2019).\n\nReferences\nSmith, J. (2021). Parks and heat.";
  const r = fixOne(d, /Cited but not in your References list: Urban trees/);
  ok(r.text === "Parks are cooler (Smith, 2021). Trees help (Lee & Ng, 2019).\n\nReferences\nLee, K., & Ng, M. (2019). Urban trees.\nSmith, J. (2021). Parks and heat.", "Lee goes before Smith: " + JSON.stringify(r.text.split("References")[1]));
  ok(!has(r.text, /Cited but not in/), "and nothing cited is missing now");
  // with blank lines between entries, the new one gets them too; last in the alphabet goes at the end
  const d2 = "Hot (World Health Organization, 2023). Cool (Lee & Ng, 2019).\n\nReferences\n\nLee, K., & Ng, M. (2019). Urban trees.\n\nSmith, J. (2021). Parks and heat.";
  const r2 = fixOne(d2, /Cited but not in your References list: Heat and health/);
  ok(r2.text.endsWith("Smith, J. (2021). Parks and heat.\n\nWorld Health Organization. (2023). Heat and health."), "after the last entry, with the list's own spacing: " + JSON.stringify(r2.text.slice(-90))); }

/* No list at all: one made from the cited sources */
{ const d = "Parks are cooler (Smith, 2021). Trees help (Lee & Ng, 2019).";
  const r = fixOne(d, /No References list found/);
  ok(r.text === d + "\n\nReferences\nLee, K., & Ng, M. (2019). Urban trees.\nSmith, J. (2021). Parks and heat.", "a References list of the cited sources, in the style's order: " + JSON.stringify(r.text.slice(d.length)));
  ok(!chk(r.text).issues.some(i => i.k === "err"), "and the draft checks clean"); }

/* An entry that isn't in the style's form: the right one in its place */
{ const d = "Parks are cooler (Smith, 2021).\n\nReferences\nSmith, J. 2021. Parks and Heat";
  const x = chk(d).issues.find(i => /fix the entry for Smith/.test(i.t));
  ok(x && x.edits && x.edits.length === 1, "a wrong entry has a fix");
  const r = CITE.applyEdits(d, x.edits);
  ok(r.text === "Parks are cooler (Smith, 2021).\n\nReferences\nSmith, J. (2021). Parks and heat.", "the entry is the style's: " + JSON.stringify(r.text.split("\n").pop()));
  ok(!has(r.text, /fix the entry/), "and it checks clean"); }

/* The list's order */
{ const d = "Parks (Smith, 2021). Trees (Lee & Ng, 2019).\n\nReferences\nSmith, J. (2021). Parks and heat.\nLee, K., & Ng, M. (2019). Urban trees.";
  const r = fixOne(d, /isn't in alphabetical order/);
  ok(r.text === "Parks (Smith, 2021). Trees (Lee & Ng, 2019).\n\nReferences\nLee, K., & Ng, M. (2019). Urban trees.\nSmith, J. (2021). Parks and heat.", "the entries in order, each exactly as written");
  ok(!has(r.text, /alphabetical/), "and in order now"); }

/* Issues with no single right answer have no fix */
{ const d = "Others disagree (Johnson, 2018). As one study put it, \"shade from street trees lowers the temperature of sidewalks for people\" and that matters.\n\nReferences\nSmith, J. (2021). Parks and heat.";
  const R = chk(d), none = R.issues.filter(i => /Never cited|Not in your sources|Quote without a citation/.test(i.t));
  ok(none.length >= 3 && none.every(i => !i.edits || !i.edits.length), "never cited, not in your sources and a quote without a citation are left to the student: " + none.map(i => i.t).join(" | ")); }

/* Applying safely */
{ const d = "abc (Smith 2021) def";
  ok(CITE.applyEdits(d, [{at: 4, len: 12, from: "(Smith 2021)", to: "(Smith, 2021)"}]).text === "abc (Smith, 2021) def", "an edit applies where its text is");
  ok(CITE.applyEdits(d + "!", [{at: 0, len: 3, from: "xyz", to: "q"}]).n === 0, "an edit whose text has changed since is not applied");
  ok(CITE.applyEdits(d, [{at: 4, len: 12, from: "(Smith 2021)", to: "A"}, {at: 5, len: 5, from: "Smith", to: "B"}]).n === 1, "overlapping edits aren't applied together");
  ok(CITE.applyEdits(d, [{at: 99, len: 1, from: "x", to: "y"}]).n === 0, "an edit beyond the end is ignored");
  const ins = CITE.applyEdits("L\nZ", [{at: 2, len: 0, from: "", to: "N\n", k: "n"}, {at: 2, len: 0, from: "", to: "M\n", k: "m"}]);
  ok(ins.text === "L\nM\nN\nZ", "two insertions at one place land in order: " + JSON.stringify(ins.text));
  const both = CITE.applyEdits("L\nZ", [{at: 2, len: 1, from: "Z", to: "Zed"}, {at: 2, len: 0, from: "", to: "M\n", k: "m"}]);
  ok(both.text === "L\nM\nZed", "an insertion before a replaced entry: " + JSON.stringify(both.text)); }

/* Fix All: rounds of every fix (each round re-checks), until nothing more can be fixed */
{ let d = "One (Smith 2019). Two (Lee & Ng 2019). Three (World Health Organization 2023).\n\nBibliography\nWorld Health Organization. (2023). Heat and health.\nSmith, J. 2021. Parks and heat";
  for (let round = 0; round < 6; round++) { const edits = chk(d).issues.flatMap(i => i.edits || []); if (!edits.length) break; d = CITE.applyEdits(d, edits).text; }
  const left = chk(d).issues.filter(i => i.k === "err");
  ok(!left.length, "Fix All leaves nothing to fix: " + left.map(i => i.t).join(" | "));
  ok(d === "One (Smith, 2021). Two (Lee & Ng, 2019). Three (World Health Organization, 2023).\n\nReferences\nLee, K., & Ng, M. (2019). Urban trees.\nSmith, J. (2021). Parks and heat.\nWorld Health Organization. (2023). Heat and health.", "the whole draft, fixed: " + JSON.stringify(d));
  ok(!chk(d).issues.some(i => (i.edits || []).length), "and then there's nothing more to apply"); }

/* Add to References (from the Sources tab) */
{ const d = "Parks (Smith, 2021).\n\nReferences\nSmith, J. (2021). Parks and heat.";
  const a = CITE.refAdd(d, src, refs);
  ok(a.added.join() === "b,c" && a.already.join() === "a", "adds the two that aren't there, skips Smith: " + JSON.stringify(a));
  const r = CITE.applyEdits(d, a.edits);
  ok(r.text === "Parks (Smith, 2021).\n\nReferences\nLee, K., & Ng, M. (2019). Urban trees.\nSmith, J. (2021). Parks and heat.\nWorld Health Organization. (2023). Heat and health.", "in alphabetical order: " + JSON.stringify(r.text.split("References\n")[1]));
  ok(!CITE.refAdd(r.text, src, refs).edits.length, "adding again changes nothing");
  const none = CITE.refAdd("Just my essay.", src, refs, {head: "References"}), r2 = CITE.applyEdits("Just my essay.", none.edits);
  ok(none.made && r2.text === "Just my essay.\n\nReferences\nLee, K., & Ng, M. (2019). Urban trees.\nSmith, J. (2021). Parks and heat.\nWorld Health Organization. (2023). Heat and health.", "no list: one is made at the end: " + JSON.stringify(r2.text));
  const num = CITE.refAdd("Text [1].\n\nReferences\n[1] J. Smith, \"Parks and heat,\" 2021.", src, refs);
  ok(num.numbered && !num.edits.length, "a numbered list is left alone (its numbers follow the citations)"); }

/* a citation whose source is in the draft's own list but not in Writing Studio's sources: the paper is fine, so it's a note with Add to Sources, not an error */
{
  const D = "Behaviour differs by sex (Lindová et al., 2006). Drivers crash more (Smith, 2021).\n\nReferences\nLindová, J., Novotná, M., Havlíček, J., ... Flegr, J. (2006, August 31). Gender differences in behavioural changes induced by latent toxoplasmosis. International Journal for Parasitology.\nSmith, J. (2021). Parks and heat.";
  const r = CITE.check(D, src, APA), x = r.issues.find(i => /Lindov/.test(i.t));
  ok(x && x.k === "warn" && /^In your References list, not yet in your sources: \(Lindová et al\., 2006\)/.test(x.t) && x.addRef === "Lindová" && /Your paper is fine here/.test(x.d), "in the draft's list but not a source: a note to add it, not an error: " + JSON.stringify(x));
  const y = CITE.check(D.replace("(Lindová", "(Lindova"), src, APA).issues.find(i => /Lindov/.test(i.t));
  ok(y && y.k === "warn" && y.addRef, "the name matched with or without its accent");
  const z = CITE.check(D.replace(/\nLindová[^\n]*/, ""), src, APA).issues.find(i => /Lindov/.test(i.t));
  ok(z && z.k === "err" && /^Not in your sources/.test(z.t) && /isn't in your References list either/.test(z.d) && !z.addRef, "not in the list either: still an error");
}
/* narrative citations keep their name; a year that belongs to another entry by the same author in the list is that other work, never "fixed" */
{
  const F = (id, y, t) => CITE.clean({id, type: "article-journal", title: t, author: [{family: "Flegr", given: "J"}], issued: {"date-parts": [[y]]}});
  const R = "\n\nReferences\nFlegr, J. (2013). Influence of latent Toxoplasma infection.\nFlegr, J., Klose, J. (2019). Negative effects of latent toxoplasmosis on mental health.\nFlegr, J. (2007). Effects of Toxoplasma.";
  const D = "In the discussion section by Flegr et al. (2019), the researchers report. This, as described by Flegr (2013), is not feasible. Earlier (Flegr, 2007).";
  const a = CITE.check(D + R, [], APA).issues.filter(x => x.k !== "ok").map(x => x.t);
  ok(a.includes("In your References list, not yet in your sources: Flegr (2013)") && a.includes("In your References list, not yet in your sources: Flegr et al. (2019)"), "a narrative citation keeps its name, and is found in the list: " + a.join(" | "));
  const b = CITE.check(D + R, [F("a", 2013, "Influence of latent Toxoplasma infection")], APA).issues;
  ok(!b.some(x => /year doesn't match|In APA, write Flegr \(2013\)/.test(x.t)) && !b.some(x => (x.edits || []).some(e => /2019/.test(e.from))), "Flegr et al. (2019) isn't Flegr 2013 with a wrong year: no fix rewrites it");
  ok(b.some(x => x.k === "warn" && /Flegr et al\. \(2019\)/.test(x.t)), "it's the 2019 entry in the list, not a source yet");
  const c = CITE.check("Smith (2019) said so. Later (Smith, 2018).\n\nReferences\nSmith, J. (2018). Parks.", [CITE.clean({id: "s", type: "book", title: "Parks", author: [{family: "Smith", given: "J"}], issued: {"date-parts": [[2018]]}})], APA).issues;
  ok(c.some(x => /^The year doesn't match your source: Smith \(2019\)/.test(x.t)), "a real slip of the year (no 2019 entry in the list) is still caught");
}
/* a reference list with no heading: the entries at the end are found, and Fix adds the heading */
{
  const body = "Whilst I am capable of accepting the first premise, I intend to argue that the reaction of those from affluent countries is in fact justified. I will focus on the strong version, as Singer states himself (Singer, 1972).\n\nIn conclusion, although I can agree with the first premise of Singer’s argument that suffering is bad, I find the following three premises untrue as a result of differing approaches.";
  const D = body + "\n\nSinger, P. (1972). Famine, Affluence, and Morality. Philosophy & Public Affairs, 1(3), 229–243.\nhttp://www.jstor.org/stable/2265052";
  const r = CITE.check(D, [], APA), t = r.issues.map(x => x.t);
  ok(t.includes("Your References list has no heading") && t.includes("In your References list, not yet in your sources: (Singer, 1972)") && !t.some(x => /^Not in your sources|No References list found/.test(x)), "a list with no heading is still the list: " + t.join(" | "));
  ok(CITE.refEntries(D).length === 1 && /^Singer, P\. \(1972\)/.test(CITE.refEntries(D)[0]), "its entry is read (the link on its own line goes with it)");
  const fx = CITE.applyEdits(D, r.issues.flatMap(x => x.edits || [])).text;
  ok(fx === body + "\n\nReferences\nSinger, P. (1972). Famine, Affluence, and Morality. Philosophy & Public Affairs, 1(3), 229–243.\nhttp://www.jstor.org/stable/2265052", "Fix adds the heading above the entries: " + JSON.stringify(fx.slice(-150)));
  const n = CITE.check(body + "\n\nTherefore, Singer (1972) is wrong about this, and I have shown why in each part above.", [], APA).issues.map(x => x.t);
  ok(n.includes("No References list found"), "a last sentence that names an author isn't taken for a list");
}
console.log(`writing-studio-fix.test: ${n} passed`);
