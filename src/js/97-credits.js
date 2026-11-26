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
