/* ===== module: 96-classmates.js ===== */
/* Classmates: who else in your synced courses uses Studyboard, and one Course Hub (a shared study group) per course.
   The server side is supabase-classmates.sql. Off until the student turns it on. */
(() => {
  /*CM-START*/
  const CM_SITES = {bs: "Brightspace", cv: "Canvas", bb: "Blackboard", md: "Moodle", sg: "Schoology", gc: "Google Classroom"};
  const CM_FIXED = {gc: "https://classroom.google.com"};   // Classroom has one address for everyone
  // The courses the server can match, from courses synced from a school site: [{ref, platform, origin, ou, label}]
  // ref is the course's id in this app; origin is the school site's address (from the course's link to it); ou is the site's own id
  function cmPayload(courses){
    const out = [], seen = new Set();
    (courses || []).forEach(c => {
      if (!c || c.archived || !c.id || seen.has(String(c.id))) return;
      for (const f of Object.keys(CM_SITES)) {
        const L = c[f], ou = L && L.ou != null ? String(L.ou).trim() : "";
        if (!ou || ou.length > 120) continue;
        let origin = "";
        const link = (c.links || []).find(l => l && l.label === CM_SITES[f] && /^https:\/\//i.test(String(l.url || "")));
        if (link) { try { origin = new URL(link.url).origin; } catch (e) { origin = ""; } }
        if (!origin) origin = CM_FIXED[f] || "";
        if (!/^https:\/\/[A-Za-z0-9.-]+(:\d+)?$/.test(origin)) continue;
        seen.add(String(c.id));
        out.push({ref: String(c.id).slice(0, 80), platform: f, origin, ou, label: String(c.code || c.name || "").trim().slice(0, 80)});
        break;
      }
    });
    return out.slice(0, 40);
  }
  const cmSig = list => JSON.stringify((list || []).map(x => [x.ref, x.platform, x.origin.toLowerCase(), x.ou, x.label]));
  /*CM-END*/

  /* Connection (the Study Groups test stand-in works here too) */
  const stub = () => window.__sbGroupsStub || null;
  const cli = () => { const s = stub(); return s ? s.client : (typeof sbActive === "function" && sbActive() ? sb : null); };
  const uidNow = () => { const s = stub(); return s ? (s.user && s.user.id) || "" : (typeof sbUser !== "undefined" && sbUser ? sbUser.id : ""); };
  const missingFn = e => { const m = String((e && (e.message || e.details)) || ""), c = String((e && e.code) || ""); return ["42883", "PGRST202", "42P01"].includes(c) || /Could not find the function|schema cache|does not exist/i.test(m); };
  const clean = e => String((e && (e.message || e.details)) || e || "").replace(/^SB_[A-Z0-9_]+:\s*/, "").slice(0, 200) || "Something went wrong. Try again.";
  async function call(name, args){
    const c = cli(); if (!c) throw new Error("Sign in to Studyboard first.");
    let r; try { r = await c.rpc(name, args || {}); } catch (e) { throw Object.assign(new Error(/fetch|network|Load failed/i.test(String(e && e.message)) ? "Couldn't reach Studyboard. Check your connection and try again." : clean(e)), {net: true}); }
    if (r && r.error) { const err = new Error(clean(r.error)); err.raw = String(r.error.message || ""); err.setup = missingFn(r.error); throw err; }
    return r ? r.data : null;
  }

  /* What we know */
  const S = {uid: "", me: null, rows: null, at: 0, busy: null, setup: false, sentSig: "", sentAt: 0, names: {}};
  const LSK = k => "studyboard:cm:" + k + ":" + uidNow();
  const lsGet = k => { try { return localStorage.getItem(LSK(k)); } catch (e) { return null; } };
  const lsSet = (k, v) => { try { if (v == null) localStorage.removeItem(LSK(k)); else localStorage.setItem(LSK(k), v); } catch (e) {} };
  const mine = () => cmPayload(typeof coursesArr === "function" ? coursesArr() : []);
  const onCoursePage = () => typeof ui !== "undefined" && ui.tab === "courses" && !!ui.courseId;
  const DAY = 864e5;

  function reset(){ Object.assign(S, {uid: uidNow(), me: null, rows: null, at: 0, busy: null, setup: false, sentSig: "", sentAt: 0, names: {}}); }
  // Ask the server again (at most once a minute unless forced); sends the course list when it changed or once a day
  function refresh(force){
    if (!cli() || S.setup) return Promise.resolve();
    if (S.uid !== uidNow()) reset();
    if (S.busy) return S.busy;
    if (!force && S.at && Date.now() - S.at < 60000) return Promise.resolve();
    S.busy = (async () => {
      try {
        S.me = (await call("classmates_me")) || {visible: false, band: null};
        if (S.me.visible) {
          const list = mine(), sig = cmSig(list);
          if (force || sig !== S.sentSig || Date.now() - S.sentAt > DAY) {
            try { await call("classmates_sync", {p_courses: list}); S.sentSig = sig; S.sentAt = Date.now(); }
            catch (e) { if (e.setup) throw e; /* too many sends just now, or no birthday yet: the last list stands */ }
          }
          S.rows = (await call("classmates_summary")) || [];
        } else S.rows = [];
      } catch (e) {
        if (e.setup) S.setup = true;
      } finally { S.at = Date.now(); S.busy = null; }
      if (onCoursePage() || (typeof dlg !== "undefined" && dlg.open && dlg.querySelector(".mates-sheet"))) scheduleRender();
      maybeAsk();
    })();
    return S.busy;
  }

  // Once per account: after a school site sync brings in courses, a gentle offer to turn it on
  function maybeAsk(){
    if (!S.me || S.me.visible || S.setup || lsGet("asked") || !mine().length) return;
    if (typeof dlg !== "undefined" && dlg.open) return;
    lsSet("asked", "1");
    toast("See which classmates use Studyboard and study together for each course.", null, {label: "Show Me", fn: () => onSheet()});
  }

  /* The course page card */
  const IC = '<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5"/><circle cx="17" cy="9" r="2.6"/><path d="M16 14.6c2.9.2 5 2.2 5 5.4"/>';
  try { if (typeof C2_ICONS === "object" && C2_ICONS && !C2_ICONS.mates) C2_ICONS.mates = IC; } catch (e) {}
  const n1 = (n, one, many) => `${n} ${n === 1 ? one : many}`;
  function courseCard(c){
    if (!c || !cli() || S.setup) return "";
    const me = cmPayload([c])[0]; if (!me) return "";   // only courses synced from a school site
    if (S.uid !== uidNow() || !S.at || Date.now() - S.at > 10 * 60000) setTimeout(() => refresh(), 0);
    if (!S.me) return "";
    const box = (n, body) => (typeof c2Box === "function" ? c2Box("mates", "Classmates", n, body, "mates-card") : `<section class="mates-card"><h2 class="sec">Classmates</h2>${body}</section>`);
    const name = esc(me.label || c.name || "this course");
    if (!S.me.visible) return box("", `<p class="mates-txt">See which classmates in ${name} use Studyboard, and study together in one shared Course Hub.</p>
      <div class="row-actions"><button type="button" class="btn small primary" data-act="mates-on">Turn On Classmates</button></div>`);
    const r = (S.rows || []).find(x => x.ref === c.id);
    if (!r) return box("", `<p class="mates-txt mini">${S.busy ? "Checking for classmates…" : "Classmates shows up here after your next school site sync."}</p>`);
    const n = Number(r.classmates) || 0, hm = Number(r.hub_members) || 0;
    const who = n ? `<p class="mates-txt"><b>${esc(n1(n, "classmate uses", "classmates use"))} Studyboard.</b></p>` : `<p class="mates-txt">No classmates here yet. They'll show up when they turn on Classmates too.</p>`;
    const hub = r.in_hub ? `<button type="button" class="btn small primary" data-act="mates-hub-open" data-id="${esc(r.hub_id)}">Open Course Hub</button>`
      : `<button type="button" class="btn small${n ? " primary" : ""}" data-act="mates-hub-join" data-ref="${esc(r.ref)}">${r.hub_id ? "Join Course Hub" : "Start the Course Hub"}</button>`;
    const sub = r.hub_id ? `<p class="mates-txt mini">The Course Hub has ${esc(n1(hm, "member", "members"))}: shared decks, deadlines, questions and study sessions for ${name}.</p>`
      : `<p class="mates-txt mini">A Course Hub is one study group for everyone in ${name} who uses Studyboard.</p>`;
    return box(n || "", `${who}${sub}<div class="row-actions">${hub}${n ? `<button type="button" class="btn small" data-act="mates-who" data-ref="${esc(r.ref)}">See Who</button>` : ""}</div>`);
  }

  /* Sheets */
  const myName = () => { try { return window.SBGROUPS && SBGROUPS.myName ? SBGROUPS.myName() : ""; } catch (e) { return ""; } };
  function onSheet(){
    if (!cli()) { toast("Sign in to Studyboard first."); return; }
    const nm = myName();
    openSheet(`<div class="sheet mates-sheet">${head("Classmates")}<div class="sheet-body">
      <p style="margin:0">See which classmates in your courses use Studyboard, and join one shared Course Hub for each course.</p>
      <ul class="mates-points">
        <li><b>Only people who turn it on.</b> Classmates who also turned it on see your name${nm ? ` (<b>${esc(nm)}</b>)` : ""} in the courses you share. Nothing else: no email, no other courses.</li>
        <li><b>Only courses synced from your school site.</b> Studyboard keeps a scrambled code for each course, not the course or your school site.</li>
        <li><b>Same age group only.</b> People 13 to 17 only see others 13 to 17, and adults only see adults.</li>
        <li><b>Off anytime</b> in Settings. Your courses are removed right away.</li>
      </ul></div>
      <div class="sheet-foot"><button type="button" class="btn" data-act="close">Not Now</button><span class="spacer"></span><button type="button" class="btn primary" id="cmOnGo">Turn On</button></div></div>`);
    const b = $("#cmOnGo"); if (b) b.addEventListener("click", () => turnOn(b));
  }
  async function turnOn(b){
    if (b) b.disabled = true;
    const go = async () => {
      try {
        await call("classmates_set_visible", {p_on: true});
        lsSet("asked", "1");
        if (typeof dlg !== "undefined" && dlg.open) dlg.close();
        toast("Classmates is on. Checking your courses…");
        await refresh(true);
        scheduleRender();
      } catch (e) {
        if (b) b.disabled = false;
        toast(e.setup ? srvSetup("Classmates", "classmates.sql") : /SB_AGE_NEEDED/.test(e.raw || "") ? "Add your birthday first, then try again." : e.message);
      }
    };
    // A birthday is needed (it decides the age group): the app asks for it when an account hasn't given one yet
    if (window.SBUNAME && SBUNAME.ageReady) { const ok = await SBUNAME.ageReady().catch(() => true); if (!ok) { if (b) b.disabled = false; return; } }
    go();
  }
  function settingsSheet(){
    if (!S.me) { refresh(true).then(() => S.me && settingsSheet()); return; }
    if (!S.me.visible) { onSheet(); return; }
    const rows = (S.rows || []).filter(r => Number(r.classmates) > 0 || r.in_hub);
    openSheet(`<div class="sheet mates-sheet">${head("Classmates")}<div class="sheet-body">
      <p style="margin:0"><b>On.</b> Classmates who also turned it on see your name in the courses you share from your school site. People 13 to 17 and adults never see each other.</p>
      ${rows.length ? `<ul class="mates-list">${rows.map(r => `<li><b>${esc(r.label || "Course")}</b><span class="mini">${esc(n1(Number(r.classmates) || 0, "classmate", "classmates"))}${r.in_hub ? " · in its Course Hub" : ""}</span></li>`).join("")}</ul>` : `<p class="mini" style="margin:0">No classmates in your courses yet.</p>`}
      <p class="mini" style="margin:0">Turning it off removes your courses right away. Course Hubs you joined stay until you leave them.</p></div>
      <div class="sheet-foot"><button type="button" class="btn danger" id="cmOff">Turn Off</button><span class="spacer"></span><button type="button" class="btn primary" data-act="close">Done</button></div></div>`);
    const b = $("#cmOff"); if (b) b.addEventListener("click", async () => {
      b.disabled = true;
      try { await call("classmates_set_visible", {p_on: false}); S.me.visible = false; S.rows = []; S.sentSig = ""; if (dlg.open) dlg.close(); toast("Classmates is off. Your courses were removed."); scheduleRender(); }
      catch (e) { b.disabled = false; toast(e.message); }
    });
  }
  async function whoSheet(ref){
    const r = (S.rows || []).find(x => x.ref === ref); if (!r) return;
    openSheet(`<div class="sheet mates-sheet">${head(r.label ? `${r.label} Classmates` : "Classmates")}<div class="sheet-body" id="cmWho"><p class="status-msg"><span class="ai-spin" aria-hidden="true"></span> Loading…</p></div>
      <div class="sheet-foot"><button type="button" class="btn" data-act="close">Close</button><span class="spacer"></span>${r.in_hub ? `<button type="button" class="btn primary" data-act="mates-hub-open" data-id="${esc(r.hub_id)}">Open Course Hub</button>` : `<button type="button" class="btn primary" data-act="mates-hub-join" data-ref="${esc(ref)}">${r.hub_id ? "Join Course Hub" : "Start the Course Hub"}</button>`}</div></div>`);
    let list = [];
    try { list = (await call("classmates_list", {p_ref: ref})) || []; } catch (e) { const el = $("#cmWho"); if (el) el.innerHTML = `<p role="alert" style="margin:0">${esc(e.message)}</p>`; return; }
    const el = $("#cmWho"); if (!el) return;
    el.innerHTML = list.length ? `<ul class="mates-list">${list.map(m => `<li><span class="mates-av" aria-hidden="true">${esc(String(m.name || "?").trim().charAt(0).toUpperCase())}</span><b>${esc(m.name || "Classmate")}</b></li>`).join("")}</ul>
      <p class="mini" style="margin:0">Only classmates who turned on Classmates show here. Say hi in the Course Hub.</p>`
      : `<p style="margin:0">Nobody else here yet.</p>`;
  }
  async function joinHub(ref, btn){
    if (btn) btn.disabled = true;
    try {
      const gid = await call("classmates_join_hub", {p_ref: ref});
      if (dlg.open) dlg.close();
      toast("You joined the Course Hub.");
      refresh(true);
      if (gid && window.SBGROUPS && SBGROUPS.openFresh) SBGROUPS.openFresh(gid);
    } catch (e) {
      if (btn) btn.disabled = false;
      if (/SB_CM_COURSE/.test(e.raw || "")) refresh(true);
      toast(e.setup ? srvSetup("Course Hubs", "classmates.sql") : e.message);
    }
  }

  /* Wiring */
  hook("act", (act, el) => {
    if (!/^mates-/.test(act)) return false;
    if (act === "mates-on") onSheet();
    else if (act === "mates-settings") settingsSheet();
    else if (act === "mates-who") whoSheet(el.dataset.ref);
    else if (act === "mates-hub-join") joinHub(el.dataset.ref, el);
    else if (act === "mates-hub-open") { if (dlg.open) dlg.close(); if (window.SBGROUPS && SBGROUPS.openFresh) SBGROUPS.openFresh(el.dataset.id); }
    return true;
  });
  hook("menu", () => cli() && !S.setup && S.me ? `<button data-act="mates-settings" data-group="account"><span>Classmates<span class="sub">${S.me.visible ? "On: classmates in your synced courses can see your name" : "Off: see who in your courses uses Studyboard"}</span></span></button>` : "");
  // Courses change after a school site sync: send the new list (a cheap check, every minute while signed in)
  setInterval(() => { if (!cli() || S.setup || document.hidden) return; if (S.uid !== uidNow() || !S.at || (S.me && S.me.visible && cmSig(mine()) !== S.sentSig) || Date.now() - S.at > 30 * 60000) refresh(); }, 60000);
  setTimeout(() => { if (cli()) refresh(); }, 4000);

  window.SBMATES = {courseCard, refresh: () => refresh(true), state: () => S, T: {cmPayload, cmSig}};
})();
