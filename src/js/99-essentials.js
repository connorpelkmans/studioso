/* ===== module: 99-essentials.js ===== */
/* Essentials, on screen (the switch itself is SBESS in 01-essentials.js):
   - the menu: Board, Calendar, Review and Courses, then More, which opens everything else (Notes, Companion, Groups and the
     Calculator and Style Shop). A tab comes back to the menu once it's relevant: a first note, joining a group, or opening it
     from Search.
   - Today's Plan: Do This Next, the day's tasks and the time strip. The rest waits until it's relevant (Crunch once you're short
     of time, Exam Prep two weeks before an exam, flashcards once there's a deck) or until Show Everything is on.
   - each unlock is announced once, in one line; an exam within 14 days gets one Exam Prep card that can be dismissed.
   - Settings > Appearance > Show Everything turns Essentials off, and back on.
   Runs before the Board's Notices stack (99-motion-a11y-tz.js), so cards that wait are never counted there. */
(() => {
  const TABS = ["notes", "companion", "groups"];
  const DAYS = 14;
  const ICON_MORE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="5.5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="18.5" cy="12" r="1.5"/></svg>';
  const ICON_EXAM = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="3.5" width="16" height="17" rx="2"/><path d="M8 8h8M8 12h5M8 16h3"/><path d="M14.5 15.5l1.6 1.6 3-3.2"/></svg>';
  const ICON_TABS = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><path d="M17 14v6M14 17h6"/></svg>';
  const ICON_X = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  const ROWS = {
    notes: {t: "Notes", s: "Sticky notes and whiteboards, one board per course"},
    companion: {t: "Companion", s: "Chat with your study companion and dress it up"},
    groups: {t: "Groups", s: "Study with friends: share decks and deadlines"}
  };
  const SAY = {
    notes: "Notes now has its own tab in the menu.",
    groups: "Groups now has its own tab in the menu.",
    companion: "Companion now has its own tab in the menu.",
    decks: "Flashcards are on: due cards show on Today's Plan, and Review adds Quizzes and Concept Maps.",
    crunch: "Crunch Forecast is on: it warns you about heavy weeks before they arrive."
  };
  const navBtn = t => document.querySelector(`nav.tabs .in [data-tab="${t}"]`);
  const busy = () => (typeof tourDemo !== "undefined" && !!tourDemo) || !!(window.SBTOUR && SBTOUR.active());
  const inPrev = () => { try { return inPreview(); } catch (e) { return false; } };

  /* ---------- The menu ---------- */
  const fresh = new Set();   // tabs just unlocked this session: a small dot until they're opened
  function moreBtn(){
    const inn = document.querySelector("nav.tabs .in"); if (!inn) return null;
    let b = inn.querySelector(":scope > .ess-more");
    if (!b) {
      b = document.createElement("button");
      b.type = "button"; b.className = "ess-more"; b.dataset.act = "ess-more";
      b.setAttribute("aria-haspopup", "dialog"); b.setAttribute("aria-expanded", "false");
      b.innerHTML = ICON_MORE + `<span class="em-l"></span>`;
      inn.insertBefore(b, inn.querySelector("#navPomo") || null);
    } else if (b.nextElementSibling && b.nextElementSibling.dataset && b.nextElementSibling.dataset.tab) inn.insertBefore(b, inn.querySelector("#navPomo") || null);   // a tab added later (Groups) goes before More
    return b;
  }
  // tabs Essentials is keeping out of the menu right now (on phones the companion always keeps its seat in the bar, so it isn't one)
  const offMenu = b => { try { return getComputedStyle(b).display === "none"; } catch (e) { return true; } };
  const hiddenTabs = () => TABS.filter(t => navBtn(t) && !SBESS.shows(t) && offMenu(navBtn(t)));
  function navApply(){
    const on = SBESS.on();
    TABS.forEach(t => { const b = navBtn(t); if (!b) return; b.classList.toggle("ess-hide", on && !SBESS.shows(t)); b.classList.toggle("ess-new", on && fresh.has(t) && (typeof ui === "undefined" || ui.tab !== t)); });
    if (typeof ui !== "undefined") fresh.delete(ui.tab);
    const b = moreBtn(); if (!b) return;
    const label = typeof tr === "function" ? tr("ess.more", "More") : "More";
    const l = b.querySelector(".em-l"); if (l && l.textContent !== label) l.textContent = label;
    const names = hiddenTabs().map(t => ROWS[t].t).concat(SBESS.shows("tools") ? [] : ["Calculator", "Style Shop"]);
    b.setAttribute("aria-label", names.length ? `${label}: ${names.length > 1 ? names.slice(0, -1).join(", ") + " and " + names[names.length - 1] : names[0]}` : label);
    // the page you're on is one of the tabs under More: More is the menu item that shows it
    const here = on && typeof ui !== "undefined" && TABS.includes(ui.tab) && !SBESS.shows(ui.tab) && !!navBtn(ui.tab) && offMenu(navBtn(ui.tab));
    b.setAttribute("aria-current", here ? "page" : "false");
    // phones: More earns its place in the bottom bar only while a tab is waiting behind it. Once Notes and Groups are both in
    // the bar, all More would hold is the Calculator and Style Shop, which Settings (the ⋯ button) already has, and a fourth
    // tab beside the companion's seat is too tight to read.
    b.hidden = !on || (phoneMq() && !hiddenTabs().length);
  }
  const phoneMq = () => { try { return matchMedia("(max-width:639px)").matches; } catch (e) { return false; } };
  try { const mq = matchMedia("(max-width:639px)"); (mq.addEventListener ? mq.addEventListener("change", () => navApply()) : mq.addListener(() => navApply())); } catch (e) {}
  function goTab(t){
    if (dlg.open) dlg.close();
    ui.tab = t; if (t !== "courses") ui.courseId = null; if (t === "groups") ui.grp = null;
    render(); window.scrollTo(0, 0);
  }
  function moreSheet(){
    const svgOf = el => { const s = el && el.querySelector("svg"); return s ? s.outerHTML : ""; };
    const row = (act, id, ic, title, sub) => `<button type="button" data-act="${act}"${id ? ` data-id="${id}"` : ""}><span class="ess-ic" aria-hidden="true">${ic}</span><span class="ess-tx">${esc(title)}<span class="sub">${esc(sub)}</span></span></button>`;
    const tabs = hiddenTabs().map(t => row("ess-go", t, svgOf(navBtn(t)), ROWS[t].t, ROWS[t].s)).join("");
    const tools = SBESS.shows("tools") ? "" : row("calc-open", "", svgOf(document.querySelector("nav.tabs .calc-btn")), "Calculator", "A scientific calculator, with your history") +
      row("shop", "", svgOf(document.querySelector('nav.tabs [data-act="shop"]')), "Style Shop", "Themes, companions, stickers and more");
    openSheet(`<div class="sheet more-sheet ess-sheet">${head(tr("ess.more", "More"))}<div class="sheet-body">
      <p class="ess-lead">Studyboard keeps to the essentials for now. The rest is here, and turns on by itself when you need it.</p>
      <div class="menu-list">${tabs}${tools}</div>
      <div class="ess-all"><button type="button" class="btn" data-act="ess-all">Show Everything</button><span class="mini">Every tab in the menu and every card on Today's Plan. You can come back to the essentials in Settings.</span></div>
    </div></div>`);
    const b = document.querySelector("nav.tabs .ess-more"); if (b) b.setAttribute("aria-expanded", "true");
    dlg.addEventListener("close", () => {
      const m = document.querySelector("nav.tabs .ess-more"); if (!m) return;
      m.setAttribute("aria-expanded", "false");
      if ((!document.activeElement || document.activeElement === document.body) && m.offsetParent) { try { m.focus({preventScroll: true}); } catch (e) {} }
    }, {once: true});
  }

  /* ---------- Unlocks: features turn on as they become relevant ---------- */
  const isExam = t => !!t && !t.prepFor && t.type !== "Study" && t.type !== "Quiz" && (t.type === "Exam" || /\b(exams?|midterms?)\b/i.test(String(t.title || "")));
  function nextExam(){
    const today = todayISO();
    return tasksArr().filter(t => t.status !== "done" && t.due && isExam(t)).map(t => ({t, d: dayDiff(today, t.due)})).filter(x => x.d >= 0 && x.d <= DAYS).sort((a, b) => a.d - b.d)[0] || null;
  }
  function relevant(quiet){
    if (!SBESS.on() || busy() || inPrev()) return;
    const o = {quiet: !!quiet};
    try { if (notesArr().length) SBESS.unlock("notes", Object.assign({by: "note"}, o)); } catch (e) {}
    try { if (deckListArr().length) SBESS.unlock("decks", Object.assign({by: "deck"}, o)); } catch (e) {}
    try { if (window.SBGROUPS && SBGROUPS.known() > 0) SBESS.unlock("groups", Object.assign({by: "group"}, o)); } catch (e) {}
    try { if (nextExam()) SBESS.unlock("examprep", Object.assign({by: "exam"}, o)); } catch (e) {}
    try { const F = typeof FOCUS !== "undefined" && FOCUS; if (F && F.crunch) SBESS.unlock("crunch", Object.assign({by: "short"}, o)); } catch (e) {}
  }
  // Announced once each, one line, when nothing else is on screen
  const queue = [];
  let sayT = 0;
  function sayNext(){
    clearTimeout(sayT); sayT = 0;
    if (!queue.length) return;
    if (dlg.open || document.querySelector("dialog[open], .note.editing") || busy()) { sayT = setTimeout(sayNext, 2500); return; }
    const id = queue.shift();
    if (SBESS.said("unlock:" + id) || !SBESS.on()) { sayNext(); return; }
    SBESS.said("unlock:" + id, true);
    const go = TABS.includes(id) && !(typeof ui !== "undefined" && ui.tab === id) ? {label: "Open", fn: () => goTab(id)} : id === "crunch" ? {label: "Open", fn: () => goTab("crunch")} : null;
    toast(SAY[id], null, go);
    if (queue.length) sayT = setTimeout(sayNext, 5000);
  }
  SBESS.subscribe(ch => {
    if (ch.unlock) {
      if (TABS.includes(ch.unlock) && !ch.quiet) fresh.add(ch.unlock);
      if (SAY[ch.unlock] && !ch.quiet && !SBESS.said("unlock:" + ch.unlock)) { queue.push(ch.unlock); if (!sayT) sayT = setTimeout(sayNext, 900); }
      else if (ch.quiet) SBESS.said("unlock:" + ch.unlock, true);
    }
    if (ch.set === true) relevant(true);   // back to the essentials: what's already in use stays on, quietly
    try { navApply(); scheduleRender(); } catch (e) {}
  });
  // Opening a hidden feature from Search turns it on (30-search.js)
  SBESS.opened = (what, via) => {
    if (!SBESS.on() || via !== "search") return false;
    if (TABS.includes(what)) return SBESS.unlock(what, {by: "search"});
    if (what === "crunch") return SBESS.unlock("crunch", {by: "search"});
    return false;
  };
  // A new device signed in to a planner that's been in use for a while: that's an existing student, so everything shows
  function established(){
    const st = SBESS.state(); if (!st.on || st.why !== "new" || st.setAt) return false;
    const old = x => x && Number(x.created) > 0 && Number(x.created) < st.at - 2 * 864e5;
    try { return allTasks().some(old) || Object.values(state.decks || {}).some(old) || Object.values(state.notes || {}).some(old); } catch (e) { return false; }
  }

  /* ---------- Today's Plan ---------- */
  function examCard(v){
    if (!SBESS.on() || !SBESS.shows("examprep") || SBESS.said("exam-card") || v.querySelector(".ess-exam")) return;
    const x = nextExam(); if (!x) return;
    const qa = v.querySelector(":scope > .qa-wrap"); if (!qa) return;
    const when = x.d === 0 ? "today" : x.d === 1 ? "tomorrow" : `in ${x.d} days`;
    qa.insertAdjacentHTML("afterend", `<section class="ess-card ess-exam" aria-labelledby="essExT">
      <span class="ess-card-ic">${ICON_EXAM}</span>
      <p class="ess-card-t" id="essExT"><b>Exam Prep is on.</b> ${esc(x.t.title)} is ${when}: Exam Prep spreads your review over the days before it.</p>
      <span class="ess-card-acts"><button type="button" class="btn small primary" data-act="ess-exam-go" data-id="${esc(x.t.id)}">Plan My Prep</button><button type="button" class="icon-btn ess-card-x" data-act="ess-exam-x" aria-label="Dismiss the Exam Prep card">${ICON_X}</button></span>
    </section>`);
  }
  /* After a week: offer every tab, once. A card on the Board (never a popup), only for students Essentials started for
     (not someone who switched it back on themselves), and not while the tour runs. "Show All Tabs" is Show Everything;
     "Keep It Simple" keeps Essentials and says where the switch is. Either answer is final. */
  const WEEK = 7 * 864e5;
  function weekDue(){
    const st = SBESS.state();
    return st.on && st.why === "new" && !st.setAt && Date.now() - Number(st.at || Date.now()) >= WEEK && !SBESS.said("week-prompt") && !busy() && !inPrev();
  }
  function weekCard(v){
    if (!weekDue() || v.querySelector(".ess-week")) return;
    const qa = v.querySelector(":scope > .qa-wrap"); if (!qa) return;
    const n = hiddenTabs().length + (SBESS.shows("tools") ? 0 : 2);
    qa.insertAdjacentHTML("afterend", `<section class="ess-card ess-week" aria-labelledby="essWkT">
      <span class="ess-card-ic">${ICON_TABS}</span>
      <p class="ess-card-t" id="essWkT"><b>You've had a week with Studyboard.</b> Want every tab in the menu? ${n ? `${n} more ${n === 1 ? "thing is" : "things are"} waiting under More, and` : "The rest of"} Today's Plan has a few more cards too.</p>
      <span class="ess-card-acts"><button type="button" class="btn small primary" data-act="ess-week-all">Show All Tabs</button><button type="button" class="btn small" data-act="ess-week-keep">Keep It Simple</button></span>
    </section>`);
  }
  window.SBESSWEEK = {due: weekDue};
  function calmBoard(){
    const v = document.getElementById("view"); if (!v) return;
    const extras = SBESS.shows("plan-extras");
    // notices that wait: weekly review, streaks and the study-groups invitation; Crunch until you're short of time
    if (!extras) v.querySelectorAll(":scope > :is(.wkr-card, .fgs-strip, .fgs-intro, .gn-card)").forEach(e => e.remove());
    if (!SBESS.shows("crunch")) v.querySelectorAll(":scope > .crunch-card").forEach(e => e.remove());
    const plan = v.querySelector("section.plan");
    if (plan) {
      const NEED = {est: "plan-extras", sugg: "plan-extras", heads: "plan-extras", fc: "decks", prep: "examprep"};
      plan.querySelectorAll(".pt-tab").forEach(b => {
        const need = NEED[b.dataset.k]; if (!need || SBESS.shows(need)) return;
        const p = plan.querySelector("#ptp-" + CSS.escape(b.dataset.k)); if (p) p.remove();
        if (ui.planTab === b.dataset.k) ui.planTab = "";
        b.remove();
      });
      if (!SBESS.shows("examprep")) plan.querySelectorAll(".plan-notes li:is(.pn-wrap, .pn-ready:has([data-act='gap-hide']))").forEach(li => li.remove());
      plan.querySelectorAll(".plan-notes").forEach(s => { if (!s.querySelector("li")) s.remove(); });
      if (!extras) { plan.querySelectorAll('.pf-link[data-id="how"], #plan-how').forEach(e => e.remove()); }
    }
    if (weekDue()) weekCard(v); else examCard(v);   // one card at a time
  }
  function calmReview(){
    // Before the first deck, Review is just Flashcards: Quizzes, Concept Maps and Presentations come with it
    if (busy() || SBESS.shows("decks") || (ui.rvView && ui.rvView !== "cards")) return;
    document.querySelectorAll("#view .rv-tabs > [role=tab]:not([data-id='cards'])").forEach(b => b.remove());
  }

  /* ---------- Settings ---------- */
  hook("menu", () => `<div class="cap-row ess-row" data-group="appearance" data-us-key="ess-toggle"><span style="flex:1;font-weight:600">Show Everything<span class="sub">Every tab in the menu and every card on Today's Plan. Turn it off to keep to the essentials; the rest turns on as you need it.</span></span><label class="anim-tog"><input type="checkbox" data-act="ess-toggle" ${SBESS.on() ? "" : "checked"}> On</label></div>`);

  hook("act", (act, el) => {
    switch (act) {
      case "ess-more": moreSheet(); return true;
      case "ess-go": { const t = el && el.dataset.id; if (TABS.includes(t)) goTab(t); return true; }
      case "ess-all": {
        if (dlg.open) dlg.close();
        SBESS.set(false, "user");
        toast("Showing everything. You can go back to the essentials in Settings.", () => SBESS.set(true, "user"));
        return true;
      }
      case "ess-toggle": {
        const all = !!el.checked;
        SBESS.set(!all, "user");
        toast(all ? "Showing everything" : "Back to the essentials. The rest is under More.", () => { SBESS.set(all, "user"); const i = document.querySelector('[data-act="ess-toggle"]'); if (i) i.checked = !all; });
        return true;
      }
      case "ess-week-all": {
        SBESS.said("week-prompt", true);
        SBESS.set(false, "user");
        toast("Every tab is in the menu now. You can go back to the essentials in Settings.", () => SBESS.set(true, "user"));
        return true;
      }
      case "ess-week-keep": {
        SBESS.said("week-prompt", true);
        const c = document.querySelector(".ess-week"); if (c) c.remove();
        toast("Keeping it simple. Show Everything is in Settings › Appearance whenever you want it.");
        return true;
      }
      case "ess-exam-go": SBESS.said("exam-card", true); fire("act", "prep-plan", el, el.dataset.id); return true;
      case "ess-exam-x": {
        SBESS.said("exam-card", true);
        const c = document.querySelector(".ess-exam"); if (c) c.remove();
        const q = document.querySelector(".qa-wrap input"); if (q) { try { q.focus({preventScroll: true}); } catch (e) {} }
        toast("Exam Prep is still in each exam, and under Today's Plan.");
        return true;
      }
      // Exam Prep opened another way (Search, a task) counts as relevant
      case "prep-plan": if (SBESS.on()) SBESS.unlock("examprep", {by: "open", quiet: true}); return false;
    }
    return false;
  });

  hook("render", tab => {
    try {
      if (established()) { SBESS.set(false, "account"); return; }
      relevant(false);
      navApply();
      if (!SBESS.on()) return;
      if (tab === "board") calmBoard();
      else if (tab === "flashcards") calmReview();
    } catch (e) { console.warn("essentials", e); }
  });
  hook("boot", () => { try { relevant(true); navApply(); } catch (e) {} });
  // a language change renames More
  hook("lang", () => { try { navApply(); } catch (e) {} });
  navApply();
})();
