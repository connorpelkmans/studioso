/* ===== module: 01-focus.js: the app's core, the Pomodoro focus timer ===== */
/* Pomodoro focus timer */
const POMO_HOW = `<ol><li><b>Pick one task</b> and start a 25-minute focus session (one "pomodoro").</li><li><b>Work only on that task</b> until the timer rings. If something else comes up, jot it down for later.</li><li><b>Take a 5-minute break.</b> Stand up, stretch, get water: anything but work.</li><li><b>After four sessions, take a longer break</b> of 15 to 30 minutes.</li></ol><p>Short, timed bursts make it easier to start and keep your focus fresh, and counting sessions shows how long things really take. Studyboard's Classic routine uses these times. The method was created by Francesco Cirillo in the late 1980s.</p>`;
const POMO_DEF = {focus: 25, short: 5, long: 15, every: 4, autoBreak: true, autoFocus: false, sound: "chime", volume: 0.8, notify: true};
const POMO_LS = "studioso:pomo";
const MODE_LABEL = {focus: "Focus", short: "Short Break", long: "Long Break"};
const TOMATO = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M12 7.2c-4.6 0-8 2.9-8 6.7C4 17.8 7.6 21 12 21s8-3.2 8-7.1c0-3.8-3.4-6.7-8-6.7z" fill="currentColor"/><path d="M12 7.5V4.2M12 6.6c-1.4-1.6-3.4-1.9-4.8-1.3 1.2.4 2.4 1.3 3 2.6M12 6.6c1.4-1.6 3.4-1.9 4.8-1.3-1.2.4-2.4 1.3-3 2.6" fill="none" stroke="var(--leaf,#1E9E74)" stroke-width="1.8" stroke-linecap="round"/></svg>';
const pomoCfg = () => Object.assign({}, POMO_DEF, (state.settings && state.settings.pomo) || {});
function pomoLoad(){
  const base = {mode: "focus", running: false, endAt: 0, left: 0, cycle: 0, taskId: "", day: "", sessions: 0, minutes: 0};
  try { return Object.assign(base, JSON.parse(localStorage.getItem(POMO_LS) || "{}")); } catch(e) { return base; }
}
let pomo = pomoLoad(), pomoTimer = null;
const modeMs = m => m === "focus" && Number(pomo.preset) > 0 ? Number(pomo.preset) * 60000 : Math.max(1, Number(pomoCfg()[m === "focus" ? "focus" : m === "short" ? "short" : "long"]) || 1) * 60000;
const pomoLeft = () => pomo.running ? Math.max(0, pomo.endAt - Date.now()) : (pomo.left > 0 ? pomo.left : modeMs(pomo.mode));
const fmtClock = ms => { const s = Math.ceil(ms / 1000), m = Math.floor(s / 60); return `${m}:${String(s % 60).padStart(2, "0")}`; };
function pomoSave(){ try { localStorage.setItem(POMO_LS, JSON.stringify(pomo)); } catch(e) {} }
function pomoToday(){ if (pomo.day !== todayISO()) { pomo.day = todayISO(); pomo.sessions = 0; pomo.minutes = 0; } }
const inFrame = (() => { try { return window.self !== window.top; } catch(e) { return true; } })();
const notifySupported = () => "Notification" in window && !inFrame;

/* Sound: generated in the browser, so it works offline and needs no files */
let AC = null, alarmOsc = [], alarmGain = null, flashT = null;
function audio(){
  try {
    if (!AC) { const C = window.AudioContext || window.webkitAudioContext; if (!C) return null; AC = new C(); }
    if (AC.state === "suspended") AC.resume();
  } catch(e) { AC = null; }
  return AC;
}
function tone(ac, dest, t, freq, dur, type, gain){
  const o = ac.createOscillator(), g = ac.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), t + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(dest); o.start(t); o.stop(t + dur + 0.05); alarmOsc.push(o);
}
const SOUNDS = {
  chime:   {label: "Chime",        play: (ac, d, t, v) => { [[1318.5, 0], [1046.5, .24], [1568, .48]].forEach(([f, o]) => { tone(ac, d, t + o, f, 1.3, "sine", .55 * v); tone(ac, d, t + o, f * 2, .7, "sine", .12 * v); }); return 2.0; }},
  bell:    {label: "School bell",  play: (ac, d, t, v) => { for (let i = 0; i < 10; i++) { tone(ac, d, t + i * .09, 1250, .08, "square", .12 * v); tone(ac, d, t + i * .09, 1870, .06, "triangle", .08 * v); } return 1.2; }},
  digital: {label: "Alarm clock",  play: (ac, d, t, v) => { for (let i = 0; i < 4; i++) tone(ac, d, t + i * .17, 988, .1, "square", .2 * v); return 1.3; }},
  gentle:  {label: "Gentle rise",  play: (ac, d, t, v) => { [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(ac, d, t + i * .26, f, 1.5, "triangle", .38 * v)); return 2.6; }}
};
function playAlarm(name, vol, repeats){
  stopAlarm();
  const ac = audio(); if (!ac) return false;
  alarmGain = ac.createGain(); alarmGain.gain.value = 1; alarmGain.connect(ac.destination);
  let t = ac.currentTime + 0.05; const s = SOUNDS[name] || SOUNDS.chime;
  for (let r = 0; r < repeats; r++) t += s.play(ac, alarmGain, t, Math.max(0.05, Math.min(1, vol))) + 0.6;
  return true;
}
function stopAlarm(){
  alarmOsc.forEach(o => { try { o.stop(); } catch(e) {} }); alarmOsc = [];
  if (alarmGain) { try { alarmGain.disconnect(); } catch(e) {} alarmGain = null; }
  clearInterval(flashT); flashT = null; setTitle();
}

/* Timer */
function pomoSchedule(){
  clearTimeout(pomoTimer);
  if (pomo.running) pomoTimer = setTimeout(pomoFinish, Math.max(0, pomo.endAt - Date.now()) + 30);
}
function pomoStart(){
  audio();
  const cfg = pomoCfg();
  if (cfg.notify && notifySupported() && Notification.permission === "default") { try { Notification.requestPermission().then(() => renderPomo()); } catch(e) {} }
  pomoToday();
  pomo.endAt = Date.now() + pomoLeft(); pomo.left = 0; pomo.running = true;
  pomoSave(); pomoSchedule(); pomoUI(true);
  try {
    const t = pomo.mode === "focus" && pomo.taskId && state.tasks[pomo.taskId];
    if (t && t.status === "todo" && !MILESTONE(t.type)) applyChanges([{kind: "task", id: t.id, after: Object.assign(clone(t), {status: "doing", order: nextOrder("doing")})}], `${t.title} moved to ${STATUS_LABEL.doing}`);
  } catch (e) { console.warn(e); }
  fire("focus", {type: "start", mode: pomo.mode, endAt: pomo.endAt, taskId: pomo.taskId});
}
function pomoPause(){ if (!pomo.running) return; pomo.left = Math.max(1000, pomo.endAt - Date.now()); pomo.pausedAt = Date.now(); pomo.running = false; clearTimeout(pomoTimer); pomoSave(); pomoUI(true); fire("focus", {type: "pause", mode: pomo.mode}); }
// Minutes of a running or paused focus session already done
function pomoElapsedMin(){
  if (pomo.mode !== "focus" || !(pomo.running || pomo.left > 0)) return 0;
  const total = modeMs("focus"), left = Math.min(total, pomo.running ? Math.max(0, pomo.endAt - Date.now()) : pomo.left);
  return Math.max(0, (total - left) / 60000);
}
// Stopping a focus session early
const pomoEarly = (min, why) => {
  const m = Math.min(180, Math.round(Number(min) || 0)); if (m < 1) return;
  const A = accOf();
  if (A) { try { A.early(m, pomo.taskId, why); } catch(e) { console.warn(e); } }
  else { try { if (typeof SBSTATS !== "undefined") SBSTATS.addFocus(m, "timer"); pomoToday(); pomo.minutes += m; pomoSave(); } catch(e) { console.warn(e); } }
  fire("focus", {type: "early", mode: "focus", minutes: m, taskId: pomo.taskId, why});
};
function pomoReset(){ const was = pomo.running, el = pomoElapsedMin(); pomo.preset = 0; pomo.running = false; pomo.left = 0; clearTimeout(pomoTimer); pomoSave(); pomoUI(true); pomoEarly(el, "reset"); if (was) fire("focus", {type: "stop", mode: pomo.mode, taskId: pomo.taskId}); }
function pomoSetMode(m){ const el = pomoElapsedMin(); if (el > 0) pomoEarly(el, m === pomo.mode ? "reset" : "skip"); pomo.mode = m; pomo.preset = 0; pomo.running = false; pomo.left = 0; clearTimeout(pomoTimer); pomoSave(); pomoUI(true); }
// Tapping a mode button: ending a focus session for a break asks first
function pomoPickMode(m){
  if (m === pomo.mode && (pomo.running || pomo.left > 0)) return;
  const el = pomoElapsedMin();
  if (pomo.mode !== "focus" || m === "focus" || el < 1) { pomoSetMode(m); return; }
  askBox({title: "End This Focus Session?", text: `You've focused for ${fmtMins(el)}. Switching to a break ends this session. The time you focused is kept.`, yes: `Start ${MODE_LABEL[m]}`, no: "Keep Focusing"})
    .then(ok => { if (ok) { pomoSetMode(m); pomoStart(); } });
}
function pomoSkip(){ const next = pomo.mode === "focus" ? ((pomo.cycle + 1) % pomoCfg().every === 0 ? "long" : "short") : "focus"; if (pomo.mode === "long") pomo.cycle = 0; pomoSetMode(next); }
function pomoFinish(missed){
  if (!pomo.running) return;
  const cfg = pomoCfg(), done = pomo.mode, fm = done === "focus" && Number(pomo.preset) > 0 ? Number(pomo.preset) : Number(cfg.focus) || 25;
  pomo.running = false; pomo.left = 0; pomo.preset = 0; clearTimeout(pomoTimer);
  pomoToday();
  if (done === "focus") {
    pomo.cycle++; pomo.sessions++; pomo.minutes += fm;
    const t = pomo.taskId && state.tasks[pomo.taskId];
    if (t) {
      const n = clone(t); n.pomos = (Number(n.pomos) || 0) + 1; n.focusMin = (Number(n.focusMin) || 0) + fm;
      n.history = (n.history || []).concat({at: Date.now(), text: `Focus session: ${fm}m`}).slice(-30);
      applyChanges([{kind: "task", id: t.id, after: n}], null);
    }
  }
  const next = done === "focus" ? (pomo.cycle % (Number(cfg.every) || 4) === 0 ? "long" : "short") : "focus";
  if (done === "long") pomo.cycle = 0;
  pomo.mode = next;
  const auto = !missed && ((next !== "focus" && cfg.autoBreak) || (next === "focus" && cfg.autoFocus));
  pomoSave();
  if (auto) { pomo.endAt = Date.now() + modeMs(next); pomo.running = true; pomoSave(); pomoSchedule(); }
  pomoAlarm(done, next, auto, missed);
  pomoUI(true);
  fire("focus", {type: "end", mode: done, minutes: done === "focus" ? fm : 0, next, auto, missed: !!missed, taskId: done === "focus" ? pomo.taskId : ""});
}
function pomoAlarm(done, next, auto, missed){
  const cfg = pomoCfg();
  const title = done === "focus" ? "Focus session complete" : "Break's over";
  const body = done === "focus" ? `Nice work. ${auto ? "Your" : "Time for a"} ${next === "long" ? `${cfg.long}-minute long break` : `${cfg.short}-minute break`}${auto ? " has started" : ""}.` : `${auto ? "Your next focus session has started." : "Ready for the next focus session?"}`;
  if (!missed) {
    playAlarm(cfg.sound, Number(cfg.volume), 5);
    if (navigator.vibrate) { try { navigator.vibrate([400, 180, 400, 180, 700]); } catch(e) {} }
    if (cfg.notify && notifySupported() && Notification.permission === "granted") {
      try { const n = new Notification(title, {body, icon: FAVICON, tag: "studioso-pomo", renotify: true, requireInteraction: true}); n.onclick = () => { try { window.focus(); } catch(e) {} n.close(); stopAlarm(); }; } catch(e) {}
    }
    if (document.hidden) { let on = false; clearInterval(flashT); flashT = setInterval(() => { on = !on; document.title = on ? `● ${title}` : "Studyboard"; }, 1000); }
  }
  const t = done === "focus" && pomo.taskId && state.tasks[pomo.taskId], task = t && t.status !== "done" ? t : null;
  const short = task ? (task.title.length > 30 ? task.title.slice(0, 29) + "…" : task.title) : "";
  const ad = $("#alarmDlg");
  ad.innerHTML = `<div class="alarm-card ${done === "focus" ? "is-focus" : "is-break"}">
    <div class="alarm-ring" aria-hidden="true">${TOMATO}</div>
    <h2>${missed ? "Your timer finished while Studyboard was closed" : esc(title)}</h2>
    <p>${esc(body)}</p>
    <div class="row-actions">${!auto ? `<button class="btn primary" id="alStart">Start ${esc(MODE_LABEL[next])}</button>` : ""}<button class="btn ${auto ? "primary" : ""}" id="alOk">${auto ? "Got It" : "Not Yet"}</button></div>
    ${task || (auto && next !== "focus") ? `<div class="row-actions alarm-more">${task ? `<button class="btn" id="alDone" data-act="toggle" data-id="${esc(task.id)}">Mark “${esc(short)}” Done</button><button class="btn" id="alAgain">Another Session on It</button>` : ""}${auto && next !== "focus" ? `<button class="btn" id="alSkip">Skip Break</button>` : ""}</div>` : ""}
  </div>`;
  if (!ad.open) { try { ad.showModal(); } catch(e) { ad.setAttribute("open", ""); } }
  const close = () => { stopAlarm(); try { ad.close(); } catch(e) { ad.removeAttribute("open"); } };
  const toFocus = () => { pomo.mode = "focus"; pomo.running = false; pomo.left = 0; pomo.preset = 0; clearTimeout(pomoTimer); pomoSave(); };
  $("#alOk").addEventListener("click", close);
  const st = $("#alStart"); if (st) st.addEventListener("click", () => { close(); pomoStart(); });
  const dn = $("#alDone"); if (dn) dn.addEventListener("click", () => { close(); if (pomo.taskId === task.id) { pomo.taskId = ""; pomoSave(); pomoUI(true); } });
  const ag = $("#alAgain"); if (ag) ag.addEventListener("click", () => { close(); toFocus(); pomo.taskId = task.id; pomoStart(); });
  const sk = $("#alSkip"); if (sk) sk.addEventListener("click", () => { close(); toFocus(); pomoUI(true); openPomo(); });
  ad.addEventListener("cancel", stopAlarm, {once: true});
}
function setTitle(){
  if (flashT) return;
  document.title = pomo.running ? `${fmtClock(pomoLeft())} ${MODE_LABEL[pomo.mode]} · Studyboard` : "Studyboard";
}
// Light updates every half second; a full redraw only when something changes
let lastSig = "";
function pomoUI(full){
  const left = pomoLeft(), total = pomo.running ? modeMs(pomo.mode) : modeMs(pomo.mode), sig = [pomo.mode, pomo.running, pomo.taskId, pomo.cycle].join("|");
  if (full || sig !== lastSig) { lastSig = sig; renderPomoBits(); if ($("#pomoDlg").open) renderPomo(); }
  const clock = fmtClock(left), frac = Math.max(0, Math.min(1, left / total));
  $$("[data-pomo-time]").forEach(el => { el.textContent = clock; });
  const ring = $("#pomoRing"); if (ring) ring.style.strokeDashoffset = String(ring.dataset.c * (1 - frac));
  setTitle();
}
function renderPomoBits(){
  const active = pomo.running || pomo.left > 0;
  const btn = $("#pomoBtn");
  btn.className = `pomo-btn ${active ? "active" : ""} ${pomo.running ? "run" : ""} m-${pomo.mode}`;
  btn.setAttribute("aria-label", active ? `${MODE_LABEL[pomo.mode]} timer, ${pomo.running ? "running" : "paused"}. Open focus timer` : "Open focus timer");
  $("#pomoBtnTime").hidden = !active;
  const nav = $("#navPomo");
  nav.className = `nav-focus m-${pomo.mode} ${active ? "active" : ""} ${pomo.running ? "run" : ""}`;
  nav.setAttribute("aria-label", btn.getAttribute("aria-label"));
  nav.innerHTML = `${TOMATO}<span class="nf-l" ${active ? "data-pomo-time" : ""}>${active ? fmtClock(pomoLeft()) : "Focus"}</span>${active ? `<span class="nf-m">${esc(MODE_LABEL[pomo.mode])}${pomo.running ? "" : ", paused"}</span>` : ""}`;
  try { islandSync(); } catch (e) {}
}
// iPhone app: while the timer runs, it shows in the Dynamic Island and on the Lock Screen
const ISLAND = {sig: "", on: false};
function islandSync(){
  const FA = window.StudyboardNative && window.StudyboardNative.focusActivity;
  if (!FA) return;
  const active = pomo.running || pomo.left > 0;
  if (!active) { if (ISLAND.sig) { ISLAND.sig = ""; FA.end(); } islandOn(false); return; }
  const t = pomo.taskId && state.tasks[pomo.taskId];
  let accent = ""; try { accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim(); } catch (e) {}
  const st = {mode: pomo.mode, label: MODE_LABEL[pomo.mode], task: t ? t.title : "", running: pomo.running, endsAt: pomo.running ? pomo.endAt : 0,
    left: pomo.running ? 0 : Math.round(pomoLeft() / 1000), total: Math.round(modeMs(pomo.mode) / 1000), accent: /^#[0-9a-f]{6}$/i.test(accent) ? accent : ""};
  const sig = JSON.stringify(st);
  if (sig === ISLAND.sig) return;
  ISLAND.sig = sig;
  FA.show(st).then(ok => { if (ISLAND.sig === sig) islandOn(!!ok); }, () => islandOn(false));
}
function islandOn(on){ ISLAND.on = on; document.documentElement.classList.toggle("sb-island", on); }
function openPomo(taskId){
  if (taskId === undefined && window.SBEXAM) SBEXAM.pomoDefault();
  if (taskId !== undefined) { pomo.taskId = taskId; if (!pomo.running && pomo.mode !== "focus") { pomo.mode = "focus"; pomo.left = 0; } pomoSave(); }
  const d = $("#pomoDlg");
  renderPomo();
  if (!d.open) { d.showModal(); const b = d.querySelector(".pomo-ctl .btn.primary"); if (b) b.focus(); }
}
// Today's totals come from the synced stats, so every device shows the same
function pomoTodayHtml(){
  const today = todayISO(), st = typeof SBSTATS !== "undefined" ? SBSTATS : null;
  const n = st ? st.focusSessions(today, today) : pomo.sessions, min = st ? st.focusMinutes(today, today) : pomo.minutes;
  return `Today: <b>${n}</b> focus session${n === 1 ? "" : "s"}, <b>${fmtMins(min)}</b> focused.${window.SBPRO && SBPRO.pomoHtml && SBPRO.isPro() ? ` <button type="button" class="link-btn" data-act="pro-fh-open">Focus History</button>` : ""}`;
}
hook("stats-focus", () => { const p = $("#pomoDlg .pomo-today"); if (p) p.innerHTML = pomoTodayHtml(); });
function renderPomo(){
  const cfg = pomoCfg(), d = $("#pomoDlg");
  pomoToday();
  const R = 92, C = 2 * Math.PI * R;
  const openTasks = (FOCUS ? FOCUS.ranked.map(x => x.t) : []).concat(tasksArr().filter(t => t.status !== "done").sort(sortTasks)).filter((t, i, a) => a.indexOf(t) === i && t.status !== "done" && (canDoNow(t) || t.id === pomo.taskId));
  const every = Number(cfg.every) || 4, inCycle = pomo.cycle % every;
  const fa = d.contains(document.activeElement) ? document.activeElement : null;
  const keep = !fa ? "" : fa.closest(".pomo-ctl .big") ? ".pomo-ctl .big" : fa.id ? "#" + fa.id : fa.dataset.act ? `[data-act="${fa.dataset.act}"]${fa.dataset.id ? `[data-id="${fa.dataset.id}"]` : ""}` : "";
  const notifyNote = !notifySupported() ? "Desktop notifications aren't available here, so the alarm sound and on-screen alert are used." : Notification.permission === "denied" ? "Notifications are blocked for this site in your browser settings." : Notification.permission === "default" ? "Your browser will ask to allow notifications when you start the timer." : "Notifications are allowed.";
  d.innerHTML = `<div class="sheet pomo-sheet">${bandHead("Focus Timer", TOMATO, pomo.mode === "focus" ? "#E5484D" : "#2F9E5F")}
    <div class="sheet-body">
      <div class="segb pomo-modes" role="group" aria-label="Timer mode">${["focus", "short", "long"].map(m => `<button data-act="pomo-mode" data-id="${m}" aria-pressed="${pomo.mode === m}">${MODE_LABEL[m]}</button>`).join("")}</div>
      <div class="pomo-dial m-${pomo.mode}">
        <svg viewBox="0 0 220 220" aria-hidden="true"><circle cx="110" cy="110" r="${R}" class="track"/><circle id="pomoRing" cx="110" cy="110" r="${R}" class="bar" data-c="${C}" style="stroke-dasharray:${C};stroke-dashoffset:${C * (1 - pomoLeft() / modeMs(pomo.mode))}"/></svg>
        <div class="pomo-read"><span class="pomo-time" data-pomo-time role="timer" aria-live="off">${fmtClock(pomoLeft())}</span><span class="pomo-mode-lbl">${esc(MODE_LABEL[pomo.mode])}${pomo.running ? "" : pomo.left > 0 ? ", paused" : ""}</span></div>
      </div>
      <div class="pomo-cycle" aria-label="${inCycle} of ${every} focus sessions done before a long break">${Array.from({length: every}, (_, i) => `<i class="${i < inCycle ? "on" : ""}"></i>`).join("")}<span>${inCycle} of ${every} before a long break</span></div>
      <div class="pomo-ctl">
        <button class="btn" data-act="pomo-reset" ${pomo.running || pomo.left > 0 ? "" : "disabled"}>Reset</button>
        <button class="btn primary big" data-act="${pomo.running ? "pomo-pause" : "pomo-start"}">${pomo.running ? "Pause" : pomo.left > 0 ? "Resume" : `Start ${esc(MODE_LABEL[pomo.mode])}`}</button>
        <button class="btn" data-act="pomo-skip">Skip</button>
      </div>
      ${window.SBPRO && SBPRO.pomoHtml ? SBPRO.pomoHtml() : ""}${window.SBEXAM ? SBEXAM.pomoHtml() : ""}
      <label class="f">Working On<select id="pomoTask"><option value="">No particular task</option>${openTasks.slice(0, 40).map(t => { const c = courseOf(t.courseId); return `<option value="${esc(t.id)}" ${t.id === pomo.taskId ? "selected" : ""}>${esc(t.title)}${c ? " · " + esc(courseLabel(c)) : ""}</option>`; }).join("")}</select></label>
      <p class="pomo-today">${pomoTodayHtml()}</p>
      <details class="adv" ${ui.pomoSet ? "open" : ""} id="pomoSetD"><summary>Timer Settings</summary>
        <div class="adv-body">
          <div class="three">
            <label class="f"><span class="lh">Focus <span class="hint">min</span></span><input type="number" id="psFocus" min="1" max="120" value="${esc(cfg.focus)}"></label>
            <label class="f"><span class="lh">Short Break <span class="hint">min</span></span><input type="number" id="psShort" min="1" max="60" value="${esc(cfg.short)}"></label>
            <label class="f"><span class="lh">Long Break <span class="hint">min</span></span><input type="number" id="psLong" min="1" max="90" value="${esc(cfg.long)}"></label>
          </div>
          <label class="f"><span class="lh">Long Break After <span class="hint">focus sessions</span></span><input type="number" id="psEvery" min="2" max="8" value="${esc(cfg.every)}"></label>
          <label class="mi-check"><input type="checkbox" id="psAutoBreak" ${cfg.autoBreak ? "checked" : ""}> Start breaks automatically</label>
          <label class="mi-check"><input type="checkbox" id="psAutoFocus" ${cfg.autoFocus ? "checked" : ""}> Start the next focus session automatically</label>
          <div class="two">
            <label class="f">Alarm Sound<select id="psSound">${Object.entries(SOUNDS).map(([k, v]) => `<option value="${k}" ${k === cfg.sound ? "selected" : ""}>${v.label}</option>`).join("")}</select></label>
            <label class="f">Volume<input type="range" id="psVol" min="0.1" max="1" step="0.1" value="${esc(cfg.volume)}"></label>
          </div>
          <button type="button" class="btn small" data-act="pomo-test">Play Test Sound</button>
          <label class="mi-check"><input type="checkbox" id="psNotify" ${cfg.notify ? "checked" : ""} ${notifySupported() ? "" : "disabled"}> Show a desktop notification</label>
          <p class="mini" style="margin:0">${notifyNote} Keep Studyboard open in a tab so the alarm can ring. On phones, the browser pauses pages when the screen turns off.</p>
        </div>
      </details>
      <details class="adv pomo-how"><summary>How the Pomodoro Method Works</summary><div class="pomo-how-b">${POMO_HOW}</div></details>
    </div></div>`;
  $("#pomoTask").addEventListener("change", e => { pomo.taskId = e.target.value; pomoSave(); });
  $("#pomoSetD").addEventListener("toggle", e => { ui.pomoSet = e.target.open; });
  const num = (id, lo, hi, def) => { const v = Math.round(Number($(id).value)); return isFinite(v) && v >= lo && v <= hi ? v : def; };
  const saveCfg = () => {
    const c = {focus: num("#psFocus", 1, 120, 25), short: num("#psShort", 1, 60, 5), long: num("#psLong", 1, 90, 15), every: num("#psEvery", 2, 8, 4),
      autoBreak: $("#psAutoBreak").checked, autoFocus: $("#psAutoFocus").checked, sound: $("#psSound").value, volume: Number($("#psVol").value), notify: $("#psNotify").checked};
    state.settings = Object.assign({}, state.settings, {pomo: c}); saveSettings();
    if (c.notify && notifySupported() && Notification.permission === "default") { try { Notification.requestPermission().then(() => renderPomo()); } catch(e) {} }
    if (!pomo.running && !pomo.left) pomoUI(true);
  };
  $$("#pomoSetD input, #pomoSetD select", d).forEach(el => el.addEventListener("change", saveCfg));
  if (keep) { const k = d.querySelector(keep); if (k) k.focus(); }
}
setInterval(() => { if (pomo.running) { if (Date.now() >= pomo.endAt) pomoFinish(); else pomoUI(false); } }, 500);
document.addEventListener("visibilitychange", () => { if (!document.hidden) { clearInterval(flashT); flashT = null; setTitle(); if (pomo.running && Date.now() >= pomo.endAt) pomoFinish(); } });
function pomoBoot(){
  if (pomo.running && Date.now() >= pomo.endAt) { if (Date.now() - pomo.endAt < 3 * 3600000) pomoFinish(true); else { pomo.running = false; pomo.left = 0; pomoSave(); } }
  pomoSchedule(); pomoUI(true);
}
function pomoAction(act, el){
  switch (act) {
    case "pomo-open": openPomo(); return true;
    case "pomo-start": pomoStart(); return true;
    case "pomo-pause": pomoPause(); return true;
    case "pomo-reset": pomoReset(); return true;
    case "pomo-skip": pomoSkip(); return true;
    case "pomo-mode": pomoPickMode(el.dataset.id); return true;
    case "pomo-test": { const cfg = pomoCfg(); if (!playAlarm($("#psSound") ? $("#psSound").value : cfg.sound, $("#psVol") ? Number($("#psVol").value) : cfg.volume, 1)) toast("Sound isn't available in this browser"); return true; }
    case "pomo-task": { const tk = state.tasks[el.dataset.id]; if (tk && !canDoNow(tk) && !el.dataset.study) { toast(`“${tk.title}” is taken in person, so it can't be started as a focus session. Start one of its study sessions instead.`); return true; } } if (ui.nextShown && ui.nextShown === el.dataset.id) { nufbAdd("accept", state.tasks[el.dataset.id]); ui.nextShown = null; } if (dlg.open) dlg.close(); openPomo(el.dataset.id); { const m = Math.round(Number(el.dataset.mins)); if (m >= 5 && m <= 180 && !pomo.running && !(pomo.left > 0) && pomo.mode === "focus") { pomo.preset = m; pomoSave(); renderPomo(); } }
      if (!pomo.running) pomoStart(); return true;
  }
  return false;
}

// Test handle (only when a test page sets window.__SB_TEST)
if (window.__SB_TEST) window.__sbPomo = {get pomo(){ return pomo; }, save: pomoSave, render: renderPomo, finish: pomoFinish};
