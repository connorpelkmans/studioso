/* ===== module: 99-smooth.js ===== */
/* Smooth reveals: tabs, sheets, menus and opened sections ease in (opacity and movement only, so they stay fast) */
(function(){
  const root = document.documentElement;
  const on = () => root.dataset.motion !== "static" && styleCfg().motion !== false && !(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
  let lastKey = null, userAt = 0;
  const play = (el, cls) => { if (!el || !on()) return; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); setTimeout(() => el.classList.remove(cls), 420); };

  // A pop-up opens with nothing highlighted: the browser would otherwise put focus (and its ring) on the first button, the close X
  const showModal0 = HTMLDialogElement.prototype.showModal;
  // On a phone no sheet raises the keyboard by itself: the person taps the box they want to type in
  const phoneW = () => matchMedia("(max-width:639px)").matches;
  const quiet = d => {
    try {
      const a = document.activeElement;
      // A heading the sheet focused on purpose stays focused, so screen readers start there
      if (a && a !== d && d.open && d.contains(a) && !/^H[1-6]$/.test(a.tagName) && (phoneW() || !d.querySelector("[autofocus]")) && (phoneW() || !/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)) && !a.isContentEditable) {
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
  // Phones: a sheet slides back down when it closes. The sheet itself closes at once (nothing in the app waits on it);
  // a still copy of how it looked slides down and fades over the page, then goes.
  const close0 = HTMLDialogElement.prototype.close;
  const reduced = () => !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
  function sheetGhost(d){
    try {
      if (!d.open || !phoneW() || !on() || reduced() || !d.matches(":modal") || d.classList.contains("tour") || !document.body.showPopover) return null;
      const r = d.getBoundingClientRect(); if (r.height < 40 || r.top >= innerHeight) return null;
      const dim = getComputedStyle(d, "::backdrop").backgroundColor;
      const host = document.createElement("div"); host.className = "sm-ghost sm-skip"; host.setAttribute("aria-hidden", "true"); host.inert = true; host.setAttribute("popover", "manual");
      const c = d.cloneNode(true);
      // what was typed isn't copied with the elements, so carry it over
      const src = d.querySelectorAll("input,textarea,select"), dst = c.querySelectorAll("input,textarea,select");
      src.forEach((el, i) => { const t = dst[i]; if (!t) return; if (el.type === "checkbox" || el.type === "radio") t.checked = el.checked; else try { t.value = el.value; } catch (e) {} });
      // a closed dialog shown by hand, so nothing looking for an open sheet ever finds it; it wears the sheet's own box
      c.removeAttribute("open"); c.classList.add("sm-ghost-sheet");
      const cs = getComputedStyle(d), box = {};
      ["display", "flexDirection", "background", "backgroundColor", "color", "border", "borderRadius", "padding", "boxShadow", "overflow", "fontFamily", "fontSize", "boxSizing"].forEach(k => { box[k] = cs[k]; });
      Object.assign(c.style, box, {position: "fixed", left: r.left + "px", top: r.top + "px", right: "auto", bottom: "auto", width: r.width + "px", height: r.height + "px", margin: "0", maxHeight: "none", maxWidth: "none", transform: "none", animation: "none"});
      const sc = d.querySelector(".sheet-body, .sheet"), sc2 = sc && c.querySelector(sc.classList.contains("sheet-body") ? ".sheet-body" : ".sheet"), st = sc ? sc.scrollTop : 0;
      host.innerHTML = `<div class="sm-ghost-dim" style="background:${dim && dim !== "rgba(0, 0, 0, 0)" ? dim : "rgba(10,14,22,.45)"}"></div>`;
      host.appendChild(c);
      return () => {
        document.body.appendChild(host); try { host.showPopover(); } catch (e) {}
        if (sc2) sc2.scrollTop = st;   // where it was scrolled to
        const ease = {duration: 260, easing: "cubic-bezier(.4,0,1,1)", fill: "forwards"};
        const a = c.animate([{transform: "translateY(0)"}, {transform: "translateY(" + Math.max(r.height, innerHeight - r.top) + "px)"}], ease);
        host.firstChild.animate([{opacity: 1}, {opacity: 0}], ease);
        const done = () => host.remove(); a.finished.then(done, done); setTimeout(done, 600);
      };
    } catch (e) { return null; }
  }
  HTMLDialogElement.prototype.close = function(){
    const ghost = sheetGhost(this);
    const r = close0.apply(this, arguments);
    if (ghost) ghost();
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
    if (changed && !root.classList.contains("vt-tab")) play(document.getElementById("view"), "sm-view");
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
        for (const a of m.addedNodes) if (a.nodeType === 1 && !a.classList.contains("sm-in") && n < 6 && !a.closest(".sm-skip, .g2-band, .detail-head, .view-head, .cf-row, .qa-bar, nav, header") && !a.matches(".ra-more, .ph-more, .ph-menu") && !/^(SCRIPT|STYLE|CANVAS)$/.test(a.tagName)) { if (t.tagName === "DIALOG") continue; play(a, "sm-in"); n++; }   // a sheet redrawn whole (a button pressed in it) stays still
      }
    }
  });
  const watch = () => mo.observe(document.body, {subtree: true, childList: true, attributes: true, attributeOldValue: true, attributeFilter: ["hidden", "open", "class"]});
})();
