/* ===== module: 97-credits.js ===== */
/* Studyboard Credits: buy credits on the website (Stripe), then keep shop items for good with them. A Theme Collection
   (300) brings its theme, its companions, its sticker pack, its pins and its flashcard style; a sticker pack or a flashcard
   style is 100, a pin 50. The server decides every price and the balance (supabase-credits.sql); this file only shows them,
   asks for a purchase, and remembers what the account owns so owns() in 01-style-shop.js can say yes on this device.
   Switched on with studyboard_config.item_purchases (see CREDITS-GUIDE.md). */
(() => {
  const K = "studyboard:credits";
  const KIND_NAME = {skin: "Theme Collection", sticker: "Sticker Pack", card: "Flashcard Style", pin: "Pin"};
  // Shown until the server has answered once; the server's own prices always win when buying
  const DEFAULT_PRICES = {skin: 300, sticker: 100, card: 100, pin: 50};
  const COIN = `<svg class="sbc-coin" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><circle cx="12" cy="12" r="9.5" fill="currentColor" opacity=".18"/><circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 6.8l1.5 3.2 3.5.4-2.6 2.4.7 3.4L12 14.5l-3.1 1.7.7-3.4L7 10.4l3.5-.4z" fill="currentColor"/></svg>`;

  // Tests swap in their own server and account (window.__SB_TEST only)
  let fake = null;
  const cl = () => (fake ? fake.sb : typeof sb !== "undefined" ? sb : null);
  const usr = () => (fake ? fake.user : typeof sbUser !== "undefined" ? sbUser : null);
  let C = null;
  try { C = JSON.parse(localStorage.getItem(K) || "null"); } catch (e) { C = null; }
  let owned = new Set();
  const mine = () => { const u = usr(); return C && u && C.uid === u.id ? C : null; };
  function rebuild(){
    const m = mine();
    owned = new Set(m && Array.isArray(m.owned) ? m.owned.filter(x => Array.isArray(x) && x.length === 2).map(x => x[0] + ":" + x[1]) : []);
  }
  rebuild();
  const save = () => { try { localStorage.setItem(K, JSON.stringify(C)); } catch (e) {} };
  const balance = () => { const m = mine(); return m && Number.isFinite(+m.balance) ? +m.balance : 0; };
  const prices = () => Object.assign({}, DEFAULT_PRICES, (mine() && mine().prices) || {});
  const planOk = () => typeof PLAN !== "undefined" && !!PLAN;
  // On when the paywall is on and studyboard_config.item_purchases is true
  const enabled = () => { try { return STORE.paywall && planOk() && !!PLAN.config().item_purchases && !inPreview(); } catch (e) { return false; } };
  const signedIn = () => { const u = usr(); return !!u && !u.is_anonymous; };
  const storeApp = () => { try { return planOk() && PLAN.storeRoute(); } catch (e) { return false; } };

  /* ---------- Ownership ---------- */
  const has = (kind, id) => owned.has(kind + ":" + id);
  // The item itself, or (for a companion, sticker pack, pin or flashcard style) the Theme Collection it comes with
  function owns(kind, id){
    if (!owned.size || !id) return false;
    if (has(kind, id)) return true;
    if (kind === "skin") return false;
    const it = (STYLE_LISTS[kind] || []).find(x => x.id === id);
    return !!(it && it.theme && has("skin", it.theme));
  }
  // What an item costs, or 0 when it can't be bought with credits (free items, note shapes, accessories)
  function priceOf(kind, id){
    const p = prices()[kind]; if (!p) return 0;
    const list = kind === "skin" ? SKINS : STYLE_LISTS[kind] || [];
    const it = list.find(x => x.id === id);
    return it && it.tier === "pro" ? +p : 0;
  }
  const themeName = th => ((SKINS.find(x => x.id === th) || {}).name || th);
  function nameOf(kind, id){
    if (kind === "skin") return themeName(id) + " Collection";
    const it = (kind === "sticker" ? STICKER_PACKS : STYLE_LISTS[kind] || []).find(x => x.id === id);
    return it ? String(it.name).replace(/\s*\(Default\)\s*$/i, "") : id;
  }
  // Everything a Theme Collection brings
  function contents(th){
    const r = window.SBTP && SBTP.rec ? SBTP.rec(th) : null, out = [];
    const comps = (STYLE_LISTS.comp || []).filter(c => c.theme === th);
    out.push("The " + themeName(th) + " theme");
    if (comps.length) out.push(comps.length === 1 ? `Its companion, ${comps[0].name}` : `Its ${comps.length} companions: ${comps.map(c => c.name).join(", ")}`);
    if (r && r.pack) { const p = STICKER_PACKS.find(x => x.id === r.pack); if (p) out.push(`${p.name} (${Object.keys(p.items).length} stickers)`); }
    if (r && r.pins && r.pins.length) out.push(r.pins.length === 1 ? "Its pin" : `Its ${r.pins.length} pins`);
    if (r && r.card) out.push("Its flashcard style");
    return out;
  }

  /* ---------- Talking to the server ---------- */
  let loading = null;
  async function load(){
    if (!cl() || !signedIn() || inPreview()) return null;
    if (loading) return loading;
    loading = (async () => {
      try {
        const {data, error} = await cl().rpc("studyboard_credits_me");
        if (error || !data || typeof data !== "object") return null;
        const before = mine(), was = before ? JSON.stringify([before.balance, before.owned]) : "";
        C = Object.assign({}, data, {uid: usr().id, at: Date.now()});
        save(); rebuild();
        if (was !== JSON.stringify([C.balance, C.owned])) {
          if (before && C.balance > before.balance) toast(`${C.balance - before.balance} credits added. You have ${C.balance}.`);
          try { applySkin(); } catch (e) {}
          scheduleRender(); redrawOpen();
        }
        return C;
      } catch (e) { return null; } finally { loading = null; }
    })();
    return loading;
  }
  // After a purchase on the website: check again for a few minutes, and whenever the app comes back
  let watchUntil = 0, watchT = 0;
  function watch(){
    watchUntil = Date.now() + 4 * 60000; clearTimeout(watchT);
    const tick = () => { if (Date.now() > watchUntil) return; load(); watchT = setTimeout(tick, 8000); };
    watchT = setTimeout(tick, 5000);
  }
  document.addEventListener("visibilitychange", () => { if (!document.hidden && Date.now() < watchUntil) load(); });

  /* ---------- Sheets ---------- */
  let backToShop = false;
  const shopOpen = () => !!(dlg.open && dlg.querySelector(".sheet.shop, .sheet.ui-shop"));
  function redrawOpen(){
    try {
      const s = dlg.open && dlg.querySelector(".sbc-sheet");
      if (s && s.dataset.kind) buySheet(s.dataset.kind, s.dataset.id);
      else if (s) packsSheet();
      else if (shopOpen()) styleShop();
    } catch (e) {}
  }
  function preview(kind, id){
    if (kind === "skin") { const s = SKINS.find(x => x.id === id); return s ? `<div class="sbc-prev">${skinPreview(s, isDark())}</div>` : ""; }
    if (kind === "sticker") { const p = STICKER_PACKS.find(x => x.id === id); return p ? `<div class="sbc-prev sbc-stk">${Object.keys(p.items).slice(0, 8).map(k => `<span class="stk-cell">${stickerSvg(k)}</span>`).join("")}</div>` : ""; }
    if (kind === "card") return `<div class="sbc-prev"><div class="cs-demo cs-${esc(id)}"><span class="face"><span class="face-label">Front</span><span class="face-text">Mitochondria</span></span></div></div>`;
    if (kind === "pin") return `<div class="sbc-prev">${noteDemo(noteShapeOf(null), id, 1)}</div>`;
    return "";
  }
  function buySheet(kind, id, note){
    if (!dlg.open || !dlg.querySelector(".sbc-sheet")) backToShop = shopOpen();
    const cost = priceOf(kind, id), bal = balance(), mineOk = signedIn(), enough = bal >= cost;
    const it = kind === "skin" ? null : (kind === "sticker" ? STICKER_PACKS : STYLE_LISTS[kind] || []).find(x => x.id === id);
    const th = it && it.theme && !has("skin", it.theme) ? it.theme : "";
    const list = kind === "skin" ? contents(id) : [];
    const go = !mineOk ? `<button type="button" class="btn primary" data-act="sbc-signin">Sign In to Buy</button>`
      : enough ? `<button type="button" class="btn primary" data-act="sbc-buy" data-kind="${esc(kind)}" data-id="${esc(id)}">${COIN} Keep It for ${cost} Credits</button>`
      : storeApp() ? "" : `<button type="button" class="btn primary" data-act="sbc-packs">Get Credits</button>`;
    openSheet(`<div class="sheet sbc-sheet" data-kind="${esc(kind)}" data-id="${esc(id)}">${head(nameOf(kind, id))}
      <div class="sheet-body">
        ${note ? `<p class="plan-reason" role="status"><span>${esc(note)}</span></p>` : ""}
        ${preview(kind, id)}
        <p class="sbc-cost">${COIN}<b>${cost} Credits</b><span class="mini">${esc(KIND_NAME[kind] || "")} · Yours for good, with or without Pro</span></p>
        ${list.length ? `<div class="sbc-has"><b>Comes With</b><ul>${list.map(x => `<li>${esc(x)}</li>`).join("")}</ul></div>` : ""}
        ${th ? `<p class="mini sbc-alt">This comes with the ${esc(themeName(th))} Theme Collection, which also brings the theme, its companions and the rest of its pieces for ${priceOf("skin", th)} credits. <button type="button" class="link-btn" data-act="sbc-item" data-kind="skin" data-id="${esc(th)}">See the Collection</button></p>` : ""}
        ${mineOk ? `<p class="sbc-bal" role="status">You have <b>${bal}</b> credit${bal === 1 ? "" : "s"}.${enough ? "" : ` You need ${cost - bal} more.`}${!enough && storeApp() ? " Buying credits isn't available in this app." : ""}</p>` : `<p class="mini">Credits belong to your account, so sign in first.</p>`}
        <p class="mini sbc-pro">Or <button type="button" class="link-btn" data-act="plan-open">go Pro</button> to use every theme and style while you're subscribed.</p>
      </div>
      <div class="sheet-foot"><button type="button" class="btn" data-act="sbc-back">${backToShop ? "Back to Shop" : "Not Now"}</button><span class="spacer"></span>${go}</div></div>`);
  }
  const money = (cents, cur) => { try { return new Intl.NumberFormat(undefined, {style: "currency", currency: String(cur || "usd").toUpperCase()}).format(cents / 100); } catch (e) { return "$" + (cents / 100).toFixed(2); } };
  function packsSheet(){
    if (!dlg.open || !dlg.querySelector(".sbc-sheet")) backToShop = shopOpen();
    const m = mine(), packs = m && Array.isArray(m.packs) ? m.packs : null, base = packs && packs[0] ? packs[0].cents / packs[0].credits : 0;
    const body = !signedIn() ? `<p style="margin:0">Credits belong to your account. Sign in or create a free account first.</p>`
      : storeApp() ? `<p style="margin:0">Buying credits isn't available in this app. Credits you already have work here.</p>`
      : !packs ? `<p class="mini" style="margin:0">Loading…</p>`
      : `<div class="sbc-packs">${packs.map(p => { const bonus = base ? Math.round((1 - p.cents / p.credits / base) * 100) : 0;
          return `<button type="button" class="sbc-pack${p.badge === "Best Value" ? " best" : ""}" data-act="sbc-pack" data-id="${esc(p.id)}">${p.badge ? `<span class="pp-flag">${esc(p.badge)}</span>` : ""}<span class="sbc-pack-n">${COIN}<b>${esc(Number(p.credits).toLocaleString())}</b> credits</span><span class="sbc-pack-p">${esc(money(p.cents, p.currency))}</span>${bonus >= 5 && !p.badge ? `<span class="mini">${bonus}% more per dollar</span>` : ""}</button>`; }).join("")}</div>
        <p class="mini" style="margin:0">A Theme Collection is ${prices().skin} credits (with its companions, stickers, pins and flashcard style), a sticker pack or flashcard style ${prices().sticker}, a pin ${prices().pin}. Credits don't expire, and what you keep stays yours even without Pro. You'll pay securely with Stripe on the Studyboard website.</p>`;
    openSheet(`<div class="sheet sbc-sheet">${head("Studyboard Credits")}
      <div class="sheet-body">
        ${signedIn() ? `<p class="sbc-bal sbc-bal-big" role="status">${COIN}<span>You have <b>${balance()}</b> credit${balance() === 1 ? "" : "s"}</span></p>` : ""}
        ${body}
      </div>
      <div class="sheet-foot"><button type="button" class="btn" data-act="sbc-back">${backToShop ? "Back to Shop" : "Close"}</button><span class="spacer"></span>${signedIn() ? "" : `<button type="button" class="btn primary" data-act="sbc-signin">Sign In</button>`}</div></div>`);
    if (!packs && signedIn()) load().then(() => { if (dlg.open && dlg.querySelector(".sbc-sheet:not([data-kind])")) packsSheet(); });
  }
  let busy = false;
  async function buy(kind, id, btn){
    if (busy) return; busy = true;
    if (btn) { btn.disabled = true; btn.setAttribute("aria-busy", "true"); }
    let r = null;
    try { const {data, error} = await cl().rpc("studyboard_buy_item", {p_kind: kind, p_item: id}); r = error ? {error: "network"} : data; } catch (e) { r = {error: "network"}; }
    busy = false;
    if (btn && btn.isConnected) { btn.disabled = false; btn.removeAttribute("aria-busy"); }
    const ERR = {off: "Buying with credits isn't available right now.", sign_in: "Sign in first, then try again.", bad_item: "That item can't be bought with credits.",
      slow_down: "That's a lot of purchases. Wait a little, then try again.", network: "Couldn't reach Studyboard. Check your connection and try again."};
    if (!r || !r.ok) {
      if (r && r.error === "not_enough") { if (C && typeof r.balance === "number") { C.balance = r.balance; save(); } buySheet(kind, id); return; }
      toast(ERR[r && r.error] || ERR.network); return;
    }
    C = Object.assign({}, mine() || {uid: usr().id, owned: []}, {balance: typeof r.balance === "number" ? r.balance : balance()});
    C.owned = (C.owned || []).concat([[kind, id]]); save(); rebuild();
    try { applySkin(); } catch (e) {}
    const wasShop = backToShop;
    if (dlg.open) dlg.close();
    scheduleRender();
    const left = `${C.balance} credit${C.balance === 1 ? "" : "s"} left.`;
    if (kind === "skin") toast(`The ${themeName(id)} Collection is yours for good. ${left}`, null, {label: "Use It Now", fn: () => { saveStyle({skin: id}); applySkin(); render(); }});
    else toast(`${nameOf(kind, id)} is yours for good. ${left}`);
    if (wasShop) setTimeout(() => { try { styleShop(); } catch (e) {} }, 120);
    load();
  }
  async function buyPack(id, btn){
    if (!planOk() || !PLAN.checkoutCall) return;
    if (btn) btn.disabled = true;
    toast("Opening checkout…");
    const r = await PLAN.checkoutCall({pack: id});
    if (btn && btn.isConnected) btn.disabled = false;
    if (r && r.url) { PLAN.openExternal(r.url); toast("Finish in the checkout page that just opened. Your credits show up here by themselves."); watch(); return; }
    toast((r && r.message) || "Couldn't open checkout. Check your connection and try again.");
  }

  /* ---------- Hooks ---------- */
  // 10-plan.js asks here first when a locked item is tapped (only while item_purchases is on)
  hook("plan-buy-item", (kind, id) => {
    if (!enabled()) return false;
    if (kind === "comp") {
      const c = (STYLE_LISTS.comp || []).find(x => x.id === id);
      if (c && c.theme && priceOf("skin", c.theme)) { buySheet("skin", c.theme, `${c.name} comes with the ${themeName(c.theme)} Theme Collection.`); return true; }
      return false;
    }
    if (!priceOf(kind, id)) return false;
    buySheet(kind, id); return true;
  });
  hook("act", (act, el) => {
    switch (act) {
      case "sbc-packs": packsSheet(); return true;
      case "sbc-item": buySheet(el.dataset.kind, el.dataset.id); return true;
      case "sbc-buy": buy(el.dataset.kind, el.dataset.id, el); return true;
      case "sbc-pack": buyPack(el.dataset.id, el); return true;
      case "sbc-signin": if (dlg.open) dlg.close(); setTimeout(() => { if (window.SBGUEST) SBGUEST.signUp(); else if (typeof sbSignInSheet === "function") sbSignInSheet(); }, 120); return true;
      case "sbc-back": if (backToShop) styleShop(); else if (dlg.open) dlg.close(); return true;
    }
    return false;
  });
  hook("menu", () => enabled() && signedIn() ? `<button data-act="sbc-packs" data-group="account"><span>Studyboard Credits<span class="sub">${balance()} credit${balance() === 1 ? "" : "s"} · Keep themes, stickers and more for good</span></span></button>` : "");
  // Sign-in changes: load this account's credits
  let seenUid = "";
  hook("render", () => {
    const u = signedIn() ? usr().id : "";
    if (u === seenUid) return;
    seenUid = u; rebuild();
    if (u && STORE.paywall) load();
  });

  /* The Style Shop: the balance in its header (always in view while the list scrolls), and each locked item's price on its
     button. Hidden from Pro subscribers, who have every item, unless they've bought credits or still have some. */
  const bought = () => { const m = mine(); return !!(m && m.bought); };
  const showBar = () => enabled() && (!PLAN.isPro() || bought() || balance() > 0);
  const origShop = styleShop;
  styleShop = function(){
    const r = origShop.apply(this, arguments);
    try {
      const hd = dlg.querySelector(".sheet.shop .sheet-head, .sheet.ui-shop .sheet-head");
      if (hd && showBar() && !hd.querySelector(".sbc-pill")) {
        const n = balance(), txt = signedIn() ? `<b>${n.toLocaleString()}</b><span class="sbc-pill-l">credit${n === 1 ? "" : "s"}</span>` : `<span class="sbc-pill-l">Credits</span>`;
        const close = hd.querySelector('[data-act="close"]');
        const pill = `<button type="button" class="sbc-pill" data-act="sbc-packs" title="Studyboard Credits: keep any Pro item for good" aria-label="${signedIn() ? `You have ${n} credits. Get more` : "Studyboard Credits"}">${COIN}${txt}</button>`;
        if (close) close.insertAdjacentHTML("beforebegin", pill); else hd.insertAdjacentHTML("beforeend", pill);
        hd.classList.add("has-cr");
      }
      label(dlg);
    } catch (e) { console.warn("credits pill", e); }
    return r;
  };
  function label(root){
    if (!enabled() || PLAN.isPro()) return;
    root.querySelectorAll('[data-act="shop-unlock"]:not([data-cr])').forEach(b => {
      b.dataset.cr = "1";
      const n = priceOf(b.dataset.kind, b.dataset.id); if (!n) return;
      b.innerHTML = `🔒 ${n} Credits`;
      b.setAttribute("aria-label", `Keep ${nameOf(b.dataset.kind, b.dataset.id)} for ${n} credits`);
    });
  }
  // Rows the shop fills in later (collections, See All) get their prices too
  try { new MutationObserver(() => { if (dlg.open && dlg.querySelector('[data-act="shop-unlock"]:not([data-cr])')) label(dlg); }).observe(dlg, {childList: true, subtree: true}); } catch (e) {}

  window.SBCREDITS = {owns, priceOf, balance, load, buySheet, packsSheet, enabled, contents,
    // For tests: what this device remembers
    state: () => (mine() ? JSON.parse(JSON.stringify(mine())) : null)};
  if (window.__SB_TEST) Object.assign(window.SBCREDITS, {fake: (client, user) => { fake = {sb: client, user}; seenUid = ""; rebuild(); scheduleRender(); }, shop: () => styleShop(), unlock: (k, id) => shopUnlock(k, id), comps: th => (STYLE_LISTS.comp || []).filter(c => c.theme === th).map(c => c.id)});
})();
