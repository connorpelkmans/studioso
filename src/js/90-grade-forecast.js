/* ===== module: 90-grade-forecast.js ===== */
/* Grade analysis, Phase 2 (GRADE-ANALYSIS-PLAN.md): a forecast with how sure it is (each course, and the term's GPA), the Target
   GPA planner, and the best use of your next hour. The math is GINS in 90-grade-insights.js. */
(() => {
  const M = () => window.SBGRADES && window.SBGRADES.math, X = () => window.SBGINS, G = () => window.SBGINS.GINS;
  const r1 = v => Math.round(v * 10) / 10;
  const pctS = v => Math.round(v * 100) + "%";
  const chance = p => p >= 0.95 ? tr("fc.p.very", "very likely") : p <= 0.05 ? tr("fc.p.unlikely", "unlikely") : tr("fc.p.about", "about {p} likely", {p: pctS(p)});

  /* 3. The forecast for one course, kept until something changes */
  let FC = {st: null, at: 0, by: new Map()};
  function fcOf(gr, opts){
    const m = M(); if (!m || gr.unw || gr.g.pf || gr.done || gr.current == null) return null;
    opts = opts || {};
    if (!opts.fix && FC.st === state && FC.at === state.updated && FC.by.has(gr.c.id)) return FC.by.get(gr.c.id);
    if (FC.st !== state || FC.at !== state.updated) FC = {st: state, at: state.updated, by: new Map()};
    const f = G().forecast(m.GRULES, gr.items, gr.R, gr.D, {seed: G().seedOf(gr.c.id), runs: opts.runs || 2000, scale: gr.g.scale, add: gr.xcGot || 0, fix: opts.fix});
    if (!opts.fix) FC.by.set(gr.c.id, f);
    return f;
  }
  // What would move it most: the heaviest item still to come, done well
  function lever(gr, f, target){
    const m = M(), open = gr.open.filter(t => m.wOf(t) > 0).sort((a, b) => m.wOf(b) - m.wOf(a))[0]; if (!open || !f) return null;
    const usual = f.cat(open.type).m, good = Math.min(100, Math.max(85, Math.round(usual + 10)));
    if (good <= usual + 2) return null;
    const g2 = fcOf(gr, {fix: {[open.id]: good}, runs: 800});
    return g2 ? {t: open, good, before: f.at(target.v), after: g2.at(target.v), target} : null;
  }
  // The line worth watching: your goal, else the next letter up from the likeliest one
  function targetOf(gr, f){
    const g = gr.g, m = M();
    if (g.goal != null) return {v: g.goal, name: tr("fc.t.goal", "your {g} goal", {g: m.fmtP(g.goal)})};
    const b = G().boundary(f.p50, g.scale);
    return b && b.up ? {v: b.up.th, name: tr("fc.t.letter", "{l} or better", {l: b.up.letter})} : b ? {v: b.floor, name: tr("fc.t.letter", "{l} or better", {l: b.letter})} : null;
  }
  function fcHtml(gr){
    const m = M(), g = gr.g;
    if (gr.unw || g.pf || gr.done || gr.current == null) return "";
    if (gr.marked.length < 3) return `<div class="gr-sub gi-fc"><h4>${esc(tr("fc.title", "Forecast"))}</h4><p class="gi-fc-early">${esc(tr("fc.early", "Too early to forecast: a forecast starts after 3 marks, once there's a pattern to go on."))}</p></div>`;
    const f = fcOf(gr); if (!f) return "";
    const L = v => m.letterOf(v, g.scale), lo = m.fmtP(f.p10), hi = m.fmtP(f.p90), risky = !!gr.risk;
    const top = f.top, shown = (f.buckets || []).filter(b => b.p >= 0.03);
    const big = top ? tr("fc.big", "Most likely {l}", {l: top.letter}) : m.fmtP(f.p50);
    const sub = tr("fc.range", "Likely between {lo} and {hi}, middle {mid}", {lo, hi, mid: m.fmtP(f.p50)});
    const bar = shown.length ? `<div class="gi-fc-bar" role="img" aria-label="${esc(shown.map(b => tr("fc.bucket", "{l}: {p}", {l: b.letter, p: pctS(b.p)})).join(", "))}">${shown.slice().reverse().map(b => `<span class="${top && b.letter === top.letter ? "on" : ""}" style="flex:${b.p.toFixed(3)} 1 0;background:color-mix(in srgb,var(--accent) ${Math.round(15 + b.p * 70)}%,var(--surface))" title="${esc(b.letter + ": " + pctS(b.p))}">${b.p >= 0.08 ? esc(b.letter + " " + pctS(b.p)) : ""}</span>`).join("")}</div>` : "";
    const lines = [], tg = targetOf(gr, f);
    // at risk: the range and what would change it, not a failing chance
    if (!risky && tg) lines.push(tr("fc.chance", "Reaching {t}: {c}.", {t: tg.name, c: chance(f.at(tg.v))}));
    if (risky) lines.push(f.at(g.pass) >= 0.5 ? tr("fc.passOk", "Passing ({p}) is {c} if things go the way they have been.", {p: m.fmtP(g.pass), c: chance(f.at(g.pass))}) : tr("fc.passRisk", "This one is close. What you do on the work still to come decides it, and that's still in your hands."));
    const lv = tg || risky ? lever(gr, f, risky ? {v: g.pass, name: tr("fc.t.pass", "a pass")} : tg) : null;
    if (lv && lv.after - lv.before >= 0.04) lines.push(tr("fc.lever", "{good} on {title} would make {t} {c}.", {good: lv.good + "%", title: lv.t.title, t: lv.target.name, c: chance(lv.after)}));
    return `<div class="gr-sub gi-fc"><h4>${esc(tr("fc.title", "Forecast"))}</h4><div class="gi-fc-head"><span class="gi-fc-big">${esc(big)}</span><span class="mini">${esc(sub)}</span></div>${bar}
      <ul class="gi-fc-lines">${lines.map(x => `<li>${esc(x)}</li>`).join("")}</ul>
      <p class="gi-fc-why">${esc(tr("fc.why", "From {n} marks: your average on each type of work and how much your marks vary, run 2,000 times over what's left. Drop rules and bonus count. It's a likely range, not a promise.", {n: gr.marked.length}))}</p></div>`;
  }
  X().addSection("course", (gr, card) => {
    if (card.querySelector(".gi-fc")) return;
    const html = fcHtml(gr); if (!html) return;
    // the forecast says what Projected Final did, with a range
    if (html.indexOf("gi-fc-early") < 0) [...card.querySelectorAll(".gr-top .gr-stat")].forEach(s => { if (/Projected Final/.test((s.querySelector(".gr-k") || {}).textContent || "")) s.remove(); });
    const at = card.querySelector(".gr-bar") || card.querySelector(".gr-top");
    if (at) at.insertAdjacentHTML("afterend", html);
  });

  /* The term's GPA forecast: each course's runs in step, letters to points, by credits */
  function gpaFc(all){
    const m = M(), max = m.gpaMax(); if (!max) return null;
    const S = m.termStats(all), parts = [];
    all.forEach(gr => {
      if (gr.current == null || gr.g.pf || gr.unw) return;
      const cr = isNum(gr.c.credits) ? Number(gr.c.credits) : S.def; if (!(cr > 0)) return;
      const f = fcOf(gr);
      parts.push({cr, gr, f, fixed: f ? null : m.GRULES.points(m.letterOf(m.finalOf(gr), gr.g.scale), max)});
    });
    if (!parts.length || !parts.some(p => p.f)) return null;
    const runs = 2000, tot = parts.reduce((s, p) => s + p.cr, 0), out = [];
    for (let r = 0; r < runs; r++) {
      let s = 0, w = 0;
      parts.forEach(p => { const v = p.f ? m.GRULES.points(m.letterOf(p.f.samples[r % p.f.samples.length], p.gr.g.scale), max) : p.fixed; if (v != null) { s += p.cr * v; w += p.cr; } });
      if (w > 0) out.push(s / w);
    }
    out.sort((a, b) => a - b);
    const q = p => out[Math.round(p * (out.length - 1))];
    return {p10: q(0.1), p50: q(0.5), p90: q(0.9), at: v => out.filter(x => x >= v - 1e-9).length / out.length, max, n: parts.length, tot};
  }

  /* 4. Target GPA */
  function planInputs(all){
    const m = M(), max = m.gpaMax(), S = m.termStats(all);
    return all.filter(gr => gr.current != null && !gr.g.pf && !gr.unw).map(gr => {
      const cr = isNum(gr.c.credits) ? Number(gr.c.credits) : S.def;
      const fin = gr.done ? m.letterOf(gr.minFinal, gr.g.scale) : null;
      const opts = gr.g.scale.map(x => ({letter: x[0], th: Number(x[1]), pts: m.GRULES.points(x[0], max)})).filter(x => x.pts != null)
        .map(x => Object.assign(x, {need: gr.done ? (x.letter === fin ? null : 999) : gr.need(x.th)})).filter(x => x.need == null || x.need <= 100);
      return {id: gr.c.id, gr, cr, rem: gr.remaining, base: gr.current, opts};
    }).filter(x => x.cr > 0 && x.opts.length);
  }
  // the best letter already secured in a course (no lower one is worth picking)
  const secOf = x => x.opts.filter(o => o.need != null && o.need <= 0).sort((a, b) => b.pts - a.pts)[0];
  const PLAN_UI = {target: null, locks: {}, cum: null, fut: null};
  function planHtml(all){
    const m = M(), max = m.gpaMax(); if (!max) return "";
    const ins = planInputs(all); if (!ins.length) return "";
    const S = m.termStats(all);
    const tgt = PLAN_UI.target != null ? PLAN_UI.target : Math.min(max, Math.ceil(((S.gpaProj || S.gpaNow || 3) + 0.05) * 10) / 10);
    const res = G().gpaPlan(ins, tgt, PLAN_UI.locks);
    const head = `<h3>${esc(tr("gp.plan.title", "Target GPA"))}<span class="spacer"></span><span class="mini">${esc(tr("gp.plan.now", "projected now {g}", {g: m.fmtG(S.gpaProj != null ? S.gpaProj : S.gpaNow)}))}</span></h3>`;
    const inp = `<div class="gi-plan-row"><label for="giPlanT">${esc(tr("gp.plan.q", "What term GPA are you aiming for?"))}</label><input id="giPlanT" type="number" min="0" max="${max}" step="0.05" inputmode="decimal" value="${esc(String(tgt))}" data-noenter></div>`;
    let body;
    if (!res.ok) {
      body = res.why === "reach" ? `<p class="gi-plan-out">${esc(tr("gp.plan.reach", "A {t} isn't reachable this term: the most still possible is {max}, with full marks on everything left. {low}", {t: m.fmtG(tgt), max: m.fmtG(res.max), low: res.max >= 0.1 ? tr("gp.plan.try", "Try a target at or under that.") : ""}))}</p>`
        : res.why === "lock" ? `<p class="gi-plan-out">${esc(tr("gp.plan.lock", "One of the letters you picked can't be reached any more."))} <button type="button" class="link-btn" data-act="gi-plan-unlock">${esc(tr("gp.plan.unlockAll", "Clear My Picks"))}</button></p>` : "";
    } else {
      const byId = new Map(res.picks.map(p => [p.id, p]));
      const rows = ins.map(x => {
        const p = byId.get(x.id); if (!p) return "";
        const c = x.gr.c, need = p.need == null ? tr("gp.plan.final", "final grade") : p.need <= 0 ? tr("gp.plan.sec", "already secured") : tr("gp.plan.need", "needs {n} on the remaining {w}", {n: m.fmtN(p.need), w: m.fmtW(x.rem)});
        const sel = x.opts.length > 1 && p.need != null ? `<select data-plan-c="${esc(c.id)}" aria-label="${esc(tr("gp.plan.pick", "Letter for {c}", {c: courseLabel(c)}))}">${x.opts.filter(o => o.need > 0 || o === secOf(x)).sort((a, b) => b.pts - a.pts).map(o => `<option value="${esc(o.letter)}"${o.letter === p.letter ? " selected" : ""}>${esc(o.letter)}</option>`).join("")}</select>` : "";
        const locked = !!PLAN_UI.locks[c.id];
        return `<li class="${locked ? "lock" : ""}" style="--c:${esc(c.color)}"><span class="gi-plan-n"><b>${esc(courseLabel(c))}</b><span class="mini">${esc(need)} · ${esc(tr("gp.plan.cr", "{n} credits", {n: m.fmtCr(x.cr)}))}${locked ? " · " + esc(tr("gp.plan.locked", "your pick")) : ""}</span></span>${sel || `<span class="gi-plan-l">${esc(p.letter)}</span>`}</li>`;
      }).join("");
      const hard = res.picks.filter(p => p.need != null && p.need > 0).sort((a, b) => b.need - a.need)[0];
      const say = tr("gp.plan.say", "Here's the easiest way to a {t}: it asks the least above what you've been getting.", {t: m.fmtG(tgt)}) + (hard ? " " + tr("gp.plan.hard", "The biggest ask is {c}.", {c: courseLabel(state.courses[hard.id])}) : "");
      // cumulative with this plan, when past terms are saved
      let cum = "";
      if (S.pastGpa != null) {
        const pastCr = [].concat(...S.T.filter(t => !t.manual).map(t => (t.courses || []).map(x => isNum(x.credits) ? Number(x.credits) : S.def))).reduce((s, v) => s + v, 0) + S.T.filter(t => t.manual).reduce((s, t) => s + (Number(t.credits) || 0), 0);
        const termCr = ins.reduce((s, x) => s + x.cr, 0), cumG = (S.pastGpa * pastCr + res.gpa * termCr) / (pastCr + termCr);
        cum = `<p class="mini">${esc(tr("gp.plan.cum", "With your past terms, this plan puts your cumulative GPA at {g}.", {g: m.fmtG(cumG)}))}</p>`;
        const ct = PLAN_UI.cum, fc = PLAN_UI.fut;
        const need = ct != null && fc ? G().cumNeed({pastPts: S.pastGpa * pastCr, pastCr, termGpa: res.gpa, termCr, target: ct, futureCr: fc}) : null;
        cum += `<details class="gi-cum"${ct != null ? " open" : ""}><summary>${esc(tr("gp.plan.ahead", "Planning further ahead?"))}</summary><div class="gi-plan-row"><label>${esc(tr("gp.plan.cumT", "Cumulative goal"))} <input id="giCumT" type="number" min="0" max="${max}" step="0.05" inputmode="decimal" value="${ct != null ? esc(String(ct)) : ""}" data-noenter></label><label>${esc(tr("gp.plan.fut", "Credits still to take"))} <input id="giCumF" type="number" min="1" max="400" step="1" inputmode="numeric" value="${fc ? esc(String(fc)) : ""}" data-noenter></label></div>${need != null ? `<p class="gi-plan-out">${esc(need > max ? tr("gp.plan.cumNo", "That would take more than a {max} on everything after this term, so it's out of reach. A lower goal still counts.", {max: m.fmtG(max)}) : need <= 0 ? tr("gp.plan.cumYes", "You'd already be there after this term.") : tr("gp.plan.cumNeed", "You'd need about a {g} average over your next {c} credits.", {g: m.fmtG(need), c: fc}))}</p>` : ""}</details>`;
      }
      body = `<p class="gi-plan-out">${esc(say)}</p><ul class="gi-plan-list">${rows}</ul>${cum}
        <div class="gi-plan-acts"><button type="button" class="btn small primary" data-act="gi-plan-save">${esc(tr("gp.plan.save", "Use These as My Course Goals"))}</button>${Object.keys(PLAN_UI.locks).length ? `<button type="button" class="btn small" data-act="gi-plan-unlock">${esc(tr("gp.plan.unlockAll", "Clear My Picks"))}</button>` : ""}</div>`;
      PLAN_UI.last = {res, ins};
    }
    return `<section class="gi-card gi-plan" aria-labelledby="giPlanH">${head.replace("<h3>", '<h3 id="giPlanH">')}${inp}<div class="gi-plan-body" aria-live="polite">${body}</div></section>`;
  }
  function savePlanGoals(){
    const L = PLAN_UI.last; if (!L || !L.res.ok) return;
    const chs = L.res.picks.filter(p => p.need != null).map(p => {
      const c = state.courses[p.id], x = L.ins.find(i => i.id === p.id), o = x && x.opts.find(q => q.letter === p.letter); if (!c || !o) return null;
      const n = clone(c); n.grading = Object.assign({}, n.grading || {}, {goal: o.th}); return {kind: "course", id: c.id, after: n};
    }).filter(Boolean);
    if (chs.length) applyChanges(chs, trn("gp.plan.saved", chs.length, "Goal set for {n} course|Goals set for {n} courses"));
  }
  // Only the results redraw, so the box being typed in stays put (replacing it mid-blur would fire its change again)
  let planBusy = false;
  const redrawPlan = () => {
    const sec = document.querySelector(".gi-plan"); if (!sec || planBusy) return;
    planBusy = true;
    try {
      const tmp = document.createElement("div"); tmp.innerHTML = planHtml(M().grades());
      const nb = tmp.querySelector(".gi-plan-body"), ob = sec.querySelector(".gi-plan-body"), nh = tmp.querySelector("h3"), oh = sec.querySelector("h3");
      const f = document.activeElement && ob && ob.contains(document.activeElement) ? document.activeElement.id || (document.activeElement.dataset.planC && "plan:" + document.activeElement.dataset.planC) : "";
      if (nh && oh && oh.innerHTML !== nh.innerHTML) oh.innerHTML = nh.innerHTML;
      // unchanged results stay as they are (leaving the box fires a change; a button being clicked mustn't be swapped out)
      if (nb && ob) { if (ob.innerHTML !== nb.innerHTML) ob.innerHTML = nb.innerHTML; } else if (ob) ob.innerHTML = "";
      if (f) { const el = f.startsWith("plan:") ? sec.querySelector(`[data-plan-c="${CSS.escape(f.slice(5))}"]`) : document.getElementById(f); if (el) el.focus(); }
    } finally { planBusy = false; }
  };
  document.addEventListener("change", e => {
    const t = e.target; if (!t || !t.closest || !t.closest(".gi-plan")) return;
    if (t.id === "giPlanT") { const v = Number(t.value), max = M().gpaMax(); if (isFinite(v) && v > 0 && v <= max) { PLAN_UI.target = Math.round(v * 100) / 100; PLAN_UI.locks = {}; } redrawPlan(); }
    else if (t.dataset.planC) { PLAN_UI.locks[t.dataset.planC] = t.value; redrawPlan(); }
    else if (t.id === "giCumT" || t.id === "giCumF") { const v = Number(t.value); if (t.id === "giCumT") PLAN_UI.cum = isFinite(v) && v > 0 ? v : null; else PLAN_UI.fut = isFinite(v) && v > 0 ? Math.round(v) : null; redrawPlan(); }
  });
  hook("act", (act) => {
    if (act === "gi-plan-save") { savePlanGoals(); return true; }
    if (act === "gi-plan-unlock") { PLAN_UI.locks = {}; redrawPlan(); return true; }
    return false;
  });

  /* 7. Best use of your next hour */
  function roiItems(all){
    const m = M(), today = todayISO(), out = [];
    all.forEach(gr => {
      if (gr.unw || gr.done || gr.g.pf) return;
      const f = fcOf(gr), proj = f ? f.p50 : gr.projected != null ? gr.projected : gr.current;
      const b = proj != null ? G().boundary(proj, gr.g.scale) : null;
      gr.open.forEach(t => {
        if (t.status === "done" || (t.due && t.due < today) || !(m.wOf(t) > 0)) return;
        let h = 0; try { h = remainingOf(t); if (!(h > 0) && MILESTONE(t.type)) h = effortOf(t) * (1 - progress(t).frac); } catch (e) { h = 1; }
        const usual = f ? f.cat(t.type).m : gr.current;
        out.push({id: t.id, t, gr, w: m.wOf(t) / gr.D * 100, hours: h, m: usual, gapUp: b && b.up ? b.up.gap : null, up: b && b.up ? b.up.letter : ""});
      });
    });
    return G().roi(out);
  }
  function roiHtml(all){
    const m = M(), list = roiItems(all).slice(0, 5); if (list.length < 2) return "";
    const rows = list.map((x, i) => {
      const c = x.gr.c, why = tr("gr.roi.why", "you usually get {m} on {type}, it's worth {w}, about {h} left", {m: m.fmtP(x.m), type: m.typePl(x.t.type).toLowerCase(), w: m.fmtW(x.w), h: fmtHM(x.hours)});
      return `<li style="--c:${esc(c.color)}"><span class="gi-roi-n">${i + 1}</span><span class="gi-roi-t"><b>${esc(x.t.title)}</b><span class="mini">${esc(courseLabel(c))}${x.t.due ? " · " + esc(fmtShort(x.t.due)) : ""} · ${esc(why)}${x.cross ? " · " + esc(tr("gr.roi.cross", "could tip you to {l}", {l: x.up})) : ""}</span></span><span class="gi-roi-v">${esc(tr("gr.roi.v", "+{n} pts/hr", {n: SBI18N.fmtN(r1(x.perHour * 10) / 10)}))}</span></li>`;
    }).join("");
    return `<section class="gi-card gi-roi" aria-labelledby="giRoiH"><h3 id="giRoiH">${esc(tr("gr.roi.title", "Best Use of Your Next Hour"))}</h3><p class="gi-sub">${esc(tr("gr.roi.sub", "Graded work ranked by how much an hour on it could add to that course's grade, if it goes {l} points better than you usually do there.", {l: "10–15"}))}</p><ol class="gi-roi-list">${rows}</ol></section>`;
  }

  /* On the Grades page: the forecast summary, Target GPA and the next hour */
  function termFcHtml(all){
    const m = M(), gf = gpaFc(all);
    const rows = all.map(gr => ({gr, f: fcOf(gr)})).filter(x => x.f && x.f.top);
    if (!gf && !rows.length) return "";
    const head = gf ? `<div class="gi-fc-head"><span class="gi-fc-big">${esc(tr("fc.gpa", "Term GPA likely {mid}", {mid: m.fmtG(gf.p50)}))}</span><span class="mini">${esc(tr("fc.gpaR", "between {lo} and {hi} out of {max}", {lo: m.fmtG(gf.p10), hi: m.fmtG(gf.p90), max: m.fmtG(gf.max)}))}</span></div>` : "";
    const list = rows.map(({gr, f}) => `<li>${esc(tr("fc.row", "{c}: most likely {l} ({lo} to {hi})", {c: courseLabel(gr.c), l: f.top.letter, lo: m.fmtP(f.p10), hi: m.fmtP(f.p90)}))}</li>`).join("");
    return `<section class="gi-card gi-fc" aria-labelledby="giFcH"><h3 id="giFcH">${esc(tr("fc.termTitle", "Where This Term Is Heading"))}</h3>${head}${list ? `<ul class="gi-fc-lines">${list}</ul>` : ""}<p class="gi-fc-why">${esc(tr("fc.termWhy", "Each course's forecast, from your marks so far. Open a course for its letter chances and what would change them."))}</p></section>`;
  }
  X().addSection("page", all => ({order: 10, html: termFcHtml(all)}));
  X().addSection("page", all => ({order: 20, html: roiHtml(all)}));
  X().addSection("page", all => ({order: 30, html: planHtml(all)}));

  X().judge((all) => {
    const m = M(), out = [];
    all.forEach(gr => { const f = fcOf(gr); if (f && f.top) out.push(`${courseLabel(gr.c)} forecast: most likely ${f.top.letter} (${r1(f.p10)}% to ${r1(f.p90)}%), from the student's marks so far; a likely range, not a promise.`); });
    const gf = gpaFc(all); if (gf) out.push(`Term GPA forecast: most likely ${m.fmtG(gf.p50)} (${m.fmtG(gf.p10)} to ${m.fmtG(gf.p90)}).`);
    const top = roiItems(all)[0]; if (top) out.push(`Best use of the next hour for grades: ${top.t.title} in ${courseLabel(top.gr.c)} (about ${r1(top.perHour)} course points per hour if it goes better than usual).`);
    return out;
  });
  window.SBGFC = {fcOf, gpaFc, planInputs, roiItems};
})();
