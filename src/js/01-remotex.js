/* ===== module: 01-remotex.js: the app's core, exams and quizzes: can this one be done from home ===== */
/* Exams and quizzes */
let RMEMO = {k: "", m: new Map()};
const remoteIsOnline = s => /\b(zoom|teams|webex|google meet|online|virtual|remote)\b|^https?:/i.test(String(s || ""));
function remoteFacts(t){
  const L = lmsOf(t);
  return {type: t.type, title: t.title || "", text: t.prepFor ? "" : (t.notes || ""), location: t.location || "", rx: L && L.rx ? L.rx : null, sched: {}};
}
// Your weekly schedule on the day
function remoteSched(t){
  const out = {};
  if (!t.due) return out;
  try {
    const tm = t.time || "";
    schOccurrences(t.due, t.due).filter(o => !o.skipped && o.date === t.due).forEach(o => {
      const where = String(o.where || "").trim();
      if (o.type === "event") {
        const examish = /\b(exam|test|quiz|midterm|final)\b/i.test(o.title + " " + (o.label || "")) && (!o.course || o.course.id === t.courseId);
        if (where && !remoteIsOnline(where) && (AINS.similar(o.title, t.title) || examish)) out.room = where;
      } else if (o.type === "meet" && o.c && o.c.id === t.courseId && o.start && o.end && tm && !/office/i.test(o.label || "") && !remoteIsOnline(where)) {
        if (t.type === "Exam" ? (tm >= o.start && tm < o.end) : (tm > o.start && tm < o.end)) out.inClass = true;
      }
    });
  } catch(e) {}
  return out;
}
function remoteRule(t){
  const k = (state.updated || 0) + "|" + todayISO();
  if (RMEMO.k !== k) RMEMO = {k, m: new Map()};
  const f = remoteFacts(t), sig = REMOTEX.sigOf(f), key = `${t.id}|${sig}|${t.due}|${t.time || ""}|${t.courseId || ""}`;
  let r = RMEMO.m.get(key);
  if (!r) { f.sched = remoteSched(t); r = {rule: REMOTEX.verdict(f), sig, f}; RMEMO.m.set(key, r); }
  return r;
}
function remoteOf(t){
  if (!t || !MILESTONE(t.type)) return {v: "yes", src: "n/a", why: "", na: true};
  const r = remoteRule(t);
  return REMOTEX.remoteEff(t, r.rule, r.sig);
}
const canDoNow = t => REMOTEX.canDoNow(t, remoteOf(t));
// The day a take-home exam or quiz opens on the school site
function remoteOpens(t){ const L = lmsOf(t), ul = L && L.rx && L.rx.ul; if (!ul) return ""; const d = new Date(ul); return isNaN(d) ? "" : iso(d); }
const remoteChip = e => !e || e.na ? "" : e.v === "yes" ? "Take-home" : e.v === "no" ? "In person" : "Not sure";
const REMOTE_BY = {user: "You", lms: "School site", ai: "Automatic AI", rule: "Auto"};
function remoteNoteHtml(e){
  if (!e || !e.v) return `<span class="rx-chip unk">Not sure</span> It isn't suggested as Do This Next until it's known to be taken from home.${e && e.why ? " " + esc(e.why) + "." : ""}`;
  return `<span class="rx-chip ${e.v === "yes" ? "yes" : "no"}">${esc(remoteChip(e))}</span> <b>Detected by:</b> ${esc(REMOTE_BY[e.src] || "Auto")}.${e.why && e.src !== "user" ? " " + esc(e.why) + (/[.!?]$/.test(e.why) ? "" : ".") : e.src === "user" ? " " + esc(e.why) : ""}${e.v === "yes" ? "" : " Not suggested as Do This Next."}`;
}
// Keep the saved answer in step with what the rules can tell now
let rmStoreT = null;
function remoteStoreSoon(){ clearTimeout(rmStoreT); rmStoreT = setTimeout(remoteStore, 700); }
let RMSTORE = {n: 0, at: 0};
function remoteStore(){
  try {
    if (Date.now() - RMSTORE.at > 10000) RMSTORE = {n: 0, at: Date.now()};
    if (++RMSTORE.n > 6) return;
    const ch = [];
    tasksArr().forEach(t => {
      if (!MILESTONE(t.type) || t.status === "done" || t.remoteSrc === "user") return;
      const r = remoteRule(t).rule, live = r.verdict !== "unknown" && r.confidence >= REMOTEX.APPLY ? r : null;
      if (live) {
        if (t.remote === live.verdict && t.remoteSrc === live.src && t.remoteWhy === live.why) return;
        const n = clone(t); n.remote = live.verdict; n.remoteSrc = live.src; n.remoteWhy = live.why; n.remoteAt = Date.now(); n.remoteSig = "";
        ch.push({kind: "task", id: t.id, after: n});
      } else if (t.remote && (t.remoteSrc === "rule" || t.remoteSrc === "lms")) {
        const n = clone(t); ["remote", "remoteSrc", "remoteWhy", "remoteAt", "remoteSig"].forEach(k => { delete n[k]; });
        ch.push({kind: "task", id: t.id, after: n});
      }
    });
    if (ch.length) applyChanges(ch, null);
  } catch(e) { console.warn("Exam location", e); }
}
// The student's own answer
function remoteSet(id, v, label){
  const t = state.tasks[id]; if (!t) return;
  const n = clone(t);
  if (v === "yes" || v === "no") { n.remote = v; n.remoteSrc = "user"; n.remoteWhy = "You set this"; n.remoteAt = Date.now(); n.remoteSig = ""; }
  else ["remote", "remoteSrc", "remoteWhy", "remoteAt", "remoteSig"].forEach(k => { delete n[k]; });
  const inv = applyChanges([{kind: "task", id, after: n}], label === undefined ? "" : label);
  INS_MEMO.k = ""; return inv;
}
// Asked right after an exam or quiz is added by hand
function remoteAsk(id){
  const t = state.tasks[id]; if (!t || !MILESTONE(t.type) || t.status === "done" || remoteOf(t).v) return;
  const kind = t.type.toLowerCase();
  openSheet(`<form class="sheet">${head("Where Is It Taken?")}<div class="sheet-body"><p style="margin:0">Can you take <b>${esc(t.title)}</b> from home (online or take-home), or is it in person?</p><p class="mini" style="margin:8px 0 0">From home: it can be suggested as something to work on. In person: Today's Plan suggests studying for it instead. You can change this later in the ${esc(kind)}'s details.</p></div>
    <div class="sheet-foot"><button type="button" class="btn" data-rx="">Not Sure</button><span class="spacer"></span><button type="button" class="btn" data-rx="no">In Person</button><button type="button" class="btn primary" data-rx="yes">From Home</button></div></form>`);
  dlg.querySelectorAll("[data-rx]").forEach(b => b.addEventListener("click", () => {
    const v = b.dataset.rx; if (dlg.open) dlg.close();
    const prep = t.due > todayISO() && window.SBPREP ? {label: "Plan My Prep", fn: () => SBPREP.open(id)} : undefined;
    if (v !== "yes" && v !== "no") { if (prep) toast(`Left as “Not sure”. You can set it in the ${kind}'s details.`, null, prep); return; }
    const inv = remoteSet(id, v, null);
    toast(v === "yes" ? `“${t.title}” can be done from home` : `“${t.title}” is taken in person`, () => { applyChanges(inv, null); toast("Undone"); }, prep);
  }));
}
// Exams and quizzes the AI could read
function remoteCands(max, today){
  today = today || todayISO();
  return tasksArr().filter(t => MILESTONE(t.type) && t.status !== "done" && t.due && t.remoteSrc !== "user" && !t.prepFor)
    .filter(t => { const d = dayDiff(today, t.due); return d >= -1 && d <= 60; })
    .filter(t => { const r = remoteRule(t), e = remoteOf(t); return (!e.v || e.assumed) && REMOTEX.hasText(r.f) && (AUTO.rmt || {})[t.id] !== r.sig; })
    .sort((a, b) => a.due < b.due ? -1 : 1).slice(0, max || 1);
}
const REMOTE_SCHEMA = {type: "OBJECT", properties: {takeHome: {type: "STRING", enum: ["yes", "no", "unknown"], description: "yes only if the text shows it is taken from home or online; no only if it shows it is taken in person or on campus; otherwise unknown"},
  confidence: {type: "NUMBER", description: "0 to 1"}, evidence: {type: "STRING", description: "A short quote from the text (under 120 characters) that shows it"}}, required: ["takeHome", "confidence", "evidence"]};
async function autoRemote(){
  const t = remoteCands(1)[0]; if (!t) return;
  const r = remoteRule(t), text = REMOTEX.aiText(r.f), c = courseOf(t.courseId);
  AUTO.rmt = AUTO.rmt || {};
  const mark = why => { AUTO.rmt[t.id] = r.sig; AUTO.rmtWhy = AUTO.rmtWhy || {}; AUTO.rmtWhy[t.id] = why; const k = Object.keys(AUTO.rmt); if (k.length > 200) k.slice(0, k.length - 200).forEach(x => { delete AUTO.rmt[x]; if (AUTO.rmtWhy) delete AUTO.rmtWhy[x]; }); INS_MEMO.k = ""; };
  try {
    const res = await aiCall({task: "remote", auto: true, fast: true, maxTokens: 500, temperature: 0, schema: REMOTE_SCHEMA, parts: [{text: `Course: ${c ? c.name : "not given"}\nThis is everything the school site gave for one ${t.type.toLowerCase()}:\n"""\n${text}\n"""`}],
      system: "A student's planner needs to know whether a given exam or quiz is taken from home (online, take-home, or on the student's own computer, including with a remote lockdown browser or webcam proctor) or in person (in class, on campus, in a testing center, on paper, a lab or clinical practical). Decide only from the text between the triple quotes, never from general knowledge about the course. Answer takeHome 'yes' only if the text clearly shows it is taken from home or online, 'no' only if the text clearly shows it is taken in person, otherwise 'unknown'. 'evidence' must be a short quote copied from the text that proves your answer. If the text is silent, answer unknown with low confidence. Return JSON only."});
    const v = REMOTEX.vetAi(res.data, {text});
    mark(v.reason || (v.apply ? "accepted" : "unknown"));
    if (v.ok && v.apply) {
      const cur = state.tasks[t.id]; if (!cur || cur.remoteSrc === "user") return;
      const n = clone(cur); n.remote = v.verdict; n.remoteSrc = "ai"; n.remoteWhy = v.why; n.remoteAt = Date.now(); n.remoteSig = r.sig;
      applyChanges([{kind: "task", id: t.id, after: n}], null);
    }
  } catch(e) { if (!autoTransient(e)) mark("error"); throw e; }
}
// The one-tap question in the Suggestions tray
function remoteQuestions(){
  if (!autoFeatOn("remote")) return [];
  const today = todayISO(), wait = AUTO_ON && navigator.onLine !== false && autoFeatUse("remote").n < AUTO_FEATS.find(f => f.id === "remote").cap;
  return tasksArr().filter(t => MILESTONE(t.type) && t.status !== "done" && t.due && !t.prepFor && dayDiff(today, t.due) >= 0 && dayDiff(today, t.due) <= 21 && !remoteOf(t).v)
    .filter(t => { const r = remoteRule(t); return !(wait && REMOTEX.hasText(r.f) && (AUTO.rmt || {})[t.id] !== r.sig); })
    .sort((a, b) => a.due < b.due ? -1 : 1).slice(0, 1)
    .map(t => ({id: `rm:${t.id}:${remoteRule(t).sig}`, kind: "remote", tid: t.id, text: `Can you take “${t.title}” from home?`}));
}
// For tests: what Studyboard currently believes about each exam and quiz
window.__sbRemote = {of: id => { const t = state.tasks[id]; return t ? Object.assign({can: canDoNow(t)}, remoteOf(t)) : null; }, cands: () => remoteCands(9).map(t => t.id), questions: () => remoteQuestions().map(e => e.tid), auto: () => AUTO.rmt || {}, why: () => AUTO.rmtWhy || {}};

const AUTO_FEATS = [
  {id: "plan", name: "Smarter Today's Plan", ai: true, core: true, desc: "Chooses Do This Next, estimates hours for tasks that have none, and flags a couple of things you could easily miss.", ex: "Heads up: Bio lab pre-quiz is due Wed, a day before the report.", fb: "Today's Plan still ranks your tasks by deadline, grade weight and effort."},
  {id: "sessions", name: "Tune Study Sessions", ai: true, core: true, desc: "Tomorrow's exam-plan sessions get steps that target your weak flashcards, and practice sessions get a practice test.", ex: "20m: redo the 6 cards you missed on glycolysis.", fb: "Sessions keep the steps they were created with."},
  {id: "triage", name: "Fix Vague Tasks", ai: true, cap: 3, desc: "Offers a clearer title, type, hours or course for new tasks that are vague or missing details.", ex: "\u201chw3\u201d \u2192 \u201cHomework 3: Chapter 3 problems\u201d.", fb: "Nothing is offered."},
  {id: "news", name: "Important Announcements", ai: true, cap: 4, desc: "Flags exam, deadline, cancellation and room changes in your school announcements, and offers tasks or events to add when a date is stated.", ex: "Midterm moved to Fri Oct 17: add it to your calendar.", fb: "Plain keyword rules still flag the obvious changes."},
  {id: "coach", name: "Exam Study Plans", ai: false, desc: "For an exam in the next 14 days with no prep plan, offers Plan My Prep: review sessions spread across the days before, matched to your decks and notes. Nothing is made until you tap.", ex: "Midterm is in 9 days and has no prep plan. Plan My Prep."},
  {id: "weekly", name: "Weekly Review", ai: true, cap: 1, desc: "On Sunday or Monday, when there's something worth noting: what slipped, a heavy day ahead, an exam.", ex: "2 tasks slipped. Thursday has 3 deadlines, so do the Stats HW Tuesday.", fb: "A plain recap with the same numbers."},
  {id: "remote", name: "Exam Location Check", ai: true, cap: 6, desc: "Exams and quizzes are only suggested as Do This Next if they can be taken from home. Studyboard checks your school site first, then the instructions with AI, and asks you once if it still can't tell.", ex: "\u201cMidterm 2\u201d says \u201cheld in class\u201d, so it stays off Do This Next; \u201cQuiz 3\u201d is an online quiz in Canvas, so it can be suggested.", fb: "Plain rules plus a one-tap question: Can you take it from home?"},
  {id: "materials", name: "Study Material Tips", ai: false, desc: "When an exam is close and the course has files or notes but no flashcards, offers to make a deck. Nothing is made until you tap.", ex: "Midterm is in 3 days and Bio has 4 files but no flashcards."},
  {id: "nudge", name: "Crowded Days and Overdue Work", ai: false, desc: "Spots days with 3 or more deadlines, crunch weeks 2 to 6 weeks out, tasks stuck for 5 days and overdue work, and offers to move work to a lighter day.", ex: "Thursday has 3 deadlines (Bio lab, Stats HW, Essay draft)."},
  {id: "grades", name: "Grade Risk Alerts", ai: false, desc: "Warns when a course may miss its pass mark, from the marks you've entered.", ex: "Chemistry is at 52% so far; you'd need 68% on the rest to pass."}
];
const autoPlanOn = () => AUTO_ON && autoFeatOn("plan");
const autoFeatOn = id => !(((state.settings && state.settings.autoFeat) || {})[id] === false);
const autoFeatUse = id => { AUTO.feat = AUTO.feat || {}; const f = AUTO.feat[id] = AUTO.feat[id] || {}, d = todayISO(); if (f.day !== d) { f.day = d; f.n = 0; } return f; };
const TRIAGE_SCHEMA = {type: "OBJECT", properties: {items: {type: "ARRAY", items: {type: "OBJECT", properties: {
  ref: {type: "STRING"}, title: {type: "STRING", description: "A clearer title only if the given one is vague (keep any numbers); otherwise empty"},
  type: {type: "STRING", enum: TYPES}, priority: {type: "STRING", enum: ["low", "med", "high", "urgent"]}, hours: {type: "NUMBER", description: "Total hours the task takes a student, only if no estimate is given"},
  courseRef: {type: "STRING", description: "Course ref (c1...) only if the task has no course and one clearly fits, else empty"}, why: {type: "STRING", description: "Under 100 characters"}}, required: ["ref"]}}}, required: ["items"]};
const ANNINTEL_SCHEMA = {type: "OBJECT", properties: {items: {type: "ARRAY", items: {type: "OBJECT", properties: {
  ref: {type: "STRING"}, summary: {type: "STRING", description: "One plain sentence, under 150 characters"}, important: {type: "BOOLEAN", description: "True only for an exam or quiz date, a deadline change, a cancellation or a room or time change"},
  category: {type: "STRING", enum: ["exam", "deadline", "cancel", "room", "other"]},
  items: {type: "ARRAY", items: {type: "OBJECT", properties: {kind: {type: "STRING", enum: ["task", "event"]}, title: {type: "STRING"}, date: {type: "STRING", description: "YYYY-MM-DD"}, time: {type: "STRING", description: "HH:MM 24 hour, or empty"}, type: {type: "STRING", enum: TYPES}}, required: ["kind", "title", "date"]}, description: "Only things the announcement clearly states with a date, as a task to do or an event to attend. Empty if none."}}, required: ["ref", "summary"]}}}, required: ["items"]};
const COACH_SCHEMA = {type: "OBJECT", properties: {sessions: {type: "ARRAY", items: {type: "OBJECT", properties: {focus: {type: "STRING", description: "What this session covers, under 60 characters"}, steps: {type: "ARRAY", items: {type: "STRING"}, description: "2 to 4 concrete active study steps"}}, required: ["focus"]}}}, required: ["sessions"]};
const WEEKLY_SCHEMA = {type: "OBJECT", properties: {recap: {type: "STRING", description: "Two short sentences on last week, honest and kind"}, suggestion: {type: "STRING", description: "One concrete suggestion for the week ahead, under 140 characters"}}, required: ["recap", "suggestion"]};
const dayNameOf = d => parse(d).toLocaleDateString("en-US", {weekday: "long"});
const autoTransient = e => !!e && ["offline", "limit", "busy", "slow", "auto-off", "nokey", "preview", "key"].includes(e.code);

function insAdd(e){
  AUTO.ins = (AUTO.ins || []).filter(x => x.id !== e.id && Date.now() - x.at < 21 * 864e5).concat([Object.assign({at: Date.now()}, e)]).slice(-60);
}
async function autoTriage(){
  const today = todayISO(), cands = AINS.triageCandidates({tasks: tasksArr(), today, done: AUTO.tri || {}, max: 6});
  if (!cands.length) return;
  const back = {}, cback = {}, cs = coursesArr().slice(0, 30);
  cands.forEach((t, i) => { back["t" + (i + 1)] = t; });
  cs.forEach((c, i) => { cback["c" + (i + 1)] = c.id; });
  const mark = () => { AUTO.tri = AUTO.tri || {}; cands.forEach(t => { AUTO.tri[t.id] = AINS.triSig(t); }); const k = Object.keys(AUTO.tri); if (k.length > 300) k.slice(0, k.length - 300).forEach(x => delete AUTO.tri[x]); };
  try {
    const r = await aiCall({task: "triage", auto: true, fast: true, maxTokens: 2500, temperature: 0.1, schema: TRIAGE_SCHEMA, parts: [{text: `Today is ${dayNameOf(today)} ${today}.\nCourses:\n${cs.map((c, i) => `c${i + 1} | ${courseLabel(c)} | ${c.name}`).join("\n") || "none"}\nTasks:\n${cands.map((t, i) => `t${i + 1} | ${t.title} | type ${t.type} | priority ${t.priority} | ${t.courseId && courseOf(t.courseId) ? "course " + courseLabel(courseOf(t.courseId)) : "no course"} | ${t.due ? "due " + t.due : "no due date"} | ${isNum(t.hours) ? "estimate " + t.hours + "h" : "no estimate"}${t.weight ? " | worth " + t.weight + "%" : ""}${t.notes ? ` | notes: "${String(t.notes).replace(/\s+/g, " ").slice(0, 200)}"` : ""}`).join("\n")}`}],
      system: "You quietly tidy a student's new tasks. For each task: if the title is vague (like 'hw3' or 'reading'), write a clearer title that keeps its numbers and uses only facts given (course, notes); otherwise leave title empty. Pick the type (Assignment, Exam, Quiz, Reading, Project, Lab, Study, Other) from the title and notes. Suggest a priority only when the deadline, weight or wording clearly warrants it. Give total hours only when there's no estimate. Give courseRef only when the task has no course and one clearly fits. Never invent facts. Return JSON only."});
    const res = AINS.cleanTriage(r.data, back, cback, TYPES, Object.fromEntries(cs.map(c => [c.id, c.code + " " + c.name])));
    mark();
    res.forEach(x => insAdd({id: "tri:" + x.id, kind: "triage", tid: x.id, sig: x.sig, patch: x.patch, why: x.why}));
  } catch(e) { if (!autoTransient(e)) mark(); throw e; }
}
async function autoNews(){
  const today = todayISO(), items = window.SBANN ? window.SBANN.items() : [];
  const cands = AINS.annCandidates({items, seen: AUTO.ann || {}, today, max: 5});
  if (!cands.length) return;
  const back = {}; cands.forEach((n, i) => { back["a" + (i + 1)] = n; });
  AUTO.ann = AUTO.ann || {};
  const prune = () => { const k = Object.keys(AUTO.ann); if (k.length > 250) k.sort((a, b) => (AUTO.ann[a].at || 0) - (AUTO.ann[b].at || 0)).slice(0, k.length - 250).forEach(x => delete AUTO.ann[x]); };
  const flagAttn = (n, cat, sum) => insAdd({id: "attn:" + n.key, kind: "attn", key: n.key, cat, text: sum, title: n.title, course: n.course});
  try {
    const r = await aiCall({task: "annintel", auto: true, fast: true, maxTokens: 4000, temperature: 0.1, schema: ANNINTEL_SCHEMA, parts: [{text: `Today is ${dayNameOf(today)} ${today}.\n${cands.map((n, i) => `a${i + 1} | ${n.course} | posted ${String(n.date || "").slice(0, 10)} | ${n.title}\n${String(n.text || "").replace(/\s+/g, " ").slice(0, 900)}`).join("\n\n")}`}],
      system: "You read a student's class announcements and help them not miss anything. For each: write a one-sentence summary; set important true only if it announces or changes an exam or quiz date, a deadline, a cancellation, or a room or time change (category exam, deadline, cancel or room; otherwise other). List items only for things the announcement clearly states with a specific date: a task to do (an assignment due) or an event to attend (a make-up class, a review session, an exam). Work out dates from today's date when the text says things like 'next Friday'. Never guess a date that isn't stated. Return JSON only."});
    const res = AINS.cleanAnn(r.data, back, {today, tasks: tasksArr(), events: eventsArr(), types: TYPES, fmt: fmtDate});
    const got = new Set();
    res.forEach(x => {
      const n = cands.find(c => c.key === x.key); got.add(x.key);
      AUTO.ann[x.key] = {sum: x.sum, imp: x.imp, cat: x.cat, at: Date.now()};
      if (x.imp) flagAttn(n, x.cat, x.sum);
      x.props.forEach((p, i) => insAdd({id: `annp:${x.key}:${i}`, kind: "annp", key: x.key, prop: p, from: n.title, course: n.course}));
    });
    cands.filter(n => !got.has(n.key)).forEach(n => { AUTO.ann[n.key] = {sum: "", imp: false, cat: "other", at: Date.now()}; });
    prune();
  } catch(e) {
    if (!autoTransient(e)) cands.forEach(n => {
      const cat = AINS.annKeyword(n.title + ". " + n.text);
      AUTO.ann[n.key] = {sum: "", imp: !!cat, cat: cat || "other", at: Date.now(), fb: true};
      if (cat) flagAttn(n, cat, "");
    });
    prune(); throw e;
  }
}
const examSessionsOf = id => planSessions(id).length > 0;
const coachSig = t => [t.due, t.title].join("|");
// Exam Study Plans used to ask the AI to draft sessions here
async function autoWeekly(){
  const today = todayISO(), ws = AINS.reviewWeek(today);
  if (!ws || AUTO.wk === ws) return;
  const s = AINS.weeklyStats({tasks: allTasks(), today, weekStart: ws});
  if (!AINS.weeklyWorth(s)) { AUTO.wk = ws; return; }
  let out = null;
  try {
    const r = await aiCall({task: "weekly", auto: true, fast: true, maxTokens: 1200, temperature: 0.4, schema: WEEKLY_SCHEMA, parts: [{text: `Last week (${ws} to ${addDays(ws, 6)}): finished ${s.done}${s.doneTitles.length ? ": " + s.doneTitles.join("; ") : ""}. Slipped (due last week, still open): ${s.slipped.map(x => `${x.title} (due ${x.due})`).join("; ") || "none"}.\nNext week: ${s.next.map(d => `${dayNameOf(d.date)} ${d.count} due (${d.titles.join("; ")})`).join("; ") || "nothing due"}.${s.exams.length ? " Exams: " + s.exams.map(x => `${x.title} on ${dayNameOf(x.date)}`).join("; ") + "." : ""}`}],
      system: "You write a student's short weekly review inside their planner. Two honest, kind sentences on last week using only the numbers given (never any other number), then one concrete suggestion for the week ahead that names a specific task from the lists or a weekday, with the reason (for example 'Do the Stats HW on Tuesday: Thursday already has 3 deadlines'). Never general advice, never invent tasks. Return JSON only."});
    out = AINS.vetWeekly(r.data, s, dayNameOf);
  } catch(e) { if (autoTransient(e)) throw e; }
  AUTO.wk = ws;
  const fb = !out; if (!out) out = AINS.weeklyFallback(s, dayNameOf);
  insAdd({id: "wk:" + ws, kind: "weekly", recap: out.recap, suggestion: out.suggestion, fb});
}
// The next small background job, if any
function autoExtraJob(a){
  if (autoBudget(a.paid) < (a.paid ? 5 : 12)) return null;
  const today = todayISO(), ok = id => autoFeatOn(id) && autoFeatUse(id).n < AUTO_FEATS.find(f => f.id === id).cap;
  const wrap = (id, fn) => async () => { const u = autoFeatUse(id); u.n++; u.at = Date.now(); try { await fn(); u.err = ""; } catch(e) { if (!autoTransient(e)) u.err = (e && e.message) || "failed"; throw e; } };
  if (ok("remote") && remoteCands(1).length) return wrap("remote", autoRemote);
  if (ok("news") && window.SBANN && AINS.annCandidates({items: window.SBANN.items(), seen: AUTO.ann || {}, today, max: 1}).length) return wrap("news", autoNews);
  if (ok("triage") && AINS.triageCandidates({tasks: tasksArr(), today, done: AUTO.tri || {}, max: 1}).length) return wrap("triage", autoTriage);
  if (ok("weekly") && AINS.reviewWeek(today) && AUTO.wk !== AINS.reviewWeek(today)) return wrap("weekly", autoWeekly);
  return null;
}

// What shows in the Suggestions tray
let INS_MEMO = {k: "", list: []};
function autoLiveInsights(){
  const today = todayISO(), k = (state.updated || 0) + "|" + today + "|" + Math.floor(Date.now() / 36e5);
  if (INS_MEMO.k === k) return INS_MEMO.list;
  const list = [], stamp = id => { autoFeatUse(id).at = Date.now(); };
  try {
    const tasks = tasksArr().map(t => Object.assign({}, t, {_lms: !!lmsOf(t), _lateOk: !!lateUntilOf(t) || lateOf(t) === "free"}));
    if (autoFeatOn("nudge")) {
      stamp("nudge");
      AINS.overloadDays({tasks, today, horizon: 7, minCount: 3, hoursOf: t => bdHasKids(t) ? 0.25 : isNum(t.hours) ? Number(t.hours) : 0, capHours: Math.max(6, dailyHours() * 2)}).slice(0, 2).forEach(o => {
        list.push({id: `ov:${o.date}`, kind: "overload", text: `${dayNameOf(o.date)} has ${o.count} deadlines (${o.titles.slice(0, 3).join(", ")}${o.count > 3 ? ", …" : ""}).`,
          move: o.move, btn: o.move ? `${o.move.lms ? "Start" : "Move"} “${o.move.title.slice(0, 28)}” ${o.move.lms ? "on" : "to"} ${dayNameOf(o.move.to)}` : ""});
      });
      try { const cr = window.SBCRUNCH && SBCRUNCH.trayItem(); if (cr) list.push(cr); } catch(e) {}
      try { const bi = window.SBBREAK && SBBREAK.trayItem(); if (bi) list.push(bi); } catch(e) {}
      AINS.stalledTasks({tasks, today, nowMs: Date.now(), days: 5}).slice(0, 1).forEach(s => list.push({id: `st:${s.id}`, kind: "stalled", tid: s.id, act: "pomo-task", text: `“${s.title}” hasn't moved in ${s.idle} days and is ${s.dueIn < 0 ? "overdue" : s.dueIn === 0 ? "due today" : `due in ${s.dueIn} day${s.dueIn === 1 ? "" : "s"}`}.`, btn: "Start a Focus"}));
      AINS.overdueMoves({tasks, today, max: 2}).forEach(o => list.push({id: `od:${o.id}`, kind: "overdue", tid: o.id, to: o.to, text: `“${o.title}” is ${o.late} day${o.late === 1 ? "" : "s"} overdue.`, btn: `Move to ${dayNameOf(o.to)}`}));
    }
    if (autoFeatOn("materials")) {
      stamp("materials");
      const mat = cid => Object.values(state.files || {}).filter(f => f.courseId === cid && f.kind === "file" && (f.revs || []).length).length + Object.values(state.notes || {}).filter(n => n.courseId === cid && !n.archived && String(n.text || "").length > 40).length;
      AINS.materialSuggest({exams: tasks, today, materialOf: mat, hasDeck: cid => decksArr().some(d => d.courseId === cid && (d.cards || []).length >= 5), maxDays: 10}).slice(0, 1).forEach(m => {
        const ex = state.tasks[m.id], c = courseOf(m.cid);
        list.push({id: `mat:${m.id}`, kind: "material", tid: m.id, act: "fc-ai", text: `${ex.title} is ${m.days === 0 ? "today" : `in ${m.days} day${m.days === 1 ? "" : "s"}`} and ${c ? courseLabel(c) : "this course"} has ${m.n} file${m.n === 1 ? "" : "s"} or note${m.n === 1 ? "" : "s"} but no flashcards.`, btn: "Make Flashcards"});
      });
    }
    if (autoFeatOn("coach") && window.SBPREP) {
      stamp("coach");
      tasks.filter(t => t.type === "Exam" && t.status !== "done" && t.due && dayDiff(today, t.due) >= 1 && dayDiff(today, t.due) <= 14 && !planSessions(t.id).length).sort((a, b) => a.due < b.due ? -1 : 1).slice(0, 1).forEach(t => {
        const c = courseOf(t.courseId), n = dayDiff(today, t.due);
        list.push({id: `prep:${t.id}`, kind: "prep", tid: t.id, act: "exam-plan", text: `${t.title}${c ? " (" + courseLabel(c) + ")" : ""} is ${n === 1 ? "tomorrow" : "in " + n + " days"} and has no prep plan. Spread review sessions over the days before it, matched to your decks and notes.`, btn: "Plan My Prep"});
      });
    }
    if (autoFeatOn("grades")) {
      stamp("grades");
      AINS.gradeAlerts(coursesArr().map(c => { const g = courseRisk(c.id); return g && g.marked && g.marked.length && g.current != null ? {cid: c.id, name: courseLabel(c), risk: g.risk, current: g.current, pass: g.g.pass, need: g.need ? g.need(g.g.pass) : null} : null; }).filter(Boolean)).slice(0, 2)
        .forEach(g => list.push({id: "gr:" + g.id, kind: "grade", text: g.text}));
    }
  } catch(e) { console.warn("Automatic AI insights:", e); }
  INS_MEMO = {k, list};
  return list;
}
function autoStoredInsights(){
  const out = [], today = todayISO();
  (AUTO.ins || []).forEach(e => {
    if (e.kind === "triage") { const t = state.tasks[e.tid]; if (!t || t.status === "done" || AINS.triSig(t) !== e.sig || !autoFeatOn("triage")) return; out.push(e); }
    else if (e.kind === "annp") { if (!autoFeatOn("news") || dayDiff(today, e.prop.date) < -1) return; out.push(e); }
    else if (e.kind === "attn") { if (!autoFeatOn("news")) return; const n = window.SBANN && window.SBANN.items().find(x => x.key === e.key); if (!n || (n.date && Date.now() - Date.parse(n.date) > 14 * 864e5)) return; out.push(e); }
    else if (e.kind === "coach") { const t = state.tasks[e.eid]; if (!t || t.status === "done" || examSessionsOf(t.id) || !autoFeatOn("coach") || coachSig(t) !== e.sig) return; const s = e.sessions.filter(x => x.date >= today); if (s.length < 2) return; out.push(Object.assign({}, e, {sessions: s})); }
    else if (e.kind === "weekly") { if (!autoFeatOn("weekly") || Date.now() - e.at > 3 * 864e5) return; out.push(e); }
  });
  return out;
}
function insightsAll(){
  const dis = AUTO.dis || {}, order = {attn: 0, remote: 1, annp: 1, coach: 2, weekly: 3, triage: 6};
  const cap = {triage: 2, coach: 1, annp: 2, attn: 2, crunch: 1, remote: 1, breakdown: 1}, used = {};
  let rq = []; try { rq = remoteQuestions(); } catch(e) { console.warn(e); }
  return (AUTO_ON ? autoStoredInsights().concat(autoLiveInsights()) : []).concat(rq).filter(e => !dis[e.id] && !insSnoozed(e.kind)).sort((a, b) => (order[a.kind] ?? 4) - (order[b.kind] ?? 4))
    .filter(e => cap[e.kind] == null || (used[e.kind] = (used[e.kind] || 0) + 1) <= cap[e.kind]).slice(0, 6);
}
function insText(e){
  const c = e.kind;
  if (c === "triage") { const t = state.tasks[e.tid], p = e.patch, bits = []; if (p.title) bits.push(`rename to “${p.title}”`); if (p.type) bits.push(`type ${p.type}`); if (p.priority) bits.push(`${PRIO[p.priority]} priority`); if (p.hours) bits.push(`about ${p.hours}h`); if (p.courseId && courseOf(p.courseId)) bits.push(`course ${courseLabel(courseOf(p.courseId))}`); return {h: `Tidy up “${t.title}”`, t: bits.join(", "), btn: "Apply"}; }
  if (c === "annp") { const p = e.prop; return {h: `${p.kind === "event" ? "Add event" : "Add task"}: ${p.title}`, t: `${fmtDate(p.date)}${p.time ? " at " + fmtTime(p.time) : ""}, from the announcement “${e.from}”.`, btn: p.kind === "event" ? "Add Event" : "Add Task"}; }
  if (c === "attn") return {h: e.title, t: `${e.course ? e.course + ". " : ""}${e.text || ({exam: "Mentions an exam change.", deadline: "Mentions a deadline change.", cancel: "Mentions a cancellation.", room: "Mentions a room change."})[e.cat] || ""}`, btn: "Open Announcements"};
  if (c === "coach") { const ex = state.tasks[e.eid], tot = e.sessions.reduce((s, x) => s + x.hours, 0); return {h: `Study plan for ${ex.title} (${fmtShort(ex.due)})`, t: `${e.sessions.length} sessions, ${fmtHM(tot)} in total, placed in your free time.`, btn: "Plan My Prep", more: `<details class="ins-more"><summary>See the Plan</summary><ol>${e.sessions.map(s => `<li><b>${esc(fmtShort(s.date))}</b>, ${esc(fmtHM(s.hours))}: ${esc(s.focus)}</li>`).join("")}</ol></details>`}; }
  if (c === "weekly") return {h: "Your week in review", t: `${e.recap} ${e.suggestion}`, btn: ""};
  return {h: "", t: e.text, btn: e.btn};
}
const INS_AI = {attn: 1, annp: 1, coach: 1, triage: 1, weekly: 1};
const INS_LABEL = {breakdown: "Big assignment", attn: "Needs attention", crunch: "Crunch ahead", overload: "Crowded day", stalled: "Stalled", overdue: "Overdue", material: "Study tip", grade: "Grade check", triage: "Tidy up", annp: "From announcement", coach: "Exam plan", prep: "Exam plan", weekly: "Weekly review", remote: "Where is it taken?"};
function insightsHtml(){
  let list; try { list = insightsAll(); } catch(e) { console.warn(e); return ""; }
  if (!list.length) return "";
  const more = !!ui.insMore, shown = more ? list : list.slice(0, 3);
  return `<div class="auto-ins" role="region" aria-label="Automatic AI suggestions"><div class="ai-top"><span class="ph-label">Suggestions</span><button class="link-btn" data-act="auto-panel" style="margin-left:auto">Manage</button></div>
    <ul>${shown.map(e => { const x = insText(e); return `<li data-kind="${esc(e.kind)}"><div class="ins-body"><span class="ins-k">${esc(INS_LABEL[e.kind] || "")}${INS_AI[e.kind] && !e.fb ? " · AI draft" : ""}</span>${x.h ? `<b>${esc(x.h)}</b> ` : ""}<span>${esc(x.t)}</span>${x.more || ""}</div><div class="ins-acts">${e.kind === "remote" ? `<button class="btn small" data-act="rmt-set" data-id="${esc(e.tid)}" data-v="yes">Yes, From Home</button><button class="btn small" data-act="rmt-set" data-id="${esc(e.tid)}" data-v="no">No, In Person</button>` : x.btn ? (e.act ? `<button class="btn small" data-act="${esc(e.act)}" data-id="${esc(e.tid || "")}">${esc(x.btn)}</button>` : `<button class="btn small" data-act="ins-do" data-id="${esc(e.id)}">${esc(x.btn)}</button>`) : ""}<button class="icon-btn sm ph-x" data-act="ins-x" data-id="${esc(e.id)}" aria-label="Dismiss">${CLOSE}</button></div></li>`; }).join("")}</ul>
    ${list.length > 3 ? `<button class="link-btn" data-act="ins-more">${more ? "Show Fewer" : `Show ${list.length - 3} More`}</button>` : ""}</div>`;
}
// Which Automatic AI feature each kind of suggestion belongs to
const INS_FEAT = {breakdown: "nudge", remote: "remote", triage: "triage", annp: "news", attn: "news", coach: "coach", prep: "coach", weekly: "weekly", material: "materials", crunch: "nudge", overload: "nudge", stalled: "nudge", overdue: "nudge", grade: "grades"};
const insSnoozed = kind => !!((AUTO.snz || {})[kind] > Date.now());
function autoFeatSet(id, on){
  const m = Object.assign({}, (state.settings && state.settings.autoFeat) || {}); if (on) delete m[id]; else m[id] = false;
  state.settings = Object.assign({}, state.settings, {autoFeat: m}); saveSettings();
  if (on) Object.keys(INS_FEAT).filter(k => INS_FEAT[k] === id).forEach(k => { if (AUTO.snz) delete AUTO.snz[k]; if (AUTO.dc) delete AUTO.dc[k]; });
  autoSave(); INS_MEMO.k = ""; scheduleRender(); autoKick(1500);
}
// Dismissing: remembered (never re-shown), undoable
function insReject(e){
  const wasDc = ((AUTO.dc || {})[e.kind] || []).slice(), wasDis = (AUTO.dis || {})[e.id];
  insDismiss(e.id);
  AUTO.dc = AUTO.dc || {}; const now = Date.now(), a = (AUTO.dc[e.kind] || []).filter(t => now - t < 7 * 864e5).concat([now]);
  let paused = false; AUTO.dc[e.kind] = a;
  if (a.length >= 3) { AUTO.snz = AUTO.snz || {}; AUTO.snz[e.kind] = now + 7 * 864e5; AUTO.dc[e.kind] = []; paused = true; }
  autoSave();
  const f = AUTO_FEATS.find(x => x.id === INS_FEAT[e.kind]), label = INS_LABEL[e.kind] || "these";
  toast(paused ? `Hiding "${label}" suggestions for a week` : "Dismissed", () => {
    if (wasDis) AUTO.dis[e.id] = wasDis; else delete (AUTO.dis || {})[e.id];
    AUTO.dc[e.kind] = wasDc; if (paused && AUTO.snz) delete AUTO.snz[e.kind];
    autoSave(); INS_MEMO.k = ""; scheduleRender();
  }, f ? {label: `Turn off ${f.name}`.slice(0, 34), fn: () => autoFeatSet(f.id, false)} : null);
}
function insDismiss(id){ AUTO.dis = AUTO.dis || {}; AUTO.dis[id] = Date.now(); Object.keys(AUTO.dis).forEach(k => { if (Date.now() - AUTO.dis[k] > 45 * 864e5) delete AUTO.dis[k]; }); autoSave(); }
function insDo(e){
  if (AUTO.dc) delete AUTO.dc[e.kind];
  if (e.kind === "triage") {
    const t = state.tasks[e.tid]; if (!t) return;
    const n = Object.assign(clone(t), e.patch);
    applyChanges([{kind: "task", id: t.id, after: n}], `Updated “${n.title}”`); insDismiss(e.id);
  } else if (e.kind === "annp") {
    const p = e.prop;
    if (p.kind === "event") { const ev = normEvent({id: uid(), title: p.title, courseId: p.cid || "", date: p.date, start: p.time || "", allDay: !p.time, notes: `From the announcement “${e.from}”.`}); applyChanges([{kind: "event", id: ev.id, after: ev}], `Added event: ${p.title}`); }
    else { const t = newTask({title: p.title, type: p.type, courseId: p.cid || "", due: p.date, time: p.time || "", notes: `From the announcement “${e.from}”.`}); applyChanges([{kind: "task", id: t.id, after: t}], `Added: ${p.title}`); }
    insDismiss(e.id);
  } else if (e.kind === "attn") { insDismiss(e.id); const b = document.querySelector(".ann-btn"); if (b) b.click(); }
  else if (e.kind === "coach") { insDismiss(e.id); if (window.SBPREP) SBPREP.open(e.eid); }
  else if (e.kind === "prep") { insDismiss(e.id); if (window.SBPREP) SBPREP.open(e.tid); }
  else if (e.kind === "overload" || e.kind === "overdue") {
    const mv = e.kind === "overload" ? e.move : {id: e.tid, to: e.to}, t = mv && state.tasks[mv.id]; if (!t) return;
    const n = clone(t);
    if (e.kind === "overload" && mv.lms) n.start = mv.to; else { n.due = mv.to; if (n.start && n.start > n.due) n.start = n.due; }
    applyChanges([{kind: "task", id: t.id, after: n}], mv.lms ? `“${t.title}” now starts ${fmtShort(mv.to)}` : `Moved “${t.title}” to ${fmtShort(mv.to)}`); insDismiss(e.id);
  }
}
hook("act", (act, el) => {
  switch (act) {
    case "ins-do": { const e = insightsAll().find(x => x.id === el.dataset.id); if (e) insDo(e); return true; }
    case "ins-x": { const e = insightsAll().find(x => x.id === el.dataset.id); if (e) insReject(e); else insDismiss(el.dataset.id); INS_MEMO.k = ""; scheduleRender(); return true; }
    case "ins-more": ui.insMore = !ui.insMore; render(); return true;
    case "rmt-set": { const id = el.dataset.id, t = state.tasks[id], v = el.dataset.v; if (!t || (v !== "yes" && v !== "no")) return true; if (AUTO.dc) delete AUTO.dc.remote; const inv = remoteSet(id, v, null); toast(v === "yes" ? `“${t.title}” can be done from home` : `“${t.title}” is taken in person`, () => { applyChanges(inv, null); toast("Undone"); }); return true; }
    case "auto-panel": autoPanelSheet(); return true;
  }
  return false;
});
const agoText = ms => { const m = Math.round((Date.now() - ms) / 60000); return m < 1 ? "just now" : m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} d ago`; };
function autoPanelSheet(){
  const a = autoState(), lim = a.paid ? 12 : 40; autoBudget(a.paid); const used = AUTO.n || 0;
  const row = f => { const u = (AUTO.feat || {})[f.id] || {}, on = autoFeatOn(f.id);
    const snz = Object.keys(INS_FEAT).filter(k => INS_FEAT[k] === f.id && insSnoozed(k)).map(k => AUTO.snz[k]).sort()[0];
    const last = snz ? `Paused until ${fmtShort(iso(new Date(snz)))} because you dismissed several. Turn it off and on to resume.` : f.core ? (u.at || (f.id === "plan" && AUTO.planAt) ? `Last ran ${agoText(u.at || AUTO.planAt)}` : "Runs when your tasks change") : f.ai ? (u.at ? `Last ran ${agoText(u.at)}${u.day === todayISO() ? `, ${u.n || 0} of ${f.cap} runs today` : ""}${u.err ? `. Last problem: ${u.err}` : ""}` : "Hasn't run yet") : (u.at ? `Last checked ${agoText(u.at)}, uses no AI requests` : "Checks live, uses no AI requests");
    return `<div class="ap-row"><label class="mi-check"><input type="checkbox" data-feat="${f.id}" ${on ? "checked" : ""}> <b>${esc(f.name)}</b> <span class="auto-badge">${f.ai ? "Uses AI" : "No AI"}</span></label><p class="mini" style="margin:2px 0 0 26px">${esc(f.desc)}</p><p class="mini" style="margin:2px 0 0 26px"><i>Example: ${esc(f.ex)}</i>${f.fb ? ` Without AI: ${esc(f.fb)}` : ""}</p><p class="mini ap-last" style="margin:2px 0 0 26px">${esc(on ? last : "Turned off")}</p></div>`; };
  openSheet(`<form class="sheet">${head("What Automatic AI Is Doing")}
    <div class="sheet-body">
      <p class="mini" style="margin:0">${a.on ? `Automatic AI is on${a.paid ? " (paid model)" : " (free)"}. ${used} of ${lim} automatic requests used today. Suggestions appear in Today's Plan only when they cite your own tasks and dates. Nothing changes without a tap, and everything can be undone. Dismiss three of one kind to pause it for a week.` : a.reason === "confirm" ? "Automatic AI is paused until you confirm paid use." : "Automatic AI is off, so none of these run."} <button type="button" class="link-btn" data-act="ai-setup">AI Settings</button></p>
      ${AUTO_FEATS.map(row).join("")}
    </div><div class="sheet-foot"><span class="spacer"></span><button type="button" class="btn primary" data-act="close">Done</button></div></form>`);
  $$("[data-feat]", dlg).forEach(i => i.addEventListener("change", () => {
    autoFeatSet(i.dataset.feat, i.checked);
    const p = i.closest(".ap-row").querySelector(".ap-last"); if (p) p.textContent = i.checked ? "Turned on" : "Turned off";
  }));
  if (!dlg.open) dlg.showModal();
}

// Stickers: original drawings, 64 by 64
const SO = 'stroke="#2B2233" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"';
const SOw = w => `stroke="#2B2233" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
const EYES = (a, b, y, r = 2.8) => `<circle cx="${a}" cy="${y}" r="${r}" fill="#2B2233"/><circle cx="${b}" cy="${y}" r="${r}" fill="#2B2233"/><circle cx="${a + 0.9}" cy="${y - 1}" r=".9" fill="#fff"/><circle cx="${b + 0.9}" cy="${y - 1}" r=".9" fill="#fff"/>`;
const BLUSH = (a, b, y) => `<ellipse cx="${a}" cy="${y}" rx="3.6" ry="2.4" fill="#FF8FA8" opacity=".75"/><ellipse cx="${b}" cy="${y}" rx="3.6" ry="2.4" fill="#FF8FA8" opacity=".75"/>`;
const SMILE = (x, y, w = 4) => `<path d="M${x - w} ${y}q${w} ${w * .8} ${w * 2} 0" fill="none" stroke="#2B2233" stroke-width="2.2" stroke-linecap="round"/>`;
const TXT = (t, y, sz, c = "#fff") => `<text x="32" y="${y}" text-anchor="middle" font-family="Lexend,Arial Rounded MT Bold,Arial,sans-serif" font-weight="800" font-size="${sz}" fill="${c}">${t}</text>`;
const GR = (id, a, b, x2 = 0, y2 = 1) => `<defs><linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>`;
const SHINE = (x, y, rx = 5, ry = 3, rot = -30) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#fff" opacity=".55" transform="rotate(${rot} ${x} ${y})"/>`;
const TAG = (t, c, sz = 15) => `<rect x="3" y="18" width="58" height="28" rx="8" fill="${c}"/>${TXT(t, 37, sz)}`;
const STICKER_PACKS = [
  {id: "basics", name: "Basics", tier: "free", items: {
    dot: `<circle cx="32" cy="32" r="22" fill="#3B82F6"/>`,
    fstar: `<path d="M32 6l7.6 16.4 17.9 2.1-13.2 12.2 3.5 17.7L32 45.6 16.2 54.4l3.5-17.7L6.5 24.5l17.9-2.1z" fill="#F5B301"/>`,
    fheart: `<path d="M32 55S7 40 7 23a12.5 12.5 0 0 1 25-4 12.5 12.5 0 0 1 25 4c0 17-25 32-25 32z" fill="#EF4444"/>`,
    fcheck: `<circle cx="32" cy="32" r="24" fill="#22A06B"/><path d="M20 33l8 8 16-17" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`,
    fx: `<circle cx="32" cy="32" r="24" fill="#6B7280"/><path d="M23 23l18 18M41 23L23 41" stroke="#fff" stroke-width="6" stroke-linecap="round"/>`,
    farrow: `<path d="M8 26h30V14l20 18-20 18V38H8z" fill="#8B5CF6"/>`,
    ftri: `<path d="M32 8l26 46H6z" fill="#F97316"/>`,
    fsquare: `<rect x="10" y="10" width="44" height="44" rx="8" fill="#14B8A6"/>`,
    fbang: `<circle cx="32" cy="32" r="24" fill="#F59E0B"/><rect x="28.5" y="16" width="7" height="22" rx="3.5" fill="#fff"/><circle cx="32" cy="46" r="4" fill="#fff"/>`,
    fq: `<circle cx="32" cy="32" r="24" fill="#0EA5E9"/>${TXT("?", 43, 30)}`
  }},
  {id: "labels", name: "Labels", tier: "free", items: {
    ldue: TAG("DUE", "#EF4444"), ltodo: TAG("TO DO", "#3B82F6", 13), ldone: TAG("DONE", "#22A06B", 14), ltest: TAG("TEST", "#8B5CF6", 14),
    lread: TAG("READ", "#0EA5E9", 14), lask: TAG("ASK", "#F59E0B"), lnew: TAG("NEW", "#EC4899"), limp: TAG("!!!", "#DC2626", 18)
  }},
  {id: "study", name: "Study Buddies", tier: "free", items: {
    aplus: `${GR("gap", "#FF7A7A", "#E53935")}<circle cx="32" cy="32" r="27" fill="url(#gap)" ${SO}/><circle cx="32" cy="32" r="21" fill="none" stroke="#fff" stroke-width="2" stroke-dasharray="3 3"/>${TXT("A+", 41, 23)}`,
    check: `${GR("gck", "#5FE39B", "#1FA35E")}<circle cx="32" cy="32" r="26" fill="url(#gck)" ${SO}/><path d="M19 33l9 9 18-19" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`,
    hundred: `<rect x="4" y="15" width="56" height="34" rx="9" fill="#FF5C8A" ${SO}/>${TXT("100", 41, 22)}<path d="M10 55h44" stroke="#FF5C8A" stroke-width="4" stroke-linecap="round"/><path d="M14 60h36" stroke="#FF5C8A" stroke-width="3" stroke-linecap="round"/>`,
    pencil: `<g transform="rotate(40 32 32)"><rect x="24" y="2" width="16" height="42" rx="2" fill="#FFC53D" ${SO}/><rect x="24" y="2" width="16" height="9" rx="2" fill="#FF8FA8" ${SO}/><path d="M24 44l8 17 8-17z" fill="#F5D7A8" ${SO}/><path d="M29.4 55.5l2.6 5.5 2.6-5.5z" fill="#2B2233"/></g>`,
    book: `<path d="M6 14q13-5 26 2v40q-13-7-26-2z" fill="#4A8CFF" ${SO}/><path d="M58 14q-13-5-26 2v40q13-7 26-2z" fill="#7EB2FF" ${SO}/><path d="M12 24q7-2 14 1M12 31q7-2 14 1M38 25q7-3 14-1M38 32q7-3 14-1" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/>`,
    coffee: `<path d="M44 29h5a7 7 0 0 1 0 14h-5" fill="none" ${SO}/><path d="M11 24h33v18a12 12 0 0 1-12 12h-9a12 12 0 0 1-12-12z" fill="#fff" ${SO}/><path d="M14 27h27v5H14z" fill="#8A5A2B"/><path d="M21 8q-3 5 0 10M29 6q-3 6 0 12M37 8q-3 5 0 10" fill="none" stroke="#B9A9A0" stroke-width="2.5" stroke-linecap="round"/>${EYES(22, 33, 40, 2.1)}${SMILE(27.5, 45, 2.5)}`,
    bulb: `<path d="M32 5a18 18 0 0 0-10 33v8h20v-8A18 18 0 0 0 32 5z" fill="#FFE066" ${SO}/><rect x="22" y="46" width="20" height="11" rx="3" fill="#A9B4C2" ${SO}/><path d="M26 29l6 7 6-7" fill="none" stroke="#FF9F1C" stroke-width="2.5" stroke-linecap="round"/><path d="M8 12l4 3M56 12l-4 3M4 26h5M60 26h-5" stroke="#FFB443" stroke-width="3" stroke-linecap="round"/>${SHINE(24, 16, 4, 2.5)}`,
    trophy: `<path d="M19 12H9q0 13 13 15M45 12h10q0 13-13 15" fill="none" ${SO}/>${GR("gtr", "#FFE27A", "#F5A300")}<path d="M18 7h28v15a14 14 0 0 1-28 0z" fill="url(#gtr)" ${SO}/><rect x="28" y="36" width="8" height="10" fill="#FFC53D" ${SO}/><rect x="17" y="46" width="30" height="11" rx="2" fill="#8A5A2B" ${SO}/><path d="M32 12l2 4 4.5.6-3.3 3 .8 4.4L32 22l-4 2 .8-4.4-3.3-3 4.5-.6z" fill="#fff"/>`,
    flask: `<path d="M28 6v17L12 50a6 6 0 0 0 5 8h30a6 6 0 0 0 5-8L36 23V6z" fill="#fff"/><path d="M16.2 43H47.8L52 50a6 6 0 0 1-5 8H17a6 6 0 0 1-5-8z" fill="#8B6CFF"/><circle cx="27" cy="36" r="3" fill="#8B6CFF" opacity=".6"/><circle cx="36" cy="30" r="2" fill="#8B6CFF" opacity=".5"/><path d="M28 6v17L12 50a6 6 0 0 0 5 8h30a6 6 0 0 0 5-8L36 23V6z" fill="none" ${SO}/><path d="M24 6h16" ${SO}/>`,
    brain: `<path d="M32 12c-4-6-14-5-16 2-7 0-10 8-6 13-5 4-3 12 3 13 0 7 8 10 13 6 2 3 4 4 6 4s4-1 6-4c5 4 13 1 13-6 6-1 8-9 3-13 4-5 1-13-6-13-2-7-12-8-16-2z" fill="#FFA8C5" ${SO}/><path d="M32 13v35M22 24q5 2 4 8M42 24q-5 2-4 8M20 40q5-2 8 2M44 40q-5-2-8 2" fill="none" stroke="#2B2233" stroke-width="2" stroke-linecap="round"/>`
  }},
  {id: "animals", name: "Animal Friends", tier: "free", items: {
    cat: `<path d="M13 24L14 6l15 11M51 24L50 6 35 17" fill="#FFB36B" ${SO}/><circle cx="32" cy="37" r="21" fill="#FFB36B" ${SO}/><path d="M17 11l1 9M47 11l-1 9" stroke="#FF8FA8" stroke-width="3" stroke-linecap="round"/>${EYES(25, 39, 35)}<path d="M30 41h4l-2 2.6z" fill="#FF6F91"/><path d="M29 45q3 2 6 0M8 40l10 1M8 46l10-2M56 40l-10 1M56 46l-10-2" fill="none" stroke="#2B2233" stroke-width="1.6" stroke-linecap="round"/>`,
    dog: `<ellipse cx="13" cy="30" rx="7.5" ry="15" fill="#8A5A3B" ${SO} transform="rotate(12 13 30)"/><ellipse cx="51" cy="30" rx="7.5" ry="15" fill="#8A5A3B" ${SO} transform="rotate(-12 51 30)"/><circle cx="32" cy="34" r="21" fill="#E3AE7C" ${SO}/><ellipse cx="32" cy="43" rx="10" ry="8" fill="#F8E2C8"/>${EYES(25, 39, 32)}<ellipse cx="32" cy="40" rx="4.5" ry="3.2" fill="#2B2233"/><path d="M32 43v3M29 48q3 2 6 0" fill="none" stroke="#2B2233" stroke-width="1.8" stroke-linecap="round"/>`,
    fox: `<path d="M7 8l17 14h16l17-14-3 27a22 22 0 0 1-44 0z" fill="#FF8A3D" ${SO}/><path d="M12 39q20 24 40 0q-5 17-20 17T12 39z" fill="#fff" ${SO}/><path d="M14 16l6 5M50 16l-6 5" stroke="#2B2233" stroke-width="3" stroke-linecap="round"/>${EYES(24, 40, 34)}<ellipse cx="32" cy="45" rx="3.2" ry="2.4" fill="#2B2233"/>`,
    panda: `<circle cx="14" cy="16" r="8.5" fill="#2B2233"/><circle cx="50" cy="16" r="8.5" fill="#2B2233"/><circle cx="32" cy="35" r="22" fill="#fff" ${SO}/><ellipse cx="23" cy="33" rx="6" ry="8" fill="#2B2233" transform="rotate(25 23 33)"/><ellipse cx="41" cy="33" rx="6" ry="8" fill="#2B2233" transform="rotate(-25 41 33)"/><circle cx="24" cy="32" r="2" fill="#fff"/><circle cx="40" cy="32" r="2" fill="#fff"/><ellipse cx="32" cy="42" rx="3.5" ry="2.5" fill="#2B2233"/>${SMILE(32, 46, 3)}${BLUSH(18, 46, 44)}`,
    frog: `<circle cx="19" cy="19" r="10" fill="#6BCB77" ${SO}/><circle cx="45" cy="19" r="10" fill="#6BCB77" ${SO}/><ellipse cx="32" cy="39" rx="26" ry="19" fill="#6BCB77" ${SO}/><circle cx="19" cy="18" r="5.5" fill="#fff"/><circle cx="45" cy="18" r="5.5" fill="#fff"/><circle cx="20" cy="19" r="3" fill="#2B2233"/><circle cx="46" cy="19" r="3" fill="#2B2233"/><path d="M20 42q12 10 24 0" fill="none" stroke="#2B2233" stroke-width="2.5" stroke-linecap="round"/>${BLUSH(15, 49, 40)}`,
    bear: `<circle cx="14" cy="16" r="9" fill="#B07A45" ${SO}/><circle cx="50" cy="16" r="9" fill="#B07A45" ${SO}/><circle cx="14" cy="16" r="4" fill="#E8B888"/><circle cx="50" cy="16" r="4" fill="#E8B888"/><circle cx="32" cy="35" r="22" fill="#B07A45" ${SO}/><ellipse cx="32" cy="43" rx="10" ry="8" fill="#E8B888"/>${EYES(24, 40, 32)}<ellipse cx="32" cy="40" rx="4" ry="3" fill="#2B2233"/>${SMILE(32, 45, 3)}`,
    bunny: `<ellipse cx="23" cy="16" rx="6.5" ry="15" fill="#fff" ${SO}/><ellipse cx="41" cy="16" rx="6.5" ry="15" fill="#fff" ${SO}/><ellipse cx="23" cy="16" rx="2.8" ry="10" fill="#FFB3C7"/><ellipse cx="41" cy="16" rx="2.8" ry="10" fill="#FFB3C7"/><circle cx="32" cy="40" r="19" fill="#fff" ${SO}/>${EYES(25, 39, 38)}<path d="M30 44h4l-2 2.4z" fill="#FF6F91"/>${BLUSH(20, 44, 45)}`,
    owl: `<path d="M12 16l6 6M52 16l-6 6" stroke="#2B2233" stroke-width="3" stroke-linecap="round"/><path d="M12 22q20-14 40 0v22a20 20 0 0 1-40 0z" fill="#9C6ADE" ${SO}/><circle cx="23" cy="29" r="8" fill="#fff" ${SO}/><circle cx="41" cy="29" r="8" fill="#fff" ${SO}/><circle cx="24" cy="30" r="3.5" fill="#2B2233"/><circle cx="40" cy="30" r="3.5" fill="#2B2233"/><path d="M29 37l3 5 3-5z" fill="#FFB443" ${SOw(1.8)}/><path d="M22 48q4 3 8 0M34 48q4 3 8 0" fill="none" stroke="#C8A8F0" stroke-width="2.2" stroke-linecap="round"/>`,
    penguin: `<ellipse cx="32" cy="35" rx="21" ry="25" fill="#2B3A55" ${SO}/><ellipse cx="32" cy="39" rx="14" ry="18" fill="#fff"/>${EYES(26, 38, 29)}<path d="M28 34l4 5 4-5z" fill="#FFB443" ${SOw(1.8)}/><ellipse cx="24" cy="60" rx="5" ry="2.5" fill="#FFB443" ${SOw(1.8)}/><ellipse cx="40" cy="60" rx="5" ry="2.5" fill="#FFB443" ${SOw(1.8)}/>${BLUSH(21, 43, 36)}`,
    chick: `<path d="M30 12q2-6 6-4M34 12q4-5 7-2" fill="none" stroke="#2B2233" stroke-width="2.4" stroke-linecap="round"/><circle cx="32" cy="36" r="22" fill="#FFE066" ${SO}/><path d="M12 38q-6 4-2 10M52 38q6 4 2 10" fill="none" stroke="#2B2233" stroke-width="2.4" stroke-linecap="round"/>${EYES(25, 39, 32)}<path d="M28 38l4 5 4-5z" fill="#FF9F1C" ${SOw(1.8)}/>${BLUSH(19, 45, 40)}`
  }},
  {id: "faces", name: "Kawaii Faces", tier: "free", items: {
    love: `${GR("gf1", "#FFE56B", "#FFBE1A")}<circle cx="32" cy="32" r="26" fill="url(#gf1)" ${SO}/><path d="M22 30s-7-4-7-9a3.5 3.5 0 0 1 7-1 3.5 3.5 0 0 1 7 1c0 5-7 9-7 9zM42 30s-7-4-7-9a3.5 3.5 0 0 1 7-1 3.5 3.5 0 0 1 7 1c0 5-7 9-7 9z" fill="#FF3D6E"/><path d="M22 40q10 10 20 0" fill="#fff" ${SOw(2.4)}/>`,
    lol: `${GR("gf2", "#FFE56B", "#FFBE1A")}<circle cx="32" cy="32" r="26" fill="url(#gf2)" ${SO}/><path d="M18 26q4-4 8 0M38 26q4-4 8 0" fill="none" stroke="#2B2233" stroke-width="2.6" stroke-linecap="round"/><path d="M18 36h28q-2 14-14 14T18 36z" fill="#fff" ${SOw(2.4)}/><path d="M12 30q-6 6-2 12 6-2 4-10zM52 30q6 6 2 12-6-2-4-10z" fill="#6FD3FF" ${SOw(1.6)}/>`,
    wow: `${GR("gf3", "#FFE56B", "#FFBE1A")}<circle cx="32" cy="32" r="26" fill="url(#gf3)" ${SO}/>${EYES(23, 41, 26, 3.6)}<ellipse cx="32" cy="42" rx="6" ry="8" fill="#7A2E2E" ${SOw(2.2)}/><path d="M18 18l6-3M46 18l-6-3" stroke="#2B2233" stroke-width="2.4" stroke-linecap="round"/>`,
    sleepy: `${GR("gf4", "#E0D8FF", "#A99BF0")}<circle cx="30" cy="34" r="24" fill="url(#gf4)" ${SO}/><path d="M18 34q4 3 8 0M34 34q4 3 8 0" fill="none" stroke="#2B2233" stroke-width="2.4" stroke-linecap="round"/><ellipse cx="30" cy="44" rx="3" ry="2" fill="#2B2233"/>${TXT("Z", 18, 14, "#6B5AE0").replace('x="32"', 'x="52"')}${TXT("z", 8, 10, "#6B5AE0").replace('x="32"', 'x="58"')}`,
    cool: `${GR("gf5", "#FFE56B", "#FFBE1A")}<circle cx="32" cy="32" r="26" fill="url(#gf5)" ${SO}/><path d="M10 24h44l-2 8c-2 6-12 6-14 0l-2-4h-8l-2 4c-2 6-12 6-14 0z" fill="#2B2233"/><path d="M16 26l6 4M40 26l6 4" stroke="#fff" stroke-width="2" opacity=".6"/><path d="M24 42q8 6 16 0" fill="none" stroke="#2B2233" stroke-width="2.6" stroke-linecap="round"/>`,
    grumpy: `${GR("gf6", "#FF8A7A", "#E84A3A")}<circle cx="32" cy="32" r="26" fill="url(#gf6)" ${SO}/><path d="M16 20l10 5M48 20l-10 5" stroke="#2B2233" stroke-width="3" stroke-linecap="round"/>${EYES(23, 41, 30, 2.6)}<path d="M22 46q10-8 20 0" fill="none" stroke="#2B2233" stroke-width="2.6" stroke-linecap="round"/><path d="M52 12l4-4M56 16l6-2M48 8l2-6" stroke="#FF5C5C" stroke-width="2.4" stroke-linecap="round"/>`,
    party: `<path d="M20 4l14 18H10z" fill="#8B6CFF" ${SO} transform="rotate(-18 22 14)"/><circle cx="16" cy="4" r="3" fill="#FFE066" ${SOw(1.6)}/>${GR("gf7", "#FFE56B", "#FFBE1A")}<circle cx="34" cy="36" r="24" fill="url(#gf7)" ${SO}/><path d="M24 32q3-3 6 0M38 32q3-3 6 0" fill="none" stroke="#2B2233" stroke-width="2.4" stroke-linecap="round"/><path d="M26 42q8 8 16 0z" fill="#fff" ${SOw(2.2)}/><path d="M50 10l2 4M58 16l-4 2M56 6l-2 4" stroke="#FF5C8A" stroke-width="2.6" stroke-linecap="round"/>`,
    think: `${GR("gf8", "#FFE56B", "#FFBE1A")}<circle cx="32" cy="30" r="25" fill="url(#gf8)" ${SO}/><circle cx="23" cy="26" r="2.8" fill="#2B2233"/><circle cx="41" cy="24" r="2.8" fill="#2B2233"/><path d="M36 17l8-2" stroke="#2B2233" stroke-width="2.4" stroke-linecap="round"/><path d="M26 40h12" stroke="#2B2233" stroke-width="2.6" stroke-linecap="round"/><path d="M18 58c0-6 4-8 8-8h8a4 4 0 0 1 0 8z" fill="#FFD23F" ${SOw(2.2)}/>`
  }},
  {id: "shapes", name: "Cute Shapes", tier: "pro", items: {
    star: `${GR("gstar", "#FFE56B", "#FFB800")}<path d="M32 5l7.6 16.4 17.9 2.1-13.2 12.2 3.5 17.7L32 44.6 16.2 53.4l3.5-17.7L6.5 23.5l17.9-2.1z" fill="url(#gstar)" ${SO}/>${EYES(27, 37, 30, 2.3)}${SMILE(32, 36, 3)}${SHINE(22, 22, 4, 2)}`,
    heart: `${GR("gheart", "#FF8FB0", "#F0316A")}<path d="M32 55S7 40 7 23a12.5 12.5 0 0 1 25-4 12.5 12.5 0 0 1 25 4c0 17-25 32-25 32z" fill="url(#gheart)" ${SO}/>${SHINE(18, 20, 5, 3)}`,
    sparkle: `<path d="M30 6c2 14 6 21 20 25-14 4-18 11-20 27-2-16-6-23-20-27 14-4 18-11 20-25z" fill="#FFE066" ${SO}/><path d="M51 5c.7 4 2 6 6 7-4 1-5.3 3-6 7-.7-4-2-6-6-7 4-1 5.3-3 6-7z" fill="#9BE7FF" ${SOw(2)}/>`,
    smile: `${GR("gsmile", "#FFE56B", "#FFBE1A")}<circle cx="32" cy="32" r="25" fill="url(#gsmile)" ${SO}/>${EYES(24, 40, 27, 3.2)}<path d="M21 37q11 11 22 0" fill="none" stroke="#2B2233" stroke-width="3" stroke-linecap="round"/>${BLUSH(17, 47, 36)}${SHINE(20, 17, 5, 3)}`,
    rainbow: `<path d="M8 46a24 24 0 0 1 48 0" fill="none" stroke="#FF5C5C" stroke-width="6"/><path d="M14 46a18 18 0 0 1 36 0" fill="none" stroke="#FFB443" stroke-width="6"/><path d="M20 46a12 12 0 0 1 24 0" fill="none" stroke="#4CC38A" stroke-width="6"/><path d="M26 46a6 6 0 0 1 12 0" fill="none" stroke="#4A8CFF" stroke-width="5"/><path d="M2 50a7 7 0 0 1 9-8 7 7 0 0 1 12 4 5 5 0 0 1-1 9H6a5 5 0 0 1-4-5z" fill="#fff" ${SO}/><path d="M41 50a7 7 0 0 1 9-8 7 7 0 0 1 12 4 5 5 0 0 1-1 9H45a5 5 0 0 1-4-5z" fill="#fff" ${SO}/>`,
    bolt: `${GR("gbolt", "#FFE56B", "#FFA800")}<path d="M37 3L11 37h17l-6 24 27-35H32z" fill="url(#gbolt)" ${SO}/>`,
    moon: `<path d="M40 7a25 25 0 1 0 17 39A21 21 0 0 1 40 7z" fill="#FFE8A3" ${SO}/><path d="M24 34q3 3 6 0M35 38q2.5 2.5 5 0" fill="none" stroke="#2B2233" stroke-width="2.2" stroke-linecap="round"/>${BLUSH(22, 41, 40)}`,
    sun: `<g stroke="#FF9F1C" stroke-width="4.5" stroke-linecap="round"><path d="M32 3v8M32 53v8M3 32h8M53 32h8M11 11l6 6M47 47l6 6M11 53l6-6M47 17l6-6"/></g><circle cx="32" cy="32" r="15" fill="#FFD23F" ${SO}/>${EYES(27, 37, 30, 2.2)}${SMILE(32, 35, 3)}`,
    cloud: `<path d="M16 50h32a12 12 0 0 0 1-24 16 16 0 0 0-30-4 13 13 0 0 0-3 28z" fill="#fff" ${SO}/>${EYES(27, 39, 37, 2.2)}${BLUSH(23, 44, 42)}`,
    flower: `<g fill="#FF9EC7" ${SO}><circle cx="32" cy="15" r="10"/><circle cx="48" cy="27" r="10"/><circle cx="42" cy="46" r="10"/><circle cx="22" cy="46" r="10"/><circle cx="16" cy="27" r="10"/></g><circle cx="32" cy="32" r="9" fill="#FFD23F" ${SO}/>`
  }},
  {id: "food", name: "Snack Time", tier: "pro", items: {
    pizza: `<path d="M7 13q25-10 50 0L32 59z" fill="#FFD66B" ${SO}/><path d="M7 13q25-10 50 0l-3 7q-22-8-44 0z" fill="#E09A4F" ${SO}/><circle cx="26" cy="27" r="4.5" fill="#E8453C"/><circle cx="38" cy="31" r="4" fill="#E8453C"/><circle cx="31" cy="42" r="3.5" fill="#E8453C"/>`,
    donut: `<circle cx="32" cy="32" r="25" fill="#E0A366" ${SO}/><path d="M9 29a23 21 0 0 1 46 0c0 4-3 3-5 6s-4 1-6 4-5 0-7 2-6-1-8-2-5 1-7-2-6-2-8-4-3-2-3-4z" fill="#FF8FC6"/><circle cx="32" cy="31" r="7.5" fill="var(--nc,#FFE680)" ${SO}/><g stroke-width="2.6" stroke-linecap="round"><path d="M18 22l3-2" stroke="#fff"/><path d="M42 20l3 2" stroke="#6FD3FF"/><path d="M47 30l1 3" stroke="#FFE066"/><path d="M16 32l-1 3" stroke="#6FD3FF"/><path d="M30 18h3" stroke="#FFE066"/></g>`,
    avocado: `<path d="M32 4c10 0 14 12 16 22 3 14-4 33-16 33S13 40 16 26C18 16 22 4 32 4z" fill="#5E9E35" ${SO}/><path d="M32 12c7 0 10 9 11 16 2 11-3 24-11 24s-13-13-11-24c1-7 4-16 11-16z" fill="#DFF0A3"/><circle cx="32" cy="38" r="8" fill="#8A5A2B" ${SO}/>${EYES(27, 37, 24, 2)}${SMILE(32, 28, 2.5)}`,
    strawberry: `<path d="M32 59C15 50 9 36 11 26c2-8 11-10 21-6 10-4 19-2 21 6 2 10-4 24-21 33z" fill="#FF4F5E" ${SO}/><path d="M21 18l11-10 11 10-11 4z" fill="#4CC38A" ${SO}/><g fill="#FFE8A3"><circle cx="22" cy="32" r="1.4"/><circle cx="32" cy="30" r="1.4"/><circle cx="42" cy="32" r="1.4"/><circle cx="26" cy="42" r="1.4"/><circle cx="38" cy="42" r="1.4"/><circle cx="32" cy="50" r="1.4"/></g>`,
    icecream: `<path d="M19 31h26L32 61z" fill="#F2B56B" ${SO}/><path d="M24 36l12 12M34 34l-10 12" stroke="#C98A3E" stroke-width="1.8"/><circle cx="24" cy="26" r="10" fill="#8EE4C4" ${SO}/><circle cx="40" cy="26" r="10" fill="#FFB3D1" ${SO}/><circle cx="32" cy="16" r="10" fill="#FFF3C4" ${SO}/><circle cx="32" cy="5.5" r="4" fill="#E8453C" ${SOw(2)}/>`,
    boba: `<path d="M38 2l-4 20" stroke="#2B2233" stroke-width="5" stroke-linecap="round"/><path d="M38 2l-4 20" stroke="#FF8FC6" stroke-width="3" stroke-linecap="round"/><path d="M14 20h36l-4 36a4 4 0 0 1-4 3H22a4 4 0 0 1-4-3z" fill="#F4DEC4" ${SO}/><path d="M13 20h38" ${SO}/><g fill="#3B2A20"><circle cx="24" cy="50" r="3"/><circle cx="32" cy="52" r="3"/><circle cx="40" cy="50" r="3"/><circle cx="28" cy="45" r="3"/><circle cx="36" cy="45" r="3"/></g>${EYES(26, 38, 32, 2)}${SMILE(32, 36, 2.5)}`,
    cookie: `<circle cx="32" cy="32" r="25" fill="#E3B06C" ${SO}/><g fill="#5A3A22"><circle cx="22" cy="22" r="3.5"/><circle cx="40" cy="20" r="3"/><circle cx="44" cy="36" r="3.5"/><circle cx="28" cy="44" r="3"/><circle cx="20" cy="36" r="2.5"/><circle cx="34" cy="31" r="2.5"/></g>`,
    taco: `<path d="M6 46a26 26 0 0 1 52 0z" fill="#FFD66B" ${SO}/><path d="M12 40q4-8 8-4 4-8 8-3 4-8 8-2 4-7 8-2 4-5 8 2" fill="none" stroke="#4CC38A" stroke-width="4" stroke-linecap="round"/><circle cx="22" cy="40" r="3" fill="#E8453C"/><circle cx="38" cy="38" r="3" fill="#E8453C"/>`
  }},
  {id: "space", name: "Outer Space", tier: "pro", items: {
    planet: `<ellipse cx="32" cy="34" rx="29" ry="9" fill="none" stroke="#FFD23F" stroke-width="4.5" transform="rotate(-18 32 34)"/>${GR("gpl", "#C39BFF", "#7B4CDB")}<circle cx="32" cy="32" r="16" fill="url(#gpl)" ${SO}/><path d="M20 26q12-4 24 2M18 36q14 4 28-2" fill="none" stroke="#E2D2FF" stroke-width="2.4" stroke-linecap="round"/><path d="M5 43a29 9 -18 0 0 55-19" fill="none" stroke="#FFD23F" stroke-width="4.5" stroke-linecap="round"/>`,
    rocket: `<path d="M32 3c11 9 15 22 12 37H20C17 25 21 12 32 3z" fill="#fff" ${SO}/><circle cx="32" cy="22" r="6" fill="#6FD3FF" ${SO}/><path d="M20 32l-9 10 2 8 8-6M44 32l9 10-2 8-8-6" fill="#FF5C5C" ${SO}/><path d="M24 44q8 20 16 0z" fill="#FFB443" ${SO}/><path d="M28 44q4 11 8 0z" fill="#FFE066"/>`,
    ufo: `<path d="M20 30a12 12 0 0 1 24 0z" fill="#9BE7FF" ${SO}/><ellipse cx="32" cy="36" rx="27" ry="9" fill="#A9B4C2" ${SO}/><g fill="#FFE066" ${SOw(1.8)}><circle cx="16" cy="37" r="2.6"/><circle cx="32" cy="40" r="2.6"/><circle cx="48" cy="37" r="2.6"/></g><path d="M24 46l-6 14h28l-6-14" fill="#FFF3A8" opacity=".6"/>`,
    alien: `<path d="M22 12l-6-8M42 12l6-8" stroke="#2B2233" stroke-width="2.5" stroke-linecap="round"/><circle cx="16" cy="4" r="3" fill="#FF8FC6"/><circle cx="48" cy="4" r="3" fill="#FF8FC6"/><path d="M32 10c14 0 22 10 22 22 0 14-12 28-22 28S10 46 10 32c0-12 8-22 22-22z" fill="#7FE08A" ${SO}/><ellipse cx="23" cy="32" rx="6" ry="8" fill="#2B2233" transform="rotate(-20 23 32)"/><ellipse cx="41" cy="32" rx="6" ry="8" fill="#2B2233" transform="rotate(20 41 32)"/><circle cx="24" cy="29" r="2" fill="#fff"/><circle cx="42" cy="29" r="2" fill="#fff"/>${SMILE(32, 47, 4)}`,
    comet: `<path d="M8 56L38 26M4 46l26-20M18 60l22-26" stroke="#9BE7FF" stroke-width="4" stroke-linecap="round" opacity=".8"/><path d="M44 8l4.5 9.7 10.5 1.3-7.8 7.2 2 10.4L44 31.4l-9.2 5.2 2-10.4-7.8-7.2 10.5-1.3z" fill="#FFD23F" ${SO}/>`,
    astro: `<circle cx="32" cy="30" r="23" fill="#fff" ${SO}/><rect x="16" y="20" width="32" height="20" rx="10" fill="#2B3A55" ${SO}/><path d="M22 26q4-3 8-1" stroke="#9BE7FF" stroke-width="2.5" fill="none" stroke-linecap="round"/><path d="M18 50h28l3 10H15z" fill="#fff" ${SO}/><circle cx="32" cy="55" r="2.5" fill="#FF5C5C"/>`
  }},
  {id: "ocean", name: "Ocean Life", tier: "pro", items: {
    fish: `${GR("gfish", "#7FDBFF", "#2E7BFF")}<path d="M8 32q14-17 33-9l13-10v38L41 41q-19 8-33-9z" fill="url(#gfish)" ${SO}/><path d="M26 22q4 10 0 20" fill="none" stroke="#fff" stroke-width="2" opacity=".7"/><circle cx="18" cy="29" r="3" fill="#2B2233"/><circle cx="19" cy="28" r="1" fill="#fff"/><path d="M13 36q3 2 6 0" fill="none" stroke="#2B2233" stroke-width="2" stroke-linecap="round"/><circle cx="52" cy="10" r="3" fill="none" stroke="#7FDBFF" stroke-width="2"/><circle cx="58" cy="4" r="2" fill="none" stroke="#7FDBFF" stroke-width="2"/>`,
    whale: `${GR("gwh", "#6AA8FF", "#3160D8")}<path d="M5 37q2-19 27-19 21 0 27 15 2 6-2 10-6 8-25 8-23 0-27-14z" fill="url(#gwh)" ${SO}/><path d="M11 42q10 8 30 6 12-1 16-7" fill="#CFE3FF"/><path d="M8 29q-6-10-2-15 5 2 6 8 2-9 9-9 0 9-7 15z" fill="#4E86F0" ${SO}/><path d="M36 14q-2-6 2-9M36 14q4-5 8-4" fill="none" stroke="#7FDBFF" stroke-width="2.4" stroke-linecap="round"/><circle cx="44" cy="31" r="2.6" fill="#2B2233"/>${BLUSH(49, 49, 37).split("/>")[0]}/>`,
    octopus: `${GR("goc", "#FFA7D0", "#E0529C")}<path d="M12 44c-4 6-6 12 0 14 4 1 5-5 8-8M22 46c-2 7 0 13 5 12s2-7 3-10M34 46c1 7 5 12 9 10s0-7-2-10M44 44c5 5 10 9 13 6s-4-8-7-10" fill="none" stroke="#2B2233" stroke-width="7" stroke-linecap="round"/><path d="M12 44c-4 6-6 12 0 14 4 1 5-5 8-8M22 46c-2 7 0 13 5 12s2-7 3-10M34 46c1 7 5 12 9 10s0-7-2-10M44 44c5 5 10 9 13 6s-4-8-7-10" fill="none" stroke="#F06AAE" stroke-width="4" stroke-linecap="round"/><path d="M10 38C10 18 20 6 32 6s22 12 22 32c0 7-10 10-22 10S10 45 10 38z" fill="url(#goc)" ${SO}/>${EYES(25, 39, 30)}${SMILE(32, 37, 3)}${SHINE(22, 16, 5, 3)}`,
    crab: `<path d="M12 30l-6-12 8 2M52 30l6-12-8 2" fill="none" ${SO}/><circle cx="8" cy="15" r="6" fill="#FF6B4A" ${SO}/><circle cx="56" cy="15" r="6" fill="#FF6B4A" ${SO}/><path d="M14 46l-8 6M16 50l-6 8M50 46l8 6M48 50l6 8" ${SO}/><path d="M24 22v-8M40 22v-8" ${SO}/><circle cx="24" cy="12" r="4" fill="#fff" ${SO}/><circle cx="40" cy="12" r="4" fill="#fff" ${SO}/><circle cx="24" cy="12" r="1.8" fill="#2B2233"/><circle cx="40" cy="12" r="1.8" fill="#2B2233"/>${GR("gcr", "#FF8A6A", "#E84A2A")}<ellipse cx="32" cy="36" rx="21" ry="15" fill="url(#gcr)" ${SO}/>${SMILE(32, 38, 5)}${BLUSH(20, 44, 38)}`,
    shell: `${GR("gsh", "#FFD1E3", "#FF8FB8")}<path d="M32 8C14 8 4 26 8 44l8 8h32l8-8C60 26 50 8 32 8z" fill="url(#gsh)" ${SO}/><path d="M32 10v42M20 14l-6 36M44 14l6 36M26 10l-4 42M38 10l4 42" stroke="#E0629A" stroke-width="2" fill="none"/><rect x="24" y="50" width="16" height="8" rx="3" fill="#FFB3CE" ${SO}/>`,
    jelly: `${GR("gje", "#D9B8FF", "#9B6BFF")}<path d="M18 40c0 6-4 10-2 16M26 42c0 6 3 10 0 16M38 42c0 6-3 10 0 16M46 40c0 6 4 10 2 16" fill="none" stroke="#B58CFF" stroke-width="3" stroke-linecap="round"/><path d="M8 38C8 20 18 8 32 8s24 12 24 30c-4 4-8 0-12 4-4-4-8 0-12 0s-8-4-12 0c-4-4-8 0-12-4z" fill="url(#gje)" ${SO}/>${EYES(25, 39, 28)}${SMILE(32, 34, 3)}${SHINE(20, 18, 6, 3)}`,
    turtle: `<ellipse cx="12" cy="42" rx="6" ry="5" fill="#8FD6A0" ${SO}/><ellipse cx="52" cy="42" rx="6" ry="5" fill="#8FD6A0" ${SO}/><circle cx="54" cy="26" r="9" fill="#8FD6A0" ${SO}/><circle cx="56" cy="24" r="2" fill="#2B2233"/>${GR("gtu", "#6CCB7E", "#2F8F4A")}<path d="M6 38a24 22 0 0 1 44 0z" fill="url(#gtu)" ${SO}/><path d="M28 17l8 8-8 8-8-8zM14 30l6-5M42 30l-6-5" fill="none" stroke="#1E6B33" stroke-width="2.2"/><path d="M4 38h48" ${SO}/>`,
    starfish: `${GR("gsf", "#FFB36B", "#FF7A2E")}<path d="M32 4c3 0 5 12 8 17 5 2 19 2 20 6s-10 10-14 14c0 6 5 18 2 20s-12-7-16-9c-4 2-13 11-16 9s2-14 2-20C14 37 4 31 4 27s15-4 20-6c3-5 5-17 8-17z" fill="url(#gsf)" ${SO}/>${EYES(27, 37, 30, 2.3)}${SMILE(32, 36, 3)}<g fill="#FFE0C0"><circle cx="32" cy="14" r="1.5"/><circle cx="50" cy="27" r="1.5"/><circle cx="14" cy="27" r="1.5"/><circle cx="22" cy="48" r="1.5"/><circle cx="42" cy="48" r="1.5"/></g>`
  }},
  {id: "garden", name: "Garden", tier: "pro", items: {
    cactus: `<path d="M16 44h32l-4 16H20z" fill="#E8805A" ${SO}/><rect x="13" y="40" width="38" height="7" rx="2" fill="#F39A74" ${SO}/>${GR("gca", "#7FD88A", "#3E9E55")}<path d="M24 40V14a8 8 0 0 1 16 0v26z" fill="url(#gca)" ${SO}/><path d="M24 30h-6a4 4 0 0 1-4-4v-6a3 3 0 0 1 6 0v4h4M40 26h6a4 4 0 0 0 4-4v-4a3 3 0 0 0-6 0v2h-4" fill="#5CBF6E" ${SO}/>${EYES(29, 35, 22, 1.8)}${SMILE(32, 26, 2)}<circle cx="32" cy="5" r="3.5" fill="#FF7FB0" ${SOw(1.8)}/>`,
    sunflower: `<path d="M32 40v22" stroke="#3E9E55" stroke-width="5" stroke-linecap="round"/><path d="M32 52q-10-2-12-10 9 0 12 8" fill="#5CBF6E" ${SOw(2)}/><g fill="#FFC53D" ${SOw(2)}>${[0, 45, 90, 135, 180, 225, 270, 315].map(a => `<ellipse cx="32" cy="10" rx="6" ry="10" transform="rotate(${a} 32 24)"/>`).join("")}</g><circle cx="32" cy="24" r="10" fill="#7A4A26" ${SO}/>${EYES(28.5, 35.5, 23, 1.8)}${SMILE(32, 27, 2)}`,
    tulip: `<path d="M32 36v24" stroke="#3E9E55" stroke-width="4.5" stroke-linecap="round"/><path d="M32 52c-10 0-16-8-16-16 8 2 14 8 16 14M32 50c10 0 16-8 16-16-8 2-14 8-16 14" fill="#6CCB7E" ${SOw(2)}/>${GR("gtl", "#FF8FB8", "#E83A7A")}<path d="M18 12l7 8 7-12 7 12 7-8v14a14 14 0 0 1-28 0z" fill="url(#gtl)" ${SO}/>`,
    mushroom: `<path d="M22 34h20l2 20a4 4 0 0 1-4 4H24a4 4 0 0 1-4-4z" fill="#FFF3E0" ${SO}/>${GR("gmu", "#FF6B5A", "#D8322A")}<path d="M4 34C4 18 17 6 32 6s28 12 28 28z" fill="url(#gmu)" ${SO}/><g fill="#fff"><circle cx="20" cy="20" r="5"/><circle cx="38" cy="14" r="4"/><circle cx="46" cy="26" r="4.5"/><circle cx="28" cy="28" r="3"/></g>${EYES(28, 36, 44, 1.8)}${BLUSH(25, 39, 48)}`,
    leaf: `${GR("glf", "#9BE38A", "#3C9E4A", 1, 1)}<path d="M8 56C8 24 26 8 58 6c-2 32-18 50-50 50z" fill="url(#glf)" ${SO}/><path d="M10 54L50 14M22 42l-2-12M30 34l-2-12M38 26l-2-10M22 42l12 2M30 34l12 2M38 26l10 2" stroke="#2F7A3A" stroke-width="2" fill="none" stroke-linecap="round"/>`,
    succulent: `<path d="M14 44h36l-5 16H19z" fill="#9BB8D9" ${SO}/><g fill="#8ED6B0" ${SOw(2)}><path d="M32 44c-10-4-20-2-24-8 8-4 18-2 24 8z"/><path d="M32 44c10-4 20-2 24-8-8-4-18-2-24 8z"/><path d="M32 44c-8-8-12-18-8-28 6 6 8 16 8 28z"/><path d="M32 44c8-8 12-18 8-28-6 6-8 16-8 28z"/></g><path d="M32 44c-3-10-3-20 0-30 3 10 3 20 0 30z" fill="#B8EDD0" ${SOw(2)}/>`,
    bee: `<path d="M22 22c-8-12-18-6-12 2 3 4 8 3 12-2zM42 22c8-12 18-6 12 2-3 4-8 3-12-2z" fill="#E6F6FF" ${SOw(2)}/>${GR("gbe", "#FFE066", "#FFB800")}<ellipse cx="32" cy="36" rx="20" ry="17" fill="url(#gbe)" ${SO}/><path d="M24 20v32M36 19v34" stroke="#2B2233" stroke-width="5"/>${EYES(20, 44, 32, 2.2).replace(/cx="20"/g, 'cx="17"')}${BLUSH(15, 49, 40)}`,
    blossom: `<g fill="#FFC1D9" ${SOw(2)}>${[0, 72, 144, 216, 288].map(a => `<path d="M32 30c-6-6-8-16-2-22 2 2 2 4 2 4s0-2 2-4c6 6 4 16-2 22z" transform="rotate(${a} 32 32)"/>`).join("")}</g><circle cx="32" cy="32" r="6" fill="#FF7FB0" ${SOw(2)}/><g fill="#FFE066"><circle cx="32" cy="24" r="1.6"/><circle cx="39" cy="30" r="1.6"/><circle cx="36" cy="38" r="1.6"/><circle cx="28" cy="38" r="1.6"/><circle cx="25" cy="30" r="1.6"/></g>`
  }},
  {id: "dinos", name: "Dino Pals", tier: "pro", items: {
    trex: `${GR("gtx", "#8EE08A", "#3FA84E")}<path d="M10 58l4-14c-6-4-8-12-2-16l10-6c0-10 6-18 18-18 10 0 16 6 16 12 0 5-4 8-10 8h-6l2 6-8 4 4 16-6 8h-6l2-8-6-4-2 12z" fill="url(#gtx)" ${SO}/><circle cx="44" cy="14" r="2.6" fill="#2B2233"/><path d="M48 22l2 3 2-3M42 22l2 3 2-3" fill="#fff" stroke="#2B2233" stroke-width="1.4"/><path d="M30 32l-4 4" ${SO}/><path d="M18 30l4 4M16 38l4 2" stroke="#2F7A3A" stroke-width="2.4" stroke-linecap="round"/>`,
    stego: `<g fill="#FF9F6B" ${SOw(2)}><path d="M16 30l4-10 5 10zM24 26l5-12 6 12zM34 26l6-12 5 12zM44 30l5-10 4 10z"/></g>${GR("gst", "#7FC8FF", "#3E86E0")}<path d="M4 44c0-10 12-18 26-18s24 6 28 14c2 4-2 6-6 6h-4v10h-7V46H23v10h-7V46h-2c-4 0-10 2-10-2z" fill="url(#gst)" ${SO}/><circle cx="52" cy="38" r="2.4" fill="#2B2233"/>${BLUSH(48, 48, 43).split("/>")[0]}/>`,
    longneck: `${GR("gln", "#C9A0FF", "#8A5AE0")}<path d="M44 6c6 0 10 4 10 8s-4 5-8 4l-4 22c6 2 12 8 12 14v4h-7v-6h-4v6h-7v-5H22v5h-7v-6h-4v6H4v-4c0-8 10-14 22-14h8l4-26c0-6 2-8 6-8z" fill="url(#gln)" ${SO}/><circle cx="48" cy="11" r="2.2" fill="#2B2233"/><g fill="#E6D2FF"><circle cx="22" cy="46" r="2.5"/><circle cx="30" cy="44" r="2"/><circle cx="16" cy="50" r="1.8"/></g>`,
    egg: `<path d="M32 4c12 0 22 18 22 34s-10 22-22 22-22-6-22-22S20 4 32 4z" fill="#F3F0E4" ${SO}/><path d="M10 36l8-6 6 6 8-8 8 8 6-6 8 6" fill="none" ${SO}/><g fill="#8ED6B0"><circle cx="24" cy="16" r="3"/><circle cx="40" cy="20" r="4"/><circle cx="30" cy="48" r="3.5"/><circle cx="44" cy="46" r="2.5"/></g>${EYES(26, 38, 40, 2)}${SMILE(32, 45, 2.5)}`,
    ptero: `${GR("gpt", "#FFB87A", "#F07A2A")}<path d="M32 26L4 16c4 10 10 18 20 20zM32 26l28-10c-4 10-10 18-20 20z" fill="url(#gpt)" ${SO}/><path d="M24 36c0-8 4-14 8-14s8 6 8 14-4 12-8 12-8-4-8-12z" fill="#FF9F55" ${SO}/><path d="M32 22l-4-12 10 8z" fill="#FF9F55" ${SO}/><circle cx="30" cy="28" r="1.8" fill="#2B2233"/><circle cx="35" cy="28" r="1.8" fill="#2B2233"/>`,
    volcano: `<path d="M24 10q-4-6 2-8M32 8q0-6 6-6M40 10q4-6 8-2" fill="none" stroke="#B9A9A0" stroke-width="2.6" stroke-linecap="round"/>${GR("gvo", "#A87A5A", "#6B4632")}<path d="M4 58L22 20h20l18 38z" fill="url(#gvo)" ${SO}/><path d="M22 20h20l-4 8-4-4-4 8-4-6-4 4z" fill="#FF6B3A" ${SOw(2)}/><path d="M24 20q8-8 16 0" fill="#FFB443" ${SOw(2)}/>`,
    bone: `<g transform="rotate(-35 32 32)"><g fill="#2B2233" stroke="#2B2233" stroke-width="5" stroke-linejoin="round"><rect x="15" y="26.5" width="34" height="11" rx="4"/><circle cx="13" cy="25.5" r="7"/><circle cx="13" cy="38.5" r="7"/><circle cx="51" cy="25.5" r="7"/><circle cx="51" cy="38.5" r="7"/></g><g fill="#FFF7E6"><rect x="15" y="26.5" width="34" height="11" rx="4"/><circle cx="13" cy="25.5" r="7"/><circle cx="13" cy="38.5" r="7"/><circle cx="51" cy="25.5" r="7"/><circle cx="51" cy="38.5" r="7"/></g><path d="M18 35.5h28" stroke="#E8D8B8" stroke-width="2.4" stroke-linecap="round"/><path d="M10 22.5a4 4 0 0 1 4-2M48 22.5a4 4 0 0 1 4-2" fill="none" stroke="#FFFFFF" stroke-width="1.8" stroke-linecap="round"/></g>`,
    footprint: `${GR("gfp", "#8EE08A", "#3FA84E")}<path d="M32 60c-12 0-18-8-16-18 2-8 8-12 16-12s14 4 16 12c2 10-4 18-16 18z" fill="url(#gfp)" ${SO}/><path d="M14 26c-4-6-2-14 4-14 4 4 4 10 0 16zM32 22c-4-6-3-16 2-18 5 4 4 12-2 18zM50 26c4-6 2-14-4-14-4 4-4 10 0 16z" fill="#6CCB7E" ${SO}/>`
  }},
  {id: "fantasy", name: "Fantasy", tier: "pro", items: {
    unicorn: `<path d="M34 16l6-14 2 16z" fill="#FFE066" ${SO}/><path d="M36 8l4 2M35 12l5 2" stroke="#FFB800" stroke-width="1.6"/>${GR("gun", "#FF9ED0", "#9B7BFF", 1, 0)}<path d="M14 20c-8 6-8 18-2 26 4-8 2-16 6-22zM18 16c-10 0-12 12-10 18 6-6 8-12 14-14z" fill="url(#gun)" ${SOw(2)}/><path d="M20 18c6-6 18-6 24 2 6 8 10 18 8 26-2 6-8 8-14 6-4 6-12 6-16 2-6-6-8-18-2-36z" fill="#fff" ${SO}/><circle cx="40" cy="32" r="2.6" fill="#2B2233"/><ellipse cx="46" cy="46" rx="2" ry="1.4" fill="#2B2233"/>${BLUSH(38, 38, 40).split("/>")[0]}/>`,
    dragon: `${GR("gdr", "#7FE0A0", "#2F9E6A")}<path d="M16 10l6 10M48 10l-6 10" ${SO}/><path d="M12 14l4 8 6-4zM52 14l-4 8-6-4z" fill="#FFB443" ${SOw(2)}/><path d="M10 34c0-12 10-18 22-18s22 6 22 18c0 10-8 20-22 20S10 44 10 34z" fill="url(#gdr)" ${SO}/><ellipse cx="32" cy="44" rx="12" ry="7" fill="#C8F2D6"/><circle cx="29" cy="42" r="1.6" fill="#2B2233"/><circle cx="35" cy="42" r="1.6" fill="#2B2233"/>${EYES(22, 42, 30, 3)}<path d="M44 54q8 2 10-4" fill="none" stroke="#FF6B3A" stroke-width="3" stroke-linecap="round"/>`,
    crystal: `${GR("gcy", "#B8F3FF", "#7B8CFF", 1, 1)}<path d="M20 22l12-18 12 18-12 38z" fill="url(#gcy)" ${SO}/><path d="M20 22h24M32 4v56M26 22l6 38 6-38" fill="none" stroke="#fff" stroke-width="1.6" opacity=".8"/><path d="M8 34l6-10 6 10-6 20zM44 34l6-10 6 10-6 20z" fill="#D8C8FF" ${SOw(2)}/>`,
    castle: `${GR("gcs", "#E6E0FF", "#B9A8F0")}<path d="M8 60V26h10v6h6v-6h16v6h6v-6h10v34z" fill="url(#gcs)" ${SO}/><path d="M8 26V16h4v4h2v-4h4v10M46 26V16h4v4h2v-4h4v10" fill="#CFC4FF" ${SOw(2)}/><path d="M26 60V46a6 6 0 0 1 12 0v14z" fill="#8A5A2B" ${SO}/><path d="M13 16V6l8 4-8 3M51 16V6l8 4-8 3" fill="#FF7FB0" ${SOw(2)}/><circle cx="32" cy="34" r="4" fill="#FFE066" ${SOw(2)}/>`,
    wand: `<path d="M10 56L40 26" stroke="#2B2233" stroke-width="7" stroke-linecap="round"/><path d="M10 56L40 26" stroke="#8A5AE0" stroke-width="4" stroke-linecap="round"/>${GR("gwa", "#FFF08A", "#FFB800")}<path d="M44 6l4 9 10 1-7.5 6.8 2 9.7L44 27.6l-8.5 4.9 2-9.7L30 16l10-1z" fill="url(#gwa)" ${SO}/><path d="M22 18l2-4 2 4-2 4zM56 40l2-4 2 4-2 4zM48 50l1.5-3 1.5 3-1.5 3z" fill="#FF9ED0"/>`,
    potion: `<rect x="26" y="6" width="12" height="8" rx="2" fill="#B07A45" ${SO}/><path d="M26 14h12v8c10 4 16 12 16 20 0 12-10 18-22 18S10 54 10 42c0-8 6-16 16-20z" fill="#fff" ${SO}/>${GR("gpo", "#FF7FD0", "#9B4CFF")}<path d="M13 38h38c1 2 1 3 1 4 0 10-9 15-20 15s-20-5-20-15c0-1 0-2 1-4z" fill="url(#gpo)"/><circle cx="24" cy="46" r="3" fill="#fff" opacity=".6"/><circle cx="38" cy="50" r="2" fill="#fff" opacity=".6"/><circle cx="34" cy="42" r="1.5" fill="#fff" opacity=".6"/>`,
    crown: `${GR("gcw", "#FFE88A", "#F5A300")}<path d="M6 50L8 18l14 14 10-20 10 20 14-14 2 32z" fill="url(#gcw)" ${SO}/><rect x="6" y="48" width="52" height="8" rx="2" fill="#F5B301" ${SO}/><circle cx="32" cy="36" r="4" fill="#FF5C8A" ${SOw(2)}/><circle cx="18" cy="40" r="3" fill="#6FD3FF" ${SOw(2)}/><circle cx="46" cy="40" r="3" fill="#6FD3FF" ${SOw(2)}/>`,
    mushhouse: `<rect x="18" y="32" width="28" height="26" rx="6" fill="#FFF3E0" ${SO}/><path d="M28 58V48a4 4 0 0 1 8 0v10z" fill="#8A5A2B" ${SOw(2)}/><circle cx="38" cy="40" r="3" fill="#9BE7FF" ${SOw(1.8)}/>${GR("gmh", "#C39BFF", "#7B4CDB")}<path d="M4 34C4 16 18 4 32 4s28 12 28 30z" fill="url(#gmh)" ${SO}/><g fill="#fff"><circle cx="18" cy="20" r="4"/><circle cx="34" cy="12" r="3.5"/><circle cx="46" cy="24" r="4"/></g>`
  }},
  {id: "music", name: "Music", tier: "pro", items: {
    headphones: `<path d="M10 38V30a22 22 0 0 1 44 0v8" fill="none" stroke="#2B2233" stroke-width="7" stroke-linecap="round"/><path d="M10 38V30a22 22 0 0 1 44 0v8" fill="none" stroke="#FF7FB0" stroke-width="3.5" stroke-linecap="round"/>${GR("ghp", "#FF9EC7", "#E0467F")}<rect x="4" y="34" width="14" height="22" rx="6" fill="url(#ghp)" ${SO}/><rect x="46" y="34" width="14" height="22" rx="6" fill="url(#ghp)" ${SO}/>`,
    note: `${GR("gno", "#9B8CFF", "#5B3FE0")}<path d="M24 46V12l30-6v34" fill="none" stroke="#2B2233" stroke-width="6" stroke-linejoin="round"/><path d="M24 46V12l30-6v34" fill="none" stroke="#7B64F0" stroke-width="3" stroke-linejoin="round"/><path d="M24 14l30-6v8l-30 6z" fill="#7B64F0" ${SOw(2)}/><ellipse cx="17" cy="48" rx="9" ry="7" fill="url(#gno)" ${SO}/><ellipse cx="47" cy="42" rx="9" ry="7" fill="url(#gno)" ${SO}/>`,
    guitar: `<path d="M38 26L56 8" stroke="#2B2233" stroke-width="7" stroke-linecap="round"/><path d="M38 26L56 8" stroke="#B07A45" stroke-width="4" stroke-linecap="round"/><rect x="50" y="2" width="10" height="8" rx="2" fill="#8A5A2B" ${SOw(2)} transform="rotate(45 55 6)"/>${GR("ggu", "#FFB36B", "#E07A2E")}<path d="M34 22c6 4 6 10 2 14 4 6 2 14-6 20s-18 6-22-2 0-16 6-20c2-6 8-10 14-8 2-4 4-6 6-4z" fill="url(#ggu)" ${SO}/><circle cx="26" cy="38" r="5" fill="#5A3A22"/><path d="M16 46l6-6" stroke="#2B2233" stroke-width="2.4"/>`,
    mic: `${GR("gmi", "#E6E9F0", "#9AA3B5")}<circle cx="32" cy="18" r="13" fill="url(#gmi)" ${SO}/><path d="M22 14h20M20 20h24M24 26h16" stroke="#7A8499" stroke-width="1.6"/><path d="M26 30h12l-2 22h-8z" fill="#2B3A55" ${SO}/><rect x="24" y="52" width="16" height="8" rx="3" fill="#FF5C8A" ${SOw(2)}/>`,
    vinyl: `<circle cx="32" cy="32" r="27" fill="#2B2233" ${SO}/><circle cx="32" cy="32" r="21" fill="none" stroke="#4A4458" stroke-width="1.2"/><circle cx="32" cy="32" r="16" fill="none" stroke="#4A4458" stroke-width="1.2"/>${GR("gvi", "#FF9EC7", "#FF5C8A")}<circle cx="32" cy="32" r="10" fill="url(#gvi)"/><circle cx="32" cy="32" r="2" fill="#2B2233"/><path d="M14 20q4-6 10-8" stroke="#fff" stroke-width="2" fill="none" opacity=".4" stroke-linecap="round"/>`,
    speaker: `${GR("gsp", "#5A6A86", "#2B3A55")}<rect x="12" y="4" width="40" height="56" rx="8" fill="url(#gsp)" ${SO}/><circle cx="32" cy="18" r="6" fill="#9BE7FF" ${SOw(2)}/><circle cx="32" cy="40" r="12" fill="#9BE7FF" ${SOw(2)}/><circle cx="32" cy="40" r="4" fill="#2B3A55"/>`
  }},
  {id: "holidays", name: "Holidays", tier: "pro", items: {
    pumpkin: `<path d="M32 14q0-8 6-10" stroke="#3E9E55" stroke-width="4" fill="none" stroke-linecap="round"/>${GR("gpk", "#FFA24A", "#E0661A")}<path d="M32 16c-6-4-18-4-24 6-6 12 0 30 14 32 4 1 7-1 10-1s6 2 10 1c14-2 20-20 14-32-6-10-18-10-24-6z" fill="url(#gpk)" ${SO}/><path d="M32 16v36M22 18q-6 14 0 34M42 18q6 14 0 34" fill="none" stroke="#C8501A" stroke-width="2"/><path d="M20 30l5 4-5 2zM44 30l-5 4 5 2zM22 42q10 8 20 0l-4 3-3-3-3 3-3-3-3 3z" fill="#2B2233"/>`,
    ghost: `<path d="M12 58V28a20 20 0 0 1 40 0v30l-7-6-6 6-7-6-6 6-7-6z" fill="#fff" ${SO}/>${EYES(25, 39, 30, 3)}<ellipse cx="32" cy="40" rx="3" ry="4" fill="#2B2233"/>${BLUSH(20, 44, 38)}`,
    snowman: `<circle cx="32" cy="44" r="16" fill="#fff" ${SO}/><circle cx="32" cy="20" r="12" fill="#fff" ${SO}/><path d="M20 30q12 6 24 0l-2 6q-10 4-20 0z" fill="#FF5C5C" ${SOw(2)}/><circle cx="28" cy="18" r="1.8" fill="#2B2233"/><circle cx="36" cy="18" r="1.8" fill="#2B2233"/><path d="M32 21l8 2-8 1z" fill="#FF9F1C"/><circle cx="32" cy="42" r="2" fill="#2B2233"/><circle cx="32" cy="50" r="2" fill="#2B2233"/><path d="M22 8h20l-2-6H24z" fill="#2B2233"/>`,
    gift: `${GR("ggf", "#7FB2FF", "#3E6FE0")}<rect x="8" y="26" width="48" height="32" rx="4" fill="url(#ggf)" ${SO}/><rect x="4" y="18" width="56" height="10" rx="3" fill="#5A8CF0" ${SO}/><path d="M28 18h8v40h-8z" fill="#FF5C8A" ${SOw(2)}/><path d="M32 18c-4-10-16-12-14-4 1 4 8 4 14 4zM32 18c4-10 16-12 14-4-1 4-8 4-14 4z" fill="#FF5C8A" ${SOw(2)}/>`,
    cane: `<path d="M24 60V22a10 10 0 0 1 20 0v4" fill="none" stroke="#2B2233" stroke-width="11" stroke-linecap="round"/><path d="M24 60V22a10 10 0 0 1 20 0v4" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round"/><path d="M24 60V22a10 10 0 0 1 20 0v4" fill="none" stroke="#FF3D4E" stroke-width="7" stroke-linecap="butt" stroke-dasharray="5 6"/>`,
    balloon: `<path d="M32 46q-4 8 2 16" fill="none" stroke="#2B2233" stroke-width="2" stroke-linecap="round"/>${GR("gbl", "#FF8FB0", "#E8285A")}<path d="M32 46S8 32 8 18A12 12 0 0 1 32 12a12 12 0 0 1 24 6c0 14-24 28-24 28z" fill="url(#gbl)" ${SO}/><path d="M28 46h8l-4 4z" fill="#E8285A" ${SOw(2)}/>${SHINE(17, 16, 5, 3)}`,
    clover: `<path d="M34 34q10 12 6 26" fill="none" stroke="#2F8F4A" stroke-width="4" stroke-linecap="round"/><g fill="#4CC38A" ${SOw(2)}>${[0, 90, 180, 270].map(a => `<path d="M32 31C21 25 18 16 22 11a6 6 0 0 1 10 2 6 6 0 0 1 10-2c4 5 1 14-10 20z" transform="rotate(${a} 32 32)"/>`).join("")}</g><circle cx="32" cy="32" r="3" fill="#2F8F4A"/>`,

    egg2: `${GR("geg", "#B8E6FF", "#FFB8D8")}<path d="M32 4c12 0 22 18 22 34s-10 22-22 22-22-6-22-22S20 4 32 4z" fill="url(#geg)" ${SO}/><path d="M11 32q5-5 10 0t10 0 10 0 10 0 3 0M10 44q5 5 11 0t10 0 10 0 10 0 4 0" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/><g fill="#FFE066"><circle cx="24" cy="18" r="2.5"/><circle cx="38" cy="16" r="2"/><circle cx="32" cy="52" r="2.5"/></g>`
  }},
  {id: "weather", name: "Weather", tier: "pro", items: {
    umbrella: `<path d="M32 30v22a5 5 0 0 1-10 0" fill="none" ${SOw(3)}/>${GR("gum", "#FF8FB0", "#E03A7A")}<path d="M4 32C4 16 17 6 32 6s28 10 28 26c-4-4-10-4-14 0-4-4-10-4-14 0-4-4-10-4-14 0-4-4-10-4-14 0z" fill="url(#gum)" ${SO}/><path d="M32 6c-8 8-8 18-4 26M32 6c8 8 8 18 4 26" fill="none" stroke="#fff" stroke-width="1.8" opacity=".6"/>`,
    snowflake: `<g stroke="#2B2233" stroke-width="7" stroke-linecap="round">${[0, 60, 120].map(a => `<path d="M32 6v52" transform="rotate(${a} 32 32)"/>`).join("")}</g><g stroke="#9BDFFF" stroke-width="4" stroke-linecap="round" fill="none">${[0, 60, 120].map(a => `<path d="M32 6v52M26 12l6 6 6-6M26 52l6-6 6 6" transform="rotate(${a} 32 32)"/>`).join("")}</g><circle cx="32" cy="32" r="4" fill="#fff" ${SOw(2)}/>`,
    rain: `<path d="M14 40h34a10 10 0 0 0 1-20 14 14 0 0 0-26-3 11 11 0 0 0-9 23z" fill="#DDE7F5" ${SO}/><g fill="#5AB0FF" ${SOw(1.8)}><path d="M20 46l-3 8a3 3 0 0 0 6 0z"/><path d="M34 48l-3 8a3 3 0 0 0 6 0z"/><path d="M46 44l-3 8a3 3 0 0 0 6 0z"/></g>${EYES(27, 39, 30, 2)}${SMILE(33, 34, 2.5)}`,
    storm: `<path d="M12 36h36a11 11 0 0 0 1-22 15 15 0 0 0-28-3 12 12 0 0 0-9 25z" fill="#8C96AB" ${SO}/>${GR("gsm", "#FFE56B", "#FFB800")}<path d="M34 30L22 46h9l-4 14 14-18h-9l4-12z" fill="url(#gsm)" ${SO}/>`,
    rainbow2: `${GR("grb", "#FF5C5C", "#8B5CF6")}<path d="M4 52a28 28 0 0 1 56 0h-10a18 18 0 0 0-36 0z" fill="url(#grb)" ${SO}/><path d="M9 52a23 23 0 0 1 46 0" fill="none" stroke="#FFB443" stroke-width="3"/><path d="M14 52a18 18 0 0 1 36 0" fill="none" stroke="#4CC38A" stroke-width="3" opacity=".9"/><circle cx="12" cy="54" r="7" fill="#fff" ${SOw(2)}/><circle cx="52" cy="54" r="7" fill="#fff" ${SOw(2)}/>`,
    thermo: `<rect x="26" y="4" width="12" height="40" rx="6" fill="#fff" ${SO}/><circle cx="32" cy="50" r="10" fill="#FF5C5C" ${SO}/><rect x="29.5" y="18" width="5" height="30" rx="2.5" fill="#FF5C5C"/><path d="M40 12h6M40 20h4M40 28h6" stroke="#2B2233" stroke-width="2" stroke-linecap="round"/>`
  }}
];

