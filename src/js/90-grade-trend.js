/* ===== module: 90-grade-trend.js ===== */
/* Grade trend per course */
(() => {
  /*TREND-START*/
  const GTREND = (() => {
    // items: [{id, key: "YYYY-MM-DD" or "", seq}] -> dated items first by date
    function order(items){
      return items.slice().sort((a, b) => (a.key ? 0 : 1) - (b.key ? 0 : 1) || String(a.key || "").localeCompare(String(b.key || "")) || (a.seq || 0) - (b.seq || 0) || String(a.id).localeCompare(String(b.id)));
    }
    // runningAt(Set of ids) -> the course grade (percent) counting only those items, or null
    function points(items, runningAt){
      const ids = new Set(), out = [];
      order(items).forEach(it => {
        ids.add(it.id);
        const v = runningAt(new Set(ids));
        if (v != null && isFinite(v)) out.push(Object.assign({}, it, {pct: Number(v)}));
      });
      return out;
    }
    // The last few grades, as a neutral change
    function summary(pts, win){
      if (!pts || pts.length < 2) return null;
      const w = pts.slice(-(win || 4)), d = w[w.length - 1].pct - w[0].pct, p = Math.round(Math.abs(d));
      return {dir: p === 0 ? "flat" : d > 0 ? "up" : "down", pts: p, n: w.length, delta: d};
    }
    // The vertical range
    function domain(vals){
      vals = vals.filter(v => v != null && isFinite(v));
      if (!vals.length) return {lo: 0, hi: 100};
      let lo = Math.floor((Math.min.apply(null, vals) - 5) / 5) * 5, hi = Math.ceil((Math.max.apply(null, vals) + 5) / 5) * 5;
      lo = Math.max(0, lo); hi = Math.min(100, hi);
      if (hi - lo < 10) { if (hi >= 100) lo = hi - 10; else hi = lo + 10; }
      return {lo, hi};
    }
    // x/y of point i of n inside a box {l, t, w, h}
    function xy(i, n, v, dom, box){
      return {x: box.l + (n < 2 ? 0 : i * box.w / (n - 1)), y: box.t + (dom.hi - v) / (dom.hi - dom.lo) * box.h};
    }
    return {order, points, summary, domain, xy};
  })();
  /*TREND-END*/

  const math = () => window.SBGRADES && window.SBGRADES.math;
  const r1 = v => Math.round(v * 10) / 10;
  const num = v => SBI18N.fmtN(r1(v));
  const pctTxt = v => tr("trend.pct", "{v}%", {v: num(v)});
  const dayTxt = key => key ? SBI18N.fmtD(parse(key)) : tr("trend.nodate", "no date");

  // Everything the chart needs for one course, or null
  function dataFor(c){
    const m = math(); if (!m || !c) return null;
    const gr = m.courseGrade(c);
    const items = gr.marked.map(t => ({id: t.id, title: t.title, key: t.due || (t.doneAt ? iso(new Date(t.doneAt)) : ""), seq: Number(t.created) || 0}));
    const pts = GTREND.points(items, ids => m.courseGrade(c, ids).current);
    return {c, gr, g: gr.g, pts, sum: GTREND.summary(pts), goal: gr.g.goal, letter: p => m.letterOf(p, gr.g.scale)};
  }
  function sumText(s){
    if (!s) return "";
    if (s.dir === "flat") return tr("trend.flat", "Holding steady over your last {k} grades", {k: SBI18N.fmtN(s.n)});
    return s.dir === "up" ? trn("trend.up", s.pts, "Up {n} point over your last {k} grades|Up {n} points over your last {k} grades", {k: SBI18N.fmtN(s.n)})
      : trn("trend.down", s.pts, "Down {n} point over your last {k} grades|Down {n} points over your last {k} grades", {k: SBI18N.fmtN(s.n)});
  }
  const lastTxt = d => { const p = d.pts[d.pts.length - 1], L = d.letter(p.pct); return pctTxt(p.pct) + (L ? " " + L : ""); };

  /* The chart */
  function chartHtml(d){
    const W = 320, H = 158, box = {l: 40, t: 18, w: 320 - 40 - 16, h: 158 - 18 - 30}, n = d.pts.length;
    const dom = GTREND.domain(d.pts.map(p => p.pct).concat(d.goal != null ? [d.goal] : []));
    const P = d.pts.map((p, i) => GTREND.xy(i, n, p.pct, dom, box));
    const f = v => v.toFixed(1), mid = Math.round((dom.lo + dom.hi) / 2 / 5) * 5;
    const ticks = [dom.hi, mid, dom.lo].filter((v, i, a) => a.indexOf(v) === i);
    const yOf = v => GTREND.xy(0, 1, v, dom, box).y;
    const last = P[n - 1], below = last.y < 30;
    const sum = sumText(d.sum), name = courseLabel(d.c);
    const desc = tr("trend.desc", "Running grade for {course} after each of {n} graded items, from {first} to {last}.", {course: name, n: SBI18N.fmtN(n), first: pctTxt(d.pts[0].pct), last: lastTxt(d)})
      + (d.goal != null ? " " + tr("trend.descgoal", "Your goal is {goal}.", {goal: pctTxt(d.goal)}) : "");
    const svg = `<svg class="gt-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(sum + ". " + desc)}" focusable="false">
      ${ticks.map(v => `<line class="gt-grid" x1="${box.l}" x2="${box.l + box.w}" y1="${f(yOf(v))}" y2="${f(yOf(v))}"/><text class="gt-ax" x="${box.l - 6}" y="${f(yOf(v) + 4)}" text-anchor="end">${esc(pctTxt(v))}</text>`).join("")}
      ${d.goal != null ? `<line class="gt-goal" x1="${box.l}" x2="${box.l + box.w}" y1="${f(yOf(d.goal))}" y2="${f(yOf(d.goal))}"/><text class="gt-goal-t" x="${box.l + 4}" y="${f(Math.abs(P[0].y - yOf(d.goal) + 9) < 12 ? yOf(d.goal) + 14 : yOf(d.goal) - 5)}" text-anchor="start">${esc(tr("trend.goal", "Goal {goal}", {goal: pctTxt(d.goal)}))}</text>` : ""}
      <polyline class="gt-line" fill="none" points="${P.map(p => f(p.x) + "," + f(p.y)).join(" ")}"/>
      ${P.map((p, i) => `<circle class="gt-dot${i === n - 1 ? " last" : ""}" cx="${f(p.x)}" cy="${f(p.y)}" r="${i === n - 1 ? 5.5 : 4}"/>`).join("")}
      <text class="gt-val" x="${f(Math.min(last.x, W - 8))}" y="${f(below ? last.y + 19 : last.y - 10)}" text-anchor="end">${esc(lastTxt(d))}</text>
      <text class="gt-ax" x="${box.l}" y="${H - 8}" text-anchor="start">${esc(dayTxt(d.pts[0].key))}</text>
      <text class="gt-ax" x="${box.l + box.w}" y="${H - 8}" text-anchor="end">${esc(dayTxt(d.pts[n - 1].key))}</text>
    </svg>`;
    const rows = d.pts.map(p => `<tr><th scope="row">${esc(p.title)}</th><td>${esc(dayTxt(p.key))}</td><td>${esc(pctTxt(p.pct))}${d.letter(p.pct) ? " " + esc(d.letter(p.pct)) : ""}</td></tr>`).join("");
    return `<figure class="gt-fig">${svg}
      <figcaption><b class="gt-sum">${esc(sum)}</b><span class="mini">${esc(tr("trend.cap", "Your grade after each graded item, in due date order."))}</span></figcaption>
      <table class="sr"><caption>${esc(tr("trend.tcap", "Running grade after each graded item in {course}", {course: name}))}</caption><thead><tr><th scope="col">${esc(tr("trend.th.item", "Item"))}</th><th scope="col">${esc(tr("trend.th.date", "Date"))}</th><th scope="col">${esc(tr("trend.th.grade", "Running grade"))}</th></tr></thead><tbody>${rows}</tbody></table></figure>`;
  }
  function sectionHtml(c){
    const d = dataFor(c); if (!d || !d.gr.ts.length) return "";
    const head = `<h4>${esc(tr("trend.title", "Grade Trend"))}</h4>`;
    if (d.pts.length < 2) {
      return `<div class="gr-sub gt-sec">${head}<p class="mini gt-empty" style="margin:0">${esc(d.pts.length ? tr("trend.empty1", "One mark so far. Add one more and you'll see how your grade is moving.") : tr("trend.empty0", "Your grade trend shows up here once you have two marks. Add them from the list below as they come back."))}</p></div>`;
    }
    return `<div class="gr-sub gt-sec">${head}${chartHtml(d)}</div>`;
  }

  /* Sparkline on course cards */
  function sparkHtml(d){
    const n = d.pts.length, box = {l: 3, t: 3, w: 58, h: 14}, dom = GTREND.domain(d.pts.map(p => p.pct));
    const P = d.pts.map((p, i) => GTREND.xy(i, n, p.pct, dom, box)), f = v => v.toFixed(1), e = P[n - 1];
    return `<span class="gt-spark"><svg viewBox="0 0 64 20" width="64" height="20" aria-hidden="true" focusable="false"><polyline fill="none" points="${P.map(p => f(p.x) + "," + f(p.y)).join(" ")}"/><circle cx="${f(e.x)}" cy="${f(e.y)}" r="2.6"/></svg><span class="sr">${esc(tr("trend.sparkpre", "Trend:") + " " + sumText(d.sum))}</span></span>`;
  }

  hook("render", tab => {
    if (tab !== "courses") return;
    try {
      if (ui.courseId) {
        if (ui.courseTab !== "grades" || ui.courseTabFor !== ui.courseId) return;
        const card = $('.gr-card[aria-label="Grades"]'); if (!card || card.classList.contains("gr-empty") || $(".gt-sec", card)) return;
        const html = sectionHtml(courseOf(ui.courseId)); if (!html) return;
        const at = $(".gr-sub", card);
        if (at) at.insertAdjacentHTML("beforebegin", html); else card.insertAdjacentHTML("beforeend", html);
        return;
      }
      $$('.course-card[data-act="open-course"]').forEach(card => {
        const mini = card.querySelector(".gr-mini"); if (!mini || mini.querySelector(".gt-spark")) return;
        const d = dataFor(courseOf(card.dataset.id)); if (!d || d.pts.length < 2) return;
        mini.insertAdjacentHTML("beforeend", sparkHtml(d));
      });
    } catch (e) { console.warn("grade trend", e); }
  });

  window.SBTREND = {GTREND, dataFor, sumText};
})();

