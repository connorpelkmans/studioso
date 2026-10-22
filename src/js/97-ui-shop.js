/* ===== module: 97-ui-shop.js ===== */
/* Studyboard 1.11.0: an easier Style Shop. Module prefix 97-ui.
   Wraps styleShop (after the scenes and Theme Collections modules have added their parts) and adds:
   filter chips per tab, collapsible sections with counts, compact tiles, a sticky tab bar, a Collections tab
   (each scene theme's stickers, pins and flashcard style together), and remembers the tab, filters and open sections.
   Every buy and use button keeps its data-act (shop-use, shop-unlock), so other modules can route them. */
(() => {
  const KEY = "studyboard:shop";
  let S = {};
  try { S = JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (e) { S = {}; }
  S.f = S.f && typeof S.f === "object" ? S.f : {};
  S.c = S.c && typeof S.c === "object" ? S.c : {};
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };
  window.SBUI = Object.assign(window.SBUI || {}, {lazyShop: true});
  if (!ui.shopTab && S.tab) ui.shopTab = S.tab;

  const CHEV = `<svg class="ui-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>`;
  // The order of the filters and of the sections under them (Your Photos and Free come first)
  const GROUPS = [["scenes", "Scenes"], ["majors", "Fields"], ["holidays", "Holidays"], ["seasons", "Seasons"], ["world", "World"], ["hobby", "Hobbies"], ["ideas", "New Ideas"]];
  const CHIPS = {
    themes: [["all", "All"], ["free", "Free"]].concat(GROUPS),
    collections: [["all", "All"]].concat(GROUPS),
    cards: [["all", "All"], ["free", "Free"], ["pro", "Pro"], ["collections", "Theme Collections"]],
    notes: [["all", "All"], ["free", "Free"], ["pro", "Pro"]],
    pins: [["all", "All"], ["free", "Free"], ["pro", "Pro"], ["collections", "Theme Collections"]],
    stickers: [["all", "All"], ["free", "Free"], ["pro", "Pro"], ["collections", "Theme Collections"]]
  };
  const skinGroup = s => ({plain: "free", world: "world", ideas: "ideas", season: "seasons", pro: "scenes", newscenes: "scenes", majors: "majors", hobby: "hobby", holiday: "holidays"})[(s && s.group) || "plain"] || "scenes";
  // Where a theme sits in the Style Shop (its section in the order above, then its place in the catalogue), so other lists can follow it
  window.SBUI.themeRank = id => { const i = SKINS.findIndex(x => x.id === id); if (i < 0) return 1e6; const g = skinGroup(SKINS[i]), k = g === "free" ? -1 : GROUPS.findIndex(x => x[0] === g); return (k < 0 ? 99 : k + 1) * 1e4 + i; };
  const secKind = (tab, title, tp) => {
    if (tp) return "collections";
    const t = title.toLowerCase();
    if (tab === "themes") return /plain/.test(t) ? "free" : /around the world/.test(t) ? "world" : /idea/.test(t) ? "ideas" : /season/.test(t) ? "seasons" : /field/.test(t) ? "majors" : /hobb|cozy/.test(t) ? "hobby" : /holiday/.test(t) ? "holidays" : "scenes";
    return /^\s*free/.test(t) ? "free" : /^\s*all pins/.test(t) ? "mixed" : "pro";
  };
  const slug = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  let openCol = "";   // the collection card that's showing everything (kept across re-renders)

  /* The picture caches live in their own small database, so their writes never hold up the app's own storage */
  let cdb = null;
  const cacheDb = () => cdb || (cdb = new Promise((res, rej) => { try { const r = indexedDB.open("studyboard-ui-cache", 1); r.onupgradeneeded = () => r.result.createObjectStore("c"); r.onsuccess = () => { const d = r.result; d.onversionchange = () => { try { d.close(); } catch (e) {} cdb = null; }; res(d); }; r.onerror = () => rej(r.error); } catch (e) { rej(e); } }));
  const cacheGet = async k => { const db = await cacheDb(); return new Promise(res => { const t = db.transaction("c").objectStore("c").get(k); t.onsuccess = () => res(t.result); t.onerror = () => res(null); }); };
  const cacheSet = async (k, v) => { const db = await cacheDb(); return new Promise(res => { const t = db.transaction("c", "readwrite"); t.objectStore("c").put(v, k); t.oncomplete = () => res(true); t.onerror = () => res(false); }); };

  /* ---------- Stickers as cached bitmaps ----------
     A sticker used to be a live inline SVG with five CSS drop-shadows (the white die-cut edge and the shadow), and the
     browser redrew every visible sticker on every scroll frame (about 100 ms a frame on a slow laptop). Now each
     sticker is drawn once: its SVG, with the same edge and shadow baked in as an SVG filter, is rasterised on a canvas
     at this screen's pixel density and kept as a PNG (in memory, and in IndexedDB so it's done once per device).
     The shop shows those PNGs as plain <img>s, which scroll like photos. Stickers with words stay inline SVG (an image
     can't use the app's font), with the same baked filter and no CSS filter. */
  const STK_PAD = 8, BOX = 64 + 2 * STK_PAD;
  const stkFilter = id => `<filter id="${id}" x="-30%" y="-30%" width="160%" height="160%" color-interpolation-filters="sRGB"><feFlood flood-color="#fff" result="w"/>` +
    [[1.72, 0], [-1.72, 0], [0, 1.72], [0, -1.72]].map(([dx, dy], i) => `<feOffset in="${i ? "m" + i : "SourceGraphic"}" dx="${dx}" dy="${dy}" result="o${i + 1}"/><feComposite in="w" in2="o${i + 1}" operator="in" result="c${i + 1}"/><feMerge result="m${i + 1}"><feMergeNode in="c${i + 1}"/><feMergeNode in="${i ? "m" + i : "SourceGraphic"}"/></feMerge>`).join("") +
    `<feGaussianBlur in="m4" stdDeviation="1.85" result="b"/><feOffset in="b" dy="2.46" result="bo"/><feFlood flood-color="#000" flood-opacity=".25"/><feComposite in2="bo" operator="in" result="sh"/><feMerge><feMergeNode in="sh"/><feMergeNode in="m4"/></feMerge></filter>`;
  const stkSvg = (k, id, px) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-STK_PAD} ${-STK_PAD} ${BOX} ${BOX}"${px ? ` width="${px}" height="${px}"` : ""} aria-hidden="true"><defs>${stkFilter(id)}</defs><g filter="url(#${id})">${STICKERS[k].svg}</g></svg>`;
  const isText = k => /<text/.test(STICKERS[k].svg);
  const hashOf = k => { const t = STICKERS[k].svg + "|v1"; let h = 5381; for (let i = 0; i < t.length; i++) h = (Math.imul(h, 33) ^ t.charCodeAt(i)) >>> 0; return h.toString(36); };
  // bitmap size: the shop shows a sticker (with its edge) at up to about 76 CSS px
  const needPx = () => Math.round(76 * Math.min(3, Math.max(1, window.devicePixelRatio || 1)));
  const BMP = new Map();      // k -> {px, h, blob, url}
  const LIVE = new Map();     // k -> inline html for stickers with words
  const IDB_KEY = "studyboard:stkBitmaps:v1";
  let loaded = null, queue = [], pumping = false, dirty = false, saveT = 0, readyRes = null;
  const ready = new Promise(r => { readyRes = r; });
  const esc1 = k => (window.CSS && CSS.escape) ? CSS.escape(k) : String(k).replace(/"/g, '\\"');
  function load(){
    if (!loaded) loaded = (async () => {
      let st = null; try { st = await cacheGet(IDB_KEY); } catch (e) {}
      const px = needPx();
      if (st && typeof st === "object") Object.entries(st).forEach(([k, v]) => { if (STICKERS[k] && v && v.blob && v.px >= px && v.h === hashOf(k) && !BMP.has(k)) { BMP.set(k, Object.assign({url: URL.createObjectURL(v.blob)}, v)); swap(k); } });
    })();
    return loaded;
  }
  const swap = k => { const b = BMP.get(k); if (b) document.querySelectorAll(`img[data-stk="${esc1(k)}"]`).forEach(i => { if (i.getAttribute("src") !== b.url) i.src = b.url; i.classList.remove("ui-wait"); }); };
  async function raster(k){
    const px = needPx();
    const img = new Image();
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(stkSvg(k, "o", px));
    await img.decode();
    const c = document.createElement("canvas"); c.width = c.height = px;
    c.getContext("2d").drawImage(img, 0, 0, px, px);
    const blob = await new Promise(r => c.toBlob(r, "image/png"));
    if (!blob) return;
    BMP.set(k, {px, h: hashOf(k), blob, url: URL.createObjectURL(blob)});
    dirty = true; swap(k);
  }
  function persist(){
    clearTimeout(saveT);
    saveT = setTimeout(() => { if (!dirty) return; dirty = false; const o = {}; BMP.forEach((v, k) => { o[k] = {px: v.px, h: v.h, blob: v.blob}; }); cacheSet(IDB_KEY, o).catch(() => {}); }, queue.length ? 8000 : 1500);
  }
  function want(keys, front){
    const todo = keys.filter(k => STICKERS[k] && !isText(k) && !BMP.has(k) && (front || !queue.includes(k)));
    if (!todo.length) return;
    queue = front ? todo.concat(queue.filter(k => !todo.includes(k))) : queue.concat(todo);
    pump();
  }
  async function pump(){
    if (pumping) return; pumping = true;
    try {
      await load();
      while (queue.length) {
        const t0 = performance.now();
        // a few stickers per slice, then give the page a turn
        while (queue.length && performance.now() - t0 < 12) { const k = queue.shift(); if (!BMP.has(k)) { try { await raster(k); } catch (e) { BMP.set(k, {px: 0, url: "data:image/svg+xml;charset=utf-8," + encodeURIComponent(stkSvg(k, "o"))}); swap(k); } } }
        persist();
        await new Promise(r => (window.requestIdleCallback ? requestIdleCallback(r) : setTimeout(r, 50)));
      }
    } finally { pumping = false; if (!queue.length && readyRes) readyRes(true); }
  }
  // Warm the cache quietly after start-up, so the shop is quick the first time too
  // (Waits for the page to be quiet, so a first visit's start-up and first taps never compete with it.)
  hook("boot", () => setTimeout(() => {
    const warm = () => {
      const all = Object.keys(STICKERS);
      const cur = (window.SBTP && SBTP.rec && SBTP.rec(styleCfg().skin)) || null;
      const first = cur && cur.pack ? Object.keys((STICKER_PACKS.find(p => p.id === cur.pack) || {items: {}}).items) : [];
      load().then(() => want(first.concat(all)));
    };
    if (window.requestIdleCallback) requestIdleCallback(warm, {timeout: 20000}); else warm();
  }, 6000));
  function stkCell(k){
    if (!STICKERS[k]) return "";
    if (isText(k)) {
      if (!LIVE.has(k)) LIVE.set(k, `<span class="stk-cell ui-stk ui-stk-live">${stkSvg(k, "uiso-" + String(k).replace(/[^a-z0-9_-]/gi, ""))}</span>`);
      return LIVE.get(k);
    }
    const b = BMP.get(k);
    if (!b) want([k]);
    return `<span class="stk-cell ui-stk"><img data-stk="${esc(k)}" ${b ? `src="${b.url}"` : `class="ui-wait"`} alt="" draggable="false" loading="lazy"></span>`;
  }
  // A pack's grid of stickers, filled in just before it scrolls into view (so a long list opens quickly)
  const stkGrid = (keys, cls) => `<div class="pack-grid ${cls || ""}" data-stks="${esc(keys.join(" "))}" style="min-height:${keys.length > 6 ? 112 : 54}px"></div>`;
  let io = null;
  function fillGrid(g){ if (!g.dataset.stks) return; const ks = g.dataset.stks.split(" ").filter(Boolean); g.removeAttribute("data-stks"); g.style.minHeight = ""; g.innerHTML = ks.map(stkCell).join(""); bump(g); }
  function lazyGrids(root){
    const grids = root.querySelectorAll(".pack-grid[data-stks], .ui-col-stk[data-stks]"); if (!grids.length) return;
    const scroller = root.closest(".sheet-body") || dlg.querySelector(".sheet-body");
    if (!window.IntersectionObserver || !scroller) { grids.forEach(fillGrid); return; }
    if (!io || io.root !== scroller) { if (io) io.disconnect(); io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { io.unobserve(e.target); fillGrid(e.target); } }), {root: scroller, rootMargin: "700px 0px"}); }
    grids.forEach(g => io.observe(g));
    // then quietly fill the rest in idle time, top to bottom, so scrolling later has nothing left to do
    const idle = window.requestIdleCallback || (f => setTimeout(() => f({timeRemaining: () => 8}), 30));
    const rest = () => idle(d => {
      const left = [...root.querySelectorAll(".pack-grid[data-stks], .ui-col-stk[data-stks]")].filter(g => g.offsetParent);
      if (!left.length || !root.isConnected) return;
      while (left.length && d.timeRemaining() > 4) { const g = left.shift(); io && io.unobserve(g); fillGrid(g); }
      rest();
    });
    rest();
  }
  // Newly drawn cells that are still waiting move to the front of the queue (top of the page first)
  const bump = root => { const ks = [...root.querySelectorAll("img.ui-wait[data-stk]")].map(i => i.dataset.stk); if (ks.length) want(ks, true); };
  window.SBUI = Object.assign(window.SBUI, {stkCell, stkGrid, stkKeys: () => Object.keys(STICKERS), stkInner: k => STICKERS[k] ? STICKERS[k].svg : "", stkOriginal: k => stickerSvg(k), stkReady: () => (want(Object.keys(STICKERS)), ready), stkBitmaps: () => BMP.size});

  /* ---------- Theme previews as cached bitmaps ----------
     Scene previews in the shop are big SVG pictures; the browser parsed each one again every time the shop was
     drawn (about a second of work for the Themes tab on a slow laptop). The first time a preview is needed it's
     rasterised once to a PNG at this screen's pixel density, kept in memory and IndexedDB, and the shop uses that. */
  const TH_KEY = "studyboard:thumbBitmaps:v1", TH = new Map(); // "id:l" -> {px, h, blob, url}
  let thLoaded = null, thQueue = [], thPumping = false, thDirty = false, thSaveT = 0;
  const thPx = () => Math.min(640, Math.round(320 * Math.min(3, Math.max(1, window.devicePixelRatio || 1))));
  const hashText = t => { let h = 5381; for (let i = 0; i < t.length; i++) h = (Math.imul(h, 33) ^ t.charCodeAt(i)) >>> 0; return h.toString(36) + ":" + t.length; };
  const thSrc = new Map();   // "id:l" -> the original SVG url, and its text hash once known
  function thLoad(){
    if (!thLoaded) thLoaded = (async () => { let st = null; try { st = await cacheGet(TH_KEY); } catch (e) {} thLoaded.store = st && typeof st === "object" ? st : {}; })();
    return thLoaded;
  }
  async function thRaster(key){
    const src = thSrc.get(key); if (!src || TH.has(key)) return;
    let text = ""; try { text = await (await fetch(src.url)).text(); } catch (e) {}
    const h = text ? hashText(text) : "", px = thPx(), saved = (thLoaded && thLoaded.store || {})[key];
    if (h && saved && saved.blob && saved.h === h && saved.px >= px) { TH.set(key, Object.assign({url: URL.createObjectURL(saved.blob)}, saved)); thSwap(key); return; }
    const img = new Image(); img.src = src.url; await img.decode();
    const c = document.createElement("canvas"); c.width = px; c.height = Math.round(px * (img.naturalHeight || 400) / (img.naturalWidth || 640));
    c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
    const blob = await new Promise(r => c.toBlob(r, "image/png")); if (!blob) return;
    TH.set(key, {px, h, blob, url: URL.createObjectURL(blob)}); thDirty = true; thSwap(key);
  }
  const thSwap = key => { const t = TH.get(key), src = thSrc.get(key); if (t && src) document.querySelectorAll(`img[src="${esc1(src.url)}"]`).forEach(i => { i.src = t.url; }); };
  // One preview per idle moment, and only while the Style Shop is open, so it never competes with other work
  const shopOpen = () => !!(dlg.open && dlg.querySelector(".sheet.shop"));
  async function thPump(){
    if (thPumping) return; thPumping = true;
    try {
      await thLoad();
      while (thQueue.length && shopOpen()) {
        await new Promise(r => (window.requestIdleCallback ? requestIdleCallback(r) : setTimeout(r, 50)));
        if (!shopOpen()) break;
        const k = thQueue.shift(); if (!k) break;
        try { await thRaster(k); } catch (e) { TH.set(k, {px: 0, url: thSrc.get(k).url}); }
        clearTimeout(thSaveT); thSaveT = setTimeout(() => { if (!thDirty) return; thDirty = false; const o = {}; TH.forEach((v, k) => { if (v.blob) o[k] = {px: v.px, h: v.h, blob: v.blob}; }); cacheSet(TH_KEY, o).catch(() => {}); }, thQueue.length ? 8000 : 2000);
      }
    } finally { thPumping = false; }
  }
  const origThumb = artThumb;
  artThumb = function(id, dark){
    const h = origThumb.apply(this, arguments);
    const sk = SKINS.find(x => x.id === id);
    if (!sk || sk.photo || !/^(world|ideas|season|pro|newscenes|majors|hobby|holiday)$/.test(sk.group || "")) return h;   // only the built-in scene art
    const m = h && h.match(/<img[^>]*\ssrc="([^"]+)"/); if (!m || !/^(blob:|data:image\/svg)/.test(m[1])) return h;
    const key = id + (dark ? ":d" : ":l");
    if (!thSrc.has(key) || thSrc.get(key).url !== m[1]) { thSrc.set(key, {url: m[1]}); TH.delete(key); }
    const t = TH.get(key);
    if (t) return h.replace(m[1], t.url).replace("<img ", '<img loading="lazy" ');
    if (!thQueue.includes(key)) { thQueue.push(key); thPump(); }
    return h;
  };
  window.SBUI = Object.assign(window.SBUI, {thumbReady: async () => { await thLoad(); SKINS.filter(s => !s.photo).forEach(s => { artThumb(s.id, false); artThumb(s.id, true); }); while (thQueue.length) { const k = thQueue.shift(); try { await thRaster(k); } catch (e) {} } return TH.size; }});

  // The Stickers tab, drawn here (with cached sticker images) instead of by the app
  const STK_INTRO = "Stickers live in the envelope beside your Notes board. Drag one onto a note and it moves with the note. Drag it off to remove it, or tap it to resize.";
  function stickersHtml(){
    const packs = STICKER_PACKS.filter(p => !p.theme);
    const pack = p => `<div class="shop-pack"><div class="shop-name"><b>${esc(p.name)}</b><span class="mini">${Object.keys(p.items).length} stickers</span>${owns("sticker", p.id) ? "" : `<button type="button" class="btn small" data-act="shop-unlock" data-kind="sticker" data-id="${p.id}">🔒 Unlock</button>`}</div>${stkGrid(Object.keys(p.items))}</div>`;
    return `<p class="mini" style="margin:0">${STK_INTRO}</p>` + [["free", "Free"], ["pro", `${PRO_BADGE} Pro`]].map(([t, l]) => `<h3 class="fsec shop-sec">${l}</h3>${packs.filter(p => p.tier === t).map(pack).join("")}`).join("");
  }
  function addStickerCollections(body){
    const T = window.SBTP; if (!T || !T.shopRows) return;
    const sec = document.createElement("div");
    sec.className = "tp-sec"; sec.dataset.count = T.themes().filter(th => (T.rec(th) || {}).pack).length;
    sec.innerHTML = `<h3 class="fsec shop-sec">${PRO_BADGE} Theme Collections</h3><p class="mini" style="margin:0 0 6px">Every scene theme has a sticker pack of its own. They work with any theme.</p><div class="tp-rows"></div>`;
    const box = sec.querySelector(".tp-rows");
    sec.tpFill = () => { if (box.dataset.done) return; box.dataset.done = "1"; box.innerHTML = T.shopRows("sticker"); };
    body.appendChild(sec);
  }

  const origShop = styleShop;
  styleShop = function(tab){
    const t = tab || ui.shopTab || "themes";
    const was = dlg.open ? dlg.querySelector(".sheet.shop .sheet-body") : null;
    const keep = was && was.dataset.uiTab === t ? was.scrollTop : 0;
    let r;
    if (t === "collections" || t === "stickers") { r = origShop.call(this, "notes"); ui.shopTab = t; }
    else r = origShop.apply(this, arguments);
    S.tab = ui.shopTab; save();
    try { enhance(ui.shopTab); } catch (e) { console.warn("shop layout", e); }
    const body = dlg.querySelector(".sheet.shop .sheet-body");
    if (body) { body.dataset.uiTab = ui.shopTab; if (keep) body.scrollTop = keep; }
    return r;
  };

  function enhance(tab){
    const sheet = dlg.querySelector(".sheet.shop"), body = sheet && sheet.querySelector(".sheet-body");
    if (!body || body.querySelector(".ui-shop-bar")) return;
    sheet.classList.add("ui-shop");
    const tabs = body.querySelector(".shop-tabs");
    if (tabs && !tabs.querySelector('[data-id="collections"]')) {
      const th = tabs.querySelector('[data-id="themes"]');
      const b = `<button type="button" role="tab" data-act="shop-tab" data-id="collections" aria-selected="false" aria-pressed="false">Collections</button>`;
      if (th) th.insertAdjacentHTML("afterend", b); else tabs.insertAdjacentHTML("beforeend", b);
    }
    if (tabs) tabs.querySelectorAll('[data-act="shop-tab"]').forEach(b => { const on = b.dataset.id === tab; b.setAttribute("aria-selected", on); b.setAttribute("aria-pressed", on); });
    const bar = document.createElement("div");
    bar.className = "ui-shop-bar";
    if (tabs) { tabs.replaceWith(bar); bar.appendChild(tabs); } else body.prepend(bar);
    if (tab === "collections" || tab === "stickers") {
      [...body.children].filter(el => el !== bar && !el.classList.contains("shop-note") && bar.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING).forEach(el => el.remove());
      if (tab === "collections") body.insertAdjacentHTML("beforeend", collectionsHtml());
      else { body.insertAdjacentHTML("beforeend", stickersHtml()); addStickerCollections(body); sectionize(body, tab); }
    } else sectionize(body, tab);
    tagSlots(body, tab);
    if (tab === "themes" || tab === "collections") {   // sections follow the filter order
      const rank = ["photos", "free"].concat(GROUPS.map(g => g[0])), r = el => { const i = rank.indexOf(el.dataset.f); return i < 0 ? 99 : i; };
      const secs = [...body.querySelectorAll(":scope > .ui-sec")];
      if (secs.length > 1) { const mark = document.createComment(""); secs[0].before(mark); secs.slice().sort((a, b) => r(a) - r(b)).forEach(x => mark.before(x)); mark.remove(); }
    }
    lazyGrids(body);
    bump(body);
    // Filter chips: only the ones with something in them
    const has = new Set([...body.querySelectorAll("[data-f]")].map(x => x.dataset.f));
    const chips = (CHIPS[tab] || [["all", "All"]]).filter(([k]) => k === "all" || has.has(k)).concat(STORE.paywall ? [["owned", "Owned"]] : []);
    if (chips.length > 2 || STORE.paywall) bar.insertAdjacentHTML("beforeend", `<div class="ui-chips" role="group" aria-label="Show">${chips.map(([k, l]) => `<button type="button" class="ui-chip" data-ui-f="${k}" aria-pressed="false">${esc(l)}</button>`).join("")}</div>`);
    if (!chips.some(([k]) => k === S.f[tab])) S.f[tab] = "all";
    sheet.addEventListener("click", e => {
      const chip = e.target.closest("[data-ui-f]");
      if (chip) { S.f[tab] = chip.dataset.uiF; save(); apply(body, tab); body.scrollTop = 0; return; }
      const sb = e.target.closest(".ui-sec-btn");
      if (sb) { const sec = sb.closest(".ui-sec"), open = sb.getAttribute("aria-expanded") !== "true"; S.c[sec.dataset.key] = open ? 1 : 0; save(); setOpen(sec, open); return; }
      const more = e.target.closest(".ui-col-more");
      if (more) { const card = more.closest(".ui-col"); const open = !card.classList.contains("open"); body.querySelectorAll(".ui-col.open").forEach(c => { if (c !== card) showAll(c, false); }); showAll(card, open); openCol = open ? card.dataset.theme : ""; if (open) card.scrollIntoView({block: "nearest", behavior: "smooth"}); }
    });
    apply(body, tab);
    if (tab === "collections" && openCol) { const c = body.querySelector(`.ui-col[data-theme="${openCol}"]`); if (c) showAll(c, true); }
  }

  // Wrap each "h3.shop-sec + its tiles" into a collapsible section
  function sectionize(body, tab){
    const kids = [...body.children];
    let cur = null;
    const mk = (h3, tp, anchor) => {
      const sec = document.createElement("section");
      const title = (h3.textContent || "").trim();
      sec.className = "ui-sec"; sec.dataset.f = secKind(tab, title, tp); sec.dataset.key = tab + ":" + slug(title);
      (anchor || h3).before(sec); h3.remove();
      const inner = document.createElement("div"); inner.className = "ui-sec-b";
      h3.innerHTML = `<button type="button" class="ui-sec-btn" aria-expanded="true"><span class="ui-sec-t">${h3.innerHTML}</span><span class="ui-n"></span>${CHEV}</button>`;
      sec.append(h3, inner);
      return {sec, inner};
    };
    kids.forEach(el => {
      if (el.classList.contains("tp-sec")) {
        const h3 = el.querySelector("h3.shop-sec"); if (!h3) return;
        const {sec, inner} = mk(h3, true, el);
        [...el.childNodes].forEach(n => inner.appendChild(n));
        sec.tpFill = el.tpFill; sec.dataset.count = el.dataset.count || "";
        el.remove(); cur = null; return;
      }
      if (el.matches("h3.shop-sec")) { cur = mk(el, false); return; }
      if (cur) cur.inner.appendChild(el);
    });
    body.querySelectorAll(".ui-sec").forEach(sec => {
      const n = sec.dataset.count || sec.querySelectorAll(".ui-sec-b .shop-tile, .ui-sec-b .shop-pack").length;
      sec.querySelector(".ui-n").textContent = n;
      sec.querySelector(".ui-sec-btn").setAttribute("aria-label", `${sec.querySelector(".ui-sec-t").textContent.trim()}, ${n} items`);
    });
  }
  function setOpen(sec, open){
    const b = sec.querySelector(".ui-sec-btn"); if (b) b.setAttribute("aria-expanded", open);
    sec.classList.toggle("shut", !open);
    if (open && typeof sec.tpFill === "function") { sec.tpFill(); lazyGrids(sec); bump(sec); }
  }
  function apply(body, tab){
    releaseAll(body);
    try { apply0(body, tab); } finally { holdRest(body); }
  }
  /* Sections (and Collections cards) below about the first three rows stay display:none, with a placeholder height,
     until you scroll near them or the page is idle. They stay in the page, so every button can still be found. */
  const HELD = "ui-held";
  const shopCols = min => Math.max(1, Math.floor((Math.min(960, window.innerWidth - 24) - 36 + 10) / (min + 10)));
  function releaseSec(el){
    if (!el.classList.contains(HELD)) return;
    el.classList.remove(HELD); el.style.minHeight = "";
    lazyGrids(el); bump(el);
  }
  function releaseAll(body){ body.querySelectorAll("." + HELD).forEach(el => { el.classList.remove(HELD); el.style.minHeight = ""; }); const sp = body.querySelector(".ui-cols-more"); if (sp) sp.remove(); }
  let holdIO = null;
  function holdRest(body){
    const scroller = body;
    if (holdIO) holdIO.disconnect();
    holdIO = window.IntersectionObserver ? new IntersectionObserver(es => es.forEach(e => { if (!e.isIntersecting) return; const t = e.target; if (t.classList.contains("ui-cols-more")) moreCols(body); else { holdIO.unobserve(t); releaseSec(t); } }), {root: scroller, rootMargin: "800px 0px"}) : null;
    const wide = shopCols(178);
    let budget = wide * 3;
    body.querySelectorAll(".ui-sec").forEach(sec => {
      if (sec.hidden || sec.classList.contains("shut")) return;
      const packs = sec.querySelectorAll(".ui-sec-b .shop-pack").length, tiles = sec.querySelectorAll(".ui-sec-b .shop-tile").length;
      const cost = tiles + packs * wide;
      if (budget > 0 || !holdIO) { budget -= cost; return; }
      sec.classList.add(HELD);
      sec.style.minHeight = Math.round(48 + Math.ceil(tiles / wide) * 200 + packs * 140) + "px";
      holdIO.observe(sec);
    });
    const cards = [...body.querySelectorAll(".ui-cols > .ui-col:not([hidden]):not(.ui-gone)")];
    const cc = shopCols(200), keep = cc * 3;
    if (holdIO && cards.length > keep) {
      cards.slice(keep).forEach(c => c.classList.add(HELD));
      const sp = document.createElement("div"); sp.className = "ui-cols-more";
      body.querySelector(".ui-cols").after(sp); sizeMore(body); holdIO.observe(sp);
    }
    // release the rest in idle time, top to bottom
    const idle = window.requestIdleCallback || (f => setTimeout(() => f({timeRemaining: () => 8}), 30));
    const step = () => idle(d => {
      if (!body.isConnected) return;
      let any = false;
      while (d.timeRemaining() > 4) {
        const sec = body.querySelector(".ui-sec." + HELD);
        if (sec) { releaseSec(sec); any = true; continue; }
        if (body.querySelector(".ui-col." + HELD)) { moreCols(body); any = true; continue; }
        break;
      }
      if (any || body.querySelector("." + HELD)) step();
    });
    step();
  }
  function sizeMore(body){
    const sp = body.querySelector(".ui-cols-more"); if (!sp) return;
    const n = body.querySelectorAll(".ui-col." + HELD).length;
    if (!n) { sp.remove(); return; }
    sp.style.minHeight = Math.ceil(n / shopCols(200)) * 300 + "px";
  }
  function moreCols(body){
    const held = [...body.querySelectorAll(".ui-col." + HELD)].slice(0, shopCols(200) * 2);
    held.forEach(c => { c.classList.remove(HELD); lazyGrids(c); });
    sizeMore(body);
  }
  window.SBUI = Object.assign(window.SBUI, {shopSettled: () => new Promise(r => { const t = () => { const b = dlg.querySelector(".sheet.ui-shop .sheet-body"); if (b && (b.querySelector("." + HELD) || b.querySelector("[data-stks]:not([hidden])"))) { b.querySelectorAll(".ui-sec." + HELD).forEach(releaseSec); moreCols(b); b.querySelectorAll(".pack-grid[data-stks], .ui-col-stk[data-stks]").forEach(fillGrid); setTimeout(t, 30); } else r(true); }; t(); })});
  function apply0(body, tab){
    const f = S.f[tab] || "all", pick = f !== "all" && f !== "owned";
    body.querySelectorAll(".ui-chip").forEach(c => c.setAttribute("aria-pressed", c.dataset.uiF === f));
    body.querySelectorAll(".ui-sec").forEach(sec => {
      sec.hidden = pick && sec.dataset.f !== f;
      const saved = S.c[sec.dataset.key];
      setOpen(sec, pick ? true : f === "owned" ? true : saved != null ? !!saved : sec.dataset.f !== "collections");
    });
    body.querySelectorAll(".ui-col").forEach(c => { c.hidden = pick && c.dataset.f !== f; });
    // Owned: only what you can use now
    body.querySelectorAll(".shop-tile, .shop-pack, .ui-col").forEach(t => t.classList.toggle("ui-gone", f === "owned" && !!t.querySelector(':scope > [data-act="shop-unlock"], :scope > .shop-name [data-act="shop-unlock"], :scope > .ui-col-act [data-act="shop-unlock"]')));
    body.querySelectorAll(".ui-sec").forEach(sec => { if (f === "owned") sec.hidden = !sec.querySelector(".shop-tile:not(.ui-gone), .shop-pack:not(.ui-gone)"); });
    const none = body.querySelector(".ui-none");
    const visible = body.querySelector(".ui-sec:not([hidden]), .ui-col:not([hidden]):not(.ui-gone)");
    if (!visible && !none) body.insertAdjacentHTML("beforeend", `<p class="ui-none">Nothing here yet. Try All.</p>`);
    else if (visible && none) none.remove();
  }

  /* ---------- Collections: each theme's stickers, pins and flashcard style together ---------- */
  const useBtn = (kind, id, cur, label) => !owns(kind, id) ? `<button type="button" class="btn small" data-act="shop-unlock" data-kind="${kind}" data-id="${id}">🔒 Unlock</button>${kind === "skin" ? cpBtn(id) : ""}` : cur ? `<button type="button" class="btn small" disabled data-kind="${kind}" data-id="${id}" data-l="${label || "Use"}">In Use</button>` : `<button type="button" class="btn small primary" data-act="shop-use" data-kind="${kind}" data-id="${id}">${label || "Use"}</button>`;
  function collectionsHtml(){
    const T = window.SBTP;
    if (!T || !T.ordered) return `<p class="ui-none">Theme Collections aren't available in this version.</p>`;
    const cfg = styleCfg(), dark = isDark();
    const cards = T.ordered().map(th => {
      const s = SKINS.find(x => x.id === th), r = T.rec(th); if (!s || !r) return "";
      const p = r.pack && STICKER_PACKS.find(x => x.id === r.pack), keys = p ? Object.keys(p.items) : [];
      const cur = cfg.skin === th;
      const bits = [p ? `${keys.length} stickers` : "", r.pins.length ? `${r.pins.length} pin${r.pins.length === 1 ? "" : "s"}` : "", r.card ? "a flashcard style" : ""].filter(Boolean);
      const what = bits.length > 1 ? bits.slice(0, -1).join(", ") + " and " + bits[bits.length - 1] : bits[0] || "";
      return `<div class="shop-tile ui-col${cur ? " on" : ""}" data-theme="${th}" data-f="${skinGroup(s)}">
        <div class="ui-col-prev">${skinPreview(s, dark)}</div>
        <div class="shop-name"><b>${esc(s.name)}</b>${s.tier === "pro" ? PRO_BADGE : FREE_BADGE}${cur ? `<span class="tp-now">Your Theme</span>` : ""}</div>
        ${keys.length ? `<div class="ui-col-stk" aria-hidden="true" data-stks="${esc(keys.slice(0, 5).join(" "))}"></div>` : ""}
        <p class="mini">${esc(what ? `Comes with ${what}.` : "")}</p>
        <div class="ui-col-act">${useBtn("skin", th, cur, "Apply Theme")}<button type="button" class="btn small ui-col-more" aria-expanded="false">See All</button></div>
        <div class="ui-col-all" hidden></div></div>`;
    }).join("");
    return `<p class="mini" style="margin:0">Every scene theme comes with its own stickers, pins and flashcard style. Apply a theme, or use its pieces with any theme.</p>${cpNote()}<div class="ui-cols">${cards}</div>`;
  }
  function showAll(card, open){
    if (open) card.classList.remove(HELD);
    card.classList.toggle("open", open);
    const btn = card.querySelector(".ui-col-more"), box = card.querySelector(".ui-col-all");
    if (btn) { btn.setAttribute("aria-expanded", open); btn.textContent = open ? "Show Less" : "See All"; }
    if (!box) return;
    box.hidden = !open;
    if (!open || box.dataset.done) return;
    box.dataset.done = "1";
    const th = card.dataset.theme, r = window.SBTP.rec(th), cfg = styleCfg();
    const p = r.pack && STICKER_PACKS.find(x => x.id === r.pack);
    const cs = r.card && CARD_STYLES.find(x => x.id === r.card);
    box.innerHTML = `${p ? `<div class="ui-col-part"><div class="shop-name"><b>${esc(p.name)}</b><span class="mini">${Object.keys(p.items).length} stickers</span>${owns("sticker", p.id) ? `<span class="mini">In your envelope</span>` : `<button type="button" class="btn small" data-act="shop-unlock" data-kind="sticker" data-id="${p.id}">🔒 Unlock</button>`}</div><div class="pack-grid">${Object.keys(p.items).map(stkCell).join("")}</div></div>` : ""}
      <div class="ui-col-row">
        ${r.pins.map((pid, i) => { const it = PINS.find(x => x.id === pid) || {name: pid}; const on = notePinOf(null) === pid && !(cfg.pinAuto === true && themeKit());
          return `<div class="ui-col-piece">${noteDemo(noteShapeOf(null), pid, i + 1)}<div class="shop-name"><b>${esc(it.name)}</b></div>${useBtn("pin", pid, on, "Use for Notes")}</div>`; }).join("")}
        ${cs ? `<div class="ui-col-piece"><div class="cs-demo cs-${cs.id}"><span class="face"><span class="face-label">Front</span><span class="face-text">Mitochondria</span></span></div><div class="shop-name"><b>${esc(cs.name)}</b></div>${useBtn("card", cs.id, cardStyleOf(null) === cs.id, "Use for All Decks")}</div>` : ""}
      </div>`;
    tagSlots(box, "collections"); lazyGrids(box); bump(box);
  }

  /* ---------- Use without redrawing the whole shop ----------
     Each tile with a Use or In Use button is tagged with its kind and id (data-k, data-i). A Use click saves the
     style exactly like the app does, then only flips the buttons and highlights. Anything untagged falls back to the
     app's own handler (which redraws the shop). */
  const TAB_KIND = {themes: "skin", cards: "card", notes: "note", pins: "pin"};
  const LABEL = {skin: "Use", card: "Use for All Decks", note: "Use for Notes", pin: "Use for Notes"};
  function curOf(kind){
    const cfg = styleCfg();
    if (kind === "skin") return cfg.skin;
    if (kind === "card") return cardStyleOf(null);
    if (kind === "note") return noteShapeOf(null);
    if (kind === "pin") return cfg.pinAuto === true && themeKit() ? "" : notePinOf(null);
    return "";
  }
  function tagSlots(body, tab){
    body.querySelectorAll(".shop-tile, .ui-col-piece").forEach(t => {
      const b = t.querySelector(":scope > .btn, :scope > .ui-col-act > .btn:not(.ui-col-more)"); if (!b) return;
      if (b.dataset.act === "shop-use" || b.dataset.act === "shop-unlock") { t.dataset.k = b.dataset.kind; t.dataset.i = b.dataset.id; t.dataset.l = b.dataset.act === "shop-use" ? b.textContent : ""; }
      else if (b.disabled && b.dataset.kind) { t.dataset.k = b.dataset.kind; t.dataset.i = b.dataset.id; t.dataset.l = b.dataset.l || ""; }
      else if (b.disabled) { const k = t.classList.contains("ui-col") ? "skin" : t.dataset.k || TAB_KIND[tab]; if (k) { t.dataset.k = k; t.dataset.i = curOf(k); } }
      if (t.classList.contains("ui-col") && !t.dataset.l) t.dataset.l = "Apply Theme";
    });
  }
  function refreshSlots(body, kind){
    const cur = curOf(kind);
    body.querySelectorAll(`[data-k="${kind}"]`).forEach(t => {
      const b = t.querySelector(":scope > .btn, :scope > .ui-col-act > .btn:not(.ui-col-more)"); if (!b || b.dataset.act === "shop-unlock") return;
      const on = t.dataset.i === cur;
      if (t.classList.contains("shop-tile")) t.classList.toggle("on", on);
      const nb = document.createElement("button"); nb.type = "button";
      if (on) { nb.className = "btn small"; nb.disabled = true; nb.textContent = "In Use"; }
      else { nb.className = "btn small primary"; nb.dataset.act = "shop-use"; nb.dataset.kind = kind; nb.dataset.id = t.dataset.i; nb.textContent = t.dataset.l || LABEL[kind]; }
      b.replaceWith(nb);
    });
    if (kind === "skin") body.querySelectorAll(".ui-col").forEach(c => { const pill = c.querySelector(".tp-now"); if (c.dataset.theme === cur && !pill) c.querySelector(".shop-name").insertAdjacentHTML("beforeend", `<span class="tp-now">Your Theme</span>`); else if (c.dataset.theme !== cur && pill) pill.remove(); });
    if (kind === "note" || kind === "pin") {
      const kit = body.querySelector(".kit-row");
      if (kit && themeKit() && !kit.querySelector("[data-act=kit-follow]")) { const m = kit.querySelector(".mini"); if (m) m.outerHTML = `<button type="button" class="btn small" data-act="kit-follow" data-kind="${kind}">Match Theme</button>`; }
    }
  }
  hook("act", (act, el) => {
    if (act !== "shop-use" || !el || !el.closest) return false;
    const body = el.closest(".sheet.ui-shop .sheet-body"), tile = el.closest("[data-k]");
    if (!body || !tile) return false;
    const k = el.dataset.kind, id = el.dataset.id;
    // Themes redraw the whole shop (other modules add their own theme tiles, like My Photos, that depend on it)
    if (!k || !id || !owns(k, id) || !["card", "note", "pin"].includes(k)) return false;
    if (k === "card") saveStyle({card: id, cardAuto: id === "theme"});
    else if (k === "note") saveStyle({note: id, noteAuto: false, notePicked: true});
    else saveStyle({pin: id, pinAuto: false, pinPicked: true});
    refreshSlots(body, k);
    // redraw the app behind the shop after this frame, so the click feels instant
    requestAnimationFrame(() => { try { render(); } catch (e) { console.warn(e); } });
    return true;
  });

  window.SBUI = Object.assign(window.SBUI, {shopState: () => JSON.parse(JSON.stringify(S))});
})();


