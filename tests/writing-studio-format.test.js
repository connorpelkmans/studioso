// Tests for Writing Studio's format check (the pure part): in-text citations and the reference list in each built-in style (APA 7, MLA 9,
// Chicago author-date and notes-bibliography, IEEE, Harvard Cite Them Right, AMA, ASA). Correct drafts, made with citeproc's own output and
// by hand, have no format issues at all; drafts with the usual mistakes have each one named, with the right version.
const assert = require("assert"), fs = require("fs"), path = require("path");
const s = require("../scripts/app-files").source();
let n = 0; const ok = (c, m) => { n++; assert(c, m); };
const between = (a, b) => { const i = s.indexOf(a), j = s.indexOf(b, i); assert(i >= 0 && j > i, "marker " + a); return s.slice(i + a.length, j); };
const CITE = new Function(between("/*CITE-START*/", "/*CITE-END*/") + ";return CITE;")();
const VEND = path.join(__dirname, "..", "vendor", "citeproc-2.4.63");
const CSL = require(path.join(VEND, "citeproc.js"));
const loc = {"en-US": fs.readFileSync(path.join(VEND, "locales", "locales-en-US.xml"), "utf8")};

const ITEMS = [
  {id: "w", type: "book", title: "Why We Sleep: Unlocking the Power of Sleep and Dreams", author: [{family: "Walker", given: "Matthew"}], issued: {"date-parts": [[2017]]}, publisher: "Scribner", "publisher-place": "New York"},
  {id: "c", type: "article-journal", title: "Sleep Deprivation in Adolescents", author: [{family: "Carskadon", given: "Mary A."}], issued: {"date-parts": [[2011]]}, "container-title": "Pediatric Clinics of North America", volume: "58", issue: "3", page: "637–647", DOI: "10.1016/j.pcl.2011.03.003"},
  {id: "l", type: "webpage", title: "How Much Sleep Do Teens Need", author: [{family: "Lo", given: "June C."}, {family: "Ong", given: "Ju Lynn"}, {family: "Chee", given: "Michael W. L."}], issued: {"date-parts": [[2016, 5, 2]]}, "container-title": "Sleep Foundation", URL: "https://www.sleepfoundation.org/teens"},
  {id: "r", type: "article-journal", title: "How the Mind Hurts and Heals the Body", author: [{family: "Ray", given: "Oakley"}, {family: "Smith", given: "Jo"}], issued: {"date-parts": [[2004]]}, "container-title": "American Psychologist", volume: "59", issue: "1", page: "29–40", DOI: "10.1037/0003-066X.59.1.29"},
  {id: "o", type: "report", title: "Adolescent Sleep Report", author: [{literal: "World Health Organization"}], issued: {"date-parts": [[2020]]}, publisher: "WHO", URL: "https://www.who.int/x"},
  {id: "n", type: "chapter", title: "Sleep and Memory", author: [{family: "Ng", given: "Mo"}, {family: "Bo", given: "Al"}, {family: "Co", given: "Di"}, {family: "Ek", given: "Fa"}], issued: {"date-parts": [[2019]]}, "container-title": "Handbook of Sleep", editor: [{family: "Green", given: "Pat"}], publisher: "Springer", page: "45–67"}
].map(CITE.clean);
const STYLES = {"apa": ["APA", "author-date"], "modern-language-association": ["MLA", "author"], "chicago-author-date": ["Chicago", "author-date"], "chicago-notes-bibliography": ["Chicago notes", "note"],
  "ieee": ["IEEE", "numeric"], "harvard-cite-them-right": ["Harvard", "author-date"], "american-medical-association": ["AMA", "numeric"], "american-sociological-association": ["ASA", "author-date"]};
const ENG = {};
const eng = st => ENG[st] || (ENG[st] = CITE.engine(CSL, fs.readFileSync(path.join(VEND, "styles", st + ".csl"), "utf8"), loc, ITEMS));
const refOf = (st, id) => CITE.runsText(eng(st).bib().entries.find(e => e.id === id).runs);
// what the app's runCheck passes: citeproc's references as text, its citations, the numbered order
function check(st, draft, extra){
  const e = eng(st), B = e.bib(), refs = {}; B.entries.forEach(x => { refs[x.id] = CITE.runsText(x.runs); });
  const [label, kind] = STYLES[st], order = kind === "numeric" ? B.entries.map(x => x.id) : null;
  return CITE.check(draft, order ? order.map(id => ITEMS.find(x => x.id === id)) : ITEMS, Object.assign({style: st, kind, label, refs, cite: (id, l) => CITE.runsText(e.cite(id, l)), order}, extra || {}));
}
// the format issues: everything to fix or look at, except sources never cited (each fixture cites only some)
const fmtIssues = r => r.issues.filter(x => x.k !== "ok" && !/^Never cited/.test(x.t));
const show = r => fmtIssues(r).map(x => `${x.k}: ${x.t} / ${x.d}`).join("\n");
const SUP = k => String(k).split("").map(d => "⁰¹²³⁴⁵⁶⁷⁸⁹"[d]).join("");
const list = (st, ids, o) => (o && o.head || CITE.headingOf(st, STYLES[st][1])) + "\n\n" + ids.map(id => refOf(st, id)).join(o && o.tight ? "\n" : "\n\n") + "\n";

/* 1. Correct drafts in every style: citeproc's own citations and references (and the same typed with straight quotes and hyphens) */
for (const st of Object.keys(STYLES)) {
  const e = eng(st), kind = STYLES[st][1], order = e.bib().entries.map(x => x.id);
  const body = order.map((id, i) => kind === "numeric" ? (st === "ieee" ? `Sleep matters for reason ${i} [${i + 1}].` : `Sleep matters for reason ${i}.${SUP(i + 1)}`) : kind === "note" ? `Sleep matters for reason ${i}.${SUP(i + 1)}` : `Sleep matters for reason ${i} ${CITE.runsText(e.cite(id, i % 2 ? String(40 + i) : ""))}.`).join(" ");
  const d1 = body + "\n\n" + list(st, order), d2 = body + "\n\n" + list(st, order, {tight: true}).replace(/[“”]/g, '"').replace(/–/g, "-");
  for (const d of [d1, d2]) { const r = check(st, d); ok(!fmtIssues(r).length, `${st}: a correct draft has no format issues:\n${show(r)}\n${d}`); }
  const r = check(st, d1);
  ok(r.issues.some(x => x.k === "ok" && new RegExp(`entries are in ${STYLES[st][0]} format`).test(x.t)), `${st}: and says its entries are right`);
  if (kind !== "numeric" && kind !== "note") ok(r.issues.some(x => x.k === "ok" && /in-text citations are in/.test(x.t)), `${st}: and its in-text citations`);
}

/* 2. Correct citations written by hand: narrative, several works, pages and paragraphs, organisations, e.g. */
const hand = {
  "apa": "Walker (2017) argues that sleep matters. Walker (2017, p. 4) adds more. Ray and Smith (2004) agree (Ray & Smith, 2004). Teens sleep late (Carskadon, 2011; Walker, 2017). Lo et al. (2016) found the same (Lo et al., 2016, pp. 4–5). Some say so (e.g., Walker, 2017). The WHO agrees (World Health Organization, 2020). It's in a paragraph (Walker, 2017, para. 3). Ng et al. (2019) too.",
  "modern-language-association": "Sleep matters (Walker 112). Teens need more (Lo et al.). Stress hurts (Ray and Smith 30). More pages (Walker 112-14). Walker argues that sleep matters (112). Both agree (Walker 112; Carskadon 640). The WHO says so (World Health Organization). And a chapter (Ng et al. 50).",
  "chicago-author-date": "Sleep matters (Walker 2017, 112). Teens need more (Lo et al. 2016). Stress hurts (Ray and Smith 2004, 30). Walker (2017) argues more. Several (Carskadon 2011; Walker 2017). WHO (World Health Organization 2020). Ng et al. (2019, 50).",
  "american-sociological-association": "Sleep matters (Walker 2017:112). Teens need more (Lo, Ong, and Chee 2016). Stress hurts (Ray and Smith 2004:30). Walker (2017:4) argues more. A chapter (Ng et al. 2019).",
  "harvard-cite-them-right": "Sleep matters (Walker, 2017, p. 112). Teens need more (Lo, Ong and Chee, 2016). Stress hurts (Ray and Smith, 2004, pp. 30–31). Walker (2017) argues more. A chapter (Ng et al., 2019).",
  "ieee": "Sleep matters [1]. Teens need more [2], [3]. A range [3]–[5]. A page [1, p. 45]. And the last [6].",
  "american-medical-association": "Sleep matters.¹ Teens need more.²,³ A range.³⁻⁵ And the last.^6",
  "chicago-notes-bibliography": "Sleep matters.¹ Teens need more.² Stress hurts.³"
};
for (const st of Object.keys(hand)) {
  const ids = eng(st).bib().entries.map(x => x.id), r = check(st, hand[st] + "\n\n" + list(st, ids));
  ok(!fmtIssues(r).length, `${st}: hand-written correct citations pass:\n${show(r)}`);
}

/* 3. The user's draft in MLA: a comma before the page, a year, the wrong heading; (Lo et al.) and (Ray and Smith 30) are right */
const USER = `Teenagers are short on sleep. Short sleep blunts memory (Walker, 112). The body clock shifts later (Carskadon 2011). Most teens need nine hours (Lo et al.). Stress makes it worse (Ray and Smith 30). Naps help a little (Walker, 140).

References

${refOf("modern-language-association", "c")}

${refOf("modern-language-association", "l")}

${refOf("modern-language-association", "r")}

${refOf("modern-language-association", "w")}
`;
{ const r = check("modern-language-association", USER), t = show(r);
  const comma = r.issues.find(x => /^2 citations put a comma between the author and the page$/.test(x.t));
  ok(comma && comma.k === "err" && /In MLA, write \(Walker 112\), not \(Walker, 112\): no comma between the author and the page\. The others: \(Walker, 140\) → \(Walker 140\)\./.test(comma.d), "MLA: two commas before the page, grouped, with the right form: " + t);
  ok(comma.at === USER.indexOf("(Walker, 112)") && comma.more.length === 1 && comma.more[0].at === USER.indexOf("(Walker, 140)"), "the group points at the first and lists the other");
  const yr = r.issues.find(x => x.t === "In MLA, write (Carskadon)");
  ok(yr && /Not \(Carskadon 2011\): MLA citations have no year, just the author and the page\./.test(yr.d) && yr.at === USER.indexOf("(Carskadon 2011)"), "MLA: a year in the citation: " + t);
  ok(r.issues.some(x => x.k === "err" && /In MLA, the list is called Works Cited/.test(x.t) && /Yours is called “References”/.test(x.d) && x.at === USER.indexOf("References")), "MLA: the heading");
  ok(!/Lo et al|Ray and Smith 30/.test(t), "(Lo et al.) and (Ray and Smith 30) are right in MLA: " + t); }
// the same draft checked as APA: each citation gets the APA form, and the draft is seen to be MLA
{ const r = check("apa", USER), t = show(r);
  ok(r.issues.some(x => /Your citations look like MLA/.test(x.t) && x.fix === "style:modern-language-association"), "set to APA, an MLA draft offers Switch to MLA: " + t);
  ok(/\(Walker, 2017, p\. 112\)/.test(t) && /\(Carskadon, 2011\)/.test(t) && /\(Lo et al\., 2016\)/.test(t) && /\(Ray & Smith, 2004, p\. 30\)/.test(t), "and APA's own form for each: " + t);
  ok(r.issues.filter(x => x.key && /^ref:/.test(x.key)).length === 4, "every entry is flagged against APA: " + t); }

/* 4. Typical mistakes, style by style: each named, with the right version */
const one = (st, sentence, ids) => { const r = check(st, sentence + "\n\n" + list(st, ids || eng(st).bib().entries.map(x => x.id))); return {r, t: show(r)}; };
const has = (x, re, m) => ok(new RegExp(re.source, "i").test(x.t), m + ": " + x.t);
// APA
has(one("apa", "Sleep (Walker 2017)."), /In APA, write \(Walker, 2017\)[^]*put a comma between the author and the year/, "APA: no comma before the year");
has(one("apa", "Sleep (Walker, 2017, 112)."), /\(Walker, 2017, p\. 112\)[^]*put p\. before a page/, "APA: a page without p.");
has(one("apa", "Sleep (Walker, 2017, p. 112-14)."), /\(Walker, 2017, pp\. 112–14\)[^]*use pp\. before a range/, "APA: p. for a range");
has(one("apa", "Sleep (Walker, 2017, pg. 4)."), /\(Walker, 2017, p\. 4\)[^]*not pg\./, "APA: pg.");
has(one("apa", "Stress (Ray and Smith, 2004)."), /\(Ray & Smith, 2004\)[^]*use & between two authors inside brackets/, "APA: and inside brackets");
has(one("apa", "Ray & Smith (2004) agree."), /Ray and Smith \(2004\)[^]*in a sentence, use “and”/, "APA: & in a sentence");
has(one("apa", "Teens (Lo, Ong, & Chee, 2016)."), /\(Lo et al\., 2016\)[^]*et al\.” when there are 3 or more/, "APA: three authors listed");
has(one("apa", "Stress (Ray et al., 2004)."), /\(Ray & Smith, 2004\)[^]*et al\.” is only for 3 or more/, "APA: et al. for two authors");
has(one("apa", "Teens (Lo et al, 2016)."), /full stop after “al”/, "APA: et al without its full stop");
has(one("apa", "Teens (Lo, et al., 2016)."), /no comma before “et al\.”/, "APA: a comma before et al.");
has(one("apa", "Stress (Ray, 2004)."), /\(Ray & Smith, 2004\)[^]*name both authors/, "APA: the second author left out");
has(one("apa", "Sleep (Walker, 2018)."), /The year doesn't match your source: \(Walker, 2018\)[^]*is from 2017/, "a year that isn't the source's");
has(one("apa", "Sleep (Walker, 2017; Carskadon, 2011)."), /\(Carskadon, 2011; Walker, 2017\)[^]*alphabetical order/, "APA: several works out of alphabetical order");
has(one("apa", "Sleep (Walker, 2017, Carskadon, 2011)."), /\(Walker, 2017; Carskadon, 2011\)[^]*semicolon/, "APA: two works run together");
has(one("apa", "Sleep (Walker)."), /\(Walker, 2017\)[^]*add the year/, "APA: no year");
// MLA
has(one("modern-language-association", "Sleep (Walker p. 112)."), /\(Walker 112\)[^]*no p\. before the page/, "MLA: p.");
has(one("modern-language-association", "Stress (Ray & Smith 30)."), /\(Ray and Smith 30\)[^]*use “and” between two authors/, "MLA: &");
has(one("modern-language-association", "Teens (Lo, Ong, and Chee 4)."), /\(Lo et al\. 4\)[^]*3 or more authors/, "MLA: three authors listed");
has(one("modern-language-association", "Walker (2017) argues that sleep matters."), /MLA citations have no year/, "MLA: a year in a narrative citation");
has(one("modern-language-association", "Sleep (Walker 112, Carskadon 640)."), /\(Walker 112; Carskadon 640\)[^]*semicolon/, "MLA: two works run together");
// Chicago author-date
has(one("chicago-author-date", "Sleep (Walker, 2017)."), /In Chicago, write \(Walker 2017\)[^]*no comma between the author and the year/, "Chicago: a comma before the year");
has(one("chicago-author-date", "Sleep (Walker 2017, p. 112)."), /\(Walker 2017, 112\)[^]*no p\. before the page/, "Chicago: p.");
has(one("chicago-author-date", "Sleep (Walker 2017: 112)."), /\(Walker 2017, 112\)[^]*put a comma before the page/, "Chicago: a colon before the page");
has(one("chicago-author-date", "Teens (Lo, Ong, Chee, and Wu 2016)."), /Lo et al\. 2016/, "Chicago: four authors listed (unknown source, from the citation itself)");
// ASA
has(one("american-sociological-association", "Sleep (Walker 2017, 112)."), /In ASA, write \(Walker 2017:112\)[^]*colon between the year and the page/, "ASA: a comma before the page");
has(one("american-sociological-association", "Sleep (Walker, 2017)."), /\(Walker 2017\)[^]*no comma between the author and the year/, "ASA: a comma before the year");
// Harvard (Cite Them Right): "and", et al. from four authors
has(one("harvard-cite-them-right", "Stress (Ray & Smith, 2004)."), /\(Ray and Smith, 2004\)[^]*use “and” between two authors/, "Harvard: &");
has(one("harvard-cite-them-right", "Teens (Lo et al., 2016)."), /\(Lo, Ong and Chee, 2016\)[^]*only for 4 or more/, "Harvard: et al. for three authors");
has(one("harvard-cite-them-right", "A chapter (Ng, Bo, Co and Ek, 2019)."), /\(Ng et al\., 2019\)[^]*4 or more authors/, "Harvard: four authors listed");
// IEEE and AMA
{ const ids = ["w", "c", "l", "r", "o", "n"];
  has(one("ieee", "A range [1-3]. Then [4], [5], [6].", ids), /In IEEE, write \[1\]–\[3\][^]*each number in its own brackets/, "IEEE: a range inside one pair of brackets");
  has(one("ieee", "Two [1, 2]. Then [3], [4], [5], [6].", ids), /In IEEE, write \[1\], \[2\]/, "IEEE: two numbers in one pair of brackets");
  const o = one("ieee", "First [2]. Then [1]. Then [3], [4], [5], [6].", ids);
  ok(/Number your sources in the order you first cite them \/ \[2\] is the first source you cite, so it should be \[1\]/.test(o.t), "IEEE: numbered out of order: " + o.t);
  has(one("ieee", "Sleep (Walker, 2017). Then [1], [2], [3], [4], [5], [6].", ids), /IEEE cites by number, not author and year: \(Walker, 2017\)/, "IEEE: author and year");
  const a = one("american-medical-association", "First.² Then.¹ Then.³⁻⁶", ids);
  ok(/Number your sources[^]*2 is the first source you cite, so it should be 1/.test(a.t), "AMA: superscripts out of order: " + a.t);
  has(one("american-medical-association", "Sleep (Walker, 2017). Then.¹⁻⁶", ids), /AMA cites by number[^]*superscript/, "AMA: author and year"); }
// Chicago notes: author-date in brackets
has(one("chicago-notes-bibliography", "Sleep (Walker 2017)."), /Chicago notes cites in footnotes, not in brackets: \(Walker 2017\)/, "Chicago notes: a parenthetical citation");
// grouped: four of the same problem are one issue listing the others; Check Again treats it as the same issue when the count changes
{ const d = "A (Walker, 112). B (Carskadon, 640). C (Ray and Smith, 30). D (Walker, 140).\n\n" + list("modern-language-association", ["c", "r", "w"]);
  const r = check("modern-language-association", d), g = r.issues.filter(x => /comma between the author and the page/.test(x.t));
  ok(g.length === 1 && /^4 citations/.test(g[0].t) && g[0].more.length === 3 && /\(Carskadon, 640\) → \(Carskadon 640\)/.test(g[0].d), "four alike are one issue: " + show(r));
  const r2 = check("modern-language-association", d.replace("D (Walker, 140)", "D (Walker 140)"));
  ok(CITE.diffIssues(CITE.issueKeys(r), r2).fresh === 0, "fixing one of a group isn't a new issue"); }
// prose in brackets isn't a citation
{ const r = check("apa", "In the spring (Grade 9) we met (see Figure 2). It was 30% (N = 30) in March (January 2020). The Great Depression (1929) mattered.\n\n" + list("apa", ["w"]));
  ok(!r.issues.some(x => x.key && /^fmt:/.test(x.key)), "brackets that aren't citations are left alone: " + show(r)); }

/* 5. The reference list: heading, order, and each entry against the style's version */
const L = (st, entries, head) => check(st, "Sleep matters.\n\n" + (head || CITE.headingOf(st, STYLES[st][1])) + "\n\n" + entries.join("\n\n") + "\n");
const refIs = (r, id) => r.issues.find(x => x.key === "ref:" + id) || {t: "", d: ""};
{ let r = L("apa", ["Walker, Matthew. Why We Sleep: Unlocking the Power of Sleep and Dreams. Scribner, 2017."]), x = refIs(r, "w");
  ok(/References: fix the entry for Walker \(2017\)/.test(x.t) && /Use initials for first names: Walker, M/.test(x.d) && /Put the year in brackets right after the authors: \(2017\)/.test(x.d) && /Use sentence case for the title[^]*Why we sleep: Unlocking the power of sleep and dreams/.test(x.d), "APA: an MLA-style book: " + x.d);
  ok(x.should === refOf("apa", "w") && x.sid === "w", "with the right version to copy");
  r = L("apa", ["Carskadon, M. A. (2011). Sleep deprivation in adolescents. Pediatric Clinics of North America, 58(3), pp. 637–647. doi:10.1016/j.pcl.2011.03.003."]); x = refIs(r, "c");
  ok(/Write the DOI as https:\/\/doi\.org\/10\.1016\/j\.pcl\.2011\.03\.003/.test(x.d) && /Leave out pp\. before the pages/.test(x.d) && !/sentence case/.test(x.d), "APA: pp. in a journal reference and the DOI's form: " + x.d);
  r = L("apa", ["Carskadon, M. A. (2011). Sleep deprivation in adolescents. Pediatric Clinics of North America, 58(3), 637–647."]); x = refIs(r, "c");
  ok(/Add the DOI: https:\/\/doi\.org\/10\.1016/.test(x.d), "APA: a missing DOI: " + x.d);
  r = L("apa", ["Lo, J. C., Ong, J. L., & Chee, M. W. L. (2016, May 2). How much sleep do teens need. Sleep Foundation. Retrieved from https://www.sleepfoundation.org/teens"]); x = refIs(r, "l");
  ok(/Leave out “Retrieved from”/.test(x.d), "APA 7: Retrieved from: " + x.d);
  r = L("apa", ["Carskadon, M. A. (2011). “Sleep deprivation in adolescents.” Pediatric Clinics of North America, 58(3), 637–647. https://doi.org/10.1016/j.pcl.2011.03.003"]); x = refIs(r, "c");
  ok(/Take the quotation marks off the title/.test(x.d), "APA: quotation marks on an article title: " + x.d);
  r = L("apa", ["Lo, J. C., et al. (2016, May 2). How much sleep do teens need. Sleep Foundation. https://www.sleepfoundation.org/teens"]); x = refIs(r, "l");
  ok(/List every author: Lo, J\. C\., Ong, J\. L\., & Chee, M\. W\. L/.test(x.d), "APA: et al. in the list: " + x.d);
  r = L("apa", ["Walker, M. (2018). Why we sleep: Unlocking the power of sleep and dreams. Scribner."]); x = refIs(r, "w");
  ok(/The year should be 2017/.test(x.d), "a year that isn't the source's: " + x.d); }
{ let r = L("modern-language-association", ["Carskadon, Mary A. Sleep Deprivation in Adolescents. Pediatric Clinics of North America, vol. 58, no. 3, 2011, pp. 637–47, https://doi.org/10.1016/j.pcl.2011.03.003."]), x = refIs(r, "c");
  ok(/Put the title in quotation marks: “Sleep Deprivation in Adolescents”/.test(x.d), "MLA: an article title without quotation marks: " + x.d);
  r = L("modern-language-association", ["Carskadon, M. A. (2011). Sleep deprivation in adolescents. Pediatric Clinics of North America, 58(3), 637–647. https://doi.org/10.1016/j.pcl.2011.03.003"]); x = refIs(r, "c");
  ok(/Write first names in full: Carskadon, Mary A/.test(x.d) && /Move the year to later in the entry/.test(x.d) && /Capitalize the main words of the title: Sleep Deprivation in Adolescents/.test(x.d) && /Write the volume and issue as vol\. 58, no\. 3/.test(x.d) && /End the entry with a full stop/.test(x.d), "MLA: an APA-style article: " + x.d);
  r = L("modern-language-association", ["Lo, June C., Ju Lynn Ong, and Michael W. L. Chee. “How Much Sleep Do Teens Need.” Sleep Foundation, 2 May 2016, https://www.sleepfoundation.org/teens."]); x = refIs(r, "l");
  ok(/Use “et al\.” after the first author: Lo, June C\., et al/.test(x.d), "MLA: three authors in the list: " + x.d);
  r = L("modern-language-association", [refOf("modern-language-association", "w"), refOf("modern-language-association", "c")]);
  ok(r.issues.some(x => /Works Cited list isn't in alphabetical order/.test(x.t) && /Carskadon should come before Walker/.test(x.d)), "MLA: the list out of alphabetical order: " + show(r));
  r = L("modern-language-association", [refOf("modern-language-association", "w")], "Bibliography");
  ok(r.issues.some(x => /In MLA, the list is called Works Cited/.test(x.t)), "MLA: the heading"); }
{ const r = L("ieee", ["[1] M. A. Carskadon, “Sleep deprivation in adolescents,” Pediatric Clinics of North America, vol. 58, no. 3, pp. 637–647, 2011.", "[3] M. Walker, Why we sleep: Unlocking the power of sleep and dreams. New York: Scribner, 2017."]);
  ok(/Add the DOI: doi: 10\.1016/.test(refIs(r, "c").d), "IEEE: a missing DOI, in IEEE's form: " + refIs(r, "c").d);
  ok(r.issues.some(x => /isn't numbered 1, 2, 3/.test(x.t)), "IEEE: the list's numbers: " + show(r)); }
{ const r = L("harvard-cite-them-right", ["Walker, M. (2017) Why we sleep: Unlocking the power of sleep and dreams. Scribner."]);
  ok(/Add the place of publication: New York/.test(refIs(r, "w").d), "Harvard: the place: " + refIs(r, "w").d);
  const r2 = L("apa", ["Walker, M. (2017). Why we sleep: Unlocking the power of sleep and dreams. New York: Scribner."]);
  ok(/Leave out the place of publication \(New York\)/.test(refIs(r2, "w").d), "APA 7: no place: " + refIs(r2, "w").d); }
{ const r = L("american-medical-association", ["1. Carskadon, M. A. Sleep deprivation in adolescents. Pediatric Clinics of North America. 2011;58(3):637-647. doi:10.1016/j.pcl.2011.03.003"]);
  ok(/Write the authors as Carskadon MA/.test(refIs(r, "c").d), "AMA: names without commas or full stops: " + refIs(r, "c").d); }
// a name in a sentence-case title keeps its capitals: "New York" isn't flagged
{ const ny = CITE.clean({id: "ny", type: "book", title: "Sleep in New York Teens", author: [{family: "Diaz", given: "Ana"}], issued: {"date-parts": [[2020]]}, publisher: "Norton"});
  const e = CITE.engine(CSL, fs.readFileSync(path.join(VEND, "styles", "apa.csl"), "utf8"), loc, [ny]), X = CITE.runsText(e.bib().entries[0].runs);
  ok(!CITE.refDiff("Diaz, A. (2020). Sleep in New York teens. Norton.", X, ny).length, "a sentence-case title with a place name passes: " + CITE.refDiff("Diaz, A. (2020). Sleep in New York teens. Norton.", X, ny));
  ok(/sentence case/.test(CITE.refDiff("Diaz, A. (2020). Sleep In New York Teens. Norton.", X, ny).join()), "a Title Case one is flagged"); }
// an entry for something that isn't a Writing Studio source isn't compared (Found in Your Draft offers to add it)
{ const r = L("apa", ["Johnson, K. (2018). Some other paper. Journal of Sleep, 3(2), 1–9."]);
  ok(!r.issues.some(x => x.key && /^ref:/.test(x.key)), "an entry that isn't a source isn't compared"); }
// without citeproc's references (still loading), no entry is compared and nothing breaks
{ const r = CITE.check("Sleep (Walker 112).\n\nWorks Cited\n\nWalker, M. (2017). Why we sleep. Scribner.\n", ITEMS, {style: "modern-language-association", kind: "author", label: "MLA"});
  ok(!r.issues.some(x => x.key && /^ref:/.test(x.key)) && !r.issues.some(x => x.key && /^fmt:/.test(x.key)) && r.issues.some(x => /in-text citations are in MLA format/.test(x.t)), "no references passed: no entry comparison, the in-text check still runs: " + show(r)); }

/* 6. A style from Zotero: its built-in parent's rules, or what citeproc's citations in it show, or its family's only */
{ const r = CITE.check("Sleep (Walker 2017).\n\nReferences\n\n" + refOf("apa", "w"), ITEMS, {style: "some-journal", parent: "apa", kind: "author-date", label: "Some Journal"});
  ok(r.issues.some(x => /In Some Journal, write \(Walker, 2017\)/.test(x.t)), "a dependent style of APA gets APA's rules: " + show(r));
  const e = eng("chicago-author-date"), cite = (id, l) => CITE.runsText(e.cite(id, l));
  const P = CITE.profileOf({style: "x", kind: "author-date", label: "X", cite, items: ITEMS});
  ok(P.yr === 1 && P.ay === " " && P.pg === ", " && P.pl === 0, "an unknown author-date style's separators are read from citeproc's citations: " + JSON.stringify(P));
  const r2 = CITE.check("Sleep (Walker, 2017).\n\nReferences\n\n" + refOf("chicago-author-date", "w"), ITEMS, {style: "x", kind: "author-date", label: "X", cite});
  ok(r2.issues.some(x => /In X, write \(Walker 2017\)/.test(x.t)), "and checked by them: " + show(r2));
  const r3 = CITE.check("Sleep (Walker, 2017).\n\nReferences\n\n" + refOf("chicago-author-date", "w"), ITEMS, {style: "x", kind: "author-date", label: "X"});
  ok(!r3.issues.some(x => x.key && /^fmt:/.test(x.key)), "without them, only the family's checks (a year is there): " + show(r3)); }

console.log(`writing-studio-format.test: ${n} passed`);
