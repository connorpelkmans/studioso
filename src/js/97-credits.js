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
