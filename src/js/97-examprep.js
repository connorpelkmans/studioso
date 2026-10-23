/* ===== module: 97-examprep.js ===== */
/* Exam Prep Planner */
(() => {
/*EXAMPREP-START*/
// The Exam Prep planner's engine
const EXAMPREP = (() => {
  const dn = s => { const [y, m, d] = String(s).split("-").map(Number); return Math.round(Date.UTC(y, m - 1, d) / 864e5); };
  const fromDn = n => new Date(n * 864e5).toISOString().slice(0, 10);
  const add = (s, n) => fromDn(dn(s) + n);
  const diff = (a, b) => dn(b) - dn(a);
  const dow = s => new Date(dn(s) * 864e5).getUTCDay();
  const isDate = s => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && fromDn(dn(s)) === s;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const r5 = v => Math.round(v / 5) * 5;
  const num = v => v !== null && v !== "" && v !== undefined && Number.isFinite(Number(v));
  const plural = (n, w) => n + " " + w + (n === 1 ? "" : "s");

  const SHAKY = {weak: 1, ok: 0.35, strong: 0};
  const REVIEWS = {weak: 3, ok: 2, strong: 1};
  const GAPS = [1, 3, 6];
  const TOPIC_CAP = {weak: 150, ok: 100, strong: 60};
  const INTENSITY = {light: 45, normal: 90, intense: 120};
  const HORIZON = 21, MAX_TOPICS = 3, MIN_SESSION = 10;
  const KIND_LABEL = {learn: "Learn", cards: "Flashcards", questions: "Practice questions", teach: "Teach-back", recall: "Recall", recap: "Final recap", past: "Timed practice", light: "Light review"};
  const KIND_RANK = {cards: 0, recap: 1, recall: 2, learn: 3, teach: 4, questions: 5, past: 6, light: 7};
  const STYLES = [["mc", "Multiple choice"], ["short", "Short answer"], ["calc", "Calculation"], ["essay", "Essay"], ["practical", "Practical"]];

  /* words: normalise, light stemming, aliases */
  const STOP = new Set("a an the of and or to in on for with from by at as is are be vs about this that my your our review study studying exam exams midterm midterms final finals quiz quizzes test tests notes note lecture lectures lec slides slide deck decks flashcards flashcard cards card pdf docx pptx txt copy draft part".split(" "));
  const ALIAS_GROUPS = [["cardiac", "cardio", "heart", "cardiovascular"], ["renal", "kidney", "nephron", "nephro"], ["respiratory", "lung", "pulmonary", "breathing", "resp"], ["nervous", "neuro", "neural", "brain"],
    ["digestive", "gastro", "gi", "gut", "gastrointestinal"], ["derivative", "differentiation", "differentiate"], ["integral", "integration", "integrate"], ["econ", "economic", "economics"], ["psych", "psychology", "psychological"],
    ["bio", "biology", "biological"], ["chem", "chemistry", "chemical"], ["stat", "statistic", "statistics", "stats"], ["chapter", "ch", "chap"], ["photosynthesis", "photosynthetic"], ["respiration", "cellular respiration"],
    ["pharm", "pharmacology", "pharmacologic"], ["anat", "anatomy", "anatomical"], ["physio", "physiology", "physiological"], ["calc", "calculus"], ["alg", "algebra"], ["geo", "geometry"]];
  const ALIAS = {};
  ALIAS_GROUPS.forEach(g => g.forEach(w => { ALIAS[w] = g[0]; }));
  function stem(w){
    if (w.length > 4 && /ies$/.test(w)) w = w.slice(0, -3) + "y";
    else if (w.length > 4 && /(sses|xes|ches|shes)$/.test(w)) w = w.slice(0, -2);
    else if (w.length > 3 && /s$/.test(w) && !/(ss|us|is)$/.test(w)) w = w.slice(0, -1);
    if (w.length > 6 && /ing$/.test(w)) w = w.slice(0, -3);
    else if (w.length > 5 && /ed$/.test(w)) w = w.slice(0, -2);
    else if (w.length > 6 && /ly$/.test(w)) w = w.slice(0, -2);
    return ALIAS[w] || w;
  }
  const strip = s => String(s == null ? "" : s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const TOK = new Map();
  function tokens(s, extra){
    const ck = extra ? null : String(s == null ? "" : s);
    if (ck !== null && TOK.has(ck)) return TOK.get(ck).slice();
    const out = [], seen = new Set();
    strip(s).replace(/[^a-z0-9]+/g, " ").split(" ").forEach(w => {
      if (!w || STOP.has(w) || (w.length < 2 && !/\d/.test(w))) return;
      let t = stem(w); if (extra && extra[t]) t = extra[t];
      if (!seen.has(t)) { seen.add(t); out.push(t); }
    });
    if (ck !== null) { if (TOK.size > 6000) TOK.clear(); TOK.set(ck, out.slice()); }
    return out;
  }
  const keyOf = s => tokens(s).sort().join(" ") || strip(s).replace(/\s+/g, " ").trim();

  /* topics: parse a pasted list, chapters named in notes */
  function parseTopics(text){
    const seen = new Set(), out = [];
    String(text == null ? "" : text).split(/\r?\n|;|•|·|,/).forEach(line => {
      let s = line.replace(/^\s*(?:[-*–—>]+|\d{1,2}[.)])\s*/, "").replace(/\s+/g, " ").trim();
      s = s.replace(/[<>]/g, "").slice(0, 80).trim();
      if (s.length < 2) return;
      const k = keyOf(s); if (seen.has(k)) return; seen.add(k); out.push(s);
    });
    return out.slice(0, 60);
  }
  function chaptersIn(text){
    const out = [], seen = new Set(), rx = /\b(chapters?|ch\.?|units?|modules?|weeks?|lectures?)\s*(\d{1,2})(?:\s*(?:-|–|—|to|through|&|and)\s*(\d{1,2}))?/gi;
    let m;
    while ((m = rx.exec(String(text || "")))) {
      const word = /^ch/i.test(m[1]) ? "Chapter" : m[1].charAt(0).toUpperCase() + m[1].slice(1).toLowerCase().replace(/s$/, "");
      const a = Number(m[2]), b = m[3] ? Number(m[3]) : a;
      if (b < a || b - a > 14) { const k = word + " " + a; if (!seen.has(k)) { seen.add(k); out.push(k); } continue; }
      for (let n = a; n <= b; n++) { const k = word + " " + n; if (!seen.has(k)) { seen.add(k); out.push(k); } }
    }
    return out.slice(0, 20);
  }
  const cleanName = s => String(s == null ? "" : s).replace(/\.(pdf|docx?|pptx?|txt|md|png|jpe?g|webp|key|pages)$/i, "").replace(/[_]+/g, " ").replace(/^\s*(week|wk|lecture|lec|l)\s*\d+\s*[-:.]*\s*/i, "").replace(/\s+/g, " ").trim().slice(0, 80);
  function headingsOf(text){
    const out = [];
    String(text || "").split(/\r?\n/).slice(0, 80).forEach((l, i) => {
      const s = l.trim(); if (!s) return;
      if (/^#{1,4}\s+\S/.test(s)) out.push(s.replace(/^#+\s*/, ""));
      else if (i === 0 && s.length <= 70) out.push(s);
      else if (s.length <= 60 && s.length > 3 && (/:$/.test(s) || (s === s.toUpperCase() && /[A-Z]{3}/.test(s)))) out.push(s.replace(/:$/, ""));
    });
    return out.slice(0, 12);
  }
  // Topic ideas from what the course already has (no AI)
  function suggestTopics(m){
    m = m || {}; const out = [], seen = new Set();
    const put = (name, src) => { name = cleanName(name); if (name.length < 3) return; const k = keyOf(name); if (!k || seen.has(k)) return; seen.add(k); out.push({name, src}); };
    (m.prior || []).forEach(n => put(n, "earlier plan"));
    (m.objectives || []).forEach(n => put(n, "learning objective"));
    (m.checklist || []).forEach(n => put(n, "exam checklist"));
    chaptersIn(m.examNotes).concat(chaptersIn(m.reading)).forEach(n => put(n, "exam notes"));
    String(m.examNotes || "").split(/\n|;|•/).map(s => s.replace(/^[\s\-*\d.)]+/, "").trim()).filter(s => s.length > 2 && s.length < 70 && !/^(chapters?|ch\.?)\s*\d/i.test(s)).forEach(n => put(n, "exam notes"));
    (m.decks || []).forEach(d => { put(String(d.name || "").replace(/\b(deck|flashcards?|cards)\b/gi, ""), "deck"); const tagc = {}; (d.tags || []).forEach(t => { tagc[t] = (tagc[t] || 0) + 1; }); (d.cards || []).forEach(c => (c.tags || []).forEach(t => { tagc[t] = (tagc[t] || 0) + 1; })); Object.keys(tagc).sort((a, b) => tagc[b] - tagc[a]).slice(0, 6).forEach(t => put(t, "deck tag")); });
    (m.notes || []).forEach(n => { const h = headingsOf(n.text); if (h[0]) put(h[0], "note"); });
    (m.files || []).forEach(f => put(f.name, "file"));
    return out.slice(0, 24);
  }

  /* matching material to a topic */
  function mkDoc(title, body, extra){ return {t: new Set(tokens(title + " " + (extra || ""), null)), b: new Set(tokens(body || "", null))}; }
  function scoreDoc(T, d){
    if (!T.length) return 0;
    let ti = 0, bi = 0; T.forEach(w => { if (d.t.has(w)) ti++; if (d.t.has(w) || d.b.has(w)) bi++; });
    const tS = ti / T.length, bS = bi / T.length;
    return tS + 0.5 * bS + (T.length >= 2 && bS === 1 ? 0.2 : 0);
  }
  const SCORE_OK = 0.6;
  // courseId scoping
  const scoped = (cid, courseId, score) => (cid || "") === (courseId || "") ? score >= SCORE_OK : !cid ? score >= 1.2 : false;
  function matchTopic(name, mat, courseId){
    const T = tokens(name), out = {decks: [], notes: [], quizzes: [], files: []};
    if (!T.length || !mat) return out;
    (mat.decks || []).forEach(d => {
      const cards = d.cards || [], nameDoc = mkDoc(d.name, "", (d.tags || []).join(" "));
      let s = scoreDoc(T, nameDoc), cardIds = null;
      const need = Math.max(1, Math.ceil(T.length / 2));
      const hit = cards.filter(c => { const cd = mkDoc((c.front || "") + " " + (c.tags || []).join(" "), c.back || ""); let n = 0; T.forEach(w => { if (cd.t.has(w) || cd.b.has(w)) n++; }); return n >= need && (T.length < 2 || n >= 2 || cd.t.size <= 2 || T.length === 2); });
      if (s < SCORE_OK && cards.length && (hit.length >= 3 || hit.length / cards.length >= 0.25)) { s = 0.7 + Math.min(0.3, hit.length / cards.length / 2); cardIds = hit.map(c => c.id).slice(0, 300); }
      if (scoped(d.courseId, courseId, s)) out.decks.push({k: "deck", id: d.id, title: d.name, total: cardIds ? cardIds.length : cards.length, cardIds, score: Math.round(s * 100) / 100});
      (d.quizzes || []).forEach(q => { const qs = scoreDoc(T, mkDoc(q.title || d.name, "", "")); const sc = Math.max(qs, s >= SCORE_OK && !cardIds ? s * 0.8 : 0); if (scoped(d.courseId, courseId, sc)) out.quizzes.push({k: "quiz", id: q.id, deckId: d.id, title: q.title || d.name, score: Math.round(sc * 100) / 100}); });
    });
    (mat.notes || []).forEach(n => {
      const hs = headingsOf(n.text), s = scoreDoc(T, mkDoc(hs.join(" "), String(n.text || "").slice(0, 3000), ""));
      if (scoped(n.courseId, courseId, s)) out.notes.push({k: "note", id: n.id, title: (hs[0] || String(n.text || "").split("\n")[0] || "Note").slice(0, 60), score: Math.round(s * 100) / 100});
    });
    (mat.files || []).forEach(f => {
      const s = scoreDoc(T, mkDoc(cleanName(f.name), "", ""));
      if (scoped(f.courseId, courseId, s)) out.files.push({k: "file", id: f.id, title: f.name, score: Math.round(s * 100) / 100});
    });
    const own = new Set([].concat((mat.decks || []), (mat.notes || []), (mat.files || [])).filter(x => (x.courseId || "") === (courseId || "")).map(x => x.id));
    ["decks", "notes", "quizzes", "files"].forEach(k => out[k].sort((a, b) => (b.score + (own.has(b.deckId || b.id) ? 0.1 : 0)) - (a.score + (own.has(a.deckId || a.id) ? 0.1 : 0)) || String(a.title).localeCompare(String(b.title))));
    out.decks = out.decks.slice(0, 2); out.notes = out.notes.slice(0, 3); out.quizzes = out.quizzes.slice(0, 2); out.files = out.files.slice(0, 2);
    return out;
  }
  const flatLinks = m => m.decks.concat(m.notes, m.quizzes, m.files);

  /* instruction lines */
  const has = (style, k) => (style || []).includes(k);
  function questionLine(t, style){
    if (has(style, "calc")) return `Work 6 practice problems on ${t} without notes, then check every step.`;
    if (has(style, "essay")) return `Plan two essay answers on ${t}: a thesis and three supporting points each, then check against your notes.`;
    if (has(style, "practical")) return `Talk through the practical steps for ${t} from memory, then check the details.`;
    if (has(style, "short")) return `Write short answers to 5 questions on ${t} from memory, then mark them against your notes.`;
    return `Do 15 multiple-choice questions on ${t} without notes, then review every miss.`;
  }
  const pick = (links, k) => (links || []).find(l => l.k === k);
  function textFor(kind, t, o){
    const name = t ? t.name : "", L = (t && t.links) || [], deck = pick(L, "deck"), note = pick(L, "note"), quiz = pick(L, "quiz"), file = pick(L, "file");
    switch (kind) {
      case "learn": return note ? `Read your note “${note.title}” on ${name}, then close it and write what you remember.` : file ? `Read ${file.title} for ${name}, then write the key points from memory.` : `Go through your notes and slides on ${name}, then write the key points from memory.`;
      case "cards": return deck ? `Review deck ${deck.title}: ${o.n ? (o.dueToday ? o.n + " card" + (o.n === 1 ? "" : "s") + " due" : "about " + plural(o.n, "card")) : "all the cards"}.` : `Quiz yourself on ${name} with flashcards.`;
      case "questions": return quiz ? `Take the quiz “${quiz.title}” on ${name}, then review every miss.` : questionLine(name, o.style);
      case "teach": return has(o.style, "essay") ? `Outline an essay answer on ${name} from memory, then fix the gaps.` : `Teach ${name} out loud, or fill a one-page summary sheet, as if explaining it to a friend.`;
      case "recall": return `Without notes, write everything you remember about ${name}, then check and fix the gaps.`;
      case "recap": return deck ? `Quick pass through deck ${deck.title} on ${name}, then say the key points aloud.` : `Skim your summary of ${name} and recite the key points from memory.`;
      case "past": return has(o.style, "calc") ? "Timed practice: work a full past paper or problem set in the exam time limit, then mark it." : has(o.style, "essay") ? "Timed practice: write one full essay answer in the exam time limit, then check it against your notes." : "Timed practice: do a past paper or mock test in the exam time limit, without notes, then mark it.";
      case "light": return `Light review only: skim your summary${o.names && o.names.length ? " of " + o.names.join(", ") : ""}, then stop early and get a good night’s sleep. No new material.`;
    }
    return "";
  }
  const matOf = (kind, t) => {
    const L = (t && t.links) || [], deck = pick(L, "deck"), note = pick(L, "note"), quiz = pick(L, "quiz"), file = pick(L, "file");
    if (kind === "cards") return deck || null;
    if (kind === "questions") return quiz || deck || null;
    if (kind === "learn") return note || file || deck || null;
    if (kind === "recap") return deck || note || null;
    if (kind === "teach" || kind === "recall") return note || deck || null;
    return null;
  };

  /* the plan */
  function simplePlace(windows, items){
    const slots = []; let wi = 0, cur = windows.length ? windows[0].s : 0;
    items.forEach(it => {
      while (wi < windows.length && windows[wi].e - Math.max(cur, windows[wi].s) < Math.min(15, it.min)) { wi++; cur = wi < windows.length ? windows[wi].s : 0; }
      if (wi >= windows.length) return;
      const s = Math.max(cur, windows[wi].s), e = Math.min(windows[wi].e, s + it.min);
      slots.push({id: it.id, s, e, min: e - s}); cur = e + 5;
    });
    return {slots};
  }
  function plan(inp){
    inp = inp || {};
    const today = inp.today, due = inp.due, warnings = [];
    const empty = (err, w) => ({sessions: [], dropped: [], warnings: w ? [w] : [], err, crash: false, offers: [], summary: {days: 0, minutes: 0, topics: 0}});
    if (!isDate(today) || !isDate(due)) return empty("date", "Pick the exam date first.");
    if (due <= today) return empty("past", due === today ? "The exam is today, so there's no day left to plan before it." : "That exam date has passed.");
    const intensity = clamp(Math.round(num(inp.intensity) ? Number(inp.intensity) : INTENSITY.normal), 15, 300), style = Array.isArray(inp.style) ? inp.style : [];
    const last = add(due, -1), horizon = inp.horizon || HORIZON;
    let start = inp.start && isDate(inp.start) && inp.start > today ? inp.start : today;
    if (!(inp.start && isDate(inp.start)) && diff(start, due) > horizon) start = add(due, -horizon);
    if (start > last) start = last;
    const stats = {blocked: 0, heavy: 0, pref: 0};
    const buildDays = usePref => {
      const out = [], pd = usePref && Array.isArray(inp.days) && inp.days.length && inp.days.length < 7 ? inp.days : null;
      stats.blocked = stats.heavy = stats.pref = 0;
      for (let d = start; d <= last; d = add(d, 1)) {
        const info = (inp.dayInfo && inp.dayInfo(d)) || {};
        if (pd && !pd.includes(dow(d))) { stats.pref++; continue; }
        let cap = info.cap == null ? intensity : Math.min(intensity, Math.floor(Number(info.cap)));
        if (info.blocked || !(cap >= 15)) { stats.blocked++; continue; }
        const heavy = !!info.crunch || (Number(info.load) || 0) >= 4;
        if (heavy) { cap = Math.max(20, Math.round(cap * 0.6)); stats.heavy++; }
        out.push({date: d, cap, heavy, windows: info.windows || null, used: 0, topics: [], items: []});
      }
      return out;
    };
    let days = buildDays(true);
    if (!days.length && Array.isArray(inp.days) && inp.days.length) { days = buildDays(false); if (days.length) warnings.push("None of your chosen study days is free before the exam, so other days are used."); }
    if (!days.length) return empty("nodays", "Every day before the exam is blocked or has less than 15 minutes free. Free up some time, or lower the intensity.");

    let lightDay = null, restDay = false;
    if (inp.rest && days.length >= 4 && days[days.length - 1].date === last) { days.pop(); restDay = true; }
    if (inp.light !== false && days.length >= 3) lightDay = days[days.length - 1];
    const reg = days.filter(d => d !== lightDay);
    const maxT = intensity <= 60 ? 2 : MAX_TOPICS;

    const doneL = Array.isArray(inp.done) ? inp.done : [];
    const T0 = (inp.topics || []).filter(t => t && String(t.name || "").trim()).map((t, i) => {
      const id = t.id || "t" + i, mine = doneL.filter(x => x.topicId === id);
      return {id, name: String(t.name).trim(), conf: SHAKY[t.conf] != null ? t.conf : "ok", w: num(t.weight) && Number(t.weight) > 0 ? Number(t.weight) : null, links: Array.isArray(t.links) ? t.links : [], i,
        learned: !!t.done || mine.some(x => x.kind === "learn"), doneMin: mine.reduce((s, x) => s + (Number(x.min) || 0), 0), lastDone: mine.map(x => x.date).sort().pop() || ""};
    });
    if (!T0.length) T0.push({id: "t0", name: inp.examTitle || "the exam", conf: "ok", w: null, links: [], i: 0, learned: false, doneMin: 0, lastDone: ""});
    const known = T0.filter(t => t.w); const meanW = known.length ? known.reduce((s, t) => s + t.w, 0) / known.length : 1;
    T0.forEach(t => {
      const w = t.w || meanW;
      t.score = w * (1 + SHAKY[t.conf]) * (t.learned ? 0.6 : 1) * Math.max(0.2, 1 - t.doneMin / 120);
      t.cap = TOPIC_CAP[t.conf] * clamp(w / meanW, 0.7, 1.6) * (t.learned ? 0.6 : 1);
      t.mv = t.learned ? 20 : 30;
    });

    let paper = null;
    if (reg.length >= 5 && T0.length >= 2 && inp.paper !== false) {
      const cand = reg.filter(d => diff(d.date, due) >= 3 && diff(d.date, due) <= 5).sort((a, b) => (a.heavy - b.heavy) || (b.cap - a.cap) || (a.date < b.date ? 1 : -1))[0];
      const min = cand ? Math.min(cand.cap, clamp(r5(0.75 * intensity), 45, 90)) : 0;
      if (cand && min >= 40) { paper = {day: cand, min}; cand.used += min; cand.items.push({kind: "past", min, topics: [], text: textFor("past", null, {style}), mat: null}); }
    }
    let lightMin = 0;
    if (lightDay) lightMin = Math.min(lightDay.cap, clamp(r5(0.4 * intensity), 15, 30));

    const B = reg.reduce((s, d) => s + d.cap, 0) - (paper ? paper.min : 0);
    const TB = Math.max(0, B * 0.92);
    let active = T0.slice(), dropped = [];
    while (active.length > 1 && active.reduce((s, t) => s + t.mv, 0) > TB) {
      const lo = active.slice().sort((a, b) => a.score - b.score || b.i - a.i)[0];
      active = active.filter(t => t !== lo); dropped.push({id: lo.id, name: lo.name, reason: "time"});
    }
    const sumScore = active.reduce((s, t) => s + t.score, 0) || 1;
    active.forEach(t => { t.min = clamp(r5(t.score / sumScore * TB), t.mv, Math.max(t.mv, r5(t.cap))); });
    const nDays = reg.length + (lightDay ? 1 : 0);
    const crash = nDays <= 3 || dropped.length > 0;

    active.forEach(t => {
      const deck = pick(t.links, "deck"), quiz = pick(t.links, "quiz");
      let learnMin = t.learned ? 0 : clamp(r5(t.min * 0.4), 20, 60), recapMin = clamp(r5(t.min * 0.12), 10, 20);
      if (t.min < learnMin + recapMin) { learnMin = t.learned ? 0 : Math.max(15, t.min - 10); recapMin = Math.max(10, Math.min(recapMin, t.min - learnMin)); }
      const restM = t.min - learnMin - recapMin;
      let nRev = REVIEWS[t.conf];
      while (nRev > 0 && (restM / nRev < 10 || nRev > Math.floor(restM / 10))) nRev--;
      const revMin = nRev ? clamp(r5(restM / nRev), 10, 40) : 0;
      const seq = t.conf === "strong" ? [quiz ? "questions" : deck ? "cards" : "recall"] : [deck ? "cards" : "recall", "questions", "teach"];
      t.touches = {learn: learnMin, recap: recapMin, reviews: seq.slice(0, nRev).map(k => ({kind: k, min: revMin}))};
    });

    const fit = (d, t, min, floor) => {
      if (d.topics.includes(t.id) || d.topics.length >= maxT) return 0;
      const room = d.cap - d.used; if (room < Math.max(MIN_SESSION, floor || MIN_SESSION)) return 0;
      return Math.min(min, Math.floor(room / 5) * 5 || room);
    };
    const putIn = (d, t, kind, min) => {
      const n = (kind === "cards" || kind === "recap") && pick(t.links, "deck") ? cardsFor(t, d.date) : null;
      const s = {kind, min, topics: [t.id], text: textFor(kind, t, {n: n && n.n, dueToday: n && n.dueToday, style}), mat: matOf(kind, t), n: n ? n.n : 0};
      if (kind === "cards" && n && n.n) { const want = clamp(r5(n.n * 0.5), 10, 40); s.min = Math.min(s.min, Math.max(10, want)); }
      d.used += s.min; d.topics.push(t.id); d.items.push(s); return s;
    };
    const cardsFor = (t, date) => {
      const deck = pick(t.links, "deck"); if (!deck) return null;
      const total = num(deck.total) ? Number(deck.total) : 0, due = num(deck.due) ? Number(deck.due) : 0;
      const dueToday = date === today && due > 0;
      return {n: dueToday ? due : Math.max(due, Math.min(60, Math.ceil(total * 0.4))), dueToday};
    };
    const byOrder = (arr, pred) => [arr.filter(d => !d.heavy && pred(d)), arr.filter(d => d.heavy && pred(d))];
    const firstFit = (cands, t, min, floor) => { for (const g of cands) for (const d of g) { const m = fit(d, t, min, floor); if (m) return {d, m}; } return null; };

    const order = active.slice().sort((a, b) => b.score - a.score || a.i - b.i);
    const learnDate = {}, lastTouch = {};
    const nL = Math.max(1, Math.ceil(reg.length * 0.55));
    const learnLimit = reg.filter(d => diff(d.date, due) >= 3);
    const learnPool = learnLimit.length ? learnLimit : reg;
    const noRoom = [];
    order.forEach((t, i) => {
      if (t.learned) { lastTouch[t.id] = t.lastDone && t.lastDone >= start ? t.lastDone : add(start, -1); return; }
      const target = Math.min(learnPool.length - 1, Math.floor(i * Math.min(nL, learnPool.length) / order.length));
      const idxs = learnPool.map((d, k) => k).sort((a, b) => (Math.abs(a - target) - Math.abs(b - target)) || a - b).sort((a, b) => (a < target) - (b < target));
      const ordered = idxs.map(k => learnPool[k]);
      const hit = firstFit([ordered.filter(d => !d.heavy), ordered.filter(d => d.heavy)], t, t.touches.learn, 15);
      if (!hit) { noRoom.push(t); return; }
      putIn(hit.d, t, "learn", hit.m); learnDate[t.id] = hit.d.date; lastTouch[t.id] = hit.d.date;
    });
    noRoom.forEach(t => { active = active.filter(x => x !== t); dropped.push({id: t.id, name: t.name, reason: "room"}); });
    order.filter(t => active.includes(t)).forEach(t => {
      let anchor = learnDate[t.id] || lastTouch[t.id];
      t.touches.reviews.forEach((rv, k) => {
        const target = add(anchor, GAPS[k]);
        const after = d => d.date > lastTouch[t.id];
        const fwd = reg.filter(d => d.date >= target && after(d)), back = reg.filter(d => d.date < target && after(d)).reverse();
        const near = fwd.filter(d => diff(target, d.date) <= 2);
        const hit = firstFit([near.filter(d => !d.heavy), fwd.filter(d => !d.heavy), near, fwd, back], t, rv.min, MIN_SESSION);
        if (!hit) return;
        putIn(hit.d, t, rv.kind, hit.m); lastTouch[t.id] = hit.d.date;
      });
    });
    const recapPool = reg.filter(d => diff(d.date, due) <= 3).length ? reg.filter(d => diff(d.date, due) <= 3) : reg.slice(-2);
    order.filter(t => active.includes(t)).forEach(t => {
      const after = d => d.date > (lastTouch[t.id] || "");
      const late = recapPool.filter(after).slice().reverse(), any = reg.filter(after).slice().reverse();
      const hit = firstFit([late.filter(d => !d.heavy), late, any], t, t.touches.recap, MIN_SESSION);
      if (hit) { putIn(hit.d, t, "recap", hit.m); lastTouch[t.id] = hit.d.date; }
    });
    if (lightDay && lightMin) {
      const top = active.slice().sort((a, b) => b.score - a.score).slice(0, 3).map(t => t.name);
      lightDay.items.push({kind: "light", names: top, min: lightMin, topics: active.slice().sort((a, b) => b.score - a.score).slice(0, 3).map(t => t.id), text: textFor("light", null, {names: top}), mat: null});
      lightDay.used += lightMin;
    }

    const sessions = [], tById = {}; T0.forEach(t => { tById[t.id] = t; });
    days.forEach(d => {
      d.items.sort((a, b) => (KIND_RANK[a.kind] - KIND_RANK[b.kind]) || (tById[(b.topics || [])[0]] ? tById[b.topics[0]].score : 0) - (tById[(a.topics || [])[0]] ? tById[a.topics[0]].score : 0));
      let slots = null;
      if (d.windows && d.windows.length) {
        const items = d.items.map((s, i) => ({id: i, min: s.min})), res = (inp.place || simplePlace)(d.windows, items);
        slots = {}; (res.slots || []).forEach(x => { const c = slots[x.id]; if (!c) slots[x.id] = {s: x.s, e: x.e}; else c.e = Math.max(c.e, x.e); });
      }
      d.items.forEach((s, i) => {
        const t = s.topics && s.topics[0] ? tById[s.topics[0]] : null;
        sessions.push({id: d.date + "|" + (s.topics || []).join("+") + "|" + s.kind, date: d.date, kind: s.kind, min: s.min, topicIds: s.topics || [], topic: s.kind === "light" ? (s.names || []).join(", ") : t ? t.name : "", text: s.text, mat: s.mat || null, n: s.n || 0,
          gen: s.kind === "questions" && !(s.mat && s.mat.k === "quiz"), slot: slots && slots[i] ? slots[i] : null});
      });
    });
    sessions.sort((a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : 0);
    const dropNames = dropped.map(x => x.name);
    if (dropped.length) warnings.unshift(`Not enough time to cover everything. Dropped: ${dropNames.join(", ")}.`);
    if (crash && diff(today, due) <= 3) warnings.push(`The exam is ${diff(today, due) === 1 ? "tomorrow" : "in " + diff(today, due) + " days"}, so this is a crash plan: shaky and high-weight topics first.`);
    if (stats.blocked) warnings.push(`${plural(stats.blocked, "day")} before the exam ${stats.blocked === 1 ? "is" : "are"} blocked or too full, so no sessions there.`);
    if (stats.heavy) warnings.push(`${plural(stats.heavy, "busy day")} got shorter sessions because of other deadlines.`);
    if (restDay) warnings.push("The day before the exam is kept free as a rest day.");
    const per = {}; sessions.forEach(s => s.topicIds.forEach(id => { const p = per[id] = per[id] || {min: 0, n: 0}; p.min += s.min; p.n++; }));
    const offers = active.filter(t => !t.links.length).map(t => ({topicId: t.id, name: t.name, text: `No material for ${t.name}: make flashcards from your notes`}));
    return {sessions, dropped, warnings, crash, offers, err: "", summary: {days: new Set(sessions.map(s => s.date)).size, minutes: sessions.reduce((s, x) => s + x.min, 0), topics: active.length, perTopic: per, restDay, light: !!lightDay, paper: paper ? paper.day.date : ""}};
  }

  /* progress: coverage and readiness */
  function readiness(o){
    o = o || {}; const topics = o.topics || [], sess = o.sessions || [], decks = o.decks || {}, quiz = o.quiz || {};
    const prior = {weak: 0.1, ok: 0.2, strong: 0.35};
    const doneS = sess.filter(s => s.done), ev = {sessions: doneS.length, cards: 0, quizzes: 0};
    const byTopic = {}; let wsum = 0, rsum = 0;
    topics.forEach(t => {
      const mine = sess.filter(s => (s.topicIds || []).includes(t.id)), planned = mine.reduce((a, s) => a + (s.min || 0), 0), got = mine.filter(s => s.done).reduce((a, s) => a + (s.min || 0), 0);
      const cov = t.done && !planned ? 1 : planned ? Math.min(1, got / planned) : 0;
      const links = t.links || [], ds = links.filter(l => l.k === "deck" && decks[l.id] && decks[l.id].mastery > 0), qs = links.filter(l => l.k === "quiz" && quiz[l.id] != null);
      const mastery = ds.length ? ds.reduce((a, l) => a + decks[l.id].mastery, 0) / ds.length : null, qz = qs.length ? qs.reduce((a, l) => a + quiz[l.id], 0) / qs.length / 100 : null;
      if (mastery != null) ev.cards++; if (qz != null) ev.quizzes++;
      let parts = [[cov, 0.5]]; if (mastery != null) parts.push([mastery, 0.3]); if (qz != null) parts.push([qz, 0.2]);
      const ws = parts.reduce((a, p) => a + p[1], 0), r0 = parts.reduce((a, p) => a + p[0] * p[1], 0) / ws;
      const base = t.done ? 0.6 : prior[t.conf] != null ? prior[t.conf] : 0.2;
      const r = clamp(base + (1 - base) * r0, 0, 1);
      byTopic[t.id] = {cov: Math.round(cov * 100), pct: Math.round(r * 100), mastery: mastery == null ? null : Math.round(mastery * 100), quiz: qz == null ? null : Math.round(qz * 100)};
      const w = num(t.weight) && Number(t.weight) > 0 ? Number(t.weight) : 1; wsum += w; rsum += w * r;
    });
    const gate = ev.sessions > 0 || ev.cards > 0 || ev.quizzes > 0 || topics.some(t => t.done);
    return {pct: gate && wsum ? Math.round(rsum / wsum * 100) : null, gate, evidence: ev, byTopic};
  }

  return {plan, readiness, matchTopic, flatLinks, suggestTopics, parseTopics, chaptersIn, tokens, keyOf, cleanName, headingsOf, textFor, KIND_LABEL, STYLES, INTENSITY, HORIZON, SHAKY, GAPS, add, diff, dow, isDate, simplePlace};
})();
/*EXAMPREP-END*/

// the app side
const PPK = "studyboard:prep";
const ppLoad = () => { try { const o = JSON.parse(localStorage.getItem(PPK) || "{}"); return o && typeof o === "object" ? o : {}; } catch (e) { return {}; } };
const ppSave = o => { try { localStorage.setItem(PPK, JSON.stringify(o)); } catch (e) {} };
const DAYN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const CONF3 = [["weak", "Shaky"], ["ok", "OK"], ["strong", "Strong"]];
const INT3 = [[45, "Light", "45 min"], [90, "Normal", "90 min"], [120, "Intense", "2 h"]];
const KLOW = {learn: "learn", cards: "flashcards", questions: "practice questions", teach: "teach-back", recall: "recall", recap: "final recap", past: "timed practice", light: "light review"};
const runAct = (act, data) => {
  const b = document.createElement("button"); b.type = "button"; b.hidden = true; b.dataset.act = act;
  Object.entries(data || {}).forEach(([k, v]) => { b.dataset[k] = v; });
  document.body.appendChild(b); b.click(); b.remove();
};
const intensityDefault = () => { const h = dailyHours(); return h <= 1.25 ? 45 : h <= 3.5 ? 90 : 120; };
const examName = ex => { const c = courseOf(ex.courseId), code = c ? courseLabel(c) : ""; return (code && !String(ex.title).toLowerCase().includes(code.toLowerCase()) ? code + " " : "") + ex.title; };
const minOf = t => Math.round((Number(t.hours) || 0) * 60);
const sessionsOf = id => allTasks().filter(t => t.prepFor === id && t.type === "Study").sort((a, b) => (a.due < b.due ? -1 : a.due > b.due ? 1 : 0) || String(a.slot || "").localeCompare(String(b.slot || "")) || (a.order || 0) - (b.order || 0));
const hasPlan = ex => !!ex && sessionsOf(ex.id).length > 0;
const upcoming = () => tasksArr().filter(t => MILESTONE(t.type) && t.status !== "done" && t.due && t.due >= todayISO()).sort(sortTasks);
const hmm = m => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;

/* material in the app */
function materialFor(){
  return {
    decks: decksArr().map(d => ({id: d.id, name: d.name, courseId: d.courseId || "", cards: d.cards.slice(0, 400).map(c => ({id: c.id, front: c.front, back: c.back})), quizzes: (d.aiQuizzes || []).map(q => ({id: q.id, title: q.title}))})),
    notes: notesArr().filter(n => !n.archived && String(n.text || "").trim()).map(n => ({id: n.id, courseId: n.courseId || "", text: n.text})),
    files: Object.values(state.files || {}).filter(f => f.kind === "file" || f.kind === "link" || f.kind === "cloud").map(f => ({id: f.id, name: f.name, courseId: f.courseId || ""}))
  };
}
function autoLinksFor(name, courseId, mat){ return EXAMPREP.flatLinks(EXAMPREP.matchTopic(name, mat || materialFor(), courseId)).map(l => ({k: l.k, id: l.id, title: l.title, deckId: l.deckId, cardIds: l.cardIds || null, total: l.total})); }
// What a link points at today (a deck can have lost cards, a note can be gone)
function liveLinks(links){
  const out = [];
  (links || []).forEach(l => {
    if (l.k === "deck") { const d = state.decks[l.id]; if (!d) return; const cs = l.cardIds && l.cardIds.length ? d.cards.filter(c => l.cardIds.includes(c.id)) : d.cards; out.push(Object.assign({}, l, {title: d.name, total: cs.length, due: cs.filter(cardDue).length})); }
    else if (l.k === "note") { const n = state.notes[l.id]; if (!n || n.archived) return; out.push(Object.assign({}, l, {title: EXAMPREP.headingsOf(n.text)[0] || l.title || "Note"})); }
    else if (l.k === "quiz") { const d = state.decks[l.deckId], q = d && (d.aiQuizzes || []).find(x => x.id === l.id); if (q) out.push(Object.assign({}, l, {title: q.title})); }
    else if (l.k === "file") { const f = state.files[l.id]; if (f) out.push(Object.assign({}, l, {title: f.name})); }
  });
  return out;
}
function suggestFor(ex, courseId){
  const mat = materialFor(), cid = courseId || "";
  const inC = x => (x.courseId || "") === cid;
  return EXAMPREP.suggestTopics({decks: mat.decks.filter(inC), notes: mat.notes.filter(inC), files: mat.files.filter(inC), examNotes: ex.notes, reading: ex.reading, checklist: (ex.checklist || []).map(i => i.text), prior: (ex.planTopics || []).map(t => t.name), objectives: window.SBOBJ ? SBOBJ.topicNames(cid) : []});
}

/* the plan saved on the exam */
function prepOf(ex){
  const p = ex.prep && typeof ex.prep === "object" ? ex.prep : {};
  const topics = (Array.isArray(p.topics) && p.topics.length ? p.topics : (ex.planTopics || []).map(t => ({name: t.name, conf: t.conf}))).map(t => ({id: t.id || uid(), name: t.name, conf: t.conf || "ok", weight: t.weight == null ? null : t.weight, done: !!t.done, links: t.links || [], edited: !!t.edited}));
  return {topics, intensity: p.intensity || intensityDefault(), style: p.style || [], styleText: p.styleText || "", days: p.days || null, rest: !!p.rest, light: p.light !== false, start: p.start || "", ai: p.ai !== false, examDue: p.examDue || "", createdAt: p.createdAt || 0};
}
function dayInfoFn(ex, from, to){
  const today = todayISO(), now = new Date(), nowMin = now.getHours() * 60 + now.getMinutes(), act = availActive();
  let ext = null; try { ext = act ? availExtMap(from, to) : null; } catch (e) {}
  let bd = {m: {}}; try { bd = busyDays(from, to); } catch (e) {}
  const per = workloadByDay(tasksArr().filter(t => t.status !== "done" && t.id !== ex.id && t.prepFor !== ex.id));
  let cr = null; try { cr = window.SBCRUNCH && SBCRUNCH.model(); } catch (e) {}
  const crunchDay = {}; if (cr && cr.days) cr.days.forEach(D => { if (D.levelIdx >= 4) crunchDay[D.date] = true; });
  const dh = dailyHours();
  return date => {
    const isToday = date === today, o = {load: per[date] || 0, crunch: !!crunchDay[date]};
    if (act) { const f = availFreeDay(date, isToday ? nowMin : null, ext); o.cap = Math.floor(f.total * 0.85); o.windows = f.windows.map(w => ({s: w.s, e: w.e})); if (f.none) o.blocked = true; }
    else { o.cap = Math.floor(dh * 60 * busyFactor((bd.m && bd.m[date]) || 0)); if (isToday) o.cap = Math.min(o.cap, Math.floor((1320 - nowMin) * 0.6)); }
    return o;
  };
}
function inputFor(ex, P, topics, due){
  const today = todayISO(), done = sessionsOf(ex.id).filter(t => t.status === "done").map(t => ({topicId: t.topicId, kind: t.kind, min: minOf(t), date: t.due}));
  return {today, due, topics: topics.map(t => ({id: t.id, name: t.name, conf: t.conf, weight: t.weight, done: t.done, links: liveLinks(t.links)})), intensity: P.intensity, style: P.style,
    days: P.days, rest: P.rest, light: P.light, start: P.start || "", done, examTitle: ex.title, dayInfo: dayInfoFn(ex, today, due),
    place: (w, items) => { try { return AVAIL.place(w, items, {cfg: availCfg()}); } catch (e) { return EXAMPREP.simplePlace(w, items); } }};
}
function readyFor(ex){
  const P = prepOf(ex), ss = sessionsOf(ex.id), decks = {}, quiz = {};
  P.topics.forEach(t => (t.links || []).forEach(l => {
    if (l.k === "deck" && state.decks[l.id] && !decks[l.id]) decks[l.id] = {mastery: deckStats(state.decks[l.id]).mastery};
    if (l.k === "quiz") { const d = state.decks[l.deckId], q = d && (d.aiQuizzes || []).find(x => x.id === l.id), r = q && (q.results || []).slice(-1)[0]; if (r && r.total) quiz[l.id] = Math.round(r.score / r.total * 100); }
  }));
  return EXAMPREP.readiness({topics: P.topics, sessions: ss.map(s => ({topicIds: s.topicId ? [s.topicId] : [], min: minOf(s), done: s.status === "done", kind: s.kind})), decks, quiz});
}
let PCACHE = {k: "", v: {}};
function readyMemo(ex){
  const k = (state.updated || 0) + "|" + todayISO(); if (PCACHE.k !== k) PCACHE = {k, v: {}};
  return PCACHE.v[ex.id] || (PCACHE.v[ex.id] = readyFor(ex));
}
// Used by the app's own progress bar
function pctOf(ex){ if (!ex || !ex.prep || !hasPlan(ex)) return null; try { return readyMemo(ex).pct; } catch (e) { return null; } }
function summaryOf(ex){
  const ss = sessionsOf(ex.id); if (!ss.length) return null;
  const done = ss.filter(s => s.status === "done").length, r = readyMemo(ex), today = todayISO();
  const missed = ss.filter(s => s.status !== "done" && s.due < today).length;
  return {total: ss.length, done, missed, pct: r.pct, gate: r.gate, line: `${done} of ${ss.length} sessions done${r.pct != null ? ` · readiness ${r.pct}%` : ""}`, moved: !!(ex.prep && ex.prep.examDue && ex.prep.examDue !== ex.due)};
}

/* opening material */
function openNoteById(id){
  const n = state.notes[id]; if (!n) { toast("That note is gone"); return; }
  if (dlg.open) dlg.close();
  ui.tab = "notes"; ui.courseId = null; render(); window.scrollTo(0, 0);
  const el = document.querySelector(`.note[data-note="${CSS.escape(id)}"]`), sc = $("#nbScroll");
  if (el && sc) { try { sc.scrollTo({left: Math.max(0, n.x * nbZ() - sc.clientWidth / 2 + el.offsetWidth * nbZ() / 2), top: Math.max(0, n.y * nbZ() - 50), behavior: "smooth"}); } catch (e) { sc.scrollLeft = n.x; sc.scrollTop = n.y; } el.classList.add("sx-flash"); setTimeout(() => el.classList.remove("sx-flash"), 2200); }
}
function openMaterial(t){
  if (!t) return;
  if (dlg.open) dlg.close();
  const k = t.matKind, id = t.matId;
  if (k === "deck" && state.decks[id]) {
    const d = state.decks[id], lk = ((state.tasks[t.prepFor] || {}).prep || {}).topics; const link = (lk || []).filter(x => x.id === t.topicId).flatMap(x => x.links || []).find(l => l.k === "deck" && l.id === id);
    const only = link && link.cardIds && link.cardIds.length ? link.cardIds.filter(c => d.cards.some(x => x.id === c)) : null;
    startStudy([id], only && only.length ? only : null); return;
  }
  if (k === "quiz" && state.decks[t.matDeck] && (state.decks[t.matDeck].aiQuizzes || []).some(q => q.id === id)) { startAiQuiz(t.matDeck, id); return; }
  if (k === "note" && state.notes[id]) { openNoteById(id); return; }
  if (k === "file" && state.files[id]) { runAct("f-open", {id}); return; }
  if (t.kind === "questions" || t.kind === "cards" || t.kind === "learn") { ui.tab = "flashcards"; ui.fc = null; ui.deckId = null; render(); runAct("fc-ai"); return; }
  toast("There's no linked material for this session. Open Prep Plan to link some.");
}
const matLabel = t => !t || !t.matKind ? "" : t.matKind === "deck" ? "Open Deck" : t.matKind === "quiz" ? "Open Quiz" : t.matKind === "note" ? "Open Note" : "Open File";
function matBtn(t){
  if (!t || !t.prepFor || t.status === "done" || !t.matKind) return "";
  const ok = t.matKind === "deck" ? state.decks[t.matId] : t.matKind === "quiz" ? state.decks[t.matDeck] : t.matKind === "note" ? state.notes[t.matId] : state.files[t.matId];
  return ok ? `<button type="button" class="btn small pp-open" data-act="prep-open-mat" data-id="${esc(t.id)}">${matLabel(t)}</button>` : "";
}

/* turn a plan into Study tasks (one undoable batch) */
function taskFields(ex, s, topic, all){
  const mat = s.mat || null, name = examName(ex), kl = KLOW[s.kind];
  const title = (s.kind === "past" ? `${name}: Timed practice` : s.kind === "light" ? `${name}: Light review + sleep` : `${name}: ${s.topic} (${kl})`).slice(0, 190);
  const f = {title, type: "Study", courseId: ex.courseId || "", start: s.date, due: s.date, hours: Math.round(s.min / 60 * 100) / 100, priority: s.kind === "past" || s.kind === "light" ? "high" : "med",
    prepFor: ex.id, kind: s.kind, topic: s.topic || "", topicId: s.kind === "past" || s.kind === "light" ? "" : s.topicIds && s.topicIds[0] || "", studyKind: s.kind === "past" ? "practice" : s.kind, notes: s.text, slot: s.slot ? hmm(s.slot.s) : "",
    matKind: mat ? mat.k : "", matId: mat ? mat.id : "", matDeck: mat && mat.k === "quiz" ? mat.deckId || "" : "", matTitle: mat ? mat.title : ""};
  const decks = [...new Set((topic ? liveLinks(topic.links) : s.kind === "past" ? (all || []).flatMap(t => liveLinks(t.links)) : []).filter(l => l.k === "deck").map(l => l.id))];
  f.studyDecks = s.kind === "cards" || s.kind === "questions" || s.kind === "recap" || s.kind === "past" ? decks : [];
  if (s.gen) f.gen = true;
  return f;
}
function applyPlan(ex0, P, topics, due, time, out, opts){
  opts = opts || {};
  const ex = opts.courseId != null ? Object.assign({}, ex0, {courseId: opts.courseId}) : ex0;
  const olds = sessionsOf(ex.id).filter(t => t.status !== "done"), used = new Set(), changes = [];
  let order = nextOrder("todo");
  const tById = {}; topics.forEach(t => { tById[t.id] = t; });
  out.sessions.forEach(s => {
    const f = taskFields(ex, s, tById[s.topicIds && s.topicIds[0]], topics);
    const old = olds.find(o => !used.has(o.id) && o.topicId === f.topicId && o.kind === f.kind);
    if (old) { used.add(old.id); const n = Object.assign(clone(old), f, {doneAt: null}); if (!f.slot) n.slot = ""; changes.push({kind: "task", id: old.id, after: normTask(n)}); }
    else { const t = newTask(Object.assign({}, f, {order, status: "todo"})); order += 10; changes.push({kind: "task", id: t.id, after: t}); }
  });
  olds.filter(o => !used.has(o.id)).forEach(o => changes.push({kind: "task", id: o.id, after: null}));
  const prep = {v: 1, topics: topics.map(t => ({id: t.id, name: t.name, conf: t.conf, weight: t.weight, done: !!t.done, links: (t.links || []).slice(0, 8).map(l => ({k: l.k, id: l.id, title: l.title, deckId: l.deckId || "", cardIds: l.cardIds || null, total: l.total || 0})), edited: !!t.edited})),
    intensity: P.intensity, style: P.style, styleText: P.styleText || "", days: P.days, rest: !!P.rest, light: P.light !== false, start: P.start || "", ai: !!P.ai, examDue: due, createdAt: (ex.prep && ex.prep.createdAt) || Date.now(), updatedAt: Date.now()};
  const ne = Object.assign(clone(state.tasks[ex.id]), {courseId: ex.courseId || "", prep, due, time: time == null ? ex.time : time, planTopics: topics.map(t => ({name: t.name, conf: t.conf})), planPerDay: P.intensity, planStyle: [P.style.map(k => (EXAMPREP.STYLES.find(x => x[0] === k) || [0, k])[1]).join(", "), P.styleText].filter(Boolean).join("; "), planAt: Date.now()});
  if (ne.start && ne.start > ne.due) ne.start = ne.due;
  changes.push({kind: "task", id: ex.id, after: normTask(ne)});
  const n = out.sessions.length;
  applyChanges(changes, opts.label || (opts.replan ? `Re-planned ${n} prep session${n === 1 ? "" : "s"} for ${ex.title}` : `Added ${n} prep session${n === 1 ? "" : "s"} for ${ex.title}`));
  return n;
}

/* AI wording (optional) */
const PREP_SCHEMA = {type: "OBJECT", properties: {sessions: {type: "ARRAY", items: {type: "OBJECT", properties: {id: {type: "STRING"}, text: {type: "STRING", description: "One concrete instruction for this study session, under 160 characters"}}, required: ["id", "text"]}}}, required: ["sessions"]};
async function aiWords(ex, out, P, status){
  if (!aiReady() || !out.sessions.length) return 0;
  const c = courseOf(ex.courseId), list = out.sessions.slice(0, 40);
  const r = await aiCall({task: "examplan", maxTokens: 6000, schema: PREP_SCHEMA, onStatus: m => { if (status) status(m); },
    parts: [{text: `Course: ${c ? c.name : "not given"}\nExam: ${ex.title}\nFormat: ${[P.style.join(", "), P.styleText].filter(Boolean).join("; ") || "not given"}\nWhat it covers (student's notes): ${ex.notes || "not given"}\nSessions (id | kind | topic | minutes | material):\n${list.map(s => `${s.id} | ${s.kind} | ${s.topic || "all topics"} | ${s.min}m | ${s.mat ? s.mat.title : "none"}`).join("\n")}`}],
    system: "You word one-line instructions for a student's exam study sessions. The app already chose every date, length and material; never change them. For each session id, write one concrete active-learning instruction (draw it from memory, work problems, teach it aloud, compare similar ideas; never just 'reread'), specific to the topic and the named material when there is one, under 160 characters, plain text. Use only the topics given. Return JSON only."});
  const ok = new Map(list.map(s => [s.id, s])); let n = 0;
  ((r.data || {}).sessions || []).forEach(x => { const s = ok.get(String(x.id)); if (!s) return; const t = AINS.clean(x.text, 170); if (t.length < 15 || AINS.generic(t) || /^(re-?read|review|study|go over|look over)\b[^,.;:]{0,30}$/i.test(t)) return; s.text = t; n++; });
  return n;
}

/* the planner sheet */
let S = null, SEQ = 0;
const topicOpt = (id, k) => (S.topics.find(t => t.id === id) || {})[k];
function stateFor(ex, P){
  const today = todayISO(), act = availActive();
  let days = P.days;
  if (!days) { days = [0, 1, 2, 3, 4, 5, 6]; if (act) { try { const ext = availExtMap(today, addDays(today, 13)), ok = new Set(); for (let i = 0; i < 14; i++) { const d = addDays(today, i); if (availFreeDay(d, null, ext).total >= 30) ok.add(parse(d).getDay()); } if (ok.size >= 3) days = [...ok].sort(); } catch (e) {} } }
  return {exId: ex.id, step: "plan", topics: P.topics, intensity: P.intensity, style: P.style.slice(), styleText: P.styleText, days, rest: P.rest, light: P.light, start: P.start, ai: P.ai && aiReady(), due: ex.due, time: ex.time || "", courseId: ex.courseId || "", msg: "", busy: false, out: null, open: {}, replan: false};
}
const exOf = () => S && state.tasks[S.exId];
function readForm(){
  if (!S || S.step !== "plan") return;
  const g = id => document.getElementById(id);
  const due = g("ppDue"); if (due && isDate(due.value)) S.due = due.value;
  const tm = g("ppTime"); if (tm) S.time = tm.value;
  const st = g("ppStart"); if (st) S.start = isDate(st.value) ? st.value : "";
  const ta = g("ppAdd"); if (ta) S.addText = ta.value;
  const sx = g("ppStyleText"); if (sx) S.styleText = sx.value.trim().slice(0, 200);
  const cs = g("ppCourse"); if (cs) S.courseId = cs.value;
  dlg.querySelectorAll("[data-pn]").forEach(i => { const t = S.topics.find(x => x.id === i.dataset.pn); if (!t) return; const v = i.value.trim().slice(0, 80); if (v && v !== t.name) { t.name = v; if (!t.edited) t.links = autoLinksFor(v, S.courseId); } });
  dlg.querySelectorAll("[data-pw]").forEach(i => { const t = S.topics.find(x => x.id === i.dataset.pw); if (t) t.weight = i.value === "" ? null : clamp(Number(i.value) || 0, 0, 100) || null; });
}
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
function curP(){ return {intensity: S.intensity, style: S.style, styleText: S.styleText, days: S.days.length === 7 ? null : S.days, rest: S.rest, light: S.light, start: S.start, ai: S.ai}; }
function compute(){
  const ex = exOf(); if (!ex) return null;
  const due = S.due; if (!isDate(due)) { S.out = null; return null; }
  const P = curP(); S.out = EXAMPREP.plan(inputFor(ex, P, S.topics, due)); return S.out;
}
function addTopics(names, src){
  const have = new Set(S.topics.map(t => EXAMPREP.keyOf(t.name))); let n = 0; const mat = materialFor();
  names.forEach(nm => { const name = String(nm).trim().slice(0, 80), k = EXAMPREP.keyOf(name); if (!name || have.has(k) || S.topics.length >= 40) return; have.add(k); n++; S.topics.push({id: uid(), name, conf: "ok", weight: null, done: false, links: autoLinksFor(name, S.courseId, mat), edited: false}); });
  return n;
}
function allMaterialOptions(t){
  const mat = materialFor(), cid = S.courseId || "", has = new Set((t.links || []).map(l => l.k + ":" + l.id)), out = [];
  mat.decks.filter(d => (d.courseId || "") === cid || !d.courseId).forEach(d => { if (!has.has("deck:" + d.id)) out.push(["deck:" + d.id, "Deck: " + d.name]); d.quizzes.forEach(q => { if (!has.has("quiz:" + q.id)) out.push(["quiz:" + d.id + ":" + q.id, "Quiz: " + q.title]); }); });
  mat.notes.filter(n => (n.courseId || "") === cid || !n.courseId).forEach(n => { if (!has.has("note:" + n.id)) out.push(["note:" + n.id, "Note: " + (EXAMPREP.headingsOf(n.text)[0] || "Note").slice(0, 50)]); });
  mat.files.filter(f => (f.courseId || "") === cid).forEach(f => { if (!has.has("file:" + f.id)) out.push(["file:" + f.id, "File: " + f.name]); });
  return out;
}
const linkIcon = k => ({deck: "Deck", note: "Note", quiz: "Quiz", file: "File"})[k] || "";
function topicLi(t){
  const links = liveLinks(t.links), open = !!S.open[t.id], opts = open ? allMaterialOptions(t) : [];
  const dead = (t.links || []).length - links.length;
  return `<li class="pp-topic" data-tid="${esc(t.id)}">
    <div class="ep-topic"><input type="text" data-pn="${esc(t.id)}" value="${esc(t.name)}" aria-label="Topic" maxlength="80">
      <div class="segb" role="group" aria-label="How well you know it">${CONF3.map(([k, l]) => `<button type="button" data-pp="conf" data-id="${esc(t.id)}" data-v="${k}" data-conf="${k}" aria-pressed="${t.conf === k}">${l}</button>`).join("")}</div>
      <input type="number" class="pp-w" data-pw="${esc(t.id)}" min="0" max="100" step="1" inputmode="numeric" value="${t.weight == null ? "" : esc(t.weight)}" placeholder="%" aria-label="Weight, percent of the exam (optional)" title="Weight: % of the exam (optional)">
      <label class="pp-done"><input type="checkbox" data-pp="done" data-id="${esc(t.id)}" ${t.done ? "checked" : ""}> Studied</label>
      <button type="button" class="x-btn" data-pp="rm" data-id="${esc(t.id)}" aria-label="Remove ${esc(t.name)}">${CLOSE}</button></div>
    <button type="button" class="link-btn pp-mat-t" data-pp="mat" data-id="${esc(t.id)}" aria-expanded="${open}">${links.length ? `Linked material (${links.length})` : "No linked material"}</button>
    ${links.length && !open ? `<span class="mini pp-mat-s">${esc(links.slice(0, 3).map(l => linkIcon(l.k) + ": " + l.title).join(" · "))}</span>` : ""}
    ${open ? `<div class="pp-mat">${links.length ? `<ul>${links.map((l, i) => `<li><span class="pp-lk">${linkIcon(l.k)}</span> ${esc(l.title)}${l.k === "deck" ? ` <span class="mini">${l.cardIds ? l.total + " matching cards" : l.total + " cards"}${l.due ? `, ${l.due} due` : ""}</span>` : ""}<button type="button" class="x-btn" data-pp="unlink" data-id="${esc(t.id)}" data-i="${i}" aria-label="Remove link to ${esc(l.title)}">${CLOSE}</button></li>`).join("")}</ul>` : `<p class="mini" style="margin:0">Nothing matched this topic in this course.</p>`}
      <div class="cl-new"><select data-pp-add="${esc(t.id)}" aria-label="Link a deck, note, quiz or file"><option value="">Link something…</option>${opts.map(([v, l]) => `<option value="${esc(v)}">${esc(l)}</option>`).join("")}</select><button type="button" class="btn small" data-pp="rematch" data-id="${esc(t.id)}">Re-match</button></div>
      ${!links.length ? `<p class="mini pp-gen">No material for ${esc(t.name)}: <button type="button" class="link-btn" data-pp="gen">Make Flashcards from Your Notes</button></p>` : ""}</div>` : ""}
    ${dead ? `<span class="mini">${dead} linked item${dead === 1 ? " is" : "s are"} gone and will be skipped.</span>` : ""}
  </li>`;
}
function drawPlan(){
  const ex = exOf(); if (!ex) { dlg.close(); return; }
  const body = $("#ppBody"), foot = $("#ppFoot"); if (!body) return;
  const out = compute(), today = todayISO();
  const days = isDate(S.due) ? dayDiff(today, S.due) : 0, exams = upcoming(), have = sessionsOf(ex.id), done = have.filter(t => t.status === "done").length;
  const bits = [];
  if (out && !out.err) {
    const s = out.summary;
    bits.push(`<p class="pp-sum"><b>${out.sessions.length}</b> session${out.sessions.length === 1 ? "" : "s"} over <b>${s.days}</b> day${s.days === 1 ? "" : "s"}, <b>${fmtHM(s.minutes / 60)}</b> in all, across <b>${s.topics}</b> topic${s.topics === 1 ? "" : "s"}${out.crash ? ". <b>Crash plan</b>" : ""}.${have.length ? ` Your ${done} finished session${done === 1 ? "" : "s"} stay${done === 1 ? "s" : ""}; the rest are re-spread.` : ""}</p>`);
    if (out.warnings.length) bits.push(`<ul class="ep-warn">${out.warnings.map(w => `<li>${esc(w)}</li>`).join("")}</ul>`);
    if (out.offers.length) bits.push(`<p class="mini pp-offer">${out.offers.slice(0, 3).map(o => esc(o.text)).join(". ")}. <button type="button" class="link-btn" data-pp="gen">Open the Card Maker</button></p>`);
    const byDate = {}; out.sessions.forEach(x => { (byDate[x.date] = byDate[x.date] || []).push(x); });
    bits.push(`<details class="pp-prev" ${S.open.prev ? "open" : ""}><summary>Preview the Days</summary><ol class="ep-days-list">${Object.keys(byDate).sort().map(d => `<li class="ep-day"><div class="ep-day-head"><b>${esc(fmtDate(d))}</b><span class="mini">${fmtHM(byDate[d].reduce((a, x) => a + x.min, 0) / 60)}</span></div><ul>${byDate[d].map(x => `<li class="ep-b k-${x.kind === "cards" ? "cards" : x.kind === "past" ? "practice" : x.kind === "light" ? "final" : x.kind === "recap" ? "final" : x.kind === "questions" ? "mistakes" : x.kind === "learn" ? "learn" : "recall"}"><span class="ep-k">${esc(x.kind === "past" || x.kind === "light" ? EXAMPREP.KIND_LABEL[x.kind] : x.topic + ": " + KLOW[x.kind])}</span><span class="mini">${x.min}m${x.slot ? " · " + esc(fmtTime(hmm(x.slot.s))) : ""}</span><span class="ep-t">${esc(x.text)}</span></li>`).join("")}</ul></li>`).join("")}</ol></details>`);
  } else bits.push(`<p class="ep-warn pp-err" role="status" style="margin:0;padding:8px 12px">${esc((out && out.warnings[0]) || "Pick the exam date to see the plan.")}</p>`);
  body.innerHTML = `
    ${exams.length > 1 || !exams.some(e => e.id === ex.id) ? `<label class="f"><span class="lh">Exam</span><select id="ppExam">${exams.concat(exams.some(e => e.id === ex.id) ? [] : [ex]).map(e => `<option value="${esc(e.id)}" ${e.id === ex.id ? "selected" : ""}>${esc(e.title)}${courseOf(e.courseId) ? " · " + esc(courseLabel(courseOf(e.courseId))) : ""} · ${esc(fmtDate(e.due))}</option>`).join("")}</select></label>` : `<p class="pp-exam"><b>${esc(examName(ex))}</b></p>`}
    <div class="two"><label class="f">Exam Date<input type="date" id="ppDue" value="${esc(S.due)}" min="${esc(addDays(today, 1))}"></label>
      <label class="f"><span class="lh">Time <span class="hint">optional</span></span><input type="time" id="ppTime" value="${esc(S.time)}"></label></div>
    <p class="mini" style="margin:0">${isDate(S.due) ? `${days} day${days === 1 ? "" : "s"} to go.` : ""}${have.length ? ` This exam already has a plan: ${done} of ${have.length} sessions done.` : ""}</p>
    <label class="f"><span class="lh">Course <span class="hint">material is matched within it</span></span><select id="ppCourse"><option value="">No course</option>${coursesArr().map(c => `<option value="${esc(c.id)}" ${c.id === S.courseId ? "selected" : ""}>${esc(c.name)}</option>`).join("")}</select></label>
    <fieldset><legend>What It Covers</legend>
      ${window.SBLC ? SBLC.prepHtml(ex) : ""}<ul class="ep-topics pp-topics">${S.topics.map(topicLi).join("")}</ul>
      <textarea id="ppAdd" rows="2" placeholder="Type or paste topics: one per line, or separated by commas" aria-label="Add topics" maxlength="3000">${esc(S.addText || "")}</textarea>
      <div class="ep-find"><button type="button" class="btn small" data-pp="add">Add Topics</button><button type="button" class="btn small" data-pp="suggest">Suggest Topics</button>${aiReady() ? `<button type="button" class="btn small ai-btn" data-pp="aifind">${AI_ICON} Find in My Files</button>` : ""}<span class="mini" id="ppFindMsg" aria-live="polite">${esc(S.msg)}</span></div>
      <p class="mini" style="margin:6px 0 0">Mark how well you know each one. Shaky topics get more time and come back more often.</p>
    </fieldset>
    <fieldset><legend>Exam Format <span class="hint">optional</span></legend>
      <div class="ep-days" role="group" aria-label="Exam format">${EXAMPREP.STYLES.map(([k, l]) => `<button type="button" data-pp="style" data-v="${k}" aria-pressed="${S.style.includes(k)}">${l}</button>`).join("")}</div>
      <input type="text" id="ppStyleText" value="${esc(S.styleText)}" maxlength="200" placeholder="e.g. 60 questions, 2 hours" aria-label="Format details" style="margin-top:8px"></fieldset>
    <fieldset><legend>Your Time</legend>
      <div class="segb" role="group" aria-label="Study intensity">${INT3.map(([m, l, d]) => `<button type="button" data-pp="int" data-v="${m}" aria-pressed="${S.intensity === m}">${l} <span class="mini">${d}</span></button>`).join("")}</div>
      <p class="mini" style="margin:6px 0 0">Study time a day. ${availActive() ? "Sessions go in your free time, skipping classes, work and shifts." : `Based on your ${fmtHM(dailyHours())} a day.`}</p>
      <div class="ep-days" role="group" aria-label="Study days">${DAYN.map((l, k) => `<button type="button" data-pp="day" data-v="${k}" aria-pressed="${S.days.includes(k)}">${l}</button>`).join("")}</div>
      <label class="f" style="margin-top:8px"><span class="lh">Start <span class="hint">optional; defaults to today, or 3 weeks before a far-off exam</span></span><input type="date" id="ppStart" value="${esc(S.start)}" min="${esc(today)}"></label>
      <label class="mi-check"><input type="checkbox" data-pp="light" ${S.light ? "checked" : ""}> Light review the day before (no new material)</label>
      <label class="mi-check"><input type="checkbox" data-pp="rest" ${S.rest ? "checked" : ""}> Keep the day before the exam free as a rest day</label>
      ${aiReady() ? `<label class="mi-check"><input type="checkbox" data-pp="ai" ${S.ai ? "checked" : ""}> ${AI_ICON} Word each session’s instruction with AI <span class="mini">(dates and minutes stay exact)</span></label>${aiModelBar()}` : ""}
    </fieldset>
    ${bits.join("")}
    <p class="status-msg" id="ppStatus" style="margin:0" aria-live="polite"></p>`;
  const n = out && !out.err ? out.sessions.length : 0;
  foot.innerHTML = `<button type="button" class="btn" data-act="close">Cancel</button><span class="spacer"></span>${have.length && !S.replan ? `<button type="button" class="btn" data-pp="view">Back to Plan</button>` : ""}<button type="button" class="btn primary" id="ppCreate" data-pp="create" ${n ? "" : "disabled"}>${have.length ? `Re-plan ${n} Session${n === 1 ? "" : "s"}` : `Create Plan (${n} Session${n === 1 ? "" : "s"})`}</button>`;
  const t = $("#ppTitle"); if (t) t.textContent = have.length ? "Re-plan My Prep" : "Plan My Prep";
}
/* the Prep plan view */
function drawView(){
  const ex = exOf(); if (!ex) { dlg.close(); return; }
  const body = $("#ppBody"), foot = $("#ppFoot"); if (!body) return;
  const today = todayISO(), ss = sessionsOf(ex.id), sm = summaryOf(ex), r = readyMemo(ex), P = prepOf(ex);
  const past = ex.due < today, byDate = {}; ss.forEach(s => { (byDate[s.due] = byDate[s.due] || []).push(s); });
  const ev = r.evidence, evTxt = [ev.sessions ? `${ev.sessions} finished session${ev.sessions === 1 ? "" : "s"}` : "", ev.cards ? `flashcard mastery in ${ev.cards} topic${ev.cards === 1 ? "" : "s"}` : "", ev.quizzes ? `${ev.quizzes} quiz score${ev.quizzes === 1 ? "" : "s"}` : ""].filter(Boolean).join(", ");
  const topicRows = P.topics.map(t => { const b = r.byTopic[t.id] || {cov: 0, pct: 0}, ls = liveLinks(t.links);
    return `<li class="pp-cov"><div class="pp-cov-top"><b>${esc(t.name)}</b><span class="mini">${esc((CONF3.find(c => c[0] === t.conf) || [0, "OK"])[1])}${t.done ? ", studied" : ""}</span><span class="spacer"></span><span class="mini">${b.cov}% covered${b.mastery != null ? `, cards ${b.mastery}%` : ""}${b.quiz != null ? `, quiz ${b.quiz}%` : ""}</span></div>
      <div class="pp-bar" role="img" aria-label="${esc(t.name)}: ${b.cov}% of its sessions done"><i style="width:${b.cov}%"></i></div>
      <div class="mini pp-links">${ls.length ? ls.map(l => esc(linkIcon(l.k) + ": " + l.title)).join(" · ") : "No linked material. "}${ls.length ? "" : `<button type="button" class="link-btn" data-pp="gen">Make Flashcards from Your Notes</button>`}</div></li>`; }).join("");
  const agenda = Object.keys(byDate).sort().map(d => `<li class="pp-day${d === today ? " is-today" : ""}${d < today ? " is-past" : ""}" ${d === today ? 'aria-current="date"' : ""}><div class="ep-day-head"><b>${esc(fmtDate(d))}</b>${d === today ? `<span class="pp-badge">Today</span>` : ""}<span class="mini">${fmtHM(byDate[d].reduce((a, x) => a + minOf(x), 0) / 60)}</span></div>
      <ul>${byDate[d].map(s => `<li class="pp-sess${s.status === "done" ? " is-done" : ""}${s.status !== "done" && d < today ? " is-missed" : ""}">
        <div class="pp-sess-top"><button type="button" class="check pp-check" data-act="prep-done" data-id="${esc(s.id)}" aria-label="${s.status === "done" ? "Mark not done" : "Mark done"}: ${esc(s.title)}">${CHECK}</button>
          <span class="pp-sess-t"><b>${esc(s.kind === "past" || s.kind === "light" ? EXAMPREP.KIND_LABEL[s.kind] : (s.topic || "Topic") + ": " + (KLOW[s.kind] || s.kind))}</b><span class="mini">${minOf(s)} min${s.slot ? " · " + esc(fmtTime(s.slot)) : ""}${s.status !== "done" && d < today ? " · missed" : ""}</span></span>${matBtn(s)}<button type="button" class="btn small" data-act="edit-task" data-id="${esc(s.id)}">Edit</button></div>
        <p class="pp-sess-x">${esc(s.notes || "")}</p></li>`).join("")}</ul></li>`).join("");
  body.innerHTML = `
    <div class="pp-head"><p class="pp-line"><b>${esc(sm.line)}</b></p>
      ${r.gate ? `<p class="mini" style="margin:0">Readiness is worked out from ${esc(evTxt)}.</p>` : `<p class="mini" style="margin:0">Readiness shows once you finish a session, progress on a linked deck or score a quiz.</p>`}
      <div class="pp-bar big" role="img" aria-label="${r.pct == null ? "Readiness not yet known" : "Readiness " + r.pct + " percent"}"><i style="width:${r.pct == null ? Math.round(sm.done / Math.max(1, sm.total) * 100) : r.pct}%"></i></div></div>
    ${sm.moved && !past ? `<p class="pp-note"><b>The exam date changed</b> (${esc(fmtDate(P.examDue))} to ${esc(fmtDate(ex.due))}). <button type="button" class="link-btn" data-pp="catch">Re-plan to the New Date</button></p>` : ""}
    ${sm.missed && !past ? `<p class="pp-note"><b>${sm.missed} session${sm.missed === 1 ? "" : "s"} slipped.</b> No problem: spread them over the days that are left. <button type="button" class="link-btn" data-pp="catch">Catch Up</button></p>` : ""}
    ${past ? `<p class="pp-note"><b>${esc(ex.title)} was on ${esc(fmtDate(ex.due))}.</b> How did it go? <button type="button" class="link-btn" data-pp="wrap">Add My Mark and Wrap Up</button></p>` : ""}
    <h3 class="fsec">Day by Day</h3><ol class="pp-agenda">${agenda}</ol>
    <h3 class="fsec">Topics</h3><ul class="pp-covs">${topicRows}</ul>`;
  foot.innerHTML = `<button type="button" class="btn" data-act="close">Close</button><span class="spacer"></span><button type="button" class="btn" data-pp="edit">Edit Topics</button>${sm.missed && !past ? `<button type="button" class="btn" data-pp="catch">Catch Up</button>` : ""}<button type="button" class="btn primary" data-pp="replan">Re-plan</button>`;
  const t = $("#ppTitle"); if (t) t.textContent = "Prep Plan";
}
function draw(){ if (!S) return; if (S.step === "view") drawView(); else drawPlan(); }
function sheet(){
  openSheet(`<form class="sheet ai-sheet ep pp"><div class="sheet-head"><h2 id="ppTitle">Plan My Prep</h2><button type="button" class="icon-btn" data-act="close" aria-label="Close">${CLOSE}</button></div><div class="sheet-body" id="ppBody"></div><div class="sheet-foot" id="ppFoot"></div></form>`);
  const form = dlg.querySelector("form");
  form.addEventListener("click", onClick); form.addEventListener("change", onChange);
  form.addEventListener("keydown", e => { if (e.key === "Enter" && e.target.id === "ppAdd" && !e.shiftKey) { e.preventDefault(); onClick({target: {closest: () => ({dataset: {pp: "add"}})}}); } });
  dlg.addEventListener("close", () => { S = null; }, {once: true});
}
function onChange(e){
  if (!S || S.step !== "plan") return;
  const t = e.target;
  if (t.id === "ppExam") { readForm(); const ex = state.tasks[t.value]; if (ex) { S = stateFor(ex, prepOf(ex)); autoSeed(ex); draw(); } return; }
  if (t.id === "ppCourse") { readForm(); S.topics.forEach(x => { if (!x.edited) x.links = autoLinksFor(x.name, S.courseId); }); draw(); return; }
  if (t.dataset && t.dataset.ppAdd !== undefined) { const tp = S.topics.find(x => x.id === t.dataset.ppAdd), v = t.value; if (!tp || !v) return; readForm(); const [k, a, b] = v.split(":"), mat = materialFor();
    let l = null; if (k === "deck") { const d = mat.decks.find(x => x.id === a); if (d) l = {k, id: a, title: d.name, total: d.cards.length, cardIds: null}; } else if (k === "quiz") { const d = mat.decks.find(x => x.id === a), q = d && d.quizzes.find(x => x.id === b); if (q) l = {k, id: b, deckId: a, title: q.title}; } else if (k === "note") { const n = mat.notes.find(x => x.id === a); if (n) l = {k, id: a, title: EXAMPREP.headingsOf(n.text)[0] || "Note"}; } else if (k === "file") { const f = mat.files.find(x => x.id === a); if (f) l = {k, id: a, title: f.name}; }
    if (l) { tp.links = (tp.links || []).concat(l); tp.edited = true; } draw(); return; }
  if (t.dataset && t.dataset.pp) return;
  if (t.dataset && (t.dataset.pn !== undefined || t.dataset.pw !== undefined)) { readForm(); return; }
  if (t.id === "ppDue" || t.id === "ppStart") { readForm(); draw(); }
}
function autoSeed(ex){
  if (S.topics.length) return;
  const sug = suggestFor(ex, S.courseId), n = addTopics(sug.map(x => x.name));
  S.msg = n ? `Suggested ${n} topic${n === 1 ? "" : "s"} from this course's decks, notes and files. Edit freely.` : "";
}
async function onClick(e){
  const b = e.target.closest && e.target.closest("[data-pp]"); if (!b || !S) return;
  const a = b.dataset.pp, id = b.dataset.id, ex = exOf(); if (!ex) return;
  if (a === "view") { S.step = "view"; draw(); return; }
  if (a === "edit") { S = Object.assign(stateFor(ex, prepOf(ex)), {replan: false}); autoSeed(ex); draw(); return; }
  if (a === "replan") { S = Object.assign(stateFor(ex, prepOf(ex)), {replan: true}); autoSeed(ex); draw(); return; }
  if (a === "catch") { catchUp(ex.id); return; }
  if (a === "wrap") { wrapUp(ex.id); return; }
  if (a === "gen") { if (dlg.open) dlg.close(); ui.tab = "flashcards"; ui.fc = null; ui.deckId = null; render(); runAct("fc-ai"); return; }
  if (S.step !== "plan") return;
  readForm();
  const tp = S.topics.find(x => x.id === id);
  switch (a) {
    case "conf": if (tp) tp.conf = b.dataset.v; break;
    case "rm": S.topics = S.topics.filter(x => x.id !== id); break;
    case "mat": S.open[id] = !S.open[id]; break;
    case "unlink": if (tp) { const ls = liveLinks(tp.links); ls.splice(Number(b.dataset.i), 1); tp.links = ls; tp.edited = true; } break;
    case "rematch": if (tp) { tp.links = autoLinksFor(tp.name, S.courseId); tp.edited = false; } break;
    case "add": { const ta = $("#ppAdd"), names = EXAMPREP.parseTopics(ta ? ta.value : ""), n = addTopics(names); S.msg = n ? `Added ${n} topic${n === 1 ? "" : "s"}.` : names.length ? "Those are already in the list." : "Type or paste some topics first."; S.addText = ""; if (ta) ta.value = ""; break; }
    case "suggest": { const sug = suggestFor(ex, S.courseId), n = addTopics(sug.map(x => x.name)); S.msg = n ? `Added ${n} suggested topic${n === 1 ? "" : "s"} from your decks, notes, files and the exam notes.` : "No new suggestions. Add topics by typing or pasting a list."; break; }
    case "style": { const v = b.dataset.v; S.style = S.style.includes(v) ? S.style.filter(x => x !== v) : S.style.concat(v); break; }
    case "int": S.intensity = Number(b.dataset.v); break;
    case "day": { const k = Number(b.dataset.v); S.days = S.days.includes(k) ? S.days.filter(x => x !== k) : S.days.concat(k).sort(); if (!S.days.length) S.days = [k]; break; }
    case "done": if (tp) tp.done = b.checked; break;
    case "light": S.light = b.checked; break;
    case "rest": S.rest = b.checked; if (S.rest) S.light = true; break;
    case "ai": S.ai = b.checked; break;
    case "aifind": { await aiFind(ex, b); return; }
    case "create": { await create(ex, b); return; }
  }
  draw();
}
async function aiFind(ex, b){
  b.disabled = true; const msg = $("#ppFindMsg"); if (msg) msg.innerHTML = `<span class="ai-spin" aria-hidden="true"></span> Reading…`;
  try {
    const parts = [], files = Object.values(state.files).filter(f => (f.courseId || "") === (S.courseId || "") && readableFile(f)).sort((a, c) => (c.updated || c.created || 0) - (a.updated || a.created || 0)).slice(0, 3);
    for (const f of files) { const bytes = await fileBytes(f); parts.push((await aiSourceFromFile(new File([bytes], fileNameOf(f), {type: fileTypeOf(f)}))).part); }
    const c = courseOf(S.courseId);
    const r = await aiCall({task: "topics", maxTokens: 4000, schema: TOPICS_SCHEMA, parts: parts.concat({text: `Course: ${c ? c.name : ""}\nExam: ${ex.title} on ${S.due}\nWhat the exam covers (student's notes): ${ex.notes || "not given"}\nList the topics this exam will most likely test, in teaching order, 4 to 15 topics.`}),
      system: "You list the topics a course exam will cover, using the course files and the exam notes. Only list topics that actually appear in those files or notes; never add general topics the material does not mention. If neither the files nor the notes say what is covered, return fewer topics rather than guess. Topic names are short (2 to 6 words), plain text, no repeats. Return JSON only."});
    const n = addTopics((r.data.topics || []).map(t => String(t.name || "").trim()));
    S.msg = n ? `Added ${n} topic${n === 1 ? "" : "s"} from your files. Mark the ones you're shaky on.` : "No new topics found."; draw();
  } catch (err) { b.disabled = false; S.msg = (err && err.message) || "Couldn't read the files."; draw(); }
}
async function create(ex, b){
  readForm(); const out = compute(), status = $("#ppStatus");
  if (!out || out.err || !out.sessions.length) return;
  const P = curP(), topics = S.topics.filter(t => t.name.trim());
  b.disabled = true;
  if (S.ai && aiReady()) { if (status) status.innerHTML = `<span class="ai-spin" aria-hidden="true"></span> Wording each session…`; try { await aiWords(ex, out, P, m => { if (status) status.textContent = m; }); } catch (err) { if (status) status.textContent = `${(err && err.message) || "The AI couldn't help"}. Using the standard instructions.`; } }
  const cur = state.tasks[ex.id]; if (!cur) return;
  const replan = sessionsOf(ex.id).length > 0, due = S.due, time = S.time, courseId = S.courseId;
  S = null; dlg.close();
  applyPlan(cur, P, topics, due, time, out, {replan, courseId});
}
function catchUp(id){
  const ex = state.tasks[id]; if (!ex) return;
  const P = prepOf(ex), topics = P.topics; if (!topics.length) { open(id, {edit: true}); return; }
  const out = EXAMPREP.plan(inputFor(ex, P, topics, ex.due));
  if (out.err || !out.sessions.length) { toast((out.warnings && out.warnings[0]) || "There's no room left before the exam."); return; }
  const kept = sessionsOf(id).filter(t => t.status === "done").length;
  applyPlan(ex, Object.assign({}, P, {style: P.style, ai: false}), topics, ex.due, ex.time, out, {replan: true, label: `Caught up: ${out.sessions.length} session${out.sessions.length === 1 ? "" : "s"} spread over the days left${kept ? ` (${kept} done kept)` : ""}`});
  if (dlg.open && S && S.step === "view") { S.step = "view"; draw(); }
}
function wrapUp(id){
  const ex = state.tasks[id]; if (!ex) return;
  const open = sessionsOf(id).filter(t => t.status !== "done"), changes = open.map(t => ({kind: "task", id: t.id, after: null}));
  const n = Object.assign(clone(ex), {status: "done", doneAt: Date.now(), order: nextOrder("done"), pct: 100}); n.prep = Object.assign({}, n.prep || {}, {archived: true});
  changes.push({kind: "task", id, after: n});
  if (dlg.open) dlg.close();
  applyChanges(changes, `${ex.title} wrapped up${open.length ? `, ${open.length} unused session${open.length === 1 ? "" : "s"} removed` : ""}`);
  setTimeout(() => runAct("g-mark", {id}), 60);
}
/* entry points */
function open(id, o){
  o = o || {};
  let ex = id && state.tasks[id];
  if (!ex || !MILESTONE(ex.type)) { const list = upcoming(); ex = list[0] || null; }
  if (!ex) { toast("Add an exam or quiz with a date first"); return; }
  if (!ex.due) { toast("Give this exam a date first, then plan your prep"); return; }
  const P = prepOf(ex), have = hasPlan(ex);
  S = stateFor(ex, P);
  if (ex.due <= todayISO() && !have) { toast("That exam is today or has passed, so there's nothing left to plan before it."); S = null; return; }
  sheet();
  if (have && !o.edit) { S.step = "view"; drawView(); }
  else { if (have) S.replan = true; autoSeed(ex); drawPlan(); }
}

/* Today: a few quiet lines, never a wall */
const trayShows = (ex, days) => { try { return !!AUTO_ON && autoFeatOn("coach") && ex.type === "Exam" && days <= 14 && !(AUTO.dis || {})["prep:" + ex.id] && !insSnoozed("prep"); } catch (e) { return false; } };
function todayItems(){
  const today = todayISO(), dis = ppLoad().dismissed || {}, out = [];
  tasksArr().filter(t => MILESTONE(t.type) && t.due).sort(sortTasks).forEach(ex => {
    const sm = summaryOf(ex), c = courseOf(ex.courseId), days = dayDiff(today, ex.due), nm = ex.title;
    if (!sm) {
      if (ex.status !== "done" && days >= 1 && days <= 21 && !dis[ex.id] && !trayShows(ex, days)) out.push({id: ex.id, kind: "offer", text: `${nm}${c ? " (" + courseLabel(c) + ")" : ""} is ${days === 1 ? "tomorrow" : "in " + days + " days"}. Spread your review across the days before it?`, btn: "Plan My Prep", act: "exam-plan"});
      return;
    }
    if (ex.status === "done") return;
    if (days < 0) { if (!(ex.prep && ex.prep.archived)) out.push({id: ex.id, kind: "passed", text: `${nm} has passed. How did it go?`, btn: "Wrap Up", act: "prep-wrap"}); return; }
    if (sm.moved) out.push({id: ex.id, kind: "moved", text: `${nm} moved to ${fmtDate(ex.due)}. Re-spread your prep sessions to match?`, btn: "Re-plan", act: "prep-catch"});
    else if (sm.missed) out.push({id: ex.id, kind: "behind", text: `${sm.missed} prep session${sm.missed === 1 ? "" : "s"} for ${nm} slipped. Spread ${sm.missed === 1 ? "it" : "them"} over the days that are left?`, btn: "Catch Up", act: "prep-catch"});
  });
  return out.slice(0, 2);
}
function todayHtml(){
  let items; try { items = todayItems(); } catch (e) { console.warn("prep today", e); return ""; }
  if (!items.length) return "";
  return `<div class="pp-today" role="region" aria-label="Exam prep">${items.map(i => `<div class="pp-today-row" data-kind="${esc(i.kind)}"><span class="pp-today-t">${esc(i.text)}</span><span class="pp-today-a"><button type="button" class="btn small ${i.kind === "offer" ? "primary" : ""}" data-act="${esc(i.act)}" data-id="${esc(i.id)}">${esc(i.btn)}</button>${i.kind === "offer" ? `<button type="button" class="icon-btn sm" data-act="prep-dismiss" data-id="${esc(i.id)}" aria-label="Not now">${CLOSE}</button>` : ""}</span></div>`).join("")}</div>`;
}
/* the exam's own detail sheet and row */
function formHtml(t){
  if (!t || !MILESTONE(t.type)) return "";
  const sm = summaryOf(t), today = todayISO(), over = t.due && t.due < today;
  if (!sm) return t.status === "done" || over ? "" : `<div class="pp-form"><div><b>Exam prep</b><span class="mini"> Spread review sessions across the days before, with your decks and notes.</span></div><button type="button" class="btn small primary" data-act="exam-plan" data-id="${esc(t.id)}">Plan My Prep</button></div>`;
  return `<div class="pp-form"><div><b>Prep plan</b><span class="mini"> ${esc(sm.line)}${sm.missed ? ` · ${sm.missed} slipped` : ""}${sm.moved ? " · date changed" : ""}</span><div class="pp-bar" role="img" aria-label="${sm.pct == null ? sm.done + " of " + sm.total + " sessions done" : "Readiness " + sm.pct + " percent"}"><i style="width:${sm.pct == null ? Math.round(sm.done / sm.total * 100) : sm.pct}%"></i></div></div><button type="button" class="btn small primary" data-act="exam-plan" data-id="${esc(t.id)}">Open Prep Plan</button></div>`;
}
function rowBtn(t){
  if (!t || !MILESTONE(t.type) || t.status === "done" || !t.due || t.due < todayISO()) return "";
  const sm = summaryOf(t);
  return `<button type="button" class="pp-row-btn" data-act="exam-plan" data-id="${esc(t.id)}">${sm ? "Prep Plan" : "Plan My Prep"}</button>`;
}
const rowLine = t => { if (!t || !MILESTONE(t.type) || t.status === "done") return ""; const sm = summaryOf(t); return sm ? `${sm.done}/${sm.total} sessions` : ""; };
function courseHtml(c){
  const list = upcoming().filter(t => t.courseId === c.id).slice(0, 3); if (!list.length) return "";
  return `<h2 class="sec"><span class="t">Upcoming Exams</span><span class="n">${list.length}</span></h2><ul class="pp-exams">${list.map(t => { const sm = summaryOf(t), d = dayDiff(todayISO(), t.due); return `<li><button type="button" class="pp-ex-main" data-act="edit-task" data-id="${esc(t.id)}"><b>${esc(t.title)}</b><span class="mini">${esc(fmtDate(t.due))}${t.time ? " at " + esc(fmtTime(t.time)) : ""} · ${d === 0 ? "today" : d === 1 ? "tomorrow" : d + " days"}${sm ? " · " + esc(sm.line) : ""}</span></button><button type="button" class="btn small ${sm ? "" : "primary"}" data-act="exam-plan" data-id="${esc(t.id)}">${sm ? "Prep Plan" : "Plan My Prep"}</button></li>`; }).join("")}</ul>`;
}
/* the companion */
function offer(){
  try {
    const today = todayISO(), said = ppLoad().said || {};
    if (said.day === today && (said.n || 0) >= 2) return null;
    const t = tasksArr().find(x => x.prepFor && x.type === "Study" && x.status !== "done" && x.due === today && !((said.day === today ? said.ids : null) || {})[x.id] && state.tasks[x.prepFor] && state.tasks[x.prepFor].status !== "done");
    if (!t) return null;
    const m = minOf(t), d = t.matKind === "deck" ? state.decks[t.matId] : null, due = d ? d.cards.filter(cardDue).length : 0, nm = t.topic || "Your prep";
    const text = t.kind === "cards" && due ? `${nm} flashcards today: ${due} card${due === 1 ? "" : "s"} due.` : t.kind === "past" ? `Timed practice today: ${m} minutes in exam conditions.` : t.kind === "light" ? "Light review today, then rest. No new material." : `${nm} (${KLOW[t.kind] || "study"}) is on today's plan: ${m} minutes.`;
    return {text, action: "prep", taskId: t.id, yes: t.matKind ? matLabel(t) : "Open", local: true};
  } catch (e) { return null; }
}
function offered(id){ const o = ppLoad(), today = todayISO(), s = o.said && o.said.day === today ? o.said : {day: today, n: 0, ids: {}}; s.n = (s.n || 0) + 1; s.ids = Object.assign({}, s.ids, {[id]: 1}); o.said = s; ppSave(o); }
const ideaValid = id => { const t = state.tasks[id]; return !!t && t.status !== "done" && !!t.prepFor; };
function runIdea(id){ const t = state.tasks[id]; if (!t) return; if (t.matKind) openMaterial(t); else { ui.tab = "board"; render(); taskForm(t); } }

/* actions */
hook("act", (act, el, id) => {
  switch (act) {
    case "prep-plan": open(id || (upcoming()[0] || {}).id); return true;
    case "exam-plan": open(id); return true;
    case "prep-open-mat": openMaterial(state.tasks[id]); return true;
    case "prep-done": { if (state.tasks[id]) runAct("toggle", {id}); return true; }
    case "prep-catch": catchUp(id); return true;
    case "prep-wrap": wrapUp(id); return true;
    case "prep-dismiss": { const o = ppLoad(); o.dismissed = Object.assign({}, o.dismissed, {[id]: Date.now()}); ppSave(o); scheduleRender(); return true; }
  }
  return false;
});
// Keep an open Prep plan in step with what changed, and offer a re-plan when the exam moves
const MOVED_ASKED = new Set();
hook("changed", changes => {
  try {
    if (S && S.step === "view" && dlg.open && (changes || []).some(c => c.kind === "task")) drawView();
    (changes || []).forEach(c => {
      const t = c.kind === "task" && c.after; if (!t || !MILESTONE(t.type) || !t.prep || t.status === "done" || !t.prep.examDue || t.prep.examDue === t.due || t.due <= todayISO()) return;
      const k = t.id + "|" + t.due; if (MOVED_ASKED.has(k) || !hasPlan(t)) return; MOVED_ASKED.add(k);
      setTimeout(() => { const cur = state.tasks[t.id]; if (cur && cur.due === t.due && cur.prep && cur.prep.examDue !== cur.due && !(dlg.open && S)) toast(`${cur.title} moved to ${fmtShort(cur.due)}. Re-plan your prep?`, null, {label: "Re-plan", fn: () => catchUp(t.id)}); }, 600);
    });
  } catch (e) { console.warn("prep changed", e); }
});
window.SBPREP = {open, todayHtml, formHtml, rowBtn, rowLine, courseHtml, matBtn, pct: pctOf, summary: summaryOf, offer, offered, ideaValid, runIdea, catchUp, sessions: sessionsOf, EXAMPREP, _state: () => S, _plan: id => { const ex = state.tasks[id], P = prepOf(ex); return EXAMPREP.plan(inputFor(ex, P, P.topics, ex.due)); }};
})();

