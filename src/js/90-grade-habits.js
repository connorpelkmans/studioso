/* ===== module: 90-grade-habits.js ===== */
/* Grade analysis, Phases 3 and 4 (GRADE-ANALYSIS-PLAN.md): Your Patterns (how starting early, time spent, handing in late, late
   nights and practice scores went with your marks, from data the app already keeps), the term timeline, This Week in Grades, and
   grade cards for the Term Recap. The math is GINS in 90-grade-insights.js. */
(() => {
  const M = () => window.SBGRADES && window.SBGRADES.math, X = () => window.SBGINS, G = () => window.SBGINS.GINS;
  const r1 = v => Math.round(v * 10) / 10;
  const LMS_KEYS = ["bs", "cv", "bb", "md", "sg", "gc"];

  /* When each mark came in. A mark from the school site says when it was graded; one typed in is noted the first time it's seen
     (this device). The first time this runs, marks already there get their due date or the day they were finished, not today,
     so a whole term of marks doesn't look new. */
  const LOG_KEY = "studyboard:markSeen";
  const sigOf = t => t && t.mark ? [t.mark.got, t.mark.outOf, t.mark.letter || "", t.mark.pf || ""].join("|") : "";
  const logGet = () => { try { const v = JSON.parse(localStorage.getItem(LOG_KEY) || "null"); return v && typeof v === "object" ? v : null; } catch (e) { return null; } };
  const logSet = v => { try { localStorage.setItem(LOG_KEY, JSON.stringify(v)); } catch (e) {} };
  const guessAt = t => Number(t.doneAt) || (t.due ? parse(t.due).getTime() + 12 * 36e5 : Number(t.created) || Date.now());
  function syncLog(){
    const m = M(); if (!m) return {};
    let log = logGet(); const first = !log; log = log || {};
    let ch = false;
    allTasks().forEach(t => {
      if (!t.mark || m.markPct(t) == null) return;
      const s = sigOf(t), e = log[t.id];
      if (e && e.s === s) return;
      log[t.id] = {s, at: first || !e && t.markNew === undefined && guessAt(t) < Date.now() - 864e5 * 21 ? guessAt(t) : Date.now()}; ch = true;
    });
    const ids = Object.keys(log); if (ids.length > 900) { ids.sort((a, b) => log[a].at - log[b].at).slice(0, ids.length - 900).forEach(k => delete log[k]); ch = true; }
    if (ch) logSet(log);
    return log;
  }
  hook("changed", () => { try { syncLog(); } catch (e) {} });
  function markAt(t, log){
    const L = LMS_KEYS.map(f => t && t[f]).find(Boolean), g = L && L.fb && L.fb.at;
    if (g && isFinite(new Date(g).getTime())) return new Date(g).getTime();
    const e = (log || {})[t.id]; return e && e.s === sigOf(t) ? e.at : guessAt(t);
  }
  const dayOf = ms => iso(new Date(ms));

  /* 5. Your Patterns */
  // The day work on a task started: its first logged or focused minutes, else the first time it moved to Doing or got progress
  function startDay(t){
    const w = (typeof workEntries === "function" ? workEntries(t) : []).map(e => e.d).sort()[0];
    const h = (t.history || []).filter(x => x && /^(Status: To Do → |Progress: 0% → |Preparedness: 0% → )/.test(x.text || "") && Number(x.at) > 0).map(x => dayOf(Number(x.at))).sort()[0];
    return [w, h].filter(Boolean).sort()[0] || null;
  }
  function nightOf(t){
    const es = typeof workEntries === "function" ? workEntries(t).filter(e => e.kind === "focus" && Number(e.at) > 0) : [];
    const tot = es.reduce((s, e) => s + e.min, 0); if (tot < 30) return null;
    const late = es.filter(e => { const h = new Date(e.at).getHours(); return h >= 22 || h < 4; }).reduce((s, e) => s + e.min, 0);
    return late / tot >= 0.5;
  }
  function lateOfT(t){
    if (X().penPct(t) > 0) return true;
    if (!t.doneAt || !t.due) return null;
    return Number(t.doneAt) > new Date(t.due + "T" + (t.time || "23:59")).getTime() + 6e4;
  }
  function marksOf(all){
    const m = M(), out = [];
    all.forEach(gr => gr.marked.forEach(t => {
      if (t.prepFor || gr.dropped.has(t.id)) return;
      const pct = gr.pm.get(t.id), sd = startDay(t), mins = typeof workEntries === "function" ? workEntries(t).reduce((s, e) => s + e.min, 0) : Number(t.focusMin) || 0;
      const rs = (t.readySnap && isNum(t.readySnap.measured)) ? t.readySnap.measured : t.wrap && isNum(t.wrap.measured) ? t.wrap.measured : null;
      out.push({id: t.id, t, gr, pct, type: t.type || "Other", lead: sd && t.due && !MILESTONE(t.type) ? dayDiff(sd, t.due) : null, min: MILESTONE(t.type) ? 0 : mins,
        late: MILESTONE(t.type) ? null : lateOfT(t), penPts: X().shareOf(gr, t) * X().penPct(t) / 100, ready: MILESTONE(t.type) ? rs : null, night: MILESTONE(t.type) ? null : nightOf(t)});
    }));
    return out;
  }
  let HB = {st: null, at: 0, v: null};
  function habitsOf(all){
    if (HB.st === state && HB.at === state.updated && HB.v) return HB.v;
    const marks = marksOf(all), v = {marks, list: G().habits(marks)};
    HB = {st: state, at: state.updated, v};
    return v;
  }
  const P = v => M().fmtP(v);
  const minsTxt = n => n >= 60 ? fmtHM(n / 60) : tr("hb.min", "{n} min", {n: Math.round(n)});
  // The next piece of graded work a finding is about, to act on
  function nextOpen(all, type){
    const m = M(), today = todayISO(), c = [];
    all.forEach(gr => gr.open.forEach(t => { if (t.status !== "done" && t.due && t.due > today && !MILESTONE(t.type) && m.wOf(t) > 0 && (!type || t.type === type)) c.push(t); }));
    return c.sort((a, b) => a.due.localeCompare(b.due))[0] || null;
  }
  function habitText(h, all){
    const m = M();
    switch (h.key) {
      case "lead": {
        const say = h.gap > 0 ? tr("hb.lead", "Work you started 3 or more days before it was due averaged {a} ({na} items). Work started the day before, or on the day, averaged {b} ({nb} items).", {a: P(h.a), na: h.na, b: P(h.b), nb: h.nb})
          : tr("hb.leadRev", "Oddly, work you started the day before averaged {b} ({nb} items), above the {a} for work started 3+ days early ({na} items).", {a: P(h.a), na: h.na, b: P(h.b), nb: h.nb});
        const nx = h.gap > 0 ? nextOpen(all) : null, sd = nx ? addDays(nx.due, -3) : "";
        const ok = nx && (!nx.start || nx.start > sd) && sd >= todayISO();
        return {title: tr("hb.leadT", "Starting Early"), say, bars: [[tr("hb.early", "3+ days early"), h.a, h.na], [tr("hb.lateStart", "Day before"), h.b, h.nb]],
          act: ok ? {label: sd === todayISO() ? tr("hb.leadDoT", "Start {title} Today", {title: nx.title}) : tr("hb.leadDo", "Start {title} on {d}", {title: nx.title, d: fmtShort(sd)}), act: "hb-start", id: nx.id, v: sd} : null};
      }
      case "time": return {title: tr("hb.timeT", "Time on {type}", {type: m.typePl(h.type)}), say: h.gap > 0 ? tr("hb.time", "Your {type} averaged {a} when you put in {cut} or more, and {b} with less ({n} items).", {type: m.typePl(h.type).toLowerCase(), a: P(h.a), b: P(h.b), cut: minsTxt(h.cut), n: h.na + h.nb})
        : tr("hb.timeRev", "More time didn't go with better marks on your {type}: {a} with {cut} or more, {b} with less. Working differently may help more than working longer.", {type: m.typePl(h.type).toLowerCase(), a: P(h.a), b: P(h.b), cut: minsTxt(h.cut)}),
        bars: [[tr("hb.more", "{cut}+", {cut: minsTxt(h.cut)}), h.a, h.na], [tr("hb.less", "Less"), h.b, h.nb]]};
      case "late": return {title: tr("hb.lateT", "Late Penalties"), say: trn("hb.late", h.n, "Handing in late cost you {pts} of course grade on {n} item this term.|Handing in late cost you {pts} of course grade across {n} items this term.", {pts: X().pts(h.cost)}) + " " + tr("hb.lateDo", "A start date 3 days before each due date is the easiest way to keep those points.")};
      case "lateMark": return {title: tr("hb.lmT", "On Time vs Late"), say: tr("hb.lm", "Work you handed in on time averaged {a}; late work averaged {b}, before counting the penalty itself.", {a: P(h.a), b: P(h.b)}), bars: [[tr("hb.ontime", "On time"), h.a, h.na], [tr("hb.latew", "Late"), h.b, h.nb]]};
      case "ready": return {title: tr("hb.readyT", "Your Practice Scores"), say: h.err <= 8 ? trn("hb.readyOk", h.n, "Before {n} exam, your flashcard and quiz scores predicted your mark within about {e} points. You can trust them to tell you when you're ready.|Before {n} exams, your flashcard and quiz scores predicted your mark within about {e} points. You can trust them to tell you when you're ready.", {e: Math.round(h.err)})
        : h.bias > 0 ? tr("hb.readyHi", "Your practice scores ran about {e} points above your exam marks ({n} exams). Practise with questions in the exam's own style to get a truer read.", {e: Math.round(h.bias), n: h.n})
        : tr("hb.readyLo", "You did about {e} points better on exams than your practice scores said ({n} exams). You're more ready than they suggest.", {e: Math.round(-h.bias), n: h.n})};
      case "night": return {title: tr("hb.nightT", "Late Nights"), say: h.gap > 0 ? tr("hb.night", "Work you did mostly before 10pm averaged {a} ({na} items); work done mostly after 10pm averaged {b} ({nb} items).", {a: P(h.a), na: h.na, b: P(h.b), nb: h.nb})
        : tr("hb.nightRev", "Your late-night work averaged {b}, a little above the {a} for daytime work. Whatever time works for you is fine.", {a: P(h.a), b: P(h.b)}),
        bars: [[tr("hb.day", "Before 10pm"), h.a, h.na], [tr("hb.nightw", "After 10pm"), h.b, h.nb]]};
    }
    return null;
  }
  function habitsHtml(all){
    const H = habitsOf(all); if (H.marks.length < 4) return "";
    const items = H.list.map(h => Object.assign({h}, habitText(h, all))).filter(x => x.say).slice(0, 3);
    const bar = ([label, v, n], i) => `<div class="gi-hab-bar${i ? " b" : ""}"><span>${esc(label)}</span><span aria-hidden="true"><i style="width:${Math.max(0, Math.min(100, v))}%"></i></span><b>${esc(P(v))}</b></div>`;
    const body = items.length ? `<ul class="gi-hab-list">${items.map(x => `<li><b>${esc(x.title)}</b><span>${esc(x.say)}</span>${x.bars ? `<div class="gi-hab-bars" role="img" aria-label="${esc(x.bars.map(b => `${b[0]}: ${P(b[1])} over ${b[2]}`).join(", "))}">${x.bars.map(bar).join("")}</div>` : ""}${x.act ? `<button type="button" class="btn small gi-hab-do" data-act="${esc(x.act.act)}" data-id="${esc(x.act.id)}" data-v="${esc(x.act.v)}">${esc(x.act.label)}</button>` : ""}</li>`).join("")}</ul>`
      : `<p class="gi-hab-empty">${esc(tr("hb.empty", "No clear patterns yet. They show up once there are at least {n} marks on each side of a comparison (like work started early and work started late), with a gap of {g} points or more.", {n: G().MIN_N, g: G().MIN_GAP}))}</p>`;
    return `<section class="gi-card gi-hab" aria-labelledby="giHabH"><h3 id="giHabH">${esc(tr("hb.title", "Your Patterns"))}</h3><p class="gi-sub">${esc(trn("hb.sub", H.marks.length, "From {n} mark, with the focus time, start dates and hand-in times Studyboard already keeps. These show what went with your better marks, not what caused them.|From {n} marks, with the focus time, start dates and hand-in times Studyboard already keeps. These show what went with your better marks, not what caused them."))}</p>${body}</section>`;
  }
  hook("act", (act, el, id) => {
    if (act !== "hb-start") return false;
    const t = state.tasks[id], v = el.dataset.v; if (!t || !isDate(v)) return true;
    const n = clone(t); n.start = v; applyChanges([{kind: "task", id, after: n}], tr("hb.started", "{title} now starts {d}", {title: t.title, d: fmtShort(v)}));
    return true;
  });

  /* 6. Term timeline: the credit-weighted average at the end of each week, rebuilt from the marks (nothing stored) */
  let TL = {st: null, at: 0, v: null};
  function timeline(all){
    if (TL.st === state && TL.at === state.updated && TL.v) return TL.v;
    const m = M(), log = syncLog(), S = m.termStats(all);
    const live = all.filter(gr => gr.marked.length && !gr.unw);
    const dated = live.map(gr => ({gr, its: gr.marked.map(t => ({t, d: t.due || dayOf(markAt(t, log))}))}));
    const first = dated.flatMap(x => x.its.map(i => i.d)).filter(Boolean).sort()[0];
    let v = null;
    if (first) {
      const wk = G().weeks(first, todayISO());
      if (wk.length >= 3) {
        const series = dated.map(x => ({gr: x.gr, pts: wk.map(w => { const ids = new Set(x.its.filter(i => i.d <= w).map(i => i.t.id)); return {key: w, v: ids.size ? m.courseGrade(x.gr.c, ids).current : null, ids}; })}));
        const avg = wk.map((w, i) => { const rows = series.map(s => ({v: s.pts[i].v, cr: s.gr.c.credits})).filter(r => r.v != null); return {key: w, v: rows.length ? m.GRULES.avg(rows, S.def) : null}; });
        // moves count from the first week every course has a mark: before that, a course joining the average isn't a real move
        const full = Math.max(0, avg.findIndex((p, i) => series.every(s => s.pts[i].v != null)));
        const mv = G().moves(avg.slice(full));
        // what moved it most: the heaviest marks that week
        let why = "";
        if (mv.big) {
          const k = wk.indexOf(mv.big.key), prev = wk[k - 1] || "";
          const its = dated.flatMap(x => x.its.filter(i => i.d > prev && i.d <= mv.big.key).map(i => ({t: i.t, gr: x.gr, w: m.wOf(i.t)}))).sort((a, b) => b.w - a.w);
          if (its[0]) why = `${its[0].t.title} (${courseLabel(its[0].gr.c)})`;
        }
        v = {wk, series, avg, mv, why};
      }
    }
    TL = {st: state, at: state.updated, v};
    return v;
  }
  function timelineHtml(all){
    const m = M(), T = timeline(all); if (!T) return "";
    const wide = !(window.matchMedia && matchMedia("(max-width:600px)").matches), W = wide ? 640 : 340, H = wide ? 190 : 200, box = {l: 40, t: 16, w: W - 40 - 18, h: H - 16 - 30};
    const vals = T.avg.map(p => p.v).concat(...T.series.map(s => s.pts.map(p => p.v))).filter(v => v != null);
    const dom = window.SBTREND ? SBTREND.GTREND.domain(vals) : {lo: 0, hi: 100}, n = T.wk.length;
    const xy = (i, v) => window.SBTREND ? SBTREND.GTREND.xy(i, n, v, dom, box) : {x: box.l + i * box.w / (n - 1), y: box.t + (dom.hi - v) / (dom.hi - dom.lo) * box.h};
    const path = pts => { let d = "", on = false; pts.forEach((p, i) => { if (p.v == null) { on = false; return; } const q = xy(i, p.v); d += (on ? "L" : "M") + q.x.toFixed(1) + " " + q.y.toFixed(1); on = true; }); return d; };
    const ticks = [dom.hi, Math.round((dom.lo + dom.hi) / 2 / 5) * 5, dom.lo].filter((v, i, a) => a.indexOf(v) === i);
    const last = T.avg[n - 1], lp = last.v != null ? xy(n - 1, last.v) : null;
    const bi = T.mv.big ? T.wk.indexOf(T.mv.big.key) : -1, bp = bi >= 0 && T.avg[bi].v != null ? xy(bi, T.avg[bi].v) : null;
    const lastTxt = T.mv.last == null ? "" : Math.abs(T.mv.last) < 0.05 ? tr("tl.same", "No change since last week") : tr("tl.wk", "{d} since last week", {d: (T.mv.last > 0 ? "+" : "−") + SBI18N.fmtN(r1(Math.abs(T.mv.last)))});
    const bigTxt = T.mv.big && Math.abs(T.mv.big.d) >= 0.3 ? tr("tl.big", "Biggest week: {d} in the week ending {w}{why}.", {d: (T.mv.big.d > 0 ? "+" : "−") + SBI18N.fmtN(r1(Math.abs(T.mv.big.d))), w: fmtShort(T.mv.big.key), why: T.why ? tr("tl.why", ", mostly {x}", {x: T.why}) : ""}) : "";
    const first = T.avg.find(p => p.v != null);
    const desc = tr("tl.desc", "Your average across courses at the end of each week, from {a} to {b}.", {a: first ? P(first.v) : "", b: last.v != null ? P(last.v) : ""});
    const svg = `<svg class="gi-tl-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(desc + " " + bigTxt)}">
      ${ticks.map(v => `<line class="gi-tl-grid" x1="${box.l}" x2="${box.l + box.w}" y1="${xy(0, v).y.toFixed(1)}" y2="${xy(0, v).y.toFixed(1)}"/><text class="gi-tl-ax" x="${box.l - 6}" y="${(xy(0, v).y + 4).toFixed(1)}" text-anchor="end">${v}%</text>`).join("")}
      ${T.series.map(s => `<path class="gi-tl-c" d="${path(s.pts)}" style="stroke:${esc(s.gr.c.color)}"/>`).join("")}
      <path class="gi-tl-avg" d="${path(T.avg)}"/>
      ${lp ? `<circle class="gi-tl-dot" cx="${lp.x.toFixed(1)}" cy="${lp.y.toFixed(1)}" r="4.5"/>` : ""}
      ${bp && bigTxt ? `<text class="gi-tl-big" x="${bp.x.toFixed(1)}" y="${(bp.y - 9).toFixed(1)}" text-anchor="middle">${esc((T.mv.big.d > 0 ? "+" : "−") + SBI18N.fmtN(r1(Math.abs(T.mv.big.d))))}</text>` : ""}
      <text class="gi-tl-ax" x="${box.l}" y="${H - 8}">${esc(fmtShort(T.wk[0]))}</text><text class="gi-tl-ax" x="${box.l + box.w}" y="${H - 8}" text-anchor="end">${esc(tr("tl.today", "Today"))}</text></svg>`;
    const leg = `<ul class="gi-tl-leg"><li><i style="background:var(--ink);height:3px"></i>${esc(tr("tl.avg", "Average"))}</li>${T.series.map(s => `<li><i style="background:${esc(s.gr.c.color)}"></i>${esc(courseLabel(s.gr.c))}</li>`).join("")}</ul>`;
    const cls = T.mv.last > 0.05 ? "up" : T.mv.last < -0.05 ? "down" : "";
    return `<section class="gi-card gi-tl" aria-labelledby="giTlH"><h3 id="giTlH">${esc(tr("tl.title", "Your Term So Far"))}<span class="spacer"></span>${lastTxt ? `<span class="gi-wk ${cls}">${esc(lastTxt)}</span>` : ""}</h3>${svg}${leg}${bigTxt ? `<p class="mini">${esc(bigTxt)}</p>` : ""}</section>`;
  }

  /* 9. This Week in Grades */
  const DG_KEY = "studyboard:digestHidden";
  function digest(all){
    const m = M(), log = syncLog(), since = Date.now() - 7 * 864e5, out = {marks: [], moved: [], next: null};
    all.forEach(gr => {
      const fresh = gr.marked.filter(t => markAt(t, log) >= since); if (!fresh.length) return;
      const allIds = new Set(gr.marked.map(t => t.id)), now = m.courseGrade(gr.c, allIds).current;
      fresh.forEach(t => { const w = new Set(allIds); w.delete(t.id); const b = w.size ? m.courseGrade(gr.c, w).current : null; out.marks.push({t, gr, pct: gr.pm.get(t.id), d: b != null && now != null ? now - b : null}); });
      const w = new Set([...allIds].filter(id => !fresh.some(t => t.id === id))), b = w.size ? m.courseGrade(gr.c, w).current : null;
      if (b != null && now != null) out.moved.push({gr, d: now - b, now});
    });
    const today = todayISO(), end = addDays(today, 7);
    all.forEach(gr => gr.open.forEach(t => { if (t.status !== "done" && t.due && t.due >= today && t.due <= end && m.wOf(t) > 0) { const w = m.wOf(t) / gr.D * 100; if (!out.next || w > out.next.w) out.next = {t, gr, w}; } }));
    out.marks.sort((a, b) => markAt(b.t, log) - markAt(a.t, log));
    out.moved.sort((a, b) => Math.abs(b.d) - Math.abs(a.d));
    return out;
  }
  function digestHtml(all, onBoard){
    const m = M(), D = digest(all); if (!D.marks.length && !D.next) return "";
    if (onBoard && !D.marks.length) return "";
    const sg = v => (v > 0 ? "+" : "−") + SBI18N.fmtN(r1(Math.abs(v)));
    const today = todayISO(), range = tr("dg.range", "{a} to {b}", {a: fmtShort(addDays(today, -6)), b: fmtShort(today)});
    // New marks: one row each, course colour, the mark, and what it did to the course
    const chip = d => d == null || Math.abs(d) < 0.05 ? `<span class="gi-dg-d same">${esc(tr("dg.same", "no change"))}</span>` : `<span class="gi-dg-d ${d > 0 ? "up" : "down"}" title="${esc(tr("dg.dTip", "What it did to the course grade"))}">${esc(sg(d))}</span>`;
    const rows = D.marks.slice(0, 5).map(x => `<li style="--c:${esc(x.gr.c.color)}"><span class="gi-dg-t"><b>${esc(x.t.title)}</b><span class="mini">${esc(courseLabel(x.gr.c))}</span></span><span class="gi-dg-m">${esc(P(x.pct))}</span>${chip(x.d)}</li>`).join("");
    const more = D.marks.length > 5 ? `<p class="mini gi-dg-more">${esc(trn("dg.more", D.marks.length - 5, "and {n} more mark|and {n} more marks"))}</p>` : "";
    const marks = D.marks.length ? `<div class="gi-dg-sec"><h4>${esc(tr("dg.newH", "New Marks"))}</h4><ul class="gi-dg-rows"><li class="gi-dg-cols" aria-hidden="true"><span></span><span>${esc(tr("dg.colMark", "Mark"))}</span><span>${esc(tr("dg.colCourse", "Course"))}</span></li>${rows}</ul>${more}</div>` : "";
    // Two tiles: the course that moved most, and the biggest graded item next week
    const mv = D.moved.filter(x => Math.abs(x.d) >= 0.3)[0], tiles = [];
    if (mv) tiles.push(`<div class="gi-dg-tile" style="--c:${esc(mv.gr.c.color)}"><span class="k">${esc(tr("dg.mvH", "Biggest Move"))}</span><b>${esc(courseLabel(mv.gr.c))} <span class="gi-dg-d ${mv.d > 0 ? "up" : "down"}">${esc(sg(mv.d))}</span></b><span class="mini">${esc(tr("dg.mvS", "now {now}", {now: P(mv.now)}))}</span></div>`);
    if (D.next) tiles.push(`<div class="gi-dg-tile" style="--c:${esc(D.next.gr.c.color)}"><span class="k">${esc(tr("dg.nextH", "Coming Up"))}</span><b>${esc(D.next.t.title)}</b><span class="mini">${esc(tr("dg.nextS", "{c} · worth {w} · due {due}", {c: courseLabel(D.next.gr.c), w: m.fmtW(D.next.w), due: fmtShort(D.next.t.due)}))}</span></div>`);
    const tl = tiles.length ? `<div class="gi-dg-tiles">${tiles.join("")}</div>` : "";
    // One study pattern, as a tip
    const H = habitsOf(all).list[0], ht = H ? habitText(H, all) : null;
    const tip = ht ? `<div class="gi-dg-tip"><span class="gi-dg-tip-ic" aria-hidden="true"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.2 1 2V17h6v-.3c0-.8.4-1.5 1-2A7 7 0 0 0 12 2z"/></svg></span><span><b>${esc(tr("dg.tipH", "Your Pattern: {t}", {t: ht.title}))}</b><span>${esc(ht.say)}</span></span></div>` : "";
    const count = D.marks.length ? trn("dg.count", D.marks.length, "{n} new mark|{n} new marks") : "";
    return `<section class="gi-card gi-dg" aria-labelledby="giDgH"><div class="gi-dg-head"><h3 id="giDgH">${esc(tr("dg.head0", "This Week in Grades"))}</h3><span class="mini">${esc(range)}${count ? " · " + esc(count) : ""}</span></div>
      ${marks}${tl}${tip}
      ${onBoard ? `<div class="gi-dg-acts"><button type="button" class="btn small primary" data-act="dg-open">${esc(tr("dg.open", "Open Grades"))}</button><button type="button" class="btn small" data-act="dg-hide">${esc(tr("dg.hide", "Done for This Week"))}</button></div>` : ""}</section>`;
  }
  const dgHidden = () => { try { return localStorage.getItem(DG_KEY) === mondayOf(todayISO()); } catch (e) { return false; } };
  // On Today: over the weekend and on Monday, once a week, when marks came in
  const origBoard = viewBoard;
  viewBoard = function(){
    const html = origBoard.apply(this, arguments);
    try {
      const wd = new Date().getDay(), m = M();
      if (!m || dgHidden() || !(wd === 6 || wd === 0 || wd === 1 || window.__sbDigestAny) || m.gset().digest === false) return html;
      const card = digestHtml(m.grades(), true); if (!card) return html;
      const k = html.indexOf('<div class="qa-wrap">');
      return k >= 0 ? html.slice(0, k) + card + html.slice(k) : card + html;
    } catch (e) { console.warn("grade insights: digest", e); return html; }
  };
  hook("act", act => {
    if (act === "dg-hide") { try { localStorage.setItem(DG_KEY, mondayOf(todayISO())); } catch (e) {} render(); return true; }
    if (act === "dg-open") { ui.tab = "courses"; ui.courseId = null; ui.courseTab = "grades"; render(); window.scrollTo(0, 0); return true; }
    return false;
  });

  X().addSection("page", all => ({order: 5, html: digestHtml(all, false)}));
  X().addSection("page", all => ({order: 40, html: timelineHtml(all)}));
  X().addSection("page", all => ({order: 50, html: habitsHtml(all)}));

  /* 11. What to Shore Up (topics and mastery, from what's already there): where a course has lost the most points, the topics
     of its next exam's prep plan you rated weakest, and its flashcard decks by how ready you are. No new tagging needed. */
  const CONF_ORDER = {weak: 0, ok: 1, strong: 2}, CONF_TXT = {weak: () => tr("su.weak", "shaky"), ok: () => tr("su.ok", "okay"), strong: () => tr("su.strong", "strong")};
  function shoreHtml(gr){
    const m = M(), c = gr.c, today = todayISO();
    const ex = allTasks().filter(t => t.courseId === c.id && MILESTONE(t.type) && !t.prepFor && t.status !== "done" && t.due && t.due >= today).sort((a, b) => a.due.localeCompare(b.due))[0];
    const topics = ex && ex.prep && Array.isArray(ex.prep.topics) ? ex.prep.topics.filter(t => t && t.name && !t.done).slice().sort((a, b) => (CONF_ORDER[a.conf] ?? 1) - (CONF_ORDER[b.conf] ?? 1)).slice(0, 5) : [];
    const decks = typeof deckStats === "function" ? Object.values(state.decks || {}).filter(d => d && d.courseId === c.id && !d.archived && (d.cards || []).length).map(d => ({d, r: deckStats(d).ready})).sort((a, b) => a.r - b.r).slice(0, 4) : [];
    if (!topics.length && !decks.length) return "";
    const L = X().lostOf(gr), top = L.slices.find(s => s.kind === "cat");
    const lines = [];
    if (top && top.pts >= 1) lines.push(tr("su.lost", "{type} are where you've lost the most so far ({n}).", {type: m.typePl(top.key), n: X().pts(top.pts)}) + (ex ? " " + tr("su.next", "Next up: {title} on {d}, worth {w}.", {title: ex.title, d: fmtShort(ex.due), w: m.fmtW(m.wOf(ex) || 0)}) : ""));
    const tl = topics.length ? `<p class="mini" style="margin:0">${esc(tr("su.topics", "Topics for {title}, weakest first (from its prep plan):", {title: ex.title}))}</p><ul class="gi-su-topics">${topics.map(t => `<li class="gi-su-${esc(t.conf || "ok")}"><b>${esc(t.name)}</b><span class="mini">${esc(tr("su.rated", "you rated it {c}", {c: (CONF_TXT[t.conf] || CONF_TXT.ok)()}))}</span></li>`).join("")}</ul><button type="button" class="btn small" data-act="prep-plan" data-id="${esc(ex.id)}">${esc(tr("su.plan", "Open the Prep Plan"))}</button>` : "";
    const dl = decks.length ? `<ul class="gi-su-decks">${decks.map(x => `<li><span class="gi-su-dn"><b>${esc(x.d.name)}</b><span class="mini">${esc(trn("su.cards", x.d.cards.length, "{n} card|{n} cards"))} · ${esc(tr("su.ready", "{p}% ready", {p: x.r}))}</span></span><span class="gi-su-bar" role="img" aria-label="${esc(tr("su.ready", "{p}% ready", {p: x.r}))}"><i style="width:${x.r}%"></i></span><button type="button" class="btn small" data-act="fc-study" data-id="${esc(x.d.id)}">${esc(tr("su.study", "Study"))}</button></li>`).join("")}</ul>` : "";
    return `<div class="gr-sub gi-su"><h4>${esc(tr("su.title", "What to Shore Up"))}</h4>${lines.map(x => `<p class="gi-su-lead">${esc(x)}</p>`).join("")}${tl}${dl}</div>`;
  }
  X().addSection("course", (gr, card) => {
    if (card.querySelector(".gi-su")) return;
    const html = shoreHtml(gr); if (!html) return;
    const at = card.querySelector(".gi-cmp") || card.querySelector(".gi-lost") || card.querySelector(".gr-sub.gb");
    if (at) at.insertAdjacentHTML("afterend", html); else card.insertAdjacentHTML("beforeend", html);
  });

  /* 10. Term Recap: grade cards beside the planner's ones (99-pro.js) */
  function recapSlides(T){
    const m = M(); if (!m) return [];
    const all = m.grades(), S = m.termStats(all), out = [];
    const g = S.gpaProj != null ? S.gpaProj : S.gpaNow, prev = S.T.length ? S.past[0].gpa : null;
    if (S.max && g != null) out.push({k: tr("rc.gpa", "Term GPA"), big: m.fmtG(g), line: prev != null ? (g >= prev + 0.05 ? tr("rc.gpaUp", "Up from {p} last term. That's real progress.", {p: m.fmtG(prev)}) : g <= prev - 0.05 ? tr("rc.gpaDn", "{p} last term. One term doesn't define you, and you know more now than you did.", {p: m.fmtG(prev)}) : tr("rc.gpaSame", "Right in line with last term's {p}.", {p: m.fmtG(prev)})) : tr("rc.gpaFirst", "Out of {max}, across {n} courses.", {max: m.fmtG(S.max), n: S.n})});
    const best = all.flatMap(gr => gr.marked.map(t => ({t, gr, p: gr.pm.get(t.id), w: m.wOf(t)}))).filter(x => x.p != null && x.w >= 3).sort((a, b) => b.p - a.p || b.w - a.w)[0];
    if (best) out.push({k: tr("rc.best", "Best Mark"), big: P(best.p), line: tr("rc.bestL", "On {title} in {c}.", {title: best.t.title, c: courseLabel(best.gr.c)})});
    const H = habitsOf(all).list.find(h => (h.key === "lead" || h.key === "time" || h.key === "night") && h.gap > 0) || habitsOf(all).list.find(h => h.key === "ready" && h.err <= 8);
    if (H) { const x = habitText(H, all); if (x) out.push({k: tr("rc.worked", "What Worked"), big: x.title, line: x.say}); }
    return out;
  }
  X().judge(all => {
    const out = [], H = habitsOf(all).list.slice(0, 3);
    H.forEach(h => { const x = habitText(h, all); if (x) out.push(`Study pattern (a correlation from the student's own data, not a cause): ${x.say}`); });
    const T = timeline(all); if (T && T.mv.last != null) out.push(`Average across courses changed ${r1(T.mv.last)} points since last week.`);
    return out;
  });
  Object.assign(window.SBGINS, {recapSlides, habitsOf, timeline, digest, markAt});
})();
