/* ===== module: 102-qol.js ===== */
/* Back and Forward, page titles, keyboard shortcuts, tooltips, skip links and the sync status sheet */
(() => {
  const mm = q => { try { return window.matchMedia ? matchMedia(q) : null; } catch (e) { return null; } };
  const widgetView = (() => { try { return new URLSearchParams(location.search).get("widget") === "today"; } catch (e) { return false; } })();
  const modals = () => [...document.querySelectorAll("dialog[open]")].filter(d => { try { return d.matches(":modal"); } catch (e) { return true; } });

  /* ================= Back and Forward =================
     Each page (tab, course, deck, group) is its own history entry with its own address (?view=notes, ?view=courses&course=…),
     so Back goes to the last page instead of leaving the app. An open sheet adds an entry too, so Back closes it first. */
  const H = window.history, canRoute = !widgetView && !!(H && H.pushState && H.replaceState);
  const PARAMS = ["view", "course", "deckid", "grp"];
  const KNOWN = ["board", "timeline", "schedule", "crunch", "courses", "files", "emails", "archive", "flashcards", "notes", "groups", "companion"];
  const group = t => isPlanTab(t) ? "plan" : t === "files" || t === "emails" ? "courses" : t;
  const route = () => ({tab: ui.tab, course: ui.tab === "courses" ? ui.courseId || "" : "", deck: ui.tab === "flashcards" ? ui.deckId || "" : "", grp: ui.tab === "groups" ? ui.grp || "" : ""});
  const keyOf = r => [r.tab, r.course, r.deck, r.grp].join("|");
  function urlOf(r){
    const u = new URL(location.href);
    PARAMS.forEach(k => u.searchParams.delete(k));
    if (r.tab !== "board") u.searchParams.set("view", r.tab);
    if (r.course) u.searchParams.set("course", r.course);
    if (r.deck) u.searchParams.set("deckid", r.deck);
    if (r.grp) u.searchParams.set("grp", r.grp);
    return u.pathname + u.search + u.hash;
  }
  let cur = null, curKey = "", idx = 0, sheetOpen = false, skip = 0, popping = false, waiting = [];
  const op = f => { if (skip) waiting.push(f); else { try { f(); } catch (e) {} } };
  const put = (r, push, sheet) => op(() => {
    if (push) idx++;
    H[push ? "pushState" : "replaceState"]({sb: r, i: idx, sheet: sheet ? 1 : 0}, "", urlOf(r));
  });
  function closeTop(d){
    const ev = new Event("cancel", {cancelable: true});
    d.dispatchEvent(ev);
    if (ev.defaultPrevented) return false;
    try { d.close(); } catch (e) { d.removeAttribute("open"); }
    return true;
  }
  // Keep the sheet entry in step with whether a sheet is open
  function sheets(){
    if (!canRoute || !cur) return;
    const open = modals().length > 0;
    if (open && !sheetOpen) { sheetOpen = true; put(cur, true, true); }
    else if (!open && sheetOpen) { sheetOpen = false; op(() => { skip++; idx = Math.max(0, idx - 1); H.back(); }); }
  }
  function title(){
    const navCur = document.querySelector('nav.tabs .in [aria-current="page"]');
    let t = ui.tab === "archive" ? "Archive" : navCur ? (navCur.textContent || "").replace(/\s+/g, " ").trim() : "";
    try {
      if (ui.tab === "courses" && ui.courseId && state.courses[ui.courseId]) t = state.courses[ui.courseId].name || t;
      else if (ui.tab === "flashcards" && ui.deckId && state.decks && state.decks[ui.deckId]) t = state.decks[ui.deckId].name || t;
      else if (isPlanTab(ui.tab) || ui.tab === "files" || ui.tab === "emails") { const sub = document.querySelector('#view > .pview-tabs [aria-selected="true"]'); if (sub && sub.textContent.trim() && sub.textContent.trim() !== t) t = sub.textContent.trim() + " · " + t; }
    } catch (e) {}
    const want = t ? t + " · Studyboard" : "Studyboard";
    if (document.title !== want) document.title = want;
  }
  function onRender(){
    title();
    if (!canRoute) return;
    const r = route(), k = keyOf(r);
    if (k === curKey) { sheets(); return; }
    const prev = cur; cur = r; curKey = k;
    if (!prev || popping) put(r, false, false);
    else if (sheetOpen) {
      // the page changed under a sheet: the sheet's entry becomes the new page (and a new sheet entry follows if it's still open)
      sheetOpen = false; put(r, false, false);
    } else {
      const same = group(prev.tab) === group(r.tab) && prev.course === r.course && prev.deck === r.deck && prev.grp === r.grp;
      if (!same) op(() => { try { H.replaceState(Object.assign({}, H.state, {y: Math.round(window.scrollY || 0)}), ""); } catch (e) {} });
      put(r, !same, false);
    }
    sheets();
  }
  function go(r, y){
    // from a study group back to the list of groups: the same as its Back button (which also stops listening for the group's updates)
    if (ui.tab === "groups" && r.tab === "groups" && ui.grp && !r.grp) { popping = true; try { fire("act", "grp-back", document.body, ""); } finally { popping = false; } return; }
    ui.tab = KNOWN.includes(r.tab) ? r.tab : "board";
    ui.courseId = r.course && state.courses[r.course] ? r.course : null;
    if (ui.tab === "flashcards") { ui.fc = null; ui.deckId = r.deck && state.decks && state.decks[r.deck] ? r.deck : null; }
    if (ui.tab === "groups") ui.grp = r.grp || null;
    if (isPlanTab(ui.tab)) ui.tlJump = true;
    popping = true;
    try { render(); } finally { popping = false; }
    window.scrollTo(0, Number(y) || 0);
  }
  const fromUrl = () => { try { const q = new URLSearchParams(location.search); return {tab: q.get("view") || "board", course: q.get("course") || "", deck: q.get("deckid") || "", grp: q.get("grp") || ""}; } catch (e) { return null; } };
  if (canRoute) {
    addEventListener("popstate", e => {
      if (skip) { skip--; const w = waiting; waiting = []; w.forEach(f => { try { f(); } catch (x) {} }); return; }
      const st = e.state || {};
      idx = Number(st.i) || 0;
      const r = st.sb || fromUrl();
      const open = modals();
      if (open.length) {
        sheetOpen = false;
        if (!closeTop(open[open.length - 1])) { sheetOpen = true; put(cur, true, true); return; }
        if (r && keyOf(r) !== curKey) go(r, st.y);
        sheets();
        return;
      }
      sheetOpen = false;
      if (st.sheet) { try { H.replaceState(Object.assign({}, st, {sheet: 0}), ""); } catch (x) {} }
      if (r && keyOf(r) !== curKey) go(r, st.y);
    });
    // Sheets opening and closing (any modal dialog)
    try { new MutationObserver(() => sheets()).observe(document.body, {subtree: true, attributes: true, attributeFilter: ["open"]}); } catch (e) {}
    // Other start-up code tidies the address bar (deep links); put the page's own address and entry back
    hook("boot", () => setTimeout(() => { if (!cur) return; const st = H.state; if (!st || !st.sb) op(() => H.replaceState({sb: cur, i: idx, sheet: sheetOpen ? 1 : 0}, "", urlOf(cur))); }, 1500));
  }
  hook("render", onRender);
  // The address's page wins over the remembered one (a link or a refresh)
  function boot(){
    if (!canRoute) return;
    const q = new URLSearchParams(location.search), v = q.get("view");
    if (!v || !KNOWN.includes(v)) return;
    ui.tab = v;
    const c = q.get("course"); ui.courseId = v === "courses" && c && state.courses[c] ? c : null;
    if (v === "flashcards") { const d = q.get("deckid"); ui.deckId = d && state.decks && state.decks[d] ? d : null; }
    if (v === "groups") ui.grp = q.get("grp") || null;
  }
  // Back on an Android phone: close a sheet, else go back a page, else go to the Board; only from the Board does the app close
  function back(){
    const open = modals();
    if (open.length) { if (sheetOpen && canRoute) H.back(); else closeTop(open[open.length - 1]); return true; }
    if (canRoute && idx > 0) { H.back(); return true; }
    if (ui.tab !== "board" || ui.courseId) { ui.tab = "board"; ui.courseId = null; render(); window.scrollTo(0, 0); return true; }
    return false;
  }
  window.SBROUTE = {boot, url: () => cur ? urlOf(cur) : "", depth: () => idx};
  window.SBTOAST = function () { return toast.apply(null, arguments); };
  window.SBBACK = {handle: back};

  /* ================= Keyboard shortcuts ================= */
  const MAC = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent || "");
  const MOD = MAC ? "⌘" : "Ctrl";
  const VIEWS_KEYS = [["board", "Board"], ["plan", "Calendar"], ["flashcards", "Review"], ["notes", "Notes"], ["courses", "Courses"], ["companion", "Companion"], ["groups", "Groups"]];
  const viewName = t => { const b = document.querySelector(`nav.tabs .in [data-tab="${t}"]`); const s = b && (b.textContent || "").replace(/\s+/g, " ").trim(); return s || (VIEWS_KEYS.find(v => v[0] === t) || [t, t])[1]; };
  function goView(t){
    if (dlg.open) dlg.close();
    const b = document.querySelector(`nav.tabs .in [data-tab="${t}"]`);
    if (b) b.click(); else { ui.tab = t; ui.courseId = null; render(); window.scrollTo(0, 0); }
  }
  function newTask(){ if (dlg.open) dlg.close(); taskForm(null, {courseId: (ui.tab === "courses" && ui.courseId) || undefined}); }
  function settings(){ if (dlg.open) dlg.close(); menuSheet(); }
  const typing = t => !!t && t.nodeType === 1 && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || !!(t.closest && t.closest('[role="application"],[contenteditable="true"],[contenteditable=""]')));
  const kbd = s => s.split("+").map(k => `<kbd>${esc(k)}</kbd>`).join("+");
  function helpSheet(){
    const row = (keys, what) => `<tr><th scope="row">${keys.map(kbd).join(" or ")}</th><td>${esc(what)}</td></tr>`;
    const sec = (h, rows) => `<h3 class="kb-h">${esc(h)}</h3><table class="kb-t"><tbody>${rows.join("")}</tbody></table>`;
    openSheet(`<div class="sheet kb-sheet">${head("Keyboard Shortcuts")}<div class="sheet-body">
      <p class="mini" style="margin:0">These work when you're not typing in a box.</p>
      ${sec("Anywhere", [row(["N"], "New task"), row(["C"], "Quick Capture"), row([MOD + "+K"], "Search everything"), row([MOD + "+,"], "Settings"), row([MOD + "+Z"], "Undo the last delete"), row(["?"], "Show this list"), row(["Esc"], "Close a sheet")])}
      ${sec("Go To", VIEWS_KEYS.map(([t], i) => row([String(i + 1), MOD + "+" + (i + 1)], viewName(t))))}
      ${sec("Flashcards", [row(["Space"], "Flip the card"), `<tr><th scope="row">${kbd("1")} to ${kbd("4")}</th><td>Again, Hard, Good or Easy (after flipping)</td></tr>`, row(["Enter"], "Next question in a quiz")])}
      ${sec("Notes", [row(["Arrow keys"], "Move the selected note"), row(["[", "]"], "Turn the selected note"), row([MOD + "+Enter"], "Finish editing a note")])}
    </div><div class="sheet-foot"><span class="spacer"></span><button type="button" class="btn primary" data-act="close">Done</button></div></div>`);
  }
  document.addEventListener("keydown", e => {
    if (e.defaultPrevented || e.isComposing || e.repeat) return;
    if (typing(e.target) || modals().length) return;
    const mod = e.ctrlKey || e.metaKey, m = /^Digit([1-7])$/.exec(e.code || "");
    if (mod && !e.altKey && !e.shiftKey && e.key === ",") { e.preventDefault(); settings(); return; }
    if (mod && !e.altKey && !e.shiftKey && m) { e.preventDefault(); goView(VIEWS_KEYS[Number(m[1]) - 1][0]); return; }
    if (mod || e.altKey) return;
    if (e.key === "?") { e.preventDefault(); helpSheet(); return; }
    if ((e.key === "n" || e.key === "N") && !e.shiftKey) { e.preventDefault(); newTask(); return; }
    if (m && !e.shiftKey && !(ui.tab === "flashcards" && ui.fc)) { e.preventDefault(); goView(VIEWS_KEYS[Number(m[1]) - 1][0]); }
  });
  hook("act", act => {
    if (act === "kbd-help") { if (dlg.open) dlg.close(); setTimeout(helpSheet, 0); return true; }
    if (act === "sync-status") { syncSheet(); return true; }
    if (act === "sync-retry") { if (!syncRetryNow() && typeof initSupabase === "function") initSupabase(true); if (dlg.open) dlg.close(); toast("Trying again…"); return true; }
    return false;
  });
  hook("menu", () => `<button data-act="kbd-help"><span>Keyboard Shortcuts<span class="sub">Press ? to see them all. N adds a task, 1 to 7 switch pages.</span></span></button>`);
  // The desktop app's menu
  hook("desk-action", (a, arg) => {
    if (a === "new-task") newTask();
    else if (a === "view" && VIEWS_KEYS.some(v => v[0] === arg)) goView(arg);
    else if (a === "shortcuts") { if (dlg.open) dlg.close(); helpSheet(); }
  });
  hook("boot", () => {
    document.querySelectorAll("nav.tabs .in [data-tab]").forEach(b => { const i = VIEWS_KEYS.findIndex(v => v[0] === b.dataset.tab); if (i >= 0) b.setAttribute("aria-keyshortcuts", `${i + 1} ${MAC ? "Meta" : "Control"}+${i + 1}`); });
    document.querySelectorAll('[data-act="new-task"]#fab').forEach(b => b.setAttribute("aria-keyshortcuts", "N"));
  });

  /* ================= Sync status ================= */
  function syncSheet(){
    const t = ($("#sync") || {}).textContent || "", n = (() => { try { return Object.keys(outboxGet()).length; } catch (e) { return 0; } })();
    const off = navigator.onLine === false, signedOut = /Not signed in/.test(t);
    const say = off ? "This device is offline. Your changes are saved here and sync when you're back online."
      : signedOut ? "You're signed out, so changes are only kept on this device. Sign in to sync them to your account."
      : /^Not saved/.test(t) ? "Your latest changes are saved on this device but haven't reached your account yet." + (/retrying/.test(t) ? " Studyboard keeps trying on its own." : "")
      : /Saved on this device/.test(t) ? "Your planner is saved on this device only." : t ? `Status: ${t}.` : "";
    openSheet(`<div class="sheet sync-sheet">${head("Sync Status")}<div class="sheet-body">
      <p class="sync-st" data-state="${esc(($("#sync") || {dataset: {}}).dataset.state || "")}"><b>${esc(t || "Saved")}</b></p>
      <p style="margin:0">${esc(say)}</p>
      ${n ? `<p class="mini" style="margin:0">${n} change${n === 1 ? "" : "s"} waiting to sync.</p>` : ""}
    </div><div class="sheet-foot"><button type="button" class="btn" data-act="menu">Open Settings</button><span class="spacer"></span><button type="button" class="btn" data-act="close">Close</button>${signedOut ? `<button type="button" class="btn primary" data-act="sb-signin">Sign In</button>` : `<button type="button" class="btn primary" data-act="sync-retry">Try Again</button>`}</div></div>`);
  }
  // Elements acting as buttons (role="button") work with Enter and Space
  document.addEventListener("keydown", e => {
    const t = e.target;
    if ((e.key !== "Enter" && e.key !== " ") || !t || !t.matches || !t.matches('[role="button"][data-act]:not(button)')) return;
    e.preventDefault(); t.click();
  });

  /* ================= Skip links ================= */
  document.addEventListener("click", e => {
    const a = e.target.closest && e.target.closest("a.skip-link"); if (!a) return;
    e.preventDefault();
    const id = (a.getAttribute("href") || "").slice(1), el = document.getElementById(id); if (!el) return;
    const vis = x => x && x.getClientRects().length > 0;
    const t = el.matches("nav") ? [el.querySelector('[aria-current="page"]'), ...el.querySelectorAll("button,a[href]")].find(vis) : el;
    if (t) { try { t.focus(); } catch (x) {} }
  });

  /* ================= Tooltips =================
     The browser's own title tooltips never show (99-motion-a11y-tz.js). Icon-only controls get a small tooltip with their name instead, on
     devices with a mouse or trackpad, after a short pause or when reached with the keyboard. */
  const hover = mm("(hover: hover) and (pointer: fine)");
  let tip = null, tipFor = null, tipT = 0;
  const tipText = el => {
    if (el.dataset && el.dataset.tip) return el.dataset.tip;
    // icon-only: no visible letters or digits (an icon, or a sign like − or ×)
    if (!el.matches("button,a[href],[role=button],[role=tab]") || /[\p{L}\p{N}]/u.test(el.innerText || "")) return "";
    return (el.getAttribute("aria-label") || "").trim();
  };
  function hideTip(){ clearTimeout(tipT); tipT = 0; tipFor = null; if (tip) { tip.remove(); tip = null; } }
  function showTip(el, text){
    if (!el.isConnected || !el.getClientRects().length) return;
    const host = el.closest("dialog[open]") || document.body;
    tip = document.createElement("div"); tip.className = "sb-tip"; tip.setAttribute("aria-hidden", "true"); tip.textContent = text;
    host.appendChild(tip);
    const r = el.getBoundingClientRect(), w = tip.offsetWidth, h = tip.offsetHeight, gap = 8;
    let top = r.top - h - gap; if (top < 6) top = r.bottom + gap;
    const left = Math.max(6, Math.min(innerWidth - w - 6, r.left + r.width / 2 - w / 2));
    tip.style.left = left + "px"; tip.style.top = top + "px";
  }
  const want = (el, delay) => {
    if (!hover || !hover.matches) return;
    const t = el && tipText(el); if (!t) return;
    hideTip(); tipFor = el; tipT = setTimeout(() => { tipT = 0; if (tipFor === el) showTip(el, t); }, delay);
  };
  document.addEventListener("pointerover", e => {
    if (e.pointerType && e.pointerType !== "mouse") return;
    const el = e.target.closest && e.target.closest("[data-tip],button,a[href],[role=button],[role=tab]");
    if (!el || el === tipFor) return;
    if (tipFor) hideTip();
    want(el, 500);
  }, true);
  document.addEventListener("pointerout", e => { if (tipFor && !(e.relatedTarget && tipFor.contains(e.relatedTarget))) hideTip(); }, true);
  document.addEventListener("focusin", e => { const el = e.target; let fv = false; try { fv = el.matches(":focus-visible"); } catch (x) {} if (fv) want(el, 300); else hideTip(); });
  document.addEventListener("focusout", hideTip);
  ["pointerdown", "keydown", "wheel"].forEach(ev => document.addEventListener(ev, hideTip, true));
  addEventListener("scroll", hideTip, {capture: true, passive: true});
  document.addEventListener("close", hideTip, true);
  hook("render", () => { if (tipFor && !tipFor.isConnected) hideTip(); });
})();
