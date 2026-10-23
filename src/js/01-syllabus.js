/* ===== module: 01-syllabus.js: the app's core, syllabus parsing and import ===== */
/* ---------- Syllabus parsing (rule-based, no AI) ---------- */
const SY = (() => {
  const MONTH_RE = "(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\\.?";
  const MIDX = m => ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"].indexOf(m.toLowerCase().slice(0, 3));
  const ORD = "(?:st|nd|rd|th)?";
  const WEEKDAY_RE = /\b(mon(?:day)?|tues?(?:day)?|wed(?:nesday)?|thu(?:rs?(?:day)?)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?)\b\.?,?/gi;
  const pad2 = n => String(n).padStart(2, "0");
  const isoOf = (y, m, d) => { const dt = new Date(y, m, d); return (dt.getMonth() === m && dt.getDate() === d) ? `${y}-${pad2(m + 1)}-${pad2(d)}` : ""; };

  function termInfo(text){
    let m = text.match(/\b(fall|autumn|spring|summer|winter)\s*(?:semester|quarter|term|session)?\s*[,'’]?\s*(20\d{2})\b/i) || text.match(/\b(20\d{2})\s*(fall|autumn|spring|summer|winter)\b/i);
    if (!m) {
      const s2 = text.match(/\b(fall|autumn|spring|summer|winter)\s*(?:semester|quarter|term)?\s*['’](\d{2})\b/i) || text.match(/\b(FA|FL|AU|SP|SU|SM|WI|WN)\s?-?(\d{2})\b/);
      if (!s2) return null;
      const map = {fa:"fall", fl:"fall", au:"fall", sp:"spring", su:"summer", sm:"summer", wi:"winter", wn:"winter"};
      const season = map[s2[1].toLowerCase()] || s2[1].toLowerCase();
      return {season: season === "autumn" ? "fall" : season, year: 2000 + Number(s2[2]), label: s2[0]};
    }
    const season = (isNaN(m[1]) ? m[1] : m[2]).toLowerCase(), year = Number(isNaN(m[1]) ? m[2] : m[1]);
    return {season: season === "autumn" ? "fall" : season, year, label: m[0]};
  }
  function makeYearFor(term, today){
    return (mo) => {
      if (term) {
        if (term.season === "fall" && mo <= 1) return term.year + 1;
        if (term.season === "winter" && mo >= 10) return term.year - 1;
        return term.year;
      }
      const t = new Date(today + "T00:00:00");
      let y = t.getFullYear();
      const d = new Date(y, mo, 15);
      if ((t - d) / 864e5 > 120) y += 1;
      else if ((d - t) / 864e5 > 240) y -= 1;
      return y;
    };
  }

  // Find all dates in a line. Returns [{index, end, iso, isoEnd}]
  // Handles month names (Oct 5, 5 Oct, October the 5th, 5th of October, Oct-5, 5-Oct-26, Oct.5), numeric dates
  // (10/5, 10/5/26, 10-05-2026, 10.5.2026, 2026-10-05, 2026/10/05), day-first dates when the syllabus uses them
  // (25/10), ranges (Oct 5-9, Oct 30 - Nov 2, 5-9 Oct, 10/5-10/9), lists (Oct 5 & 7) and weekday forms (Tue 9-30).
  let DAY_FIRST = false;
  const WDAY = "(?:mon|tue|tues|wed|weds|thu|thur|thurs|fri|sat|sun)(?:day|sday|nesday|rsday|urday)?\\.?";
  const YR = "(?:,?\\s*(?:(20\\d{2})|['’](\\d{2})))";
  const RANGE = "\\s*(?:-|–|—|to|through|thru|until|till)\\s*";
  const y2 = (full, short) => full ? Number(full) : short ? 2000 + Number(short) : null;
  const yNum = s => s ? (s.length === 2 ? 2000 + Number(s) : Number(s)) : null;
  function findDates(line, yearFor){
    const out = [], used = [];
    const overlap = (a, b) => used.some(([x, y]) => a < y && b > x);
    const push = (idx, end, iso, isoEnd) => { if (!iso || overlap(idx, end)) return false; used.push([idx, end]); out.push({index: idx, end, iso, isoEnd: isoEnd || ""}); return true; };
    const md = (a, b) => { // numeric month/day order
      a = Number(a); b = Number(b);
      if (a > 12 && b <= 12) return [b - 1, a];
      if (DAY_FIRST && b <= 12) return [b - 1, a];
      return [a - 1, b];
    };
    let m;
    // ISO and year-first numeric: 2026-10-05, 2026/10/05, 2026.10.05
    const reISO = /\b(20\d{2})([-/.])(\d{1,2})\2(\d{1,2})\b/g;
    while ((m = reISO.exec(line))) push(m.index, m.index + m[0].length, isoOf(Number(m[1]), Number(m[3]) - 1, Number(m[4])));
    // Day-month-year joined by dashes, slashes or dots: 5-Oct-26, 05/Oct/2026
    const reDMY = new RegExp("\\b(\\d{1,2})[-/.]" + MONTH_RE + "[-/.](20\\d{2}|\\d{2})(?![\\d:])", "gi");
    while ((m = reDMY.exec(line))) push(m.index, m.index + m[0].length, isoOf(yNum(m[3]), MIDX(m[2]), Number(m[1])));
    // Month name first: Oct 5, October 5th, Oct. 5, 2026, Oct the 5th, Oct-5, Oct.5, with optional range to another day or month
    const reA = new RegExp("\\b" + MONTH_RE + "(?:\\s*[-/]\\s*|\\s+the\\s+|\\s*)(\\d{1,2})" + ORD + "(?!\\d)(?!:\\d)" + YR + "?(?:" + RANGE + "(?:" + MONTH_RE + "\\s*[-/]?\\s*)?(\\d{1,2})" + ORD + "(?!\\d)(?!:\\d)(?!\\s*(?:am|pm|a\\.m|p\\.m))" + YR + "?)?", "gi");
    while ((m = reA.exec(line))) {
      const mo = MIDX(m[1]), d = Number(m[2]);
      if (d < 1 || d > 31) continue;
      if (/^(may|mar)$/.test(m[1])) continue; // lowercase "may" and "mar" are ordinary words
      const y = y2(m[3], m[4]) || yearFor(mo);
      let isoEnd = "";
      if (m[6]) { const mo2 = m[5] ? MIDX(m[5]) : mo; const yy = y2(m[7], m[8]) || (mo2 < mo ? y + 1 : y); isoEnd = isoOf(yy, mo2, Number(m[6])); }
      if (push(m.index, m.index + m[0].length, isoOf(y, mo, d), isoEnd)) {
        // "Oct 5 & 7", "Oct 5 and 12", "Oct 5, 7"
        const rest = line.slice(m.index + m[0].length);
        const more = /^(\s*(?:&|and|,|\/)\s*(\d{1,2})(?:st|nd|rd|th)?)(?![\d:%]|\s*(?:am|pm|a\.m|p\.m|points?|pts|%))/i.exec(rest);
        if (more && Number(more[2]) >= 1 && Number(more[2]) <= 31) push(m.index + m[0].length, m.index + m[0].length + more[1].length, isoOf(y, mo, Number(more[2])));
      }
    }
    // Day first: 5 Oct, 5th October, 5th of October, 5-Oct, 5-Oct-26, 5/Oct/2026, 5-9 Oct, 5th-9th of October
    const reB = new RegExp("\\b(\\d{1,2})" + ORD + "(?:" + RANGE + "(\\d{1,2})" + ORD + ")?(?:\\s+of\\s+|\\s*[-/.]\\s*|\\s+)" + MONTH_RE + "(?:\\s*[-/]\\s*(\\d{2}|20\\d{2})(?![\\d:])|,?\\s+(20\\d{2})(?![\\d:]))?", "gi");
    while ((m = reB.exec(line))) {
      const mo = MIDX(m[3]), d = Number(m[1]);
      if (d < 1 || d > 31) continue;
      const y = yNum(m[4]) || yNum(m[5]) || yearFor(mo);
      push(m.index, m.index + m[0].length, isoOf(y, mo, d), m[2] ? isoOf(y, mo, Number(m[2])) : "");
    }
    // Numeric with a year, dashes or dots: 10-05-2026, 10.5.26, 25.10.2026
    const reN = /(^|[^\d.\-/])(\d{1,2})([-.])(\d{1,2})\3(20\d{2}|\d{2})(?![\d.\-/])/g;
    while ((m = reN.exec(line))) {
      const [mo, d] = md(m[2], m[4]);
      if (mo < 0 || mo > 11 || d < 1 || d > 31) continue;
      push(m.index + m[1].length, m.index + m[0].length, isoOf(yNum(m[5]), mo, d));
    }
    // Weekday then month-day with dash or dot: Tue 9-30, Thu 10.1 (needs the weekday so section numbers aren't mistaken for dates)
    const reG = new RegExp("\\b" + WDAY + ",?\\s*\\(?\\s*(\\d{1,2})[-.](\\d{1,2})\\)?(?![\\d.])", "gi");
    while ((m = reG.exec(line))) {
      const [mo, d] = md(m[1], m[2]);
      if (mo >= 0 && mo < 12) push(m.index, m.index + m[0].length, isoOf(yearFor(mo), mo, d));
    }
    // Slashes: 10/5, 10/05/26, 10/5/2026, 10/5-10/9, 10/5 - 9, 25/10 (day first)
    const reC = /(^|[^\d/.])(\d{1,2})\/(\d{1,2})(?:\/(\d{4}|\d{2}))?(?:\s*(?:-|–|—|to|through|thru)\s*(\d{1,2})(?:\/(\d{1,2}))?(?:\/(\d{4}|\d{2}))?(?![\d:])(?!\s*(?:am|pm|a\.m|p\.m)))?(?![\d/])(?!\s*(?:of\b|pts?\b|points?\b|%|marks?\b))/g;
    while ((m = reC.exec(line))) {
      const [mo, d] = md(m[2], m[3]);
      if (mo < 0 || mo > 11 || d < 1 || d > 31) continue;
      const y = yNum(m[4]) || yearFor(mo);
      let isoEnd = "";
      if (m[5]) {
        if (m[6]) { const [mo2, d2] = md(m[5], m[6]); isoEnd = isoOf(yNum(m[7]) || (mo2 < mo ? y + 1 : y), mo2, d2); }
        else if (Number(m[5]) > d && Number(m[5]) <= 31) isoEnd = isoOf(y, mo, Number(m[5]));
      }
      push(m.index + m[1].length, m.index + m[0].length, isoOf(y, mo, d), isoEnd);
    }
    return out.sort((a, b) => a.index - b.index);
  }

  // Due times: 11:59 pm, 11:59pm, 11:59 PM, 11:59p, 5pm, 5 p.m., 11.59pm, 23:59, noon, midnight, end of day, 8:30-10:20 am
  function findTime(s, preferStart){
    const AP = "(a\\.?m\\.?|p\\.?m\\.?|(?<=\\d)[ap](?![a-z]))";
    let r = s.match(new RegExp("\\b(\\d{1,2})(?:[:.](\\d{2}))?\\s*" + AP + "?\\s*(?:-|–|—|to)\\s*(\\d{1,2})(?:[:.](\\d{2}))?\\s*" + AP + "(?![a-z])", "i"));
    if (r) {
      const endPm = /p/i.test(r[6]);
      const eh = Number(r[4]) % 12 + (endPm ? 12 : 0);
      let sh = Number(r[1]) % 12;
      if (r[3]) sh += /p/i.test(r[3]) ? 12 : 0;
      else if (endPm && !(Number(r[1]) > Number(r[4]) && Number(r[4]) !== 12)) sh += 12;
      if (sh < 24 && eh < 24) return preferStart ? pad2(sh) + ":" + pad2(r[2] ? Number(r[2]) : 0) : pad2(eh) + ":" + pad2(r[5] ? Number(r[5]) : 0);
    }
    let m = s.match(new RegExp("\\b(\\d{1,2})(?:[:.](\\d{2}))?\\s*" + AP + "(?![a-z])", "i"));
    if (m) {
      let h = Number(m[1]) % 12; if (/p/i.test(m[3])) h += 12;
      const mm = m[2] ? Number(m[2]) : 0;
      if (Number(m[1]) <= 12 && mm < 60) return pad2(h) + ":" + pad2(mm);
    }
    if (/\bmidnight\b|\bend of (?:the )?day\b|\beod\b/i.test(s)) return "23:59";
    if (/\bnoon\b|\bmidday\b/i.test(s)) return "12:00";
    m = s.match(/\b([01]?\d|2[0-3])[:h]([0-5]\d)\b/);
    if (m && /\b(due|by|at|exam|quiz|test|final|before|starts?|begins?)\b|@/i.test(s)) return pad2(m[1]) + ":" + m[2];
    return "";
  }

  const SKIP_LINE = /\b(no class(?:es)?|holiday|spring break|fall break|winter break|thanksgiving|recess|last day to|withdraw|add\/drop|drop deadline|office hours?|classes (?:begin|start|end)|first day of class|last day of class|reading day|study day|grades? (?:are |will be )?(?:posted|due))\b/i;
  const POLICY = /(\d+\s*%|\bpercent\b|\bpoints?\b|\bworth\b|\bweight(?:ed)?\b|\bpolic(?:y|ies)\b|\blate (?:work|submissions?|penalt)|\bmake-?ups?\b|\bwill be\b|\bmust\b|\bshould\b|\beach\b|\bevery\b|\ball (?:homework|assignments|quizzes|exams)\b|\bdrop(?:ped)? the lowest\b|\bcount(?:s)? (?:for|toward)\b|\bgrad(?:e|ing)\b|\b(?:mon|tues|wednes|thurs|fri|satur|sun)days\b|\ball\s+\w+(?:\s+\w+)?\s+(?:are|will)\b)/i;
  const ASSIGNED = /\b(assigned|released|posted|handed out|available|out|begins?|starts?|opens?|kicks? off)\b/i;

  function classify(s){
    if (/\b(project|proposal|presentation|poster|milestone|capstone)\b/i.test(s)) return "Project";
    if (/\b(mid-?terms?|exams?|examination)\b/i.test(s) || /\btest\s*#?\s*\d/i.test(s)) return "Exam";
    if (/\bquiz(?:zes)?\b/i.test(s)) return "Quiz";
    if (/\blab(?:oratory)?\s*(?:#?\s*\d|reports?|write-?ups?|assignments?)\b/i.test(s) || /\bpre-?labs?\b/i.test(s)) return "Lab";
    if (/\b(homework|hw\s*#?\s*\d*|problem sets?|psets?|ps\s*#?\s*\d|assignments?|essays?|papers?|reports?|worksheets?|write-?ups?|reflections?|responses?|journals?|drafts?|deliverables?|case stud(?:y|ies))\b/i.test(s)) return "Assignment";
    if (/\b(read|reading|readings)\b/i.test(s)) return "Reading";
    if (/\bfinal\b/i.test(s)) return "Exam";
    if (/\bdue\b/i.test(s)) return "Assignment";
    return "";
  }

  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  function stripNoise(s){
    return s.replace(/\b(?:week|wk)\.?\s*#?\s*(?:\d{1,2}|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen)\b|^\s*W\d{1,2}\b|\b(?:class|lecture|lec|session|meeting)\s*#?\s*\d{1,2}\b/gi, " ")
      .replace(WEEKDAY_RE, " ")
      .replace(/\b\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?)(?![a-z])/gi, " ")
      .replace(/\b(?:midnight|noon)\b/gi, " ")
      .replace(/\b(?:is |are )?due\b|\bsubmit(?:ted)?\b|\bturn in\b|\bby\b(?=\s|$)|\bat\b(?=\s|$)|\bon\s+(?:canvas|blackboard|gradescope|moodle|d2l|brightspace)\b|\bvia\s+\w+\b|\bin class\b|\bbeginning of class\b|\bend of day\b|\beod\b|\(tentative\)/gi, " ")
      .replace(/\s*[|•·;]\s*/g, " ")
      .replace(/\(\s*\)/g, " ")
      .replace(/\s+/g, " ")
      .replace(/^[\s,:;.\-–—@#*]+|[\s,:;\-–—@#*]+$/g, "")
      .trim();
  }
  function canonicalTitle(seg, type, yearFor){
    const ds = findDates(seg, yearFor);
    for (let i = ds.length - 1; i >= 0; i--) seg = seg.slice(0, ds[i].index) + " " + seg.slice(ds[i].end);
    let m;
    const n = x => x ? " " + x : "";
    if ((m = seg.match(/\b(?:homework|hw)\s*#?\s*(\d+[a-z]?)\b/i))) return "Homework " + m[1];
    if ((m = seg.match(/\b(?:problem set|pset|ps)\s*#?\s*(\d+)\b/i))) return "Problem Set " + m[1];
    if (type === "Quiz" && (m = seg.match(/\bquiz\s*#?\s*(\d+)?/i))) return "Quiz" + n(m[1]);
    if (type === "Exam") {
      if ((m = seg.match(/\bmid-?term(?:\s*exam)?\s*#?\s*(\d+)?/i))) return "Midterm" + n(m[1]);
      if (/\bfinal\b/i.test(seg)) return "Final Exam";
      if ((m = seg.match(/\b(?:exam|examination|test)\s*#?\s*(\d+)/i))) return "Exam " + m[1];
    }
    if (type === "Lab" && (m = seg.match(/\b(pre-?)?lab(?:oratory)?\s*(reports?|write-?ups?)?\s*#?\s*(\d+)?\s*(reports?|write-?ups?)?/i))) return (m[1] ? "Prelab" : "Lab") + n(m[3]) + ((m[2] || m[4]) ? " report" : "");
    if (type === "Project" && (m = seg.match(/\bproject\s*#?\s*(\d+)?\s*[:\-–]?\s*(proposal|presentation|report|milestone\s*\d*|draft|final report|poster)?/i)) && (m[1] || m[2])) return "Project" + n(m[1]) + (m[2] ? " " + m[2].toLowerCase() : "");
    if ((m = seg.match(/\b(assignment|essay|paper|report|worksheet|reflection|journal)\s*#?\s*(\d+)\b/i))) {
      const sfx = seg.match(/\b(final draft|rough draft|draft|final|revision|outline|proposal)\b/i);
      return cap(m[1].toLowerCase()) + " " + m[2] + (sfx ? " " + sfx[1].toLowerCase() : "");
    }
    if (type === "Reading" && (m = seg.match(/\b(?:read(?:ing)?s?)\b\s*:?\s*(.*)$/i))) {
      const rest = stripNoise(m[1]).slice(0, 60);
      return rest ? "Read " + rest : "Reading";
    }
    let t = stripNoise(seg);
    if (t.length > 70) t = t.slice(0, 70).replace(/\s+\S*$/, "") + "…";
    return t ? cap(t) : type;
  }

  // Split a row into item segments on strong separators, then on keyword starts.
  const KW_START = /\b(?=(?:homework|hw\s*#?\s*\d|problem set|pset|quiz|mid-?term|exam|final exam|test\s*#?\s*\d|lab\s*(?:#?\s*\d|report)|pre-?lab|project|proposal|presentation|essay|paper|assignment|read(?:ing)?s?\b)(?![a-z]))/gi;
  function segments(line){
    const parts = line.split(/\t|\s[|•·]\s|;\s*/).map(s => s.trim()).filter(Boolean);
    const out = [];
    parts.forEach(p => {
      const idx = []; let m;
      KW_START.lastIndex = 0;
      while ((m = KW_START.exec(p))) { idx.push(m.index); KW_START.lastIndex = m.index + 1; }
      if (idx.length <= 1) { out.push(p); return; }
      const cuts = [0, ...idx.filter(i => i > 0 && /(?:[,&+\/]|\band|\bdue(?:\s+\S+)?|\d(?:am|pm)?|\))$/i.test(p.slice(0, i).trimEnd())), p.length];
      const uniq = [...new Set(cuts)].sort((a, b) => a - b);
      for (let i = 0; i < uniq.length - 1; i++) { const s = p.slice(uniq[i], uniq[i + 1]).replace(/^[\s,&+]+|[\s,&+]+$/g, "").replace(/\s+(?:and|&)$/i, ""); if (s) out.push(s); }
    });
    return out;
  }

  function courseInfo(lines, text){
    const top = lines.slice(0, 60);
    const info = {name:"", code:"", instructor:"", schedule:"", room:"", office:"", links:[]};
    // Course code: most frequent pattern like ME 201 / CHEM-101L
    const counts = {};
    const codeRe = /\b([A-Z]{2,5})\s?-?\s?(\d{3,4}[A-Z]?)\b/g;
    let m;
    lines.forEach((l, i) => { codeRe.lastIndex = 0; while ((m = codeRe.exec(l))) { if (/^(ROOM|RM|FALL|SPRING|SUMMER|WINTER|PAGE|WEEK|CH|HW|PS|LAB|UTC|PST|EST)$/.test(m[1])) continue; const k = m[1] + " " + m[2]; counts[k] = (counts[k] || 0) + (i < 15 ? 3 : 1); } });
    const best = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    if (best) info.code = best[0];
    const field = (re) => { for (const l of top) { const x = l.match(re); if (x && x[x.length - 1].trim()) return x[x.length - 1].trim(); } return ""; };
    const clean = s => s.replace(/\S+@\S+/g, "").replace(/\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}/g, "").replace(/\s{2,}/g, " ").replace(/^[\s,:;\-–]+|[\s,:;\-–|]+$/g, "").trim().slice(0, 120);
    info.instructor = clean(field(/^\s*(?:course\s+)?(?:instructors?|professors?|lecturers?|faculty|taught by|teacher)\s*(?:name)?\s*[:\-–]\s*(.+)/i)).split(/[;,]/)[0].trim();
    if (!info.instructor) {
      // A heading like "Instructors and Contact Information" followed by "Dr. Som B. Ale, email; …"
      const hi = top.findIndex(l => /^(?:course\s+)?(?:instructors?|professors?|teaching staff|faculty)\b/i.test(l) && l.length < 60);
      if (hi >= 0 && top[hi + 1]) { const nm = top[hi + 1].split(/[;,(]|\s[-–]\s|\S+@\S+/)[0].trim(); if (/^[A-Z][A-Za-z.'’\- ]{2,50}$/.test(nm) && nm.split(/\s+/).length <= 6) info.instructor = nm; }
    }
    if (!info.instructor) { for (const l of top) { const x = l.match(/\b((?:Dr|Prof|Professor)\.?\s+[A-Z][a-zA-Z'’\-]+(?:\s+[A-Z]\.)?(?:\s+[A-Z][a-zA-Z'’\-]+)?)/); if (x) { info.instructor = x[1]; break; } } }
    info.office = clean(field(/(?:^|[;,.]\s*)(?:instructor\s+|student\s+)?(?:office|drop-?in|student|help)\s+hours?\s*[:\-–]?\s*(.+)/i)).split(";")[0].trim();
    info.room = clean(field(/^\s*(?:class\s*room|room|location|lecture location|classroom|where|place)\s*[:\-–]\s*(.+)/i));
    let sched = field(/^\s*(?:class|lecture|meeting|course)?\s*(?:times?|schedule|meets|meeting times?|days?\s*(?:\/|and|&)?\s*times?|lectures?)\s*[:\-–]\s*(.+)/i);
    const dayTime = /\b((?:M|T|W|Th|R|F|Tu|MWF|MW|TTh|TR|TuTh|Mon|Tue|Tues|Wed|Thu|Thur|Thurs|Fri)(?:[\/,&\s-]+(?:M|T|W|Th|R|F|Tu|Mon|Tue|Tues|Wed|Thu|Thur|Thurs|Fri|and))*(?:days?)?)\s*,?\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm|a\.m\.|p\.m\.)?\s*(?:-|–|to)\s*\d{1,2}(?::\d{2})?\s*(?:am|pm|a\.m\.|p\.m\.)?)/i;
    const hasDays = x => /\b(mon|tue|wed|thu|fri|sat|sun)[a-z]*\b|\b(MWF|MW|TTh|TR|TuTh|WF|MTWRF)\b/i.test(x || "");
    if (!sched || !(dayTime.test(sched) || hasDays(sched))) { sched = ""; for (const l of top) { if (/office|drop-?in|help hours|student hours/i.test(l)) continue; const x = l.match(dayTime); if (x) { sched = x[0]; break; } } }
    info.schedule = clean(sched || "");
    if (!info.room) { const x = (info.schedule + " " + top.join(" ")).match(/\b(?:in|room|rm\.?)\s+([A-Z][A-Za-z]*\s*\d{1,4}[A-Z]?)\b/); if (x) info.room = x[1]; }
    // Name: text next to the code, or a title-like line near the top
    const skipName = /syllabus|course (outline|information|description)|^(fall|spring|summer|winter)|university|college|department|school of|instructor|professor|office|email|phone|room|location|page \d/i;
    if (info.code) {
      const [pre, num] = info.code.split(" ");
      for (const l of lines.slice(0, 30)) {
        const x = l.match(new RegExp(pre + "\\s?-?\\s?" + num + "\\s*[:\\-–—,.]?\\s*(.+)", "i"));
        if (x) { const nm = x[1].replace(/\b(course\s+)?syllabus\b/i, "").replace(/\b(fall|spring|summer|winter|autumn)\s*(?:semester|quarter|term)?\s*20\d{2}\b/i, "").replace(/\(.*?\)/g, "").replace(/[\s,:;\-–—|]+$/g, "").trim(); if (nm.length >= 3 && nm.length <= 80 && /[a-z]/i.test(nm) && !/^\d/.test(nm)) { info.name = nm; break; } }
      }
    }
    if (!info.name) {
      for (const l of lines.slice(0, 12)) {
        const t = l.replace(/\b(course\s+)?syllabus\b/i, "").trim();
        if (t.length >= 4 && t.length <= 70 && !skipName.test(t) && !/\d{2,}/.test(t) && /^[A-Z]/.test(t) && t.split(/\s+/).length <= 9) { info.name = t.replace(/[\s:,\-–]+$/, ""); break; }
      }
    }
    // Links
    const urlRe = /\b((?:https?:\/\/|www\.)[^\s<>()"']+[^\s<>()"'.,;:!?])/gi;
    const found = [];
    while ((m = urlRe.exec(text))) { let u = m[1]; if (!/^https?:/i.test(u)) u = "https://" + u; try { found.push({u, host: new URL(u).hostname.replace(/^www\./, "")}); } catch(e) {} }
    const hostCount = {}; found.forEach(f => { hostCount[f.host] = (hostCount[f.host] || 0) + 1; });
    const TOOLS = /canvas|instructure|blackboard|gradescope|piazza|edstem|zoom|moodle|brightspace|d2l|docs\.google|drive\.google|skyepack|pearson|mheducation|cengage|wileyplus|mastering|webassign|perusall|github|kaltura|panopto|youtube|teams\.microsoft|sharepoint|onedrive/i;
    const labelOf = h => /canvas|instructure/.test(h) ? "Canvas" : /blackboard/.test(h) ? "Blackboard" : /gradescope/.test(h) ? "Gradescope" : /piazza/.test(h) ? "Piazza" : /edstem/.test(h) ? "Ed Discussion" : /zoom/.test(h) ? "Zoom" : /moodle/.test(h) ? "Moodle" : /docs\.google|drive\.google/.test(h) ? "Google Drive" : (n => n.length <= 4 ? n.toUpperCase() : n.replace(/^./, c => c.toUpperCase()))(h.split(".").slice(-2, -1)[0] || h);
    const hosts = new Set();
    found.forEach(f => {
      if (hosts.has(f.host) || info.links.length >= 6) return;
      if (!TOOLS.test(f.host) && hostCount[f.host] < 2) return; // skip one-off policy and resource pages
      hosts.add(f.host);
      info.links.push({label: labelOf(f.host), url: /skyepack|canvas|instructure|blackboard|gradescope|piazza|edstem|moodle/.test(f.host) ? f.u.replace(/^(https?:\/\/[^/]+).*$/, "$1") : f.u});
    });
    return info;
  }

  const WEEK_WORDS = {one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10,eleven:11,twelve:12,thirteen:13,fourteen:14,fifteen:15,sixteen:16,seventeen:17,eighteen:18};
  function weekOf(line){
    let m = line.match(/\b(?:week|wk)\.?\s*#?\s*(\d{1,2})\b/i) || line.match(/^\s*W(\d{1,2})\b/);
    if (m) return {n: Number(m[1]), index: m.index, end: m.index + m[0].length};
    m = line.match(/\bweek\s+(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen)\b/i);
    if (m) return {n: WEEK_WORDS[m[1].toLowerCase()], index: m.index, end: m.index + m[0].length};
    return null;
  }
  // Which weekdays a class meets, from text like "MWF 10:30", "TTh", "TuTh", "Mon/Wed", "Tuesdays and Thursdays"
  function meetingDays(sched){
    let s = String(sched || "");
    const days = new Set(), NAMES = ["sun","mon","tue","wed","thu","fri","sat"];
    // A range of days ("Mon-Fri", "Monday through Thursday", "M-F") means every day in it
    const span = (a, b) => { if (a < 0 || b < 0 || a === b) return; for (let d = a; ; d = (d + 1) % 7) { days.add(d); if (d === b) break; } };
    s = s.replace(/\b(mon|tue|wed|thu|fri|sat|sun)[a-z]*\.?\s*(?:-|–|—|to|through|thru)\s*(mon|tue|wed|thu|fri|sat|sun)[a-z]*\.?/gi, (all, a, b) => { span(NAMES.indexOf(a.toLowerCase()), NAMES.indexOf(b.toLowerCase())); return " "; });
    s = s.replace(/\b(M|Tu|W|Th|F)\s*(?:-|–|—)\s*(Tu|W|Th|R|F)\b(?=\s*[\d(,]|\s*$)/g, (all, a, b) => { const C = {M: 1, Tu: 2, W: 3, Th: 4, R: 4, F: 5}; span(C[a], C[b]); return " "; });
    const words = s.match(/\b(mon|tue|wed|thu|fri|sat|sun)[a-z]*/gi);
    if (words) words.forEach(w => days.add(NAMES.indexOf(w.slice(0, 3).toLowerCase())));
    else if (!days.size) {
      s = s.replace(/\b(M|Tu|W|Th|R|F|Sa|Su)\s*[/,&]\s*(?=(?:M|Tu|W|Th|R|F|Sa|Su)\b)/g, "$1").replace(/\b(M|Tu|W|Th|R|F|Sa|Su)\s*[/,&]\s*(?=(?:M|Tu|W|Th|R|F|Sa|Su)\b)/g, "$1");   // "Tu/Th", "M, W, F"
      const code = (s.match(/\b([MTWRFSU]|Th|Tu|Sa|Su){2,5}\b/) || s.match(/\b(Th|Tu|Sa|Su|[MWRF])\b(?=\s*\d)/) || [""])[0];   // also one day on its own before a time ("Lab Th 2-4:50pm")
      code.replace(/Th|Tu|Sa|Su|[MTWRFSU]/g, t => { days.add({M:1, T:2, Tu:2, W:3, R:4, Th:4, F:5, S:6, Sa:6, Su:0, U:0}[t]); return t; });
    }
    days.delete(-1); days.delete(undefined);
    return [...days].sort();
  }

  function gradeWeights(lines){
    const out = {};
    let total = 0;
    for (const l of lines) { const m = l.match(/^(?:grand\s+)?total(?:\s+points)?\b[^\d%]*(\d{2,4})(?:\s*(?:pts|points))?\s*$/i); if (m) { total = Number(m[1]); break; } }
    const CATS = [[/^(?:the\s+)?final(?:\s+exam(?:ination)?)?\b/i, "Final"], [/^(?:mid-?terms?|exams?|examinations?|tests?)(?:\s+(?:exams?|tests?))?\b/i, "Exam"],
      [/^(?:pop\s+|in-class\s+|weekly\s+)?quiz(?:zes)?\b/i, "Quiz"], [/^(?:homework|hw|home\s*works?|assignments?|problem\s+sets?|psets?|written\s+assignments?)\b/i, "Assignment"],
      [/^(?:labs?|lab\s+reports?|laboratory(?:\s+work)?)\b/i, "Lab"], [/^(?:(?:term|group|final|class)\s+)?projects?\b/i, "Project"], [/^(?:readings?|reading\s+responses?)\b/i, "Reading"]];
    const WORDN = {one:1, two:2, three:3, four:4, five:5, six:6, seven:7, eight:8, nine:9, ten:10, twelve:12};
    lines.forEach(l => {
      const t = l.replace(/^[\s•\-*·]+/, "").trim();
      if (t.length > 110) return;
      const c = CATS.find(([re]) => re.test(t));
      if (!c) return;
      let type = c[1];
      if (type === "Final" && /project/i.test(t)) type = "Project";
      if (out[type]) return;
      const rest = t.replace(c[0], " ");
      const each = rest.match(/(\d{1,3}(?:\.\d+)?)\s*%\s*each/i);
      const pct = rest.match(/(\d{1,3}(?:\.\d+)?)\s*%/);
      const cnt = rest.match(/\((\d{1,2})\)|\b(\d{1,2})\s*[x×]\b|\b(one|two|three|four|five|six|seven|eight|nine|ten|twelve)\b/i);
      const count = cnt ? Number(cnt[1] || cnt[2]) || WORDN[(cnt[3] || "").toLowerCase()] : 0;
      if (each) { out[type] = {each: Number(each[1])}; return; }
      if (pct) { out[type] = {pct: Number(pct[1]), count}; return; }
      if (total) {
        const nums = (rest.match(/\b\d+(?:\.\d+)?\b/g) || []).map(Number);
        if (nums.length >= 3 && Math.abs(nums[0] * nums[1] - nums[2]) < 0.5) out[type] = {each: nums[1] / total * 100};
        else if (nums.length === 2 && nums[0] <= 20 && nums[1] > nums[0]) out[type] = {each: nums[1] / nums[0] / total * 100};
        else if (nums.length === 1 && nums[0] < total) out[type] = {pct: nums[0] / total * 100, count};
      }
    });
    return out;
  }

  // Main entry: text -> {course, items, term}
  function parse(text, today){
    text = String(text || "").replace(/\r/g, "").replace(/\u00a0/g, " ");
    let lines = text.split("\n").map(l => l.replace(/[ \u2002\u2003\u2009]+/g, " ").replace(/ *\t */g, "\t").trim()).filter(l => l.length);
    // Page headers and footers ("3 of 9", "Page 4", a title repeated on every page) sit between schedule rows, so remove them.
    const freq = {};
    lines.forEach(l => { freq[l] = (freq[l] || 0) + 1; });
    const firstIdx = {};
    lines = lines.filter((l, i) => {
      if (/^(?:page\s*)?\d{1,3}\s*(?:of|\/)\s*\d{1,3}$/i.test(l) || /^page\s+\d{1,3}$/i.test(l) || /^[-–]?\s*\d{1,3}\s*[-–]?$/.test(l)) return false;
      if (freq[l] >= 3 && l.length < 120) { if (firstIdx[l] === undefined) { firstIdx[l] = i; return true; } return false; }
      return true;
    });
    const term = termInfo(text);
    const yearFor = makeYearFor(term, today);
    // Decide whether numeric dates are day-first (25/10) for this syllabus.
    DAY_FIRST = false;
    { let df = 0, mf = 0, mm; const re = /(?:^|[^\d/.\-])(\d{1,2})[/.\-](\d{1,2})(?:[/.\-](?:20\d{2}|\d{2}))?(?![\d/.\-])/g;
      while ((mm = re.exec(text))) { const a = Number(mm[1]), b = Number(mm[2]); if (a > 12 && a <= 31 && b <= 12) df++; else if (b > 12 && b <= 31 && a <= 12) mf++; }
      DAY_FIRST = df > 0 && df > mf; }
    const course = courseInfo(lines, text);

    // Week number -> Monday, learned from lines that have both "Week N" and a date, or from a term start line.
    const weekMon = {};
    const monday = iso => { const d = new Date(iso + "T00:00:00"); const wd = (d.getDay() + 6) % 7; d.setDate(d.getDate() - wd); return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; };
    const addD = (iso, n) => { const d = new Date(iso + "T00:00:00"); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; };
    lines.forEach(l => {
      const w = weekOf(l);
      if (!w) return;
      const ds = findDates(l, yearFor);
      const after = w.end;
      if (ds.length && ds[0].index >= after && ds[0].index - after <= 16 && !classify(l.slice(after, ds[0].index))) weekMon[w.n] = monday(ds[0].iso);
      else if (ds.length && ds[0].end <= w.index && w.index - ds[0].end <= 6) weekMon[w.n] = monday(ds[0].iso);
    });
    let week1 = null;
    for (const l of lines) { if (/\b(classes|instruction|semester|quarter|term|class)\s+(begins?|starts?)|first day of (class|classes|instruction)/i.test(l)) { const ds = findDates(l, yearFor); if (ds.length) { week1 = monday(ds[0].iso); break; } } }
    const known = Object.keys(weekMon).map(Number).sort((a, b) => a - b);
    if (!week1 && known.length) week1 = addD(weekMon[known[0]], -7 * (known[0] - 1));
    const weekDue = n => weekMon[n] ? addD(weekMon[n], 4) : week1 ? addD(week1, 7 * (n - 1) + 4) : "";
    // "Class 12", "Lecture 12", "Session 12": count class meetings from the first week
    const mdays = meetingDays(course.schedule);
    const sessionDate = n => {
      if (!week1 || !mdays.length || n < 1 || n > 80) return "";
      let d = week1, count = 0;
      for (let i = 0; i < 200; i++) { const wd = new Date(d + "T00:00:00").getDay(); if (mdays.includes(wd)) { count++; if (count === n) return d; } d = addD(d, 1); }
      return "";
    };

    const items = [], assigned = {};
    let ctxMonth = -1, ctxMonthAge = 99;
    let ctxDate = null, ctxAge = 99, ctxWeek = null, ctxWeekAge = 99;
    const MONTH_ONLY = new RegExp("^\\s*" + MONTH_RE + "(?:\\s+20\\d{2})?\\s*[:\\-–—]?\\s*$", "i");
    const DAY_LEAD = new RegExp("^\\s*(?:" + WDAY + ",?\\s*)?(\\d{1,2})(?:st|nd|rd|th)?(?:\\s*\\(?" + WDAY + "\\)?)?(?=[\\s\\t:.)\\-–—]|$)(?!:\\d)(?!\\.\\d)(?![\\s\\t]*[\\/%])(?!\\s*(?:of|pts?|points?|am|pm|a\\.m|p\\.m|hours?|hrs?|min)\\b)", "i");
    lines.forEach(line => {
      const mh = line.match(MONTH_ONLY);
      if (mh) { ctxMonth = MIDX(mh[1]); ctxMonthAge = 0; return; }
      ctxMonthAge++;
      let dates = findDates(line, yearFor);
      if (!dates.length && ctxMonth >= 0 && ctxMonthAge <= 40) {
        const dl = line.match(DAY_LEAD);
        if (dl && Number(dl[1]) >= 1 && Number(dl[1]) <= 31) { const iso = isoOf(yearFor(ctxMonth), ctxMonth, Number(dl[1])); if (iso) dates = [{index: 0, end: dl[0].length, iso, isoEnd: ""}]; }
      }
      const wk = weekOf(line);
      if (!dates.length) {
        const sm = line.match(/\b(?:class|lecture|lec|session|meeting|day)\s*#?\s*(\d{1,2})\b/i);
        if (sm) { const iso = sessionDate(Number(sm[1])); if (iso) { dates = [{index: sm.index, end: sm.index + sm[0].length, iso, isoEnd: "", session: true}]; } }
      }
      if (dates.length && !SKIP_LINE.test(line)) { ctxDate = dates; ctxAge = 0; } else ctxAge++;
      if (wk) { ctxWeek = wk.n; ctxWeekAge = 0; } else ctxWeekAge++;
      if (SKIP_LINE.test(line) && !/\b(homework|hw\s*\d|quiz|exam|midterm|project|lab\s*\d|essay|paper)\b.*\bdue\b/i.test(line)) return;
      const segs = segments(line);
      segs.forEach(seg => {
        const type = classify(seg);
        if (!type) return;
        let ds = findDates(seg, yearFor);
        let source = "date";
        if (!ds.length && dates.length) { ds = dates.length === 1 ? dates : [dates[Math.min(dates.length - 1, segs.indexOf(seg))] || dates[0]]; if (ds[0].session) source = "session"; }
        const itemLine = line.length < 100 && /\b(due|begins?|starts?|assigned|released|opens?|posted|submit|turn in)\b/i.test(line);
        const bare = line.replace(/\b\d{1,2}(?:[:.]\d{2})?\s*(?:a\.?m\.?|p\.?m\.?)|\b\d{1,2}:\d{2}\b/gi, " ").replace(/\b(?:homework|hw|problem set|pset|ps|quiz|exam|midterm|test|lab|project|assignment|essay|paper|report|chapter|ch|module|unit|part)\s*#?\s*\d+[a-z]?\b/gi, " ").match(/\b\d+(?:\.\d+)?\b/g) || [];
        if (!ds.length && !wk && ctxDate && ctxAge >= 1 && ctxAge <= (itemLine ? 7 : 2) && line.length < 100 && !POLICY.test(seg) && bare.length === 0) { ds = [ctxDate[ctxDate.length - 1]]; source = "context"; }
        let due = "", start = "";
        if (ds.length) {
          const d = ds[ds.length - 1];
          if (ds.length >= 2 && /(assigned|out|released).*(due)/i.test(seg)) { start = ds[0].iso; due = ds[ds.length - 1].iso; }
          else if (d.isoEnd && (type === "Project" || /through|thru|window|open/i.test(seg))) { start = d.iso; due = d.isoEnd; }
          else due = d.isoEnd && /due/i.test(seg) ? d.isoEnd : d.iso;
        } else if (ctxWeek && ctxWeekAge <= 8) {
          due = weekDue(ctxWeek); source = due ? "week" : "none";
          const wd = seg.match(/\b(mon|tue|wed|thu|fri|sat|sun)[a-z]*\b/i);
          if (due && wd) due = addD(due, ["mon","tue","wed","thu","fri","sat","sun"].indexOf(wd[1].toLowerCase()) - 4);
        }
        else source = "none";
        if (POLICY.test(seg) && source !== "date") return;
        if (POLICY.test(line) && source === "date" && !findDates(seg, yearFor).length && !segs.some(x => x !== seg && findDates(x, yearFor).length) && /\b(all|each|every)\b/i.test(line)) return;
        if (POLICY.test(seg) && !/\bdue\b/i.test(seg) && seg.length > 60) return;
        if (source === "none") {
          if (!/\b(homework|hw\s*\d|quiz\s*\d|exam|midterm|final exam|project|lab\s*\d)\b/i.test(seg)) return;
          if (POLICY.test(line) || /\t/.test(line) || bare.length >= 1) return; // grading tables and policy text, not tasks
          if (!/\d/.test(canonicalTitle(seg, type, yearFor)) && !/\b(final|midterm)\b/i.test(seg)) return; // "Homework" with no number or date
          // Sentences from policy or description paragraphs aren't tasks.
          if (seg.length > 45 || /[.!?]\s+[A-Z]|\b(is|are|will|may|can|must|should|there|if|when|however|available|allowed|policy)\b/i.test(line)) return;
        }
        const title = canonicalTitle(seg, type, yearFor);
        if (!title || title.length < 2) return;
        if (ASSIGNED.test(seg) && !/\bdue\b/i.test(seg) && due && type !== "Exam" && type !== "Quiz") { assigned[title.toLowerCase()] = due; return; }
        const pS = type === "Exam" || type === "Quiz";
        const time = findTime(seg, pS) || (ds.length && dates.length === 1 && source !== "context" ? findTime(line, pS) : "");
        items.push({title, type, due, start, time, source, note: line.slice(0, 300), hasDue: /\bdue\b/i.test(seg)});
      });
    });

    // Merge duplicates: same title and date, or numbered titles repeated elsewhere (prefer the one marked "due").
    const out = [];
    const byKey = {};
    items.forEach(it => {
      const k = it.title.toLowerCase() + "|" + it.due;
      if (byKey[k]) { if (!byKey[k].time && it.time) byKey[k].time = it.time; return; }
      byKey[k] = it; out.push(it);
    });
    const numbered = {};
    out.forEach(it => { if (/\d/.test(it.title)) (numbered[it.title.toLowerCase()] = numbered[it.title.toLowerCase()] || []).push(it); });
    const drop = new Set();
    Object.values(numbered).forEach(g => {
      if (g.length < 2) return;
      const dated = g.filter(x => x.source === "date");
      const keep = (dated.filter(x => x.hasDue)[0]) || dated[0] || g[0];
      g.forEach(x => { if (x !== keep) drop.add(x); });
    });
    const final = out.filter(x => !drop.has(x)).map(x => {
      if (!x.start && assigned[x.title.toLowerCase()] && assigned[x.title.toLowerCase()] <= x.due) x.start = assigned[x.title.toLowerCase()];
      return x;
    });
    final.sort((a, b) => (a.due || "9999") < (b.due || "9999") ? -1 : (a.due || "9999") > (b.due || "9999") ? 1 : 0);
    // Grade weights from the grading breakdown ("Homework 20%", "Midterm exams 40% (20% each)", or a points table with a Total row)
    const weights = gradeWeights(lines);
    const countOf = type => final.filter(x => x.type === type && !(type === "Exam" && /final/i.test(x.title) && weights.Final)).length;
    final.forEach(x => {
      const key = x.type === "Exam" && /final/i.test(x.title) && weights.Final ? "Final" : x.type;
      const w = weights[key];
      if (!w) return;
      const v = w.each != null ? w.each : w.pct / Math.max(1, w.count || (key === "Final" ? 1 : countOf(x.type)));
      if (v > 0 && v <= 100) x.weight = Math.round(v * 10) / 10;
    });
    return {course, items: final, term, lineCount: lines.length, weightsFound: Object.keys(weights).length > 0};
  }
  return {parse, findDates, termInfo, findTime, meetingDays};
})();

/* ---------- Syllabus import (PDF or text, parsed on this device) ---------- */
const PDFJS_URL = "vendor/pdfjs/pdf.min.mjs";          // PDF.js 6.4.299 (legacy ES-module build), served from this site; prepare.js stages the same files in the desktop app
const PDFW_URL = "vendor/pdfjs/pdf.worker.min.mjs";
function loadScript(src, integrity){
  return new Promise((res, rej) => { const s = document.createElement("script"); s.src = src; if (integrity) { s.integrity = integrity; s.crossOrigin = "anonymous"; } s.onload = res; s.onerror = () => rej(new Error("Couldn't load " + src)); document.head.appendChild(s); });
}
// Same-origin vendored copy first, then the CDN; both must match the pinned hash. Fails with a clear message if neither does.
async function loadSupabaseLib(){
  const tried = [];
  for (const src of [SBJS_LOCAL, SBJS]) {
    try { await loadScript(src, SBJS_SRI); if (window.supabase) return; tried.push(src + " (loaded but no client)"); }
    catch(e) { tried.push(src); }
  }
  throw new Error("Couldn't load the sign-in library from any source (" + tried.join(", ") + "). Offline, blocked by a network filter, or the file failed its integrity check.");
}
// One set of options for every PDF opened: no eval'd font code (CVE-2024-4367), no XFA forms, no scripting, no wasm or remote font/cmap fetches.
const PDF_OPTS = {isEvalSupported: false, disableFontFace: true, enableXfa: false, useWasm: false, useSystemFonts: false, stopAtErrors: false, maxImageSize: 16777216, verbosity: 0};
let pdfReady = null;
function loadPdfJs(){
  if (!pdfReady) pdfReady = (async () => {
    const mod = await import(new URL(PDFJS_URL, document.baseURI).href);
    // If the worker can't start (some embedded browsers), pdf.js imports this same file and runs on the page itself.
    mod.GlobalWorkerOptions.workerSrc = new URL(PDFW_URL, document.baseURI).href;
    window.pdfjsLib = mod;
  })().catch(e => { pdfReady = null; throw e; });
  return pdfReady;
}
async function pdfText(buf, onPage){
  await loadPdfJs();
  const doc = await window.pdfjsLib.getDocument({data: buf, ...PDF_OPTS}).promise;
  const n = Math.min(doc.numPages, 40), out = [];
  try {
  for (let p = 1; p <= n; p++) {
    if (onPage) onPage(p, n);
    const page = await doc.getPage(p);
    const tc = await page.getTextContent();
    try { page.cleanup(); } catch(e) {}
    const items = tc.items.filter(i => typeof i.str === "string" && i.str.trim() !== "")
      .map(i => ({s: i.str, x: i.transform[4], y: i.transform[5], w: i.width, h: Math.abs(i.transform[3]) || i.height || 10}));
    items.sort((a, b) => b.y - a.y || a.x - b.x);
    const rows = [];
    for (const it of items) {
      const r = rows.find(r => Math.abs(r.y - it.y) <= Math.max(2, Math.min(r.h, it.h) * 0.45));
      if (r) r.items.push(it); else rows.push({y: it.y, h: it.h, items: [it]});
    }
    rows.sort((a, b) => b.y - a.y);
    for (const r of rows) {
      r.items.sort((a, b) => a.x - b.x);
      let line = "", end = null;
      for (const it of r.items) {
        if (end !== null) {
          const gap = it.x - end;
          if (gap > it.h * 1.2) line += "\t";
          else if (gap > it.h * 0.12 && !/\s$/.test(line) && !/^\s/.test(it.s)) line += " ";
        }
        line += it.s; end = it.x + it.w;
      }
      out.push(line);
    }
    out.push("");
  }
  return {text: out.join("\n"), pages: doc.numPages, read: n};
  } finally { try { doc.destroy(); } catch(e) {} }
}

function importSheet(courseId, file){
  openSheet(`<form class="sheet">${head("Import a Syllabus")}
    <div class="sheet-body" id="impBody">
      <div class="drop" id="impDrop">
        <p style="margin:0 0 10px"><strong>Choose your syllabus as a PDF.</strong><br><span class="mini">The course details and dated assignments, exams, quizzes, labs, projects and readings are pulled out for you to review.</span></p>
        <button type="button" class="btn primary" id="impPick">Choose a PDF</button>
        <input type="file" id="impFile" accept=".pdf,.txt,application/pdf,text/plain,image/*" class="sr" tabindex="-1">
      </div>
      ${aiReady() ? `<label class="mi-check ai-toggle"><input type="checkbox" id="impAI" checked> ${AI_ICON}<span><b>Read with AI</b><span class="mini" style="display:block">Smarter at dates, weights and class times, and reads scanned PDFs and photos. Uses ${esc(aiModelName(aiCfg().provider, aiCfg().model))}; turn off to read it only on this device.</span></span></label>` : inClaude() ? "" : `<p class="mini" style="margin:0">${AI_ICON} Want smarter reading that also handles scanned PDFs? <button type="button" class="link-btn" data-act="ai-setup">Turn on AI Features</button></p>`}
      <details id="impPaste"><summary>Or Paste the Text Instead</summary>
        <textarea id="impText" style="min-height:150px;margin-top:8px" placeholder="Paste the syllabus or just its schedule…" data-noenter></textarea>
        <button type="button" class="btn small" id="impRead" style="margin-top:8px">Read Pasted Text</button>
      </details>
      <p class="status-msg" id="impStatus" style="margin:0" aria-live="polite"></p>
      <div id="impResult"></div>
    </div>
    <div class="sheet-foot"><button type="button" class="btn" data-act="close">Cancel</button><span class="spacer"></span><button type="button" class="btn primary" id="impAdd" hidden>Add</button></div>
  </form>`);
  const status = $("#impStatus"), fileIn = $("#impFile");
  let result = null, srcFile = null;
  if (file) setTimeout(() => readFile(file), 0);   // a screenshot handed over from Quick Capture is read right away
  $("#impPick").addEventListener("click", () => fileIn.click());
  fileIn.addEventListener("change", () => { const f = fileIn.files && fileIn.files[0]; fileIn.value = ""; if (f) readFile(f); });
  const drop = $("#impDrop");
  ["dragover", "dragenter"].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add("over"); }));
  ["dragleave", "drop"].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove("over"); }));
  drop.addEventListener("drop", e => { const f = e.dataTransfer && e.dataTransfer.files[0]; if (f) readFile(f); });
  const useAI = () => { const b = $("#impAI"); return !!(b && b.checked && aiReady()); };
  $("#impRead").addEventListener("click", async () => {
    const t = $("#impText").value.trim();
    if (t.length < 20) { status.textContent = "Paste a bit more of the syllabus first."; return; }
    if (useAI()) { srcFile = null; await aiShow([{text: "Syllabus text:\n\n" + t}], t, "pasted text"); return; }
    show(t, "pasted text");
  });
  let aiBusy = false;
  async function aiShow(parts, text, from){
    if (aiBusy) return true;
    aiBusy = true; $("#impResult").innerHTML = ""; $("#impAdd").hidden = true;
    status.innerHTML = `<span class="ai-spin" aria-hidden="true"></span> ${esc(aiModelName(aiCfg().provider, aiCfg().model))} is reading ${esc(from)}. This usually takes 10 to 40 seconds…`;
    try { const r = await aiReadSyllabus(parts, m => { status.textContent = m; }); aiBusy = false; show(text, from, r); return true; }
    catch(e) {
      aiBusy = false; console.warn(e);
      const why = e.code ? e.message : "The AI couldn't read it.";
      if (text) { show(text, from, null, why + " Read on this device instead. "); return true; }
      status.textContent = why; return false;
    }
  }

  async function readFile(f){
    $("#impResult").innerHTML = ""; $("#impAdd").hidden = true;
    try {
      srcFile = null; let aiNote = "";
      if (f.size > 60 * 1024 * 1024) { status.textContent = "That file is too big to read here (over 60 MB)."; return; }
      if (/\.txt$/i.test(f.name) || f.type === "text/plain") { const t = (await f.text()).slice(0, 2e6); if (useAI()) { await aiShow([{text: "Syllabus text:\n\n" + t}], t, f.name); return; } show(t, f.name); return; }
      const isImg = /^image\//.test(f.type) || /\.(png|jpe?g|webp|heic|heif)$/i.test(f.name);
      if (isImg && useAI()) {
        if (f.size > AI_LIMIT_BYTES) { status.textContent = "That photo is too large. Try a smaller one."; return; }
        const src = await aiSourceFromFile(f); await aiShow([src.part], "", f.name); return;
      }
      if (!/\.pdf$/i.test(f.name) && f.type !== "application/pdf") { status.textContent = isImg ? "Photos of a syllabus can only be read with AI Features on. Choose a PDF, or paste the text instead." : "That file isn't a PDF. Choose a PDF, or paste the text instead."; return; }
      if (useAI() && f.size <= AI_LIMIT_BYTES) {
        srcFile = f;
        if (await aiShow([{inline_data: {mime_type: "application/pdf", data: bytesToB64(new Uint8Array(await f.arrayBuffer()))}}], "", f.name)) return;
        srcFile = null;
        aiNote = status.textContent + " Read on this device instead. ";
        status.textContent = aiNote; await sleep(600);
      }
      if (f.size > 25 * 1024 * 1024) { status.textContent = "That PDF is larger than 25 MB. Try exporting a smaller copy, or paste the text instead."; return; }
      status.textContent = "Opening the PDF…";
      const r = await pdfText(await f.arrayBuffer(), (p, n) => { status.textContent = `Reading page ${p} of ${n}…`; });
      if (r.text.replace(/\s/g, "").length < 150) {
        status.textContent = "This PDF has almost no selectable text, so it's probably a scanned image. Try a text-based copy of the syllabus, or paste the text instead.";
        $("#impPaste").open = true; return;
      }
      srcFile = f;
      show(r.text, f.name + (r.pages > r.read ? ` (first ${r.read} of ${r.pages} pages)` : ""), null, aiNote);
    } catch(e) {
      console.warn(e);
      status.textContent = /password/i.test(String(e && e.message)) ? "This PDF is password-protected. Remove the password or paste the text instead."
        : /load|import|fetch/i.test(String(e && e.message)) ? "Couldn't load the PDF reader. Reload the page and try again, or paste the text instead."
        : "Couldn't read that PDF. Try another copy, or paste the text instead.";
    }
  }

  function show(text, from, pre, lead){
    const r = pre || SY.parse(text, todayISO());
    result = r;
    const cs = coursesArr();
    const norm = s => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    const match = courseId ? courseOf(courseId) : cs.find(c => (r.course.code && norm(c.code) === norm(r.course.code)) || (r.course.name && norm(c.name) === norm(r.course.name)));
    const existingKeys = new Set(tasksArr().map(t => norm(t.title) + "|" + t.due + "|" + t.courseId));
    const dated = r.items.filter(i => i.due).length;
    status.textContent = (lead || "") + (r.ai ? "Read by AI. " : "") + (r.gateNote ? r.gateNote + " " : "") + (r.items.length ? `Found ${r.items.length} item${r.items.length === 1 ? "" : "s"} in ${from}${dated < r.items.length ? `, ${r.items.length - dated} without a date` : ""}.${r.weightsFound ? " Grade weights were taken from the grading breakdown." : ""} Check them over, then add.` : `No dated assignments or exams were found in ${from}. You can still create the course, then add tasks yourself.`);
    const c = r.course;
    const flag = i => i.source === "ai-low" ? (i.due ? "The AI worked out this date, so double-check it" : "No date found") : i.source === "week" ? "Date estimated from the week number" : i.source === "session" ? "Date estimated from the class number" : i.source === "context" ? "Date taken from the schedule entry above" : !i.due ? "No date found" : "";
    const typeSel = (i, n) => `<select data-f="type" data-n="${n}" aria-label="Type">${TYPES.map(x => `<option ${x === i.type ? "selected" : ""}>${x}</option>`).join("")}</select>`;
    const rowOf = (i, n) => {
      const dup = match && existingKeys.has(norm(i.title) + "|" + i.due + "|" + match.id);
      const checked = i.due && !dup;
      const f = dup ? "Already in your planner" : flag(i);
      return `<li class="imp-row ${checked ? "" : "off"}"><input type="checkbox" data-n="${n}" ${checked ? "checked" : ""} aria-label="Include ${esc(i.title)}">
        <div class="imp-fields"><input type="text" data-f="title" data-n="${n}" value="${esc(i.title)}" aria-label="Title">
          <div class="imp-sub">${typeSel(i, n)}<input type="date" data-f="due" data-n="${n}" value="${esc(i.due)}" aria-label="Due date"><input type="time" data-f="time" data-n="${n}" value="${esc(i.time)}" aria-label="Due time"><label class="imp-w"><input type="number" data-f="weight" data-n="${n}" min="0" max="100" step="0.5" value="${i.weight != null ? esc(i.weight) : ""}" placeholder="—" aria-label="Grade weight, percent"><span>% of grade</span></label></div>
          ${f ? `<span class="imp-flag ${dup ? "" : "warn"}">${esc(f)}</span>` : ""}
          ${window.SBBREAK && i.due && !dup && SBBREAK.big(i) ? `<label class="imp-bd"><input type="checkbox" data-bd="${n}" ${i.bd ? "checked" : ""}> Break down into milestones</label>` : ""}
          <span class="imp-src" title="${esc(i.note)}">${esc(i.note.replace(/\t/g, "  "))}</span></div></li>`;
    };
    const idx = r.items.map((it, n) => n);
    const rowsDated = idx.filter(n => r.items[n].due).map(n => rowOf(r.items[n], n)).join("");
    const undated = idx.filter(n => !r.items[n].due);
    const rows = `<ul class="imp-list">${rowsDated}</ul>` + (undated.length ? `<details class="imp-group"><summary>No Date Found (${undated.length})</summary><p class="mini" style="margin:0 0 8px">These were mentioned without a date. Check any you want and add the date yourself.</p><ul class="imp-list">${undated.map(n => rowOf(r.items[n], n)).join("")}</ul></details>` : "");
    $("#impDrop").hidden = true; $("#impPaste").hidden = true; $$(".ai-toggle", dlg).forEach(x => { x.hidden = true; });
    $("#impResult").innerHTML = `
      <p style="margin:0"><button type="button" class="link-btn" id="impAgain">Choose a Different File</button></p>
      <fieldset class="imp-course"><legend>Course</legend>
        <label class="f">Add To<select id="impTarget"><option value="new">A new course</option>${cs.map(x => `<option value="${esc(x.id)}" ${match && match.id === x.id ? "selected" : ""}>${esc(x.name)}</option>`).join("")}</select></label>
        <div id="impNew" class="imp-grid">
          <label class="f"><span class="lh">Course Name ${REQ}</span><input type="text" id="icName" value="${esc(c.name)}" placeholder="Course Name"></label>
          <label class="f">Code<input type="text" id="icCode" value="${esc(c.code)}"></label>
          <label class="f">Instructor<input type="text" id="icInstr" value="${esc(c.instructor)}"></label>
          <label class="f">Meets<input type="text" id="icSched" value="${esc(c.schedule)}"></label>
          <label class="f">Room<input type="text" id="icRoom" value="${esc(c.room)}"></label>
          <label class="f">Office Hours<input type="text" id="icOffice" value="${esc(c.office)}"></label>
          ${c.links.length ? `<p class="mini" style="grid-column:1/-1;margin:0">Links found: ${c.links.map(l => esc(l.label)).join(", ")}</p>` : ""}
        </div>
        <label class="mi-check" id="impFillWrap"><input type="checkbox" id="impFill" checked> Fill in missing course details from the syllabus</label>
        ${srcFile && caps.assets ? `<label class="mi-check"><input type="checkbox" id="impSave" checked> Save the PDF in the course's Syllabus folder</label>` : ""}
      </fieldset>
      ${r.items.length ? `<div class="imp-head"><strong>Tasks</strong><span class="spacer"></span><button type="button" class="link-btn" id="impAll">Select All</button><button type="button" class="link-btn" id="impNone">Select None</button></div><div id="impLists">${rows}</div>` : ""}`;
    $("#impAgain").addEventListener("click", () => { result = null; $("#impResult").innerHTML = ""; $("#impAdd").hidden = true; status.textContent = ""; $("#impDrop").hidden = false; $("#impPaste").hidden = false; $$(".ai-toggle", dlg).forEach(x => { x.hidden = false; }); });
    const target = $("#impTarget");
    const syncTarget = () => { const isNew = target.value === "new"; $("#impNew").hidden = !isNew; $("#impFillWrap").hidden = isNew; updateAdd(); };
    target.addEventListener("change", syncTarget);
    const list = $("#impLists");
    if (list) {
      list.addEventListener("change", e => {
        const n = e.target.dataset.n; if (n == null) return;
        const it = r.items[Number(n)];
        if (e.target.type === "checkbox") e.target.closest("li").classList.toggle("off", !e.target.checked);
        else if (e.target.dataset.f) it[e.target.dataset.f] = e.target.value;
        updateAdd();
      });
      list.addEventListener("input", e => { const n = e.target.dataset.n; if (n != null && e.target.dataset.f === "title") r.items[Number(n)].title = e.target.value; });
      list.addEventListener("change", e => { const n = e.target.dataset.bd; if (n != null) r.items[Number(n)].bd = e.target.checked; });
      $("#impAll").addEventListener("click", () => { $$("input[type=checkbox][data-n]", list).forEach(b => { b.checked = true; b.closest("li").classList.remove("off"); }); updateAdd(); });
      $("#impNone").addEventListener("click", () => { $$("input[type=checkbox][data-n]", list).forEach(b => { b.checked = false; b.closest("li").classList.add("off"); }); updateAdd(); });
    }
    syncTarget();
  }
  function aiMeetings(schedSame, officeSame, room){
    const ms = result && result.ai && result.course.meetings || [];
    if (!ms.length || !schedSame) return null;
    const out = ms.filter(m => officeSame || m.kind !== "Office Hours").map(m => Object.assign({}, m, {id: uid(), where: m.where || (m.kind !== "Office Hours" ? room || "" : "")}));
    return out.length ? out : null;
  }
  function picked(){ const list = $("#impLists"); return list ? $$("input[type=checkbox][data-n]:checked", list).map(b => result.items[Number(b.dataset.n)]) : []; }
  function updateAdd(){
    const btn = $("#impAdd"); if (!result) return;
    const n = picked().length, isNew = $("#impTarget").value === "new";
    btn.hidden = false;
    btn.textContent = isNew ? (n ? `Add Course and ${n} Task${n === 1 ? "" : "s"}` : "Add Course") : `Add ${n} Task${n === 1 ? "" : "s"}`;
    btn.disabled = !isNew && !n;
  }
  $("#impAdd").addEventListener("click", () => {
    if (!result) return;
    const changes = [];
    let cid = $("#impTarget").value;
    const val = id => $("#" + id).value.trim();
    if (cid === "new") {
      const name = val("icName") || val("icCode");
      if (!name) { toast("Give the course a name first"); $("#icName").focus(); return; }
      const used = coursesArr().map(x => x.color);
      const nc = {id: uid(), created: Date.now(), name, code: val("icCode"), instructor: val("icInstr"), schedule: val("icSched"), room: val("icRoom"), office: val("icOffice"), meetings: aiMeetings(val("icSched") === result.course.schedule, val("icOffice") === result.course.office, val("icRoom")) || parseMeetings(val("icSched"), "Lecture", val("icRoom")).concat(parseMeetings(val("icOffice"), "Office Hours")),
        color: COLORS.find(x => !used.includes(x)) || COLORS[used.length % COLORS.length], notes: "", links: result.course.links.slice(0, 8)};
      cid = nc.id;
      changes.push({kind:"course", id: nc.id, after: nc});
    } else if ($("#impFill").checked) {
      const ex = clone(state.courses[cid]), c = result.course;
      let changed = false;
      [["instructor","instructor"],["schedule","schedule"],["room","room"],["office","office"],["code","code"]].forEach(([k, s]) => { if (!ex[k] && c[s]) { ex[k] = c[s]; changed = true; } });
      if (!(ex.meetings || []).length) { const ms = aiMeetings(true, true, ex.room || c.room) || parseMeetings(c.schedule, "Lecture", ex.room || c.room).concat(parseMeetings(c.office, "Office Hours")); if (ms.length) { ex.meetings = ms; changed = true; } }
      const have = new Set((ex.links || []).map(l => l.url));
      const add = c.links.filter(l => !have.has(l.url));
      if (add.length) { ex.links = (ex.links || []).concat(add).slice(0, 12); changed = true; }
      if (changed) changes.push({kind:"course", id: cid, after: ex});
    }
    let order = nextOrder("todo");
    picked().forEach(i => {
      const title = String(i.title || "").trim(); if (!title) return;
      const due = isDate(i.due) ? i.due : "";
      let start = i.start && isDate(i.start) ? i.start : due ? addDays(due, -(SPAN[i.type] ?? 3)) : todayISO();
      if (due && start > due) start = due;
      let t = normTask({id: uid(), created: Date.now(), order, title, type: TYPES.includes(i.type) ? i.type : "Other", due, time: i.time || "", start, courseId: cid,
        status: "todo", priority: i.type === "Exam" ? "high" : "med", weight: isNum(i.weight) && Number(i.weight) > 0 ? Number(i.weight) : null, location: i.location || "", reading: i.reading || "", hours: !MILESTONE(i.type) && isNum(i.hours) && Number(i.hours) > 0 ? Number(i.hours) : null, notes: "From syllabus: " + String(i.note || "").replace(/\t+/g, " | ")});
      order += 10;
      let kids = [];
      if (i.bd && window.SBBREAK) { const x = SBBREAK.expandNew(t); if (x) { t = x.parent; kids = x.kids; } }   // ticked "Break down": template milestones, no AI, instant
      changes.push({kind:"task", id: t.id, after: t});
      kids.forEach(k => changes.push({kind:"task", id: k.id, after: k}));
    });
    const nTasks = changes.filter(c => c.kind === "task").length;
    const saveIt = srcFile && $("#impSave") && $("#impSave").checked;
    dlg.close();
    ui.tab = "courses"; ui.courseId = cid;
    applyChanges(changes, nTasks ? `Added ${nTasks} task${nTasks === 1 ? "" : "s"} from the syllabus` : "Course added");
    if (saveIt) { const f = srcFile; setTimeout(() => uploadFiles([f], {courseId: cid, folderId: "syllabus", quiet: true}), 1500); }
  });
}

