// Studyboard Today widget: shows what the Studyboard page sends (see the widgets module) in the page's own theme colors.
// Everything is built with textContent, so nothing from your tasks can ever run as code here.
(() => {
  "use strict";
  const W = window.studyboardWidget;
  const $ = id => document.getElementById(id);
  const CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  let data = null, pinned = false;
  const flipped = new Map();            // tasks checked here and waiting for the page to confirm: id -> done

  function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function svg(markup) { const t = document.createElement("template"); t.innerHTML = markup; return t.content.firstChild; }   // our own constant icons only

  function applyTheme(t) {
    const r = document.documentElement.style;
    const map = { bg: "--bg", surface: "--surface", ink: "--ink", muted: "--muted", line: "--line", soft: "--soft", accent: "--accent", accentInk: "--accent-ink", late: "--late", tomato: "--tomato" };
    for (const k in map) { if (t && t[k]) r.setProperty(map[k], t[k]); else r.removeProperty(map[k]); }
    if (t && t.font) r.setProperty("--body", t.font); else r.removeProperty("--body");
    if (t && t.display) r.setProperty("--display", t.display); else r.removeProperty("--display");
    document.documentElement.dataset.theme = t && t.dark ? "dark" : "light";
  }

  function row(t) {
    const done = flipped.has(t.id) ? flipped.get(t.id) : t.done;
    const li = el("li", "w-row" + (done ? " is-done" : "") + (t.late && !done ? " is-late" : ""));
    if (t.color) li.style.setProperty("--c", t.color);
    const ck = el("button", "w-check");
    ck.setAttribute("role", "checkbox"); ck.setAttribute("aria-checked", String(done));
    ck.setAttribute("aria-label", (done ? "Mark not done: " : "Mark done: ") + t.title);
    ck.appendChild(svg(CHECK));
    ck.addEventListener("click", () => { flipped.set(t.id, !done); W.toggle(t.id); render(); });
    const main = el("button", "w-main");
    main.title = "Open in Studyboard";
    main.appendChild(el("span", "w-title", t.title));
    const meta = [t.course, t.meta].filter(Boolean).join(" · ");
    if (meta) main.appendChild(el("span", "w-meta", meta));
    main.addEventListener("click", () => W.open("task", t.id));
    li.append(ck, main);
    return li;
  }

  function render() {
    const body = $("body"), foot = $("foot");
    body.textContent = ""; foot.textContent = "";
    $("date").textContent = data && data.dateLabel ? data.dateLabel : new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
    const st = $("streak");
    st.hidden = !(data && data.streak && data.streak.cur);
    if (!st.hidden) { st.textContent = "🔥 " + data.streak.cur; st.title = data.streak.cur + "-day streak" + (data.streak.today ? "" : ". Make progress today to keep it."); st.classList.toggle("dim", !data.streak.today); }
    $("pin").setAttribute("aria-pressed", String(pinned));
    if (!data) {
      const e = el("div", "w-empty");
      e.append(el("strong", "", "Open Studyboard to Fill This In"), el("span", "", "Your day shows up here once Studyboard has started."));
      const b = el("button", "w-btn primary", "Open Studyboard"); b.addEventListener("click", () => W.open("app")); e.appendChild(b);
      body.appendChild(e); return;
    }
    const n = data.next;
    if (n && !(flipped.get(n.id))) {
      const card = el("section", "w-next");
      if (n.color) card.style.setProperty("--c", n.color);
      card.appendChild(el("span", "w-lbl", "Do This Next"));
      const t = el("button", "w-next-title", n.title); t.title = "Open in Studyboard"; t.addEventListener("click", () => W.open("task", n.id));
      card.appendChild(t);
      const why = [n.course, n.why].filter(Boolean).join(" · ");
      if (why) card.appendChild(el("span", "w-meta", why));
      const go = el("button", "w-btn primary", n.mins ? `Start a ${n.mins}m Focus` : "Start a Focus Session");
      go.addEventListener("click", () => W.open("focus-task", n.id));
      card.appendChild(go);
      body.appendChild(card);
    }
    const tasks = data.tasks || [];
    const left = tasks.filter(t => !(flipped.has(t.id) ? flipped.get(t.id) : t.done)).length;
    const h = el("h2", "w-h", "Today's List");
    if (tasks.length) h.appendChild(el("span", "", left ? `${left} left` : "All done 🎉"));
    body.appendChild(h);
    if (tasks.length) {
      const ul = el("ul", "w-list");
      tasks.forEach(t => ul.appendChild(row(t)));
      body.appendChild(ul);
      if (data.more) { const m = el("button", "w-more", `${data.more} more in Studyboard`); m.addEventListener("click", () => W.open("today")); body.appendChild(m); }
    } else {
      const e = el("div", "w-empty small");
      e.append(el("span", "", "Nothing planned for today."));
      const b = el("button", "w-btn", "Add a Task"); b.addEventListener("click", () => W.open("quickadd")); e.appendChild(b);
      body.appendChild(e);
    }
    if (data.cards) {
      const fc = el("button", "w-chip");
      fc.appendChild(svg('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="6" width="14" height="12" rx="2"/><path d="M7 3h12a2 2 0 0 1 2 2v10"/></svg>'));
      fc.appendChild(el("span", "", `${data.cards} flashcard${data.cards === 1 ? "" : "s"} due`));
      fc.addEventListener("click", () => W.open("flashcards"));
      foot.appendChild(fc);
    }
    const add = el("button", "w-chip", "+ Quick Add"); add.addEventListener("click", () => W.open("quickadd"));
    foot.appendChild(add);
  }

  W.onData(d => {
    data = d && typeof d === "object" ? d : null;
    // Drop local check marks the page has now confirmed.
    if (data) for (const [id, done] of flipped) { const t = (data.tasks || []).find(x => x.id === id); if (!t || t.done === done) flipped.delete(id); }
    applyTheme(data && data.theme);
    render();
  });
  W.onPinned(on => { pinned = on; render(); });
  $("openApp").addEventListener("click", () => W.open("app"));
  $("pin").addEventListener("click", () => { pinned = !pinned; W.pin(pinned); render(); });
  $("close").addEventListener("click", () => W.hide());
  document.documentElement.dataset.platform = W.platform;
  // A new day starts: redraw the date and let the page's next update bring the new list.
  setInterval(() => { if (data && data.day && data.day !== new Date().toLocaleDateString("en-CA")) { data.dateLabel = ""; render(); } }, 60000);
  render();
  W.ready();
})();
