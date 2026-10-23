/* ===== module: 97-breakdown.js ===== */
/* Big Assignment Breakdown: one big task becomes 2 to 8 milestones scheduled backward from its due date. The engine below is pure and unit-tested
   (tests/breakdown.test.js); the rest is the review sheet, the task sheet panel, the Suggestions tray item and the offers (all deterministic: AI only words the steps, and only if turned on). */
(() => {
/* BREAKDOWN-START: the Big Assignment Breakdown engine. Pure (no DOM, no app state), so tests/breakdown.test.js can load this block in node.
   Splits one big assignment into 2 to 8 milestones and schedules them BACKWARD from the due date. The dates and the hours always come from this
   deterministic scheduler; an AI only ever supplies the wording and the relative effort of each step (see vetAi), never a date.
   Dates are local "YYYY-MM-DD" strings. Every day step goes through day numbers made from the date parts (UTC maths on the parts), so a DST change,
   a time zone or Feb 29 can never move a milestone by a day.
   Scheduling rules (schedule()):
   - the last milestone lands `buffer` days (0 to 2, default 1) before the due date; the due date itself is only used when there is no other day (forced)
   - nothing before startDate (today unless the student picks later), nothing on a day outside the working days or a fully blocked day (free < 0.25h)
     while another day exists
   - spacing follows effort: each milestone ends at its cumulative share of the window; the window is at most `leadDays` long (a kind's usual lead time)
   - a milestone on a heavy day (load >= 1.0 of that day's study time) moves to a lighter day within 2 days when one exists, never stacked on another milestone
   - too few days for the stages: stages are merged (and listed in `merged`), the plan says "Tight"; hopeless time (a big job in a day or two) says so and gives a sprint plan */
const BREAKDOWN = (() => {
  const dnum = s => { const [y, m, d] = String(s).split("-").map(Number); return Math.round(Date.UTC(y, m - 1, d) / 864e5); };
  const fromDn = n => new Date(n * 864e5).toISOString().slice(0, 10);
  const addD = (s, n) => fromDn(dnum(s) + n);
  const diff = (a, b) => dnum(b) - dnum(a);
  const dow = s => new Date(dnum(s) * 864e5).getUTCDay();
  const isDate = s => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && fromDn(dnum(s)) === s && s >= "1970-01-01" && s <= "2100-12-31";
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const q4 = h => Math.round(h * 4) / 4;
  const cut = (s, n) => { s = String(s == null ? "" : s).replace(/[\u0000-\u001f<>]/g, " ").replace(/\s+/g, " ").trim(); return s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, "").trimEnd() + "…" : s; };
  const lowerFirst = s => s ? s.charAt(0).toLowerCase() + s.slice(1) : s;
  const HEAVY = 1.0, MAX_TEXT = 6000;

  /* ---------- Templates: stage = [title, short name, share of the effort, reading|project, steps, done criteria, options] ---------- */
  const S = (t, m, f, k, steps, done, o) => Object.assign({t, m, f, k, steps, done}, o || {});
  const KINDS = {
    paper: {label: "Research paper or essay", hours: 12, lead: 28, stages: [
      S("Choose a topic and find {src} sources", "Find sources", 0.15, "project", ["Narrow the topic to a question you can argue", "Save a few starting sources"], "A topic and a list of sources"),
      S("Read and take notes on your sources", "Take notes", 0.20, "reading", ["Skim first, then read the best ones closely", "Write down quotes and page numbers"], "Notes for every source"),
      S("Write the outline (thesis + {sec} sections)", "Outline", 0.10, "project", ["Write a one-sentence thesis", "List each section's main point"], "A thesis and an outline"),
      S("Ask your professor or TA about your thesis (optional)", "Ask about the thesis", 0.03, "project", ["Send your thesis and outline", "Note the feedback"], "Feedback in hand", {opt: true}),
      S("Write the first draft", "Draft", 0.28, "project", ["Write the body before the introduction", "Don't edit while drafting"], "A complete rough draft", {split: ["Draft the introduction and first sections", "Draft the remaining sections and conclusion"]}),
      S("Revise the argument and structure", "Revise", 0.15, "project", ["Read it aloud", "Cut anything off-topic"], "A revised draft"),
      S("Proofread, format the citations and submit", "Proofread and submit", 0.10, "project", ["Check the citation style", "Run a spell check and read once more"], "Submitted")]},
    lab: {label: "Lab report", hours: 6, lead: 10, stages: [
      S("Review the procedure and your lab notes", "Review the procedure", 0.10, "reading", ["Reread the procedure", "Note anything that went differently"], "Notes ready"),
      S("Organize your data and run the calculations", "Do the calculations", 0.20, "project", ["Put raw data in a table", "Work through each calculation"], "Results table and calculations"),
      S("Make the graphs, tables and figures", "Make the figures", 0.15, "project", ["Label axes and units", "Add a caption to each figure"], "All figures done"),
      S("Write the methods and results sections", "Write methods and results", 0.25, "project", ["Describe what you did in past tense", "State results before interpreting them"], "Two sections drafted", {split: ["Write the methods section", "Write the results section"]}),
      S("Write the discussion and conclusion", "Discussion", 0.15, "project", ["Explain what the results mean", "Name sources of error"], "Discussion written"),
      S("Proofread and submit the report", "Proofread and submit", 0.15, "project", ["Check units and significant figures", "Check the required format"], "Submitted")]},
    presentation: {label: "Presentation or slides", hours: 8, lead: 14, stages: [
      S("Pick your main message and outline the talk", "Outline the talk", 0.12, "project", ["Write the one thing the audience should remember", "List 3 to 5 main points"], "A talk outline"),
      S("Research and gather your content", "Gather content", 0.22, "reading", ["Collect facts, examples and images", "Note where each came from"], "Content collected"),
      S("Build the slides", "Build the slides", 0.28, "project", ["One idea per slide", "Add sources on the last slide"], "A full slide deck", {split: ["Build the first half of the slides", "Build the second half and the sources slide"]}),
      S("Write your speaker notes", "Write speaker notes", 0.10, "project", ["Write the opening and closing word for word", "Short cues for the rest"], "Notes for every slide"),
      S("Rehearse out loud and time it", "Rehearse", 0.18, "project", ["Run it start to finish", "Trim to the time limit"], "Two timed run-throughs"),
      S("Final run-through and submit the slides", "Final run-through", 0.10, "project", ["Check the file opens on another device", "Submit or upload"], "Ready to present")]},
    group: {label: "Group project", hours: 14, lead: 28, stages: [
      S("Meet the team and split up the work", "Split the work", 0.08, "project", ["Agree who does which part", "Pick one place to share files"], "Roles and a shared folder"),
      S("Research and plan your own part", "Plan your part", 0.20, "reading", ["List what your part needs", "Collect your sources"], "A plan for your part"),
      S("Draft your section", "Draft your part", 0.30, "project", ["Write to the agreed outline", "Send it to the team early"], "Your part drafted", {split: ["Draft the first half of your part", "Finish your part and share it"]}),
      S("Merge everyone's parts into one", "Merge the parts", 0.15, "project", ["Join the sections", "Make the style and format match"], "One combined document"),
      S("Review and polish together", "Review together", 0.15, "project", ["Everyone reads the whole thing", "Fix gaps and repeats"], "A reviewed version"),
      S("Final check and submit", "Submit", 0.12, "project", ["Check the instructions once more", "Submit and confirm it went through"], "Submitted")]},
    programming: {label: "Programming project", hours: 16, lead: 28, stages: [
      S("Read the spec and plan the design", "Plan the design", 0.10, "reading", ["List every requirement", "Sketch the main pieces"], "A short design plan"),
      S("Set up the project and build the core", "Build the core", 0.28, "project", ["Get a first version running", "Commit as you go"], "Core features working", {split: ["Set up the project and the basic structure", "Build the first working version"]}),
      S("Add the remaining features", "Add features", 0.22, "project", ["Do the required ones first", "Then the extras"], "All required features done"),
      S("Test and fix bugs", "Test and fix bugs", 0.20, "project", ["Try odd inputs", "Fix the worst bugs first"], "Tests pass"),
      S("Write the README and clean up the code", "Clean up", 0.12, "project", ["Explain how to run it", "Remove leftover debug code"], "Readable code and a README"),
      S("Final check and submit", "Submit", 0.08, "project", ["Run it from a clean copy", "Submit exactly what is asked"], "Submitted")]},
    case: {label: "Case study", hours: 8, lead: 14, stages: [
      S("Read the case and the questions", "Read the case", 0.18, "reading", ["Read once for the story", "Again, marking key facts"], "Key facts marked"),
      S("Analyze the key issues and the evidence", "Analyze the case", 0.25, "project", ["List the main issues", "Match evidence to each"], "An analysis outline"),
      S("Outline your recommendation", "Outline", 0.10, "project", ["State your answer up front", "List the support for it"], "An outline"),
      S("Write the first draft", "Draft", 0.30, "project", ["Answer each question directly", "Use evidence from the case"], "A full draft", {split: ["Draft the analysis", "Draft the recommendation and conclusion"]}),
      S("Revise and proofread", "Revise and proofread", 0.17, "project", ["Check every claim has support", "Proofread and submit"], "Submitted")]},
    poster: {label: "Poster", hours: 8, lead: 14, stages: [
      S("Plan the content and layout", "Plan the layout", 0.15, "project", ["Sketch the sections", "Decide the key message"], "A layout sketch"),
      S("Make the figures and visuals", "Make the visuals", 0.25, "project", ["Keep them large and readable", "Caption each one"], "All visuals done"),
      S("Write the text for each section", "Write the text", 0.20, "project", ["Short blocks, big fonts", "Cut every extra word"], "All text written"),
      S("Assemble the poster", "Assemble", 0.20, "project", ["Place everything in the layout", "Check the size and resolution"], "A complete poster"),
      S("Get feedback and fix it", "Get feedback", 0.10, "project", ["Show one person", "Fix what confused them"], "A fixed version"),
      S("Print or submit the poster", "Print or submit", 0.10, "project", ["Check print deadlines", "Submit or print a copy"], "Submitted")]},
    portfolio: {label: "Portfolio or reflection", hours: 10, lead: 21, stages: [
      S("Gather your best work and artifacts", "Gather your work", 0.22, "project", ["Pick the pieces that show growth", "Save copies in one folder"], "Artifacts collected"),
      S("Draft your reflections", "Draft reflections", 0.33, "project", ["Say what you did, learned and would change", "Use one example each"], "Reflections drafted", {split: ["Draft the first reflections", "Draft the remaining reflections"]}),
      S("Revise and tie it together", "Revise", 0.25, "project", ["Add the thread that links the pieces", "Cut repeats"], "A revised portfolio"),
      S("Format and submit the portfolio", "Format and submit", 0.20, "project", ["Check the required format", "Submit and confirm"], "Submitted")]},
    takehome: {label: "Take-home exam", hours: 6, lead: 5, stages: [
      S("Review the materials and the questions", "Review the questions", 0.25, "reading", ["Read every question first", "Gather notes and sources"], "A plan per question"),
      S("Draft your answers", "Draft the answers", 0.45, "project", ["Answer the easiest first", "Show your reasoning"], "Every question answered", {split: ["Draft the first answers", "Draft the remaining answers"]}),
      S("Check, edit and cite", "Check and edit", 0.20, "project", ["Reread each question against your answer", "Add citations"], "A checked version"),
      S("Submit it", "Submit", 0.10, "project", ["Check the format and the time limit", "Submit"], "Submitted")]},
    annbib: {label: "Annotated bibliography", hours: 8, lead: 14, stages: [
      S("Find and choose your sources", "Find sources", 0.30, "project", ["Search the library databases", "Pick sources that fit the topic"], "A final source list"),
      S("Read and annotate each source", "Annotate", 0.45, "reading", ["Summarize each in a few sentences", "Add why it is useful"], "Every source annotated", {split: ["Read and annotate the first half of the sources", "Read and annotate the rest"]}),
      S("Format and proofread the bibliography", "Format and proofread", 0.25, "project", ["Check the citation style", "Alphabetize"], "Submitted")]},
    litreview: {label: "Literature review", hours: 14, lead: 28, stages: [
      S("Search for and collect sources", "Collect sources", 0.18, "project", ["Search the databases", "Save the best ones"], "A source list"),
      S("Read and take notes", "Take notes", 0.30, "reading", ["Note each study's question and result", "Note how they relate"], "Notes for every source", {split: ["Read and note the first half", "Read and note the rest"]}),
      S("Group the findings into themes and outline", "Outline", 0.15, "project", ["Group by theme, not by source", "Outline the sections"], "A themed outline"),
      S("Write the first draft", "Draft", 0.25, "project", ["Write one theme at a time", "Link the sources to each other"], "A complete draft", {split: ["Draft the first themes", "Draft the remaining themes and conclusion"]}),
      S("Revise and proofread", "Revise and proofread", 0.12, "project", ["Check the flow between themes", "Proofread and check citations"], "Submitted")]},
    generic: {label: "Project or big assignment", hours: 10, lead: 21, stages: [
      S("Plan the work and gather what you need", "Plan the work", 0.15, "project", ["List what has to be handed in", "Collect the materials"], "A plan"),
      S("Do the first main part", "First main part", 0.30, "project", ["Start with the hardest piece", "Save your progress"], "First part done", {split: ["Start the first main part", "Finish the first main part"]}),
      S("Do the second main part", "Second main part", 0.25, "project", ["Build on the first part", "Keep to the instructions"], "Second part done"),
      S("Review and revise", "Review", 0.18, "project", ["Check against the instructions", "Fix the weakest part"], "A revised version"),
      S("Finish and submit", "Submit", 0.12, "project", ["Final check", "Submit and confirm"], "Submitted")]}
  };
  const ORDER = ["annbib", "litreview", "lab", "presentation", "poster", "group", "case", "portfolio", "takehome", "programming", "paper", "generic"];
  const KIND_RX = {
    annbib: /annotated\s+bibliograph/i, litreview: /literature\s+review|lit\.?\s+review|review of (?:the )?literature/i,
    lab: /\blab(?:oratory)?\s*(?:report|write-?up|notebook)\b|\blab\s*\d+\b|\blab\b/i, presentation: /\b(presentation|slides?|slide\s*deck|powerpoint|keynote|pitch|oral|seminar|talk|present)\b/i,
    poster: /\bposter\b/i, group: /\b(group|team)\s+(project|assignment|paper|report|presentation)\b|\bgroup\b|\bteam\b/i, case: /\bcase\s+(study|analysis)\b|\bcase\b/i,
    portfolio: /\b(e-?portfolio|portfolio|reflection|reflective|journal)\b/i, takehome: /\btake-?\s?home\b|\bopen[- ]book\s+(exam|test)\b/i,
    programming: /\b(programming|coding|software|code|compiler|algorithm|implement(?:ation)?|website|web app|app|api|database|script|program|build a)\b/i,
    paper: /\b(research\s+paper|term\s+paper|essay|paper|thesis|dissertation|report|capstone|argument|write-?up)\b/i
  };
  // The kind from the title (counts triple) and the pasted assignment text; "generic" when nothing fits
  function detectKind(title, text){
    const t = String(title || ""), x = String(text || "").slice(0, MAX_TEXT);
    let best = "generic", bs = 0;
    ORDER.forEach(k => {
      if (k === "generic") return;
      const rx = KIND_RX[k]; let s = 0;
      if (rx.test(t)) s += 3;
      const m = x.match(new RegExp(rx.source, "gi")); if (m) s += Math.min(2, m.length) * (k === "programming" || k === "group" || k === "case" ? 0.6 : 1);
      if (s > bs + 1e-9) { bs = s; best = k; }
    });
    return bs < 1 ? "generic" : best;
  }
  const BIG_RX = /\b(paper|essay|report|project|presentation|lab report|thesis|capstone|portfolio|case study|poster|dissertation|literature review|annotated bibliograph\w*|term paper|research)\b/i;
  const BIG_TYPES = {Project: 1, Assignment: 1, Lab: 1};
  // A task worth offering a breakdown for: a Project or Assignment (a Lab only with a clear cue) of about 3h or more, or one whose title says it is big
  function isBig(t){
    if (!t || t.prepFor || t.breakdownOf || t.status === "done" || t.breakdownParent) return false;
    if (!BIG_TYPES[t.type]) return false;
    const h = Number(t.hours), cue = BIG_RX.test(String(t.title || ""));
    if (t.type === "Lab") return cue;
    return (isFinite(h) && h >= 3) || cue;
  }
  // The number of milestones for this much work
  const nFor = h => h >= 40 ? 8 : h >= 28 ? 7 : h >= 18 ? 6 : h >= 11 ? 5 : h >= 7 ? 4 : h >= 3 ? 3 : 2;
  const DIFFH = {easy: 0.8, med: 1, hard: 1.25};
  function defaultHours(kind, difficulty){ return q4(Math.max(2, (KINDS[kind] || KINDS.generic).hours * (DIFFH[difficulty] || 1))); }
  // Numbers the text itself gives ("5 sources", "4 sections")
  function facts(text){
    const x = String(text || "").slice(0, MAX_TEXT), f = {};
    let m = x.match(/\b(\d{1,2})\s+(?:(?:peer[- ]reviewed|scholarly|academic|primary|secondary|credible|outside|different)\s+)*(?:sources|references|citations|articles)\b/i); if (m) f.sources = Number(m[1]);
    m = x.match(/\b(\d{1,2})\s+(?:main\s+)?(sections|parts|points|arguments)\b/i); if (m) f.sections = Number(m[1]);
    m = x.match(/\b(\d{1,3})\s*(?:-|to)?\s*(?:\d{1,3})?\s*pages?\b/i); if (m) f.pages = Number(m[1]);
    m = x.match(/\b(\d{3,5})\s*(?:-\s*\d{3,5}\s*)?words?\b/i); if (m) f.words = Number(m[1]);
    return f;
  }
  const fill = (s, ctx) => String(s).replace("{src}", String(ctx.src)).replace("{sec}", String(ctx.sec));

  /* ---------- Stage lists: pick, merge or split to exactly n ---------- */
  const namesOf = x => x.names || [x.m || cut(x.t, 30)];
  function joinNames(ns){
    ns = ns.map((x, i) => i ? lowerFirst(x) : x);
    return cut(ns.length === 2 ? `${ns[0]} and ${ns[1]}` : ns.length === 3 ? `${ns[0]}, ${ns[1]} and ${ns[2]}` : `${ns[0]} through ${ns[ns.length - 1]}`, 70);
  }
  function mergeStages(list, n, noteFn){
    list = list.slice();
    while (list.length > n && list.length > 1) {
      let bi = 0, bv = Infinity;
      for (let i = 0; i < list.length - 1; i++) { const v = list[i].h + list[i + 1].h + (list[i].opt || list[i + 1].opt ? -1000 : 0); if (v < bv) { bv = v; bi = i; } }
      const a = list[bi], b = list[bi + 1];
      const nm = a.opt ? namesOf(b) : b.opt ? namesOf(a) : namesOf(a).concat(namesOf(b));
      const m = Object.assign({}, a.opt ? b : a, {t: a.opt ? b.t : b.opt ? a.t : joinNames(nm), names: nm, m: a.opt ? b.m : b.opt ? a.m : joinNames(nm), h: a.h + b.h, steps: (a.opt ? b.steps : b.opt ? a.steps : a.steps.slice(0, 2).concat(b.steps.slice(0, 1))).slice(0, 3), done: b.opt ? a.done : b.done, k: a.h >= b.h ? a.k : b.k, opt: false, split: null,
        ids: (a.ids || [a.id]).concat(b.ids || [b.id]).filter(x => x != null), merged: (a.merged || [a.m || a.t]).concat(b.merged || [b.m || b.t])});
      if (noteFn && !a.opt && !b.opt) noteFn(namesOf(a), namesOf(b));
      list.splice(bi, 2, m);
    }
    return list;
  }
  function stagesFor(kind, n, ctx){
    const K = KINDS[kind] || KINDS.generic;
    let list = K.stages.filter(s => !s.opt || n >= 6).map((s, i) => ({id: i, t: fill(s.t, ctx), m: s.m, h: s.f, k: s.k, steps: s.steps.slice(), done: s.done, opt: !!s.opt, split: s.split ? s.split.map(x => fill(x, ctx)) : null}));
    const tot = list.reduce((s, x) => s + x.h, 0); list.forEach(x => { x.h = x.h / tot; });
    let guard = 0;
    while (list.length < n && guard++ < 12) {          // too few stages: split the biggest stage that can be split
      let bi = -1; list.forEach((x, i) => { if (x.split && (bi < 0 || x.h > list[bi].h)) bi = i; });
      if (bi < 0) break;
      const x = list[bi], a = Object.assign({}, x, {t: x.split[0], h: x.h / 2, split: null, steps: x.steps.slice(0, 2), done: "First half done"}), b = Object.assign({}, x, {t: x.split[1], h: x.h / 2, split: null, steps: x.steps.slice(-2), done: x.done});
      list.splice(bi, 1, a, b);
    }
    return mergeStages(list, n).map(x => { delete x.names; return x; });
  }

  /* ---------- The backward scheduler ---------- */
  // free: {date: study hours that day}, load: {date: share of that day's study time already used (1.0 = full)}, cap: usual study hours a day
  function schedule(stages, o){
    const start = o.start, due = o.due, buffer = clamp(Math.round(Number(o.buffer == null ? 1 : o.buffer)) || 0, 0, 2);
    const wd = Array.isArray(o.days) && o.days.length && o.days.length < 7 ? new Set(o.days.map(Number)) : null;
    const free = o.free || {}, load = Object.assign({}, o.load || {}), cap = o.cap > 0 ? Number(o.cap) : 3;
    const blocked = d => free[d] != null && free[d] < 0.25, okDay = d => (!wd || wd.has(dow(d))) && !blocked(d);
    const total = stages.reduce((s, x) => s + x.h, 0), hrs = Number(o.hours) > 0 ? Number(o.hours) : total, D = diff(start, due);        // whole days from start to due
    const out = {flags: {}, merged: [], notes: []};
    let last, bufferUsed = buffer;
    if (D <= 0) { last = start; out.flags.forced = true; bufferUsed = 0; }
    else if (D <= buffer) { last = addD(due, -1); bufferUsed = D === 1 ? 0 : 1; out.flags.bufferCut = true; }
    else last = addD(due, -buffer);
    if (last < start) last = start;
    const lead = clamp(Math.round(Number(o.leadDays) || (KINDS[o.kind] || KINDS.generic).lead), 3, 120);
    let first = start;
    if (diff(first, last) + 1 > lead) first = addD(last, -(lead - 1));
    const days = (a, b, f) => { const r = []; for (let d = a, i = 0; d <= b && i < 400; d = addD(d, 1), i++) if (f(d)) r.push(d); return r; };
    let list = days(first, last, okDay);
    if (!list.length) { list = days(first, last, d => !blocked(d)); out.flags.relaxedDays = true; }
    if (!list.length) { list = days(first, last, () => true); out.flags.relaxedBlocks = true; }
    if (!list.length) list = [start];
    const A = list.length, avail = days(start, D > 0 ? addD(due, -1) : start, okDay).length || 1;
    const perDay = hrs / Math.max(1, Math.min(avail, A));
    const hopeless = (D <= 1 && hrs >= 6) || (D <= 2 && hrs >= 12) || perDay > 8;
    let n0 = stages.length, items = stages.map(x => Object.assign({}, x));
    let want = items.length;
    if (hopeless) want = Math.min(want, 3);
    want = Math.min(want, A);
    if (o.noMerge) want = items.length;
    if (items.length > want) {
      items = mergeStages(items, want, null);
      out.flags.compressed = true;
      out.merged = items.filter(x => x.names && x.names.length > 1).map(x => x.names.map(q => "“" + q + "”").join(" + "));
    }
    const n = items.length, m = A;
    const strict = !o.noMerge;
    let cum = 0; const idx = [];
    items.forEach((x, i) => {
      cum += x.h / (total || 1);
      let k = Math.round(cum * m) - 1;
      const lo = i === 0 ? 0 : (strict ? idx[i - 1] + 1 : idx[i - 1]), hi = strict ? m - 1 - (n - 1 - i) : m - 1;
      idx.push(clamp(k, Math.min(lo, hi), hi));
    });
    // keep the last one on the last day (the buffer rule) even when rounding left a gap
    idx[n - 1] = m - 1;
    for (let i = n - 2; i >= 0; i--) { const hi = strict ? idx[i + 1] - 1 : idx[i + 1]; if (idx[i] > hi) idx[i] = hi; }
    // heavy days: move within 2 days to a lighter one; never stack on another milestone's day (strict), never reorder
    const score = (d, h) => (load[d] || 0) + (free[d] != null && free[d] < h ? 0.5 : 0);
    const res = [];
    for (let i = 0; i < n; i++) {
      const h = hrs * (items[i].h / (total || 1)), d0 = list[idx[i]]; let best = idx[i], s0 = score(d0, h), bs = s0;
      if (s0 >= HEAVY && !o.noMove) {
        const lo = i === 0 ? 0 : (strict ? idx[i - 1] + 1 : idx[i - 1]), hi = i === n - 1 ? m - 1 : (strict ? idx[i + 1] - 1 : idx[i + 1]);
        [-1, 1, -2, 2].forEach(dl => { const j = idx[i] + dl; if (j < lo || j > hi || j < 0 || j >= m) return; const sc = score(list[j], h); if (sc < bs - 0.25) { bs = sc; best = j; } });
      }
      const d = list[best]; idx[i] = best; load[d] = (load[d] || 0) + hrs * (items[i].h / (total || 1)) / cap;
      res.push({date: d, heavy: bs >= HEAVY, moved: d !== d0, from: d !== d0 ? d0 : "", score: Math.round(bs * 100) / 100});
    }
    out.items = items.map((x, i) => Object.assign(x, {date: res[i].date, heavy: res[i].heavy, moved: res[i].moved, movedFrom: res[i].from}));
    out.days = D; out.avail = A; out.perDay = Math.round(perDay * 10) / 10; out.buffer = bufferUsed; out.hopeless = hopeless; out.first = list[0]; out.last = list[A - 1];
    out.flags.sprint = hopeless;
    out.tight = hopeless || out.flags.compressed || !!out.flags.forced || out.flags.bufferCut === true && D <= 2 || perDay > 4;
    return out;
  }
  const dayWord = n => n === 1 ? "1 day" : n + " days";
  function messages(sch, plan){
    const msgs = [], D = sch.days;
    if (plan.catchup) msgs.push("Catch-up plan: the unfinished steps are spread from today to your due date.");
    if (sch.flags.forced) msgs.push(D < 0 ? "This is already past due. Everything is set for today, so do the first step now." : "This is due today. Everything is set for today.");
    else if (sch.hopeless) msgs.push(`Not enough time for the full plan: about ${plan.hours}h of work with ${dayWord(Math.max(D, 0))} left. This is a sprint plan with fewer, bigger steps.`);
    else if (sch.tight) msgs.push(`Tight: only ${dayWord(Math.max(D, 0))} left${sch.perDay > 4 ? `, about ${sch.perDay}h a day` : ""}.`);
    if (sch.merged.length && !sch.hopeless) msgs.push("Merged " + sch.merged.join(", ") + " to fit the days left.");
    if (sch.flags.bufferCut && !sch.flags.forced) msgs.push("No buffer day before the due date.");
    if (sch.flags.relaxedDays) msgs.push("Your working days left no room, so any day is used.");
    if (sch.flags.relaxedBlocks) msgs.push("Every day looks busy, so these dates may be full days.");
    return msgs;
  }

  /* ---------- Plans ---------- */
  function hoursOf(items, total){          // quarter-hour amounts that add up to the total
    const t = Math.max(0.5, total), sh = items.reduce((s, x) => s + x.h, 0) || 1;
    const hs = items.map(x => Math.max(0.25, q4(x.h / sh * t)));
    let drift = q4(t - hs.reduce((s, x) => s + x, 0)), gi = 0; hs.forEach((x, i) => { if (x > hs[gi]) gi = i; });
    if (drift) hs[gi] = Math.max(0.25, q4(hs[gi] + drift));
    return hs;
  }
  // input: {title, text, type, kind?, due, start, hours?, difficulty, buffer, days, leadDays, free, load, cap, stages?: vetted AI stages}
  function plan(inp){
    inp = inp || {};
    const text = String(inp.text || "").slice(0, MAX_TEXT), start = isDate(inp.start) ? inp.start : null, due = isDate(inp.due) ? inp.due : null;
    if (!start || !due) return {error: "Needs a due date and a start date.", milestones: []};
    const kind = KINDS[inp.kind] ? inp.kind : detectKind(inp.title, text), f = facts(text);
    const hours = q4(Number(inp.hours) > 0 ? Number(inp.hours) : (f.pages && kind === "paper" ? Math.max(4, f.pages * 2.5) : defaultHours(kind, inp.difficulty)));
    const ai = Array.isArray(inp.stages) && inp.stages.length >= 2;
    const ctx = {src: f.sources || clamp(Math.round(hours / 2), 3, 10), sec: f.sections || (hours >= 20 ? 5 : 4)};
    let stages;
    if (ai) { const tw = inp.stages.reduce((s, x) => s + (x.weight > 0 ? x.weight : 1), 0); stages = inp.stages.map((x, i) => ({id: i, t: x.title, m: null, h: (x.weight > 0 ? x.weight : 1) / tw, k: x.kind === "reading" ? "reading" : "project", steps: (x.steps || []).slice(0, 3), done: x.done || "", opt: false, unsupported: x.unsupported || null})); }
    else stages = stagesFor(kind, nFor(hours), ctx);
    const sch = schedule(stages, {start, due, hours, buffer: inp.buffer, days: inp.days, free: inp.free, load: inp.load, cap: inp.cap, leadDays: inp.leadDays, kind});
    const hs = hoursOf(sch.items, hours);
    const ms = sch.items.map((x, i) => ({id: "m" + (i + 1), title: x.t, hours: hs[i], due: x.date, order: i + 1, n: sch.items.length, kind: x.k, steps: x.steps, done: x.done, optional: !!x.opt, heavy: !!x.heavy, moved: !!x.moved, movedFrom: x.movedFrom || "", unsupported: x.unsupported || null}));
    const p = {kind, kindLabel: (KINDS[kind] || KINDS.generic).label, hours, source: ai ? "ai" : "template", due, start, buffer: sch.buffer, milestones: ms, tight: sch.tight, hopeless: sch.hopeless, mode: sch.hopeless ? "sprint" : sch.flags.compressed ? "compressed" : "full", merged: sch.merged, flags: sch.flags, daysLeft: sch.days, perDay: sch.perDay, catchup: !!inp.catchup};
    p.messages = messages(sch, p);
    return p;
  }
  // Re-plan the steps that are not done yet (a new due date, or a catch-up from today). existing: [{id, title, hours, done, steps, kind, optional}] in order.
  function replan(inp){
    inp = inp || {};
    const start = isDate(inp.start) ? inp.start : null, due = isDate(inp.due) ? inp.due : null, ex = Array.isArray(inp.existing) ? inp.existing : [];
    if (!start || !due) return {error: "Needs a due date and a start date.", milestones: []};
    const open = ex.filter(x => !x.done);
    if (!open.length) return {kind: inp.kind || "generic", milestones: [], tight: false, hopeless: false, messages: [], merged: [], flags: {}, catchup: !!inp.catchup, due, start, hours: 0, mode: "full"};
    const hours = open.reduce((s, x) => s + Math.max(0.25, Number(x.hours) || 0.25), 0);
    const stages = open.map((x, i) => ({id: x.id, t: x.title, m: null, h: Math.max(0.25, Number(x.hours) || 0.25) / hours, k: x.kind === "reading" ? "reading" : "project", steps: x.steps || [], done: x.doneWhen || "", opt: false}));
    const sch = schedule(stages, {start, due, hours, buffer: inp.buffer, days: inp.days, free: inp.free, load: inp.load, cap: inp.cap, leadDays: inp.leadDays, kind: inp.kind, noMerge: true});
    const ms = sch.items.map((x, i) => ({id: x.id, title: x.t, hours: q4(Math.max(0.25, Number(open[i].hours) || 0.25)), due: x.date, order: i + 1, n: sch.items.length, kind: x.k, steps: x.steps, done: x.done, optional: !!open[i].optional, heavy: !!x.heavy, moved: !!x.moved, movedFrom: x.movedFrom || ""}));
    const p = {kind: inp.kind || "generic", hours: q4(hours), source: "replan", due, start, buffer: sch.buffer, milestones: ms, tight: sch.tight, hopeless: sch.hopeless, mode: sch.hopeless ? "sprint" : "full", merged: [], flags: sch.flags, daysLeft: sch.days, perDay: sch.perDay, catchup: !!inp.catchup};
    p.messages = messages(sch, p);
    return p;
  }
  // The lightest allowed day for one milestone within `range` days of where it is, between its neighbours
  function lighterDay(o){
    const free = o.free || {}, load = o.load || {}, wd = Array.isArray(o.days) && o.days.length < 7 ? new Set(o.days.map(Number)) : null, range = o.range || 3;
    const score = d => (load[d] || 0) + (free[d] != null && free[d] < (o.hours || 1) ? 0.5 : 0) + (free[d] != null && free[d] < 0.25 ? 5 : 0);
    let best = null, bs = score(o.date);
    for (let k = 1; k <= range; k++) [-k, k].forEach(dl => {
      const d = addD(o.date, dl);
      if (d < o.lo || d > o.hi || (wd && !wd.has(dow(d)))) return;
      if (score(d) < bs - 0.2) { bs = score(d); best = d; }
    });
    return best;
  }
  // Change milestone i to a new date; with shiftRest the later ones move by the same number of days (kept before the due date and in order)
  function shiftRest(ms, i, date, o){
    o = o || {}; const delta = diff(ms[i].due, date), out = ms.map(x => Object.assign({}, x));
    out[i].due = date;
    if (o.shiftRest) for (let j = i + 1; j < out.length; j++) {
      let d = addD(out[j].due, delta);
      const lim = o.due ? (diff(o.today || date, o.due) > 0 ? addD(o.due, -1) : o.due) : null;
      if (lim && d > lim) d = lim;
      if (d < out[j - 1].due) d = out[j - 1].due;
      out[j].due = d;
    }
    return out;
  }

  /* ---------- Checking what an AI sent back (it only writes the steps; dates and hours stay ours) ---------- */
  const GENERIC_RX = /^(?:do|finish|complete|start|continue|begin|work on|work|get)\b(?: (?:the|your|this|an?|all|some))?(?: (?:work|assignment|task|project|homework|stuff|things?|it|rest|first part|second part|part \d))?(?: now| early| well)?$|\b(?:stay organi[sz]ed|manage your time|time management|stay on (?:track|top)|keep (?:going|up)|do your best|work hard|be consistent|stay focused|get started|start early|make a plan|plan ahead|good luck|misc(?:ellaneous)?|and so on|etc\.?)\b|^(?:other|misc|stuff|tbd|todo|final steps?|next steps?|more work|the work)$/i;
  const NUMW = {one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, twelve: 12, fifteen: 15, twenty: 20};
  const COUNT_RX = /\b(\d{1,4}|one|two|three|four|five|six|seven|eight|nine|ten|twelve|fifteen|twenty)(?:\s*-\s*\d{1,4})?\s+((?:peer[- ]reviewed|scholarly|academic|primary|secondary|credible|outside|different)\s+)?(sources?|references?|citations?|articles?|pages?|words?|sections?|slides?|paragraphs?|figures?|questions?|interviews?|drafts?|minutes?|examples?|quotes?|arguments?|points?)\b/gi;
  const REQ_RX = /\b(required|requires|must include|mandatory|rubric requires|as specified|per the instructions)\b/i;
  const toks = s => String(s).toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter(w => w.length > 2);
  const same = (a, b) => { const x = new Set(toks(a)), y = new Set(toks(b)); if (!x.size || !y.size) return false; let c = 0; x.forEach(w => { if (y.has(w)) c++; }); return c / Math.max(x.size, y.size) >= 0.8; };
  const numOf = w => /^\d/.test(w) ? Number(w) : NUMW[String(w).toLowerCase()];
  const stem = w => String(w).toLowerCase().replace(/s$/, "");
  // A specific count ("6 sources") the text never states is an invented requirement: the number is taken out and the step is marked
  function stripInvented(str, text, found){
    const t = String(text || "").toLowerCase();
    return str.replace(COUNT_RX, (all, num, adj, noun) => {
      const n = numOf(num), ok = t && new RegExp("\\b(?:" + n + (Object.keys(NUMW).find(k => NUMW[k] === n) ? "|" + Object.keys(NUMW).find(k => NUMW[k] === n) : "") + ")(?:\\s*-\\s*\\d+)?[\\s-]+(?:[a-z-]+\\s+){0,2}" + stem(noun) + "s?\\b").test(t);
      if (ok) return all;
      found.push(all.trim());
      return (adj || "") + noun;
    });
  }
  // raw: the model's JSON (string or object). opts: {text, kind, hours, repair(fn: string -> object|null)}.
  // Returns {ok, kind, stages:[{title, steps, done, weight, kind, unsupported}], issues, fixes}. ok is false when it can't be used (the caller falls back to the template).
  function vetAi(raw, opts){
    opts = opts || {}; const issues = [], fixes = [], text = String(opts.text || "");
    let d = raw;
    if (typeof raw === "string") {
      try { d = JSON.parse(raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "")); }
      catch (e) { d = typeof opts.repair === "function" ? opts.repair(raw) : null; if (d) fixes.push("repaired JSON"); }
    }
    if (!d || typeof d !== "object") return {ok: false, reason: "not-json", issues: ["not JSON"], fixes, stages: []};
    if (Array.isArray(d)) d = {stages: d};
    const arr = Array.isArray(d.stages) ? d.stages : Array.isArray(d.milestones) ? d.milestones : null;
    if (!arr) return {ok: false, reason: "no-stages", issues: ["no stages"], fixes, stages: []};
    let kind = KINDS[d.kind] ? d.kind : (opts.kind && KINDS[opts.kind] ? opts.kind : detectKind(opts.title, text));
    if (d.kind && !KINDS[d.kind]) fixes.push("unknown kind");
    const target = nFor(Number(opts.hours) > 0 ? Number(opts.hours) : defaultHours(kind));
    const lo = Math.max(2, target - 2), hi = Math.min(8, target + 2);
    if (arr.length < lo || arr.length > hi) return {ok: false, reason: "count", issues: [`${arr.length} stages (wanted ${lo} to ${hi})`], fixes, stages: []};
    const out = [];
    arr.forEach((s, i) => {
      if (!s || typeof s !== "object") { issues.push("stage " + (i + 1) + " not an object"); return; }
      if (s.date || s.due || s.dueDate || s.deadline) fixes.push("ignored dates");        // the AI never picks dates
      let title = cut(s.title || s.name || "", 200).replace(/^\s*(?:step|stage|milestone)\s*\d+\s*[:.\-)]\s*/i, "").replace(/^\d+\s*[.):-]\s*/, "");
      if (title.length > 70) { issues.push("long title: " + cut(title, 30)); return; }
      if (title.length < 8 || title.split(" ").length < 2) { issues.push("title too short: " + title); return; }
      if (GENERIC_RX.test(title)) { issues.push("generic: " + title); return; }
      if (out.some(o => same(o.title, title))) { issues.push("duplicate: " + title); return; }
      const found = [];
      title = stripInvented(title, text, found);
      let steps = (Array.isArray(s.steps) ? s.steps : []).map(x => cut(x, 90)).filter(x => x.length >= 4 && !GENERIC_RX.test(x));
      steps = steps.slice(0, 3).map(x => stripInvented(x, text, found));
      const before = steps.length; steps = steps.filter(x => !REQ_RX.test(x) || REQ_RX.test(text)); if (steps.length < before) found.push("a requirement not in your text");
      let w = Number(s.weight); if (!(w > 0) || !isFinite(w)) w = NaN;
      out.push({title, steps, done: cut(s.done || s.doneWhen || s.criteria || "", 100), weight: w, kind: s.kind === "reading" ? "reading" : "project", unsupported: found.length ? found : null});
    });
    if (out.length < lo) return {ok: false, reason: "too-few-valid", issues, fixes, stages: []};
    // weights: missing ones get the average, a percent-style total is fine, absurd spreads are limited, then everything sums to 1
    const known = out.filter(x => x.weight > 0), avg = known.length ? known.reduce((s, x) => s + x.weight, 0) / known.length : 1;
    if (known.length < out.length) fixes.push(known.length ? "filled missing weights" : "equal weights");
    const rawSum = known.reduce((s, x) => s + x.weight, 0);
    if (known.length && Math.abs(rawSum - 1) > 0.05 && Math.abs(rawSum - 100) > 5) fixes.push("renormalized weights");
    let ws = out.map(x => x.weight > 0 ? x.weight : avg), sum = ws.reduce((s, x) => s + x, 0);
    ws = ws.map(x => x / sum);
    let clamped = ws.slice();
    for (let k = 0; k < 6; k++) { clamped = clamped.map(x => clamp(x, 0.05, 0.45)); sum = clamped.reduce((s, x) => s + x, 0); clamped = clamped.map(x => x / sum); }
    if (clamped.some((x, i) => Math.abs(x - ws[i]) > 0.002)) fixes.push("limited extreme weights");
    out.forEach((x, i) => { x.weight = Math.round(clamped[i] * 1000) / 1000; });
    return {ok: true, kind, stages: out, issues, fixes, dropped: arr.length - out.length};
  }

  /* ---------- Small readers for the drop-in sheet ---------- */
  const MONTHS = {jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12};
  const WD = {sun: 0, mon: 1, tue: 2, tues: 2, wed: 3, thu: 4, thur: 4, thurs: 4, fri: 5, sat: 6};
  const mkDate = (y, m, d) => { const s = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`; return isDate(s) ? s : ""; };
  // "Due Oct 10", "due: 10/14/2026", "due Friday at 11:59 PM" -> {date, time}; null when there is no "due" word near a date
  function parseDue(text, today){
    const x = String(text || "").slice(0, MAX_TEXT), ty = Number(today.slice(0, 4)); let date = "", time = "";
    const near = x.match(/\b(?:due|deadline|submit(?:ted)?|hand(?:ed)? in|turn(?:ed)? in)\b[^\n]{0,60}/i); if (!near) return null;
    const seg = near[0];
    let m = seg.match(/\b(20\d\d)-(\d{1,2})-(\d{1,2})\b/); if (m) date = mkDate(m[1], Number(m[2]), Number(m[3]));
    if (!date && (m = seg.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/))) { let y = m[3] ? Number(m[3]) : ty; if (y < 100) y += 2000; date = mkDate(y, Number(m[1]), Number(m[2])); if (date && !m[3] && date < addD(today, -30)) date = mkDate(y + 1, Number(m[1]), Number(m[2])); }
    if (!date && (m = seg.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sept?|oct|nov|dec)[a-z]*\.?\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s+(20\d\d))?\b/i))) { const y = m[3] ? Number(m[3]) : ty; date = mkDate(y, MONTHS[m[1].toLowerCase()], Number(m[2])); if (date && !m[3] && date < addD(today, -30)) date = mkDate(y + 1, MONTHS[m[1].toLowerCase()], Number(m[2])); }
    if (!date && (m = seg.match(/\b(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+)?(jan|feb|mar|apr|may|jun|jul|aug|sept?|oct|nov|dec)[a-z]*\b(?:,?\s+(20\d\d))?/i))) { const y = m[3] ? Number(m[3]) : ty; date = mkDate(y, MONTHS[m[2].toLowerCase()], Number(m[1])); if (date && !m[3] && date < addD(today, -30)) date = mkDate(y + 1, MONTHS[m[2].toLowerCase()], Number(m[1])); }
    if (!date && (m = seg.match(/\b(sun|mon|tue|tues|wed|thu|thur|thurs|fri|sat)[a-z]*\b/i))) { const w = WD[m[1].toLowerCase()]; let k = (w - dow(today) + 7) % 7; if (k === 0) k = 7; date = addD(today, k); }
    if (!date) return null;
    if ((m = seg.match(/\b(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)\b/i))) { let h = Number(m[1]) % 12; if (/^p/i.test(m[3])) h += 12; time = String(h).padStart(2, "0") + ":" + (m[2] || "00"); }
    else if ((m = seg.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/))) time = String(m[1]).padStart(2, "0") + ":" + m[2];
    return {date, time};
  }
  // A title from pasted prompt text: the first short line, with a leading "Assignment 3:" label kept
  function guessTitle(text){
    const lines = String(text || "").split(/\r?\n/).map(l => l.replace(/^[#*\s>-]+/, "").trim()).filter(Boolean);
    const l = lines.find(x => x.length >= 4 && x.length <= 110 && !/^(due|deadline|name|date|course|instructor)\b/i.test(x));
    return l ? cut(l.replace(/[.:]+$/, ""), 120) : "";
  }

  /* ---------- Milestones that exist as tasks ---------- */
  const kidsOf = (parentId, tasks) => tasks.filter(t => t.breakdownOf === parentId).sort((a, b) => (a.due < b.due ? -1 : a.due > b.due ? 1 : (parseInt(a.step, 10) || 0) - (parseInt(b.step, 10) || 0)));
  function progressOf(kids){
    const total = kids.length, done = kids.filter(k => k.status === "done").length;
    return {total, done, frac: total ? done / total : 0, text: total ? `${done} of ${total} milestone${total === 1 ? "" : "s"} done` : "", all: total > 0 && done === total};
  }
  // The parent's due date moved since the plan was made, and some milestones are still open
  const needsReplan = (parent, kids) => !!(parent && parent.breakdownParent && isDate(parent.due) && parent.bdDue && parent.bdDue !== parent.due && kids.some(k => k.status !== "done"));
  const overdueKids = (kids, today) => kids.filter(k => k.status !== "done" && isDate(k.due) && k.due < today);

  return {KINDS, ORDER, detectKind, isBig, nFor, defaultHours, facts, stagesFor, schedule, plan, replan, lighterDay, shiftRest, vetAi, parseDue, guessTitle, kidsOf, progressOf, needsReplan, overdueKids, dnum, fromDn, addD, diff, dow, isDate, GENERIC_RX, HEAVY};
})();
/* BREAKDOWN-END */


const BD = BREAKDOWN;
const BDLS = "studyboard:bd";
const bdMem = () => { try { const o = JSON.parse(localStorage.getItem(BDLS) || "null"); return o && typeof o === "object" ? o : {}; } catch (e) { return {}; } };
const bdMemSet = o => { try { localStorage.setItem(BDLS, JSON.stringify(o)); } catch (e) {} };
const prefs = () => Object.assign({buffer: 1, weekdays: false}, (state.settings && state.settings.bd) || {});
const kidsOfTask = id => BD.kidsOf(id, allTasks());
const stepNo = k => parseInt(String(k.step || "0"), 10) || 0;
const kindType = k => k === "lab" ? "Lab" : ["programming", "presentation", "group", "poster", "portfolio"].includes(k) ? "Project" : "Assignment";
const hm = h => { const m = Math.round(h * 4) * 15, hh = Math.floor(m / 60), mm = m % 60; return hh && mm ? `${hh}h ${mm}m` : hh ? `${hh}h` : `${mm}m`; };
const lvOf = r => r >= 1.4 ? 4 : r >= 1 ? 3 : r >= 0.7 ? 2 : r >= 0.4 ? 1 : 0;
const LVN = ["calm", "steady", "busy", "heavy", "crunch"];

/* ---------- The days around the plan: load (from the Crunch model, without this assignment) and free study hours ---------- */
function ctxFor(excludeIds, from, to){
  const today = todayISO(), load = {}, free = {}, cap = dailyHours() || 3;
  if (to < from) to = from;
  try {
    const sc = window.SBCRUNCH, inp = sc.input(), ex = new Set(excludeIds || []);
    const m = sc.build(Object.assign({}, inp, {tasks: inp.tasks.filter(t => !ex.has(t.id))}));
    (m.days || []).forEach(d => { if (!d.past) load[d.date] = d.ratio; });
  } catch (e) { console.warn("breakdown load", e); }
  try {
    const keep = BUSY_CACHE; let B = {m: {}};
    try { B = busyDays(today, to); } finally { BUSY_CACHE = keep; }
    let AD = null; if (availActive()) AD = availDays(from, to);
    const dh = dailyHours();
    for (let d = from, i = 0; d <= to && i < 400; d = addDays(d, 1), i++) {
      const a = dh > 0 ? dh * busyFactor(B.m[d] || 0) : Infinity, b = AD && AD[d] != null ? AD[d] : Infinity, v = Math.min(a, b);
      if (isFinite(v)) free[d] = v;
    }
  } catch (e) { console.warn("breakdown free", e); }
  return {load, free, cap};
}

/* ---------- Turning a plan into tasks ---------- */
function milestoneTask(parent, m, i, n, order, id){
  const notes = (m.done ? `Done when: ${m.done}\n` : "") + `Part of “${parent.title}”.`;
  return newTask({id: id || uid(), title: String(m.title).slice(0, 120), type: m.kind === "reading" ? "Reading" : "Project", courseId: parent.courseId || "", start: m.due, due: m.due, hours: m.hours,
    priority: parent.priority || "med", difficulty: parent.difficulty || "med", link: parent.link || "", order, breakdownOf: parent.id, step: `${i + 1}/${n}`,
    checklist: (m.steps || []).slice(0, 3).map(x => ({id: uid(), text: String(x).slice(0, 120), done: false})), notes});
}
const markParent = (parent, total, kind) => Object.assign(clone(parent), {breakdownParent: true, bdDue: parent.due, bdKind: kind || "", bdHours: Math.round(total * 4) / 4});
// Used by the syllabus review: a new parent task and its template milestones, offline and instant
function expandNew(task){
  try {
    const today = todayISO(); if (!task || !task.due || task.due <= today) return null;
    const ctx = ctxFor([], today, task.due), p = BD.plan({title: task.title, text: task.notes || "", due: task.due, start: today, hours: Number(task.hours) > 0 ? Number(task.hours) : undefined, difficulty: task.difficulty, buffer: prefs().buffer, days: prefs().weekdays ? [1, 2, 3, 4, 5] : null, free: ctx.free, load: ctx.load, cap: ctx.cap});
    if (!p.milestones.length) return null;
    let order = nextOrder("todo") + 5000;
    const kids = p.milestones.map((m, i) => milestoneTask(task, m, i, p.milestones.length, order += 10));
    return {parent: markParent(task, p.hours, p.kind), kids};
  } catch (e) { console.warn("breakdown expand", e); return null; }
}

/* ---------- AI wording (never dates): strict JSON, checked by BREAKDOWN.vetAi, template when anything is off ---------- */
const BD_SCHEMA = {type: "OBJECT", properties: {kind: {type: "STRING", enum: BD.ORDER}, stages: {type: "ARRAY", items: {type: "OBJECT", properties: {
  title: {type: "STRING", description: "Specific verb phrase under 60 characters"}, steps: {type: "ARRAY", items: {type: "STRING"}}, done: {type: "STRING", description: "How the student knows this step is finished"},
  weight: {type: "NUMBER", description: "Relative share of the total effort"}, kind: {type: "STRING", enum: ["reading", "project"]}}, required: ["title", "weight"]}}}, required: ["kind", "stages"]};
async function aiStages(S, onStatus){
  const text = String(S.text || "").slice(0, 6000), hours = S.hoursEff, n = BD.nFor(hours), c = courseOf(S.courseId);
  const system = `You split ONE big college assignment into ordered milestones for a student planner. Return JSON only.
Rules:
- Use ${n} milestones (never fewer than ${Math.max(2, n - 1)} or more than ${Math.min(8, n + 1)}), in the order a student should do them.
- Each title is a specific verb phrase under 60 characters that fits THIS assignment (its sections, deliverables, tools, sources). No filler like "do the work", "stay organized" or "finish up".
- steps: 1 to 3 short bullets per milestone. done: one short line saying how the student knows it is finished.
- weight: the relative share of the total effort for each milestone (any positive numbers).
- NEVER output dates or deadlines. The app picks them.
- Do not invent requirements. Only mention a number of sources, pages, sections or slides if the assignment text states it.
- kind: one of ${BD.ORDER.join(", ")}.
Return JSON only.`;
  const prompt = `Assignment title: ${S.title}\nCourse: ${c ? c.name : "not given"}\nType: ${S.type}\nEstimated total effort: ${hours} hours\nLikely kind: ${S.kind || "unknown"}\n\nAssignment text:\n"""\n${text || "(no text was given, only the title)"}\n"""`;
  return await aiRetry(async () => {
    const r = await aiCall({task: "breakdown", maxTokens: 4000, temperature: 0.3, onStatus, schema: BD_SCHEMA, system, parts: [{text: prompt}]});
    const v = BD.vetAi(r.data, {text, title: S.title, kind: S.kind, hours});
    if (!v.ok) { const e = new Error("The AI's plan wasn't usable, so the simple template is used."); e.code = "bad"; e.vet = v; throw e; }
    return v;
  });
}
const aiOkNow = () => { try { return aiReady() && !aiTrialing() && aiConsented(aiCfg().provider); } catch (e) { return false; } };

/* ---------- The review sheet ---------- */
let CUR = null;
function stripHtml(S){
  const ms = S.ms.filter(m => !m.locked), start = S.start, due = S.due;
  let from = start; if (BD.diff(from, due) > 59) from = BD.addD(due, -59);
  const cells = [], by = {}; ms.forEach((m, i) => { (by[m.due] = by[m.due] || []).push(i + 1); });
  const nDays = BD.diff(from, due) + 1;
  for (let d = from, k = 0; d <= due && k < 90; d = BD.addD(d, 1), k++) {
    const mine = ms.filter(m => m.due === d).reduce((s, m) => s + (Number(m.hours) || 0), 0) / (S.ctx.cap || 3);
    const lv = lvOf((S.ctx.load[d] || 0) + mine), isDue = d === due, nums = by[d] || [];
    cells.push(`<span class="bd-c lv${lv}${nums.length ? " has" : ""}${isDue ? " due" : ""}" title="${esc(fmtDate(d))}: ${LVN[lv]}${nums.length ? ", milestone " + nums.join(", ") : ""}${isDue ? ", due" : ""}">${nums.length && nDays <= 24 ? `<b>${nums[0]}</b>` : isDue && nDays <= 24 ? `<b>!</b>` : ""}</span>`);
  }
  const sum = ms.map((m, i) => `${i + 1}: ${fmtShort(m.due)}`).join(", ");
  return `<div class="bd-strip" role="img" aria-label="Timeline from ${esc(fmtShort(from))} to ${esc(fmtShort(due))}, due date last. Milestone dates, ${esc(sum)}. Darker days are busier.">${cells.join("")}</div>
    <div class="bd-strip-l mini" aria-hidden="true"><span>${esc(fmtShort(from))}</span><span>Darker days are busier. Numbers are milestones; the last cell is the due date.</span><span>${esc(fmtShort(due))}</span></div>`;
}
function flagHeavy(S){
  const per = {}; S.ms.forEach(m => { if (!m.locked) per[m.due] = (per[m.due] || 0) + (Number(m.hours) || 0); });
  S.ms.forEach(m => { if (m.locked) return; const sc = (S.ctx.load[m.due] || 0) + (per[m.due] || 0) / (S.ctx.cap || 3); m.heavy = sc >= BD.HEAVY; m.level = lvOf(sc); });
}
function draw(){
  const S = CUR; if (!S) return;
  const root = dlg.querySelector(".bd-sheet"); if (!root) return;
  flagHeavy(S);
  const open = S.ms.filter(m => !m.locked), tot = open.reduce((s, m) => s + (Number(m.hours) || 0), 0);
  const today = todayISO();
  const list = $("#bdList");
  list.innerHTML = S.ms.map((m, i) => {
    if (m.locked) return `<li class="bd-m is-done"><span class="bd-n" aria-hidden="true">${CHECK}</span><div class="bd-f"><span class="bd-t">${esc(m.title)}</span><span class="mini">Done · ${esc(fmtShort(m.due))} · ${esc(hm(m.hours))}</span></div></li>`;
    const k = open.indexOf(m);
    const warn = m.heavy ? `<p class="bd-w" role="status"><span>${m.level >= 4 ? "Crunch day" : "Heavy day"}: ${esc(fmtShort(m.due))} already looks full.</span> <button type="button" class="btn small" data-a="lighter" data-i="${i}">Move to Lighter Day</button></p>` : "";
    const past = m.due < today && !S.allowPast ? `<p class="bd-w" role="status">This date is in the past.</p>` : m.due > S.due ? `<p class="bd-w" role="status">This is after the due date.</p>` : "";
    const uns = m.unsupported && m.unsupported.length ? `<p class="mini bd-u">The AI's wording mentioned ${esc(m.unsupported.slice(0, 2).join(", "))}, which isn't in your text, so it was left out.</p>` : "";
    return `<li class="bd-m" data-i="${i}"><span class="bd-n">${k + 1}</span><div class="bd-f">
      <input type="text" data-f="title" value="${esc(m.title)}" maxlength="120" aria-label="Milestone ${k + 1} title" data-noenter>
      <div class="bd-sub"><label class="bd-l">Date<input type="date" data-f="due" value="${esc(m.due)}" aria-label="Milestone ${k + 1} date"></label>
        <label class="bd-l">Hours<input type="number" data-f="hours" min="0.25" max="60" step="0.25" inputmode="decimal" value="${esc(m.hours)}" aria-label="Milestone ${k + 1} hours" data-noenter></label>
        <span class="bd-btns"><button type="button" class="icon-btn" data-a="up" data-i="${i}" aria-label="Move milestone ${k + 1} up" ${k === 0 ? "disabled" : ""}>↑</button><button type="button" class="icon-btn" data-a="down" data-i="${i}" aria-label="Move milestone ${k + 1} down" ${k === open.length - 1 ? "disabled" : ""}>↓</button><button type="button" class="icon-btn" data-a="rm" data-i="${i}" aria-label="Remove milestone ${k + 1}">${CLOSE}</button></span></div>
      ${m.steps && m.steps.length ? `<ul class="bd-steps">${m.steps.map(x => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}${m.optional ? `<p class="mini">Optional step.</p>` : ""}${uns}${warn}${past}</div></li>`;
  }).join("");
  $("#bdStrip").innerHTML = open.length ? stripHtml(S) : "";
  const p = S.plan || {}, msgs = (p.messages || []).slice();
  const dueDays = BD.diff(today, S.due);
  $("#bdBanner").innerHTML = (p.tight ? `<div class="bd-ban warn" role="status"><b>${p.hopeless ? "Not enough time" : "Tight timeline"}</b><span>${msgs.map(esc).join(" ")}</span></div>` : msgs.length ? `<div class="bd-ban" role="status"><span>${msgs.map(esc).join(" ")}</span></div>` : "")
    + (p.source === "ai" ? `<div class="bd-ban ai" role="status">${AI_ICON}<span>Steps worded by ${esc(aiWho("AI"))} from your text. The dates and hours come from your calendar.</span></div>` : "");
  const est = S.hoursEff;
  $("#bdTotal").innerHTML = S.mode === "replan" ? `${open.length} open milestone${open.length === 1 ? "" : "s"}, ${esc(hm(tot))} of work left.` : `Milestones add up to <b>${esc(hm(tot))}</b>${Math.abs(tot - est) > Math.max(0.5, est * 0.1) ? ` (your estimate is ${esc(hm(est))})` : ""}.`;
  $("#bdTotal").className = "mini bd-total" + (Math.abs(tot - est) > Math.max(1, est * 0.25) && S.mode !== "replan" ? " warn" : "");
  const go = $("#bdGo"), n = open.length;
  go.textContent = S.mode === "replan" ? `Update ${n} milestone${n === 1 ? "" : "s"}` : `Create ${n} milestone${n === 1 ? "" : "s"}`;
  go.disabled = !n;
  const t = $("#bdTight"); if (t) t.hidden = true;
}
function rebuild(opts){
  const S = CUR; opts = opts || {};
  S.hoursEff = Number(S.hours) > 0 ? Number(S.hours) : BD.defaultHours(S.kind || BD.detectKind(S.title, S.text), S.difficulty);
  const exclude = [S.id].filter(Boolean).concat(S.kids.map(k => k.id));
  S.ctx = ctxFor(exclude, S.start, S.due);
  let p;
  if (S.mode === "replan") {
    const existing = S.kids.map(k => ({id: k.id, title: k.title, hours: k.hours, done: k.status === "done", steps: (k.checklist || []).map(x => x.text), kind: k.type === "Reading" ? "reading" : "project"}));
    p = BD.replan({due: S.due, start: S.start, existing, buffer: S.buffer, days: S.weekdays ? [1, 2, 3, 4, 5] : null, free: S.ctx.free, load: S.ctx.load, cap: S.ctx.cap, kind: S.kind, catchup: S.catchup});
    const done = S.kids.filter(k => k.status === "done").map(k => ({key: k.id, id: k.id, title: k.title, hours: k.hours || 0, due: k.due, locked: true, steps: [], kind: "project"}));
    S.ms = done.concat(p.milestones.map(m => ({key: m.id, id: m.id, title: m.title, hours: m.hours, due: m.due, steps: m.steps, done: m.done, kind: m.kind, optional: m.optional})));
  } else {
    p = BD.plan({title: S.title, text: S.text, type: S.type, kind: S.kind, due: S.due, start: S.start, hours: S.hoursEff, difficulty: S.difficulty, buffer: S.buffer, days: S.weekdays ? [1, 2, 3, 4, 5] : null, free: S.ctx.free, load: S.ctx.load, cap: S.ctx.cap, stages: opts.useAi && S.aiStages ? S.aiStages : null});
    S.kind = p.kind;
    S.ms = (p.milestones || []).map(m => ({key: "k" + Math.random().toString(36).slice(2, 7), id: "", title: m.title, hours: m.hours, due: m.due, steps: m.steps, done: m.done, kind: m.kind, optional: m.optional, unsupported: m.unsupported}));
  }
  S.plan = p; S.dirty = false;
  const ks = $("#bdKind"); if (ks) ks.value = S.kind || "generic";
  draw();
}
const sortMs = S => { const lock = S.ms.filter(m => m.locked), rest = S.ms.filter(m => !m.locked); S.ms = lock.concat(rest); };
function onList(e){
  const S = CUR; if (!S) return;
  const b = e.target.closest("[data-a]"), li = e.target.closest("li.bd-m");
  if (e.type === "click" && b) {
    const i = Number(b.dataset.i), a = b.dataset.a, m = S.ms[i]; if (!m) return;
    S.dirty = true;
    if (a === "rm") { S.ms.splice(i, 1); draw(); return; }
    if (a === "up" || a === "down") {
      const j = a === "up" ? i - 1 : i + 1; if (!S.ms[j] || S.ms[j].locked) return;
      const dates = [S.ms[i].due, S.ms[j].due]; [S.ms[i], S.ms[j]] = [S.ms[j], S.ms[i]];
      const lo = Math.min(i, j); S.ms[lo].due = dates[0] < dates[1] ? dates[0] : dates[1]; S.ms[lo + 1].due = dates[0] < dates[1] ? dates[1] : dates[0];
      draw(); const nb = dlg.querySelector(`[data-a="${a}"][data-i="${j}"]`); if (nb && !nb.disabled) nb.focus(); return;
    }
    if (a === "lighter") {
      const open = S.ms.filter(x => !x.locked), k = open.indexOf(m), prev = open[k - 1], next = open[k + 1];
      const per = {}; open.forEach(x => { if (x !== m) per[x.due] = (per[x.due] || 0) + (Number(x.hours) || 0) / (S.ctx.cap || 3); });
      const load = Object.assign({}, S.ctx.load); Object.keys(per).forEach(d => { load[d] = (load[d] || 0) + per[d]; });
      const lastOk = BD.diff(todayISO(), S.due) > 0 ? BD.addD(S.due, -1) : S.due;
      const d = BD.lighterDay({date: m.due, hours: Number(m.hours) || 1, lo: prev ? BD.addD(prev.due, 1) : (S.start > todayISO() ? S.start : todayISO()), hi: next ? BD.addD(next.due, -1) : lastOk, load, free: S.ctx.free, days: S.weekdays ? [1, 2, 3, 4, 5] : null, range: 3});
      if (!d) { toast("No lighter day nearby that keeps the order"); return; }
      m.due = d; toast(`Moved to ${fmtShort(d)}`); draw(); return;
    }
    return;
  }
  if (e.type === "change" || e.type === "input") {
    if (!li) return; const i = Number(li.dataset.i), m = S.ms[i], f = e.target.dataset.f; if (!m || !f) return;
    S.dirty = true;
    if (f === "title") { m.title = e.target.value; return; }
    if (f === "hours") { if (e.type === "change") { m.hours = Math.max(0.25, Math.min(60, Math.round((Number(e.target.value) || 0.25) * 4) / 4)); draw(); } return; }
    if (f === "due" && e.type === "change") {
      const v = e.target.value; if (!BD.isDate(v)) { draw(); return; }
      const open = S.ms.filter(x => !x.locked), k = open.indexOf(m);
      const moved = BD.shiftRest(open.map(x => ({due: x.due})), k, v, {shiftRest: S.shift, due: S.due, today: todayISO()});
      open.forEach((x, n) => { x.due = moved[n].due; });
      const locked = S.ms.filter(x => x.locked), ord = open.slice().sort((a, b) => a.due < b.due ? -1 : a.due > b.due ? 1 : open.indexOf(a) - open.indexOf(b));
      S.ms = locked.concat(ord); draw();
    }
  }
}
function sheetHtml(S){
  const isNew = S.mode === "new", replan = S.mode === "replan";
  const courseOpts = `<option value="">No course</option>` + coursesArr().map(c => `<option value="${esc(c.id)}" ${c.id === S.courseId ? "selected" : ""}>${esc(c.name)}</option>`).join("");
  const kindOpts = BD.ORDER.map(k => `<option value="${k}" ${k === S.kind ? "selected" : ""}>${esc(BD.KINDS[k].label)}</option>`).join("");
  return `<form class="sheet bd-sheet" aria-label="${replan ? (S.catchup ? "Catch up plan" : "Re-plan milestones") : "Break It Down"}">${head(replan ? (S.catchup ? "Catch-up Plan" : "Re-plan Milestones") : "Break It Down")}
    <div class="sheet-body">
      ${isNew ? `<div id="bdIn" class="bd-in">
        <p class="mini" style="margin:0">Paste the assignment prompt or rubric, or add the assignment sheet as a PDF${aiReady() ? " or photo" : ""}. The plan is made on this device; AI is only used if you've turned it on.</p>
        <label class="f"><span class="lbl">Assignment Prompt or Rubric</span><textarea id="bdText" maxlength="6000" placeholder="Paste it here (the more detail, the more specific the steps)" style="min-height:110px" data-noenter></textarea></label>
        <div class="bd-files"><button type="button" class="btn small" id="bdPick">Choose a PDF${aiReady() ? " or Photo" : ""}</button><input type="file" id="bdFile" accept=".pdf,.txt,application/pdf,text/plain${aiReady() ? ",image/*" : ""}" class="sr" tabindex="-1" aria-label="Choose the assignment sheet"><span class="mini" id="bdFileMsg" aria-live="polite"></span></div>
        <label class="f"><span class="lh">Title ${REQ}</span><input type="text" id="bdTitle" maxlength="200" placeholder="e.g. Research paper on coral bleaching" data-noenter></label>
        <div class="two"><label class="f">Course<select id="bdCourse">${courseOpts}</select></label>
          <label class="f"><span class="lh">Due Date ${REQ}</span><input type="date" id="bdDue"></label></div>
        <div class="bd-act"><button type="button" class="btn primary" id="bdMake">Make a Plan</button><span class="mini" id="bdMakeMsg" aria-live="polite"></span></div>
      </div>` : `<div class="bd-sum"><b>${esc(S.title)}</b><span class="mini">${S.courseId && courseOf(S.courseId) ? esc(courseLabel(courseOf(S.courseId))) + " · " : ""}Due ${esc(fmtDate(S.due))}${S.time ? " at " + esc(fmtTime(S.time)) : ""}</span></div>`}
      <div id="bdPlan" ${isNew ? "hidden" : ""}>
        <div id="bdBanner"></div>
        <details class="bd-set"><summary>Plan Settings</summary><div class="bd-grid">
          ${replan ? "" : `<label class="f">Kind<select id="bdKind">${kindOpts}</select></label><label class="f">Total hours<input type="number" id="bdHours" min="0.5" max="200" step="0.25" inputmode="decimal" value="${esc(S.hoursEff || "")}" data-noenter></label>`}
          <label class="f">Start planning<input type="date" id="bdStart" value="${esc(S.start)}"></label>
          <label class="f">Last step before the due date<select id="bdBuf">${[0, 1, 2].map(n => `<option value="${n}" ${n === S.buffer ? "selected" : ""}>${n === 0 ? "On the due date (no buffer)" : n === 1 ? "1 day before" : "2 days before"}</option>`).join("")}</select></label>
          <label class="mi-check"><input type="checkbox" id="bdWk" ${S.weekdays ? "checked" : ""}> Weekdays only</label></div></details>
        <div id="bdStrip"></div>
        <ol id="bdList" class="bd-list" aria-label="Milestones in date order"></ol>
        <div class="bd-act"><button type="button" class="btn small" id="bdAdd">+ Add a Milestone</button>
          <label class="mi-check"><input type="checkbox" id="bdShift"> Shift the rest when I change a date</label></div>
        ${replan ? `<div class="bd-act"><button type="button" class="btn small" id="bdRespread">Spread Them Again From ${esc(fmtShort(S.start))}</button></div>` : `<div class="bd-act">
          <button type="button" class="btn small ai-btn" id="bdAi">${AI_ICON} Regenerate with AI</button><button type="button" class="btn small" id="bdTpl">Use Simple Template</button><span class="mini" id="bdAiMsg" aria-live="polite"></span></div>`}
        <p id="bdTotal" class="mini bd-total" aria-live="polite"></p>
      </div>
    </div>
    <div class="sheet-foot"><button type="button" class="btn" data-act="close">Cancel</button><span class="spacer"></span><button type="button" class="btn primary" id="bdGo" ${isNew ? "hidden" : ""}>Create Milestones</button></div></form>`;
}
function wire(S){
  const root = dlg.querySelector(".bd-sheet");
  const list = $("#bdList");
  ["click", "change", "input"].forEach(ev => list.addEventListener(ev, onList));
  $("#bdShift").addEventListener("change", e => { S.shift = e.target.checked; });
  $("#bdAdd").addEventListener("click", () => {
    const open = S.ms.filter(m => !m.locked), last = open[open.length - 1], today = todayISO();
    const d = last ? (BD.diff(last.due, S.due) > 1 ? BD.addD(last.due, 1) : last.due) : (S.start > today ? S.start : today);
    S.ms.push({key: "k" + Math.random().toString(36).slice(2, 7), id: "", title: "New milestone", hours: 1, due: d, steps: [], done: "", kind: "project"}); S.dirty = true; draw();
    const inp = list.querySelector("li.bd-m:last-child input[data-f=title]"); if (inp) { inp.focus(); inp.select(); }
  });
  const setSettings = () => {
    if (!S.plan && S.mode === "new") return;
    S.start = BD.isDate($("#bdStart").value) ? $("#bdStart").value : S.start; if (S.start < todayISO() && !S.allowPast) S.start = todayISO();
    S.buffer = Number($("#bdBuf").value) || 0; S.weekdays = $("#bdWk").checked;
    const hh = $("#bdHours"); if (hh) S.hours = hh.value === "" ? "" : Number(hh.value);
    rebuild({useAi: S.plan && S.plan.source === "ai"});
  };
  ["bdStart", "bdBuf", "bdWk", "bdHours"].forEach(id => { const el = $("#" + id); if (el) el.addEventListener("change", setSettings); });
  const ks = $("#bdKind"); if (ks) ks.addEventListener("change", () => { S.kind = ks.value; S.aiStages = null; rebuild(); });
  const tpl = $("#bdTpl"); if (tpl) tpl.addEventListener("click", () => { S.aiStages = null; rebuild(); toast("Switched to the simple template"); });
  const rs = $("#bdRespread"); if (rs) rs.addEventListener("click", () => { rebuild(); toast("Milestones spread out again"); });
  const ai = $("#bdAi");
  if (ai) {
    if (inClaude() || !aiReady()) { ai.disabled = true; ai.title = "Turn on AI features in Settings to use this"; $("#bdAiMsg").textContent = inClaude() ? "" : "AI isn't set up, so the simple template is used."; }
    ai.addEventListener("click", () => runAi(S, true));
  }
  $("#bdGo").addEventListener("click", () => commit(S));
}
async function runAi(S, manual){
  const msg = $("#bdAiMsg"), btn = $("#bdAi"); if (!msg || S.aiBusy) return;
  if (!aiReady()) return;
  const now = Date.now();
  if (manual && (S.aiN >= 4 || now - (S.aiLast || 0) < 6000)) { msg.textContent = S.aiN >= 4 ? "That's enough AI tries for this plan. Edit it by hand or use the template." : "Give it a few seconds between tries."; return; }
  if (!manual && !aiOkNow()) return;
  S.aiBusy = true; S.aiN = (S.aiN || 0) + 1; S.aiLast = now; if (btn) btn.disabled = true;
  msg.textContent = "Making the steps specific to your assignment…";
  try {
    const v = await aiStages(S, m => { if (msg) msg.textContent = m; });
    if (CUR !== S || !dlg.open) return;
    if (!manual && S.dirty) { msg.textContent = "AI steps ready, but you've already edited the plan. Tap Regenerate with AI to use them."; S.aiStages = v.stages; return; }
    S.aiStages = v.stages; S.kind = v.kind || S.kind; rebuild({useAi: true});
    msg.textContent = v.dropped ? `Used the AI's steps (${v.dropped} generic one${v.dropped === 1 ? "" : "s"} left out).` : "Used the AI's steps.";
  } catch (e) {
    console.warn("breakdown AI", e);
    if (msg) msg.textContent = (e && e.code && e.code !== "bad" ? e.message : "The AI's steps weren't usable, so the simple template stays.");
  } finally { S.aiBusy = false; if (btn) btn.disabled = false; }
}

function commit(S){
  const open = S.ms.filter(m => !m.locked), today = todayISO();
  if (!open.length) return;
  if (open.some(m => !String(m.title).trim())) { toast("Give every milestone a title"); return; }
  if (open.some(m => !BD.isDate(m.due))) { toast("Every milestone needs a date"); return; }
  if (open.some(m => m.due > S.due)) { toast("A milestone is after the due date. Move it earlier."); return; }
  if (!S.allowPast && open.some(m => m.due < today)) { toast("A milestone is in the past. Pick today or later."); return; }
  const changes = [];
  let parent;
  if (S.mode === "new") {
    if (!S.title.trim()) { toast("Add a title first"); return; }
    parent = newTask({id: uid(), title: S.title.trim().slice(0, 200), courseId: S.courseId || "", type: S.type || kindType(S.kind), due: S.due, time: S.time || "", start: today, hours: S.hoursEff, difficulty: S.difficulty || "med", link: S.link || "", notes: String(S.text || "").slice(0, 4000)});
  } else parent = clone(state.tasks[S.id]);
  if (!parent) { toast("That assignment is gone"); return; }
  const total = open.reduce((s, m) => s + (Number(m.hours) || 0), 0) + S.ms.filter(m => m.locked).reduce((s, m) => s + (Number(m.hours) || 0), 0);
  const all = S.ms.slice().sort((a, b) => (a.locked === b.locked ? 0 : a.locked ? -1 : 1));
  const n = all.length;
  let order = nextOrder("todo") + 5000;
  const keep = new Set();
  all.forEach((m, i) => {
    if (m.id && state.tasks[m.id]) {
      keep.add(m.id);
      const k = clone(state.tasks[m.id]);
      if (!m.locked) { Object.assign(k, {title: String(m.title).trim().slice(0, 120), due: m.due, start: m.due, hours: Number(m.hours) || k.hours}); }
      k.step = `${i + 1}/${n}`;
      changes.push({kind: "task", id: k.id, after: k});
    } else {
      const k = milestoneTask(parent, {title: String(m.title).trim(), due: m.due, hours: Number(m.hours) || 1, kind: m.kind, steps: m.steps, done: m.done}, i, n, order += 10);
      changes.push({kind: "task", id: k.id, after: k});
    }
  });
  if (S.mode === "replan") S.kids.forEach(k => { if (!keep.has(k.id) && k.status !== "done") changes.push({kind: "task", id: k.id, after: null}); });
  const np = markParent(parent, total, S.kind);
  np.bdDue = parent.due;
  changes.unshift({kind: "task", id: np.id, after: np});
  const pr = prefs(); state.settings = Object.assign({}, state.settings, {bd: {buffer: S.buffer, weekdays: !!S.weekdays}}); void pr; saveSettings();
  dlg.close();
  const made = changes.filter(c => c.kind === "task" && c.id !== np.id && c.after).length;
  applyChanges(changes, S.mode === "replan" ? `Re-planned ${made} milestone${made === 1 ? "" : "s"} for ${np.title.slice(0, 40)}` : `Created ${made} milestone${made === 1 ? "" : "s"} for ${np.title.slice(0, 40)}`);
}
function baseState(over){
  const today = todayISO(), pf = prefs();
  return Object.assign({mode: "task", id: "", title: "", courseId: "", type: "Assignment", due: "", time: "", link: "", text: "", kind: "", hours: "", hoursEff: 0, difficulty: "med", start: today, buffer: Number(pf.buffer) || 0, weekdays: !!pf.weekdays,
    ms: [], kids: [], plan: null, aiStages: null, aiN: 0, aiLast: 0, aiBusy: false, dirty: false, shift: false, ctx: {load: {}, free: {}, cap: 3}, catchup: false, allowPast: false}, over || {});
}
function openFor(taskId, opts){
  opts = opts || {};
  const t = state.tasks[taskId]; if (!t) return;
  const today = todayISO();
  if (!t.due) { toast("Add a due date to this task first, then break it down."); return; }
  const kids = kidsOfTask(t.id);
  const mode = kids.length ? "replan" : "task";
  if (mode === "task" && t.due < today) { toast("This is already past due. Move the due date first."); return; }
  if (mode === "replan" && !kids.some(k => k.status !== "done")) { toast("Every milestone is already done."); return; }
  const S = baseState({mode, id: t.id, title: t.title, courseId: t.courseId, type: t.type, due: t.due, time: t.time, link: t.link, text: String(t.notes || "").slice(0, 6000), hours: isNum(t.hours) && Number(t.hours) > 0 ? Number(t.hours) : "",
    difficulty: t.difficulty, kids, catchup: !!opts.catchup, kind: t.bdKind || ""});
  if (mode === "replan") S.allowPast = false;
  show(S);
}
function openNew(preset){
  preset = preset || {};
  const S = baseState({mode: "new", courseId: preset.courseId || "", title: preset.title || "", due: preset.due || ""});
  show(S);
  if (preset.title) $("#bdTitle").value = preset.title;
  if (preset.due) $("#bdDue").value = preset.due;
}
function show(S){
  CUR = S;
  S.hoursEff = Number(S.hours) > 0 ? Number(S.hours) : BD.defaultHours(S.kind || BD.detectKind(S.title, S.text), S.difficulty);
  if (!S.kind) S.kind = BD.detectKind(S.title, S.text);
  openSheet(sheetHtml(S));
  dlg.addEventListener("close", () => { if (CUR === S) CUR = null; }, {once: true});
  wire(S);
  if (S.mode === "new") wireNew(S);
  else {
    $("#bdPlan").hidden = false; rebuild();
    if (S.mode === "task" && S.text.length >= 60 && aiOkNow()) runAi(S, false);
  }
}
function wireNew(S){
  const txt = $("#bdText"), file = $("#bdFile"), msg = $("#bdFileMsg");
  const sync = () => {
    const t = txt.value, today = todayISO();
    if (!$("#bdTitle").dataset.edited) { const g = BD.guessTitle(t); if (g) $("#bdTitle").value = g; }
    if (!$("#bdDue").dataset.edited) { const d = BD.parseDue(t, today); if (d && d.date >= today) { $("#bdDue").value = d.date; S.time = d.time || ""; } }
  };
  txt.addEventListener("input", sync); txt.addEventListener("paste", () => setTimeout(sync, 0));
  $("#bdTitle").addEventListener("input", e => { e.target.dataset.edited = "1"; }); $("#bdDue").addEventListener("input", e => { e.target.dataset.edited = "1"; });
  $("#bdPick").addEventListener("click", () => file.click());
  file.addEventListener("change", async () => {
    const f = file.files && file.files[0]; file.value = ""; if (!f) return;
    msg.textContent = "Reading…";
    try {
      let t = "";
      if (/\.txt$/i.test(f.name) || f.type === "text/plain") t = (await f.text()).slice(0, 20000);
      else if (/\.pdf$/i.test(f.name) || f.type === "application/pdf") {
        if (f.size > 25 * 1024 * 1024) { msg.textContent = "That PDF is over 25 MB. Paste the text instead."; return; }
        const r = await pdfText(await f.arrayBuffer(), (p, n) => { msg.textContent = `Reading page ${p} of ${n}…`; });
        t = r.text;
        if (t.replace(/\s/g, "").length < 40) { msg.textContent = "This PDF has no selectable text (a scan?). Paste the text instead" + (aiReady() ? ", or add a photo of it." : "."); return; }
      } else if (/^image\//.test(f.type) || /\.(png|jpe?g|webp|heic|heif)$/i.test(f.name)) {
        if (!aiReady()) { msg.textContent = "Reading a photo needs AI features. Paste the text or choose a PDF instead."; return; }
        if (f.size > AI_LIMIT_BYTES) { msg.textContent = "That photo is too large. Try a smaller one."; return; }
        const src = await aiSourceFromFile(f);
        const r = await aiCall({task: "photo", fast: true, maxTokens: 6000, temperature: 0.1, schema: {type: "OBJECT", properties: {text: {type: "STRING"}}, required: ["text"]}, parts: [src.part, {text: "Transcribe the text of this assignment sheet exactly. Return JSON: {\"text\": \"...\"}."}], system: "You transcribe photos of assignment sheets. Do not add anything that is not on the page."});
        t = String((r.data && r.data.text) || "");
      } else { msg.textContent = "Choose a PDF, a text file or paste the text."; return; }
      t = t.replace(/\r/g, "").trim().slice(0, 6000);
      if (!t) { msg.textContent = "Couldn't find any text there."; return; }
      txt.value = t; msg.textContent = `Read ${f.name}.`; sync();
    } catch (e) { console.warn(e); msg.textContent = e && e.code ? e.message : "Couldn't read that file. Paste the text instead."; }
  });
  $("#bdMake").addEventListener("click", () => {
    const today = todayISO(), title = $("#bdTitle").value.trim(), due = $("#bdDue").value, mm = $("#bdMakeMsg");
    if (!title) { mm.textContent = "Add a title."; $("#bdTitle").focus(); return; }
    if (!BD.isDate(due)) { mm.textContent = "Pick the due date."; $("#bdDue").focus(); return; }
    if (due < today) { mm.textContent = "That due date has passed."; $("#bdDue").focus(); return; }
    mm.textContent = "";
    Object.assign(S, {title, due, courseId: $("#bdCourse").value, text: txt.value.trim().slice(0, 6000), start: today});
    S.kind = BD.detectKind(S.title, S.text); S.type = kindType(S.kind);
    const ks = $("#bdKind"); if (ks) ks.value = S.kind;
    const hh = $("#bdHours"); if (hh) hh.value = "";
    S.hours = ""; S.aiStages = null; S.aiN = 0;
    $("#bdIn").classList.add("bd-in-done"); $("#bdPlan").hidden = false; $("#bdGo").hidden = false;
    const summ = document.createElement("div"); summ.className = "bd-sum"; summ.innerHTML = `<b>${esc(title)}</b><span class="mini">Due ${esc(fmtDate(due))}</span> <button type="button" class="link-btn" id="bdEditIn">Edit Details</button>`;
    $("#bdIn").before(summ); $("#bdIn").hidden = true;
    summ.querySelector("#bdEditIn").addEventListener("click", () => { $("#bdIn").hidden = false; summ.remove(); $("#bdPlan").hidden = true; $("#bdGo").hidden = true; });
    rebuild();
    const hh2 = $("#bdHours"); if (hh2) hh2.value = S.hoursEff;
    if (S.text.length >= 60 && aiOkNow()) runAi(S, false);
    const f = $("#bdList input"); if (f && window.matchMedia("(min-width:601px)").matches) f.focus();
  });
  setTimeout(() => { const t = $("#bdText"); if (t && window.matchMedia("(min-width:601px)").matches) t.focus(); }, 30);
}

/* ---------- Where it shows up: task sheet, rows, tray, offers ---------- */
const bigBtnTypes = {Project: 1, Assignment: 1, Lab: 1};
function formHtml(t, isNew){
  if (isNew) return `<p class="mini bd-new-link"><button type="button" class="link-btn" data-act="bd-new">Big Assignment? Break It into Milestones Instead</button></p>`;
  if (!t || t.status === "done" && !t.breakdownParent) return "";
  const today = todayISO();
  if (t.breakdownOf) {
    const p = state.tasks[t.breakdownOf]; if (!p) return "";
    const kids = kidsOfTask(p.id), late = BD.overdueKids(kids, today);
    return `<div class="bd-panel"><div><b>Step ${esc(t.step || "")}</b> of <button type="button" class="link-btn" data-act="edit-task" data-id="${esc(p.id)}">${esc(p.title)}</button><span class="mini" style="display:block">${esc(BD.progressOf(kids).text)}</span></div>${late.length && t.status !== "done" ? `<button type="button" class="btn small" data-act="bd-catchup" data-id="${esc(p.id)}">Catch-up Plan</button>` : ""}</div>`;
  }
  const kids = t.breakdownParent ? kidsOfTask(t.id) : [];
  if (kids.length) {
    const pr = BD.progressOf(kids), late = BD.overdueKids(kids, today), re = BD.needsReplan(t, kids);
    return `<div class="bd-panel"><div class="bd-ph"><b>${esc(pr.text)}</b><span class="bd-bar" aria-hidden="true"><i style="width:${Math.round(pr.frac * 100)}%"></i></span></div>
      ${re ? `<p class="bd-w" role="status">The due date changed from ${esc(fmtShort(t.bdDue))} to ${esc(fmtShort(t.due))}. Re-plan the open milestones?</p>` : ""}${late.length ? `<p class="bd-w" role="status">${late.length} milestone${late.length === 1 ? " is" : "s are"} overdue. A catch-up plan spreads what's left from today.</p>` : ""}
      ${pr.all && t.status !== "done" ? `<p class="mini" style="margin:0">Every milestone is done.</p>` : ""}
      <div class="bd-pb">${t.status !== "done" ? `<button type="button" class="btn small ${re ? "primary" : ""}" data-act="bd-open" data-id="${esc(t.id)}">${re ? "Re-plan Milestones" : "Edit Milestones"}</button>${late.length ? `<button type="button" class="btn small" data-act="bd-catchup" data-id="${esc(t.id)}">Catch-up Plan</button>` : ""}${pr.all ? `<button type="button" class="btn small primary" data-act="bd-complete" data-id="${esc(t.id)}">Mark Complete</button>` : ""}` : ""}<button type="button" class="btn small" data-act="bd-remove" data-id="${esc(t.id)}">Remove Milestones</button></div>
      <ul class="bd-kids">${kids.map(k => `<li class="${k.status === "done" ? "is-done" : ""}"><button type="button" class="link-btn" data-act="edit-task" data-id="${esc(k.id)}">${esc(k.step || "")} ${esc(k.title)}</button><span class="mini">${esc(fmtShort(k.due))}${k.status === "done" ? " · done" : k.due < today ? " · overdue" : ""}</span></li>`).join("")}</ul></div>`;
  }
  if (!bigBtnTypes[t.type] || t.status === "done" || t.prepFor) return "";
  return BD.isBig(t) ? `<div class="bd-panel offer"><div><b>This looks big.</b><span class="mini" style="display:block">Split it into milestones, scheduled backward from the due date.</span></div><button type="button" class="btn small primary" data-act="bd-open" data-id="${esc(t.id)}">Break It Down</button></div>`
    : `<p class="mini bd-new-link"><button type="button" class="link-btn" data-act="bd-open" data-id="${esc(t.id)}">Break It into Milestones</button></p>`;
}
function rowBtn(t){
  if (!t || !t.due || t.status === "done" || t.due < todayISO() || !BD.isBig(t) || (t.breakdownParent && kidsOfTask(t.id).length)) return "";
  return `<button type="button" class="bd-row-btn" data-act="bd-open" data-id="${esc(t.id)}" aria-label="Break ${esc(t.title)} into milestones">Break It Down</button>`;
}
function rowMeta(t){
  if (t.breakdownOf) { const p = state.tasks[t.breakdownOf]; return p ? `<span class="bd-tag">Step ${esc(t.step || "")} · ${esc(String(p.title).slice(0, 28))}${p.title.length > 28 ? "…" : ""}</span>` : `<span class="bd-tag">Step ${esc(t.step || "")}</span>`; }
  if (t.breakdownParent) { const k = kidsOfTask(t.id); if (k.length) { const pr = BD.progressOf(k); return `<span class="bd-tag">${esc(pr.text)}</span>${BD.needsReplan(t, k) ? `<span class="late">Re-plan?</span>` : ""}`; } }
  return "";
}
// The Suggestions tray: the biggest task nobody has broken down, due in 5 to 30 days. Rule-based; the AI only runs if it is tapped.
function trayItem(){
  try {
    const today = todayISO();
    const c = tasksArr().filter(t => BD.isBig(t) && t.due && BD.diff(today, t.due) >= 5 && BD.diff(today, t.due) <= 30 && !kidsOfTask(t.id).length)
      .map(t => ({t, s: (Number(t.hours) || 0) + (BIG_CUE.test(t.title) ? 4 : 0) + (t.type === "Project" ? 1 : 0)})).sort((a, b) => b.s - a.s || (a.t.due < b.t.due ? -1 : 1));
    if (!c.length) return null;
    const t = c[0].t, n = BD.diff(today, t.due);
    return {id: "bd:" + t.id, kind: "breakdown", tid: t.id, act: "bd-open", text: `“${String(t.title).slice(0, 50)}” is due in ${n} days and looks big. Splitting it into milestones makes it easier to start.`, btn: "Break It Down"};
  } catch (e) { return null; }
}
const BIG_CUE = /\b(paper|essay|report|project|presentation|lab report|thesis|capstone|portfolio|case study|poster)\b/i;
// Deleting a parent: keep the milestones or take them along (everything through applyChanges, so Undo and the bin work)
function deleteHook(id){
  const t = state.tasks[id]; if (!t || !t.breakdownParent) return false;
  const kids = kidsOfTask(id); if (!kids.length) return false;
  const openK = kids.filter(k => k.status !== "done");
  openSheet(`<form class="sheet">${head("Delete Assignment")}<div class="sheet-body"><p style="margin:0">“${esc(t.title)}” has ${kids.length} milestone${kids.length === 1 ? "" : "s"} (${openK.length} not done). Delete just the assignment, or its milestones too?</p></div>
    <div class="sheet-foot"><button type="button" class="btn" data-act="close">Cancel</button><span class="spacer"></span><button type="button" class="btn" id="bdDelOne">Keep Milestones</button><button type="button" class="btn primary danger" id="bdDelAll">Delete All ${kids.length + 1}</button></div></form>`);
  $("#bdDelOne").addEventListener("click", () => { dlg.close(); applyChanges([{kind: "task", id, after: null}].concat(kids.map(k => ({kind: "task", id: k.id, after: Object.assign(clone(k), {breakdownOf: ""})}))), `Deleted ${t.title}`); });
  $("#bdDelAll").addEventListener("click", () => { dlg.close(); applyChanges([t].concat(kids).map(x => ({kind: "task", id: x.id, after: null})), `Deleted ${kids.length + 1} tasks`); });
  return true;
}
function completeParent(id){
  const t = state.tasks[id]; if (!t || t.status === "done") return;
  const n = Object.assign(clone(t), {status: "done", doneAt: Date.now(), pct: 100, order: nextOrder("done")});
  try { celebrate("check"); } catch (e) {}
  applyChanges([{kind: "task", id, after: n}], `Completed ${t.title}`);
}
function removeBreakdown(id){
  const t = state.tasks[id]; if (!t) return;
  const kids = kidsOfTask(id), np = clone(t); ["breakdownParent", "bdDue", "bdKind", "bdHours"].forEach(k => { delete np[k]; });
  if (dlg.open) dlg.close();
  applyChanges([{kind: "task", id, after: np}].concat(kids.filter(k => k.status !== "done").map(k => ({kind: "task", id: k.id, after: null}))).concat(kids.filter(k => k.status === "done").map(k => ({kind: "task", id: k.id, after: Object.assign(clone(k), {breakdownOf: "", step: ""})}))), `Removed the milestones for ${t.title.slice(0, 40)}`);
}
const offered = {done: {}, kids: {}, replan: {}, auto: {}};
hook("changed", changes => {
  try {
    const today = todayISO(), seen = new Set();
    (changes || []).forEach(c => {
      if (c.kind !== "task" || !c.after) return;
      const a = c.after;
      if (a.breakdownOf && a.status === "done") {
        const p = state.tasks[a.breakdownOf]; if (!p || p.status === "done" || seen.has(p.id)) return; seen.add(p.id);
        const kids = kidsOfTask(p.id), pr = BD.progressOf(kids);
        if (pr.all && offered.done[p.id] !== pr.total) { offered.done[p.id] = pr.total; setTimeout(() => toast(`All ${pr.total} milestone${pr.total === 1 ? "" : "s"} done. Mark “${String(p.title).slice(0, 40)}” complete?`, null, {label: "Mark Complete", fn: () => completeParent(p.id)}), 700); }
      } else if (a.breakdownOf) delete offered.done[a.breakdownOf];
      if (a.breakdownParent && a.status === "done") {
        const open = kidsOfTask(a.id).filter(k => k.status !== "done");
        if (open.length && !offered.kids[a.id]) { offered.kids[a.id] = 1; setTimeout(() => toast(`${a.title.slice(0, 36)} is done. Mark its ${open.length} remaining milestone${open.length === 1 ? "" : "s"} done too?`, null, {label: "Mark Done", fn: () => applyChanges(open.map(k => ({kind: "task", id: k.id, after: Object.assign(clone(k), {status: "done", doneAt: Date.now(), pct: 100, order: nextOrder("done")})})), `Marked ${open.length} milestone${open.length === 1 ? "" : "s"} done`)}), 700); }
      } else if (a.breakdownParent) delete offered.kids[a.id];
      if (a.breakdownParent && a.status !== "done") {
        const kids = kidsOfTask(a.id);
        if (BD.needsReplan(a, kids) && offered.replan[a.id] !== a.due) { offered.replan[a.id] = a.due; setTimeout(() => toast(`The due date moved. Re-plan the ${kids.filter(k => k.status !== "done").length} open milestones?`, null, {label: "Re-plan", fn: () => openFor(a.id)}), 900); }
      }
      // a gentle, once-only offer when a big task with a faraway due date is created
      if (!a.breakdownOf && !a.breakdownParent && a.created && Date.now() - a.created < 30000 && (changes.filter(x => x.kind === "task" && x.after).length <= 2) && BD.isBig(a) && a.due && BD.diff(today, a.due) >= 5 && !lmsOf(a)) {
        const mem = bdMem(); mem.asked = mem.asked || {};
        if (!mem.asked[a.id]) {
          mem.asked[a.id] = Date.now(); const ks = Object.keys(mem.asked); if (ks.length > 150) ks.sort((x, y) => mem.asked[x] - mem.asked[y]).slice(0, ks.length - 150).forEach(k => delete mem.asked[k]); bdMemSet(mem);
          setTimeout(() => { if (!state.tasks[a.id] || kidsOfTask(a.id).length || dlg.open) return; toast("This looks big: break it into milestones?", null, {label: "Break It Down", fn: () => openFor(a.id)}); }, 3200);
        }
      }
    });
  } catch (e) { console.warn("breakdown offers", e); }
});
hook("act", (act, el, id) => {
  switch (act) {
    case "bd-open": openFor(id); return true;
    case "bd-catchup": if (dlg.open) dlg.close(); openFor(id, {catchup: true}); return true;
    case "bd-new": { const f = dlg.querySelector("form.sheet"), g = n => f && f.elements[n] ? f.elements[n].value : ""; const pre = {title: g("title"), courseId: g("courseId"), due: g("due")}; if (dlg.open) dlg.close(); openNew(pre); return true; }
    case "bd-complete": completeParent(id); if (dlg.open) dlg.close(); return true;
    case "bd-remove": removeBreakdown(id); return true;
    case "bd-new-course": { const pre = {courseId: el.dataset.course || (ui.tab === "courses" && ui.courseId && courseOf(ui.courseId) ? ui.courseId : "")};   // opened from a menu on a course page: that course
      if (dlg.open) { dlg.addEventListener("close", () => openNew(pre), {once: true}); dlg.close(); }   // open it after the old sheet's close event, which would otherwise reach the new sheet's own close listener
      else openNew(pre);
      return true; }
  }
  return false;
});

/* ---------- Style ---------- */
{
  const st = document.createElement("style"); st.id = "breakdownCss";
  st.textContent = `
.bd-sheet .sheet-body{display:grid;gap:12px}
.bd-sheet .btn,.bd-sheet .link-btn,.bd-sheet .mi-check{min-height:40px}
.bd-sheet .bd-set summary,.bd-sheet .icon-btn{min-height:44px}
.bd-in{display:grid;gap:10px}.bd-in-done{display:none}
.bd-files{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.bd-act{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.bd-sum{display:flex;gap:4px 10px;flex-wrap:wrap;align-items:baseline}.bd-sum b{font-family:var(--display)}
.bd-ban{display:flex;gap:10px;align-items:flex-start;padding:10px 12px;border-radius:12px;background:var(--soft);font-size:.9rem;margin-bottom:8px}
.bd-ban.warn{background:color-mix(in srgb,var(--late) 10%,var(--surface));border:1px solid color-mix(in srgb,var(--late) 35%,var(--line))}
.bd-ban b{white-space:nowrap}
.bd-set{border:1px solid var(--line);border-radius:12px;padding:8px 12px}
.bd-set summary{min-height:40px;display:flex;align-items:center;cursor:pointer;font-weight:600}
.bd-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px;padding:6px 0 4px}
.bd-strip{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(0,1fr);gap:2px;margin:10px 0 2px}
.bd-c{height:28px;border-radius:4px;background:var(--cr0,#A9CFF6);border:1px solid var(--line);display:grid;place-items:center;font-size:.7rem;line-height:1;min-width:0;overflow:hidden}
.bd-c.lv1{background:var(--cr1,#9DDBA8)}.bd-c.lv2{background:var(--cr2,#F7DA63)}.bd-c.lv3{background:var(--cr3,#F29A4A);color:var(--cr-t3,#1C2433)}.bd-c.lv4{background:var(--cr4,#D3352A);color:var(--cr-t4,#fff)}
.bd-c.has{outline:2px solid var(--ink);outline-offset:-2px}.bd-c.due{border-color:var(--ink);border-style:dashed}.bd-c b{font-weight:800}
.bd-strip-l{display:flex;justify-content:space-between;gap:8px}.bd-strip-l span:nth-child(2){flex:1;text-align:center;opacity:.85}
.bd-list{list-style:none;margin:0;padding:0;display:grid;gap:8px}
.bd-m{display:flex;gap:10px;align-items:flex-start;padding:10px;border:1px solid var(--line);border-radius:12px;background:var(--surface)}
.bd-m.is-done{opacity:.7}
.bd-n{flex:none;width:28px;height:28px;border-radius:50%;background:var(--accent);color:var(--accent-ink,#fff);display:grid;place-items:center;font:700 .85rem var(--display);margin-top:6px}
.bd-m.is-done .bd-n svg{width:14px;height:14px}
.bd-f{flex:1;min-width:0;display:grid;gap:6px}
.bd-f input[type=text]{width:100%;min-height:44px}
.bd-sub{display:flex;gap:8px;align-items:flex-end;flex-wrap:wrap}
.bd-l{display:grid;gap:2px;font-size:.78rem;color:var(--muted)}.bd-l input{min-height:44px}
.bd-l input[type=number]{width:84px}
.bd-btns{display:flex;gap:4px;margin-left:auto}
.bd-btns .icon-btn{min-width:44px;min-height:44px}
.bd-steps{margin:0;padding-left:18px;font-size:.84rem;color:var(--muted)}
.bd-w{margin:0;padding:6px 10px;border-radius:10px;background:color-mix(in srgb,var(--late) 10%,var(--surface));font-size:.86rem;display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.bd-w .btn{min-height:40px}
.bd-total.warn{color:var(--late)}
.bd-panel{display:flex;gap:10px 14px;align-items:center;flex-wrap:wrap;padding:12px;border:1px solid var(--line);border-radius:14px;background:var(--surface);margin-bottom:12px}
.bd-panel.offer{border-color:color-mix(in srgb,var(--accent) 40%,var(--line));background:color-mix(in srgb,var(--accent) 7%,var(--surface))}
.bd-panel>div:first-child{flex:1 1 200px;min-width:0}
.bd-ph{display:grid;gap:6px}.bd-bar{display:block;height:8px;border-radius:99px;background:var(--soft);overflow:hidden}.bd-bar i{display:block;height:100%;background:var(--accent)}
.bd-pb{display:flex;gap:8px;flex-wrap:wrap;width:100%}.bd-pb .btn{min-height:40px}
.bd-kids{list-style:none;margin:0;padding:0;width:100%;display:grid}
.bd-kids li{display:flex;justify-content:space-between;gap:10px;padding:4px 0;border-top:1px solid var(--line);align-items:center}
.bd-kids li.is-done .link-btn{text-decoration:line-through;opacity:.7}
.bd-kids .link-btn{min-height:40px;text-align:left}
.bd-new-link{margin:0 0 10px}.bd-new-link .link-btn{min-height:40px}
.bd-row-btn{flex:none;align-self:center;margin:0 10px 0 0;min-height:40px;padding:0 14px;border:1px solid var(--line);border-radius:999px;background:var(--surface);color:var(--accent);font:600 .8rem var(--body,inherit);cursor:pointer;white-space:nowrap}
.bd-tag{color:var(--accent);font-weight:600}
@media (max-width:600px){.bd-row-btn{margin-right:6px;padding:0 8px;font-size:.76rem}.bd-sub{gap:6px}.bd-btns{margin-left:0;width:100%;justify-content:flex-end}}
.imp-bd{display:flex;gap:8px;align-items:center;min-height:40px;font-size:.86rem;color:var(--accent);font-weight:600;cursor:pointer}
`;
  document.head.appendChild(st);
}
// A small hook for tests/breakdown.e2e.js (read-only access to app internals, like window.__sbPlan)
window.__sbBreakdown = {state: () => state, ui, render, applyChanges, clone, importSheet, lmsOf, newTask, allTasks, remainingOf, TB, plan: () => window.__sbPlan && window.__sbPlan()};
window.SBBREAK = {open: openFor, openNew, formHtml, rowBtn, rowMeta, trayItem, deleteHook, expandNew, big: x => BD.isBig(Object.assign({status: "todo"}, x)), engine: BD, state: () => CUR};

})();

