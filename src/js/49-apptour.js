/* ===== module: 49-apptour.js ===== */
/* App Tour: a coach-mark walk around the app */
(() => {
  const KEY = "studyboard:tour";
  // Remembered per device and per account, like the welcome setup
  const acctKey = () => typeof sbUser !== "undefined" && sbUser && sbUser.id ? KEY + ":" + sbUser.id : "";
  const newAccount = () => { try { const t = Date.parse((sbUser && sbUser.created_at) || ""); return t > 0 && Date.now() - t < 2 * 864e5; } catch (e) { return false; } };
  const flag = () => { try { const a = acctKey(); if (a) { const v = localStorage.getItem(a); if (v) return v; if (newAccount()) return ""; } return localStorage.getItem(KEY) || ""; } catch (e) { return "done"; } };
  const setFlag = v => { try { localStorage.setItem(KEY, v); const a = acctKey(); if (a) localStorage.setItem(a, v); } catch (e) {} };
  const phone = () => !!(window.matchMedia && matchMedia("(max-width:719px)").matches);
  const NAV = t => `nav.tabs [data-tab="${t}"]`;

  // Each step opens the real screen it talks about, then points at part of it
  const SETTINGS = ['nav.tabs .nav-tool[data-act="menu"]', 'header.top [data-act="menu"]'];
  const BELL = ['header.top .ann-btn', 'nav.tabs .ann-btn'], POMO = ["#navPomo", "#pomoBtn"], SEARCH = ['nav.tabs .nav-tool[data-act="search"]', 'header.top [data-act="search"]'];
  const STEPS = [
    {id: "welcome", title: "Welcome to Studyboard", tab: "board",
      text: () => "A quick tour, about a minute. We'll open each screen as we go, filled with example courses and tasks, not your own. Use the arrow keys or the buttons, and skip any time."},
    {id: "add", title: "Add Your Work", tab: "board", sel: [".qa-wrap .qa-bar", "#fab"],
      text: () => "Type a sentence like \"Essay due Friday 5pm\" and press Enter. Studyboard fills in the course, date and type. The + button opens the full form."},
    {id: "today", title: "Today's Plan", tab: "board", go: () => { ui.bview = "plan"; }, sel: [".bview-tabs", ".focus.plan", NAV("board")],
      text: () => "Today's Plan lines up what to work on next and for how long, with time set aside for each task around your classes and free time."},
    {id: "taskboard", title: "Task Board", tab: "board", go: () => { ui.bview = "board"; }, sel: [".bview-tabs", ".board-sec-head", NAV("board")],
      text: () => "Every task by status: To Do, In Work and Complete. Drag a card to move it along, filter by course, or group the board by course."},
    {id: "timeline", title: "Calendar: Due Dates", tab: "timeline", sel: [".pview-tabs", NAV("plan")],
      text: () => "Every deadline across your courses, on a timeline or a month calendar. Calendar has three views: Due Dates, Schedule and Crunch."},
    {id: "schedule", title: "Calendar: Schedule", tab: "schedule", sel: [".pview-tabs", NAV("plan")],
      text: () => "Your week of classes, labs, shifts and appointments. Study time is planned around it."},
    {id: "crunch", title: "Calendar: Crunch", tab: "crunch", sel: [".pview-tabs", NAV("plan")],
      text: () => "A heatmap of your term. A week with several exams and a paper glows red weeks ahead, and tapping it shows what to start early."},
    {id: "cards", title: "Review: Flashcards and Quizzes", tab: "flashcards", sel: [".pview-tabs", NAV("flashcards")],
      text: () => "Make decks by hand, or let AI build cards and practice quizzes from your notes and readings. Spaced repetition brings reviews back at the right time."},
    {id: "notes", title: "Notes and Stickers", tab: "notes", sel: [NAV("notes")],
      text: () => "Sticky notes for quick thoughts, on boards of your own. Give them a course, pick a color and a pin, and decorate them with stickers."},
    {id: "files", title: "Files", tab: "files", sel: [".cf-tabs", NAV("courses")],
      text: () => "Keep readings, slides and handouts with their course, and attach them to tasks. Search can read inside them."},
    {id: "courses", title: "Courses and School Sites", tab: "courses", go: () => { ui.courseTab = ""; }, sel: [".cf-tabs", NAV("courses")],
      text: () => "Each course keeps its class times, tasks, files and instructors. Connect Brightspace, Canvas or Blackboard in Settings to bring in deadlines and grades; with Canvas, your inbox shows under Emails."},
    {id: "grades", title: "Grades", tab: "courses", go: () => { ui.courseId = null; ui.courseTab = "grades"; }, sel: [".cf-tabs", ".gp-hero", NAV("courses")],
      text: () => "Your marks and average in each course as they come in. Set the weights to see what you need on the remaining work to reach your target grade."},
    {id: "ann", title: "Announcements", panel: "ann", has: BELL, sel: ["#dlg .ann-sheet .sheet-head", "#dlg .ann-sheet"],
      text: () => "Announcements from your school site collect here, with a dot for the ones you haven't read."},
    {id: "companion", title: "Your Study Companion", tab: "companion", has: [NAV("companion")], sel: [".cpt-head", NAV("companion")],
      text: () => "Your companion cheers you on as you work. Chat with it about your deadlines and courses (with AI set up), look back at your chats under History, and dress it up in the Wardrobe."},
    {id: "focus", title: "Focus Timer", panel: "pomo", has: POMO, sel: ["#pomoDlg .pomo-dial", "#pomoDlg .sheet", "#pomoDlg"],
      text: () => "The timer follows the Pomodoro method: short bursts of focused work with breaks in between. Start a session on any task; the time counts toward the task and your streak, and your companion keeps you company.",
      more: {label: "How the Pomodoro Method Works", html: POMO_HOW}},
    {id: "search", title: "Search and Ask AI", panel: "search", has: SEARCH, sel: ["#sxDlg .sx-field", "#sxDlg"],
      text: () => "Find tasks, cards, notes and text inside your files from anywhere (Ctrl or Cmd K). Switch to Ask With AI to ask questions about your own material."},
    {id: "groups", title: "Study Groups", tab: "groups", has: [NAV("groups")], sel: [NAV("groups")],
      text: () => "Study with classmates: share decks and quizzes, plan sessions, run a weekly challenge and chat. A group project keeps its tasks, files and meetings together."},
    {id: "settings", title: "Settings", panel: "settings", fresh: true, has: SETTINGS, sel: ["#dlg .us-cats", '#dlg [data-act="plan-open"]', "#dlg .menu-list", "#dlg .sheet"],
      text: () => "Themes and dark mode, study hours, reminders, calendar sync, AI, backups, sign in and Studyboard Pro all live here."},
    {id: "help", title: "Found a Bug? Tell Us", panel: "settings", has: SETTINGS, prep: () => { const c = $('#dlg [data-us="app"]'); if (c) c.click();
        const help = () => [...document.querySelectorAll("#dlg .us-sub-tab")].find(t => /^\s*Help\s*$/.test(t.textContent));
        const go = (n) => { const h = help(); if (h) { if (h.getAttribute("aria-selected") !== "true") h.click(); } else if (n > 0) setTimeout(() => go(n - 1), 50); };
        go(10); },
      sel: ['#dlg [data-act="bug-open"]', "#dlg .us-cats", "#dlg .sheet"],
      text: () => "Choose Report a Bug or Send Feedback. It goes straight to the person who makes Studyboard, with an optional screenshot. You can replay this tour from here too."},
    {id: "done", title: "You're Ready", tab: "board",
      text: () => "That's the tour. Add your first task and Today's Plan takes it from there."}
  ];

  let steps = [], i = 0, root = null, spot = null, card = null, tgt = null, opened = null, saved = null, onKey = null, raf = 0, active = false, seq = 0, panel = "";

  function demoPlanner(){
    const t0 = todayISO(), D = n => addDays(t0, n), now = Date.now();
    const T = (id, title, c, type, due, o) => Object.assign({id: "demo-" + id, title, courseId: "demo-" + c, type, start: D(-3), due, time: "", priority: "med", status: "todo", notes: "", hours: 2,
      checklist: [], pct: 0, dependsOn: [], history: [], created: now, order: 10}, o || {});
    const wd = (k => (k + 7) % 7);
    return fromArrays({
      courses: [
        {id: "demo-bio", name: "Anatomy & Physiology", code: "BIOL 1200", color: "#1E9E74", meetings: [{id: "m1", kind: "Lecture", days: [1, 3], start: "09:30", end: "11:20", where: "SW1 2015"}, {id: "m2", kind: "Lab", days: [4], start: "13:30", end: "16:20", where: "Lab B"}]},
        {id: "demo-psy", name: "Intro to Psychology", code: "PSYC 1010", color: "#3B6FE0", meetings: [{id: "m3", kind: "Lecture", days: [2, 4], start: "11:30", end: "12:50", where: "Hall C"}]},
        {id: "demo-eng", name: "Academic Writing", code: "ENGL 1100", color: "#D9661F", meetings: [{id: "m4", kind: "Seminar", days: [5], start: "10:00", end: "11:50", where: "Room 214"}]}],
      tasks: [
        T("t1", "Research Essay Draft", "eng", "Assignment", D(2), {time: "23:59", weight: 20, pct: 40, status: "doing", hours: 4, checklist: [{id: "a", text: "Outline", done: true}, {id: "b", text: "Find 5 sources", done: true}, {id: "c", text: "Write body", done: false}]}),
        T("t2", "Midterm Exam", "bio", "Exam", D(5), {time: "09:30", weight: 30, hours: 6, location: "SW1 1020"}),
        T("t3", "Chapter 6 Quiz", "psy", "Quiz", D(1), {time: "23:00", weight: 5, hours: 1}),
        T("t4", "Lab Report: Heart Rate", "bio", "Lab", D(8), {weight: 10, hours: 3}),
        T("t5", "Read Chapter 7", "psy", "Reading", D(3), {hours: 1}),
        T("t6", "Discussion Post 4", "eng", "Assignment", D(-1), {weight: 2, hours: 1}),
        T("t7", "Group Presentation", "psy", "Project", D(16), {weight: 20, hours: 5}),
        T("t8", "Final Exam", "bio", "Exam", D(40), {weight: 35, hours: 10}),
        T("t9", "Chapter 5 Quiz", "psy", "Quiz", D(-6), {status: "done", doneAt: now - 6 * 864e5, pct: 100, mark: {got: 22, outOf: 25}, weight: 5}),
        T("t10", "Lab Report: Cells", "bio", "Lab", D(-9), {status: "done", doneAt: now - 8 * 864e5, pct: 100, mark: {got: 46, outOf: 50}, weight: 10}),
        T("t11", "Essay Outline", "eng", "Assignment", D(-4), {status: "done", doneAt: now - 4 * 864e5, pct: 100, mark: {got: 81, outOf: 100}, weight: 5})],
      events: [{id: "demo-e1", title: "Study Group", courseId: "demo-bio", date: D(2), start: "15:00", end: "16:30", allDay: false, where: "Library", created: now},
        {id: "demo-e2", title: "Part-time Shift", date: D(wd(6 - new Date().getDay()) || 1), start: "12:00", end: "17:00", allDay: false, created: now}],
      notes: [{id: "demo-n1", text: "Ask about the midterm review session", created: now, courseId: "demo-bio", color: "yellow", x: 540, y: 330, rot: -2, pin: "pin", stickers: [{k: "fstar", x: 84, y: 76, r: 14}]},
        {id: "demo-n2", text: "Essay: find one more peer-reviewed source", created: now - 1000, courseId: "demo-eng", color: "pink", x: 400, y: 90, rot: 2, pin: "tape", stickers: [{k: "pencil", x: 82, y: 80, r: 12}]},
        {id: "demo-n3", text: "Bring calculator Thursday", created: now - 2000, color: "blue", x: 690, y: 40, rot: -1, pin: "pin", stickers: [{k: "think", x: 82, y: 74, r: 8}]}],
      decks: [{id: "demo-d1", name: "Heart Terms", courseId: "demo-bio", cards: [{id: "k1", front: "Systole", back: "When the heart contracts"}, {id: "k2", front: "Diastole", back: "When the heart relaxes and fills"},
        {id: "k3", front: "Preload", back: "How stretched the heart is before it contracts"}, {id: "k4", front: "Afterload", back: "The pressure the heart pushes against"}], quizzes: [], aiQuizzes: []},
        {id: "demo-d2", name: "Memory and Learning", courseId: "demo-psy", cards: [{id: "k5", front: "Encoding", back: "Getting information into memory"}, {id: "k6", front: "Retrieval", back: "Getting it back out"}], quizzes: [], aiQuizzes: []}],
      files: []});
  }
  const useDemo = () => !Object.keys(state.tasks || {}).length;
  let demoData = null;

  const visible = el => { if (!el || !el.isConnected) return false; const r = el.getBoundingClientRect(); if (r.width < 2 || r.height < 2 || !el.getClientRects().length) return false; const cs = getComputedStyle(el); return cs.visibility !== "hidden" && cs.display !== "none"; };
  const findIn = list => { for (const q of list || []) { let el = null; try { el = document.querySelector(q); } catch (e) {} if (visible(el)) return el; } return null; };
  const find = s => findIn(s.sel);
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const gotoTab = t => {
    if (!t) return;
    if (ui.tab !== t) { if (t === "flashcards") { ui.fc = null; ui.deckId = null; } if (t !== "courses") ui.courseId = null; if (t === "timeline") ui.tlJump = true; ui.tab = t; render(); window.scrollTo(0, 0); }
  };
  // Sheets the tour opens on top of the page
  const press = list => { const b = findIn(list); if (b) b.click(); };
  const PANELS = {
    settings: {dlg: () => dlg, open: () => menuSheet()},
    ann: {dlg: () => dlg, open: () => press(BELL)},
    pomo: {dlg: () => $("#pomoDlg"), open: () => press(POMO)},
    search: {dlg: () => $("#sxDlg"), open: () => press(SEARCH)}
  };
  function closePanel(){
    if (!panel) return;
    const d = PANELS[panel].dlg(); panel = "";
    try { if (d && d.open) d.close(); } catch (e) {}
  }
  // The tour is itself a modal dialog, so it can sit above the sheets it opens
  function raise(){
    if (!root) return;
    try { if (root.open) root.close(); root.showModal(); } catch (e) { root.setAttribute("open", ""); }
  }
  async function enter(s, my){
    if (panel && panel !== s.panel) closePanel();
    { const want = s.id === "done" ? null : demoData; if (tourDemo !== want) { tourDemo = want; if (!s.panel && ui.tab === s.tab) render(); } }
    if (s.panel) {
      if (panel === s.panel && s.fresh) closePanel();
      if (panel !== s.panel) { if (dlg.open && PANELS[s.panel].dlg() === dlg) dlg.close(); panel = s.panel; try { PANELS[s.panel].open(); } catch (e) { console.error(e); } raise(); }
      if (s.prep) { try { s.prep(); } catch (e) {} }
    } else { if (s.go) { try { s.go(); } catch (e) {} if (ui.tab === s.tab) render(); } gotoTab(s.tab); }
    for (let n = 0; s.sel && n < 16 && my === seq && active; n++) { if (find(s)) break; await wait(50); }
  }

  /* ---------- Drawing ---------- */
  function build(){
    root = document.createElement("dialog"); root.id = "sbTour"; root.className = "tour"; root.setAttribute("aria-label", "App tour");
    root.innerHTML = `<div class="tour-block"></div><div class="tour-spot" aria-hidden="true"></div>
      <div class="tour-card" role="document" aria-labelledby="tourT" aria-describedby="tourD" tabindex="-1">
        <div class="tour-top"><div class="tour-step mini" id="tourN"></div><span class="tour-ex" id="tourEx">Example Data</span></div><h2 id="tourT"></h2><p id="tourD"></p>
        <div class="tour-more" id="tourMore" hidden><button type="button" class="link-btn" data-tour="more" aria-expanded="false" aria-controls="tourMoreBody"></button><div class="tour-more-body" id="tourMoreBody" hidden></div></div>
        <div class="tour-dots" id="tourDots" aria-hidden="true"></div>
        <div class="tour-foot"><button type="button" class="btn small tour-skip" data-tour="skip">Skip Tour</button><span class="spacer"></span><button type="button" class="btn small" data-tour="back">Back</button><button type="button" class="btn small primary" data-tour="next">Next</button></div>
      </div>`;
    document.body.appendChild(root);
    spot = root.querySelector(".tour-spot"); card = root.querySelector(".tour-card");
    raise();
    root.addEventListener("cancel", e => { e.preventDefault(); finish(false); });
    root.addEventListener("click", e => {
      const b = e.target.closest("[data-tour]"); if (!b) return;
      e.preventDefault(); e.stopPropagation();
      const a = b.dataset.tour;
      if (a === "more") { const body = $("#tourMoreBody"), open = body.hidden; body.hidden = !open; b.setAttribute("aria-expanded", String(open)); requestAnimationFrame(place); return; }
      if (a === "next") move(1); else if (a === "back") move(-1); else finish(false);
    });
    onKey = e => {
      if (!active) return;
      if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); finish(false); return; }
      if (e.key === "ArrowRight" || (e.key === "Enter" && !e.target.closest("button"))) { e.preventDefault(); e.stopPropagation(); move(1); return; }
      if (e.key === "ArrowLeft") { e.preventDefault(); e.stopPropagation(); move(-1); return; }
      if (e.key === "Tab") {
        const f = [...card.querySelectorAll("button:not([disabled])")].filter(b => b.offsetParent);
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && (document.activeElement === first || !card.contains(document.activeElement))) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && (document.activeElement === last || !card.contains(document.activeElement))) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", onKey, true);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
  }

  function place(){
    if (!active || !card) return;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      if (!active || !card) return;
      const vw = innerWidth, vh = innerHeight, pad = 8, cw = Math.min(card.offsetWidth || 340, vw - 24), ch = card.offsetHeight || 200;
      if (!tgt || !visible(tgt)) {
        root.classList.add("center"); spot.style.cssText = ""; card.style.cssText = "";
        return;
      }
      root.classList.remove("center");
      const r = tgt.getBoundingClientRect();
      const sx = Math.max(4, r.left - pad), sy = Math.max(4, r.top - pad), sw = Math.min(vw - 8, r.width + pad * 2), sh = Math.min(vh - 8, r.height + pad * 2);
      spot.style.cssText = `left:${sx}px;top:${sy}px;width:${sw}px;height:${sh}px`;
      let x, y;
      if (phone() || vw < 560) {
        x = Math.round((vw - cw) / 2);
        const mid = sy + sh / 2;
        y = mid > vh / 2 ? Math.max(12, sy - ch - 14) : Math.min(vh - ch - 12, sy + sh + 14);
        if (mid > vh / 2 && sy - ch - 14 < 12) y = 12;
      } else {
        const room = {right: vw - (sx + sw) - 16, left: sx - 16, below: vh - (sy + sh) - 16, above: sy - 16};
        if (room.right >= cw) { x = sx + sw + 14; y = sy + sh / 2 - ch / 2; }
        else if (room.below >= ch) { x = sx + sw / 2 - cw / 2; y = sy + sh + 14; }
        else if (room.above >= ch) { x = sx + sw / 2 - cw / 2; y = sy - ch - 14; }
        else if (room.left >= cw) { x = sx - cw - 14; y = sy + sh / 2 - ch / 2; }
        else { x = vw - cw - 16; y = vh - ch - 16; }
        x = Math.max(12, Math.min(vw - cw - 12, x)); y = Math.max(12, Math.min(vh - ch - 12, y));
      }
      card.style.cssText = `left:${Math.round(x)}px;top:${Math.round(y)}px;width:${cw}px`;
    });
  }

  async function show(){
    const s = steps[i]; if (!s) { finish(true); return; }
    const my = ++seq;
    await enter(s, my);
    if (my !== seq || !active || !card) return;
    tgt = find(s);
    if (tgt && !tgt.closest("nav,header,#fab,#sbTour")) { try { tgt.scrollIntoView({block: "center", behavior: "auto"}); } catch (e) {} }
    $("#tourN").textContent = `${i + 1} of ${steps.length}`;
    { const ex = $("#tourEx"); if (ex) ex.hidden = !demoData || s.id === "done"; }
    $("#tourT").textContent = s.title;
    $("#tourD").textContent = SPELL.fix(s.text());
    { const m = $("#tourMore"), b = m.querySelector("button"), body = $("#tourMoreBody");
      m.hidden = !s.more; body.hidden = true; b.setAttribute("aria-expanded", "false");
      if (s.more) { b.textContent = s.more.label; body.innerHTML = s.more.html; } else body.innerHTML = ""; }
    $("#tourDots").innerHTML = steps.map((_, k) => `<span class="${k === i ? "on" : k < i ? "past" : ""}"></span>`).join("");
    const back = card.querySelector('[data-tour="back"]'), next = card.querySelector('[data-tour="next"]'), skip = card.querySelector('[data-tour="skip"]');
    back.hidden = i === 0; next.textContent = i === steps.length - 1 ? "Done" : i === 0 ? "Start" : "Next";
    skip.hidden = i === steps.length - 1;
    root.classList.toggle("last", i === steps.length - 1);
    place(); setTimeout(place, 120); setTimeout(place, 400);
    try { next.focus({preventScroll: true}); } catch (e) { next.focus(); }
  }

  // dir 1 or -1
  function move(dir){
    if (!active) return;
    const k = i + dir;
    if (k >= steps.length) { finish(true); return; }
    if (k < 0) return;
    i = k; show();
  }

  function finish(completed){
    if (!active) return;
    active = false; seq++;
    cancelAnimationFrame(raf);
    document.removeEventListener("keydown", onKey, true);
    window.removeEventListener("resize", place);
    window.removeEventListener("scroll", place, true);
    if (root) { try { if (root.open) root.close(); } catch (e) {} root.remove(); }
    root = spot = card = tgt = null;
    closePanel();
    tourDemo = null; demoData = null;
    setFlag("done");
    const s = saved || {tab: "board"};
    try { if (s.planView) planViewSet(s.planView); } catch (e) {}
    ui.tab = s.tab || "board"; ui.courseId = s.courseId || null; ui.courseTab = s.courseTab || ""; ui.bview = s.bview;
    if (ui.tab === "flashcards") { ui.fc = s.fc || null; ui.deckId = s.deckId || null; }
    render(); window.scrollTo(0, s.scrollY || 0);
    if (opened && opened.isConnected) { try { opened.focus({preventScroll: true}); } catch (e) {} }
    saved = null; opened = null;
    if (window.SBSEM) SBSEM.afterTour();
    if (completed && ui.tab === "board") setTimeout(() => { const q = $("#qaIn"); if (q && !dlg.open) { const bar = q.closest(".qa-bar"); if (bar) { bar.classList.add("ob-glow"); setTimeout(() => bar.classList.remove("ob-glow"), 2600); } } }, 200);
  }

  function start(){
    if (active) return;
    if (dlg.open) dlg.close();
    try { const p = $("#pomoDlg"); if (p && p.open) p.close(); } catch (e) {}
    try { const x = $("#sxDlg"); if (x && x.open) x.close(); } catch (e) {}
    active = true; opened = document.activeElement; panel = "";
    try { demoData = useDemo() ? demoPlanner() : null; } catch (e) { console.error(e); demoData = null; }
    tourDemo = demoData;
    saved = {tab: ui.tab, planView: ui.planView, courseId: ui.courseId, courseTab: ui.courseTab, bview: ui.bview, fc: ui.fc, deckId: ui.deckId, scrollY: window.scrollY};
    steps = STEPS.filter(s => s.has ? !!findIn(s.has) : !s.sel || ((s.go && s.go()), gotoTab(s.tab), render(), !!find(s)));
    i = 0;
    build();
    show();
  }

  /* It never starts on its own: the welcome setup's last page and Settings offer it */
  window.SBTOUR = {start, active: () => active, taken: () => flag() === "done"};
  hook("menu", () => `<button data-act="tour-open" data-group="app"><span>Take the App Tour<span class="sub">A one-minute walk around the tabs and controls</span></span></button>`);
  hook("act", act => {
    if (act !== "tour-open") return false;
    if (dlg.open) dlg.close();
    setTimeout(start, 60);
    return true;
  });
})();


