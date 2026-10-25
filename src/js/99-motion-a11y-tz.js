/* ===== module: 99-motion-a11y-tz.js ===== */
/* Animations governor (Auto / Full / Reduced / Off), low-power handling, text size */
(() => {
  const ls = (k, v) => { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} return null; };
  const ss = (k, v) => { try { if (v === undefined) return sessionStorage.getItem(k); sessionStorage.setItem(k, v); } catch (e) {} return null; };
  const mm = q => { try { return window.matchMedia ? matchMedia(q) : null; } catch (e) { return null; } };
  const onMq = (m, fn) => { if (!m) return; try { m.addEventListener ? m.addEventListener("change", fn) : m.addListener(fn); } catch (e) {} };
  const root = document.documentElement;

  /* ================= Animations governor ================= */
  const mqReduce = mm("(prefers-reduced-motion: reduce)"), mqData = mm("(prefers-reduced-data: reduce)"), mqPhone = mm("(max-width:719px)"), mqContrast = mm("(prefers-contrast: more)");
  const MODES = ["full", "off"], RANK = {full: 0, calm: 1, static: 2}, KEY = "studyboard:anim";
  const worse = (a, b) => RANK[a] >= RANK[b] ? a : b;
  // Animations are on (full) or off. Nothing lowers them by itself, and an older Auto or Reduced choice becomes On.
  let pref = ls(KEY); if (pref !== "off") { if (pref) ls(KEY, null); pref = "full"; }
  let battery = null, saveData = false, desk = {onBattery: false, thermal: "unknown", locked: false};
  let blurred = false, idle = false, covered = false, lastInput = Date.now(), lastSig = "";
  // Nothing lowers the picture on its own any more: Auto is full motion except on a low battery
  let gov = 0;
  const IDLE_MS = 5 * 60000;

  const reduceSys = () => !!(mqReduce && mqReduce.matches);
  const batLow = () => !!(battery && battery.charging === false && battery.level < 0.2);
  const batCritical = () => !!(battery && battery.charging === false && battery.level < 0.08);
  // Reduced motion in Auto: only for a low battery (under 20% and not charging, or the phone's Low Power Mode)
  const lowPower = () => batLow() || nativeLow;
  function level(){ return pref === "off" ? "static" : "full"; }
  const live = () => level() !== "static" && !blurred && !idle && !covered && !desk.locked && !document.hidden;
  // Full motion is always 60 frames a second (the 14 leaves room for timing jitter, and a 120 Hz screen still lands on 60).
  const frameMs = () => level() === "calm" ? 66 : 14;
  const dprScale = () => level() === "calm" ? 0.7 : 1;
  const noParticles = () => level() !== "full";
  const pauseWhy = () => document.hidden ? "the tab is hidden" : blurred ? "the window isn't in front" : idle ? "no activity for a few minutes" : covered ? "a full-screen sheet is open" : "";
  function why(){
    const r = [];
    if (reduceSys()) r.push("your device's Reduce Motion is on");
    if (batLow()) r.push("battery is low");
    if (nativeLow) r.push("Low Power Mode is on");
    return r.join(", ");
  }
  function statusText(){
    const lv = level(), p = pauseWhy();
    let s = pref === "off" ? "Off: scenes are still, with no confetti." : "On: scenes always play.";
    if (p && lv !== "static") s += ` Paused for now because ${p}.`;
    return s;
  }
  function emit(force){
    const lv = level(), sig = [lv, live(), frameMs(), dprScale(), pref, gov].join("|");
    root.dataset.motion = lv;
    if (sig === lastSig && !force) return;
    lastSig = sig;
    document.querySelectorAll("[data-anim-status]").forEach(el => { el.textContent = statusText(); });
    try { window.dispatchEvent(new CustomEvent("sb-motion", {detail: {level: lv, live: live(), pref, gov}})); } catch (e) {}
  }
  const setPref = p => { if (MODES.indexOf(p) < 0) return; pref = p; ls(KEY, p === "full" ? null : p); emit(true); };

  // (No automatic quality lowering: the picture stays as it is. These stay so the scenes can still report their frames.)
  function warm(){}
  function frameCost(){}

  // Signals
  try { if (navigator.getBattery) navigator.getBattery().then(b => { battery = b; const u = () => emit(true); ["levelchange", "chargingchange"].forEach(ev => b.addEventListener(ev, u)); u(); }).catch(() => {}); } catch (e) {}
  try { const c = navigator.connection; if (c) { saveData = !!c.saveData; c.addEventListener && c.addEventListener("change", () => { saveData = !!c.saveData; emit(true); }); } } catch (e) {}
  try { if (typeof DESK !== "undefined" && DESK) {
    const set = o => { if (o && typeof o === "object") { desk = {onBattery: o.onBattery === true, thermal: String(o.thermal || "unknown"), locked: o.locked === true}; emit(true); } };
    if (DESK.getPower) DESK.getPower().then(set).catch(() => {});
    if (DESK.onPower) DESK.onPower(set);
  } } catch (e) {}
  onMq(mqReduce, () => emit(true)); onMq(mqData, () => emit(true)); onMq(mqContrast, () => applyContrast());
  window.addEventListener("blur", () => { blurred = true; emit(); });
  window.addEventListener("focus", () => { blurred = false; lastInput = Date.now(); idle = false; emit(); });
  document.addEventListener("visibilitychange", () => { if (!document.hidden) { lastInput = Date.now(); idle = false; } emit(); });
  const touch = () => { lastInput = Date.now(); if (idle) { idle = false; emit(); } };
  ["pointerdown", "keydown", "wheel", "touchstart", "pointermove", "scroll"].forEach(ev => document.addEventListener(ev, touch, {passive: true, capture: true}));
  setInterval(() => { if (!idle && Date.now() - lastInput > IDLE_MS) { idle = true; emit(); } }, 15000);
  // A sheet or the Focus timer that fills a phone screen hides the scene
  const coverDlgs = () => [dlg, document.getElementById("pomoDlg")].filter(Boolean);
  const syncCover = () => { const c = !!(mqPhone && mqPhone.matches && coverDlgs().some(d => d.open)); if (c !== covered) { covered = c; emit(); } };
  // Every dialog
  const passOpen = () => { ["dlg", "pomoDlg", "alarmDlg", "sxDlg"].forEach(id => { const d = document.getElementById(id); if (d && d.open) { try { a11yPass(d); } catch (e) {} setTimeout(() => { try { a11yPass(d); } catch (e) {} }, 400); } }); };
  try { const mo = new MutationObserver(() => { syncCover(); passOpen(); }); ["dlg", "pomoDlg", "alarmDlg", "sxDlg"].forEach(id => { const d = document.getElementById(id); if (d) mo.observe(d, {attributes: true, attributeFilter: ["open"]}); }); onMq(mqPhone, syncCover); } catch (e) {}

  // Smooth scrolling off whenever motion is reduced
  const calmScroll = () => level() !== "full" || reduceSys();
  [[Element.prototype, ["scrollIntoView", "scrollTo", "scrollBy", "scroll"]], [window, ["scrollTo", "scrollBy", "scroll"]]].forEach(([o, names]) => names.forEach(n => {
    const f = o[n]; if (typeof f !== "function") return;
    o[n] = function (a) { if (a && typeof a === "object" && a.behavior === "smooth" && calmScroll()) { const b = Object.assign({}, a, {behavior: "auto"}); const r = Array.prototype.slice.call(arguments, 1); return f.apply(this, [b].concat(r)); } return f.apply(this, arguments); };
  }));

  // A brief highlight that doesn't move, in place of confetti and fireworks
  function flash(){
    try {
      const old = document.getElementById("sbFlash"); if (old) old.remove();
      const el = document.createElement("div"); el.id = "sbFlash"; el.setAttribute("aria-hidden", "true"); document.body.appendChild(el);
      setTimeout(() => el.remove(), 700);
    } catch (e) {}
  }
  // A native shell that knows more (iOS Low Power Mode is not visible to web pages) can say so
  let nativeLow = false;
  const setPower = o => { nativeLow = !!(o && o.lowPower); if (o && o.thermal) desk.thermal = String(o.thermal); emit(true); };
  window.SBMotion = {level, live, frameMs, dprScale, noParticles, frameCost, warm, flash, pref: () => pref, setPref, setPower, status: statusText, gov: () => gov, why: pauseWhy};
  emit(true);

  /* ================= Text size and contrast ================= */
  const TS = [["s", "Small"], ["d", "Default"], ["l", "Large"], ["xl", "Extra Large"]];
  const tsNow = () => { const v = ls("studyboard:textsize"); return TS.some(x => x[0] === v) ? v : "d"; };
  const applyTextSize = () => { const v = tsNow(); if (v === "d") root.removeAttribute("data-ts"); else root.setAttribute("data-ts", v); };
  const hcPref = () => ls("studyboard:contrast") === "1";
  function applyContrast(){ const on = hcPref() || !!(mqContrast && mqContrast.matches); if (on) root.setAttribute("data-hc", "1"); else root.removeAttribute("data-hc"); }
  applyTextSize(); applyContrast();

  /* ================= Time zones ================= */
  /* TZ-CORE-START */
  const SBTZ_CORE = (() => {
    const p2 = n => String(n).padStart(2, "0");
    const isDate = s => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
    const dn = s => Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10)) / 864e5;
    const fromDn = n => { const d = new Date(n * 864e5); return d.getUTCFullYear() + "-" + p2(d.getUTCMonth() + 1) + "-" + p2(d.getUTCDate()); };
    const localISO = d => d.getFullYear() + "-" + p2(d.getMonth() + 1) + "-" + p2(d.getDate());
    const todayLocal = now => localISO(now || new Date());
    const addDays = (s, n) => fromDn(dn(s) + n);
    const dayDiff = (a, b) => dn(b) - dn(a);
    const weekday = s => new Date(dn(s) * 864e5).getUTCDay();
    const mondayOf = s => addDays(s, -((weekday(s) + 6) % 7));
    const fmts = {};
    const valid = tz => { try { return typeof tz === "string" && tz.length < 64 && !!new Intl.DateTimeFormat("en-US", {timeZone: tz}); } catch (e) { return false; } };
    const partsIn = (tz, ms) => { const f = fmts[tz] || (fmts[tz] = new Intl.DateTimeFormat("en-US", {timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit"})); const o = {}; f.formatToParts(new Date(ms)).forEach(x => { o[x.type] = x.value; }); return o; };
    const wallIn = (ms, tz) => { if (!valid(tz) || !isFinite(ms)) return null; const o = partsIn(tz, ms); return {date: o.year + "-" + o.month + "-" + o.day, time: p2(+o.hour % 24) + ":" + o.minute}; };
    const wallOfIso = (s, tz) => { if (isDate(s)) return {date: s, time: ""}; const ms = Date.parse(s); return isNaN(ms) ? null : wallIn(ms, tz); };
    const dueMs = (due, time) => { const m = /^(\d{2}):(\d{2})$/.exec(time || ""); return new Date(+due.slice(0, 4), +due.slice(5, 7) - 1, +due.slice(8, 10), m ? +m[1] : 23, m ? +m[2] : 59, m ? 0 : 59).getTime(); };
    const dueClass = (t, nowMs) => {
      if (!t || !isDate(t.due) || t.status === "done") return "none";
      const today = todayLocal(new Date(nowMs)), d = dayDiff(today, t.due);
      if (d < 0) return "overdue";
      if (d === 0) return nowMs > dueMs(t.due, t.time) ? "overdue" : "today";
      return d === 1 ? "tomorrow" : "later";
    };
    const streakStep = (s, today) => { const o = Object.assign({cur: 0, best: 0, last: ""}, s); if (o.last === today) return o; o.cur = o.last === addDays(today, -1) ? o.cur + 1 : 1; o.last = today; o.best = Math.max(o.best, o.cur); return o; };
    const zoneChanged = (home, now) => !!home && !!now && home !== now;
    return {isDate, dn, fromDn, localISO, todayLocal, addDays, dayDiff, weekday, mondayOf, valid, wallIn, wallOfIso, dueMs, dueClass, streakStep, zoneChanged};
  })();
  /* TZ-CORE-END */
  const HOME_KEY = "studyboard:tz", ACK_KEY = "studyboard:tzAck";
  const deviceZone = () => { try { const z = Intl.DateTimeFormat().resolvedOptions().timeZone; return SBTZ_CORE.valid(z) ? z : ""; } catch (e) { return ""; } };
  const homeZone = () => { const h = ls(HOME_KEY); return SBTZ_CORE.valid(h) ? h : ""; };
  const city = z => String(z || "").split("/").pop().replace(/_/g, " ");
  if (!homeZone() && deviceZone()) ls(HOME_KEY, deviceZone());
  window.SBTZ = Object.assign({}, SBTZ_CORE, {
    device: deviceZone, home: () => homeZone() || deviceZone(),
    // The zone school sites' instants
    schoolZone: () => homeZone() || null
  });

  function refreshAfterZone(){
    try { if (window.studyboardReminders && window.studyboardReminders.refresh) window.studyboardReminders.refresh(); } catch (e) {}
    try { scheduleRender(); } catch (e) {}
  }
  function tzNote(){
    const home = homeZone(), cur = deviceZone();
    if (!SBTZ_CORE.zoneChanged(home, cur) || ls(ACK_KEY) === cur || document.getElementById("tzNote")) return;
    const el = document.createElement("div"); el.id = "tzNote"; el.className = "tz-note"; el.setAttribute("role", "region"); el.setAttribute("aria-label", "Time zone changed");
    el.innerHTML = `<p><b>This device is now on ${esc(city(cur))} time.</b> Your due dates and times stay just as you set them: 11:59 PM is still 11:59 PM wherever you are, and reminders now follow the local clock. School sites keep using ${esc(city(home))} time unless you switch.</p>
      <div class="tz-act"><button type="button" class="btn small" data-act="tz-keep">Keep My Times</button><button type="button" class="btn small primary" data-act="tz-shift">Use ${esc(city(cur))} Time for School Sites</button></div>`;
    document.body.appendChild(el);
    refreshAfterZone();
  }
  const closeNote = () => { const n = document.getElementById("tzNote"); if (n) n.remove(); };
  ["visibilitychange", "focus", "online"].forEach(ev => (ev === "visibilitychange" ? document : window).addEventListener(ev, () => { if (!document.hidden) setTimeout(tzNote, 300); }));
  setInterval(() => { if (!document.hidden) tzNote(); }, 5 * 60000);
  hook("boot", () => setTimeout(tzNote, 1200));

  /* ================= Settings rows ================= */
  const seg = (act, items, cur, label) => `<div class="segb" role="group" aria-label="${esc(label)}">${items.map(([k, l]) => `<button type="button" data-act="${act}" data-id="${k}" aria-pressed="${cur === k}">${esc(l)}</button>`).join("")}</div>`;
  hook("menu", () => {
    const tzr = homeZone(), cur = deviceZone(), differs = SBTZ_CORE.zoneChanged(tzr, cur);
    return `<div class="cap-row sb-wide" data-group="appearance"><span style="flex:1;font-weight:600;min-width:12rem">Animations<span class="sub" data-anim-status>${esc(statusText())}</span><span class="sub">On plays the moving scenery and effects. Off shows still scenery and replaces confetti with a quiet highlight, which also saves battery. Your iPhone's own Low Power Mode slows things down by itself.</span></span>${seg("anim-mode", [["full", "On"], ["off", "Off"]], pref, "Animations")}</div>
    <div class="cap-row sb-wide" data-group="appearance"><span style="flex:1;font-weight:600;min-width:12rem">Text Size<span class="sub">Makes all text and buttons bigger or smaller. Default follows your device's text size.</span></span>${seg("text-size", TS, tsNow(), "Text size")}</div>
    <div class="cap-row" data-group="appearance"><span style="flex:1;font-weight:600">High Contrast and Calm Backgrounds<span class="sub">Dims and blurs theme scenery and makes cards and text stronger. Turns on by itself if your device asks for more contrast.</span></span><label class="anim-tog"><input type="checkbox" data-act="a11y-contrast" ${hcPref() ? "checked" : ""}> On</label></div>
    <div class="cap-row sb-wide" data-group="app"><span style="flex:1;font-weight:600;min-width:12rem">Time Zone<span class="sub">Due dates and times stay as you set them when you travel or the clocks change. Home zone for school sites: <b>${esc(tzr || cur || "this device")}</b>.${differs ? ` This device is on ${esc(cur)} now.` : ""}</span></span>${differs ? `<button type="button" class="btn small" data-act="tz-shift">Use ${esc(city(cur))}</button>` : ""}</div>`;
  });
  hook("act", (act, el, id) => {
    if (act === "anim-mode") { setPref(id); dlg.querySelectorAll('[data-act="anim-mode"]').forEach(b => b.setAttribute("aria-pressed", b.dataset.id === id)); return true; }
    if (act === "text-size") { ls("studyboard:textsize", id === "d" ? null : id); applyTextSize(); dlg.querySelectorAll('[data-act="text-size"]').forEach(b => b.setAttribute("aria-pressed", b.dataset.id === id)); try { queueArt(); } catch (e) {} return true; }
    if (act === "a11y-contrast") { ls("studyboard:contrast", el.checked ? "1" : null); applyContrast(); try { artSig = ""; renderSkinArt(); } catch (e) {} return true; }
    if (act === "tz-keep") { ls(ACK_KEY, deviceZone()); closeNote(); refreshAfterZone(); return true; }
    if (act === "tz-shift") { ls(HOME_KEY, deviceZone()); ls(ACK_KEY, deviceZone()); closeNote(); refreshAfterZone(); try { toast("School sites will use " + city(deviceZone()) + " time from the next sync."); } catch (e) {} return true; }
    return false;
  });

  /* ================= No browser tooltips =================
     The browser's own tooltip boxes (from title="…" anywhere, and <title> inside icons) never show. What they said still reaches
     screen readers: it becomes the element's aria-label when the element has no name of its own (no text, no label), or data-tip
     (shown by the app's own tooltip, 102-qol.js) when it adds to the name. This also covers anything drawn later (sheets, menus,
     third-party bits), through one observer that only looks at title attributes and new nodes. */
  (() => {
    const named = el => el.hasAttribute("aria-label") || el.hasAttribute("aria-labelledby") || (el.labels && el.labels.length) || ((el.textContent || "").trim() && !/^(INPUT|SELECT|TEXTAREA)$/.test(el.tagName));
    const strip = el => {
      if (!el || el.nodeType !== 1) return;
      if (el.hasAttribute("title")) {
        const t = (el.getAttribute("title") || "").trim(); el.removeAttribute("title");
        if (t && !named(el)) el.setAttribute("aria-label", t);
        else if (t && t !== (el.getAttribute("aria-label") || (el.textContent || "").trim())) el.dataset.tip = t;
      }
      if (el.tagName === "title" && el.parentNode && el.parentNode.tagName && el.parentNode.tagName.toLowerCase() === "svg") {
        const svg = el.parentNode, t = (el.textContent || "").trim(); el.remove();
        if (t && !svg.hasAttribute("aria-label")) { svg.setAttribute("aria-label", t); if (!svg.hasAttribute("role")) svg.setAttribute("role", "img"); }
      }
    };
    const sweep = root => { if (!root || root.nodeType !== 1) return; strip(root); root.querySelectorAll("[title], svg title").forEach(strip); };
    sweep(document.documentElement);
    new MutationObserver(list => { for (const m of list) { if (m.type === "attributes") strip(m.target); else m.addedNodes.forEach(sweep); } })
      .observe(document.documentElement, {subtree: true, childList: true, attributes: true, attributeFilter: ["title"]});
  })();

  /* ================= Screen reader pass (runs after every render and every sheet; no observers) ==========     Decorative icons are hidden from VoiceOver and TalkBack, and any icon-only control that still has no name borrows its
     title or placeholder. Controls that already have a name are left alone. */
  const NAMELESS = 'button:not([aria-label]):not([aria-labelledby]),a[href]:not([aria-label]):not([aria-labelledby]),[role="button"]:not([aria-label]):not([aria-labelledby]),[role="tab"]:not([aria-label]):not([aria-labelledby])';
  const FIELDS = 'input:not([type="hidden"]):not([aria-label]):not([aria-labelledby]),select:not([aria-label]):not([aria-labelledby]),textarea:not([aria-label]):not([aria-labelledby])';
  function a11yPass(scope){
    const r = scope && scope.querySelectorAll ? scope : document;
    try {
      r.querySelectorAll('svg:not([aria-hidden]):not([aria-label]):not([role]):not([aria-labelledby])').forEach(s => { if (!s.querySelector("title")) s.setAttribute("aria-hidden", "true"); });
      r.querySelectorAll(NAMELESS).forEach(b => {
        if ((b.textContent || "").trim() || b.querySelector('img[alt]:not([alt=""])')) return;
        const t = b.getAttribute("title"); if (t && t.trim()) b.setAttribute("aria-label", t.trim());
      });
      r.querySelectorAll(FIELDS).forEach(i => {
        if (i.labels && i.labels.length) return;
        const t = i.getAttribute("title") || i.getAttribute("placeholder"); if (t && t.trim()) i.setAttribute("aria-label", t.trim());
      });
    } catch (e) { console.warn("a11y pass", e); }
  }
  // One page title for screen readers when the visible header
  const mqSide = mm("(min-width:980px)");
  function pageTitle(){
    const h = document.getElementById("pageH1"); if (!h) return;
    const top = document.querySelector("header.top .brand"), cur = document.querySelector('nav.tabs [aria-current="page"]');
    const topShown = !!top && !(mqSide && mqSide.matches);
    h.hidden = topShown;
    if (!topShown) { const t = "Studyboard" + (cur ? ", " + (cur.textContent || "").replace(/\s+/g, " ").trim() : ""); if (h.textContent !== t) h.textContent = t; }
  }
  hook("render", () => { a11yPass(document.body); pageTitle(); });
  const origOpenSheet = openSheet;
  openSheet = function () { const r = origOpenSheet.apply(this, arguments); try { a11yPass(dlg); } catch (e) {} return r; };
  window.SBA11Y = {pass: a11yPass};
})();


/* Recently Deleted (screen) and Export My Data */
(() => {
  const tick = () => new Promise(r => setTimeout(r, 0));
  const when = ms => { const d = Math.floor((Date.now() - ms) / 864e5); return d <= 0 ? "today" : d === 1 ? "yesterday" : d + " days ago"; };
  const S = {q: "", kind: ""};
  const kindsHere = list => TB.KINDS.filter(k => list.some(e => e.kind === k));
  const hay = e => (e.label + " " + e.detail + " " + e.items.slice(0, 60).map(i => TB.labelFor(i.kind, i.data) + " " + String(i.data.back || "") + " " + String(i.data.text || "").slice(0, 400) + " " + String(i.data.notes || "").slice(0, 200) + " " + (i.data.cards || []).slice(0, 300).map(c => c.front + " " + c.back).join(" ")).join(" ")).toLowerCase();
  function trashSheet(kind){
    if (kind !== undefined) { S.kind = TB.isSub(kind) ? kind : kind || ""; S.q = ""; }
    openSheet(`<div class="sheet">${head("Recently Deleted")}<div class="sheet-body">
      <p class="status-msg" id="trSum" style="margin:0"></p>
      <input type="search" id="trQ" placeholder="Search deleted items" aria-label="Search deleted items" data-noenter value="${esc(S.q)}">
      <div class="tr-chips" id="trChips"></div>
      <div id="trList" class="tr-list"></div></div>
      <div class="sheet-foot"><span id="trEmpty"></span><span class="spacer"></span><button type="button" class="btn" data-act="close">Done</button></div></div>`);
    $("#trQ").addEventListener("input", e => { S.q = e.target.value.trim().toLowerCase(); drawTrash(); });
    $("#trChips").addEventListener("click", e => { const b = e.target.closest("[data-k]"); if (b) { S.kind = b.dataset.k; drawTrash(); } });
    $("#trList").addEventListener("click", trashClick);
    $("#trEmpty").addEventListener("click", e => {
      const b = e.target.closest("[data-em]"); if (!b) return;
      if (b.dataset.em === "ask") { $("#trEmpty").innerHTML = `<span class="mini">Delete everything here for good?</span> <button type="button" class="btn small" data-em="no">Cancel</button> <button type="button" class="btn small danger" data-em="yes">Empty Bin</button>`; return; }
      if (b.dataset.em === "yes") { const n = trashForever(trashVisible().map(x => x.id)); toast(`Emptied Recently Deleted (${n} item${n === 1 ? "" : "s"})`); }
      drawTrash();
    });
    drawTrash();
  }
  function drawTrash(){
    if (!$("#trList")) return;
    const all = trashVisible(), kinds = kindsHere(all);
    if (S.kind && !kinds.includes(S.kind)) S.kind = "";
    const list = all.filter(e => (!S.kind || e.kind === S.kind) && (!S.q || hay(e).includes(S.q)));
    const nItems = all.reduce((n, e) => n + e.items.length, 0);
    $("#trSum").textContent = all.length ? `${all.length} deleted ${all.length === 1 ? "entry" : "entries"} (${nItems} item${nItems === 1 ? "" : "s"}). Each is kept for ${TB.KEEP_DAYS} days, then removed for good.` : `Nothing here. Anything you delete waits here for ${TB.KEEP_DAYS} days so you can get it back.`;
    $("#trChips").innerHTML = kinds.length > 1 ? [["", "All"], ...kinds.map(k => [k, TB.KIND_TITLE[k]])].map(([k, l]) => `<button type="button" class="chip${S.kind === k ? " on" : ""}" data-k="${k}" aria-pressed="${S.kind === k}">${esc(l)}${k ? ` (${all.filter(e => e.kind === k).length})` : ""}</button>`).join("") : "";
    $("#trEmpty").innerHTML = all.length ? `<button type="button" class="btn small danger" data-em="ask">Empty Bin</button>` : "";
    const groups = TB.KINDS.filter(k => list.some(e => e.kind === k));
    $("#trList").innerHTML = groups.map(k => `<section class="tr-group" aria-label="${esc(TB.KIND_TITLE[k])}"><h3 class="tr-h">${esc(TB.KIND_TITLE[k])} <span class="n">${list.filter(e => e.kind === k).length}</span></h3>${list.filter(e => e.kind === k).map(rowHtml).join("")}</section>`).join("")
      || (all.length ? `<p class="status-msg">No deleted items match.</p>` : "");
  }
  const rowHtml = e => {
    const left = TB.daysLeft(e, Date.now());
    return `<div class="tr-row" data-tid="${esc(e.id)}"><div class="tr-main"><b class="tr-label">${esc(e.label)}</b><span class="mini">${e.detail ? esc(e.detail) + " · " : ""}Deleted ${when(e.deletedAt)} · ${left} day${left === 1 ? "" : "s"} left${e.local ? " · this device only" : ""}</span></div>
      <div class="tr-acts"><button type="button" class="btn small primary" data-tr="restore" data-id="${esc(e.id)}" aria-label="Restore ${esc(e.label)}">Restore</button><button type="button" class="btn small danger" data-tr="ask" data-id="${esc(e.id)}" aria-label="Delete ${esc(e.label)} forever">Delete Forever</button></div></div>`;
  };
  function trashClick(e){
    const b = e.target.closest("[data-tr]"); if (!b) return;
    const id = b.dataset.id, ent = state.trash[id], row = b.closest(".tr-row");
    if (b.dataset.tr === "ask") { row.querySelector(".tr-acts").innerHTML = `<span class="mini">Delete for good? This can't be undone.</span><button type="button" class="btn small" data-tr="no" data-id="${esc(id)}">Cancel</button><button type="button" class="btn small danger" data-tr="forever" data-id="${esc(id)}">Delete Forever</button>`; const f = row.querySelector('[data-tr="forever"]'); if (f) f.focus(); return; }
    if (b.dataset.tr === "no") { drawTrash(); return; }
    if (!ent) { drawTrash(); return; }
    if (b.dataset.tr === "forever") { trashForever([id]); toast(`Deleted ${ent.label} for good`); drawTrash(); return; }
    if (b.dataset.tr === "restore") {
      const r = trashRestore([id]);
      const note = r.notes.length ? " " + r.notes[0] + (r.notes.length > 1 ? ` (+${r.notes.length - 1} more)` : "") + "." : "";
      toast(`Restored ${ent.label}.${note}`, () => { applyChanges(r.inverse, null); trashReadd(r.entries); toast("Undone"); });
      drawTrash(); scheduleRender();
    }
  }
  window.trashReadd = function(entries){ (entries || []).forEach(e => { state.trash[e.id] = e; if (!e.local) queueWrite("trash", e.id, e); }); trashSaveLocal(); const d = $("#trList"); if (d) drawTrash(); };
  window.trashSheet = trashSheet;
  hook("act", (a, el) => {
    if (a === "trash-open") { trashSheet(el.dataset.kind || ""); return true; }
    if (a === "export-data") { exportSheet(); return true; }
    return false;
  });
  document.addEventListener("keydown", e => {
    if (!(e.ctrlKey || e.metaKey) || e.shiftKey || e.altKey || String(e.key).toLowerCase() !== "z") return;
    const t = e.target; if (e.defaultPrevented || (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)))) return;
    if (dlg.open || document.querySelector("dialog.ask-dlg[open]")) return;
    e.preventDefault();
    undoLast();
  });

  /* Export My Data */
  const PARTS = [["tasks", "Tasks", "tasks.csv"], ["notes", "Notes", "notes.csv"], ["grades", "Grades and marks", "grades.csv, grades-summary.csv"], ["decks", "Flashcard decks", "flashcards.csv, flashcards-anki.txt"],
    ["courses", "Courses", "courses.csv"], ["events", "Schedule and events", "events.csv"], ["sessions", "Study sessions (focus time)", "study-sessions.csv"], ["files", "File list (names and links, not the files)", "JSON only"], ["trash", "Recently Deleted items", "JSON only"]];
  const countOf = k => k === "tasks" ? Object.keys(state.tasks).length : k === "notes" ? Object.keys(state.notes).length : k === "decks" ? Object.keys(state.decks || {}).length : k === "courses" ? Object.keys(state.courses).length
    : k === "events" ? Object.keys(state.events || {}).length : k === "files" ? Object.keys(state.files).length : k === "trash" ? trashVisible().length : k === "grades" ? Object.values(state.tasks).filter(t => t.mark).length : Object.values(state.tasks).filter(t => Number(t.focusMin) > 0).length;
  const scrub = (o, depth) => {
    if (!o || typeof o !== "object" || depth > 6) return o;
    if (Array.isArray(o)) return o.map(x => scrub(x, depth + 1));
    const out = {}; Object.keys(o).forEach(k => { if (!/key|token|secret|password|passwd|session|device|endpoint|auth|credential|jwt|bearer|^feed$|vault/i.test(k)) out[k] = scrub(o[k], depth + 1); });
    return out;
  };
  async function buildExport(opts, onStatus){
    const inc = new Set(opts.parts), say = (t, p) => { if (onStatus) onStatus(t, p); };
    const arr = exportArrays(), data = {};
    ["courses", "tasks", "notes", "decks", "events", "files"].forEach(k => { data[k] = arr[k] || []; });
    const wantJson = opts.format !== "csv", wantCsv = opts.format !== "json";
    const entries = [{name: "README.txt", data: TB.README}];
    if (wantJson) {
      say("Preparing the JSON file…", 0.15); await tick();
      const out = {v: 2, settings: scrub(arr.settings, 0), updated: arr.updated};
      const jsonKeys = {courses: ["courses", "tasks", "decks", "notes", "events", "grades", "sessions", "files"].some(k => inc.has(k)), tasks: inc.has("tasks") || inc.has("grades") || inc.has("sessions"), notes: inc.has("notes"), decks: inc.has("decks"), events: inc.has("events"), files: inc.has("files")};
      Object.keys(jsonKeys).forEach(k => { if (jsonKeys[k]) out[k] = data[k]; });
      if (inc.has("trash")) out.trash = trashVisible();
      const j = TB.jsonExport(out, Date.now(), [...inc]);
      entries.unshift({name: "studyboard-export.json", data: JSON.stringify(j, null, 2)});
    }
    if (wantCsv) {
      say("Writing the spreadsheet files…", 0.4); await tick();
      const csvs = TB.toCsvFiles(data, {tasks: inc.has("tasks"), notes: inc.has("notes"), grades: inc.has("grades"), decks: inc.has("decks"), courses: inc.has("courses"), events: inc.has("events"), sessions: inc.has("sessions")});
      Object.keys(csvs).forEach(n => entries.push({name: n, data: csvs[n]}));
    }
    return entries;
  }
  async function saveOut(name, blob, type){
    try {
      const dl = caps.downloads || await useCap("downloads");
      if (dl) { await dl.save({filename: name, data: type === "json" ? await blob.text() : new Uint8Array(await blob.arrayBuffer())}); return true; }
    } catch(e) { if (e && e.code === "declined") return false; }
    if (!inPreview()) { saveBlob(name, blob, type === "json" ? "application/json" : "application/zip"); return true; }
    toast("Downloads aren't available here"); return false;
  }
  function exportSheet(){
    openSheet(`<div class="sheet">${head("Export My Data")}<div class="sheet-body">
      <p style="margin:0">Take a copy of your term with you: open it in a spreadsheet, keep it as a safety copy, or move it somewhere else. It is made on this device and works offline. AI keys, sign-in details and other devices' ids are never included.</p>
      <fieldset class="xp-set"><legend class="lh">What to include</legend>${PARTS.map(([k, l, f]) => `<label class="mi-check"><input type="checkbox" name="xp" value="${k}" ${k === "trash" ? "" : "checked"}> ${esc(l)} <span class="mini">(${countOf(k)})${f ? " · " + esc(f) : ""}</span></label>`).join("")}</fieldset>
      <fieldset class="xp-set"><legend class="lh">Format</legend>
        <label class="mi-check"><input type="radio" name="xpf" value="zip" checked> ZIP: one JSON file with everything plus a spreadsheet file for each part</label>
        <label class="mi-check"><input type="radio" name="xpf" value="json"> JSON only (can be imported back into Studyboard)</label>
        <label class="mi-check"><input type="radio" name="xpf" value="csv"> Spreadsheet files only (in a ZIP)</label></fieldset>
      <p class="mini" style="margin:0">Uploaded files aren't inside this export. Use Export Backup with Files in Settings for those. The JSON file can be restored with Settings, Import from a Backup File.</p>
      <progress id="xpBar" max="1" value="0" hidden style="width:100%"></progress><p class="status-msg" id="xpMsg" role="status" style="margin:0"></p>
    </div><div class="sheet-foot"><span class="spacer"></span><button type="button" class="btn" data-act="close">Cancel</button><button type="button" class="btn primary" id="xpGo">Export</button></div></div>`);
    $("#xpGo").addEventListener("click", async ev => {
      const b = ev.currentTarget, parts = [...dlg.querySelectorAll('input[name="xp"]:checked')].map(i => i.value), format = (dlg.querySelector('input[name="xpf"]:checked') || {}).value || "zip";
      if (!parts.length) { $("#xpMsg").textContent = "Tick at least one thing to include."; return; }
      b.disabled = true; const bar = $("#xpBar"), msg = $("#xpMsg"); bar.hidden = false;
      const st = (t, p) => { msg.textContent = t; bar.value = p; };
      try {
        const entries = await buildExport({parts, format}, st);
        const day = todayISO();
        if (format === "json") {
          st("Saving…", 0.9);
          const ok = await saveOut(`studyboard-export-${day}.json`, new Blob([entries.find(x => /\.json$/.test(x.name)).data], {type: "application/json"}), "json");
          if (ok) { try { localStorage.setItem("studioso:lastExport", String(Date.now())); } catch(e) {} dlg.close(); toast("Export saved"); scheduleRender(); } else { b.disabled = false; bar.hidden = true; msg.textContent = ""; }
          return;
        }
        const zip = await TB.zipBlob(entries, {yield: tick, onProgress: (i, n) => st(`Packing ${i} of ${n} files…`, 0.5 + 0.4 * i / n)});
        st("Saving…", 0.95);
        const ok = await saveOut(`studyboard-export-${day}.zip`, zip, "zip");
        if (ok) { try { localStorage.setItem("studioso:lastExport", String(Date.now())); } catch(e) {} dlg.close(); toast(`Export saved (${entries.length} files)`); scheduleRender(); } else { b.disabled = false; bar.hidden = true; msg.textContent = ""; }
      } catch(err) { console.warn(err); b.disabled = false; bar.hidden = true; msg.textContent = "Couldn't make the export. Try again, or use Export a Backup File."; }
    });
  }
  window.exportSheet = exportSheet;
})();

/* Board notices */
(() => {
  let more = false;
  const KEEP = ["bn-more", "fgs-strip", "sem-card-b"];
  const PRI = ["wkr-card", "rw-banner", "crunch-card", "sem-card-b", "nudge", "fgs-intro"];
  const CHEV = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';
  function mergeWeek(v){
    const cr = v.querySelector(":scope > .crunch-card"), rw = v.querySelector(":scope > .rw-banner");
    if (!cr || !rw) return;
    const go = cr.querySelector('[data-act="cr-open"]'), ws = go && go.dataset.id, t = cr.querySelector(".cc-t");
    if (!ws || !t || ws > addDays(todayISO(), 7)) return;
    const txt = rw.querySelector(".rw-txt"), acts = rw.querySelector(".rw-acts"), hide = rw.querySelector('[data-act="rw-hide"]');
    if (!txt || !acts || !hide) return;
    txt.prepend(t);
    acts.insertBefore(go, hide);
    hide.dataset.crWeek = ws;
    rw.classList.add("rw-crunch"); if (cr.classList.contains("lv4")) rw.classList.add("lv4");
    rw.setAttribute("aria-label", cr.getAttribute("aria-label") || "Heavy week ahead");
    cr.remove();
  }
  function stack(){
    const v = $("#view"), qa = v && v.querySelector(":scope > .qa-wrap"); if (!qa) return;
    mergeWeek(v);
    const list = [];
    for (let el = v.firstElementChild; el && el !== qa; el = el.nextElementSibling) if (!el.hidden && !KEEP.some(c => el.classList.contains(c))) list.push(el);
    if (!list.length) return;
    const rank = el => { const i = PRI.findIndex(c => el.classList.contains(c)); return i < 0 ? PRI.length - 1.5 : i; };
    list.sort((a, c) => rank(a) - rank(c)).forEach(el => v.insertBefore(el, qa));
    list.forEach(el => el.classList.toggle("bn-shut", !more));
    const n = list.length, b = document.createElement("button");
    b.type = "button"; b.className = "bn-more"; b.dataset.act = "bn-more"; b.setAttribute("aria-expanded", String(more));
    b.setAttribute("aria-label", more ? "Hide notices" : `${n} notice${n === 1 ? "" : "s"}. Show ${n === 1 ? "it" : "them"}`);
    b.innerHTML = `<span>${more ? "Hide Notices" : "Notices"}</span>${more ? "" : `<span class="bn-n" aria-hidden="true">${n}</span>`}` + CHEV;
    v.insertBefore(b, list[0]);
  }
  hook("render", tab => { if (tab !== "board") { more = false; return; } try { stack(); } catch (e) { console.warn("board notices", e); } });
  hook("act", (act, el) => {
    if (act === "bn-more") { more = !more; render(); return true; }
    if (act === "rw-hide" && el.dataset.crWeek && window.SBCRUNCH) { try { SBCRUNCH.dismiss(el.dataset.crWeek); } catch (e) {} scheduleRender(); }
    return false;
  });
})();

/* Phones: the add button steps aside when it would cover the quick-add bar (the header looks the same at any scroll) */
(() => {
  const PHONE = window.matchMedia ? matchMedia("(max-width:639px)") : {matches: false};
  let raf = 0;
  function check(){
    raf = 0;
    const b = document.body; if (!b) return;
    let y = false;
    const fab = PHONE.matches && document.getElementById("fab"), qa = fab && document.querySelector("#view .qa-bar");
    if (qa && fab.style.display !== "none") {
      const f = fab.getBoundingClientRect(), q = qa.getBoundingClientRect();
      y = q.height > 0 && q.bottom > f.top - 8 && q.top < f.bottom + 8;
    }
    b.classList.toggle("fab-yield", !!y);
  }
  const soon = () => { if (!raf) raf = requestAnimationFrame(check); };
  window.addEventListener("scroll", soon, {passive: true});
  window.addEventListener("resize", soon);
  if (PHONE.addEventListener) PHONE.addEventListener("change", soon);
  hook("render", soon);
})();
// Placeholder text
function phPh(long, short){
  const ph = !!(window.matchMedia && matchMedia("(max-width:639px)").matches);
  return `placeholder="${esc(ph ? short : long)}" data-ph-l="${esc(long)}" data-ph-s="${esc(short)}"`;
}
if (window.matchMedia) { const mq = matchMedia("(max-width:639px)"); const swap = () => document.querySelectorAll("[data-ph-s]").forEach(el => { el.placeholder = mq.matches ? el.dataset.phS : el.dataset.phL; }); if (mq.addEventListener) mq.addEventListener("change", swap); }

(() => {
  const fine = () => !!(window.matchMedia && matchMedia("(pointer:fine)").matches);
  const usable = sel => sel && sel.tagName === "SELECT" && !sel.multiple && !(sel.size > 1) && !sel.disabled && !("native" in sel.dataset) && fine();
  const CK = `<svg class="sb-dd-ck" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>`;
  let cur = null;
  function close(back){
    if (!cur) return; const {sel, list} = cur; cur = null;
    try { if (list.matches(":popover-open")) list.hidePopover(); } catch (e) {}
    list.remove(); sel.removeAttribute("aria-expanded");
    if (back && sel.isConnected) sel.focus({preventScroll: true});
  }
  function pick(sel, i){
    if (sel.selectedIndex !== i) { sel.selectedIndex = i; sel.dispatchEvent(new Event("input", {bubbles: true})); sel.dispatchEvent(new Event("change", {bubbles: true})); }
    close(true);
  }
  function open(sel){
    close(false);
    const list = document.createElement("div"); list.className = "sb-dd"; list.setAttribute("role", "listbox");
    if (sel.getAttribute("aria-label")) list.setAttribute("aria-label", sel.getAttribute("aria-label"));
    const opts = [...sel.options];
    // A course's small flat dot in front of its name (and a matching gap on the other rows)
    const dotOf = o => { const c = state.courses && state.courses[o.value]; return c ? `<i class="sb-dd-dot" style="--c:${esc(c.color)}"></i>` : sel.classList.contains("cs-custom") ? `<i class="sb-dd-gap"></i>` : ""; };
    const optHtml = o => { const i = opts.indexOf(o), on = i === sel.selectedIndex;
      return o.hidden ? "" : `<button type="button" role="option" class="sb-dd-opt${on ? " on" : ""}" data-i="${i}" aria-selected="${on}"${o.disabled ? " disabled" : ""}>${dotOf(o)}<span>${esc(o.textContent)}</span>${on ? CK : ""}</button>`; };
    list.innerHTML = [...sel.children].map(n => n.tagName === "OPTGROUP" ? `<div class="sb-dd-grp" role="presentation">${esc(n.label)}</div>${[...n.children].map(optHtml).join("")}` : n.tagName === "OPTION" ? optHtml(n) : "").join("");
    const pop = typeof list.showPopover === "function";
    if (pop) list.setAttribute("popover", "manual");
    (sel.closest("dialog") || document.body).appendChild(list);
    if (pop) list.showPopover();
    const r = sel.getBoundingClientRect(), w = Math.min(Math.max(r.width, 200), 480, innerWidth - 16), below = innerHeight - r.bottom - 10, up = below < 220 && r.top > below;
    Object.assign(list.style, {position: "fixed", margin: "0", width: w + "px", left: Math.max(8, Math.min(r.left, innerWidth - w - 8)) + "px",
      maxHeight: Math.max(160, Math.min(420, (up ? r.top : below) - 12)) + "px", top: up ? "auto" : (r.bottom + 6) + "px", bottom: up ? (innerHeight - r.top + 6) + "px" : "auto", right: "auto"});
    cur = {sel, list}; sel.setAttribute("aria-expanded", "true");
    const on = list.querySelector(".sb-dd-opt.on") || list.querySelector(".sb-dd-opt:not([disabled])");
    if (on) { on.scrollIntoView({block: "nearest"}); on.focus({preventScroll: true}); }
    list.addEventListener("click", e => { const b = e.target.closest(".sb-dd-opt"); if (b && !b.disabled) pick(sel, +b.dataset.i); });
  }
  document.addEventListener("mousedown", e => {
    if (cur && !cur.list.contains(e.target) && e.target !== cur.sel) close(false);
    const sel = e.target && e.target.closest ? e.target.closest("select") : null;
    if (!usable(sel) || e.button !== 0) return;
    e.preventDefault(); sel.focus({preventScroll: true});
    if (cur && cur.sel === sel) close(false); else open(sel);
  }, true);
  document.addEventListener("keydown", e => {
    if (cur) {
      const all = [...cur.list.querySelectorAll(".sb-dd-opt:not([disabled])")], i = all.indexOf(document.activeElement);
      if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); close(true); return; }
      if (e.key === "Tab") { close(false); return; }
      if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Home" || e.key === "End") {
        e.preventDefault(); const n = e.key === "Home" ? all[0] : e.key === "End" ? all[all.length - 1] : all[Math.max(0, Math.min(all.length - 1, i + (e.key === "ArrowDown" ? 1 : -1)))];
        if (n) n.focus(); return;
      }
      if (e.key.length === 1 && /\S/.test(e.key)) {
        const k = e.key.toLowerCase(), from = Math.max(0, i + 1), hit = all.slice(from).concat(all.slice(0, from)).find(b => b.textContent.trim().toLowerCase().startsWith(k));
        if (hit) { e.preventDefault(); hit.focus(); }
      }
      return;
    }
    const sel = e.target;
    if (usable(sel) && (e.key === "Enter" || e.key === " " || (e.altKey && e.key === "ArrowDown"))) { e.preventDefault(); open(sel); }
  }, true);
  document.addEventListener("scroll", e => { if (cur && !(e.target && e.target.nodeType === 1 && cur.list.contains(e.target))) close(false); }, true);
  addEventListener("resize", () => close(false));
  addEventListener("blur", () => close(false));
  hook("render", () => { if (cur && !cur.sel.isConnected) close(false); });
})();

// The note-board tabs scroll sideways with no scrollbar showing
document.addEventListener("wheel", e => {
  const el = e.target && e.target.closest ? e.target.closest(".nb-boards") : null;
  if (!el || el.scrollWidth <= el.clientWidth + 1 || Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
  const max = el.scrollWidth - el.clientWidth, next = Math.max(0, Math.min(max, el.scrollLeft + e.deltaY));
  if (next === el.scrollLeft) return;
  el.scrollLeft = next; e.preventDefault();
}, {passive: false});
// Timeline course rows fade from where the track comes out from under the sticky name column
function tlBandSync(sc){
  if (!sc || !sc.classList || !sc.classList.contains("tl-scroll")) return;
  const lab = sc.querySelector(".tl-group .tl-label");
  sc.style.setProperty("--tls", sc.scrollLeft + "px");
  sc.style.setProperty("--tlv", Math.max(200, sc.clientWidth - (lab ? lab.offsetWidth : 0)) + "px");
}
document.addEventListener("scroll", e => tlBandSync(e.target), true);
window.addEventListener("resize", () => tlBandSync(document.querySelector(".tl-scroll")));
hook("render", () => { const sc = document.querySelector(".tl-scroll"); if (sc) { tlBandSync(sc); requestAnimationFrame(() => tlBandSync(sc)); } });

/* Start */
let bootDone = false, bootErr = "";
const bootNote = e => { if (!bootDone && !bootErr) { try { bootErr = String((e && (e.stack || e.message)) || e).slice(0, 1500); } catch (x) { bootErr = "unknown error"; } } };
window.addEventListener("error", ev => bootNote(ev.error || ev.message));
window.addEventListener("unhandledrejection", ev => bootNote(ev.reason));
function bootStuck(){
  if (bootDone || document.getElementById("bootFail")) return;
  const info = `Studyboard ${(window.studiosoDesktop && window.studiosoDesktop.version) || ""} ${navigator.userAgent}\n${bootErr || "Starting up didn't finish."}`;
  const box = document.createElement("div"); box.id = "bootFail"; box.setAttribute("role", "alert");
  box.style.cssText = "position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:24px;background:rgba(10,20,40,.55);font:15px/1.45 system-ui,sans-serif";
  box.innerHTML = `<div style="max-width:520px;width:100%;background:#fff;color:#1d2433;border-radius:16px;padding:22px;box-shadow:0 20px 60px rgba(0,0,0,.35)"><h2 style="margin:0 0 8px;font-size:20px">Studyboard didn't finish starting</h2><p style="margin:0 0 12px">Your data is safe. Try again, and if this keeps happening, copy the details and send them to support@studyboardapp.com.</p><pre style="max-height:160px;overflow:auto;background:#f2f4f8;border-radius:8px;padding:10px;font-size:12px;white-space:pre-wrap;margin:0 0 14px"></pre><div style="display:flex;gap:8px;justify-content:flex-end"><button type="button" data-b="copy" style="padding:9px 16px;border-radius:999px;border:1px solid #c9d1e0;background:#fff;font:inherit;cursor:pointer">Copy Details</button><button type="button" data-b="again" style="padding:9px 16px;border-radius:999px;border:0;background:#1d5fd1;color:#fff;font:inherit;font-weight:600;cursor:pointer">Try Again</button></div></div>`;
  box.querySelector("pre").textContent = info;
  box.querySelector('[data-b="copy"]').onclick = ev => { try { navigator.clipboard.writeText(info); ev.target.textContent = "Copied"; } catch (e) {} };
  box.querySelector('[data-b="again"]').onclick = () => location.reload();
  document.body.appendChild(box);
}
setTimeout(bootStuck, 15000);
(async () => {
try {
if (DESK) { try { await Promise.race([deskBoot(), sleep(6000)]); } catch(e) { console.warn(e); } }
try { pwaBoot(); } catch(e) {}
try { applyTheme(); } catch(e) {}
try { applySkin(); } catch(e) {}
loadLocal();
try { noteDraftRecover(); } catch(e) { console.warn("note draft", e); }
setTimeout(async () => {
  try {
    const has = ["tasks", "courses", "notes", "decks"].some(k => Object.keys(state[k] || {}).length);
    const was = PST.state, r = await storageProtect(has); if (r !== was && dlg.open) scheduleRender();
    if (!has || r === "granted" || r === "app" || inPreview() || (typeof sbUser !== "undefined" && sbUser) || navigator.webdriver) return;
    const K = "studyboard:persistNudge", last = Number(localStorage.getItem(K) || 0);
    if (Date.now() - last < 7 * 864e5) return;
    for (let i = 0; i < 24; i++) {
      await sleep(5000);
      if ($("#toast").classList.contains("show") || (typeof dlg !== "undefined" && dlg.open)) continue;
      localStorage.setItem(K, String(Date.now()));
      toast("Your browser may clear website data on its own. Keep your planner safe: install Studyboard as an app, sign in, or export a backup.", null,
        {label: "Protect My Data", fn: () => storageProtect(true).then(r => { toast(r === "granted" ? "Done. This browser will keep your Studyboard data until you remove it." : "Your browser said not yet. Install Studyboard as an app (or add it to your Home Screen), then try again in Settings. Meanwhile, sign in or export a backup."); scheduleRender(); })});
      return;
    }
  } catch (e) {}
}, 4000);
try { const pr = JSON.parse(localStorage.getItem(AI_PREFS_LS) || "null"); if (pr && typeof pr === "object" && !(state.settings && state.settings.ai)) { state.settings = Object.assign({}, state.settings, {ai: pr}); saveSettings(); } localStorage.removeItem(AI_PREFS_LS); } catch(e) {}
setTimeout(async () => { try { const has = ["tasks", "courses", "notes", "decks", "files"].some(k => Object.keys(state[k] || {}).length); if (has) { const dev = (await deviceBackups()).filter(b => !String(b.id || "").startsWith("k-")); if (!dev.length || Date.now() - dev[0].at > 864e5) await saveDeviceBackup(backupSnap()); } } catch(e) {} }, 6000);
if (loadProblem) setTimeout(() => { try { toast("Your saved data on this device couldn't be read. A copy was set aside, not deleted. Sign in to get your account's copy, or restore a backup.", null, {label: "Open Backups", fn: restoreSheet}, {error: true}); } catch(e) {} }, 2500);
try { trashEnforce(); } catch(e) { console.warn(e); }
syncLabel();
pomoBoot();
initFolderBackup();
try { const st = state.settings && state.settings.style; if (st && !st.noteDefault2) { state.settings = Object.assign({}, state.settings, {style: Object.assign({}, st, st.note && st.note !== "classic" && !st.notePicked && st.noteAuto !== true ? {note: "classic"} : {}, {noteDefault2: true})}); saveSettings(); } } catch (e) {}
try { const st = state.settings && state.settings.style; if (st && !st.pinDefault2) { state.settings = Object.assign({}, state.settings, {style: Object.assign({}, st, st.pin === "washi" ? {pin: "pin", pinPicked: false} : {}, {pinDefault2: true})}); saveSettings(); } } catch (e) {}
const HERE = "studyboard:here";
let hereScroll = 0;
try {
  const h = JSON.parse(sessionStorage.getItem(HERE) || "null");
  const known = new Set([...document.querySelectorAll("nav.tabs [data-tab]")].map(b => b.dataset.tab).concat(["board", "timeline", "schedule", "crunch", "courses", "files", "emails", "archive", "flashcards", "notes", "groups", "companion", "calendar", "plan"]));
  if (h && typeof h.tab === "string" && known.has(h.tab) && Date.now() - (Number(h.at) || 0) < 12 * 36e5) {
    ui.tab = h.tab;
    if (h.courseId && state.courses[h.courseId]) { ui.courseId = h.courseId; ui.courseTab = typeof h.courseTab === "string" ? h.courseTab : ""; }
    if (h.bview === "plan" || h.bview === "board") ui.bview = h.bview;
    if (h.tab === "flashcards" && h.deckId && state.decks[h.deckId]) ui.deckId = h.deckId;
    if (h.tab === "groups" && typeof h.grp === "string" && h.grp) ui.grp = h.grp;
    if (h.tab === "files") { if (typeof h.fCourse === "string") ui.fCourse = h.fCourse; if (typeof h.fFolder === "string") ui.fFolder = h.fFolder; }
    hereScroll = Math.max(0, Number(h.y) || 0);
  }
} catch(e) {}
try { if (window.SBROUTE) SBROUTE.boot(); } catch(e) {}
const hereSave = () => { try { if (window.SBTOUR && SBTOUR.active && SBTOUR.active()) return;
  sessionStorage.setItem(HERE, JSON.stringify({tab: ui.tab, courseId: ui.courseId || "", courseTab: ui.courseTab || "", bview: ui.bview || "", deckId: ui.tab === "flashcards" && !ui.fc ? ui.deckId || "" : "",
    grp: ui.tab === "groups" ? ui.grp || "" : "", fCourse: ui.fCourse || "", fFolder: ui.fFolder || "", y: Math.round(window.scrollY || 0), at: Date.now()})); } catch(e) {} };
// Saved when the page goes away, plus at most once a second after a redraw (no layout reads during a render)
let hereT = 0;
hook("render", () => { if (!hereT) hereT = setTimeout(() => { hereT = 0; hereSave(); }, 1000); });
addEventListener("pagehide", hereSave);
document.addEventListener("visibilitychange", () => { if (document.hidden) hereSave(); });
render();
if (hereScroll) setTimeout(() => { try { window.scrollTo(0, hereScroll); } catch(e) {} }, 350);
initCloud();
setTimeout(() => dailyQuote(false), 1600);
fire("boot");
bootDone = true;
} catch (e) { bootNote(e); console.error("start", e); bootStuck(); }
})();
setInterval(() => { try { trashEnforce(); } catch(e) {} }, 36e5);
setInterval(() => { const d = todayISO(); if (d !== ui._day) { ui._day = d; scheduleRender(); setTimeout(() => dailyQuote(false), 1000); } }, 60000);
document.addEventListener("visibilitychange", () => { if (!document.hidden) setTimeout(() => dailyQuote(false), 800); });
ui._day = todayISO();
