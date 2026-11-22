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
        if (!N.schedule) return `- ${courseLabel(c)}: ${c.name}`;
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
      const picked = notes.map(n => ({n, s: hits(n.text, ws) + (courseOf(n.courseId) ? hits(courseOf(n.courseId).name + " " + (courseOf(n.courseId).code || ""), ws) : 0)})).filter(x => x.s > 0 || generic)
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
    const sr = sec("SEARCH RESULTS");
    if (!L.length && sr) (sr.match(/\[\d+\] [^\n]*\n[^\n]*/g) || []).slice(0, 4).forEach((x, i) => {
      const d = rows[i] && rows[i].doc, tk = d && d.type === "task" && state.tasks[d.id];
      if (tk) { L.push("- " + LOCAL.taskLine(tk)); return; }
      const [h, b] = x.split("\n"), head = h.replace(/^\[\d+\] /, "").trim(), title = head.replace(/^[^:]{1,24}: /, "");
      // the body starts with the title again: once is enough
      const body = String(b || "").startsWith(title) ? String(b).slice(title.length).replace(/^[\s:·,.-]+/, "") : String(b || "");
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
  const NOTE_Q = /\b(save|make|write|add|create|put)\b[^?]*\bnote\b/i;
  const CHANGE_Q = /^\s*(please\s+)?((can|could|would) you\s+)?(please\s+)?(add|create|make|remind|schedule|start|set|move|change|reschedule|push|rename|delete|remove|mark|cancel|skip|put)\b/i;
  /* A concept map asked for in the chat: built right away (the sentences are read in code; just a topic goes to the AI), then an
     Open Map button. "Do it", "make it" after an earlier ask runs that ask. Any AI, not only the device. */
  const MAP_Q = /\b(concept|mind|idea)[ -]?maps?\b|\bmap (of|about|for|with|where)\b|\bmap\b[^?]*\b(in the (center|middle)|main idea|connected to|linked to)\b/i;
  const MAP_ASK = /\b(make|create|build|draw|generate|give me|i want|i need|can you|could you|put|add|start|set up)\b|^\s*(a|an|my)\b|\b(in the (center|middle)|main idea is|connected to|linked to)\b/i;
  const DOIT_Q = /^\s*(ok(ay)?|yes|yeah|yep|sure|please|go ahead|go|do it|do that|make it|make that|create it|build it|just do it|now)\b[^?]{0,40}$|^\s*(can|could|will|would) you (just )?(make|do|create|build|draw|put) (it|that|this|one)\b/i;
  async function mapAct(q){
    if (!window.SBCMAP || !SBCMAP.createFrom) return null;
    const course = (q.match(/\b(?:in|for|under|to) (?:my )?([A-Z][\w&.-]*(?: [A-Z0-9][\w&.-]*){0,3})(?: course| class)?\b/) || [])[1] || "";
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
  async function deviceAct(q, chat, forced){
    const A = window.SBASSIST, TR = window.SBTRUTH; if (!A) return null;
    if (CARDS_Q.test(q)) {
      const quiz = /\bquiz|test me|practice (questions|test)\b/i.test(q) && !/flash ?cards?|cards/i.test(q), n = Number((q.match(/\b(\d{1,2})\b/) || [])[1]) || 0;
      const topic = clip((q.match(/\b(?:on|about|for|from|covering|over)\s+(.+?)[?.!]*$/i) || [])[1] || q.replace(CARDS_Q, "").replace(/^\W+|\W+$/g, ""), 80);
      let text = "", from = "";
      try { const R = window.SBSEARCH ? await SBSEARCH.retrieve(topic || q, {max: 8, chars: 1200, wait: 800, readWait: 2, semWait: 2500}) : null; if (R && R.text && R.text.length > 300) { text = R.text.replace(/^\[\d+\] [^\n]*\n/gm, ""); from = "your notes"; } } catch (e) {}
      if (!text && TR && topic) { const W = await TR.research(topic).catch(() => ({list: []})); if (W.list && W.list.length) { text = W.list.map(x => `${x.title}\n${x.text}`).join("\n\n"); from = W.list.some(x => /paper/i.test(x.src || "")) ? "Wikipedia and research papers" : "Wikipedia"; } }
      if (text.length < 120) return forced ? null : {answer: `I couldn't find material on ${topic || "that"} in your notes or on the web. Add notes or a file about it (or attach one here), and I'll make ${quiz ? "a quiz" : "flashcards"} from it.`, sources: [], followUps: [], actions: []};
      const name = (topic || "Study Set").replace(/\b\w/g, ch => ch.toUpperCase()).slice(0, 60);
      return {answer: `I gathered material on ${topic || "that"} from ${from}. Tap ${quiz ? "Make Quiz" : "Make Flashcards"} and I'll make ${n ? n + " " : ""}${quiz ? "practice questions" : "cards"} from it.`, sources: [from === "your notes" ? "Your notes" : from], followUps: [],
        actions: [{type: quiz ? "quiz" : "flashcards", label: quiz ? "Make Quiz" : "Make Flashcards", deckName: name, deck: "", target: "", style: "", count: n, course: "", board: "", noteTitle: "", text: text.slice(0, 12000)}]};
    }
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
    if (CHANGE_Q.test(q) || (A.timerMins && A.timerMins(q))) {
      const res = await A.ask(q, {screen: false});
      if (!res || (!(res.changes || []).length && !res.timer && !forced && A.CLAIMS.test(res.answer || ""))) return null;
      const pk = A.pack(res);
      return {answer: res.answer, sources: [], followUps: [], actions: [], changes: pk.changes.length ? pk.changes : undefined, show: pk.show.length ? pk.show : undefined};
    }
    return null;
  }
  // "What are you wearing?", "what accessories do you have on?", "who are you?", "what are you?", "what's your name?"
  function selfAnswer(q){
    const t = String(q || "").toLowerCase().replace(/[?!.]+$/, ""), me = info(); if (!me) return "";
    const worn = SBCOMP.wornNames ? SBCOMP.wornNames() : [], list = worn.length > 1 ? worn.slice(0, -1).join(", ") + " and " + worn[worn.length - 1] : worn[0] || "";
    const a = /^(an?|the)\s/i.test(me.kind) ? me.kind : /^[aeiou]/i.test(me.kind) ? "an " + me.kind : "a " + me.kind;
    if (/\b(wearing|wear|have on|got on|accessor(y|ies)|outfit|dressed|hat|glasses|on your (head|face))\b/.test(t) && /\b(you|your|u|ur)\b/.test(t))
      return worn.length ? `I'm wearing my ${list}.${me.kind ? ` (I'm ${a.toLowerCase()} myself!)` : ""} You can change my look in the Wardrobe.` : `Nothing right now! You can pick accessories for me in the Wardrobe.`;
    if (/\b(what('?s| is) your name|who are (you|u)|what are (you|u)|what kind of (thing|creature|companion|animal) are (you|u)|tell me about (yourself|you)|introduce yourself)\b/.test(t))
      return `I'm ${me.name}${me.kind ? `, ${a.toLowerCase()}` : ""}, your study companion.${me.bio ? " " + me.bio : ""}${worn.length ? ` Right now I'm wearing my ${list}.` : ""}`;
    return "";
  }
  const CHAT_MAX = 100000;
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
    let m = {q, at: Date.now()};
    if (att.length) { m.files = att.map(x => clip(x.name, 50)); T.srcs[m.at] = att; idbPut(String(m.at), att.map(x => ({name: x.name, kind: x.kind, size: x.size, part: x.part}))); }
    // no reply may keep the chat busy for good: past CHAT_MAX it's given up on (it's dropped if it comes later) and the chat is free again
    const work = (async () => {
    try {
      // the AI on the device (98-truth.js): planner facts from the app itself, exact; other answers checked against what it was given
      // stop, pause or resume the timer, or undo the last change: done at once, with no AI (98-assist.js), on any engine
      const ctl = !att.length && window.SBASSIST && SBASSIST.control ? SBASSIST.control(q) : null, me0 = !ctl && !att.length ? selfAnswer(q) : "";
      const dev = typeof aiOnDevice === "function" && aiOnDevice(), TR = window.SBTRUTH, quick = dev && TR && !att.length && !ctl && !me0 ? TR.facts(q) : null;
      // asked to make or change something: the app does it (or offers it to confirm), so it can't just be talked about
      const was = !att.length ? pendingAsk(q, c) : "", q2 = was || q;
      let made = null;
      // about the companion itself (its name, what it is, what it's wearing): from its real settings, never made up
      if (ctl) made = {answer: ctl.answer, sources: [], followUps: [], actions: []};
      else if (!att.length) { const me = me0 || selfAnswer(q2); if (me) made = {answer: me, sources: [], followUps: [], actions: []}; }
      if (att.length && att.some(x => /^image\//.test((x.part && x.part.inline_data && x.part.inline_data.mime_type) || "") || /\.(png|jpe?g|gif|webp)$/i.test(x.name || "")) && /\b(add|put|save|pin|stick|place|attach)\b[^?]*\b(note|notes|board)\b/i.test(q)) made = await photoNote(q, att);
      if (!quick && !made && !att.length && MAP_Q.test(q2) && MAP_ASK.test(q2)) { T.status = "Making your map…"; draw(); made = await mapAct(q2); }
      if (!quick && !made && !att.length && window.SBASSIST && SBASSIST.findNotes) { const fn = await SBASSIST.findNotes(q2).catch(() => null); if (fn) made = {answer: fn.answer, sources: fn.show && fn.show.length ? ["Your notes"] : [], followUps: [], actions: [], show: fn.show && fn.show.length ? SBASSIST.pack(fn).show : undefined}; }
      if (!quick && !made && dev && !att.length) made = await deviceAct(q2, c, !!was);
      // a question about the subject (on the device): the same answer as Ask's, from their own material first, then the web
      if (!quick && !made && dev && !att.length && TR && TR.general(q2) && !(window.SBASSIST && SBASSIST.appQ(q2))) {
        T.status = "Looking through your notes…"; draw();
        const k = await TR.knowledge(q2, {onStatus: x => { T.status = x; draw(); }});
        made = {answer: k.answer, sources: k.found ? [...(k.notesSrc || []).slice(0, 3), ...(k.sources || []).map(x => x.src + ": " + x.title)].map(x => clip(x, 40)).slice(0, 5) : [], followUps: [], actions: []};
      }
      if (quick) m.a = {answer: quick.answer, sources: ["Your planner"], followUps: [], actions: []};
      else if (made) m.a = made;
      else {
      const me = info() || {}, prevQ = (c.msgs.filter(x => x.a).slice(-1)[0] || {}).q || "";
      const [ctx, cat] = await Promise.all([context(q, prevQ, att.length > 0), window.SBASSIST && SBASSIST.wants(q) ? SBASSIST.catalog(q, {max: typeof aiOnDevice === "function" && aiOnDevice() ? 8000 : 30000}).catch(e => { console.warn(e); return null; }) : null]);
      // a general question on the device: Wikipedia as a source, then the key points a good answer covers, so it isn't shallow
      let plan = "";
      if (dev && TR && !att.length && TR.general(q)) {
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
      const hist = c.msgs.filter(x => x.a).slice(-6).map(x => `Student: ${x.q}\n${me.name || "Companion"}: ${clip(x.a.answer, 1200)}`).join("\n\n");
      const system = `You are ${me.name || "a study companion"}${me.kind ? ", a " + me.kind : ""}, the student's friendly study companion living inside their Studyboard planner. ${me.bio ? "About you: " + clip(me.bio, 160) + " " : ""}${me.kind ? `You are ${me.kind.toLowerCase()} yourself (you don't wear or carry one). ` : ""}${(SBCOMP.wornNames ? SBCOMP.wornNames() : []).length ? `You're wearing: ${SBCOMP.wornNames().join(", ")}. ` : "You're wearing no accessories. "}Speak warmly and briefly, like a supportive study buddy. No emojis. Answer from the student's own data below whenever the question is about their work, courses, deadlines, grades, notes, flashcards or files. Only the parts of the planner this question needs are sent, and each part that is sent is complete: MARKED WORK lists every mark entered (each assignment, quiz and exam, with its percentage), OPEN TASKS lists every open task, and TODAY'S PLAN is Studyboard's own priority order. Read the answer straight from it: for "best" or "lowest" marks compare the percentages in MARKED WORK, for "what should I do now/next" answer with DO THIS NEXT; for "what after today's plan" or "once I finish today's tasks" answer with item 1 under THEN, AFTER TODAY'S PLAN IS DONE; for "what comes after X" find X in that list and give the next item (and so on down the list), never a task that is already on today's plan, and never your own ranking. Think about what the student is really asking before answering, and answer exactly that question first, in one clear sentence, before anything else. Give exact titles, numbers and dates from the data. You are a real AI helper for anything about their courses, their course materials or Studyboard itself: use everything below (their planner, the search results from their own files, notes and cards, the file text, what's on their screen, and HOW STUDYBOARD WORKS for questions about the app), and your own knowledge for subject matter. Always give a real, useful answer: if their data doesn't have something, say briefly what you checked, then help anyway (explain the topic, say where in the app it would be, or ask one short question). Never invent their facts, dates, marks or file contents. When you use their course materials, say which file or note it came from. Match the length to the question: a sentence for a quick fact, a clear explanation with short paragraphs, steps or '- ' bullets when they want to understand, learn, plan or do something. For questions about their work, suggest a concrete next step when it helps. Reply to exactly what the student said, nothing they didn't ask for. Add more only when it clearly helps with what they asked (like what it takes to keep a grade when they ask about that grade, or a deadline that clashes with the plan they're asking about), never as filler. When the student is just chatting, answer that and only that, in character and briefly, like a friend: a hello gets a short friendly hello back (and, at most, a few words offering help), not news about you or a question back; only say how you are or what you've been up to when they ask; thanks gets a short "you're welcome". Don't steer small talk to tasks, deadlines or studying, and don't add a next step, unless they bring up school or sound stressed about it, and then be kind first.${actOn ? `
You can also DO things in Studyboard, but only when the student asks or what they attached clearly calls for it, and only by offering actions they tap to confirm (never say it is already done). Actions: flashcards, quiz or case_study (made from the attached files, or from the material you put in "text"; set "deck" to add to an existing deck; they are saved straight to the student's decks); note (a clean typed note from a photo, slides or anything else, optionally onto a named note board and course); tasks (due dates you find in what they attached or told you); quick_add (open Quick Add with a sentence to turn into tasks); syllabus (read an attached syllabus into a course and its deadlines); breakdown (split a big task into milestones; "target" is the task title); estimate (estimate times for tasks with none); exam_plan (build an exam prep plan; "target" is the exam title); ask_materials (open Ask Your Course Materials for a course); summarize_file ("target" is a file name from FILES); save_file (store the attached files in the course's Files). Things you can simply answer in chat, do that instead of an action: explaining a task or topic, summarizing what was attached or their notes, a weekly review, quizzing them one question at a time, checking an answer they wrote, listing exam topics, rewriting or tidying text. Photos of whiteboards, slides or handwriting: read them fully and offer a note. Slides, PDFs or readings: offer flashcards, and a quiz if they want to practice. Say in your answer what you are offering, in a sentence or two. If they attached something and gave no instructions, say what you see and offer the most useful one or two actions.` : ""}${cat && window.SBASSIST ? "\n" + SBASSIST.RULES + "\nThe refs are in ITEMS YOU CAN SHOW OR CHANGE. Changing existing things always goes in \"changes\", never in actions. Tasks the student asks you to add go in \"newTasks\"; keep the tasks action for due dates found in files they attached." : ""}`;
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
      if (dev && TR && !r.local && d.answer) {
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
      if (!m.a.sources.length) m.a.sources = ctx.src.slice(0, 4);
      if (dev && window.SBASSIST && SBASSIST.CLAIMS.test(m.a.answer || "") && !(m.a.actions || []).length && !(m.a.changes || []).length) { const fix = await deviceAct(q, c, true); if (fix) m.a = fix; }
      // filler, or a reply that never mentions what was asked about: their material and the web instead, or an honest "couldn't find"
      if (TR && TR.nonAnswer && !att.length && !(m.a.actions || []).length && !(m.a.changes || []).length && !(m.a.show || []).length && TR.nonAnswer(q, m.a.answer)) {
        T.status = "Looking it up in your notes and on the web…"; draw();
        try { const k = await TR.knowledge(q, {noWeb: !TR.general(q)}); m.a = {answer: k.answer, sources: k.found ? [...(k.notesSrc || []).slice(0, 3), ...(k.sources || []).map(x => x.src + ": " + x.title)].map(x => clip(x, 40)).slice(0, 5) : [], followUps: [], actions: []}; } catch (e) { if (stopsHere(e)) throw e; }
      }
      }
    } catch (e) { m.err = clip((e && e.message) || "I couldn't answer that just now. Try again in a bit?", 200); if (e && e.code) m.errCode = String(e.code); if (e && e.detail) m.errDetail = clip(e.detail, 240); }
    })();
    if (await Promise.race([work.then(() => false, () => false), new Promise(r => setTimeout(() => r(true), (window.__SB_TEST && window.__CHAT_MAX) || CHAT_MAX))])) m = {q: m.q, at: m.at, files: m.files, err: "That took too long, so I stopped. Try asking again, maybe in fewer words.", errCode: "slow"};
    const fresh = rd(), cc = fresh.find(x => x.id === c.id) || c;
    if (!fresh.includes(cc)) fresh.unshift(cc);
    cc.msgs.push(m); cc.msgs = cc.msgs.slice(-MAXM); cc.at = Date.now();
    fresh.sort((a, b) => b.at - a.at); wr(fresh);
    T.busy = null; T.status = ""; T.live = ""; draw(); say();
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
  function addNoteTo(boardId, text, courseId){
    const all = notesArr().filter(n => !n.archived && noteBoardOf(n) === boardId);
    const z = all.reduce((m, n) => Math.max(m, n.z || 0), 0) + 1, col = all.length % 5, row = Math.floor(all.length / 5) % 4;
    const n = normNote({id: uid(), board: boardId, text: text.slice(0, 8000), color: "yellow", x: 40 + col * (NOTE_W() + 30) + Math.round(Math.random() * 20), y: 40 + row * 240 + Math.round(Math.random() * 20), z, rot: Math.round((Math.random() * 4 - 2) * 10) / 10, courseId: courseId || "", created: Date.now()});
    applyChanges([{kind: "note", id: n.id, after: n}], null); return n;
  }
  // photos attached in the chat with "add this to my note board": a new note on the board holding them (photos in notes are Pro)
  async function photoNote(q, att){
    const imgs = att.filter(x => /^image\//.test((x.part && x.part.inline_data && x.part.inline_data.mime_type) || "") || /\.(png|jpe?g|gif|webp)$/i.test(x.name || ""));
    const NP = window.__sbNotePhotos;
    if (!NP || (window.SBPRO && SBPRO.locked && SBPRO.locked())) return {answer: "Photos on notes are part of Studyboard Pro. I can turn the photo into typed notes instead: ask \"make notes from this photo\".", sources: [], followUps: [], actions: []};
    const cap = ((q.match(/\b(?:saying|that says|caption(?:ed)?|titled|called)\s+(.+)$/i) || [])[1] || "").trim();
    const b = boardFor("", null), n = addNoteTo(b.id, cap, "");
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
      : !ready ? `<div class="cpt-gate"><p style="margin:0"><b>Chat needs AI.</b> ${typeof aiProUser === "function" && aiProUser() ? "Set up AI to chat: Studyboard AI comes with your Pro plan." : typeof aiOwnPaidOk === "function" && aiOwnPaidOk() ? "Set up AI to chat: a free Google Gemini key, Claude, ChatGPT, or Studyboard AI with Pro." : "Set up AI to chat: a free Google Gemini key, or Studyboard AI with Pro."}</p><button type="button" class="btn primary small" data-act="ai-setup">Set Up AI</button></div>` : "";
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

  function drawStatus(){ const s = $("#cptStatus"); if (s) { s.textContent = T.live || T.status || "Thinking…"; s.classList.toggle("cpt-live", !!T.live); } }
  function draw(){
    if (ui.tab !== "companion") return;
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
    const log = $("#cptLog"); if (log) { toLatest(log); requestAnimationFrame(() => { if (log.isConnected) toLatest(log); }); }
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
        const text = `${m.q}\n\n${m.a.answer}`.slice(0, 8000), done = board => { addNoteText(text, "", "green", board == null ? {} : {board}); el.textContent = "Saved to Notes"; el.disabled = true; };
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
  window.SBCOMPTAB = {self: q => { try { return selfAnswer(q); } catch (e) { return ""; } }, open: q => { try { if (window.SBSEARCH && SBSEARCH.warm) SBSEARCH.warm(); } catch (e) {} ui.tab = "companion"; ui.courseId = null; T.tab = "chat"; render(); window.scrollTo(0, 0); if (q) ask(q); }, chats: rd};

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


