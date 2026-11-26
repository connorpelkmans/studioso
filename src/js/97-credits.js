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
