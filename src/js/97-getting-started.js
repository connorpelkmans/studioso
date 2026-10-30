/* ===== module: 97-getting-started.js ===== */
/* Getting Started: a short checklist (the app tour is offered at the end of the welcome setup, so it isn't on here) on the Board for a student's first weeks.
   Each item ticks itself off from what the student has really done, so there is nothing to mark by hand. */
(() => {
  const KEY = "sb:gs";
  const get = () => { try { return JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (e) { return {}; } };
  const set = patch => { try { localStorage.setItem(KEY, JSON.stringify(Object.assign(get(), patch))); } catch (e) {} };
  const DAYS = 30;

  const press = list => { for (const q of list) { const b = document.querySelector(q); if (b && b.offsetParent) { b.click(); return true; } } return false; };
  const goTab = t => { if (dlg.open) dlg.close(); ui.tab = t; if (t === "flashcards") { ui.fc = null; ui.deckId = null; } if (t === "courses") ui.courseId = null; render(); window.scrollTo(0, 0); };
  const quickAdd = () => {
    const i = $("#qaIn");
    if (!i || !i.offsetParent) { if (!press(["#fab"])) goTab("board"); return; }
    const bar = i.closest(".qa-bar");
    try { i.focus({preventScroll: true}); } catch (e) { i.focus(); }
    if (bar) { bar.scrollIntoView({block: "center"}); bar.classList.add("ob-glow"); setTimeout(() => bar.classList.remove("ob-glow"), 2600); }
  };

  const SITES = Object.values(LMS_NAMES);
  const fromSchool = () => get().route === "lms" || allTasks().some(t => lmsSite(t)) || coursesArr().some(c => (c.links || []).some(l => l && SITES.includes(l.label)));
  const ROUTE = {"lms-open": "lms", "import-syllabus": "syllabus", "new-course": "manual"};

  const ITEMS = [
    // Three ways in, quickest first: the school site brings in every course at once
    {id: "courses", t: "Add your courses", s: "Connect your school site, import a syllabus or type them in.",
      done: () => coursesArr().length > 0, go: () => { fabMenu("Add Your Courses", [
        ["lms-open", "Connect Your School Site", "Canvas, Brightspace or Blackboard. Brings in your courses, due dates and grades", "school"],
        ["import-syllabus", "Import a Syllabus", "Upload a PDF to add the course and its deadlines", "syllabus"],
        ["new-course", "Add It Myself", "Name, code, color and class times", "course"]]);
        // Remember which way they chose; the app then opens it as usual
        const fl = dlg.querySelector(".fm-list");
        if (fl) fl.addEventListener("click", e => { const b = e.target.closest("[data-act]"); if (b && ROUTE[b.dataset.act]) set({route: ROUTE[b.dataset.act]}); }, true); }},
    {id: "deadline", t: "Add a deadline", s: "Type it like a sentence: \"bio quiz fri 2pm\".",
      // A school site brings deadlines in by itself, so this is only for courses from a syllabus or typed in
      here: () => !fromSchool() && (["syllabus", "manual"].includes(get().route) || coursesArr().length > 0),
      done: () => allTasks().some(t => t.due), go: quickAdd},
    {id: "focus", t: "Start a focus session", s: "Start the timer on any task. Even 10 minutes helps.",
      done: () => { if (get().focus) return true; try { return SBSTATS.totalFocusMinutes() > 0; } catch (e) { return false; } }, go: () => { if (dlg.open) dlg.close(); openPomo(); }},
    {id: "note", t: "Make a note", s: "Pin a quick thought to your board, or press and hold anywhere on it.",
      done: () => notesArr().length > 0, go: () => goTab("notes")},
    {id: "deck", t: "Make a flashcard deck", s: "Write a few cards, or let AI make them from your notes.",
      done: () => decksArr().length > 0, go: () => goTab("flashcards")},
    // Only where automatic backups work (not every browser can save to a folder)
    {id: "backups", t: "Set up backups", s: "Save a copy to Google Drive or OneDrive every hour.", here: () => !!(window.SBOB && SBOB.backupsHere && SBOB.backupsHere()),
      done: () => !!(window.SBOB && SBOB.backupOn && SBOB.backupOn()), go: () => fire("act", "ob-backup", document.body, "")},
    {id: "theme", t: "Select a theme", s: "Make Studyboard yours, light or dark.",
      done: () => !!get().theme, go: () => fire("act", "ob-theme", document.body, "")}
  ];
  const list = () => ITEMS.filter(it => { try { return !it.here || it.here(); } catch (e) { return false; } });
  const doneOf = it => { try { return !!it.done(); } catch (e) { return false; } };

  // Shown for the first 30 days after the welcome setup, until it's finished or hidden.
  // It gives way to the semester card; the backups and A Few More Things cards wait for it, so only one card sits on the Board at a time.
  function showing(){
    if (inPreview() || (window.SBOB && SBOB.pending())) return false;
    const at = window.SBOB && SBOB.setupAt ? SBOB.setupAt() : 0;
    if (!at || Date.now() - at > DAYS * 864e5) return false;
    const m = get(); if (m.hide || m.fin) return false;
    if (window.SBSEM && SBSEM.cardDue && SBSEM.cardDue()) return false;
    return true;
  }

  const CHECK = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  const CHEV = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>';
  const CLOSE = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';

  function cardHtml(){
    const L = list(), st = L.map(doneOf), n = st.filter(Boolean).length, all = n === L.length, open = get().open !== false;
    const pct = Math.round(n / L.length * 100);
    if (all) return `<section class="gs-card gs-all" aria-labelledby="gsT"><div class="gs-head"><span class="gs-party" aria-hidden="true">🎉</span><div class="gs-ht"><b id="gsT">You're All Set Up</b><span class="mini">You've tried the main parts of Studyboard. Nice work.</span></div>
      <button type="button" class="btn small primary" data-act="gs-fin">Done</button></div></section>`;
    const next = st.indexOf(false);
    const rows = L.map((it, k) => `<li class="gs-row${st[k] ? " ok" : ""}${k === next ? " next" : ""}">
      <button type="button" class="gs-btn" data-act="gs-go" data-id="${it.id}"${st[k] ? ' aria-disabled="true"' : ""}>
        <span class="gs-ck" aria-hidden="true">${st[k] ? CHECK : ""}</span>
        <span class="gs-tx"><b>${esc(it.t)}</b>${k === next ? `<span class="mini">${esc(it.s)}</span>` : ""}</span>
        <span class="gs-sr">${st[k] ? "(done)" : ""}</span>${st[k] ? "" : `<span class="gs-chev" aria-hidden="true">${CHEV}</span>`}
      </button></li>`).join("");
    return `<section class="gs-card${open ? "" : " shut"}" aria-labelledby="gsT">
      <div class="gs-head">
        <button type="button" class="gs-toggle" data-act="gs-toggle" aria-expanded="${open}" aria-controls="gsList">
          <span class="gs-ring" style="--p:${pct}" aria-hidden="true"><span>${n}/${L.length}</span></span>
          <span class="gs-ht"><b id="gsT">Getting Started</b><span class="mini">${n} of ${L.length} done${open ? "" : ` · Next: ${esc(L[next].t.toLowerCase())}`}</span></span>
        </button>
        <button type="button" class="icon-btn gs-x" data-act="gs-hide" aria-label="Hide Getting Started">${CLOSE}</button>
      </div>
      <div class="gs-bar" aria-hidden="true"><span style="width:${pct}%"></span></div>
      <ul class="gs-list" id="gsList"${open ? "" : " hidden"}>${rows}</ul>
    </section>`;
  }

  hook("render", tab => {
    if (tab !== "board" || !showing()) return;
    const v = $("#view"); if (!v || v.querySelector(".gs-card")) return;
    v.insertAdjacentHTML("afterbegin", cardHtml());
  });

  hook("act", (act, el) => {
    if (!/^gs-/.test(act)) return false;
    if (act === "gs-hide") { set({hide: Date.now()}); render(); toast("Getting Started hidden. Everything on it is still in the app."); return true; }
    if (act === "gs-fin") { set({fin: Date.now()}); render(); return true; }
    if (act === "gs-toggle") { set({open: get().open === false}); render(); return true; }
    if (act === "gs-go") {
      const id = el && el.dataset ? el.dataset.id : "", it = list().find(x => x.id === id);
      if (it && !doneOf(it)) it.go();
      return true;
    }
    return false;
  });

  // Starting the timer counts, even if the session isn't finished
  hook("focus", e => { if (e && e.type === "start" && e.mode === "focus" && !get().focus) set({focus: Date.now()}); });

  window.SBGS = {showing, mark: id => set({[id]: Date.now()}), items: () => list().map(it => ({id: it.id, done: doneOf(it)}))};
})();
