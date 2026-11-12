/* ===== module: 99-review-ask.js ===== */
/* Asking for an App Store or Google Play review, at a good moment, in the iPhone, iPad and Android apps only.
   The system's own prompt (Apple's and Google's, through @capacitor-community/in-app-review): no custom "Enjoying Studyboard?" screen
   first, because both stores forbid sending only happy people to the review page. Apple shows it at most 3 times a year anyway and
   may skip it; Google decides too. Nothing tells the app whether it showed or what was given.
   When: right after a good moment (Today's Plan cleared, a Focus of 20 minutes or more finished, a good grade, a new best Match time),
   once the moment's own sheet or celebration is gone. Only for someone who has used the app for a while (a week, 5 days of use,
   10 tasks done), never twice within 120 days or more than 3 times in a year, and never near something going wrong: an error
   message, a crash, a bug report in the last 30 days, or a Pro sheet in the last day. At most one try per launch. */
(() => {
  const KEY = "studyboard:reviewAsk", PRO_KEY = "studyboard:proShownAt", BUG_KEY = "studyboard:bugsent";
  const DAY = 864e5, MIN_AGE = 7 * DAY, MIN_DAYS = 5, MIN_DONE = 10, GAP = 120 * DAY, YEAR_MAX = 3, BUG_QUIET = 30 * DAY, PRO_QUIET = DAY, ERR_QUIET = 10 * 60000;
  const read = () => { try { const o = JSON.parse(localStorage.getItem(KEY) || "null"); return o && typeof o === "object" ? o : null; } catch (e) { return null; } };
  const write = o => { try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {} };
  const num = k => { try { return Number(localStorage.getItem(k)) || 0; } catch (e) { return 0; } };
  // the record: when the app was first used here, the days it was used (the last 30), and when a review was asked for
  function rec(){
    let o = read();
    if (!o) {
      // someone who already used the app before this update: when they started, and the days they finished something
      const T0 = Date.UTC(2023, 0, 1), now = Date.now(), all = tasksArr();
      const starts = all.map(t => Number(t.created)).filter(x => x > T0 && x < now);
      const days = [...new Set(all.map(t => Number(t.doneAt)).filter(x => x > T0 && x <= now && now - x < 60 * DAY).map(x => iso(new Date(x))))].sort().slice(-30);
      o = {first: starts.length ? Math.min(...starts) : now, days, asked: []};
      write(o);
    }
    if (!Array.isArray(o.days)) o.days = [];
    if (!Array.isArray(o.asked)) o.asked = [];
    if (!(Number(o.first) > 0)) o.first = Date.now();
    return o;
  }
  function noteDay(){
    const o = rec(), d = todayISO();
    if (!o.days.includes(d)) { o.days = o.days.concat(d).slice(-30); write(o); }
  }

  // The store prompt is only there in the phone and tablet apps, with the plugin installed
  const C = () => window.Capacitor;
  function plugin(){
    try {
      const c = C(); if (!c || !(c.isNativePlatform && c.isNativePlatform())) return null;
      if (c.isPluginAvailable && !c.isPluginAvailable("InAppReview")) return null;
      return (c.Plugins && c.Plugins.InAppReview) || (c.registerPlugin ? c.registerPlugin("InAppReview") : null);
    } catch (e) { return null; }
  }

  // Something going wrong this session: an error message, or an error the page didn't catch
  let errAt = 0, tried = false;
  window.addEventListener("error", () => { errAt = Date.now(); });
  window.addEventListener("unhandledrejection", () => { errAt = Date.now(); });
  const errSeen = () => { const t = document.getElementById("toast"); return !!(t && t.classList.contains("toast-err") && t.classList.contains("show")); };
  setInterval(() => { if (errSeen()) errAt = Date.now(); }, 2000);

  // Why not now (empty: it's a good time)
  function whyNot(now){
    now = now || Date.now();
    if (!plugin()) return "not in the app";
    if (tried) return "already tried this launch";
    const o = rec();
    if (now - o.first < MIN_AGE) return "used for less than a week";
    if (o.days.length < MIN_DAYS) return "used on fewer than 5 days";
    const done = tasksArr().filter(t => t.status === "done").length;
    if (done < MIN_DONE) return "fewer than 10 tasks done";
    const asked = o.asked.filter(t => Number(t) > 0);
    if (asked.length && now - Math.max(...asked) < GAP) return "asked within 120 days";
    if (asked.filter(t => now - t < 365 * DAY).length >= YEAR_MAX) return "asked 3 times this year";
    if (errAt && now - errAt < ERR_QUIET) return "an error just now";
    if (now - num(BUG_KEY) < BUG_QUIET) return "a bug report this month";
    if (now - num(PRO_KEY) < PRO_QUIET) return "a Pro sheet today";
    if (typeof navigator !== "undefined" && navigator.onLine === false) return "offline";
    return "";
  }

  // A good moment: wait for its sheet, toast and celebration to clear, then ask once
  let waitT = 0;
  function moment(kind){
    if (whyNot()) return;
    clearTimeout(waitT);
    const until = Date.now() + 45000;
    const tryNow = () => {
      if (document.hidden || Date.now() > until) return;
      const busy = document.querySelector("dialog[open]") || (document.getElementById("toast") && document.getElementById("toast").classList.contains("show"))
        || (typeof pomo !== "undefined" && pomo && pomo.running && pomo.mode === "focus");
      if (busy) { waitT = setTimeout(tryNow, 1500); return; }
      ask(kind);
    };
    waitT = setTimeout(tryNow, 1800);
  }
  function ask(kind){
    if (whyNot()) return;
    const P = plugin(); if (!P || typeof P.requestReview !== "function") return;
    tried = true;
    const o = rec(); o.asked = o.asked.concat(Date.now()).slice(-6); o.lastKind = kind; write(o);
    Promise.resolve().then(() => P.requestReview()).catch(e => console.warn("review prompt", e));
  }

  hook("boot", noteDay);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) { try { noteDay(); } catch (e) {} } });
  hook("good-moment", kind => { try { moment(String(kind || "")); } catch (e) { console.warn("review ask", e); } });
  hook("focus", e => { if (e && e.type === "end" && e.mode === "focus" && !e.missed && Number(e.minutes) >= 20) fire("good-moment", "focus"); });

  if (window.__SB_TEST) window.__sbReviewAsk = {whyNot: () => whyNot(), rec: () => rec(), moment: k => moment(k), reset: () => { tried = false; errAt = 0; }};
})();
