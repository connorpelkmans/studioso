/* ===== module: 99-autopilot.js ===== */
/* Autopilot (Pro): once a day, on the first open of the day, the fixes the free planner offers one tap at a time are made for you,
   then Today's Plan says so once ("Autopilot moved 3 things last night. See What Changed · Undo"):
   - missed Exam Prep sessions are re-spread over the days left (the same plan as Catch Up), and prep is re-planned when an exam moved
   - a passed step of a broken-down assignment goes to the next free day before the assignment is due
   - an overdue Study task of your own goes to your next free day
   Only things the app or you scheduled softly move. A real due date (assignments, exams, quizzes), anything from school sync or a
   calendar feed, classes and events never move. What can't fit before its deadline stays where it is and is named instead.
   Day Off (free): a day with no study time. Today's Plan plans nothing that day and the Gentle Streak counts it as a rest day.
   With Autopilot on, what was planned that day moves to other free days right away.
   Settings > Study: Autopilot On (default), Ask Me First (the same line, as a proposal), Off. Runs are marked in synced settings
   (settings.autopilot.run = {day, id}) before anything moves, and wait for the account's settings to arrive, so a second device
   that opens the same day sees the mark and doesn't run again. Undo uses the exact earlier copies, kept on the device that ran it. */
var SBAUTOPILOT = null;
/*AUTOPILOT-START*/
// The pure part: no DOM and no app state (tests/autopilot.test.js extracts this block)
const AUTOPILOT = (() => {
  const dn = s => { const [y, m, d] = String(s).split("-").map(Number); return Math.round(Date.UTC(y, m - 1, d) / 864e5); };
  const fromDn = n => new Date(n * 864e5).toISOString().slice(0, 10);
  const add = (s, n) => fromDn(dn(s) + n);
  const diff = (a, b) => dn(b) - dn(a);
  const isDate = s => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && fromDn(dn(s)) === s;
  const HORIZON = 14, NEED = 2;
  const open = t => !!t && t.status !== "done";
  const isMs = t => t.type === "Exam" || t.type === "Quiz";
  // From school sync, a calendar feed or a group: its dates belong to someone else
  const synced = t => !!(t.bs || t.cv || t.bb || t.synced || t.icsUid || t.src || t.gt);
  const hrs = t => Number(t.hours) > 0 ? Math.min(12, Number(t.hours)) : 1;
  // What may move: prep sessions (by re-planning that exam's prep), steps of a broken-down assignment, your own Study tasks
  const kindOf = t => !open(t) || !isDate(t.due) || synced(t) ? "" : t.prepFor ? (t.type === "Study" ? "prep" : "") : t.breakdownOf ? "step" : t.type === "Study" ? "study" : "";
  const q = s => "“" + String(s || "Untitled").slice(0, 60) + "”";
  const byDue = (a, b) => (a.due < b.due ? -1 : a.due > b.due ? 1 : 0) || (parseInt(a.step, 10) || 0) - (parseInt(b.step, 10) || 0) || String(a.id).localeCompare(String(b.id));
  const forward = (lo, hi) => { const r = []; for (let d = lo, i = 0; d <= hi && i < 120; d = add(d, 1), i++) r.push(d); return r; };
  // Nearest days to `c` first (the day before, the day after, two before...), within lo..hi
  const around = (c, lo, hi) => { const r = []; for (let k = 1; k <= 60; k++) [add(c, -k), add(c, k)].forEach(d => { if (d >= lo && d <= hi) r.push(d); }); return r; };
  const whyPrep = (why, from, today, off) => why === "moved" ? "The exam date changed, so prep was re-planned"
    : why === "missed" ? (from < today ? "Missed, moved to a free day before the exam" : "Shifted to make room for the missed sessions")
    : off[from] ? "Your day off" : "Shifted around your day off";

  // inp: {today, tasks, off: {date: 1}, cap: {date: free study hours}, dh (hours on a day missing from cap), horizon,
  //   only (a date: just what is planned that day, for Take a Day Off),
  //   replanExam(exam, why) -> {ok, changes: [{kind:"task", id, after}], notes: [text]} | {ok:false, warn}: the app's own Catch Up plan}
  // out: {changes (one batch), moves: [{id, title, from, to, kind, why}], short: [{id, title, kind, text}], exams: [{id, why, missed}]}
  function plan(inp){
    inp = inp || {};
    const today = inp.today, off = inp.off || {}, cap = inp.cap || {}, dh = inp.dh != null ? Math.max(0, Number(inp.dh) || 0) : 3;
    const horizon = inp.horizon || HORIZON, only = isDate(inp.only) ? inp.only : "";
    const out = {changes: [], moves: [], short: [], exams: []};
    if (!isDate(today)) return out;
    const T = {}; (inp.tasks || []).forEach(t => { if (t && t.id) T[t.id] = t; });
    const orig = Object.values(T);
    const isOff = d => !!off[d];
    const touched = d => only ? d === only : d < today || isOff(d);

    // 1. Exam prep: re-spread (as Catch Up does) when a session slipped, the exam moved, or a session sits on a day off
    orig.filter(ex => isMs(ex) && open(ex) && isDate(ex.due) && ex.due > today).sort(byDue).forEach(ex => {
      const ss = orig.filter(t => t.prepFor === ex.id && kindOf(t) === "prep");
      if (!ss.length) return;
      const missed = ss.filter(s => s.due < today), offS = ss.filter(s => s.due >= today && isOff(s.due));
      const moved = !only && !!(ex.prep && isDate(ex.prep.examDue) && ex.prep.examDue !== ex.due);
      if (only ? !ss.some(s => s.due === only) : !missed.length && !offS.length && !moved) return;
      const why = moved ? "moved" : missed.length && !only ? "missed" : "dayoff";
      const r = inp.replanExam ? inp.replanExam(ex, why) : null;
      const skip = text => out.short.push({id: ex.id, title: ex.title, kind: "prep", text});
      if (!r || !r.ok) { skip(((r && r.warn) || "There's no room left before the exam.") + " Its prep sessions stay where they are."); return; }
      const ch = (r.changes || []).filter(c => c && c.id);
      const bad = ch.some(c => c.after && c.after.prepFor === ex.id && c.after.status !== "done" && (!isDate(c.after.due) || c.after.due < today || c.after.due >= ex.due || isOff(c.after.due)));
      if (!ch.length || bad) { skip("There's no free time left before the exam. Its prep sessions stay where they are."); return; }
      const adds = [], gone = [];
      ch.forEach(c => {
        const b = T[c.id], a = c.after;
        out.changes.push(c);
        if (c.id !== ex.id) {
          if (b && a && b.due !== a.due) out.moves.push({id: c.id, title: a.title, from: b.due, to: a.due, kind: "prep", why: whyPrep(why, b.due, today, off)});
          else if (!b && a) adds.push(a); else if (b && !a) gone.push(b);
        }
        if (a) T[c.id] = a; else delete T[c.id];
      });
      // A session the new plan replaced with another one (same topic first) reads as one move
      gone.sort(byDue).forEach(b => {
        const i = adds.findIndex(a => a.topicId && a.topicId === b.topicId), a = adds.splice(i >= 0 ? i : 0, adds.length ? 1 : 0)[0];
        if (a && a.due === b.due) return;
        out.moves.push(a ? {id: a.id, title: a.title, from: b.due, to: a.due, kind: "prep", why: whyPrep(why, b.due, today, off)} : {id: b.id, title: b.title, from: b.due, to: "", kind: "prep", why: "Not needed in the re-spread plan"});
      });
      adds.forEach(a => out.moves.push({id: a.id, title: a.title, from: "", to: a.due, kind: "prep", why: "Added to fit the days before the exam"}));
      out.exams.push({id: ex.id, why, missed: missed.length});
      (r.notes || []).forEach(text => out.short.push({id: ex.id, title: ex.title, kind: "note", text}));
    });

    // Room left on each day: free study hours less the soft work already on it
    const used = {};
    const use = (t, sign) => { if (kindOf(t) && t.due >= today) used[t.due] = (used[t.due] || 0) + sign * hrs(t); };
    Object.values(T).forEach(t => use(t, 1));
    const capOf = d => isOff(d) ? 0 : cap[d] != null ? Math.max(0, Number(cap[d]) || 0) : dh;
    const room = d => capOf(d) - (used[d] || 0);
    const fits = (d, h) => d >= today && !isOff(d) && room(d) >= Math.max(0.25, Math.min(h, NEED)) - 1e-9;
    // The first day it fits, or else the lightest day with at least half an hour free
    const pick = (cands, h) => cands.find(d => fits(d, h)) || cands.filter(d => d >= today && !isOff(d) && room(d) >= 0.5 - 1e-9).sort((a, b) => room(b) - room(a) || (a < b ? -1 : 1))[0];
    const place = (t, d, kind, why) => {
      const a = Object.assign({}, t, {due: d});
      if (kind === "step" || (a.start && a.start > d)) a.start = d;
      if (a.slot) a.slot = "";
      use(t, -1); use(a, 1); T[t.id] = a;
      out.changes.push({kind: "task", id: t.id, after: a});
      out.moves.push({id: t.id, title: t.title, from: t.due, to: d, kind, why});
    };

    // 2. Steps of a broken-down assignment: in order, between the step before and the next one, and before the due date
    const groups = {};
    Object.values(T).filter(t => kindOf(t) === "step").forEach(k => { (groups[k.breakdownOf] = groups[k.breakdownOf] || []).push(k); });
    Object.keys(groups).sort().forEach(pid => {
      const list = groups[pid].sort(byDue), p = T[pid];
      const tg = list.filter(k => touched(k.due));
      if (!tg.length || !p || !open(p) || !isDate(p.due)) return;
      if (p.due < today) { out.short.push({id: p.id, title: p.title, kind: "step", text: `${q(p.title)} was due before today, so its ${tg.length === 1 ? "step stays" : tg.length + " steps stay"} where ${tg.length === 1 ? "it is" : "they are"}.`}); return; }
      const lastOk = p.due > today ? add(p.due, -1) : p.due;
      tg.forEach(k0 => {
        const i = list.findIndex(x => x.id === k0.id), k = T[k0.id];
        const prev = i > 0 ? T[list[i - 1].id].due : today, lo = prev > today ? prev : today;
        const next = list.slice(i + 1).map(x => T[x.id]).find(x => !touched(x.due));
        const hi = next && next.due < lastOk ? next.due : lastOk;
        const d = pick(k.due >= today ? around(k.due, lo, hi) : forward(lo, hi), hrs(k));
        if (!d) { out.short.push({id: k.id, title: k.title, kind: "step", text: `There's no free time left before ${q(p.title)} is due, so this step stays where it is. A shorter version, or more study time, would help.`}); return; }
        place(k, d, "step", k.due < today ? `Missed step, moved to free time before ${q(p.title)} is due` : "Your day off");
        list[i] = T[k.id];
      });
    });

    // 3. Your own Study tasks: the next free day
    Object.values(T).filter(t => kindOf(t) === "study" && touched(t.due)).sort(byDue).forEach(t => {
      const cands = t.due >= today ? around(t.due, today, add(t.due, horizon)) : forward(today, add(today, horizon - 1));
      const d = pick(cands, hrs(t));
      if (!d) { out.short.push({id: t.id, title: t.title, kind: "study", text: `There's no free time in the next ${horizon} days, so it stays where it is.`}); return; }
      place(t, d, "study", t.due < today ? "Missed, moved to your next free time" : "Your day off");
    });
    return out;
  }
  return {plan, kindOf, synced, add, diff, isDate, HORIZON};
})();
/*AUTOPILOT-END*/

(() => {
  const AP = AUTOPILOT;
  const LS_UNDO = "studyboard:autopilot:undo";
  const locked = () => !!(window.SBPRO && SBPRO.locked());
  const cfg = () => { const v = state.settings && state.settings.autopilot; return v && typeof v === "object" && !Array.isArray(v) ? v : {}; };
  const mode = () => ({on: 1, ask: 1, off: 1})[cfg().mode] ? cfg().mode : "on";
  const setCfg = patch => { state.settings = Object.assign({}, state.settings, {autopilot: Object.assign({}, cfg(), patch)}); saveSettings(); };
  const offMap = () => { const v = state.settings && state.settings.daysOff; return v && typeof v === "object" && !Array.isArray(v) ? v : {}; };
  const runRec = () => { const r = cfg().run; return r && typeof r === "object" && AP.isDate(r.day) ? r : null; };
  const lsGet = () => { try { const v = JSON.parse(localStorage.getItem(LS_UNDO) || "null"); return v && typeof v === "object" ? v : null; } catch (e) { return null; } };
  const lsSet = v => { try { if (v) localStorage.setItem(LS_UNDO, JSON.stringify(v)); else localStorage.removeItem(LS_UNDO); } catch (e) {} };
  const things = n => `${n} thing${n === 1 ? "" : "s"}`;
  // Autopilot is doing the Catch Up work itself, so the Today cards for it stay out of the way
  const handles = () => !locked() && mode() === "on";

  // Free study hours per day, as Today's Plan counts them (availability, or daily hours less long class days); none on a day off
  function capMap(from, to){
    const out = {}, dh = dailyHours(); let AD = null, B = {m: {}};
    try { if (availActive()) AD = availDays(from, to); } catch (e) {}
    const keep = BUSY_CACHE; try { B = busyDays(from, to); } catch (e) {} finally { BUSY_CACHE = keep; }
    for (let d = from, i = 0; d <= to && i < 60; d = addDays(d, 1), i++) out[d] = dayIsOff(d) ? 0 : Math.min(dh * busyFactor(B.m[d] || 0), AD && AD[d] != null ? AD[d] : Infinity);
    return out;
  }
  function compute(only){
    const today = todayISO(), off = {};
    Object.keys(offMap()).forEach(d => { if (d >= today && offMap()[d]) off[d] = 1; });
    return AP.plan({today, tasks: tasksArr(), off, cap: capMap(today, addDays(today, AP.HORIZON + 21)), dh: dailyHours(), only,
      replanExam: ex => {
        const r = window.SBPREP && SBPREP.replanChanges ? SBPREP.replanChanges(ex.id) : null;
        if (!r) return {ok: false};
        const o = r.out || {};
        if (o.err || !r.changes.length) return {ok: false, warn: (o.warnings && o.warnings[0]) || ""};
        // Honest about a squeeze: the planner's own crash-plan and dropped-topic words
        return {ok: true, changes: r.changes, notes: (o.warnings || []).filter(w => /^Not enough time|crash plan/.test(w))};
      }});
  }
  // The fields that say whether an item was changed since Autopilot moved it
  const sig = t => t ? JSON.stringify(["due", "start", "status", "slot", "hours", "title", "prepFor", "breakdownOf", "type"].map(k => t[k] == null ? "" : t[k])) : "null";
  function apply(res){
    const before = [], seen = new Set();
    res.changes.forEach(c => { if (seen.has(c.id)) return; seen.add(c.id); before.push({kind: "task", id: c.id, after: clone(state.tasks[c.id] || null)}); });
    applyChanges(res.changes, "");
    const post = {}; before.forEach(b => { post[b.id] = sig(state.tasks[b.id]); });
    return {before, post};
  }
  const slim = m => ({id: m.id, title: String(m.title || "Untitled").slice(0, 90), from: m.from || "", to: m.to || "", why: String(m.why || "").slice(0, 120)});
  const slimS = s => ({title: String(s.title || "Untitled").slice(0, 90), text: String(s.text || "").slice(0, 200)});
  function record(kind, res, extra){
    const r = Object.assign({day: todayISO(), id: uid(), kind, n: res.moves.length, moves: res.moves.slice(0, 60).map(slim), short: res.short.slice(0, 12).map(slimS), seen: false, at: Date.now()}, extra || {});
    setCfg({run: r});
    return r;
  }
  function moveNow(res){
    const r = record("done", res);
    if (res.changes.length) { const u = apply(res); lsSet({id: r.id, before: u.before, post: u.post}); } else lsSet(null);
    scheduleRender();
    return r;
  }

  /* The daily run */
  let BOOT = Date.now(), BUSY = false;
  function tick(){
    if (BUSY) return;
    try {
      if (locked() || mode() === "off") return;
      const today = todayISO(), r = runRec();
      // Done for today (a proposal still waiting is applied once you switch to On)
      if (r && r.day === today && !(r.kind === "ask" && !r.seen && mode() === "on")) return;
      // Wait for the account's settings first, so a device that ran earlier today is seen
      const signedIn = typeof sbUser !== "undefined" && !!sbUser;
      // (and past the first seconds, when Pro can still be a remembered hint rather than the checked plan)
      if (signedIn && (Date.now() - BOOT < 12000 || (!(typeof cloud !== "undefined" && cloud.on) && Date.now() - BOOT < 45000))) return;
      BUSY = true;
      const res = compute("");
      if (mode() === "ask") { record("ask", res); scheduleRender(); }
      else moveNow(res);
    } catch (e) { console.warn("autopilot", e); } finally { BUSY = false; }
  }
  function applyProposal(){
    const res = compute("");
    if (!res.changes.length) { record("done", res, {seen: true}); lsSet(null); scheduleRender(); toast(res.short.length ? "Nothing can move right now without missing a deadline." : "Nothing needs moving now."); return; }
    const r = moveNow(res);
    if (dlg.open && dlg.querySelector(".ap-sheet")) dlg.close();
    toast(`Autopilot moved ${things(r.n)}.`, undo);
  }
  function undo(){
    const u = lsGet(), r = runRec();
    if (!u || !r || u.id !== r.id || r.undone) { toast("Undo isn't available on this device. Each change is listed in See What Changed."); return; }
    const back = [], kept = [];
    (u.before || []).forEach(b => { if (sig(state.tasks[b.id] || null) === u.post[b.id]) back.push(b); else kept.push(b.id); });
    if (back.length) applyChanges(back, null);
    lsSet(null);
    setCfg({run: Object.assign({}, r, {undone: true, seen: true})});
    if (dlg.open && dlg.querySelector(".ap-sheet")) dlg.close();
    scheduleRender();
    toast(kept.length ? `Undone, except ${things(kept.length)} you changed since.` : "Undone. Everything is back where it was.");
  }

  /* Today's Plan: one quiet line */
  function lineHtml(){
    try {
      const today = todayISO(), parts = [];
      if (dayIsOff(today)) parts.push(`<div class="ap-line ap-offday" role="status"><span class="ap-t"><b>Today is a day off.</b> Nothing is planned today.</span> <span class="ap-a"><button type="button" class="link-btn" data-act="ap-dayoff" data-id="${esc(today)}">Undo Day Off</button></span></div>`);
      const r = runRec();
      if (!locked() && r && r.day === today && !r.seen && !r.undone && (r.n || (r.short || []).length) && (r.kind === "ask" ? mode() === "ask" : true)) {
        const k = (r.short || []).length, sep = ` <span aria-hidden="true">·</span> `;
        let t, a;
        if (r.kind === "ask" && r.n) { t = `Autopilot can move ${things(r.n)} to fit your plan.`; a = `<button type="button" class="link-btn" data-act="ap-open">See What Changes</button>${sep}<button type="button" class="link-btn" data-act="ap-apply">Apply</button>${sep}<button type="button" class="link-btn" data-act="ap-dismiss">Not Now</button>`; }
        else if (r.n) { t = `Autopilot moved ${things(r.n)} ${new Date(r.at || 0).getHours() < 12 ? "last night" : "today"}.`; a = `<button type="button" class="link-btn" data-act="ap-open">See What Changed</button>${lsGet() && lsGet().id === r.id ? `${sep}<button type="button" class="link-btn" data-act="ap-undo">Undo</button>` : ""}`; }
        else { t = `Autopilot couldn't find time for ${things(k)} before ${k === 1 ? "its deadline" : "their deadlines"}.`; a = `<button type="button" class="link-btn" data-act="ap-open">See Why</button>`; }
        parts.push(`<div class="ap-line" role="status" data-kind="${esc(r.kind)}"><span class="ap-t">${esc(t)}</span> <span class="ap-a">${a}${r.kind === "ask" && r.n ? "" : `<button type="button" class="icon-btn sm" data-act="ap-dismiss" aria-label="Dismiss">${CLOSE}</button>`}</span></div>`);
      }
      return parts.join("");
    } catch (e) { console.warn("autopilot line", e); return ""; }
  }
  const offBtn = () => { const d = todayISO(), on = dayIsOff(d); return `<button type="button" class="pf-link ap-off-btn" data-act="ap-dayoff" data-id="${esc(d)}" aria-pressed="${on}">${on ? "Undo Day Off" : "Take Today Off"}</button>`; };
  // In the Calendar's day sheet (Crunch Forecast)
  function dayRow(date){
    if (!date || date < todayISO()) return "";
    const on = dayIsOff(date);
    return `<div class="ap-dayrow"><span class="mini">${on ? "A day off: no study time is planned, and it counts as a rest day." : "A day off plans no study time and counts as a rest day."}</span><button type="button" class="btn small" data-act="ap-dayoff" data-id="${esc(date)}" aria-pressed="${on}">${on ? "Undo Day Off" : "Take This Day Off"}</button></div>`;
  }

  /* See What Changed */
  const MODES = [["on", "On"], ["ask", "Ask Me First"], ["off", "Off"]];
  const modeSeg = () => `<div class="segb" role="group" aria-label="Autopilot">${MODES.map(([k, l]) => `<button type="button" data-act="ap-mode" data-id="${k}" aria-pressed="${mode() === k}">${l}</button>`).join("")}</div>`;
  function openChanges(){
    if (locked()) { proSheet(); return; }
    const r = runRec(), today = todayISO(), cur = r && r.day === today ? r : null, ask = !!(cur && cur.kind === "ask" && !cur.seen);
    const when = d => d ? fmtDate(d) : "";
    const moves = cur ? cur.moves || [] : [], short = cur ? cur.short || [] : [];
    const canUndo = !!(cur && cur.kind === "done" && !cur.undone && lsGet() && lsGet().id === cur.id);
    const lead = !cur ? "Nothing has run yet today. Autopilot runs once a day, the first time you open Studyboard." : cur.undone ? "Today's changes were undone." : ask ? "Nothing has moved yet. Apply to make these changes." : moves.length ? "Each change, and why. Real due dates, school sync and classes never move." : "Nothing needed moving today.";
    const rows = moves.map(m => `<li><b>${esc(m.title)}</b><span class="mini">${m.from && m.to ? `${esc(when(m.from))} → ${esc(when(m.to))}` : m.to ? `New on ${esc(when(m.to))}` : `Removed from ${esc(when(m.from))}`}</span><span class="mini">${esc(m.why)}</span></li>`).join("");
    const shorts = short.map(s => `<li><b>${esc(s.title)}</b><span class="mini">${esc(s.text)}</span></li>`).join("");
    openSheet(`<div class="sheet ap-sheet">${head(ask ? "What Would Change" : "What Changed")}<div class="sheet-body">
      <p class="mini" style="margin:0 0 10px">${esc(lead)}</p>
      ${rows && !(cur && cur.undone) ? `<ul class="ap-list">${rows}</ul>` : ""}
      ${shorts ? `<h3 class="fsec">Couldn't Fit</h3><ul class="ap-list">${shorts}</ul>` : ""}
      <div class="ap-mode"><span><b>Autopilot</b><span class="mini">On moves things for you. Ask Me First shows them here first.</span></span>${modeSeg()}</div>
    </div><div class="sheet-foot"><button type="button" class="btn" data-act="close">Close</button><span class="spacer"></span>${canUndo && moves.length ? `<button type="button" class="btn" data-act="ap-undo">Undo All</button>` : ""}${ask && moves.length ? `<button type="button" class="btn" data-act="ap-dismiss">Not Now</button><button type="button" class="btn primary" data-act="ap-apply">Apply</button>` : ""}</div></div>`);
    if (cur && cur.kind === "done" && !cur.seen) setCfg({run: Object.assign({}, cur, {seen: true})});
  }
  const proSheet = () => { if (typeof PLAN !== "undefined" && PLAN) PLAN.openSheet("Autopilot is part of Studyboard Pro: missed study sessions and steps move to your next free time overnight, and Today's Plan tells you once."); };

  /* Day Off */
  function toggleOff(date){
    const today = todayISO();
    if (!AP.isDate(date) || date < today) return;
    const cur = {}; Object.keys(offMap()).forEach(d => { if (d >= AP.add(today, -60) && offMap()[d]) cur[d] = 1; });
    const on = !cur[date];
    if (on) cur[date] = 1; else delete cur[date];
    state.settings = Object.assign({}, state.settings, {daysOff: cur}); saveSettings(); scheduleRender();
    try { offSaid(date, on); } finally { redrawDay(date); }
  }
  function offSaid(date, on){
    const today = todayISO(), label = date === today ? "Today" : fmtDate(date);
    if (!on) { toast(`${label} is a study day again.`); return; }
    const res = compute(date), n = res.moves.length;
    const here = res.moves.filter(m => m.from === date).length + res.short.length;
    if (!n && !res.short.length) { toast(`${label} is a day off. Nothing is planned that day.`); return; }
    if (!locked() && mode() === "on" && n) {
      const k = res.short.length;
      applyChanges(res.changes, `${label} is a day off. Moved ${things(n)} to other days.${k ? ` ${k === 1 ? `“${res.short[0].title}” couldn't move` : `${k} things couldn't move`} without missing a deadline.` : ""}`);
      return;
    }
    if (locked()) { toast(`${label} is a day off. ${things(here)} ${here === 1 ? "is" : "are"} still planned that day.`, null, {label: "Move Them", fn: proSheet}); return; }
    if (mode() === "ask" && n) { toast(`${label} is a day off. ${things(here)} ${here === 1 ? "is" : "are"} planned that day.`, null, {label: "Move Them", fn: () => { const r2 = compute(date); if (r2.changes.length) applyChanges(r2.changes, `Moved ${things(r2.moves.length)} to other days.`); redrawDay(date); }}); return; }
    toast(`${label} is a day off. ${things(here)} ${here === 1 ? "is" : "are"} still planned that day.`);
  }
  // The day sheet reads Today's Plan's numbers, which refresh on the next render: redraw it then
  let REDRAW = "";
  function redrawDay(date){ REDRAW = date; scheduleRender(); }
  hook("render", () => { if (!REDRAW) return; const d = REDRAW; REDRAW = ""; redrawNow(d); });
  function redrawNow(date){
    try {
      if (!dlg.open || !dlg.querySelector(".cr-sheet")) return;
      const b = document.createElement("button"); b.type = "button"; b.hidden = true; b.dataset.act = "cr-day"; b.dataset.id = date;
      document.body.appendChild(b); b.click(); b.remove();
    } catch (e) {}
  }

  /* Settings > Study */
  hook("menu", () => {
    if (locked()) return `<button type="button" data-act="ap-pro" data-group="study"><span>Autopilot ${PRO_BADGE}<span class="sub">Moves missed study sessions and steps into your next free time overnight, then tells you once.</span></span></button>`;
    return `<div class="cap-row sb-wide ap-set" data-group="study"><span style="flex:1;font-weight:600;min-width:12rem">Autopilot<span class="sub">Once a day, moves missed prep sessions, milestones and Study tasks into your next free time before their deadlines, then tells you once on Today's Plan. Real due dates never move.</span></span>${modeSeg()}</div>`;
  });
  hook("act", (act, el, id) => {
    if (!act || act.slice(0, 3) !== "ap-") return false;
    switch (act) {
      case "ap-open": openChanges(); return true;
      case "ap-pro": proSheet(); return true;
      case "ap-undo": undo(); return true;
      case "ap-apply": if (locked()) { proSheet(); return true; } applyProposal(); return true;
      case "ap-dismiss": { const r = runRec(); if (r) setCfg({run: Object.assign({}, r, {seen: true})}); if (dlg.open && dlg.querySelector(".ap-sheet")) dlg.close(); scheduleRender(); return true; }
      case "ap-dayoff": toggleOff((el && el.dataset.id) || id || todayISO()); return true;
      case "ap-mode": {
        if (locked()) { proSheet(); return true; }
        const m = (el && el.dataset.id) || id; if (!({on: 1, ask: 1, off: 1})[m]) return true;
        setCfg({mode: m});
        if (m === "on") setTimeout(tick, 0);
        document.querySelectorAll('[data-act="ap-mode"]').forEach(b => b.setAttribute("aria-pressed", String(b.dataset.id === m)));
        scheduleRender();
        toast(m === "on" ? "Autopilot is on. It runs once a day, the first time you open Studyboard." : m === "ask" ? "Autopilot will ask before moving anything." : "Autopilot is off. Catch Up cards are back on Today's Plan.");
        return true;
      }
    }
    return false;
  });
  hook("boot", () => {
    BOOT = Date.now();
    setTimeout(tick, 3000); setTimeout(tick, 13000);
    setInterval(tick, 60000);
    document.addEventListener("visibilitychange", () => { if (!document.hidden) setTimeout(tick, 1500); });
  });
  if (window.SBPRO) SBPRO.addFeature({id: "autopilot", name: "Autopilot", where: "On Today's Plan: missed sessions and steps move overnight. Settings, Study.", act: "ap-open", icon: '<path d="M3 12h4l3-8 4 16 3-8h4"/>'});
  SBAUTOPILOT = {handles, lineHtml, offBtn, dayRow, open: openChanges, run: tick, compute, toggleOff, core: AP};
  window.SBAUTOPILOT = SBAUTOPILOT;
})();
