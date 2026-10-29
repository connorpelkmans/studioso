/* ===== module: 90-grades.js ===== */
/* Studyboard 1.11.0 */
(() => {
  /* Settings and helpers */
  // Standard scales. The default follows the region (and the spelling setting); a student can pick another.
  const SCALES = {
    us: {name: "US 10-Point", scale: [["A+", 97], ["A", 93], ["A-", 90], ["B+", 87], ["B", 83], ["B-", 80], ["C+", 77], ["C", 73], ["C-", 70], ["D+", 67], ["D", 63], ["D-", 60], ["F", 0]]},
    ca: {name: "Canada (Percent)", scale: [["A+", 90], ["A", 85], ["A-", 80], ["B+", 76], ["B", 72], ["B-", 68], ["C+", 64], ["C", 60], ["C-", 55], ["D", 50], ["F", 0]]},
    uk: {name: "UK Degree Classes", scale: [["1ST", 70], ["2:1", 60], ["2:2", 50], ["3RD", 40], ["F", 0]]}
  };
  function scaleRegion(){
    let L = "", tz = "";
    try { L = String((navigator.languages && navigator.languages[0]) || navigator.language || "").replace("_", "-"); tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch (e) {}
    const r = (L.split("-")[1] || "").toUpperCase(), sp = SPELL.mode;
    if (sp === "ca" || r === "CA") return "ca";
    if (r === "GB" || r === "IE" || (sp === "gb" && /^Europe\/(London|Dublin|Belfast)/.test(tz))) return "uk";
    return sp === "gb" ? "ca" : "us";
  }
  const G_SCALE = SCALES[scaleRegion()].scale;
  // The lowest passing letter on a scale
  const passOf = sc => { const p = sc.map(x => Number(x[1])).filter(v => v > 0); return p.length ? Math.min(...p) : 50; };
  const gset = () => { const g = Object.assign({prompt: true, rescue: true, scale: null, cls: false}, (state.settings && state.settings.grades) || {}); if (!isNum(g.pass)) g.pass = passOf(okScale(g.scale) ? g.scale : G_SCALE); return g; };
  const saveG = patch => { state.settings = Object.assign({}, state.settings, {grades: Object.assign({}, (state.settings && state.settings.grades) || {}, patch)}); saveSettings(); };
  const okScale = s => Array.isArray(s) && s.length >= 2 && s.every(x => Array.isArray(x) && x[0] && isNum(x[1]));
  const clampP = v => Math.max(0, Math.min(100, Number(v)));
  function gradingOf(c){
    const g = (c && c.grading) || {}, s = gset();
    return {goal: isNum(g.goal) && Number(g.goal) > 0 ? clampP(g.goal) : null, pass: isNum(g.pass) ? clampP(g.pass) : clampP(s.pass),
      scale: (okScale(g.scale) ? g.scale : okScale(s.scale) ? s.scale : G_SCALE).slice().sort((a, b) => b[1] - a[1]), ownScale: okScale(g.scale)};
  }
  const letterOf = (p, scale) => { if (p == null) return ""; const e = scale.find(x => p >= Number(x[1]) - 1e-9); return e ? e[0] : ""; };
  const r1 = v => Math.round(v * 10) / 10;
  const fmtP = v => r1(v) + "%";
  const fmtW = v => r1(v) + "%";
  const courseName = c => c ? courseLabel(c) : "this course";

  // "43/50", "43 out of 50", "86%" or "86"
  function parseMark(s){
    s = String(s == null ? "" : s).trim().replace(/,/g, ".");
    if (!s) return null;
    let m = s.match(/^(\d+(?:\.\d+)?)\s*(?:\/|out of|of)\s*(\d+(?:\.\d+)?)$/i);
    if (m) { const got = Number(m[1]), outOf = Number(m[2]); return outOf > 0 && got <= outOf * 1.5 ? {got, outOf} : undefined; }
    m = s.match(/^(\d+(?:\.\d+)?)\s*%?$/);
    if (m) { const v = Number(m[1]); return v <= 150 ? {got: v, outOf: 100} : undefined; }
    return undefined;
  }
  const markPct = t => t && t.mark && Number(t.mark.outOf) > 0 && isNum(t.mark.got) ? Number(t.mark.got) / Number(t.mark.outOf) * 100 : null;
  const fmtMark = m => !m ? "" : Number(m.outOf) === 100 ? r1(m.got) + "%" : `${r1(m.got)}/${r1(m.outOf)}`;
  const markInput = m => !m ? "" : Number(m.outOf) === 100 ? String(r1(m.got)) + "%" : `${m.got}/${m.outOf}`;

  /*GRULES-START*/
  // Grading rules (drop the lowest, bonus points) and GPA. Uses no app state, so tests can load it alone.
  const GRULES = (() => {
    const num = v => v != null && v !== "" && isFinite(Number(v));
    const CATS = ["Assignment", "Exam", "Quiz", "Reading", "Project", "Lab", "Other"];
    // {drops: [{cat, n, src}], bonus: {pts, got, src}}, leaving out anything unreadable
    function norm(r){
      r = r && typeof r === "object" ? r : {};
      const seen = new Set();
      const drops = (Array.isArray(r.drops) ? r.drops : []).map(d => ({cat: String((d && d.cat) || ""), n: Math.floor(Number(d && d.n)), src: d && d.src === "syllabus" ? "syllabus" : "user"}))
        .filter(d => CATS.includes(d.cat) && d.n >= 1 && d.n <= 20 && !seen.has(d.cat) && seen.add(d.cat));
      const b = r.bonus && typeof r.bonus === "object" ? r.bonus : {};
      const got = num(b.got) ? Math.max(0, Math.min(50, Number(b.got))) : 0, pts = Math.max(got, num(b.pts) ? Math.max(0, Math.min(50, Number(b.pts))) : 0);
      return {drops, bonus: {pts, got, src: b.src === "syllabus" ? "syllabus" : "user"}};
    }
    // items: [{id, w, cat, fin, pct (null when unmarked)}]. A rule applies when its type has more items than it drops.
    // A drop rule on exams never drops the final exam.
    const groups = (items, R) => R.drops.map(d => ({d, its: items.filter(it => it.cat === d.cat && !(d.cat === "Exam" && it.fin))})).filter(x => x.its.length > x.d.n);
    const active = (items, R) => groups(items, R).length > 0 || R.bonus.pts > 0;
    // The final grade (percent) when every unmarked item scores `fill`. A type's weight is shared by the items it keeps.
    function finalWith(items, R, D, fill){
      const sc = it => it.pct != null ? it.pct : fill, inG = new Set();
      let tot = 0;
      groups(items, R).forEach(x => {
        x.its.forEach(it => inG.add(it.id));
        const kept = x.its.slice().sort((a, b) => sc(a) - sc(b)).slice(x.d.n);
        const W = x.its.reduce((s, it) => s + it.w, 0), Wk = kept.reduce((s, it) => s + it.w, 0);
        if (Wk > 0) tot += kept.reduce((s, it) => s + it.w * sc(it), 0) / Wk * W / 100;
      });
      items.forEach(it => { if (!inG.has(it.id)) tot += it.w * sc(it) / 100; });
      return tot / D * 100 + R.bonus.got;
    }
    // The grade on marked work. In each rule's type the lowest marks drop, always keeping at least one.
    function current(items, R){
      const out = new Set(), f = {};
      groups(items, R).forEach(x => {
        const m = x.its.filter(it => it.pct != null).sort((a, b) => a.pct - b.pct);
        m.slice(0, Math.max(0, Math.min(x.d.n, m.length - 1))).forEach(it => out.add(it.id));
        x.its.forEach(it => { f[it.id] = x.its.length / (x.its.length - x.d.n); });
      });
      let w = 0, e = 0;
      items.forEach(it => { if (it.pct == null || out.has(it.id)) return; const ew = it.w * (f[it.id] || 1); w += ew; e += ew * it.pct; });
      return {pct: w > 0 ? e / w : null, out};
    }
    // The average needed on everything unmarked to finish on `target`: 0 when it's already secured, over 100 when out of reach
    function need(items, R, D, target){
      if (!items.some(it => it.pct == null && it.w > 0)) return null;
      const lo = finalWith(items, R, D, 0), hi = finalWith(items, R, D, 100);
      if (lo >= target - 1e-9) return 0;
      if (hi < target - 1e-9) return 100 + (target - hi) / Math.max(1e-6, (hi - lo) / 100);
      let a = 0, b = 100;
      for (let i = 0; i < 40; i++) { const m = (a + b) / 2; if (finalWith(items, R, D, m) >= target - 1e-9) b = m; else a = m; }
      return b;
    }
    // GPA points for a letter (A 4, A- 3.7, B+ 3.3 and so on; A+ is 4.3 on a 4.3 scale). null for letters that aren't A to F.
    function points(letter, max){
      const m = /^([A-F])([+-]?)$/.exec(String(letter || "").toUpperCase().trim()); if (!m) return null;
      const base = {A: 4, B: 3, C: 2, D: 1, E: 0, F: 0}[m[1]];
      if (!base) return 0;
      if (m[2] === "+") return m[1] === "A" ? (Number(max) >= 4.3 ? 4.3 : 4) : Math.round((base + 0.3) * 10) / 10;
      if (m[2] === "-") return Math.round((base - 0.3) * 10) / 10;
      return base;
    }
    // Credits used for a row with none set: the middle of the credits that are set, or 1
    function typical(crs){
      const v = crs.filter(x => num(x) && Number(x) > 0).map(Number).sort((a, b) => a - b), k = v.length;
      return !k ? 1 : k % 2 ? v[(k - 1) / 2] : (v[k / 2 - 1] + v[k / 2]) / 2;
    }
    // rows: [{v, cr}] -> the credit-weighted average of v. 0 credits leaves a row out; no credits counts as `def`.
    function avg(rows, def){
      let w = 0, s = 0;
      rows.forEach(r => { if (!num(r.v)) return; const cw = num(r.cr) ? Number(r.cr) : def == null ? 1 : def; if (!(cw > 0)) return; w += cw; s += cw * Number(r.v); });
      return w > 0 ? s / w : null;
    }
    return {norm, active, finalWith, current, need, points, typical, avg, CATS};
  })();
  /*GRULES-END*/

  /* Grade math */
  const rulesOf = c => GRULES.norm(c && c.grading && c.grading.rules);
  // pretend: {taskId: percent} for unmarked items (What If)
  function courseGrade(c, asOf, pretend){
    const g = gradingOf(c), R = rulesOf(c);
    const ts = allTasks().filter(t => t.courseId === c.id && hasWeight(t) && !t.prepFor);
    const pctOf = t => { const p = markPct(t); if (p == null && pretend && isNum(pretend[t.id])) return Number(pretend[t.id]); return p != null && (!(asOf instanceof Set) || asOf.has(t.id)) ? p : null; };
    const pm = new Map(ts.map(t => [t.id, pctOf(t)]));
    const marked = ts.filter(t => pm.get(t.id) != null), open = ts.filter(t => pm.get(t.id) == null);
    const wMarked = marked.reduce((s, t) => s + Number(t.weight), 0);
    const earned = marked.reduce((s, t) => s + Number(t.weight) * pm.get(t.id) / 100, 0);
    const wAll = ts.reduce((s, t) => s + Number(t.weight), 0);
    const D = Math.max(100, wAll);
    const remaining = Math.max(0, D - wMarked), unlisted = Math.max(0, 100 - wAll);
    const items = ts.map(t => ({id: t.id, w: Number(t.weight), cat: t.type, fin: /\bfinal\b/i.test(t.title || ""), pct: pm.get(t.id)}));
    if (unlisted > 0.001) items.push({id: "", w: unlisted, cat: "", fin: false, pct: null});
    const ruled = GRULES.active(items, R);
    let current, minFinal, maxFinal, need, dropped = new Set();
    if (!ruled) {
      current = wMarked > 0 ? earned / wMarked * 100 : null;
      minFinal = earned / D * 100; maxFinal = (earned + remaining) / D * 100;
      need = target => remaining > 0.01 ? (target * D / 100 - earned) / remaining * 100 : null;
    } else {
      const cu = GRULES.current(items, R); current = cu.pct; dropped = cu.out;
      minFinal = GRULES.finalWith(items, R, D, 0); maxFinal = GRULES.finalWith(items, R, D, 100) + R.bonus.pts - R.bonus.got;
      need = target => remaining > 0.01 ? GRULES.need(items, R, D, target) : null;
    }
    const remShown = remaining / D * 100;
    const projected = current == null ? null : remaining > 0.01 ? (ruled ? GRULES.finalWith(items, R, D, current) : current) : minFinal;
    const loose = allTasks().filter(t => t.courseId === c.id && !hasWeight(t) && !t.prepFor && markPct(t) != null);
    const gr = {c, g, R, ruled, dropped, ts, loose, marked, open, wMarked: wMarked / D * 100, earned, wAll, D, remaining: remShown, unlisted, current, minFinal, maxFinal, projected, need, done: remaining <= 0.01};
    gr.risk = riskOf(gr);
    return gr;
  }
  // "Lowest 2 quizzes dropped, up to 3% bonus (1% earned)"
  const CAT_PL = {Assignment: ["assignment", "assignments"], Exam: ["midterm or test", "midterms or tests"], Quiz: ["quiz", "quizzes"], Reading: ["reading", "readings"], Project: ["project", "projects"], Lab: ["lab", "labs"], Other: ["other item", "other items"]};
  function rulesText(R){
    const out = R.drops.map(d => `lowest ${d.n === 1 ? CAT_PL[d.cat][0] : d.n + " " + CAT_PL[d.cat][1]} dropped`);
    if (R.bonus.pts > 0) out.push(R.bonus.got > 0 ? (R.bonus.got >= R.bonus.pts ? `${fmtW(R.bonus.got)} bonus earned` : `up to ${fmtW(R.bonus.pts)} bonus (${fmtW(R.bonus.got)} earned)`) : `up to ${fmtW(R.bonus.pts)} bonus`);
    const s = out.join(", ");
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : "";
  }
  function riskOf(gr){
    if (!gr.marked.length || gr.done) return null;
    const np = gr.need(gr.g.pass);
    if (np == null || np <= 0) return null;
    if (np > 100) return "out";
    if (np >= 80 || gr.current < gr.g.pass) return "risk";
    if (np >= 70 || gr.current < gr.g.pass + 5) return "watch";
    return null;
  }
  const grades = () => coursesArr().map(courseGrade);
  // The letter a course has now, its lowest percent, and what the rest needs to keep it
  function holdOf(gr){
    if (gr.current == null) return null;
    const l = letterOf(gr.current, gr.g.scale), th = l ? Number((gr.g.scale.find(x => x[0] === l) || [])[1]) : NaN;
    if (!l || !isNum(th) || th <= 0) return null;
    return {l, th, n: gr.done ? null : gr.need(th)};
  }
  const inDanger = gr => gr.risk === "risk" || gr.risk === "watch" || gr.risk === "out";
  // Every mark in a course at 0%: almost always marks that weren't entered (or a school site sending ungraded work as 0), not real zeros
  const zeroed = gr => !!gr && gr.marked.length > 0 && gr.marked.every(t => markPct(t) === 0);
  const ZERO_TXT = "Every mark here is 0%. That usually means the marks aren't in yet or came over from your school site as 0, so check them.";
  // A course falling short of its goal: under it now, or needing better than its average so far on the rest (still reachable)
  function goalShort(gr){
    const goal = gr.g.goal;
    if (goal == null || gr.current == null || gr.done || inDanger(gr)) return null;
    const ng = gr.need(goal);
    if (ng == null || ng <= 0 || ng > 100) return null;
    const under = goal - gr.current, gap = Math.max(under, ng - gr.current);
    return gap > 0.5 ? {ng, under, gap} : null;
  }

  /* Mark entry: quick sheet */
  function markSheet(id, back){
    const t = state.tasks[id]; if (!t) return;
    const c = courseOf(t.courseId), g = gradingOf(c);
    openSheet(`<form class="sheet">${head(t.mark ? "Edit Your Mark" : "Add Your Mark")}
      <div class="sheet-body">
        <p style="margin:0"><b>${esc(t.title)}</b>${c ? ` <span class="tag">${esc(courseLabel(c))}</span>` : ""}<br><span class="mini">${hasWeight(t) ? `Worth ${fmtW(Number(t.weight))} of your course grade.` : "This task has no grade weight yet, so the mark is saved but won't count toward the course grade."}</span></p>
        <label class="f"><span class="lh">Your Mark <span class="hint">a score like 43/50, or a percent like 86%</span></span><input type="text" id="gmIn" inputmode="decimal" autocomplete="off" maxlength="24" value="${esc(markInput(t.mark))}" placeholder="e.g. 43/50" autofocus></label>
        <p class="gr-preview" id="gmOut" aria-live="polite"></p>
      </div>
      <div class="sheet-foot">${t.mark ? `<button type="button" class="btn danger" id="gmDel">Remove Mark</button>` : ""}<span class="spacer"></span><button type="button" class="btn" data-act="close">Cancel</button><button type="button" class="btn primary" data-submit>Save Mark</button></div></form>`, () => {
      const v = parseMark($("#gmIn").value);
      if (v === undefined) { toast("Enter the mark like 43/50 or 86%"); $("#gmIn").focus(); return false; }
      save(v); return false;
    });
    const save = v => {
      const cur = state.tasks[id]; if (!cur) return;
      const n = clone(cur); n.mark = v;
      dlg.close();
      applyChanges([{kind: "task", id, after: n}], v ? `Mark saved: ${fmtMark(v)}` : "Mark removed");
      // After an exam or quiz's first mark: a one-minute reflection (the exam wrapper), then back to where you were
      if (v && !cur.mark && window.SBWRAP && SBWRAP.should(id)) setTimeout(() => SBWRAP.open(id, back), 60);
      else if (back) setTimeout(back, 40);
    };
    const out = () => { const v = parseMark($("#gmIn").value); $("#gmOut").innerHTML = markPreview(v, t, g); };
    $("#gmIn").addEventListener("input", out); out();
    const del = $("#gmDel"); if (del) del.addEventListener("click", () => save(null));
  }
  /* Paste grades from the school's Grades page */
  function parseBsGrades(text){
    const lines = String(text || "").split(/\r?\n/).map(l => l.replace(/\u00a0/g, " ").trim());
    const PT = /(\d+(?:[.,]\d+)?)\s*\/\s*(\d+(?:[.,]\d+)?)/g, n = x => Number(String(x).replace(",", "."));
    const skip = /^(grade item|points|weight achieved|grade|comments and assessments|overall feedback|grades|print|add to eportfolio|category|total|final (calculated|adjusted) grade)\b/i;
    const out = []; let prev = "";
    lines.forEach(l => {
      if (!l) return;
      const ms = [...l.matchAll(PT)];
      if (ms.length && l.length <= 160) {
        const name = (l.slice(0, ms[0].index).split(/\t| {2,}/)[0].trim() || prev).replace(/\s+/g, " ");
        const got = n(ms[0][1]), outOf = n(ms[0][2]);
        if (name && !skip.test(name) && outOf > 0 && got <= outOf * 1.5) { const w = ms[1] ? n(ms[1][2]) : 0; out.push({name: name.slice(0, 120), got, outOf, weight: w > 0 && w <= 100 ? w : 0}); prev = ""; }
        return;
      }
      if (!skip.test(l) && !/^[\d.,]+\s*%$/.test(l) && l.length <= 120) prev = l;
    });
    const seen = new Set(); return out.filter(x => { const k = x.name.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; });
  }
  // Pasted grades are checked in a preview first: weights are only kept where the page shows them
  function pasteGradesSheet(cid){
    const c = courseOf(cid); if (!c) return;
    const on = schoolHosts(), site = on.length === 1 ? ({brightspace: "Brightspace", canvas: "Canvas", blackboard: "Blackboard"})[on[0].id] : "";
    const key = x => String(x).toLowerCase().replace(/[^a-z0-9]/g, "");
    const mine = () => allTasks().filter(t => t.courseId === cid && !t.archivedTerm && !t.prepFor && !t.breakdownOf);
    let items = [];
    const edits = {};
    openSheet(`<form class="sheet pg-sheet">${head("Paste Grades")}
      <div class="sheet-body">
        <p style="margin:0">Open the <b>Grades</b> page for <b>${esc(c.name)}</b> ${site ? `in ${esc(site)}` : "on your school's site"}, select everything on the page (Ctrl+A, or Cmd+A on a Mac), copy it, and paste it here. You'll check everything before it's added.</p>
        <label class="f"><span class="lh">Grades Page</span><textarea id="pgIn" rows="6" data-noenter placeholder="Grade Item  Points  Weight Achieved  Grade&#10;Reflective Assignment  1 / 1  100 %" style="width:100%"></textarea></label>
        <div id="pgOut" aria-live="polite"></div>
      </div>
      <div class="sheet-foot"><span class="spacer"></span><button type="button" class="btn" data-act="close">Cancel</button><button type="button" class="btn primary" data-submit id="pgGo" disabled>Add Grades</button></div></form>`, () => {
      const rows = items.filter((it, i) => { const x = dlg.querySelector(`[data-pg-on="${i}"]`); return x && x.checked; });
      if (!rows.length) { toast("Pick at least one grade to add"); return false; }
      const have = mine(), changes = [];
      items.forEach((it, i) => {
        const x = dlg.querySelector(`[data-pg-on="${i}"]`); if (!x || !x.checked) return;
        const w = weightOf(i), mark = {got: it.got, outOf: it.outOf, src: "paste"};
        const t = have.find(y => key(y.title) === key(it.name));
        if (t) { const nt = clone(t); nt.mark = mark; if (w > 0) nt.weight = w; if (nt.status !== "done") { nt.status = "done"; nt.doneAt = Date.now(); nt.pct = 100; } changes.push({kind: "task", id: nt.id, after: nt}); }
        else { const nt = newTask(Object.assign({title: it.name, courseId: cid, type: guessTaskType(it.name) === "Exam" ? "Exam" : "Assignment", due: "", status: "done", pct: 100, mark}, w > 0 ? {weight: w} : {})); changes.push({kind: "task", id: nt.id, after: nt}); }
      });
      dlg.close();
      applyChanges(changes, `Added ${rows.length} ${rows.length === 1 ? "grade" : "grades"}`);
      return false;
    });
    const weightOf = i => { const v = edits[i] != null ? edits[i] : items[i] && items[i].weight ? String(items[i].weight) : ""; const n = Number(String(v).replace(",", ".")); return v !== "" && isNum(n) && n > 0 && n <= 100 ? n : 0; };
    // The course's weights once these are in: pasted ones replace the matching task's
    const total = () => {
      const have = mine(), hit = new Set();
      let sum = 0;
      items.forEach((it, i) => { const x = dlg.querySelector(`[data-pg-on="${i}"]`); if (!x || !x.checked) return; const t = have.find(y => key(y.title) === key(it.name)), w = weightOf(i);
        if (t) hit.add(t.id); sum += w > 0 ? w : t && hasWeight(t) ? Number(t.weight) : 0; });
      have.forEach(t => { if (!hit.has(t.id) && hasWeight(t)) sum += Number(t.weight); });
      return sum;
    };
    const sumLine = () => {
      const s0 = r1(total()), el = $("#pgSum"); if (!el) return;
      el.className = "mini pg-sum" + (s0 > 100.5 ? " pg-over" : "");
      el.textContent = s0 > 100.5 ? `Weights in this course would add up to ${s0}%, more than 100%. Check them against your course outline.` : `Weights in this course would add up to ${s0}%.${items.some((it, i) => !weightOf(i)) ? " Grades without a weight are saved but don't count toward your course grade until you add one." : ""}`;
      const n = items.filter((it, i) => { const x = dlg.querySelector(`[data-pg-on="${i}"]`); return x && x.checked; }).length, go = $("#pgGo");
      if (go) { go.disabled = !n; go.textContent = n ? `Add ${n} ${n === 1 ? "Grade" : "Grades"}` : "Add Grades"; }
    };
    const preview = () => {
      const out = $("#pgOut"), txt = $("#pgIn").value;
      items = parseBsGrades(txt);
      Object.keys(edits).forEach(k => { if (Number(k) >= items.length) delete edits[k]; });
      const have = mine();
      if (!txt.trim()) { out.innerHTML = ""; sumLine(); return; }
      if (!items.length) { out.innerHTML = `<p class="mini" style="margin:0">No grades found yet. Each one should look like "Assignment name  8 / 10".</p>`; sumLine(); return; }
      out.innerHTML = `<p class="mini" style="margin:0 0 6px"><b>${items.length} found.</b> Untick any you don't want, and fill in a weight if you know it.</p>
        <ul class="pg-list">${items.map((it, i) => { const t = have.find(y => key(y.title) === key(it.name)), wv = edits[i] != null ? edits[i] : it.weight ? String(it.weight) : "";
          return `<li><label class="pg-on"><input type="checkbox" data-pg-on="${i}" checked aria-label="Add ${esc(it.name)}"></label><span class="pg-t"><b>${esc(it.name)}</b><span class="mini">${esc(r1(it.got) + " / " + r1(it.outOf))} · ${t ? "updates your task" : "new"}</span></span>
            <label class="pg-w"><span class="sr">Weight for ${esc(it.name)}</span><input type="text" inputmode="decimal" data-pg-w="${i}" value="${esc(wv)}" placeholder="${t && hasWeight(t) ? esc(r1(Number(t.weight))) : "Weight"}" maxlength="6" autocomplete="off" data-noenter><span aria-hidden="true">%</span></label></li>`; }).join("")}</ul>
        <p class="mini pg-sum" id="pgSum" role="status"></p>`;
      sumLine();
    };
    $("#pgIn").addEventListener("input", preview);
    $("#pgOut").addEventListener("input", e => { const w = e.target.dataset && e.target.dataset.pgW; if (w != null) { edits[w] = e.target.value.trim(); sumLine(); } });
    $("#pgOut").addEventListener("change", e => { if (e.target.dataset && e.target.dataset.pgOn != null) sumLine(); });
  }
  function markPreview(v, t, g){
    if (v === null) return "";
    if (v === undefined) return `<span class="late">Type it like 43/50 or 86%.</span>`;
    const p = v.got / v.outOf * 100, L = letterOf(p, g.scale);
    return `<b>${fmtP(p)}</b>${L ? ` (${esc(L)})` : ""}${hasWeight(t) ? `, which adds ${r1(Number(t.weight) * p / 100)} of the ${r1(Number(t.weight))} points this is worth` : ""}.`;
  }

  /* Task form: a compact Mark field */
  const origTaskForm = taskForm;
  taskForm = function(t, preset){
    const r = origTaskForm.apply(this, arguments);
    try { addMarkField(t); } catch(e) { console.warn("grades: mark field", e); }
    return r;
  };
  function addMarkField(t){
    const form = dlg.querySelector("form"), st = $("#statusSeg");
    if (!form || !st || $("#gMarkWrap")) return;
    const fs = st.closest("fieldset");
    const wrap = document.createElement("label");
    wrap.className = "f gr-mark-f"; wrap.id = "gMarkWrap"; wrap.dataset.tid = t ? t.id : "";
    wrap.innerHTML = `<span class="lh">Mark <span class="hint">a score like 43/50, or 86%. Leave blank until you get it back.</span></span><span class="gr-mark-row"><input type="text" id="gMarkIn" inputmode="decimal" autocomplete="off" maxlength="24" value="${esc(markInput(t && t.mark))}" placeholder="e.g. 43/50"><span class="gr-mark-out" id="gMarkOut" aria-live="polite"></span></span>`;
    fs.after(wrap);
    const sync = () => {
      const f = new FormData(form), w = Number(f.get("weight") || 0), done = f.get("status") === "done";
      const val = $("#gMarkIn").value.trim();
      wrap.hidden = !(w > 0 || done || val);
      const c = courseOf(f.get("courseId")), g = gradingOf(c), v = parseMark(val);
      $("#gMarkOut").innerHTML = v === null ? "" : v === undefined ? `<span class="late">Use 43/50 or 86%</span>` : (p => `${fmtP(p)}${letterOf(p, g.scale) ? " " + esc(letterOf(p, g.scale)) : ""}`)(v.got / v.outOf * 100);
    };
    form.addEventListener("input", sync); form.addEventListener("change", sync); sync();
  }
  // Save the mark in the same change as the task, so one Undo covers both
  let pendingMark = null;
  const stageMark = e => {
    const wrap = $("#gMarkWrap"), inp = $("#gMarkIn");
    if (!wrap || !inp || !dlg.open) return;
    const v = parseMark(inp.value);
    if (!wrap.hidden && v === undefined) { e.preventDefault(); e.stopPropagation(); toast("Enter the mark like 43/50 or 86%, or leave it blank"); inp.focus(); return; }
    pendingMark = {id: wrap.dataset.tid, mark: wrap.hidden ? undefined : v};
    setTimeout(() => { pendingMark = null; }, 0);
  };
  dlg.addEventListener("click", e => { if (e.target.closest && e.target.closest("[data-submit]") && $("#gMarkWrap")) stageMark(e); }, true);
  dlg.addEventListener("keydown", e => {
    const x = e.target;
    if (e.key === "Enter" && x.tagName === "INPUT" && !x.hasAttribute("data-noenter") && !["checkbox", "radio", "button"].includes(x.type) && $("#gMarkWrap")) stageMark(e);
  }, true);
  const origApply = applyChanges;
  applyChanges = function(changes, label, extra){
    if (pendingMark && pendingMark.mark !== undefined && Array.isArray(changes)) {
      const pm = pendingMark; pendingMark = null;
      const ch = changes.find(c => c.kind === "task" && c.after && (pm.id ? c.id === pm.id : !state.tasks[c.id]));
      if (ch) ch.after = Object.assign({}, ch.after, {mark: pm.mark});
    }
    return origApply.apply(this, arguments);
  };
  // The task's History shows mark changes too
  const origHist = historyDiff;
  historyDiff = function(a, b){
    const out = origHist.apply(this, arguments);
    try { const x = fmtMark(a && a.mark), y = fmtMark(b && b.mark); if (a && b && x !== y) out.push(`Mark: ${x || "none"} → ${y || "none"}`); } catch(e) {}
    return out;
  };

  /* Gentle "Add Your Mark?" prompt after finishing weighted work */
  const ASKED = "studyboard:gradeAsked";
  const asked = () => { try { return JSON.parse(localStorage.getItem(ASKED) || "[]") || []; } catch(e) { return []; } };
  const setAsked = id => { try { localStorage.setItem(ASKED, JSON.stringify(asked().concat(id).slice(-200))); } catch(e) {} };
  let promptT = null, hideT = null;
  hook("changed", changes => {
    if (!gset().prompt || !Array.isArray(changes) || changes.length !== 1) return;
    const ch = changes[0], t = ch.after;
    if (ch.kind !== "task" || !t || t.status !== "done" || !t.doneAt || Date.now() - t.doneAt > 10000) return;
    if (!hasWeight(t) || t.mark || t.prepFor || asked().includes(t.id)) return;
    setAsked(t.id);
    clearTimeout(promptT);
    promptT = setTimeout(() => showPrompt(t.id), 6800);
  });
  function showPrompt(id){
    const t = state.tasks[id], el = $("#grPrompt");
    if (!t || t.status !== "done" || t.mark || !el || dlg.open) return;
    const c = courseOf(t.courseId);
    el.innerHTML = `<span class="gp-t"><b>Got a Mark Back?</b> Add it for ${esc(t.title)} to see where you stand${c ? ` in ${esc(courseLabel(c))}` : ""}. You can also add it later.</span>
      <span class="gp-a"><button class="btn small primary" data-act="gp-add" data-id="${esc(id)}">Add Mark</button><button class="btn small" data-act="gp-close">Not Now</button><button class="link-btn gp-off" data-act="gp-off">Don't Ask Again</button></span>`;
    el.hidden = false; requestAnimationFrame(() => el.classList.add("show"));
    clearTimeout(hideT); hideT = setTimeout(hidePrompt, 16000);
  }
  function hidePrompt(){ const el = $("#grPrompt"); if (!el) return; el.classList.remove("show"); setTimeout(() => { if (!el.classList.contains("show")) el.hidden = true; }, 250); }

  /* Course page: grade card */
  function needLines(gr){
    const g = gr.g, out = [], nm = esc(courseName(gr.c)), L = p => letterOf(p, g.scale);
    const remTxt = `the remaining ${fmtW(gr.remaining)}`;
    if (!gr.ts.length) return out;
    if (gr.done) {
      out.push(`All graded work is marked. Your final grade is <b>${fmtP(gr.minFinal)}</b>${L(gr.minFinal) ? ` (${esc(L(gr.minFinal))})` : ""}.`);
      if (gr.minFinal >= g.pass) out.push(`You passed, with ${fmtP(g.pass)} needed. Well done.`);
      else out.push(`<span class="gr-kind">That's below the ${fmtP(g.pass)} pass mark. It's worth talking to your instructor soon. They can explain your options, and you don't have to figure it out alone.</span>`);
      return out;
    }
    if (g.goal != null) {
      const n = gr.need(g.goal);
      if (n <= 0) out.push(`You've already locked in your goal of <b>${fmtP(g.goal)}</b>. Nice work.`);
      else if (n <= 100) out.push(`You need an average of <b>${fmtP(n)}</b> on ${remTxt} to reach your goal of ${fmtP(g.goal)}.`);
      else out.push(`<span class="gr-kind">Your goal of ${fmtP(g.goal)} is out of reach now, even with full marks on everything left. The highest you can still get is <b>${fmtP(gr.maxFinal)}</b>${L(gr.maxFinal) ? ` (${esc(L(gr.maxFinal))})` : ""}. Every mark from here still counts, and a new goal can keep you going.</span>`);
    }
    const np = gr.need(g.pass), hold = holdOf(gr);
    if (g.goal == null && hold && !inDanger(gr) && hold.th > g.pass) out.push(hold.n <= 0 ? `You've locked in at least ${esc(hold.l)} (${fmtP(hold.th)}). Nice work.` : hold.n <= 100 ? `To keep your ${esc(hold.l)} (${fmtP(hold.th)}), you need an average of <b>${fmtP(hold.n)}</b> on ${remTxt}.` : "");
    if (np <= 0) out.push(`You've already secured the <b>${fmtP(g.pass)}</b> pass mark, whatever happens next.`);
    else if (np > 100) out.push(`<span class="gr-kind">Even full marks on the rest would leave ${nm} below the ${fmtP(g.pass)} pass mark. Please talk to your instructor soon. They can explain your options, like extra support or what happens next. Lots of students go through this, and asking early helps.</span>`);
    else if ((inDanger(gr) || !hold || hold.th <= g.pass || !(hold.n <= 100))) out.push(`To pass (${fmtP(g.pass)}), you need an average of <b>${fmtP(np)}</b> on ${remTxt}.${gr.risk === "risk" || gr.risk === "watch" ? " Today's Plan is moving this course's graded work up a little." : ""}`);
    for (let k = out.length - 1; k >= 0; k--) if (!out[k]) out.splice(k, 1);
    if (gr.unlisted > 0.5) out.push(`<span class="mini">Your graded tasks add up to ${fmtW(gr.wAll)} of the course. The other ${fmtW(gr.unlisted)} counts as work still to come until you add it.</span>`);
    return out;
  }
  const riskPill = r => r === "risk" ? `<span class="pill gr-risk">Pass Mark at Risk</span>` : r === "out" ? `<span class="pill gr-risk">Talk to Your Instructor</span>` : r === "watch" ? `<span class="pill gr-watch">Close to Pass Mark</span>` : "";
  // Distance from where the course stands now to the goal
  function goalGap(gr){
    const goal = gr.g.goal; if (goal == null || gr.current == null) return null;
    const gap = r1(gr.current - goal);
    return {gap, text: gr.done ? (gr.minFinal >= goal ? "Goal reached" : `${r1(goal - gr.minFinal)} pts under goal`) : gap >= 0 ? `${r1(gap)} pts above goal` : `${r1(-gap)} pts to goal`};
  }
  // The unmarked graded item with the most weight
  function biggestSwing(gr){
    const open = (gr.open || []).filter(t => Number(t.weight) > 0);
    if (gr.done || open.length < 2) return null;
    const t = open.slice().sort((a, b) => Number(b.weight) - Number(a.weight) || String(a.due || "9999").localeCompare(String(b.due || "9999")))[0];
    const share = Number(t.weight) / gr.D * 100;
    return {t, share, per10: share / 10};
  }
  /* Where the grade comes from */
  const TYPE_PL = {Assignment: () => tr("gb.t.assignment", "Assignments"), Exam: () => tr("gb.t.exam", "Exams"), Quiz: () => tr("gb.t.quiz", "Quizzes"), Reading: () => tr("gb.t.reading", "Readings"),
    Project: () => tr("gb.t.project", "Projects"), Lab: () => tr("gb.t.lab", "Labs"), Study: () => tr("gb.t.study", "Study"), Other: () => tr("gb.t.other", "Other")};
  const typePl = ty => TYPE_PL[ty] ? TYPE_PL[ty]() : String(ty || "");
  // The marked work of each type, weighted, highest first. left: how much of the course is still to come in that type
  function byType(gr){
    const m = {}, key = t => t.type || "Other";
    gr.marked.forEach(t => { const w = Number(t.weight), o = m[key(t)] || (m[key(t)] = {type: key(t), w: 0, e: 0, n: 0, left: 0}); o.w += w; o.e += w * markPct(t); o.n++; });
    gr.open.forEach(t => { const o = m[key(t)]; if (o) o.left += Number(t.weight); });
    return Object.values(m).filter(o => o.w > 0).map(o => Object.assign(o, {pct: o.e / o.w, share: o.w / gr.D * 100, left: o.left / gr.D * 100})).sort((a, b) => b.pct - a.pct);
  }
  // How much each mark lifts or lowers the current grade (the grade with it, minus the grade without it)
  function markImpact(gr){
    if (gr.current == null || gr.marked.length < 3) return null;
    const W = gr.marked.reduce((s, t) => s + Number(t.weight), 0), E = gr.marked.reduce((s, t) => s + Number(t.weight) * markPct(t), 0);
    const all = gr.marked.map(t => { const w = Number(t.weight); return W - w > 0 ? {t, d: gr.current - (E - w * markPct(t)) / (W - w)} : null; }).filter(Boolean).sort((a, b) => b.d - a.d);
    const boost = all[0] && all[0].d >= 0.5 ? all[0] : null, drag = all.length && all[all.length - 1].d <= -0.5 ? all[all.length - 1] : null;
    return boost || drag ? {boost, drag} : null;
  }
  // A mark next to the class average, when the school site shares one (off unless turned on in Grade Options)
  function vsClass(t){
    const L = ["bs", "cv", "bb"].map(f => t && t[f]).find(Boolean), fb = L && L.fb, k = fb && fb.cls, p = markPct(t);
    if (!k || !isNum(k.mean) || !(Number(fb.of) > 0) || p == null) return null;
    const cls = Number(k.mean) / Number(fb.of) * 100;
    return isFinite(cls) ? {mine: p, cls, d: r1(p - cls)} : null;
  }
  const vsTxt = v => v.d === 0 ? tr("gb.vs.same", "Class average") : tr("gb.vs", "{n} vs class", {n: (v.d > 0 ? "+" : "−") + r1(Math.abs(v.d))});
  const vsPill = t => { if (!gset().cls) return ""; const v = vsClass(t); return v ? ` <span class="pill gr-vs${v.d > 0 ? " up" : v.d < 0 ? " down" : ""}" title="${esc(tr("gb.vs.tip", "You {mine}, class average {cls}", {mine: fmtP(v.mine), cls: fmtP(v.cls)}))}">${esc(vsTxt(v))}</span>` : ""; };
  function breakdownHtml(gr){
    const L = p => letterOf(p, gr.g.scale), types = byType(gr), lines = [];
    if (types.length >= 2) {
      const hi = types[0], lo = types[types.length - 1];
      if (hi.pct - lo.pct >= 5) {
        lines.push(esc(tr("gb.low", "Your lowest is {type}, at {pct}, {gap} points under {top}.", {type: typePl(lo.type), pct: fmtP(lo.pct), gap: r1(hi.pct - lo.pct), top: typePl(hi.type)}))
          + (lo.left > 0.5 ? " " + esc(tr("gb.lowLeft", "{type} still make up {left} of the course to come.", {type: typePl(lo.type), left: fmtW(lo.left)})) : ""));
      }
    }
    const im = markImpact(gr);
    const imTxt = (k, v) => `<b>${esc(k)}</b> ${esc(tr("gb.imp", "{title} ({d} pts)", {title: v.t.title, d: (v.d > 0 ? "+" : "−") + r1(Math.abs(v.d))}))}`;
    if (im && im.boost) lines.push(imTxt(tr("gb.boost", "Biggest boost:"), im.boost));
    if (im && im.drag) lines.push(imTxt(tr("gb.drag", "Biggest drag:"), im.drag));
    if (gset().cls) {
      const vs = gr.marked.map(vsClass).filter(Boolean);
      if (vs.length) {
        const above = vs.filter(v => v.d > 0).length, avg = vs.reduce((s, v) => s + v.d, 0) / vs.length;
        lines.push(esc(trn("gb.cls", vs.length, "Above the class average on {a} of {n} item with class results|Above the class average on {a} of {n} items with class results", {a: above}))
          + esc(Math.abs(avg) >= 0.05 ? tr("gb.clsAvg", ", {d} points {dir} on average.", {d: r1(Math.abs(avg)), dir: avg > 0 ? tr("gb.above", "above") : tr("gb.below", "below")}) : "."));
      }
    }
    if (types.length < 2 && !lines.length) return "";
    const rows = types.length >= 2 ? `<ul class="gb-types">${types.map(o => `<li><span class="gb-name"><b>${esc(typePl(o.type))}</b><span class="mini">${esc(trn("gb.n", o.n, "{n} marked|{n} marked"))}, ${esc(tr("gb.worth", "worth {w}", {w: fmtW(o.share)}))}</span></span>
        <span class="gb-bar" aria-hidden="true"><i style="width:${clampP(o.pct)}%"></i><i class="gb-pass" style="left:${clampP(gr.g.pass)}%"></i></span>
        <span class="gb-v"><b>${fmtP(o.pct)}</b>${L(o.pct) ? `<span class="mini">${esc(L(o.pct))}</span>` : ""}</span></li>`).join("")}</ul>` : "";
    return `<div class="gr-sub gb"><h4>${esc(tr("gb.title", "Where Your Grade Comes From"))}</h4>${rows}${lines.length ? `<ul class="gb-lines">${lines.map(x => `<li>${x}</li>`).join("")}</ul>` : ""}</div>`;
  }
  // Graded work due soon, per course, as a share of that course's grade
  function comingUp(all, days){
    const today = todayISO(), end = addDays(today, days - 1);
    return all.map(gr => {
      const its = gr.open.filter(t => t.status !== "done" && t.due && t.due >= today && t.due <= end && Number(t.weight) > 0).sort(sortTasks);
      return {gr, its, share: its.reduce((s, t) => s + Number(t.weight), 0) / gr.D * 100};
    }).filter(x => x.its.length).sort((a, b) => b.share - a.share);
  }
  function comingUpHtml(all){
    const list = comingUp(all, 14); if (!list.length) return "";
    return `<h3 class="fsec">${esc(tr("gb.soon", "Graded Work Coming Up"))}<span class="n">${esc(tr("gb.soon.when", "next 2 weeks"))}</span></h3><ul class="gs-wait gb-soon">${list.map(x => `<li style="--c:${esc(x.gr.c.color)}"><span class="gs-name"><span>${esc(tr("gb.soon.row", "{share} of {course} is due", {share: fmtW(x.share), course: courseLabel(x.gr.c)}))}</span>
      <span class="mini">${x.its.slice(0, 4).map(t => esc(tr("gb.soon.item", "{title} ({w}, {due})", {title: t.title, w: fmtW(Number(t.weight)), due: fmtShort(t.due)}))).join(" · ")}${x.its.length > 4 ? " · " + esc(tr("gb.more", "+{n} more", {n: x.its.length - 4})) : ""}</span></span>
      <button class="btn small" data-act="g-open-course" data-id="${esc(x.gr.c.id)}">${esc(tr("gb.open", "Open"))}</button></li>`).join("")}</ul>`;
  }
  // What a course would look like with pretend marks
  function whatIf(gr, vals){
    const p = {}; let n = 0;
    gr.open.forEach(t => { const v = vals && vals[t.id]; if (isNum(v)) { p[t.id] = Number(v); n++; } });
    const w = courseGrade(gr.c, null, p);
    return {n, current: w.current, minFinal: w.minFinal, maxFinal: w.maxFinal, rem: w.remaining, done: w.done, need: w.need};
  }
  function whatIfOut(gr, vals){
    const w = whatIf(gr, vals), g = gr.g, L = p => letterOf(p, g.scale);
    if (!w.n) return `<span class="mini">Type a mark above to see what it would do. Nothing is saved.</span>`;
    const lt = p => `<b>${fmtP(p)}</b>${L(p) ? ` (${esc(L(p))})` : ""}`;
    const out = [];
    if (w.done) out.push(`That would finish the course on ${lt(w.minFinal)}${w.minFinal >= g.pass ? ", a pass." : `, under the ${fmtP(g.pass)} pass mark.`}`);
    else {
      if (w.current != null) out.push(`Your grade on marked work would be ${lt(w.current)}.`);
      const tp = (name, t) => { const n = w.need(t); return n <= 0 ? `${name.charAt(0).toUpperCase() + name.slice(1)} is secured.` : n <= 100 ? `You'd then need <b>${fmtP(n)}</b> on the remaining ${fmtW(w.rem)} for ${name}.` : `${name} would be out of reach.`; };
      if (g.goal != null) out.push(tp(`your goal of ${fmtP(g.goal)}`, g.goal));
      out.push(tp(`the ${fmtP(g.pass)} pass mark`, g.pass));
    }
    return out.join(" ");
  }
  function whatIfHtml(gr){
    const open = (gr.open || []).filter(t => Number(t.weight) > 0).slice().sort(sortTasks).slice(0, 8);
    if (gr.done || !open.length) return "";
    const vals = (ui.gWhatIf && ui.gWhatIf[gr.c.id]) || {};
    return `<div class="gr-sub gr-wi" data-wi-course="${esc(gr.c.id)}"><h4>What If?</h4>
      <ul class="gr-wi-list">${open.map(t => `<li><label for="wi-${esc(t.id)}"><span class="gr-row-t">${esc(t.title)}</span><span class="mini">worth ${fmtW(Number(t.weight))}${t.due ? `, due ${esc(fmtShort(t.due))}` : ""}</span></label><input type="text" id="wi-${esc(t.id)}" data-wi="${esc(t.id)}" inputmode="decimal" autocomplete="off" placeholder="85 or 43/50" value="${esc(vals[t.id] != null ? vals[t.id + ":raw"] || vals[t.id] : "")}" data-noenter></li>`).join("")}</ul>
      <p class="gr-wi-out" role="status" aria-live="polite">${whatIfOut(gr, vals)}</p>
      <button type="button" class="link-btn" data-act="wi-clear" data-id="${esc(gr.c.id)}" style="justify-self:start"${Object.keys(vals).length ? "" : " hidden"}>Clear What-Ifs</button></div>`;
  }
  // The one course closest to a line that matters (pass mark or goal)
  function topNeed(all){
    const cand = all.filter(gr => gr.ts.length && !gr.done && gr.current != null && gr.remaining > 0.01);
    if (!cand.length) return null;
    const sev = {out: 3, risk: 2, watch: 1};
    const dist = gr => Math.min(Math.abs(gr.current - gr.g.pass), gr.g.goal != null ? Math.abs(gr.current - gr.g.goal) : 1e9);
    const gr = cand.slice().sort((a, b) => (sev[b.risk] || 0) - (sev[a.risk] || 0) || dist(a) - dist(b))[0];
    const g = gr.g, nm = esc(courseName(gr.c)), L = p => letterOf(p, g.scale), np = gr.need(g.pass), ng = g.goal != null ? gr.need(g.goal) : null;
    const lt = p => `<b>${fmtP(p)}</b> on the rest of ${nm}`;
    let msg;
    const hold = holdOf(gr);
    if (gr.risk === "out" || (np != null && np > 100)) msg = `Even full marks on the rest of ${nm} would land under the ${fmtP(g.pass)} pass mark. Talking to your instructor soon is the best next step.`;
    else if (np > 0 && (inDanger(gr) || (ng == null && (!hold || hold.th <= g.pass || !(hold.n <= 100))))) msg = `You need ${lt(np)} to pass (${fmtP(g.pass)}).`;
    else if (ng != null && ng > 0 && ng <= 100) msg = `You need ${lt(ng)} to reach your goal of ${fmtP(g.goal)}.`;
    else if (ng != null && ng > 100) msg = `Your goal of ${fmtP(g.goal)} in ${nm} is out of reach now. The most you can still get is <b>${fmtP(gr.maxFinal)}</b>.`;
    else {
      const l = L(gr.current), th = l ? Number((g.scale.find(x => x[0] === l) || [])[1]) : NaN;
      const nh = isNum(th) ? gr.need(th) : null;
      msg = ng != null ? `You've locked in your goal of ${fmtP(g.goal)} in ${nm}.` : nh == null || nh <= 0 ? `You've locked in at least ${esc(l || "a pass")} in ${nm}.` : `You need ${lt(nh)} to keep your ${esc(l)} (${fmtP(th)}).`;
    }
    return {gr, msg};
  }
  function gradeBar(gr){
    const g = gr.g, lo = clampP(gr.minFinal), hi = clampP(gr.maxFinal);
    const tick = (v, cls, lab) => `<i class="gr-tick ${cls}" style="left:${clampP(v)}%"><span>${lab}</span></i>`;
    return `<div class="gr-bar" role="img" aria-label="Secured so far ${fmtP(lo)} of the final grade. Up to ${fmtP(hi)} is still possible. Pass mark ${fmtP(g.pass)}${g.goal != null ? `, goal ${fmtP(g.goal)}` : ""}.">
        <i class="gr-sec" style="width:${lo}%"></i><i class="gr-pos" style="left:${lo}%;width:${Math.max(0, hi - lo)}%"></i>
        ${tick(g.pass, "pass", "Pass " + r1(g.pass))}${g.goal != null ? tick(g.goal, "goal", "Goal " + r1(g.goal)) : ""}
      </div>
      <div class="gr-legend"><span><i class="k sec"></i>Secured So Far</span><span><i class="k pos"></i>Still Up for Grabs</span></div>`;
  }
  const FIELDS_OF = t => { const L = ["bs", "cv", "bb"].map(f => t[f]).find(Boolean) || {}; const fb = L.fb || null;
    return {feedback: !!(fb && ((fb.c || []).some(m => !m.mine) || (fb.ra || []).length)), rubric: !!L.rub}; };
  function gradeRows(list, swingId, dropped){
    return list.slice().sort(sortTasks).map(t => {
      const p = markPct(t);
      const fbk = window.SBLMS_HASFB && SBLMS_HASFB(t);
      const open = !!(fbk && ui.grOpen && ui.grOpen[t.id]), L = fbk ? FIELDS_OF(t) : null, what = L && (L.feedback || L.rubric) ? "Feedback" : "Class Results";
      const nw = p != null && !hasWeight(t);
      return `<li class="${fbk ? "gr-has-drop" : ""}${nw ? " gr-nw" : ""}"><button class="gr-row-main" data-act="${fbk ? "lms-fb" : "edit-task"}" data-id="${esc(t.id)}"${fbk ? ` aria-expanded="${open}"` : ""}><span class="gr-row-t">${t.markNew && t.mark ? `<span class="gr-newmark" title="New mark from your last sync" aria-label="New mark"></span>` : ""}${esc(t.title)}${nw ? ` <span class="pill gr-nw-pill" title="Shown, but not counted in the course grade until it has a weight">No weight yet</span>` : ""}${fbk ? ` <span class="pill lms-fbpill">${what}<span class="gr-chev" aria-hidden="true">▾</span></span>` : ""}</span><span class="mini">${esc(t.type)}, ${hasWeight(t) ? `worth ${fmtW(Number(t.weight))}` : "not counted yet"}${t.due ? `, due ${esc(fmtShort(t.due))}` : ""}${p != null ? vsPill(t) : ""}${swingId === t.id ? ` <span class="pill gr-swing">Biggest swing</span>` : ""}${dropped && dropped.has(t.id) ? ` <span class="pill gr-dropped">Dropped</span>` : ""}</span></button>
        ${p != null ? `<button class="gr-mk" data-act="g-mark" data-id="${esc(t.id)}" aria-label="Edit mark for ${esc(t.title)}"><b>${fmtP(p)}</b>${Number(t.mark.outOf) !== 100 ? `<span class="mini">${esc(fmtMark(t.mark))}</span>` : ""}</button>`
          : `<button class="btn small" data-act="g-mark" data-id="${esc(t.id)}">${t.status === "done" ? "Add Mark" : "Mark"}</button>`}${fbk ? `<div class="gr-drop" data-drop="${esc(t.id)}"${open ? "" : " hidden"}>${open && window.SBLMS_FBBODY ? SBLMS_FBBODY(t) : ""}</div>` : ""}</li>`;
    }).join("");
  }
  // One plain sentence about where a course stands
  function gradeLine(gr){
    const g = gr.g, L = p => letterOf(p, g.scale);
    const np = gr.ts.length && !gr.done ? gr.need(g.pass) : null;
    return !gr.ts.length ? "No graded tasks yet" : gr.current == null ? `No marks yet. Pass mark ${fmtP(g.pass)}.`
      : gr.done ? `Final ${fmtP(gr.minFinal)}${L(gr.minFinal) ? " " + L(gr.minFinal) : ""}`
      : np > 100 ? "Pass mark out of reach. Talk to your instructor."
      : g.goal != null && !inDanger(gr) ? (n => n <= 0 ? "Goal secured." : n <= 100 ? `Needs ${fmtP(n)} on the remaining ${fmtW(gr.remaining)} for your goal.` : "Goal out of reach now.")(gr.need(g.goal))
      : !inDanger(gr) && (h => h && h.th > g.pass && h.n <= 100)(holdOf(gr)) ? (h => h.n <= 0 ? `${h.l} locked in.` : `Needs ${fmtP(h.n)} on the remaining ${fmtW(gr.remaining)} to keep your ${h.l}.`)(holdOf(gr))
      : np <= 0 ? `Pass mark secured. ${g.goal != null ? (n => n <= 0 ? "Goal secured too." : n <= 100 ? `${fmtP(n)} on the rest for your goal.` : "Goal out of reach now.")(gr.need(g.goal)) : ""}`
      : `Needs ${fmtP(np)} on the remaining ${fmtW(gr.remaining)} to pass${g.goal != null ? (n => n <= 0 ? ", goal secured" : n <= 100 ? `, ${fmtP(n)} for your goal` : ", goal out of reach")(gr.need(g.goal)) : ""}.`;
  }
  /* New marks from a sync: a red count on Courses, on the Grades switch, on each course with one (its card, its row on Grades,
     its own Grades tab), and a red dot on the mark itself. Seen once you've had that course's Grades tab (or its marks on Grades) open and moved on. */
  const newMarks = cid => tasksArr().filter(t => t && t.markNew && t.mark && t.mark.got != null && t.mark.got !== "" && (!cid || t.courseId === cid));
  const pipOn = (el, n, cls, label) => {
    if (!el) return; let d = el.querySelector(":scope > ." + cls);
    if (!n) { if (d) d.remove(); return; }
    if (!d) { d = document.createElement("span"); d.className = cls; d.setAttribute("aria-hidden", "true"); el.appendChild(d); }
    d.textContent = n > 9 ? "9+" : String(n);
    if (label) el.setAttribute("aria-label", label);
  };
  let markSeenPending = new Set();
  function newMarkBadges(){
    const all = newMarks(), byC = {}; all.forEach(t => { byC[t.courseId] = (byC[t.courseId] || 0) + 1; });
    // what's on screen now counts as seen when you move on
    const onCourse = ui.tab === "courses" && ui.courseId && ui.courseTab === "grades" && ui.courseTabFor === ui.courseId ? ui.courseId : null;
    const onPage = ui.tab === "courses" && !ui.courseId && ui.courseTab === "grades" ? Object.keys(ui.gpOpen || {}).filter(k => ui.gpOpen[k]) : [];
    const showing = new Set(all.filter(t => t.courseId === onCourse || onPage.includes(t.courseId)).map(t => t.id));
    const gone = [...markSeenPending].filter(id => !showing.has(id) && state.tasks[id] && state.tasks[id].markNew);
    markSeenPending = showing;
    if (gone.length) { applyChanges(gone.map(id => { const n = clone(state.tasks[id]); delete n.markNew; return {kind: "task", id, after: n}; }), ""); return; }
    const tab = document.querySelector('nav.tabs [data-tab="courses"]');
    if (tab) { tab.classList.add("has-newmark"); let d = tab.querySelector(":scope > .fc-navdue"); if (!all.length) { if (d) d.remove(); } else { if (!d) { d = document.createElement("span"); d.className = "fc-navdue"; /* same badge as Review's cards-due count */ d.setAttribute("aria-hidden", "true"); tab.appendChild(d); } d.textContent = all.length > 9 ? "9+" : String(all.length); } }
    pipOn(document.querySelector('.cf-tabs [data-act="cf-view"][data-id="grades"]'), all.length, "nm-pip");
    document.querySelectorAll('.course-card[data-act="open-course"]').forEach(b => pipOn(b, byC[b.dataset.id] || 0, "nm-card"));
    document.querySelectorAll('.gp-main[data-act="g-open-course"]').forEach(b => pipOn(b, byC[b.dataset.id] || 0, "nm-ringpip")); /* sits on the corner of the course's ring icon */
    if (ui.courseId) pipOn(document.querySelector('[data-act="course-tab"][data-id="grades"]'), byC[ui.courseId] || 0, "nm-pip");
  }
  hook("render", () => { try { newMarkBadges(); } catch (e) { console.warn("new marks", e); } });
  window.SBGRADES_NEW = {list: newMarks, badges: newMarkBadges};
  window.SBGRADES = {lines: () => grades().filter(gr => gr.ts.length).map(gr => `${courseLabel(gr.c)}: ${gr.current != null ? "current " + fmtP(gr.current) + (letterOf(gr.current, gr.g.scale) ? " (" + letterOf(gr.current, gr.g.scale) + ")" : "") + " on " + fmtW(gr.wMarked) + " marked" : "no marks yet"}; pass mark ${fmtP(gr.g.pass)}${gr.g.goal != null ? ", goal " + fmtP(gr.g.goal) : ""}. ${gradeLine(gr)}${zeroed(gr) ? " LOOKS WRONG: every mark in this course is 0%, which usually means the marks weren't entered or came from the school site as 0; check them before treating it as failing." : ""}`)};
  // For the course cards and a course's header
  window.SBGRADES.schoolPass = list => {
    const u = [...new Set((list || []).filter(isNum).map(Number))];
    if ((list || []).length < 2 || u.length !== 1 || gset().passSrc === "user" || r1(gset().pass) === r1(u[0])) return;
    saveG({pass: r1(u[0]), passSrc: "school"}); scheduleRender();
  };
  // Every piece of work with a mark, for the AI: the same marks the Grade Tracker uses
  window.SBGRADES.items = () => allTasks().filter(t => markPct(t) != null && !t.prepFor).map(t => {
    const c = courseOf(t.courseId), pct = markPct(t);
    return {id: t.id, title: t.title, type: t.type, course: c ? courseLabel(c) : "", due: t.due || "", weight: hasWeight(t) ? Number(t.weight) : null, pct: r1(pct), mark: fmtMark(t.mark), letter: c ? letterOf(pct, gradingOf(c).scale) : ""};
  });
  window.SBGRADES.waiting = () => tasksArr().filter(t => t.status === "done" && hasWeight(t) && markPct(t) == null && !t.prepFor).map(t => ({title: t.title, course: courseOf(t.courseId) ? courseLabel(courseOf(t.courseId)) : "", weight: Number(t.weight)}));
  window.SBGRADES.goalHtml = c => { try { const gr = courseGrade(c); return gr.ts.length ? goalField(c, gr) : ""; } catch (e) { return ""; } };
  window.SBGRADES.now = c => { try { const gr = courseGrade(c); if (!gr.ts.length) return null; return {pct: gr.current, letter: gr.current != null ? letterOf(gr.current, gr.g.scale) : "", marked: gr.wMarked, fmt: fmtP, line: gradeLine(gr), risk: gr.risk, done: gr.done}; } catch (e) { return null; } };
  // The Grades tab of one course
  function gradeCard(c){
    const gr = courseGrade(c), g = gr.g, L = p => letterOf(p, g.scale);
    const settingsBtn = `<button class="btn small" data-act="g-paste" data-id="${esc(c.id)}">Paste Grades</button> <button class="btn small" data-act="g-course-set" data-id="${esc(c.id)}">Grade Settings</button>`;
    // marks on work with no grade weight yet (like a quiz mark that isn't on the school site's Grades page): listed, not counted
    const loose = gr.loose;
    const looseNote = loose.length ? `<p class="mini gr-nw-note" style="margin:6px 0 0">${loose.length === 1 ? "The mark" : `The ${loose.length} marks`} marked <b>No weight yet</b> ${loose.length === 1 ? "isn't" : "aren't"} counted in your course grade. ${loose.length === 1 ? "It counts" : "They count"} as soon as ${loose.length === 1 ? "it has" : "they have"} a weight: from your school site's Grades page when it's posted there, from the syllabus, or added by you (Advanced Settings).</p>` : "";
    if (!gr.ts.length && loose.length) return `<section class="gr-card" aria-label="Grades"><div class="gr-headrow"><h3>Your Marks</h3><span class="spacer"></span>${settingsBtn}</div><div class="gr-sub"><h4>Marked <span class="n">${loose.length}</span></h4><ul class="gr-work">${gradeRows(loose)}</ul>${looseNote}</div><p class="mini" style="margin:8px 0 0">Pass mark: <b>${fmtP(g.pass)}</b>.</p></section>`;
    if (!gr.ts.length) return `<section class="gr-card gr-empty" aria-label="Grades"><p style="margin:0">Add a <b>Grade Weight</b> to assignments, quizzes and exams (in Advanced Settings on each task) to track your grade and see what you need on the rest. Pass mark: <b>${fmtP(g.pass)}</b>.</p><div class="gr-acts">${settingsBtn}</div></section>`;
    const marked = gr.ts.filter(t => markPct(t) != null), unmarked = gr.ts.filter(t => markPct(t) == null);
    const need = needLines(gr), sw = biggestSwing(gr), gg = goalGap(gr);
    if (sw) need.push(`<b>Biggest swing:</b> ${esc(sw.t.title)} is worth ${fmtW(sw.share)} of the course. Every 10 points on it moves your final grade by ${r1(sw.per10)}.`);
    if (gr.R.drops.length || gr.R.bonus.pts > 0) need.push(`<b>Grading rules:</b> ${esc(rulesText(gr.R))}. ${gr.ruled ? "These numbers already count them." : "They start counting once there are more items than the rule drops."} <button type="button" class="link-btn" data-act="g-course-set" data-id="${esc(c.id)}">Change</button>`);
    return `<section class="gr-card${gr.risk ? " gr-" + gr.risk : ""}" aria-label="Grades">
      <div class="gr-headrow"><h3>Where You Stand</h3>${riskPill(gr.risk)}<span class="spacer"></span>${settingsBtn}</div>
      <div class="gr-top">
        <div class="gr-stat"><span class="gr-k">Current Grade</span>${gr.current != null ? `<span class="gr-v">${fmtP(gr.current)}${L(gr.current) ? ` <span class="gr-l">${esc(L(gr.current))}</span>` : ""}</span><span class="mini">on ${fmtW(gr.wMarked)} of the course marked so far</span>` : `<span class="gr-v gr-none">No Marks Yet</span><span class="mini">Add a mark below</span>`}</div>
        <div class="gr-stat"><span class="gr-k">Projected Final</span>${gr.projected != null ? `<span class="gr-v">${fmtP(gr.projected)}${L(gr.projected) ? ` <span class="gr-l">${esc(L(gr.projected))}</span>` : ""}</span><span class="mini">${gr.done ? "all work marked" : `if you keep this up. Possible range ${fmtP(gr.minFinal)} to ${fmtP(gr.maxFinal)}`}</span>` : `<span class="gr-v gr-none">Not Yet</span><span class="mini">Needs a first mark</span>`}</div>
        <div class="gr-stat gr-pass"><span class="gr-k">Pass Mark</span><span class="gr-v">${fmtP(g.pass)}${L(g.pass) ? ` <span class="gr-l">${esc(L(g.pass))}</span>` : ""}</span><span class="mini">${g.goal != null && gg ? `<b class="${gg.gap >= 0 ? "gr-ok" : ""}">${esc(gg.text)}</b>` : ""}</span></div>
      </div>
      ${goalAsk(gr) || goalField(c, gr)}
      ${gradeBar(gr)}
      ${need.length ? `<div class="gr-sub"><h4>What You Need</h4><ul class="gr-need">${need.map(x => `<li>${x}</li>`).join("")}</ul></div>` : ""}
      ${breakdownHtml(gr)}
      ${whatIfHtml(gr)}
      <div class="gr-sub"><h4>Marked <span class="n">${marked.length + loose.length}</span></h4>${marked.length + loose.length ? `<ul class="gr-work">${gradeRows(marked, null, gr.dropped)}${gradeRows(loose)}</ul>${looseNote}` : `<p class="mini" style="margin:0">Nothing marked yet.</p>`}</div>
      <div class="gr-sub"><h4>Still to Mark <span class="n">${unmarked.length}</span></h4>${unmarked.length ? `<ul class="gr-work">${gradeRows(unmarked, sw && sw.t.id)}</ul>` : `<p class="mini" style="margin:0">Every graded item has a mark. Weights add up to ${fmtW(gr.wAll)}.</p>`}</div>
    </section>`;
  }
  // The Target Grade field on a course page (blank clears it)
  function goalField(c, gr){
    gr = gr || courseGrade(c); const g = gr.g, gs = goalShort(gr), gg = goalGap(gr), ng = g.goal != null && !gr.done && gr.current != null ? gr.need(g.goal) : null;
    const note = g.goal == null ? "What you're aiming for. Today's Plan gives more time to courses falling short."
      : gs ? `${gs.under > 0.05 ? `${r1(gs.under)} pts under it now` : "You need better than your average so far"}, so Today's Plan gives this course more time.`
      : ng != null && ng > 100 ? "Out of reach now, even with full marks on the rest."
      : gg ? (gg.gap >= 0 ? `On track: ${gg.text}.` : gg.text + ".") : "Shows how you're doing once there's a mark.";
    return `<div class="gr-target"><label class="gr-target-l" for="goalIn-${esc(c.id)}">Target Grade</label><span class="gr-target-in"><input type="number" id="goalIn-${esc(c.id)}" data-goal-in="${esc(c.id)}" min="1" max="100" step="0.5" inputmode="decimal" placeholder="None" value="${g.goal != null ? esc(r1(g.goal)) : ""}" aria-describedby="goalNote-${esc(c.id)}"><span aria-hidden="true">%</span></span><span class="mini gr-target-n${gs ? " short" : ""}" id="goalNote-${esc(c.id)}">${esc(note)}</span></div>`;
  }
  document.addEventListener("change", e => {
    const el = e.target; if (!el || !el.matches || !el.matches("[data-goal-in]")) return;
    const c = courseOf(el.dataset.goalIn); if (!c) return;
    const raw = String(el.value || "").trim(), v = raw === "" ? null : Number(raw);
    if (v != null && (!isFinite(v) || v <= 0 || v > 100)) { el.setAttribute("aria-invalid", "true"); toast("Enter a target between 1 and 100, or leave it blank"); return; }
    el.removeAttribute("aria-invalid");
    const cur = gradingOf(c).goal; if ((cur == null && v == null) || (cur != null && v != null && r1(cur) === r1(v))) return;
    const n = clone(c); n.grading = Object.assign({}, n.grading || {}, {goal: v == null ? null : r1(v)});
    applyChanges([{kind: "course", id: c.id, after: n}], v == null ? "Target grade cleared" : `Target grade set to ${fmtP(v)}`);
  });
  // Once a course has marks and no goal, ask what the student is aiming for
  const GOAL_NO = "studyboard:goalAskNo";
  const goalNo = () => { try { return JSON.parse(localStorage.getItem(GOAL_NO) || "[]") || []; } catch (e) { return []; } };
  function goalAsk(gr){
    const c = gr.c, g = gr.g;
    if (g.goal != null || gr.current == null || gr.done || goalNo().includes(c.id)) return "";
    const sc = g.scale.filter(x => Number(x[1]) > g.pass).sort((a, b) => Number(a[1]) - Number(b[1])), cur = letterOf(gr.current, g.scale);
    let k = sc.findIndex(x => x[0] === cur); if (k < 0) k = 0;
    const picks = sc.slice(k, k + 3);
    return `<div class="gr-goal-ask" role="group" aria-label="Set a goal"><span><b>What Grade Are You Aiming For?</b><span class="mini">Set a goal and Studyboard shows what you need on the rest.</span></span>
      <span class="chips">${picks.map(x => `<button type="button" class="chip" data-act="g-goal" data-cid="${esc(c.id)}" data-id="${esc(Number(x[1]))}">${esc(x[0])} ${esc(r1(Number(x[1])))}%</button>`).join("")}<button type="button" class="chip" data-act="g-course-set" data-id="${esc(c.id)}">Other</button><button type="button" class="link-btn" data-act="g-goal-no" data-id="${esc(c.id)}">Not Now</button></span></div>`;
  }
  hook("act", (act, el, id) => {
    if (act === "g-goal") { const c = courseOf(el.dataset.cid); if (!c) return true; const n = clone(c); n.grading = Object.assign({}, n.grading || {}, {goal: r1(Number(id))}); applyChanges([{kind: "course", id: c.id, after: n}], `Goal set to ${fmtP(Number(id))}`); return true; }
    if (act === "g-goal-no") { try { localStorage.setItem(GOAL_NO, JSON.stringify(goalNo().concat(id).slice(-100))); } catch (e) {} render(); return true; }
    return false;
  });
  document.addEventListener("toggle", e => { const d = e.target; if (d && d.classList && d.classList.contains("gr-list")) { ui.grListOpen = ui.grListOpen || {}; ui.grListOpen[d.dataset.cid] = d.open; } }, true);
  /* Courses: a Grades tab, on the course list and inside each course */
  const courseTabs = (cur, labels) => `<div class="bview-tabs cd-tabs" role="tablist" aria-label="Courses view">${labels.map(([k, l]) => `<button type="button" role="tab" data-act="course-tab" data-id="${k}" aria-selected="${cur === k}">${l}</button>`).join("")}</div>`;
  const origDetail = viewCourseDetail;
  viewCourseDetail = function(c){
    const html = origDetail.apply(this, arguments);
    const tab = (ui.courseTab === "grades" || (ui.courseTab === "lectures" && window.SBLEC)) && ui.courseTabFor === c.id ? ui.courseTab : "info";
    // the tabs sit inside the course header (<!--cd-tabs-->); the page body starts at <!--cd-body-->
    const mb = html.indexOf("<!--cd-body-->");
    if (mb >= 0) {
      const tabsM = courseTabs(tab, [["info", "Overview"], ["grades", "Grades"]].concat(window.SBLEC ? [["lectures", "Lectures"]] : []));
      const head = html.slice(0, mb).replace("<!--cd-tabs-->", tabsM), body = html.slice(mb);
      if (tab === "grades") { try { return head + gradeCard(c); } catch (err) { console.warn("grades: card", err); return html; } }
      if (tab === "lectures") return head + SBLEC.listHtml(c);
      return head + body;
    }
    const k = html.indexOf('<div class="row-actions">'), e = k >= 0 ? html.indexOf("</div>", k) : -1;
    if (e < 0) return html;
    const head = html.slice(0, e + 6), rest = html.slice(e + 6);
    const tabs = courseTabs(tab, [["info", "Overview"], ["grades", "Grades"]].concat(window.SBLEC ? [["lectures", "Lectures"]] : []));
    if (tab === "lectures") return head + tabs + SBLEC.listHtml(c);
    if (tab === "grades") { try { return head + tabs + gradeCard(c); } catch (err) { console.warn("grades: card", err); return html; } }
    return head + tabs + rest;
  };
  const origCourses = viewCourses;
  viewCourses = function(){
    const html = origCourses.apply(this, arguments);
    if (ui.courseId) return html;
    if (!coursesArr().length) return html;
    if (ui.courseTab === "grades") { try { return gradesPage(); } catch (err) { console.warn("grades: page", err); return html; } }
    return html;
  };
  /* GPA, credits and past terms */
  // The GPA scale: 4 or 4.3, or 0 when GPA is off (the default for UK degree classes)
  const gpaMax = () => { const v = gset().gpa; return v === "off" ? 0 : v === "4.3" ? 4.3 : v === "4.0" ? 4 : scaleRegion() === "uk" ? 0 : 4; };
  const fmtG = v => v == null ? "" : (Math.round(v * 100) / 100).toFixed(2);
  const fmtCr = v => String(Math.round(Number(v) * 100) / 100);
  const terms = () => (Array.isArray(gset().terms) ? gset().terms : []).filter(t => t && typeof t === "object" && t.id).slice().sort((a, b) => (Number(b.at) || 0) - (Number(a.at) || 0));
  // A course's grade now, and where it's heading (its final once everything is marked)
  const nowOf = gr => gr.current == null ? null : gr.done ? gr.minFinal : gr.current;
  const finalOf = gr => gr.current == null ? null : gr.done ? gr.minFinal : gr.projected;
  // One stored term: {gpa, credits, rows}
  function termGpa(t, def, max){
    if (t.manual) { const ok = isNum(t.gpa) && Number(t.credits) > 0; return {gpa: isNum(t.gpa) ? Number(t.gpa) : null, credits: Number(t.credits) || 0, rows: ok ? [{v: Number(t.gpa), cr: Number(t.credits)}] : []}; }
    const rows = max ? (t.courses || []).map(x => ({v: GRULES.points(x.letter, max), cr: isNum(x.credits) ? Number(x.credits) : def})).filter(r => r.v != null) : [];
    return {gpa: GRULES.avg(rows, def), credits: rows.reduce((s, r) => s + (r.cr > 0 ? r.cr : 0), 0), rows};
  }
  // Averages, GPA and history across the term. Courses with no credits count as the typical credits of the rest.
  function termStats(all){
    const max = gpaMax(), T = terms();
    const crs = all.map(gr => gr.c.credits).concat([].concat(...T.map(t => (t.courses || []).map(x => x.credits))));
    const anyCr = crs.some(isNum), def = anyCr ? GRULES.typical(crs) : 1;
    const marked = all.filter(gr => gr.current != null);
    const ptsRows = f => marked.map(gr => ({v: GRULES.points(letterOf(f(gr), gr.g.scale), max), cr: isNum(gr.c.credits) ? Number(gr.c.credits) : def})).filter(r => r.v != null);
    const nowRows = max ? ptsRows(nowOf) : [], projRows = max ? ptsRows(finalOf) : [];
    const past = T.map(t => termGpa(t, def, max)), pastRows = [].concat(...past.map(p => p.rows));
    return {max, def, anyCr, T, past, marked,
      weighted: marked.some(gr => isNum(gr.c.credits)), noCr: all.filter(gr => gr.ts.length && !isNum(gr.c.credits)),
      avg: GRULES.avg(marked.map(gr => ({v: gr.current, cr: gr.c.credits})), def),
      n: nowRows.length, gpaNow: GRULES.avg(nowRows, def), gpaProj: GRULES.avg(projRows, def),
      pastGpa: pastRows.length ? GRULES.avg(pastRows, def) : null, cum: pastRows.length ? GRULES.avg(pastRows.concat(projRows), def) : null};
  }
  // A term record from courses' grades now: finals, or projected finals where marks are still to come
  function termRecord(name, ids){
    const courses = ids.map(id => state.courses[id]).filter(Boolean).map(c => {
      const gr = courseGrade(c), p = finalOf(gr); if (p == null) return null;
      return {name: c.name || courseLabel(c), code: c.code || "", credits: isNum(c.credits) ? Number(c.credits) : null, pct: r1(p), letter: letterOf(p, gr.g.scale), est: !gr.done};
    }).filter(Boolean);
    return courses.length ? {id: uid(), name: String(name || "").trim().slice(0, 40) || "Past Term", at: Date.now(), courses} : null;
  }
  // Saving a term with the same name as a saved one replaces it
  function saveTerm(rec){
    const all = Array.isArray(gset().terms) ? gset().terms.slice() : [];
    const k = all.findIndex(t => t && (t.id === rec.id || (!t.manual && !rec.manual && String(t.name).toLowerCase() === String(rec.name).toLowerCase())));
    if (k >= 0) all[k] = Object.assign({}, rec, {id: all[k].id}); else all.push(rec);
    saveG({terms: all.slice(-60)}); scheduleRender();
  }
  const dropTerm = id => { saveG({terms: (gset().terms || []).filter(t => t && t.id !== id)}); scheduleRender(); };
  window.SBGRADES.rulesText = r => rulesText(GRULES.norm(r));
  window.SBGRADES.snapCount = ids => ids.filter(id => { const c = state.courses[id]; return c && courseGrade(c).current != null; }).length;
  window.SBGRADES.snapTerm = (name, ids) => { const r = termRecord(name, ids); if (r) saveTerm(r); return !!r; };

  function gpaStrip(S){
    if (!S.marked.length && S.pastGpa == null) return "";
    const of = S.max === 4.3 ? "4.3" : "4.0";
    const tile = (k, v, sub) => `<div class="gp-g"><span class="gr-k">${k}</span><span class="gr-v">${v}</span>${sub ? `<span class="mini">${sub}</span>` : ""}</div>`;
    const tiles = (S.n ? tile("Term GPA", fmtG(S.gpaNow), `out of ${of}, from your grades now`) + tile("Projected Term GPA", fmtG(S.gpaProj), "if you keep this up") : "")
      + (S.cum != null && S.max ? tile("Cumulative GPA", fmtG(S.cum), `with this term · past terms ${fmtG(S.pastGpa)}`) : "");
    const k = S.noCr.length;
    const note = !k ? "" : S.anyCr ? `${k} course${k === 1 ? " has" : "s have"} no credits yet, so ${k === 1 ? "it counts" : "they count"} as ${fmtCr(S.def)} credit${S.def === 1 ? "" : "s"}.` : "Add each course's credits to weight your average and GPA by course size.";
    return `<div class="gp-gpa">${tiles}<div class="gp-gpa-foot">${note ? `<span class="mini">${note}</span>` : ""}<span class="spacer"></span><button type="button" class="btn small" data-act="gp-credits">${k ? "Add Credits" : "Credits"}</button></div></div>`;
  }
  function histHtml(S){
    const T = S.T, show = !!S.max;
    const rows = T.map((t, i) => { const p = S.past[i], est = (t.courses || []).some(x => x.est);
      return `<li><button type="button" class="gp-term" data-act="gp-term" data-id="${esc(t.id)}"><span class="gp-term-n"><b>${esc(t.name)}</b><span class="mini">${t.manual ? "Earlier record" : `${(t.courses || []).length} course${(t.courses || []).length === 1 ? "" : "s"}`}${p.credits ? ` · ${fmtCr(p.credits)} credits` : ""}${est ? " · some grades were projected" : ""}</span></span>${show && p.gpa != null ? `<span class="gp-term-g"><b>${fmtG(p.gpa)}</b><span class="mini">GPA</span></span>` : ""}</button></li>`; }).join("");
    return `<section class="gp-hist" aria-labelledby="gpHistH"><div class="gp-sec-h"><h3 class="fsec" id="gpHistH">Past Terms</h3><span class="spacer"></span><button type="button" class="btn small" data-act="gp-term-save">Save This Term</button><button type="button" class="btn small" data-act="gp-term-add">Add an Earlier Record</button></div>
      ${T.length ? `<ul class="gp-terms">${rows}</ul>${show && S.pastGpa != null ? `<p class="mini" style="margin:8px 0 0">Cumulative GPA across past terms: <b>${fmtG(S.pastGpa)}</b>${S.cum != null && S.n ? `. With this term's projected grades: <b>${fmtG(S.cum)}</b>` : ""}.</p>` : ""}`
        : `<p class="mini" style="margin:0">Save each term to track your cumulative GPA.</p>`}</section>`;
  }
  function creditsSheet(){
    const cs = coursesArr(); if (!cs.length) return;
    openSheet(`<form class="sheet">${head("Course Credits")}<div class="sheet-body">
      <p class="mini" style="margin:0">Credits (or units) for each course, from your course calendar or transcript. They weight your average and GPA by course size. Leave one blank if you're not sure, or enter 0 to leave a course out, like one you're auditing.</p>
      <div class="gp-cr-list">${cs.map(c => `<label class="gp-cr-row" style="--c:${esc(c.color)}"><span class="gp-cr-n"><b>${esc(courseLabel(c))}</b>${c.name && c.name !== courseLabel(c) ? ` <span class="mini">${esc(c.name)}</span>` : ""}</span><input type="number" name="cr-${esc(c.id)}" min="0" max="30" step="0.25" inputmode="decimal" value="${isNum(c.credits) ? esc(c.credits) : ""}" placeholder="—" aria-label="Credits for ${esc(c.name)}"></label>`).join("")}</div></div>
      <div class="sheet-foot"><span class="spacer"></span><button type="button" class="btn" data-act="close">Cancel</button><button type="button" class="btn primary" data-submit>Save</button></div></form>`, fd => {
      const ch = [];
      for (const c of cs) {
        const v = String(fd.get("cr-" + c.id) || "").trim();
        if (v && (!isNum(v) || Number(v) < 0 || Number(v) > 30)) { toast(`Enter credits between 0 and 30 for ${courseLabel(c)}`); return false; }
        const nv = v ? Number(v) : null;
        if ((isNum(c.credits) ? Number(c.credits) : null) !== nv) ch.push({kind: "course", id: c.id, after: Object.assign(clone(c), {credits: nv})});
      }
      if (ch.length) applyChanges(ch, "Credits saved");
    });
  }
  // Save this term's grades to Past Terms
  function termSaveSheet(){
    const list = coursesArr().map(c => ({c, gr: courseGrade(c)})).filter(x => x.gr.current != null);
    if (!list.length) { toast("Add a mark first. Past Terms keeps each course's final grade."); return; }
    const guess = typeof seasonGuess === "function" ? seasonGuess() : "";
    openSheet(`<form class="sheet">${head("Save This Term")}<div class="sheet-body">
      <p class="mini" style="margin:0">Keeps a record of each course's grade for your cumulative GPA. Courses with marks still to come use their projected final; you can change any of it later. Your courses stay as they are.</p>
      <label class="f"><span class="lh">Term Name ${REQ}</span><input type="text" name="term" required maxlength="40" value="${esc(guess)}"></label>
      <fieldset><legend>Courses</legend><div class="nt-list">${list.map(({c, gr}) => { const p = finalOf(gr), L = letterOf(p, gr.g.scale);
        return `<label class="mi-check nt-row" style="--c:${esc(c.color)}"><input type="checkbox" name="c" value="${esc(c.id)}" checked><span class="sd"></span><span><b>${esc(courseLabel(c))}</b> <span class="mini">${fmtP(p)}${L ? " " + esc(L) : ""}${gr.done ? ", final" : ", projected"}${isNum(c.credits) ? `, ${fmtCr(c.credits)} credits` : ""}</span></span></label>`; }).join("")}</div></fieldset></div>
      <div class="sheet-foot"><span class="spacer"></span><button type="button" class="btn" data-act="close">Cancel</button><button type="button" class="btn primary" data-submit>Save Term</button></div></form>`, fd => {
      const ids = fd.getAll("c"); if (!ids.length) { toast("Pick at least one course"); return false; }
      const name = String(fd.get("term") || "").trim(), had = terms().some(t => !t.manual && t.name.toLowerCase() === name.toLowerCase());
      const r = termRecord(name, ids); if (!r) return false;
      saveTerm(r); toast(had ? `${r.name} updated in Past Terms` : `${r.name} saved to Past Terms`);
    });
  }
  // An earlier record (GPA and credits from before Studyboard), or editing a saved term
  function termSheet(id){
    const t = id ? terms().find(x => x.id === id) : {id: "", manual: true, name: "Before Studyboard", gpa: null, credits: null};
    if (!t) return;
    const max = gpaMax() || 4.3;
    const body = t.manual ? `<p class="mini" style="margin:0">Your GPA and total credits so far, from your transcript. They count toward your cumulative GPA.</p>
        <label class="f"><span class="lh">Name ${REQ}</span><input type="text" name="term" required maxlength="40" value="${esc(t.name)}"></label>
        <label class="f"><span class="lh">GPA ${REQ} <span class="hint">out of ${max === 4.3 ? "4.3" : "4.0"}</span></span><input type="number" name="gpa" required min="0" max="${max}" step="0.01" inputmode="decimal" value="${isNum(t.gpa) ? esc(t.gpa) : ""}"></label>
        <label class="f"><span class="lh">Credits ${REQ} <span class="hint">total credits that GPA covers</span></span><input type="number" name="credits" required min="0.25" max="999" step="0.25" inputmode="decimal" value="${isNum(t.credits) ? esc(t.credits) : ""}"></label>`
      : `<label class="f"><span class="lh">Term Name ${REQ}</span><input type="text" name="term" required maxlength="40" value="${esc(t.name)}"></label>
        <div class="gp-tc-head" aria-hidden="true"><span>Course</span><span>Letter</span><span>Credits</span><span></span></div>
        <div class="gp-tc-list">${(t.courses || []).map((x, i) => `<div class="gp-tc-row"><span class="gp-tc-n"><b>${esc(x.code || x.name)}</b><span class="mini">${isNum(x.pct) ? fmtP(Number(x.pct)) : ""}${x.est ? " projected" : ""}</span></span>
          <label><span class="sr">Letter for ${esc(x.name)}</span><input type="text" name="tl-${i}" maxlength="4" value="${esc(x.letter || "")}" autocapitalize="characters" spellcheck="false" data-noenter></label>
          <label><span class="sr">Credits for ${esc(x.name)}</span><input type="number" name="tc-${i}" min="0" max="30" step="0.25" inputmode="decimal" value="${isNum(x.credits) ? esc(x.credits) : ""}" placeholder="—" data-noenter></label>
          <label class="mi-check"><input type="checkbox" name="tx-${i}"><span class="sr">Remove ${esc(x.name)}</span><span aria-hidden="true">Remove</span></label></div>`).join("")}</div>
        <p class="mini" style="margin:0">Change a letter to match your transcript. The GPA uses each letter and its credits.</p>`;
    openSheet(`<form class="sheet">${head(id ? "Edit Past Term" : "Add an Earlier Record")}<div class="sheet-body">${body}</div>
      <div class="sheet-foot">${id ? `<button type="button" class="btn danger" id="gpTermDel">Delete</button>` : ""}<span class="spacer"></span><button type="button" class="btn" data-act="close">Cancel</button><button type="button" class="btn primary" data-submit>Save</button></div></form>`, fd => {
      const name = String(fd.get("term") || "").trim().slice(0, 40); if (!name) return false;
      if (t.manual) {
        const g = Number(fd.get("gpa")), cr = Number(fd.get("credits"));
        if (!isNum(fd.get("gpa")) || g < 0 || g > max) { toast(`Enter a GPA from 0 to ${max}`); return false; }
        if (!(cr > 0) || cr > 999) { toast("Enter the credits that GPA covers"); return false; }
        saveTerm(Object.assign({}, t, {id: t.id || uid(), name, gpa: g, credits: cr, at: Number(t.at) || 0, manual: true}));
        toast(id ? "Saved" : `${name} added to Past Terms`); return;
      }
      const courses = [];
      for (let i = 0; i < (t.courses || []).length; i++) {
        if (fd.get("tx-" + i)) continue;
        const L = String(fd.get("tl-" + i) || "").trim().toUpperCase().replace(/\s+/g, ""), cv = String(fd.get("tc-" + i) || "").trim();
        if (cv && (!isNum(cv) || Number(cv) < 0 || Number(cv) > 30)) { toast("Enter credits between 0 and 30"); return false; }
        courses.push(Object.assign({}, t.courses[i], {letter: L.slice(0, 4), credits: cv ? Number(cv) : null}));
      }
      if (!courses.length) { dropTerm(t.id); toast(`${t.name} removed from Past Terms`); return; }
      saveTerm(Object.assign({}, t, {name, courses})); toast("Saved");
    });
    const del = $("#gpTermDel");
    if (del) del.addEventListener("click", () => { const was = clone(t); dlg.close(); dropTerm(t.id); toast(`${t.name} removed from Past Terms`, () => { saveTerm(was); toast("Undone"); }); });
  }

  /* Ask AI about my grades */
  const AI_ASK = {
    sum: {label: "Summarize My Term", sys: "Write 3 to 5 short bullet points on how the student's term is going: overall standing, the strongest and weakest courses, how marks have moved, and anything close to a pass mark or goal."},
    focus: {label: "Where Should I Focus?", sys: "Write 2 to 4 short bullet points, most important first, on where to put effort next to protect or raise grades. Weigh how much each upcoming item is worth, how soon it's due, and how close each course is to its pass mark or goal. Each point names the course and the item and says why in one sentence."}
  };
  function aiContext(){
    const all = grades(), S = termStats(all), L = [`Today is ${todayISO()}.`];
    if (S.max && S.n) L.push(`Term GPA from grades now: ${fmtG(S.gpaNow)}; projected: ${fmtG(S.gpaProj)} (out of ${S.max}).`);
    if (S.max && S.pastGpa != null) L.push(`Cumulative GPA from past terms: ${fmtG(S.pastGpa)}.`);
    if (S.avg != null) L.push(`${S.weighted ? "Credit-weighted average" : "Average"} across courses with marks: ${fmtP(S.avg)}.`);
    all.filter(gr => gr.ts.length).forEach(gr => {
      const c = gr.c, g = gr.g, Lt = p => letterOf(p, g.scale) ? " " + letterOf(p, g.scale) : "";
      const risk = {risk: "pass mark at risk", watch: "close to the pass mark", out: "pass mark out of reach"}[gr.risk];
      const head = `COURSE ${courseLabel(c)}${c.name && c.name !== courseLabel(c) ? " (" + c.name + ")" : ""}${isNum(c.credits) ? ", " + fmtCr(c.credits) + " credits" : ""}: `
        + (gr.current != null ? `current ${fmtP(gr.current)}${Lt(gr.current)} on ${fmtW(gr.wMarked)} of the course marked; ${gr.done ? "final" : "projected final"} ${fmtP(finalOf(gr))}${Lt(finalOf(gr))}; possible range ${fmtP(gr.minFinal)} to ${fmtP(gr.maxFinal)}` : "no marks yet")
        + `; pass mark ${fmtP(g.pass)}${g.goal != null ? "; goal " + fmtP(g.goal) : ""}${risk ? "; " + risk : ""}. ${gradeLine(gr)}${rulesText(gr.R) ? " Grading rules: " + rulesText(gr.R) + "." : ""}`;
      const mk = gr.marked.slice().sort(sortTasks).map(t => `${t.title} (${t.type}, worth ${fmtW(Number(t.weight))}${t.due ? ", " + t.due : ""}): ${fmtP(markPct(t))}${gr.dropped.has(t.id) ? ", dropped" : ""}`).join("; ");
      const op = gr.open.slice().sort(sortTasks).slice(0, 10).map(t => `${t.title} (${t.type}, worth ${fmtW(Number(t.weight))}${t.due ? ", due " + t.due : ""}${t.status === "done" ? ", handed in, waiting for a mark" : ""})`).join("; ");
      L.push(head + (zeroed(gr) ? "\n  LOOKS WRONG: every mark in this course is 0%, which almost always means the marks weren't entered or the school site sent ungraded work as 0. Don't treat it as a real failing grade." : "") + (mk ? "\n  Marked: " + mk : "") + (op ? "\n  Still to come: " + op : ""));
    });
    return L.join("\n");
  }
  const aiPaid = () => { try { const c = aiCfg(); return !isFreeModel(c.provider, c.model); } catch (e) { return false; } };
  async function askAi(kind){
    const A = AI_ASK[kind]; if (!A || (ui.gpAi && ui.gpAi.busy)) return;
    if (aiPaid() && !ui.gpAiOk) return;
    ui.gpAi = {kind, busy: true}; render();
    try {
      const r = await aiCall({task: "coach", fast: true, maxTokens: 1600, temperature: 0.4, schema: {type: "OBJECT", properties: {points: {type: "ARRAY", items: {type: "STRING"}}}, required: ["points"]},
        parts: [{text: aiContext()}], system: "You're a kind, practical study coach looking at a student's grades. " + A.sys + " Look at every course, including finished ones. If a course is marked LOOKS WRONG, or a mark is far out of line with the rest, say that first and suggest checking those marks, instead of skipping it or treating it as a real result. Remember a fully marked course can no longer change, so effort goes to courses with work still to come. Use only the numbers, items and dates given, and never invent marks, dates or grading rules. Plain, warm words. No em dashes, and no medical or academic-policy claims. Return JSON only."});
      const pts = ((r && r.data && r.data.points) || []).map(s => String(s || "").replace(/\s*[—–]\s*/g, ", ").replace(/^[\s•*-]+/, "").trim()).filter(Boolean).slice(0, 6);
      ui.gpAi = pts.length ? {kind, pts} : {kind, err: "The AI didn't send anything back. Try again."};
    } catch (e) { ui.gpAi = {kind, err: (e && e.message) || "Couldn't reach the AI right now. Try again in a moment."}; }
    if (ui.tab === "courses" && !ui.courseId && ui.courseTab === "grades") render();
  }
  function aiHtml(all){
    if (!all.some(gr => gr.ts.length)) return "";
    try { if (inPreview()) return ""; } catch (e) { return ""; }
    const h = `<h3 class="fsec" id="gpAiH">Ask AI About Your Grades</h3>`;
    if (!aiReady()) return `<section class="gp-ai" aria-labelledby="gpAiH">${h}<p class="mini" style="margin:0">Get a short summary of your term, or advice on where to focus next. Set up AI in Settings (the free Gemini key works). <button type="button" class="link-btn" data-act="ai-setup">Set Up AI</button></p></section>`;
    const st = ui.gpAi || {}, paid = aiPaid(), off = paid && !ui.gpAiOk;
    let cfg = null; try { cfg = aiCfg(); } catch (e) {}
    const out = st.busy ? `<p class="mini" style="margin:0">Reading your grades…</p>` : st.err ? `<p class="mini" style="margin:0">${esc(st.err)}</p>`
      : st.pts ? `<p class="gp-ai-k">${esc(AI_ASK[st.kind].label.replace(/\?$/, ""))}</p><ul class="gp-ai-list">${st.pts.map(p => `<li>${esc(p)}</li>`).join("")}</ul>` : "";
    return `<section class="gp-ai" aria-labelledby="gpAiH">${h}
      <div class="gp-ai-acts">${Object.entries(AI_ASK).map(([k, a]) => `<button type="button" class="btn small ai-btn${st.busy && st.kind === k ? " busy" : ""}" data-act="gp-ai" data-id="${k}"${off || st.busy ? " disabled" : ""}>${AI_ICON} ${esc(a.label)}</button>`).join("")}</div>
      ${paid && cfg && AI_PROVIDERS[cfg.provider] ? `<label class="mi-check"><input type="checkbox" id="gpAiOk"${ui.gpAiOk ? " checked" : ""}> This uses my paid ${esc(AI_PROVIDERS[cfg.provider].short)} account (${esc(aiModelName(cfg.provider, cfg.model))}) and may cost a little money.</label>` : ""}
      <div class="gp-ai-out" role="status" aria-live="polite">${out}</div>
      ${st.pts && window.SBCOMPTAB ? `<button type="button" class="link-btn" data-act="gp-ai-more" style="justify-self:start">Ask a Follow-Up</button>` : ""}
      <p class="mini" style="margin:0">The AI sees your courses, weights and marks, and can make mistakes. The numbers on this page are exact.</p></section>`;
  }
  hook("act", (act, el, id) => {
    switch (act) {
      case "gp-credits": creditsSheet(); return true;
      case "gp-term-save": termSaveSheet(); return true;
      case "gp-term-add": termSheet(""); return true;
      case "gp-term": termSheet(id); return true;
      case "gp-ai": askAi(id); return true;
      case "gp-ai-more": if (window.SBCOMPTAB) SBCOMPTAB.open(""); return true;
    }
    return false;
  });
  document.addEventListener("change", e => { const t = e.target; if (t && t.id === "gpAiOk") { ui.gpAiOk = t.checked; $$('[data-act="gp-ai"]').forEach(b => { b.disabled = !t.checked; }); } });

  // Every course side by side, then the marks still to enter, then options Grades B
  const GP_CAP = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5"/><path d="M22 9v6"/></svg>';
  function gradesPage(){
    const all = grades(), s = gset();
    const waiting = tasksArr().filter(t => t.status === "done" && hasWeight(t) && !t.mark && !t.prepFor).sort(sortTasks);
    const withMarks = all.filter(gr => gr.current != null), atRisk = all.filter(gr => gr.risk).length;
    const toCome = all.reduce((n, gr) => n + gr.open.length, 0) - waiting.length;
    const S = termStats(all), avg = S.avg;
    const stat = (n, k, bad) => `<div class="gr-stat gp-tile${bad ? " gr-bad" : ""}"><span class="gr-v">${n}</span><span class="gr-k">${k}</span></div>`;
    const hero = `<div class="gp-hero-band">
        <span class="g2-ring gp-cap" aria-hidden="true">${GP_CAP}</span>
        <div class="gp-hero-t"><span class="g2-kick">${S.weighted ? "Credit-Weighted Average" : "Average Across Courses"}</span>${avg != null ? `<span class="gp-avg">${fmtP(avg)}</span><span class="gp-hero-sub">${withMarks.length} course${withMarks.length === 1 ? "" : "s"} with marks · ${atRisk ? `${atRisk} need${atRisk === 1 ? "s" : ""} attention` : "all on track"}</span>` : `<span class="gp-avg gr-none">No Marks Yet</span>`}</div>
        ${atRisk || waiting.length || toCome > 0 ? `<div class="gp-sum">${stat(atRisk, "Need attention", atRisk)}${stat(waiting.length, "Waiting for a mark")}${stat(Math.max(0, toCome), "Marks still to come")}</div>` : ""}</div>`;
    const tn = topNeed(all);
    const detailOf = gr => {
      const c = gr.c, g = gr.g;
      const tg = [["Pass", g.pass]].concat((g.scale || []).filter(x => Number(x[1]) > g.pass).map(x => [x[0], Number(x[1])]).sort((a, b) => a[1] - b[1]).slice(-4));
      if (g.goal != null && !tg.some(x => Math.abs(x[1] - g.goal) < 0.01)) tg.push(["Goal", g.goal]);
      const hold = holdOf(gr);
      if (hold && hold.th > g.pass && !tg.some(x => Math.abs(x[1] - hold.th) < 0.01)) tg.push([hold.l, hold.th]);
      tg.sort((a, b) => a[1] - b[1]);
      const want = ui.gpCalc && ui.gpCalc.cid === c.id && isNum(ui.gpCalc.t) ? ui.gpCalc.t : g.goal != null ? g.goal : hold && hold.th > g.pass && !inDanger(gr) ? hold.th : g.pass;
      const n = gr.ts.length ? gr.need(want) : null;
      const res = gr.done ? `Everything in ${esc(courseLabel(c))} is marked: final <b>${fmtP(gr.minFinal)}</b>.`
        : n == null ? "Add marks to see what you need."
        : n <= 0 ? `<span class="gp-calc-big">Secured</span><span>${fmtP(want)} is already locked in, whatever the rest brings.</span>`
        : n > 100 ? `<span class="gp-calc-big">Out of reach</span><span>The most you can still finish with is ${fmtP(gr.maxFinal)}.</span>`
        : `<span>To finish with ${fmtP(want)} you need</span><span class="gp-calc-big">${fmtP(n)}</span><span>on the remaining ${fmtW(gr.remaining)}${gr.current != null ? `. You have ${fmtP(gr.current)} so far.` : "."}</span>`;
      const calc = `<section class="gp-calc gp-d-calc"><h4 class="gp-d-h">What Do I Need?</h4>
        <div class="chips gp-calc-t" role="group" aria-label="Target">${tg.map(([k, v]) => `<button type="button" class="chip" data-act="gp-target" data-cid="${esc(c.id)}" data-id="${v}" aria-pressed="${Math.abs(v - want) < 0.01}">${esc(k)} ${r1(v)}%</button>`).join("")}</div>
        <div class="gp-calc-out" aria-live="polite">${res}</div></section>`;
      const marks = `<section class="gp-marks gp-d-marks"><h4 class="gp-d-h">Marks<span class="spacer"></span><button class="btn small" data-act="g-course-set" data-id="${esc(c.id)}">Weights</button></h4>
        ${gr.ts.length + gr.loose.length ? `<ul class="gr-work">${gradeRows(gr.ts, null, gr.dropped)}${gradeRows(gr.loose)}</ul>${gr.loose.length ? `<p class="mini" style="margin:6px 0 0">Marks with <b>No weight yet</b> are shown, not counted, until they have a weight.</p>` : ""}` : `<p class="mini" style="margin:0">No graded work yet.</p>`}
        ${gr.unlisted > 0.5 ? `<p class="mini" style="margin:8px 0 0">Only ${fmtW(gr.wAll)} of ${esc(courseLabel(c))} is listed so far. <button class="link-btn" data-act="import-syllabus" data-course="${esc(c.id)}">Import the syllabus</button> to fill in the rest.</p>` : ""}</section>`;
      return `<div class="gp-drop" id="gpd-${esc(c.id)}"${ui.gpOpen && ui.gpOpen[c.id] ? "" : " hidden"}>${marks}${calc}</div>`;
    };
    const low = tn ? `<button type="button" class="gp-need" data-act="gp-toggle" data-id="${esc(tn.gr.c.id)}"><span class="gr-k">What Do I Need?</span><span class="gp-need-t">${tn.msg}</span></button>` : "";
    const rows = all.map(gr => {
      const c = gr.c, g = gr.g, L = p => letterOf(p, g.scale), cur = gr.current != null ? clampP(gr.current) : null;
      const gg = goalGap(gr);
      return `<li class="gp-course${gr.risk ? " gr-" + gr.risk : ""}" style="--c:${esc(c.color)}">
        <button class="gp-main" data-act="g-open-course" data-id="${esc(c.id)}" aria-label="Open grades for ${esc(c.name)}">
          <span class="g2-ring gp-ring" aria-hidden="true">${courseRingHtml(c)}</span>
          <span class="gp-who"><b class="gp-name">${esc(typeof cardName === "function" ? cardName(c.name) : c.name)}</b><span class="mini">${esc(courseLabel(c))} · ${gr.ts.length ? `${fmtW(gr.wMarked)} marked` : "no graded work yet"}${gg ? ` · <b class="${gg.gap >= 0 ? "gr-ok" : ""}">${esc(gg.text)}</b>` : ""}</span></span>
          <span class="gp-bar" role="img" aria-label="${cur != null ? `Current grade ${fmtP(gr.current)}` : "No marks yet"}. Pass mark ${fmtP(g.pass)}${g.goal != null ? `, goal ${fmtP(g.goal)}` : ""}."><i class="gp-fill" style="width:${cur != null ? cur : 0}%"></i><i class="gp-pass" style="left:${clampP(g.pass)}%"></i>${g.goal != null ? `<i class="gp-goal" style="left:${clampP(g.goal)}%"></i>` : ""}</span>
          <span class="gp-grade">${gr.current != null ? `<b>${fmtP(gr.current)}</b>${L(gr.current) ? `<span class="c2-letter">${esc(L(gr.current))}</span>` : ""}` : `<span class="mini">Pass ${fmtP(g.pass)}</span>`}</span>
          <span class="gp-line mini">${esc(gradeLine(gr))}</span>${zeroed(gr) ? `<span class="gp-zero mini" role="note">${esc(ZERO_TXT)}</span>` : gr.risk ? riskPill(gr.risk) : ""}
        </button>
        <button class="icon-btn gp-tog" data-act="gp-toggle" data-id="${esc(c.id)}" aria-expanded="${!!(ui.gpOpen && ui.gpOpen[c.id])}" aria-controls="gpd-${esc(c.id)}" aria-label="Marks and What Do I Need for ${esc(c.name)}" title="Marks and What Do I Need?"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></button>
        <button class="icon-btn" data-act="g-course-set" data-id="${esc(c.id)}" aria-label="Grade settings for ${esc(c.name)}" title="Grade Settings"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/></svg></button>${detailOf(gr)}</li>`;
    }).join("");
    const wait = waiting.length ? `<h3 class="fsec">Waiting for a Mark</h3><ul class="gs-wait">${waiting.slice(0, 12).map(t => { const c = courseOf(t.courseId); return `<li style="--c:${esc(colorOf(t.courseId))}"><span class="gs-name">${esc(t.title)}<span class="mini">${c ? esc(courseLabel(c)) + ", " : ""}worth ${esc(fmtW(Number(t.weight)))}</span></span><button class="btn small" data-act="g-mark" data-id="${esc(t.id)}">Add Mark</button></li>`; }).join("")}</ul>` : "";
    return `<section class="gp" aria-label="Grades"><div class="view-head"><h2>Grades</h2>${proBtns("grades")}<button type="button" class="btn small pro-tab-btn" data-act="gp-opts" title="Default pass mark, GPA scale and other grade settings"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/></svg><span>Options</span></button></div>
      <div class="gp-hero">${hero}${gpaStrip(S)}<ul class="gp-list">${rows}</ul></div>${low}${wait}${comingUpHtml(all)}${aiHtml(all)}${histHtml(S)}
      </section>`;
  }
  document.addEventListener("change", e => { const t = e.target; if (t && t.classList && t.classList.contains("gp-calc-c")) { ui.gpCalc = {cid: t.value}; render(); } });
  hook("act", (act, el, id) => { if (act !== "gp-target") return false; ui.gpCalc = {cid: el.dataset.cid || "", t: Number(id)}; render(); return true; });
  hook("act", (act, el, id) => {
    if (act !== "gp-toggle") return false;
    ui.gpOpen = ui.gpOpen || {}; ui.gpOpen[id] = !ui.gpOpen[id];
    const d = document.getElementById("gpd-" + id), t = document.querySelector(`.gp-tog[data-id="${CSS.escape(id)}"]`);
    if (d) { d.hidden = !ui.gpOpen[id]; if (!d.hidden && el.classList.contains("gp-need")) d.scrollIntoView({behavior: "smooth", block: "nearest"}); }
    if (t) t.setAttribute("aria-expanded", String(!!ui.gpOpen[id]));
    return true;
  });
  // What-if boxes
  document.addEventListener("input", e => {
    const i = e.target, box = i && i.dataset && i.dataset.wi ? i.closest("[data-wi-course]") : null; if (!box) return;
    const cid = box.dataset.wiCourse, c = courseOf(cid); if (!c) return;
    ui.gWhatIf = ui.gWhatIf || {}; const m = ui.gWhatIf[cid] = ui.gWhatIf[cid] || {};
    const pm = parseMark(i.value);
    if (pm && Number(pm.outOf) > 0) { m[i.dataset.wi] = pm.got / pm.outOf * 100; m[i.dataset.wi + ":raw"] = i.value; i.removeAttribute("aria-invalid"); }
    else { delete m[i.dataset.wi]; delete m[i.dataset.wi + ":raw"]; if (pm === undefined) i.setAttribute("aria-invalid", "true"); else i.removeAttribute("aria-invalid"); }
    const clean = {}; Object.keys(m).forEach(k => { if (k.indexOf(":raw") < 0) clean[k] = m[k]; });
    const out = box.querySelector(".gr-wi-out"); if (out) out.innerHTML = whatIfOut(courseGrade(c), clean);
    const clr = box.querySelector('[data-act="wi-clear"]'); if (clr) clr.hidden = !Object.keys(clean).length && ![...box.querySelectorAll("[data-wi]")].some(x => x.value.trim());
  });
  const gpaOpt = () => { const v = gpaMax(); return `<div class="cap-row"><label for="gGpaIn" style="flex:1;font-weight:600">GPA Scale<span class="sub">How letter grades turn into GPA points. Off hides GPA.</span></label><select id="gGpaIn"><option value="4.0"${v === 4 ? " selected" : ""}>4.0 (A+ is 4.0)</option><option value="4.3"${v === 4.3 ? " selected" : ""}>4.3 (A+ is 4.3)</option><option value="off"${!v ? " selected" : ""}>Off</option></select></div>`; };
  document.addEventListener("change", e => { const t = e.target; if (t && t.id === "gGpaIn") { saveG({gpa: t.value}); scheduleRender(); toast(t.value === "off" ? "GPA is off" : `GPA scale set to ${t.value}`); } });
  // Grade Options, from the button at the top of the Grades page
  function gradeOptsSheet(){
    const s = gset();
    openSheet(`<div class="sheet">${head("Grade Options")}<div class="sheet-body"><div class="menu-list">
        <div class="cap-row"><label for="gPassIn" style="flex:1;font-weight:600">Default Pass Mark<span class="sub">For courses where you haven't set one. Check each course outline.</span></label><input type="number" id="gPassIn" min="0" max="100" step="0.5" value="${esc(r1(s.pass))}"> %</div>${gpaOpt()}
        <label class="mi-check gs-opt"><input type="checkbox" id="gAskIn" ${s.prompt ? "checked" : ""}><span>Ask for My Mark After I Finish Graded Work<span class="sub">A small note a few seconds later. Easy to skip.</span></span></label>
        <label class="mi-check gs-opt"><input type="checkbox" id="gRwIn" ${s.rescue ? "checked" : ""}><span>Offer Help When My Week Looks Too Full<span class="sub">A Rough Week banner on the Board</span></span></label>
        <label class="mi-check gs-opt"><input type="checkbox" id="gClsIn" ${s.cls ? "checked" : ""}><span>${esc(tr("gb.opt", "Compare My Marks to the Class"))}<span class="sub">${esc(tr("gb.opt.s", "For school-synced courses that share class averages"))}</span></span></label>
        </div></div>
      <div class="sheet-foot"><button type="button" class="btn" data-act="rw-open">Plan a Rough Week</button><span class="spacer"></span><button type="button" class="btn primary" data-act="close">Done</button></div></div>`);
    wireGradeOpts();
  }
  hook("act", act => { if (act !== "gp-opts") return false; gradeOptsSheet(); return true; });
  function wireGradeOpts(){
    const pi = $("#gPassIn"); if (!pi) return;
    pi.addEventListener("change", e => { const v = clampP(Number(e.target.value) || 0); saveG({pass: v, passSrc: "user"}); scheduleRender(); toast(`Default pass mark set to ${fmtP(v)}`); });
    $("#gAskIn").addEventListener("change", e => { saveG({prompt: e.target.checked}); toast(e.target.checked ? "Studyboard will ask for marks" : "Studyboard won't ask for marks"); });
    $("#gRwIn").addEventListener("change", e => { saveG({rescue: e.target.checked}); scheduleRender(); });
    $("#gClsIn").addEventListener("change", e => { saveG({cls: e.target.checked}); scheduleRender(); });
  }
  hook("render", tab => { if (tab === "courses" && !ui.courseId && ui.courseTab === "grades") wireGradeOpts(); });
  hook("act", (act, el, id) => {
    if (act === "wi-clear") { if (ui.gWhatIf) delete ui.gWhatIf[id]; render(); return true; }
    if (act === "course-tab") { ui.courseTab = id === "grades" || id === "lectures" ? id : ""; ui.courseTabFor = ui.courseId || null; render(); window.scrollTo(0, 0); return true; }
    return false;
  });
  hook("render", tab => {
    if (tab !== "courses" || ui.courseId) return;
    $$('.course-card[data-act="open-course"]').forEach(card => {
      const c = courseOf(card.dataset.id), body = card.querySelector(".body");
      if (!c || !body || body.querySelector(".gr-mini")) return;
      const gr = courseGrade(c); if (!gr.ts.length || gr.current == null) return;
      const cg = body.querySelector(".c2-grade");
      if (cg) { cg.classList.add("gr-mini"); if (gr.risk) cg.insertAdjacentHTML("beforeend", riskPill(gr.risk)); return; }
      const L = p => letterOf(p, gr.g.scale);
      const bits = [`Grade <b>${fmtP(gr.current)}</b>${L(gr.current) ? " " + esc(L(gr.current)) : ""}`, `${fmtW(gr.wMarked)} marked`];
      const d = document.createElement("span");
      d.className = "gr-mini" + (gr.risk ? " gr-" + gr.risk : "");
      d.innerHTML = bits.join('<span class="dot-sep" aria-hidden="true">·</span>') + (gr.risk ? riskPill(gr.risk) : "");
      const st = body.querySelector(".stats");
      st ? st.after(d) : body.appendChild(d);
    });
  });

  /* Course grade settings */
  function parseScale(txt){
    const out = [], seen = new Set();
    String(txt || "").split(/\r?\n/).forEach(line => {
      const m = /^\s*(?:grade\s*)?([A-Za-z][A-Za-z+\-]{0,3})(?=[\s:=.)\-–—\d]|$)(.*)$/i.exec(line);
      if (!m) return;
      const l = m[1].toUpperCase(), rest = m[2];
      const rg = /(\d+(?:\.\d+)?)\s*%?\s*(?:-|–|—|to)\s*(\d+(?:\.\d+)?)/i.exec(rest), pc = /(\d+(?:\.\d+)?)\s*%/.exec(rest);
      let nums = rest.match(/\d+(?:\.\d+)?/g) || []; if (nums.length > 1) nums = nums.filter(x => !/^[0-4]\.\d{1,2}$/.test(x));
      const v = /below|under|less than|</i.test(rest) && nums.length ? 0 : rg ? Math.min(Number(rg[1]), Number(rg[2])) : pc ? Number(pc[1]) : nums.length ? Number(nums[0]) : NaN;
      if (seen.has(l) || !Number.isFinite(v) || v < 0 || v > 100) return;
      seen.add(l); out.push([l, v]);
    });
    return out.length >= 2 ? out.sort((a, b) => b[1] - a[1]) : null;
  }
  // What the AI returns is only kept if it looks like a real scale
  const numberIn = (text, n) => [String(n), n.toFixed(1)].some(f => new RegExp("(^|[^0-9.])" + f.replace(".", "\\.") + "(?![0-9])").test(text));
  function cleanScale(raw, text){
    const seen = new Set(), out = [];
    (Array.isArray(raw) ? raw : []).forEach(x => {
      const l = String((x && x.letter) || "").replace(/\s+/g, "").toUpperCase(), v = Number(x && x.min);
      if (!/^[A-Z][A-Z+\-]{0,3}$/.test(l) || !Number.isFinite(v) || v < 0 || v > 100 || seen.has(l)) return;
      if (text != null && !numberIn(text, v)) return;
      seen.add(l); out.push([l, Math.round(v * 10) / 10]);
    });
    return out.length >= 2 ? out.sort((a, b) => b[1] - a[1]) : null;
  }
  const SCALE_SCHEMA = {type: "OBJECT", properties: {scale: {type: "ARRAY", items: {type: "OBJECT", properties: {letter: {type: "STRING"}, min: {type: "NUMBER", description: "The lowest percent that earns this letter"}}, required: ["letter", "min"]}}}, required: ["scale"]};
  // A screenshot or PDF needs AI
  async function readScale(src){
    const ai = aiReady(), text = src.text != null ? String(src.text) : null;
    if (src.file && !ai) throw new Error(tr("gr.sc.needAi", "Reading a screenshot needs AI. Set up AI in Settings (Gemini is free), or paste the scale as text instead."));
    if (text != null && !ai) { const r = parseScale(text); if (r) return {scale: r, how: "plain"}; throw new Error(tr("gr.sc.noRead", "Couldn't find letters and percents in that text. Try one letter per line, like A+ 90.")); }
    let part;
    if (src.file) { const sc = await aiSourceFromFile(src.file); if (!sc.part.inline_data) throw new Error(tr("gr.sc.type", "Use a screenshot (an image) or a PDF of the grade scale.")); part = sc.part; }
    else part = {text: "Grade scale text:\n" + text.slice(0, 8000)};
    try {
      const r = await aiCall({task: "photo", fast: true, maxTokens: 3000, temperature: 0, schema: SCALE_SCHEMA, parts: [part, {text: "Read the grade scale: each letter grade and the LOWEST percent that earns it."}],
        system: "You read a school's grading scale from a picture or text. Return every letter grade with the lowest percentage needed to earn it (if a range like 85-89 is given, use the lower number, 85). Keep letters exactly as written (A+, A, A-, B+ and so on). Ignore GPA points and descriptions. Do not invent letters or numbers that are not shown. Return JSON only."});
      const sc = cleanScale(r.data && r.data.scale, src.file ? null : text);
      if (sc) return {scale: sc, how: "ai"};
    } catch (e) { if (src.file || !parseScale(text)) throw e; }
    if (text != null) { const r = parseScale(text); if (r) return {scale: r, how: "plain"}; }
    throw new Error(tr("gr.sc.aiFail", "Couldn't read a grade scale from that. Make sure it shows letters with percents, or type them in the boxes."));
  }
  const hostOf = u => { try { return new URL(u).hostname.toLowerCase().replace(/^www\./, ""); } catch (e) { return ""; } };
  function schoolHosts(){
    const out = [], L = window.SBLMS; if (!L) return out;
    ["brightspace", "canvas", "blackboard"].forEach(id => {
      try {
        const x = L[id]; if (!x || !x.connected()) return;
        const c = x.cfg(); let host = String(c.host || "").trim().toLowerCase();
        if (!host && c.feed) host = hostOf(c.feed);
        host = host.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
        if (host) out.push({id, host, name: String(c.name || "").trim().slice(0, 80)});
      } catch (e) { }
    });
    return out;
  }
  // The AI answers from what it knows (web search needs paid quota on most keys)
  async function findSchool({host, name, program}){
    const text = `Learning site address: ${host || "(not given)"}.${name ? ` The student calls their school: ${name}.` : ""}${program ? ` The student's program: ${program}.` : ""}`;
    const call = () => aiCall({task: "school", auto: false, maxTokens: 3000, temperature: 0, parts: [{text}],
      system: "You know the grading rules of colleges and universities. Work out which school uses the learning site address given (or is named). Some schools give a program (a faculty, school, college or degree such as nursing, engineering or an MBA) its own letter scale or pass mark. If a program is given and you are confident that program has its own scale or pass mark, give that one and set scope to \"program\". Otherwise give the school's general undergraduate letter scale (each letter with the lowest percent that earns it) and minimum passing mark (percent), and set scope to \"school\". Only answer if you are confident the numbers are right for that school (and program). If you are not sure, answer found false. Never guess and never use another school's scale. Reply with JSON only: {\"found\": true or false, \"school\": \"the school's name\", \"scope\": \"program\" or \"school\", \"program\": \"the program the scale is for, or empty\", \"scale\": [{\"letter\": \"A+\", \"min\": 90}], \"pass\": a number or null, \"note\": \"one short sentence\"}."});
    let r;
    try { r = await call(); }
    catch (e) { if (e && (e.code === "bad" || e.code === "long")) r = await call(); else throw e; }
    return Object.assign({}, r, {recalled: true});
  }
  function vetSchool(r){
    const d = (r && r.data) || {};
    if (d.found !== true) return null;
    const scale = cleanScale(d.scale, null); if (!scale || scale.length < 3) return null;
    const pass = d.pass != null && d.pass !== "" && Number.isFinite(Number(d.pass)) && Number(d.pass) >= 0 && Number(d.pass) <= 100 ? Number(d.pass) : null;
    const prog = d.scope === "program" ? String(d.program || "").trim().slice(0, 80) : "";
    return {school: String(d.school || "").trim().slice(0, 80), scale, pass, url: "", host: "", official: false, recalled: true, scope: prog ? "program" : "school", program: prog, note: String(d.note || "").trim().slice(0, 200)};
  }
  const gsave = () => (state.settings && state.settings.grades) || {};
  const scaleRow = (l, v) => `<div class="gr-scale-row"><label><span class="sr">${esc(tr("gr.sc.letter", "Letter"))}</span><input type="text" name="sl" maxlength="4" value="${esc(l)}" placeholder="A" autocomplete="off" autocapitalize="characters" spellcheck="false" data-noenter></label><label><span class="sr">${esc(tr("gr.sc.pct", "Lowest percent"))}</span><input type="number" name="sp" min="0" max="100" step="0.5" inputmode="decimal" value="${v == null ? "" : esc(r1(v))}" placeholder="90" data-noenter></label><button type="button" class="icon-btn gr-scale-del" aria-label="${esc(tr("gr.sc.remove", "Remove this letter"))}" title="${esc(tr("gr.sc.remove", "Remove this letter"))}"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>`;
  function courseGradeSheet(id){
    const c = courseOf(id); if (!c) return;
    const g = gradingOf(c); dlg.__schoolFound = null;
    openSheet(`<form class="sheet">${head("Grade Settings")}
      <div class="sheet-body">
        <p style="margin:0"><b>${esc(c.name)}</b>${c.code ? ` <span class="mini">${esc(c.code)}</span>` : ""}</p>
        <div class="gr-passbox">
          <label class="f"><span class="lh">Pass Mark <span class="hint">% needed to pass this course</span></span><input type="number" name="pass" min="0" max="100" step="0.5" inputmode="decimal" value="${esc(r1(g.pass))}" required></label>
          <p class="mini" style="margin:0">${(c.grading || {}).passSrc === "school" && (c.grading || {}).passFrom ? `Filled in from ${esc(c.grading.passFrom)}. Change it if your course outline says otherwise; a sync won't change it back.` : (c.grading || {}).passSrc === "user" ? "You set this, so syncing with your school site won't change it." : "Many courses need a minimum grade to pass, and some need a pass on each part (like the exams). Check your course outline and set it here."}</p>
          <label class="mi-check"><input type="checkbox" name="passAll"> Use This Pass Mark for All My Courses</label>
        </div>
        <label class="f"><span class="lh">Your Goal <span class="hint">optional, the final grade you're aiming for</span></span><input type="number" name="goal" min="0" max="100" step="0.5" inputmode="decimal" value="${g.goal != null ? esc(r1(g.goal)) : ""}" placeholder="e.g. 80"></label>
        <label class="f"><span class="lh">Credits <span class="hint">optional, for your GPA and a weighted average. 0 leaves this course out</span></span><input type="number" name="credits" min="0" max="30" step="0.25" inputmode="decimal" value="${isNum(c.credits) ? esc(c.credits) : ""}" placeholder="e.g. 3"></label>
        ${rulesFields(c)}
        <div class="gr-scale">
          <span class="lh">${esc(tr("gr.sc.title", "Letter Scale"))} <span class="hint">${esc(tr("gr.sc.hint", "each letter and the lowest percent that earns it"))}</span></span>
          <div class="gr-school" id="gsSchool"></div>
          <div class="gr-import">
            <p class="mini" style="margin:0">${esc(tr("gr.sc.import", "Have your school's scale? Upload or paste a screenshot, or paste the text, and the boxes below fill in. Check them before you save."))}</p>
            <div class="gr-scale-acts"><label class="btn small gr-file">${esc(tr("gr.sc.upload", "Upload Screenshot"))}<input type="file" id="gsFile" accept="image/*,application/pdf" hidden></label><button type="button" class="btn small" id="gsPasteBtn" aria-expanded="false" aria-controls="gsPasteBox">${esc(tr("gr.sc.paste", "Paste a Scale"))}</button></div>
            <div id="gsPasteBox" hidden><label class="f"><span class="lh">${esc(tr("gr.sc.pasteLbl", "Paste the scale here"))}</span><textarea id="gsPaste" rows="5" data-noenter class="gr-scale-in" placeholder="A+ 90-100&#10;A 85-89&#10;A- 80-84"></textarea></label><button type="button" class="btn small primary" id="gsPasteGo">${esc(tr("gr.sc.read", "Read It"))}</button></div>
            <p class="status-msg" id="gsMsg" aria-live="polite" role="status"></p>
          </div>
          <div class="gr-scale-head" aria-hidden="true"><span>${esc(tr("gr.sc.letter", "Letter"))}</span><span>${esc(tr("gr.sc.pct", "Lowest percent"))}</span><span></span></div>
          <div id="gsRows" class="gr-scale-rows">${g.scale.map(x => scaleRow(x[0], Number(x[1]))).join("")}</div>
          <div class="gr-scale-acts"><button type="button" class="btn small" id="gsAdd">+ ${esc(tr("gr.sc.add", "Add a Letter"))}</button><label class="gr-preset"><span>${esc(tr("gr.sc.preset", "Standard Scale"))}</span><select id="gsPreset"><option value="">${esc(tr("gr.sc.presetPick", "Choose…"))}</option>${Object.entries(SCALES).map(([k, v]) => `<option value="${k}">${esc(v.name)}</option>`).join("")}</select></label><label class="mi-check"><input type="checkbox" name="all"${g.ownScale ? "" : " checked"}> Use This Scale for All My Courses</label></div>
        </div>
      </div>
      <div class="sheet-foot"><span class="spacer"></span><button type="button" class="btn" data-act="close">Cancel</button><button type="button" class="btn primary" data-submit>Save</button></div></form>`, fd => {
      const pass = Number(fd.get("pass")), goalS = String(fd.get("goal") || "").trim();
      if (!isNum(pass) || pass < 0 || pass > 100) { toast("Enter a pass mark between 0 and 100"); return false; }
      if (goalS && (!isNum(goalS) || Number(goalS) <= 0 || Number(goalS) > 100)) { toast("Enter a goal between 1 and 100, or leave it blank"); return false; }
      const crS = String(fd.get("credits") || "").trim();
      if (crS && (!isNum(crS) || Number(crS) < 0 || Number(crS) > 30)) { toast("Enter credits between 0 and 30, or leave it blank"); return false; }
      const rules = readRules(fd, c); if (rules === false) return false;
      const ls = fd.getAll("sl").map(x => String(x).trim().toUpperCase().replace(/\s+/g, "")), ps = fd.getAll("sp").map(x => String(x).trim());
      const scale = [], seenL = new Set();
      for (let i = 0; i < ls.length; i++) {
        if (!ls[i] && !ps[i]) continue;
        if (!/^[A-Z0-9][A-Z0-9+\-:.]{0,3}$/.test(ls[i])) { toast(tr("gr.sc.badLetter", "Each box needs a letter, like A+ or B")); return false; }
        if (!isNum(ps[i]) || Number(ps[i]) < 0 || Number(ps[i]) > 100) { toast(tr("gr.sc.badPct", "Enter a percent from 0 to 100 for {l}", {l: ls[i]})); return false; }
        if (seenL.has(ls[i])) { toast(tr("gr.sc.dup", "{l} is in the list twice", {l: ls[i]})); return false; }
        seenL.add(ls[i]); scale.push([ls[i], Number(ps[i])]);
      }
      if (scale.length < 2) { toast(tr("gr.sc.few", "Add at least two letters with their percents")); return false; }
      scale.sort((a, b) => b[1] - a[1]);
      const isDef = JSON.stringify(scale) === JSON.stringify(G_SCALE);
      const all = !!fd.get("all");
      if (all) saveG({scale: isDef ? null : scale});
      const fnd = dlg.__schoolFound;
      if (all && fnd && fnd.pass != null && Number(pass) === fnd.pass) saveG({pass: fnd.pass, school: {name: fnd.school, url: fnd.url, host: fnd.host, at: Date.now(), official: !!fnd.official, program: fnd.program || "", scope: fnd.scope || "school"}, program: dlg.__program || ""});
      const n = clone(state.courses[id]), was = (state.courses[id].grading || {});
      const mine = r1(pass) !== r1(g.pass) || was.passSrc === "user";
      if (fd.get("passAll")) {
        saveG({pass: r1(pass), passSrc: "user"});
        const chs = coursesArr().filter(x => x.id !== id).map(x => { const o = clone(x); o.grading = Object.assign({}, o.grading || {}, {pass: null, passSrc: "user", passFrom: ""}); return {kind: "course", id: x.id, after: o}; });
        n.grading = {pass: null, passSrc: "user", passFrom: "", goal: goalS ? r1(Number(goalS)) : null, scale: all || isDef ? null : scale, rules};
        n.credits = crS ? Number(crS) : null;
        applyChanges(chs.concat([{kind: "course", id, after: n}]), `Pass mark set to ${fmtP(pass)} for all your courses`);
        return;
      }
      n.grading = Object.assign({pass: r1(pass) === r1(gset().pass) && !mine ? null : r1(pass), goal: goalS ? r1(Number(goalS)) : null, scale: all || isDef ? null : scale},
        mine ? {passSrc: "user", passFrom: ""} : {passSrc: was.passSrc || "", passFrom: was.passFrom || ""}, {rules});
      n.credits = crS ? Number(crS) : null;
      applyChanges([{kind: "course", id, after: n}], "Grade settings saved");
    });
    wireScale();
    wireRules();
  }
  /* Grading rules in Grade Settings */
  const CAT_OPT = {Quiz: "Quizzes", Assignment: "Assignments", Exam: "Midterms or Tests (Never the Final)", Lab: "Labs", Project: "Projects", Reading: "Readings", Other: "Other Items"};
  const dropRow = d => `<div class="gr-drop-row"><span>Drop the Lowest</span><label><span class="sr">How many</span><input type="number" name="dn" min="1" max="20" step="1" inputmode="numeric" value="${esc(d ? d.n : 1)}" data-noenter></label><label><span class="sr">Of which type</span><select name="dc">${Object.entries(CAT_OPT).map(([k, l]) => `<option value="${k}"${d && d.cat === k ? " selected" : ""}>${esc(l)}</option>`).join("")}</select></label><button type="button" class="icon-btn gr-drop-del" aria-label="Remove this rule" title="Remove this rule"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>`;
  function rulesFields(c){
    const R = rulesOf(c), fromSyl = R.drops.some(d => d.src === "syllabus") || (R.bonus.pts > 0 && R.bonus.src === "syllabus");
    return `<fieldset class="gr-rules"><legend>Grading Rules <span class="hint">optional, from your course outline</span></legend>
      <p class="mini" style="margin:0">${fromSyl ? "Found in your syllabus. Check them against your course outline." : "If the lowest quiz or homework is dropped, or there's bonus credit, add it here and every number on the Grades page counts it."}</p>
      <div id="grDrops" class="gr-drops">${R.drops.map(dropRow).join("")}</div>
      <button type="button" class="btn small" id="grDropAdd" style="justify-self:start">+ Drop the Lowest…</button>
      <div class="gr-bonus"><label class="f"><span class="lh">Bonus Available <span class="hint">% of the final grade, like extra credit</span></span><input type="number" name="bpts" min="0" max="50" step="0.25" inputmode="decimal" value="${R.bonus.pts > 0 ? esc(r1(R.bonus.pts)) : ""}" placeholder="0"></label>
        <label class="f"><span class="lh">Bonus Earned <span class="hint">% you've earned so far</span></span><input type="number" name="bgot" min="0" max="50" step="0.25" inputmode="decimal" value="${R.bonus.got > 0 ? esc(r1(R.bonus.got)) : ""}" placeholder="0"></label></div></fieldset>`;
  }
  function wireRules(){
    const box = $("#grDrops"), add = $("#grDropAdd"); if (!box || !add) return;
    add.addEventListener("click", () => {
      const used = new Set($$('select[name="dc"]', box).map(x => x.value)), cat = Object.keys(CAT_OPT).find(k => !used.has(k));
      if (!cat) return;
      box.insertAdjacentHTML("beforeend", dropRow({n: 1, cat}));
      const i = box.querySelector(".gr-drop-row:last-child input"); if (i) i.focus();
    });
    box.addEventListener("click", e => { const b = e.target.closest(".gr-drop-del"); if (!b) return; b.closest(".gr-drop-row").remove(); add.focus(); });
  }
  // The rules from the Grade Settings form, or false after telling the student what's wrong
  function readRules(fd, c){
    const old = rulesOf(c), ns = fd.getAll("dn"), cs = fd.getAll("dc"), drops = [], seen = new Set();
    for (let i = 0; i < ns.length; i++) {
      const n = Number(ns[i]), cat = String(cs[i] || "");
      if (!Number.isInteger(n) || n < 1 || n > 20) { toast("Enter how many to drop, from 1 to 20"); return false; }
      if (seen.has(cat)) { toast(`There are two rules for ${CAT_OPT[cat] || cat}`); return false; }
      seen.add(cat);
      const was = old.drops.find(d => d.cat === cat && d.n === n);
      drops.push({cat, n, src: was ? was.src : "user"});
    }
    const bp = String(fd.get("bpts") || "").trim(), bg = String(fd.get("bgot") || "").trim();
    if ((bp && (!isNum(bp) || Number(bp) < 0 || Number(bp) > 50)) || (bg && (!isNum(bg) || Number(bg) < 0 || Number(bg) > 50))) { toast("Enter bonus points between 0 and 50"); return false; }
    const pts = bp ? Number(bp) : 0, got = bg ? Number(bg) : 0;
    if (got > pts && pts > 0) { toast("Bonus earned can't be more than the bonus available"); return false; }
    const bonus = pts > 0 || got > 0 ? {pts: Math.max(pts, got), got, src: pts === old.bonus.pts && old.bonus.src === "syllabus" ? "syllabus" : "user"} : null;
    return drops.length || bonus ? {drops, bonus} : null;
  }
  // The scale boxes
  function wireScale(){
    const rows = $("#gsRows"), msg = $("#gsMsg"), say = t => { if (msg) msg.textContent = t; };
    let dirty = false, found = null;
    const fill = sc => { rows.innerHTML = sc.map(x => scaleRow(x[0], Number(x[1]))).join(""); };
    const showPaste = () => { const b = $("#gsPasteBox"), pb = $("#gsPasteBtn"); if (b && b.hidden) { b.hidden = false; pb.setAttribute("aria-expanded", "true"); } };
    const apply = f => { dlg.__schoolFound = f; fill(f.scale); { const al = dlg.querySelector('input[name="all"]'); if (al) al.checked = true; } const pi = dlg.querySelector('input[name="pass"]'); if (f.pass != null && pi) pi.value = String(r1(f.pass)); found = f; };
    const block = $("#gsSchool");
    let prog = String(gsave().program || (window.SBAREA && SBAREA.get() ? SBAREA.get().text : "") || "").trim().slice(0, 80);
    dlg.__program = prog;
    block.addEventListener("input", e => { if (e.target.id === "gsProgram") { prog = e.target.value.trim(); dlg.__program = prog; const pg = $("#gsProgGo"); if (pg && found) pg.disabled = !prog || prog.toLowerCase() === String(found.program || "").toLowerCase(); } });
    const hosts = schoolHosts();
    const paint = () => {
      const gs = gsave(), sg = gs.suggest, sc = gs.school;
      if (found) block.innerHTML = `<p class="mini" role="status" style="margin:0">${found.official
        ? esc(tr("gr.school.official", "Found {school}'s grade scale{pass} on the school's own website. Check it matches your course outline.", {school: found.school || tr("gr.school.yours", "your school"), pass: found.pass != null ? " " + tr("gr.school.andPass", "and {p}% pass mark", {p: r1(found.pass)}) : ""}))
        : found.recalled ? esc(found.scope === "program"
          ? tr("gr.school.recalledProg", "This is the AI's best knowledge of the {program} scale at {school}. It hasn't been checked online, so compare it with your course outline before you save.", {program: found.program, school: found.school || tr("gr.school.yours", "your school")})
          : tr("gr.school.recalled", "This is the AI's best knowledge of {school}'s general scale{prog}. It hasn't been checked online, so compare it with your course outline before you save.", {school: found.school || tr("gr.school.yours", "your school"), prog: prog ? tr("gr.school.noProg", " (no separate {program} scale found)", {program: prog}) : ""}))
        : esc(tr("gr.school.unsure", "Found a scale for {school} on {host}, which isn't the school's own website. Check it carefully before you save.", {school: found.school || tr("gr.school.yours", "your school"), host: found.host}))} ${safeUrl(found.url) ? `<a href="${esc(safeUrl(found.url))}" target="_blank" rel="noopener noreferrer">${esc(found.host)}</a>` : ""}</p>`;
      else if (sg) block.innerHTML = `<p class="mini" style="margin:0">${esc(tr("gr.school.sug", "Studyboard found a grade scale for {school} on {host}. Is this your school?", {school: sg.school || tr("gr.school.yours", "your school"), host: sg.host}))}</p><div class="gr-scale-acts"><button type="button" class="btn small primary" id="gsSugYes">${esc(tr("gr.school.use", "Use It"))}</button><button type="button" class="btn small" id="gsSugNo">${esc(tr("gr.school.no", "Not My School"))}</button></div>`;
      else if (sc) block.innerHTML = `<p class="mini" style="margin:0">${esc(tr("gr.school.from", "Filled in from {school}'s own website.", {school: sc.name || tr("gr.school.yours", "your school")}))} ${safeUrl(sc.url) ? `<a href="${esc(safeUrl(sc.url))}" target="_blank" rel="noopener noreferrer">${esc(sc.host || hostOf(sc.url))}</a> ` : ""}<button type="button" class="link-btn" id="gsFind">${esc(tr("gr.school.again", "Search Again"))}</button></p>`;
      else if (hosts.length) block.innerHTML = `<p class="mini" style="margin:0">${esc(tr("gr.school.know", "Studyboard can ask the AI for the grade scale and pass mark at your school ({host}). The AI answers from memory, so check the result against your course outline.", {host: hosts[0].host}))}</p><div class="gr-scale-acts"><button type="button" class="btn small primary" id="gsFind">${esc(tr("gr.school.find", "Find My School's Scale"))}</button></div>`;
      else block.innerHTML = `<label class="f"><span class="lh">${esc(tr("gr.school.name", "Your school"))} <span class="hint">${esc(tr("gr.school.nameHint", "The AI fills in its grade scale and pass mark from what it knows"))}</span></span><input type="text" id="gsSchoolName" maxlength="80" autocomplete="off" placeholder="${esc(tr("gr.school.ph", "e.g. University of Alberta"))}" data-noenter></label><div class="gr-scale-acts"><button type="button" class="btn small primary" id="gsFind">${esc(tr("gr.school.find", "Find My School's Scale"))}</button></div>`;
      if (!sg || found) block.insertAdjacentHTML("beforeend", `<label class="f"><span class="lh">${esc(tr("gr.school.prog", "Your program"))} <span class="hint">${esc(tr("gr.school.progHint", "optional. Some programs have their own scale, and the school's is the fallback"))}</span></span><input type="text" id="gsProgram" maxlength="80" autocomplete="off" value="${esc(prog)}" placeholder="${esc(tr("gr.school.progPh", "e.g. Nursing"))}" data-noenter></label>${found ? `<div class="gr-scale-acts"><button type="button" class="btn small" id="gsProgGo" ${prog && prog.toLowerCase() !== String(found.program || "").toLowerCase() ? "" : "disabled"}>${esc(tr("gr.school.progGo", "Look Up This Program's Scale"))}</button></div>` : ""}`);
      // a program typed after a lookup: look again, for that program
      const pg = $("#gsProgGo"), pin = $("#gsProgram");
      if (pg) pg.addEventListener("click", find);
      if (pin) pin.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); if (pg && !pg.disabled) find(); else if (!found) { const fb0 = $("#gsFind"); if (fb0) fb0.click(); } } });
      const fb = $("#gsFind"); if (fb) fb.addEventListener("click", find);
      const y = $("#gsSugYes"), n = $("#gsSugNo");
      if (y) y.addEventListener("click", () => { const f = Object.assign({official: false}, sg, {official: false}); apply(f); const all = dlg.querySelector('input[name="all"]'); if (all) all.checked = true; saveG({suggest: null}); say(tr("gr.school.sugUsed", "Filled in. Check it, then save.")); paint(); });
      if (n) n.addEventListener("click", () => { saveG({suggest: null, schoolNo: true}); paint(); });
    };
    async function find(){
      const nm = $("#gsSchoolName"), name = nm ? nm.value.trim() : (found && found.school) || "";
      if (!hosts.length && !name) { say(tr("gr.school.needName", "Type your school's name first.")); if (nm) nm.focus(); return; }
      if (!aiReady()) { say(tr("gr.school.needAi", "Looking this up needs AI. Set up AI in Settings (Gemini is free), or upload a screenshot or paste the scale below.")); showPaste(); return; }
      const fb = $("#gsFind"); if (fb) fb.disabled = true;
      { const pg = $("#gsProgGo"); if (pg) pg.disabled = true; }
      say(prog ? tr("gr.school.searchingProg", "Asking the AI about the {program} grade scale at your school…", {program: prog}) : tr("gr.school.searching", "Asking the AI about your school's grade scale…"));
      try {
        const h = hosts[0] || {host: "", name: ""}, f = vetSchool(await findSchool({host: h.host, name: name || h.name, program: prog}));
        if (f) { apply(f); say(""); paint(); return; }
        say(tr("gr.school.none", "The AI isn't sure of your school's grade scale. Upload a screenshot or paste the scale below, and Studyboard will read it.")); showPaste();
      } catch (e) { say((e && e.message) || tr("gr.school.fail", "The lookup didn't work. Upload a screenshot or paste the scale below.")); showPaste(); }
      const fb2 = $("#gsFind"); if (fb2) fb2.disabled = false;
    }
    paint();
    rows.addEventListener("input", () => { dirty = true; });
    const run = async src => {
      found = null; dlg.__schoolFound = null; { const b = $("#gsSchool"); if (b && !gsave().suggest && !gsave().school) b.innerHTML = ""; }
      say(tr("gr.sc.reading", "Reading the scale…"));
      [$("#gsFile"), $("#gsPasteGo")].forEach(b => { if (b) b.disabled = true; });
      try {
        const r = await readScale(src); fill(r.scale);
        say(trn("gr.sc.done", r.scale.length, "Filled in {n} letter. Check it, then save.|Filled in {n} letters. Check them, then save.") + (r.how === "plain" ? " " + tr("gr.sc.plainNote", "(Read without AI.)") : ""));
      } catch (e) { say((e && e.message) || tr("gr.sc.aiFail", "Couldn't read a grade scale from that. Make sure it shows letters with percents, or type them in the boxes.")); }
      [$("#gsFile"), $("#gsPasteGo")].forEach(b => { if (b) b.disabled = false; });
    };
    $("#gsPreset").addEventListener("change", e => {
      const P = SCALES[e.target.value]; if (!P) return;
      dirty = true; found = null; dlg.__schoolFound = null; fill(P.scale);
      const pi = dlg.querySelector('input[name="pass"]'); if (pi) pi.value = String(passOf(P.scale));
      say(tr("gr.sc.presetDone", "Filled in the {name} scale, with a {p}% pass mark. Change any box to match your course outline.", {name: P.name, p: passOf(P.scale)}));
    });
    $("#gsAdd").addEventListener("click", () => { dirty = true; rows.insertAdjacentHTML("beforeend", scaleRow("", null)); const i = rows.querySelector(".gr-scale-row:last-child input"); if (i) i.focus(); });
    rows.addEventListener("click", e => { const b = e.target.closest(".gr-scale-del"); if (!b) return; dirty = true; const r = b.closest(".gr-scale-row"), nx = r.nextElementSibling || r.previousElementSibling; r.remove(); const f = nx ? nx.querySelector("input") : $("#gsAdd"); if (f) f.focus(); });
    $("#gsFile").addEventListener("change", e => { const f = e.target.files && e.target.files[0]; e.target.value = ""; if (f) run({file: f}); });
    const box = $("#gsPasteBox"), pb = $("#gsPasteBtn");
    pb.addEventListener("click", () => { box.hidden = !box.hidden; pb.setAttribute("aria-expanded", String(!box.hidden)); if (!box.hidden) $("#gsPaste").focus(); });
    $("#gsPasteGo").addEventListener("click", () => { const t = $("#gsPaste").value; if (!t.trim()) { say(tr("gr.sc.empty", "Paste the grade scale first.")); $("#gsPaste").focus(); return; } run({text: t}); });
    dlg.addEventListener("paste", e => {
      const it = [...((e.clipboardData && e.clipboardData.items) || [])].find(x => x.kind === "file" && /^image\//.test(x.type)); if (!it) return;
      const f = it.getAsFile(); if (f) { e.preventDefault(); run({file: f}); }
    });
  }

  /* Grades sheet (from Settings and the Courses page) */
  function gradesSheet(){
    const all = grades();
    const waiting = tasksArr().filter(t => t.status === "done" && hasWeight(t) && !t.mark && !t.prepFor).sort(sortTasks);
    const s = gset();
    const rows = all.map(gr => {
      const c = gr.c, g = gr.g, L = p => letterOf(p, g.scale);
      const line = gradeLine(gr);
      return `<li class="gs-row" style="--c:${esc(c.color)}">
        <button class="gs-main" data-act="g-open-course" data-id="${esc(c.id)}"><span class="gs-name">${esc(c.name)}${c.code ? ` <span class="mini">${esc(c.code)}</span>` : ""}</span><span class="mini">${esc(line)}</span>${gr.risk ? riskPill(gr.risk) : ""}</button>
        <span class="gs-grade">${gr.current != null ? `<b>${fmtP(gr.current)}</b><span class="mini">${esc(L(gr.current))}</span>` : `<span class="mini">Pass ${fmtP(g.pass)}</span>`}</span>
        <button class="icon-btn" data-act="g-course-set" data-id="${esc(c.id)}" aria-label="Grade settings for ${esc(c.name)}" title="Grade Settings"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/></svg></button></li>`;
    }).join("");
    openSheet(`<div class="sheet">${head("Grades")}
      <div class="sheet-body">
        <p class="mini" style="margin:0">Your grade on the work marked so far, and what you need on the rest. Tap a course for the full picture.</p>
        ${all.length ? `<ul class="gs-list">${rows}</ul>` : `<div class="empty"><strong>No Courses Yet</strong>Add your courses first.</div>`}
        ${waiting.length ? `<h3 class="fsec" style="margin:4px 0 0">Waiting for a Mark</h3><ul class="gs-wait">${waiting.slice(0, 12).map(t => { const c = courseOf(t.courseId); return `<li style="--c:${esc(colorOf(t.courseId))}"><span class="gs-name">${esc(t.title)}<span class="mini">${c ? esc(courseLabel(c)) + ", " : ""}worth ${fmtW(Number(t.weight))}</span></span><button class="btn small" data-act="g-mark" data-id="${esc(t.id)}" data-back="grades">Add Mark</button></li>`; }).join("")}</ul>` : ""}
        <h3 class="fsec" style="margin:4px 0 0">Options</h3>
        <div class="menu-list">
          <div class="cap-row"><label for="gPassIn" style="flex:1;font-weight:600">Default Pass Mark<span class="sub">For courses where you haven't set one. Check each course outline.</span></label><input type="number" id="gPassIn" min="0" max="100" step="0.5" value="${esc(r1(s.pass))}"> %</div>${gpaOpt()}
          <label class="mi-check gs-opt"><input type="checkbox" id="gAskIn" ${s.prompt ? "checked" : ""}><span>Ask for My Mark After I Finish Graded Work<span class="sub">A small note a few seconds later. Easy to skip.</span></span></label>
          <label class="mi-check gs-opt"><input type="checkbox" id="gRwIn" ${s.rescue ? "checked" : ""}><span>Offer Help When My Week Looks Too Full<span class="sub">A Rough Week banner on the Board</span></span></label>
        <label class="mi-check gs-opt"><input type="checkbox" id="gClsIn" ${s.cls ? "checked" : ""}><span>${esc(tr("gb.opt", "Compare My Marks to the Class"))}<span class="sub">${esc(tr("gb.opt.s", "For school-synced courses that share class averages"))}</span></span></label>
        </div>
      </div>
      <div class="sheet-foot"><button type="button" class="btn" data-act="rw-open">Plan a Rough Week</button><span class="spacer"></span><button type="button" class="btn primary" data-act="close">Done</button></div></div>`);
    $("#gPassIn").addEventListener("change", e => { const v = clampP(Number(e.target.value) || 0); saveG({pass: v, passSrc: "user"}); scheduleRender(); toast(`Default pass mark set to ${fmtP(v)}`); });
    $("#gAskIn").addEventListener("change", e => { saveG({prompt: e.target.checked}); toast(e.target.checked ? "Studyboard will ask for marks" : "Studyboard won't ask for marks"); });
    $("#gRwIn").addEventListener("change", e => { saveG({rescue: e.target.checked}); scheduleRender(); });
    $("#gClsIn").addEventListener("change", e => { saveG({cls: e.target.checked}); scheduleRender(); });
  }
  hook("menu", () => `<button data-act="g-grades"><span>Grades<span class="sub">Your marks, what you need on the rest, and pass marks</span></span></button>`);

  /* Today's Plan: courses near their pass mark move up a little */
  const BOOST = {risk: 1.25, out: 1.1, watch: 1.12};
  const origCF = computeFocus;
  computeFocus = function(){
    const F = origCF.apply(this, arguments);
    try { boostFocus(F); } catch(e) { console.warn("grades: focus", e); }
    return F;
  };
  function boostFocus(F){
    if (!F || !F.ranked) return;
    const risk = {}, short = {};
    coursesArr().forEach(c => { const gr = courseGrade(c); if (gr.risk) risk[c.id] = gr; else { const gs = goalShort(gr); if (gs) short[c.id] = {gr, gs}; } });
    if (!Object.keys(risk).length && !Object.keys(short).length) return;
    let any = false;
    const why0 = (x, why) => { x.reasons = (x.reasons || []).slice(); x.reasons.splice(Math.min(1, x.reasons.length), 0, why); };
    Object.values(F.info).forEach(x => {
      const t = x.t;
      if (x.dl > 21 || (x.dl < 0 && x.dead)) return;
      const gr = risk[t.courseId];
      if (gr) {
        if (!(hasWeight(t) || PTS_W[t.id]) || markPct(t) != null) return;
        // Work due now keeps its own order (what saves the most marks today), so only its reason changes
        if (!x.tier) x.score *= BOOST[gr.risk];
        x.passBoost = gr.risk; any = true;
        const np = gr.need(gr.g.pass), nm = courseLabel(gr.c);
        why0(x, gr.risk === "risk" ? `Helps you pass ${nm}: you need about ${Math.round(np)}% on what's left` : gr.risk === "watch" ? `${nm} is close to its ${r1(gr.g.pass)}% pass mark` : `Every mark counts in ${nm}`);
        return;
      }
      // Under a goal: graded work, and study sessions for a graded exam, get a smaller lift than a pass-mark risk
      const s = short[t.courseId]; if (!s) return;
      const ex = t.prepFor ? allTasks().find(y => y.id === t.prepFor) : null;
      if (!(ex ? hasWeight(ex) && markPct(ex) == null : (hasWeight(t) || PTS_W[t.id]) && markPct(t) == null)) return;
      if (!x.tier) x.score *= 1.06 + Math.min(0.12, s.gs.gap / 100);
      x.goalBoost = true; any = true;
      const nm = courseLabel(s.gr.c), goal = s.gr.g.goal;
      why0(x, s.gs.under > 0.05 ? `${nm} is ${r1(s.gs.under)} pts under your ${fmtP(goal)} target: you need about ${Math.round(s.gs.ng)}% on what's left` : `To reach your ${fmtP(goal)} target in ${nm}, you need about ${Math.round(s.gs.ng)}% on what's left`);
    });
    if (!any) return;
    F.ranked.sort((a, b) => b.score - a.score);
    if (typeof deadlineGuard === "function") { deadlineGuard(F.ranked, x => x, "score"); F.ranked.sort((a, b) => b.score - a.score); }
    const left = splitToday(F.ranked, F.th, F.th >= F.thSet - F.doneToday - 0.001);
    F.planned = F.th - Math.max(0, left);
    if (F.av) { try { F.avail = availPlan(F.av, F.ranked, F.th0, F.ranked.reduce((t, x) => t + (x.need || 0), 0), F.day, F.today, F.now, typeof nuLead === "function" ? nuLead(F) : ""); F.slotsBy = F.avail.by; if (F.avail.active) F.planned = F.avail.planned; } catch (e) { console.warn(e); } }
    F.gapWhy = planGapWhy(F);
  }
  const origFocusHtml = focusHtml;
  focusHtml = function(){
    const html = origFocusHtml.apply(this, arguments);
    const i = html.indexOf('class="plan-how"'); if (i < 0) return html;
    const j = html.indexOf("<" + "!--plan-how-end-->", i); if (j < 0) return html;
    const p = `<p><b>Pass mark check</b>: when a course is close to its pass mark (you'd need 70% or more on the rest, or you're within 5% of it), its graded work due in the next 3 weeks moves up the list, without pushing aside anything due sooner. These tasks say why. A course under its target grade gets a smaller lift the same way, study sessions for its exams included. Set pass marks under Grades in Settings, and a Target Grade on each course page.</p>`;
    return html.slice(0, j) + p + html.slice(j);
  };

  /* Rough Week Rescue */
  const RW_KEY = "studyboard:roughWeekHidden";
  const rwHidden = () => { try { return localStorage.getItem(RW_KEY) === mondayOf(todayISO()); } catch(e) { return false; } };
  function rwWindow(){
    const today = todayISO(), end = addDays(today, 6), dh = dailyHours(), th = todayHours();
    const cap = Number(state.settings.capacity) || 0, byDay = th + dh * 6;
    return {today, end, avail: cap ? Math.min(byDay, cap) : byDay, capUsed: !!cap && cap < byDay, cap, byDay};
  }
  // Hours of a task that land in the next 7 days
  function loadOf(t, w){
    if (!t || t.status === "done" || !t.due) return 0;
    const R = remainingOf(t); if (!(R > 0)) return 0;
    const dl = dayDiff(w.today, t.due);
    if (dl < 0) return t.late === "none" ? 0 : R;
    if (t.due <= w.end) return R;
    if (MILESTONE(t.type)) { const s = addDays(t.due, -7), a = s < w.today ? w.today : s; if (a > w.end) return 0; return R * (dayDiff(a, w.end) + 1) / Math.max(1, dayDiff(a, addDays(t.due, -1)) + 1); }
    const s0 = startOf(t), s = !s0 || s0 < w.today ? w.today : s0;
    if (s > w.end) return 0;
    return R * (dayDiff(s, w.end) + 1) / Math.max(1, dayDiff(s, t.due) + 1);
  }
  function rwPlan(){
    const w = rwWindow();
    const open = tasksArr().filter(t => t.status !== "done" && t.due);
    const items = open.map(t => ({t, h: loadOf(t, w)})).filter(x => x.h > 0.05).sort((a, b) => sortTasks(a.t, b.t));
    const overdue = open.filter(t => t.due < w.today && t.late !== "none").length;
    const fixed = [], sugg = [];
    items.forEach(x => {
      const t = x.t, W = hasWeight(t) ? Number(t.weight) : 0, exam = t.prepFor && state.tasks[t.prepFor];
      const fix = why => fixed.push(Object.assign({}, x, {why}));
      if (MILESTONE(t.type)) return fix(t.type === "Exam" ? "Exam date" : "Quiz date");
      if (t.due > w.end && t.status === "todo" && !blockers(t).length) {
        const ns = addDays(w.end, 1), left = dayDiff(ns, t.due);
        if (left >= 1) return sugg.push(Object.assign({}, x, {ov: {start: ns}, on: W < 15 && left >= 3, label: `Start ${fmtShort(ns)} instead`,
          note: W >= 15 ? `It isn't due until ${fmtShort(t.due)}, but it's worth ${fmtW(W)}, so only move it if next week has room.` : `It isn't due until ${fmtShort(t.due)}, so it can wait until next week.`}));
      }
      if (W >= 15) return fix(`Worth ${fmtW(W)} of your grade`);
      if (t.late === "none") return fix("No late work accepted");
      const selfSet = t.type === "Study" || t.type === "Reading" || (!W && t.type === "Other");
      if (selfSet) {
        let nd = addDays(t.due < w.today ? w.today : t.due, 7);
        if (exam && exam.status !== "done" && exam.due) { const lim = addDays(exam.due, -1); if (lim <= w.end) return fix(`Study time for ${exam.title}`); if (nd > lim) nd = lim; }
        const shift = dayDiff(t.due, nd), st = t.start ? addDays(t.start, shift) : "";
        return sugg.push(Object.assign({}, x, {ov: {due: nd, start: st && st > nd ? nd : st}, on: true, label: `Move to ${fmtShort(nd)}`,
          note: t.type === "Reading" ? "Skim it now if you have a spare moment, and read it closely next week." : t.type === "Study" ? "Study sessions you planned yourself can move." : "You set this date yourself, so it can move."}));
      }
      if (W > 0 && W <= 5 && t.due <= w.end) {
        const nd = addDays(t.due < w.today ? w.today : t.due, 3);
        return sugg.push(Object.assign({}, x, {ov: {due: nd}, on: false, label: `Hand in by ${fmtShort(nd)}`,
          note: t.late === "free" ? `Worth only ${fmtW(W)}, and late work is accepted with no penalty.` : `Worth only ${fmtW(W)}. Check the late policy with your instructor first.`}));
      }
      fix(W ? `Graded deadline, worth ${fmtW(W)}` : t.type === "Study" ? "Study session" : "Class deadline");
    });
    const heavy = items.filter(x => !MILESTONE(x.t.type) && hasWeight(x.t) && Number(x.t.weight) >= 10 && x.t.due >= w.today && x.t.due <= w.end && x.h >= 2
      && !tasksArr().some(e => e.extFor === x.t.id && e.status !== "done")).sort((a, b) => b.h - a.h)[0] || null;
    const need = items.reduce((s, x) => s + x.h, 0);
    const plan = {w, items, fixed, sugg, heavy, need, overdue, ext: false};
    plan.ext = !!heavy && after(plan) > w.avail + 0.5;
    return plan;
  }
  function after(plan){
    let h = 0;
    plan.items.forEach(x => { const s = plan.sugg.find(y => y.t.id === x.t.id); h += s && s.on ? loadOf(Object.assign(clone(x.t), s.ov), plan.w) : x.h; });
    return h + (plan.ext && plan.heavy ? 0.25 : 0);
  }
  const overloaded = plan => plan.need > plan.w.avail + 1 || plan.overdue >= 3;

  const origBoard = viewBoard;
  viewBoard = function(){
    const html = origBoard.apply(this, arguments);
    let b = "";
    try { b = rwBanner(); } catch(e) { console.warn("grades: rough week", e); }
    if (!b) return html;
    const k = html.indexOf('<div class="qa-wrap">');
    return k >= 0 ? html.slice(0, k) + b + html.slice(k) : b + html;
  };
  function rwBanner(){
    if (!gset().rescue || rwHidden() || !tasksArr().length) return "";
    const p = rwPlan();
    if (!overloaded(p)) return "";
    const over = p.need > p.w.avail + 1;
    const msg = over ? `The next 7 days hold about <b>${fmtHM(p.need)}</b> of work, and you have about <b>${fmtHM(p.w.avail)}</b> of study time.` : `You have <b>${p.overdue}</b> overdue tasks.`;
    return `<div class="rw-banner" role="region" aria-label="Rough week">
      <span class="rw-ic" aria-hidden="true"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 15a5 5 0 0 1 5-5 6 6 0 0 1 11.5 1.5A3.5 3.5 0 0 1 19 18H7a4 4 0 0 1-4-3z"/></svg></span>
      <span class="rw-txt">${msg} That's a lot. A few things can probably move.</span>
      <span class="rw-acts"><button class="btn small primary" data-act="rw-open">Rough Week? Make a Plan</button><button class="btn small" data-act="rw-hide">Not This Week</button></span></div>`;
  }

  let RW = null;
  function rwSheet(){
    RW = rwPlan();
    const p = RW, w = p.w;
    const row = (x, i, kind) => {
      const t = x.t, c = courseOf(t.courseId);
      const main = `<span class="rw-t">${esc(t.title)}${c ? ` <span class="tag">${esc(courseLabel(c))}</span>` : ""}</span>`;
      const due = t.due < w.today ? `${-dayDiff(w.today, t.due)} day${dayDiff(w.today, t.due) === -1 ? "" : "s"} overdue` : relDue(t);
      if (kind === "fixed") return `<li class="rw-row" style="--c:${esc(colorOf(t.courseId))}"><span class="rw-dot"></span><span class="rw-body">${main}<span class="mini">${esc(x.why)}. ${esc(due)}.</span></span><span class="rw-h">${fmtHM(x.h)}</span></li>`;
      return `<li class="rw-row" style="--c:${esc(colorOf(t.courseId))}"><span class="rw-dot"></span><label class="rw-pick"><input type="checkbox" data-rw="${i}" ${x.on ? "checked" : ""}><span class="rw-body">${main}<span class="rw-lab">${esc(x.label)}</span><span class="mini">${esc(x.note)}${x.ov.due ? " " + esc(due) + "." : ""}</span></span></label><span class="rw-h">${fmtHM(x.h)}</span></li>`;
    };
    const aiBit = inPreview() ? "" : aiReady() ? (() => {
      const cfg = aiCfg(), paid = !isFreeModel(cfg.provider, cfg.model);
      return `<div class="rw-ai"><div class="rw-ai-head"><button type="button" class="btn small ai-btn" id="rwAiBtn" ${paid ? "disabled" : ""}>${AI_ICON} Write a Short Plan</button><span class="mini">Optional. A few encouraging sentences about this plan.</span></div>
        ${paid ? `<label class="mi-check"><input type="checkbox" id="rwAiOk"> This uses my paid ${esc(AI_PROVIDERS[cfg.provider].short)} account (${esc(aiModelName(cfg.provider, cfg.model))}) and may cost a little money.</label>` : ""}
        <p class="rw-ai-out" id="rwAiOut" aria-live="polite" hidden></p></div>`;
    })() : `<p class="mini" style="margin:0">Want a short written plan too? Set up AI in Settings (the free Gemini key works). <button type="button" class="link-btn" data-act="ai-setup">Set Up AI</button></p>`;
    openSheet(`<div class="sheet rw-sheet">${head("Rough Week Plan")}
      <div class="sheet-body">
        <p class="rw-intro">The next 7 days hold about <b>${fmtHM(p.need)}</b> of work, and you have about <b>${fmtHM(w.avail)}</b> of study time${w.capUsed ? " (your weekly hours limit)" : ` (${fmtHM(dailyHours())} a day)`}.${p.overdue ? ` ${p.overdue} task${p.overdue === 1 ? " is" : "s are"} overdue.` : ""} ${overloaded(p) ? "Let's protect what matters most and make room." : "Your week looks manageable, but you can still lighten it."}</p>
        <h3 class="fsec rw-h3">Can't Move <span class="mini">${p.fixed.length}</span></h3>
        ${p.fixed.length ? `<ul class="rw-list">${p.fixed.map((x, i) => row(x, i, "fixed")).join("")}</ul>` : `<p class="mini" style="margin:0">Nothing fixed this week.</p>`}
        <h3 class="fsec rw-h3">Could Move Later <span class="mini">${p.sugg.length}</span></h3>
        ${p.sugg.length ? `<ul class="rw-list">${p.sugg.map((x, i) => row(x, i, "sugg")).join("")}</ul><p class="mini" style="margin:0">Ticked ones move when you apply the plan. Nothing is deleted.</p>` : `<p class="mini" style="margin:0">Everything this week has a firm date. Protect your study time for the fixed work${p.heavy ? ", and think about asking for an extension" : ""}.</p>`}
        ${p.heavy ? `<label class="rw-ext mi-check"><input type="checkbox" id="rwExt" ${p.ext ? "checked" : ""}><span><b>Add a Reminder to Ask About an Extension</b><span class="mini">For ${esc(p.heavy.t.title)} (about ${fmtHM(p.heavy.h)} left). Asking early, before it's due, usually goes best.</span></span></label>` : ""}
        <h3 class="fsec rw-h3">Your New Week</h3>
        <div id="rwAfter"></div>
        ${aiBit}
      </div>
      <div class="sheet-foot"><button type="button" class="btn" data-act="close">Cancel</button><span class="spacer"></span><button type="button" class="btn primary" id="rwApply">Apply Plan</button></div></div>`);
    const draw = () => { const el = $("#rwAfter"); if (el) el.innerHTML = rwAfterHtml(RW); const b = $("#rwApply"); if (b) b.disabled = !rwChanges(RW).length; };
    dlg.querySelectorAll("[data-rw]").forEach(cb => cb.addEventListener("change", () => { RW.sugg[Number(cb.dataset.rw)].on = cb.checked; draw(); }));
    const ext = $("#rwExt"); if (ext) ext.addEventListener("change", () => { RW.ext = ext.checked; draw(); });
    $("#rwApply").addEventListener("click", rwApply);
    const ok = $("#rwAiOk"); if (ok) ok.addEventListener("change", () => { $("#rwAiBtn").disabled = !ok.checked; });
    const ab = $("#rwAiBtn"); if (ab) ab.addEventListener("click", rwAi);
    draw();
  }
  function rwAfterHtml(p){
    const w = p.w, a = after(p), max = Math.max(p.need, a, w.avail) * 1.08 || 1;
    const meter = (lab, h) => `<div class="rw-m"><span class="rw-ml">${lab}</span><span class="rw-track"><i class="rw-fill ${h > w.avail + 0.5 ? "over" : ""}" style="width:${(h / max * 100).toFixed(1)}%"></i><i class="rw-cap" style="left:${(w.avail / max * 100).toFixed(1)}%"></i></span><b class="rw-mv">${fmtHM(h)}</b></div>`;
    const moved = new Map(p.sugg.filter(s => s.on).map(s => [s.t.id, s]));
    const days = [];
    const od = p.items.filter(x => x.t.due < w.today && !(moved.get(x.t.id) && moved.get(x.t.id).ov.due));
    if (od.length) days.push([`Overdue`, od.map(x => x.t), true]);
    for (let i = 0; i < 7; i++) {
      const d = addDays(w.today, i);
      const list = p.items.map(x => { const s = moved.get(x.t.id); return s && s.ov.due ? Object.assign({}, x.t, s.ov) : x.t; }).filter(t => t.due === d && t.status !== "done");
      if (p.ext && p.heavy && i === 0) list.unshift({title: `Talk to your instructor about an extension: ${p.heavy.t.title}`, courseId: p.heavy.t.courseId, type: "Other", _new: true});
      days.push([i === 0 ? "Today" : i === 1 ? "Tomorrow" : parse(d).toLocaleDateString(undefined, {weekday: "short", month: "short", day: "numeric"}), list, false]);
    }
    const fixedIds = new Set(p.fixed.map(x => x.t.id));
    const verdict = a <= w.avail + 0.5 ? `That fits in your ${fmtHM(w.avail)} of study time.` : `Still about ${fmtHM(a - w.avail)} more than your study time. Asking for an extension or adding a bit of study time could close the gap.`;
    return `<div class="rw-meters">${meter("Before", p.need)}${meter("After", a)}<p class="rw-legend mini"><i class="rw-capkey"></i>Your study time this week: ${fmtHM(w.avail)}. ${esc(verdict)}</p></div>
      <ul class="rw-days">${days.map(([lab, list, late]) => `<li class="${late ? "late" : ""}"><span class="rw-dl">${esc(lab)}</span><span class="rw-dt">${list.length ? list.map(t => `<span class="rw-chip ${fixedIds.has(t.id) ? "fx" : ""} ${t._new ? "nw" : ""}" style="--c:${esc(colorOf(t.courseId))}">${esc(t.title)}</span>`).join("") : `<span class="mini">Nothing due</span>`}</span></li>`).join("")}</ul>`;
  }
  function rwChanges(p){
    const ch = p.sugg.filter(s => s.on && state.tasks[s.t.id]).map(s => {
      const n = Object.assign(clone(state.tasks[s.t.id]), s.ov);
      if (n.start && n.due && n.start > n.due) n.start = n.due;
      return {kind: "task", id: n.id, after: n};
    });
    if (p.ext && p.heavy) {
      const h = p.heavy.t, tm = new Date().getHours() >= 17 ? addDays(p.w.today, 1) : p.w.today;
      const due = h.due < tm ? h.due : tm;
      const x = newTask({title: `Talk to your instructor about an extension: ${h.title}`, courseId: h.courseId, type: "Other", start: p.w.today, due, hours: 0.25, priority: "high", extFor: h.id,
        notes: `Reach out before it's due. Say briefly what's making this week hard and suggest a new date that works for you. If you're struggling more broadly, your school's student support services can help too.`});
      ch.push({kind: "task", id: x.id, after: x});
    }
    return ch;
  }
  function rwApply(){
    const p = RW; if (!p) return;
    const ch = rwChanges(p); if (!ch.length) return;
    dlg.close();
    const moved = p.sugg.filter(s => s.on).length;
    const inv = applyChanges(ch, "");
    toast(moved ? `Plan applied. ${moved} task${moved === 1 ? "" : "s"} moved to next week.` : "Plan applied", () => { applyChanges(inv, null); toast("Undone"); });
    try { localStorage.setItem(RW_KEY, mondayOf(todayISO())); } catch(e) {}
    RW = null;
  }
  async function rwAi(){
    const p = RW, btn = $("#rwAiBtn"), out = $("#rwAiOut"); if (!p || !btn || !out) return;
    const cfg = aiCfg();
    if (!isFreeModel(cfg.provider, cfg.model) && !($("#rwAiOk") && $("#rwAiOk").checked)) return;
    btn.classList.add("busy"); out.hidden = false; out.textContent = "Writing…";
    const nm = t => `${t.title}${courseOf(t.courseId) ? ` (${courseLabel(courseOf(t.courseId))})` : ""}`;
    const text = `Today: ${p.w.today}. Work in the next 7 days: about ${fmtHM(p.need)}; study time: ${fmtHM(p.w.avail)}; after this plan: ${fmtHM(after(p))}.
Can't move: ${p.fixed.map(x => `${nm(x.t)}, due ${x.t.due}, ${x.why}`).join("; ") || "nothing"}.
Moving later: ${p.sugg.filter(s => s.on).map(s => `${nm(s.t)}: ${s.label}`).join("; ") || "nothing"}.
${p.ext && p.heavy ? `Adding a reminder to ask for an extension on ${nm(p.heavy.t)}.` : ""}`;
    try {
      const r = await aiCall({task: "rewrite", fast: true, maxTokens: 1200, temperature: 0.5, schema: {type: "OBJECT", properties: {summary: {type: "STRING"}}, required: ["summary"]},
        parts: [{text}], system: "You're a kind, practical study coach for a student having a heavy week. Write 3 to 5 short sentences in plain, warm words: what to protect first, what was moved and why that's okay, and one small first step for today. No lists, no em dashes, no medical or academic-policy claims, and don't invent tasks or dates. Return JSON only."});
      const s = String((r.data || {}).summary || "").replace(/\s*[—–]\s*/g, ", ").trim();
      if (dlg.open && $("#rwAiOut")) $("#rwAiOut").textContent = s || "The AI didn't send anything back. Try again.";
    } catch(e) {
      if (dlg.open && $("#rwAiOut")) $("#rwAiOut").textContent = (e && e.message) || "Couldn't reach the AI right now. Your plan works without it.";
    } finally { const b = $("#rwAiBtn"); if (b) b.classList.remove("busy"); }
  }

  /* Clicks */
  hook("act", (act, el, id) => {
    switch (act) {
      case "g-mark": { const back = el.dataset.back === "grades" ? gradesSheet : null; markSheet(id, back); return true; }
      case "g-course-set": courseGradeSheet(id); return true;
      case "g-paste": pasteGradesSheet(id); return true;
      case "g-grades": if (dlg.open) dlg.close(); ui.tab = "courses"; ui.courseId = null; ui.courseTab = "grades"; render(); window.scrollTo(0, 0); return true;
      case "g-open-course": if (dlg.open) dlg.close(); ui.tab = "courses"; ui.courseId = id; ui.courseTab = "grades"; ui.courseTabFor = id; render(); window.scrollTo(0, 0); return true;
      case "gp-add": hidePrompt(); markSheet(id); return true;
      case "gp-close": hidePrompt(); return true;
      case "gp-off": hidePrompt(); saveG({prompt: false}); toast("Okay, no more mark reminders. You can turn them back on in Grades."); return true;
      case "rw-open": if (dlg.open) dlg.close(); setTimeout(rwSheet, 30); return true;
      case "rw-hide": try { localStorage.setItem(RW_KEY, mondayOf(todayISO())); } catch(e) {} render(); toast("Hidden until next week"); return true;
    }
    return false;
  });
  hook("boot", () => {
    if (!$("#grPrompt")) { const d = document.createElement("div"); d.id = "grPrompt"; d.className = "gr-prompt"; d.setAttribute("role", "status"); d.hidden = true; document.body.appendChild(d); }
  });

  // For tests and other modules
  window.SBGRADES.math = {courseGrade, letterOf, markPct, fmtP, gradingOf};
  window.__sbGrades = {parseMark, parseScale, cleanScale, vetSchool, schoolHosts, courseGrade: id => courseGrade(courseOf(id)), rwPlan, showPrompt,
    addTask: f => { const t = newTask(f); applyChanges([{kind: "task", id: t.id, after: t}], null); return t.id; },
    setCourse: (id, patch) => applyChanges([{kind: "course", id, after: Object.assign(clone(state.courses[id]), patch)}], null),
    setSetting: patch => { state.settings = Object.assign({}, state.settings, patch); saveSettings(); scheduleRender(); }};
})();


