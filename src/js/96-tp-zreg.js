/* ===== module: 96-tp-zreg.js ===== */
/* Theme Collections */
(() => {
  const PIN_BOX = {
    badge: "top:-6px;left:50%;width:28px;height:28px;margin-left:-14px",
    tape: "top:-12px;left:50%;width:86px;height:26px;margin-left:-43px;transform:rotate(-3deg)",
    clip: "top:-16px;left:22px;width:20px;height:46px;margin:0"
  };
  const css = [];
  const byTheme = {};
  const themeName = id => { const s = SKINS.find(x => x.id === id); return s ? s.name : id; };
  TP_DATA.forEach(t => {
    if (!t || !t.theme || byTheme[t.theme]) return;
    const rec = byTheme[t.theme] = {theme: t.theme, pack: "", pins: [], card: ""};
    if (t.pack && t.pack.items) {
      const pid = "tp-" + t.theme;
      STICKER_PACKS.push({id: pid, name: t.pack.name, tier: themeTier(t.theme), theme: t.theme, items: t.pack.items});
      Object.entries(t.pack.items).forEach(([k, svg]) => { STICKERS[k] = {svg, pack: pid}; });
      rec.pack = pid;
    }
    (t.pins || []).forEach(p => {
      if (!p || !p.id || PIN_SVG[p.id]) return;
      PIN_SVG[p.id] = p.svg;
      PINS.push({id: p.id, name: p.name, tier: themeTier(t.theme), desc: p.desc || "", theme: t.theme});
      PIN_KIND[p.id] = PIN_BOX[p.kind] ? p.kind : "badge";
      css.push(`.pin.pk-${p.id}{${PIN_BOX[p.kind] || PIN_BOX.badge};background:none;box-shadow:none;border-radius:0;filter:drop-shadow(0 2px 2px rgba(0,0,0,.3))}`);
      rec.pins.push(p.id);
    });
    if (t.card && t.card.id) { CARD_STYLES.push({id: t.card.id, name: t.card.name, tier: themeTier(t.theme), desc: t.card.desc || "", theme: t.theme}); rec.card = t.card.id; }
  });
  if (css.length) { const st = document.createElement("style"); st.id = "tpPins"; st.textContent = css.join("\n"); document.head.appendChild(st); }
  // Read live: hidden themes (20-scenes-visible.js) are out of SKINS
  const tpOrder = () => SKINS.filter(s => byTheme[s.id]).map(s => s.id);
  const curTheme = () => document.documentElement.dataset.skin || effSkinId() || "";
  // The theme you're using comes first, then the rest in Style Shop order
  const ordered = () => { const c = curTheme(); return byTheme[c] ? [c].concat(tpOrder().filter(x => x !== c)) : tpOrder().slice(); };
  const isTP = x => !!(x && x.theme);

  // Run a function with the theme items taken out of a list
  function without(list, fn, keep){
    const saved = list.slice();
    const kept = saved.filter(x => !isTP(x) || (keep && keep(x)));
    list.length = 0; kept.forEach(x => list.push(x));
    try { return fn(); } finally { list.length = 0; saved.forEach(x => list.push(x)); }
  }

  /* Style Shop: a Theme Collections section on the Flashcards, Pins and Stickers tabs */
  const origShop = styleShop;
  styleShop = function(tab){
    const t = tab || ui.shopTab || "themes";
    const kind = t === "cards" ? "card" : t === "pins" ? "pin" : t === "stickers" ? "sticker" : "";
    if (!kind) return origShop.apply(this, arguments);
    const list = kind === "card" ? CARD_STYLES : kind === "pin" ? PINS : STICKER_PACKS;
    const nowId = kind === "card" ? cardStyleOf(null) : kind === "pin" ? notePinOf(null) : "";
    const r = without(list, () => origShop.apply(this, arguments), nowId ? x => x.id === nowId : null);
    try { addCollections(kind); } catch(e) { console.warn("theme collections", e); }
    return r;
  };
  // The Theme Collections items for one Style Shop tab, as HTML
  function rowsHtml(kind){
    const cfg = styleCfg();
    const btn = (k, id, cur, label) => !owns(k, id) ? `<button type="button" class="btn small" data-act="shop-unlock" data-kind="${k}" data-id="${id}">🔒 Unlock</button>` : cur ? `<button type="button" class="btn small" disabled>In Use</button>` : `<button type="button" class="btn small primary" data-act="shop-use" data-kind="${k}" data-id="${id}">${label || "Use"}</button>`;
    const c = curTheme();
    const eyebrow = th => `<span class="tp-eyebrow">${esc(themeName(th))}${th === c ? `<span class="tp-now">Your Theme</span>` : ""}</span>`;
    if (kind === "card") {
      return `<div class="shop-grid">${ordered().filter(th => byTheme[th].card).map(th => { const it = CARD_STYLES.find(x => x.id === byTheme[th].card);
        return `<div class="shop-tile tp-tile ${cardStyleOf(null) === it.id ? "on" : ""}" data-theme="${th}">${eyebrow(th)}<div class="cs-demo cs-${it.id}"><span class="face"><span class="face-label">Front</span><span class="face-text">Mitochondria</span></span></div><div class="shop-name"><b>${esc(it.name)}</b>${PRO_BADGE}</div><p class="mini">${esc(it.desc)}</p>${btn("card", it.id, cardStyleOf(null) === it.id, "Use for All Decks")}</div>`; }).join("")}</div>`;
    }
    if (kind === "pin") {
      return `<div class="shop-grid">${ordered().flatMap(th => byTheme[th].pins.map((pid, i) => { const it = PINS.find(x => x.id === pid); const on = notePinOf(null) === pid && !(cfg.pinAuto === true && themeKit());
        return `<div class="shop-tile tp-tile ${on ? "on" : ""}" data-theme="${th}">${eyebrow(th)}${noteDemo(noteShapeOf(null), pid, i + 1)}<div class="shop-name"><b>${esc(it.name)}</b>${PRO_BADGE}</div><p class="mini">${esc(it.desc)}</p>${btn("pin", pid, on, "Use for Notes")}</div>`; })).join("")}</div>`;
    }
    return ordered().filter(th => byTheme[th].pack).map(th => { const p = STICKER_PACKS.find(x => x.id === byTheme[th].pack);
      return `<div class="shop-pack tp-pack" data-theme="${th}">${eyebrow(th)}<div class="shop-name"><b>${esc(p.name)}</b><span class="mini">${Object.keys(p.items).length} stickers</span>${owns("sticker", p.id) ? "" : `<button type="button" class="btn small" data-act="shop-unlock" data-kind="sticker" data-id="${p.id}">🔒 Unlock</button>`}</div>${window.SBUI && SBUI.stkGrid ? SBUI.stkGrid(Object.keys(p.items)) : `<div class="pack-grid">${Object.keys(p.items).map(stkCell).join("")}</div>`}</div>`; }).join("");
  }
  // A sticker in the shop
  const stkCell = k => window.SBUI && SBUI.stkCell ? SBUI.stkCell(k) : `<span class="stk-cell">${stickerSvg(k)}</span>`;
  // Adds the Theme Collections section
  function addCollections(kind){
    const body = dlg.querySelector(".shop .sheet-body"); if (!body) return;
    const what = kind === "card" ? "a flashcard style" : kind === "pin" ? "two pins" : "a sticker pack";
    const count = kind === "card" ? tpOrder().filter(th => byTheme[th].card).length : kind === "pin" ? tpOrder().reduce((n, th) => n + byTheme[th].pins.length, 0) : tpOrder().filter(th => byTheme[th].pack).length;
    const sec = document.createElement("div");
    sec.className = "tp-sec";
    sec.dataset.count = count;
    sec.innerHTML = `<h3 class="fsec shop-sec">${PRO_BADGE} Theme Collections</h3><p class="mini" style="margin:0 0 6px">Every scene theme has ${what} of its own. They work with any theme.</p>`;
    const box = document.createElement("div"); box.className = "tp-rows";
    sec.appendChild(box);
    sec.tpFill = () => { if (box.dataset.done) return; box.dataset.done = "1"; box.innerHTML = rowsHtml(kind); };
    body.appendChild(sec);
    if (!(window.SBUI && window.SBUI.lazyShop)) sec.tpFill();
  }

  /* Sticker envelope */
  const origEnv = envelopeHtml;
  envelopeHtml = function(){
    if (!ui.stkPack) { const c = curTheme(); if (byTheme[c] && byTheme[c].pack) ui.stkPack = byTheme[c].pack; }
    const cur = STICKER_PACKS.find(p => p.id === ui.stkPack);
    let html = without(STICKER_PACKS, () => origEnv.apply(this, arguments), p => p === cur);
    const chosen = cur && isTP(cur) ? cur : null, chev = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>`;
    const dot = th => { const sk = SKINS.find(x => x.id === th), c = sk && sk.light ? sk.light[8] : (sk && sk.swatch) || "#C9975A"; return `<i class="env-tp-dot" style="background:${esc(String(c))}"></i>`; };
    const opts = ordered().filter(th => byTheme[th].pack).map(th => { const p = STICKER_PACKS.find(x => x.id === byTheme[th].pack); if (!p) return "";
      return `<button type="button" role="option" class="env-tp-opt${p === cur ? " on" : ""}" data-id="${esc(p.id)}" aria-selected="${p === cur}">${dot(th)}<span class="env-tp-tx"><b>${esc(themeName(th))}</b><small>${esc(p.name)}</small></span>${p === cur ? `<svg class="env-tp-ck" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>` : ""}</button>`; }).join("");
    const chosenTh = chosen ? ordered().find(th => byTheme[th].pack === chosen.id) : "";
    const pick = `<div class="env-tp"><span id="envTpLbl">Theme Packs</span><button type="button" class="env-tp-btn" aria-haspopup="listbox" aria-expanded="false" aria-labelledby="envTpLbl envTpCur">${chosenTh ? dot(chosenTh) : ""}<span id="envTpCur" class="env-tp-cur">${chosen ? esc(themeName(chosenTh)) : "Choose a theme…"}</span>${chev}</button><div class="env-tp-list" role="listbox" aria-label="Theme sticker packs" hidden>${opts}</div></div>`;
    if (cur && isTP(cur)) html = html.replace(new RegExp(`<button type="button" data-act="stk-pack" data-id="${cur.id}"[\\s\\S]*?</button>`), "");
    return html.replace(`<div class="env-name">`, pick + `<div class="env-name">`);
  };
  // The theme pack list floats over everything
  let tpIsOpen = false;
  const tpClose = () => { if (!tpIsOpen) return; tpIsOpen = false; $$(".env-tp-list").forEach(l => { if (!l.hidden) { l.hidden = true; const b = l.parentNode && l.parentNode.querySelector(".env-tp-btn"); if (b) b.setAttribute("aria-expanded", "false"); } }); };
  const tpOpen = btn => {
    const list = btn.parentNode.querySelector(".env-tp-list"); if (!list) return;
    const r = btn.getBoundingClientRect(), w = Math.max(r.width, 270), room = innerHeight - r.bottom - 12, up = room < 240 && r.top > room;
    list.hidden = false; tpIsOpen = true; btn.setAttribute("aria-expanded", "true");
    Object.assign(list.style, {position: "fixed", width: w + "px", left: Math.max(8, Math.min(r.left, innerWidth - w - 8)) + "px", maxHeight: Math.max(180, Math.min(380, (up ? r.top : innerHeight - r.bottom) - 16)) + "px", top: up ? "" : (r.bottom + 6) + "px", bottom: up ? (innerHeight - r.top + 6) + "px" : ""});
    const on = list.querySelector(".env-tp-opt.on") || list.querySelector(".env-tp-opt"); if (on) { on.scrollIntoView({block: "nearest"}); on.focus({preventScroll: true}); }
  };
  document.addEventListener("click", e => {
    const t = e.target && e.target.closest ? e.target : null; if (!t) return;
    const btn = t.closest(".env-tp-btn"), opt = t.closest(".env-tp-opt");
    if (btn) { const open = btn.getAttribute("aria-expanded") === "true"; tpClose(); if (!open) tpOpen(btn); return; }
    if (opt) { tpClose(); ui.stkPack = opt.dataset.id; scheduleRender(); return; }
    if (!t.closest(".env-tp-list")) tpClose();
  });
  document.addEventListener("keydown", e => {
    const list = e.target && e.target.closest ? e.target.closest(".env-tp-list") : null;
    if (e.key === "Escape" && $$(".env-tp-list").some(l => !l.hidden)) { e.preventDefault(); e.stopPropagation(); tpClose(); const b = document.querySelector(".env-tp-btn"); if (b) b.focus(); return; }
    if (!list || (e.key !== "ArrowDown" && e.key !== "ArrowUp")) return;
    e.preventDefault(); const all = [...list.querySelectorAll(".env-tp-opt")], i = all.indexOf(document.activeElement);
    const n = all[Math.max(0, Math.min(all.length - 1, i + (e.key === "ArrowDown" ? 1 : -1)))]; if (n) n.focus();
  }, true);
  addEventListener("resize", tpClose);
  document.addEventListener("scroll", e => { if (!(e.target && e.target.closest && e.target.closest(".env-tp-list"))) tpClose(); }, true);

  /* Note editor: pins grouped by theme */
  hook("render", () => {
    $$("select.note-pin").forEach(sel => {
      if (sel.dataset.tp) return; sel.dataset.tp = "1";
      const tpOpts = [...sel.options].filter(o => { const p = PINS.find(x => x.id === o.value); return p && isTP(p); });
      if (!tpOpts.length) return;
      const groups = {};
      tpOpts.forEach(o => { const th = PINS.find(x => x.id === o.value).theme; (groups[th] = groups[th] || []).push(o); o.remove(); });
      ordered().forEach(th => { if (!groups[th]) return; const g = document.createElement("optgroup"); g.label = themeName(th); groups[th].forEach(o => g.appendChild(o)); sel.appendChild(g); });
    });
  });

  /* The Theme Collection card styles (bundle/tp.css, about 650 KB) load only when a page or sheet shows one: the decks, a deck or a study
     session in one of them, or the Style Shop. A device that uses one remembers it, so the next start loads them with the page. */
  const TPCSS = "tp.css", TPKEY = "studyboard:tpcss";
  let tpWait = null;
  const tpHere = () => !!document.querySelector(`[data-lazy="${TPCSS}"]`);
  function tpCss(){
    if (tpWait) return tpWait;
    const have = document.querySelector(`[data-lazy="${TPCSS}"]`), url = (window.SB_LAZY || {}).tpcss;
    if ((have && (have.tagName === "STYLE" || have.sheet)) || !url) return (tpWait = Promise.resolve(!!have));
    const root = document.documentElement;
    root.classList.add("tpcss-loading");
    tpWait = new Promise(res => {
      const l = have || Object.assign(document.createElement("link"), {rel: "stylesheet", href: url});
      l.dataset.lazy = TPCSS;
      const done = ok => { root.classList.remove("tpcss-loading"); if (!ok) { l.remove(); tpWait = null; } res(ok); };
      l.addEventListener("load", () => done(true), {once: true});
      l.addEventListener("error", () => done(false), {once: true});
      if (!have) document.head.appendChild(l);
    });
    return tpWait;
  }
  const tpUsed = () => { try { return /^tp-/.test(cardStyleOf(null)) || Object.values(state.decks || {}).some(d => d && /^tp-/.test(d.cardStyle || "")); } catch (e) { return false; } };
  let tpMark = null;
  function tpCheck(scope){
    const used = tpUsed();
    if (used !== tpMark) { tpMark = used; try { if (used) localStorage.setItem(TPKEY, "1"); else localStorage.removeItem(TPKEY); } catch (e) {} }
    if (used || (scope && scope.querySelector('[class*="cs-tp-"]'))) tpCss();
  }
  hook("render", () => tpCheck(document.getElementById("view")));
  const origSheet = openSheet;
  openSheet = function(){ const r = origSheet.apply(this, arguments); try { tpCheck(dlg); } catch (e) {} return r; };
  // The Style Shop's Flashcards tab lists every card style
  const origShop2 = styleShop;
  styleShop = function(){ tpCss(); return origShop2.apply(this, arguments); };

  // For previews and tests
  window.SBTPCSS = {load: tpCss, loaded: tpHere};
  window.SBTP = {
    themes: () => tpOrder().slice(), pinHtml, shopRows: rowsHtml, pinIds: () => PINS.map(x => x.id),
    ordered,
    rec: th => byTheme[th] || null,
    count: () => ({themes: tpOrder().length, stickers: tpOrder().reduce((n, th) => n + (byTheme[th].pack ? Object.keys(STICKER_PACKS.find(p => p.id === byTheme[th].pack).items).length : 0), 0), pins: tpOrder().reduce((n, th) => n + byTheme[th].pins.length, 0), cards: tpOrder().filter(th => byTheme[th].card).length}),
    gallery(ids, opts){
      const o = opts || {};
      const list = (ids && ids.length ? ids : tpOrder()).filter(th => byTheme[th]);
      document.querySelectorAll("#tpGallery").forEach(x => x.remove());
      const g = document.createElement("div"); g.id = "tpGallery";
      g.innerHTML = list.map(th => { const rec = byTheme[th], p = STICKER_PACKS.find(x => x.id === rec.pack), cs = CARD_STYLES.find(x => x.id === rec.card);
        return `<section class="tpg-row"><h2>${esc(themeName(th))} <small>${th}${p ? " · " + esc(p.name) : ""}${cs ? " · card: " + esc(cs.name) : ""}</small></h2>
          <div class="tpg-stk">${p ? Object.keys(p.items).map(k => `<figure><span class="env-stk">${stickerSvg(k)}</span><figcaption>${k}</figcaption></figure>`).join("") : "<em>no stickers</em>"}</div>
          <div class="tpg-more"><div class="tpg-pins">${rec.pins.map((pid, i) => `<figure>${noteDemo(i ? "rounded" : "classic", pid, i + 2, p ? Object.keys(p.items)[i * 3] : "")}<figcaption>${esc((PINS.find(x => x.id === pid) || {}).name || pid)}</figcaption></figure>`).join("")}</div>
          ${cs ? `<div class="tpg-cards"><button class="flip cs-${cs.id}" type="button"><span class="flip-inner"><span class="face front" style="backface-visibility:visible"><span class="face-label">Front</span><span class="face-text">What does the RAAS do when blood pressure drops?</span><span class="face-hint">Tap or press Space to flip</span></span></span></button>
            <button class="flip cs-${cs.id}" type="button"><span class="flip-inner"><span class="face back" style="transform:none;backface-visibility:visible"><span class="face-label">Back</span><span class="face-text">Renin release leads to angiotensin II, which constricts vessels and triggers aldosterone to retain sodium and water.</span><span class="face-hint">RAAS</span></span></span></button></div>` : ""}</div></section>`; }).join("");
      if (o.dark) g.classList.add("tpg-dark");
      document.body.appendChild(g);
      return g;
    }
  };
})();


