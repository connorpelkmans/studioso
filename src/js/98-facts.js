/* ===== module: 98-facts.js: planner questions answered by the app itself, exactly (no AI) ===== */
/* The questions students ask about their own planner, worked out from it: grade averages, best and worst course, what's failing,
   what they need, classes and where they are, what's on a day, the next exam, how many days until it, counts, the busiest day,
   flashcards due, which deck needs work, who teaches a course, office hours. 98-truth.js asks this first; null when the
   question isn't one of these, so the AI (with the planner as its source) answers instead. */
window.SBFACTS = (() => {
  const low = s => String(s == null ? "" : s).toLowerCase();
  const WD = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const wdOf = iso => WD[new Date(iso + "T12:00:00").getDay()];
  const Wd = iso => { const w = wdOf(iso); return w[0].toUpperCase() + w.slice(1); };
  const dayName = (iso, today) => iso === today ? "today" : iso === addDays(today, 1) ? "tomorrow" : `${Wd(iso)} ${new Date(iso + "T12:00:00").toLocaleDateString(undefined, {month: "short", day: "numeric"})}`;
  const tm = t => { try { return t ? fmtTime(t) : ""; } catch (e) { return t || ""; } };
  const label = c => c ? (c.code || c.name || "Course") : "";
  const nowHM = () => { const d = new Date(); return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0"); };
  const courseIn = s => { const T = window.SBTRUTH; return T && T.courseNamed ? T.courseNamed(s) : null; };
  const pl = (n, one, many) => `${n} ${n === 1 ? one : (many || one + "s")}`;

  /* ----- grades, from the grade book's own lines ----- */
  function gradeRows(){
    const G = window.SBGRADES; let lines = []; try { lines = G && G.lines ? G.lines() : []; } catch (e) {}
    return lines.map(l => {
      const t = l.replace(/\*\*/g, ""), code = t.split(":")[0].trim();
      const cur = (t.match(/current ([\d.]+)%/) || [])[1], pass = (t.match(/pass mark ([\d.]+)%/) || [])[1], letter = (t.match(/current [\d.]+% \(([^)]+)\)/) || [])[1];
      const marked = (t.match(/on ([\d.]+)% marked/) || [])[1], need = (t.match(/Needs? ([\d.]+)% on the remaining ([\d.]+)%[^.]*/) || [])[0];
      return {code, line: t, cur: cur != null ? Number(cur) : null, pass: pass != null ? Number(pass) : null, letter: letter || "", marked: marked != null ? Number(marked) : null, need: need || "", est: /WEIGHTS ARE ESTIMATES/.test(t), zero: /LOOKS WRONG/.test(t)};
    });
  }
  const gradeShort = r => `${r.code}: ${r.cur}%${r.letter ? ` (${r.letter})` : ""}${r.marked != null ? `, ${r.marked}% of the course marked` : ""}`;
  function grades(s){
    const GQ = /\b(grades?|marks?|average|avg|gpa|mean|overall|standing|passing|failing|fail|pass|best|worst|highest|lowest|strongest|weakest|doing (best|worst|well|badly|poorly)|struggling|percent(age)?|how am i doing|how'?m i doing)\b/;
    if (!GQ.test(s) || /\b(how do i|how to|tips?|study for|best way|way to|should i)\b/.test(s)) return null;
    // "best", "worst" are about grades only next to a course word
    if (/\b(best|worst|highest|lowest|strongest|weakest)\b/.test(s) && !/\b(grades?|marks?|class|classes|course|courses|subject|subjects|doing|score|scores)\b/.test(s)) return null;
    const rows = gradeRows(), marked = rows.filter(r => r.cur != null && !r.zero);
    if (!rows.length) return /\b(average|gpa|overall|all|across|best|worst|failing|passing)\b/.test(s) ? {answer: "You don't have any marks in Studyboard yet. Add them in Grades, or connect your school site, and I can work this out.", show: []} : null;
    const c = courseIn(s);
    // one piece of work named ("my grade on the psych midterm"): its own mark, or that it isn't marked yet
    { const W = /\b(midterm|final|exam|quiz|test|lab|assignment|essay|paper|project|report|care plan|journal|presentation)s?\b/.exec(s);
      if (W && /\b(on|for)\b/.test(s) && !/\b(all|every|each|across|average|overall)\b/.test(s)) {
        const words = s.replace(/\b(what'?s|what is|whats|my|grade|grades|mark|marks|score|on|for|the|did i get|get|i|in|how|do|did)\b/g, " ").split(/\s+/).filter(w => w.length > 1);
        const ts = (typeof state !== "undefined" ? Object.values(state.tasks || {}) : []).filter(t => !t.archived && (!c || t.courseId === c.id) && low(t.title).includes(W[1]))
          .sort((a, b) => words.filter(w => low(b.title).includes(w)).length - words.filter(w => low(a.title).includes(w)).length);
        const t = ts[0];
        if (t) {
          const m = t.mark, ok = m && m.got !== "" && m.got != null && Number(m.outOf) > 0;
          if (ok) return {answer: `${t.title}: ${m.got}/${m.outOf} (${Math.round(Number(m.got) / Number(m.outOf) * 1000) / 10}%).`, show: [{kind: "task", id: t.id}]};
          const r = c ? rows.find(x => [c.code, c.name].filter(Boolean).some(y => low(x.code).includes(low(y)))) : null;
          return {answer: `${t.title} doesn't have a mark in Studyboard yet${t.status !== "done" && t.due && t.due >= todayISO() ? " (it hasn't happened yet)" : ""}.${r && r.cur != null ? ` Your current grade in ${label(c)} is ${r.cur}%${r.letter ? ` (${r.letter})` : ""}.` : ""}`, show: [{kind: "task", id: t.id}]};
        }
      }
    }
    if (c && !/\b(all|every|each|across|other|compared?)\b/.test(s)) {
      const k = [c.code, c.name].filter(Boolean).map(low), r = rows.find(x => k.some(y => y && low(x.code).includes(y)) || k.some(y => y && y.includes(low(x.code))));
      if (!r || r.cur == null) return {answer: `${label(c)} doesn't have any marks in Studyboard yet.`, show: []};
      const pass = /\b(passing|failing|pass|fail)\b/.test(s) && r.pass != null ? (r.cur >= r.pass ? `Yes, you're passing ${label(c)}: ` : `Not yet: you're below the pass mark (${r.pass}%) in ${label(c)}: `) : "";
      return {answer: `${pass}${gradeShort(r)}${r.pass != null && !pass ? `; pass mark ${r.pass}%` : ""}.${r.need ? " " + r.need + "." : ""}${r.est ? " (Weights are estimated: the school site didn't give any.)" : ""}`, show: []};
    }
    const none = rows.filter(r => r.cur == null).map(r => r.code);
    if (/\b(average|avg|gpa|mean|overall|across|all (my )?(courses|classes|subjects))\b/.test(s)) {
      if (!marked.length) return {answer: `None of your courses have marks yet${none.length ? ` (${none.join(", ")})` : ""}, so there's no average to work out.`, show: []};
      const avg = Math.round(marked.reduce((a, r) => a + r.cur, 0) / marked.length * 10) / 10;
      return {answer: `Your average across ${pl(marked.length, "course")} with marks is ${avg}% (each course counted equally).\n${marked.sort((a, b) => b.cur - a.cur).map(r => "- " + gradeShort(r)).join("\n")}${none.length ? `\nNo marks yet: ${none.join(", ")}.` : ""}${/\bgpa\b/.test(s) ? "\nA GPA depends on your school's scale and credit hours, so this is the plain percentage average." : ""}`, show: []};
    }
    if (/\b(best|highest|strongest|doing (best|well))\b/.test(s) && marked.length) { const b = marked.slice().sort((a, b) => b.cur - a.cur)[0]; return {answer: `Your strongest course right now is ${gradeShort(b)}.${marked.length > 1 ? ` Next: ${marked.slice().sort((a, b) => b.cur - a.cur).slice(1, 3).map(gradeShort).join("; ")}.` : ""}`, show: []}; }
    if (/\b(worst|lowest|weakest|doing (worst|badly|poorly)|struggling)\b/.test(s) && marked.length) { const w = marked.slice().sort((a, b) => a.cur - b.cur)[0]; return {answer: `Your lowest course right now is ${gradeShort(w)}${w.pass != null ? `; the pass mark is ${w.pass}%` : ""}.${w.need ? " " + w.need + "." : ""}`, show: []}; }
    if (/\b(failing|fail|passing|pass)\b/.test(s)) {
      const below = marked.filter(r => r.pass != null && r.cur < r.pass), ok = marked.filter(r => r.pass == null || r.cur >= r.pass);
      if (!marked.length) return {answer: "None of your courses have marks yet, so I can't tell yet.", show: []};
      return {answer: below.length ? `${pl(below.length, "course")} ${below.length === 1 ? "is" : "are"} below the pass mark right now:\n${below.map(r => `- ${gradeShort(r)} (pass mark ${r.pass}%)${r.need ? ". " + r.need : ""}`).join("\n")}${ok.length ? `\nPassing: ${ok.map(r => r.code).join(", ")}.` : ""}` : `You're passing all ${pl(marked.length, "course")} with marks: ${marked.map(r => `${r.code} ${r.cur}%`).join(", ")}.`, show: []};
    }
    if (/\b(need|needs)\b/.test(s)) { const n = marked.filter(r => r.need); if (n.length) return {answer: n.map(r => `- ${r.code}: ${r.need}.`).join("\n"), show: []}; }
    if (/\b(all|my|each|every)\b.*\bgrades?\b|\bhow (am|'?m) i doing\b|\bhow are my (classes|courses|grades)\b/.test(s)) return {answer: rows.map(r => "- " + (r.cur != null ? gradeShort(r) : `${r.code}: no marks yet`)).join("\n"), show: []};
    return null;
  }

  /* ----- classes and the calendar ----- */
  function dayIn(s, today){
    if (/\btoday|tonight\b/.test(s)) return today;
    if (/\btomorrow\b/.test(s)) return addDays(today, 1);
    const m = s.match(/\b(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/); if (!m) return "";
    const w = WD.indexOf(m[1]), d0 = new Date(today + "T12:00:00").getDay(); let k = (w - d0 + 7) % 7; if (k === 0 || /\bnext\b/.test(s)) k = k || 7; return addDays(today, k);
  }
  const occsOn = (from, to) => { try { return schOccurrences(from, to).filter(o => !o.skipped && (o.type === "meet" || o.type === "event")).sort((a, b) => (a.date + (a.start || "")).localeCompare(b.date + (b.start || ""))); } catch (e) { return []; } };
  const occLine = (o, today, withDay) => `${withDay ? dayName(o.date, today) + ", " : ""}${o.allDay ? "all day" : `${tm(o.start)}–${tm(o.end)}`}: ${o.title}${o.label && o.type === "meet" ? " " + o.label.toLowerCase() : ""}${o.where ? ` (${o.where})` : ""}`;
  // a calendar event by name: "when is study group", "where is clinical orientation"
  function eventNamed(s, today){
    if (!/\b(when|where|what time|what day)\b/.test(s)) return null;
    const qw = (s.match(/[a-z0-9]+/g) || []).filter(w => w.length > 2 && !/^(when|where|what|time|day|the|my|is|are|next|for|and)$/.test(w));
    let best = null, bs = 0;
    eventsArr().forEach(e => { const tw = (low(e.title).match(/[a-z0-9]+/g) || []).filter(w => w.length > 2); const hit = tw.filter(w => qw.includes(w)).length; const sc = tw.length ? hit / tw.length : 0; if (hit && sc > bs) { bs = sc; best = e; } });
    if (!best || bs < 0.5) return null;
    const o = occsOn(addDays(today, -1), addDays(today, 120)).find(x => x.type === "event" && x.id === best.id && x.date >= today);
    if (!o) return {answer: `${best.title}${best.date ? " was on " + dayName(best.date, today) : ""}${best.where ? ", at " + best.where : ""}. I don't see it coming up again.`, show: [{kind: "event", id: best.id}]};
    return {answer: `${best.title}: ${dayName(o.date, today)}${o.allDay ? "" : `, ${tm(o.start)}–${tm(o.end)}`}${o.where ? `, at ${o.where}` : ""}.`, show: [{kind: "event", id: best.id}]};
  }
  // who teaches a course (asked without any class words)
  function teacher(s){
    if (!/\b(who teaches|who'?s teaching|instructor|professor|prof\b|teacher|lecturer|who is my|who'?s my)\b/.test(s)) return null;
    const c = courseIn(s); if (!c) return null;
    return {answer: c.instructor ? `${label(c)} is taught by ${c.instructor}.` : `${label(c)} doesn't list an instructor yet. You can add one in the course.`, show: []};
  }
  // "what's on today", "what's happening this week": classes, events and what's due, by day
  function agenda(s, today){
    if (s.length > 70 || /\b(patient|someone|somebody|person|he|she|they|client|child|kid)\b/.test(s)) return null;
    if (!/\bwhat'?s (happening|on|up|going on|planned)\b|\bagenda\b|\bmy (day|week) (look|looking)\b|\bwhat does my (day|week) look\b/.test(s)) return null;
    const week = /\bweek\b/.test(s), from = week ? today : (dayIn(s, today) || today), to = week ? addDays(today, 6) : from;
    const occ = occsOn(from, to), due = tasksArr().filter(t => t.status !== "done" && t.due && t.due >= from && t.due <= to);
    if (!occ.length && !due.length) return {answer: `Nothing is scheduled ${week ? "this week" : dayName(from, today)}, and nothing is due.`, show: []};
    const days = []; for (let d = from; d <= to; d = addDays(d, 1)) { const o = occ.filter(x => x.date === d), t = due.filter(x => x.due === d); if (o.length || t.length) days.push(`${dayName(d, today)[0].toUpperCase() + dayName(d, today).slice(1)}: ${[...o.map(x => occLine(x, today, false)), ...t.map(x => "due: " + x.title)].join("; ")}`); }
    return {answer: days.join("\n"), show: []};
  }
  function classes(s, today){
    const CQ = /\b(class|classes|lecture|lectures|lab|labs|seminar|tutorial|calendar|schedule|timetable|events?|free|busy|meetings?|office hours)\b/;
    const c = courseIn(s);
    // "where do I go for psych", "where is bio": where the course meets next
    if (c && /\bwhere\b/.test(s) && !CQ.test(s)) s = s + " class";
    if (!CQ.test(s) || /\b(add|create|make|move|change|cancel|skip|delete|remove|reschedule)\b/.test(s)) return null;
    // who teaches it, where it meets, office hours
    if (c && /\b(who|teach|teaches|instructor|professor|prof|teacher|lecturer)\b/.test(s)) return {answer: c.instructor ? `${label(c)} is taught by ${c.instructor}.` : `${label(c)} doesn't list an instructor yet. You can add one in the course.`, show: []};
    if (c && /\boffice hours?\b/.test(s)) { const ms = courseMeetings(c).filter(m => /office/i.test(m.kind)); return {answer: ms.length ? `${label(c)} office hours: ${ms.map(m => `${m.days ? m.days.map(d => Wd(addDays("2026-01-04", d)).slice(0, 3)).join("/") + " " : ""}${tm(m.start)}–${tm(m.end)}${m.where ? " in " + m.where : ""}`).join("; ")}.` : c.office ? `${label(c)} office hours: ${c.office}.` : `${label(c)} doesn't list office hours yet.`, show: []}; }
    if (/\bwhen do i have (a |my )?(class|lecture|lab)s?\b|\bwhat time is (my )?(class|lecture|lab)\b|\bnext (class|lecture|lab)\b|\b(class|lecture|lab) next\b|\bwhen is my next\b|\bwhat time is my (class|lecture|lab)\b|\bwhere is my (class|lecture|lab)\b/.test(s) || (c && /\b(when|where|what time)\b/.test(s) && /\b(class|lecture|lab|seminar|meet)\b/.test(s))) {
      const kind = (s.match(/\b(lab|lecture|tutorial|seminar|discussion|recitation)\b/) || [])[1];
      const now = nowHM(), up0 = occsOn(today, addDays(today, 21)).filter(o => o.type === "meet" && (!c || o.id === c.id) && (o.date > today || (o.end || "") > now)), up = kind && up0.some(o => new RegExp(kind, "i").test(o.label)) ? up0.filter(o => new RegExp(kind, "i").test(o.label)) : up0;
      if (!up.length) return {answer: c ? `I don't see an upcoming class for ${label(c)} in the next 3 weeks. Its meeting times may not be set yet.` : "I don't see any upcoming classes in the next 3 weeks. Add meeting times to your courses and I'll know.", show: []};
      return {answer: `Your next ${c ? label(c) + " " : ""}class: ${occLine(up[0], today, true)}.`, show: []};
    }
    const day = dayIn(s, today);
    if (day && /\b(class|classes|lecture|lab|schedule|calendar|on|have|free|busy|events?|plans?)\b/.test(s)) {
      const list = occsOn(day, day).filter(o => !c || o.id === c.id || (o.course && o.course.id === c.id));
      const due = tasksArr().filter(t => t.status !== "done" && t.due === day);
      const when = dayName(day, today);
      if (/\bfree\b/.test(s) && !list.length) return {answer: `You have nothing scheduled ${when}${due.length ? `, though ${pl(due.length, "task")} ${due.length === 1 ? "is" : "are"} due: ${due.map(t => t.title).join(", ")}` : ""}.`, show: []};
      if (!list.length && !due.length) return {answer: `Nothing is scheduled ${when}, and nothing is due.`, show: []};
      return {answer: `${when[0].toUpperCase() + when.slice(1)}:\n${list.map(o => "- " + occLine(o, today, false)).join("\n")}${due.length ? `${list.length ? "\n" : ""}Due ${when}: ${due.map(t => t.title + (t.time ? " at " + tm(t.time) : "")).join(", ")}.` : ""}`, show: []};
    }
    if (/\bwhat (classes|courses) (am i|do i)\b|\bmy (classes|courses)\b/.test(s) && !day) return null;
    return null;
  }

  /* ----- exams, counts, workload ----- */
  const isExam = t => /exam|midterm|final|test/i.test((t.type || "") + " " + (t.title || ""));
  function exams(s, today){
    if (!/\b(exam|exams|midterm|midterms|final|finals|test|tests|quiz|quizzes)\b/.test(s)) return null;
    if (!/\b(next|upcoming|coming up|first|soonest|any|how (many|long)|days (until|till|left)|until|till|when|what)\b/.test(s) || /\b(study|prepare|prep|tips|help me|grade|mark|score|got|get on)\b/.test(s)) return null;
    const c = courseIn(s), quiz = /\bquiz/.test(s) && !/\bexam|test|midterm|final/.test(s);
    let list = tasksArr().filter(t => t.status !== "done" && t.due && t.due >= today && (quiz ? /quiz/i.test(t.type + " " + t.title) : isExam(t)) && (!c || t.courseId === c.id)).sort((a, b) => a.due.localeCompare(b.due));
    // one they name: "my A&P final", "the psych midterm"
    const kindW = (s.match(/\b(midterm|final)\b/) || [])[1];
    if (kindW) { const k = list.filter(t => new RegExp(kindW, "i").test(t.title + " " + t.type)); if (k.length) list = k; }
    const what = quiz ? "quiz" : "exam";
    const daysTo = t => Math.round((new Date(t.due + "T12:00:00") - new Date(today + "T12:00:00")) / 864e5);
    if (/\b(days|weeks|long) (until|till|left|before)\b|\bhow (long|many days|much time)\b/.test(s) && list.length) { const t = list[0], n = daysTo(t); return {answer: `${t.title} is ${dayName(t.due, today)}${t.time ? " at " + tm(t.time) : ""}: ${n === 0 ? "that's today" : n === 1 ? "1 day from now" : `${n} days from now`}${n >= 14 ? ` (about ${Math.round(n / 7)} weeks)` : ""}.`, show: [{kind: "task", id: t.id}]}; }
    if (/\b(what|which|any|coming up|upcoming)\b/.test(s) && !/\bnext\b|\bwhen\b/.test(s) && !kindW) return {answer: list.length ? `${list.length === 1 ? "One " + what : list.length + " " + (what === "quiz" ? "quizzes" : "exams")} coming up${c ? " in " + label(c) : ""}:\n${list.slice(0, 10).map(t => `- ${t.title}${state.courses[t.courseId] && !c ? ", " + label(state.courses[t.courseId]) : ""}: ${dayName(t.due, today)} (${daysTo(t) === 1 ? "1 day" : daysTo(t) + " days"})`).join("\n")}` : `No ${what === "quiz" ? "quizzes" : "exams"} are on your planner${c ? " for " + label(c) : ""}. If you know a date, ask me to add it.`, show: []};
    if (/\bhow many\b/.test(s)) return {answer: list.length ? `You have ${pl(list.length, what, what === "quiz" ? "quizzes" : "exams")} coming up${c ? " in " + label(c) : ""}: ${list.slice(0, 8).map(t => `${t.title} (${dayName(t.due, today)})`).join(", ")}.` : `No ${what === "quiz" ? "quizzes" : "exams"} are on your planner${c ? " for " + label(c) : ""}.`, show: []};
    if (!list.length) return {answer: `I don't see an upcoming ${what}${c ? " for " + label(c) : ""} on your planner. If you know the date, ask me to add it.`, show: []};
    if (kindW && !c && list.length) { const t = list[0], n = daysTo(t); return {answer: `${t.title} is ${dayName(t.due, today)}${t.time ? " at " + tm(t.time) : ""} (${n === 0 ? "today" : n === 1 ? "tomorrow" : n + " days from now"}).`, show: [{kind: "task", id: t.id}]}; }
    const t = list[0], days = Math.round((new Date(t.due + "T12:00:00") - new Date(today + "T12:00:00")) / 864e5), co = state.courses[t.courseId];
    return {answer: `Your next ${what}${c ? "" : co ? " is " + label(co) + "'s" : ""}${c ? " in " + label(c) + " is" : ""} ${t.title}, ${dayName(t.due, today)}${t.time ? " at " + tm(t.time) : ""}: ${days === 0 ? "that's today" : days === 1 ? "that's tomorrow" : `${days} days from now`}.`, show: [{kind: "task", id: t.id}]};
  }
  function counts(s, today){
    if (!/\bhow many\b|\bbusiest\b|\bworkload\b|\bheaviest\b/.test(s)) return null;
    if (/\b(cards?|flashcards?|decks?)\b/.test(s)) return null;
    const open = tasksArr().filter(t => t.status !== "done");
    if (/\bbusiest|heaviest|workload\b/.test(s)) {
      const by = {}; open.filter(t => t.due && t.due >= today && t.due <= addDays(today, 13)).forEach(t => { by[t.due] = (by[t.due] || 0) + 1; });
      const top = Object.entries(by).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
      if (!top.length) return {answer: "Nothing is due in the next two weeks.", show: []};
      return {answer: `Your busiest day in the next two weeks is ${dayName(top[0][0], today)}, with ${pl(top[0][1], "thing")} due: ${open.filter(t => t.due === top[0][0]).map(t => t.title).join(", ")}.${top[1] ? ` Next busiest: ${dayName(top[1][0], today)} (${top[1][1]}).` : ""}`, show: []};
    }
    if (/\b(tasks?|assignments?|homework|things|left|to do|due|overdue)\b/.test(s)) {
      const T = window.SBTRUTH; let r = null; try { r = T && T.range ? T.range(s, today) : null; } catch (e) {}
      const c = courseIn(s), inC = t => !c || t.courseId === c.id;
      if (r) return null;   // a window ("this week", "overdue"): 98-truth.js lists them
      const left = open.filter(inC), late = left.filter(t => t.due && t.due < today);
      return {answer: `You have ${pl(left.length, "open task")}${c ? " in " + label(c) : ""}${late.length ? `, ${late.length} of them overdue` : ""}.${left.length ? ` Soonest: ${left.filter(t => t.due && t.due >= today).sort((a, b) => a.due.localeCompare(b.due)).slice(0, 3).map(t => `${t.title} (${dayName(t.due, today)})`).join(", ") || "none with a due date"}.` : ""}`, show: []};
    }
    if (/\b(courses?|classes)\b/.test(s)) { const cs = coursesArr(); return {answer: cs.length ? `You're taking ${pl(cs.length, "course")}: ${cs.map(label).join(", ")}.` : "You haven't added any courses yet.", show: []}; }
    return null;
  }
  function courseList(s){
    if (!/\bwhat (courses|classes|subjects) (am i|do i)\b|\b(list|show) (my )?(courses|classes)\b|\bwhich (courses|classes) (am i|do i)\b/.test(s)) return null;
    const cs = coursesArr(); return {answer: cs.length ? `Your courses: ${cs.map(c => label(c) + (c.name && c.code ? ` (${c.name})` : "") + (c.instructor ? `, ${c.instructor}` : "")).join("; ")}.` : "You haven't added any courses yet.", show: []};
  }

  /* ----- flashcards ----- */
  function cards(s){
    if (!/\b(cards?|flashcards?|decks?|review|study set)\b/.test(s)) return null;
    if (/\b(make|create|generate|add|build|write|quiz me|test me|delete|rename)\b/.test(s)) return null;
    const ds = decksArr(), dueOf = d => (d.cards || []).filter(c => { try { return cardDue(c); } catch (e) { return false; } }).length, newOf = d => (d.cards || []).filter(c => !c.seen).length;
    if (!ds.length) return {answer: "You don't have any flashcard decks yet. Ask me to make some from your notes.", show: []};
    if (/\bhow many\b/.test(s) && /\bdecks?\b/.test(s) && !/\bdue|review\b/.test(s)) return {answer: `You have ${pl(ds.length, "deck")} with ${ds.reduce((a, d) => a + (d.cards || []).length, 0)} cards in all.`, show: []};
    if (/\b(due|review|how many|what should i (study|review)|which deck|what deck|deck (should|to)|needs? (work|practice|review)|weakest|study next)\b/.test(s)) {
      const rows = ds.map(d => ({d, due: dueOf(d), fresh: newOf(d), weak: (d.cards || []).filter(c => c.seen && (c.wrong || 0) > (c.right || 0)).length})).filter(x => x.due || x.fresh || x.weak);
      const total = rows.reduce((a, x) => a + x.due, 0);
      if (!rows.length) return {answer: "No cards are due right now, and every card has been studied. Nice work.", show: []};
      const top = rows.slice().sort((a, b) => (b.due + b.weak) - (a.due + a.weak) || b.fresh - a.fresh)[0];
      return {answer: `${total ? `${pl(total, "card")} ${total === 1 ? "is" : "are"} due for review` : "No reviews are due"}${rows.some(x => x.fresh) ? `, plus ${rows.reduce((a, x) => a + x.fresh, 0)} new cards` : ""}. Start with ${top.d.name}${top.due ? ` (${top.due} due` : " ("}${top.weak ? `${top.due ? ", " : ""}${top.weak} you've missed more than you've got` : ""}${!top.due && !top.weak ? `${top.fresh} new` : ""}).${rows.length > 1 ? `\n${rows.filter(x => x !== top).slice(0, 5).map(x => `- ${x.d.name}: ${x.due} due${x.fresh ? `, ${x.fresh} new` : ""}`).join("\n")}` : ""}`, show: [{kind: "deck", id: top.d.id}]};
    }
    return null;
  }

  // "what's due in PSYN 2100", "what do I have left for bio": everything open for it, soonest first (a window goes to 98-truth.js)
  function dueAll(s, today){
    if (/\bnext (deadline|thing due|due date)\b|\bwhat'?s due next\b/.test(s)) { const n = tasksArr().filter(t => t.status !== "done" && t.due && t.due >= today).sort((a, b) => (a.due + (a.time || "")).localeCompare(b.due + (b.time || "")))[0], late = tasksArr().filter(t => t.status !== "done" && t.due && t.due < today);
      return {answer: n ? `Your next deadline: ${n.title}${state.courses[n.courseId] ? " (" + label(state.courses[n.courseId]) + ")" : ""}, ${dayName(n.due, today)}${n.time ? " at " + tm(n.time) : ""}.${late.length ? ` Also overdue: ${late.map(t => t.title).join(", ")}.` : ""}` : "Nothing on your planner has a due date coming up.", show: n ? [{kind: "task", id: n.id}] : []}; }
    if (!/\b(due|left|to do|todo|homework|assignments?|tasks?|work)\b/.test(s) || /\b(how many|busiest|grade|when is|when's)\b/.test(s)) return null;
    const T = window.SBTRUTH; let r = null; try { r = T && T.range ? T.range(s, today) : null; } catch (e) {} if (r) return null;
    const c = courseIn(s);
    if (!c && !/\b(have|left|still|got|need to do|do i have|remaining|outstanding|much work)\b/.test(s)) return null;
    const list = tasksArr().filter(t => t.status !== "done" && (!c || t.courseId === c.id)).sort((a, b) => (a.due || "9999").localeCompare(b.due || "9999"));
    if (!c) { if (!list.length) return {answer: "Nothing is left on your planner. Nice work.", show: []}; const L = window.SBLOCALANS, late = list.filter(t => t.due && t.due < today);
      return {answer: `You have ${list.length === 1 ? "1 thing" : list.length + " things"} to do${late.length ? `, ${late.length} overdue` : ""}:\n${list.slice(0, 10).map(t => "- " + (L ? L.taskLine(t).replace(/\*\*/g, "") : t.title)).join("\n")}${list.length > 10 ? `\n…and ${list.length - 10} more.` : ""}`, show: []}; }
    if (!list.length) return {answer: `Nothing is left to do for ${label(c)}.`, show: []};
    const L = window.SBLOCALANS;
    return {answer: `${list.length === 1 ? "1 thing" : list.length + " things"} left for ${label(c)}:\n${list.slice(0, 12).map(t => "- " + (L ? L.taskLine(t).replace(/\*\*/g, "") : t.title + (t.due ? ", due " + dayName(t.due, today) : ""))).join("\n")}`, show: []};
  }
  // "what did I get on psych quiz 1", "my mark on the A&P lab"
  function itemMark(s){
    if (!/\b(what did i get|did i get|my (mark|score|grade) (on|for)|how did i do on|what was my (mark|score|grade))\b/.test(s)) return null;
    const qw = (s.match(/[a-z0-9&]+/g) || []).filter(w => w.length > 1 && !/^(what|did|get|got|on|for|my|mark|score|grade|how|do|the|was|in|a|an|i)$/.test(w));
    let best = null, bs = 0;
    tasksArr().filter(t => t.mark && Number(t.mark.outOf) > 0).forEach(t => { const tw = (low(t.title).match(/[a-z0-9&]+/g) || []); const hit = qw.filter(w => tw.some(x => x === w || (w.length >= 4 && x.startsWith(w)) || (x.length >= 4 && w.startsWith(x)))).length; const sc = hit / Math.max(tw.length, 1) + hit * 0.1; if (hit && sc > bs) { bs = sc; best = t; } });
    if (!best || bs < 0.5) return null;
    const m = best.mark, pct = Math.round(Number(m.got) / Number(m.outOf) * 1000) / 10, co = state.courses[best.courseId];
    return {answer: `You got ${m.got}/${m.outOf} on ${best.title}${co ? " (" + label(co) + ")" : ""}: ${pct}%.`, show: [{kind: "task", id: best.id}]};
  }
  function answer(q){
    const s = low(q).replace(/[?!.]+$/, "").replace(/\s+/g, " ").trim(), today = todayISO();
    if (!s || s.length > 200) return null;
    // "when do I have lab", "what time is lecture": the class schedule first (not a task that happens to say "Lab")
    const classFirst = /\b(when|what time|where|what day)\b/.test(s) && /\b(do i have|is|are)\b/.test(s) && /\b(labs?|lectures?|class(es)?|seminars?|tutorials?|discussions?|recitations?|office hours)\b/.test(s) && !/\b(due|report|quiz|exam|test|assignment|paper|essay)\b/.test(s);
    for (const f of classFirst ? [classes, itemMark, teacher, eventNamed, grades, exams, agenda, counts, courseList, cards, dueAll] : [itemMark, teacher, eventNamed, grades, exams, agenda, classes, counts, courseList, cards, dueAll]) { try { const r = f(s, today); if (r) return r; } catch (e) { console.warn("facts", f.name, e); } }
    return null;
  }
  return {answer, gradeRows};
})();
