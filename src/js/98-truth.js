/* Keeping the small on-device AI honest and useful (Ask in the bubble, the Companion tab, and any on-device request that wants the web):
     facts     planner questions answered by the app's own code, never by a model: what's due when, what's overdue, when one task is
               due, a course's grade or one item's mark, what to do next. Always exact.
     steps     a request with several things to do ("add X, then start a timer") split into one request per thing
     check     every number, date and name in an AI answer must be in what the AI was given; one that isn't means the answer
               is asked for again more strictly, then replaced by what was found
     web       a free look-up for the on-device model: Wikipedia's search and article openings (called straight from the browser;
               only the question goes to Wikipedia), given to the model as sources to answer from, with the links shown
   Used only with the AI on the device: cloud models do these well on their own. */
window.SBTRUTH = (() => {
  const low = s => String(s == null ? "" : s).toLowerCase();
  const clip = (s, n) => String(s == null ? "" : s).replace(/\s+/g, " ").trim().slice(0, n);
  const WD = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const words = s => (low(s).match(/[a-z0-9]+/g) || []).filter(w => w.length > 2 && !/^(the|and|for|with|due|when|what|is|are|my|was|did|get|got|on|in|of|to|a|an)$/.test(w));
  const WRITE = /\b(add|create|make|put|schedule|remind|move|change|rename|delete|remove|mark|set|start|begin|turn|update|edit|cancel|skip)\b/i;
  const ACTION = /\b(add|create|make|put|schedule|remind|move|change|rename|delete|remove|mark|set|start|begin|open|show|find|turn|update|edit|cancel|skip|finish|finished|completed?|done|submitted|handed in|turned in|stop|pause|resume|got|scored)\b/i;

  /* ---------- facts: the planner's own answers ---------- */
  function range(s, today){
    let m;
    if (/\b(overdue|late|missed|past due|forgot|forget|miss(ed)? (any|anything|a deadline|deadlines)|behind on|behind)\b/.test(s)) return {from: "0000-00-00", to: addDays(today, -1), label: "overdue"};
    if (/\btoday|tonight\b/.test(s)) return {from: today, to: today, label: "today"};
    if (/\bday after tomorrow\b/.test(s)) return {from: addDays(today, 2), to: addDays(today, 2), label: "the day after tomorrow"};
    if (/\btomorrow\b/.test(s)) return {from: addDays(today, 1), to: addDays(today, 1), label: "tomorrow"};
    if (/\b(week after next|the week after next)\b/.test(s)) { const d0 = new Date(today + "T12:00:00").getDay(), start = addDays(today, (7 - d0 + 1) % 7 || 7) ; return {from: addDays(start, 7), to: addDays(start, 13), label: "the week after next"}; }
    if ((m = s.match(/\b(?:in )?the next (\d{1,2}) days\b/))) { const n = Math.max(1, Math.min(60, Number(m[1]))); return {from: today, to: addDays(today, n - 1), label: `in the next ${n} days`}; }
    if (/\b(this )?weekend\b/.test(s)) { const d0 = new Date(today + "T12:00:00").getDay(), sat = addDays(today, (6 - d0 + 7) % 7); return {from: d0 === 0 ? today : sat, to: d0 === 0 ? today : addDays(sat, 1), label: "this weekend"}; }
    if ((m = s.match(/\b(?:on )?the (\d{1,2})(?:st|nd|rd|th)\b/))) { const day = Number(m[1]), now = new Date(today + "T12:00:00"); let y = now.getFullYear(), mo = now.getMonth(); if (day < now.getDate()) { mo++; if (mo > 11) { mo = 0; y++; } } const d = `${y}-${String(mo + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`; return {from: d, to: d, label: "on the " + m[1] + (["th", "st", "nd", "rd"][(day % 10 > 3 || [11, 12, 13].includes(day % 100)) ? 0 : day % 10])}; }
    if (/\bnext week\b/.test(s)) { const d0 = new Date(today + "T12:00:00").getDay(), start = addDays(today, 7 - d0 + 1 > 7 ? 1 : 7 - d0 + 1); return {from: start, to: addDays(start, 6), label: "next week"}; }
    if (/\b(this week|the week|rest of the week|7 days|seven days|coming up|upcoming|soon)\b/.test(s)) return {from: today, to: addDays(today, 6), label: "in the next 7 days"};
    if ((m = s.match(/\b(?:on |this |next )?(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/))) { const w = WD.indexOf(m[1]), d0 = new Date(today + "T12:00:00").getDay(); let k = (w - d0 + 7) % 7; if (k === 0 && !/\btoday\b/.test(s)) k = 7; const d = addDays(today, k); return {from: d, to: d, label: "on " + m[1][0].toUpperCase() + m[1].slice(1)}; }
    return null;
  }
  // a task the question names, by its title words (the best match, and only a clear one)
  function taskNamed(s){
    const q = words(s); if (!q.length) return null;
    let best = null, bs = 0;
    tasksArr().forEach(t => { const tw = words(t.title); if (!tw.length) return; const hit = tw.filter(w => q.includes(w)).length, sc = hit / tw.length + hit * 0.05; if (hit && sc > bs) { bs = sc; best = t; } });
    return bs >= 0.6 ? best : null;
  }
  function courseNamed(s){
    const L = low(s); let best = null, bs = 0;
    // the code or name in full; most of the name's words; or what students call it ("psych nursing", "a&p", "bio", "chem")
    const qw = words(s), pre = (w, x) => w === x || (w.length >= 4 && x.startsWith(w)) || (x.length >= 4 && w.startsWith(x));
    const ALIAS = {"a&p": /anatomy|physiology/, "a & p": /anatomy|physiology/, "anp": /anatomy|physiology/, bio: /biolog/, chem: /chemi/, psych: /psych/, calc: /calculus/, stats: /statistic/, econ: /econom/, poli: /politic/, soc: /sociolog/, phys: /physics/, eng: /english/, lit: /literature/, hist: /histor/, comp: /computer/, cs: /computer science/, ochem: /organic chem/, "o chem": /organic chem/, micro: /microbiolog|microeconom/, pharm: /pharmac/};
    coursesArr().forEach(c => {
      const keys = [c.code, c.name].filter(Boolean).map(low); keys.forEach(k => { if (k && L.includes(k) && k.length > bs) { bs = k.length; best = c; } });
      // (words every course could have don't pick one out: "how am I doing in my courses" isn't about "Reviewer Course")
      const cw = words(c.name).filter(w => !/^(course|courses|class|classes|lecture|lectures|lab|labs|program|programs|module|modules|unit|units|cohort|student|students|guided|tour|hub|level|part|section)$/.test(w)), hit = cw.filter(w => qw.some(x => pre(x, w))).length; if (cw.length && hit / cw.length >= 0.6 && hit * 3 > bs) { bs = hit * 3; best = c; }
      const num = (low(c.code).match(/\d{3,4}/) || [])[0]; if (num && new RegExp("\\b" + num + "\\b").test(L) && 5 > bs) { bs = 5; best = c; }
      // its instructor ("Dr. Chen's office hours")
      const iw = (low(c.instructor || "").match(/[a-z]{3,}/g) || []).filter(w => !/^(dr|prof|professor|mr|mrs|ms|miss)$/.test(w)); if (iw.some(w => w.length >= 3 && new RegExp("\\b" + w + "('s)?\\b").test(L)) && 3 > bs) { bs = 3; best = c; }
      // the letters of its code ("bio" for BIOS 230, "hist" for HIST 1010), or one word of its name no other course has ("history")
      const cl = (low(c.code).match(/^[a-z]+/) || [""])[0]; if (cl.length >= 3 && qw.some(w => w.length >= 3 && (cl.startsWith(w) || (w.startsWith(cl) && w.length - cl.length <= 3))) && 3 > bs) { bs = 3; best = c; }
      cw.filter(w => w.length >= 5 && !/^(introduction|intro|principles|fundamentals|foundations|advanced|general|applied|studies|science|sciences|nursing|theory|methods|topics|seminar|survey)$/.test(w)).forEach(w => { if (qw.some(x => pre(x, w)) && coursesArr().filter(o => words(o.name).some(y => pre(w, y))).length === 1 && 2 > bs) { bs = 2; best = c; } });
      Object.keys(ALIAS).forEach(a => { if (new RegExp("(^|[^a-z])" + a.replace(/[&]/g, "\\&") + "([^a-z]|$)").test(L) && ALIAS[a].test(low(c.name)) && 4 > bs) { bs = 4; best = c; } });
    });
    return best;
  }
  // how students type: "wats due tmrw", "do i have hw", "whens my nxt test", "am i gonna pass bio"
  const SLANG = [[/\b(tmrw|tmr|tmrrw|2morrow|tomorow|tommorow|tommorrow)\b/g, "tomorrow"], [/\b(tdy|2day|tday)\b/g, "today"], [/\b(hw|hmwk|homewrk)\b/g, "homework"], [/\b(wats|wat|whats|wuts|wut)\b/g, "what's"], [/\bwhens\b/g, "when's"], [/\bwheres\b/g, "where's"], [/\b(nxt)\b/g, "next"], [/\b(wk)\b/g, "week"], [/\b(u)\b/g, "you"], [/\b(r)\b/g, "are"], [/\b(ur)\b/g, "your"], [/\b(gonna)\b/g, "going to"], [/\b(prof)\b/g, "professor"], [/\b(asgmt|assgn|assignmt)\b/g, "assignment"], [/\b(exm)\b/g, "exam"], [/\b(dont)\b/g, "don't"], [/\bim\b/g, "i'm"], [/\b(thx|ty)\b/g, "thanks"]];
  const norm = q => SLANG.reduce((t, [re, to]) => t.replace(re, to), low(String(q || "").replace(/[’‘`´]/g, "'").replace(/[“”]/g, '"')));
  // + - * / ^ and brackets, worked out here (no eval: the app's security policy blocks it, rightly)
  function calc(src){
    const t = String(src).replace(/\s+/g, ""); let i = 0;
    const num = () => { const m = /^\d+(\.\d+)?|^\.\d+/.exec(t.slice(i)); if (!m) throw 0; i += m[0].length; return Number(m[0]); };
    const atom = () => { if (t[i] === "-") { i++; return -atom(); } if (t[i] === "+") { i++; return atom(); } if (t[i] === "(") { i++; const v = sum(); if (t[i] !== ")") throw 0; i++; return v; } return num(); };
    const pow = () => { const b = atom(); if (t[i] === "^") { i++; return Math.pow(b, pow()); } return b; };
    const prod = () => { let v = pow(); while (t[i] === "*" || t[i] === "/") { const o = t[i++], r = pow(); v = o === "*" ? v * r : v / r; } return v; };
    const sum = () => { let v = prod(); while (t[i] === "+" || t[i] === "-") { const o = t[i++], r = prod(); v = o === "+" ? v + r : v - r; } return v; };
    const v = sum(); if (i !== t.length) throw 0; return v;
  }
  function facts(q){
    q = norm(q);
    const s = low(q).replace(/[?!.]+$/, ""), today = todayISO(), L = window.SBLOCALANS;
    if (!s || s.length > 160) return null;
    if (/^\s*(?:yo|hey|hi|hello|ok|so)?[,\s]*(?:what'?s|whats|wats|wuts|wassup|sup)(?: up| good| new)?(?: with you| packy| mochi| bramble)?\s*$/.test(s)) return null; // ("whats up" is hello)
    // plain arithmetic ("what is 3x3", "12% of 80", "(4+5)*2"): worked out here, exactly
    { const m = /^\s*(?:what(?:'s| is)|whats|calculate|compute|solve|how much is)?\s*([-+*/x×÷^().\d\s]+|[\d.]+\s*%\s*of\s*[\d.]+)\s*[=?]*\s*$/i.exec(s);
      if (m && /\d\s*[-+*/x×÷^%]\s*[\d(]|%\s*of/i.test(m[1])) {
        let e = m[1].trim(), v = null;
        const po = /^([\d.]+)\s*%\s*of\s*([\d.]+)$/i.exec(e);
        if (po) v = Number(po[1]) / 100 * Number(po[2]);
        else { try { v = calc(e.replace(/[x×]/gi, "*").replace(/÷/g, "/")); } catch (x) { v = null; } }
        if (typeof v === "number" && isFinite(v)) { const r = Math.round(v * 1e10) / 1e10; return {answer: `${e.replace(/\s+/g, " ").replace(/\*/g, "×")} = ${r.toLocaleString("en-US", {maximumFractionDigits: 10})}`, show: []}; }
      }
    }
    // class announcements from their school site (95-announce.js): the latest, a course's, or what's new, word for word
    if (/\b(announcements?|announced|announce|news|posted|post)\b/.test(s) && !/\b(make|create|write|add)\b/.test(s) && window.SBANN && SBANN.items) {
      let list = []; try { list = SBANN.items() || []; } catch (e) {}
      if (!list.length) return {answer: "There aren't any class announcements in Studyboard. Connect your school site (Settings, then School Sync) and they'll show up here and under the bell.", show: []};
      const c = courseNamed(q); if (c) list = list.filter(x => x.cid === c.id || low(x.course).includes(low(c.code || c.name)));
      if (!list.length) return {answer: `There aren't any announcements from ${c ? (c.code || c.name) : "that course"} in Studyboard.`, show: []};
      const when = d => { try { const n = Math.round((Date.now() - new Date(d).getTime()) / 864e5); return n <= 0 ? "today" : n === 1 ? "yesterday" : n + " days ago"; } catch (e) { return ""; } };
      const one = x => `${x.course}: ${x.title}${x.date ? ` (${when(x.date)})` : ""}\n${String(x.text || "").replace(/\{fi?r?st ?name\}/gi, "").replace(/\s+/g, " ").trim().slice(0, 700)}${x.long ? "…" : ""}`;
      if (/\b(all|list|every|any|recent announcements|new announcements|what announcements)\b/.test(s) && !/\b(most recent|latest|last|newest)\b/.test(s))
        return {answer: `${list.length} announcement${list.length === 1 ? "" : "s"}${c ? ` from ${c.code || c.name}` : ""}, newest first:\n${list.slice(0, 6).map(x => `- ${x.course}: ${x.title}${x.date ? ` (${when(x.date)})` : ""}`).join("\n")}${list.length > 6 ? `\n…and ${list.length - 6} more under the bell.` : ""}`, show: []};
      return {answer: `Your most recent announcement${c ? ` from ${c.code || c.name}` : ""}:\n${one(list[0])}`, show: []};
    }
    // what they're working on now: the tasks marked In Progress
    if (/\b(working on|in progress|started on|doing right now)\b/.test(s) && !/\b(should|next|start)\b/.test(s)) {
      const dg = tasksArr().filter(t => t.status === "doing"); if (!dg.length) return {answer: "Nothing is marked In Progress right now.", show: []};
      return {answer: `In progress: ${dg.map(t => L ? L.taskLine(t).replace(/\*\*/g, "") : t.title).join("; ")}.`, show: dg.slice(0, 3).map(t => ({kind: "task", id: t.id}))}; }
    // "everything due before the psych midterm": from today until that task
    { const bm = /\b(?:due |left |to do |have )?(?:before|until|ahead of|leading up to|by the time of)\s+(?:the\s+|my\s+)?(.{3,60})$/.exec(s);
      if (bm && /\b(due|left|to do|have|everything|anything|tasks?|what)\b/.test(s)) { const tk = taskNamed(bm[1]); if (tk && tk.due) {
        const list = tasksArr().filter(t => t.status !== "done" && t.id !== tk.id && t.due && t.due < tk.due).sort((a, b) => (a.due + (a.time || "")).localeCompare(b.due + (b.time || "")));
        return {answer: list.length ? `${list.length} task${list.length === 1 ? "" : "s"} due before ${tk.title} (${fmtDate(tk.due)}):\n${list.slice(0, 12).map(t => "- " + (L ? L.taskLine(t).replace(/\*\*/g, "") : t.title)).join("\n")}` : `Nothing else is due before ${tk.title} (${fmtDate(tk.due)}).`, show: []}; } } }
    // study advice built from their planner (98-advice.js): priorities, a plan, how to study for an exam
    { const A = window.SBADVICE; if (A && (A.ADVICE.test(s) || (A.timePlan && A.timePlan(s)))) { const r = A.answer(s); if (r) return r; } }
    // the wider set of planner questions (98-facts.js): averages, best and worst, classes, the next exam, counts, cards due
    // (a window said in so many words, "due next week", is listed below, not answered with the single next deadline)
    { const X = window.SBFACTS; if (X && !(/\b(due|deadlines?|have)\b/.test(s) && range(s, today)) && !/\b(say|said|says|mention(ed|s)?|told|tell us|talk(ed)? about|explain(ed)?)\b/.test(s) && !(WRITE.test(s) && !/^\s*(what|when|which|how many|do i|is there|are there|have i|am i)\b/.test(s))) { const r = X.answer(q); if (r) return r; } }
    // an action, not a question ("add a task due tomorrow", "move my exam"): the AI's job
    // about the app itself, hello and thanks (98-apphelp.js): from the app's own guide
    { const H = window.SBAPPHELP; if (H) { const r = H.answer(s); if (r) return r; } }
    if (ACTION.test(s) && !/^\s*(what|when|which|how many|do i|is there|are there|have i)\b/.test(s)) return null;
    // what to do next
    if (L && L.NEXT_Q.test(q)) { const nx = L.nextLine(); if (nx) return {answer: nx.replace(/\*\*/g, ""), show: []}; }
    // grades: a course's standing, or one item's mark
    if (/\b(grade|grades|mark|marks|score|scores|percent|gpa|standing|did i get|how am i doing|how'?s my|passing|failing|pass|fail)\b/.test(s)) {
      const passQ = /\b(passing|failing|pass|fail)\b/.test(s);
      const verdict = line => { if (!passQ) return line; const cur = Number((line.match(/current ([\d.]+)%/) || [])[1]), pm = Number((line.match(/pass mark ([\d.]+)%/) || [])[1]);
        if (!isFinite(cur) || !cur && cur !== 0) return line; if (!isFinite(pm) || !pm) return line;
        return (cur >= pm ? `Yes, you're passing: ${cur}% so far, and the pass mark is ${pm}%. ` : `Not yet: ${cur}% so far, below the pass mark of ${pm}%. `) + line; };
      const G = window.SBGRADES; if (!G) return null;
      let items = []; try { items = G.items ? G.items() : []; } catch (e) {}
      const it = (() => { const qw = words(s); let best = null, bs = 0; items.forEach(x => { const tw = words(x.title); const hit = tw.filter(w => qw.includes(w)).length; const sc = tw.length ? hit / tw.length : 0; if (hit && sc > bs) { bs = sc; best = x; } }); return bs >= 0.6 ? best : null; })();
      if (it) return {answer: `You got ${it.mark} on ${it.title}${it.course ? " (" + it.course + ")" : ""}: ${it.pct}%${it.letter ? ", " + it.letter : ""}.`, show: []};
      const c = courseNamed(s); let lines = []; try { lines = G.lines ? G.lines() : []; } catch (e) {}
      if (c) { const k = [c.code, c.name].filter(Boolean).map(low); const line = lines.find(x => k.some(y => y && low(x).includes(y))); if (line) return {answer: verdict(line.replace(/\*\*/g, "")), show: []}; return {answer: `${courseLabel(c)} doesn't have any marks in Studyboard yet.`, show: []}; }
      if (/\b(all|my|each|every)\b.*\bgrades?\b|\bgpa\b/.test(s) && lines.length) return {answer: lines.slice(0, 12).map(x => "- " + x.replace(/\*\*/g, "")).join("\n"), show: []};
      return null;
    }
    // when one named task is due
    if (/^\s*when\b|\bwhat day\b|\bwhat time\b|\bdue date\b/.test(s)) {
      const t = taskNamed(s);
      if (t) return {answer: L ? L.taskLine(t).replace(/\*\*/g, "") + "." : `${t.title}: ${t.due ? "due " + t.due : "no due date"}.`, show: [{kind: "task", id: t.id}]};
    }
    // what's due in a window, or overdue
    if (/\b(due|left|to do|todo|have|homework|assignments?|tasks?|exams?|quiz(zes)?|tests?|labs?|essays?|papers?|readings?|projects?|anything|deadlines?|overdue|late)\b/.test(s)) {
      const r = range(s.replace(/\bcoming up\b/, "this week"), today) || (/\b(coming up|upcoming|soon|any)\b/.test(s) && /\b(labs?|essays?|papers?|readings?|projects?|exams?|quiz(zes)?|tests?)\b/.test(s) ? {from: today, to: addDays(today, 13), label: "in the next two weeks"} : null); if (!r) return null;
      const kind = /\bexams?|tests?|midterms?|finals?\b/.test(s) ? t => /exam|midterm|final|test/i.test(t.type + " " + t.title) : /\bquiz(zes)?\b/.test(s) ? t => /quiz/i.test(t.type + " " + t.title) : /\blabs?\b/.test(s) ? t => /\blab\b/i.test(t.type + " " + t.title) : /\bessays?|papers?\b/.test(s) ? t => /essay|paper/i.test(t.title) : /\breadings?\b/.test(s) ? t => /read/i.test(t.type + " " + t.title) : /\bprojects?\b/.test(s) ? t => /project/i.test(t.type + " " + t.title) : () => true;
      const c = courseNamed(s);
      const list = tasksArr().filter(t => t.status !== "done" && t.due && t.due >= r.from && t.due <= r.to && kind(t) && (!c || t.courseId === c.id)).sort((a, b) => (a.due + (a.time || "")).localeCompare(b.due + (b.time || "")));
      const what = /\bexams?|tests?\b/.test(s) ? "exams" : /\bquiz/.test(s) ? "quizzes" : "tasks";
      // "do I have anything wednesday": the calendar that day too (events, not classes), not only what's due
      let evs = ""; if (r.label !== "overdue" &&!/\bdue\b|\bdeadlines?\b|\bexams?\b|\bquiz/.test(s) && /\b(have|anything|plans?|happening|going on|on my (calendar|schedule))\b/.test(s)) {
        const E = Object.values(state.events || {}).filter(e => e && e.date >= r.from && e.date <= r.to && (!c || e.courseId === c.id)).sort((a, b) => (a.date + (a.start || "")).localeCompare(b.date + (b.start || "")));
        if (E.length) evs = `\nOn your calendar ${r.label}:\n` + E.slice(0, 8).map(e => `- ${e.title}: ${fmtDate(e.date)}${e.start ? `, ${fmtTime(e.start)}${e.end ? "–" + fmtTime(e.end) : ""}` : ""}${e.where ? ", " + e.where : ""}`).join("\n"); }
      if (!list.length && evs) return {answer: `Nothing is due ${r.label}${c ? " for " + courseLabel(c) : ""}.${evs}`, show: []};
      if (list.length && evs) return {answer: `${list.length} ${list.length === 1 ? "task" : "tasks"} due ${r.label}:\n${list.slice(0, 12).map(t => "- " + (L ? L.taskLine(t).replace(/\*\*/g, "") : t.title)).join("\n")}${evs}`, show: []};
      if (!list.length) return {answer: `${what === "tasks" ? "Nothing" : "No " + what} ${r.label === "overdue" ? (what === "tasks" ? "is" : "are") + " overdue" : (what === "tasks" ? "is" : "are") + " due " + r.label}${c ? " for " + courseLabel(c) : ""}.${r.label === "overdue" ? " You're all caught up!" : ""}`, show: []};
      const head = r.label === "overdue" ? `${list.length} ${list.length === 1 ? what.replace(/s$/, "") + " is" : what + " are"} overdue` : `${list.length} ${list.length === 1 ? what.replace(/s$/, "") : what} due ${r.label}${c ? " for " + courseLabel(c) : ""}`;
      return {answer: head + ":\n" + list.slice(0, 12).map(t => "- " + (L ? L.taskLine(t).replace(/\*\*/g, "") : t.title)).join("\n") + (list.length > 12 ? `\n…and ${list.length - 12} more.` : ""), show: []};
    }
    return null;
  }

  /* ---------- follow-ups to a planner question ----------
     "what about wednesday?", "and the day after?", "which are for a&p", "what about foundations?" after a planner question the app
     answered: that question again with the new day or course (so it's answered from the planner, never looked up on Wikipedia).
     "and after that?", "then what?": the next open tasks by due date that the chat hasn't named yet. "" when it isn't one. */
  const WHEN = /\b(today|tonight|tomorrow|tmrw|the day after(?: tomorrow)?|day after tomorrow|(?:this |next |on )?(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)|this week|next week|the week after(?: next| that)?|week after next|(?:this |the )?weekend|the \d{1,2}(?:st|nd|rd|th)|(?:in )?the next \d+ days|overdue)\b/;
  const AFTER = /^\s*(?:and|ok|okay|so|then)?[,\s]*(?:after (?:that|this|it)|then what|what(?:'s| is| comes)? (?:after|next)(?: that| this)?|and next|what else|anything else|next one|the next one)\s*[?!.]*\s*$/;
  function courseIn(s){
    const c = courseNamed(s); if (c) return c;
    // one word that starts a word of exactly one course's name ("foundations", "anatomy", "history")
    const ws = words(s).filter(w => w.length >= 5), hits = coursesArr().filter(c => words(c.name).some(y => ws.some(w => y.startsWith(w) || w.startsWith(y))));
    return hits.length === 1 ? hits[0] : null;
  }
  function followUp(q, lastQ, said){
    const s = norm(q).replace(/[?!.]+$/, "").trim(), L = norm(lastQ || "").replace(/[?!.]+$/, "").trim();
    if (!s || !L || s.split(/\s+/).length > 9 || WRITE.test(s.replace(/\b(mark|set)\b/g, ""))) return "";
    let r0 = null; try { r0 = facts(lastQ); } catch (e) {}
    if (!r0) return "";
    // (a hello or a question about the app isn't a planner question to follow on from: "hi!" then "what's left in BSNC 1055?")
    { const H = window.SBAPPHELP; try { if (H && H.answer(L)) return ""; } catch (e) {} }
    if (AFTER.test(s)) return "__AFTER__";
    // "who teaches that class", "what's my grade in that course": the course the last answer was about
    if (/\b(that|this|the same|its) (class|course)\b/.test(s)) { const tail = String(said || "").slice(-700), cs = coursesArr().map(c => ({c, i: Math.max(tail.lastIndexOf(c.code || "\u0000"), low(tail).lastIndexOf(low(c.name)))})).filter(x => x.i >= 0).sort((a, b) => b.i - a.i);
      if (cs.length) return s.replace(/\b(that|this|the same|its) (class|course)\b/, cs[0].c.code || cs[0].c.name); }
    if (!/^\s*(and|ok|okay|so|but|what about|how about|what of|for|then|also|which|which ones?|any|anything|what)\b|^\s*(the day after|the week after|wednesday|thursday|friday|saturday|sunday|monday|tuesday|tomorrow|today)\b/.test(s)) return "";
    const t = (s.match(WHEN) || [])[0], c = courseIn(s.replace(WHEN, " "));
    if (!t && !c) return "";
    let out = L;
    if (t) { let tt = t.replace(/^on /, "");
      if (/^the day after$/.test(tt)) tt = /\btomorrow\b/.test(L) ? "the day after tomorrow" : "tomorrow";
      if (/^the week after( that)?$/.test(tt)) tt = /\bnext week\b/.test(L) ? "the week after next" : "next week";
      out = WHEN.test(L) ? L.replace(WHEN, tt) : `${L} ${tt}`; }
    if (c) { const lc = courseNamed(L); out = out.replace(/\s+(?:for|in|from)\s+(?:my\s+)?[a-z&]+(?:\s+\d{3,4})?\s*$/, "");
      if (lc) { const k = [lc.code, lc.name].filter(Boolean).map(low).find(x => out.includes(x)); if (k) out = out.replace(k, low(c.code || c.name)); else out += ` for ${c.code || c.name}`; } else out += ` for ${c.code || c.name}`; }
    return out === L ? "" : out;
  }
  function afterThat(said){
    const S = low(said || ""), open = tasksArr().filter(t => t.status !== "done" && t.due).sort((a, b) => (a.due + (a.time || "")).localeCompare(b.due + (b.time || "")));
    const rest = open.filter(t => !S.includes(low(t.title))).slice(0, 3); if (!rest.length) return null;
    const L = window.SBLOCALANS, line = t => L ? L.taskLine(t).replace(/\*\*/g, "") : `${t.title}: due ${t.due}`;
    return {answer: rest.length === 1 ? `After that: ${line(rest[0])}.` : `After that, by due date:\n${rest.map(t => "- " + line(t)).join("\n")}`, show: []};
  }

  /* ---------- steps: one request per thing to do ---------- */
  function steps(q){
    const s = String(q || "").trim(); if (s.length < 12 || s.length > 400) return [s];
    // "psych midterm high priority + move it to dec 3", "rename the lab report to Cardiac Lab and push it 2 days", "journal done, ch7 done,
    // and got 9/10 on the journal", "got 17/20 on a&p quiz 4 and 40/50 on the lab report"
    const parts = s.split(/\s*(?:;|,?\s+and\s+(?=(?:what|what's|whats|when|when's|where|which|who|how|is|are|do|does|am)\b)|\.\s+(?=[A-Z])|,?\s+(?:and then|then|and also|also|after that|plus)\s+|,\s+(?:and\s+)?(?=(?:add|create|make|start|set|remind|move|change|show|open|delete|mark|schedule|stop|pause)\b)|\s+and\s+(?=(?:add|create|make|start|set|remind|move|change|show|open|delete|mark|schedule)\b)|\s+\+\s+|,?\s+and\s+(?=(?:push|bump|rename|record|got|get|put|tick|record|log|then)\b)|,\s+(?:and\s+)?(?=(?:got|get|scored|push|bump|rename|record|log|tick)\b)|,\s+(?!(?:both|all|them|these|those|each|everything)\b)(?=[\w&' ]{2,40}\s+(?:done|finished|complete[d]?|submitted|handed in)\b)|\s+and\s+(?=\d+(?:\.\d+)?\s*(?:\/|out of)\s*\d+\s+(?:on|for)\b)|(?<=\d\s*(?:\/|out of)\s*\d+(?:\.\d+)?)\s*,?\s+and\s+(?=[\w&' ]{2,40}?\s+(?:got\s+|was\s+|is\s+|=\s*)?\d+(?:\.\d+)?\s*(?:\/|out of)\s*\d+))\s*/i).map(x => x.trim()).filter(x => x.length > 3);
    // only a real split: every part asks for something
    // ("push it 2 days", "40/50 on the lab report", "psych midterm high priority" ask for a change too)
    return parts.length > 1 && parts.length <= 5 && parts.every(p => ACTION.test(p) || /\b(push|bump|tick|record|log|priority|urgent|high|low|rename|due)\b|\d+(?:\.\d+)?\s*(?:\/|out of)\s*\d+|\d+\s*%/i.test(p) || /\?$|^(what|when|how|why|which|who)\b/i.test(p)) ? parts : [s];
  }

  /* ---------- check: nothing in the answer that wasn't given ---------- */
  const MONTHS = "jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec";
  function specifics(text){
    const t = String(text || ""), out = new Set();
    (t.match(/\b\d+(?:[.,:]\d+)?%?/g) || []).forEach(x => { if (!/^(1|2|3|4|5|10|0)$/.test(x)) out.add(x.replace(/,/g, "")); });
    (t.match(new RegExp(`\\b(?:${MONTHS})[a-z]*\\.? \\d{1,2}\\b`, "gi")) || []).forEach(x => out.add(low(x)));
    // names: capitalized words in the middle of a sentence
    (t.match(/(?<=[a-z,;:] )[A-Z][a-z]{2,}(?: [A-Z][a-z]+)*/g) || []).forEach(x => { if (!/^(I|I'm|I'll|Studyboard|Mochi|Today|Tomorrow|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|January|February|March|April|May|June|July|August|September|October|November|December|Apply|Show|Review|Notes|Calendar|Files|Settings|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)$/.test(x)) out.add(x); });
    return [...out];
  }
  // the date forms the context may hold for an answer's date ("Dec 3" vs "2026-12-03")
  const MO12 = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
  const dateForms = x => { const m = new RegExp(`^(${MONTHS})[a-z]*\\.? (\\d{1,2})$`, "i").exec(x); if (!m) return [x]; const mo = MO12.indexOf(m[1].toLowerCase().slice(0, 3)) + 1; return [x, `-${String(mo).padStart(2, "0")}-${String(m[2]).padStart(2, "0")}`]; };
  function unsupported(answer, given){
    const g = low(given).replace(/,(?=\d{3})/g, "");
    return specifics(answer).filter(x => !dateForms(low(x)).some(f => g.includes(low(f))) && !(/%$/.test(x) && g.includes(x.slice(0, -1))));
  }

  /* ---------- web: Wikipedia, for the on-device model ---------- */
  const WIKI = "https://en.wikipedia.org/w/api.php";
  const webOk = () => { try { return navigator.onLine !== false && localStorage.getItem("studyboard:webLookupOff") !== "1"; } catch (e) { return true; } };
  async function web(q, o){
    o = o || {};
    if (!webOk() || (window.__SB_TEST && !window.__SB_WEB_TEST)) return [];
    const term = String(q || "").replace(/^\s*(what|who|why|how|when|where|which)\s+(is|are|was|were|does|do|did|can|could)\s+/i, "").replace(/[?!.]+$/, "").slice(0, 200);
    const get = async params => { const u = WIKI + "?" + new URLSearchParams(Object.assign({format: "json", formatversion: "2", origin: "*"}, params)); let r = await fetchT(u, {credentials: "omit"}, o.ms || 8000); if (r.status === 429 || r.status === 503) { await new Promise(res => setTimeout(res, 700)); r = await fetchT(u, {credentials: "omit"}, o.ms || 8000); } if (!r.ok) throw new Error("wiki " + r.status); return r.json(); };
    try {
      const s = await get({action: "query", list: "search", srsearch: term, srlimit: String(o.n || 3), srprop: ""});
      const titles = ((s.query || {}).search || []).map(x => x.title).slice(0, o.n || 3);
      if (!titles.length) return [];
      const e = await get({action: "query", prop: "extracts", exintro: "1", explaintext: "1", exchars: String(Math.min(1200, o.chars || 1200)), titles: titles.join("|"), redirects: "1"});
      const pages = ((e.query || {}).pages || []).filter(p => p.extract && p.extract.length > 80);
      return titles.map(t => pages.find(p => p.title === t || low(p.title) === low(t))).filter(Boolean).map(p => ({title: p.title, url: "https://en.wikipedia.org/wiki/" + encodeURIComponent(p.title.replace(/ /g, "_")), text: clip(p.extract, o.chars || 1600)}));
    } catch (e) { return []; }
  }
  const webText = list => list.map((x, i) => `[W${i + 1}] ${x.src || "Wikipedia"}: ${x.title} (${x.url})\n${x.text}`).join("\n\n");

  /* ---------- research: several models and sources working together ----------
       1. the AI on the device plans: 1 to 3 search queries, and whether papers or a definition would help
       2. free sources, in parallel: Wikipedia, OpenAlex (scholarly papers' abstracts), Wiktionary (definitions)
       3. the device's search model (bge-small, 30-search.js) ranks every passage by meaning against the question
       4. the best few go to the AI as numbered sources (and the fact check holds the answer to them)
     Only the search words leave the device (to Wikimedia and OpenAlex), straight from the browser. */
  const OA = "https://api.openalex.org/works";
  async function openAlex(q, n){
    if (!webOk() || (window.__SB_TEST && !window.__SB_WEB_TEST)) return [];
    try {
      const u = OA + "?" + new URLSearchParams({search: String(q).slice(0, 200), "per-page": String(n || 4), filter: "has_abstract:true", select: "id,title,publication_year,abstract_inverted_index,primary_location,open_access,cited_by_count"});
      const r = await fetchT(u, {credentials: "omit"}, 8000); if (!r.ok) return [];
      const j = await r.json();
      return (j.results || []).map(w => {
        const inv = w.abstract_inverted_index || {}, words = []; Object.entries(inv).forEach(([k, v]) => v.forEach(i => { words[i] = k; }));
        const abs = words.filter(Boolean).join(" ");
        const url = (w.open_access && w.open_access.oa_url) || ((w.primary_location || {}).landing_page_url) || w.id;
        return abs.length > 120 ? {src: "Research paper", title: `${w.title}${w.publication_year ? " (" + w.publication_year + ")" : ""}`, url, text: clip(abs, 1600), cites: w.cited_by_count || 0} : null;
      }).filter(Boolean);
    } catch (e) { return []; }
  }
  async function wiktionary(word){
    if (!webOk() || (window.__SB_TEST && !window.__SB_WEB_TEST) || !/^[a-z][a-z -]{1,40}$/i.test(word)) return [];
    try {
      const u = "https://en.wiktionary.org/w/api.php?" + new URLSearchParams({action: "query", format: "json", formatversion: "2", origin: "*", prop: "extracts", explaintext: "1", exchars: "900", titles: word.toLowerCase(), redirects: "1"});
      const r = await fetchT(u, {credentials: "omit"}, 6000); if (!r.ok) return [];
      const p = (((await r.json()).query || {}).pages || [])[0];
      return p && p.extract ? [{src: "Wiktionary", title: p.title, url: "https://en.wiktionary.org/wiki/" + encodeURIComponent(p.title), text: clip(p.extract.replace(/=+[^=]+=+/g, " "), 900)}] : [];
    } catch (e) { return []; }
  }
  // passages of about 600 characters, so ranking picks the right part of a long article
  const passages = list => list.flatMap(x => { const t = x.text, out = []; for (let i = 0; i < t.length && out.length < 4; i += 600) { const seg = t.slice(i, i + 700); if (seg.length > 80) out.push(Object.assign({}, x, {text: seg, part: out.length})); } return out; });
  async function research(q, o){
    o = o || {};
    let plan = {queries: [String(q).slice(0, 200)], papers: false, define: ""};
    // (a separate planning step only when asked for: the question itself searches well, and every model call is seconds on a laptop)
    const dm = String(q).match(/\bwhat (?:does|is the meaning of) ["']?([a-z][a-z -]{1,30}?)["']? mean\b|\bdefine ["']?([a-z][a-z -]{1,30})|\bmeaning of ["']?([a-z][a-z -]{1,30})/i);
    if (dm) plan.define = (dm[1] || dm[2] || dm[3] || "").trim();
    const kt = (String(q).match(/\b[A-Z][A-Za-z]{1,}\b|\b[A-Z]{2,}\b/g) || []).filter(w => !/^(What|Who|Why|How|When|Where|Which|Is|Are|Do|Does|Can|Could|Explain|Define|Describe|The|A|An|I)$/.test(w));
    plan.queries = [String(q).replace(/^\s*(please\s+)?(can you\s+)?(explain|describe|tell me about|what is|what are|who was|who is|how does|how do|why does|why do|why is|why are)\s+/i, "").replace(/[?!.]+$/, "").slice(0, 120) || String(q).slice(0, 120)];
    { const k2 = kt.join(" ") || (low(q).match(/[a-z0-9]+/g) || []).filter(w => !QSTOP.has(w) && w.length > 2 && !/^(created|invented|discovered|wrote|made|founded|caused|happens|happen|work|works|used|stand)$/.test(w)).join(" "); if (k2 && low(k2) !== low(plan.queries[0])) plan.queries.push(k2.slice(0, 80)); }
    // "the difference between X and Y", "X vs Y", "compare X and Y": X and Y looked up on their own (a search for the whole question finds neither)
    { const d = String(q).match(/\b(?:difference between|differences between|compare|comparing|contrast)\s+(?:an? |the )?(.{2,60}?)\s+(?:and|with|to|vs\.?|versus)\s+(?:an? |the )?(.{2,60}?)\s*[?!.]*$/i) || String(q).match(/^\s*(?:an? |the )?(.{2,60}?)\s+(?:vs\.?|versus)\s+(?:an? |the )?(.{2,60}?)\s*[?!.]*$/i);
      if (d) { const ab = {rn: "registered nurse", lpn: "licensed practical nurse", np: "nurse practitioner", cna: "certified nursing assistant", md: "physician"}; plan.queries = [d[1], d[2]].map(x => ab[low(x.trim())] || x.trim()); } }
    if (o.plan && typeof aiOnDevice === "function" && aiOnDevice() && !o.noPlan) {
      try {
        const r = await aiCall({task: "chat", maxTokens: 220, temperature: 0, quiet: true, schema: {type: "OBJECT", properties: {queries: {type: "ARRAY", items: {type: "STRING"}}, papers: {type: "BOOLEAN"}, define: {type: "STRING"}}, required: ["queries"]},
          system: "You plan a web look-up for a student's question. queries: 1 to 3 short search queries (2 to 6 words each) that together find what the answer needs. papers: true only if research findings or studies would help. define: the single word or term to look up in a dictionary if the student asks what a word means, else empty.",
          parts: [{text: "Question: " + String(q).slice(0, 600)}]});
        const d = (r && r.data) || {}, qs = (d.queries || []).map(x => clip(x, 80)).filter(x => x.length > 2).slice(0, 3);
        if (qs.length) plan = {queries: qs, papers: !!d.papers, define: clip(d.define, 40)};
      } catch (e) {}
    }
    if (o.onStatus) o.onStatus("Looking it up…");
    const jobs = plan.queries.slice(0, 2).map(x => web(x, {n: 2, chars: 2400}));
    if (plan.papers || /\b(research|stud(y|ies)|evidence|paper|journal|findings|effect of)\b/i.test(q)) jobs.push(openAlex(plan.queries[0], 4));
    if (plan.define) jobs.push(wiktionary(plan.define));
    // the whole look-up gets a few seconds; a source that's slower is left out of this answer
    const cap = (pr, ms, v) => Promise.race([pr.catch(() => v), new Promise(r => setTimeout(() => r(v), ms))]);
    const found = (await Promise.all(jobs.map(j => cap(j, o.ms || (window.__SB_TEST && window.__SB_WEB_MS) || (typeof DEVAI !== "undefined" && DEVAI.kind === "litert" ? 7000 : 4500), [])))).flat();
    const seen = new Set(), uniq = found.filter(x => { const k = x.url; if (seen.has(k)) return false; seen.add(k); return true; });
    let parts = passages(uniq);
    if (!parts.length) return {list: [], text: ""};
    // rank by meaning with the device's search model (or whichever search-by-meaning model is set up); word overlap if none
    let ranked = null;
    try {
      const vecs = window.SBSEARCH && SBSEARCH.embedTexts ? await cap(SBSEARCH.embedTexts([String(q)].concat(parts.map(x => x.title + ". " + x.text)), true), 2500, null) : null;
      if (vecs && vecs.length === parts.length + 1) { const qv = vecs[0]; ranked = parts.map((x, i) => ({x, s: vecs[i + 1].reduce((a, v, k) => a + v * (qv[k] || 0), 0)})); }
    } catch (e) {}
    if (!ranked) { const qw = new Set(words(q)); ranked = parts.map(x => ({x, s: words(x.title + " " + x.text).filter(w => qw.has(w)).length})); }
    ranked.sort((a, b) => b.s - a.s);
    const top = []; const per = new Map();
    for (const r of ranked) { const n = per.get(r.x.url) || 0; if (n >= 2) continue; per.set(r.x.url, n + 1); top.push(r.x); if (top.length >= (o.max || 5)) break; }
    return {list: top, text: webText(top), plan};
  }
  // a general-knowledge question (not about the student's own planner)
  // (never a question to the companion itself, "what are you working on", or one about today, the student or their things)
  /* ---------- an answer that doesn't answer ---------- */
  // filler ("I'm here to help... let me know"), or a reply to a question that never mentions what was asked about
  const FILLER = /\b(i'?m here to help|here to help you|let me know (if|what|how)|feel free to|how can i (help|assist)|what can i (help|do)|happy to help|i can (definitely )?help( you)? with|is there anything else|what would you like|just (tell|let) me|i understand!?|great question|i see about your)\b/gi;
  const QSTOP = new Set("what whats what's who whos why how when where which is are was were the a an of to in on for and or do does did can could would should i me my you your it its this that these those about tell explain define describe meaning mean means give example examples please some any there here with from by as be been being have has had will just really".split(" "));
  function nonAnswer(q, a){
    const A = String(a || "").trim();
    // a sum asked for, answered with a number: that's the answer, however short ("4.8")
    if (/\d\s*[-+*/x×÷^%]\s*\d|\b(plus|minus|times|divided by|squared|square root|percent of)\b/i.test(q) && /\d/.test(A)) return false;
    if (A.length < 8) return true;
    const rest = A.replace(/[^.!?]*\b(i'?m here to help|here to help|ready to help|let me know|feel free|how can i (help|assist)|what can i (do|help)|happy to help|is there anything else|what would you like|okay,? i understand|i'?m (mochi|your)|your studyboard (assistant|planner|companion)|organi[sz]e and manage your stud|navigate your studyboard|ace your courses|sure!?|absolutely!?|hello!?|hi!?)\b[^.!?]*[.!?]?/gi, "").trim();
    const content = rest.split(/\s+/).filter(w => w.length > 3).length;
    if (rest.length < A.length - 4 ? content < 5 : content < 2) return true;
    // a question about something: the answer names it (or a word starting the same way)
    if (/^\s*(what|who|why|how|when|where|which|explain|define|describe|tell me about|meaning of)\b/i.test(q)) {
      const keys = (low(q).match(/[a-z0-9]+/g) || []).filter(w => !QSTOP.has(w) && (w.length > 2 || /^(id|ego|dna|rna|atp|gdp|cpu|ai)$/.test(w)));
      if (keys.length && !keys.some(k => low(A).includes(k.length > 5 ? k.slice(0, k.length - 2) : k))) return true;
    }
    return false;
  }

  /* ---------- a knowledge question: the student's own material first, then the web, answered from them ---------- */
  const KSCHEMA = {type: "OBJECT", properties: {answer: {type: "STRING"}, found: {type: "BOOLEAN"}}, required: ["answer", "found"]};
  /* Straight from their notes, no model: "what is the id" when a note has a line "Id: ...", and "what are the defense mechanisms"
     when a note headed "Defense mechanisms" lists "Repression: ...", "Projection: ...". Exact, instant, theirs. */
  function fromNotes(q){
    const notes = Object.values(state.notes || {}).filter(n => n && !n.archived && n.text);
    // a comparison of two terms their notes define: both definitions, side by side
    const cmp = String(q).match(/\b(?:difference|differences|compare|contrast)\s+(?:between\s+)?(?:the\s+)?(.+?)\s+(?:and|vs\.?|versus|with)\s+(?:the\s+)?(.+?)\s*[?.!]*$/i) || String(q).match(/^\s*(?:the\s+)?(.+?)\s+(?:vs\.?|versus)\s+(?:the\s+)?(.+?)\s*[?.!]*$/i);
    if (cmp) { const a = fromNotes("what is " + cmp[1]), b = fromNotes("what is " + cmp[2]); if (a && b && !/^Your notes list/.test(a.answer + b.answer)) return {answer: `${a.answer}\n${b.answer}`, found: true, sources: [], fromNotes: true, notesSrc: [...new Set([...(a.notesSrc || []), ...(b.notesSrc || [])])]}; return null; }
    const term = (String(q).match(/^\s*(?:what (?:do|does) my (?:notes?|lecture|class notes) say about|what did (?:i|we) (?:write|learn|cover) about|what(?:'s| is| are)|whats|define|definition of|meaning of|what does)\s+(?:the\s+|a\s+|an\s+)?(.+?)(?:\s+mean)?\s*[?.!]*$/i) || [])[1];
    if (!term || term.split(/\s+/).length > 5) return null;
    const T = low(term).replace(/[^a-z0-9 &'-]/g, "").trim(); if (!T) return null;
    const lineRe = l => { const m = String(l).match(/^\s*[-•*]?\s*([^:\n]{2,60}?)\s*(?::|\s[-–—]\s)\s*(.{8,})$/); return m ? {k: m[1].trim(), v: m[2].trim()} : null; };
    const stem = w => w.replace(/(ies|es|s)$/, "");
    // a list: a note whose first line (its heading) is the term, with "Name: meaning" lines under it
    if (/^(the )?(types?|kinds?|phases?|stages?|steps?|causes?|parts?)\b/.test(T) || /s$/.test(T)) {
      for (const n of notes) { const lines = String(n.text).split("\n"), head = low(lines[0]).replace(/[^a-z0-9 &'-]/g, "").trim();
        if (head && (stem(head) === stem(T) || stem(head).includes(stem(T)) || stem(T).includes(stem(head))) && head.length >= 4) {
          const items = lines.slice(1).map(lineRe).filter(Boolean); if (items.length >= 2) return {answer: `Your notes list ${items.length} ${lines[0].trim().toLowerCase()}:\n${items.map(x => `- ${x.k}: ${x.v}`).join("\n")}`, found: true, sources: [], fromNotes: true, notesSrc: [lines[0].trim()]}; } }
    }
    // a definition: a line that starts with the term
    for (const n of notes) for (const l of String(n.text).split("\n")) { const x = lineRe(l); if (x && (low(x.k) === T || stem(low(x.k)) === stem(T))) {
      const v = x.v.replace(/^(is|are)\s+/i, "");
      return {answer: `${x.k} (from your notes): ${v.charAt(0).toLowerCase() === v.charAt(0) || /^[A-Z][a-z]+ /.test(v) ? v : v}${/[.!?)]$/.test(v) ? "" : "."}`, found: true, sources: [], fromNotes: true, notesSrc: [String(n.text).split("\n")[0].slice(0, 40)]}; } }
    return null;
  }
  // the level asked for ("like I'm 12", "simply"), for an answer from what the AI knows
  const level0 = q => /\blike i'?m (a )?(\d{1,2}|five|ten|a kid|a child)\b|\beli5\b|\bsimpl(e|y|er)\b|\bplain english\b|\bdumb(ed)? (it )?down\b/i.test(q) ? "\n\nThey asked for it simply: short sentences, everyday words, one everyday comparison." : "";
  // An answer from what the AI itself knows, for a question their notes and the web didn't answer: only what it's sure of
  async function own(q, o, level){
    // never about their own things ("who wrote my bio syllabus?", "what's in my notes"): only their data can answer that
    if (/\b(my|mine|our|i|i'm|i've)\b/i.test(q) && !/\b(how (do|can|should) i|can i|should i|i don'?t (get|understand)|explain)\b/i.test(q)) return null;
    const prevTxt = o.prev && o.prev.q ? `EARLIER IN THIS CHAT the student asked "${clip(o.prev.q, 200)}" and was told "${clip(o.prev.a, 500)}". The new question follows on from that: answer the new question itself (an example, a name, a list, the next part), and never repeat the earlier answer.\n\n` : "";
    const r = await aiCall({task: "assist", fast: true, maxTokens: 450, temperature: 0, quiet: true, signal: o.signal, onPartial: o.onPartial, schema: {type: "OBJECT", properties: {answer: {type: "STRING"}, sure: {type: "BOOLEAN"}}, required: ["answer", "sure"]},
      system: "You answer a student's school question from your own knowledge, like a good teacher. The first sentence answers exactly what they asked. Then add 1 to 3 sentences with the most useful detail, or list every item when they ask for several things (types, stages, examples, each one). Only state facts you are certain of. If you are not sure, set sure to false. Plain text, no markdown." + (level || ""),
      parts: [{text: `${prevTxt}THE STUDENT ASKS: ${q}`}]});
    const d = (r && r.data) || {}, a = String(d.answer || "").trim();
    // (a small model says "not sure" about basics it knows well: "what is lithium for", "where did van gogh paint the starry night".
    // A real answer is kept; only a refusal or a non-answer isn't)
    if (!a || nonAnswer(q, a) || /\b(i'?m not sure|i don'?t know|i cannot|i can'?t answer|i'?m unable|no information|not certain)\b/i.test(a.slice(0, 120)) || (d.sure === false && (o.strict || a.split(/\s+/).length < 8))) return null;
    return {answer: a, sources: [], found: true, own: true};
  }
  /* The lines of their own notes that a question is about, word for word, when the AI's answer didn't hold up ("who came up with
     REBT" -> "Rational-emotive behavior therapy (Albert Ellis)"; "what's the conduction pathway" -> the SA node line). Better than
     "couldn't find" when the note is right there; null when no line clearly matches. */
  function noteLines(q){
    const GEN = /^(work|works|happen|happens|mean|means|use|used|make|made|different|difference|important|example|explain|describe|function|process|role|cause|causes|effect|type|types|kind|part|parts|step|steps|thing|things|way|ways|note|notes|say|says|said|write|wrote|came|come|know|tell|about|does|what|which|who|when|where|why|how)$/;
    const stem = k => k.length > 5 ? k.slice(0, k.length - 2) : k;
    const keys = (low(q).match(/[a-z0-9]+/g) || []).filter(w => !QSTOP.has(w) && (w.length > 2 || /^(id|ego|av|sa|hr)$/.test(w)) && !GEN.test(w));
    if (!keys.length) return null;
    const longest = keys.slice().sort((a, b) => b.length - a.length)[0], need = Math.max(1, Math.ceil(keys.length / 2));
    const hits = [];
    Object.values(state.notes || {}).filter(n => n && !n.archived && n.text).forEach(n => { const head = String(n.text).split("\n")[0].trim();
      String(n.text).split(/\n|(?<=[.!?])\s+(?=[A-Z])/).map(l => l.trim()).filter(l => l.length > 6).forEach(l => {
        // ("REBT" is "Rational-emotive behavior therapy": the initials of the line's words count as the word)
        // (only the heading's own initials, from its start: the initials of a whole line spell almost anything, "pure" included)
        const ini = (head.match(/[A-Za-z]+/g) || []).map(x => x[0].toLowerCase()).join(""), acr = k => /^[a-z]{3,5}$/.test(k) && ini.startsWith(k);
        const L = low(head + " " + l), sc = keys.filter(k => L.includes(stem(k)) || acr(k)).length;
        if (sc >= need && (L.includes(stem(longest)) || acr(longest))) hits.push({head, l, sc, own: low(l).includes(stem(longest))}); }); });
    if (!hits.length) return null;
    hits.sort((a, b) => b.sc - a.sc || b.own - a.own);
    const top = hits.filter(h => h.sc === hits[0].sc).slice(0, 3);
    return {answer: `Your notes say:\n${top.map(h => `- ${h.l === h.head ? h.l : `${h.head}: ${h.l}`}`).join("\n")}`, sources: [], found: true, fromNotes: true, notesSrc: [...new Set(top.map(h => h.head.slice(0, 40)))]};
  }
  async function knowledge(q, o){
    o = o || {};
    { const fn = fromNotes(q); if (fn) return fn; }
    // pointed at their own notes ("the ABC thing in my notes", "what do my notes say about projection", "from my lecture notes"):
    // answered from their notes only, and searched without those words, so a web page about another meaning never answers it
    // (only "in my notes" goes: "the ABC thing in my notes" is searched as "ABC", never as "whats")
    { const NQ = /\s*\b(?:(?:in|from|on|of|according to) (?:my|the|our) (?:\w+ )?(?:notes?|lecture|slides)|(?:my|the) (?:class |lecture )?notes? (?:say|said|says|on|about|for))\b/i;
      if (NQ.test(q) && !o.noWeb) { const s = String(o.search || q).replace(NQ, " ").replace(/^\s*(?:what'?s|whats|what is|what are|explain|tell me|summari[sz]e)\s+/i, " ").replace(/\b(the|that|this|thing|things|stuff|part|bit)\b/gi, " ").replace(/[?!.]+/g, " ").replace(/\s+/g, " ").trim(); o = Object.assign({}, o, {noWeb: true, search: s.length > 1 ? s : o.search}); } }
    // their own material first; when it covers every key word of the question, the web waits (faster, and theirs wins) unless
    // the answer from the notes alone doesn't hold up
    // (filler isn't the topic: "whats MAIN again" looked up "again" and found the film Singham Again)
    const keys = (low(q).replace(/\b(again|still|now|exactly|anyway|tho|though|remind me|real quick|quickly|pls|please)\b/g, " ").replace(/\b(ww ?(1|i)|world war (1|i|one))\b/g, "wwi").replace(/\b(ww ?(2|ii)|world war (2|ii|two))\b/g, "wwii").match(/[a-z0-9]+/g) || []).filter(w => !QSTOP.has(w) && (w.length > 2 || /^(id|ego)$/.test(w)));
    // a follow-up ("in feet?", "who wrote it?", "give an example of each"): looked up with the earlier question's topic
    const look = o.search || q, prevTxt = o.prev && o.prev.q ? `EARLIER IN THIS CHAT the student asked "${clip(o.prev.q, 200)}" and was told "${clip(o.prev.a, 500)}". The new question follows on from that: answer the new question itself (an example, a name, a list, the next part), and never repeat the earlier answer.\n\n` : "";
    const mine = window.SBSEARCH ? await SBSEARCH.retrieve(look, Object.assign({max: 5, chars: 900, wait: 800, readWait: 2, semWait: 2500}, typeof DEVAI !== "undefined" && DEVAI.kind === "litert" ? {max: 8, chars: 1500} : {})).catch(() => null) : null;
    // (the search finding nothing on it, or not the note that has it: their notes read directly, a word spelled a little differently
    // counting, "countertransfrence", "peplau's phases", "my freud notes")
    let notes0 = mine && mine.text ? mine.text : "";
    { const lk = (low(look).match(/[a-z0-9]{3,}/g) || []).filter(w => !QSTOP.has(w) && !/^(notes?|summari[sz]e|summary|explain|tell|give|help|what|thing|stuff|using|wut|about|from|with|this|that|does|mean|means)$/.test(w));
      const fz = (txt, k) => { const t = low(txt); if (t.includes(k.length > 5 ? k.slice(0, k.length - 2) : k)) return true; return k.length >= 7 && (t.match(/[a-z]{6,}/g) || []).some(x => x.slice(0, 6) === k.slice(0, 6) && Math.abs(x.length - k.length) <= 3); };
      if (lk.length && !(notes0 && lk.some(k => fz(notes0, k)))) {
        const hits = Object.values(state.notes || {}).filter(n => n && !n.archived && n.text).map(n => ({n, s: lk.filter(k => fz(n.text, k)).length + lk.filter(k => fz(String(n.text).split("\n")[0], k)).length})).filter(x => x.s > 0).sort((a, b) => b.s - a.s).slice(0, 2);
        if (hits.length) notes0 = hits.map(x => String(x.n.text).slice(0, 1500)).join("\n\n") + (notes0 ? "\n\n" + notes0 : ""); } }
    const notes = notes0, covered = notes && keys.length && keys.every(k => low(notes).includes(k.length > 5 ? k.slice(0, k.length - 2) : k));
    let web = [], useNotes = "", useWeb = [];
    let webP = null;
    // a word with several meanings that their own notes use ("sublimation", "projection", "conduction"): looked up on the web in the
    // sense of those notes (the note's heading, or its course), not the chemistry or the film
    let sense = "";
    { const k0 = keys.slice().sort((a, b) => b.length - a.length)[0];
      if (k0 && k0.length >= 6) { const st = k0.slice(0, k0.length - 2), n = Object.values(state.notes || {}).find(x => x && !x.archived && low(x.text || "").includes(st));
        if (n) { const head = String(n.text).split("\n")[0].trim(), cs = state.courses || {}, c = n.courseId ? (Array.isArray(cs) ? cs.find(x => x.id === n.courseId) : cs[n.courseId]) : null;
          sense = head && head.length <= 50 && !low(head).includes(st) ? head : c && c.name ? c.name : "";
          if (sense && low(look).includes(low(sense))) sense = ""; } } }
    // a web passage that never mentions what was asked about is another meaning of a word in it ("bro" -> Bro culture, "eastern half"
    // -> New South Wales, "outline" -> the Outline app): left out, so it can't become the answer or be tacked on after a good one
    const lkeys = (low(look).match(/[a-z0-9]+/g) || []).filter(w => !QSTOP.has(w) && w.length >= 4 && !/^(work|works|happen|happens|mean|means|used|uses|make|makes|made|different|difference|important|example|examples|explain|describe|thing|things|really|exactly|actually|basically|called|more|detail|detailed|shorter|simpler|again|another|please|about|tell|give|list|name|other|same|kind|type|types|part|parts|good|best|first|last|main)$/.test(w));
    const onTopic = x => !lkeys.length || lkeys.some(k => low(`${x.title} ${String(x.text || "").slice(0, 700)}`).includes(k.length > 5 ? k.slice(0, k.length - 2) : k));
    const getWeb = () => { if (o.noWeb) return Promise.resolve([]); if (!webP) webP = research(sense ? `${look} (${sense})` : look).then(R => ((R && R.list) || []).filter(onTopic), () => []); return webP; };
    // a question their notes don't touch ("who was US president in 1945", "what's the largest organ", "how does dialysis work", "what's
    // lithium for", and a follow-up with its topic): what the AI knows, when it's sure, first. The eval: web passages about another meaning of
    // a word ("bro" culture, a pipe organ, Big Brother the show) were a fifth of all failures, and each web answer is two slow steps more.
    // The web when the AI isn't sure, or when they ask for it (look it up, sources, research, the latest)
    const wantsWeb = /\b(look (it |this |that )?up|search|google|online|on the web|internet|sources?|cite|citation|reference|research|stud(y|ies) (show|found|say)|evidence|latest|current(ly)?|recent(ly)?|news|this year|today'?s|2025|2026|statistics|stats|wikipedia)\b/i.test(q + " " + (o.search || ""));
    // (a short fact question or a follow-up; "explain osmosis", "how does dialysis work" keep Wikipedia as their source, on-topic passages only)
    const shortFact = String(q).split(/\s+/).length <= 12 && /^\s*(?:and\s+|so\s+|but\s+)?(what|what's|whats|who|who's|whos|which|when|where|how (many|much|long|old|far|big|tall)|is|are|was|were|did|does|do|name)\b/i.test(q) && !/^\s*(what|how) (is|are|does|do)\b[^?]{0,40}\b(work|happen|cause|mean|function)s?\b/i.test(q);
    // (the web starts loading now for what will use it: an explanation, or what they asked to look up)
    if (!o.noWeb && (wantsWeb || !(shortFact || (o.prev && o.prev.q)))) getWeb();
    { const fact = !o.noWeb && !wantsWeb && (shortFact || !!(o.prev && o.prev.q)) && !/\b(my|mine|i'm|i've|our)\b/i.test(q) && !/\b(i|me)\b(?![^?]*\b(how|why|explain|understand|remember)\b)/i.test(q.replace(/^\s*(?:can|could|would) you\b/i, ""))
        && !(notes && keys.length && keys.some(k => k.length >= 4 && low(notes).includes(k.length > 5 ? k.slice(0, k.length - 2) : k)));
      if (fact) { const ow = await own(q, Object.assign({}, o, {strict: true}), level0(q)).catch(e => { if (e && /^(nokey|key|cancelled|no-consent|blocked)$/.test(String(e.code || ""))) throw e; return null; }); if (ow) return ow; } }
    if (!notes) web = await getWeb();
    if (!notes && !web.length) { const ow = await own(q, o, level0(q)).catch(e => { if (e && /^(nokey|key|cancelled|no-consent|blocked)$/.test(String(e.code || ""))) throw e; return null; }); if (ow) return ow;
      return {answer: o.noWeb ? "I couldn't find anything about that in your Studyboard." : "I couldn't find anything about that in your notes, your files or on the web, and I'm not sure enough to answer from memory. Try other words, or add your notes on it.", sources: [], found: false}; }
    const deep = /^\s*(explain|describe|how (does|do|did|is|are|can)|why|walk me through|tell me about|compare|what('s| is) the difference)\b/i.test(q);
    const sys = `You answer a student's question using only the sources given. Your first sentence answers exactly what they asked, directly. ${deep ? "Then explain it properly in 3 to 5 more sentences: the main parts or steps in order, how they connect, and why it matters, all from the sources." : "Then add 1 to 3 sentences with the most useful detail: how it works, why it matters, or a short example."} If the question asks for several things (what are the..., types, kinds, phases, stages, causes, steps, examples), list every one the sources give. If it asks for an example, give one. If the question could mean several things, answer the meaning that fits their notes and course. If the sources don't answer it, set found to false and say you couldn't find it. Plain text, no markdown.`;
    const srcOf = () => `${useNotes ? `FROM THE STUDENT'S OWN STUDYBOARD: notes, files, tasks, events, courses (use these first; say "your notes say" when you use a note, never which kind of item it was, like "your flashcard" or "the deck"):\n${useNotes}\n\n` : ""}${useWeb.length ? `FROM THE WEB (say where it's from, like "according to Wikipedia"):\n${webText(useWeb)}` : ""}`;
    // the level they ask for: "like I'm 12", "simply", "ELI5", "in plain English", "dumb it down"
    const simple = /\blike i'?m (a )?(\d{1,2}|five|ten|a kid|a child|in (middle|elementary) school)\b|\beli5\b|\bsimpl(e|y|er)( terms| words| way)?\b|\bplain english\b|\bdumb(ed)? (it )?down\b|\bfor (a )?(kid|beginner|dummies)\b|\bbasic terms\b/i.test(q);
    const level = simple ? "\n\nThe student asked for it simply: use short sentences and everyday words a 12-year-old knows, explain any term you have to use, and give one everyday comparison (\"it's like...\"). Keep every fact correct and from the sources." : "";
    const call = (src, extra) => aiCall({task: "assist", fast: true, maxTokens: deep ? 700 : 420, temperature: 0.2, schema: KSCHEMA, quiet: true, signal: o.signal, onPartial: o.onPartial, system: sys + level + (extra || ""), parts: [{text: `${src}\n\n${prevTxt}THE STUDENT ASKS: ${q}`}]});
    // a list question gets a list; an explanation gets more than a definition
    const listQ = /^\s*(what|which|name|list)\b[^?]*\b(are the|are some|types?|kinds?|phases?|stages?|steps?|causes?|parts?|examples?|mechanisms?|functions?|symptoms?|signs?|principles?|components?|features?|factors?)\b/i.test(q) && !/\b(example of)\b/i.test(q);
    const shape = x => { const a = String(x.answer || ""); if (listQ && (a.match(/,|;|\n- |\n\d\./g) || []).length < 2) return false; if (deep && (a.split(/(?<=[.!?])\s+/).length < 3 || a.split(/\s+/).length < 35)) return false;
      // "who ...": the answer has to name someone the question didn't
      if (/^\s*who\b/i.test(q) && !(a.match(/(?<!\b(?:in|of|at|from|to) )\b[A-Z][a-z]+\b/g) || []).some(n => !low(q).includes(low(n)) && !/^(From|Your|The|This|That|They|He|She|It|In|On|At|According|Wikipedia|Archduke|King|Queen|Prince|Princess|Emperor|President|Dr|Doctor|Professor|Sir|Saint|St|January|February|March|April|May|June|July|August|September|October|November|December)$/.test(n))) return false;
      // a "what is X" answered with only the question's own words ("the working phase is one of the phases") says nothing yet
      { const qw = new Set((low(q).match(/[a-z]+/g) || []).map(w => w.slice(0, 5)));
        const fresh = (low(a).match(/[a-z]{4,}/g) || []).filter(w => !qw.has(w.slice(0, 5)) && !/^(your|notes?|says?|said|that|this|these|which|with|from|they|their|there|what|when|also|according|wikipedia|flashcards?|deck|theory|ones?|part|parts|called|known|being|have|been|into|about|some|more|most|such)$/.test(w));
        if (/^\s*(what'?s|whats|what (is|are|was|were|does|do)|explain|define|describe|tell me about)\b/i.test(q) && !/\d/.test(a) && new Set(fresh).size < 3) return false; }
      // "what is X" for an idea: more than the one defining sentence (what it's made of, how it works, or an example)
      if (/^\s*(what'?s|whats|what (is|are)|tell me about)\b/i.test(q) && !listQ && !/\b(name|date|year|when|who|how (many|much|long|old))\b/i.test(q) && a.split(/(?<=[.!?])\s+(?=[A-Z])/).filter(x => x.split(/\s+/).length > 3).length < 2) return false;
      return true; };
    const ok = (x, src, loose) => x && x.answer && x.found !== false && !nonAnswer(q, x.answer) && !unsupported(x.answer, src + "\n" + q).length && (loose || shape(x));
    // one source at a time: the notes alone, then (when they don't fully answer it) the web alone, so each part of the answer says
    // where it came from. At most three model calls each
    const solve = async () => {
      let fallback = null;
      const tryOnce = async (extra) => { const src = srcOf(); try { const r = await call(src, extra); const x = r && r.data; if (ok(x, src)) return x; if (!fallback && ok(x, src, true)) fallback = x; return null; } catch (e) { if (e && /^(nokey|key|cancelled|no-consent|blocked)$/.test(String(e.code || ""))) throw e; aiFail = e; return null; } };
      const SHAPE = listQ ? "\n\nIMPORTANT: name every one the sources give, as a list (separated by commas or on their own lines), each with a few words on what it is." : deep ? "\n\nIMPORTANT: write at least 4 full sentences: what it is, then each main part or step from the sources in order, then why it matters." : "";
      let d = await tryOnce();
      if (aiFail) return d;
      if (!d && fallback && (typeof DEVAI === "undefined" || DEVAI.kind === "litert" || typeof aiOnDevice !== "function" || aiOnDevice())) return fallback; // (on the device: the first answer that holds up, not 2 more slow tries for a better shape)
      if (!d && fallback) d = (SHAPE ? await tryOnce(SHAPE) : null) || fallback;
      if (!d && !aiFail) { d = await tryOnce(`\n\nIMPORTANT: answer the question itself in your first sentence, using only facts in the sources. If the sources don't answer it, set found to false.${SHAPE}`); if (!d && fallback) d = fallback; }
      return d;
    };
    let fromN = null, fromW = null, aiFail = null;
    // (only when the notes mention what was asked at all: otherwise straight to the web)
    // the notes are about it when they hold the question's own topic words (not just "work", "use" or "different"): most of them,
    // and the most specific (longest) one always
    // (what they ask to have done to it isn't the topic: "summarize my Freud notes" is about Freud, not "summarize")
    const GENERIC = /^(work|works|working|happen|happens|mean|means|use|used|uses|make|makes|made|different|difference|important|example|examples|explain|describe|function|functions|process|role|cause|causes|effect|effects|type|types|kind|kinds|part|parts|step|steps|thing|things|way|ways|good|bad|best|need|needs|help|really|exactly|actually|basically|called|happening|affect|affects|summarize|summarise|summary|summarized|sum|bullet|bullets|points|point|list|three|two|four|five|short|shorter|brief|briefly|key|main|define|definition|meaning|notes|note|using|wut|tell|give|quick|quickly|simple|simply|detail|detailed|more)$/;
    const topic = keys.filter(k => !GENERIC.test(k)), stem = k => k.length > 5 ? k.slice(0, k.length - 2) : k;
    const longest = topic.slice().sort((a, b) => b.length - a.length)[0];
    // (spelled a little differently counts: "countertransfrence" is the note's "countertransference")
    const nWords = notes ? [...new Set(low(notes).match(/[a-z]{6,}/g) || [])] : [];
    const has = k => low(notes).includes(stem(k)) || (k.length >= 7 && nWords.some(x => x.slice(0, 6) === k.slice(0, 6) && Math.abs(x.length - k.length) <= 3));
    const touches = notes && (topic.length ? has(longest) && topic.filter(has).length >= Math.ceil(topic.length / 2) : keys.some(has));
    if (notes && !touches && !o.noWeb) { web = web.length ? web : await getWeb(); }
    if (notes && (touches || o.noWeb || !web.length)) {
      useNotes = notes; useWeb = [];
      fromN = await solve();
      // still thin for an explanation: the lines of their own notes that cover it, after the answer
      if (fromN && (deep || listQ) && !shape(fromN) && covered && mine && mine.rows && mine.rows.length) {
        const kk = keys.map(k => k.length > 5 ? k.slice(0, k.length - 2) : k), lines = [];
        mine.rows.forEach(r => String(r.text || (r.doc && r.doc.text) || "").split(/\n|(?<=\.)\s+(?=[A-Z])/).forEach(l => { l = l.trim(); if (l.length > 12 && l.length < 260 && !lines.includes(l) && kk.some(k => low(l).includes(k))) lines.push(l); }));
        const add = lines.filter(l => !low(fromN.answer).includes(low(l).slice(0, 40))).slice(0, 5);
        if (add.length) fromN = Object.assign({}, fromN, {answer: `${String(fromN.answer).trim()}\n${add.map(l => "- " + l).join("\n")}`});
      }
      // their notes are about it but the AI's answer from them didn't hold up (a small model's paraphrase, or "found: false"): the
      // note's own lines on it, never "Your notes don't cover this" (E2B round 2: the REBT goal, the AV node delay, WWI's causes)
      if (!fromN && !aiFail) { const nl = noteLines(look) || (look !== q ? noteLines(q) : null); if (nl) fromN = {answer: nl.answer.split("\n").slice(1).map(x => x.replace(/^-\s*/, "").trim().replace(/([^.!?])$/, "$1.")).join(" ")}; }
    }
    // the notes answer it fully (every key word is in them, and the answer holds up and has the right shape): no web needed
    // (an answer from their notes that holds up and has the right shape is the answer: nothing from the web tacked on after it)
    const full = fromN && shape(fromN);
    if (!full && !o.noWeb) {
      if (!web.length) web = await getWeb();
      if (web.length) { useNotes = ""; useWeb = web; fromW = await solve(); }
    }
    // the AI itself failed (not "nothing found"): that's said, with why, instead of "couldn't find"
    if (!fromN && !fromW && aiFail) throw aiFail;
    // neither their notes nor the web answered it: what the AI knows, only when it's sure (a basic school fact: "capital of
    // australia", "how many chromosomes do humans have"), else said plainly
    if (!fromN && !fromW) { const nl = noteLines(o.search || q); if (nl) return nl; }
    if (!fromN && !fromW) { const ow = await own(q, o, level).catch(e => { if (e && /^(nokey|key|cancelled|no-consent|blocked)$/.test(String(e.code || ""))) throw e; return null; }); if (ow) return ow;
      return {answer: notes ? "I couldn't find a clear answer to that in your notes or on the web, and I'm not sure enough to answer from memory." : "I couldn't find a clear answer to that on the web, your notes don't cover it, and I'm not sure enough to answer from memory.", sources: [], found: false}; }
    const clean = a => String(a || "").trim().replace(/(?<=[.!?])\s+I (couldn't|could not|can't) find [^.]*(notes|web|sources)[^.]*\.?\s*$/i, "").replace(/^(your notes say(,| that)?|according to (your notes|wikipedia)(,)?)\s*/i, m => m);
    const webName = [...new Set(web.map(x => x.src || "Wikipedia"))].slice(0, 2).join(" and ") || "the web";
    const answer = fromN && fromW ? `From your notes: ${clean(fromN.answer)}\n\nFrom the web (${webName}): ${clean(fromW.answer)}`
      : fromN ? `From your notes: ${clean(fromN.answer)}${!full && !o.noWeb && (String(q).match(/(?<=\S\s+)[A-Z][a-z]{2,}/g) || []).map(k => k.toLowerCase()).some(k => !low(fromN.answer).includes(k.length > 5 ? k.slice(0, k.length - 2) : k)) ? "\n\nThat's as much as your notes cover, and I couldn't find more on the web just now." : ""}` : `${notes ? "Your notes don't cover this, so from the web" : "From the web"} (${webName}): ${clean(fromW.answer)}`;
    return {answer, sources: fromW ? web.map(x => ({title: x.title, url: x.url, src: x.src || "Wikipedia"})) : [], fromNotes: !!fromN, found: true, notesSrc: fromN && mine && mine.src ? mine.src : []};
  }

  // a question about the subject itself, not the planner: "what is the id", "how does my notes' Krebs cycle work", "explain osmosis"
  // a polite opening ("can you tell me", "do you know", "I'd like to know") says nothing about who the question is about
  const asked = q => String(q || "").replace(/^\s*(hey|hi|ok(ay)?|so|um+)?[,\s]*(please\s+)?((can|could|would|will) (you|u)( please)?( (tell|show|teach) me| explain| describe| help me understand)?( more)?( about)?|do (you|u) know( anything about)?|i('d| would) (like|love) to (know|learn)( more)?( about)?|i want to (know|learn|understand)( more)?( about)?|i wanna know( more)?( about)?|help me understand|tell me( more)?( about)?|teach me( about)?)\s+/i, m => /\b(tell|show|teach|explain|describe|understand|know|learn|about)\b/i.test(m) ? "explain " : m);
  // A question about a subject (answered from the student's notes, then the web), unless it's clearly about something else: their
  // planner, the app, Mochi itself, advice, or a request to do something. Decided by what it's about, never by how it starts, so
  // "what is osmosis", "osmosis?", "can you tell me more about osmosis" and "I'm confused about osmosis" all count the same.
  const general = q0 => { const q = asked(norm ? norm(q0) : q0);
    if (String(q).replace(/[^a-z]/gi, "").length < 4) return false;
    // nothing to look up: a short reply that leans on the chat ("why", "on what", "which one", "guess", "pleeease", "next question",
    // "so after thursday?", "which notes", "what's the easiest section"), jokes, tastes and live things (weather, news) are talk
    if (/\b(jokes?|joke|laugh|funny|puns?|riddles?|knock knock|favou?rite|meaning of life|weather|forecast|news|score last night|coffee order|bored|boring)\b/i.test(q)) return false;
    { const ws = String(q).toLowerCase().match(/[a-z][a-z']+/g) || [];
      const content = ws.filter(w => !QSTOP.has(w) && !/^(what|whats|what's|which|when|where|how|who|why|so|and|but|or|then|ok|okay|oh|wait|hmm|um|yeah|yes|no|nah|pls|please|ple+ase+|one|ones|part|section|bit|thing|things|stuff|next|question|guess|again|easiest|hardest|best|worst|first|last|after|before|that|this|it|its|it's|they|them|those|these|notes?|tho|though|really|sure|more|else|other|another|same|like|just|lol|haha|now|still|actually|is|are|was|were|do|does|did|can|could|should|would|will|the|a|an|on|in|at|of|to|for|with|about|from|me|my|you|your|i|i'm|im|tomorrow|today|monday|tuesday|wednesday|thursday|friday|saturday|sunday|mean|means)$/.test(w));
      if (!content.length) return false; }
    // advice ("how should I study", "tips to remember", "best way to")
    if (/\b(should i|how (do|can|should|would) i (study|prepare|prep|remember|memori[sz]e|focus|manage|balance|stay|stop|get better|improve|deal|cope|start)|tips?|advice|best way|ways to|help me|study plan|motivat|procrastinat|stress|anxious|overwhelm)\b/i.test(q)) return false;
    // the planner and the app: a planner word counts when the question is about the student ("my", "I", "am I"), or when nothing
    // else is left in it ("what's due", "grades?"). "What is the average atomic mass" and "how does light pass through glass" are subjects
    const PLAN = /\b(due|grades?|marks?|tasks?|deadlines?|class(es)?|schedule|calendar|studyboard|mochi|working on|doing|timer|focus|free|busy|settings?|theme|companion|pass(ing)?|fail(ing)?|average|gpa|overdue|decks?|board|planner|semester|assignments? (left|due)|homework (left|due)|how many|streak|daily goal|study goal)\b/i;
    // Studyboard's own features are always about the app
    if (/\b(studyboard|mochi|companion|timer|pomodoro|focus (session|mode|time)|settings?|theme|dark mode|planner|streak|daily goal|study goal|widgets?|wardrobe|accessor(y|ies)|the app|this app|sync|notifications?|reminders?)\b/i.test(q)) return false;
    // their own courses and work: "is my bio course hard", "when is the midterm", "how long is my essay"
    if (/\b(my|mine|am i|i'm|im|i have|i've)\b/i.test(q) && /\b(course|courses|class|classes|profs?|professors?|teachers?|instructors?|tas?|course codes?|codes?|rooms?|office hours|exam|exams|test|tests|midterm|final|finals|quiz|quizzes|lab|labs|essay|project|assignment|homework|syllabus|semester|term|schedule|lecture|lectures)\b/i.test(q) && !/\b(my )?(notes?|files?|slides?|readings?|textbook)\b/i.test(q)) return false;
    if (/^\s*(when|where|what time|what day|how long until|how many days)\b/i.test(q) && /\b(exam|exams|test|midterm|final|finals|quiz|lab|essay|project|assignment|homework|class|lecture|office hours)\b/i.test(q) && !/\b(war|revolution|era|period|century|dynasty|treaty|invented|discovered|founded)\b/i.test(q)) return false;
    // one of their own courses or instructors by name ("who teaches BIOS 230", "what's dr chen's email", "where is psych nursing", "is
    // hist 1010 online"): their planner, never a web page about the words
    { const lq = low(q), cs = Array.isArray(state.courses) ? state.courses : Object.values(state.courses || {});
      if (cs.some(c => c && !c.gen && ((c.code && new RegExp("\\b" + String(c.code).toLowerCase().replace(/[^a-z0-9]+/g, "\\s*") + "\\b").test(lq)) || (c.name && c.name.length > 5 && lq.includes(String(c.name).toLowerCase())) || (String(c.instructor || "").toLowerCase().match(/[a-z]{4,}/g) || []).some(w => !/^(prof|professor|doctor)$/.test(w) && new RegExp("\\b" + w + "('?s)?\\b").test(lq))))) return false;
      if (/\b(instructors?|professors?|profs?|teachers?|tas?|course codes?|office hours|syllabus)\b/i.test(lq) && /^\s*(who|what|whats|what's|when|where|which|list|show|tell|do|does|is|are|how)\b/i.test(lq)) return false;
      // one of their own tasks or events by name ("a&p quiz 4" found the Big Fat Quiz, "care plan 2" a care-plan
      // article), a priority ("medium priority") or a day said as a reply ("tuesday is fine", "the 24th", "two sundays before"):
      // their planner, not a subject
      const named = list => (Array.isArray(list) ? list : Object.values(list || {})).some(x => { const t = low(String((x && (x.title || x.name)) || "")); return t.length >= 5 && !/^(general|notes?|my notes|untitled)$/.test(t) && new RegExp("(?<![a-z0-9])" + t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "(?![a-z0-9])").test(lq); });
      // (tasks and events only: a note or deck's name, "defense mechanisms", "heart", is a subject they ask about)
      if (named(state.tasks) || named(state.events)) return false;
      if (/\b(priority|reschedule|postpone)\b/.test(lq) || (lq.split(/\s+/).length <= 5 && /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mondays|tuesdays|wednesdays|thursdays|fridays|saturdays|sundays|tomorrow|tonight|today|next week|weekend|\d{1,2}(st|nd|rd|th)|am|pm)\b/.test(lq))) return false; }
    if (PLAN.test(q)) {
      const mine = /\b(my|mine|me|i|i'm|im|i've|ive|am i|we|our|us)\b/i.test(q);
      const rest = (q.toLowerCase().replace(new RegExp(PLAN.source, "gi"), " ").match(/[a-z]{3,}/g) || []).filter(w => !QSTOP.has(w) && !/^(what|whats|which|when|where|how|who|why|does|any|anything|there|tell|explain|about|more|show|list|all|left|got|have|get|need|the|and|for|are|is|you|change|set|turn|use|find|open|add|see|switch|edit|do)$/.test(w));
      if (mine || !rest.length) return false;
    }
    // their own week, day or workload ("make my week less awful", "how do I survive my schedule")
    if (/\b(my|our)\s+(week|day|weekend|schedule|workload|semester|term|life|plan|time|evening|morning|night|stress|load)\b/i.test(q)) return false;
    // when: their day, not a subject
    if (/\b(today|tonight|tomorrow|tmrw|this (week|weekend|morning|afternoon|evening)|next week|right now|later today)\b/i.test(q)) return false;
    // Mochi itself ("how are you", "do you like me", "what's your name")
    if (/\b(are (you|u)|do (you|u) (like|love|think|feel|remember|know me)|(you|u) (like|love|think|feel)|your (name|favou?rite|opinion)|about (you|yourself)|who made you|can (you|u) (hear|see) me)\b/i.test(q)) return false;
    // a request to do something (add, move, make, start...)
    if (/^\s*(please\s+)?((can|could|would|will) (you|u)\s+)?(add|move|make|create|start|stop|set|delete|remove|remind|schedule|plan|mark|rename|open|show me my|find my|quiz me|test me|generate|write me|draw|put|save|change|turn)\b/i.test(q)) return false;
    return true; };

  return {norm, nonAnswer, knowledge, range, facts, followUp, afterThat, courseIn, steps, specifics, unsupported, web, webText, general, research, openAlex, wiktionary, courseNamed};
})();
