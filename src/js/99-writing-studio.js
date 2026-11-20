/* ===== module: 99-writing-studio.js ===== */
/* Writing Studio (Pro): a reference manager for each paper, with quotes, an outline and a citation check. No AI.
   - Entry: "Writing Studio" in the task sheet's actions, on the same assignment-like tasks as Rubric Check (and on any task that already
     has sources, quotes or a draft). Also: a small chip on Board cards and in Do This Next for papers that already have Writing Studio data;
     a Writing view in Review (papers with data and upcoming essays and reports, plus My Library and Zotero without picking a paper); a
     Break It Down step opens its matching tab; Today's Plan suggests Check Citations (one row) on or the day before the due date when the
     saved draft hasn't been checked since it changed. Free accounts see a PRO badge, which opens the Pro sheet.
   - Tabs: Check, Sources, Quotes, Outline. Opening lands on Check, or on Sources for a paper with sources but no draft yet. A strip on every
     tab says how far along the paper is (sources · quotes · placed · last check), each part a way to its tab.
   - Citations are made by citeproc-js (the CSL processor Zotero itself uses, vendor/citeproc-2.4.63) with real CSL styles, so the output is
     the same as Zotero's: 8 styles come with the app and work offline (APA 7, MLA 9, Chicago author-date and notes-bibliography, IEEE,
     Harvard Cite Them Right, AMA, ASA), and any of the 10,000+ styles in the Zotero Style Repository can be searched and added (fetched
     once from zotero.org, then kept on this device). Sources are stored as CSL-JSON, Zotero's own exchange format: 17 item types, authors,
     editors and translators (people or organisations), dates, editions, series, DOI, ISBN, ISSN and the rest.
   - Adding sources: paste a DOI or arXiv ID (resolved at doi.org, the way Zotero does it; Crossref as a fallback), an ISBN (Open Library) or
     a link (read for its citation details when the site allows it, else added with its address to fill in); a PDF in Studyboard (read on
     this device for its DOI); typed by hand; imported from a BibTeX, RIS or CSL-JSON file or paste (what Zotero, Mendeley, EndNote and
     Google Scholar export); picked from My Library (every source in your other papers); or pulled from Zotero.
   - Zotero: connect with a Zotero API key (kept on this device only; requests go straight to api.zotero.org). Browse My Library and group
     libraries by collection, search, tick items and add them; items keep their Zotero key, and Update From Zotero refreshes them.
   - Lookups send only the identifier. Duplicates (same DOI, ISBN, or title and year) are skipped. Export the list as BibTeX, RIS or
     CSL-JSON (Zotero imports all three).
   - Quotes: reader highlights come in as quotes tied to their source and page; each has its in-text citation (a footnote in note styles)
     and opens its page again, and says when the draft uses it. Open a PDF to Highlight opens the reader for this paper (its PDF sources and
     the course's PDFs, or an upload): each new highlight offers Add as Quote there and then (the PDF becomes a source if it isn't one), and
     closing the reader comes back to Quotes. A PDF that's a source of exactly one open paper shows the same "Writing Studio: <paper>" bar
     in the reader from anywhere. Sources without a PDF get Attach PDF. Each source says how it's used (quoted, cited in the draft).
   - Outline: sections (Introduction, Body, Conclusion, or the paper's milestones), quotes dragged into them; sections with no quotes and
     quotes never placed are pointed out. Export to Word (with real footnotes for note styles), Google Docs (copied as formatted text) or text.
   - Check: the draft (pasted, uploaded, or chosen from Studyboard: this assignment's files, the course's, all files, or a longer note; an
     attached draft is offered) is kept on the paper (t.ws.draft: its text capped at 60,000 characters, where it came from, when) so it
     isn't pasted again, and checked on this device: sources never cited, citations matching no source, quotes without a citation, a
     missing or misnamed reference list, sources missing from it, the format of every in-text citation in the chosen style (APA, MLA,
     Chicago, ASA, Harvard, IEEE, AMA; a Zotero style by its parent's or citeproc's own rules), the same problem grouped with its first place
     marked and the others listed, each with its right form; a year that isn't the source's; a draft written in another style (Switch to);
     the list's order, and each entry against the style's own version of it (citeproc's), as named differences with Should Be and Copy;
     and the assignment's own rules (the style it names, at least N sources). The last check is kept too (t.ws.chk), so Check Again says what changed ("2 fixed, 1 new"); a draft
     from a Studyboard file or note is read again when that changed. Clicking an issue shows its sentence marked in a read-only view of
     the draft. Check feeds the other tabs: the entries in the draft's reference list that aren't sources yet (ones with a DOI or ISBN
     looked up, the rest read from the list and marked to check) and its quoted passages with a citation (tied to their source and page)
     can be ticked and added. It never writes or rewrites any of the student's work.
   - After adding a source: Also Add to Another Paper? for the other open papers in the course. A Break It Down step is ticked done only
     where it's clearly measurable: "find N sources" once there are N, and a step only about the citations once the saved draft's latest
     check has nothing to fix (never quotes, outlines, drafting, proofreading or handing in).
   - Saved on the task (t.ws), so it syncs; changes have Undo.
   The pure part is between CITE-START and CITE-END. */
(() => {
/*CITE-START*/
const CITE = (() => {
  const sq = s => String(s == null ? "" : s).replace(/\s+/g, " ").trim();
  const cap = (s, n) => sq(s).slice(0, n || 600);

  /* Item types (CSL) with the fields each one shows in the form, as Zotero groups them */
  const TYPES = {
    "article-journal": ["Journal Article", ["container-title", "volume", "issue", "page", "DOI", "ISSN", "URL"]],
    "book": ["Book", ["editor", "translator", "edition", "collection-title", "publisher", "publisher-place", "number-of-pages", "ISBN", "DOI", "URL"]],
    "chapter": ["Book Section", ["container-title", "editor", "translator", "edition", "publisher", "publisher-place", "page", "ISBN", "DOI", "URL"]],
    "webpage": ["Web Page", ["container-title", "URL", "accessed"]],
    "article-newspaper": ["Newspaper Article", ["container-title", "section", "page", "URL", "accessed"]],
    "article-magazine": ["Magazine Article", ["container-title", "volume", "issue", "page", "URL", "accessed"]],
    "paper-conference": ["Conference Paper", ["container-title", "event-title", "editor", "publisher", "publisher-place", "page", "DOI", "ISBN", "URL"]],
    "report": ["Report", ["genre", "number", "collection-title", "publisher", "publisher-place", "DOI", "URL", "accessed"]],
    "thesis": ["Thesis", ["genre", "publisher", "publisher-place", "number-of-pages", "DOI", "URL"]],
    "entry-encyclopedia": ["Encyclopedia Article", ["container-title", "editor", "edition", "volume", "publisher", "publisher-place", "page", "URL", "accessed"]],
    "entry-dictionary": ["Dictionary Entry", ["container-title", "editor", "edition", "publisher", "URL", "accessed"]],
    "post-weblog": ["Blog Post", ["container-title", "URL", "accessed"]],
    "post": ["Forum or Social Post", ["container-title", "genre", "URL", "accessed"]],
    "motion_picture": ["Film or Video", ["container-title", "medium", "publisher", "dimensions", "URL", "accessed"]],
    "dataset": ["Dataset", ["publisher", "version", "DOI", "URL", "accessed"]],
    "software": ["Software", ["publisher", "version", "URL", "accessed"]],
    "speech": ["Lecture or Presentation", ["event-title", "event-place", "genre", "URL"]],
    "document": ["Other", ["container-title", "publisher", "publisher-place", "URL", "accessed"]]
  };
  const LABEL = {"container-title": "Published in", "collection-title": "Series", "publisher-place": "Place", "number-of-pages": "# of pages", "page": "Pages", "event-title": "Conference or event", "event-place": "Event place", "genre": "Type", "number": "Report number", "section": "Section", "dimensions": "Running time", "medium": "Format", "edition": "Edition", "volume": "Volume", "issue": "Issue", "publisher": "Publisher", "version": "Version", "DOI": "DOI", "ISBN": "ISBN", "ISSN": "ISSN", "URL": "Link", "accessed": "Accessed", "editor": "Editors", "translator": "Translators"};
  const CONT = {"article-journal": "Journal", "chapter": "Book title", "webpage": "Website", "article-newspaper": "Newspaper", "article-magazine": "Magazine", "paper-conference": "Proceedings", "entry-encyclopedia": "Encyclopedia", "entry-dictionary": "Dictionary", "post-weblog": "Blog", "post": "Site", "motion_picture": "Channel or series"};
  const NAMES = ["author", "editor", "translator", "container-author", "director", "interviewer", "recipient"];
  const STR = ["title", "title-short", "container-title", "container-title-short", "collection-title", "collection-number", "publisher", "publisher-place", "event-title", "event-place", "genre", "medium", "dimensions", "number", "number-of-pages", "number-of-volumes", "volume", "issue", "page", "section", "edition", "version", "DOI", "ISBN", "ISSN", "PMID", "URL", "language", "note", "archive", "archive_location", "references", "authority", "chapter-number", "status", "source"];
  // an organisation, not a person: no comma, and a word like University or Association (or wrapped in {braces}, as BibTeX does)
  const ORG = /\b(organi[sz]ation|association|institute|institution|department|university|college|society|council|agency|cent(er|re)|ministry|office|bureau|foundation|committee|commission|board|inc|ltd|llc|corp(oration)?|company|group|news|press|times|post|journal|government|nations|bank|fund|network|project|team|staff|editors|service|services|museum|library|school|hospital|clinic|authority|trust|union|federation|alliance|coalition|party|court|congress|parliament|senate|state|city|county|bbc|cnn|npr|nasa|who|unesco|unicef)\b/i;
  function person(p){
    p = sq(p).replace(/^(and|&)\s+/i, ""); if (!p) return null;
    const lit = /^\{(.+)\}$/.exec(p); if (lit) return {literal: sq(lit[1])};
    if (p.includes(",")) { const [f, ...g] = p.split(","); const given = sq(g.join(" ")); return f ? (given ? {family: sq(f), given} : {family: sq(f)}) : null; }
    const w = p.split(" ");
    if (w.length === 1 || ORG.test(p) || w.length > 4) return {literal: p};
    let i = w.length - 1; while (i > 1 && /^(van|von|de|del|della|da|di|la|le|du|der|den|ter|bin|al|dos|das)$/i.test(w[i - 1])) i--;
    return {family: w.slice(i).join(" "), given: w.slice(0, i).join(" ")};
  }
  // Names typed one per line (or split by ;), "Family, Given" or "Given Family"; BibTeX's "and" lists too
  function names(text){
    const s = String(text || "").replace(/\r/g, "");
    const parts = /[\n;]/.test(s) ? s.split(/[\n;]+/) : s.split(/\s+and\s+/i);
    return parts.map(person).filter(Boolean).slice(0, 60);
  }
  const nameText = a => a.literal ? (/,|\s/.test(a.literal) && !ORG.test(a.literal) ? `{${a.literal}}` : a.literal) : a.given ? `${a.family}, ${a.given}` : a.family;
  const namesText = list => (list || []).map(nameText).join("\n");
  const familyOf = a => a ? (a.literal || a.family || "") : "";

  /* Dates */
  function date(y, m, d){ y = Number(String(y || "").match(/\d{4}/)); if (!y) return null; m = Number(m); d = Number(d); const p = [y]; if (m >= 1 && m <= 12) { p.push(m); if (d >= 1 && d <= 31) p.push(d); } return {"date-parts": [p]}; }
  function parseDate(s){
    s = sq(s); if (!s) return null;
    let m = /^(\d{4})(?:[-/.](\d{1,2})(?:[-/.](\d{1,2}))?)?/.exec(s); if (m) return date(m[1], m[2], m[3]);
    const MON = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
    m = /(\d{1,2})?\s*([A-Za-z]{3,})\.?\s*(\d{1,2})?,?\s*(\d{4})/.exec(s); if (m) { const mo = MON.indexOf(m[2].slice(0, 3).toLowerCase()) + 1; return date(m[4], mo, m[1] || m[3]); }
    m = /\b(\d{4})\b/.exec(s); if (m) return date(m[1]);
    return {literal: s.slice(0, 40)};
  }
  const dateParts = d => d && Array.isArray(d["date-parts"]) && Array.isArray(d["date-parts"][0]) ? d["date-parts"][0].map(Number) : [];
  const yearOf = it => dateParts(it && it.issued)[0] || "";
  const isoOf = d => { const p = dateParts(d); return p.length === 3 ? `${p[0]}-${String(p[1]).padStart(2, "0")}-${String(p[2]).padStart(2, "0")}` : ""; };

  /* Cleaning any CSL-JSON (from doi.org, Zotero, a file, the form) into what's stored: known fields only, sizes capped */
  function clean(o){
    o = o && typeof o === "object" ? o : {};
    const it = {id: cap(o.id, 80), type: TYPES[o.type] ? o.type : mapType(o.type)};
    STR.forEach(k => { const v = o[k]; if (v != null && v !== "" && (typeof v === "string" || typeof v === "number")) it[k] = cap(Array.isArray(v) ? v[0] : v, k === "title" || k === "container-title" ? 500 : k === "URL" ? 800 : 300); });
    if (Array.isArray(o.title)) it.title = cap(o.title[0], 500);
    if (Array.isArray(o["container-title"])) { const c = o["container-title"][0]; if (c) it["container-title"] = cap(c, 500); else delete it["container-title"]; }
    if (it.title) it.title = it.title.replace(/<\/?(i|b|sup|sub|em|strong|scp|span[^>]*)>/gi, "");
    if (it.DOI) it.DOI = it.DOI.replace(/^https?:\/\/(dx\.)?doi\.org\//i, "").replace(/^doi:\s*/i, "");
    if (it.page) it.page = it.page.replace(/\s*[-–—]+\s*/g, "–");
    NAMES.forEach(k => { if (Array.isArray(o[k])) { const l = o[k].filter(a => a && typeof a === "object" && (a.family || a.literal || a.name)).slice(0, 60).map(a => {
      const x = {}; if (a.literal || a.name) x.literal = cap(a.literal || a.name, 200); else { x.family = cap(a.family, 120); if (a.given) x.given = cap(a.given, 120); ["non-dropping-particle", "dropping-particle", "suffix"].forEach(p => { if (a[p]) x[p] = cap(a[p], 30); }); } return x; });
      if (l.length) it[k] = l; } });
    ["issued", "accessed", "original-date", "event-date"].forEach(k => { const d = o[k]; if (!d || typeof d !== "object") return; const p = dateParts(d).filter(n => n > 0).slice(0, 3); if (p.length) it[k] = {"date-parts": [p]}; else if (d.literal || d.raw) it[k] = {literal: cap(d.literal || d.raw, 40)}; });
    ["fid", "zkey", "zlib", "src", "rv"].forEach(k => { if (o[k]) it[k] = cap(o[k], 120); });
    if (o.caseAsIs) it.caseAsIs = true;
    return it;
  }
  /* Sentence case for styles that want it (APA, AMA, Harvard, IEEE, Vancouver): lookups give titles in Title Case, and CSL can't
     lower-case them. Only a title that looks Title Case changes; acronyms, words with inner capitals or digits, "I", and the first
     word (and the first after a colon) keep their capitals. A source marked caseAsIs (names in the title) is left as typed. */
  const SENT_STYLE = /\/(apa[^/<]*|american-medical-association|harvard-cite-them-right|ieee|vancouver)<\/id>/;
  function looksTitleCase(t){
    const w = String(t || "").match(/[\p{L}][\p{L}'’-]{3,}/gu) || [];
    return w.length >= 2 && w.filter(x => /^\p{Lu}/u.test(x)).length / w.length >= 0.6;
  }
  function sentenceCase(t){
    t = String(t || ""); if (!looksTitleCase(t)) return t;
    let first = true;
    return t.replace(/([\p{L}][\p{L}'’]*)|([:?!.—–]\s)/gu, (m, word, brk) => {
      if (brk) { first = true; return m; }
      const keep = first || /\p{Lu}/u.test(word.slice(1)) || /\d/.test(word) || word === "I";
      first = false;
      return keep ? word : word.charAt(0).toLowerCase() + word.slice(1);
    });
  }
  // a site name like "nytimes.com" is a name: the style mustn't make it "Nytimes.Com"
  const isHost = s => /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(String(s || ""));
  function mapType(t){
    t = String(t || "").toLowerCase();
    const M = {"journal-article": "article-journal", "journalarticle": "article-journal", "article": "article-journal", "posted-content": "article-journal", "proceedings-article": "paper-conference", "conferencepaper": "paper-conference",
      "book-chapter": "chapter", "booksection": "chapter", "book-section": "chapter", "reference-entry": "entry-encyclopedia", "encyclopediaarticle": "entry-encyclopedia", "monograph": "book", "edited-book": "book", "reference-book": "book",
      "web": "webpage", "website": "webpage", "blogpost": "post-weblog", "newspaperarticle": "article-newspaper", "magazinearticle": "article-magazine", "dissertation": "thesis", "film": "motion_picture", "videorecording": "motion_picture", "presentation": "speech", "computerprogram": "software"};
    return M[t] || (TYPES[t] ? t : t === "manuscript" || t === "personal_communication" ? "document" : "document");
  }

  /* What was pasted: a DOI, an arXiv ID, an ISBN or a link */
  function isbnOk(x){
    if (x.length === 10) { let t = 0; for (let i = 0; i < 10; i++) t += (x[i].toUpperCase() === "X" ? 10 : Number(x[i])) * (10 - i); return t % 11 === 0; }
    let t = 0; for (let i = 0; i < 13; i++) t += Number(x[i]) * (i % 2 ? 3 : 1); return t % 10 === 0;
  }
  function parseId(raw){
    const s = sq(raw); if (!s) return null;
    const ax = /(?:arxiv\.org\/(?:abs|pdf)\/|^arxiv:\s*)(\d{4}\.\d{4,5})(?:v\d+)?/i.exec(s); if (ax) return {kind: "doi", v: "10.48550/arXiv." + ax[1]};
    const d = /\b(10\.\d{4,9}\/[^\s"<>]+)/i.exec(s.replace(/^https?:\/\/(dx\.)?doi\.org\//i, "")); if (d) return {kind: "doi", v: d[1].replace(/[.,;)\]]+$/, "")};
    const digits = s.replace(/^isbn(-1[03])?:?\s*/i, "").replace(/[\s-]/g, "");
    if (/^(\d{9}[\dX]|\d{13})$/i.test(digits) && isbnOk(digits)) return {kind: "isbn", v: digits.toUpperCase()};
    if (/^https?:\/\/[^\s/]+\.[^\s]+$/i.test(s)) return {kind: "url", v: s};
    if (/^(www\.)?[a-z0-9-]+(\.[a-z0-9-]+)+\/?\S*$/i.test(s)) return {kind: "url", v: "https://" + s};
    return null;
  }
  function fromOpenLibrary(b, isbn){
    if (!b || typeof b !== "object" || !b.title) return null;
    return clean({type: "book", author: (b.authors || []).map(a => person(a.name || "")).filter(Boolean), title: b.subtitle ? `${b.title}: ${b.subtitle}` : b.title,
      issued: parseDate(b.publish_date), publisher: ((b.publishers || [])[0] || {}).name, "publisher-place": ((b.publish_places || [])[0] || {}).name, ISBN: isbn, "number-of-pages": b.number_of_pages});
  }
  const untag = s => sq(String(s || "").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'"));
  const hostOf = url => { try { return new URL(url).hostname.replace(/^www\./, ""); } catch (e) { return ""; } };
  // A web page's citation details from its <meta> tags (Highwire citation_*, Dublin Core, Open Graph), the way Zotero's Embedded Metadata reads them
  function fromHtml(html, url){
    const s = String(html || "").slice(0, 400000), metas = {};
    s.replace(/<meta\s[^>]*>/gi, tag => {
      const k = (/\b(?:name|property)\s*=\s*["']([^"']+)["']/i.exec(tag) || [])[1], v = (/\bcontent\s*=\s*["']([^"']*)["']/i.exec(tag) || [])[1];
      if (k && v != null) (metas[k.toLowerCase()] = metas[k.toLowerCase()] || []).push(untag(v));
      return tag;
    });
    const g = (...ks) => { for (const k of ks) if (metas[k] && metas[k][0]) return metas[k][0]; return ""; };
    const doi = /10\.\d{4,9}\/\S+/.exec(g("citation_doi", "dc.identifier", "prism.doi", "bepress_citation_doi"));
    const au = (metas.citation_author || metas["dc.creator"] || metas.author || metas["article:author"] || []).filter(a => !/^https?:/.test(a)).map(person).filter(Boolean).slice(0, 40);
    const journal = g("citation_journal_title"), conf = g("citation_conference_title"), book = g("citation_book_title");
    return clean({type: journal ? "article-journal" : conf ? "paper-conference" : book ? "chapter" : /article/i.test(g("og:type")) && /news|times|post|guardian|bbc|cnn|reuters/i.test(hostOf(url)) ? "article-newspaper" : "webpage",
      author: au, title: g("citation_title", "dc.title", "og:title", "twitter:title") || untag((/<title[^>]*>([\s\S]*?)<\/title>/i.exec(s) || [])[1]),
      "container-title": journal || conf || book || g("og:site_name", "application-name") || hostOf(url), issued: parseDate(g("citation_publication_date", "citation_date", "article:published_time", "dc.date", "date", "pubdate")),
      volume: g("citation_volume"), issue: g("citation_issue"), page: [g("citation_firstpage"), g("citation_lastpage")].filter(Boolean).join("–"), publisher: g("citation_publisher", "dc.publisher"),
      ISSN: g("citation_issn"), ISBN: g("citation_isbn"), DOI: doi ? doi[0] : "", URL: url});
  }

  /* BibTeX / BibLaTeX */
  const TEX = {"'": {a: "á", e: "é", i: "í", o: "ó", u: "ú", y: "ý", c: "ć", n: "ń", s: "ś", z: "ź", A: "Á", E: "É", I: "Í", O: "Ó", U: "Ú", C: "Ć", S: "Ś", Z: "Ź"}, "`": {a: "à", e: "è", i: "ì", o: "ò", u: "ù", A: "À", E: "È"}, '"': {a: "ä", e: "ë", i: "ï", o: "ö", u: "ü", y: "ÿ", A: "Ä", O: "Ö", U: "Ü"},
    "^": {a: "â", e: "ê", i: "î", o: "ô", u: "û", A: "Â", E: "Ê"}, "~": {a: "ã", n: "ñ", o: "õ", A: "Ã", N: "Ñ", O: "Õ"}, c: {c: "ç", C: "Ç", s: "ş", S: "Ş"}, v: {c: "č", s: "š", z: "ž", r: "ř", e: "ě", C: "Č", S: "Š", Z: "Ž", R: "Ř"}, "=": {a: "ā", e: "ē", o: "ō", u: "ū"}, "u": {a: "ă", g: "ğ"}, "H": {o: "ő", u: "ű"}};
  function detex(s){
    return String(s || "").replace(/\\([`'"^~=]|[cvuH](?=[\s{]))\s*\{?\\?([a-zA-Z])\}?/g, (m, a, l) => (TEX[a] && TEX[a][l]) || l)
      .replace(/\\(ss|ae|AE|oe|OE|o|O|l|L|aa|AA)\b\s*\{?\}?/g, (m, k) => ({ss: "ß", ae: "æ", AE: "Æ", oe: "œ", OE: "Œ", o: "ø", O: "Ø", l: "ł", L: "Ł", aa: "å", AA: "Å"})[k])
      .replace(/\\&/g, "&").replace(/\\%/g, "%").replace(/\\_/g, "_").replace(/\\\$/g, "$").replace(/\\#/g, "#").replace(/---/g, "—").replace(/--/g, "–").replace(/~/g, " ")
      .replace(/\\(textit|emph|textbf|textsc|textrm|mathrm|text)\s*\{/g, "{").replace(/\\url\{([^}]*)\}/g, "$1").replace(/[{}]/g, "").replace(/\s+/g, " ").trim();
  }
  const BIB_TYPE = {article: "article-journal", book: "book", mvbook: "book", inbook: "chapter", incollection: "chapter", bookinbook: "chapter", inproceedings: "paper-conference", conference: "paper-conference", proceedings: "book",
    phdthesis: "thesis", mastersthesis: "thesis", thesis: "thesis", techreport: "report", report: "report", online: "webpage", electronic: "webpage", www: "webpage", unpublished: "document", manual: "report", booklet: "book", inreference: "entry-encyclopedia", dataset: "dataset", software: "software", video: "motion_picture", movie: "motion_picture"};
  const BIB_MON = {jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12};
  function bibNames(v){ return String(v || "").split(/\s+and\s+/i).map(x => { x = x.trim(); if (/^\{[^{}]*\}$/.test(x)) return {literal: detex(x)}; return person(detex(x)); }).filter(Boolean); }
  function parseBibTeX(text){
    const s = String(text || ""), out = [], macros = {};
    let i = 0;
    while ((i = s.indexOf("@", i)) >= 0) {
      const m = /^@\s*([a-zA-Z]+)\s*([{(])/.exec(s.slice(i, i + 40)); if (!m) { i++; continue; }
      const kind = m[1].toLowerCase(), open = m[2], close = open === "{" ? "}" : ")"; let j = i + m[0].length, depth = 1, q = false;
      const start = j;
      for (; j < s.length && depth; j++) { const ch = s[j]; if (ch === "\\") { j++; continue; } if (ch === "{" ) depth++; else if (ch === "}" ) depth--; else if (open === "(" && ch === "(") depth++; else if (open === "(" && ch === ")") depth--; }
      const body = s.slice(start, j - 1); i = j;
      if (kind === "comment" || kind === "preamble") continue;
      const fields = {}; let key = "", k = 0;
      if (kind !== "string") { const c = body.indexOf(","); if (c < 0) continue; key = body.slice(0, c).trim(); k = c + 1; }
      // field = value pairs
      while (k < body.length) {
        const fm = /^\s*([A-Za-z][\w:-]*)\s*=\s*/.exec(body.slice(k)); if (!fm) break;
        k += fm[0].length; const name = fm[1].toLowerCase(); let val = "";
        for (;;) {
          while (/\s/.test(body[k] || "")) k++;
          const c0 = body[k];
          if (c0 === "{") { let d = 1, e = k + 1; for (; e < body.length && d; e++) { if (body[e] === "\\") { e++; continue; } if (body[e] === "{") d++; else if (body[e] === "}") d--; } val += body.slice(k + 1, e - 1); k = e; }
          else if (c0 === '"') { let e = k + 1, d = 0; for (; e < body.length; e++) { if (body[e] === "\\") { e++; continue; } if (body[e] === "{") d++; else if (body[e] === "}") d--; else if (body[e] === '"' && !d) break; } val += body.slice(k + 1, e); k = e + 1; }
          else { const w = /^[^,#\s}]+/.exec(body.slice(k)); if (!w) break; val += /^\d+$/.test(w[0]) ? w[0] : macros[w[0].toLowerCase()] != null ? macros[w[0].toLowerCase()] : BIB_MON[w[0].toLowerCase().slice(0, 3)] ? w[0] : w[0]; k += w[0].length; }
          while (/\s/.test(body[k] || "")) k++;
          if (body[k] === "#") { k++; continue; } break;
        }
        while (/[\s,]/.test(body[k] || "")) k++;
        fields[name] = val;
      }
      if (kind === "string") { Object.assign(macros, Object.fromEntries(Object.entries(fields).map(([a, b]) => [a, b]))); continue; }
      const f = n => detex(fields[n] || ""), type = BIB_TYPE[kind] || (fields.url ? "webpage" : "document");
      const it = {type, title: f("title"), author: bibNames(fields.author), editor: bibNames(fields.editor), translator: bibNames(fields.translator),
        "container-title": f("journaltitle") || f("journal") || f("booktitle") || (type === "webpage" ? f("organization") || f("howpublished") : ""),
        volume: f("volume"), page: f("pages").replace(/\s*-+\s*/g, "–"), publisher: f("publisher") || f("school") || f("institution") || (type !== "webpage" ? f("organization") : ""),
        "publisher-place": f("address") || f("location"), DOI: f("doi"), ISBN: f("isbn"), ISSN: f("issn"), URL: f("url") || (/^https?:/.test(f("howpublished")) ? f("howpublished") : ""), edition: f("edition"), "collection-title": f("series"),
        note: f("note"), genre: kind === "phdthesis" ? "PhD thesis" : kind === "mastersthesis" ? "Master's thesis" : f("type"), "event-title": f("eventtitle"), src: key};
      if (type === "article-journal") it.issue = f("number") || f("issue"); else if (f("number")) it.number = f("number");
      const mon = f("month").toLowerCase(), mo = BIB_MON[mon.slice(0, 3)] || Number(mon) || 0;
      it.issued = f("date") ? parseDate(f("date")) : date(f("year"), mo, f("day"));
      if (f("urldate")) it.accessed = parseDate(f("urldate"));
      const c = clean(it); if (c.title || c.author) out.push(c);
    }
    return out;
  }
  /* RIS (EndNote, Mendeley, Google Scholar, Zotero) */
  const RIS_TYPE = {JOUR: "article-journal", JFULL: "article-journal", EJOUR: "article-journal", BOOK: "book", EBOOK: "book", EDBOOK: "book", CHAP: "chapter", ECHAP: "chapter", CONF: "paper-conference", CPAPER: "paper-conference",
    ELEC: "webpage", WEB: "webpage", BLOG: "post-weblog", NEWS: "article-newspaper", MGZN: "article-magazine", RPRT: "report", THES: "thesis", ENCYC: "entry-encyclopedia", DICT: "entry-dictionary", VIDEO: "motion_picture", MPCT: "motion_picture",
    DATA: "dataset", COMP: "software", SLIDE: "speech", GEN: "document", UNPB: "document"};
  function parseRIS(text){
    const out = []; let cur = null;
    String(text || "").replace(/\r/g, "").split("\n").forEach(line => {
      const m = /^([A-Z][A-Z0-9])  -\s?(.*)$/.exec(line); if (!m) return;
      const [, tag, v0] = m, v = sq(v0);
      if (tag === "TY") { cur = {ty: v, f: {}}; return; }
      if (!cur) return;
      if (tag === "ER") { out.push(cur); cur = null; return; }
      (cur.f[tag] = cur.f[tag] || []).push(v);
    });
    if (cur) out.push(cur);
    return out.map(({ty, f}) => {
      const g = (...ks) => { for (const k of ks) if (f[k] && f[k][0]) return f[k][0]; return ""; }, all = (...ks) => ks.flatMap(k => f[k] || []);
      const type = RIS_TYPE[ty] || "document", sn = g("SN"), isbn = sn && /^[\dX-]{10,17}$/i.test(sn.replace(/\s/g, "")) && sn.replace(/[^\dX]/gi, "").length >= 10;
      const it = {type, title: g("TI", "T1", "CT"), author: all("AU", "A1").map(person).filter(Boolean), editor: (type === "chapter" ? all("A2", "ED") : all("ED")).map(person).filter(Boolean),
        "container-title": type === "chapter" ? g("BT", "T2") : g("T2", "JO", "JF", "JA", "BT"), volume: g("VL"), issue: g("IS"), page: [g("SP"), g("EP")].filter(Boolean).join("–"),
        publisher: g("PB"), "publisher-place": g("CY", "PP"), DOI: g("DO"), URL: g("UR", "L2"), edition: g("ET"), "collection-title": type === "chapter" ? "" : g("T3"), note: g("N1"), genre: g("M3"),
        issued: parseDate(g("PY", "Y1", "DA").replace(/\/+$/, "").replace(/\//g, "-")), accessed: parseDate(g("Y2").replace(/\//g, "-"))};
      if (isbn) it.ISBN = sn; else if (sn) it.ISSN = sn;
      return clean(it);
    }).filter(x => x.title || x.author);
  }
  function parseCslJson(text){
    let j = null; try { j = JSON.parse(String(text || "")); } catch (e) { return []; }
    const list = Array.isArray(j) ? j : j && Array.isArray(j.items) ? j.items : j && typeof j === "object" ? [j] : [];
    return list.map(x => clean(Object.assign({}, x, {id: ""}))).filter(x => x.title || x.author);
  }
  function parseAny(text, name){
    const s = String(text || "").trim(), ext = String(name || "").split(".").pop().toLowerCase();
    if (ext === "json" || /^[[{]/.test(s)) return {fmt: "CSL-JSON", items: parseCslJson(s)};
    if (ext === "ris" || /^TY  - /m.test(s)) return {fmt: "RIS", items: parseRIS(s)};
    if (ext === "bib" || /@\s*[a-z]+\s*[{(]/i.test(s)) return {fmt: "BibTeX", items: parseBibTeX(s)};
    return {fmt: "", items: []};
  }
  /* Exports */
  const BIB_OUT = {"article-journal": "article", "book": "book", "chapter": "incollection", "paper-conference": "inproceedings", "thesis": "phdthesis", "report": "techreport", "webpage": "online", "post-weblog": "online", "post": "online", "dataset": "misc", "software": "misc"};
  const bibEsc = s => String(s).replace(/[{}]/g, "").replace(/([&%#_$])/g, "\\$1");
  const bibName = a => a.literal ? `{${a.literal}}` : a.given ? `${a.family}, ${a.given}` : a.family;
  function toBibTeX(items){
    const used = new Set();
    return items.map(x => {
      const it = clean(x), fam = (familyOf((it.author || [])[0]) || "anon").toLowerCase().replace(/[^a-z]/g, "").slice(0, 20) || "anon", yr = yearOf(it) || "nd";
      let key = fam + yr, n = 0; while (used.has(key)) key = fam + yr + String.fromCharCode(97 + n++); used.add(key);
      const f = [], add = (k, v) => { if (v) f.push(`  ${k} = {${bibEsc(v)}}`); }, dp = dateParts(it.issued);
      if (it.author) f.push(`  author = {${it.author.map(bibName).join(" and ")}}`); if (it.editor) f.push(`  editor = {${it.editor.map(bibName).join(" and ")}}`);
      add("title", it.title); add(it.type === "article-journal" ? "journal" : it.type === "webpage" ? "organization" : "booktitle", it["container-title"]);
      add("year", dp[0]); if (dp[1]) add("month", ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"][dp[1] - 1]);
      add("volume", it.volume); add("number", it.issue || it.number); add("pages", it.page && it.page.replace(/–/g, "--")); add("publisher", it.publisher); add("address", it["publisher-place"]); add("edition", it.edition); add("series", it["collection-title"]);
      add("doi", it.DOI); add("isbn", it.ISBN); add("issn", it.ISSN); add("url", it.URL); add("urldate", isoOf(it.accessed));
      return `@${BIB_OUT[it.type] || "misc"}{${key},\n${f.join(",\n")}\n}`;
    }).join("\n\n") + "\n";
  }
  const RIS_OUT = Object.fromEntries(Object.entries(RIS_TYPE).reverse().map(([a, b]) => [b, a]));
  function toRIS(items){
    return items.map(x => {
      const it = clean(x), L = [`TY  - ${RIS_OUT[it.type] || "GEN"}`], add = (k, v) => { if (v) L.push(`${k}  - ${v}`); }, dp = dateParts(it.issued);
      (it.author || []).forEach(a => add("AU", a.literal || (a.given ? `${a.family}, ${a.given}` : a.family))); (it.editor || []).forEach(a => add(it.type === "chapter" ? "A2" : "ED", a.literal || (a.given ? `${a.family}, ${a.given}` : a.family)));
      add("TI", it.title); add(it.type === "chapter" ? "BT" : "T2", it["container-title"]); if (dp[0]) add("PY", String(dp[0])); if (dp.length > 1) add("DA", dp.map(n => String(n).padStart(2, "0")).join("/"));
      add("VL", it.volume); add("IS", it.issue); const [sp, ep] = String(it.page || "").split("–"); add("SP", sp); add("EP", ep);
      add("PB", it.publisher); add("CY", it["publisher-place"]); add("ET", it.edition); add("DO", it.DOI); add("SN", it.ISBN || it.ISSN); add("UR", it.URL); add("Y2", isoOf(it.accessed).replace(/-/g, "/"));
      L.push("ER  - "); return L.join("\r\n");
    }).join("\r\n\r\n") + "\r\n";
  }
  const toCslJson = items => JSON.stringify(items.map(x => { const c = clean(x); ["fid", "zkey", "zlib", "src", "rv"].forEach(k => delete c[k]); return c; }), null, 2);

  /* Duplicates: the same DOI, ISBN, or title and year */
  const tkey = s => sq(s).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
  function dupOf(it, list){
    const d = (it.DOI || "").toLowerCase(), b = (it.ISBN || "").replace(/[^\dX]/gi, ""), t = tkey(it.title), y = yearOf(it);
    return (list || []).find(x => (d && (x.DOI || "").toLowerCase() === d) || (b && (x.ISBN || "").replace(/[^\dX]/gi, "") === b) || (t && t.length > 8 && tkey(x.title) === t && String(yearOf(x)) === String(y))) || null;
  }

  /* citeproc's HTML into runs [text, {i, b, sc, sup, sub}], and back to safe HTML */
  const ent = s => s.replace(/&#(\d+);/g, (m, n) => String.fromCodePoint(Number(n))).replace(/&#x([0-9a-f]+);/gi, (m, n) => String.fromCodePoint(parseInt(n, 16))).replace(/&nbsp;/g, " ").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&amp;/g, "&");
  function runs(html){
    const out = [], st = []; let m; const re = /<(\/?)([a-z]+)([^>]*)>|([^<]+)/gi;
    const flags = () => { const f = {}; st.forEach(x => { if (x) f[x] = true; }); return f; };
    while ((m = re.exec(String(html || "")))) {
      if (m[4] != null) { const t = ent(m[4]); if (t) out.push([t, flags()]); continue; }
      const close = m[1] === "/", tag = m[2].toLowerCase(), attr = m[3] || "";
      if (tag === "br") { out.push([" ", {}]); continue; }
      if (close) { st.pop(); if (tag === "div" && out.length && !/\s$/.test(out[out.length - 1][0])) out.push([" ", {}]); continue; }
      st.push(tag === "i" || tag === "em" ? "i" : tag === "b" || tag === "strong" ? "b" : tag === "sup" ? "sup" : tag === "sub" ? "sub"
        : /small-caps/.test(attr) ? "sc" : /font-style:\s*italic/.test(attr) ? "i" : /font-weight:\s*bold/.test(attr) ? "b" : /vertical-align:\s*sup/.test(attr) ? "sup" : /vertical-align:\s*sub/.test(attr) ? "sub" : "");
    }
    // join neighbours with the same look; tidy spaces
    const j = []; out.forEach(r => { const p = j[j.length - 1]; if (p && JSON.stringify(p[1]) === JSON.stringify(r[1])) p[0] += r[0]; else j.push([r[0], r[1]]); });
    if (j.length) { j[0][0] = j[0][0].replace(/^\s+/, ""); j[j.length - 1][0] = j[j.length - 1][0].replace(/\s+$/, ""); }
    j.forEach(r => { r[0] = r[0].replace(/\s{2,}/g, " "); });
    return j.filter(r => r[0]);
  }
  const escH = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const runsHtml = rs => rs.map(([t, f]) => { let h = escH(t); if (f.sc) h = `<span style="font-variant:small-caps">${h}</span>`; if (f.sup) h = `<sup>${h}</sup>`; if (f.sub) h = `<sub>${h}</sub>`; if (f.b) h = `<b>${h}</b>`; if (f.i) h = `<i>${h}</i>`; return h; }).join("");
  const runsText = rs => rs.map(r => r[0]).join("");

  /* The engine: citeproc-js with a CSL style. CSLlib is citeproc's CSL; locales: {"en-US": xml} */
  function engine(CSLlib, styleXml, locales, items, lang){
    const sent = SENT_STYLE.test(String(styleXml || "").slice(0, 4000));
    const byId = {}; items.forEach(x => { let y = x;
      if (sent && y.title && !y.caseAsIs) { const st = sentenceCase(y.title); if (st !== y.title) y = Object.assign({}, y, {title: st}); }
      if (isHost(y["container-title"])) y = Object.assign({}, y, {"container-title": `<span class="nocase">${y["container-title"]}</span>`});
      byId[x.id] = y; });
    const sys = {retrieveLocale: l => locales[l] || locales[String(l).split("-")[0] === "en" ? "en-US" : l] || locales["en-US"], retrieveItem: id => byId[id]};
    const e = new CSLlib.Engine(sys, styleXml, lang || "en-US");
    const ids = items.map(x => x.id);
    e.updateItems(ids);
    const fmt = (/citation-format="([a-z-]+)"/.exec(styleXml) || [])[1] || "author-date";
    return {
      fmt, note: fmt === "note",
      bib(){
        const r = e.makeBibliography(); if (!r) return {entries: [], hang: false};
        const [p, list] = r;
        return {hang: !!p.hangingindent, entries: list.map((h, i) => ({id: (p.entry_ids[i] || [])[0], runs: runs(h)}))};
      },
      cite(id, locator, label){
        if (!byId[id]) return [];
        const c = {id}; if (locator) { c.locator = String(locator); c.label = label || "page"; }
        return runs(e.makeCitationCluster([c]));
      }
    };
  }
  // A CSL file's own details: title, citation format, and its parent when it only borrows another style's rules
  function styleInfo(xml){
    const s = String(xml || "");
    return {title: untag((/<title>([^<]*)<\/title>/.exec(s) || [])[1] || ""), fmt: (/citation-format="([a-z-]+)"/.exec(s) || [])[1] || "", parent: (/<link[^>]*rel="independent-parent"[^>]*href="([^"]+)"/.exec(s) || /<link[^>]*href="([^"]+)"[^>]*rel="independent-parent"/.exec(s) || [])[1] || "",
      locale: (/default-locale="([^"]+)"/.exec(s) || [])[1] || ""};
  }

  /* A simple stand-in while citeproc loads (or if a style can't be used): Author (Year). Title. Container. */
  function plain(it){
    it = clean(it); const a = (it.author || []).map(familyOf).filter(Boolean), who = a.length > 2 ? a[0] + " et al." : a.join(" & ");
    return [[`${who ? who + " " : ""}(${yearOf(it) || "n.d."}). ${it.title || "Untitled"}.${it["container-title"] ? " " : ""}`, {}]].concat(it["container-title"] ? [[it["container-title"] + ".", {i: true}]] : []);
  }

  /* The draft check (no AI). kind: author-date | author (MLA) | numeric | note; style: the CSL id */
  const YEAR = /\b(1[5-9]\d\d|20\d\d)[a-z]?\b|\bn\.\s?d\./;
  const reEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const famRe = f => new RegExp("(^|[^\\p{L}])" + reEsc(f) + "($|[^\\p{L}])", "iu");
  const keyName = s => familyOf((s.author || s.editor || [])[0]) || sq(s.title).split(" ").slice(0, 2).join(" ");
  const HEADS = {"apa": "References", "modern-language-association": "Works Cited", "chicago-author-date": "References", "chicago-notes-bibliography": "Bibliography", "ieee": "References", "harvard-cite-them-right": "Reference list", "american-medical-association": "References", "american-sociological-association": "References"};
  const headingOf = (style, kind) => HEADS[style] || (kind === "note" ? "Bibliography" : "References");
  function refSection(draft){
    const m = /(^|\n)[ \t]*(references|works cited|bibliography|reference list|sources cited|works consulted|literature cited|sources)[ \t]*:?[ \t]*(\n|$)/i.exec(draft);
    return m ? {name: m[2], at: m.index + m[1].length, body: draft.slice(m.index + m[0].length)} : bareList(draft);
  }
  // A list with no heading: the draft ends in reference entries ("Singer, P. (1972). Famine, Affluence, and Morality. …"), each starting with
  // a surname and an initial or first name and holding a year, a link on its own line going with the entry above it. name "" says it has no heading.
  const ENTRY = /^\s*(?:\[\d{1,3}\]\s*|\d{1,3}[.)]\s+)?(?:(?:van|von|de|du|da|di|la|le|der|den)\s+)?[\p{Lu}][\p{L}'’-]+(?:[ -][\p{Lu}][\p{L}'’-]+)?,\s+(?:[\p{Lu}]\.|[\p{Lu}][\p{L}'’-]+[.,])/u;
  function bareList(draft){
    const lines = draft.split("\n"); let i = lines.length - 1, first = -1, n = 0;
    while (i >= 0 && !lines[i].trim()) i--;
    for (; i >= 0; i--) {
      const L = lines[i].trim();
      if (!L) continue;
      if (/^(https?:\/\/|doi:|www\.)\S+$/i.test(L)) continue;
      if (ENTRY.test(L) && L.length >= 25 && /\b(1[5-9]\d\d|20\d\d)\b|\bn\.\s?d\./.test(L) && !/[.!?]["”’]?\s+[\p{Ll}]/u.test(L.slice(0, 40))) { first = i; n++; continue; }
      break;
    }
    if (first <= 0 || !n) return null;
    const at = lines.slice(0, first).join("\n").length + 1, before = draft.slice(0, at).trim();
    if (before.length < 200 || n * 2 > lines.filter(l => l.trim()).length) return null;
    return {name: "", at, body: draft.slice(at), bare: true};
  }
  const NUM = {one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, twelve: 12, fifteen: 15, twenty: 20};
  const NAMED = [[/\bAPA\b/, "apa"], [/\bMLA\b/, "modern-language-association"], [/\bChicago\b[^.\n]{0,40}\b(foot|end)notes?\b|\bnotes[- ]bibliography\b|\bTurabian\b/i, "chicago-notes-bibliography"], [/\bChicago\b/i, "chicago-author-date"], [/\bIEEE\b/, "ieee"], [/\bHarvard\b/i, "harvard-cite-them-right"], [/\bAMA\b/, "american-medical-association"], [/\bASA\b/, "american-sociological-association"]];
  function rules(req){
    const s = String(req || ""), out = {};
    for (const [re, id] of NAMED) if (re.test(s)) { out.style = id; break; }
    const mn = /\b(?:at least|minimum of|a minimum of|no fewer than|min\.?)\s+(\d{1,2}|one|two|three|four|five|six|seven|eight|nine|ten|twelve|fifteen|twenty)\s+(?:different\s+|outside\s+)?(scholarly|peer[- ]reviewed|academic|credible|primary|secondary)?\s*(?:sources?|references?|citations?|articles?|works)\b/i.exec(s);
    if (mn) { out.min = Number(mn[1]) || NUM[mn[1].toLowerCase()] || 0; if (mn[2] && /scholarly|peer|academic/i.test(mn[2])) out.scholarly = true; }
    return out;
  }
  const SCHOLARLY = ["article-journal", "chapter", "book", "paper-conference", "thesis", "report", "entry-encyclopedia"];
  /* Format: each style's rules for in-text citations, as its manual has them (and citeproc writes them).
     yr: the year is in the citation; ay: between the author and the year; pg: before the page; pl: p. or pp. before the page; two: between two
     authors inside brackets ("and" in a sentence); etal: from how many authors et al. is a must; loose: an author count where both are fine;
     alpha: several works in one citation go in alphabetical order. A style from Zotero gets its built-in parent's rules, or what can be read
     from citeproc's own citations in it, or only its family's. */
  const PROF = {
    "apa": {n: "APA", yr: 1, ay: ", ", pg: ", ", pl: 1, two: "&", etal: 3, alpha: 1},
    "harvard-cite-them-right": {n: "Harvard", yr: 1, ay: ", ", pg: ", ", pl: 1, two: "and", etal: 4, ox: 0},
    "chicago-author-date": {n: "Chicago", yr: 1, ay: " ", pg: ", ", pl: 0, two: "and", etal: 3, loose: 3},
    "american-sociological-association": {n: "ASA", yr: 1, ay: " ", pg: ":", pl: 0, two: "and", etal: 4, loose: 3},
    "modern-language-association": {n: "MLA", yr: 0, pg: " ", pl: 0, two: "and", etal: 3},
    "ieee": {n: "IEEE", num: "br"}, "american-medical-association": {n: "AMA", num: "sup"}, "chicago-notes-bibliography": {n: "Chicago notes", note: 1}
  };
  const SHORTN = {"apa": "APA", "modern-language-association": "MLA", "chicago-author-date": "Chicago author-date", "ieee": "IEEE"};
  const MONTHS = "january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec|spring|summer|fall|autumn|winter";
  const NOT_NAME = new RegExp(`^(figure|fig|table|chapter|ch|appendix|section|part|vol|volume|no|page|pages|grade|year|years|age|ages|step|phase|study|experiment|week|day|unit|level|question|eq|equation|note|ibid|n|m|sd|p|pp|${MONTHS})\\.?$`, "i");
  const CONN = /^(&|and|of|the|for|on|in|at|to|de|van|von|der|den|du|la|le|da|di|del|dos|das|et|et\.|al|al\.)$/i;
  const nameOk = s => { const w = s.split(/\s+/); return w.length <= 9 && !NOT_NAME.test(w[0].replace(/,$/, "")) && (/^[\p{Lu}]/u.test(w[0]) || (CONN.test(w[0]) && /^[\p{Lu}]/u.test(w[1] || ""))) && w.every(t => { t = t.replace(/,$/, ""); return /^[\p{Lu}][\p{L}'’.-]*$/u.test(t) || CONN.test(t); }); };
  const YTOK = "(?:1[5-9]\\d\\d|20\\d\\d)[a-z]?|n\\.\\s?d\\.|in press|forthcoming";
  const REST = new RegExp(`^([,:]?\\s*)((?:${YTOK})(?:\\s*,\\s*(?:${YTOK}))*)?(?:([,:]?\\s*)((?:pp?\\.|pg\\.?|pages?|paras?\\.?|¶)?\\s*)(\\d+[a-z]?(?:\\s*[–—-]\\s*\\d+[a-z]?)?))?\\s*$`, "i");
  // An in-text citation's parts: "(Smith & Lee, 2021, p. 4)", "(Walker 112)", "(Lo et al.)"; narr: the names before "(2017)" in a sentence
  function parseCite(seg, narr){
    let s = sq(seg).replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/^(?:(?:see also|see|e\.g\.,?|cf\.|but see|also)\s+)+/i, "");
    if (/\bas cited in\s/i.test(s)) s = s.split(/\bas cited in\s+/i).pop();
    let names = narr || "", rest = s;
    if (!narr) {
      const m = new RegExp(`^(.*?)(?=[,:]?\\s*(?:(?:${YTOK})\\b|(?:pp?|pg|paras?)\\.?\\s*\\d|\\d))`, "i").exec(s);
      names = m ? m[1] : s; rest = m ? s.slice(m[1].length) : "";
    }
    names = sq(names).replace(/[,\s]+$/, ""); if (!names) return null;
    const r = REST.exec(rest); if (!r) return null;
    const title = /^["'].+["']$/.test(names);
    if (!title && !nameOk(names)) return null;
    const et = /,?\s*\bet\.?\s*al\b\.?/i.exec(names), core = sq(names.replace(/,?\s*\bet\.?\s*al\b\.?/i, ""));
    const join = title ? "" : /\s&\s/.test(core) ? "&" : /\sand\s/i.test(core) && !ORG.test(core) ? "and" : "";
    const auth = title || (!join && ORG.test(core)) ? [core] : core.split(/\s*,\s*(?:&\s*|and\s+)?|\s+&\s+|\s+and\s+/i).map(sq).filter(Boolean);
    return {names, core, title, auth, join, etal: !!et, etalOk: !!et && /(^|\s)et al\.$/.test(et[0]), etalComma: !!et && /^,/.test(et[0]),
      yrs: r[2] ? r[2].split(/\s*,\s*/) : [], ay: r[2] ? r[1] : "", pgSep: r[2] ? r[3] || "" : (r[1] || "") + (r[3] || ""), pl: sq(r[4] || ""), page: (r[5] || "").replace(/\s/g, "").replace(/[—-]/g, "–")};
  }
  function profileOf(o){
    const base = PROF[o.style] || PROF[o.parent];
    if (base) return Object.assign({}, base, {id: PROF[o.style] ? o.style : o.parent, n: o.label || base.n});
    const kind = o.kind || "author-date", n = o.label || "this style";
    if (kind === "numeric") return {n, num: "any", gen: 1};
    if (kind === "note") return {n, note: 1, gen: 1};
    const L = Object.assign({n, gen: 1}, kind === "author" ? {yr: 0} : {yr: 1});
    // what citeproc's own citations in this style show: the separators and p.
    const s = typeof o.cite === "function" && (o.items || []).find(x => (x.author || []).length === 1 && yearOf(x));
    if (s) { try {
      const a = sq(o.cite(s.id)), b = sq(o.cite(s.id, "45")), un = x => /^\(.*\)$/.test(x) ? x.slice(1, -1) : "";
      const ca = un(a) && parseCite(un(a)), cb = un(b) && parseCite(un(b));
      if (ca && cb && cb.page === "45") {
        L.yr = ca.yrs.length ? 1 : 0; if (L.yr) L.ay = /,/.test(ca.ay) ? ", " : " ";
        const sep = cb.pgSep.trim(); L.pg = sep === ":" ? ":" : sep === "," ? ", " : " "; L.pl = /^p/i.test(cb.pl) ? 1 : 0;
      }
    } catch (e) {} }
    return L;
  }
  // What's wrong with one citation in a style (keys of WHY)
  function citeProbs(c, P, src, narr){
    const out = [], n = src ? (src.author || []).length : 0, famOk = !!(n && c.auth[0] && famRe(familyOf(src.author[0])).test(c.auth[0]));
    if (P.yr) {
      if (!c.yrs.length) { if (!narr) out.push("year"); }
      else if (!narr && P.ay === ", " && !/,/.test(c.ay)) out.push("ay-comma");
      else if (!narr && P.ay === " " && /,/.test(c.ay)) out.push("ay-nocomma");
    } else if (P.yr === 0 && c.yrs.length) out.push("noyear");
    if (c.page) {
      const lbl = c.pl.toLowerCase(), range = /–/.test(c.page), sep = c.pgSep.trim();
      if (/^pg/.test(lbl)) out.push(P.pl ? "pg" : "pl-none");
      else if (P.pl) { if (!lbl) out.push("pl-need"); else if (lbl === "p." && range) out.push("pl-pp"); else if (lbl === "pp." && !range) out.push("pl-p"); }
      else if (P.pl === 0 && /^p/.test(lbl)) out.push("pl-none");
      if (P.yr === 0) { if (sep === "," && !c.yrs.length) out.push("mla-comma"); }
      else if (P.pg && c.yrs.length) { if (P.pg === ":" ? sep !== ":" : P.pg === ", " ? sep !== "," : false) out.push(P.pg === ":" ? "pg-colon" : "pg-comma"); }
    }
    if (!c.title) {
      if (c.etal && !c.etalOk) out.push("etal-dot");
      if (c.etalComma) out.push("etal-comma");
      if (P.two && c.join && !c.etal && c.auth.length === 2) { const w = narr ? "and" : P.two; if (c.join !== w) out.push(narr ? "and-narr" : w === "&" ? "amp" : "and"); }
      if (famOk && P.etal) {
        if (n >= P.etal && !c.etal && !(P.loose && n === P.loose && c.auth.length === n)) out.push("etal-need");
        else if (c.etal && n < (P.loose || P.etal)) out.push("etal-few");
        else if (n === 2 && !c.etal && c.auth.length === 1) out.push("both");
      }
    }
    return out;
  }
  // The citation as the style writes it: citeproc's own when the source is known, else the student's parts put right
  function citeFixed(c, P, src, narr, o){
    const n = src ? (src.author || []).length : 0, famOk = !!(n && c.auth[0] && famRe(familyOf(src.author[0])).test(c.auth[0]));
    const y = src ? String(yearOf(src) || "") : "", lbl = c.page ? (P.pl ? (/^para/i.test(c.pl) ? "para. " : /–/.test(c.page) ? "pp. " : "p. ") : "") : "";
    if (!narr && famOk && typeof o.cite === "function") {
      try { const t = sq(o.cite(src.id, c.page || "")); if (/^\(.{2,120}\)$/.test(t)) return t; } catch (e) {}
    }
    let who = c.core;
    if (!c.title) {
      const list = famOk ? src.author.map(familyOf) : c.auth, k = famOk ? n : c.etal ? 99 : c.auth.length, min = P.etal || 3;
      if (k >= min && !(P.loose && k === P.loose && !c.etal)) who = list[0] + " et al.";
      else if (k === 2 && list.length >= 2) who = `${list[0]} ${narr ? "and" : P.two || "and"} ${list[1]}`;
      else if (k >= 3 && list.length >= 3) who = list.slice(0, -1).join(", ") + (P.ox === 0 ? " and " : ", and ") + list[list.length - 1];
      else if (k === 1 || !c.etal) who = c.auth.length === 1 ? c.core : list[0];
      else who = list[0] + " et al.";
    }
    const yr = c.yrs.length ? (src && y && !c.yrs.some(x => x.slice(0, 4) === y) ? y : c.yrs.join(", ")) : y || (src ? "n.d." : "year");
    const pgp = c.page ? (P.pg === ":" ? ":" : P.pg === " " ? " " : ", ") + lbl + c.page : "";
    if (P.yr) return narr ? `${who} (${yr}${pgp})` : `(${who}${P.ay || ", "}${yr}${pgp})`;
    if (narr) return c.page ? `${who} … (${c.page})` : who;
    return `(${who}${c.page ? " " + c.page : ""})`;
  }
  // [group title after "N citations", what to do]
  function whyOf(k, P){
    const N = P.n;
    return ({
      "year": ["are missing the year", "add the year"],
      "noyear": ["have a year in them", `${N} citations have no year, just the author and the page`],
      "ay-comma": ["are missing the comma between the author and the year", "put a comma between the author and the year"],
      "ay-nocomma": ["have a comma between the author and the year", "no comma between the author and the year"],
      "mla-comma": ["put a comma between the author and the page", "no comma between the author and the page"],
      "pg-comma": ["are missing the comma before the page", "put a comma before the page"],
      "pg-colon": ["are missing the colon before the page", "put a colon between the year and the page"],
      "pg": ["use pg. for the page", "write p. for a page, not pg."],
      "pl-need": ["are missing p. before the page", "put p. before a page (pp. before a range)"],
      "pl-pp": ["use p. before a page range", "use pp. before a range of pages"],
      "pl-p": ["use pp. before a single page", "use p. before a single page"],
      "pl-none": ["have p. before the page", "no p. before the page"],
      "amp": ["use “and” between two authors in brackets", "use & between two authors inside brackets"],
      "and": ["use & between two authors", "use “and” between two authors"],
      "and-narr": ["use & between two authors in a sentence", "in a sentence, use “and” between two authors (& is only for inside brackets)"],
      "both": ["leave out the second author", "name both authors"],
      "etal-need": ["name every author", `use the first author and “et al.” when there are ${P.etal} or more authors`],
      "etal-few": ["use et al. for too few authors", `name the authors: “et al.” is only for ${P.loose || P.etal} or more`],
      "etal-comma": ["have a comma before et al.", "no comma before “et al.”"],
      "etal-dot": ["write et al. without its full stop", "write “et al.” with a full stop after “al” only"],
      "alpha": ["list their works out of alphabetical order", "put the works in one citation in alphabetical order, separated by semicolons"],
      "semi": ["run two works together", "separate two works with a semicolon"],
      "numeric": ["use the author and year", P.num === "sup" ? `${N} cites by superscript number, like ¹, in the order you first cite each source` : `${N} cites by number in square brackets, like [1], in the order you first cite each source`],
      "note": ["are in brackets in the text", `${N} cites in footnotes: move it into a footnote`]
    })[k] || ["need fixing", "check it against the style"];
  }
  const PRI = ["semi", "numeric", "note", "year", "noyear", "ay-comma", "ay-nocomma", "mla-comma", "pg-comma", "pg-colon", "pg", "pl-need", "pl-pp", "pl-p", "pl-none", "amp", "and", "and-narr", "both", "etal-need", "etal-few", "etal-comma", "etal-dot", "alpha"];
  // the names just before "(2017)" in a sentence: "Walker", "Lo et al.", "Smith and Lee", "Ray, Ong, and Chee"
  function narrName(body, at){
    const before = body.slice(Math.max(0, at - 140), at), NM = "[\\p{Lu}][\\p{L}'’-]+";
    const m = new RegExp(`((?:\\b(?:van|von|de|du|da|di|la|le|der|den)\\s+)?${NM}(?:\\s+et\\.?\\s*al\\b\\.?|(?:,\\s*${NM})*,?\\s+(?:and|&)\\s+${NM})?)(?:['’]s)?\\s*$`, "u").exec(before);
    return m ? {names: m[1], at: at - before.length + m.index} : null;
  }

  /* The reference list: each entry against the style's own version of it (citeproc's), as specific, explainable differences */
  const nq = s => sq(String(s || "").replace(/[“”„″]/g, '"').replace(/[‘’‚′`]/g, "'").replace(/[–—−‐]/g, "-").replace(/ /g, " ")).replace(/\s+([.,;:])/g, "$1");
  const unnum = s => String(s || "").replace(/^\s*(\[\d{1,3}\]|\d{1,3}[.)])\s*/, "");
  const loose = s => sq(s).toLowerCase().replace(/[“”"‘’'`]/g, "").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
  function entrySource(t, sources, taken){
    const L = " " + loose(t) + " ", doi = ((/\b10\.\d{4,9}\/[^\s"<>]+/.exec(t) || [""])[0]).replace(/[.,;)\]]+$/, "").toLowerCase();
    return sources.find(s => !taken.has(s.id) && doi && (s.DOI || "").toLowerCase() === doi) || sources.find(s => {
      if (taken.has(s.id)) return false;
      const tt = loose(s.title).split(" ").slice(0, 6).join(" "), a = (s.author || [])[0];
      return tt.length >= 10 && L.includes(" " + tt + " ") && (!a || famRe(familyOf(a)).test(t));
    }) || null;
  }
  function refDiff(E0, X0, s){
    const E = nq(unnum(E0)), X = nq(unnum(X0)), out = [], lo = x => x.toLowerCase(), has = (x, t) => !!t && lo(x).includes(lo(nq(t)));
    if (E === X) return out;
    const num = v => new RegExp(`(^|\\D)${reEsc(v)}(\\D|$)`);
    const tt = nq(s.title || ""), find = x => tt.length >= 3 ? lo(x).indexOf(lo(tt)) : -1, tX = find(X), tE = find(E);
    // the authors
    const authOf = (x, ti) => ti > 0 ? x.slice(0, ti).replace(/["']\s*$/, "").replace(/\s*\(?(?:1[5-9]\d\d|20\d\d|n\.d\.)[a-z]?(?:,[^)]*)?\)?[.,]?\s*$/i, "").replace(/[.,\s]+$/, "") : "";
    const aX = authOf(X, tX), aE = authOf(E, tE), letters = x => lo(x).replace(/[^\p{L}&]/gu, "");
    if (aX && aE && letters(aX) !== letters(aE)) {
      // the first author's first names: "J. C." or "June C." ("Lo, J. C., Ong, J. L." · "Lo, June C., Ju Lynn Ong")
      const given = x => (/^[^,]+,\s*([^,]+)/.exec(x) || [])[1] || "", init = x => /^(\p{Lu}\.?\s?-?)+$/u.test(sq(given(x))), full = x => /\p{Lu}\p{Ll}+/u.test(given(x));
      if (/et al/i.test(aE) && !/et al/i.test(aX)) out.push(`List every author: ${aX}`);
      else if (/et al/i.test(aX) && !/et al/i.test(aE)) out.push(`Use “et al.” after the first author: ${aX}`);
      else if (/^\p{Lu}\.\s/u.test(aX) && !/^\p{Lu}\.\s/u.test(aE)) out.push(`Put the initials before the last name: ${aX}`);
      else if (!/^\p{Lu}\.\s/u.test(aX) && /^\p{Lu}\.\s/u.test(aE)) out.push(`Start with the last name: ${aX}`);
      else if (init(aX) && full(aE)) out.push(`Use initials for first names: ${aX}`);
      else if (full(aX) && init(aE)) out.push(`Write first names in full: ${aX}`);
      else if (/\s&\s/.test(aX) && /\sand\s/.test(aE)) out.push(`Use & before the last author: ${aX}`);
      else if (/\sand\s/.test(aX) && /\s&\s/.test(aE)) out.push(`Use “and” before the last author: ${aX}`);
    } else if (aX && aE && nq(aX) !== nq(aE)) out.push(`Write the authors as ${aX}`);
    // the year: there, right, and in its place
    const y = String(yearOf(s) || "");
    if (y) {
      if (!num(y).test(E)) { const other = (E.match(YR) || [])[0]; out.push(other ? `The year should be ${y}, as in your source` : `Add the year (${y})`); }
      else if (tX > 0 && tE > 0) {
        const bX = num(y).test(X.slice(0, tX)), bE = num(y).test(E.slice(0, tE)), pX = new RegExp(`\\(${y}[a-z]?[),]`).test(X.slice(0, tX)), pE = new RegExp(`\\(${y}[a-z]?[),]`).test(E.slice(0, tE));
        if (bX && !bE) out.push(pX ? `Put the year in brackets right after the authors: (${y})` : `Put the year right after the authors: ${y}.`);
        else if (!bX && bE) out.push(`Move the year to later in the entry: ${s.type === "article-journal" ? "with the journal details" : "after the publisher"}, not after the authors`);
        else if (bX && pX && !pE) out.push(`Put the year in brackets: (${y})`);
        else if (bX && !pX && pE) out.push(`Take the brackets off the year: ${y}.`);
      }
    }
    // the title: its capitals and quotation marks
    if (tX >= 0 && tE >= 0) {
      const ttX = X.substr(tX, tt.length), ttE = E.substr(tE, tt.length), caps = x => (x.match(/\p{Lu}/gu) || []).length;
      // sentence case is only asked for when the entry's title is clearly Title Case: a name like New York keeps its capitals
      const titled = x => { const w = x.match(/[\p{L}][\p{L}'’-]{3,}/gu) || []; return w.length >= 2 && w.filter(v => /^\p{Lu}/u.test(v)).length / w.length >= 0.75; };
      // which words differ, and how: the whole title in Title Case only when the style wants that; otherwise the very words the source
      // capitalizes (a name like Pseudomonas keeps its capital in sentence case too)
      if (ttX !== ttE && lo(ttX) === lo(ttE)) {
        const wX = ttX.match(/[\p{L}][\p{L}'’-]*/gu) || [], wE = ttE.match(/[\p{L}][\p{L}'’-]*/gu) || [], up = [], down = [];
        wX.forEach((x, i) => { const e = wE[i]; if (!e || x === e || x.toLowerCase() !== e.toLowerCase()) return; if (/^\p{Lu}/u.test(x) && !/^\p{Lu}/u.test(e)) up.push(x); else if (!/^\p{Lu}/u.test(x) && /^\p{Lu}/u.test(e)) down.push(e); });
        const list = a => a.length === 1 ? `“${a[0]}”` : a.slice(0, -1).map(x => `“${x}”`).join(", ") + ` and “${a[a.length - 1]}”`;
        if (titled(ttX) && caps(ttX) > caps(ttE)) out.push(`Capitalize the main words of the title: ${ttX}`);
        else if (titled(ttE) && !titled(ttX)) out.push(`Use sentence case for the title (a capital only for the first word, the first word after a colon, and names): ${ttX}`);
        else if (up.length && !down.length && up.length <= 4) out.push(`In the title, capitalize ${list(up)}${up.every((x, i) => wX.indexOf(x) > 0) ? " (a name keeps its capital)" : ""}: ${ttX}`);
        // a capital the source lacks may be a name (New York), so a word is never asked to lose its capital on its own
      }
      const qX = /["']\s*$/.test(X.slice(0, tX)), qE = /["']\s*$/.test(E.slice(0, tE));
      if (qX && !qE) out.push(`Put the title in quotation marks: “${ttX}”`);
      else if (!qX && qE) out.push("Take the quotation marks off the title");
    }
    // DOI, volume and issue, pages
    if (s.DOI && has(X, s.DOI)) {
      const fx = (new RegExp(`(https?://doi\\.org/|doi:\\s?)?${reEsc(s.DOI)}`, "i").exec(X) || [""])[0], e = new RegExp(`(https?://(?:dx\\.)?doi\\.org/|doi:?\\s*)?${reEsc(s.DOI)}`, "i").exec(E);
      const pre = x => lo(x || "").replace(/\s|:$/g, "").replace(/:$/, "");
      if (!e) out.push(`Add the DOI: ${fx}`);
      else if (pre(e[1]) !== pre((/^(https?:\/\/doi\.org\/|doi:\s?)/i.exec(fx) || [""])[0])) out.push(`Write the DOI as ${fx}`);
    }
    if (s.volume && num(s.volume).test(X)) {
      if (!num(s.volume).test(E)) out.push(`Add the volume (${s.volume})`);
      else if (s.issue) {
        const vi = new RegExp(`(?:vol\\.?\\s*)?${reEsc(s.volume)}\\s*(?:\\(${reEsc(s.issue)}\\)|,\\s*no\\.\\s*${reEsc(s.issue)})`, "i"), a = vi.exec(X), b = vi.exec(E);
        if (a && (!b || a[0].replace(/\s/g, "").toLowerCase() !== b[0].replace(/\s/g, "").toLowerCase())) out.push(`Write the volume and issue as ${a[0]}`);
      }
    }
    if (s.page) {
      const p1 = s.page.split("–")[0], pr = new RegExp(`${reEsc(p1)}\\s*-\\s*\\d+`).exec(X);
      if (num(p1).test(X) && !num(p1).test(E)) out.push(`Add the pages (${pr ? pr[0].replace("-", "–") : s.page})`);
      else if (num(p1).test(E)) { const ppX = new RegExp(`pp?\\.\\s*${reEsc(p1)}`).test(X), ppE = new RegExp(`pp?\\.\\s*${reEsc(p1)}`, "i").test(E); if (ppX && !ppE) out.push("Put pp. before the pages"); else if (!ppX && ppE) out.push("Leave out pp. before the pages"); }
    }
    // where it was published, who published it, the link
    const ct = s["container-title"];
    if (ct && has(X, ct) && !has(E, ct)) out.push(`Add ${s.type === "article-journal" ? "the journal" : "where it was published"}: ${nq(ct)}`);
    if (s.publisher && has(X, s.publisher) && !has(E, s.publisher)) out.push(`Add the publisher: ${nq(s.publisher)}`);
    const pl = s["publisher-place"];
    if (pl && has(X, pl) && !has(E, pl)) out.push(`Add the place of publication: ${nq(pl)}`);
    else if (pl && !has(X, pl) && has(E, pl) && !has(tt, pl)) out.push(`Leave out the place of publication (${nq(pl)})`);
    if (s.URL && has(X, s.URL) && !has(E, s.URL) && !(s.DOI && has(E, s.DOI))) out.push(`Add the link: ${s.URL}`);
    if (/retrieved from/i.test(E) && !/retrieved from/i.test(X)) out.push("Leave out “Retrieved from” before the link");
    const av = /(\[Online\]\.\s*)?Available(?: at)?:/i.exec(X);
    if (av && !/available/i.test(E) && /https?:|\bdoi\b/i.test(E)) out.push(`Put “${av[0]}” before the link`);
    // its last full stop
    const endX = /\.$/.test(X), endE = /\.$/.test(E);
    if (endX && !endE) out.push("End the entry with a full stop");
    else if (!endX && endE && /(https?:\/\/\S+|10\.\d{4,9}\/\S+)\.$/.test(E)) out.push("No full stop after the link");
    // nothing named but the punctuation differs
    if (!out.length && lo(E).replace(/[^\p{L}\p{N}]/gu, "") === lo(X).replace(/[^\p{L}\p{N}]/gu, "") && lo(E).replace(/\s/g, "") !== lo(X).replace(/\s/g, "")) out.push("The punctuation differs: compare it with the version below");
    return out;
  }

  // Each issue can carry where in the draft it is (at, len), so the draft can be shown with that sentence marked; a group of the same
  // problem carries its other places (more: [{at, len, s}]); a reference entry carries its right version (should) and its source (sid)
  function check(draftIn, itemsIn, o){
    o = o || {}; const style = o.style || "apa", kind = o.kind || "author-date", label = o.label || style, want = headingOf(style, kind), wantL = /list$/i.test(want) ? want : want + " list";
    const draft = String(draftIn || "").replace(/\r\n?/g, "\n"), sources = (itemsIn || []).map(clean), issues = [], push = (k, t, d, fix, at, len, extra) => issues.push(Object.assign({k, t, d: d || "", fix: fix || ""}, at != null && at >= 0 ? {at, len: len || 1} : {}, extra || {}));
    const P = profileOf(Object.assign({}, o, {items: sources, label}));
    const ref = refSection(draft), body = ref ? draft.slice(0, ref.at) : draft;
    // the draft's own list, each entry tied to its Writing Studio source when it's clearly that one (its DOI, or its title and author)
    const ents = ref ? refEntriesAt(draft) : [], taken = new Set(), numMap = {};
    ents.forEach(e => { const s = entrySource(e.t, sources, taken); if (s) { e.sid = s.id; taken.add(s.id); } const k = /^\s*(?:\[(\d{1,3})\]|(\d{1,3})[.)]\s)/.exec(e.t); e.num = k ? Number(k[1] || k[2]) : 0; if (e.num && e.sid && !numMap[e.num]) numMap[e.num] = e.sid; });
    const cited = new Set(), firstAt = {}, unknown = [], slips = new Map();
    const cite = (id, at, len) => { cited.add(id); if (!(id in firstAt)) firstAt[id] = [at, len]; };
    const slip = (t, at, len) => { if (!slips.has(t)) slips.set(t, [at, len]); };
    // a source with no author or title has no name to look for: famRe("") would match every citation, so leave it out
    const named = sources.filter(s => keyName(s)), match = seg => named.filter(s => famRe(keyName(s)).test(seg));
    const inRef = nm => !!(ref && nm && nm.length > 1 && famRe(nm).test(ref.body));
    // another work by the same author: the draft's own list has an entry for that name and the year cited, and no source by that name is from
    // that year (so "Flegr et al. (2019)" isn't Flegr's 2013 source with a wrong year: it's a different paper)
    const foldL = x => String(x || "").normalize("NFD").replace(/\p{M}/gu, "").toLowerCase(), refEnts = ref ? refEntriesAt(draft).map(e => foldL(unnum(e.t))) : [];
    const yrsOf = seg => (seg.match(/(?:1[5-9]\d\d|20\d\d)/g) || []);
    const otherWork = (list, seg, name) => {
      const ys = yrsOf(seg); if (!list.length || !ys.length || list.some(s => ys.includes(String(yearOf(s))))) return false;
      const nm = foldL(((String(name || "").match(/[\p{Lu}][\p{L}'’-]+/u) || [])[0]) || keyName(list[0])); return !!nm && refEnts.some(e => e.startsWith(nm) && ys.some(y => e.slice(0, 400).includes(y)));
    };
    const fmts = [], mism = [], parsed = [];
    let m; const PAR = /\(([^()\n]{2,200})\)/g;
    while ((m = PAR.exec(body))) {
      const at = m.index, len = m[0].length, segsP = m[1].split(/;\s*/).map(sq).filter(Boolean), multi = segsP.length > 1, inOne = [];
      segsP.forEach(seg => {
        const hasYear = YEAR.test(seg), hits0 = match(seg), other = hasYear && otherWork(hits0, seg, (/^[“"]?([\p{Lu}][\p{L}'’-]+)/u.exec(seg) || [])[1]), hits = other ? [] : hits0, mlaLike = /^[“"]?[\p{Lu}][\p{L}'’-]+.*?\s\d{1,4}(?:[–-]\d+)?$/u.test(seg) && !hasYear;
        let nb = [], nbOther = other;
        if (hits.length) hits.forEach(s => cite(s.id, at, len));
        else if (hasYear) {
          // "Walker (2017)": the brackets hold only the year, so the name is just before them, in the same sentence.
          // A citation that starts with a name, "(Carskadon 2011)", is matched by that name alone (never by a name further back)
          const lead = /^[“"]?[\p{Lu}]/u.test(seg), before = lead ? "" : body.slice(Math.max(0, at - 60), at).split(/(?<!\b(?:al|e\.g|i\.e|cf|vs|ed|eds|Dr|Mr|Mrs|Ms|Prof|St))[.?!;)]\s/).pop().split(/\s+/).slice(-6).join(" ");
          nb = before ? named.filter(s => famRe(keyName(s)).test(before)) : [];
          const nn0 = lead ? null : narrName(body, at);
          if (nb.length && otherWork(nb, seg, nn0 && nn0.names)) { nb = []; nbOther = true; }
          if (nb.length) nb.forEach(s => cite(s.id, at, len));
          // "Flegr (2013)": the name goes with it, so it can be found in the draft's list
          else if (/^[“"]?[\p{Lu}]/u.test(seg) || /(\p{Lu}[\p{L}'’-]+)\s*$/u.test(before) || nn0) unknown.push([nn0 ? `${nn0.names} (${seg})` : seg, at, len]);
        } else if (mlaLike && kind === "author" && !/^(p|pp|para|ch|fig|figure|table|see|chapter|section)\b/i.test(seg)) unknown.push([seg, at, len]);
        // the citation's format in this style
        if (P.num || P.note) {
          const lead = /^[“"]?[\p{Lu}]/u.test(seg);
          if ((hits.length && (hasYear || mlaLike)) || (lead && hasYear && parseCite(seg))) fmts.push({probs: [P.num ? "numeric" : "note"], at, len, pat: at, orig: m[0], fixed: "", u: !hits.length});
          return;
        }
        const yrN = (seg.match(/(?:1[5-9]\d\d|20\d\d)[a-z]?\b/g) || []).length;
        if (yrN >= 2 && /((?:1[5-9]\d\d|20\d\d)[a-z]?),\s+(?:and\s+)?[\p{Lu}][\p{L}'’-]+/u.test(seg)) { fmts.push({probs: ["semi"], at, len, pat: at, orig: multi ? `(${seg})` : m[0], fixed: `(${seg.replace(/((?:1[5-9]\d\d|20\d\d)[a-z]?),\s+(?:and\s+)?(?=[\p{Lu}])/gu, "$1; ")})`, u: false}); return; }
        if (P.yr === 0 && /\d[a-z]?,\s+[\p{Lu}][\p{L}'’-]+(?:\s+et al\.?)?,?\s+\d/u.test(seg)) { fmts.push({probs: ["semi"], at, len, pat: at, orig: multi ? `(${seg})` : m[0], fixed: `(${seg.replace(/(\d[a-z]?),\s+(?=[\p{Lu}])/gu, "$1; ")})`, u: false}); return; }
        const lead = /^[“"‘']?[\p{Lu}]/u.test(seg) || /^(?:see|e\.g\.|cf\.)\s/i.test(seg) || /^(van|von|de|du|da|di|la|le)\s+\p{Lu}/u.test(seg);
        const yStart = new RegExp(`^(?:${YTOK})\\b`, "i").test(seg);
        let c = null, nn = null;
        if (lead) c = parseCite(seg);
        else if (yStart && !multi && (nn = narrName(body, at))) c = parseCite(seg, nn.names);
        if (!c) return;
        const pool = nbOther ? [] : nn ? (nb.length ? nb : match(nn.names)) : hits;
        const src = pool.length <= 1 ? pool[0] || null : pool.find(s => c.yrs.some(x => x.slice(0, 4) === String(yearOf(s)))) || pool.find(s => famRe(keyName(s)).test(c.auth[0] || "")) || pool[0];
        if (!(src || (P.yr && c.yrs.length && !nn) || c.etal || c.join || inRef(c.auth[0]) || (!nn && (hasYear || (mlaLike && kind === "author"))))) return;
        // MLA: a number that isn't the source's year is a page: (Carskadon 2015) for a 2011 source
        if (!P.yr && src && c.yrs.length === 1 && !c.page && yearOf(src) && /^\d{4}$/.test(c.yrs[0]) && c.yrs[0] !== String(yearOf(src))) { c.page = c.yrs[0]; c.pgSep = c.ay; c.yrs = []; c.ay = ""; }
        const probs = citeProbs(c, P, src, !!nn), y = src ? String(yearOf(src) || "") : "", cAt = nn ? nn.at : at, cLen = nn ? at + len - nn.at : len, orig = nn ? `${nn.names} (${seg})` : multi ? `(${seg})` : m[0];
        if (src && y && P.yr && c.yrs.length && !c.yrs.some(x => x.slice(0, 4) === y)) mism.push({at: cAt, len: cLen, orig, src, y});
        if (probs.length) fmts.push({probs, at: cAt, len: cLen, pat: at, orig, fixed: citeFixed(c, P, src, nn, o), u: !src});
        if (!nn) { c.orig = orig; parsed.push(c); inOne.push([c, seg]); }
      });
      // several works in one citation: alphabetical order (APA)
      if (P.alpha && inOne.length > 1) {
        const key = ([c]) => (c.auth[0] || c.core).toLowerCase(), bad = inOne.some((x, i) => i && key(inOne[i - 1]).localeCompare(key(x)) > 0);
        if (bad) fmts.push({probs: ["alpha"], at, len, pat: at, orig: m[0], fixed: `(${inOne.slice().sort((a, b) => key(a).localeCompare(key(b))).map(x => x[1]).join("; ")})`, u: false});
      }
    }
    // numbered citations: [1], [2]–[4] (IEEE, and AMA in brackets); AMA's superscripts ¹ ²⁻⁴ or ^1. First appearances in order: 1, 2, 3…
    const firsts = [], seenN = new Set();
    const useNum = (k, at, len) => {
      const id = numMap[k] || (o.order ? o.order[k - 1] : (sources[k - 1] || {}).id);
      if (id && sources.some(s => s.id === id) && (kind === "numeric" || numMap[k] || (o.order && o.order[k - 1]))) cite(id, at, len); else if (kind === "numeric") unknown.push([`[${k}]`, at, len]);
      if (!seenN.has(k)) { seenN.add(k); firsts.push([k, at, len]); }
    };
    const BR = /\[(\d{1,3}(?:\s*[,–-]\s*\d{1,3})*)(?:,\s*(?:pp?\.\s*)?[\d–-]+)?\]/g;
    let brEnd = -1, brLast = 0;
    while ((m = BR.exec(body))) {
      const at = m.index, len = m[0].length;
      // "[3]–[5]": the numbers between count too
      if (/^\s*[–-]\s*$/.test(body.slice(brEnd, at)) && /^\d+$/.test(m[1])) for (let k = brLast + 1; k < Number(m[1]) && k - brLast < 50; k++) useNum(k, at, len);
      brEnd = at + len; brLast = Number((m[1].match(/\d+/g) || []).pop());
      m[1].split(/\s*,\s*/).forEach(part => { const r = part.split(/\s*[–-]\s*/).map(Number); for (let k = r[0]; k <= (r[1] || r[0]) && k - r[0] < 50; k++) useNum(k, at, len); });
      if (P.id === "ieee") {
        if (/[–-]/.test(m[1])) fmts.push({probs: ["ieee-range"], at, len, pat: at, orig: m[0], fixed: m[1].split(/\s*,\s*/).map(p => p.split(/\s*[–-]\s*/).map(x => `[${x}]`).join("–")).join(", "), u: false});
        else if (/,/.test(m[1])) fmts.push({probs: ["ieee-list"], at, len, pat: at, orig: m[0], fixed: m[1].split(/\s*,\s*/).map(x => `[${x}]`).join(", "), u: false});
      }
    }
    if (P.num === "sup" || P.num === "any") {
      const SUPD = "⁰¹²³⁴⁵⁶⁷⁸⁹", SR = /(?<=[\p{L}.,;:)”"'’])(?:([⁰¹²³⁴⁵⁶⁷⁸⁹]+(?:[,⁻–-][⁰¹²³⁴⁵⁶⁷⁸⁹]+)*)|\^(\d{1,3}(?:[,–-]\d{1,3})*))/gu;
      while ((m = SR.exec(body))) {
        const t = (m[1] || m[2]).replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, d => String(SUPD.indexOf(d))).replace(/⁻/g, "–");
        t.split(",").forEach(part => { const r = part.split(/[–-]/).map(Number); for (let k = r[0]; k <= (r[1] || r[0]) && k - r[0] < 50; k++) useNum(k, m.index, m[0].length); });
      }
    }
    if (P.num && !P.gen && firsts.length >= 2) {
      firsts.sort((a, b) => a[1] - b[1]);
      const i = firsts.findIndex(([k], j) => k !== j + 1);
      if (i >= 0) push("warn", "Number your sources in the order you first cite them", `${P.num === "sup" ? firsts[i][0] : `[${firsts[i][0]}]`} is the ${i === 0 ? "first" : ["second", "third", "fourth", "fifth"][i - 1] || `${i + 1}th`} source you cite, so it should be ${P.num === "sup" ? i + 1 : `[${i + 1}]`}. In ${P.n}, sources are numbered in the order they first appear, and the list follows that order.`, "", firsts[i][1], firsts[i][2], {key: "num-order"});
    }
    if (kind !== "numeric" && /\[\d{1,3}\]/.test(body) && !/\(([^()]*\b(1[5-9]\d\d|20\d\d))\)/.test(body)) { const b = /\[\d{1,3}\]/.exec(body); slip(`Your draft uses numbered citations like [1]; ${label} uses the author${kind === "author" ? " and page" : kind === "note" ? " in footnotes" : " and year"}.`, b.index, b[0].length); }
    // names in footnotes (note styles): when the footnotes came along in the paste, count a source named anywhere in the body
    if (kind === "note") named.forEach(s => { const r = famRe(keyName(s)).exec(body); if (r) cite(s.id, r.index, r[0].length); });
    const bare = [];
    const Q = /[“"]([^”"\n]{30,500})[”"]/g;
    while ((m = Q.exec(body))) {
      const after = body.slice(m.index + m[0].length, m.index + m[0].length + 160), before = body.slice(Math.max(0, m.index - 200), m.index);
      const sAfter = after.split(/(?<=[.?!])\s+(?=[\p{Lu}“"])/u)[0], sBefore = before.split(/[.?!]\s+(?=[\p{Lu}“"])/u).pop();
      const has = s => /\([^()]*(\d|n\.\s?d\.)[^()]*\)/.test(s) || /\[\d{1,3}/.test(s) || /^[.,;:]?\s*\d{1,3}\b/.test(s) || /^[.,;:]?\s*[⁰¹²³⁴⁵⁶⁷⁸⁹]/.test(s) || (kind === "author" && named.some(x => famRe(keyName(x)).test(s)));
      if (!has(sAfter) && !has(sBefore)) bare.push([m[1].split(/\s+/).slice(0, 8).join(" "), m.index, m[0].length]);
    }
    // a name a letter or two off a source's, with the same year, is that source misspelled ("Lingham et al. (2024)" for Lingam): it counts as
    // citing it, and Check the spelling says so, with a Fix that writes the source's spelling everywhere the draft has the other one
    const lev = (a, b) => { const d = Array.from({length: b.length + 1}, (_, j) => j); for (let i = 1; i <= a.length; i++) { let p = d[0]; d[0] = i; for (let j = 1; j <= b.length; j++) { const t = d[j]; d[j] = Math.min(d[j] + 1, d[j - 1] + 1, p + (a[i - 1] === b[j - 1] ? 0 : 1)); p = t; } } return d[b.length]; };
    const nearOf = new Map();
    unknown.forEach(([u, at, len]) => {
      if (nearOf.has(u)) return;
      const nm = (/^[“"]?([\p{Lu}][\p{L}'’-]+)/u.exec(u) || [])[1]; if (!nm || nm.length < 4) return;
      const f = foldL(nm), ys = yrsOf(u);
      const s = named.find(x => { const k = foldL(keyName(x)); return k && k !== f && k[0] === f[0] && Math.abs(k.length - f.length) <= 2 && lev(k, f) <= (Math.min(k.length, f.length) >= 7 ? 2 : 1) && (!ys.length || ys.includes(String(yearOf(x)))); });
      if (s) { nearOf.set(u, {s, nm}); cite(s.id, at, len); }
    });
    const n = sources.length, citedN = sources.filter(s => cited.has(s.id)).length;
    if (!n) push("warn", "No sources in your Writing Studio yet", "Add your sources to check your citations against them.");
    else if (citedN === n) push("ok", n === 1 ? "Your Writing Studio source is cited in your draft" : `All ${n} sources in your Writing Studio are cited in your draft`);
    if (named.length < n) push("warn", `${n - named.length === 1 ? "A source has" : n - named.length + " sources have"} no title or author`, `Fill ${n - named.length === 1 ? "it" : "them"} in on the Sources tab so your citations can be checked against ${n - named.length === 1 ? "it" : "them"}.`);
    named.filter(s => !cited.has(s.id)).forEach(s => push("warn", `Never cited: ${s.title || keyName(s)}`, kind === "note" ? "Cite it in a footnote where you use it, or remove it if you didn't use it. (Footnotes don't always come along in a paste: check those by eye.)" : "Cite it where you use it, or remove it from your sources if you didn't use it."));
    // a citation that isn't in the sources is one entry: whether it's in the reference list too, and any format slip in it, go with it
    const sayFix = f => f.fixed ? `In ${P.n}, write ${f.fixed}: ${f.probs.map(k => whyOf(k, P)[1]).join("; ")}.` : `${whyOf(f.probs[0], P)[1]}.`.replace(/^./, ch => ch.toUpperCase());
    const slipAt = new Map(); slips.forEach(([at], t) => { slipAt.set(at, (slipAt.get(at) || []).concat([t])); });
    const used = new Set(), seenU = new Set(), spelled = new Set();
    unknown.filter(([u]) => !seenU.has(u) && seenU.add(u)).slice(0, 12).forEach(([u, at, len]) => {
      const near = nearOf.get(u);
      if (near) {
        if (spelled.has(near.nm)) return; spelled.add(near.nm);
        const right = keyName(near.s), re = new RegExp("(^|[^\\p{L}])(" + reEsc(near.nm) + ")(?=$|[^\\p{L}])", "gu"), edits = []; let mm;
        while ((mm = re.exec(draft))) { const e = editAt(draft, mm.index + mm[1].length, near.nm.length, near.nm, right); if (e) edits.push(e); }
        push("err", `Check the spelling: ${/^\[|\)$/.test(u) ? u : "(" + u + ")"}`, `Your source is by ${right}${yearOf(near.s) ? ` (${yearOf(near.s)})` : ""}${near.s.title ? `: “${near.s.title}”` : ""}. ${edits.length > 1 ? `“${near.nm}” is in your draft ${edits.length} times; Fix writes ${right} in each.` : `Fix writes ${right}.`} If your source is the one that's wrong, fix it on the Sources tab instead.`, "", at, len, {key: "spell:" + near.nm, edits});
        return;
      }
      const nm = (/^[“"]?([\p{Lu}][\p{L}'’-]+)/u.exec(u) || [])[1], fold = x => String(x).normalize("NFD").replace(/\p{M}/gu, ""), inR = ref && nm && famRe(fold(nm)).test(fold(ref.body));
      const also = (slipAt.get(at) || []).filter(t => !used.has(t)); also.forEach(t => used.add(t));
      const fx = fmts.filter(f => f.u && !f.used && f.pat === at); fx.forEach(f => { f.used = true; });
      // in the draft's own list, the paper is fine: it's only Writing Studio that doesn't know the source yet (Add to Sources takes it from the list)
      if (inR) push("warn", `In your ${wantL}, not yet in your sources: ${/^\[|\)$/.test(u) ? u : "(" + u + ")"}`, [`Your paper is fine here. Add it to your sources so Writing Studio can check its citations and its entry too.`, ...also.map(t => "Also: " + t), ...fx.map(f => "Also: " + sayFix(f))].join(" "), "", at, len, {addRef: nm});
      else push("err", `Not in your sources: ${/^\[|\)$/.test(u) ? u : "(" + u + ")"}`, [`Add this source to your Writing Studio, or check the spelling of the name.${ref && nm ? ` It isn't in your ${wantL} either.` : ""}`, ...also.map(t => "Also: " + t), ...fx.map(f => "Also: " + sayFix(f))].join(" "), "", at, len);
    });
    const unknownN = seenU.size;
    if (kind !== "note") bare.slice(0, 10).forEach(([q, at, len]) => push("err", `Quote without a citation: “${q}…”`, "Every direct quote needs an in-text citation right after it.", "", at, len));
    // the format of the in-text citations: the same problems together, each group showing its first place and listing the others
    const groups = new Map();
    fmts.filter(f => !f.used).forEach(f => { f.probs.sort((a, b) => PRI.indexOf(a) - PRI.indexOf(b)); const k = f.probs.join("+"); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(f); });
    const IEEE_WHY = {"ieee-range": ["put a range inside one pair of brackets", "write a range as [1]–[3], each number in its own brackets"], "ieee-list": ["put several numbers in one pair of brackets", "give each number its own brackets: [1], [2]"]};
    groups.forEach((list, k) => {
      const f = list[0], why = x => (IEEE_WHY[x] || whyOf(x, P)), whys = f.probs.map(x => why(x)[1]).join("; "), say = x => x.fixed ? `${x.orig} → ${x.fixed}` : x.orig;
      const more = list.slice(1, 12).map(x => ({at: x.at, len: x.len, s: x.orig})), edits = list.map(x => x.fixed ? editAt(draft, x.at, x.len, x.orig, x.fixed) : null).filter(Boolean);
      const head = f.fixed ? `In ${P.n}, write ${f.fixed}` : f.probs[0] === "numeric" ? `${P.n} cites by number, not author and year: ${f.orig}` : `${P.n} cites in footnotes, not in brackets: ${f.orig}`;
      if (list.length === 1) push("err", head, `${f.fixed ? `Not ${f.orig}: ` : ""}${whys.replace(/^./, ch => ch.toUpperCase())}.`, "", f.at, f.len, {key: "fmt:" + k, edits});
      else push("err", `${list.length} citations ${why(f.probs[0])[0]}`, `${f.fixed ? `In ${P.n}, write ${f.fixed}, not ${f.orig}` : `Like ${f.orig}`}: ${whys}. The others: ${list.slice(1, 9).map(say).join("; ")}${list.length > 9 ? `; and ${list.length - 9} more` : ""}.`, "", f.at, f.len, {key: "fmt:" + k, more, edits});
    });
    if (mism.length) {
      const f = mism[0], one = x => `${x.orig}: ${x.src.title ? `“${cap(x.src.title, 60)}”` : keyName(x.src)} is from ${x.y}`;
      // a citation with just the one year: that year becomes the source's (a citation of several works is left to the student)
      const edits = mism.map(x => { const ys = x.orig.match(/\b(1[5-9]\d\d|20\d\d)[a-z]?\b/g) || []; return ys.length === 1 ? editAt(draft, x.at, x.len, x.orig, x.orig.replace(ys[0], x.y)) : null; }).filter(Boolean);
      push("err", mism.length === 1 ? `The year doesn't match your source: ${f.orig}` : `${mism.length} citations have a year that doesn't match the source`, mism.length === 1 ? `${one(f)} in your Writing Studio. Fix the year here, or on the Sources tab if the source is wrong.` : `${mism.slice(0, 8).map(one).join("; ")}. Fix the years here, or on the Sources tab if a source is wrong.`, "", f.at, f.len, {key: "fmt:year-match", more: mism.slice(1, 12).map(x => ({at: x.at, len: x.len, s: x.orig})), edits});
    }
    if (!P.gen && !P.num && !P.note && parsed.length && !fmts.length && !mism.length) push("ok", `Your in-text citations are in ${P.n} format`);
    // the whole draft written in another style (when the assignment doesn't name one): offer to switch
    const r = rules(o.req);
    if (!r.style && parsed.length >= 3) {
      const ac = parsed.filter(c => c.yrs.length && /,/.test(c.ay)), as = parsed.filter(c => c.yrs.length && !/,/.test(c.ay)), ml = parsed.filter(c => !c.yrs.length), T = parsed.length;
      let to = "", ex = null; const plainest = l => l.find(c => !/,/.test(c.pgSep) && !c.pl) || l[0];
      if (P.yr && !P.num && ml.length / T >= 0.7) { to = "modern-language-association"; ex = plainest(ml); }
      else if ((P.yr === 0 || P.num || P.note) && (ac.length + as.length) / T >= 0.7) { to = ac.length >= as.length ? "apa" : "chicago-author-date"; ex = plainest(ac.length >= as.length ? ac : as); }
      else if (P.yr && P.ay === ", " && T >= 4 && as.length / T >= 0.8) { to = "chicago-author-date"; ex = as[0]; }
      else if (P.yr && P.ay === " " && T >= 4 && ac.length / T >= 0.8) { to = "apa"; ex = ac[0]; }
      if (to && to !== style && to !== o.parent) push("warn", `Your citations look like ${SHORTN[to]}`, `Most are written like ${ex.orig}, and Writing Studio is set to ${label}. If your assignment uses ${SHORTN[to]}, switch; if not, fix them as shown here.`, "style:" + to, null, null, {key: "looks:" + to});
    }
    if (!ref) {
      // a list made from the cited sources' entries (in the style's own order), at the end
      const ids = sources.filter(s => cited.has(s.id) && o.refs && o.refs[s.id]).map(s => s.id), ordered = o.refs ? Object.keys(o.refs).filter(id => ids.includes(id)) : [];
      push(n ? "err" : "warn", `No ${wantL} found`, `Add a heading called ${want} at the end, then your sources. Copy it from the Sources tab.`, "", null, null, ordered.length ? {key: "ref-none", edits: [refAppend(draft, want, ordered.map(id => P.num ? o.refs[id] : unnum(o.refs[id])))]} : {key: "ref-none"});
    }
    else {
      if (ref.bare) push("err", `Your ${wantL} has no heading`, `In ${label}, the list starts with a heading, ${want}, on its own line above the entries.`, "", ref.at, Math.min(80, ref.body.indexOf("\n") > 0 ? ref.body.indexOf("\n") : ref.body.length), {key: "heading", edits: [{at: ref.at, len: 0, from: "", to: want + "\n", k: "!"}]});
      else if (ref.name.toLowerCase() !== want.toLowerCase() && HEADS[style]) { const ha = draft.indexOf(ref.name, ref.at); push("err", `In ${label}, the list is called ${want}`, `Yours is called “${sq(ref.name)}”: rename the heading.`, "", ref.at, ref.name.length, {key: "heading", edits: [editAt(draft, ha, ref.name.length, ref.name, want)].filter(Boolean)}); }
      const miss = sources.filter(s => cited.has(s.id) && !famRe(keyName(s)).test(ref.body) && ![...nearOf.values()].some(v => v.s === s && famRe(v.nm).test(ref.body)));
      miss.forEach(s => { const X = o.refs && o.refs[s.id], ins = X ? refInsert(draft, ref, ents, P.num ? X : unnum(X)) : null; push("err", `Cited but not in your ${wantL}: ${s.title || keyName(s)}`, "Add its entry to the list.", "", (firstAt[s.id] || [])[0], (firstAt[s.id] || [])[1], {key: "miss:" + s.id, edits: ins ? [ins] : []}); });
      // only when nothing cited is missing: a citation that isn't in the sources is cited too
      if (!miss.length && citedN) push("ok", !unknownN ? `Every cited source is in your ${wantL}` : citedN === 1 ? `Your cited Writing Studio source is in your ${wantL}` : `All ${citedN} cited Writing Studio sources are in your ${wantL}`);
      // its order: alphabetical by the first author (or title), or numbered 1, 2, 3 in numbered styles
      if (P.num) {
        const nums = ents.map(e => e.num), i = nums.findIndex((k, j) => k !== j + 1);
        if (nums.filter(Boolean).length >= 2 && i >= 0) push("warn", `Your ${wantL} isn't numbered 1, 2, 3…`, `Number the entries in order from 1: in ${P.n}, the list follows the order you first cite each source.`, "", ents[i].at, ents[i].len, {key: "ref-num"});
      } else if (ents.length >= 2 && !ents.some(e => e.num)) {
        const first = e => (loose(e.t).replace(/^(the|a|an)\s+/, "").split(" ")[0] || ""), name = e => (/^[“"‘']?([\p{L}'’-]+)/u.exec(nq(e.t).replace(/^["']?(the|a|an)\s+/i, "")) || [])[1] || "";
        for (let i = 1; i < ents.length; i++) {
          if (/^[-—–_]{2,}/.test(ents[i].t) || /^[-—–_]{2,}/.test(ents[i - 1].t)) continue;
          if (first(ents[i - 1]).localeCompare(first(ents[i]), "en", {sensitivity: "base"}) > 0) {
            // the entries in order, each exactly as written, with the list's own spacing between them
            const a = ents[0].at, end = ents[ents.length - 1].at + ents[ents.length - 1].len, seps = ents.slice(1).map((e, j) => draft.slice(ents[j].at + ents[j].len, e.at)), same = seps.every(x => x === seps[0]);
            const sorted = ents.slice().sort((x, y) => refKey(x.t).localeCompare(refKey(y.t), "en", {sensitivity: "base"})).map(e => draft.slice(e.at, e.at + e.len));
            push("warn", `Your ${wantL} isn't in alphabetical order`, `${name(ents[i])} should come before ${name(ents[i - 1])}: the list goes by the first author's last name (or the title, when there's no author).`, "", ents[i].at, ents[i].len, {key: "ref-order", edits: same && /^\s*$/.test(seps[0]) ? [editAt(draft, a, end - a, draft.slice(a, end), sorted.join(seps[0]))].filter(Boolean) : []}); break; }
        }
      }
      // each entry against the style's own version of it
      if (o.refs) {
        let bad = 0, compared = 0;
        const who = s => { const a = (s.author || []).map(familyOf).filter(Boolean); return `${a.length ? a[0] + (a.length === 2 ? " and " + a[1] : a.length > 2 ? " et al." : "") : cap(s.title, 40) || "Untitled"} (${yearOf(s) || "n.d."})`; };
        ents.forEach(e => {
          const s = e.sid && sources.find(x => x.id === e.sid), X = s && o.refs[s.id]; if (!X) return;
          compared++; const why = refDiff(e.t, X, s); if (!why.length) return;
          // the right entry in its place (a numbered list keeps the entry's own number)
          const was = draft.slice(e.at, e.at + e.len), pre = (/^\s*(\[\d{1,3}\]\s*|\d{1,3}[.)]\s+)/.exec(was) || [""])[0];
          if (++bad <= 10) push("err", `${want}: fix the entry for ${who(s)}`, why.join(". ") + ".", "", e.at, e.len, {key: "ref:" + s.id, should: unnum(X), sid: s.id, edits: [editAt(draft, e.at, e.len, was, pre + unnum(X))].filter(Boolean)});
        });
        if (bad > 10) push("err", `${bad - 10} more ${want} entries need fixing`, "Fix the ones above, then check again.", "", null, null, {key: "ref:more"});
        if (compared && !bad) push("ok", `Your ${want} entries are in ${P.n} format`);
      }
    }
    slips.forEach(([at, len], t) => { if (!used.has(t)) push("warn", t, "", "", at, len); });
    if (r.style && r.style !== style) push("err", `The assignment asks for ${o.names && o.names[r.style] || r.style}`, `Your Writing Studio is set to ${label}.`, "style:" + r.style);
    if (r.min) {
      const have = r.scholarly ? sources.filter(s => cited.has(s.id) && SCHOLARLY.includes(s.type)).length : citedN;
      push(have >= r.min ? "ok" : "err", `The assignment asks for at least ${r.min}${r.scholarly ? " scholarly" : ""} source${r.min === 1 ? "" : "s"}: you cite ${have}`, have >= r.min ? "" : r.scholarly ? "Journal articles, books, book sections, conference papers, theses and reports count as scholarly here." : "");
    }
    const order = {err: 0, warn: 1, ok: 2};
    issues.sort((a, b) => order[a.k] - order[b.k]);
    return {issues, cited: citedN, total: n, hasRef: !!ref, citedIds: sources.filter(s => cited.has(s.id)).map(s => s.id)};
  }
  // What changed between two checks: the issues (to fix or to look at) that went away, and the new ones
  const issueKeys = r => ((r && r.issues) || []).filter(x => x.k !== "ok").map(x => x.key || x.t);
  function diffIssues(prevKeys, next){
    const a = new Set(prevKeys || []), b = new Set(issueKeys(next));
    return {fixed: [...a].filter(k => !b.has(k)).length, fresh: [...b].filter(k => !a.has(k)).length};
  }
  // A short fingerprint of a text (to tell whether a draft changed since it was checked)
  function hash(s){ s = String(s || ""); let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36) + ":" + s.length; }
  // A draft kept on the paper is capped: its start and its end (where the reference list is) when it's longer
  /* Auto-fix: changes to the draft that are certain. Each edit says what it expects to find (from) where (at, len) and what goes there (to);
     it's made only when the draft really has that text there, and applied only when it still does. An insertion (len 0) can carry a sort key (k)
     so several at one place land in order. Edits that overlap aren't applied together (the rest wait for the next round, after a new check). */
  const editAt = (draft, at, len, from, to) => at != null && at >= 0 && from != null && draft.slice(at, at + len) === from && from !== to ? {at, len, from, to} : null;
  function applyEdits(textIn, editsIn){
    const text = String(textIn || ""), keep = planEdits(text, editsIn);
    let out = text; keep.forEach(e => { out = out.slice(0, e.at) + e.to + out.slice(e.at + e.len); });
    return {text: out, n: keep.length, skipped: (editsIn || []).length - keep.length, plan: keep};
  }
  // the edits that can be made together, in the order to make them
  function planEdits(textIn, editsIn){
    const text = String(textIn || ""), ok = (editsIn || []).filter(e => e && e.at >= 0 && e.at + e.len <= text.length && text.slice(e.at, e.at + e.len) === e.from);
    const keep = [];
    ok.slice().sort((a, b) => a.at - b.at || b.len - a.len).forEach(e => {
      const clash = keep.some(x => x.len && e.len ? e.at < x.at + x.len && x.at < e.at + e.len : x.len ? e.at > x.at && e.at < x.at + x.len : e.len ? x.at > e.at && x.at < e.at + e.len : false);
      if (!clash && !keep.some(x => x.at === e.at && x.len === e.len && x.from === e.from && x.to === e.to && !e.len === !x.len && x.k === e.k)) keep.push(e);
    });
    // from the end, so earlier positions stay right; at one place, a replacement before insertions, insertions by key (last first)
    keep.sort((a, b) => b.at - a.at || (b.len ? 1 : 0) - (a.len ? 1 : 0) || String(b.k || "").localeCompare(String(a.k || "")));
    return keep;
  }
  // where a new entry goes in the draft's reference list: in alphabetical order among the others (a numbered list is left alone)
  const refKey = t => loose(String(t || "")).replace(/^(the|a|an)\s+/, "");
  const isNumbered = ents => ents.some(e => e.num || /^\s*(\[\d{1,3}\]|\d{1,3}[.)]\s)/.test(e.t));
  function refInsert(draft, ref, ents, entry){
    if (!ref || isNumbered(ents)) return null;
    const k = refKey(entry);
    if (!ents.length) { const pos = draft.length - ref.body.length, end = pos >= draft.length; return {at: pos, len: 0, from: "", to: (end && !/\n$/.test(draft) ? "\n" : "") + entry + (end ? "" : "\n"), k}; }
    const sep = ents.length >= 2 ? (/^\s*\n\s*\n/.test(draft.slice(ents[0].at + ents[0].len, ents[1].at)) ? "\n\n" : "\n") : "\n";
    const i = ents.findIndex(e => refKey(e.t).localeCompare(k, "en", {sensitivity: "base"}) > 0);
    if (i >= 0) return {at: ents[i].at, len: 0, from: "", to: entry + sep, k};
    const last = ents[ents.length - 1]; return {at: last.at + last.len, len: 0, from: "", to: sep + entry, k};
  }
  // a whole new list at the end of the draft: its heading, then the entries
  const refAppend = (draft, head, entries) => ({at: draft.length, len: 0, from: "", to: (draft ? (/\n$/.test(draft) ? "\n" : "\n\n") : "") + head + "\n" + entries.join("\n"), k: "~"});
  /* Add to References: the chosen sources' entries in the draft's list (made if there isn't one), skipping the ones already in it */
  function refAdd(draftIn, sourcesIn, refs, o){
    o = o || {}; const draft = String(draftIn || "").replace(/\r\n?/g, "\n"), sources = (sourcesIn || []).map(clean), ref = refSection(draft), ents = ref ? refEntriesAt(draft) : [];
    const has = s => ref && famRe(keyName(s)).test(ref.body) && (!s.title || loose(ref.body).includes(loose(s.title).split(" ").slice(0, 4).join(" ")));
    const order = Object.keys(refs || {}), todo = sources.filter(s => refs && refs[s.id] && !has(s)).sort((x, y) => order.indexOf(x.id) - order.indexOf(y.id)), already = sources.filter(s => has(s)).map(s => s.id), entry = s => o.num ? refs[s.id] : unnum(refs[s.id]);
    if (!todo.length) return {edits: [], added: [], already};
    if (!ref) return {edits: [refAppend(draft, o.head || "References", todo.map(entry))], added: todo.map(s => s.id), already, made: true};
    if (isNumbered(ents)) return {edits: [], added: [], already, numbered: true, left: todo.map(s => s.id)};
    return {edits: todo.map(s => refInsert(draft, ref, ents, entry(s))).filter(Boolean), added: todo.map(s => s.id), already};
  }
  function capDraft(s, max){
    s = String(s || "").replace(/\r\n?/g, "\n").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim(); max = max || 60000;
    if (s.length <= max) return s;
    const ref = refSection(s), tail = ref ? Math.min(s.length - ref.at, Math.floor(max * 0.4)) : Math.floor(max * 0.25);
    return s.slice(0, max - tail - 3) + "\n…\n" + s.slice(s.length - tail);
  }
  // The sentence around a place in the text: [start, end]
  function sentenceAt(text, at, len){
    text = String(text || ""); at = Math.max(0, Math.min(text.length, at || 0));
    let s = at;
    while (s > 0) { const c = text[s - 1]; if (c === "\n") break; if (/[.?!]/.test(c) && /\s/.test(text[s] || "") && !/(^|[\s(])(\p{Lu}|p|pp|al|vol|no|ed|eds|e\.g|i\.e)$/u.test(text.slice(Math.max(0, s - 6), s - 1))) break; s--; }
    while (/\s/.test(text[s] || "")) s++;
    const from = Math.min(text.length, at + Math.max(1, len || 1)), re = /[.?!]["”’)]*(?=\s|$)|\n/g; re.lastIndex = from;
    const m = re.exec(text), e = m ? m.index + (m[0] === "\n" ? 0 : m[0].length) : text.length;
    return [s, Math.max(e, from)];
  }

  /* Reading the draft's own reference list: its entries (with where each is in the draft), and each entry's details (no AI: the patterns of APA, MLA, Chicago, IEEE and Harvard) */
  function refEntriesAt(draftIn){
    const draft = String(draftIn || "").replace(/\r\n?/g, "\n"), ref = refSection(draft); if (!ref) return [];
    const base = draft.length - ref.body.length;
    let body = ref.body; const stop = /\n[ \t]*(appendix|appendices|endnotes|tables?|figures?)\b[^\n]{0,60}(\n|$)/i.exec("\n" + body); if (stop) body = body.slice(0, Math.max(0, stop.index - 1));
    const lines = body.split("\n"), out = [], blank = /\S[ \t]*\n[ \t]*\n[ \t]*\S/.test(body.trim());
    const numbered = l => /^\s*(\[\d{1,3}\]|\d{1,3}[.)]\s)/.test(l);
    const anyNum = lines.filter(numbered).length >= 2;
    let cur = "", st = -1, en = -1, off = 0;
    const flush = () => { const e = sq(cur.replace(/-\n(?=\p{Ll})/gu, "").replace(/\n/g, " ")); if (e) out.push({t: e, at: base + st, len: en - st}); cur = ""; st = -1; };
    lines.forEach(l => {
      const lo = off; off += l.length + 1;
      if (!l.trim()) { if (blank || anyNum) flush(); return; }
      // without numbers or blank lines between them, an entry starts on a line with a capital after one that ended (a full stop, a bracket, a link or a number)
      const starts = anyNum ? numbered(l) : blank ? false : (/^\s*[\p{Lu}“"‘'[]/u.test(l) && !/^\s*(https?:|doi|www\.)/i.test(l) && /([.)]|\/\S*|\d)\s*$/.test(cur.trim() || "."));
      if (starts && cur.trim()) flush();
      if (st < 0) st = lo + (l.length - l.replace(/^\s+/, "").length);
      en = lo + l.replace(/\s+$/, "").length;
      cur += (cur ? "\n" : "") + l.trim();
    });
    flush();
    return out.filter(e => e.t.length >= 15 && (YEAR.test(e.t) || /\b10\.\d{4,9}\/|https?:\/\/|\bISBN/i.test(e.t))).slice(0, 80);
  }
  const refEntries = d => refEntriesAt(d).map(e => e.t);
  const ABBR = /(?:^|[\s(.])(?:\p{Lu}|vol|nos?|pp?|eds?|al|inc|jr|sr|st|dr|mr|mrs|ms|co|ltd|corp|rev|trans|n\.d|u\.s|u\.k|e\.g|i\.e|ch|para|fig|dept|univ|ser)$/iu;
  // splits at full stops that end a part (not after an initial or an abbreviation); "Smith, Jordan A." at the start still ends the first part
  function segs(s){
    const out = []; let last = 0, m; const re = /([.?!])\s+/g;
    s = String(s || "");
    while ((m = re.exec(s))) {
      const before = s.slice(last, m.index);
      if (m[1] === "." && ABBR.test(before) && !(!out.length && /^[\p{L}'’ -]+,\s+\p{Lu}[\p{L}'’-]+(\s+\p{Lu})+$/u.test(before))) continue;
      out.push(s.slice(last, m.index + (m[1] === "." ? 0 : 1))); last = m.index + m[0].length;
    }
    out.push(s.slice(last));
    return out.map(x => sq(x).replace(/^[,.;:\s]+|[,.;:\s]+$/g, "")).filter(Boolean);
  }
  const PART = /^(van|von|de|der|den|del|della|da|di|la|le|du|ter|bin|al|dos|das)$/i;
  const isInit = x => /^(\p{Lu}\.?[\s-]?){1,4}$/u.test(sq(x));
  // "Smith, J. A., & Lee, K." · "Smith, Jordan A., and Kim Lee" · "J. A. Smith and K. Lee" · "Smith, J.A. and Lee, K." · "World Health Organization"
  function authorsOf(a){
    a = sq(a).replace(/\bet al\.?/gi, "").replace(/\(eds?\.?\)|\beds?\.\s*$/gi, "").replace(/^[,.;:\s]+|[,.;:\s]+$/g, "");
    if (!a) return [];
    const toks = a.replace(/\s*,?\s*(?:&|\band\b)\s+/g, ", ").split(/\s*,\s*/).map(sq).filter(Boolean), out = [];
    for (let i = 0; i < toks.length; i++) {
      const t0 = toks[i], nx = toks[i + 1], oneWord = t0.split(" ").every((w, j, l) => j === l.length - 1 || PART.test(w));
      if (nx && !ORG.test(t0) && (isInit(nx) || (i === 0 && oneWord && !isInit(t0)))) { out.push({family: t0, given: isInit(nx) && !/-/.test(nx) ? nx.replace(/[.\s]/g, "").split("").join(". ") + "." : nx}); i++; }
      else { const p = person(t0); if (p) out.push(p); }
    }
    return out.slice(0, 30);
  }
  const YR = /(?<![\d–-])(1[5-9]\d\d|20\d\d)(?![\d–-])/g;
  function parseRef(raw){
    let s = sq(raw).replace(/^(\[\d{1,3}\]|\d{1,3}[.)])\s*/, ""); const it = {};
    const doi = /(?:https?:\/\/(?:dx\.)?doi\.org\/|\bdoi:?\s*)?\b(10\.\d{4,9}\/[^\s"<>]+)/i.exec(s);
    if (doi) { it.DOI = doi[1].replace(/[.,;)\]]+$/, ""); s = s.replace(doi[0], " "); }
    const ib = /\bISBN(?:-1[03])?:?\s*([\dX][\d\s-]{8,16}[\dX])/i.exec(s); if (ib) { const d = ib[1].replace(/[\s-]/g, ""); if ((d.length === 10 || d.length === 13) && isbnOk(d)) it.ISBN = d.toUpperCase(); s = s.replace(ib[0], " "); }
    const url = /(?:Retrieved from:?\s*|Available (?:at|from):?\s*)?<?(https?:\/\/[^\s<>"]+)>?/i.exec(s); if (url) { it.URL = url[1].replace(/[.,;)\]]+$/, ""); s = s.replace(url[0], " "); }
    s = s.replace(/[([]?(?:Accessed|Retrieved|Viewed)(?::|\s)[^)\]]*?\d{4}[)\]]?[.,]?/gi, " ");
    s = sq(s).replace(/\s+([.,;:])/g, "$1").replace(/[,.;:\s]+$/, "");
    let authors = "", year = "", title = "", rest = "", m;
    const Qt = /^\s*[“"]([^”"]{2,400})[”"]|^\s*[‘']([^‘’']{2,400})[’']/;
    const takeTitle = r => { const q = Qt.exec(r); if (q) return [q[1] || q[2], r.slice(q[0].length)]; const g = segs(r); const t = g[0] || ""; return [t, r.slice(r.indexOf(t) + t.length)]; };
    if ((m = /\((\d{4})[a-z]?(?:,[^)]*)?\)|\((n\.\s?d\.)\)/.exec(s)) && m.index < 300) {
      // APA, Harvard: Authors (Year). Title. Rest
      authors = s.slice(0, m.index); year = m[1] || ""; [title, rest] = takeTitle(s.slice(m.index + m[0].length).replace(/^[.,:\s]+/, ""));
    } else if ((m = /[“"]([^”"]{2,400})[”"]/.exec(s)) && m.index < 300) {
      // MLA, Chicago, IEEE: Authors. (Year.) “Title.” Rest
      authors = s.slice(0, m.index); title = m[1]; rest = s.slice(m.index + m[0].length);
      const y = /[.,]?\s*(1[5-9]\d\d|20\d\d)[a-z]?[.,]?\s*$/.exec(authors); if (y) { year = y[1]; authors = authors.slice(0, y.index); }
    } else {
      const ie = /^((?:(?:\p{Lu}\.\s?-?)+\s*[\p{L}'’-]+(?:\s*,\s*(?:and\s+)?|\s+and\s+))+)(.*)$/u.exec(s);
      if (ie) { authors = ie[1]; const g = segs(ie[2]); title = g[0] || ""; rest = ie[2].slice(ie[2].indexOf(title) + title.length); }
      else {
        const g = segs(s); authors = g[0] || ""; let i = 1;
        if (g[i] && /^(1[5-9]\d\d|20\d\d)[a-z]?$/.test(g[i])) { year = g[i].slice(0, 4); i++; }
        title = g[i] || ""; rest = g.slice(i + 1).join(". ");
      }
    }
    title = sq(title).replace(/^[“"‘']|[”"’']$/g, "").replace(/[,.;:\s]+$/, "");
    const ed = /\s*\((\d+)(?:st|nd|rd|th)\.? ed(?:ition|\.)?\)/i.exec(title); if (ed) { it.edition = ed[1]; title = title.replace(ed[0], ""); }
    // IEEE and Chicago books: "Title, 2nd ed. London: Publisher" (what follows the edition is the rest)
    const ed2 = /,?\s+(\d+)(?:st|nd|rd|th)\.? ed(?:ition|\.)?\.?(?:\s+(.*))?$/i.exec(title); if (ed2 && ed2.index > 2) { it.edition = ed2[1]; title = title.slice(0, ed2.index); rest = (ed2[2] || "") + (rest ? ". " + rest : ""); }
    rest = sq(rest).replace(/^[,.;:\s]+/, "");
    const allYears = rest.match(YR) || []; if (!year && allYears.length) year = allYears[allYears.length - 1];
    let vol = (/\b(?:vol\.?|volume)\s*(\d+)/i.exec(rest) || [])[1] || "", iss = (/\b(?:no\.?|issue|iss\.)\s*(\d+)/i.exec(rest) || [])[1] || "";
    const vi = /(?:^|[\s,])(\d{1,4})\s?\((\d{1,4}(?:[–-]\d+)?)\)/.exec(rest); if (vi && !vol) { vol = vi[1]; iss = iss || vi[2]; }
    const page = (/\bpp?\.\s*([\dA-Za-z]*\d[\dA-Za-z]*(?:\s*[–-]\s*[\dA-Za-z]+)?)/.exec(rest) || [])[1] || (/:\s*(\d+\s*[–-]\s*\d+)/.exec(rest) || [])[1] || (/\)\s*,\s*(\d+\s*[–-]\s*\d+)/.exec(rest) || [])[1] || "";
    const r0 = segs(rest)[0] || "", chap = /^In\s+/.test(rest) || /\bedited by\b|\(eds?\.?\)/i.test(rest);
    let cont = "";
    if (chap) cont = sq((/^In\s+(?:[^,(]*?\(eds?\.?\),?\s*)?(.+?)(?:\s*\(pp?\.|,\s*edited by|\.\s|,\s*\d|$)/i.exec(rest) || /^(.+?),\s*edited by/i.exec(rest) || [])[1] || "");
    else cont = sq(r0.split(/,\s*|\s+(?=\d)|\s+(?=vol\b)/i)[0] || "").replace(/^in\s+/i, "");
    const article = !!(vol || iss || (page && cont && !chap));
    let type = chap ? "chapter" : /proceedings|conference|symposium|workshop/i.test(cont) ? "paper-conference" : article || (it.DOI && cont && !it.ISBN && !/^[^,]*:/.test(r0)) ? "article-journal" : it.URL && !it.ISBN ? "webpage" : "book";
    if (type === "book") {
      // the part after the title is the publisher: "Place: Publisher" (Chicago, Harvard, IEEE), "Publisher, 2019" (MLA) or "Publisher" (APA)
      const pb = segs(rest).map(x => x.replace(YR, "").replace(/[,.;:\s]+$/, "").trim()).find(x => x && !/^(\d+(st|nd|rd|th)\.? ed\.?|pp?\.)/i.test(x));
      if (pb) { const pl = /^([^:]{2,60}):\s*(.+)$/.exec(pb); if (pl) { it["publisher-place"] = pl[1]; it.publisher = pl[2]; } else it.publisher = pb; } else if (!it.ISBN) type = "document";
    } else if (cont) it["container-title"] = cont.replace(/[,.;:\s]+$/, "");
    if (type === "webpage" && !it["container-title"] && it.URL) it["container-title"] = hostOf(it.URL);
    Object.assign(it, {type, title, author: authorsOf(authors), volume: vol, issue: iss, page: page.replace(/\s/g, "")});
    if (year) it.issued = date(year);
    const c = clean(it);
    return c.title || c.author ? c : null;
  }
  // Quoted passages in the draft with a citation right after them: (Smith, 2020, p. 4), (Smith 42), [3], [3, p. 4] or a footnote mark
  const SUP = "⁰¹²³⁴⁵⁶⁷⁸⁹";
  function quotesIn(draftIn, itemsIn, o){
    o = o || {}; const draft = String(draftIn || "").replace(/\r\n?/g, "\n"), ref = refSection(draft), body = ref ? draft.slice(0, ref.at) : draft;
    const sources = (itemsIn || []).map(clean), byName = seg => (sources.find(s => keyName(s) && famRe(keyName(s)).test(seg)) || {}).id || "", out = [];
    let m; const Q = /[“"]([^”"\n]{20,600})[”"]/g;
    while ((m = Q.exec(body)) && out.length < 60) {
      const t = sq(m[1]).replace(/[,.;:]$/, ""); if (t.split(" ").length < 5) continue;
      const after = body.slice(m.index + m[0].length, m.index + m[0].length + 200), before = body.slice(Math.max(0, m.index - 220), m.index), sBefore = before.split(/[.?!]\s+(?=[\p{Lu}“"])/u).pop();
      let sid = "", p = "", cite = "", x;
      if ((x = /^\s*[,.;:]?\s*\(([^()\n]{1,160})\)/.exec(after))) {
        cite = `(${x[1]})`; const seg = x[1];
        p = ((/\b(?:pp?|para)\.\s*(\d+(?:\s*[–-]\s*\d+)?)/i.exec(seg) || [])[1] || (/(?:^|[\s,])(\d{1,4}(?:[–-]\d+)?)$/.exec(seg) || [])[1] || "").replace(/\s/g, "");
        if (p && /^(1[5-9]\d\d|20\d\d)$/.test(p) && !/\bpp?\./.test(seg)) p = "";
        sid = byName(seg) || byName(sBefore);
      } else if ((x = /^\s*[,.;:]?\s*\[(\d{1,3})(?:\s*,\s*(?:pp?\.\s*)?([\d–-]+))?\]/.exec(after))) {
        cite = `[${x[1]}]`; const k = Number(x[1]) - 1; sid = (o.order ? o.order[k] : (sources[k] || {}).id) || ""; p = x[2] || "";
      } else if ((x = new RegExp(`^[.,;:]?([${SUP}]+|\\d{1,3})(?=[\\s.,;:]|$)`).exec(after))) {
        cite = "Note " + [...x[1]].map(ch => SUP.includes(ch) ? SUP.indexOf(ch) : ch).join(""); sid = byName(sBefore);
      } else continue;
      out.push({t, sid, p, cite, at: m.index});
    }
    return out;
  }
  return {TYPES, LABEL, CONT, NAMES, names, namesText, person, familyOf, date, parseDate, dateParts, yearOf, isoOf, clean, mapType, parseId, isbnOk, fromOpenLibrary, fromHtml, hostOf, keyName,
    parseBibTeX, parseRIS, parseCslJson, parseAny, toBibTeX, toRIS, toCslJson, dupOf, runs, runsHtml, runsText, engine, styleInfo, plain, check, rules, headingOf, detex, sentenceCase, looksTitleCase,
    diffIssues, issueKeys, hash, capDraft, applyEdits, refAdd, sentenceAt, refEntries, refEntriesAt, parseRef, authorsOf, segs, quotesIn, refSection, parseCite, profileOf, refDiff,
    narrOf, citePlace};
  /* Cite Here: a citation where the student clicked. The style's own citation is the one in brackets, "(Lingam et al., 2024)"; in the middle
     of a sentence the authors are part of it, "Lingam et al. (2024)" (APA, Harvard, Chicago), or just named, "Lingam et al." (MLA, which
     keeps its page for the end); numbered styles look the same either way. */
  function narrOf(paren){
    const p = String(paren || "").trim();
    if (!/^\(/.test(p)) return p;
    const m = /^\((.+?),?\s+((?:1[5-9]\d\d|20\d\d)[a-z]?|n\.\s?d\.)((?:,\s*[^)]*)?)\)$/.exec(p);
    if (m) return `${m[1].replace(/\s&\s/g, " and ")} (${m[2]}${m[3]})`;
    const n = /^\(([^()\d]+?)(?:\s+\d[\d–-]*)?\)$/.exec(p);
    return n ? n[1].replace(/\s&\s/g, " and ") : p;
  }
  // Where it goes and which form: at the end of a sentence (next to its full stop, in its last word, or at the end of a paragraph) the one in
  // brackets, before the full stop; right after a quotation, the one in brackets just after the closing quote mark; anywhere else the one in
  // the sentence, at the start of the word clicked in. o: {paren, narr}; at: the place (or the end of what was selected).
  function citePlace(textIn, at, o){
    const text = String(textIn || ""), W_ = /[\p{L}\p{N}'’-]/u, END = /[.?!]/, CQ = /["”’»]/;
    let p = Math.max(0, Math.min(at, text.length));
    const lineEnd = (i => i < 0 ? text.length : i)(text.indexOf("\n", p));
    let w = p; while (w < lineEnd && W_.test(text[w])) w++;
    let k = w; while (k < lineEnd && text[k] === " ") k++;
    let j = p; while (j > 0 && text[j - 1] === " ") j--;
    const paren = o.paren, sp = i => i > 0 && !/[\s(\[“"‘]/.test(text[i - 1]) ? " " : "";
    // right after a quotation (the caret before or after its closing mark): after the mark
    if (CQ.test(text[p] || "") && !W_.test(text[p + 1] || "") && /\S/.test(text[p - 1] || "")) return {kind: "end", quote: true, edit: {at: p + 1, len: 0, from: "", to: " " + paren}};
    if (CQ.test(text[j - 1] || "") && j === p && j > 1 && !W_.test(text[j] || "") && (END.test(text[j - 2]) ? false : true)) return {kind: "end", quote: true, edit: {at: j, len: 0, from: "", to: " " + paren}};
    // a full stop inside the closing quote ("…heals.") moves after the citation: …heals" (Ray, 2004).
    const qd = CQ.test(text[j - 1] || "") && END.test(text[j - 2] || "") ? j : CQ.test(text[k] || "") && END.test(text[k - 1] || "") ? k + 1 : -1;
    if (qd > 0) return {kind: "end", quote: true, edit: {at: qd - 2, len: 2, from: text.slice(qd - 2, qd), to: text[qd - 1] + " " + paren + text[qd - 2]}};
    // the end of a sentence: its full stop just after (the rest of the word clicked in, then the stop), or just before, or the paragraph's end
    if (END.test(text[k] || "") && (k === w || /^ *$/.test(text.slice(w, k)))) return {kind: "end", edit: {at: w, len: 0, from: "", to: " " + paren}};
    if (END.test(text[j - 1] || "") && !W_.test(text[p] || "")) { let e = j - 1; while (e > 0 && END.test(text[e - 1])) e--; return {kind: "end", edit: {at: e, len: 0, from: "", to: (sp(e) ? " " : "") + paren}}; }
    if (k >= lineEnd && w > 0 && W_.test(text[w - 1] || "")) return {kind: "end", edit: {at: w, len: 0, from: "", to: " " + paren}};
    // the middle of a sentence: at the start of the word clicked in
    let s0 = p; while (s0 > 0 && W_.test(text[s0 - 1])) s0--;
    const pre = sp(s0), post = W_.test(text[s0] || "") ? " " : "";
    return {kind: "mid", edit: {at: s0, len: 0, from: "", to: pre + o.narr + post}};
  }
})();
/*CITE-END*/

/* ---------- Styles and the citeproc engine ---------- */
const CP_DIR = "vendor/citeproc-2.4.63/", CP_JS = CP_DIR + "citeproc.js", CP_SRI = "sha384-u7+IHwmJnrn4elC1/IsDA0jzpAmRvPzvDzPXbUaKxsJF1DLQJnzP8asXC2uhD8XJ";
const BUILT = [["apa", "APA 7th edition"], ["modern-language-association", "MLA 9th edition"], ["chicago-author-date", "Chicago 18th (author-date)"], ["chicago-notes-bibliography", "Chicago 18th (notes and bibliography)"],
  ["ieee", "IEEE"], ["harvard-cite-them-right", "Harvard (Cite Them Right)"], ["american-medical-association", "AMA 11th edition"], ["american-sociological-association", "ASA 7th edition"]];
const BUILT_FMT = {"apa": "author-date", "modern-language-association": "author", "chicago-author-date": "author-date", "chicago-notes-bibliography": "note", "ieee": "numeric", "harvard-cite-them-right": "author-date", "american-medical-association": "numeric", "american-sociological-association": "author-date"};
const SHORT = {"apa": "APA", "modern-language-association": "MLA", "chicago-author-date": "Chicago", "chicago-notes-bibliography": "Chicago notes", "ieee": "IEEE", "harvard-cite-them-right": "Harvard", "american-medical-association": "AMA", "american-sociological-association": "ASA"};
const STYLE_KEY = "studyboard:cslStyles", ZKEY = "studyboard:zotero";
const ls = {get: (k, d) => { try { const v = JSON.parse(localStorage.getItem(k) || "null"); return v == null ? d : v; } catch (e) { return d; } }, set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }};
// Styles added from the Zotero Style Repository: {id: {title, fmt, xml, at}} on this device (the paper keeps the id, so another device fetches it again)
const extStyles = () => { const o = ls.get(STYLE_KEY, {}); return o && typeof o === "object" ? o : {}; };
const styleName = id => (BUILT.find(b => b[0] === id) || [])[1] || (extStyles()[id] || {}).title || id;
const styleShort = id => SHORT[id] || styleName(id);
const listOf = h => /list$/i.test(h) ? h : h + " list";
const styleFmt = id => BUILT_FMT[id] || (extStyles()[id] || {}).fmt || "author-date";
// a style from Zotero that only borrows a built-in style's rules (a journal's APA, say) is checked by that style's rules
const styleParent = id => BUILT_FMT[id] ? "" : (extStyles()[id] || {}).parent || "";
const XML = {};
let CSLlib = null, cpLoading = null;
function loadCiteproc(){
  if (CSLlib) return Promise.resolve(CSLlib);
  if (!cpLoading) cpLoading = (async () => {
    // citeproc.js is the package's unmodified CommonJS build: it declares a global CSL and then sets module.exports
    const had = Object.prototype.hasOwnProperty.call(window, "module"), prev = window.module;
    if (!had) window.module = {exports: {}};
    try { await loadScript(CP_JS, CP_SRI); } finally { if (!had) { try { delete window.module; } catch (e) { window.module = undefined; } } else window.module = prev; }
    if (!window.CSL || !window.CSL.Engine) throw new Error("citeproc didn't load");
    CSLlib = window.CSL; return CSLlib;
  })().catch(e => { cpLoading = null; throw e; });
  return cpLoading;
}
async function text(url, ms){
  const ac = typeof AbortController === "function" ? new AbortController() : null, tm = setTimeout(() => ac && ac.abort(), ms || 15000);
  try { const r = await fetch(url, {signal: ac ? ac.signal : undefined}); if (!r.ok) throw Object.assign(new Error("http " + r.status), {status: r.status}); return await r.text(); } finally { clearTimeout(tm); }
}
async function localeXml(lang){
  const l = lang === "en-GB" ? "en-GB" : "en-US";
  if (!XML["loc:" + l]) XML["loc:" + l] = await text(CP_DIR + `locales/locales-${l}.xml`);
  if (!XML["loc:en-US"]) XML["loc:en-US"] = await text(CP_DIR + "locales/locales-en-US.xml");
  return {"en-US": XML["loc:en-US"], "en-GB": XML["loc:en-GB"] || XML["loc:en-US"]};
}
async function styleXml(id){
  if (XML[id]) return XML[id];
  if (BUILT_FMT[id]) return (XML[id] = await text(CP_DIR + `styles/${id}.csl`));
  const ext = extStyles()[id]; if (ext && ext.xml) return (XML[id] = ext.xml);
  const x = await fetchZoteroStyle(id); return (XML[id] = x.xml);
}
// A style from the Zotero Style Repository; a dependent style uses its parent's rules (and keeps its own name)
async function fetchZoteroStyle(id){
  let xml = await text("https://www.zotero.org/styles/" + encodeURIComponent(id));
  const info = CITE.styleInfo(xml); if (!/<style\b/.test(xml)) throw new Error("That isn't a CSL style.");
  let parent = "";
  if (info.parent) { const pid = info.parent.replace(/^https?:\/\/www\.zotero\.org\/styles\//, ""); xml = BUILT_FMT[pid] ? await styleXml(pid) : await text("https://www.zotero.org/styles/" + encodeURIComponent(pid)); if (BUILT_FMT[pid]) parent = pid; }
  const rec = {title: info.title || id, fmt: CITE.styleInfo(xml).fmt || info.fmt || "author-date", xml, at: Date.now(), parent};
  const all = extStyles(); all[id] = rec;
  // keep the 8 most recent on this device
  Object.keys(all).sort((a, b) => (all[b].at || 0) - (all[a].at || 0)).slice(8).forEach(k => delete all[k]);
  if (!ls.set(STYLE_KEY, all)) { const one = {}; one[id] = rec; ls.set(STYLE_KEY, one); }
  return rec;
}
let ENG = null; // {key, eng}
const sig = (style, items, lang) => style + "|" + (lang || "") + "|" + JSON.stringify(items);
async function engineFor(style, items, lang){
  const key = sig(style, items, lang); if (ENG && ENG.key === key) return ENG.eng;
  const [lib, sx, loc] = await Promise.all([loadCiteproc(), styleXml(style), localeXml(lang)]);
  const eng = CITE.engine(lib, sx, loc, items, lang); ENG = {key, eng}; return eng;
}
const engNow = (style, items, lang) => ENG && ENG.key === sig(style, items, lang) ? ENG.eng : null;

/* ---------- Zotero (Web API v3) ---------- */
const zcred = () => { const z = ls.get(ZKEY, null); return z && z.key && z.userID ? z : null; };
async function zget(path, z, ms){
  const ac = typeof AbortController === "function" ? new AbortController() : null, tm = setTimeout(() => ac && ac.abort(), ms || 20000);
  try {
    const r = await fetch("https://api.zotero.org" + path, {signal: ac ? ac.signal : undefined, headers: {"Zotero-API-Version": "3", "Zotero-API-Key": z.key}});
    if (r.status === 403) throw Object.assign(new Error("Zotero turned the key down. Check that it can read your library, or make a new one."), {code: "auth"});
    if (r.status === 429) throw new Error("Zotero says to slow down. Try again in a minute.");
    if (!r.ok) throw new Error("Zotero didn't answer (" + r.status + "). Try again.");
    return {json: await r.json(), total: Number(r.headers.get("Total-Results")) || 0};
  } catch (e) { if (e && (e.code === "auth" || /Zotero/.test(e.message))) throw e; throw new Error("Couldn't reach Zotero. Check your connection."); }
  finally { clearTimeout(tm); }
}
async function zconnect(key){
  key = String(key || "").trim(); if (!/^[A-Za-z0-9]{20,40}$/.test(key)) throw new Error("A Zotero API key is 24 letters and numbers. Make one at zotero.org/settings/keys.");
  const {json} = await zget("/keys/" + encodeURIComponent(key), {key});
  if (!json || !json.userID) throw new Error("Zotero didn't recognise that key.");
  const groups = [];
  try { const g = await zget(`/users/${json.userID}/groups?limit=100`, {key}); (g.json || []).forEach(x => groups.push({id: String(x.id), name: (x.data && x.data.name) || "Group " + x.id})); } catch (e) {}
  const z = {key, userID: String(json.userID), user: json.username || "", groups, at: Date.now()};
  ls.set(ZKEY, z); return z;
}
const zlibPath = lib => lib && lib !== "user" ? `/groups/${encodeURIComponent(lib)}` : `/users/${encodeURIComponent((zcred() || {}).userID)}`;
const zItem = (x, lib) => { const c = CITE.clean(Object.assign({}, x.csljson || {}, {id: ""})); c.zkey = x.key; c.zlib = lib || "user"; return c; };

/* ---------- The Studio ---------- */
// Beta: a small β after the title until the owner says it's done (set BETA to false to take it off)
const BETA = true;
const betaHead = html => BETA ? html.replace(/(<span class="sh-kick">[^<]*)(<\/span>)/, '$1<span class="sb-beta" title="Beta: still being improved">Beta</span>$2').replace(/(<span class="g2-ring sh-ring"[^>]*>)/, '$1<span class="sb-beta sb-beta-alt" aria-hidden="true">Beta</span>') : html;
const PRO_WHY = "Writing Studio is part of Studyboard Pro: a reference manager for every paper, with Zotero's citation engine and thousands of styles, quotes from your highlights, an outline and a citation check.";
const ICON = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 19.5V5a2 2 0 0 1 2-2h12v15H6a2 2 0 0 0-2 1.5zM4 19.5A2 2 0 0 0 6 21h12"/><path d="M9 7h6M9 11h4"/></svg>';
const WRITING = /\b(essay|paper|report|presentation|thesis|dissertation|draft|write[- ]?up|reflection|proposal|review|portfolio|speech|article|memo|brief|research|annotated|bibliography|literature)\b/i;
// a paper that already has something in Writing Studio: sources, quotes or a saved draft
const hasData = t => !!(t && t.ws && typeof t.ws === "object" && ((Array.isArray(t.ws.src) && t.ws.src.length) || (Array.isArray(t.ws.q) && t.ws.q.length) || (t.ws.draft && t.ws.draft.t)));
const eligible = t => !!t && !t.prepFor && !t.breakdownOf && (hasData(t) || (t.status !== "done" && (["Assignment", "Project", "Lab"].includes(t.type) || (t.type === "Other" && WRITING.test(String(t.title || ""))))));
// The draft kept on the paper (t.ws.draft): its text (capped), where it came from and when; and the last check (t.ws.chk): when, on which version of
// the draft, and what it found (the issues' titles, so the next check can say what changed)
const MAX_SRC = 150, MAX_Q = 300, MAX_SEC = 30, MAX_DRAFT = 60000;
const W = {tid: "", tab: "", view: "", edit: null, paste: "", res: null, busy: "", err: "", el: null, hlPick: null, inp: "", note: "", z: null, imp: null, find: null, found: null, show: null, diff: null, also: null, hub: "", pick: null};
// the linked document (a Google Doc or a Word file in OneDrive): which one, and its name and address to open it
const ldNorm = l => l && typeof l === "object" && (l.p === "google" || l.p === "microsoft" || l.p === "file") && typeof l.id === "string" && /^[\w!.-]{1,200}$/.test(l.id)
  ? {p: l.p, id: l.id, drive: typeof l.drive === "string" && /^[\w!.-]{1,200}$/.test(l.drive) ? l.drive : "", name: String(l.name || "").slice(0, 200), url: /^https:\/\//.test(String(l.url || "")) ? String(l.url).slice(0, 600) : "", big: !!l.big} : null;
function wsOf(t){
  const w = t && t.ws && typeof t.ws === "object" ? t.ws : {};
  const d = w.draft && typeof w.draft === "object" && typeof w.draft.t === "string" && w.draft.t ? w.draft : null, c = w.chk && typeof w.chk === "object" ? w.chk : null;
  return {style: typeof w.style === "string" && w.style ? w.style : "", lang: w.lang === "en-GB" ? "en-GB" : "", src: Array.isArray(w.src) ? w.src.filter(s => s && s.id) : [], q: Array.isArray(w.q) ? w.q.filter(q => q && q.id) : [], out: Array.isArray(w.out) ? w.out.filter(s => s && s.id) : [],
    draft: d ? {t: d.t, from: String(d.from || ""), fid: d.fid || "", nid: d.nid || "", r: d.r || "", at: Number(d.at) || 0, h: d.h || CITE.hash(d.t), fx: Number(d.fx) || 0, ld: !!d.ld} : null,
    ld: ldNorm(w.ld),
    chk: c ? {at: Number(c.at) || 0, h: c.h || "", keys: Array.isArray(c.keys) ? c.keys.slice(0, 60) : [], err: Number(c.err) || 0, warn: Number(c.warn) || 0, cited: Number(c.cited) || 0, total: Number(c.total) || 0} : null,
    tk: Array.isArray(w.tk) ? w.tk.slice(0, 20) : []};
}
const makeDraft = (text, o) => { const t = CITE.capDraft(text, MAX_DRAFT); return Object.assign({t, at: Date.now(), h: CITE.hash(t)}, o || {}); };
function reqText(t){
  const parts = [t.notes || ""];
  ["cv", "bs", "bb", "md", "sg", "gc"].forEach(k => { const r = t[k] && t[k].rub; if (r && Array.isArray(r.cr)) parts.push(r.cr.map(c => `${c.t} ${c.d || ""}`).join("\n")); if (t[k] && t[k].desc) parts.push(String(t[k].desc)); });
  return parts.join("\n");
}
const styleOf = (t, w) => w.style || CITE.rules(reqText(t)).style || "apa";
function save(t, w, label, extra, more){
  const cur = state.tasks[t.id]; if (!cur) return;
  const ws = {style: w.style, lang: w.lang || undefined, src: w.src.slice(0, MAX_SRC), q: w.q.slice(0, MAX_Q), out: w.out.slice(0, MAX_SEC), v: 2};
  if (w.draft) ws.draft = {t: w.draft.t, from: w.draft.from || "", fid: w.draft.fid || undefined, nid: w.draft.nid || undefined, r: w.draft.r || undefined, at: w.draft.at, h: w.draft.h, fx: w.draft.fx || undefined, ld: w.draft.ld ? 1 : undefined};
  if (w.ld) ws.ld = w.ld;
  if (w.chk) ws.chk = w.chk;
  const changes = [{kind: "task", id: t.id, after: Object.assign(clone(cur), {ws})}].concat(more || []);
  // a Break It Down step whose part is now clearly met is ticked done, in the same change (one Undo takes both back)
  const ticks = stepTicks(cur, w);
  if (ticks.length) {
    ws.tk = w.tk.concat(ticks.map(x => x.id)).slice(-20);
    ticks.forEach(x => { const n = clone(x); n.status = "done"; n.doneAt = Date.now(); n.pct = 100; if (typeof nextOrder === "function") n.order = nextOrder("done"); changes.push({kind: "task", id: x.id, after: n}); });
    label = `${label ? label + ". " : ""}Step done: ${ticks.map(x => x.title).join(", ")}`;
  } else if (w.tk.length) ws.tk = w.tk;
  applyChanges(changes, label === undefined ? null : label, extra);
}
// Which of a paper's steps are met: only the clearly measurable ones. A "find N sources" step once the paper has N sources, and a step that's only
// about the citations ("Check the citations", "Format the bibliography") once the saved draft's latest check found nothing to fix.
// Quotes, the outline, drafting, proofreading and handing in are never ticked here: only the student knows when those are done.
function stepTicks(parent, w){
  if (!parent || parent.status === "done" || !eligible(parent)) return [];
  return allTasks().filter(x => x.breakdownOf === parent.id && x.status !== "done" && !w.tk.includes(x.id)).filter(x => stepMet(x, parent, w));
}
function stepMet(x, parent, w){
  const m = stepOf(x, parent, w); if (!m) return false;
  if (m.tab === "sources") return m.want > 0 && w.src.length >= m.want;
  if (m.tab === "check") return !/\b(submit|hand in|turn in|upload|proofread|final|write|draft|revise|edit|polish)\b/i.test(String(x.title || "")) && /\b(citations?|bibliograph\w*|references?|works cited)\b/i.test(String(x.title || "")) && !!(w.draft && w.chk && w.chk.h === w.draft.h && !w.chk.err);
  return false;
}
const shown = () => !!W.el && dlg.open && dlg.contains(W.el);
const isPdfFile = f => !!f && f.kind === "file" && Array.isArray(f.revs) && f.revs.length && /\.pdf$/i.test((f.revs[f.revs.length - 1] || {}).name || f.name || "");
const hlOf = f => (Array.isArray(f && f.hl) ? f.hl : []).filter(h => h && h.id && h.t && !h.m);
const typeName = ty => (CITE.TYPES[ty] || CITE.TYPES.document)[0];
const srcLabel = s => { const a = CITE.familyOf((s.author || s.editor || [])[0]); return `${a ? a + ((s.author || []).length > 1 ? " et al." : "") + ", " : ""}${CITE.yearOf(s) || "n.d."}: ${String(s.title || "Untitled").slice(0, 60)}`; };

/* Formatting through the engine (or the stand-in until it's ready) */
function fmtState(t, w){
  const st = styleOf(t, w), eng = engNow(st, w.src, w.lang), key = sig(st, w.src, w.lang);
  // one try per style and list: a failure shows the stand-in and a note, and isn't retried until the style or the sources change
  if (!eng && W.engTry !== key) {
    W.engTry = key;
    engineFor(st, w.src, w.lang).then(() => { W.engErr = ""; if (shown() && W.tid === t.id) draw(); }).catch(e => { console.warn("citeproc", e); W.engErr = st; if (shown() && W.tid === t.id) draw(); });
  }
  return {st, eng};
}
function bibOf(t, w){
  const {st, eng} = fmtState(t, w);
  if (eng) { try { const b = eng.bib(); return {st, ready: true, hang: b.hang, entries: b.entries.map(e => ({id: e.id, runs: e.runs}))}; } catch (e) { console.warn("bibliography", e); } }
  return {st, ready: false, hang: true, entries: w.src.slice().sort((a, b) => srcLabel(a).localeCompare(srcLabel(b))).map(s => ({id: s.id, runs: CITE.plain(s)}))};
}
function citeOf(t, w, sid, page){
  const {eng} = fmtState(t, w), s = w.src.find(x => x.id === sid); if (!s) return [];
  if (eng) { try { return eng.cite(sid, page); } catch (e) { console.warn("citation", e); } }
  return [[`(${CITE.familyOf((s.author || [])[0]) || String(s.title || "").split(" ").slice(0, 3).join(" ")}, ${CITE.yearOf(s) || "n.d."}${page ? ", p. " + page : ""})`, {}]];
}

/* A milestone of a broken-down paper opens its paper's Studio on the tab for that step, with how far along it is */
const STEP_TABS = [[/\b(find|collect|gather|search|choose)\b.*\bsources?\b|\bsources?\b.*\b(find|collect)|\bresearch and (gather|plan)/i, "sources"], [/\b(take notes|annotate|read and)\b/i, "quotes"],
  [/\boutline\b|\bdraft\b|\bwrite the\b|\brevise\b/i, "outline"], [/\bproofread|\bcitations?\b|\bbibliograph|\bformat\b/i, "check"]];
function stepOf(t, parent, w){
  const hit = STEP_TABS.find(([re]) => re.test(String(t.title || ""))); if (!hit) return null;
  const want = Number((/\b(\d{1,2})\s+(?:\w+\s+)?sources\b/i.exec(t.title) || [])[1]) || CITE.rules(reqText(parent)).min || 0;
  return {tab: hit[1], want};
}
function milestoneOf(t){
  if (!t || !t.breakdownOf) return null;
  const parent = state.tasks[t.breakdownOf]; if (!parent || parent.status === "done" || !eligible(parent)) return null;
  const w = wsOf(parent), s = stepOf(t, parent, w); if (!s) return null;
  const {tab, want} = s, c = w.chk && w.draft && w.chk.h === w.draft.h ? w.chk : null;
  const label = tab === "sources" ? (want ? `${Math.min(w.src.length, 99)} of ${want} sources` : `${w.src.length} source${w.src.length === 1 ? "" : "s"}`)
    : tab === "quotes" ? `${w.q.length} quote${w.q.length === 1 ? "" : "s"}` : tab === "outline" ? (w.out.length ? "Outline" : "Start the outline") : c ? (c.err ? `${c.err} to fix` : "Citations checked") : "Check citations";
  return {parent, tab, label, done: tab === "sources" ? want > 0 && w.src.length >= want : tab === "check" ? !!c && !c.err : false};
}
function taskBtn(t){
  if (!t || inPreview() || !window.SBPRO) return "";
  const pro = SBPRO.locked() ? ' <span class="pro-badge">PRO</span>' : "";
  const m = milestoneOf(t);
  // in a task's sheet the row is tight: the short label there (like Rubric Check's), the full name for the tooltip and screen readers
  if (m) return `<button type="button" class="btn ws-btn ws-ms${m.done ? " is-met" : ""}" data-act="ws-open" data-id="${esc(m.parent.id)}" data-ws-to="${m.tab}" title="Open ${esc(m.parent.title)} in Writing Studio" aria-label="Writing Studio: ${esc(m.label)}">${ICON}<span class="ws-long">Writing Studio</span><span class="ws-step">${m.done ? "✓ " : ""}${esc(m.label)}</span>${pro}</button>`;
  if (!eligible(t)) return "";
  return `<button type="button" class="btn ws-btn" data-act="ws-open" data-id="${esc(t.id)}" title="Writing Studio" aria-label="Writing Studio">${ICON}<span class="ws-long">Writing Studio</span><span class="ws-short">Writing</span>${pro}</button>`;
}
// A small chip on Board cards and Do This Next, only for a paper that already has something in Writing Studio (cards stay uncluttered)
function chip(t){
  if (!t || inPreview() || !window.SBPRO || t.status === "done" || !hasData(t) || !eligible(t)) return "";
  const w = wsOf(t), c = w.chk && w.draft && w.chk.h === w.draft.h ? w.chk : null;
  const tip = [`${w.src.length} source${w.src.length === 1 ? "" : "s"}`, `${w.q.length} quote${w.q.length === 1 ? "" : "s"}`, c ? (c.err ? `${c.err} to fix` : "citations checked") : ""].filter(Boolean).join(" · ");
  return `<button type="button" class="ws-chip" data-act="ws-open" data-id="${esc(t.id)}" title="Writing Studio: ${esc(tip)}" aria-label="Open ${esc(t.title)} in Writing Studio (${esc(tip)})">${ICON}<span>Writing Studio</span>${c && c.err ? `<b class="ws-chip-n">${c.err}</b>` : ""}</button>`;
}

/* From the PDF reader: which papers a quote from this PDF could go to, best first. While the reader is open for one paper (from its
   Writing Studio, or a PDF that's a source of just one open paper), that paper only, so a highlight goes straight in. */
function papersFor(fid){
  const f = state.files[fid]; if (!f) return [];
  const x = readerTarget(fid); if (x) return [x.t];
  const today = todayISO();
  return allTasks().filter(t => eligible(t) && t.status !== "done" && (!t.due || t.due >= addDays(today, -3))).map(t => {
    const w = wsOf(t), score = w.src.some(s => s.fid === fid) ? 3 : (f.taskIds || []).includes(t.id) ? 2 : f.courseId && t.courseId === f.courseId ? 1 : 0;
    return {t, score};
  }).filter(x => x.score > 0 || !f.courseId).sort((a, b) => b.score - a.score || String(a.t.due || "9").localeCompare(String(b.t.due || "9"))).slice(0, 6).map(x => x.t);
}
// the paper a highlight is already quoted in
const quotedIn = (fid, hid) => allTasks().find(t => t.ws && Array.isArray(t.ws.q) && t.ws.q.some(q => q && q.hl === hid && q.fid === fid)) || null;
const fileTitle = f => String(f.name || "").replace(/\.[a-z0-9]{2,5}$/i, "").replace(/_+/g, " ").trim() || "Untitled";
// fills in a source made from a PDF's name, from the DOI in its text (in the background; nothing else is touched)
async function enrich(tid, sid, fid, getText){
  let txt = "";
  try { if (getText) txt = String(await getText() || ""); } catch (e) { txt = ""; }
  if (!/\b10\.\d{4,9}\//.test(txt)) { try { txt += window.SBFILETEXT ? "\n" + String(await SBFILETEXT(fid, 12000) || "") : ""; } catch (e) {} }
  const id = CITE.parseId((/\b10\.\d{4,9}\/[^\s"<>]+/.exec(txt) || /arxiv:\s*\d{4}\.\d{4,5}/i.exec(txt) || [""])[0]); if (!id) return;
  let rec = null; try { rec = await lookup(id); } catch (e) { return; }
  const t = state.tasks[tid]; if (!t) return;
  const w = wsOf(t), cur = w.src.find(s => s.id === sid), f = state.files[fid];
  if (!cur || cur.author || (f && cur.title !== fileTitle(f))) return; // the student has filled it in themselves
  w.src = w.src.map(s => s.id === sid ? Object.assign(CITE.clean(rec), {id: sid, fid}) : s);
  save(t, w, null); if (shown() && W.tid === tid) draw();
}
function addQuote(tid, fid, h, o){
  const t = state.tasks[tid], f = state.files[fid]; if (!t || !f || !h || !h.t) return false;
  if (window.SBPRO && SBPRO.locked()) { PLAN.openSheet(PRO_WHY); return false; }
  const w = wsOf(t); w.style = w.style || styleOf(t, w);
  if (w.q.some(q => q.hl === h.id && q.fid === fid)) { toast(`Already in ${t.title}`, null, {label: "Open", fn: () => open(tid, "quotes")}); return false; }
  if (w.q.length >= MAX_Q) { toast("This paper has as many quotes as it can hold."); return false; }
  let src = w.src.find(s => s.fid === fid), fresh = false;
  if (!src) { src = Object.assign(CITE.clean({type: "document", title: fileTitle(f)}), {id: uid(), fid}); w.src.push(src); fresh = true; }
  w.q.push({id: uid(), sid: src.id, t: String(h.t).slice(0, 1200), p: String(h.p || ""), fid, hl: h.id, sec: "", at: Date.now()});
  // one message, with Undo and a way into the Studio
  save(t, w, `Quote added to ${t.title}${fresh ? ". This PDF is now one of its sources." : ""}`, {label: "Open", fn: () => { if (dlg.open) dlg.close(); open(tid, "quotes"); }});
  if (fresh) enrich(tid, src.id, fid, o && o.text);
  if (RD && RD.tid === tid && RD.fid === fid) { RD.n++; const el = document.getElementById("pdrWsN"); if (el) el.textContent = `${RD.n} quote${RD.n === 1 ? "" : "s"} added`; }
  return true;
}
function readerBtn(fid, h){
  if (!window.SBPRO || inPreview()) return "";
  if (h) { const t = quotedIn(fid, h.id); if (t) return `<button type="button" class="btn small" data-act="pdr-paper" data-id="${esc(h.id)}" title="${esc(t.title)}">In Paper ✓</button>`; }
  if (!papersFor(fid).length) return "";
  const one = readerTarget(fid);
  return `<button type="button" class="btn small${one ? " primary" : ""}" data-act="${h ? "pdr-paper" : "pdr-sel-paper"}"${h ? ` data-id="${esc(h.id)}"` : ""}${one ? ` title="Add it to ${esc(one.t.title)}"` : ""}>${one ? "Add as Quote" : "Add to Paper"}</button>`;
}

/* Highlighting from inside Writing Studio: the reader opens for one paper; each new highlight offers Add as Quote there and then,
   and closing the reader comes back to the paper's Quotes. A PDF that's a source of exactly one open paper gets the same bar from anywhere. */
let RD = null; // {tid, fid, n, shown}
function readerTarget(fid){
  if (RD && RD.fid === fid && state.tasks[RD.tid]) return {t: state.tasks[RD.tid], studio: true, n: RD.n};
  const ps = allTasks().filter(t => t.status !== "done" && eligible(t) && t.ws && Array.isArray(t.ws.src) && t.ws.src.some(s => s && s.fid === fid));
  return ps.length === 1 ? {t: ps[0], studio: false, n: 0} : null;
}
function readerBar(fid){
  if (!window.SBPRO || SBPRO.locked() || inPreview()) return "";
  const x = readerTarget(fid); if (!x) return "";
  if (RD && RD.fid === fid) RD.shown = true;
  return `<div class="pdr-ws" role="note">${ICON}<span class="pdr-ws-t">Writing Studio: <b>${esc(x.t.title)}</b></span><span class="mini" id="pdrWsN">${x.n ? `${x.n} quote${x.n === 1 ? "" : "s"} added` : "Highlight a passage to add it as a quote"}</span><span class="spacer"></span><button type="button" class="btn small" data-act="pdr-ws-back" data-id="${esc(x.t.id)}">${x.studio ? "Back to Writing Studio" : "Open"}</button></div>`;
}
// What the reader shows by a highlight just made, when it can go straight to a paper
function hlPop(fid, h){
  if (!h || h.m || !window.SBPRO || SBPRO.locked() || quotedIn(fid, h.id)) return "";
  const x = readerTarget(fid); if (!x) return "";
  return `<span class="mini pdr-pop-lbl">Highlighted.</span><button type="button" class="btn small primary" data-act="pdr-paper-to" data-id="${esc(h.id)}" data-t="${esc(x.t.id)}" title="Add it to ${esc(x.t.title)}">Add as Quote</button>`;
}
function openReader(tid, fid, page){
  if (!state.files[fid] || !window.SBPRO || !SBPRO.openLink) return;
  RD = {tid, fid, n: 0, shown: false};
  SBPRO.openLink({kind: "file", id: fid}, Number(page) || 0);
}
// back from the reader: to the paper's Quotes, with what was added
function fromReader(tid){
  const was = RD; RD = null;
  const id = tid || (was && was.tid); if (!id || !state.tasks[id]) return;
  setTimeout(() => { if (dlg.open && !dlg.querySelector(".pdr-sheet")) return; open(id, "quotes"); if (was && was.n) W.okMsg = `${was.n} quote${was.n === 1 ? "" : "s"} added from ${state.files[was.fid] ? state.files[was.fid].name : "the PDF"}.`; if (shown()) draw(); }, 0);
}
dlg.addEventListener("close", () => {
  if (!RD || !RD.shown || dlg.open || !dlg.querySelector(".pdr-sheet")) return;
  fromReader(RD.tid);
});

function open(id, tab){
  const t = state.tasks[id]; if (!t) return;
  if (window.SBPRO && SBPRO.locked()) { PLAN.openSheet(PRO_WHY); return; }
  RD = null;
  if (W.tid !== id || W.hub) Object.assign(W, {tid: id, hub: "", paste: "", res: null, tab: "", found: null, show: null, diff: null, also: null, offerOff: false, okMsg: "", redo: false, attachFor: ""});
  Object.assign(W, {view: "", edit: null, err: "", busy: "", hlPick: null, imp: null, find: null, pick: null});
  // Check comes first, and feeds the other tabs; a paper with sources but no draft yet opens on its Sources
  if (tab) W.tab = tab;
  else W.tab = "doc";
  draw(true);
}

/* Adding sources */
async function getJson(url, headers, ms){
  const ac = typeof AbortController === "function" ? new AbortController() : null, tm = setTimeout(() => ac && ac.abort(), ms || 15000);
  try { const r = await fetch(url, {signal: ac ? ac.signal : undefined, headers: headers || {accept: "application/json"}}); if (!r.ok) throw Object.assign(new Error("http"), {status: r.status}); return await r.json(); }
  finally { clearTimeout(tm); }
}
async function lookup(id){
  if (id.kind === "doi") {
    // content negotiation at doi.org answers for Crossref, DataCite (arXiv, Zenodo, datasets) and mEDRA DOIs alike
    let j = null, miss = false;
    try { j = await getJson("https://doi.org/" + encodeURI(id.v), {accept: "application/vnd.citationstyles.csl+json"}); } catch (e) { miss = e && e.status === 404; }
    if (!j || !j.title) { try { j = await getJson(`https://api.crossref.org/works/${encodeURIComponent(id.v)}/transform/application/vnd.citationstyles.csl+json`); } catch (e) { if (miss || (e && e.status === 404)) throw new Error("No one knows that DOI. Check it, or add the source by hand."); throw new Error("Couldn't look up the DOI. Check your connection, or add the source by hand."); } }
    const s = CITE.clean(Object.assign({}, j, {id: ""})); if (s.title) return s;
    throw new Error("That DOI has no details to cite. Add the source by hand.");
  }
  if (id.kind === "isbn") {
    let j = null; try { j = await getJson(`https://openlibrary.org/api/books?bibkeys=ISBN:${id.v}&format=json&jscmd=data`); } catch (e) { throw new Error("Couldn't reach Open Library. Check your connection, or add the book by hand."); }
    const s = CITE.fromOpenLibrary(j && j["ISBN:" + id.v], id.v); if (s) return s;
    throw new Error("Open Library doesn't know that ISBN. Add the book by hand.");
  }
  let s = null;
  try { const r = await fetch(id.v, {mode: "cors"}); if (r.ok && /html/i.test(r.headers.get("content-type") || "")) s = CITE.fromHtml(await r.text(), id.v); } catch (e) { s = null; }
  if (s && s.DOI) { try { const d = await lookup({kind: "doi", v: s.DOI}); if (!d.URL) d.URL = id.v; return d; } catch (e) {} }
  const acc = CITE.parseDate(todayISO());
  if (s && s.title) return Object.assign(s, {accessed: acc});
  return Object.assign(CITE.clean({type: "webpage", URL: id.v, "container-title": CITE.hostOf(id.v), accessed: acc}), {partial: true});
}
// Adds items, skipping duplicates; returns {added, dup}
function addItems(t, items, label){
  const cur = state.tasks[t.id], w = wsOf(cur), ids = []; let dup = 0;
  items.forEach(x => { if (w.src.length >= MAX_SRC) return; if (CITE.dupOf(x, w.src)) { dup++; return; } const id = uid(); w.src.push(Object.assign(CITE.clean(x), {id})); ids.push(id); });
  if (ids.length) { w.style = w.style || styleOf(cur, w); save(cur, w, label || `Added ${ids.length} source${ids.length === 1 ? "" : "s"}`); if (W.tid === t.id) { W.also = otherPapers(cur).length ? {ids} : null; W.dOffer = w.draft ? ids.slice() : null; } }
  return {added: ids.length, dup, ids};
}
// Other open papers in the same course, for "Also Add to Another Paper?"
const otherPapers = t => !t || !t.courseId ? [] : allTasks().filter(x => x.id !== t.id && x.courseId === t.courseId && x.status !== "done" && eligible(x) && (!x.due || x.due >= todayISO())).sort((a, b) => String(a.due || "9").localeCompare(String(b.due || "9"))).slice(0, 3);
function alsoAdd(from, to, ids){
  const a = state.tasks[from], b = state.tasks[to]; if (!a || !b) return;
  const items = wsOf(a).src.filter(s => ids.includes(s.id)).map(s => { const c = Object.assign({}, s); delete c.id; return c; });
  const r = addItems(b, items, `Added ${items.length === 1 ? "it" : items.length + " sources"} to ${b.title}`);
  if (!r.added) toast(`Already in ${b.title}`);
}
async function addFromInput(t, raw){
  const id = CITE.parseId(raw);
  if (!id) { W.err = "That isn't a DOI, an arXiv ID, an ISBN or a web address. Use Add by Hand, or Import for a BibTeX or RIS file."; draw(); return; }
  W.busy = "add"; W.err = ""; draw();
  try {
    const s = await lookup(id), w = wsOf(state.tasks[t.id]), d = CITE.dupOf(s, w.src);
    if (d) { W.err = "That source is already in your list."; }
    // a page that doesn't share its details opens as a new source to fill in: it's only added on Save, so Cancel leaves nothing behind
    else if (s.partial) { delete s.partial; W.inp = ""; W.edit = "new"; W.form = s; W.note = "This site doesn't share its details, so fill in the title, author and date from the page, then Save."; }
    else { addItems(t, [s], `Added ${s.title ? "“" + String(s.title).slice(0, 40) + "”" : "a source"}`); W.inp = ""; }
  } catch (e) { W.err = (e && e.message) || "Couldn't look that up. Add the source by hand."; }
  W.busy = ""; if (shown()) draw();
}
async function addFromFile(t, fid){
  const f = state.files[fid]; if (!f) return null;
  const have = wsOf(state.tasks[t.id]).src.find(s => s.fid === fid); if (have) return have;
  let rec = null, txt = "";
  try { txt = window.SBFILETEXT ? String(await SBFILETEXT(fid, 12000) || "") : ""; } catch (e) { txt = ""; }
  const id = CITE.parseId((/\b10\.\d{4,9}\/[^\s"<>]+/.exec(txt) || /arxiv:\s*\d{4}\.\d{4,5}/i.exec(txt) || [""])[0]);
  if (id) { try { rec = await lookup(id); } catch (e) { rec = null; } }
  if (!rec) rec = CITE.clean({type: "document", title: String(f.name || "").replace(/\.[a-z0-9]{2,5}$/i, "").replace(/_+/g, " ")});
  rec.fid = fid;
  const w = wsOf(state.tasks[t.id]), d = CITE.dupOf(rec, w.src);
  if (d) { if (!d.fid) { w.src = w.src.map(x => x.id === d.id ? Object.assign({}, x, {fid}) : x); save(state.tasks[t.id], w, null); } return Object.assign({}, d, {fid}); }
  addItems(t, [rec], `Added ${f.name} as a source`);
  return wsOf(state.tasks[t.id]).src.find(s => s.fid === fid) || null;
}
// My Library: every source in every paper, once each
function library(exceptTid){
  const out = [];
  allTasks().forEach(x => { if (x.id === exceptTid || !x.ws || !Array.isArray(x.ws.src)) return; x.ws.src.forEach(s => { if (s && s.id && !CITE.dupOf(s, out)) out.push(Object.assign({}, s, {from: x.title})); }); });
  return out.sort((a, b) => srcLabel(a).localeCompare(srcLabel(b)));
}

/* ---------- Drawing ---------- */
const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;
const cut = (s, n) => (s = String(s || "")).length > n ? s.slice(0, n - 1) + "…" : s;
const wordsIn = s => (String(s || "").match(/\S+/g) || []).length;
const ago = ms => { const d = Math.floor((Date.now() - ms) / 864e5); return !ms ? "" : d <= 0 ? "today" : d === 1 ? "yesterday" : d < 14 ? `${d} days ago` : "on " + new Date(ms).toLocaleDateString(undefined, {month: "short", day: "numeric"}); };
const normText = s => String(s || "").toLowerCase().replace(/[‘’“”"']/g, "").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
const TABS = ["doc", "check", "sources", "quotes", "outline", "rubric"];
function tabsHtml(w){
  const tb = (k, l, n) => `<button type="button" role="tab" class="ws-tab" data-ws-tab="${k}" aria-selected="${W.tab === k}" ${W.tab === k ? "" : 'tabindex="-1"'}>${l}${n != null ? ` <span class="ws-n">${n}</span>` : ""}</button>`;
  return `<div class="ws-tabs" role="tablist" aria-label="Writing Studio">${tb("doc", "My Doc")}${tb("check", "Check")}${tb("sources", "Sources", w.src.length)}${tb("quotes", "Quotes", w.q.length)}${tb("outline", "Outline")}${window.SBRUBRIC ? tb("rubric", "Rubric") : ""}</div>`;
}
function styleSel(st){
  const ext = extStyles(), ids = BUILT.map(b => b[0]).concat(Object.keys(ext).filter(k => !BUILT_FMT[k]));
  if (!ids.includes(st)) ids.push(st);
  return `<label class="ws-style"><span class="mini">Style</span><select data-ws-style aria-label="Citation style">${ids.map(k => `<option value="${esc(k)}" ${k === st ? "selected" : ""}>${esc(styleName(k))}</option>`).join("")}<option value="__find">More styles…</option></select></label>`;
}
const citeHtml = rs => CITE.runsHtml(rs);
// What the saved draft says about each source and quote (cited in it, used in it), worked out once per draft, list and style
function usage(t, w){
  const st = styleOf(t, w), key = [w.draft ? w.draft.h : "", st, !!engNow(st, w.src, w.lang), w.src.map(s => s.id + ":" + (s.title || "") + ":" + CITE.familyOf((s.author || s.editor || [])[0])).join(",")].join("|");
  if (W.use && W.use.key === key && W.use.tid === t.id) return W.use;
  const res = w.draft ? runCheck(t, w, w.draft.t) : null, dn = w.draft ? normText(w.draft.t) : "";
  W.use = {key, tid: t.id, res, cited: new Set(res ? res.citedIds : []), used: q => !!dn && dn.includes(normText(q.t).slice(0, 80))};
  return W.use;
}
// The strip at the top of every tab: how far along the paper is, each part a way to its tab
function stripHtml(t, w){
  // the Check tab shows the saved draft's results live, so the strip counts the same live results (the saved check could be
  // missing or older: a draft kept but never checked showed "not checked yet" beside its results)
  const placed = w.q.filter(q => q.sec && w.out.some(s => s.id === q.sec)).length, r = w.draft ? usage(t, w).res : null;
  const c = r ? {err: r.issues.filter(x => x.k === "err").length, warn: r.issues.filter(x => x.k === "warn").length} : null, stale = false;
  const chk = !w.draft ? "no draft yet" : c.err ? `check: ${c.err} to fix` : c.warn ? `check: ${c.warn} to look at` : "check: all good ✓";
  const b = (tab, txt, cls) => `<button type="button" class="ws-sp${cls ? " " + cls : ""}${W.tab === tab ? " is-here" : ""}" data-ws-go="${tab}">${txt}</button>`;
  return `<nav class="ws-strip" aria-label="This paper so far">${b("sources", plural(w.src.length, "source"))}<span class="ws-dot" aria-hidden="true"> · </span>${b("quotes", plural(w.q.length, "quote"))}<span class="ws-dot" aria-hidden="true"> · </span>${b("outline", `${placed} placed`)}<span class="ws-dot" aria-hidden="true"> · </span>${b("check", chk, c && !stale && c.err ? "bad" : c && !stale && !c.err && !c.warn ? "good" : "")}</nav>`;
}
function goalHtml(t, w){
  const r = CITE.rules(reqText(t)); if (!r.min) return "";
  const n = w.src.length, met = n >= r.min;
  return `<div class="ws-goal${met ? " met" : ""}"><span class="mini"><b>${Math.min(n, 99)} of ${r.min}</b> ${r.scholarly ? "scholarly " : ""}sources the assignment asks for${met ? " ✓" : ""}</span><span class="ws-meter" role="progressbar" aria-label="Sources" aria-valuemin="0" aria-valuemax="${r.min}" aria-valuenow="${Math.min(n, r.min)}"><i style="width:${Math.min(100, Math.round(n / r.min * 100))}%"></i></span></div>`;
}
// right after adding a source to a paper with a draft: one tap puts it in the draft's list too (never on its own: a list entry wants a citation)
function draftOfferHtml(w, inList){
  const ids = (W.dOffer || []).filter(id => w.src.some(s => s.id === id) && !(inList && inList.has(id)));
  if (!w.draft || !ids.length || !inList) return "";
  return `<div class="ws-offer" role="note"><span>Also add ${ids.length === 1 ? "it" : "them"} to your draft's ${esc(listOf(CITE.headingOf(styleOf(state.tasks[W.tid], w), styleFmt(styleOf(state.tasks[W.tid], w)))))}?</span><span class="ws-row"><button type="button" class="btn small primary" data-ws-doffer="${esc(ids.join(","))}" ${W.busy ? "disabled" : ""}>Add ${ids.length === 1 ? "It" : "Them"}</button><button type="button" class="link-btn" data-ws-doffno>Not Now</button></span></div>`;
}
function alsoHtml(t){
  if (!W.also || !W.also.ids.length) return "";
  const ps = otherPapers(t); if (!ps.length) return "";
  return `<div class="ws-also" role="status"><span class="mini">Also add ${W.also.ids.length === 1 ? "it" : "them"} to another paper?</span>${ps.map(p => `<button type="button" class="btn small" data-ws-also="${esc(p.id)}">${esc(cut(p.title, 34))}</button>`).join("")}<button type="button" class="link-btn" data-ws-alsono>No Thanks</button></div>`;
}
function sourcesHtml(t, w){
  const files = Object.values(state.files).filter(f => isPdfFile(f) && (f.taskIds.includes(t.id) || (t.courseId && f.courseId === t.courseId)) && !w.src.some(s => s.fid === f.id)).slice(0, 40);
  const B = bibOf(t, w), st = B.st, z = zcred(), lib = library(t.id).filter(s => !CITE.dupOf(s, w.src)).length, U = usage(t, w);
  const heading = CITE.headingOf(st, styleFmt(st));
  // which sources the draft's list already has (so each other one can be added to it on its own)
  const inList = w.draft && B.ready ? (() => { try { return new Set(CITE.refAdd(w.draft.t, w.src, refsMap(t, w), {num: styleFmt(st) === "numeric"}).already); } catch (e) { return null; } })() : null;
  const useTxt = s => { const n = w.q.filter(q => q.sid === s.id).length; return [n ? `Quoted ${n === 1 ? "once" : n + " times"}` : "No quotes yet", w.draft ? (U.cited.has(s.id) ? '<span class="ws-yes">Cited in draft ✓</span>' : '<span class="ws-no">Not cited yet</span>') : "", inList ? (inList.has(s.id) ? '<span class="ws-yes">In your list ✓</span>' : '<span class="ws-no">Not in your list</span>') : ""].filter(Boolean).join(" · "); };
  return `${goalHtml(t, w)}<div class="ws-add"><label class="f ws-grow"><span class="lh">Add a source</span><input type="text" data-ws-in placeholder="Paste a DOI, arXiv ID, ISBN or link" value="${esc(W.inp || "")}" autocomplete="off" spellcheck="false" data-noenter></label>
      <button type="button" class="btn primary" data-ws-add ${W.busy ? "disabled" : ""}>${W.busy === "add" ? "Looking Up…" : "Add"}</button></div>
    <div class="ws-row ws-src-row"><button type="button" class="btn small ws-zbtn" data-ws-zot>${ZICON} ${z ? "From Zotero" : "Connect Zotero"}</button><button type="button" class="btn small" data-ws-imp>Import File</button><button type="button" class="btn small" data-ws-manual>Add by Hand</button>${lib ? `<button type="button" class="btn small" data-ws-lib>My Library <span class="ws-n">${lib}</span></button>` : ""}${files.length ? `<select data-ws-file aria-label="Add a PDF in Studyboard as a source"><option value="">Add a PDF from Studyboard…</option>${files.map(f => `<option value="${esc(f.id)}">${esc(f.name)}</option>`).join("")}</select>` : ""}</div>
    ${W.err ? `<p class="mini ws-err" role="alert">${esc(W.err)}</p>` : W.okMsg ? `<p class="mini ws-ok" role="status">${esc(W.okMsg)}</p>` : ""}${draftOfferHtml(w, inList)}${alsoHtml(t)}
    ${W.engErr === st ? `<p class="mini ws-err">Couldn't load ${esc(styleName(st))}. ${BUILT_FMT[st] ? "Reload Studyboard and try again." : "It's fetched from zotero.org the first time: check your connection."}</p>` : ""}
    ${B.entries.length ? `<h3 class="fsec ws-bibh">${esc(heading)} <span class="mini">${esc(styleName(st))}${B.ready ? "" : " · formatting…"}</span></h3><ol class="ws-refs${B.hang ? " hang" : ""}">${B.entries.map(e => { const s = w.src.find(y => y.id === e.id); if (!s) return ""; const pdf = s.fid && state.files[s.fid]; return `<li class="ws-ref">
        <p class="ws-cite">${citeHtml(e.runs)}</p>
        <p class="mini ws-info">${CITE.keyName(s) ? "" : '<b class="ws-need">Needs a title and author</b> · '}${esc(typeName(s.type))}${s.zkey ? " · Zotero" : ""}${pdf ? " · PDF in Studyboard" : ""} · In text: ${citeHtml(citeOf(t, w, s.id, ""))}</p>
        <p class="mini ws-use">${useTxt(s)}</p>
        ${s.rv ? `<p class="mini ws-rv">Read from your draft's list, so check its details. <button type="button" class="link-btn" data-ws-edit="${esc(s.id)}">Check Details</button></p>` : ""}
        <div class="ws-acts">${inList && !inList.has(s.id) ? `<button type="button" class="ws-act ws-act-add" data-ws-refadd1="${esc(s.id)}" ${W.busy ? "disabled" : ""}>Add to My Draft</button>` : ""}<button type="button" class="ws-act" data-ws-copy="${esc(s.id)}">Copy</button><button type="button" class="ws-act" data-ws-ccopy="${esc(s.id)}">Copy In-Text</button><button type="button" class="ws-act" data-ws-edit="${esc(s.id)}">Edit</button>${pdf ? `<button type="button" class="ws-act" data-ws-openf="${esc(s.fid)}">Highlight PDF</button>` : `<button type="button" class="ws-act" data-ws-attach="${esc(s.id)}">Attach PDF</button>`}${s.URL || s.DOI ? `<a class="ws-act" href="${esc(s.DOI ? "https://doi.org/" + s.DOI : s.URL)}" target="_blank" rel="noopener noreferrer">Open Link</a>` : ""}<span class="spacer"></span><button type="button" class="ws-act ws-rm" data-ws-rm="${esc(s.id)}" aria-label="Remove ${esc(String(s.title || "this source").slice(0, 60))}" title="Remove">${TRASH}</button></div></li>`; }).join("")}</ol>
        ${w.src.some(s => s.zkey) && z ? `<p class="mini" style="margin:0"><button type="button" class="link-btn" data-ws-zsync>Update From Zotero</button> refreshes the ${w.src.filter(s => s.zkey).length} source${w.src.filter(s => s.zkey).length === 1 ? "" : "s"} that came from Zotero.</p>` : ""}`
      : `<div class="ws-empty"><b>No sources yet.</b><p class="mini">Paste a DOI (10.1037/…), an ISBN or a link above, pull them from Zotero, or import a BibTeX or RIS file. ${w.draft ? "Or check your draft: the sources in its list can be added in one go." : `Your citations and ${esc(heading)} list build themselves.`}</p>${w.draft ? `<button type="button" class="btn small" data-ws-go="check">Check My Draft</button>` : ""}</div>`}
    <p class="mini ws-priv">DOIs are looked up at doi.org and ISBNs with Open Library; only the number is sent. Citations are made on this device with citeproc-js and CSL, the engine and styles Zotero uses.</p>`;
}
const TRASH = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>';
const ZICON = '<svg class="ws-zic" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path fill="#CC2936" d="M5 4h14v2.6L9.3 17.4H19V20H5v-2.6l9.7-10.8H5z"/></svg>';
function editHtml(t, w){
  const st = styleOf(t, w), base = W.edit === "new" ? CITE.clean({type: "article-journal"}) : w.src.find(x => x.id === W.edit);
  if (!base) { W.edit = null; return sourcesHtml(t, w); }
  const s = W.form ? Object.assign({}, base, W.form) : base, fields = (CITE.TYPES[s.type] || CITE.TYPES.document)[1], dp = CITE.dateParts(s.issued);
  const fld = (k, l, v, ph, cls) => `<label class="f ${cls || ""}"><span class="lh">${esc(l)}</span><input type="text" data-wf="${k}" value="${esc(v || "")}" placeholder="${esc(ph || "")}" data-noenter></label>`;
  const area = (k, l) => `<label class="f ws-wide"><span class="lh">${l} <span class="hint">one per line: Family, Given (or an organisation's name)</span></span><textarea data-wf="${k}" rows="${k === "author" ? 3 : 2}" data-noenter placeholder="${k === "author" ? "Smith, Jordan A.&#10;World Health Organization" : ""}">${esc(CITE.namesText(s[k]))}</textarea></label>`;
  const wide = new Set(["container-title", "event-title", "URL", "collection-title", "publisher"]);
  return `${W.note ? `<p class="mini ws-note">${esc(W.note)}</p>` : ""}
    <div class="ws-form">
      <label class="f ws-wide"><span class="lh">Item type</span><select data-wf="type">${Object.keys(CITE.TYPES).map(k => `<option value="${k}" ${k === s.type ? "selected" : ""}>${esc(CITE.TYPES[k][0])}</option>`).join("")}</select></label>
      ${area("author", s.type === "motion_picture" ? "Directors or creators" : "Authors")}
      ${fld("title", "Title", s.title, "", "ws-wide")}
      <label class="mi-check ws-wide ws-case"><input type="checkbox" data-wcase ${s.caseAsIs ? "checked" : ""}> Keep the title's capitals as typed <span class="hint">APA and similar styles put titles in sentence case; tick this when the title has names in it</span></label>
      <div class="ws-date ws-wide">${fld("y", "Year", dp[0] || (s.issued && s.issued.literal) || "", "2024")}${fld("m", "Month", dp[1] || "", "1–12")}${fld("d", "Day", dp[2] || "", "")}</div>
      ${fields.map(k => k === "editor" || k === "translator" ? area(k, CITE.LABEL[k]) : k === "accessed" ? `<label class="f"><span class="lh">Accessed</span><input type="date" data-wf="accessed" value="${esc(CITE.isoOf(s.accessed))}"></label>`
        : fld(k, k === "container-title" ? (CITE.CONT[s.type] || "Published in") : CITE.LABEL[k] || k, s[k], k === "page" ? "112–130" : k === "DOI" ? "10.…" : k === "URL" ? "https://" : "", wide.has(k) ? "ws-wide" : "")).join("")}
    </div>
    <p class="mini" style="margin:0">Preview (${esc(styleName(st))}):</p><p class="ws-cite ws-prev" data-ws-prev>${citeHtml(CITE.plain(s))}</p>`;
}
function formRec(){
  const g = k => { const el = W.el.querySelector(`[data-wf="${k}"]`); return el ? el.value : undefined; };
  const t = state.tasks[W.tid], w = wsOf(t), base = W.edit === "new" ? {} : (w.src.find(x => x.id === W.edit) || {});
  const o = Object.assign({}, base, W.form || {});
  const ty = g("type"); if (ty) o.type = ty;
  Object.keys(CITE.LABEL).concat(["title"]).forEach(k => { if (k === "editor" || k === "translator" || k === "accessed") return; const v = g(k); if (v !== undefined) { if (v.trim()) o[k] = v.trim(); else delete o[k]; } });
  ["author", "editor", "translator"].forEach(k => { const v = g(k); if (v !== undefined) { const l = CITE.names(v); if (l.length) o[k] = l; else delete o[k]; } });
  const y = g("y"); if (y !== undefined) { const d = /\d{4}/.test(y) ? CITE.date(y, g("m"), g("d")) : y.trim() ? {literal: y.trim()} : null; if (d) o.issued = d; else delete o.issued; }
  const ac = g("accessed"); if (ac !== undefined) { if (ac) o.accessed = CITE.parseDate(ac); else delete o.accessed; }
  const kc = W.el.querySelector("[data-wcase]"); if (kc) { if (kc.checked) o.caseAsIs = true; else delete o.caseAsIs; }
  return Object.assign(CITE.clean(o), {id: base.id || ""});
}
function zotHtml(t, w){
  const z = zcred(), Z = W.z || {};
  if (!z) return `<p style="margin:0"><b>Connect your Zotero library</b> and pull in the sources you want, with Zotero's own details.</p>
    <ol class="ws-steps"><li>Open <a href="https://www.zotero.org/settings/keys/new" target="_blank" rel="noopener noreferrer">zotero.org/settings/keys/new</a> (sign in if asked).</li><li>Tick <b>Allow library access</b> (and read access to your groups if you use them), then Save Key.</li><li>Paste the key here.</li></ol>
    <label class="f"><span class="lh">Zotero API key</span><input type="password" data-wz-key autocomplete="off" spellcheck="false" placeholder="24 letters and numbers" data-noenter></label>
    ${W.err ? `<p class="mini ws-err" role="alert">${esc(W.err)}</p>` : ""}
    <p class="mini" style="margin:0">The key stays on this device; Studyboard reads your library straight from api.zotero.org and never changes it. Disconnect any time.</p>`;
  const libs = [["user", "My Library"]].concat((z.groups || []).map(g => [g.id, g.name]));
  return `<div class="ws-row"><span class="mini ws-grow">Connected${z.user ? " as " + esc(z.user) : ""}.</span><button type="button" class="link-btn" data-wz-off>Disconnect</button></div>
    <div class="ws-row"><select data-wz-lib aria-label="Library">${libs.map(([k, n]) => `<option value="${esc(k)}" ${(Z.lib || "user") === k ? "selected" : ""}>${esc(n)}</option>`).join("")}</select>
      <select data-wz-col aria-label="Collection"><option value="">All items</option>${(Z.cols || []).map(c => `<option value="${esc(c.key)}" ${Z.col === c.key ? "selected" : ""}>${"  ".repeat(c.depth)}${c.depth ? "↳ " : ""}${esc(c.name)}</option>`).join("")}</select></div>
    <div class="ws-add"><label class="f ws-grow"><span class="lh">Search</span><input type="search" data-wz-q value="${esc(Z.q || "")}" placeholder="Title, author or year" data-noenter></label><button type="button" class="btn" data-wz-go>Search</button></div>
    ${W.err ? `<p class="mini ws-err" role="alert">${esc(W.err)}</p>` : ""}
    ${Z.busy ? `<p class="mini" role="status">Loading from Zotero…</p>` : Z.items ? (Z.items.length ? `<div class="ws-row"><span class="mini ws-grow">${Z.total > Z.items.length ? `Showing ${Z.items.length} of ${Z.total}` : `${Z.items.length} item${Z.items.length === 1 ? "" : "s"}`}</span><button type="button" class="link-btn" data-wz-all>Tick All</button></div>
      <ul class="ws-picks">${Z.items.map(x => { const c = x.csl, dup = CITE.dupOf(c, w.src); return `<li><label class="ws-hl"><input type="checkbox" data-wz-pick="${esc(x.key)}" ${dup ? "disabled" : Z.sel && Z.sel.has(x.key) ? "checked" : ""}><span><b>${esc(c.title || "Untitled")}</b> <span class="mini">${esc([CITE.familyOf((c.author || c.editor || [])[0]), CITE.yearOf(c), typeName(c.type)].filter(Boolean).join(" · "))}${dup ? " · already added" : ""}</span></span></label></li>`; }).join("")}</ul>
      ${Z.total > Z.items.length ? `<button type="button" class="btn small" data-wz-more>Show More</button>` : ""}` : `<div class="ws-empty"><b>Nothing found.</b><p class="mini">Try another collection or search.</p></div>`) : ""}`;
}
function impHtml(){
  const I = W.imp || {};
  return `<p style="margin:0">Bring in sources from Zotero, Mendeley, EndNote, Google Scholar or another reference manager: export them as <b>BibTeX</b> (.bib), <b>RIS</b> (.ris) or <b>CSL-JSON</b> (.json), then choose the file or paste its text.</p>
    <div class="ws-row"><label class="btn small ws-pick">Choose a File<input type="file" accept=".bib,.ris,.json,.txt,application/json,text/plain" data-wi-file class="sr" tabindex="-1" aria-label="Choose a BibTeX, RIS or CSL-JSON file"></label><span class="mini ws-grow">${esc(I.src || "")}</span></div>
    <label class="f"><span class="lh">Or paste</span><textarea data-wi-text rows="6" data-noenter placeholder="@article{smith2021,&#10;  author = {Smith, Jordan},&#10;  title = {…},">${esc(I.text || "")}</textarea></label>
    ${W.err ? `<p class="mini ws-err" role="alert">${esc(W.err)}</p>` : ""}
    ${I.items ? `<p class="mini" style="margin:0">${I.fmt ? `Read as ${I.fmt}: ` : ""}${I.items.length} source${I.items.length === 1 ? "" : "s"} found.</p><ul class="ws-picks">${I.items.slice(0, 200).map((c, i) => `<li><label class="ws-hl"><input type="checkbox" data-wi-pick="${i}" ${I.dup[i] ? "disabled" : "checked"}><span><b>${esc(c.title || "Untitled")}</b> <span class="mini">${esc([CITE.familyOf((c.author || c.editor || [])[0]), CITE.yearOf(c), typeName(c.type)].filter(Boolean).join(" · "))}${I.dup[i] ? " · already added" : ""}</span></span></label></li>`).join("")}</ul>` : ""}`;
}
function libHtml(t, w){
  const L = library(t.id);
  return `<p style="margin:0">Sources from your other papers. Tick the ones this paper uses.</p>
    ${L.length ? `<ul class="ws-picks">${L.map((c, i) => { const dup = CITE.dupOf(c, w.src); return `<li><label class="ws-hl"><input type="checkbox" data-wl-pick="${i}" ${dup ? "disabled" : ""}><span><b>${esc(c.title || "Untitled")}</b> <span class="mini">${esc([CITE.familyOf((c.author || c.editor || [])[0]), CITE.yearOf(c), "in " + c.from].filter(Boolean).join(" · "))}${dup ? " · already added" : ""}</span></span></label></li>`; }).join("")}</ul>` : `<div class="ws-empty"><b>Your library is empty.</b><p class="mini">Sources you add to any paper show up here.</p></div>`}`;
}
function findHtml(){
  const F = W.find || {};
  return `<p style="margin:0">Search the more than 10,000 styles in the Zotero Style Repository: journals, universities, publishers and style guides. A style you add is kept on this device.</p>
    <div class="ws-add"><label class="f ws-grow"><span class="lh">Style name</span><input type="search" data-wy-q value="${esc(F.q || "")}" placeholder="Nature, Vancouver, Turabian, OSCOLA…" data-noenter></label></div>
    ${W.err ? `<p class="mini ws-err" role="alert">${esc(W.err)}</p>` : ""}
    ${F.busy ? `<p class="mini" role="status">${esc(F.busy)}</p>` : ""}
    ${F.hits ? (F.hits.length ? `<ul class="ws-picks">${F.hits.map(h => `<li class="ws-find"><span><b>${esc(h.title)}</b> <span class="mini">${esc([h.format, (h.fields || []).slice(0, 2).join(", ")].filter(Boolean).join(" · "))}</span></span><button type="button" class="btn small" data-wy-use="${esc(h.name)}">Use</button></li>`).join("")}</ul>` : `<div class="ws-empty"><b>No styles match.</b></div>`) : ""}`;
}
let STYLE_LIST = null;
async function styleList(){
  if (STYLE_LIST) return STYLE_LIST;
  const j = await getJson("https://www.zotero.org/styles-files/styles.json", {accept: "application/json"}, 30000);
  STYLE_LIST = (Array.isArray(j) ? j : []).map(x => ({name: String(x.name || ""), title: String(x.title || x.name || ""), format: ((x.categories || {}).format) || "", fields: (x.categories || {}).fields || [], dep: !!x.dependent})).filter(x => x.name);
  return STYLE_LIST;
}
function quotesHtml(t, w){
  const secName = id => (w.out.find(s => s.id === id) || {}).t || "", pick = W.hlPick, note = styleFmt(styleOf(t, w)) === "note", U = usage(t, w);
  if (pick) {
    return `<p style="margin:0">Pick the highlights to add as quotes. Each keeps its page, and its PDF becomes a source if it isn't one yet.</p>
      ${pick.length ? `<div class="ws-hls">${pick.map(g => `<fieldset class="ws-hlf"><legend><b>${esc(g.name)}</b></legend>${g.hl.map(h => `<label class="ws-hl"><input type="checkbox" data-ws-hl="${esc(g.fid)}:${esc(h.id)}" checked><span>“${esc(h.t.slice(0, 300))}${h.t.length > 300 ? "…" : ""}” <span class="mini">p. ${esc(String(h.p))}</span></span></label>`).join("")}</fieldset>`).join("")}</div>`
        : `<div class="ws-empty"><b>No new highlights.</b><p class="mini">Open a PDF to highlight: each passage you highlight can go straight in as a quote.</p><button type="button" class="btn small primary" data-ws-hlpdf>Open a PDF to Highlight</button></div>`}`;
  }
  return `<div class="ws-row"><button type="button" class="btn small primary" data-ws-hlpdf>Open a PDF to Highlight</button><button type="button" class="btn small" data-ws-hlpick>Add From Highlights</button><button type="button" class="btn small" data-ws-qnew>Add a Quote</button></div>
    ${W.qform ? `<div class="ws-qform"><label class="f"><span class="lh">Quote</span><textarea data-wq-t rows="3" data-noenter></textarea></label>
      <div class="ws-row"><select data-wq-s aria-label="Source">${w.src.length ? w.src.map(s => `<option value="${esc(s.id)}">${esc(srcLabel(s))}</option>`).join("") : `<option value="">Add a source first</option>`}</select><label class="ws-pg"><span class="mini">Page</span><input type="text" data-wq-p inputmode="numeric" size="5"></label><button type="button" class="btn small primary" data-wq-save ${w.src.length ? "" : "disabled"}>Save Quote</button></div></div>` : ""}
    ${W.err ? `<p class="mini ws-err" role="alert">${esc(W.err)}</p>` : W.okMsg ? `<p class="mini ws-ok" role="status">${esc(W.okMsg)}</p>` : ""}
    ${w.q.length ? `<ul class="ws-qs">${w.q.map(q => { const s = w.src.find(x => x.id === q.sid); return `<li class="ws-q">
        <blockquote>“${esc(q.t)}”</blockquote>
        <p class="mini ws-info">${s ? (note ? "Footnote: " : "") + citeHtml(citeOf(t, w, s.id, q.p)) : "No source"}${q.sec && secName(q.sec) ? ` · in ${esc(secName(q.sec))}` : ""}${U.used(q) ? ' · <span class="ws-yes">Used in draft ✓</span>' : ""}</p>
        <div class="ws-acts"><button type="button" class="ws-act" data-ws-qcopy="${esc(q.id)}">Copy With Citation</button>${q.fid && state.files[q.fid] ? `<button type="button" class="ws-act" data-ws-qopen="${esc(q.id)}">Open Page ${esc(String(q.p || ""))}</button>` : ""}<span class="spacer"></span><button type="button" class="ws-act ws-rm" data-ws-qrm="${esc(q.id)}" aria-label="Remove this quote" title="Remove">${TRASH}</button></div></li>`; }).join("")}</ul>`
      : `<div class="ws-empty"><b>No quotes yet.</b><p class="mini">Open a PDF to highlight: each passage you highlight can go in as a quote, with its source and page. Quotes already in your draft show up on Check.</p></div>`}`;
}
function outlineHtml(t, w){
  const steps = allTasks().filter(x => x.breakdownOf === t.id).sort((a, b) => String(a.due).localeCompare(String(b.due)));
  const qHtml = q => `<li class="ws-oq" draggable="true" data-ws-dq="${esc(q.id)}"><span class="ws-grip" aria-hidden="true">⋮⋮</span><span class="ws-oqt">“${esc(q.t.length > 220 ? q.t.slice(0, 220) + "…" : q.t)}” <span class="mini">${q.sid ? citeHtml(citeOf(t, w, q.sid, q.p)) : ""}</span></span>
    <select data-ws-mv="${esc(q.id)}" aria-label="Move this quote to a section"><option value="">Not placed</option>${w.out.map(s2 => `<option value="${esc(s2.id)}" ${q.sec === s2.id ? "selected" : ""}>${esc(s2.t)}</option>`).join("")}</select></li>`;
  const loose = w.q.filter(q => !q.sec || !w.out.some(s => s.id === q.sec)), empty = w.out.filter(s => !w.q.some(q => q.sec === s.id));
  if (!w.out.length) return `<div class="ws-empty"><b>Start an outline.</b><p class="mini">Make sections, then drag your quotes into them. Export it to Word or Google Docs with the citations in place.</p>
      <div class="ws-row" style="justify-content:center"><button type="button" class="btn small primary" data-ws-seed="basic">Introduction, Body, Conclusion</button>${steps.length ? `<button type="button" class="btn small" data-ws-seed="steps">Use the ${steps.length} Milestones</button>` : ""}<button type="button" class="btn small" data-ws-secadd>Add a Section</button></div></div>`;
  const gaps = [loose.length ? `${plural(loose.length, "quote")} never placed` : "", w.q.length && empty.length ? `${plural(empty.length, "section")} with no quotes` : ""].filter(Boolean);
  return `<p class="mini" style="margin:0">Drag quotes into a section (or use each quote's menu). Notes are your own words, for you.</p>
    ${gaps.length ? `<p class="mini ws-gaps" role="status">${esc(gaps.join(" · "))}</p>` : w.q.length ? `<p class="mini ws-ok" role="status">Every quote is placed, and every section has one ✓</p>` : ""}
    <div class="ws-drop ws-loose" data-ws-drop=""><div class="ws-sech"><b>Not placed yet</b><span class="mini">${loose.length}</span></div>${loose.length ? `<ul class="ws-oqs">${loose.map(qHtml).join("")}</ul>` : `<p class="mini" style="margin:0">Every quote has a place.</p>`}</div>
    <ol class="ws-secs">${w.out.map((s, i) => { const qs = w.q.filter(q => q.sec === s.id); return `<li class="ws-drop ws-sec${qs.length ? "" : " is-empty"}" data-ws-drop="${esc(s.id)}">
      <div class="ws-sech"><input type="text" class="ws-sect" data-ws-sect="${esc(s.id)}" value="${esc(s.t)}" aria-label="Section name" maxlength="120"><span class="mini">${qs.length}</span>
        <button type="button" class="icon-btn" data-ws-up="${esc(s.id)}" aria-label="Move ${esc(s.t)} up" ${i ? "" : "disabled"}>↑</button><button type="button" class="icon-btn" data-ws-dn="${esc(s.id)}" aria-label="Move ${esc(s.t)} down" ${i < w.out.length - 1 ? "" : "disabled"}>↓</button><button type="button" class="icon-btn" data-ws-secrm="${esc(s.id)}" aria-label="Remove section ${esc(s.t)}">✕</button></div>
      <textarea class="ws-secn" data-ws-secn="${esc(s.id)}" rows="1" placeholder="Your notes for this section" data-noenter>${esc(s.n || "")}</textarea>
      ${qs.length ? `<ul class="ws-oqs">${qs.map(qHtml).join("")}</ul>` : `<p class="mini ws-hint">${w.q.length ? "No quotes here yet: drop one in" : "Drop quotes here"}</p>`}</li>`; }).join("")}</ol>
    <div class="ws-row"><button type="button" class="btn small" data-ws-secadd>Add a Section</button></div>`;
}

/* Check: the draft, saved on the paper; the check; what changed since the last one; what the draft has that the paper doesn't yet */
const DRAFT_EXT = /\.(pdf|docx|txt|md)$/i;
const fileName = f => String((curRev(f) || {}).name || f.name || "");
const fileAt = f => Math.max(Number(f.created) || 0, ...(f.revs || []).map(r => Number(r && r.at) || 0));
// a draft-like file attached to the assignment (not one of its sources), to offer when there's no draft yet
function draftOffer(t, w){
  const srcF = new Set(w.src.map(s => s.fid).filter(Boolean));
  const fs = Object.values(state.files).filter(f => f && f.kind === "file" && (f.revs || []).length && (f.taskIds || []).includes(t.id) && !srcF.has(f.id) && DRAFT_EXT.test(fileName(f)));
  const score = f => (/draft|essay|paper|final|report|write|submission/i.test(f.name) ? 4 : 0) + (/\.docx$/i.test(fileName(f)) ? 2 : /\.(txt|md)$/i.test(fileName(f)) ? 1 : 0);
  return fs.sort((a, b) => score(b) - score(a) || fileAt(b) - fileAt(a))[0] || null;
}
function draftView(text, x){
  let html = esc(text);
  if (x && x.at != null) {
    const a = Math.max(0, x.at), b = Math.min(text.length, a + (x.len || 1)), [s0, e0] = CITE.sentenceAt(text, a, b - a), s = Math.min(s0, a), e = Math.max(e0, b);
    html = esc(text.slice(0, s)) + `<mark class="ws-mark">${esc(text.slice(s, a))}<b>${esc(text.slice(a, b))}</b>${esc(text.slice(b, e))}</mark>` + esc(text.slice(e));
  }
  return `<div class="ws-dv" tabindex="0" role="region" aria-label="Your draft, read only">${html}</div>`;
}
function foundHtml(t, w){
  const F = W.found; if (!F || F.tid !== t.id || !w.draft || F.h !== w.draft.h) return "";
  const refs = F.refs.filter(r => !r.dup), dupN = F.refs.length - refs.length, qs = F.quotes, st = styleOf(t, w), head = CITE.headingOf(st, styleFmt(st));
  if (!refs.length && !qs.length) return F.refs.length ? `<p class="mini ws-ok">Every entry in your ${esc(listOf(head))} is one of your sources ✓</p>` : "";
  const nR = refs.filter(r => F.sel.has(r.k)).length, nQ = qs.filter(q => F.sel.has(q.k)).length;
  const meta = it => [CITE.familyOf((it.author || it.editor || [])[0]), CITE.yearOf(it), typeName(it.type)].filter(Boolean).join(" · ");
  return `<section class="ws-found" aria-label="Found in your draft"><h3 class="fsec">Found in Your Draft</h3>
    ${refs.length ? `<p class="mini" style="margin:0">${plural(refs.length, "entry").replace("entrys", "entries")} in your ${esc(listOf(head))} ${refs.length === 1 ? "isn't a source" : "aren't sources"} here yet${dupN ? ` (${dupN} already ${dupN === 1 ? "is" : "are"})` : ""}. Ones with a DOI or ISBN are looked up for their full details; the rest are read from your list, so check them after.</p>
      <ul class="ws-picks ws-fl">${refs.map(r => `<li><label class="ws-hl"><input type="checkbox" data-wf-ref="${esc(r.k)}" ${F.sel.has(r.k) ? "checked" : ""}><span><b>${esc(r.it.title || "Untitled")}</b> <span class="mini">${esc(meta(r.it))} · ${r.st === "look" ? "Looking up…" : r.st === "ok" ? `Found by ${r.it.ISBN && !r.it.DOI ? "ISBN" : "DOI"} ✓` : "Read from your list: check it"}</span></span></label></li>`).join("")}</ul>
      <div class="ws-row"><button type="button" class="btn small primary" data-wf-addrefs ${nR ? "" : "disabled"}>Add ${nR} Source${nR === 1 ? "" : "s"}</button></div>` : ""}
    ${qs.length ? `<p class="mini" style="margin:0">${plural(qs.length, "quoted passage")} with a citation after ${qs.length === 1 ? "it" : "them"}. Add them as quotes, each with its source and page.</p>
      <ul class="ws-picks ws-fq">${qs.map(q => `<li><label class="ws-hl"><input type="checkbox" data-wf-q="${esc(q.k)}" ${F.sel.has(q.k) ? "checked" : ""}><span>“${esc(cut(q.t, 220))}” <span class="mini">${esc(q.cite)}${q.p ? ` · p. ${esc(q.p)}` : ""}</span></span></label>
        <select data-wf-qs="${esc(q.k)}" aria-label="Source for this quote"><option value="">Which source?</option>${w.src.map(s => `<option value="${esc(s.id)}" ${q.sid === s.id ? "selected" : ""}>${esc(srcLabel(s))}</option>`).join("")}</select></li>`).join("")}</ul>
      <div class="ws-row"><button type="button" class="btn small primary" data-wf-addq ${nQ ? "" : "disabled"}>Add ${nQ} Quote${nQ === 1 ? "" : "s"}</button></div>` : ""}
  </section>`;
}
// My Doc: the paper itself. Added here (pasted, uploaded, chosen from Studyboard, or a linked Google Doc or Word file), then shown as a page:
// a click puts a citation there, a selection keeps a quote
function docTabHtml(t, w){
  const d = w.draft;
  if (!d || W.redo) return pickHtml(t, w, `<p style="margin:0">Your paper. Paste it, upload it, choose it from Studyboard, or link the Google Doc or Word file you're writing. Then click where a citation goes, or select a passage to keep it as a quote.</p>`);
  return `${ldLinkedHtml(t, w)}
    ${W.err ? `<p class="mini ws-err" role="alert">${esc(W.err)}</p>` : W.busy === "fix" ? `<p class="mini" role="status">Adding it to your paper…</p>` : W.okMsg ? `<p class="mini ws-ok" role="status">${esc(W.okMsg)}</p>` : ""}
    ${readerHtml(t, w)}`;
}
// The paper as a page: each line its own paragraph (a click or a selection maps to a place in the draft by the paragraph's start and the text
// before it). A linked Google Doc or Word file is laid out as it looks there: its fonts and sizes, bold, italic and underline, alignment,
// indents, line spacing, space above, title and headings
const SERIF = /times|georgia|garamond|cambria|palatino|book antiqua|baskerville|merriweather|lora|playfair|serif/i;
const fontCss = f => { if (!f) return ""; const fb = /calibri/i.test(f) ? "Carlito, " : /^arial$/i.test(f) ? "Arimo, \"Liberation Sans\", " : /times new roman/i.test(f) ? "Tinos, \"Liberation Serif\", " : ""; return `"${String(f).replace(/["\;{}<>]/g, "")}", ${fb}${SERIF.test(f) ? "serif" : "sans-serif"}`; };
function layHtml(text, L){
  const N = LIVEDOC.norm(L.raw); if (N.text !== text) return "";
  const paras = L.lay.paras.slice().sort((a, b) => a.at - b.at), px = n => Math.round(n * 10) / 10;
  const paraAt = r => { let lo = 0, hi = paras.length - 1, best = paras[0]; while (lo <= hi) { const m = (lo + hi) >> 1; if (paras[m].at <= r) { best = paras[m]; lo = m + 1; } else hi = m - 1; } return best; };
  const runStyle = rn => !rn ? "" : [rn.font && rn.font !== L.lay.base.font ? `font-family:${fontCss(rn.font)}` : "", rn.size && rn.size !== L.lay.base.size ? `font-size:${px(rn.size * 4 / 3)}px` : "", rn.b ? "font-weight:700" : "", rn.i ? "font-style:italic" : "", rn.u ? "text-decoration:underline" : ""].filter(Boolean).join(";");
  let o = 0;
  return text.split("\n").map(line => {
    const at = o; o += line.length + 1;
    if (!line) return `<p data-o="${at}" class="ws-rd-gap"></p>`;
    const P = paraAt(N.map[at]) || {runs: []}, runs = P.runs || [];
    let html = "", cur = null, buf = "", ri = 0;
    for (let k = 0; k < line.length; k++) {
      const r = N.map[at + k]; while (ri < runs.length - 1 && runs[ri].at + runs[ri].n <= r) ri++;
      const rn = runs[ri] && r >= runs[ri].at && r < runs[ri].at + runs[ri].n ? runs[ri] : null, st = runStyle(rn);
      if (st !== cur) { if (buf) html += cur ? `<span style="${esc(cur)}">${esc(buf)}</span>` : esc(buf); buf = ""; cur = st; }
      buf += line[k];
    }
    if (buf) html += cur ? `<span style="${esc(cur)}">${esc(buf)}</span>` : esc(buf);
    const ps = [`text-align:${P.align || "left"}`, P.left || P.hang ? `padding-left:${px((P.left || 0) + (P.hang || 0))}px` : "", P.first || P.hang ? `text-indent:${px((P.first || 0) - (P.hang || 0))}px` : "", P.line ? `line-height:${px(Math.max(1, P.line) * 1.2)}` : "", P.above ? `margin-top:${px(P.above)}px` : ""].filter(Boolean).join(";");
    return `<p data-o="${at}"${P.kind ? ` data-k="${esc(P.kind)}"` : ""} style="${esc(ps)}">${html}</p>`;
  }).join("");
}
function readerHtml(t, w){
  const d = w.draft;
  // what the linked doc looks like, from when it was last read (on this device)
  if (w.ld && !(LAY[t.id] && LAY[t.id].h === d.h) && !LAY["?" + t.id]) { LAY["?" + t.id] = 1; idbGet("wslay:" + t.id).then(v => { const dd = wsOf(state.tasks[t.id]).draft; if (v && dd && v.h === dd.h) { LAY[t.id] = v; if (shown() && W.tab === "doc") draw(); } }).catch(() => {}); }
  const L = w.ld && LAY[t.id] && LAY[t.id].h === d.h ? LAY[t.id] : null, laid = L ? layHtml(d.t, L) : "";
  let o = 0;
  const paras = laid || d.t.split("\n").map(line => { const at = o; o += line.length + 1; return `<p data-o="${at}"${line ? "" : ' class="ws-rd-gap"'}>${esc(line)}</p>`; }).join("");
  const note = styleFmt(styleOf(t, w)) === "note";
  return `<div class="ws-rdbar"><span class="mini ws-rdhint">${note ? "Select a passage to keep it as a quote. (This style cites in footnotes: add those in your document.)" : "Click where a citation goes, or select a passage to keep it as a quote."}</span>
      <span class="ws-rdmeta"><span class="mini ws-rdname">${esc(d.from && d.from !== "Pasted" ? d.from : "Pasted")} · about ${wordsIn(d.t).toLocaleString()} words</span><button type="button" class="ws-act" data-ws-redo>Replace</button><button type="button" class="ws-act ws-rm" data-ws-drm aria-label="Remove your paper from Writing Studio" title="Remove">${TRASH}</button></span></div>
    <div class="ws-rdwrap"><div class="ws-rd${laid ? " is-doc" : ""}" data-ws-rd aria-label="Your paper: click to cite, select to quote"${laid ? ` style="${esc(`font-family:${fontCss(L.lay.base.font)};font-size:${Math.round(L.lay.base.size * 4 / 3 * 10) / 10}px`)}"` : ""}>${paras}</div></div>`;
}
// The citations a click can put in: each source's own (in brackets) and the form for the middle of a sentence
function citeForms(t, w, sid){ const paren = CITE.runsText(citeOf(t, w, sid, "")).trim(); return {paren, narr: CITE.narrOf(paren)}; }
// the menu at a click or a selection: Cite Here (or Cite After It), Add Quote; then which source, each showing exactly what goes in
function popHtml(t, w){
  const P = W.pop; if (!P) return "";
  const d = w.draft, sel = P.b > P.a ? d.t.slice(P.a, P.b).trim() : "", note = styleFmt(styleOf(t, w)) === "note";
  const srcs = w.src.filter(s => CITE.keyName(s));
  if (P.mode === "cite" || P.mode === "quote") {
    if (!srcs.length) return `<div class="ws-pop-h">No sources yet</div><p class="mini">Add your sources on the Sources tab first.</p><button type="button" class="btn small" data-ws-go="sources">Go to Sources</button>`;
    const ctx = sid => { const s0 = srcs.find(x => x.id === sid), f = citeForms(t, w, s0.id), pl = CITE.citePlace(d.t, P.b, f), e = pl.edit, a0 = Math.max(0, e.at - 48), b0 = Math.min(d.t.length, e.at + e.len + 36), cl = x => esc(x.replace(/\s+/g, " ")); return `${a0 > 0 ? "…" : ""}${cl(d.t.slice(a0, e.at))}${e.len ? `<del>${cl(d.t.slice(e.at, e.at + e.len))}</del>` : ""}<ins>${cl(e.to)}</ins>${cl(d.t.slice(e.at + e.len, b0))}${b0 < d.t.length ? "…" : ""}`; };
    const rows = srcs.map(s => {
      const f = citeForms(t, w, s.id), pl = P.mode === "cite" ? CITE.citePlace(d.t, P.b, f) : null;
      return `<button type="button" class="ws-pop-s" data-ws-pops="${esc(s.id)}"${pl ? ` data-ctx="${esc(ctx(s.id))}"` : ""}><b>${esc(pl ? (pl.kind === "mid" ? f.narr : f.paren) : CITE.keyName(s) + (CITE.yearOf(s) ? ` (${CITE.yearOf(s)})` : ""))}</b><span class="mini">${esc(cut(s.title || "", 70))}</span></button>`;
    }).join("");
    const how = P.mode === "quote" ? "Which source is it from?" : CITE.citePlace(d.t, P.b, {paren: "(A)", narr: "A"}).kind === "mid" ? "In the middle of a sentence: the authors go in it" : "At the end of a sentence: in brackets, before the full stop";
    return `<div class="ws-pop-h">${P.mode === "quote" ? "Add Quote" : "Cite Here"}<button type="button" class="ws-pop-x" data-ws-popx aria-label="Close">×</button></div><p class="mini ws-pop-how">${esc(how)}</p>${P.mode === "cite" ? `<p class="ws-pop-ctx" aria-live="polite">${ctx(srcs[0].id)}</p>` : ""}<div class="ws-pop-list">${rows}</div>`;
  }
  if (P.mode === "after") { const s = w.src.find(x => x.id === P.sid), f = s ? citeForms(t, w, s.id) : null, pl = f ? CITE.citePlace(d.t, P.b, f) : null; return f && !note ? `<span class="mini">Cite it here too?</span><button type="button" class="btn small primary" data-ws-pops="${esc(s.id)}" data-ws-popc>${esc(pl.kind === "mid" ? f.narr : f.paren)}</button><button type="button" class="ws-pop-x" data-ws-popx aria-label="Close">×</button>` : ""; }
  if (P.mode === "qhere") {
    const qs = w.q.filter(x => x.t && w.src.some(s => s.id === x.sid));
    if (!qs.length) return `<div class="ws-pop-h">Quote Here<button type="button" class="ws-pop-x" data-ws-popx aria-label="Close">×</button></div><p class="mini">No quotes yet. Select a passage in a source's PDF, or in your paper, and keep it as a quote.</p><button type="button" class="btn small" data-ws-go="quotes">Go to Quotes</button>`;
    return `<div class="ws-pop-h">Quote Here<button type="button" class="ws-pop-x" data-ws-popx aria-label="Close">×</button></div><p class="mini ws-pop-how">The quote goes in with its citation${note ? "" : " (and its page)"}</p><div class="ws-pop-list">${qs.map(x => { const sr = w.src.find(s => s.id === x.sid); return `<button type="button" class="ws-pop-s" data-ws-qhere="${esc(x.id)}"><b>“${esc(cut(x.t, 90))}”</b><span class="mini">${esc(CITE.runsText(citeOf(t, w, x.sid, x.p || "")))}${sr && sr.title ? " · " + esc(cut(sr.title, 40)) : ""}</span></button>`; }).join("")}</div>`;
  }
  return `${!note ? `<button type="button" class="btn small primary" data-ws-popm="cite">${sel ? "Cite After It" : "Cite Here"}</button>` : ""}${!sel ? `<button type="button" class="btn small" data-ws-popm="qhere">Quote Here</button>` : ""}${sel.length >= 3 ? `<button type="button" class="btn small${note ? " primary" : ""}" data-ws-popm="quote">Add Quote</button>` : ""}<button type="button" class="ws-pop-x" data-ws-popx aria-label="Close">×</button>`;
}
// Cite Here: the citation in the paper (the draft, its note, or its linked doc, as a fix is), then checked again
async function citeHere(t, sid){
  const w = wsOf(state.tasks[t.id]), P = W.pop; if (!w.draft || !P) return;
  const f = citeForms(t, w, sid), pl = CITE.citePlace(w.draft.t, P.b, f), what = pl.kind === "mid" ? f.narr : f.paren, l = ldOf(w);
  W.pop = null;
  const n = await fixDraft(state.tasks[t.id], [pl.edit], `Added ${what} to your paper`);
  if (n) W.okMsg = `Added ${what} ${pl.kind === "mid" ? "in the sentence" : pl.quote ? "after the quotation" : "at the end of the sentence"}${l ? `, in ${l.name || "your " + ldName(l)}` : ""}.`;
  if (shown()) draw();
}
// Quote Here: a saved quote put in at the place clicked, in quotation marks, with its citation (and page) right after it
async function quoteHere(t, qid){
  const w = wsOf(state.tasks[t.id]), P = W.pop, x = w.q.find(y => y.id === qid); if (!w.draft || !P || !x) return;
  const text = w.draft.t, WD = /[\p{L}\p{N}'’-]/u; let p = P.b; while (p > 0 && WD.test(text[p - 1]) && WD.test(text[p] || "")) p--;
  const note = styleFmt(styleOf(state.tasks[t.id], w)) === "note", paren = note ? "" : CITE.runsText(citeOf(state.tasks[t.id], w, x.sid, x.p || "")).trim();
  const body = `“${String(x.t).trim().replace(/^["“‘']+|["”’']+$/g, "")}”${paren ? " " + paren : ""}`;
  const pre = p > 0 && !/[\s(\[“"‘—-]/.test(text[p - 1]) ? " " : "", post = WD.test(text[p] || "") ? " " : "";
  W.pop = null;
  const n = await fixDraft(state.tasks[t.id], [{at: p, len: 0, from: "", to: pre + body + post}], "Added a quote to your paper");
  if (n) W.okMsg = `Added the quote${paren ? " with " + paren : ""}.`;
  if (shown()) draw();
}
// Add Quote: the selected passage, kept as a quote from that source (and then Cite After It is one tap)
function quoteFromSel(t, sid){
  const w = wsOf(state.tasks[t.id]), P = W.pop; if (!w.draft || !P) return;
  const q = w.draft.t.slice(P.a, P.b).replace(/\s+/g, " ").trim().replace(/^["“‘']+|["”’']+$/g, "");
  if (!q) return;
  if (w.q.some(x => normText(x.t) === normText(q) && x.sid === sid)) { W.okMsg = "That quote is already on the Quotes tab."; W.pop = null; draw(); return; }
  w.q.push({id: uid(), sid, t: q.slice(0, 2000), p: "", sec: "", at: Date.now()});
  save(state.tasks[t.id], w, "Added a quote");
  const s = w.src.find(x => x.id === sid);
  W.okMsg = `Kept as a quote from ${s ? CITE.keyName(s) : "your source"} (on the Quotes tab).`;
  W.pop = Object.assign({}, P, {mode: "after", sid});
  draw();
}
function checkHtml(t, w){
  const req = CITE.rules(reqText(t)), st = styleOf(t, w), d = w.draft;
  let h = `<p style="margin:0">Checks your citations against your sources before you hand it in. Fix corrects anything with one right answer.</p>
    ${req.style || req.min ? `<p class="mini ws-note">From the assignment: ${esc([req.style ? styleName(req.style) : "", req.min ? `at least ${req.min}${req.scholarly ? " scholarly" : ""} sources` : ""].filter(Boolean).join(", "))}.</p>` : ""}`;
  if (!d || W.redo) return pickHtml(t, w, h);
  return checkResHtml(t, w, h);
}
function pickHtml(t, w, h){
  const st = styleOf(t, w), d = w.draft;
  {
    const off = !d && !W.offerOff ? draftOffer(t, w) : null, words = wordsIn(W.paste);
    h += `${off ? `<div class="ws-offer" role="note"><span>Use <b>${esc(off.name)}</b>? It's attached to this assignment.</span><span class="ws-row"><button type="button" class="btn small primary" data-ws-dsel="f:${esc(off.id)}">Use It</button><button type="button" class="link-btn" data-ws-offno>Not Now</button></span></div>` : ""}
      <label class="f"><span class="lh">Your Draft <span class="hint" data-ws-wc>${words ? `about ${words} words` : ""}</span></span><textarea data-ws-draft rows="7" data-noenter placeholder="Paste your draft, with its ${esc(CITE.headingOf(st, styleFmt(st)))} list">${esc(W.paste)}</textarea></label>
      <div class="ws-row"><span class="mini ws-grow">It's kept with this paper. A Word file is fixed in place.</span><label class="btn small ws-pick" title="A PDF or text file is read; a Word file (.docx) is fixed in place, and you can download it again">Upload Draft<input type="file" accept=".pdf,.docx,.txt,.md,application/pdf,text/plain" data-ws-dfile class="sr" tabindex="-1" aria-label="Choose your draft file"></label><button type="button" class="btn small" data-ws-dpick>Choose From Studyboard</button></div>
      ${ldPickRow(w)}
      ${W.err ? `<p class="mini ws-err" role="alert">${esc(W.err)}</p>` : W.busy === "read" ? `<p class="mini" role="status">Reading your draft…</p>` : ""}`;
    return h;
  }
}
function checkResHtml(t, w, h){
  const d = w.draft, c = w.chk, stale = !c || c.h !== d.h, r = usage(t, w).res;
  h += `<div class="ws-draft"><div class="ws-draft-t"><b>Your Draft</b><span class="mini">${esc(d.from && d.from !== "Pasted" ? "From " + d.from : "Pasted")} · about ${wordsIn(d.t).toLocaleString()} words · saved ${esc(ago(d.at))}</span>
      <span class="mini${stale ? " ws-no" : ""}">${!c ? "Not checked yet" : stale ? `Changed since the last check (${esc(ago(c.at))})` : `Checked ${esc(ago(c.at))}: ${c.err} to fix · ${c.warn} to look at`}</span></div>
    <div class="ws-acts"><button type="button" class="ws-act" data-ws-dview aria-expanded="${W.show === "all"}">${W.show === "all" ? "Hide Draft" : "View Draft"}</button><button type="button" class="ws-act" data-ws-redo>Replace</button>${d.fx && !d.nid && !d.ld ? `<button type="button" class="ws-act" data-ws-dcopy>Copy Fixed Draft</button>` : ""}<span class="spacer"></span><button type="button" class="ws-act ws-rm" data-ws-drm aria-label="Remove your draft from Writing Studio" title="Remove">${TRASH}</button></div>
    ${W.show === "all" ? draftView(d.t, null) : ""}</div>
    ${W.err ? `<p class="mini ws-err" role="alert">${esc(W.err)}</p>` : W.okMsg ? `<p class="mini ws-ok" role="status">${esc(W.okMsg)}</p>` : ""}
    ${W.diff ? `<p class="ws-diff" role="status">${W.diff.fixed || W.diff.fresh ? `Since your last check: <b>${W.diff.fixed} fixed</b>, ${W.diff.fresh} new.` : "Nothing changed since your last check."}</p>` : ""}
    ${foundHtml(t, w)}
    <div class="ws-res"><p class="ws-sum"><span class="ws-sum-t"><b>${r.total ? `${r.cited} of ${r.total} source${r.total === 1 ? "" : "s"} cited` : "No sources to check against"}</b> · ${r.issues.filter(x => x.k === "err").length} to fix · ${r.issues.filter(x => x.k === "warn").length} to look at</span>${(() => { const f = r.issues.filter(x => x.edits && x.edits.length).length; return f ? `<button type="button" class="btn small primary ws-fixall" data-ws-fixall>Fix All${f > 1 ? ` (${f})` : ""}</button>` : ""; })()}</p>
      <ul class="ws-issues">${r.issues.map((x, i) => issueHtml(x, i, d.t)).join("")}</ul></div>`;
  return h;
}
// One issue: a way to its place in the draft (and to each other place, for a group of the same problem), the right version of a
// reference entry with Copy, and Switch to for a style
function issueHtml(x, i, text){
  const ic = {err: "✕", warn: "!", ok: "✓"}, sh = W.show == null ? "" : String(W.show), me = sh === String(i), sub = sh.indexOf(i + ":") === 0 ? Number(sh.split(":")[1]) : -1;
  const at = sub >= 0 && x.more && x.more[sub] ? x.more[sub] : x;
  const fixB = x.edits && x.edits.length ? `<button type="button" class="btn small primary ws-fixb" data-ws-fix="${i}">${x.edits.length > 1 ? `Fix All ${x.edits.length}` : "Fix"}</button>` : x.addRef ? `<button type="button" class="btn small primary ws-fixb" data-ws-addref="${i}">Add to Sources</button>` : "";
  return `<li class="ws-is k-${x.k}${me || sub >= 0 ? " is-open" : ""}"><span class="ws-ic" aria-hidden="true">${ic[x.k]}</span><span>${x.at != null ? `<button type="button" class="ws-is-b" data-ws-show="${i}" aria-expanded="${me}"><b>${esc(x.t)}</b><span class="ws-is-go">${me ? "Hide" : "Show in Draft"}</span></button>` : `<b>${esc(x.t)}</b>`}${x.d ? `<span class="mini">${esc(x.d)}</span>` : ""}${fixB}`
    + (x.more && x.more.length ? `<span class="ws-more"><span class="mini">Show the others:</span>${x.more.map((y, j) => `<button type="button" class="ws-chipb" data-ws-show="${i}:${j}" aria-pressed="${sub === j}">${esc(cut(y.s, 44))}</button>`).join("")}</span>` : "")
    + (x.should ? `<span class="ws-should"><span class="mini">Should be:</span><span class="ws-should-t">${esc(x.should)}</span>${x.sid ? `<button type="button" class="btn small" data-ws-copy="${esc(x.sid)}">Copy</button>` : ""}</span>` : "")
    + (x.fix && x.fix.startsWith("style:") ? ` <button type="button" class="link-btn" data-ws-setst="${esc(x.fix.slice(6))}">Switch to ${esc(styleShort(x.fix.slice(6)))}</button>` : "")
    + (me || sub >= 0 ? draftView(text, at) : "") + `</span></li>`;
}
function runCheck(t, w, text){
  w = w || wsOf(t); const st = styleOf(t, w), names = {}; BUILT.forEach(([k, n]) => { names[k] = n; });
  const B = bibOf(t, w), order = styleFmt(st) === "numeric" ? B.entries.map(e => e.id) : null, eng = engNow(st, w.src, w.lang);
  // the style's own references and citations (citeproc's), once it's loaded: each entry and citation is checked against them
  const refs = B.ready ? Object.fromEntries(B.entries.map(e => [e.id, CITE.runsText(e.runs)])) : null;
  const cite = eng ? (id, loc) => { try { return CITE.runsText(eng.cite(id, loc)); } catch (e) { return ""; } } : null;
  return CITE.check(text, order ? order.map(id => w.src.find(s => s.id === id)).filter(Boolean) : w.src, {style: st, kind: styleFmt(st), label: styleShort(st), req: reqText(t), names, refs, cite, parent: styleParent(st)});
}

/* Pickers: a draft from anywhere in Studyboard, a PDF to attach to a source, a PDF to highlight */
function fileGroups(t, ok, q){
  const qq = String(q || "").trim().toLowerCase(), all = Object.values(state.files).filter(f => f && f.kind === "file" && (f.revs || []).length && ok(f) && (!qq || String(f.name || "").toLowerCase().includes(qq)));
  const recent = (a, b) => fileAt(b) - fileAt(a), mine = all.filter(f => (f.taskIds || []).includes(t.id)).sort(recent);
  const course = all.filter(f => !mine.includes(f) && t.courseId && f.courseId === t.courseId).sort(recent), rest = all.filter(f => !mine.includes(f) && !course.includes(f)).sort(recent);
  return [["This Assignment", mine], ["This Course", course], ["All Files", rest]].filter(g => g[1].length);
}
const courseName = id => { const c = id && typeof courseOf === "function" ? courseOf(id) : null; return c ? (typeof courseLabel === "function" ? courseLabel(c) : c.name) : ""; };
const rowsHtml = (list, attr, btn) => `<ul class="ws-flist">${list.map(x => `<li><span class="ws-fn"><b>${esc(x.name)}</b><span class="mini">${esc(x.meta)}</span></span><button type="button" class="btn small" ${attr}="${esc(x.id)}">${btn}</button></li>`).join("")}</ul>`;
const fileRow = (f, extra) => ({id: "f:" + f.id, name: f.name, meta: [String(fileName(f).split(".").pop() || "").toUpperCase(), courseName(f.courseId), extra || "", fileAt(f) ? ago(fileAt(f)).replace(/^on /, "") : ""].filter(Boolean).join(" · ")});
const noteTitle = n => String(n.text || "").trim().split("\n")[0].replace(/^#+\s*/, "").slice(0, 80) || "Untitled note";
function searchBox(ph){ return `<div class="ws-add"><label class="f ws-grow"><span class="lh">Search</span><input type="search" data-wp-q value="${esc((W.pick || {}).q || "")}" placeholder="${esc(ph)}" data-noenter></label></div>`; }
function draftsHtml(t){
  const P = W.pick || {}, qq = String(P.q || "").trim().toLowerCase();
  const groups = fileGroups(t, f => DRAFT_EXT.test(fileName(f)), P.q).map(([h, l]) => [h, l.slice(0, 40).map(f => fileRow(f))]);
  const notes = Object.values(state.notes || {}).filter(n => n && n.id && wordsIn(n.text) >= 60 && (!qq || String(n.text).toLowerCase().includes(qq))).sort((a, b) => ((b.courseId === t.courseId) - (a.courseId === t.courseId)) || (Number(b.updated || b.created) || 0) - (Number(a.updated || a.created) || 0)).slice(0, 30)
    .map(n => ({id: "n:" + n.id, name: noteTitle(n), meta: ["Note", courseName(n.courseId), `about ${wordsIn(n.text)} words`].filter(Boolean).join(" · ")}));
  if (notes.length) groups.push(["Your Notes", notes]);
  return `<p style="margin:0">Pick your draft: a Word file, PDF or text file in Studyboard, or one of your notes. It's read on this device and kept with this paper.</p>
    ${searchBox("File or note name")}
    ${W.err ? `<p class="mini ws-err" role="alert">${esc(W.err)}</p>` : W.busy === "read" ? `<p class="mini" role="status">Reading your draft…</p>` : ""}
    ${groups.length ? groups.map(([h, l]) => `<h3 class="fsec">${esc(h)}</h3>${rowsHtml(l, "data-ws-dsel", "Use")}`).join("") : `<div class="ws-empty"><b>${qq ? "Nothing matches." : "No drafts in Studyboard yet."}</b><p class="mini">Word files (.docx), PDFs, text files and longer notes show up here. Or go back and upload or paste your draft.</p></div>`}`;
}
function pdfPickHtml(t, w, mode){
  const P = W.pick || {}, srcF = new Map(w.src.filter(s => s.fid).map(s => [s.fid, s]));
  const extra = f => [srcF.has(f.id) ? "a source" : "", hlOf(f).length ? plural(hlOf(f).length, "highlight") : ""].filter(Boolean).join(" · ");
  let groups;
  if (mode === "hlpdf") {
    const mine = w.src.map(s => s.fid && state.files[s.fid]).filter(f => f && isPdfFile(f)), qq = String(P.q || "").trim().toLowerCase();
    groups = [["This Paper's Sources", mine.filter(f => !qq || f.name.toLowerCase().includes(qq))]].concat(fileGroups(t, f => isPdfFile(f) && !srcF.has(f.id), P.q).filter(g => g[0] !== "All Files" || qq))
      .map(([h, l]) => [h, l.slice(0, 40).map(f => fileRow(f, extra(f)))]).filter(g => g[1].length);
  } else groups = fileGroups(t, f => isPdfFile(f) && !srcF.has(f.id), P.q).map(([h, l]) => [h, l.slice(0, 40).map(f => fileRow(f, extra(f)))]);
  const s = mode === "attach" ? w.src.find(x => x.id === W.attachFor) : null;
  return `<p style="margin:0">${mode === "attach" ? `Pick the PDF of <b>${esc(cut(s ? s.title || "this source" : "this source", 80))}</b>, so you can highlight it and add quotes.` : "Open a PDF in the reader: each passage you highlight can go straight into this paper as a quote, with its page. Close the reader to come back here."}</p>
    ${searchBox("PDF name")}
    <div class="ws-row"><label class="btn small ws-pick">Upload a PDF<input type="file" accept=".pdf,application/pdf" data-wp-up class="sr" tabindex="-1" aria-label="Upload a PDF"></label><span class="mini ws-grow">It's added to this assignment's files.</span></div>
    ${W.err ? `<p class="mini ws-err" role="alert">${esc(W.err)}</p>` : W.busy === "up" ? `<p class="mini" role="status">Uploading…</p>` : ""}
    ${groups.length ? groups.map(([h, l]) => `<h3 class="fsec">${esc(h)}</h3>${rowsHtml(l, mode === "attach" ? "data-wp-attach" : "data-wp-open", mode === "attach" ? "Attach" : "Open")}`).join("") : `<div class="ws-empty"><b>${P.q ? "Nothing matches." : "No PDFs here yet."}</b><p class="mini">Upload one above${mode === "hlpdf" ? ", or attach a PDF to a source on the Sources tab" : ""}.</p></div>`}`;
}
const WORD_ICON = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="3" fill="#185ABD"/><path d="M7 8l1.6 8L12 9.5 15.4 16 17 8" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
// Check My Doc: a Google Doc or a Word file can be linked from here (next to Upload and Choose From Studyboard)
function ldPickRow(w){
  const C = window.SBCLOUD, con = C && C.connected ? C.connected() : [], ic = p => (C && C.icons && C.icons[p]) || "";
  const b = (p, label, attr) => `<button type="button" class="btn small ws-ldb" ${con.includes(p) ? attr : `data-ws-ldcon title="Connect ${p === "google" ? "Google Drive" : "OneDrive"} first (Files, Cloud)"`} ${W.busy ? "disabled" : ""}>${ic(p)}<span>${label}</span></button>`;
  return `<div class="ws-row ws-ldrow"><span class="mini ws-grow">Or link the doc you're writing: Check reads it, and each Fix goes straight into it.</span>${b("google", "Google Doc From Google Drive", "data-ws-ldg")}${b("microsoft", "Word From OneDrive", "data-ws-ldw")}</div>
    ${w.ld && !ldOf(w) ? `<p class="mini ws-note">Linked: <b>${esc(w.ld.name || ldName(w.ld))}</b> · <button type="button" class="link-btn" data-ws-ldcheck>Check It</button> · <button type="button" class="link-btn" data-ws-ldoff>Unlink</button></p>` : ""}`;
}
// a linked doc, above its check: its name, Write in It Here (the doc itself, in the tab), Open, Unlink
function ldLinkedHtml(t, w){
  const l = ldOf(w); if (!l) return "";
  const C = window.SBCLOUD, ic = (C && C.icons && C.icons[l.p]) || "";
  const open = l.p === "google" ? `https://docs.google.com/document/d/${encodeURIComponent(l.id)}/edit` : l.url;
  const src = !W.ldShow ? "" : l.p === "google" ? open : W.ldPrev && W.ldPrev.id === l.id ? W.ldPrev.u : "";
  const word = W.ldShow && l.p === "microsoft" ? `<p class="mini ws-note">${src ? "Word for the web shows it here to read. To write in it, open it in Word for the web: Check and Fix work on the file either way." : W.ldPrev && W.ldPrev.id === l.id ? "Microsoft doesn't let Word for the web open inside another app for this account, so open it in Word to write. Check and Fix still work on the file here." : "Loading Word's preview…"}</p>` : "";
  if (l.p === "file") return `<div class="ws-ldtop"><div class="ws-ldh">${WORD_ICON}<span class="ws-ldk-t"><b>${esc(l.name || ldName(l))}</b><span class="mini">Your Word file, kept on this device: each Fix goes into it, and Download gives you the fixed file</span></span></div>
      <div class="ws-ldacts"><button type="button" class="btn small primary" data-ws-lddl>${w.draft.fx ? "Download Fixed File" : "Download"}</button><span class="spacer"></span><button type="button" class="ws-act" data-ws-ldoff>Unlink</button></div></div>`;
  return `<div class="ws-ldtop"><div class="ws-ldh">${ic}<span class="ws-ldk-t"><b>${esc(l.name || ldName(l))}</b><span class="mini">Your ${ldName(l)}, linked: Check reads it, and each Fix goes straight into it</span></span></div>
      <div class="ws-ldacts"><button type="button" class="btn small" data-ws-ldshow aria-expanded="${!!W.ldShow}">${W.ldShow ? "Hide It" : l.p === "google" ? "Write in It Here" : "Show It Here"}</button>${open ? `<a class="btn small" href="${esc(open)}" target="_blank" rel="noopener noreferrer">Open in ${ldApp(l)}</a>` : ""}<span class="spacer"></span><button type="button" class="ws-act" data-ws-ldoff>Unlink</button></div>${word}</div>
    ${W.ldShow ? `<div class="ws-ldwrap" data-k="${esc(src + (l.p === "microsoft" ? "#" + (W.ldKey || 0) : ""))}">${src ? `<iframe class="ws-ldf" src="${esc(src)}" title="${esc(l.name || ldName(l))} in ${ldApp(l)}" allow="clipboard-read; clipboard-write" referrerpolicy="strict-origin-when-cross-origin"></iframe>` : ""}</div>` : ""}`;
}
function ldWordHtml(){
  const L = W.ldList, D = W.ldDir || [{id: "root", name: "OneDrive"}], q = W.ldQ || "";
  const crumbs = q ? "" : `<div class="ws-ldcr">${D.map((d, i) => i < D.length - 1 ? `<button type="button" class="link-btn" data-ws-ldup="${i}">${esc(d.name)}</button><span aria-hidden="true">›</span>` : `<b>${esc(d.name)}</b>`).join("")}</div>`;
  const folders = L && L.folders && L.folders.length ? `<ul class="ws-flist">${L.folders.map(f => `<li><span class="ws-fn"><b>${esc(f.name)}</b><span class="mini">Folder</span></span><button type="button" class="btn small" data-ws-lddir="${esc(f.id)}">Open</button></li>`).join("")}</ul>` : "";
  const files = L && L.items.length ? rowsHtml(L.items.map(x => ({id: x.id, name: x.name, meta: x.at ? "Changed " + ago(x.at) : ""})), "data-ws-ldpick", "Link") : "";
  return `<p style="margin:0">Choose the Word file you're writing. Studyboard reads it on this device, and each Fix you tap is saved into it.</p>
    <div class="ws-add"><label class="f ws-grow"><span class="lh">Search Your OneDrive</span><input type="search" data-ws-ldq value="${esc(q)}" placeholder="File name" data-noenter></label></div>
    ${W.err ? `<p class="mini ws-err" role="alert">${esc(W.err)}</p>` : W.busy === "link" ? `<p class="mini" role="status">Reading your document…</p>` : W.ldNote ? `<p class="mini ws-note" role="status">${esc(W.ldNote)}</p>` : ""}
    ${crumbs}
    ${!L || L.busy ? `<p class="mini" role="status">Looking in your OneDrive…</p>` : files || folders ? `${files ? `<h3 class="fsec">${q ? "Matches" : "Word Files Here"}</h3>${files}` : ""}${folders ? `<h3 class="fsec">Folders</h3>${folders}` : ""}`
      : `<div class="ws-empty"><b>${q ? "No Word files match." : "No Word files or folders here."}</b><p class="mini">${q ? "Clear the search to look through your folders." : "Go back up, or search by name above."}</p></div>`}`;
}
function ldLoadList(){
  const q = W.ldQ || "", D = W.ldDir || (W.ldDir = [{id: "root", name: "OneDrive"}]), my = W.ldList = {busy: true, items: [], folders: []};
  const done = () => { if (W.view === "ldword" && shown() && W.ldList !== my) { draw(); const i = W.el.querySelector("[data-ws-ldq]"); if (i && q) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } } };
  W.err = ""; W.ldNote = "";
  ldWordList(q, D[D.length - 1].id).then(r => { if (W.ldList === my) W.ldList = r; })
    .catch(async e => {
      if (W.ldList !== my) return;
      // a search OneDrive won't do on this account: the folders instead
      if (q) { try { const r = await ldWordList("", D[D.length - 1].id); if (W.ldList === my) { W.ldList = r; W.ldNote = "OneDrive won't search this account, so here are your folders: open them to find your file."; } return; } catch (e2) { e = e2; } }
      if (W.ldList === my) { W.ldList = {items: [], folders: []}; W.err = ldErrText(e); }
    }).then(done);
}
function footHtml(t, w){
  const back = `<button type="button" class="btn" data-act="edit-task" data-id="${esc(t.id)}">Back to Task</button><span class="spacer"></span>`, cancel = `<button type="button" class="btn" data-ws-vback>Back</button><span class="spacer"></span>`;
  if (W.view === "zotero") { const z = zcred(), n = W.z && W.z.sel ? W.z.sel.size : 0; return cancel + (z ? `<button type="button" class="btn primary" data-wz-add ${n && !W.busy ? "" : "disabled"}>${W.busy === "z" ? "Adding…" : `Add ${n || ""} to This Paper`}</button>` : `<button type="button" class="btn primary" data-wz-connect ${W.busy ? "disabled" : ""}>${W.busy === "zc" ? "Connecting…" : "Connect"}</button>`); }
  if (W.view === "import") return cancel + (W.imp && W.imp.items ? `<button type="button" class="btn primary" data-wi-add>Add Selected</button>` : `<button type="button" class="btn primary" data-wi-read>Read</button>`);
  if (W.view === "library") return cancel + `<button type="button" class="btn primary" data-wl-add>Add Selected</button>`;
  if (W.view) return cancel;
  if (W.tab === "sources" && W.edit) return `<button type="button" class="btn" data-ws-cancel>Cancel</button><span class="spacer"></span><button type="button" class="btn primary" data-ws-esave>Save Source</button>`;
  if (W.tab === "sources") return back + (w.src.length ? `<button type="button" class="btn" data-ws-bibcopy>Copy List</button>${w.draft ? `<button type="button" class="btn" data-ws-refadd title="Put every source in your draft's ${esc(listOf(CITE.headingOf(styleOf(t, w), styleFmt(styleOf(t, w)))))} (made if there isn't one)">Add All to My Draft</button>` : ""}<button type="button" class="btn primary" data-ws-export>Export…</button>` : `<button type="button" class="btn primary" data-act="close">Done</button>`);
  if (W.tab === "quotes" && W.hlPick) return `<button type="button" class="btn" data-ws-hlcancel>Cancel</button><span class="spacer"></span>${W.hlPick.length ? `<button type="button" class="btn primary" data-ws-hladd ${W.busy ? "disabled" : ""}>${W.busy === "hl" ? "Adding…" : "Add Quotes"}</button>` : ""}`;
  if (W.tab === "outline") return back + (w.out.length || w.q.length ? `<button type="button" class="btn primary" data-ws-export>Export…</button>` : "");
  if (W.tab === "rubric") return W.rbFoot || back;
  if (W.tab === "check" || W.tab === "doc") return back + (w.draft && W.redo ? `<button type="button" class="btn" data-ws-redono>Cancel</button>` : "") + `<button type="button" class="btn primary" data-ws-check ${W.busy ? "disabled" : ""}>${w.draft && !W.redo ? "Check Again" : "Check My Citations"}</button>`;
  return back + `<button type="button" class="btn primary" data-act="close">Done</button>`;
}
function draw(fresh){
  if (W.hub) { drawHub(fresh); return; }
  const t = state.tasks[W.tid]; if (!t) { if (shown()) dlg.close(); return; }
  const w = wsOf(t), st = styleOf(t, w);
  const VIEW = {zotero: ["Zotero", () => zotHtml(t, w)], import: ["Import Sources", impHtml], library: ["My Library", () => libHtml(t, w)], styles: ["More Styles", findHtml],
    drafts: ["Choose Your Draft", () => draftsHtml(t)], attach: ["Attach a PDF", () => pdfPickHtml(t, w, "attach")], hlpdf: ["Open a PDF to Highlight", () => pdfPickHtml(t, w, "hlpdf")], ldword: ["Choose a Word File", ldWordHtml]}[W.view];
  if (!TABS.includes(W.tab) || (W.tab === "rubric" && !window.SBRUBRIC)) W.tab = "doc";
  // Rubric: the rubric check, drawn here (the paper on My Doc is what it reads)
  const RB = !VIEW && W.tab === "rubric" ? SBRUBRIC.tab(t, (w.draft || {}).t || "", () => { if (shown() && W.tab === "rubric" && !W.view) draw(); }) : null;
  W.rbFoot = RB ? RB.foot : "";
  const body = VIEW ? VIEW[1]() : W.tab === "quotes" ? quotesHtml(t, w) : W.tab === "outline" ? outlineHtml(t, w) : W.tab === "check" ? checkHtml(t, w) : W.tab === "doc" ? docTabHtml(t, w) : W.tab === "rubric" ? (RB ? RB.body : "") : W.edit ? editHtml(t, w) : sourcesHtml(t, w);
  const inner = `${(VIEW ? x => x : betaHead)(bandHead(VIEW ? VIEW[0] : "Writing Studio", ICON.replace('width="16" height="16"', ""), t.courseId ? colorOf(t.courseId) : "#2F6FE4", "", esc(t.title)))}
    ${VIEW ? "" : `<div class="ws-bar">${tabsHtml(w)}${styleSel(st)}</div>${stripHtml(t, w)}`}<div class="sheet-body ws-body" role="${VIEW ? "region" : "tabpanel"}">${body}</div><div class="sheet-foot">${footHtml(t, w)}</div>`;
  const y = !fresh && shown() ? (W.el.querySelector(".ws-body") || {}).scrollTop || 0 : 0;
  // My Doc's document stays open while the rest is drawn again (drawing it again would load it again, and lose your place in it)
  const keep = shown() && !VIEW && W.tab === "doc" ? W.el.querySelector(".ws-ldwrap") : null, tmp = keep ? document.createElement("div") : null;
  if (tmp) tmp.innerHTML = inner;
  const nw = tmp && tmp.querySelector(".ws-ldwrap"), ob = keep && W.el.querySelector(".ws-body"), nb = tmp && tmp.querySelector(".ws-body");
  if (nw && keep.dataset.k === nw.dataset.k && ob && nb && keep.firstChild) {
    [...ob.childNodes].forEach(n => { if (n !== keep) n.remove(); });
    [...nb.childNodes].forEach(n => { if (n !== nw) { if (n.compareDocumentPosition(nw) & Node.DOCUMENT_POSITION_FOLLOWING) ob.insertBefore(n, keep); else ob.appendChild(n); } });
    const kids = [...tmp.children], at = kids.indexOf(nb);
    [...W.el.children].forEach(c => { if (c !== ob) c.remove(); });
    kids.slice(0, at).forEach(c => W.el.insertBefore(c, ob)); kids.slice(at + 1).forEach(c => W.el.appendChild(c));
  } else if (shown()) W.el.innerHTML = inner;
  else { openSheet(`<div class="sheet ws-sheet">${inner}</div>`); W.el = dlg.querySelector(".ws-sheet"); }
  const b = W.el.querySelector(".ws-body"); if (b && y) b.scrollTop = y;
  wire(t);
  if (RB) SBRUBRIC.tabWire(W.el, t); else if (window.SBRUBRIC && SBRUBRIC.tabOff) SBRUBRIC.tabOff();
}

/* ---------- Export ---------- */
function exportSheet(t){
  const w = wsOf(t); if (!w.src.length && !w.q.length) return;
  // the choices open as a small panel at the top of the body, so the footer (and the list on a phone) keeps its size
  const ft = W.el.querySelector(".sheet-foot"), body = W.el.querySelector(".ws-body"), f = document.createElement("section");
  ft.innerHTML = `<button type="button" class="btn" data-ws-xback>Back</button><span class="spacer"></span>`;
  f.className = "ws-xp"; f.setAttribute("role", "region"); f.setAttribute("aria-label", "Export");
  f.innerHTML = `<h3 class="fsec">Export</h3><div class="ws-xp-b"><button type="button" class="btn primary" data-ws-x="docx">Word (.docx)</button><button type="button" class="btn" data-ws-x="gdoc">Google Docs</button><button type="button" class="btn" data-ws-x="text">Copy as Text</button></div>${W.tab === "sources" ? `<select data-ws-xsrc aria-label="Export the sources for another app"><option value="">For Zotero, Mendeley, EndNote…</option><option value="bib">BibTeX (.bib)</option><option value="ris">RIS (.ris)</option><option value="json">CSL-JSON (.json)</option></select>` : ""}`;
  if (body) { body.prepend(f); body.scrollTop = 0; } else ft.appendChild(f);
  ft.querySelector("[data-ws-xback]").addEventListener("click", () => draw());
  f.querySelectorAll("[data-ws-x]").forEach(b => b.addEventListener("click", () => doExport(state.tasks[t.id], b.dataset.wsX)));
  const xs = f.querySelector("[data-ws-xsrc]"); if (xs) xs.addEventListener("change", async () => {
    const k = xs.value; if (!k) return; const items = wsOf(state.tasks[t.id]).src, base = safeName(t.title);
    const [data, ext, mime] = k === "bib" ? [CITE.toBibTeX(items), "bib", "application/x-bibtex"] : k === "ris" ? [CITE.toRIS(items), "ris", "application/x-research-info-systems"] : [CITE.toCslJson(items), "json", "application/json"];
    if (await noteFileSave(`${base} - Sources.${ext}`, new TextEncoder().encode(data), mime)) toast(`${items.length} source${items.length === 1 ? "" : "s"} saved as ${k === "json" ? "CSL-JSON" : k === "bib" ? "BibTeX" : "RIS"}`);
    xs.value = "";
  });
}
const safeName = s => String(s || "Paper").replace(/[\\/:*?"<>|]+/g, "-").slice(0, 80) || "Paper";
/* The document: [{title}, {h}, {p: runs}, {q: runs, fn: runs (a footnote)}, {ref: runs, hang}] */
async function docModel(t){
  const w = wsOf(t), st = styleOf(t, w), note = styleFmt(st) === "note";
  try { await engineFor(st, w.src, w.lang); } catch (e) {}
  const out = [{title: t.title}], B = bibOf(t, w);
  const quote = q => { const c = q.sid ? citeOf(t, w, q.sid, q.p) : []; const body = [["“" + q.t + "”", {}]]; return note ? {q: body, fn: c} : {q: c.length ? body.concat([[" ", {}]], c) : body}; };
  w.out.forEach(s => {
    out.push({h: s.t});
    if (s.n && s.n.trim()) s.n.trim().split(/\n+/).forEach(l => out.push({p: [[l, {}]]}));
    w.q.filter(q => q.sec === s.id).forEach(q => out.push(quote(q)));
  });
  const loose = w.q.filter(q => !q.sec || !w.out.some(s => s.id === q.sec));
  if (loose.length) { out.push({h: w.out.length ? "Other Quotes" : "Quotes"}); loose.forEach(q => out.push(quote(q))); }
  if (w.src.length) { out.push({h: CITE.headingOf(st, styleFmt(st))}); B.entries.forEach(e => out.push({ref: e.runs, hang: B.hang})); }
  return out;
}
const xmlEsc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
function docx(model){
  const NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main", RNS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships", H = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
  const rpr = f => { const x = (f.i ? "<w:i/>" : "") + (f.b ? "<w:b/>" : "") + (f.sc ? "<w:smallCaps/>" : "") + (f.sup ? '<w:vertAlign w:val="superscript"/>' : f.sub ? '<w:vertAlign w:val="subscript"/>' : ""); return x ? `<w:rPr>${x}</w:rPr>` : ""; };
  const run = r => `<w:r>${rpr(r[1] || {})}<w:t xml:space="preserve">${xmlEsc(r[0])}</w:t></w:r>`;
  const notes = [];
  const body = model.map(b => {
    if (b.title != null) return `<w:p><w:pPr><w:pStyle w:val="Title"/></w:pPr>${run([b.title, {}])}</w:p>`;
    if (b.h != null) return `<w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr>${run([b.h, {}])}</w:p>`;
    if (b.q) { let fn = ""; if (b.fn && b.fn.length) { notes.push(b.fn); fn = `<w:r><w:rPr><w:rStyle w:val="FootnoteReference"/></w:rPr><w:footnoteReference w:id="${notes.length}"/></w:r>`; } return `<w:p><w:pPr><w:pStyle w:val="Quote"/></w:pPr>${b.q.map(run).join("")}${fn}</w:p>`; }
    if (b.ref) return `<w:p>${b.hang ? '<w:pPr><w:ind w:left="720" w:hanging="720"/></w:pPr>' : ""}${b.ref.map(run).join("")}</w:p>`;
    return `<w:p>${b.p.map(run).join("")}</w:p>`;
  }).join("");
  const sty = (id, name, rp, pp) => `<w:style w:type="paragraph" w:styleId="${id}"><w:name w:val="${name}"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr>${pp}</w:pPr><w:rPr>${rp}</w:rPr></w:style>`;
  const styles = H + `<w:styles xmlns:w="${NS}"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/><w:lang w:val="en-US"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="160" w:line="276" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>`
    + `<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style>`
    + sty("Title", "Title", '<w:b/><w:sz w:val="36"/><w:szCs w:val="36"/>', '<w:jc w:val="center"/><w:spacing w:after="240"/>')
    + sty("Heading1", "heading 1", '<w:b/><w:sz w:val="28"/><w:szCs w:val="28"/>', '<w:keepNext/><w:spacing w:before="320" w:after="120"/><w:outlineLvl w:val="0"/>')
    + sty("Quote", "Quote", '<w:color w:val="404040"/>', '<w:ind w:left="567"/><w:spacing w:after="120"/>')
    + sty("FootnoteText", "footnote text", '<w:sz w:val="20"/><w:szCs w:val="20"/>', '<w:spacing w:after="0" w:line="240" w:lineRule="auto"/>')
    + `<w:style w:type="character" w:styleId="FootnoteReference"><w:name w:val="footnote reference"/><w:rPr><w:vertAlign w:val="superscript"/></w:rPr></w:style></w:styles>`;
  const files = [
    {name: "[Content_Types].xml", data: H + `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>${notes.length ? '<Override PartName="/word/footnotes.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footnotes+xml"/>' : ""}</Types>`},
    {name: "_rels/.rels", data: H + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'},
    {name: "word/document.xml", data: H + `<w:document xmlns:w="${NS}" xmlns:r="${RNS}"><w:body>${body}<w:sectPr>${notes.length ? '<w:footnotePr><w:numFmt w:val="decimal"/></w:footnotePr>' : ""}<w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/></w:sectPr></w:body></w:document>`},
    {name: "word/_rels/document.xml.rels", data: H + `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>${notes.length ? '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footnotes" Target="footnotes.xml"/>' : ""}</Relationships>`},
    {name: "word/styles.xml", data: styles}
  ];
  if (notes.length) files.push({name: "word/footnotes.xml", data: H + `<w:footnotes xmlns:w="${NS}"><w:footnote w:type="separator" w:id="-1"><w:p><w:pPr><w:spacing w:after="0" w:line="240" w:lineRule="auto"/></w:pPr><w:r><w:separator/></w:r></w:p></w:footnote><w:footnote w:type="continuationSeparator" w:id="0"><w:p><w:pPr><w:spacing w:after="0" w:line="240" w:lineRule="auto"/></w:pPr><w:r><w:continuationSeparator/></w:r></w:p></w:footnote>`
    + notes.map((n, i) => `<w:footnote w:id="${i + 1}"><w:p><w:pPr><w:pStyle w:val="FootnoteText"/></w:pPr><w:r><w:rPr><w:rStyle w:val="FootnoteReference"/></w:rPr><w:footnoteRef/></w:r><w:r><w:t xml:space="preserve"> </w:t></w:r>${n.map(run).join("")}</w:p></w:footnote>`).join("") + `</w:footnotes>`});
  return zipMany(files);
}
function modelHtml(m){
  const fns = []; const html = m.map(b => b.title != null ? `<h1>${xmlEsc(b.title)}</h1>` : b.h != null ? `<h2>${xmlEsc(b.h)}</h2>`
    : b.q ? `<blockquote>${CITE.runsHtml(b.q)}${b.fn && b.fn.length ? (fns.push(b.fn), `<sup>${fns.length}</sup>`) : ""}</blockquote>` : b.ref ? `<p${b.hang ? ' style="padding-left:36pt;text-indent:-36pt"' : ""}>${CITE.runsHtml(b.ref)}</p>` : `<p>${CITE.runsHtml(b.p)}</p>`).join("");
  return html + (fns.length ? `<hr><h3>Notes</h3><ol>${fns.map(f => `<li>${CITE.runsHtml(f)}</li>`).join("")}</ol>` : "");
}
function modelText(m){
  const fns = []; const t = m.map(b => b.title != null ? b.title + "\n" : b.h != null ? "\n" + b.h.toUpperCase() : b.q ? "  " + CITE.runsText(b.q) + (b.fn && b.fn.length ? (fns.push(b.fn), `[${fns.length}]`) : "") : CITE.runsText(b.ref || b.p)).join("\n");
  return t + (fns.length ? "\n\nNOTES\n" + fns.map((f, i) => `${i + 1}. ${CITE.runsText(f)}`).join("\n") : "") + "\n";
}
async function doExport(t, how){
  const m = await docModel(t);
  if (how === "docx") { if (await noteFileSave(safeName(t.title) + (W.tab === "sources" ? " - " + CITE.headingOf(styleOf(t, wsOf(t)), styleFmt(styleOf(t, wsOf(t)))) : " - Outline") + ".docx", docx(W.tab === "sources" ? m.filter(b => b.title != null || b.ref || (b.h && /^(References|Works Cited|Bibliography|Reference list)$/.test(b.h))) : m), NX_MIME)) toast("Word file saved"); return; }
  const mm = W.tab === "sources" ? m.filter(b => b.ref || (b.h && /^(References|Works Cited|Bibliography|Reference list)$/.test(b.h))) : m;
  if (how === "gdoc") {
    let wn = null; try { wn = window.open(GDOC_NEW, "_blank", "noopener"); } catch (e) {}
    const ok = await noteCopyRich(modelHtml(mm), modelText(mm));
    toast(ok ? (wn ? "Copied. Paste into the new Google Doc with Ctrl+V (Cmd+V on a Mac)." : "Copied. Open a new Google Doc and paste with Ctrl+V (Cmd+V on a Mac).") : "Couldn't copy. Download the Word file instead.");
    return;
  }
  toast(await copyText(modelText(mm)) ? "Copied" : "Couldn't copy");
}
async function copyText(s){ try { await navigator.clipboard.writeText(s); return true; } catch (e) { try { const ta = document.createElement("textarea"); ta.value = s; ta.style.cssText = "position:fixed;left:-9999px"; document.body.appendChild(ta); ta.select(); const ok = document.execCommand("copy"); ta.remove(); return ok; } catch (e2) { return false; } } }
async function draftFromFile(file){
  const ext = (String(file.name).split(".").pop() || "").toLowerCase();
  if (file.size > 30 * 1024 * 1024) throw new Error("That file is too big. Use one under 30 MB.");
  const buf = new Uint8Array(await file.arrayBuffer());
  if (ext === "pdf") { const r = await pdfText(buf); return String((r && r.text) || ""); }
  if (ext === "docx") return await docxText(buf);
  if (/^(txt|md)$/.test(ext) || /^text\//.test(file.type)) return new TextDecoder().decode(buf);
  throw new Error("Choose a PDF, a Word file (.docx) or a text file.");
}

/* ---------- Zotero browsing ---------- */
async function zload(more){
  const z = zcred(); if (!z) return;
  const Z = W.z = W.z || {lib: "user", col: "", q: "", sel: new Set()};
  Z.busy = !more; W.err = ""; draw();
  try {
    if (!Z.cols || Z.colsFor !== Z.lib) {
      const {json} = await zget(`${zlibPath(Z.lib)}/collections?limit=100&sort=title`, z), byP = {};
      (json || []).forEach(c => { const p = (c.data && c.data.parentCollection) || ""; (byP[p] = byP[p] || []).push({key: c.key, name: (c.data && c.data.name) || "Untitled"}); });
      const flat = [], walk = (p, d) => (byP[p] || []).forEach(c => { flat.push(Object.assign(c, {depth: d})); if (d < 4) walk(c.key, d + 1); });
      walk("", 0); Z.cols = flat; Z.colsFor = Z.lib;
    }
    const start = more ? (Z.items || []).length : 0;
    const path = `${zlibPath(Z.lib)}${Z.col ? "/collections/" + encodeURIComponent(Z.col) : ""}/items/top?include=csljson&limit=50&start=${start}&sort=dateModified&direction=desc&itemType=-attachment%20||%20note${Z.q ? "&qmode=titleCreatorYear&q=" + encodeURIComponent(Z.q) : ""}`;
    const {json, total} = await zget(path, z);
    const items = (json || []).filter(x => x && x.csljson).map(x => ({key: x.key, csl: zItem(x, Z.lib)}));
    Z.items = more ? (Z.items || []).concat(items) : items; Z.total = total || Z.items.length;
  } catch (e) { W.err = e.message; if (e.code === "auth") { try { localStorage.removeItem(ZKEY); } catch (er) {} } }
  Z.busy = false; if (shown()) draw();
}
async function zsync(t){
  const z = zcred(), w = wsOf(state.tasks[t.id]), from = w.src.filter(s => s.zkey); if (!z || !from.length) return;
  W.busy = "zs"; W.err = ""; draw();
  try {
    const byLib = {}; from.forEach(s => { (byLib[s.zlib || "user"] = byLib[s.zlib || "user"] || []).push(s.zkey); });
    const fresh = {};
    for (const lib of Object.keys(byLib)) for (let i = 0; i < byLib[lib].length; i += 50) {
      const {json} = await zget(`${zlibPath(lib)}/items?include=csljson&itemKey=${byLib[lib].slice(i, i + 50).map(encodeURIComponent).join(",")}`, z);
      (json || []).forEach(x => { if (x.csljson) fresh[lib + ":" + x.key] = zItem(x, lib); });
    }
    const w2 = wsOf(state.tasks[t.id]); let n = 0;
    w2.src = w2.src.map(s => { const f = s.zkey && fresh[(s.zlib || "user") + ":" + s.zkey]; if (!f) return s; n++; return Object.assign(f, {id: s.id, fid: s.fid}); });
    save(state.tasks[t.id], w2, `Updated ${n} source${n === 1 ? "" : "s"} from Zotero`); W.okMsg = `Updated ${n} source${n === 1 ? "" : "s"} from Zotero.`;
  } catch (e) { W.err = e.message; }
  W.busy = ""; if (shown()) draw();
}

/* ---------- The draft and its check ---------- */
async function readFileText(f){ let x = ""; try { x = window.SBFILETEXT ? String(await SBFILETEXT(f.id, 400000) || "").trim() : ""; } catch (e) { x = ""; } return x.replace(/\s/g, "").length >= 20 ? x : ""; }
// keeps a draft on the paper, then checks it
function useDraft(tid, text, o){
  const t = state.tasks[tid]; if (!t) return;
  const w = wsOf(t); w.draft = makeDraft(text, o); w.style = w.style || styleOf(t, w);
  save(t, w, null);
  Object.assign(W, {paste: "", redo: false, busy: "", err: "", show: null, view: "", tab: "check"});
  doCheck(state.tasks[tid], {first: true});
}
// a draft picked in Studyboard: "f:<file id>" or "n:<note id>"
async function pickDraft(tid, key){
  const id = String(key || "").slice(2);
  if (/^n:/.test(key)) { const n = state.notes[id]; if (!n) return; useDraft(tid, String(n.text || ""), {from: noteTitle(n), nid: n.id}); return; }
  const f = state.files[id]; if (!f) return;
  W.busy = "read"; W.err = ""; draw();
  const x = await readFileText(f);
  if (!x) { W.busy = ""; W.err = `Couldn't read the text in ${f.name} (a scan, or not on this device yet). Paste your draft instead.`; if (shown()) draw(); return; }
  useDraft(tid, x, {from: f.name, fid: f.id, r: (curRev(f) || {}).assetId || ""});
}
/* Auto-fix: certain changes to the saved draft (CITE.applyEdits), then a new check. A draft from a note changes the note too (one Undo for both),
   so the next check, which reads the note again, keeps the fix; a note that's been edited since stays as it is and the draft becomes Writing
   Studio's own copy. A draft from a file is Writing Studio's copy: Copy Fixed Draft takes it back to the document. */
const refsMap = (t, w) => { const B = bibOf(t, w); return B.ready ? Object.fromEntries(B.entries.map(e => [e.id, CITE.runsText(e.runs)])) : null; };
async function fixDraft(t, edits, label){
  const d = wsOf(state.tasks[t.id]).draft; if (!d || !edits || !edits.length) return 0;
  const r = CITE.applyEdits(d.t, edits); if (!r.n) { W.err = "Your draft changed since it was checked. Check it again, then fix."; draw(); return 0; }
  return saveFixed(t, r.text, r.n, label, [edits]);
}
// the fixed text saved (one Undo, with the note when the draft is a note's), then checked again
async function saveFixed(t, text, count, label, rounds){
  if (ldOf(wsOf(state.tasks[t.id]))) return ldFix(t, count, rounds);
  const w = wsOf(state.tasks[t.id]), d = w.draft, r = {text, n: count};
  let nid = d.nid; const n = nid && state.notes[nid], more = [];
  if (n) { const raw = String(n.text || "").replace(/\r\n?/g, "\n"); if (raw === d.t) more.push({kind: "note", id: n.id, after: Object.assign(clone(n), {text: r.text, updated: Date.now()})}); else nid = undefined; }
  w.draft = Object.assign(makeDraft(r.text, {from: d.from, fid: d.fid, nid, r: d.r}), {fx: (d.fx || 0) + r.n});
  const lbl = label || (r.n === 1 ? "Fixed a citation in your draft" : `Fixed ${r.n} things in your draft`);
  W.okMsg = `${r.n === 1 ? "Fixed 1 thing" : `Fixed ${r.n} things`} in ${more.length ? `your note, ${noteTitle(n)}` : "Writing Studio's copy of your draft"}.${more.length ? "" : " Copy the fixed draft back into your document."} Undo puts it back.`;
  W.err = ""; await doCheck(state.tasks[t.id], {quiet: true, w, label: lbl, more});
  return r.n;
}
// Fix All: every certain fix, in rounds (each checked again, as one fix can move the next) until there's nothing more, then saved as one change
async function fixAll(t){
  const w = wsOf(state.tasks[t.id]); if (!w.draft) return;
  const st0 = styleOf(state.tasks[t.id], w); if (!engNow(st0, w.src, w.lang)) { try { await engineFor(st0, w.src, w.lang); } catch (e) {} }
  let text = w.draft.t, total = 0; const rounds = [];
  for (let round = 0; round < 6; round++) {
    const res = runCheck(state.tasks[t.id], w, text), edits = res.issues.flatMap(x => x.edits || []); if (!edits.length) break;
    const r = CITE.applyEdits(text, edits); if (!r.n) break; text = r.text; total += r.n; rounds.push(edits);
  }
  const linked = ldOf(w);
  const done = total ? await saveFixed(t, text, total, `Fixed ${total === 1 ? "1 thing" : total + " things"} in your draft`, rounds) : 0;
  if (linked) { if (done) W.okMsg += " What's left needs you."; else if (!total) W.okMsg = "Nothing more can be fixed for you: what's left needs your own words."; if (shown()) draw(); return; }
  W.okMsg = total ? `Fixed ${total === 1 ? "1 thing" : total + " things"} in ${wsOf(state.tasks[t.id]).draft.nid ? "your note" : "Writing Studio's copy of your draft"}. What's left needs you. Undo puts it back.` : "Nothing more can be fixed for you: what's left needs your own words.";
  if (shown()) draw();
}
// Sources tab: Add to My Draft puts these sources' entries in the draft's list (in order), or makes the list
async function addToDraftRefs(t, ids){
  let w = wsOf(state.tasks[t.id]); if (!w.draft) return;
  const st0 = styleOf(state.tasks[t.id], w); if (!engNow(st0, w.src, w.lang)) { try { await engineFor(st0, w.src, w.lang); } catch (e) {} }
  w = wsOf(state.tasks[t.id]); const refs = refsMap(state.tasks[t.id], w);
  if (!refs) { W.err = "The citation style is still loading. Try again in a moment."; draw(); return; }
  const a = CITE.refAdd(w.draft.t, ids ? w.src.filter(s => ids.includes(s.id)) : w.src, refs, {num: styleFmt(st0) === "numeric", head: CITE.headingOf(st0, styleFmt(st0))});
  if (a.numbered) { W.err = "Your list is numbered in the order you cite each source, so add these by hand (Copy List gives you each entry)."; draw(); return; }
  if (!a.edits.length) { W.okMsg = a.already.length ? "Every source is already in your draft's list." : "No sources to add yet."; draw(); return; }
  const n = await fixDraft(state.tasks[t.id], a.edits, a.made ? "Added a reference list to your draft" : `Added ${plural(a.added.length, "source")} to your draft's list`);
  if (n && ldOf(wsOf(state.tasks[t.id]))) W.okMsg = `${a.made ? `Made a ${CITE.headingOf(st0, styleFmt(st0))} list at the end of` : `Added ${plural(a.added.length, "source")} to the list in`} your ${ldName(wsOf(state.tasks[t.id]).ld)}, ${wsOf(state.tasks[t.id]).ld.name}${a.already.length ? ` (${a.already.length === 1 ? "1 was" : a.already.length + " were"} already there)` : ""}.`;
  else if (n) W.okMsg = `${a.made ? `Made a ${CITE.headingOf(st0, styleFmt(st0))} list at the end of your draft with ${plural(a.added.length, "source")}` : `Added ${plural(a.added.length, "source")} to your draft's list, in order`}${a.already.length ? ` (${a.already.length === 1 ? "1 was" : a.already.length + " were"} already there)` : ""}.`;
  if (shown()) draw();
}
/* My Doc: a Google Doc or a Word file (in OneDrive) linked to the paper. Check reads it (LIVEDOC), and each fix is made in the document
   itself: Google Docs through the Docs API (only on the version that was read), Word by changing the file's text where it is and saving
   it back (only if it hasn't changed since). Undo puts the same text back in the document. Google Drive's access is drive.file, so a doc
   is only reachable once it's been chosen in Google's own window. */
const MS_NO_ONEDRIVE = "Microsoft says the account connected for OneDrive has no OneDrive: it's a work or school account whose organization isn't licensed for OneDrive (SharePoint). In Files, Cloud, disconnect OneDrive and connect a personal Microsoft account (Outlook, Hotmail or Live) or a school account that has OneDrive.";
const LDU = {docs: "https://docs.googleapis.com/v1/documents/", graph: "https://graph.microsoft.com/v1.0"};
const ldName = l => l && l.p === "google" ? "Google Doc" : "Word file";
const ldApp = l => l && l.p === "google" ? "Google Docs" : l && l.p === "file" ? "" : "Word for the web";
// a Word file uploaded from the computer: kept on this device (IndexedDB), changed there by each Fix, and downloaded again with Download
const DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document", ldKey = l => "wsdoc:" + l.id;
// the link, when the saved draft is the linked document's text
const ldOf = w => w && w.ld && w.draft && w.draft.ld ? w.ld : null;
const ldItem = l => l.drive ? `${LDU.graph}/drives/${encodeURIComponent(l.drive)}/items/${encodeURIComponent(l.id)}` : `${LDU.graph}/me/drive/items/${encodeURIComponent(l.id)}`;
class LdErr extends Error { constructor(msg, code){ super(msg); this.code = code || ""; } }
const ldCloud = () => { const C = window.SBCLOUD; if (!C || !C.docApi) throw new LdErr("Google Drive and OneDrive aren't available here. Sign in to your Studyboard account first."); return C; };
const ldErrText = e => (e && e.message) || "Couldn't reach your document. Check your connection.";
// a Word file's look (its styles.xml too, when it has one)
function ldWLay(dom, parts){
  try { const sx = parts && parts["word/styles.xml"], st = sx ? new DOMParser().parseFromString(new TextDecoder().decode(sx), "application/xml") : null; return LIVEDOC.wLayout(dom, st && !st.getElementsByTagName("parsererror").length ? st : null); } catch (e) { return null; }
}
// what a linked doc looks like, kept with the text it goes with (on this device: a draft that came from elsewhere is shown plainly)
const LAY = {};
function keepLay(tid, raw, lay){
  if (!lay) return; const N = LIVEDOC.norm(raw), h = CITE.hash(CITE.capDraft(N.text, MAX_DRAFT));
  LAY[tid] = {h, raw, lay}; idbSet("wslay:" + tid, {h, raw, lay}).catch(() => {});
}
async function ldDocx(buf){
  const big = [], parts = await unzipBytes(buf, () => true, {big, max: 60e6, entries: 4000});
  if (big.length || !parts["word/document.xml"]) throw new LdErr("Couldn't read that Word file.");
  const dom = new DOMParser().parseFromString(new TextDecoder().decode(parts["word/document.xml"]), "application/xml");
  if (dom.getElementsByTagName("parsererror").length) throw new LdErr("Couldn't read that Word file.");
  return {dom, parts};
}
async function ldRead(l){
  if (l.p === "file") {
    const b = await idbGet(ldKey(l)).catch(() => null);
    if (!b) throw new LdErr(`${l.name || "That Word file"} is kept on the device it was uploaded from. Upload it again here (Upload Draft).`);
    const X = await ldDocx(await b.arrayBuffer());
    return {raw: LIVEDOC.wIndex(X.dom).raw, dom: X.dom, parts: X.parts, ver: "", name: l.name, url: "", lay: ldWLay(X.dom, X.parts)};
  }
  const C = ldCloud();
  if (l.p === "google") {
    const r = await C.docApi("google", LDU.docs + encodeURIComponent(l.id), null, "raw");
    if (r.status === 404) throw await ldGoogle404(C, l, r);
    if (!r.ok) throw await ldApiErr(r, "Google Docs");
    const j = await r.json().catch(() => null);
    if (!j || !j.body) throw new LdErr("Google didn't send the document. Check that it's still in your Drive.");
    const G = LIVEDOC.gText(j); let lay = null; try { lay = LIVEDOC.gLayout(j); } catch (e) {}
    return {raw: G.raw, G, ver: String(j.revisionId || ""), name: String(j.title || l.name || ""), lay};
  }
  const mr = await C.docApi("microsoft", ldItem(l) + "?$select=id,name,eTag,webUrl,size", null, "raw");
  if (!mr.ok) throw await ldApiErr(mr, "OneDrive");
  const meta = await mr.json().catch(() => ({}));
  if (!/\.docx$/i.test(String(meta.name || l.name || ""))) throw new LdErr("That isn't a Word file (.docx).");
  if (Number(meta.size) > 40e6) throw new LdErr("That Word file is too big to read here.");
  const r = await C.docApi("microsoft", ldItem(l) + "/content", null, "raw");
  if (!r || !r.ok) throw new LdErr(`OneDrive didn't send the file (${r ? r.status : "no answer"}).`);
  const {dom, parts} = await ldDocx(await r.arrayBuffer());
  return {raw: LIVEDOC.wIndex(dom).raw, dom, parts, ver: String(meta.eTag || ""), name: String(meta.name || l.name || ""), url: String(meta.webUrl || ""), lay: ldWLay(dom, parts)};
}
// an API's refusal, in its own words (Google's and Microsoft's errors both say what's wrong)
async function ldApiErr(r, who){
  let m = ""; try { const j = await r.json(); m = String((j && j.error && (j.error.message || j.error.code)) || "").slice(0, 220).replace(/[.\s]+$/, ""); } catch (e) {}
  if (who === "OneDrive" && /SPO license/i.test(m)) return new LdErr(MS_NO_ONEDRIVE);
  if (who === "Google Docs" && /has not been used|is disabled|SERVICE_DISABLED/i.test(m)) return new LdErr("The Google Docs API isn't turned on for this Studyboard server yet.");
  return new LdErr(`${who} didn't accept that (${r.status})${m ? ": " + m : ""}.`);
}
// Google Docs says a chosen doc isn't there: ask Google Drive about the same file, so the message says which side is refusing and why
async function ldGoogle404(C, l, r){
  const why = async x => { try { const j = await x.json(); return String((j && j.error && (j.error.message || j.error.status)) || "").slice(0, 160).replace(/[.\s]+$/, ""); } catch (e) { return ""; } };
  const docs = await why(r); let drive = "";
  try { const d = await C.docApi("google", "https://www.googleapis.com/drive/v3/files/" + encodeURIComponent(l.id) + "?fields=id,name,mimeType&supportsAllDrives=true", null, "raw"); const dw = d.ok ? "" : await why(d); drive = d.ok ? "ok" : `${d.status}${dw ? " " + dw : ""}`; } catch (e) { drive = "no answer"; }
  const app = C.pickerApp ? C.pickerApp() : "";
  if (drive === "ok") return new LdErr(`Google Drive can open that doc, but Google Docs says it isn't there (${docs || "404"}). Check that the Google Docs API is turned on in the same Google Cloud project as Studyboard's Drive sign-in.`);
  return new LdErr(`Google didn't give Studyboard access to that doc. Choose it again in Google's window. (Google Docs: ${docs || "404"}. Google Drive: ${drive}.${app ? ` Picker app ID ${app}: it must be the project number of Studyboard's Google sign-in.` : ""})`);
}
const ldChanged = l => new LdErr(`Your ${ldName(l)} changed since it was checked`, "changed");
// rounds of edits, each on the (tidy) text the one before left, made in the document; what the document says afterwards
async function ldPush(l, base, rounds){
  const C = l.p === "file" ? null : ldCloud();
  if (l.p === "google") {
    let text = base;
    for (const edits of rounds) {
      const R = await ldRead(l), N = LIVEDOC.norm(R.raw); if (N.text !== text) throw ldChanged(l);
      const A = CITE.applyEdits(text, edits); if (!A.n) continue;
      const requests = LIVEDOC.gRequests(R.G, LIVEDOC.toRaw(R.raw, N, A.plan)); if (!requests) throw ldChanged(l);
      const r = await C.docApi("google", LDU.docs + encodeURIComponent(l.id) + ":batchUpdate", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({requests, writeControl: {requiredRevisionId: R.ver}})}, "raw");
      if (r.status === 400) throw ldChanged(l);
      if (r.status === 403) { const e = await ldApiErr(r, "Google Docs"); throw /turned on/.test(e.message) ? e : new LdErr("Google Docs didn't let Studyboard change it: you may only be allowed to view or comment on it."); }
      if (!r.ok) throw await ldApiErr(r, "Google Docs");
      text = A.text;
    }
    const R = await ldRead(l); return {raw: R.raw, ver: R.ver, want: text, lay: R.lay};
  }
  const R = await ldRead(l); let text = base;
  if (LIVEDOC.norm(R.raw).text !== text) throw ldChanged(l);
  for (const edits of rounds) {
    const A = CITE.applyEdits(text, edits); if (!A.n) continue;
    const raw = LIVEDOC.wIndex(R.dom).raw; LIVEDOC.wApply(R.dom, LIVEDOC.toRaw(raw, LIVEDOC.norm(raw), A.plan)); text = A.text;
  }
  let xml = new XMLSerializer().serializeToString(R.dom); if (!/^<\?xml/.test(xml)) xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\r\n' + xml;
  R.parts["word/document.xml"] = new TextEncoder().encode(xml);
  const body = zipMany(Object.keys(R.parts).map(name => ({name, data: R.parts[name]})));
  if (l.p === "file") { await idbSet(ldKey(l), new Blob([body], {type: DOCX})); return {raw: LIVEDOC.wIndex(R.dom).raw, ver: "", want: text, lay: ldWLay(R.dom, R.parts)}; }
  const r = await C.docApi("microsoft", ldItem(l) + "/content", {method: "PUT", headers: {"Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "If-Match": R.ver}, body}, "raw");
  if (r.status === 412) throw ldChanged(l);
  if (r.status === 423) throw new LdErr("Word has the file locked right now. Wait a moment, or close it in Word, then fix again.");
  if (!r.ok) throw await ldApiErr(r, "OneDrive");
  const j = await r.json().catch(() => ({}));
  return {raw: LIVEDOC.wIndex(R.dom).raw, ver: String(j.eTag || ""), want: text, lay: ldWLay(R.dom, R.parts)};
}
// what puts rounds of fixes back: the same places, the other way round, last round first
function ldInverse(base, rounds){
  const out = []; let text = base;
  rounds.forEach(edits => {
    const A = CITE.applyEdits(text, edits); let shift = 0; const inv = [];
    A.plan.slice().reverse().forEach(e => { inv.push({at: e.at + shift, len: e.to.length, from: e.to, to: e.from}); shift += e.to.length - e.len; });
    out.unshift(inv); text = A.text;
  });
  return out;
}
// the paper's draft from what the document says now
function ldSetDraft(t, raw, l, fx, wIn){
  const N = LIVEDOC.norm(raw), w = wIn || wsOf(state.tasks[t.id]);
  w.ld = Object.assign({}, w.ld || l, {big: N.text.length > MAX_DRAFT});
  w.draft = N.text ? Object.assign(makeDraft(N.text, {from: w.ld.name || ldName(l), ld: true}), {fx: fx || 0}) : null;
  return w;
}
// Check reads the document again first; null when it can't be read (the reason is shown)
async function ldRefresh(t){
  let w = wsOf(state.tasks[t.id]); const l = ldOf(w); if (!l) return w;
  W.busy = "read"; if (shown()) draw();
  try {
    const R = await ldRead(l); W.busy = ""; keepLay(t.id, R.raw, R.lay);
    if (R.name && R.name !== l.name) w.ld = Object.assign({}, l, {name: R.name});
    if (LIVEDOC.norm(R.raw).text !== w.draft.t || R.name !== l.name) { w = ldSetDraft(t, R.raw, w.ld, w.draft.fx); if (!w.draft) { save(state.tasks[t.id], w, null); W.err = `Your ${ldName(l)} is empty. Write in it, then check again.`; if (shown()) draw(); return null; } }
    return w;
  } catch (e) { W.busy = ""; W.err = `Couldn't read ${l.name || "your " + ldName(l)}: ${ldErrText(e)}`; if (shown()) draw(); return null; }
}
async function ldFix(t, count, rounds){
  const w0 = wsOf(state.tasks[t.id]), l = ldOf(w0), base = w0.draft.t;
  if (l.big) { W.err = `Your ${ldName(l)} is too long for Writing Studio to fix in place. Fix it by hand from the list.`; draw(); return 0; }
  W.busy = "fix"; W.err = ""; W.okMsg = ""; if (shown()) draw();
  let out;
  try { out = await ldPush(l, base, rounds); }
  catch (e) {
    W.busy = "";
    if (e.code === "changed") { await doCheck(state.tasks[t.id], {quiet: true}); W.err = `Your ${ldName(l)} changed since it was checked, so nothing was fixed. It's been checked again: fix from what it says now.`; }
    else W.err = ldErrText(e);
    if (shown()) draw(); return 0;
  }
  W.busy = ""; W.ldKey = (W.ldKey || 0) + 1; if (W.ldSeen) delete W.ldSeen[l.id];
  keepLay(t.id, out.raw, out.lay);
  const w = ldSetDraft(t, out.raw, l, (w0.draft.fx || 0) + count), inv = ldInverse(base, rounds), fixed = w.draft ? w.draft.t : "";
  W.okMsg = `${count === 1 ? "Fixed 1 thing" : `Fixed ${count} things`} in your ${ldName(l)}, ${l.name}.${LIVEDOC.norm(out.raw).text === out.want ? "" : " It was being changed at the same time, so check what it says."}${l.p === "file" ? " Download it to get the fixed file." : ""}`;
  await doCheck(state.tasks[t.id], {quiet: true, w, label: null});
  const msg = W.okMsg;
  toast(`${count === 1 ? "Fixed 1 thing" : `Fixed ${count} things`} in your ${ldName(l)}`, async () => {
    try {
      const back = await ldPush(l, fixed, inv); W.ldKey++; keepLay(t.id, back.raw, back.lay);
      const w2 = ldSetDraft(t, back.raw, l, Math.max(0, (wsOf(state.tasks[t.id]).draft || {fx: 0}).fx - count));
      W.okMsg = `Put ${l.name} back as it was.`; await doCheck(state.tasks[t.id], {quiet: true, w: w2, label: null}); toast(`Put your ${ldName(l)} back`);
    } catch (e) { toast(e.code === "changed" ? `Your ${ldName(l)} has changed since, so it wasn't put back. Its version history has the earlier version.` : ldErrText(e), null, null, {error: true}); }
  });
  W.okMsg = msg; if (shown()) draw();
  return count;
}
// link a document: read it, and make it the paper's draft
async function ldLink(t, l){
  W.busy = "link"; W.err = ""; W.okMsg = ""; draw();
  try {
    const R = await ldRead(l); keepLay(t.id, R.raw, R.lay);
    const link = ldNorm(Object.assign({}, l, {name: R.name || l.name, url: R.url || l.url}));
    if (!link) throw new LdErr("Couldn't link that document.");
    const w = wsOf(state.tasks[t.id]); w.ld = link;
    const w2 = ldSetDraft(t, R.raw, link, 0, w); w2.style = w2.style || styleOf(state.tasks[t.id], w2);
    save(state.tasks[t.id], w2, `Linked ${link.name}`);
    Object.assign(W, {busy: "", view: "", tab: "doc", redo: false, pick: null, ldList: null, ldShow: false, okMsg: w2.draft ? "" : `${link.name} is empty: write in it, then tap Check My Citations.`});
    if (w2.draft) await doCheck(state.tasks[t.id], {first: true, w: w2, label: null}); else draw(true);
  } catch (e) { W.busy = ""; W.err = ldErrText(e); draw(); }
}
// Word files in OneDrive: recent ones, or ones whose name matches
// Word files in OneDrive: a folder's Word files and folders (as Files, Cloud reads OneDrive), or a search by name. OneDrive's search and its
// recent-files list are refused on some personal accounts ("Tenant does not have a SPO license"), so the folders always work without them.
const ldRow = x => { const it = x.remoteItem || x; return {id: String(it.id || ""), drive: String(((it.parentReference || {}).driveId) || ((x.parentReference || {}).driveId) || ""), name: String(x.name || it.name || ""), url: String(x.webUrl || it.webUrl || ""), at: Date.parse(x.lastModifiedDateTime || it.lastModifiedDateTime || "") || 0, folder: !!(x.folder || it.folder)}; };
async function ldWordList(q, dir){
  const C = ldCloud(), qq = String(q || "").trim();
  const url = qq ? `${LDU.graph}/me/drive/root/search(q='${encodeURIComponent(qq.replace(/'/g, "''"))}')`
    : `${LDU.graph}/me/drive/items/${encodeURIComponent(dir || "root")}/children?$select=id,name,file,folder,webUrl,lastModifiedDateTime,parentReference&$top=200`;
  const r = await C.docApi("microsoft", url, null, "raw");
  if (!r.ok) throw await ldApiErr(r, "OneDrive");
  const j = await r.json().catch(() => null), seen = new Set(), rows = (j && Array.isArray(j.value) ? j.value : []).map(ldRow).filter(x => x.id && !seen.has(x.id) && seen.add(x.id));
  return {folders: qq ? [] : rows.filter(x => x.folder).sort((a, b) => a.name.localeCompare(b.name)), items: rows.filter(x => !x.folder && /\.docx$/i.test(x.name)).sort((a, b) => b.at - a.at).slice(0, 60)};
}
// Kept up to date: while My Doc shows a linked doc, its version is asked for every few seconds (one small request); when it changes (you
// wrote in it, here or in Google Docs or Word), it's read again, shown and checked. A hidden window or a fix in progress waits its turn.
const ldVersion = async l => {
  const C = ldCloud();
  if (l.p === "google") { const r = await C.docApi("google", "https://www.googleapis.com/drive/v3/files/" + encodeURIComponent(l.id) + "?fields=version&supportsAllDrives=true", null, "raw"); if (!r.ok) return ""; const j = await r.json().catch(() => ({})); return String(j.version || ""); }
  const j = await C.docApi("microsoft", ldItem(l) + "?$select=cTag,eTag", null, "maybe"); return j ? String(j.cTag || j.eTag || "") : "";
};
function ldWatch(t){
  const w0 = wsOf(state.tasks[t.id]), l = ldOf(w0); if (!l || l.p === "file" || W.ldTimer) return;
  W.ldSeen = W.ldSeen || {};
  const stop = () => { clearInterval(W.ldTimer); W.ldTimer = 0; };
  const tick = async () => {
    const tt = state.tasks[t.id], ww = tt && wsOf(tt), lw = ww && ldOf(ww);
    if (!shown() || W.hub || W.tid !== t.id || W.tab !== "doc" || W.view || !lw || lw.id !== l.id) { stop(); return; }
    if (document.hidden || W.busy || W.ldTick) return;
    W.ldTick = true;
    try {
      const v = await ldVersion(l);
      if (v && W.ldSeen[l.id] && v !== W.ldSeen[l.id] && !W.busy) { W.ldSeen[l.id] = v; W.pop = null; await doCheck(state.tasks[t.id], {quiet: true}); if (shown() && W.tab === "doc") draw(); }
      else if (v) W.ldSeen[l.id] = v;
    } catch (e) {} finally { W.ldTick = false; }
  };
  W.ldTimer = setInterval(tick, l.p === "google" ? 3000 : 5000); tick();
}
// Word shows a file inside another page only as a preview; Microsoft's preview address, when it's one the app may show
async function ldPreview(l){
  try { const j = await ldCloud().docApi("microsoft", ldItem(l) + "/preview", {method: "POST", headers: {"Content-Type": "application/json"}, body: "{}"}, "maybe"); const u = j && String(j.getUrl || ""); return /^https:\/\/(onedrive\.live\.com|view\.officeapps\.live\.com)\//.test(u) ? u : ""; } catch (e) { return ""; }
}
// Check (again): a draft from a file or note in Studyboard is read again first when that file or note has changed since
async function doCheck(t, o){
  o = o || {}; if (!t) return;
  let w = o.w || wsOf(state.tasks[t.id]); if (!w.draft) return;
  if (o.reread && w.draft.fid && state.files[w.draft.fid]) {
    const f = state.files[w.draft.fid], rv = (curRev(f) || {}).assetId || "";
    if (rv && rv !== w.draft.r) { W.busy = "read"; draw(); const x = await readFileText(f); W.busy = ""; if (x) { w = wsOf(state.tasks[t.id]); w.draft = makeDraft(x, {from: f.name, fid: f.id, r: rv}); W.okMsg = `Read the newer version of ${f.name}.`; } }
  }
  if (!o.w && ldOf(w)) { const nw = await ldRefresh(t); if (!nw) return; w = nw; }
  if (o.reread && w.draft.nid && state.notes[w.draft.nid]) { const n = state.notes[w.draft.nid], d = makeDraft(String(n.text || ""), {from: noteTitle(n), nid: n.id}); if (d.h !== w.draft.h) { w.draft = d; W.okMsg = `Read the latest ${noteTitle(n)}.`; } }
  // the style's own references come from citeproc: load it first, so the saved counts match what's shown
  { const st0 = styleOf(state.tasks[t.id] || t, w); if (!engNow(st0, w.src, w.lang)) { try { await engineFor(st0, w.src, w.lang); } catch (e) {} } }
  const cur = state.tasks[t.id]; if (!cur) return;
  const res = runCheck(cur, w, w.draft.t), prev = w.chk;
  // a replaced draft is compared with the last check too: what the new version fixed, and what it brought
  W.diff = prev ? CITE.diffIssues(prev.keys, res) : null;
  w.chk = {at: Date.now(), h: w.draft.h, keys: CITE.issueKeys(res).slice(0, 60), err: res.issues.filter(x => x.k === "err").length, warn: res.issues.filter(x => x.k === "warn").length, cited: res.cited, total: res.total};
  // a fix is saved with its check, as one change (so one Undo takes the fix back, check and all)
  save(cur, w, o.w ? o.label : null, null, o.w ? o.more : undefined);
  W.show = null; if (!o.quiet && !o.first) W.okMsg = W.okMsg && /^Read the/.test(W.okMsg) ? W.okMsg : "";
  findInDraft(state.tasks[t.id]);
  if (shown() && W.tid === t.id) { draw(); const r = W.el.querySelector(".ws-found") || W.el.querySelector(".ws-res"); if (r && r.scrollIntoView && !o.quiet) r.scrollIntoView({block: "nearest"}); }
}
// What the draft has that the paper doesn't yet: entries in its reference list, and quoted passages with a citation
function findInDraft(t){
  const w = wsOf(t), d = w.draft; if (!d) { W.found = null; return; }
  let F = W.found && W.found.tid === t.id && W.found.h === d.h ? W.found : null;
  if (!F) {
    const seen = [], refs = [];
    CITE.refEntries(d.t).forEach(raw => { const it = CITE.parseRef(raw); if (!it || CITE.dupOf(it, seen)) return; seen.push(it); refs.push({k: uid(), raw, it, st: it.DOI || it.ISBN ? "look" : "parsed"}); });
    F = W.found = {tid: t.id, h: d.h, refs, quotes: [], sel: new Set(), touched: new Set()};
    refs.forEach(r => { r.dup = !!CITE.dupOf(r.it, w.src); if (!r.dup) F.sel.add(r.k); });
    lookups(t.id, F).then(() => autoAdd(t.id, F));
  } else F.refs.forEach(r => { r.dup = r.dup || !!CITE.dupOf(r.it, w.src); });
  foundQuotes(t, F);
}
function foundQuotes(t, F){
  const w = wsOf(state.tasks[t.id]), have = w.q.map(q => normText(q.t)).filter(Boolean), st = styleOf(t, w);
  const order = styleFmt(st) === "numeric" ? bibOf(t, w).entries.map(e => e.id) : null, old = new Map((F.quotes || []).map(q => [q.nt, q]));
  F.quotes = CITE.quotesIn(w.draft.t, w.src, {order}).map(q => Object.assign(q, {nt: normText(q.t)})).filter(q => !have.some(h => q.nt.includes(h) || h.includes(q.nt))).map(q => {
    // one that now has its source (just added) is ticked, unless the student already chose
    const o = old.get(q.nt); if (o) { if (!o.sid && q.sid && !F.touched.has(o.k)) F.sel.add(o.k); return Object.assign(q, {k: o.k, sid: o.sid || q.sid}); }
    const k = uid(); if (q.sid) F.sel.add(k); return Object.assign(q, {k});
  });
}
// entries with a DOI or ISBN are looked up for their full details (only the number is sent), three at a time
// The draft's reference list becomes the paper's sources by itself: each entry that isn't a source yet is added (with its full details when its
// DOI or ISBN could be looked up), once per version of the draft, as one change with Undo. Then the draft is checked against them.
function autoAdd(tid, F){
  const t = state.tasks[tid]; if (!t || W.found !== F || !wsOf(t).draft) return;
  const w = wsOf(t), picks = F.refs.filter(r => !r.dup && !CITE.dupOf(r.it, w.src));
  // added and checked as one change (so one Undo takes them all back)
  let n = 0; picks.forEach(r => { r.dup = true; F.sel.delete(r.k); if (w.src.length >= MAX_SRC || CITE.dupOf(r.it, w.src)) return; w.src.push(Object.assign(CITE.clean(Object.assign({}, r.it, r.st === "ok" ? {} : {rv: "1"})), {id: uid()})); n++; });
  w.style = w.style || styleOf(t, w);
  // and the quotations the paper already has, with the citation after them saying whose they are, go onto the Quotes tab (with their page)
  const have = w.q.map(x => normText(x.t)).filter(Boolean), order = styleFmt(styleOf(t, w)) === "numeric" ? bibOf(t, w).entries.map(e => e.id) : null, now = Date.now();
  const qs = CITE.quotesIn(w.draft.t, w.src, {order}).filter(x => x.sid && w.src.some(y => y.id === x.sid)).filter(x => { const nt = normText(x.t); return nt && !have.some(h => nt.includes(h) || h.includes(nt)) && have.push(nt); });
  qs.forEach(x => { if (w.q.length >= MAX_Q) return; const sr = w.src.find(y => y.id === x.sid); w.q.push({id: uid(), sid: sr.id, t: x.t.slice(0, 1200), p: String(x.p || "").slice(0, 12), fid: sr.fid || "", hl: "", sec: "", at: now}); });
  if (!n && !qs.length) return;
  const rv = picks.some(r => r.st !== "ok"), parts = [n ? plural(n, "source") + " from your draft's list to Sources" : "", qs.length ? plural(qs.length, "quote") + " from your paper to Quotes" : ""].filter(Boolean);
  if (W.tid === tid) W.okMsg = `Added ${parts.join(", and ")}${rv && n ? ". The sources read from your list (no DOI or ISBN) are marked there: check their details" : ""}.`;
  doCheck(t, {quiet: true, w, label: `Added ${parts.map(x => x.replace(/ from your .*/, "")).join(" and ")} from your paper`});
}
async function lookups(tid, F){
  const todo = F.refs.filter(r => r.st === "look" && !r.dup); let i = 0;
  const one = async () => {
    while (i < todo.length) {
      const r = todo[i++];
      try { const rec = await lookup(r.it.DOI ? {kind: "doi", v: r.it.DOI} : {kind: "isbn", v: r.it.ISBN}); if (r.it.URL && !rec.URL) rec.URL = r.it.URL; r.it = rec; r.st = "ok"; } catch (e) { r.st = "parsed"; }
      if (W.found !== F) return;
      const t = state.tasks[tid]; if (t && CITE.dupOf(r.it, wsOf(t).src)) { r.dup = true; F.sel.delete(r.k); }
      redrawSoon(tid);
    }
  };
  await Promise.all([one(), one(), one()]);
}
let redrawT2 = 0;
function redrawSoon(tid){
  clearTimeout(redrawT2);
  redrawT2 = setTimeout(() => {
    if (!shown() || W.tid !== tid || W.hub || W.view || W.tab !== "check") return;
    const a = document.activeElement; if (a && W.el.contains(a) && /^(INPUT|TEXTAREA)$/.test(a.tagName) && a.type !== "checkbox") return;
    draw();
  }, 80);
}
// Attach PDF: a source gets its PDF, so it can be highlighted
function attachPdf(tid, sid, fid){
  const t = state.tasks[tid], f = state.files[fid]; if (!t || !f) return;
  const w = wsOf(t), s = w.src.find(x => x.id === sid); if (!s) { W.view = ""; draw(true); return; }
  if (w.src.some(x => x.fid === fid && x.id !== sid)) { W.err = `${f.name} is already the PDF of another source.`; draw(); return; }
  w.src = w.src.map(x => x.id === sid ? Object.assign({}, x, {fid}) : x);
  save(t, w, `${f.name} attached`);
  if (!(f.taskIds || []).includes(tid)) applyChanges([{kind: "file", id: f.id, after: Object.assign(clone(f), {taskIds: (f.taskIds || []).concat([tid])})}], null);
  Object.assign(W, {view: "", attachFor: "", pick: null, err: "", okMsg: `${f.name} is attached. Highlight PDF opens it: each passage you highlight can go in as a quote.`});
  draw(true);
}

/* ---------- Without a paper: My Library and Zotero, from Review ---------- */
function openHub(view){
  if (window.SBPRO && SBPRO.locked()) { PLAN.openSheet(PRO_WHY); return; }
  RD = null;
  Object.assign(W, {hub: view === "zotero" ? "zotero" : "library", tid: "", tab: "", view: "", err: "", busy: "", okMsg: "", hubTo: W.hubTo || ""});
  if (W.hub === "zotero" && zcred() && !(W.z && W.z.items)) { draw(true); zload(); return; }
  draw(true);
}
const openPapers = () => allTasks().filter(x => x.status !== "done" && eligible(x)).sort((a, b) => (hasData(b) - hasData(a)) || String(a.due || "9").localeCompare(String(b.due || "9"))).slice(0, 40);
function hubHtml(){
  const ps = openPapers(), to = W.hubTo && ps.some(p => p.id === W.hubTo) ? W.hubTo : (ps[0] || {}).id || "";
  const paperSel = `<label class="ws-style ws-to"><span class="mini">Add to</span><select data-wh-to aria-label="Paper to add sources to">${ps.length ? ps.map(p => `<option value="${esc(p.id)}" ${p.id === to ? "selected" : ""}>${esc(cut(p.title, 48))}</option>`).join("") : `<option value="">No open papers</option>`}</select></label>`;
  if (W.hub === "zotero") return `${paperSel}${zotHtml(null, {src: to && state.tasks[to] ? wsOf(state.tasks[to]).src : []})}`;
  const L = library(""), st = W.hubStyle || "apa";
  const B = (() => { const items = L.map((s, i) => Object.assign(CITE.clean(s), {id: "L" + i})), eng = engNow(st, items, ""); if (!eng) { engineFor(st, items, "").then(() => { if (shown() && W.hub === "library") draw(); }).catch(() => {}); return null; } try { return eng.bib(); } catch (e) { return null; } })();
  const runsFor = i => { const e = B && B.entries.find(x => x.id === "L" + i); return e ? e.runs : CITE.plain(L[i]); };
  const where = s => allTasks().filter(x => x.ws && Array.isArray(x.ws.src) && x.ws.src.some(y => CITE.dupOf(s, [y]))).map(x => x.title);
  return `<p style="margin:0">Every source in every paper, once each. Copy a reference in any style, or add it to another paper.</p>
    <div class="ws-row">${styleSel(st).replace("data-ws-style", "data-wh-style").replace('<option value="__find">More styles…</option>', "")}${paperSel}</div>
    ${W.okMsg ? `<p class="mini ws-ok" role="status">${esc(W.okMsg)}</p>` : ""}
    ${L.length ? `<ol class="ws-refs hang">${L.map((s, i) => `<li class="ws-ref"><p class="ws-cite">${citeHtml(runsFor(i))}</p><p class="mini ws-info">In ${esc(where(s).join(", "))}</p>
      <div class="ws-acts"><button type="button" class="ws-act" data-wh-copy="${i}">Copy</button><button type="button" class="ws-act" data-wh-add="${i}" ${to ? "" : "disabled"}>Add to Paper</button></div></li>`).join("")}</ol>`
      : `<div class="ws-empty"><b>Your library is empty.</b><p class="mini">Sources you add to any paper show up here.</p></div>`}`;
}
function drawHub(fresh){
  const z = W.hub === "zotero", title = z ? "Zotero" : "My Library", n = W.z && W.z.sel ? W.z.sel.size : 0;
  const foot = `<button type="button" class="btn" data-wh-switch>${z ? "My Library" : "Zotero"}</button><span class="spacer"></span>${z ? (zcred() ? `<button type="button" class="btn primary" data-wz-add ${n && !W.busy ? "" : "disabled"}>${W.busy === "z" ? "Adding…" : `Add ${n || ""} to Paper`}</button>` : `<button type="button" class="btn primary" data-wz-connect ${W.busy ? "disabled" : ""}>${W.busy === "zc" ? "Connecting…" : "Connect"}</button>`) : `<button type="button" class="btn primary" data-act="close">Done</button>`}`;
  const inner = `${bandHead(title, ICON.replace('width="16" height="16"', ""), "#2F6FE4", "", "Writing Studio")}<div class="sheet-body ws-body" role="region">${hubHtml()}</div><div class="sheet-foot">${foot}</div>`;
  const y = !fresh && shown() ? (W.el.querySelector(".ws-body") || {}).scrollTop || 0 : 0;
  if (shown()) W.el.innerHTML = inner;
  else { openSheet(`<div class="sheet ws-sheet ws-hub">${inner}</div>`); W.el = dlg.querySelector(".ws-sheet"); }
  const b = W.el.querySelector(".ws-body"); if (b && y) b.scrollTop = y;
  const R = W.el, q = s => R.querySelector(s), qa = s => [...R.querySelectorAll(s)], on = (sel, ev, fn) => { const el = q(sel); if (el) el.addEventListener(ev, fn); return el; };
  const target = () => { const ps = openPapers(); return state.tasks[W.hubTo] && ps.some(p => p.id === W.hubTo) ? state.tasks[W.hubTo] : ps[0] || null; };
  const ts = on("[data-wh-to]", "change", () => { W.hubTo = ts.value; draw(); });
  const ss = on("[data-wh-style]", "change", () => { W.hubStyle = ss.value; draw(); });
  on("[data-wh-switch]", "click", () => openHub(z ? "library" : "zotero"));
  qa("[data-wh-copy]").forEach(b => b.addEventListener("click", async () => { const el = b.closest(".ws-ref").querySelector(".ws-cite"); toast(await noteCopyRich(el.innerHTML, el.textContent) ? "Reference copied" : "Couldn't copy"); }));
  qa("[data-wh-add]").forEach(b => b.addEventListener("click", () => { const t = target(); if (!t) return; const x = Object.assign({}, library("")[Number(b.dataset.whAdd)]); delete x.from; delete x.id; const r = addItems(t, [x], `Added to ${t.title}`); if (!r.added) toast(`Already in ${t.title}`); }));
  wireZot(R, target, () => draw());
}
/* A paper's opening lines, read as a reader would (the card shows its title and body, without the header lines): the header (student, teacher, course, date: MLA's, before the title) or a title page
   (the title first, then the lines under it), the title, then where the body starts. Short lines before the first real paragraph are the
   front matter; a date, a course code, a teacher's title (Dr., Prof., Ms.…) and a person's name are told apart, and the title is the line
   after the date (MLA) or the one that's none of those. */
const PM = "jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec";
const P_DATE = new RegExp(`^(?:\\w+,\\s+)?(?:\\d{1,2}[/.-]\\d{1,2}[/.-]\\d{2,4}|\\d{4}-\\d{2}-\\d{2}|(?:${PM})[a-z]*\\.?\\s+\\d{1,2}(?:st|nd|rd|th)?,?\\s+\\d{4}|\\d{1,2}(?:st|nd|rd|th)?\\s+(?:${PM})[a-z]*\\.?,?\\s+\\d{4})$`, "i");
const P_COURSE = /\b[A-Z]{2,5}\s?-?\d{2,4}[A-Z]?\b|\b(course|class|section|period|module|seminar|lecture)\b/;
const P_TEACH = /^(dr|prof|professor|mr|mrs|ms|mx|miss|sir|madam|instructor|teacher|tutor|lecturer)\b\.?/i;
const P_NAME = /^(?!(?:the|a|an|on|in|of|why|how|what|when|where|who|is|are|do|does|my|our)\b)[\p{Lu}][\p{L}'’-]+(?:\s+(?:[\p{Lu}][\p{L}'’.-]*|de|van|von|da|di|le|la)){1,3}(?:,?\s*[(\[]?[\w-]*\d{4,}[\w-]*[)\]]?)?$/iu;
const P_SCHOOL = /\b(university|college|school|department|institute|faculty|academy)\b/i;
function paperParts(raw){
  const lines = String(raw || "").split("\n").map(l => l.replace(/\s+/g, " ").trim()); const head = []; let i = 0, n = 0;
  for (; i < lines.length && n < 9; i++) {
    const l = lines[i]; if (!l) continue; n++;
    if (/^\d{1,3}$/.test(l) || /^(running head|page \d)/i.test(l)) continue;
    if (l.length > 110 || (l.split(/\s+/).length > 14 && /[.!?]["”’)]?$/.test(l))) break;
    head.push({t: l});
  }
  if (!head.length || head.length > 7 || i >= lines.length) return {head: [], title: "", body: lines.join(" ").replace(/\s+/g, " ").trim(), page: false};
  let named = 0;
  head.forEach(h => { const l = h.t; h.k = P_DATE.test(l) ? "date" : P_TEACH.test(l) ? "teacher" : P_SCHOOL.test(l) ? "school" : P_NAME.test(l) && !P_COURSE.test(l) ? (named++ ? "teacher" : "name") : P_COURSE.test(l) && l.split(/\s+/).length <= 6 ? "course" : "other"; });
  const d = head.findIndex(h => h.k === "date");
  // MLA: the title is the line after the date. A title page (APA) starts with the title, and its date (if any) is last
  let ti = d >= 0 && d < head.length - 1 ? d + 1 : -1;
  if (ti < 0 && head.length > 1 && head[0].k === "other") ti = 0;
  if (ti < 0) { const o = head.map((h, k) => h.k === "other" ? k : -1).filter(k => k >= 0); ti = o.length ? o[o.length - 1] : head.length === 1 ? 0 : -1; }
  const title = ti >= 0 ? head[ti].t : "", rest = head.filter((h, k) => k !== ti);
  return {head: rest, title, body: lines.slice(i).filter(Boolean).join(" "), page: ti === 0 && rest.length > 0};
}
// The Writing view in Review: papers with Writing Studio, and essays and reports coming up
function reviewHtml(){
  const today = todayISO(), f = typeof ui !== "undefined" && ui.filter && ui.filter !== "all" ? ui.filter : "";
  const list = allTasks().filter(t => eligible(t) && (!f || t.courseId === f) && (hasData(t) ? t.status !== "done" || (t.due && t.due >= addDays(today, -14)) : t.status !== "done" && t.due && t.due >= today && t.due <= addDays(today, 45)))
    .sort((a, b) => (hasData(b) - hasData(a)) || String(a.due || "9").localeCompare(String(b.due || "9"))).slice(0, 40);
  const pro = window.SBPRO && SBPRO.locked() ? ' <span class="pro-badge">PRO</span>' : "";
  // a card like Concept Maps': a peek at the paper itself (its draft's opening words on a page, citations marked), its course, how its
  // check stands and its linked doc; then its title, when it's due and how far along it is
  const card = t => {
    const w = wsOf(t), c = courseOf(t.courseId), ck = w.chk && w.draft && w.chk.h === w.draft.h ? w.chk : null, open = `data-act="ws-open" data-id="${esc(t.id)}"`;
    const line = hasData(t) ? [plural(w.src.length, "source"), plural(w.q.length, "quote"), !w.draft ? "no draft yet" : !ck ? "not checked yet" : ck.err ? `last check: ${ck.err} to fix` : "last check: all good"].join(" · ") : "Not started in Writing Studio";
    const badge = pro ? ["pro", "Pro"] : !hasData(t) ? ["new", "Not Started"] : !w.draft ? ["none", "No Draft Yet"] : !ck ? ["wait", "Not Checked"] : ck.err ? ["bad", `${ck.err} to Fix`] : ck.warn ? ["warn", `${ck.warn} to Look At`] : ["good", "All Good ✓"];
    const PP = w.draft ? paperParts(w.draft.t) : null;
    const snip = PP ? esc(cut(PP.body, 340)).replace(/\([^()]{2,70}?(?:1[5-9]\d\d|20\d\d|n\.d\.)[a-z]?(?:,[^()]{0,20})?\)/g, m => `<mark>${m}</mark>`) : "";
    const ldIc = w.ld ? (w.ld.p === "google" ? '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M6 2h8l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" fill="#4285F4"/><path d="M14 2v5h5z" fill="#A1C2FA"/><path d="M8 12h8M8 15h8M8 18h5" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/></svg>' : WORD_ICON.replace(/width="22" height="22"/, 'width="18" height="18"')) : "";
    // the paper's own title (its name, teacher, course and date lines left out), then its body
    const page = `<span class="wsr-page" aria-hidden="true"><span class="wsr-ph">${esc(cut(PP && PP.title ? PP.title : t.title, 70))}</span>${snip ? `<span class="wsr-pt">${snip}</span>` : `<span class="wsr-pl"></span>`}</span>`;
    return `<li class="wsr-card" style="--c:${esc(colorOf(t.courseId))}">
      <button type="button" class="wsr-peekb" ${open} tabindex="-1" aria-hidden="true"><span class="wsr-back" aria-hidden="true"></span>${page}<span class="cm-cchip wsr-chip"><span class="fc-ic" aria-hidden="true">${c ? courseRingHtml(c) : GENERAL_ICON}</span>${esc(c ? courseLabel(c) : "General")}</span><span class="wsr-badge k-${badge[0]}">${badge[1]}</span>${ldIc ? `<span class="wsr-ld" title="${esc(w.ld.name || "Linked doc")}">${ldIc}</span>` : ""}</button>
      <div class="wsr-foot"><button type="button" class="wsr-main" ${open}><span class="wsr-t">${esc(t.title)}</span></button>
      <div class="wsr-row"><span class="wsr-sub"><span class="mini">${esc(t.due ? (t.status === "done" ? "Done" : relDue(t)) : "No due date")}</span><span class="mini wsr-l${ck && ck.err ? " bad" : ""}">${esc(line)}</span></span>
      <button type="button" class="btn small primary" ${open} aria-label="Open ${esc(t.title)} in Writing Studio">Open</button></div></div></li>`;
  };
  const started = list.filter(hasData), next = list.filter(t => !hasData(t));
  return `<div class="view-head"><h2>Writing Studio</h2><button class="btn small" data-act="ws-lib">My Library${pro}</button><button class="btn small" data-act="ws-zot">${ZICON} Zotero${pro}</button></div>
    ${typeof chipsHtml === "function" ? chipsHtml() : ""}
    ${list.length ? `${started.length ? `<ul class="wsr-list">${started.map(card).join("")}</ul>` : ""}${next.length ? `<h3 class="plan-sub">Coming Up</h3><ul class="wsr-list">${next.map(card).join("")}</ul>` : ""}`
      : `<div class="empty sb-es" style="margin-top:14px">${typeof emptyArt === "function" ? emptyArt("papers") : ""}<strong>No Papers Yet</strong>Essays, reports and projects with a due date show up here, ready for their sources, quotes and a citation check.</div>`}`;
}
// Today's Plan: on the due date or the day before, a saved draft that hasn't been checked since it changed gets one gentle row
function planNote(inView){
  const today = todayISO(), tmr = addDays(today, 1);
  const t = allTasks().filter(x => x.status !== "done" && (x.due === today || x.due === tmr) && eligible(x) && (!inView || inView(x))).find(x => { const w = wsOf(x); return w.draft && (!w.chk || w.chk.h !== w.draft.h); });
  if (!t) return null;
  const w = wsOf(t);
  return {k: "ready", main: `<b>${esc(t.title)}</b> is due ${t.due === today ? "today" : "tomorrow"}. Your saved draft ${w.chk ? "has changed since its last citation check" : "hasn't had a citation check yet"}: a quick one catches a missing reference.`,
    acts: `<button class="btn small primary" data-act="ws-open" data-id="${esc(t.id)}" data-ws-to="check">Check Citations</button>`};
}

/* ---------- Wiring ---------- */
let DRAG = "";
function wire(t){
  const R = W.el, q = s => R.querySelector(s), qa = s => [...R.querySelectorAll(s)];
  const cur = () => state.tasks[t.id], ws = () => wsOf(cur()), st = () => styleOf(cur(), ws());
  const on = (sel, ev, fn) => { const el = q(sel); if (el) el.addEventListener(ev, fn); return el; };
  const vback = q("[data-ws-vback]"); if (vback) vback.addEventListener("click", () => { W.view = ""; W.err = ""; draw(true); });
  // a toast about the last tab (e.g. "Started an outline · Undo") goes with it
  const goTab = (k, focus) => { if (k !== W.tab) { try { toastHide(); } catch (e) {} } W.tab = k; W.edit = null; W.err = ""; W.okMsg = ""; W.hlPick = null; W.qform = false; W.also = null; W.dOffer = null; W.pop = null; W.show = null; draw(true); if (focus) { const b = R.querySelector(`[data-ws-tab="${W.tab}"]`); if (b) b.focus(focus === "mouse" ? {preventScroll: true, focusVisible: false} : undefined); } };
  // a click keeps focus on the tab (for the arrow keys) without the keyboard focus ring; arrow keys still show it
  qa("[data-ws-tab]").forEach(b => b.addEventListener("click", () => goTab(b.dataset.wsTab, "mouse")));
  qa("[data-ws-go]").forEach(b => b.addEventListener("click", () => goTab(b.dataset.wsGo, false)));
  on(".ws-tabs", "keydown", e => { if (!/^Arrow(Left|Right)$|^(Home|End)$/.test(e.key)) return; e.preventDefault(); const i = TABS.indexOf(W.tab); goTab(e.key === "Home" ? TABS[0] : e.key === "End" ? TABS[TABS.length - 1] : TABS[(i + (e.key === "ArrowRight" ? 1 : TABS.length - 1)) % TABS.length], true); });
  const sel = on("[data-ws-style]", "change", () => {
    if (sel.value === "__find") { W.view = "styles"; W.find = W.find || {q: ""}; W.err = ""; draw(true); const i = q("[data-wy-q]"); if (i) i.focus(); return; }
    const w = ws(); w.style = sel.value; save(cur(), w, null); W.engErr = ""; W.show = null; draw();
  });
  // Sources
  const inp = q("[data-ws-in]");
  if (inp) { inp.addEventListener("input", () => { W.inp = inp.value; }); inp.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); addFromInput(cur(), inp.value); } }); }
  on("[data-ws-add]", "click", () => addFromInput(cur(), inp.value));
  on("[data-ws-manual]", "click", () => { W.edit = "new"; W.form = null; W.note = ""; W.err = ""; draw(true); });
  on("[data-ws-zot]", "click", () => { W.view = "zotero"; W.err = ""; draw(true); if (zcred() && !(W.z && W.z.items)) zload(); });
  on("[data-ws-imp]", "click", () => { W.view = "import"; W.imp = {}; W.err = ""; draw(true); });
  on("[data-ws-lib]", "click", () => { W.view = "library"; W.err = ""; draw(true); });
  on("[data-ws-zsync]", "click", () => zsync(cur()));
  const fsel = on("[data-ws-file]", "change", async () => { if (!fsel.value) return; W.busy = "add"; draw(); await addFromFile(cur(), fsel.value); W.busy = ""; if (shown()) draw(); });
  qa("[data-ws-edit]").forEach(b => b.addEventListener("click", () => { W.edit = b.dataset.wsEdit; W.form = null; W.note = ""; draw(true); }));
  qa("[data-ws-openf]").forEach(b => b.addEventListener("click", () => openReader(t.id, b.dataset.wsOpenf, 0)));
  qa("[data-ws-attach]").forEach(b => b.addEventListener("click", () => { W.view = "attach"; W.attachFor = b.dataset.wsAttach; W.pick = {q: ""}; W.err = ""; draw(true); }));
  qa("[data-ws-also]").forEach(b => b.addEventListener("click", () => { const ids = (W.also || {}).ids || []; alsoAdd(t.id, b.dataset.wsAlso, ids); b.disabled = true; b.textContent = "Added ✓"; }));
  on("[data-ws-alsono]", "click", () => { W.also = null; draw(); });
  qa("[data-ws-ccopy]").forEach(b => b.addEventListener("click", async () => { const c = citeOf(cur(), ws(), b.dataset.wsCcopy, ""), note = styleFmt(st()) === "note"; if (!c.length) return; toast(await noteCopyRich(CITE.runsHtml(c), CITE.runsText(c)) ? (note ? "Footnote copied" : "In-text citation copied") : "Couldn't copy"); }));
  qa("[data-ws-rm]").forEach(b => b.addEventListener("click", () => { const w = ws(), s = w.src.find(x => x.id === b.dataset.wsRm); w.src = w.src.filter(x => x.id !== b.dataset.wsRm); w.q = w.q.map(x => x.sid === b.dataset.wsRm ? Object.assign({}, x, {sid: ""}) : x); save(cur(), w, `Removed ${s && s.title ? "“" + String(s.title).slice(0, 40) + "”" : "a source"}`); draw(); }));
  qa("[data-ws-copy]").forEach(b => b.addEventListener("click", async () => { const B = bibOf(cur(), ws()), e = B.entries.find(x => x.id === b.dataset.wsCopy); if (!e) return; toast(await noteCopyRich(CITE.runsHtml(e.runs), CITE.runsText(e.runs)) ? "Reference copied" : "Couldn't copy"); }));
  on("[data-ws-bibcopy]", "click", async () => { const B = bibOf(cur(), ws()), s0 = st(), h = CITE.headingOf(s0, styleFmt(s0)); toast(await noteCopyRich(`<p><b>${xmlEsc(h)}</b></p>` + B.entries.map(x => `<p${B.hang ? ' style="padding-left:36pt;text-indent:-36pt"' : ""}>${CITE.runsHtml(x.runs)}</p>`).join(""), h + "\n\n" + B.entries.map(x => CITE.runsText(x.runs)).join("\n\n")) ? `${h} list copied` : "Couldn't copy"); });
  on("[data-ws-export]", "click", () => exportSheet(cur()));
  // the source form: the preview is made by citeproc with the same style
  if (W.edit && !W.view) {
    const prev = q("[data-ws-prev]");
    const refresh = async () => {
      const r = formRec(); r.id = r.id || "__new"; const s0 = st();
      try { const lib = await loadCiteproc(), sx = await styleXml(s0), loc = await localeXml(ws().lang); const e = CITE.engine(lib, sx, loc, [r], ws().lang), b = e.bib(); if (prev && b.entries[0]) prev.innerHTML = CITE.runsHtml(b.entries[0].runs) + (styleFmt(s0) === "note" ? "" : `<span class="mini ws-prevcite">In text: ${CITE.runsHtml(e.cite(r.id, ""))}</span>`); }
      catch (e) { if (prev) prev.innerHTML = CITE.runsHtml(CITE.plain(r)); }
    };
    qa("[data-wf]").forEach(el => el.addEventListener(el.tagName === "SELECT" ? "change" : "input", () => { if (el.dataset.wf === "type") { W.form = formRec(); draw(); return; } clearTimeout(W.pt); W.pt = setTimeout(refresh, 200); }));
    refresh();
    on("[data-ws-cancel]", "click", () => { W.edit = null; W.form = null; W.note = ""; draw(); });
    on("[data-ws-esave]", "click", () => {
      const r = formRec(); if (!r.title && !r.author) { toast("Add at least a title or an author"); return; }
      const w = ws();
      if (W.edit === "new") { if (CITE.dupOf(r, w.src)) { toast("That source is already in your list"); return; } r.id = uid(); w.src.push(r); }
      else w.src = w.src.map(x => x.id === r.id ? Object.assign(r, {fid: x.fid, zkey: x.zkey, zlib: x.zlib}) : x);
      w.src.forEach(x => { if (x.id === r.id) delete x.rv; });
      const added = W.edit === "new"; w.style = w.style || st(); save(cur(), w, added ? "Added a source" : "Edited a source"); W.also = added && otherPapers(cur()).length ? {ids: [r.id]} : null; W.edit = null; W.form = null; W.note = ""; draw();
    });
  }
  // Zotero
  wireZot(R, cur, r => { W.view = ""; W.okMsg = `Added ${r.added} from Zotero${r.dup ? `; ${r.dup} ${r.dup === 1 ? "was" : "were"} already here` : ""}.`; draw(true); });
  // Import
  const it = q("[data-wi-text]"); if (it) it.addEventListener("input", () => { W.imp = {text: it.value}; });
  const readImp = (txt, src) => { const r = CITE.parseAny(txt, src), w = ws(); if (!r.items.length) { W.err = "No sources found. Use a BibTeX (.bib), RIS (.ris) or CSL-JSON (.json) export."; W.imp = {text: txt, src}; } else { W.err = ""; W.imp = {text: txt, src, fmt: r.fmt, items: r.items, dup: r.items.map(x => !!CITE.dupOf(x, w.src))}; } draw(); };
  const ifi = on("[data-wi-file]", "change", async () => { const f = ifi.files && ifi.files[0]; if (!f) return; if (f.size > 5 * 1024 * 1024) { W.err = "That file is too big. Use one under 5 MB."; draw(); return; } readImp(await f.text(), f.name); });
  on("[data-wi-read]", "click", () => readImp((W.imp || {}).text || "", ""));
  on("[data-wi-add]", "click", () => { const I = W.imp, picks = qa("[data-wi-pick]").filter(c => c.checked).map(c => I.items[Number(c.dataset.wiPick)]); const r = addItems(cur(), picks, `Imported ${picks.length} source${picks.length === 1 ? "" : "s"}`), dup = r.dup + I.dup.filter(Boolean).length; W.view = ""; W.imp = null; W.okMsg = `Imported ${r.added} source${r.added === 1 ? "" : "s"}${dup ? `; ${dup} ${dup === 1 ? "was" : "were"} already here` : ""}.`; draw(true); });
  // My Library
  on("[data-wl-add]", "click", () => { const L = library(t.id), picks = qa("[data-wl-pick]").filter(c => c.checked).map(c => { const x = Object.assign({}, L[Number(c.dataset.wlPick)]); delete x.from; return x; }); const r = addItems(cur(), picks); W.view = ""; W.okMsg = r.added ? `Added ${r.added} from My Library.` : ""; draw(true); });
  // More styles
  const yq = q("[data-wy-q]"); if (yq) yq.addEventListener("input", () => {
    W.find.q = yq.value; clearTimeout(W.yt);
    W.yt = setTimeout(async () => {
      const qq = W.find.q.trim().toLowerCase(); if (qq.length < 2) { W.find.hits = null; draw(); return; }
      if (!STYLE_LIST) { W.find.busy = "Loading the style list from zotero.org…"; draw(); }
      try { const L = await styleList(); W.find.busy = ""; const words = qq.split(/\s+/); W.find.hits = L.filter(s => words.every(w2 => (s.title + " " + s.name).toLowerCase().includes(w2))).sort((a, b) => (a.dep - b.dep) || a.title.length - b.title.length).slice(0, 40); W.err = ""; }
      catch (e) { W.find.busy = ""; W.err = "Couldn't reach the Zotero Style Repository. Check your connection."; }
      if (shown() && W.view === "styles") { draw(); const i = q("[data-wy-q]") || W.el.querySelector("[data-wy-q]"); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }
    }, 250);
  });
  qa("[data-wy-use]").forEach(b => b.addEventListener("click", async () => {
    const id = b.dataset.wyUse; W.find.busy = "Adding the style…"; draw();
    try { if (!BUILT_FMT[id]) await fetchZoteroStyle(id); const w = ws(); w.style = id; save(cur(), w, `Citation style set to ${styleName(id)}`); W.view = ""; W.find = null; W.engErr = ""; draw(true); }
    catch (e) { W.find.busy = ""; W.err = "Couldn't add that style. Check your connection and try again."; draw(); }
  }));
  // Quotes
  on("[data-ws-hlpick]", "click", () => {
    const tt = cur(), w = ws(), have = new Set(w.q.map(x => x.hl).filter(Boolean)), fids = new Set(w.src.map(s => s.fid).filter(Boolean));
    Object.values(state.files).forEach(f => { if (isPdfFile(f) && (f.taskIds.includes(tt.id) || (tt.courseId && f.courseId === tt.courseId))) fids.add(f.id); });
    W.hlPick = [...fids].map(fid => state.files[fid]).filter(Boolean).map(f => ({fid: f.id, name: f.name, hl: hlOf(f).filter(h => !have.has(h.id)).sort((a, b) => a.p - b.p)})).filter(g => g.hl.length)
      .sort((a, b) => (w.src.some(s => s.fid === b.fid) - w.src.some(s => s.fid === a.fid)));
    draw(true);
  });
  on("[data-ws-hlcancel]", "click", () => { W.hlPick = null; draw(); });
  on("[data-ws-hladd]", "click", async () => {
    const picks = qa("[data-ws-hl]").filter(c => c.checked).map(c => c.dataset.wsHl.split(":"));
    if (!picks.length) { W.hlPick = null; draw(); return; }
    W.busy = "hl"; draw();
    const byFile = {};
    for (const [fid] of picks) if (!(fid in byFile)) { const s = await addFromFile(cur(), fid); byFile[fid] = s ? s.id : ""; }
    const w = ws(), now = Date.now();
    picks.forEach(([fid, hid]) => { const h = hlOf(state.files[fid]).find(x => x.id === hid); if (!h || w.q.length >= MAX_Q) return; w.q.push({id: uid(), sid: (w.src.find(s => s.fid === fid) || {}).id || byFile[fid] || "", t: String(h.t).slice(0, 1200), p: String(h.p || ""), fid, hl: h.id, sec: "", at: now}); });
    save(cur(), w, `Added ${picks.length} quote${picks.length === 1 ? "" : "s"}`); W.busy = ""; W.hlPick = null; draw();
  });
  on("[data-ws-qnew]", "click", () => { W.qform = !W.qform; draw(); const ta = W.el.querySelector("[data-wq-t]"); if (ta) ta.focus(); });
  on("[data-wq-save]", "click", () => {
    const tx = String(q("[data-wq-t]").value || "").trim().replace(/^["“]|["”]$/g, ""); if (!tx) { toast("Type or paste the quote first"); return; }
    const w = ws(); w.q.push({id: uid(), sid: q("[data-wq-s]").value, t: tx.slice(0, 1200), p: String(q("[data-wq-p]").value || "").trim().slice(0, 12), fid: "", hl: "", sec: "", at: Date.now()});
    save(cur(), w, "Added a quote"); W.qform = false; draw();
  });
  qa("[data-ws-qrm]").forEach(b => b.addEventListener("click", () => { const w = ws(); w.q = w.q.filter(x => x.id !== b.dataset.wsQrm); save(cur(), w, "Removed a quote"); draw(); }));
  qa("[data-ws-qcopy]").forEach(b => b.addEventListener("click", async () => { const w = ws(), x = w.q.find(y => y.id === b.dataset.wsQcopy), c = x.sid ? citeOf(cur(), w, x.sid, x.p) : [], note = styleFmt(st()) === "note"; toast(await copyText(`“${x.t}”${c.length ? (note ? "\n\nFootnote: " : " ") + CITE.runsText(c) : ""}`) ? "Quote copied with its citation" : "Couldn't copy"); }));
  qa("[data-ws-qopen]").forEach(b => b.addEventListener("click", () => { const x = ws().q.find(y => y.id === b.dataset.wsQopen); if (x) openReader(t.id, x.fid, Number(x.p) || 0); }));
  qa("[data-ws-hlpdf]").forEach(b => b.addEventListener("click", () => { W.view = "hlpdf"; W.pick = {q: ""}; W.err = ""; W.hlPick = null; draw(true); }));
  // Outline
  qa("[data-ws-seed]").forEach(b => b.addEventListener("click", () => {
    const w = ws(), names = b.dataset.wsSeed === "steps" ? allTasks().filter(x => x.breakdownOf === t.id).sort((a, c) => String(a.due).localeCompare(String(c.due))).map(x => String(x.step || x.title).replace(new RegExp("^" + String(t.title).replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\s*[:·-]\\s*", "i"), "")) : ["Introduction", "Body", "Conclusion"];
    w.out = names.slice(0, MAX_SEC).map(n => ({id: uid(), t: String(n).slice(0, 120), n: ""})); save(cur(), w, "Started an outline"); draw();
  }));
  qa("[data-ws-secadd]").forEach(b => b.addEventListener("click", () => { const w = ws(); if (w.out.length >= MAX_SEC) return; w.out.push({id: uid(), t: "New Section", n: ""}); save(cur(), w, "Added a section"); draw(); const last = W.el.querySelectorAll("[data-ws-sect]"); if (last.length) { last[last.length - 1].focus(); last[last.length - 1].select(); } }));
  qa("[data-ws-sect]").forEach(el => el.addEventListener("change", () => { const w = ws(); w.out = w.out.map(s => s.id === el.dataset.wsSect ? Object.assign({}, s, {t: el.value.trim().slice(0, 120) || "Untitled Section"}) : s); save(cur(), w, null); }));
  const grow = el => { el.style.height = "auto"; el.style.height = Math.min(220, el.scrollHeight + 2) + "px"; };
  qa("[data-ws-secn]").forEach(el => { grow(el); el.addEventListener("input", () => grow(el)); });
  qa("[data-ws-secn]").forEach(el => el.addEventListener("change", () => { const w = ws(); w.out = w.out.map(s => s.id === el.dataset.wsSecn ? Object.assign({}, s, {n: el.value.slice(0, 4000)}) : s); save(cur(), w, null); }));
  const mvSec = (id, d) => { const w = ws(), i = w.out.findIndex(s => s.id === id), j = i + d; if (i < 0 || j < 0 || j >= w.out.length) return; const [x] = w.out.splice(i, 1); w.out.splice(j, 0, x); save(cur(), w, null); draw(); };
  qa("[data-ws-up]").forEach(b => b.addEventListener("click", () => mvSec(b.dataset.wsUp, -1)));
  qa("[data-ws-dn]").forEach(b => b.addEventListener("click", () => mvSec(b.dataset.wsDn, 1)));
  qa("[data-ws-secrm]").forEach(b => b.addEventListener("click", () => { const w = ws(), s = w.out.find(x => x.id === b.dataset.wsSecrm); w.out = w.out.filter(x => x.id !== b.dataset.wsSecrm); w.q = w.q.map(x => x.sec === b.dataset.wsSecrm ? Object.assign({}, x, {sec: ""}) : x); save(cur(), w, `Removed the section ${s ? s.t : ""}`); draw(); }));
  const place = (qid, sec, beforeId) => {
    const w = ws(), i = w.q.findIndex(x => x.id === qid); if (i < 0) return;
    const [x] = w.q.splice(i, 1); x.sec = sec;
    let j = beforeId ? w.q.findIndex(y => y.id === beforeId) : -1;
    if (j < 0) { j = w.q.length; for (let k = w.q.length - 1; k >= 0; k--) if ((w.q[k].sec || "") === sec) { j = k + 1; break; } }
    w.q.splice(j, 0, x); save(cur(), w, null); draw();
  };
  qa("[data-ws-mv]").forEach(s => s.addEventListener("change", () => place(s.dataset.wsMv, s.value)));
  qa("[data-ws-dq]").forEach(li => {
    li.addEventListener("dragstart", e => { DRAG = li.dataset.wsDq; li.classList.add("is-drag"); try { e.dataTransfer.setData("text/plain", DRAG); e.dataTransfer.effectAllowed = "move"; } catch (er) {} });
    li.addEventListener("dragend", () => { li.classList.remove("is-drag"); DRAG = ""; qa(".ws-drop").forEach(d => d.classList.remove("is-over")); });
  });
  qa("[data-ws-drop]").forEach(d => {
    d.addEventListener("dragover", e => { if (!DRAG) return; e.preventDefault(); d.classList.add("is-over"); });
    d.addEventListener("dragleave", e => { if (!d.contains(e.relatedTarget)) d.classList.remove("is-over"); });
    d.addEventListener("drop", e => { if (!DRAG) return; e.preventDefault(); const over = e.target.closest && e.target.closest("[data-ws-dq]"); const id = DRAG; DRAG = ""; place(id, d.dataset.wsDrop, over && over.dataset.wsDq !== id ? over.dataset.wsDq : ""); });
  });
  // Check: the draft (pasted, uploaded, or picked from anywhere in Studyboard) is kept on the paper, then checked
  const dr = q("[data-ws-draft]"); if (dr) dr.addEventListener("input", () => { W.paste = dr.value; const n = wordsIn(W.paste), h = q("[data-ws-wc]"); if (h) h.textContent = n ? `about ${n} words` : ""; });
  const df = on("[data-ws-dfile]", "change", async () => {
    const f = df.files && df.files[0]; if (!f) return;
    W.busy = "read"; W.err = ""; draw();
    if (/\.docx$/i.test(f.name)) {
      if (f.size > 30 * 1024 * 1024) { W.busy = ""; W.err = "That file is too big. Use one under 30 MB."; draw(); return; }
      const l = {p: "file", id: "d" + uid().replace(/[^\w]/g, ""), name: f.name.slice(0, 200)};
      try { await idbSet(ldKey(l), new Blob([await f.arrayBuffer()], {type: DOCX})); } catch (e) { W.busy = ""; W.err = "Couldn't keep that file on this device. Paste the text instead."; draw(); return; }
      await ldLink(cur(), l); return;
    }
    try { const x = (await draftFromFile(f)).trim(); if (x.replace(/\s/g, "").length < 20) throw new Error(`${f.name} has no text that can be read (a scan?). Paste the text instead.`); useDraft(t.id, x, {from: f.name}); }
    catch (e) { W.busy = ""; W.err = e && e.message && !/^[a-z]/.test(e.message) ? e.message : `Couldn't read ${f.name}. Paste the text instead.`; draw(); }
  });
  on("[data-ws-dpick]", "click", () => { W.view = "drafts"; W.pick = {q: ""}; W.err = ""; draw(true); const i = q("[data-wp-q]") || W.el.querySelector("[data-wp-q]"); if (i && !matchMedia("(max-width:560px)").matches) i.focus(); });
  qa("[data-ws-dsel]").forEach(b => b.addEventListener("click", () => pickDraft(t.id, b.dataset.wsDsel)));
  on("[data-ws-offno]", "click", () => { W.offerOff = true; draw(); });
  on("[data-ws-redo]", "click", () => { W.redo = true; W.paste = ""; W.show = null; W.err = ""; W.pop = null; W.tab = "doc"; draw(true); });
  // My Doc: a click or a selection in the paper opens its menu there
  const rd = q("[data-ws-rd]");
  if (rd) {
    const wrap = rd.parentNode;
    const offAt = (node, off) => { const el = node.nodeType === 3 ? node.parentNode : node, p = el && el.closest ? el.closest("p[data-o]") : null; if (!p || !rd.contains(p)) return null; const r = document.createRange(); r.setStart(p, 0); try { r.setEnd(node, off); } catch (e) { return null; } return Number(p.dataset.o) + r.toString().length; };
    const paint = () => {
      let pop = wrap.querySelector(".ws-pop"); if (!W.pop) { if (pop) pop.remove(); const mk0 = wrap.querySelector(".ws-marks"); if (mk0) mk0.remove(); return; }
      if (!pop) { pop = document.createElement("div"); pop.className = "ws-pop"; pop.setAttribute("role", "dialog"); pop.setAttribute("aria-label", "Cite or quote"); wrap.appendChild(pop); }
      pop.innerHTML = popHtml(cur(), ws()); pop.classList.toggle("is-list", W.pop.mode === "cite" || W.pop.mode === "quote" || W.pop.mode === "qhere");
      // where you are: a blinking caret at the place clicked, or the selection kept marked
      let mk = wrap.querySelector(".ws-marks"); if (!mk) { mk = document.createElement("div"); mk.className = "ws-marks"; mk.setAttribute("aria-hidden", "true"); wrap.insertBefore(mk, pop); }
      mk.innerHTML = (W.pop.marks || []).map(m => `<span class="${m.w ? "ws-selm" : "ws-caret"}" style="left:${m.x}px;top:${m.y}px;height:${m.h}px${m.w ? `;width:${m.w}px` : ""}"></span>`).join("");
      pop.querySelectorAll("[data-ctx]").forEach(b => { const show = () => { const c = pop.querySelector(".ws-pop-ctx"); if (c) c.innerHTML = b.dataset.ctx; }; b.addEventListener("mouseenter", show); b.addEventListener("focus", show); });
      const ww = wrap.clientWidth, pw = Math.min(pop.offsetWidth || 300, ww - 8); pop.style.left = Math.max(4, Math.min(W.pop.x - pw / 2, ww - pw - 4)) + "px"; pop.style.top = W.pop.y + "px";
      pop.querySelectorAll("[data-ws-popm]").forEach(b => b.addEventListener("click", () => { W.pop.mode = b.dataset.wsPopm; paint(); }));
      pop.querySelectorAll("[data-ws-popx]").forEach(b => b.addEventListener("click", () => { W.pop = null; paint(); }));
      pop.querySelectorAll("[data-ws-go]").forEach(b => b.addEventListener("click", () => { W.pop = null; W.tab = b.dataset.wsGo; draw(true); }));
      pop.querySelectorAll("[data-ws-qhere]").forEach(b => b.addEventListener("click", () => quoteHere(cur(), b.dataset.wsQhere)));
      pop.querySelectorAll("[data-ws-pops]").forEach(b => b.addEventListener("click", () => { const sid = b.dataset.wsPops; if (W.pop.mode === "quote") quoteFromSel(cur(), sid); else citeHere(cur(), sid); }));
    };
    const pick = () => {
      const sel = getSelection(); if (!sel || !sel.rangeCount) return;
      const r = sel.getRangeAt(0); if (!rd.contains(r.startContainer) || !rd.contains(r.endContainer)) return;
      const a = offAt(r.startContainer, r.startOffset), b = offAt(r.endContainer, r.endOffset); if (a == null || b == null) return;
      const rc = (r.getClientRects().length ? r.getClientRects()[r.getClientRects().length - 1] : r.getBoundingClientRect()), wc = wrap.getBoundingClientRect();
      const marks = r.collapsed ? [{x: rc.left - wc.left, y: rc.top - wc.top, h: Math.max(14, rc.height)}] : [...r.getClientRects()].filter(q => q.width > 0.5).map(q => ({x: q.left - wc.left, y: q.top - wc.top, h: q.height, w: q.width}));
      W.pop = {a: Math.min(a, b), b: Math.max(a, b), mode: "main", x: rc.right - wc.left, y: rc.bottom - wc.top + 8, marks};
      paint();
    };
    rd.addEventListener("mouseup", () => setTimeout(pick, 0));
    rd.addEventListener("keyup", e => { if (/^(Arrow|Home|End|Shift)/.test(e.key)) pick(); });
    wrap.addEventListener("keydown", e => { if (e.key === "Escape" && W.pop) { e.stopPropagation(); W.pop = null; paint(); } });
    if (W.pop) paint();
  }
  on("[data-ws-redono]", "click", () => { W.redo = false; W.err = ""; draw(); });
  on("[data-ws-drm]", "click", () => { const w = ws(); w.draft = null; w.chk = null; save(cur(), w, "Draft removed from Writing Studio"); Object.assign(W, {found: null, show: null, diff: null, redo: false}); draw(); });
  on("[data-ws-dview]", "click", () => { W.show = W.show === "all" ? null : "all"; draw(); });
  qa("[data-ws-show]").forEach(b => b.addEventListener("click", () => { const i = b.dataset.wsShow; W.show = String(W.show) === i ? null : i; draw(); }));
  qa("[data-ws-fix]").forEach(b => b.addEventListener("click", async () => { const w = ws(), res = usage(cur(), w).res, x = res && res.issues[Number(b.dataset.wsFix)]; if (!x || !x.edits) return; b.disabled = true; await fixDraft(cur(), x.edits); }));
  on("[data-ws-fixall]", "click", async e => { e.currentTarget.disabled = true; await fixAll(cur()); });
  on("[data-ws-refadd]", "click", async e => { e.currentTarget.disabled = true; W.err = ""; await addToDraftRefs(cur()); });
  on("[data-ws-doffer]", "click", async e => { const ids = e.currentTarget.dataset.wsDoffer.split(","); e.currentTarget.disabled = true; W.dOffer = null; W.err = ""; await addToDraftRefs(cur(), ids); });
  on("[data-ws-doffno]", "click", () => { W.dOffer = null; draw(); });
  qa("[data-ws-refadd1]").forEach(b => b.addEventListener("click", async () => { b.disabled = true; W.err = ""; await addToDraftRefs(cur(), [b.dataset.wsRefadd1]); }));
  // My Doc
  on("[data-ws-ldg]", "click", async () => {
    const C = window.SBCLOUD; W.err = "";
    if (!C || !C.pickGoogleDoc || !C.canPickFiles()) { W.err = "Choosing a Google Doc isn't set up on this Studyboard server yet."; draw(); return; }
    let d; try { d = await C.pickGoogleDoc(); } catch (e) { W.err = ldErrText(e); draw(); return; }
    if (!d) return;
    if (d.type && d.type !== "application/vnd.google-apps.document") { W.err = "That isn't a Google Doc. For a Word file, choose A Word File."; draw(); return; }
    await ldLink(cur(), {p: "google", id: d.id, name: d.name, url: d.url});
  });
  on("[data-ws-ldw]", "click", () => { Object.assign(W, {view: "ldword", ldQ: "", err: "", ldDir: null}); ldLoadList(); draw(true); });
  qa("[data-ws-ldpick]").forEach(b => b.addEventListener("click", () => { const x = ((W.ldList || {}).items || []).find(i => i.id === b.dataset.wsLdpick); if (x) ldLink(cur(), {p: "microsoft", id: x.id, drive: x.drive, name: x.name, url: x.url}); }));
  on("[data-ws-ldq]", "input", e => { W.ldQ = e.target.value; clearTimeout(W.ldT); W.ldT = setTimeout(ldLoadList, 450); });
  qa("[data-ws-lddir]").forEach(b => b.addEventListener("click", () => { const f = ((W.ldList || {}).folders || []).find(x => x.id === b.dataset.wsLddir); if (!f) return; W.ldDir = (W.ldDir || [{id: "root", name: "OneDrive"}]).concat({id: f.id, name: f.name}); ldLoadList(); draw(true); }));
  qa("[data-ws-ldup]").forEach(b => b.addEventListener("click", () => { W.ldDir = (W.ldDir || []).slice(0, Number(b.dataset.wsLdup) + 1); ldLoadList(); draw(true); }));
  on("[data-ws-ldcon]", "click", () => { if (dlg.open) dlg.close(); setTimeout(() => window.SBCLOUD && SBCLOUD.open(), 0); });
  on("[data-ws-lddl]", "click", async () => {
    const l = ws().ld; if (!l) return;
    try { const b = await idbGet(ldKey(l)); if (!b) throw 0; if (await noteFileSave(l.name || "Draft.docx", new Uint8Array(await b.arrayBuffer()), DOCX)) toast(`Saved ${l.name}`); }
    catch (e) { W.err = `${l.name || "That Word file"} isn't on this device. Upload it again (Upload Draft).`; draw(); }
  });
  if (W.tab === "doc" && !W.view) ldWatch(cur());
  on("[data-ws-ldshow]", "click", () => { W.ldShow = !W.ldShow; draw(); });
  on("[data-ws-ldoff]", "click", () => { const w = ws(), l = w.ld; if (!l) return; w.ld = null; if (w.draft && w.draft.ld) w.draft.ld = false; save(cur(), w, `Unlinked ${l.name || ldName(l)}`); W.okMsg = ""; W.err = ""; draw(); });
  on("[data-ws-ldcheck]", "click", async () => { const w = ws(); W.err = ""; W.okMsg = ""; if (ldOf(w)) await doCheck(cur(), {}); else if (w.ld) await ldLink(cur(), w.ld); if (shown()) draw(); });
  { const w = ws(); if (W.tab === "doc" && W.ldShow && !W.view && w.ld && w.ld.p === "microsoft" && (!W.ldPrev || W.ldPrev.id !== w.ld.id) && W.ldPrevFor !== w.ld.id) { const l = w.ld; W.ldPrevFor = l.id; ldPreview(l).then(u => { W.ldPrev = {id: l.id, u}; W.ldPrevFor = ""; if (shown() && W.tab === "doc") draw(); }); } }
  on("[data-ws-dcopy]", "click", async () => { const d = ws().draft; if (!d) return; try { await navigator.clipboard.writeText(d.t); toast("Copied your fixed draft. Paste it into your document."); } catch (e) { toast("Couldn't copy: select the draft under View Draft and copy it."); } });
  on("[data-ws-check]", "click", () => {
    const w = ws();
    if (!w.draft || W.redo) {
      if (wordsIn(W.paste) < 30) { W.err = W.paste.trim() ? "Your draft is too short to check. Paste at least a paragraph, upload it or choose it from Studyboard." : "Add your draft first: paste it, upload it or choose it from Studyboard."; draw(); return; }
      useDraft(t.id, W.paste, {from: "Pasted"}); return;
    }
    if (W.tab === "doc") W.tab = "check";
    doCheck(cur(), {reread: true});
  });
  // where the draft is marked, scroll it into view inside its box
  const mk = q(".ws-dv .ws-mark"); if (mk) { const dv = mk.closest(".ws-dv"); dv.scrollTop = Math.max(0, mk.getBoundingClientRect().top - dv.getBoundingClientRect().top + dv.scrollTop - 40); }
  // Found in Your Draft
  const F = W.found, fBtn = (sel, attr, word) => { const b = q(sel); if (!b || !F) return; const n = qa(`[${attr}]`).filter(c => c.checked).length; b.disabled = !n; b.textContent = `Add ${n} ${word}${n === 1 ? "" : "s"}`; };
  qa("[data-wf-ref]").forEach(c => c.addEventListener("change", () => { if (c.checked) F.sel.add(c.dataset.wfRef); else F.sel.delete(c.dataset.wfRef); fBtn("[data-wf-addrefs]", "data-wf-ref", "Source"); }));
  qa("[data-wf-q]").forEach(c => c.addEventListener("change", () => { F.touched.add(c.dataset.wfQ); if (c.checked) F.sel.add(c.dataset.wfQ); else F.sel.delete(c.dataset.wfQ); fBtn("[data-wf-addq]", "data-wf-q", "Quote"); }));
  qa("[data-wf-qs]").forEach(sl => sl.addEventListener("change", () => { const x = F && F.quotes.find(y => y.k === sl.dataset.wfQs); if (x) x.sid = sl.value; }));
  on("[data-wf-addrefs]", "click", () => {
    const picks = F.refs.filter(r => !r.dup && F.sel.has(r.k));
    const items = picks.map(r => Object.assign({}, r.it, r.st === "ok" ? {} : {rv: "1"}));
    const res = addItems(cur(), items, `Added ${plural(items.length, "source")} from your draft`);
    picks.forEach(r => { r.dup = true; F.sel.delete(r.k); });
    W.okMsg = `Added ${plural(res.added, "source")} from your draft${picks.some(r => r.st !== "ok") ? ". The ones read from your list are marked on Sources: check their details" : ""}.`;
    doCheck(cur(), {quiet: true});
  });
  // a citation that's in the draft's list but not a source yet: its entry, read from the list (looked up by DOI or ISBN when it has one), added
  qa("[data-ws-addref]").forEach(b => b.addEventListener("click", () => {
    const w = ws(), x = (usage(cur(), w).res || {issues: []}).issues[Number(b.dataset.wsAddref)]; if (!x || !x.addRef) return;
    if (!W.found || W.found.tid !== t.id || !w.draft || W.found.h !== w.draft.h) findInDraft(cur());
    const fold = v => String(v || "").normalize("NFD").replace(/\p{M}/gu, "").toLowerCase(), nm = fold(x.addRef), yr = (/\b(1[5-9]\d\d|20\d\d)\b/.exec(x.t) || [])[1];
    const cands = ((W.found || {}).refs || []).filter(r => fold(CITE.familyOf((r.it.author || r.it.editor || [])[0])) === nm || fold(r.raw).startsWith(nm));
    const r = cands.find(c => !yr || String(CITE.yearOf(c.it)) === yr) || cands[0];
    if (!r) { W.err = "Couldn't read that entry in your list. Add the source on the Sources tab."; draw(); return; }
    if (r.dup || CITE.dupOf(r.it, w.src)) { r.dup = true; W.okMsg = "That source is already in your sources: check how the name is spelled in your draft."; draw(); return; }
    addItems(cur(), [Object.assign({}, r.it, r.st === "ok" ? {} : {rv: "1"})], `Added ${cut(r.it.title || "a source", 60)} from your draft`);
    r.dup = true; if (W.found) W.found.sel.delete(r.k);
    W.okMsg = `Added ${r.it.title ? "“" + cut(r.it.title, 80) + "”" : "it"} to your sources, from your list.${r.st === "ok" ? "" : " Check its details on Sources."}`;
    doCheck(cur(), {quiet: true});
  }));
  on("[data-wf-addq]", "click", () => {
    const w = ws(), now = Date.now(), picks = F.quotes.filter(x => F.sel.has(x.k));
    picks.forEach(x => { if (w.q.length >= MAX_Q) return; const s = w.src.find(y => y.id === x.sid); w.q.push({id: uid(), sid: s ? s.id : "", t: x.t.slice(0, 1200), p: String(x.p || "").slice(0, 12), fid: s && s.fid ? s.fid : "", hl: "", sec: "", at: now}); });
    save(cur(), w, `Added ${plural(picks.length, "quote")} from your draft`);
    W.okMsg = `Added ${plural(picks.length, "quote")}. They're on the Quotes tab, ready to place in your outline.`;
    foundQuotes(cur(), F); draw();
  });
  // Pickers (drafts, Attach PDF, Open a PDF to Highlight): search, upload, choose
  const pq = q("[data-wp-q]"); if (pq) pq.addEventListener("input", () => { W.pick = Object.assign(W.pick || {}, {q: pq.value}); clearTimeout(W.pqt); W.pqt = setTimeout(() => { if (!shown()) return; draw(); const i = W.el.querySelector("[data-wp-q]"); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }, 150); });
  qa("[data-wp-attach]").forEach(b => b.addEventListener("click", () => attachPdf(t.id, W.attachFor, b.dataset.wpAttach.slice(2))));
  qa("[data-wp-open]").forEach(b => b.addEventListener("click", () => openReader(t.id, b.dataset.wpOpen.slice(2), 0)));
  const up = on("[data-wp-up]", "change", async () => {
    const f = up.files && up.files[0]; if (!f) return;
    if (!/\.pdf$/i.test(f.name)) { W.err = "Choose a PDF."; draw(); return; }
    W.busy = "up"; W.err = ""; draw();
    let made = []; try { made = typeof uploadFiles === "function" ? await uploadFiles([f], {courseId: cur().courseId || "", taskId: t.id}) : []; } catch (e) { made = []; }
    W.busy = ""; const nf = (made || [])[0];
    if (!nf) { W.err = `Couldn't upload ${f.name}.`; if (shown()) draw(); return; }
    if (W.view === "attach") attachPdf(t.id, W.attachFor, nf.id); else openReader(t.id, nf.id, 0);
  });
  qa("[data-ws-setst]").forEach(b => b.addEventListener("click", () => { const w = ws(); w.style = b.dataset.wsSetst; save(cur(), w, `Citation style set to ${styleName(w.style)}`); W.show = null; doCheck(cur()); }));
}
function wireZot(R, target, done){
  const q = s => R.querySelector(s), qa = s => [...R.querySelectorAll(s)], on = (sel, ev, fn) => { const el = q(sel); if (el) el.addEventListener(ev, fn); return el; };
  const zk = q("[data-wz-key]"); if (zk) zk.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); q("[data-wz-connect]").click(); } });
  on("[data-wz-connect]", "click", async () => { W.busy = "zc"; W.err = ""; const key = zk ? zk.value : ""; draw(); try { await zconnect(key); W.z = null; W.busy = ""; draw(); zload(); } catch (e) { W.busy = ""; W.err = e.message; draw(); } });
  on("[data-wz-off]", "click", () => { try { localStorage.removeItem(ZKEY); } catch (e) {} W.z = null; toast("Zotero disconnected on this device"); draw(); });
  const zl = on("[data-wz-lib]", "change", () => { W.z.lib = zl.value; W.z.col = ""; W.z.cols = null; zload(); });
  const zc = on("[data-wz-col]", "change", () => { W.z.col = zc.value; zload(); });
  const zq = q("[data-wz-q]"); if (zq) { zq.addEventListener("input", () => { W.z.q = zq.value; }); zq.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); zload(); } }); }
  on("[data-wz-go]", "click", () => zload());
  on("[data-wz-more]", "click", () => zload(true));
  qa("[data-wz-pick]").forEach(c => c.addEventListener("change", () => { const S = W.z.sel; if (c.checked) S.add(c.dataset.wzPick); else S.delete(c.dataset.wzPick); const b = q("[data-wz-add]"); if (b) { b.disabled = !S.size; b.textContent = b.textContent.replace(/^Add \d*\s*/, `Add ${S.size || ""} `); } }));
  on("[data-wz-all]", "click", () => { qa("[data-wz-pick]").forEach(c => { if (!c.disabled) { c.checked = true; W.z.sel.add(c.dataset.wzPick); } }); draw(); });
  on("[data-wz-add]", "click", () => { const t = target(); if (!t) { toast("Add a paper first"); return; } const Z = W.z, items = (Z.items || []).filter(x => Z.sel.has(x.key)).map(x => x.csl); const r = addItems(t, items, `Added ${items.length} source${items.length === 1 ? "" : "s"} from Zotero${W.hub ? " to " + t.title : ""}`); Z.sel = new Set(); done(r); });
}
// Undo, sync from another device, or an edit elsewhere: the open Studio follows (not while something is being typed in it)
let redrawT = 0;
hook("changed", changes => {
  if (!shown() || !(changes || []).some(c => (c.kind === "task" && (c.id === W.tid || W.hub)) || c.kind === "file")) return;
  clearTimeout(redrawT);
  redrawT = setTimeout(() => {
    if (!shown()) return;
    const a = document.activeElement, typing = a && W.el.contains(a) && /^(INPUT|TEXTAREA)$/.test(a.tagName) && a.type !== "checkbox";
    if (typing || W.edit || W.busy || DRAG) return;
    if (W.hub) { draw(); return; }
    if (!state.tasks[W.tid]) { dlg.close(); return; }
    draw();
  }, 30);
});
hook("act", (act, el, id) => {
  if (act === "ws-lib" || act === "ws-zot") { if (dlg.open) dlg.close(); openHub(act === "ws-zot" ? "zotero" : "library"); return true; }
  if (act !== "ws-open") return false;
  if (dlg.open) dlg.close();
  open(id, el && el.dataset ? el.dataset.wsTo : ""); return true;
});
if (window.SBPRO) SBPRO.addFeature({id: "writing", name: "Writing Studio", free: "—", pro: "Included", where: "On a paper, essay or project: sources (with Zotero), citations in 10,000+ styles, quotes from your highlights, an outline and a citation check", icon: '<path d="M4 19.5V5a2 2 0 0 1 2-2h12v15H6a2 2 0 0 0-2 1.5zM4 19.5A2 2 0 0 0 6 21h12"/><path d="M9 7h6M9 11h4"/>'});

const css = document.createElement("style");
css.textContent = `
/* the same window as Concept Maps: the same size and place (and a fixed height, so changing tabs never moves it); full screen on phones */
dialog:has(.ws-sheet){width:min(1180px,calc(100% - 24px));height:min(92vh,1000px);height:min(92dvh,1000px)}
.ws-sheet{display:flex;flex-direction:column;height:100%;max-height:inherit}
.ws-sheet > .ws-body{flex:1 1 auto}
@media (max-width:640px){dialog:has(.ws-sheet){width:100%;max-width:100%;height:100%;max-height:100%;margin:0;border-radius:0}
  /* full screen on a phone: the header starts below the status bar and the Dynamic Island, with its colour carried up behind them */
  .ws-sheet{padding-top:env(safe-area-inset-top,0px);box-sizing:border-box}
  .ws-sheet>.g2-sheet-head::before{content:"";position:absolute;left:0;right:0;bottom:100%;height:env(safe-area-inset-top,0px);background:linear-gradient(120deg,color-mix(in srgb,var(--c) 90%,#000),color-mix(in srgb,var(--c) 60%,var(--surface)));pointer-events:none}}
.ws-bar{display:flex;flex-wrap:wrap;align-items:center;gap:6px 12px;padding:6px 20px 0;border-bottom:1px solid var(--line)}
/* Zotero's Z: its red, centred on the label beside it */
svg.ws-zic{display:block;flex:none}
/* the Google Drive and OneDrive logos on Link a Doc keep their own shape (OneDrive's is wider than it is tall) */
.ws-ldb{display:inline-flex;align-items:center;gap:6px}
.ws-ldb > .brand-lg{flex:none;display:block;min-width:0}
.ws-ldb > img.brand-lg{width:24px;height:16px;object-fit:contain}
.ws-ldb > svg.brand-lg{width:20px;height:18px}
:is(.btn,button):has(> svg.ws-zic){display:inline-flex;align-items:center;gap:6px}
.ws-tabs{display:flex;gap:2px;flex:1 1 auto;min-width:0;overflow-x:auto;scrollbar-width:none}
/* the head, tab bar and progress strip keep their own height on every tab (a long tab squeezed them, moving the line under the title) */
.ws-sheet>:not(.ws-body):not(.ws-main):not(.ws-scroll){flex-shrink:0}
.ws-tab:focus:not(:focus-visible){outline:none}
.ws-fixb{display:inline-flex;margin-top:6px;width:max-content}
.ws-sum .ws-fixall{margin-left:10px;vertical-align:middle}
.ws-res > .ws-sum{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px 12px}
.ws-res > .ws-sum .ws-fixall{margin:0;flex:none}
.ws-sum-t{min-width:0}
.ws-acts > .spacer{flex:1 1 auto}
.ws-tab{border:0;background:none;color:var(--muted);font:inherit;font-weight:600;padding:9px 10px;border-bottom:2px solid transparent;cursor:pointer;white-space:nowrap}
.ws-tab[aria-selected="true"]{color:var(--ink);border-bottom-color:var(--accent,#2F6FE4)}
.ws-n{display:inline-block;min-width:1.4em;font-size:.72rem;border-radius:9px;padding:0 5px;background:var(--soft,#EEF1F6);color:var(--muted);text-align:center}
.ws-style{display:flex;align-items:center;gap:8px;padding-bottom:6px;min-width:0}
.ws-style>span{flex:none;white-space:nowrap;font-size:.8rem;font-weight:700;letter-spacing:.01em;color:var(--muted)}
.ws-style select{max-width:230px;min-width:0}
.ws-body{display:grid;gap:10px;align-content:start}
.ws-add{display:flex;gap:8px;align-items:flex-end}
.ws-grow{flex:1 1 auto;min-width:0}
.ws-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center;min-width:0}
.ws-row select{min-width:0;max-width:100%;flex:1 1 200px}
.ws-zbtn svg{vertical-align:-2px;color:#CC2936}
.ws-priv{margin:0}
.ws-err{margin:0;color:#B42318}
.ws-need{color:#B42318;font-weight:600}
.ws-xp{display:grid;gap:8px;padding:10px 12px;border:1px solid var(--line);border-radius:12px;background:color-mix(in srgb,var(--accent,#2F6FE4) 6%,var(--surface))}
.ws-xp .fsec{margin:0}
.ws-xp-b{display:flex;flex-wrap:wrap;gap:6px}
.ws-xp select{max-width:100%}
/* dark mode: a lighter red, readable on navy */
:root[data-theme="dark"] :is(.ws-err,.ws-need){color:#FF8A80}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) :is(.ws-err,.ws-need){color:#FF8A80}}
.ws-ok{margin:0;color:color-mix(in srgb,#1D6B3D 85%,var(--ink))}
.ws-ldc{display:grid;gap:8px}
.rbx-in{display:grid;gap:10px}
/* My Doc: the paper as a page (click to cite, select to quote), and the menu that opens there */
.ws-rdbar{display:grid;gap:4px;margin:4px 0 8px}
.ws-rdhint{color:var(--muted)}
.ws-rdmeta{display:flex;align-items:center;gap:4px;min-width:0}
.ws-rdname{flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ws-rdmeta .ws-act{flex:none}
.ws-ldacts{display:flex;flex-wrap:wrap;align-items:center;gap:8px}
.ws-ldacts > a.btn{color:var(--ink)}
.ws-ldacts .ws-act{color:var(--muted)}
.ws-ldacts .ws-act:hover{color:var(--ink)}
@media (max-width:520px){.ws-ldacts > .btn{flex:1 1 0;justify-content:center;white-space:nowrap}.ws-ldacts .spacer{display:none}}
.ws-rdwrap{position:relative}
.ws-rd{max-width:760px;margin:0 auto;padding:28px clamp(16px,6%,56px) 40px;background:color-mix(in srgb,#fff 94%,var(--surface));color:#20242E;border:1px solid var(--line);border-radius:10px;box-shadow:0 6px 22px -14px rgb(0 0 0/.35);font:1rem/1.75 Georgia,"Times New Roman",serif;cursor:text;user-select:text;-webkit-user-select:text}
.ws-rd p{margin:0;white-space:pre-wrap;word-break:break-word}
.ws-rd p.ws-rd-gap{height:.9em}
.ws-rd ::selection{background:color-mix(in srgb,var(--accent,#2F6FE4) 28%,transparent)}
.ws-rd.is-doc{color:#000;line-height:1.38}
.ws-rd.is-doc p[data-k="title"]{font-size:2em}.ws-rd.is-doc p[data-k="subtitle"]{font-size:1.25em;color:#555}
.ws-marks{position:absolute;inset:0;pointer-events:none;z-index:4}
.ws-caret{position:absolute;width:2px;margin-left:-1px;background:var(--accent,#2F6FE4);border-radius:1px;animation:wsBlink 1s steps(1) infinite}
.ws-caret::before{content:"";position:absolute;left:-3px;top:-4px;width:8px;height:8px;border-radius:50%;background:inherit}
.ws-selm{position:absolute;background:color-mix(in srgb,var(--accent,#2F6FE4) 22%,transparent);border-radius:2px}
@keyframes wsBlink{50%{opacity:0}}
@media (prefers-reduced-motion:reduce){.ws-caret{animation:none}}
.ws-pop-ctx{margin:0;padding:6px 8px;border-radius:8px;background:color-mix(in srgb,#fff 70%,var(--soft));color:#2B2F3A;font:.86rem/1.45 Georgia,"Times New Roman",serif}
.ws-pop-ctx ins{text-decoration:none;background:color-mix(in srgb,var(--accent,#2F6FE4) 18%,transparent);color:inherit;border-radius:3px;padding:0 2px;font-weight:700}
.ws-pop-ctx del{color:#B42318}
.ws-pop{position:absolute;z-index:5;display:flex;flex-wrap:wrap;align-items:center;gap:6px;padding:6px;border-radius:12px;background:var(--surface);border:1px solid var(--line);box-shadow:0 12px 30px -10px rgb(0 0 0/.35);max-width:min(380px,calc(100% - 8px));font:inherit}
.ws-pop.is-list{display:grid;gap:4px;width:min(380px,calc(100% - 8px));padding:8px}
.ws-pop-h{display:flex;align-items:center;justify-content:space-between;font-weight:700}
.ws-pop-how{margin:0 0 2px}
.ws-pop-list{display:grid;gap:2px;max-height:260px;overflow:auto}
.ws-pop-s{display:grid;gap:1px;text-align:left;border:0;background:none;padding:6px 8px;border-radius:8px;cursor:pointer;color:inherit;font:inherit}
.ws-pop-s:hover,.ws-pop-s:focus-visible{background:var(--soft)}
.ws-pop-x{border:0;background:none;font-size:1.2rem;line-height:1;padding:2px 6px;cursor:pointer;color:var(--muted);border-radius:6px}
.ws-pop-x:hover{background:var(--soft)}
.ws-ldrow .btn{display:inline-flex;gap:6px;align-items:center}.ws-ldrow .btn svg,.ws-ldrow .btn img{width:16px;height:16px;flex:none}
.ws-ldcr{display:flex;gap:6px;align-items:center;flex-wrap:wrap;font-size:.92rem}
.ws-ldk,.ws-ldh{display:flex;gap:10px;align-items:center;flex-wrap:wrap;border:1px solid var(--line);border-radius:12px;background:var(--surface);padding:10px 12px}
.ws-ldh{border:0;background:none;padding:0}
.ws-ldk>svg,.ws-ldh>svg{width:22px;height:22px;flex:none}.ws-ldk>img,.ws-ldh>img{width:24px;height:auto;flex:none}
.ws-ldk-t{display:grid;gap:2px;flex:1 1 180px;min-width:0}
.ws-ldk-t b{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ws-ldtop{display:grid;gap:8px}
.ws-ldsum{margin:0;display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.ws-ldsum .ws-fixall{margin-left:0}
.ws-ldwrap:not(:empty){margin-top:10px}
.ws-ldf{display:block;width:100%;height:min(74vh,1000px);min-height:320px;border:1px solid var(--line);border-radius:12px;background:#fff}
.ws-note{margin:0;padding:8px 10px;border-radius:10px;background:color-mix(in srgb,var(--accent,#2F6FE4) 9%,var(--surface))}
.ws-empty{text-align:center;padding:22px 12px;border:1px dashed var(--line);border-radius:12px;display:grid;gap:6px}
.ws-empty p{margin:0}
.ws-bibh .mini{font-weight:400}
.ws-refs,.ws-qs,.ws-secs,.ws-oqs,.ws-issues,.ws-picks{list-style:none;margin:0;padding:0;display:grid;gap:8px}
.ws-picks{gap:4px;max-height:46vh;overflow:auto;border:1px solid var(--line);border-radius:10px;padding:6px 10px}
.ws-find{display:flex;gap:10px;align-items:center;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--line)}
.ws-find:last-child{border-bottom:0}
.ws-steps{margin:0;padding-left:1.3em;display:grid;gap:4px}
.ws-ref,.ws-q{border:1px solid var(--line);border-radius:10px;padding:8px 12px;display:grid;gap:4px;min-width:0}
.ws-cite{margin:0;line-height:1.5;word-break:break-word;font-family:Georgia,"Times New Roman",serif}
.ws-refs.hang .ws-cite{padding-left:2em;text-indent:-2em}
.ws-prev{padding:10px 12px;border-radius:10px;background:var(--soft,#F4F6FA);display:grid;gap:4px}
.ws-prevcite{font-family:var(--font,inherit)}
.ws-short{display:none}
.tv-tools{flex-wrap:wrap}
@media (min-width:481px){.tv-tools > .ws-ms{flex:2 1 auto}}
@media (max-width:480px){.tv-tools .ws-long{display:none}.tv-tools .ws-short{display:inline}.tv-tools .ws-ms .ws-step{background:none;padding:0;font-size:inherit}}
.ws-btn .ws-step{font-weight:600;font-size:.8em;padding:1px 7px;border-radius:999px;background:color-mix(in srgb,var(--accent,#2F6FE4) 12%,var(--surface));color:var(--ink);white-space:nowrap}
.ws-btn.is-met .ws-step{background:color-mix(in srgb,#2E9E5B 18%,var(--surface))}
.sb-beta{display:inline-block;margin-left:10px;padding:3px 10px;border-radius:999px;background:#1F5FD6;color:#fff;font:700 .78rem/1.2 var(--body,inherit);letter-spacing:.04em;text-transform:uppercase;vertical-align:3px;text-shadow:none;box-shadow:0 0 0 2px rgba(255,255,255,.85)}
@media (max-width:560px){.sb-beta{font-size:.62rem;padding:2px 7px;margin-left:6px;vertical-align:2px;box-shadow:0 0 0 1.5px rgba(255,255,255,.85)}}
.sb-beta-alt{display:none}
@media (max-width:420px){.sh-kick:has(.sb-beta){font-size:1.12rem;white-space:nowrap}.sb-beta{font-size:.58rem;padding:2px 6px;margin-left:5px}}
@media (max-width:374px){.sh-kick .sb-beta{display:none}.sh-ring .sb-beta-alt{display:block;position:absolute;left:50%;bottom:-7px;transform:translateX(-50%);margin:0;font-size:.52rem;padding:1px 5px;box-shadow:0 0 0 1.5px #fff}}
/* the paper's (or course's) name: two lines at most, ending in … , with room under it so nothing is cut */
:is(.ws-sheet,.cm-sheet) .g2-sheet-head.sh-big{height:auto!important;max-height:none!important;overflow:visible!important;padding-bottom:14px!important}
:is(.ws-sheet,.cm-sheet) .sh-big h2.sh-name{display:-webkit-box;-webkit-line-clamp:2;line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;line-height:1.22;padding-bottom:.08em;margin-right:4px;text-overflow:ellipsis;word-break:normal;overflow-wrap:anywhere}
:is(.ws-sheet,.cm-sheet) .g2-ring{overflow:visible}
:is(.ws-sheet,.cm-sheet) .sh-big .sh-t{padding-bottom:6px;min-width:0}
.ws-info{margin:0;word-break:break-word}
.ws-acts{display:flex;flex-wrap:wrap;align-items:center;gap:2px 4px;margin:0 -6px -2px}
.ws-act{border:0;background:none;color:var(--accent,#2F6FE4);font:inherit;font-size:.86rem;font-weight:600;padding:5px 6px;border-radius:8px;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;gap:4px;min-height:32px}
.ws-act:hover{background:color-mix(in srgb,var(--accent,#2F6FE4) 9%,transparent)}
.ws-act:focus-visible{outline:2px solid var(--accent,#2F6FE4);outline-offset:1px}
.ws-rm{color:var(--muted)}
.ws-rm:hover{color:#B42318;background:color-mix(in srgb,#D64545 10%,transparent)}
.ws-date{display:grid;grid-template-columns:1.2fr 1fr 1fr;gap:8px 10px}
.ws-meta{display:flex;flex-wrap:wrap;gap:4px 12px;align-items:center;min-width:0}
.ws-meta .mini{min-width:0;word-break:break-word}
.ws-form{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:8px 10px}
.ws-form .ws-wide{grid-column:1/-1}
.ws-q blockquote{margin:0;font-family:Georgia,"Times New Roman",serif;line-height:1.5;word-break:break-word}
.ws-qform{display:grid;gap:8px;padding:10px;border:1px solid var(--line);border-radius:10px}
.ws-pg{display:flex;align-items:center;gap:4px}
.ws-hls{display:grid;gap:10px}
.ws-hlf{border:1px solid var(--line);border-radius:10px;padding:6px 10px 8px;margin:0;display:grid;gap:6px;min-width:0}
.ws-hl{display:flex;gap:8px;align-items:flex-start;line-height:1.4;word-break:break-word;padding:2px 0}
.ws-hl input{margin-top:3px;flex:0 0 auto}
.ws-drop{border:1px solid var(--line);border-radius:12px;padding:8px 10px;display:grid;gap:6px;transition:background .15s,border-color .15s;min-width:0}
.ws-drop.is-over{border-color:var(--accent,#2F6FE4);background:color-mix(in srgb,var(--accent,#2F6FE4) 8%,var(--surface))}
.ws-loose{background:var(--soft,#F4F6FA)}
.ws-sech{display:flex;align-items:center;gap:6px;min-width:0}
.ws-sech b{flex:1 1 auto}
.ws-sheet .ws-sect{flex:1 1 auto;min-width:0;width:auto;font:inherit;font-size:1rem;font-weight:700;border:1px solid transparent;border-radius:8px;padding:4px 6px;margin:0;background:transparent;box-shadow:none;color:var(--ink);min-height:0;height:auto}
.ws-sheet .ws-sect:hover{border-color:var(--line)}
.ws-sheet .ws-sect:focus{border-color:var(--accent,#2F6FE4);background:var(--surface);outline:none}
.ws-sheet .ws-secn{width:100%;font:inherit;font-size:.9rem;border:1px dashed var(--line);border-radius:8px;padding:6px 8px;margin:0;background:transparent;box-shadow:none;color:var(--ink);resize:none;box-sizing:border-box;min-height:34px;overflow:hidden;line-height:1.4}
.ws-sheet .ws-secn:focus{border-style:solid;border-color:var(--accent,#2F6FE4);background:var(--surface);outline:none}
.ws-sec .icon-btn{width:30px;height:30px;min-width:30px;padding:0}
.ws-hint{margin:0;text-align:center;padding:6px}
.ws-oq{display:flex;gap:8px;align-items:flex-start;border:1px solid var(--line);border-radius:8px;padding:6px 8px;background:var(--surface);cursor:grab;min-width:0}
.ws-oq.is-drag{opacity:.45}
.ws-grip{color:var(--muted);letter-spacing:-2px;user-select:none;padding-top:1px}
.ws-oqt{flex:1 1 auto;min-width:0;word-break:break-word;font-size:.92rem;line-height:1.4}
.ws-oq select{flex:0 0 auto;max-width:130px;font-size:.8rem}
.ws-pick{position:relative;overflow:hidden;cursor:pointer}
.ws-res{display:grid;gap:8px}
.ws-sum{margin:0}
.ws-is{display:flex;gap:10px;align-items:flex-start;padding:8px 10px;border:1px solid var(--line);border-radius:10px;min-width:0}
.ws-is>span:last-child{display:grid;gap:2px;min-width:0;word-break:break-word}
.ws-is [data-ws-setst]{justify-self:start;text-align:left;padding-left:0;margin-left:0}
.ws-ic{flex:0 0 22px;height:22px;border-radius:50%;display:grid;place-items:center;font-size:.75rem;font-weight:800;color:#fff}
.ws-is.k-err .ws-ic{background:#D64545}.ws-is.k-warn .ws-ic{background:#B7791F}.ws-is.k-ok .ws-ic{background:#2E8A52}
.ws-is.k-err{border-left:4px solid #D64545}
.ws-more{display:flex;flex-wrap:wrap;align-items:center;gap:4px 6px;margin-top:2px;min-width:0}
.ws-chipb{border:1px solid var(--line);background:var(--surface);color:var(--ink);font:inherit;font-size:.8rem;padding:2px 8px;border-radius:99px;cursor:pointer;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ws-chipb:hover{border-color:var(--accent,#2F6FE4)}.ws-chipb[aria-pressed="true"]{background:color-mix(in srgb,var(--accent,#2F6FE4) 12%,var(--surface));border-color:var(--accent,#2F6FE4)}
.ws-chipb:focus-visible{outline:2px solid var(--accent,#2F6FE4);outline-offset:1px}
.ws-should{display:flex;flex-wrap:wrap;align-items:flex-start;gap:4px 8px;margin-top:4px;padding:6px 8px;border-radius:8px;background:color-mix(in srgb,#2E8A52 7%,var(--surface));min-width:0}
.ws-should-t{flex:1 1 220px;min-width:0;word-break:break-word;font-size:.88rem;line-height:1.4}
/* the strip at the top of every tab */
.ws-strip{display:flex;flex-wrap:wrap;align-items:center;gap:2px 4px;padding:6px 20px;border-bottom:1px solid var(--line);background:color-mix(in srgb,var(--ink) 2.5%,var(--surface));font-size:.84rem}
.ws-sp{border:0;background:none;font:inherit;color:var(--muted);padding:3px 6px;border-radius:8px;cursor:pointer;white-space:nowrap}
.ws-sp:hover{background:color-mix(in srgb,var(--accent,#2F6FE4) 9%,transparent);color:var(--ink)}
.ws-sp:focus-visible{outline:2px solid var(--accent,#2F6FE4);outline-offset:1px}
.ws-sp.is-here{color:var(--ink);font-weight:600}
.ws-sp.bad{color:#B42318;font-weight:600}.ws-sp.good{color:color-mix(in srgb,#1D6B3D 85%,var(--ink))}
.ws-dot{color:var(--muted);opacity:.6}
.ws-goal{display:grid;gap:4px}
.ws-meter{display:block;height:6px;border-radius:99px;background:color-mix(in srgb,var(--ink) 9%,var(--surface));overflow:hidden}
.ws-meter i{display:block;height:100%;border-radius:inherit;background:var(--accent,#2F6FE4);transition:width .3s}
.ws-goal.met .ws-meter i{background:#2E8A52}
.ws-also,.ws-offer{display:flex;flex-wrap:wrap;align-items:center;gap:6px 8px;padding:8px 10px;border-radius:10px;background:color-mix(in srgb,var(--accent,#2F6FE4) 8%,var(--surface));min-width:0}
.ws-offer>span:first-child{flex:1 1 220px;min-width:0;word-break:break-word}
.ws-use,.ws-rv{margin:0}
.ws-yes{color:color-mix(in srgb,#1D6B3D 88%,var(--ink));font-weight:600}
.ws-no{color:#9A5B00}
.ws-rv{padding:4px 8px;border-radius:8px;background:color-mix(in srgb,#B7791F 12%,var(--surface))}
.ws-draft{border:1px solid var(--line);border-radius:12px;padding:10px 12px 6px;display:grid;gap:6px;min-width:0}
.ws-draft-t{display:grid;gap:2px;min-width:0}
.ws-draft-t .mini{word-break:break-word}
.ws-dv{max-height:min(46vh,340px);overflow:auto;white-space:pre-wrap;word-break:break-word;font-family:Georgia,"Times New Roman",serif;font-size:.92rem;line-height:1.55;padding:10px 12px;border-radius:10px;background:var(--soft,#F4F6FA);border:1px solid var(--line);margin-top:6px;color:var(--ink)}
.ws-mark{background:color-mix(in srgb,#F5C518 42%,var(--surface));color:inherit;border-radius:3px;padding:1px 0;box-shadow:0 0 0 2px color-mix(in srgb,#F5C518 42%,var(--surface))}
.ws-mark b{text-decoration:underline;text-decoration-color:#B42318;text-decoration-thickness:2px;text-underline-offset:2px}
.ws-is-b{border:0;background:none;font:inherit;color:inherit;text-align:left;padding:0;cursor:pointer;display:flex;flex-wrap:wrap;gap:2px 8px;align-items:baseline;min-width:0}
.ws-is-go{font-size:.8rem;font-weight:600;color:var(--accent,#2F6FE4);white-space:nowrap}
.ws-is-b:hover .ws-is-go{text-decoration:underline}
.ws-is-b:focus-visible{outline:2px solid var(--accent,#2F6FE4);outline-offset:2px;border-radius:4px}
.ws-diff{margin:0;padding:6px 10px;border-radius:10px;background:color-mix(in srgb,#2E8A52 10%,var(--surface))}
.ws-found{display:grid;gap:8px;padding:10px 12px;border:1px solid color-mix(in srgb,var(--accent,#2F6FE4) 35%,var(--line));border-radius:12px;background:color-mix(in srgb,var(--accent,#2F6FE4) 4%,var(--surface));min-width:0}
.ws-found .fsec{margin:0}
.ws-fq li{display:grid;gap:4px;padding:4px 0;border-bottom:1px solid var(--line)}
.ws-fq li:last-child{border-bottom:0}
.ws-fq select{max-width:100%;font-size:.84rem;margin-left:26px;width:calc(100% - 26px)}
.ws-flist{list-style:none;margin:0;padding:0;display:grid;gap:0;border:1px solid var(--line);border-radius:10px}
.ws-flist li{display:flex;gap:10px;align-items:center;justify-content:space-between;padding:6px 10px;border-bottom:1px solid var(--line);min-width:0}
.ws-flist li:last-child{border-bottom:0}
.ws-fn{display:grid;gap:1px;min-width:0}
.ws-fn b{word-break:break-word}
.ws-gaps{margin:0;color:#9A5B00}
.ws-sec.is-empty .ws-hint{color:#9A5B00}
.ws-to select{max-width:260px}
/* Board cards and Do This Next */
.ws-chip{display:inline-flex;align-items:center;gap:4px;border:1px solid color-mix(in srgb,var(--accent,#2F6FE4) 30%,var(--line));background:color-mix(in srgb,var(--accent,#2F6FE4) 7%,var(--surface));color:var(--ink);font:inherit;font-size:.74rem;font-weight:600;line-height:1.2;padding:2px 7px;border-radius:999px;cursor:pointer;white-space:nowrap}
.ws-chip svg{width:12px;height:12px;flex:none}
.ws-chip:hover{background:color-mix(in srgb,var(--accent,#2F6FE4) 14%,var(--surface))}
.ws-chip-n{display:inline-grid;place-items:center;min-width:1.3em;height:1.3em;border-radius:99px;background:#D64545;color:#fff;font-size:.7rem}
.nu-ws{display:block;margin-top:6px}
/* the reader's Writing Studio bar */
.pdr-ws{display:flex;align-items:center;flex-wrap:wrap;gap:4px 10px;padding:6px 16px;border-bottom:1px solid var(--line);background:color-mix(in srgb,var(--accent,#2F6FE4) 9%,var(--surface));font-size:.88rem;min-width:0}
.pdr-ws svg{flex:none;color:var(--accent,#2F6FE4)}
.pdr-ws-t{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:100%}
@media (max-width:560px){.pdr-ws{padding:6px 10px}.pdr-ws>.mini{display:none}}
/* Review: Writing */
.wsr-list{list-style:none;margin:12px 0 18px;padding:0;display:grid;gap:14px;grid-template-columns:repeat(auto-fill,minmax(min(100%,260px),1fr))}
/* a card like Concept Maps': the paper peeking out on its course's colour, then its title and how it stands */
.wsr-card{position:relative;display:flex;flex-direction:column;min-width:0;border-radius:18px;background:var(--surface);border:1px solid color-mix(in srgb,var(--c) 26%,var(--line));box-shadow:0 1px 2px rgb(0 0 0/.05),0 6px 18px -10px color-mix(in srgb,var(--c) 45%,transparent);overflow:hidden}
.wsr-peekb{position:relative;display:block;width:100%;aspect-ratio:2.3/1;padding:0;border:0;cursor:pointer;overflow:hidden;background:repeating-linear-gradient(0deg,transparent 0 13px,color-mix(in srgb,var(--c) 6%,transparent) 13px 14px),linear-gradient(160deg,color-mix(in srgb,var(--c) 16%,var(--surface)),color-mix(in srgb,var(--c) 5%,var(--surface)));border-bottom:1px solid color-mix(in srgb,var(--c) 18%,var(--line))}
.wsr-page,.wsr-back{position:absolute;left:0;right:0;margin:0 auto;top:40px;width:min(62%,230px);height:calc(100% + 6px);border-radius:6px 6px 0 0;background:color-mix(in srgb,#fff 88%,var(--c));box-shadow:0 2px 10px -3px color-mix(in srgb,var(--c) 45%,rgb(0 0 0/.25))}
.wsr-back{rotate:-4deg;top:44px;background:color-mix(in srgb,#fff 70%,var(--c));opacity:.75}
.wsr-page{rotate:1.5deg;padding:10px 12px;box-sizing:border-box;display:flex;flex-direction:column;gap:5px;text-align:left;overflow:hidden;color:#2B2F3A;transition:translate .3s cubic-bezier(.2,.8,.2,1);will-change:translate;-webkit-font-smoothing:antialiased;backface-visibility:hidden}
.wsr-page::after{content:"";position:absolute;right:0;top:0;width:16px;height:16px;background:linear-gradient(225deg,color-mix(in srgb,var(--c) 28%,var(--surface)) 50%,color-mix(in srgb,#000 10%,#fff) 50%);border-bottom-left-radius:4px}
.wsr-card:hover .wsr-page{translate:0 -4px}
.wsr-ph{font:700 .6rem/1.25 Georgia,"Times New Roman",serif;text-align:center;color:#1E2230;padding:0 8px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;flex:none}
.wsr-pt{font:.5rem/1.55 Georgia,"Times New Roman",serif;color:#4A5060;text-indent:1.4em;-webkit-mask-image:linear-gradient(#000 55%,transparent);mask-image:linear-gradient(#000 55%,transparent)}
.wsr-pt mark{background:color-mix(in srgb,var(--c) 26%,#fff);color:inherit;border-radius:2px;padding:0 1px}
.wsr-pl{flex:1;background:repeating-linear-gradient(180deg,#D9DCE3 0 3px,transparent 3px 9px);margin:4px 2px 0;opacity:.8;-webkit-mask-image:linear-gradient(90deg,#000 70%,transparent 96%),linear-gradient(#000 50%,transparent);mask-image:linear-gradient(#000 50%,transparent)}
.wsr-chip{z-index:1;max-width:calc(100% - 128px)}
.wsr-badge{position:absolute;right:10px;top:10px;z-index:1;font:800 .62rem var(--display);letter-spacing:.04em;text-transform:uppercase;padding:3px 8px;border-radius:999px;background:var(--surface);color:var(--muted);box-shadow:0 1px 3px rgb(0 0 0/.12)}
.wsr-badge.k-pro{background:linear-gradient(135deg,#FFB443,#FF5C8A);color:#fff;letter-spacing:.08em}
.wsr-badge.k-bad{background:#FDE7E5;color:#B42318}.wsr-badge.k-good{background:#E3F5EA;color:#1D6B3D}.wsr-badge.k-warn,.wsr-badge.k-wait{background:#FFF3D6;color:#8A5A00}
.wsr-ld{position:absolute;right:10px;bottom:8px;z-index:1;display:grid;place-items:center;width:26px;height:26px;border-radius:8px;background:var(--surface);box-shadow:0 1px 3px rgb(0 0 0/.15)}
.wsr-foot{flex:1;display:flex;flex-direction:column;gap:8px;padding:10px 12px 12px 14px}
.wsr-row{display:flex;align-items:center;gap:10px;margin-top:auto}
.wsr-sub{flex:1 1 auto;min-width:0;display:grid;gap:2px;color:var(--muted)}
.wsr-main{border:0;background:none;font:inherit;color:inherit;text-align:left;padding:0;cursor:pointer;display:grid;gap:2px;margin-top:auto}
@media (prefers-reduced-motion:reduce){.wsr-page{transition:none}.wsr-card:hover .wsr-page{translate:none}}
.wsr-t{font-weight:700;font-size:1rem;line-height:1.25;word-break:break-word;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.wsr-l.bad{color:#B42318}
@media (max-width:560px){.ws-strip{padding:5px 12px;font-size:.8rem}.ws-sp{padding:3px 4px}}
@media (max-width:560px){.ws-bar{padding:4px 12px 0}.ws-tab{padding:9px 6px}.ws-tabs{flex:1 1 100%}.ws-style select{max-width:160px}.ws-add{flex-wrap:wrap}.ws-oq{flex-wrap:wrap}.ws-oq select{max-width:100%;flex:1 1 100%}}
`;
document.head.appendChild(css);

window.SBWRITE = {taskBtn, chip, open, openHub, CITE, eligible, hasData, state: () => W, styleName, loadCiteproc, papersFor, quotedIn, addQuote, readerBtn, readerBar, readerTarget, hlPop, fromReader, milestoneOf, reviewHtml, planNote};
})();
