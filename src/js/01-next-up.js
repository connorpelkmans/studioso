/* ===== module: 01-next-up.js: the app's core, time estimates and Next Up ===== */
/* Time estimates */
const median = a => { const s = a.slice().sort((x, y) => x - y), n = s.length; return n ? (n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2) : 0; };
let LEARN = null, LEARN_AT = 0;
const accOf = () => (typeof SBACC !== "undefined" ? SBACC : null);
function learned(){
  if (LEARN && Date.now() - LEARN_AT < 5000) return LEARN;
  const mins = t => Math.max(Number(t.focusMin) || 0, Number(t.actualMin) || 0);
  const done = allTasks().filter(t => t.status === "done" && mins(t) >= 15 && !MILESTONE(t.type));
  const byType = {}, ratios = [];
  done.forEach(t => { const h = mins(t) / 60; (byType[t.type] = byType[t.type] || []).push({h, c: t.courseId, d: t.difficulty}); if (isNum(t.hours) && Number(t.hours) > 0 && (!t.checklist.length || t.checklist.every(i => i.done))) ratios.push(h / Number(t.hours)); });
  let r = ratios.length >= 3 ? Math.min(1.8, Math.max(0.7, median(ratios))) : 1, nR = ratios.length;
  const A = accOf(); if (A) { try { const g = A.global(); r = g.r; nR = g.n; } catch(e) { console.warn(e); } }
  LEARN = {byType, ratio: r, nRatio: nR}; LEARN_AT = Date.now();
  return LEARN;
}
function localEstimate(t){
  const L = learned(), dm = DIFF_M[t.difficulty] || 1, d = TYPE_DEFAULTS[t.type] || TYPE_DEFAULTS.Other;
  const all = L.byType[t.type] || [], same = all.filter(x => x.c && x.c === t.courseId);
  const use = same.length >= 2 ? same : all.length >= 2 ? all : null;
  let h, basis;
  if (use) {
    const base = median(use.map(x => x.h / (DIFF_M[x.d] || 1)));
    h = base * dm;
    basis = `Your last ${use.length} ${t.type === "Study" ? "study sessions" : t.type.toLowerCase() + "s"}${use === same ? " for this course" : ""} took about ${fmtHM(median(use.map(x => x.h)))} of focused time`;
  } else {
    h = d.h * dm;
    const w = isNum(t.weight) && Number(t.weight) > 0 ? Number(t.weight) : (t.id && PTS_W[t.id]) || 0;
    if (w) h *= Math.min(2, Math.max(0.6, Math.sqrt(w / d.w)));
    basis = `Typical for ${/^[AEIOU]/.test(t.type) ? "an" : "a"} ${t.type === "Other" ? "task" : t.type.toLowerCase()}${t.difficulty && t.difficulty !== "med" ? ` marked ${DIFF_LABEL[t.difficulty].toLowerCase()}` : ""}`;
    const n = String(t.notes || "") + " " + String(t.title || "");
    const words = n.match(/(\d[\d,]{1,5})\s*(?:-|to|–)?\s*(?:\d[\d,]{1,5}\s*)?words?\b/i), pages = n.match(/(\d{1,2})\s*(?:-|to|–)?\s*(?:\d{1,2}\s*)?(?:double[- ]spaced\s*)?pages?\b/i), mins = n.match(/(\d{1,2})\s*-?\s*min(?:ute)?s?\s+(?:presentation|talk|video)/i);
    let lenH = 0;
    if (words) { const w2 = Number(words[1].replace(/,/g, "")); if (w2 >= 200 && w2 <= 20000) { lenH = w2 / 350 + 1; basis += `, for about ${w2.toLocaleString()} words`; } }
    else if (pages) { const p2 = Number(pages[1]); if (p2 >= 1 && p2 <= 40) { lenH = p2 * 1 + 1; basis += `, for about ${p2} page${p2 === 1 ? "" : "s"}`; } }
    if (mins) { const m2 = Number(mins[1]); if (m2 >= 3 && m2 <= 60) { lenH = Math.max(lenH, m2 * 0.35 + 2); basis += `, for a ${m2}-minute presentation`; } }
    if (lenH && /\b(apa|references?|peer[- ]reviewed|sources?|citations?)\b/i.test(n)) lenH += 1;
    if (lenH) h = Math.max(h * 0.6, lenH * dm);
  }
  return {hours: Math.max(0.5, Math.round(h * 2) / 2), basis};
}
const EST_SCHEMA = {type: "OBJECT", properties: {hours: {type: "NUMBER"}, low: {type: "NUMBER"}, high: {type: "NUMBER"}, why: {type: "STRING", description: "One sentence"}, steps: {type: "ARRAY", items: {type: "STRING"}, description: "3 to 6 concrete steps, each under 60 characters"}}, required: ["hours", "why"]};
async function aiEstimate(t){
  const L = learned(), c = courseOf(t.courseId);
  const hist = Object.entries(L.byType).map(([k, v]) => `${k}: ${v.length} done, typical ${fmtHM(median(v.map(x => x.h)))}`).join("; ") || "no history yet";
  const r = await aiCall({task: "estimate", fast: true, maxTokens: 1500, temperature: 0.2, schema: EST_SCHEMA, parts: [{text: `Task: ${t.title}\nType: ${t.type}\nCourse: ${c ? c.name : "none"}\nDifficulty: ${DIFF_LABEL[t.difficulty] || "Medium"}\nGrade weight: ${t.weight || "unknown"}%\nNotes: ${t.notes || "none"}\nChecklist: ${(t.checklist || []).map(i => i.text).join("; ") || "none"}\nThis student's history (focused time actually spent): ${hist}. They take about ${L.ratio.toFixed(2)}x their own estimates.`}],
    system: "Estimate how many hours of focused work this task will take this particular student. Use their history when it's relevant, otherwise typical times for a college student. Give a best guess plus a low-high range, a one-sentence reason, and a few concrete steps to do it. Return JSON only."});
  const h = Number(r.data.hours);
  if (!(h > 0)) throw aiErr("bad", "The AI couldn't estimate that. Try adding a few notes about the task.");
  return {hours: Math.max(0.25, Math.round(h * 4) / 4), low: Number(r.data.low) || null, high: Number(r.data.high) || null, why: String(r.data.why || ""), steps: (r.data.steps || []).map(s => String(s).trim()).filter(Boolean).slice(0, 8)};
}
function tfSnapshot(){
  const f = dlg.querySelector("form"); if (!f) return null;
  const g = n => { const el = f.querySelector(`[name="${n}"]`); return el ? (el.type === "radio" ? (f.querySelector(`[name="${n}"]:checked`) || {}).value : el.value) : ""; };
  return {title: g("title"), type: g("type"), courseId: g("courseId"), notes: g("notes"), weight: g("weight"), difficulty: g("difficulty") || "med", checklist: $$("#clList input[type=text]", f).map(i => ({text: i.value, done: false}))};
}
async function tfEstimate(btn){
  const t = tfSnapshot(); if (!t) return;
  const out = $("#estHint"), hi = dlg.querySelector('[name="hours"]');
  out.hidden = false;
  if (!aiReady()) { const e = localEstimate(t); hi.value = e.hours; out.innerHTML = `About <b>${fmtHM(e.hours)}</b>. ${esc(e.basis)}.${learned().nRatio >= 3 && Math.abs(learned().ratio - 1) > 0.15 ? ` You usually take ${learned().ratio.toFixed(1)}× your own estimates, and Today's Plan allows for that.` : ""}`; hi.dispatchEvent(new Event("input", {bubbles: true})); return; }
  btn.disabled = true; out.innerHTML = `<span class="ai-spin" aria-hidden="true"></span> Estimating…`;
  try {
    const e = await aiEstimate(t);
    hi.value = e.hours; hi.dispatchEvent(new Event("input", {bubbles: true}));
    out.innerHTML = `${AI_ICON} ${aiWho() ? esc(aiWho()) + " estimates about" : "About"} <b>${fmtHM(e.hours)}</b>${e.low && e.high ? ` (${fmtHM(e.low)} to ${fmtHM(e.high)})` : ""}. ${esc(e.why)}${e.steps.length && !t.checklist.length ? ` <button type="button" class="link-btn" id="estSteps">Add ${e.steps.length} Steps to the Checklist</button>` : ""}`;
    const sb = $("#estSteps");
    if (sb) sb.addEventListener("click", () => { const inp = $("#clNew"), add = $("#clAdd"); e.steps.forEach(s => { inp.value = s; add.click(); }); sb.remove(); });
  } catch(err) { const l = localEstimate(t); hi.value = l.hours; out.textContent = `${err.message} Used your usual time instead: about ${fmtHM(l.hours)}.`; }
  btn.disabled = false;
}

/* Next Up feedback */
const NUFB_LS = "studyboard:nextFb";
const nufbLoad = () => { try { const a = JSON.parse(localStorage.getItem(NUFB_LS) || "[]"); return Array.isArray(a) ? a : []; } catch(e) { return []; } };
function nufbAdd(kind, t){
  if (!t) return;
  try { const a = nufbLoad().filter(e => Date.now() - e.at < 30 * 864e5); a.push({k: kind, id: t.id, ty: t.type || "", c: t.courseId || "", at: Date.now()}); localStorage.setItem(NUFB_LS, JSON.stringify(a.slice(-200))); } catch(e) {}
}
function nufbDrop(kind, id){
  try { const a = nufbLoad(), i = a.map(e => e.k === kind && e.id === id).lastIndexOf(true); if (i >= 0) { a.splice(i, 1); localStorage.setItem(NUFB_LS, JSON.stringify(a)); } } catch(e) {}
}
function nufbWeights(ev, now){
  const w = {type: {}, course: {}, task: {}};
  (ev || []).forEach(e => {
    const age = (now - e.at) / 864e5; if (!(age >= 0) || age > 30) return;
    const v = (e.k === "accept" ? 1 : -1) * Math.pow(0.5, age / 10);
    if (e.ty) w.type[e.ty] = (w.type[e.ty] || 0) + v;
    if (e.c) w.course[e.c] = (w.course[e.c] || 0) + v;
    if (e.k === "skip" && e.id) w.task[e.id] = (w.task[e.id] || 0) + Math.pow(0.5, age / 3);
  });
  return w;
}
function nufbMult(w, type, course, id, dl){
  if (dl <= 0) return 1;
  let f = 1 + Math.max(-0.15, Math.min(0.1, 0.04 * ((w.type[type] || 0) + (w.course[course] || 0))));
  f *= Math.max(0.8, 1 - 0.07 * (w.task[id] || 0));
  return Math.max(0.7, Math.min(1.1, f));
}
// Time of day buckets, and when this student actually studies
const dayPartOf = h => h < 5 ? "night" : h < 12 ? "morning" : h < 17 ? "afternoon" : h < 21 ? "evening" : "night";
function peakStudyHours(hist, now){
  const bins = new Array(24).fill(0);
  (hist || []).forEach(h => { const m = /^Focus session:? (\d+)m/.exec(h.text || ""); if (m && now - h.at < 30 * 864e5) bins[new Date(h.at).getHours()] += Number(m[1]); });
  const ex = accOf() ? accOf().extraBins(now) : null; if (ex) ex.forEach((v, i) => { bins[i] += v; });
  const total = bins.reduce((a, b) => a + b, 0); if (total < 90) return "";
  let best = 0, bi = 0;
  for (let i = 0; i < 24; i++) { const s = bins[i] + bins[(i + 1) % 24] + bins[(i + 2) % 24]; if (s > best) { best = s; bi = i; } }
  return `${pad(bi)}:00 to ${pad((bi + 3) % 24)}:00`;
}
// Keep only picks that are real, open, unblocked and doable now
function autoCleanNext(raw, back, ok, textOf){
  const seen = new Set(), out = [];
  (Array.isArray(raw) ? raw : []).forEach(x => {
    const id = x && back[String(x.ref || "").trim()];
    if (!id || seen.has(id) || !ok(id)) return;
    seen.add(id);
    const tt = textOf ? textOf(id, x.why, x.step) : {why: String(x.why || ""), step: String(x.step || "")};
    out.push({id, why: tt.why, step: tt.step, min: Math.max(10, Math.min(180, Number(x.minutes) || 0)) || null});
  });
  return out.slice(0, 5);
}

/* "Enough for today": a task you've worked for the time the plan gave it, or that you said was enough, steps aside
   for the rest of the day even though it isn't finished. It is recorded in the task's own history, so it syncs. */
const dayStartMs = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); };
const workedToday = t => { const ds = dayStartMs(); return (t.history || []).reduce((m, h) => { const mm = /^(?:Focus session|Logged time):? (\d+)m/.exec(h.text || ""); return mm && h.at >= ds ? m + Number(mm[1]) : m; }, 0); };
// "Enough for today" lasts until 4 AM, so pressing it just after midnight doesn't carry over into the next day
const enoughSinceMs = () => { const d = new Date(); if (d.getHours() < 4) d.setDate(d.getDate() - 1); d.setHours(4, 0, 0, 0); return d.getTime(); };
const markedEnough = t => { const ds = enoughSinceMs(); return (t.history || []).some(h => h.text === "Enough for today" && h.at >= ds); };
const enoughToday = (t, x) => {
  if (!t) return false; if ((x && x.enough) || markedEnough(t)) return true;
  const target = x && x.alloc > 0 ? Math.max(10, Math.round(x.alloc * 60)) : 0;
  return target > 0 && workedToday(t) >= target;
};
/* Next Up: the one thing to do right now.
   nowRank takes the plan's ranking and adjusts it for right now: something due later today, a class coming up, what you were
   just working on, hard work at your best hours, short tasks late at night, and how you've answered past suggestions. It picks
   from what the plan gives time today, and its pick also leads today's timeline (see availPlan), so the two always agree. */
function nowRank(F){
  const today = todayISO();
  if (!ui.skipNext || ui.skipNext.day !== today) ui.skipNext = {day: today, ids: []};
  const now = new Date(), hr = now.getHours(), hm = pad(hr) + ":" + pad(now.getMinutes());
  const recent = t => (t.history || []).some(h => /^Focus session/.test(h.text) && Date.now() - h.at < 3 * 3600000);
  const pool = F.ranked.filter(x => inFilter(x.t) && canDoNow(x.t) && !x.dead && !ui.skipNext.ids.includes(x.t.id) && (x.R > 0 || x.dl <= 0) && !enoughToday(x.t, x));
  const focusLen = Number(pomoCfg().focus) || 25;
  if (!pool.length) return {pool, scored: [], focusLen, gapMin: null};
  let gapMin = null, gapWhat = "";
  try {
    const nowMin = hr * 60 + now.getMinutes();
    const nx = schOccurrences(today, today).filter(o => !o.skipped && o.start && !(o.type === "meet" && o.m && o.m.kind === "Office Hours") && !(o.type === "avail" && (o.avail.kind === "protected" || o.avail.seg === "tail"))).map(o => ({o, m: Number(o.start.slice(0, 2)) * 60 + Number(o.start.slice(3, 5))})).filter(y => y.m > nowMin).sort((a, b) => a.m - b.m)[0];
    if (nx && nx.m - nowMin <= 75) { gapMin = nx.m - nowMin; gapWhat = nx.o.label || nx.o.title || "your class"; }
  } catch(e) {}
  const courseMin = {}, dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  tasksArr().forEach(t => (t.history || []).forEach(h => { const mm = /^Focus session:? (\d+)m/.exec(h.text || ""); if (mm && h.at >= dayStart && t.courseId) courseMin[t.courseId] = (courseMin[t.courseId] || 0) + Number(mm[1]); }));
  const fbW = nufbWeights(nufbLoad(), Date.now());
  const pk = accOf() ? accOf().peak(Date.now()) : null;
  // Work kept to save the most marks today (band 2) stays in its order; nothing about right now moves anything across bands
  const band = x => x.tier ? (x.tierSkip ? 1 : 2) : 0;
  const scored = pool.map(x => {
    const t = x.t, why = [], b = band(x);
    let s = x.score * (x.alloc > 0 ? 1 : 0.8);
    const sessionH = Math.min(x.alloc > 0 ? x.alloc : x.R, focusLen * 2 / 60);
    if (x.dl === 0 && t.time && t.time > hm) why.push(`Due at ${fmtTime(t.time)} today`);
    if (b === 2) return {x, s, why, sessionH, b};
    if (recent(t)) { s *= 1.15; why.push("You were just working on this, so it's quick to pick back up"); }
    if ((pk ? pk.hours.includes(hr) : hr < 12) && diffOf(t) === "hard") { s *= 1.1; why.push(pk ? tr("acc.peakHard", "Hard, and this is when you usually do your best work") : "Hard, so it's best done now while you're fresh"); }
    if (hr >= 21) { if (diffOf(t) === "hard" && x.dl > 1 && !(pk && pk.hours.includes(hr))) s *= 0.8; if (sessionH <= 0.75) { s *= 1.1; why.push("Short enough to finish tonight"); } }
    if (gapMin != null && gapMin >= 15) { if (x.R * 60 <= gapMin + 5) { s *= 1.3; why.push(`Fits in the ${gapMin} minutes before ${gapWhat}`); } else if (diffOf(t) === "hard") s *= 0.85; }
    if (t.prepFor && !t.xs) why.push("Part of your exam study plan");
    if (accOf() && !t.xs) { const ub = accOf().underBoost(t); if (ub > 1 && x.dl > 0) { s *= ub; why.push(tr("acc.underWhy", "These usually take you longer than you estimate")); } }
    if (x.dl > 0 && t.courseId && (courseMin[t.courseId] || 0) >= 120) s *= 0.92;
    s *= nufbMult(fbW, t.type, t.courseId, t.id, x.dl);
    return {x, s, why, sessionH, b};
  });
  deadlineGuard(scored, y => y.x, "s");
  scored.sort((a, b) => b.b - a.b || b.s - a.s);
  const exm = typeof SBEXAM !== "undefined" ? SBEXAM.rankNext(F, scored, pool, focusLen) : null;
  if (exm && exm.study) return {pool, scored, exm, focusLen, gapMin};
  // Today's Plan decides what gets time today; right now picks among that
  const planned = scored.filter(y => y.x.alloc > 0), base = planned.length ? planned : scored;
  let aiPick = !exm && autoPlanOn() && AUTO.next && AUTO.next.day === today && Date.now() - (AUTO.next.at || 0) < 8 * 3600000 ? (AUTO.next.list || []).find(x => base.some(y => y.x.t.id === x.id)) : null;
  if (aiPick) {
    const idx = scored.findIndex(y => y.x.t.id === aiPick.id), y = scored[idx], top = base[0];
    const urgent = top.x.dl <= 0 && top.x.R > 0 && (top.x.behind > 0 || top.x.rho >= 0.9) && y.x.dl > 0;
    const leap = scored.slice(0, idx).some(z => z.x.dl >= 0 && z.x.dl <= 3 && z.x.R > 0 && y.x.dl >= z.x.dl + 7 && (y.x.own || 0) < 0.75);
    if (urgent || leap || y.b < top.b || (idx > 5 && y.s < top.s * 0.6)) aiPick = null;
  }
  const pick = aiPick ? scored.find(y => y.x.t.id === aiPick.id) : base[0];
  return {pool, scored, exm, aiPick, pick, focusLen, gapMin};
}
// The task that leads today's timeline: Do This Next's pick
function nowLead(F){
  if (typeof ui === "undefined") return "";
  const keep = ui.nextShown;
  try { const r = nowRank(F); return r.pick && !(r.exm && r.exm.study) ? r.pick.x.t.id : ""; } catch (e) { return ""; } finally { ui.nextShown = keep; }
}
function nextUp(F){
  const r = nowRank(F), pool = r.pool, focusLen = r.focusLen;
  if (!pool.length) { const em = typeof SBEXAM !== "undefined" ? SBEXAM.rankNext(F, [], pool, focusLen) : null; return (em && em.study) || nextUpStudy(F, null, pool, focusLen); }
  if (r.exm && r.exm.study) return r.exm.study;
  const pick = r.pick, aiPick = r.aiPick, gapMin = r.gapMin, t = pick.x.t;
  ui.nextShown = planTaskId(t);
  const cl = (t.checklist || []).find(i => !i.done);
  const step = aiPick && aiPick.step ? {text: aiPick.step} : cl;
  // Your chosen timer length, shortened only when this task's time today is less than that
  const cap = aiPick && aiPick.min ? Math.round(aiPick.min / 5) * 5 : pick.x.alloc > 0 ? Math.round(pick.x.alloc * 60 / 5) * 5 : 0;
  let mins = cap >= 5 && cap < focusLen ? cap : focusLen;
  if (gapMin != null && gapMin >= 15) mins = Math.max(10, Math.min(mins, Math.floor((gapMin - 5) / 5) * 5));
  const why = (aiPick && aiPick.why ? [aiPick.why] : pick.why.concat(pick.x.reasons)).filter((r, i, a) => a.indexOf(r) === i && !(r === "Due today" && a.some(y => /^Due at .* today$/.test(y)))).slice(0, aiPick ? 1 : 3);
  // Studying for an in-person exam: the study card, with this plan's time for it
  if (t.xs) { const w2 = pick.why.concat(pick.x.reasons).filter((r, i, a) => a.indexOf(r) === i && !a.some(o => o !== r && o.startsWith(r))).slice(0, 3); why.splice(0, why.length, ...(aiPick && aiPick.why ? [aiPick.why] : w2)); }
  if (t.xs) { const ex = state.tasks[t.xs.id] || {title: t.title.replace(/^Study for /, "")}; return {x: pick.x, why, step: null, mins, left: pool.length - 1, ai: !!aiPick, study: true, xs: true, hasPlan: false, label: "Study for " + ex.title}; }
  return (r.exm ? null : nextUpStudy(F, pick, pool, focusLen)) || {x: pick.x, why, step, mins, left: pool.length - 1, ai: !!aiPick};
}
// An in-person exam or quiz can't be done now, but studying for it can
function nextUpStudy(F, top, pool, focusLen){
  const dayStart = new Date(); dayStart.setHours(0, 0, 0, 0);
  const studiedToday = t => (t.history || []).reduce((m, h) => { const mm = /^Focus session:? (\d+)m/.exec(h.text || ""); return mm && h.at >= dayStart.getTime() ? m + Number(mm[1]) : m; }, 0);
  const ex = Object.values(F.info || {}).filter(x => x.fixed && inFilter(x.t) && x.t.status !== "done" && x.dl >= 1 && x.dl <= 5 && !ui.skipNext.ids.includes("study:" + x.t.id)
    && !pool.some(y => y.t.prepFor === x.t.id) && studiedToday(x.t) < 50).sort((a, b) => a.dl - b.dl || dueDate(a.t) - dueDate(b.t))[0];
  if (!ex) return null;
  if (top) {
    const tx = top.x;
    if (tx.t.prepFor || tx.dl <= 0) return null;
    if (tx.dl <= ex.dl) return null;
  }
  const t = ex.t, hasPlan = planSessions(t.id).length > 0;
  const why = [`${t.type} ${ex.dl === 1 ? "tomorrow" : "in " + ex.dl + " days"}${t.time ? " at " + fmtTime(t.time) : ""}`, hasPlan ? "Extra review before it" : "No study plan yet"];
  ui.nextShown = "study:" + t.id;
  return {x: ex, why, step: null, mins: Math.max(focusLen, Math.min(focusLen * 2, ex.dl <= 1 ? focusLen * 2 : focusLen)), left: pool.length, ai: false, study: true, hasPlan, label: "Study for " + t.title};
}
// Heads Up: things the automatic AI noticed that are easy to miss
const HEADS_HIDE = "studyboard:heads:hide";
const headKey = h => h.id ? "t:" + h.id : "x:" + String(h.text || "").toLowerCase().replace(/[^a-z]+/g, " ").trim().slice(0, 40);
function headsHtml(){
  if (!autoPlanOn() || !AUTO.heads || AUTO.heads.day !== todayISO()) return "";
  let hid = {}; try { hid = JSON.parse(localStorage.getItem(HEADS_HIDE) || "{}") || {}; } catch(e) {}
  const list = (AUTO.heads.list || []).filter(h => !(Date.now() - (hid[headKey(h)] || 0) < 7 * 864e5) && (!h.id || (state.tasks[h.id] && state.tasks[h.id].status !== "done")));
  if (!list.length) return "";
  return `<div class="plan-heads" role="note"><span class="ph-label">Heads Up</span><ul>${list.map(h => `<li><span>${esc(h.text)}</span>${h.id ? `<button class="link-btn" data-act="edit-task" data-id="${esc(h.id)}">Open</button>` : ""}<button class="icon-btn sm ph-x" data-act="heads-hide" data-id="${esc(headKey(h))}" aria-label="Dismiss">${CLOSE}</button></li>`).join("")}</ul></div>`;
}
const nuBackBtn = () => ui.skipNext && ui.skipNext.day === todayISO() && ui.skipNext.ids.length ? `<button class="btn small" data-act="nu-back" title="Back to the suggestion before this one">Go Back</button>` : "";
// On phones the reasons and next step sit behind a Details toggle so the card stays short
const NU_CHEV = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';
const nuOpenCls = () => ui.nuMore ? " nu-open" : "";
const nuMoreBtn = () => `<button type="button" class="nu-more" data-act="nu-more" aria-expanded="${!!ui.nuMore}">Details${NU_CHEV}</button>`;
function nextUpHtml(F, pre){
  const n = arguments.length > 1 ? pre : nextUp(F); if (!n) return "";
  const t0 = n.x.t, t = n.xs && t0.xs ? state.tasks[t0.xs.id] || t0 : t0, c = courseOf(t.courseId);
  if (n.study) return `<div class="next-up nu-nochk${nuOpenCls()}" style="--c:${esc(colorOf(t.courseId))}">
    <div class="nu-top"><span class="nu-label">Do This Next</span>${n.xs && n.x.alloc > 0 ? `<span class="nu-alloc" title="Suggested study time today">${fmtHM(n.x.alloc)}<span class="nu-td"> today</span></span>` : ""}</div>
    <div class="nu-row">
      <div class="nu-body">
        <button class="nu-title" data-act="edit-task" data-id="${esc(t.id)}">${nuRing(t)}Study for ${esc(t.title)}${c ? ` <span class="tag">${esc(courseLabel(c))}</span>` : ""}</button>${c ? `<span class="tag nu-tag-out">${esc(courseLabel(c))}</span>` : ""}
        ${nuMoreBtn()}<span class="nu-why">${n.why.map(r => r.length <= 28 ? `<span class="nu-chip${/tomorrow/.test(r) ? " soon" : ""}">${esc(r)}</span>` : `<span class="nu-note">${esc(r)}</span>`).join('<span class="nu-sep" aria-hidden="true"> · </span>')}</span>
        <span class="nu-step">${n.hasPlan ? "Review your weakest topics or flashcards for it." : "Review now, or let Plan My Prep spread short sessions over the days before it."}</span>
      </div>
      <div class="nu-acts"><button class="btn primary small" data-act="pomo-task" data-study="1" data-id="${esc(t.id)}" data-mins="${n.mins}">${TOMATO}Study for ${n.mins}m</button>${n.hasPlan ? "" : `<button class="btn small" data-act="exam-plan" data-id="${esc(t.id)}">Plan My Prep</button>`}<button class="btn small" data-act="nu-skip" data-id="study:${esc(t.id)}">Something Else</button>${nuBackBtn()}</div>
    </div>
  </div>`;
  return `<div class="next-up${nuOpenCls()}" style="--c:${esc(colorOf(t.courseId))}">
    <div class="nu-top"><span class="nu-label">Do This Next${n.ai ? ` <span class="nu-who">${AI_ICON} ${aiWho() ? esc(aiWho()) + "'s pick" : "AI pick"}</span>` : ""}</span>${n.x.alloc > 0 ? `<span class="nu-alloc" title="Suggested time today">${fmtHM(n.x.alloc)}<span class="nu-td"> today</span></span>` : ""}</div>
    <div class="nu-row">
      ${t.gt ? `<span class="check gt-dot" aria-hidden="true"></span>` : `<button class="check" data-act="toggle" data-id="${esc(t.id)}" aria-label="Mark complete: ${esc(t.title)}">${CHECK}</button>`}
      <div class="nu-body">
        <button class="nu-title" ${gtOpenAttrs(t)}>${nuRing(t)}${esc(t.title)}${t.gt ? ` <span class="tag gt-chip">${esc(t.gt.name)}</span>` : ""}${c ? ` <span class="tag">${esc(courseLabel(c))}</span>` : ""}${MILESTONE(t.type) ? ` <span class="tag rx-tag" title="${esc(remoteOf(t).why || "Can be taken from home")}">Take-home</span>` : ""}</button>${c ? `<span class="tag nu-tag-out">${esc(courseLabel(c))}</span>` : ""}
        ${nuMoreBtn()}<span class="nu-why">${n.why.map(r => r.length <= 28 ? `<span class="nu-chip${/^Overdue/.test(r) ? " late" : /^Due (today|at)/.test(r) ? " soon" : ""}">${esc(r)}</span>` : `<span class="nu-note">${esc(r)}</span>`).join('<span class="nu-sep" aria-hidden="true"> · </span>')}${(sl => sl && sl.length ? `<span class="nu-chip nu-slot" title="${esc(availSlotText(sl))} in your free time"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>${sl.map(x => esc(availMin(x.s))).join(" · ")}<span class="pt-sr"> in your free time</span></span>` : "")(F.slotsBy ? F.slotsBy[t.id] : null)}</span>
        ${n.step ? `<span class="nu-step">Next step: ${esc(n.step.text)}</span>` : ""}
      </div>
      ${lmsGoBtn(t)}
      <div class="nu-acts"><button class="btn primary small" data-act="pomo-task" data-id="${t.gt ? "" : esc(t.id)}" data-mins="${n.mins}">${TOMATO}Start a ${n.mins}m Focus</button>${window.SBPREP ? SBPREP.matBtn(t) : ""}${t.type === "Study" && (t.studyDecks || []).length && !t.matKind ? `<button class="btn small" data-act="fc-study-plan" data-id="${esc(t.id)}">Study Cards</button>` : ""}${n.left ? `<button class="btn small" data-act="nu-skip" data-id="${esc(t.id)}">Something Else</button>` : ""}${t.gt ? "" : `<button class="btn small" data-act="nu-enough" data-id="${esc(t.id)}" title="You have done enough on this today, so move on. It stays on your list.">Enough for Today</button>`}${nuBackBtn()}</div>
    </div>
  </div>`;
}

// The course's sticker in a ring on Do This Next and the plan rows
const nuRing = (t, cls) => { const c = t && courseOf(t.courseId); return c ? `<span class="nu-ic ${cls || ""}" style="--c:${esc(c.color)}" aria-hidden="true">${courseRingHtml(c)}</span>` : ""; };
// When nothing in the plan can be started now, Do This Next still points somewhere
function nextUpSpare(F, inView){
  const ex = Object.values(F.info || {}).filter(x => x.fixed && inView(x) && x.t.status !== "done" && x.dl >= 1 && x.dl <= 14 && !planSessions(x.t.id).length).sort((a, b) => dueDate(a.t) - dueDate(b.t))[0];
  if (ex) {
    const t = ex.t, c = courseOf(t.courseId);
    return `<div class="next-up nu-nochk${nuOpenCls()}" style="--c:${esc(colorOf(t.courseId))}">
    <div class="nu-top"><span class="nu-label">Do This Next</span></div>
    <div class="nu-row">
      <div class="nu-body">
        <button class="nu-title" data-act="edit-task" data-id="${esc(t.id)}">Study for ${esc(t.title)}${c ? ` <span class="tag">${esc(courseLabel(c))}</span>` : ""}</button>${c ? `<span class="tag nu-tag-out">${esc(courseLabel(c))}</span>` : ""}
        ${nuMoreBtn()}<span class="nu-why">${esc(`${t.type} ${ex.dl === 1 ? "tomorrow" : "in " + ex.dl + " days"}${t.time ? " at " + fmtTime(t.time) : ""}`)} · No study sessions planned yet</span>
        <span class="nu-step">Plan My Prep spreads short review sessions over the days before it, and they show up here.</span>
      </div>
      <div class="nu-acts"><button class="btn primary small" data-act="exam-plan" data-id="${esc(t.id)}">Plan My Prep</button></div>
    </div>
  </div>`;
  }
  const today = todayISO(), p = {urgent: 0, high: 1, med: 2, low: 3};
  const t = tasksArr().filter(t => t.status !== "done" && !t.due && !MILESTONE(t.type) && canDoNow(t) && !blockers(t).length && !(t.start && t.start > today) && inView({t}))
    .sort((a, b) => (b.status === "doing") - (a.status === "doing") || (p[a.priority] ?? 2) - (p[b.priority] ?? 2) || (a.created || 0) - (b.created || 0))[0];
  if (!t) return "";
  const c = courseOf(t.courseId), cl = (t.checklist || []).find(i => !i.done), mins = Number(pomoCfg().focus) || 25;
  return `<div class="next-up${nuOpenCls()}" style="--c:${esc(colorOf(t.courseId))}">
    <div class="nu-top"><span class="nu-label">Do This Next</span></div>
    <div class="nu-row">
      <button class="check" data-act="toggle" data-id="${esc(t.id)}" aria-label="Mark complete: ${esc(t.title)}">${CHECK}</button>
      <div class="nu-body">
        <button class="nu-title" data-act="edit-task" data-id="${esc(t.id)}">${nuRing(t)}${esc(t.title)}${c ? ` <span class="tag">${esc(courseLabel(c))}</span>` : ""}</button>${c ? `<span class="tag nu-tag-out">${esc(courseLabel(c))}</span>` : ""}
        ${nuMoreBtn()}<span class="nu-why">${t.status === "doing" ? "Already in progress · " : ""}Nothing has a due date yet, so this is a good place to start. Add a due date to plan it properly.</span>
        ${cl ? `<span class="nu-step">Next step: ${esc(cl.text)}</span>` : ""}
      </div>
      ${lmsGoBtn(t)}
      <div class="nu-acts"><button class="btn primary small" data-act="pomo-task" data-id="${esc(t.id)}" data-mins="${mins}">${TOMATO}Start a ${mins}m Focus</button></div>
    </div>
  </div>`;
}


