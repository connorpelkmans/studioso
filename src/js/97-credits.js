/* ===== module: 97-credits.js ===== */
/* Studyboard Credits: buy credits on the website (Stripe), then keep shop items for good with them. A Theme Collection
   (300) brings its theme, its companions, its sticker pack, its pins and its flashcard style; a sticker pack or a flashcard
   style is 100, a pin 50. The server decides every price and the balance (supabase-credits.sql); this file only shows them,
   asks for a purchase, and remembers what the account owns so owns() in 01-style-shop.js can say yes on this device.
   Switched on with studyboard_config.item_purchases (see CREDITS-GUIDE.md). */
(() => {
  const K = "studyboard:credits";
  const KIND_NAME = {skin: "Theme Collection", sticker: "Sticker Pack", card: "Flashcard Style", pin: "Pin", note: "Note Shape"};
  // Shown until the server has answered once; the server's own prices always win when buying
  const DEFAULT_PRICES = {skin: 300, sticker: 100, card: 100, pin: 50, note: 100};
  // The Studyboard Credits coin (build-resources/credits-art: the gold coin, 96 px WebP)
  const COIN_SRC = "data:image/webp;base64,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";
  const COIN = `<img class="sbc-coin" src="${COIN_SRC}" width="20" height="20" alt="" aria-hidden="true">`;

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

  // A sticker drawn with its own gradient and clip names (the same sticker often sits on the page twice, and a copy that's
  // hidden would otherwise lend its colours to the visible one, washing it out)
  let stkN = 0;
  function stkPic(k){
    const svg = (STICKERS[k] || {}).svg || "", n = ++stkN;
    const own = svg.replace(/\bid=(["'])([^"']+)\1/g, (m, q, i) => `id=${q}${i}-c${n}${q}`).replace(/url\(#([^)]+)\)/g, (m, i) => `url(#${i}-c${n})`).replace(/href=(["'])#([^"']+)\1/g, (m, q, i) => `href=${q}#${i}-c${n}${q}`);
    return `<span class="stk-cell"><svg viewBox="0 0 64 64" aria-hidden="true">${own}</svg></span>`;
  }

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
          if (before && C.balance > before.balance) {
            const got = C.balance - before.balance;
            const bought = !!pending;
            if (pending) { added = {credits: got, balance: C.balance}; pending = null; }
            // bought credits arrive in a burst of light, like a new companion prop (anything else just says so)
            if (bought) { const bal = C.balance; setTimeout(() => burst(got, bal), 120); } // after the Credits sheet is drawn again, so it sits on top
            else if (!(dlg.open && dlg.querySelector(".sbc-sheet:not([data-kind])"))) toast(`${got} credits added. You have ${C.balance}.`);
          }
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
    if (kind === "skin") { const s = SKINS.find(x => x.id === id); return s ? skinPreview(s, isDark()) : ""; }
    if (kind === "sticker") { const p = STICKER_PACKS.find(x => x.id === id); return p ? `<div class="sbc-stk">${Object.keys(p.items).map(k => stkPic(k)).join("")}</div>` : ""; }
    if (kind === "card") return `<div class="cs-demo cs-${esc(id)}"><span class="face"><span class="face-label">Front</span><span class="face-text">Mitochondria</span></span></div>`;
    if (kind === "pin") return noteDemo(noteShapeOf(null), id, 1);
    if (kind === "note") return noteDemo(id, notePinOf(null), 1);
    return "";
  }
  const CHEV = `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const TICK = `<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  // Every piece of a Theme Collection, drawn as it looks in the app
  function insideHtml(th){
    const r = window.SBTP && SBTP.rec ? SBTP.rec(th) : null, tiles = [];
    let what = "";
    const tile = (label, sub, body, cls) => `<button type="button" class="sbc-in ${cls || ""}" data-act="sbc-zoom" data-what="${what}" data-th="${esc(th)}" aria-label="${esc(label)}: see bigger"><span class="sbc-in-l">${esc(label)}</span><span class="sbc-in-b">${body}</span>${sub ? `<span class="sbc-in-s">${esc(sub)}</span>` : ""}</button>`;
    const comps = (STYLE_LISTS.comp || []).filter(c => c.theme === th);
    if (comps.length) {
      const pic = c => { let u = ""; try { const h = window.SBCOMP && SBCOMP.head ? SBCOMP.head(c.id) : ""; u = h ? "data:image/svg+xml," + encodeURIComponent(h.replace("<svg ", h.includes("xmlns=") ? "<svg " : '<svg xmlns="http://www.w3.org/2000/svg" ')) : window.SBCOMP && SBCOMP.stillUrl ? SBCOMP.stillUrl(c.id) : ""; } catch (e) {} return `<figure title="${esc(c.name)}">${u ? `<img src="${esc(u)}" alt="${esc(c.name)}" width="40" height="40">` : ""}</figure>`; };
      what = "comps"; tiles.push(tile(comps.length === 1 ? "Companion" : `${comps.length} Companions`, comps.map(c => c.name).join(", "), `<div class="sbc-comps">${comps.map(pic).join("")}</div>`));
    }
    const p = r && r.pack && STICKER_PACKS.find(x => x.id === r.pack);
    if (p) { const keys = Object.keys(p.items); what = "stk"; tiles.push(tile(`${keys.length} Stickers`, p.name, `<div class="sbc-stk">${keys.map(k => stkPic(k)).join("")}</div>`)); }
    const cs = r && r.card && CARD_STYLES.find(x => x.id === r.card);
    if (cs) what = "card";
    if (cs) tiles.push(tile("Flashcard", cs.name, `<div class="cs-demo cs-${esc(cs.id)}"><span class="face"><span class="face-label">Front</span><span class="face-text">Mitochondria</span></span></div>`));
    if (r && r.pins && r.pins.length) {
      what = "pins";
      const names = r.pins.map(pid => ((PINS.find(x => x.id === pid) || {}).name || "")).filter(Boolean).join(" · ");
      tiles.push(tile(r.pins.length === 1 ? "Pin" : `${r.pins.length} Pins`, names, `<div class="sbc-pins">${r.pins.map((pid, i) => noteDemo(i ? "rounded" : "classic", pid, i + 2)).join("")}</div>`));
    }
    return tiles.length ? `<div class="sbc-inside"><h3 class="sbc-h">What's Inside</h3><div class="sbc-in-grid">${tiles.join("")}</div></div>` : "";
  }
  // A bigger look at one piece of a collection, over the buy sheet (Back or Escape returns)
  function zoomHtml(what, th){
    const r = window.SBTP && SBTP.rec ? SBTP.rec(th) : null;
    if (what === "comps") {
      const comps = (STYLE_LISTS.comp || []).filter(c => c.theme === th);
      return [comps.length === 1 ? "Companion" : `${comps.length} Companions`, `<div class="sbc-z-comps">${comps.map(c => { let u = ""; try { u = SBCOMP.stillUrl(c.id); } catch (e) {} return `<figure>${u ? `<img src="${esc(u)}" alt="">` : ""}<figcaption>${esc(c.name)}</figcaption></figure>`; }).join("")}</div><p class="sbc-note">They live on your board and cheer you on. Pick one in the Companion tab.</p>`];
    }
    if (what === "stk") {
      const p = r && r.pack && STICKER_PACKS.find(x => x.id === r.pack); if (!p) return null;
      return [`${p.name} · ${Object.keys(p.items).length} Stickers`, `<div class="sbc-z-stk">${Object.keys(p.items).map(k => stkPic(k)).join("")}</div><p class="sbc-note">Drag them onto your sticky notes from the envelope beside the Notes board.</p>`];
    }
    if (what === "card") {
      const cs = r && r.card && CARD_STYLES.find(x => x.id === r.card); if (!cs) return null;
      return [`Flashcard Style · ${cs.name}`, `<div class="sbc-z-card"><div class="cs-demo cs-${esc(cs.id)}"><span class="face"><span class="face-label">Front</span><span class="face-text">Mitochondria</span></span></div></div><p class="sbc-note">How your flashcards look while you study. Use it for every deck, or give one deck its own.</p>`];
    }
    if (what === "pins" && r && r.pins && r.pins.length) {
      return [r.pins.length === 1 ? "Pin" : `${r.pins.length} Pins`, `<div class="sbc-z-pins">${r.pins.map((pid, i) => `<figure>${noteDemo(i ? "rounded" : "classic", pid, i + 2)}<figcaption>${esc((PINS.find(x => x.id === pid) || {}).name || "")}</figcaption></figure>`).join("")}</div><p class="sbc-note">What holds your sticky notes to the board.</p>`];
    }
    return null;
  }
  function zoom(what, th){
    const sheet = dlg.querySelector(".sbc-sheet"); if (!sheet) return;
    const z = zoomHtml(what, th); if (!z) return;
    const body = sheet.querySelector(".sheet-body"); if (!body) return;
    let box = sheet.querySelector(".sbc-zoom");
    if (!box) { box = document.createElement("div"); box.className = "sbc-zoom"; body.appendChild(box); }
    sheet.dataset.scroll = body.scrollTop; body.scrollTop = 0;
    box.setAttribute("role", "dialog"); box.setAttribute("aria-label", z[0]);
    box.innerHTML = `<div class="sbc-zoom-h"><button type="button" class="btn small" data-act="sbc-zoom-x">Back</button><b>${esc(z[0])}</b></div><div class="sbc-zoom-b">${z[1]}</div>`;
    sheet.classList.add("zoomed");
    const back = box.querySelector('[data-act="sbc-zoom-x"]'); if (back) back.focus();
  }
  function unzoom(){
    const sheet = dlg.querySelector(".sbc-sheet.zoomed"); if (!sheet) return false;
    const box = sheet.querySelector(".sbc-zoom");
    if (box) box.remove(); sheet.classList.remove("zoomed");
    const body = sheet.querySelector(".sheet-body"); if (body) body.scrollTop = +sheet.dataset.scroll || 0;
    const t = sheet.querySelector(".sbc-in"); if (t) t.focus();
    return true;
  }
  // Escape closes the big view first, not the whole sheet
  document.addEventListener("keydown", e => { if (e.key === "Escape" && dlg.open && dlg.querySelector(".sbc-sheet.zoomed")) { e.preventDefault(); e.stopPropagation(); unzoom(); } }, true);
  function buySheet(kind, id, note){
    if (!dlg.open || !dlg.querySelector(".sbc-sheet")) backToShop = shopOpen();
    const cost = priceOf(kind, id), bal = balance(), mineOk = signedIn(), enough = bal >= cost;
    const it = kind === "skin" ? null : (kind === "sticker" ? STICKER_PACKS : STYLE_LISTS[kind] || []).find(x => x.id === id);
    const th = it && it.theme && !has("skin", it.theme) ? it.theme : "";
    const inside = kind === "skin" ? insideHtml(id) : "";
    const list = kind === "skin" && !inside ? contents(id) : [];
    const go = !mineOk ? `<button type="button" class="btn primary" data-act="sbc-signin">Sign In to Buy</button>`
      : enough ? `<button type="button" class="btn primary sbc-go" data-act="sbc-buy" data-kind="${esc(kind)}" data-id="${esc(id)}">Buy It for ${COIN}${cost} Credits</button>`
      : storeApp() ? "" : `<button type="button" class="btn primary" data-act="sbc-packs">Get Credits</button>`;
    const wallet = !mineOk ? `<p class="sbc-note">Credits belong to your account, so sign in first.</p>`
      : `<div class="sbc-wallet" role="status"><span class="sbc-wallet-l">Your balance</span><span class="sbc-wallet-n">${COIN}<b>${bal.toLocaleString()}</b></span>${enough ? `<span class="sbc-chip ok">${bal - cost} left after</span>` : `<span class="sbc-chip">${cost - bal} more needed</span>`}</div>${!enough && storeApp() ? `<p class="sbc-note">Buying credits isn't available in this app.</p>` : ""}`;
    openSheet(`<div class="sheet sbc-sheet sbc-buy" data-kind="${esc(kind)}" data-id="${esc(id)}">${head(nameOf(kind, id))}
      <div class="sheet-body">
        ${note ? `<p class="sbc-note sbc-why">${esc(note)}</p>` : ""}
        <div class="sbc-stage sbc-stage-${esc(kind)}" aria-hidden="true">${preview(kind, id)}${kind === "skin" ? `<span class="sbc-stage-l">Theme</span>` : ""}</div>
        <div class="sbc-price"><img class="sbc-price-coin" src="${COIN_SRC}" width="44" height="44" alt=""><span class="sbc-price-t"><b>${cost} credits</b>${KIND_NAME[kind] ? `<span>${esc(KIND_NAME[kind])}</span>` : ""}</span></div>
        ${inside}
        ${list.length ? `<ul class="sbc-list">${list.map(x => `<li>${TICK}<span>${esc(x)}</span></li>`).join("")}</ul>` : ""}
        ${wallet}
        ${th ? `<button type="button" class="sbc-upsell" data-act="sbc-item" data-kind="skin" data-id="${esc(th)}"><span class="sbc-upsell-t"><b>Get the whole ${esc(themeName(th))} Collection</b><span>The theme, its companions, stickers, pins and this style, for ${priceOf("skin", th)} credits</span></span>${CHEV}</button>` : ""}
      </div>
      <div class="sheet-foot"><button type="button" class="btn" data-act="sbc-back">${backToShop ? "Back to Shop" : "Not Now"}</button><span class="spacer"></span>${go}${PLAN.isPro() ? "" : `<button type="button" class="btn sbc-getpro" data-act="plan-open" title="Every collection while you're subscribed">Get Pro</button>`}</div></div>`);
  }
  const money = (cents, cur) => { try { return new Intl.NumberFormat(undefined, {style: "currency", currency: String(cur || "usd").toUpperCase()}).format(cents / 100); } catch (e) { return "$" + (cents / 100).toFixed(2); } };
  function packsSheet(){
    if (!dlg.open || !dlg.querySelector(".sbc-sheet")) backToShop = shopOpen();
    if (pending && Date.now() - pending.at > 30 * 60000) pending = null;
    if (added || pending) {
      const body = added
        ? `<div class="sbc-done" role="status"><img class="sbc-done-coin" src="${COIN_SRC}" width="64" height="64" alt=""><b>${added.credits.toLocaleString()} credits added</b><span>You have ${added.balance.toLocaleString()} credits. Pick anything in the Style Shop to keep it for good.</span></div>`
        : `<div class="sbc-wait" role="status"><span class="sbc-spin" aria-hidden="true"></span><b>Finish paying in the checkout tab</b><span>${pending.credits ? `Your ${pending.credits.toLocaleString()} credits` : "Your credits"} appear here as soon as Stripe confirms the payment. You can keep using Studyboard meanwhile.</span>
            <div class="sbc-wait-acts"><button type="button" class="btn small" data-act="sbc-reopen">Open Checkout Again</button><button type="button" class="btn small" data-act="sbc-check">Check Now</button></div></div>`;
      openSheet(`<div class="sheet sbc-sheet">${head("Studyboard Credits")}
        <div class="sheet-body">${body}</div>
        <div class="sheet-foot">${added ? "" : `<button type="button" class="btn" data-act="sbc-cancel">Choose Another Pack</button>`}<span class="spacer"></span><button type="button" class="btn primary" data-act="sbc-back">${backToShop ? "Back to Shop" : "Done"}</button></div></div>`);
      return;
    }
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
  // A checkout that's open in another tab: {pack, credits, url, at, from}. The Credits sheet shows it until the credits arrive.
  let pending = null, added = null;
  async function buyPack(id, btn){
    if (!planOk() || !PLAN.checkoutCall) return;
    const all = dlg.querySelectorAll(".sbc-pack"); all.forEach(b => { b.disabled = true; });
    if (btn) btn.classList.add("busy");
    const held = PLAN.holdTab ? PLAN.holdTab() : null;
    const r = await PLAN.checkoutCall({pack: id});
    all.forEach(b => { if (b.isConnected) b.disabled = false; });
    if (btn && btn.isConnected) btn.classList.remove("busy");
    if (r && r.url) {
      const pk = ((mine() || {}).packs || []).find(x => x.id === id) || {};
      pending = {pack: id, credits: +pk.credits || 0, url: r.url, at: Date.now(), from: balance()}; added = null;
      PLAN.openExternal(r.url, held); watch();
      if (dlg.open && dlg.querySelector(".sbc-sheet:not([data-kind])")) packsSheet();
      return;
    }
    if (PLAN.dropTab) PLAN.dropTab(held);
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
      case "sbc-reopen": if (pending) PLAN.openExternal(pending.url); return true;
      case "sbc-check": load(); toast("Checking for your credits…"); return true;
      case "sbc-cancel": pending = null; packsSheet(); return true;
      case "sbc-zoom": zoom(el.dataset.what, el.dataset.th); return true;
      case "sbc-zoom-x": unzoom(); return true;
      case "sbc-signin": if (dlg.open) dlg.close(); setTimeout(() => { if (window.SBGUEST) SBGUEST.signUp(); else if (typeof sbSignInSheet === "function") sbSignInSheet(); }, 120); return true;
      case "sbc-back": added = null; if (backToShop) styleShop(); else if (dlg.open) dlg.close(); return true;
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
      b.setAttribute("aria-label", `Buy ${nameOf(b.dataset.kind, b.dataset.id)} for ${n} credits`);
    });
  }
  // Rows the shop fills in later (collections, See All) get their prices too
  try { new MutationObserver(() => { if (dlg.open && dlg.querySelector('[data-act="shop-unlock"]:not([data-cr])')) label(dlg); }).observe(dlg, {childList: true, subtree: true}); } catch (e) {}

  /* Credits you bought: shown in the middle of the screen in a burst of light, the number counting up in the middle (the same look as a new
     companion prop, 98-companion.css .cpu) */
  const SPARK = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c.6 6.2 5.8 11.4 12 12-6.2.6-11.4 5.8-12 12-.6-6.2-5.8-11.4-12-12C6.2 11.4 11.4 6.2 12 0z"/></svg>';
  const calm = () => { try { return (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) || !!(window.SBMotion && SBMotion.level() !== "full"); } catch (e) { return false; } };
  function burst(got, bal){
    got = Math.max(0, Math.round(+got || 0)); if (!got) return;
    const old = document.querySelector(".cpu.sbc-burst"); if (old) old.remove();
    const still = calm(), o = document.createElement("div");
    o.className = "cpu sbc-burst" + (still ? " cpu-still" : ""); o.setAttribute("role", "dialog"); o.setAttribute("aria-modal", "true"); o.setAttribute("aria-labelledby", "sbcBurstName"); o.setAttribute("aria-describedby", "sbcBurstHow");
    if (o.showPopover) o.setAttribute("popover", "manual");
    const sp = (x, y, d, z) => `<span class="cpu-spark" style="left:${x}%;top:${y}%;animation-delay:${d}s;width:${z}px;height:${z}px" aria-hidden="true">${SPARK}</span>`;
    const n = got.toLocaleString();
    o.innerHTML = `<div class="cpu-dim"></div><div class="cpu-box">
      <div class="cpu-stage" aria-hidden="true"><span class="cpu-rays"></span><span class="cpu-rays b"></span><span class="cpu-glow"></span>
        ${sp(8, 18, 0, 20)}${sp(84, 12, .5, 16)}${sp(90, 70, 1.1, 22)}${sp(4, 74, .8, 14)}${sp(48, -4, 1.4, 12)}
        <span class="cpu-prop sbc-bnum"><b data-sbc-count style="font-size:${n.length > 5 ? 2.1 : n.length > 4 ? 2.5 : 3}rem">${still ? n : "0"}</b><small>credits</small></span></div>
      <span class="cpu-kick">Credits Added!</span><h2 class="cpu-name" id="sbcBurstName">+${n} Credits</h2>
      <p class="cpu-how" id="sbcBurstHow">Thanks for your purchase. You have ${(+bal || 0).toLocaleString()} credits to spend.</p>
      <div class="cpu-acts"><button type="button" class="btn cpu-wear" data-sbc-burst="ok">Got It</button></div></div>`;
    // inside an open window (the Credits sheet): a modal window leaves everything outside it untouchable
    (dlg.open ? dlg : document.body).appendChild(o);
    try { if (o.showPopover) o.showPopover(); } catch (e) {}
    try { if (typeof sbHaptic === "function") sbHaptic("success", {force: true}); } catch (e) {}
    // the number counts up as the disc pops in
    const el = o.querySelector("[data-sbc-count]");
    if (!still) { const t0 = performance.now() + 250, dur = Math.min(1400, 600 + got * 2);
      const step = now => { if (!o.isConnected) return; const f = Math.max(0, Math.min(1, (now - t0) / dur)), e = 1 - Math.pow(1 - f, 3); el.textContent = Math.round(got * e).toLocaleString(); if (f < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step); }
    const back = document.activeElement;
    setTimeout(() => { const b = o.querySelector("[data-sbc-burst]"); if (b) try { b.focus({preventScroll: true}); } catch (e) {} }, 60);
    let closed = false;
    const close = () => {
      if (closed) return; closed = true; o.classList.add("cpu-out");
      setTimeout(() => { try { if (o.hidePopover && o.matches(":popover-open")) o.hidePopover(); } catch (e) {} o.remove(); }, still ? 0 : 260);
      try { if (back && back.isConnected && back.focus) back.focus({preventScroll: true}); } catch (e) {}
    };
    o.addEventListener("click", e => { if (e.target.closest && e.target.closest("[data-sbc-burst]")) close(); });
    o.addEventListener("keydown", e => { if (e.key === "Escape" || e.key === "Tab") { e.preventDefault(); if (e.key === "Escape") close(); } });
  }
  if (!document.getElementById("sbc-burst-css")) { const st = document.createElement("style"); st.id = "sbc-burst-css";
    st.textContent = `.sbc-bnum{display:flex!important;flex-direction:column;align-items:center;justify-content:center;gap:0;color:#7A4A00;font-family:var(--display)}
.sbc-bnum b{font:900 3rem/1 var(--display);font-variant-numeric:tabular-nums;letter-spacing:-.02em;text-shadow:0 2px 0 rgba(255,255,255,.7)}
.sbc-bnum small{margin-top:2px;font:800 .78rem/1 var(--display);letter-spacing:.14em;text-transform:uppercase;color:#A0670A}
.sbc-bnum b:not(:only-child){max-width:136px;overflow:hidden}`;
    document.head.appendChild(st); }
  window.SBCREDITS = {burst, owns, priceOf, balance, load, buySheet, packsSheet, enabled, contents,
    // For tests: what this device remembers
    state: () => (mine() ? JSON.parse(JSON.stringify(mine())) : null)};
  if (window.__SB_TEST) Object.assign(window.SBCREDITS, {fake: (client, user) => { fake = {sb: client, user}; seenUid = ""; rebuild(); scheduleRender(); }, shop: () => styleShop(), unlock: (k, id) => shopUnlock(k, id), pending: () => pending, added: () => added, comps: th => (STYLE_LISTS.comp || []).filter(c => c.theme === th).map(c => c.id)});
})();
