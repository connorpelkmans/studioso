/* ===== module: 99-discord-invite.js ===== */
/* "Join the Studyboard Discord": a one-time popup with a link to the community server.
   - People who started using Studyboard before 18 Nov 2026 see it once, the next time the app is quiet.
   - Everyone who starts later sees it once, 7 days after they started.
   One intro a visit (it waits for the next visit after a feature intro or the other one-time popup), and never within two minutes of the daily quote.
   "Once" is kept three ways, as in 99-ai-intro.js: the flag is written before the popup is drawn (and the popup is skipped if it
   can't be written), the flag follows the account to its other devices (UI_KEYS in 100-phone.js), and this page never draws it twice. */
(() => {
  const KEY = "studyboard:discordInvite", FIRST_RUN = "studyboard:firstRun";
  const LINK = "https://discord.gg/pcJJjfkZEP";
  /*DISCORD-START*/
  const DISCORD = (() => {
    const SPLIT = Date.UTC(2026, 10, 18);   // started before this: an existing user, who sees it right away
    const DELAY = 7 * 864e5;                // started on or after it: a new user, who waits a week
    // joined: when the person started, in ms (0 = from before the first-run date was kept); null = unknown
    const due = (joined, now) => {
      if (!(now > 0)) return false;
      if (joined == null || !(joined >= 0)) return false;
      if (joined < SPLIT) return true;
      return now >= joined + DELAY;
    };
    return {due, SPLIT, DELAY};
  })();
  /*DISCORD-END*/

  const T = () => window.__discordTest || null;
  const now = () => { const t = T(); return t && t.now ? t.now() : Date.now(); };
  const rd = k => { try { return localStorage.getItem(k); } catch (e) { return undefined; } };
  const wr = (k, v) => { try { localStorage.setItem(k, v); return localStorage.getItem(k) === v; } catch (e) { return false; } };
  const uiSyncSeen = () => { try { const b = state.settings && state.settings.uiSync; return !!(b && b[KEY] && b[KEY].v); } catch (e) { return false; } };
  const seen = () => rd(KEY) === undefined || !!rd(KEY) || uiSyncSeen();   // storage that can't be read counts as seen: never risk a second time

  // When this person started: their account's date, or for someone with no account, the first time this device ran the app
  // (0 when the device already had a planner before the first-run date was kept). Shares the first-run date with 99-ai-intro.js.
  function joined(){
    try {
      if (typeof sbUser !== "undefined" && sbUser && !sbUser.is_anonymous) { const t = Date.parse(sbUser.created_at || ""); if (t > 0) return t; }
    } catch (e) {}
    let f = rd(FIRST_RUN);
    if (f === undefined) return null;
    if (f === null) {
      // A brand-new install (Essentials decided that before anything was saved) started when it was installed, even though
      // the welcome setup has saved a planner by the time this first looks; anything else on the device means an earlier user
      let fresh = 0; try { const e = window.SBESS && SBESS.state(); if (e && e.why === "new" && e.at > 0) fresh = e.at; } catch (e) {}
      const had = !fresh && (rd("sb:onboarded") || rd("coursework:v2") || rd("studioso:welcomed"));
      f = had ? "0" : String(fresh || now());
      wr(FIRST_RUN, f);
    }
    const n = Number(f);
    return n >= 0 ? n : null;
  }

  let shown = false, timer = 0;
  const quiet = () => {
    try {
      if (document.hidden || dlg.open || document.getElementById("qod") || document.querySelector("dialog[open]")) return false;
      // one intro a visit (another already showed: wait for the next visit), and never straight after the daily quote
      if (window.__sbPopAt || (window.__sbQuoteAt && Date.now() - window.__sbQuoteAt < 120000)) return false;
      if (window.SBOB && SBOB.pending()) return false;
      if (window.SBTOUR && SBTOUR.active()) return false;
      if (window.SBEXAM && SBEXAM.current && SBEXAM.current()) return false;
      if (typeof pomo !== "undefined" && pomo && pomo.running && pomo.mode === "focus") return false;
    } catch (e) { return false; }
    return true;
  };

  const CHECK = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  const CHAT = '<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H11l-4.5 4v-4h0A2.5 2.5 0 0 1 4 13.5z" fill="currentColor" fill-opacity=".18"/><circle cx="9" cy="9.5" r="1" fill="currentColor"/><circle cx="12" cy="9.5" r="1" fill="currentColor"/><circle cx="15" cy="9.5" r="1" fill="currentColor"/></svg>';
  const POINTS = [
    ["Ask questions", "and get answers from the person who makes Studyboard"],
    ["Get support", "when something isn't working"],
    ["Chat with other students", "who use Studyboard, and share tips and wins"]
  ];

  function html(){
    const li = ([b, s]) => `<li><span class="aii-tick">${CHECK}</span><span><b>${esc(b)}</b> ${esc(s)}</span></li>`;
    return `<div class="aii-badge dci-badge" aria-hidden="true">${CHAT}</div>
      <div class="qod-eyebrow">New</div>
      <h2 id="qodT">Join the Studyboard Discord</h2>
      <p class="aii-sub">There's now a Discord server for everyone who uses Studyboard.</p>
      <ul class="aii-list">${POINTS.map(li).join("")}</ul>
      <div class="qod-foot"><button type="button" class="btn" data-qod-close>Maybe Later</button><button type="button" class="btn primary dci-join" data-qod-close data-act="discord-join">Join the Server</button></div>
      <p class="aii-fine">It's free to join.</p>`;
  }

  function show(){
    if (shown) return false;
    // The flag first, and only go on if it really was written: a popup that can't be remembered is never shown
    if (!wr(KEY, String(now()))) { shown = true; return false; }
    shown = true; stop();
    window.__sbPopAt = Date.now();
    qodPop(html(), "aii dci qod-plain");
    return true;
  }

  function check(){
    if (shown) return stop();
    if (seen()) { shown = true; return stop(); }
    if (navigator.webdriver && !T()) return;
    try { if (inPreview()) return; } catch (e) {}
    const j = joined();
    if (j == null) return;
    if (!DISCORD.due(j, now())) return;
    if (!quiet()) return;
    show();
  }
  function stop(){ clearInterval(timer); timer = 0; }

  hook("act", act => {
    if (act !== "discord-join") return false;
    openOutside(LINK);
    return true;
  });

  window.SBDISCORD = {due: DISCORD.due, check, seen: () => seen(), LINK};
  // Looks a few seconds after the app opens (so an account's flags from its other devices have arrived), then now and then
  setTimeout(() => { check(); if (!shown && !timer) timer = setInterval(check, 30000); }, 8000);
})();
