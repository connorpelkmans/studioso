/* ===== module: 98-0study-credits.js ===== */
/* Studyboard Credits: the gold coins students earn by studying, spent on companion accessories (98-companion.js, the Wardrobe).
   They're separate from Studyboard Bucks, the green bills bought with money for the Style Shop (97-credits.js).

   How many credits each kind of work earns follows how hard it is, roughly per minute of real effort:
     - Focus time       1 per 2 minutes          just keeping the timer going is the easiest (at most 3 hours a day count)
     - Flashcards       1 per 5 cards reviewed   active recall, about 10 seconds a card
     - Practice quizzes 1 per right answer, +3 for passing (70%+ of 3 or more questions), +3 more for a perfect score
     - Tasks            by type: Exam 30, Project 20, Quiz 12, Assignment and Lab 10, Reading and Study 5, Other 3;
                        a step of a broken-down task 2 (at most 8 tasks a day count, so splitting work up doesn't pay)
     - Presentations    10 for each full practice run (2 a day per presentation), +40 the first time a run lands on target

   How that meets the prices (98-companion.js PRICE: Common 100, Uncommon 200, Rare 300, Exotic 500, Legendary 1,000): a steady
   study day (a 25-minute focus session 12, 20 cards 4, a passed 10-question quiz 11, an assignment and a reading 15) is about
   40 credits. So a Common takes about 3 study days, a Rare about a week, an Exotic about two weeks and a Legendary about a month;
   a hard exam-week day (2 hours of focus, 100 cards, 3 quizzes, a few tasks) is about 130. With around 18 Legendaries, collecting
   them all takes most of a school year. The daily caps keep a timer left running or a list of tiny tasks from shortcutting that.

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
  const TASK_PTS = {Exam: 30, Project: 20, Quiz: 12, Assignment: 10, Lab: 10, Reading: 5, Study: 5, Other: 3};
  const TASK_STEP = 2, TASKS_A_DAY = 8, FOCUS_MIN_A_DAY = 180;
  // Quizzes: 1 per right answer, +3 for passing (70%+ of 3 or more questions), +3 more for a perfect score; up to 3 tries of a quiz a day
  const QUIZ_PASS = 3, QUIZ_PERFECT = 3, QUIZ_TRIES_A_DAY = 3;
  // Presentations: 2 for each slide inside its time, +15 when the whole run lands on target, +25 more the first time it does; 2 runs a day each
  const PRES_SLIDE = 2, PRES_WHOLE = 15, PRES_MASTER = 25, PRES_RUNS_A_DAY = 2;
  // In the order the Wardrobe lists them: [key, name, how it's earned]
  const KINDS = [
    ["focus", "Focus Time", "1 credit for every 2 minutes on the focus timer (up to 3 hours a day)"],
    ["cards", "Flashcards", "1 credit for every 5 cards you review"],
    ["quiz", "Practice Quizzes", "1 credit for each right answer, +3 for passing (70% or more), +3 more for a perfect score"],
    ["task", "Tasks", "By how big the task is: an exam 30, a project 20, a quiz 12, an assignment or lab 10, a reading 5 (up to 8 tasks a day)"],
    ["pres", "Presentations", `${PRES_SLIDE} for each slide inside its time, +${PRES_WHOLE} when the whole talk is on target, +${PRES_MASTER} more the first time`]
  ];
  // Worked out from saved work (focus minutes, cards reviewed, finished tasks); quizzes and presentation runs are written down as they end
  const DERIVED = ["focus", "cards", "task"];

  const sc = () => { const s = state.settings && state.settings.sc; return s && typeof s === "object" ? s : {}; };
  function setSc(patch){
    const cur = sc(), next = Object.assign({}, cur, patch);
    ["hw", "ev", "own", "evOld"].forEach(k => { if (patch[k]) next[k] = Object.assign({}, cur[k], patch[k]); });
    // events older than 45 days fold into one total per kind, so the list stays small
    const old = addDays(todayISO(), -45), ev = Object.assign({}, next.ev), fold = Object.assign({}, next.evOld);
    Object.keys(ev).forEach(k => { const m = /^(quiz|pres):(\d{4}-\d{2}-\d{2}):/.exec(k); if (m && m[2] < old) { fold[m[1]] = (Number(fold[m[1]]) || 0) + (Number(ev[k]) || 0); delete ev[k]; } });
    next.ev = ev; next.evOld = fold;
    state.settings = Object.assign({}, state.settings, {sc: next});
    saveSettings();
  }
  const dayOf = ms => { const d = new Date(Number(ms) || 0); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
  const tr = (f, dflt = 0) => { try { return f(); } catch (e) { return dflt; } };
  const taskPts = t => t.breakdownOf ? TASK_STEP : TASK_PTS[t.type] || TASK_PTS.Other;

  // What's saved now, per kind (in credits, before rounding)
  const quizPts = (right, total) => (total >= 3 && right / total >= 0.7 ? QUIZ_PASS + (right >= total ? QUIZ_PERFECT : 0) : 0) + Math.max(0, right);
  // quizzes taken before they were written down one by one (each deck keeps only its last 20 results, so they're counted once, at the start)
  const savedQuizPts = () => { let n = 0; tr(() => Object.values(state.decks || {}).forEach(d => (d.quizzes || []).forEach(r => { n += quizPts(Number(r && r.score) || 0, Number(r && r.total) || 0); }))); return n; };
  function current(){
    const out = {focus: 0, cards: 0, task: 0};
    // focus: each day's minutes up to FOCUS_MIN_A_DAY (minutes only kept on tasks, from before days were logged, count as they are)
    out.focus = tr(() => {
      if (typeof SBSTATS === "undefined") return 0;
      const days = Object.values(SBSTATS.focusDays()).map(m => Number(m) || 0), logged = days.reduce((n, m) => n + m, 0);
      const capped = days.reduce((n, m) => n + Math.min(m, FOCUS_MIN_A_DAY), 0), extra = Math.max(0, SBSTATS.totalFocusMinutes() - logged);
      return (capped + extra) / 2;
    });
    tr(() => Object.values(state.decks || {}).forEach(d => (d.cards || []).forEach(c => { out.cards += (Number(c && c.seen) || 0) / 5; })));
    tr(() => {
      // finished tasks, by the day they were finished: the biggest ones first, at most TASKS_A_DAY a day
      const per = {};
      Object.values(state.tasks || {}).forEach(t => { if (!t || t.status !== "done") return; const k = t.doneAt ? dayOf(t.doneAt) : "?"; (per[k] = per[k] || []).push(taskPts(t)); });
      Object.values(per).forEach(l => { out.task += l.sort((a, b) => b - a).slice(0, TASKS_A_DAY).reduce((n, x) => n + x, 0); });
    });
    return out;
  }
  const evSum = kind => Object.entries(sc().ev || {}).reduce((n, [k, v]) => n + (k.indexOf(kind + ":") === 0 ? Number(v) || 0 : 0), 0) + (Number((sc().evOld || {})[kind]) || 0);
  // Each kind's total: what's saved now, or the most it has ever been (so deleting old work never takes credits away)
  let cache = null, cacheAt = 0;
  function totals(){
    const now = Date.now(); if (cache && now - cacheAt < 1500) return cache;
    const cur = current(), hw = sc().hw || {}, by = {};
    DERIVED.forEach(k => { by[k] = Math.max(Number(hw[k]) || 0, cur[k] || 0); });
    by.quiz = (sc().qbase != null ? Number(sc().qbase) || 0 : Math.max(Number(hw.quiz) || 0, savedQuizPts())) + evSum("quiz");
    by.pres = evSum("pres");
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
    const patch = Object.keys(up).length ? {hw: up} : {};
    if (sc().qbase == null) patch.qbase = Math.max(Number(hw.quiz) || 0, savedQuizPts());
    if (!Object.keys(patch).length) return;
    hwAt = Date.now(); setSc(patch);
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

  /* ---------- The reward screen ----------
     At the end of a focus session, a flashcard session, a quiz, a presentation run and a finished task: the credits it earned,
     counting up in a shower of coins, line by line (what earned what), the balance going up, and a bar filling toward the next
     accessory (with Get It when it's within reach). A finished task gets a smaller card that goes away by itself. */
  let seenTotal = null, lastBy = null, doneSeen = null;
  const calm = () => { try { return matchMedia("(prefers-reduced-motion: reduce)").matches || !!(window.SBMotion && SBMotion.level() !== "full"); } catch (e) { return false; } };
  const todayN = () => { const t = sc().today; return t && t.d === todayISO() ? Number(t.n) || 0 : 0; };
  const rq = []; let rOpen = false;
  // What the credits are working toward: the cheapest accessory not owned yet (from the Wardrobe)
  const target = () => { try { const n = window.SBCOMP && SBCOMP.nextFor ? SBCOMP.nextFor() : null; return n ? Object.assign({icon: SBCOMP.propIcon ? SBCOMP.propIcon(n.id) : "", rarity: SBCOMP.rarityOf ? SBCOMP.rarityOf(n.id) : ""}, n) : null; } catch (e) { return null; } };
  // spec: {kind, kick, title, lines: [{t, n, s}], compact, sub}
  function reward(spec){
    invalidate();
    const now = totals().earned, before = seenTotal == null ? now - (spec.lines || []).reduce((a, l) => a + (l.n || 0), 0) : seenTotal;
    const gained = Math.max(0, now - before);
    seenTotal = now; lastBy = Object.assign({}, totals().by);
    keepHigh();
    const lines = (spec.lines || []).filter(l => l && (l.n || l.s));
    const sum = lines.reduce((a, l) => a + (l.n || 0), 0);
    // rounding (cards and minutes earn fractions) and daily limits: the lines always add up to what was really added
    if (lines.length === 1 && lines[0].n != null) lines[0].n = gained;
    else if (gained > sum) lines.push({t: "Other studying", n: gained - sum});
    else if (gained < sum) lines.push({t: "Over today's limit", n: gained - sum, s: "Some of it didn't count today"});
    if (!gained && !spec.showZero) return;
    if (gained) setSc({today: {d: todayISO(), n: todayN() + gained}});
    const bal = balance();
    // the first screen ever also says what studying from before credits existed has already earned (it's in the balance)
    let welcome = 0;
    if (!sc().intro) { welcome = Math.max(0, bal - gained); setSc({intro: 1}); }
    rq.push(Object.assign({}, spec, {lines, gained, bal, bal0: bal - gained, day: todayN(), tgt: target(), welcome}));
    showNext();
  }
  // browser tests see these screens only when they ask for them (credits are still counted), so older tests' clicks aren't covered
  const screensOff = () => { try { return !!window.__SB_TEST && localStorage.getItem("studyboard:rewards-test") !== "1"; } catch (e) { return false; } };
  function showNext(){
    if (screensOff()) { rq.length = 0; return; }
    if (rOpen || !rq.length) return;
    if (document.hidden) { document.addEventListener("visibilitychange", function once(){ if (!document.hidden) { document.removeEventListener("visibilitychange", once); showNext(); } }); return; }
    const r = rq.shift(); rOpen = true;
    try { (r.compact ? showCompact : showBig)(r); } catch (e) { console.warn("reward", e); rOpen = false; }
  }
  const countUp = (el, from, to, ms, done) => {
    if (!el) return; if (calm() || to === from) { el.textContent = to.toLocaleString(); if (done) done(); return; }
    const t0 = performance.now();
    const step = now => { if (!el.isConnected) return; const f = Math.min(1, (now - t0) / ms), e = 1 - Math.pow(1 - f, 3); el.textContent = Math.round(from + (to - from) * e).toLocaleString(); if (f < 1) requestAnimationFrame(step); else if (done) done(); };
    requestAnimationFrame(step);
  };
  const ICON = {focus: '<path d="M12 7v5l3 2"/><circle cx="12" cy="12" r="8.5"/>', cards: '<rect x="3" y="6" width="14" height="12" rx="2"/><path d="M7 3h12a2 2 0 0 1 2 2v10"/>',
    quiz: '<path d="M9 9a3 3 0 1 1 4 2.8c-.7.3-1 .9-1 1.7V15"/><circle cx="12" cy="18.5" r=".6"/><circle cx="12" cy="12" r="9.5"/>', task: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    pres: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M12 16v4M8 20h8"/>', hello: '<path d="M12 3l2.6 5.6L20 9.4l-4 4.1.9 5.8L12 16.6 7.1 19.3l.9-5.8-4-4.1 5.4-.8z"/>'};
  const icon = k => `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[k] || ICON.hello}</svg>`;
  const goalHtml = r => {
    const g = r.tgt; if (!g) return "";
    const p0 = Math.min(1, r.bal0 / g.price), p1 = Math.min(1, r.bal / g.price), ready = r.bal >= g.price;
    return `<div class="scr-goal${ready ? " ready" : ""}" data-p0="${p0}" data-p1="${p1}">
      <span class="scr-goal-ic cp-r-${esc(g.rarity || "common")}" aria-hidden="true">${g.icon || ""}</span>
      <span class="scr-goal-t"><b>${esc(g.name)}</b><span class="scr-goal-bar"><i style="width:${Math.round(p0 * 100)}%"></i></span>
        <span class="mini">${ready ? "You can buy it now!" : `${(g.price - r.bal).toLocaleString()} more credits`}</span></span>
      ${ready ? `<button type="button" class="btn small scr-goal-go" data-scr="wardrobe">Get It</button>` : ""}</div>`;
  };
  function showBig(r){
    const still = calm(), o = document.createElement("div");
    o.className = "scr-rw scr-k-" + r.kind + (still ? " scr-still" : ""); o.setAttribute("role", "dialog"); o.setAttribute("aria-modal", "true"); o.setAttribute("aria-labelledby", "scrRwT");
    if (o.showPopover) o.setAttribute("popover", "manual");
    const rain = still ? "" : Array.from({length: 16}, (_, i) => `<img class="scr-drop" src="${COIN_SRC}" alt="" style="left:${(i * 61 + 7) % 100}%;animation-delay:${(i * 0.137 % 1.1).toFixed(2)}s;width:${18 + (i * 7) % 16}px">`).join("");
    o.innerHTML = `<div class="scr-dim"></div><div class="scr-rain" aria-hidden="true">${rain}</div><div class="scr-card">
      <div class="scr-head"><span class="scr-kick">${icon(r.kind)}${esc(r.kick || "Nice Work!")}</span><h2 id="scrRwT">${esc(r.title || "")}</h2></div>
      <div class="scr-big" aria-live="polite"><span class="scr-big-coin"><img src="${COIN_SRC}" alt="" width="84" height="84"><i class="scr-shine"></i></span>
        <span class="scr-big-n">+<b data-n>${still ? r.gained.toLocaleString() : "0"}</b></span><span class="scr-big-l">Credits</span></div>
      ${r.welcome ? `<p class="scr-welcome"><b>Welcome to Studyboard Credits!</b> Your studying before today already earned you ${coin(16)}<b>${r.welcome.toLocaleString()}</b>. Spend them on accessories for your companion.</p>` : ""}
      <ul class="scr-lines">${r.lines.map((l, i) => `<li style="--d:${0.55 + i * 0.28}s"><span><b>${esc(l.t)}</b>${l.s ? `<span class="mini">${esc(l.s)}</span>` : ""}</span><em class="${(l.n || 0) < 0 ? "neg" : ""}">${(l.n || 0) < 0 ? "" : "+"}${(l.n || 0).toLocaleString()}</em></li>`).join("")}</ul>
      <div class="scr-stats"><span>Balance <b>${coin(16)}<span data-bal>${r.bal0.toLocaleString()}</span></b></span><span>Today <b>+${r.day.toLocaleString()}</b></span></div>
      ${goalHtml(r)}
      <div class="scr-acts"><button type="button" class="btn primary scr-go" data-scr="ok">Collect</button></div></div>`;
    document.body.appendChild(o);
    try { if (o.showPopover) o.showPopover(); } catch (e) {}
    try { if (typeof sbHaptic === "function") sbHaptic("success", {force: true}); } catch (e) {}
    const big = o.querySelector("[data-n]"), balEl = o.querySelector("[data-bal]");
    const tickAt = 0.55 + r.lines.length * 0.28;
    setTimeout(() => countUp(big, 0, r.gained, Math.min(1600, 500 + r.gained * 25), () => { o.classList.add("scr-landed"); try { if (typeof sbHaptic === "function") sbHaptic("tap"); } catch (e) {} }), still ? 0 : 350);
    setTimeout(() => { countUp(balEl, r.bal0, r.bal, 900); const gb = o.querySelector(".scr-goal-bar i"), g = o.querySelector(".scr-goal"); if (gb && g) gb.style.width = Math.round(Number(g.dataset.p1) * 100) + "%"; if (g && g.classList.contains("ready")) setTimeout(() => g.classList.add("pop"), 700); }, still ? 0 : tickAt * 1000 + 200);
    const back = document.activeElement;
    setTimeout(() => { const b = o.querySelector(".scr-go"); if (b) try { b.focus({preventScroll: true}); } catch (e) {} }, 80);
    let closed = false;
    const close = go => {
      if (closed) return; closed = true; o.classList.add("scr-out");
      setTimeout(() => { try { if (o.hidePopover && o.matches(":popover-open")) o.hidePopover(); } catch (e) {} o.remove(); rOpen = false; paintPills(); setTimeout(showNext, 250); if (go) openWardrobe(); }, still ? 0 : 240);
      try { if (!go && back && back.isConnected && back.focus) back.focus({preventScroll: true}); } catch (e) {}
    };
    o.addEventListener("click", e => { const b = e.target.closest && e.target.closest("[data-scr]"); if (b) close(b.dataset.scr === "wardrobe"); else if (e.target.classList && e.target.classList.contains("scr-dim")) close(false); });
    o.addEventListener("keydown", e => { if (e.key === "Escape") { e.preventDefault(); close(false); } if (e.key === "Tab") { const bs = [...o.querySelectorAll("button")], i = bs.indexOf(document.activeElement); e.preventDefault(); const n = bs[(i + (e.shiftKey ? -1 : 1) + bs.length) % bs.length]; if (n) n.focus(); } });
  }
  // A finished task: a smaller card near the bottom that counts up and goes away by itself (tap it to close sooner)
  function showCompact(r){
    const still = calm(), o = document.createElement("div");
    o.className = "scr-mini scr-k-" + r.kind + (still ? " scr-still" : ""); o.setAttribute("role", "status"); o.setAttribute("aria-live", "polite");
    if (o.showPopover) o.setAttribute("popover", "manual");
    const g = r.tgt, p0 = g ? Math.min(1, r.bal0 / g.price) : 0, p1 = g ? Math.min(1, r.bal / g.price) : 0;
    o.innerHTML = `<span class="scr-mini-coin"><img src="${COIN_SRC}" alt="" width="44" height="44"></span>
      <span class="scr-mini-t"><span class="scr-mini-k">${esc(r.kick || "Task Done")}</span><b>+<span data-n>${still ? r.gained : 0}</span> Credits</b><span class="mini">${esc(r.title || "")}</span>
      ${g ? `<span class="scr-mini-goal"><span class="scr-goal-bar"><i style="width:${Math.round(p0 * 100)}%"></i></span><span class="mini">${r.bal >= g.price ? `${esc(g.name)}: ready to buy!` : `${(g.price - r.bal).toLocaleString()} to ${esc(g.name)}`}</span></span>` : ""}</span>`;
    document.body.appendChild(o);
    try { if (o.showPopover) o.showPopover(); } catch (e) {}
    requestAnimationFrame(() => o.classList.add("show"));
    try { if (typeof sbHaptic === "function") sbHaptic("success"); } catch (e) {}
    setTimeout(() => { countUp(o.querySelector("[data-n]"), 0, r.gained, 600); const b = o.querySelector(".scr-goal-bar i"); if (b) b.style.width = Math.round(p1 * 100) + "%"; }, still ? 0 : 250);
    let closed = false;
    const close = () => { if (closed) return; closed = true; o.classList.remove("show"); setTimeout(() => { try { if (o.hidePopover && o.matches(":popover-open")) o.hidePopover(); } catch (e) {} o.remove(); rOpen = false; paintPills(); setTimeout(showNext, 200); }, still ? 0 : 300); };
    o.addEventListener("click", close);
    setTimeout(close, 3600);
  }
  function openWardrobe(){
    try { if (window.SBCOMP && SBCOMP.open) SBCOMP.open(); setTimeout(() => { const h = document.querySelector(".cp-acc-h"); if (h) h.scrollIntoView({block: "start"}); }, 120); } catch (e) {}
  }

  /* ---------- Each kind of work's ending ---------- */
  // Focus: when a focus session ends (SBSTATS has logged its minutes by then)
  hook("focus", e => {
    if (!e || e.type !== "end" || e.mode !== "focus" || !e.minutes) return;
    setTimeout(() => {
      const m = Math.round(e.minutes), today = tr(() => Number(SBSTATS.focusDays()[todayISO()]) || 0);
      reward({kind: "focus", kick: "Focus Session Done", title: `${m} minute${m === 1 ? "" : "s"} of focus`,
        lines: [{t: `${m} focused minute${m === 1 ? "" : "s"}`, n: 0, s: today > FOCUS_MIN_A_DAY ? "Past 3 hours today, so not all of it counted" : "1 credit for every 2 minutes"}]});
    }, 60);
  });
  // Flashcards: at the Session Done screen (01-flashcards.js)
  function cardsDone(n){
    n = Math.max(0, Math.round(Number(n) || 0)); if (!n) return;
    reward({kind: "cards", kick: "Study Session Done", title: `${n} card${n === 1 ? "" : "s"} reviewed`, lines: [{t: `${n} card${n === 1 ? "" : "s"} reviewed`, n: 0, s: "1 credit for every 5 cards"}]});
  }
  // A quiz (a deck quiz or an AI practice quiz): written down once, then its screen
  function quizDone(right, total, key){
    right = Math.max(0, Math.round(Number(right) || 0)); total = Math.max(0, Math.round(Number(total) || 0)); if (!total) return;
    const day = todayISO(), id = String(key || "quiz").replace(/:/g, "_"), ev = sc().ev || {};
    const tries = Object.keys(ev).filter(k => k.indexOf(`quiz:${day}:${id}:`) === 0).length;
    const pass = total >= 3 && right / total >= 0.7, perfect = pass && right >= total;
    const lines = tries >= QUIZ_TRIES_A_DAY ? [] : [{t: `${right} of ${total} right`, n: right, s: "1 credit for each right answer"}].concat(pass ? [{t: "Passed", n: QUIZ_PASS, s: "70% or more"}] : [], perfect ? [{t: "Perfect score!", n: QUIZ_PERFECT}] : []);
    const pts = lines.reduce((a, l) => a + l.n, 0);
    // quizzes from before are counted once (qbase); this one is already in the decks' saved results, so it's left out of that
    if (sc().qbase == null) setSc({qbase: Math.max(Number((sc().hw || {}).quiz) || 0, savedQuizPts() - quizPts(right, total))});
    if (pts) { setSc({ev: {[`quiz:${day}:${id}:${uid()}`]: pts}}); invalidate(); }
    reward({kind: "quiz", kick: perfect ? "Perfect Quiz!" : pass ? "Quiz Passed!" : "Quiz Done", title: `${total} question${total === 1 ? "" : "s"}`,
      lines: tries >= QUIZ_TRIES_A_DAY ? [{t: "No credits this time", n: 0, s: `This quiz has earned credits ${QUIZ_TRIES_A_DAY} times today. Try another, or come back tomorrow.`}] : lines, showZero: true});
  }
  // Presentations: each slide inside its time, and the whole talk on target (99-present.js, on a finished run)
  hook("pr-finish", (p, run) => {
    try {
      if (!p || !run || run.early || !run.id || !Array.isArray(run.times)) return;
      const ev = sc().ev || {}, day = todayISO(), pid = String(p.id || "").replace(/:/g, "_");
      const runsToday = Object.keys(ev).filter(k => k.indexOf(`pres:${day}:${pid}:`) === 0).length;
      const idx = run.sec ? Array.from({length: run.sec[1] - run.sec[0] + 1}, (_, k) => run.sec[0] + k) : run.times.map((_, k) => k);
      // a slide is inside its time when it ran no more than a little over (99-present.js's own "ok": 17% or 3 seconds)
      const ok = idx.filter(k => { const t = Number(run.times[k]) || 0, b = Number((run.budgets || [])[k]) || 0; return b > 0 && t > 0 && (t <= b * 1.17 || t - b <= 3000); }).length;
      const tgt = (Number(run.target) || 0) * 1000, whole = !run.sec && tgt > 0 && run.total <= tgt + 10000 && run.total >= tgt * 0.75;
      const first = whole && !ev[`pres:master:${pid}`] && !Object.keys(ev).some(k => k === `pres:${pid}:master`);
      const lines = runsToday >= PRES_RUNS_A_DAY ? [] : [{t: `${ok} of ${idx.length} slide${idx.length === 1 ? "" : "s"} on time`, n: ok * PRES_SLIDE, s: `${PRES_SLIDE} credits a slide`}]
        .concat(whole ? [{t: "Whole talk on target", n: PRES_WHOLE, s: "Within your time goal"}] : [], first ? [{t: "Mastered!", n: PRES_MASTER, s: "The first time on target"}] : []);
      const add = {}, pts = lines.reduce((a, l) => a + l.n, 0);
      if (pts) add[`pres:${day}:${pid}:${run.id}`] = pts - (first ? PRES_MASTER : 0);
      if (first) add[`pres:master:${pid}`] = PRES_MASTER;
      if (Object.keys(add).length) { setSc({ev: add}); invalidate(); }
      reward({kind: "pres", kick: first ? "Presentation Mastered!" : whole ? "Right on Time!" : "Practice Run Done", title: p.name || "Presentation",
        lines: runsToday >= PRES_RUNS_A_DAY ? [{t: "No credits this time", n: 0, s: `This presentation has earned credits ${PRES_RUNS_A_DAY} times today. Come back tomorrow!`}] : lines, showZero: true});
    } catch (e) { console.warn("study credits: presentation", e); }
  });
  // Tasks (from anywhere: the board, the chat, a widget): noticed when the app draws, with each newly finished task named
  const doneNow = () => { const m = {}; Object.values(state.tasks || {}).forEach(t => { if (t && t.status === "done") m[t.id] = t; }); return m; };
  function notice(){
    invalidate();
    const t = totals(), done = doneNow();
    if (seenTotal == null) { seenTotal = t.earned; lastBy = Object.assign({}, t.by); doneSeen = done; return; }
    const fresh = Object.values(done).filter(x => doneSeen && !doneSeen[x.id] && x.doneAt && Date.now() - x.doneAt < 120000);
    doneSeen = done;
    if (t.earned <= seenTotal) { if (t.earned < seenTotal) seenTotal = t.earned; return; }
    const gained = t.earned - seenTotal;
    // a big jump at once is work arriving from another device (or a backup), not something just done: counted quietly
    if (gained > 250 && !fresh.length) { seenTotal = t.earned; lastBy = Object.assign({}, t.by); paintPills(); keepHigh(); return; }
    if (fresh.length) {
      const top = fresh.slice(0, 3);
      reward({kind: "task", compact: true, kick: fresh.length === 1 ? `${fresh[0].type || "Task"} Done` : `${fresh.length} Tasks Done`, title: top.map(x => x.title).join(", ") + (fresh.length > 3 ? "…" : ""),
        lines: top.map(x => ({t: x.title, n: taskPts(x)}))});
      return;
    }
    reward({kind: "hello", compact: true, kick: "Credits Earned", title: "From your studying", lines: [{t: "Studying", n: gained}]});
  }
  // mid-way through a flashcard session, a quiz or a presentation run: wait (its own screen comes at the end)
  const studying = () => { try { const f = ui.fc; return (ui.tab === "flashcards" && f && (f.mode === "study" || f.mode === "quiz") && Array.isArray(f.q || f.qs) && !!(f.q || f.qs)[f.i]) || !!document.getElementById("prStage"); } catch (e) { return false; } };
  let noticeT = 0;
  function noticeSoon(){
    clearTimeout(noticeT);
    noticeT = setTimeout(() => { if (studying() || document.hidden || rOpen) { noticeSoon(); return; } notice(); }, 1200);
  }
  hook("render", noticeSoon);
  // the first count after start-up (and after the account's data arrives) is quiet: only new work is shown
  hook("boot", () => { setTimeout(() => { invalidate(); seenTotal = totals().earned; lastBy = Object.assign({}, totals().by); doneSeen = doneNow(); keepHigh(); }, 3000); });
  // A little "+12 Credits" pop (kept for other parts of the app)
  function pop(n, why){ n = Math.round(n); if (n < 1) return; rq.push({kind: "hello", compact: true, kick: "Credits Earned", title: why || "", lines: [], gained: n, bal: balance(), bal0: balance() - n, day: todayN(), tgt: target()}); showNext(); }

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
    return `<p class="mini scr-how-day">A steady study day (a 25-minute focus session, 20 flashcards, a practice quiz and a couple of tasks) earns about 40 credits: a Common in about 3 days, a Legendary in about a month.</p><ul class="scr-how">${KINDS.map(([k, n, how]) => `<li><span class="scr-how-n"><b>${esc(n)}</b><span class="mini">${esc(how)}</span></span><span class="scr-how-v" title="Earned so far">${coin(16)}${Math.floor(t.by[k] || 0).toLocaleString()}</span></li>`).join("")}</ul>`;
  }

  return {balance, earned, spent, owns, buy, totals: () => { const t = totals(); return {by: Object.assign({}, t.by), earned: t.earned, spent: spent(), balance: balance()}; },
    kinds: () => KINDS.map(k => k.slice()), coin, coinSrc: () => COIN_SRC, pill, howHtml, paintPills, pop, reward, cardsDone, quizDone,
    // For tests: count again now
    refresh: () => { invalidate(); notice(); }};
})();
if (window.__SB_TEST) window.SBSC = SBSC;
