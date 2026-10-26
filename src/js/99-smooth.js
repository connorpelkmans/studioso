/* ===== module: 99-smooth.js ===== */
/* Smooth reveals: tabs, sheets, menus and opened sections ease in (opacity and movement only, so they stay fast) */
(function(){
  const root = document.documentElement;
  const on = () => root.dataset.motion !== "static" && styleCfg().motion !== false;
  let lastKey = null, userAt = 0;
  const play = (el, cls) => { if (!el || !on()) return; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); setTimeout(() => el.classList.remove(cls), 420); };

  // A pop-up opens with nothing highlighted: the browser would otherwise put focus (and its ring) on the first button, the close X
  const showModal0 = HTMLDialogElement.prototype.showModal;
  // On a phone no sheet raises the keyboard by itself: the person taps the box they want to type in
  const phoneW = () => matchMedia("(max-width:639px)").matches;
  const quiet = d => {
    try {
      const a = document.activeElement;
      if (a && a !== d && d.open && d.contains(a) && (phoneW() || !d.querySelector("[autofocus]")) && (phoneW() || !/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)) && !a.isContentEditable) {
        let h = d.querySelector(":scope > .sm-focus");
        if (!h) { h = document.createElement("span"); h.className = "sm-focus"; h.tabIndex = -1; h.setAttribute("aria-hidden", "true"); d.append(h); }
        h.focus({preventScroll: true});
      }
    } catch (e) {}
  };
  HTMLDialogElement.prototype.showModal = function(){
    const r = showModal0.apply(this, arguments);
    quiet(this); requestAnimationFrame(() => quiet(this));
    return r;
  };
  // The main sheets carry their own showModal (99-release.js), so wrap those too
  document.querySelectorAll("dialog").forEach(d => {
    if (!Object.prototype.hasOwnProperty.call(d, "showModal")) return;
    const f = d.showModal;
    d.showModal = function(){ const r = f.apply(this, arguments); quiet(this); requestAnimationFrame(() => quiet(this)); return r; };
  });

  // A tab (or course / plan view) changed: the new page eases in. Re-draws from edits stay still.
  hook("render", tab => {
    const key = tab + "|" + (typeof ui !== "undefined" && ui.courseId || "");
    const changed = lastKey !== null && key !== lastKey; lastKey = key;
    if (changed) play(document.getElementById("view"), "sm-view");
  });

  // Tab bar: the tapped tab shows as selected at once, so the highlight fades in with the tap instead of after the page is drawn
  document.addEventListener("pointerup", e => {
    const b = e.target.closest && e.target.closest("nav.tabs button[data-tab]"); if (!b || !on()) return;
    b.parentNode.querySelectorAll('button[aria-current="page"]').forEach(o => { if (o !== b) o.setAttribute("aria-current", "false"); });
    b.setAttribute("aria-current", "page");
  }, true);

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
        for (const a of m.addedNodes) if (a.nodeType === 1 && !a.classList.contains("sm-in") && n < 6 && !a.closest(".sm-skip, .g2-band, .detail-head, .view-head, .cf-row, nav, header") && !a.matches(".ra-more, .ph-more, .ph-menu") && !/^(SCRIPT|STYLE|CANVAS)$/.test(a.tagName)) { if (t.closest("#dlg") && t === document.getElementById("dlg")) continue; play(a, "sm-in"); n++; }
      }
    }
  });
  const watch = () => mo.observe(document.body, {subtree: true, childList: true, attributes: true, attributeOldValue: true, attributeFilter: ["hidden", "open", "class"]});
})();
