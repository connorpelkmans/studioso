/* ===== module: 97-ui.js ===== */
/* Studyboard 1.11.0 */
(() => {
  const ls = (k, v) => { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) {} return null; };
  const svg = p => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
  const ICONS = {
    account: svg(`<circle cx="12" cy="8" r="3.6"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/>`),
    appearance: svg(`<path d="M12 3a9 9 0 1 0 0 18c1.4 0 2-1 2-2 0-1.5-1.2-1.8-1.2-3s.9-2 2.2-2H17a4 4 0 0 0 4-4c0-4-4-7-9-7z"/><circle cx="7.5" cy="11" r="1.2" fill="currentColor"/><circle cx="10.5" cy="7" r="1.2" fill="currentColor"/><circle cx="15" cy="7.5" r="1.2" fill="currentColor"/>`),
    access: svg(`<circle cx="12" cy="4.5" r="2"/><path d="M5 8.5l7 1.5 7-1.5M12 10v4.5M12 14.5 9 21M12 14.5l3 6.5"/>`),
    study: svg(`<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5M8.5 7.5h6M8.5 11h4"/>`),
    ai: svg(`<path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z"/><path d="M18.5 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/>`),
    school: svg(`<path d="M3 9.5 12 5l9 4.5-9 4.5z"/><path d="M7 11.5V16c0 1.2 2.2 2.5 5 2.5s5-1.3 5-2.5v-4.5M21 9.5V15"/>`),
    capture: svg(`<path d="M6 9a6 6 0 1 1 12 0c0 5 2 6.5 2 6.5H4S6 14 6 9z"/><path d="M10 19a2 2 0 0 0 4 0"/>`),
    app: svg(`<circle cx="12" cy="12" r="9"/><path d="M9.6 9.4a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.2-2.4 3.7M12 17.2v.1"/>`),
    data: svg(`<ellipse cx="12" cy="6" rx="7.5" ry="2.8"/><path d="M4.5 6v6c0 1.5 3.4 2.8 7.5 2.8s7.5-1.3 7.5-2.8V6M4.5 12v6c0 1.5 3.4 2.8 7.5 2.8s7.5-1.3 7.5-2.8v-6"/>`)
  };
  const SEARCH_IC = svg(`<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>`);
  const BACK_IC = svg(`<path d="M15 5l-7 7 7 7"/>`);
  const CHEV = svg(`<path d="M9 5l7 7-7 7"/>`);
  const safe = (fn, d) => { try { return fn(); } catch (e) { return d; } };
  const CATS = [
    {k: "account", t: "Account",
      lead: "Your sign-in, sync and Studyboard Pro.",
      sum: () => safe(() => inPreview() ? "Saved to your Claude account" : sbUser ? `Signed in as ${sbUser.email || "you"}` : sbConfig() ? "Not signed in yet" : "Saved on this device only", "Sign in and sync")},
    {k: "appearance", t: "Appearance",
      lead: "Your theme, your companion and how Studyboard moves.",
      sum: () => safe(() => { const s = SKINS.find(x => x.id === styleCfg().skin) || SKINS[0], p = themePref(); return `${s.name}, ${p === "system" ? "matches your device" : p === "dark" ? "dark" : "light"}`; }, "Theme, dark mode and animations")},
    {k: "access", t: "Accessibility",
      lead: "Text size, contrast, language and spelling.",
      sum: () => "Text size, contrast and language"},
    {k: "study", t: "Study Plan",
      lead: "How Today's Plan fits your work into your week.",
      sum: () => safe(() => `${dailyHours()} h a day`, "Study hours and planning")},
    {k: "ai", t: "AI and Tools",
      lead: "AI helpers, search, the calculator and printing.",
      sum: () => safe(() => `AI ${aiReady() ? "on" : "off"}`, "AI, search and tools")},
    {k: "school", t: "School and Calendar",
      lead: "Bring in your school's deadlines, sync your calendar and study with classmates.",
      sum: () => "School sites, syllabi, calendar and groups"},
    {k: "capture", t: "Notifications and Widgets",
      lead: "Reminders, widgets, quick ways to add tasks, and installing the app.",
      sum: () => "Reminders, widgets and quick capture"},
    {k: "data", t: "Data and Backups",
      lead: "Keep a copy of your work safe, bring work in, and start fresh each term.",
      sum: () => "Backups, import, export and cleanup"},
    {k: "app", t: "Help and About",
      lead: "Getting started, feedback, and the small print.",
      sum: () => "Tour, shortcuts, feedback and legal"}
  ];
  const CAT = Object.fromEntries(CATS.map(c => [c.k, c]));
  // Each category's groups, in order, by each row's data-act (or input id). A row's key decides its place; a row nobody
  // listed goes to its data-group's category (or a best guess) and the end of that category's first group
  const SUBS = {
    account: [["Your Account", ["sb-signin", "sb-connect", "sb-signout", "un-edit", "acct-email", "acct-pass", "sb-issues"]], ["Plan and Purchases", ["plan-open", "sbc-packs", "plan-restore"]], ["Delete Account", ["acct-delete"]]],
    appearance: [["Theme", ["theme-set", "shop", "scene-moment"]], ["Companion", ["comp-open", "comp-set"]], ["Motion and Extras", ["anim-toggle", "anim-mode", "daily-quote"]]],
    access: [["Reading", ["text-size", "a11y-contrast"]], ["Language", ["lang-set", "spell-set"]]],
    study: [["Your Time", ["area-open", "dailyIn", "capIn", "avail-open"]], ["Smart Planning", ["acc-toggle", "exm-toggle", "ap-mode", "ap-pro"]], ["Progress", ["g-grades", "wkr-open", "fgs-open", "sbk-open", "snd-settings"]]],
    ai: [["AI", ["ai-setup", "aivault-open"]], ["Tools", ["sx-settings", "bd-new-course", "calc-open", "pro-pr-open"]]],
    school: [["School", ["sem-open", "lms-open", "import-syllabus", "school-open"]], ["Calendar", ["cal-export", "cal-sync"]], ["Study Groups", ["grp-page", "room-notices"]]],
    capture: [["Reminders", ["rm-open", "tz-shift"]], ["Quick Capture and Widgets", ["cap-try", "sbw-open"]], ["Install", ["pwa-install", "install", "desk-version"]]],
    data: [["Backups", ["cbk-go", "cbk-now", "cbk-stop", "fsb-choose", "fsb-resume", "fsb-stop", "desk-open", "desk-choose", "folder", "backup-now", "storage-protect", "restore"]], ["Import and Export", ["export", "export-json", "export-full", "import", "ia-open", "export-data"]], ["Cleanup", ["new-term", "archive-open", "trash-open"]], ["Start Over", ["clear-all"]]],
    app: [["Getting Started", ["ob-replay", "tour-open", "tips-set", "kbd-help"]], ["Feedback", ["bug-open", "errrep-toggle"]], ["About", ["legal-about", "legal-privacy", "legal-terms"]]]
  };
  const ORDER = Object.fromEntries(Object.entries(SUBS).map(([c, gs]) => [c, gs.flatMap(g => g[1])]));
  // Extra words people might search for, per row
  const SYN = {"theme-set": "dark light mode night", shop: "theme colors stickers pins cards", "anim-toggle": "motion confetti", "comp-set": "companion pet stay still fixed corner move", "anim-mode": "animation motion static still saver", "text-size": "font bigger larger smaller accessibility dynamic type zoom", "lang-set": "language idioma espanol spanish translate locale", "a11y-contrast": "contrast accessibility readable calm background dim blur", "tz-shift": "timezone travel daylight saving dst clock",
    "sb-connect": "sync cloud online login", "sb-signin": "sync login", "sb-issues": "conflict merge two devices edited resolve", "sb-signout": "log out logout", "plan-open": "pro upgrade subscription devices storage",
    "area-open": "major program field subject discipline degree", "bd-new-course": "milestones rubric breakdown", dailyIn: "study time plan", "ap-mode": "autopilot catch up missed sessions reschedule overnight day off", "ap-pro": "autopilot catch up missed sessions reschedule overnight day off", capIn: "weekly limit", "ai-setup": "gemini key chatbot", "sx-settings": "find ctrl k", "g-grades": "marks gpa", "wkr-open": "weekly review sunday summary recap week slipped", "fgs-open": "streak study days rest days habit gentle forgiving",
    "lms-open": "d2l lms school sites", "cal-export": "calendar ics google outlook apple", "import-syllabus": "pdf course", "sem-open": "semester first run start setup onboarding import syllabus week plan", "grp-page": "classmates share",
    "rm-open": "alerts push notify", "sbw-open": "widget tray startup desktop", "ob-replay": "tour help welcome start", "tour-open": "tour help guide orientation walkthrough tutorial", "bug-open": "bug report feedback problem issue idea support contact", "pwa-install": "home screen app",
    "fsb-choose": "google drive onedrive folder backup", folder: "google drive onedrive folder backup", "backup-now": "save backup copy device", "restore": "undo backup", "export": "download backup zip files", "export-json": "download backup data only json", "import": "upload backup", "ia-open": "anki apkg colpkg quizlet knowt todoist notion csv another app switch", "export-full": "files zip",
    "new-term": "semester archive", "trash-open": "recently deleted trash bin restore undo recover deleted", "export-data": "export csv json zip spreadsheet excel portability download my data gdpr", "clear-all": "delete reset erase"};
  // An emoji before each row's title, by the row's key (rows that bring their own emoji or icon keep theirs)
  const EMO = {"sb-signin": "🔑", "sb-connect": "☁️", "sb-signout": "🚪", "un-edit": "🙂", "acct-email": "✉️", "acct-pass": "🔒", "sb-issues": "🔀", "sbc-packs": "🪙", "plan-restore": "♻️", "acct-delete": "🗑️",
    "theme-set": "🌗", shop: "🛍️", "scene-moment": "🌅", "comp-open": "🌱", "comp-set": "📌", "anim-mode": "🎞️", "daily-quote": "📖",
    "text-size": "🔠", "a11y-contrast": "👓", "lang-set": "🌐", "spell-set": "🔤",
    "area-open": "🎓", dailyIn: "⏱️", capIn: "📆", "avail-open": "🗓️", "acc-toggle": "📈", "exm-toggle": "📝", "ap-mode": "✈️", "ap-pro": "✈️", "g-grades": "💯", "wkr-open": "🗒️", "fgs-open": "🔥", "sbk-open": "📔", "snd-settings": "🎧",
    "ai-setup": "✨", "aivault-open": "🔐", "sx-settings": "🔍", "bd-new-course": "🧩", "calc-open": "🧮", "pro-pr-open": "🖨️",
    "sem-open": "🏫", "lms-open": "🔗", "import-syllabus": "📄", "school-open": "🍎", "cal-export": "🔄", "cal-sync": "🔄", "grp-page": "👥", "room-notices": "📣",
    "rm-open": "🔔", "tz-shift": "🌍", "cap-try": "⚡", "sbw-open": "🧱", "pwa-install": "📲", install: "📲", "desk-version": "💻",
    "cbk-go": "☁️", "cbk-now": "☁️", "cbk-stop": "☁️", "fsb-choose": "📁", "fsb-resume": "📁", "fsb-stop": "📁", "desk-open": "📁", "desk-choose": "📁", folder: "📁", "backup-now": "💾", "storage-protect": "🛡️", restore: "⏪",
    export: "📤", "export-json": "📤", "export-full": "🗜️", import: "📥", "ia-open": "🔁", "export-data": "📊", "new-term": "🆕", "archive-open": "🗄️", "trash-open": "🗑️", "clear-all": "⚠️",
    "ob-replay": "👋", "tour-open": "🗺️", "tips-set": "💡", "kbd-help": "⌨️", "bug-open": "🐞", "errrep-toggle": "📡", "legal-about": "ℹ️", "legal-privacy": "🔏", "legal-terms": "📜"};
  const PICTO = /^\s*(\p{Extended_Pictographic}|\p{Regional_Indicator})/u;
  function addEmoji(r){
    if (r.classList.contains("plan-row") || r.querySelector(".us-emo, .plan-row-ic")) return;
    const e = rowKey(r).map(k => EMO[k]).find(Boolean); if (!e) return;
    // the title: the first element that starts with its own words (before its .sub line)
    const t = [r].concat([...r.querySelectorAll("span, b, strong, label")]).find(x => !x.classList.contains("sub") && x.firstChild && x.firstChild.nodeType === 3 && x.firstChild.data.trim());
    if (!t || PICTO.test(t.firstChild.data)) return;
    // the emoji and the title's words go in one box, so rows that stack the title and its line keep the emoji on the title's line
    const box = document.createElement("span"); box.className = "us-ttl";
    box.innerHTML = `<span class="us-emo" aria-hidden="true">${e}</span>`;
    t.insertBefore(box, t.firstChild); box.appendChild(box.nextSibling);
    // a PRO (or similar) badge right after the title stays on the title's line
    while (box.nextSibling && (box.nextSibling.nodeType === 3 ? !box.nextSibling.data.trim() : box.nextSibling.nodeType === 1 && !box.nextSibling.classList.contains("sub") && /badge|pro|tag|pill/i.test(box.nextSibling.className))) box.appendChild(box.nextSibling);
  }
  const KEY_CAT = {};
  Object.entries(ORDER).forEach(([c, ks]) => ks.forEach(k => { KEY_CAT[k] = c; }));
  const ALIAS = {account: "account", sync: "account", plan: "account", pro: "account", devices: "account",
    appearance: "appearance", style: "appearance", theme: "appearance", look: "appearance", access: "access", language: "access",
    study: "study", grades: "study", focus: "study", ai: "ai", search: "ai", tools: "ai",
    capture: "capture", notifications: "capture", reminders: "capture", widgets: "capture",
    school: "school", calendar: "school", lms: "school", groups: "school",
    app: "app", help: "app", about: "app",
    data: "data", backups: "data", backup: "data"};
  const PREFIX = [[/^(sb|plan|dev|acct|pro)-/, "account"], [/^(fsb|desk|backup)-/, "data"], [/^(bs|cv|canvas|bb|lms|cal|grp)-/, "school"],
    [/^(rm|sbw|pwa|cap)-/, "capture"], [/^(ob|tour|legal|bug)-/, "app"], [/^(sx|ai|calc)-/, "ai"], [/^(pomo|g|ap|wkr)-/, "study"], [/^(scene|shop|anim|theme|style|comp)-/, "appearance"], [/^(lang|spell|a11y|text)-/, "access"]];
  function rowKey(r){
    const acts = [r.dataset.act].concat([...r.querySelectorAll("[data-act]")].map(x => x.dataset.act)).filter(Boolean);
    const inp = r.querySelector("input[id]");
    const t = (r.textContent || "").toLowerCase();
    const keys = acts.slice();
    if (r.dataset.usKey) keys.push(r.dataset.usKey);   // rows whose button comes and goes (Time Zone) name their place
    if (inp) keys.push(inp.id);
    if (!acts.length) {
      if (/automatic backups|studyboard folder/.test(t)) keys.push("folder");
      else if (/install/.test(t)) keys.push("install");
      else if (/studyboard for (mac|windows)|version/.test(t)) keys.push("desk-version");
    }
    return keys;
  }
  function catOf(r){
    const keys = rowKey(r);
    for (const k of keys) if (KEY_CAT[k]) return KEY_CAT[k];
    const g = r.dataset.group || safe(() => r.querySelector("[data-group]").dataset.group, "");
    if (g && ALIAS[String(g).toLowerCase()]) return ALIAS[String(g).toLowerCase()];
    for (const k of keys) for (const [re, c] of PREFIX) if (re.test(k)) return c;
    const t = (r.textContent || "").toLowerCase();
    if (/backup|restore/.test(t)) return "data";
    if (/sign in|account|supabase|sync/.test(t)) return "account";
    return "app";
  }
  const rankOf = (r, c) => { const ks = rowKey(r), o = ORDER[c] || []; const i = Math.min(...ks.map(k => { const j = o.indexOf(k); return j < 0 ? 999 : j; }).concat(999)); return i; };

  const phone = () => !!(window.matchMedia && matchMedia("(max-width:719px)").matches);
  const LAST = "studyboard:setCat";

  const origMenu = menuSheet;
  menuSheet = function(){
    const old = dlg.open ? dlg.querySelector(".us") : null;
    const prev = old ? {view: old.dataset.view, cat: old.dataset.cat, q: (old.querySelector(".us-q") || {}).value || "", top: (old.querySelector(".us-main") || {}).scrollTop || 0} : null;
    const r = origMenu.apply(this, arguments);
    try { organize(prev); } catch (e) { console.warn("settings layout", e); }
    return r;
  };

  function organize(prev){
    const sheet = dlg.querySelector(".sheet"), body = sheet && sheet.querySelector(".sheet-body"), list = body && body.querySelector(".menu-list");
    if (!list || body.querySelector(".us")) return;
    const note = body.querySelector(":scope > p.summary-sub");
    const buckets = Object.fromEntries(CATS.map(c => [c.k, []]));
    [...list.children].forEach((r, i) => { const c = catOf(r); r.dataset.usCat = c; buckets[c].push({r, i, n: rankOf(r, c)}); try { addEmoji(r); } catch (e) {} });
    const cats = CATS.filter(c => buckets[c.k].length);
    sheet.classList.add("us-sheet");
    const wrap = document.createElement("div");
    wrap.className = "us";
    wrap.innerHTML = `<div class="us-nav">
        <label class="us-search">${SEARCH_IC}<input type="search" class="us-q" placeholder="Search Settings" aria-label="Search settings" autocomplete="off" data-noenter></label>
        <div class="us-cats" role="tablist" aria-label="Settings categories" aria-orientation="vertical">${cats.map(c => `<button type="button" role="tab" class="us-cat" data-us="${c.k}" id="usTab-${c.k}" aria-controls="usPane-${c.k}" aria-selected="false"><span class="us-ic">${ICONS[c.k]}</span><span class="us-ct"><b>${esc(c.t)}</b><span class="us-cs">${esc(c.sum())}</span></span><span class="us-chev">${CHEV}</span></button>`).join("")}</div>
      </div>
      <div class="us-main"><p class="us-empty" hidden>Nothing matches that. Try another word, like “backup” or “dark”.</p></div>`;
    const main = wrap.querySelector(".us-main");
    cats.forEach(c => {
      const sec = document.createElement("section");
      sec.className = "us-pane"; sec.dataset.us = c.k; sec.id = "usPane-" + c.k;
      sec.setAttribute("role", "tabpanel"); sec.setAttribute("aria-labelledby", "usTab-" + c.k);
      sec.innerHTML = `<div class="us-title"><span class="us-ic">${ICONS[c.k]}</span><div><h3>${esc(c.t)}</h3><p class="mini">${esc(c.lead)}</p></div></div>`;
      const all = buckets[c.k].sort((a, b) => a.n - b.n || a.i - b.i);
      // Rows marked data-us-top (the storage meter) sit above the section's tabs, so they're always in view
      const top = all.filter(({r}) => r.dataset.usTop);
      if (top.length) { const ml = document.createElement("div"); ml.className = "menu-list us-top"; top.forEach(({r}) => ml.appendChild(r)); sec.appendChild(ml); }
      const sorted = all.filter(({r}) => !r.dataset.usTop);
      sorted.forEach(({r}) => { if (r.dataset.act === "clear-all" || r.querySelector('[data-act="clear-all"]')) r.classList.add("us-danger"); });
      const spec = SUBS[c.k];
      if (spec) {
        const groups = spec.map(([name, keys]) => ({name, keys, rows: []}));
        sorted.forEach(({r}) => {
          const ks = rowKey(r); let g = groups.find(x => ks.some(k => x.keys.includes(k)));
          if (!g) { g = groups[0]; console.warn("Settings row not in SUBS." + c.k + ", shown under " + g.name + ":", ks.join(",") || (r.textContent || "").trim().slice(0, 40)); }
          g.rows.push(r);
        });
        // Every group shows at once, each under its own heading, so nothing hides behind a tab
        const live = groups.filter(g => g.rows.length);
        live.forEach((g, i) => {
          const ml = document.createElement("div"); ml.className = "menu-list us-group" + (/^(Delete Account|Start Over)$/.test(g.name) ? " us-danger-g" : ""); ml.dataset.sub = i;
          if (live.length > 1) { const h = document.createElement("h4"); h.className = "us-gh"; h.id = `usG-${c.k}-${i}`; h.textContent = g.name; ml.setAttribute("aria-labelledby", h.id); ml.setAttribute("role", "group"); sec.appendChild(h); }
          g.rows.forEach(r => ml.appendChild(r)); sec.appendChild(ml);
        });
      } else { const ml = document.createElement("div"); ml.className = "menu-list"; sorted.forEach(({r}) => ml.appendChild(r)); sec.appendChild(ml); }
      if (c.k === "data" && note) sec.appendChild(note);
      main.appendChild(sec);
    });
    if (note && note.parentNode === body) (main.querySelector('[data-us="data"]') || main).appendChild(note);
    list.remove();
    body.appendChild(wrap);
    const hd = sheet.querySelector(".sheet-head"), h2 = hd && hd.querySelector("h2");
    if (hd && !hd.querySelector(".us-back")) hd.insertAdjacentHTML("afterbegin", `<button type="button" class="icon-btn us-back" aria-label="Back to all settings" title="Back">${BACK_IC}</button>`);
    if (hd) dragToClose(sheet, hd);
    const q = wrap.querySelector(".us-q"), empty = wrap.querySelector(".us-empty");
    const setHead = () => { if (h2) h2.textContent = phone() && wrap.dataset.view === "cat" && !wrap.classList.contains("searching") ? CAT[wrap.dataset.cat].t : "Settings"; };
    const select = (k, view, keepScroll) => {
      if (!CAT[k] || !buckets[k].length) k = cats[0].k;
      wrap.dataset.cat = k; wrap.dataset.view = view || "cat";
      wrap.querySelectorAll(".us-cat").forEach(b => { const on = b.dataset.us === k; b.setAttribute("aria-selected", on); b.tabIndex = on ? 0 : -1; });
      wrap.querySelectorAll(".us-pane").forEach(p => p.classList.toggle("on", p.dataset.us === k));
      if (!keepScroll) { main.scrollTop = 0; body.scrollTop = 0; }
      ls(LAST, k); setHead();
    };
    const search = v => {
      const words = String(v || "").toLowerCase().split(/\s+/).filter(Boolean);
      wrap.classList.toggle("searching", !!words.length);
      let any = false;
      wrap.querySelectorAll(".us-pane").forEach(p => {
        const c = CAT[p.dataset.us], hay0 = c.t.toLowerCase();
        let n = 0;
        p.querySelectorAll(":scope > .menu-list > *").forEach(r => {
          const hay = hay0 + " " + (r.textContent || "").toLowerCase() + " " + rowKey(r).map(k => SYN[k] || "").join(" ");
          const hit = !words.length || words.every(w => hay.includes(w));
          r.classList.toggle("us-miss", !hit); if (hit) n++;
        });
        p.querySelectorAll(":scope > .menu-list.us-group").forEach(l => { const miss = !!words.length && ![...l.children].some(r => !r.classList.contains("us-miss")); l.classList.toggle("us-miss", miss); const h = l.previousElementSibling; if (h && h.classList.contains("us-gh")) h.classList.toggle("us-miss", miss); });
        const hitPane = !!words.length && n > 0;
        p.classList.toggle("us-hit", hitPane); if (hitPane) any = true;
        const tab = wrap.querySelector(`.us-cat[data-us="${p.dataset.us}"]`); if (tab) tab.classList.toggle("us-has", hitPane);
      });
      empty.hidden = !words.length || any;
      setHead();
    };
    const pickSub = (pane, i) => {
      pane.querySelectorAll(".us-sub-tab").forEach(t => { const on = Number(t.dataset.sub) === i; t.setAttribute("aria-selected", on); t.tabIndex = on ? 0 : -1; });
      pane.querySelectorAll(":scope > .us-sub").forEach(l => l.classList.toggle("on", Number(l.dataset.sub) === i));
    };
    wrap.addEventListener("click", e => {
      const st = e.target.closest(".us-sub-tab");
      if (st) { pickSub(st.closest(".us-pane"), Number(st.dataset.sub)); return; }
      const b = e.target.closest(".us-cat"); if (!b) return;
      if (q.value) { q.value = ""; search(""); }
      select(b.dataset.us, "cat");
      if (phone() && e.detail === 0 && back) back.focus();
    });
    wrap.querySelector(".us-cats").addEventListener("keydown", e => {
      if (!/^(ArrowDown|ArrowUp|Home|End)$/.test(e.key)) return;
      const tabs = [...wrap.querySelectorAll(".us-cat")], i = tabs.indexOf(document.activeElement); if (i < 0) return;
      e.preventDefault();
      const j = e.key === "Home" ? 0 : e.key === "End" ? tabs.length - 1 : (i + (e.key === "ArrowDown" ? 1 : -1) + tabs.length) % tabs.length;
      tabs[j].focus(); if (!phone()) select(tabs[j].dataset.us, "cat");
    });
    wrap.addEventListener("keydown", e => {
      const t = e.target.closest && e.target.closest(".us-sub-tab"); if (!t || !/^(ArrowLeft|ArrowRight|Home|End)$/.test(e.key)) return;
      const tabs = [...t.parentNode.querySelectorAll(".us-sub-tab")], i = tabs.indexOf(t);
      const j = e.key === "Home" ? 0 : e.key === "End" ? tabs.length - 1 : (i + (e.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
      e.preventDefault(); tabs[j].focus(); tabs[j].click();
    });
    q.addEventListener("input", () => search(q.value));
    q.addEventListener("keydown", e => { if (e.key === "Escape" && q.value) { e.preventDefault(); e.stopPropagation(); q.value = ""; search(""); } });
    const back = hd && hd.querySelector(".us-back");
    if (back) back.addEventListener("click", e => { e.stopPropagation(); if (q.value) { q.value = ""; search(""); } select(wrap.dataset.cat, "home"); const t = wrap.querySelector(`.us-cat[data-us="${wrap.dataset.cat}"]`); if (t && e.detail === 0) t.focus(); });
    sheet.addEventListener("keydown", e => { if (e.key === "Escape" && phone() && wrap.dataset.view === "cat" && e.target !== q) { e.preventDefault(); e.stopPropagation(); select(wrap.dataset.cat, "home"); } });
    const start = (prev && prev.cat) || ls(LAST) || cats[0].k;
    select(start, prev ? prev.view : "home", !!prev);
    if (prev && prev.q) { q.value = prev.q; search(prev.q); }
    if (prev) requestAnimationFrame(() => { main.scrollTop = prev.top; });
    // A fresh Settings sheet starts in Search Settings (not on Close) with a mouse or trackpad; touch screens (phones,
    // iPads) skip it so the on-screen keyboard only comes up when you tap the search box
    else if (window.matchMedia && matchMedia("(min-width:601px) and (hover:hover) and (pointer:fine)").matches) { try { q.focus({preventScroll: true}); } catch (e) {} }
  }

  // Phones: pull the sheet down by its top bar to close it
  function dragToClose(sheet, grip){
    let y0 = null, dy = 0, id = null;
    grip.addEventListener("pointerdown", e => {
      if (!phone() || e.button > 0 || e.target.closest("button, input, a, select")) return;
      y0 = e.clientY; dy = 0; id = e.pointerId; sheet.style.transition = "none";
      try { grip.setPointerCapture(id); } catch (err) {}
    });
    grip.addEventListener("pointermove", e => { if (y0 == null || e.pointerId !== id) return; dy = Math.max(0, e.clientY - y0); sheet.style.transform = dy ? `translateY(${dy}px)` : ""; });
    const end = () => {
      if (y0 == null) return;
      const far = dy > 90 && dlg.open; y0 = null; dy = 0; sheet.style.transition = "";
      if (far) { dlg.close(); setTimeout(() => { sheet.style.transform = ""; }, 300); } else sheet.style.transform = "";
    };
    grip.addEventListener("pointerup", end); grip.addEventListener("pointercancel", end);
  }

  // Show one settings row (for other modules and tests)
  function reveal(sel){
    const el = typeof sel === "string" ? dlg.querySelector(sel) : sel; if (!el) return null;
    const wrap = el.closest(".us"), pane = el.closest(".us-pane");
    if (wrap && pane) { const tab = wrap.querySelector(`.us-cat[data-us="${pane.dataset.us}"]`); if (tab && tab.getAttribute("aria-selected") !== "true" || wrap.dataset.view !== "cat") tab && tab.click(); }
    const sub = el.closest(".us-sub"); if (sub && pane) { const st = pane.querySelector(`.us-sub-tab[data-sub="${sub.dataset.sub}"]`); if (st && st.getAttribute("aria-selected") !== "true") st.click(); }
    el.scrollIntoView && el.scrollIntoView({block: "nearest"});
    return el;
  }
  window.SBUI = Object.assign(window.SBUI || {}, {settingsCats: () => CATS.map(c => c.k), reveal, catOf});
})();


