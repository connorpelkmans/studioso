/* ===== module: 97-credits.js ===== */
/* Studyboard Bucks (the green bills): buy Bucks on the website (Stripe), then keep shop items for good with them. A Theme Collection
   (300) brings its theme, its companions, its sticker pack, its pins and its flashcard style; a sticker pack or a flashcard
   style is 100, a pin 50. The server decides every price and the balance (supabase-credits.sql); this file only shows them,
   asks for a purchase, and remembers what the account owns so owns() in 01-style-shop.js can say yes on this device.
   Switched on with studyboard_config.item_purchases (see CREDITS-GUIDE.md).
   The server still calls them credits (studyboard_credit_* tables, studyboard_credits_me, packs like credits_300): Bucks are what
   students see. The earned Studyboard Credits (gold coins, for companion accessories) are a separate currency: 98-0study-credits.js. */
(() => {
  const K = "studyboard:credits";
  const KIND_NAME = {skin: "Theme Collection", sticker: "Sticker Pack", card: "Flashcard Style", pin: "Pin", note: "Note Shape", cm: "Concept Map Style"};
  // Shown until the server has answered once; the server's own prices always win when buying
  const DEFAULT_PRICES = {skin: 300, sticker: 100, card: 100, pin: 50, note: 100};
  // The Studyboard Bucks bill: the exact Studyboard logo raised on a green bill, drawn like the gold Studyboard Credits coin
  // (build-resources/bucks-art/render-bucks.py makes bucks-bill.webp, 160 x 100, and bucks-stack.webp, a small fan of bills).
  // The gold coin belongs to the Studyboard Credits students earn (98-0study-credits.js).
  const COIN_SRC = "data:image/webp;base64,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";
  const COIN = `<img class="sbc-coin" src="${COIN_SRC}" width="32" height="20" alt="" aria-hidden="true">`;
  // A small fan of bills, for the big moments (the price on a buy sheet, Bucks arriving)
  const STACK_SRC = "data:image/webp;base64,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";
  const plural = n => (+n === 1 ? "Buck" : "Bucks");
  const bucks = n => `${(+n || 0).toLocaleString()} ${plural(n)}`;

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
            else if (!(dlg.open && dlg.querySelector(".sbc-sheet:not([data-kind])"))) toast(`${bucks(got)} added. You have ${bucks(C.balance)}.`);
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
  // The balance is the server's: it's asked again whenever you come back to Studyboard (at most every 20 seconds), so a balance that changed
  // elsewhere (a refund, another tab or device) never shows an old number
  let lastBack = 0;
  const backAgain = () => { if (document.hidden || !enabled() || !signedIn()) return; if (Date.now() < watchUntil || Date.now() - lastBack > 20000) { lastBack = Date.now(); load(); } };
  document.addEventListener("visibilitychange", backAgain);
  window.addEventListener("focus", backAgain);
  // another Studyboard tab saved a newer balance: show it here too
  window.addEventListener("storage", e => {
    if (e.key !== K || !e.newValue) return;
    try { const n = JSON.parse(e.newValue), u = usr(); if (!n || !u || n.uid !== u.id) return; C = n; rebuild(); try { applySkin(); } catch (x) {} scheduleRender(); redrawOpen(); } catch (x) {}
  });

  /* ---------- Sheets ---------- */
  let backToShop = false;
  const shopOpen = () => !!(dlg.open && dlg.querySelector(".sheet.shop, .sheet.ui-shop"));
  function redrawOpen(){
    try {
      const s = dlg.open && dlg.querySelector(".sbc-sheet");
      if (s && s.classList.contains("zoomed")) return; // a redraw would drop the big view the person is looking at
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
    if (kind === "cm") return window.SBCMSTYLE ? `<div class="sbc-cm">${SBCMSTYLE.pic(id)}</div>` : "";
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
      : enough ? `<button type="button" class="btn primary sbc-go" data-act="sbc-buy" data-kind="${esc(kind)}" data-id="${esc(id)}">Buy It for ${COIN}${bucks(cost)}</button>`
      : storeApp() ? "" : `<button type="button" class="btn primary" data-act="sbc-packs">Get Bucks</button>`;
    const wallet = !mineOk ? `<p class="sbc-note">Bucks belong to your account, so sign in first.</p>`
      : `<div class="sbc-wallet" role="status"><span class="sbc-wallet-l">Your balance</span><span class="sbc-wallet-n">${COIN}<b>${bal.toLocaleString()}</b></span>${enough ? `<span class="sbc-chip ok">${bal - cost} left after</span>` : `<span class="sbc-chip">${cost - bal} more needed</span>`}</div>${!enough && storeApp() ? `<p class="sbc-note">Buying Bucks isn't available in this app.</p>` : ""}`;
    openSheet(`<div class="sheet sbc-sheet sbc-buy" data-kind="${esc(kind)}" data-id="${esc(id)}">${head(nameOf(kind, id))}
      <div class="sheet-body">
        ${note ? `<p class="sbc-note sbc-why">${esc(note)}</p>` : ""}
        <div class="sbc-stage sbc-stage-${esc(kind)}" aria-hidden="true">${preview(kind, id)}${kind === "skin" ? `<span class="sbc-stage-l">Theme</span>` : ""}</div>
        <div class="sbc-price"><img class="sbc-price-coin" src="${STACK_SRC}" width="64" height="46" alt=""><span class="sbc-price-t"><b>${bucks(cost)}</b>${KIND_NAME[kind] ? `<span>${esc(KIND_NAME[kind])}</span>` : ""}</span></div>
        ${inside}
        ${list.length ? `<ul class="sbc-list">${list.map(x => `<li>${TICK}<span>${esc(x)}</span></li>`).join("")}</ul>` : ""}
        ${wallet}
        ${th ? `<button type="button" class="sbc-upsell" data-act="sbc-item" data-kind="skin" data-id="${esc(th)}"><span class="sbc-upsell-t"><b>Get the whole ${esc(themeName(th))} Collection</b><span>The theme, its companions, stickers, pins and this style, for ${bucks(priceOf("skin", th))}</span></span>${CHEV}</button>` : ""}
      </div>
      <div class="sheet-foot"><button type="button" class="btn" data-act="sbc-back">${backToShop ? "Back to Shop" : "Not Now"}</button><span class="spacer"></span>${go}${PLAN.isPro() ? "" : `<button type="button" class="btn sbc-getpro" data-act="plan-open" title="Every collection while you're subscribed">Get Pro</button>`}</div></div>`);
  }
  const money = (cents, cur) => { try { return new Intl.NumberFormat(undefined, {style: "currency", currency: String(cur || "usd").toUpperCase()}).format(cents / 100); } catch (e) { return "$" + (cents / 100).toFixed(2); } };
  function packsSheet(){
    if (!dlg.open || !dlg.querySelector(".sbc-sheet")) backToShop = shopOpen();
    if (pending && Date.now() - pending.at > 30 * 60000) pending = null;
    if (added || pending) {
      const body = added
        ? `<div class="sbc-done" role="status"><img class="sbc-done-coin" src="${STACK_SRC}" width="96" height="68" alt=""><b>${bucks(added.credits)} added</b><span>You have ${bucks(added.balance)}. Pick anything in the Style Shop to keep it for good.</span></div>`
        : `<div class="sbc-wait" role="status"><span class="sbc-spin" aria-hidden="true"></span><b>Finish paying in the checkout tab</b><span>${pending.credits ? `Your ${bucks(pending.credits)}` : "Your Bucks"} appear here as soon as Stripe confirms the payment. You can keep using Studyboard meanwhile.</span>
            <div class="sbc-wait-acts"><button type="button" class="btn small" data-act="sbc-reopen">Open Checkout Again</button><button type="button" class="btn small" data-act="sbc-check">Check Now</button></div></div>`;
      openSheet(`<div class="sheet sbc-sheet">${head("Studyboard Bucks")}
        <div class="sheet-body">${body}</div>
        <div class="sheet-foot">${added ? "" : `<button type="button" class="btn" data-act="sbc-cancel">Choose Another Pack</button>`}<span class="spacer"></span><button type="button" class="btn primary" data-act="sbc-back">${backToShop ? "Back to Shop" : "Done"}</button></div></div>`);
      return;
    }
    const m = mine(), packs = m && Array.isArray(m.packs) ? m.packs : null, base = packs && packs[0] ? packs[0].cents / packs[0].credits : 0;
    const body = !signedIn() ? `<p style="margin:0">Bucks belong to your account. Sign in or create a free account first.</p>`
      : storeApp() ? `<p style="margin:0">Buying Bucks isn't available in this app. Bucks you already have work here.</p>`
      : !packs ? `<p class="mini" style="margin:0">Loading…</p>`
      : `<div class="sbc-packs">${packs.map(p => {
          // the extra credits against buying the same money's worth at the smallest pack's rate (a "Bonus" badge from the server
          // is worked out the same way here, so it can't go stale)
          const bonus = base ? Math.round(p.credits - p.cents / base) : 0, bonusTag = bonus >= 1 ? `+${bonus.toLocaleString()} Bonus Bucks` : "", badge = !p.badge || /bonus/i.test(p.badge) ? bonusTag : p.badge;
          return `<button type="button" class="sbc-pack${p.badge === "Best Value" ? " best" : ""}" data-act="sbc-pack" data-id="${esc(p.id)}">${badge ? `<span class="pp-flag">${esc(badge)}</span>` : ""}<span class="sbc-pack-n">${COIN}<b>${esc(Number(p.credits).toLocaleString())}</b> Bucks</span><span class="sbc-pack-p">${esc(money(p.cents, p.currency))}</span>${bonus >= 1 && badge !== bonusTag ? `<span class="mini">${bonus.toLocaleString()} bonus Bucks compared with the ${esc(Number(packs[0].credits).toLocaleString())} pack</span>` : ""}</button>`; }).join("")}</div>
        <p class="mini" style="margin:0">A Theme Collection is ${bucks(prices().skin)} (with its companions, stickers, pins and flashcard style), a sticker pack or flashcard style ${prices().sticker}, a pin ${prices().pin}. Bucks don't expire, and what you keep stays yours even without Pro. You'll pay securely with Stripe on the Studyboard website.</p>`;
    openSheet(`<div class="sheet sbc-sheet">${head("Studyboard Bucks")}
      <div class="sheet-body">
        ${signedIn() ? `<p class="sbc-bal sbc-bal-big" role="status">${COIN}<span>You have <b>${balance().toLocaleString()}</b> ${plural(balance())}</span></p>` : ""}
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
    const ERR = {off: "Buying with Bucks isn't available right now.", sign_in: "Sign in first, then try again.", bad_item: "That item can't be bought with Bucks.",
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
    const left = `${bucks(C.balance)} left.`;
    if (kind === "skin") toast(`The ${themeName(id)} Collection is yours for good. ${left}`, null, {label: "Use It Now", fn: () => { saveStyle({skin: id}); applySkin(); render(); }});
    else toast(`${nameOf(kind, id)} is yours for good. ${left}`);
    if (wasShop) setTimeout(() => { try { styleShop(); } catch (e) {} }, 120);
    load();
  }
  // Build Your Look: a theme (with its Collection) plus up to 5 more pieces, for the price of one Collection
  // (studyboard_buy_bundle in supabase-credits-bundle.sql). items: [[kind, id], ...] of cards, pins and note shapes
  async function buyBundle(th, items, btn){
    if (busy) return false; busy = true;
    if (btn) { btn.disabled = true; btn.setAttribute("aria-busy", "true"); }
    let r = null, missing = false;
    try { const {data, error} = await cl().rpc("studyboard_buy_bundle", {p_theme: th, p_items: items}); if (error) { missing = /PGRST202|could not find the function/i.test((error.code || "") + " " + (error.message || "")); r = {error: missing ? "off" : "network"}; } else r = data; } catch (e) { r = {error: "network"}; }
    busy = false;
    if (btn && btn.isConnected) { btn.disabled = false; btn.removeAttribute("aria-busy"); }
    const ERR = {off: "Building your own look isn't available yet. You can still get the Collection or each piece.", sign_in: "Sign in first, then try again.", bad_item: "One of those pieces can't be bought with Bucks.",
      own_theme: "You already have this theme. Get the other pieces one by one.", slow_down: "That's a lot of purchases. Wait a little, then try again.", network: "Couldn't reach Studyboard. Check your connection and try again."};
    if (!r || !r.ok) {
      if (r && r.error === "not_enough") { if (C && typeof r.balance === "number") { C.balance = r.balance; save(); } packsSheet(); return false; }
      toast(ERR[r && r.error] || ERR.network); return false;
    }
    C = Object.assign({}, mine() || {uid: usr().id, owned: []}, {balance: typeof r.balance === "number" ? r.balance : balance()});
    C.owned = (C.owned || []).concat([["skin", th]], items); save(); rebuild();
    try { applySkin(); } catch (e) {}
    scheduleRender();
    toast(`Your ${themeName(th)} look is yours for good. ${bucks(C.balance)} left.`);
    load();
    return true;
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
      case "sbc-check": load(); toast("Checking for your Bucks…"); return true;
      case "sbc-cancel": pending = null; packsSheet(); return true;
      case "sbc-zoom": zoom(el.dataset.what, el.dataset.th); return true;
      case "sbc-zoom-x": unzoom(); return true;
      case "sbc-signin": if (dlg.open) dlg.close(); setTimeout(() => { if (window.SBGUEST) SBGUEST.signUp(); else if (typeof sbSignInSheet === "function") sbSignInSheet(); }, 120); return true;
      case "sbc-back": added = null; if (backToShop) styleShop(); else if (dlg.open) dlg.close(); return true;
    }
    return false;
  });
  hook("menu", () => enabled() && signedIn() ? `<button data-act="sbc-packs" data-group="account"><span>Studyboard Bucks<span class="sub">${bucks(balance())} · Keep themes, stickers and more for good</span></span></button>` : "");
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
  const origShop = styleShop; let shopAsked = 0;
  styleShop = function(){
    const r = origShop.apply(this, arguments);
    try {
      const hd = dlg.querySelector(".sheet.shop .sheet-head, .sheet.ui-shop .sheet-head");
      if (hd && showBar() && !hd.querySelector(".sbc-pill")) {
        const n = balance(), txt = signedIn() ? `<b>${n.toLocaleString()}</b><span class="sbc-pill-l">${plural(n)}</span>` : `<span class="sbc-pill-l">Bucks</span>`;
        const close = hd.querySelector('[data-act="close"]');
        const pill = `<button type="button" class="sbc-pill" data-act="sbc-packs" title="Studyboard Bucks: keep any Pro item for good" aria-label="${signedIn() ? `You have ${bucks(n)}. Get more` : "Studyboard Credits"}">${COIN}${txt}</button>`;
        if (close) close.insertAdjacentHTML("beforebegin", pill); else hd.insertAdjacentHTML("beforeend", pill);
        hd.classList.add("has-cr");
      }
      label(dlg);
      // the shop asks for the balance as it opens (it redraws if the number changed)
      if (enabled() && signedIn() && Date.now() - shopAsked > 5000) { shopAsked = Date.now(); load(); }
    } catch (e) { console.warn("credits pill", e); }
    return r;
  };
  function label(root){
    if (!enabled() || PLAN.isPro()) return;
    root.querySelectorAll('[data-act="shop-unlock"]:not([data-cr])').forEach(b => {
      b.dataset.cr = "1";
      const n = priceOf(b.dataset.kind, b.dataset.id); if (!n) return;
      b.innerHTML = `🔒 ${bucks(n)}`;
      b.setAttribute("aria-label", `Buy ${nameOf(b.dataset.kind, b.dataset.id)} for ${bucks(n)}`);
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
        <span class="cpu-prop sbc-bnum"><b data-sbc-count style="font-size:${n.length > 5 ? 2.1 : n.length > 4 ? 2.5 : 3}rem">${still ? n : "0"}</b><small>${plural(got)}</small></span></div>
      <span class="cpu-kick">Bucks Added!</span><h2 class="cpu-name" id="sbcBurstName">+${n} ${plural(got)}</h2>
      <p class="cpu-how" id="sbcBurstHow">Thanks for your purchase. You have ${bucks(bal)} to spend.</p>
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
    st.textContent = `.sbc-bnum{display:flex!important;flex-direction:column;align-items:center;justify-content:center;gap:0;color:#14602A;font-family:var(--display)}
.sbc-bnum b{font:900 3rem/1 var(--display);font-variant-numeric:tabular-nums;letter-spacing:-.02em;text-shadow:0 2px 0 rgba(255,255,255,.7)}
.sbc-bnum small{margin-top:2px;font:800 .78rem/1 var(--display);letter-spacing:.14em;text-transform:uppercase;color:#2E8B47}
.sbc-bnum b:not(:only-child){max-width:136px;overflow:hidden}
.sbc-burst .cpu-rays{background:repeating-conic-gradient(from 0deg,rgba(120,220,140,.5) 0deg 7deg,rgba(120,220,140,0) 7deg 22.5deg)}
.sbc-burst .cpu-glow{background:radial-gradient(circle,rgba(210,250,215,.95),rgba(80,190,105,.5) 38%,rgba(40,150,70,0) 70%)}
.sbc-burst .cpu-prop{background:radial-gradient(circle at 35% 30%,#fff,#ECFBEF 60%,#BFEBC8);box-shadow:0 0 0 6px rgba(255,255,255,.55),0 18px 40px rgba(10,80,30,.45),0 0 60px rgba(90,200,115,.75)}
.sbc-burst .cpu-kick{color:#9BF0AE;text-shadow:0 1px 8px rgba(40,170,80,.6)}
.sbc-burst .cpu-acts .cpu-wear{background:linear-gradient(180deg,#6FD682,#1F8A3F)!important;color:#fff!important;box-shadow:0 8px 22px rgba(40,160,70,.45)!important}`;
    document.head.appendChild(st); }
  window.SBCREDITS = {burst, owns, priceOf, balance, load, buySheet, packsSheet, enabled, contents, buyBundle, signedIn: () => signedIn(),
    // "300 Bucks", and the little green bill, for other screens (99-shop-home.js)
    bucks, bill: () => COIN,
    // For tests: what this device remembers
    state: () => (mine() ? JSON.parse(JSON.stringify(mine())) : null)};
  if (window.__SB_TEST) Object.assign(window.SBCREDITS, {fake: (client, user) => { fake = {sb: client, user}; seenUid = ""; rebuild(); scheduleRender(); }, shop: () => styleShop(), unlock: (k, id) => shopUnlock(k, id), pending: () => pending, added: () => added, comps: th => (STYLE_LISTS.comp || []).filter(c => c.theme === th).map(c => c.id)});
})();
