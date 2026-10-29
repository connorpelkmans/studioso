/* ===== module: 98-scrapbook.js ===== */
/* Studyboard 1.11.0 */
(() => {
  const A = SCRAP_ART;
  const W = 1000, BASE_H = 1400, STK = 150, WASHI = [260, 60], FRAME = 300;
  const nowMin = () => Math.round(Date.now() / 6e4);
  const minMs = m => m * 6e4;
  const ls = (k, v) => { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) {} return null; };
  const locked = tier => tier === "pro" && typeof PLAN !== "undefined" && PLAN.paywall() && !PLAN.isPro();
  const proSheet = why => { if (typeof PLAN !== "undefined") PLAN.openSheet(why); };
  const PRO_WHY = "Extra page designs and decorations are part of Studyboard Pro. Every milestone, sticker and Save as Image stays free.";
  const clampN = (v, a, b) => Math.max(a, Math.min(b, v));
  const hash = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967296; };
  const plural = (n, w, ws) => `${n} ${n === 1 ? w : (ws || w + "s")}`;
  const BOOK = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5.5C4 4.7 4.7 4 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5z"/><path d="M20 5.5c0-.8-.7-1.5-1.5-1.5H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5z"/><path d="M7 8h1.5M15.5 8H17"/></svg>`;

  /* Terms */
  function termName(startISO){
    const d = parse(addDays(startISO, 30)), m = d.getMonth();
    return `${m <= 4 ? "Spring" : m <= 7 ? "Summer" : "Fall"} ${d.getFullYear()}`;
  }
  function academicStart(today){
    const d = parse(today), y = d.getFullYear(), m = d.getMonth();
    return m >= 8 ? `${y}-09-01` : m >= 4 ? `${y}-05-01` : `${y}-01-01`;
  }
  // First run: from the last "Start a New Term", else the earliest of this term's tasks
  function guessStart(){
    const today = todayISO();
    const archAt = Math.max(0, ...allCourses().filter(c => c.archived).map(c => Number(c.archivedAt) || 0), ...allTasks().filter(t => t.archivedTerm).map(t => Number(t.archivedAt) || 0));
    if (archAt && Date.now() - archAt < 200 * 864e5) return iso(new Date(archAt));
    const acad = academicStart(today), floor = addDays(acad, -45);
    const ds = allTasks().filter(t => !t.archivedTerm).flatMap(t => [t.created ? iso(new Date(t.created)) : "", t.start || ""]).concat(coursesArr().map(c => c.created ? iso(new Date(c.created)) : ""))
      .filter(d => d && d >= floor && d <= today).sort();
    return ds.length && ds[0] < acad ? ds[0] : acad;
  }
  const DEFAULT_DECOR = () => [["w", "dots", 118, 46, -21, 80, ""], ["w", "stripe", 884, 46, 19, 80, ""]];
  function newPage(start, name){
    return {id: uid(), n: name || termName(start), s: start, g: {"term-start": nowMin()}, p: {}, d: DEFAULT_DECOR(), pp: "cream"};
  }
  const SC = () => (state.settings && state.settings.scrap) || null;
  function saveSc(sc){
    const before = JSON.stringify(SC());
    if (before === JSON.stringify(sc)) return false;
    state.settings = Object.assign({}, state.settings, {scrap: sc});
    saveSettings();
    return true;
  }
  const edit = fn => { const sc = clone(SC()); if (!sc) return null; fn(sc); saveSc(sc); return sc; };

  /* Milestones */
  const CATS = [["start", "Getting Started"], ["goals", "Term Goals"], ["tasks", "Study Habits"], ["grades", "Grades"], ["streaks", "Streaks"], ["focus", "Focus"], ["cards", "Flashcards and Practice"], ["together", "Together"], ["term", "Term"]];
  const pctTxt = v => Math.round(v) + "%";
  const cnt = (need, unit, key) => ({need, unit, v: c => c[key]});
  /* Term Goals: Bronze, Silver and Gold stickers you can reach down several different paths */
  const GOAL_TIERS = [["bronze", "Bronze"], ["silver", "Silver"], ["gold", "Gold"]];
  const cntSt = (v, n, unit) => ({p: Math.min(1, v / n), text: `${Math.min(v, n).toLocaleString()} of ${n.toLocaleString()} ${unit}`});
  const GOAL_PATHS = [
    // Rewards follow effort and consistency (days you studied, weeks you kept up), never how many tasks were ticked off:
    // counting tasks rewards splitting work into trivial pieces
    {k: "days", name: "Study Days", t: [15, 35, 55], st: (c, n) => cntSt(c.studyDays, n, "study days")},
    {k: "ontime", name: "On-Time Weeks", t: [3, 6, 10], st: (c, n) => cntSt(c.ontimeWeeks, n, "weeks with everything handed in on time")},
    {k: "focus", name: "Focus", t: [8, 20, 40], st: (c, n) => cntSt(Math.floor(c.focusMin / 6) / 10, n, "focus hours")},
    {k: "streak", name: "Streak", t: [5, 14, 28], half: true, st: (c, n) => cntSt(c.streak, n, "days in a row")},
    {k: "cards", name: "Flashcards", t: [150, 400, 900], st: (c, n) => cntSt(c.reviewed, n, "cards reviewed")},
    {k: "quiz", name: "Practice Quizzes", t: [3, 6, 12], st: (c, n) => cntSt(c.quizzes.length, n, "quizzes finished")},
    {k: "marks", name: "Marks Logged", t: [3, 6, 10], avg: [0, 0, 70], st: (c, n, r, a) => {
      const avg = c.marks.length ? c.marks.reduce((s, t) => s + markPct(t), 0) / c.marks.length : 0;
      return {p: Math.min(1, c.marks.length / n, a ? avg / a : 1), text: `${Math.min(c.marks.length, n)} of ${n} marks recorded${a ? `, average ${c.marks.length ? Math.round(avg) : 0}% (need ${a}%)` : ""}`}; }}
  ];
  // The paths for one tier, with this term's scaled targets and how far along each is
  function goalPaths(i, c){
    return GOAL_PATHS.map(p => {
      const f = p.half ? .5 + c.scale / 2 : c.scale, n = Math.max(p.half ? 3 : 2, Math.round(p.t[i] * f));
      return Object.assign({k: p.k, name: p.name, n}, p.st(c, n, p.r ? p.r[i] : 0, p.avg ? p.avg[i] : 0));
    });
  }
  const goalTier = (i, id, name, goal) => ({id, cat: "goals", name, goal, need: 1, special: i === 2, tier: i,
    v: c => Math.max(...goalPaths(i, c).map(p => p.p)),
    prog: c => { const b = goalPaths(i, c).sort((a, z) => z.p - a.p)[0]; return `Closest path: ${b.name}. ${b.text}`; }});
  const M = [
    {id: "term-start", cat: "start", name: "Hello, New Term", goal: "Earned when your term's page opens.", need: 1, v: () => 1},
    {id: "first-course", cat: "start", name: "First Course Added", goal: "Add a course for this term.", need: 1, v: c => c.courses ? 1 : 0},
    {id: "first-task", cat: "start", name: "First Study Day", goal: "Study on any day this term: finish a task, focus, tick a step or review flashcards.", need: 1, v: c => c.studyDays},
    {id: "week-planned", cat: "start", name: "First Week Planned", goal: "Have 5 tasks with due dates in one week.", need: 5, unit: "tasks due in one week", v: c => c.bestWeekPlanned},
    goalTier(0, "term-bronze", "Bronze Term Goal", "Reach any one Bronze path: study days, on-time weeks, focus, streak, flashcards, quizzes or marks."),
    goalTier(1, "term-silver", "Silver Term Goal", "Reach any one Silver path. A steady term, your way."),
    goalTier(2, "term-gold", "Gold Term Goal", "Reach any one Gold path. A standout term."),
    Object.assign({id: "tasks-10", cat: "tasks", name: "10 Study Days", goal: "Study on 10 different days this term."}, cnt(10, "study days", "studyDays")),
    Object.assign({id: "tasks-25", cat: "tasks", name: "25 Study Days", goal: "Study on 25 different days this term."}, cnt(25, "study days", "studyDays")),
    Object.assign({id: "tasks-50", cat: "tasks", name: "40 Study Days", goal: "Study on 40 different days this term."}, cnt(40, "study days", "studyDays")),
    Object.assign({id: "tasks-100", cat: "tasks", name: "60 Study Days", goal: "Study on 60 different days this term. Rest days are part of it.", special: true}, cnt(60, "study days", "studyDays")),
    {id: "clean-sweep", cat: "tasks", name: "Clean Sweep Week", goal: "Finish every task due in one week by its due date (at least 3 tasks).", need: 1, v: c => c.sweep ? 1 : 0,
      prog: c => c.weekNow.n ? `This week: ${c.weekNow.ok} of ${c.weekNow.n} done on time` : "No tasks due this week yet"},
    {id: "early-bird", cat: "tasks", name: "Early Bird", goal: "Start studying for an exam or quiz 5 or more days before it, and study for it on 3 different days.", need: 1, v: c => c.nSpread,
      prog: c => c.spreadBest ? `Best so far: ${c.spreadBest[1]}, studied on ${c.spreadBest[0]} day${c.spreadBest[0] === 1 ? "" : "s"}` : "Study for an upcoming exam a little on several days"},
    {id: "study-plan", cat: "tasks", name: "Study Plan Made", goal: "Make a Study Plan for an exam or quiz.", need: 1, v: c => c.plans ? 1 : 0},
    {id: "plan-follow", cat: "tasks", name: "Study Plan Complete", goal: "Finish every session in a Study Plan (3 or more) before the exam.", need: 1, v: c => c.planDone ? 1 : 0,
      prog: c => c.planBest ? `Best plan so far: ${c.planBest[0]} of ${c.planBest[1]} sessions done` : "Make a Study Plan first"},
    {id: "exam-done", cat: "tasks", name: "Exam Day Done", goal: "Mark an exam or quiz as done.", need: 1, v: c => c.nExams},
    {id: "rescue", cat: "tasks", name: "Rough Week, Handled", goal: "Use Rough Week Rescue to lighten a busy week.", need: 1, v: c => c.flag("rs")},
    {id: "first-mark", cat: "grades", name: "First Mark In", goal: "Record a mark for any task.", need: 1, v: c => c.marks.length},
    {id: "mark-80", cat: "grades", name: "80% or More", goal: "Get a mark of 80% or more.", need: 1, v: c => c.bestMark >= 80 ? 1 : 0, prog: c => c.marks.length ? `Best mark so far: ${pctTxt(c.bestMark)}` : "No marks recorded yet"},
    {id: "mark-90", cat: "grades", name: "90% or More", goal: "Get a mark of 90% or more.", need: 1, v: c => c.bestMark >= 90 ? 1 : 0, prog: c => c.marks.length ? `Best mark so far: ${pctTxt(c.bestMark)}` : "No marks recorded yet"},
    {id: "on-target", cat: "grades", name: "On Target", goal: "Have a course average at or above your target grade (2 or more marks).", need: 1, v: c => c.onTarget ? 1 : 0,
      prog: c => !c.gradesOn ? "Open Grades to set a target" : c.targetBest ? `${c.targetBest.name}: ${pctTxt(c.targetBest.cur)} of your ${pctTxt(c.targetBest.goal)} target` : "Set a target grade for a course in Grades"},
    {id: "all-passing", cat: "grades", name: "Passing Everything", goal: "Be above the pass mark in every course with marks (3 or more marks).", need: 1, v: c => c.allPass ? 1 : 0,
      prog: c => c.marks.length < 3 ? `${c.marks.length} of 3 marks recorded` : `${c.passN} of ${c.withMarksN} courses above the pass mark`},
    {id: "comeback", cat: "grades", name: "Level Up", goal: "Beat your last mark in the same course.", need: 1, v: c => c.improved ? 1 : 0},
    {id: "all-in", cat: "grades", name: "All Marks In", goal: "Have every graded item in a course marked (3 or more).", need: 1, v: c => c.allIn ? 1 : 0,
      prog: c => c.mostMarked ? `${c.mostMarked.name}: ${pctTxt(c.mostMarked.w)} of the grade marked` : "No marks recorded yet"},
    Object.assign({id: "streak-3", cat: "streaks", name: "3-Day Streak", goal: "Study 3 days in a row. Rest days don't break it."}, cnt(3, "days", "streak")),
    Object.assign({id: "streak-7", cat: "streaks", name: "7-Day Streak", goal: "Study 7 days in a row. Rest days don't break it."}, cnt(7, "days", "streak")),
    Object.assign({id: "streak-14", cat: "streaks", name: "14-Day Streak", goal: "Study 14 days in a row. Rest days don't break it."}, cnt(14, "days", "streak")),
    Object.assign({id: "streak-30", cat: "streaks", name: "30-Day Streak", goal: "Study 30 days in a row. Rest days don't break it."}, cnt(30, "days", "streak")),
    Object.assign({id: "streak-60", cat: "streaks", name: "60-Day Streak", goal: "Study 60 days in a row. Rest days don't break it.", special: true}, cnt(60, "days", "streak")),
    {id: "first-focus", cat: "focus", name: "First Focus Session", goal: "Finish a focus session.", need: 1, v: c => c.focusMin > 0 ? 1 : 0},
    Object.assign({id: "focus-5", cat: "focus", name: "5 Focus Hours", goal: "Focus for 5 hours this term."}, cnt(5, "hours", "focusH")),
    Object.assign({id: "focus-15", cat: "focus", name: "15 Focus Hours", goal: "Focus for 15 hours this term."}, cnt(15, "hours", "focusH")),
    Object.assign({id: "focus-30", cat: "focus", name: "30 Focus Hours", goal: "Focus for 30 hours this term."}, cnt(30, "hours", "focusH")),
    Object.assign({id: "focus-60", cat: "focus", name: "60 Focus Hours", goal: "Focus for 60 hours this term.", special: true}, cnt(60, "hours", "focusH")),
    {id: "steady-week", cat: "focus", name: "Steady Week", goal: "Focus on 5 different days in one week (15 minutes or more each).", need: 5, unit: "days in your best week", v: c => c.steady},
    {id: "first-deck", cat: "cards", name: "First Deck", goal: "Make a flashcard deck with at least 5 cards.", need: 1, v: c => c.newDeck ? 1 : 0},
    Object.assign({id: "cards-100", cat: "cards", name: "100 Cards Reviewed", goal: "Review 100 flashcards this term."}, cnt(100, "cards reviewed", "reviewed")),
    Object.assign({id: "cards-500", cat: "cards", name: "500 Cards Reviewed", goal: "Review 500 flashcards this term."}, cnt(500, "cards reviewed", "reviewed")),
    {id: "deck-learned", cat: "cards", name: "Deck Mastered", goal: "Learn every card in a deck of 10 or more.", need: 1, v: c => c.mastered ? 1 : 0,
      prog: c => c.deckBest ? `${c.deckBest.name}: ${c.deckBest.n} of ${c.deckBest.of} cards learned` : "Make a deck with 10 or more cards"},
    {id: "quiz-85", cat: "cards", name: "Quiz Whiz", goal: "Score 85% or more on a practice quiz (5 or more questions).", need: 1, v: c => c.bestQuiz >= 85 ? 1 : 0,
      prog: c => c.quizzes.length ? `Best score so far: ${pctTxt(c.bestQuiz)}` : "No practice quizzes yet"},
    Object.assign({id: "quiz-5", cat: "cards", name: "Practice Makes Progress", goal: "Finish 5 practice quizzes this term."}, {need: 5, unit: "quizzes", v: c => c.quizzes.length}),
    {id: "study-together", cat: "together", name: "Study Together", goal: "Focus with classmates in a Study Together room.", need: 1, v: c => c.flag("rm")},
    {id: "shared-deck", cat: "together", name: "Shared a Deck", goal: "Share a flashcard deck with classmates.", need: 1, v: c => c.shared ? 1 : 0},
    {id: "study-group", cat: "together", name: "Study Buddies", goal: "Join or make a study group.", need: 1, v: c => c.flag("gp")},
    {id: "term-end", cat: "term", name: "Term Complete", goal: "Finish the term with Start a New Term. Your page is kept in the Archive.", need: 1, v: () => 0, special: true}
  ];
  // Tier level of the ribbon (bronze 1, silver 2, gold 3, rainbow 4)
  const TIER = {"term-bronze": 2, "term-silver": 3, "term-gold": 4, "tasks-10": 1, "tasks-25": 2, "tasks-50": 3, "tasks-100": 4, "streak-7": 1, "streak-14": 2, "streak-30": 3, "streak-60": 4, "focus-5": 1, "focus-15": 2, "focus-30": 3, "focus-60": 4, "cards-100": 2, "cards-500": 3, "mark-80": 2, "mark-90": 3};
  const MI = Object.fromEntries(M.map((m, i) => [m.id, Object.assign(m, {i})]));
  const keyName = k => (MI[k] || {}).name || "Sticker";
  const keyOrder = k => (MI[k] || {i: 99}).i;

  /* What the student has done this term */
  const markPct = t => t && t.mark && Number(t.mark.outOf) > 0 && isNum(t.mark.got) ? Number(t.mark.got) / Number(t.mark.outOf) * 100 : null;
  // Added already finished (imported from a school site, or created as done)
  const bornDone = t => !!(t.created && t.doneAt && t.doneAt - t.created < 60000);
  const dayOf = ms => iso(new Date(ms));
  function context(sc, lab){
    const page = sc.cur, start = page.s, startMs = parse(start).getTime(), today = todayISO(), startMin = Math.round(startMs / 6e4);
    const inTerm = t => !t.archivedTerm || (lab && t.archivedTerm === lab);
    const liveCourses = allCourses().filter(x => !x.archived || (lab && x.archived === lab));
    const active = allTasks().filter(t => inTerm(t) && !bornDone(t));
    const done = active.filter(t => t.status === "done" && doneTime(t) >= startMs);
    const c = {start, today, done, nDone: done.length, courses: liveCourses.length > 0,
      flag: k => sc.f && sc.f[k] >= startMin ? 1 : 0};
    c.nEarly = done.filter(t => t.doneAt && t.due && !t.prepFor && dayOf(t.doneAt) <= addDays(t.due, -2)).length;
    // Study days this term: any day with a task finished, focus or logged time, a checklist step or flashcards
    c.studyDays = window.SBSTREAK && SBSTREAK.studyDays ? SBSTREAK.studyDays(start, today).length : new Set(done.map(t => dayOf(doneTime(t)))).size;
    c.nExams = done.filter(t => MILESTONE(t.type)).length;
    const dueDone = done.filter(t => t.due && !t.prepFor);
    c.nDue = dueDone.length; c.nOnTime = dueDone.filter(t => t.doneAt && dayOf(t.doneAt) <= t.due).length;
    const lastDue = active.reduce((m, t) => t.due && t.due >= start && t.due > m ? t.due : m, start);
    c.termWeeks = lastDue === start ? 15 : Math.max(8, Math.min(20, Math.round((parse(lastDue < today ? today : lastDue) - startMs) / (7 * 864e5))));
    c.scale = c.termWeeks / 15;
    const onTime = t => t.status === "done" && (t.doneAt ? dayOf(t.doneAt) <= t.due : true);
    const weeks = []; for (let m = mondayOf(start); m <= addDays(mondayOf(today), 7); m = addDays(m, 7)) weeks.push(m);
    c.bestWeekPlanned = 0; c.sweep = false; c.weekNow = {n: 0, ok: 0}; c.ontimeWeeks = 0;
    weeks.forEach(m => {
      const e = addDays(m, 6), due = active.filter(t => t.due >= m && t.due <= e && t.due >= start);
      c.bestWeekPlanned = Math.max(c.bestWeekPlanned, due.length);
      if (m > today) return;
      const ok = due.filter(onTime).length;
      if (due.length >= 3 && ok === due.length) c.sweep = true;
      if (e < today && due.length >= 1 && ok === due.length) c.ontimeWeeks++;
      if (m === mondayOf(today)) c.weekNow = {n: due.length, ok};
    });
    const exams = active.filter(t => MILESTONE(t.type) && t.due >= start);
    const sessions = id => active.filter(t => t.prepFor === id);
    // Exams studied for on 3+ days, starting 5+ days before (spacing)
    c.nSpread = 0; c.spreadBest = null;
    exams.forEach(ex => { const n = typeof examStudyDays === "function" ? examStudyDays(ex).length : 0; if (typeof examSpread === "function" && examSpread(ex)) c.nSpread++; if (n && (!c.spreadBest || n > c.spreadBest[0])) c.spreadBest = [n, ex.title]; });
    c.plans = active.some(t => t.prepFor && (t.due >= start || (t.created || 0) >= startMs));
    c.planDone = false; c.planBest = null;
    exams.forEach(ex => { const ss = sessions(ex.id); if (!ss.length) return; const n = ss.filter(t => t.status === "done" && (!t.doneAt || dayOf(t.doneAt) <= ex.due)).length;
      if (ss.length >= 3 && n === ss.length) c.planDone = true;
      if (!c.planBest || n / ss.length > c.planBest[0] / c.planBest[1]) c.planBest = [n, ss.length]; });
    c.marks = allTasks().filter(t => inTerm(t) && markPct(t) != null && (t.due || dayOf(doneTime(t))) >= start);
    c.bestMark = Math.max(0, ...c.marks.map(markPct));
    const G = window.__sbGrades;
    c.gradesOn = !!(G && G.courseGrade);
    const grs = c.gradesOn ? liveCourses.map(x => { try { return G.courseGrade(x.id); } catch (e) { return null; } }).filter(Boolean) : [];
    const withMarks = grs.filter(g => g.marked && g.marked.length && g.current != null);
    c.withMarksN = withMarks.length;
    c.passN = withMarks.filter(g => g.current >= g.g.pass).length;
    c.allPass = c.marks.length >= 3 && withMarks.length > 0 && c.passN === withMarks.length;
    const tg = withMarks.filter(g => g.g.goal);
    c.onTarget = tg.some(g => g.marked.length >= 2 && g.current >= g.g.goal - 1e-9);
    const best = tg.sort((a, b) => (b.current - b.g.goal) - (a.current - a.g.goal))[0];
    c.targetBest = best ? {name: courseLabel(best.c), cur: best.current, goal: best.g.goal} : null;
    c.allIn = grs.some(g => g.done && g.marked.length >= 3);
    const mm = grs.filter(g => g.marked.length).sort((a, b) => b.wMarked - a.wMarked)[0];
    c.mostMarked = mm ? {name: courseLabel(mm.c), w: mm.wMarked} : null;
    c.improved = false;
    const byCourse = {}; c.marks.forEach(t => (byCourse[t.courseId || "-"] = byCourse[t.courseId || "-"] || []).push(t));
    Object.values(byCourse).forEach(ts => { ts.sort((a, b) => ((a.due || "") < (b.due || "") ? -1 : (a.due || "") > (b.due || "") ? 1 : doneTime(a) - doneTime(b)));
      for (let i = 1; i < ts.length; i++) if (markPct(ts[i]) > markPct(ts[i - 1]) + .5) c.improved = true; });
    c.streak = Math.max(Number(sc.hi && sc.hi.st) || 0, rewardStreak().cur);
    const S = typeof SBSTATS !== "undefined" ? SBSTATS : null;
    const logged = S ? S.focusMinutes(start, today) : 0;
    const fromTasks = allTasks().filter(inTerm).reduce((s, t) => s + (Number(t.focusMin) || 0), 0);
    c.focusMin = Math.max(logged, fromTasks);
    c.focusH = Math.floor(c.focusMin / 60);
    const perWeek = {};
    Object.entries(S ? S.focusDays() : {}).forEach(([d, m]) => { if (d >= start && d <= today && Number(m) >= 15) { const k = mondayOf(d); perWeek[k] = (perWeek[k] || 0) + 1; } });
    c.steady = Math.max(0, ...Object.values(perWeek));
    const decks = Object.values(state.decks || {}).filter(d => !d.archived || (lab && d.archived === lab));
    const seen = d => (d.cards || []).reduce((s, x) => s + (Number(x.seen) || 0), 0);
    c.db = Object.assign({}, sc.db || {}); c.dbDirty = false;
    decks.forEach(d => { if (!(d.id in c.db)) { c.db[d.id] = (d.created || 0) >= startMs && !d.sharedFrom ? 0 : seen(d); c.dbDirty = true; } });
    c.reviewed = Math.max(Number(sc.hi && sc.hi.rv) || 0, decks.reduce((s, d) => s + Math.max(0, seen(d) - (c.db[d.id] || 0)), 0));
    c.newDeck = decks.some(d => (d.created || 0) >= startMs && !d.sharedFrom && (d.cards || []).length >= 5);
    c.mastered = decks.some(d => d.cards.length >= 10 && d.cards.every(x => (Number(x.box) || 0) >= 4));
    const db = decks.filter(d => d.cards.length >= 10).map(d => ({name: d.name, n: d.cards.filter(x => (Number(x.box) || 0) >= 4).length, of: d.cards.length})).sort((a, b) => b.n / b.of - a.n / a.of)[0];
    c.deckBest = db || null;
    c.quizzes = decks.flatMap(d => (d.quizzes || []).concat(...(d.aiQuizzes || []).map(q => q.results || []))).filter(r => r && r.at >= startMs && Number(r.total) >= 3);
    c.bestQuiz = Math.max(0, ...c.quizzes.filter(r => Number(r.total) >= 5).map(r => Number(r.score) / Number(r.total) * 100));
    c.shared = decks.some(d => d.shared && d.shared.at >= startMs) || !!c.flag("sh");
    return c;
  }
  function progressOf(m, c, page){
    const got = !!(page.g && page.g[m.id]);
    const v = Math.max(0, Number(m.v(c)) || 0), p = Math.min(1, v / m.need);
    let text = m.prog ? m.prog(c) : m.unit ? `${Math.min(v, m.need).toLocaleString()} of ${m.need.toLocaleString()} ${m.unit}` : got ? "Done" : "Not yet";
    if (m.id === "term-end") text = "When the term ends";
    return {got, v, need: m.need, p: got ? 1 : p, text};
  }

  /* Earning */
  let evalT = 0, lastCtx = null;
  const pending = [];
  function schedule(ms){ clearTimeout(evalT); evalT = setTimeout(evaluate, ms == null ? 4000 : ms); }
  function evaluate(opts){
    opts = opts || {};
    let sc = SC();
    if (!sc) return init();
    sc = clone(sc);
    sc.f = sc.f || {}; sc.hi = sc.hi || {};
    const c = context(sc, opts.lab); lastCtx = c;
    if (c.dbDirty) sc.db = c.db;
    sc.hi.st = c.streak; sc.hi.rv = c.reviewed;
    const page = sc.cur, fresh = [];
    page.g = page.g || {};
    M.forEach(m => { if (m.id === "term-end" || page.g[m.id]) return; if ((Number(m.v(c)) || 0) >= m.need) { page.g[m.id] = nowMin(); fresh.push(m.id); } });
    saveSc(sc);
    if (fresh.length && !opts.quiet) { pending.push(...fresh); flushToast(); if (ui.tab === "scrapbook") paint(fresh); }
    return fresh;
  }
  // The first time
  function init(){
    if (SC()) return [];
    if (typeof sbUser !== "undefined" && sbUser && typeof cloud !== "undefined" && !cloud.on && initTries++ < 6) { setTimeout(init, 3000); return []; }
    const start = guessStart();
    const sc = {v: 1, cur: newPage(start), past: [], db: {}, hi: {}, f: {}, toast: true};
    saveSc(sc);
    const fresh = evaluate({quiet: true}) || [];
        return fresh;
  }
  let initTries = 0;

  /* Gentle toasts */
  const TOAST_GAP = 3 * 60e3, K_T = "studyboard:scrapToastAt";
  let toastTimer = 0;
  function toastBusy(){ const t = document.getElementById("toast"); return !!(t && t.classList.contains("show")); }
  function quietToast(msg, key, still){
    const sc = SC(); if (sc && sc.toast === false) return;
    if (still && !still()) return;
    if (document.hidden || toastBusy() || (dlg && dlg.open)) { clearTimeout(toastTimer); toastTimer = setTimeout(() => quietToast(msg, key, still), 3000); return; }
    ls(K_T, String(Date.now()));
    toast(msg, null, {label: "See It", fn: () => openBook(null, key)});
  }
  function flushToast(){
    clearTimeout(toastTimer);
    if (!pending.length) return;
    const sc = SC(); if (sc && sc.toast === false) { pending.length = 0; return; }
    if (ui.tab === "scrapbook") { pending.length = 0; return; }
    const last = Number(ls(K_T)) || 0, wait = Math.max(0, last + TOAST_GAP - Date.now());
    if (wait || document.hidden || toastBusy() || (dlg && dlg.open)) { toastTimer = setTimeout(flushToast, Math.max(3000, wait)); return; }
    const rank = k => { const m = MI[k]; return m ? (m.special ? 20 : 0) + (TIER[k] || 0) * 2 - m.i / 100 : 1; };
    const ks = [...new Set(pending.splice(0))].sort((a, b) => rank(b) - rank(a));
    const first = ks[0];
    ls(K_T, String(Date.now()));
    toast(ks.length === 1 ? `New Sticker: ${keyName(first)}` : ks.length === 2 ? `New Stickers: ${keyName(first)} and ${keyName(ks[1])}` : `${ks.length} New Stickers, Including ${keyName(first)}`, null, {label: "See It", fn: () => openBook(null, first)});
  }
  document.addEventListener("visibilitychange", () => { if (!document.hidden && pending.length) setTimeout(flushToast, 1500); });

  /* A new term closes this page */
  function summaryOf(sc, lab){
    const c = lastCtx && lastCtx.start === sc.cur.s ? lastCtx : context(sc, lab);
    const ms = c.marks.map(markPct);
    return {st: Object.keys(sc.cur.g).length, t: c.nDone, fh: Math.round(c.focusMin / 6) / 10, bs: c.streak, m: ms.length, avg: ms.length ? Math.round(ms.reduce((a, b) => a + b, 0) / ms.length) : null, rv: c.reviewed};
  }
  function closeTerm(label, at){
    let sc = SC(); if (!sc) return;
    const lab = label;
    if (sc.cur.s === todayISO() && sc.past && sc.past[0] && sc.past[0].lab === label) return;
    evaluate({quiet: true, lab});
    sc = clone(SC());
    const old = sc.cur;
    old.e = todayISO(); old.lab = label; old.g["term-end"] = nowMin(); old.sum = summaryOf(sc, label); old.sum.st = Object.keys(old.g).length;
    if (label && label.length <= 40) { old.n0 = old.n; old.n = label; }
    old.closedAt = Date.now();
    sc.past = [old].concat(sc.past || []).slice(0, 10);
    sc.cur = newPage(todayISO());
    sc.db = {}; sc.hi = {}; sc.f = {};
    saveSc(sc);
    V.page = null;
    setTimeout(() => quietToast(`${old.n} is saved in your Scrapbook with ${plural(old.sum.st, "sticker")}. Your new page is ready.`, null, () => { const s = SC(); return !!(s && s.past && s.past[0] && s.past[0].id === old.id); }), 1200);
  }
  // Undo of Start a New Term
  function maybeReopen(){
    const sc = SC(); if (!sc || !sc.past || !sc.past[0]) return;
    const p = sc.past[0];
    if (!p.lab || !p.closedAt || Date.now() - p.closedAt > 15 * 60e3) return;
    if (allCourses().some(c => c.archived === p.lab) || allTasks().some(t => t.archivedTerm === p.lab)) return;
    edit(s => { const back = s.past.shift(); delete back.e; delete back.lab; delete back.closedAt; delete back.sum; delete back.g["term-end"]; if (back.n0) { back.n = back.n0; delete back.n0; }
      const keepDecor = s.cur.d; back.g = Object.assign({}, back.g); s.cur = back; void keepDecor; });
    V.page = null;
    if (ui.tab === "scrapbook") scheduleRender();
  }

  /* Hooks: when to look */
  hook("boot", () => { setTimeout(() => { if (!SC()) init(); else schedule(0); }, 2500); });
  hook("changed", ch => {
    const arch = (ch || []).find(x => x && x.kind === "course" && x.after && x.after.archived && x.after.archivedAt && Date.now() - x.after.archivedAt < 120000);
    if (arch) { closeTerm(arch.after.archived, arch.after.archivedAt); return; }
    if ((ch || []).some(x => x && x.kind === "course" && x.after && !x.after.archived)) setTimeout(maybeReopen, 50);
    schedule();
  });
  hook("stats-focus", e => { if (e && e.source === "room") edit(sc => { sc.f = Object.assign({}, sc.f, {rm: nowMin()}); }); schedule(); });
  let renderEval = 0;
  hook("render", tab => { if (Date.now() - renderEval > 20000) { renderEval = Date.now(); schedule(6000); } if (tab === "scrapbook") bind(); });
  hook("plan-changed", () => { if (ui.tab === "scrapbook") scheduleRender(); });
  const setFlag = k => { if (!SC()) return; edit(sc => { sc.f = Object.assign({}, sc.f, {[k]: nowMin()}); }); schedule(); };
  // Rough Week Rescue's Apply Plan button, and the study group and sharing messages
  document.addEventListener("click", e => { const b = e.target.closest && e.target.closest("#rwApply"); if (b && !b.disabled) setTimeout(() => setFlag("rs"), 300); }, true);
  const origToast = toast;
  toast = function(msg){
    try {
      const m = String(msg || "");
      if (/^You joined |is ready\. Invite your classmates/.test(m)) setFlag("gp");
      if (/^(Link ready|Shared copy updated|Deck file saved|Updated .+ in )/.test(m) || (/^Shared .+ with /.test(m) && !/^Shared \d+ deadline/.test(m))) { setFlag("sh"); if (/^Shared |^Updated /.test(m)) setFlag("gp"); }
    } catch (e) {}
    return origToast.apply(this, arguments);
  };

  /* Layout */
  function slot(i){
    let r = 0, n = i; for (;;) { const c = r % 2 ? 4 : 5; if (n < c) break; n -= c; r++; }
    return [r % 2 ? 215 + n * 190 : 120 + n * 190, 300 + r * 122];
  }
  const stickerKeys = page => Object.keys(page.g || {}).filter(k => MI[k]).sort((a, b) => (page.g[a] - page.g[b]) || (keyOrder(a) - keyOrder(b)));
  function placed(page){
    const ks = stickerKeys(page);
    return ks.map((k, i) => {
      const p = page.p && page.p[k];
      if (p) return {k, x: p[0], y: p[1], r: p[2], s: p[3], moved: true};
      const [x, y] = slot(i), h = hash(k + page.id);
      return {k, x: Math.round(x + (h - .5) * 32), y: Math.round(y + (hash(k) - .5) * 24), r: Math.round((hash(page.id + k) - .5) * 26), s: Math.round(96 + h * 10)};
    });
  }
  function pageH(page, items){
    const n = stickerKeys(page).length;
    let rows = 0, left = n; while (left > 0) { left -= rows % 2 ? 4 : 5; rows++; }
    const auto = 300 + Math.max(0, rows - 1) * 122 + 110;
    const maxY = Math.max(0, ...items.map(it => it.y + 70), ...(page.d || []).map(d => d[3] + 40));
    return Math.max(BASE_H, auto, Math.min(maxY, 3000));
  }
  const accent = () => { try { return getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#7C8CF8"; } catch (e) { return "#7C8CF8"; } };
  const paperCache = {};
  // Apply-time gate
  const paperId = page => A.papers[page.pp] && !locked((A.papers[page.pp] || {}).tier) ? page.pp : "cream";
  function paperOf(page, H){
    const id = paperId(page), k = id + H + (id === "theme" ? accent() : "");
    if (!paperCache[k]) { const p = A.paper(id, W, H, accent()); paperCache[k] = Object.assign({}, p, {uri: A.uri(p.svg)}); }
    return paperCache[k];
  }
  const freeStyle = (list, style, dflt) => list[style] && !locked(list[style].tier) ? list[style] : list[dflt];
  const decoUri = (kind, style) => kind === "w" ? A.uri(freeStyle(A.washi, style, "dots").svg) : A.uri(freeStyle(A.frames, style, "circle").svg);
  const decoCache = {};
  const dUri = (k, s, t) => k === "c" ? A.tag(A.tagW(t)) : (decoCache[k + s + (locked("pro") ? "L" : "")] || (decoCache[k + s + (locked("pro") ? "L" : "")] = decoUri(k, s)));
  const sizeOf = (kind, t) => kind === "s" ? [STK, STK] : kind === "w" ? WASHI : kind === "f" ? [FRAME, FRAME] : [A.tagW(t), 80];

  /* The page */
  const V = {page: null, sel: null, zoom: false, back: "board", hl: null, fresh: null};
  const smooth = () => window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
  const pages = () => { const sc = SC(); return sc ? [sc.cur].concat(sc.past || []) : []; };
  const curPage = () => { const ps = pages(); return ps.find(p => p.id === V.page) || ps[0] || null; };
  const isCur = page => { const sc = SC(); return !!(sc && page && sc.cur.id === page.id); };
  function whoName(){
    const sc = SC(); if (sc && sc.who) return sc.who;
    try { if (typeof sbUser !== "undefined" && sbUser) return localStorage.getItem("sb:grpName:" + sbUser.id) || ""; } catch (e) {}
    return "";
  }
  const range = page => { const f = s => parse(s).toLocaleDateString(undefined, {month: "short", day: "numeric", year: "numeric"}); return page.e ? `${f(page.s)} to ${f(page.e)}` : `Since ${f(page.s)}`; };

  function itemHtml(it, i, fresh){
    const kind = it.kind || "s", [w, h] = sizeOf(kind, it.t);
    const isS = kind === "s", label = isS ? keyName(it.k) : kind === "w" ? "Washi tape" : kind === "f" ? "Doodle frame" : "Caption: " + (it.t || "");
    const style = `left:${it.x / W * 100}%;top:${it.y / V.H * 100}%;width:${w * it.s / 1000}cqw;height:${h * it.s / 1000}cqw;--r:${it.r}deg;--s:${it.s / 100}`;
    const inner = kind === "c" ? `<img src="${dUri("c", "", it.t)}" alt="" draggable="false"><span class="sbk-cap-t">${esc(it.t || "")}</span>` : `<img src="${isS ? A.sticker(it.k) : dUri(kind, it.style)}" alt="" draggable="false">`;
    return `<div class="sbk-it sbk-${kind}${isS ? "" : " st-" + esc(it.style || "")}${fresh && fresh.includes(it.k) ? " new" : ""}${V.hl && V.hl === it.k ? " hl" : ""}" ${isS ? `data-k="${esc(it.k)}"` : `data-i="${i}"`} tabindex="0" role="button" aria-label="${esc(label)}. Drag to move." style="${style}">${inner}</div>`;
  }
  function paperInner(page, fresh){
    const items = placed(page);
    V.H = pageH(page, items);
    const p = paperOf(page, V.H), who = whoName();
    const deco = (page.d || []).map((d, i) => ({kind: d[0], style: d[1], x: d[2], y: d[3], r: d[4], s: d[5], t: d[6], i}));
    const layer = k => deco.filter(d => d.kind === k).map(d => itemHtml(d, d.i)).join("");
    return `<div class="sbk-title" style="color:${p.ink}"><b style="font-size:${titleSize(page.n)}cqw">${esc(page.n)}</b><span style="color:${p.sub}">${who ? `${esc(who)}'s Scrapbook · ` : ""}${esc(range(page))}</span></div>
      ${layer("f")}${items.map(it => itemHtml(it, 0, fresh)).join("")}${layer("c")}${layer("w")}
      ${nextUp(page, items.length, p)}`;
  }
  // A soft outline where the next sticker will land, showing the closest milestone
  function nextUp(page, n, p){
    if (!isCur(page) || n >= 30) return "";
    const sc = SC(), c = lastCtx && lastCtx.start === page.s ? lastCtx : context(sc);
    const cand = M.filter(m => m.id !== "term-end" && !page.g[m.id]).map(m => ({m, pr: progressOf(m, c, page)})).sort((a, b) => (b.pr.p - a.pr.p) || (a.m.i - b.m.i))[0];
    if (!cand) return "";
    const [x, y] = slot(n);
    return `<button type="button" class="sbk-next" data-act="sbk-list" data-id="${cand.m.id}" style="left:${x / W * 100}%;top:${y / V.H * 100}%;color:${p.sub}" aria-label="Next up: ${esc(cand.m.name)}. ${esc(cand.pr.text)}"><span class="sbk-ghost"><img src="${A.sticker(cand.m.id)}" alt=""></span><span class="sbk-nl">Next: ${esc(cand.m.name)}</span></button>`;
  }
  // Long term names shrink to fit between the corner tapes
  const titleSize = n => Math.min(6.8, 56 / (Math.max(1, String(n || "").length) * .58));
  function milestoneList(page){
    const cur = isCur(page), sc = SC();
    const c = cur ? (lastCtx && lastCtx.start === page.s ? lastCtx : context(sc)) : null;
    const g = page.g || {};
    const got = Object.keys(g).filter(k => MI[k]).length;
    return `<div class="sbk-mhead"><b>Milestones</b><span class="mini">${got} sticker${got === 1 ? "" : "s"} on this page</span></div>` + CATS.map(([cat, title]) => {
      const ms = M.filter(m => m.cat === cat);
      return `<h4 class="sbk-cat">${esc(title)}</h4><ul class="sbk-ml">${ms.map(m => {
        const pr = cur ? progressOf(m, c, page) : {got: !!g[m.id], p: 0, text: ""};
        const has = !!g[m.id];
        const when = g[m.id] ? `Earned ${new Date(minMs(g[m.id])).toLocaleDateString(undefined, {month: "short", day: "numeric"})}` : "";
        const art = m.id;
        return `<li class="sbk-m ${has ? "got" : "locked"}${m.special ? " special" : ""}" data-mid="${m.id}"><button type="button" class="sbk-mi" ${has ? `data-act="sbk-find" data-id="${esc(m.id)}" aria-label="Show ${esc(m.name)} on the page"` : `tabindex="-1" aria-hidden="true"`}><img src="${A.sticker(art)}" alt="" loading="lazy"></button>
          <div class="sbk-mt"><b>${esc(m.name)}</b><span class="sbk-goal">${esc(m.goal)}</span>
          ${cur && !has && m.id !== "term-end" && (m.need > 1 || m.prog) ? `<span class="sbk-pbar" aria-hidden="true"><i style="width:${Math.round(pr.p * 100)}%"></i></span>` : ""}
          <span class="sbk-pt">${esc(has ? when : cur ? pr.text : has ? when : "Not earned this term")}</span>
          ${cur && !has && m.tier != null ? `<ul class="sbk-paths">${goalPaths(m.tier, c).map(p => `<li${p.p >= 1 ? ` class="ok"` : ""}><span class="sbk-pn">${esc(p.name)}</span><span class="sbk-pbar" aria-hidden="true"><i style="width:${Math.round(p.p * 100)}%"></i></span><span class="mini">${esc(p.text)}</span></li>`).join("")}</ul>` : ""}</div></li>`; }).join("")}</ul>`;
    }).join("");
  }
  function summaryHtml(page){
    const s = page.sum; if (!s) return "";
    const bits = [plural(s.st, "sticker"), plural(s.t, "task") + " done", s.fh ? `${s.fh} focus hours` : "", s.bs ? `best streak ${plural(s.bs, "day")}` : "", s.avg != null ? `average mark ${s.avg}%` : "", s.rv ? `${s.rv} cards reviewed` : ""].filter(Boolean);
    return `<div class="sbk-sum"><b>${esc(page.n)} in a Nutshell</b><span>${esc(bits.join(" · "))}</span></div>`;
  }
  function viewBook(){
    let sc = SC();
    if (!sc) { init(); sc = SC(); }
    if (!sc) return `<div class="empty">Your scrapbook is getting ready.</div>`;
    const page = curPage(), cur = isCur(page), ps = pages();
    const inner = paperInner(page, V.fresh);
    return `<div class="sbk ${isDark() ? "dark" : ""}" id="sbk">
      <div class="view-head sbk-head"><h2>Term Scrapbook</h2>
        ${ps.length > 1 ? `<label class="sbk-pick"><select id="sbkTerm" aria-label="Choose a term">${ps.map((p, i) => `<option value="${esc(p.id)}" ${p.id === page.id ? "selected" : ""}>${esc(p.n)}${i === 0 ? " (This Term)" : ""}</option>`).join("")}</select></label>` : ""}
        <button class="btn small" data-act="sbk-back">Back</button></div>
      <div class="sbk-tools">
        <button class="btn small sbk-mbtn" data-act="sbk-list">Milestones</button>
        <button class="btn small" data-act="sbk-add">Decorate</button>
        <button class="btn small" data-act="sbk-paper">Paper</button>
        <button class="btn small" data-act="sbk-export">Save as Image</button>
        <button class="btn small" data-act="sbk-details">Page Details</button>
        <button class="btn small sbk-zoombtn" data-act="sbk-zoom" aria-pressed="${V.zoom}">${V.zoom ? "Fit Page" : "Zoom In"}</button>
      </div>
      ${cur ? "" : summaryHtml(page)}
      <div class="sbk-main">
        <div class="sbk-stage ${V.zoom ? "zoom" : ""}" id="sbkStage">
          <div class="sbk-selbar" id="sbkBar" hidden></div>
          <div class="sbk-scroll"><div class="sbk-paper" id="sbkPaper" data-page="${esc(page.id)}" style="${paperStyle(page)}">${inner}</div></div>
        </div>
        <aside class="sbk-side" aria-label="Milestones">${milestoneList(page)}</aside>
      </div>
      <p class="hint-line">Drag stickers to move them. Tap one to turn, resize or put it back (or pinch on a phone). Add captions, washi tape and frames from Decorate.</p>
    </div>`;
  }
  VIEWS.scrapbook = viewBook;
  function paperStyle(page){ const p = paperOf(page, V.H); return `aspect-ratio:${W}/${V.H};background-image:url('${p.uri}')`; }
  // Redraw only the paper (no full render), keeping the selection
  function paint(fresh){
    const el = document.getElementById("sbkPaper"); if (!el) return;
    const page = curPage(); if (!page || el.dataset.page !== page.id) { scheduleRender(); return; }
    el.innerHTML = paperInner(page, fresh);
    el.setAttribute("style", paperStyle(page));
    const side = document.querySelector("#sbk .sbk-side"); if (side) side.innerHTML = milestoneList(page);
    if (V.sel) { const it = findEl(V.sel); if (it) it.classList.add("sel"); else V.sel = null; }
    selBar();
  }
  function openBook(pageId, highlight){
    if (!SC()) init();
    if (ui.tab !== "scrapbook") V.back = ui.tab || "board";
    V.page = pageId || null; V.sel = null; V.hl = highlight || null;
    if (dlg.open) dlg.close();
    const q = document.getElementById("qod"); if (q) q.remove();
    V.fresh = (evaluate({quiet: true}) || []).slice();
    pending.length = 0;
    ui.tab = "scrapbook"; render(); window.scrollTo(0, 0);
    V.fresh = null;
    if (highlight) setTimeout(() => { const el = findEl({k: highlight}); if (el) el.scrollIntoView({block: "center", behavior: smooth()}); }, 120);
    setTimeout(() => { V.hl = null; $$("#sbkPaper .hl").forEach(x => x.classList.remove("hl")); }, 3200);
  }

  /* Editing: drag, turn, resize */
  const findEl = sel => sel ? document.querySelector(sel.k ? `#sbkPaper .sbk-it[data-k="${CSS.escape(sel.k)}"]` : `#sbkPaper .sbk-it[data-i="${sel.i}"]`) : null;
  const selOf = el => el.dataset.k ? {k: el.dataset.k} : {i: Number(el.dataset.i)};
  function readItem(sel){
    const page = curPage(); if (!page) return null;
    if (sel.k) { const it = placed(page).find(x => x.k === sel.k); return it ? {kind: "s", x: it.x, y: it.y, r: it.r, s: it.s} : null; }
    const d = (page.d || [])[sel.i]; return d ? {kind: d[0], style: d[1], x: d[2], y: d[3], r: d[4], s: d[5], t: d[6]} : null;
  }
  function applyEl(el, it){
    const kind = it.kind, [w, h] = sizeOf(kind, it.t);
    el.style.left = it.x / W * 100 + "%"; el.style.top = it.y / V.H * 100 + "%";
    el.style.width = w * it.s / 1000 + "cqw"; el.style.height = h * it.s / 1000 + "cqw";
    el.style.setProperty("--r", it.r + "deg"); el.style.setProperty("--s", it.s / 100);
  }
  function editPage(fn){
    const page = curPage(); if (!page) return;
    edit(sc => { const p = sc.cur.id === page.id ? sc.cur : (sc.past || []).find(x => x.id === page.id); if (p) fn(p); });
  }
  function commit(sel, it){
    const x = Math.round(clampN(it.x, 0, W)), y = Math.round(clampN(it.y, 0, V.H)), r = Math.round(((it.r % 360) + 540) % 360 - 180), s = Math.round(clampN(it.s, 45, 260));
    Object.assign(it, {x, y, r, s});
    const el = findEl(sel); if (el) applyEl(el, it);
    editPage(p => {
      if (sel.k) p.p = Object.assign({}, p.p, {[sel.k]: [x, y, r, s]});
      else if (p.d && p.d[sel.i]) p.d[sel.i] = [p.d[sel.i][0], p.d[sel.i][1], x, y, r, s, p.d[sel.i][6] || ""];
    });
  }
  function select(sel){
    $$("#sbkPaper .sbk-it.sel").forEach(x => x.classList.remove("sel"));
    V.sel = sel;
    const el = findEl(sel); if (el) el.classList.add("sel");
    selBar();
  }
  function selBar(){
    const bar = document.getElementById("sbkBar"); if (!bar) return;
    const it = V.sel && readItem(V.sel);
    if (!it) { bar.hidden = true; bar.innerHTML = ""; return; }
    const page = curPage();
    const name = V.sel.k ? keyName(V.sel.k) : it.kind === "w" ? "Washi Tape" : it.kind === "f" ? "Doodle Frame" : "Caption";
    const when = V.sel.k && page.g[V.sel.k] ? ` <span class="mini">Earned ${esc(new Date(minMs(page.g[V.sel.k])).toLocaleDateString(undefined, {month: "short", day: "numeric"}))}</span>` : "";
    bar.hidden = false;
    bar.innerHTML = `<span class="sbk-selname"><b>${esc(name)}</b>${when}</span>
      <span class="sbk-selbtns">
      <button type="button" class="icon-btn" data-sbk="rl" aria-label="Turn left" title="Turn Left">↺</button><button type="button" class="icon-btn" data-sbk="rr" aria-label="Turn right" title="Turn Right">↻</button>
      <button type="button" class="icon-btn" data-sbk="sm" aria-label="Smaller" title="Smaller">−</button><button type="button" class="icon-btn" data-sbk="bg" aria-label="Bigger" title="Bigger">+</button>
      ${it.kind === "c" ? `<button type="button" class="btn small" data-sbk="edit">Edit</button>` : ""}
      ${V.sel.k ? (page.p && page.p[V.sel.k] ? `<button type="button" class="btn small" data-sbk="reset">Put Back</button>` : "") : `<button type="button" class="btn small" data-sbk="front">To Front</button><button type="button" class="btn small danger" data-sbk="del">Remove</button>`}
      <button type="button" class="btn small primary" data-sbk="done">Done</button></span>`;
  }
  function nudge(dx, dy, dr, ds){
    if (!V.sel) return;
    const it = readItem(V.sel); if (!it) return;
    it.x += dx; it.y += dy; it.r += dr; it.s = clampN(it.s * (ds || 1), 45, 260);
    const el = findEl(V.sel); if (el) applyEl(el, it);
    commit(V.sel, it);
  }
  function barAction(a){
    const sel = V.sel; if (!sel) return;
    if (a === "rl") nudge(0, 0, -10); else if (a === "rr") nudge(0, 0, 10);
    else if (a === "sm") nudge(0, 0, 0, 1 / 1.12); else if (a === "bg") nudge(0, 0, 0, 1.12);
    else if (a === "done") select(null);
    else if (a === "reset") { editPage(p => { const q = Object.assign({}, p.p); delete q[sel.k]; p.p = q; }); paint(); }
    else if (a === "del") { editPage(p => { p.d = (p.d || []).filter((_, i) => i !== sel.i); }); V.sel = null; paint(); }
    else if (a === "front") { let ni = sel.i; editPage(p => { const d = p.d.splice(sel.i, 1)[0]; p.d.push(d); ni = p.d.length - 1; }); V.sel = {i: ni}; paint(); }
    else if (a === "edit") captionSheet(sel.i);
  }
  let bound = null;
  function bind(){
    const paper = document.getElementById("sbkPaper");
    if (!paper || paper === bound) return;
    bound = paper;
    const page = curPage(); if (page) paper.setAttribute("style", paperStyle(page));
    const term = document.getElementById("sbkTerm");
    if (term) term.addEventListener("change", () => { V.page = term.value; V.sel = null; render(); });
    const bar = document.getElementById("sbkBar");
    if (bar) bar.addEventListener("click", e => { const b = e.target.closest("[data-sbk]"); if (b) barAction(b.dataset.sbk); });
    const ptrs = new Map();
    let g = null;
    const pt = e => ({x: e.clientX, y: e.clientY});
    const unit = () => W / paper.getBoundingClientRect().width;
    paper.addEventListener("pointerdown", e => {
      const el = e.target.closest(".sbk-it");
      if (!el) { if (!e.target.closest("#sbkBar")) select(null); return; }
      e.preventDefault();
      ptrs.set(e.pointerId, pt(e));
      try { el.setPointerCapture(e.pointerId); } catch (x) {}
      const sel = selOf(el), it = readItem(sel); if (!it) return;
      if (!V.sel || JSON.stringify(V.sel) !== JSON.stringify(sel)) select(sel);
      if (ptrs.size === 2 && g && g.el === el) {
        const [a, b] = [...ptrs.values()];
        g = {el, sel, it, base: Object.assign({}, it), pinch: {d: Math.hypot(b.x - a.x, b.y - a.y), ang: Math.atan2(b.y - a.y, b.x - a.x), mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2}, moved: true};
        return;
      }
      g = {el, sel, it, base: Object.assign({}, it), sx: e.clientX, sy: e.clientY, moved: false};
      el.classList.add("drag");
    });
    paper.addEventListener("pointermove", e => {
      if (!g || !ptrs.has(e.pointerId)) return;
      ptrs.set(e.pointerId, pt(e));
      const u = unit();
      if (g.pinch && ptrs.size >= 2) {
        const [a, b] = [...ptrs.values()];
        const d = Math.hypot(b.x - a.x, b.y - a.y), ang = Math.atan2(b.y - a.y, b.x - a.x);
        g.it.s = clampN(g.base.s * d / Math.max(10, g.pinch.d), 45, 260);
        g.it.r = g.base.r + (ang - g.pinch.ang) * 180 / Math.PI;
        g.it.x = g.base.x + ((a.x + b.x) / 2 - g.pinch.mx) * u; g.it.y = g.base.y + ((a.y + b.y) / 2 - g.pinch.my) * u;
      } else if (!g.pinch) {
        const dx = e.clientX - g.sx, dy = e.clientY - g.sy;
        if (!g.moved && Math.hypot(dx, dy) < 4) return;
        g.moved = true;
        g.it.x = clampN(g.base.x + dx * u, 0, W); g.it.y = clampN(g.base.y + dy * u, 0, V.H);
      }
      applyEl(g.el, g.it);
    });
    const end = e => {
      if (!ptrs.has(e.pointerId)) return;
      ptrs.delete(e.pointerId);
      if (!g) return;
      if (ptrs.size) { if (g.pinch) { const rest = [...ptrs.values()][0]; g = Object.assign({}, g, {pinch: null, base: Object.assign({}, g.it), sx: rest.x, sy: rest.y}); } return; }
      g.el.classList.remove("drag");
      if (g.moved) commit(g.sel, g.it);
      if (g.moved && V.sel && V.sel.k) selBar();
      g = null;
    };
    paper.addEventListener("pointerup", end);
    paper.addEventListener("pointercancel", end);
    paper.addEventListener("wheel", e => {
      if (!V.sel || !(e.shiftKey || e.altKey || e.ctrlKey)) return;
      const el = e.target.closest(".sbk-it"); if (!el || !el.classList.contains("sel")) return;
      e.preventDefault();
      if (e.shiftKey) nudge(0, 0, e.deltaY > 0 ? 5 : -5); else nudge(0, 0, 0, e.deltaY > 0 ? 1 / 1.05 : 1.05);
    }, {passive: false});
    paper.addEventListener("focusin", e => { const el = e.target.closest(".sbk-it"); if (el && !el.classList.contains("sel")) select(selOf(el)); });
    paper.addEventListener("dblclick", e => { const el = e.target.closest(".sbk-it.sbk-c"); if (el) captionSheet(Number(el.dataset.i)); });
    paper.addEventListener("keydown", e => {
      const el = e.target.closest(".sbk-it"); if (!el) return;
      if (!V.sel) select(selOf(el));
      const step = e.shiftKey ? 40 : 10, k = e.key;
      const map = {ArrowLeft: [-step, 0, 0], ArrowRight: [step, 0, 0], ArrowUp: [0, -step, 0], ArrowDown: [0, step, 0], "[": [0, 0, -5], "]": [0, 0, 5]};
      if (map[k]) { e.preventDefault(); nudge(...map[k]); }
      else if (k === "-" || k === "_") { e.preventDefault(); nudge(0, 0, 0, 1 / 1.08); }
      else if (k === "=" || k === "+") { e.preventDefault(); nudge(0, 0, 0, 1.08); }
      else if ((k === "Delete" || k === "Backspace") && V.sel && V.sel.i != null) { e.preventDefault(); barAction("del"); }
      else if (k === "Enter" && V.sel && V.sel.i != null && el.classList.contains("sbk-c")) { e.preventDefault(); captionSheet(V.sel.i); }
      else if (k === "Escape") { select(null); el.blur(); }
    });
    if (V.hl) { const el = findEl({k: V.hl}); if (el) el.classList.add("hl"); }
    selBar();
  }

  /* Sheets: decorate, paper, details, milestones */
  function visibleCenter(){
    const paper = document.getElementById("sbkPaper"); if (!paper) return [500, 500];
    const r = paper.getBoundingClientRect(), u = W / r.width;
    const top = clampN(Math.max(0, -r.top) * u + 120, 260, V.H - 120), bot = clampN((Math.min(innerHeight, r.bottom) - r.top) * u - 120, top, V.H - 100);
    const page = curPage(), taken = placed(page).map(it => [it.x, it.y]).concat((page.d || []).map(d => [d[2], d[3]]));
    let best = [500, (top + bot) / 2], bestD = -1;
    for (let i = 0; i < 24; i++) {
      const x = 130 + Math.random() * 740, y = top + Math.random() * (bot - top);
      const d = Math.min(1e9, ...taken.map(([a, b]) => Math.hypot(a - x, (b - y) * 1.3)));
      if (d > bestD) { bestD = d; best = [x, y]; }
    }
    return best.map(Math.round);
  }
  function addDeco(kind, style, text){
    let [x, y] = visibleCenter();
    const half = sizeOf(kind, text)[0] / 2 + 12;
    x = Math.round(clampN(x, half, W - half));
    let idx = 0;
    editPage(p => { p.d = (p.d || []).slice(0, 60); p.d.push([kind, style, x, y, Math.round((Math.random() - .5) * 16), 100, text || ""]); idx = p.d.length - 1; });
    if (dlg.open) dlg.close();
    V.sel = {i: idx}; paint();
    const el = findEl(V.sel); if (el) { el.classList.add("sel", "new"); el.focus({preventScroll: true}); }
  }
  const tile = (kind, id, it, on) => {
    const lock = locked(it.tier);
    const img = kind === "pp" ? `<span class="sbk-pp" style="background-image:url('${A.uri(A.paper(id, 400, 300, accent()).svg)}')"></span>` : `<img src="${A.uri(it.svg)}" alt="">`;
    return `<button type="button" class="sbk-tile ${on ? "on" : ""}" data-tk="${kind}" data-tid="${id}" aria-pressed="${!!on}">${img}<span class="sbk-tn">${esc(it.name)}${it.tier === "pro" ? PRO_BADGE : ""}${lock ? " 🔒" : ""}</span></button>`;
  };
  function tileClicks(onPick){
    dlg.querySelectorAll(".sbk-tile").forEach(b => b.addEventListener("click", () => {
      const k = b.dataset.tk, id = b.dataset.tid, list = k === "w" ? A.washi : k === "f" ? A.frames : A.papers;
      if (locked((list[id] || {}).tier)) { dlg.close(); proSheet(PRO_WHY); return; }
      onPick(k, id);
    }));
  }
  function decorateSheet(){
    openSheet(`<form class="sheet sbk-sheet">${head("Decorate")}<div class="sheet-body">
      <label class="f"><span class="lh">Add a Caption <span class="hint">a few words on a little paper tag</span></span><span class="sbk-caprow"><input type="text" id="sbkCapIn" maxlength="40" placeholder="e.g. Survived midterms!" data-noenter><button type="button" class="btn primary" id="sbkCapAdd">Add</button></span></label>
      <h3 class="fsec">Washi Tape</h3><div class="sbk-tiles">${Object.entries(A.washi).map(([id, it]) => tile("w", id, it)).join("")}</div>
      <h3 class="fsec">Doodle Frames</h3><div class="sbk-tiles frames">${Object.entries(A.frames).map(([id, it]) => tile("f", id, it)).join("")}</div>
    </div><div class="sheet-foot"><span class="spacer"></span><button type="button" class="btn" data-act="close">Close</button></div></form>`);
    const add = () => { const v = $("#sbkCapIn").value.trim(); if (!v) { toast("Type a few words for the caption"); $("#sbkCapIn").focus(); return; } addDeco("c", "kraft", v); };
    $("#sbkCapAdd").addEventListener("click", add);
    $("#sbkCapIn").addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); add(); } });
    tileClicks((k, id) => addDeco(k, id));
  }
  function captionSheet(i){
    const page = curPage(), d = page && page.d && page.d[i]; if (!d) return;
    openSheet(`<form class="sheet">${head("Edit Caption")}<div class="sheet-body"><label class="f"><span class="lh">Caption</span><input type="text" name="t" maxlength="40" value="${esc(d[6] || "")}" autofocus></label></div>
      <div class="sheet-foot"><button type="button" class="btn danger" id="sbkCapDel">Remove</button><span class="spacer"></span><button type="button" class="btn" data-act="close">Cancel</button><button type="button" class="btn primary" data-submit>Save</button></div></form>`, fd => {
      const t = String(fd.get("t") || "").trim().slice(0, 40); if (!t) { toast("Type a few words, or remove the caption"); return false; }
      editPage(p => { if (p.d[i]) p.d[i][6] = t; }); setTimeout(paint, 20);
    });
    $("#sbkCapDel").addEventListener("click", () => { dlg.close(); V.sel = {i}; barAction("del"); });
  }
  function paperSheet(){
    const page = curPage();
    openSheet(`<form class="sheet sbk-sheet">${head("Page Design")}<div class="sheet-body"><p class="mini" style="margin:0">Pick the paper for your ${esc(page.n)} page.</p>
      <div class="sbk-tiles papers">${Object.entries(A.papers).map(([id, it]) => tile("pp", id, it, (page.pp || "cream") === id)).join("")}</div></div>
      <div class="sheet-foot"><span class="spacer"></span><button type="button" class="btn" data-act="close">Close</button></div></form>`);
    tileClicks((k, id) => { editPage(p => { p.pp = id; }); dlg.close(); paint(); });
  }
  function detailsSheet(){
    const page = curPage(), sc = SC(), cur = isCur(page);
    openSheet(`<form class="sheet">${head("Page Details")}<div class="sheet-body">
      <label class="f"><span class="lh">Term Name</span><input type="text" name="n" maxlength="40" value="${esc(page.n)}" required></label>
      <label class="f"><span class="lh">Your Name <span class="hint">shown on your pages, optional</span></span><input type="text" name="who" maxlength="30" value="${esc(sc.who || whoName())}" placeholder="e.g. Sam"></label>
      <p class="mini" style="margin:0">${esc(range(page))}. ${cur ? "Stickers count from this date. It starts again when you choose Start a New Term." : "This page is from a past term."}</p>
      <label class="mi-check"><input type="checkbox" name="toast" ${sc.toast !== false ? "checked" : ""}> Tell me when I earn a new sticker</label>
      <button type="button" class="btn small" id="sbkReset">Put All Stickers Back in Place</button>
    </div><div class="sheet-foot"><span class="spacer"></span><button type="button" class="btn" data-act="close">Cancel</button><button type="button" class="btn primary" data-submit>Save</button></div></form>`, fd => {
      const n = String(fd.get("n") || "").trim().slice(0, 40), who = String(fd.get("who") || "").trim().slice(0, 30);
      if (!n) return false;
      editPage(p => { p.n = n; });
      edit(s => { s.who = who; s.toast = !!fd.get("toast"); });
      setTimeout(() => render(), 20);
    });
    $("#sbkReset").addEventListener("click", () => { editPage(p => { p.p = {}; }); dlg.close(); toast("Stickers are back in their places"); paint(); });
  }
  function listSheet(id){
    const page = curPage();
    openSheet(`<div class="sheet sbk-sheet">${head("Milestones")}<div class="sheet-body sbk-side in-sheet">${milestoneList(page)}</div><div class="sheet-foot"><span class="spacer"></span><button type="button" class="btn primary" data-act="close">Done</button></div></div>`);
    if (id) setTimeout(() => { const r = dlg.querySelector(`[data-mid="${CSS.escape(id)}"]`); if (r) { r.scrollIntoView({block: "center"}); r.classList.add("flash"); } }, 60);
  }

  /* Save as Image (free) */
  const loadImg = src => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error("image")); i.src = src; });
  async function renderPng(page, o){
    o = o || {};
    const items = placed(page), H = pageH(page, items), p = paperOf(page, H), Z = o.z || 1.6;
    const cv = document.createElement("canvas"); cv.width = W * Z; cv.height = H * Z;
    const x = cv.getContext("2d"); x.scale(Z, Z);
    x.drawImage(await loadImg(A.uri(A.paper(paperId(page), W, H, accent(), o.grain == null ? .5 : o.grain).svg)), 0, 0, W, H);
    const font = (getComputedStyle(document.documentElement).getPropertyValue("--display") || "Lexend, sans-serif").trim();
    x.textAlign = "center"; x.fillStyle = p.ink; x.font = `800 ${Math.round(titleSize(page.n) * 10)}px ${font}`;
    x.fillText(page.n, W / 2, 110, 580);
    const who = whoName(); x.fillStyle = p.sub; x.font = `600 27px ${font}`;
    x.fillText(`${who ? who + "'s Scrapbook · " : ""}${range(page)}`, W / 2, 180, W - 120);
    const deco = (page.d || []).map(d => ({kind: d[0], style: d[1], x: d[2], y: d[3], r: d[4], s: d[5], t: d[6]}));
    const draw = async (it, src) => {
      const [w, h] = sizeOf(it.kind, it.t), sw = w * it.s / 100, sh = h * it.s / 100;
      const img = await loadImg(src);
      x.save(); x.translate(it.x, it.y); x.rotate(it.r * Math.PI / 180);
      if (it.kind === "f" && A.frameShadow(it.style)) { x.shadowColor = "rgba(40,25,5,.25)"; x.shadowBlur = 12; x.shadowOffsetY = 4; }
      x.drawImage(img, -sw / 2, -sh / 2, sw, sh);
      if (it.kind === "c") { x.shadowColor = "transparent"; x.fillStyle = "#4A3522"; x.font = `700 ${Math.round(24 * it.s / 100)}px ${font}`; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(it.t || "", 14 * it.s / 100, 1, sw - 56 * it.s / 100); }
      x.restore();
    };
    for (const d of deco.filter(d => d.kind === "f")) await draw(d, dUri("f", d.style));
    for (const it of items) await draw(Object.assign({kind: "s"}, it), A.sticker(it.k));
    for (const d of deco.filter(d => d.kind === "c")) await draw(d, dUri("c", "", d.t));
    for (const d of deco.filter(d => d.kind === "w")) await draw(d, dUri("w", d.style));
    x.textAlign = "right"; x.fillStyle = p.sub; x.globalAlpha = .7; x.font = `600 18px ${font}`; x.fillText("Made with Studyboard", W - 30, H - 26);
    return await new Promise(res => cv.toBlob(res, "image/png"));
  }
  async function exportPage(){
    const page = curPage(); if (!page) return;
    toast("Making your image…");
    try {
      const blob = await renderPng(page);
      if (!blob) throw new Error("empty");
      const name = `scrapbook-${page.n.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "term"}.png`;
      const file = typeof File !== "undefined" ? new File([blob], name, {type: "image/png"}) : null;
      const touch = window.matchMedia && matchMedia("(pointer:coarse)").matches;
      if (touch && file && navigator.canShare && navigator.canShare({files: [file]})) { try { await navigator.share({files: [file], title: page.n}); return; } catch (e) { if (e && e.name === "AbortError") return; } }
      const dl = caps.downloads;
      if (dl && inPreview()) { const buf = new Uint8Array(await blob.arrayBuffer()); await dl.save({filename: name, data: buf}); toast("Image saved"); return; }
      saveBlob(name, blob, "image/png"); toast("Image saved");
      window.__sbkLastExport = {name, size: blob.size};
    } catch (e) { console.warn("scrapbook export", e); toast("That image couldn't be made. Try again in a moment."); }
  }

  /* Where it lives */
  hook("act", (act, el, id) => {
    switch (act) {
      case "sbk-open": openBook(id || null, el && el.dataset.hl || null); return true;
      case "sbk-back": ui.tab = V.back && V.back !== "scrapbook" ? V.back : "board"; V.sel = null; render(); window.scrollTo(0, 0); return true;
      case "sbk-list": {
        const side = document.querySelector("#sbk .sbk-side");
        if (id && side && side.offsetParent) { const r = side.querySelector(`[data-mid="${CSS.escape(id)}"]`); if (r) { r.scrollIntoView({block: "nearest", behavior: smooth()}); r.classList.remove("flash"); void r.offsetWidth; r.classList.add("flash"); } return true; }
        listSheet(id); return true;
      }
      case "sbk-add": decorateSheet(); return true;
      case "sbk-paper": paperSheet(); return true;
      case "sbk-details": detailsSheet(); return true;
      case "sbk-export": exportPage(); return true;
      case "sbk-zoom": V.zoom = !V.zoom; render(); return true;
      case "sbk-find": {
        if (dlg.open) dlg.close();
        const e2 = findEl({k: id}); if (!e2) return true;
        e2.scrollIntoView({block: "center", behavior: smooth()}); e2.classList.remove("hl"); void e2.offsetWidth; e2.classList.add("hl"); select({k: id});
        setTimeout(() => e2.classList.remove("hl"), 2600); return true;
      }
    }
    return false;
  });
  const stickerCount = () => { const sc = SC(); return sc ? Object.keys(sc.cur.g || {}).length : 0; };
  hook("menu", () => { const sc = SC(), n = stickerCount(); return `<button data-act="sbk-open" data-group="study"><span>Term Scrapbook<span class="sub">${sc ? `${plural(n, "sticker")} on your ${esc(sc.cur.n)} page` : "Stickers for your milestones this term"}</span></span></button>`; });
  // The streak and daily quote card gets a Scrapbook button
  const origPop = qodPop;
  qodPop = function(html, cls){
    const r = origPop.apply(this, arguments);
    try {
      const f = document.querySelector("#qod .qod-foot");
      if (f && !f.querySelector("[data-act=sbk-open]")) {
        const b = document.createElement("button"); b.type = "button"; b.className = "btn sbk-qod"; b.dataset.act = "sbk-open"; b.setAttribute("data-qod-close", "");
        const n = stickerCount();
        b.innerHTML = `${BOOK} Scrapbook${n ? ` <span class="sbk-n">${n}</span>` : ""}`;
        b.setAttribute("aria-label", `Open your Term Scrapbook${n ? `, ${plural(n, "sticker")}` : ""}`);
        f.insertBefore(b, f.firstChild);
      }
    } catch (e) {}
    return r;
  };
  // The Archive shows past terms' pages
  const origArch = viewArchive;
  viewArchive = function(){
    const html = origArch.apply(this, arguments);
    try {
      const sc = SC(); if (!sc) return html;
      const ps = [sc.cur].concat(sc.past || []);
      const card = (p, i) => { const ks = stickerKeys(p).slice(-6), pp = paperOf(p, BASE_H);
        return `<button type="button" class="sbk-acard" data-act="sbk-open" data-id="${esc(p.id)}"><span class="sbk-athumb" style="background-image:url('${pp.uri}')">${ks.map((k, j) => `<img src="${A.sticker(k)}" alt="" style="--j:${j}">`).join("")}</span><span class="sbk-aname"><b>${esc(p.n)}</b><span class="mini">${i === 0 ? "This term · " : ""}${plural(Object.keys(p.g || {}).length, "sticker")}</span></span></button>`; };
      return html + `<h3 class="fsec">${BOOK}Scrapbook Pages<span class="n">${ps.length}</span></h3><div class="sbk-arch">${ps.map(card).join("")}</div>`;
    } catch (e) { return html; }
  };

  // For tests
  window.__sbScrap = {evaluate: o => evaluate(o), init, state: () => clone(SC()), context: () => context(SC()), milestones: M.map(m => ({id: m.id, cat: m.cat, name: m.name, goal: m.goal, need: m.need})),
    open: (id, hl) => openBook(id, hl), renderPng: o => renderPng(curPage(), o).then(b => b && b.size), flag: setFlag, closeTerm, addFocus: (m, src) => SBSTATS.addFocus(m, src), keyName, flush: () => { ls(K_T, "0"); flushToast(); }, pending: () => pending.slice()};
})();


