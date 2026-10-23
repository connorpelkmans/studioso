/* ===== module: 97-exammode.js ===== */
/* Exam Mode */
(() => {
/*EXAMMODE-START*/
// Exam Mode's rules
const EXAMMODE = (() => {
  const DAYS = 3;
  const AFTER_MS = 2 * 3600000;
  const EXAM_RX = /\b(midterm|final exam)\b/i;
  const pd = s => { const [y, m, d] = String(s).split("-").map(Number); return new Date(y, m - 1, d); };
  const isDay = s => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
  const diff = (a, b) => Math.round((pd(b) - pd(a)) / 864e5);
  const dueMs = t => { const d = pd(t.due); if (t.time && /^\d{1,2}:\d{2}$/.test(t.time)) { const [h, m] = t.time.split(":").map(Number); d.setHours(h, m, 0, 0); } else d.setHours(23, 59, 0, 0); return d.getTime(); };
  const endMs = t => t.time && /^\d{1,2}:\d{2}$/.test(t.time) ? dueMs(t) + AFTER_MS : dueMs(t) + 60000;
  // An exam: type Exam or Quiz, or a task titled Midterm / Final Exam
  const isExam = t => !!t && t.type !== "Study" && !t.prepFor && (t.type === "Exam" || t.type === "Quiz" || EXAM_RX.test(String(t.title || "")));
  // Work that has to be handed in
  const isWork = (t, exam) => !!t && t.type !== "Study" && !t.prepFor && (!exam || t.id !== exam.id);

  // The mode right now
  function pick(input){
    if (!input || input.enabled === false) return null;
    const today = input.today, now = Number(input.now) || 0, off = input.off || {};
    const open = (input.tasks || []).filter(t => t && t.status !== "done" && isDay(t.due));
    const exams = open.filter(t => isExam(t) && diff(today, t.due) >= 0 && diff(today, t.due) <= DAYS && now < endMs(t)).sort((a, b) => dueMs(a) - dueMs(b) || String(a.id).localeCompare(String(b.id)));
    const live = exams.filter(t => !off[t.id]);
    if (!live.length) return null;
    const exam = live[0];
    const others = live.slice(1);
    const also = open.filter(t => isWork(t, exam) && !isExam(t) && !t.dead && diff(today, t.due) <= DAYS && (diff(today, t.due) >= 0 || t.lateOk))
      .sort((a, b) => dueMs(a) - dueMs(b) || String(a.id).localeCompare(String(b.id)));
    return {exam, days: diff(today, exam.due), others, also};
  }

  // Do This Next in Exam Mode
  const studyKey = (examDue, o, dues) => Math.min(o ? (o.examDay ? examDue : Math.max(examDue, o.dayEnd)) : examDue, ...(dues || []));
  const leads = (it, key) => !!it.risk || it.dueMs <= key;
  function order(items, examDue, o){
    const first = [], study = [], after = [], rest = [];
    const key = studyKey(examDue, o, (items || []).filter(it => it.kind === "study").map(it => it.dueMs));
    (items || []).forEach(it => {
      if (it.kind === "study") study.push(Object.assign(it, {lane: "study"}));
      else if (it.kind === "work" && it.inWindow && leads(it, key)) first.push(Object.assign(it, {lane: "first"}));
      else if (it.kind === "work" && it.inWindow) after.push(Object.assign(it, {lane: "after"}));
      else rest.push(Object.assign(it, {lane: "rest"}));
    });
    const byDue = (a, b) => a.dueMs - b.dueMs;
    first.sort(byDue); after.sort(byDue);
    return first.concat(study, after, rest);
  }
  // Short words for a countdown
  const rel = d => d <= 0 ? "today" : d === 1 ? "tomorrow" : `in ${d} days`;
  const kindWord = t => t && t.type === "Quiz" ? "Quiz" : "Exam";
  const tag = (t, d) => `${kindWord(t)} ${rel(d)}`;
  const dayEnd = t => { const d = pd(t.due); d.setHours(23, 59, 59, 999); return d.getTime(); };
  return {DAYS, pick, order, leads, studyKey, dayEnd, rel, tag, kindWord, isExam, isWork, dueMs, endMs, diff};
})();
/*EXAMMODE-END*/

const OFF_KEY = "studyboard:exammode:off", SAID_KEY = "studyboard:exammode:said";
const lsGet = k => { try { const v = JSON.parse(localStorage.getItem(k) || "{}"); return v && typeof v === "object" ? v : {}; } catch (e) { return {}; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
const enabled = () => !(state.settings && state.settings.examMode === false);
const offMap = () => { const o = lsGet(OFF_KEY), out = {}; Object.keys(o).forEach(k => { if (Date.now() - Number(o[k]) < 30 * 864e5) out[k] = true; }); return out; };
const runAct = (act, data) => {
  const b = document.createElement("button"); b.type = "button"; b.hidden = true; b.dataset.act = act;
  Object.entries(data || {}).forEach(([k, v]) => { b.dataset[k] = v; });
  document.body.appendChild(b); b.click(); b.remove();
};

// The mode right now, worked out at most once per data change and minute
let MEMO = {k: "", v: null};
function current(){
  const now = Date.now(), k = [state.updated || 0, todayISO(), Math.floor(now / 60000), enabled() ? 1 : 0, JSON.stringify(lsGet(OFF_KEY)), Object.keys(state.tasks || {}).length].join("|");
  if (MEMO.k === k) return MEMO.v;
  let v = null;
  try {
    const info = (FOCUS && FOCUS.info) || {};
    const tasks = tasksArr().map(t => { const x = info[t.id]; return x ? Object.assign({}, t, {dead: !!x.dead, lateOk: !x.dead}) : t; });
    v = EXAMMODE.pick({tasks, today: todayISO(), now, off: offMap(), enabled: enabled()});
  } catch (e) { console.warn("exam mode", e); v = null; }
  MEMO = {k, v};
  return v;
}
const examTitle = t => t ? t.title : "";
const whenText = (t, cap) => {
  const d = dayDiff(todayISO(), t.due), w = EXAMMODE.rel(d);
  return (cap ? w.charAt(0).toUpperCase() + w.slice(1) : w) + (t.time ? ` at ${fmtTime(t.time)}` : "");
};
const dueText = t => { const d = dayDiff(todayISO(), t.due); return (d < 0 ? `overdue since ${fmtShort(t.due)}` : d <= 1 ? EXAMMODE.rel(d) : parse(t.due).toLocaleDateString(undefined, {weekday: "long"})) + (t.time ? ` ${fmtTime(t.time)}` : ""); };
const courseTag = t => { const c = courseOf(t.courseId); return c ? courseLabel(c) : ""; };

/* Do This Next */
const laneOpts = m => ({dayEnd: EXAMMODE.dayEnd(m.exam), examDay: m.days <= 0});
const riskOf = x => x.dl < 0 || (x.behind || 0) >= 0.5 || (x.own || 0) >= 1 || (x.rho || 0) >= 0.9;
const studyToday = t => { const d0 = new Date(); d0.setHours(0, 0, 0, 0); return (t.history || []).reduce((m, h) => { const mm = /^Focus session:? (\d+)m/.exec(h.text || ""); return mm && h.at >= d0.getTime() ? m + Number(mm[1]) : m; }, 0); };
// Called by nextUp with its scored list (each {x, s, why})
function rankNext(F, scored, pool, focusLen){
  const m = current(); if (!m) return null;
  const ex = m.exam, exDue = EXAMMODE.dueMs(ex), chip = EXAMMODE.tag(ex, m.days);
  const items = scored.map(y => {
    const t = y.x.t, study = t.id === ex.id || t.prepFor === ex.id;
    return {y, id: t.id, kind: study ? "study" : EXAMMODE.isWork(t, ex) ? "work" : "other", dueMs: dueDate(t).getTime(), inWindow: y.x.dl <= EXAMMODE.DAYS && !y.x.dead, risk: riskOf(y.x)};
  });
  const ord = EXAMMODE.order(items, exDue, laneOpts(m));
  scored.length = 0;
  ord.forEach(it => {
    scored.push(it.y);
    if (it.lane === "first") it.y.why.unshift(it.dueMs <= exDue ? `Due before your ${EXAMMODE.kindWord(ex).toLowerCase()}` : it.risk ? "Short of time for it" : `Due on your ${EXAMMODE.kindWord(ex).toLowerCase()} day`);
    else if (it.lane === "study") it.y.why.unshift(chip);
  });
  const top = ord[0];
  if (top && top.lane !== "rest" && top.lane !== "after") return {};
  if (ord.some(it => it.lane === "study")) return {};
  const x = F.info && F.info[ex.id];
  if (!x || !inFilter(ex) || ui.skipNext.ids.includes("study:" + ex.id) || ui.skipNext.ids.includes(ex.id) || studyToday(ex) >= 120) return {};
  const hasPlan = planSessions(ex.id).length > 0;
  ui.nextShown = "study:" + ex.id;
  const why = [`${chip}${ex.time ? " at " + fmtTime(ex.time) : ""}`, "Exam Mode"];
  if (!hasPlan) why.push("No study plan yet");
  return {study: {x, why, step: null, mins: Math.max(focusLen, Math.min(focusLen * 2, m.days <= 1 ? focusLen * 2 : focusLen)), left: pool.length, ai: false, study: true, hasPlan, label: "Study for " + ex.title, exam: true}};
}
// The task the Focus timer suggests
function focusPick(){
  if (!current()) return "";
  const keep = ui.nextShown;
  try { const n = nextUp(computeFocus()); return n && n.x && n.x.t ? n.x.t.id : ""; } catch (e) { return ""; } finally { ui.nextShown = keep; }
}
function pomoDefault(){
  try {
    if (pomo.running || pomo.left > 0 || pomo.mode !== "focus") return;
    const cur = pomo.taskId && state.tasks[pomo.taskId];
    if (cur && cur.status !== "done" && pomo.day === todayISO() && pomo.sessions > 0) return;
    const id = focusPick(); if (id && id !== pomo.taskId) { pomo.taskId = id; pomoSave(); }
  } catch (e) { console.warn("exam mode focus", e); }
}
function pomoHtml(){
  const m = current(); if (!m) return "";
  const t = pomo.taskId && state.tasks[pomo.taskId], ex = m.exam;
  const on = t ? (t.id === ex.id || t.prepFor === ex.id ? `Working On is set to study for it.` : `Working On is set to ${esc(t.title)}, due ${esc(dueText(t))}.`) : "";
  return `<p class="exm-pomo"><b>Exam Mode</b> <span>${esc(examTitle(ex))} is ${esc(whenText(ex))}. ${on}</span></p>`;
}

/* "Study for It" */
function study(id){
  const m = current(), ex = (id && state.tasks[id]) || (m && m.exam); if (!ex) return;
  if (dlg.open) dlg.close();
  const today = todayISO();
  const ss = planSessions(ex.id).filter(t => t.status !== "done" && t.type === "Study").sort((a, b) => (a.due || "").localeCompare(b.due || "") || String(a.slot || "").localeCompare(String(b.slot || "")));
  const nx = ss.find(t => t.due && t.due <= today) || ss[0];
  if (nx) { if (nx.matKind && window.SBPREP) SBPREP.runIdea(nx.id); else runAct("pomo-task", {id: nx.id}); return; }
  const decks = decksArr().filter(d => ex.courseId && d.courseId === ex.courseId && d.cards.length);
  const due = decks.filter(d => d.cards.some(cardDue));
  if (due.length) { startStudy(due.map(d => d.id)); return; }
  if (decks.length) { const w = weakSpots(decks.map(d => d.id)); if (w.n) { weakSheet(decks.map(d => d.id)); return; } startStudy(decks.map(d => d.id)); return; }
  runAct("pomo-task", {id: ex.id, study: "1", mins: String(Math.round(Number(pomoCfg().focus) || 25))});
}

/* Today: one compact card */
function todayHtml(){
  let m; try { m = current(); } catch (e) { return ""; } if (!m) return "";
  const ex = m.exam, c = courseOf(ex.courseId), sm = window.SBPREP && SBPREP.summary ? (() => { try { return SBPREP.summary(ex); } catch (e) { return null; } })() : null;
  const hrs = (EXAMMODE.dueMs(ex) - Date.now()) / 3600000;
  const count = m.days === 0 && ex.time ? (hrs > 1 ? `In about ${Math.round(hrs)} hour${Math.round(hrs) === 1 ? "" : "s"}` : hrs > 0 ? "Starting soon" : "Happening now") : m.days === 0 ? "Today" : m.days === 1 ? "Tomorrow" : `In ${m.days} days`;
  const when = `${m.days <= 1 ? "" : esc(fmtDate(ex.due))}${ex.time ? `${m.days <= 1 ? "" : " at "}${esc(fmtTime(ex.time))}` : ""}`;
  const ready = sm ? `<div class="exm-ready"><span class="exm-rl">${sm.pct != null ? `Readiness <b>${sm.pct}%</b>` : `<b>${sm.done}</b> of ${sm.total} prep sessions done`}</span><span class="exm-bar" role="img" aria-label="${sm.pct != null ? `Readiness ${sm.pct} percent` : `${sm.done} of ${sm.total} prep sessions done`}"><i style="width:${sm.pct != null ? sm.pct : Math.round(sm.done / Math.max(1, sm.total) * 100)}%"></i></span></div>` : "";
  const also = m.also.slice(0, 3), more = m.also.length - also.length;
  const alsoH = m.also.length ? `<div class="exm-also"><h4 class="exm-h" id="exmAlsoH">Also Due</h4><ul aria-labelledby="exmAlsoH">${also.map(t => `<li style="--c:${esc(colorOf(t.courseId))}"><button type="button" class="exm-item" data-act="edit-task" data-id="${esc(t.id)}"><span class="exm-it">${esc(t.title)}</span><span class="exm-iw">${courseTag(t) ? esc(courseTag(t)) + ", " : ""}${esc(dueText(t))}</span></button></li>`).join("")}</ul>${more > 0 ? `<p class="exm-more">And ${more} more due in the next few days, listed in Today's Plan.</p>` : ""}</div>` : "";
  const othersH = m.others.length ? `<p class="exm-others">Also coming up: ${m.others.map(t => `<button type="button" class="link-btn" data-act="edit-task" data-id="${esc(t.id)}">${esc(t.title)}</button>${courseTag(t) ? ` (${esc(courseTag(t))})` : ""}, ${esc(whenText(t))}`).join("; ")}.</p>` : "";
  const planBtn = !sm && m.days >= 1 && window.SBPREP ? `<button type="button" class="btn small" data-act="exam-plan" data-id="${esc(ex.id)}">Plan My Prep</button>` : "";
  return `<section class="exm-card" role="region" aria-label="Exam Mode" style="--c:${esc(colorOf(ex.courseId))}">
    <div class="exm-top"><span class="exm-kick">Exam Mode</span><button type="button" class="link-btn exm-off" data-act="exm-off" data-id="${esc(ex.id)}" aria-label="Not now: turn Exam Mode off for ${esc(ex.title)}">Not Now</button></div>
    <div class="exm-main">
      <div class="exm-txt"><h3 class="exm-title"><button type="button" class="exm-name" data-act="edit-task" data-id="${esc(ex.id)}">${esc(ex.title)}</button>${c ? ` <span class="tag">${esc(courseLabel(c))}</span>` : ""}</h3>
        <p class="exm-when"><b>${esc(count)}</b>${when ? ` <span>${when}</span>` : ""}</p></div>
      <div class="exm-acts"><button type="button" class="btn primary small" data-act="exm-study" data-id="${esc(ex.id)}">Study for It</button>${planBtn}</div>
    </div>
    ${ready}${alsoH}${othersH}
  </section>`;
}

/* Flashcards: the exam's course first */
function sortDecks(ds){
  const m = current(); if (!m || !m.exam.courseId) return ds;
  const cid = m.exam.courseId;
  return ds.filter(d => d.courseId === cid).concat(ds.filter(d => d.courseId !== cid));
}
function deckTag(d){
  const m = current(); if (!m || !d || !m.exam.courseId || d.courseId !== m.exam.courseId) return "";
  return `<span class="exm-tag">${esc(EXAMMODE.tag(m.exam, m.days))}</span>`;
}
function sortQueue(q){
  const m = current(); if (!m || !m.exam.courseId || !Array.isArray(q)) return q;
  const cid = m.exam.courseId, inC = x => { const d = state.decks[x.deckId]; return !!d && d.courseId === cid; };
  return q.filter(inC).concat(q.filter(x => !inC(x)));
}

/* the companion */
function offer(){
  try {
    const m = current(); if (!m) return null;
    const s = lsGet(SAID_KEY), today = todayISO();
    const said = s.day === today ? s : {day: today, n: 0, at: 0};
    if ((said.n || 0) >= 2 || Date.now() - (said.at || 0) < 3 * 3600000) return null;
    const ex = m.exam, nm = examTitle(ex), w = EXAMMODE.rel(m.days);
    const key = EXAMMODE.studyKey(EXAMMODE.dueMs(ex), laneOpts(m), planSessions(ex.id).filter(t => t.status !== "done" && t.due && t.due >= todayISO()).map(t => EXAMMODE.dueMs(t)));
    const first = m.also.find(t => { const x = FOCUS && FOCUS.info && FOCUS.info[t.id]; return EXAMMODE.leads({dueMs: EXAMMODE.dueMs(t), risk: !!x && riskOf(x)}, key); });
    if (first && (said.n || 0) === 0 && canDoNow(first)) return {text: `${first.title} is due ${dueText(first)}, around ${nm}. Let's get it done first, then study.`, action: "focus", taskId: first.id, yes: "Start Focus", local: true, exm: true};
    const lines = m.days === 0
      ? [`${nm} is today. A calm review of the key ideas is all you need now.`, `Big day! ${nm} is today. Quick look over your notes, then trust what you know.`]
      : m.days === 1
        ? [`${nm} is tomorrow. One focused session now, then a good night's sleep.`, `Almost there! ${nm} is tomorrow. Want to review the shaky parts together?`]
        : [`${nm} is ${w}. A short session today makes a real difference.`, `${w.charAt(0).toUpperCase() + w.slice(1)}: ${nm}. You've got time. Let's do one focused review.`, `Exam Mode is on for ${nm}. Small steps each day add up.`];
    return {text: lines[Math.floor(Math.random() * lines.length)], action: "exam", taskId: ex.id, yes: "Study for It", local: true, exm: true};
  } catch (e) { return null; }
}
function offered(){ const s = lsGet(SAID_KEY), today = todayISO(), said = s.day === today ? s : {day: today, n: 0, at: 0}; said.n = (said.n || 0) + 1; said.at = Date.now(); lsSet(SAID_KEY, said); }
const ideaValid = id => { const m = current(); return !!m && m.exam.id === id; };

/* Settings */
hook("menu", () => `<div class="cap-row" data-group="study"><span style="flex:1;font-weight:600">Exam Mode<span class="sub">In the last 3 days before an exam or quiz, Today's Plan, Do This Next, your decks and Focus point at it. Work due sooner than your exam study still comes first.</span></span><label class="anim-tog"><input type="checkbox" data-act="exm-toggle" ${enabled() ? "checked" : ""}> On</label></div>`);

hook("act", (act, el, id) => {
  switch (act) {
    case "exm-study": study(id); return true;
    case "exm-off": {
      const ex = state.tasks[id]; if (!ex) return true;
      const o = lsGet(OFF_KEY); o[id] = Date.now(); Object.keys(o).forEach(k => { if (Date.now() - Number(o[k]) > 30 * 864e5) delete o[k]; }); lsSet(OFF_KEY, o);
      MEMO.k = ""; scheduleRender();
      toast(`Exam Mode is off for ${ex.title}`, () => { const p = lsGet(OFF_KEY); delete p[id]; lsSet(OFF_KEY, p); MEMO.k = ""; scheduleRender(); });
      return true;
    }
    case "exm-toggle": {
      state.settings = Object.assign({}, state.settings, {examMode: !!el.checked});
      saveSettings(); MEMO.k = ""; scheduleRender();
      toast(el.checked ? "Exam Mode is on" : "Exam Mode is off");
      return true;
    }
  }
  return false;
});

window.SBEXAM = {current, rankNext, todayHtml, sortDecks, deckTag, sortQueue, offer, offered, ideaValid, study, pomoDefault, pomoHtml, focusPick, EXAMMODE};
})();

