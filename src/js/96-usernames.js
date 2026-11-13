/* ===== module: 96-usernames.js ===== */
/* Usernames */
(() => {
  /*UNAME-START*/
  const UNAME = (() => {
    const WORDS = [["fuck",0],["fuk",1],["fck",1],["fuq",1],["shit",0],["sht",1],["bitch",0],["biatch",0],["bastard",0],["cunt",0],["twat",0],["wank",0],["bollock",0],["prick",1],["dick",1],["dik",1],["cock",1],["cok",1],["pussy",0],["puss",1],["penis",0],["vagina",0],["anal",1],["anus",1],["ass",1],["arse",1],["asshole",0],["arsehole",0],["tits",1],["titty",0],["titties",0],["boob",0],["cum",1],["cumshot",0],["jizz",0],["semen",0],["dildo",0],["vibrator",0],["blowjob",0],["handjob",0],["rimjob",0],["porn",0],["xxx",0],["sex",1],["sexy",1],["horny",0],["nude",1],["nudes",1],["naked",0],["milf",0],["dilf",0],["hentai",0],["orgasm",0],["orgy",0],["incest",0],["pedo",0],["paedo",0],["pedophile",0],["molest",0],["rape",1],["rapist",1],["raping",0],["slut",0],["whore",0],["hoe",1],["skank",0],["thot",1],["nigger",0],["nigga",0],["nigg",0],["negro",0],["chink",0],["gook",1],["spic",1],["spick",1],["kike",1],["wetback",0],["beaner",0],["coon",1],["jigaboo",0],["raghead",0],["towelhead",0],["sandnigger",0],["paki",1],["gypsy",1],["tranny",0],["shemale",0],["faggot",0],["fagot",0],["fag",1],["fags",1],["dyke",1],["homo",1],["retard",0],["retarded",0],["tard",1],["spaz",1],["mong",1],["nazi",0],["hitler",0],["heil",1],["kkk",0],["isis",1],["jihad",0],["terrorist",0],["killyourself",0],["kys",1],["suicide",0],["cocaine",0],["heroin",1],["meth",1],["crackhead",0],["phuck",0],["phuk",0],["fvck",0],["dickhead",0],["dickface",0],["dicksuck",0],["cocksuck",0],["fatass",0],["dumbass",0],["jackass",0],["smartass",0],["asshat",0],["asswipe",0],["assface",0],["butthole",0],["buttplug",0],["bukkake",0],["gangbang",0],["creampie",0],["deepthroat",0],["motherfuck",0],["fuckface",0],["shithead",0],["bullshit",0],["douche",0],["scumbag",0]];
    const ALLOW = ["scunthorpe","shiitake","torpedo","pedometer","montenegro","swank","therapist","cockatoo","cocktail","peacock","hancock","hitchcock","dickens","dickinson","analys","classic","grape","drape"];
    const RESERVED = /^(studyboard|studioso|admin|administrator|root|support|help|helpdesk|moderator|mod|mods|staff|official|team|system|owner|security|billing|account|accounts|null|undefined|anonymous|anon|deleted|everyone|here|me|you|user|username|test|guest|api|www|mail|email|privacy|terms|flashcards|quizzes|settings|login|signin|signup|register)$/;
    const MAP = {"0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "8": "b", "9": "g", "@": "a", "$": "s", "!": "i", "|": "l"};
    const letters = s => String(s || "").toLowerCase().replace(/[013457893@$!|]/g, c => MAP[c] || c);
    const squeeze = s => s.replace(/(.)\1+/g, "$1");
    // What's wrong with a name (the same messages as the server), or "" when it looks fine
    function problem(name){
      const n = String(name || "").trim();
      if (n.length < 3) return "Use at least 3 characters.";
      if (n.length > 20) return "Use at most 20 characters.";
      if (!/^[A-Za-z][A-Za-z0-9_.]*$/.test(n)) return "Start with a letter, and use only letters, numbers, _ and .";
      if (/[_.]{2}/.test(n) || /[_.]$/.test(n)) return "Don't put _ or . next to each other or at the end.";
      const l = n.toLowerCase();
      if (RESERVED.test(l) || /^(studyboard|studioso)/.test(l) || /(studyboard|studioso)$/.test(l)) return "That name is reserved. Pick another.";
      let joined = letters(l.replace(/[_.]/g, ""));
      ALLOW.forEach(a => { joined = joined.split(a).join("_"); });
      const parts = letters(l.replace(/[_.]+/g, " ")).split(" "), sq = parts.map(squeeze);
      for (const [w, whole] of WORDS) {
        const noDouble = squeeze(w) === w;
        if (whole ? (parts.includes(w) || joined === w || (noDouble && sq.includes(w)))
                  : (joined.includes(w) || (noDouble && w.length >= 4 && squeeze(joined).includes(w)))) return "That name isn't allowed. Pick another.";
      }
      return "";
    }
    return {problem, WORDS, ALLOW};
  })();
  /*UNAME-END*/

  const KEY = uid => "studyboard:uname:" + uid;
  const who = () => (window.__sbGroupsStub && window.__sbGroupsStub.user) || sbUser;
  const cached = () => { try { const u = who(); return u ? localStorage.getItem(KEY(u.id)) || "" : ""; } catch (e) { return ""; } };
  const keep = n => { try { const u = who(); if (u) localStorage.setItem(KEY(u.id), n); } catch (e) {} };
  const live = () => !inPreview() && (!!window.__sbShareStub || !!sb) && !!who() && !who().is_anonymous;
  const rpcErr = e => { const m = String((e && (e.message || e.details)) || e || ""); return /Could not find the function|schema cache|does not exist/i.test(m) ? srvSetup("Usernames", "supabase-usernames.sql") : m.replace(/^SB_[A-Z_]+:\s*/, ""); };
  async function call(fn, args){ if (window.__sbShareStub) return window.__sbShareStub(fn, args || {}); const {data, error} = await sb.rpc(fn, args || {}); if (error) throw error; return data; }

  // Live check under a username box
  function wireCheck(input, msg){
    let t = 0, seq = 0;
    const run = async () => {
      const v = input.value.trim(), my = ++seq, p = UNAME.problem(v);
      input.setAttribute("aria-invalid", p ? "true" : "false");
      if (!v) { msg.textContent = ""; msg.className = "mini un-msg"; return; }
      if (p) { msg.textContent = p; msg.className = "mini un-msg bad"; return; }
      if (!sb && !window.__sbShareStub) { msg.textContent = "Looks good."; msg.className = "mini un-msg good"; return; }
      msg.textContent = "Checking…"; msg.className = "mini un-msg";
      try { const r = (await call("username_check", {p_name: v}) || [])[0]; if (my !== seq) return;
        if (r && r.ok) { msg.textContent = `@${v} is free.`; msg.className = "mini un-msg good"; } else { msg.textContent = (r && r.reason) || "That name isn't available."; msg.className = "mini un-msg bad"; } }
      catch (e) { if (my === seq) { msg.textContent = "Couldn't check right now."; msg.className = "mini un-msg"; } }
    };
    input.addEventListener("input", () => { input.value = input.value.replace(/\s+/g, "").slice(0, 20); clearTimeout(t); t = setTimeout(run, 300); });
    return run;
  }
  const field = (name, value, hint) => `<label class="f"><span class="lh">Username ${REQ}${hint ? ` <span class="hint">${esc(hint)}</span>` : ""}</span>
    <span class="un-wrap"><span class="un-at" aria-hidden="true">@</span><input type="text" name="${name}" id="unIn" required maxlength="20" autocomplete="username" autocapitalize="none" spellcheck="false" value="${esc(value || "")}" data-noenter></span></label>
    <p class="mini un-msg" id="unMsg" aria-live="polite"></p>`;

  // Pick or change your username
  function sheet(then, opts){
    const o = opts || {}, cur = cached();
    openSheet(`<form class="sheet un-sheet">${head(cur ? "Your Username" : "Pick a Username")}<div class="sheet-body">
      ${o.why ? `<p style="margin:0">${esc(o.why)}</p>` : ""}${field("username", cur || o.suggest || "")}
      <p class="mini" style="margin:0">3 to 20 characters: letters, numbers, _ and . , starting with a letter. Names with rude or hateful words aren't allowed.</p></div>
      <div class="sheet-foot"><span class="spacer"></span><button type="button" class="btn" data-act="close">${cur ? "Cancel" : "Later"}</button><button type="submit" class="btn primary" data-submit id="unSave">Save</button></div></form>`, fd => {
      const v = String(fd.get("username") || "").trim(), p = UNAME.problem(v);
      if (p) { $("#unMsg").textContent = p; $("#unMsg").className = "mini un-msg bad"; return false; }
      const b = $("#unSave"); if (b) b.disabled = true;
      call("set_username", {p_name: v}).then(n => { keep(String(n || v)); if (dlg.open) dlg.close(); toast(`Your username is @${n || v}`); scheduleRender(); if (then) setTimeout(() => then(String(n || v)), 0); })
        .catch(e => { if (b) b.disabled = false; const m = $("#unMsg"); if (m) { m.textContent = rpcErr(e); m.className = "mini un-msg bad"; } });
      return false;
    });
    const run = wireCheck($("#unIn"), $("#unMsg")); if ((cur || o.suggest) && !cur) run();
    setTimeout(() => { const i = $("#unIn"); if (i) i.focus(); }, 60);
  }
  /* Birthday: accounts are for people 13 and older */
  const AKEY = uid => "studyboard:age:" + uid;
  const ageCached = () => { try { const u = who(); return u ? localStorage.getItem(AKEY(u.id)) || "" : ""; } catch (e) { return ""; } };
  const ageKeep = v => { try { const u = who(); if (u) localStorage.setItem(AKEY(u.id), v); } catch (e) {} };
  const yearsOld = iso => { const b = new Date(iso + "T12:00:00"), n = new Date(); let a = n.getFullYear() - b.getFullYear(); if (n.getMonth() < b.getMonth() || (n.getMonth() === b.getMonth() && n.getDate() < b.getDate())) a--; return a; };
  // Once someone gives a birthday under 13, this device makes no account and takes no birthday again (giving an older
  // one after being refused doesn't get around it). Kept through sign-out and the wipe after deleting an account.
  const GATE = "studyboard:agegate";
  const refused = () => { try { return !!localStorage.getItem(GATE); } catch (e) { return false; } };
  const refuse = () => { try { localStorage.setItem(GATE, String(Date.now())); } catch (e) {} };
  const NO_ACCOUNT = "Sorry, you can't make a Studyboard account. You can keep using Studyboard on this device without one.";
  // One date box; bdayOf returns YYYY-MM-DD, or "" when it isn't a real date
  const bdayField = why => {
    const t = new Date(), iso = d => d.toISOString().slice(0, 10);
    return `<label class="f bday"><span class="lh">Birthday ${REQ}${why ? ` <span class="hint">Asked once so the right age rules apply. Nobody else sees it.</span>` : ""}</span><input type="date" name="bday" required min="${iso(new Date(Date.UTC(t.getFullYear() - 100, 0, 1)))}" max="${iso(t)}" autocomplete="bday"></label>`;
  };
  const bdayOf = fd => {
    const v = String(fd.get("bday") || "").trim(), m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
    if (!m) return "";
    const dt = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
    if (dt.getUTCDate() !== Number(m[3]) || dt > new Date() || Number(m[1]) < new Date().getFullYear() - 120) return "";
    return v;
  };
  // my_age: a number of years, null when no birthday is saved, undefined when it couldn't be asked (offline, or a server
  // without supabase-usernames.sql): then nothing is decided now
  async function ageNow(){ try { const a = await call("my_age"); return typeof a === "number" ? a : a === null ? null : undefined; } catch (e) { return undefined; } }
  const isUnder13 = e => /SB_UNDER13/.test(String((e && (e.message || e.details)) || e || ""));
  const PENDING = "studyboard:agegate:pending";   // accounts refused here whose deletion hasn't finished yet
  const pending = () => { try { return JSON.parse(localStorage.getItem(PENDING) || "[]"); } catch (e) { return []; } };
  const setPending = (id, on) => { try { const l = pending().filter(x => x !== id); if (on) l.push(id); if (l.length) localStorage.setItem(PENDING, JSON.stringify(l.slice(-10))); else localStorage.removeItem(PENDING); } catch (e) {} };
  function refusedSheet(note){
    openSheet(`<div class="sheet" id="ageNo">${head("No Account")}<div class="sheet-body"><p style="margin:0" role="status">${esc(NO_ACCOUNT)}</p>${note ? `<p class="mini" style="margin:0">${esc(note)}</p>` : ""}</div>
      <div class="sheet-foot"><span class="spacer"></span><button type="button" class="btn primary" data-act="close">OK</button></div></div>`);
  }
  // Under 13: no account. It is deleted (with what it synced), and this device signs out and remembers
  let closing = false;
  async function closeUnderage(){
    if (closing) return; closing = true;
    refuse();
    const u = who(), id = u && u.id;
    if (id) setPending(id, true);
    let gone = false;
    try { gone = !!(window.SBDEL && await SBDEL.underage()); } catch (e) {}
    if (gone) { setPending(id, false); try { localStorage.removeItem(AKEY(id)); } catch (e) {} }
    if (dlg.open) dlg.close();
    setTimeout(() => {
      refusedSheet(gone ? "" : "Studyboard couldn't finish closing the account just now. It tries again the next time Studyboard opens while you're online.");
      if (gone) dlg.addEventListener("close", () => location.reload(), {once: true});
      closing = false;
    }, 0);
  }
  // A signed-in account with no birthday: asked once, and it can't be skipped (Not Now signs out)
  function askBirthday(then){
    let answered = false;
    openSheet(`<form class="sheet" id="ageAsk">${head("When's Your Birthday?")}<div class="sheet-body"><p style="margin:0">We ask everyone once when they use an account. Nobody else sees it, and it can't be changed later.</p>${bdayField()}<p class="mini un-msg bad" id="bdMsg" aria-live="polite"></p></div>
      <div class="sheet-foot"><button type="button" class="btn" id="bdLater">Sign Out</button><span class="spacer"></span><button type="submit" class="btn primary" data-submit id="bdSave">Continue</button></div></form>`, fd => {
      const iso = bdayOf(fd); if (!iso) { $("#bdMsg").textContent = "Enter your birthday."; return false; }
      answered = true;
      if (refused() || yearsOld(iso) < 13) { closeUnderage(); return false; }
      const b = $("#bdSave"); if (b) b.disabled = true;
      call("set_birthdate", {p_date: iso}).then(age => { ageKeep("ok"); if (dlg.open) dlg.close(); if (then) setTimeout(() => then(Number(age)), 0); })
        .catch(e => { if (isUnder13(e)) { closeUnderage(); return; } answered = false; if (b) b.disabled = false; $("#bdMsg").textContent = rpcErr(e); });
      return false;
    });
    const form = dlg.querySelector("#ageAsk");
    const later = $("#bdLater"); if (later) later.addEventListener("click", () => { answered = true; leave(); });
    // closed any other way without an answer: signed out too
    // (if another sheet took its place, it is asked again next time instead)
    dlg.addEventListener("close", function onClose(){ dlg.removeEventListener("close", onClose); if (!answered && form && dlg.contains(form)) leave(); });
  }
  // Signing out quietly, after unsent changes are given a few seconds to reach the account
  async function leave(){
    try { if (typeof flushOutbox === "function") await Promise.race([flushOutbox(), new Promise(r => setTimeout(r, 6000))]); } catch (e) {}
    try { sbLeave(); } catch (e) {}
    try { await sb.auth.signOut(); } catch (e) {}
    try { await wipeDeviceData(); } catch (e) {}
    location.reload();
  }
  // Every signed-in account: a birthday on file and 13 or older, else no account. done(true) once it's known to be fine
  async function gate(done){
    const fin = v => { if (done) done(v); };
    if (ageCached() === "ok") { fin(true); return; }
    const u = who(), id = u && u.id;
    if (!id) { fin(false); return; }
    const a = await ageNow();
    if (a === undefined) { fin(true); return; }   // can't tell now; asked again next time
    if (typeof a === "number") { if (a >= 13) { ageKeep("ok"); setPending(id, false); fin(true); } else { fin(false); closeUnderage(); } return; }
    // No birthday saved yet
    const newAcct = Date.now() - Date.parse(u.created_at || 0) < 30 * 60 * 1000;
    if (refused()) {
      // refused on this device: an account made just now (or one already being closed) is closed; an older one signs out
      fin(false);
      if (newAcct || pending().includes(id)) closeUnderage();
      else { refusedSheet("If this is your account and you're 13 or older, contact Studyboard support."); dlg.addEventListener("close", () => leave(), {once: true}); }
      return;
    }
    const bd = String(((u.user_metadata || {}).birth_date) || "");
    if (/^\d{4}-\d{2}-\d{2}$/.test(bd)) {   // given on the sign-up form
      try { await call("set_birthdate", {p_date: bd}); ageKeep("ok"); fin(true); return; }
      catch (e) { if (isUnder13(e)) { fin(false); closeUnderage(); return; } }
    }
    askBirthday(age => fin(age >= 13));
  }
  // One check per account at a time: syncing waits on it (nothing is uploaded before the age is known), and so do the
  // first-sign-in steps and publishing. Resolves true when the account may be used, false when it may not
  let gateRun = null, gateFor = "";
  function ageReady(){
    const u = who();
    if (!u || u.is_anonymous) return Promise.resolve(!!u);
    if (ageCached() === "ok") return Promise.resolve(true);
    if (gateRun && gateFor === u.id) return gateRun;
    gateFor = u.id;
    return (gateRun = new Promise(r => gate(r)));
  }
  // Publishing needs it too (an account that hasn't been asked yet, say it was offline when it signed in)
  function ensureAge(then){ ageReady().then(ok => { if (ok) then(); }); }

  // Something needs a username (publishing)
  async function ensure(then){
    if (!live()) { toast("Sign in first."); return; }
    const c = cached(); if (c) { then(c); return; }
    let n = "";
    try { n = await call("my_username"); } catch (e) { toast(rpcErr(e)); return; }
    if (n) { keep(n); then(n); return; }
    sheet(then);
  }
  // After signing in
  let asked = "";
  async function afterSignIn(){
    if (!live() || asked === who().id) return;
    asked = who().id;
    const fine = await ageReady();   // (usually already asked: syncing starts with it)
    if (!fine || cached()) return;
    let n = "";
    try { n = await call("my_username"); } catch (e) { return; }
    if (n) { keep(n); return; }
    const want = String(((who().user_metadata || {}).username) || "").trim();
    // Otherwise a username is asked for the first time it's needed (publishing)
    if (want && !UNAME.problem(want)) { try { const got = await call("set_username", {p_name: want}); keep(String(got || want)); scheduleRender(); } catch (e) {} }
  }
  let seen = "";
  hook("render", () => { const u = who() && who().id; if (!u || u === seen) return; seen = u; setTimeout(afterSignIn, 0); });

  // Settings > Account
  // One Profile row: the display name groups see and the @username on published pages are changed together (80-groups.js nameSheet)
  const gName = () => { try { return localStorage.getItem("sb:grpName:" + who().id) || ""; } catch (e) { return ""; } };
  const prof = () => window.SBGROUPS && SBGROUPS.share && SBGROUPS.share.profile;
  hook("menu", () => live() ? `<button data-act="un-edit" data-group="account"><span>${prof() ? "Profile" : "Username"}<span class="sub">${prof() ? esc([gName() || "No display name yet", cached() ? "@" + cached() : "no username yet"].join(" \u00b7 ")) : cached() ? "@" + esc(cached()) : "Not picked yet"}</span></span></button>` : "");
  hook("act", act => { if (act !== "un-edit") return false; if (dlg.open) dlg.close(); setTimeout(() => prof() ? prof()() : sheet(null), 0); return true; });

  const css = document.createElement("style");
  css.textContent = `
.un-wrap{display:flex;align-items:stretch}
.un-at{display:flex;align-items:center;padding:0 10px;border:1px solid var(--line);border-right:0;border-radius:10px 0 0 10px;background:var(--soft);color:var(--muted);font-weight:700}
.un-wrap input{border-top-left-radius:0!important;border-bottom-left-radius:0!important;flex:1;min-width:0}
.un-msg{margin:4px 0 0!important;min-height:1.2em}
.un-msg.bad{color:var(--late)}
.un-msg.good{color:var(--leaf, #1E9E74)}
.bday input{min-width:0;max-width:240px}
.u13{display:flex;flex-direction:column;gap:8px;padding:10px 12px;border:1px solid var(--line);border-radius:10px;background:var(--soft)}
`;
  document.head.appendChild(css);
  const save = v => call("set_username", {p_name: v}).then(n => { keep(String(n || v)); return String(n || v); }, e => { throw new Error(rpcErr(e)); });
  window.SBUNAME = {problem: UNAME.problem, live, save, ensure, sheet, field, wireCheck, cached, ensureAge, ageCached, bdayField, bdayOf, yearsOld, refused, refuse, NO_ACCOUNT, ageReady, T: {UNAME}};
})();

