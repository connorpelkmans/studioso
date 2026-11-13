/* ===== module: 99-writing-studio.js ===== */
/* Writing Studio (Pro): a reference manager for each paper, with quotes, an outline and a citation check. No AI.
   - Entry: "Writing Studio" in the task sheet's actions, on the same assignment-like tasks as Rubric Check (and on any task that already
     has sources). Free accounts see a PRO badge, which opens the Pro sheet.
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
   - Duplicates (same DOI, ISBN, or title and year) are skipped. Export the list as BibTeX, RIS or CSL-JSON (Zotero imports all three).
   - Quotes: reader highlights come in as quotes tied to their source and page; each has its in-text citation (a footnote in note styles)
     and opens its page again. Outline: sections (Introduction, Body, Conclusion, or the paper's milestones), quotes dragged into them.
     Export to Word (with real footnotes for note styles), Google Docs (copied as formatted text) or text.
   - Check: the draft (pasted, uploaded or picked) is checked on this device: sources never cited, citations matching no source, quotes
     without a citation, a missing or misnamed reference list, sources missing from it, the style's common slips, and the assignment's own
     rules (the style it names, at least N sources). It never writes or rewrites any of the student's work.
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
    ["fid", "zkey", "zlib", "src"].forEach(k => { if (o[k]) it[k] = cap(o[k], 120); });
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
  const toCslJson = items => JSON.stringify(items.map(x => { const c = clean(x); ["fid", "zkey", "zlib", "src"].forEach(k => delete c[k]); return c; }), null, 2);

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
    return m ? {name: m[2], at: m.index + m[1].length, body: draft.slice(m.index + m[0].length)} : null;
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
  function check(draftIn, itemsIn, o){
    o = o || {}; const style = o.style || "apa", kind = o.kind || "author-date", label = o.label || style, want = headingOf(style, kind);
    const draft = String(draftIn || "").replace(/\r\n?/g, "\n"), sources = (itemsIn || []).map(clean), issues = [], push = (k, t, d, fix) => issues.push({k, t, d: d || "", fix: fix || ""});
    const ref = refSection(draft), body = ref ? draft.slice(0, ref.at) : draft;
    const cited = new Set(), unknown = [], slips = new Set();
    // a source with no author or title has no name to look for: famRe("") would match every citation, so leave it out
    const named = sources.filter(s => keyName(s)), match = seg => named.filter(s => famRe(keyName(s)).test(seg));
    let m; const PAR = /\(([^()\n]{2,200})\)/g;
    while ((m = PAR.exec(body))) {
      m[1].split(/;\s*/).forEach(seg => {
        seg = sq(seg); if (!seg) return;
        const hits = match(seg), hasYear = YEAR.test(seg), mlaLike = /^[“"]?[\p{Lu}][\p{L}'’-]+.*?\s\d{1,4}(?:[–-]\d+)?$/u.test(seg) && !hasYear;
        if (hits.length) hits.forEach(s => cited.add(s.id));
        else if (hasYear) {
          const before = body.slice(Math.max(0, m.index - 60), m.index), nb = named.filter(s => famRe(keyName(s)).test(before));
          if (nb.length) nb.forEach(s => cited.add(s.id));
          else if (/^[“"]?[\p{Lu}]/u.test(seg) || /(\p{Lu}[\p{L}'’-]+)\s*$/u.test(before)) unknown.push(seg);
        } else if (mlaLike && kind === "author" && !/^(p|pp|para|ch|fig|figure|table|see|chapter|section)\b/i.test(seg)) unknown.push(seg);
        if (style === "apa" && hasYear) {
          if (/\b\p{Lu}[\p{L}'’-]+ and \p{Lu}[\p{L}'’-]+,/u.test(seg)) slips.add("In APA, use & between two authors inside brackets: (Smith & Lee, 2021).");
          if (/^[\p{Lu}][\p{L}'’-]+(?: et al\.)? (1[5-9]\d\d|20\d\d)\b/u.test(seg)) slips.add("In APA, put a comma between the name and the year: (Smith, 2021).");
          if (/\bpg\.?\s*\d/.test(seg)) slips.add("In APA, write p. 4 (or pp. 4–6) for pages, not pg.");
        }
        if (kind === "author") {
          if (/^[\p{Lu}][\p{L}'’-]+(?: et al\.)?,\s*(p{1,2}\.\s*)?\d/u.test(seg)) slips.add("In MLA, there's no comma or p. between the name and the page: (Smith 42).");
          if (hasYear && hits.length) slips.add("MLA in-text citations use the author and the page, not the year: (Smith 42).");
        }
        if (kind === "numeric" && hits.length && hasYear) slips.add(`${label} uses numbered citations, not author and year.`);
      });
    }
    const BR = /\[(\d{1,3}(?:\s*[,–-]\s*\d{1,3})*)(?:,\s*(?:pp?\.\s*)?[\d–-]+)?\]/g;
    while ((m = BR.exec(body))) m[1].split(/\s*,\s*/).forEach(part => { const r = part.split(/\s*[–-]\s*/).map(Number); for (let k = r[0]; k <= (r[1] || r[0]) && k - r[0] < 50; k++) { if (sources[k - 1] && (kind === "numeric" || (o.order && o.order[k - 1]))) cited.add((o.order ? o.order[k - 1] : sources[k - 1].id)); else if (kind === "numeric") unknown.push(`[${k}]`); } });
    if (kind !== "numeric" && /\[\d{1,3}\]/.test(body) && !/\(([^()]*\b(1[5-9]\d\d|20\d\d))\)/.test(body)) slips.add(`Your draft uses numbered citations like [1]; ${label} uses the author${kind === "author" ? " and page" : kind === "note" ? " in footnotes" : " and year"}.`);
    // names in footnotes (note styles): when the footnotes came along in the paste, count a source named anywhere in the body
    if (kind === "note") named.forEach(s => { if (famRe(keyName(s)).test(body)) cited.add(s.id); });
    const bare = [];
    const Q = /[“"]([^”"\n]{30,500})[”"]/g;
    while ((m = Q.exec(body))) {
      const after = body.slice(m.index + m[0].length, m.index + m[0].length + 160), before = body.slice(Math.max(0, m.index - 200), m.index);
      const sAfter = after.split(/(?<=[.?!])\s+(?=[\p{Lu}“"])/u)[0], sBefore = before.split(/[.?!]\s+(?=[\p{Lu}“"])/u).pop();
      const has = s => /\([^()]*(\d|n\.\s?d\.)[^()]*\)/.test(s) || /\[\d{1,3}/.test(s) || /^[.,;:]?\s*\d{1,3}\b/.test(s) || (kind === "author" && named.some(x => famRe(keyName(x)).test(s)));
      if (!has(sAfter) && !has(sBefore)) bare.push(m[1].split(/\s+/).slice(0, 8).join(" "));
    }
    const n = sources.length, citedN = sources.filter(s => cited.has(s.id)).length;
    if (!n) push("warn", "No sources in your Writing Studio yet", "Add your sources to check your citations against them.");
    else if (citedN === n) push("ok", `All ${n} source${n === 1 ? " is" : "s are"} cited in your draft`);
    if (named.length < n) push("warn", `${n - named.length === 1 ? "A source has" : n - named.length + " sources have"} no title or author`, `Fill ${n - named.length === 1 ? "it" : "them"} in on the Sources tab so your citations can be checked against ${n - named.length === 1 ? "it" : "them"}.`);
    named.filter(s => !cited.has(s.id)).forEach(s => push("warn", `Never cited: ${s.title || keyName(s)}`, kind === "note" ? "Cite it in a footnote where you use it, or remove it if you didn't use it. (Footnotes don't always come along in a paste: check those by eye.)" : "Cite it where you use it, or remove it from your sources if you didn't use it."));
    [...new Set(unknown)].slice(0, 12).forEach(u => push("err", `Not in your sources: ${/^\[/.test(u) ? u : "(" + u + ")"}`, "Add this source to your Writing Studio, or check the spelling of the name."));
    if (kind !== "note") bare.slice(0, 10).forEach(q => push("err", `Quote without a citation: “${q}…”`, "Every direct quote needs an in-text citation right after it."));
    if (!ref) push(n ? "err" : "warn", `No ${want} list found`, `Add a heading called ${want} at the end, then your sources. Copy it from the Sources tab.`);
    else {
      if (ref.name.toLowerCase() !== want.toLowerCase() && HEADS[style]) push("warn", `Your list is called “${sq(ref.name)}”`, `${label} calls it ${want}.`);
      const miss = sources.filter(s => cited.has(s.id) && !famRe(keyName(s)).test(ref.body));
      miss.forEach(s => push("err", `Cited but not in your ${want} list: ${s.title || keyName(s)}`, "Add its entry to the list."));
      if (!miss.length && citedN) push("ok", `Every cited source is in your ${want} list`);
    }
    slips.forEach(t => push("warn", t));
    const r = rules(o.req);
    if (r.style && r.style !== style) push("err", `The assignment asks for ${o.names && o.names[r.style] || r.style}`, `Your Writing Studio is set to ${label}.`, "style:" + r.style);
    if (r.min) {
      const have = r.scholarly ? sources.filter(s => cited.has(s.id) && SCHOLARLY.includes(s.type)).length : citedN;
      push(have >= r.min ? "ok" : "err", `The assignment asks for at least ${r.min}${r.scholarly ? " scholarly" : ""} source${r.min === 1 ? "" : "s"}: you cite ${have}`, have >= r.min ? "" : r.scholarly ? "Journal articles, books, book sections, conference papers, theses and reports count as scholarly here." : "");
    }
    const order = {err: 0, warn: 1, ok: 2};
    issues.sort((a, b) => order[a.k] - order[b.k]);
    return {issues, cited: citedN, total: n, hasRef: !!ref};
  }
  return {TYPES, LABEL, CONT, NAMES, names, namesText, person, familyOf, date, parseDate, dateParts, yearOf, isoOf, clean, mapType, parseId, isbnOk, fromOpenLibrary, fromHtml, hostOf, keyName,
    parseBibTeX, parseRIS, parseCslJson, parseAny, toBibTeX, toRIS, toCslJson, dupOf, runs, runsHtml, runsText, engine, styleInfo, plain, check, rules, headingOf, detex, sentenceCase, looksTitleCase};
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
const styleFmt = id => BUILT_FMT[id] || (extStyles()[id] || {}).fmt || "author-date";
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
  if (info.parent) { const pid = info.parent.replace(/^https?:\/\/www\.zotero\.org\/styles\//, ""); xml = BUILT_FMT[pid] ? await styleXml(pid) : await text("https://www.zotero.org/styles/" + encodeURIComponent(pid)); }
  const rec = {title: info.title || id, fmt: CITE.styleInfo(xml).fmt || info.fmt || "author-date", xml, at: Date.now()};
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
const eligible = t => !!t && !t.prepFor && !t.breakdownOf && ((t.ws && Array.isArray(t.ws.src) && t.ws.src.length) || (t.status !== "done" && (["Assignment", "Project", "Lab"].includes(t.type) || (t.type === "Other" && WRITING.test(String(t.title || ""))))));
const MAX_SRC = 150, MAX_Q = 300, MAX_SEC = 30;
const W = {tid: "", tab: "sources", view: "", edit: null, draft: "", draftSrc: "", res: null, busy: "", err: "", el: null, hlPick: null, inp: "", note: "", z: null, imp: null, find: null};
function wsOf(t){
  const w = t && t.ws && typeof t.ws === "object" ? t.ws : {};
  return {style: typeof w.style === "string" && w.style ? w.style : "", lang: w.lang === "en-GB" ? "en-GB" : "", src: Array.isArray(w.src) ? w.src.filter(s => s && s.id) : [], q: Array.isArray(w.q) ? w.q.filter(q => q && q.id) : [], out: Array.isArray(w.out) ? w.out.filter(s => s && s.id) : []};
}
function reqText(t){
  const parts = [t.notes || ""];
  ["cv", "bs", "bb", "md", "sg", "gc"].forEach(k => { const r = t[k] && t[k].rub; if (r && Array.isArray(r.cr)) parts.push(r.cr.map(c => `${c.t} ${c.d || ""}`).join("\n")); if (t[k] && t[k].desc) parts.push(String(t[k].desc)); });
  return parts.join("\n");
}
const styleOf = (t, w) => w.style || CITE.rules(reqText(t)).style || "apa";
function save(t, w, label, extra){
  const cur = state.tasks[t.id]; if (!cur) return;
  applyChanges([{kind: "task", id: t.id, after: Object.assign(clone(cur), {ws: {style: w.style, lang: w.lang || undefined, src: w.src.slice(0, MAX_SRC), q: w.q.slice(0, MAX_Q), out: w.out.slice(0, MAX_SEC), v: 2}})}], label === undefined ? null : label, extra);
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
function milestoneOf(t){
  if (!t || !t.breakdownOf) return null;
  const parent = state.tasks[t.breakdownOf]; if (!parent || parent.status === "done" || !eligible(parent)) return null;
  const hit = STEP_TABS.find(([re]) => re.test(String(t.title || ""))); if (!hit) return null;
  const w = wsOf(parent), tab = hit[1];
  const want = Number((/\b(\d{1,2})\s+(?:\w+\s+)?sources\b/i.exec(t.title) || [])[1]) || CITE.rules(reqText(parent)).min || 0;
  const label = tab === "sources" ? (want ? `${Math.min(w.src.length, 99)} of ${want} sources` : `${w.src.length} source${w.src.length === 1 ? "" : "s"}`)
    : tab === "quotes" ? `${w.q.length} quote${w.q.length === 1 ? "" : "s"}` : tab === "outline" ? (w.out.length ? "Outline" : "Start the outline") : "Check citations";
  return {parent, tab, label, done: tab === "sources" && want > 0 && w.src.length >= want};
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

/* From the PDF reader: which papers a quote from this PDF could go to, best first */
function papersFor(fid){
  const f = state.files[fid]; if (!f) return [];
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
  return true;
}
function readerBtn(fid, h){
  if (!window.SBPRO || inPreview()) return "";
  if (h) { const t = quotedIn(fid, h.id); if (t) return `<button type="button" class="btn small" data-act="pdr-paper" data-id="${esc(h.id)}" title="${esc(t.title)}">In Paper ✓</button>`; }
  if (!papersFor(fid).length) return "";
  return `<button type="button" class="btn small" data-act="${h ? "pdr-paper" : "pdr-sel-paper"}"${h ? ` data-id="${esc(h.id)}"` : ""}>Add to Paper</button>`;
}
function open(id, tab){
  const t = state.tasks[id]; if (!t) return;
  if (window.SBPRO && SBPRO.locked()) { PLAN.openSheet(PRO_WHY); return; }
  if (W.tid !== id) Object.assign(W, {tid: id, draft: "", draftSrc: "", res: null, tab: "sources"});
  Object.assign(W, {view: "", edit: null, err: "", busy: "", hlPick: null, imp: null, find: null});
  if (tab) W.tab = tab;
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
  const cur = state.tasks[t.id], w = wsOf(cur); let added = 0, dup = 0;
  items.forEach(x => { if (w.src.length >= MAX_SRC) return; if (CITE.dupOf(x, w.src)) { dup++; return; } w.src.push(Object.assign(CITE.clean(x), {id: uid()})); added++; });
  if (added) { w.style = w.style || styleOf(cur, w); save(cur, w, label || `Added ${added} source${added === 1 ? "" : "s"}`); }
  return {added, dup};
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
function tabsHtml(w){
  const tb = (k, l, n) => `<button type="button" role="tab" class="ws-tab" data-ws-tab="${k}" aria-selected="${W.tab === k}" ${W.tab === k ? "" : 'tabindex="-1"'}>${l}${n != null ? ` <span class="ws-n">${n}</span>` : ""}</button>`;
  return `<div class="ws-tabs" role="tablist" aria-label="Writing Studio">${tb("sources", "Sources", w.src.length)}${tb("quotes", "Quotes", w.q.length)}${tb("outline", "Outline")}${tb("check", "Check")}</div>`;
}
function styleSel(st){
  const ext = extStyles(), ids = BUILT.map(b => b[0]).concat(Object.keys(ext).filter(k => !BUILT_FMT[k]));
  if (!ids.includes(st)) ids.push(st);
  return `<label class="ws-style"><span class="mini">Style</span><select data-ws-style aria-label="Citation style">${ids.map(k => `<option value="${esc(k)}" ${k === st ? "selected" : ""}>${esc(styleName(k))}</option>`).join("")}<option value="__find">More styles…</option></select></label>`;
}
const citeHtml = rs => CITE.runsHtml(rs);
function sourcesHtml(t, w){
  const files = Object.values(state.files).filter(f => isPdfFile(f) && (f.taskIds.includes(t.id) || (t.courseId && f.courseId === t.courseId)) && !w.src.some(s => s.fid === f.id)).slice(0, 40);
  const B = bibOf(t, w), st = B.st, z = zcred(), lib = library(t.id).filter(s => !CITE.dupOf(s, w.src)).length;
  const heading = CITE.headingOf(st, styleFmt(st));
  return `<div class="ws-add"><label class="f ws-grow"><span class="lh">Add a source</span><input type="text" data-ws-in placeholder="Paste a DOI, arXiv ID, ISBN or link" value="${esc(W.inp || "")}" autocomplete="off" spellcheck="false" data-noenter></label>
      <button type="button" class="btn primary" data-ws-add ${W.busy ? "disabled" : ""}>${W.busy === "add" ? "Looking Up…" : "Add"}</button></div>
    <div class="ws-row ws-src-row"><button type="button" class="btn small ws-zbtn" data-ws-zot>${ZICON} ${z ? "From Zotero" : "Connect Zotero"}</button><button type="button" class="btn small" data-ws-imp>Import File</button><button type="button" class="btn small" data-ws-manual>Add by Hand</button>${lib ? `<button type="button" class="btn small" data-ws-lib>My Library <span class="ws-n">${lib}</span></button>` : ""}${files.length ? `<select data-ws-file aria-label="Add a PDF in Studyboard as a source"><option value="">Add a PDF from Studyboard…</option>${files.map(f => `<option value="${esc(f.id)}">${esc(f.name)}</option>`).join("")}</select>` : ""}</div>
    ${W.err ? `<p class="mini ws-err" role="alert">${esc(W.err)}</p>` : W.okMsg ? `<p class="mini ws-ok" role="status">${esc(W.okMsg)}</p>` : ""}
    ${W.engErr === st ? `<p class="mini ws-err">Couldn't load ${esc(styleName(st))}. ${BUILT_FMT[st] ? "Reload Studyboard and try again." : "It's fetched from zotero.org the first time: check your connection."}</p>` : ""}
    ${B.entries.length ? `<h3 class="fsec ws-bibh">${esc(heading)} <span class="mini">${esc(styleName(st))}${B.ready ? "" : " · formatting…"}</span></h3><ol class="ws-refs${B.hang ? " hang" : ""}">${B.entries.map(e => { const s = w.src.find(y => y.id === e.id); if (!s) return ""; return `<li class="ws-ref">
        <p class="ws-cite">${citeHtml(e.runs)}</p>
        <p class="mini ws-info">${CITE.keyName(s) ? "" : '<b class="ws-need">Needs a title and author</b> · '}${esc(typeName(s.type))}${s.zkey ? " · Zotero" : ""}${s.fid && state.files[s.fid] ? " · PDF in Studyboard" : ""} · In text: ${citeHtml(citeOf(t, w, s.id, ""))}</p>
        <div class="ws-acts"><button type="button" class="ws-act" data-ws-copy="${esc(s.id)}">Copy</button><button type="button" class="ws-act" data-ws-edit="${esc(s.id)}">Edit</button>${s.fid && state.files[s.fid] ? `<button type="button" class="ws-act" data-ws-openf="${esc(s.fid)}">Open PDF</button>` : s.URL || s.DOI ? `<a class="ws-act" href="${esc(s.DOI ? "https://doi.org/" + s.DOI : s.URL)}" target="_blank" rel="noopener noreferrer">Open</a>` : ""}<span class="spacer"></span><button type="button" class="ws-act ws-rm" data-ws-rm="${esc(s.id)}" aria-label="Remove ${esc(String(s.title || "this source").slice(0, 60))}" title="Remove">${TRASH}</button></div></li>`; }).join("")}</ol>
        ${w.src.some(s => s.zkey) && z ? `<p class="mini" style="margin:0"><button type="button" class="link-btn" data-ws-zsync>Update From Zotero</button> refreshes the ${w.src.filter(s => s.zkey).length} source${w.src.filter(s => s.zkey).length === 1 ? "" : "s"} that came from Zotero.</p>` : ""}`
      : `<div class="ws-empty"><b>No sources yet.</b><p class="mini">Paste a DOI (10.1037/…), an ISBN or a link above, pull them from Zotero, or import a BibTeX or RIS file. Your citations and ${esc(heading)} list build themselves.</p></div>`}
    <p class="mini ws-priv">DOIs are looked up at doi.org and ISBNs with Open Library; only the number is sent. Citations are made on this device with citeproc-js and CSL, the engine and styles Zotero uses.</p>`;
}
const TRASH = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>';
const ZICON = '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path fill="currentColor" d="M5 4h14v2.6L9.3 17.4H19V20H5v-2.6l9.7-10.8H5z"/></svg>';
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
  const secName = id => (w.out.find(s => s.id === id) || {}).t || "", pick = W.hlPick, note = styleFmt(styleOf(t, w)) === "note";
  if (pick) {
    return `<p style="margin:0">Pick the highlights to add as quotes. Each keeps its page, and its PDF becomes a source if it isn't one yet.</p>
      ${pick.length ? `<div class="ws-hls">${pick.map(g => `<fieldset class="ws-hlf"><legend><b>${esc(g.name)}</b></legend>${g.hl.map(h => `<label class="ws-hl"><input type="checkbox" data-ws-hl="${esc(g.fid)}:${esc(h.id)}" checked><span>“${esc(h.t.slice(0, 300))}${h.t.length > 300 ? "…" : ""}” <span class="mini">p. ${esc(String(h.p))}</span></span></label>`).join("")}</fieldset>`).join("")}</div>`
        : `<div class="ws-empty"><b>No new highlights.</b><p class="mini">Open a PDF for this paper in the reader, highlight the passages you want to use, and they show up here.</p></div>`}`;
  }
  return `<div class="ws-row"><button type="button" class="btn small primary" data-ws-hlpick>Add From Highlights</button><button type="button" class="btn small" data-ws-qnew>Add a Quote</button></div>
    ${W.qform ? `<div class="ws-qform"><label class="f"><span class="lh">Quote</span><textarea data-wq-t rows="3" data-noenter></textarea></label>
      <div class="ws-row"><select data-wq-s aria-label="Source">${w.src.length ? w.src.map(s => `<option value="${esc(s.id)}">${esc(srcLabel(s))}</option>`).join("") : `<option value="">Add a source first</option>`}</select><label class="ws-pg"><span class="mini">Page</span><input type="text" data-wq-p inputmode="numeric" size="5"></label><button type="button" class="btn small primary" data-wq-save ${w.src.length ? "" : "disabled"}>Save Quote</button></div></div>` : ""}
    ${W.err ? `<p class="mini ws-err" role="alert">${esc(W.err)}</p>` : ""}
    ${w.q.length ? `<ul class="ws-qs">${w.q.map(q => { const s = w.src.find(x => x.id === q.sid); return `<li class="ws-q">
        <blockquote>“${esc(q.t)}”</blockquote>
        <p class="mini ws-info">${s ? (note ? "Footnote: " : "") + citeHtml(citeOf(t, w, s.id, q.p)) : "No source"}${q.sec && secName(q.sec) ? ` · in ${esc(secName(q.sec))}` : ""}</p>
        <div class="ws-acts"><button type="button" class="ws-act" data-ws-qcopy="${esc(q.id)}">Copy With Citation</button>${q.fid && state.files[q.fid] ? `<button type="button" class="ws-act" data-ws-qopen="${esc(q.id)}">Open Page ${esc(String(q.p || ""))}</button>` : ""}<span class="spacer"></span><button type="button" class="ws-act ws-rm" data-ws-qrm="${esc(q.id)}" aria-label="Remove this quote" title="Remove">${TRASH}</button></div></li>`; }).join("")}</ul>`
      : `<div class="ws-empty"><b>No quotes yet.</b><p class="mini">Highlight passages in the PDF reader, then Add From Highlights. Every quote keeps its source and page, so you'll always know where you read it.</p></div>`}`;
}
function outlineHtml(t, w){
  const steps = allTasks().filter(x => x.breakdownOf === t.id).sort((a, b) => String(a.due).localeCompare(String(b.due)));
  const qHtml = q => `<li class="ws-oq" draggable="true" data-ws-dq="${esc(q.id)}"><span class="ws-grip" aria-hidden="true">⋮⋮</span><span class="ws-oqt">“${esc(q.t.length > 220 ? q.t.slice(0, 220) + "…" : q.t)}” <span class="mini">${q.sid ? citeHtml(citeOf(t, w, q.sid, q.p)) : ""}</span></span>
    <select data-ws-mv="${esc(q.id)}" aria-label="Move this quote to a section"><option value="">Not placed</option>${w.out.map(s2 => `<option value="${esc(s2.id)}" ${q.sec === s2.id ? "selected" : ""}>${esc(s2.t)}</option>`).join("")}</select></li>`;
  const loose = w.q.filter(q => !q.sec || !w.out.some(s => s.id === q.sec));
  if (!w.out.length) return `<div class="ws-empty"><b>Start an outline.</b><p class="mini">Make sections, then drag your quotes into them. Export it to Word or Google Docs with the citations in place.</p>
      <div class="ws-row" style="justify-content:center"><button type="button" class="btn small primary" data-ws-seed="basic">Introduction, Body, Conclusion</button>${steps.length ? `<button type="button" class="btn small" data-ws-seed="steps">Use the ${steps.length} Milestones</button>` : ""}<button type="button" class="btn small" data-ws-secadd>Add a Section</button></div></div>`;
  return `<p class="mini" style="margin:0">Drag quotes into a section (or use each quote's menu). Notes are your own words, for you.</p>
    <div class="ws-drop ws-loose" data-ws-drop=""><div class="ws-sech"><b>Not placed yet</b><span class="mini">${loose.length}</span></div>${loose.length ? `<ul class="ws-oqs">${loose.map(qHtml).join("")}</ul>` : `<p class="mini" style="margin:0">Every quote has a place.</p>`}</div>
    <ol class="ws-secs">${w.out.map((s, i) => { const qs = w.q.filter(q => q.sec === s.id); return `<li class="ws-drop ws-sec" data-ws-drop="${esc(s.id)}">
      <div class="ws-sech"><input type="text" class="ws-sect" data-ws-sect="${esc(s.id)}" value="${esc(s.t)}" aria-label="Section name" maxlength="120"><span class="mini">${qs.length}</span>
        <button type="button" class="icon-btn" data-ws-up="${esc(s.id)}" aria-label="Move ${esc(s.t)} up" ${i ? "" : "disabled"}>↑</button><button type="button" class="icon-btn" data-ws-dn="${esc(s.id)}" aria-label="Move ${esc(s.t)} down" ${i < w.out.length - 1 ? "" : "disabled"}>↓</button><button type="button" class="icon-btn" data-ws-secrm="${esc(s.id)}" aria-label="Remove section ${esc(s.t)}">✕</button></div>
      <textarea class="ws-secn" data-ws-secn="${esc(s.id)}" rows="1" placeholder="Your notes for this section" data-noenter>${esc(s.n || "")}</textarea>
      ${qs.length ? `<ul class="ws-oqs">${qs.map(qHtml).join("")}</ul>` : `<p class="mini ws-hint">Drop quotes here</p>`}</li>`; }).join("")}</ol>
    <div class="ws-row"><button type="button" class="btn small" data-ws-secadd>Add a Section</button></div>`;
}
function checkHtml(t, w){
  const files = Object.values(state.files).filter(f => f && f.kind !== "link" && (f.taskIds.includes(t.id) || (t.courseId && f.courseId === t.courseId)) && /\.(pdf|docx|txt|md)$/i.test(f.name || "")).slice(0, 40);
  const r = W.res, words = W.draft.trim() ? W.draft.trim().split(/\s+/).length : 0, req = CITE.rules(reqText(t)), st = styleOf(t, w);
  const ic = {err: "✕", warn: "!", ok: "✓"};
  return `<p style="margin:0">Check your draft's citations against your sources before you hand it in. It runs on this device and never changes your writing.</p>
    ${req.style || req.min ? `<p class="mini ws-note">From the assignment: ${esc([req.style ? styleName(req.style) : "", req.min ? `at least ${req.min}${req.scholarly ? " scholarly" : ""} sources` : ""].filter(Boolean).join(", "))}.</p>` : ""}
    <label class="f"><span class="lh">Your Draft <span class="hint" data-ws-wc>${words ? `about ${words} words` : ""}</span></span><textarea data-ws-draft rows="7" data-noenter placeholder="Paste your draft, with its ${esc(CITE.headingOf(st, styleFmt(st)))} list">${esc(W.draft)}</textarea></label>
    <div class="ws-row"><span class="mini ws-grow">${esc(W.draftSrc)}</span><label class="btn small ws-pick">Upload Draft<input type="file" accept=".pdf,.docx,.txt,.md,application/pdf,text/plain" data-ws-dfile class="sr" tabindex="-1" aria-label="Choose your draft file"></label>${files.length ? `<select data-ws-dpick aria-label="Use a file in Studyboard"><option value="">Or use a file in Studyboard</option>${files.map(f => `<option value="${esc(f.id)}">${esc(f.name)}</option>`).join("")}</select>` : ""}</div>
    ${W.err ? `<p class="mini ws-err" role="alert">${esc(W.err)}</p>` : ""}
    ${r ? `<div class="ws-res"><p class="ws-sum"><b>${r.total ? `${r.cited} of ${r.total} source${r.total === 1 ? "" : "s"} cited` : "No sources to check against"}</b> · ${r.issues.filter(x => x.k === "err").length} to fix · ${r.issues.filter(x => x.k === "warn").length} to look at</p>
      <ul class="ws-issues">${r.issues.map(x => `<li class="ws-is k-${x.k}"><span class="ws-ic" aria-hidden="true">${ic[x.k]}</span><span><b>${esc(x.t)}</b>${x.d ? `<span class="mini">${esc(x.d)}</span>` : ""}${x.fix && x.fix.startsWith("style:") ? ` <button type="button" class="link-btn" data-ws-setst="${esc(x.fix.slice(6))}">Switch to ${esc(styleShort(x.fix.slice(6)))}</button>` : ""}</span></li>`).join("")}</ul></div>` : ""}`;
}
function runCheck(t){
  const w = wsOf(t), st = styleOf(t, w), names = {}; BUILT.forEach(([k, n]) => { names[k] = n; });
  const B = bibOf(t, w), order = styleFmt(st) === "numeric" ? B.entries.map(e => e.id) : null;
  return CITE.check(W.draft, order ? order.map(id => w.src.find(s => s.id === id)).filter(Boolean) : w.src, {style: st, kind: styleFmt(st), label: styleShort(st), req: reqText(t), names});
}
function footHtml(t, w){
  const back = `<button type="button" class="btn" data-act="edit-task" data-id="${esc(t.id)}">Back to Task</button><span class="spacer"></span>`, cancel = `<button type="button" class="btn" data-ws-vback>Back</button><span class="spacer"></span>`;
  if (W.view === "zotero") { const z = zcred(), n = W.z && W.z.sel ? W.z.sel.size : 0; return cancel + (z ? `<button type="button" class="btn primary" data-wz-add ${n && !W.busy ? "" : "disabled"}>${W.busy === "z" ? "Adding…" : `Add ${n || ""} to This Paper`}</button>` : `<button type="button" class="btn primary" data-wz-connect ${W.busy ? "disabled" : ""}>${W.busy === "zc" ? "Connecting…" : "Connect"}</button>`); }
  if (W.view === "import") return cancel + (W.imp && W.imp.items ? `<button type="button" class="btn primary" data-wi-add>Add Selected</button>` : `<button type="button" class="btn primary" data-wi-read>Read</button>`);
  if (W.view === "library") return cancel + `<button type="button" class="btn primary" data-wl-add>Add Selected</button>`;
  if (W.view === "styles") return cancel;
  if (W.tab === "sources" && W.edit) return `<button type="button" class="btn" data-ws-cancel>Cancel</button><span class="spacer"></span><button type="button" class="btn primary" data-ws-esave>Save Source</button>`;
  if (W.tab === "sources") return back + (w.src.length ? `<button type="button" class="btn" data-ws-bibcopy>Copy List</button><button type="button" class="btn primary" data-ws-export>Export…</button>` : `<button type="button" class="btn primary" data-act="close">Done</button>`);
  if (W.tab === "quotes" && W.hlPick) return `<button type="button" class="btn" data-ws-hlcancel>Cancel</button><span class="spacer"></span>${W.hlPick.length ? `<button type="button" class="btn primary" data-ws-hladd ${W.busy ? "disabled" : ""}>${W.busy === "hl" ? "Adding…" : "Add Quotes"}</button>` : ""}`;
  if (W.tab === "outline") return back + (w.out.length || w.q.length ? `<button type="button" class="btn primary" data-ws-export>Export…</button>` : "");
  if (W.tab === "check") return back + `<button type="button" class="btn primary" data-ws-check>Check My Citations</button>`;
  return back + `<button type="button" class="btn primary" data-act="close">Done</button>`;
}
function draw(fresh){
  const t = state.tasks[W.tid]; if (!t) { if (shown()) dlg.close(); return; }
  const w = wsOf(t), st = styleOf(t, w);
  const VIEW = {zotero: ["Zotero", () => zotHtml(t, w)], import: ["Import Sources", impHtml], library: ["My Library", () => libHtml(t, w)], styles: ["More Styles", findHtml]}[W.view];
  const body = VIEW ? VIEW[1]() : W.tab === "quotes" ? quotesHtml(t, w) : W.tab === "outline" ? outlineHtml(t, w) : W.tab === "check" ? checkHtml(t, w) : W.edit ? editHtml(t, w) : sourcesHtml(t, w);
  const inner = `${(VIEW ? x => x : betaHead)(bandHead(VIEW ? VIEW[0] : "Writing Studio", ICON.replace('width="16" height="16"', ""), t.courseId ? colorOf(t.courseId) : "#2F6FE4", "", esc(t.title)))}
    ${VIEW ? "" : `<div class="ws-bar">${tabsHtml(w)}${styleSel(st)}</div>`}<div class="sheet-body ws-body" role="${VIEW ? "region" : "tabpanel"}">${body}</div><div class="sheet-foot">${footHtml(t, w)}</div>`;
  const y = !fresh && shown() ? (W.el.querySelector(".ws-body") || {}).scrollTop || 0 : 0;
  if (shown()) W.el.innerHTML = inner;
  else { openSheet(`<div class="sheet ws-sheet">${inner}</div>`); W.el = dlg.querySelector(".ws-sheet"); }
  const b = W.el.querySelector(".ws-body"); if (b && y) b.scrollTop = y;
  wire(t);
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

/* ---------- Wiring ---------- */
let DRAG = "";
function wire(t){
  const R = W.el, q = s => R.querySelector(s), qa = s => [...R.querySelectorAll(s)];
  const cur = () => state.tasks[t.id], ws = () => wsOf(cur()), st = () => styleOf(cur(), ws());
  const on = (sel, ev, fn) => { const el = q(sel); if (el) el.addEventListener(ev, fn); return el; };
  const vback = q("[data-ws-vback]"); if (vback) vback.addEventListener("click", () => { W.view = ""; W.err = ""; draw(true); });
  // a toast about the last tab (e.g. "Started an outline · Undo") goes with it
  qa("[data-ws-tab]").forEach(b => b.addEventListener("click", () => { if (b.dataset.wsTab !== W.tab) { try { toastHide(); } catch (e) {} } W.tab = b.dataset.wsTab; W.edit = null; W.err = ""; W.okMsg = ""; W.hlPick = null; W.qform = false; draw(true); R.querySelector(`[data-ws-tab="${W.tab}"]`).focus(); }));
  on(".ws-tabs", "keydown", e => { if (!/^Arrow(Left|Right)$/.test(e.key)) return; const ks = ["sources", "quotes", "outline", "check"], i = ks.indexOf(W.tab); W.tab = ks[(i + (e.key === "ArrowRight" ? 1 : 3)) % 4]; W.edit = null; W.hlPick = null; draw(true); R.querySelector(`[data-ws-tab="${W.tab}"]`).focus(); });
  const sel = on("[data-ws-style]", "change", () => {
    if (sel.value === "__find") { W.view = "styles"; W.find = W.find || {q: ""}; W.err = ""; draw(true); const i = q("[data-wy-q]"); if (i) i.focus(); return; }
    const w = ws(); w.style = sel.value; save(cur(), w, null); W.engErr = ""; if (W.res) W.res = null; draw();
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
  qa("[data-ws-openf]").forEach(b => b.addEventListener("click", () => { if (window.SBPRO && SBPRO.openLink) SBPRO.openLink({kind: "file", id: b.dataset.wsOpenf}, 0); }));
  qa("[data-ws-rm]").forEach(b => b.addEventListener("click", () => { const w = ws(), s = w.src.find(x => x.id === b.dataset.wsRm); w.src = w.src.filter(x => x.id !== b.dataset.wsRm); w.q = w.q.map(x => x.sid === b.dataset.wsRm ? Object.assign({}, x, {sid: ""}) : x); save(cur(), w, `Removed ${s && s.title ? "“" + String(s.title).slice(0, 40) + "”" : "a source"}`); draw(); }));
  qa("[data-ws-copy]").forEach(b => b.addEventListener("click", async () => { const B = bibOf(cur(), ws()), e = B.entries.find(x => x.id === b.dataset.wsCopy); if (!e) return; toast(await noteCopyRich(CITE.runsHtml(e.runs), CITE.runsText(e.runs)) ? "Citation copied" : "Couldn't copy"); }));
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
      w.style = w.style || st(); save(cur(), w, W.edit === "new" ? "Added a source" : "Edited a source"); W.edit = null; W.form = null; W.note = ""; draw();
    });
  }
  // Zotero
  const zk = q("[data-wz-key]"); if (zk) zk.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); q("[data-wz-connect]").click(); } });
  on("[data-wz-connect]", "click", async () => { W.busy = "zc"; W.err = ""; const key = zk ? zk.value : ""; draw(); try { await zconnect(key); W.z = null; W.busy = ""; draw(); zload(); } catch (e) { W.busy = ""; W.err = e.message; draw(); } });
  on("[data-wz-off]", "click", () => { try { localStorage.removeItem(ZKEY); } catch (e) {} W.z = null; toast("Zotero disconnected on this device"); draw(); });
  const zl = on("[data-wz-lib]", "change", () => { W.z.lib = zl.value; W.z.col = ""; W.z.cols = null; zload(); });
  const zc = on("[data-wz-col]", "change", () => { W.z.col = zc.value; zload(); });
  const zq = q("[data-wz-q]"); if (zq) { zq.addEventListener("input", () => { W.z.q = zq.value; }); zq.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); zload(); } }); }
  on("[data-wz-go]", "click", () => zload());
  on("[data-wz-more]", "click", () => zload(true));
  qa("[data-wz-pick]").forEach(c => c.addEventListener("change", () => { const S = W.z.sel; if (c.checked) S.add(c.dataset.wzPick); else S.delete(c.dataset.wzPick); const b = q("[data-wz-add]"); if (b) { b.disabled = !S.size; b.textContent = `Add ${S.size || ""} to This Paper`; } }));
  on("[data-wz-all]", "click", () => { qa("[data-wz-pick]").forEach(c => { if (!c.disabled) { c.checked = true; W.z.sel.add(c.dataset.wzPick); } }); draw(); });
  on("[data-wz-add]", "click", () => { const Z = W.z, items = (Z.items || []).filter(x => Z.sel.has(x.key)).map(x => x.csl); const r = addItems(cur(), items, `Added ${items.length} source${items.length === 1 ? "" : "s"} from Zotero`); Z.sel = new Set(); W.view = ""; W.okMsg = `Added ${r.added} from Zotero${r.dup ? `; ${r.dup} ${r.dup === 1 ? "was" : "were"} already here` : ""}.`; draw(true); });
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
  qa("[data-ws-qopen]").forEach(b => b.addEventListener("click", () => { const x = ws().q.find(y => y.id === b.dataset.wsQopen); if (x && window.SBPRO && SBPRO.openLink) SBPRO.openLink({kind: "file", id: x.fid}, Number(x.p) || 0); }));
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
  // Check
  const dr = q("[data-ws-draft]"); if (dr) dr.addEventListener("input", () => { W.draft = dr.value; W.draftSrc = ""; const n = W.draft.trim() ? W.draft.trim().split(/\s+/).length : 0, h = q("[data-ws-wc]"); if (h) h.textContent = n ? `about ${n} words` : ""; });
  const df = on("[data-ws-dfile]", "change", async () => { const f = df.files && df.files[0]; if (!f) return; try { const x = (await draftFromFile(f)).trim(); if (x.replace(/\s/g, "").length < 20) throw new Error(`${f.name} has no text that can be read (a scan?). Paste the text instead.`); W.draft = x; W.draftSrc = `From ${f.name}.`; W.err = ""; } catch (e) { W.err = e && e.message && !/^[a-z]/.test(e.message) ? e.message : `Couldn't read ${f.name}. Paste the text instead.`; } draw(); });
  const dp = on("[data-ws-dpick]", "change", async () => { const f = state.files[dp.value]; if (!f) return; let x = ""; try { x = window.SBFILETEXT ? String(await SBFILETEXT(f.id, 200000) || "").trim() : ""; } catch (e) { x = ""; } if (x.replace(/\s/g, "").length < 20) W.err = `Couldn't read the text in ${f.name}. Paste your draft instead.`; else { W.draft = x; W.draftSrc = `From ${f.name}.`; W.err = ""; } draw(); });
  on("[data-ws-check]", "click", () => {
    if (W.draft.trim().split(/\s+/).length < 30) { W.err = W.draft.trim() ? "Your draft is too short to check. Paste at least a paragraph, upload it or pick a file." : "Add your draft first: paste it, upload it or pick a file."; W.res = null; draw(); return; }
    W.err = ""; W.res = runCheck(cur()); draw();
    const r = W.el.querySelector(".ws-res"); if (r && r.scrollIntoView) r.scrollIntoView({block: "nearest"});
  });
  qa("[data-ws-setst]").forEach(b => b.addEventListener("click", () => { const w = ws(); w.style = b.dataset.wsSetst; save(cur(), w, `Citation style set to ${styleName(w.style)}`); W.res = runCheck(cur()); draw(); }));
}
// Undo, sync from another device, or an edit elsewhere: the open Studio follows (not while something is being typed in it)
let redrawT = 0;
hook("changed", changes => {
  if (!shown() || !(changes || []).some(c => (c.kind === "task" && c.id === W.tid) || c.kind === "file")) return;
  clearTimeout(redrawT);
  redrawT = setTimeout(() => {
    if (!shown()) return;
    const a = document.activeElement, typing = a && W.el.contains(a) && /^(INPUT|TEXTAREA)$/.test(a.tagName) && a.type !== "checkbox";
    if (typing || W.edit || W.busy || DRAG) return;
    if (!state.tasks[W.tid]) { dlg.close(); return; }
    draw();
  }, 30);
});
hook("act", (act, el, id) => {
  if (act !== "ws-open") return false;
  if (dlg.open) dlg.close();
  open(id, el && el.dataset ? el.dataset.wsTo : ""); return true;
});
if (window.SBPRO) SBPRO.addFeature({id: "writing", name: "Writing Studio", where: "On a paper, essay or project: sources (with Zotero), citations in 10,000+ styles, quotes from your highlights, an outline and a citation check", icon: '<path d="M4 19.5V5a2 2 0 0 1 2-2h12v15H6a2 2 0 0 0-2 1.5zM4 19.5A2 2 0 0 0 6 21h12"/><path d="M9 7h6M9 11h4"/>'});

const css = document.createElement("style");
css.textContent = `
dialog:has(.ws-sheet){width:min(840px,calc(100% - 24px))}
/* the tabs change the body's height: keep the window's top edge still (anchored near the top; a full-height sheet on phones) so the tabs don't slide away from the pointer */
@media (min-width:601px){dialog:has(.ws-sheet){margin:4vh auto auto}}
@media (max-width:600px){dialog:has(.ws-sheet){height:90vh;height:90dvh}dialog:has(.ws-sheet) > .ws-sheet{height:100%}.ws-sheet > .ws-body{flex:1 1 auto}}
.ws-sheet{display:flex;flex-direction:column;max-height:inherit}
.ws-bar{display:flex;flex-wrap:wrap;align-items:center;gap:6px 12px;padding:6px 20px 0;border-bottom:1px solid var(--line)}
.ws-tabs{display:flex;gap:2px;flex:1 1 auto;min-width:0;overflow-x:auto;scrollbar-width:none}
.ws-tab{border:0;background:none;color:var(--muted);font:inherit;font-weight:600;padding:9px 10px;border-bottom:2px solid transparent;cursor:pointer;white-space:nowrap}
.ws-tab[aria-selected="true"]{color:var(--ink);border-bottom-color:var(--accent,#2F6FE4)}
.ws-n{display:inline-block;min-width:1.4em;font-size:.72rem;border-radius:9px;padding:0 5px;background:var(--soft,#EEF1F6);color:var(--muted);text-align:center}
.ws-style{display:flex;align-items:center;gap:6px;padding-bottom:6px;min-width:0}
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
@media (max-width:560px){.ws-bar{padding:4px 12px 0}.ws-tab{padding:9px 6px}.ws-tabs{flex:1 1 100%}.ws-style select{max-width:160px}.ws-add{flex-wrap:wrap}.ws-oq{flex-wrap:wrap}.ws-oq select{max-width:100%;flex:1 1 100%}}
`;
document.head.appendChild(css);

window.SBWRITE = {taskBtn, open, CITE, eligible, state: () => W, styleName, loadCiteproc, papersFor, quotedIn, addQuote, readerBtn, milestoneOf};
})();
