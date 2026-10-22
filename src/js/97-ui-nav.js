/* ===== module: 97-ui-nav.js ===== */
/* Studyboard 1.11.0: the desktop side menu always fits, with no scrollbar. Module prefix 97-ui.
   The menu has compact levels (data-fit="1" to "4", in 97-ui-nav.css). After any size change this picks the
   roomiest level where everything fits: tighter spacing first, then icon-only tools, then icon-only tabs.
   Every button keeps a tooltip (title) and its aria-label, so nothing is lost when labels are hidden. */
(() => {
  const nav = document.querySelector("nav.tabs");
  if (!nav) return;
  const MAX = 5;
  const wide = () => !!(window.matchMedia && matchMedia("(min-width:980px)").matches);
  const titles = () => nav.querySelectorAll("button").forEach(b => {
    const t = (b.getAttribute("aria-label") || b.textContent || "").replace(/\s+/g, " ").trim();
    if (t && b.title !== t) b.title = t;
  });
  // Let the upper group (Board ... Focus) use spare height: taller buttons and a little more spacing, capped so it
  // never looks stretched, while the tools stay at the bottom. Only room that is really free is used, so no scrollbar.
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
      titles();
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
  if (window.ResizeObserver) { const ro = new ResizeObserver(soon); ro.observe(nav); [...nav.children].forEach(c => ro.observe(c)); }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(soon);
  hook("render", soon);
  hook("boot", soon);
  window.SBUI = Object.assign(window.SBUI || {}, {navFit: () => (fit(), Number(nav.dataset.fit || 0))});
})();


