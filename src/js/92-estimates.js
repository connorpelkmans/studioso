/* ===== module: 92-estimates.js ===== */
/* Quick time estimates */
var SBEST = (() => {
  const WINDOW = 14;
  const PICKS = [[0.5, "30m"], [1, "1h"], [2, "2h"], [3, "3h"], [5, "5h"]];
  const needs = t => t && t.status !== "done" && !MILESTONE(t.type) && !t.prepFor && !(isNum(t.hours) && Number(t.hours) > 0) && !!t.due;
  function list(all){
    const lim = addDays(todayISO(), WINDOW);
    return allTasks().filter(t => needs(t) && (all || t.due <= lim)).sort((a, b) => (a.due + (a.time || "")).localeCompare(b.due + (b.time || "")));
  }
  const count = () => list(false).length;
  function suggest(t){
    if (t.aiHours && Number(t.aiHours.h) > 0) return {h: Number(t.aiHours.h), ai: true};
    try { return {h: localEstimate(t).hours, ai: false}; } catch (e) { return {h: 1, ai: false}; }
  }
  const fmt = h => fmtHM(h) || (h * 60) + "m";

  /* The sheet */
  let S = null;
  function row(t){
    const c = courseOf(t.courseId), cur = S.pick[t.id], sg = S.sug[t.id] || suggest(t);
    const on = h => cur != null && Math.abs(cur - h) < 0.01;
    const custom = cur != null && !PICKS.some(([h]) => on(h));
    return `<li class="est-row${cur != null ? " set" : ""}" data-id="${esc(t.id)}" style="--c:${esc(colorOf(t.courseId))}">
      <div class="est-t"><b>${esc(t.title)}</b><span class="mini">${c ? esc(courseLabel(c)) + " · " : ""}${esc(t.type || "Task")} · ${esc(relDue(t))}</span></div>
      <div class="est-picks" role="group" aria-label="Time for ${esc(t.title)}">
        ${PICKS.map(([h, l]) => `<button type="button" class="est-pick" data-act="est-pick" data-id="${esc(t.id)}" data-h="${h}" aria-pressed="${on(h)}">${l}</button>`).join("")}
        <label class="est-own"><input type="number" min="0.25" max="200" step="0.25" inputmode="decimal" data-est-own="${esc(t.id)}" value="${custom ? esc(cur) : ""}" placeholder="h" aria-label="Hours for ${esc(t.title)}"><span>h</span></label>
      </div>
      <button type="button" class="est-sug${cur != null && Math.abs(cur - sg.h) < 0.01 ? " used" : ""}" data-act="est-pick" data-id="${esc(t.id)}" data-h="${sg.h}" title="${sg.ai ? "Suggested by " + esc(aiWho("AI")) : "Based on your past tasks, or what's typical"}">${sg.ai ? AI_ICON + " " : ""}Suggested ${esc(fmt(sg.h))}</button>
    </li>`;
  }
  function body(){
    const L = list(S.all), n = Object.keys(S.pick).filter(id => L.some(t => t.id === id)).length, more = list(true).length - list(false).length;
    return `<p style="margin:0">How long will each take? Tap a time or the suggestion. Today's Plan uses these to spread your work before each due date.</p>
      <div class="est-bar">
        <div class="segb" role="group" aria-label="Which tasks"><button type="button" data-act="est-scope" data-id="soon" aria-pressed="${!S.all}">Due in 2 Weeks</button><button type="button" data-act="est-scope" data-id="all" aria-pressed="${S.all}">All Without a Time${more > 0 ? ` (${more} more)` : ""}</button></div>
        <span class="spacer"></span>
        ${L.length ? `<button type="button" class="btn small" data-act="est-all">Use All Suggestions</button>` : ""}
        ${L.length && aiReady() ? `<button type="button" class="btn small" data-act="est-ai" ${S.busy ? "disabled" : ""}>${S.busy ? `<span class="ai-spin" aria-hidden="true"></span> ${aiWho() ? esc(aiWho()) + " is thinking…" : "Thinking…"}` : `${AI_ICON} Suggest With ${esc(aiWho("AI"))}`}</button>` : ""}
      </div>
      <p class="status-msg" id="estMsg" aria-live="polite">${esc(S.msg || "")}</p>
      ${L.length ? `<ol class="est-list">${L.map(row).join("")}</ol>` : `<p class="empty-note">${S.all ? "Every open task has a time estimate. Nice!" : "Everything due in the next 2 weeks has a time estimate."}</p>`}
      <input type="hidden" id="estCount" value="${n}">`;
  }
  function draw(keepScroll){
    const b = dlg.querySelector(".est-body"); if (!b) return;
    const top = b.scrollTop; b.innerHTML = body(); if (keepScroll) b.scrollTop = top;
    const n = Number(($("#estCount") || {}).value) || 0, save = dlg.querySelector('[data-act="est-save"]');
    if (save) { save.disabled = !n; save.textContent = n ? `Save ${n} Time${n === 1 ? "" : "s"}` : "Save"; }
    wire();
  }
  function wire(){
    dlg.querySelectorAll("[data-est-own]").forEach(inp => inp.addEventListener("input", () => {
      const v = Number(inp.value), id = inp.dataset.estOwn;
      if (v > 0 && v <= 200) S.pick[id] = Math.round(v * 4) / 4; else delete S.pick[id];
      const li = inp.closest(".est-row"); if (li) { li.classList.toggle("set", S.pick[id] != null); li.querySelectorAll(".est-pick").forEach(b => b.setAttribute("aria-pressed", "false")); }
      const n = Object.keys(S.pick).length, save = dlg.querySelector('[data-act="est-save"]'); if (save) { save.disabled = !n; save.textContent = n ? `Save ${n} Time${n === 1 ? "" : "s"}` : "Save"; }
    }));
  }
  function open(all){
    S = {all: !!all, pick: {}, sug: {}, busy: false, msg: ""};
    list(true).forEach(t => { S.sug[t.id] = suggest(t); });
    openSheet(`<div class="sheet est-sheet">${head("Estimate Times")}<div class="sheet-body est-body"></div>
      <div class="sheet-foot"><button type="button" class="btn" data-act="close">Cancel</button><span class="spacer"></span><button type="button" class="btn primary" data-act="est-save" disabled>Save</button></div></div>`);
    draw();
  }
  function save(){
    const ids = Object.keys(S.pick).filter(id => state.tasks[id]);
    if (!ids.length) return;
    const ch = ids.map(id => { const n = clone(state.tasks[id]); n.hours = S.pick[id]; return {kind: "task", id, after: n}; });
    applyChanges(ch, `Added ${ids.length} time estimate${ids.length === 1 ? "" : "s"}`);
    try { localStorage.setItem("studyboard:est:done", todayISO()); } catch (e) {}
    dlg.close();
  }
  const EST_SCHEMA_ALL = {type: "OBJECT", properties: {estimates: {type: "ARRAY", items: {type: "OBJECT", properties: {ref: {type: "STRING"}, hours: {type: "NUMBER"}}, required: ["ref", "hours"]}}}, required: ["estimates"]};
  async function aiAll(){
    const L = list(S.all).slice(0, 60); if (!L.length) return;
    const back = {}, lines = L.map((t, i) => { const r = "t" + (i + 1); back[r] = t.id; const c = courseOf(t.courseId); return `${r}: ${t.title} | ${t.type} | ${c ? c.name : "no course"} | due ${t.due}${t.weight ? ` | worth ${t.weight}%` : ""}${t.difficulty && t.difficulty !== "med" ? ` | ${DIFF_LABEL[t.difficulty]}` : ""}${t.notes ? ` | notes: ${String(t.notes).replace(/\s+/g, " ").slice(0, 160)}` : ""}`; });
    const Lr = learned(), hist = Object.entries(Lr.byType).map(([k, v]) => `${k}: ${v.length} done, typical ${fmtHM(median(v.map(x => x.h)))}`).join("; ") || "no history yet";
    S.busy = true; S.msg = ""; draw(true);
    try {
      const r = await aiCall({task: "estimate", fast: true, maxTokens: 3000, temperature: 0.2, schema: EST_SCHEMA_ALL, parts: [{text: `Tasks (ref: title | type | course | due | extra):\n${lines.join("\n")}\n\nThis student's history (focused time actually spent): ${hist}. They take about ${Lr.ratio.toFixed(2)}x their own estimates.`}],
        system: "For each task, estimate the hours of focused work it will take this student, using their history when relevant and otherwise typical times for a college student. Round to the nearest quarter hour. Return JSON only, one estimate per ref."});
      let n = 0;
      ((r.data && r.data.estimates) || []).forEach(x => { const id = back[String(x.ref || "").trim()], h = Number(x.hours); if (id && h > 0 && h <= 200) { S.sug[id] = {h: Math.max(0.25, Math.round(h * 4) / 4), ai: true}; n++; } });
      S.msg = n ? `The AI suggested times for ${n} task${n === 1 ? "" : "s"}. Tap Use All Suggestions to keep them, or pick your own.` : "The AI couldn't estimate these. The suggestions shown are from your own history.";
    } catch (e) { S.msg = (e && e.message) || "Couldn't reach the AI. The suggestions shown are from your own history."; }
    S.busy = false; draw(true);
  }
  hook("act", (a, el) => {
    if (!a || a.slice(0, 4) !== "est-") return false;
    if (a === "est-open") { if (dlg.open) dlg.close(); setTimeout(() => open(el && el.dataset.id === "all"), 30); return true; }
    if (!S) return true;
    if (a === "est-pick") { const id = el.dataset.id, h = Number(el.dataset.h); if (S.pick[id] != null && Math.abs(S.pick[id] - h) < 0.01) delete S.pick[id]; else S.pick[id] = h; draw(true); }
    else if (a === "est-scope") { S.all = el.dataset.id === "all"; draw(); }
    else if (a === "est-all") { list(S.all).forEach(t => { if (S.pick[t.id] == null) S.pick[t.id] = (S.sug[t.id] || suggest(t)).h; }); draw(true); }
    else if (a === "est-ai") aiAll();
    else if (a === "est-save") save();
    return true;
  });

  /* A small line in Today's Plan */
  hook("render", tab => {
    if (tab !== "board") return;
    const plan = document.querySelector("section.plan"); if (!plan || plan.querySelector(".plan-est")) return;
    const n = count(); if (!n) return;
    const at = plan.querySelector(".plan-fc") || plan.querySelector(".plan-notes") || plan.querySelector(".next-up");
    const html = `<div class="plan-fc plan-est"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M9.5 2.5h5"/></svg><span><b>${n}</b> task${n === 1 ? "" : "s"} due in the next 2 weeks ${n === 1 ? "has" : "have"} no time estimate</span><button class="btn small" data-act="est-open">Add Times</button></div>`;
    const extra = plan.querySelector(".pe-b");
    if (extra) extra.insertAdjacentHTML("afterbegin", html);
    else if (at) at.insertAdjacentHTML("afterend", html);
    else { const list = plan.querySelector(".plan-list"); if (list) list.insertAdjacentHTML("beforebegin", html); }
  });

  /* More for Today */
  const PE_OPEN = {};
  document.addEventListener("toggle", e => { const d = e.target; if (d && d.classList && d.classList.contains("pe-item")) PE_OPEN[d.dataset.k] = d.open; }, true);
  hook("render", tab => {
    if (tab !== "board") return;
    const body = document.querySelector("section.plan .pe-b"); if (!body || body.querySelector(".pe-item")) return;
    const titleOf = el => {
      if (el.classList.contains("plan-est")) { const n = el.querySelector("b"); const c = n ? n.textContent : ""; return ["est", "Tasks Due With No Estimate", "Estimates Needed", Number(c) || 1]; }
      if (el.classList.contains("plan-fc")) { const n = el.querySelector("b"); const c = n ? n.textContent : ""; return ["fc", "Flashcards Due for Review", "Flashcards Due", Number(c) || 1]; }
      if (el.classList.contains("pp-today")) return ["prep", "Plan My Prep", "Exam Prep", el.querySelectorAll(".pp-today-row").length || 1];
      if (el.classList.contains("plan-heads")) return ["heads", "Heads Up", "Heads Up", el.querySelectorAll("li").length || 1];
      if (el.classList.contains("auto-ins")) return ["sugg", "Suggestions", "Suggestions", el.querySelectorAll("ul > li").length || 1];
      return null;
    };
    const names = []; let total = 0;
    [...body.children].forEach(el => {
      const t = titleOf(el); if (!t) return;
      const d = document.createElement("details"); d.className = "pe-item"; d.dataset.k = t[0]; d.open = !!PE_OPEN[t[0]];
      const sm = document.createElement("summary"); sm.textContent = t[1]; { const dot = document.createElement("i"); dot.className = "pe-dot"; dot.setAttribute("aria-hidden", "true"); dot.textContent = t[3] > 99 ? "99+" : String(t[3]); sm.appendChild(dot); total += t[3]; }
      body.replaceChild(d, el); d.appendChild(sm); d.appendChild(el);
      names.push(t[2] || t[1]);
    });
    const sub = document.querySelector("section.plan .pe-s"); if (sub && names.length) sub.textContent = names.join(", ");
    const top = document.querySelector("section.plan .pe-t .pe-dot"); if (top) top.textContent = total > 99 ? "99+" : String(total || "");
  });

  /* Today's Plan tabs */
  const PT_NAME = {free: "Free Time", cal: "Calendar", est: "Estimates", fc: "Flashcards", prep: "Exam Prep", heads: "Heads Up", sugg: "Suggestions"};
  hook("render", tab => {
    if (tab !== "board") return;
    const plan = document.querySelector("section.plan"); if (!plan || plan.querySelector(".pt-bar")) return;
    const secs = [];
    const av = plan.querySelector(".av-strip"); if (av) secs.push({k: "free", n: 0, els: [av]});
    const fx = plan.querySelector(".plan-fixed"); if (fx) secs.push({k: "cal", n: fx.querySelectorAll("li").length, els: [fx]});
    const ex = plan.querySelector("#planExtra");
    const est = plan.querySelector(".plan-est"); if (est && !est.closest("#planExtra")) secs.push({k: "est", n: (est.querySelector("b") || {}).textContent || "", els: [est]});
    if (ex) ex.querySelectorAll(".pe-b > .pe-item").forEach(d => { const dot = d.querySelector("summary .pe-dot"); secs.push({k: d.dataset.k, n: dot ? dot.textContent : "", els: [...d.children].filter(c => c.tagName !== "SUMMARY")}); });
    if (!secs.length) return;
    if (!secs.some(x => x.k === ui.planTab)) ui.planTab = secs[0].k;
    const box = document.createElement("div"); box.className = "plan-tabs"; box.id = "planExtra";
    box.innerHTML = `<div class="pt-bar" role="tablist" aria-label="More for today">${secs.map(x => `<button type="button" role="tab" class="pt-tab" id="ptt-${x.k}" data-k="${x.k}" aria-controls="ptp-${x.k}" aria-selected="${x.k === ui.planTab}" tabindex="${x.k === ui.planTab ? 0 : -1}">${esc(PT_NAME[x.k] || x.k)}${x.n ? `<i class="pt-n">${esc(String(x.n))}</i>` : ""}</button>`).join("")}</div>`;
    secs.forEach(x => { const p = document.createElement("div"); p.className = "pt-panel pe-item"; p.id = "ptp-" + x.k; p.dataset.k = x.k; p.setAttribute("role", "tabpanel"); p.setAttribute("aria-labelledby", "ptt-" + x.k); p.hidden = x.k !== ui.planTab; x.els.forEach(e => p.appendChild(e)); box.appendChild(p); });
    if (ex) ex.remove();
    const foot = plan.querySelector(".plan-foot"); if (foot) foot.before(box); else plan.appendChild(box);
  });
  const ptPick = b => {
    ui.planTab = b.dataset.k;
    const box = b.closest(".plan-tabs");
    box.querySelectorAll(".pt-tab").forEach(t => { t.setAttribute("aria-selected", String(t === b)); t.tabIndex = t === b ? 0 : -1; });
    box.querySelectorAll(".pt-panel").forEach(p => { p.hidden = p.dataset.k !== ui.planTab; });
  };
  document.addEventListener("click", e => { const b = e.target.closest && e.target.closest(".pt-tab"); if (b) ptPick(b); });
  document.addEventListener("keydown", e => {
    const b = e.target.closest && e.target.closest(".pt-tab"); if (!b || !["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
    const all = [...b.parentNode.querySelectorAll(".pt-tab")], i = all.indexOf(b);
    const n = all[e.key === "Home" ? 0 : e.key === "End" ? all.length - 1 : (i + (e.key === "ArrowRight" ? 1 : -1) + all.length) % all.length];
    e.preventDefault(); ptPick(n); n.focus();
  });

  /* After a big import */
  let importT = 0, bigAt = 0;
  hook("changed", changes => {
    if (!Array.isArray(changes)) return;
    const fresh = changes.filter(c => c.kind === "task" && c.after && !c.after.hours && !MILESTONE(c.after.type) && c.after.status !== "done" && Date.now() - (Number(c.after.created) || 0) < 60000);
    if (fresh.length < 3) return;
    bigAt = Date.now();
    clearTimeout(importT);
    const compTalks = () => { try { const c = window.SBCOMP && SBCOMP.el && SBCOMP.el() && SBCOMP.settings(); return !!c && c.on !== false && c.talk !== false; } catch (e) { return false; } };
    importT = setTimeout(() => { const n = count(); if (n >= 2 && !dlg.open && !compTalks()) toast(`${n} tasks due soon don't have a time estimate yet`, null, {label: "Add Times", fn: () => open(false)}); }, 3500);
  });

  return {count, list: all => list(all).map(t => t.id), open, needs, justImported: () => Date.now() - bigAt < 30 * 60000};
})();
window.SBEST = SBEST;


