/* ===== module: 97-groups-nudge.js ===== */
/* Study Groups, easier to find on phones and tablets */
(() => {
  const KEY = "studyboard:grpNudge", SNOOZE = 21 * 864e5, MAX_SNOOZES = 3;
  const rd = () => { try { return JSON.parse(localStorage.getItem(KEY) || "null") || {}; } catch (e) { return {}; } };
  const wr = patch => { try { localStorage.setItem(KEY, JSON.stringify(Object.assign(rd(), patch))); } catch (e) {} };
  /*NUDGE-START*/
  // Pure rule: should the card show
  function showCard(s, ctx){
    s = s || {};
    if (s.never || ctx.unavailable || ctx.banner) return false;
    if (ctx.groups == null || ctx.groups > 0) return false;
    if (ctx.tasks < 3) return false;
    if (s.snooze && ctx.now < s.snooze) return false;
    return true;
  }
  /*NUDGE-END*/

  const ICON_MORE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="5.5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="18.5" cy="12" r="1.4"/></svg>';
  const ICON_PPL = '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5"/><path d="M16 5.2a3 3 0 0 1 0 5.6M18 14.8c2 .7 3.2 2.5 3.2 5.2"/></svg>';

  /* More in the bottom bar */
  function addMore(){
    const inn = $("nav.tabs .in"); if (!inn || $(".nav-more", inn)) return;
    const b = document.createElement("button");
    b.type = "button"; b.className = "nav-more"; b.dataset.act = "more-open";
    b.setAttribute("aria-haspopup", "dialog");
    b.innerHTML = ICON_MORE + `<span class="nm-l"></span>`;
    inn.insertBefore(b, $("#navPomo", inn) || null);
    label();
  }
  function label(){
    const b = $("nav.tabs .nav-more"); if (!b) return;
    const n = $('nav.tabs [data-tab="groups"] .grp-dot') ? 1 : 0;
    const l = tr("more.label", "More");
    $(".nm-l", b).textContent = l;
    b.setAttribute("aria-label", n ? tr("more.aria.dot", "More, with study group updates") : tr("more.aria", "More: Study Groups, Files, Grades and Settings"));
    let dot = $(".nm-dot", b);
    if (n && !dot) { dot = document.createElement("span"); dot.className = "nm-dot"; dot.setAttribute("aria-hidden", "true"); b.appendChild(dot); }
    else if (!n && dot) dot.remove();
    b.setAttribute("aria-current", ui.tab === "groups" ? "page" : "false");
  }
  const inBar = () => !!(window.matchMedia && matchMedia("(max-width:979px)").matches);

  function moreSheet(){
    const row = (act, title, sub) => `<button type="button" data-act="${act}"><span>${esc(title)}<span class="sub">${esc(sub)}</span></span></button>`;
    openSheet(`<div class="sheet more-sheet">${head(tr("more.title", "More"))}<div class="sheet-body"><div class="menu-list">
      ${row("more-go-groups", tr("more.groups", "Study Groups"), tr("more.groups.sub", "Share decks and deadlines, plan sessions with friends"))}
      ${row("more-go-files", tr("more.files", "Files"), tr("more.files.sub", "Your course files and documents"))}
      ${row("g-grades", tr("more.grades", "Grades"), tr("more.grades.sub", "Your marks and what you need on the rest"))}
      ${row("menu", tr("more.settings", "Settings"), tr("more.settings.sub", "Backups, text size, themes and more"))}
    </div></div></div>`);
    const b = $("nav.tabs .nav-more"); if (b) b.setAttribute("aria-expanded", "true");
    dlg.addEventListener("close", () => {
      const m = $("nav.tabs .nav-more"); if (!m) return;
      m.setAttribute("aria-expanded", "false");
      if (!document.activeElement || document.activeElement === document.body) { try { m.focus(); } catch (e) {} }
    }, {once: true});
  }

  /* Board card */
  let probed = null, probing = null;
  const stub = () => window.__sbGroupsStub || null;
  const accountId = () => { const s = stub(); return s ? (s.user && s.user.id) || "stub" : (typeof sbUser !== "undefined" && sbUser ? sbUser.id : ""); };
  const signedIn = () => !!(stub() || (typeof sbActive === "function" && sbActive()));
  function groupCount(){
    if (!signedIn()) return 0;
    const k = window.SBGROUPS && SBGROUPS.known(); if (k != null) return k;
    const id = accountId();
    if (probed && probed.id === id && (probed.n != null || Date.now() - probed.at < 60000)) return probed.n;
    if (!probing && window.SBGROUPS) {
      probing = SBGROUPS.probe().then(n => { probed = {id, n: n == null ? null : n, at: Date.now()}; if (n === 0) scheduleRender(); }).catch(() => { probed = {id, n: null, at: Date.now()}; }).then(() => { probing = null; });
    }
    return null;
  }
  const cardHtml = () => {
    const out = !signedIn();
    return `<section class="gn-card" aria-label="${esc(tr("nudge.aria", "Study with a friend"))}">
      <span class="gn-ic">${ICON_PPL}</span>
      <div class="gn-body"><h3>${esc(tr("nudge.title", "Study with a Friend"))}</h3>
        <p>${esc(tr("nudge.body", "Share decks and deadlines and plan sessions together."))}${out ? " " + esc(tr("nudge.out", "It's free. Sign in first.")) : ""}</p></div>
      <div class="gn-acts"><button type="button" class="btn small primary" data-act="gn-open">${esc(out ? tr("nudge.open.out", "See Study Groups") : tr("nudge.open", "Open Study Groups"))}</button><button type="button" class="btn small" data-act="gn-later">${esc(tr("nudge.later", "Not Now"))}</button><button type="button" class="link-btn" data-act="gn-never">${esc(tr("nudge.never", "Don't Show Again"))}</button></div>
    </section>`;
  };
  const origBoard = viewBoard;
  viewBoard = function(){
    const html = origBoard.apply(this, arguments);
    try {
      const preview = typeof inPreview === "function" && inPreview();
      const ctx = {now: Date.now(), tasks: tasksArr().length, groups: preview ? 0 : groupCount(), banner: html.indexOf("rw-banner") >= 0, unavailable: preview};
      if (!showCard(rd(), ctx)) return html;
      const k = html.indexOf('<div class="qa-wrap">');
      return k >= 0 ? html.slice(0, k) + cardHtml() + html.slice(k) : cardHtml() + html;
    } catch (e) { console.warn("groups nudge", e); return html; }
  };
  const dismiss = patch => {
    wr(patch);
    const c = $(".gn-card"); if (c) c.remove();
    const q = $(".qa-wrap input, #quickAdd"); if (q) { try { q.focus({preventScroll: true}); } catch (e) {} }
  };

  hook("act", (act, el) => {
    switch (act) {
      case "more-open": moreSheet(); return true;
      case "more-go-groups": if (dlg.open) dlg.close(); ui.tab = "groups"; ui.grp = null; ui.courseId = null; render(); window.scrollTo(0, 0); return true;
      case "more-go-files": if (dlg.open) dlg.close(); ui.tab = "files"; ui.courseId = null; render(); window.scrollTo(0, 0); return true;
      case "gn-open": wr({snooze: Date.now() + 60 * 864e5}); ui.tab = "groups"; ui.grp = null; render(); window.scrollTo(0, 0); return true;
      case "gn-later": { const s = rd(), n = (s.count || 0) + 1; dismiss(n >= MAX_SNOOZES ? {never: true, count: n} : {snooze: Date.now() + SNOOZE, count: n}); toast(tr("nudge.toast.later", "Okay. You can find Study Groups in the Groups tab any time.")); return true; }
      case "gn-never": dismiss({never: true}); toast(tr("nudge.toast.never", "Got it. You can find Study Groups in the Groups tab any time.")); return true;
    }
    return false;
  });
  hook("render", () => { addMore(); label(); });
  hook("boot", () => { addMore(); label(); });
  hook("lang", () => label());
  window.SBGNUDGE = {showCard, state: rd, inBar};
})();

