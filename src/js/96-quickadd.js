/* ===== module: 96-quickadd.js ===== */
/* Quick Add Files and Learning Objectives (module 96-qadd).
   Quick Add: drop or choose files with no course or type; each is read (the same PDF, PowerPoint and Word readers file analysis uses), a course and a type
   are guessed (AI when it's on, keyword rules otherwise), and the person confirms or fixes each guess before anything is saved.
   Learning objectives: pulled out of syllabi and lecture slides (AI plus keyword rules), kept on the course (course.objectives), editable, checked off as mastered,
   linked to flashcards (card.obj), shown with what covers each one, and offered as topics in the Exam Prep Planner. The pure code is between QADD-START and QADD-END. */
(() => {
/*QADD-START*/
const QADD = (() => {
  const fold = s => String(s == null ? "" : s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const KINDS = [["syllabus", "Syllabus"], ["slides", "Lecture Slides"], ["notes", "Notes"], ["assignment", "Assignment"], ["exam", "Exam or Quiz"], ["reading", "Reading"], ["other", "Other"]];
  const FOLDER = {syllabus: "syllabus", slides: "notes", notes: "notes", assignment: "assignments", exam: "exams", reading: "other", other: "other"};
  const KIND_NAME = Object.fromEntries(KINDS);
  // Each rule: [pattern, weight, label]
  const RULES = {
    syllabus: [[/\bsyllab(?:us|i)\b/, 6, "syllabus"], [/course (?:outline|schedule|calendar|description|policies)/, 3, "course schedule"], [/office hours?/, 2, "office hours"], [/grading (?:policy|scheme|breakdown|scale)|grade breakdown|how you will be graded/, 3, "grading policy"], [/academic (?:integrity|honesty|misconduct)/, 2, "academic integrity"], [/required (?:text|textbooks?|materials|readings?)/, 2, "required texts"], [/late (?:work|policy|submissions?|penalt)/, 1, "late policy"], [/teaching assistant|instructor:|professor:|course coordinator/, 1, "instructor"], [/learning (?:objectives|outcomes)/, 1, "outcomes"]],
    slides: [[/\bslides?\b/, 4, "slides"], [/\blectures?\s*#?\d+\b|\blec\s*\d+\b|\bweek\s*\d+\b/, 2, "lecture number"], [/\bppt\b|\bpowerpoint\b/, 3, "PowerPoint"], [/^slide \d+:/m, 6, "slide text"], [/agenda|learning objectives|today we|questions\?|thank you|next time/, 1, "slide wording"]],
    notes: [[/\bnotes?\b/, 4, "notes"], [/study guide|cheat ?sheet|review sheet|summary of|cornell|key takeaways|handout/, 3, "study guide"], [/lecture notes/, 2, "lecture notes"]],
    assignment: [[/\b(?:assignment|homework|hw ?\d*|problem sets?|pset|worksheet|lab (?:report|manual|\d+)|project (?:brief|description|guidelines?|proposal)|essay (?:prompt|instructions?)|rubric|case study|take-?home)\b/, 4, "assignment wording"], [/due (?:date|on|by|at)?\s*:?\s*(?:\w+ \d|\d)/, 2, "a due date"], [/submit|submission|deliverables?|hand in/, 2, "submission"], [/\bpoints?\b|\bmarks?\b/, 1, "points"], [/instructions?:/, 1, "instructions"]],
    exam: [[/\b(?:exam|midterm|mid-term|quiz|final exam|test)\b/, 4, "exam wording"], [/practice (?:exam|test|questions?|quiz)|past papers?|answer key|sample (?:exam|questions?)|study questions|review questions/, 3, "practice questions"], [/multiple choice|true\s*\/\s*false|select all that apply|circle the/, 2, "question formats"], [/question\s*\d+|\bq\d+[.)]/, 1, "numbered questions"]],
    reading: [[/\b(?:chapter|chap\.?|ch\.?)\s*\d+/, 3, "chapter"], [/\b(?:reading|article|journal|abstract|bibliography|doi:|et al\.?|textbook|proceedings|literature review)\b/, 2, "article wording"], [/\bvol(?:ume)?\.?\s*\d+|\bpp\.\s*\d+|\bissn\b/, 2, "citation"], [/references\s*\n/, 1, "references"]]
  };
  const NEG = {exam: /final (?:project|paper|essay|presentation|report|draft|assignment|portfolio|submission|reflection)/, assignment: /\bnotes? (?:on|about)\b/};
  // Which kind of file this is, from its name and the start of its text
  function kindOf(name, text){
    const n = fold(name), ext = (n.split(".").pop() || ""), t = fold(String(text || "").slice(0, 5000));
    const base = n.replace(/\.[a-z0-9]{1,5}$/, "").replace(/[_\-.]+/g, " ");
    const score = {}, why = {};
    Object.keys(RULES).forEach(k => {
      let s = 0; const w = [];
      RULES[k].forEach(([re, wt, label]) => {
        const nm = re.test(base), tx = re.test(t);
        if (NEG[k] && NEG[k].test(base)) return;
        if (nm) { s += wt * 3; w.push(label); } else if (tx) { s += wt; w.push(label); }
      });
      score[k] = s; why[k] = w;
    });
    if (ext === "pptx" || ext === "ppt" || ext === "key" || ext === "odp") score.slides += 6;
    const ranked = Object.keys(score).sort((a, b) => score[b] - score[a]);
    const top = ranked[0], second = ranked[1];
    if (score[top] < 3) return {kind: "other", conf: 0.2, why: [], scores: score};
    return {kind: top, conf: Math.max(0.3, Math.min(0.95, score[top] / (score[top] + score[second] + 4))), why: [...new Set(why[top])].slice(0, 3), scores: score};
  }
  const STOPW = new Set("the and for with from that this these those your you are was were will our not but all any can has have into over under about course class introduction intro general principles fundamentals topics advanced basic basics studies study lecture lectures notes slides week unit module part section".split(" "));
  const words = s => (fold(s).match(/[a-z0-9]+/g) || []);
  // Which course a file belongs to, from the course code
  function courseOfFile(name, text, courses){
    const nameF = fold(name), head = fold(String(text || "").slice(0, 6000));
    const hay = nameF + "\n" + head, compact = hay.replace(/[^a-z0-9]/g, ""), nameWords = new Set(words(nameF)), hayWords = new Set(words(hay));
    const rows = (courses || []).map(c => {
      let s = 0; const why = [];
      const code = fold(c.code).replace(/[^a-z0-9]/g, "");
      if (code.length >= 4 && /\d/.test(code) && /[a-z]/.test(code) && compact.includes(code)) { s += 10; why.push("course code " + c.code); }
      const cn = fold(c.name).replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
      if (cn.length >= 5 && (" " + hay.replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ") + " ").includes(" " + cn + " ")) { s += 8; why.push("the course name"); }
      const sur = words(c.instructor).filter(w => w.length >= 4 && !/^(prof|professor|dr|mrs|miss)$/.test(w)).pop();
      if (sur && hayWords.has(sur)) { s += 4; why.push("instructor " + sur); }
      const tw = [...new Set(words(c.name))].filter(w => w.length >= 4 && !STOPW.has(w));
      let th = 0; tw.forEach(w => { if (nameWords.has(w)) th += 3; else if (hayWords.has(w)) th += 2; });
      if (tw.length && th) { s += Math.min(8, th); if (!why.length) why.push("words from the course name"); }
      return {id: c.id, s, why};
    }).sort((a, b) => b.s - a.s);
    const a = rows[0], b = rows[1];
    if (!a || a.s < 6 || (b && a.s - b.s < 2)) return {courseId: "", conf: 0, why: []};
    return {courseId: a.id, conf: Math.min(0.95, a.s / 14), why: a.why.slice(0, 2)};
  }
  function guess(name, text, courses){
    const k = kindOf(name, text), c = courseOfFile(name, text, courses);
    const bits = [];
    if (k.kind !== "other") bits.push(`Looks like ${/^[aeiou]/i.test(KIND_NAME[k.kind]) ? "an" : "a"} ${KIND_NAME[k.kind].toLowerCase()}${k.why.length ? " (" + k.why.join(", ") + ")" : ""}`);
    if (c.courseId) bits.push("mentions " + c.why.join(" and "));
    return {courseId: c.courseId, kind: k.kind, conf: Math.min(k.conf, c.courseId ? 1 : 0.6), why: bits.join("; "), src: "rules"};
  }
  // The folder in a course (or General) that a kind of file goes in
  const folderFor = (kind, folderIds) => { const f = FOLDER[kind] || "other"; return (folderIds || []).includes(f) ? f : (folderIds || []).includes("other") ? "other" : (folderIds || [])[0] || "other"; };

  /* Learning objectives */
  const VERBS = "define|describe|explain|identify|list|compare|contrast|analy[sz]e|apply|evaluate|assess|discuss|summari[sz]e|demonstrate|calculate|solve|design|develop|create|construct|interpret|distinguish|differentiate|recogni[sz]e|recall|outline|predict|justify|critique|classify|derive|illustrate|use|understand|know|explore|examine|formulate|implement|integrate|measure|perform|prepare|present|propose|recommend|relate|review|select|state|trace|write|communicate|compute|determine|diagnose|administer|prioritize|plan|synthesi[sz]e|appreciate|gain|learn|master|build|conduct|critically|be able to|become|navigate|reflect|collaborate|practice|operate|name|label|arrange|categori[sz]e|choose|defend|estimate|express|infer|locate|model|organi[sz]e|paraphrase|produce|provide|reproduce|sketch|test|translate|work|show|read|monitor|manage|maintain|obtain|distinguish|detect|document|educate|encourage|ensure|establish|follow|promote|recognise";
  const VERB_RE = new RegExp("^(?:" + VERBS + ")\\b", "i");
  const BULLET = /^\s*(?:[-*•●▪◦‣–—·■→>]+|\(?\d{1,2}[.)]|\(?[a-hA-H][.)]|(?:LO|CLO|ILO|SLO|O)\s*\d+[.:)\-]?)\s+/;
  const HEADS = [
    /^(?:(?:learning|course|student learning|unit|module|lecture|class|session|key|program|chapter)\s+)?(?:objectives?|outcomes?|goals?)\b(?:\s+(?:for|of)\s+(?:this|the)\s+\w+)?\s*[:\-–—]?\s*(.*)$/i,
    /^(?:by the end of|at the end of|upon (?:successful )?completion of|upon completing|after (?:completing|taking|finishing|this|the)|on completion of|when you finish)\b[^:,]{0,100}[:,]\s*(?:students?|you|learners?|participants?)?\s*(?:will|should|shall|are expected to|can|would)?\s*(?:be able to)?\s*[:,]?\s*(.*)$/i,
    /^(?:students?|you|learners?|participants?)\s+(?:will|should|shall|are expected to|must)\s+(?:be able to|learn to|demonstrate the ability to|have)\s*[:,]?\s*(.*)$/i,
    /^(?:what you(?:'ll| will) learn|you(?:'ll| will) learn|goals for (?:today|this (?:lecture|class))|today(?:'s)? (?:goals|objectives)|in this (?:lecture|class|session|module|unit)[^:]{0,50}(?:you|we)(?:'ll| will)?(?: be able to)?)\s*[:,]?\s*(.*)$/i
  ];
  const clean = s => String(s || "").replace(/^slide \d+:\s*/i, "").replace(BULLET, "").replace(/^\s*(?:students?|you|learners?)\s+(?:will|should|shall|are expected to|must)\s*(?:be able to\s*:?\s*)?/i, "")
    .replace(/^(?:be able to|to)\s+(?=[a-z])/i, "").replace(/\s+/g, " ").replace(/[\s;,.]+$/, "").trim();
  const SPLIT = /;\s*|,?\s+and to\s+/i;
  const cap1 = s => s.charAt(0).toUpperCase() + s.slice(1);
  const wordsN = s => (String(s).match(/\S+/g) || []).length;
  function isHead(line){
    const l = line.replace(/^slide \d+:\s*/i, "").replace(BULLET, "").trim();
    if (!l || l.length > 220) return null;
    for (let i = 0; i < HEADS.length; i++) {
      const m = HEADS[i].exec(l); if (!m) continue;
      const tail = (m[1] || "").trim();
      if (i === 0) { const before = l.slice(0, l.length - tail.length); if (wordsN(before) > 7 || (tail && !/[:\-–—]\s*$/.test(before) && wordsN(tail) > 3 && !VERB_RE.test(tail))) continue; }
      return {tail};
    }
    return null;
  }
  // Objectives stated in a syllabus, a lecture's slides or any document
  function objectives(text, limit){
    const lines = String(text || "").replace(/\r/g, "").split("\n").map(s => s.replace(/\t+/g, " ").replace(/[  ]+/g, " ").trim()), out = [], seen = new Set();
    const add = raw => {
      let s = clean(raw); if (s.length < 10 || s.length > 260) return false;
      if (!VERB_RE.test(s) && !/^[A-Za-z]/.test(s)) return false;
      s = cap1(s); const k = words(s).join(" "); if (!k || seen.has(k)) return false;
      seen.add(k); out.push(s); return true;
    };
    const max = limit || 20;
    for (let i = 0; i < lines.length && out.length < max; i++) {
      const h = isHead(lines[i]); if (!h) continue;
      let got = 0, blanks = 0, bulletsSeen = false;
      if (h.tail) h.tail.split(SPLIT).forEach(p => { if (p && add(p)) got++; });
      let last = -1, j = i + 1;
      for (; j < lines.length && out.length < max; j++) {
        const l = lines[j];
        if (!l) { if (++blanks > 1 && got) break; continue; }
        if (/^slide \d+:?\s*$/i.test(l) && (got || j > i + 1)) break;
        const h2 = isHead(l);
        if (h2) { if (got) break; if (h2.tail) h2.tail.split(SPLIT).forEach(x => { if (x && add(x)) got++; }); continue; }
        const bullet = BULLET.test(l), body = clean(l);
        if (!body) continue;
        if (blanks && got && !bullet && !VERB_RE.test(body)) break;
        blanks = 0;
        if (bullet || VERB_RE.test(body)) {
          if (bullet) bulletsSeen = true;
          if (add(l)) { got++; last = out.length - 1; }
          continue;
        }
        if (last >= 0 && /^[a-z(]/.test(body) && out[last].length + body.length < 260 && !/[.!?]$/.test(out[last])) { const old = out[last]; seen.delete(words(old).join(" ")); out[last] = old + " " + body; seen.add(words(out[last]).join(" ")); continue; }
        if (!got && !bulletsSeen && j < i + 3 && body.length > 20 && body.length < 200 && !/[.!?]$/.test(body)) { if (add(l)) { got++; last = out.length - 1; } continue; }
        break;
      }
      i = Math.max(i, j - 1);
    }
    return out.slice(0, max);
  }

  /* Coverage: which objectives have cards, notes and files */
  const OBJ_STOP = new Set(("able ability understand understanding concepts concept principles basic basics using use used students student course topic topics various different important key general fundamental major main describe explain identify define compare contrast apply analyze analyse evaluate discuss summarize demonstrate calculate solve design develop create construct interpret distinguish differentiate recognize recall outline predict justify critique classify derive illustrate explore examine formulate implement integrate measure perform prepare present propose recommend relate review select state trace write communicate compute determine their they them with from that this these those which where when what into about between among within across through during after before while also such each both only other than then more most some many much very well will would should could able lecture class").split(" "));
  const stem = w => w.length > 5 ? w.replace(/(?:ing|ed|es|ly|s)$/, "") : w.length > 4 ? w.replace(/s$/, "") : w;
  function terms(text){
    const ws = [...new Set(words(text).filter(w => w.length >= 4 && !OBJ_STOP.has(w) && !/^\d+$/.test(w)).map(stem))];
    return ws.sort((a, b) => b.length - a.length).slice(0, 6);
  }
  const hayWords = s => new Set(words(s).map(stem));
  function covers(ts, hw){
    if (!ts.length) return false;
    let hit = 0; ts.forEach(t => { if (hw.has(t)) hit++; });
    return hit >= Math.min(ts.length, 2) && hit / ts.length >= 0.5;
  }
  // objs: [{id, text}]; mat: {cards: [{front, back, obj}], notes: [{text}], files: [{name
  function coverage(objs, mat){
    mat = mat || {};
    const cardW = (mat.cards || []).map(c => ({c, w: hayWords((c.front || "") + " " + (c.back || ""))}));
    const noteW = (mat.notes || []).map(n => hayWords(n.text));
    const fileW = (mat.files || []).map(f => hayWords([f.name, f.desc, f.summary].filter(Boolean).join(" ")));
    const out = {};
    (objs || []).forEach(o => {
      const ts = terms(o.text), linked = cardW.filter(x => x.c.obj === o.id).length;
      const cards = linked + cardW.filter(x => x.c.obj !== o.id && !x.c.obj && covers(ts, x.w)).length;
      out[o.id] = {cards, linked, notes: noteW.filter(w => covers(ts, w)).length, files: fileW.filter(w => covers(ts, w)).length};
    });
    return out;
  }
  // A short name for an objective, for topic lists
  function shortName(text){
    let s = clean(text).replace(VERB_RE, "").replace(/^\s*(?:how|why|what|the|a|an|and|between|of|that)\b\s*/i, "").replace(/^\s*(?:how|why|what|the|a|an)\b\s*/i, "").trim();
    if (s.length < 4) s = clean(text);
    if (s.length > 70) { s = s.slice(0, 70); const sp = s.lastIndexOf(" "); if (sp > 30) s = s.slice(0, sp); }
    return cap1(s.replace(/[\s.,;:]+$/, ""));
  }
  // Add new objectives to a list, skipping any that repeat one already there
  function fresh(have, cand){
    const keys = (have || []).map(h => new Set(terms(h.text || h)));
    const seen = new Set((have || []).map(h => words(h.text || h).join(" ")));
    const out = [];
    (cand || []).forEach(c => {
      const t = typeof c === "string" ? c : c.text, k = words(t).join(" "); if (!k || seen.has(k)) return;
      const ts = new Set(terms(t));
      const dup = keys.some(ks => { if (!ks.size || !ts.size) return false; let n = 0; ts.forEach(x => { if (ks.has(x)) n++; }); return n / Math.max(ks.size, ts.size) >= 0.75; });
      if (dup) return; seen.add(k); keys.push(ts); out.push(c);
    });
    return out;
  }
  return {tidy: s => cap1(clean(s)), KINDS, KIND_NAME, FOLDER, kindOf, courseOfFile, guess, folderFor, objectives, terms, coverage, shortName, fresh, fold, isHead};
})();
/*QADD-END*/

  /* Shared bits */
  const clip = (s, n) => String(s == null ? "" : s).replace(/\s+/g, " ").trim().slice(0, n);
  const aiOn = () => { try { return aiReady(); } catch (e) { return false; } };
  // AI without asking
  const aiQuiet = () => { try { return aiReady() && !aiTrialing() && aiConsented(aiCfg().provider); } catch (e) { return false; } };
  const aiMsg = e => (e && e.code === "no-consent") ? "AI is off until you agree to send content to your AI provider." : (e && e.message) || "AI isn't available right now.";
  const css = document.createElement("style");
  css.textContent = `
.qa-list,.obj-list{list-style:none;margin:10px 0 0;padding:0;display:flex;flex-direction:column;gap:8px}
.qa-row{display:flex;gap:10px;align-items:flex-start;border:1px solid var(--line);border-radius:12px;padding:10px 12px;background:var(--surface)}
.qa-row.off{opacity:.55}
.qa-on{padding-top:3px}
.qa-main{flex:1;min-width:0;display:flex;flex-direction:column;gap:6px}
.qa-name{font-weight:600;overflow-wrap:anywhere}
.qa-sel{display:flex;gap:8px;flex-wrap:wrap}
.qa-sel select{flex:1 1 150px;min-width:0}
.qa-why.warn{color:var(--late)}
.obj-bar{display:flex;align-items:center;gap:10px;margin:2px 0 8px}
.obj-bar .track{flex:1;height:6px;border-radius:99px;background:var(--soft);overflow:hidden}
.obj-bar .track i{display:block;height:100%;background:var(--accent);border-radius:99px}
.obj-li{display:flex;gap:8px 12px;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;border-bottom:1px solid var(--line);padding:6px 0}
.obj-li .mi-check{align-items:flex-start;flex:1 1 260px}
.obj-li.done .obj-t{text-decoration:line-through;color:var(--muted)}
.obj-cov{display:flex;gap:6px;flex-wrap:wrap}
.obj-chip{font-size:.78rem;border:1px solid var(--line);border-radius:99px;padding:1px 8px;color:var(--muted);white-space:nowrap}
.obj-chip.gap{border-style:dashed}
.obj-pend{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin:0 0 8px;padding:8px 12px;border-radius:10px;background:color-mix(in srgb,var(--accent) 8%,transparent)}
.obj-ed{display:flex;gap:8px;align-items:center}
.obj-ed input[type=text]{flex:1;min-width:0}
`;
  document.head.appendChild(css);

  // The text of a file that isn't stored yet
  async function textOfFile(file, max){
    const ext = (file.name.split(".").pop() || "").toLowerCase();
    try {
      if (file.size > 60 * 1048576) return "";
      if (ext === "pdf" || file.type === "application/pdf") return (await pdfText(new Uint8Array(await file.arrayBuffer()))).text.slice(0, max);
      if (ext === "pptx") return (await pptxText(await file.arrayBuffer())).slice(0, max);
      if (ext === "docx") return (await docxText(await file.arrayBuffer())).slice(0, max);
      if (/^(txt|md|markdown|csv|tsv|html?)$/.test(ext) || /^text\//.test(file.type)) return new TextDecoder().decode(await file.slice(0, 400000).arrayBuffer()).slice(0, max);
    } catch (e) {}
    return "";
  }

  /* Quick Add Files */
  const QA = {items: [], seq: 0, busy: false, note: ""};
  const storable = f => !!(mimeFor(f) || sbActive() || DESK);
  const courseList = () => coursesArr().map(c => ({id: c.id, name: c.name, code: c.code || "", instructor: c.instructor || ""}));
  const qaEl = () => document.getElementById("qaList");
  function qaRow(x){
    const nm = esc(x.file.name);
    return `<li class="qa-row${x.on ? "" : " off"}" data-qa="${esc(x.id)}">
      <label class="qa-on"><input type="checkbox" data-qa-on ${x.on ? "checked" : ""} ${x.bad || x.state !== "ready" ? "disabled" : ""} aria-label="Add ${nm}"></label>
      <div class="qa-main"><span class="qa-name">${nm} <span class="mini">${esc(fmtSize(x.file.size))}</span></span>
        ${x.bad ? `<span class="mini qa-why warn">${esc(x.bad)}</span>` : x.state !== "ready" ? `<span class="mini"><span class="ai-spin" aria-hidden="true"></span> Reading…</span>` : `<div class="qa-sel">
          <select data-qa-course aria-label="Course for ${nm}">${courseSelectHtml(x.courseId)}</select>
          <select data-qa-kind aria-label="Type for ${nm}">${QADD.KINDS.map(([k, l]) => `<option value="${k}" ${k === x.kind ? "selected" : ""}>${esc(l)}</option>`).join("")}</select></div>
          <span class="mini qa-why${x.conf < 0.5 && !x.edited ? " warn" : ""}">${x.conf < 0.5 && !x.edited ? "Not sure about this one, so check it. " : ""}${esc(x.why)}</span>`}
      </div></li>`;
  }
  function qaDraw(){
    const l = qaEl(); if (!l) return;
    l.innerHTML = QA.items.map(qaRow).join("");
    const n = QA.items.filter(x => x.on && !x.bad && x.state === "ready").length, b = document.getElementById("qaSave");
    if (b) { b.disabled = !n || QA.busy; b.textContent = n ? `Add ${n} File${n === 1 ? "" : "s"}` : "Add Files"; }
    const m = document.getElementById("qaMsg"); if (m) m.innerHTML = QA.busy ? `<span class="ai-spin" aria-hidden="true"></span> ${esc(QA.busy)}` : esc(QA.note);
  }
  const FILE_SCHEMA = {type: "OBJECT", properties: {files: {type: "ARRAY", items: {type: "OBJECT", properties: {
    n: {type: "INTEGER", description: "The file's number from the list"},
    courseId: {type: "STRING", description: "An id from the COURSES list, or an empty string if no course clearly fits"},
    type: {type: "STRING", enum: ["syllabus", "slides", "notes", "assignment", "exam", "reading", "other"]},
    confidence: {type: "NUMBER", description: "0 to 1"}}, required: ["n", "type"]}}}, required: ["files"]};
  // One AI call per ten files
  async function qaAI(){
    const todo = QA.items.filter(x => x.state === "ready" && !x.aiDone && !x.bad);
    if (!todo.length || !aiOn()) return;
    const seq = ++QA.seq, cs = courseList(), ids = new Set(cs.map(c => c.id));
    QA.busy = "Reading your files with AI…"; qaDraw();
    try {
      for (let i = 0; i < todo.length; i += 10) {
        const batch = todo.slice(i, i + 10);
        const text = `COURSES (id | name | code | instructor):\n${cs.map(c => `${c.id} | ${c.name} | ${c.code || "-"} | ${c.instructor || "-"}`).join("\n") || "none yet"}\n\nFILES:\n` +
          batch.map((x, k) => `#${k + 1} name: ${x.file.name}\n${x.text ? `start of its text:\n"""\n${clip(x.text, 1800)}\n"""` : "(no readable text: judge by the name)"}`).join("\n\n");
        const r = await aiCall({task: "classify", fast: true, maxTokens: 2000, temperature: 0.1, schema: FILE_SCHEMA, parts: [{text}],
          system: "You file documents for a student's planner. For each numbered file choose the course it belongs to (an id from the COURSES list, or an empty string when none clearly fits: never invent an id) and its type: syllabus, slides (lecture slides), notes (lecture or study notes), assignment (homework, lab, project, problem set), exam (exam, quiz, practice test), reading (article, chapter, paper) or other. Judge by the content first, then the file name. Give a confidence from 0 to 1."});
        if (seq !== QA.seq || !qaEl()) return;
        ((r.data && r.data.files) || []).forEach(g => {
          const x = batch[Number(g.n) - 1]; if (!x) return;
          x.aiDone = true; if (x.edited) return;
          if (g.courseId && ids.has(g.courseId)) x.courseId = g.courseId;
          if (QADD.KIND_NAME[g.type]) x.kind = g.type;
          x.conf = Math.max(0, Math.min(1, Number(g.confidence))) || 0.6; x.src = "ai";
          const c = state.courses[x.courseId];
          x.why = `Sorted by AI: ${QADD.KIND_NAME[x.kind].toLowerCase()}${c ? " for " + courseLabel(c) : ", no matching course found"}`;
        });
        qaDraw();
      }
      QA.note = "";
    } catch (e) { QA.note = `${aiMsg(e)} Files were sorted by name and keywords instead.`; }
    QA.busy = false; if (seq === QA.seq) qaDraw();
  }
  async function qaAdd(list){
    list = [...list].filter(f => f && f.name && !QA.items.some(x => x.file.name === f.name && x.file.size === f.size));
    if (!list.length) return;
    const fresh = list.map(f => ({id: uid(), file: f, text: "", state: "reading", on: true, courseId: "", kind: "other", conf: 0, why: "", bad: storable(f) ? "" : "Word, PowerPoint and Excel files can't be stored here. Save a PDF copy first."}));
    fresh.forEach(x => { if (x.bad) { x.on = false; x.state = "ready"; } });
    QA.items.push(...fresh); qaDraw();
    const dflt = ui.fCourse && ui.fCourse !== "all" && state.courses[ui.fCourse] ? ui.fCourse : "", cs = courseList();
    for (const x of fresh) {
      if (x.bad) continue;
      x.text = await textOfFile(x.file, 12000);
      const g = QADD.guess(x.file.name, x.text, cs);
      x.courseId = g.courseId || dflt; x.kind = g.kind; x.conf = g.conf; x.why = g.why || (x.text ? "" : "No readable text, so this is a guess from the name"); x.state = "ready";
      if (!qaEl()) return;
      qaDraw();
    }
    const box = document.getElementById("qaAI");
    if (box && box.checked) qaAI();
  }
  function openQuick(files){
    if (!caps.assets) { toast("File storage isn't available here. You can still add links to files."); return; }
    QA.items = []; QA.seq++; QA.busy = false; QA.note = "";
    openSheet(`<form class="sheet qa-sheet">${head("Quick Add Files")}
      <div class="sheet-body">
        <div class="drop" id="qaDrop"><p style="margin:0 0 10px"><strong>Drop files here, or choose them.</strong><br><span class="mini">No need to pick a course or type. Studyboard files each one for you, and you can fix any guess before saving.</span></p>
          <button type="button" class="btn primary" id="qaPick">Choose Files</button><input type="file" id="qaFileIn" multiple class="sr" tabindex="-1" aria-label="Choose files to add"></div>
        ${aiOn() ? `<label class="mi-check ai-toggle"><input type="checkbox" id="qaAI" ${aiTrialing() ? "" : "checked"}> ${AI_ICON}<span><b>Sort with AI</b><span class="mini" style="display:block">Reads the start of each file to find its course and type. Without it, Studyboard goes by file names and keywords.</span></span></label>` : `<p class="mini" style="margin:8px 0 0">Sorting by file names and keywords. Turn on AI in Settings to read inside files for a better guess.</p>`}
        <p class="status-msg" id="qaMsg" aria-live="polite" style="margin:8px 0 0"></p>
        <ul class="qa-list" id="qaList"></ul>
      </div>
      <div class="sheet-foot"><button type="button" class="btn" data-act="close">Cancel</button><span class="spacer"></span><button type="button" class="btn primary" id="qaSave" disabled>Add Files</button></div>
    </form>`);
    const inp = document.getElementById("qaFileIn"), drop = document.getElementById("qaDrop"), list = document.getElementById("qaList");
    document.getElementById("qaPick").addEventListener("click", () => inp.click());
    inp.addEventListener("change", () => { const l = [...(inp.files || [])]; inp.value = ""; qaAdd(l); });
    ["dragover", "dragenter"].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add("over"); }));
    ["dragleave", "drop"].forEach(ev => drop.addEventListener(ev, () => drop.classList.remove("over")));
    drop.addEventListener("drop", e => { e.preventDefault(); qaAdd(e.dataTransfer.files || []); });
    const ai = document.getElementById("qaAI"); if (ai) ai.addEventListener("change", () => { if (ai.checked) { QA.items.forEach(x => { x.aiDone = false; }); qaAI(); } });
    list.addEventListener("change", e => {
      const li = e.target.closest("[data-qa]"), x = li && QA.items.find(i => i.id === li.dataset.qa); if (!x) return;
      if (e.target.matches("[data-qa-on]")) { x.on = e.target.checked; li.classList.toggle("off", !x.on); }
      else {
        if (e.target.matches("[data-qa-course]")) x.courseId = e.target.value;
        if (e.target.matches("[data-qa-kind]")) x.kind = e.target.value;
        x.edited = true; x.conf = 1; x.why = "Set by you";
        const w = li.querySelector(".qa-why"); if (w) { w.classList.remove("warn"); w.textContent = x.why; }
      }
      const n = QA.items.filter(i => i.on && !i.bad && i.state === "ready").length, b = document.getElementById("qaSave");
      b.disabled = !n || !!QA.busy; b.textContent = n ? `Add ${n} File${n === 1 ? "" : "s"}` : "Add Files";
    });
    document.getElementById("qaSave").addEventListener("click", qaSave);
    qaDraw();
    if (files && files.length) qaAdd(files);
  }
  async function qaSave(){
    const picks = QA.items.filter(x => x.on && !x.bad && x.state === "ready"); if (!picks.length) return;
    QA.seq++; dlg.close();
    const groups = new Map();
    picks.forEach(x => {
      const folderId = QADD.folderFor(x.kind, foldersOf(x.courseId).map(f => f.id)), key = [x.courseId, folderId, x.kind].join("|");
      if (!groups.has(key)) groups.set(key, {courseId: x.courseId, folderId, kind: x.kind, files: []});
      groups.get(key).files.push(x.file);
    });
    const all = [];
    await Promise.all([...groups.values()].map(async g => {
      const made = await uploadFiles(g.files, {courseId: g.courseId, folderId: g.folderId, qkind: g.kind, ftype: g.kind});
      if (made && made.length) all.push(...made);
    }));
    if (!all.length) return;
    const where = [...new Set(all.map(f => { const c = courseOf(f.courseId); return c ? courseLabel(c) : "General"; }))];
    toast(`Filed ${all.length} file${all.length === 1 ? "" : "s"} in ${where.length === 1 ? where[0] : where.length + " places"}`, () => { applyChanges(all.map(f => ({kind: "file", id: f.id, after: null})), null); cleanupAssets(all.flatMap(f => f.revs.map(r => r.assetId))); toast("Undone"); });
  }

  /* Learning objectives */
  const OB = {pending: {}, all: {}};
  const objsOf = c => Array.isArray(c && c.objectives) ? c.objectives.filter(o => o && o.id && o.text) : [];
  const mkObj = (text, src) => ({id: uid(), text: clip(text, 240), done: false, src: clip(src, 80), at: Date.now()});
  function saveObjs(cid, list, label){
    const cur = state.courses[cid]; if (!cur) return;
    applyChanges([{kind: "course", id: cid, after: Object.assign(clone(cur), {objectives: list.slice(0, 60)})}], label);
  }
  function materialOf(c){
    const decks = decksArr().filter(d => d.courseId === c.id);
    return {cards: decks.flatMap(d => d.cards.map(x => ({front: x.front, back: x.back, obj: x.obj || ""}))),
      notes: notesArr().filter(n => !n.archived && n.courseId === c.id && String(n.text || "").trim()),
      files: Object.values(state.files).filter(f => f.courseId === c.id).map(f => ({name: f.name, desc: f.desc, summary: f.summary ? [f.summary.overview].concat(f.summary.keyPoints || []).join(" ") : ""}))};
  }
  const OBJ_SCHEMA = {type: "OBJECT", properties: {objectives: {type: "ARRAY", items: {type: "STRING"}, description: "Learning objectives the material itself states, one short sentence each starting with an action verb"}}, required: ["objectives"]};
  // Objectives from files' text
  async function findObjs(items, cName, mode){
    const rules = []; items.forEach(x => QADD.objectives(x.text).forEach(o => rules.push(o)));
    let ai = [];
    if (mode === "ai" ? aiOn() : mode === "auto" ? aiQuiet() : false) {
      try {
        const body = items.map(x => `FILE: ${x.name}\n"""\n${x.text.slice(0, 24000)}\n"""`).join("\n\n").slice(0, 70000);
        const r = await aiCall({task: "topics", auto: mode === "auto", maxTokens: 3000, temperature: 0.2, schema: OBJ_SCHEMA, parts: [{text: `Course: ${cName || "not given"}\n\n${body}`}],
          system: "You pull learning objectives out of a syllabus or lecture slides for a student's planner. Return only objectives the material itself states, such as a section called Learning Objectives or Outcomes, or 'By the end of this lecture you will be able to'. If the material states none, return an empty list: never invent objectives. Rewrite each as one short sentence that starts with an action verb (Explain, Compare, Calculate), under 160 characters, no numbering, using the material's own terms. At most 20."});
        const got = ((r.data && r.data.objectives) || []).map(x => QADD.tidy(x)).filter(x => x.length >= 10);
        const all = items.map(x => x.text).join("\n"), cov = QADD.coverage(got.map((t, i) => ({id: "g" + i, text: t})), {notes: [{text: all}]});
        ai = got.filter((t, i) => (cov["g" + i] || {}).notes > 0);
      } catch (e) { if (mode === "ai") throw e; }
    }
    return QADD.fresh([], ai.concat(rules)).slice(0, 20);
  }
  const wrapEligible = (f, o) => { const k = o && o.qkind; if (k) return k === "syllabus" || k === "slides"; return f.folderId === "syllabus" || /\.pptx?$/i.test(f.name) || /syllab|slides?|lecture|outline/i.test(f.name); };
  // After files are uploaded into a course
  async function offer(made, opts){
    const el = (made || []).filter(f => f.courseId && f.kind === "file" && wrapEligible(f, opts));
    const by = {}; el.forEach(f => { (by[f.courseId] = by[f.courseId] || []).push(f); });
    for (const cid of Object.keys(by)) {
      const c = courseOf(cid); if (!c) continue;
      const items = [];
      for (const f of by[cid]) { let t = ""; try { t = window.SBFILETEXT ? await SBFILETEXT(f.id, 40000) : ""; } catch (e) {} if (t) items.push({name: f.name, text: t}); }
      if (!items.length) continue;
      let cands = []; try { cands = await findObjs(items, c.name, "auto"); } catch (e) {}
      const add = QADD.fresh(objsOf(courseOf(cid)), cands); if (!add.length) continue;
      const src = items.map(x => x.name).join(", ");
      OB.pending[cid] = {list: add, src};
      toast(`Found ${add.length} learning objective${add.length === 1 ? "" : "s"} in ${clip(items[0].name, 40)}${items.length > 1 ? " and more" : ""}`, null, {label: "Review", fn: () => reviewSheet(cid)});
      if (ui.tab === "courses" && ui.courseId === cid) scheduleRender();
    }
  }
  const origUpload = uploadFiles;
  uploadFiles = async function(list, opts){
    const made = await origUpload.apply(this, arguments);
    try { if (made && made.length) setTimeout(() => { offer(made, opts).catch(e => console.warn("objectives", e)); }, 600); } catch (e) {}
    return made;
  };

  function reviewSheet(cid, cands, src){
    const c = courseOf(cid); if (!c) return;
    const P = OB.pending[cid];
    const list = (cands || (P && P.list) || []).slice(), from = src || (P && P.src) || "";
    if (!list.length) { toast("No new learning objectives to review"); return; }
    openSheet(`<form class="sheet">${head("Learning Objectives for " + courseLabel(c))}
      <div class="sheet-body"><p class="mini" style="margin:0 0 8px">${from ? `Found in ${esc(clip(from, 120))}. ` : ""}Untick any that aren't right, and fix the wording if you like. AI can make mistakes; check against the file.</p>
        <ul class="obj-list">${list.map((t, i) => `<li class="obj-ed"><input type="checkbox" data-rv="${i}" checked aria-label="Add this objective"><input type="text" data-rt="${i}" maxlength="240" value="${esc(t)}" aria-label="Objective" data-noenter></li>`).join("")}</ul></div>
      <div class="sheet-foot"><button type="button" class="btn" data-act="close">Not Now</button><span class="spacer"></span><button type="button" class="btn primary" id="rvAdd">Add Objectives</button></div></form>`);
    document.getElementById("rvAdd").addEventListener("click", () => {
      const picked = [...dlg.querySelectorAll("[data-rv]")].filter(i => i.checked).map(i => (dlg.querySelector(`[data-rt="${i.dataset.rv}"]`).value || "").trim()).filter(Boolean);
      const cur = courseOf(cid); if (!cur) return;
      const add = QADD.fresh(objsOf(cur), picked).map(t => mkObj(t, from));
      delete OB.pending[cid]; dlg.close();
      if (add.length) saveObjs(cid, objsOf(cur).concat(add), `Added ${add.length} learning objective${add.length === 1 ? "" : "s"}`); else scheduleRender();
    });
  }
  function editSheet(cid){
    const c = courseOf(cid); if (!c) return;
    const rowH = o => `<li class="obj-ed" data-oid="${esc(o.id)}"><input type="checkbox" data-od ${o.done ? "checked" : ""} aria-label="Mastered" title="Mastered"><input type="text" data-ot maxlength="240" value="${esc(o.text)}" aria-label="Objective" data-noenter><button type="button" class="icon-btn" data-orm aria-label="Remove objective">${CLOSE}</button></li>`;
    openSheet(`<form class="sheet">${head("Learning Objectives: " + courseLabel(c))}
      <div class="sheet-body"><p class="mini" style="margin:0 0 8px">Tick the box when you've mastered an objective. Press Enter in a box to add another.</p>
        <ul class="obj-list" id="oeList">${objsOf(c).map(rowH).join("")}</ul>
        <button type="button" class="btn small" id="oeAdd" style="margin-top:10px">Add Another</button></div>
      <div class="sheet-foot"><button type="button" class="btn" data-act="close">Cancel</button><span class="spacer"></span><button type="button" class="btn primary" id="oeSave">Save</button></div></form>`);
    const ul = document.getElementById("oeList");
    const addRow = () => { const o = {id: "new" + uid(), text: "", done: false}; ul.insertAdjacentHTML("beforeend", rowH(o)); const i = ul.lastElementChild.querySelector("[data-ot]"); i.focus(); };
    document.getElementById("oeAdd").addEventListener("click", addRow);
    ul.addEventListener("click", e => { const b = e.target.closest("[data-orm]"); if (b) b.closest("li").remove(); });
    ul.addEventListener("keydown", e => { if (e.key === "Enter" && e.target.matches("[data-ot]")) { e.preventDefault(); addRow(); } });
    if (!objsOf(c).length) addRow();
    document.getElementById("oeSave").addEventListener("click", () => {
      const cur = courseOf(cid); if (!cur) return;
      const old = new Map(objsOf(cur).map(o => [o.id, o]));
      const out = [...ul.querySelectorAll("li")].map(li => {
        const text = clip(li.querySelector("[data-ot]").value, 240); if (!text) return null;
        const prev = old.get(li.dataset.oid), done = li.querySelector("[data-od]").checked;
        return prev ? Object.assign({}, prev, {text, done}) : Object.assign(mkObj(text, ""), {done});
      }).filter(Boolean);
      dlg.close(); saveObjs(cid, out, "Learning objectives saved");
    });
  }
  async function findInFiles(cid){
    const c = courseOf(cid); if (!c) return;
    const fs = Object.values(state.files).filter(f => f.courseId === cid && (f.kind === "file" || f.kind === "cloud") && /\.(pdf|pptx|docx|txt|md)$/i.test(fileNameOf(f)))
      .sort((a, b) => (wrapEligible(b) - wrapEligible(a)) || ((b.updated || b.created || 0) - (a.updated || a.created || 0))).slice(0, 8);
    if (!fs.length) { toast("Upload a syllabus or lecture slides to this course first"); return; }
    const upd = aiBusySheet("Finding Learning Objectives", `Reading ${fs.length} file${fs.length === 1 ? "" : "s"}…`);
    const items = [];
    for (const f of fs) { let t = ""; try { t = window.SBFILETEXT ? await SBFILETEXT(f.id, 40000) : ""; } catch (e) {} if (t) items.push({name: f.name, text: t}); }
    let cands = [], err = "";
    try { cands = items.length ? await findObjs(items, c.name, aiOn() ? "ai" : "none") : []; } catch (e) { err = aiMsg(e); try { cands = await findObjs(items, c.name, "none"); } catch (e2) {} }
    const add = QADD.fresh(objsOf(courseOf(cid)), cands);
    if (!add.length) { upd(items.length ? `No new learning objectives were found${err ? " (" + err + ")" : ""}. You can add your own.` : "None of these files has text Studyboard can read.", true); return; }
    reviewSheet(cid, add, items.map(x => x.name).join(", "));
  }
  // Flashcards for objectives
  function cardsSheet(cid){
    const c = courseOf(cid); if (!c) return;
    if (!aiOn()) { aiSetupSheet(true); return; }
    const objs = objsOf(c), cov = QADD.coverage(objs, materialOf(c));
    if (!objs.length) { toast("Add some learning objectives first"); return; }
    const fs = Object.values(state.files).filter(f => f.courseId === cid && readableFile(f) && fileKind(f) !== "image").sort((a, b) => (wrapEligible(b) - wrapEligible(a)) || ((b.updated || b.created || 0) - (a.updated || a.created || 0)));
    if (!fs.length) { toast("Upload slides, a syllabus or notes to this course first so the cards come from your material"); return; }
    const pickF = new Set(fs.filter(wrapEligible).concat(fs).slice(0, 3).map(f => f.id));
    openSheet(`<form class="sheet ai-sheet">${head("Flashcards for Objectives")}
      <div class="sheet-body" id="ocBody">
        <fieldset><legend>Objectives</legend><div class="ep-files">${objs.map(o => `<label class="mi-check"><input type="checkbox" data-oc="${esc(o.id)}" ${!(cov[o.id] || {}).cards && !o.done ? "checked" : ""}> <span>${esc(o.text)}</span> ${(cov[o.id] || {}).linked ? `<span class="mini">${cov[o.id].linked} card${cov[o.id].linked === 1 ? "" : "s"} already</span>` : ""}</label>`).join("")}</div></fieldset>
        <fieldset><legend>Make Cards From</legend><div class="ep-files">${fs.map(f => `<label class="mi-check"><input type="checkbox" data-of="${esc(f.id)}" ${pickF.has(f.id) ? "checked" : ""}> ${esc(f.name)} <span class="mini">${esc(fmtSize(fileSizeOf(f)))}</span></label>`).join("")}</div></fieldset>
        <label class="f">Cards for each objective<select id="ocPer"><option>2</option><option selected>3</option><option>5</option></select></label>
        <p class="mini" style="margin:6px 0 0">Cards go in a deck called ${esc(courseLabel(c))} Objectives and are checked against your files. Any that don't match are marked.</p>
        ${aiModelBar()}
        <p class="status-msg" id="ocMsg" aria-live="polite"></p></div>
      <div class="sheet-foot"><button type="button" class="btn" data-act="close">Cancel</button><span class="spacer"></span><button type="button" class="btn primary" id="ocGo">${AI_ICON} Make Cards</button></div></form>`);
    document.getElementById("ocGo").addEventListener("click", async ev => {
      const b = ev.currentTarget, ids = [...dlg.querySelectorAll("[data-oc]:checked")].map(i => i.dataset.oc).slice(0, 12), fids = [...dlg.querySelectorAll("[data-of]:checked")].map(i => i.dataset.of), msg = document.getElementById("ocMsg");
      if (!ids.length) { msg.textContent = "Tick at least one objective (up to 12 at a time)."; return; }
      if (!fids.length) { msg.textContent = "Tick at least one file to make the cards from."; return; }
      const size = fids.reduce((s, id) => s + ((state.files[id] && fileSizeOf(state.files[id])) || 0), 0);
      if (size > AI_LIMIT_BYTES) { msg.textContent = "Those files are too big to send at once. Untick some."; return; }
      b.disabled = true; msg.innerHTML = `<span class="ai-spin" aria-hidden="true"></span> Reading your files…`;
      try {
        const n = await makeCards(cid, ids, fids, Number(document.getElementById("ocPer").value) || 3, s => { msg.innerHTML = `<span class="ai-spin" aria-hidden="true"></span> ${esc(s)}`; });
        if (dlg.open) dlg.close();
        if (!n) toast("No cards came back. Try again, or pick other files.");
      } catch (e) { msg.textContent = (e && e.message) || "Couldn't make cards right now."; b.disabled = false; }
    });
  }
  async function makeCards(cid, ids, fids, per, onStatus){
    const c = courseOf(cid), objs = objsOf(c).filter(o => ids.includes(o.id)).slice(0, 12);
    const sources = []; for (const id of fids) { const f = state.files[id]; if (f) sources.push(await fileSource(f)); }
    const style = `Make flashcards that cover these learning objectives. Write ${per} cards for each one, covering what a student must know to meet it. Start every card's "source" field with its objective code (like "O3" or "O3 · Slides 4-5"). Objectives:\n${objs.map((o, i) => `O${i + 1}. ${o.text}`).join("\n")}`;
    const out = await aiMakeStudySet({sources, style, difficulty: "mixed", cards: true, quiz: false, cases: false, cardCount: objs.length * per, quizCount: 0, courseName: c.name}, onStatus);
    if (!out.cards.length) return 0;
    const name = `${courseLabel(c)} Objectives`;
    let d = decksArr().find(x => x.courseId === cid && x.name === name);
    d = d ? clone(d) : normDeck({id: uid(), created: Date.now(), name, courseId: cid});
    const add = out.cards.map(k => {
      const m = /^\s*O(\d+)\b\s*[·:.\-–—]?\s*/i.exec(k.source || ""), o = m ? objs[Number(m[1]) - 1] : null;
      return {id: uid(), front: k.front, back: k.back, box: 0, due: "", seen: 0, right: 0, wrong: 0, ai: true, src: m ? (k.source || "").slice(m[0].length) : (k.source || ""), obj: o ? o.id : ""};
    });
    d.cards = d.cards.concat(add);
    saveDeck(d, `Added ${add.length} card${add.length === 1 ? "" : "s"} for ${new Set(add.map(x => x.obj).filter(Boolean)).size || objs.length} objective${objs.length === 1 ? "" : "s"}`);
    return add.length;
  }

  // The course page section
  function courseHtml(c){
    const objs = objsOf(c), pend = OB.pending[c.id];
    const hasFiles = Object.values(state.files).some(f => f.courseId === c.id && f.kind === "file");
    const done = objs.filter(o => o.done).length;
    const head = `<h2 class="sec"><span class="t">Learning Objectives</span><span class="n">${objs.length ? done + "/" + objs.length : ""}</span></h2>`;
    const review = pend && pend.list.length ? `<div class="obj-pend"><span>${pend.list.length} suggested from ${esc(clip(pend.src, 60))}</span><button type="button" class="btn small primary" data-act="obj-review" data-c="${esc(c.id)}">Review</button></div>` : "";
    const intro = `<div class="facts" style="display:flex;flex-wrap:wrap;gap:8px;align-items:center"><span class="mini" style="flex:1 1 220px">What you should be able to do by the end of the course. Pulled from a syllabus or lecture slides, then used for flashcards, coverage and exam prep.</span>
      ${hasFiles ? `<button class="btn small ai-btn" data-act="obj-find" data-c="${esc(c.id)}">${AI_ICON} Find in My Files</button>` : ""}<button class="btn small" data-act="obj-edit" data-c="${esc(c.id)}">Add Objectives</button></div>`;
    if (!objs.length) return review ? `${head}${review}${intro}` : `<details class="c2-promo"><summary>Learning Objectives<span class="mini">None yet</span></summary>${intro}</details>`;
    const cov = QADD.coverage(objs, materialOf(c)), gaps = objs.filter(o => !o.done && !(cov[o.id] || {}).cards).length;
    const shown = OB.all[c.id] || objs.length <= 6 ? objs : objs.slice(0, 5);
    const chip = (n, one, many) => n ? `<span class="obj-chip">${n} ${n === 1 ? one : many}</span>` : "";
    const li = o => { const v = cov[o.id] || {}, any = v.cards || v.notes || v.files;
      return `<li class="obj-li${o.done ? " done" : ""}"><label class="mi-check"><input type="checkbox" data-act="obj-done" data-id="${esc(o.id)}" data-c="${esc(c.id)}" ${o.done ? "checked" : ""}><span class="obj-t">${esc(o.text)}</span></label>
        <span class="obj-cov" title="Flashcards, notes and files that cover this objective">${chip(v.cards, "card", "cards")}${chip(v.notes, "note", "notes")}${chip(v.files, "file", "files")}${any || o.done ? "" : `<span class="obj-chip gap">No material yet</span>`}</span></li>`; };
    return `${head}${review}<div class="obj-bar"><span class="track"><i style="width:${Math.round(done / objs.length * 100)}%"></i></span><span class="mini">${done} of ${objs.length} mastered</span></div>
      <ul class="obj-list">${shown.map(li).join("")}</ul>
      ${objs.length > shown.length ? `<button class="link-btn" data-act="obj-more" data-c="${esc(c.id)}">Show All ${objs.length}</button>` : objs.length > 6 ? `<button class="link-btn" data-act="obj-more" data-c="${esc(c.id)}">Show Fewer</button>` : ""}
      <div class="row-actions" style="margin-top:10px">${!inPreview() && gaps ? `<button class="btn small ai-btn" data-act="obj-cards" data-c="${esc(c.id)}">${AI_ICON} Flashcards for ${gaps} Without Cards</button>` : !inPreview() ? `<button class="btn small ai-btn" data-act="obj-cards" data-c="${esc(c.id)}">${AI_ICON} Make Flashcards</button>` : ""}
        <button class="btn small" data-act="obj-edit" data-c="${esc(c.id)}">Edit</button>${hasFiles ? `<button class="btn small ai-btn" data-act="obj-find" data-c="${esc(c.id)}">${AI_ICON} Find in Files</button>` : ""}</div>`;
  }
  // Topic names for the Exam Prep Planner
  const topicNames = cid => { const c = courseOf(cid); return c ? objsOf(c).filter(o => !o.done).map(o => QADD.shortName(o.text)).slice(0, 12) : []; };

  hook("act", (act, el, id) => {
    const cid = el.dataset.c || "";
    switch (act) {
      case "f-quick": uploadOk(() => openQuick()); return true;
      case "obj-done": { const c = courseOf(cid); if (c) saveObjs(cid, objsOf(c).map(o => o.id === id ? Object.assign({}, o, {done: !!el.checked}) : o), ""); return true; }
      case "obj-more": OB.all[cid] = !OB.all[cid]; render(); return true;
      case "obj-edit": editSheet(cid); return true;
      case "obj-find": findInFiles(cid); return true;
      case "obj-cards": cardsSheet(cid); return true;
      case "obj-review": reviewSheet(cid); return true;
    }
    return false;
  });
  window.SBQADD = {open: openQuick, engine: QADD};
  window.__sbQadd = {caps, ui, render, state: () => state, setAssetBytes: f => { assetBytes = f; }};
  window.SBOBJ = {courseHtml, topicNames, objsOf, find: findInFiles, review: reviewSheet, pending: cid => OB.pending[cid] || null};
})();

