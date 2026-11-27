/* ===== module: 01-plan-move.js: move study blocks on Today's Plan's time strip ===== */
/* A study block on the strip can be dragged to another time (mouse: press and drag; touch: long-press, then drag), or moved with its
   Move To… menu (times that fit, Tomorrow, Let Studyboard Pick), which also serves keyboard and screen-reader users.
   Classes, events and availability blocks are fixed: a drop that overlaps one snaps to the nearest free time and says so.
   A moved block is pinned for its day on the task (task.pins = [{date, s, e}], minutes from the plan day's midnight, cleaned in normTask);
   availPlan() (01-courses.js) keeps pinned blocks where they are and plans the rest around them, so Do This Next, the strip and the
   widgets all agree. Let Studyboard Pick removes the pin. Each move is one step with Undo (applyChanges). */
const PM_PIN = `<svg class="dtl-pin" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M15.2 2.6a1 1 0 0 1 1.4 0l4.8 4.8a1 1 0 0 1-.3 1.6l-2.9 1.3-3.3 3.3.4 3.6a1 1 0 0 1-.3.8l-1.2 1.2a1 1 0 0 1-1.4 0l-3.5-3.5-4.6 4.6a1 1 0 1 1-1.4-1.4l4.6-4.6-3.5-3.5a1 1 0 0 1 0-1.4L5.2 8a1 1 0 0 1 .8-.3l3.6.4 3.3-3.3L14.2 2.9a1 1 0 0 1 1-.3z"/></svg>`;
const PM_MORE = `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>`;
// A movable study block on the strip: the card itself opens the task (a button over the whole card), and its ⋯ button opens Move To…
function planMoveCard(x, o){
  const id = x.t.id, title = x.t.title, c = colorOf(x.t.courseId);
  return `<div class="${o.cls} tk pm-card${o.hero ? " next" : ""}${x.pin ? " pinned" : ""}" data-mv="${esc(id)}" data-s="${x.s}" data-e="${x.e}" data-min="${Math.round(x.min || x.e - x.s)}" style="--c:${esc(c)};--cb:${esc(courseSolid(c))};--m:${x.e - x.s}"${o.at}>`
    + `<span class="dtl-t">${x.pin ? PM_PIN : ""}${dtlWhen(o.when)}</span><b class="dtl-n">${esc(title)}</b><span class="dtl-m"><span>${esc(o.len)}</span>${o.on ? `<span class="dtl-badge">Now</span>` : o.hero ? `<span class="dtl-badge">Next</span>` : ""}</span>`
    + `<button type="button" class="dtl-open" ${gtOpenAttrs(x.t)} aria-label="${esc(title)}, ${esc(o.when)}${x.pin ? ", pinned" : ""}"></button>`
    + `<button type="button" class="dtl-mv" data-pm="${esc(id)}" aria-haspopup="menu" aria-expanded="false" aria-label="Move ${esc(title)}" title="Move To…">${PM_MORE}</button></div>`;
}

const PLAN_MOVE = (() => {
  const round5 = m => Math.round(m / 5) * 5;
  const itemOf = id => { const F = FOCUS || computeFocus(); return F && F.info ? F.info[id] : null; };
  const titleOf = id => { const x = itemOf(id); return x && x.t ? x.t.title : "this"; };
  // What can't move under a block of task id today: classes, events and availability blocks (with travel), other tasks' pinned
  // blocks, and the time before now. lo..hi is the rest of the study day.
  function ctx(id){
    const F = FOCUS || computeFocus(), a = F && F.avail, sd = (F && F.sd) || studyDay();
    const fixed = (a && a.res ? a.res.busy : []).filter(m => m.kind !== "done").map(m => ({s: m.s, e: m.e, title: m.title, kind: m.kind}));
    ((a && a.slots) || []).forEach(sl => { if (sl.pin && sl.id !== id) fixed.push({s: sl.s, e: sl.e, title: titleOf(sl.id), kind: "pin"}); });
    return {F, sd, fixed, lo: Math.max(sd.start, Math.ceil(Math.max(sd.now, sd.start) / 5) * 5), hi: sd.end, date: sd.date};
  }
  // One line on why a drop landed somewhere else
  const why = (hit, title, s, e) => hit ? (hit.kind === "pin" ? `${hit.title} is pinned there, so ${title} moved to the nearest free time, ${availRange(s, e)}`
    : `${hit.title} is fixed, so ${title} moved to the nearest free time, ${availRange(s, e)}`) : "";
  // Save new pins for the task behind plan item id. Returns false when it can't be pinned.
  function savePins(id, fn, label){
    const x = itemOf(id), host = x && planPinHost(x.t); if (!host) return false;
    const before = Array.isArray(host.pins) ? host.pins : [], next = normPins(fn(before.slice()));
    if (SyncMerge.eq(before, next)) return false;
    const after = Object.assign({}, host, {pins: next}); if (!next.length) delete after.pins;
    applyChanges([{kind: "task", id: host.id, after}], label);
    return true;
  }
  const overlaps = (p, s, e) => p.e > p.s && p.s < e && p.e > s;
  // Pin block [s0, e0) of item id at s..e today (replacing the pins it had there, and a "moved off today" pin)
  function moveTo(id, s0, e0, s, e, label){
    const date = ctx(id).date;
    return savePins(id, l => l.filter(p => p.date !== date || !(overlaps(p, s0, e0) || (p.s === 0 && p.e === 0))).concat([{date, s, e}]), label);
  }
  // Let Studyboard Pick: the block's pin goes and the planner places it again
  function unpin(id, s0, e0){
    const date = ctx(id).date, t = titleOf(id);
    return savePins(id, l => l.filter(p => p.date !== date || !overlaps(p, s0, e0)), `Studyboard will pick the time for ${t}`);
  }
  // Tomorrow: nothing for it today, and a pinned block tomorrow at the free time nearest the same time of day (when one fits)
  function tomorrow(id, len, s0){
    const date = ctx(id).date, nd = addDays(date, 1), t = titleOf(id);
    let w = null; try { const r = availFreeDay(nd, null); if (!r.none) w = AVAIL.snap(s0 == null ? r.ws : s0, len, r.busy, r.ws, r.we); } catch (e) {}
    const add = [{date, s: 0, e: 0}].concat(w ? [{date: nd, s: w.s, e: w.s + len}] : []);
    return savePins(id, l => l.filter(p => p.date !== date && !(w && p.date === nd && overlaps(p, w.s, w.s + len))).concat(add),
      w ? `Moved ${t} to tomorrow, ${availRange(w.s, w.s + len)}` : `Moved ${t} to tomorrow`);
  }
  // Times a block of len minutes fits today: the start of each free gap, then on the hour inside long gaps (up to 6)
  function fits(id, len, s0){
    const c = ctx(id), f = AVAIL.mergeIv(c.fixed), out = [];
    let cur = c.lo;
    f.concat([{s: c.hi, e: c.hi}]).forEach(x => {
      const g0 = Math.ceil(cur / 5) * 5, g1 = Math.min(x.s, c.hi);
      if (g1 - g0 >= len) { out.push(g0); for (let h = Math.ceil((g0 + 1) / 60) * 60; h + len <= g1; h += 60) if (h - g0 >= 30) out.push(h); }
      cur = Math.max(cur, x.e);
    });
    return out.filter(s => s !== s0).slice(0, 6).map(s => ({s, e: s + len}));
  }
  return {ctx, why, moveTo, unpin, tomorrow, fits, titleOf, round5};
})();

/* -- Drag along the strip */
(() => {
  let P = null, D = null, swallow = 0;
  const cardOf = el => el && el.closest ? el.closest(".dtl-c.pm-card[data-mv]") : null;
  // Every card's place on the rail (in the rail's scrolled content) and its times, measured once when the drag starts
  function layout(rail){
    const rr = rail.getBoundingClientRect();
    return [...rail.querySelectorAll(".dtl-c[data-s]")].map(el => { const r = el.getBoundingClientRect(); return {el, l: r.left - rr.left + rail.scrollLeft, w: r.width, s: +el.dataset.s, e: +el.dataset.e}; }).sort((a, b) => a.l - b.l);
  }
  // The time at a point on the rail: cards are sized by length but not to scale, so it's read off the card under it
  function timeAt(L, cx){
    for (const it of L) { if (cx < it.l) return it.s; if (cx <= it.l + it.w) return it.s + (cx - it.l) / Math.max(1, it.w) * (it.e - it.s); }
    return L.length ? L[L.length - 1].e : 0;
  }
  function xAt(L, t){
    for (const it of L) if (t < it.e) return it.l + Math.max(0, t - it.s) / Math.max(1, it.e - it.s) * it.w;
    return L.length ? L[L.length - 1].l + L[L.length - 1].w : 0;
  }
  function start(card, x){
    const rail = card.closest(".dtl-rail"), wrap = card.closest(".dtl"); if (!rail || !wrap) return;
    const id = card.dataset.mv, L = layout(rail), me = L.find(it => it.el === card);
    const ind = document.createElement("div"); ind.className = "pm-ind"; ind.setAttribute("aria-hidden", "true"); ind.innerHTML = `<i></i><span></span>`;
    wrap.appendChild(ind);
    D = {card, rail, wrap, ind, L, id, x0: x, x, sl0: rail.scrollLeft, l0: me ? me.l : 0, len: +card.dataset.min || (+card.dataset.e - +card.dataset.s), s0: +card.dataset.s, e0: +card.dataset.e, c: PLAN_MOVE.ctx(id), sn: null};
    // body.sorting holds back redraws while dragging (scheduleRender waits), so the block being dragged stays put
    card.classList.add("pm-drag"); rail.classList.add("pm-on"); wrap.classList.add("pm-on"); document.body.classList.add("sorting");
    try { sbHaptic("lift", {force: true}); } catch (e) {}
    update(x); D.raf = requestAnimationFrame(edge);
  }
  function update(x){
    if (!D) return;
    D.x = x;
    const dx = x - D.x0 + (D.rail.scrollLeft - D.sl0);
    D.card.style.transform = `translateX(${dx}px)`;
    const want = PLAN_MOVE.round5(timeAt(D.L, D.l0 + dx));
    D.sn = AVAIL.snap(want, D.len, D.c.fixed, D.c.lo, D.c.hi);
    const off = D.rail.getBoundingClientRect().left - D.wrap.getBoundingClientRect().left - D.rail.scrollLeft;
    const lab = D.ind.querySelector("span");
    if (D.sn) { D.ind.style.left = (off + xAt(D.L, D.sn.s)) + "px"; lab.textContent = availRange(D.sn.s, D.sn.e) + (D.sn.hit ? ` · ${D.sn.hit.title} is fixed` : ""); D.ind.classList.toggle("snap", !!D.sn.hit); D.ind.classList.remove("none"); }
    else { D.ind.style.left = (off + D.l0 + dx) + "px"; lab.textContent = "No free time that long here"; D.ind.classList.add("none"); }
    // keep the label inside the strip
    const wl = D.wrap.clientWidth, lw = lab.offsetWidth, left = parseFloat(D.ind.style.left) || 0;
    lab.style.transform = `translateX(${Math.round(Math.max(-left + 4, Math.min(-lw / 2, wl - left - lw - 4)))}px)`;
  }
  // Near an edge of the strip, it scrolls on its own so a block can go anywhere in the day
  function edge(){
    if (!D) return;
    const r = D.rail.getBoundingClientRect(), z = 44;
    const v = D.x < r.left + z ? -Math.ceil((r.left + z - D.x) / 4) : D.x > r.right - z ? Math.ceil((D.x - r.right + z) / 4) : 0;
    if (v) { const b = D.rail.scrollLeft; D.rail.scrollLeft += v; if (D.rail.scrollLeft !== b) update(D.x); }
    D.raf = requestAnimationFrame(edge);
  }
  function end(drop){
    if (!D) return; const d = D; D = null; P = null;
    cancelAnimationFrame(d.raf); d.ind.remove(); d.card.style.transform = ""; d.card.classList.remove("pm-drag"); d.rail.classList.remove("pm-on"); d.wrap.classList.remove("pm-on"); document.body.classList.remove("sorting");
    swallow = performance.now();
    if (!drop) return;
    const t = PLAN_MOVE.titleOf(d.id);
    if (!d.sn) { toast(`No free time that long is left there today, so ${t} stays at ${availRange(d.s0, d.e0)}`); return; }
    if (d.sn.s === d.s0) return;
    PLAN_MOVE.moveTo(d.id, d.s0, d.e0, d.sn.s, d.sn.e, d.sn.hit ? PLAN_MOVE.why(d.sn.hit, t, d.sn.s, d.sn.e) : `Moved ${t} to ${availRange(d.sn.s, d.sn.e)}`);
    try { sbHaptic("drop", {force: true}); } catch (e) {}
    planMoveFocus(d.id);
  }
  // Mouse and pen: press, then drag past a few pixels
  document.addEventListener("pointerdown", e => {
    if (e.pointerType === "touch" || e.button !== 0 || D) return;
    const card = cardOf(e.target); if (!card || e.target.closest(".dtl-mv")) return;
    P = {card, x: e.clientX, y: e.clientY};
  });
  addEventListener("pointermove", e => {
    if (e.pointerType === "touch") return;
    if (D) { e.preventDefault(); update(e.clientX); return; }
    if (P && Math.hypot(e.clientX - P.x, e.clientY - P.y) > 6) start(P.card, P.x), update(e.clientX);
  });
  addEventListener("pointerup", e => { if (e.pointerType === "touch") return; if (D) end(true); P = null; });
  addEventListener("keydown", e => { if (D && e.key === "Escape") { e.preventDefault(); end(false); } }, true);
  addEventListener("blur", () => { if (D) end(false); });
  // Touch: hold still on a block for a moment (the strip scrolls as usual otherwise), then drag
  let T = null;
  document.addEventListener("touchstart", e => {
    if (D || e.touches.length !== 1) return;
    const card = cardOf(e.target); if (!card || e.target.closest(".dtl-mv")) return;
    const p = e.touches[0];
    T = {card, x: p.clientX, y: p.clientY, timer: setTimeout(() => { if (T) { const tt = T; T = null; start(tt.card, tt.x); } }, 420)};
  }, {passive: true});
  document.addEventListener("touchmove", e => {
    if (T) { const p = e.touches[0]; if (Math.hypot(p.clientX - T.x, p.clientY - T.y) > 10) { clearTimeout(T.timer); T = null; } return; }
    if (D) { e.preventDefault(); update(e.touches[0].clientX); }
  }, {passive: false});
  const tEnd = e => { if (T) { clearTimeout(T.timer); T = null; } if (D) { if (e.cancelable) e.preventDefault(); end(e.type === "touchend"); } };
  document.addEventListener("touchend", tEnd, {passive: false});
  document.addEventListener("touchcancel", tEnd, {passive: false});
  // the long-press menu of the browser, and the click that ends a drag, don't do anything
  document.addEventListener("contextmenu", e => { if (D || cardOf(e.target) && T) e.preventDefault(); }, true);
  document.addEventListener("click", e => { if (performance.now() - swallow < 350 && cardOf(e.target) && !e.target.closest(".dtl-mv")) { e.preventDefault(); e.stopPropagation(); } }, true);
  hook("render", () => { if (D && !D.card.isConnected) end(false); });
})();
// After a move the strip is drawn again: keyboard focus goes back to the moved block's menu button
function planMoveFocus(id, menu){
  if (!menu && !(document.activeElement && document.activeElement.closest && document.activeElement.closest(".pm-menu,.dtl"))) return;
  setTimeout(() => { const b = [...document.querySelectorAll(".dtl-mv[data-pm]")].find(x => x.dataset.pm === id); if (b) b.focus({preventScroll: true}); }, 120);
}

/* -- Move To… menu */
(() => {
  let M = null;
  function close(back){
    if (!M) return; const m = M; M = null;
    m.el.remove(); m.btn.setAttribute("aria-expanded", "false");
    document.removeEventListener("pointerdown", outside, true);
    if (back && m.btn.isConnected) m.btn.focus({preventScroll: true});
  }
  // under its button (above it when there's no room below), kept on screen; it follows the button when the page or strip scrolls
  function place(){
    if (!M) return;
    const {el, btn} = M, r = btn.getBoundingClientRect(), w = el.offsetWidth, h = el.offsetHeight, vw = innerWidth, vh = innerHeight;
    if (!btn.isConnected || r.bottom < 0 || r.top > vh) { close(false); return; }
    el.style.left = Math.max(8, Math.min(vw - w - 8, r.right - w)) + "px";
    el.style.top = (r.bottom + 6 + h > vh - 8 ? Math.max(8, r.top - 6 - h) : r.bottom + 6) + "px";
  }
  const outside = e => { if (M && !M.el.contains(e.target) && e.target !== M.btn && !M.btn.contains(e.target)) close(false); };
  function open(btn){
    const card = btn.closest(".pm-card"); if (!card) return;
    const id = card.dataset.mv, s0 = +card.dataset.s, e0 = +card.dataset.e, len = +card.dataset.min || e0 - s0, pinned = card.classList.contains("pinned"), t = PLAN_MOVE.titleOf(id);
    const opts = PLAN_MOVE.fits(id, len, s0);
    const el = document.createElement("div");
    el.className = "pm-menu"; el.setAttribute("role", "menu"); el.setAttribute("aria-label", `Move ${t}`);
    el.innerHTML = `<p class="pm-h" aria-hidden="true">Move To</p>`
      + (opts.length ? `<div role="group" aria-label="Times that fit today"><p class="pm-g" aria-hidden="true">Today</p>${opts.map(o => `<button type="button" role="menuitem" class="pm-it" data-s="${o.s}" data-e="${o.e}">${esc(availRange(o.s, o.e))}</button>`).join("")}</div>`
        : `<p class="pm-g pm-none">No other time fits ${esc(fmtHM(len / 60))} today</p>`)
      + `<div class="pm-sep" role="separator"></div>`
      + `<button type="button" role="menuitem" class="pm-it" data-do="tomorrow">Tomorrow</button>`
      + (pinned ? `<button type="button" role="menuitem" class="pm-it" data-do="pick">Let Studyboard Pick</button>` : "");
    document.body.appendChild(el);
    M = {el, btn, id, s0, e0, len};
    place();
    btn.setAttribute("aria-expanded", "true");
    const items = () => [...el.querySelectorAll('[role="menuitem"]')];
    items()[0].focus();
    el.addEventListener("keydown", e => {
      const l = items(), i = l.indexOf(document.activeElement);
      if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); l[(i + (e.key === "ArrowDown" ? 1 : -1) + l.length) % l.length].focus(); }
      else if (e.key === "Home" || e.key === "End") { e.preventDefault(); l[e.key === "Home" ? 0 : l.length - 1].focus(); }
      else if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); close(true); }
      else if (e.key === "Tab") close(false);
    });
    el.addEventListener("click", e => {
      const b = e.target.closest(".pm-it"); if (!b || !M) return;
      const m = M; close(false);
      if (b.dataset.do === "tomorrow") PLAN_MOVE.tomorrow(m.id, m.len, m.s0);
      else if (b.dataset.do === "pick") PLAN_MOVE.unpin(m.id, m.s0, m.e0);
      else { const s = +b.dataset.s, e2 = +b.dataset.e; PLAN_MOVE.moveTo(m.id, m.s0, m.e0, s, e2, `Moved ${PLAN_MOVE.titleOf(m.id)} to ${availRange(s, e2)}`); }
      planMoveFocus(m.id, true);
    });
    setTimeout(() => document.addEventListener("pointerdown", outside, true), 0);
  }
  document.addEventListener("click", e => {
    const b = e.target.closest && e.target.closest(".dtl-mv[data-pm]"); if (!b) return;
    e.preventDefault(); e.stopPropagation();
    if (M && M.btn === b) { close(true); return; }
    close(false); open(b);
  });
  // the strip is drawn again (a sync, the clock): the menu stays with the same block, or goes when the block is no longer there
  hook("render", () => {
    if (!M || M.btn.isConnected) return;
    const b = [...document.querySelectorAll(".dtl-mv[data-pm]")].find(x => x.dataset.pm === M.id), c = b && b.closest(".pm-card");
    if (!b || +c.dataset.s !== M.s0) { close(false); return; }
    M.btn = b; b.setAttribute("aria-expanded", "true"); place();
  });
  addEventListener("resize", () => { if (M) place(); });
  addEventListener("scroll", e => { if (M && !(e.target && e.target.nodeType === 1 && M.el.contains(e.target))) place(); }, true);
})();
// For tests: the moves, and the plan's slots (what Do This Next and the widgets read)
if (window.__SB_TEST) window.__sbPlanMove = Object.assign({slots: () => { focusStale(); return computeFocus().slotsBy; }}, PLAN_MOVE);
