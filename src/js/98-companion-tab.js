/* ===== module: 98-companion-tab.js ===== */
/* The Companion tab */
(() => {
  if (!window.SBCOMP || !SBCOMP.tab) return;
  const CH_KEY = "studyboard:comp:chats", MAXC = 30, MAXM = 40;
  const T = ui.cpt = ui.cpt || {tab: "chat", id: null, busy: null, draft: ""};
  T.att = T.att || []; T.srcs = T.srcs || {};
  const rd = () => { try { const a = JSON.parse(localStorage.getItem(CH_KEY) || "[]"); return Array.isArray(a) ? a.filter(c => c && c.id && Array.isArray(c.msgs)) : []; } catch (e) { return []; } };
  const wr = a => {
    const before = rd().map(c => c.id);
    a = a.slice(0, MAXC);
    try { localStorage.setItem(CH_KEY, JSON.stringify(a)); }
    catch (e) { try { localStorage.setItem(CH_KEY, JSON.stringify(a.slice(0, 8))); } catch (e2) {} }
    try { chatPush(before, a); } catch (e) {}
  };
  /* Chats follow you to your other devices The newest 15 chats */
  const SYNC_CHATS = 15, SYNC_MSGS = 20, SYNC_CHARS = 300000;
  const rawSet = Storage.prototype.setItem;
  let pushT = 0, lastRef = null;
  const chatCompact = list => {
    let budget = SYNC_CHARS; const out = [];
    for (const c of list.slice().sort((x, y) => (y.at || 0) - (x.at || 0)).slice(0, SYNC_CHATS)) {
      const msgs = c.msgs.slice(-SYNC_MSGS).map(m => { const o = Object.assign({}, m); delete o.files; return o; }), n = JSON.stringify(msgs).length;
      if (budget - n < 0) break; budget -= n;
      out.push({id: c.id, title: c.title, at: c.at, msgs});
    }
    return out;
  };
  function chatPush(before, now){
    if (inPreview()) return;
    const ids = new Set(now.map(c => c.id)), gone = before.filter(id => !ids.has(id));
    if (gone.length) { const at = Date.now(), keep = (Array.isArray(state.settings.chatGone) ? state.settings.chatGone : []).filter(g => g && !gone.includes(g.id));
      state.settings = Object.assign({}, state.settings, {chatGone: keep.concat(gone.map(id => ({id, at}))).slice(-40)}); }
    clearTimeout(pushT);
    pushT = setTimeout(() => { try { state.settings = Object.assign({}, state.settings, {chats: chatCompact(rd())}); lastRef = state.settings.chats; saveSettings(); } catch (e) {} }, 2500);
  }
  function chatApply(){
    try {
      const r = state.settings && state.settings.chats, gone = (state.settings && state.settings.chatGone) || [];
      if (!Array.isArray(r) || r === lastRef) return;
      lastRef = r;
      const loc = rd(), by = new Map(loc.map(c => [c.id, c])), goneAt = new Map(gone.filter(g => g && g.id).map(g => [g.id, g.at || 0]));
      let changed = false;
      r.forEach(rc => {
        if (!rc || !rc.id || !Array.isArray(rc.msgs) || (goneAt.has(rc.id) && goneAt.get(rc.id) >= (rc.at || 0))) return;
        const lc = by.get(rc.id);
        if (!lc) { loc.push(rc); changed = true; return; }
        const have = new Set(lc.msgs.map(m => String(m.at))), add = rc.msgs.filter(m => m && !have.has(String(m.at)));
        if (add.length) { lc.msgs = lc.msgs.concat(add).sort((x, y) => (x.at || 0) - (y.at || 0)).slice(-MAXM); lc.at = Math.max(lc.at || 0, rc.at || 0); changed = true; }
      });
      const kept = loc.filter(c => !(goneAt.has(c.id) && goneAt.get(c.id) >= (c.at || 0)));
      if (kept.length !== loc.length) changed = true;
      if (!changed) return;
      kept.sort((x, y) => (y.at || 0) - (x.at || 0));
      try { rawSet.call(localStorage, CH_KEY, JSON.stringify(kept.slice(0, MAXC))); } catch (e) {}
      if (ui.tab === "companion") scheduleRender();
    } catch (e) {}
  }
  hook("render", chatApply);
  const STOP = new Set("a an the and or of in on at to for from by with about into over is are was were be been am it its this that these those my me i we you your our what whats which where when who how why did do does can could should would will just any some there here than then also as if so not no yes please tell show give need want have has had get got make let know think like much many more most all out up down off".split(" "));
  const words = s => [...new Set((String(s || "").toLowerCase().match(/[a-z0-9]{3,}/g) || []).filter(w => !STOP.has(w)))];
  const hits = (hay, ws) => { hay = String(hay || "").toLowerCase(); return ws.reduce((n, w) => n + (hay.includes(w) ? 1 : 0), 0); };
  const clip = (s, n) => { s = String(s == null ? "" : s).replace(/\s+/g, " ").trim(); return s.length > n ? s.slice(0, n - 1) + "…" : s; };
  const info = () => SBCOMP.tab.info();
  const aiOk = () => { try { return !inPreview() && aiReady(); } catch (e) { return false; } };

  // The files a question names (by file name, course or description), best first
  const namedFiles = (ws, n) => !ws.length ? [] : Object.values(state.files).filter(f => f.kind === "file" || f.kind === "cloud")
    .map(f => ({f, s: hits(f.name + " " + ((courseOf(f.courseId) || {}).name || "") + " " + (f.desc || ""), ws)})).filter(x => x.s > 0 && readableFile(x.f)).sort((a, b) => b.s - a.s).slice(0, n);
  // While the student types, start reading the files their question names, so the text is usually ready when they tap Ask
  let preT = 0;
  document.addEventListener("input", e => {
    if (!e.target || e.target.id !== "cptIn") return;
    // every 400 ms while they type (not only when they stop), with the words so far; a file already being read isn't read twice
    const el = e.target; if (preT) return;
    preT = setTimeout(() => { preT = 0; try { if (!aiOk() || !window.SBFILETEXT) return; namedFiles(words(el.value), 2).forEach(({f}) => { SBFILETEXT(f.id, 5000).catch(() => {}); }); } catch (err) {} }, 400);
  });
  /* What the companion may look at, for one question */
  // Only the parts of the planner this question needs (aiNeeds); attachments may need courses and boards for their actions
  async function context(q, prev, hasAtt){
    const ws = words(q), today = todayISO(), src = [], L = [], N = aiNeeds(q, prev);
    // A question that names none of the usual topics ("what's my busiest day?", "anything I'm forgetting?") gets a compact
    // look at everything instead of nothing, so it can still be answered from the student's own data
    // (only questions about the student themselves: "explain osmosis" is answered from their materials and knowledge alone)
    const broad = !N.small && !aiNeedsAny(N) && !hasAtt && /\b(my|me|mine|i|i'm|im|i've|i'd|i'll|am i|do i|did i|have i|should i|can i|we|our)\b/i.test(q);
    if (broad) Object.assign(N, {grades: true, plan: true, tasks: true, schedule: true, cards: true, notes: true, files: true, broad: true});
    L.push(`Today is ${today}, ${new Date().toLocaleDateString(undefined, {weekday: "long"})}.${N.plan ? ` The student plans ${dailyHours()} hours of study a day.` : ""}`);
    if (N.small && !hasAtt) return {text: L.join("\n\n"), src, need: N};
    // how the app works, for questions about Studyboard itself
    if (window.SBASSIST && (SBASSIST.appQ(q) || broad)) { L.push(SBASSIST.GUIDE); src.push("How Studyboard works"); }
    const subject = !N.small && !aiNeedsAny(N) && !broad && !hasAtt;
    // what they've been doing: focus time and finished work
    if (broad || (!subject && /\b(stud(y|ied|ying)|focus(ed)?|time|hours?|minutes?|productive|progress|streak|did i|have i|got done|accomplish|finished|completed|this week|last week|today|yesterday)\b/i.test(q))) {
      try {
        const st = typeof SBSTATS !== "undefined" ? SBSTATS : null, wk = mondayOf(today), lw = addDays(wk, -7);
        const m = (a, b) => st ? Math.round(st.focusMinutes(a, b)) : 0, n = (a, b) => st && st.focusSessions ? st.focusSessions(a, b) : 0;
        const doneWk = tasksArr().filter(t => t.status === "done" && t.doneAt && t.doneAt >= parse(addDays(today, -7)).getTime()).sort((a, b) => b.doneAt - a.doneAt);
        L.push(`STUDY ACTIVITY: focused ${m(today, today)} min today (${n(today, today)} sessions), ${m(wk, today)} min this week since Monday (${n(wk, today)} sessions), ${m(lw, addDays(wk, -1))} min last week.`
          + ` Finished in the last 7 days (${doneWk.length}): ${doneWk.slice(0, 25).map(t => `${t.title} (${new Date(t.doneAt).toLocaleDateString(undefined, {weekday: "short", month: "short", day: "numeric"})})`).join("; ") || "nothing yet"}.`);
        src.push("Study activity");
      } catch (e) {}
    }
    const al = window.SBAREA ? SBAREA.aiLine() : ""; if (al) L.push(al);
    const any = aiNeedsAny(N) || hasAtt, cs = coursesArr(), mine = c => !N.course.length || N.course.includes(c.id);
    if (cs.length && any) {
      L.push("COURSES:\n" + cs.map(c => {
        if (!N.schedule) return `- ${courseLabel(c)}: ${c.name}${c.instructor ? ", " + c.instructor : ""}`;
        let ms = ""; try { ms = courseMeetings(c).map(m => `${m.kind} ${meetWhen(m)} ${m.start}-${m.end}${m.where ? " " + m.where : ""}`).join("; "); } catch (e) {}
        return `- ${courseLabel(c)}: ${c.name}${c.instructor ? ", " + c.instructor : ""}${ms ? ", meets " + ms : c.schedule ? ", " + c.schedule : ""}${c.office ? ", office hours " + c.office : ""}`;
      }).join("\n")); src.push("Courses");
    }
    if (N.grades || N.plan) { const pf = aiPlannerFacts({grades: N.grades, plan: N.plan}); if (pf) { L.push(pf); if (N.grades) src.push("Grades"); if (N.plan) src.push("Today's Plan"); } }
    if (hasAtt || N.notes) { const nb = noteBoards(); L.push("NOTE BOARDS: My Notes (the main board)" + (nb.length ? "; " + nb.map(b => b.name + (b.courseId && courseOf(b.courseId) ? " (" + courseLabel(courseOf(b.courseId)) + ")" : "")).join("; ") : "")); }
    if (N.tasks || hasAtt) {
      const open = tasksArr().filter(t => t.status !== "done" && (!t.courseId || mine(courseOf(t.courseId) || {}))).sort(sortTasks);
      const tl = t => { const c = courseOf(t.courseId); return `- ${t.title} (${c ? courseLabel(c) + ", " : ""}${t.type}${t.due ? ", due " + t.due + (t.time ? " " + t.time : "") : ", no due date"}${hasWeight(t) ? ", worth " + t.weight + "%" : ""}${t.status === "doing" ? ", in progress" : ""}${isNum(t.hours) ? ", ~" + t.hours + "h" : ""}${t.pct ? ", " + t.pct + "% done" : ""}${t.notes ? ", note: " + clip(t.notes, 80) : ""})`; };
      if (open.length) { L.push(`OPEN TASKS${N.course.length ? " FOR " + N.course.map(id => courseLabel(courseOf(id))).join(", ") : ""} (${open.length}, soonest first${N.broad && open.length > 50 ? ", the first 50" : ""}):\n` + open.slice(0, N.broad ? 50 : 80).map(tl).join("\n")); src.push("Tasks"); }
      const recent = tasksArr().filter(t => t.status === "done" && (!t.courseId || mine(courseOf(t.courseId) || {}))).sort((a, b) => (doneTime(b) || 0) - (doneTime(a) || 0)).slice(0, 8);
      if (recent.length) L.push("RECENTLY FINISHED: " + recent.map(t => t.title).join("; "));
    }
    if (N.schedule) {
      try { const occ = schOccurrences(today, addDays(today, 6)).filter(o => !o.skipped && o.type !== "avail").sort((a, b) => (a.date + (a.start || "")).localeCompare(b.date + (b.start || ""))).slice(0, 30);
        if (occ.length) { L.push("CLASSES AND EVENTS, NEXT 7 DAYS:\n" + occ.map(o => `- ${o.date}${o.start ? " " + o.start + (o.end ? "-" + o.end : "") : ""}: ${o.title}${o.label ? " (" + o.label + ")" : ""}${o.where ? ", " + o.where : ""}`).join("\n")); src.push("Schedule"); } } catch (e) {}
    }
    const decks = deckListArr();
    if (decks.length) {
      if (N.cards) L.push("FLASHCARD DECKS:\n" + decks.slice(0, 20).map(d => { const c = courseOf(d.courseId), st = deckStats(d); return `- ${d.name}${c ? " (" + courseLabel(c) + ")" : ""}: ${st.total} cards, ${st.due} due for review`; }).join("\n"));
      decks.map(d => ({d, s: hits(d.name + " " + d.cards.map(c => c.front).join(" "), ws)})).filter(x => ws.length && x.s > 0).sort((a, b) => b.s - a.s).slice(0, 2).forEach(({d}) => {
        const pick = d.cards.map(c => ({c, s: hits(c.front + " " + c.back, ws)})).sort((a, b) => b.s - a.s).slice(0, 12).map(x => x.c);
        L.push(`CARDS FROM "${d.name}":\n` + pick.map(c => `- ${clip(c.front, 100)} → ${clip(c.back, 160)}`).join("\n")); src.push("Flashcards: " + clip(d.name, 30));
      });
    }
    const notes = notesArr().filter(n => String(n.text || "").trim());
    if (notes.length) {
      const generic = /\b(notes?|wrote|jotted|sticky)\b/i.test(q);
      // (an acronym they use for a note's heading counts as its words: "REBT" is "Rational-emotive behavior therapy")
      const ini = n => (String(n.text).split("\n")[0].match(/[A-Za-z]+/g) || []).map(x => x[0].toLowerCase()).join(""), acr = n => ws.some(w => /^[a-z]{3,6}$/.test(w) && ini(n).startsWith(w)) ? 3 : 0;
      const picked = notes.map(n => ({n, s: hits(n.text, ws) + acr(n) + (courseOf(n.courseId) ? hits(courseOf(n.courseId).name + " " + (courseOf(n.courseId).code || ""), ws) : 0)})).filter(x => x.s > 0 || generic)
        .sort((a, b) => b.s - a.s || (b.n.updated || b.n.created || 0) - (a.n.updated || a.n.created || 0)).slice(0, 6);
      if (picked.length) { L.push("STICKY NOTES:\n" + picked.map(({n}) => `- ${clip(n.text, 450)}${n.board ? " [board: " + nbName(noteBoardOf(n)) + "]" : ""}`).join("\n")); src.push("Notes"); }
    }
    // the student's own material that matches the question (always: it's how content questions get answered)
    // Chat never waits long for files: search gets about a second for file text, and files still downloading
    // (from Studyboard, Google Drive or OneDrive) keep loading in the background for the next question
    // (the AI on the device reads everything it's given before it writes a word: it gets the best few passages, not a dozen long ones)
    const devQ = typeof aiOnDevice === "function" && aiOnDevice();
    let R = null; try { R = window.SBSEARCH ? await SBSEARCH.retrieve(q, devQ ? {max: 5, chars: 700, wait: 800, readWait: 1, semWait: 2500} : {max: 12, chars: 1400, wait: 800, readWait: 1, semWait: 2500}) : null; } catch (e) {}
    if (R && R.text) { L.push("SEARCH RESULTS (passages from the student's files, notes, flashcards and tasks that match the question):\n" + R.text); R.src.forEach(x => src.push(x)); }
    const files = Object.values(state.files).filter(f => f.kind === "file" || f.kind === "cloud");
    if (files.length) {
      if (N.files || hasAtt) L.push("FILES: " + files.slice(0, 40).map(f => { const c = courseOf(f.courseId); return f.name + (c ? " (" + courseLabel(c) + ")" : ""); }).join("; "));
      const want = !(R && R.rows.some(x => x.doc.type === "chunk")) ? namedFiles(ws, 2) : [];
      // Both files at once, for at most 1.5 seconds in all; a file that isn't ready by then is left out of this answer
      const late = new Promise(r => setTimeout(() => r(""), 1500));
      const texts = await Promise.all(want.map(({f}) => Promise.race([(async () => { try { return window.SBFILETEXT ? await SBFILETEXT(f.id, 5000) : ""; } catch (e) { return ""; } })(), late])));
      want.forEach(({f}, i) => { const t = texts[i]; if (t) { L.push(`TEXT FROM FILE "${f.name}":\n${t}`); src.push("File: " + clip(f.name, 30)); } });
    }
    return {text: L.join("\n\n").slice(0, devQ ? 9000 : 60000), src, need: N, rows: R && R.rows ? R.rows : []};
  }
  // The ids of everything the chat can make, to see afterwards what a reply made
  const REFKINDS = {tasks: "task", events: "event", decks: "deck", notes: "note", courses: "course"};
  function snapIds(){ const o = {}; Object.keys(REFKINDS).forEach(k => { o[k] = new Set(Object.keys(state[k] || {})); }); return o; }
  function newSince(ids0){ for (const k of ["decks", "tasks", "events", "notes", "courses"]) { const id = Object.keys(state[k] || {}).find(x => !ids0[k].has(x)); if (id) return {kind: REFKINDS[k], id}; } return null; }
  const refName = r => { const x = r && (state[r.kind + "s"] || {})[r.id]; return x ? String(x.title || x.name || String(x.text || "").split("\n")[0] || "").slice(0, 80) : ""; };
  // For small talk: today, and the next few things due (so "give me something light" or "busy week" can be answered), nothing else
  function chatContext(){
    const today = todayISO(), L = [`Today is ${today}, ${new Date().toLocaleDateString(undefined, {weekday: "long"})}.`], src = [];
    try { const open = tasksArr().filter(t => t.status !== "done" && t.due).sort((a, b) => (a.due + (a.time || "")).localeCompare(b.due + (b.time || "")));
      const over = open.filter(t => t.due < today), next = open.filter(t => t.due >= today).slice(0, 3);
      if (over.length || next.length) L.push(`COMING UP (only mention if the student asks about their work or sounds stressed about it): ${next.map(t => `${t.title} (due ${t.due})`).join("; ")}${over.length ? `. Overdue: ${over.slice(0, 2).map(t => t.title).join("; ")}` : ""}.`);
      const dk = deckListArr().filter(d => d.cards && d.cards.length).slice(0, 2); if (dk.length) L.push(`FLASHCARD DECKS: ${dk.map(d => `${d.name} (${d.cards.length} cards)`).join("; ")}.`); } catch (e) {}
    return {text: L.join("\n\n"), src, need: {}, rows: []};
  }
  const SCHEMA = {type: "OBJECT", properties: {
    answer: {type: "STRING", description: "The reply, in the companion's friendly voice. Plain text; short paragraphs or '- ' bullets, **bold** sparingly."},
    sources: {type: "ARRAY", items: {type: "STRING"}, description: "Short labels for the parts of the student's data used, like 'Task: Lab report', 'Notes', 'Grades', 'File: Ch4.pdf'"},
    followUps: {type: "ARRAY", items: {type: "STRING"}, description: "Up to 3 short questions the student could ask you next, written as the student would type them (\"Explain the light reactions\"), never questions for the student"},
    actions: {type: "ARRAY", description: "Things the student can tap to have done in Studyboard. Only when they asked for it or it clearly fits what they attached. Empty otherwise.", items: {type: "OBJECT", properties: {
      type: {type: "STRING", enum: ["flashcards", "quiz", "case_study", "note", "tasks", "edit_tasks", "quick_add", "syllabus", "breakdown", "estimate", "exam_plan", "ask_materials", "summarize_file", "save_file"]},
      target: {type: "STRING", description: "breakdown, exam_plan: the task or exam's title. summarize_file: the file's name in Files."},
      deck: {type: "STRING", description: "flashcards, quiz, case_study: the name of an EXISTING deck to add to, or empty for a new deck"},
      edits: {type: "ARRAY", description: "edit_tasks: changes to existing open tasks", items: {type: "OBJECT", properties: {task: {type: "STRING", description: "The task's title as listed under OPEN TASKS"}, due: {type: "STRING", description: "New YYYY-MM-DD, or empty"}, time: {type: "STRING"}, hours: {type: "NUMBER", description: "New estimate in hours, or 0 to leave"}, priority: {type: "STRING", enum: ["keep", "low", "med", "high", "urgent"], description: "keep = leave the priority as it is"}, status: {type: "STRING", enum: ["keep", "todo", "doing", "done"], description: "keep = leave the status as it is"}}, required: ["task"]}},
      label: {type: "STRING", description: "Short button text, like 'Make 20 flashcards' or 'Save to Biology board'"},
      deckName: {type: "STRING", description: "flashcards, quiz, case_study: a short name"},
      style: {type: "STRING", description: "flashcards, quiz, case_study: the student's wishes for style, focus or format, in their words. Empty if none."},
      count: {type: "INTEGER", description: "flashcards or quiz: how many, only if the student said"},
      course: {type: "STRING", description: "The course code or name from COURSES this belongs to, or empty"},
      board: {type: "STRING", description: "note: the note board's name from NOTE BOARDS; a new name makes a new board; empty for My Notes"},
      noteTitle: {type: "STRING"},
      text: {type: "STRING", description: "quick_add: the sentence to add tasks from, as the student would type it. note: the full clean typed note (transcribe the student's own handwriting fully; restate slides, handouts and textbook pages in your own words instead of copying them; keep formulas and numbers exact, headings and '- ' bullets). flashcards, quiz or case_study with nothing attached: the study material to use."},
      tasks: {type: "ARRAY", items: {type: "OBJECT", properties: {title: {type: "STRING"}, type: {type: "STRING", enum: ["Assignment", "Exam", "Quiz", "Reading", "Project", "Lab", "Other"]}, due: {type: "STRING", description: "YYYY-MM-DD"}, time: {type: "STRING", description: "HH:MM, 24-hour, or empty"}}, required: ["title", "due"]}}},
      required: ["type", "label"]}}}, required: ["answer"]};
  SCHEMA.properties.actions.items.properties.type.enum = SCHEMA.properties.actions.items.properties.type.enum.filter(t => t !== "edit_tasks");
  // Each question gets only the parts of the answer format it needs: a big format with many optional parts makes a small model
  // more likely to fill it with placeholders. Actions (make cards, a note...) when something is attached or they ask to make
  // something; finding and changing things (98-assist.js) when the question is about that.
  const MAKE = /\b(flash ?cards?|cards|quiz|quizzes|case stud(y|ies)|notes?|save|summari[sz]e|summary|syllabus|break (it |this )?down|milestones|estimate|exam (plan|prep)|plan (my|for)|make|create|generate|turn (this|it|these|that) into|add|import)\b/i;
  const formatFor = (q, hasAtt, withRefs) => {
    const p = {answer: SCHEMA.properties.answer, sources: SCHEMA.properties.sources, followUps: SCHEMA.properties.followUps};
    if (hasAtt || MAKE.test(q)) p.actions = SCHEMA.properties.actions;
    if (withRefs && window.SBASSIST) Object.assign(p, SBASSIST.SHOW_CHANGE);
    return {type: "OBJECT", properties: p, required: ["answer"]};
  };
  const FREE_RULE = `\n\nReply with only a JSON object: {"answer": "your full, helpful reply to the student"}. The answer is the reply itself, never a placeholder.`;
  // Errors the student has to act on (set up AI, a refused key, a cancel, out of allowance) are shown; anything else is tried again
  // (offline or out of allowance get the answer made on this device instead)
  const LOCAL = window.SBLOCALANS;
  const stopsHere = e => !!e && /^(nokey|key|cancelled|no-consent|blocked)$/.test(String(e.code || ""));
  // Out of free requests (not just too many at once): trying again now only uses up more, so the answer is made on this device
  const usedUp = e => !!e && e.code === "limit" && !e.rate;
  // The last resort, made on this device: what was found for the question in their own data. A "what next" question is answered
  // from Do This Next, and a task always comes with its course and when it's due (the bubble's Ask uses the same, 98-assist.js)
  function localAnswer(ctx, err, q){
    const t = String(ctx && ctx.text || ""), L = [], rows = (ctx && ctx.rows) || [];
    const sec = name => { const i = t.indexOf(name); if (i < 0) return ""; const j = t.indexOf("\n\n", i + name.length); return t.slice(i, j < 0 ? undefined : j); };
    const nx = LOCAL.NEXT_Q.test(String(q || "")) ? LOCAL.nextLine() : "";
    if (nx) L.push("- " + nx);
    // a hello or a thanks: a friendly reply, not search results
    if (/^\s*(hi|hey|hello|yo|sup|hiya|howdy|good (morning|afternoon|evening)|thanks|thank you|thx|ty)\b[^?]{0,40}\??\s*$|^\s*((hi|hey|hello)\b[^?]{0,20})?how are (you|u)( doing)?( today)?\s*\??\s*$|^\s*what'?s up\s*\??\s*$/i.test(String(q || ""))) {
      const me = info() || {};
      return {answer: /thank|thx|\bty\b/i.test(q) ? "You're welcome! I'm here whenever you need me." : `Hi! ${me.name ? me.name + " here, " : ""}doing great and ready to help. What are you working on?`, followUps: []};
    }
    const sr = sec("SEARCH RESULTS");
    if (!L.length && sr) (sr.match(/\[\d+\] [^\n]*\n[^\n]*/g) || []).slice(0, 4).forEach((x, i) => {
      const d = rows[i] && rows[i].doc, tk = d && d.type === "task" && state.tasks[d.id];
      if (tk) { L.push("- " + LOCAL.taskLine(tk)); return; }
      const [h, b] = x.split("\n"), head = h.replace(/^\[\d+\] /, "").trim(), title = head.replace(/^[^:]{1,24}: /, "");
      // the body starts with the title again: once is enough
      const body = String(b || "").startsWith(title) ? String(b).slice(title.length).replace(/^[\s:·,.-]+/, "") : String(b || "");
      if (/[{\[]\s*"[\w$]+"\s*:|"\s*:\s*[\[{"]|\\n|\b\d{13}\b/.test(body)) return;  // raw data (JSON and the like) isn't an answer
      L.push(`- **${head}**${body ? ": " + clip(body, 220) : ""}`);
    });
    if (!L.length) ["OPEN TASKS", "COURSES", "CLASSES AND EVENTS", "COURSE GRADES", "STICKY NOTES"].forEach(n => { const x = sec(n); if (x && L.length < 10) x.split("\n").slice(0, 7).forEach(l => L.push(l)); });
    const gem = (() => { try { return aiCfg().provider === "gemini"; } catch (e) { return false; } })();
    const why = usedUp(err) ? (err.daily && gem ? "today's free Gemini requests are used up" : gem ? "the free Gemini requests are used up for now" : "the AI allowance is used up for now") : navigator.onLine === false || (err && err.code === "offline") ? "the AI can't be reached (check your internet)" : "the AI isn't answering right now";
    const again = usedUp(err) ? (err.daily && gem ? "They reset tomorrow, and I can answer properly then." : gem ? "Try again in a minute or two. If it's Gemini's daily limit, it resets tomorrow." : "It comes back later; AI Settings shows when.") : "Ask me again in a moment for a proper answer.";
    return {answer: L.length ? `I couldn't get a full answer because ${why}, but here's what I found in your Studyboard for that:\n${L.join("\n")}\n\n${again}` : `I couldn't get an answer because ${why}. ${usedUp(err) ? again : "Ask me again in a moment, and I'll try again."}`, followUps: []};
  }
  const PLAIN = {type: "OBJECT", properties: {answer: SCHEMA.properties.answer, followUps: SCHEMA.properties.followUps}, required: ["answer", "followUps"]};
  // An answer that's a placeholder instead of a reply ("string", "...", nothing, raw JSON) is never shown
  const junk = a => { a = String(a == null ? "" : a).trim(); return a.length < 2 || /^(string|text|str|answer|the reply|reply|response|your answer|\.{2,}|…|n\/?a|null|undefined|none|empty|todo|lorem ipsum.*|<[^>]*>|\{[\s\S]*\}|\[[\s\S]*\])$/i.test(a); };
  const ACT_TYPES = ["flashcards", "quiz", "case_study", "note", "tasks", "edit_tasks", "quick_add", "syllabus", "breakdown", "estimate", "exam_plan", "ask_materials", "summarize_file", "save_file"];
  const FILE_ACTS = ["syllabus", "save_file"], GEN_ACTS = ["flashcards", "quiz", "case_study"];
  const ACT_LABEL = {flashcards: "Make flashcards", quiz: "Make a quiz", case_study: "Make a case study", note: "Save as a note", tasks: "Add tasks", edit_tasks: "Update tasks", quick_add: "Add tasks", syllabus: "Import syllabus", breakdown: "Break it down", estimate: "Estimate times", exam_plan: "Plan exam prep", ask_materials: "Ask your course materials", summarize_file: "Summarize the file", save_file: "Save to Files"};
  const ACT_BTN = {note: "Save Note", tasks: "Add Tasks", edit_tasks: "Apply", quick_add: "Add", syllabus: "Import", breakdown: "Open", estimate: "Open", exam_plan: "Open", ask_materials: "Open", summarize_file: "Summarize", save_file: "Save"};
  const cleanActions = (list, hasFiles) => (Array.isArray(list) ? list : []).map(a => {
    if (!a || !ACT_TYPES.includes(a.type)) return null;
    const o = {type: a.type, label: clip(a.label, 60) || ACT_LABEL[a.type],
      deckName: clip(a.deckName, 80), deck: clip(a.deck, 80), target: clip(a.target, 120), style: clip(a.style, 400), count: Math.max(0, Math.min(100, Number(a.count) || 0)), course: clip(a.course, 60), board: clip(a.board, 40), noteTitle: clip(a.noteTitle, 80),
      text: String(a.text || "").trim().slice(0, 12000)};
    if (a.type === "note") { if (o.text.length < 3) return null; }
    else if (a.type === "tasks") { o.tasks = (a.tasks || []).filter(x => x && x.title && /^\d{4}-\d{2}-\d{2}$/.test(String(x.due || ""))).slice(0, 20).map(x => ({title: clip(x.title, 120), type: TYPES.includes(x.type) ? x.type : "Assignment", due: x.due, time: /^\d{1,2}:\d{2}$/.test(String(x.time || "")) ? x.time : ""})); if (!o.tasks.length) return null; }
    else if (a.type === "edit_tasks") { o.edits = (a.edits || []).filter(x => x && x.task).slice(0, 25).map(x => ({task: clip(x.task, 120), due: /^\d{4}-\d{2}-\d{2}$/.test(String(x.due || "")) ? x.due : "", time: /^\d{1,2}:\d{2}$/.test(String(x.time || "")) ? x.time : "", hours: Math.max(0, Math.min(200, Number(x.hours) || 0)), priority: ["low", "med", "high", "urgent"].includes(x.priority) ? x.priority : "", status: ["todo", "doing", "done"].includes(x.status) ? x.status : ""})).filter(x => x.due || x.time || x.hours || x.priority || x.status); if (!o.edits.length) return null; }
    else if (a.type === "quick_add") { if (o.text.length < 4) return null; }
    else if (FILE_ACTS.includes(a.type)) { if (!hasFiles) return null; }
    else if (a.type === "breakdown" || a.type === "exam_plan") { if (!o.target) return null; }
    else if (a.type === "summarize_file") { if (!o.target) return null; }
    else if (GEN_ACTS.includes(a.type) && !hasFiles && o.text.length < 80) return null;
    return o;
  }).filter(Boolean).slice(0, 5);

  /* Making things with the AI on the device: tasks, timers and changes go through Ask's own steps (98-assist.js: a task read from the
     words with no model, a timer started at once, a change to confirm); flashcards, a quiz or a note become the button that makes
     them, with the student's own notes on the topic (or the web's, when they have none) as the material. Null when it isn't a
     request to make or change something. */
  const CARDS_Q = /\b(make|create|generate|give me|build|write)\b[^?]*\b(flash ?cards?|cards|quiz(zes)?|practice (questions|test)|test me)\b|\bquiz me\b|\btest me\b/i;
  const EMPTY_DECK = /\b(empty|blank|new)\s+(flash ?card\s+)?(deck|set)\b|\b(create|make|start|add)\s+(a|an|one)?\s*(new\s+)?(flash ?card\s+)?(deck|set)\s+(called|named|for)\b/i;
  const NOTE_Q = /\b(save|make|write|add|create|put)\b[^?]*\bnote\b/i;
  const CHANGE_Q = /^\s*(please\s+)?((can|could|would) you\s+)?(please\s+)?(add|create|make|remind|schedule|start|set|move|change|reschedule|push|rename|delete|remove|mark|cancel|skip|put)\b/i;
  /* A concept map asked for in the chat: built right away (the sentences are read in code; just a topic goes to the AI), then an
     Open Map button. "Do it", "make it" after an earlier ask runs that ask. Any AI, not only the device. */
  const MAP_Q = /\b(concept|mind|idea)[ -]?maps?\b|\bmap (of|about|for|with|where)\b|\bmap\b[^?]*\b(in the (center|middle)|main idea|connected to|linked to)\b/i;
  const MAP_ASK = /\b(make|create|build|draw|generate|give me|i want|i need|can you|could you|put|add|start|set up)\b|^\s*(a|an|my)\b|\b(in the (center|middle)|main idea is|connected to|linked to)\b/i;
  const DOIT_Q = /^\s*(ok(ay)?|yes|yeah|yep|sure|please|go ahead|go|do it|do that|make it|make that|create it|build it|just do it|now)\b[^?]{0,40}$|^\s*(can|could|will|would) you (just )?(make|do|create|build|draw|put) (it|that|this|one)\b/i;
  async function mapAct(q, hint){
    if (!window.SBCMAP || !SBCMAP.createFrom) return null;
    // (a course named anywhere in the words, "a psych concept map", as well as "in BIOS 230": it went to General otherwise)
    const cn = window.SBTRUTH && SBTRUTH.courseIn ? SBTRUTH.courseIn(q) : null;
    const course = hint || (cn ? (cn.code || cn.name) : "") || (q.match(/\b(?:in|for|under|to) (?:my )?([A-Z][\w&.-]*(?: [A-Z0-9][\w&.-]*){0,3})(?: course| class)?\b/) || [])[1] || "";
    try {
      const r = await SBCMAP.createFrom(q.replace(/^\s*(please\s+)?((can|could|would) you\s+)?(please\s+)?/i, ""), course);
      return {answer: `I made ${r.name}${r.ideas ? ` with ${r.ideas} ideas` : ""} in ${r.where}. Tap Open Map to see it; you can drag, rename or add ideas there.`, sources: [], followUps: [], actions: [],
        mapOpen: {course: r.course, map: r.map, label: "Open Map"}};
    } catch (e) { return {answer: (e && e.message) || "I couldn't make that map. Try: Photosynthesis in the center, connected to sunlight, water and soil.", sources: [], followUps: [], actions: []}; }
  }
  // "do it" after an ask the app can make: that earlier ask, made now
  function pendingAsk(q, chat){
    if (!DOIT_Q.test(q)) return "";
    const prev = ((chat && chat.msgs) || []).filter(x => x.q).slice(-4).reverse();
    for (const x of prev) if ((MAP_Q.test(x.q) && MAP_ASK.test(x.q)) || CARDS_Q.test(x.q) || NOTE_Q.test(x.q) || CHANGE_Q.test(x.q)) return x.q;
    return "";
  }
  // "create a quiz based on this" with slides attached: straight from the words, made from the attached file (no AI step to work
  // out what was meant, and never a search of their notes or the web instead of the file they gave)
  function attStudy(q, att){
    const w = String(q || "").replace(/["“'‘][^"”'’]{2,200}["”'’]/g, " ");
    if (!att || !att.length || !(CARDS_Q.test(w) || /\b(quiz|flash ?cards?|practice (questions|test))\b/i.test(w))) return null;
    const quiz = /\bquiz|test me|practice (questions|test)\b/i.test(w) && !/flash ?cards?|\bcards\b/i.test(w), n = Number((w.match(/\b(\d{1,2})\b/) || [])[1]) || 0;
    const names = att.map(x => String(x.name || "your file")), name = names[0].replace(/\.[a-z0-9]{2,5}$/i, "").replace(/[_-]+/g, " ").trim().slice(0, 60) || "Study Set";
    const from = names.length === 1 ? names[0] : `your ${names.length} files`;
    return {answer: `Tap ${quiz ? "Make Quiz" : "Make Flashcards"} and I'll make ${n ? n + " " : ""}${quiz ? "practice questions" : "flashcards"} from ${from}.`, sources: [], followUps: [],
      actions: [{type: quiz ? "quiz" : "flashcards", label: quiz ? "Make Quiz" : "Make Flashcards", deckName: name, deck: "", target: "", style: "", count: n, course: "", board: "", noteTitle: "", text: ""}]};
  }
  async function deviceAct(q, chat, forced){
    const A = window.SBASSIST, TR = window.SBTRUTH; if (!A) return null;
    if (CARDS_Q.test(q.replace(/["“'‘][^"”'’]{2,200}["”'’]/g, " ")) && !EMPTY_DECK.test(q)) {
      const quiz = /\bquiz|test me|practice (questions|test)\b/i.test(q) && !/flash ?cards?|cards/i.test(q), n = Number((q.match(/\b(\d{1,2})\b/) || [])[1]) || 0;
      let topic = clip((q.match(/\b(?:on|about|for|from|covering|over)\s+(.+?)[?.!]*$/i) || [])[1] || q.replace(CARDS_Q, "").replace(/^\W+|\W+$/g, ""), 80);
      // who it's for isn't what it's about: "a quiz for the group", "for my study group", "for us"
      topic = topic.replace(/^(?:(?:my|our|the)\s+)?(?:study\s+)?(?:group|class|team|friends|us|everyone|them)\b\s*/i, "").trim();
      // words that point at something, not a subject: never looked up on the web (a file that isn't attached made 17 cards about torrent
      // files; "the questions I got wrong" made 18 about the game show "500 Questions"; "for the group" made a quiz about groups)
      const tl = topic.toLowerCase().replace(/[^a-z0-9' ]+/g, " ").replace(/\s+/g, " ").trim();
      if (/\b(this|that|the|my|attached)\s+(file|pdf|doc|document|slides?|deck of slides|picture|photo|image|screenshot|reading)\b/.test(tl) || /^(this|that|it|these|those)$/.test(tl))
        return {answer: "Attach the file with the paperclip (or a photo of the page), then ask again, and I'll make " + (quiz ? "a quiz" : "flashcards") + " from it. A file already in Studyboard: open it in Files and tap " + (quiz ? "Make Quiz" : "Make Flashcards") + ".", sources: [], followUps: [], actions: []};
      if (/\b(got wrong|i missed|missed ones?|wrong ones?|wrong answers?|my mistakes|i got wrong|i messed up)\b/.test(tl))
        return {answer: "I can't see which questions you got wrong from here. Open the quiz in Flashcards: after you take it, its results show the ones you missed. Or tell me the topics, and I'll make " + (quiz ? "a quiz" : "cards") + " on those.", sources: [], followUps: [], actions: []};
      if (!tl || /^(group|class|team|us|them|it|that|this|something|stuff|anything|everything|the group|my group)$/.test(tl)) {
        const lt = (chat && (chat.msgs || []).filter(x => x.q && x.a && x.a.know).slice(-1)[0]) || null;
        if (lt) topic = clip(String(lt.ask || lt.q).replace(/[?!.]+\s*$/, ""), 80);
        else return {answer: `What should the ${quiz ? "quiz" : "flashcards"} be on? For example: ${quiz ? "a quiz on defense mechanisms" : "flashcards on the cardiac cycle"}.`, sources: [], followUps: [], actions: [], awaiting: {d: {intent: quiz ? "make_quiz" : "make_flashcards"}, q: quiz ? "make a quiz on" : "make flashcards on"}};
      }
      let text = "", from = "";
      // a note they name ("my defense mechanisms note", "my cardiac cycle note"): that note, word for word
      { const tw = (String(topic || q).toLowerCase().match(/[a-z0-9]{3,}/g) || []).filter(w => !/^(my|the|note|notes|from|into|turn|make|flashcards?|cards?|deck|quiz|about|for|on|some|me|please|lecture)$/.test(w));
        const nt = tw.length ? notesArr().filter(n => n && !n.archived && n.text).map(n => ({n, sc: tw.filter(w => String(n.text).split("\n")[0].toLowerCase().includes(w.slice(0, 5))).length})).filter(x => x.sc >= Math.max(1, Math.ceil(tw.length / 2))).sort((a, b) => b.sc - a.sc)[0] : null;
        if (nt && String(nt.n.text).length >= 60) { text = String(nt.n.text); from = "your note"; } }
      try { if (!text) { const R = window.SBSEARCH ? await SBSEARCH.retrieve(topic || q, {max: 8, chars: 1200, wait: 800, readWait: 2, semWait: 2500}) : null; if (R && R.text && R.text.length > 300) { text = R.text.replace(/^\[\d+\] [^\n]*\n/gm, ""); from = "your notes"; } } } catch (e) {}
      if (!text && TR && topic) { const W = await TR.research(topic).catch(() => ({list: []})); if (W.list && W.list.length) { text = W.list.map(x => `${x.title}\n${x.text}`).join("\n\n"); from = W.list.some(x => /paper/i.test(x.src || "")) ? "Wikipedia and research papers" : "Wikipedia"; } }
      if (text.length < 120) return forced ? null : {answer: `I couldn't find material on ${topic || "that"} in your notes or on the web. Add notes or a file about it (or attach one here), and I'll make ${quiz ? "a quiz" : "flashcards"} from it.`, sources: [], followUps: [], actions: []};
      const name = (String(topic || "").replace(/\b(my|the|note|notes|lecture|from|into|turn)\b/gi, " ").replace(/\s+/g, " ").trim() || "Study Set").replace(/\b\w/g, ch => ch.toUpperCase()).slice(0, 60);
      // asked for in so many words ("make flashcards from my notes on X", "turn X into flashcards"): made now, into a new deck, and the
      // chat carries on from it ("add one more about denial"); "quiz me" and the like still offer the button
      // their own notes written as "Term: meaning" lines: a card for each term, word for word (every term, quickly, on any engine; a small
      // model makes one or two). The terms they named ("displacement and repression"), else every term in the note
      if (!quiz && /^your note/.test(from) && /\b(make|create|generate|build|write|turn|convert|flash ?cards?|cards)\b/i.test(q)) {
        const TL = /^\s*[-•*]?\s*([A-Z][^:\n]{1,50}?)\s*:\s+(.{6,})$/;
        const lines = String(text).split("\n").map(l => TL.exec(l.trim())).filter(Boolean).map(m => ({t: m[1].trim(), d: m[2].trim()})).filter(x => x.t.split(/\s+/).length <= 6);
        const tw = (String(topic).toLowerCase().match(/[a-z0-9]{4,}/g) || []).filter(w => !/^(note|notes|from|about|make|cards?|flashcards?|deck|some|please|them|these|those|mine)$/.test(w));
        const named = lines.filter(x => tw.some(w => x.t.toLowerCase().includes(w.slice(0, 5))));
        let pick = named.length ? named : lines; if (n) pick = pick.slice(0, n);
        if (pick.length >= 2 || (pick.length === 1 && named.length)) {
          const d = normDeck({id: uid(), created: Date.now(), name, courseId: ""});
          d.cards = pick.map(x => ({id: uid(), front: x.t.split(/\s+/).length <= 3 && !/[()]/.test(x.t) ? `What is ${x.t}?` : `${x.t}?`, back: x.d, box: 0, due: "", seen: 0, right: 0, wrong: 0, ai: false, src: "your notes"})); d.updated = Date.now();
          saveDeck(d, `Made ${d.cards.length} cards in ${name}`);
          return {answer: `Made ${d.cards.length} flashcard${d.cards.length === 1 ? "" : "s"} in a new deck, ${name}, from ${from}:\n${d.cards.slice(0, 5).map(x => `- ${x.front}`).join("\n")}${d.cards.length > 5 ? `\n…and ${d.cards.length - 5} more.` : ""}\nSay "undo" to take them back.`, sources: ["Your notes"], followUps: [], actions: [], card: {deck: d.id}, ref: {kind: "deck", id: d.id}};
        }
      }
      if (!quiz && /\b(make|create|generate|build|write|turn|convert)\b/i.test(q) && typeof aiMakeStudySet === "function" && aiOk()) {
        T.status = "Making your flashcards…"; draw();
        try {
          const r = await aiMakeStudySet({sources: [{name, kind: "Text", size: text.length, part: {text: text.slice(0, 12000)}}], style: "", difficulty: "mixed", cards: true, quiz: false, cases: false, caseCount: "1", caseStyle: "auto", cardCount: n ? String(n) : "auto", quizCount: "10", courseName: ""}, s => { T.status = clip(s, 40); drawStatus(); });
          const cards = ((r && r.cards) || []).filter(x => !x.check && String(x.front || "").trim() && String(x.back || "").trim());
          if (cards.length) {
            const d = normDeck({id: uid(), created: Date.now(), name, courseId: ""});
            d.cards = cards.map(x => ({id: uid(), front: x.front.trim(), back: x.back.trim(), box: 0, due: "", seen: 0, right: 0, wrong: 0, ai: true, src: x.source || ""})); d.updated = Date.now();
            saveDeck(d, `Made ${cards.length} cards in ${name}`);
            return {answer: `Made ${cards.length} flashcard${cards.length === 1 ? "" : "s"} in a new deck, ${name}, from ${from}:\n${cards.slice(0, 4).map(x => `- ${x.front.trim()}`).join("\n")}${cards.length > 4 ? `\n…and ${cards.length - 4} more.` : ""}\nSay "undo" to take them back.`, sources: [from === "your notes" || from === "your note" ? "Your notes" : from], followUps: [], actions: [], card: {deck: d.id}, ref: {kind: "deck", id: d.id}};
          }
        } catch (e) { if (stopsHere(e)) throw e; }
      }
      return {answer: `I gathered material on ${topic || "that"} from ${from}. Tap ${quiz ? "Make Quiz" : "Make Flashcards"} and I'll make ${n ? n + " " : ""}${quiz ? "practice questions" : "cards"} from it.`, sources: [from === "your notes" ? "Your notes" : from], followUps: [],
        actions: [{type: quiz ? "quiz" : "flashcards", label: quiz ? "Make Quiz" : "Make Flashcards", deckName: name, deck: "", target: "", style: "", count: n, course: "", board: "", noteTitle: "", text: text.slice(0, 12000)}]};
    }
    // a note for a named board, or one more involved than "make a note that says X": the AI step reads where it goes
    if (NOTE_Q.test(q) && /\b(?:on|in|to|onto)\s+(?:my|the)\s+(?!(?:note ?)?board\b)[\w &'-]{1,30}?\s+(?:note ?)?board\b/i.test(q.replace(/["“'][^"”']*["”']/g, ""))) return null;
    if (NOTE_Q.test(q)) {
      // the words they gave: quoted, after a colon, or after "put / write / text / saying ..." (with "in it", "on it" dropped)
      const tail = q.replace(/^.*?\bnote\b/i, " ");
      const own = (q.match(/["“']([^"”']{1,2000})["”']/) || q.match(/\bnote\b[^:]*:\s*(.+)$/i)
        || tail.match(/\b(?:put|write|add|type|with|containing|that (?:says|reads)|saying|reading|text|says)\s+(?:the\s+)?(?:text|words?|message)?\s*(?:of\s+)?[:\-]?\s*(.+?)\s*(?:\b(?:in|on|inside) (?:it|the note|there)\b)?[.\s]*$/i)
        || tail.match(/\b(?:about|on)\s+(.+)$/i) || [])[1] || "";
      let text = String(own || "").replace(/\s*\b(?:in|on|to) (?:my |the )?(?:board|notes?)\b.*$/i, "").trim();
      const prevRef = /^(this|that|it|the (answer|reply|last (answer|reply)))\b/i.test(text) || /\b(this|that|your (answer|reply))\b\s*(as a note)?\s*$/i.test(q);
      if (!text || prevRef) { if (!prevRef && !/\b(this|that|it|answer|reply)\b/i.test(q)) return forced ? null : {answer: "What should the note say? For example: make a note that says Lab moved to Friday.", sources: [], followUps: [], actions: []};
        const prev = ((chat && chat.msgs) || []).filter(x => x.a && x.a.answer && !(x.a.actions || []).length && !(x.a.changes || []).length && !x.a.mapOpen && (x.a.sources || []).length + String(x.a.answer).length > 60).slice(-1)[0];
        if (!prev) return {answer: "What should the note say? For example: make a note that says Lab moved to Friday.", sources: [], followUps: [], actions: []};
        text = prev.a.answer; }
      text = String(text || "").trim();
      if (!text) return null;
      return {answer: "Done. I put the note on your board.", sources: [], followUps: [], actions: [{type: "note", label: "Save Note", auto: true, deckName: "", deck: "", target: "", style: "", count: 0, course: "", board: "", noteTitle: "", text: text.slice(0, 12000)}]};
    }
    // (taking a mark off isn't deleting the task: "remove the grade from a&p lab 1" goes to the step that says so)
    // several tasks named ("the quiz and the lab report for A&P, both"): the step that changes each of them, not the one-task path
    if (CHANGE_Q.test(q) && !(A.timerMins && A.timerMins(q)) && (tasksSel(q, chat) || []).length >= 2) return null;
    if ((CHANGE_Q.test(q) || (A.timerMins && A.timerMins(q))) && !(/\b(remove|delete|clear|take off|erase|get rid of)\b/i.test(q) && /\b(grades?|marks?|scores?|results?|percent|points)\b/i.test(q) && !/\b(the (task|assignment|whole thing)|and the grade|everything)\b/i.test(q))) {
      const res = await A.ask(q, {screen: false});
      // (a reply the app wrote itself after doing it, "Nice work! I marked Lab 4 done", is never a claim to check: only the AI's are)
      if (!res || (!(res.changes || []).length && !res.timer && !res.local && !forced && A.CLAIMS.test(res.answer || ""))) return null;
      // a change to their tasks asked for in so many words: done now (Undo, or "undo", takes it back), not left to confirm
      const ch = (res.changes || []).filter(c => c && c.t && (c.t.kind === "task" || c.t.kind === "newtask"));
      // the same checks as the intent step: taking a mark off never deletes the task; a rename of "it" with nothing to point at and a name
      // their words never say is asked about, not guessed
      { const w = String(q).toLowerCase(), said = v => (String(v || "").toLowerCase().match(/[a-z0-9&]{4,}/g) || []).some(x => w.replace(/\bto\b.*$/, "").includes(x));
        if (ch.some(c => c.field === "delete") && /\b(grades?|marks?|scores?|results?|percent|points)\b/.test(w) && !/\b(the (task|assignment|whole thing)|and the grade|everything)\b/.test(w))
          return {answer: `I can't take a mark off from the chat yet, so I didn't change anything (${ch.find(c => c.field === "delete").label} and its mark are as they were). Open the task and clear its mark, or tell me the right mark and I'll save that instead.`, sources: [], followUps: [], actions: []};
        const R = ((chat && chat.msgs) || []).slice(-3).some(x => x.a && (x.a.ref || (x.a.changes || []).length));
        const named = l => { const ws = (String(l || "").toLowerCase().match(/[a-z0-9&]{4,}/g) || []); return !!ws.length && ws.filter(x => w.replace(/\b(?:to|as)\b.*$/, "").includes(x)).length >= Math.ceil(ws.length * 2 / 3); };
        if (!R && ch.some(c => c.field === "title" && c.t.kind === "task") && /\b(it|that|this|them)\b/.test(w) && !ch.filter(c => c.field === "title").every(c => named(c.label)))
          return {answer: /\bgroups?\b/.test(String(((chat && chat.msgs) || []).slice(-1).map(x => x.q).join(" ")).toLowerCase()) ? "A study group is named when you make it: open Groups, tap New Group, and name it there (groups need you signed in)." : "Which one should I rename? Say its name, for example: rename Care Plan 2 to ...", sources: [], followUps: [], actions: []}; }
      if (ch.length && ch.length === (res.changes || []).length && A.build) {
        if (ch.every(c => c.from && c.from === c.to)) return {answer: `${ch[0].label} is already ${String(ch[0].to).toLowerCase()}.`, sources: [], followUps: [], actions: []};
        const built = A.build(ch); if (built.length) {
          const adds = ch.filter(c => c.t.kind === "newtask"), lab = adds.length === ch.length ? (adds.length === 1 ? `Added "${clip(adds[0].label, 40)}"` : `Added ${adds.length} tasks`) : ch.length === 1 ? (ch[0].field === "delete" ? `Deleted ${ch[0].label}` : `${ch[0].label}: ${ch[0].what.toLowerCase()} changed`) : `Made ${ch.length} changes`;
          applyChanges(built, lab);
          const say1 = c => c.t.kind === "newtask" ? `Added ${c.label}${c.to ? `, ${c.to}` : ""}` : c.field === "delete" ? `Deleted ${c.label}` : c.field === "status" && c.value === "done" ? `Nice work! I marked ${c.label} done` : `${c.label}: ${c.what.toLowerCase()} is now ${c.to}`;
          // what was done, so "same for chapter 7" or "no, I meant the essay" can do it again to another task (as the intent step's do)
          const c0 = ch[0], ST = {done: "mark_done", doing: "mark_in_progress", todo: "mark_not_done"};
          const di = ch.length === 1 && c0.t.kind === "task" ? (c0.field === "status" ? ST[c0.value] : {priority: "set_priority", due: "move_task", delete: "delete_task", course: "task_course"}[c0.field]) : "";
          const did = di ? Object.assign({intent: di, task: c0.label}, di === "set_priority" ? {priority: c0.value} : {}) : undefined;
          return {answer: ch.map(say1).join(". ") + ". Say \"undo\" to take it back.", sources: [], followUps: [], actions: [], did};
        }
      }
      const pk = A.pack(res);
      // (an edit Ask made straight away: what it did, so "same for chapter 7" can do it again to another task)
      const e0 = (res.edits || []).length === 1 && res.edits[0].kind === "task" ? res.edits[0] : null, SD = {done: "mark_done", doing: "mark_in_progress", todo: "mark_not_done"};
      const di0 = e0 ? (e0.field === "status" ? SD[e0.value] : {priority: "set_priority", due: "move_task", delete: "delete_task", course: "task_course"}[e0.field]) : "";
      const did0 = di0 ? Object.assign({intent: di0, task: e0.label}, di0 === "set_priority" ? {priority: e0.value} : {}) : undefined;
      return {answer: res.answer, sources: [], followUps: [], actions: [], changes: pk.changes.length ? pk.changes : undefined, show: pk.show.length ? pk.show : undefined, awaiting: res.awaiting, did: did0};
    }
    return null;
  }
  /* ---------- Understanding a request, however it's worded ----------
     The AI reads the message (and the last exchange, so "it's done now" knows what "it" is) and picks ONE action from a fixed list,
     with its details, in a fixed answer shape (small models are far better at choosing from a list than at acting in free text).
     Studyboard then does the action itself, checks it happened, and says so in its own words: the AI never claims something
     was done. A question or a chat isn't an action: it goes on to be answered as before. */
  const INTENTS = ["question", "chat", "mark_done", "mark_not_done", "mark_in_progress", "move_task", "rename_task", "delete_task", "set_priority", "add_task", "add_event", "add_course", "add_note",
    "start_timer", "stop_timer", "pause_timer", "resume_timer", "undo", "make_flashcards", "make_quiz", "make_map", "find_notes",
    "delete_item", "rename_item", "open_item", "edit_item", "change_setting", "set_theme", "wear_accessory", "remove_accessory",
    "add_card", "make_deck", "study_deck", "add_mark", "new_group", "join_group", "open_page", "cant"];
  const KINDS = ["task", "event", "course", "deck", "quiz", "note", "board", "file"];
  const ISCHEMA = {type: "OBJECT", properties: {
    intent: {type: "STRING", enum: INTENTS},
    task: {type: "STRING", description: "the existing task it's about, in the student's words or as listed; \"it\" if they only say it/that"},
    title: {type: "STRING", description: "the name of a new task, event or course, or a task's new name"},
    course: {type: "STRING", description: "a course name or code, if named"},
    code: {type: "STRING", description: "a new course's code, like BIO 110"},
    instructor: {type: "STRING"},
    date: {type: "STRING", description: "YYYY-MM-DD, worked out from today's date"},
    time: {type: "STRING", description: "24-hour HH:MM"},
    end: {type: "STRING", description: "24-hour HH:MM end time"},
    where: {type: "STRING"},
    minutes: {type: "NUMBER"},
    priority: {type: "STRING", enum: ["urgent", "high", "med", "low"]},
    text: {type: "STRING", description: "a note's exact words; PHOTO_TEXT if the note should say what the attached picture says"},
    board: {type: "STRING", description: "the note board named, if any"},
    topic: {type: "STRING", description: "the topic for flashcards, a quiz, a map or a note search"},
    kind: {type: "STRING", enum: KINDS, description: "for delete_item, rename_item, open_item, edit_item: what sort of thing it is"},
    item: {type: "STRING", description: "for delete_item, rename_item, open_item, edit_item: its name as the student says it"},
    field: {type: "STRING", description: "for edit_item: what to change (instructor, room, code, where, notes, front, back...); for change_setting: the setting"},
    value: {type: "STRING", description: "for edit_item and change_setting: the new value; for add_mark the mark (85, 85%, 17/20); for join_group the invite code; for open_page the page"},
    front: {type: "STRING", description: "for add_card: the card's front"}, back: {type: "STRING", description: "for add_card: the card's back"},
    deck: {type: "STRING", description: "for add_card and study_deck: the deck named"}},
    required: ["intent"]};
  const ISYS = `You read one message a student sent to their study planner's assistant and decide what it wants. Pick exactly ONE intent:
question: they want information or an explanation (about their planner or any subject). chat: greetings, feelings, thanks, small talk.
mark_done: a task is finished ("I finished X", "X is done", "just submitted X", "it's done now", "check off X", "done with X").
mark_not_done: undo a task being done. mark_in_progress: they started or are working on a task (not a timer).
move_task: change a task's due date or time. rename_task. delete_task. set_priority.
add_task: something to do or hand in (homework, essay, reading, exam, "remind me to").
add_event: something at a time on the calendar that isn't a task to hand in (practice, dance, game, appointment, meeting, party, shift, club).
add_course: a new class or course to add (with a name and maybe a code or instructor).
add_note: put words on a sticky note or note board. If they want the note to say what an attached photo says, text is PHOTO_TEXT; if they want the picture itself pinned on a note, text is PHOTO_ITSELF.
start_timer, stop_timer, pause_timer, resume_timer: the focus timer. undo: reverse the last change.
make_flashcards, make_quiz, make_map (a concept or mind map), find_notes (find their own notes on a topic).
For anything else in the app (decks, quizzes, notes, note boards, calendar events, courses, files): delete_item, rename_item (title is the new name), open_item (go to it, show it), edit_item (field and value), with kind and item. For a task, use the task intents above.
set_theme: change how Studyboard looks: a theme by name (value), dark or light mode (value "dark", "light" or "system"), a flashcard style or note shape (field "card" or "note", value the name).
wear_accessory, remove_accessory: dress the companion (value is the accessory, like scarf or glasses; "all" to take everything off).
change_setting: any other Studyboard setting (text size, language, notifications, study hours, reminders, calendar sync...), with field and value.
add_card: one flashcard into a deck they name (front, back, deck). make_deck: a new empty flashcard deck (title, maybe course). study_deck: start studying a deck (deck).
add_mark: they got a mark on a piece of work ("I got 85 on Lab 4": task "Lab 4", value "85"). new_group: start a study group or group project (title; value "project" for a project). join_group: join a group with an invite code (value).
open_page: go to a part of Studyboard (value: today, calendar, flashcards, notes, courses, files, groups, grades, settings, companion).
cant: they want something done that none of these can do (book a flight, email the professor, submit to the school site, buy something). Never pick add_note just because nothing else fits.
Fill only the fields the message gives. Dates are YYYY-MM-DD worked out from today; times are 24-hour HH:MM. If the message says "it" or "that" for a task, put "it" in task.
Examples:
"I just finished homework 4!" -> {"intent":"mark_done","task":"homework 4"}
"It's now done" (after talking about Homework 4) -> {"intent":"mark_done","task":"it"}
"Add Dance to my calendar for november 23rd at 4pm" -> {"intent":"add_event","title":"Dance","date":"(Nov 23 as YYYY-MM-DD)","time":"16:00"}
"add BIOL 2010 anatomy with dr smith as a new course" -> {"intent":"add_course","title":"Anatomy","code":"BIOL 2010","instructor":"Dr. Smith"}
"add a card to my bio deck: front mitosis, back cell division" -> {"intent":"add_card","deck":"bio","front":"mitosis","back":"cell division"}
"I got 17/20 on quiz 3" -> {"intent":"add_mark","task":"quiz 3","value":"17/20"}
"create a study group called P3" -> {"intent":"new_group","title":"P3"}
"email my prof that I'll be late" -> {"intent":"cant"}
"Make me a note in my pro board that says exactly what this photo says" -> {"intent":"add_note","text":"PHOTO_TEXT","board":"Pro"}
"jot down that the lab moved to friday" -> {"intent":"add_note","text":"The lab moved to Friday"}
"I have a bio midterm on december 3rd" -> {"intent":"add_task","title":"Bio Midterm","course":"bio","date":"(Dec 3)"}
"I have work saturday from 9 to 5" -> {"intent":"add_event","title":"Work","date":"(Saturday)","time":"09:00","end":"17:00"}
"history is in room 204" -> {"intent":"edit_item","kind":"course","item":"history","field":"room","value":"204"}
"push the essay to next week" -> {"intent":"move_task","task":"essay","date":"(next week)"}
"kill the timer" -> {"intent":"stop_timer"}
"start a 15 minute focus session on the history essay" -> {"intent":"start_timer","minutes":15,"task":"history essay"}
"scratch the lab report, it got cancelled" -> {"intent":"delete_task","task":"lab report"}
"nvm put it back" -> {"intent":"undo"}
"Can you delete my pop deck?" -> {"intent":"delete_item","kind":"deck","item":"pop"}
"rename the bio board to Cells" -> {"intent":"rename_item","kind":"board","item":"bio","title":"Cells"}
"take me to my chem quiz" -> {"intent":"open_item","kind":"quiz","item":"chem"}
"change the instructor for BIOS 230 to Dr. Lee" -> {"intent":"edit_item","kind":"course","item":"BIOS 230","field":"instructor","value":"Dr. Lee"}
"make bio green" -> {"intent":"edit_item","kind":"course","item":"bio","field":"color","value":"green"}
"get rid of the dentist appointment" -> {"intent":"delete_item","kind":"event","item":"dentist appointment"}
"switch to dark mode" -> {"intent":"set_theme","value":"dark"}
"use the sakura theme" -> {"intent":"set_theme","value":"sakura"}
"put your scarf on" -> {"intent":"wear_accessory","value":"scarf"}
"turn off reminders" -> {"intent":"change_setting","field":"reminders","value":"off"}
"what's the krebs cycle" -> {"intent":"question"}
"what do I have due friday" -> {"intent":"question"}
"ugh I'm so tired" -> {"intent":"chat"}`;
  const DOW = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const ISO_D = /^\d{4}-\d{2}-\d{2}$/, HM = /^([01]?\d|2[0-3]):[0-5]\d$/;
  const pad2 = n => String(n).padStart(2, "0");
  const hm = s => { const m = HM.exec(String(s || "").trim()); return m ? pad2(Number(s.split(":")[0])) + ":" + s.split(":")[1] : ""; };
  // the task meant: named words, or "it" (the last task the chat talked about)
  // open tasks first, then finished ones (renaming or moving a task that's done still works)
  /* Several tasks at once, from the words: the ones the last reply listed ("both", "all of them", "those", "the top two", "the first 3"),
     or every open task narrowed by a course and/or a day or range ("everything due this week", "all my a&p tasks", "all the psych stuff
     due friday"), minus any "except X". null when the words don't pick several; "everything" with nothing to narrow it is never one
     (too big a change to guess). */
  function tasksSel(q, chat, anyStatus){
    const w = String(q || "").toLowerCase(), TR = window.SBTRUTH;
    const pool = tasksArr().filter(t => anyStatus || t.status !== "done");
    const exM = /\b(?:except|but not|other than|besides|apart from|not including)\s+(?:for\s+)?(?:the\s+|my\s+)?(.+?)\s*[.!]*$/.exec(w);
    const drop = L => { if (!exM) return L; const xs = exM[1].split(/\s*(?:,|\band\b|&(?!p))\s*/).map(s => taskOf0(s, chat, true)).filter(Boolean); return L.filter(t => !xs.some(x => x.id === t.id)); };
    const lastA = ((chat && chat.msgs) || []).filter(x => x.a).slice(-1)[0], txt = lastA ? String(lastA.a.answer || "").toLowerCase() : "";
    const listed = txt ? pool.map(t => ({t, i: txt.indexOf(String(t.title || "").toLowerCase())})).filter(x => x.i >= 0 && x.t.title).sort((a, b) => a.i - b.i).map(x => x.t) : [];
    const NW = {two: 2, three: 3, four: 4, five: 5, "2": 2, "3": 3, "4": 4, "5": 5};
    let m;
    if (listed.length > 1 && (m = /\b(?:the\s+)?(?:top|first)\s+(two|three|four|five|[2-5])\b/.exec(w))) return drop(listed.slice(0, NW[m[1]]));
    if (listed.length > 1 && /\b(both|all of them|them all|all those|all of those|those|these|all these|each of them|every one of them|all \d+|the lot)\b/.test(w)) return drop(/\bboth\b/.test(w) ? listed.slice(0, 2) : listed);
    if (/\b(everything|every (?:task|assignment|thing)|all (?:of )?(?:my |the )?(?:[\w&]+ ){0,2}(?:tasks|stuff|work|assignments|homework|things|items|readings|labs|quizzes))\b/.test(w)) {
      let L = pool;
      const cn = TR && TR.courseIn ? TR.courseIn(q) : null; if (cn) L = L.filter(t => t.courseId === cn.id);
      // (the days that pick them, not the day they go to: "move everything due wednesday to friday")
      const sel = w.replace(/\b(?:to|till|until|onto|over to)\s+(?:next\s+)?(?:mon|tue|wed|thu|fri|sat|sun|tomorrow|today|the|dec|nov|jan|\d)\S*.*$/, "").replace(exM ? exM[0] : "\u0000", "");
      const r = TR && TR.range && /\b(today|tonight|tomorrow|week|weekend|monday|tuesday|wednesday|thursday|friday|saturday|sunday|overdue|late|next \d+ days)\b/.test(sel) ? TR.range(sel, todayISO()) : null;
      if (r) L = L.filter(t => t.due && t.due >= r.from && t.due <= r.to);
      if (!cn && !r) return null;
      return drop(L);
    }
    // named one by one: "tick off the quiz and the lab report for A&P", "mark care plan 2, the essay and chapter 7 done"
    // (each part names its own task; a course said once at the end goes with every part)
    // (not when each part has its own change: "care plan 2 to friday and the essay to monday", "finished care plan 2, start a timer for
    // the lab report")
    if (/,|\band\b|\b&\b(?!p)/.test(w) && (w.match(/\b(?:to|until|till)\b/g) || []).length < 2
      && !/(?:,|\band\b)\s*(?:then\s+)?(?:start|stop|add|create|make|delete|remove|rename|call|move|push|open|quiz|study|set a|put)\b/.test(w)) {
      const crs = (/\s+(?:for|in|from)\s+((?:my\s+|the\s+)?[\w&]+(?:\s+[\w&]+)?)\s*(?:,?\s*(?:both|all|too|as well|please|pls|handed in|submitted|done|finished|complete[d]?))*\s*[.!]*$/.exec(w) || [])[1] || "";
      const core = w.replace(/^\s*(?:please\s+|can you\s+|could you\s+)?(?:tick off|check off|cross off|mark|set|make|put|move|push|bump|finish(?:ed)?|completed?|submit(?:ted)?|i (?:did|finished|completed|handed in|submitted))\s+/, "")
        .replace(/\s+(?:for|in|from)\s+(?:my\s+|the\s+)?[\w&]+(?:\s+[\w&]+)?\s*(?:,?\s*(?:both|all|too|as well|please|pls|handed in|submitted|done|finished|complete[d]?))*\s*[.!]*$/, "")
        .replace(/[,\s]*\b(?:both|all|as done|done|finished|complete[d]?|handed in|submitted|in progress|high priority|low priority|urgent|to (?:high|low|urgent|medium)|priority|please|pls|too|as well)\b.*$/, "");
      const parts = core.split(/\s*(?:,|\band\b|\b&\b(?!p))\s*/).map(s => s.replace(/^(?:the|my|also)\s+/, "").trim()).filter(s => s.length > 1);
      if (parts.length >= 2) { const L = [];
        for (const s of parts) { const t = (crs && taskOf0(`${s} ${crs}`, chat, anyStatus)) || taskOf0(s, chat, anyStatus); if (!t) return null; if (!L.some(x => x.id === t.id)) L.push(t); }
        if (L.length >= 2) return L; }
    }
    return null;
  }
  function taskOf(name, chat, anyStatus){ return taskOf0(name, chat, anyStatus) || (anyStatus ? null : taskOf0(name, chat, true)); }
  function taskOf0(name, chat, anyStatus){
    const pool = tasksArr().filter(t => !t.archived && (anyStatus || t.status !== "done"));
    const low = s => String(s || "").toLowerCase().replace(/[^a-z0-9&' ]+/g, " ").replace(/\s+/g, " ").trim();
    // shorthand students use: hw4, hw 4, pset, assn, lab rep...
    const alias = s => low(s).replace(/\b([a-z]+)(\d+)\b/g, "$1 $2").replace(/\bhw\b|\bhwk\b|\bhmwk\b/g, "homework").replace(/\bp ?sets?\b|\bps\b(?= \d)/g, "problem set").replace(/\bassn\b|\basgmt\b|\bassgn\b/g, "assignment").replace(/\blab rep\b/g, "lab report").replace(/\bchem\b/g, "chem").replace(/\bmidterm\b/g, "midterm");
    let n = alias(name);
    const lastA = () => { const x = ((chat && chat.msgs) || []).filter(m => m.a && m.a.answer).slice(-1)[0]; return x ? String(x.a.answer) : ""; };
    // "the last one", "the first one", "the second": in the order the last answer listed them
    { const om = /^(?:the\s+)?(first|1st|second|2nd|third|3rd|fourth|4th|last|final|bottom|top)(?:\s+(?:one|task|thing|item))?$/.exec(n);
      if (om) { const A = low(lastA()), seen = pool.map(t => ({t, i: A.indexOf(low(t.title))})).filter(x => x.i >= 0).sort((a, b) => a.i - b.i).map(x => x.t);
        if (seen.length) { const k = {first: 0, "1st": 0, top: 0, second: 1, "2nd": 1, third: 2, "3rd": 2, fourth: 3, "4th": 3}[om[1]]; return k == null ? seen[seen.length - 1] : seen[k] || null; } } }
    // "the thing due tomorrow", "whatever's due friday": the one task due then
    { const dm = /\bdue\s+(today|tonight|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/.exec(n);
      if (dm && window.SBTRUTH && SBTRUTH.range) { const r = SBTRUTH.range(dm[0].replace(/^due\s+/, ""), todayISO()); if (r) { const hit = pool.filter(t => t.due && t.due >= r.from && t.due <= r.to); if (hit.length === 1) return hit[0]; if (hit.length > 1) return null; } } }
    // "the one for dr okafor", "the history one", "my foundations thing": the course's only open task
    if (/^(?:the |my )?(?:one|thing|task|assignment|work)\b|\b(?:one|thing|stuff)$/.test(n) && window.SBTRUTH && SBTRUTH.courseIn) { const c = SBTRUTH.courseIn(name); if (c) { const hit = pool.filter(t => t.courseId === c.id); if (hit.length === 1) return hit[0]; } }
    if (!n || /^(it|that|this|that one|this one|the task|the one|the thing|my task)$/.test(n)) {
      const said = ((chat && chat.msgs) || []).slice(-6).reverse().map(x => low((x.q || "") + " " + (x.a ? x.a.answer : ""))).join(" | ");
      const hit = pool.map(t => ({t, i: said.indexOf(low(t.title))})).filter(x => x.i >= 0 && low(x.t.title).length > 2).sort((a, b) => a.i - b.i)[0];
      if (hit) return hit.t;
      for (const x of ((chat && chat.msgs) || []).slice(-4).reverse()) { const t2 = x.q && !/^\s*(it|that|this)\b/i.test(x.q) ? taskOf0(x.q.replace(/\b(it|that|this|done|finished|mark|submit|submitted|move|push|to|brightspace|canvas|my|the)\b/gi, " "), null, anyStatus) : null; if (t2) return t2; }
      const cur = typeof pomo !== "undefined" && pomo.taskId && state.tasks[pomo.taskId]; return cur || null;
    }
    const STOP = new Set("a an the my me i to for on of it is and task assignment".split(" "));
    const qw = n.split(" ").filter(w => w && !STOP.has(w));
    let best = null, bs = 0;
    // whole words, then the same word in another form ("reading" for "Read Chapter 7", "cardiac" for "Cardiac Cycle")
    pool.forEach(t => { const tw = low(t.title).split(" "); let sc = 0; qw.forEach(w => { if (tw.includes(w)) sc += /^\d+$/.test(w) ? 2 : 1; else if (w.length >= 4 && tw.some(x => x.length >= 4 && (x.startsWith(w) || w.startsWith(x)))) sc += 1; else if (w.length > 3 && tw.some(x => x.startsWith(w) || w.startsWith(x))) sc += 0.5; });
      if (low(t.title) === n) sc += 5; if (sc > bs) { bs = sc; best = t; } });
    return bs >= Math.min(1, qw.length) && best ? best : null;
  }
  function courseOfName(name){ const c = name ? findCourse(name) : null; return c || (name && window.SBTRUTH && SBTRUTH.courseNamed ? SBTRUTH.courseNamed(name) : null); }
  function boardNamed(name){
    const n = String(name || "").toLowerCase().replace(/\b(my|the|board|note ?board|notes?)\b/g, " ").replace(/\s+/g, " ").trim();
    if (!n || n === "my") return null;
    const bs = noteBoards(); return bs.find(b => b.name.toLowerCase() === n) || bs.find(b => b.name.toLowerCase().replace(/\s*board$/, "") === n) || bs.find(b => b.name.toLowerCase().startsWith(n) || n.startsWith(b.name.toLowerCase())) || null;
  }
  // the date and time from the student's own words first (exact), the AI's reading second
  function whenOf(q, d){
    // the short day names students type ("tues 3pm", "thurs", "weds")
    q = String(q || "").replace(/\btues\b/gi, "tuesday").replace(/\b(weds|wed)\b/gi, "wednesday").replace(/\b(thurs|thur|thu)\b/gi, "thursday").replace(/\bfri\b/gi, "friday").replace(/\bsat\b/gi, "saturday").replace(/\bmon\b/gi, "monday");
    // "same date as the care plan": that task's due date
    { const sm = /\bsame\s+(?:day|date|due date|deadline|time)?\s*as\s+(?:the\s+|my\s+)?(.{2,60}?)\s*[?.!]*$/i.exec(q); if (sm) { const t = taskOf(sm[1], null, true); if (t && t.due) return {date: t.due, time: t.time || ""}; } }
    const A = window.SBASSIST, lt = A && A.localTask ? A.localTask(" x " + q + " ") : null;
    let date = lt && lt.due ? lt.due : ISO_D.test(String(d.date || "")) ? d.date : "", time = lt && lt.time ? lt.time : hm(d.time);
    // "november 23rd", "nov 23", "11/23": a month and day the words name
    if (!date) { const MO = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"], m = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+(\d{1,2})(?:st|nd|rd|th)?\b/i.exec(q) || null, n = /\b(\d{1,2})\/(\d{1,2})\b/.exec(q);
      let mo = -1, day = 0; if (m) { mo = MO.indexOf(m[1].slice(0, 3).toLowerCase()); day = Number(m[2]); } else if (n) { mo = Number(n[1]) - 1; day = Number(n[2]); }
      if (mo >= 0 && day >= 1 && day <= 31) { const now = new Date(), y = now.getFullYear(), cand = `${y}-${pad2(mo + 1)}-${pad2(day)}`; date = cand < todayISO() ? `${y + 1}-${pad2(mo + 1)}-${pad2(day)}` : cand; } }
    // "in 3 days", "in a week", "in two weeks"
    if (!date) { const m = /\bin\s+(\d{1,2}|a|an|one|two|three|four|five|six|seven)\s+(days?|weeks?)\b/i.exec(q); if (m) { const n = ({a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7})[m[1].toLowerCase()] || Number(m[1]); date = addDays(todayISO(), n * (/^w/i.test(m[2]) ? 7 : 1)); } }
    // "the 30th", "on the 3rd": that day this month, or next month once it's past
    if (!date) { const m = /\b(?:the|on)\s+(\d{1,2})(?:st|nd|rd|th)\b/i.exec(q); if (m) { const day = Number(m[1]), now = new Date(); if (day >= 1 && day <= 31) { let y = now.getFullYear(), mo = now.getMonth(); if (day < now.getDate()) { mo++; if (mo > 11) { mo = 0; y++; } }
          // ("the 31st" in November: the next month that has a 31st, December)
          while (new Date(y, mo + 1, 0).getDate() < day) { mo++; if (mo > 11) { mo = 0; y++; } }
          date = `${y}-${pad2(mo + 1)}-${pad2(day)}`; } } }
    // a time range ("1-2", "1 to 2pm", "3:30-5", "from 6 till 8"): the start and the end; no am or pm is the afternoon or evening
    // from 1 to 7 (as "at 6" is), and a pm on the end goes with the start when the start is earlier
    let end = "";
    { const r = /\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*(?:-|–|to|until|till)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b(?!\s*(?:%|st|nd|rd|th|days?|weeks?|\/))/i.exec(q);
      if (r && !/\b(?:\d{1,2})\s*(?:-|–)\s*(?:\d{1,2})\s*\/|\b(?:ch(?:apter)?s?|pages?|pp?\.?|questions?|qs?|slides?|lectures?|weeks?|units?|modules?|sections?)\s*\d|\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{1,2}\s*(?:-|–|to)/i.test(q)
        && !new RegExp(`^\\s*(?:hours?|hrs?|h|minutes?|mins?|days?|weeks?|times|x|cards?|pages?|questions?)\\b`, "i").test(q.slice(r.index + r[0].length)) && Number(r[1]) <= 12 && Number(r[4]) <= 12 && Number(r[4]) >= 1) {
        const h24 = (h, ap, other) => { h = Number(h); if (ap) return h % 12 + (/^p/i.test(ap) ? 12 : 0); if (other && /^p/i.test(other) && h < 12) return h + 12; return h <= 7 ? h + 12 : h; };
        let s = h24(r[1], r[3], r[6] && Number(r[1]) <= Number(r[4]) ? r[6] : ""), e = h24(r[4], r[6], "");
        if (e <= s && e + 12 < 24) e += 12;
        if (e > s) { if (!time) time = pad2(s) + ":" + (r[2] || "00"); end = pad2(e) + ":" + (r[5] || "00"); } } }
    if (!time) { const t = /\b(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)/i.exec(q); if (t) { let h = Number(t[1]) % 12; if (/^p/i.test(t[3])) h += 12; time = pad2(h) + ":" + (t[2] || "00"); } }
    // "move it to 7", "at 6:30": an hour with no am or pm is the evening from 1 to 7 (classes and study groups), else as said
    if (!time) { const t = /\b(?:at|to|for|from)\s+(\d{1,2})(?::(\d{2}))?\b(?!\s*(?:%|st|nd|rd|th|days?|weeks?|hours?|hrs?|min|minutes?|pages?|cards?|questions?|\/|\.\d))/i.exec(q);
      if (t && Number(t[1]) >= 1 && Number(t[1]) <= 12) { let h = Number(t[1]); if (h <= 7) h += 12; time = pad2(h) + ":" + (t[2] || "00"); } }
    return {date, time, end};
  }
  // Anything in Studyboard by its name: decks, quizzes, notes, boards, events, courses, files (and tasks), best match first
  function itemsOf(kind){
    const out = [], L = (k, id, name, extra) => out.push(Object.assign({kind: k, id, name: String(name || "")}, extra || {}));
    if (!kind || kind === "task") tasksArr().filter(t => !t.archived).forEach(t => L("task", t.id, t.title));
    if (!kind || kind === "event") Object.values(state.events || {}).forEach(e => L("event", e.id, e.title, {date: e.date, start: e.start, end: e.end, repeats: !!e.repeat}));
    if (!kind || kind === "course") coursesArr().forEach(c => L("course", c.id, courseLabel(c), {alt: [c.name, c.code].filter(Boolean)}));
    if (!kind || kind === "deck") Object.values(state.decks || {}).filter(x => !x.quizOnly).forEach(x => L("deck", x.id, x.name));
    if (!kind || kind === "quiz") Object.values(state.decks || {}).forEach(x => (x.aiQuizzes || []).forEach(z => L("quiz", z.id, z.title, {deck: x.id})));
    if (!kind || kind === "note") notesArr().filter(n => !n.archived).forEach(n => L("note", n.id, String(n.text || "").split("\n")[0].slice(0, 80)));
    if (!kind || kind === "board") noteBoards().forEach(b => L("board", b.id, b.name));
    if (!kind || kind === "file") Object.values(state.files || {}).filter(f => !f.archived).forEach(f => L("file", f.id, f.name, {alt: [String(f.name || "").replace(/\.[^.]+$/, "")]}));
    return out;
  }
  function itemNamed(kind, name){
    const low = s => String(s || "").toLowerCase().replace(/[^a-z0-9&' ]+/g, " ").replace(/\s+/g, " ").trim();
    const n = low(name).replace(/\b(my|the|a|an|deck|quiz|note|board|event|course|class|file|flashcards?|cards?)\b/g, " ").replace(/\s+/g, " ").trim(); if (!n) return null;
    let best = null, bs = 0;
    itemsOf(kind).forEach(x => { [x.name].concat(x.alt || []).forEach(nm => { const m = low(nm); let sc = 0;
      // ("the REBT one": the initials of "Rational-emotive behavior therapy")
      const ini = (m.match(/[a-z0-9]+/g) || []).map(x => x[0]).join("");
      if (m === n) sc = 10; else if (/^[a-z]{3,6}$/.test(n.replace(/\s*one$/, "")) && ini.startsWith(n.replace(/\s*one$/, ""))) sc = 8; else if (m.startsWith(n) || n.startsWith(m) && m.length > 2) sc = 6; else if (m.includes(n)) sc = 4; else { const w = n.split(" "); sc = w.filter(x2 => m.split(" ").includes(x2)).length * 1.5; }
      if (sc > bs) { bs = sc; best = x; } }); });
    return bs >= 1.5 ? best : null;
  }
  const KIND_WORD = {task: "task", event: "event", course: "course", deck: "deck", quiz: "quiz", note: "note", board: "note board", file: "file"};
  async function itemAct(it, d, q, chat){
    const A = window.SBASSIST, say = answer => ({answer, sources: [], followUps: [], actions: []});
    const kind = KINDS.includes(d.kind) ? d.kind : "";
    const x = itemNamed(kind, d.item) || (kind ? itemNamed("", d.item) : itemNamed("", q));
    if (!x) return say(`I couldn't find ${kind ? "a " + KIND_WORD[kind] : "anything"} called "${clip(d.item || "", 60)}". Check the name, or tell me which ${kind ? KIND_WORD[kind] : "one"}.`);
    const W = KIND_WORD[x.kind], ref = {kind: x.kind, id: x.id, deck: x.deck, date: x.date, start: x.start, end: x.end, repeats: x.repeats};
    if (it === "open_item") {
      if (x.kind === "board") { ui.tab = "notes"; ui.noteBoard = x.id; try { localStorage.setItem(NB_KEY, x.id); } catch (e) {} render(); window.scrollTo(0, 0); }
      else if (A && A.jump) await A.jump(ref, {after: true});
      return say(`Here's ${x.name}.`);
    }
    if (it === "delete_item") {
      // (an empty deck, like one just made in the chat, goes without asking: nothing is lost, and Undo brings it back)
      const big = x.kind === "course" || (x.kind === "deck" && ((state.decks[x.id] || {}).cards || []).length > 0) || x.kind === "board";
      if (big && !(await askBox({title: `Delete ${x.name}?`, text: x.kind === "course" ? "The course is deleted. Its tasks stay on your board." : x.kind === "deck" ? "The deck and its cards and quizzes are deleted. You can undo right after." : "The board is deleted. Its notes move to My Notes.", yes: "Delete", no: "Keep It", danger: true}))) return say(`Okay, I kept ${x.name}.`);
      if (x.kind === "deck") applyChanges([{kind: "deck", id: x.id, after: null}], `Deleted ${x.name}`);
      else if (x.kind === "course") applyChanges([{kind: "course", id: x.id, after: null}], `Deleted ${x.name}`);
      else if (x.kind === "quiz") { const dk = clone(state.decks[x.deck]); dk.aiQuizzes = dk.aiQuizzes.filter(z => z.id !== x.id); dk.updated = Date.now(); applyChanges([{kind: "deck", id: dk.id, after: dk}], `Deleted ${x.name}`); }
      else if (x.kind === "board") { const mine = notesArr().filter(n => n.board === x.id); if (mine.length) applyChanges(mine.map(n => ({kind: "note", id: n.id, after: Object.assign(clone(n), {board: ""})})), null);
        state.settings = Object.assign({}, state.settings, {noteBoards: noteBoards().filter(b => b.id !== x.id), noteBoardsGone: ((state.settings || {}).noteBoardsGone || []).filter(g => g && g.id !== x.id).concat({id: x.id, at: Date.now()}).slice(-30)}); saveSettings();
        if (ui.noteBoard === x.id) { ui.noteBoard = ""; try { localStorage.setItem(NB_KEY, ""); } catch (e) {} } }
      else { const ch = A.check({ref: "X", field: "delete", value: "yes"}, new Map([["X", ref]])); if (!ch) return say(`I couldn't delete ${x.name}.`); applyChanges(A.build([ch]), `Deleted ${x.name}`); }
      render();
      const gone = x.kind === "quiz" ? !(state.decks[x.deck] && state.decks[x.deck].aiQuizzes.some(z => z.id === x.id)) : x.kind === "board" ? !noteBoards().some(b => b.id === x.id) : !({task: state.tasks, event: state.events, course: state.courses, deck: state.decks, note: state.notes, file: state.files}[x.kind] || {})[x.id];
      return say(gone ? `Deleted the ${W} ${x.name}.${x.kind === "board" ? " Its notes are in My Notes now." : " Say \"undo\" to bring it back."}` : `I couldn't delete ${x.name}.`);
    }
    if (it === "rename_item") {
      const nm = clip(String(d.title || d.value || "").trim(), 120); if (!nm) return say(`What should ${x.name} be called?`);
      if (x.kind === "board") { const nm2 = nm.slice(0, 40); state.settings = Object.assign({}, state.settings, {noteBoards: noteBoards().map(b => b.id === x.id ? Object.assign({}, b, {name: nm2}) : b)}); saveSettings(); render(); return say(`Renamed the note board ${x.name} to ${nm2}.`); }
      const field = {task: "title", event: "title", course: "name", deck: "name", quiz: "title", file: "name", note: "text"}[x.kind];
      const ch = A.check({ref: "X", field, value: nm}, new Map([["X", ref]])); if (!ch) return say(`I couldn't rename ${x.name}.`);
      applyChanges(A.build([ch]), `Renamed to ${nm}`); render(); return say(`Renamed the ${W} ${x.name} to ${nm}.`);
    }
    if (it === "edit_item") {
      const f = String(d.field || "").toLowerCase().trim(), v = String(d.value || "").trim();
      if (x.kind === "course" && /colou?r/.test(f + " " + q)) { const r = courseColor(state.courses[x.id], v || q); return say(r); }
      if (x.kind === "event" && /^(time|start|date|day|when|from)$/.test(f)) return eventMove(x, q, Object.assign({}, d, {date: f === "date" || f === "day" ? d.value : d.date, time: /time|start|from/.test(f) ? d.value : d.time}));
      // an event's length: "make it an hour longer", "30 min shorter", "make it 2 hours long" (its end time moves; its start stays)
      if (x.kind === "event" && (/^(duration|length|end|ends?)$/.test(f) || /\b(longer|shorter|shorten|lengthen|extend|hours? long|minutes? long|mins? long)\b/i.test(q) || /\b(?:make|change|set|cut|trim)\s+(?:it|that|this|the \w+)\s+(?:to\s+|just\s+|only\s+)?(?:\d+(?:\.\d+)?|a|an|one|two|three|half an?)\s*(?:hours?|hrs?|minutes?|mins?)\b/i.test(q))) {
        const ev = state.events[x.id], tm = s => { const m = /^(\d{1,2}):(\d{2})/.exec(String(s || "")); return m ? Number(m[1]) * 60 + Number(m[2]) : null; };
        const a = tm(ev && ev.from), b = tm(ev && ev.to), lw = String(q).toLowerCase();
        const NW = {a: 1, an: 1, one: 1, two: 2, three: 3, half: 0.5}, am = /\b(half an hour|half hour|an? hour and a half|(\d+(?:\.\d+)?|a|an|one|two|three)\s*(hours?|hrs?|h|minutes?|mins?|m))\b/.exec(lw);
        const mins = !am ? 0 : /half an hour|half hour/.test(am[1]) ? 30 : /hour and a half/.test(am[1]) ? 90 : (NW[am[2]] || Number(am[2])) * (/^h/.test(am[3]) ? 60 : 1);
        // ("an hour longer", "30 min shorter", "extend it by an hour": the length changes by that; "make it 30 min", "2 hours long",
        // "shorten it to an hour": the length is that)
        const by = /\b(longer|shorter|more|less|extra|extend(?:ed)? (?:it |that )?by|by)\b/.test(lw) && !/\b(?:to|long)\s*$|\bto\s+(?:\d|a\b|an\b|one|two|three|half)/.test(lw);
        if (a != null && mins) { let end = !by ? a + mins : (b != null ? b : a + 60) + (/\b(shorter|less|shorten)\b/.test(lw) ? -mins : mins);
          end = Math.max(a + 5, Math.min(23 * 60 + 59, end)); const to = `${String(Math.floor(end / 60)).padStart(2, "0")}:${String(end % 60).padStart(2, "0")}`;
          const ch = A.check({ref: "X", field: "to", value: to}, new Map([["X", ref]]));
          if (ch) { applyChanges(A.build([ch]), `Changed the end time`); render(); return say(`${x.name} now ends at ${fmtTime(to)}.`); } } }
      const field = ({task: {notes: "notes", note: "notes", description: "notes"}, event: {where: "where", location: "where", place: "where", room: "where", start: "from", time: "from", end: "to", notes: "notes", date: "date", title: "title", name: "title"}, course: {instructor: "instructor", teacher: "instructor", professor: "instructor", prof: "instructor", room: "room", code: "code", name: "name", title: "name"}, note: {text: "text", words: "text"}, deck: {name: "name"}, quiz: {title: "title", name: "title"}, file: {name: "name"}}[x.kind] || {})[f] || f;
      let val = v; if ((field === "from" || field === "to") && !/^\d/.test(v)) { const w = whenOf(v, {}); val = w.time || v; } if (field === "date") val = whenOf(v, {}).date || v;
      const ch = A.check({ref: "X", field, value: val}, new Map([["X", ref]])); if (!ch) return say(`I can't change "${f || "that"}" on the ${W} ${x.name} from here. Open it and change it there.`);
      applyChanges(A.build([ch]), `Changed ${ch.what.toLowerCase()}`); render(); return say(`Changed the ${ch.what.toLowerCase()} of ${x.name} to ${ch.to}.`);
    }
    return null;
  }
  // Themes, flashcard styles, note shapes and pins by name; light, dark or system mode
  function themeAct(d){
    const say = answer => ({answer, sources: [], followUps: [], actions: []});
    const v = String(d.value || d.item || d.title || "").toLowerCase().replace(/\b(theme|the|mode|style|skin|look)\b/g, " ").replace(/\s+/g, " ").trim(), f = String(d.field || "").toLowerCase();
    if (/^(dark|light|system|auto|automatic)$/.test(v)) { const m = v === "auto" || v === "automatic" ? "system" : v;
      // ("undo the dark mode" puts the mode it was on back)
      let prev = "system"; try { prev = localStorage.getItem(THEME_KEY) || "system"; } catch (e) {}
      if (typeof setTheme === "function") { setTheme(m); if (typeof undoStack !== "undefined" && prev !== m) undoStack.push({label: `Switched to ${m} mode`, at: Date.now(), done: false, quiet: true, undo: () => { setTheme(prev); render(); return 0; }}); } render(); return say(m === "system" ? "Studyboard now follows your device's light or dark setting." : `Switched to ${m} mode.`); }
    // "change my theme": which one is asked, with the ones they have
    if (!v || /^(my|a|the|your|new|different|another|some|it|this|that|me)$/.test(v)) { let have = []; try { have = (SKINS || []).filter(x => typeof owns !== "function" || owns("skin", x.id)).map(x => x.name).slice(0, 8); } catch (e) {}
      return Object.assign(say(`Which theme?${have.length ? ` You have: ${have.join(", ")}.` : ""} The Style Shop has them all.`), {awaiting: {d: {intent: "set_theme"}, q: "change the theme to"}}); }
    // (a colour name that's also a theme's name, "teal", is that theme: only a colour no theme is called is said to be a colour)
    if (Object.prototype.hasOwnProperty.call(NAMED, v) && !(SKINS || []).some(x => String(x.name || "").toLowerCase() === v || String(x.id || "").toLowerCase() === v)) return say(`\"${v}\" is a colour, not a theme. Say which theme (the Style Shop has them all), or what to make ${v}: a course, or something I'm wearing.`);
    const lists = f === "card" || /card/.test(f) ? [["card", CARD_STYLES]] : f === "note" || /note|shape/.test(f) ? [["note", NOTE_SHAPES]] : f === "pin" ? [["pin", PINS]] : [["skin", SKINS], ["card", CARD_STYLES], ["note", NOTE_SHAPES]];
    const sc = x => { const m = String(x.name || "").toLowerCase(), id = String(x.id || "").toLowerCase(); return m === v || id === v ? 10 : m.startsWith(v) || v.startsWith(m) ? 7 : m.includes(v) ? 5 : v.split(" ").filter(w => w.length > 2 && m.includes(w)).length * 2; };
    let best = null, bs = 0, bk = ""; lists.forEach(([k, L]) => (L || []).forEach(x => { const s0 = sc(x); if (s0 > bs) { bs = s0; best = x; bk = k; } }));
    if (!best || bs < 2) return say(`I couldn't find a theme called "${clip(v, 40)}". The Style Shop has them all.`);
    const W = {skin: "theme", card: "flashcard style", note: "note shape", pin: "pin"}[bk];
    if (typeof owns === "function" && !owns(bk, best.id)) return say(`${best.name} is a ${W} you haven't unlocked yet. Open the Style Shop to unlock it.`);
    if (bk === "skin") { saveStyle({skin: best.id}); applySkin(); }
    else if (bk === "card") saveStyle({card: best.id, cardAuto: best.id === "theme"});
    else if (bk === "note") saveStyle({note: best.id, noteAuto: false, notePicked: true});
    else saveStyle({pin: best.id, pinAuto: false, pinPicked: true});
    render(); return say(`Switched to the ${best.name} ${W}.`);
  }
  // A course's color from words ("green", "dark blue", "#ff8800"): the exact color with Pro's any-color, else the closest of the
  // colors everyone has
  const NAMED = {red: "#DC2626", crimson: "#B91C1C", maroon: "#7F1D1D", burgundy: "#7A1F3D", wine: "#7A1F3D", pink: "#EC4899", "hot pink": "#DB2777", rose: "#E11D48", magenta: "#C026D3", plum: "#7A1F6E",
    purple: "#7C3AED", violet: "#8B5CF6", lavender: "#A78BFA", indigo: "#4338CA", navy: "#1E3A8A", "dark blue": "#1E3A8A", blue: "#3B6FE0", "light blue": "#60A5FA", "sky blue": "#38BDF8", sky: "#38BDF8",
    cyan: "#06B6D4", turquoise: "#14B8A6", teal: "#0F766E", aqua: "#22D3EE", green: "#16A34A", "dark green": "#166534", forest: "#166534", emerald: "#10B981", mint: "#6EE7B7", lime: "#84CC16", olive: "#65A30D",
    yellow: "#EAB308", gold: "#CA8A04", mustard: "#B7860B", amber: "#F59E0B", orange: "#EA580C", coral: "#F97362", peach: "#FDBA74", salmon: "#FA8072", brown: "#92400E", tan: "#D2B48C", beige: "#D6C7A1",
    gray: "#6B7280", grey: "#6B7280", silver: "#9CA3AF", slate: "#5E6B7E", charcoal: "#374151", black: "#111827", white: "#F9FAFB"};
  function courseColor(c, words){
    if (!c) return "I couldn't find that course.";
    const w = String(words || "").toLowerCase();
    let hex = (/#[0-9a-f]{6}\b/i.exec(w) || [])[0] || "";
    if (!hex) { const names = Object.keys(NAMED).sort((a, b) => b.length - a.length), hit = names.find(n => new RegExp("\\b" + n + "\\b").test(w)); if (hit) hex = NAMED[hit]; }
    if (!hex && typeof COURSE_COLOR_NAMES !== "undefined") { const i = COURSE_COLOR_NAMES.findIndex(n => n && w.includes(String(n).toLowerCase())); if (i >= 0) hex = COURSE_COLORS[i]; }
    if (!hex) return `What color should ${courseLabel(c)} be? For example: make it green.`;
    const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
    const anyOk = typeof anyColorLocked === "function" && !anyColorLocked();
    let pick = hex.toUpperCase(), near = false;
    if (!anyOk && !COURSE_COLORS.some(x => x.toLowerCase() === hex.toLowerCase())) { const a = rgb(hex); let bd = 1e9; COURSE_COLORS.forEach(x => { const b = rgb(x), dd = (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2; if (dd < bd) { bd = dd; pick = x; } }); near = true; }
    if (String(c.color || "").toLowerCase() === pick.toLowerCase()) return `${courseLabel(c)} is already that color.`;
    applyChanges([{kind: "course", id: c.id, after: Object.assign(clone(c), {color: pick})}], `${courseLabel(c)} color changed`); render();
    const nm = typeof COURSE_COLOR_NAMES !== "undefined" ? COURSE_COLOR_NAMES[COURSE_COLORS.findIndex(x => x.toLowerCase() === pick.toLowerCase())] : "";
    return `Changed ${courseLabel(c)} to ${nm || pick}${near ? " (the closest of your colors; Pro picks any color exactly)" : ""}.`;
  }
  // An event to another day or time: it keeps its length
  function eventMove(x, q, d){
    const say = answer => ({answer, sources: [], followUps: [], actions: []}), ev = state.events[x.id]; if (!ev) return say("I couldn't find that event.");
    const w = whenOf(q, d); if (!w.date && !w.time) return say(`When should ${ev.title} be? For example: move it to 6pm, or to Friday.`);
    const n = clone(ev), mins = t => { const [h, m] = String(t || "0:0").split(":").map(Number); return h * 60 + m; }, hhmm = m => pad2(Math.floor(((m % 1440) + 1440) % 1440 / 60)) + ":" + pad2(((m % 60) + 60) % 60);
    if (w.date) n.date = w.date;
    if (w.time) { const len = ev.start && ev.end ? (mins(ev.end) - mins(ev.start) + 1440) % 1440 || 60 : 60; n.allDay = false; n.start = w.time; n.end = hhmm(mins(w.time) + len); }
    applyChanges([{kind: "event", id: ev.id, after: normEvent(n)}], `${ev.title} moved`); render();
    const k = state.events[ev.id]; return say(`Moved ${ev.title} to ${fmtDate(k.date)}${k.start ? ` at ${fmtTime(k.start)}` : ""}.`);
  }
  async function route(q, chat, att){
    const prev = ((chat && chat.msgs) || []).filter(x => x.q && x.a).slice(-1)[0];
    const now = new Date(), open = tasksArr().filter(t => !t.archived && t.status !== "done").slice(0, 40);
    const ctx = `Today is ${DOW[now.getDay()]} ${todayISO()}.${open.length ? `\nTheir open tasks: ${open.map(t => t.title).join("; ")}` : ""}${coursesArr().length ? `\nTheir courses: ${coursesArr().map(c => courseLabel(c)).join("; ")}` : ""}${noteBoards().length ? `\nTheir note boards: ${noteBoards().map(b => b.name).join("; ")}` : ""}${att && att.length ? `\nThey attached: ${att.map(x => x.name).join(", ")}` : ""}${prev ? `\nThe last exchange: student said "${clip(prev.q, 200)}"; assistant replied "${clip(prev.a.answer, 240)}"` : ""}`;
    // the smaller on-device models (Chrome's or Edge's built-in AI, Gemma 4 E2B, Apple's) get worked examples of the requests they
    // mix up most in Studyboard's tests; Gemma 4 E4B and the cloud models read the shorter list
    const small = typeof DEVAI !== "undefined" && typeof aiOnDevice === "function" && aiOnDevice() && DEVAI.kind !== "litert";
    const ask = extra => aiCall({task: "quickadd", system: ISYS + (small ? ISYS_SMALL : "") + (extra || ""), parts: [{text: `${ctx}\n\nThe message: "${q}"`}], schema: ISCHEMA, maxTokens: 400, temperature: 0});
    let r = await ask(), d = r && r.data && typeof r.data === "object" ? r.data : {};
    // the shape is checked here, whatever the model or its mode: an intent that isn't one of Studyboard's is asked for once more
    if (!INTENTS.includes(d.intent)) { try { r = await ask(`\n\nIMPORTANT: "intent" must be exactly one of: ${INTENTS.join(", ")}. Reply with only the JSON object.`); d = r && r.data && typeof r.data === "object" ? r.data : {}; } catch (e) {} }
    Object.keys(d).forEach(k => { if (k !== "intent" && d[k] != null && typeof d[k] !== "string" && typeof d[k] !== "number") d[k] = String(d[k]); });
    return INTENTS.includes(d.intent) ? d : {intent: "question"};
  }
  // a deck by name (exact, then contains), and one flashcard put into it
  const deckNamed = name => { const L = String(name || "").trim().toLowerCase().replace(/^(my|the)\s+/, "").replace(/\s+(deck|set|flashcards?)$/, ""); if (!L) return null;
    const all = typeof decksArr === "function" ? decksArr() : Object.values(state.decks || {}), nm = x => String(x.name || "").toLowerCase();
    return all.find(x => nm(x) === L) || all.find(x => nm(x).includes(L) || L.includes(nm(x))) || all.find(x => L.split(/\s+/).filter(w => w.length > 2).every(w => nm(x).includes(w))) || null; };
  function addCardTo(front, back, name){
    const say = a => ({answer: a, sources: [], followUps: [], actions: []});
    front = String(front || "").trim(); back = String(back || "").trim();
    if (!front || !back) return say("What should the front and back say? For example: add a card to Biology with front mitosis and back cell division.");
    const d = deckNamed(name), all = typeof decksArr === "function" ? decksArr() : [];
    if (!d) return say(`${name ? `You don't have a deck called "${name}".` : "Which deck should it go in?"} ${all.length ? `Your decks: ${all.slice(0, 6).map(x => x.name).join(", ")}${all.length > 6 ? "…" : ""}.` : "Make one first: say \"make a deck called Biology\"."}`);
    const nd = JSON.parse(JSON.stringify(d)); nd.cards = nd.cards || []; nd.cards.push({id: uid(), front, back, box: 0, due: "", seen: 0, right: 0, wrong: 0}); nd.updated = Date.now();
    saveDeck(nd, `Card added to ${d.name}`);
    return say(`Added to ${d.name}: "${front}" / "${back}". Say "undo" to take it back.`);
  }
  // a flashcard's front, back and deck, found wherever they are in the sentence
  function cardParse(w){
    w = String(w || "").trim();
    return (() => {
      // "add 'X' / 'Y' to Z" (no front/back words)
      const sl0 = /\b(?:add|put|make|create|new)\b[^"“']*["“']([^"”']{1,200})["”']\s*(?:\/|\||->|=)\s*["“']([^"”']{1,300})["”']\s+(?:to|in|into)\s+(?:the\s+|my\s+)?(.+?)\s*(?:deck|set)?\s*[.!?]*$/i.exec(w);
      if (sl0) return [null, sl0[1], sl0[2], sl0[3]];
      if (!/\b(?:add|make|create|put|new|write)\b/i.test(w) || !/\b(?:flash ?)?cards?\b/i.test(w) || !/\bfront\b/i.test(w) || !/\bback\b/i.test(w)) return null;
      const SAYS = "\\s*(?:side\\s*)?(?:that says|which says|saying|says|reading|that reads|is|=|:|of|as|with)?\\s*";
      const DECK = "(?:to|in|into|on|for)\\s+(?:the\\s+|my\\s+)?(?:deck|set)\\b";
      const grab = side => { const m = new RegExp("\\b" + side + "\\b" + SAYS + "[\"“']?(.+?)[\"”']?(?=\\s*(?:,|\\band\\b|\\bwith\\b)?\\s*(?:the\\s+|a\\s+)?(?:front|back)\\b|\\s+" + DECK + "|\\s*[.!?]*$)", "i").exec(w); return m ? m[1].trim() : ""; };
      // "add 'X' / 'Y' to Z", "add X | Y to Z"
      const sl = /["“']([^"”']{1,200})["”']\s*(?:\/|\||->|=)\s*["“']([^"”']{1,300})["”']\s+(?:to|in|into)\s+(?:the\s+|my\s+)?(.+?)\s*(?:deck|set)?\s*[.!?]*$/i.exec(w);
      if (sl) return [null, sl[1], sl[2], sl[3]];
      const dm = new RegExp(DECK + "\\s*(?:called\\s+|named\\s+)?[\"“']?(.+?)[\"”']?(?=\\s+(?:with|and|,|that)\\b|\\s*,|\\s*[.!?]*$)", "i").exec(w)
        || /\b(?:to|in|into|for)\s+(?:the\s+|my\s+)?["“']?([^"”',:]{2,60}?)["”']?\s*(?:deck|set)?\s*(?::|,|\s+with\b|\s+-\s)/i.exec(w)
        || /\b(?:to|in|into)\s+(?:the\s+|my\s+)?["“']?(.+?)["”']?\s+(?:deck|set)\b/i.exec(w);
      let front = grab("front"), back = grab("back"), deck = dm ? dm[1] : "";
      if (!deck) { const lead = /^\s*(?:in\s+|for\s+)?(?:the\s+|my\s+)?["“']?([^"”':,]{2,60}?)["”']?\s+(?:deck|set)\s*[:,-]/i.exec(w); if (lead) deck = lead[1].trim(); }
      // "... and back cell division to Biology": the deck is the last "to ..." (and isn't part of the back)
      if (!deck) { const tm = /\s+(?:to|into|in)\s+(?:the\s+|my\s+)?["“']?([^"”']{1,60}?)["”']?\s*[.!?]*$/i.exec(w); if (tm && back.endsWith(tm[1].trim())) { deck = tm[1].trim(); back = back.slice(0, back.length - tm[0].trim().length).trim(); } }
      return front && back && deck ? [null, front, back, deck] : null;
    })();
  }
  // a quiz (AI-made, inside a deck) by name; "my quiz", "that quiz", "the last quiz": the newest
  function quizNamed(name){
    const all = []; Object.values(state.decks || {}).filter(d => !d.archived).forEach(d => (d.aiQuizzes || []).forEach(z => all.push({d, z})));
    if (!all.length) return null;
    const L = String(name || "").toLowerCase().replace(/\b(my|the|a|an|this|that|last|latest|newest|recent|practice|quiz|test|questions?)\b/g, " ").replace(/\s+/g, " ").trim();
    const newest = () => all.slice().sort((a, b) => (b.z.created || 0) - (a.z.created || 0))[0];
    if (!L) return newest();
    return all.find(x => String(x.z.title || "").toLowerCase() === L) || all.find(x => String(x.z.title || "").toLowerCase().includes(L)) || all.find(x => String(x.d.name || "").toLowerCase().includes(L)) || null;
  }
  // a quiz's questions as flashcards in its deck: the question on the front, the right answer on the back
  function cardsFromQuiz(hit){
    const {d, z} = hit, nd = JSON.parse(JSON.stringify(d)), have = new Set((nd.cards || []).map(c => String(c.front).trim().toLowerCase()));
    let n = 0;
    (z.questions || []).forEach(x => {
      const front = String(x.stem || "").trim(); if (!front || have.has(front.toLowerCase())) return;
      const opts = x.options || [], cor = (x.correct || []).map(i => opts[i]).filter(v => v != null);
      const back = x.type === "short" || !opts.length ? String(x.answer || "").trim() : x.type === "order" ? cor.join(" → ") : cor.join("; ");
      if (!back) return;
      nd.cards.push({id: uid(), front, back, box: 0, due: "", seen: 0, right: 0, wrong: 0}); have.add(front.toLowerCase()); n++;
    });
    if (!n) return `Every question in ${z.title || "that quiz"} is already a card in ${d.name}.`;
    nd.updated = Date.now(); saveDeck(nd, `${n} card${n === 1 ? "" : "s"} from ${z.title || "a quiz"}`);
    return `Added ${n} card${n === 1 ? "" : "s"} to ${d.name} from ${z.title || "the quiz"}: each question on the front, its answer on the back. Say "undo" to take them back.`;
  }
  // a quiz from a deck (or from the deck a card is in): Make a Quiz, with that deck chosen
  /* A quiz in the chat, one question at a time, with no AI step (quick, and right on any engine): "quiz me on my heart cards", "test me
     on defense mechanisms", "ask me some questions about the therapeutic relationship". The questions come from a deck (its cards), or
     from a note's "Term: meaning" lines. Each answer is checked against the key words of the right one, then the next question;
     "next", "skip", "idk" show the answer; "stop" ends it with the score. A new request (not an answer) ends it quietly. */
  const QUIZ_START = /\b(?:quiz|test|drill)\s+me\b|\bask me (?:some |a few |\d+ )?(?:questions|q'?s)\b|\b(?:let'?s|lets|can we|wanna|want to)\s+(?:do\s+)?(?:a\s+)?(?:quick\s+)?(?:quiz|practice questions)\b/i;
  const QSTOPW = /^(the|and|for|with|from|that|this|these|those|into|onto|your|their|them|they|what|which|when|where|have|has|had|was|were|are|is|its|it's|of|to|in|on|at|by|or|an|a|be|as|so|um|uh|like|just|maybe|think|i|im|it|um|hmm)$/;
  const qWords = s => (String(s || "").toLowerCase().match(/[a-z0-9]+/g) || []).filter(w => !QSTOPW.test(w));
  function quizPool(topic){
    const t = String(topic || "").toLowerCase().replace(/\b(me|on|about|over|my|the|some|a|few|cards?|flash ?cards?|deck|notes?|note|stuff|please|pls|quiz|test|drill|questions?|q'?s|from|with|ask|again)\b/g, " ").replace(/[^a-z0-9& ]/g, " ").replace(/\s+/g, " ").trim();
    const decks = (typeof decksArr === "function" ? decksArr() : Object.values(state.decks || {})).filter(d => d && !d.archived && (d.cards || []).length);
    const shuffle = L => L.map(x => [Math.random(), x]).sort((a, b) => a[0] - b[0]).map(x => x[1]);
    const tw = qWords(t);
    if (t) { const dk = deckNamed(t) || decks.find(d => tw.length && tw.every(w => String(d.name).toLowerCase().includes(w.slice(0, 5))));
      if (dk && (dk.cards || []).length) return {name: dk.name, items: shuffle(dk.cards.map(c => ({q: String(c.front), a: String(c.back)}))).slice(0, 10)}; }
    // "the SA node card", "my heart cards": the cards about it first (the deck they're in)
    const aboutCards = () => { const cs = decks.flatMap(d => d.cards).filter(c => tw.some(w => (String(c.front) + " " + String(c.back)).toLowerCase().includes(w.slice(0, 5)))); return cs.length ? {name: t, items: shuffle(cs.map(c => ({q: String(c.front), a: String(c.back)}))).slice(0, 10)} : null; };
    if (tw.length && /\b(cards?|flash ?cards?|deck)\b/i.test(String(topic))) { const A = aboutCards(); if (A) return A; }
    // a note about it: its "Term: meaning" lines
    const notes = notesArr().filter(n => n && !n.archived && n.text).map(n => ({n, sc: tw.filter(w => String(n.text).toLowerCase().includes(w.slice(0, 5))).length + tw.filter(w => String(n.text).split("\n")[0].toLowerCase().includes(w.slice(0, 5))).length})).filter(x => !tw.length || x.sc > 0).sort((a, b) => b.sc - a.sc);
    if (tw.length && notes.length) { const n = notes[0].n, head = String(n.text).split("\n")[0].trim();
      const items = String(n.text).split("\n").slice(1).map(l => /^\s*[-•*]?\s*([A-Z][^:]{1,40}?)\s*[:–-]\s+(.{8,})$/.exec(l.trim())).filter(Boolean).map(m => ({q: `What is ${m[1].trim()}?`, a: m[2].trim()}));
      if (items.length >= 2) return {name: head.slice(0, 50), items: shuffle(items).slice(0, 10)}; }
    // cards in any deck about it
    if (tw.length) { const cs = decks.flatMap(d => d.cards).filter(c => tw.some(w => (String(c.front) + " " + String(c.back)).toLowerCase().includes(w.slice(0, 5))));
      if (cs.length >= 2) return {name: t, items: shuffle(cs.map(c => ({q: String(c.front), a: String(c.back)}))).slice(0, 10)}; }
    // no topic: the deck with the most cards due, else the biggest
    if (!t && decks.length) { const today = todayISO(), dk = decks.slice().sort((a, b) => (b.cards.filter(c => !c.due || c.due <= today).length - a.cards.filter(c => !c.due || c.due <= today).length) || b.cards.length - a.cards.length)[0];
      return {name: dk.name, items: shuffle(dk.cards.map(c => ({q: String(c.front), a: String(c.back)}))).slice(0, 10)}; }
    return null;
  }
  // how well an answer matches: the right answer's key words they gave (short ones like "SA" or "AV" must be exact: "AV node" isn't "SA node")
  function quizMark(ans, right){
    const k = [...new Set(qWords(right))], g = qWords(ans), has = w => w.length <= 3 ? g.includes(w) : g.some(x => x.slice(0, 5) === w.slice(0, 5));
    if (!k.length) return 0;
    const shortK = k.filter(w => w.length <= 3 && !/^\d+$/.test(w));
    if (shortK.length && !shortK.every(has)) return 0;
    const sc = k.filter(has).length / k.length;
    return sc >= 0.5 || (k.length <= 2 && sc > 0) ? 2 : sc >= 0.25 ? 1 : 0;
  }
  /* Flashcards in the chat, worked out in code (the eval: a fifth of the failures left after round 5 were cards and decks, made from
     Wikipedia or from unrelated notes, named after the request's own words, "how many cards" answered with the due-cards summary):
       make      "make 5 flashcards on the conduction pathway", "flashcards from my REBT note", "make flashcards from that", "a flashcard for
                 each defense mechanism with a clinical example": the source is their note on it (its "Term:" lines word for word, else the
                 AI writes cards from the note's own text), the last answer for "that", else what the AI knows (never the web); the deck is
                 the one they name, else a new one named after the source
       after     "make it 8", "5 more", "make them harder", "put them in my psych deck": the cards just made
       ask       "how many cards in heart", "how many flashcards do i have", "how many cards are due today", "do i have flashcards for
                 history", "what flashcards do i have on psych", "how many cards should i do a day": counted here
       honest    "how do i make a deck" is how (not a deck called "How Do I"); "the slides i uploaded" with nothing attached is said */
  const CARDW = /\b(flash ?cards?|cards?|decks?)\b/i;
  const TOPIC_STOP = /^(make|makes|create|generate|build|write|give|me|some|few|a|an|the|my|our|of|on|about|from|for|out|using|with|into|in|to|and|please|pls|can|could|you|would|flash|flashcard|flashcards|card|cards|deck|decks|set|new|each|every|one|ones|study|notes?|note|stuff|things|that|this|those|them|it|just|quick|do|i|want|need|let|lets|let's|up|more|harder|easier|detailed|with|example|examples|clinical|short|long)$/;
  function cardTopic(q){ return String(q).toLowerCase().replace(/[^a-z0-9&' ]+/g, " ").split(/\s+/).filter(w => w && !TOPIC_STOP.test(w) && !/^\d+$/.test(w)); }
  function noteFor(words){
    if (!words.length) return null;
    const cs = coursesArr(), crs = cs.find(c => words.some(w => w.length >= 3 && (String(c.code || "").toLowerCase().replace(/\s+/g, "").includes(w) || String(c.name).toLowerCase().split(/\s+/).some(x => x.startsWith(w.slice(0, 5))))));
    const sc = notesArr().filter(n => n && !n.archived && String(n.text || "").trim()).map(n => { const t = String(n.text).toLowerCase(), h = t.split("\n")[0];
      return {n, s: words.reduce((a, w) => a + (h.includes(w.slice(0, 5)) ? 3 : 0) + (t.includes(w.slice(0, 5)) ? 1 : 0), 0) + (crs && n.courseId === crs.id ? 2 : 0)}; }).filter(x => x.s >= 2).sort((a, b) => b.s - a.s);
    return sc.length ? sc[0].n : null;
  }
  const TERMLINE = /^\s*[-•*]?\s*([A-Z][^:\n]{1,50}?)\s*:\s+(.{6,})$/;
  async function aiCards(src, topic, n, style){
    if (typeof aiCall !== "function") return [];
    const r = await aiCall({task: "chat", fast: true, maxTokens: Math.min(1400, 140 * n + 120), temperature: 0.2, quiet: true,
      schema: {type: "OBJECT", properties: {cards: {type: "ARRAY", items: {type: "OBJECT", properties: {front: {type: "STRING"}, back: {type: "STRING"}}, required: ["front", "back"]}}}, required: ["cards"]},
      system: `Write exactly ${n} flashcards for a nursing student${src ? ", using ONLY the facts in the text given" : " from what you know for certain"}. Each front is one short question about ${topic || "the topic"}; each back answers it in under 25 words${style ? `; ${style}` : ""}. Every card is about a different fact. No card about anything else.`,
      parts: [{text: src ? `TEXT:\n${String(src).slice(0, 5000)}\n\nTOPIC: ${topic}` : `TOPIC: ${topic}`}]}).catch(() => null);
    const seen = new Set();
    return (((r && r.data) || {}).cards || []).map(c => ({front: String(c.front || "").trim(), back: String(c.back || "").trim()})).filter(c => c.front.length > 3 && c.back.length > 1 && !seen.has(c.front.toLowerCase()) && seen.add(c.front.toLowerCase())).slice(0, n);
  }
  function deckSay(answer, extra){ return Object.assign({answer, sources: [], followUps: [], actions: []}, extra || {}); }
  function putCards(dk, cards, name, courseId){
    const d = dk ? JSON.parse(JSON.stringify(dk)) : normDeck({id: uid(), created: Date.now(), name: String(name || "Study cards").slice(0, 80), courseId: courseId || ""});
    d.cards = d.cards || []; const have = new Set(d.cards.map(c => String(c.front).toLowerCase()));
    const add = cards.filter(c => !have.has(c.front.toLowerCase())).map(c => ({id: uid(), front: c.front, back: c.back, box: 0, due: "", seen: 0, right: 0, wrong: 0, ai: !c.mine, src: c.mine ? "your notes" : ""}));
    d.cards = d.cards.concat(add); d.updated = Date.now(); saveDeck(d, `Added ${add.length} card${add.length === 1 ? "" : "s"} to ${d.name}`);
    return {d, add};
  }
  async function cardsAct(q, chat, last){
    const w = String(q || "").toLowerCase().trim(), today = todayISO(), all = decksArr();
    const dueOf = d => (d.cards || []).filter(c => c.due && c.due <= today).length, newOf = d => (d.cards || []).filter(c => !c.due && !c.seen).length;
    const named = () => { let best = null, bs = 0; all.forEach(d => { const ws = (String(d.name).toLowerCase().match(/[a-z0-9&]{3,}/g) || []).filter(x => !/^(deck|cards|flashcards|terms|set|nursing|study)$/.test(x)); const s = ws.filter(x => new RegExp(`\\b${x.replace(/&/g, "\\&")}`).test(w)).length; if (s > bs) { bs = s; best = d; } }); return best; };
    // how to, not a deck called "How Do I"
    if (/^\s*how (do|can|would|should) (i|you|we)\b[^?]*\b(make|create|add|start|delete|rename|share)\b[^?]*\b(deck|flash ?cards?|cards?)\b/.test(w) && !/\bfor me\b/.test(w))
      return deckSay("Open Flashcards and tap New Deck, give it a name, then add cards (a question on the front, the answer on the back). Or just ask me: \"make flashcards from my cardiac note\", or \"make a deck called Pharm\".");
    // a file they mean that isn't here
    if (/\b(slides?|pdf|file|lecture notes|upload(ed)?|handout|powerpoint|ppt)\b/.test(w) && /\b(uploaded|i sent|attached|from (the|my) (slides|pdf|file)|use (the|my) (slides|pdf|file))\b/.test(w) && CARDW.test(w))
      return deckSay("Attach the file with the paperclip (slides, a PDF or photos), and I'll make the cards from it. I don't see one in this chat yet.");
    // ---- counting and finding ----
    if (/\b(how many|number of|count)\b/.test(w) && CARDW.test(w) && !/\b(make|create|generate|add)\b/.test(w)) {
      if (/\b(a day|per day|each day|daily|should i (do|study|review))\b/.test(w)) { const due = all.reduce((a, d) => a + dueOf(d), 0);
        return deckSay(`Aim for every card that's due each day (${due} today), plus about 10 to 20 new ones. Short daily reviews beat one long cram, and spaced repetition brings each card back just before you'd forget it.`); }
      if (/\b(due|review|today|to do|left)\b/.test(w)) { const L = all.map(d => ({d, du: dueOf(d), nw: newOf(d)})).filter(x => x.du || x.nw);
        return deckSay(L.length ? `${L.reduce((a, x) => a + x.du, 0)} card${L.reduce((a, x) => a + x.du, 0) === 1 ? " is" : "s are"} due to review today${L.some(x => x.nw) ? `, and ${L.reduce((a, x) => a + x.nw, 0)} ${L.reduce((a, x) => a + x.nw, 0) === 1 ? "is" : "are"} new` : ""}: ${L.map(x => `${x.d.name} (${x.du} due${x.nw ? `, ${x.nw} new` : ""})`).join(", ")}.` : "No cards are due today. You're all caught up!"); }
      const dk = named(); if (dk) return deckSay(`${dk.name} has ${(dk.cards || []).length} card${(dk.cards || []).length === 1 ? "" : "s"}${dueOf(dk) ? ` (${dueOf(dk)} due today)` : ""}.`, {ref: {kind: "deck", id: dk.id}});
      const tot = all.reduce((a, d) => a + (d.cards || []).length, 0);
      return deckSay(all.length ? `You have ${tot} flashcard${tot === 1 ? "" : "s"} in ${all.length} deck${all.length === 1 ? "" : "s"}: ${all.map(d => `${d.name} (${(d.cards || []).length})`).join(", ")}.` : "You don't have any flashcards yet. Want me to make some from your notes?");
    }
    if (/^\s*(do i have|have i got|are there|is there|what|which|show|list|any)\b[^?]*\b(flash ?cards?|cards?|decks?)\b/.test(w) && !/\b(make|create|generate|add|quiz|study|review)\b/.test(w) && !/\b(what (is|are|does) (a|the) (flash ?card|deck))\b/.test(w)) {
      const tw = cardTopic(w).filter(x => !/^(have|got|there|what|which|show|list|any|already|do|i|is|are)$/.test(x));
      if (!tw.length) return deckSay(all.length ? `Your decks: ${all.map(d => `${d.name} (${(d.cards || []).length} card${(d.cards || []).length === 1 ? "" : "s"})`).join(", ")}.` : "You don't have any decks yet.");
      const crs = window.SBTRUTH && SBTRUTH.courseNamed ? SBTRUTH.courseNamed(tw.join(" ")) : null;
      const hits = all.map(d => ({d, cs: (d.cards || []).filter(c => tw.some(x => (String(c.front) + " " + String(c.back)).toLowerCase().includes(x.slice(0, 5)))), nm: tw.some(x => String(d.name).toLowerCase().includes(x.slice(0, 5))) || (crs && d.courseId === crs.id)})).filter(x => x.nm || x.cs.length);
      if (!hits.length) return deckSay(`You don't have flashcards on ${tw.join(" ")} yet. Want me to make some from your notes?`);
      return deckSay(hits.map(x => { const L = x.nm ? (x.d.cards || []) : x.cs; return `${x.d.name}: ${L.length} card${L.length === 1 ? "" : "s"}${L.length ? ` (${L.slice(0, 5).map(c => String(c.front).replace(/^What is\s+/i, "").replace(/\?$/, "")).join(", ")}${L.length > 5 ? "…" : ""})` : ""}`; }).join("\n"), {ref: {kind: "deck", id: hits[0].d.id}});
    }
    // ---- after cards were just made: more, harder, into another deck ----
    const lc = last && last.a && last.a.cardsMade;
    if (lc && state.decks[lc.deck]) {
      const dk0 = state.decks[lc.deck];
      const mv = /\b(put|move|add|send|copy|save)\s+(them|those|these|it|the cards|that)\b[^.?!]*?\b(?:to|in|into)\s+(?:my\s+|the\s+)?(.+?)(?:\s+(?:deck|set|flashcards))?\s*[.!]*$/.exec(w) || /\b(?:put|move|add)\s+(?:them|those|these)\s+in\s+(?:a\s+)?new\s+deck\s+(?:called|named)\s+(.+?)\s*[.!]*$/.exec(w);
      if (mv) { const target = (mv[3] || mv[1] || "").trim(), nd = /\bnew deck\b/.test(w) ? null : deckNamed(target);
        if (nd && nd.id === dk0.id) return deckSay(`They're already in ${dk0.name}.`);
        const moved = (dk0.cards || []).filter(c => lc.ids.includes(c.id)).map(c => ({front: c.front, back: c.back, mine: c.src === "your notes"}));
        const r = putCards(nd, moved, nd ? "" : target.replace(/\b\w/g, x => x.toUpperCase()), dk0.courseId);
        const rest = (dk0.cards || []).filter(c => !lc.ids.includes(c.id));
        if (!rest.length && lc.made) applyChanges([{kind: "deck", id: dk0.id, after: null}], null); else { const k = JSON.parse(JSON.stringify(dk0)); k.cards = rest; saveDeck(k, null); }
        return deckSay(`Moved ${moved.length} card${moved.length === 1 ? "" : "s"} to ${r.d.name}. Say "undo" to take it back.`, {ref: {kind: "deck", id: r.d.id}, cardsMade: {deck: r.d.id, ids: r.add.map(c => c.id), src: lc.src, topic: lc.topic}}); }
      const nm = /\b(?:make it|make that|do|give me|add|another|actually)\s+(\d{1,2})\b|\b(\d{1,2})\s+more\b|^\s*(more|a few more|some more)\b/.exec(w);
      const harder = /\b(harder|tougher|more difficult|more detailed|more detail|longer|in more depth|with (an? )?(clinical )?examples?|add (an? )?examples?)\b/.test(w);
      if (nm || harder) {
        const want = nm && (nm[1] || nm[2]) ? Number(nm[1] || nm[2]) : 3, extra = nm && nm[1] ? Math.max(0, want - lc.ids.length) : want;
        const style = /\bexample/.test(w) ? "add a short clinical example to each back" : harder ? "make them harder: ask about how and why, not just definitions" : "";
        const cards = await aiCards(lc.src || "", lc.topic || dk0.name, harder ? lc.ids.length || 5 : Math.max(1, extra), style + (harder ? "" : `; don't repeat these: ${(dk0.cards || []).map(c => c.front).slice(-12).join(" | ")}`));
        if (!cards.length) return deckSay("I couldn't write those cards just now. Try again in a moment.");
        let d1 = JSON.parse(JSON.stringify(dk0)); if (harder) d1.cards = (d1.cards || []).filter(c => !lc.ids.includes(c.id));
        if (harder) { d1.updated = Date.now(); saveDeck(d1, null); }
        const r = putCards(state.decks[dk0.id], cards, "", dk0.courseId);
        return deckSay(`${harder ? `Swapped in ${r.add.length} ${/\bexample/.test(w) ? "cards with examples" : "harder cards"}` : `Added ${r.add.length} more`} in ${r.d.name}: ${r.add.slice(0, 3).map(c => c.front).join(" · ")}${r.add.length > 3 ? " …" : ""}. Say "undo" to take ${r.add.length === 1 ? "it" : "them"} back.`, {ref: {kind: "deck", id: r.d.id}, cardsMade: {deck: r.d.id, ids: (harder ? [] : lc.ids).concat(r.add.map(c => c.id)), src: lc.src, topic: lc.topic}});
      }
    }
    // ---- making cards ----
    const MAKE = /\b(make|create|generate|build|write|turn|convert|give me|do|need|want)\b[^?]{0,50}\b(flash ?cards?|cards)\b|^\s*(flash ?cards?|cards)\s+(on|about|from|for|of)\b|\b(make|create|start|build)\b[^?]{0,20}\b(deck|set)\b\s+(on|about|for|from|of)\b|\bflash ?cards? (on|about|from|for)\b/;
    // (not: an empty deck, cards from one of their quizzes, or "this file" with nothing attached; each has its own step)
    if (!MAKE.test(w) || /^\s*how\b/.test(w) || /\b(quiz me|test me|study|review|a task|add a card|add one|front|back)\b/.test(w)
      || /\b(empty|blank)\b/.test(w) || /\b(quiz|quizzes|test|case study|practice questions)\b/.test(w) || /\b(got wrong|i missed|wrong ones|ones i (?:got|missed)|i (?:got|keep getting) wrong|mistakes)\b/.test(w)
      || /\b(this|the|that|my|these)\s+(file|files|pdf|document|doc|slides?|attachment|upload|photo|picture|image)\b/.test(w)) return null;
    const nW = {a: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, few: 3, "a few": 3, several: 5, some: 5};
    const nm1 = /\b(\d{1,2}|one|two|three|four|five|six|seven|eight|nine|ten|a few|few|several)\s+(?:more\s+)?(?:flash ?cards?|cards|questions)\b/.exec(w); let n = nm1 ? (nW[nm1[1]] || Number(nm1[1])) : 0;
    const each = /\b(a|one) (flash ?card|card) (for|on|about) each\b|\bfor each\b|\beach (one|of them|term)\b/.test(w);
    const style = /\bclinical examples?\b|\bwith (an? )?examples?\b/.test(w) ? "add a short clinical example to each back" : /\bharder|tricky|tough\b/.test(w) ? "make them harder: how and why, not just definitions" : "";
    // where they go: a deck they name, "a new deck called X", else a new one named after the source
    const callM = /\b(?:new\s+)?deck\s+(?:called|named)\s+["“']?([^"”'.!?]{2,40})/.exec(q), toM = /\b(?:to|into|in)\s+(?:my\s+|the\s+)?([a-z0-9&' ]{2,40}?)\s+(?:deck|set)\b/.exec(w);
    let target = toM ? deckNamed(toM[1]) : null; const newName = callM ? callM[1].trim() : "";
    if (newName && deckNamed(newName) && String(deckNamed(newName).name).toLowerCase() === newName.toLowerCase()) target = deckNamed(newName);
    // what they're from: "that" (the last answer), their note on it, else what the AI knows
    const tw = cardTopic(w.replace(/\b(?:new\s+)?deck\s+(?:called|named)\s+.*$/, "").replace(/\b(?:to|into|in)\s+(?:my\s+|the\s+)?[a-z0-9&' ]{2,40}?\s+(?:deck|set)\b.*$/, ""));
    const lastA = last && last.a && !last.a.cardsMade ? String(last.a.answer || "") : "";
    const fromLast = /\b(that|this|those|it|what you (just )?said|the answer|above)\b/.test(w) && !tw.length && lastA.length > 40;
    const note = fromLast ? null : noteFor(tw.length ? tw : (lastA ? cardTopic(String(last.q || "")) : []));
    let cards = [], src = "", topic = tw.join(" ") || (last && last.q ? cardTopic(String(last.q)).join(" ") : "");
    if (fromLast) { src = lastA; topic = cardTopic(String(last.q || "")).join(" ") || "the last answer"; }
    else if (note) { src = String(note.text); const head = src.split("\n")[0].trim();
      const lines = src.split("\n").map(l => TERMLINE.exec(l.trim())).filter(Boolean).map(m => ({t: m[1].trim(), d: m[2].trim()})).filter(x => x.t.split(/\s+/).length <= 6 && x.t.toLowerCase() !== head.toLowerCase());
      const pick = lines.filter(x => tw.some(k => x.t.toLowerCase().includes(k.slice(0, 5))));
      const use = (pick.length ? pick : lines).slice(0, n || 12);
      if (use.length >= 2 && !style) cards = use.map(x => ({front: x.t.split(/\s+/).length <= 4 && !/[()?]/.test(x.t) ? `What is ${x.t}?` : `${x.t.replace(/\?$/, "")}?`, back: x.d, mine: true}));
      if (!topic || topic.length < 3) topic = head; }
    if (!n) n = each && cards.length ? cards.length : cards.length || 5;
    if (!cards.length) cards = await aiCards(src, topic, Math.min(12, n), style);
    // (the AI wrote none: the older step, which gathers everything they have on it and offers Make Flashcards, tries instead)
    if (!cards.length) return null;
    const head = note ? String(note.text).split("\n")[0].trim().replace(/^#+\s*/, "") : "";
    const name = newName || (target ? "" : (head && head.length <= 40 ? head : topic.replace(/\b\w/g, x => x.toUpperCase()).slice(0, 40)) || "Study cards");
    const ex = !target && !newName && name ? (all.find(d => String(d.name).toLowerCase() === name.toLowerCase()) || null) : null;
    const r = putCards(target || ex, cards, name, note ? note.courseId : "");
    if (!r.add.length) return deckSay(`${r.d.name} already has cards on all of those.`, {ref: {kind: "deck", id: r.d.id}});
    return deckSay(`Made ${r.add.length} card${r.add.length === 1 ? "" : "s"} in ${r.d.name}${note ? ` from your note "${head.slice(0, 40)}"` : fromLast ? " from that answer" : ""}: ${r.add.slice(0, 3).map(c => c.front).join(" · ")}${r.add.length > 3 ? " …" : ""}. Say "undo" to take ${r.add.length === 1 ? "it" : "them"} back.`,
      {ref: {kind: "deck", id: r.d.id}, sources: note ? ["Your notes"] : [], cardsMade: {deck: r.d.id, ids: r.add.map(c => c.id), src: src.slice(0, 5000), topic, made: !target && !ex}});
  }
  /* A memory trick ("give me a mnemonic for the conduction pathway", "how do I remember id ego superego", "memory trick for systole vs
     diastole"): the things to remember (their note's "Term:" lines, else a short list from the AI), then a sentence whose words start
     with those letters, checked letter by letter here (a small model restates the note instead, or gets the letters wrong); a plain
     acronym when it can't. Two things to tell apart get one trick that links each to what it means. */
  const MEM = /\b(mnemonics?|acronyms?|memory (?:trick|aid|device|hook)s?|tricks? (?:to|for) (?:remember\w*|memori[sz]\w*)|ways? to remember|how (?:do|can|should|would|will) i (?:ever )?(?:remember|memori[sz]e)|help me (?:remember|memori[sz]e)|easy way to (?:remember|memori[sz]e)|remember (?:the )?(?:order|difference))\b/i;
  async function memAid(q){
    if (!MEM.test(q) || typeof aiCall !== "function") return null;
    const topic = String(q).replace(MEM, " ").replace(/\b(give|me|make|a|an|for|the|to|of|on|how|do|can|i|please|pls|some|with|quick|good|easy|ever|up|come|need|want|create|write|get|that|this|between)\b/gi, " ").replace(/[?.!]/g, " ").replace(/\s+/g, " ").trim();
    const vs = /^(.{2,40}?)\s+(?:vs\.?|versus|or|from)\s+(.{2,40})$/i.exec(topic);
    const tw = (topic.toLowerCase().match(/[a-z0-9&]{3,}/g) || []).filter(w => !/^(and|the|all|their|steps|order|names|parts|list)$/.test(w));
    let items = [];
    if (!vs && tw.length) { const ns = notesArr().filter(n => n && !n.archived && n.text).map(n => ({n, sc: tw.filter(w => String(n.text).toLowerCase().includes(w.slice(0, 5))).length})).filter(x => x.sc > 0).sort((a, b) => b.sc - a.sc);
      if (ns.length) { const TL = /^\s*[-•*]?\s*([A-Z][^:\n]{1,40}?)\s*:\s+(.{4,})$/;
        // (the named ones when they name them, "id ego superego"; else every term the note lists)
        const all = String(ns[0].n.text).split("\n").map(l => TL.exec(l.trim())).filter(Boolean).map(m => m[1].trim()).filter(t => t.split(/\s+/).length <= 4);
        const named = all.filter(t => tw.some(w => t.toLowerCase().includes(w.slice(0, 5))));
        items = (named.length >= 2 ? named : all).slice(0, 8); } }
    const call = (system, text, schema, temp) => aiCall({task: "chat", fast: true, maxTokens: 260, temperature: temp || 0, quiet: true, schema, system, parts: [{text}]}).then(r => (r && r.data) || {}, () => ({}));
    if (!vs && items.length < 2) { const d = await call("List the things a student has to remember for this topic, in the usual order, as short names (1 to 4 words each), 2 to 8 of them. Only the list, correct facts.", `Topic: ${topic || q}`, {type: "OBJECT", properties: {items: {type: "ARRAY", items: {type: "STRING"}}}, required: ["items"]});
      items = (d.items || []).map(x => String(x).trim()).filter(x => /[a-z]/i.test(x)).slice(0, 8); }
    if (vs || items.length < 2) { const d = await call("Give the student ONE short memory trick (a rhyme, a vivid picture, or a word link) for exactly what they ask, then one sentence on how it maps to the facts. 2 or 3 sentences, plain text, correct facts.", q, {type: "OBJECT", properties: {answer: {type: "STRING"}}, required: ["answer"]}, 0.4);
      return d.answer && String(d.answer).trim().length > 20 ? String(d.answer).trim() : null; }
    const letters = items.map(x => x.replace(/^(?:the|a|an)\s+/i, "").replace(/[^a-z0-9]/gi, "").charAt(0).toUpperCase());
    let sent = "";
    for (let i = 0; i < 2 && !sent; i++) {
      const d = await call(`Write one short, funny, memorable sentence of exactly ${letters.length} words for a student. ${letters.map((l, k) => `Word ${k + 1} starts with "${l}"`).join(", ")}. Only the sentence.`, `Letters in order: ${letters.join(" ")}`, {type: "OBJECT", properties: {sentence: {type: "STRING"}}, required: ["sentence"]}, 0.7);
      const s = String(d.sentence || "").trim(), ws = s.split(/\s+/).map(w => w.replace(/[^a-z0-9]/gi, "")).filter(Boolean);
      if (ws.length === letters.length && ws.every((w, k) => w.charAt(0).toUpperCase() === letters[k])) sent = s; }
    const key = items.map((x, k) => `${letters[k]} = ${x}`).join(", ");
    return sent ? `Try this: "${sent}"\n${key}.` : `Try the letters ${letters.join("")}: ${key}. Make up a silly sentence with those first letters; the sillier it is, the better it sticks.`;
  }
  function chatQuiz(q, last){
    const w = String(q || "").toLowerCase().trim(), Z = last && last.a && last.a.quiz;
    const ask = (z, pre) => ({answer: `${pre ? pre + "\n\n" : ""}Question ${z.i + 1} of ${z.items.length}: ${z.items[z.i].q}`, sources: [z.name ? `Quiz: ${clip(z.name, 34)}` : "Quiz"], followUps: [], actions: [], quiz: z});
    if (Z && Z.items && Z.i < Z.items.length) {
      const cur = Z.items[Z.i], z = Object.assign({}, Z, {i: Z.i + 1});
      if (/^\s*(stop|quit|end|enough|no more|i'?m done|im done|that'?s enough|thats enough|done)\b/.test(w) || /\b(stop|end) (the )?quiz\b/.test(w)) return {answer: `Quiz over: you got ${Z.right} of ${Z.i} right.${Z.i ? "" : " Come back any time."}`, sources: [], followUps: [], actions: []};
      // a new request, not an answer: the quiz ends and that's answered
      // (a command of any length: "make a card from that", "only the heart ones", "another", "different topic", "psych instead"; and a
      // course or deck name alone when it isn't the answer, "psych")
      const cmd = /^\s*(?:please\s+|(?:can|could|would) you\s+|let'?s\s+|lets\s+|ok(?:ay)?\s+|actually\s+|wait\s+)?(?:add|create|make|delete|remove|move|change|start|mark|open|go to|take me|switch|turn|set|put|show|what'?s due|what is due|how do i|explain|tell me|another|a different|different|new quiz|quiz me|only|just (?:the|do)|instead|can we|i want)\b/.test(w)
        || /\binstead\s*[.!?]*$/.test(w)
        || (w.split(/\s+/).length <= 3 && quizMark(q, cur.a) === 0 && ((typeof deckNamed === "function" && deckNamed(w.replace(/\s*(deck|cards?|one|ones|quiz)\s*$/, ""))) || (window.SBTRUTH && SBTRUTH.courseNamed && SBTRUTH.courseNamed(w))));
      if (QUIZ_START.test(w) || cmd) { if (!QUIZ_START.test(w)) return null; }
      else {
        const pass = /^\s*(next|skip|pass|idk|i ?d(?:on'?t|unno) know|no idea|not sure|show (?:me )?(?:the )?answer|tell me|give up|reveal|\?+)\s*[.!?]*\s*$/.test(w) || /\b(no idea|i don'?t know|idk|dunno)\b/.test(w);
        const mk = pass ? -1 : quizMark(q, cur.a);
        if (mk === 2) z.right = Z.right + 1;
        const said = mk === 2 ? `Right! ${cur.a}` : mk === 1 ? `Partly. The full answer: ${cur.a}` : mk === -1 ? `The answer: ${cur.a}` : `Not quite. The answer: ${cur.a}`;
        if (z.i >= z.items.length) return {answer: `${said}\n\nThat's all ${z.items.length}: you got ${z.right} right.`, sources: [], followUps: [], actions: []};
        return ask(z, said);
      }
    }
    if (!QUIZ_START.test(w) || /\b(make|create|generate|build|write)\b[^?]*\bquiz\b/.test(w)) return null;
    let topic = (/\b(?:on|about|over|from|with|using)\s+(.+?)\s*[.!?]*$/.exec(w) || [])[1] || w.replace(QUIZ_START, " ").replace(/^\s*(?:ok(?:ay)?|now|so|can you|could you|please|pls|then)\b/g, " ");
    // "now quiz me on it", "quiz me on that": the deck it just made, or what the chat was just about
    if (/^\s*(?:it|that|this|them|those|these|those cards|these cards|that deck|this deck)?\s*$/.test(topic.replace(/\b(now|again|please|pls|then)\b/g, "").trim()) && last) {
      const R = last.a.ref && last.a.ref.kind === "deck" ? state.decks[last.a.ref.id] : last.a.card && last.a.card.deck ? state.decks[last.a.card.deck] : null;
      topic = R ? R.name : /\b(it|that|this|them|those|these)\b/.test(w) ? String(last.ask || last.q || "") : topic; }
    const P = quizPool(topic);
    if (!P || !P.items.length) return null;
    return ask({name: P.name, items: P.items, i: 0, right: 0}, `Okay, ${P.items.length} question${P.items.length === 1 ? "" : "s"} from ${P.name}. Answer in your own words, or say "skip" or "stop".`);
  }
  /* More on the deck the chat just made or was about: "add one more about denial" (a card from the line of their notes about it),
     "keep only 4" / "cut it to 3", "remove the one about projection". null when it isn't one of these (the rest of the chat handles it). */
  function deckFollow(q, last){
    const R = last && last.a && (last.a.ref && last.a.ref.kind === "deck" ? last.a.ref.id : last.a.card && last.a.card.deck), dk = R && state.decks[R];
    if (!dk || dk.archived) return null;
    const w = String(q || "").toLowerCase().trim(), out = (answer) => ({answer, sources: [], followUps: [], actions: [], ref: {kind: "deck", id: dk.id}, card: {deck: dk.id}});
    let m;
    if ((m = /\b(?:keep only|keep just|keep|only keep|just keep|cut (?:it|them|that)?\s*(?:down )?to|trim (?:it|them)?\s*(?:down )?to|only want|just)\s+(?:the\s+)?(?:first\s+)?(\d{1,2}|one|two|three|four|five|six|seven|eight)\b/.exec(w)) && /\b(keep|cut|trim|only|just|too many)\b/.test(w)) {
      const N = {one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8}[m[1]] || Number(m[1]);
      if (!(N >= 1) || N >= (dk.cards || []).length) return out(`${dk.name} has ${(dk.cards || []).length} card${(dk.cards || []).length === 1 ? "" : "s"}, so there's nothing to cut.`);
      const d = clone(dk); d.cards = d.cards.slice(0, N); d.updated = Date.now(); saveDeck(d, `Kept ${N} cards in ${dk.name}`);
      return out(`Done: ${dk.name} now has the first ${N} card${N === 1 ? "" : "s"}:\n${d.cards.map(c => `- ${c.front}`).join("\n")}\nSay "undo" to bring the others back.`);
    }
    if ((m = /\b(?:remove|delete|drop|take out|get rid of)\b[^.?!]*\b(?:card|one|ones)\b[^.?!]*\b(?:about|on|for)\s+(?:the\s+)?(.+?)\s*[.!?]*$/.exec(w))) {
      const k = m[1].slice(0, 5), d = clone(dk), before = d.cards.length; d.cards = d.cards.filter(c => !(String(c.front) + " " + String(c.back)).toLowerCase().includes(k));
      if (d.cards.length === before) return out(`I couldn't find a card about ${m[1]} in ${dk.name}.`);
      d.updated = Date.now(); saveDeck(d, `Removed ${before - d.cards.length} from ${dk.name}`); return out(`Removed ${before - d.cards.length} card${before - d.cards.length === 1 ? "" : "s"} about ${m[1]} from ${dk.name}. Say "undo" to put it back.`);
    }
    if ((m = /\b(?:add|make|write|put|include|throw in)\b[^.?!]*\b(?:one|another|a card|card|cards|more)\b[^.?!]*\b(?:about|on|for)\s+(?:the\s+)?(.+?)\s*[.!?]*$/.exec(w))) {
      const topic = m[1].replace(/\b(too|as well|please|pls)\b/g, "").trim(), k = topic.slice(0, 5);
      const TL = /^\s*[-•*]?\s*([A-Z][^:\n]{1,50}?)\s*:\s+(.{6,})$/;
      const hit = notesArr().filter(n => n && !n.archived && n.text).flatMap(n => String(n.text).split("\n")).map(l => TL.exec(l.trim())).filter(Boolean).find(x => x[1].toLowerCase().includes(k));
      if (!hit) return null;
      const t = hit[1].trim(), d = clone(dk); d.cards.push({id: uid(), front: t.split(/\s+/).length <= 3 && !/[()]/.test(t) ? `What is ${t}?` : `${t}?`, back: hit[2].trim(), box: 0, due: "", seen: 0, right: 0, wrong: 0, ai: false, src: "your notes"}); d.updated = Date.now();
      saveDeck(d, `Added a card to ${dk.name}`);
      return out(`Added a card to ${dk.name} from your notes:\n- ${d.cards[d.cards.length - 1].front}\nIt has ${d.cards.length} cards now.`);
    }
    return null;
  }
  function quizFromDeck(name){
    let dk = deckNamed(name);
    if (!dk) { const L = String(name || "").toLowerCase().replace(/\b(the|my|a|this|that|card|flashcard)\b/g, " ").trim(); if (L.length > 2) dk = (typeof decksArr === "function" ? decksArr() : []).find(x => (x.cards || []).some(c => String(c.front || "").toLowerCase().includes(L) || String(c.back || "").toLowerCase().includes(L))); }
    if (!dk) return null;
    if (!(dk.cards || []).length) return `${dk.name} has no cards yet, so there's nothing to quiz you on.`;
    setTimeout(() => { try { quizSheet([dk.id]); } catch (e) {} }, 250);
    return `Opening Make a Quiz with ${dk.name} chosen (${dk.cards.length} card${dk.cards.length === 1 ? "" : "s"}). Pick the kind of questions, then Start.`;
  }
  const PAGES = {today: "board", home: "board", board: "board", dashboard: "board", calendar: "plan", schedule: "plan", planner: "plan", plan: "plan", week: "plan",
    flashcards: "flashcards", cards: "flashcards", decks: "flashcards", deck: "flashcards", quizzes: "flashcards", notes: "notes", "note boards": "notes", courses: "courses", classes: "courses",
    grades: "courses", marks: "courses", files: "files", groups: "groups", "study groups": "groups", companion: "companion", chat: "companion", archive: "archive", timeline: "timeline", email: "emails", emails: "emails", scrapbook: "scrapbook"};
  /* Requests read straight from the words, before any AI step: what the AI shouldn't have to guess (and once got wrong) */
  function directAct(q){
    const say = (answer, extra) => Object.assign({answer, sources: [], followUps: [], actions: []}, extra || {});
    const w = String(q || "").trim();
    // a flashcard: "add a flashcard with front hi and back hello to deck Biology", "add card: front / back to Biology"
    const cm = cardParse(w);
    if (cm) return addCardTo(cm[1], cm[2], cm[3]);
    // an empty deck by name: "create an empty flashcard deck for WWI", "make a new deck called Pharmacology"
    const dk = /\b(?:create|make|start|add|set up)\b\s+(?:me\s+)?(?:a|an|one)?\s*(?:new\s+|empty\s+|blank\s+)*(?:flash ?card\s+)?(?:deck|set)\s+(?:called|named|for|about|on)\s+["“']?(.+?)["”']?\s*[.!?]*$/i.exec(w) || /\b(?:new|empty|blank)\s+(?:flash ?card\s+)?(?:deck|set)\s*(?:called|named|for|:)\s*["“']?(.+?)["”']?\s*[.!?]*$/i.exec(w);
    // a new deck with no name ("make me a deck", "I want a new deck", "start a blank flashcard deck"): its name, asked first
    if (/^\s*(?:(?:can|could) you\s+|please\s+)?(?:make|create|start|add|i want|i need|new|set up)\s+(?:me\s+)?(?:a\s+|an\s+)?(?:new\s+|empty\s+|blank\s+)*(?:flash ?card\s+)?deck\s*(?:please|pls)?[.!?]*$/i.test(w))
      return say("What should the deck be called?", {awaiting: {d: {intent: "make_deck"}, q: w}});
    if (dk && !/\b(front|back)\b/i.test(w)) {
      const name = dk[1].trim().replace(/^(the|my)\s+/i, ""), ex = deckNamed(name);
      if (ex && ex.name.toLowerCase() === name.toLowerCase()) return say(`You already have a deck called ${ex.name}. What should the new one be called instead?`, {awaiting: {d: {intent: "make_deck"}, q: w}});
      const id = uid(), nd = normDeck({id, name: name.replace(/^\w/, c => c.toUpperCase()).slice(0, 120), courseId: "", created: Date.now(), updated: Date.now()});
      applyChanges([{kind: "deck", id, after: nd}], `Made ${nd.name}`);
      return say(`Made the deck ${nd.name}. Add cards by saying "add a card to ${nd.name} with front … and back …". Say "undo" to take it back.`);
    }
    // "let's study psych nursing terms", "drill me on the heart deck", "review my bio deck": that deck, if there is one by that name
    const st = /^\s*(?:let'?s\s+|i want to\s+|time to\s+|can we\s+|please\s+)?(?:study|review|drill(?: me)?(?: on)?|practi[cs]e|go over|run through)\s+(?:my\s+|the\s+)?(.+?)\s*(?:deck|set|flashcards?|cards)?\s*[.!?]*$/i.exec(w);
    if (st) { const dk2 = deckNamed(st[1]); if (dk2 && (dk2.cards || []).length) { setTimeout(() => { try { startStudy([dk2.id]); } catch (e) {} }, 250); return say(`Opening ${dk2.name} to study (${dk2.cards.length} card${dk2.cards.length === 1 ? "" : "s"}).`); } }
    // "remember that X", "remember my locker code is 4412", "note to self: X", "sticky note: X", "jot down X": a note with their words
    // (never an edit to an event or a task: "remember that the study group is moving to room 6" is a note)
    const rem = /^\s*(?:ok(?:ay)?[,\s]+|please\s+|hey[,\s]+)?(?:remember(?:\s+that)?|note to self\s*[:,-]?|sticky(?:\s+note)?\s*[:,-]|(?:a\s+)?note\s*[:,-]|jot(?:\s+(?:this|that|it))?(?:\s+down)?\s*[:,-]?|write (?:this|that|it) down\s*[:,-]?|write down\s*[:,-]?|make a note(?:\s+that)?\s*[:,-]?|don'?t let me forget(?:\s+that)?|remind me that)\s+(.{2,400}?)\s*[.!]*$/i.exec(w);
    // ("remember that" alone is the last reply, saved by the step that knows it, never a note that says "That")
    if (rem && !/^\s*(to|how|what|when|where|which|why|who|if)\b/i.test(rem[1]) && !/^\s*(that|this|it|those|these|them)\s*[.!]*$/i.test(rem[1])) return {preset: {intent: "add_note", text: rem[1].charAt(0).toUpperCase() + rem[1].slice(1)}};
    // "stick a note on my board: buy scrubs", "put 'X' on a sticky": the note, with their words (nothing to work out)
    const nm = /\b(?:note|sticky)\b[^:"“']*?(?::\s*|["“'])([^"”']{2,300}?)["”']?\s*[.!?]*$/i.exec(w) || /^\s*(?:put|stick|add|write)\s+["“']([^"”']{2,300})["”']\s+(?:on|to)\s+(?:a|my|the)\s+(?:sticky|note|board)/i.exec(w);
    if (nm && /\b(?:put|stick|add|write|make|save|create|leave|jot)\b/i.test(w)) return {preset: {intent: "add_note", text: nm[1].trim()}};
    // flashcards from a quiz: "turn my practice quiz into flashcards", "make cards from the cardiac quiz"
    const fq = /\b(?:flash ?cards?|cards)\b[^]*?\b(?:from|out of|using|of)\s+(?:my\s+|the\s+|that\s+|this\s+|last\s+)*(.*?\b(?:quiz|test|case study|practice questions))\b/i.exec(w) || /\b(?:turn|make|convert)\s+(?:my\s+|the\s+|that\s+|this\s+)?(.*?\b(?:quiz|test|case study))\s+(?:into|to)\s+(?:flash ?)?cards\b/i.exec(w);
    if (fq) { const hit = quizNamed(fq[1]); return say(hit ? cardsFromQuiz(hit) : "I couldn't find that quiz. Make one in Flashcards (Make a Quiz), then ask again."); }
    // a quiz from a deck or a card: "quiz me on my heart deck", "make a quiz from the SA node card"
    const qd = /\b(?:quiz|test)(?:\s+me)?\b[^]*?\b(?:from|on|using|out of|with|over)\s+(?:my\s+|the\s+|this\s+|that\s+)?(.+?)\s*(?:deck|set|cards?|flashcards?)?\s*[.!?]*$/i.exec(w);
    if (qd && /\b(deck|card|cards|flashcards?|set)\b/i.test(w)) { const r = quizFromDeck(qd[1]); if (r) return say(r); }
    // "quiz me on Connor Pelkmans" where that's the name of one of their decks: that deck, not a search of their notes
    if (qd && !/\b(deck|card|cards|flashcards?|set)\b/i.test(w)) { const dn = deckNamed(qd[1]); if (dn && String(dn.name || "").toLowerCase().trim() === String(qd[1]).toLowerCase().replace(/^(?:my|the)\s+/, "").trim()) { const r = quizFromDeck(dn.name); if (r) return say(r); } }
    // an accessory's colour: "change scarf color blue", "make your hat red", "dye the cape green"
    const tm = /\b(?:change|make|turn|set|colou?r|paint|dye)\b[^]*?\b(scarf|hat|beanie|cap|crown|glasses|bow ?tie|tie|medal|cape|badge|star)\b[^]*?\b(?:colou?r\s*(?:to|=)?|to|into)?\s*(#[0-9a-f]{6}|(?:light |dark |bright |pale )?[a-z]+)\s*(?:please|pls)?[.!?]*$/i.exec(w);
    if (tm && window.SBCOMP && SBCOMP.tintByName && !/^(colou?r|to|into|please)$/i.test(tm[2])) return say(SBCOMP.tintByName(tm[1], tm[2]));
    // a theme by name: "change theme to evergreen", "switch to the ocean theme", "use evergreen", "dark mode please"
    const th = /\b(?:change|switch|set|put|use|make|try|apply|turn on)\b[^]*?\b(?:theme|skin|look|background)\b\s*(?:to|as|into)?\s*(?:the\s+)?["“']?([a-z][\w &'-]{1,30}?)["”']?\s*(?:theme|one)?\s*(?:please|pls)?[.!?]*$/i.exec(w)
      || /\b(?:change|switch|set|use|apply|try)\s+(?:to\s+)?(?:the\s+)?["“']?([a-z][\w &'-]{1,30}?)["”']?\s+(?:theme|skin)\b/i.exec(w)
      || /^\s*(?:(?:can you|please|could you)\s+)?(?:turn on|switch to|use|go)\s+(dark|light)\s*(?:mode|theme)?\b/i.exec(w) || /^\s*(dark|light)\s+(?:mode|theme)\s*(?:please|pls|on)?[.!?]*$/i.exec(w);
    // "dark mode and ocean theme": both
    { const dm = /\b(dark|light)\s+mode\b/i.exec(w), tn = /\b(?:the\s+)?([a-z][\w&'-]{2,20})\s+theme\b/i.exec(w); if (dm && tn && !/^(dark|light|my|the|a)$/i.test(tn[1])) { const a1 = themeAct({value: dm[1]}).answer, a2 = themeAct({value: tn[1]}).answer; return say(`${a1} ${a2}`); } }
    if (th && !/\b(course|class|deck|card|note|board|task)\b/i.test(w)) { const r = themeAct({value: th[1]}); return Object.assign(say(r.answer), r.awaiting ? {awaiting: r.awaiting} : {}); }
    // a study group or group project: New Group, filled in, for them to create (it needs their account and the internet)
    const gm = /\b(?:create|make|start|set up|new|open)\b[^]*?\b(study group|group project|project group|group)\b(?:\s+(?:called|named|for)\s+["“']?(.+?)["”']?)?\s*[.!?]*$/i.exec(w);
    if (gm && !/\b(note|deck|board|quiz|map|task|event)\b/i.test(w.replace(gm[1], ""))) {
      const name = (gm[2] || "").trim(), proj = /project/i.test(gm[1]);
      if (window.SBGRPNEW && SBGRPNEW(name, proj)) return say(`I opened New ${proj ? "Project" : "Group"}${name ? ` with "${name}" filled in` : ""}. Check it and tap Create: it makes the invite code to send your ${proj ? "teammates" : "friends"}.`);
      return say(`Groups need you signed in and online. Open Groups and tap New Group${name ? ` to make "${name}"` : ""}.`);
    }
    // wear or take off: "put a hat on", "wear your glasses", "take off the scarf"
    const wm = /^\s*(?:can you\s+|please\s+)?(?:put\s+(?:on\s+)?(.+?)(?:\s+on)?|wear\s+(.+?)|try\s+on\s+(.+?)|take\s+off\s+(.+?)|take\s+(.+?)\s+off|remove\s+(?:your\s+|the\s+)(.+?))\s*(?:please)?[.!?]*$/i.exec(w);
    if (wm && window.SBCOMP && SBCOMP.wearByName) {
      const on = !(wm[4] || wm[5] || wm[6]), item = (wm[1] || wm[2] || wm[3] || wm[4] || wm[5] || wm[6] || "").trim();
      // (only when it's something to wear: "put my essay on Monday" isn't)
      if (/\b(hat|hats|cap|beanie|toque|crown|tiara|glasses|specs|sunglasses|scarf|tie|bow ?tie|medal|necklace|cape|cloak|badge|star|everything|accessor(y|ies)|outfit)\b/i.test(item) && !/\b(on|to|for)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday|tomorrow|today|the board|my board)\b/i.test(w)) return say(SBCOMP.wearByName(item, on));
    }
    return null;
  }
  const ISYS_SMALL = `
Careful, these are easy to mix up:
- mark_done ONLY when they say it's finished (done, finished, submitted, handed in, turned in, completed, checked off).
"the lab report is now due monday" -> {"intent":"move_task","task":"lab report","date":"(that Monday)"}
"prof extended the essay deadline to dec 5" -> {"intent":"move_task","task":"essay","date":"(Dec 5)"}
"bump care plan 2 by 2 days" -> {"intent":"move_task","task":"care plan 2","date":"(its due date plus 2 days)"}
"the care plan is urgent" -> {"intent":"set_priority","task":"care plan","priority":"urgent"}
- A course is the one THEY name, matched by its name or code, never another course.
"psych nursing should be red" -> {"intent":"edit_item","kind":"course","item":"psych nursing","field":"color","value":"red"}
- "remember that ..." or "note to self" is a note.
"remember that office hours are thursday 2pm" -> {"intent":"add_note","text":"office hours are Thursday 2pm"}
- join_group when they have a code or say join; new_group only to start a new one.
"join group ABC123" -> {"intent":"join_group","value":"ABC123"}
"my friend sent me the code XK7P2M for her study group" -> {"intent":"join_group","value":"XK7P2M"}
- open_page to go somewhere: "open my calendar" -> {"intent":"open_page","value":"calendar"}`;
  // carrying it out: null when it isn't an action (answered as a question or chat instead)
  async function intentAct(q, chat, att, preset){
    const r = await intentAct0(q, chat, att, preset);
    // a question back ("What should the deck be called?"): what it was doing is kept, so the next message can answer it
    if (r && r.answer && !r.awaiting && LASTD && LASTD.intent !== "question" && LASTD.intent !== "chat" && LASTD.intent !== "cant" && /\?(\s|$)|For example:/.test(r.answer) && !/\b(undo|Done|Added|Made|Saved|moved|marked)\b/.test(r.answer)) r.awaiting = {d: LASTD, q: String(q).slice(0, 300)};
    // what was done, so "no, I meant X" can do it to X instead
    else if (r && r.answer && LASTD && !r.awaiting) r.did = Object.assign({}, LASTD, {cands: null});
    return r;
  }
  let LASTD = null;
  async function intentAct0(q, chat, att, preset){
    let d; try { d = preset || await route(q, chat, att); } catch (e) { return null; }
    LASTD = d;
    const intent0 = d.intent;
    const say = (answer, extra) => Object.assign({answer, sources: [], followUps: [], actions: []}, extra || {});
    const A = window.SBASSIST;
    // The model's choice, checked against the student's own words: a clear word for something else wins
    { const w = String(q || "").toLowerCase(), KW = /\b(deck|flash ?card deck|quiz|note ?board|board|whiteboard|event|appointment|course|class|file|pdf|note)\b/;
      // a mark to take off isn't the task to delete ("remove the grade from a&p lab 1, it was entered wrong" deleted the task)
      if (/^(delete_task|delete_item)$/.test(d.intent) && /\b(grades?|marks?|scores?|results?|percent|points)\b/.test(w) && !/\b(the (task|assignment|whole thing)|and the grade|everything)\b/.test(w)) {
        const t = taskOf(d.task || d.item || q, chat); LASTD = Object.assign({}, d, {intent: "cant"});
        return say(`I can't take a mark off from the chat yet, so I didn't change anything${t ? ` (${t.title} and its mark are as they were)` : ""}. Open the task and clear its mark, or tell me the right mark and I'll save that instead.`);
      }
      // what they're doing themselves ("i'm putting that on a sticky note", "i'll add it later", "gonna make a deck"): nothing for the app to do
      if (/^(add_note|add_task|add_event|make_deck|make_flashcards|make_quiz)$/.test(d.intent) && /^\s*(?:ok(?:ay)?\s+|so\s+|lol\s+)?(?:i'?m|im|i am|i'?ll|ill|i will|i'?m gonna|im gonna|gonna|going to|i'?m going to|i just|i already)\s+(?:put|putting|write|writing|add|adding|make|making|stick|sticking|jot|jotting|save|saving|do|doing|note|noting)\b/.test(w) && !/\b(can you|could you|please|for me|help me)\b/.test(w)) d.intent = "chat";
      // time they have, not an event to add ("i have 4 hours tomorrow" made an event called "Work")
      if (d.intent === "add_event" && /\bi (?:have|got|'ve got|ve got)\s+(?:about\s+|like\s+|maybe\s+)?(?:\d+(?:\.\d+)?|an?|one|two|three|four|five|six|a few|some)\s*(?:hours?|hrs?|h|minutes?|mins?)\b/.test(w) && !/\b(add|put|schedule|book|block|calendar|event|appointment)\b/.test(w)) d.intent = "question";
      if (/^(mark_done|mark_in_progress)$/.test(d.intent) && /\b(delete|remove|cancel(l?ed)?|scratch|drop(ped)?|get rid|trash|no longer|not happening)\b/.test(w)) d.intent = "delete_task";
      // a concept map only when a map is asked for ("a mnemonic", "a summary", "an acronym" are answers to write, not maps)
      if (d.intent === "make_map" && !/\b(map|mind ?map|diagram|web of)\b/.test(w)) d.intent = "question";
      if ((d.intent === "make_flashcards" || d.intent === "make_quiz") && !/\b(flash ?cards?|cards?|deck|quiz(zes)?|quiz me|test me|practice (questions?|test|exam)|questions)\b/.test(w)) d.intent = "question";
      if (/^(mark_done|mark_in_progress|question|chat)$/.test(d.intent) && /\b(is ?n'?t|is not|not|never|haven'?t|hasn'?t|didn'?t)\b[^.]{0,20}\b(done|finished|complete|completed|submitted)\b|\bun-?(do|mark|finish)\b|\breopen\b/.test(w)) d.intent = "mark_not_done";
      if (d.intent === "mark_in_progress" && A && A.timerMins && A.timerMins(q)) { d.intent = "start_timer"; if (!d.minutes) d.minutes = A.timerMins(q).mins || 0; }
      const tk = {rename_task: "rename_item", delete_task: "delete_item"}[d.intent], km = KW.exec(w);
      if (tk && km && !/\b(task|assignment|homework|essay|exam|test|lab report|reading)\b/.test(w.replace(km[0], ""))) { d.intent = tk; d.kind = {deck: "deck", quiz: "quiz", board: "board", "note board": "board", "noteboard": "board", whiteboard: "board", event: "event", appointment: "event", course: "course", class: "course", file: "file", pdf: "file", note: "note"}[km[1].replace(/\s+/g, " ")] || km[1]; d.item = d.item || d.task || ""; }
      // placeholders the model fills in when the words give nothing
      // a question never changes anything ("did I finish care plan 2?", "is the lab report done", "how do I add a course?"),
      // unless it's a request ("can you move ...", "could you mark ...")
      const CHANGES = /^(mark_done|mark_not_done|mark_in_progress|move_task|rename_task|delete_task|set_priority|add_task|add_event|add_course|add_note|delete_item|rename_item|edit_item|add_card|make_deck|add_mark|new_group|join_group|set_theme|change_setting|wear_accessory|remove_accessory)$/;
      const asking = /^\s*(how (do|can|would|should) i|how to|is there a way|what happens if)\b/.test(w) || (/\?\s*$|^\s*(did|do|does|is|are|was|were|have|has|am|what|when|where|which|who|why)\b/.test(w) && !/^\s*(can|could|would|will) (you|u)\b|\bplease\b/.test(w));
      if (CHANGES.test(d.intent) && asking) d.intent = "question";
      // talking to the companion about itself ("are you a real backpack", "can packy wear a top hat", "you're the best") is chat,
      // not a request it can't do
      { const me = info() || {}, nm = String(me.name || "").toLowerCase();
        if (d.intent === "cant" && (/\b(you|your|yourself|u|ur|companion)\b/.test(w) || (nm && w.includes(nm))) && !/\b(email|text|message|call|phone|book|order|buy|pay|submit|upload|print|share|send|register|sign up|check (my )?(brightspace|canvas|moodle|blackboard|email)|sync|google|outlook|alarm)\b/.test(w)) d.intent = "chat"; }
      // a theme or setting from their own words: "light mode" is light, text size is a setting (never a course's colour)
      if (d.intent === "set_theme" && /\b(light|dark|system)\s+(mode|theme)\b/.test(w)) { d.value = (w.match(/\b(light|dark|system)\s+(mode|theme)\b/) || [])[1]; d.field = ""; }
      if (/\b(text|font|letters?)\b[^.]{0,20}\b(bigger|larger|smaller|size|huge|tiny)\b|\b(bigger|larger|smaller)\s+(text|font)\b/.test(w)) { d.intent = "change_setting"; d.field = "text size"; d.value = /\b(smaller|tiny)\b/.test(w) ? "smaller" : "larger"; }
      // something at a time with someone (a meeting, an appointment) is an event, even when they say "book"
      if (d.intent === "cant" && /\b(meeting|appointment|appt|session|call|interview|class|lecture|practice|game|shift)\b/.test(w) && /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|tomorrow|today|tonight|next|at \d|\d{1,2}(:\d\d)?\s*(am|pm))\b/.test(w)) d.intent = "add_event";
      // the mix-ups small models make, put right from the words:
      // "done" only when the words say it's finished; a deadline or a priority said instead is that
      const DONEW = /\b(done|finish(ed)?|complet(e|ed)|submit(ted)?|turn(ed)? in|hand(ed)? in|wrap(ped)? up|check(ed)? off|tick(ed)? off|cross(ed)? (off|out)|✅|✔️)\b|✅|✔/;
      if (d.intent === "mark_done" && !DONEW.test(w)) {
        if (/\b(urgent|priority|important)\b/.test(w)) { d.intent = "set_priority"; if (!d.priority) d.priority = /\blow\b/.test(w) ? "low" : /\burgent\b/.test(w) ? "urgent" : "high"; }
        else if (/\b(due|deadline|extend(ed)?|bump(ed)?|mov(e|ed)|push(ed)?|postpon(e|ed)|delay(ed)?|reschedul(e|ed)|until|to (monday|tuesday|wednesday|thursday|friday|saturday|sunday|tomorrow|next))\b/.test(w)) d.intent = "move_task";
        else d.intent = "question";
      }
      if (/^(set_priority)$/.test(d.intent) && !/\b(urgent|priority|important)\b|\b(?:to|as|=)\s+(?:high|low|medium|med)\b|\b(?:high|low|medium)\s*(?:pls|please|now)?\s*[.!]*$/.test(w)) d.intent = /\b(due|deadline)\b/.test(w) ? "move_task" : "question";
      // "remember that ...", "note to self": a note, not an event or a task
      if (/^(add_event|add_task)$/.test(d.intent) && /^\s*(remember that|note to self|note:|jot|write (this|that) down|make a note|save a note|sticky)/.test(w)) d.intent = "add_note";
      // joining (a code, "join") is never starting a new group
      if (d.intent === "new_group" && (/\bjoin\b/.test(w) || /\bcode\b/.test(w)) && !/\b(create|make|start|new|set up)\b/.test(w)) { d.intent = "join_group"; if (!d.value) d.value = (String(q).match(/\b[A-Z0-9]{5,8}\b/) || [])[1 - 1] || ""; }
      if (d.intent === "join_group" && !d.value) d.value = (String(q).match(/\b(?=[A-Z0-9]*\d)[A-Z0-9]{5,8}\b/) || [""])[0];
      // the course named in their words is the course, whatever the model filled in
      if (window.SBTRUTH && SBTRUTH.courseNamed && /^(edit_item|delete_item|rename_item|open_item)$/.test(d.intent) && (d.kind === "course" || /\b(colou?r|course|class)\b/.test(w))) { const cn = SBTRUTH.courseNamed(q); if (cn) { d.kind = "course"; d.item = cn.code || cn.name; } }
      // each newer action only when the words are about it (a small model reaches for the nearest one otherwise)
      if (d.intent === "add_card" && !/\b(card|cards|flashcards?|front|back)\b/.test(w)) d.intent = "question";
      if (d.intent === "add_mark" && !d.replaceOk && !/\b(got|get|scored?|mark|marks|grade|grades|result|out of|\d+\s*%|\d+\s*\/\s*\d+)\b/.test(w)) d.intent = "question";
      if (/^(new_group|join_group)$/.test(d.intent) && !/\b(group|groups|project|team|invite|code|join)\b/.test(w)) d.intent = "question";
      if (d.intent === "open_page" && !/\b(open|go|take|show|bring|switch|navigate|jump|pull up|where)\b/.test(w)) d.intent = "question";
      if (d.intent === "study_deck" && !/\b(study|review|practi[cs]e|quiz me|drill|go over|run through)\b/.test(w)) d.intent = "question";
      // a new course only when they say to add one ("I meant all my courses" isn't)
      if (d.intent === "add_course" && !/\b(add|new|create|make|enrol+|register|signed up|taking|joining|set up)\b/.test(w)) d.intent = "question";
      // a note only when one is asked for ("print my notes", "show my notes" mention notes but don't ask for one)
      if (d.intent === "add_note" && !/\b(make|write|add|save|create|put|leave|jot|stick|take|new)\b[^.?!]*\b(note|sticky)\b|\bnote (to self|that|:)|\bremember\b|\bsticky\b|\bdon'?t let me forget\b|\bremind me that\b|\bjot\b|\bwrite (this|that|it) down\b|\bwrite down\b|^\s*note\b/.test(w)) d.intent = /\b(show|open|find|see|where|go to)\b/.test(w) ? "open_page" : CHANGE_Q.test(q) || /^\s*(please\s+)?((can|could|would) (you|u)\s+)?(do|send|print|share|buy|order|book|email|text|call)\b/.test(w) ? "cant" : ISQ0(q) ? "question" : "chat";
      if (d.intent === "add_note" && !d.board) { const m = /\b(?:on|in|to|onto)\s+(?:my|the)\s+([a-z0-9][\w &'-]{0,30}?)\s+(?:note ?)?board\b/i.exec(q); if (m) d.board = m[1]; }
      ["instructor", "where", "course", "code", "board", "title"].forEach(k => { if (/^(unknown|n\/?a|none|tbd|not (given|specified|provided)|null|undefined|-|no instructor|no room)$/i.test(String(d[k] || "").replace(/[()\[\].]/g, "").trim())) d[k] = ""; });
      // a time only when the words give one (the model likes to make up noon, 8 AM or 4 PM)
      if (!/\b\d{1,2}(:\d{2})?\s*(am|pm|a\.m\.|p\.m\.)|\b\d{1,2}:\d{2}\b|\bnoon\b|\bmidnight\b|\b(at|from|by|to) \d{1,2}\b(?!\s*(%|days?|weeks?|st|nd|rd|th))/i.test(w)) { d.time = ""; d.end = ""; }
      // "put it on then", "take them off": the accessory the chat was just about
      if (/\b(put (it|them|that|those) on|wear (it|them|that|those)|try (it|them) on|take (it|them|that|those) off)\b/.test(w) || (/^(wear_accessory|remove_accessory)$/.test(d.intent) && /^(it|them|that|those|this)?$/i.test(String(d.value || "").trim()))) {
        const said = ((chat && chat.msgs) || []).slice(-3).reverse().map(x => (x.q || "") + " " + (x.a ? x.a.answer : "")).join(" ").toLowerCase();
        const acc = (said.match(/\b(cozy scarf|scarf|tiny hat|festive beanie|graduation cap|beanie|hat|cap|crown|little crown|round glasses|sunglasses|glasses|bow ?tie|tie|champion medal|medal|cape|star badge|badge)\b/) || [])[0];
        if (acc) { d.intent = /\b(take|off|remove)\b/.test(w) ? "remove_accessory" : "wear_accessory"; d.value = acc; } }
      // schoolwork is a task, even when said like an event ("I have a bio midterm on dec 3")
      const WORK = /\b(exam|midterm|final|quiz|test|assignment|homework|hw|essay|paper|lab report|project|problem set|reading|presentation|due)\b/;
      if (d.intent === "add_event" && WORK.test(String(d.title || "").toLowerCase() + " " + w) && !/\b(meeting|practice|appointment|party|game|shift|club|office hours|review session|study group)\b/.test(w)) d.intent = "add_task";
      // meetings, practices, appointments are events
      if (d.intent === "add_task" && /\b(meeting|practice|appointment|party|game|shift|club|dinner|lunch|concert|rehearsal|dance|work|job|study group)\b/.test(String(d.title || "").toLowerCase()) && !WORK.test(String(d.title || "").toLowerCase())) d.intent = "add_event";
      // "cancel X" for something that exists: it goes
      if (/^add_(event|task)$/.test(d.intent) && /\b(cancel(l?ed)?|delete|remove|get rid|scratch|not happening|called off)\b/.test(w)) { const x = itemNamed("", d.title || q); if (x) { d.intent = x.kind === "task" ? "delete_task" : "delete_item"; d.kind = x.kind; d.item = d.task = d.title || x.name; } }
      // "history is in room 204": the course's room
      if (/\b(in room|room)\s+[a-z]?\d+[a-z]?\b/.test(w) && coursesArr().some(c => w.includes(c.name.toLowerCase()) || (c.code && w.includes(c.code.toLowerCase())))) { const c = coursesArr().find(c => w.includes(c.name.toLowerCase()) || (c.code && w.includes(c.code.toLowerCase()))); d.intent = "edit_item"; d.kind = "course"; d.item = c.name; d.field = "room"; d.value = (/\broom\s+([a-z]?\d+[a-z]?)\b/.exec(w) || [])[1] || d.value; }
      // the task is the one their words name. One the model filled in that the words never mention ("can I push it to wednesday"
      // read as the lab report; "change the due date" as the midterm) is "it" when they say it or that, else read from the message
      // itself (which asks which task when nothing in it names one)
      if (!preset && /^(mark_done|mark_not_done|mark_in_progress|move_task|rename_task|delete_task|set_priority|add_mark)$/.test(d.intent) && d.task && !/^(it|that|this)$/i.test(String(d.task).trim())) {
        const tw = (String(d.task).toLowerCase().match(/[a-z0-9&]{3,}|\d+/g) || []).filter(x => !/^(the|and|for|task|assignment|my|due|one|thing)$/.test(x));
        const hit = tw.some(x => w.includes(x) || (x.length >= 5 && w.includes(x.slice(0, 4))));
        const cn = window.SBTRUTH && SBTRUTH.courseIn ? SBTRUTH.courseIn(q) : null, t0 = taskOf(d.task, chat);
        // (the task a "same date as X" names is X, not the one to change)
        const hit2 = tw.some(x => { const w2 = w.replace(/\b(?:same|as)\b.*$/, ""); return w2.includes(x) || (x.length >= 5 && w2.includes(x.slice(0, 4))); });
        if ((!hit || !hit2) && !(cn && t0 && t0.courseId === cn.id && hit2)) { if (/\b(it|that|this|that one|this one|them)\b/.test(w) || (!hit2 && taskOf("it", chat))) d.task = "it"; else { d.task = String(q).replace(/\b(?:same|as)\b.*$/i, "") || String(q); d.taskFromQ = true; } }
      }
      // deleting only when their words say so ("leave the heart squad group" isn't "delete the Heart deck")
      if (/^(delete_item|delete_task)$/.test(d.intent) && !/\b(delete|remove|get rid|trash|erase|cancel(l?ed)?|scratch|drop(ped)?|clear|wipe|toss|ditch|bin|not happening|called off|no longer|nvm|never mind)\b/.test(w)) d.intent = "question";
      // a plan, a feeling or a thank-you that names a task changes nothing ("ok i'll review before quiz 4", "i'm gonna write it this
      // weekend", "fine help me with the lab report"): only words that say to change it, or that it's started, do
      if (!preset && d.intent === "mark_in_progress" && !(/\b(mark|set|put|move|change|status|in progress|in-progress)\b/.test(w) || (/\b(i'?ve started|i started|i'?m (now )?working on|i am working on|i began|i'?ve begun)\b/.test(w) && !/\b(i'?ll|i will|gonna|going to|plan(ning)? to|try(ing)? to|want to|should|might|maybe)\b/.test(w)))) d.intent = /\b(help|how|what|outline|explain|start with)\b/.test(w) ? "question" : "chat";
      // "im done for today", "ok back to studying": about them, not a task
      if (!preset && d.intent === "mark_done" && /^\s*(?:ok(?:ay)?\s+|well\s+|alright\s+)?(?:i'?m|im|i am)\s+(?:so\s+|finally\s+|officially\s+)?(?:done|finished)(?:\s+(?:for (?:today|tonight|the day|the night|now|the week)|studying|here))?\s*[.!]*\s*$/.test(w)) d.intent = "chat";
      if (!preset && d.intent === "mark_not_done" && !/\b(not done|undone|unmark|re-?open|un-?check|untick|isn'?t (done|finished)|wasn'?t (done|finished)|not finished|didn'?t (finish|do|submit)|haven'?t|to ?do|back to (?:to ?do|not done|open))\b/.test(w)) d.intent = "chat";
      // a date only moves when their words ask for it or say it changed ("but care plan 2 is due tomorrow" just says when it is)
      if (!preset && d.intent === "move_task" && !/\b(move|moved|push|pushed|bump|bumped|extend|extended|postpone|postponed|delay|delayed|reschedul\w*|change|changed|make it|put it|set it|shift|shifted|now|instead|till|until|give me|got moved|later|earlier|sooner|back|up|forward|to (?:mon|tue|wed|thu|fri|sat|sun|tomorrow|today|next|the|dec|nov|jan|\d))/.test(w)) d.intent = "question";
      // something they'd like to do, or are going to, isn't a calendar entry unless they ask for one ("i want to do a 5k next month",
      // "going to my cousins wedding"); one already on the calendar isn't added again ("i have clinical wednesday")
      if (!preset && /^add_(event|task)$/.test(d.intent) && !/\b(add|put|schedule|create|make|remind|book|log|track|calendar|planner|new|set up|pencil|save|enter|jot)\b/.test(w)) {
        if (/\b(want to|wanna|would like to|i'?d like to|thinking (about|of)|might|maybe|hope to|planning to|gonna|going to|i'?ll|lol|haha|was|were)\b/.test(w)) d.intent = "chat";
        else { const ex = itemNamed("", d.title || q); if (ex) d.intent = "question"; } }
      // a plan or a schedule to write ("make me a study plan for the psych midterm", "make a study schedule", "split it up for me") is an
      // answer, not a task called "Study schedule"
      if (!preset && d.intent === "add_task" && /\b(study plan|study schedule|schedule|plan (?:my|for|out|the)|a plan|pomodoro plan|split (?:it|that|this) up|break (?:it|that|this) (?:up|down|into)|lighter|heavier)\b/.test(w) && !/\b(add|put)\b[^.?!]*\b(task|to-?do|planner|list)\b/.test(w)) d.intent = "question";
      // when-words left in a new title ("Hist reading ch 12 in 3 days", ": study for psych midterm")
      if (/^add_(task|event)$/.test(d.intent) && d.title) d.title = String(d.title).replace(/\s+in\s+(?:\d{1,2}|a|an|one|two|three|four|five|six|seven)\s+(?:days?|weeks?)\b.*$/i, "").replace(/^[\s:;,.-]+|[\s:;,-]+$/g, "") || d.title;
      // "it's actually for psych", "that one goes under history": the task's course, not its date
      { const cn = window.SBTRUTH && SBTRUTH.courseIn ? SBTRUTH.courseIn(q) : null;
        if (cn && !preset && /\b(?:is|it'?s|that'?s|goes|belongs|should be|actually|put it|move it|file it)\b[^.?!]{0,25}\b(?:for|in|under|to|with|part of)\s+(?:my\s+|the\s+)?[\w&]/.test(w) && !/\b(due|deadline|monday|tuesday|wednesday|thursday|friday|saturday|sunday|tomorrow|today|next week|\d{1,2}(st|nd|rd|th)|am|pm)\b/.test(w)) { d.intent = "task_course"; d.course = cn.code || cn.name; if (!d.task || !taskOf(d.task, chat)) d.task = "it"; } }
      // "the A&P thing on thursday": two A&P tasks due then, so which one (or both) is asked
      if (/^(move_task|mark_done|mark_in_progress|set_priority|delete_task)$/.test(d.intent) && !preset && window.SBTRUTH && SBTRUTH.courseIn && /\b(thing|one|stuff|work|assignment|task)\b/.test(w)) {
        const cn = SBTRUTH.courseIn(q), day = (/\bon\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday|today|tomorrow)\b/.exec(w) || [])[1], r = day && SBTRUTH.range ? SBTRUTH.range(day, todayISO()) : null;
        const cands = cn ? tasksArr().filter(t => t.status !== "done" && t.courseId === cn.id && (!r || (t.due && t.due >= r.from && t.due <= r.to))) : [];
        if (cands.length > 1) { LASTD = Object.assign({}, d, {cands: cands.map(t => t.id)}); return Object.assign(say(`Which one: ${cands.map(t => t.title).join(" or ")}? Or both?`), {awaiting: {d: LASTD, q: String(q).slice(0, 300)}}); } }
      // "rename it", "actually delete it", "rename the deck to X", "study it": what the chat just made or was about
      { const R = ((chat && chat.msgs) || []).slice(-3).reverse().map(x => x.a && (x.a.ref || (x.a.card && x.a.card.deck ? {kind: "deck", id: x.a.card.deck} : null))).filter(Boolean)[0];
        const pro = v => /^(it|that|this|them|(?:the |that |this )?(deck|note|event|task|board|set|one|course))?$/i.test(String(v || "").trim());
        // (a name the model filled in that their words never say is "it" too: "rename it to History Essay Prep" right after making the
        // WWI deck isn't the WWI essay task)
        // (every word of the name: "for psych, call it Psych Pals" says "psych", not the Psych Midterm)
        const said = v => { const ws = String(v || "").toLowerCase().match(/[a-z0-9&]{4,}/g) || [], h = w.replace(/\bto\b.*$/, "").replace(/\bcall(ed)? it\b.*$/, ""); return ws.length > 0 && ws.every(x => h.includes(x.replace(/s$/, ""))); };
        if (R && refName(R) && /^(rename_item|delete_item|open_item|edit_item|study_deck|rename_task|delete_task)$/.test(d.intent) && (pro(d.item || d.task || d.deck) || !said(d.item || d.task || d.deck)) && /\b(it|that|this|them|the (deck|note|event|task|board))\b/.test(w)) {
          if (R.kind === "task") { d.intent = {rename_item: "rename_task", delete_item: "delete_task"}[d.intent] || d.intent; d.task = refName(R); }
          else { d.intent = {rename_task: "rename_item", delete_task: "delete_item"}[d.intent] || d.intent; d.kind = R.kind; d.item = refName(R); if (R.kind === "deck") d.deck = refName(R); } }
        // "it" with nothing the chat just made or showed, and a name their words never say: which one is asked, never guessed ("make a study
        // group" then "for psych, call it Psych Pals" renamed the Psych Midterm task)
        else if (!R && !preset && /^(rename_item|rename_task|delete_item|delete_task)$/.test(d.intent) && /\b(it|that|this|them)\b/.test(w) && !(v => { const ws = (String(v || "").toLowerCase().match(/[a-z0-9&]{4,}/g) || []); return !!ws.length && ws.filter(x => w.replace(/\b(?:to|as)\b.*$/, "").includes(x)).length >= Math.ceil(ws.length * 2 / 3); })(d.item || d.task || d.deck)) {
          LASTD = Object.assign({}, d, {intent: "cant"});
          const grp = /\bgroups?\b/.test(String(((chat && chat.msgs) || []).slice(-1).map(x => x.q).join(" ")).toLowerCase());
          return say(grp ? `A study group is named when you make it: open Groups, tap New Group, and call it ${clip(String(d.title || "").trim() || "what you like", 40)} there (groups need you signed in).` : `Which one should I ${/rename/.test(d.intent) ? "rename" : "delete"}? Say its name, for example: rename Care Plan 2 to ...`);
        } }
      // a new deck's name only from their words ("make me a deck" has none: it's asked for)
      if (d.intent === "make_deck" && d.title && !preset) { const tw = (String(d.title).toLowerCase().match(/[a-z0-9&]{3,}/g) || []).filter(x => !/^(new|deck|flashcard|flashcards|cards|empty|blank|my)$/.test(x)); if (!tw.length || !tw.some(x => w.includes(x))) d.title = ""; }
      // "put the a&p final a week earlier": an existing task moved, not a new one
      if (/^add_(task|event)$/.test(d.intent) && !preset && /\b(earlier|later|sooner|back|forward|push(ed)?|move[ds]?|reschedul\w*|postpone\w*|bump\w*|instead|a (day|week) (earlier|later|before|after))\b/.test(w)) {
        const ex = taskOf(String(d.title || "").replace(/\b(a (day|week)|earlier|later|sooner|back|forward)\b.*$/i, "") || q, chat); if (ex) { d.intent = "move_task"; d.task = ex.title; } }
      // "add exam", "add tues 3pm": nothing to call it yet, so it's asked (with the day and time kept)
      if (/^add_(task|event)$/.test(d.intent) && !preset) { const tt = String(d.title || "").toLowerCase().trim();
        if (!tt || /^(exam|test|quiz|assignment|task|homework|hw|essay|event|thing|something|reminder|it|mon(day)?|tue(s|sday)?|wed(nesday)?|thu(rs|rsday)?|fri(day)?|sat(urday)?|sun(day)?|today|tomorrow|tonight)$/.test(tt) || /^\s*(add|new|create)\s+(?:an?\s+)?(exam|test|quiz|assignment|task|event|something)\s*[.!]*$/.test(w) || /^\s*add\s+[a-z]{3,9}\s+\d{1,2}(:\d\d)?\s*(am|pm)\s*$/.test(w)) {
          const kd = /^(exam|test|quiz|assignment|homework|hw|essay)$/.test(tt) ? tt : "";
          LASTD = Object.assign({}, d, {title: "", generic: kd || "x"}); return Object.assign(say(kd ? `Which ${kd} is it (the course or its name), and when is it?` : `What should I add${d.date || /\d/.test(w) ? " then" : ""}?`), {awaiting: {d: LASTD, q: String(q).slice(0, 300)}}); } }
      // a mark for a task they name, said as a statement ("record 16/20 for a&p quiz 4", "log 45/50 on the lab report", "put 88% for the
      // psych paper"): saved, never read as a question about it
      if (!preset && /^(question|chat|cant|add_task)$/.test(d.intent) && /\b\d+(?:\.\d+)?\s*(?:\/|out of)\s*\d+|\b\d+(?:\.\d+)?\s*%/.test(w) && /\b(record|log|enter|input|put|add|save|got|get|scored?|mark|grade)\b/.test(w) && !/\?\s*$|^\s*(what|how|is|should|can|could|would)\b/.test(w)) {
        const tm = taskOf0(q, chat, true); if (tm) { d.intent = "add_mark"; d.task = tm.title; d.value = (String(q).match(/\d+(?:\.\d+)?\s*(?:\/|out of)\s*\d+(?:\.\d+)?|\d+(?:\.\d+)?\s*%/i) || [""])[0]; } }
      // "move the event to 7": the event the chat was just about
      if (/^(move_task|delete_task|rename_task)$/.test(d.intent) && /^(the |that |this )?(event|meeting|appointment|session|study group|class)$/i.test(String(d.task || "").trim())) {
        const said = ((chat && chat.msgs) || []).slice(-4).map(x => (x.q || "") + " " + (x.a ? x.a.answer : "")).join(" ").toLowerCase();
        const ev = itemsOf("event").find(x => x.name && said.includes(x.name.toLowerCase())) || itemNamed("event", String(q)); if (ev) d.task = ev.name; }
      // an edit said about a task they have, with no word asking for a new one ("cardiac lab and push it 2 days", "lab report in
      // progress too", "map test high", "40/50 on the lab report"): that task changed, never a new one titled with the instruction
      if (!preset && /^add_(task|event)$/.test(intent0) && /^(add_task|add_event|question|chat)$/.test(d.intent) && !/\b(add|new|create|make|schedule|put|book|remind|log|track|another)\b/.test(w)) {
        const ex = taskOf0(String(d.title || q), chat, true) || taskOf0(q, chat, true);
        if (ex) { let to = "";
          if (/\b(urgent|priority|high|low|important)\b/.test(w)) { to = "set_priority"; d.priority = d.priority || (/\burgent\b/.test(w) ? "urgent" : /\blow\b/.test(w) ? "low" : "high"); }
          else if (/\b(in progress|started|working on|doing)\b/.test(w)) to = "mark_in_progress";
          else if (DONEW.test(w)) to = "mark_done";
          else if (/\b(grade|got|scored?|marks?)\b|\b\d+\s*\/\s*\d+\b|\d+\s*%/.test(w)) to = "add_mark";
          else if (/\b(rename|call it|retitle)\b/.test(w)) to = "rename_task";
          else if (/\b(push|move|bump|postpone|delay|reschedul\w*|earlier|later|sooner|extend|due)\b/.test(w)) to = "move_task";
          if (to === "add_mark" && !d.value) d.value = (String(q).match(/\d+(?:\.\d+)?\s*(?:\/|out of)\s*\d+(?:\.\d+)?|\d+(?:\.\d+)?\s*%/i) || [""])[0];
          d.intent = to || "question"; if (to) { d.task = ex.title; d.taskFromQ = false; } } }
      // several tasks picked by the words ("everything due this week high priority pls", "both done"): the change they name, even when
      // the model took it for a question
      if (!preset && /^(question|chat|cant)$/.test(d.intent) && !asking) { const L = tasksSel(q, chat);
        if (L && L.length >= 1) { if (/\b(urgent|priority|high|low)\b/.test(w)) d.intent = "set_priority"; else if (DONEW.test(w)) d.intent = "mark_done"; else if (/\b(in progress|started|working on)\b/.test(w)) d.intent = "mark_in_progress"; else if (/\b(move|push|bump|postpone|delay|reschedule)\b/.test(w)) d.intent = "move_task"; } }
      // something to get done with no time ("gotta do med math practice sheet by thurs", "add nclex practice questions tmrw", "need to
      // finish reading ch 8 by next wednesday"): a task, not a calendar event (a meeting, class or appointment stays an event)
      if (d.intent === "add_event" && !preset && !whenOf(q, {}).time && !/\b(meeting|meet|appointment|appt|class|lecture|seminar|tutorial|shift|club|game|party|dinner|lunch|breakfast|brunch|coffee|office hours|study group|study session|session|orientation|clinical|conference|interview|concert|rehearsal|trip|flight|gym|workout|practice(?!\s+(?:questions?|sheets?|problems?|tests?|exams?|quiz(?:zes)?|set)))\b/.test(w)
        && /\b(by|due|need to|have to|gotta|got to|finish|do|complete|read|reading|write|practice|questions|sheet|worksheet|homework|hw|assignment|essay|paper|report|study|review|prep|submit)\b/.test(w)) d.intent = "add_task";
      // something they have to do by a day, said as a statement ("i need to finsih reading chaptre 8 by next wednesday", "gotta submit
      // the care plan reflection by friday"): a task, never an answer about what isn't in the planner yet
      if (!preset && /^(question|chat|cant)$/.test(d.intent) && !/\?\s*$/.test(q)) {
        const nm = /\b(?:i\s+)?(?:need to|have to|gotta|got to|must|should|('ve| have) got to|remind me to)\s+(.{3,80}?)\s+(?:by|before|due|for|on)\s+(?:next\s+|this\s+)?(today|tonight|tomorrow|tmrw|mon|tue|wed|thu|fri|sat|sun|\w+day|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|the\s+\d)/i.exec(q);
        if (nm && whenOf(q, {}).date && !taskOf0(nm[2], chat)) { d.intent = "add_task"; d.title = nm[2].replace(/^(?:do|finish|complete|get)\s+(?:the\s+|my\s+)?/i, "").replace(/^\w/, x => x.toUpperCase()); } }
      // a new task's course from the words, when the model left it out
      if (/^add_(task|event)$/.test(d.intent) && !d.course && window.SBTRUTH && SBTRUTH.courseNamed) { const c = SBTRUTH.courseNamed(q); if (c) d.course = c.code || c.name; }
    }
    const it = d.intent;
    if (it === "question" || it === "chat") return null;
    if (["mark_done", "mark_not_done", "mark_in_progress", "move_task", "rename_task", "delete_task", "set_priority", "task_course"].includes(it)) {
      // a course, deck, event or board with that name, matched better than any task: that's what's meant
      if (/^(rename_task|delete_task)$/.test(it) && d.task) { const x0 = itemNamed("", d.task); if (x0 && x0.kind !== "task") return itemAct(it === "rename_task" ? "rename_item" : "delete_item", Object.assign({}, d, {kind: x0.kind, item: d.task}), q, chat); }
      // several at once ("set both to high", "everything due this week high priority", "mark all my a&p stuff done except the final"):
      // each one changed, in one step they can undo
      if (!preset && /^(mark_done|mark_not_done|mark_in_progress|move_task|set_priority|task_course)$/.test(it)) {
        const L = tasksSel(q, chat, it === "mark_not_done");
        if (L && !L.length) return say("I couldn't find any open tasks that match that, so I didn't change anything.");
        if (L && L.length >= 1) {
          const ww = String(q).toLowerCase(), pr = d.priority || (/\burgent\b/.test(ww) ? "urgent" : /\blow\b/.test(ww) ? "low" : /\b(medium|med|normal)\b/.test(ww) ? "med" : /\b(high|important|priority)\b/.test(ww) ? "high" : "");
          const wh = it === "move_task" ? whenOf(q, d) : null, cc = it === "task_course" ? courseOfName(d.course) : null;
          const rel = it === "move_task" && !wh.date ? /\b(?:by\s+|for\s+|back\s+)?(a|an|one|two|three|four|five|six|seven|\d{1,2})\s+(day|days|week|weeks)\b/i.exec(q) : null;
          if (it === "set_priority" && !pr) return say(`What priority should those ${L.length} have: urgent, high, medium or low?`);
          if (it === "move_task" && !wh.date && !wh.time && !rel) return say(`When should those ${L.length} be due? For example: move them to Friday.`);
          if (it === "task_course" && !cc) return say("Which course should they be in?");
          const ch = [];
          L.forEach(t => { const n = clone(t);
            if (it === "mark_done") { if (t.status === "done") return; n.status = "done"; n.doneAt = Date.now(); }
            else if (it === "mark_not_done") { if (t.status !== "done") return; n.status = "todo"; n.doneAt = null; }
            else if (it === "mark_in_progress") n.status = "doing";
            else if (it === "set_priority") n.priority = pr;
            else if (it === "task_course") n.courseId = cc.id;
            else if (it === "move_task") { if (wh.date) n.due = wh.date; else if (rel && t.due) { const NW = {a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7}, k = (NW[rel[1].toLowerCase()] || Number(rel[1])) * (/week/i.test(rel[2]) ? 7 : 1), x = new Date(t.due + "T12:00:00"); x.setDate(x.getDate() + (/\b(earlier|sooner|forward|up)\b/i.test(q) ? -k : k)); n.due = x.toISOString().slice(0, 10); } if (wh.time) n.time = wh.time; if (n.start && n.due && n.start > n.due) n.start = n.due; }
            ch.push({kind: "task", id: t.id, after: n}); });
          if (!ch.length) return say(it === "mark_done" ? "Those are already done." : "Nothing needed changing.");
          const names = ch.map(c => state.tasks[c.id].title), what = {mark_done: "marked done", mark_not_done: "moved back to To Do", mark_in_progress: "moved to In Progress", set_priority: `set to ${({urgent: "urgent", high: "high", med: "medium", low: "low"})[pr]} priority`, task_course: cc ? `moved to ${courseLabel(cc)}` : "", move_task: wh && wh.date ? `moved to ${fmtDate(wh.date)}` : "moved"}[it];
          applyChanges(ch, `${ch.length} tasks ${what}`);
          return say(`Done: ${names.join(", ")} ${ch.length === 1 ? "was" : "were"} ${what}.`);
        }
      }
      const t = taskOf(d.task, chat, it === "mark_not_done");
      // not a task after all: the event, deck, course... with that name
      if (!t && d.task && !/^(it|that|this)$/i.test(String(d.task).trim())) {
        const x = itemNamed("", d.task);
        if (x && x.kind === "event" && it === "move_task") return eventMove(x, q, d);
        if (x && x.kind !== "task" && /^(rename_task|delete_task)$/.test(it)) return itemAct(it === "rename_task" ? "rename_item" : "delete_item", Object.assign({}, d, {kind: x.kind, item: d.task}), q, chat);
      }
      // no such task, and nothing in the words about their work ("i started knitting", "finally finished my book", "pho is done"): talk,
      // answered in the conversation, never "couldn't find knitting among your open tasks"
      if (!t && !preset && !/\b(task|assignment|homework|hw|essay|paper|report|lab|quiz|test|exam|midterm|final|reading|chapter|ch\s?\d|care plan|journal|project|worksheet|due|priority|deadline|course|class|module|unit|study)\b/i.test(q) && !(chat && (chat.msgs || []).slice(-2).some(x => x.a && /\b(which task|which one)\b/i.test(x.a.answer || "")))) { LASTD = Object.assign({}, d, {intent: "chat"}); return null; }
      if (!t) return say(d.taskFromQ ? "Which task do you mean?" : `Which task do you mean? I couldn't find ${d.task && !/^(it|that|this)$/i.test(d.task) ? `"${clip(d.task, 60)}"` : "the one you mean"} among your open tasks.`);
      const n = clone(t); let label = "";
      if (it === "mark_done") { if (t.status === "done") return say(`${t.title} is already done.`); n.status = "done"; n.doneAt = Date.now(); label = `${t.title} marked done`; }
      else if (it === "mark_not_done") { n.status = "todo"; n.doneAt = null; label = `${t.title} moved back to To Do`; }
      else if (it === "mark_in_progress") { n.status = "doing"; label = `${t.title} moved to In Progress`; }
      else if (it === "move_task") { const w = whenOf(q, d);
        // "bump it by 2 days", "postpone one day", "push it back a week": counted from when it's due now
        // ("got moved up a day", "push it back a week": counted from its due date even when a date was filled in for it, unless the
        // words name a day of their own; "in 3 days" is from today, so it isn't one of these)
        const REL = /(?<!\bin\s)(?<!\bin\s\s)\b(?:by\s+|for\s+|back\s+|up\s+|forward\s+)?(a|an|one|two|three|four|five|six|seven|\d{1,2})\s+(day|days|week|weeks)\b(?!\s+(?:from now|from today))/i;
        const OWN = /\b(today|tonight|tomorrow|tmrw|monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tues?|wed|thu|thurs|fri|sat|sun|jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec|\d{1,2}(?:st|nd|rd|th)|\d{1,2}\/\d{1,2})\b|\bin\s+(?:\d{1,2}|a|an|one|two|three)\s+(?:days?|weeks?)\b/i;
        if (t.due && REL.test(q) && !OWN.test(q) && /\b(up|back|forward|earlier|later|sooner|by|push(?:ed)?|bump(?:ed)?|postpone[d]?|delay(?:ed)?|extend(?:ed)?|moved?)\b/i.test(q)) w.date = "";
        if (!w.date && t.due) { const NW = {a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7}, m2 = REL.exec(q);
          if (m2) { const n0 = NW[m2[1].toLowerCase()] || Number(m2[1]), days = /week/i.test(m2[2]) ? n0 * 7 : n0, x = new Date(t.due + "T12:00:00"); x.setDate(x.getDate() + (/\b(earlier|sooner|forward|up)\b/i.test(q) ? -days : days)); w.date = x.toISOString().slice(0, 10); } }
        if (!w.date && !w.time) return say(`When should ${t.title} be due? For example: move it to Friday.`); if (w.date) { n.due = w.date; if (n.start && n.start > n.due) n.start = n.due; } if (w.time) n.time = w.time; label = `${t.title} moved to ${w.date ? fmtDate(w.date) : ""}${w.time ? (w.date ? " at " : "") + fmtTime(w.time) : ""}`; }
      else if (it === "rename_task") { const nm = clip(String(d.title || "").trim(), 160); if (!nm) return say(`What should ${t.title} be called?`); n.title = nm; label = `Renamed to ${nm}`; }
      else if (it === "task_course") { const cc = courseOfName(d.course); if (!cc) return say("Which course should it be in?"); if (t.courseId === cc.id) return say(`${t.title} is already in ${courseLabel(cc)}.`); n.courseId = cc.id; label = `${t.title} moved to ${courseLabel(cc)}`; }
      else if (it === "set_priority") { if (!d.priority) return say(`What priority should ${t.title} have: urgent, high, medium or low?`); n.priority = d.priority; label = `${t.title} set to ${({urgent: "urgent", high: "high", med: "medium", low: "low"})[d.priority]} priority`; }
      if (it === "delete_task") { applyChanges([{kind: "task", id: t.id, after: null}], `Deleted ${t.title}`); return state.tasks[t.id] ? null : say(`Deleted ${t.title}. It's in Recently Deleted if you need it back (or say "undo").`); }
      applyChanges([{kind: "task", id: t.id, after: n}], label);
      const k = state.tasks[t.id]; if (!k) return null;
      return say(it === "mark_done" ? `Nice work! I marked ${t.title} done.` : `${label}.`, {changes: undefined});
    }
    if (it === "add_task") {
      const title = clip(String(d.title || "").trim(), 160); if (!title) return null;
      const w = whenOf(q, d), c = courseOfName(d.course), type = /\b(exam|final|midterm)\b/i.test(title) ? "Exam" : /\bquiz\b/i.test(title) ? "Quiz" : /\blab\b/i.test(title) ? "Lab" : "Assignment";
      const t = newTask({title, type, courseId: c ? c.id : "", due: w.date, time: w.time, priority: type === "Exam" ? "high" : "med"});
      applyChanges([{kind: "task", id: t.id, after: t}], `Added ${title}`);
      return state.tasks[t.id] ? say(`Added ${title}${c ? ` to ${courseLabel(c)}` : ""}${w.date ? `, due ${fmtDate(w.date)}` : ""}${w.time ? ` at ${fmtTime(w.time)}` : ""}.`) : null;
    }
    if (it === "add_event") {
      const title = clip(String(d.title || "").trim(), 120); if (!title) return null;
      const w = whenOf(q, d); if (!w.date) return say(`What day is ${title}? For example: ${title} on Friday at 4pm.`);
      const c = courseOfName(d.course), end = hm(d.end) || w.end || "";
      const ev = normEvent({id: uid(), title, courseId: c ? c.id : "", date: w.date, allDay: !w.time, start: w.time, end: w.time ? end : "", where: clip(String(d.where || ""), 120)});
      applyChanges([{kind: "event", id: ev.id, after: ev}], `Added ${title}`);
      return state.events[ev.id] ? say(`Added ${title} to your calendar on ${fmtDate(ev.date)}${ev.start ? ` at ${fmtTime(ev.start)}` : ""}.`) : null;
    }
    if (it === "add_course") {
      const name = clip(String(d.title || "").trim(), 80), code = clip(String(d.code || "").trim().toUpperCase(), 24); if (!name && !code) return say("What's the course called? For example: add BIOL 2010 Anatomy as a course.");
      const dup = coursesArr().find(c => (code && (c.code || "").toUpperCase() === code) || (name && c.name.toLowerCase() === name.toLowerCase())); if (dup) return say(`You already have ${courseLabel(dup)}.`);
      const used = coursesArr().map(x => x.color);
      const nc = {id: uid(), created: Date.now(), name: name || code, code: code || "", instructor: clip(String(d.instructor || ""), 80), schedule: "", room: "", office: "", color: COLORS.find(x => !used.includes(x)) || COLORS[used.length % COLORS.length], notes: "", links: [], meetings: []};
      applyChanges([{kind: "course", id: nc.id, after: nc}], `Added ${nc.name}`);
      return state.courses[nc.id] ? say(`Added the course ${courseLabel(nc)}${nc.instructor ? ` with ${nc.instructor}` : ""}. Open Courses to add its class times.`) : null;
    }
    if (it === "add_card") { const p = cardParse(q) || []; return addCardTo(d.front || p[1], d.back || p[2], d.deck || d.item || d.title || p[3]); }
    if (it === "make_deck" && att && att.length) return null;
    if (it === "make_deck") {
      let name = String(d.title || d.item || d.topic || "").trim().replace(/\s+(flash ?cards?|cards?|deck)$/i, "").trim();
      // a name made of the request's own words ("Lets Do A Card", "I Just Made", "Lets Just Do Flashcards") isn't a name
      if (/^(let'?s|lets|i|just|do|can|could|please|make|made|want|wanna|some|a|an|the)\b/i.test(name) && !/\b(called|named|titled|name it)\b/i.test(q)) name = "";
      if (!name) return say("Sure. What should the deck be called, or which topic or note should the cards come from?");
      const ex = deckNamed(name); if (ex && ex.name.toLowerCase() === name.toLowerCase()) return say(`You already have a deck called ${ex.name}. What should the new one be called instead?`);
      const c0 = d.course ? (window.SBTRUTH && SBTRUTH.courseNamed ? SBTRUTH.courseNamed(d.course) : null) : null, id = uid();
      const nd = normDeck({id, name: name.slice(0, 120), courseId: c0 ? c0.id : "", created: Date.now(), updated: Date.now()});
      applyChanges([{kind: "deck", id, after: nd}], `Made ${nd.name}`);
      return say(`Made the deck ${nd.name}${c0 ? ` in ${courseLabel(c0)}` : ""}. Add cards by saying "add a card to ${nd.name} with front … and back …".`);
    }
    if (it === "study_deck") {
      const dk = deckNamed(d.deck || d.item || d.title); if (!dk) return say(`I couldn't find that deck. ${decksArr().length ? "Your decks: " + decksArr().slice(0, 6).map(x => x.name).join(", ") + "." : ""}`);
      if (!(dk.cards || []).length) return say(`${dk.name} has no cards yet.`);
      setTimeout(() => { try { startStudy([dk.id]); } catch (e) {} }, 250);
      return say(`Opening ${dk.name} to study (${dk.cards.length} card${dk.cards.length === 1 ? "" : "s"}).`);
    }
    if (it === "add_mark") {
      const nm0 = String(d.task || d.item || d.title || "").trim();
      let t = taskOf(nm0, chat, true);
      // (a finished one from weeks ago counts: "that foundations quiz" is Foundations Quiz 1, done, with its mark)
      if (!t && nm0) { const ws = (nm0.toLowerCase().match(/[a-z0-9&]{3,}/g) || []).filter(x => !/^(the|that|this|my|our|on|for|was|got|quiz?z?es|grade|mark)$/.test(x) || /^quiz/.test(x));
        const L = Object.values(state.tasks || {}).filter(x => x && x.title && ws.length && ws.every(w2 => String(x.title).toLowerCase().includes(w2.replace(/s$/, ""))));
        if (L.length === 1) t = L[0]; }
      // named, but not in the planner ("my quiz 1 was 11/20"): said, and nothing saved anywhere
      if (!t) return say(nm0 && !/^(it|that|this|the (one|grade|mark))$/i.test(nm0) ? `I don't see "${nm0}" in your planner, so I didn't save that mark anywhere. Say "add ${nm0} as a task" and I'll save the mark on it.` : "Which assignment was the mark for?");
      // the task their own words name best wins over the model's pick ("i got 88 on my psych paper" is Psych Paper 1, not Psych Midterm)
      { const ws = (String(q).toLowerCase().match(/[a-z0-9&]{3,}/g) || []).filter(x => !/^(got|get|the|and|for|out|mark|marks|grade|score|scored|on|my|was|just|back|came|percent|points|actually|regraded)$/.test(x));
        const sc = x => ws.filter(w2 => String(x.title).toLowerCase().includes(w2)).length, all = tasksArr().filter(x => x && x.title);
        const best = all.map(x => ({x, s: sc(x)})).sort((a, b) => b.s - a.s)[0];
        if (best && best.x.id !== t.id && best.s >= 2 && best.s > sc(t)) t = best.x; }
      const v = String(d.value || "").trim(), fr = /^(\d+(?:\.\d+)?)\s*(?:\/|out of)\s*(\d+(?:\.\d+)?)$/i.exec(v), pc = /^(\d+(?:\.\d+)?)\s*%?$/.exec(v);
      let mark = fr ? {got: Number(fr[1]), outOf: Number(fr[2])} : pc ? {got: Number(pc[1]), outOf: 100} : null;
      if (!mark || !(mark.outOf > 0) || mark.got < 0) return say(`What mark did you get on ${t.title}? For example: 85%, or 17/20.`);
      // the thing they named has to be this task: "my quiz 1 was 11/20" is not Psych Paper 1, "that foundations quiz" is not
      // A&P Quiz 4 (a number or a word of theirs the task and its course don't have means it's something else)
      { const lc = s => String(s || "").toLowerCase().replace(/[^a-z0-9& ]+/g, " "), cs = courseOf(t.courseId), have = lc(`${t.title} ${t.type || ""} ${cs ? `${cs.name} ${cs.code || ""}` : ""}`);
        const named = lc(d.task || d.item || d.title).replace(/\b(my|the|that|this|it|on|for|in|was|is|a|an|grade|mark|score|result|too|also|got|i)\b/g, " ");
        const odd = (named.match(/[a-z0-9&]+/g) || []).filter(w => (/^\d+$/.test(w) ? !new RegExp(`\\b${w}\\b`).test(have) : w.length >= 4 && !have.includes(w.replace(/s$/, "").slice(0, 6))));
        // (a name that is one of their tasks is real: the task their own words name was picked above)
        const real = tasksArr().some(x => { const tt = lc(x.title); return (named.match(/[a-z0-9&]+/g) || []).every(w => tt.includes(w.replace(/s$/, ""))); });
        if (odd.length && !real) {
          const like = tasksArr ? tasksArr().filter(x => x.type && t.type && x.type === t.type).slice(0, 4).map(x => x.title) : [];
          return say(`I don't see "${String(d.task || d.item || d.title).trim()}" in your planner, so I didn't save that mark anywhere.${like.length ? ` Is it one of these: ${like.join(", ")}?` : ""} Or say "add ${String(d.task || d.item || d.title).trim()} as a task" and I'll save the mark on it.`); } }
      const had = t.mark && t.mark.got != null && t.mark.outOf > 0 ? t.mark : null;
      // a bare number on a task already marked out of something else is out of that ("got 17 on the quiz" when it's marked out of 20)
      if (had && !fr && !/%|percent/.test(String(q)) && had.outOf !== 100 && mark.got <= had.outOf) mark = {got: mark.got, outOf: had.outOf};
      // already saved: said, nothing changed ("i got 88 on my psych paper!!" when 88/100 is there)
      if (had && had.got === mark.got && had.outOf === mark.outOf) return say(`That's already saved: ${had.got}/${had.outOf} for ${t.title}. Nice work!`);
      // a different mark already there: replaced only when they say it's a correction, or say yes ("got 17 on the psych paper" overwrote 88/100)
      if (had && !d.replaceOk && !/\b(actually|regraded|re-graded|changed|updated?|correct(ed|ion)?|should be|was wrong|instead|fix|fixed|new mark|replace)\b/i.test(String(q)))
        return say(`${t.title} already has ${had.got}/${had.outOf}. Replace it with ${mark.got}/${mark.outOf}? Say "yes" to replace it.`, {awaiting: {d: Object.assign({}, d, {task: t.title, value: `${mark.got}/${mark.outOf}`, replaceOk: true}), q: "yes"}});
      const n = JSON.parse(JSON.stringify(t)); n.mark = Object.assign({}, t.mark || {}, mark);
      applyChanges([{kind: "task", id: t.id, after: n}], `${t.title}: mark added`);
      return say(`Saved ${mark.got}/${mark.outOf} (${Math.round(mark.got / mark.outOf * 1000) / 10}%) for ${t.title}. Say "undo" to take it back.`);
    }
    if (it === "new_group") { const name = String(d.title || d.item || "").trim(), proj = /project/i.test(String(d.value || "") + " " + q);
      return say(window.SBGRPNEW && SBGRPNEW(name, proj) ? `I opened New ${proj ? "Project" : "Group"}${name ? ` with "${name}" filled in` : ""}. Check it and tap Create.` : `Groups need you signed in and online. Open Groups and tap New Group${name ? ` to make "${name}"` : ""}.`); }
    if (it === "join_group") { const code = String(d.value || d.item || "").trim();
      return say(window.SBGRPJOIN && SBGRPJOIN(code) ? `I opened Join${code ? ` with ${code} filled in` : ""}. Tap Join to check the code.` : "Joining a group needs you signed in and online. Open Groups and tap Join."); }
    if (it === "open_page") { const k = String(d.value || d.item || "").toLowerCase().replace(/^(my|the)\s+/, "").replace(/\s+(page|tab|view|section)$/, "").trim();
      if (/^(settings?|preferences|options)$/.test(k)) { setTimeout(() => { try { menuSheet(); } catch (e) {} }, 200); return say("Opening Settings."); }
      const tab = PAGES[k]; if (!tab && itemNamed("", k)) return itemAct("open_item", Object.assign({}, d, {item: k, kind: ""}), q, chat);
      if (!tab) return say(`I'm not sure which part of Studyboard "${k}" is. Try Today, Calendar, Flashcards, Notes, Courses, Files or Groups.`);
      setTimeout(() => { try { ui.tab = tab; if (tab !== "courses") ui.courseId = null; render(); window.scrollTo(0, 0); } catch (e) {} }, 200);
      return say(`Taking you to ${k.replace(/\b\w/g, c => c.toUpperCase())}.`); }
    // something the words don't ask for in a way the app can do: said plainly, and nothing is changed
    if (it === "cant") return say("I can't do that from the chat yet, so I didn't change anything. Tell me a bit more about what you want, or do it in Studyboard directly.");
    if (it === "add_note") {
      let text = String(d.text || "").trim();
      const pics = (att || []).filter(x => /^image\//.test((x.part && x.part.inline_data && x.part.inline_data.mime_type) || ""));
      if (/PHOTO_ITSELF/i.test(text)) { if (!pics.length) return say("Attach the photo (the paperclip), then ask again."); return photoNote(q, att, d.board); }
      if (/PHOTO_TEXT/i.test(text) || (!text && pics.length)) {
        if (!pics.length) return say("Attach the photo (the paperclip), then ask again.");
        if (!window.SBOCR || !SBOCR.readImage) return say("I can't read the words in photos on this device yet.");
        const outs = []; for (const p of pics) { try { const r = await SBOCR.readImage(p.part.inline_data, {}); if (r && r.text && r.text.trim().length > 3) outs.push(r.text.trim()); } catch (e) {} }
        if (!outs.length) return say("I couldn't read any words in that photo. Try a sharper, closer picture.");
        text = outs.join("\n\n");
      }
      if (!text) return say("What should the note say? For example: make a note that says Lab moved to Friday.");
      const c = courseOfName(d.course); let b = boardNamed(d.board), made = "";
      if (!b && d.board && !/^my notes?$/i.test(String(d.board).trim())) { b = boardFor(String(d.board).replace(/\s*\bboard\b\s*/i, " ").trim(), c); made = " (a new board)"; }
      const bid = b ? b.id : "", n = addNoteTo(bid, text, c ? c.id : "");
      if (!state.notes[n.id]) return null;
      if (bid) { ui.noteBoard = bid; try { localStorage.setItem(NB_KEY, bid); } catch (e) {} }
      return say(`Done. I put the note on ${b ? b.name : "My Notes"}${made}: "${clip(text.replace(/\s+/g, " "), 160)}"`, {actions: [{type: "open_notes", label: "Open Notes", done: "", deckName: "", deck: "", target: "", style: "", count: 0, course: "", board: bid, noteTitle: "", text: ""}]});
    }
    if (/^(stop|pause|resume)_timer$/.test(it) || it === "undo") { const k = A && A.control ? A.control({stop_timer: "stop the timer", pause_timer: "pause the timer", resume_timer: "resume the timer", undo: "undo"}[it]) : null; return k ? say(k.answer) : null; }
    if (it === "start_timer") {
      const t = d.task ? taskOf(d.task, chat) : null, mins = Number(d.minutes) > 0 && Number(d.minutes) <= 180 ? Math.round(Number(d.minutes)) : 0;
      if (!A || !A.startTimer || !A.startTimer(mins, t)) return null;
      return say(`Your ${mins || "focus"}${mins ? "-minute" : ""} timer is running${t ? ` for ${t.title}` : ""}. You've got this!`);
    }
    if (["delete_item", "rename_item", "open_item", "edit_item"].includes(it)) return itemAct(it, d, q, chat);
    if (it === "wear_accessory" || it === "remove_accessory") { const v = d.value || d.item || d.title; if (!v || !SBCOMP.wearByName) return null; return say(SBCOMP.wearByName(v, it === "wear_accessory")); }
    if (it === "set_theme") return themeAct(d);
    if (it === "change_setting") {
      const what = clip(String(d.field || "").trim(), 80), val = clip(String(d.value || "").trim(), 80); if (!what) return null;
      const ch = A && A.check ? A.check({ref: "SETTINGS", field: "setting", setting: what, value: val || "on"}, new Map()) : null; if (!ch) return null;
      // (not awaited: the Settings sheet waits for their tap, and the chat answers now instead of sitting on "Working out what to do…")
      A.propose([ch]).catch(e => console.warn("setting", e));
      return say(`I opened ${what} in Settings for you${val ? ` to set it to ${val}` : ""}. Check it there and confirm, and nothing changes until you do.`);
    }
    if (it === "make_map") return mapAct(`make a concept map ${d.topic ? "about " + d.topic : q}`);
    if (it === "find_notes" && A && A.findNotes) { const fn = await A.findNotes(`find my notes on ${d.topic || q}`).catch(() => null); return fn ? say(fn.answer, {sources: fn.show && fn.show.length ? ["Your notes"] : [], show: fn.show && fn.show.length ? A.pack(fn).show : undefined}) : null; }
    // from something they already have: a quiz from a deck (or card), cards from a quiz
    if (it === "make_quiz" && (/\b(deck|card|cards|flashcards?)\b/.test(String(q).toLowerCase()))) { const r = quizFromDeck(d.topic || d.deck || d.item || ""); if (r) return say(r); }
    if (it === "make_flashcards" && /\b(quiz|test|case study)\b/i.test(q)) { const hit = quizNamed(d.topic || d.item || ""); if (hit) return say(cardsFromQuiz(hit)); }
    if ((it === "make_flashcards" || it === "make_quiz") && att && att.length) { const r = attStudy(q, att) || attStudy(it === "make_quiz" ? "make a quiz" : "make flashcards", att); if (r) return r; }
    if (it === "make_flashcards" || it === "make_quiz") return deviceAct(`${it === "make_quiz" ? "make a quiz" : "make flashcards"} on ${d.topic || q.replace(/^.*?\b(on|about|for)\b/i, "")}`, chat, true);
    return null;
  }
  // a question, by its shape (for the AI step, which has no ask() in scope)
  const ISQ0 = x => /\?\s*$/.test(x) || /^\s*(what|what's|whats|who|why|how|when|where|which|is|are|do|does|did|can i|could i|should i|am i|will|would)\b/i.test(x);
  // A part of Studyboard by name, opened at once; after one, "now the calendar", "and notes" open the next
  const NAVW = {flashcards: "flashcards", "flash cards": "flashcards", cards: "flashcards", decks: "flashcards", quizzes: "flashcards", calendar: "plan", schedule: "plan", planner: "plan", week: "plan",
    notes: "notes", "note boards": "notes", "my notes": "notes", courses: "courses", classes: "courses", grades: "courses", marks: "courses", files: "files", groups: "groups", "study groups": "groups",
    today: "board", home: "board", dashboard: "board", board: "board", companion: "companion", chat: "companion", archive: "archive", timeline: "timeline", "concept maps": "maps", maps: "maps", "mind maps": "maps", settings: "settings"};
  const NAVRE = Object.keys(NAVW).sort((a, b) => b.length - a.length).join("|");
  function navAct(q, last){
    const w = String(q || "").toLowerCase().replace(/[?!.]+$/, "").trim();
    // leaving a group: done in Groups (it's their account and the other members), so that's where they're taken
    if (/^\s*(?:(?:can|could) you\s+|please\s+|i want to\s+|i wanna\s+)?(?:leave|quit|exit|get out of)\b[^.?!]*\b(group|team|squad)\b/.test(w)) {
      return {answer: "I can't leave a group from the chat, so nothing changed. Open Groups, pick the group, then tap Leave Group.", sources: [], followUps: [], actions: []}; }
    let m = new RegExp(`^(?:(?:can|could) you\\s+|please\\s+|ok(?:ay)?\\s+|now\\s+)?(?:take me to|take me back to|go to|go back to|bring me to|bring up|switch to|navigate to|jump to|open(?: up)?|show me|show)\\s+(?:my\\s+|the\\s+)?(${NAVRE})(?:\\s+(?:page|tab|view|section|screen))?(?:\\s+please)?$`).exec(w);
    if (!m && last && last.a && last.a.nav) m = new RegExp(`^(?:and|now|then|ok(?:ay)?|next)?[,\\s]*(?:the\\s+|my\\s+)?(${NAVRE})(?:\\s+(?:page|tab|one))?(?:\\s+(?:now|next|please))?$`).exec(w);
    if (!m) return null;
    const k = m[1], tab = NAVW[k], label = k.replace(/\b\w/g, c => c.toUpperCase()), say = a => ({answer: a, sources: [], followUps: [], actions: [], nav: tab});
    if (tab === "settings") { setTimeout(() => { try { menuSheet(); } catch (e) {} }, 200); return say("Opening Settings."); }
    const to = tab === "maps" ? "courses" : tab;
    setTimeout(() => { try { ui.tab = to; if (to !== "courses") ui.courseId = null; render(); window.scrollTo(0, 0); } catch (e) {} }, 200);
    return say(tab === "maps" ? "Concept maps live inside each course, so I'm taking you to Courses: pick a course, then Concept Maps." : `Taking you to ${label}.`);
  }
  // The companion's look, read in code: "what accessories do I have", "wear the second one", "take them both off", "make it red" (the
  // accessory just talked about), "make packy purple" (it has no colour of its own: said, with what can change), "dress up for the holidays"
  const ACCW = /\b(cozy scarf|scarf|tiny hat|festive beanie|graduation cap|beanie|hat|cap|little crown|crown|round glasses|sunglasses|glasses|party bow ?tie|bow ?tie|tie|champion medal|medal|hero cape|cape|star badge|badge)\b/i;
  const COLW = /\b(red|crimson|maroon|pink|rose|magenta|purple|violet|lavender|indigo|navy|dark blue|ocean blue|blue|light blue|sky blue|cyan|turquoise|teal|green|dark green|forest green|evergreen|mint|lime|olive|yellow|gold|orange|coral|peach|brown|tan|beige|gray|grey|silver|black|white)\b/i;
  function companionLook(q, chat){
    const w = String(q || "").toLowerCase().trim(), me = info() || {}, nm = String(me.name || "").toLowerCase(), say = a => ({answer: a, sources: [], followUps: [], actions: []});
    const aboutMe = new RegExp(`\\b(you|your|yourself|packy|companion${nm ? "|" + nm.replace(/[^a-z0-9 ]/g, "") : ""})\\b`).test(w);
    const recent = ((chat && chat.msgs) || []).slice(-3).reverse().map(x => (x.q || "") + " " + (x.a ? x.a.answer : "")).join(" ");
    const lastList = ((chat && chat.msgs) || []).slice(-1).map(x => x.a && x.a.accList).filter(Boolean)[0];
    if (/\b(what|which)\b[^?]*\b(accessor(y|ies)|outfits?|things? (can|could) (you|u|i) wear|can (you|u) wear|clothes)\b[^?]*\b(have|own|got|earned|unlocked|wear)\b|\bwhat can (you|u) wear\b/.test(w)) {
      const own = SBCOMP.ownedNames(); if (!own.length) return say("I haven't earned any accessories yet. The Wardrobe shows how to unlock them.");
      return Object.assign(say(`I can wear: ${own.map((x, i) => `${i + 1}. ${x}`).join(", ")}. Say which one to put on.`), {accList: own}); }
    const ord = /\b(?:the\s+)?(first|1st|second|2nd|third|3rd|fourth|4th|fifth|5th|last)(?:\s+one)?\b/.exec(w);
    if (lastList && ord && /\b(wear|put|try|on)\b/.test(w)) { const k = {first: 0, "1st": 0, second: 1, "2nd": 1, third: 2, "3rd": 2, fourth: 3, "4th": 3, fifth: 4, "5th": 4}[ord[1]], it = k == null ? lastList[lastList.length - 1] : lastList[k]; if (it) return say(SBCOMP.wearByName(it, true)); }
    if (/\b(take|remove)\b[^.?!]*\b(them|both|everything|all|it all)\b[^.?!]*\b(off)?\b/.test(w) && /\b(off|remove)\b/.test(w) && (aboutMe || ACCW.test(recent))) return say(SBCOMP.wearByName("all", false));
    if (/\b(dress|deck)\b[^.?!]*\bup\b|\b(holiday|festive|christmas|winter) (outfit|look)\b/.test(w) && (aboutMe || /\bup\b/.test(w))) {
      const own = SBCOMP.ownedNames(), pick = own.filter(x => /beanie|scarf|cape|crown|hat/i.test(x)).slice(0, 2);
      if (!pick.length) return say("I don't have anything festive to wear yet. The Wardrobe shows what I can earn.");
      return say(pick.map(x => SBCOMP.wearByName(x, true)).join(" ")); }
    const col = (COLW.exec(w) || [])[1];
    if (col && /\b(make|turn|change|recolou?r|paint|dye|set|match)\b/.test(w) && !(window.SBTRUTH && SBTRUTH.courseIn && SBTRUTH.courseIn(q.replace(COLW, " ")))) {
      const acc = (ACCW.exec(w) || [])[1] || (/\b(it|that|this|them|the same)\b/.test(w) ? (ACCW.exec(recent) || [])[1] : "");
      const c2 = col === "evergreen" || col === "forest green" ? "dark green" : col === "ocean blue" ? "blue" : col;
      if (acc) return say(SBCOMP.tintByName(acc, c2));
      if (aboutMe) return say(`I can't change my own colour, but I can change my accessories' colours. Try: make my scarf ${c2}.`);
    }
    if (/\b(change|reset|set)\b[^.?!]*\b(colou?r)\b[^.?!]*\b(back|default|normal)\b/.test(w) && aboutMe) return say("My own colour doesn't change, so there's nothing to reset. You can recolour my accessories, like: make my scarf blue.");
    return null;
  }
  // "What are you wearing?", "what accessories do you have on?", "who are you?", "what are you?", "what's your name?"
  function selfAnswer(q){
    const t = String(q || "").toLowerCase().replace(/[?!.]+$/, ""), me = info(); if (!me) return "";
    const worn = SBCOMP.wornNames ? SBCOMP.wornNames() : [], list = worn.length > 1 ? worn.slice(0, -1).join(", ") + " and " + worn[worn.length - 1] : worn[0] || "";
    const a = /^(an?|the)\s/i.test(me.kind) ? me.kind : /^[aeiou]/i.test(me.kind) ? "an " + me.kind : "a " + me.kind;
    // ("put your scarf on", "take off your glasses" are requests, done by the AI step, not questions)
    if (/\b(put|take|wear|try|remove|switch|change|give|equip|swap)\b/.test(t) && !/^\s*(what|which|are you|do you)\b/.test(t)) return "";
    if (/\b(wearing|wear|have on|got on|accessor(y|ies)|outfit|dressed|hat|glasses|on your (head|face))\b/.test(t) && /\b(you|your|u|ur)\b/.test(t))
      return worn.length ? `I'm wearing my ${list}.${me.kind ? ` (I'm ${a.toLowerCase()} myself!)` : ""} You can change my look in the Wardrobe.` : `Nothing right now! You can pick accessories for me in the Wardrobe.`;
    if (/\b(can i|could i|how (do|can) i|let me) (re-?name|change) (you|u|your name)\b|\b(change|rename) your name\b/.test(t))
      return `Yes! Press and hold me (right-click me on a computer) to open my settings, and type a new name in the Name box.`;
    if (/\bwho (made|created|built|designed) (you|u)\b|\bwhere (do|did) (you|u) come from\b/.test(t))
      return `I'm ${me.name}, Studyboard's study companion. Studyboard made me to keep you company while you study, and I live right here in your planner.`;
    if (/\b(what('?s| is) your name|who are (you|u)|what are (you|u)|what kind of (thing|creature|companion|animal) are (you|u)|tell me about (yourself|you)|introduce yourself)\b/.test(t))
      return `I'm ${me.name}${me.kind ? `, ${a.toLowerCase()}` : ""}, your study companion.${me.bio ? " " + me.bio : ""}${worn.length ? ` Right now I'm wearing my ${list}.` : ""}`;
    return "";
  }
  const CHAT_MAX = 100000;
  /* ---------- Claude (Studyboard AI Pro, or a Claude key in Studyboard AI Pro Mode): one step that understands, answers and does ----------
     The small on-device models need the steps above (exact handlers, a narrow intent step, then checks of its choice against the
     words). Claude doesn't: those steps, made for the small models, were what went wrong for it (a "set it back to to-do" the words
     check turned into chat, "extended by 2 days" counted from today because the intent step never saw due dates, cards made from
     the wrong note). So with Claude, one request carries the whole planner with a ref for everything, the conversation and what each
     earlier reply changed; Claude answers and lists the changes, and the app checks each one against the planner (98-assist.js
     check), makes the valid ones in one step (one undo) and says plainly what it couldn't do. Never on the device's AI. */
  const claudeMode = () => { try { return !(typeof aiOnDevice === "function" && aiOnDevice()) && typeof aiSbMode === "function" && typeof aiCfg === "function" && aiSbMode(aiCfg()); } catch (e) { return false; } };
  const AG_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const AGENT_SCHEMA = {type: "OBJECT", properties: {
    answer: {type: "STRING", description: "Your reply to the student, written as if every change you list below is already made"},
    changes: {type: "ARRAY", items: {type: "OBJECT", properties: {ref: {type: "STRING"}, item: {type: "STRING"}, field: {type: "STRING"}, value: {type: "STRING"}, scope: {type: "STRING"}, setting: {type: "STRING"}}}},
    newTasks: {type: "ARRAY", items: {type: "OBJECT", properties: {title: {type: "STRING"}, course: {type: "STRING"}, type: {type: "STRING"}, due: {type: "STRING"}, time: {type: "STRING"}, priority: {type: "STRING"}, notes: {type: "STRING"}}}},
    newEvents: {type: "ARRAY", items: {type: "OBJECT", properties: {title: {type: "STRING"}, date: {type: "STRING"}, from: {type: "STRING"}, to: {type: "STRING"}, where: {type: "STRING"}, course: {type: "STRING"}}}},
    newCourses: {type: "ARRAY", items: {type: "OBJECT", properties: {name: {type: "STRING"}, code: {type: "STRING"}, instructor: {type: "STRING"}, room: {type: "STRING"}, color: {type: "STRING"}}}},
    newClasses: {type: "ARRAY", items: {type: "OBJECT", properties: {course: {type: "STRING"}, kind: {type: "STRING"}, days: {type: "STRING"}, from: {type: "STRING"}, to: {type: "STRING"}, where: {type: "STRING"}}}},
    newNotes: {type: "ARRAY", items: {type: "OBJECT", properties: {text: {type: "STRING"}, board: {type: "STRING"}}}},
    newDecks: {type: "ARRAY", items: {type: "OBJECT", properties: {name: {type: "STRING"}, course: {type: "STRING"}, cards: {type: "ARRAY", items: {type: "OBJECT", properties: {front: {type: "STRING"}, back: {type: "STRING"}}}}}}},
    newCards: {type: "ARRAY", items: {type: "OBJECT", properties: {deck: {type: "STRING"}, front: {type: "STRING"}, back: {type: "STRING"}}}},
    timer: {type: "OBJECT", properties: {do: {type: "STRING"}, minutes: {type: "NUMBER"}, task: {type: "STRING"}}},
    undo: {type: "BOOLEAN"},
    study: {type: "STRING"},
    map: {type: "OBJECT", properties: {topic: {type: "STRING"}, course: {type: "STRING"}, expand: {type: "BOOLEAN"}}},
    show: {type: "ARRAY", items: {type: "STRING"}},
    page: {type: "STRING"},
    theme: {type: "STRING"},
    wear: {type: "ARRAY", items: {type: "OBJECT", properties: {item: {type: "STRING"}, on: {type: "BOOLEAN"}, color: {type: "STRING"}}}},
    group: {type: "OBJECT", properties: {do: {type: "STRING"}, name: {type: "STRING"}, code: {type: "STRING"}}}},
    required: ["answer"]};
  const AGENT_RULES = `You read the student's newest message in the light of the conversation, then answer it and, when they ask for something to be done in Studyboard, do it. Reply with ONE JSON object: {"answer": "..."} plus only the keys you need from the list under DOING THINGS.

DOING THINGS
Studyboard makes every change you put in the JSON the moment you reply, then shows your answer. So write the answer as done, one short sentence per change with the exact name and the new value ("Moved Lab Report: Cardiac Cycle to Sat, Nov 28."). Never tell them to do something themselves that you can do here, never ask them to confirm a change they asked for, and never say you did anything that isn't in the JSON.
- Any wording counts: "tick off the quiz", "history essay got extended by 2 days", "journal 3: 9/10 :)", "psych midterm = top priority", "gym tmrw 7am", "it's actually for psych", "lab report due thursday at 11:59pm", "foundations instructor is Ms. Brooks". A statement of a new fact about their planner (a new due date, a mark they got, a room, a new appointment, a class they dropped) is a request to update it. But a date said in passing while they tell a story or vent ("ugh my lab partner, and the cardiac lab is due thursday") that differs from the planner: point out the planner's date and ask which is right; change nothing yet.
- Concept maps live in each course (Courses, then the course's Maps). "Open concept maps": go to Courses and say where they are. To make one ("map out the defense mechanisms", "a mind map of WWI causes"), use "map" (below); keep your answer to a short line, the app adds what it made.
- "Colours" or "a look" for Studyboard ("put the ocean colours on") is a theme; only an accessory they name ("make your scarf blue") is a wear colour.
- A question changes nothing ("is chapter 7 for foundations?", "did I finish care plan 2?", "psych quiz 1 was 17/20 right?", "how do I add a course?"): just answer it. So does chat, and a plan they mention ("I'll do the reading later").
- Several things in one message: do every one of them. "both", "all my A&P tasks", "everything due this week": one change per matching item (check each against the data).
- Follow-ups belong to the conversation: "it", "that one", "the a&p one", "same for chapter 7", "and the quiz too", "actually one more day", "make it 30 min", "do the same for thursday and saturday", or a bare "thursday" / "blue" / "the care plan, out of 20" answering what you just asked. The [Studyboard changed: ...] lines show what each earlier reply really changed (old → new).
- "undo", "undo that", "never mind, leave it", "put it back" right after a change: "undo": true reverses the whole last change. To reverse only part of it ("undo just the lab report part", "no just the care plan, not the midterm"), set those fields back to their old values from the [Studyboard changed] line instead. "I meant X" right after a change to the wrong item: put the wrong one back and make the change to X.
- Dates: use CALENDAR for weekdays ("friday" is the next Friday from today, "next tuesday" the Tuesday of next week). A change counted from something ("push it back a week", "extended by 2 days", "moved up a day", "one more day", "2 days before the history essay", "the day after the study group") is counted from that item's current date in the data, not from today. A date that doesn't exist (Nov 31) or a day you can't tell: ask, change nothing.
- When you asked a question and they answer it ("thursday", "sunday", "the cardiac lab", "diastole"), do it now, filling in anything else with what you suggested; never ask the same question twice. But "i finished it" with nothing in the conversation saying what: ask which task.
- Ask first before deleting several things at once or anything that has a mark ("clear all my done tasks").
- "Push", "move back", "extend" mean later: "push it to wednesday" is the next Wednesday after its current due date, never earlier.
- Marks are numbers ("17/20", "85%"). A letter grade ("I got an A on the essay"): mark it done if they finished it and ask for the score; don't save a letter.
- A deck given just a name ("make me a deck" then "Cardiology", "call it Psych Meds") is an empty deck: write cards only when they ask for cards on something. A card whose topic doesn't fit the deck they named ("add sublimation card to heart"): ask which deck.
- "The study group" when there's a calendar event called Study group is that event (rename it with its title), not a Study Groups group.
- "Add those to my calendar" after a plan you wrote: newEvents on the plan's days and times, titled plainly (no time estimates in titles).
- A timer started while one task is being talked about ("ok start a timer", "let's do 25 min" for the essay) is for that task: give its ref.
- Something you can't do ("call the clinical coordinator", "text my study group that we're moving to 7"): say so and offer a reminder, but change and add nothing unless they ask.
- "Answers?" or "what are the answers" after practice questions you gave: give the answer key.
- Change only what they asked for: nothing extra (no notes, weights or priorities they didn't mention). Numbers they give you for a calculation or a what-if ("the midterm is worth 40%, A is 90") change nothing unless they ask you to save them.
- A new due date or event day in the past ("move the essay to yesterday"): say it's in the past and ask if they're sure; change nothing yet.
- Deleting: only when the words name the item clearly. "Delete the quiz" when they have several quizzes (open or done): ask which. Dropping a course: ask first.
- When you truly can't tell which item they mean (two match equally) or a needed detail is missing (a new task with no name), ask one short question and change nothing. If one item clearly fits, just do it.
- "Go ahead", "do it", "yes", "sure" right after you offered or suggested changes: make exactly those changes now.
- "undo" can go together with other changes in one reply (the undo happens first): "oops I meant the journal, undo that" = "undo": true plus the change to the journal. But a task you just deleted along with other changes ("don't delete 3, mark it done instead"): a change on its X ref under RECENTLY DELETED TASKS brings just that one back, so no undo.
- "I'm putting that on a sticky note", "I'll add it later": what they'll do themselves; add nothing.
- Something repeating ("every sunday until the exam", "a weekly reminder to review my heart cards"): add one task or event for each date, up to the date they give or for the next 4 weeks, and say which dates.
- Notifications or alerts ("turn on notifications for my study group"): they need the student's own OK in the browser, so you can't switch them on yourself. Open them with "page": "reminders" and say to turn on the reminders they want there (they cover events like the study group and due dates). Not a SETTINGS change.
- App settings (text size, notifications and reminders, daily study hours, language, sounds, the daily quote...) you change with a SETTINGS change: never say a setting can't be changed before trying.
- Something Studyboard can't do (send an email or text, check or submit on Brightspace, book or buy something, print, a phone alarm, see their other apps): say so honestly in one sentence, change nothing, and offer what you can do instead (like adding a task or an event to remind them). Never pretend.

What you can change, and how (refs are the codes in the data, like T3, C2, K14, D1, F5, N2):
- "changes": [{"ref","item","field","value","scope"}] on things that exist; "item" is that thing's name exactly as listed next to its ref (a check that the ref is the right row).
  task (T): title; due (YYYY-MM-DD); time (HH:MM 24h, "" for none); status todo|doing|done ("not started"/"to-do"/"reopen" = todo; "I've started X", "mark X in progress" = doing, but only when they name the task or ask for the change: "ok starting now" in a pep talk is encouragement to answer, not a change; finished/submitted/handed in = done); priority low|med|high|urgent ("important", "top priority" = high, unless they say urgent); notes; hours; type; course (a C ref: "it's actually for psych"); weight; mark ("17/20", "42/50", "85%"; "" to take a mark off; if it already has a different mark and they didn't say it's a correction or a regrade, ask first); delete yes.
  course (C): name, code, instructor, room, color (a colour word or #RRGGBB), delete yes (only once they confirm dropping it; its tasks stay unless they say to delete them too).
  a marked item (G): mark (the same as its task's mark).
  event (K that is an event): title, date, from, to, where, notes, delete yes ("make it an hour longer" = a later "to"; moving the start keeps the length: change from and to).
  class (K that is a class): with scope "once" (that day only: date, from, to, skip yes) or "all" (every week: from, to, where, weekday).
  deck (D): name, delete yes. card (F): front, back, delete yes. sticky note (N): text (the whole new text: "add X to my REBT note" = that note's text with X added, never a new note), delete yes. file (P): name, course, delete yes.
  app settings: {"ref":"SETTINGS","field":"setting","setting":"<which, in words>","value":"<new value>"}.
- "newTasks": [{"title","course" (C ref),"type" (Assignment|Exam|Quiz|Reading|Project|Lab|Study|Other),"due","time","priority","notes"}] for schoolwork and things to do or hand in, things they say they need to do ("i need to review the rubric tonight"), study time with no clock time ("study for the final every sunday": type Study, one per day), and reminders: "remind me to email Dr. Lee", "add a reminder to email my instructor before Wednesday" is a task ("Email clinical instructor") due then. You can't send the email, but the reminder you CAN add, so add it.
- "newEvents": [{"title","date","from","to","where","course"}] for things at a time: appointments, shifts, gym, dinners, meetings, office hours, study sessions, practices. One per date ("every sunday until the exam" = one for each of those Sundays). Copy time and place from another event when they say "same time and place as ...".
- "newCourses": [{"name","code","instructor","room","color"}].
- "newClasses": [{"course": C ref,"kind": "Lecture"|"Lab"|"Tutorial"|"Seminar"|"Office Hours","days": "Mon,Wed","from","to","where"}]: a course's weekly class times ("add psych mondays and wednesdays 10-12", "BIOS lab is fridays 2-5").
- "newNotes": [{"text","board"}]: a sticky note with their words (board: a note board's name, or "" for My Notes). "Remember that ...", "note to self", "jot down", "sticky note: ...", and the words they give after you asked what a note should say, are a note (never a task, and never a task's notes), even when the words mention buying or emailing something, and even when it's news about an event or task ("remember that the study group is moving to room 6" is a note; the event stays as it is).
- "newDecks": [{"name","course","cards":[{"front","back"}]}]: flashcards. Write the cards yourself: accurate, one fact each, a clear question on the front. From the note, deck or topic they name (the note's full text is in STICKY NOTES); the number they ask for, else 6 to 10. An empty new deck has "cards": [].
- "newCards": [{"deck": D ref,"front","back"}]: cards into an existing deck. "keep only 4" = delete the rest of that deck's cards (their F refs are under CARDS IN); "make them harder" = new front/back on those F refs; "put those in my X deck instead" = newCards into X with the same cards, and delete the deck you just made; "make a new deck called WWI for it" = a new deck holding that card, and delete the card or deck it was in. Before adding a card, look at the deck's cards under CARDS IN: if the same card is already there, ask instead of adding a copy. When they give a card's front and back after you asked ("what does the AV node do / delays the impulse"), add it. "Save those as cards" after a quiz: a card for every question of that quiz (all of them, including ones you haven't asked yet). Only use notes, decks or files that exist: "the note I just made" when no note was just made gets a question.
- "timer": {"do": "start"|"stop"|"pause"|"resume"|"link","minutes","task": T ref}. A pomodoro is 25 minutes. "make it 50 minutes" while one runs = start 50. "it's for the a&p quiz" while one runs = link.
- "undo": true (see above).
- "map": {"topic","course": C ref}: a concept map made by the app on that topic, saved in the course the topic belongs to (defense mechanisms: Psychiatric Nursing; the heart: A&P); "" only when it fits no course. More on the map you just made ("add the valves", "add more from my note"): {"expand": true, "topic": what to add}. Making a map simpler or taking ideas off can't be done from the chat: say so (they can delete ideas on the map itself); never make a second copy.
- "study": a D ref, to start a flashcard study session on that deck ("study my heart deck", "start a flashcard session for psych terms", "study them" after making cards).
- "show": [refs] only when they ask to open, find or go to a particular thing ("open my heart deck", "where's my freud note"); "show me them", "list my quizzes", "what's in it" are answered in the chat, listing them in your answer. "page": today|calendar|flashcards|notes|courses|files|groups|grades|settings|reminders|companion when they ask to go to a part of the app.
- "theme": a theme's name, or dark|light|system. A theme or mode isn't reversed by "undo": to set it back ("undo the dark mode"), give the theme or mode it was before (in the [Studyboard changed] line, or LOOK NOW). "wear": [{"item","on": true|false,"color"}] for what you (the companion) wear: put on, take off, or recolour an accessory you have. Only the accessories listed as yours: asked for one you don't have (a beanie, a crown), say you haven't unlocked it yet (the Wardrobe shows how) and wear nothing else instead.
- "group": {"do": "new"|"join","name","code"}: start a study group (it opens New Group filled in) or join one with an invite code.

ANSWERING
- About their planner: read it exactly from the data (titles, due dates with the weekday, times, marks, rooms, instructors). "What am I working on" = tasks with status doing. A task marked OVERDUE is late: say so ("was due Mon, Nov 23, so it's overdue"), never as if it's still coming up. When they ask for a list (what's due, my marks, my quizzes, what's tomorrow), include every matching item from the data, done and open where it fits, and nothing that doesn't match. "Today"/"tomorrow" include classes and events from CLASSES AND EVENTS BY DATE as well as tasks due. Count and compare carefully. Never invent their data; if something they ask about in their planner isn't there, say so briefly.
- "What should I do next" and plans for today: follow TODAY'S PLAN and DO THIS NEXT. But when the conversation is about one course or worry ("i'm scared of failing A&P" then "what do i do first"), answer within that: the first step for A&P.
- A follow-up keeps the subject and time frame just discussed: "make me a 2 day plan" right after talking about A&P Quiz 4 is a plan for that quiz; "so what should i focus on" after talking about next week is about next week.
- "Like what?" after you suggested something small: name one small, concrete step on one of their real tasks. "You're just saying that": back it up with real marks or progress from the data (19/20 on Foundations Quiz 1). "What do you think about me": say something kind based only on what the data shows (their marks, what they've finished), never personality traits you can't know.
- Time they have ("I have the whole weekend free", "I've got a free hour now", "2 hours tonight"): that's study time to plan, so suggest what to do with it from what's due soonest (name the tasks and roughly how long each), and "split it up for me" then means a schedule for that time.
- "Quiz me on what's due this week" means on the material those tasks cover (the A&P quiz's heart content, the psych terms), never on due dates.
- Their notes, cards and files: quote and explain what they say (STICKY NOTES has each note's text).
- Subject questions (science, history, maths, words, anything): answer from your own knowledge, correctly, directly and at the depth asked. Start with the answer itself. Don't mention their planner, notes or files unless they help with this question, and never say what you checked or that a topic "isn't in your notes" or "isn't in your planner".
- Something to write (a study plan, a schedule, a timeline, a mnemonic, a rhyme, a summary, an email draft, practice questions): write it in the answer. If they say "quiz me" or "ask me ...", ask one question at a time (the question only, never its answer) and mark their answer next turn: check it carefully against the facts (an order of steps must be the right order), say right or wrong plainly, give the correct answer when it's wrong, then ask the next question. A quiz on a deck uses that deck's cards (under CARDS IN).
- Just chatting (hello, how are you, feelings, jokes, questions about you): reply like a friend, briefly, to exactly what they said, and follow the conversation; play along with games and jokes. Don't bring up their tasks, deadlines, today's plan, the timer or what to work on unless they bring up school themselves, and never end a chat reply with "want to start on X?". When they do bring up school (stress about an exam, "I still have a lab report"), mention only what they brought up, kindly. When they mention a plan or event on a day ("my cousin's wedding saturday", "I have clinical wednesday"), match it to the planner: say kindly if something is due that day or if their planner has it on another day (clinical orientation is Friday). A mark they mention while venting that's already saved ("my quiz 1 was 11/20 too") is a feeling to answer kindly, not something to save. When they ask you for something to write or say (a motto, a pep talk, a joke "about nursing"), write it. Never repeat a suggestion you already made. Don't start a timer or change anything because of a feeling or a plan they mention ("ok 25 min then sleep"): just encourage them, unless they ask you to start one.
- Plans and schedules: never put work on a task after its due date, keep a task's parts in order, fit the time they said ("after dinner" is the evening, "2 hours tonight" is two hours), and stick to the plan you already gave when they ask "what after that".
- Your first words must agree with the rest: a yes/no question starts with the right "Yes" or "No" ("is HTML a programming language?": "No, it's a markup language"); "am I failing anything?" with a course below its pass mark starts "Yes, A&P".
- Use only numbers the data gives: no made-up weights ("worth 50%"), percentages or durations. "How long will that take" about a plan you gave: the total for every part of it.
- "Can I take tonight off": answer kindly, and say what's due tomorrow so they can decide. "How short?" after you suggested a short session: how many minutes. "Should I keep going?" after hours of study: suggest a break first. "I don't know where to start" on a task: the first small step on that task.
- A plan for time they have ("3 hours saturday"): include everything due that day.
- Quizzing: if they answer several questions but you asked one, say you asked only one and mark that one. An instruction during a quiz ("only heart", "stop", "switch to psych") is an instruction, not an answer.
- Undoing a setting you changed ("undo that" after text size): set it back to its old value (in the [Studyboard changed] line) with a SETTINGS change; "undo" doesn't reach settings.
- Write dates like "Wed, Nov 25" (never "Wednesday Wed"). Say only facts you're sure of: no made-up firsts, awards, dates or numbers; count items carefully (a course's decks are the ones with that course).
- A mnemonic or memory trick for something in their notes uses what the note says (REBT's note has the ABC model: build on A, B, C).
- Mnemonics, rhymes, jokes, mottos: write only the final version (no drafts or "no, better:"), check that a mnemonic's letters really spell the word, and "shorter" means one or two lines. "Another one" means another of the same thing you just gave.
- "Ask me ..." / "quiz me": give the question only, never its answer; "I give up" or "skip": give that question's answer, then the next question.
- In nursing talk "pt" means the patient. "Switching subjects" in study talk means another course or topic.
- Crisis lines only when they say something about hurting themselves, not wanting to live, or being in danger. "Please I need help" about a text message isn't that; and when they say never mind or move on, follow them without repeating it.
- Your own colour can't be changed, only your accessories' colours ("make packy purple", "dress up bramble": a change to a companion by any name means you, the companion they're talking to; say kindly your own colour can't change and offer an accessory colour). Say you're wearing only what's listed as worn.
- Plain text, no emojis; short paragraphs or "- " bullets; **bold** sparingly. Be brief unless they want detail.`;
  // today and the weeks around it, so "friday", "next tuesday" and "the 1st" are read off, not worked out
  function agCalendar(){ const t = todayISO(), L = []; for (let i = -7; i <= 28; i++) { const d = addDays(t, i); L.push(`${AG_DAYS[parse(d).getDay()]} ${d}${i === 0 ? " (today)" : i === 1 ? " (tomorrow)" : ""}`); } return "CALENDAR: " + L.join(", "); }
  // how Studyboard looks now (so "undo the dark mode" or "go back to my old theme" can be set back)
  function agLook(){ try { const sk = (SKINS || []).find(x => x.id === styleCfg().skin), mode = (() => { try { return localStorage.getItem(THEME_KEY) || "system"; } catch (e) { return "system"; } })();
    return `LOOK NOW: ${sk ? sk.name + " theme" : "default theme"}, ${mode === "system" ? "light or dark following the device" : mode + " mode"}.`; } catch (e) { return ""; } }
  function agTimer(){ try { if (typeof pomo === "undefined" || !(pomo.running || pomo.left > 0)) return "FOCUS TIMER: not running."; const ms = pomo.running ? pomo.endAt - Date.now() : pomo.left, t = pomo.taskId && state.tasks[pomo.taskId];
    return `FOCUS TIMER: ${pomo.running ? "running" : "paused"}, ${Math.max(0, Math.round(ms / 60000))} min left${t ? ", for " + t.title : ""}.`; } catch (e) { return ""; } }
  const agHex = (w, c) => { const s = String(w || "").toLowerCase().trim(); let hex = (/#[0-9a-f]{6}\b/i.exec(s) || [])[0] || ""; if (!hex) { const hit = Object.keys(NAMED).sort((a, b) => b.length - a.length).find(n => new RegExp("\\b" + n + "\\b").test(s)); if (hit) hex = NAMED[hit]; }
    if (!hex) return ""; const anyOk = typeof anyColorLocked === "function" && !anyColorLocked(); if (anyOk || typeof COURSE_COLORS === "undefined" || COURSE_COLORS.some(x => x.toLowerCase() === hex.toLowerCase())) return hex.toUpperCase();
    const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)), a = rgb(hex); let pick = hex, bd = 1e9; COURSE_COLORS.forEach(x => { const b = rgb(x), dd = (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2; if (dd < bd) { bd = dd; pick = x; } }); return pick.toUpperCase(); };
  const CLAIM_A = /\b(?:i'?ve|i have|i)\s+(?:just\s+|now\s+|also\s+)?(?:made|opened|saved|put|turned|switched|marked|moved|added|created|set|changed|deleted|removed|renamed|started|filled|linked|recoloured|recolored)\b|^\s*(?:done|all set|made|opened|saved|added|moved|marked|changed|deleted|renamed|started|switched|turned|created)\b/i;
  // "Mon, Dec 5" / "Monday, December 5" with the wrong weekday: put right from the date (this year, or next when it's months back)
  function agWeekdays(s){
    const MO = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"], LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"], t = todayISO();
    return String(s || "").replace(/\b(Sun|Mon|Tue|Wed|Thu|Fri|Sat)(day|sday|nesday|rsday|urday)?(,?\s+)(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)([a-z]*\.?\s+)(\d{1,2})\b/g, (x, w, wl, sp, mo, mo2, dd) => {
      try { const m = MO.indexOf(mo.toLowerCase()); let y = Number(t.slice(0, 4)); let iso = `${y}-${String(m + 1).padStart(2, "0")}-${String(dd).padStart(2, "0")}`; if (iso < addDays(t, -120)) iso = `${y + 1}${iso.slice(4)}`;
        const k = parse(iso).getDay(); if (isNaN(k)) return x; const right = wl ? LONG[k] : LONG[k].slice(0, 3); return right + sp + mo + mo2 + dd; } catch (e) { return x; } });
  }
  const agWords = s => (String(s || "").toLowerCase().match(/[a-z0-9&]{3,}/g) || []).filter(w => !/^(the|and|for|with|from|this|that|deck|card|task|event|class|note|course)$/.test(w));
  const agLabel = t => { let s = ""; try { s = window.SBASSIST.labelOf(t); if (t.kind === "course" || t.kind === "class") { const c = state.courses[t.id]; if (c) s += " " + c.name + " " + (c.code || ""); } } catch (e) {} return s; };
  async function claudeTurn(q, c){
    const A = window.SBASSIST; if (!A || !A.catalog || !A.check || !A.build) return null;
    const past = (c.msgs || []).filter(x => x.q && (x.a || x.err)).slice(-8);
    // the cards of decks the chat just made or touched, or that the message names (so "keep only 4", "make them harder" have refs)
    const ql = q.toLowerCase(), dk = new Set();
    past.slice(-3).forEach(x => { const a = x.a || {}; (a.decks || []).forEach(id => dk.add(id)); if (a.ref && a.ref.kind === "deck") dk.add(a.ref.id); if (a.card && a.card.deck) dk.add(a.card.deck); });
    // (a few small decks: every card goes, so "review my weakest cards" or "quiz me on my cards" can be answered from them)
    if (decksArr().reduce((n, d) => n + (d.cards || []).length, 0) <= 200) decksArr().forEach(d => dk.add(d.id));
    decksArr().forEach(d => { const n = String(d.name || "").toLowerCase(); if (n && (ql.includes(n) || n.split(/\s+/).filter(w => w.length > 3).some(w => ql.includes(w)))) dk.add(d.id); });
    const cat = await A.catalog(q, {max: 90000, decks: [...dk], full: true});
    // tasks deleted in the last half hour, with refs: "don't delete 3, mark it done instead" is "undo" plus a change to it (made after
    // the undo brings it back); without them Claude had nothing to point at and said it couldn't
    try { const gone = Object.values(state.trash || {}).filter(e => e && Date.now() - (e.deletedAt || 0) < 30 * 60000).flatMap(e => (e.items || []).filter(i => i.kind === "task" && i.data && !state.tasks[i.id])).slice(0, 10);
      if (gone.length) cat.text += "\n\nRECENTLY DELETED TASKS (a change on one of these brings that one task back with the change made; nothing else is undone, so don't use \"undo\" for this):\n" + gone.map((i, n) => { const k = "X" + (n + 1); cat.refs.set(k, {kind: "task", id: i.id, gone: i.data}); return `${k} | ${clip(i.data.title, 90)}`; }).join("\n"); } catch (e) {}
    const me = info() || {}, worn = SBCOMP.wornNames ? SBCOMP.wornNames() : [], owned = SBCOMP.ownedNames ? SBCOMP.ownedNames() : [];
    // today's plan (its order and time blocks) only when the talk is about time or work: sent with every message, it was brought into
    // greetings, feelings and a question about opportunity cost ("Reflection Journal 3 is still waiting for you")
    const recent = [q].concat(past.slice(-2).map(x => x.q || "")).join(" ");
    const planTalk = /\b(plan|next|now|today|tonight|tomorrow|this week|weekend|should i|first|priorit\w*|focus|free|time|hours?|minutes?|schedule|busy|study|studying|work on|do now|due|behind|catch up|overdue|late|deadline|start|finish|timer|pomodoro|session|after (that|this|dinner|class))\b/i.test(recent);
    let facts = ""; if (planTalk) try { facts = aiPlannerFacts({grades: false, plan: true}) || ""; } catch (e) {}
    let skins = []; try { skins = (SKINS || []).filter(x => typeof owns !== "function" || owns("skin", x.id)).map(x => x.name).slice(0, 12); } catch (e) {}
    // the other companions they have (a student calls them by those names too: "evening packy", "who's bramble?")
    // every companion in Studyboard, and which the student has ("who's bramble?" when Bramble isn't theirs got "I don't know a Bramble")
    const pals = (() => { try { return (SBCOMP.all ? SBCOMP.all() : []).filter(x => x.name !== me.name).slice(0, 80).map(x => `${x.name}${x.kind ? " (" + x.kind + ")" : ""}${x.owned ? "" : " [not unlocked]"}`); } catch (e) { return []; } })();
    const boards = (() => { try { return ["My Notes"].concat(noteBoards().map(b => b.name)).join("; "); } catch (e) { return "My Notes"; } })();
    // how the app works, always (a question about the app doesn't always look like one: "does it connect to brightspace")
    const guide = A.GUIDE ? "\n\n" + A.GUIDE : "";
    const hist = past.map(x => `Student: ${x.q}\nYou: ${x.a ? clip(x.a.answer, 1500) : "(no reply: " + clip(x.err, 80) + ")"}${x.a && x.a.log && x.a.log.length ? `\n[Studyboard changed: ${x.a.log.join("; ")}]` : ""}`).join("\n\n");
    const CARE = window.SBCARE, careMode = !!CARE && (CARE.distress(q) || past.slice(-4).some(x => x.a && x.a.care)), integ = !!CARE && [q].concat(past.slice(-3).map(x => x.q || "")).some(x => CARE.integrity(x));
    const system = `You are ${me.name || "a study companion"}${me.kind ? ", a " + me.kind : ""}, the student's friendly study companion living inside their Studyboard planner. Stay in character; if they sincerely ask whether you're an AI, real or alive, say honestly and warmly that you're an AI study companion in Studyboard, with no feelings or life of your own, and carry on in character.${me.bio ? "About you: " + clip(me.bio, 160) + " " : ""}${worn.length ? `RIGHT NOW YOU'RE WEARING: ${worn.join(", ")} (nothing else). ` : "RIGHT NOW YOU'RE WEARING NOTHING: no hat, no accessories at all. "}${owned.length ? `Accessories you've unlocked (in your wardrobe, NOT being worn unless listed as worn just above): ${owned.join(", ")}. ` : ""}Recolouring an accessory doesn't put it on. ${(() => { try { const u = (SBCOMP.unlockWays ? SBCOMP.unlockWays() : []).filter(x => !x.have && x.ways.length); return u.length ? `How to unlock the accessories you don't have yet (any one way): ${u.map(x => `${x.name}: ${x.ways.join(", or ")}`).join("; ")}. ` : ""; } catch (e) { return ""; } })()}${pals.length ? `The other study companions in Studyboard (the student can switch in Companion settings): ${pals.join(", ")}. If they call you by one of those names, they're greeting you (maybe used to that one): answer warmly as yourself, and if they ask about one, say who it is in a sentence. ` : ""}When they ask your opinion or favourite, pick one and say why, in character.\n\n${AGENT_RULES}${careMode ? CARE.CARE_RULE : ""}${integ ? CARE.INTEGRITY_RULE : ""}`;
    const text = `${agCalendar()}\n${agTimer()}\n${agLook()}\nNOTE BOARDS: ${boards}${skins.length ? `\nTHEMES THEY HAVE: ${skins.join(", ")}` : ""}\n\nTHE STUDENT'S PLANNER (everything, with refs):\n${cat.text}${facts ? "\n\n" + facts : ""}${guide}\n\n${hist ? "CONVERSATION SO FAR:\n" + hist + "\n\n" : ""}THE STUDENT'S NEW MESSAGE: ${q}\n\n(Reply to exactly this, as the next line of the conversation. Small talk or feelings: answer them alone, with no tasks, deadlines or plans unless they bring up school. A request: do it in the JSON. A short follow-up ("like what", "guess", "another one", "of me?") continues what you just said: "another one" right after you explained or gave an example of something is another example of that same thing. "Ask me" or "quiz me": ask the question only. Answering a quiz question you asked: first work out the right answer to that exact question, then say right or wrong. A plan: only the days before things are due, about what they asked. Never write ref codes like T3 or N1 in the answer.)`;
    const call = extra => aiCall({task: "agent", system: system + (extra || ""), parts: [{text}], schema: AGENT_SCHEMA, maxTokens: 8000, onStatus: s => { T.status = s; drawStatus(); }});
    // (a dropped connection or a busy moment: tried once more before anything else)
    // (too many requests this minute: waited for a free slot, a few times, rather than given up)
    const tryCall = async () => { for (let i = 0; ; i++) { try { return await call(); } catch (e) { if (stopsHere(e) || usedUp(e) || i >= 3) throw e; const rate = !!(e && (e.rate || e.code === "limit" || /requests already|too many|a minute/i.test(String(e.message || "")))); if (rate) { T.status = "Lots of questions at once. One moment…"; drawStatus(); } await new Promise(res => setTimeout(res, rate ? 8000 : 1500)); } } };
    let r = await tryCall(), d = r && r.data && typeof r.data === "object" ? r.data : null;
    const asked = x => !!x && ["changes", "newTasks", "newEvents", "newCourses", "newClasses", "newNotes", "newDecks", "newCards", "show", "wear"].some(k => Array.isArray(x[k]) && x[k].length) || !!(x && (x.undo || x.study || (x.map && x.map.topic) || x.page || x.theme || (x.timer && x.timer.do && x.timer.do !== "none") || (x.group && x.group.do)));
    // a reply that says it did something with nothing listed to do: asked once more
    // (any "I made / opened / saved / put / turned ...", or a reply opening with "Done", not only the words the old check knew: "Made an
    // empty deck called Cardiology" made nothing)
    const CLAIM2 = /\b(?:i'?ve|i have|i)\s+(?:just\s+|now\s+|also\s+)?(?:made|opened|saved|put|turned|switched|marked|moved|added|created|set|changed|deleted|removed|renamed|started|filled|linked|recoloured|recolored)\b|^\s*(?:done|all set|made|opened|saved|added|moved|marked|changed|deleted|renamed|started|switched|turned|created)\b/i;
    if (d && !asked(d) && (A.CLAIMS.test(String(d.answer || "")) || CLAIM2.test(String(d.answer || "")))) { try { const r2 = await call(`\n\nIMPORTANT: your last reply said "${clip(d.answer, 200)}" but listed no change. If the student asked for a change, list it in the JSON. If not, don't say anything was done.`); if (r2 && r2.data && r2.data.answer) d = r2.data; } catch (e) { if (stopsHere(e)) throw e; } }
    // no reply, or a placeholder ("placeholder", "...") where the reply should be: asked once more
    if (!d || junk(d.answer) || /^\s*placeholder\s*$/i.test(String(d.answer || ""))) { try { const r3 = await call(`\n\nIMPORTANT: reply with one JSON object whose "answer" is your real reply to the student.`); const d3 = r3 && r3.data; if (d3 && !junk(d3.answer) && !/^\s*placeholder\s*$/i.test(String(d3.answer))) d = d3; else d = null; } catch (e) { if (stopsHere(e)) throw e; d = null; } }
    if (!d) return null;
    return agApply(d, cat.refs, q, past);
  }
  // Each change checked against the planner, the valid ones made in one step, and the reply put right about what wasn't
  async function agApply(d, refs, q, past){
    const A = window.SBASSIST, arr = k => Array.isArray(d[k]) ? d[k].filter(x => x && typeof x === "object") : [];
    const fails = [], log = [], ch = [], decks = [], extra = [];
    // "undo that, I meant the journal": the undo first, then the new change (the other way round, the undo took back the new change)
    let undoMiss = "";
    if (d.undo) { const k = A.control("undo"); if (k && k.done) log.push(k.answer.replace(/\.$/, "")); else undoMiss = k ? k.answer : "There's nothing to undo."; }
    const what = cx => `${cx.label}: ${cx.what.toLowerCase()} ${cx.from ? cx.from + " → " : ""}${cx.to}`;
    const sets = [], checked = [], failK = [];
    arr("changes").forEach(c0 => {
      const cc = Object.assign({}, c0, {value: c0.value == null ? "" : String(c0.value)});
      if (String(cc.ref || "").toUpperCase() === "SETTINGS" || cc.field === "setting") { const x = A.check(cc, refs); if (x) sets.push(x); else fails.push(`change the setting "${clip(cc.setting || cc.value, 40)}"`); return; }
      let t = refs.get(String(cc.ref || "").trim().toUpperCase());
      // a task with no ref because it was deleted when the planner was read, and is back after the undo above ("don't delete 3, mark
      // it done instead"): found by the name Claude gives
      if (!t && cc.item && d.undo) { const nm = String(cc.item).trim().toLowerCase(), tk = tasksArr().find(x => String(x.title || "").toLowerCase() === nm); if (tk) { const k = ("TU_" + tk.id).toUpperCase(); refs.set(k, {kind: "task", id: tk.id}); cc.ref = k; t = refs.get(k); } }
      // a task just deleted that a change names (an X ref): that one task brought back first, nothing else undone ("don't delete 3,
      // mark it done instead" undid the whole last step, and the Journal 4 added in it went too)
      if (t && t.gone && !state.tasks[t.id]) { try { applyChanges([{kind: "task", id: t.id, after: clone(t.gone)}], null); log.push(`brought back ${clip(t.gone.title, 60)}`); } catch (e) {} }
      // the ref is checked against the name Claude gives with it ("item"): one pointing at the row next to it ("make it 30 min" changed
      // the clinical orientation instead of the meeting) is put right when exactly one item of that kind has that name
      if (t && cc.item) { const ws = agWords(cc.item), sc = v => { const L = agWords(agLabel(v)); return ws.filter(w => L.includes(w)).length; };
        if (ws.length && sc(t) === 0) { const alt = [...refs.entries()].filter(([k, v]) => v.kind === t.kind && A.exists(v) && sc(v) > 0), top = Math.max(0, ...alt.map(([k, v]) => sc(v))), best = alt.filter(([k, v]) => sc(v) === top), same = best.filter(([k, v]) => !t.date || v.date === t.date);
          const pick = best.length === 1 ? best[0] : same.length === 1 ? same[0] : null; if (pick) { cc.ref = pick[0]; t = pick[1]; } } }
      // a mark on a graded item (a G ref) is the task's mark
      if (t && t.kind === "grade" && cc.field === "mark") { const k = ("TG_" + t.id).toUpperCase(); refs.set(k, {kind: "task", id: t.id}); cc.ref = k; t = refs.get(k); }
      // a colour: the exact one with Pro's any-colour, else the nearest of the course colours (said, so "hot pink #FF3E9A" isn't claimed)
      if (t && t.kind === "course" && cc.field === "color") { const want = String(cc.value || ""), hx = agHex(want), asked = (/#[0-9a-f]{6}\b/i.exec(want) || [])[0] || (NAMED[want.toLowerCase().trim()] || "");
        cc.value = hx || want; const cur = String((state.courses[t.id] || {}).color || "").toUpperCase();
        // (the nearest one is the colour it has: nothing changes, said as such, so "Changed it to hot pink" isn't claimed beside it)
        if (hx && cur === hx) { if (asked && asked.toUpperCase() !== hx) fails.push(`change ${courseLabel(state.courses[t.id])}'s colour to ${asked} (your course colours don't include that exact shade, and the closest one is the colour it already has; Pro can use any colour exactly)`); else extra.push(`${courseLabel(state.courses[t.id])} is already that colour.`); return; }
        if (hx && asked && asked.toUpperCase() !== hx) extra.push(`(Your course colours don't include that exact shade, so I used the closest one, ${hx}. Pro can use any colour exactly.)`); }
      const x = A.check(cc, refs);
      if (x) checked.push(x); else failK.push({k: t ? `${t.kind === "grade" ? "task" : t.kind}:${t.id}:${cc.field}` : "", s: `change ${t ? A.labelOf(t) || "that" : "that"}'s ${String(cc.field || "").toLowerCase() || "details"}${cc.value ? ` to ${clip(cc.value, 40)}` : ""}`});
    });
    // (the same change listed twice, once on the task and once on its grade row: the one that worked is enough, no "couldn't" for the other)
    { const okK = new Set(checked.map(x => `${x.t.kind}:${x.t.id}:${x.field}`)); failK.filter(f => !okK.has(f.k)).forEach(f => fails.push(f.s)); }
    const nt = arr("newTasks").filter(x => String(x.title || "").trim());
    if (nt.length) { const res = A.resolve({newTasks: nt.map(x => Object.assign({}, x, {type: TYPES.includes(x.type) ? x.type : "Assignment", priority: /^(low|med|high|urgent)$/.test(x.priority) ? x.priority : (x.type === "Exam" ? "high" : "med")}))}, refs); res.changes.forEach(x => checked.push(x)); }
    // existing items and new tasks: built together (several fields of one item become one change)
    if (checked.length) { const b = A.build(checked); b.forEach(x => ch.push(x)); checked.forEach(x => log.push(x.t.kind === "newtask" ? `added task ${x.label} (${x.to})` : what(x))); }
    const courseRef = v => { const t = v ? refs.get(String(v).trim().toUpperCase()) : null; if (t && t.kind === "course" && state.courses[t.id]) return state.courses[t.id]; const c = v ? courseOfName(String(v)) : null; return c || null; };
    arr("newEvents").forEach(e => {
      const title = clip(String(e.title || "").trim(), 120), date = String(e.date || "").trim(); if (!title || !/^\d{4}-\d{2}-\d{2}$/.test(date)) { fails.push(`add ${title || "that event"}${date ? "" : " (it needs a date)"}`); return; }
      const from = hm(e.from), to = hm(e.to), c = courseRef(e.course);
      const ev = normEvent({id: uid(), title, courseId: c ? c.id : "", date, allDay: !from, start: from, end: from ? to : "", where: clip(String(e.where || ""), 120)});
      ch.push({kind: "event", id: ev.id, after: ev}); log.push(`added event ${title} on ${fmtDate(ev.date)}${ev.start ? ` ${fmtTime(ev.start)}–${fmtTime(ev.end)}` : ""}${ev.where ? " at " + ev.where : ""}`);
    });
    arr("newCourses").forEach(x => {
      const name = clip(String(x.name || "").trim(), 80), code = clip(String(x.code || "").trim().toUpperCase(), 24); if (!name && !code) return;
      const dup = coursesArr().find(c => (code && (c.code || "").toUpperCase() === code) || (name && c.name.toLowerCase() === name.toLowerCase())); if (dup) { fails.push(`add ${name || code} (you already have ${courseLabel(dup)})`); return; }
      const used = coursesArr().map(c => c.color), nc = {id: uid(), created: Date.now(), name: name || code, code, instructor: clip(String(x.instructor || ""), 80), schedule: "", room: clip(String(x.room || ""), 60), office: "", color: agHex(x.color) || COLORS.find(c => !used.includes(c)) || COLORS[used.length % COLORS.length], notes: "", links: [], meetings: []};
      ch.push({kind: "course", id: nc.id, after: nc}); log.push(`added course ${courseLabel(nc)}`);
    });
    // a course's weekly class times
    arr("newClasses").forEach(x => {
      const c = courseRef(x.course), from = hm(x.from), to = hm(x.to), DN = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
      const days = [...new Set(String(x.days || "").toLowerCase().split(/[\s,/&]+|\band\b/).map(w => DN.indexOf(w.slice(0, 3))).filter(i => i >= 0))].sort();
      if (!c || !days.length || !from || !to) { fails.push(`add those class times${c ? "" : " (which course?)"}`); return; }
      let e = ch.find(y => y.kind === "course" && y.id === c.id); if (!e) { e = {kind: "course", id: c.id, after: clone(c)}; ch.push(e); } if (!e.after) return;
      const kind = /^(Lecture|Lab|Tutorial|Seminar|Office Hours)$/.test(x.kind) ? x.kind : "Lecture", ms = courseMeetings(e.after).map(m => Object.assign({}, m)).concat({id: uid(), kind, days, start: from, end: to, where: clip(String(x.where || ""), 60)});
      e.after.meetings = ms; e.after.schedule = meetingsSummary(ms); log.push(`added ${courseLabel(c)} ${kind.toLowerCase()} ${days.map(i => AG_DAYS[i]).join("/")} ${fmtTime(from)}–${fmtTime(to)}`);
    });
    arr("newDecks").forEach(x => {
      const name = clip(String(x.name || "").trim(), 120); if (!name) return; const c = courseRef(x.course), id = uid();
      const cards = (Array.isArray(x.cards) ? x.cards : []).filter(k => k && String(k.front || "").trim() && String(k.back || "").trim()).slice(0, 60).map(k => ({id: uid(), front: clip(String(k.front).trim(), 600), back: clip(String(k.back).trim(), 1200)}));
      const nd = normDeck({id, name, courseId: c ? c.id : "", cards, created: Date.now(), updated: Date.now()});
      ch.push({kind: "deck", id, after: nd}); decks.push(id); log.push(`made deck ${name} with ${cards.length} card${cards.length === 1 ? "" : "s"}`);
    });
    // (a card with no deck named, after others that name one: the same deck)
    let lastDeck = ""; arr("newCards").forEach(x => { if (!String(x.deck || "").trim() && lastDeck) x.deck = lastDeck; else if (String(x.deck || "").trim()) lastDeck = x.deck; });
    arr("newCards").forEach(x => {
      const t = refs.get(String(x.deck || "").trim().toUpperCase()), dk0 = t && t.kind === "deck" && state.decks[t.id] ? state.decks[t.id] : deckNamed(x.deck);
      const f = String(x.front || "").trim(), b = String(x.back || "").trim(); if (!dk0 || !f || !b) { fails.push(`add the card "${clip(f, 40)}"${dk0 ? "" : ` (there's no deck called "${clip(x.deck, 40)}")`}`); return; }
      let e = ch.find(y => y.kind === "deck" && y.id === dk0.id); if (!e) { e = {kind: "deck", id: dk0.id, after: clone(dk0)}; ch.push(e); } if (!e.after) return;
      e.after.cards.push({id: uid(), front: clip(f, 600), back: clip(b, 1200), box: 0, due: "", seen: 0, right: 0, wrong: 0}); e.after.updated = Date.now();
      if (!decks.includes(dk0.id)) decks.push(dk0.id); log.push(`added card "${clip(f, 60)}" to ${dk0.name}`);
    });
    ch.filter(x => x.kind === "deck" && x.after).forEach(x => { if (!decks.includes(x.id)) decks.push(x.id); });
    // notes: each with its words, on the board named (in the same step as the rest, so "undo" takes them back too)
    for (const x of arr("newNotes")) { const tx = String(x.text || "").trim(); if (!tx) continue; let b = boardNamed(x.board); if (!b && x.board && !/^my notes?$/i.test(String(x.board).trim())) b = boardFor(String(x.board).replace(/\s*\bboard\b\s*/i, " ").trim(), null);
      const n = addNoteTo(b ? b.id : "", tx, "", true); ch.push({kind: "note", id: n.id, after: n}); log.push(`added note on ${b ? b.name : "My Notes"}: "${clip(tx, 80)}"`); }
    if (ch.length) applyChanges(ch, log.length === 1 ? clip(log[0].replace(/^\w/, s => s.toUpperCase()), 80) : `${log.length} changes`);
    // the focus timer
    const tm0 = d.timer && typeof d.timer === "object" ? d.timer : null, td = tm0 ? String(tm0.do || "").toLowerCase() : "";
    if (td && td !== "none") { const tt = tm0.task ? refs.get(String(tm0.task).trim().toUpperCase()) : null, task = tt && tt.kind === "task" ? state.tasks[tt.id] : null;
      if (td === "start") { const mins = Number(tm0.minutes) > 0 && Number(tm0.minutes) <= 180 ? Math.round(Number(tm0.minutes)) : 25; if (A.startTimer(mins, task)) log.push(`started a ${mins}-minute focus timer${task ? " for " + task.title : ""}`); else fails.push("start the timer"); }
      else if (td === "link") { if (typeof pomo !== "undefined" && (pomo.running || pomo.left > 0) && task) { pomo.taskId = task.id; try { pomoSave(); } catch (e) {} log.push(`timer now for ${task.title}`); } else fails.push("link the timer"); }
      else { const k = A.control(`${td} the timer`); if (k && k.done) log.push(k.answer.replace(/\.$/, "").toLowerCase()); else if (k) extra.push(k.answer); } }
    if (d.theme) { const was = agLook().replace(/^LOOK NOW: |\.$/g, ""), r = themeAct({value: d.theme}); if (/^(Switched|Studyboard now)/.test(r.answer)) log.push(`${r.answer.replace(/\.$/, "")} (before: ${was})`); else extra.push(r.answer); }
    // (only an accessory it has: asked for a beanie it hasn't unlocked, it said "Tiny Hat is on")
    // (and the one the student named, in this message or the one before: "put it on then" after asking about the crown is the crown,
    // and "darker" after "make packy purple" is about the companion itself, never the Tiny Hat it reached for instead)
    const ACCW = /\b(hat|hats|cap|beanie|toque|crown|tiara|glasses|specs|sunglasses|scarf|tie|bow ?tie|medal|necklace|cape|cloak|badge|star|accessor(?:y|ies)|outfit|everything)\b/i;
    const named = [q].concat((past || []).slice(-1).map(x => x.q || "")).map(s => (ACCW.exec(String(s)) || [])[0]).find(Boolean) || "";
    arr("wear").forEach(x => { let it = String(x.item || "").trim(); if (!it || !window.SBCOMP) return;
      if (!named) { extra.push(x.color ? "My own colour can't change, only my accessories' colours. Which one should I change?" : "Which accessory should I put on?"); return; }
      // (one the companion itself just offered counts too: "I have a Tiny Hat if you want me to try it on" then "put it on then")
      const offered = String(((past || []).slice(-1)[0] || {}).a ? past.slice(-1)[0].a.answer : "").toLowerCase(), iw = agWords(it).concat(it.toLowerCase().split(/\s+/)).filter(w => w.length > 2);
      if (!/^(all|everything)$/i.test(it) && !iw.some(w => named.toLowerCase().includes(w) || w.includes(named.toLowerCase())) && !(iw.length && iw.every(w => offered.includes(w)) && /\b(it|them|that|one)\b/i.test(q))) it = named;
      const own = SBCOMP.ownedNames ? SBCOMP.ownedNames() : [], hit = /^(all|everything)$/i.test(it) || own.some(n => agWords(n).some(w => agWords(it).includes(w)) || n.toLowerCase() === it.toLowerCase());
      if (!hit) { extra.push(`I haven't unlocked ${/^(a|an|the|my)\b/i.test(it) ? it : "the " + it} yet, so I'm not wearing it. The Wardrobe shows how to get it.`); return; } const r = x.color && SBCOMP.tintByName ? SBCOMP.tintByName(it, x.color) : SBCOMP.wearByName ? SBCOMP.wearByName(it, x.on !== false) : ""; if (r) extra.push(r); });
    if (d.group && d.group.do) { const g = d.group; if (/join/i.test(g.do)) extra.push(window.SBGRPJOIN && SBGRPJOIN(String(g.code || "").trim()) ? `I opened Join${g.code ? ` with ${g.code} filled in` : ""}. Tap Join to check the code.` : "Joining a group needs you signed in and online. Open Groups and tap Join.");
      else { const nm = String(g.name || "").trim(); extra.push(window.SBGRPNEW && SBGRPNEW(nm, /project/i.test(q)) ? `I opened New Group${nm ? ` with "${nm}" filled in` : ""}. Check it and tap Create.` : `Groups need you signed in and online. Open Groups and tap New Group${nm ? ` to make "${nm}"` : ""}.`); } }
    // settings go through the Settings sheet's own controls, shown and confirmed there
    // (Settings opens in the sheet the chat may be shown in: the chat is opened again after, so the reply is seen)
    if (sets.length) { const res = []; try { await A.propose(sets, {direct: true, results: res}); } catch (e) {} try { if (!document.querySelector("#cptIn") && window.SBCOMPTAB) setTimeout(() => { try { if (!document.querySelector("#cptIn")) SBCOMPTAB.open(); } catch (e) {} }, 50); } catch (e) {}
      sets.forEach((x, i) => { const r = res[i]; if (r && r.title) log.push(`setting ${r.title}: ${r.from ? r.from + " → " : ""}${r.to}`); else if (r !== true) fails.push(`change the setting "${clip(x.setting, 40)}" (I couldn't find it in Settings)`); }); }
    // a concept map, made by the map step (98-concept-map.js) and offered to open
    let mapOpen = null;
    // more on the map the chat just made ("add the valves"): added to that map, not a second map
    const lastMap = ((past || []).slice(-3).reverse().find(x => x.a && x.a.mapOpen) || {}).a;
    if (d.map && d.map.expand && lastMap && lastMap.mapOpen && window.SBCMAP && SBCMAP.expandFrom) { T.status = "Adding to your map…"; drawStatus();
      try { const r = await SBCMAP.expandFrom(lastMap.mapOpen.course, lastMap.mapOpen.map, `${q}${d.map.topic ? ". Add: " + clip(String(d.map.topic), 200) : ""}`); mapOpen = lastMap.mapOpen; extra.push(`I added ${r.added} more ideas to ${r.name} (${r.ideas} in all). Tap Open Map to see them.`); log.push(`added ${r.added} ideas to ${r.name}`); }
      catch (e) { fails.push(`add to that map (${clip((e && e.message) || "", 100)})`); } }
    else if (d.map && d.map.topic) { const ct = d.map.course ? refs.get(String(d.map.course).trim().toUpperCase()) : null, cc = ct && ct.kind === "course" ? state.courses[ct.id] : null;
      T.status = "Making your map…"; drawStatus();
      // (the topic's name only: "the heart, from your Heart deck: SA node, ..." was read as a typed outline of three ideas)
      const topic = clip(String(d.map.topic).split(/[,:;(]|\s+\b(?:from|using|based on|with)\b/i)[0].replace(/^(?:a\s+)?(?:concept\s+|mind\s+)?map\s+(?:of|about|on)\s+/i, "").trim() || String(d.map.topic), 80);
      const r = await mapAct(`make a concept map about ${topic}`, cc ? (cc.code || cc.name) : "").catch(() => null);
      if (r && r.mapOpen) { mapOpen = r.mapOpen; extra.push(r.answer); log.push(`made a concept map about ${clip(String(d.map.topic), 60)}`); } else fails.push(`make that map${r && r.answer ? ` (${clip(r.answer, 100)})` : ""}`); }
    // going somewhere only when the words ask to (or answer its own offer to open or study something): "chapter 7 and heart flashcards",
    // telling it what they studied, opened the reading and the deck and left the chat
    { const prevA = String(((past || []).slice(-1)[0] || {}).a ? past.slice(-1)[0].a.answer : "");
      const goSaid = /\b(open|show|go|take me|bring up|pull up|find|where|study|review|quiz|drill|start|launch|jump|let'?s do|lets do|flip|next|see)\b/i.test(q) || (q.split(/\s+/).length <= 6 && /\b(study|open|show|review|start|which deck|which one)\b/i.test(prevA) && /\?/.test(prevA))
        // (or carry on from going somewhere: "take me to flashcards", then "now the calendar")
        || (q.split(/\s+/).length <= 5 && /\b(open|show|go|take me|bring up|pull up|study|review)\b/i.test(String(((past || []).slice(-1)[0] || {}).q || "")));
      if (!goSaid) { d.study = ""; d.show = []; d.page = ""; } }
    // a study session on a deck (opened once the reply is shown)
    if (d.study) { const t = refs.get(String(d.study).trim().toUpperCase()), dk1 = t && t.kind === "deck" ? state.decks[t.id] : (decks.length ? state.decks[decks[decks.length - 1]] : null);
      if (dk1 && dk1.cards.length) { setTimeout(() => { try { startStudy([dk1.id]); } catch (e) {} }, 250); log.push(`opened ${dk1.name} to study`); } else fails.push(dk1 ? `study ${dk1.name} (it has no cards yet)` : "find that deck to study"); }
    // going somewhere: a thing, or a part of the app
    const show = (Array.isArray(d.show) ? d.show : []).map(x => refs.get(String(x || "").trim().toUpperCase())).filter(t => t && A.exists(t));
    let shown = null;
    if (show.length) { shown = Object.assign({}, show[0], {label: A.labelOf(show[0])}); setTimeout(() => { A.jump(show[0]).catch(() => {}); }, 200); }
    else if (d.page) { const k = String(d.page).toLowerCase().replace(/^(my|the)\s+/, "").replace(/\s+(page|tab|view|section)$/, "").trim();
      if (/^(settings?|preferences|options)$/.test(k)) setTimeout(() => { try { menuSheet(); } catch (e) {} }, 200);
      // the Reminders and Notifications sheet (turning them on needs the student's OK in the browser, so it's opened for them)
      else if (/^(reminders?|notifications?|alerts?)/.test(k)) setTimeout(() => { try { const b = document.createElement("button"); b.type = "button"; b.hidden = true; b.dataset.act = "rm-open"; document.body.appendChild(b); b.click(); b.remove(); } catch (e) {} }, 200);
      else if (PAGES[k]) setTimeout(() => { try { ui.tab = PAGES[k]; if (PAGES[k] !== "courses") ui.courseId = null; render(); window.scrollTo(0, 0); } catch (e) {} }, 200); }
    let answer = String(d.answer || "").trim();
    // a reply that says it did what couldn't be done ("Done, notifications are muted" when the setting wasn't found): what really
    // happened instead, so it never says both
    if (fails.length && (A.CLAIMS.test(answer) || /^\s*(done|got it|all set)\b/i.test(answer))) answer = log.length ? `Done: ${log.join("; ")}.` : "";
    if (fails.length) answer = `${answer}${answer ? "\n\n" : ""}I couldn't ${fails.slice(0, 4).join("; ")}, so ${fails.length === 1 ? "that part wasn't" : "those weren't"} changed.`;
    // ("nothing to undo" only when nothing else was done either: "undo the dark mode" set the theme back and said both; and then
    // it's said instead of a reply claiming the undo: "Done, back to Default" beside "There's nothing recent to undo")
    if (undoMiss && !log.length) { if (A.CLAIMS.test(answer) || CLAIM_A.test(answer)) answer = ""; extra.unshift(undoMiss); }
    // what was worn, recoloured or opened for a group is said in the companion's and Groups' own words (they know what really
    // happened: "I put on my Tiny Hat" when it was only recoloured, "I filled in New Group" when it needed a sign-in)
    if (extra.length && !log.length && (arr("wear").length || (d.group && d.group.do)) && (A.CLAIMS.test(answer) || CLAIM_A.test(answer))) answer = "";
    if (extra.length) answer =`${answer}${answer ? "\n\n" : ""}${extra.join(" ")}`;
    // a weekday that doesn't match its date ("Mon, Dec 5" when Dec 5 is a Saturday): the date's own weekday
    answer = agWeekdays(answer);
    answer = answer.replace(/\s*(?:\p{Extended_Pictographic}|\p{Regional_Indicator})(?:️|‍(?:\p{Extended_Pictographic})?)*/gu, "").trim();
    // the refs are for Claude, never the student ("your Freud notes (N1)", "Transference (F3)")
    answer = answer.replace(/\s*\((?:\s*(?:refs?\s+)?[A-Z]{1,2}\d{1,3}\s*,?)+\)/g, "").replace(/\b[A-Z]{1,2}\d{1,3}\b/g, x => refs.has(x) ? "" : x).replace(/ {2,}/g, " ").replace(/\s+([.,;:!?])/g, "$1").trim();
    const out = {answer: answer || "Done.", sources: [], followUps: [], actions: [], log, decks, agent: true};
    if (shown) out.show = [shown];
    if (mapOpen) out.mapOpen = mapOpen;
    return out;
  }
  async function ask(q){
    q = String(q || "").replace(/\s+/g, " ").trim().slice(0, 1000);
    const att = T.att.slice();
    if ((!q && !att.length) || T.busy) return;
    if (!q) q = "Here's what I attached. What can you do with it?";
    if (att.reduce((n, x) => n + aiSourceBytes(x), 0) > AI_LIMIT_BYTES) { toast("Those files are too big to send at once. Remove some."); return; }
    if (!aiOk()) { if (inPreview()) toast("Chat works in the Studyboard app and on your own Studyboard website."); else aiSetupSheet(false); return; }
    { const ta = $("#cptIn"); if (ta) { ta.value = ""; ta.style.height = ""; } }
    T.att = [];
    const chats = rd();
    let c = chats.find(x => x.id === T.id);
    if (!c) { c = {id: uid(), title: clip(q, 56), at: Date.now(), msgs: []}; chats.unshift(c); T.id = c.id; wr(chats); }
    T.busy = {id: c.id, q}; T.say = true; T.draft = ""; T.live = ""; T.status = "Looking through your stuff…"; draw();
    clearInterval(T.tick); T.tick = setInterval(() => { if (T.busy && !T.live) drawStatus(); }, 1000);
    let m = {q, at: Date.now()};
    if (att.length) { m.files = att.map(x => clip(x.name, 50)); T.srcs[m.at] = att; idbPut(String(m.at), att.map(x => ({name: x.name, kind: x.kind, size: x.size, part: x.part}))); }
    // no reply may keep the chat busy for good: past CHAT_MAX it's given up on (it's dropped if it comes later) and the chat is free again
    const work = (async () => {
    const t0 = Date.now();
    try {
      // the AI on the device (98-truth.js): planner facts from the app itself, exact; other answers checked against what it was given
      // stop, pause or resume the timer, or undo the last change: done at once, with no AI (98-assist.js), on any engine
      // two things in one message ("finished the journal, start a 25 min timer for the essay"): each done in turn (98-assist.js splits them)
      // Claude: one step understands and does it (claudeTurn); the steps made for the small on-device models are skipped
      const CL = !att.length && claudeMode();
      const multi = !CL && !att.length && !!(window.SBTRUTH && SBTRUTH.steps && window.SBASSIST && SBASSIST.ask) && (ps => ps.length > 1 && ps.every(x => !/\?\s*$/.test(x) && !/^\s*(what|what's|whats|who|why|how|when|where|which|is|are|do|does|did)\b/i.test(x)))(SBTRUTH.steps(q));
      const ctl = !CL && !multi && !att.length && window.SBASSIST && SBASSIST.control ? SBASSIST.control(q) : null, me0 = !ctl && !att.length ? selfAnswer(q) : "";
      // a request to do something (any wording) is understood by the AI and done by the app (intentAct); a planner question with
      // no request in it is answered from the app's own data first (exact, instant)
      const ACTY = /\b(add(s|ed|ing)?|put(s|ting)?|mak(e|es|ing)|creat(e|ed|ing)|delet(e|ed|ing)|remov(e|ed|ing)|get rid|eras(e|ed)|trash(ed)?|mov(e|ed|es|ing)|push(ed|ing)?|bump(ed)?|reschedul(e|ed|ing)|postpon(e|ed)|delay(ed)?|extend(ed|s)?|mark(ed)?|check(ed)? off|tick(ed)? off|cross(ed)? (off|out)|finish(ed|ing)?|complet(e|ed)|done|submit(ted)?|turn(ed)? in|hand(ed)? in|wrap(ped)? up|renam(e|ed)|call it|chang(e|ed|ing)|set|switch(ed)?|turn(ed)? (on|off)|start(ed|ing)?|stop(ped)?|paus(e|ed)|resum(e|ed)|open|take me|go to|show me|bring up|jot|note|remind|schedul(e|ed)|book|cancel(l?ed)?|undo|revert|edit|updat(e|ed)|wear|join|enrol+(ed)?|working on|now due|due date (is|changed|moved)|in[- ]progress)\b/i;
      // statements that ask for something without an action word: "I have a dentist appointment friday at 10", "need to do the worksheet
      // by sunday", "todo: buy textbook", "the care plan is urgent", "call the lab report 'X'" (never a question: those are answered)
      const ISQ = x => /\?\s*$/.test(x) || /^\s*(what|what's|whats|who|why|how|when|where|which|is|are|do|does|did|can i|could i|should i|am i|will|would)\b/i.test(x);
      const STMT = x => !ISQ(x) && (/^\s*(i\s+)?(really\s+)?(need to|have to|gotta|got to|must)\b/i.test(x) || /^\s*(to-?\s?do|todo|reminder)\b/i.test(x)
        || /\b(i have|i've got|ive got|i got|there'?s|we have|i'?ve)\b[^?]*\b(on|at|this|next|tomorrow|tonight|today|monday|tuesday|wednesday|thursday|friday|saturday|sunday|\d{1,2}(:\d\d)?\s*(am|pm))\b/i.test(x)
        || /\b(is|are|'s)\s+(now\s+)?(urgent|important|high priority|low priority|not urgent|top priority)\b/i.test(x) || /\bcall (the|my|this|that)\b[^?]*["“'‘]/i.test(x));
      const ACTX = x => ACTY.test(x) || STMT(x);
      // "I meant all my courses", "no, for BIOS 230": the earlier question again, with what they meant (no AI step needed to see that)
      const fix = !att.length ? /^\s*(?:no[,.!]?\s+)?(?:i (?:meant|mean)|what i meant was|i was asking about|i'?m asking about|not that[,.]?\s*)\s+(.{2,120}?)[.!?]*\s*$/i.exec(q) : null;
      // "be more detailed", "simpler", "give me an example", "tell me more", "why?": the last question again, answered that way
      const more = !fix && !att.length ? /^\s*(?:(?:can|could) you\s+|please\s+)?((?:be )?more detail(?:ed|s)?|go (?:into )?more (?:detail|depth)|in more detail|more depth|elaborate|expand(?: on (?:that|it))?|explain (?:that |it )?(?:more|further|better|again|simpler|more simply)|tell me more|say more|keep going|go on|continue|simpler|more simply|(?:make it |explain it )?simpler|dumb it down|(?:give (?:me )?)?an? (?:example|analogy)|shorter|(?:make it )?shorter|in short|tl;?dr|summari[sz]e (?:that|it)|why\??|how so\??|what do you mean\??)\s*(?:please)?[.!?]*\s*$/i.exec(q) : null;
      const prevQ0 = fix || more ? (x => x ? (x.ask || x.q) : "")((c.msgs || []).filter(x => x.q && x.a).slice(-1)[0]).replace(/^(Explain in detail|Explain simply|In two or three sentences|Give an example of):\s*/i, "") : "";
      const qFix = fix && prevQ0 ? `${prevQ0.replace(/[?!.]+\s*$/, "")} (${fix[1]})?` : more && prevQ0 ? `${/simpl|dumb/i.test(more[1]) ? "Explain simply: " : /short|tl|summar|in short/i.test(more[1]) ? "In two or three sentences: " : /example|analogy/i.test(more[1]) ? "Give an example of: " : "Explain in detail: "}${prevQ0.replace(/[?!.]+\s*$/, "")}` : "";
      // Follow-ups, read against the last turn (no AI step, so they stay quick; a message that stands on its own is left alone):
      // an answer to what it just asked ("Conclusions" after "What should the deck be called?"), more on the map it just made,
      // and "it", "that", "what about X?", "why?" about the subject it just answered
      const last = (c.msgs || []).filter(x => x.q && x.a && !x.err).slice(-1)[0];
      // a quiz in the chat: started, or an answer to its question (marked, then the next one)
      { const qz = !CL && !att.length && !(window.SBCARE && SBCARE.distress(q)) && !(last && last.a.risk) ? chatQuiz(q, last) : null; if (qz) { if (!(window.__SB_TEST && !window.__SB_PACE)) await new Promise(r => setTimeout(r, 700)); m.a = qz; return; } }
      // more on the deck it just made ("add one more about denial", "keep only 4")
      { const df = !CL && !att.length ? deckFollow(q, last) : null; if (df) { m.a = df; return; } }
      const NEWREQ = /^\s*(?:please\s+|(?:can|could|would) you\s+)?(?:add|create|make|delete|remove|move|change|start|stop|mark|open|go to|take me|switch|turn|set|put|show|study|quiz|explain|what|who|when|where|why|how|is|are|do|does|did|can|could|should)\b/i;
      const slot = !att.length && last && last.a.awaiting && !NEWREQ.test(q) && q.split(/\s+/).length <= 14 ? last.a.awaiting : null;
      const mapMore = !att.length && last && last.a.mapOpen && /\b(more|detail(ed|s)?|bigger|expand|add (more|ideas|to it)|fill (it )?out|flesh|deeper|elaborate)\b/i.test(q) && q.split(/\s+/).length <= 12 && !/\b(new|another)\s+map\b/i.test(q);
      const topicOf = x => String(x || "").replace(/^(explain in detail|explain simply|in two or three sentences|give an example of|why):\s*/i, "").replace(/^\s*(?:please\s+)?(?:can you\s+)?(?:explain|describe|define|tell me about|what(?:'s| is| are| was| were)|whats|who(?:'s| is| was| were)|how (?:does|do|did|is|are)|why (?:does|do|did|is|are)|what causes|what happened (?:in|at|to))\s+(?:to me\s+)?(?:the\s+|a\s+|an\s+)?/i, "").replace(/\s+(?:to me|work|works|mean|happen|happened)\s*[?!.]*\s*$/i, "").replace(/[?!.]+\s*$/, "").trim();
      let qRef = "";
      if (!fix && !more && !slot && !mapMore && !att.length && last && !(last.a.actions || []).length && !last.a.mapOpen && !(last.a.changes || []).length && !(window.SBTRUTH && SBTRUTH.facts && (() => { try { return SBTRUTH.facts(last.ask || last.q); } catch (e) { return null; } })())) {
        const lq = String(last.ask || last.q), tp = topicOf(lq), short = q.split(/\s+/).length <= 12;
        const wa = /^\s*(?:and|ok|okay|so|but)?,?\s*(?:what|how) about\s+(?:the\s+)?(.{2,80}?)\s*\??\s*$/i.exec(q);
        if (wa && tp && tp.length < 80 && lq.toLowerCase().includes(tp.toLowerCase())) qRef = lq.replace(new RegExp(tp.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"), wa[1]);
        else if (tp && tp.length < 60 && /^\s*(?:why|how|how so|why is that|why's that|how come|really)\s*\??\s*$/i.test(q)) qRef = `Why: ${lq.replace(/[?!.]+\s*$/, "")}?`;
        else if (tp && tp.length < 60 && short && /\b(it|its|that|this|they|them|their|those|these)\b/i.test(q) && !ACTY.test(q) && ISQ(q)) qRef = q.replace(/\b(it|that|this|they|them|those|these)\b/i, tp).replace(/\b(its|their)\b/i, `${tp}'s`);
      }
      // maths, worked out exactly by the app (98-math.js), with follow-ups on the last maths answer ("divide that by 3", "what's the median?", "in a week?")
      const MT = window.SBMATH; let mathR = null;
      // a mark they got ("got 17/20 on a&p quiz 4", "journal 3: 9/10 :)", "its 36/50") is saved, not worked out
      const MARKSAID = x => /\d\s*(?:\/|out of)\s*\d/.test(x) && /\b(?:got|get|scored?|mark|marks|grade|graded|regraded|bonus|it'?s|was|is)\b|:/i.test(x) && !/\b(?:what|calculate|how much|percent|percentage|average|mean|need|convert|simplify|divide|times)\b|[=+*%^]/i.test(x);
      if (MT && !att.length && !ctl && !slot && !mapMore && !MARKSAID(q)) { try { const why = !!(last && last.a.math) && /^\s*(?:but\s+|so\s+)?(?:why|how come|isn'?t|wouldn'?t|shouldn'?t|doesn'?t|wait|explain)\b/i.test(q);
          const own = !why && (q.match(/\d+(?:\.\d+)?/g) || []).length >= 2 ? MT.solve(q) : null; mathR = own || (last && last.a.math && MT.follow(q, last.a.math)) || (why ? null : MT.solve(q));
          // ("why isn't it just the average of 60 and 30?": a question about the last answer, which the follow-up step explains, never a new sum)
          if (why && mathR && mathR.math && /^stat/.test(String(mathR.math.kind || "")) && last.a.math.kind !== mathR.math.kind) mathR = null; } catch (e) { console.warn("math", e); } }
      const MATHQ = !mathR && !!MT && !MARKSAID(q) && MT.mathy(q);
      // with Claude: a crisis reply (written in code), exact maths with numbers in it, and a quiz already going in the chat stay as
      // they are; everything else is Claude's one step
      if (CL) {
        const CARE0 = window.SBCARE; let early = null;
        if (CARE0 && CARE0.risk(q)) { const rr = CARE0.riskReply(q); early = {answer: rr, sources: [], followUps: [], actions: [], care: true, risk: /their safety comes first/i.test(rr) ? "other" : "self"}; }
        // (the messages after a crisis reply go to Claude with the care rules, so "never mind, let's do flashcards" isn't given the
        // crisis lines again; the crisis reply itself stays the written one above)
        if (!early && mathR && !MARKSAID(q) && (/\d/.test(q) || MT.mathy(q))) early = {answer: mathR.answer, math: mathR.math, sources: [], followUps: [], actions: []};
        const ids1 = snapIds();
        // more on the map just made ("make it more detailed", "add more from my note"): the map step's own follow-up, below. A new map
        // is Claude's "map" (it picks the course the topic is in; the words alone put "a map of defense mechanisms" in General)
        const mapQ = !!last && !!last.a.mapOpen && /\b(more|detail(ed|s)?|bigger|expand|add (more|ideas|to it)|fill (it )?out|flesh|deeper|elaborate)\b/i.test(q);
        if (!early && !mapQ) { T.status = "Thinking…"; draw(); early = await claudeTurn(q, c).catch(e => { if (stopsHere(e)) throw e; console.warn("claude step", e); return null; });
          // (never the small models' steps instead: they answered "what does my wednesday look like" with "I couldn't make that change")
          if (!early) early = {answer: "Sorry, I couldn't get a proper answer just now, so I didn't change anything. Could you say that again?", sources: [], followUps: [], actions: []}; }
        if (early) { m.a = early; const nw = newSince(ids1); if (nw && !m.a.ref) m.a.ref = nw; if (CARE0 && (CARE0.distress(q) || (c.msgs || []).slice(-4).some(x => x.a && x.a.care))) m.a.care = true; return; }
      }
      // (how many cards, in a deck or in all, and "do I have flashcards on X": counted by the flashcard step, not the due-cards summary)
      const cardQ = CARDW.test(q) && /\b(how many|number of|count|do i have|have i got|what (flash ?)?cards|which (flash ?)?cards|any (flash ?)?cards)\b/i.test(q) && !/\b(due|review|today)\b/i.test(q);
      const dev = typeof aiOnDevice === "function" && aiOnDevice(), TR = window.SBTRUTH, quick = !mathR && !multi && !cardQ && dev && TR && !att.length && !ctl && !me0 && (ISQ(q) || window.__SB_GATE) && !ACTX(q) &&!(window.SBASSIST && SBASSIST.isRequest && SBASSIST.isRequest(q)) ? TR.facts(qFix || q) : null;
      // asked to make or change something: the app does it (or offers it to confirm), so it can't just be talked about
      // common misspellings of the words that say what to do ("finsihed", "compelted", "submited", "resechedule")
      const TYPO = [[/\b(finsihed|finshed|fnished|finisehd|finihsed|finised)\b/gi, "finished"], [/\b(compelted|completd|complted|competed)\b/gi, "completed"], [/\b(submited|sumbitted|submittted)\b/gi, "submitted"], [/\b(resechedule|reshedule|rescedule)\b/gi, "reschedule"], [/\b(delte|deleet|delet)\b/gi, "delete"], [/\b(remidn|remnid)\b/gi, "remind"]];
      const qT = TYPO.reduce((x, [re, to]) => x.replace(re, to), q);
      // a follow-up to a planner question (98-truth.js): "what about wednesday?", "which are for a&p", "and after that?"
      let planQ = "", planA = null;
      if (!fix && !more && !slot && !att.length && last && TR && TR.followUp) { try {
        const said6 = (c.msgs || []).slice(-6).map(x => (x.q || "") + " " + (x.a ? x.a.answer || "" : "")).join(" ");
        planQ = TR.followUp(q, last.ask || last.q, said6);
        if (planQ === "__AFTER__") { planA = TR.afterThat(said6); planQ = ""; } else if (planQ) planA = TR.facts(planQ); } catch (e) { planQ = ""; planA = null; } }
      const was = !att.length ? pendingAsk(q, c) : "", q2 = was || qFix || planQ || qRef || qT;
      if (q2 !== q) m.ask = q2;
      let made = null, said = "";
      // (upd0: any change at all, edits too, not only new things; what the items say, not a time, which a test clock can hold still)
      const sig = () => { try { const s = JSON.stringify([state.tasks, state.events, state.decks, state.notes, state.courses]); let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return s.length + ":" + h; } catch (e) { return String(state.updated); } };
      const ids0 = snapIds(), upd0 = sig();
      // "no, I meant the psych midterm" right after a change: that change undone, and the same done to what they meant
      if (fix && last && last.a.did && /^(move_task|mark_done|mark_in_progress|mark_not_done|set_priority|delete_task|rename_task|task_course)$/.test(last.a.did.intent) && window.SBASSIST && SBASSIST.control) {
        try { SBASSIST.control("undo"); } catch (e) {}
        const r1 = await intentAct(last.ask || last.q, c, att, Object.assign({}, last.a.did, {task: fix[1], taskFromQ: false})).catch(() => null);
        if (r1 && r1.answer) made = Object.assign({}, r1, {answer: `Okay, I put that back. ${r1.answer}`});
      }
      // "same for chapter 7", "and the quiz too", "do the same for thursday and saturday", "the lab report as well": what was just done,
      // done to those too (each named task, or every open task due on a day they name)
      if (!made && !fix && last && last.a.did && /^(move_task|mark_done|mark_in_progress|mark_not_done|set_priority|task_course)$/.test(last.a.did.intent) && !att.length) {
        // ("chapter 7 reading too, same day": the same change, said with "same day")
        const qs0 = q.replace(/[,\s]+(?:(?:on|to|for)\s+)?(?:the\s+)?same\s+(?:day|date|time|deadline|one)(?:\s+too)?\s*[.!]*$/i, "").replace(/\s+too\s+too$/i, " too");
        const sm = /^\s*(?:ok(?:ay)?\s+|now\s+|and\s+|also\s+|pls\s+|please\s+)*(?:do\s+|can you do\s+)?(?:the\s+)?same\s+(?:thing\s+)?(?:for|with|to)\s+(.+?)\s*[.!]*$/i.exec(qs0) || /^\s*(?:and|also|plus|oh and)\s+(?:do\s+)?(.+?)(?:\s+(?:too|as well|also))?\s*[.!]*$/i.exec(qs0) || /^\s*(.+?)\s+(?:too|as well)\s*[.!]*$/i.exec(qs0);
        if (sm && sm[1].split(/\s+/).length <= 10 && !ISQ(q)) {
          const did = last.a.did, DAY = /\b(today|tonight|tomorrow|this week|next week|weekend|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i, seen = new Set(), L = [];
          sm[1].split(/\s*,\s*|\s+and\s+(?!p\b)/i).map(s => s.replace(/^(?:the|my|for)\s+/i, "").trim()).filter(Boolean).forEach(part => {
            const ts = DAY.test(part) && !taskOf0(part, c, did.intent === "mark_not_done") ? (tasksSel(`everything due ${part}`, c, did.intent === "mark_not_done") || []) : [taskOf0(part, c, did.intent === "mark_not_done")].filter(Boolean);
            ts.forEach(t => { if (!seen.has(t.id)) { seen.add(t.id); L.push(t); } }); });
          if (L.length) { const outs = [];
            for (const t of L) { const r1 = await intentAct(last.ask || last.q, c, att, Object.assign({}, did, {task: t.title, taskFromQ: false})).catch(() => null); if (r1 && r1.answer) outs.push(r1.answer); }
            if (outs.length) made = {answer: outs.join("\n"), sources: [], followUps: [], actions: [], did: Object.assign({}, did, {cands: null})}; }
        }
      }
      // "make it high priority", "put it on thursday instead", "make it 30 min", "shorten it to an hour": the one thing the last reply
      // made or changed (a task just added, an event just moved), never a new task or a look-up
      if (!made && !fix && last && !att.length && q.split(/\s+/).length <= 12 && /\b(it|that|this one|that one)\b/i.test(q) && !ISQ(q) && !/^\s*(undo|thanks|thank you|ok|cool|nice|lol)\b/i.test(q)) {
        const a0 = last.a || {}, pick = r => { const nm = refName(r); return nm && /^(task|event)$/.test(r.kind) ? {kind: r.kind, name: nm} : null; };
        let LI = a0.ref ? pick(a0.ref) : null;
        if (!LI && a0.did && a0.did.task) { const t = taskOf0(a0.did.task, null, true); if (t) LI = {kind: "task", name: t.title}; }
        if (!LI) for (const s of (a0.show || [])) { LI = pick(s); if (LI) break; }
        if (!LI) { const m = /^(?:Added|Moved|Nice work! I marked)\s+(.+?)(?:,|\s+to\s+|\s+done\b|\.\s|\.$|$)/.exec(String(a0.answer || "").trim());
          if (m) { const ev = itemNamed("event", m[1]); if (ev && /calendar|Moved/.test(a0.answer)) LI = {kind: "event", name: ev.name}; else { const t = taskOf0(m[1], null, true); if (t) LI = {kind: "task", name: t.title}; } } }
        if (LI) { const lw = q.toLowerCase(), wo = whenOf(q, {}); let pre = null;
          if (LI.kind === "event" && /\b(longer|shorter|shorten|lengthen|extend|hours?|hrs?|minutes?|mins?)\b/.test(lw) && !/\b(?:at|to)\s+\d{1,2}(?::\d\d)?\s*(?:am|pm)\b/.test(lw)) pre = {intent: "edit_item", kind: "event", item: LI.name, field: "duration", value: ""};
          else if (/\b(urgent|important|priority|high|low)\b/.test(lw) && LI.kind === "task") pre = {intent: "set_priority", task: LI.name, priority: /\burgent\b/.test(lw) ? "urgent" : /\blow\b/.test(lw) ? "low" : /\b(medium|med)\b/.test(lw) ? "med" : "high"};
          else if (/\b(in progress|started|working on)\b/.test(lw) && LI.kind === "task") pre = {intent: "mark_in_progress", task: LI.name};
          else if (/\b(done|finished|complete[d]?|submitted|handed in)\b/.test(lw) && LI.kind === "task" && !/\b(due|by)\b/.test(lw)) pre = {intent: "mark_done", task: LI.name};
          else if ((wo.date || wo.time) && /\b(move|put|push|change|make|set|bump|reschedule|instead|due|on|to|at)\b/.test(lw)) pre = {intent: "move_task", task: LI.name};
          if (pre) { const r1 = await intentAct(q, c, att, pre).catch(() => null); if (r1 && r1.answer) made = r1; } }
      }
      if (planA && planA.answer) made = {answer: planA.answer, sources: ["Your planner"], followUps: [], actions: [], plan: true};
      // maths, worked out exactly by the app (98-math.js)
      if (!made && mathR) made = {answer: mathR.answer, math: mathR.math, sources: [], followUps: [], actions: []};
      // words about not wanting to live, or someone in danger: a caring reply with crisis lines, written in code (98-chatcare.js);
      // the next few turns keep a gentle voice. Something outside Studyboard (email, Brightspace, booking, printing): said plainly
      const CARE = window.SBCARE, careMode = !!CARE && !att.length && (CARE.distress(q) || (c.msgs || []).slice(-4).some(x => x.a && x.a.care));
      if (!made && CARE && !att.length && !ctl && CARE.risk(q)) made = {answer: CARE.riskReply(q), sources: [], followUps: [], actions: [], care: true, risk: /their safety comes first/i.test(CARE.riskReply(q)) ? "other" : "self"};
      // the messages just after a crisis reply
      if (!made && CARE && CARE.riskFollow && !att.length && !ctl) { const rk = (c.msgs || []).slice(-4).reverse().find(x => x.a && x.a.risk); if (rk) { const a = CARE.riskFollow(q, rk.a.risk === "other"); if (a) made = {answer: a, sources: [], followUps: [], actions: [], care: true, risk: rk.a.risk}; } }
      // "are you chatgpt", "do my notes get sent anywhere": what the companion is and where chats go, honestly, for this engine
      if (!made && CARE && CARE.aboutMe && !att.length && !ctl && !careMode) { const a = CARE.aboutMe(q, dev, (info() || {}).name); if (a) made = {answer: a, sources: [], followUps: [], actions: []}; }
      // a joke asked for: one on their topic, never "I don't have any hospital jokes" (on the device; Claude tells its own well)
      if (!made && dev && CARE && CARE.joke && !att.length && !ctl && !careMode) { const j = CARE.joke(q, last && last.a ? last.a.answer : ""); if (j) made = {answer: j, sources: [], followUps: [], actions: []}; }
      // a memory trick ("mnemonic for the conduction pathway", "how do I remember id ego superego"): made from the items, letters checked here
      if (!made && dev && !att.length && !ctl && !careMode && MEM.test(q)) { T.status = "Making a memory trick…"; draw(); const mm = await memAid(q).catch(() => null); if (mm) made = {answer: mm, sources: [], followUps: [], actions: []}; }
      if (!made && !slot && CARE && !att.length && !ctl && !careMode) { const no = CARE.cantDo(q); if (no) { made = {answer: no, sources: [], followUps: [], actions: []};
        // "check brightspace for my care plan grade": the next message ("it's 46/50") is that mark
        const gm = /\bfor\s+(?:my\s+|the\s+)?(.{2,60}?)\s+(?:grade|mark|score|result)s?\b/i.exec(q); if (gm && /brightspace|canvas|moodle|blackboard|school site/i.test(no)) made.awaiting = {d: {intent: "add_mark", task: gm[1]}, q: "I got a mark on " + gm[1]}; } }
      // going somewhere in Studyboard ("take me to flashcards", then "now the calendar"): opened, never read as a card or a deck
      if (!made && !slot && !careMode && !att.length) { const r = navAct(q, last); if (r) made = r; }
      // the companion's own look (98-companion.js): what it has, the Nth of the list it gave, both off, an accessory's colour, its own colour
      if (!made && !slot && !careMode && !att.length && window.SBCOMP && SBCOMP.ownedNames) { const r = companionLook(q, c); if (r) made = r; }
      // "and my ID badge" right after a note was saved: a line added to that note
      if (!made && !slot && !careMode && !att.length && last && last.a.ref && last.a.ref.kind === "note" && state.notes[last.a.ref.id]) {
        const am = /^\s*(?:and|also|plus|oh and|oh,? and|add)\s+(.{2,200}?)\s*(?:too|as well)?\s*[.!]*$/i.exec(q);
        if (am && !ISQ(q)) { const n0 = state.notes[last.a.ref.id], n1 = Object.assign(clone(n0), {text: String(n0.text || "").replace(/\s+$/, "") + "\n" + am[1].replace(/^(my|the)\s+/i, s => s), updated: Date.now()});
          applyChanges([{kind: "note", id: n0.id, after: n1}], "Note updated"); made = {answer: `Added to that note: "${clip(am[1], 120)}". Say "undo" to take it back.`, sources: [], followUps: [], actions: [], ref: last.a.ref}; }
      }
      // flashcards (98-cards.js): every wording read in code; "add another", "remove it", "change the answer" carry on from the last one
      // flashcards made, counted or found in code (cardsAct above): before the one-card handler and the AI step
      if (!made && !slot && !careMode && !att.length && !ctl && !CL && (CARDW.test(q) || (last && last.a && last.a.cardsMade))) { try { const r = await cardsAct(q, c, last); if (r) { if (r.cardsMade && !(window.__SB_TEST && !window.__SB_PACE)) { T.status = "Writing your cards…"; draw(); } made = r; } } catch (e) { if (stopsHere(e)) throw e; console.warn("cards", e); } }
      // (what "it" or "the deck" is: the card just added, else the deck the chat just made, opened or talked about, "Made the deck Pharm
      // Basics" then "add a card to it")
      const cardCtx = (() => { for (const x of (c.msgs || []).filter(x => x.q && x.a && !x.err).slice(-3).reverse()) { const a1 = x.a || {}; if (a1.card) return a1.card; if (a1.ref && a1.ref.kind === "deck" && state.decks[a1.ref.id]) return {deck: a1.ref.id};
        const nm = /\b(?:Made the deck|Made \d+ cards in|Opening|Added to|the deck)\s+["“]?([^".,"”(]{2,60}?)["”]?(?:[.,(:]|\s+to\b|\s+with\b|$)/.exec(String(a1.answer || "")); const dk = nm ? deckNamed(nm[1].trim()) : null; if (dk) return {deck: dk.id}; } return null; })();
      if (!made && !slot && !careMode && !att.length && !ctl && window.SBCARDS) { try { const r = await SBCARDS.request(q, cardCtx); if (r) { made = r; if (r.card && r.card.deck && !r.ref) r.ref = {kind: "deck", id: r.card.deck}; } } catch (e) { if (stopsHere(e)) throw e; } }
      // maths the app can't work out itself (word problems it doesn't know): the AI writes the working, the app does every sum (98-math-ai.js)
      const MAI = window.SBMATHAI, lastM = last && last.a.math ? {q: last.ask || last.q, answer: last.a.answer, math: last.a.math} : null;
      if (!made && !slot && !careMode && !multi && !ctl && !me0 && !att.length && MAI && !ACTX(q) && !MARKSAID(q) && (MATHQ || !!lastM) && (MAI.isMath(q) || MAI.isFollow(q, lastM))) {
        T.status = "Working it out…"; draw();
        const a = await MAI.ask(q, lastM, {onPartial: dev ? t => { T.live = t; drawStatus(); } : undefined}).catch(e => { if (stopsHere(e)) throw e; return null; });
        if (a) made = {answer: a, sources: [], followUps: [], actions: [], math: {ai: true}};
      }
      // an answer that calls it off ("oh nvm thats my clinical orientation, it's already there", "never mind", "forget it"): nothing
      // made (that sentence became an event's title)
      if (slot && /^\s*(?:oh\s+|ah\s+|wait\s+|actually\s+|um+\s+)?(?:nvm|never ?mind|nevermind|forget it|forget that|cancel( that| it)?|scratch that|no thanks|nah|nope|don'?t bother|it'?s (?:already )?(?:there|on (?:there|it|my calendar))|i already (?:have|did|added) it)\b/i.test(q)) {
        made = {answer: "Okay, I won't add anything.", sources: [], followUps: [], actions: []};
      }
      if (slot && !made) {
        const d0 = Object.assign({}, slot.d), it0 = d0.intent, v0 = q.trim().replace(/^["“']|["”'.!]+$/g, "");
        // the answer to "Which task do you mean?"
        const taskAsk = /^(mark_done|mark_not_done|mark_in_progress|move_task|rename_task|delete_task|set_priority)$/.test(it0) && (!d0.task || d0.taskFromQ || !taskOf(d0.task, c, it0 === "mark_not_done"));
        // "both", "all of them": each of the tasks it offered
        if (d0.cands && /^\s*(both|all|all of them|both of them|each|the two)\b/i.test(v0)) {
          const outs = []; for (const id of d0.cands) { const t = state.tasks[id]; if (!t) continue; const r1 = await intentAct(`${slot.q}`, c, att, Object.assign({}, d0, {cands: null, task: t.title})).catch(() => null); if (r1 && r1.answer) outs.push(r1.answer.replace(/\s*Say "undo".*$/, "")); }
          made = {answer: outs.join(" ") || "I couldn't change those.", sources: [], followUps: [], actions: []};
        }
        else if (d0.cands) { const t = taskOf(v0, c) || (d0.cands.map(id => state.tasks[id]).find(t => t && v0.toLowerCase().split(/\s+/).some(x => x.length > 2 && t.title.toLowerCase().includes(x)))); d0.task = t ? t.title : v0; d0.cands = null; }
        else if (taskAsk) { d0.task = v0; d0.taskFromQ = false; }
        // "which exam is it, and when?" -> "history final, dec 15": read as a whole new request
        else if (/^add_(task|event)$/.test(it0) && d0.generic && d0.generic !== "x") { made = await intentAct(`add ${v0}${new RegExp("\\b" + d0.generic + "\\b|\\b(final|midterm|exam|test|quiz)\\b", "i").test(v0) ? "" : " " + d0.generic}`, c, att).catch(() => null); }
        // a name: "call it X", "X then", or "idk you choose" (named after what's coming up)
        else if (/^(make_deck|new_group|add_course)$/.test(it0) && !d0.title) { let nm = v0.replace(/^(?:ok(?:ay)?|so|um+|hmm+)?[,\s]*(?:call it|name it|let'?s call it|it'?s called|called|named|make it|how about|maybe)\s+/i, "").replace(/\s+(?:then|instead|please|pls)\s*$/i, "").replace(/^["“']|["”']$/g, "").trim();
          if (/^(idk|i don'?t know|dunno|you (choose|pick|decide)|anything|whatever|surprise me)\b/i.test(nm)) { const ex = tasksArr().filter(t => t.status !== "done" && t.due && /exam|quiz|test|midterm|final/i.test(t.type + " " + t.title)).sort((a, b) => a.due.localeCompare(b.due))[0]; nm = ex ? `${ex.title} Review` : "Study Set"; }
          d0.title = nm; }
        else if (/^(make_deck|new_group|add_course|add_task|add_event|rename_task|rename_item)$/.test(it0) && !d0.title) d0.title = v0;
        else if (it0 === "add_note") d0.text = v0;
        else if (it0 === "set_theme") { made = themeAct({value: v0.replace(/^(the|use|try)\s+/i, "")}); }
        else if (it0 === "join_group") d0.value = v0;
        else if (it0 === "add_mark" && d0.replaceOk) { if (/^\s*(y|yes|yeah|yep|sure|ok|okay|replace|do it|go ahead|please)\b/i.test(v0)) made = await intentAct("yes", c, att, d0).catch(() => null); else made = {answer: "Okay, I left the mark as it was.", sources: [], followUps: [], actions: []}; }
        else if (it0 === "add_mark") { if (/\d/.test(v0)) d0.value = (v0.match(/\d+(?:\.\d+)?\s*(?:\/|out of)\s*\d+(?:\.\d+)?|\d+(?:\.\d+)?\s*%?/i) || [v0])[0]; else d0.task = v0; }
        else if (it0 === "add_card") { const p0 = cardParse(`add a card ${v0}`) || []; if (p0[1]) { d0.front = p0[1]; d0.back = p0[2]; } if (!d0.deck) d0.deck = p0[3] || v0; }
        else if (/^(study_deck|open_item|delete_item)$/.test(it0)) d0.item = d0.deck = v0;
        if (!made) made = await intentAct(`${slot.q} ${v0}`, c, att, d0).catch(() => null);
      }
      if (!made && mapMore && window.SBCMAP && SBCMAP.expandFrom) {
        T.status = "Adding to your map…"; draw();
        // (with what their notes say on the map's topic: "add more from my note" was asked of an AI that never saw the note, and it
        // found nothing to add)
        let ask = q; try { const mc = state.courses[last.a.mapOpen.course], mm = mc && SBCMAP.mapsOf ? SBCMAP.mapsOf(mc).find(x => x.id === last.a.mapOpen.map) : null, ws = words(String(mm ? mm.name : "").replace(/\bmap\b/i, ""));
          const nn = notesArr().filter(n => String(n.text || "").trim()).map(n => ({n, s: hits(n.text, ws) + (n.courseId && n.courseId === last.a.mapOpen.course ? 2 : 0)})).filter(x => x.s > 0).sort((a, b) => b.s - a.s).slice(0, 2);
          if (nn.length) ask = `${q}. Use what the student's notes say: ${nn.map(x => clip(x.n.text, 900)).join(" / ")}`; } catch (e) {}
        try { const r = await SBCMAP.expandFrom(last.a.mapOpen.course, last.a.mapOpen.map, ask); made = {answer: `I added ${r.added} more ideas to ${r.name} (${r.ideas} in all). Tap Open Map to see them.`, sources: [], followUps: [], actions: [], mapOpen: last.a.mapOpen}; }
        catch (e) { made = {answer: (e && e.message) || "I couldn't add to that map just now.", sources: [], followUps: [], actions: [], mapOpen: last.a.mapOpen}; }
      }
      // several requests in one message ("journal done, ch7 done, and got 9/10 on the journal", "rename the lab report to Cardiac Lab and
      // push it 2 days", "got 17/20 on quiz 4 and 40/50 on the lab report, mark both done"): each part done in turn, the way the chat does
      // one on its own ("it" is the task the part before was about; "both" or "them" are the tasks done so far)
      if (multi && !made) { T.status = "Doing those one at a time…"; draw();
        const outs = [], touched = []; let prev = "";
        for (const p0 of SBTRUTH.steps(q)) {
          let p1 = p0;
          if (prev) p1 = p1.replace(/\b(it|that one)\b/i, prev);
          if (touched.length > 1) p1 = p1.replace(/\b(both|them|all of them|both of them|these|those)\b/i, touched.join(" and "));
          if (/^\s*\d+(?:\.\d+)?\s*(?:\/|out of)\s*\d+/.test(p1) || /^\s*\d+(?:\.\d+)?\s*%/.test(p1)) p1 = "got " + p1;
          // ("read chapter 7 done", "journal finished": marked done, said without a verb)
          if (/^\s*(?!mark\b|set\b|put\b)[\w&' -]{2,50}?\s+(?:is\s+|are\s+)?(done|finished|complete[d]?|submitted|handed in|turned in)\s*[.!]*$/i.test(p1)) p1 = "mark " + p1.replace(/\s+(?:is\s+|are\s+)?(?:finished|complete[d]?|submitted|handed in|turned in)\s*[.!]*$/i, " done");
          // (the same order as one request: straight from the words first, then the AI step; "I can't do that" from one step isn't the
          // answer while another can still do it)
          let r = null; LASTD = null; const cant = x => !(x && x.answer) || (LASTD && LASTD.intent === "cant") || /^I can't do that from the chat yet/.test(x.answer);
          if (dev) r = await deviceAct(p1, c, true).catch(() => null);
          if (cant(r)) { LASTD = null; const r1 = await intentAct(p1, c, att).catch(() => null); if (!cant(r1) || !(r && r.answer)) r = r1; }
          if (cant(r)) { const r2 = await SBASSIST.ask(p1, {screen: false}).catch(() => null); if (r2 && r2.answer) r = {answer: r2.answer}; }
          if (r && r.answer) { outs.push(r.answer); const nm = (r.did && r.did.task) || (LASTD && LASTD.task) || ""; const t = nm ? taskOf0(nm, null, true) : null; if (t) { prev = t.title; if (!touched.includes(t.title)) touched.push(t.title); } }
        }
        if (outs.length) made = {answer: outs.join("\n"), sources: [], followUps: [], actions: []}; }
      // about the companion itself (its name, what it is, what it's wearing): from its real settings, never made up
      if (ctl) made = {answer: ctl.answer, sources: [], followUps: [], actions: []};
      else if (!att.length && !made) { const me = me0 || selfAnswer(q2); if (me) made = {answer: me, sources: [], followUps: [], actions: []}; }
      if (!made && !careMode && !ctl && !att.length) { made = directAct(q); if (made && made.preset) made = await intentAct(q2, c, att, made.preset).catch(() => null); }
      // (a plain question, "what is osmosis?", skips this step: nothing in it asks for anything to be done)
      const PLAINQ = !!(qFix && more) || !ACTX(q2) && (/^\s*(what|what's|whats|who|why|how|when|where|which|is|are|does|do|did|can you explain)\b[^]*\?\s*$/i.test(q2) || /^\s*(explain|define|describe|tell me about|what is|what's|whats|what are|how does|how do|how is|how are|why (is|are|do|does)|who (is|was|were)|summari[sz]e|compare)\b/i.test(q2));

      if (att.length && att.some(x => /^image\//.test((x.part && x.part.inline_data && x.part.inline_data.mime_type) || "") || /\.(png|jpe?g|gif|webp)$/i.test(x.name || "")) && /\b(add|put|save|pin|stick|place|attach)\b[^?]*\b(note|notes|board)\b/i.test(q)) made = await photoNote(q, att);
      if (!made && att.length && !careMode) made = attStudy(q2, att);
      if (!quick && !made && !att.length && MAP_Q.test(q2) && MAP_ASK.test(q2)) { T.status = "Making your map…"; draw(); made = await mapAct(q2); }
      if (!quick && !made && !att.length && window.SBASSIST && SBASSIST.findNotes) { const fn = await SBASSIST.findNotes(q2).catch(() => null); if (fn) made = {answer: fn.answer, sources: fn.show && fn.show.length ? ["Your notes"] : [], followUps: [], actions: [], show: fn.show && fn.show.length ? SBASSIST.pack(fn).show : undefined}; }
      if (!quick && !made && dev && !att.length) made = await deviceAct(q2, c, !!was);
      // anything the app's own quick steps didn't recognize: the AI works out which action it is (any wording), and the app does it
      if (!made && !careMode && !quick && !PLAINQ && ((dev && !window.__SB_GATE) || ACTX(q2) || /\b(study|review|drill|got|scored|record|new|due|mark|grade|card|deck|group|theme|colou?r|font|text size|notification|hat|glasses|scarf|priority|urgent|important|instructor|professor|prof|teacher|room|longer|shorter|earlier|later|sooner|came back|out of|rename|call it|both|everything|instead|in progress|started|cancel|same for|too|as well|event|calendar|remind)\b|=|\b\d+\s*\/\s*\d+\b/i.test(q2) || att.length)) { T.status = "Working out what to do…"; draw(); LASTD = null; made = await intentAct(q2, c, att).catch(e => { console.warn("intent", e); return null; }); said = (LASTD && LASTD.intent) || ""; }
      // just talking (a feeling, a joke, "you're the best", "ok give me something light"): the companion answers in the conversation,
      // never a search of their notes or the web, and never "I couldn't find that"
      // "how long will that take?", "how bad is that", "why'd you pick the 24th?": about what the last answer said, so answered in the
      // conversation with their planner, never looked up in their notes or on the web
      // (any short message right after a subject answer that isn't thanks or talk is about it too: "by population?", "not sydney??",
      // "what happened next?", "eastern half", "in french?")
      const shortFollow = !more && !fix && q.trim().split(/\s+/).length <= 4 && !/^\s*(?:explain|define|describe|tell me about|what(?:'s| is| are| was| were)|whats|who(?:'s| is| was| were)|whos|how (?:does|do|did|is|are)|why (?:does|do|did|is|are))\s+(?!it\b|that\b|this\b|they\b|them\b|those\b|these\b)\w{3,}/i.test(q) && !/^\s*(thanks|thank you|thx|ty|ok(ay)?|cool|nice|great|lol|lmao|haha|wow|got it|perfect|awesome|yes|yeah|yep|no|nope|nah|hi|hey|hello|bye|good ?night)\b[\s!.]*$/i.test(q);
      const lastPlan = !!last && !!TR && ((last.a.sources || []).includes("Your planner") || !!(() => { try { return TR.facts(last.ask || last.q); } catch (e) { return null; } })() || !!last.a.ref || /\b(moved|marked|added|due)\b/i.test(String(last.a.answer || "").slice(0, 200)));
      const aboutLast = !made && !att.length && ((lastPlan && shortFollow && !ACTX(q2)) || (lastPlan && /\b(that|it|this|those|them|these|that one)\b/i.test(q2) && ISQ(q2) && !ACTX(q2)) || /^\s*why (did|'?d|would|do) (you|u)\b/i.test(q2));
      const chatty = !made && !att.length && (careMode || said === "chat" || (!ISQ(q2) && !PLAINQ && !/^\s*(explain|define|describe|tell me about|summari[sz]e|compare|what|who|why|how|when|where|which)\b/i.test(q2) && /\b(i|i'm|im|i've|me|my|you|your|u|ur|lol|lmao|haha|ugh|thanks|thank|ok|okay|yeah|yep|nah|cool|nice|aw+|omg|wow)\b/i.test(q2))
        // a few words with no question, nothing to do and nothing about their work ("pho", "only 2k", "evening packy", "night packy"): talk
        || (q2.trim().split(/\s+/).length <= 4 && !/\?/.test(q2) && !ISQ(q2) && !ACTX(q2) && !/^\s*(explain|define|describe|summari[sz]e|compare|what|who|why|how|when|where|which|list|show|open|quiz|test)\b/i.test(q2)
          && !/\b(due|tasks?|homework|hw|exams?|quiz(zes)?|midterm|final|grades?|marks?|class(es)?|courses?|essay|lab|care plan|study|notes?|cards?|decks?|schedule|calendar|today|tomorrow|tonight|week|timer|reading|chapter|journal|plan)\b/i.test(q2)
          && !(window.SBTRUTH && SBTRUTH.general && SBTRUTH.general(q2) && !/\b(packy|mochi|bramble|morning|evening|night|hi|hey|hello|yo|sup|gm|gn)\b/i.test(q2))));
      // a word or two with no question, said in the middle of chatting ("louder", "backpack" in a knock-knock joke): the conversation, not Wikipedia
      const convoBit = !!last && !last.a.know && !last.a.math && !(last.a.sources || []).includes("Your planner") && !att.length && q2.trim().split(/\s+/).length <= 2 && !/\?/.test(q2) && !/^\s*(what|who|whos|define|explain|why|how|meaning)\b/i.test(q2);
      const noKnow = chatty || aboutLast || convoBit;
      let chatMiss = false;
      // told to do something ("change ...", "add ...", "turn on ...") and nothing above could: said plainly, never an unrelated reply
      if (!made && !quick && !att.length && /^\s*(?:please\s+|(?:can|could|would|will) (?:you|u)\s+)?(?:change|switch|set|make|turn|add|create|delete|remove|move|rename|start|stop|put|mark|update|edit|enable|disable|reset|clear|hide|show me|open)\b/i.test(q2) && !/\?\s*$/.test(q2) && !TR.general(q2)
        // (something to write is an answer, not a change: "make me a 2 day plan", "put it in a timeline", "make up a rhyme", "make it shorter")
        && !/\b(?:make|put|turn|write|create|change|switch)\b[^.?!]*\b(?:plan|schedule|timeline|table|list|chart|outline|summary|song|rhyme|poem|rap|story|joke|mnemonic|acronym|analogy|example|question|questions|bullet|bullets|steps|order|words|sentence|paragraph|essay|email|message|text|shorter|longer|simpler|easier|clearer|funnier|up)\b/i.test(q2)
        // and only about something in Studyboard: "make me laugh im sad", "start over", "set the mood" are things to say back, not changes
        // it can't make (they got "I'm not able to do that from the chat yet")
        && /\b(tasks?|assignments?|homework|hw|events?|calendar|courses?|class(es)?|decks?|cards?|flash ?cards?|quiz(zes)?|notes?|sticky|board|whiteboard|settings?|theme|colou?rs?|fonts?|text size|notifications?|reminders?|alerts?|timer|pomodoro|focus|grades?|marks?|scores?|due|deadline|priority|groups?|maps?|files?|folders?|account|password|sync|school site|dark mode|light mode|widget|companion|wardrobe|hat|scarf|outfit|backup|language|availability|schedule|planner|studyboard|app)\b/i.test(q2))
        made = {answer: "I'm not able to do that from the chat yet, so I didn't change anything. Try saying it another way, or do it in Studyboard directly (Settings has most options).", sources: [], followUps: [], actions: []};
      // the AI said it's a question ("yo whats due soon"): the planner's own exact answer first, when it has one
      let late = null; if (!quick && !made && !noKnow && !cardQ && dev && TR && !att.length && !ctl) { try { late = TR.facts(q2); } catch (e) {} }
      // a question about the subject (on the device): the same answer as Ask's, from their own material first, then the web
      // a follow-up to a subject question ("in feet?", "who wrote it?", "give an example of each", "are you sure?", "what else is she
      // known for?"): answered with the last question and answer in view, and looked up with its topic, not the follow-up's own words
      const lastKnow = !!last && !!TR && (!!last.a.know || (!last.a.math && !lastPlan && TR.general(String(last.ask || last.q))));
      const kFollow = !made && !noKnow && lastKnow && !planA && q.split(/\s+/).length <= 12 && !ACTX(q) && (shortFollow || /\b(it|its|that|this|they|them|their|those|these|he|him|his|she|her|each|one|ones|there|then|else|next|after that|before that)\b/i.test(q)
        // "what are the types", "list the symptoms", "main causes?": the types of what was just explained, not of clouds
        || (q.split(/\s+/).length <= 6 && /^\s*(?:(?:what|which|how many|name|list|tell me)\b[^?]{0,15}\b)?(?:the\s+|its\s+|their\s+)?(?:main\s+|different\s+|common\s+|key\s+)?(types?|kinds?|stages?|phases?|steps?|causes?|symptoms?|signs?|parts?|treatments?|side effects?|risks?|benefits?|functions?|complications?|examples?|differences?|uses?|effects?)\b\s*\??\s*$/i.test(q)) || /^\s*(and|so|but|in|on|at|for|with|by|not|than|or|vs|versus|compared|what about|how about|what happened|why|how|which|who|where|when|give|example|are you sure|really|wait|more|explain|simpler|translate)\b/i.test(q));
      if (!quick && !late && !made && !noKnow && !MATHQ && dev && !att.length && TR && (TR.general(q2) || kFollow) && !(window.SBASSIST && SBASSIST.appQ(q2) && !kFollow)) {
        T.status = "Looking through your notes…"; draw();
        const lq = String(last && (last.ask || last.q) || ""), prev = kFollow ? {q: lq, a: String(last.a.answer || "")} : null;
        const search = kFollow ? `${topicOf(lq)} ${q.replace(/\b(it|its|that|this|they|them|their|those|these|he|him|his|she|her|what|about|and|so|in|on|the|a|an|give|me|example|examples|of|each|are|you|sure|why|how|which|who|is|was|were|does|did|do|else|known|for|more)\b/gi, " ")}`.replace(/\s+/g, " ").trim() : "";
        // (a follow-up already rewritten with its topic, "why does osmosis happen?", is asked as written)
        const k = await TR.knowledge(kFollow && q2 === qT ? q : q2, {prev: q2 === qT ? prev : null, search: q2 === qT ? search : "", onStatus: x => { T.status = x; draw(); }, onPartial: t => { T.live = t; drawStatus(); }});
        made = {answer: k.answer, sources: k.found ? [...(k.notesSrc || []).slice(0, 3), ...(k.sources || []).map(x => x.src + ": " + x.title)].map(x => clip(x, 40)).slice(0, 5) : [], followUps: [], actions: [], know: true};
        // nothing found, and it's talk rather than a subject question ("what's your favourite thing to do", "why" after a joke, "what's
        // the meaning of life", "do you read my notes"): the companion answers in the conversation instead of "I couldn't find"
        if (!k.found && (/\b(you|your|u|ur|yourself|life|weather|favou?rite)\b/i.test(q2) || q2.split(/\s+/).length <= 3 || (last && !last.a.know && !lastPlan && !last.a.math))) { made = null; chatMiss = true; }
      }
      // a knock-knock joke: played along ("Who's there?", "Backpack who?"), then the punchline gets the companion's laugh
      if (!made && !quick && !late && !att.length) {
        const KK = /^\s*knock[\s,.!-]*knock\W*$/i;
        if (KK.test(q)) made = {answer: "Who's there?", sources: [], followUps: [], actions: []};
        else if (last && KK.test(String(last.q || "")) && q.trim().split(/\s+/).length <= 4 && !/\?/.test(q)) made = {answer: `${q.trim().replace(/[.!]+$/, "").replace(/^./, x => x.toUpperCase())} who?`, sources: [], followUps: [], actions: []};
      }
      // (an answer the app had at once still takes a moment, like someone reading the question first)
      if (quick || late || made) { const w = 1000 + Math.random() * 800 - (Date.now() - t0); if (w > 0 && !(window.__SB_TEST && !window.__SB_PACE)) await new Promise(r => setTimeout(r, w)); }
      if (made && (made.math || made.plan)) { m.a = made; delete m.a.plan; }
      else if (quick || late) m.a = {answer: (quick || late).answer, sources: ["Your planner"], followUps: [], actions: []};
      else if (made) m.a = made;
      else {
      const me = info() || {}, prevQ = (c.msgs.filter(x => x.a).slice(-1)[0] || {}).q || "";
      // just talking: a short look at what's coming up instead of the whole planner, so the reply stays on what they said (a small model
      // given every task and grade talks about them) and comes quickly. A question about their work gets the planner as before
      const smallTalk = (chatty || chatMiss || convoBit) && !/\b(due|deadlines?|tasks?|homework|exams?|quiz(zes)?|midterm|final|grades?|marks?|class(es)?|courses?|essay|lab|care plan|study|studying|notes?|cards?|deck|schedule|week|today|tomorrow|tonight|weekend)\b/i.test(q);
      const [ctx, cat] = await Promise.all([smallTalk ? Promise.resolve(chatContext()) : context(q, prevQ, att.length > 0), !smallTalk && window.SBASSIST && SBASSIST.wants(q) ? SBASSIST.catalog(q, {max: typeof aiOnDevice === "function" && aiOnDevice() ? (typeof DEVAI !== "undefined" && DEVAI.kind === "litert" ? 8000 : 8000) : 30000}).catch(e => { console.warn(e); return null; }) : null]);
      // a general question on the device: Wikipedia as a source, then the key points a good answer covers, so it isn't shallow
      let plan = "";
      if (dev && TR && !att.length && !noKnow && !chatMiss && !MATHQ && TR.general(q)) {
        T.status = "Looking it up…"; draw();
        const R = await TR.research(q, {onStatus: t => { T.status = t; draw(); }}).catch(() => ({list: []})), web = R.list || [];
        if (web.length) { ctx.text += `\n\nFROM THE WEB (say where a fact comes from, like "according to Wikipedia" or "a 2019 study found"):\n${TR.webText(web)}`; web.forEach(x => { if (!ctx.src.includes((x.src || "Wikipedia") + ": " + x.title)) ctx.src.push((x.src || "Wikipedia") + ": " + x.title); }); }
        plan = "1";
      }
      const seen = window.SBASSIST ? SBASSIST.screenText(SBASSIST.current()) : "";
      const actOn = att.length > 0 || MAKE.test(q), format0 = formatFor(q, att.length > 0, !!cat);
      // a general question on the device: the key points first, then the answer, in the same reply (planned, so not shallow; one call, so quick)
      const format = plan ? Object.assign({}, format0, {properties: Object.assign({points: {type: "ARRAY", items: {type: "STRING"}, description: "First: the 3 to 5 key points a complete answer covers, in order (what it is, how it works, why it matters, an example, a common mistake), only what the sources support"}}, format0.properties), required: ["points"].concat(format0.required || [])}) : format0;
      T.status = "Thinking…"; draw();
      const hist = c.msgs.filter(x => x.a).slice(-6).map(x => `Student: ${x.q}\n${me.name || "Companion"}: ${clip(x.a.answer, dev ? 600 : 1200)}`).join("\n\n");
      const system0 = `You are ${me.name || "a study companion"}${me.kind ? ", a " + me.kind : ""}, the student's friendly study companion living inside their Studyboard planner. ${me.bio ? "About you: " + clip(me.bio, 160) + " " : ""}${me.kind ? `You are ${me.kind.toLowerCase()} yourself (you don't wear or carry one). ` : ""}${(SBCOMP.wornNames ? SBCOMP.wornNames() : []).length ? `You're wearing: ${SBCOMP.wornNames().join(", ")}. ` : "You're wearing no accessories. "}Speak warmly and briefly, like a supportive study buddy. No emojis. Answer from the student's own data below whenever the question is about their work, courses, deadlines, grades, notes, flashcards or files. Only the parts of the planner this question needs are sent, and each part that is sent is complete: MARKED WORK lists every mark entered (each assignment, quiz and exam, with its percentage), OPEN TASKS lists every open task, and TODAY'S PLAN is Studyboard's own priority order. Read the answer straight from it: for "best" or "lowest" marks compare the percentages in MARKED WORK, for "what should I do now/next" answer with DO THIS NEXT; for "what after today's plan" or "once I finish today's tasks" answer with item 1 under THEN, AFTER TODAY'S PLAN IS DONE; for "what comes after X" find X in that list and give the next item (and so on down the list), never a task that is already on today's plan, and never your own ranking. Think about what the student is really asking before answering, and answer exactly that question first, in one clear sentence, before anything else. Give exact titles, numbers and dates from the data. You are a real AI helper for anything about their courses, their course materials or Studyboard itself: use everything below (their planner, the search results from their own files, notes and cards, the file text, what's on their screen, and HOW STUDYBOARD WORKS for questions about the app), and your own knowledge for subject matter. Always give a real, useful answer: if their data doesn't have something, say briefly what you checked, then help anyway (explain the topic, say where in the app it would be, or ask one short question). Never invent their facts, dates, marks or file contents. When you use their course materials, say which file or note it came from. Match the length to the question: a sentence for a quick fact, a clear explanation with short paragraphs, steps or '- ' bullets when they want to understand, learn, plan or do something. For questions about their work, suggest a concrete next step when it helps. Reply to exactly what the student said, nothing they didn't ask for. Add more only when it clearly helps with what they asked (like what it takes to keep a grade when they ask about that grade, or a deadline that clashes with the plan they're asking about), never as filler. When the student is just chatting, answer that and only that, in character and briefly, like a friend: a hello gets a short friendly hello back (and, at most, a few words offering help), not news about you or a question back; only say how you are or what you've been up to when they ask; thanks gets a short "you're welcome". Don't steer small talk to tasks, deadlines or studying, and don't add a next step, unless they bring up school or sound stressed about it, and then be kind first.${actOn ? `
You can also DO things in Studyboard, but only when the student asks or what they attached clearly calls for it, and only by offering actions they tap to confirm (never say it is already done). Actions: flashcards, quiz or case_study (made from the attached files, or from the material you put in "text"; set "deck" to add to an existing deck; they are saved straight to the student's decks); note (a clean typed note from a photo, slides or anything else, optionally onto a named note board and course); tasks (due dates you find in what they attached or told you); quick_add (open Quick Add with a sentence to turn into tasks); syllabus (read an attached syllabus into a course and its deadlines); breakdown (split a big task into milestones; "target" is the task title); estimate (estimate times for tasks with none); exam_plan (build an exam prep plan; "target" is the exam title); ask_materials (open Ask Your Course Materials for a course); summarize_file ("target" is a file name from FILES); save_file (store the attached files in the course's Files). Things you can simply answer in chat, do that instead of an action: explaining a task or topic, summarizing what was attached or their notes, a weekly review, quizzing them one question at a time, checking an answer they wrote, listing exam topics, rewriting or tidying text. Photos of whiteboards, slides or handwriting: read them fully and offer a note. Slides, PDFs or readings: offer flashcards, and a quiz if they want to practice. Say in your answer what you are offering, in a sentence or two. If they attached something and gave no instructions, say what you see and offer the most useful one or two actions.` : ""}${cat && window.SBASSIST ? "\n" + SBASSIST.RULES + "\nThe refs are in ITEMS YOU CAN SHOW OR CHANGE. Changing existing things always goes in \"changes\", never in actions. Tasks the student asks you to add go in \"newTasks\"; keep the tasks action for due dates found in files they attached." : ""}${MATHQ ? "\n\nThis is a maths question. Work it out carefully, one short step per line, checking each step, then give the final answer on its own last line. If it can't be solved as written, say exactly what is missing." : ""}`;
      const integ = !!CARE && [q].concat((c.msgs || []).slice(-3).map(x => x.q || "")).some(x => CARE.integrity(x));
      // talk that carries on from the chat ("hehe", "backpack" in a knock-knock joke, "ok better", "one more"): the reply follows on from
      // the last message instead of starting over with how you are
      const CONVO = hist ? `\n\nThis is a conversation: reply to what the student just said as the next line of the CONVERSATION SO FAR (play along with a joke or game in progress, answer the question you just asked them about). Don't say how you are unless they ask how you are. Tell jokes when asked (short, kind, school or nursing puns are fine). You are ${me.name || "their companion"}, part of Studyboard on their device, not a chatbot on a server; stay in character. Never repeat a sentence you already said in this chat.` : "";
      // small talk on its own (a greeting, food, a hobby, how they are): a friend's reply, not a planner report
      const TALK = smallTalk ? `\n\nThey're just chatting. Reply like a friend in 1 or 2 short sentences about exactly what they said (react, share a small opinion of your own, and ask one related question). Never say you checked their planner, that you have no information about it, or that you're "here to help with their studies", and don't bring up tasks unless they do.` : "";
      // in character, whatever is asked: an opinion gets a pick and why; a game or role-play they start gets your turn
      const PERSONA = `\n\nWhen they ask your opinion, favourite or choice ("which class would you take", "would you rather", "what's your favourite"), pick one and say why in a sentence, as ${me.name || "their companion"}. When they start a game or role-play (20 questions, a riddle, a mock interview, talking like a pirate), play it: take your turn, ask your question, keep score. Never say you are an AI, a language model or a chatbot, or that you have no feelings or preferences.`;
      const system = system0 + PERSONA + CONVO + TALK + (careMode ? CARE.CARE_RULE : "") + (integ ? CARE.INTEGRITY_RULE : "");
      // free: no answer format enforced, just asked for (decoded differently, so a placeholder can't come back the same way)
      const call = (fmt, free) => aiCall({onPartial: dev ? t => { T.live = t; drawStatus(); } : undefined, task: att.length ? "tutor" : "chat", maxTokens: dev ? (att.length ? 1200 : 700) : att.length ? 12000 : 6000, schema: free ? null : fmt || format, system: free ? system + FREE_RULE : system, temperature: free ? 0.5 : undefined, onStatus: s => { T.status = s; drawStatus(); },
        parts: att.map(x => x.part).concat([{text: `THE STUDENT'S PLANNER (only what's relevant):\n${ctx.text}\n\n${cat ? "ITEMS YOU CAN SHOW OR CHANGE (with refs):\n" + cat.text + "\n\n" : ""}${seen ? seen.trim() + "\n\n" : ""}${hist ? "CONVERSATION SO FAR:\n" + hist + "\n\n" : ""}${att.length ? "THE STUDENT ATTACHED: " + att.map(x => x.name + " (" + x.kind + ")").join(", ") + "\n\n" : ""}STUDENT'S QUESTION: ${q}${plan ? "\n\nFirst list the key points in points, then write the answer covering each one in order, with a short concrete example where it helps." : ""}`}])});
      // Always a real answer: the full format, then the simplest one, then a free reply; a moment between tries after an
      // error (busy, slow). If the AI still can't be reached, an answer is made on this device from what was found.
      let r = null, lastErr = null;
      const tries = [() => call(), () => call(PLAIN), () => call(null, true)];
      for (let i = 0; i < tries.length && !r; i++) {
        try { const x = await tries[i](); if (x && x.data && !junk(x.data.answer)) r = x; }
        catch (e) { lastErr = e; if (stopsHere(e)) throw e; if (usedUp(e)) break; await new Promise(res => setTimeout(res, 1200 * (i + 1))); }
      }
      if (!r) r = {data: localAnswer(ctx, lastErr, q), local: true};
      const d = r.data || {};
      // the check: nothing in the answer that wasn't given; once more strictly, else said plainly
      if (dev && TR && !r.local && d.answer && !smallTalk && !careMode) {
        const given = `${ctx.text}\n${cat ? cat.text : ""}\n${seen}\n${hist}\n${q}\n${att.map(x => (x.part && x.part.text) || "").join("\n")}`;
        let bad = TR.unsupported(d.answer, given);
        if (bad.length && !att.some(x => x.part && !x.part.text)) {
          try { const x = await aiCall({task: "chat", maxTokens: 4000, temperature: 0.1, schema: PLAIN, system: system + `\n\nIMPORTANT: use ONLY facts in what you were given. Don't mention ${bad.slice(0, 6).join(", ")}: they aren't in it. If the answer isn't there, say you couldn't find it.`,
            parts: [{text: `THE STUDENT'S PLANNER AND SOURCES:\n${ctx.text}\n\n${cat ? cat.text + "\n\n" : ""}THE STUDENT ASKS: ${q}`}]});
            if (x && x.data && !junk(x.data.answer) && !TR.unsupported(x.data.answer, given).length) { d.answer = x.data.answer; bad = []; } } catch (e) {}
          if (bad.length) d.answer = "I couldn't find a reliable answer to that in your Studyboard" + (ctx.src.some(x => /^Wikipedia/.test(x)) ? " or on Wikipedia" : "") + ". Try asking it another way, or add a key in AI Features for a stronger AI.";
        }
      }
      m.a = {answer: clip2(d.answer, 8000), sources: (d.sources || []).map(x => clip(x, 40)).filter(Boolean).slice(0, 6), followUps: (d.followUps || []).map(x => clip(x, 90)).filter(x => x && !/\b(would you like|do you want|would it be helpful|should i|you'd like|your preference|are you|have you|did you|what do you think)\b|^\s*(what|which|how)\b[^?]*\byou\b[^?]*\b(like|want|prefer|need)\b/i.test(x)).slice(0, 3), actions: cleanActions(d.actions, att.length > 0 || !!T.srcs[m.at])};
      if (cat && window.SBASSIST) { const res = SBASSIST.pack(SBASSIST.resolve(d, cat.refs)); if (res.show.length) m.a.show = res.show; if (res.changes.length) m.a.changes = res.changes; }
      if (!m.a.answer) m.a.answer = localAnswer(ctx, null, q).answer;
      if (r.local) m.a.local = true;
      if (careMode) m.a.care = true;
      // no emojis (the instructions say so; a small model adds them anyway)
      m.a.answer = String(m.a.answer || "").replace(/\s*(?:\p{Extended_Pictographic}|\p{Regional_Indicator})(?:️|‍(?:\p{Extended_Pictographic})?)*/gu, "").trim();
      // the planner's section names and raw dates are for the AI, not the student ("listed under THEN, AFTER TODAY'S PLAN IS DONE",
      // "due on 2026-11-26 23:59"): said in plain words
      m.a.answer = m.a.answer.replace(/\s*(?:is |as )?(?:listed |the first item |item \d+ )*(?:under|in|on)\s+(?:the\s+)?["“]?THEN, AFTER TODAY'S PLAN IS DONE["”]?/g, " next on your list after today's plan").replace(/["“]?THEN, AFTER TODAY'S PLAN IS DONE["”]?/g, "next after today's plan")
        .replace(/["“]?DO THIS NEXT["”]?/g, "next up").replace(/\bTODAY'S PLAN\b/g, "today's plan").replace(/\bOPEN TASKS\b/g, "your open tasks").replace(/\bMARKED WORK\b/g, "your marks").replace(/\bITEMS YOU CAN SHOW OR CHANGE\b|\bHOW STUDYBOARD WORKS\b/g, "Studyboard")
        .replace(/\b(\d{4}-\d{2}-\d{2})(?:[ T](\d{2}:\d{2}))?\b/g, (x, dd, tt) => { try { return fmtDate(dd) + (tt && tt !== "23:59" ? " at " + fmtTime(tt) : ""); } catch (e) { return x; } });
      if (!m.a.sources.length) m.a.sources = ctx.src.slice(0, 4);
      // a reply that says it did something when nothing changed: done for real when the app can, else said honestly (every engine:
      // Claude says "Done, added" too)
      if (window.SBASSIST && SBASSIST.CLAIMS.test(m.a.answer || "") && !(m.a.actions || []).length && !(m.a.changes || []).length && !newSince(ids0) && sig() === upd0) {
        const fix = await deviceAct(q, c, true).catch(() => null);
        if (fix) m.a = fix;
        else m.a.answer = `I couldn't make that change from here, so nothing was saved yet. Say exactly what to change (like "add a card to Heart: What is systole? / the ventricles contract"), and I'll do it.`;
      }
      // filler, or a reply that never mentions what was asked about: their material and the web instead, or an honest "couldn't find"
      // (only for a question: a greeting's reply names nothing, and "hi bramble" or "hello again" were looked up on the web, finding a
      // film called "Hello, Love, Again". And the question as it was understood (q2: "explain it simpler" is "Explain simply: mitosis vs
      // meiosis"), with the last turn's subject for a follow-up: "who else was involved?" after the moon landing, "where is it now?" after
      // the Mona Lisa, were looked up word for word and came back "couldn't find")
      const askQ = q2 !== q ? q2 : q, QLIKE = ISQ(askQ) || /^\s*(explain|define|describe|tell me|give me|list|name|compare|summari[sz]e|what|who|why|how|when|where|which)\b/i.test(askQ);
      if (QLIKE && !noKnow && !chatMiss && !MATHQ && TR && TR.nonAnswer && !att.length && !(m.a.actions || []).length && !(m.a.changes || []).length && !(m.a.show || []).length && TR.nonAnswer(askQ, m.a.answer)) {
        T.status = "Looking it up in your notes and on the web…"; draw();
        const lq0 = String(last && (last.ask || last.q) || ""), fo = (kFollow || (lastKnow && askQ.split(/\s+/).length <= 8)) && !!lq0;
        const prev = fo ? {q: lq0, a: String(last.a.answer || "")} : null, search = fo ? `${topicOf(lq0)} ${askQ.replace(/\b(it|its|that|this|they|them|their|those|these|he|him|his|she|her|what|about|and|so|in|on|the|a|an|give|me|example|examples|of|each|are|you|sure|why|how|which|who|is|was|were|does|did|do|else|now|more|explain|simpler|simply)\b/gi, " ")}`.replace(/\s+/g, " ").trim() : "";
        // (only when the lookup found something: "couldn't find" never replaces a reply to "how are YOU doing" or "what's your favourite thing")
        try { const k = await TR.knowledge(askQ, {noWeb: !TR.general(askQ) && !fo, prev, search}); if (k.found || /^\s*$/.test(m.a.answer || "")) m.a = {answer: k.answer, sources: k.found ? [...(k.notesSrc || []).slice(0, 3), ...(k.sources || []).map(x => x.src + ": " + x.title)].map(x => clip(x, 40)).slice(0, 5) : [], followUps: [], actions: []}; } catch (e) { if (stopsHere(e)) throw e; }
      }
      }
      // what this reply made (a deck, task, event, note), so "rename it", "delete it", "study it" next mean that
      if (m.a && !m.a.ref) { const nw = newSince(ids0); if (nw) m.a.ref = nw; }
    } catch (e) { m.err = clip((e && e.message) || "I couldn't answer that just now. Try again in a bit?", 200); if (e && e.code) m.errCode = String(e.code); if (e && e.detail) m.errDetail = clip(e.detail, 240); }
    })();
    if (await Promise.race([work.then(() => false, () => false), new Promise(r => setTimeout(() => r(true), ((window.__SB_TEST && window.__CHAT_MAX) || CHAT_MAX) + (m.files && m.files.length && !(window.__SB_TEST && window.__CHAT_MAX) && typeof aiOnDevice === "function" && aiOnDevice() ? 120000 : 0) + (typeof e4bLoaded !== "undefined" && typeof DEVAI !== "undefined" && DEVAI.kind === "litert" && !e4bLoaded ? 120000 : 0)))])) m = {q: m.q, at: m.at, files: m.files, err: m.files && m.files.length ? `Reading ${m.files.length === 1 ? m.files[0] : "those files"} took too long${typeof aiOnDevice === "function" && aiOnDevice() ? " for the AI on this computer" : ""}, so I stopped. Try asking about one part of it, or attach fewer pages or slides.` : `That took too long${typeof aiOnDevice === "function" && aiOnDevice() ? " for the AI on this computer" : ""}, so I stopped. Try again: it's often quicker the second time, once the AI has warmed up.`, errCode: "slow"};
    const fresh = rd(), cc = fresh.find(x => x.id === c.id) || c;
    if (!fresh.includes(cc)) fresh.unshift(cc);
    cc.msgs.push(m); cc.msgs = cc.msgs.slice(-MAXM); cc.at = Date.now();
    fresh.sort((a, b) => b.at - a.at); wr(fresh);
    clearInterval(T.tick); T.busy = null; T.status = ""; T.live = ""; draw(); say();
    // made right away when the student asked for it in so many words (a note with its text)
    if (m.a && m.a.actions) m.a.actions.forEach((x, i) => { if (x.auto && !x.done) runAction({dataset: {m: String(m.at), i: String(i)}}); });
    try { if (m.a && window.SBCOMP) { SBCOMP.cheer && 0; } } catch (e) {}
  }
  const clip2 = (s, n) => String(s == null ? "" : s).trim().slice(0, n);

  /* ---------- Drawing ---------- */
  const CHAT_IC = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h16v11H9l-5 4z"/><circle cx="9" cy="10.5" r=".9" fill="currentColor"/><circle cx="12.5" cy="10.5" r=".9" fill="currentColor"/><circle cx="16" cy="10.5" r=".9" fill="currentColor"/></svg>';
  function starters(){
    const out = [], open = tasksArr().filter(t => t.status !== "done").sort(sortTasks), cs = coursesArr();
    out.push("What should I work on next?");
    if (open.some(t => t.due)) out.push("What's due this week?");
    if (open[0]) out.push(`Help me plan "${clip(open[0].title, 40)}"`);
    const d = decksArr().find(x => x.cards.length >= 3); if (d) out.push(`Quiz me on ${clip(d.name, 30)}`);
    if (cs.length) { try { if (window.SBGRADES && SBGRADES.lines().length) out.push("How am I doing in my courses?"); } catch (e) {} }
    if (notesArr().some(n => String(n.text || "").trim())) out.push("Summarize my notes");
    return out.slice(0, 5);
  }
  // An error the student fixes in AI Settings (a refused or missing key, no consent yet) is a clear notice with the button to get there
  function errHtml(m){
    const fix = /^(key|nokey|no-consent)$/.test(m.errCode || "");
    return `<div class="${fix ? "cpt-err cpt-banner" : "cpt-err"}" role="alert"><p style="margin:0">${esc(m.err)}</p>${aiDetailHtml({detail: m.errDetail})}${fix ? `<button type="button" class="btn small primary" data-act="ai-setup">Open AI Settings</button>` : ""}</div>`;
  }
  function msgHtml(m){
    const me = info() || {};
    const acts = m.a && m.a.actions && m.a.actions.length ? `<div class="cpt-actions">${m.a.actions.map((a, i) => `<div class="cpt-action"><span class="cpt-action-t">${esc(a.label)}</span>${a.done ? `<span class="mini cpt-done">${esc(a.done)}</span>` : `<button type="button" class="btn small primary" data-act="cpt-do" data-m="${esc(String(m.at))}" data-i="${i}">${ACT_BTN[a.type] || "Make It"}</button>`}${a.deckId && state.decks[a.deckId] ? `<button type="button" class="btn small" data-act="cpt-open-deck" data-id="${esc(a.deckId)}">Open Deck</button>` : ""}</div>`).join("")}</div>` : "";
    const found = m.a && m.a.show && m.a.show.length ? `<div class="cpt-show">${m.a.show.map((t, i) => `<button type="button" class="chip cpt-show-b" data-act="cpt-show" data-m="${esc(String(m.at))}" data-i="${i}">${esc(t.label || "Show")}<span aria-hidden="true"> →</span></button>`).join("")}</div>` : "";
    const adds = m.a && m.a.changes && m.a.changes.length && m.a.changes.every(x => x.t && x.t.kind === "newtask");
    const chg = m.a && m.a.changes && m.a.changes.length ? `<div class="cpt-actions">${adds ? m.a.changes.map(x => `<div class="cpt-action"><span class="cpt-action-t">${esc(x.label)}${x.to ? `<span class="mini cpt-action-d"> · ${esc(x.to)}</span>` : ""}</span></div>`).join("") + `<div class="cpt-action">${m.a.changesDone ? `<span class="mini cpt-done">${esc(m.a.changesDone)}</span>` : `<button type="button" class="btn small primary" data-act="cpt-change" data-m="${esc(String(m.at))}">Add ${m.a.changes.length === 1 ? "Task" : m.a.changes.length + " Tasks"}</button>`}</div>`
      : `<div class="cpt-action"><span class="cpt-action-t">${m.a.changes.length === 1 ? esc(`${m.a.changes[0].what}: ${m.a.changes[0].label}`) : `${m.a.changes.length} changes`}</span>${m.a.changesDone ? `<span class="mini cpt-done">${esc(m.a.changesDone)}</span>` : `<button type="button" class="btn small primary" data-act="cpt-change" data-m="${esc(String(m.at))}">Review ${m.a.changes.length === 1 ? "Change" : "Changes"}</button>`}</div>`}</div>` : "";
    const mapBtn = m.a && m.a.mapOpen ? `<div class="cpt-actions"><div class="cpt-action"><span class="cpt-action-t">Concept map ready</span><button type="button" class="btn small primary" data-act="cpt-open-map" data-m="${esc(String(m.at))}">${esc(m.a.mapOpen.label || "Open Map")}</button></div></div>` : "";
    return `<div class="cpt-q">${esc(m.q)}${m.files && m.files.length ? `<div class="cpt-qf">${m.files.map(f => `<span>${esc(f)}</span>`).join("")}</div>` : ""}</div>
      <div class="cpt-a">${m.err ? errHtml(m) : `${miniMd(m.a.answer)}
        ${m.a.sources && m.a.sources.length ? `<details class="cpt-srcd"><summary>Looked at ${m.a.sources.length} ${m.a.sources.length === 1 ? "thing" : "things"}</summary><div class="cpt-src">${m.a.sources.map(s => `<span class="chip">${esc(s)}</span>`).join("")}</div></details>` : ""}${found}${chg}${mapBtn}${acts}`}
        ${m.a && !m.err ? `<div class="cpt-acts"><button type="button" class="link-btn" data-act="cpt-note" data-id="${esc(String(m.at))}">Save This Reply</button><button type="button" class="link-btn" data-ai-report="companion-chat" data-ai-text="${esc(String(m.a.answer || "").slice(0, 1400))}">Report Response</button></div>` : ""}</div>`;
  }
  function logHtml(){
    const c = rd().find(x => x.id === T.id), msgs = c ? c.msgs : [], busy = T.busy && T.busy.id === T.id ? T.busy : (!c && T.busy ? T.busy : null);
    const last = msgs[msgs.length - 1];
    if (!msgs.length && !busy) {
      const me = info() || {};
      return `<div class="cpt-empty"><p><b>${esc(me.name ? "Hi, I'm " + me.name + "!" : "Hi!")}</b> I'm your AI study companion. Ask about your deadlines, courses, notes or anything you're studying.</p>
        ${aiOk() ? `<div class="cpt-chips">${starters().map(s => `<button type="button" class="chip" data-act="cpt-ask" data-q="${esc(s)}">${esc(s)}</button>`).join("")}</div>` : ""}</div>`;
    }
    return msgs.map(msgHtml).join("") + (busy ? `<div class="cpt-q">${esc(busy.q)}</div><div class="cpt-a cpt-wait"><p><span class="ai-spin" aria-hidden="true"></span> <span id="cptStatus">${esc(T.status || "Thinking…")}</span></p></div>` : "")
      + (last && last.a && !busy && (last.a.followUps || []).length ? `<div class="cpt-chips fu">${last.a.followUps.map(f => `<button type="button" class="chip" data-act="cpt-ask" data-q="${esc(f)}">${esc(f)}</button>`).join("")}</div>` : "");
  }
  // Attached files are kept on this device (IndexedDB) for as long as the chat message exists
  const IDBN = "studyboard-cpt-files";
  const idb = (mode, fn) => new Promise(res => { try { const rq = indexedDB.open(IDBN, 1); rq.onupgradeneeded = () => rq.result.createObjectStore("f"); rq.onerror = () => res(null); rq.onsuccess = () => { try { const db = rq.result, tx = db.transaction("f", mode), out = fn(tx.objectStore("f")); tx.oncomplete = () => { db.close(); res(out && "result" in out ? out.result : true); }; tx.onerror = tx.onabort = () => { db.close(); res(null); }; } catch (e) { res(null); } }; } catch (e) { res(null); } });
  const idbPut = (k, v) => idb("readwrite", st => st.put(v, k));
  const idbGet = k => idb("readonly", st => st.get(k));
  const idbDel = ks => idb("readwrite", st => ks.forEach(k => st.delete(k)));
  const idbKeys = () => idb("readonly", st => st.getAllKeys());
  async function srcsOf(at){
    if (T.srcs[at] && T.srcs[at].length) return T.srcs[at];
    const v = await idbGet(String(at)); if (Array.isArray(v) && v.length) { T.srcs[at] = v; return v; }
    return null;
  }
  setTimeout(async () => { try { const ks = await idbKeys(); if (!ks || !ks.length) return; const live = new Set(); rd().forEach(c => c.msgs.forEach(m => { if (m.files) live.add(String(m.at)); })); const dead = ks.filter(k => !live.has(String(k))); if (dead.length) idbDel(dead); } catch (e) {} }, 4000);
  function fileFrom(src){
    if (src.file) return src.file; const p = src.part;
    if (p.inline_data) { const bin = atob(p.inline_data.data), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return new File([u], src.name, {type: p.inline_data.mime_type}); }
    return new File([String(p.text || "").replace(/^Source file: [^\n]*\n\n/, "")], src.name.replace(/\.[^.]+$/, "") + ".txt", {type: "text/plain"});
  }
  const findTask = q => { q = String(q || "").trim().toLowerCase(); if (!q) return null; const open = tasksArr().filter(t => t.status !== "done"); return open.find(t => t.title.toLowerCase() === q) || open.find(t => t.title.toLowerCase().includes(q) || q.includes(t.title.toLowerCase())) || tasksArr().find(t => t.title.toLowerCase() === q) || null; };
  const ATT_IC = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5l-8.6 8.6a5.5 5.5 0 0 1-7.8-7.8l8.9-8.9a3.7 3.7 0 0 1 5.2 5.2l-8.9 8.9a1.8 1.8 0 0 1-2.6-2.6l8.2-8.2"/></svg>';
  const attHtml = () => T.att.map((a, i) => `<span class="cpt-chip"><b>${a.kind === "Image" ? "IMG" : a.kind === "PDF" ? "PDF" : a.kind === "Slides" ? "PPT" : "DOC"}</b>${esc(clip(a.name, 28))}<button type="button" data-act="cpt-att-rm" data-id="${i}" aria-label="Remove ${esc(a.name)}">&times;</button></span>`).join("");
  const drawAtt = () => { const el = $("#cptAtt"); if (el) el.innerHTML = attHtml(); };
  async function addFiles(list){
    for (const f of list) {
      if (T.att.length >= 8) { toast("That's the most I can read at once: 8 files."); break; }
      try { const sc = await aiSourceFromFile(f); sc.file = f; T.att.push(sc); drawAtt(); } catch (e) { toast((e && e.message) || "I couldn't read that file."); }
    }
  }
  const findCourse = q => { q = String(q || "").trim().toLowerCase(); if (!q) return null; return coursesArr().find(c => courseLabel(c).toLowerCase() === q || (c.code || "").toLowerCase() === q || c.name.toLowerCase() === q) || coursesArr().find(c => (c.code && q.includes(c.code.toLowerCase())) || c.name.toLowerCase().includes(q) || q.includes(c.name.toLowerCase())) || null; };
  function boardFor(name, course){
    name = String(name || "").trim(); if (!name || /^my notes$/i.test(name)) return {id: "", name: "My Notes"};
    let b = noteBoards().find(x => x.name.toLowerCase() === name.toLowerCase());
    if (!b) { b = {id: uid(), name: name.slice(0, 40), courseId: course ? course.id : ""}; state.settings = Object.assign({}, state.settings, {noteBoards: noteBoards().concat(b)}); saveSettings(); }
    return b;
  }
  function addNoteTo(boardId, text, courseId, made){
    const all = notesArr().filter(n => !n.archived && noteBoardOf(n) === boardId);
    // the same note made again by the same message (the reply's own save and the action step): the one already there
    { const tx = String(text).slice(0, 8000).trim(), dup = all.find(n => String(n.text || "").trim() === tx && Date.now() - (n.created || 0) < 8000); if (dup) return dup; }
    const z = all.reduce((m, n) => Math.max(m, n.z || 0), 0) + 1, col = all.length % 5, row = Math.floor(all.length / 5) % 4;
    const n = normNote({id: uid(), board: boardId, text: text.slice(0, 8000), color: "yellow", x: 40 + col * (NOTE_W() + 30) + Math.round(Math.random() * 20), y: 40 + row * 240 + Math.round(Math.random() * 20), z, rot: Math.round((Math.random() * 4 - 2) * 10) / 10, courseId: courseId || "", created: Date.now()});
    if (!made) {
      applyChanges([{kind: "note", id: n.id, after: n}], null);
      // "undo that" takes the note away, even after the board has placed it (an ordinary undo step keeps an item changed since)
      if (typeof undoStack !== "undefined") undoStack.push({label: "Added a note", at: Date.now(), done: false, quiet: true, undo: () => { if (state.notes[n.id]) applyChanges([{kind: "note", id: n.id, after: null}], null); return 0; }});
    }
    return n;
  }
  // photos attached in the chat with "add this to my note board": a new note on the board holding them (photos in notes are Pro)
  async function photoNote(q, att, board){
    const imgs = att.filter(x => /^image\//.test((x.part && x.part.inline_data && x.part.inline_data.mime_type) || "") || /\.(png|jpe?g|gif|webp)$/i.test(x.name || ""));
    const NP = window.__sbNotePhotos;
    if (!NP || (window.SBPRO && SBPRO.locked && SBPRO.locked())) return {answer: "Photos on notes are part of Studyboard Pro. I can turn the photo into typed notes instead: ask \"make notes from this photo\".", sources: [], followUps: [], actions: []};
    const cap = ((q.match(/\b(?:saying|that says|caption(?:ed)?|titled|called)\s+(.+)$/i) || [])[1] || "").trim();
    const b = (board && boardNamed(board)) || boardFor("", null), n = addNoteTo(b.id, cap, "");
    await NP.addPhotos(n.id, imgs.map(fileFrom));
    const ok = state.notes[n.id] && (state.notes[n.id].photos || []).length;
    if (!ok) { if (state.notes[n.id] && !cap) applyChanges([{kind: "note", id: n.id, after: null}], null); return {answer: "I couldn't save that photo to a note. Try adding it from the note itself (the photo button).", sources: [], followUps: [], actions: []}; }
    if (b.id) { ui.noteBoard = b.id; try { localStorage.setItem(NB_KEY, b.id); } catch (e) {} }
    return {answer: `Done. The photo is on a new note in ${b.name}.`, sources: [], followUps: [], actions: [{type: "open_notes", label: "Open Notes", done: "", deckName: "", deck: "", target: "", style: "", count: 0, course: "", board: b.id, noteTitle: "", text: ""}]};
  }
  async function runAction(el){
    const chats = rd(), c = chats.find(x => x.id === T.id), m = c && c.msgs.find(x => String(x.at) === el.dataset.m), a = m && m.a && m.a.actions && m.a.actions[Number(el.dataset.i)];
    if (!a || a.done) return;
    const course = findCourse(a.course), mark = txt => { a.done = txt; wr(chats); draw(); };
    try {
      if (a.type === "open_notes") { ui.tab = "notes"; render(); window.scrollTo(0, 0); return; }
      if (a.type === "note") {
        const b = boardFor(a.board, course), text = (a.noteTitle ? a.noteTitle + "\n\n" : "") + a.text;
        addNoteTo(b.id, text, course ? course.id : "");
        if (b.id) { ui.noteBoard = b.id; try { localStorage.setItem(NB_KEY, b.id); } catch (e) {} }
        mark("Saved to " + b.name); toast("Saved to " + b.name, null, {label: "Open", fn: () => { ui.tab = "notes"; render(); window.scrollTo(0, 0); }});
      } else if (a.type === "tasks") {
        const cid = course ? course.id : "";
        applyChanges(a.tasks.map(x => { const st = MILESTONE(x.type) ? x.due : addDays(x.due, -(SPAN[x.type] ?? 3)); const t = newTask({title: x.title, type: x.type, courseId: cid, due: x.due, time: x.time, start: st < todayISO() ? todayISO() : st, priority: x.type === "Exam" ? "high" : "med"}); return {kind: "task", id: t.id, after: t}; }), `Added ${a.tasks.length} task${a.tasks.length === 1 ? "" : "s"}`);
        mark(`Added ${a.tasks.length} task${a.tasks.length === 1 ? "" : "s"}`);
      } else if (a.type === "edit_tasks") {
        const ch = [], miss = [];
        a.edits.forEach(x => {
          const t = findTask(x.task); if (!t) { miss.push(x.task); return; }
          const n = clone(t);
          if (x.due) { n.due = x.due; if (n.start && n.start > n.due) n.start = n.due; }
          if (x.time) n.time = x.time;
          if (x.hours) n.hours = x.hours;
          if (x.priority) n.priority = x.priority;
          if (x.status) { n.status = x.status; n.doneAt = x.status === "done" ? Date.now() : null; }
          ch.push({kind: "task", id: t.id, after: n});
        });
        if (!ch.length) { toast("I couldn't find those tasks any more."); return; }
        applyChanges(ch, `Updated ${ch.length} task${ch.length === 1 ? "" : "s"}`);
        mark(`Updated ${ch.length} task${ch.length === 1 ? "" : "s"}${miss.length ? ", " + miss.length + " not found" : ""}`);
      } else if (a.type === "quick_add") {
        ui.tab = "board"; render(); window.scrollTo(0, 0); qaRun(a.text); mark("Opened in Quick Add");
      } else if (a.type === "syllabus") {
        const srcs = await srcsOf(m.at); if (!srcs) { toast("I can't find the file for this one any more. Attach it again."); return; }
        const sy = srcs.find(x => /syllab/i.test(x.name)) || srcs[0];
        importSheet(course ? course.id : "", fileFrom(sy)); mark("Opened the syllabus import");
      } else if (a.type === "breakdown") {
        const t = findTask(a.target); if (!t) { toast("I couldn't find that task."); return; }
        if (!window.SBBREAK) return; SBBREAK.open(t.id); mark("Opened the breakdown");
      } else if (a.type === "estimate") {
        if (!window.SBEST) return; SBEST.open(false); mark("Opened Estimate Times");
      } else if (a.type === "exam_plan") {
        const t = findTask(a.target); if (!window.SBPREP) return; SBPREP.open(t ? t.id : ""); mark("Opened the exam prep plan");
      } else if (a.type === "ask_materials") {
        askSheet(course ? course.id : ""); mark("Opened Ask Your Course Materials");
      } else if (a.type === "summarize_file") {
        const q = a.target.toLowerCase(), f = Object.values(state.files).find(x => x.kind === "file" && x.name.toLowerCase() === q) || Object.values(state.files).find(x => x.kind === "file" && x.name.toLowerCase().includes(q));
        if (!f) { toast("I couldn't find that file in Files."); return; }
        summarizeFile(f.id); mark("Summarizing " + f.name);
      } else if (a.type === "save_file") {
        const srcs = await srcsOf(m.at); if (!srcs) { toast("I can't find the file for this one any more. Attach it again."); return; }
        await uploadFiles(srcs.map(fileFrom), {courseId: course ? course.id : "", folderId: ""}); mark(`Saved ${srcs.length} file${srcs.length === 1 ? "" : "s"} to Files`);
      } else {
        let srcs = await srcsOf(m.at);
        if (!srcs) srcs = a.text.length >= 80 ? [{name: a.deckName || "Chat material", kind: "Text", size: a.text.length, part: {text: a.text}}] : null;
        if (!srcs) { toast("I can't find the file for this one any more. Attach it again and ask once more."); return; }
        if (!aiOk()) { aiSetupSheet(false); return; }
        el.disabled = true; const was = el.textContent; el.textContent = "Working…";
        try {
          const r = await aiMakeStudySet({sources: srcs, style: a.style, difficulty: "mixed", cards: a.type === "flashcards", quiz: a.type === "quiz", cases: a.type === "case_study", caseCount: "1", caseStyle: "auto",
            cardCount: a.type === "flashcards" && a.count ? String(a.count) : "auto", quizCount: a.type === "quiz" && a.count ? String(a.count) : "10", courseName: course ? course.name : ""}, s => { el.textContent = clip(s, 28); });
          const cards = r.cards.filter(x => !x.check && x.front.trim() && x.back.trim()), qs = r.questions.filter(x => !x.check), cs = r.cases || [];
          if (!cards.length && !qs.length && !cs.length) throw new Error("I couldn't make anything from that. Try a PDF version, or tell me what to focus on.");
          const ex = a.deck && decksArr().find(x => x.name.toLowerCase() === a.deck.toLowerCase());
          const d = ex ? clone(ex) : normDeck({id: uid(), created: Date.now(), name: (a.deckName || r.title || srcs[0].name.replace(/\.[^.]+$/, "") || "Study Set").slice(0, 80), courseId: course ? course.id : ""});
          d.cards = d.cards.concat(cards.map(x => ({id: uid(), front: x.front.trim(), back: x.back.trim(), box: 0, due: "", seen: 0, right: 0, wrong: 0, ai: true, src: x.source || ""})));
          const names = srcs.map(x => x.name);
          if (qs.length) d.aiQuizzes = (d.aiQuizzes || []).concat({id: uid(), title: r.quizTitle || a.deckName || "Practice Quiz", style: a.style || "", created: Date.now(), sources: names, questions: qs, results: []});
          cs.forEach(x => { d.aiQuizzes = (d.aiQuizzes || []).concat(Object.assign({id: uid(), style: a.style || "", created: Date.now(), sources: names, results: [], kind: "case"}, x)); });
          if (a.style) d.aiStyle = a.style;
          d.updated = Date.now();
          const what = [cards.length ? cards.length + " card" + (cards.length === 1 ? "" : "s") : "", qs.length ? "a " + qs.length + "-question quiz" : "", cs.length ? cs.length + " case stud" + (cs.length === 1 ? "y" : "ies") : ""].filter(Boolean).join(" and ");
          a.deckId = d.id; saveDeck(d, `Saved ${what} to ${d.name}`);
          mark(`Saved ${what} to "${d.name}"`);
        } finally { el.disabled = false; el.textContent = was; }
      }
    } catch (e) { console.warn("companion action", e); toast((e && e.message) || "That didn't work. Try again?"); }
  }
  function chatHtml(){
    const ready = aiOk();
    const gate = inPreview() ? `<div class="cpt-gate"><p class="mini" style="margin:0">Chat works in the Studyboard app and on your own Studyboard website. There's nothing to set up in this preview.</p></div>`
      : !ready ? `<div class="cpt-gate"><p style="margin:0"><b>Chat needs AI.</b> ${typeof aiProUser === "function" && aiProUser() ? "Set up AI to chat: Studyboard AI Pro comes with your Pro plan." : typeof aiOwnPaidOk === "function" && aiOwnPaidOk() ? "Set up AI to chat: a free Google Gemini key, Claude, ChatGPT, or Studyboard AI Pro with Pro." : "Set up AI to chat: a free Google Gemini key, or Studyboard AI Pro with Pro."}</p><button type="button" class="btn primary small" data-act="ai-setup">Set Up AI</button></div>` : "";
    return `${gate}<div class="cpt-log" id="cptLog">${logHtml()}</div><div class="sr" id="cptSay" aria-live="polite"></div>
      <div class="cpt-att" id="cptAtt">${attHtml()}</div>
      <form class="cpt-form" data-cpt-form><button type="button" class="btn cpt-attach" data-act="cpt-attach" aria-label="Add attachment" title="Attach slides, a PDF, a document or photos" ${ready ? "" : "disabled"}>${ATT_IC}</button><textarea id="cptIn" rows="1" maxlength="1000" ${(info() || {}).name ? phPh("Ask " + info().name + " anything, or attach slides or photos…", "Ask " + info().name + " anything…") : phPh("Ask anything, or attach slides or photos…", "Ask anything…")} aria-label="Your question" ${ready ? "" : "disabled"}>${esc(T.draft || "")}</textarea><button type="submit" class="btn primary ai-btn cp-ask-go" id="cptGo" ${ready && !T.busy ? "" : "disabled"}>Ask</button></form>
      <input type="file" id="cptFile" multiple accept=".pdf,.pptx,.docx,.xlsx,.txt,.md,.csv,.png,.jpg,.jpeg,.webp,.heic,application/pdf,image/*,text/plain" class="sr" tabindex="-1" aria-hidden="true">
      <p class="mini cpt-priv">${esc((info() || {}).name || "Your companion")} is an AI and can get things wrong. Each question sends only the planner parts it needs, plus attachments, to your AI provider. ${T.id ? `<button type="button" class="link-btn" data-act="cpt-new">New Chat</button>` : ""}</p>`;
  }
  function historyHtml(){
    const chats = rd();
    if (!chats.length) return `<div class="empty"><strong>No Chats Yet</strong>Your chats with your companion are kept here, and the newest ones sync to your other devices.<br><button type="button" class="btn primary small" data-act="cpt-tab" data-id="chat" style="margin-top:10px">Start a Chat</button></div>`;
    return `<ul class="cpt-hist">${chats.map(c => { const last = c.msgs[c.msgs.length - 1], a = last && last.a ? last.a.answer : ""; return `<li class="cpt-h"><button type="button" class="cpt-hmain" data-act="cpt-open" data-id="${esc(c.id)}"><b>${esc(c.title)}</b><span class="mini">${esc(clip(a, 110))}</span><span class="mini">${esc(new Date(c.at).toLocaleDateString(undefined, {month: "short", day: "numeric"}))} · ${c.msgs.length} message${c.msgs.length === 1 ? "" : "s"}</span></button><button type="button" class="icon-btn sm" data-act="cpt-del" data-id="${esc(c.id)}" aria-label="Delete this chat" title="Delete">${CLOSE}</button></li>`; }).join("")}</ul>
      <div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="btn small" data-act="cpt-clear">Delete All Chats</button><span class="mini" style="align-self:center">Chats are kept on this device and the newest ones sync to your other devices.</span></div>`;
  }
  function view(){
    const me = info(), tab = ["chat", "history", "wardrobe"].includes(T.tab) ? T.tab : "chat";
    const area = window.SBAREA ? SBAREA.label() : "";
    const wc = (SBCOMP.wearColor && SBCOMP.wearColor()) || "#E5604D", worn = SBCOMP.wornNames ? SBCOMP.wornNames() : [];
    const meta = [worn.length ? "Wearing " + worn.join(" and ") : "", area ? "Studying " + area : ""].filter(Boolean).join(" · ");
    const head = me ? `<div class="cpt-head cpt3" style="--c:var(--accent-band,var(--accent))" data-wear="${esc(wc)}"><div class="cpt3-band"><div class="cpt3-acts"><button type="button" class="btn cpt-dress" data-act="comp-change">Change</button></div></div>
        <div class="cpt3-mini sm-skip" aria-hidden="true">${AI_ICON}<b>${esc(me.name)}</b></div>
        <div class="cpt3-ring">${SBCOMP.tab.faceHtml(104)}</div>
        <div class="cpt-id"><h2>${esc(me.name)}</h2>${me.bio ? `<p class="cpt-bio">${esc(me.bio)}</p>` : ""}${meta ? `<span class="mini">${esc(meta)}</span>` : ""}</div>`
      : `<div class="cpt-head"><div class="cpt-id"><h2>Companion</h2><p class="mini">Your companion is turned off. Turn it on to chat and to see it beside the Add Task button.</p></div><div class="cpt-hbtn"><label class="anim-tog"><input type="checkbox" data-act="comp-set" data-key="on"> On</label></div>`;
    const tabs = `<div class="cpt3-tabs" role="tablist" aria-label="Companion">${[["chat", "Chat"], ["history", "History"]].concat(me ? [["wardrobe", "Wardrobe"]] : []).map(([k, l]) => `<button type="button" role="tab" data-act="cpt-tab" data-id="${k}" aria-selected="${tab === k}">${l}</button>`).join("")}</div>`;
    const pane = tab === "chat" ? chatHtml() : tab === "history" ? historyHtml() : `<section class="cpt3-ward">${SBCOMP.wardrobe()}</section>`;
    return `<section class="cpt" aria-label="Companion">${head}${tabs}</div><div class="cpt-pane">${pane}</div></section>`;
  }
  VIEWS.companion = view;

  // a step that takes a while shows its seconds counting ("Working out what to do… 12s"), so it never looks stuck
  function drawStatus(){ const s = $("#cptStatus"); if (!s) return; const st = T.status || "Thinking…";
    if (st !== T.stWas) { T.stWas = st; T.stAt = Date.now(); }
    const secs = Math.floor((Date.now() - (T.stAt || Date.now())) / 1000);
    s.textContent = T.live || (secs >= 4 ? `${st} ${secs}s` : st); s.classList.toggle("cpt-live", !!T.live); }
  function draw(){
    if (ui.tab !== "companion") return;
    // (the chat is open: the stronger on-device AI starts loading now, before anything is asked)
    if (typeof e4bWarm === "function") try { e4bWarm(); } catch (e) {}
    const log = $("#cptLog");
    if (!log || T.tab !== "chat") { render(); return; }
    log.innerHTML = logHtml(); say();
    const go = $("#cptGo"); if (go) go.disabled = !aiOk() || !!T.busy;
    toLatest(log); requestAnimationFrame(() => { if (log.isConnected) toLatest(log); });
  }
  // Screen readers hear only the newest reply (the chat log itself is redrawn whole, so it can't be a live region)
  function say(){
    const el = $("#cptSay"), c = rd().find(x => x.id === T.id), m = c && c.msgs[c.msgs.length - 1];
    if (!el || !m || T.busy || !T.say) return;
    T.say = false;
    el.textContent = m.err ? String(m.err) : String((m.a && m.a.answer) || "").replace(/[*_`#>|]+/g, "").replace(/\s+/g, " ").trim().slice(0, 1500);
  }
  // A new answer opens at its start (its question at the top), not at its last line; while thinking, the bottom shows
  function toLatest(log){
    const qs = log.querySelectorAll(".cpt-q"), q = qs[qs.length - 1];
    if (!q || T.busy) { log.scrollTop = log.scrollHeight; return; }
    log.scrollTop = Math.max(0, log.scrollTop + q.getBoundingClientRect().top - log.getBoundingClientRect().top - 10);
  }
  hook("render", tab => {
    if (tab !== "companion") { try { SBCOMP.tab.stopPreviews(); } catch (e) {} return; }
    const root = $(".cpt"); if (!root) return;
    try { SBCOMP.tab.wirePreviews(root); } catch (e) { console.warn("companion tab", e); }
    // The chat jumps to the newest answer only when something new arrived (another chat, a new message, thinking started or
    // ended). Any other redraw keeps where you'd scrolled to: redraws for other reasons (a sync, a theme's scene) kept pulling
    // the chat back down while you scrolled up. While an answer is being written, it follows along if you're at the bottom.
    const log = $("#cptLog");
    if (log) {
      const c = rd().find(x => x.id === T.id), m = c && c.msgs[c.msgs.length - 1];
      const sig = [T.id, c ? c.msgs.length : 0, T.busy ? 1 : 0, m && m.err ? 1 : 0].join(":");
      const fresh = sig !== T.logSig || T.logTop == null;
      const place = () => { if (!log.isConnected) return; if (fresh || (T.busy && T.logEnd)) toLatest(log); else log.scrollTop = T.logTop; };
      T.logSig = sig; place(); requestAnimationFrame(place);
      const keep = () => { T.logTop = log.scrollTop; T.logEnd = log.scrollHeight - log.scrollTop - log.clientHeight < 40; };
      keep(); requestAnimationFrame(keep);
      log.addEventListener("scroll", keep, {passive: true});
    }
    const cin = $("#cptIn"); if (cin && cin.value) cptGrow(cin);
  });

  /* Actions */
  hook("act", (act, el, id) => {
    switch (act) {
      case "cpt-tab": T.tab = id; render(); return true;
      case "cpt-attach": { const f = $("#cptFile"); if (f) f.click(); return true; }
      case "cpt-att-rm": T.att.splice(Number(id), 1); drawAtt(); return true;
      case "cpt-do": runAction(el); return true;
      case "cpt-show": case "cpt-change": {
        const chats = rd(), c = chats.find(x => x.id === T.id), m = c && c.msgs.find(x => String(x.at) === el.dataset.m);
        if (!m || !m.a || !window.SBASSIST) return true;
        if (act === "cpt-show") { const t = (m.a.show || [])[Number(el.dataset.i) || 0]; if (t) SBASSIST.jump(t, {open: true}); return true; }
        if ((m.a.changes || []).length && m.a.changes.every(x => x.t && x.t.kind === "newtask")) {
          const n = SBASSIST.addNow(m.a.changes); m.a.changesDone = n ? `Added ${n === 1 ? "to your board" : n + " tasks"}` : "Already added"; wr(chats); draw();
          if (n) toast(n === 1 ? "Task added" : `Added ${n} tasks`, null, {label: "Open", fn: () => { ui.tab = "board"; render(); window.scrollTo(0, 0); }});
          return true;
        }
        SBASSIST.propose(m.a.changes || []).then(ok => { if (!ok) return; const all = rd(), cc = all.find(x => x.id === T.id), mm = cc && cc.msgs.find(x => String(x.at) === el.dataset.m); if (mm && mm.a) { mm.a.changesDone = "Reviewed"; wr(all); } });
        return true;
      }
      case "cpt-open-map": {
        const chats = rd(), c = chats.find(x => x.id === T.id), m = c && c.msgs.find(x => String(x.at) === el.dataset.m), o = m && m.a && m.a.mapOpen;
        if (o && window.SBCMAP) SBCMAP.open("course", o.course, o.map);
        return true;
      }
      case "cpt-open-deck": ui.tab = "flashcards"; ui.fc = null; ui.deckId = id; render(); window.scrollTo(0, 0); return true;
      case "cpt-ask": T.tab = "chat"; if (ui.tab === "companion") ask(el.dataset.q); return true;
      case "cpt-new": T.id = null; T.draft = ""; T.tab = "chat"; render(); setTimeout(() => { const i = $("#cptIn"); if (i) i.focus(); }, 30); return true;
      case "cpt-open": T.id = id; T.tab = "chat"; render(); return true;
      case "cpt-del": { const gone = rd().find(c => c.id === id); if (gone) idbDel(gone.msgs.filter(m => m.files).map(m => String(m.at))); const a = rd().filter(c => c.id !== id); wr(a); if (T.id === id) T.id = null; render(); return true; }
      case "cpt-clear": askBox({title: "Delete All Chats?", text: "All your chats with your companion are deleted. This can't be undone.", yes: "Delete All", danger: true}).then(yes => { if (!yes) return; idbKeys().then(ks => ks && ks.length && idbDel(ks)); wr([]); T.id = null; render(); }); return true;
      case "cpt-note": {
        const c = rd().find(x => x.id === T.id), m = c && c.msgs.find(x => String(x.at) === id);
        if (!m || !m.a) return true;
        const text = `${m.q}\n\n${m.a.answer}`.slice(0, 8000), done = board => { addNoteText(text, "", "green", Object.assign({src: "chat"}, board == null ? {} : {board})); el.textContent = "Saved to Notes"; el.disabled = true; };
        if (!noteBoards().length) { done(); return true; }
        T.pendingNote = done;
        openSheet(`<div class="sheet">${head("Save to Which Board?")}<div class="sheet-body"><div class="row-actions" style="flex-wrap:wrap">${[["", "My Notes"]].concat(noteBoards().map(b => [b.id, b.name])).map(([bid, nm]) => `<button type="button" class="btn${bid === noteBoardId() ? " primary" : ""}" data-act="cpt-note-to" data-id="${esc(bid)}">${esc(nm)}</button>`).join("")}</div></div></div>`);
        return true;
      }
      case "cpt-note-to": { const f = T.pendingNote; T.pendingNote = null; const dd = el.closest("dialog") || dlg; dd.close(); if (f) f(id); return true; }
      case "comp-pick": case "comp-wear": case "comp-tint": case "comp-rename": case "comp-set":
        if (ui.tab === "companion") setTimeout(() => { if (ui.tab === "companion") render(); }, 60);
        return false;
    }
    return false;
  });
  document.addEventListener("change", e => { if (e.target.id === "cptFile") { const l = [...e.target.files]; e.target.value = ""; addFiles(l); } });
  document.addEventListener("paste", e => { if (e.target.id !== "cptIn") return; const l = [...((e.clipboardData && e.clipboardData.files) || [])]; if (l.length) { e.preventDefault(); addFiles(l); } });
  document.addEventListener("dragover", e => { if (e.target.closest && e.target.closest(".cpt") && e.dataTransfer && [...(e.dataTransfer.types || [])].includes("Files")) e.preventDefault(); });
  document.addEventListener("drop", e => { if (e.target.closest && e.target.closest(".cpt") && e.dataTransfer && e.dataTransfer.files.length) { e.preventDefault(); addFiles([...e.dataTransfer.files]); } });
  document.addEventListener("submit", e => { const f = e.target.closest && e.target.closest("[data-cpt-form]"); if (!f) return; e.preventDefault(); const i = $("#cptIn"); if (i) ask(i.value); });
  document.addEventListener("keydown", e => { if (e.target.id === "cptIn" && e.key === "Enter" && !e.shiftKey && !e.isComposing) { e.preventDefault(); ask(e.target.value); } });
  const cptGrow = t => { t.style.height = "auto"; t.style.height = Math.min(t.scrollHeight, 9 * parseFloat(getComputedStyle(t).fontSize)) + "px"; };
  document.addEventListener("input", e => { if (e.target.id === "cptIn") { T.draft = e.target.value; cptGrow(e.target); } });
  // Anywhere else in the app
  // (from Ask's own steps too: the chat on screen, so "it", "rename it", "the deck" mean what it was just about)
  window.SBCOMPTAB = {intent: (q, att) => intentAct(q, (() => { try { return ui.tab === "companion" || T.busy ? rd().find(x => x.id === T.id) || null : null; } catch (e) { return null; } })(), att || []), self: q => { try { return selfAnswer(q); } catch (e) { return ""; } }, open: q => { try { if (window.SBSEARCH && SBSEARCH.warm) SBSEARCH.warm(); } catch (e) {} ui.tab = "companion"; ui.courseId = null; T.tab = "chat"; render(); window.scrollTo(0, 0); if (q) ask(q); }, chats: rd};

  const st = document.createElement("style");
  st.textContent = `.cpt{display:grid;gap:12px;max-width:860px;margin:0 auto}
.cpt-head{display:flex;align-items:center;gap:14px;flex-wrap:wrap;padding:14px;border:1px solid var(--line);border-radius:16px;background:var(--surface)}
.cpt-face{flex:none;width:104px;height:104px;display:grid;place-items:center}
.cpt-id{flex:1 1 220px;min-width:0;display:grid;gap:3px}
.cpt-id h2{margin:0;font:800 1.85rem/1.15 var(--display)}
.cpt-id p{margin:0}
.cpt-bio{font-size:1rem;line-height:1.4;color:var(--ink);opacity:.85}
.cpt-tabs{max-width:none}
.cpt-dress{min-height:46px;padding:11px 20px;font-size:1rem}
.cpt-pane{display:grid;gap:10px}
.cpt-log{display:grid;gap:10px;align-content:start;min-height:260px;max-height:min(56vh,560px);overflow:auto;padding:12px;border:1px solid var(--line);border-radius:16px;background:var(--surface)}
.cpt-q{justify-self:end;max-width:86%;background:var(--accent);color:var(--accent-ink,#fff);padding:8px 13px;border-radius:16px 16px 4px 16px;font-size:.95rem;white-space:pre-wrap;overflow-wrap:anywhere}
.cpt-a{justify-self:start;max-width:92%;background:var(--soft);padding:9px 14px;border-radius:16px 16px 16px 4px;font-size:.95rem;overflow-wrap:anywhere}
.cpt-a p{margin:0 0 6px}.cpt-a p:last-child{margin:0}.cpt-a ul{margin:4px 0 6px;padding-left:20px}
.cpt-src,.cpt-chips{display:flex;gap:6px;flex-wrap:wrap;margin-top:6px}
.cpt-srcd{margin-top:8px}
.cpt-srcd>summary{display:inline-flex;align-items:center;gap:6px;min-height:32px;cursor:pointer;list-style:none;font:600 .82rem var(--sans,inherit);color:var(--muted);border-radius:8px}
.cpt-srcd>summary::-webkit-details-marker{display:none}
.cpt-srcd>summary::after{content:"";width:7px;height:7px;border-right:2px solid currentColor;border-bottom:2px solid currentColor;transform:translateY(-2px) rotate(45deg);transition:transform .2s ease}
.cpt-srcd[open]>summary::after{transform:translateY(1px) rotate(-135deg)}
.cpt-srcd .cpt-src{margin-top:4px}
.cpt-chips.fu{margin-top:2px}
.cpt-acts{margin-top:4px;display:flex;gap:16px;flex-wrap:wrap}
.cpt-empty{display:grid;gap:10px;align-content:center;min-height:220px;text-align:center;justify-items:center}
.cpt-empty p{margin:0;max-width:44ch}
.cpt-empty .cpt-chips{justify-content:center}
.cpt-form{display:flex;gap:8px;align-items:flex-end}
.cpt-form textarea{flex:1;min-height:44px;max-height:9em;resize:none;border-radius:14px;line-height:1.35;overflow-y:auto}
/* The hint stays on one line on a narrow phone (cut with … rather than wrapping in half) */
.cpt-form textarea::placeholder{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cpt-form .btn{min-height:44px}
.cpt-manage{display:grid;gap:12px;padding:14px;border:1px solid var(--line);border-radius:16px;background:var(--surface);color:var(--ink);box-shadow:var(--shadow)}
.cpt-manage .mini,.cpt-manage .sub{color:var(--ink);opacity:.8}
.cpt-priv{margin:0}
.cpt-attach{min-height:44px;min-width:44px;padding:0;display:grid;place-items:center;flex:none}
.cpt-att{display:flex;flex-wrap:wrap;gap:6px}
.cpt-att:empty{display:none}
.cpt-chip{display:inline-flex;align-items:center;gap:6px;padding:4px 6px 4px 8px;border:1px solid var(--line);border-radius:999px;background:var(--surface);font-size:.85rem}
.cpt-chip b{font:700 .65rem var(--display);color:var(--accent)}
.cpt-chip button{border:0;background:none;color:var(--muted);font-size:1.1rem;line-height:1;padding:0 4px;cursor:pointer}
.cpt-qf{display:flex;flex-wrap:wrap;gap:4px;margin-top:6px}
.cpt-qf span{font-size:.75rem;padding:2px 8px;border-radius:999px;background:rgba(255,255,255,.22)}
.cpt-actions{display:grid;gap:6px;margin-top:8px}
.cpt-action{display:flex;align-items:center;gap:10px;justify-content:space-between;padding:8px 10px;border:1px solid var(--line);border-radius:12px;background:var(--surface)}
.cpt-action-t{font-weight:600;font-size:.9rem;min-width:0;overflow-wrap:anywhere}
.cpt-done{color:var(--leaf,#1E9E74);font-weight:600}
.cpt-gate{display:flex;gap:12px;align-items:center;flex-wrap:wrap;padding:12px 14px;border:1px solid var(--line);border-radius:14px;background:color-mix(in srgb,var(--accent) 8%,var(--surface))}
.cpt-gate p{flex:1 1 240px}
.cpt-err{display:grid;gap:8px;font-size:.92rem}
.cpt-err.cpt-banner{padding:10px 12px;border:1px solid color-mix(in srgb,var(--late) 45%,var(--line));border-radius:12px;background:color-mix(in srgb,var(--late) 9%,var(--surface))}
.cpt-err.cpt-banner .btn{justify-self:start}
.cpt-hist{list-style:none;margin:0;padding:0;display:grid;gap:8px}
.cpt-h{display:flex;align-items:stretch;gap:6px;border:1px solid var(--line);border-radius:14px;background:var(--surface);padding:2px 6px 2px 0}
.cpt-hmain{flex:1;min-width:0;border:0;background:none;color:var(--ink);text-align:left;display:grid;gap:2px;padding:10px 12px;cursor:pointer}
.cpt-hmain b{font:700 .95rem var(--display);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.cpt-manage{display:grid;gap:10px}
@media (max-width:600px){.cpt-head{padding:12px}.cpt-face{width:84px;height:84px}.cpt-q,.cpt-a{max-width:96%}.cpt-log{max-height:50vh}}`;
  document.head.appendChild(st);
})();


