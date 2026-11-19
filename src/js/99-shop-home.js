/* ===== module: 99-shop-home.js ===== */
/* The Style Shop's front: a Shop home (a featured Collection, Build Your Look, and a row of each kind of item with See All),
   Yours (what the student owns and what their board is wearing now) and Build Your Look (the student's own board in a
   theme, with a companion, a sticker pack and a flashcard style tried on, before buying or wearing it). The shop's
   category pages (Themes, Collections, Flashcards…) stay as they were and are now the See All pages, with a way back.
   Opening the shop starts on the home; a redraw while it's open (after buying or using something) stays where it was. */
(() => {
  const OURS = ["home", "yours", "look", "maps"];
  const NAMES = {themes: "Themes", collections: "Collections", cards: "Flashcard Styles", notes: "Note Shapes", pins: "Pins", stickers: "Stickers", companions: "Companions", maps: "Concept Map Styles"};
  const SUBS = {themes: "Plain colors, scenes and seasons for your whole board", collections: "A theme with everything that matches it", cards: "How your cards look while you study", notes: "The shape of your sticky notes", pins: "What holds your notes to the board", stickers: "Drag them onto your sticky notes", companions: "They live on your board and cheer you on", maps: "A look for your concept maps: background, boxes and lines"};
  const KEEP = {};
  let VIEW = "home", Q = "", LOOK = null, OPEN = "", LDARK = null;

  /* ---------- What's in the shop ---------- */
  const T = () => window.SBTP || null;
  const CR = () => window.SBCREDITS || null;
  const dark = () => { try { return isDark(); } catch (e) { return false; } };
  const cfg = () => styleCfg();
  const compKey = th => { try { return window.SBCOMP && SBCOMP.themes().includes(th) ? th : "plain"; } catch (e) { return "plain"; } };
  const compsOf = th => { try { return window.SBCOMP ? SBCOMP.list(compKey(th)).map(c => c.id) : []; } catch (e) { return []; } };
  const allComps = () => { try { return window.SBCOMP && SBCOMP.all ? SBCOMP.all() : []; } catch (e) { return []; } };
  const compName = id => (allComps().find(c => c.id === id) || {}).name || "";
  const curComp = () => { try { return window.SBCOMP && SBCOMP.current ? SBCOMP.current() || "" : ""; } catch (e) { return ""; } };
  const tpThemes = () => { try { return T() && T().ordered ? T().ordered() : []; } catch (e) { return []; } };
  const rec = th => { try { return T() && T().rec ? T().rec(th) : null; } catch (e) { return null; } };
  // A theme collection's piece shows only while its theme is in the shop (the same rule as the shop's own lists); a hidden
  // theme's pieces would otherwise read as free and owned
  const shown = x => { if (!x || !x.theme) return true; try { return T() && T().themes ? T().themes().includes(x.theme) : SKINS.some(s => s.id === x.theme); } catch (e) { return false; } };
  const LIST = {skin: () => SKINS.filter(s => !s.photo), card: () => CARD_STYLES.filter(c => c.id !== "theme" && shown(c)), note: () => NOTE_SHAPES, pin: () => PINS.filter(shown), sticker: () => STICKER_PACKS.filter(shown), comp: () => allComps()};
  const CM = () => window.SBCMSTYLE || null;
  const cmOwns = id => !!CM() && !!(CM().owned ? CM().owned(id) : CM().free(id));
  const cmSale = () => CM() ? CM().ids().filter(id => id !== "theme" && id !== "plain") : [];
  const find = (kind, id) => (LIST[kind] ? LIST[kind]() : []).find(x => x.id === id) || null;
  const nameOf = (kind, id) => kind === "cm" ? (CM() ? CM().name(id) : "") : kind === "comp" ? compName(id) : String((find(kind, id) || {}).name || "").replace(/\s*\(Default\)\s*$/i, "");
  const tierOf = (kind, id) => { try { return itemTier(kind, id); } catch (e) { return "free"; } };
  const inUse = (kind, id) => {
    const c = cfg();
    if (kind === "skin") return c.skin === id;
    if (kind === "card") return cardStyleOf(null) === id;
    if (kind === "note") return noteShapeOf(null) === id;
    if (kind === "pin") return notePinOf(null) === id;
    if (kind === "comp") return curComp() === id;
    if (kind === "cm") return !!CM() && CM().current() === id;
    return false;
  };
  const price = (kind, id) => { try { return CR() && CR().enabled && CR().enabled() ? CR().priceOf(kind, id) : 0; } catch (e) { return 0; } };
  const yours = (kind, id) => STORE.paywall ? owns(kind, id) : tierOf(kind, id) === "free";
  // The little label on a tile: In Use, Yours, Free, a price, or Pro
  const has = (kind, id) => kind === "cm" ? cmOwns(id) : owns(kind, id);
  function tag(kind, id){
    if (inUse(kind, id)) return `<em class="sbh-tag on">In Use</em>`;
    if (kind === "cm") { if (CM() && CM().free(id)) return `<em class="sbh-tag free">Free</em>`; if (STORE.paywall && cmOwns(id)) return `<em class="sbh-tag own">Yours</em>`; if (!STORE.paywall) return PRO_BADGE; const p = price("cm", id); return p ? `<em class="sbh-tag cost">${p} credits</em>` : PRO_BADGE; }
    const tier = tierOf(kind, id);
    if (!STORE.paywall) return tier === "pro" ? PRO_BADGE : `<em class="sbh-tag free">Free</em>`;
    if (owns(kind, id) && tier === "pro") return `<em class="sbh-tag own">Yours</em>`;
    if (tier !== "pro") return `<em class="sbh-tag free">Free</em>`;
    const p = price(kind, id);
    return p ? `<em class="sbh-tag cost">${p} credits</em>` : PRO_BADGE;
  }

  /* ---------- Pictures ---------- */
  // A companion: the cached bitmap the companion shop keeps (made in quiet moments, swapped in when ready); its
  // first drawing carries its own styles, so the eyes and lids look right even before the bitmap is made
  const compPic = (id, face, big) => {
    try {
      // big (the Build Your Look preview): the drawing itself, so it stays sharp at any size
      if (big && window.SBCOMP && SBCOMP.stillUrl) { const u = SBCOMP.stillUrl(id); if (u) return `<span class="sbh-comp" aria-hidden="true"><img class="cp-still" src="${esc(u)}" alt="" decoding="async" draggable="false"></span>`; }
      if (window.SBCOMP && SBCOMP.stillHtml) { const h = SBCOMP.stillHtml(id, face ? 40 : 64); if (h) return `<span class="sbh-comp${face ? " face" : ""}" aria-hidden="true">${h}</span>`; }
    } catch (e) {}
    return `<span class="sbh-comp sbh-comp-none"></span>`;
  };
  const stkPic = keys => window.SBUI && SBUI.stkCell ? `<span class="sbh-stks">${keys.slice(0, 4).map(k => SBUI.stkCell(k)).join("")}</span>` : "";
  const cardPic = id => `<div class="cs-demo cs-${esc(id)}"><span class="face"><span class="face-label">Front</span><span class="face-text">Mitochondria</span></span></div>`;
  function pic(kind, id, i){
    if (kind === "skin") { const s = SKINS.find(x => x.id === id); return s ? skinPreview(s, dark()) : ""; }
    if (kind === "card") return cardPic(id);
    if (kind === "note") return noteDemo(id, notePinOf(null), (i || 0) + 1);
    if (kind === "pin") return noteDemo(noteShapeOf(null), id, (i || 0) + 1);
    if (kind === "sticker") { const p = STICKER_PACKS.find(x => x.id === id); return p ? stkPic(Object.keys(p.items)) : ""; }
    if (kind === "comp") return compPic(id);
    if (kind === "cm") return CM() ? `<span class="sbh-cm">${CM().pic(id, LOOK ? LOOK.skin : cfg().skin)}</span>` : "";
    return "";
  }
  // A tile: tapping a theme, companion, sticker pack or flashcard style tries it on; a pin or note shape is used (or unlocked)
  const TRY = {skin: 1, comp: 1, card: 1, cm: 1};
  function tile(kind, id, i){
    const n = nameOf(kind, id); if (!n) return "";
    const act = TRY[kind] ? `data-act="sbh-try"` : `data-act="shop-use"`;
    return `<button type="button" class="sbh-tile sbh-k-${kind}${inUse(kind, id) ? " on" : ""}" ${act} data-kind="${kind}" data-id="${esc(id)}" aria-label="${esc(n)}${TRY[kind] ? ": try it on" : ""}">
      <span class="sbh-pic">${pic(kind, id, i)}</span><span class="sbh-meta"><b>${esc(n)}</b>${tag(kind, id)}</span></button>`;
  }

  /* ---------- Home ---------- */
  const ROWS = [
    ["collections", "skin", () => tpThemes()],
    ["themes", "skin", () => SKINS.filter(s => !s.photo && (s.group || "plain") === "plain").map(s => s.id), "Free Themes", "Plain colors, ready to use"],
    ["stickers", "sticker", () => LIST.sticker().filter(p => !p.theme).map(p => p.id).concat(LIST.sticker().filter(p => p.theme).map(p => p.id))],
    ["cards", "card", () => LIST.card().map(c => c.id)],
    ["pins", "pin", () => LIST.pin().map(p => p.id)],
    ["notes", "note", () => NOTE_SHAPES.map(n => n.id)]
  ,
    ["maps", "cm", () => cmSale()]
  ];
  // The featured Collection changes each week, and skips ones already owned when there are others
  function featured(){
    const ths = tpThemes(); if (!ths.length) return "";
    const wk = Math.floor(Date.now() / (7 * 864e5)), order = ths.map((_, i) => ths[(i + wk) % ths.length]);
    return order.find(th => !STORE.paywall || !owns("skin", th)) || order[0];
  }
  // A peek at what a Collection brings: its companions' faces and a few of its stickers
  function inside(th){
    const r = rec(th), cs = compsOf(th).slice(0, 3), p = r && r.pack && STICKER_PACKS.find(x => x.id === r.pack);
    const ks = p ? Object.keys(p.items).slice(0, 4) : [];
    if (!cs.length && !ks.length) return "";
    return `<div class="sbh-inside" aria-hidden="true">${cs.map(c => compPic(c, true)).join("")}${ks.length && window.SBUI && SBUI.stkCell ? ks.map(k => SBUI.stkCell(k)).join("") : ""}</div>`;
  }
  function heroHtml(){
    const th = featured(), s = th && SKINS.find(x => x.id === th);
    const what = th && CR() && CR().contents ? CR().contents(th).slice(1).map(x => x.replace(/^Its /, "").replace(/:.*$/, "")).join(", ") : "";
    const own = !th || owns("skin", th), p = th ? price("skin", th) : 0;
    const feat = s ? `<div class="sbh-hero">
        <div class="sbh-hero-pic">${skinPreview(s, true)}</div>
        <div class="sbh-hero-t"><span class="sbh-eyebrow">Featured Collection</span><b>${esc(s.name)}</b>${what ? `<span>${esc("Comes with " + what)}</span>` : ""}
          ${inside(th)}
          <div class="sbh-hero-acts">${own ? `<button type="button" class="btn sbh-light" data-act="sbh-try" data-kind="skin" data-id="${esc(th)}">Try It On</button>${inUse("skin", th) ? `<span class="sbh-hero-p">In use</span>` : `<button type="button" class="btn sbh-ghost" data-act="shop-use" data-kind="skin" data-id="${esc(th)}">Use It</button>`}`
            : `<button type="button" class="btn sbh-gold" data-act="shop-unlock" data-kind="skin" data-id="${esc(th)}">${p ? `Get It · ${p} credits` : "Get It With Pro"}</button>${typeof PLAN !== "undefined" && PLAN && !PLAN.isPro() ? `<button type="button" class="btn sbh-pro" data-act="plan-open">Get Pro</button>` : ""}`}</div></div></div>` : "";
    const sk = SKINS.find(x => x.id === cfg().skin) || SKINS[0], cp = curComp();
    const build = `<button type="button" class="sbh-build" data-act="sbh-go" data-id="look">
        <span class="sbh-build-pics" aria-hidden="true"><span class="sbh-mini">${skinPreview(sk, dark())}</span>${cp ? compPic(cp) : ""}</span>
        <b>Build Your Look</b><span>Start from any theme, then try its companions, a flashcard style, a pin and a map style on your own board.</span>
        <em>Start Building</em></button>`;
    return `<div class="sbh-top${feat ? "" : " solo"}">${feat}${build}</div>`;
  }
  function rowHtml([tab, kind, ids, title, sub]){
    const list = ids().filter(id => nameOf(kind, id)).slice(0, 6); if (!list.length) return "";
    return `<section class="sbh-row" data-row="${tab}"><div class="sbh-row-h"><h3>${esc(title || NAMES[tab])}</h3><span class="mini">${esc(sub || SUBS[tab])}</span><button type="button" class="link-btn" data-act="sbh-go" data-id="${tab}">See All ›</button></div>
      <div class="sbh-grid">${list.map((id, i) => tile(kind, id, i)).join("")}</div></section>`;
  }
  const TYPES = [["themes", "Themes"], ["collections", "Collections"], ["stickers", "Stickers"], ["cards", "Flashcards"], ["pins", "Pins"], ["notes", "Note Shapes"], ["maps", "Map Styles"]];
  // A redraw while the student is part way down the page (they used something) draws every row, so the place holds
  let EAGER = false;
  function homeHtml(){
    return `<div class="sbh-bar"><div class="ui-shop-q" role="search"><input type="search" id="sbhQ" data-noenter placeholder="Search themes, stickers, companions…" aria-label="Search the Style Shop" autocomplete="off" spellcheck="false" enterkeyhint="search" maxlength="40" value="${esc(Q)}"></div>
      <div class="sbh-types" role="group" aria-label="Browse">${TYPES.map(([k, l]) => `<button type="button" class="ui-chip" data-act="sbh-go" data-id="${k}">${l}</button>`).join("")}</div></div>
      <div class="sbh-res" id="sbhRes"${Q ? "" : " hidden"}>${Q ? resultsHtml(Q) : ""}</div>
      <div class="sbh-home"${Q ? " hidden" : ""}>${heroHtml()}${ROWS.map((r, i) => i < 2 || EAGER ? rowHtml(r) : `<section class="sbh-row sbh-wait" data-wait="${i}"></section>`).join("")}</div>`;
  }
  // Searching from the home looks through everything, by name (and a theme's group)
  function resultsHtml(q){
    const words = q.toLowerCase().split(/\s+/).filter(Boolean), hit = t => words.every(w => t.includes(w));
    const out = [];
    [["skin", LIST.skin()], ["sticker", LIST.sticker()], ["card", LIST.card()], ["pin", LIST.pin()], ["note", NOTE_SHAPES]].forEach(([kind, list]) => list.forEach(x => {
      const text = [x.name, x.desc, x.group, x.theme && (SKINS.find(s => s.id === x.theme) || {}).name, kind === "comp" ? "companion" : kind === "sticker" ? "stickers" : kind === "card" ? "flashcard" : kind].join(" ").toLowerCase();
      if (hit(text)) out.push([kind, x.id]);
    }));
    if (!out.length) return `<p class="ui-none">Nothing matches “${esc(q.slice(0, 24))}”. Try another word.</p>`;
    return `<p class="mini sbh-n">${out.length} ${out.length === 1 ? "match" : "matches"}${out.length > 36 ? ", the first 36 shown" : ""}</p><div class="sbh-grid sbh-wrap">${out.slice(0, 36).map(([k, id], i) => tile(k, id, i)).join("")}</div>`;
  }

  // See All for concept map styles: they live in the concept map module, so this page is drawn here
  function mapsHtml(){
    const ids = (CM() ? ["theme", "plain"] : []).concat(cmSale());
    return `<div class="sbh-back"><button type="button" class="link-btn" data-act="sbh-go" data-id="home">‹ Shop</button><h3>${NAMES.maps}</h3><span class="mini">${SUBS.maps}. Tap one to try it on.</span></div>
      <div class="sbh-grid sbh-wrap">${ids.map((id, i) => tile("cm", id, i)).join("")}</div>`;
  }

  /* ---------- Yours ---------- */
  function yoursHtml(){
    const c = cfg(), cp = curComp();
    const cur = {skin: c.skin, comp: cp, card: cardStyleOf(null), note: noteShapeOf(null), pin: notePinOf(null), cm: CM() ? CM().current() : ""};
    const now = SLOTS.map(([slot, k, l]) => [k, cur[slot], l]).filter(([k, id]) => id && nameOf(k, id));
    const strip = `<div class="sbh-now"><div class="sbh-now-t"><b>Your Look Now</b><span class="mini">What your board is wearing. Tap one to change it.</span></div>
      <div class="sbh-now-l">${now.map(([k, id, l], i) => { const tab = {skin: "themes", comp: "look", card: "cards", note: "notes", pin: "pins", cm: "maps"}[k], inner = `<span class="sbh-pic">${pic(k, id, i)}</span><span><em>${l}</em><b>${esc(nameOf(k, id))}</b></span>`;
        return tab ? `<button type="button" class="sbh-now-i sbh-k-${k}" data-act="sbh-go" data-id="${tab}" aria-label="${esc(l)}: ${esc(nameOf(k, id))}. Change it">${inner}</button>` : `<div class="sbh-now-i sbh-k-${k}">${inner}</div>`; }).join("")}</div></div>`;
    if (!STORE.paywall) return strip + `<p class="sbh-note">While Studyboard is in early access, everything in the shop is yours to use. <button type="button" class="link-btn" data-act="sbh-go" data-id="home">Browse the Shop</button></p>`;
    const groups = [["themes", "skin", LIST.skin().map(s => s.id).concat(SKINS.filter(s => s.photo).map(s => s.id))], ["stickers", "sticker", LIST.sticker().map(p => p.id)], ["cards", "card", LIST.card().map(x => x.id)], ["pins", "pin", LIST.pin().map(x => x.id)], ["notes", "note", NOTE_SHAPES.map(x => x.id)], ["maps", "cm", cmSale()]];
    const kindName = {themes: "Themes", companions: "Companions", stickers: "Sticker Packs", cards: "Flashcard Styles", pins: "Pins", notes: "Note Shapes", maps: "Concept Map Styles"};
    const rows = groups.map(([tab, kind, ids]) => {
      const mine = ids.filter(id => has(kind, id) && nameOf(kind, id)).sort((a, b) => (inUse(kind, b) - inUse(kind, a)) || ((tierOf(kind, b) === "pro") - (tierOf(kind, a) === "pro")));
      if (!mine.length) return "";
      return `<section class="sbh-row"><div class="sbh-row-h"><h3>${kindName[tab]}</h3><span class="mini">${mine.length} yours</span><button type="button" class="link-btn" data-act="sbh-go" data-id="${tab}">Shop ${kindName[tab]} ›</button></div><div class="sbh-grid sbh-wrap">${mine.map((id, i) => kind === "skin" || kind === "card" ? tile(kind, id, i).replace(/data-act="sbh-try"/, 'data-act="shop-use"').replace(/: try it on"/, '"') : tile(kind, id, i)).join("")}</div></section>`;
    }).join("");
    return strip + (rows || `<p class="sbh-note">Nothing bought yet. Free items are always yours, and anything you get with credits or Pro shows up here. <button type="button" class="link-btn" data-act="sbh-go" data-id="home">Browse the Shop</button></p>`);
  }

  /* ---------- Build Your Look ---------- */
  // Starting from a theme fills in its own companion, sticker pack and flashcard style
  function matchTo(th){
    const r = rec(th), cs = compsOf(th);
    LOOK.skin = th;
    LOOK.comp = cs.includes(LOOK.comp) ? LOOK.comp : cs[0] || "";
    if (r && r.card) LOOK.card = r.card;
    if (r && r.pins && r.pins.length) LOOK.pin = r.pins[0];
  }
  function startLook(kind, id){
    if (!LOOK) {
      const c = cfg(), r = rec(c.skin);
      LOOK = {skin: c.skin, comp: curComp(), card: cardStyleOf(null), note: noteShapeOf(null), pin: notePinOf(null), cm: CM() ? CM().current() : ""};
      if (LOOK.card === "theme") LOOK.card = (r && r.card) || "index";
    }
    if (kind === "skin") matchTo(id);
    else if (kind === "comp") { const c = allComps().find(x => x.id === id); if (c && c.theme && c.theme !== "plain" && SKINS.some(s => s.id === c.theme) && c.theme !== LOOK.skin) matchTo(c.theme); LOOK.comp = id; }
    else if (kind === "card") LOOK.card = id;
    else if (kind === "note") LOOK.note = id;
    else if (kind === "pin") LOOK.pin = id;
    else if (kind === "cm") LOOK.cm = id;
    OPEN = kind || OPEN;
  }
  // Stickers aren't a slot: any pack can go on any note, whatever the theme
  const SLOTS = [["skin", "skin", "Theme"], ["comp", "comp", "Companion"], ["card", "card", "Flashcard Style"], ["pin", "pin", "Pin"], ["cm", "cm", "Concept Map Style"]];
  function options(slot){
    const th = LOOK.skin, r = rec(th), mine = (k, ids) => ids.filter(id => nameOf(k, id));
    const lead = (first, rest) => [...new Set(first.filter(Boolean).concat(rest))];
    if (slot === "skin") return mine("skin", lead([th, cfg().skin], tpThemes().concat(SKINS.filter(s => !s.photo).map(s => s.id))));
    if (slot === "comp") return mine("comp", compsOf(th));
    if (slot === "note") return mine("note", lead([LOOK.note], NOTE_SHAPES.map(n => n.id)));
    if (slot === "pin") return mine("pin", lead((r && r.pins || []).concat(LOOK.pin), LIST.pin().map(p => p.id)));
    if (slot === "cm") return CM() ? lead([LOOK.cm], CM().ids()) : [];
    return mine("card", lead([r && r.card, LOOK.card], LIST.card().map(c => c.id)));
  }
  // The large preview uses the scene's own picture, not the small bitmap kept for tiles, so it stays sharp
  function sharpPrev(s, dk){
    const h = skinPreview(s, dk), big = window.SBUI && SBUI.thumbOrig ? SBUI.thumbOrig(s.id, dk) : "";
    return big ? h.replace(/(<span class="sp-art[^"]*"[^>]*>\s*<img[^>]*\ssrc=")[^"]+"/, `$1${big}"`) : h;
  }
  function stageHtml(){
    const s = SKINS.find(x => x.id === LOOK.skin) || SKINS[0], dk = LDARK == null ? dark() : LDARK;
    return `<div class="sbh-stage" aria-label="Preview of your board in this look" role="img">
      <div class="sbh-stage-in">${sharpPrev(s, dk)}</div>
      <div class="sbh-st-note">${noteDemo(LOOK.note || noteShapeOf(null), LOOK.pin || notePinOf(null), 2, "")}</div>
      ${LOOK.cm && CM() ? `<div class="sbh-st-cm">${String(CM().pic(LOOK.cm, LOOK.skin)).replace("<svg ", '<svg preserveAspectRatio="xMidYMid slice" ')}</div>` : ""}
      <div class="sbh-st-card">${cardPic(LOOK.card)}</div>
      ${LOOK.comp ? `<div class="sbh-st-comp">${compPic(LOOK.comp, false, true)}</div>` : ""}</div>`;
  }
  function lookHtml(){
    const dk = LDARK == null ? dark() : LDARK, th = LOOK.skin, ths = SKINS.find(x => x.id === th);
    const pieces = SLOTS.map(([slot, kind]) => [slot, kind, LOOK[slot]]).filter(([, k, id]) => id && nameOf(k, id));
    const need = pieces.filter(([, k, id]) => !has(k, id));
    const cost = need.reduce((n, [, k, id]) => n + price(k, id), 0);
    const col = rec(th) && !owns("skin", th) ? price("skin", th) : 0;
    const inCol = need.filter(([, k, id]) => k === "skin" || (find(k, id) || {}).theme === th || (k === "comp" && compsOf(th).includes(id)));
    const slots = SLOTS.map(([slot, kind, label]) => {
      const id = LOOK[slot], open = OPEN === slot;
      // Companions: every one of the theme's comes with it; the pick is only which one sits on the board
      const cs = slot === "comp" ? compsOf(th).filter(c => compName(c)) : [];
      // Pins likewise: with one of the theme's own pins picked, all of its pins come with it
      const tp = slot === "pin" && rec(th) && (rec(th).pins || []).includes(id) ? rec(th).pins.filter(p => nameOf("pin", p)) : [];
      const n = cs.length > 1 ? cs.map(compName).join(", ") : tp.length > 1 ? tp.map(p => nameOf("pin", p)).join(", ") : id ? nameOf(kind, id) : "";
      if (cs.length > 1) label = `All ${cs.length} Companions`;
      if (tp.length > 1) label = `All ${tp.length} Pins`;
      const themeTag = `<em class="sbh-tag theme">${esc((ths ? ths.name : "Theme") + " Theme")}</em>`;
      const opts = open ? options(slot) : [];
      return `<div class="sbh-slot${open ? " open" : ""}">
        <button type="button" class="sbh-slot-h" data-act="sbh-slot" data-id="${slot}" aria-expanded="${open}"><span class="sbh-pic sbh-k-${kind}">${id ? pic(kind, id, 1) : ""}</span><span class="sbh-slot-t"><em>${label}</em><b>${n ? esc(n) : "None"}</b></span>${!id ? "" : kind === "comp" || (tp.length && !has("pin", id)) ? themeTag : tag(kind, id)}</button>
        ${open && cs.length > 1 ? `<p class="mini sbh-opt-note">All ${cs.length} come with the ${esc(ths ? ths.name : "")} theme. Pick the one on your board:</p>` : ""}
        ${open && tp.length > 1 ? `<p class="mini sbh-opt-note">All ${tp.length} come with the ${esc(ths ? ths.name : "")} theme. Pick the one your notes use, or any other pin:</p>` : ""}
        ${open ? `<div class="sbh-opts">${slot === "comp" && !opts.length ? `<p class="mini">This theme has no companions of its own.</p>` : ""}${opts.slice(0, 30).map(o => `<button type="button" class="sbh-opt sbh-k-${kind}${o === id ? " on" : ""}" data-act="sbh-pick" data-slot="${slot}" data-id="${esc(o)}" aria-pressed="${o === id}" title="${esc(nameOf(kind, o))}" aria-label="${esc(nameOf(kind, o))}">${pic(kind, o, 1)}</button>`).join("")}</div>
          ${opts.length > 30 && slot !== "cm" ? `<button type="button" class="link-btn sbh-more" data-act="sbh-go" data-id="${({skin: "themes", card: "cards", comp: "companions", note: "notes", pin: "pins"})[slot] || "themes"}">See All ${NAMES[({skin: "themes", card: "cards", comp: "companions", note: "notes", pin: "pins"})[slot] || "themes"]}</button>` : ""}` : ""}
      </div>`;
    }).join("");
    // A bundle: the theme (with its whole Collection) plus the flashcard style, note shape and pin picked, for one Collection price
    const SELL = {card: 1, pin: 1, cm: 1};
    const credits = !!(CR() && CR().enabled && CR().enabled() && CR().buyBundle);
    const extras = need.filter(([, k, id]) => SELL[k] && !(k === "card" && rec(th) && rec(th).card === id) && !(k === "pin" && rec(th) && (rec(th).pins || []).includes(id))).slice(0, 5);
    const bundle = credits && col > 0;
    const proOnly = need.filter(([, k, id]) => !price(k, id) && k !== "skin" && k !== "comp");
    const names = l => l.map(([, k, id]) => esc(nameOf(k, id))).join(", ");
    let sum, main = "";
    if (!need.length) sum = `<p class="sbh-sum ok">Everything here is yours. Wear it whenever you like.</p>`;
    else if (bundle) {
      const apart = col + extras.reduce((n, [, k, id]) => n + price(k, id), 0);
      sum = `<div class="sbh-sum">${apart > col ? `<div class="sbh-apart"><span>Bought one by one</span><s>${apart} credits</s></div>` : ""}<div class="sbh-col"><span>This look, together</span><b>${col} credits</b></div>
        <p class="mini">The ${esc(ths ? ths.name : "")} theme with its whole Collection${extras.length ? `, plus ${names(extras)}` : ""}.${proOnly.length ? ` ${names(proOnly)} ${proOnly.length === 1 ? "comes" : "come"} with Studyboard Pro.` : ""}</p></div>`;
      main = `<button type="button" class="btn primary sbh-buy" data-act="sbh-bundle">Get This Look · ${col} credits</button>`;
    } else {
      sum = `<div class="sbh-sum">${cost ? `<div><span>${need.length === 1 ? "The piece" : `The ${need.length} pieces`} you don't have</span><b>${cost} credits</b></div>` : ""}${!cost ? `<p class="mini">${names(need)} ${need.length === 1 ? "comes" : "come"} with Studyboard Pro.</p>` : ""}</div>`;
      const buyable = need.filter(([, k, id]) => price(k, id));
      main = buyable.map(([, k, id]) => `<button type="button" class="btn small" data-act="shop-unlock" data-kind="${k}" data-id="${esc(id)}">Get ${esc(nameOf(k, id))}</button>`).join("");
      if (main) main = `<div class="sbh-getrow">${main}</div>`;
      if (!buyable.length && typeof PLAN !== "undefined" && PLAN && !PLAN.isPro()) main = `<button type="button" class="btn primary" data-act="plan-open">Get Studyboard Pro</button>`;
    }
    const acts = `<div class="sbh-acts">${main}
        <button type="button" class="btn${need.length ? "" : " primary"}" data-act="sbh-wear"${need.length === pieces.length ? " disabled" : ""}>${need.length ? "Wear What I Have" : "Wear This Look"}</button></div>`;
    return `<div class="sbh-look">
      <div class="sbh-look-l"><div class="sbh-look-h"><button type="button" class="link-btn" data-act="sbh-go" data-id="home">‹ Shop</button><h3>Build Your Look</h3>
        <div class="segb sbh-dk" role="group" aria-label="Preview in"><button type="button" data-act="sbh-dark" data-id="0" aria-pressed="${!dk}">Light</button><button type="button" data-act="sbh-dark" data-id="1" aria-pressed="${dk}">Dark</button></div></div>
        ${stageHtml()}<p class="mini">Your board in this look. Nothing changes until you wear it.</p></div>
      <div class="sbh-look-r">${slots}<div class="sbh-spacer"></div>${sum}${acts}</div></div>`;
  }
  // Wear: every piece the student has goes on; the rest is left as it was
  function wear(){
    const c = cfg(), patch = {};
    const skinOk = owns("skin", LOOK.skin);
    if (skinOk && c.skin !== LOOK.skin) patch.skin = LOOK.skin;
    if (LOOK.card && owns("card", LOOK.card)) { patch.card = LOOK.card; patch.cardAuto = false; }
    if (LOOK.note && owns("note", LOOK.note)) { patch.note = LOOK.note; patch.noteAuto = false; patch.notePicked = true; }
    if (LOOK.pin && owns("pin", LOOK.pin)) { patch.pin = LOOK.pin; patch.pinAuto = false; patch.pinPicked = true; }
    if (LOOK.cm && cmOwns(LOOK.cm)) patch.cmPack = LOOK.cm;
    if (Object.keys(patch).length) { saveStyle(patch); if (patch.skin) try { applySkin(); } catch (e) {} }
    const slot = compsOf(LOOK.skin).indexOf(LOOK.comp);
    if (skinOk && LOOK.comp && slot >= 0 && owns("comp", LOOK.comp)) run("comp-theme", {skin: LOOK.skin, slot: String(slot)});
    render(); toast("Your new look is on");
    draw();
  }
  const run = (act, data) => { const b = document.createElement("button"); b.type = "button"; b.hidden = true; b.dataset.act = act; Object.assign(b.dataset, data || {}); document.body.appendChild(b); try { b.click(); } finally { b.remove(); } };

  /* ---------- Putting it on the sheet ---------- */
  const sheetOf = () => dlg.querySelector(".sheet.shop");
  function frame(){
    const sheet = sheetOf(); if (!sheet) return null;
    sheet.classList.add("sbh-on");
    const band = sheet.querySelector(".sheet-head");
    if (band && !band.querySelector(".sbh-seg")) {
      const h2 = band.querySelector("h2");
      const seg = `<div class="sbh-seg" role="group" aria-label="Style Shop"><button type="button" data-act="sbh-go" data-id="home">Shop</button><button type="button" data-act="sbh-go" data-id="yours">Yours</button></div>`;
      if (h2) h2.insertAdjacentHTML("afterend", seg); else band.insertAdjacentHTML("afterbegin", seg);
    }
    band && band.querySelectorAll(".sbh-seg [data-id]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.id === "yours" ? VIEW === "yours" : VIEW !== "yours")));
    return sheet.querySelector(".sheet-body");
  }
  function draw(){
    const body = frame(); if (!body) return;
    const y = body.dataset.sbh === VIEW ? body.scrollTop : KEEP[VIEW] || 0;
    EAGER = y > 0;
    body.dataset.sbh = VIEW; body.dataset.uiTab = VIEW;
    body.classList.add("sbh-body");
    body.innerHTML = VIEW === "yours" ? yoursHtml() : VIEW === "look" ? lookHtml() : VIEW === "maps" ? mapsHtml() : homeHtml();
    lazyRows(body);
    body.scrollTop = y; requestAnimationFrame(() => { if (body.isConnected && Math.abs(body.scrollTop - y) > 2) body.scrollTop = y; });
    body.addEventListener("scroll", () => { KEEP[VIEW] = body.scrollTop; }, {passive: true});
    fit();
    const q = body.querySelector("#sbhQ");
    if (q) q.addEventListener("input", () => { Q = q.value; const r = body.querySelector("#sbhRes"), h = body.querySelector(".sbh-home"), t = Q.trim(); r.hidden = !t; h.hidden = !!t; r.innerHTML = t ? resultsHtml(t) : ""; });
  }
  // Rows further down are drawn just before they scroll into view, or in a quiet moment, so the shop opens at once
  let rowIO = null;
  function fillRow(el){ if (!el.isConnected || !el.dataset.wait) return; const r = ROWS[+el.dataset.wait]; el.removeAttribute("data-wait"); const h = rowHtml(r); if (h) el.outerHTML = h; else el.remove(); }
  function lazyRows(body){
    const waits = [...body.querySelectorAll("[data-wait]")]; if (!waits.length) return;
    if (rowIO) rowIO.disconnect();
    if (!window.IntersectionObserver) { waits.forEach(fillRow); return; }
    rowIO = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { rowIO.unobserve(e.target); fillRow(e.target); } }), {root: body, rootMargin: "500px 0px"});
    waits.forEach(w => rowIO.observe(w));
    const idle = window.requestIdleCallback || (f => setTimeout(() => f({timeRemaining: () => 8}), 60));
    const step = () => idle(d => { const w = body.querySelector("[data-wait]"); if (!w || !body.isConnected) return; if (d.timeRemaining() > 6) { rowIO.unobserve(w); fillRow(w); } step(); }, {timeout: 1500});
    setTimeout(step, 400);
  }
  // The board preview is drawn small and scaled up to fill its box
  function fit(){
    const st = dlg.querySelector(".sbh-stage"); if (!st) return;
    const w = st.clientWidth; if (w) st.style.setProperty("--k", (w / 320).toFixed(3));
  }
  addEventListener("resize", () => { if (VIEW === "look") fit(); });
  // A category page (See All): a way back to the Shop, with the page's name
  function dress(tab){
    const sheet = sheetOf(), body = frame(); if (!sheet || !body) return;
    body.classList.remove("sbh-body"); delete body.dataset.sbh;
    if (body.querySelector(".sbh-back")) return;
    body.insertAdjacentHTML("afterbegin", `<div class="sbh-back"><button type="button" class="link-btn" data-act="sbh-go" data-id="home">‹ Shop</button><h3>${esc(NAMES[tab] || "")}</h3><span class="mini">${esc(SUBS[tab] || "")}</span></div>`);
  }

  const prev = styleShop;
  styleShop = function(tab){
    const open = dlg.open && !!dlg.querySelector(".sheet.shop, .sbc-sheet");
    const t = tab || (open ? VIEW : "home");
    if (!open && !tab) { Q = ""; LDARK = null; Object.keys(KEEP).forEach(k => delete KEEP[k]); }
    VIEW = t;
    if (OURS.includes(t)) {
      const r = prev.call(this, "notes");
      ui.shopTab = t;
      if (t === "look" && !LOOK) startLook("", "");
      try { draw(); } catch (e) { console.warn("shop home", e); }
      return r;
    }
    const r = prev.apply(this, arguments);
    try { dress(t); } catch (e) { console.warn("shop see all", e); }
    return r;
  };

  hook("act", (act, el) => {
    if (!el || !el.dataset) return false;
    if (act === "sbh-go") { const id = el.dataset.id; if (id !== VIEW) KEEP[id] = 0; if (id === "look" && !LOOK) startLook("", ""); styleShop(id); return true; }
    if (act === "sbh-try") { startLook(el.dataset.kind, el.dataset.id); styleShop("look"); return true; }
    if (act === "sbh-slot") { OPEN = OPEN === el.dataset.id ? "" : el.dataset.id; draw(); return true; }
    if (act === "sbh-pick") { const s = el.dataset.slot, id = el.dataset.id; if (s === "skin") matchTo(id); else LOOK[s] = id; draw(); return true; }
    if (act === "sbh-dark") { LDARK = el.dataset.id === "1"; draw(); return true; }
    if (act === "sbh-wear") { wear(); return true; }
    if (act === "sbh-bundle") {
      if (!LOOK || !CR() || !CR().buyBundle) return true;
      if (CR().signedIn && !CR().signedIn()) { toast("Sign in first to buy with credits."); return true; }
      const r = rec(LOOK.skin) || {}, mine = (k, id) => (k === "card" && r.card === id) || (k === "pin" && (r.pins || []).includes(id));
      const items = [["card", LOOK.card], ["pin", LOOK.pin], ["cm", LOOK.cm]].filter(([k, id]) => id && !has(k, id) && price(k, id) && !mine(k, id));
      CR().buyBundle(LOOK.skin, items.slice(0, 5), el).then(ok => { if (ok) { wear(); } });
      return true;
    }
    return false;
  });
  window.SBSHOPHOME = {view: () => VIEW, look: () => (LOOK ? Object.assign({}, LOOK) : null)};
})();
