/* ===== module: 99-smooth.js ===== */
/* Smooth reveals: tabs, sheets, menus and opened sections ease in (opacity and movement only, so they stay fast) */
(function(){
  const root = document.documentElement;
  const on = () => root.dataset.motion !== "static" && styleCfg().motion !== false;
  let lastKey = null, userAt = 0;
  const play = (el, cls) => { if (!el || !on()) return; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); setTimeout(() => el.classList.remove(cls), 420); };

  // A tab (or course / plan view) changed: the new page eases in. Re-draws from edits stay still.
  hook("render", tab => {
    const key = tab + "|" + (typeof ui !== "undefined" && ui.courseId || "");
    const changed = lastKey !== null && key !== lastKey; lastKey = key;
    if (changed) play(document.getElementById("view"), "sm-view");
  });

  // Anything the person taps may open something: for a moment after, new or revealed content eases in
  // The watcher only runs for that moment, so it costs nothing while scenes and the companion animate
  let stopT = 0;
  const mark = () => { userAt = performance.now(); if (!stopT) watch(); clearTimeout(stopT); stopT = setTimeout(() => { stopT = 0; mo.disconnect(); }, 700); };
  ["pointerdown", "keydown", "click"].forEach(t => document.addEventListener(t, mark, true));
  const recent = () => performance.now() - userAt < 600;
  const view = () => document.getElementById("view");
  const mo = new MutationObserver(list => {
    if (!recent() || !on()) return;
    let n = 0;
    for (const m of list) {
      if (n > 6) break;
      const t = m.target;
      if (m.type === "attributes") {
        if (!(t instanceof Element) || t.id === "view" || t.closest(".sm-skip")) continue;
        const a = m.attributeName;
        // hidden taken off, or open/expanded flags turned on, or a "shut" class removed
        if ((a === "hidden" && !t.hidden) || (a === "open" && t.hasAttribute("open"))) { play(t, "sm-in"); n++; }
        else if (a === "class") {
          const was = (m.oldValue || "").split(/\s+/), now = [...t.classList];
          if ((was.includes("shut") && !now.includes("shut")) || (was.includes("collapsed") && !now.includes("collapsed"))) { const b = t.querySelector(":scope > .ui-sec-b, :scope > .body, :scope > .sec-b") || t; play(b, "sm-in"); n++; }
          else if (!was.includes("open") && now.includes("open") && /\b(ui-col|acc|drop|more|panel)/.test(t.className)) { play(t, "sm-in"); n++; }
        }
      } else if (m.type === "childList" && t !== view() && t.id !== "view") {
        // a small piece of the page filled in (an opened section, a menu list); whole-page redraws land on #view and are skipped
        for (const a of m.addedNodes) if (a.nodeType === 1 && !a.classList.contains("sm-in") && n < 6 && !a.closest(".sm-skip") && !/^(SCRIPT|STYLE|CANVAS)$/.test(a.tagName)) { if (t.closest("#dlg") && t === document.getElementById("dlg")) continue; play(a, "sm-in"); n++; }
      }
    }
  });
  const watch = () => mo.observe(document.body, {subtree: true, childList: true, attributes: true, attributeOldValue: true, attributeFilter: ["hidden", "open", "class"]});
})();
