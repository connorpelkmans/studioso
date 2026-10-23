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
      catch (e) { if (my === seq) { msg.textContent = "Looks good."; msg.className = "mini un-msg good"; } }
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
  /* Birthday */
  const AKEY = uid => "studyboard:age:" + uid;
  const ageCached = () => { try { const u = who(); return u ? localStorage.getItem(AKEY(u.id)) || "" : ""; } catch (e) { return ""; } };
  const ageKeep = v => { try { const u = who(); if (u) localStorage.setItem(AKEY(u.id), v); } catch (e) {} };
  const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const yearsOld = iso => { const b = new Date(iso + "T12:00:00"), n = new Date(); let a = n.getFullYear() - b.getFullYear(); if (n.getMonth() < b.getMonth() || (n.getMonth() === b.getMonth() && n.getDate() < b.getDate())) a--; return a; };
  // Month, day and year boxes; returns the date as YYYY-MM-DD, or "" when it isn't a real date
  const bdayField = () => {
    const y = new Date().getFullYear();
    return `<fieldset class="f bday"><legend class="lh">Birthday ${REQ}</legend><div class="bday-row">
      <select name="bm" aria-label="Month"><option value="">Month</option>${MONTHS.map((m, i) => `<option value="${i + 1}">${m}</option>`).join("")}</select>
      <select name="bd" aria-label="Day"><option value="">Day</option>${Array.from({length: 31}, (_, i) => `<option>${i + 1}</option>`).join("")}</select>
      <select name="by" aria-label="Year"><option value="">Year</option>${Array.from({length: 100}, (_, i) => `<option>${y - i}</option>`).join("")}</select></div></fieldset>`;
  };
  const bdayOf = fd => {
    const m = Number(fd.get("bm")), d = Number(fd.get("bd")), y = Number(fd.get("by"));
    if (!m || !d || !y) return "";
    const dt = new Date(Date.UTC(y, m - 1, d)); if (dt.getUTCMonth() !== m - 1 || dt > new Date()) return "";
    return dt.toISOString().slice(0, 10);
  };
  function youngSheet(){
    openSheet(`<div class="sheet">${head("Not Available Yet")}<div class="sheet-body"><p style="margin:0">Publishing and sharing with a link are for students 13 and older. Everything else in Studyboard works as usual, and you can still share with your study groups.</p></div>
      <div class="sheet-foot"><span class="spacer"></span><button type="button" class="btn primary" data-act="close">OK</button></div></div>`);
  }
  // Publishing needs a birthday on the account and an age of 13 or older
  async function ensureAge(then){
    const c = ageCached();
    if (c === "ok") { then(); return; }
    if (c === "young") { youngSheet(); return; }
    let a = null;
    try { a = await call("my_age"); } catch (e) { then(); return; }
    if (a != null) { ageKeep(a >= 13 ? "ok" : "young"); if (a >= 13) then(); else youngSheet(); return; }
    openSheet(`<form class="sheet">${head("When's Your Birthday?")}<div class="sheet-body">${bdayField()}<p class="mini" style="margin:0">It can't be changed later, and nobody else sees it.</p><p class="mini un-msg bad" id="bdMsg" aria-live="polite"></p></div>
      <div class="sheet-foot"><span class="spacer"></span><button type="button" class="btn" data-act="close">Cancel</button><button type="submit" class="btn primary" data-submit id="bdSave">Continue</button></div></form>`, fd => {
      const iso = bdayOf(fd); if (!iso) { $("#bdMsg").textContent = "Pick your whole birthday."; return false; }
      const b = $("#bdSave"); if (b) b.disabled = true;
      call("set_birthdate", {p_date: iso}).then(age => { const ok2 = Number(age) >= 13; ageKeep(ok2 ? "ok" : "young"); if (dlg.open) dlg.close(); setTimeout(() => ok2 ? then() : youngSheet(), 0); })
        .catch(e => { if (b) b.disabled = false; $("#bdMsg").textContent = rpcErr(e); });
      return false;
    });
  }

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
    if (dlg.open || document.querySelector("dialog[open]")) { setTimeout(afterSignIn, 4000); return; }
    asked = who().id;
    const bd = String(((who().user_metadata || {}).birth_date) || "");
    if (/^\d{4}-\d{2}-\d{2}$/.test(bd) && !ageCached()) { try { const a = await call("my_age"); if (a == null) { const got = await call("set_birthdate", {p_date: bd}); ageKeep(Number(got) >= 13 ? "ok" : "young"); } else ageKeep(a >= 13 ? "ok" : "young"); } catch (e) {} }
    if (cached()) return;
    let n = "";
    try { n = await call("my_username"); } catch (e) { return; }
    if (n) { keep(n); return; }
    const want = String(((who().user_metadata || {}).username) || "").trim();
    if (want && !UNAME.problem(want)) { try { const got = await call("set_username", {p_name: want}); keep(String(got || want)); scheduleRender(); return; } catch (e) {} }
    if (window.SBOB && SBOB.pending && SBOB.pending()) { asked = ""; setTimeout(afterSignIn, 15000); return; }
    sheet(null, want ? {suggest: want, why: `@${want} is taken. Pick another.`} : {});
  }
  let seen = "";
  hook("render", () => { const u = who() && who().id; if (!u || u === seen) return; seen = u; setTimeout(afterSignIn, 1500); });

  // Settings > Account
  hook("menu", () => live() ? `<button data-act="un-edit" data-group="account"><span>Username<span class="sub">${cached() ? "@" + esc(cached()) : "Not picked yet"}</span></span></button>` : "");
  hook("act", act => { if (act !== "un-edit") return false; if (dlg.open) dlg.close(); setTimeout(() => sheet(null), 0); return true; });

  const css = document.createElement("style");
  css.textContent = `
.un-wrap{display:flex;align-items:stretch}
.un-at{display:flex;align-items:center;padding:0 10px;border:1px solid var(--line);border-right:0;border-radius:10px 0 0 10px;background:var(--soft);color:var(--muted);font-weight:700}
.un-wrap input{border-top-left-radius:0!important;border-bottom-left-radius:0!important;flex:1;min-width:0}
.un-msg{margin:4px 0 0!important;min-height:1.2em}
.un-msg.bad{color:var(--late)}
.un-msg.good{color:var(--leaf, #1E9E74)}
.bday{border:0;padding:0;margin:0}
.bday-row{display:grid;grid-template-columns:1.4fr 1fr 1.1fr;gap:8px}
.bday-row select{min-width:0}
.u13{display:flex;flex-direction:column;gap:8px;padding:10px 12px;border:1px solid var(--line);border-radius:10px;background:var(--soft)}
`;
  document.head.appendChild(css);
  window.SBUNAME = {problem: UNAME.problem, ensure, sheet, field, wireCheck, cached, ensureAge, ageCached, bdayField, bdayOf, yearsOld, T: {UNAME}};
})();

