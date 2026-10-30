/* ===== module: 97-getting-started.js ===== */
/* Getting Started: a short checklist on the Board for a student's first weeks.
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

  const ITEMS = [
    {id: "courses", t: "Add your courses", s: "Type them, import a syllabus or connect your school site.",
      done: () => coursesArr().length > 0, go: () => goTab("courses")},
    {id: "deadline", t: "Add a deadline", s: "Type it like a sentence: \"bio quiz fri 2pm\".",
      done: () => allTasks().some(t => t.due), go: quickAdd},
    {id: "focus", t: "Finish a focus session", s: "Start the timer on any task. Even 10 minutes counts.",
      done: () => { try { return SBSTATS.totalFocusMinutes() > 0; } catch (e) { return false; } }, go: () => { if (dlg.open) dlg.close(); openPomo(); }},
    {id: "deck", t: "Make a flashcard deck", s: "Write a few cards, or let AI make them from your notes.",
      done: () => decksArr().length > 0, go: () => goTab("flashcards")},
    {id: "tour", t: "Take the 1-minute tour", s: "See where everything lives.",
      done: () => !!(window.SBTOUR && SBTOUR.taken()), go: () => { if (dlg.open) dlg.close(); setTimeout(() => SBTOUR.start(), 60); }}
  ];
  const doneOf = it => { try { return !!it.done(); } catch (e) { return false; } };

  // Shown for the first 30 days after the welcome setup, until it's finished or hidden.
  // It gives way to the semester and backups cards so only one card sits on the Board at a time.
  function showing(){
    if (inPreview() || (window.SBOB && SBOB.pending())) return false;
    const at = window.SBOB && SBOB.setupAt ? SBOB.setupAt() : 0;
    if (!at || Date.now() - at > DAYS * 864e5) return false;
    const m = get(); if (m.hide || m.fin) return false;
    if (window.SBSEM && SBSEM.cardDue && SBSEM.cardDue()) return false;
    if (window.SBOB.backupDue && SBOB.backupDue()) return false;
    return true;
  }

  const CHECK = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  const CHEV = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>';
  const CLOSE = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';

  function cardHtml(){
    const st = ITEMS.map(doneOf), n = st.filter(Boolean).length, all = n === ITEMS.length, open = get().open !== false;
    const pct = Math.round(n / ITEMS.length * 100);
    if (all) return `<section class="gs-card gs-all" aria-labelledby="gsT"><div class="gs-head"><span class="gs-party" aria-hidden="true">🎉</span><div class="gs-ht"><b id="gsT">You're All Set Up</b><span class="mini">You've tried the main parts of Studyboard. Nice work.</span></div>
      <button type="button" class="btn small primary" data-act="gs-fin">Done</button></div></section>`;
    const next = st.indexOf(false);
    const rows = ITEMS.map((it, k) => `<li class="gs-row${st[k] ? " ok" : ""}${k === next ? " next" : ""}">
      <button type="button" class="gs-btn" data-act="gs-go" data-id="${it.id}"${st[k] ? ' aria-disabled="true"' : ""}>
        <span class="gs-ck" aria-hidden="true">${st[k] ? CHECK : ""}</span>
        <span class="gs-tx"><b>${esc(it.t)}</b>${k === next ? `<span class="mini">${esc(it.s)}</span>` : ""}</span>
        <span class="gs-sr">${st[k] ? "(done)" : ""}</span>${st[k] ? "" : `<span class="gs-chev" aria-hidden="true">${CHEV}</span>`}
      </button></li>`).join("");
    return `<section class="gs-card${open ? "" : " shut"}" aria-labelledby="gsT">
      <div class="gs-head">
        <button type="button" class="gs-toggle" data-act="gs-toggle" aria-expanded="${open}" aria-controls="gsList">
          <span class="gs-ring" style="--p:${pct}" aria-hidden="true"><span>${n}/${ITEMS.length}</span></span>
          <span class="gs-ht"><b id="gsT">Getting Started</b><span class="mini">${n} of ${ITEMS.length} done${open ? "" : ` · Next: ${esc(ITEMS[next].t.toLowerCase())}`}</span></span>
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
      const id = el && el.dataset ? el.dataset.id : "", it = ITEMS.find(x => x.id === id);
      if (it && !doneOf(it)) it.go();
      return true;
    }
    return false;
  });

  window.SBGS = {showing, items: () => ITEMS.map(it => ({id: it.id, done: doneOf(it)}))};
})();
