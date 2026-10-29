/* ===== module: 100-phone.js ===== */
/* Phone follow-ups */
(() => {
  const ls = window.localStorage;
  const rawSet = Storage.prototype.setItem, rawRm = Storage.prototype.removeItem, rawGet = Storage.prototype.getItem;

  /* Swipe between days on the Schedule (phone layout): the day follows your finger with the next one sliding in beside it,
     like a calendar app's day view; let go past a third of the way (or flick) and it settles on that day, else springs back */
  (() => {
    const phoneSch = () => !!(window.matchMedia && matchMedia("(max-width:700px)").matches);
    const still = () => document.documentElement.dataset.motion === "static" || !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
    const EASE = "cubic-bezier(.2,.8,.2,1)";
    let S = null, eatClick = 0;
    // The day `dir` away: in this week it's already drawn (hidden); across the week it's drawn off to the side
    function side(dir){
      const grid = S.grid, pills = [...document.querySelectorAll(".sch-pills button")];
      const cur = Math.max(0, pills.findIndex(b => b.getAttribute("aria-pressed") === "true")), n = cur + dir;
      const heads = [...grid.querySelectorAll(":scope > .sch-head")], cols = [...grid.querySelectorAll(":scope > .sch-col")];
      if (n >= 0 && n < pills.length && heads[n] && cols[n]) return {head: heads[n], col: cols[n], own: false, commit: () => { ui.schDay = n; }};
      const wk = addDays(ui.schWeek || mondayOf(todayISO()), dir * 7), keep = [ui.schWeek, ui.schDay, schNoticeHtml];
      ui.schWeek = wk; ui.schDay = dir > 0 ? 0 : -1;
      let html = ""; try { html = viewSchedule(); } catch (e) {}
      ui.schWeek = keep[0]; ui.schDay = keep[1]; schNoticeHtml = keep[2];
      const tmp = document.createElement("div"); tmp.innerHTML = html;
      const h = tmp.querySelector(".sch-grid > .sch-head.sel"), c = tmp.querySelector(".sch-grid > .sch-col.sel");
      if (!h || !c) return null;
      grid.append(h, c);
      return {head: h, col: c, own: true, commit: () => { ui.schWeek = wk; ui.schDay = dir > 0 ? 0 : -1; }};
    }
    function peek(dir){
      if (S.dir === dir && S.nb) return S.nb;
      unpeek();
      S.dir = dir; S.nb = side(dir);
      if (S.nb) { S.nb.head.classList.add("sch-peek"); S.nb.col.classList.add("sch-peek"); }
      return S.nb;
    }
    function unpeek(){
      const nb = S && S.nb; if (!nb) return;
      [nb.head, nb.col].forEach(el => { el.classList.remove("sch-peek"); el.style.transform = el.style.transition = ""; if (nb.own) el.remove(); });
      S.nb = null; S.dir = 0;
    }
    function place(dx, ms){
      const tr = ms ? `transform ${ms}ms ${EASE}` : "";
      [S.head, S.col].forEach(el => { el.style.transition = tr; el.style.transform = `translateX(${dx}px)`; });
      if (S.nb) [S.nb.head, S.nb.col].forEach(el => { el.style.transition = tr; el.style.transform = `translateX(${dx + S.dir * S.w}px)`; });
    }
    function cleanup(){
      if (!S) return;
      unpeek(); [S.head, S.col].forEach(el => { el.style.transform = el.style.transition = ""; });
      S.grid.classList.remove("sch-swiping"); if (S.lock === "x") renderBlocked = false; S = null;
    }
    document.addEventListener("touchstart", e => {
      if (S && S.settling) return;
      S = null;
      if (e.touches.length !== 1 || !phoneSch() || ui.tab !== "schedule" || document.body.classList.contains("sch-dragging") || dlg.open) return;
      if (!e.target.closest || !e.target.closest(".sch-wrap, .sch-pills")) return;
      const grid = document.querySelector(".sch-wrap .sch-grid"), head = grid && grid.querySelector(":scope > .sch-head.sel"), col = grid && grid.querySelector(":scope > .sch-col.sel");
      if (!head || !col) return;
      const t = e.touches[0];
      S = {x: t.clientX, y: t.clientY, at: performance.now(), grid, head, col, w: col.getBoundingClientRect().width, lock: "", dx: 0, v: 0, lt: performance.now(), lx: t.clientX, dir: 0, nb: null};
    }, {passive: true});
    document.addEventListener("touchmove", e => {
      if (!S || S.settling || e.touches.length !== 1) return;
      if (document.body.classList.contains("sch-dragging")) { cleanup(); return; }
      const t = e.touches[0], dx = t.clientX - S.x, dy = t.clientY - S.y;
      if (!S.lock) {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
        S.lock = Math.abs(dx) > Math.abs(dy) * 1.2 ? "x" : "y";
        if (S.lock === "y") return;
        S.grid.classList.add("sch-swiping");
        renderBlocked = true;   // no redraw may swap the day out from under the finger; one runs once it settles
      }
      if (S.lock !== "x") return;
      e.preventDefault();
      const now = performance.now(); if (now > S.lt) { S.v = (t.clientX - S.lx) / (now - S.lt); } S.lt = now; S.lx = t.clientX;
      S.dx = dx;
      if (dx) peek(dx < 0 ? 1 : -1);
      place(S.nb ? dx : dx * 0.3, 0);
    }, {passive: false});
    const end = () => {
      if (!S || S.settling) return;
      if (S.lock !== "x") { S = null; return; }
      eatClick = Date.now();
      if (performance.now() - S.lt > 90) S.v = 0;   // the finger stopped before lifting: not a flick
      const dir = S.dir, go = S.nb && (Math.abs(S.dx) > S.w * 0.33 || (Math.abs(S.v) > 0.45 && Math.sign(S.v) === -dir));
      const ms = still() ? 0 : Math.round(Math.max(160, Math.min(320, (go ? S.w - Math.abs(S.dx) : Math.abs(S.dx)) / Math.max(0.6, Math.abs(S.v)))));
      S.settling = true;
      const finish = () => {
        if (!S) return;
        if (go) { const commit = S.nb.commit; cleanup(); commit(); render(); }
        else cleanup();
      };
      if (!ms) { finish(); return; }
      place(go ? -dir * S.w : 0, ms);
      setTimeout(finish, ms + 20);
    };
    document.addEventListener("touchend", end, {passive: true});
    document.addEventListener("touchcancel", () => { if (S && !S.settling) { if (S.lock === "x") { S.dx = 0; end(); } else S = null; } }, {passive: true});
    // a swipe isn't a tap on whatever it started on
    document.addEventListener("click", e => { if (Date.now() - eatClick < 400 && e.target.closest && e.target.closest(".sch-wrap")) { e.preventDefault(); e.stopPropagation(); } }, true);
  })();

  /* Dismissals and light/dark follow you between devices */
  const UI_KEYS = new Set(["studioso:theme", "studioso:nudge", "studioso:lastExport", "studyboard:crunch", "studyboard:roughWeekHidden", "studyboard:grpNudge",
    "studyboard:semester", "studyboard:review:snooze", "studyboard:fgs:cards", "studyboard:streak:said", "studyboard:heads:hide", "studyboard:gradeAsked",
    "studyboard:gradeCheer", "studyboard:scrapToastAt"]);
  const AT = "studyboard:uiSyncAt";
  const atMap = () => { try { const m = JSON.parse(rawGet.call(ls, AT) || "{}"); return m && typeof m === "object" ? m : {}; } catch (e) { return {}; } };
  const putAt = m => { try { rawSet.call(ls, AT, JSON.stringify(m)); } catch (e) {} };
  const bag = () => { const b = state && state.settings && state.settings.uiSync; return b && typeof b === "object" && !Array.isArray(b) ? b : {}; };
  let saveT = 0;
  function note(k, v){
    try {
      if (!UI_KEYS.has(k) || !state || !state.settings) return;
      const cur = bag()[k]; if (cur && cur.v === v) return;
      const at = Date.now();
      state.settings = Object.assign({}, state.settings, {uiSync: Object.assign({}, bag(), {[k]: {v, at}})});
      const m = atMap(); m[k] = at; putAt(m);
      clearTimeout(saveT); saveT = setTimeout(() => { try { saveSettings(); } catch (e) {} }, 1500);
    } catch (e) {}
  }
  Storage.prototype.setItem = function (k, v) { rawSet.apply(this, arguments); if (this === ls) note(k, String(v)); };
  Storage.prototype.removeItem = function (k) { rawRm.apply(this, arguments); if (this === ls) note(k, null); };
  function uiApply(){
    try {
      const b = bag(), m = atMap(); let changed = false, theme = false;
      Object.keys(b).forEach(k => {
        const e = b[k]; if (!UI_KEYS.has(k) || !e || typeof e.at !== "number" || e.at <= (m[k] || 0)) return;
        try { if (e.v === null) rawRm.call(ls, k); else rawSet.call(ls, k, String(e.v)); } catch (x) {}
        m[k] = e.at; changed = true; if (k === "studioso:theme") theme = true;
      });
      if (!changed) return;
      putAt(m);
      if (theme) { try { applyTheme(); } catch (x) {} }
      scheduleRender();
    } catch (e) {}
  }
  // Keys that already exist on a device are shared once, as the oldest edit
  function uiSeed(){
    try {
      const b = bag(), add = {}; const m = atMap();
      UI_KEYS.forEach(k => { const v = rawGet.call(ls, k); if (v != null && !b[k]) { add[k] = {v, at: 1}; m[k] = Math.max(m[k] || 0, 1); } });
      if (!Object.keys(add).length) return;
      putAt(m); state.settings = Object.assign({}, state.settings, {uiSync: Object.assign({}, b, add)}); saveSettings();
    } catch (e) {}
  }
  // Called when settings arrive from the account
  const newer = (a, b) => ((a && a.at) || 0) > ((b && b.at) || 0);
  window.SBUISYNC = {
    keep(next, mine){
      try {
        const a = (mine && mine.uiSync) || {}, out = Object.assign({}, next.uiSync || {});
        Object.keys(a).forEach(k => { if (!out[k] || newer(a[k], out[k])) out[k] = a[k]; });
        if (Object.keys(out).length) next.uiSync = out;
        if (mine && mine.aiVault && newer(mine.aiVault, next.aiVault)) next.aiVault = mine.aiVault;
        const byId = (x, y) => { const m = new Map(); (Array.isArray(x) ? x : []).concat(Array.isArray(y) ? y : []).forEach(c => { if (c && c.id) { const o = m.get(c.id); if (!o || (c.at || 0) > (o.at || 0)) m.set(c.id, c); } }); return [...m.values()]; };
        if (mine && Array.isArray(mine.chatGone)) next.chatGone = byId(next.chatGone, mine.chatGone).slice(-40);
        if (mine && Array.isArray(mine.chats)) { const gone = new Map((next.chatGone || []).map(g => [g.id, g.at || 0])); next.chats = byId(next.chats, mine.chats).filter(c => !(gone.has(c.id) && gone.get(c.id) >= (c.at || 0))); }
      } catch (e) {}
      return next;
    },
    apply: uiApply
  };

  /* AI keys that follow you, end to end encrypted */
  const subtle = window.crypto && crypto.subtle, enc = new TextEncoder(), dec = new TextDecoder();
  const b64 = u8 => { let s = ""; u8.forEach(c => { s += String.fromCharCode(c); }); return btoa(s); };
  const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
  const IDB = "sbvault";
  const idb = () => new Promise((res, rej) => { const r = indexedDB.open(IDB, 1); r.onupgradeneeded = () => r.result.createObjectStore("k"); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
  const kvGet = async k => { try { const d = await idb(); return await new Promise(res => { const q = d.transaction("k").objectStore("k").get(k); q.onsuccess = () => res(q.result || null); q.onerror = () => res(null); }); } catch (e) { return null; } };
  const kvSet = async (k, v) => { try { const d = await idb(); await new Promise(res => { const t = d.transaction("k", "readwrite"); if (v == null) t.objectStore("k").delete(k); else t.objectStore("k").put(v, k); t.oncomplete = t.onerror = () => res(); }); } catch (e) {} };
  const vault = () => { const v = state && state.settings && state.settings.aiVault; return v && typeof v === "object" && v.ct && v.salt ? v : null; };
  const keysNow = () => { const o = {}; try { Object.entries(aiLocalKeys || {}).forEach(([p, k]) => { if (k) o[p] = k; }); } catch (e) {} return o; };
  const VAULT_ROUNDS = 600000, roundsOf = v => (v && Number.isInteger(v.it) && v.it >= 100000 && v.it <= 5000000 ? v.it : 250000);
  const derive = async (pass, salt, it) => subtle.deriveKey({name: "PBKDF2", salt, iterations: it || VAULT_ROUNDS, hash: "SHA-256"}, await subtle.importKey("raw", enc.encode(pass), "PBKDF2", false, ["deriveKey"]), {name: "AES-GCM", length: 256}, false, ["encrypt", "decrypt"]);
  const seal = async (key, salt, it) => {
    const iv = crypto.getRandomValues(new Uint8Array(12)), ct = new Uint8Array(await subtle.encrypt({name: "AES-GCM", iv}, key, enc.encode(JSON.stringify(keysNow()))));
    return Object.assign({v: 1, salt: b64(salt), iv: b64(iv), ct: b64(ct), at: Date.now()}, it && it !== 250000 ? {it} : {});
  };
  const open = async (key, v) => JSON.parse(dec.decode(await subtle.decrypt({name: "AES-GCM", iv: unb64(v.iv)}, key, unb64(v.ct))));
  const AVAT = "studyboard:aiVaultAt";
  let lastSealed = "", sealT = 0;
  async function resealSoon(){
    clearTimeout(sealT);
    sealT = setTimeout(async () => {
      try {
        const v = vault(), key = v && await kvGet("key"); if (!v || !key) return;
        const plain = JSON.stringify(keysNow()); if (plain === lastSealed) return;
        const nv = await seal(key, unb64(v.salt), roundsOf(v)); lastSealed = plain;
        state.settings = Object.assign({}, state.settings, {aiVault: nv}); try { rawSet.call(ls, AVAT, String(nv.at)); } catch (e) {} saveSettings();
      } catch (e) {}
    }, 800);
  }
  // A newer vault from another device
  async function vaultApply(){
    try {
      const v = vault(); if (!v || !subtle) return;
      if (Number(rawGet.call(ls, AVAT) || 0) >= v.at) return;
      const key = await kvGet("key"); if (!key) return;
      const keys = await open(key, v);
      try { rawSet.call(ls, AVAT, String(v.at)); } catch (e) {}
      lastSealed = JSON.stringify(keys);
      aiKeysSetLocal(keys); scheduleRender();
    } catch (e) {}
  }
  const baseKeysSet = aiKeysSetLocal;
  aiKeysSetLocal = function () { const r = baseKeysSet.apply(this, arguments); resealSoon(); return r; };
  async function vaultEnable(pass){
    const salt = crypto.getRandomValues(new Uint8Array(16)), key = await derive(pass, salt, VAULT_ROUNDS);
    await kvSet("key", key);
    const nv = await seal(key, salt, VAULT_ROUNDS); lastSealed = JSON.stringify(keysNow());
    state.settings = Object.assign({}, state.settings, {aiVault: nv}); try { rawSet.call(ls, AVAT, String(nv.at)); } catch (e) {} saveSettings();
  }
  async function vaultUnlock(pass){
    const v = vault(); if (!v) throw new Error("none");
    const key = await derive(pass, unb64(v.salt), roundsOf(v));
    const keys = await open(key, v);
    await kvSet("key", key);
    try { rawSet.call(ls, AVAT, String(v.at)); } catch (e) {}
    lastSealed = JSON.stringify(Object.assign({}, keys, keysNow()));
    aiKeysSetLocal(Object.assign({}, keys, keysNow()));
  }
  async function vaultOff(){
    await kvSet("key", null);
    const s = Object.assign({}, state.settings); delete s.aiVault; state.settings = s; saveSettings();
  }
  async function status(){
    const v = vault(), key = v ? await kvGet("key") : null;
    return !subtle || inPreview() ? "na" : !v ? "off" : key ? "on" : "locked";
  }
  const esc2 = s => esc(String(s));
  async function vaultSheet(){
    const st = await status(), c = st === "locked";
    const body = st === "off"
      ? `<p style="margin:0">Keep your AI keys on every device you sign in on. They are locked with a passphrase you choose, before they leave this device, so Studyboard's servers only ever hold scrambled text they can't read.</p>
         <label class="f"><span class="lh">Passphrase ${REQ}</span><input type="password" name="pass" required minlength="8" autocomplete="new-password" autofocus></label>
         <label class="f"><span class="lh">Type it again ${REQ}</span><input type="password" name="pass2" required minlength="8" autocomplete="new-password"></label>
         <p class="mini" style="margin:0">Write it down somewhere safe. If you forget it, turn this off and set it up again from a device that still has your keys.</p>`
      : c
      ? `<p style="margin:0">Your AI keys are waiting from another device. Enter the passphrase you chose there.</p>
         <label class="f"><span class="lh">Passphrase ${REQ}</span><input type="password" name="pass" required autocomplete="current-password" autofocus></label>`
      : `<p style="margin:0">Your AI keys sync across your devices, locked with your passphrase. Changing a key here updates your other devices.</p>`;
    openSheet(`<form class="sheet">${head("AI Keys on All My Devices")}<div class="sheet-body">${body}<p class="mini ai-test-msg" data-vmsg aria-live="polite" style="margin:0"></p></div>
      <div class="sheet-foot">${st === "on" ? `<button type="button" class="btn danger" data-voff>Turn Off</button>` : ""}<span class="spacer"></span><button type="button" class="btn" data-act="close">${st === "on" ? "Done" : "Cancel"}</button>${st === "on" ? "" : `<button type="submit" class="btn primary" data-submit>${c ? "Unlock" : "Turn On"}</button>`}</div></form>`, fd => {
      const msg = dlg.querySelector("[data-vmsg]"), pass = String(fd.get("pass") || "");
      if (st === "off") {
        if (pass.length < 8) { msg.textContent = "Use at least 8 characters."; return false; }
        if (pass !== String(fd.get("pass2") || "")) { msg.textContent = "The two passphrases don't match."; return false; }
        if (!Object.keys(keysNow()).length) { msg.textContent = "Add an AI key first, then turn this on."; return false; }
        vaultEnable(pass).then(() => { toast("AI keys will now follow you to your other devices"); scheduleRender(); }).catch(() => toast("Couldn't lock the keys on this device."));
        return true;
      }
      msg.textContent = "Unlocking…";
      vaultUnlock(pass).then(() => { if (dlg.open) dlg.close(); toast("AI keys unlocked on this device"); scheduleRender(); }).catch(() => { msg.textContent = "That passphrase didn't unlock them. Check it and try again."; });
      return false;
    });
    const off = dlg.querySelector("[data-voff]");
    if (off) off.addEventListener("click", () => { vaultOff().then(() => { if (dlg.open) dlg.close(); toast("Your keys stay on this device only. The synced copy was removed."); scheduleRender(); }); });
  }
  hook("menu", () => {
    if (inPreview() || !subtle) return "";
    const st = vault() ? (vaultState || "on") : "off";
    return `<button data-act="aivault-open"><span>AI Keys on All My Devices<span class="sub">${st === "off" ? "Lock your keys with a passphrase and use them on your phone and computer" : st === "locked" ? "Your keys are waiting from another device. Tap to unlock." : "On. Your keys follow you, locked with your passphrase."}</span></span></button>`;
  });
  let vaultState = "";
  hook("act", act => { if (act === "aivault-open") { vaultSheet(); return true; } });
  let asked = false;
  async function vaultNudge(){
    try {
      const st = await status(); vaultState = st === "na" ? "" : st;
      if (st === "locked" && !asked && !Object.keys(keysNow()).length && !dlg.open) { asked = true; toast("Your AI keys are waiting from another device.", null, {label: "Unlock", fn: vaultSheet}); }
      if (st === "on") vaultApply();
    } catch (e) {}
  }

  let vT = 0;
  hook("render", () => { uiApply(); if (Date.now() - vT > 5000) { vT = Date.now(); setTimeout(vaultNudge, 800); } });
  hook("boot", () => { setTimeout(uiSeed, 3000); });
})();

