/* ===== module: 98-assist.js: Ask finds anything, knows the page you're on, and makes changes you confirm ===== */
/* Used by the companion's Ask (the bubble on computers, the Companion tab on phones and everywhere else).
   - catalog(q): everything Ask can point at, each with a short ref (T3 = a task, K12 = one class on one day, F2 = a card...),
     plus what search finds for the question inside files, notes and cards, and what's on the student's screen.
   - The AI answers with {answer, show: [refs], changes: [{ref, field, value, scope, setting}]}.
   - jump(target) goes there and highlights it; propose(changes) goes to the first one, lists each change as before → after,
     and only on Apply makes them (one Undo for all). Settings are changed through the Settings sheet's own controls.
   - Whiteboards get a short description of their pictures, drawings and handwriting in the background (the "describe"
     job), so "the whiteboard with the cell diagram" can be found, and the jump lands on that spot. */
/* Answers made on this device when the AI can't be reached (the Companion tab's chat and the bubble's Ask):
   a "what next" question gets Do This Next, and a task always comes with its course and when it's due */
window.SBLOCALANS = (() => {
  const NEXT_Q = /\b(what|which)\b[^?]*\b(should|do|can|to)\b[^?]*\b(next|now|first|work on|start|focus on|study)\b|\bwhat('?s| is) next\b|\bmost (urgent|important|pressing)\b|\btop priority\b|\bwhere (do|should) i start\b/i;
  const when = t => { try { return t.due ? `${MILESTONE(t.type) ? "" : "due "}${fmtDate(t.due)}${t.time ? ", " + fmtTime(t.time) : ""}` : "no due date"; } catch (e) { return t.due || ""; } };
  const taskLine = t => { const c = courseOf(t.courseId); return `**${t.title}**${c ? ", " + courseLabel(c) : ""}: ${t.status === "done" ? "done" : when(t)}${t.location ? ", " + t.location : ""}`; };
  function nextLine(){ try { if (dayIsOff(todayISO())) return ""; const n = nextUp(computeFocus()); return n && n.x && n.x.t ? `Today's Plan says to do this next: ${taskLine(n.x.t)}` : ""; } catch (e) { return ""; } }
  return {NEXT_Q, taskLine, nextLine};
})();
(() => {
  const clip = (s, n) => String(s == null ? "" : s).replace(/\s+/g, " ").trim().slice(0, n);
  const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const wd = d => { try { return DAYS[parse(d).getDay()]; } catch (e) { return ""; } };
  const ISO = /^\d{4}-\d{2}-\d{2}$/, HM = /^([01]?\d|2[0-3]):[0-5]\d$/;
  const hm = v => { const m = /^(\d{1,2}):(\d{2})$/.exec(String(v || "").trim()); return m && HM.test(v) ? String(m[1]).padStart(2, "0") + ":" + m[2] : ""; };
  const nice = d => { try { return parse(d).toLocaleDateString(undefined, {weekday: "short", month: "short", day: "numeric"}); } catch (e) { return d; } };
  const tm = t => { try { return t ? fmtTime(t) : "no time"; } catch (e) { return t; } };
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const frame = () => new Promise(r => requestAnimationFrame(() => r()));

  /* ---------- 1. The page the student is on ---------- */
  const NAMES = {board: "Board", timeline: "Calendar (timeline)", schedule: "Calendar (week schedule)", crunch: "Rough Week Rescue", flashcards: "Review (flashcards and quizzes)",
    notes: "Notes", courses: "Courses", files: "Files", emails: "Emails", groups: "Study Groups", archive: "Archive", scrapbook: "Term Scrapbook", sbtoday: "Today", companion: "Companion"};
  function here(){
    const tab = ui.tab, bits = [];
    try {
      if (tab === "courses" && ui.courseId && state.courses[ui.courseId]) { const c = state.courses[ui.courseId]; bits.push(`course page: ${c.name}${c.code ? " (" + c.code + ")" : ""}${ui.courseTab ? ", " + ui.courseTab + " tab" : ""}`); }
      if (tab === "flashcards") {
        if (ui.fc && ui.fc.q && ui.fc.q[ui.fc.i]) { const it = ui.fc.q[ui.fc.i], d = state.decks[it.deckId], c = d && d.cards.find(x => x.id === it.cardId); if (c) bits.push(`studying the deck "${d.name}", card showing: "${clip(c.front, 200)}"${ui.fc.flipped ? ` (flipped; back: "${clip(c.back, 200)}")` : " (not flipped yet: don't reveal the back unless they ask)"}`); }
        else if (ui.deckId && state.decks[ui.deckId]) bits.push(`deck "${state.decks[ui.deckId].name}"${ui.rvView === "quizzes" ? ", quizzes" : ""}`);
      }
      if (tab === "notes") {
        if (ui.notesView === "wb" && window.SBWB && SBWB.curId && SBWB.curId()) { const b = state.notes[SBWB.curId()]; if (b) bits.push(`whiteboard "${SBWB.boardName(b)}"`); }
        else bits.push(`note board "${nbName(ui.noteBoard || "")}"`);
      }
      if (isPlanTab(tab) && tab === "schedule" && ui.schWeek) bits.push(`week of ${nice(ui.schWeek)}`);
      if (tab === "files" && ui.fCourse && ui.fCourse !== "all" && state.courses[ui.fCourse]) bits.push(`files for ${courseLabel(state.courses[ui.fCourse])}`);
    } catch (e) {}
    const view = document.getElementById("view");
    let text = ""; try { text = view ? view.innerText : ""; } catch (e) {}
    let sheet = "";
    try { if (dlg && dlg.open) { const h = dlg.querySelector("h2"); sheet = `${h ? h.textContent.trim() + ": " : ""}${clip(dlg.innerText, 2500)}`; } } catch (e) {}
    return {tab, name: NAMES[tab] || tab, detail: bits.join("; "), text: clip(text, 5000), sheet, at: Date.now()};
  }
  // The Companion tab is a page too: what was on screen just before it is kept
  let snap = null, snapT = 0;
  hook("render", () => { if (ui.tab === "companion") return; clearTimeout(snapT); snapT = setTimeout(() => { try { if (ui.tab !== "companion") snap = here(); } catch (e) {} }, 700); });
  function current(){ if (ui.tab !== "companion") return here(); return snap && Date.now() - snap.at < 6 * 3600000 ? Object.assign({}, snap, {before: true}) : null; }
  function screenText(cur){
    if (!cur) return "";
    return `\n\nTHE STUDENT ${cur.before ? "WAS JUST LOOKING AT (before opening the Companion tab)" : "IS LOOKING AT RIGHT NOW"}: the ${cur.name} page${cur.detail ? " (" + cur.detail + ")" : ""}.${cur.sheet ? `\nAn open window on top: ${cur.sheet}` : ""}\nWhat the page shows:\n"""\n${cur.text}\n"""\nQuestions like "this", "here", "on this page" or "these" are about it.`;
  }

  /* ---------- 2. Everything Ask can point at ---------- */
  const DESC_KEY = "studyboard:wbDesc";
  const descs = () => { try { return JSON.parse(localStorage.getItem(DESC_KEY) || "{}") || {}; } catch (e) { return {}; } };
  async function catalog(q, o){
    o = o || {};
    const refs = new Map(), byKey = new Map(), cnt = {}, L = [];
    const ref = (p, t) => { const k = t.kind + ":" + (t.key || t.id) + (t.page ? "@" + t.page : "") + (t.spot ? "#" + t.spot.what + t.spot.x0 + "," + t.spot.y0 : ""); if (byKey.has(k)) return byKey.get(k); cnt[p] = (cnt[p] || 0) + 1; const r = p + cnt[p]; refs.set(r, t); byKey.set(k, r); return r; };
    const today = todayISO(), cl = id => { const c = id && state.courses[id]; return c ? courseLabel(c) : ""; };
    // courses and their weekly class times
    const cs = coursesArr();
    if (cs.length) L.push("COURSES (ref | name | code | instructor | room | weekly class times):\n" + cs.map(c => `${ref("C", {kind: "course", id: c.id})} | ${clip(c.name, 60)} | ${clip(c.code, 20)} | ${clip(c.instructor, 40)} | ${clip(c.room, 30)} | ${courseMeetings(c).map(m => `${m.kind} ${(m.days || []).map(x => DAYS[x]).join("/")} ${m.start}-${m.end}${m.where ? " at " + m.where : ""}`).join("; ")}`).join("\n"));
    // tasks
    const all = tasksArr(), open = all.filter(t => t.status !== "done").sort((a, b) => (a.due || "9999").localeCompare(b.due || "9999")).slice(0, 220);
    const done = all.filter(t => t.status === "done").sort((a, b) => (b.doneAt || 0) - (a.doneAt || 0)).slice(0, 30);
    const tl = t => `${ref("T", {kind: "task", id: t.id})} | ${clip(t.title, 90)} | ${cl(t.courseId)} | ${t.type} | ${t.due ? `due ${t.due} (${wd(t.due)})${t.time ? " " + t.time : ""}` : "no due date"} | ${t.status} | ${t.priority || "med"}${t.hours ? " | est " + t.hours + "h" : ""}${t.weight ? " | worth " + t.weight + "%" : ""}`;
    if (open.length) L.push("OPEN TASKS (ref | title | course | type | due | status | priority):\n" + open.map(tl).join("\n"));
    if (done.length) L.push("RECENTLY FINISHED TASKS:\n" + done.map(tl).join("\n"));
    // classes and events, one line per day they happen (two weeks back, five ahead)
    try {
      const occ = schOccurrences(addDays(today, -14), addDays(today, 35)).filter(x => x.type === "meet" || x.type === "event").sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start)).slice(0, 300);
      if (occ.length) L.push("CLASSES AND EVENTS BY DATE (ref | day | date | time | what | where):\n" + occ.map(x => `${ref("K", {kind: x.type === "meet" ? "class" : "event", id: x.id, key: x.key, date: x.date, start: x.start, end: x.end, mid: x.m && x.m.id, label: x.label, repeats: x.type === "meet" || !!(x.ev && x.ev.repeat)})} | ${wd(x.date)} | ${x.date} | ${x.allDay ? "all day" : `${x.start}-${x.end}`} | ${x.type === "meet" ? `${courseLabel(x.c)} ${x.label}` : clip(x.title, 60) + (x.ev && x.ev.repeat ? " (repeats)" : "")} | ${clip(x.where, 40)}${x.skipped ? " | cancelled this day" : x.moved ? " | moved this day" : ""}`).join("\n"));
    } catch (e) { console.warn("assist classes", e); }
    // grades: each course's standing, and every marked item (its ref jumps to the course's Grades tab and highlights the row)
    try {
      const G = window.SBGRADES, gl = G && G.lines ? G.lines() : [], gi = G && G.items ? G.items() : [];
      if (gl.length) L.push("COURSE GRADES (the student's standing in each course):\n" + gl.map(x => "- " + x).join("\n"));
      if (gi.length) L.push("GRADES, one per marked item (ref | item | course | type | mark | percent | worth):\n" + gi.slice(0, 300).map(x => `${ref("G", {kind: "grade", id: x.id})} | ${clip(x.title, 90)} | ${clip(x.course, 30)} | ${x.type} | ${x.mark} | ${x.pct}%${x.letter ? " (" + x.letter + ")" : ""} | ${x.weight != null ? (x.weightEst ? "about " + x.weight + "% (estimated from points, not from the school)" : "worth " + x.weight + "%") : "no weight"}`).join("\n"));
      if (gi.some(x => x.weightEst) || gl.some(x => /ESTIMATES|estimates from points/.test(x))) L.push(EST_W_NOTE);
    } catch (e) { console.warn("assist grades", e); }
    // decks, quizzes, and the cards of the deck on screen
    const ds = decksArr();
    if (ds.length) L.push("FLASHCARD DECKS AND QUIZZES (ref | name | course | cards | quizzes):\n" + ds.map(d => `${ref("D", {kind: "deck", id: d.id})} | ${clip(d.name, 60)} | ${cl(d.courseId)} | ${d.cards.length} cards | ${(d.aiQuizzes || []).filter(z => !z.archived).map(z => `${ref("Z", {kind: "quiz", deck: d.id, id: z.id})} "${clip(z.title, 50)}" (${(z.questions || []).length} questions)`).join(", ")}`).join("\n"));
    const onDeck = ui.tab === "flashcards" && ui.deckId && state.decks[ui.deckId] ? state.decks[ui.deckId] : null;
    if (onDeck && onDeck.cards.length) L.push(`CARDS IN "${clip(onDeck.name, 60)}" (ref | front | back):\n` + onDeck.cards.slice(0, 200).map(c => `${ref("F", {kind: "card", deck: onDeck.id, id: c.id})} | ${clip(c.front, 140)} | ${clip(c.back, 140)}`).join("\n"));
    // notes and whiteboards
    const ns = notesArr().filter(n => !n.archived && String(n.text || "").trim()).sort((a, b) => (b.updated || 0) - (a.updated || 0)).slice(0, 150);
    if (ns.length) L.push("STICKY NOTES (ref | note board | text):\n" + ns.map(n => `${ref("N", {kind: "note", id: n.id})} | ${nbName(noteBoardOf(n))} | ${clip(n.text, 160)}`).join("\n"));
    const D = descs(), wbs = Object.values(state.notes || {}).filter(n => isWhiteboard(n) && !n.archived).slice(0, 80);
    if (wbs.length) L.push("WHITEBOARDS (ref | name | course | typed text | what's drawn, written or pictured on it):\n" + wbs.map(n => {
      const d = D[n.id] && D[n.id].d, typed = (n.wbItems || []).filter(i => i.k === "t").map(i => i.s).join(" / "), own = ref("W", {kind: "board", id: n.id});
      const spots = d && Array.isArray(d.spots) ? d.spots.slice(0, 12).map((s, i) => `${ref("W", {kind: "board", id: n.id, spot: s})} ${clip(s.what, 60)}`).join("; ") : "";
      return `${own} | ${clip(window.SBWB ? SBWB.boardName(n) : (n.text || "").split("\n")[0], 60)} | ${cl(n.courseId)} | ${clip(typed, 200)} | ${d ? clip(d.about, 200) + (d.words ? ` Words on it: ${clip(d.words, 300)}` : "") : (n.wbInk || []).length ? "has drawings or handwriting (not described yet)" : ""}${spots ? ` | spots: ${spots}` : ""}`;
    }).join("\n"));
    // files
    const fs = Object.values(state.files || {}).filter(f => f && !f.archived).sort((a, b) => (b.updated || b.created || 0) - (a.updated || a.created || 0)).slice(0, 250);
    if (fs.length) L.push("FILES (ref | name | course | folder):\n" + fs.map(f => `${ref("P", {kind: "file", id: f.id})} | ${clip(f.name, 80)} | ${cl(f.courseId)} | ${f.folderId === "lectures" ? "lecture recording" : clip(f.folderId || "", 20)}${f.desc ? " | " + clip(f.desc, 80) : ""}`).join("\n"));
    // what search finds for the question, inside files, notes, cards and quizzes
    if (q && window.SBSEARCH) {
      try {
        const R = await SBSEARCH.retrieve(q, {max: 10, chars: 700, wait: 800, readWait: 1, semWait: 2500});
        // R.text has each row as "[n] where" and then its text, in the same order as R.rows
        const told = {}; String(R && R.text || "").split(/\n\n(?=\[\d+\] )/).forEach(b => { const m = /^\[(\d+)\] ([^\n]*)\n?([\s\S]*)$/.exec(b); if (m) told[Number(m[1]) - 1] = {cite: m[2], body: m[3]}; });
        const rows = (R && R.rows || []).map((x, i) => {
          const d = x.doc || {}; let t = null, p = "S";
          if (d.type === "task") { t = {kind: "task", id: d.id}; p = "T"; }
          else if (d.type === "card") { t = {kind: "card", deck: d.pid, id: d.id}; p = "F"; }
          else if (d.type === "question") { t = {kind: "question", deck: d.pid, quiz: d.qid, id: d.id}; p = "Q"; }
          else if (d.type === "quiz") { t = {kind: "quiz", deck: d.pid, id: d.id}; p = "Z"; }
          else if (d.type === "deck") { t = {kind: "deck", id: d.id}; p = "D"; }
          else if (d.type === "note") { t = {kind: "note", id: d.id}; p = "N"; }
          else if (d.type === "board") { t = {kind: "board", id: d.id}; p = "W"; }
          else if (d.type === "course") { t = {kind: "course", id: d.id}; p = "C"; }
          else if (d.type === "file") { t = {kind: "file", id: d.id}; p = "P"; }
          else if (d.type === "chunk") { t = {kind: "file", id: d.fid, page: d.label === "Page" ? d.page : 0}; p = "P"; }
          else if (d.type === "lecture") { t = {kind: "file", id: d.fid}; p = "P"; }
          else if (d.type === "event") { t = {kind: "event", id: d.id}; p = "K"; }
          if (!t) return "";
          const tt = told[i] || {}, d2 = x.doc || {};
          return `${ref(p, t)} | ${clip(tt.cite || d2.title || "", 80)}\n${clip(tt.body || x.text || [d2.title, d2.text].filter(Boolean).join(" "), 700)}`;
        }).filter(Boolean);
        if (rows.length) L.push("SEARCH MATCHES FOR THE QUESTION (ref | where, then the matching text):\n" + rows.join("\n\n"));
      } catch (e) { console.warn("assist search", e); }
    }
    const text = (`TODAY: ${today} (${wd(today)})\n\n` + L.join("\n\n")).slice(0, o.max || 60000);
    return {text, refs};
  }

  /* ---------- 3. What the AI may answer with ---------- */
  const FIELDS = ["title", "due", "time", "startDate", "status", "priority", "notes", "hours", "type", "course", "weight", "delete",
    "name", "code", "instructor", "room", "date", "from", "to", "where", "weekday", "skip", "front", "back", "stem", "answer", "explanation", "options", "correct", "text", "setting"];
  const SHOW_CHANGE = {
    focusMinutes: {type: "INTEGER", description: "When the student asks to start a focus timer, focus session or pomodoro: its length in minutes (use 25 if they gave none). The app starts it right away. 0 otherwise."},
    show: {type: "ARRAY", items: {type: "STRING"}, description: "Refs (like T3, K12, P4, W2) of what the student asked to find or see, most relevant first. Empty when they didn't ask to find anything and nothing is being changed."},
    changes: {type: "ARRAY", description: "Changes to make, ONLY when the student asked for a change. The app shows each one and asks them to confirm. Empty otherwise.", items: {type: "OBJECT", properties: {
      ref: {type: "STRING", description: "The ref of the thing to change, or SETTINGS for an app setting"},
      field: {type: "STRING", enum: FIELDS},
      value: {type: "STRING", description: "The new value (formats in the rules). For delete or skip: yes"},
      scope: {type: "STRING", enum: ["none", "once", "all"], description: "Classes and repeating events: once = only that day, all = every week; none for everything else"},
      setting: {type: "STRING", description: "field setting: the setting to change, in words, like 'daily quote' or 'study hours per day'"}}, required: ["ref", "field", "value"]}},
    newTasks: {type: "ARRAY", description: "New tasks to add, ONLY when the student asked to add or create them. The app shows them and asks them to confirm. Empty otherwise.", items: {type: "OBJECT", properties: {
      title: {type: "STRING"}, course: {type: "STRING", description: "A C ref, or empty"}, type: {type: "STRING", enum: ["Assignment", "Exam", "Quiz", "Reading", "Project", "Lab", "Study", "Other"]},
      due: {type: "STRING", description: "YYYY-MM-DD, or empty for no due date"}, time: {type: "STRING", description: "HH:MM (24h), or empty"},
      priority: {type: "STRING", enum: ["low", "med", "high", "urgent"]}, hours: {type: "NUMBER", description: "Time estimate in hours, or 0 if unknown"}, notes: {type: "STRING", description: "Details the student gave, or empty"}},
      required: ["title", "type", "due"]}}
  };
  // The Companion tab sends only what a question needs: the list of things to find or change goes with questions that are about that
  const WANTS = /\b(find|where|show|open|locate|look(ing)? for|search|go to|take me|jump|bring up|pull up|which (note|file|board|whiteboard|deck|card|quiz|task|class)|change|move|rename|edit|update|set|make (it|my|the)|turn (on|off)|enable|disable|delete|remove|cancel|skip|reschedule|push|postpone|switch|fix|correct|replace|swap|mark (it|as)|due (date|time)|setting|settings|add|create|new task|remind me|put (in|on)|schedule)\b/i;
  const wants = q => WANTS.test(String(q || ""));
  const SCHEMA = {type: "OBJECT", properties: Object.assign({answer: {type: "STRING", description: "The reply, plain text, short"}}, SHOW_CHANGE), required: ["answer", "show", "changes"]};
  const RULES = `FINDING THINGS: when the student asks where something is, to find, open or show something (a task, a note that says something, a whiteboard with a certain picture, drawing or writing on it, a file by its name or by what's in it, a card, a quiz question, a class), put its ref first in "show" and say in one short sentence what and where it is. The app opens it and highlights it. A whiteboard spot ref (W with a description) lands on that part of the board. Search matches show what's inside files and notes. If nothing fits, say so and leave "show" empty; never guess a ref.
GRADES: for a question about a grade or mark ("what did I get on Exam 1?", "what's my grade in BIOS 230?"), answer from COURSE GRADES and GRADES: say the mark and percent (and letter if listed), and leave "show" empty, so the app stays where it is. Only when the student asks to find, show, open, see or go to a grade ("find my Exam 1 grade", "show me my grade for the lab") put its G ref first in "show". If an item isn't in GRADES, say it doesn't have a mark in Studyboard yet; never say grades aren't listed when GRADES or COURSE GRADES has them.
CHANGING THINGS: when (and only when) the student asks to change something, add it to "changes". Never say it's already done: the app shows them the change and they confirm it. Use exactly one change per field per thing. Fields by kind:
- task (T): title; due YYYY-MM-DD; time HH:MM (24h) or empty; startDate YYYY-MM-DD; status todo|doing|done; priority low|med|high|urgent; notes; hours (number); type Assignment|Exam|Quiz|Reading|Project|Lab|Study|Other; course (a C ref); weight (percent number); delete yes
- course (C): name; code; instructor; room
- class on a day (K for a class): scope once = only that day: date YYYY-MM-DD (move it), from HH:MM, to HH:MM, skip yes (cancel that day). scope all = every week: from, to, where, weekday Sun|Mon|Tue|Wed|Thu|Fri|Sat (moves that weekly class to another day). "Change my Tuesday lecture to 3pm" with no date means every week; "this Tuesday" or a date means once.
- event (K for an event): title; date; from; to; where; notes; delete yes; for repeating ones scope once or all
- deck (D): name. quiz (Z): title
- card (F): front; back; delete yes
- quiz question (Q): stem; answer (for a short-answer question); explanation; options (all the choices, separated by " | "); correct (the correct choice's exact text; several separated by " | "); delete yes
- sticky note (N): text (the whole new note); delete yes. whiteboard (W): name
- file (P): name (keep the file's extension); course (a C ref); delete yes
- app settings: ref SETTINGS, field setting, "setting" = which setting in words, value = the new value in words or a number (like "off", "dark", "4", "Spanish").
ADDING TASKS: when the student asks to add, create or remember something to do (homework, an exam, a reading, a reminder to study), put each one in "newTasks": a short clear title, its course ref when it's for a course, its type, the due date worked out from TODAY (like "next Friday"), a time only if they gave one, and priority high for exams. Several at once is fine ("add the readings for each week"). Never say they're added: the student confirms them first.
FOCUS TIMER: when the student asks to start a focus timer, focus session or pomodoro ("start a 5 minute timer"), set "focusMinutes" to its length (25 if they didn't say) and say it's starting. The app starts it.
Use dates and refs exactly as listed. Don't invent refs that aren't listed.`;

  /* ---------- 4. Checking what came back ---------- */
  const fieldOk = {
    task: ["title", "due", "time", "startDate", "status", "priority", "notes", "hours", "type", "course", "weight", "delete"],
    course: ["name", "code", "instructor", "room"], class: ["date", "from", "to", "where", "weekday", "skip"], event: ["title", "date", "from", "to", "where", "notes", "delete", "skip"],
    deck: ["name"], quiz: ["title"], card: ["front", "back", "delete"], question: ["stem", "answer", "explanation", "options", "correct", "delete"],
    note: ["text", "delete"], board: ["name"], file: ["name", "course", "delete"]
  };
  const yes = v => /^(yes|true|1|on|delete|skip|cancel)$/i.test(String(v || "").trim());
  function exists(t){
    if (!t) return false;
    switch (t.kind) {
      case "task": case "grade": return !!state.tasks[t.id];
      case "course": case "class": return !!state.courses[t.id];
      case "event": return !!state.events[t.id];
      case "deck": return !!state.decks[t.id];
      case "quiz": case "card": case "question": return !!state.decks[t.deck];
      case "note": case "board": return !!state.notes[t.id];
      case "file": return !!state.files[t.id];
      case "newtask": return !!(t.task && t.task.title);
    }
    return false;
  }
  const labelOf = t => {
    try {
      switch (t.kind) {
        case "task": return clip(state.tasks[t.id].title, 60);
        case "grade": return clip(state.tasks[t.id].title, 52) + " grade";
        case "course": return courseLabel(state.courses[t.id]);
        case "class": return `${courseLabel(state.courses[t.id])} ${t.label || "class"}, ${nice(t.date)}`;
        case "event": { const e = state.events[t.id]; return `${clip(e.title, 50)}${t.date ? ", " + nice(t.date) : ""}`; }
        case "deck": return clip(state.decks[t.id].name, 60);
        case "quiz": { const z = (state.decks[t.deck].aiQuizzes || []).find(x => x.id === t.id); return z ? clip(z.title, 60) : "Quiz"; }
        case "card": { const c = state.decks[t.deck].cards.find(x => x.id === t.id); return c ? clip(c.front, 60) : "Card"; }
        case "question": { const z = (state.decks[t.deck].aiQuizzes || []).find(x => x.id === t.quiz), qq = z && z.questions.find(x => x.id === t.id); return qq ? clip(qq.stem, 60) : "Question"; }
        case "note": return clip((state.notes[t.id].text || "Note").split("\n")[0], 60) || "Note";
        case "board": return clip(window.SBWB ? SBWB.boardName(state.notes[t.id]) : "Whiteboard", 60) + (t.spot ? ": " + clip(t.spot.what, 40) : "");
        case "file": return clip(state.files[t.id].name, 60) + (t.page ? `, page ${t.page}` : "");
        case "settings": return "Settings";
      }
    } catch (e) {}
    return "";
  };
  const NAMEF = {title: "Title", due: "Due date", time: "Due time", startDate: "Start date", status: "Status", priority: "Priority", notes: "Notes", hours: "Time estimate", type: "Type", course: "Course", weight: "Weight",
    name: "Name", code: "Code", instructor: "Instructor", room: "Room", date: "Date", from: "Starts", to: "Ends", where: "Where", weekday: "Day", skip: "Cancel", front: "Front", back: "Back", stem: "Question", answer: "Answer",
    explanation: "Explanation", options: "Choices", correct: "Correct answer", text: "Text", delete: "Delete"};
  const STATUS = {todo: "To Do", doing: "In Progress", done: "Done"}, PRI = {low: "Low", med: "Medium", high: "High", urgent: "Urgent"};
  // One change, checked and described (before → after); null when it isn't something that can be done
  function check(c, refs){
    if (!c || typeof c !== "object") return null;
    const field = String(c.field || ""), raw = String(c.value == null ? "" : c.value).trim().slice(0, 4000), scope = c.scope === "once" || c.scope === "all" ? c.scope : "";
    if (String(c.ref || "").toUpperCase() === "SETTINGS" || field === "setting") {
      const what = clip(c.setting, 120); if (!what || !raw) return null;
      return {t: {kind: "settings"}, field: "setting", setting: what, value: clip(raw, 200), label: "Settings", what: what, from: "", to: clip(raw, 80)};
    }
    const t = refs.get(String(c.ref || "").trim().toUpperCase()); if (!t || !exists(t)) return null;
    if (!(fieldOk[t.kind] || []).includes(field)) return null;
    const out = {t, field, value: raw, scope, label: labelOf(t), what: NAMEF[field] || field};
    const S = (from, to) => Object.assign(out, {from, to});
    try {
      if (t.kind === "task") {
        const k = state.tasks[t.id];
        if (field === "delete") return yes(raw) ? S("", "Delete it (it goes to Recently Deleted)") : null;
        if (field === "due" || field === "startDate") { if (!ISO.test(raw)) return null; const cur = field === "due" ? k.due : k.start; return S(cur ? nice(cur) : "none", nice(raw)); }
        if (field === "time") { const v = raw ? hm(raw) : ""; if (raw && !v) return null; out.value = v; return S(k.time ? tm(k.time) : "no time", v ? tm(v) : "no time"); }
        if (field === "status") { if (!STATUS[raw]) return null; return S(STATUS[k.status] || k.status, STATUS[raw]); }
        if (field === "priority") { if (!PRI[raw]) return null; return S(PRI[k.priority] || k.priority, PRI[raw]); }
        if (field === "type") { if (!TYPES.includes(raw)) return null; return S(k.type, raw); }
        if (field === "hours") { const n = Number(raw); if (!(n >= 0 && n <= 500)) return null; out.value = n; return S(k.hours ? k.hours + "h" : "none", n + "h"); }
        if (field === "weight") { const n = Number(String(raw).replace("%", "")); if (!(n >= 0 && n <= 100)) return null; out.value = n; return S(k.weight ? k.weight + "%" : "none", n + "%"); }
        if (field === "course") { const ct = refs.get(raw.toUpperCase()); if (!ct || ct.kind !== "course" || !state.courses[ct.id]) return null; out.value = ct.id; return S(k.courseId && state.courses[k.courseId] ? courseLabel(state.courses[k.courseId]) : "none", courseLabel(state.courses[ct.id])); }
        if (!raw && field === "title") return null;
        return S(clip(k[field], 80) || "empty", clip(raw, 80) || "empty");
      }
      if (t.kind === "course") { if (!raw && field === "name") return null; return S(clip(state.courses[t.id][field], 60) || "none", clip(raw, 60)); }
      if (t.kind === "class" || t.kind === "event") {
        if (field === "skip") return yes(raw) ? S(`${nice(t.date)}, ${tm(t.start)}`, "Cancelled that day") : null;
        if (field === "delete") return t.kind === "event" && yes(raw) ? S("", "Delete it") : null;
        if (t.kind === "class" && !scope) out.scope = field === "date" ? "once" : "all";
        if (t.kind === "event" && !t.repeats) out.scope = "all";
        if (t.kind === "event" && t.repeats && !scope) out.scope = "all";
        if (field === "date") { if (!ISO.test(raw)) return null; if (t.kind === "class") out.scope = "once"; return S(nice(t.date), nice(raw)); }
        if (field === "from" || field === "to") { const v = hm(raw); if (!v) return null; out.value = v; return S(tm(field === "from" ? t.start : t.end), tm(v)); }
        if (field === "weekday") { const i = DAYS.findIndex(d => d.toLowerCase() === raw.slice(0, 3).toLowerCase()); if (i < 0 || t.kind !== "class") return null; out.value = i; out.scope = "all"; return S(DAYS[parse(t.date).getDay()] + " every week", DAYS[i] + " every week"); }
        if (field === "where") { if (t.kind === "class" && out.scope === "once") return null; const cur = t.kind === "class" ? ((courseMeetings(state.courses[t.id]).find(m => m.id === t.mid) || {}).where || "") : state.events[t.id].where; return S(cur || "none", clip(raw, 60) || "none"); }
        if (field === "title" || field === "notes") return raw || field === "notes" ? S(clip(state.events[t.id][field], 60) || "none", clip(raw, 60) || "none") : null;
        return null;
      }
      if (t.kind === "deck") return raw ? S(state.decks[t.id].name, clip(raw, 80)) : null;
      if (t.kind === "quiz") { const z = state.decks[t.deck].aiQuizzes.find(x => x.id === t.id); return z && raw ? S(z.title, clip(raw, 80)) : null; }
      if (t.kind === "card") { const k = state.decks[t.deck].cards.find(x => x.id === t.id); if (!k) return null; if (field === "delete") return yes(raw) ? S("", "Delete the card") : null; if (!raw) return null; return S(clip(k[field], 100), clip(raw, 100)); }
      if (t.kind === "question") {
        const z = (state.decks[t.deck].aiQuizzes || []).find(x => x.id === t.quiz), k = z && z.questions.find(x => x.id === t.id); if (!k) return null;
        if (field === "delete") return yes(raw) ? S("", "Delete the question") : null;
        if (field === "options") { const o = raw.split("|").map(x => x.trim()).filter(Boolean); if (o.length < 2 || !Array.isArray(k.options)) return null; out.value = o; return S(k.options.join(" | "), o.join(" | ")); }
        if (field === "correct") { if (!Array.isArray(k.options)) return null; const want = raw.split("|").map(x => x.trim().toLowerCase()).filter(Boolean), idx = want.map(w => k.options.findIndex(o => String(o).trim().toLowerCase() === w)); if (!idx.length || idx.some(i => i < 0)) return null; out.value = idx; return S((k.correct || []).map(i => k.options[i]).join(" | "), idx.map(i => k.options[i]).join(" | ")); }
        const key = field === "explanation" ? "rationale" : field; if (!raw && field === "stem") return null; return S(clip(k[key], 100) || "none", clip(raw, 100));
      }
      if (t.kind === "note") { if (field === "delete") return yes(raw) ? S("", "Delete the note (it goes to Recently Deleted)") : null; return raw ? S(clip(state.notes[t.id].text, 100), clip(raw, 100)) : null; }
      if (t.kind === "board") return raw ? S(SBWB.boardName(state.notes[t.id]), clip(raw, 60)) : null;
      if (t.kind === "file") {
        const f = state.files[t.id];
        if (field === "delete") return yes(raw) ? S("", "Delete the file (it goes to Recently Deleted)") : null;
        if (field === "course") { const ct = refs.get(raw.toUpperCase()); if (!ct || ct.kind !== "course" || !state.courses[ct.id]) return null; out.value = ct.id; return S(f.courseId && state.courses[f.courseId] ? courseLabel(state.courses[f.courseId]) : "none", courseLabel(state.courses[ct.id])); }
        if (!raw) return null;
        // a rename keeps the file's extension
        let v = clip(raw, 140).replace(/[\\/:*?"<>|]+/g, "-"); const ext = (/\.[A-Za-z0-9]{1,6}$/.exec(f.name || "") || [""])[0];
        if (ext && !v.toLowerCase().endsWith(ext.toLowerCase())) v += ext; out.value = v; return S(f.name, v);
      }
    } catch (e) { console.warn("assist check", e); }
    return null;
  }
  function resolve(d, refs){
    d = d || {};
    // (a reference as asked, else one written inside the text, "show N1", else the item named by its title: small models do all three)
    const byLabel = r => { const q = String(r || "").toLowerCase().replace(/\s+/g, " ").trim().slice(0, 24); if (q.length < 4) return null; for (const t of refs.values()) { try { if (t && labelOf(t).toLowerCase().startsWith(q)) return t; } catch (e) {} } return null; };
    const refOf = r => { const s2 = String(r || "").trim(), k = s2.toUpperCase(); if (refs.has(k)) return refs.get(k); const m = k.match(/\b[A-Z]{1,3}\d{1,4}\b/g) || []; for (const x of m) if (refs.has(x)) return refs.get(x); return byLabel(s2); };
    const show = [...new Set((Array.isArray(d.show) ? d.show : []).concat(/^\s*(show|open|go to|see)\s+[A-Z]{1,3}\d{1,4}\s*\.?$/i.test(String(d.answer || "")) ? [d.answer] : []).map(refOf))].filter(t => t && exists(t)).slice(0, 5).map(t => Object.assign({}, t, {label: labelOf(t)}));
    const seen = new Set(), changes = [];
    (Array.isArray(d.changes) ? d.changes : []).slice(0, 20).forEach(c => { const x = check(c, refs); if (!x) return; const k = JSON.stringify([x.t.kind, x.t.id, x.t.key, x.field, x.setting]); if (seen.has(k)) return; seen.add(k); changes.push(x); });
    (Array.isArray(d.newTasks) ? d.newTasks : []).slice(0, 25).forEach(x => {
      if (!x || !clip(x.title, 160)) return;
      const ct = x.course ? refs.get(String(x.course).trim().toUpperCase()) : null, cid = ct && ct.kind === "course" && state.courses[ct.id] ? ct.id : "";
      const due = ISO.test(String(x.due || "")) ? x.due : "", time = due ? hm(x.time || "") : "";
      const t = {title: clip(x.title, 160), type: TYPES.includes(x.type) ? x.type : "Assignment", courseId: cid, due, time, priority: PRI[x.priority] ? x.priority : (x.type === "Exam" ? "high" : "med"),
        hours: Math.max(0, Math.min(200, Number(x.hours) || 0)), notes: String(x.notes || "").trim().slice(0, 4000)};
      const k = JSON.stringify(["new", t.title.toLowerCase(), t.due]); if (seen.has(k)) return; seen.add(k);
      const bits = [t.type, cid ? courseLabel(state.courses[cid]) : "", due ? "due " + nice(due) + (time ? ", " + tm(time) : "") : "no due date", t.priority !== "med" ? PRI[t.priority] + " priority" : ""].filter(Boolean);
      changes.push({t: {kind: "newtask", task: t}, field: "create", value: "", scope: "", label: t.title, what: "New task", from: "", to: bits.join(" · ")});
    });
    return {show, changes};
  }

  /* ---------- 5. Going there ---------- */
  function flash(sel){
    const el = typeof sel === "string" ? document.querySelector(sel) : sel; if (!el) return false;
    try { el.scrollIntoView({block: "center", behavior: "smooth"}); } catch (e) {}
    foundBox(el);
    return true;
  }
  function go(tab){ if (dlg && dlg.open) try { dlg.close(); } catch (e) {} ui.tab = tab; if (tab !== "courses") ui.courseId = null; if (ui.fc) ui.fc = null; render(); window.scrollTo(0, 0); }
  function runAct(act, data){ const b = document.createElement("button"); b.type = "button"; b.hidden = true; b.dataset.act = act; Object.entries(data || {}).forEach(([k, v]) => { b.dataset[k] = v; }); document.body.appendChild(b); b.click(); b.remove(); }
  async function jump(t, o){
    o = o || {};
    if (!t) return false;
    if (t.kind === "settings") return true;
    if (!exists(t)) { toast("That's no longer there."); return false; }
    try {
      switch (t.kind) {
        case "task": {
          const k = state.tasks[t.id];
          if (isArchived(k)) { go("archive"); return true; }
          go("board"); await frame();
          if (!flash(`#view .card[data-id="${CSS.escape(t.id)}"]`) || o.open) taskView(k);
          return true;
        }
        case "course": go("courses"); ui.courseId = t.id; ui.courseTab = ""; render(); return true;
        case "grade": {
          // the course's Grades tab, with the row picked out (no course: the Grades page for every course)
          const k = state.tasks[t.id], cid = k.courseId && state.courses[k.courseId] ? k.courseId : null;
          go("courses"); ui.courseId = cid; ui.courseTab = "grades"; ui.courseTabFor = cid; render(); await frame(); await wait(60);
          const row = document.querySelector(`#view .gr-row-main[data-id="${CSS.escape(t.id)}"]`);
          if (!flash(row && (row.closest("li") || row))) taskView(k);
          return true;
        }
        case "class": case "event": {
          let date = t.date;
          if (!date && t.kind === "event") { const today = todayISO(); const occ = schOccurrences(today, addDays(today, 180)).find(x => x.type === "event" && x.id === t.id && !x.skipped); date = occ ? occ.date : state.events[t.id].date; t = Object.assign({}, t, {key: occ ? occ.key : t.key}); }
          go("schedule"); ui.schWeek = mondayOf(date || todayISO()); ui.schDay = dayDiff(ui.schWeek, date || todayISO()); render(); await frame(); await wait(60);
          const id = CSS.escape(t.id);
          flash(t.key ? `.sch-b[data-id="${id}"][data-key="${CSS.escape(t.key)}"], .sch-chip[data-id="${id}"]` : `.sch-b[data-id="${id}"], .sch-chip[data-id="${id}"]`);
          return true;
        }
        case "deck": go("flashcards"); ui.deckId = t.id; rvSet("cards"); render(); return true;
        case "card": go("flashcards"); ui.deckId = t.deck; rvSet("cards"); render(); await frame(); await wait(40); if (!flash(`.fc-cell[data-id="${CSS.escape(t.id)}"]`)) { const d = state.decks[t.deck]; if (d) cardSheet(d, t.id); } return true;
        case "quiz": case "question": {
          go("flashcards"); ui.deckId = t.deck; rvSet("quizzes"); ui.qzOpen = t.deck + ":" + (t.kind === "quiz" ? t.id : t.quiz); render(); await frame(); await wait(60);
          flash(t.kind === "question" && document.querySelector(`[data-qid="${CSS.escape(t.id)}"]`) ? `[data-qid="${CSS.escape(t.id)}"]` : `.aiq-list [data-id="${CSS.escape(t.kind === "quiz" ? t.id : t.quiz)}"]`) || flash(".aiq-sec, #view .qz-head");
          return true;
        }
        case "note": {
          const n = state.notes[t.id];
          if (n.archived) { go("archive"); return true; }
          if (dlg && dlg.open) try { dlg.close(); } catch (e) {}
          ui.tab = "notes"; ui.courseId = null; ui.noteBoard = noteBoardOf(n); try { localStorage.setItem(NB_KEY, ui.noteBoard); } catch (e) {}
          if (window.SBWB && ui.notesView === "wb") SBWB.setView("board");
          render(); window.scrollTo(0, 0); await frame();
          nbFocusNote(t.id);
          return true;
        }
        case "board": {
          if (!window.SBWB) return false;
          if (dlg && dlg.open) try { dlg.close(); } catch (e) {}
          SBWB.open(t.id); window.scrollTo(0, 0);
          for (let i = 0; i < 20; i++) { await wait(60); if (t.spot ? SBWB.focusOn(t.spot.x0, t.spot.y0, t.spot.x1, t.spot.y1) : true) break; }
          flash(".wb-frame");
          return true;
        }
        case "file": {
          const f = state.files[t.id];
          if (f.folderId === "lectures" && window.SBLEC) { runAct("lec-view", {id: f.id}); return true; }
          go("files"); ui.fCourse = "all"; ui.fFolder = ""; ui.fCls = ""; render(); await frame(); await wait(40);
          flash(`li.frow[data-fid="${CSS.escape(t.id)}"]`);
          if (t.page && !o.noOpen && window.SBPRO && SBPRO.openReader && fileKind(f) === "pdf") { try { if (!(SBPRO.locked && SBPRO.locked())) { SBPRO.openReader(f.id, t.page); return true; } } catch (e) {} }
          if (!document.querySelector(`li.frow[data-fid="${CSS.escape(t.id)}"]`) && !o.noOpen) fileSheet(f);
          return true;
        }
      }
    } catch (e) { console.warn("assist jump", e); }
    return false;
  }

  /* ---------- 6. Confirming and making changes ---------- */
  function confirmBox(title, rows, yesLabel){
    return new Promise(res => {
      let d = document.getElementById("asDlg");
      if (!d) { d = document.createElement("dialog"); d.id = "asDlg"; d.className = "as-dlg"; document.body.appendChild(d); }
      d.innerHTML = `<form class="sheet as-sheet"><div class="sheet-head"><h2>${esc(title)}</h2></div><div class="sheet-body"><ul class="as-list">${rows.map(r => `<li><span class="as-it">${esc(r.label)}</span><span class="as-f">${esc(r.what)}</span><span class="as-ch">${r.from ? `<s>${esc(r.from)}</s> <span aria-hidden="true">→</span> ` : ""}<b>${esc(r.to)}</b></span></li>`).join("")}</ul></div>
        <div class="sheet-foot"><span class="spacer"></span><button type="button" class="btn" id="asNo">Cancel</button><button type="submit" class="btn primary" id="asYes">${esc(yesLabel || "Apply")}</button></div></form>`;
      let done = false; const fin = v => { if (done) return; done = true; try { d.close(); } catch (e) {} res(v); };
      d.querySelector("#asNo").addEventListener("click", () => fin(false));
      d.querySelector("form").addEventListener("submit", e => { e.preventDefault(); fin(true); });
      d.oncancel = e => { e.preventDefault(); fin(false); };
      d.onkeydown = e => { e.stopPropagation(); if (e.key === "Escape") { e.preventDefault(); fin(false); } };
      try { d.showModal(); } catch (e) { d.setAttribute("open", ""); }
      setTimeout(() => { const b = d.querySelector("#asYes"); if (b) b.focus(); }, 30);
    });
  }
  function build(list){
    const after = new Map(), get = (kind, id) => { const k = kind + ":" + id; if (!after.has(k)) { const cur = kind === "task" ? state.tasks[id] : kind === "course" ? state.courses[id] : kind === "event" ? state.events[id] : kind === "deck" ? state.decks[id] : kind === "note" ? state.notes[id] : state.files[id]; after.set(k, cur ? clone(cur) : null); } return after.get(k); };
    const dead = new Set();
    for (const c of list) {
      const t = c.t, v = c.value;
      if (t.kind === "newtask") {
        const T0 = t.task, start = T0.due ? (MILESTONE(T0.type) ? T0.due : addDays(T0.due, -3)) : todayISO();
        const nt = newTask(Object.assign({}, T0, {start: start < todayISO() ? todayISO() : start, status: "todo"}));
        c.made = nt.id; after.set("task:" + nt.id, nt); continue;
      }
      if (t.kind === "task") {
        if (c.field === "delete") { dead.add("task:" + t.id); continue; }
        const n = get("task", t.id); if (!n) continue;
        const map = {startDate: "start", course: "courseId"}; n[map[c.field] || c.field] = v;
        if (c.field === "status") { if (v === "done" && !n.doneAt) n.doneAt = Date.now(); if (v !== "done") n.doneAt = null; }
      } else if (t.kind === "course") { const n = get("course", t.id); if (n) n[c.field] = v; }
      else if (t.kind === "class") {
        const n = get("course", t.id); if (!n) continue;
        if (c.scope === "once" || c.field === "skip" || c.field === "date") {
          n.meetMoves = Object.assign({}, n.meetMoves || {});
          if (c.field === "skip") n.meetMoves[t.key] = {skip: true};
          else { const mv = Object.assign({date: t.date, start: t.start, end: t.end}, n.meetMoves[t.key] && !n.meetMoves[t.key].skip ? n.meetMoves[t.key] : {}); if (c.field === "date") mv.date = v; if (c.field === "from") { const len = tToMin(mv.end) - tToMin(mv.start); mv.start = v; if (!list.some(x => x !== c && x.t === t && x.field === "to") && len > 0) mv.end = minToT(Math.min(1439, tToMin(v) + len)); } if (c.field === "to") mv.end = v; n.meetMoves[t.key] = mv; }
        } else {
          const ms = courseMeetings(n).map(m => Object.assign({}, m)), m = ms.find(x => x.id === t.mid) || ms.find(x => x.start === t.start && x.kind === t.label); if (!m) continue;
          if (c.field === "from") { const len = tToMin(m.end) - tToMin(m.start); m.start = v; if (!list.some(x => x !== c && x.t === t && x.field === "to") && len > 0) m.end = minToT(Math.min(1439, tToMin(v) + len)); }
          if (c.field === "to") m.end = v;
          if (c.field === "where") m.where = v;
          if (c.field === "weekday") { const old = parse(t.date).getDay(); m.days = [...new Set((m.days || []).filter(x => x !== old).concat([v]))].sort(); }
          n.meetings = ms; n.schedule = meetingsSummary(ms);
        }
      } else if (t.kind === "event") {
        if (c.field === "delete") { dead.add("event:" + t.id); continue; }
        const n = get("event", t.id); if (!n) continue;
        if (c.scope === "once" && t.repeats || c.field === "skip") {
          n.moved = Object.assign({}, n.moved || {});
          if (c.field === "skip") n.moved[t.key] = {skip: true};
          else if (c.field === "date" || c.field === "from" || c.field === "to") { const mv = Object.assign({date: t.date, start: t.start, end: t.end}, n.moved[t.key] && !n.moved[t.key].skip ? n.moved[t.key] : {}); if (c.field === "date") mv.date = v; if (c.field === "from") mv.start = v; if (c.field === "to") mv.end = v; n.moved[t.key] = mv; }
          else n[c.field] = v;
        } else { const map = {from: "start", to: "end"}; n[map[c.field] || c.field] = v; }
      } else if (t.kind === "deck") { const n = get("deck", t.id); if (n) n.name = v; }
      else if (t.kind === "quiz" || t.kind === "card" || t.kind === "question") {
        const n = get("deck", t.deck); if (!n) continue;
        if (t.kind === "card") { if (c.field === "delete") n.cards = n.cards.filter(x => x.id !== t.id); else { const k = n.cards.find(x => x.id === t.id); if (k) k[c.field] = v; } }
        else if (t.kind === "quiz") { const z = (n.aiQuizzes || []).find(x => x.id === t.id); if (z) z.title = v; }
        else { const z = (n.aiQuizzes || []).find(x => x.id === t.quiz); if (!z) continue; if (c.field === "delete") z.questions = z.questions.filter(x => x.id !== t.id); else { const k = z.questions.find(x => x.id === t.id); if (k) k[c.field === "explanation" ? "rationale" : c.field] = v; } }
      } else if (t.kind === "note") { if (c.field === "delete") { dead.add("note:" + t.id); continue; } const n = get("note", t.id); if (n) { n.text = v; n.updated = Date.now(); } }
      else if (t.kind === "board") { const n = get("note", t.id); if (n) { const lines = String(n.text || "").split("\n"); lines[0] = v; n.text = lines.join("\n"); n.updated = Date.now(); } }
      else if (t.kind === "file") { if (c.field === "delete") { dead.add("file:" + t.id); continue; } const n = get("file", t.id); if (n) { n[c.field === "course" ? "courseId" : "name"] = v; n.updated = Date.now(); } }
    }
    const out = [];
    after.forEach((v, k) => { if (!v || dead.has(k)) return; const [kind, id] = k.split(/:(.*)/s); out.push({kind, id, after: v}); });
    dead.forEach(k => { const [kind, id] = k.split(/:(.*)/s); out.push({kind, id, after: null}); });
    return out;
  }
  // new tasks the student asked for in so many words: added at once (they can undo), the chat says what was added
  function addNow(changes){
    const adds = (changes || []).filter(c => c && c.t && c.t.kind === "newtask"); if (!adds.length) return 0;
    const ch = build(adds); if (!ch.length) return 0;
    applyChanges(ch, adds.length === 1 ? `Added "${clip(adds[0].label, 40)}"` : `Added ${adds.length} tasks`);
    return adds.length;
  }
  async function propose(changes, o){
    o = o || {};
    const list = (changes || []).filter(c => c && c.t && (c.t.kind === "settings" || exists(c.t)));
    if (!list.length) { toast("Nothing to change any more."); return false; }
    const sets = list.filter(c => c.t.kind === "settings"), rest = list.filter(c => c.t.kind !== "settings");
    if (rest.length) {
      const first = rest.find(c => c.t.kind !== "newtask");
      if (first) await jump(first.t, {noOpen: true}); else if (ui.tab !== "board") { go("board"); await frame(); }
      await wait(250);
      if (o.shown) try { o.shown(); } catch (e) {}
      const onlyAdds = rest.every(c => c.t.kind === "newtask");
      const ok = await confirmBox(onlyAdds ? (rest.length === 1 ? "Add this task?" : `Add these ${rest.length} tasks?`) : rest.length === 1 ? "Make this change?" : `Make these ${rest.length} changes?`, rest, onlyAdds ? "Add" : "Apply");
      if (!ok) { toast("Nothing changed."); }
      else {
        const ch = build(rest), adds = rest.filter(c => c.t.kind === "newtask");
        if (ch.length) applyChanges(ch, adds.length === rest.length ? (adds.length === 1 ? `Added "${clip(adds[0].label, 40)}"` : `Added ${adds.length} tasks`) : rest.length === 1 ? `Changed ${rest[0].what.toLowerCase()}` : `Made ${rest.length} changes`);
        await wait(80);
        const show = first ? first.t : adds[0] && adds[0].made && state.tasks[adds[0].made] ? {kind: "task", id: adds[0].made} : null;
        if (show) await jump(show, {noOpen: true, after: true});
      }
    }
    if (!rest.length && o.shown) try { o.shown(); } catch (e) {}
    for (const s of sets) await settingChange(s);
    return true;
  }

  /* Settings: found in the Settings sheet itself, shown, confirmed, then set with its own control */
  function rowTitle(el){
    let p = el.parentElement;
    for (let i = 0; p && i < 6; i++, p = p.parentElement) { const t = clip(p.innerText, 220); if (t.replace(clip(el.innerText || el.value || "", 60), "").trim().length > 3) return t; }
    return clip(el.getAttribute("aria-label") || el.innerText, 160);
  }
  function controls(root){
    const out = [], groups = new Map();
    root.querySelectorAll('input[type="checkbox"]').forEach(el => { if (!el.closest("[hidden]")) out.push({type: "toggle", el, title: rowTitle(el), now: el.checked ? "on" : "off"}); });
    root.querySelectorAll('input[type="number"], input[type="text"]:not([type="search"]), input[type="time"], select').forEach(el => { if (el.closest("[hidden]") || el.type === "search") return; out.push({type: el.tagName === "SELECT" ? "choice" : "value", el, title: rowTitle(el), now: el.tagName === "SELECT" ? (el.selectedOptions[0] || {}).textContent || "" : el.value, options: el.tagName === "SELECT" ? [...el.options].map(o => o.textContent.trim()) : null}); });
    root.querySelectorAll("button[data-act]").forEach(el => { if (el.closest("[hidden]") || el.dataset.act === "close") return; const k = el.parentElement; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(el); });
    groups.forEach((els, parent) => {
      const byAct = {}; els.forEach(b => { (byAct[b.dataset.act] = byAct[b.dataset.act] || []).push(b); });
      Object.values(byAct).forEach(bs => {
        if (bs.length >= 2) { const on = bs.find(b => b.getAttribute("aria-pressed") === "true" || b.getAttribute("aria-checked") === "true" || /\b(on|sel|active|cur)\b/.test(b.className)); out.push({type: "choice", els: bs, title: rowTitle(parent), options: bs.map(b => clip(b.innerText, 30)), now: on ? clip(on.innerText, 30) : ""}); }
        else bs.forEach(b => out.push({type: "open", el: b, title: clip(b.innerText, 160)}));
      });
    });
    return out.slice(0, 160);
  }
  const PICK = {type: "OBJECT", properties: {i: {type: "INTEGER", description: "The number of the control, or -1 if none fits"}, value: {type: "STRING", description: "toggle: on or off. choice: one of its options exactly. value: the new value. open: empty"}}, required: ["i", "value"]};
  async function pick(list, want){
    const r = await aiCall({task: "assist", fast: true, temperature: 0, maxTokens: 600, schema: PICK, quiet: true,
      system: "You pick the control in a settings screen that makes the change the student wants. Choose a toggle, choice or value control when one does it; choose an 'open' control (it opens a page with more settings) only when the setting must be inside it. -1 if nothing fits.",
      parts: [{text: `CONTROLS (number | kind | label | options | now):\n${list.map((c, i) => `${i} | ${c.type} | ${c.title}${c.options ? " | " + c.options.join(" / ") : ""}${c.now ? " | now: " + c.now : ""}`).join("\n")}\n\nCHANGE WANTED: ${want.setting} → ${want.value}`}]});
    const d = r && r.data; const i = d ? Number(d.i) : -1;
    return i >= 0 && i < list.length ? {c: list[i], value: String(d.value || "").trim()} : null;
  }
  async function settingChange(s){
    try {
      if (dlg && dlg.open) try { dlg.close(); } catch (e) {}
      menuSheet(); await frame(); await wait(120);
      let found = null;
      for (let depth = 0; depth < 3; depth++) {
        const list = controls(dlg); if (!list.length) break;
        found = await pick(list, s); if (!found) break;
        if (found.c.type !== "open") break;
        found.c.el.click(); await frame(); await wait(250); found = null;
      }
      if (!found) { toast(`I couldn't find a setting for "${s.setting}". It's open for you to look.`); return false; }
      const {c} = found; let v = found.value;
      const el = c.el || (c.type === "choice" && c.els ? c.els.find(b => clip(b.innerText, 30).toLowerCase() === v.toLowerCase()) : null);
      if (c.type === "choice" && c.els && !el) { toast("That setting doesn't have that option."); return false; }
      const target = el || (c.els && c.els[0]);
      try { if (window.SBUI && SBUI.reveal && dlg.contains(target)) SBUI.reveal(target); } catch (e) {}
      await wait(200); flash(target.closest(".menu-row, .cap-row, label, li") || target);
      if (c.type === "toggle") v = /^(on|yes|true|enable|enabled|show)$/i.test(v) ? "on" : "off";
      if (c.type === "toggle" && v === c.now) { toast(`${clip(c.title.split(/[.!]/)[0], 50)} is already ${v}.`); return true; }
      const ok = await confirmBox("Change this setting?", [{label: clip(c.title.split(/[.!]/)[0], 60), what: "Setting", from: c.now || "", to: v}], "Change");
      if (!ok) { toast("Nothing changed."); return false; }
      if (c.type === "toggle") c.el.click();
      else if (c.type === "choice" && c.els) el.click();
      else if (c.el.tagName === "SELECT") { const o = [...c.el.options].find(x => x.textContent.trim().toLowerCase() === v.toLowerCase()); if (!o) { toast("That setting doesn't have that option."); return false; } c.el.value = o.value; c.el.dispatchEvent(new Event("input", {bubbles: true})); c.el.dispatchEvent(new Event("change", {bubbles: true})); }
      else { c.el.value = v; c.el.dispatchEvent(new Event("input", {bubbles: true})); c.el.dispatchEvent(new Event("change", {bubbles: true})); }
      return true;
    } catch (e) { console.warn("assist setting", e); toast((e && e.message) || "Couldn't change that setting."); return false; }
  }

  /* ---------- 7. Whiteboard descriptions (in the background) ---------- */
  const DESC = {type: "OBJECT", properties: {
    about: {type: "STRING", description: "One or two sentences: what's on the board (topics, pictures, diagrams, drawings)"},
    words: {type: "STRING", description: "All the words, numbers and formulas written or typed on it, handwriting included, in reading order"},
    spots: {type: "ARRAY", description: "Up to 12 distinct things on it (a photo, a diagram, a drawing, a block of writing) and where", items: {type: "OBJECT", properties: {
      what: {type: "STRING", description: "Short: 'photo of a mitochondrion', 'handwritten notes on Newton's laws', 'graph of y = x²'"},
      x0: {type: "NUMBER"}, y0: {type: "NUMBER"}, x1: {type: "NUMBER"}, y1: {type: "NUMBER"}}, required: ["what", "x0", "y0", "x1", "y1"]}}}, required: ["about", "words", "spots"]};
  const sigOf = n => `${n.updated || n.created || 0}:${(n.wbInk || []).length}:${(n.wbItems || []).length}`;
  let describing = false;
  // asked: the student's own question needs it (runs even with automatic AI off); otherwise it's automatic, in the background
  async function describeBoards(max, onlyIds, asked){
    if (describing || !window.SBWB || !SBWB.renderBoard || typeof aiReady !== "function" || !aiReady() || (typeof inPreview === "function" && inPreview()) || navigator.onLine === false) return 0;
    describing = true; let done = 0;
    try {
      const D = descs();
      const todo = Object.values(state.notes || {}).filter(n => isWhiteboard(n) && !n.archived && ((n.wbInk || []).length || (n.wbItems || []).length) && (!onlyIds || onlyIds.includes(n.id))
        && (!D[n.id] || D[n.id].sig !== sigOf(n)) && (asked || Date.now() - (n.updated || 0) > 90000)).slice(0, max || 2);
      for (const n of todo) {
        const area = SBWB.areaOf(n), cv = await SBWB.renderBoard(n, {max: 1100, area});
        const b64 = cv.toDataURL("image/jpeg", 0.85).split(",")[1];
        const r = await aiCall({task: "describe", auto: !asked, quiet: true, fast: true, temperature: 0, maxTokens: 1200, schema: DESC,
          system: "Describe a student's whiteboard so it can be found by searching later. Read all writing, handwriting included. For each spot give its box as fractions of the picture's width and height (0 to 1), from the top-left.",
          parts: [{inline_data: {mime_type: "image/jpeg", data: b64}}, {text: `The whiteboard "${SBWB.boardName(n)}".`}]});
        const d = r && r.data; if (!d) continue;
        const W = area[2] - area[0], H = area[3] - area[1], f = (v, a) => Math.max(0, Math.min(1, Number(v) || 0)) * a;
        const spots = (Array.isArray(d.spots) ? d.spots : []).slice(0, 12).filter(s => s && s.what).map(s => ({what: clip(s.what, 80), x0: Math.round(area[0] + f(s.x0, W)), y0: Math.round(area[1] + f(s.y0, H)), x1: Math.round(area[0] + f(s.x1, W)), y1: Math.round(area[1] + f(s.y1, H))})).filter(s => s.x1 > s.x0 && s.y1 > s.y0);
        const all = descs(); all[n.id] = {sig: sigOf(n), d: {about: clip(d.about, 400), words: clip(d.words, 1500), spots}};
        Object.keys(all).forEach(id => { if (!state.notes[id]) delete all[id]; });
        try { localStorage.setItem(DESC_KEY, JSON.stringify(all)); } catch (e) {}
        done++;
      }
    } catch (e) { if (!/cancel|consent|nokey|auto-off|limit|offline/i.test(String(e && (e.code || e.message)))) console.warn("assist describe", e); }
    finally { describing = false; }
    return done;
  }
  // a couple of boards at a time, once the app has been quiet a while
  setTimeout(function tick(){ try { if (!document.hidden) describeBoards(2); } catch (e) {} setTimeout(tick, 6 * 60000); }, 45000);

  /* ---------- 7b. Requests done in code ---------- */
  // A focus timer, and a new task when the AI didn't write one: done by the app itself, so they never depend on the AI getting the
  // format right (small on-device models say "I've set a timer" or "I added it" without asking the app to)
  const NUMW = {one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, fifteen: 15, twenty: 20, "twenty-five": 25, "twenty five": 25, thirty: 30, forty: 40, "forty-five": 45, "forty five": 45, fifty: 50, sixty: 60, ninety: 90};
  function timerMins(q){
    const s = String(q || "").toLowerCase();
    if (!/\b(timer|focus|pomodoro|study session|focus session)\b/.test(s)) return null;
    if (/^\s*(how|what|when|why|where|which|did|do|does|is|are)\b/.test(s) || /\b(stop|pause|end|cancel|reset|turn off)\b/.test(s)) return null;
    let m = s.match(/(\d{1,3}(?:\.\d+)?)\s*-?\s*(minutes?|mins?|m|hours?|hrs?|h)\b/), mins = 0;
    if (m) mins = Number(m[1]) * (/^h/.test(m[2]) ? 60 : 1);
    else if ((m = s.match(/\b(one|two|three|four|five|six|seven|eight|nine|ten|fifteen|twenty[- ]five|twenty|thirty|forty[- ]five|forty|fifty|sixty|ninety)\s*-?\s*(minutes?|mins?|hours?)\b/))) mins = NUMW[m[1]] * (/^h/.test(m[2]) ? 60 : 1);
    else if (/\bhalf an hour\b/.test(s)) mins = 30; else if (/\b(an|one) hour\b/.test(s)) mins = 60;
    const start = /\b(start|begin|set|run|put on|give me|make|time me|let'?s|can you|could you|please|i want|i need|focus for)\b/.test(s);
    if (!start && !mins) return null;
    return {mins: Math.round(mins)};
  }
  /* The task a timer is for, from the words ("I'm working on my homework task", "for the bio lab"): the open task whose title (or
     type) shares the most words with the request, soonest due on a tie; the task in progress for "the task I'm working on". */
  const TSTOP = new Set("a an the my me i im i'm am is are on for to of and with task tasks timer focus minute minutes min mins hour hours start new set run working work doing do please can you could study session pomodoro now just".split(" "));
  function taskFor(q){
    const s = String(q || "").toLowerCase(), words = s.replace(/[^a-z0-9' ]+/g, " ").split(/\s+/).filter(w => w && !TSTOP.has(w) && !/^\d+$/.test(w));
    const open = Object.values(state.tasks || {}).filter(t => t && t.status !== "done" && !t.archived);
    if (!open.length) return null;
    let best = null, bs = 0;
    for (const t of open) {
      const tw = String(t.title || "").toLowerCase().replace(/[^a-z0-9' ]+/g, " ").split(/\s+/), type = String(t.type || "").toLowerCase();
      let sc = 0; words.forEach(w => { if (tw.some(x => x === w || (w.length > 3 && x.startsWith(w.replace(/s$/, ""))))) sc += 2; else if (type && (type === w || (w === "homework" && /assign|homework/.test(type)) || type.startsWith(w.replace(/s$/, "")))) sc += 1; });
      if (sc > bs || (sc === bs && sc > 0 && best && (t.due || "9") < (best.due || "9"))) { best = t; bs = sc; }
    }
    if (best && bs > 0) return best;
    if (/\b(the|my) (task|thing|work|assignment) i'?m (working on|doing)\b|\bcurrent task\b/.test(s)) return open.find(t => t.status === "doing") || null;
    return null;
  }
  function startTimer(mins, task){
    if (typeof pomoStart !== "function") return false;
    if (pomo.running || pomo.left > 0) pomoReset();
    pomo.taskId = task ? task.id : ""; pomo.mode = "focus"; pomo.left = 0; pomo.len = 0; pomo.preset = mins > 0 ? mins : 0; pomoSave();
    pomoStart();
    return pomo.running;
  }
  const APPQ_HOW = /^\s*(how|where|can i|is there|what)\b/i;
  // (a study plan, a schedule for the week, a summary, cards or a quiz are things to write or make, not a task to add)
  const ADD_Q = /^(?![^?]*\b(study plan|plan (for|my|out)|schedule (for|my) (the |this |next )?week|(make|create|write|give) (me )?(a |an )?(summary|outline|study guide|flash ?cards?|quiz|practice|mnemonic|concept map|mind map|note)\b))\s*(please\s+)?((can|could|would) you\s+)?(please\s+)?(add|create|make|put|schedule|set up|new)\b|\bremind me to\b/i;
  const ADD_WHAT = /\b(task|to-?do|reminder|assignment|homework|exam|quiz|test|midterm|final|reading|essay|paper|project|lab|study|remind me)\b/i;
  // "add a task to email Dr. Lee tomorrow at 3pm" -> {title: "Email Dr. Lee", due, time}
  function localTask(q){
    const today = todayISO(), WD = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"], MO = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
    let t = " " + String(q || "").replace(/\s+/g, " ").trim() + " ", due = "", time = "", m;
    const cut = re => { const x = t.match(re); if (x) t = t.replace(x[0], " "); return x; };
    if ((m = cut(/\s(?:at|by|@)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)(?=\W)/i))) { let h = Number(m[1]) % 12; if (/^p/i.test(m[3])) h += 12; time = String(h).padStart(2, "0") + ":" + (m[2] || "00"); }
    if ((m = cut(/\s(?:due\s+|by\s+|on\s+|for\s+)?(today|tonight)(?=\W)/i))) due = today;
    else if ((m = cut(/\s(?:due\s+|by\s+|on\s+|for\s+)?(tomorrow)(?=\W)/i))) due = addDays(today, 1);
    else if ((m = cut(/\s(?:due\s+|by\s+|on\s+|for\s+)?next week(?=\W)/i))) due = addDays(today, 7);
    else if ((m = cut(/\s(?:due\s+|by\s+|on\s+|for\s+)?(?:(this|next)\s+)?(sun|mon|tues?|wed(?:nes)?|thu(?:rs?)?|fri|sat(?:ur)?)(?:day)?(?=\W)/i))) {
      const w = WD.findIndex(x => x.startsWith(m[2].toLowerCase().slice(0, 3))), d0 = new Date(today + "T12:00:00").getDay(); let k = (w - d0 + 7) % 7; if (k === 0) k = 7; due = addDays(today, k); }
    else if ((m = cut(/\s(?:due\s+|by\s+|on\s+|for\s+)?(jan|feb|mar|apr|may|jun|jul|aug|sept?|oct|nov|dec)[a-z]*\.?\s+(\d{1,2})(?:st|nd|rd|th)?(?=\W)/i))) {
      const mo = MO.indexOf(m[1].toLowerCase().slice(0, 3)) + 1; let y = Number(today.slice(0, 4)), s2 = `${y}-${String(mo).padStart(2, "0")}-${String(m[2]).padStart(2, "0")}`; if (s2 < today) s2 = `${y + 1}${s2.slice(4)}`; if (ISO.test(s2)) due = s2; }
    else if ((m = cut(/\s(?:due\s+|by\s+|on\s+|for\s+)?(\d{1,2})\/(\d{1,2})(?=\W)/))) { let y = Number(today.slice(0, 4)), s2 = `${y}-${String(m[1]).padStart(2, "0")}-${String(m[2]).padStart(2, "0")}`; if (s2 < today) s2 = `${y + 1}${s2.slice(4)}`; if (ISO.test(s2)) due = s2; }
    t = t.replace(/^\s*(please\s+)?((can|could|would) you\s+)?(please\s+)?(add|create|make|put|schedule|set up)(\s+me)?(\s+(a|an|the|my))?(\s+new)?(\s+(task|to-?do|reminder|item))?(\s+(to|called|named|for|that says|saying|:))?\s*/i, " ")
      .replace(/^\s*remind me to\s*/i, " ").replace(/\s+(to|on|in)\s+my\s+(list|planner|tasks|to-?do list)\b/i, " ").replace(/\s+(please|thanks|thank you)\s*$/i, " ")
      .replace(/\s+(due|by|on|at|for)\s*$/i, " ").replace(/\s+/g, " ").trim().replace(/[.?!,;:]+$/, "");
    if (t.length < 2) return null;
    const type = /^\s*remind me\b/i.test(q) ? "Other" : /\b(exam|midterm|final)\b/i.test(t) ? "Exam" : /\bquiz\b/i.test(t) ? "Quiz" : /\btest\b/i.test(t) ? "Exam" : /\b(read|reading|chapter)\b/i.test(t) ? "Reading" : /\blab\b/i.test(t) ? "Lab" : /\bproject\b/i.test(t) ? "Project" : /\b(study|review)\b/i.test(t) ? "Study" : /\b(homework|assignment|essay|paper|problem set|worksheet)\b/i.test(t) ? "Assignment" : "Other";
    return {title: t.charAt(0).toUpperCase() + t.slice(1), due, time, type};
  }
  /* A change to a task, read from the words: "move my history essay to next monday", "mark care plan 2 as done", "push the lab
     report back 2 days", "delete buy scrubs", "rename X to Y", "make the midterm high priority". A change to confirm; no model. */
  const EDIT_Q = /^\s*(please\s+)?((can|could|would) you\s+)?(please\s+)?(move|reschedule|push|postpone|delay|change|mark|set|check off|complete|finish|delete|remove|cancel|rename|make|bump|shift)\b|\b(i (finished|completed|did|turned in|submitted|handed in)|is (done|finished|complete))\b/i;
  function quickEdit(q){
    const s = String(q || "").toLowerCase().replace(/\s+/g, " ").trim(), today = todayISO();
    if (!EDIT_Q.test(s)) return null;
    // the task it names: the open (or, for "undo done", any) task whose title shares the most words with the request
    const STOPW = new Set("a an the my me i to as for on by of it is be and move reschedule push postpone delay change mark set check off complete finish finished completed delete remove cancel rename make bump shift done back due date next this week day days monday tuesday wednesday thursday friday saturday sunday today tomorrow priority high low urgent medium task please can could would you in progress did turned submitted handed".split(" "));
    const qw = s.replace(/[^a-z0-9&' ]+/g, " ").split(" ").filter(w => w && !STOPW.has(w) && !/^\d+$/.test(w));
    let best = null, bs = 0;
    Object.values(state.tasks || {}).filter(t => t && !t.archived).forEach(t => { const tw = String(t.title || "").toLowerCase().replace(/[^a-z0-9&' ]+/g, " ").split(" ").filter(Boolean); let sc = 0; qw.forEach(w => { if (tw.some(x => x === w || (w.length > 3 && x.startsWith(w.replace(/s$/, ""))))) sc += 1; }); if (sc && t.status === "done" && !/\bnot done|undo|reopen|unmark\b/.test(s)) sc -= 0.5; if (sc > bs || (sc === bs && best && (t.due || "9") < (best.due || "9"))) { best = t; bs = sc; } });
    if (!best || bs < 1) return null;
    const refs = new Map([["T1", {kind: "task", id: best.id}]]), one = (field, value) => { const c = check({ref: "T1", field, value}, refs); return c ? [c] : null; };
    if (/\b(delete|remove|cancel)\b/.test(s)) return one("delete", "yes");
    let m;
    if ((m = String(q).match(/\brename\b.*?\bto\s+["“']?(.+?)["”']?\s*$/i))) return one("title", m[1].trim().replace(/^\w/, ch => ch.toUpperCase()));
    if (/\b(not done|undo|reopen|unmark|back to (to ?do|not done))\b/.test(s)) return one("status", "todo");
    if (/\b(done|complete|completed|finished|finish|check off|turned in|submitted|handed in)\b/.test(s) && !/\b(by|due|to (monday|tuesday|wednesday|thursday|friday|saturday|sunday|tomorrow))\b/.test(s)) return one("status", "done");
    if (/\b(in progress|started|working on|doing)\b/.test(s)) return one("status", "doing");
    if ((m = s.match(/\b(urgent|high|medium|med|low)\b(?:\s+priority)?/)) && /\bpriority|urgent|important\b/.test(s)) return one("priority", {medium: "med"}[m[1]] || m[1]);
    // a new due date: "to next monday", "to friday", "to dec 3"; or "back 2 days", "by a week"
    if ((m = s.match(/\b(?:back|forward|out|by)\s+(?:by\s+)?(a|one|two|three|four|five|\d+)\s+(day|days|week|weeks)\b/)) && best.due) {
      const n = ({a: 1, one: 1, two: 2, three: 3, four: 4, five: 5}[m[1]] || Number(m[1])) * (/week/.test(m[2]) ? 7 : 1), sign = /\bforward|earlier|sooner\b/.test(s) ? -1 : 1;
      return one("due", addDays(best.due, sign * n));
    }
    const lt = localTask(" date " + s.replace(/^.*?\b(to|until|till|for|on)\b/, " ") + " ");
    if (lt && lt.due) { const out = one("due", lt.due); if (out && lt.time) { const tc = check({ref: "T1", field: "time", value: lt.time}, refs); if (tc) out.push(tc); } return out; }
    return null;
  }
  // A new task from the request alone (the words, a course it names), as a change to confirm: no model needed
  function quickTask(q){
    const lt = localTask(q); if (!lt || lt.title.length < 3) return null;
    const c = window.SBTRUTH ? SBTRUTH.courseNamed(q) : null;
    // the course's name in the title is said by the course, not repeated in the title
    let title = lt.title; if (c) { [c.code, c.name].filter(Boolean).forEach(k => { const re = new RegExp("^(for |in )?" + k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b[:\\s-]*", "i"); if (re.test(title) && title.replace(re, "").length > 2) title = title.replace(re, ""); }); title = title.charAt(0).toUpperCase() + title.slice(1); }
    const r = resolve({newTasks: [{title, type: lt.type, due: lt.due, time: lt.time, course: c ? "C_" + c.id : ""}]}, new Map(c ? [["C_" + c.id.toUpperCase(), {kind: "course", id: c.id}]] : []));
    return r.changes[0] || null;
  }
  // An answer that says something was done when nothing was (no change, task, timer or place to show)
  const CLAIMS = /\b(i('ve| have)?|we('ve| have)?)\s+(just\s+)?(added|created|started|set( up)?|scheduled|changed|updated|moved|deleted|removed|renamed)\b|\b(has|have) been (added|created|started|set|scheduled|changed|updated|moved|deleted|removed)\b|\b(is|are) (now )?(added|set|started|running|scheduled|on your list)\b|\b(i'?ll|i will|let'?s|we'?ll)\s+(go ahead and\s+)?(set|start|add|create|schedule)\b[^.!?]{0,40}\b(timer|focus|pomodoro|reminder|task|alarm|event)\b|\bthe app will start\b/i;

  /* ---------- 8. Asking ---------- */
  const VISUAL = /\b(white ?board|board|draw|drew|drawing|diagram|sketch|picture|photo|image|pic|handwrit|wrote|written|graph|chart|map)\b/i;
  /* "Find my notes on the Krebs cycle", "which notes talk about WWI": the notes themselves, found by search (words and meaning),
     listed with a button to each. Any AI, and no AI at all: a small model shouldn't be the one looking. */
  const NOTES_FIND = /\b(find|show|which|where|search|look up|look for|pull up|open|get|any|do i have|did i (write|take|make))\b[^?]*\bnotes?\b|\bnotes? (on|about|for|from|that (mention|mentions|talk about|talks about|cover|covers|say|says))\b/i;
  async function findNotes(q){
    if (!NOTES_FIND.test(q) || /\b(make|create|write|add|save|put|new)\b[^?]*\bnote\b/i.test(q) && !/\b(find|show|which|search|look)\b/i.test(q)) return null;
    const topic = String((q.match(/\b(?:on|about|for|from|mention(?:s|ing)?|talk(?:s|ing)? about|cover(?:s|ing)?|say(?:s|ing)?|with|regarding)\s+(.+?)\s*[?.!]*$/i) || [])[1] || "")
      .replace(/^(?:my|the|a|an)\s+/i, "").replace(/\s+notes?$/i, "").trim();
    const all = Object.values(state.notes || {}).filter(n => n && !n.archived && String(n.text || "").trim());
    if (!all.length) return {answer: "You don't have any notes yet. Make one from Notes, or ask me to make a note for you.", show: [], changes: [], local: true};
    if (!topic) return null;
    const found = new Map();
    try { const R = window.SBSEARCH ? await SBSEARCH.retrieve(topic, {max: 16, wait: 800, readWait: 1, semWait: 2500}) : null;
      (R && R.rows || []).forEach(x => { if (x.doc && x.doc.type === "note" && state.notes[x.doc.id] && !state.notes[x.doc.id].archived) found.set(x.doc.id, state.notes[x.doc.id]); }); } catch (e) {}
    // and plain word matches, so a note is never missed while search is still getting ready
    const tw = topic.toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length > 2);
    all.forEach(n => { const t = String(n.text).toLowerCase(); if (tw.length && tw.every(w => t.includes(w.replace(/s$/, "")))) found.set(n.id, n); });
    const list = [...found.values()].slice(0, 5);
    const first = n => clip(String(n.text).replace(/\s*\n+\s*/g, " · ").trim(), 110);
    if (!list.length) return {answer: `I couldn't find a note about ${topic}. Try other words, or open Notes and search there.`, show: [], changes: [], local: true};
    return {answer: list.length === 1 ? `Your note about ${topic}: "${first(list[0])}".` : `${list.length} notes about ${topic}:\n${list.map(n => "- " + first(n)).join("\n")}`,
      show: list.map(n => ({kind: "note", id: n.id, label: labelOf({kind: "note", id: n.id})})), changes: [], local: true};
  }
  async function ask(q, o){
    o = o || {};
    { const fn = await findNotes(q).catch(e => { console.warn(e); return null; }); if (fn) return fn; }
    // The AI on the device (98-truth.js): a request with several things to do goes one at a time, and planner facts (what's due,
    // grades, when something is) come from the app itself, exact, with no model involved
    const dev = typeof aiOnDevice === "function" && aiOnDevice(), TR = window.SBTRUTH;
    if (dev && TR && !o.oneStep) {
      const parts = TR.steps(q);
      if (parts.length > 1) {
        const outs = [];
        for (const p of parts) { try { outs.push(await ask(p, Object.assign({}, o, {oneStep: true}))); } catch (e) { outs.push({answer: "", show: [], changes: []}); } }
        return {answer: outs.map(x => x.answer).filter(Boolean).join(" "), show: outs.flatMap(x => x.show || []).slice(0, 5), changes: outs.flatMap(x => x.changes || []), timer: Math.max(0, ...outs.map(x => x.timer || 0)), steps: parts.length};
      }
      const f = TR.facts(q);
      if (f) return {answer: f.answer, show: (f.show || []).filter(t => exists(t)).map(t => Object.assign({}, t, {label: labelOf(t)})), changes: [], local: true, facts: true};
      // a timer, or a task with what it needs in the words: done by the app straight away (fast and exact), no model
      const tm0 = timerMins(q);
      if (tm0 && !(ADD_Q.test(q) && ADD_WHAT.test(q) && !/\b(timer|pomodoro|focus)\b/i.test(q.replace(/\bfocus\b/i, "")))) {
        if (tm0.mins && (tm0.mins < 1 || tm0.mins > 180)) return {answer: "A focus timer can run from 1 minute to 3 hours. How long would you like?", show: [], changes: [], local: true};
        const tk = taskFor(q);
        if (startTimer(tm0.mins, tk)) { const n2 = Math.round(pomoLen() / 60000); return {answer: `Your ${n2}-minute focus timer is running${tk ? ` for ${tk.title}` : ""}. You've got this!`, show: tk ? [{kind: "task", id: tk.id, label: labelOf({kind: "task", id: tk.id})}] : [], changes: [], timer: n2, local: true}; }
      }
      // making study material (cards, a quiz, a note, a concept map): the chat makes it, with the button to open it
      if (/\b(make|create|generate|give me|build|write|draw)\b[^?]*\b(flash ?cards?|cards|quiz(zes)?|practice (questions|test)|concept map|mind map|note)\b|\bquiz me\b|\btest me\b/i.test(q) && !/\b(how (do|can) i)\b/i.test(q) && window.SBCOMPTAB && o.screen !== false) {
        setTimeout(() => { try { SBCOMPTAB.open(q); } catch (e) {} }, 300);
        return {answer: "On it: I'm making that in the chat.", show: [], changes: [], local: true};
      }
      // a change to a task they have ("make the midterm high priority", "move X to monday") before a new one
      const editFirst = /\b(priority|urgent|important|move|reschedule|push|postpone|delay|rename|mark|delete|remove|cancel|finished|completed|done)\b/i.test(q);
      const qe0 = editFirst && !APPQ_HOW.test(q) ? quickEdit(q) : null;
      const qc = !(qe0 && qe0.length) && ADD_Q.test(q) && ADD_WHAT.test(q) && !APPQ_HOW.test(q) ? quickTask(q) : null;
      if (qc) return {answer: "Here's the new task. Check it, then tap Add Task.", show: [], changes: [qc], local: true};
      const qe = qe0 || (!APPQ_HOW.test(q) ? quickEdit(q) : null);
      if (qe && qe.length && qe.every(c => c.from && c.from === c.to)) return {answer: `${qe[0].label} is already ${qe[0].to.toLowerCase()}.`, show: [{kind: "task", id: qe[0].t.id, label: qe[0].label}], changes: [], local: true};
      if (qe && qe.length) return {answer: qe.length === 1 && qe[0].field === "delete" ? `Delete ${qe[0].label}? Tap Review Change to confirm.` : `${qe[0].label}: ${qe.map(c => `${c.what.toLowerCase()} ${c.from ? c.from + " → " : ""}${c.to}`).join(", ")}. Tap Review Change to confirm.`, show: [], changes: qe, local: true};
    }
    // a question about the subject (on the device): answered from their own material first, then the web, in one focused call;
    // the whole planner would only distract a small model from it
    if (dev && TR && TR.general(q) && !/\b(white ?board|board|draw|drew|drawing|diagram|sketch|picture|photo|image|pic|handwrit)/i.test(q) && !appQ(q)) {
      const k = await TR.knowledge(q, {signal: o.signal});
      return {answer: k.answer, show: [], changes: [], sources: k.sources && k.sources.length ? k.sources : undefined, unsure: !k.found};
    }
    if (VISUAL.test(q)) await Promise.race([describeBoards(3, null, true), wait(9000)]);
    const cur = o.screen === false ? null : current();
    const cat = await catalog(q);
    // a general question ("what is osmosis?") on the device: their own notes first, then Wikipedia, as sources to answer from
    let sources = "";
    if (dev && TR && TR.general(q)) {
      const [mine, R] = await Promise.all([window.SBSEARCH ? SBSEARCH.retrieve(q, {max: 4, chars: 700, wait: 600, readWait: 1, semWait: 2000}).catch(() => null) : null, TR.research(q).catch(() => ({list: []}))]);
      const web = R.list || [];
      if (mine && mine.text) sources += `\n\nFROM THE STUDENT'S OWN NOTES AND FILES (use these first):\n${mine.text}`;
      if (web.length) sources += `\n\nFROM THE WEB (say where a fact comes from, like "according to Wikipedia" or "a 2019 study found"):\n${TR.webText(web)}`;
      o.web = web;
    }
    const me = window.SBCOMP && SBCOMP.tab && SBCOMP.tab.info ? (SBCOMP.tab.info() || {}) : {};
    const system = `You are ${me.name || "the student's study companion"}, living inside their Studyboard planner. Answer briefly and warmly in plain text (no markdown, no emojis, no links), at most 3 short sentences unless they asked for more. Reply to exactly what they said: add more only when it clearly helps with what they asked, never as filler, and a hello or thanks just gets a short friendly reply (no news about yourself and no question back unless they asked how you are). Use the student's own data below.\n${RULES}`;
    const prompt = [{text: `${appQ(q) ? GUIDE + "\n\n" : ""}THE STUDENT'S STUDYBOARD:\n${cat.text}${screenText(cur)}${sources}${o.extra ? `\n\nMORE ABOUT WHAT'S ON SCREEN:\n"""\n${clip(o.extra, 7000)}\n"""` : ""}\n\nTHE STUDENT ASKS: ${q}`}];
    const callAI = free => aiCall({task: "assist", maxTokens: 6000, temperature: free ? 0.5 : 0.3, schema: free ? null : SCHEMA, signal: o.signal, quiet: true, parts: prompt,
      system: free ? system + `\n\nReply with only a JSON object: {"answer": "your reply", "show": [refs], "changes": [], "newTasks": [], "focusMinutes": 0}. The answer is the reply itself, never a placeholder.` : system});
    // Always a real answer: the format, the format again, then a free reply; a moment between tries after an error. If the
    // AI can't be reached at all, the best match search finds is offered (and shown), made on this device.
    const junk = x => { x = String(x == null ? "" : x).trim(); return x.length < 2 || /^(string|text|str|answer|reply|response|\.{2,}|…|n\/?a|null|undefined|none|<[^>]*>|\{[\s\S]*\}|\[[\s\S]*\])$/i.test(x); };
    let r = null, lastErr = null;
    for (let i = 0; i < 3 && !r; i++) {
      try { const x = await callAI(i === 2); if (x && x.data && !junk(x.data.answer)) r = x; }
      catch (e) { lastErr = e; if (e && /^(nokey|key|cancelled|no-consent|blocked)$/.test(String(e.code || ""))) throw e; if (e && e.code === "limit" && !e.rate) break; await wait(1200 * (i + 1)); }
    }
    if (!r) {
      let best = null;
      try { const R = window.SBSEARCH ? await SBSEARCH.retrieve(q, {max: 3, chars: 300, wait: 600, readWait: 1, semWait: 1500}) : null; const d0 = R && R.rows && R.rows[0] && R.rows[0].doc;
        if (d0) best = d0.type === "chunk" ? {kind: "file", id: d0.fid, page: d0.label === "Page" ? d0.page : 0} : d0.type === "card" ? {kind: "card", deck: d0.pid, id: d0.id} : d0.type === "question" ? {kind: "question", deck: d0.pid, quiz: d0.qid, id: d0.id} : ["task", "note", "board", "course", "file", "deck", "event"].includes(d0.type) ? {kind: d0.type, id: d0.id} : null; } catch (e) {}
      const why = lastErr && lastErr.code === "limit" && !lastErr.rate ? "the AI allowance is used up for now" : navigator.onLine === false ? "you're offline" : lastErr && lastErr.code === "offline" ? "the AI can't be reached (check your internet)" : "the AI isn't answering right now";
      const L = window.SBLOCALANS, nx = L && L.NEXT_Q.test(q) ? L.nextLine().replace(/\*\*/g, "") : "", tk = best && best.kind === "task" && state.tasks[best.id];
      if (nx) return {answer: `I couldn't get a full answer because ${why}, but ${nx}.`, show: [], changes: [], local: true};
      if (best && exists(best)) return {answer: `I couldn't get a full answer because ${why}, but this looks like the best match: ${tk && L ? L.taskLine(tk).replace(/\*\*/g, "") : labelOf(best)}.`, show: [Object.assign(best, {label: labelOf(best)})], changes: [], local: true};
      return {answer: `I couldn't get an answer because ${why}. Ask me again in a moment?`, show: [], changes: [], local: true};
    }
    const d = r.data || {};
    // an answer that's only a command ("show N1") or a reference: said in words instead, naming what was found
    // the check (on the device): every number, date and name in the answer must be in what the AI was given. One that isn't: asked
    // once more, strictly; still there: the answer says it couldn't find it, instead of something made up
    if (dev && TR && d.answer && !(Array.isArray(d.changes) && d.changes.length) && !(Array.isArray(d.newTasks) && d.newTasks.length)) {
      // (Studyboard's own facts count too: the app guide, and this student's timer settings)
      let mine = ""; try { const pc = pomoCfg(); mine = `focus ${pc.focus} minutes, short break ${pc.short} minutes, long break ${pc.long} minutes`; } catch (e) {}
      const given = `${cat.text}${screenText(cur)}${o.extra || ""}${sources}\n${GUIDE}\n${mine}\n${q}`;
      let bad = TR.unsupported(d.answer, given);
      if (bad.length) {
        try {
          const r2 = await aiCall({task: "assist", maxTokens: 3000, temperature: 0.1, schema: SCHEMA, signal: o.signal, quiet: true, parts: prompt,
            system: system + `\n\nIMPORTANT: Use ONLY facts that appear above. Don't mention ${bad.slice(0, 6).join(", ")}: they aren't in what you were given. If the answer isn't there, say plainly that you couldn't find it in their Studyboard.`});
          const d2 = (r2 && r2.data) || {};
          if (d2.answer && !junk(d2.answer) && !TR.unsupported(d2.answer, given).length) { Object.assign(d, d2); bad = []; }
        } catch (e) {}
        if (bad.length) { d.answer = sources ? "I couldn't find a reliable answer to that in your notes or on Wikipedia." : "I couldn't find that in your Studyboard."; d.unsure = true; }
      }
    }
    // a focus timer: the AI starts it with focusMinutes; if it only said so (small models often do), the app reads the request
    const tm = timerMins(q), fm = Math.round(Number(d.focusMinutes) || 0);
    let timer = 0;
    if (fm >= 1 && fm <= 180 && (tm || /\b(timer|focus|pomodoro|session)\b/i.test(q))) timer = tm && tm.mins ? tm.mins : fm;
    else if (tm && (!tm.mins || (tm.mins >= 1 && tm.mins <= 180))) timer = tm.mins || -1;
    const tk2 = timer ? taskFor(q) : null;
    if (timer && startTimer(timer > 0 ? timer : 0, tk2)) { const n2 = Math.round(pomoLen() / 60000); return {answer: `Your ${n2}-minute focus timer is running${tk2 ? ` for ${tk2.title}` : ""}. You've got this!`, show: [], changes: [], timer: n2}; }
    // asked to add a task, and the AI didn't write one (small models often just say they did): the app reads it from the request
    const asked = ADD_Q.test(q) && ADD_WHAT.test(q) && !APPQ_HOW.test(q);
    if (asked && !(Array.isArray(d.newTasks) && d.newTasks.some(x => x && clip(x.title, 160)))) { const lt = localTask(q); if (lt) { d.newTasks = [lt]; d.answer = "Here's the new task. Check it, then tap Add Task."; } }
    const out = Object.assign({answer: aiWholeSentence(clip(d.answer, 1200))}, resolve(d, cat.refs));
    if (o.web && o.web.length && /wikipedia|wiktionary|stud(y|ies)|research|paper|according to/i.test(out.answer)) out.sources = o.web.map(x => ({title: x.title, url: x.url, src: x.src || "Wikipedia"}));
    // never say something was done when the app wasn't asked to do it
    if (!out.changes.length && !out.show.length && CLAIMS.test(out.answer)) out.answer = "I couldn't do that from here. Try asking another way, or do it in the app directly.";
    // filler, or a reply that never mentions what was asked about: their material and the web instead, or an honest "couldn't find"
    if (TR && TR.nonAnswer && !out.changes.length && !timer && TR.nonAnswer(q, out.answer)) {
      try { const k = await TR.knowledge(q, {signal: o.signal, noWeb: !TR.general(q)}); out.answer = k.found || TR.general(q) ? k.answer : "I couldn't work that out from your Studyboard. Try asking it another way, with the course or task name."; if (k.sources && k.sources.length) out.sources = k.sources; } catch (e) { if (e && /^(nokey|key|cancelled|no-consent|blocked)$/.test(String(e.code || ""))) throw e; }
    }
    if (/^\s*((show|open|go to|see)\s+)?[A-Z]{1,3}\d{1,4}\s*\.?$/i.test(out.answer) || junk(out.answer)) out.answer = out.show && out.show.length ? `Here it is: ${out.show[0].label}.` : out.changes && out.changes.length ? "Here's what I'd change." : "I couldn't find that. Try asking another way?";
    return out;
  }
  // Show what was found and offer the changes (the bubble does both at once)
  // o.shown: called once the app is there (the bubble speaks then, as going there redraws the page)
  async function act(res, o){
    o = o || {};
    if (!res) return;
    if (res.changes && res.changes.length) { await propose(res.changes, o); return; }
    if (res.show && res.show.length) await jump(res.show[0]);
    if (o.shown) try { o.shown(); } catch (e) {}
  }
  // Serializable copies, for chats kept on the device
  const pack = res => ({show: (res.show || []).map(t => Object.assign({}, t)), changes: (res.changes || []).map(c => Object.assign({}, c, {t: Object.assign({}, c.t)}))});

  /* What Studyboard is and where things are, for "how do I" and "where is" questions (kept to what the app really has) */
  const GUIDE = `HOW STUDYBOARD WORKS (for questions about the app itself; Settings is the gear at the bottom of the sidebar, or in the top bar on phones):
Pages (the sidebar; keys 1 to 7 switch pages):
- Board: Today's Plan (what to do today, fitted into the study hours per day) and the Task Board (To Do, In Progress, Done). The add bar takes a sentence like "bio quiz fri 2pm"; N adds a task; C opens Quick Capture anywhere; a photo of a whiteboard or slide dropped on the Board adds the tasks on it.
- Calendar: the Timeline, the week Schedule (classes, events and deadlines; click a class to move or skip one week, or Edit All Weeks) and Rough Week Rescue (plans a heavy week within the Weekly Hours Limit).
- Review: flashcard decks (study with spaced repetition; keys 1 to 4 rate a card) and quizzes, including AI practice quizzes made from course materials.
- Notes: sticky-note boards (several boards, one per course if you like) and whiteboards (draw, write, add pictures; handwriting can be turned into typed text).
- Courses: each course's page with its tasks and class times, a Grades tab (marks, weights, and what you need on the rest), a Lectures tab (each class with its notes and files, recordings and transcripts), and Files (upload or link files, Google Drive and OneDrive) and Emails.
- Companion: this chat (attach photos, PDFs or slides to make notes, flashcards, quizzes or tasks from them) and the Wardrobe to dress the companion up.
- Study Groups: share decks, quizzes and deadlines, plan sessions together, and a weekly challenge.
Tools: Search Everywhere (Ctrl+K or Cmd+K) finds tasks, cards, notes and text inside files, and can answer with AI; the Focus timer (pomodoro sessions on a task); the Calculator (sidebar; its corner button reads an equation selected anywhere on screen and solves it); the Style Shop (themes, flashcard styles, note shapes, pins and stickers); ? lists keyboard shortcuts; Ctrl+Z undoes.
Settings, by section:
- Account: sign in to keep everything in sync across devices; profile; change email or password; Studyboard Pro; Studyboard Credits; Restore Purchases; delete account.
- Appearance: Light, Dark or System; Style Shop; the study companion; animations; daily quote.
- Accessibility: text size; high contrast and calm backgrounds; language; spelling.
- Study Plan: area of study; Study Hours per Day; Weekly Hours Limit; Availability and Free Time (work and protected time); Learn My Pace; Exam Mode (the last 3 days before an exam point everything at it); Autopilot (Pro: moves missed study sessions overnight); Grades; Weekly Review; ${STREAK_HIDDEN ? "" : "Gentle Study Streak; "}Term Scrapbook.
- AI and Tools: AI Features; AI keys on all devices; Search Everywhere; Break Down an Assignment (milestones backward from the due date); Calculator; Print or Save as PDF.
- School and Calendar: Set Up Your Semester; Brightspace, Canvas, Blackboard and Moodle (due dates, grades and announcements); Import a Syllabus (a PDF becomes a course and its deadlines); School Days (holidays, reading week, rotating Day 1 to 6 or A/B schedules); Calendar Sync (Apple, Google or Outlook, live link or file); Study Groups.
- Notifications and Widgets: Reminders and Notifications; time zone; Quick Capture (share sheet, photos, Siri, Gemini, Bixby and Shortcuts); widgets; installing the app.
- Data and Backups: automatic backups to Google Drive or OneDrive (with an account); export a backup file; restore; import from Anki, Quizlet, Knowt, Todoist or Notion; export my data; Start a New Term; Archive; Recently Deleted (kept 30 days); clear all data.
- Help and About: replay the welcome setup; the app tour; page tips; keyboard shortcuts; report a bug or send feedback; crash reports; about, privacy and terms.
AI: free with a Google Gemini key (Settings, AI and Tools, AI Features), or Studyboard AI, included with paid Pro. AI makes flashcards and quizzes from slides and readings, reads syllabi and photos, explains, plans exam prep and grades practice answers.
Ask (here or the companion's bubble) can itself find and open anything, change things and settings, and add tasks; the student confirms each change.
If you're not sure a feature exists, say where in Settings to look rather than inventing steps.`;
  const APPQ = /\b(how (do|can|to|would)\b(?!\s+(?:it|they|this|that|the|a|an|its|these|those|insulin|cells?|plants?|neurons?|hearts?|blood|body|people)\b)|where (is|are|do|can|did)|can (i|you|studyboard)|is there|does (it|studyboard|the app)|feature|setting|settings|studyboard|app|button|tab|page|turn (on|off)|set ?up|import|export|sync|share|widget|calculator|whiteboard|focus timer|pomodoro|streak|pro\b|subscription|backup|restore|theme|dark mode|shortcut|keyboard|notification|remind|canvas|brightspace|moodle|blackboard|syllabus|archive|delete|undo|companion|wardrobe|scrapbook|exam mode|autopilot|group)\b/i;
  const appQ = q => APPQ.test(String(q || ""));

  // Test handle (only when a test page sets window.__SB_TEST)
  if (window.__SB_TEST) window.__sbApp = {get state(){ return state; }, get ui(){ return ui; }, render: () => render(), get dlg(){ return dlg; }, undoLast: () => undoLast()};
  window.SBASSIST = {quickEdit, findNotes, taskFor, addNow, quickTask, timerMins, CLAIMS, ask, act, jump, propose, catalog, resolve, current, screenText, describeBoards, pack, here, wants, GUIDE, appQ, RULES, SHOW_CHANGE, labelOf, exists};
})();
