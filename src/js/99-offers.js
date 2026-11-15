/* ===== module: 99-offers.js ===== */
/* Offers in the board's Notices for the free plan, timed to the school calendar. At most one card at a time, each shown on one day only
   (it stays that day until it's acted on or dismissed), remembered in settings so another device doesn't show it again:
   1. Exam trial: 3 to 10 days before an exam that has a prep plan, while Quiz Me has free sessions left this week:
      "BIO101 Final in 10 days. Try Quiz Me on it: you have 3 free sessions this week." The button opens Ask Your Course on that
      course and starts Quiz Me on the answer (with no AI set up yet, it opens AI setup first). The free runs make it a real trial.
   2. Exam follow-up: this week's free Quiz Me sessions are used up and an exam that had the trial card is still more than 3 days
      away: Pro through the end of term, the semester plan picked on the Pro sheet.
   3. New term: in the first week of a term, the semester plan.
   Never: on Pro or the free weeks, in a guest preview, in Exam Mode, within 2 days of the exam, or while the review prompt is keeping
   quiet (a free-plan limit, the paywall or the free weeks ending lately; see reviewQuiet in 01-helpers.js), or a day after a Pro
   sheet. A discount for these can be a Stripe promotion code; nothing here changes the price. */
(() => {
  const P = window.SBPRO; if (!P) return;
  const DAY = 864e5;
  const S = () => (state.settings && state.settings.offers && typeof state.settings.offers === "object" ? state.settings.offers : {});
  const save = patch => { state.settings = Object.assign({}, state.settings, {offers: Object.assign({}, S(), patch)}); saveSettings(); };
  const num = k => { try { return Number(localStorage.getItem(k)) || 0; } catch (e) { return 0; } };
  const plan = () => (typeof PLAN !== "undefined" && PLAN ? PLAN : null);
  const daysTo = d => Math.round((parse(d) - parse(todayISO())) / DAY);
  const label = c => c ? (c.code || c.name || "") : "";

  // whether any offer may show right now
  function allowed(){
    const L = plan(); if (!L || !L.paywall() || L.isPro()) return false;
    if (typeof inPreview === "function" && inPreview()) return false;
    try { if (window.SBEXAM && SBEXAM.current && SBEXAM.current()) return false; } catch (e) {}
    const now = Date.now();
    if (now < num("studyboard:reviewQuietUntil")) return false;
    if (now - num("studyboard:proShownAt") < DAY) return false;
    return true;
  }
  // a card shows on one day only: the first day it qualifies, until acted on or dismissed
  const shownToday = rec => !!rec && rec.d === todayISO() && !rec.x;
  const fresh = rec => !rec;

  // exams with a prep plan, soonest first
  function exams(){
    const today = todayISO();
    return tasksArr().filter(t => MILESTONE(t.type) && t.status !== "done" && t.due && t.due >= today && window.SBPREP && SBPREP.summary(t))
      .sort((a, b) => a.due.localeCompare(b.due));
  }
  function pick(){
    if (!allowed()) return null;
    const L = plan(), o = S(), ex = o.ex || {}, fu = o.fu || {}, tm = o.term || {}, today = todayISO();
    const quizLeft = L.runsLeft ? L.runsLeft("quiz") : 0;
    // already showing today: keep the same card
    for (const e of exams()) { if (shownToday(fu[e.id])) return {kind: "fu", ex: e}; if (shownToday(ex[e.id])) return {kind: "ex", ex: e}; }
    const key = termKey(); if (key && shownToday(tm[key])) return {kind: "term", key};
    // 2. follow-up: the free sessions are used up, and an exam that had the trial card is still more than 3 days away
    if (quizLeft === 0) { const e = exams().find(e => ex[e.id] && fresh(fu[e.id]) && daysTo(e.due) > 3); if (e) return {kind: "fu", ex: e, first: true}; }
    // 1. exam trial: 3 to 10 days out, with free Quiz Me sessions left
    if (quizLeft > 0) { const e = exams().find(e => fresh(ex[e.id]) && daysTo(e.due) >= 3 && daysTo(e.due) <= 10); if (e) return {kind: "ex", ex: e, first: true}; }
    // 3. new term: its first week
    if (key && fresh(tm[key]) && termDay() < 7) return {kind: "term", key, first: true};
    return null;
  }
  // the term: from the scrapbook's term or the usual start dates (SBPRO.termRange)
  const termFrom = () => { try { return P.termRange().from; } catch (e) { return ""; } };
  const termKey = () => termFrom();
  const termDay = () => { const f = termFrom(); return f ? -daysTo(f) : 99; };

  // lead: "Pro through the end of term" or "Pro for the whole term"; the website's semester plan renews, so it says so
  function semLine(lead){
    const sem = plan() && plan().semester ? plan().semester() : null;
    if (!sem) return {text: "Keep Studyboard AI, unlimited Quiz Me and the Exam Day Forecast through your exams with Pro.", btn: "See Plans"};
    return {text: sem.once ? `${lead}: ${sem.price}, one payment for the semester.` : `${lead}: ${sem.price} (renews every 4 months, cancel any time).`, btn: "See Semester Plan"};
  }
  const card = (kind, id, body, btn) => `<div class="offer-card" data-offer="${kind}"><span class="offer-t">${body}</span><span class="offer-a"><button type="button" class="btn small primary" data-act="offer-go" data-id="${esc(kind + "|" + id)}">${esc(btn)}</button><button type="button" class="icon-btn sm offer-x" data-act="offer-x" data-id="${esc(kind + "|" + id)}" aria-label="Not now">${typeof CLOSE === "string" ? CLOSE : "×"}</button></span></div>`;

  function html(){
    const x = pick(); if (!x) return "";
    const o = S(), today = todayISO();
    // mark it shown today (once), so it stays today only
    // (saved just after this draw, never during it; drawing again first finds the same card, so nothing doubles)
    if (x.first) setTimeout(() => { const o = S(); if (x.kind === "term") { if (!(o.term || {})[x.key]) save({term: Object.assign({}, o.term, {[x.key]: {d: today}})}); } else if (!(o[x.kind] || {})[x.ex.id]) save({[x.kind]: Object.assign({}, o[x.kind], {[x.ex.id]: {d: today}})}); }, 0);
    if (x.kind === "term") {
      const s = semLine("Pro for the whole term");
      return card("term", x.key, `<b>New term, fresh start.</b> ${esc(s.text)}`, s.btn);
    }
    const e = x.ex, c = courseOf(e.courseId), d = daysTo(e.due), when = d === 1 ? "tomorrow" : `in ${d} days`, name = [label(c), e.title].filter(Boolean).join(" ");
    if (x.kind === "fu") { const s = semLine("Pro through the end of term"); return card("fu", e.id, `<b>${esc(name)} ${esc(when)}.</b> ${esc(s.text)}`, s.btn); }
    const left = plan().runsLeft("quiz");
    return card("ex", e.id, `<b>${esc(name)} ${esc(when)}.</b> Try Quiz Me on it: you have ${left} free session${left === 1 ? "" : "s"} this week.`, `Quiz Me on ${label(c) || "It"}`);
  }

  function go(kind, id){
    const o = S(), rec = Object.assign({}, (o[kind] || {})[id] || {}, {x: 1});
    save({[kind]: Object.assign({}, o[kind], {[id]: rec})});
    if (kind === "ex") {
      const e = state.tasks[id]; if (!e) return;
      if (!aiReady()) { aiSetupSheet(true); render(); return; }
      const topics = e.prep && Array.isArray(e.prep.topics) ? e.prep.topics.map(t => t.name).filter(Boolean).slice(0, 6) : [];
      const q = `What do I need to know for ${e.title}${topics.length ? ` (${topics.join(", ")})` : ""}?`;
      render();
      if (window.SBSEARCH && SBSEARCH.quizCourse) SBSEARCH.quizCourse(e.courseId || "", q);
      return;
    }
    render();
    plan().openSheetPick(kind === "term" ? "Pro for the whole term: Studyboard AI, the Exam Day Forecast, unlimited Quiz Me and more." : "Keep Quiz Me unlimited through your exams with Pro.", "semester");
  }
  function dismiss(kind, id){
    const o = S(), rec = Object.assign({}, (o[kind] || {})[id] || {d: todayISO()}, {x: 1});
    save({[kind]: Object.assign({}, o[kind], {[id]: rec})});
    render();
  }

  // shown with the board's other notices (under the Notices dropdown above the add bar), not inside Today's Plan
  window.SBOFFERS = {noticeHtml: () => { try { return html(); } catch (e) { console.warn("offers", e); return ""; } }};
  hook("act", (act, el, id) => {
    if (act !== "offer-go" && act !== "offer-x") return false;
    const s = String(id || ""), k = s.indexOf("|"), kind = s.slice(0, k), key = s.slice(k + 1);
    if (!["ex", "fu", "term"].includes(kind)) return true;
    if (act === "offer-go") go(kind, key); else dismiss(kind, key);
    return true;
  });
  window.__sbOffers = {pick, html, allowed};

  const css = document.createElement("style");
  css.textContent = `
.offer-card{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin:0;padding:12px 14px;border:1px solid color-mix(in srgb,var(--accent) 30%,var(--line));border-radius:12px;background:color-mix(in srgb,var(--accent) 6%,var(--surface))}
.offer-t{flex:1;min-width:14em;line-height:1.4}
.offer-a{display:flex;align-items:center;gap:6px;margin-left:auto}
`;
  document.head.appendChild(css);
})();
