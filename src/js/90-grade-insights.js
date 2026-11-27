/* ===== module: 90-grade-insights.js ===== */
/* Deeper grade analysis (GRADE-ANALYSIS-PLAN.md). This module holds the math for every phase (GINS, which uses no app state, so
   tests can load it alone) and Phase 1: Where Your Points Went, the moment a mark is saved, letter cutoffs close by, and how you
   compare with the class. 90-grade-forecast.js (forecast, Target GPA, best next hour) and 90-grade-habits.js (patterns, timeline,
   weekly summary, term recap) build on it. Everything is worked out on the device from marks, weights, dates and focus time. */
(() => {
  /*GINS-START*/
  const GINS = (() => {
    const isN = v => v != null && v !== "" && isFinite(Number(v));
    const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
    const mean = a => a.length ? a.reduce((s, v) => s + v, 0) / a.length : null;
    const sdev = a => { if (a.length < 2) return null; const m = mean(a); return Math.sqrt(a.reduce((s, v) => s + (v - m) * (v - m), 0) / (a.length - 1)); };

    /* 1. Where the points went. items: [{id, title, cat, w (the share of the course it counts for, %), pct (its mark, %),
       pen (the late penalty, in percent of the item), missed (couldn't be handed in: counts as 0), dropped (a drop rule took it out)}]
       Points are course points: 10% of the course marked at 70% loses 3 of them. */
    function lost(items){
      let total = 0, late = 0, missed = 0, marked = 0, earned = 0, dropped = 0;
      const byCat = {}, rows = [];
      (items || []).forEach(it => {
        if (!it || !(Number(it.w) > 0)) return;
        if (it.dropped) { dropped++; return; }
        const w = Number(it.w), p = it.missed ? 0 : clamp(Number(it.pct) || 0, 0, 100), pts = w * (100 - p) / 100;
        marked += w; earned += w * p / 100;
        if (pts <= 1e-9) return;
        const lp = !it.missed && Number(it.pen) > 0 ? Math.min(pts, w * Number(it.pen) / 100) : 0;
        total += pts; late += lp;
        if (it.missed) missed += pts; else byCat[it.cat || "Other"] = (byCat[it.cat || "Other"] || 0) + pts - lp;
        rows.push({id: it.id, title: it.title || "", cat: it.cat || "Other", pts, late: lp, missed: !!it.missed});
      });
      const slices = Object.entries(byCat).filter(x => x[1] > 1e-9).map(([cat, pts]) => ({key: cat, kind: "cat", pts}))
        .concat(missed > 1e-9 ? [{key: "missed", kind: "missed", pts: missed}] : [], late > 1e-9 ? [{key: "late", kind: "late", pts: late}] : [])
        .sort((a, b) => b.pts - a.pts);
      return {total, late, missed, marked, earned, dropped, slices, items: rows.sort((a, b) => b.pts - a.pts)};
    }

    /* 2. The letter a grade is in, how far above its line, and how far to the next one up. scale: [[letter, lowest %]] */
    function boundary(p, scale){
      if (!isN(p) || !Array.isArray(scale)) return null;
      const sc = scale.map(x => [String(x[0]), Number(x[1])]).filter(x => isFinite(x[1])).sort((a, b) => b[1] - a[1]);
      const i = sc.findIndex(x => Number(p) >= x[1] - 1e-9); if (i < 0) return null;
      const up = i > 0 ? sc[i - 1] : null, dn = i + 1 < sc.length ? sc[i + 1] : null;
      return {letter: sc[i][0], floor: sc[i][1], above: Number(p) - sc[i][1], up: up ? {letter: up[0], th: up[1], gap: up[1] - Number(p)} : null, down: dn && sc[i][1] > 0 ? {letter: dn[0]} : null};
    }
    // Within `near` points of the next letter up, or of falling to the one below
    function edge(p, scale, near){
      const b = boundary(p, scale), n = near == null ? 1 : near; if (!b) return null;
      if (b.up && b.up.gap > 1e-9 && b.up.gap <= n) return {dir: "up", letter: b.up.letter, gap: b.up.gap, now: b.letter};
      if (b.down && b.above <= n) return {dir: "down", letter: b.letter, gap: b.above, below: b.down.letter, now: b.letter};
      return null;
    }

    /* 8. The class's results on one item, in percent: low, quartiles, median, high, mean, and where your mark sits */
    function spread(cls, of, mine){
      if (!cls || !(Number(of) > 0)) return null;
      const f = v => isN(v) ? Number(v) / Number(of) * 100 : null;
      const o = {lo: f(cls.lo), lq: f(cls.lq), med: f(cls.median), uq: f(cls.uq), hi: f(cls.hi), mean: f(cls.mean), mine: isN(mine) ? Number(mine) : null};
      if (o.med == null && o.mean == null) return null;
      o.mid = o.med != null ? o.med : o.mean;
      o.vs = o.mine != null ? o.mine - o.mid : null;
      o.band = o.mine == null ? null : o.uq != null && o.mine >= o.uq - 1e-9 ? "top" : o.lq != null && o.mine < o.lq - 1e-9 ? "low" : o.mine >= o.mid - 1e-9 ? "upper" : "lower";
      return o;
    }

    /* Random numbers that repeat for the same seed, so a forecast doesn't flicker between redraws */
    function rng(seed){
      let a = (Number(seed) >>> 0) || 1;
      const next = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
      let spare = null;
      next.normal = () => { if (spare != null) { const s = spare; spare = null; return s; } let u = 0, v = 0; while (u === 0) u = next(); v = next(); const r = Math.sqrt(-2 * Math.log(u)); spare = r * Math.sin(2 * Math.PI * v); return r * Math.cos(2 * Math.PI * v); };
      return next;
    }
    const seedOf = s => { let h = 2166136261; String(s || "").split("").forEach(ch => { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }); return h >>> 0; };

    /* 3. Forecast. GR: the grade rules (GRULES: finalWith does drops and bonus the same way the grade does). items: GRULES items
       [{id, w, cat, fin, pct (null when unmarked), z (counts as 0)}], R: rules, D: what the course is out of.
       Each unmarked item is drawn around your average on that type of work (pulled toward your overall average while there are
       few marks), with a spread from how much your marks vary (never under 6 points, 8 for exams), plus a shared "form" for the
       whole run (a good or bad stretch moves everything a little). Needs 3 marks; returns null otherwise or when nothing is left. */
    function catStats(items){
      const marked = items.filter(it => it.pct != null && isFinite(it.pct)), all = marked.map(it => Number(it.pct));
      if (marked.length < 3) return null;
      const mAll = mean(all), sAll = Math.max(sdev(all) || 0, 6), K = 2, by = {};
      marked.forEach(it => { (by[it.cat || ""] = by[it.cat || ""] || []).push(Number(it.pct)); });
      const of = cat => {
        const a = by[cat || ""] || [], n = a.length, m = (n * (n ? mean(a) : 0) + K * mAll) / (n + K), s0 = n >= 2 ? sdev(a) : sAll;
        return {m, s: Math.max(Math.sqrt((n * s0 * s0 + K * sAll * sAll) / (n + K)), cat === "Exam" ? 8 : 6), n};
      };
      return {mAll, sAll, of, n: marked.length};
    }
    function forecast(GR, items, R, D, o){
      o = o || {};
      const S = catStats(items || []); if (!S) return null;
      const open = items.filter(it => it.pct == null && !it.z && Number(it.w) > 0); if (!open.length) return null;
      const st = new Map(open.map(it => [it, S.of(it.cat)])), rnd = rng(o.seed || 1), runs = Math.max(50, o.runs || 2000), form = o.form != null ? o.form : 4;
      const out = new Float64Array(runs), add = Number(o.add) || 0, fix = o.fix || {};
      for (let r = 0; r < runs; r++) {
        const f = rnd.normal() * form;
        const copy = items.map(it => {
          if (it.pct != null || it.z || !(Number(it.w) > 0)) return it;
          if (isN(fix[it.id])) return Object.assign({}, it, {pct: Number(fix[it.id])});
          const s = st.get(it);
          return Object.assign({}, it, {pct: clamp(s.m + f + rnd.normal() * s.s, 0, 100)});
        });
        out[r] = GR.finalWith(copy, R, D, 0) + add;
      }
      const v = Array.from(out).sort((a, b) => a - b), q = p => v[Math.min(v.length - 1, Math.max(0, Math.round(p * (v.length - 1))))];
      const at = th => v.filter(x => x >= th - 1e-9).length / v.length;
      let buckets = null, top = null;
      if (Array.isArray(o.scale) && o.scale.length) {
        const sc = o.scale.map(x => [String(x[0]), Number(x[1])]).sort((a, b) => b[1] - a[1]);
        buckets = sc.map((x, i) => { const hi = i ? sc[i - 1][1] : Infinity; return {letter: x[0], th: x[1], p: v.filter(y => y >= x[1] - 1e-9 && y < hi - 1e-9).length / v.length}; });
        top = buckets.slice().sort((a, b) => b.p - a.p)[0];
      }
      // samples: the runs in the order they were drawn, so a term GPA can combine courses run by run
      return {runs, p10: q(0.1), p25: q(0.25), p50: q(0.5), p75: q(0.75), p90: q(0.9), mean: mean(v), at, buckets, top, cat: S.of, samples: out};
    }

    /* 4. Target GPA. courses: [{id, cr (credits), rem (share of the course still to come, %), base (your average so far),
       opts: [{letter, pts (GPA points), need (the average needed on what's left: 0 or less is secured, over 100 out of reach,
       null when the course is finished and this is its letter)}]}]. Picks one letter per course so the credit-weighted GPA reaches
       `target`, asking as little as possible beyond what you're already doing: cost grows with the square of how far a needed
       average is above your average so far. locks: {courseId: letter}. */
    function gpaPlan(courses, target, locks){
      locks = locks || {};
      const C = [], fixed = [];
      for (const c of courses || []) {
        if (!(Number(c.cr) > 0) || !Array.isArray(c.opts) || !c.opts.length) continue;
        let opts = c.opts.filter(x => isN(x.pts) && (x.need == null || x.need <= 100 + 1e-9));
        const sec = opts.filter(x => x.need != null && x.need <= 1e-9).sort((a, b) => b.pts - a.pts)[0], fin = opts.filter(x => x.need == null);
        if (fin.length) opts = [fin.sort((a, b) => b.pts - a.pts)[0]];
        else if (sec) opts = opts.filter(x => x.pts >= sec.pts - 1e-9 && (x.need > 1e-9 || x === sec));
        if (locks[c.id]) { const L = opts.filter(x => x.letter === locks[c.id]); if (!L.length) return {ok: false, why: "lock", id: c.id}; opts = L; }
        if (!opts.length) continue;
        const base = isN(c.base) ? Number(c.base) : 75, rem = clamp(Number(c.rem) || 0, 0, 100);
        const cost = x => x.need == null || x.need <= 0 ? 0 : Number(c.cr) * rem / 100 * Math.pow(Math.max(0, x.need - base) / 10, 2) + Number(c.cr) * rem / 100 * x.need / 1e4;
        const best = new Map(); opts.forEach(x => { const k = x.pts; if (!best.has(k) || cost(x) < cost(best.get(k))) best.set(k, x); });
        const o2 = [...best.values()].map(x => Object.assign({}, x, {cost: cost(x)})).sort((a, b) => a.pts - b.pts);
        (o2.length === 1 ? fixed : C).push({id: c.id, cr: Number(c.cr), opts: o2});
      }
      const all = C.concat(fixed), tot = all.reduce((s, c) => s + c.cr, 0);
      if (!tot) return {ok: false, why: "none"};
      const maxG = all.reduce((s, c) => s + c.cr * c.opts[c.opts.length - 1].pts, 0) / tot, minG = all.reduce((s, c) => s + c.cr * c.opts[0].pts, 0) / tot;
      const fixPts = fixed.reduce((s, c) => s + c.cr * c.opts[0].pts, 0);
      if (maxG < target - 1e-9) return {ok: false, why: "reach", max: maxG, min: minG};
      C.sort((a, b) => b.cr - a.cr);
      const restMax = new Array(C.length + 1).fill(0);
      for (let i = C.length - 1; i >= 0; i--) restMax[i] = restMax[i + 1] + C[i].cr * C[i].opts[C[i].opts.length - 1].pts;
      const need = target * tot - 1e-9;
      let best = null, bestCost = Infinity, steps = 0;
      const pick = new Array(C.length);
      (function go(i, pts, cost){
        if (++steps > 400000 || cost >= bestCost - 1e-12) return;
        if (pts + fixPts + restMax[i] < need) return;
        if (i === C.length) { bestCost = cost; best = pick.slice(); return; }
        for (const x of C[i].opts) { pick[i] = x; go(i + 1, pts + C[i].cr * x.pts, cost + x.cost); }
      })(0, 0, 0);
      if (!best) return {ok: false, why: "reach", max: maxG, min: minG};
      const picks = C.map((c, i) => Object.assign({id: c.id, cr: c.cr}, best[i])).concat(fixed.map(c => Object.assign({id: c.id, cr: c.cr, fixed: true}, c.opts[0])));
      return {ok: true, gpa: picks.reduce((s, p) => s + p.cr * p.pts, 0) / tot, cost: bestCost, picks, max: maxG, min: minG};
    }
    // The GPA a set of future terms needs for a cumulative target: null when there are no future credits
    function cumNeed(o){
      const {pastPts = 0, pastCr = 0, termGpa = 0, termCr = 0, target, futureCr} = o || {};
      if (!(Number(futureCr) > 0) || !isN(target)) return null;
      return (target * (pastCr + termCr + futureCr) - pastPts - termGpa * termCr) / futureCr;
    }

    /* 7. Best use of the next hour. items: [{id, w (share of the course, %), hours (left), m (what you usually get on this type),
       gapUp (points to the course's next letter, when close)}]. lift: how much better than usual focused work could do on it,
       half the room left under 97, between 2 and 25 points. gain: what that is in course points. Ranked by gain per hour;
       cross: the gain would reach the course's next letter. */
    function roi(items){
      return (items || []).filter(it => Number(it.w) > 0).map(it => {
        const m = isN(it.m) ? Number(it.m) : 75, lift = clamp((97 - m) * 0.5, 2, 25), gain = Number(it.w) * lift / 100, h = Math.max(0.25, Number(it.hours) || 1);
        const cross = isN(it.gapUp) && Number(it.gapUp) > 0 && Number(it.gapUp) <= gain;
        return Object.assign({}, it, {lift, gain, h, perHour: gain / h, cross});
      }).sort((a, b) => b.perHour - a.perHour || (b.cross ? 1 : 0) - (a.cross ? 1 : 0));
    }

    /* 5. Habits and results. marks: [{pct, type, lead (days between first working on it and its due date), min (minutes worked),
       late (handed in late: true/false/null), penPts (course points lost to its late penalty), ready (practice score before an
       exam), night (worked mostly 10pm-4am: true/false/null)}]. Each finding needs 4 or more marks on each side and a 5-point gap;
       they come out strongest first. Correlations only: the wording elsewhere says "tended to". */
    const MIN_N = 4, MIN_GAP = 5;
    function habits(marks){
      const out = [], pctOf = a => mean(a.map(x => Number(x.pct)));
      const cmp = (key, a, b, extra) => {
        if (a.length < MIN_N || b.length < MIN_N) return;
        const ma = pctOf(a), mb = pctOf(b), gap = ma - mb;
        if (Math.abs(gap) < MIN_GAP) return;
        out.push(Object.assign({key, a: ma, b: mb, na: a.length, nb: b.length, gap, w: Math.abs(gap) * Math.sqrt(Math.min(a.length, b.length))}, extra || {}));
      };
      const M = (marks || []).filter(x => x && isN(x.pct));
      const L = M.filter(x => isN(x.lead));
      cmp("lead", L.filter(x => x.lead >= 3), L.filter(x => x.lead <= 1));
      const byType = {};
      M.filter(x => Number(x.min) > 0).forEach(x => { (byType[x.type || "Other"] = byType[x.type || "Other"] || []).push(x); });
      Object.entries(byType).forEach(([type, a]) => {
        if (a.length < MIN_N * 2) return;
        const s = a.slice().sort((x, y) => x.min - y.min), h = Math.floor(s.length / 2), cut = s[h].min;
        cmp("time", s.slice(h), s.slice(0, h), {type, cut});
      });
      const late = M.filter(x => x.late === true), on = M.filter(x => x.late === false);
      const cost = late.reduce((s, x) => s + (Number(x.penPts) || 0), 0);
      if (late.length >= 2 && cost > 0.05) out.push({key: "late", n: late.length, cost, w: 3 + cost * 2});
      cmp("lateMark", on, late);
      const rd = M.filter(x => isN(x.ready));
      if (rd.length >= 3) {
        const bias = mean(rd.map(x => Number(x.ready) - Number(x.pct))), err = mean(rd.map(x => Math.abs(Number(x.ready) - Number(x.pct))));
        if (err <= 8 || Math.abs(bias) >= 8) out.push({key: "ready", n: rd.length, bias, err, w: err <= 8 ? 4 : Math.abs(bias) / 2});
      }
      const nt = M.filter(x => x.night === true || x.night === false);
      cmp("night", nt.filter(x => !x.night), nt.filter(x => x.night));
      return out.sort((a, b) => b.w - a.w);
    }

    /* 6. Term timeline. Week ends (Sundays) from `start` to `end` ("YYYY-MM-DD"), with `end` itself last. */
    const dUTC = s => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || "")); return m ? Date.UTC(+m[1], +m[2] - 1, +m[3]) : NaN; };
    const isoUTC = ms => new Date(ms).toISOString().slice(0, 10);
    function weeks(start, end){
      const a = dUTC(start), b = dUTC(end); if (!isFinite(a) || !isFinite(b) || b < a) return [];
      const out = []; let d = a + ((7 - new Date(a).getUTCDay()) % 7) * 864e5;
      for (let k = 0; d < b && k < 60; k++, d += 7 * 864e5) out.push(isoUTC(d));
      out.push(isoUTC(b));
      return out;
    }
    // points: [{key: week end, v}] -> the change over the last week, and the biggest single-week move
    function moves(pts){
      const v = (pts || []).filter(p => isN(p.v));
      if (v.length < 2) return {last: null, big: null};
      let big = null;
      for (let i = 1; i < v.length; i++) { const d = v[i].v - v[i - 1].v; if (!big || Math.abs(d) > Math.abs(big.d)) big = {key: v[i].key, d}; }
      return {last: v[v.length - 1].v - v[v.length - 2].v, big};
    }

    return {lost, boundary, edge, spread, rng, seedOf, catStats, forecast, gpaPlan, cumNeed, roi, habits, weeks, moves, mean, sdev, MIN_N, MIN_GAP};
  })();
  /*GINS-END*/

  const M = () => window.SBGRADES && window.SBGRADES.math;
  const r1 = v => Math.round(v * 10) / 10;
  const pts = v => tr("gi.pts", "{n} pts", {n: SBI18N.fmtN(r1(v))});
  const catName = (k, m) => k === "late" ? tr("gi.lost.late", "Late penalties") : k === "missed" ? tr("gi.lost.missed", "Missed work") : m.typePl(k);
  // The share of the course a mark counts for, as the grade counts it (a drop rule's kept marks carry the dropped ones' weight)
  const shareOf = (gr, t) => { const m = M(), ew = gr.ew || {}; return (isNum(ew[t.id]) ? ew[t.id] : m.wOf(t)) / gr.D * 100; };
  const penPct = t => { const k = t.mark; return k && isNum(k.before) && Number(k.outOf) > 0 && Number(k.before) > Number(k.got) ? (Number(k.before) - Number(k.got)) / Number(k.outOf) * 100 : 0; };

  /* 1. Where Your Points Went */
  function lostOf(gr){
    const m = M();
    const its = gr.marked.map(t => ({id: t.id, title: t.title, cat: t.type || "Other", w: shareOf(gr, t), pct: gr.pm.get(t.id), pen: penPct(t), dropped: gr.dropped.has(t.id)}))
      .concat((gr.missed || []).map(t => ({id: t.id, title: t.title, cat: t.type || "Other", w: m.wOf(t) / gr.D * 100, pct: 0, missed: true})));
    return GINS.lost(its);
  }
  const SLICE_C = ["var(--accent)", "color-mix(in srgb,var(--accent) 62%,var(--ink))", "color-mix(in srgb,var(--accent) 45%,var(--surface))", "color-mix(in srgb,var(--accent) 30%,var(--ink))", "color-mix(in srgb,var(--accent) 25%,var(--surface))"];
  const sliceColor = (s, i) => s.kind === "late" ? "var(--warn,#c98a12)" : s.kind === "missed" ? "var(--late)" : SLICE_C[i % SLICE_C.length];
  function lostHtml(gr){
    if (gr.unw || gr.current == null) return "";
    const L = lostOf(gr), m = M(); if (L.total < 0.05) return "";
    const cs = L.slices.filter(s => s.kind === "cat");
    const sl = L.slices.map(s => Object.assign({}, s, {c: sliceColor(s, cs.indexOf(s))}));
    const name = s => catName(s.key, m);
    const sum = tr("gi.lost.sum", "You've lost {lost} of {course} so far, out of the {marked} marked.", {lost: pts(L.total), course: courseLabel(gr.c), marked: m.fmtW(L.marked)});
    const bar = `<div class="gi-lost-bar" role="img" aria-label="${esc(sum + " " + sl.map(s => name(s) + " " + pts(s.pts)).join(", "))}">${sl.map(s => `<i style="flex:${s.pts.toFixed(3)} 1 0;background:${s.c}" title="${esc(name(s) + ": " + pts(s.pts))}"></i>`).join("")}</div>`;
    const legend = `<ul class="gi-lost-leg">${sl.map(s => `<li><i style="background:${s.c}" aria-hidden="true"></i><span>${esc(name(s))}</span><b>${esc(pts(s.pts))}</b></li>`).join("")}</ul>`;
    const top = L.items.filter(x => x.pts >= 0.3).slice(0, 3);
    const lines = [];
    if (top.length) lines.push(esc(tr("gi.lost.top", "Most lost on: {list}.", {list: top.map(x => tr("gi.lost.item", "{title} ({n}{why})", {title: x.title, n: pts(x.pts), why: x.missed ? ", " + tr("gi.lost.missedw", "missed") : x.late > 0.05 ? ", " + tr("gi.lost.latew", "{n} of it late", {n: pts(x.late)}) : ""})).join(", ")})));
    if (L.late > 0.05) lines.push(esc(tr("gi.lost.lateLine", "Late penalties cost you {n}. Handing in on time is the cheapest fix there is.", {n: pts(L.late)})));
    if (L.dropped) lines.push(esc(trn("gi.lost.drop", L.dropped, "{n} dropped mark isn't counted here, as your drop rule leaves it out.|{n} dropped marks aren't counted here, as your drop rule leaves them out.")));
    return `<div class="gr-sub gi-lost"><h4>${esc(tr("gi.lost.title", "Where Your Points Went"))}</h4><p class="gi-lost-sum">${esc(sum)}</p>${bar}${legend}${lines.length ? `<ul class="gb-lines">${lines.map(x => `<li>${x}</li>`).join("")}</ul>` : ""}</div>`;
  }
  // Late penalties across every course this term, for the Grades page
  function lateTotal(all){
    let n = 0, p = 0;
    all.forEach(gr => gr.marked.forEach(t => { const pp = penPct(t); if (pp > 0 && !gr.dropped.has(t.id)) { n++; p += shareOf(gr, t) * pp / 100; } }));
    return {n, pts: p};
  }

  /* 2. Letter cutoffs close by */
  function edgeOf(gr){
    if (gr.current == null || gr.g.pf || gr.unw || gr.final) return null;
    return GINS.edge(gr.current, gr.g.scale, 1);
  }
  const edgeText = e => e.dir === "up" ? tr("gi.edge.up", "{n} from {letter}", {n: pts(e.gap), letter: e.letter}) : tr("gi.edge.down", "{n} above the {letter} line", {n: pts(e.gap), letter: e.letter});
  const edgeLong = (gr, e) => e.dir === "up"
    ? tr("gi.edge.upL", "You're {n} from {letter}. A strong mark on your next graded item could tip it over.", {n: pts(e.gap), letter: e.letter})
    : tr("gi.edge.downL", "You're {n} above the {letter} line, so a weak mark could drop you to {below}.", {n: pts(e.gap), letter: e.letter, below: e.below});

  /* 8. How you compare with the class (opt-in, Grade Options) */
  const LMS_KEYS = ["bs", "cv", "bb", "md", "sg", "gc"];
  function spreadOf(t){
    const m = M(), L = LMS_KEYS.map(f => t && t[f]).find(Boolean), fb = L && L.fb, p = m.markPct(t);
    return fb && fb.cls ? GINS.spread(fb.cls, fb.of, p) : null;
  }
  function stripSvg(s){
    const x = v => (Math.max(0, Math.min(100, v)) * 1.8 + 10).toFixed(1), y = 14, parts = [];
    parts.push(`<line class="gi-st-ax" x1="10" x2="190" y1="${y}" y2="${y}"/>`);
    if (s.lo != null && s.hi != null) parts.push(`<line class="gi-st-rng" x1="${x(s.lo)}" x2="${x(s.hi)}" y1="${y}" y2="${y}"/>`);
    if (s.lq != null && s.uq != null) parts.push(`<rect class="gi-st-box" x="${x(s.lq)}" y="${y - 6}" width="${Math.max(1, x(s.uq) - x(s.lq)).toFixed(1)}" height="12" rx="3"/>`);
    parts.push(`<line class="gi-st-mid" x1="${x(s.mid)}" x2="${x(s.mid)}" y1="${y - 8}" y2="${y + 8}"/>`);
    if (s.mine != null) parts.push(`<circle class="gi-st-me" cx="${x(s.mine)}" cy="${y}" r="5"/>`);
    return `<svg class="gi-st" viewBox="0 0 200 28" aria-hidden="true" focusable="false">${parts.join("")}</svg>`;
  }
  function compareHtml(gr){
    const m = M(); if (!m.gset().cls) return "";
    const rows = gr.marked.map(t => ({t, s: spreadOf(t)})).filter(x => x.s && x.s.mine != null);
    if (!rows.length) return "";
    const above = rows.filter(x => x.s.vs > 0.05).length, mid = rows.some(x => x.s.med != null) ? tr("gi.cmp.median", "median") : tr("gi.cmp.mean", "average");
    const P = v => m.fmtP(v);
    const li = rows.sort((a, b) => sortTasks(a.t, b.t)).map(({t, s}) => {
      const said = tr("gi.cmp.row", "{title}: you {mine}, class {mid} {cmid}{range}", {title: t.title, mine: P(s.mine), mid, cmid: P(s.mid), range: s.lo != null && s.hi != null ? tr("gi.cmp.range", ", range {lo} to {hi}", {lo: P(s.lo), hi: P(s.hi)}) : ""});
      const tag = s.band === "top" ? tr("gi.cmp.top", "Top quarter") : s.band === "low" ? tr("gi.cmp.low", "Bottom quarter") : Math.abs(s.vs) < 0.5 ? tr("gi.cmp.at", "At the {mid}", {mid}) : s.vs >= 0 ? tr("gi.cmp.upper", "Above {mid}", {mid}) : tr("gi.cmp.lower", "Below {mid}", {mid});
      return `<li role="img" aria-label="${esc(said)}"><span class="gi-cmp-t"><b>${esc(t.title)}</b><span class="mini">${esc(tr("gi.cmp.sub", "you {mine} · class {mid} {cmid}", {mine: P(s.mine), mid, cmid: P(s.mid)}))}</span></span>${stripSvg(s)}<span class="pill gi-band gi-band-${s.band}">${esc(tag)}</span></li>`;
    }).join("");
    return `<div class="gr-sub gi-cmp"><h4>${esc(tr("gi.cmp.title", "How You Compare"))}</h4><p class="mini" style="margin:0">${esc(trn("gi.cmp.sum", rows.length, "Above the class {mid} on {a} of {n} item your school site shares results for. It's context, not a ranking.|Above the class {mid} on {a} of {n} items your school site shares results for. It's context, not a ranking.", {a: above, mid}))}</p>
      <ul class="gi-cmp-list">${li}</ul><p class="mini gi-cmp-key" aria-hidden="true"><span class="gi-k-box"></span>${esc(tr("gi.cmp.keyBox", "middle half of the class"))} <span class="gi-k-mid"></span>${esc(mid)} <span class="gi-k-me"></span>${esc(tr("gi.cmp.keyMe", "you"))}</p></div>`;
  }

  /* 2. The moment a mark is saved: what it did to the course */
  const MOMENT_ID = "giMoment";
  let momentT = null;
  function momentEl(){
    let el = document.getElementById(MOMENT_ID);
    if (!el) { el = document.createElement("div"); el.id = MOMENT_ID; el.className = "gi-moment"; el.setAttribute("role", "status"); el.setAttribute("aria-live", "polite"); el.hidden = true; document.body.appendChild(el); }
    return el;
  }
  function hideMoment(){ const el = document.getElementById(MOMENT_ID); if (!el) return; el.classList.remove("show"); setTimeout(() => { if (!el.classList.contains("show")) el.hidden = true; }, 250); }
  function momentFor(t, before, after){
    const m = M(), g = after.g, p = m.markPct(t), cur = after.current, was = before ? before.current : null;
    const L = v => v != null ? m.letterOf(v, g.scale) : "", d = cur != null && was != null ? cur - was : null;
    const head = tr("gi.mo.head", "{title}: {mark}", {title: t.title, mark: m.fmtP(p) + (L(p) ? " " + L(p) : "")});
    const moved = cur == null ? "" : d == null ? tr("gi.mo.first", "{course} starts at {cur}.", {course: courseLabel(after.c), cur: m.fmtP(cur)})
      : Math.abs(d) < 0.05 ? tr("gi.mo.same", "{course} stays at {cur}.", {course: courseLabel(after.c), cur: m.fmtP(cur)})
      : tr("gi.mo.moved", "{course} is now {cur} ({d}).", {course: courseLabel(after.c), cur: m.fmtP(cur), d: (d > 0 ? "+" : "−") + SBI18N.fmtN(r1(Math.abs(d)))});
    const lw = L(was), lc = L(cur);
    let note = "", party = false;
    if (lc && lw && lc !== lw) { const up = cur > was; note = up ? tr("gi.mo.letterUp", "Up to {l}!", {l: lc}) : tr("gi.mo.letterDown", "That moves you to {l}. One mark doesn't decide a course.", {l: lc}); party = up; }
    const goal = g.goal;
    if (!note && goal != null && before && !after.done) {
      const nb = before.need(goal), na = after.need(goal);
      if (na != null && na <= 0 && !(nb != null && nb <= 0)) { note = tr("gi.mo.goal", "Your goal of {g} is locked in.", {g: m.fmtP(goal)}); party = true; }
      else if (na != null && na > 100 && !(nb != null && nb > 100)) note = tr("gi.mo.goalOut", "Your goal of {g} is out of reach now. The highest you can still get is {max}.", {g: m.fmtP(goal), max: m.fmtP(after.maxFinal)});
    }
    if (!note && cur != null) { const e = edgeOf(after); if (e) note = edgeLong(after, e); else { const b = GINS.boundary(cur, g.scale); if (b && b.letter && !g.pf) note = b.up ? tr("gi.mo.still", "Still {l}, {n} above the line and {u} from {up}.", {l: b.letter, n: pts(b.above), u: pts(b.up.gap), up: b.up.letter}) : tr("gi.mo.top", "Still {l}, the top of the scale.", {l: b.letter}); } }
    return {head, moved, note, party};
  }
  function showMoment(t, before, after){
    if (!after || after.unw || after.g.pf) return;
    const x = momentFor(t, before, after), el = momentEl();
    el.innerHTML = `<span class="gi-mo-ic${x.party ? " party" : ""}" aria-hidden="true">${x.party ? "🎉" : `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17l6-6 4 4 8-8"/><path d="M14 7h7v7"/></svg>`}</span>
      <span class="gi-mo-t"><b>${esc(x.head)}</b><span>${esc(x.moved)}</span>${x.note ? `<span class="gi-mo-note">${esc(x.note)}</span>` : ""}</span>
      <span class="gi-mo-acts"><button type="button" class="btn small" data-act="gi-mo-open" data-id="${esc(after.c.id)}">${esc(tr("gi.mo.open", "See Grades"))}</button><button type="button" class="icon-btn" data-act="gi-mo-close" aria-label="${esc(tr("gi.mo.close", "Close"))}"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button></span>`;
    el.hidden = false; requestAnimationFrame(() => el.classList.add("show"));
    try { if (typeof sbHaptic === "function") sbHaptic(x.party ? "success" : "tap"); } catch (e) {}
    clearTimeout(momentT); momentT = setTimeout(hideMoment, 9000);
  }
  // Around every save: the course grades before, and if one mark changed, what it did
  const sameMark = (a, b) => JSON.stringify(a || null) === JSON.stringify(b || null);
  const origApply = applyChanges;
  applyChanges = function(changes){
    let before = null;
    try {
      const m = M();
      if (m && Array.isArray(changes) && changes.length && changes.length <= 3 && changes.every(c => c && c.kind === "task")) {
        before = {};
        changes.forEach(c => { const t = state.tasks[c.id], cid = (c.after && c.after.courseId) || (t && t.courseId); if (cid && !before[cid] && state.courses[cid]) before[cid] = {gr: m.courseGrade(state.courses[cid]), marks: {}}; if (cid && before[cid]) before[cid].marks[c.id] = t ? t.mark : null; });
      }
    } catch (e) { before = null; }
    const r = origApply.apply(this, arguments);
    if (before) {
      try {
        const m = M(), hit = [];
        Object.entries(before).forEach(([cid, b]) => Object.entries(b.marks).forEach(([id, was]) => { const t = state.tasks[id]; if (t && t.courseId === cid && t.mark && m.markPct(t) != null && !t.mark.ex && !sameMark(was, t.mark)) hit.push({t, cid}); }));
        if (hit.length === 1 && m.gset().moment !== false) { const {t, cid} = hit[0]; showMoment(t, before[cid].gr, m.courseGrade(state.courses[cid])); }
      } catch (e) { console.warn("grade insights: moment", e); }
    }
    return r;
  };
  hook("act", (act, el, id) => {
    if (act === "gi-mo-close") { hideMoment(); return true; }
    if (act === "gi-mo-open") { hideMoment(); if (state.courses[id]) { ui.tab = "courses"; ui.courseId = id; ui.courseTab = "grades"; ui.courseTabFor = id; render(); } return true; }
    return false;
  });

  /* Putting the sections in place after each redraw (the same way the grade trend does) */
  const SECTIONS = {course: [], page: [], row: []};
  // where: "course" (a course's Grades card), "page" (the Grades page, under the course list), "row" (each course row on the Grades page)
  const addSection = (where, fn) => SECTIONS[where].push(fn);
  addSection("course", (gr, card) => {
    // letter cutoff close by, under the three numbers at the top
    const e = edgeOf(gr), top = card.querySelector(".gr-top");
    if (e && top && !card.querySelector(".gi-edge")) top.insertAdjacentHTML("afterend", `<p class="gi-edge gi-edge-${e.dir}" role="note"><span class="pill">${esc(edgeText(e))}</span> ${esc(edgeLong(gr, e))}</p>`);
    const html = lostHtml(gr) + compareHtml(gr); if (!html || card.querySelector(".gi-lost,.gi-cmp")) return;
    const gb = card.querySelector(".gr-sub.gb"), wi = card.querySelector(".gr-wi"), marked = [...card.querySelectorAll(".gr-sub")].find(x => !x.classList.contains("gt-sec") && /Marked/.test((x.querySelector("h4") || {}).textContent || ""));
    if (gb) gb.insertAdjacentHTML("afterend", html); else if (wi) wi.insertAdjacentHTML("beforebegin", html); else if (marked) marked.insertAdjacentHTML("beforebegin", html); else card.insertAdjacentHTML("beforeend", html);
  });
  addSection("row", (gr, row) => {
    const e = edgeOf(gr), main = row.querySelector(".gp-main .gp-who .mini");
    if (e && main && !row.querySelector(".gi-edge-chip")) main.insertAdjacentHTML("beforeend", ` · <span class="gi-edge-chip gi-edge-${e.dir}">${esc(edgeText(e))}</span>`);
  });
  addSection("page", all => {
    const lt = lateTotal(all); if (lt.n < 1 || lt.pts < 0.05) return "";
    // Your Patterns says it when there's a pattern to it
    try { if (window.SBGINS.habitsOf && SBGINS.habitsOf(all).list.some(h => h.key === "late")) return ""; } catch (e) {}
    return {order: 90, html: `<p class="gi-late-note mini" role="note"><b>${esc(tr("gi.late.k", "Late penalties this term:"))}</b> ${esc(trn("gi.late.v", lt.n, "{pts} of course grade lost on {n} item.|{pts} of course grade lost across {n} items.", {pts: pts(lt.pts)}))}</p>`};
  });
  hook("render", tab => {
    if (tab !== "courses") return;
    const m = M(); if (!m) return;
    try {
      if (ui.courseId) {
        if (ui.courseTab !== "grades" || ui.courseTabFor !== ui.courseId) return;
        const card = document.querySelector('.gr-card[aria-label="Grades"]'), c = courseOf(ui.courseId);
        if (!card || card.classList.contains("gr-empty") || !c) return;
        const gr = m.courseGrade(c); if (!gr.ts.length) return;
        SECTIONS.course.forEach(fn => { try { fn(gr, card); } catch (e) { console.warn("grade insights: course", e); } });
        return;
      }
      if (ui.courseTab !== "grades") return;
      const page = document.querySelector("section.gp"); if (!page || page.querySelector(".gi-page")) return;
      const all = m.grades();
      page.querySelectorAll(".gp-course").forEach(row => {
        const id = (row.querySelector(".gp-main") || {}).dataset; const c = id && courseOf(id.id); if (!c) return;
        const gr = all.find(x => x.c.id === c.id); if (!gr) return;
        SECTIONS.row.forEach(fn => { try { fn(gr, row); } catch (e) { console.warn("grade insights: row", e); } });
      });
      const parts = [];
      SECTIONS.page.forEach(fn => { try { const r = fn(all); if (r && r.html) parts.push(r); } catch (e) { console.warn("grade insights: page", e); } });
      const html = parts.sort((a, b) => a.order - b.order).map(p => p.html).join("");
      const at = page.querySelector(".gp-need") || page.querySelector(".gp-hero");
      if (at) at.insertAdjacentHTML("afterend", `<div class="gi-page">${html}</div>`);
    } catch (e) { console.warn("grade insights", e); }
  });

  /* What the AI coach is told (it words these; it doesn't work them out) */
  const JUDGE = [];
  JUDGE.push(all => {
    const m = M(), out = [];
    all.filter(gr => gr.current != null && !gr.unw && !m.zeroed(gr)).forEach(gr => {
      const L = lostOf(gr), name = courseLabel(gr.c);
      if (L.total >= 0.5 && L.slices.length) out.push(`${name}: ${r1(L.total)} course points lost so far on the ${r1(L.marked)}% marked; most from ${catName(L.slices[0].key, m).toLowerCase()} (${r1(L.slices[0].pts)} points)${L.late > 0.05 ? `, ${r1(L.late)} to late penalties` : ""}.`);
      const e = edgeOf(gr); if (e) out.push(`${name}: ${e.dir === "up" ? `${r1(e.gap)} points from ${e.letter}` : `only ${r1(e.gap)} points above the ${e.letter} cutoff`}.`);
    });
    return out;
  });

  window.SBGINS = {GINS, addSection, lostOf, edgeOf, spreadOf, shareOf, penPct, pts, judge: fn => JUDGE.push(fn),
    judgments: (all, S) => [].concat(...JUDGE.map(fn => { try { return fn(all, S) || []; } catch (e) { return []; } }))};
})();
