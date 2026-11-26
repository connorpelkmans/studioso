/* ===== module: 01-essentials.js ===== */
/* Essentials: the switch for a calmer first week (the screens that follow it are in 99-essentials.js).
   A new install starts in Essentials: the main tabs only (Board, Calendar, Review, Courses), the rest one tap away under More,
   and the advanced parts of Today's Plan waiting until they're relevant. Features turn on by themselves as they become
   relevant ("unlocks"), and Settings > Show Everything turns Essentials off (or back on).
   Existing students keep everything they see today: the choice is made once per device, before any other code runs, and any
   trace of an earlier run (a saved planner or any of the app's own settings) means this isn't a new install.

   Other code asks it one question: SBESS.shows("groups") is true unless Essentials is hiding that feature right now.
   SBESS.on() says whether Essentials is on at all. Unknown names always show, so asking never hides anything by mistake. */
const SBESS = (() => {
  const KEY = "sb:ess";
  // What Essentials hides until it's relevant or switched on, and what turns each one on
  const FEATURES = [
    {id: "notes", kind: "tab", label: "Notes", when: "your first note"},
    {id: "groups", kind: "tab", label: "Groups", when: "joining a study group"},
    {id: "companion", kind: "tab", label: "Companion", when: "opening it from Search"},
    {id: "decks", kind: "review", label: "Flashcard extras", when: "your first deck"},
    {id: "examprep", kind: "today", label: "Exam Prep", when: "an exam in the next 14 days"},
    {id: "crunch", kind: "today", label: "Crunch Forecast", when: "being short of time before a deadline"},
    {id: "companion-lines", kind: "today", label: "Companion lines", when: "opening the Companion", follows: "companion"},
    {id: "plan-extras", kind: "today", label: "Today's Plan extras", when: "Show Everything"},
    {id: "tools", kind: "nav", label: "Calculator and Style", when: "Show Everything"}
  ];
  const BY = Object.fromEntries(FEATURES.map(f => [f.id, f]));
  // Always shown, Essentials or not
  const MAIN = ["board", "plan", "calendar", "timeline", "schedule", "flashcards", "review", "courses", "files", "today", "focus", "search", "settings"];
  const read = () => { try { const s = JSON.parse(localStorage.getItem(KEY) || "null"); return s && typeof s === "object" && typeof s.on === "boolean" ? s : null; } catch (e) { return null; } };
  const write = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };
  // Any trace of an earlier run: a saved planner with anything in it, or any of the app's own keys
  function earlierRun(){
    try {
      const raw = localStorage.getItem("coursework:v2");
      if (raw) {
        const s = JSON.parse(raw) || {}, n = o => Array.isArray(o) ? o.length : o && typeof o === "object" ? Object.keys(o).length : 0;
        if (["tasks", "courses", "decks", "notes", "events", "files"].some(k => n(s[k]) > 0)) return true;
      }
      for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i) || ""; if (/^(coursework|studyboard|studioso|sb|device)[:-]/.test(k)) return true; }
      return false;
    } catch (e) { return true; }   // can't tell: keep everything, as before
  }
  let S = read();
  if (!S) { const old = earlierRun(); S = {on: !old, why: old ? "existing" : "new", at: Date.now(), unl: {}, said: {}}; write(); }
  S.unl = S.unl || {}; S.said = S.said || {};
  const subs = [];
  function mark(){ try { if (S.on) document.documentElement.dataset.ess = "on"; else delete document.documentElement.dataset.ess; } catch (e) {} }
  mark();
  function changed(what){
    mark();
    subs.slice().forEach(fn => { try { fn(what, api.state()); } catch (e) { console.warn("essentials", e); } });
    try { window.dispatchEvent(new CustomEvent("sb:essentials", {detail: what})); } catch (e) {}
  }
  const unlocked = id => { const f = BY[id]; return !!(S.unl[id] || (f && f.follows && S.unl[f.follows])); };
  const api = {
    // Is Essentials on?
    on: () => S.on,
    // Should this feature show right now? (true when Essentials is off, for the main tabs, for anything unlocked, and for names it doesn't know)
    shows: id => !S.on || MAIN.includes(id) || !BY[id] || unlocked(id),
    // Has this feature been turned on by being relevant (or opened from Search)?
    unlocked,
    // Turn a feature on. Returns true the first time. {by} says why ("deck", "search", "exam" ...)
    unlock(id, o){
      if (!BY[id] || S.unl[id]) return false;
      S.unl[id] = {at: Date.now(), by: (o && o.by) || ""}; write(); changed({unlock: id, by: S.unl[id].by, quiet: !!(o && o.quiet)});
      return true;
    },
    // Essentials on or off. why: "user" (Settings or More), "account" (signed in to a planner already in use)
    set(on, why){
      on = !!on; if (on === S.on) return false;
      S.on = on; S.why = why || "user"; S.setAt = Date.now(); write(); changed({set: on, why: S.why});
      return true;
    },
    // One-time messages (each unlock is announced once): said(k) asks, said(k, true) records it
    said(k, now){ if (now) { if (!S.said[k]) { S.said[k] = Date.now(); write(); } return true; } return !!S.said[k]; },
    features: () => FEATURES.map(f => Object.assign({}, f, {unlocked: unlocked(f.id), shows: api.shows(f.id)})),
    feature: id => BY[id] ? Object.assign({}, BY[id], {unlocked: unlocked(id), shows: api.shows(id)}) : null,
    state: () => JSON.parse(JSON.stringify(S)),
    // Called with ({unlock|set}, state) whenever something changes; returns a function that stops it
    subscribe(fn){ subs.push(fn); return () => { const i = subs.indexOf(fn); if (i >= 0) subs.splice(i, 1); }; },
    MAIN: MAIN.slice()
  };
  return api;
})();
window.SBESS = SBESS;
