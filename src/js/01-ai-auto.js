/* ===== module: 01-ai-auto.js: the app's core, automatic AI jobs ===== */
/* ---------- Automatic AI: quietly improves Today's Plan and study sessions ---------- */
// Off unless the person turned it on, or they're on free Gemini and never changed it.
// A paid model is only ever used after they tick the box and press Confirm for that exact model.
const isFreeModel = (p, m) => (p === "gemini" && (m === "auto" || AI_MODELS.includes(m))) || p === "trial";
function autoState(){
  if (inClaude()) return {on: false, reason: "preview"};
  const raw = (state.settings && state.settings.ai) || {}, c = aiCfg();
  if (!c.key) return {on: false, reason: "nokey"};
  if (c.provider === "trial") return {on: false, reason: "trial"};       // the free trial is only for jobs the student starts
  const want = raw.auto !== undefined ? !!raw.auto : isFreeModel(c.provider, c.model);
  if (!want) return {on: false, reason: "off"};
  const cfg = raw.autoModel !== "default" && c.keys.gemini ? {provider: "gemini", model: "auto", keys: c.keys, key: c.keys.gemini} : c;
  if (!aiConsented(cfg.provider)) return {on: false, reason: "consent", cfg};          // never before the person has said yes to that provider
  const paid = !isFreeModel(cfg.provider, cfg.model);
  if (paid && raw.autoPaidOk !== `${cfg.provider}|${cfg.model}`) return {on: false, reason: "confirm", cfg, paid};
  return {on: true, cfg, paid};
}
let AUTO_ON = false;                                   // refreshed on every render
const AUTO_LS = "studyboard:autoAI";
const AUTO = (() => { try { return JSON.parse(localStorage.getItem(AUTO_LS) || "{}") || {}; } catch(e) { return {}; } })();
const autoSave = () => { try { localStorage.setItem(AUTO_LS, JSON.stringify(AUTO)); } catch(e) {} };
function autoBudget(paid){
  const d = todayISO(); if (AUTO.day !== d) { AUTO.day = d; AUTO.n = 0; }
  return (paid ? 12 : 40) - (AUTO.n || 0);
}
const leftSig = t => `${Number(t.focusMin) || 0}|${Number(t.pct) || 0}|${(t.checklist || []).filter(i => i.done).length}/${(t.checklist || []).length}|${t.hours ?? ""}`;
const autoFresh = (x, days) => x && x.at && Date.now() - x.at < days * 864e5;
function planSig(){
  const open = tasksArr().filter(t => t.status !== "done" && t.due).sort((a, b) => a.due < b.due ? -1 : 1).slice(0, 40);
  let grp = ""; try { grp = window.SBGROUPTASKS ? window.SBGROUPTASKS.mine().map(x => [x.id, x.status, x.due, x.priority].join(",")).join(";") : ""; } catch(e) {}   // a change to a group task re-plans too
  let extra = ""; try { const n = typeof window.SBLMS_NEWS === "function" ? window.SBLMS_NEWS(7) : []; extra = n.length + ":" + (n[0] ? n[0].date : "") + ":" + eventsArr().length + ":" + coursesArr().map(c => (c.meetings || []).length).join(","); } catch(e) {}
  return extra + "#g" + grp + "#" + todayISO() + dayPartOf(new Date().getHours()) + "#" + open.map(t => [t.id, t.status, t.due, t.time, t.hours, t.pct, t.weight, t.priority, t.difficulty, Number(t.focusMin) || 0, (t.checklist || []).filter(i => i.done).length, (t.checklist || []).length, MILESTONE(t.type) ? remoteOf(t).v || "?" : ""].join(",")).join(";") + "#" + dailyHours() + "#" + todayHours();
}
const NEXT_SCHEMA = {type: "OBJECT", properties: {
  next: {type: "ARRAY", items: {type: "OBJECT", properties: {ref: {type: "STRING"}, why: {type: "STRING", description: "One sentence, why this and why now"}, step: {type: "STRING", description: "The concrete first thing to do, under 80 characters"}, minutes: {type: "INTEGER"}}, required: ["ref", "why"]}, description: "Up to 5 tasks in the order to work on them right now. Never a task marked FIXED EVENT"},
  estimates: {type: "ARRAY", items: {type: "OBJECT", properties: {ref: {type: "STRING"}, hours: {type: "NUMBER"}}, required: ["ref", "hours"]}, description: "Total hours for tasks marked 'no estimate'"},
  remaining: {type: "ARRAY", items: {type: "OBJECT", properties: {ref: {type: "STRING"}, hours: {type: "NUMBER"}}, required: ["ref", "hours"]}, description: "Hours of work left for tasks that are started (focus time, progress or checklist)"},
  readiness: {type: "ARRAY", items: {type: "OBJECT", properties: {ref: {type: "STRING"}, pct: {type: "INTEGER"}, note: {type: "STRING", description: "Under 90 characters, e.g. the weakest area"}}, required: ["ref", "pct"]}, description: "For each exam or quiz, how ready the student is, 0 to 100"},
  headsUp: {type: "ARRAY", items: {type: "OBJECT", properties: {ref: {type: "STRING", description: "The task it's about (t1...), or empty"}, text: {type: "STRING", description: "Under 140 characters, specific and actionable"}}, required: ["text"]}, description: "Up to 3 things the student could easily miss, only if real: an earlier step or sooner deadline hidden in instructions, an announcement that changes a task, a crunch or a full day coming, a course near its pass mark. Empty if nothing stands out."},
  difficulty: {type: "ARRAY", items: {type: "OBJECT", properties: {ref: {type: "STRING"}, level: {type: "STRING", enum: ["easy", "med", "hard"]}}, required: ["ref", "level"]}, description: "For tasks marked 'difficulty not set', how demanding the task looks from its title, type, weight and instructions"}},
  required: ["next"]};
async function autoPlan(a){
  const F = FOCUS || computeFocus(), L = learned(), now = new Date(), today = todayISO();
  const open = tasksArr().filter(t => t.status !== "done" && t.due).sort((x, y) => x.due < y.due ? -1 : 1).slice(0, 40);
  if (!open.length) return;
  const ref = {}, back = {};
  open.forEach((t, i) => { ref[t.id] = "t" + (i + 1); back["t" + (i + 1)] = t.id; });
  const deckInfo = cid => deckListArr().filter(d => d.courseId && d.courseId === cid).map(d => { const s = deckStats(d); return `${d.name}: ${Math.round(s.mastery * 100)}% mastered${s.last ? `, last quiz ${s.last.score}/${s.last.total}` : ""}`; }).join("; ");
  const rankOf = {}; (F.ranked || []).forEach((x, i) => { rankOf[x.t.id] = i + 1; });
  const lines = open.map(t => {
    const c = courseOf(t.courseId), p = progress(t), ps = MILESTONE(t.type) ? planSessions(t.id) : [];
    const bits = [`${ref[t.id]} | ${t.title} | ${t.type} | ${c ? courseLabel(c) : "no course"} | due ${t.due}${t.time ? " " + t.time : ""} (${dayDiff(today, t.due) < 0 ? -dayDiff(today, t.due) + " days overdue" : dayDiff(today, t.due) === 0 ? "today" : dayDiff(today, t.due) + " days away"})`,
      MILESTONE(t.type) ? (canDoNow(t) ? "TAKE-HOME (can be done from home, so it may be chosen for next)" : "FIXED EVENT (taken in person or not confirmed as take-home: never choose it for next)") : "",
      rankOf[t.id] && canDoNow(t) ? `rank ${rankOf[t.id]}` : "", `status ${t.status}`, hasWeight(t) ? `worth ${t.weight}%` : "", `priority ${t.priority}`, `difficulty ${t.difficulty}`,
      MILESTONE(t.type) ? "" : isNum(t.hours) && Number(t.hours) > 0 ? `estimate ${t.hours}h` : "no estimate",
      p.frac ? `progress ${Math.round(p.frac * 100)}%` : "", (t.checklist || []).length ? `checklist ${p.done}/${p.total}` : "",
      t.focusMin ? `focused ${t.focusMin}m so far` : "", t.prepFor ? `study session for ${(state.tasks[t.prepFor] || {}).title || "an exam"}` : "",
      ps.length ? `study plan ${ps.filter(x => x.status === "done").length}/${ps.length} sessions done` : "",
      MILESTONE(t.type) && deckInfo(t.courseId) ? `flashcards: ${deckInfo(t.courseId)}` : "",
      F.info[t.id] && canDoNow(t) ? `planner score ${Math.round(F.info[t.id].score)}` : "", blockers(t).length ? "BLOCKED" : "",
      lateUntilOf(t) ? `late submissions accepted until ${lateUntilOf(t)}` : lateOf(t) === "none" ? "no late submissions" : "",
      !hasWeight(t) && PTS_W[t.id] ? `about ${Math.round(PTS_W[t.id] * 10) / 10}% of grade (from points)` : "",
      lmsOf(t) && lmsOf(t).outOf ? `out of ${lmsOf(t).outOf} points` : "",
      lmsOf(t) && (lmsOf(t).files || []).length ? `${lmsOf(t).files.length} attached file${lmsOf(t).files.length === 1 ? "" : "s"}` : "",
      (!t.difficulty || t.difficulty === "med") && !MILESTONE(t.type) && !t.prepFor ? "difficulty not set" : "",
      t.notes && !t.prepFor && dayDiff(today, t.due) <= 21 ? `instructions: "${String(t.notes).replace(/\s+/g, " ").slice(0, 260)}"` : ""];
    return bits.filter(Boolean).join(" | ");
  }).join("\n");
  // Group project tasks assigned to this student: the AI weighs them (they take the same time), though it can't pick one for "next"
  let gLines = ""; try { gLines = (window.SBGROUPTASKS ? window.SBGROUPTASKS.mine() : []).slice(0, 15).map((g, i) => `g${i + 1} | ${g.title} | GROUP TASK in "${g.groupName || "a group project"}" | ${g.due ? `due ${g.due} (${dayDiff(today, g.due) < 0 ? -dayDiff(today, g.due) + " days overdue" : dayDiff(today, g.due) === 0 ? "today" : dayDiff(today, g.due) + " days away"})` : "no due date"} | status ${g.status}${g.priority ? " | priority " + g.priority : ""} | about ${g.hours || 1}h`).join("\n"); } catch(e) {}
  // The student's week: classes, labs, placements or work shifts, focus already done, course standings and fresh announcements
  const B = F.busy || {m: {}, what: {}};
  const week = [0, 1, 2, 3].map(i => { const d = addDays(today, i), h = B.m[d] || 0; let items = []; try { items = schOccurrences(d, d).filter(o => !o.skipped && !(o.type === "meet" && o.m && o.m.kind === "Office Hours")).map(o => `${o.label ? o.label + " " : ""}${o.title}${o.start ? " " + o.start + (o.end ? "-" + o.end : "") : " all day"}`).slice(0, 6); } catch(e) {} return `${i === 0 ? "Today" : parse(d).toLocaleDateString("en-US", {weekday: "long"})} ${d}: ${items.length ? items.join("; ") : "nothing scheduled"}${h ? ` (${fmtHM(h)} scheduled, about ${fmtHM(F.day && F.day[i] != null ? F.day[i] : F.dh)} left for study)` : ""}`; }).join("\n");
  const standings = coursesArr().map(c => { const g = courseRisk(c.id); if (!g || !g.marked || !g.marked.length || g.current == null) return ""; return `${courseLabel(c)}: ${Math.round(g.current)}% so far on ${Math.round(g.wMarked)}% of the grade, pass mark ${g.g.pass}%${g.risk ? ` (${g.risk === "risk" ? "at risk" : g.risk === "out" ? "can't reach the pass mark on paper" : "worth watching"})` : ""}`; }).filter(Boolean).join("; ") || "no marks yet";
  let news = []; try { news = typeof window.SBLMS_NEWS === "function" ? window.SBLMS_NEWS(7) : []; } catch(e) {}
  const newsTxt = news.map(n => { const c = courseOf(n.courseId); return `- ${c ? courseLabel(c) : ""} (${String(n.date || "").slice(0, 10)}): ${n.title}. ${String(n.text || "").replace(/\s+/g, " ").slice(0, 220)}`; }).join("\n") || "none";
  const hist = Object.entries(L.byType).map(([k, v]) => `${k}: ${v.length} finished, median ${fmtHM(median(v.map(x => x.h)))} of focused time`).join("; ") || "none yet";
  // Exact moment and zone, when this student tends to study, what they've been skipping, and today's progress
  let tz = ""; try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch(e) {}
  const peak = (() => { try { return peakStudyHours(tasksArr().flatMap(t => t.history || []), Date.now()); } catch(e) { return ""; } })();
  const fbw = nufbWeights(nufbLoad(), Date.now());
  const skipped = Object.entries(fbw.type).filter(e => e[1] <= -1.5).map(e => e[0]), liked = Object.entries(fbw.type).filter(e => e[1] >= 1.5).map(e => e[0]);
  const doneTodayN = allTasks().filter(t => t.status === "done" && t.doneAt && t.doneAt >= new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()).length;
  const r = await aiCall({task: "plan", auto: true, fast: true, maxTokens: 6000, temperature: 0.2, schema: NEXT_SCHEMA, parts: [{text: `Now: ${now.toLocaleDateString("en-US", {weekday: "long"})} ${today} ${pad(now.getHours())}:${pad(now.getMinutes())}${tz ? " (" + tz + ")" : ""}, ${dayPartOf(now.getHours())}. Study time left today: ${fmtHM(F.th)}${F.doneToday >= 0.25 ? ` (already focused ${fmtHM(F.doneToday)} today)` : ""}; usual per day: ${fmtHM(F.dh)}.${doneTodayN ? ` ${doneTodayN} task${doneTodayN === 1 ? "" : "s"} finished today.` : ""}\nThe next few days:\n${week}\nCourse standings: ${standings}\nRecent announcements from the school site:\n${newsTxt}\nThis student's history: ${hist}. They usually take ${L.ratio.toFixed(2)}x their own estimates.${peak ? ` They usually study around ${peak}.` : ""}${skipped.length ? ` They often skip suggestions of these types: ${skipped.join(", ")}.` : ""}${liked.length ? ` They usually accept: ${liked.join(", ")}.` : ""}\nOpen tasks (already ranked by the planner; "rank" 1 is its top choice; days are counted from today):\n${lines}${gLines ? `\n\nGroup project tasks assigned to this student (teammates are waiting on them; they use the same study time as the tasks above; they have refs g1, g2... which must never appear in "next" or anywhere else in your answer):\n${gLines}` : ""}`}],
    system: (gLines ? "The student also has group project tasks (GROUP TASK lines). They can't be picked for 'next', but count them as real work that competes for today's time: when one is due today or tomorrow, favor shorter tasks for 'next' so there is time for it, and in the reasons you may say a group task is due soon. " : "") + "You're an expert study planner working quietly inside a student's planner app. The tasks come pre-ranked by the app's own planner (rank, planner score, days away); treat that ranking as a strong default and only move a task up or down with a concrete reason from the data, never invent a task or id. Using the tasks, the time of day, the time left today and the student's own history: (1) choose up to 5 tasks to work on right now, best first (deadlines come first: never put a task due weeks away ahead of one due in the next few days that still needs work, unless the far one is a big task that needs most of the time left before it; grade weight only breaks ties between similar deadlines), each with a one-sentence reason that cites the evidence in the data (due day, grade weight, hours left, what it unblocks; never just repeat the title or say it is merely important), a concrete first step, and sensible session minutes (an exam or quiz may be chosen only if its line says TAKE-HOME; a line saying FIXED EVENT happens in person at a set time, so never choose it, pick its study tasks instead, and still judge its readiness); skip BLOCKED tasks. (2) Estimate total hours for tasks marked 'no estimate', leaning on how long this student's past tasks took. (3) For started tasks, estimate hours of work left, counting their focus time and progress and their tendency to underestimate. (4) For each exam or quiz, judge readiness 0 to 100 from study sessions done, flashcard mastery and quiz scores, with a short note. (5) Heads up: up to 3 real things the student could miss, read from the instructions, the announcements, the schedule and the standings (an earlier draft or pre-lab deadline, a changed due date or room, a full clinical day right before a deadline, a course near its pass mark); leave it empty rather than state the obvious. Every heads-up must name the specific task, course, day or number it is based on (for example 'Bio lab pre-quiz is due Wed, a day before the report') and must never be general advice like 'stay organized' or 'plan ahead'. (6) Rate how demanding tasks marked 'difficulty not set' look. Consider the schedule: long class or clinical days leave little study time, so plan around them and favour short tasks just before a class. Late submissions: a task that still accepts late work is less urgent than one that closes at the due time, but never suggest planning to be late. Use the refs exactly (t1, t2...). Return JSON only."});
  const d = r.data || {}, changes = [];
  // Only real, open, unblocked tasks that can be done now (never an in-person or unconfirmed exam or quiz), once each: anything the model invents or repeats is dropped (nextUp falls back to the planner's own ranking)
  const qctx = {titles: open.map(t => t.title), courses: coursesArr().map(c => courseLabel(c))};
  const next = autoCleanNext(d.next, back, id => { const t = state.tasks[id]; return !!t && t.status !== "done" && canDoNow(t) && !blockers(t).length; }, (id, why, step) => AINS.cleanPickText(why, step, (state.tasks[id] || {}).title, qctx));
  AUTO.next = {day: today, at: Date.now(), list: next, model: r.model};
  const patch = (id, fn) => { const cur = changes.find(c => c.id === id); const n = cur ? cur.after : clone(state.tasks[id]); if (fn(n) !== false && !cur) changes.push({kind: "task", id, after: n}); };
  (d.estimates || []).forEach(x => { const id = back[x.ref], t = id && state.tasks[id]; if (!t || MILESTONE(t.type) || isNum(t.hours)) return; const h = AINS.hoursSane(x.hours, localEstimate(t).hours); if (!h) return; if (t.aiHours && Math.abs(t.aiHours.h - h) / h < 0.15) return; patch(id, n => { n.aiHours = {h: Math.round(h * 4) / 4, at: Date.now()}; }); });
  (d.remaining || []).forEach(x => { const id = back[x.ref], t = id && state.tasks[id], h = Number(x.hours); if (!t || MILESTONE(t.type) || !(h >= 0) || h > 40) return; const sig = leftSig(t); if (t.aiLeft && t.aiLeft.sig === sig && Math.abs(t.aiLeft.h - h) < 0.25) return; patch(id, n => { n.aiLeft = {h: Math.round(h * 4) / 4, sig, at: Date.now()}; }); });
  // Heads-up lines must name real data, not repeat what the Suggestions tray already says, and be few
  let seenTxt = []; try { seenTxt = autoLiveInsights().map(e => insText(e).t); } catch(e) {}
  const heads = AINS.cleanHeads(d.headsUp, back, Object.assign({titleOf: id => (state.tasks[id] || {}).title, visible: seenTxt, openCount: open.length, countOn: dow => open.filter(t => dayDiff(today, t.due) >= 0 && dayDiff(today, t.due) <= 7 && parse(t.due).getDay() === dow).length, hasSource: id => !!(id && state.tasks[id] && String(state.tasks[id].notes || "").length > 30) || news.length > 0}, qctx));
  AUTO.heads = {day: today, at: Date.now(), list: heads};
  (d.difficulty || []).forEach(x => { const id = back[x.ref], t = id && state.tasks[id]; if (!t || (t.difficulty && t.difficulty !== "med") || MILESTONE(t.type) || !["easy", "med", "hard"].includes(x.level)) return; if (t.aiDiff && t.aiDiff.level === x.level) return; patch(id, n => { n.aiDiff = {level: x.level, at: Date.now()}; }); });
  (d.readiness || []).forEach(x => { const id = back[x.ref], t = id && state.tasks[id], p = Math.max(0, Math.min(100, Math.round(Number(x.pct)))); if (!t || !MILESTONE(t.type) || isNaN(p)) return;
    // A readiness number with nothing behind it is a guess: only accept it when there are sessions done, flashcard progress or a quiz score to base it on
    const ev = planSessions(t.id).some(z => z.status === "done") || decksArr().some(dk => dk.courseId && dk.courseId === t.courseId && (() => { const st = deckStats(dk); return st.mastery > 0 || !!st.last; })()); if (!ev) return;
    x.note = AINS.vet(x.note, {max: 90, min: 6}) ; if (t.aiPrep && Math.abs(t.aiPrep.pct - p) < 3 && autoFresh(t.aiPrep, 1)) return; patch(id, n => { n.aiPrep = {pct: p, note: x.note || "", at: Date.now()}; }); });
  if (changes.length) applyChanges(changes, null); else scheduleRender();
}
const TUNE_SCHEMA = {type: "OBJECT", properties: {
  steps: {type: "ARRAY", items: {type: "STRING"}, description: "3 to 6 steps for this session, each starting with minutes like '20m ', specific and active"},
  cardIds: {type: "ARRAY", items: {type: "STRING"}, description: "Ids of the flashcards most worth reviewing in this session, up to 40"},
  note: {type: "STRING", description: "One sentence on what this session focuses on and why"}}, required: ["steps"]};
async function autoTune(t){
  const ex = state.tasks[t.prepFor] || {}, c = courseOf(t.courseId);
  const deckIds = (t.studyDecks || []).filter(id => state.decks[id]);
  const w = weakSpots(deckIds);
  const cards = deckIds.flatMap(id => state.decks[id].cards.map(x => ({id: x.id, f: x.front, box: x.box, wrong: x.wrong}))).slice(0, 150);
  const r = await aiCall({task: "tune", auto: true, fast: true, maxTokens: 3000, temperature: 0.3, schema: TUNE_SCHEMA, parts: [{text: `Course: ${c ? c.name : ""}\nExam: ${ex.title || ""} on ${ex.due || "?"}, format: ${ex.planStyle || "not given"}\nTopics and confidence: ${(ex.planTopics || []).map(x => `${x.name} (${x.conf})`).join("; ") || "not given"}\nThis session (${t.due}, about ${Math.round((Number(t.hours) || 1) * 60)} minutes): ${(t.checklist || []).map(i => i.text).join(" / ")}\nThings the student keeps missing: ${w.cards.slice(0, 15).map(x => x.c.front).concat(w.qs.slice(0, 10).map(x => x.q.topic || x.q.stem.slice(0, 80))).join("; ") || "nothing recorded yet"}\nFlashcards (id: front, level 0-5, times wrong):\n${cards.map(x => `${x.id}: ${x.f.slice(0, 80)} (L${x.box}, wrong ${x.wrong})`).join("\n") || "none"}`}],
    system: "You tune one study session of a student's exam plan so it targets what they actually need. Keep the session's purpose and total time, but make the steps specific: name the concepts, the diagrams to draw, the problems to do, and fold in what they keep missing. Pick the flashcard ids most worth reviewing (weak and relevant first). Return JSON only."});
  const d = r.data || {}, n = clone(state.tasks[t.id]); if (!n) return;
  const steps = (d.steps || []).map(s => String(s).trim()).filter(Boolean).slice(0, 8);
  if (steps.length) n.checklist = n.checklist.filter(i => i.done).concat(steps.map(s => ({id: uid(), text: s.slice(0, 400), done: false})));
  const valid = new Set(cards.map(x => x.id));
  n.studyCardIds = (d.cardIds || []).filter(id => valid.has(id)).slice(0, 60);
  n.aiTuned = todayISO(); if (d.note) n.aiNote = String(d.note).slice(0, 240);
  applyChanges([{kind: "task", id: t.id, after: n}], null);
}
async function autoPractice(t){
  const ex = state.tasks[t.prepFor] || {}, c = courseOf(t.courseId);
  const deckIds = (t.studyDecks || []).filter(id => state.decks[id]);
  const cards = deckIds.flatMap(id => state.decks[id].cards).slice(0, 150);
  const topics = (ex.planTopics || []).map(x => `${x.name} (${x.conf})`);
  if (!deckIds.length || (cards.length < 5 && !topics.length)) { const n = clone(state.tasks[t.id]); n.practiceQuiz = {none: true}; applyChanges([{kind: "task", id: t.id, after: n}], null); return; }
  const r = await aiCall({task: "practice", auto: true, maxTokens: 24000, schema: QUIZ_SCHEMA, parts: [{text: `Course: ${c ? c.name : ""}\nExam: ${ex.title || ""}, format: ${ex.planStyle || "exam-style"}\nTopics (and how well the student knows them): ${topics.join("; ") || "see cards"}\nMaterial (flashcards):\n${cards.map(x => `${x.front} => ${x.back}`).join("\n")}\n\nWrite a 15-question practice test.`}],
    system: "You write a realistic practice test for an upcoming exam in its format, weighted toward the student's shaky topics. Mix types: 'single' (usually 4 options), 'multiple' (select all that apply), 'order' for sequences, and a few 'short'. 'correct' holds zero-based option indexes; for 'order' the indexes in the right order. Every question gets a rationale, one short note per option in 'optionNotes', and a 'topic'. Return JSON only."});
  const qs = aiCleanQuestions((r.data || {}).questions);
  const n = clone(state.tasks[t.id]); if (!n) return;
  if (!qs.length) { n.practiceQuiz = {none: true}; applyChanges([{kind: "task", id: t.id, after: n}], null); return; }
  const d = clone(state.decks[deckIds[0]]);
  const qz = {id: uid(), title: `Practice Test: ${ex.title || "Exam"}`, style: ex.planStyle || "", created: Date.now(), sources: ["Your study plan and flashcards"], questions: qs, results: [], kind: "practice"};
  d.aiQuizzes = (d.aiQuizzes || []).concat(qz);
  n.practiceQuiz = {deckId: d.id, quizId: qz.id};
  applyChanges([{kind: "deck", id: d.id, after: d}, {kind: "task", id: t.id, after: n}], null);
}
let autoTimer = null, autoBusy = false, autoErr = null;
function autoKick(delay){
  clearTimeout(autoTimer);
  autoTimer = setTimeout(autoRun, delay == null ? 2500 : delay);
}
async function autoRun(){
  const a = autoState();
  if (!a.on || autoBusy || document.hidden || navigator.onLine === false) return;
  if (autoErr && Date.now() - autoErr.at < (autoErr.code === "limit" ? 15 * 60000 : 5 * 60000)) return;
  if (autoBudget(a.paid) <= 0) return;
  const today = todayISO(), tomorrow = addDays(today, 1);
  let job = null;
  const sig = planSig();
  if (autoFeatOn("plan") && tasksArr().some(t => t.status !== "done" && t.due) && (AUTO.sig !== sig ? Date.now() - (AUTO.planAt || 0) > 90000 : Date.now() - (AUTO.planAt || 0) > 3 * 3600000))
    job = async () => { const prev = AUTO.sig, prevAt = AUTO.planAt; AUTO.sig = sig; AUTO.planAt = Date.now(); try { await autoPlan(a); } catch(e) { AUTO.sig = prev; AUTO.planAt = prevAt; throw e; } };   // a failed plan retries after the error back-off, not 3 hours later
  if (!job && autoFeatOn("sessions")) { const t = tasksArr().find(x => x.type === "Study" && x.prepFor && x.status !== "done" && (x.due === today || x.due === tomorrow) && !x.aiTuned); if (t) job = () => autoTune(t); }
  if (!job && autoFeatOn("sessions")) { const t = tasksArr().find(x => x.type === "Study" && x.studyKind === "practice" && x.status !== "done" && x.due && dayDiff(today, x.due) <= 2 && dayDiff(today, x.due) >= 0 && !x.practiceQuiz); if (t) job = () => autoPractice(t); }
  if (!job) { try { job = autoExtraJob(a); } catch(e) { console.warn("Automatic AI:", e); } }   // small extras: tidy tasks, announcements, exam plans, weekly review
  if (!job) return;
  autoBusy = true; AUTO.n = (AUTO.n || 0) + 1; autoSave();
  try { await job(); autoErr = null; AUTO.lastAt = Date.now(); }
  catch(e) { console.warn("Automatic AI:", e); autoErr = {at: Date.now(), code: e && e.code, msg: e && e.message}; if (e && (e.code === "offline" || e.code === "auto-off" || e.code === "nokey" || e.code === "preview")) AUTO.n = Math.max(0, (AUTO.n || 1) - 1); }   // a request that never left the device doesn't use up the day's budget
  autoBusy = false; autoSave();
  scheduleRender();                                   // show anything the job produced (suggestions, the chip's time)
  autoKick(1500);                                     // anything else waiting?
}
setInterval(() => autoKick(0), 10 * 60000);
document.addEventListener("visibilitychange", () => { if (!document.hidden) autoKick(1500); });
window.addEventListener("online", () => autoKick(1500));
function autoChipHtml(){
  // Only shown when it needs the student: paused for a paid-model confirmation. Otherwise Automatic AI stays out of the way (settings: AI Features, Suggestions > Manage).
  const a = autoState();
  if (a.reason === "confirm") return `<button class="ai-chip paused" data-act="ai-setup" title="Automatic AI is paused because it would use a paid model">Automatic AI Paused: Confirm</button>`;
  return "";
}
// Confirmation before automatic AI may use a paid model.
function autoPaidConfirmSheet(cfg, onDone){
  const P = AI_PROVIDERS[cfg.provider], name = aiModelName(cfg.provider, cfg.model);
  openSheet(`<form class="sheet">${head("Use a Paid Model Automatically?")}
    <div class="sheet-body">
      <p class="ai-disclaimer" style="margin:0"><b>This costs money.</b> Automatic AI would use <b>${esc(name)}</b>, billed per use to your ${esc(P.label.split(" ")[0])} account. It runs in the background whenever your tasks change and a few times a day: up to 12 requests a day on a paid model. Each request is small (your task list, new announcements or a few tasks, no files), except the occasional practice test. Smaller extras (tidying new tasks, announcement alerts, exam study plans, a weekly review) only run while plenty of the day's requests are left, and each can be turned off under Suggestions, Manage.</p>
      <p style="margin:0">To use it for free instead, add a Gemini key and choose "Free Gemini" for automatic AI.</p>
      <label class="mi-check"><input type="checkbox" id="apOk"> I understand automatic AI will use my paid ${esc(P.short)} account in the background and may cost money.</label>
    </div>
    <div class="sheet-foot"><button type="button" class="btn" id="apNo">Keep It Off</button><span class="spacer"></span><button type="button" class="btn primary" id="apYes" disabled>Confirm and Turn On</button></div></form>`);
  $("#apOk").addEventListener("change", e => { $("#apYes").disabled = !e.target.checked; });
  $("#apNo").addEventListener("click", () => { dlg.close(); onDone(false); });
  $("#apYes").addEventListener("click", () => { if (!$("#apOk").checked) return; dlg.close(); onDone(true); });
}

/*REMOTEX-START*/
/* Can this exam or quiz be taken from home?  Pure functions (no DOM, no app globals): tests/remotex.test.js loads this block as is.
   Exams and quizzes are normally taken at a set place and time, so they are never "Do This Next" unless we know they're taken from home.
   verdict(facts) reads what the school site gave us (submission types, quiz settings, an open window, a location) and the task's own text,
   and answers {verdict: "yes" | "no" | "unknown", confidence 0..1, why, src: "lms" | "rule"}. Unknown is NOT eligible: only "yes" is.
   vetAi() checks a model's answer against the same text before it is believed. A student's own answer always wins (remoteEff). */
const REMOTEX = (() => {
  const MS = t => t === "Exam" || t === "Quiz";
  const APPLY = 0.7;                                              // below this a verdict is not used: the AI or the student decides
  const prep = (s, n) => String(s == null ? "" : s).replace(/<[^>]*>/g, " ").replace(/https?:\/\/\S+/gi, " ").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, n || 2000);
  const alnum = s => String(s || "").toLowerCase().replace(/[‘’]/g, "'").replace(/[^a-z0-9]+/g, " ").trim();
  const STOP = new Set("that this with from have will your the and for are was were has had not you its they them then than when what which would could should about into over only also just each been being more most some such very there their these those other".split(" "));
  const words = s => alnum(s).split(" ").filter(w => w && !STOP.has(w) && (w.length > 3 || /^\d{2,}$/.test(w)));

  // Where it is taken: in person (label is shown as the evidence)
  const IN = [
    [/\bin[- ]class\b|\bduring (the )?(class|lecture|lab)( (time|period|session|hours?))?\b/i, "in class", 0.9],
    [/\bin[- ]person\b|\bface[- ]to[- ]face\b/i, "in person", 0.9],
    [/\bon[- ]campus\b|\bon site\b|\bonsite\b/i, "on campus", 0.9],
    [/\b(testing|exam(ination)?|assessment) (center|centre|lab|hall|services|site)\b/i, "testing centre", 0.9],
    [/\blecture (hall|theat(er|re))\b|\bauditorium\b|\bgymnasium\b/i, "lecture hall", 0.9],
    [/\bbring (a |an |your |the |two |some )?(pencils?|pens?|calculator|scantron|student id|photo id|id card|blue ?book|cheat sheet|note ?card|laptop charger)/i, "bring materials", 0.9],
    [/\bscantron\b|\bbubble ?sheets?\b|\bpaper (exam|test|quiz|copy|version)\b|\bon paper\b|\bpaper[- ]based\b|\bpencil and paper\b|\bhand(-| )written\b/i, "paper", 0.9],
    [/\bproctored (in|on|at)\b|\bproctor(ed)? (will be )?(present|in the room)\b|\bin[- ]room\b/i, "proctored in person", 0.9],
    [/\blab practical\b|\bpractical (exam|test|assessment)\b|\bosce\b|\bclinical skills?\b|\bcheck-?offs?\b|\bskills? (check|lab|exam|test|validation)\b|\bsimulation (lab|exam|test)\b/i, "practical", 0.9],
    [/\b(room|rm\.?|hall|bldg\.?|building)\s*#?[A-Z]?-?\d{1,4}[A-Z]?\b/i, "a room number", 0.72],
    [/\bwritten (exam|test|midterm|final)\b/i, "written exam", 0.72],
    [/\b(held|given|administered|take place|takes place) (in|at) (?!canvas|d2l|brightspace|blackboard|zoom|the lms|an? online|home|your)/i, "held at a place", 0.72]
  ];
  const NEG_IN = /\b(not|no|never|isn'?t|aren'?t|won'?t be|will not be|doesn'?t|does not|without|instead of|rather than|nothing)\b[^.;\n]{0,40}?\b(in[- ]person|on[- ]campus|in[- ]class|face[- ]to[- ]face|testing (center|centre)|on paper|at school)\b/gi;
  // From home / online
  const RM = [
    [/\btake[- ]?home\b/i, "take-home", 0.85],
    [/\bopen[- ]book (and )?online\b|\bonline open[- ]book\b/i, "open book online", 0.85],
    [/\bonline (exam|quiz|test|midterm|final|assessment)s?\b|\b(exam|quiz|test|midterm|final|assessment)s? (is |will be |are )?(taken |held |given |done |completed )?online\b/i, "online exam", 0.85],
    [/\b(respondus monitor|proctorio|proctoru|honorlock|examity|webcam|remote(ly)? proctor(ed|ing)?)\b/i, "online proctoring", 0.85, 1],
    // A lockdown browser locks the computer the exam is taken on, which is as often a campus lab or classroom as a laptop at home: not enough on its own
    [/\b(respondus( lockdown)?|lockdown ?browser|examsoft|safe exam browser)\b/i, "a lockdown browser", 0.6, 1],
    [/\bsubmit(ted)? (it |your (work|answers|exam|quiz|test) )?(online|electronically|(through|via|on|in) (canvas|d2l|brightspace|blackboard|the lms))\b/i, "submit online", 0.85],
    [/\b(quiz|exam|test|midterm|final)s? (is |will be |are )?(in|on|through|via) (canvas|d2l|brightspace|blackboard|the lms)\b/i, "in the course site", 0.85],
    [/\b(complete|take|taken|access|do|done) (it |this |the (exam|quiz|test) )?(online|in (canvas|d2l|brightspace|blackboard)|on (canvas|d2l|brightspace|blackboard)|from home|at home|remotely)\b/i, "taken online", 0.85],
    [/\bfrom home\b|\bat home\b|\bremotely\b|\bfrom anywhere\b|\bzoom\b|\bon your own (time|computer)\b/i, "from home", 0.85],
    [/\bavailable (from|between)\b[^.]{0,70}\b(until|to|through|and)\b/i, "an open window", 0.85],
    [/\bdue by 11:59\b|\bdue (at )?11:59\s?(pm)?\b/i, "11:59 pm deadline", 0.6],
    [/\bonline\b/i, "online", 0.6]
  ];
  const ONLINE_LOC = /\b(zoom|teams|webex|google meet|meet\.google|online|virtual|remote|canvas|d2l|brightspace|blackboard)\b|^https?:/i;
  const NO_LOC = /^(tbd|tba|n\/a|na|none|-+|\?+)$/i;
  const ONLINE_ST = ["online_quiz", "online_upload", "online_text_entry", "online_url", "media_recording", "external_tool", "student_annotation", "discussion_topic"];
  const EXAMWORD = /\b(exam|midterm|final|test|quiz|practical|assessment)\b/i;

  function inCues(text){
    const neg = [];
    const t = String(text || "").replace(NEG_IN, m => { neg.push(m); return " "; });
    const hits = [];
    IN.forEach(([re, label, c]) => { const m = re.exec(t); if (m) hits.push({label, c, m: m[0]}); });
    return {hits, negated: neg};
  }
  function rmCues(text, negated){
    const t = String(text || ""), hits = [];
    RM.forEach(([re, label, c, p]) => { if (re.test(t)) hits.push({label, c, p: !!p}); });
    (negated || []).forEach(() => hits.push({label: "not in person", c: 0.85}));
    return hits;
  }
  const hrsBetween = (a, b) => { const x = Date.parse(a), y = Date.parse(b); return isNaN(x) || isNaN(y) ? null : (y - x) / 36e5; };

  // facts: {type, title, text, location, rx: {k, st[], qt, tl, oq, ld, ip, ul, ll, sb, gt}, sched: {inClass, room}}
  function verdict(f){
    f = f || {};
    if (!MS(f.type)) return {verdict: "yes", confidence: 1, why: "Not an exam or quiz", src: "rule", na: true};
    const sig = [], add = (v, c, why, src, k) => sig.push({v, c, why, src, k});
    const body = prep([f.title, f.text].filter(Boolean).join(". "), 4000), loc = String(f.location == null ? "" : f.location).replace(/[<>\u0000-\u001f]/g, " ").replace(/\s+/g, " ").trim().slice(0, 160), rx = f.rx || {};
    // 1. The words: the title, the instructions and the location
    const cues = inCues(body + (loc && !ONLINE_LOC.test(loc) ? ". " + loc : ""));
    const strongIn = cues.hits.filter(h => h.c >= 0.9), weakIn = cues.hits.filter(h => h.c < 0.9);
    if (strongIn.length) add("no", Math.min(0.95, 0.9 + 0.02 * (strongIn.length - 1)), `The instructions say "${strongIn[0].m.slice(0, 40)}"`, "rule", "txt-no");
    else if (weakIn.length) add("no", 0.72, `The instructions mention ${weakIn[0].label}`, "rule", "txt-no");
    const rm = rmCues(body, cues.negated), strongRm = rm.filter(h => h.c >= 0.85), weakRm = rm.filter(h => h.c < 0.85);
    if (strongRm.length) add("yes", Math.min(0.95, 0.85 + 0.05 * (strongRm.length - 1)), `The text mentions ${strongRm[0].label}`, "rule", strongRm.some(h => !h.p) ? "txt-yes" : "txt-proc");   // online proctoring alone never outweighs "in person"
    else if (weakRm.length) add("yes", 0.6, `The text says "${weakRm[0].label}", which is not enough on its own`, "rule", "txt-weak");
    // 2. A location (calendar feed or event): a place means in person, a link or "online" means from home
    if (loc && !NO_LOC.test(loc)) {
      if (ONLINE_LOC.test(loc)) add("yes", 0.8, `The location says "${loc.slice(0, 40)}"`, "rule", "loc-yes");
      else add("no", 0.85, `It has a place on the calendar: ${loc.slice(0, 50)}`, "rule", "loc-no");
    }
    // 3. What the school site says about how it is handed in
    const st = (Array.isArray(rx.st) ? rx.st : []).map(x => String(x).toLowerCase());
    const online = st.filter(x => ONLINE_ST.includes(x));
    if (online.length) add("yes", 0.85, `School site: handed in online (${online[0].replace(/_/g, " ")})`, "lms", "lms-yes");
    else if (st.includes("on_paper")) add("no", 0.85, "School site: handed in on paper", "lms", "lms-no");
    else if (st.length && st.every(x => x === "none") && EXAMWORD.test(body)) add("no", 0.7, "School site: nothing is handed in online", "lms", "lms-none");
    if (rx.k === "quiz" && !online.length) add("yes", 0.85, "School site: an online quiz", "lms", "lms-yes");
    if (rx.k === "dropbox" && Number(rx.sb) === 2) add("no", 0.85, "School site: handed in on paper", "lms", "lms-no");
    else if (rx.k === "dropbox" && Number(rx.sb) === 3) add("no", 0.9, "School site: observed in person", "lms", "lms-no");
    else if (rx.k === "dropbox" && (rx.sb === 0 || rx.sb === 1 || rx.sb === "0" || rx.sb === "1")) add("yes", 0.85, "School site: a file or text is handed in online", "lms", "lms-yes");
    else if (rx.k === "dropbox") add("yes", 0.7, "School site: handed in to an online folder", "lms", "lms-yes");
    if (rx.gt === "Attempts" && !rx.k) add("yes", 0.7, "School site: taken as an online attempt", "lms", "lms-yes");
    else if (rx.gt === "Manual" && EXAMWORD.test(body)) add("no", 0.7, "School site: the instructor enters the mark by hand", "lms", "lms-none");
    if (rx.ld) add("yes", 0.6, "School site: needs a lockdown browser, which is used in labs as well as at home", "lms", "lms-ld");
    if (Number(rx.tl) > 0 && rx.k === "quiz") add("yes", 0.8, `School site: a ${Math.round(Number(rx.tl))} minute online time limit`, "lms", "lms-yes");
    if (rx.ip) add("no", 0.7, "School site: limited to certain computers (a campus network)", "lms", "lms-ip");
    const win = hrsBetween(rx.ul, rx.ll);
    // Open only a few hours on one day (a midterm open 9:50 to 11:30): a set sitting, which is usually in class or in a lab
    if (win != null && win > 0 && win <= 4 && /\b(exam|midterm|final|test)\b/i.test(body) && String(rx.ul).slice(0, 10) === String(rx.ll).slice(0, 10)) add("no", 0.75, `School site: open only ${win < 1.5 ? Math.round(win * 60) + " minutes" : Math.round(win * 10) / 10 + " hours"} on one day, a set sitting`, "lms", "lms-window");
    if (win != null && win > 12 && (f.type === "Quiz" || rx.k === "quiz" || win > 24)) add("yes", 0.8, `School site: open for ${win >= 48 ? Math.round(win / 24) + " days" : Math.round(win) + " hours"}, so taken on your own time`, "lms", "lms-yes");
    // 4. Your weekly schedule: a class meeting or an event with a room
    const sc = f.sched || {};
    if (sc.room) add("no", 0.8, `On your schedule at ${String(sc.room).slice(0, 50)}`, "rule", "sched-room");
    else if (sc.inClass) add("no", f.type === "Exam" ? 0.75 : 0.6, "It falls inside a class meeting on your schedule", "rule", "sched");
    return resolve(sig);
  }
  function resolve(sig){
    const yes = sig.filter(s => s.v === "yes" && s.c >= APPLY), no = sig.filter(s => s.v === "no" && s.c >= APPLY);
    const best = a => a.slice().sort((x, y) => y.c - x.c)[0];
    const out = (v, s, c) => ({verdict: v, confidence: Math.round(Math.min(0.97, c) * 100) / 100, why: String(s.why).slice(0, 120), src: s.src});
    if (!yes.length && !no.length) {
      const low = best(sig);
      return {verdict: "unknown", confidence: low ? Math.min(0.5, low.c) : 0, why: low ? String(low.why).slice(0, 120) : "Nothing says where it is taken", src: "rule"};
    }
    if (yes.length && !no.length) return out("yes", best(yes), best(yes).c + 0.02 * (yes.length - 1));
    if (no.length && !yes.length) return out("no", best(no), best(no).c + 0.02 * (no.length - 1));
    // Both: in-person words win over a school-site "online", unless the words also say it's online
    const txtNo = no.some(s => s.k === "txt-no" && s.c >= 0.9), txtYes = yes.some(s => s.k === "txt-yes");
    if (txtNo && !txtYes) return out("no", no.find(s => s.k === "txt-no"), 0.85);
    // A room on the calendar, with nothing in the words saying it's online: an online quiz taken in that room (a lab, a lockdown browser)
    const place = no.find(s => s.k === "loc-no" || s.k === "sched-room");
    if (place && !txtYes && !yes.some(s => s.k === "loc-yes")) return out("no", place, 0.8);
    const lmsYes = yes.find(s => s.src === "lms");
    if (lmsYes && no.every(s => s.k === "sched")) return out("yes", lmsYes, lmsYes.c - 0.05);
    return {verdict: "unknown", confidence: 0.4, why: `Mixed signals: ${best(yes).why}; ${best(no).why}`.slice(0, 120), src: "rule", conflict: true};
  }

  // The effective answer for one task: your own answer always wins, then what the rules can tell, then a checked AI answer made for this exact text.
  // t: {type, remote, remoteSrc, remoteWhy, remoteSig}; rule: verdict(...); sig: signature of the text now.
  function remoteEff(t, rule, sig){
    t = t || {};
    if (!MS(t.type)) return {v: "yes", src: "n/a", why: "", na: true};
    if ((t.remote === "yes" || t.remote === "no") && t.remoteSrc === "user") return {v: t.remote, src: "user", why: "You set this"};
    if (rule && rule.verdict !== "unknown" && rule.confidence >= APPLY) return {v: rule.verdict, src: rule.src, why: rule.why, conf: rule.confidence};
    if ((t.remote === "yes" || t.remote === "no") && t.remoteSrc === "ai" && (!sig || !t.remoteSig || t.remoteSig === sig)) return {v: t.remote, src: "ai", why: t.remoteWhy || ""};
    if (rule && rule.conflict) return {v: "", src: "", why: rule.why || "", conflict: true};
    // Nothing says it can be taken from home: exams and quizzes are assumed to be in person (the AI may still read the text, and you can change it)
    return {v: "no", src: "rule", why: "Assumed in person: nothing found says it is taken from home", assumed: true};
  }
  // THE gate: may this task be offered as something to work on now?  Everything that is not an exam or quiz always can.
  const canDoNow = (t, eff) => !t || !MS(t.type) || !!(eff && eff.v === "yes");

  // Is the model's answer believable?  raw: the parsed answer (or text); text: exactly what it was shown.
  function evidenceFound(ev, text){
    const e = String(ev || "").trim(), quoted = /^["“'‘][\s\S]{6,}["”'’]$/.test(e);
    const ne = alnum(e), nt = " " + alnum(text) + " ";
    if (ne.length < 6) return false;
    if (nt.includes(" " + ne + " ")) return true;
    if (quoted) return false;                                        // something put in quotes must be a real quote
    const w = words(e), set = new Set(words(text));
    if (w.length < 2) return false;
    return w.filter(x => set.has(x)).length / w.length >= 0.6;
  }
  function vetAi(raw, ctx){
    ctx = ctx || {};
    let d = raw;
    if (typeof d === "string") { try { d = JSON.parse(d); } catch (e) { return {ok: false, reason: "not-json"}; } }
    if (!d || typeof d !== "object" || Array.isArray(d)) return {ok: false, reason: "not-json"};
    const th = String(d.takeHome || "").toLowerCase(), conf = Number(d.confidence), text = String(ctx.text || "");
    if (!["yes", "no", "unknown"].includes(th)) return {ok: false, reason: "bad-answer"};
    if (th === "unknown") return {ok: true, apply: false, verdict: "unknown", confidence: isNaN(conf) ? 0 : conf, reason: "unknown"};
    if (!(conf >= 0 && conf <= 1)) return {ok: false, reason: "bad-confidence"};
    if (conf < APPLY) return {ok: true, apply: false, verdict: "unknown", confidence: conf, reason: "low-confidence"};
    const ev = prep(d.evidence, 240);
    if (ev.length < 6) return {ok: false, reason: "no-evidence"};
    if (!evidenceFound(ev, text)) return {ok: false, reason: "evidence-not-in-text"};
    const tc = inCues(text), ec = inCues(ev);
    if (th === "yes" && (tc.hits.length || ec.hits.length)) return {ok: false, reason: "in-person-cues"};
    if (th === "no") {
      const strongOnline = rmCues(text, tc.negated).filter(h => h.c >= 0.85);
      if (strongOnline.length && !ec.hits.length) return {ok: false, reason: "online-cues-without-evidence"};
      if (!ec.hits.length && !/\b(proctor|supervis|attend|campus|room|class|person|paper|location|site|lab|practical|written|invigilat|school|building|hall|center|centre)/i.test(ev)) return {ok: false, reason: "evidence-not-about-place"};
    }
    return {ok: true, apply: true, verdict: th, confidence: Math.round(conf * 100) / 100, why: ev.slice(0, 120)};
  }

  // The text the model is shown (and the only text its evidence may come from): sanitized, no links, capped
  function aiText(f){
    f = f || {}; const rx = f.rx || {}, bits = [];
    bits.push(`Title: ${prep(f.title, 120)}`, `Type: ${f.type}`);
    if (Array.isArray(rx.st) && rx.st.length) bits.push(`Submission types: ${rx.st.join(", ")}`);
    if (rx.k) bits.push(`Kind on the school site: ${rx.k}`);
    if (rx.tl) bits.push(`Time limit: ${rx.tl} minutes`);
    if (rx.ul || rx.ll) bits.push(`Available from ${rx.ul || "?"} until ${rx.ll || "?"}`);
    if (f.location) bits.push(`Location: ${prep(f.location, 120)}`);
    const desc = prep(f.text, 2000);
    if (desc) bits.push(`Description: ${desc}`);
    return bits.join("\n");
  }
  // Is there any real description to read?  No text means we ask the student instead of the AI.
  const hasText = f => prep(f && f.text, 2000).length >= 25;
  const sigOf = f => { f = f || {}; const rx = f.rx || {}; const s = ["r2", f.title, f.type, prep(f.text, 2000), (rx.st || []).join(","), rx.k, rx.tl, rx.ul, rx.ll, rx.sb, rx.gt, f.location].join("|"); let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); };

  // What the sync may store about how an item is handed in: small, plain values only
  function cleanRx(x){
    if (!x || typeof x !== "object" || Array.isArray(x)) return undefined;
    const o = {}, tok = (v, n) => String(v == null ? "" : v).toLowerCase().replace(/[^a-z0-9_ -]/g, "").slice(0, n || 24);
    if (Array.isArray(x.st)) { const st = x.st.map(v => tok(v, 24)).filter(Boolean).slice(0, 8); if (st.length) o.st = st; }
    if (["quiz", "assign", "dropbox", "discussion", "col", "event"].includes(x.k)) o.k = x.k;
    if (x.qt) o.qt = tok(x.qt, 24);
    if (Number(x.tl) > 0 && Number(x.tl) <= 1440) o.tl = Math.round(Number(x.tl));
    if (x.oq) o.oq = 1; if (x.ld) o.ld = 1; if (x.ip) o.ip = 1;
    const dt = v => typeof v === "string" && !isNaN(Date.parse(v)) ? v.slice(0, 30) : "";
    if (dt(x.ul)) o.ul = dt(x.ul); if (dt(x.ll)) o.ll = dt(x.ll);
    if (x.sb != null && x.sb !== "" && Number(x.sb) >= 0 && Number(x.sb) <= 9) o.sb = Number(x.sb);
    if (x.gt) o.gt = tok(x.gt, 16).replace(/^./, c => c.toUpperCase());
    return Object.keys(o).length ? o : undefined;
  }
  const noteOf = e => !e || !e.v ? "" : e.src === "user" ? "You set this." : e.src === "lms" ? `Detected from your school site. ${e.why}` : e.src === "ai" ? `Read from the instructions by Automatic AI: ${e.why}` : `Detected automatically. ${e.why}`;
  return {MS, APPLY, prep, verdict, resolve, remoteEff, canDoNow, vetAi, evidenceFound, aiText, hasText, sigOf, cleanRx, inCues, rmCues, noteOf};
})();
/*REMOTEX-END*/

/* ---------- Automatic AI, more quiet jobs: tidy new tasks, announcement alerts, exam study plans, weekly review, nudges ----------
   The app prepares the facts (pure functions in AINS, unit tested); the model only judges and writes, and everything it says is
   checked against real tasks, courses and dates before it's shown. Nothing is created or changed without a tap.
   Each job is cached by what it looked at, capped per day, and falls back to plain rules if the AI fails. */
/*AINS-START*/
const AINS = (() => {
  const P2 = n => String(n).padStart(2, "0");
  const isoD = d => `${d.getFullYear()}-${P2(d.getMonth() + 1)}-${P2(d.getDate())}`;
  const parseD = s => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
  const add = (s, n) => { const d = parseD(s); d.setDate(d.getDate() + n); return isoD(d); };
  const diff = (a, b) => Math.round((parseD(b) - parseD(a)) / 864e5);
  const isD = s => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && isoD(parseD(s)) === s;
  const isT = s => typeof s === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(s);
  const clean = (s, n) => String(s == null ? "" : s).replace(/\s+/g, " ").replace(/\s*[—–]\s*/g, ", ").replace(/[<>{}]|https?:\S*/g, "").trim().slice(0, n);
  const ms = t => t.type === "Exam" || t.type === "Quiz";
  const open = t => t && t.status !== "done";
  const isNumv = v => v !== null && v !== "" && v !== undefined && !isNaN(Number(v));
  const words = s => String(s || "").toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length > 2);
  const similar = (a, b) => { const x = words(a), y = words(b); if (!x.length || !y.length) return false; const hit = x.filter(w => y.includes(w)).length; return hit / Math.min(x.length, y.length) >= 0.7; };
  const CATS = ["exam", "deadline", "cancel", "room", "other"];

  // ----- 0. Quality gates: nothing the model writes is shown unless it is specific to this student's data -----
  // Generic advice that could be said to anyone ("stay organized", "don't forget", "make sure to...")
  const FILLER = [
    /\b(stay|keep|remain) (organi[sz]ed|on track|focused|motivated|positive|consistent|calm)\b/i,
    /\btime[- ]management\b|\b(manage|use|plan) your time\b/i,
    /\bdon'?t (forget|procrastinate|stress|worry|panic)\b/i,
    /\b(you('ve| have) got this|keep up the (good|great) work|great job|good luck|stay strong|believe in yourself|do your best|you can do it)\b/i,
    /\b(it'?s|it is) (important|essential|crucial|key|vital) (to|that)\b/i,
    /\b(make|be) sure (to|you|that)\b/i,
    /\b(prioriti[sz]e (your )?(tasks|work|assignments|deadlines)|break (it|tasks|things|them) (down|into)|plan ahead|(get|have) a head start|start early|be proactive|work smart|stay on top of|stay ahead)\b/i,
    /\b(deadlines?|exams?) (are|is) (approaching|coming up|near|around the corner)\b|\bbusy (week|day)s? ahead\b|\b(lots?|a lot) of (work|things|tasks)\b/i,
    /^(consider|try to|remember to|be careful|keep in mind)\b/i
  ];
  const STEP_GENERIC = /^(start|begin|continue|resume|work|get started|finish|complete|do)( working| on)?( on)? (it|this|that|the task|your task|your work|the assignment)\.?$/i;
  const STOP = new Set("the and for this that with your you are its it's is to of on in a an task tasks work working do doing finish start complete now then also just".split(" "));
  const generic = text => FILLER.some(r => r.test(String(text || "")));
  const facts = text => String(text || "").toLowerCase().split(/[^a-z0-9]+/).filter(w => w && !STOP.has(w) && (w.length > 2 || /^\d+$/.test(w)));
  // True when the text adds fewer than 2 facts beyond the task's own title
  const restates = (text, title) => { const tw = new Set(facts(title)); return facts(text).filter(w => !tw.has(w)).length < 2; };
  const WEEKDAY = /\b(mon|tues?|wed(nes)?|thu(rs)?|fri|sat(ur)?|sun)(day)?\b/i;
  // Does the text point at something real: a number, a day, or a word from a real task or course title?
  function cites(text, o){
    const t = String(text || "");
    if (/\d/.test(t) || WEEKDAY.test(t) || /\b(today|tonight|tomorrow|overdue|this week|next week)\b/i.test(t)) return true;
    const have = new Set(facts(t).filter(w => w.length >= 4));
    return [].concat((o && o.titles) || [], (o && o.courses) || []).some(x => facts(x).some(w => w.length >= 4 && have.has(w)));
  }
  // One gate for any short model-written line. Returns the cleaned text, or "" if it should not be shown.
  function vet(text, o){
    o = o || {};
    const t = clean(text, 2000);
    if (!t || t.length > (o.max || 160) || t.length < (o.min || 8)) return "";
    if (generic(t) || (o.step && STEP_GENERIC.test(t))) return "";
    if (o.title && restates(t, o.title)) return "";
    if (o.needCite && !cites(t, o)) return "";
    return t;
  }
  // "Thursday has 3 deadlines" must match the real count for that day; "5 tasks due" can't exceed what is actually open
  const DOW = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  function countClaimOk(text, ctx){
    if (!ctx || !ctx.countOn) return true;
    const m = /\b(\d+)\s+(deadlines?|tasks?|assignments?|exams?|quizzes|things|items)\b/i.exec(text); if (!m) return true;
    const w = WEEKDAY.exec(text);
    return w ? ctx.countOn(DOW.indexOf(w[0].toLowerCase().slice(0, 3))) === Number(m[1]) : Number(m[1]) <= (ctx.openCount || 0);
  }
  const SOURCE_CLAIM = /\b(instructions?|description|syllabus|rubric|announce(d|ment|ments)?|posted|notes? (say|state|mention))\b/i;
  // Heads-up lines: real task (or none), cite the data, not already said by another surface, never more than 2
  function cleanHeads(raw, back, ctx){
    const out = [];
    (Array.isArray(raw) ? raw : []).forEach(x => {
      if (!x) return;
      const ref = String(x.ref || "").trim(), id = ref ? back[ref] || "" : "";
      if (ref && !id) return;                                           // an id the model made up
      const text = vet(x.text, {max: 140, title: id && ctx.titleOf ? ctx.titleOf(id) : "", needCite: true, titles: ctx.titles, courses: ctx.courses});
      if (!text) return;
      // "the instructions say..." is only believable if there are instructions or announcements to read
      if (SOURCE_CLAIM.test(text) && ctx.hasSource && !ctx.hasSource(id)) return;
      if (!countClaimOk(text, ctx)) return;
      if (out.some(o => similar(o.text, text)) || (ctx.visible || []).some(v => similar(v, text))) return;
      out.push({id, text});
    });
    return out.slice(0, 2);
  }
  // The "why" and "first step" under Do This Next: dropped (the app's own reasons show instead) if generic or just the title again
  function cleanPickText(why, step, title, ctx){
    return {why: vet(why, {max: 150, title, needCite: true, titles: ctx && ctx.titles, courses: ctx && ctx.courses}), step: vet(step, {max: 80, min: 6, title, step: true})};
  }
  // An hours estimate must be believable next to the app's own estimate for that task
  function hoursSane(h, local){
    h = Number(h); if (!(h >= 0.25 && h <= 40)) return null;
    local = Number(local); if (local > 0 && (h / local > 3.5 || h / local < 1 / 3.5)) return null;
    return Math.round(h * 4) / 4;
  }
  // A weekly review is only worth showing if something happened or something is coming
  function weeklyWorth(s){ return !!(s.slippedN || s.heavy.length || s.exams.length || s.done >= 3); }
  // Counts in the recap must be real; the suggestion must name a real task or day
  function vetWeekly(d, s, dayName){
    d = d || {};
    const recap = vet(d.recap, {max: 300, min: 20}), sug = vet(d.suggestion, {max: 170, min: 12});
    if (!recap || !sug) return null;
    const real = new Set([s.done, s.slippedN, s.nextTotal].concat(s.next.map(x => x.count), s.heavy.map(x => x.count), [s.exams.length]));
    if ((recap.match(/\b\d+\b/g) || []).some(n => !real.has(Number(n)))) return null;
    const titles = [].concat(s.slipped.map(x => x.title), s.doneTitles || [], s.exams.map(x => x.title), ...s.next.map(x => x.titles));
    const sw = new Set(facts(sug));
    if (!WEEKDAY.test(sug) && !titles.some(x => facts(x).some(w => w.length >= 4 && sw.has(w)))) return null;
    return {recap, suggestion: sug};
  }

  // ----- 1. Tidy new tasks -----
  const GENERIC = /^(hw|homework|assignment|assign|task|project|reading|read|lab|quiz|exam|test|midterm|final|essay|paper|report|work|stuff|todo|misc|study|review|ch|chapter|unit|module|week|due|submit|submission|ps|pset|worksheet)[\s\d.#:\-_]*$/i;
  function vague(title){
    const s = String(title || "").trim();
    if (s.length <= 5 || GENERIC.test(s)) return true;
    if (/^[a-z]{1,4}\s?\d+[a-z]?(\s+[a-z]{1,2}\d+)?$/i.test(s)) return true;      // "hw3", "ps 4", "ch5 q2"
    return s.split(/\s+/).length <= 2 && s.length <= 12 && s === s.toLowerCase();
  }
  const triSig = t => [t.title, t.type, t.courseId, t.due].join("|");
  function triageCandidates({tasks, today, done, max}){
    return (tasks || []).filter(t => open(t) && !t.prepFor && (vague(t.title) || !t.courseId || t.type === "Other") && (done || {})[t.id] !== triSig(t)
      && (!t.due || (diff(today, t.due) <= 45 && diff(today, t.due) >= -14)))
      .sort((a, b) => (b.created || 0) - (a.created || 0)).slice(0, max || 6);
  }
  // raw: model answer; back: ref -> task; cback: ref -> course id. Only checked, real, changing fields survive.
  function cleanTriage(raw, back, cback, types, cnames){
    const out = [], seen = new Set();
    (raw && Array.isArray(raw.items) ? raw.items : []).forEach(x => {
      const t = x && back[String(x.ref || "").trim()]; if (!t || seen.has(t.id)) return; seen.add(t.id);
      const p = {}, title = clean(x.title, 80);
      if (vague(t.title) && title.length >= 6 && title.toLowerCase() !== String(t.title).trim().toLowerCase() && !vague(title)
        && (String(t.title).match(/\d+/g) || []).every(n => title.includes(n))) p.title = title;
      const ty = (types || []).includes(x.type) ? x.type : "";
      if (ty && ty !== t.type && (t.type === "Other" || t.type === "Assignment")) {
        if (!ms({type: ty}) || /exam|test|midterm|final|quiz/i.test(t.title + " " + (t.notes || ""))) p.type = ty;
      }
      if (["low", "med", "high", "urgent"].includes(x.priority) && t.priority === "med" && x.priority !== "med") p.priority = x.priority;
      const h = Number(x.hours), fin = p.type || t.type;
      if (!isNumv(t.hours) && !ms({type: fin}) && h >= 0.25 && h <= 20) p.hours = Math.round(h * 4) / 4;
      const cid = cback[String(x.courseRef || "").trim()];
      // A course is only suggested when the task's own title or notes point at it (a code or a name word); a guess from nothing isn't offered
      const evid = cid && (!cnames || (() => { const src = new Set(facts(t.title + " " + (t.notes || ""))); return facts(cnames[cid] || "").some(w => w.length >= 3 && src.has(w)); })());
      if (!t.courseId && cid && evid) p.courseId = cid;
      if (!p.title && !p.type && !p.priority && !p.courseId) delete p.hours;        // a bare hours guess just restates the app's own estimate
      if (Object.keys(p).length) out.push({id: t.id, sig: triSig(t), patch: p, why: clean(x.why, 120)});
    });
    return out;
  }

  // ----- 2. Announcements -----
  function annCandidates({items, seen, today, maxAgeDays, max}){
    const lim = Date.parse(today + "T00:00:00") - (maxAgeDays || 21) * 864e5;
    return (items || []).filter(n => n && n.key && !(seen || {})[n.key] && (n.title || n.text) && (!n.date || isNaN(Date.parse(n.date)) || Date.parse(n.date) >= lim)).slice(0, max || 5);
  }
  // Plain-rule read of an announcement, used when the AI can't be reached
  function annKeyword(text){
    const s = String(text || "");
    if (/cancel+ed|no class|class is off|will not meet|won't meet/i.test(s)) return "cancel";
    if (/room (change|has changed)|moved to (room|building|hall)|new (room|location)|location (change|has changed)/i.test(s)) return "room";
    if (/\b(exam|midterm|final|quiz|test)\b[^.]{0,80}\b(moved|rescheduled|postponed|scheduled|will be held)\b|\b(moved|rescheduled|postponed) (the |to )/i.test(s)) return "exam";
    if (/(deadline|due date)[^.]{0,60}(extended|changed|moved|now)|extended (until|to)|due (date )?(is )?(now|has been)/i.test(s)) return "deadline";
    return "";
  }
  function cleanAnn(raw, back, ctx){
    const out = [], seen = new Set(), today = ctx.today;
    (raw && Array.isArray(raw.items) ? raw.items : []).forEach(x => {
      const n = x && back[String(x.ref || "").trim()]; if (!n || seen.has(n.key)) return; seen.add(n.key);
      const first = String(n.text || n.title || "").replace(/\s+/g, " ").split(/(?<=[.!?])\s/)[0];
      const dfmt = txt => ctx.fmt ? String(txt).replace(/\b\d{4}-\d{2}-\d{2}\b/g, m => isD(m) ? ctx.fmt(m) : m) : txt;
      const sum0 = dfmt(String(x.summary || "")), first0 = dfmt(first);
      const sum = vet(sum0, {max: 170, min: 12, title: n.title}) || (restates(first0, n.title) ? "" : vet(first0, {max: 170, min: 12}));
      const kw = annKeyword(n.title + ". " + n.text);
      let cat = CATS.includes(x.category) ? x.category : "other";
      const imp = !!x.important && (cat !== "other" || !!kw);
      if (imp && cat === "other") cat = kw;
      const props = [];
      (Array.isArray(x.items) ? x.items : []).slice(0, 3).forEach(p => {
        if (!p || (p.kind !== "task" && p.kind !== "event")) return;
        const title = clean(p.title, 100), date = p.date;
        if (title.length < 3 || !isD(date) || diff(today, date) < -1 || diff(today, date) > 240) return;
        if ((ctx.tasks || []).some(t => t.due === date && similar(t.title, title))) return;
        if ((ctx.events || []).some(e => e.date === date && similar(e.title, title))) return;
        if (props.some(q => q.date === date && similar(q.title, title))) return;
        const src = new Set(facts(n.title + " " + n.text));
        if (!facts(title).some(w => w.length >= 4 && src.has(w))) return;                    // must come from the announcement itself
        const type = (ctx.types || []).includes(p.type) ? p.type : "Assignment";
        props.push({kind: p.kind, title, date, time: isT(p.time) ? p.time : "", type, cid: n.cid || ""});
      });
      out.push({key: n.key, sum, imp, cat: imp ? cat : "other", props});
    });
    return out;
  }

  // ----- 3. Exam coach -----
  function examCandidates({tasks, today, sessionsOf, maxDays}){
    return (tasks || []).filter(t => t.type === "Exam" && open(t) && t.due && diff(today, t.due) >= 1 && diff(today, t.due) <= (maxDays || 14) && !sessionsOf(t.id))
      .sort((a, b) => a.due < b.due ? -1 : 1);
  }
  function examTotalHours(t){
    const w = Number(t.weight) || 0;
    let h = w >= 30 ? 10 : w >= 15 ? 8 : w > 0 ? 6 : 7;
    if (t.difficulty === "hard") h += 2; else if (t.difficulty === "easy") h -= 1;
    return Math.max(3, Math.min(14, h));
  }
  // Spread `total` hours over the days before the exam, never more than a day's free time or `maxPer` hours, never under `minPer`.
  function examSlots({today, due, avail, total, maxPer, minPer, maxN}){
    maxPer = maxPer || 2; minPer = minPer || 0.5;
    let days = [];
    for (let d = add(today, 1); d < due; d = add(d, 1)) days.push({date: d, cap: Math.min(maxPer, Math.floor(Math.max(0, avail(d)) * 2) / 2)});
    const t0 = avail(today); if (t0 >= 1) days.unshift({date: today, cap: Math.min(maxPer, Math.floor(t0 * 2) / 2)});
    days = days.filter(d => d.cap >= minPer);
    if (maxN && days.length > maxN) { const all = days; days = Array.from({length: maxN}, (_, i) => all[Math.round(i * (all.length - 1) / Math.max(1, maxN - 1))]); }   // a few real sessions beat a dozen 30-minute ones
    for (let guard = 0; guard < 20 && days.length; guard++) {
      const cap = days.reduce((s, d) => s + d.cap, 0), tot = Math.min(total, cap), k = tot / cap;
      days.forEach(d => { d.hours = Math.round(d.cap * k * 4) / 4; });
      const low = days.filter(d => d.hours < minPer);
      if (!low.length) break;
      const worst = low.reduce((a, b) => a.hours <= b.hours ? a : b);
      days = days.filter(d => d !== worst);
    }
    return days.filter(d => d.hours >= minPer).map(d => ({date: d.date, hours: d.hours}));
  }
  const GEN_FOCUS = ["Learn the core ideas", "Practice problems and recall", "Mixed practice questions", "Teach it back and fix gaps", "Timed practice under exam conditions", "Final review of weak spots"];
  const GEN_STEPS = [["Skim the slides and notes, then close them and write what you remember", "Make a one-page list of the key terms and formulas"], ["Do practice problems without looking at your notes", "Check each answer and mark what you got wrong"], ["Work mixed practice questions from different topics", "Redo the ones you missed"], ["Explain each topic out loud as if teaching it", "Fix the gaps you find"], ["Do a past paper or practice test in the real time limit", "Mark it and list your three weakest topics"], ["Review only your weak spots and mistakes", "Write a short cheat sheet from memory and check it"]];
  function cleanCoach(raw, n){
    const arr = raw && Array.isArray(raw.sessions) ? raw.sessions : [], out = [];
    for (let i = 0; i < n; i++) {
      const s = arr[i] || {}, steps = (Array.isArray(s.steps) ? s.steps : []).map(x => clean(x, 160)).filter(x => x.length >= 15 && !generic(x) && !/^(re-?read|review|study|go over|look over)\b[^,.;:]{0,30}$/i.test(x)).slice(0, 4);
      const gi = n > 1 && i === n - 1 ? 5 : Math.min(i, 4), g = GEN_FOCUS[gi];
      let focus = clean(s.focus, 70); if (generic(focus) || out.some(o => o.focus.toLowerCase() === focus.toLowerCase())) focus = "";
      out.push({focus: focus || g, steps: steps.length ? steps : GEN_STEPS[gi]});
    }
    return out;
  }

  // ----- 4. Study material suggestions (no AI used) -----
  function materialSuggest({exams, today, materialOf, hasDeck, maxDays}){
    return (exams || []).filter(t => open(t) && ms(t) && t.courseId && t.due && diff(today, t.due) >= 0 && diff(today, t.due) <= (maxDays || 10) && materialOf(t.courseId) > 0 && !hasDeck(t.courseId))
      .map(t => ({id: t.id, days: diff(today, t.due), cid: t.courseId, n: materialOf(t.courseId)}));
  }

  // ----- 5. Weekly review -----
  // The Monday that starts the week to review: the week ending today on a Sunday, last week on a Monday, otherwise none.
  function reviewWeek(today){
    const wd = parseD(today).getDay();
    return wd === 0 ? add(today, -6) : wd === 1 ? add(today, -7) : "";
  }
  function weeklyStats({tasks, today, weekStart}){
    const a = parseD(weekStart).getTime(), nextStart = add(weekStart, 7), b = parseD(nextStart).getTime(), nextEnd = add(nextStart, 7);   // a week is 7 calendar days (167 or 169 hours across a clock change)
    const all = (tasks || []).filter(t => !t.prepFor);
    const done = all.filter(t => t.status === "done" && t.doneAt >= a && t.doneAt < b);
    const slipped = all.filter(t => open(t) && t.due && t.due >= weekStart && t.due < nextStart && t.due < today);
    const nx = {}; all.filter(t => open(t) && t.due && t.due >= nextStart && t.due < nextEnd).forEach(t => { (nx[t.due] = nx[t.due] || []).push(t.title); });
    const next = Object.keys(nx).sort().map(d => ({date: d, count: nx[d].length, titles: nx[d].slice(0, 4)}));
    const heavy = next.filter(d => d.count >= 2).sort((x, y) => y.count - x.count || (x.date < y.date ? -1 : 1)).slice(0, 2);
    const exams = all.filter(t => ms(t) && open(t) && t.due >= nextStart && t.due < nextEnd).map(t => ({title: t.title, date: t.due}));
    return {done: done.length, doneTitles: done.slice(0, 6).map(t => t.title), slipped: slipped.slice(0, 5).map(t => ({id: t.id, title: t.title, due: t.due})), slippedN: slipped.length, next, heavy, exams, nextTotal: next.reduce((s, d) => s + d.count, 0)};
  }
  function weeklyFallback(s, dayName){
    const bits = [`You finished ${s.done} task${s.done === 1 ? "" : "s"} last week${s.slippedN ? ` and ${s.slippedN} slipped past ${s.slippedN === 1 ? "its" : "their"} due date` : ""}.`];
    if (s.heavy.length) bits.push(`${dayName(s.heavy[0].date)} is the heavy day next week with ${s.heavy[0].count} deadlines.`);
    else if (s.nextTotal) bits.push(`${s.nextTotal} deadline${s.nextTotal === 1 ? " is" : "s are"} coming up next week.`);
    const sug = s.slippedN ? `Start by finishing or rescheduling “${s.slipped[0].title}”.` : s.heavy.length ? `Get ahead on one ${dayName(s.heavy[0].date)} task early in the week.` : "Pick your top task for Monday now so you can start right away.";
    return {recap: bits.join(" "), suggestion: sug};
  }

  // ----- 6. Nudges: crowded days, stalled work, overdue tasks (no AI used) -----
  function overloadDays({tasks, today, horizon, minCount, hoursOf, capHours}){
    const by = {};
    (tasks || []).filter(t => open(t) && !t.prepFor && t.due && diff(today, t.due) >= 0 && diff(today, t.due) <= (horizon || 7)).forEach(t => { (by[t.due] = by[t.due] || []).push(t); });
    const load = d => (by[d] || []).length, hrs = t => hoursOf ? hoursOf(t) : 0;
    return Object.keys(by).sort().filter(d => by[d].length >= (minCount || 3) || by[d].reduce((s, t) => s + hrs(t), 0) >= (capHours || 99)).map(d => {
      const list = by[d], movable = list.filter(t => !ms(t)).sort((a, b) => (a.priority === "low" ? 0 : 1) - (b.priority === "low" ? 0 : 1) || hrs(b) - hrs(a))[0];
      let to = "", best = 99;
      if (movable) for (let i = diff(today, d) - 1; i >= 0; i--) { const dd = add(today, i), l = load(dd); if (l < best && l <= 1) { best = l; to = dd; } }
      return {date: d, count: list.length, titles: list.slice(0, 4).map(t => t.title), move: movable && to ? {id: movable.id, title: movable.title, to, lms: !!movable._lms} : null};
    });
  }
  function stalledTasks({tasks, today, nowMs, days}){
    return (tasks || []).filter(t => t.status === "doing" && !t.prepFor && !ms(t) && t.due && diff(today, t.due) >= -3 && diff(today, t.due) <= 10 && (Number(t.pct) || 0) < 100).map(t => {
      const last = Math.max(t.created || 0, ...(t.history || []).map(h => h.at || 0));
      return {id: t.id, title: t.title, idle: Math.floor((nowMs - last) / 864e5), dueIn: diff(today, t.due)};
    }).filter(x => x.idle >= (days || 5)).sort((a, b) => a.dueIn - b.dueIn).slice(0, 3);
  }
  function overdueMoves({tasks, today, max}){
    const load = {}; (tasks || []).filter(t => open(t) && t.due && t.due >= today).forEach(t => { load[t.due] = (load[t.due] || 0) + 1; });
    const out = [];
    (tasks || []).filter(t => open(t) && !t.prepFor && !ms(t) && t.due && t.due < today && !t._lms && !t._lateOk).sort((a, b) => a.due < b.due ? -1 : 1).slice(0, max || 3).forEach(t => {
      let to = "";
      for (let i = 1; i <= 6 && !to; i++) { const d = add(today, i); if ((load[d] || 0) < 2) to = d; }
      if (!to) to = add(today, 1);
      load[to] = (load[to] || 0) + 1;
      out.push({id: t.id, title: t.title, late: diff(t.due, today), to});
    });
    return out;
  }

  // ----- 7. Grade risk (no AI used) -----
  function gradeAlerts(list){
    return (list || []).filter(g => g && (g.risk === "risk" || g.risk === "out")).map(g => ({
      id: g.cid + ":" + g.risk + ":" + Math.round(g.current || 0), cid: g.cid,
      text: g.risk === "out" ? `${g.name} can't reach the ${Math.round(g.pass)}% pass mark on paper: you're at ${Math.round(g.current)}% so far.`
        : `${g.name} is at ${Math.round(g.current)}% so far${g.need != null && g.need <= 100 ? `, and you'd need about ${Math.round(g.need)}% on the rest to reach the ${Math.round(g.pass)}% pass mark` : ""}.`}));
  }
  return {vague, triSig, triageCandidates, cleanTriage, annCandidates, annKeyword, cleanAnn, examCandidates, examTotalHours, examSlots, cleanCoach, materialSuggest, reviewWeek, weeklyStats, weeklyFallback, overloadDays, stalledTasks, overdueMoves, gradeAlerts, similar, clean, generic, restates, cites, vet, cleanHeads, cleanPickText, hoursSane, weeklyWorth, vetWeekly};
})();
/*AINS-END*/

