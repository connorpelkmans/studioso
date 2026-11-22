/* ===== module: 98-advice.js: study advice built from the student's own planner (no AI) ===== */
/* "Help me prioritize", "I have too much to do", "how should I study for my psych midterm", "I'm stressed", "how do I stop
   procrastinating", "make a study plan for this week": concrete steps naming their own overdue work, what's due next, exams
   coming up, cards due and their weakest course, with study methods that fit the question. Instant and never vague; null when
   the question isn't advice. */
window.SBADVICE = (() => {
  const low = s => String(s == null ? "" : s).toLowerCase();
  const ADVICE = /\b(how (much|long|many hours) should i (study|spend|work)|how (should|do|can|would) i (study|prepare|prep|revise|review|remember|memori[sz]e|learn|focus|manage|balance|stay|stop|get better|improve|deal|cope|start|catch up|get through|pass)|tips?|advice|best way|good way|ways to|help me (prioriti[sz]e|plan|study|focus|get|catch up|organi[sz]e)|study plan|plan (my|for|out) (the |this |next )?(week|day|weekend|study|studying)|prioriti[sz]e|too much to do|so much to do|overwhelm|stressed|stress|anxious|anxiety|nervous|worried|scared|procrastinat|motivat|behind|where (do|should) i (start|begin)|what should i focus on|i('m| am) (tired|lost|stuck|freaking out|panicking))\b/i;
  const days = (a, b) => Math.round((new Date(b + "T12:00:00") - new Date(a + "T12:00:00")) / 864e5);
  const dayName = (iso, today) => iso === today ? "today" : iso === addDays(today, 1) ? "tomorrow" : new Date(iso + "T12:00:00").toLocaleDateString(undefined, {weekday: "long", month: "short", day: "numeric"});
  const label = c => c ? (c.code || c.name || "") : "";
  const courseIn = s => { const T = window.SBTRUTH; return T && T.courseNamed ? T.courseNamed(s) : null; };
  const isExam = t => /exam|midterm|final|test|quiz/i.test((t.type || "") + " " + (t.title || ""));
  const dueCount = d => (d.cards || []).filter(c => { try { return cardDue(c); } catch (e) { return false; } }).length;

  const TIPS = {
    memorize: "Test yourself instead of rereading: cover the answer and say it first (active recall), then check. Short reviews spread over several days beat one long session.",
    exam: "Work backwards from the exam: a first pass of your notes now, practice questions in the middle, and the last two days for what you keep missing. Sleep the night before matters more than one more hour.",
    procrastinate: "Pick the smallest next step (open the document, write one heading) and start a 10-minute focus timer. Starting is the hard part; most people keep going once the timer ends.",
    stress: "Write down everything that's due, then pick only the first one. One thing at a time, a short break every 25 to 50 minutes, and real sleep: your brain files away what you studied while you sleep.",
    focus: "Phone in another room, one tab, and a focus timer. Work in blocks of 25 to 50 minutes with a 5-minute break between them.",
    plan: "Give each day one main thing and one small thing. Put deadlines first, then exam study in short daily sessions rather than one long one.",
  };

  function answer(q){
    const s = low(q); if (!ADVICE.test(s)) return null;
    const today = todayISO(), open = tasksArr().filter(t => t.status !== "done");
    const late = open.filter(t => t.due && t.due < today).sort((a, b) => a.due.localeCompare(b.due));
    const soon = open.filter(t => t.due && t.due >= today && t.due <= addDays(today, 3) && !isExam(t)).sort((a, b) => (a.due + (a.time || "")).localeCompare(b.due + (b.time || "")));
    const c = courseIn(s);
    let exams = open.filter(t => t.due && t.due >= today && t.due <= addDays(today, 21) && isExam(t) && (!c || t.courseId === c.id)).sort((a, b) => a.due.localeCompare(b.due));
    if (/\b(midterm|final)\b/.test(s)) { const k = (s.match(/\b(midterm|final)\b/) || [])[1]; const f = exams.filter(t => new RegExp(k, "i").test(t.title)); if (f.length) exams = f; }
    const decks = decksArr().map(d => ({d, due: dueCount(d)})).filter(x => x.due || (c && x.d.courseId === c.id));
    // how much to study: from their workload over the next week
    if (/\bhow (much|long|many hours) should i (study|spend|work)\b/.test(s)) {
      const week = open.filter(t => t.due && t.due >= today && t.due <= addDays(today, 6)).length, exam14 = open.filter(t => t.due && t.due >= today && t.due <= addDays(today, 14) && isExam(t)).length;
      const h = Math.min(5, 1 + week * 0.25 + exam14 * 0.5 + late.length * 0.25), lo = Math.max(1, Math.floor(h)), hi = Math.max(lo + 1, Math.ceil(h + 0.5));
      return {answer: `With ${week} thing${week === 1 ? "" : "s"} due this week${exam14 ? `, ${exam14} exam${exam14 === 1 ? "" : "s"} in the next two weeks` : ""}${late.length ? ` and ${late.length} overdue` : ""}, about ${lo} to ${hi} hours a day is a good target, in 25 to 50 minute blocks with short breaks. ${late.length ? `Start with ${late[0].title}.` : soon.length ? `Start with ${soon[0].title}.` : "Use the extra time to review your flashcards a little each day."}`, show: []};
    }
    const steps = [];
    const studyQ = /\b(study|prepare|prep|revise|review|pass|exam|midterm|final|test|quiz)\b/.test(s) && !/\b(prioriti[sz]e|too much|so much|plan (my|for|out)|study plan)\b/.test(s);
    if (studyQ && (exams.length || c)) {
      // studying for one exam or course: dates, their cards, their notes, then how
      const ex = exams[0], co = ex ? state.courses[ex.courseId] : c, n = ex ? days(today, ex.due) : 0;
      try { const G = window.SBFACTS && SBFACTS.gradeRows && co ? SBFACTS.gradeRows().find(r => r.code === label(co)) : null; if (G && G.cur != null && G.pass != null) steps.push(G.cur < G.pass ? `You're at ${G.cur}% in ${label(co)}, below the ${G.pass}% pass mark${G.need ? `: ${G.need.charAt(0).toLowerCase() + G.need.slice(1)}` : ""}. Every mark from here counts, so start now.` : `You're at ${G.cur}% in ${label(co)}, above the ${G.pass}% pass mark. Keep it there.`); } catch (e) {}
      if (ex) steps.push(`${ex.title} is ${dayName(ex.due, today)} (${n === 0 ? "today" : n === 1 ? "1 day away" : n + " days away"}). ${n > 6 ? `Plan about ${Math.min(6, Math.ceil(n / 2))} short sessions between now and then rather than one long one.` : n > 1 ? "Study a little every day until then." : "Review the key points and get good sleep."}`);
      const mine = decksArr().filter(d => co && d.courseId === co.id);
      if (mine.length) steps.push(`Start with your flashcards: ${mine.map(d => `${d.name}${dueCount(d) ? ` (${dueCount(d)} due)` : ""}`).join(", ")}. Answer before you flip.`);
      else if (co) steps.push(`Make flashcards from your ${label(co)} notes (ask me "make flashcards on ${co.name}"), then study them a few minutes a day.`);
      const nNotes = Object.values(state.notes || {}).filter(x => !x.archived && co && x.courseId === co.id).length;
      if (nNotes) steps.push(`Go through your ${nNotes} ${label(co)} note${nNotes === 1 ? "" : "s"} and turn each heading into a question you can answer from memory.`);
      steps.push(`Take a practice quiz a few days before (ask me "quiz me on ${co ? co.name : "this"}") and spend the rest of your time on what you miss.`);
      steps.push(TIPS.memorize);
      const calm = /stress|anxious|anxiety|nervous|scared|worried|freaking|panick/.test(s) ? "Being nervous before an exam is normal, and you have time to prepare. Here's a plan:\n" : "";
      return {answer: calm + steps.map((x, i) => `${i + 1}. ${x}`).join("\n"), show: ex ? [{kind: "task", id: ex.id}] : []};
    }
    // a method they asked about: the method first, then one step to try it on right now
    const tipQ = /\b(tips?|best way|good way|ways to|how (do|can|should) i (remember|memori[sz]e|learn|stop|focus|stay|deal|cope|get better|improve)|procrastinat|motivat|memori[sz]e|remember)\b/.test(s) && !/\b(exam|midterm|final|test|quiz)\b/.test(s);
    if (tipQ) {
      const topic = (s.match(/\b(?:remember|memori[sz]e|learn|study)\s+(?:the\s+|my\s+)?(.+?)\s*[?.!]*$/) || [])[1] || "";
      const tip = /procrastinat|motivat|stop|start/.test(s) ? TIPS.procrastinate : /focus|distract/.test(s) ? TIPS.focus : /stress|cope|deal/.test(s) ? TIPS.stress : TIPS.memorize;
      const deck = topic ? decksArr().find(d => low(d.name).includes(low(topic).split(" ")[0]) || (d.cards || []).some(c => low(c.front + " " + c.back).includes(low(topic).replace(/s$/, "").split(" ")[0]))) : null;
      const first = late[0] || soon[0];
      const now = tip === TIPS.memorize ? (deck ? `Try it now with ${deck.name}${dueCount(deck) ? ` (${dueCount(deck)} cards due)` : ""}.` : topic ? `Try it now: ask me "make flashcards on ${topic}", then study them for 10 minutes today and again in two days.` : decks.length ? `Try it now with your due flashcards.` : "Try it now: ask me to make flashcards from one of your notes.")
        : first ? `Try it now on ${first.title}${first.due < today ? " (it's overdue)" : ""}: ask me to start a 10-minute focus timer for it.` : "Try it now: ask me to start a 10-minute focus timer.";
      const extra = /defen[cs]e mechanisms?/.test(s) ? " For defense mechanisms, link each to a one-line example (projection: blaming a coworker for your own anger) and quiz yourself on the example, not the definition." : "";
      return {answer: `${tip}${extra}\n${now}`, show: []};
    }
    // what to do first: overdue, then due soon, then exam study, then reviews
    if (late.length) steps.push(`Finish what's overdue first: ${late.slice(0, 3).map(t => `${t.title} (was due ${dayName(t.due, today)})`).join(", ")}.`);
    if (soon.length) steps.push(`Then what's due soonest: ${soon.slice(0, 3).map(t => `${t.title} (${dayName(t.due, today)}${t.time ? " " + fmtTime(t.time) : ""})`).join(", ")}.`);
    if (exams.length) steps.push(`Start studying for ${exams[0].title} (${dayName(exams[0].due, today)}, ${days(today, exams[0].due)} days away) in short daily sessions${exams[1] ? `, and keep ${exams[1].title} (${dayName(exams[1].due, today)}) in mind` : ""}.`);
    const dd = decks.filter(x => x.due).sort((a, b) => b.due - a.due);
    if (dd.length) steps.push(`Review your due flashcards (${dd.reduce((a, x) => a + x.due, 0)} cards, about ${Math.max(5, Math.round(dd.reduce((a, x) => a + x.due, 0) * 0.4))} minutes), starting with ${dd[0].d.name}.`);
    try { const G = window.SBFACTS && SBFACTS.gradeRows ? SBFACTS.gradeRows().filter(r => r.cur != null && r.pass != null && r.cur < r.pass) : []; if (G.length) steps.push(`${G[0].code} is below the pass mark (${G[0].cur}%, needs ${G[0].pass}%): give it extra time this week${G[0].need ? ". " + G[0].need : ""}.`); } catch (e) {}
    if (!steps.length) steps.push("Nothing is overdue or due in the next few days. A good time to get ahead: review your flashcards or start the next big assignment.");
    const tip = /procrastinat|motivat|can'?t start|stuck/.test(s) ? TIPS.procrastinate : /stress|overwhelm|anxious|anxiety|too much|so much|freaking|panick|tired|lost/.test(s) ? TIPS.stress : /focus|distract/.test(s) ? TIPS.focus : /memori|remember|learn|terms|vocab/.test(s) ? TIPS.memorize : /plan/.test(s) ? TIPS.plan : "";
    const head = /stress|overwhelm|anxious|anxiety|too much|so much|freaking|panick/.test(s) ? "That's a lot, but it's manageable one step at a time:\n" : /plan/.test(s) ? "Here's a plan built from your planner:\n" : "";
    return {answer: `${head}${steps.map((x, i) => `${i + 1}. ${x}`).join("\n")}${tip ? `\n${tip}` : ""}`, show: (late[0] || soon[0]) ? [{kind: "task", id: (late[0] || soon[0]).id}] : []};
  }
  return {answer, ADVICE};
})();
