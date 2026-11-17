// Tests for Writing Studio's pure part (identifiers, names, BibTeX / RIS / CSL-JSON in and out, duplicates, citeproc HTML to runs,
// the draft check, where issues are, reading the draft's reference list in five styles and its quoted passages) and Concept Maps' pure part (the graph from linked material, the overlay of the student's edits, layout, knowledge colour, quiz, AI checks)
const assert = require("assert");
const s = require("../scripts/app-files").source();
let n = 0; const ok = (c, m) => { n++; assert(c, m); };
const between = (a, b) => { const i = s.indexOf(a), j = s.indexOf(b, i); assert(i >= 0 && j > i, "marker " + a); return s.slice(i + a.length, j); };
const CITE = new Function(between("/*CITE-START*/", "/*CITE-END*/") + ";return CITE;")();
const CMAP = new Function(between("/*CMAP-START*/", "/*CMAP-END*/") + ";return CMAP;")();

/* What was pasted */
ok(CITE.parseId("https://doi.org/10.1037/0003-066X.59.1.29").v === "10.1037/0003-066X.59.1.29", "a doi.org link is a DOI");
ok(CITE.parseId("doi: 10.1000/xyz123.").v === "10.1000/xyz123", "trailing punctuation leaves a DOI");
ok(CITE.parseId("arXiv:2101.00001v2").v === "10.48550/arXiv.2101.00001", "an arXiv ID becomes its DataCite DOI");
ok(CITE.parseId("https://arxiv.org/abs/1706.03762").v === "10.48550/arXiv.1706.03762", "and so does an arXiv link");
ok(CITE.parseId("978-0-14-044913-6").kind === "isbn" && CITE.parseId("0-306-40615-2").kind === "isbn", "ISBN-13 and ISBN-10 with hyphens");
ok(CITE.parseId("978-0-14-044913-7") === null, "a bad ISBN checksum isn't an ISBN");
ok(CITE.parseId("www.nature.com/articles/x").v === "https://www.nature.com/articles/x", "a bare address becomes a link");
ok(CITE.parseId("just some words") === null, "words are nothing");

/* Names */
const nm = CITE.names("Smith, Jordan A.\nvan der Berg, Anna\nLudwig van Beethoven\nWorld Health Organization\n{Smith and Sons}");
ok(nm[0].family === "Smith" && nm[0].given === "Jordan A.", "Family, Given");
ok(nm[1].family === "van der Berg", "particles stay with the family name when written first");
ok(nm[2].family === "van Beethoven" && nm[2].given === "Ludwig", "and when written last");
ok(nm[3].literal === "World Health Organization" && nm[4].literal === "Smith and Sons", "organisations and {braced} names are kept whole");
ok(CITE.names("Jane Doe and John Roe").length === 2, "BibTeX-style and lists");
ok(CITE.namesText(nm).split("\n")[3] === "World Health Organization", "names go back to text for the form");

/* Cleaning CSL-JSON from doi.org */
const raw = {DOI: "10.1037/0003-066x.59.1.29", type: "journal-article", title: ["How the <i>Mind</i> Hurts"], "container-title": ["American Psychologist"], volume: "59", issue: "1", page: "29-40",
  author: [{given: "Oakley", family: "Ray", sequence: "first", affiliation: []}], issued: {"date-parts": [[2004, 1]]}, "reference-count": 105, publisher: "APA", abstract: "x".repeat(5000)};
const c = CITE.clean(raw);
ok(c.type === "article-journal" && c.title === "How the Mind Hurts" && c["container-title"] === "American Psychologist", "type mapped, arrays and tags flattened");
ok(c.page === "29–40" && c.author[0].family === "Ray" && !("sequence" in c.author[0]) && !("abstract" in c) && !("reference-count" in c), "known fields only, page ranges with an en dash");
ok(CITE.yearOf(c) === 2004, "year");

/* BibTeX */
const bib = `@string{apa = "American Psychologist"}
@article{ray2004,
  author = {Ray, Oakley and M{\\"u}ller, J{\\"o}rg and {World Health Organization}},
  title = {How the Mind {Hurts} and Heals the Body},
  journal = apa,
  year = 2004, month = jan,
  volume = {59}, number = {1}, pages = {29--40},
  doi = {10.1037/0003-066X.59.1.29}
}
@book{kahneman2011, author = "Daniel Kahneman", title = "Thinking, Fast and Slow", publisher = {Farrar, Straus and Giroux}, address = {New York}, year = {2011}, isbn = {9780374275631}}
@incollection{c1, author={Lee, Kim}, title={A Chapter}, booktitle={The Big Book}, editor={Ng, Mo}, pages={1-20}, publisher={P}, year={2019}}
@online{w1, title={Heat and Health}, url={https://www.who.int/heat}, urldate={2024-06-01}, organization={World Health Organization}, year={2023}}
@comment{ignored}`;
const B = CITE.parseBibTeX(bib);
ok(B.length === 4, "four entries (comments and strings skipped): " + B.length);
ok(B[0].type === "article-journal" && B[0]["container-title"] === "American Psychologist" && B[0].issue === "1" && B[0].page === "29–40", "an article, with a @string macro");
ok(B[0].author[1].family === "Müller" && B[0].author[1].given === "Jörg" && B[0].author[2].literal === "World Health Organization", "LaTeX accents and a {braced} organisation");
ok(B[0].title === "How the Mind Hurts and Heals the Body" && JSON.stringify(B[0].issued) === JSON.stringify({"date-parts": [[2004, 1]]}), "braces stripped, month kept");
ok(B[1].type === "book" && B[1].author[0].family === "Kahneman" && B[1]["publisher-place"] === "New York" && B[1].ISBN === "9780374275631", "a book in quotes");
ok(B[2].type === "chapter" && B[2]["container-title"] === "The Big Book" && B[2].editor[0].family === "Ng", "a chapter with its editor");
ok(B[3].type === "webpage" && B[3].URL === "https://www.who.int/heat" && CITE.isoOf(B[3].accessed) === "2024-06-01" && B[3]["container-title"] === "World Health Organization", "an online source");
const back = CITE.parseBibTeX(CITE.toBibTeX(B));
ok(back.length === 4 && back[0].title === B[0].title && back[0].author.length === 3 && back[1].ISBN === B[1].ISBN && back[2].editor[0].family === "Ng", "BibTeX out and back in keeps the details");
ok(/@article\{ray2004,/.test(CITE.toBibTeX(B)), "keys from the first author and the year");

/* RIS */
const ris = "TY  - JOUR\r\nAU  - Ray, Oakley\r\nTI  - How the mind hurts\r\nT2  - American Psychologist\r\nPY  - 2004\r\nVL  - 59\r\nIS  - 1\r\nSP  - 29\r\nEP  - 40\r\nDO  - 10.1037/0003-066X.59.1.29\r\nER  - \r\n\r\nTY  - CHAP\r\nAU  - Lee, Kim\r\nA2  - Ng, Mo\r\nTI  - A Chapter\r\nBT  - The Big Book\r\nSN  - 978-0-14-044913-6\r\nPY  - 2019///\r\nER  - \r\n";
const RI = CITE.parseRIS(ris);
ok(RI.length === 2 && RI[0].page === "29–40" && RI[0].DOI === "10.1037/0003-066X.59.1.29" && RI[1].editor[0].family === "Ng" && RI[1].ISBN, "RIS: a journal article and a chapter with its editor and ISBN");
const RI2 = CITE.parseRIS(CITE.toRIS(RI));
ok(RI2.length === 2 && RI2[0].title === RI[0].title && RI2[1]["container-title"] === "The Big Book", "RIS out and back in");
ok(CITE.parseAny(ris).fmt === "RIS" && CITE.parseAny(bib).fmt === "BibTeX" && CITE.parseAny(CITE.toCslJson(B)).fmt === "CSL-JSON" && CITE.parseAny(CITE.toCslJson(B)).items.length === 4, "the format is recognised, and CSL-JSON round-trips");
ok(!/"fid"|"zkey"/.test(CITE.toCslJson([Object.assign({}, B[0], {fid: "f1", zkey: "ABCD"})])), "exports leave out Studyboard's own fields");

/* Web pages */
const html = `<html><head><title>Ignored</title><meta name="citation_title" content="Parks &amp; Heat"><meta name="citation_author" content="Smith, Jordan"><meta name="citation_author" content="Kim Lee">
<meta name="citation_journal_title" content="Urban Climate"><meta name="citation_publication_date" content="2021/05/04"><meta name="citation_doi" content="10.1016/j.uclim.2021.1"></head></html>`;
const h = CITE.fromHtml(html, "https://example.org/a");
ok(h.title === "Parks & Heat" && h.author.length === 2 && h.author[1].family === "Lee" && h.type === "article-journal" && h.DOI === "10.1016/j.uclim.2021.1" && CITE.isoOf(h.issued) === "2021-05-04", "Highwire meta tags");
const og = CITE.fromHtml('<meta property="og:title" content="A Blog Post"><meta property="og:site_name" content="The Site">', "https://www.site.com/x");
ok(og.type === "webpage" && og["container-title"] === "The Site" && og.title === "A Blog Post", "Open Graph for a plain page");

/* Duplicates */
ok(CITE.dupOf({DOI: "10.1037/0003-066X.59.1.29"}, [c]) === c, "same DOI, any case");
ok(CITE.dupOf({title: "How the Mind Hurts!", issued: {"date-parts": [[2004]]}}, [c]) === c, "same title and year");
ok(CITE.dupOf({title: "How the Mind Hurts", issued: {"date-parts": [[2005]]}}, [c]) === null, "a different year isn't a duplicate");

/* citeproc's HTML */
const r = CITE.runs('<div class="csl-entry">Ray, O. (2004). How the mind hurts. <i>American Psychologist</i>, <i>59</i>(1), 29&#8211;40. https://doi.org/10.1037/0003-066X.59.1.29</div>');
ok(r.length === 5 && r[1][1].i && r[1][0] === "American Psychologist" && /29–40/.test(r[4][0]), "runs keep italics and decode entities");
ok(CITE.runsHtml(r) === 'Ray, O. (2004). How the mind hurts. <i>American Psychologist</i>, <i>59</i>(1), 29–40. https://doi.org/10.1037/0003-066X.59.1.29', "and back to safe HTML");
const r2 = CITE.runs('<div class="csl-entry"><div class="csl-left-margin">[1]</div><div class="csl-right-inline">O. Ray, “How,” <span style="font-variant:small-caps;">Am</span> <b>x</b> &lt;script&gt;</div></div>');
ok(CITE.runsText(r2) === "[1] O. Ray, “How,” Am x <script>" && r2.some(x => x[1].sc) && r2.some(x => x[1].b), "numbered entries, small caps and bold");
ok(!/<script/.test(CITE.runsHtml(r2)), "text is escaped on the way out");
ok(CITE.styleInfo('<style class="in-text"><info><title>Nature</title><link href="http://www.zotero.org/styles/x" rel="independent-parent"/><category citation-format="numeric"/></info></style>').parent === "http://www.zotero.org/styles/x", "a dependent style names its parent");

/* The draft check */
const src = [CITE.clean({id: "a", type: "article-journal", title: "Parks and heat", author: [{family: "Smith", given: "J"}], issued: {"date-parts": [[2021]]}}),
  CITE.clean({id: "b", type: "book", title: "Urban trees", author: [{family: "Lee", given: "K"}, {family: "Ng", given: "M"}], issued: {"date-parts": [[2019]]}}),
  CITE.clean({id: "c", type: "webpage", title: "Heat and health", author: [{literal: "World Health Organization"}], issued: {"date-parts": [[2023]]}})];
const draft = `Cities are warming. Parks are cooler than the blocks around them (Smith 2021). Lee and Ng (2019) say trees help.
As one study put it, "shade from street trees lowers the temperature of sidewalks for people waiting for buses" and that matters.
Others disagree (Johnson, 2018).

References
Smith, J. (2021). Parks and heat.`;
const R = CITE.check(draft, src, {style: "apa", kind: "author-date", label: "APA", req: "Use APA. Cite at least 4 scholarly sources."});
const T = R.issues.map(x => x.k + ": " + x.t);
ok(R.cited === 2 && R.total === 3, "two of three sources cited (one narratively)");
ok(T.some(t => /^warn: Never cited: Heat and health/.test(t)), "a source never cited");
ok(T.some(t => /^err: Not in your sources: \(Johnson, 2018\)/.test(t)), "a citation that matches no source");
ok(T.some(t => /^err: Quote without a citation: “shade from street trees/.test(t)), "a quote without a citation");
ok(T.some(t => /^err: Cited but not in your References list: Urban trees/.test(t)), "a cited source missing from the list");
ok(T.some(t => /comma between the name and the year/.test(t)), "an APA slip: (Smith 2021)");
ok(T.some(t => /^err: The assignment asks for at least 4 scholarly sources: you cite 2/.test(t)), "the assignment's minimum");
ok(!T.some(t => /asks for APA/.test(t)), "the right style isn't flagged");
const R2 = CITE.check(draft.replace("References", "Bibliography"), src, {style: "modern-language-association", kind: "author", label: "MLA", req: "Format in APA style", names: {apa: "APA 7th edition"}});
ok(R2.issues.some(x => x.k === "err" && /asks for APA 7th edition/.test(x.t) && x.fix === "style:apa"), "a style mismatch offers to switch");
ok(R2.issues.some(x => /Your list is called “Bibliography”/.test(x.t)), "MLA expects Works Cited");
ok(R2.issues.some(x => /author and the page, not the year/.test(x.t)), "an MLA slip: a year in the citation");
// a format slip quotes the student's own citation, corrected (not a made-up example)
{ const r = CITE.check("Sleep matters (Carskadon 2011). Both agree (Lo and Lee, 2018). Old (Xie et al. 2013).\n\nReferences\n", [], {style: "apa", kind: "author-date", label: "APA"}), t = r.issues.map(x => x.t + " " + (x.d || "")).join(" | ");
  ok(/put a comma between the name and the year: \(Carskadon, 2011\)/.test(t) && /\(Xie et al\., 2013\)/.test(t) && /use & between two authors inside brackets: \(Lo & Lee, 2018\)/.test(t) && !/Smith/.test(t), "APA slips show the student's citation fixed: " + t); }
{ const r = CITE.check("Short sleep blunts memory (Walker, 112).\n\nWorks Cited\n", [], {style: "modern-language-association", kind: "author", label: "MLA"}), t = r.issues.map(x => x.t + " " + (x.d || "")).join(" | ");
  ok(/no comma or p\. between the name and the page: \(Walker 112\)/.test(t) && !/Smith/.test(t), "an MLA slip shows the student's citation fixed: " + t); }
// results never contradict: a citation that isn't in the sources keeps "every cited source" from being claimed, and its format slip joins it
{ const src2 = [{id: "w", type: "book", title: "Why We Sleep", author: [{family: "Walker", given: "Matthew"}], issued: {"date-parts": [[2017]]}}];
  const r = CITE.check("Sleep matters (Walker, 2017). Others disagree (Carskadon 2011).\n\nReferences\nWalker, M. (2017). Why we sleep. Scribner.\n", src2, {style: "apa", kind: "author-date", label: "APA"});
  const t2 = r.issues.map(x => x.k + ": " + x.t + (x.d ? " / " + x.d : "")).join(" | ");
  ok(!/Every cited source/.test(t2) && /ok: Your cited Writing Studio source is in your References list/.test(t2), "with a citation not in the sources, the reference check speaks only for the Writing Studio sources: " + t2);
  ok(r.issues.filter(x => /Carskadon/.test(x.t + x.d)).length === 1 && /isn't in your References list either\. Also: In APA, put a comma between the name and the year: \(Carskadon, 2011\)/.test(t2), "one entry for that citation: not in the sources, not in the list, and its comma"); }
// "Walker (2017)": the name just before year-only brackets counts (et al. included); a name in an earlier citation never does
{ const W = [{id: "w", type: "book", title: "Why We Sleep", author: [{family: "Walker", given: "M"}], issued: {"date-parts": [[2017]]}}, {id: "x", type: "article-journal", title: "Sleep Drives", author: [{family: "Xie", given: "L"}, {family: "Kang", given: "H"}, {family: "Xu", given: "Q"}], issued: {"date-parts": [[2013]]}}];
  const c = d => CITE.check(d + "\n\nReferences\nWalker. Xie.", W, {style: "apa", kind: "author-date", label: "APA"});
  ok(c("Walker (2017) argues that sleep matters.").citedIds.join() === "w" && c("According to Walker (2017, p. 4), sleep matters.").citedIds.join() === "w" && c("Xie et al. (2013) found clearance.").citedIds.join() === "x", "a name just before year-only brackets is the citation's author (et al. too)");
  const r = c("Sleep matters (Walker, 2017). Others disagree (Carskadon 2011).");
  ok(r.issues.some(x => x.t === "Not in your sources: (Carskadon 2011)"), "a citation that names its own author is never credited to a name further back"); }
const R3 = CITE.check("Trees cool cities [1] and parks too [2], [4].\n\nReferences\n[1] Smith\n[2] Lee", src, {style: "ieee", kind: "numeric", label: "IEEE"});
ok(R3.cited === 2 && R3.issues.some(x => /Not in your sources: \[4\]/.test(x.t)), "IEEE numbers, and one that doesn't exist");
ok(CITE.check("x", [], {}).issues.some(x => /No sources/.test(x.t)), "no sources at all says so");
// Sentence case for APA-like styles: only Title Case titles change; acronyms, inner capitals and the word after a colon keep theirs
ok(CITE.sentenceCase("How the Mind Hurts and Heals the Body") === "How the mind hurts and heals the body", "a Title Case title becomes sentence case");
ok(CITE.sentenceCase("The Heat Island: A Review of DNA and iPhone Use") === "The heat island: A review of DNA and iPhone use", "acronyms, inner capitals and the first word after a colon stay");
ok(CITE.sentenceCase("Cities and climate change") === "Cities and climate change", "a title already in sentence case is left alone");
// A source with no author or title (a link whose page shared nothing) has no name to match: it can't swallow every citation
const R4 = CITE.check(draft, src.concat([{id: "web", type: "webpage", "container-title": "nytimes.com", URL: "https://www.nytimes.com/x.html"}]), {style: "apa", kind: "author-date", label: "APA"});
ok(R4.issues.some(x => /Not in your sources: \(Johnson, 2018\)/.test(x.t)) && R4.issues.some(x => /A source has no title or author/.test(x.t)) && R4.cited === R.cited, "an unnamed source is named as incomplete and the check still works: " + JSON.stringify(R4.issues.map(x => x.t)));
ok(JSON.stringify(CITE.rules("Use MLA format with a minimum of five peer-reviewed sources")) === JSON.stringify({style: "modern-language-association", min: 5, scholarly: true}), "assignment rules: style and minimum");
ok(CITE.rules("Chicago style with footnotes").style === "chicago-notes-bibliography" && CITE.rules("Chicago author-date").style === "chicago-author-date", "Chicago notes or author-date");

/* Where each issue is in the draft, and the sentence around it */
const johnson = R.issues.find(x => /Johnson/.test(x.t));
ok(johnson.at === draft.indexOf("(Johnson, 2018)") && johnson.len === "(Johnson, 2018)".length, "an issue knows where it is in the draft");
const [s0, e0] = CITE.sentenceAt(draft, johnson.at, johnson.len);
ok(draft.slice(s0, e0) === "Others disagree (Johnson, 2018).", "and the sentence around it: " + draft.slice(s0, e0));
const bareQ = R.issues.find(x => /Quote without/.test(x.t)), [s1, e1] = CITE.sentenceAt(draft, bareQ.at, bareQ.len);
ok(/^As one study put it, "shade from street trees/.test(draft.slice(s1, e1)) && /that matters\.$/.test(draft.slice(s1, e1)), "a quote's sentence runs past the quote");
ok(!R.issues.some(x => /Never cited/.test(x.t) && x.at != null), "a source never cited has no place");
ok(R.citedIds.join() === "a,b", "the sources it found cited, by id");
/* What changed since the last check */
const fixedDraft = draft.replace(" Others disagree (Johnson, 2018).", "").replace("(Smith 2021)", "(Smith, 2021)") + "\nLee, K., & Ng, M. (2019). Urban trees.\nWorld Health Organization. (2023). Heat and health.";
const R5 = CITE.check(fixedDraft, src, {style: "apa", kind: "author-date", label: "APA"});
const D = CITE.diffIssues(CITE.issueKeys(R), R5);
ok(D.fixed >= 3 && D.fresh === 0, `fixed and new since the last check: ${D.fixed} fixed, ${D.fresh} new`);
ok(CITE.diffIssues([], R).fresh === CITE.issueKeys(R).length, "everything is new on a first check");
ok(CITE.hash("abc") === CITE.hash("abc") && CITE.hash("abc") !== CITE.hash("abd"), "a draft's fingerprint changes when it does");
const long = "Body. ".repeat(20000) + "\n\nReferences\nSmith, J. (2021). Parks and heat.";
const capped = CITE.capDraft(long, 60000);
ok(capped.length <= 60000 && /References\nSmith, J\. \(2021\)\. Parks and heat\.$/.test(capped), "a long draft is capped, keeping its reference list");

/* Reading the draft's reference list */
const refDraft = `Intro (Smith & Lee, 2021).

References
Smith, J. A., & Lee, K. (2021). The urban heat island effect and green infrastructure. Urban Climate,
38(2), 100–118. https://doi.org/10.1016/j.uclim.2021.100118
Ng, M. (2019). Cities and climate change. Routledge.
World Health Organization. (2020, May 3). Heat and health.
https://www.who.int/news-room/fact-sheets/detail/heat

Appendix A
Survey questions (2020).`;
const E = CITE.refEntries(refDraft);
ok(E.length === 3 && /^Smith, J\. A\., & Lee, K\. \(2021\).*Urban Climate, 38\(2\), 100–118\. https:\/\/doi\.org/.test(E[0]) && /who\.int/.test(E[2]), "entries split by line, wrapped lines joined, the appendix left out");
const EN = CITE.refEntries("Text.\n\nWorks Cited\n\n[1] J. A. Smith and K. Lee, “Title one,” Urban Climate, vol. 38, 2021.\n[2] M. Ng, Cities and Climate Change. London:\nRoutledge, 2019.");
ok(EN.length === 2 && /London: Routledge, 2019\.$/.test(EN[1]), "numbered entries, wrapped");
const EB = CITE.refEntries("Text.\n\nBibliography\n\nNg, Mo. Cities and Climate Change. London:\nRoutledge, 2019.\n\nSmith, Jordan A., and Kim Lee. 2021. “The Urban Heat Island Effect.” Urban Climate 38 (2): 100–118.");
ok(EB.length === 2 && /^Smith, Jordan/.test(EB[1]), "entries split by blank lines");
ok(CITE.refEntries("No list here at all, just words (2020).").length === 0, "no list, no entries");
const P = x => CITE.parseRef(x), fam = it => (it.author || []).map(a => a.literal || `${a.family}|${a.given || ""}`).join("; ");
// APA
let it = P("Smith, J. A., & Lee, K. (2021). The urban heat island effect and green infrastructure. Urban Climate, 38(2), 100–118. https://doi.org/10.1016/j.uclim.2021.100118");
ok(it.type === "article-journal" && fam(it) === "Smith|J. A.; Lee|K." && CITE.yearOf(it) === 2021 && it.title === "The urban heat island effect and green infrastructure" && it["container-title"] === "Urban Climate" && it.volume === "38" && it.issue === "2" && it.page === "100–118" && it.DOI === "10.1016/j.uclim.2021.100118", "APA journal article: " + JSON.stringify(it));
it = P("Ng, M. (2019). Cities and climate change (2nd ed.). Routledge.");
ok(it.type === "book" && it.title === "Cities and climate change" && it.edition === "2" && it.publisher === "Routledge" && fam(it) === "Ng|M.", "APA book with an edition");
it = P("World Health Organization. (2020, May 3). Heat and health. https://www.who.int/news-room/fact-sheets/detail/heat");
ok(it.type === "webpage" && fam(it) === "World Health Organization" && it.URL === "https://www.who.int/news-room/fact-sheets/detail/heat" && CITE.yearOf(it) === 2020, "APA web page by an organisation");
it = P("Brown, A. (2018). Shade in the city. In P. Green (Ed.), Handbook of urban design (pp. 45–67). Springer.");
ok(it.type === "chapter" && it["container-title"] === "Handbook of urban design" && it.page === "45–67", "APA book chapter");
it = P("Kahneman, D. (2011). Thinking, fast and slow. Farrar, Straus and Giroux. ISBN 978-0-374-27563-1");
ok(it.ISBN === "9780374275631" && it.type === "book" && it.title === "Thinking, fast and slow", "an ISBN in an entry");
// MLA
it = P("Smith, Jordan A., and Kim Lee. “The Urban Heat Island Effect and Green Infrastructure.” Urban Climate, vol. 38, no. 2, 2021, pp. 100-18.");
ok(it.type === "article-journal" && fam(it) === "Smith|Jordan A.; Lee|Kim" && it.title === "The Urban Heat Island Effect and Green Infrastructure" && it["container-title"] === "Urban Climate" && it.volume === "38" && it.issue === "2" && it.page === "100–18" && CITE.yearOf(it) === 2021, "MLA article: " + JSON.stringify(it));
it = P("Ng, Mo. Cities and Climate Change. Routledge, 2019.");
ok(it.type === "book" && fam(it) === "Ng|Mo" && it.title === "Cities and Climate Change" && it.publisher === "Routledge" && CITE.yearOf(it) === 2019, "MLA book");
// Chicago
it = P("Smith, Jordan A., and Kim Lee. 2021. “The Urban Heat Island Effect and Green Infrastructure.” Urban Climate 38 (2): 100–118. https://doi.org/10.1016/j.uclim.2021.100118.");
ok(it.type === "article-journal" && CITE.yearOf(it) === 2021 && fam(it) === "Smith|Jordan A.; Lee|Kim" && it["container-title"] === "Urban Climate" && it.volume === "38" && it.issue === "2" && it.page === "100–118" && it.DOI === "10.1016/j.uclim.2021.100118", "Chicago author-date article");
it = P("Ng, Mo. Cities and Climate Change. London: Routledge, 2019.");
ok(it.type === "book" && it["publisher-place"] === "London" && it.publisher === "Routledge" && CITE.yearOf(it) === 2019, "Chicago book with place and publisher");
// IEEE
it = P("[1] J. A. Smith and K. Lee, “The urban heat island effect and green infrastructure,” Urban Climate, vol. 38, no. 2, pp. 100–118, 2021, doi: 10.1016/j.uclim.2021.100118.");
ok(it.type === "article-journal" && fam(it) === "Smith|J. A.; Lee|K." && it.title === "The urban heat island effect and green infrastructure" && it["container-title"] === "Urban Climate" && it.page === "100–118" && it.DOI === "10.1016/j.uclim.2021.100118", "IEEE article: " + JSON.stringify(it));
it = P("[2] M. Ng, Cities and Climate Change, 2nd ed. London, U.K.: Routledge, 2019.");
ok(it.type === "book" && fam(it) === "Ng|M." && it.title === "Cities and Climate Change" && it.edition === "2" && it.publisher === "Routledge" && it["publisher-place"] === "London, U.K.", "IEEE book: " + JSON.stringify(it));
// Harvard
it = P("Smith, J.A. and Lee, K. (2021) 'The urban heat island effect and green infrastructure', Urban Climate, 38(2), pp. 100–118. doi: 10.1016/j.uclim.2021.100118.");
ok(it.type === "article-journal" && fam(it) === "Smith|J. A.; Lee|K." && it.title === "The urban heat island effect and green infrastructure" && it["container-title"] === "Urban Climate" && it.volume === "38" && it.page === "100–118", "Harvard article: " + JSON.stringify(it));
it = P("Ng, M. (2019) Cities and climate change. London: Routledge.");
ok(it.type === "book" && it.publisher === "Routledge" && it["publisher-place"] === "London" && CITE.yearOf(it) === 2019, "Harvard book");
ok(CITE.dupOf(P("Smith, J. A., & Lee, K. (2021). The urban heat island effect and green infrastructure. Urban Climate, 38(2), 100–118."), [CITE.clean({id: "x", title: "The urban heat island effect and green infrastructure", issued: {"date-parts": [[2021]]}})]), "an entry already among the sources is a duplicate");
ok(P("") === null, "an empty entry is nothing");

/* Quoted passages in the draft */
const qsrc = [CITE.clean({id: "s1", title: "x", author: [{family: "Smith"}], issued: {"date-parts": [[2021]]}}), CITE.clean({id: "s2", title: "Cities", author: [{family: "Ng"}], issued: {"date-parts": [[2019]]}})];
const QS = CITE.quotesIn(`Parks were "on average four degrees cooler than the surrounding blocks" (Smith & Lee, 2021, p. 104). Ng writes that "cities must plan for heat before the summer comes" (Ng 50). As Ng puts it, “the plan matters more than the money spent.”³ And "this has no citation at all, really nothing" here. One more "numbered quote that has a number after it" [2, p. 9].\n\nReferences\nSmith "a quoted title that is in the list itself" (2021).`, qsrc);
ok(QS.length === 4, "four quotes with citations (one without is left out, and the list isn't read): " + QS.length);
ok(QS[0].sid === "s1" && QS[0].p === "104" && QS[0].t === "on average four degrees cooler than the surrounding blocks", "APA: the source and page");
ok(QS[1].sid === "s2" && QS[1].p === "50", "MLA: the page after the name");
ok(QS[2].cite === "Note 3" && QS[2].sid === "s2" && QS[2].p === "", "a footnote mark, with the source named before the quote");
ok(QS[3].sid === "s2" && QS[3].p === "9" && QS[3].cite === "[2]", "a numbered citation with a page");

/* ---------- Concept Maps ---------- */
const SRC = () => ({root: {label: "BIO 201", kind: "course"}, mode: "course",
  exams: [{id: "x1", label: "Midterm", topics: [{id: "t1", name: "Cell respiration", conf: "weak", links: [{k: "deck", id: "d1"}, {k: "note", id: "n1"}]}, {id: "t2", name: "Photosynthesis", conf: "strong", links: [{k: "quiz", id: "q", deckId: "d2"}]}]}],
  notes: [{id: "n1", label: "Krebs cycle", text: "Krebs cycle\nSee [[Glycolysis]] and [[Lecture 3 slides.pdf#p4]]", cls: "2026-10-01T10:00|Lecture"}, {id: "n2", label: "Glycolysis", text: "Glycolysis\n..."}, {id: "n3", label: "Stray thought", text: "Stray thought"}],
  decks: [{id: "d1", label: "Respiration deck", from: [["note", "n1"], ["file", "f1"]]}, {id: "d2", label: "Light reactions", from: []}],
  files: [{id: "f1", label: "Lecture 3 slides.pdf", cls: "2026-10-01T10:00|Lecture", pdf: true}, {id: "f2", label: "Syllabus.pdf"}],
  classes: {"2026-10-01T10:00|Lecture": "Lecture 3, Oct 1"}, user: {}});
let g = CMAP.graph(SRC());
const has = (a, b) => g.edges.some(e => e.key === CMAP.ek(a, b));
ok(g.nodes.find(x => x.id === "root").label === "BIO 201", "the course is the centre");
ok(has("root", "exam:x1") && has("exam:x1", "topic:x1:t1") && has("topic:x1:t1", "deck:d1") && has("topic:x1:t1", "note:n1") && has("topic:x1:t2", "deck:d2"), "exam, topics and the topics' linked material (a quiz links its deck)");
ok(has("note:n1", "note:n2") && has("note:n1", "file:f1"), "[[links]] by name, a #page link too");
ok(has("deck:d1", "note:n1") && g.edges.find(e => e.key === CMAP.ek("deck:d1", "file:f1")).label === "made from", "decks to what their cards were made from");
ok(has("class:2026-10-01T10:00|Lecture", "note:n1") && has("root", "class:2026-10-01T10:00|Lecture"), "classes hold their notes and files");
ok(g.loose.map(x => x.id).sort().join() === "file:f2,note:n3", "items linked to nothing are set aside: " + g.loose.map(x => x.id));
ok(CMAP.graph(Object.assign(SRC(), {loose: true})).nodes.some(x => x.id === "note:n3"), "and can be shown");
// the student's overlay
g = CMAP.graph(Object.assign(SRC(), {user: {hide: ["note:n2"], add: [{id: "i1", label: "ATP"}], links: [{a: "idea:i1", b: "topic:x1:t1", label: "is made by"}], cut: [CMAP.ek("deck:d1", "file:f1")], names: {"deck:d1": "Resp. cards"}}}));
ok(!g.nodes.some(x => x.id === "note:n2") && !has("note:n1", "note:n2"), "a hidden node and its edges go");
ok(g.nodes.some(x => x.id === "idea:i1" && x.kind === "idea") && g.edges.find(e => e.key === CMAP.ek("idea:i1", "topic:x1:t1")).label === "is made by", "an idea with a labelled connection");
ok(!has("deck:d1", "file:f1"), "a removed automatic connection stays removed");
ok(g.nodes.find(x => x.id === "deck:d1").label === "Resp. cards", "a rename");
// an exam map keeps what its topics reach
const ex = CMAP.graph(Object.assign(SRC(), {mode: "exam", root: {label: "Midterm", kind: "exam"}, classes: {}}));
ok(ex.nodes.some(x => x.id === "topic:x1:t1") && !ex.nodes.some(x => x.id === "exam:x1") && ex.edges.some(e => e.key === CMAP.ek("root", "topic:x1:t1")), "the exam is the centre, its topics around it");
ok(!ex.nodes.some(x => x.id === "file:f2"), "unrelated material isn't on an exam map");
// knowledge colour
g = CMAP.graph(SRC());
const K = CMAP.knowledge(g);
ok(K["topic:x1:t1"] === "weak" && K["deck:d1"] === "weak" && K["deck:d2"] === "strong" && !K["class:2026-10-01T10:00|Lecture"], "topics by confidence, material by the weakest topic it supports");
// layout
const L1 = CMAP.layout(g, {}), L2 = CMAP.layout(g, {});
ok(JSON.stringify(L1) === JSON.stringify(L2), "the layout is the same every time");
ok(L1.root[0] === 0 && L1.root[1] === 0, "the centre stays in the middle");
const near = [];
g.nodes.forEach((a, i) => g.nodes.slice(i + 1).forEach(b => { const d = Math.hypot(L1[a.id][0] - L1[b.id][0], L1[a.id][1] - L1[b.id][1]); near.push(d); }));
ok(Math.min(...near) > 40, "nodes don't sit on each other: " + Math.round(Math.min(...near)));
const L3 = CMAP.layout(g, {"note:n2": [500, -300]});
ok(L3["note:n2"][0] === 500 && L3["note:n2"][1] === -300, "a node you moved stays where you put it");
// quiz
const Q = CMAP.quizPick(g, 42);
ok(Q.ids.length >= 5 && Q.ids.length <= 12 && !Q.ids.includes("root") && Q.bank.length === Q.ids.length, "Fill In the Map picks up to 12 labelled nodes");
ok(Q.ids.slice(0, 2).every(id => /^topic:/.test(id)), "topics first");
// AI suggestions are checked
const S = CMAP.parseSuggest({links: [{a: "note:n2", b: "deck:d2", label: "feeds", why: "x"}, {a: "note:n2", b: "nope", label: "x"}, {a: "deck:d2", b: "note:n2", label: "dup"}], concepts: [{name: "ATP", near: ["note:n1", "ghost"], label: "makes"}, {name: "Nothing", near: ["ghost"]}]}, g.nodes.map(x => x.id));
ok(S.links.length === 1 && S.links[0].label === "feeds", "only links between real nodes, once each");
ok(S.ideas.length === 1 && S.ideas[0].near.join() === "note:n1", "ideas need at least one real node");
ok(CMAP.parseSuggest(null, []).links.length === 0, "a garbled reply is nothing");

console.log(`writing-studio.test: ${n} passed`);
