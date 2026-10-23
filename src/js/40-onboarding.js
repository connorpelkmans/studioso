/* ===== module: 40-onboarding.js ===== */
/* First-run onboarding */
(() => {
  const KEY = "sb:onboarded", QKEY = "studyboard:quoteDay";
  const acctKey = () => sbUser && sbUser.id ? KEY + ":" + sbUser.id : "";
  const newAccount = () => { try { const t = Date.parse((sbUser && sbUser.created_at) || ""); return t > 0 && Date.now() - t < 2 * 86400000; } catch (e) { return false; } };
  const isDone = () => { try { const a = acctKey(); if (a && localStorage.getItem(a)) return true; if (a && newAccount()) return false; return !!localStorage.getItem(KEY); } catch (e) { return true; } };
  const markDone = () => { try { localStorage.setItem(KEY, "1"); const a = acctKey(); if (a) localStorage.setItem(a, "1"); } catch (e) {} };
  const isEmpty = () => !Object.keys(state.courses || {}).length && !Object.keys(state.tasks || {}).length;
  // The tour is open, or still to come for this account
  window.SBOB = {pending: () => !!document.querySelector("dialog[open] .ob") || (!isDone() && isEmpty()), T: {plan: null}};

  // The Backups step shows only where a web page can save to a folder
  const cbk = () => window.SBCLOUD && SBCLOUD.backup;
  const cloudBkHere = () => { const B = cbk(); return !!B && (B.possible("google") || B.possible("microsoft")); };
  const backupsHere = () => { try { return !DESK && !inPreview() && ((typeof FSB !== "undefined" && FSB.supported()) || cloudBkHere()); } catch (e) { return false; } };
  const bkOnText = () => { const B = cbk(); return B && B.on() ? `${B.name(B.provider())} › Studyboard › Backups` : FSB.status === "on" ? FSB.where : ""; };
  // First run asks only the essentials; the rest is offered later from a card on the Board
  const FIRST = ["welcome", "area", "courses", "hours", "done"], MORE = ["theme", "reminders", "ai", "app", "backups", "pro", "done"];
  const ALL_STEPS = [
    {id: "welcome", title: "Welcome"},
    {id: "area", title: "Your Studies"},
    {id: "courses", title: "Your Courses"},
    {id: "theme", title: "Pick a Theme"},
    {id: "hours", title: "Study Hours"},
    {id: "reminders", title: "Reminders"},
    {id: "ai", title: "AI"},
    {id: "app", title: "Get the App"},
    {id: "backups", title: "Backups"},
    {id: "pro", title: "Free Week of Pro"},
    {id: "done", title: "Done"}
  ];
  let STEPS = ALL_STEPS, mode = "first";
  // The later "A Few More Things" card
  const MKEY = "sb:onboarded:more";
  const moreGet = () => { try { return JSON.parse(localStorage.getItem(MKEY) || "{}") || {}; } catch (e) { return {}; } };
  const moreSet = patch => { try { localStorage.setItem(MKEY, JSON.stringify(Object.assign(moreGet(), patch))); } catch (e) {} };
  const noteEnd = () => { if (mode === "more") moreSet({done: Date.now()}); else if (!moreGet().at) moreSet({at: Date.now()}); };
  const THEME_PICKS = ["classic", "lavender", "japan", "italy", "ocean", "sakura", "galaxy", "cafe"];

  // Tour state (lives only while the tour is open)
  let step = 0, cheered = false, dir = 1, away = null, finishing = false, added = [], newColor = null, remindersOk = false, remindersMsg = "", deviceTab = null, hoursTimer = 0;

  /* Icons */
  const svg = (d, extra = "") => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${d}</svg>`;
  const IC = {
    board: svg('<rect x="3" y="4" width="5" height="16" rx="1.5"/><rect x="10" y="4" width="5" height="11" rx="1.5"/><rect x="17" y="4" width="4" height="7" rx="1.5"/>'),
    plan: svg('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>'),
    tools: svg('<rect x="3" y="7" width="14" height="13" rx="2"/><path d="M7 4h12a2 2 0 0 1 2 2v11"/><path d="M7 12h6M7 15.5h4"/>'),
    courses: svg('<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5M8 7h7"/>'),
    theme: svg('<path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.8-.8 1.8-1.7 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-.9.8-1.7 1.7-1.7H17a4 4 0 0 0 4-4C21 6.6 17 3 12 3z"/><circle cx="7.5" cy="11" r="1.2" fill="currentColor"/><circle cx="10" cy="7.2" r="1.2" fill="currentColor"/><circle cx="14.5" cy="7.2" r="1.2" fill="currentColor"/>'),
    clock: svg('<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 1.5M9 2.5h6"/>'),
    bell: svg('<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>'),
    ai: svg('<path d="M12 3l1.8 4.9a2 2 0 0 0 1.3 1.3L20 11l-4.9 1.8a2 2 0 0 0-1.3 1.3L12 19l-1.8-4.9a2 2 0 0 0-1.3-1.3L4 11l4.9-1.8a2 2 0 0 0 1.3-1.3z"/>'),
    phone: svg('<rect x="6.5" y="2.5" width="11" height="19" rx="2.5"/><path d="M10.5 18.5h3"/>'),
    party: svg('<path d="M4 20l4.5-12L16 15.5z"/><path d="M13 4.5c.6 1.2.4 2.6-.5 3.5M18.5 9.5c-1.2-.4-2.6 0-3.4 1M19 4l-.5 1.5M20.5 13.5l-1.5-.5M9.5 3.5l.5 1.5"/>'),
    check: svg('<path d="M5 12.5l4.5 4.5L19 7.5"/>', 'stroke-width="2.6"'),
    share: svg('<path d="M12 3v12M8 7l4-4 4 4"/><path d="M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1"/>'),
    plusSq: svg('<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M12 8.5v7M8.5 12h7"/>'),
    dots: svg('<circle cx="12" cy="5.5" r="1.3" fill="currentColor"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/><circle cx="12" cy="18.5" r="1.3" fill="currentColor"/>'),
    folder: svg('<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M12 10v5M9.5 12.5L12 15l2.5-2.5"/>'),
    install: svg('<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M12 7.5v6M9.5 11l2.5 2.5 2.5-2.5M8 20.5h8"/>'),
    upload: svg('<path d="M12 15V4M8 8l4-4 4 4"/><path d="M4 15v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4"/>')
  };
  // Where backups go
  const BK_LOGO = {
    gdrive: BRAND_LOGO.gdrive,
    onedrive: BRAND_LOGO.onedrive,
    other: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7.5A1.5 1.5 0 0 1 4.5 6H9l2 2h8.5A1.5 1.5 0 0 1 21 9.5v8a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5z"/></svg>'
  };
  const hero = (ic, cls = "") => `<div class="ob-hero ${cls}" aria-hidden="true">${ic}</div>`;

  /* Device detection for install tips */
  const UA = navigator.userAgent || "";
  const isIOS = () => /iPhone|iPad|iPod/.test(UA) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isAndroid = () => /Android/i.test(UA);
  const standalone = () => !!(window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) || navigator.standalone === true;
  const deviceKind = () => isIOS() ? "iphone" : isAndroid() ? "android" : "computer";
  const isWindows = () => /Windows/i.test(UA), isMac = () => /Macintosh|Mac OS X/i.test(UA) && !isIOS();
  // On a computer the real apps come first
  const MS_STORE = "https://apps.microsoft.com/detail/9N8PHL54N3SN", MAC_DL = DESK_DL;
  const ext = (href, label) => `<a href="${href}" target="_blank" rel="noopener noreferrer">${label}</a>`;

  /* Steps */
  function welcomeStep(){
    return `<div class="ob-logo" aria-hidden="true"></div>
      <h2 class="ob-h" id="obH" tabindex="-1">Welcome to Studyboard</h2>
      <p class="ob-lead">Your courses, deadlines and study time in one calm place. Setting up takes about a minute, and you can skip anything.</p>
      <ul class="ob-points">
        <li><span class="ob-pi">${IC.board}</span><span><b>Every Deadline in One Place</b><span>See assignments, exams and labs for all your courses on a board, a timeline and a weekly schedule.</span></span></li>
        <li><span class="ob-pi">${IC.plan}</span><span><b>A Plan for Today</b><span>Today's Plan picks what to do next and fits your work into the hours you have.</span></span></li>
        <li><span class="ob-pi">${IC.tools}</span><span><b>Study Tools Built In</b><span>Notes, files, flashcards and a focus timer. It all works offline too.</span></span></li>
      </ul>
      <p class="mini" style="margin:12px 2px 0">Studyboard can send anonymous crash reports (never your tasks, notes or account details) so bugs get fixed. Turn them off any time in Settings.</p>`;
  }

  function areaStep(){
    const a = SBAREA.get() || {id: "", text: ""};
    return `${hero(IC.courses)}
      <h2 class="ob-h" id="obH" tabindex="-1">What Do You Study?</h2>
      <p class="ob-lead">Pick your area so Studyboard can tailor task types, example tasks, typical hours and its AI helpers to it. Change it any time in Settings.</p>
      ${SBAREA.chips(a.id, "data-ob-area")}
      <label class="f ob-area-text"><span class="lbl">Your Major or Program <span class="hint">optional</span></span><input type="text" id="obAreaText" maxlength="60" value="${esc(a.text || "")}" placeholder="e.g. Marine Biology" autocomplete="off" data-noenter></label>`;
  }

  function coursesStep(){
    const cs = coursesArr();
    const used = cs.map(c => c.color);
    if (!newColor || !COLORS.includes(newColor)) newColor = COLORS.find(x => !used.includes(x)) || COLORS[used.length % COLORS.length];
    const list = cs.length ? `<ul class="ob-clist" aria-label="Your courses">${cs.map(c => `<li style="--c:${esc(c.color || "#8A94A6")}"><span class="ob-cdot" aria-hidden="true"></span><span class="ob-cname">${c.code ? `<b>${esc(c.code)}</b>` : ""}${c.name && c.name !== c.code ? `${c.code ? " " : ""}${esc(c.name)}` : ""}</span>${added.includes(c.id) ? `<button type="button" class="x-btn" data-ob="rm-course" data-id="${esc(c.id)}" aria-label="Remove ${esc(c.name)}">${CLOSE}</button>` : ""}</li>`).join("")}</ul>`
      : `<p class="ob-empty mini">No courses yet. Add the ones you're taking this term.</p>`;
    return `${hero(IC.courses)}
      <h2 class="ob-h" id="obH" tabindex="-1">Your Courses</h2>
      <p class="ob-lead">Add the courses you're taking. Each one gets a color so you can spot its work at a glance.</p>
      ${list}
      <div class="ob-cadd">
        <div class="ob-cfields">
          <label class="f ob-code">Course Code<input type="text" id="obCode" maxlength="30" placeholder="e.g. BIOL 101" autocomplete="off" data-noenter></label>
          <label class="f ob-name">Course Name<input type="text" id="obName" maxlength="120" placeholder="e.g. Biology 101" autocomplete="off" data-noenter></label>
        </div>
        <div class="ob-crow">
          <div class="swatches ob-sw" role="radiogroup" aria-label="Course color">${COLORS.map((x, i) => `<label><input type="radio" name="obColor" value="${x}" ${x === newColor ? "checked" : ""} aria-label="Color ${i + 1}"><span style="--c:${x}"></span></label>`).join("")}</div>
          <button type="button" class="btn primary" data-ob="add-course">Add Course</button>
        </div>
        <p class="status-msg mini" id="obCMsg" aria-live="polite" style="margin:0"></p>
      </div>
      <div class="ob-alt">
        <span class="ob-alt-ic" aria-hidden="true">${IC.upload}</span>
        <span class="ob-alt-t"><b>Have a Syllabus PDF?</b><span class="mini">Import it to add the course and its dated work in one go. You'll come right back here.</span></span>
        <button type="button" class="btn" data-ob="import">Import a Syllabus</button>
      </div>
      <div class="ob-alt">
        <span class="ob-alt-ic" aria-hidden="true">${IC.upload}</span>
        <span class="ob-alt-t"><b>Use Brightspace, Canvas or Blackboard?</b><span class="mini">Connect it to bring in your courses, due dates and grades automatically.</span></span>
        <button type="button" class="btn" data-ob="brightspace">Connect</button>
      </div>`;
  }

  function themeStep(){
    const cur = styleCfg().skin, dark = isDark();
    const spare = SKINS.filter(s => s.group === "plain" && !THEME_PICKS.includes(s.id) && owns("skin", s.id));
    const picks = THEME_PICKS.map(id => SKINS.find(s => s.id === id) || spare.shift()).filter(Boolean).map(s => owns("skin", s.id) ? s : spare.shift() || s);
    const cur0 = SKINS.find(s => s.id === cur && owns("skin", s.id));
    if (cur0 && !picks.includes(cur0)) picks[picks.length - 1] = cur0;
    { const ad = SBAREA.def(), fs = ad && ad.skin && SKINS.find(s => s.id === ad.skin); if (fs && owns("skin", fs.id) && !picks.includes(fs)) picks.splice(0, 1, fs); }
    const mode = (() => { try { const t = localStorage.getItem("studioso:theme"); return t === "dark" || t === "light" ? t : "system"; } catch (e) { return "system"; } })();
    return `${hero(IC.theme)}
      <h2 class="ob-h" id="obH" tabindex="-1">Pick a Theme</h2>
      <p class="ob-lead">Make it yours. Tap a theme to try it on; you can change it any time.</p>
      <div class="ob-mode"><span class="mini">Appearance</span><div class="segb" role="group" aria-label="Appearance">${[["system", "System"], ["light", "Light"], ["dark", "Dark"]].map(([k, l]) => `<button type="button" data-ob="mode" data-id="${k}" aria-pressed="${mode === k}">${l}</button>`).join("")}</div></div>
      <div class="ob-themes" role="group" aria-label="Themes">${picks.map(s => `<button type="button" class="ob-theme ${s.id === cur ? "on" : ""}" aria-pressed="${s.id === cur}" data-ob="skin" data-id="${esc(s.id)}">
          ${skinPreview(s, dark)}<span class="ob-tb">${s.tier === "pro" ? PRO_BADGE : FREE_BADGE}</span><span class="ob-tname">${esc(s.name)}</span>${s.id === cur ? `<span class="ob-tick" aria-hidden="true">${IC.check}</span>` : ""}</button>`).join("")}</div>
      <p class="ob-note mini">${STORE.paywall ? "" : "Everything is free while Studyboard is in early access. "}The Style Shop has all ${SKINS.length} themes, plus flashcard styles, note shapes and stickers. <button type="button" class="link-btn" data-ob="shop">Open the Style Shop</button></p>`;
  }

  function hoursStep(){
    const h = dailyHours();
    const fmt = v => (v % 1 ? v.toFixed(1) : String(v));
    return `${hero(IC.clock)}
      <h2 class="ob-h" id="obH" tabindex="-1">Study Hours per Day</h2>
      <p class="ob-lead">About how many hours can you study on a normal school day, outside of class? Today's Plan fits your work into this.</p>
      <div class="ob-hours">
        <button type="button" class="icon-btn ob-step" data-ob="hours-dec" aria-label="Less time">${svg('<path d="M6 12h12"/>', 'stroke-width="2.6"')}</button>
        <output class="ob-hval" id="obHours" aria-live="polite"><b>${fmt(h)}</b><span>${h === 1 ? "hour" : "hours"} a day</span></output>
        <button type="button" class="icon-btn ob-step" data-ob="hours-inc" aria-label="More time">${svg('<path d="M12 6v12M6 12h12"/>', 'stroke-width="2.6"')}</button>
      </div>
      <div class="ob-chips" role="group" aria-label="Quick picks">${[1, 2, 3, 4, 5, 6].map(v => `<button type="button" class="ob-chip" data-ob="hours-set" data-id="${v}" aria-pressed="${v === h}">${v}h</button>`).join("")}</div>
      <p class="ob-note mini">Change it any time in Settings, or just for today on the Board.</p>`;
  }

  const remindersHooked = () => { try { return !!(HOOK["reminders-setup"] && HOOK["reminders-setup"].length); } catch (e) { return false; } };
  function remindersStep(){
    const hooked = remindersHooked();
    let body;
    if (remindersOk) body = `<div class="ob-okbox">${IC.check}<span><b>Reminders Are Set Up</b><span class="mini">${esc(remindersMsg || "You can change when and how you're reminded any time in Settings.")}</span></span><button type="button" class="btn small" data-ob="reminders">Change</button></div>`;
    else if (hooked) body = `<button type="button" class="btn primary ob-big" data-ob="reminders">Turn On Reminders</button>
        <p class="status-msg mini" id="obRMsg" aria-live="polite">${esc(remindersMsg)}</p>`;
    else body = `<div class="ob-info"><span class="mini">${esc(remindersMsg || "You can turn on reminders later in Settings. Until then, Today's Plan on the Board shows what's due, and Settings can add your deadlines to your phone's calendar with alerts.")}</span></div>`;
    return `${hero(IC.bell)}
      <h2 class="ob-h" id="obH" tabindex="-1">Reminders</h2>
      <p class="ob-lead">Get a heads-up before assignments and exams are due, so nothing sneaks up on you.</p>
      ${body}`;
  }

  function aiStep(){
    let body;
    if (inPreview()) body = `<div class="ob-info"><span class="mini">AI features work in the Studyboard app and on your own Studyboard website. There's nothing to set up here.</span></div>`;
    else if (aiReady()) { const c = aiCfg(); body = `<div class="ob-okbox">${IC.check}<span><b>AI Is On</b><span class="mini">Using ${esc(aiModelName(c.provider, c.model))}.</span></span><button type="button" class="btn small" data-ob="ai">Change</button></div>`; }
    else body = `<div class="ob-duo"><button type="button" class="btn primary" data-ob="ai">Set Up AI</button><button type="button" class="btn" data-ob="next">Later</button></div>
      <p class="ob-note mini">It takes about a minute with a free Google account. Everything in Studyboard works without it.</p>`;
    return `${hero(IC.ai, "ai")}
      <h2 class="ob-h" id="obH" tabindex="-1">AI Help <span class="ob-opt">Optional</span></h2>
      <p class="ob-lead">Free AI can read your syllabus, turn notes into flashcards and quizzes, and help plan your study time.</p>
      ${body}`;
  }

  function appTips(kind){
    const li = (ic, html) => `<li><span class="ob-num" aria-hidden="true">${ic}</span><span>${html}</span></li>`;
    if (kind === "iphone") return `<ol class="ob-tips">
        ${li(IC.share, "Open Studyboard in <b>Safari</b> and tap <b>Share</b>.")}
        ${li(IC.plusSq, "Scroll down and tap <b>Add to Home Screen</b>.")}
        ${li(IC.check, "Tap <b>Add</b>. Studyboard opens from its own icon, full screen.")}</ol>`;
    if (kind === "android") return `<ol class="ob-tips">
        ${li(IC.dots, "Open Studyboard in <b>Chrome</b> and tap the <b>menu</b> (three dots).")}
        ${li(IC.plusSq, "Tap <b>Install app</b> or <b>Add to Home screen</b>.")}
        ${li(IC.check, "Tap <b>Install</b>. Studyboard gets its own icon and opens without internet.")}</ol>`;
    return `<ol class="ob-tips">
        ${li(IC.install, `<b>Windows:</b> get Studyboard from the ${ext(MS_STORE, "Microsoft Store")}. It installs in a click and keeps itself up to date.`)}
        ${li(IC.install, `<b>Mac:</b> download the Mac app from the ${ext(MAC_DL, "Studyboard website")}.`)}
        ${li(IC.plusSq, "<b>Chromebook or Linux:</b> in Chrome, open the menu and choose <b>Install Studyboard</b>.")}</ol>`;
  }
  function appStep(){
    let body;
    const here = deviceKind();
    if (inPreview()) body = `<div class="ob-info"><span class="mini">You're using a preview of Studyboard, so there's nothing to install here. Your own Studyboard website can be added to your phone's home screen.</span></div>`;
    else if (DESK) body = `<div class="ob-okbox">${IC.check}<span><b>You're Using the Desktop App</b><span class="mini">It has its own window and works offline. To use Studyboard on your phone too, open your Studyboard website there and add it to your home screen.</span></span></div>`;
    else if (standalone() || (() => { try { const C = window.Capacitor; return !!(C && typeof C.isNativePlatform === "function" && C.isNativePlatform()); } catch (e) { return false; } })()) body = `<div class="ob-okbox">${IC.check}<span><b>Studyboard Is Installed</b><span class="mini">You're already using the app on this device. It works offline, too.</span></span></div>`;
    else {
      const tab = deviceTab || here;
      const desktopApp = here === "computer" && tab === "computer" && (isWindows() || isMac());
      const canPrompt = !!installEvt && tab === here && here !== "iphone" && !desktopApp;
      const badge = `<a class="ob-msbadge" href="${MS_STORE}" target="_blank" rel="noopener noreferrer" aria-label="Get it from Microsoft"><img class="on-light" src="website/assets/ms-store-badge-dark.png" alt="" width="161" height="44"><img class="on-dark" src="website/assets/ms-store-badge-light.png" alt="" width="161" height="44"></a>`;
      body = `${desktopApp ? (isWindows() ? badge : `<a class="btn primary ob-big" href="${MAC_DL}" target="_blank" rel="noopener noreferrer">Download for Mac</a>`) : ""}${canPrompt ? `<button type="button" class="btn primary ob-big" data-ob="install">Install Studyboard</button>` : ""}
        <div class="segb ob-dev" role="group" aria-label="Show tips for">${[["iphone", "iPhone"], ["android", "Android"], ["computer", "Computer"]].map(([k, l]) => `<button type="button" data-ob="dev" data-id="${k}" aria-pressed="${tab === k}">${l}${k === here ? `<span class="sr"> (this device)</span>` : ""}</button>`).join("")}</div>
        ${appTips(tab)}
        ${location.protocol !== "https:" ? `<p class="ob-note mini">Installing works when Studyboard is opened from its https web address.</p>` : sbActive() ? `<p class="ob-note mini">Sign in with the same account on each device and everything stays in sync.</p>` : ""}`;
    }
    return `${hero(IC.phone)}
      <h2 class="ob-h" id="obH" tabindex="-1">Get the App</h2>
      <p class="ob-lead">Put Studyboard on your home screen or desktop so it opens like any other app, even without internet.</p>
      ${body}`;
  }

  function backupsStep(){
    const B = cbk(), cloudOn = !!(B && B.on()), pend = B && B.pending(), on = cloudOn || FSB.status === "on", paused = !cloudOn && FSB.status === "paused", folders = FSB.supported();
    const opt = (kind, title, sub) => `<button type="button" class="ob-alt ob-bk" data-ob="backup-folder" data-id="${kind}"><span class="ob-alt-ic bk-ico bk-${kind}" aria-hidden="true">${BK_LOGO[kind] || ""}</span><span class="ob-alt-t"><b>${title}</b><span class="mini">${sub}</span></span></button>`;
    const viaCloud = p => !!(B && B.possible(p));
    if (B && !on) ["google", "microsoft"].forEach(p => { if (viaCloud(p) && !B.connected(p)) B.connectUrl(p); });
    const gSub = viaCloud("google") ? "Connect your Google Drive. Backups go to Studyboard › Backups in it, with nothing to install." : "Choose the Google Drive folder (on Windows, the G: drive), then My Drive. Needs Google Drive for desktop.";
    const oSub = viaCloud("microsoft") ? "Connect your OneDrive. Backups go to Studyboard › Backups in it, with nothing to install." : "Choose your OneDrive folder or its Documents folder.";
    const body = on ? `<div class="ob-okbox">${IC.check}<span><b>Automatic Backups Are On</b><span class="mini">Saving to ${esc(bkOnText())} every hour while Studyboard is open.</span></span><button type="button" class="btn small" data-ob="backup-change">Change</button></div>`
      : pend ? `<div class="ob-info"><span class="mini"><span class="ai-spin" aria-hidden="true"></span> Waiting for ${esc(B.name(pend))} to connect. Allow Studyboard in the page that opened, then come back here.</span></div>`
      : paused ? `<button type="button" class="btn primary ob-big" data-ob="backup-resume">Allow Backups to ${esc(FSB.where)}</button>`
      : `${viaCloud("google") || folders ? opt("gdrive", "Google Drive", gSub) : ""}
        ${viaCloud("microsoft") || folders ? opt("onedrive", "OneDrive", oSub) : ""}
        ${folders ? opt("other", "Another Folder", "Any folder on this computer or a USB drive.") : ""}`;
    const cloudy = viaCloud("google") || viaCloud("microsoft");
    return `${hero(IC.folder)}
      <h2 class="ob-h" id="obH" tabindex="-1">Automatic Backups <span class="ob-opt">Recommended</span></h2>
      <p class="ob-lead">${cloudy ? "Studyboard can back up everything every hour, straight to your Google Drive or OneDrive." : "Studyboard can save a backup of everything to a folder on this computer every hour. Pick one that Google Drive or OneDrive syncs and your backups are in the cloud too."}</p>
      ${body}
      ${on || pend || !folders || cloudy ? "" : `<p class="ob-note mini">After you pick a folder, your browser asks to let Studyboard save there. Choose <b>Allow on every visit</b> if it's offered (otherwise <b>Edit files</b> or <b>Allow</b>) so backups keep running after the browser restarts. A “Studyboard Backups” folder is made inside the one you pick.</p>`}`;
  }

  // The free week of Pro every new account gets
  const planObj = () => (window.SBOB.T && window.SBOB.T.plan) || (typeof PLAN !== "undefined" ? PLAN : null);
  function proHere(){ try { const P = planObj(); if (!P || !P.paywall || !P.paywall() || inPreview()) return false; return !!(P.welcomeWeek && P.welcomeWeek()) || !(P.isPro && P.isPro()); } catch (e) { return false; } }
  function proStep(){
    const P = planObj(), gift = P && P.welcomeWeek ? P.welcomeWeek() : null;
    const account = typeof sbUser !== "undefined" && !!sbUser && !(window.SBGUEST && SBGUEST.is());
    const li = (t, sub) => `<li class="ok"><span class="ob-ck" aria-hidden="true">${IC.check}</span><span><b>${t}</b>${sub ? ` <span class="mini">${sub}</span>` : ""}</span></li>`;
    return `${hero('<span class="ob-gift-ic">🎁</span>', "pro")}
      <h2 class="ob-h" id="obH" tabindex="-1">${gift ? "Your First Week of Pro Is On Us" : "A Free Week of Pro"} <span class="pro-badge ob-pro-tag">PRO</span></h2>
      <p class="ob-lead">${gift ? `Try every Pro feature and look until <b>${esc(gift.date)}</b>.` : "Every new Studyboard account gets a week to try every Pro feature and look."} No card needed, and nothing you make goes away when the week ends.</p>
      <ul class="ob-sum ob-pro">
        ${li("Every Premium Theme and Companion", "plus sticker packs, card styles and 46 Theme Collections")}
        ${li("Record a Lecture", "live captions, then AI study notes and flashcards")}
        ${li("Two-Way Calendar Sync", "with Google Calendar or Outlook")}
        ${li("PDF Reader with Highlights", "and decks read aloud with Listen")}
        ${li("Image Cards", "and cards made from the diagrams in your PDFs")}
        ${li("Insights, Term Recap and Your Own Focus Routines")}
      </ul>
      <p class="ob-note mini">${gift ? "" : account ? "It starts as soon as you confirm your email address. " : "It starts when you make your free account. You can do that at the end of setup. "}Storage and backups stay at the Free amounts during the week.</p>`;
  }

  function doneStep(){
    const nC = coursesArr().length, skin = SKINS.find(s => s.id === styleCfg().skin) || SKINS[0], h = dailyHours();
    const row = (ok, t) => `<li class="${ok ? "ok" : ""}"><span class="ob-ck" aria-hidden="true">${ok ? IC.check : ""}</span>${t}</li>`;
    const P = window.SBOB.T.plan || (typeof PLAN !== "undefined" ? PLAN : null);
    const gift = P && P.welcomeWeek ? P.welcomeWeek() : null;
    if (gift) P.welcomeSaid();
    const guestGift = !gift && window.SBGUEST && SBGUEST.is() && typeof PLAN !== "undefined" && PLAN && PLAN.paywall && PLAN.paywall();
    const has = id => STEPS.some(x => x.id === id);
    if (mode === "more") return `${hero(IC.party, "done")}
      <h2 class="ob-h" id="obH" tabindex="-1">You're All Set!</h2>
      <p class="ob-lead">You can change any of these in Settings.</p>
      <ul class="ob-sum">
        ${row(true, `Theme: ${esc(skin.name)}`)}
        ${row(remindersOk, remindersOk ? "Reminders are on" : "Reminders can be turned on in Settings")}
        ${inPreview() ? "" : row(aiReady(), aiReady() ? "AI is on" : "AI can be turned on in Settings")}
        ${backupsHere() ? row(!!bkOnText(), bkOnText() ? `Backing up to ${esc(bkOnText())}` : "Automatic backups can be turned on in Settings") : ""}
      </ul>`;
    return `${hero(IC.party, "done")}
      <h2 class="ob-h" id="obH" tabindex="-1">${gift ? "Welcome to Studyboard!" : "You're All Set!"}</h2>
      <p class="ob-lead">${gift ? "We're so glad you're here. Studyboard is ready for your term." : "Nice work. Studyboard is ready for your term."}</p>
      ${gift && !STEPS.some(x => x.id === "pro") ? `<div class="ob-gift"><span class="ob-gift-ic" aria-hidden="true">🎁</span><span><b>A welcome gift: your first week of Pro is on us</b><span class="mini">Every Pro theme and feature is yours until ${esc(gift.date)}. No card needed, and everything you make stays when the week ends.</span></span></div>` : ""}
      <ul class="ob-sum">
        ${row(nC > 0, nC ? `${nC} course${nC === 1 ? "" : "s"} added` : "Add courses any time from the Courses page")}
        ${row(!!SBAREA.label(), SBAREA.label() ? `Studying ${esc(SBAREA.label())}` : "Set your area of study any time in Settings")}
        ${has("theme") ? row(true, `Theme: ${esc(skin.name)}`) : ""}
        ${row(true, `${h % 1 ? h.toFixed(1) : h} ${h === 1 ? "hour" : "hours"} of study a day`)}
        ${!has("ai") || inPreview() ? "" : row(aiReady(), aiReady() ? "AI is on" : "AI can be turned on in Settings")}
        ${has("backups") && backupsHere() ? row(!!bkOnText(), bkOnText() ? `Backing up to ${esc(bkOnText())}` : "Automatic backups can be turned on in Settings") : ""}
      </ul>
      <div class="ob-next">
        <b>Next: Add Your First Task</b>
        <span class="mini">Type it the way you'd say it in the quick-add bar at the top of the Board, and Studyboard fills in the details.</span>
        <span class="ob-qa" aria-hidden="true"><span>+</span>bio quiz fri 2pm worth 5%</span>
      </div>
      ${window.SBSEM && SBSEM.tourButton() ? `<div class="ob-next">${SBSEM.tourButton()}</div>` : ""}
      ${window.SBTOUR && !SBTOUR.taken() ? `<div class="ob-alt ob-tour"><span class="ob-alt-ic" aria-hidden="true">${IC.board}</span><span class="ob-alt-t"><b>New Here?</b><span class="mini">Take a one-minute look around the app, with example data.</span></span><button type="button" class="btn" data-ob="apptour">Take the App Tour</button></div>` : ""}
      ${window.SBGUEST && SBGUEST.is() ? `<div class="ob-next ob-guest"><b>Keep Your Planner Safe</b><span class="mini">It's only on this device for now. A free account keeps it safe online and puts it on your phone and laptop too. What you've set up comes with you.${guestGift ? " New accounts also get their first week of Pro free." : ""}</span><button type="button" class="btn" data-ob="account">Create a Free Account</button></div>` : ""}`;
  }

  const VIEW = {welcome: welcomeStep, area: areaStep, courses: coursesStep, theme: themeStep, hours: hoursStep, reminders: remindersStep, ai: aiStep, app: appStep, backups: backupsStep, pro: proStep, done: doneStep};

  /* Sheet */
  function sheetHtml(){
    const s = STEPS[step], last = step === STEPS.length - 1;
    const bar = STEPS.map((x, i) => `<button type="button" class="ob-seg ${i < step ? "past" : i === step ? "cur" : ""}" data-ob="goto" data-id="${i}" aria-label="Step ${i + 1}: ${esc(x.title)}${i === step ? " (current)" : ""}"></button>`).join("");
    const more = mode === "more";
    const primary = step === 0 && !more ? "Get Started" : last ? (more ? "Done" : "Add My First Task") : "Next";
    return `<form class="sheet ob" data-step="${s.id}" aria-labelledby="obH">
      <div class="ob-top">
        <span class="ob-count mini">Step ${step + 1} of ${STEPS.length}</span>
        <span class="spacer"></span>
        ${last ? "" : `<button type="button" class="link-btn ob-skip" data-ob="skip">${more ? "Not Now" : "Skip Setup"}</button>`}
      </div>
      <div class="ob-bar" role="group" aria-label="Progress">${bar}</div>
      <div class="sheet-body ob-body"><div class="ob-step-in${dir < 0 ? " ob-rev" : ""}">${VIEW[s.id]()}</div></div>
      <div class="sheet-foot ob-foot">
        <button type="button" class="btn ob-back" data-ob="back" ${step === 0 ? "hidden" : ""}>Back</button>
        <span class="spacer"></span>
        ${last && !more ? `<button type="button" class="btn" data-ob="finish">Go to My Board</button>` : ""}
        <button type="button" class="btn primary ob-go" data-ob="${last ? (more ? "finish" : "first-task") : "next"}">${primary}</button>
      </div>
    </form>`;
  }

  function show(n, focusHead){
    step = Math.max(0, Math.min(STEPS.length - 1, n));
    openSheet(sheetHtml());
    const form = dlg.querySelector(".sheet.ob"); if (!form) return;
    const logo = form.querySelector(".ob-logo");
    if (logo) $$(".brand img.logo").forEach(img => { const c = img.cloneNode(true); c.removeAttribute("id"); c.alt = ""; c.sizes = "217px"; logo.appendChild(c); });
    wire(form);
    const id = STEPS[step].id;
    if (id === "done" && !cheered) { cheered = true; celebrateHere(); }
    const wide = window.matchMedia && window.matchMedia("(min-width:601px)").matches;
    const target = id === "courses" && wide ? $("#obCode") : focusHead ? $("#obH") : form.querySelector(".ob-go");
    if (target) try { target.focus({preventScroll: true}); } catch (e) {}
  }
  // A course typed but not added yet comes along when moving on
  const flushCourse = () => { if (STEPS[step] && STEPS[step].id === "courses" && dlg.querySelector(".sheet.ob")) addCourse(true); };
  const go = n => { flushCourse(); dir = n >= step ? 1 : -1; show(n, true); };

  function wire(form){
    form.addEventListener("click", onClick);
    form.addEventListener("keydown", e => {
      const t = e.target, typing = t.tagName === "INPUT" && !["radio", "checkbox", "button"].includes(t.type) || t.tagName === "TEXTAREA" || t.tagName === "SELECT";
      if (e.key === "Enter" && (t.id === "obCode" || t.id === "obName")) { e.preventDefault(); addCourse(); return; }
      if (typing || e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.key === "Enter" && !(t.closest && t.closest("button,a,label"))) { e.preventDefault(); form.querySelector(".ob-go").click(); }
      else if (e.key === "ArrowRight" && !(t.closest && t.closest(".segb,.swatches,.ob-chips"))) { e.preventDefault(); if (step < STEPS.length - 1) go(step + 1); }
      else if (e.key === "ArrowLeft" && !(t.closest && t.closest(".segb,.swatches,.ob-chips"))) { e.preventDefault(); if (step > 0) go(step - 1); }
    });
    form.addEventListener("change", e => { if (e.target.name === "obColor") newColor = e.target.value; if (e.target.id === "obAreaText") { const a = SBAREA.get(), v = e.target.value; if (a) SBAREA.set(a.id, v); else if (v.trim()) SBAREA.set("other", v); } });
  }

  function onClick(e){
    const ab = e.target.closest("[data-ob-area]");
    if (ab) { e.preventDefault(); e.stopPropagation(); SBAREA.set(ab.dataset.obArea, ($("#obAreaText") || {}).value); show(step); const t = dlg.querySelector(`[data-ob-area="${ab.dataset.obArea}"]`); if (t) t.focus({preventScroll: true}); return; }
    const b = e.target.closest("[data-ob]"); if (!b) return;
    const a = b.dataset.ob, id = b.dataset.id;
    e.preventDefault(); e.stopPropagation();
    switch (a) {
      case "next": if (step < STEPS.length - 1) go(step + 1); break;
      case "back": if (step > 0) go(step - 1); break;
      case "goto": go(Number(id)); break;
      case "skip": finish(false); break;
      case "finish": finish(true); break;
      case "first-task": finish(true, true); break;
      case "semester": finish(true); if (window.SBSEM) SBSEM.open({from: "tour"}); break;
      case "apptour": finish(true); if (window.SBTOUR) setTimeout(() => SBTOUR.start(), 350); break;
      case "add-course": addCourse(); break;
      case "account": finish(true); setTimeout(() => SBGUEST.signUp(), 350); break;
      case "backup-folder": {
        const here = () => STEPS[step] && STEPS[step].id === "backups" && dlg.querySelector(".sheet.ob");
        chooseBackupFolder(id).then(() => { if (here()) show(step); });
        const B = cbk(); if (B && B.pending()) { const t0 = Date.now(), iv = setInterval(() => { if (!here() || Date.now() - t0 > 5 * 60000) { clearInterval(iv); return; } if (B.on() || !B.pending()) { clearInterval(iv); show(step); } }, 2000); }
        break;
      }
      case "backup-change": chooseBackupFolder("other").then(() => { if (STEPS[step] && STEPS[step].id === "backups" && dlg.querySelector(".sheet.ob")) show(step); }); break;
      case "backup-resume": resumeFolderBackup().then(() => { if (STEPS[step] && STEPS[step].id === "backups" && dlg.querySelector(".sheet.ob")) show(step); }); break;
      case "rm-course": {
        const c = state.courses[id]; if (!c) break;
        applyChanges([{kind: "course", id, after: null}], "");
        added = added.filter(x => x !== id); show(step);
        break;
      }
      case "import": leaveTo(() => importSheet("")); break;
      case "brightspace": leaveTo(() => fire("brightspace-connect")); break;
      case "shop": leaveTo(() => styleShop("themes")); break;
      case "ai": leaveTo(() => aiSetupSheet(false)); break;
      case "mode": setTheme(id); show(step); break;
      case "skin": {
        if (!owns("skin", id)) { leaveTo(() => shopUnlock("skin", id)); break; }
        saveStyle({skin: id}); applySkin(); render(); show(step);
        const t = dlg.querySelector(`.ob-theme[data-id="${id}"]`); if (t) t.focus({preventScroll: true});
        break;
      }
      case "hours-dec": setHours(dailyHours() - 0.5); break;
      case "hours-inc": setHours(dailyHours() + 0.5); break;
      case "hours-set": setHours(Number(id)); break;
      case "reminders": setupReminders(); break;
      case "dev": deviceTab = id; show(step); { const t = dlg.querySelector(`[data-ob="dev"][data-id="${id}"]`); if (t) t.focus({preventScroll: true}); } break;
      case "install":
        if (installEvt) { const ev = installEvt; ev.prompt(); ev.userChoice.then(r => { installEvt = null; if (dlg.querySelector(".sheet.ob")) show(step); if (r && r.outcome === "accepted") toast("Studyboard is being installed"); }).catch(() => {}); }
        break;
    }
  }

  // quiet: on the way to another step, so nothing is said or redrawn
  function addCourse(quiet){
    const code = ($("#obCode") || {}).value || "", nm = ($("#obName") || {}).value || "", msg = $("#obCMsg");
    const c0 = code.trim(), n0 = nm.trim();
    if (!c0 && !n0) { if (quiet) return; if (msg) msg.textContent = "Type a course code or name first."; const f = $("#obCode"); if (f) f.focus(); return; }
    const dup = coursesArr().find(c => (c0 && String(c.code || "").toLowerCase() === c0.toLowerCase()) || (!c0 && n0 && String(c.name || "").toLowerCase() === n0.toLowerCase()));
    if (dup) { if (!quiet && msg) msg.textContent = `${courseLabel(dup)} is already in your list.`; return; }
    const nc = {id: uid(), created: Date.now(), name: n0 || c0, code: c0, instructor: "", schedule: "", room: "", office: "", meetings: [], color: newColor || COLORS[0], notes: "", links: []};
    applyChanges([{kind: "course", id: nc.id, after: nc}], "");
    added.push(nc.id); newColor = null;
    if (quiet) return;
    show(step);
    const m = $("#obCMsg"); if (m) m.textContent = `Added ${nc.name}. Add another, or choose Next.`;
    const f = $("#obCode"); if (f) try { f.focus({preventScroll: true}); } catch (e) {}
  }

  function setHours(v){
    v = Math.max(0.5, Math.min(16, Math.round(v * 2) / 2));
    state.settings = Object.assign({}, state.settings, {dailyHours: v});
    const out = $("#obHours");
    if (out) out.innerHTML = `<b>${v % 1 ? v.toFixed(1) : v}</b><span>${v === 1 ? "hour" : "hours"} a day</span>`;
    $$('.ob-chip', dlg).forEach(c => c.setAttribute("aria-pressed", String(Number(c.dataset.id) === v)));
    clearTimeout(hoursTimer); hoursTimer = setTimeout(() => { saveSettings(); scheduleRender(); }, 400);
  }

  async function setupReminders(){
    const btn = dlg.querySelector('[data-ob="reminders"]'), msg = $("#obRMsg");
    if (btn) btn.disabled = true;
    if (msg) msg.textContent = "Setting up reminders…";
    away = {step};
    let res = [];
    try { res = fire("reminders-setup").filter(x => x !== undefined && x !== null && x !== false); } catch (e) { res = []; }
    const mine = () => !!dlg.querySelector(".sheet.ob");
    if (!res.length) { away = null; remindersMsg = "Reminders aren't available on this device yet. You can turn them on later in Settings."; if (mine()) show(step); return; }
    if (!mine()) { remindersOk = true; remindersMsg = ""; return; }
    away = null;
    let ok = true, text = "";
    try {
      const vals = await Promise.all(res);
      const v = vals.find(x => x !== true && x);
      ok = vals.some(Boolean);
      if (v && typeof v === "object") { if (v.ok === false) ok = false; text = String(v.message || v.msg || ""); }
      else if (typeof v === "string") text = v;
    } catch (e) { ok = false; text = String((e && e.message) || ""); }
    remindersOk = ok;
    remindersMsg = ok ? text : (text ? text + " " : "Reminders weren't turned on. ") + "You can try again later in Settings.";
    if (mine()) show(step);
  }

  // Open another app sheet (import, AI setup, Style Shop)
  function leaveTo(fn){ away = {step}; fn(); if (!dlg.open) setTimeout(checkReturn, 250); }
  function checkReturn(){
    if (!away) return;
    if (dlg.open) return;
    const s = away.step; away = null;
    dir = 1; show(s, true);
  }
  dlg.addEventListener("close", () => {
    if (away) { setTimeout(checkReturn, 250); return; }
    if (finishing) { finishing = false; return; }
    if (dlg.querySelector(".sheet.ob")) {
      markDone(); noteEnd();
      setTimeout(() => toast(mode === "more" ? "No problem. These are all in Settings too." : "Welcome setup closed. Replay it any time from Settings."), 60);
      scheduleRender();
    }
  });

  function finish(completed, firstTask){
    if (completed) flushCourse();
    noteEnd();
    finishing = true; markDone(); clearTimeout(hoursTimer); saveSettings();
    if (dlg.open) dlg.close(); else finishing = false;
    added = []; remindersOk = false; remindersMsg = ""; deviceTab = null;
    moveCanvasesBack();
    if (!completed) { toast(mode === "more" ? "No problem. These are all in Settings too." : "No problem. Replay the welcome setup any time from Settings."); render(); return; }
    if (mode === "more") { render(); return; }
    ui.tab = "board"; ui.courseId = null; render(); window.scrollTo(0, 0);
    if (firstTask) setTimeout(() => {
      const i = $("#qaIn"); if (!i) return;
      const bar = i.closest(".qa-bar");
      try { i.focus({preventScroll: true}); } catch (e) { i.focus(); }
      if (bar) { bar.scrollIntoView({block: "center", behavior: "smooth"}); bar.classList.add("ob-glow"); setTimeout(() => bar.classList.remove("ob-glow"), 2600); }
    }, 120);
  }

  /* The celebration is drawn on a canvas added to <body>, which sits under the open dialog */
  let moved = [];
  function celebrateHere(){
    const before = new Set([...document.body.children]);
    try { celebrate("check"); } catch (e) {}
    const grab = () => [...document.body.children].forEach(n => { if (n.tagName === "CANVAS" && !before.has(n) && dlg.open) { dlg.appendChild(n); n.classList.add("ob-fx"); moved.push(n); } });
    grab(); setTimeout(grab, 60); setTimeout(grab, 400);
  }
  function moveCanvasesBack(){ moved.forEach(n => { if (n.isConnected && n.parentNode === dlg) document.body.appendChild(n); }); moved = []; }

  /* When to show it */
  let poll = 0, cloudSince = 0, quoteHeld = null;
  const bootAt = Date.now();
  function settled(){
    if (cloud.on) { if (!cloudSince) cloudSince = Date.now(); } else cloudSince = 0;
    if (inPreview()) return !!cloudSince && Date.now() - cloudSince > 1500;
    if (sbConfig()) return !!sbUser && !!cloudSince && Date.now() - cloudSince > 1500;
    return Date.now() - bootAt > 1100;
  }
  function releaseQuote(){
    if (quoteHeld === null) return;
    try { if (quoteHeld) localStorage.setItem(QKEY, quoteHeld); else localStorage.removeItem(QKEY); } catch (e) {}
    quoteHeld = null;
    setTimeout(() => { try { dailyQuote(false); } catch (e) {} }, 800);
  }
  function check(){
    if (isDone()) { stop(); releaseQuote(); return; }
    if (!settled()) return;
    if (!isEmpty()) { markDone(); stop(); releaseQuote(); return; }
    if (dlg.open || document.getElementById("qod") || document.hidden) return;
    stop(); quoteHeld = null;
    try { if (window.SBSTREAK) SBSTREAK.newUser(); } catch (e) {}
    start("first");
  }
  function stop(){ clearInterval(poll); poll = 0; }
  // kind: "first" (the essentials), "more" (the optional extras) or "all" (a replay from Settings)
  function start(kind){
    mode = kind === "more" || kind === "all" ? kind : "first";
    const ids = mode === "first" ? FIRST : mode === "more" ? MORE : null;
    STEPS = ALL_STEPS.filter(x => (!ids || ids.includes(x.id)) && (x.id !== "backups" || backupsHere()) && (x.id !== "pro" || proHere())); cheered = false; finishing = false; step = 0; dir = 1; added = []; remindersOk = false; remindersMsg = ""; deviceTab = null; newColor = null; away = null; show(0); }

  hook("boot", () => {
    if (isDone()) return;
    if (isEmpty()) {
      try { const today = todayISO(), prev = localStorage.getItem(QKEY) || ""; if (prev !== today) { quoteHeld = prev; localStorage.setItem(QKEY, today); } } catch (e) {}
    }
    poll = setInterval(check, 700);
    setTimeout(check, 1150);
  });

  // Someone signed up or signed in after the page loaded
  let seenUid = "";
  hook("render", () => { const u = sbUser && sbUser.id; if (!u || u === seenUid) return; seenUid = u; if (!poll && !isDone()) { poll = setInterval(check, 700); } });

  /* Settings row */
  hook("menu", () => `<button data-act="ob-replay"><span>Replay Welcome Setup<span class="sub">Courses, study hours, theme, reminders, backups and more</span></span></button>`);
  hook("act", act => {
    if (act === "ob-more-hide") { moreSet({hide: Date.now()}); render(); toast("Okay. You'll find all of these in Settings."); return true; }
    if (act !== "ob-replay" && act !== "ob-more") return false;
    if (dlg.open) dlg.close();
    setTimeout(() => start(act === "ob-more" ? "more" : "all"), 40);
    return true;
  });

  /* A gentle nudge for the optional setup, from the day after the welcome setup */
  const moreDue = () => { const m = moreGet(); return !!m.at && !m.hide && !m.done && Date.now() - m.at > 20 * 3600e3 && isDone(); };
  hook("render", tab => {
    if (tab !== "board" || inPreview() || !moreDue() || window.SBOB.pending()) return;
    const v = $("#view"); if (!v || v.querySelector(".sem-card-b") || (window.SBSEM && SBSEM.cardDue())) return;
    v.insertAdjacentHTML("afterbegin", `<section class="sem-card-b ob-more-b" aria-labelledby="obMoreT"><div class="sem-cb-t"><b id="obMoreT">A Few More Things</b><span>Reminders, backups, the app and a theme. Each takes about a minute, and all are optional.</span></div>
      <div class="sem-cb-b"><button type="button" class="btn primary" data-act="ob-more">Take a Look</button><button type="button" class="link-btn" data-act="ob-more-hide">Not Now</button></div></section>`);
  });
})();


