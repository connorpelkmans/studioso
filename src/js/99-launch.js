/* ===== module: 99-launch.js ===== */
/* Launch tools (the server side is supabase-launch.sql; see LAUNCH-STATS.md):
   1. The daily check-in. Once a day the app asks the server whether this version is still OK. The server adds one to a daily total
      for this kind of device (web, desktop, iPhone…) and whether it's signed in, and keeps nothing else: no account id, no device
      id, no IP address. The same answer carries the version rule (app_flags 'version_policy'), checked again every 6 hours.
   2. The update switch. A version older than "min", or listed in "bad", pauses syncing (changes stay on the device, in the outbox,
      and sync after the update) and asks to update; older than "nudge" gets a gentle, dismissible "An update is ready".
   3. Invite rewards. Your invite links carry your code (?ref=); a new account that opens one records who invited it. 3 friends who
      join and come back on another day = a month of Pro's features (no Studyboard AI, the free plan's storage), up to 6 a year.
   4. What's New: after an update, one short card of the 2 or 3 biggest changes, once, when the student isn't busy. */
(() => {
  const DAY_KEY = "studyboard:checkinDay", POL_KEY = "studyboard:versionPolicy", REF_KEY = "studyboard:ref", MYREF_KEY = "studyboard:myRef",
    REW_KEY = "studyboard:refRewards", NEW_KEY = "studyboard:whatsNew", NUDGE_KEY = "studyboard:nudgeSeen";
  const EVERY = 6 * 36e5, SITE = "https://studyboardapp.com/";
  // this device's id (the same one Settings > Devices uses); the server keeps only a scrambled form of it, with invites
  const devId = () => { let id = ls.get("studyboard:deviceId"); if (!id) { id = crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(36).slice(2); ls.set("studyboard:deviceId", id); } return id; };
  const plural = (k, w) => `${k} ${w}${k === 1 ? "" : "s"}`;
  const ls = {get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} },
    del: k => { try { localStorage.removeItem(k); } catch (e) {} }, json: k => { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch (e) { return null; } }};
  const ver = () => { try { return typeof APP_VERSION === "string" ? APP_VERSION : ""; } catch (e) { return ""; } };
  // "1.15.8" < "1.16.0"; anything that isn't a version compares as equal (never pauses by mistake)
  const cmp = (a, b) => {
    const p = v => /^\d+(\.\d+){0,3}$/.test(String(v || "").trim()) ? String(v).trim().split(".").map(Number) : null, x = p(a), y = p(b);
    if (!x || !y) return 0;
    for (let i = 0; i < Math.max(x.length, y.length); i++) { const d = (x[i] || 0) - (y[i] || 0); if (d) return d < 0 ? -1 : 1; }
    return 0;
  };
  const native = () => { try { const c = window.Capacitor; return c && c.isNativePlatform && c.isNativePlatform() ? c.getPlatform() : ""; } catch (e) { return ""; } };
  const platform = () => {
    if (typeof DESK !== "undefined" && DESK) return "desktop";
    const n = native(); if (n === "ios" || n === "android") return n;
    const standalone = !!(window.matchMedia && matchMedia("(display-mode: standalone)").matches) || navigator.standalone === true;
    return standalone ? "app" : "web";
  };
  const cfg = () => { try { return SB_HOSTED ? SB_DEFAULT : (typeof sbConfig === "function" ? sbConfig() : null); } catch (e) { return null; } };
  const signedIn = () => { try { return !!(sb && sbUser); } catch (e) { return false; } };
  // tests and the design previews never phone home, unless a test asks to
  // (automated browsers too: tests and crawlers aren't students, and shouldn't be counted)
  const quiet = () => ((window.__SB_TEST || navigator.webdriver) && !window.__SB_LAUNCH_TEST) || (typeof inPreview === "function" && inPreview());

  /* ---------- the update switch ---------- */
  function verdict(pol){
    const v = ver(), p = pol && typeof pol === "object" ? pol : {};
    const bad = Array.isArray(p.bad) && p.bad.map(String).includes(v);
    const old = p.min && cmp(v, p.min) < 0;
    return {pause: !!(v && (bad || old)), nudge: !!(v && !(bad || old) && p.nudge && cmp(v, p.nudge) < 0 && ls.get(NUDGE_KEY) !== String(p.nudge)),
      message: typeof p.message === "string" ? p.message.slice(0, 240) : "", nudgeTo: String(p.nudge || "")};
  }
  function updateLink(){
    const n = native(), d = typeof DESK !== "undefined" ? DESK : null;
    if (n === "ios") return "https://apps.apple.com/app/id6828721365";
    if (n === "android") return "https://play.google.com/store/apps/details?id=com.studyboardapp.studyboard";
    if (d && d.store === "msstore") return "ms-windows-store://pdp/?productid=9N8PHL54N3SN";
    if (d) return SITE + "website/#download";
    return "";
  }
  function doUpdate(){
    const u = updateLink();
    if (!u) { // the website: the newest version is one reload away (the service worker fetches it)
      try { if (navigator.serviceWorker && navigator.serviceWorker.getRegistration) navigator.serviceWorker.getRegistration().then(r => r && r.update()).catch(() => {}); } catch (e) {}
      setTimeout(() => location.reload(), 300); return;
    }
    if (/^ms-windows-store:/.test(u)) { try { window.open(u); } catch (e) {} return; }
    if (typeof openOutside === "function") openOutside(u); else window.open(u, "_blank", "noopener");
  }
  function setPaused(on, message){
    const was = !!window.__sbSyncPaused;
    window.__sbSyncPaused = !!on;
    let el = document.getElementById("sbUpd");
    if (on) {
      if (!el) { el = document.createElement("div"); el.id = "sbUpd"; el.className = "sb-upd"; el.setAttribute("role", "status"); document.body.appendChild(el); }
      el.innerHTML = `<div class="sb-upd-t"><b>Update Studyboard to Keep Syncing</b><span>${esc(message || "This version has a problem with syncing, so syncing is paused to keep your work safe. Your changes are saved on this device and sync as soon as you update.")}</span></div>
        <button type="button" class="btn primary small" data-act="sb-update">${native() || (typeof DESK !== "undefined" && DESK) ? "Update" : "Reload"}</button>`;
    } else if (el) el.remove();
    if (was && !on) { try { syncRetryNow(); } catch (e) {} }
    if (was !== !!on) { try { syncLabel(); } catch (e) {} }
  }
  function applyPolicy(pol, fresh){
    const v = verdict(pol);
    setPaused(v.pause, v.message);
    if (fresh && v.nudge) {
      ls.set(NUDGE_KEY, v.nudgeTo);
      setTimeout(() => toast(`An update to Studyboard is ready${v.message ? ": " + v.message : "."}`, null, {label: native() || (typeof DESK !== "undefined" && DESK) ? "Update" : "Reload", fn: doUpdate}), 2500);
    }
  }
  // the last rule heard applies from the start, before the network answers (a paused version stays paused offline)
  applyPolicy(ls.json(POL_KEY), false);

  /* ---------- the daily check-in ---------- */
  let lastAt = 0, busy = false;
  async function checkin(force){
    if (quiet() || busy || document.hidden) return;
    const c = cfg(); if (!c || !c.url || !c.key) return;
    const today = todayISO(), count = ls.get(DAY_KEY) !== today;
    // the server doesn't have the check-in yet (supabase-launch.sql not run): asked again tomorrow, not every half hour
    if (ls.get(DAY_KEY + ":missing") === today && !force) return;
    if (!force && !count && Date.now() - lastAt < EVERY) return;
    busy = true;
    try {
      const args = {p_version: ver(), p_platform: platform(), p_count: count};
      let res = null;
      if (signedIn()) { const {data, error} = await sb.rpc("studyboard_checkin", args); if (!error) res = data; else if (/PGRST202|not find the function|404/i.test(String(error.code || "") + " " + String(error.message || ""))) ls.set(DAY_KEY + ":missing", today); }
      else {
        const r = await fetch(c.url.replace(/\/$/, "") + "/rest/v1/rpc/studyboard_checkin", {method: "POST", cache: "no-store",
          headers: {apikey: c.key, Authorization: "Bearer " + c.key, "Content-Type": "application/json"}, body: JSON.stringify(args)});
        if (r.ok) res = await r.json(); else if (r.status === 404) ls.set(DAY_KEY + ":missing", today);
      }
      if (res && typeof res === "object") {
        lastAt = Date.now();
        if (count) ls.set(DAY_KEY, today);
        const pol = res.policy && typeof res.policy === "object" ? res.policy : {};
        ls.set(POL_KEY, JSON.stringify(pol)); applyPolicy(pol, true);
        if (typeof res.rewards === "number") gotRewards(res.rewards);
      }
    } catch (e) {} finally { busy = false; }
    claim();
  }
  setTimeout(() => checkin(), 3000);
  setInterval(() => checkin(), 30 * 60000);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) checkin(); });

  /* ---------- invite rewards ---------- */
  // ?ref=CODE on the link someone shared: kept for 14 days, until there's an account to record it on
  try {
    const u = new URL(location.href), r = String(u.searchParams.get("ref") || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
    if (r.length === 8) {
      const via = u.searchParams.get("group") ? "group" : u.searchParams.get("deck") ? "deck" : u.searchParams.get("map") ? "map" : "link";
      if (r !== ls.get(MYREF_KEY)) ls.set(REF_KEY, JSON.stringify({code: r, via, at: Date.now()}));
      u.searchParams.delete("ref"); history.replaceState(history.state, "", u.pathname + (u.search || "") + u.hash);
    }
  } catch (e) {}
  let claiming = false;
  async function claim(){
    const p = ls.json(REF_KEY);
    if (!p || claiming || !signedIn() || quiet()) return;
    if (!(Date.now() - Number(p.at) < 14 * 864e5)) { ls.del(REF_KEY); return; }
    claiming = true;
    try { const {error} = await sb.rpc("studyboard_claim_invite", {p_code: p.code, p_via: p.via || "link", p_device: devId()}); if (!error) ls.del(REF_KEY); } catch (e) {}
    claiming = false;
  }
  function gotRewards(n){
    const had = Number(ls.get(REW_KEY));
    ls.set(REW_KEY, String(n));
    if (ls.get(REW_KEY) !== null && Number.isFinite(had) && n > had) {
      try { if (window.StudyboardPlan && StudyboardPlan.refresh) StudyboardPlan.refresh(); } catch (e) {}
      setTimeout(() => { toast("Your friends joined Studyboard, so you've earned a month of Pro free. Thanks for sharing!", null, {label: "See Invites", fn: inviteSheet}); try { celebrate("check"); } catch (e) {} }, 1500);
    }
  }
  const inviteLink = code => {
    const base = /^https?:$/.test(location.protocol) && !/^(localhost|127\.)/.test(location.hostname) ? location.origin + "/" : SITE;
    return `${base}?ref=${encodeURIComponent(code)}`;
  };
  const myFirst = () => { try { const n = String((window.SBGROUPS && SBGROUPS.myName && SBGROUPS.myName()) || ""); return n.trim().split(/\s+/)[0] || ""; } catch (e) { return ""; } };
  const dots = (n, need) => Array.from({length: need}, (_, i) => `<span class="inv-dot${i < n ? " on" : ""}" aria-hidden="true"></span>`).join("");
  async function inviteSheet(){
    if (!signedIn()) {
      openSheet(`<form class="sheet inv-sheet">${head("Invite Friends, Get Pro Free")}<div class="sheet-body">
        <p>Invite 3 friends to Studyboard. When they join from your link, you get a <b>month of Pro free</b>.</p>
        <p class="mini">Your invite link needs a free account, so we know who to thank.</p></div>
        <div class="sheet-foot"><span class="spacer"></span><button type="button" class="btn primary" data-act="sb-signin">Sign In or Create Account</button></div></form>`);
      return;
    }
    openSheet(`<form class="sheet inv-sheet">${head("Invite Friends, Get Pro Free")}<div class="sheet-body"><p class="mini">Loading your invite link…</p></div></form>`);
    let d = null;
    try { const {data, error} = await sb.rpc("studyboard_my_invites", {p_device: devId()}); if (!error) d = data; } catch (e) {}
    const body = dlg.querySelector(".inv-sheet .sheet-body"); if (!body) return;
    if (!d || !d.code) { body.innerHTML = `<p>Invites aren't available right now. Check your connection and try again.</p>`; return; }
    ls.set(MYREF_KEY, d.code);
    const need = Number(d.need) || 3, toward = Math.min(need, Number(d.toward) || 0), waiting = Number(d.waiting) || 0, months = Number(d.rewards) || 0,
      capped = Number(d.year) >= (Number(d.cap) || 6), link = inviteLink(d.code);
    const until = d.promo_until ? new Date(d.promo_until) : null;
    body.innerHTML = `
      <div class="inv-hero"><div class="inv-dots" role="img" aria-label="${toward} of ${need} friends">${dots(toward, need)}</div>
        <p class="inv-count"><b>${toward} of ${need}</b> friends toward your next free month</p></div>
      <p>Share your link. When ${need} friends join Studyboard from it and come back another day, you get a <b>month of Pro free</b>. It happens on its own: no code to type.</p>
      <ul class="inv-facts">
        ${waiting ? `<li>${plural(waiting, "friend")} joined and ${waiting === 1 ? "counts" : "count"} once they come back on another day.</li>` : ""}
        ${months ? `<li>You've earned ${plural(months, "free month")} so far${until && until > new Date() ? `. Pro is on until ${esc(until.toLocaleDateString(undefined, {month: "long", day: "numeric"}))}` : ""}.</li>` : ""}
        ${capped ? `<li>You've reached the most free months for this year (${Number(d.cap) || 6}). Thanks for sharing so much!</li>` : ""}
        <li class="mini">The free month has Pro's themes and features. Studyboard AI and extra storage aren't included. Friends need their own account, made on their own device, and need to really use Studyboard.</li>
      </ul>
      <label class="f"><span class="lbl">Your Link</span><input id="invLink" readonly value="${esc(link)}"></label>`;
    const foot = document.createElement("div"); foot.className = "sheet-foot";
    foot.innerHTML = `<button type="button" class="btn" id="invCopy">Copy Link</button><span class="spacer"></span><button type="button" class="btn primary" id="invShare">Share Link</button>`;
    body.after(foot);
    const text = `${myFirst() ? myFirst() + " invited you to" : "Join me on"} Studyboard, the free student planner with flashcards, quizzes and study groups. It keeps your deadlines, grades and studying in one place.`;
    foot.querySelector("#invCopy").onclick = async () => { try { await navigator.clipboard.writeText(link); toast("Link Copied"); } catch (e) { const i = $("#invLink"); if (i) { i.select(); document.execCommand && document.execCommand("copy"); toast("Link Copied"); } } };
    foot.querySelector("#invShare").onclick = async () => {
      if (navigator.share) { try { await navigator.share({title: "Studyboard", text, url: link}); return; } catch (e) { if (e && e.name === "AbortError") return; } }
      try { await navigator.clipboard.writeText(text + " " + link); toast("Invite Copied"); } catch (e) {}
    };
  }
  // links other parts of the app share (group invites, decks) carry your code once you've opened Invite Friends
  window.SBINVITE = {open: inviteSheet, myCode: () => ls.get(MYREF_KEY) || "", checkin: () => checkin(true), claim, verdict, cmp};
  // fetch your code quietly once signed in, so the first group invite already carries it
  setTimeout(async () => { if (!ls.get(MYREF_KEY) && signedIn() && !quiet()) { try { const {data} = await sb.rpc("studyboard_my_invites", {p_device: devId()}); if (data && data.code) ls.set(MYREF_KEY, data.code); } catch (e) {} } }, 8000);

  hook("menu", () => `<button data-act="invite-friends" data-group="app"><span>Invite Friends, Get Pro Free<span class="sub">3 friends join from your link and you get a month of Pro</span></span></button>`);

  /* ---------- What's New ---------- */
  // Newest first. Each: [title, one sentence, optional {label, act}]. Add an entry under the new version when you release.
  const NOTES = {
    "1.15.8": [
      ["Invite Friends, Get Pro Free", "Share your link: when 3 friends join, you get a month of Pro.", {label: "Invite Friends", act: "invite-friends"}],
      ["Quizzes That Fit Your Field", "Exam styles for your major (USMLE, NCLEX, CPA, the Bar and more), and several question formats at once."],
      ["Your Own Order", "Drag Concept Maps, Presentations and Writing cards into the order you like."]
    ]
  };
  const isNewcomer = () => { try { return !tasksArr().length && !decksArr().length; } catch (e) { return true; } };
  function whatsNewDue(){
    const v = ver(), seen = ls.json(NEW_KEY) || {}, notes = NOTES[v];
    if (!notes || seen.v === v) return null;
    if (!seen.v && isNewcomer()) { ls.set(NEW_KEY, JSON.stringify({v})); return null; }   // a brand-new student has nothing to compare with
    return notes;
  }
  function whatsNew(notes){
    ls.set(NEW_KEY, JSON.stringify({v: ver()}));
    openSheet(`<form class="sheet wn-sheet">${head("What's New in Studyboard")}<div class="sheet-body"><ul class="wn-list">${notes.map(n => `<li><b>${esc(n[0])}</b><span>${esc(n[1])}</span>${n[2] ? `<button type="button" class="link-btn" data-act="${esc(n[2].act)}">${esc(n[2].label)}</button>` : ""}</li>`).join("")}</ul>
      <p class="mini">Version ${esc(ver())}</p></div><div class="sheet-foot"><span class="spacer"></span><button type="button" class="btn primary" data-act="close">Got It</button></div></form>`);
    const done = () => { dlg.removeEventListener("close", done); setTimeout(() => fire("good-moment", "whats-new"), 600); };
    dlg.addEventListener("close", done);
  }
  // when nothing else is on screen: no open sheet, no onboarding, the page visible; tried for up to a minute
  let tries = 0;
  function maybeWhatsNew(){
    // tests and the design previews never get it (a browser driven by a test says so in navigator.webdriver), unless a test asks
    if ((quiet() || navigator.webdriver) && !window.__SB_WHATSNEW_TEST) return;
    const notes = whatsNewDue(); if (!notes) return;
    const busyNow = document.hidden || document.querySelector("dialog[open]") || document.querySelector(".ob-wrap, .tour-pop, #sbUpd");
    if (busyNow) { if (++tries < 12) setTimeout(maybeWhatsNew, 5000); return; }
    whatsNew(notes);
  }
  setTimeout(maybeWhatsNew, 4000);
  if (window.__SB_TEST) window.__sbLaunch = {whatsNewDue, maybeWhatsNew, applyPolicy, NOTES};

  hook("act", act => {
    if (act === "sb-update") { doUpdate(); return true; }
    if (act === "invite-friends") { const go = () => inviteSheet(); if (dlg.open) { dlg.close(); setTimeout(go, 40); } else go(); return true; }
    return false;
  });
})();
