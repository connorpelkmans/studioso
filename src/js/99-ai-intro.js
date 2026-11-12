/* ===== module: 99-ai-intro.js ===== */
/* "Introducing Studyboard AI": a one-time popup, for a limited time only.
   - People who joined before 11 Nov 2026 see it once, the next time the app is quiet.
   - People who join from 11 to 24 Nov 2026 see it once, two days after joining.
   - Anyone who joins later never sees it, and from 28 Nov 2026 nobody does: this module does nothing after that, and can be deleted.
   "Once" is kept three ways: the flag is written before the popup is drawn (and the popup is skipped if it can't be written),
   the flag follows the account to its other devices (UI_KEYS in 100-phone.js), and this page never draws it twice. */
(() => {
  const KEY = "studyboard:aiIntro", FIRST_RUN = "studyboard:firstRun";
  /*AIINTRO-START*/
  const AIINTRO = (() => {
    const SPLIT = Date.UTC(2026, 10, 11);        // joined before this: an existing user
    const SIGNUP_END = Date.UTC(2026, 10, 25);   // joined from SPLIT up to this: a new user, who waits two days
    const DELAY = 2 * 864e5;
    const SHOW_END = SIGNUP_END + DELAY + 864e5; // the last person to join in time gets their two days and a day to spare
    // joined: when the person joined, in ms (0 = from before this popup existed); null = unknown
    const due = (joined, now) => {
      if (!(now > 0) || now >= SHOW_END) return false;
      if (joined == null || !(joined >= 0)) return false;
      if (joined < SPLIT) return true;
      if (joined >= SIGNUP_END) return false;
      return now >= joined + DELAY;
    };
    return {due, SPLIT, SIGNUP_END, DELAY, SHOW_END};
  })();
  /*AIINTRO-END*/

  const T = () => window.__aiIntroTest || null;
  const now = () => { const t = T(); return t && t.now ? t.now() : Date.now(); };
  const rd = k => { try { return localStorage.getItem(k); } catch (e) { return undefined; } };
  const wr = (k, v) => { try { localStorage.setItem(k, v); return localStorage.getItem(k) === v; } catch (e) { return false; } };
  const uiSyncSeen = () => { try { const b = state.settings && state.settings.uiSync; return !!(b && b[KEY] && b[KEY].v); } catch (e) { return false; } };
  const seen = () => rd(KEY) === undefined || !!rd(KEY) || uiSyncSeen();   // storage that can't be read counts as seen: never risk a second time

  // When this person joined: their account's date, or for someone with no account, the first time this device ran the app
  // (0 when the device already had a planner before this popup existed)
  function joined(){
    try {
      if (typeof sbUser !== "undefined" && sbUser && !sbUser.is_anonymous) { const t = Date.parse(sbUser.created_at || ""); if (t > 0) return t; }
    } catch (e) {}
    let f = rd(FIRST_RUN);
    if (f === undefined) return null;
    if (f === null) {
      const had = rd("sb:onboarded") || rd("coursework:v2") || rd("studioso:welcomed");
      f = had ? "0" : String(now());
      wr(FIRST_RUN, f);
    }
    const n = Number(f);
    return n >= 0 ? n : null;
  }

  let shown = false, timer = 0;
  const quiet = () => {
    try {
      if (document.hidden || dlg.open || document.getElementById("qod") || document.querySelector("dialog[open]")) return false;
      if (window.SBOB && SBOB.pending()) return false;
      if (window.SBTOUR && SBTOUR.active()) return false;
    } catch (e) { return false; }
    return true;
  };
  const live = () => typeof AI_PRO !== "undefined" && !!AI_PRO && typeof PLAN !== "undefined" && !!PLAN && PLAN.paywall();

  const CHECK = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  const SPARK = '<svg viewBox="0 0 24 24" width="30" height="30" fill="currentColor" aria-hidden="true"><path d="M12 2.5l2.1 5.6a2.4 2.4 0 0 0 1.4 1.4l5.6 2.1-5.6 2.1a2.4 2.4 0 0 0-1.4 1.4L12 20.7l-2.1-5.6a2.4 2.4 0 0 0-1.4-1.4L2.9 11.6l5.6-2.1a2.4 2.4 0 0 0 1.4-1.4z"/><path d="M19 2l.7 1.8c.1.3.4.6.7.7L22.2 5l-1.8.7c-.3.1-.6.4-.7.7L19 8.2l-.7-1.8a1.2 1.2 0 0 0-.7-.7L15.8 5l1.8-.7c.3-.1.6-.4.7-.7z" opacity=".7"/></svg>';
  const POINTS = [
    ["Higher quality responses", "across every AI feature"],
    ["2x faster", "on most responses"],
    ["Higher privacy standards", "(your data is never used to train models)"],
    ["Nothing to set up", "(no API key needed)"]
  ];

  function html(has){
    const li = ([b, s]) => `<li><span class="aii-tick">${CHECK}</span><span><b>${esc(b)}</b> ${esc(s)}</span></li>`;
    return `<div class="aii-badge" aria-hidden="true">${SPARK}</div>
      <div class="qod-eyebrow">New</div>
      <h2 id="qodT">Introducing Studyboard AI!</h2>
      <p class="aii-sub">Now included with Studyboard Pro.</p>
      <p class="aii-vs">Compared to free Gemini:</p>
      <ul class="aii-list">${POINTS.map(li).join("")}</ul>
      <div class="qod-foot">${has
        ? `<button type="button" class="btn primary" data-qod-close>Got It</button>`
        : `<button type="button" class="btn" data-qod-close>Maybe Later</button><button type="button" class="btn primary aii-pro" data-qod-close data-act="plan-open" data-reason="Studyboard AI is included with Pro: higher quality, faster, more private AI for every AI feature, with nothing to set up.">See Studyboard Pro</button>`}</div>
      <p class="aii-fine">Only for users with paid Pro.</p>`;
  }

  function show(){
    if (shown) return false;
    // The flag first, and only go on if it really was written: a popup that can't be remembered is never shown
    if (!wr(KEY, String(now()))) { shown = true; return false; }
    shown = true; stop();
    let has = false; try { has = typeof aiProAvail === "function" && !!aiProAvail(); } catch (e) {}
    qodPop(html(has), "aii qod-plain");
    return true;
  }

  function check(){
    if (shown) return stop();
    const t = now();
    if (t >= AIINTRO.SHOW_END) { shown = true; return stop(); }
    if (seen()) { shown = true; return stop(); }
    if (navigator.webdriver && !T()) return;
    try { if (inPreview()) return; } catch (e) {}
    const j = joined();
    if (j == null) return;
    if (!AIINTRO.due(j, t)) { if (j >= AIINTRO.SIGNUP_END) { shown = true; stop(); } return; }
    if (!live() || !quiet()) return;
    show();
  }
  function stop(){ clearInterval(timer); timer = 0; }

  window.SBAIINTRO = {due: AIINTRO.due, check, seen: () => seen(), SHOW_END: AIINTRO.SHOW_END};
  // Looks a few seconds after the app opens (so an account's flags from its other devices have arrived), then now and then
  setTimeout(() => { check(); if (!shown && !timer) timer = setInterval(check, 30000); }, 6000);
})();
