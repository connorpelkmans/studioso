/* ===== module: 98-0study-credits.js ===== */
/* Studyboard Credits: the gold coins students earn by studying, spent on companion accessories (98-companion.js, the Wardrobe).
   They're separate from Studyboard Bucks, the green bills bought with money for the Style Shop (97-credits.js).

   How many credits each kind of work earns follows how hard it is, roughly per minute of real effort:
     - Focus time       1 per 2 minutes          just keeping the timer going is the easiest
     - Flashcards       1 per 5 cards reviewed   active recall, about 10 seconds a card
     - Practice quizzes 1 per right answer, +3 for passing (70%+ of 3 or more questions), +3 more for a perfect score
     - Tasks            by type: Exam 25, Project 15, Quiz 12, Assignment and Lab 8, Reading and Study 4, Other 3;
                        a step of a broken-down task 2 (at most 10 tasks a day count, so splitting work up doesn't pay)
     - Presentations    10 for each full practice run (2 a day per presentation), +40 the first time a run lands on target

   Where they come from: everything except presentations is worked out from what's already saved (decks, quizzes, tasks, focus
   minutes), so credits sync with the rest of a student's work and include what they did before this existed. Each kind keeps
   its highest total (state.settings.sc.hw), so deleting an old deck or finished task never takes credits back. Presentations live
   on one device (99-present.js, IndexedDB), so each run's credits are written down once (sc.ev, by run id).
   Spending: sc.own {accessoryId: price}. The balance is everything earned minus everything spent, never below zero.
   Nothing here is money: it's all in the student's own synced settings. */
var SBSC = (() => {
  // The gold coin (build-resources/credits-art/credits-coin-256.png, as a 96 px WebP)
  const COIN_SRC = "data:image/webp;base64,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";
  const coin = (px = 18) => `<img class="scr-coin" src="${COIN_SRC}" width="${px}" height="${px}" alt="" aria-hidden="true">`;

  /* ---------- What each kind of work earns ---------- */
  const TASK_PTS = {Exam: 25, Project: 15, Quiz: 12, Assignment: 8, Lab: 8, Reading: 4, Study: 4, Other: 3};
  const TASK_STEP = 2, TASKS_A_DAY = 10;
  const PRES_RUN = 10, PRES_RUNS_A_DAY = 2, PRES_MASTER = 40;
  // In the order the Wardrobe lists them: [key, name, how it's earned]
  const KINDS = [
    ["focus", "Focus Time", "1 credit for every 2 minutes on the focus timer"],
    ["cards", "Flashcards", "1 credit for every 5 cards you review"],
    ["quiz", "Practice Quizzes", "1 credit for each right answer, +3 for passing (70% or more), +3 more for a perfect score"],
    ["task", "Tasks", "By how big the task is: an exam 25, a project 15, a quiz 12, an assignment or lab 8, a reading 4 (up to 10 tasks a day)"],
    ["pres", "Presentations", `${PRES_RUN} for each full practice run (2 a day per presentation), +${PRES_MASTER} the first time you finish on target`]
  ];
  const DERIVED = ["focus", "cards", "quiz", "task"];

  const sc = () => { const s = state.settings && state.settings.sc; return s && typeof s === "object" ? s : {}; };
  function setSc(patch){
    const cur = sc(), next = Object.assign({}, cur, patch);
    ["hw", "ev", "own"].forEach(k => { if (patch[k]) next[k] = Object.assign({}, cur[k], patch[k]); });
    state.settings = Object.assign({}, state.settings, {sc: next});
    saveSettings();
  }
  const dayOf = ms => { const d = new Date(Number(ms) || 0); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
  const tr = (f, dflt = 0) => { try { return f(); } catch (e) { return dflt; } };

  // What's saved now, per kind (in credits, before rounding)
  const quizPts = r => { const t = Number(r && r.total) || 0, s = Number(r && r.score) || 0; if (t < 3 || s / t < 0.7) return 0; return s + 3 + (s >= t ? 3 : 0); };
  function current(){
    const out = {focus: 0, cards: 0, quiz: 0, task: 0};
    out.focus = tr(() => (typeof SBSTATS !== "undefined" ? SBSTATS.totalFocusMinutes() : 0) / 2);
    tr(() => Object.values(state.decks || {}).forEach(d => {
      (d.cards || []).forEach(c => { out.cards += (Number(c && c.seen) || 0) / 5; });
      (d.quizzes || []).concat(...(d.aiQuizzes || []).map(q => (q && q.results) || [])).forEach(r => { out.quiz += quizPts(r); });
    }));
    tr(() => {
      // finished tasks, by the day they were finished: the biggest ones first, at most TASKS_A_DAY a day
      const per = {};
      Object.values(state.tasks || {}).forEach(t => {
        if (!t || t.status !== "done") return;
        const pts = t.breakdownOf ? TASK_STEP : TASK_PTS[t.type] || TASK_PTS.Other;
        (per[t.doneAt ? dayOf(t.doneAt) : "?"] = per[t.doneAt ? dayOf(t.doneAt) : "?"] || []).push(pts);
      });
      Object.values(per).forEach(l => { out.task += l.sort((a, b) => b - a).slice(0, TASKS_A_DAY).reduce((n, x) => n + x, 0); });
    });
    return out;
  }
  // Each kind's total: what's saved now, or the most it has ever been (so deleting old work never takes credits away)
  let cache = null, cacheAt = 0;
  function totals(){
    const now = Date.now(); if (cache && now - cacheAt < 1500) return cache;
    const cur = current(), hw = sc().hw || {}, by = {};
    DERIVED.forEach(k => { by[k] = Math.max(Number(hw[k]) || 0, cur[k] || 0); });
    by.pres = Object.entries(sc().ev || {}).reduce((n, [k, v]) => n + (/^pres:/.test(k) ? Number(v) || 0 : 0), 0);
    const earned = Math.floor(Object.values(by).reduce((n, x) => n + x, 0));
    cache = {by, cur, earned}; cacheAt = now;
    return cache;
  }
  const invalidate = () => { cache = null; };
  const spent = () => Object.values(sc().own || {}).reduce((n, v) => n + (Number(v) || 0), 0);
  const earned = fresh => { if (fresh) invalidate(); return totals().earned; };
  const balance = () => Math.max(0, earned() - spent());
  // Keep each kind's highest total in the synced settings, now and then (not on every card: a minute apart at most)
  let hwAt = 0;
  function keepHigh(force){
    if (!force && Date.now() - hwAt < 60000) return;
    const t = totals(), hw = sc().hw || {}, up = {};
    DERIVED.forEach(k => { const v = Math.floor(t.cur[k] * 10) / 10; if (v > (Number(hw[k]) || 0)) up[k] = v; });
    if (!Object.keys(up).length) return;
    hwAt = Date.now(); setSc({hw: up});
  }

  /* ---------- Spending ---------- */
  const owns = id => !!(sc().own || {})[id];
  // Pays for an accessory: true when bought (or already owned), false when there aren't enough credits
  function buy(id, price){
    price = Math.max(0, Math.round(Number(price) || 0));
    if (!id || owns(id)) return !!id;
    invalidate();
    if (balance() < price) return false;
    keepHigh(true);
    setSc({own: {[id]: price}});
    invalidate(); paintPills();
    return true;
  }

  /* ---------- Presentations: each run's credits written down once ---------- */
  hook("pr-finish", (p, run) => {
    try {
      if (!p || !run || run.sec || run.early || !run.id) return;
      const ev = sc().ev || {}, today = todayISO(), pid = String(p.id || "");
      const runsToday = Object.keys(ev).filter(k => k.indexOf(`pres:${pid}:run:${today}:`) === 0).length;
      const add = {};
      if (runsToday < PRES_RUNS_A_DAY) add[`pres:${pid}:run:${today}:${run.id}`] = PRES_RUN;
      // on target: within 10 seconds over its time goal, and not rushed (at least three quarters of it)
      const tgt = (Number(run.target) || 0) * 1000, onTarget = tgt > 0 && run.total <= tgt + 10000 && run.total >= tgt * 0.75;
      if (onTarget && !ev[`pres:${pid}:master`]) add[`pres:${pid}:master`] = PRES_MASTER;
      if (!Object.keys(add).length) return;
      setSc({ev: add}); invalidate();
      const n = Object.values(add).reduce((a, b) => a + b, 0);
      if (seenTotal != null) { seenTotal = totals().earned; lastBy = Object.assign({}, totals().by); }
      pop(n, add[`pres:${pid}:master`] ? "Presentation mastered" : "Practice run");
    } catch (e) { console.warn("study credits: presentation", e); }
  });

  /* ---------- "+12 Credits": a little coin that pops in when you've earned some ---------- */
  // Credits earned are noticed when the app draws (a moment after, so a flashcard session shows them once, at its end)
  let seenTotal = null, popT = 0, popEl = null;
  const NAMES = {focus: "Focus time", cards: "Flashcards", quiz: "Quiz passed", task: "Task done", pres: "Presentation"};
  function pop(n, why){
    n = Math.round(n); if (n < 1) return;
    try {
      // a manual popover, so it shows over an open sheet too (sheets are in the top layer)
      if (!popEl || !popEl.isConnected) { popEl = document.createElement("div"); popEl.className = "scr-pop"; popEl.setAttribute("role", "status"); popEl.setAttribute("aria-live", "polite"); if (popEl.showPopover) popEl.setAttribute("popover", "manual"); document.body.appendChild(popEl); }
      popEl.innerHTML = `${coin(26)}<span><b>+${n.toLocaleString()} Credit${n === 1 ? "" : "s"}</b>${why ? `<small>${esc(why)}</small>` : ""}</span>`;
      try { if (popEl.showPopover) { if (popEl.matches(":popover-open")) popEl.hidePopover(); popEl.showPopover(); } } catch (e) {}
      popEl.classList.remove("show"); void popEl.offsetWidth; popEl.classList.add("show");
      clearTimeout(popEl._t); popEl._t = setTimeout(() => { popEl.classList.remove("show"); setTimeout(() => { try { if (!popEl.classList.contains("show") && popEl.matches(":popover-open")) popEl.hidePopover(); } catch (e) {} }, 400); }, 3200);
    } catch (e) {}
    paintPills();
  }
  let lastBy = null;
  function notice(){
    invalidate();
    const t = totals();
    if (seenTotal == null) { seenTotal = t.earned; lastBy = Object.assign({}, t.by); return; }
    if (t.earned <= seenTotal) { if (t.earned < seenTotal) seenTotal = t.earned; return; }
    // which kind of work it came from (the one that grew the most)
    let why = "", most = 0; Object.keys(t.by).forEach(k => { const d = t.by[k] - ((lastBy || {})[k] || 0); if (d > most) { most = d; why = NAMES[k]; } });
    const gained = t.earned - seenTotal; seenTotal = t.earned; lastBy = Object.assign({}, t.by);
    // a big jump at once is work arriving from another device (or a backup), not something just done: no pop
    if (gained <= 250) pop(gained, why);
    keepHigh();
  }
  // mid-way through a flashcard session or a presentation run: wait (the session's end shows what it earned)
  const studying = () => { try { const f = ui.fc; return (ui.tab === "flashcards" && f && f.mode === "study" && Array.isArray(f.q) && !!f.q[f.i]) || !!document.getElementById("prStage"); } catch (e) { return false; } };
  function noticeSoon(){
    clearTimeout(popT);
    popT = setTimeout(() => { if (studying() || document.hidden) { noticeSoon(); return; } notice(); }, 1800);
  }
  hook("render", noticeSoon);
  hook("stats-focus", noticeSoon);
  hook("good-moment", noticeSoon);
  // the first count after start-up (and after the account's data arrives) is quiet: only new work pops
  hook("boot", () => { setTimeout(() => { invalidate(); seenTotal = totals().earned; lastBy = Object.assign({}, totals().by); keepHigh(); }, 3000); setTimeout(intro, 20000); });
  // Once per account: what's been earned so far, from studying before credits existed (after start-up's sync has settled)
  function intro(){
    try {
      if (sc().intro || document.hidden) return;
      invalidate(); const n = balance();
      setSc({intro: 1});
      if (n > 0) pop(n, "Earned by your studying so far. Spend them in your companion's Wardrobe.");
    } catch (e) {}
  }

  // Anywhere showing the balance (.scr-bal) is kept current
  function paintPills(){
    invalidate();
    const b = balance().toLocaleString();
    document.querySelectorAll("[data-scr-bal]").forEach(el => { el.textContent = b; });
  }
  const pill = () => `<span class="scr-pill" title="Studyboard Credits: earned by studying, spent on accessories">${coin(20)}<b data-scr-bal>${balance().toLocaleString()}</b><span>Credits</span></span>`;
  // How credits are earned, for the Wardrobe: each kind, how it's earned, and how many it has given so far
  function howHtml(){
    const t = totals();
    return `<ul class="scr-how">${KINDS.map(([k, n, how]) => `<li><span class="scr-how-n"><b>${esc(n)}</b><span class="mini">${esc(how)}</span></span><span class="scr-how-v" title="Earned so far">${coin(16)}${Math.floor(t.by[k] || 0).toLocaleString()}</span></li>`).join("")}</ul>`;
  }

  if (!document.getElementById("scr-css")) { const st = document.createElement("style"); st.id = "scr-css";
    st.textContent = `.scr-coin{flex:none;vertical-align:-.2em;filter:drop-shadow(0 1px 1px rgba(0,0,0,.2))}
.scr-pill{display:inline-flex;align-items:center;gap:6px;padding:4px 12px 4px 6px;border-radius:999px;border:1px solid color-mix(in srgb,#E2A82A 45%,var(--line));background:color-mix(in srgb,#F6C34A 14%,var(--surface));color:var(--ink);font:700 .9rem var(--display);white-space:nowrap}
.scr-pill > span{font-weight:600;opacity:.85}
.scr-pop{position:fixed;z-index:2147483000;inset:auto;margin:0;overflow:visible;right:16px;top:calc(env(safe-area-inset-top,0px) + 14px);display:flex;align-items:center;gap:10px;padding:8px 16px 8px 10px;border-radius:999px;background:var(--surface,#fff);color:var(--ink,#222);border:1px solid color-mix(in srgb,#E2A82A 55%,transparent);box-shadow:0 8px 24px rgba(0,0,0,.18);max-width:min(360px,calc(100vw - 32px));box-sizing:border-box;opacity:0;transform:translateY(-12px) scale(.96);pointer-events:none;transition:opacity .25s,transform .3s cubic-bezier(.2,1.4,.4,1)}
.scr-pop.show{opacity:1;transform:none}
.scr-pop span{display:grid;line-height:1.15}
.scr-pop b{font:800 1rem var(--display);color:#8A5A00}
.scr-pop small{font-size:.78rem;color:var(--muted,#666)}
:root[data-theme="dark"] .scr-pop b,.dark .scr-pop b{color:#FFD36B}
@media (prefers-reduced-motion:reduce){.scr-pop{transition:opacity .2s}}
.scr-how{list-style:none;margin:0;padding:0;display:grid;gap:8px}
.scr-how li{display:flex;align-items:center;gap:12px;padding:10px 12px;border:1px solid var(--line);border-radius:12px;background:var(--surface)}
.scr-how-n{flex:1;display:grid;gap:2px;min-width:0}
.scr-how-v{display:inline-flex;align-items:center;gap:5px;font:800 .95rem var(--display);font-variant-numeric:tabular-nums}`;
    document.head.appendChild(st); }

  return {balance, earned, spent, owns, buy, totals: () => { const t = totals(); return {by: Object.assign({}, t.by), earned: t.earned, spent: spent(), balance: balance()}; },
    kinds: () => KINDS.map(k => k.slice()), coin, coinSrc: () => COIN_SRC, pill, howHtml, paintPills, pop,
    // For tests: count again now
    refresh: () => { invalidate(); notice(); }};
})();
if (window.__SB_TEST) window.SBSC = SBSC;
