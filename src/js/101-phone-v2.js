/* ===== module: 101-phone-v2.js ===== */
/* Phones: the page's name in the top bar (with the date over the Board) */
(() => {
  const mqPhone = window.matchMedia ? matchMedia("(max-width:639px)") : null;
  const isPhone = () => mqPhone ? mqPhone.matches : innerWidth < 640;
  const navBtn = t => document.querySelector(`nav.tabs .in [data-tab="${t}"]`);
  const label = t => { const b = navBtn(t); return b ? b.textContent.trim() : ""; };
  const norm = x => String(x || "").replace(/\s+/g, " ").trim().toLowerCase();
  function titleBox(){
    let el = document.getElementById("phTitle");
    if (!el) {
      const host = document.querySelector("header.top .top-row > div:first-child"); if (!host) return null;
      el = document.createElement("div"); el.id = "phTitle"; el.className = "ph-title"; el.setAttribute("aria-hidden", "true");
      el.innerHTML = `<span class="ph-k"></span><span class="ph-t"></span>`;
      host.appendChild(el);
    }
    return el;
  }
  function update(){
    try {
      const el = titleBox(); if (!el) return;
      const tab = (typeof ui !== "undefined" && ui.tab) || "board";
      const cur = document.querySelector('nav.tabs .in [aria-current="page"]');
      // the tab's name without its count badge
      const navName = b => { const c = b.cloneNode(true); c.querySelectorAll(".grp-dot,.fc-navdue,.nm-dot").forEach(x => x.remove()); return c.textContent.trim(); };
      const t = tab === "archive" ? "Archive" : (cur && navName(cur)) || label(tab) || (tab.charAt(0).toUpperCase() + tab.slice(1));
      const k = tab === "board" ? (document.getElementById("todayLabel") || {}).textContent || "" : "";
      el.querySelector(".ph-t").textContent = t;
      el.classList.toggle("ph-long", t.length > 8);
      el.querySelector(".ph-k").textContent = k.trim();
      el.querySelector(".ph-k").hidden = !k.trim();
      const view = document.getElementById("view"); if (!view) return;
      if (isPhone() && (tab === "notes" || tab === "groups") && !view.querySelector(":scope > .pview-tabs")) {
        const pill = document.createElement("div"); pill.className = "pview-tabs ph-solo"; pill.setAttribute("role", "heading"); pill.setAttribute("aria-level", "2");
        pill.innerHTML = `<span class="ph-solo-t"></span>`; pill.firstChild.textContent = t;
        view.insertBefore(pill, view.firstChild);
      }
      const sel = view.querySelector(":scope > .pview-tabs [aria-selected=true], :scope > .pview-tabs.ph-solo > .ph-solo-t");
      const same = new Set([norm(t), sel ? norm(sel.textContent) : "", tab === "courses" ? "your courses" : "", tab === "flashcards" ? "your decks" : "", tab === "flashcards" ? "your quizzes" : "", "study " + norm(t)].filter(Boolean));
      const selT = sel ? norm(sel.textContent) : "";
      view.querySelectorAll(":scope > .view-head > h2, :scope > .tl-controls > h2, :scope > * > .view-head > h2").forEach(h => { const x = norm(h.textContent); h.classList.toggle("ph-dup", same.has(x) || (!!selT && x.startsWith(selT + " "))); });
      view.querySelectorAll(":scope > .view-head, :scope > section > .view-head").forEach(v => { const h = v.querySelector(":scope > h2.ph-dup"), rest = [...v.children].filter(c => c !== h); v.classList.toggle("ph-btns", !!h && rest.length > 0 && rest.length <= 3 && rest.every(c => c.matches("button.btn"))); });
      const row = view.querySelector(":scope > .cf-row");
      if (row && isPhone()) view.querySelectorAll(":scope > .view-head.ph-btns").forEach(v => {
        const box = document.createElement("div"); box.className = "cf-acts";
        [...v.children].filter(c => c.matches("button.btn")).forEach(b => box.appendChild(b));
        row.appendChild(box); v.classList.remove("ph-btns"); v.classList.add("ph-moved");
      });
      const nav = view.querySelector(":scope > .view-head .sch-nav");
      if (nav && isPhone() && !nav.querySelector(".ph-more")) {
        const btns = [...nav.children].filter(c => c.matches(".btn"));
        if (btns.length) {
          const n = btns.reduce((k, b) => k + (Number((b.querySelector(".sch-ntc-n") || {}).textContent) || 0), 0);
          const d = document.createElement("details"); d.className = "ph-more";
          d.innerHTML = `<summary class="btn small" aria-label="Options${n ? `, ${n} notice${n === 1 ? "" : "s"}` : ""}"><span>Options</span>${n ? `<span class="bn-n" aria-hidden="true">${n}</span>` : ""}<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></summary><div class="ph-menu" role="menu"></div>`;
          const m = d.querySelector(".ph-menu"); btns.forEach(b => { b.setAttribute("role", "menuitem"); m.appendChild(b); });
          nav.appendChild(d); nav.closest(".view-head").classList.add("ph-sch");
        }
      }
      const tree = view.querySelector(":scope > .fwrap > .ftree"), ft = view.querySelector(":scope > .tl-controls.f-title");
      if (tree && isPhone() && !view.querySelector(":scope > .f-row")) {
        const nodes = [...tree.querySelectorAll(".fnode")], cur = tree.querySelector(".fnode.on") || nodes[0];
        const nm = b => ((b.querySelector(".fn-name") || b).textContent || "").trim(), cnt = b => ((b.querySelector(".n") || {}).textContent || "").trim();
        const depth = b => { const g = b.closest(".fgroup"); return g && g.querySelector(".fnode") !== b ? 1 : 0; };
        const row = document.createElement("div"); row.className = "cf-row f-row";
        row.innerHTML = `<label class="cf-pick on"><span class="cf-l"></span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg><select data-f-pick aria-label="Folder"></select></label>`;
        row.querySelector(".cf-l").textContent = cur ? nm(cur) : "All Files";
        const sel = row.querySelector("select");
        nodes.forEach((b, i) => { const o = document.createElement("option"); o.value = String(i); o.textContent = "\u2003".repeat(depth(b)) + nm(b) + (cnt(b) ? ` (${cnt(b)})` : ""); if (b === cur) o.selected = true; sel.appendChild(o); });
        sel.addEventListener("change", () => { const b = nodes[Number(sel.value)]; if (b) b.click(); });
        if (ft) [...ft.children].filter(c => c.matches(".cl-btn, [data-act='trash-open'], .trash-btn")).forEach(c => { c.classList.add("ph-ic"); row.appendChild(c); });
        const sort = ft && ft.querySelector(":scope > .segb"); if (sort) row.appendChild(sort);
        view.insertBefore(row, view.querySelector(":scope > .fwrap"));
        if (ft) ft.classList.add("ph-moved");
        tree.classList.add("ph-moved");
      }
      const rvh = view.querySelector(":scope > .view-head"), rcf = view.querySelector(":scope > .cf-row");
      if (rvh && rcf && isPhone() && !rcf.querySelector(".cf-acts")) {
        const tbs = [...rvh.children].filter(c => c.matches(".trash-btn"));
        if (tbs.length) {
          const box = document.createElement("div"); box.className = "cf-acts";
          const rest = [...rvh.children].filter(c => !c.matches("h2, .trash-btn") && c.getClientRects().length);
          if (rest.length === 1) box.appendChild(rest[0]);
          tbs.forEach(b => box.appendChild(b)); rcf.appendChild(box);
          rvh.classList.add("ph-fill");
          if (![...rvh.children].some(c => !c.matches("h2") && c.getClientRects().length)) rvh.classList.add("ph-moved");
        }
      }
      const nbr = view.querySelector(":scope > .nb-row"), ntc = view.querySelector(":scope > .tl-controls");
      if (nbr && ntc && isPhone() && !nbr.querySelector(".cf-acts")) {
        const box = document.createElement("div"); box.className = "cf-acts cf-acts-wide";
        [...ntc.children].filter(c => !c.matches("h2")).forEach(c => box.appendChild(c));
        if (box.children.length) { nbr.appendChild(box); ntc.classList.add("ph-moved"); }
      }
      const tc = view.querySelector(":scope > .tl-controls:has(> .segb)");
      if (row && tc && isPhone() && !row.querySelector(".cf-acts")) {
        const box = document.createElement("div"); box.className = "cf-acts cf-acts-wide";
        [...tc.children].filter(c => !c.matches("h2, .segb")).forEach(c => box.appendChild(c));
        if (box.children.length) row.appendChild(box);
      }
    } catch (e) {}
  }
  // The nav shape and the bar colour only change with the layout, theme or skin: measured once per frame, and only when one of those changed
  let raf = 0, seatSig = "", tintSig = "";
  const sig = () => { const r = document.documentElement; return [isPhone(), r.dataset.theme || "", r.dataset.skin || "", r.dataset.hc || "", r.dataset.ts || "", (document.getElementById("skinCss") || {textContent: ""}).textContent.length].join("|"); };
  function later(force){
    if (force) { seatSig = ""; tintSig = ""; }
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      const s = sig(), nav = document.querySelector("nav.tabs");
      const seat = s + "|" + (nav ? nav.dataset.fit || "" : "") + "|" + (document.querySelector('nav.tabs .in [data-tab="companion"]') ? 1 : 0);
      if (seat !== seatSig) { seatSig = seat; seatCut(); }
      if (s !== tintSig) { tintSig = s; barTint(); }
    });
  }
  hook("render", () => { update(); fitChat(); later(false); });
  // Phones: iOS paints the strip behind the clock and battery in the page's theme colour
  function barTint(){
    const m = document.querySelector('meta[name="theme-color"]'); if (!m) return;
    const probe = document.createElement("i"); probe.style.cssText = "position:absolute;width:0;height:0;color:var(" + (isPhone() ? "--paper" : "--spine") + ")";
    document.body.appendChild(probe); const c = getComputedStyle(probe).color; probe.remove();
    if (c && m.getAttribute("content") !== c) m.setAttribute("content", c);
  }
  window.SBBARTINT = barTint;
  try { const mq = matchMedia("(prefers-color-scheme: dark)"); (mq.addEventListener ? mq.addEventListener("change", () => setTimeout(barTint, 50)) : mq.addListener(() => setTimeout(barTint, 50))); } catch (e) {}
  // The tabs either side of the companion's seat
  function seatCut(){
    const nav = document.querySelector("nav.tabs"), comp = document.querySelector('nav.tabs .in [data-tab="companion"]'); if (!nav) return;
    const fresh = [];
    [["flashcards", "--ph-selm-l"], ["notes", "--ph-selm-r"]].forEach(([t, k]) => {
      const b = document.querySelector(`nav.tabs .in [data-tab="${t}"]`); if (!b || !isPhone() || !comp) return;
      const br = b.getBoundingClientRect(), cr = comp.getBoundingClientRect(); if (!br.width || !cr.width) return;
      const w = br.width, h = br.height, right = cr.left > br.left;
      const cx = right ? cr.left + cr.width / 2 - br.left : br.right - (cr.left + cr.width / 2), cy = cr.top - 16 + 28 - br.top;
      const R = 36, f = 6, r = 14, n = v => Math.round(v * 100) / 100;
      const x1 = cx - Math.sqrt((R + f) ** 2 - (cy - f) ** 2);
      const y2 = cy + Math.sqrt(Math.max(0, (R + f) ** 2 - (w - f - cx) ** 2));
      if (!(x1 > r) || !(y2 < h - 2)) return;
      const on = (px, py) => [cx + (px - cx) * R / (R + f), cy + (py - cy) * R / (R + f)];
      const [t1x, t1y] = on(x1, f), [t2x, t2y] = on(w - f, y2), r2 = Math.min(r, h - y2);
      const d = `M${r} 0H${n(x1)}A${f} ${f} 0 0 1 ${n(t1x)} ${n(t1y)}A${R} ${R} 0 0 0 ${n(t2x)} ${n(t2y)}A${f} ${f} 0 0 1 ${n(w)} ${n(y2)}V${n(h - r2)}A${n(r2)} ${n(r2)} 0 0 1 ${n(w - r2)} ${n(h)}H${r}A${r} ${r} 0 0 1 0 ${n(h - r)}V${r}A${r} ${r} 0 0 1 ${r} 0Z`;
      const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${n(w)} ${n(h)}' preserveAspectRatio='none'><path d='${d}'${right ? "" : ` transform='translate(${n(w)} 0) scale(-1 1)'`}/></svg>`;
      fresh.push([k, `url("data:image/svg+xml,${encodeURIComponent(svg)}")`]);
    });
    if (fresh.length === 2) { fresh.forEach(([k, v]) => { if (nav.style.getPropertyValue(k) !== v) nav.style.setProperty(k, v); }); nav.classList.add("ph-seatcut"); }
    else nav.classList.remove("ph-seatcut");
  }
  hook("boot", () => setTimeout(() => { update(); fitChat(); later(true); }, 0));
  // Companion chat on a phone
  function fitChat(){
    const root = document.documentElement, view = document.getElementById("view");
    const on = !!view && isPhone() && typeof ui !== "undefined" && ui.tab === "companion" && !!view.querySelector(".cpt-log");
    root.classList.toggle("ph-lock", on);
    if (!on) { if (view && view.style.height) view.style.height = ""; return; }
    if (scrollY) scrollTo(0, 0);
    const vv = window.visualViewport, vh = vv ? vv.height : innerHeight, nav = document.querySelector("nav.tabs");
    const nr = nav && getComputedStyle(nav).display !== "none" ? nav.getBoundingClientRect() : null, navTop = nr && nr.height ? nr.top : innerHeight;
    const bottom = Math.min(navTop - 12, vh - 8), top = view.getBoundingClientRect().top;
    view.style.height = Math.max(200, Math.floor(bottom - top)) + "px";
  }
  if (window.visualViewport) { visualViewport.addEventListener("resize", fitChat); visualViewport.addEventListener("scroll", () => { if (root().classList.contains("ph-lock") && scrollY) scrollTo(0, 0); }); }
  const root = () => document.documentElement;
  // An Options menu closes after a choice, or a tap anywhere else
  document.addEventListener("click", e => {
    document.querySelectorAll("details.ph-more[open]").forEach(d => { if (!d.contains(e.target) || e.target.closest(".ph-menu .btn")) d.open = false; });
  });
  // The phone course filter (see chipsHtml)
  document.addEventListener("change", e => { const s = e.target; if (!s || !s.matches || !s.matches("select[data-course-filter]")) return; ui.filter = s.value || "all"; render(); });
  // The phone note board dropdown
  document.addEventListener("change", e => {
    const s = e.target; if (!s || !s.matches || !s.matches("select[data-nb-pick]")) return;
    const b = s.value === "__new" ? document.querySelector('.nb-boards [data-act="nb-new"]') : [...document.querySelectorAll('.nb-boards [data-act="nb-pick"]')].find(x => (x.dataset.id || "") === s.value);
    if (b) b.click();
    if (s.value === "__new") setTimeout(() => { try { render(); } catch (x) {} }, 0);
  });
  let wasPhone = isPhone();
  addEventListener("resize", () => { if (isPhone() !== wasPhone) { wasPhone = isPhone(); scheduleRender(); } else update(); fitChat(); later(true); });

})();

