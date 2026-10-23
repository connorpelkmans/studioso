/* ===== module: 97-ui-nav.js ===== */
/* Studyboard 1.11.0 */
(() => {
  const nav = document.querySelector("nav.tabs");
  if (!nav) return;
  const MAX = 5;
  const wide = () => !!(window.matchMedia && matchMedia("(min-width:980px)").matches);
  // Let the upper group (Board ... Focus) use spare height
  const KEEP = 28, CAP_H = 12, CAP_G = 4;
  function stretch(lvl){
    nav.style.removeProperty("--nb-min"); nav.style.removeProperty("--nb-g");
    const inn = nav.querySelector(".in"), foot = nav.querySelector(".nav-foot");
    if (!inn || !foot) return;
    const btns = [...inn.children].filter(b => b.offsetParent);
    if (btns.length < 2) return;
    const spare = foot.getBoundingClientRect().top - inn.getBoundingClientRect().bottom - KEEP;
    if (spare <= 4) return;
    const per = Math.min(CAP_H + CAP_G, spare / btns.length);
    const g = Math.min(CAP_G, per * .25), h = Math.min(CAP_H, per - g);
    const tab = btns.find(b => b.dataset.tab) || btns[0];
    const h0 = tab.getBoundingClientRect().height;
    nav.style.setProperty("--nb-min", (h0 + h).toFixed(1) + "px");
    nav.style.setProperty("--nb-g", g.toFixed(1) + "px");
    if (nav.scrollHeight > nav.clientHeight + 1) { nav.style.removeProperty("--nb-min"); nav.style.removeProperty("--nb-g"); }
  }
  let busy = false;
  function fit(){
    if (busy) return;
    busy = true;
    try {
      if (!wide()) { if (nav.dataset.fit) delete nav.dataset.fit; nav.style.removeProperty("--nb-min"); nav.style.removeProperty("--nb-g"); return; }
      let lvl = 0;
      nav.style.removeProperty("--nb-min"); nav.style.removeProperty("--nb-g");
      nav.dataset.fit = "0";
      while (nav.scrollHeight > nav.clientHeight + 1 && lvl < MAX) nav.dataset.fit = String(++lvl);
      stretch(lvl);
    } finally { busy = false; }
  }
  let raf = 0;
  const soon = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; fit(); }); };
  fit();
  window.addEventListener("resize", soon);
  // Fit in the same frame as the change, so the menu never shows a squeezed or scrolling state
  if (window.ResizeObserver) { const ro = new ResizeObserver(() => fit()); ro.observe(nav); [...nav.children].forEach(c => ro.observe(c)); }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(soon);
  hook("render", () => fit());
  hook("boot", soon);
  window.SBUI = Object.assign(window.SBUI || {}, {navFit: () => (fit(), Number(nav.dataset.fit || 0))});
})();


