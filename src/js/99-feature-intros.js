/* ===== module: 99-feature-intros.js ===== */
/* New for you: once a week, starting a week after someone starts using Studyboard, a short popup introduces one feature
   they haven't tried yet: the Focus Timer, then Whiteboards, then Concept Maps. One a week at most, never over another
   sheet, never before the welcome setup is done, and a feature they already use is skipped. Try It opens the feature. */
(() => {
  const K_START = "studyboard:introAt", K_SEEN = "studyboard:introSeen", WEEK = 7 * 864e5;
  const ls = (k, v) => { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) {} return null; };
  const seen = () => { try { return JSON.parse(ls(K_SEEN) || "{}") || {}; } catch (e) { return {}; } };
  const svg = p => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
  const FEATURES = [
    {id: "focus", color: "#E5533D", title: "Meet the Focus Timer",
      icon: () => (typeof TOMATO !== "undefined" ? TOMATO : svg('<circle cx="12" cy="13" r="8"/><path d="M12 9v4l3 2"/>')),
      lead: "Short bursts of focused work with breaks in between, the Pomodoro way.",
      points: ["Pick a task and press play: 25 minutes of focus, then a 5 minute break", "Time you focus counts toward that task, so Today's Plan knows what's left", "Choose a routine, like Deep Work or Exam Cram, or make your own"],
      // ever finished a focus session (the synced stats, else this device's count)
      used: () => { try { return (typeof SBSTATS !== "undefined" && SBSTATS.focusSessions() > 0) || (typeof pomo !== "undefined" && !!pomo && pomo.sessions > 0); } catch (e) { return false; } },
      go: () => { const b = document.createElement("button"); b.dataset.act = "pomo-open"; b.hidden = true; document.body.appendChild(b); b.click(); b.remove(); }},
    {id: "whiteboard", color: "#0E9AA7", title: "Try a Whiteboard",
      icon: () => svg('<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21l4-4 4 4M7 13l3-3 2 2 4-4"/>'),
      lead: "A big board to sketch, write and plan on, with markers, shapes and sticky notes.",
      points: ["Draw out a problem, a diagram or a study plan", "Start blank or from a template, one board per course or topic", "Share with your study group"],
      // ever made a whiteboard and drawn on it
      used: () => { try { return Object.values(state.notes || {}).some(n => n && n.wb && ((n.wbInk || []).length || (n.wbItems || []).length)); } catch (e) { return false; } },
      go: () => { ui.tab = "notes"; ui.notesView = "wb"; try { localStorage.setItem("studyboard:notesView", "wb"); } catch (e) {} render(); window.scrollTo(0, 0); }},
    {id: "maps", color: "#7C3AED", title: "See It All With Concept Maps",
      icon: () => svg('<rect x="2.5" y="10" width="7" height="5" rx="2.5"/><rect x="14.5" y="4" width="7" height="5" rx="2.5"/><rect x="14.5" y="15" width="7" height="5" rx="2.5"/><path d="M9.5 12.5c2.5 0 2.5-6 5-6M9.5 12.5c2.5 0 2.5 5 5 5"/>'),
      lead: "Map how a course fits together, from the notes, decks and exam topics you've already linked.",
      points: ["Studyboard builds a first map for you, ready to rearrange", "Link ideas to cards, notes and lecture moments", "Quiz yourself by hiding labels and filling them back in"],
      // ever made a concept map or added an idea to one
      used: () => { try { const has = x => !!x && typeof x === "object" && ((x.add || []).length > 0); return Object.values(state.courses || {}).some(c => c && ((Array.isArray(c.maps) && c.maps.length) || has(c.cmap))) || Object.values(state.tasks || {}).some(t => t && has(t.cmap)); } catch (e) { return false; } },
      go: () => { ui.tab = "flashcards"; ui.rvView = "maps"; render(); window.scrollTo(0, 0); }}
  ];
  // The one due now: week n after the start brings the nth feature not seen yet (skipping ones already in use)
  function due(now){
    const t = now || Date.now(), start = Number(ls(K_START)) || 0; if (!start) return null;
    const s = seen(), weeks = Math.floor((t - start) / WEEK);
    // each popup shown uses up a week (a feature already in use is skipped without one), and a week passes between popups
    const shownAt = Object.values(s).filter(x => x && x.at).map(x => x.at), last = shownAt.length ? Math.max(...shownAt) : 0;
    if (last && t - last < WEEK - 3600e3) return null;
    if (weeks < shownAt.length + 1) return null;
    for (const f of FEATURES) {
      if (s[f.id]) continue;
      if (f.used()) { s[f.id] = {skipped: true}; ls(K_SEEN, JSON.stringify(s)); continue; }
      return f;
    }
    return null;
  }
  function html(f, i){
    return `<div class="sheet fi-sheet" style="--fc:${f.color}">
      <div class="fi-hero"><button type="button" class="icon-btn fi-x" data-fi="later" aria-label="Close">${svg('<path d="M6 6l12 12M18 6L6 18"/>')}</button><span class="fi-ic">${f.icon()}</span></div>
      <div class="sheet-body fi-body">
        <span class="fi-eyebrow">New for You</span>
        <h2 class="fi-t">${esc(f.title)}</h2>
        <p class="fi-lead">${esc(f.lead)}</p>
        <ul class="fi-pts">${f.points.map(p => `<li><span class="fi-tick" aria-hidden="true">${svg('<path d="M5 12.5l4.2 4.2L19 7"/>')}</span><span>${esc(p)}</span></li>`).join("")}</ul>
      </div>
      <div class="sheet-foot"><button type="button" class="btn" data-fi="later">Maybe Later</button><span class="spacer"></span><button type="button" class="btn primary fi-go" data-fi="go">Try It</button></div></div>`;
  }
  function show(f){
    const i = FEATURES.indexOf(f), s = seen(); s[f.id] = {at: Date.now()}; ls(K_SEEN, JSON.stringify(s));
    openSheet(html(f, i));
    const sheet = dlg.querySelector(".fi-sheet"); if (!sheet) return;
    sheet.addEventListener("click", e => {
      const b = e.target.closest("[data-fi]"); if (!b) return;
      e.preventDefault(); dlg.close();
      if (b.dataset.fi === "go") setTimeout(() => { try { f.go(); } catch (x) { console.warn(x); } }, 60);
    });
    const go = sheet.querySelector(".fi-go"); if (go) try { go.focus({preventScroll: true}); } catch (e) {}
  }
  // Quietly, a little after the app opens and only when nothing else is open
  let tries = 0;
  function check(){
    if (!ls("sb:onboarded") && !ls("studyboard:tour")) return;
    if (!ls(K_START)) { ls(K_START, String(Date.now())); return; }
    if (dlg.open || document.querySelector("dialog[open]") || (window.SBTOUR && SBTOUR.active())) { if (++tries < 6) setTimeout(check, 20000); return; }
    const f = due(); if (f) show(f);
  }
  hook("boot", () => setTimeout(check, 8000));
  window.SBINTROS = {due, show: id => { const f = FEATURES.find(x => x.id === id); if (f) show(f); }, list: () => FEATURES.map(f => f.id)};

  const css = document.createElement("style");
  css.textContent = `
dialog:has(> .fi-sheet){width:min(440px,calc(100% - 32px))!important;max-width:440px!important}
.fi-sheet{width:100%;overflow:hidden}
.fi-hero{position:relative;display:grid;place-items:center;height:150px;background:radial-gradient(120% 120% at 50% 0%,color-mix(in srgb,var(--fc) 34%,var(--surface)),color-mix(in srgb,var(--fc) 12%,var(--surface)) 70%)}
.fi-hero::before,.fi-hero::after{content:"";position:absolute;border-radius:50%;background:color-mix(in srgb,var(--fc) 18%,transparent)}
.fi-hero::before{width:120px;height:120px;left:-30px;top:-40px}.fi-hero::after{width:90px;height:90px;right:-20px;bottom:-30px}
.fi-ic{position:relative;z-index:1;display:grid;place-items:center;width:84px;height:84px;border-radius:26px;background:var(--surface);color:var(--fc);box-shadow:0 10px 26px color-mix(in srgb,var(--fc) 30%,transparent)}
.fi-ic svg{width:44px!important;height:44px!important}
.fi-x{position:absolute;top:12px;right:12px;z-index:2;background:color-mix(in srgb,var(--surface) 80%,transparent)!important}
.fi-body{display:grid;gap:8px;padding:18px 22px 6px!important;text-align:center;justify-items:center}
.fi-eyebrow{font:800 .72rem/1 var(--display);letter-spacing:.1em;text-transform:uppercase;color:var(--fc)}
.fi-t{margin:2px 0 0;font:800 1.45rem/1.2 var(--display)}
.fi-lead{margin:0;color:var(--muted);max-width:34ch}
.fi-pts{list-style:none;margin:8px 0 0;padding:0;display:grid;gap:9px;text-align:left;width:100%}
.fi-pts li{display:flex;gap:10px;align-items:flex-start;padding:10px 12px;border-radius:12px;background:color-mix(in srgb,var(--fc) 7%,var(--surface));font-size:.92rem}
.fi-tick{flex:none;display:grid;place-items:center;width:22px;height:22px;border-radius:50%;background:var(--fc);color:#fff;margin-top:1px}
.fi-tick svg{width:14px;height:14px;stroke-width:3}
.fi-sheet .sheet-foot .fi-go{background:var(--fc)!important;border-color:var(--fc)!important;color:#fff!important;min-width:120px}
`;
  document.head.appendChild(css);
})();
