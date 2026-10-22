/* ===== module: 70-widgets.js ===== */
/* ---------- 1.11 Widgets and Desktop ----------
   - Feeds the desktop Today widget (DESK.setWidgetData) and the Windows 11 Widgets board (through the service worker).
   - ?widget=today shows only a small Today card, for a Home Screen icon or a narrow browser window.
   - Handles app shortcuts (?action=quickadd, today, focus, search, flashcards; ?task=ID; ?action=done&task=ID)
     and the same requests from the desktop tray, widget and reminders (DESK.onAction, DESK.onOpenTask).
   - Settings row: Widgets and Desktop. */
(() => {
  const params = new URLSearchParams(location.search);
  const WV = params.get("widget") === "today";
  const DESK_OK = !!(DESK && typeof DESK.setWidgetData === "function");
  const LIST_MAX = 12;
  const isDoneToday = t => t.status === "done" && t.doneAt && iso(new Date(t.doneAt)) === todayISO();

  /* ---------- What's on today ---------- */
  // Today's list: what Today's Plan gives time to today, anything due today or overdue, and what you finished today.
  function dayList(){
    const today = todayISO(), F = computeFocus(), seen = new Set(), out = [];
    const add = (t, x) => { if (!t || seen.has(t.id)) return; seen.add(t.id); out.push({t, x}); };
    (F.ranked || []).filter(x => x.alloc > 0 || x.dl <= 0).forEach(x => add(x.t, x));
    tasksArr().filter(t => t.status !== "done" && t.due && t.due <= today).sort((a, b) => (a.due + (a.time || "")).localeCompare(b.due + (b.time || ""))).forEach(t => add(t, null));
    tasksArr().filter(isDoneToday).sort((a, b) => a.doneAt - b.doneAt).forEach(t => add(t, null));
    return {F, list: out};
  }
  function metaOf(t, x){
    const today = todayISO();
    if (t.status === "done") return "Done";
    if (t.due && t.due < today) return `Overdue since ${fmtShort(t.due)}`;
    if (t.due === today) return `${MILESTONE(t.type) ? t.type : "Due"} ${t.time ? fmtTime(t.time) : "Today"}`;
    if (x && x.alloc > 0) return `${fmtHM(x.alloc)} today${t.due ? `, due ${fmtShort(t.due)}` : ""}`;
    return t.due ? `Due ${fmtShort(t.due)}` : "";
  }
  function themeVars(){
    const cs = getComputedStyle(document.documentElement), v = n => cs.getPropertyValue(n).trim();
    return {dark: isDark(), bg: v("--bg") || v("--paper"), surface: v("--surface"), ink: v("--ink"), muted: v("--muted"), line: v("--line"), soft: v("--soft"),
      accent: v("--accent"), accentInk: v("--accent-ink"), late: v("--late"), spine: v("--spine"), spineInk: v("--spine-ink"), tomato: v("--tomato"),
      font: getComputedStyle(document.body).fontFamily, display: v("--display")};
  }
  function widgetData(){
    const {F, list} = dayList();
    let n = null; try { n = nextUp(F); } catch(e) {}
    const s = streakOf(), c = t => courseOf(t.courseId);
    const item = ({t, x}) => ({id: t.id, title: t.title, course: c(t) ? courseLabel(c(t)) : "", color: colorOf(t.courseId), meta: metaOf(t, x), done: t.status === "done", late: t.status !== "done" && !!t.due && t.due < todayISO()});
    return {
      v: 1, day: todayISO(), dateLabel: new Date().toLocaleDateString(undefined, {weekday: "long", month: "long", day: "numeric"}),
      next: n ? {id: n.x.t.id, title: n.label || n.x.t.title, course: c(n.x.t) ? courseLabel(c(n.x.t)) : "", color: colorOf(n.x.t.courseId), why: n.why[0] || "", mins: n.mins} : null,
      tasks: list.slice(0, LIST_MAX).map(item), more: Math.max(0, list.length - LIST_MAX),
      cards: allDueCount(), streak: {cur: s.cur, today: s.last === todayISO()}, theme: themeVars()
    };
  }

  /* ---------- Sending it to the widgets ---------- */
  let lastSent = "", pushT = null;
  function push(){
    clearTimeout(pushT); pushT = null;
    let d; try { d = widgetData(); } catch(e) { console.warn("widget data", e); return; }
    const sig = JSON.stringify(d);
    if (sig === lastSent) return;
    lastSent = sig;
    if (DESK_OK) { try { DESK.setWidgetData(d); } catch(e) {} }
    pushWindows(d);
  }
  const pushSoon = () => { if (!pushT) pushT = setTimeout(push, 500); };

  // Windows 11 Widgets board (the installed web app from Edge). The service worker (sw/widgets.js) keeps the latest
  // copy and redraws the widget. Anywhere else this quietly does nothing.
  function cardData(d){
    const open = d.tasks.filter(t => !t.done);
    return {
      date: d.dateLabel, hasNext: !!d.next,
      next: d.next ? {id: d.next.id, title: d.next.title, sub: [d.next.course, d.next.why].filter(Boolean).join(" · ")} : {id: "", title: "", sub: ""},
      hasTasks: open.length > 0, left: open.length ? `Today's List · ${open.length + d.more} left` : "",
      tasks: open.slice(0, 5).map(t => ({id: t.id, title: t.title, sub: [t.course, t.meta].filter(Boolean).join(" · ")})),
      hasMore: open.length + d.more > 5, moreText: `${open.length + d.more - 5} more in Studyboard`,
      empty: d.tasks.length ? "Everything on today's list is done. Nice work!" : "Nothing planned for today.",
      hasCards: d.cards > 0, cards: `${d.cards} flashcard${d.cards === 1 ? "" : "s"} due`,
      hasStreak: d.streak.cur > 0, streak: `🔥 ${d.streak.cur}`
    };
  }
  function pushWindows(d){
    if (DESK || inClaude() || !("serviceWorker" in navigator) || !(location.protocol === "https:" || location.hostname === "localhost")) return;
    const msg = {type: "sb-widget-data", data: cardData(d)};
    navigator.serviceWorker.ready.then(r => { if (r.active) r.active.postMessage(msg); }).catch(() => {});
  }

  /* ---------- Doing what a shortcut, the tray, a widget or a reminder asks ---------- */
  // Uses the app's own buttons, so checking off a task behaves exactly like a click on the Board (undo, celebration, sync).
  function runAct(act, id){
    const b = document.createElement("button");
    b.dataset.act = act; if (id) b.dataset.id = id; b.hidden = true;
    document.body.appendChild(b);
    try { b.click(); } finally { b.remove(); }
  }
  function goTab(tab){ if (dlg.open) dlg.close(); ui.tab = tab; if (tab !== "courses") ui.courseId = null; if (tab === "flashcards") { ui.fc = null; ui.deckId = null; } render(); window.scrollTo(0, 0); }
  function openTaskById(id){
    const t = state.tasks[id];
    if (!t) { toast("That task isn't in Studyboard any more"); return; }
    if (dlg.open && dlg.querySelector(`[data-id="${CSS.escape(id)}"]`)) return;    // already open (a reminder module may open it too)
    taskForm(t);
  }
  function doAction(a, arg){
    if (WV && !["toggle", "done", "task"].includes(a)) { location.href = location.pathname + (a === "task" ? "?task=" + encodeURIComponent(arg) : "?action=" + encodeURIComponent(a)); return; }
    switch (a) {
      case "quickadd":
        goTab("board");
        setTimeout(() => { const i = $("#qaIn"); if (i) { i.scrollIntoView({block: "center"}); i.focus(); } else runAct("new-task"); }, 60);
        break;
      case "today": goTab("board"); ui.focusOpen = true; render(); break;
      case "flashcards": goTab("flashcards"); break;
      case "focus": if (dlg.open) dlg.close(); openPomo(); break;
      case "focus-task": if (state.tasks[arg]) { if (dlg.open) dlg.close(); runAct("pomo-task", arg); } else openPomo(); break;
      case "search": if (dlg.open) dlg.close(); if (!fire("search-open").length) toggleSearch(true); break;
      case "settings": menuSheet(); break;
      case "toggle": if (state.tasks[arg]) { runAct("toggle", arg); push(); } break;
      case "done": if (state.tasks[arg] && state.tasks[arg].status !== "done") { runAct("toggle", arg); push(); } break;
      case "task": openTaskById(arg); break;
    }
  }
  const ACTIONS = ["quickadd", "today", "focus", "search", "flashcards", "done", "settings"];
  function handleUrl(){
    const a = params.get("action"), task = params.get("task");
    if (!a && !task) return;
    try { history.replaceState(null, "", location.pathname + (WV ? "?widget=today" : "") + location.hash); } catch(e) {}
    if (a === "done" && task) doAction("done", task);
    else if (task) doAction("task", task);
    else if (ACTIONS.includes(a)) doAction(a);
  }

  /* ---------- ?widget=today: just the Today card ---------- */
  function todayCard(){
    const d = widgetData(), n = d.next, left = d.tasks.filter(t => !t.done).length;
    const row = t => `<li class="sbw-row ${t.done ? "is-done" : ""} ${t.late ? "is-late" : ""}" style="--c:${esc(t.color)}">
        <button class="check" data-act="toggle" data-id="${esc(t.id)}" role="checkbox" aria-checked="${t.done}" aria-label="${t.done ? "Mark not done" : "Mark done"}: ${esc(t.title)}">${CHECK}</button>
        <button class="sbw-main" data-act="edit-task" data-id="${esc(t.id)}"><span class="sbw-title">${esc(t.title)}</span>${t.course || t.meta ? `<span class="sbw-meta">${esc([t.course, t.meta].filter(Boolean).join(" · "))}</span>` : ""}</button></li>`;
    return `<section class="sbw" aria-label="Today">
      <header class="sbw-head">
        <div class="sbw-hl"><h1>Today</h1><span>${esc(d.dateLabel)}</span></div>
        ${d.streak.cur && !(window.SBSTREAK && SBSTREAK.on()) ? `<button class="streak-chip ${d.streak.today ? "" : "sbw-dim"}" data-act="daily-quote" title="${esc(streakLine())}">🔥 ${d.streak.cur}</button>` : ""}
        <a class="icon-btn" href="${esc(location.pathname)}" aria-label="Open Studyboard" title="Open Studyboard"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg></a>
      </header>
      ${n ? `<div class="sbw-next" style="--c:${esc(n.color)}">
        <span class="sbw-lbl">Do This Next</span>
        <button class="sbw-ntitle" data-act="edit-task" data-id="${esc(n.id)}">${esc(n.title)}</button>
        ${n.course || n.why ? `<span class="sbw-meta">${esc([n.course, n.why].filter(Boolean).join(" · "))}</span>` : ""}
        <button class="btn primary small" data-act="pomo-task" data-id="${esc(n.id)}" data-mins="${n.mins}">${TOMATO}Start a ${n.mins}m Focus</button>
      </div>` : ""}
      <h2 class="sbw-h">Today's List${d.tasks.length ? `<span>${left ? `${left + d.more} left` : "All done 🎉"}</span>` : ""}</h2>
      ${d.tasks.length ? `<ul class="sbw-list">${d.tasks.map(row).join("")}</ul>${d.more ? `<a class="sbw-more" href="${esc(location.pathname)}?action=today">${d.more} more in Studyboard</a>` : ""}`
        : `<div class="sbw-empty"><span>Nothing planned for today.</span><a class="btn small" href="${esc(location.pathname)}?action=quickadd">Add a Task</a></div>`}
      <footer class="sbw-foot">
        ${d.cards ? `<a class="sbw-chip" href="${esc(location.pathname)}?action=flashcards">${FC_ICON}<span>${d.cards} flashcard${d.cards === 1 ? "" : "s"} due</span></a>` : ""}
        ${d.tasks.length ? `<a class="sbw-chip" href="${esc(location.pathname)}?action=quickadd">+ Quick Add</a>` : ""}
      </footer>
    </section>`;
  }
  if (WV) {
    VIEWS.sbtoday = todayCard;
    ui.tab = "sbtoday";
    document.body.classList.add("sb-wv");
    document.title = "Studyboard Today";
    const at = document.querySelector('meta[name="apple-mobile-web-app-title"]'); if (at) at.setAttribute("content", "Today");
    // No daily quote pop-up over the little card.
    dailyQuote = function(force){ if (force) { if (dlg.open) dlg.close(); openSheet(`<div class="sheet">${head("Your Streak")}<div class="sheet-body"><p>${esc(streakLine())}</p></div></div>`); } };
    // Its own Home Screen icon: point "Add to Home Screen" and "Install" at the Today card instead of the whole app.
    const origPwa = pwaBoot;
    pwaBoot = function(){ const r = origPwa.apply(this, arguments); const l = document.querySelector('link[rel="manifest"]'); if (l) l.href = "today.webmanifest"; return r; };
    // Changes made in another tab or window of Studyboard show up here too.
    window.addEventListener("storage", e => { if (e.key === LS2 && e.newValue) { loadLocal(); scheduleRender(); } });
  }

  /* ---------- Settings: Widgets and Desktop ---------- */
  const ua = navigator.userAgent || "";
  const IOS = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  const ANDROID = /Android/.test(ua);
  const WINDOWS = /Windows/.test(ua);
  const installed = () => !!(window.matchMedia && (window.matchMedia("(display-mode: standalone)").matches || window.matchMedia("(display-mode: window-controls-overlay)").matches)) || navigator.standalone === true;
  let deskCfg = null;
  const tog = (key, on, label) => `<label class="anim-tog"><input type="checkbox" data-act="sbw-set" data-key="${key}" ${on ? "checked" : ""} aria-label="${esc(label)}"> On</label>`;
  function deskRows(){
    const c = deskCfg || {}, mac = DESK.platform === "darwin", where = mac ? "menu bar" : "notification area";
    const paused = c.pausedUntil && c.pausedUntil > Date.now();
    const fsRow = DESK.fullscreen ? `<div class="cap-row"><span style="flex:1;font-weight:600">Full Screen<span class="sub">Fill the whole screen with Studyboard. Press ${mac ? "Ctrl+Cmd+F" : "F11"} to switch any time.</span></span><button class="btn small" data-act="sbw-fs">${document.body.classList.contains("fs") ? "Exit Full Screen" : "Full Screen"}</button></div>` : "";
    return `${fsRow}<div class="cap-row"><span style="flex:1;font-weight:600">Keep Running in the Background<span class="sub">${c.tray === false ? "The tray icon isn't available on this computer, so closing the window closes Studyboard." : `Closing the window keeps Studyboard in the ${where}, so reminders and the Today widget keep working. Choose Quit Studyboard from its icon to close it all the way.`}</span></span>${c.tray === false ? "" : tog("background", c.background !== false, "Keep Running in the Background")}</div>
      ${c.canLogin ? `<div class="cap-row"><span style="flex:1;font-weight:600">Start When I Sign In to My Computer<span class="sub">Studyboard starts quietly in the ${where}, ready with your reminders.</span></span>${tog("openAtLogin", !!c.openAtLogin, "Start When I Sign In to My Computer")}</div>` : ""}
      ${c.startupSettings && DESK.openStartupSettings ? `<div class="cap-row"><span style="flex:1;font-weight:600">Start When I Sign In to My Computer<span class="sub">Windows decides this for apps from the Microsoft Store. Turn Studyboard on under Settings, Apps, Startup.</span></span><button class="btn small" data-act="sbw-startup">Open Startup Settings</button></div>` : ""}
      <div class="cap-row"><span style="flex:1;font-weight:600">Today Widget<span class="sub">A small window with Do This Next, today's list, flashcards due and your streak. Drag it by the top, resize it from the edges.</span></span>${tog("widget", !!c.widget, "Show Today Widget")}</div>
      <div class="cap-row"><span style="flex:1;font-weight:600">Keep the Widget on Top<span class="sub">The widget stays above other windows.</span></span>${tog("widgetPinned", !!c.widgetPinned, "Keep the Widget on Top")}</div>
      <div class="cap-row"><span style="flex:1;font-weight:600">Reminders<span class="sub">${paused ? `Paused until ${esc(new Date(c.pausedUntil).toLocaleTimeString([], {hour: "numeric", minute: "2-digit"}))}. Reminders that come up meanwhile are shown when the pause ends.` : c.notifications === false ? "This computer doesn't allow notifications from Studyboard. Turn them on in your system settings." : `Shown as ${mac ? "Mac" : "Windows"} notifications, even with the window closed. You can pause them for an hour from the ${where} icon.`}</span></span>${paused ? `<button class="btn small" data-act="sbw-resume">Resume</button>` : `<button class="btn small" data-act="sbw-pause">Pause 1 Hour</button>`}</div>`;
  }
  // Inside the App Store / Google Play apps (Capacitor) the web-only steps (Add to Home Screen, Install) don't apply: list what the app itself offers.
  const NATIVE_APP = (() => { try { const C = window.Capacitor; return !!(C && typeof C.isNativePlatform === "function" && C.isNativePlatform()); } catch (e) { return false; } })();
  function nativeRows(){
    const share = `<div class="cap-row"><span style="flex:1;font-weight:600">Share to Studyboard<span class="sub">In any app, tap Share and choose Studyboard to turn text, a link or a photo into a task.</span></span></div>`;
    if (IOS) return share + `<div class="cap-row"><span style="flex:1;font-weight:600">Siri and Shortcuts<span class="sub">Say "Add a task to Studyboard" or "Take a photo for Studyboard". Both are also in the Shortcuts app, ready to put on your Home Screen or Action button.</span></span></div>`;
    return share + `<div class="cap-row"><span style="flex:1;font-weight:600">Quick Capture Tile<span class="sub">Swipe down twice, tap the pencil to edit your Quick Settings, and drag Quick capture in. One tap opens Studyboard ready to add a task.</span></span></div>
      <div class="cap-row"><span style="flex:1;font-weight:600">App Shortcuts<span class="sub">Press and hold the Studyboard icon on your Home screen for Quick Add.</span></span></div>`;
  }
  function webRows(){
    if (NATIVE_APP) return nativeRows();
    const today = `<a class="btn small" href="${esc(location.pathname)}?widget=today" target="_blank" rel="noopener">Open Today View</a>`;
    let how;
    if (IOS) how = `Open the Today view, tap Share, then Add to Home Screen. It gets its own icon that opens straight to today's list.`;
    else if (ANDROID) how = `Open the Today view, then choose Add to Home screen (or Install) from Chrome's menu. It gets its own icon.`;
    else how = `Open the Today view in a narrow window and keep it beside your work, or install it from the browser's address bar as its own small app.`;
    const shortcuts = IOS ? "iPhone doesn't offer app shortcuts for web apps yet, so use the Today icon." : `${installed() ? "Press and hold" : "Once Studyboard is installed, press and hold"} ${ANDROID ? "its icon on your Home screen" : WINDOWS ? "or right-click its icon in the Start menu or taskbar" : "its icon"} for Quick Add, Today, Focus Timer and Search.`;
    return `<div class="cap-row" style="flex-wrap:wrap"><span style="flex:1;min-width:200px;font-weight:600">Today on Your Home Screen<span class="sub">${how}</span></span>${today}</div>
      <div class="cap-row"><span style="flex:1;font-weight:600">App Shortcuts<span class="sub">${shortcuts}</span></span></div>
      ${WINDOWS && !IOS ? `<div class="cap-row"><span style="flex:1;font-weight:600">Windows 11 Widgets Board<span class="sub">Install Studyboard from Microsoft Edge, then press Windows + W, choose Add Widgets (+), and pick Studyboard Today. It updates whenever Studyboard is open.</span></span></div>` : ""}
      <div class="cap-row"><span style="flex:1;font-weight:600">Real Home Screen Widgets<span class="sub">Home Screen widgets aren't available yet. The Today icon and shortcuts are the closest thing for now.${WINDOWS || /Mac/.test(ua) ? " The Studyboard desktop app for Windows and Mac has a Today widget that sits on your desktop." : ""}</span></span></div>`;
  }
  async function widgetsSheet(){
    if (DESK_OK && DESK.getDesktopSettings) { try { deskCfg = await DESK.getDesktopSettings(); } catch(e) { deskCfg = null; } }
    const intro = DESK_OK ? `Studyboard for ${DESK.platform === "darwin" ? "Mac" : "Windows"} has a tray icon, a Today widget for your desktop, and reminders that work with the window closed.`
      : NATIVE_APP ? `Here's what the Studyboard app adds on this ${IOS ? "iPhone" : "phone"}.` : `Here's what works on this ${IOS || ANDROID ? "phone" : "device"}.`;
    openSheet(`<div class="sheet">${head("Widgets and Desktop")}<div class="sheet-body">
      <p class="status-msg" style="margin-top:0">${esc(intro)}</p>
      <div class="menu-list sbw-set">${DESK_OK ? deskRows() : webRows()}</div>
      ${DESK_OK || NATIVE_APP ? "" : `<p class="mini">More in the setup guide, under Widgets and Shortcuts.</p>`}
    </div></div>`);
  }
  async function setDesk(key, value){
    if (!DESK_OK || !DESK.setDesktopSetting) return;
    try { deskCfg = await DESK.setDesktopSetting(key, value); } catch(e) { toast("Couldn't change that setting. Try again."); return; }
    const box = dlg.open && dlg.querySelector(".sbw-set"); if (box && deskCfg) box.innerHTML = deskRows();
  }

  /* ---------- Hooks ---------- */
  hook("menu", () => inClaude() ? "" : `<button data-act="sbw-open"><span>Widgets and Desktop<span class="sub">${DESK_OK ? "Tray icon, Today widget, reminders and starting with your computer" : "Today on your Home Screen, app shortcuts and widgets"}</span></span></button>`);
  hook("act", (act, el) => {
    if (act === "sbw-open") { if (dlg.open) dlg.close(); setTimeout(widgetsSheet, 30); return true; }
    if (act === "sbw-set") { setDesk(el.dataset.key, !!el.checked); return true; }
    if (act === "sbw-pause") { setDesk("pauseReminders", 60); toast("Reminders paused for 1 hour"); return true; }
    if (act === "sbw-resume") { setDesk("pauseReminders", 0); toast("Reminders are back on"); return true; }
    if (act === "sbw-startup") { try { DESK.openStartupSettings(); } catch (e) {} return true; }
    if (act === "sbw-fs") { try { DESK.fullscreen(); } catch (e) {} return true; }
    return false;
  });
  hook("render", pushSoon);
  hook("changed", pushSoon);
  hook("boot", () => {
    if (DESK_OK) {
      if (DESK.onAction) DESK.onAction((a, arg) => doAction(a, arg));
      if (DESK.onOpenTask) DESK.onOpenTask(id => setTimeout(() => openTaskById(id), 0));
    }
    // Windows 11 Widgets board: the widget asks this page to check off a task or open one.
    if ("serviceWorker" in navigator && !DESK && !inClaude()) navigator.serviceWorker.addEventListener("message", e => {
      const m = e.data; if (!m || m.type !== "sb-widget-click" || typeof m.id !== "string") return;
      if (m.verb === "done") doAction("done", m.id); else if (m.verb === "task") doAction("task", m.id); else if (ACTIONS.includes(m.verb)) doAction(m.verb);
    });
    // Theme and style changes don't always redraw the page, so watch for them to recolor the widget.
    try { new MutationObserver(pushSoon).observe(document.documentElement, {attributes: true, attributeFilter: ["data-theme", "data-skin", "style", "class"]}); } catch(e) {}
    if (window.matchMedia) window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", pushSoon);
    // Keep the date and Today's Plan fresh, even when nothing changes.
    setInterval(push, 5 * 60000);
    handleUrl();
    push();
  });
})();


