/* ===== module: 01-focus-sprout.js: Focus Sprout, the Focus Garden, and Block Distracting Apps on phones ===== */
/* 1. Focus Sprout (free, every platform): a seedling in the Focus timer's dial grows through five stages (seed, sprout,
      seedling, young plant, in bloom) as a focus session runs. Only time spent in Studyboard counts: leaving the app or tab pauses
      the growth (absences under 5 seconds are ignored), and coming back says "Welcome back. Your sprout waited for you."
      Strict Sprout (Timer Settings, off by default) wilts it instead after 60 seconds away; it stays wilted for that session.
      The sprout being grown lives on this device only ("studioso:sprout"), so a reload carries on where it was.
   2. Focus Garden: a finished focus session plants its sprout (at the stage it reached, or as a dry sprout) on the week's shelf,
      in its course's colour. Kept in state.settings.garden next to the other focus stats (SBSTATS: state.settings.focusDays):
      {"YYYY-MM-DD": ["5bio", "3", "wpsy"]}, the stage (1 to 5, or w for wilted) then the course id, for the last 9 weeks.
      Shown in the Focus sheet and in Insights > This Week, only once there is something on it.
   3. Block Distracting Apps (phone apps, opt in, Timer Settings): calls window.StudyboardNative.focusGuard, which native-bridge.js
      defines only when the phone app has the plugin. Android turns on Do Not Disturb; iPhone shields the apps chosen with
      Choose Apps (Screen Time). start({until, apps, dnd}) when a focus session runs, stop() when it pauses, stops or ends.
      The row is hidden when the plugin is missing or says neither is available. The choice is kept on this device
      ("studioso:focusguard"), since it depends on the phone. The desktop's site blocking (99-pro.js) is separate. */
var SBSPROUT = (() => {
  const LS = "studioso:sprout", GLS = "studioso:focusguard", GRACE = 5000, WILT = 60000, KEEP_DAYS = 63, PER_DAY = 24;
  const STAGE = ["", "seed", "sprout", "seedling", "young plant", "in bloom"];
  const lsGet = k => { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch (e) { return null; } };
  const lsSet = (k, v) => { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  const p2 = n => String(n).padStart(2, "0");
  const dayOf = ms => { const d = new Date(ms); return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`; };
  const cfg = () => Object.assign({strict: false}, state.settings && state.settings.sprout);
  const active = () => pomo.mode === "focus" && (pomo.running || pomo.left > 0);
  const running = () => pomo.mode === "focus" && pomo.running;

  /* ---------- The sprout being grown ---------- */
  // {len: session length (ms), endAt, away: ms away counted so far, hidAt: when the page was left (0 when here), wilted}
  let sp = lsGet(LS);
  if (sp && typeof sp !== "object") sp = null;
  const save = () => lsSet(LS, sp);
  const pending = (s, now) => s && s.hidAt ? Math.max(0, Math.min(now, Number(s.endAt) || now) - s.hidAt) : 0;
  function progress(now){
    if (!sp) return 0;
    now = now || Date.now();
    const len = Math.max(60000, Number(sp.len) || pomoLen());
    // a finished session has run its whole length
    const left = !active() ? 0 : pomo.running ? Math.max(0, pomo.endAt - now) : pomo.left;
    const done = len - Math.min(len, left), away = (Number(sp.away) || 0) + pending(sp, now);
    return Math.max(0, Math.min(1, (done - away) / len));
  }
  // five stages over the session: the bloom opens for the last fifth
  const stageOf = p => Math.max(1, Math.min(5, 1 + Math.floor(p * 5 + 1e-9)));
  const stageNow = () => sp && sp.wilted ? "w" : sp ? stageOf(progress()) : 1;
  const courseIdOf = id => { const t = id && state.tasks && state.tasks[id]; return t && t.courseId && courseOf(t.courseId) ? t.courseId : ""; };
  const potOf = cid => cid && courseOf(cid) ? colorOf(cid) : "";
  // Time away is added on coming back, once it's over 5 seconds
  function settle(now){
    if (!sp || !sp.hidAt) return 0;
    const gone = pending(sp, now); sp.hidAt = 0;
    if (gone >= GRACE) {
      sp.away = (Number(sp.away) || 0) + gone;
      if (cfg().strict && gone >= WILT) sp.wilted = true;
    }
    save();
    return gone >= GRACE ? gone : 0;
  }
  function sync(){
    if (active()) {
      if (!sp || Number(sp.len) !== pomoLen()) { sp = {len: pomoLen(), endAt: pomo.running ? pomo.endAt : 0, away: 0, hidAt: 0, wilted: false}; save(); }
      else if (pomo.running && sp.endAt !== pomo.endAt) { sp.endAt = pomo.endAt; save(); }
      if (!pomo.running && sp.hidAt) settle(Date.now());
    } else if (sp) {
      // a finished session plants it first ("end" comes right after the timer stops): only a stopped one is dropped here
      const was = sp; setTimeout(() => { if (sp === was && !active()) { sp = null; save(); } }, 0);
    }
  }
  function leave(){ if (sp && running() && !sp.hidAt) { sp.hidAt = Date.now(); save(); } }
  let NOTE = null;
  function back(quiet){
    if (!sp || !sp.hidAt) return;
    const wasWilted = !!sp.wilted, gone = settle(Date.now());
    // the session ended while away: the alarm says what happened
    if (!gone || !active() || (pomo.running && Date.now() >= pomo.endAt)) return;
    if (sp.wilted && !wasWilted) note("wilt", quiet);
    else if (!sp.wilted) note("back", quiet);
    draw(true);
  }
  const NOTES = {back: "Welcome back. Your sprout waited for you.", wilt: "Your sprout wilted while you were away. It keeps its spot on your shelf, and a new seed is ready next session."};
  function note(kind, quiet){
    NOTE = {kind, until: Date.now() + 15000};
    // the timer sheet shows it under the dial; otherwise a toast
    if (!quiet && !$("#pomoDlg").open) toast(NOTES[kind]);
    const n = document.getElementById("spNote"); if (n) { n.textContent = NOTES[kind]; n.hidden = false; }
  }
  document.addEventListener("visibilitychange", () => { if (document.hidden) leave(); else back(); });
  window.addEventListener("pagehide", leave);

  /* ---------- Planting ---------- */
  const garden = () => { const g = state.settings && state.settings.garden; return g && typeof g === "object" ? g : {}; };
  function finalPlant(){
    if (!sp) return null;
    const p = progress(), st = sp.wilted ? "w" : stageOf(p);
    return {stage: st, courseId: courseIdOf(pomo.taskId)};
  }
  function plant(code, day){
    const g = Object.assign({}, garden()), cut = addDays(todayISO(), -KEEP_DAYS);
    g[day] = (Array.isArray(g[day]) ? g[day] : []).concat([code]).slice(-PER_DAY);
    Object.keys(g).forEach(k => { if (!/^\d{4}-\d{2}-\d{2}$/.test(k) || k < cut) delete g[k]; });
    state.settings = Object.assign({}, state.settings, {garden: g}); saveSettings();
  }
  hook("focus", e => {
    if (!e || e.type !== "end" || e.mode !== "focus" || !sp) return;
    const end = Math.min(Date.now(), Number(sp.endAt) || Date.now());
    if (sp.hidAt) settle(end);
    const f = finalPlant();
    sp = null; save(); NOTE = null;
    if (!f) return;
    try { plant(`${f.stage}${f.courseId}`, dayOf(end)); } catch (err) { console.warn("garden", err); }
    fire("garden", f);
    if ($("#pomoDlg").open) renderPomo();
  });
  hook("focus-state", () => { sync(); guardSync(); });

  /* ---------- Drawing ---------- */
  // A leaf pointing right from (0,0), about 10.5 long
  const LEAF = "M0 0C2.5-4.2 7.5-5 10.5-3.2C8 .8 3.6 2.2 0 0Z";
  const leaf = (x, y, a, s, left, cls) => `<g transform="translate(${x} ${y})${left ? " scale(-1 1)" : ""} rotate(${a}) scale(${s})"><path class="${cls || "sp-leaf"}" d="${LEAF}"/><path class="sp-rib" d="M.8 -.2C3.6-1.4 6.4-2.1 9.2-2.6"/></g>`;
  const stem = (d, cls) => `<path class="${cls || "sp-stem"}" d="${d}"/>`;
  const POT = `<path class="sp-pot" d="M9.6 37H30.4L28.6 45.4Q28.3 47 26.7 47H13.3Q11.7 47 11.4 45.4Z"/><path class="sp-shade" d="M24.5 37H30.4L28.6 45.4Q28.3 47 26.7 47H23.2Z"/><rect class="sp-rim" x="7.2" y="32.4" width="25.6" height="5.4" rx="2.2"/><rect class="sp-hi" x="9" y="33.5" width="9" height="1.2" rx=".6"/><ellipse class="sp-soil" cx="20" cy="32.6" rx="11.2" ry="1.7"/>`;
  const ART = {
    1: `<ellipse class="sp-seed" cx="20" cy="31.2" rx="2.7" ry="1.9" transform="rotate(-18 20 31.2)"/><path class="sp-stem" d="M20.9 30C21.3 28.7 22.1 27.9 23.2 27.6"/>`,
    2: stem("M20 32.4C20 30 19.8 28.2 20 26.4") + leaf(20, 26.6, -28, .5, true) + leaf(20, 26.6, -28, .5, false),
    3: stem("M20 32.4C20 28.6 19.1 24.8 20 20.6") + leaf(20, 21, -24, .82, true) + leaf(20, 21, -30, .9, false),
    4: stem("M20 32.4C20 27 19.2 21 20 14.4") + leaf(19.9, 25.6, -12, .8, true) + leaf(19.9, 24.2, -16, .86, false) + leaf(20, 15, -30, .62, true) + leaf(20, 15, -34, .66, false) + `<ellipse class="sp-bud" cx="20" cy="13.4" rx="1.7" ry="2.3"/>`,
    5: stem("M20 32.4C20 26 19.2 19 20 12.6") + leaf(19.9, 26.6, -10, .84, true) + leaf(19.9, 25.2, -14, .9, false) + leaf(19.9, 20.4, -24, .56, true) + leaf(19.9, 19.6, -28, .6, false)
      + [0, 72, 144, 216, 288].map(a => `<ellipse class="sp-petal" cx="20" cy="6.4" rx="2.8" ry="3.7" transform="rotate(${a} 20 10.2)"/>`).join("") + `<circle class="sp-eye" cx="20" cy="10.2" r="2.3"/>`,
    w: stem("M20 32.4C20 27.4 20.6 23.6 23.4 22.2C25.4 21.2 27.2 22.4 27.4 24.6", "sp-stem dry") + leaf(20.2, 27.2, 34, .8, true, "sp-leaf dry") + leaf(20.6, 25.4, 40, .76, false, "sp-leaf dry") + `<ellipse class="sp-seed dry" cx="27.5" cy="26.2" rx="1.5" ry="2"/>`
  };
  function plantSvg(stage, color, cls){
    const st = ART[stage] ? stage : 1;
    return `<svg class="sp-plant ${cls || ""} s-${st}" viewBox="0 0 40 48" aria-hidden="true" focusable="false"${color ? ` style="--pot:${esc(color)}"` : ""}>${POT}${ART[st]}</svg>`;
  }
  const stageWord = st => st === "w" ? "a dry sprout" : st === 5 ? "in bloom" : `a ${STAGE[st]}`;
  const ariaNow = st => st === "w" ? "Your sprout wilted this session" : `Your sprout: ${STAGE[st]}, stage ${st} of 5`;
  // In the timer's dial (focus mode only)
  function dialHtml(){
    if (pomo.mode !== "focus") return "";
    const st = stageNow(), color = potOf(courseIdOf(pomo.taskId));
    return `<span class="sp-dial${st === "w" ? " wilted" : ""}" id="spDial" role="img" aria-label="${esc(ariaNow(st))}" data-k="${st}" data-c="${esc(color)}">${plantSvg(st, color)}</span>`;
  }
  function noteHtml(){
    const on = pomo.mode === "focus" && NOTE && NOTE.until > Date.now();
    return `<p class="sp-note" id="spNote" role="status"${on ? "" : " hidden"}>${on ? esc(NOTES[NOTE.kind]) : ""}</p>`;
  }
  // Keeps the dial's sprout up to date (a full redraw of the sheet isn't needed for it)
  function draw(force){
    const el = document.getElementById("spDial"); if (!el) return;
    const st = String(stageNow()), color = potOf(courseIdOf(pomo.taskId));
    if (!force && el.dataset.k === st && el.dataset.c === color) return;
    const grew = el.dataset.k !== st;
    el.dataset.k = st; el.dataset.c = color;
    el.innerHTML = plantSvg(st === "w" ? "w" : Number(st), color, grew ? "sp-new" : "");
    el.classList.toggle("wilted", st === "w");
    el.setAttribute("aria-label", ariaNow(st === "w" ? "w" : Number(st)));
    const n = document.getElementById("spNote");
    if (n && !n.hidden && !(NOTE && NOTE.until > Date.now())) { n.hidden = true; n.textContent = ""; }
  }
  setInterval(() => { if (pomo.mode === "focus" && document.getElementById("spDial")) draw(); }, 1000);

  // The alarm at the end of a focus session shows what was grown (called before it's planted)
  function alarmArt(){
    const f = finalPlant(); if (!f) return "";
    return plantSvg(f.stage, potOf(f.courseId), "sp-alarm");
  }
  function alarmLine(){
    const f = finalPlant(); if (!f) return "";
    return f.stage === "w" ? "Your dry sprout is on your Focus Garden shelf. A new seed is ready next session."
      : f.stage === 5 ? "Your sprout bloomed. It's on your Focus Garden shelf." : `Your sprout grew into ${stageWord(f.stage)}. It's on your Focus Garden shelf.`;
  }

  /* ---------- The week's shelf ---------- */
  const weekDays = () => { const t = todayISO(), mon = addDays(t, -((parse(t).getDay() + 6) % 7)); return [0, 1, 2, 3, 4, 5, 6].map(i => addDays(mon, i)); };
  const decode = code => { const s = String(code || ""), c = s.charAt(0); return {stage: c === "w" ? "w" : Math.max(1, Math.min(5, Number(c) || 1)), courseId: s.slice(1)}; };
  const nOf = (n, one, many) => `${n} ${n === 1 ? one : many}`;
  function weekData(){
    const g = garden(), days = weekDays();
    const cols = days.map(d => ({d, list: (Array.isArray(g[d]) ? g[d] : []).map(decode)}));
    const all = cols.flatMap(c => c.list), dry = all.filter(x => x.stage === "w").length;
    return {cols, n: all.length, grown: all.length - dry, dry, bloom: all.filter(x => x.stage === 5).length};
  }
  function summary(W){
    const bits = [];
    if (W.grown) bits.push(nOf(W.grown, "plant", "plants"));
    if (W.dry) bits.push(nOf(W.dry, "dry sprout", "dry sprouts"));
    return bits.join(" and ") + " this week";
  }
  function gardenHtml(where){
    const W = weekData(); if (!W.n) return "";
    const today = todayISO(), MAX = 3;
    const cols = W.cols.map(c => {
      const shown = c.list.slice(0, MAX), more = c.list.length - shown.length, wd = parse(c.d).toLocaleDateString(undefined, {weekday: "narrow"});
      return `<span class="sg-day${c.d === today ? " sg-today" : ""}${c.list.length > 2 ? " sg-many" : c.list.length === 2 ? " sg-two" : ""}"><span class="sg-pots">${shown.map(x => plantSvg(x.stage, potOf(x.courseId), "sg-p")).join("")}</span>${more > 0 ? `<span class="sg-more">+${more}</span>` : ""}<span class="sg-lbl">${esc(wd)}</span></span>`;
    }).join("");
    const aria = `Focus Garden: ${summary(W)}. ` + W.cols.filter(c => c.list.length).map(c => `${parse(c.d).toLocaleDateString(undefined, {weekday: "long"})}: ${c.list.length}`).join(", ") + ".";
    const head = `<div class="sg-head"><h3>Focus Garden</h3><span class="sg-sum">${esc(summary(W))}</span></div>`;
    const shelf = `<div class="sg-shelf" role="img" aria-label="${esc(aria)}">${cols}</div>`;
    return where === "ins" ? `<section class="pro-card sp-garden in-ins">${head}${shelf}<p class="mini" style="margin:0">One plant for each finished Focus timer session, in its course's colour.</p></section>`
      : `<section class="sp-garden">${head}${shelf}</section>`;
  }

  /* ---------- Settings: Strict Sprout and Block Distracting Apps ---------- */
  const guardApi = () => { const N = window.StudyboardNative; return N && N.focusGuard && typeof N.focusGuard.start === "function" ? N.focusGuard : null; };
  const gGet = () => Object.assign({on: false, picked: false, until: 0}, lsGet(GLS) || {});
  const gSet = patch => { const g = Object.assign(gGet(), patch); lsSet(GLS, g); return g; };
  let AV = null, avAt = 0;   // what the plugin says is available: {dnd, apps}
  function refreshAvail(force){
    const G = guardApi(); if (!G) { AV = null; return Promise.resolve(null); }
    if (!force && AV && Date.now() - avAt < 30000) return Promise.resolve(AV);
    avAt = Date.now();
    return Promise.resolve().then(() => G.available()).then(r => {
      const was = JSON.stringify(AV); AV = {dnd: !!(r && r.dnd), apps: !!(r && r.apps)};
      if (JSON.stringify(AV) !== was) { drawGuard(); guardSync(); }
      return AV;
    }, () => { AV = {dnd: false, apps: false}; drawGuard(); return AV; });
  }
  const canGuard = () => !!(guardApi() && AV && (AV.dnd || AV.apps));
  function guardRowHtml(){
    if (!canGuard()) return "";
    const g = gGet(), onlyApps = AV.apps && !AV.dnd;
    const what = AV.dnd && !AV.apps ? "Turns on Do Not Disturb while you focus. It goes back to how it was when the session ends, or when you pause or stop."
      : onlyApps ? "Blocks the apps you choose while you focus. They open again when the session ends, or when you pause or stop."
      : "Turns on Do Not Disturb and blocks the apps you choose while you focus, until the session ends or you pause or stop.";
    return `<div class="fg-row"><label class="mi-check"><input type="checkbox" id="psGuard" ${g.on ? "checked" : ""}> Block distracting apps</label>
      <p class="mini">${esc(what)}${AV.apps ? ` <button type="button" class="link-btn" data-act="fg-pick">${g.picked ? "Change Apps" : "Choose Apps"}</button>` : ""}</p></div>`;
  }
  function drawGuard(){ const s = document.getElementById("fgSlot"); if (s) s.innerHTML = guardRowHtml(); }
  function settingsHtml(){
    const c = cfg();
    if (guardApi()) refreshAvail();
    return `<div class="sp-set"><label class="mi-check"><input type="checkbox" id="psStrict" ${c.strict ? "checked" : ""}> Strict Sprout</label>
      <p class="mini">Your sprout wilts if you leave Studyboard for more than a minute during a focus session. When it's off, leaving just pauses the growth.</p></div>
      <div class="fg-slot" id="fgSlot">${guardRowHtml()}</div>`;
  }
  const hhmm = ms => new Date(ms).toLocaleTimeString(undefined, {hour: "numeric", minute: "2-digit"});
  let gBusy = false;
  function guardSync(){
    const G = guardApi(); if (!G || !AV || gBusy) return;
    const g = gGet(), apps = !!(AV.apps && g.picked), dnd = !!AV.dnd;
    const want = g.on && (apps || dnd) && running() && pomo.endAt > Date.now() + 5000;
    if (want && g.until !== pomo.endAt) {
      const until = pomo.endAt; gSet({until}); gBusy = true;
      Promise.resolve().then(() => G.start({until, apps, dnd})).then(ok => {
        gBusy = false;
        if (ok) toast(dnd && !apps ? `Do Not Disturb is on until ${hhmm(until)}.` : `Distracting apps are blocked until ${hhmm(until)}.`);
        else { gSet({until: 0}); toast(dnd && !apps ? "Do Not Disturb wasn't turned on. Studyboard may need permission in your phone's settings." : "Apps weren't blocked this time."); }
        guardSync();
      }, () => { gBusy = false; gSet({until: 0}); toast("Couldn't block apps this time."); });
    } else if (!want && g.until) {
      gSet({until: 0}); gBusy = true;
      Promise.resolve().then(() => G.stop()).then(() => { gBusy = false; guardSync(); }, () => { gBusy = false; });
    }
  }
  function pickApps(){
    const G = guardApi(); if (!G || typeof G.pickApps !== "function") return Promise.resolve(false);
    return Promise.resolve().then(() => G.pickApps()).then(ok => { if (ok) gSet({picked: true}); return !!ok; }, () => false);
  }
  document.addEventListener("change", e => {
    const t = e.target; if (!t || !t.id) return;
    if (t.id === "pomoTask") draw();   // the pot takes the new task's course colour
    else if (t.id === "psStrict") {
      state.settings = Object.assign({}, state.settings, {sprout: Object.assign({}, cfg(), {strict: !!t.checked})}); saveSettings();
      toast(t.checked ? "Strict Sprout is on. Your sprout wilts after a minute away." : "Strict Sprout is off. Leaving just pauses your sprout.");
    } else if (t.id === "psGuard") {
      if (!t.checked) { gSet({on: false}); guardSync(); toast("Apps won't be blocked during focus sessions."); drawGuard(); return; }
      const g = gGet();
      if (AV && AV.apps && !AV.dnd && !g.picked) {
        pickApps().then(ok => {
          if (ok) { gSet({on: true}); toast("Your chosen apps will be blocked during focus sessions."); }
          else toast("No apps were chosen, so nothing will be blocked.");
          drawGuard(); guardSync();
        });
        return;
      }
      gSet({on: true}); drawGuard(); guardSync();
      toast(AV && AV.dnd && !AV.apps ? "Do Not Disturb will turn on during focus sessions." : "Your chosen apps will be blocked during focus sessions.");
    }
  });
  hook("act", act => {
    if (act !== "fg-pick") return false;
    pickApps().then(ok => { if (ok) toast("Apps chosen."); drawGuard(); guardSync(); });
    return true;
  });
  hook("boot", () => setTimeout(() => {
    sync(); back();   // reopened after being closed mid-session
    // a block left on from a session that has ended (the app was closed) is cleared once the plugin answers
    if (guardApi()) refreshAvail(true).then(() => guardSync());
  }, 0));

  const api = {dialHtml, noteHtml, gardenHtml, settingsHtml, alarmArt, alarmLine, plantSvg, weekData};
  if (window.__SB_TEST) window.__sbSprout = Object.assign({get sp(){ return sp; }, progress, stageNow, settle, back, leave, refreshAvail, guardSync, get avail(){ return AV; }}, api);
  return api;
})();
