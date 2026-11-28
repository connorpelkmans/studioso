/* ===== module: 01-wrap-up.js: Wrap Up Today ===== */
/* A calm close to the study day. In the last hour of the study day (studyDay()), or once today's plan is all done, one quiet row
   appears at the bottom of Today's Plan: "Wrap up today". It's never a popup or toast, and isn't shown on a day off.
   Its sheet shows what got done (tasks finished, focus time), each unfinished item that was planned today with Tomorrow / Pick a Day /
   Let It Go, one choice of tomorrow's first task, and an optional "on my mind" line kept as a note.
   - Tomorrow and the first task reuse the timeline pins (task.pins, 01-plan-move.js): no time left today ({date, s: 0, e: 0}) and a
     pinned block at tomorrow's free time. Pick a Day pins a block on that day and moves the task's start there. Let It Go only takes
     away today's plan time; it never deletes or changes the task otherwise.
   - The first task also gets task.firstOn = tomorrow's date: Do This Next (nextUp, 01-next-up.js) shows it first that day until a
     focus session on it, even after its pinned block has passed.
   - Everything is one step: one Undo puts the tasks, the note and the "wrapped up" mark back.
   - After wrapping up the row says "Wrapped up. See you tomorrow." and stays quiet. Settings > Study Plan turns the row off.
   The settings live in state.settings.wrapUp ({off, day, at}), so they sync. Which items were planned today is remembered on this
   device as the day goes (by the evening the plan has no time left to give them). The pure parts sit between WRAPUP-START and
   WRAPUP-END so tests/wrap-up.test.js can run them in Node. */
/*WRAPUP-START*/
const WRAPUP = (() => {
  const isDay = s => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
  const round5 = m => Math.round(m / 5) * 5;
  /* What the row at the bottom of Today's Plan is: "" (nothing), "open" (Wrap up today) or "done" (Wrapped up).
     o: {on, off (a day off), sd: {date, night, past, left}, wrapped (the day last wrapped up), planLeft (plan items with time
     left today), did (tasks finished or focus minutes today), open (open tasks)} */
  function rowState(o){
    if (!o || !o.on || o.off || !o.sd) return "";
    const sd = o.sd;
    if (o.wrapped && o.wrapped === sd.date) return "done";
    if (sd.night) return "";
    if (!o.open && !o.did) return "";
    const lastHour = sd.past || sd.left <= 60;
    const allDone = !(o.planLeft > 0) && !!o.did;
    return lastHour || allDone ? "open" : "";
  }
  // A task's pins after a wrap-up choice. kind: "tomorrow", "day" or "go"; date: the plan day; slot: {date, s, e} or null.
  // Today's pins go (a "no time today" pin takes their place), and a block is pinned on the new day when one fits.
  const overlaps = (p, s, e) => p.e > p.s && p.s < e && p.e > s;
  function movePins(pins, kind, date, slot){
    let l = (Array.isArray(pins) ? pins : []).filter(p => p && p.date !== date);
    if (slot) l = l.filter(p => !(p.date === slot.date && (overlaps(p, slot.s, slot.e) || (p.s === 0 && p.e === 0))));
    l.push({date, s: 0, e: 0});
    if (slot && kind !== "go") l.push({date: slot.date, s: slot.s, e: slot.e});
    return l.sort((a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : a.s - b.s);
  }
  // The task after a wrap-up choice (a new object; the task passed in is not changed).
  // c: {kind: "tomorrow" | "day" | "go" | "", first: bool, date, nd (tomorrow), day (Pick a Day), slot}
  function moveTask(t, c){
    const n = Object.assign({}, t);
    if (c.first) n.firstOn = c.nd;
    const kind = c.first && (c.kind === "day" || !c.kind) ? "tomorrow" : c.kind;
    if (!kind) return n;
    n.pins = movePins(t.pins, kind, c.date, c.slot || null);
    // Pick a Day: the task starts that day, so the planner leaves it until then (unless its deadline needs it sooner)
    // (not for an exam or quiz: its "Study for" time is pinned on it, and its start means something else)
    if (kind === "day" && isDay(c.day) && !c.first && t.type !== "Exam" && t.type !== "Quiz" && !(t.start && t.start >= c.day) && !(t.due && c.day > t.due)) n.start = c.day;
    return n;
  }
  // Blocks for tomorrow, one after another from the start of the free time: lens [{id, len}] in order, busy [{s, e}] (classes,
  // events, other pins). Each block keeps a gap of brk minutes from the last. snap is AVAIL.snap.
  function layDay(lens, busy, lo, hi, brk, snap){
    const fixed = (busy || []).slice(), out = {};
    lens.forEach(o => {
      const w = snap(lo, o.len, fixed, lo, hi);
      if (!w) return;
      out[o.id] = {s: w.s, e: w.e};
      fixed.push({s: w.s - brk, e: w.e + brk});
    });
    return out;
  }
  // A block's length for tomorrow: what the plan gave it today, else its work left, kept between 15 minutes and an hour
  const blockLen = (planned, leftH) => Math.max(15, Math.min(60, round5(planned > 0 ? planned : leftH > 0 ? leftH * 60 : 30)));
  // Pick a Day's choices: tomorrow at the earliest, the due date at the latest (or two weeks out)
  function dayRange(nd, due){
    const max = isDay(due) && due >= nd ? due : "";
    return {min: nd, max};
  }
  // Was the first-tomorrow task worked on (a focus session) since the day started? Then it stops leading Do This Next.
  const workedSince = (history, from) => (Array.isArray(history) ? history : []).some(h => h && h.at >= from && /^Focus session/.test(h.text || ""));
  // Is this task the one chosen to go first on date?
  const isFirst = (host, date, dayStartMs) => !!host && host.status !== "done" && host.firstOn === date && !workedSince(host.history, dayStartMs);
  // What got done today: tasks finished between from and to (ms)
  const doneBetween = (tasks, from, to) => (tasks || []).filter(t => t && t.status === "done" && Number(t.doneAt) >= from && Number(t.doneAt) <= to);
  return {rowState, movePins, moveTask, layDay, blockLen, dayRange, workedSince, isFirst, doneBetween};
})();
/*WRAPUP-END*/

const WRAP_SEEN = "studyboard:wrap:seen";
const wrapCfg = () => (state.settings && state.settings.wrapUp) || {};
function wrapSetCfg(patch){
  const next = Object.assign({}, wrapCfg(), patch);
  Object.keys(next).forEach(k => { if (next[k] === undefined) delete next[k]; });
  state.settings = Object.assign({}, state.settings, {wrapUp: next});
  saveSettings();
}
const wrapOn = () => !wrapCfg().off;
const wrapDayStart = date => parse(date).getTime();
// Do This Next: the task chosen as tomorrow's first goes first on that day (01-next-up.js asks)
function wrapFirst(t){
  try {
    if (!t || t.gt || !wrapOn()) return false;
    const h = state.tasks[t.xs ? t.xs.id : t.id]; if (!h || !h.firstOn) return false;
    const date = studyDay().date;
    return WRAPUP.isFirst(h, date, wrapDayStart(date));
  } catch (e) { return false; }
}

const SBDAYWRAP = (() => {
  const MOON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/></svg>`;
  const TICK = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>`;
  const CHEV = `<svg class="wu-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>`;
  const lsGet = () => { try { return JSON.parse(localStorage.getItem(WRAP_SEEN) || "null") || {}; } catch (e) { return {}; } };
  const lsSet = v => { try { localStorage.setItem(WRAP_SEEN, JSON.stringify(v)); } catch (e) {} };
  // Remember what the plan gave time today (minutes per plan item), so the evening still knows
  function remember(F, date){
    const s = lsGet(), m = s.date === date ? Object.assign({}, s.m) : {};
    let changed = s.date !== date;
    F.ranked.forEach(x => { if (x.alloc > 0 && !x.fixed) { const v = Math.round(x.alloc * 60); if (!(m[x.t.id] >= v)) { m[x.t.id] = v; changed = true; } } });
    if (changed) lsSet({date, m});
    return m;
  }
  const minutesToday = date => { try { return typeof SBSTATS !== "undefined" ? Math.round(SBSTATS.focusMinutes(date, date)) : 0; } catch (e) { return 0; } };
  const doneToday = date => WRAPUP.doneBetween(tasksArr(), wrapDayStart(date), Date.now());
  function rowOf(F){
    const sd = F.sd || studyDay(), date = sd.date;
    const planLeft = F.ranked.filter(x => x.alloc > 0 && !x.fixed).length;
    const did = doneToday(date).length > 0 || minutesToday(date) > 0;
    return {sd, st: WRAPUP.rowState({on: wrapOn(), off: dayIsOff(date), sd, wrapped: wrapCfg().day, planLeft, did, open: tasksArr().some(t => t.status !== "done")})};
  }
  // The quiet row at the bottom of Today's Plan
  function rowHtml(F){
    try {
      if (!F || !F.ranked) return "";
      const r = rowOf(F);
      if (wrapOn()) remember(F, r.sd.date);
      if (r.st === "done") return `<p class="wu-row wu-done" role="status">${TICK}<span>Wrapped up. See you tomorrow.</span></p>`;
      if (r.st !== "open") return "";
      return `<button type="button" class="wu-row wu-open" data-act="wrap-open">${MOON}<span class="wu-t">Wrap up today</span>${CHEV}</button>`;
    } catch (e) { console.warn("wrap up", e); return ""; }
  }

  /* -- The sheet */
  let W = null;
  // Each unfinished item that was planned today: what the plan gave it today (remembered), what still has time, and what's pinned today
  function items(F, date){
    const seen = lsGet(), m = seen.date === date ? seen.m || {} : {}, out = [], hosts = new Set();
    const ids = new Set(Object.keys(m));
    F.ranked.forEach(x => { if (x.alloc > 0) ids.add(x.t.id); });
    Object.values(F.info).forEach(x => { const h = planPinHost(x.t); if (h && (h.pins || []).some(p => p.date === date && p.e > p.s)) ids.add(x.t.id); });
    ids.forEach(id => {
      const x = F.info[id]; if (!x || x.fixed || x.dead || x.t.status === "done") return;
      const h = planPinHost(x.t); if (!h || hosts.has(h.id)) return;
      // already moved off today (Move To… Tomorrow, or an earlier wrap-up)
      if ((h.pins || []).some(p => p.date === date && p.s === 0 && p.e === 0)) return;
      hosts.add(h.id);
      out.push({id, host: h.id, title: x.t.title, courseId: x.t.courseId || h.courseId || "", due: h.due || "", len: WRAPUP.blockLen(m[id] || Math.round((x.alloc || 0) * 60), x.R), rank: F.ranked.indexOf(x)});
    });
    return out.sort((a, b) => (a.rank < 0 ? 1e9 : a.rank) - (b.rank < 0 ? 1e9 : b.rank));
  }
  // Choices for tomorrow's first task: today's unfinished items, then the top of the plan
  function firstChoices(F, list){
    const out = list.map(o => ({host: o.host, id: o.id, title: o.title, courseId: o.courseId, len: o.len})), have = new Set(out.map(o => o.host));
    F.ranked.forEach(x => {
      if (out.length >= 5 || x.fixed || x.dead || x.t.gt || !canDoNow(x.t)) return;
      const h = planPinHost(x.t); if (!h || have.has(h.id)) return;
      have.add(h.id); out.push({host: h.id, id: x.t.id, title: x.t.title, courseId: x.t.courseId || h.courseId || "", len: WRAPUP.blockLen(Math.round((x.alloc || 0) * 60), x.R)});
    });
    return out.slice(0, Math.max(5, list.length));
  }
  const courseTxt = id => { const c = courseOf(id); return c ? courseLabel(c) : ""; };
  const dot = id => `<span class="wu-dot" style="background:${esc(colorOf(id))}" aria-hidden="true"></span>`;
  const longDay = d => parse(d).toLocaleDateString(undefined, {weekday: "long", month: "long", day: "numeric"});
  const MOVES = [["tomorrow", "Tomorrow"], ["day", "Pick a Day"], ["go", "Let It Go"]];
  function itemHtml(o, i){
    const r = WRAPUP.dayRange(W.nd, o.due), c = courseTxt(o.courseId);
    return `<li class="wu-it" data-i="${i}">${dot(o.courseId)}<span class="wu-li"><b>${esc(o.title)}</b><span class="mini">${esc([c, o.due ? "due " + fmtDate(o.due) : ""].filter(Boolean).join(" · "))}</span></span>
      <span class="wu-seg" role="group" aria-label="${esc("What happens to " + o.title)}">${MOVES.map(([k, l]) => `<button type="button" class="wu-mv" data-act="wrap-move" data-i="${i}" data-k="${k}" aria-pressed="${o.move === k}">${l}</button>`).join("")}</span>
      <label class="wu-day"${o.move === "day" ? "" : " hidden"}><span class="mini">Day</span><input type="date" data-wu-day="${i}" min="${r.min}"${r.max ? ` max="${r.max}"` : ""} value="${esc(o.day || "")}"></label></li>`;
  }
  function body(){
    const done = doneToday(W.date), mins = minutesToday(W.date);
    let h = `<p class="wu-date">${esc(longDay(W.date))}</p>`;
    h += `<section class="wu-sec"><h3>What got done</h3>`;
    if (done.length || mins) {
      h += `<p class="wu-big">${done.length ? `<b>${done.length}</b> task${done.length === 1 ? "" : "s"} finished` : "No tasks finished"}${mins ? `<span class="wu-plus"> · <b>${esc(fmtMins(mins))}</b> of focus</span>` : ""}</p>`;
      if (done.length) h += `<ul class="wu-list wu-donelist">${done.slice(0, 5).map(t => `<li>${dot(t.courseId)}<span class="wu-li"><span>${esc(t.title)}</span><span class="mini">${esc(courseTxt(t.courseId))}</span></span></li>`).join("")}${done.length > 5 ? `<li class="mini">and ${done.length - 5} more</li>` : ""}</ul>`;
    } else h += `<p>A quiet day. That happens, and tomorrow is a fresh start.</p>`;
    h += `</section><section class="wu-sec"><h3>Still open from today</h3>`;
    if (W.items.length) h += `<p class="mini wu-lead">Choose for each one, or leave it and Studyboard plans it as usual. Let It Go only clears today's plan time.</p><ul class="wu-list wu-open">${W.items.map(itemHtml).join("")}</ul>`;
    else h += `<p>Everything planned for today is done. Nice work.</p>`;
    h += `</section><section class="wu-sec"><h3 id="wuFirstH">First thing tomorrow</h3>`;
    if (W.first.length) h += `<p class="mini wu-lead">It will be your Do This Next tomorrow.</p><div class="wu-first" role="radiogroup" aria-labelledby="wuFirstH">${[{host: "", title: "Let Studyboard choose"}].concat(W.first).map(o => `<label class="wu-radio"><input type="radio" name="wuFirst" value="${esc(o.host)}"${W.pick === o.host ? " checked" : ""}>${o.host ? dot(o.courseId) : ""}<span>${esc(o.title)}${o.host && courseTxt(o.courseId) ? `<span class="mini"> · ${esc(courseTxt(o.courseId))}</span>` : ""}</span></label>`).join("")}</div>`;
    else h += `<p>Nothing is waiting for tomorrow yet.</p>`;
    h += `</section><section class="wu-sec"><h3><label for="wuNote">On my mind</label></h3><input id="wuNote" class="wu-note" type="text" maxlength="200" autocomplete="off" placeholder="Anything to remember? It's kept as a note." value="${esc(W.note || "")}" data-noenter></section>`;
    return h;
  }
  function open(){
    const F = FOCUS || computeFocus(), sd = F.sd || studyDay(), date = sd.date;
    remember(F, date);
    const list = items(F, date).map(o => Object.assign(o, {move: "", day: ""}));
    W = {date, nd: addDays(date, 1), items: list, first: firstChoices(F, list), pick: "", note: ""};
    if (dlg.open) dlg.close();
    openSheet(`<div class="sheet wu-sheet">${head("Wrap Up Today")}<div class="sheet-body wu-body"></div>
      <div class="sheet-foot"><span class="spacer"></span><button type="button" class="btn primary" data-act="wrap-done">Wrap Up</button></div></div>`);
    draw();
  }
  function draw(){ const b = dlg.querySelector(".wu-body"); if (b && W) b.innerHTML = body(); }
  // A choice for one item: tap again to leave it to the plan
  function setMove(i, k){
    const o = W && W.items[i]; if (!o) return;
    o.move = o.move === k ? "" : k;
    if (o.move === "day" && !o.day) { const r = WRAPUP.dayRange(W.nd, o.due), d2 = addDays(W.nd, 1); o.day = r.max && d2 > r.max ? r.max : d2; }
    const li = dlg.querySelector(`.wu-it[data-i="${i}"]`); if (!li) return;
    li.querySelectorAll(".wu-mv").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.k === o.move)));
    const lab = li.querySelector(".wu-day"), inp = lab && lab.querySelector("input");
    if (lab) lab.hidden = o.move !== "day";
    if (inp && o.move === "day") inp.value = o.day;
  }
  // Free time tomorrow, and what's pinned there already, for the new blocks
  function tomorrowSlots(lens){
    try {
      const r = availFreeDay(W.nd, null); if (r.none) return {};
      const busy = (r.busy || []).filter(m => m.kind !== "done").map(m => ({s: m.s, e: m.e}));
      tasksArr().forEach(t => (t.pins || []).forEach(p => { if (p.date === W.nd && p.e > p.s && !lens.some(o => o.id === t.id)) busy.push({s: p.s, e: p.e}); }));
      const brk = (availState().cfg || {}).breakMin || 10;
      return WRAPUP.layDay(lens, busy, r.ws, r.we, brk, AVAIL.snap);
    } catch (e) { console.warn("wrap up tomorrow", e); return {}; }
  }
  function daySlot(day, len){
    try { const r = availFreeDay(day, null); if (r.none) return null; const w = AVAIL.snap(r.ws, len, r.busy, r.ws, r.we); return w ? {date: day, s: w.s, e: w.s + len} : null; } catch (e) { return null; }
  }
  function finish(){
    if (!W) return;
    const w = W, noteEl = dlg.querySelector("#wuNote"), note = noteEl ? noteEl.value.trim().slice(0, 200) : "";
    dlg.querySelectorAll("[data-wu-day]").forEach(inp => { const o = w.items[+inp.dataset.wuDay]; if (o && /^\d{4}-\d{2}-\d{2}$/.test(inp.value)) o.day = inp.value < w.nd ? w.nd : inp.value; });
    const pickEl = dlg.querySelector('input[name="wuFirst"]:checked'), first = pickEl ? pickEl.value : "";
    const by = {}; w.items.forEach(o => { by[o.host] = o; });
    // tomorrow's blocks: the first task first, then each item moved to tomorrow, in the plan's order
    const lens = [];
    if (first) { const f = w.first.find(o => o.host === first); lens.push({id: first, len: f ? f.len : 30}); }
    w.items.forEach(o => { if (o.move === "tomorrow" && o.host !== first) lens.push({id: o.host, len: o.len}); });
    const slots = tomorrowSlots(lens);
    const changes = [];
    const hosts = new Set(w.items.filter(o => o.move).map(o => o.host)); if (first) hosts.add(first);
    hosts.forEach(id => {
      const t = state.tasks[id]; if (!t) return;
      const o = by[id] || {move: ""}, isF = id === first;
      const kind = isF && (o.move === "day" || !o.move) ? "tomorrow" : o.move;
      const slot = kind === "tomorrow" ? (slots[id] ? Object.assign({date: w.nd}, slots[id]) : null) : kind === "day" ? daySlot(o.day || w.nd, o.len) : null;
      const n = WRAPUP.moveTask(t, {kind: o.move, first: isF, date: w.date, nd: w.nd, day: o.day, slot});
      changes.push({kind: "task", id, after: n});
    });
    if (note) {
      const all = notesArr().filter(n => !n.archived && noteBoardOf(n) === noteBoardId()), z = all.reduce((m, n) => Math.max(m, n.z || 0), 0) + 1, col = all.length % 5, row = Math.floor(all.length / 5) % 4;
      const nn = normNote({id: uid(), board: noteBoardId(), text: `On my mind, ${fmtDate(w.date)}\n${note}`, color: "yellow", x: 40 + col * (NOTE_W() + 30), y: 40 + row * 240, z, rot: 0, courseId: "", created: Date.now()});
      changes.push({kind: "note", id: nn.id, after: nn});
    }
    // Essentials: the note brings the Notes tab back (with its "new" dot); this toast says where it went, so the toast with Undo stays up
    let toNotes = false;
    if (note) { try { if (SBESS.on() && !SBESS.shows("notes")) { SBESS.said("unlock:notes", true); SBESS.unlock("notes", {by: "note"}); toNotes = true; } } catch (e) {} }
    const label = "Wrapped up today" + (first ? `. ${(state.tasks[first] || {}).title || "Your pick"} is first tomorrow` : "") + (toNotes ? ". Your note is in Notes, now in the menu" : "");
    const before = Object.assign({}, wrapCfg());
    let step = null;
    if (changes.length) { applyChanges(changes, label, null, {quiet: true}); step = applyChanges.last; }
    wrapSetCfg({day: w.date, at: Date.now()});
    // One Undo for all of it: the tasks, the note and the "wrapped up" mark. The toast's Undo and Ctrl+Z both run it, once.
    const inner = step && step.undo, own = step || {label, at: Date.now(), done: false, quiet: true};
    const undo = () => {
      if (own.undone) return 0; own.undone = true;
      const kept = inner ? inner() : 0;
      own.done = true;
      if (wrapCfg().day === w.date) wrapSetCfg({day: before.day, at: before.at});
      focusStale(); scheduleRender();
      toast(kept ? "Undone: wrap-up. Changes you made after it were kept." : "Undone: wrap-up");
      return kept;
    };
    own.undo = undo;
    if (!step) { undoStack.push(own); if (undoStack.length > 20) undoStack.shift(); }
    W = null;
    if (dlg.open) dlg.close();
    scheduleRender();
    toast(label, undo);
  }
  dlg.addEventListener("close", () => { W = null; });
  // Pick a Day's date box
  dlg.addEventListener("change", e => {
    const inp = e.target && e.target.closest && e.target.closest("[data-wu-day]"); if (!inp || !W) return;
    const o = W.items[+inp.dataset.wuDay]; if (o && /^\d{4}-\d{2}-\d{2}$/.test(inp.value)) o.day = inp.value;
  });

  /* -- Settings > Study Plan */
  hook("menu", () => `<div class="cap-row sb-wide" data-group="study" data-us-key="wrap-toggle"><span style="flex:1;font-weight:600;min-width:12rem">Wrap Up Today<span class="sub">A quiet row at the end of Today's Plan in the last hour of your study day: what got done, where the rest goes, and tomorrow's first task.</span></span><button type="button" class="btn small" data-act="wrap-now">Wrap Up Now</button><label class="anim-tog"><input type="checkbox" data-act="wrap-toggle" ${wrapOn() ? "checked" : ""}> On</label></div>`);

  hook("act", (act, el) => {
    switch (act) {
      case "wrap-open": open(); return true;
      case "wrap-now": open(); return true;
      case "wrap-move": setMove(+el.dataset.i, el.dataset.k); return true;
      case "wrap-done": finish(); return true;
      case "wrap-toggle": {
        const on = !!el.checked;
        wrapSetCfg({off: on ? undefined : true});
        focusStale(); scheduleRender();
        toast(on ? "Wrap Up Today is on" : "Wrap Up Today is off", () => { wrapSetCfg({off: on ? true : undefined}); const i = document.querySelector('[data-act="wrap-toggle"]'); if (i) i.checked = !on; scheduleRender(); });
        return true;
      }
    }
    return false;
  });
  return {rowHtml, open, rowOf: F => rowOf(F || FOCUS || computeFocus()).st, isFirst: wrapFirst};
})();
window.SBDAYWRAP = SBDAYWRAP;
// For tests: the pure parts, and a way to change a setting (a day off)
if (window.__SB_TEST) window.__sbWrap = Object.assign({setting: (k, v) => { state.settings = Object.assign({}, state.settings, {[k]: v}); saveSettings(); focusStale(); scheduleRender(); }}, WRAPUP);
